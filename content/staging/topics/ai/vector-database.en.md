---
title: Vector Database Complete Guide
description: Master vector databases for semantic search applications
track: ai
section: rag
difficulty: intermediate
tags:
  - Vector Database
  - Pinecone
  - Milvus
  - Semantic Search
status: imported
origin: old/src/content/docs/ai/vector-database.en.md
divergence: 0.217
issues: []
legacy:
  category: AI
  subcategory: Infrastructure
  order: 11
  lastUpdated: 2026-01-07
---

## Concept Overview

A **Vector Database** is a specialized database system designed for storing, indexing, and querying high-dimensional vector data. In the era of artificial intelligence and machine learning, vector databases have become core infrastructure for building semantic search, recommendation systems, and RAG (Retrieval-Augmented Generation) applications.

### Why Do We Need Vector Databases?

Traditional databases perform queries based on exact matching, while vector databases support **similarity search** - finding the vectors most similar to a query vector. This capability makes them particularly suitable for the following scenarios:

```
+------------------------------------------------------------------+
|                    Vector Database Core Capabilities              |
+------------------------------------------------------------------+
| Semantic Search  | Understand query intent, return semantically   |
|                  | relevant results                               |
+------------------------------------------------------------------+
| Recommendation   | Recommend similar items based on user behavior |
| Systems          | vectors                                        |
+------------------------------------------------------------------+
| Image Retrieval  | Search by image, find visually similar photos  |
+------------------------------------------------------------------+
| RAG Applications | Provide relevant context for LLMs, enhance     |
|                  | generation quality                             |
+------------------------------------------------------------------+
| Anomaly Detection| Identify data points that deviate significantly|
|                  | from normal patterns                           |
+------------------------------------------------------------------+
```

### What is a Vector?

In machine learning, a vector is a numerical representation of data. Through embedding models, we can convert unstructured data like text, images, and audio into fixed-dimensional arrays of floating-point numbers:

```python
# Text vectorization example
from openai import OpenAI

client = OpenAI()

def get_embedding(text: str, model: str = "text-embedding-3-small") -> list[float]:
    """Convert text to vector"""
    response = client.embeddings.create(
        input=text,
        model=model
    )
    return response.data[0].embedding

# Example: Get vector representation of a text
text = "Vector databases are core infrastructure for building AI applications"
embedding = get_embedding(text)

print(f"Vector dimension: {len(embedding)}")  # 1536 dimensions
print(f"First 5 values: {embedding[:5]}")  # [-0.023, 0.045, -0.012, ...]
```

---

## Vector Index Algorithms

The core challenge of vector databases is how to quickly find the most similar vectors among massive amounts of vectors. Brute-force search (comparing one by one) has a time complexity of O(n), which is completely impractical for million-scale data. Therefore, Approximate Nearest Neighbor (ANN) algorithms are needed to accelerate the search.

### HNSW (Hierarchical Navigable Small World)

HNSW is currently the most popular vector indexing algorithm. It constructs a multi-layer graph structure that achieves O(log n) search complexity.

```
+------------------------------------------------------------------+
|                    HNSW Multi-Layer Graph Structure               |
+------------------------------------------------------------------+
| Layer 2 (Sparse)     O---------------O                           |
|                      |               |                            |
| Layer 1 (Middle)     O---O-------O---O                           |
|                      |   |       |   |                            |
| Layer 0 (Dense)      O-O-O-O-O-O-O-O-O                           |
|                      ^                                            |
|                   Entry Point                                     |
+------------------------------------------------------------------+
```

**How HNSW Works:**

1. **Build Phase**: Each vector is assigned to different levels probabilistically
2. **Search Phase**: Start from the highest layer, greedily find nearest neighbors, descend layer by layer
3. **Advantages**: Fast query speed, high recall rate, supports dynamic insertion

```python
# Building HNSW index with hnswlib
import hnswlib
import numpy as np

# Create index
dim = 1536  # Vector dimension
num_elements = 100000  # Number of vectors

# Initialize index
index = hnswlib.Index(space='cosine', dim=dim)

# Set index parameters
# M: Maximum connections per node, affects build speed and recall
# ef_construction: Search width during construction, higher = better quality
index.init_index(max_elements=num_elements, ef_construction=200, M=16)

# Generate sample data
data = np.random.rand(num_elements, dim).astype('float32')

# Add vectors to index
index.add_items(data, ids=np.arange(num_elements))

# Set query parameters
# ef: Search width during query, higher = better recall but slower
index.set_ef(50)

# Execute query
query_vector = np.random.rand(1, dim).astype('float32')
labels, distances = index.knn_query(query_vector, k=10)

print(f"Top 10 most similar vector IDs: {labels[0]}")
print(f"Corresponding distances: {distances[0]}")
```

### IVF (Inverted File Index)

The IVF algorithm partitions the vector space into multiple clusters (Voronoi cells), and during queries, only searches the most relevant clusters.

```
+------------------------------------------------------------------+
|                    IVF Cluster Partition Diagram                  |
+------------------------------------------------------------------+
|                                                                   |
|    +----------+     +----------+     +----------+                 |
|    | Cluster 1|     | Cluster 2|     | Cluster 3|                 |
|    |   o o    |     |   o      |     |  o o o   |                 |
|    |    o     |     |  o  o    |     |    o     |                 |
|    |   *      |     |    o     |     |   o      |                 |
|    +----------+     +----------+     +----------+                 |
|        ^                                                          |
|    Centroid 1        Centroid 2       Centroid 3                  |
|                                                                   |
|  Query Process: 1. Find the nearest nprobe centroids              |
|                 2. Search for nearest neighbors only in           |
|                    those clusters                                 |
+------------------------------------------------------------------+
```

**IVF Parameter Explanation:**

- `nlist`: Number of clusters, typically set to sqrt(n) to 4*sqrt(n)
- `nprobe`: Number of clusters to search during query, higher = better recall

```python
# Building IVF index with Faiss
import faiss
import numpy as np

dim = 1536
num_elements = 100000

# Generate sample data
data = np.random.rand(num_elements, dim).astype('float32')

# Create IVF index
nlist = 100  # Number of clusters
quantizer = faiss.IndexFlatL2(dim)  # Index for finding nearest centroids
index = faiss.IndexIVFFlat(quantizer, dim, nlist, faiss.METRIC_L2)

# Train index (requires some data to determine cluster centers)
index.train(data)

# Add vectors
index.add(data)

# Set search parameters
index.nprobe = 10  # Search 10 nearest clusters

# Execute query
query_vector = np.random.rand(1, dim).astype('float32')
distances, labels = index.search(query_vector, k=10)

print(f"Top 10 most similar vector IDs: {labels[0]}")
```

### Algorithm Comparison

| Feature | HNSW | IVF |
|---------|------|-----|
| Time Complexity | O(log n) | O(n/nlist * nprobe) |
| Space Complexity | Higher (needs to store graph structure) | Lower |
| Build Speed | Slower | Faster (requires training) |
| Dynamic Insertion | Supported | Requires retraining |
| Recall Rate | High | Depends on nprobe |
| Use Cases | High-frequency queries, dynamic data | Large-scale static data |

---

## Similarity Metrics

Choosing the right similarity metric is crucial for search quality. Different metrics are suitable for different application scenarios.

### Cosine Similarity

Measures the similarity in direction between two vectors, ignoring vector length. The value range is [-1, 1], where 1 indicates identical, -1 indicates completely opposite.

```python
import numpy as np

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Calculate cosine similarity"""
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    return dot_product / (norm_a * norm_b)

# Example
vec_a = np.array([1, 2, 3])
vec_b = np.array([2, 4, 6])  # Same direction as vec_a, different length
vec_c = np.array([-1, -2, -3])  # Opposite direction to vec_a

print(f"Cosine similarity of a and b: {cosine_similarity(vec_a, vec_b):.4f}")  # 1.0
print(f"Cosine similarity of a and c: {cosine_similarity(vec_a, vec_c):.4f}")  # -1.0
```

**Use Cases:** Text similarity, semantic search (since embedding vectors are already normalized)

### Euclidean Distance (L2)

Measures the straight-line distance between two vectors in space. Smaller values indicate greater similarity.

```python
def euclidean_distance(a: np.ndarray, b: np.ndarray) -> float:
    """Calculate Euclidean distance"""
    return np.linalg.norm(a - b)

# Or use squared distance (avoids square root operation, faster)
def squared_euclidean_distance(a: np.ndarray, b: np.ndarray) -> float:
    """Calculate squared Euclidean distance"""
    return np.sum((a - b) ** 2)

# Example
vec_a = np.array([0, 0])
vec_b = np.array([3, 4])

print(f"Euclidean distance: {euclidean_distance(vec_a, vec_b):.4f}")  # 5.0
```

**Use Cases:** Image similarity, spatial location-related searches

### Inner Product (Dot Product)

Calculates the dot product of two vectors. For normalized vectors, inner product is equivalent to cosine similarity.

```python
def inner_product(a: np.ndarray, b: np.ndarray) -> float:
    """Calculate inner product"""
    return np.dot(a, b)

# For normalized vectors
def normalize(v: np.ndarray) -> np.ndarray:
    """Normalize vector"""
    return v / np.linalg.norm(v)

vec_a = normalize(np.array([1, 2, 3]))
vec_b = normalize(np.array([2, 4, 6]))

# After normalization, inner product = cosine similarity
print(f"Inner product: {inner_product(vec_a, vec_b):.4f}")  # 1.0
```

**Use Cases:** Maximum Inner Product Search (MIPS) in recommendation systems

### Metric Selection Guide

```
+------------------------------------------------------------------+
|                  How to Choose a Similarity Metric?               |
+------------------------------------------------------------------+
|                                                                   |
|  Are vectors normalized?                                          |
|       |                                                           |
|       +-- Yes --> All three metrics are equivalent, choose        |
|       |           inner product (fastest computation)             |
|       |                                                           |
|       +-- No  --> Does vector length matter?                      |
|               |                                                   |
|               +-- Yes --> Euclidean distance                      |
|               |                                                   |
|               +-- No  --> Cosine similarity                       |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Comparison of Major Vector Databases

### Product Matrix

| Product | Type | Open Source | Managed Service | Features |
|---------|------|-------------|-----------------|----------|
| **Pinecone** | Cloud-native | No | Yes | Fully managed, out-of-the-box, enterprise-grade |
| **Milvus** | Distributed | Yes | Zilliz Cloud | High performance, feature-rich |
| **Chroma** | Embedded | Yes | No | Lightweight, suitable for local development |
| **Weaviate** | Cloud-native | Yes | Yes | Built-in vectorization, GraphQL interface |
| **Qdrant** | Distributed | Yes | Yes | Rust implementation, high performance |
| **pgvector** | Extension | Yes | Yes | Native PostgreSQL support |

### Selection Guide

```
+------------------------------------------------------------------+
|                  Vector Database Selection Decision Tree          |
+------------------------------------------------------------------+
|                                                                   |
|  Project Stage?                                                   |
|       |                                                           |
|       +-- Prototype/POC --> Chroma (zero config, runs locally)    |
|       |                                                           |
|       +-- Production                                              |
|               |                                                   |
|               +-- Already have PostgreSQL --> pgvector            |
|               |   (reuse existing infrastructure)                 |
|               |                                                   |
|               +-- Want simplicity --> Pinecone                    |
|               |   (fully managed, no ops)                         |
|               |                                                   |
|               +-- Need private deployment --> Milvus/Qdrant       |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Pinecone in Practice

Pinecone is a fully managed vector database service known for its simplicity and high availability.

### Installation and Configuration

```bash
pip install pinecone-client
```

### Creating Index and Basic Operations

```python
from pinecone import Pinecone, ServerlessSpec

# Initialize client
pc = Pinecone(api_key="your-api-key")

# Create index
index_name = "semantic-search"

pc.create_index(
    name=index_name,
    dimension=1536,  # OpenAI text-embedding-3-small dimension
    metric="cosine",
    spec=ServerlessSpec(
        cloud="aws",
        region="us-east-1"
    )
)

# Get index
index = pc.Index(index_name)

# View index stats
print(index.describe_index_stats())
```

### Data Writing and Querying

```python
import hashlib
from openai import OpenAI

openai_client = OpenAI()

def get_embedding(text: str) -> list[float]:
    """Get text vector"""
    response = openai_client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def generate_id(text: str) -> str:
    """Generate unique ID"""
    return hashlib.md5(text.encode()).hexdigest()

# Prepare data
documents = [
    {"text": "Python is an interpreted programming language", "category": "programming"},
    {"text": "Vector databases are used for storing high-dimensional vectors", "category": "database"},
    {"text": "Machine learning is a subfield of artificial intelligence", "category": "ai"},
    {"text": "Deep learning uses neural networks to process complex patterns", "category": "ai"},
]

# Batch write vectors
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

# Use upsert to write (update if exists, insert if not)
index.upsert(vectors=vectors)

# Semantic query
query_text = "What is AI?"
query_embedding = get_embedding(query_text)

results = index.query(
    vector=query_embedding,
    top_k=3,
    include_metadata=True
)

print("Query results:")
for match in results.matches:
    print(f"  Similarity: {match.score:.4f}")
    print(f"  Content: {match.metadata['text']}")
    print(f"  Category: {match.metadata['category']}")
    print()
```

### Metadata Filtering

```python
# Query results with metadata filtering
results = index.query(
    vector=query_embedding,
    top_k=5,
    include_metadata=True,
    filter={
        "category": {"$eq": "ai"}  # Only return results in AI category
    }
)

# Supported filter operators
# $eq: equals
# $ne: not equals
# $gt: greater than
# $gte: greater than or equal
# $lt: less than
# $lte: less than or equal
# $in: in list
# $nin: not in list
# $and: logical AND
# $or: logical OR

# Complex filter example
complex_filter = {
    "$and": [
        {"category": {"$in": ["ai", "database"]}},
        {"created_at": {"$gte": "2024-01-01"}}
    ]
}
```

### Namespace Isolation

```python
# Use namespaces to isolate data from different tenants
tenant_a_namespace = "tenant-a"
tenant_b_namespace = "tenant-b"

# Write to different namespaces
index.upsert(vectors=tenant_a_vectors, namespace=tenant_a_namespace)
index.upsert(vectors=tenant_b_vectors, namespace=tenant_b_namespace)

# Specify namespace when querying
results = index.query(
    vector=query_embedding,
    top_k=10,
    namespace=tenant_a_namespace  # Only search tenant A's data
)
```

---

## Milvus in Practice

Milvus is a high-performance open-source vector database that supports distributed deployment, suitable for large-scale production environments.

### Installation and Startup

```bash
# Start Milvus with Docker Compose
wget https://github.com/milvus-io/milvus/releases/download/v2.3.0/milvus-standalone-docker-compose.yml -O docker-compose.yml
docker-compose up -d

# Install Python SDK
pip install pymilvus
```

### Creating a Collection

```python
from pymilvus import (
    connections,
    utility,
    FieldSchema,
    CollectionSchema,
    DataType,
    Collection,
)

# Connect to Milvus
connections.connect("default", host="localhost", port="19530")

# Define fields
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    FieldSchema(name="text", dtype=DataType.VARCHAR, max_length=2000),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=1536),
    FieldSchema(name="category", dtype=DataType.VARCHAR, max_length=100),
]

# Create schema
schema = CollectionSchema(
    fields=fields,
    description="Document embeddings for semantic search"
)

# Create collection
collection_name = "documents"
collection = Collection(name=collection_name, schema=schema)

print(f"Collection {collection_name} created successfully")
```

### Creating an Index

```python
# Create HNSW index
index_params = {
    "metric_type": "COSINE",
    "index_type": "HNSW",
    "params": {
        "M": 16,  # Maximum connections per node
        "efConstruction": 256  # Search width during construction
    }
}

collection.create_index(
    field_name="embedding",
    index_params=index_params
)

# Or use IVF_FLAT index (suitable for larger scale data)
ivf_index_params = {
    "metric_type": "L2",
    "index_type": "IVF_FLAT",
    "params": {
        "nlist": 1024  # Number of clusters
    }
}
```

### Data Writing and Querying

```python
from openai import OpenAI
import numpy as np

openai_client = OpenAI()

def get_embeddings(texts: list[str]) -> list[list[float]]:
    """Get vectors in batch"""
    response = openai_client.embeddings.create(
        input=texts,
        model="text-embedding-3-small"
    )
    return [item.embedding for item in response.data]

# Prepare data
documents = [
    {"text": "Milvus is an open-source vector database", "category": "database"},
    {"text": "HNSW is an efficient vector indexing algorithm", "category": "algorithm"},
    {"text": "Semantic search understands the meaning of queries", "category": "search"},
]

texts = [doc["text"] for doc in documents]
categories = [doc["category"] for doc in documents]
embeddings = get_embeddings(texts)

# Insert data
entities = [
    texts,      # text field
    embeddings,  # embedding field
    categories,  # category field
]

insert_result = collection.insert(entities)
print(f"Inserted {len(insert_result.primary_keys)} records")

# Load collection into memory (required before querying)
collection.load()

# Execute query
query_text = "What is vector search?"
query_embedding = get_embeddings([query_text])[0]

search_params = {
    "metric_type": "COSINE",
    "params": {"ef": 64}  # HNSW query parameter
}

results = collection.search(
    data=[query_embedding],
    anns_field="embedding",
    param=search_params,
    limit=5,
    output_fields=["text", "category"]
)

print("Search results:")
for hits in results:
    for hit in hits:
        print(f"  ID: {hit.id}")
        print(f"  Distance: {hit.distance:.4f}")
        print(f"  Text: {hit.entity.get('text')}")
        print(f"  Category: {hit.entity.get('category')}")
        print()
```

### Scalar Filtering

```python
# Hybrid search with scalar filtering
results = collection.search(
    data=[query_embedding],
    anns_field="embedding",
    param=search_params,
    limit=10,
    expr='category == "database"',  # Scalar filter expression
    output_fields=["text", "category"]
)

# Supported expressions
# ==, !=, >, >=, <, <=
# in, not in
# and, or, not
# like (fuzzy matching)

# Complex filter example
expr = 'category in ["database", "algorithm"] and text like "%vector%"'
```

---

## Chroma for Local Development

Chroma is a lightweight embedded vector database, perfect for local development and rapid prototyping.

### Installation

```bash
pip install chromadb
```

### Basic Usage

```python
import chromadb
from chromadb.utils import embedding_functions

# Create client (persist to disk)
client = chromadb.PersistentClient(path="./chroma_data")

# Or use in-memory mode (suitable for testing)
# client = chromadb.Client()

# Use OpenAI Embedding
openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key="your-api-key",
    model_name="text-embedding-3-small"
)

# Create or get collection
collection = client.get_or_create_collection(
    name="documents",
    embedding_function=openai_ef,
    metadata={"hnsw:space": "cosine"}  # Use cosine similarity
)

# Add documents (Chroma will automatically generate vectors)
collection.add(
    ids=["doc1", "doc2", "doc3"],
    documents=[
        "Python is one of the most popular programming languages",
        "Vector databases support semantic search",
        "Machine learning has transformed software development"
    ],
    metadatas=[
        {"source": "wiki", "category": "programming"},
        {"source": "blog", "category": "database"},
        {"source": "article", "category": "ai"}
    ]
)

print(f"Collection has {collection.count()} documents")
```

### Querying and Filtering

```python
# Semantic query
results = collection.query(
    query_texts=["What is artificial intelligence?"],
    n_results=3,
    include=["documents", "metadatas", "distances"]
)

print("Query results:")
for i, doc in enumerate(results["documents"][0]):
    print(f"  Document: {doc}")
    print(f"  Metadata: {results['metadatas'][0][i]}")
    print(f"  Distance: {results['distances'][0][i]:.4f}")
    print()

# Query with filtering
results = collection.query(
    query_texts=["Programming related"],
    n_results=5,
    where={"category": "programming"},  # Metadata filter
    where_document={"$contains": "Python"}  # Document content filter
)

# Supported where operators
# $eq: equals (default)
# $ne: not equals
# $gt, $gte, $lt, $lte: comparisons
# $in, $nin: contains/not contains
# $and, $or: logical combinations
```

### Updating and Deleting

```python
# Update document
collection.update(
    ids=["doc1"],
    documents=["Python is a powerful and easy-to-learn programming language"],
    metadatas=[{"source": "updated", "category": "programming"}]
)

# Delete document
collection.delete(ids=["doc3"])

# Delete by condition
collection.delete(where={"category": "deprecated"})
```

### Integration with LangChain

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

# Create vector store
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = Chroma(
    collection_name="langchain_docs",
    embedding_function=embeddings,
    persist_directory="./chroma_langchain"
)

# Add documents
texts = [
    "LangChain is a framework for building LLM applications",
    "RAG combines retrieval and generation capabilities",
    "Vector databases are core components of RAG"
]
vectorstore.add_texts(texts)

# Similarity search
docs = vectorstore.similarity_search("What is RAG?", k=2)
for doc in docs:
    print(doc.page_content)
```

---

## Performance Optimization

### Batch Operations

Avoid inserting records one by one; use batch operations to improve throughput.

```python
# Not recommended: Insert one by one
for doc in documents:
    collection.add(ids=[doc["id"]], documents=[doc["text"]])

# Recommended: Batch insert
BATCH_SIZE = 100
for i in range(0, len(documents), BATCH_SIZE):
    batch = documents[i:i + BATCH_SIZE]
    collection.add(
        ids=[doc["id"] for doc in batch],
        documents=[doc["text"] for doc in batch]
    )
```

### Index Parameter Tuning

Adjust index parameters based on data scale and query requirements.

```python
# HNSW parameter tuning
# Small data (< 100K): M=16, efConstruction=128
# Medium data (100K-1M): M=32, efConstruction=256
# Large data (> 1M): M=48, efConstruction=512

# Query parameter tuning
# Prioritize speed: ef=50
# Prioritize recall: ef=200
# Balanced: ef=100

# IVF parameter tuning
# nlist = 4 * sqrt(n)  # n is data size
# nprobe = nlist / 10  # About 10% of clusters
```

### Vector Dimensionality Reduction

Use PCA or Matryoshka embeddings to reduce storage and computation overhead.

```python
from sklearn.decomposition import PCA
import numpy as np

# Original vectors
original_dim = 1536
target_dim = 512
vectors = np.random.rand(10000, original_dim).astype('float32')

# PCA dimensionality reduction
pca = PCA(n_components=target_dim)
reduced_vectors = pca.fit_transform(vectors)

print(f"Reduced dimension: {reduced_vectors.shape[1]}")
print(f"Variance retained: {sum(pca.explained_variance_ratio_):.2%}")

# Or use embedding models that support variable dimensions
# OpenAI text-embedding-3 supports the dimensions parameter
from openai import OpenAI

client = OpenAI()
response = client.embeddings.create(
    input="Sample text",
    model="text-embedding-3-small",
    dimensions=512  # Reduce dimensions
)
```

### Quantization Compression

Use quantization techniques to reduce memory usage.

```python
import faiss

dim = 1536
num_elements = 1000000

# Original vectors
vectors = np.random.rand(num_elements, dim).astype('float32')

# Use Product Quantization (PQ) for compression
m = 64  # Number of subspaces
nbits = 8  # Bits per subspace

# Create IVF-PQ index
nlist = 1024
quantizer = faiss.IndexFlatL2(dim)
index = faiss.IndexIVFPQ(quantizer, dim, nlist, m, nbits)

# Train and add vectors
index.train(vectors)
index.add(vectors)

# Memory usage comparison
flat_memory = num_elements * dim * 4  # float32
pq_memory = num_elements * m  # Each vector needs only m bytes
print(f"Original memory: {flat_memory / 1e9:.2f} GB")
print(f"PQ memory: {pq_memory / 1e9:.2f} GB")
print(f"Compression ratio: {flat_memory / pq_memory:.1f}x")
```

### Caching Strategy

Cache results for frequently accessed queries.

```python
from functools import lru_cache
import hashlib

# Using LRU cache
@lru_cache(maxsize=1000)
def cached_search(query_hash: str, top_k: int):
    # Actual query logic
    return perform_vector_search(query_hash, top_k)

def search_with_cache(query_text: str, top_k: int = 10):
    # Generate query hash
    query_hash = hashlib.md5(query_text.encode()).hexdigest()
    return cached_search(query_hash, top_k)

# Using Redis cache (recommended for production)
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379)
CACHE_TTL = 3600  # 1 hour

def search_with_redis_cache(query_text: str, top_k: int = 10):
    cache_key = f"vector_search:{hashlib.md5(query_text.encode()).hexdigest()}"

    # Try to get from cache
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    # Execute query
    results = perform_vector_search(query_text, top_k)

    # Write to cache
    redis_client.setex(cache_key, CACHE_TTL, json.dumps(results))
    return results
```

---

## Integration with LLM Applications

### RAG (Retrieval-Augmented Generation) Architecture

```
+------------------------------------------------------------------+
|                       RAG System Architecture                     |
+------------------------------------------------------------------+
|                                                                   |
| User Query --> Embedding --> Vector Search --> Relevant Documents |
|                                    |                              |
|                                    v                              |
|                           Build Enhanced Prompt                   |
|                                    |                              |
|                                    v                              |
|                            LLM Generates Answer                   |
|                                    |                              |
|                                    v                              |
|                             Return to User                        |
|                                                                   |
+------------------------------------------------------------------+
```

### Complete RAG Implementation

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
        """Add documents to knowledge base"""
        self.collection.add(
            ids=[doc["id"] for doc in documents],
            documents=[doc["content"] for doc in documents],
            metadatas=[doc.get("metadata", {}) for doc in documents]
        )

    def retrieve(self, query: str, top_k: int = 5) -> list[str]:
        """Retrieve relevant documents"""
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k,
            include=["documents", "distances"]
        )
        return results["documents"][0]

    def generate_answer(self, query: str, context: list[str]) -> str:
        """Generate answer based on context"""
        context_text = "\n\n".join([f"[Document {i+1}]\n{doc}"
                                    for i, doc in enumerate(context)])

        prompt = f"""Answer the user's question based on the following reference documents.
If the documents don't contain relevant information, please honestly state that.

Reference Documents:
{context_text}

User Question: {query}

Please provide an accurate and helpful answer:"""

        response = self.openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a professional technical assistant that answers questions based on provided documents."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        return response.choices[0].message.content

    def query(self, question: str, top_k: int = 5) -> dict:
        """Complete RAG query flow"""
        # 1. Retrieve relevant documents
        relevant_docs = self.retrieve(question, top_k)

        # 2. Generate answer
        answer = self.generate_answer(question, relevant_docs)

        return {
            "question": question,
            "answer": answer,
            "sources": relevant_docs
        }

# Usage example
rag = RAGSystem()

# Add knowledge base documents
documents = [
    {"id": "1", "content": "Vector databases are database systems specifically designed for storing and querying vector data..."},
    {"id": "2", "content": "The HNSW algorithm achieves efficient approximate nearest neighbor search by building a multi-layer graph structure..."},
    {"id": "3", "content": "RAG (Retrieval-Augmented Generation) combines the advantages of retrieval systems and large language models..."},
]
rag.add_documents(documents)

# Query
result = rag.query("How do vector databases work?")
print(f"Answer: {result['answer']}")
print(f"\nSources: {len(result['sources'])} documents")
```

### Advanced RAG Techniques

```python
class AdvancedRAG(RAGSystem):
    def hybrid_retrieve(self, query: str, top_k: int = 5) -> list[str]:
        """Hybrid retrieval: combine semantic search and keyword search"""
        # Semantic search
        semantic_results = self.collection.query(
            query_texts=[query],
            n_results=top_k
        )

        # Keyword search (using where_document)
        keywords = self.extract_keywords(query)
        keyword_results = self.collection.query(
            query_texts=[query],
            n_results=top_k,
            where_document={"$contains": keywords[0]} if keywords else None
        )

        # Merge and deduplicate
        all_docs = semantic_results["documents"][0] + keyword_results["documents"][0]
        unique_docs = list(dict.fromkeys(all_docs))

        return unique_docs[:top_k]

    def rerank(self, query: str, documents: list[str]) -> list[str]:
        """Rerank retrieval results using LLM"""
        if not documents:
            return []

        prompt = f"""Rank the following documents by relevance to the query.

Query: {query}

Document list:
{chr(10).join([f'{i+1}. {doc[:200]}...' for i, doc in enumerate(documents)])}

Please return the document numbers in order of relevance (most relevant first), format: 1, 3, 2, 5, 4"""

        response = self.openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        # Parse ranking result
        order_text = response.choices[0].message.content
        order = [int(x.strip()) - 1 for x in order_text.split(",") if x.strip().isdigit()]

        return [documents[i] for i in order if i < len(documents)]

    def query_with_rerank(self, question: str, top_k: int = 5) -> dict:
        """RAG query with reranking"""
        # 1. Retrieve more candidate documents
        candidates = self.retrieve(question, top_k * 2)

        # 2. Rerank
        reranked = self.rerank(question, candidates)[:top_k]

        # 3. Generate answer
        answer = self.generate_answer(question, reranked)

        return {
            "question": question,
            "answer": answer,
            "sources": reranked
        }

    def extract_keywords(self, text: str) -> list[str]:
        """Extract keywords (simple implementation)"""
        import re
        # Remove stopwords, extract keywords
        words = re.findall(r'\w+', text.lower())
        stopwords = {'the', 'is', 'at', 'and', 'a', 'an', 'what', 'how', 'why', 'when', 'where', 'which'}
        return [w for w in words if w not in stopwords and len(w) > 2]
```

---

## Interview Key Points

### Core Concept Questions

**Q1: What are the main differences between vector databases and traditional databases?**

```
Traditional Databases:
- Query based on exact matching (SQL WHERE conditions)
- Use B-Tree, Hash and other indexes
- Suitable for structured data

Vector Databases:
- Based on similarity search (find K most similar)
- Use ANN algorithms (HNSW, IVF)
- Suitable for semantic understanding of unstructured data
```

**Q2: What is Embedding? Why do we need it?**

```
Embedding is a technique that maps high-dimensional discrete data (text, images)
to a low-dimensional continuous vector space.

Why we need it:
1. Computers cannot directly understand text, need numerical representation
2. In vector space, semantically similar content is closer in distance
3. Supports cross-modal similarity computation
```

**Q3: What are the core ideas behind HNSW and IVF algorithms?**

```
HNSW:
- Builds a multi-layer navigation graph, sparse at top, dense at bottom
- Search starts from top layer, descends layer by layer
- Time complexity O(log n), supports dynamic insertion

IVF:
- Partitions vector space into nlist clusters
- During query, only searches the nearest nprobe clusters
- Requires pre-training, doesn't support dynamic insertion
```

### System Design Questions

**Q4: How would you design a RAG system supporting millions of documents?**

```python
"""
Design Points:

1. Vector Database Selection
   - Use Milvus or Pinecone for large-scale data
   - Choose HNSW index, M=32, efConstruction=256

2. Sharding Strategy
   - Shard by document type or time range
   - Use namespaces to isolate different tenants

3. Caching Layer
   - Redis cache for hot query results
   - Local cache for embeddings to avoid recomputation

4. Retrieval Optimization
   - Hybrid retrieval (semantic + keyword)
   - Use Reranker to improve precision
   - Metadata filtering to reduce search scope

5. Architecture Diagram
"""

class ScalableRAGSystem:
    """Million-scale RAG System Architecture"""

    def __init__(self):
        # Vector database (distributed deployment)
        self.vector_db = MilvusClient(
            host="milvus-cluster",
            shards=4  # 4 shards
        )

        # Cache layer
        self.cache = RedisCache(
            host="redis-cluster",
            ttl=3600
        )

        # Embedding service (horizontally scalable)
        self.embedding_service = EmbeddingService(
            model="text-embedding-3-small",
            batch_size=100
        )

    def ingest(self, documents: list[dict]):
        """Document ingestion pipeline"""
        # 1. Document chunking
        chunks = self.chunk_documents(documents)

        # 2. Batch generate embeddings
        embeddings = self.embedding_service.encode_batch(
            [c["content"] for c in chunks]
        )

        # 3. Write to vector database
        self.vector_db.insert_batch(chunks, embeddings)

    def query(self, question: str) -> dict:
        """Query flow"""
        # 1. Check cache
        cache_key = self.get_cache_key(question)
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        # 2. Generate query vector
        query_embedding = self.embedding_service.encode(question)

        # 3. Vector search
        candidates = self.vector_db.search(
            vector=query_embedding,
            top_k=20,
            ef=100
        )

        # 4. Rerank
        reranked = self.rerank(question, candidates[:10])

        # 5. Generate answer
        answer = self.generate(question, reranked[:5])

        # 6. Write to cache
        result = {"answer": answer, "sources": reranked[:5]}
        self.cache.set(cache_key, result)

        return result
```

**Q5: How do you measure vector search effectiveness?**

```python
"""
Core Metrics:

1. Recall@K
   - Proportion of relevant documents in Top-K results

2. Precision@K
   - Proportion of truly relevant documents in Top-K results

3. MRR (Mean Reciprocal Rank)
   - Average of the reciprocal rank of the first relevant result

4. NDCG (Normalized Discounted Cumulative Gain)
   - Comprehensive metric considering relevance degree and position
"""

def assess_retrieval(queries: list[dict], retriever) -> dict:
    """Measure retrieval effectiveness"""
    recalls = []
    precisions = []
    mrrs = []

    for q in queries:
        query_text = q["query"]
        relevant_ids = set(q["relevant_doc_ids"])

        # Execute retrieval
        results = retriever.search(query_text, top_k=10)
        retrieved_ids = [r["id"] for r in results]

        # Calculate Recall@10
        hits = len(set(retrieved_ids) & relevant_ids)
        recall = hits / len(relevant_ids) if relevant_ids else 0
        recalls.append(recall)

        # Calculate Precision@10
        precision = hits / len(retrieved_ids) if retrieved_ids else 0
        precisions.append(precision)

        # Calculate MRR
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

### Practical Experience Questions

**Q6: What are common issues in production environments and their solutions?**

```
1. High Query Latency
   - Optimize index parameters (lower ef value)
   - Use approximate search instead of exact search
   - Introduce caching layer

2. Insufficient Recall
   - Use better embedding models
   - Increase top_k + use Reranker
   - Hybrid retrieval (semantic + keyword)

3. Memory Insufficient
   - Use quantization compression (PQ, SQ)
   - Sharded deployment
   - Hot/cold data separation

4. Slow Data Updates
   - Use indexes that support dynamic insertion (HNSW)
   - Batch updates instead of one-by-one updates
   - Asynchronous write queues
```

---

## Further Reading

### Official Documentation
- [Pinecone Documentation](https://docs.pinecone.io/) - Comprehensive guide for Pinecone
- [Milvus Documentation](https://milvus.io/docs) - Complete Milvus reference
- [Chroma Documentation](https://docs.trychroma.com/) - Getting started with Chroma
- [Faiss Wiki](https://github.com/facebookresearch/faiss/wiki) - Facebook AI Similarity Search

### Research Papers
- "Efficient and Robust Approximate Nearest Neighbor Search Using HNSW Graphs" - Original HNSW paper
- "Billion-scale similarity search with GPUs" - Faiss paper
- "Product Quantization for Nearest Neighbor Search" - PQ algorithm

### Tutorials and Courses
- [Vector Database 101](https://www.pinecone.io/learn/vector-database/) - Pinecone's learning series
- [Building RAG Applications](https://python.langchain.com/docs/tutorials/rag/) - LangChain RAG tutorial

### Related Tools
- [LangChain](https://langchain.com/) - LLM application framework with vector store integrations
- [LlamaIndex](https://www.llamaindex.ai/) - Data framework for LLM applications
- [Sentence Transformers](https://www.sbert.net/) - Open source embedding models

---

## Summary

Vector databases are core infrastructure for building modern AI applications. Mastering vector databases requires understanding:

1. **Core Concepts**: Vectorization, similarity metrics, ANN algorithms
2. **Technology Selection**: Choose the right product based on your scenario (Pinecone/Milvus/Chroma)
3. **Performance Optimization**: Index tuning, batch operations, caching strategies
4. **Practical Applications**: RAG system design, LLM integration

With the proliferation of large language models, the importance of vector databases will continue to grow. We recommend starting with Chroma for local practice, then gradually transitioning to production-grade Milvus or Pinecone.
