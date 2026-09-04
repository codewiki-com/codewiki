---
title: Vector Embeddings
description: Understand and use vector embeddings for semantic search
track: ai
section: rag
difficulty: intermediate
tags:
  - embeddings
  - vectors
  - semantic search
  - similarity
status: imported
origin: old/src/content/docs/ai/embeddings.en.md
divergence: 0.417
issues:
  - divergent
legacy:
  category: AI
  subcategory: NLP
  order: 27
  lastUpdated: 2026-01-07
---

## Concept Overview

**Vector embeddings** are numerical representations of data (text, images, audio, etc.) in a high-dimensional vector space. They capture semantic meaning, allowing machines to understand and compare concepts based on their relationships rather than exact matches.

### Why Do We Need Embeddings?

Traditional computing relies on exact matching - searching for "car" won't find "automobile." Embeddings solve this by mapping semantically similar concepts to nearby points in vector space:

```
+------------------------------------------------------------------+
|                    Embedding Space Visualization                  |
+------------------------------------------------------------------+
|                                                                   |
|     "automobile" o  o "car"     o "truck"                        |
|                   o  "vehicle"                                    |
|                                                                   |
|                                     o "airplane"                  |
|                                       o "helicopter"              |
|                                                                   |
|     "apple" o  o "orange"                                        |
|              o "fruit"                                            |
|                                                                   |
|  Similar concepts cluster together in the embedding space         |
+------------------------------------------------------------------+
```

### Key Properties of Embeddings

| Property | Description |
|----------|-------------|
| **Dimensionality** | Number of values in the vector (typically 384-3072) |
| **Semantic Similarity** | Similar meanings result in similar vectors |
| **Continuous Space** | Enables mathematical operations on concepts |
| **Transfer Learning** | Pre-trained embeddings capture general knowledge |

---

## How Embeddings Work

### The Embedding Process

```
+------------------------------------------------------------------+
|                    Text Embedding Pipeline                        |
+------------------------------------------------------------------+
|                                                                   |
|  Input Text          Tokenization        Neural Network           |
|      |                   |                    |                   |
|      v                   v                    v                   |
|  "Machine         ["Machine",         Transformer               |
|   learning"        "learning"]         Encoder                   |
|      |                   |                    |                   |
|      +-------------------+--------------------+                   |
|                          |                                        |
|                          v                                        |
|                  [0.023, -0.156, 0.089, ..., 0.045]               |
|                     (1536-dimensional vector)                     |
|                                                                   |
+------------------------------------------------------------------+
```

### Mathematical Foundation

Embeddings are created through neural network training where:

1. **Input Layer**: Receives tokenized text
2. **Transformer Layers**: Process context and relationships
3. **Pooling**: Aggregates token representations into a single vector
4. **Normalization**: Scales vectors to unit length (for cosine similarity)

```python
import numpy as np

# Example: A simplified view of what an embedding looks like
embedding = np.array([
    0.023,   # Dimension 1: might capture "technicality"
    -0.156,  # Dimension 2: might capture "sentiment"
    0.089,   # Dimension 3: might capture "abstractness"
    # ... hundreds or thousands more dimensions
])

# Embeddings are typically normalized to unit length
normalized = embedding / np.linalg.norm(embedding)
print(f"Original norm: {np.linalg.norm(embedding):.4f}")
print(f"Normalized norm: {np.linalg.norm(normalized):.4f}")  # 1.0
```

---

## Text Embedding Models

### OpenAI Embeddings

OpenAI provides state-of-the-art embedding models through their API:

```python
from openai import OpenAI

client = OpenAI()

def get_embedding(text: str, model: str = "text-embedding-3-small") -> list[float]:
    """Generate embedding for a text using OpenAI API."""
    response = client.embeddings.create(
        input=text,
        model=model
    )
    return response.data[0].embedding

# Generate embeddings
text = "Machine learning is a subset of artificial intelligence"
embedding = get_embedding(text)

print(f"Embedding dimension: {len(embedding)}")  # 1536
print(f"First 5 values: {embedding[:5]}")
```

#### OpenAI Embedding Models Comparison

| Model | Dimensions | Max Tokens | Price (per 1M tokens) | Use Case |
|-------|------------|------------|----------------------|----------|
| `text-embedding-3-small` | 1536 | 8191 | $0.02 | Cost-effective, general purpose |
| `text-embedding-3-large` | 3072 | 8191 | $0.13 | Higher accuracy, complex tasks |
| `text-embedding-ada-002` | 1536 | 8191 | $0.10 | Legacy model |

#### Dimensionality Reduction with OpenAI

OpenAI's newer models support native dimensionality reduction:

```python
def get_embedding_with_dimensions(
    text: str,
    dimensions: int = 512
) -> list[float]:
    """Generate embedding with custom dimensions."""
    response = client.embeddings.create(
        input=text,
        model="text-embedding-3-small",
        dimensions=dimensions  # Reduce from 1536 to 512
    )
    return response.data[0].embedding

# Smaller embeddings = faster search, less storage
small_embedding = get_embedding_with_dimensions("Hello world", dimensions=256)
print(f"Reduced dimension: {len(small_embedding)}")  # 256
```

### Sentence Transformers

Sentence Transformers is an open-source library providing high-quality embeddings:

```python
from sentence_transformers import SentenceTransformer

# Load a pre-trained model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Generate embeddings
sentences = [
    "Machine learning is fascinating",
    "I love studying AI",
    "The weather is nice today"
]

embeddings = model.encode(sentences)

print(f"Shape: {embeddings.shape}")  # (3, 384)

# Compare similarities
from sklearn.metrics.pairwise import cosine_similarity

similarities = cosine_similarity(embeddings)
print("Similarity matrix:")
print(similarities)
```

#### Popular Sentence Transformer Models

| Model | Dimensions | Speed | Quality | Best For |
|-------|------------|-------|---------|----------|
| `all-MiniLM-L6-v2` | 384 | Fast | Good | General purpose, resource-constrained |
| `all-mpnet-base-v2` | 768 | Medium | Excellent | Best quality for English |
| `paraphrase-multilingual-MiniLM-L12-v2` | 384 | Fast | Good | Multilingual applications |
| `BAAI/bge-large-en-v1.5` | 1024 | Slow | Excellent | State-of-the-art retrieval |

```python
# Using a multilingual model
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

texts = [
    "Hello, how are you?",      # English
    "Bonjour, comment allez-vous?",  # French
    "Hola, como estas?"         # Spanish
]

embeddings = model.encode(texts)
similarities = cosine_similarity(embeddings)

print("Cross-lingual similarities:")
for i, text_i in enumerate(texts):
    for j, text_j in enumerate(texts):
        if i < j:
            print(f"{text_i[:20]}... <-> {text_j[:20]}...: {similarities[i][j]:.4f}")
```

### Hugging Face Transformers

For more control, use Hugging Face directly:

```python
from transformers import AutoTokenizer, AutoModel
import torch

class HuggingFaceEmbedder:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)
        self.model.set_train_mode(False)

    def mean_pooling(self, model_output, attention_mask):
        """Apply mean pooling to get sentence embeddings."""
        token_embeddings = model_output[0]
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(
            token_embeddings.size()
        ).float()
        return torch.sum(
            token_embeddings * input_mask_expanded, 1
        ) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)

    def encode(self, texts: list[str]) -> torch.Tensor:
        """Generate embeddings for a list of texts."""
        encoded = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            return_tensors='pt'
        )

        with torch.no_grad():
            outputs = self.model(**encoded)

        embeddings = self.mean_pooling(outputs, encoded['attention_mask'])
        # Normalize embeddings
        embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
        return embeddings

# Usage
embedder = HuggingFaceEmbedder()
texts = ["This is a test sentence", "Another example text"]
embeddings = embedder.encode(texts)
print(f"Shape: {embeddings.shape}")
```

---

## Similarity Metrics

### Cosine Similarity

The most common metric for comparing embeddings. Measures the angle between vectors, ignoring magnitude.

```python
import numpy as np

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """
    Calculate cosine similarity between two vectors.

    Returns: Value between -1 and 1
    - 1: Identical direction (most similar)
    - 0: Orthogonal (unrelated)
    - -1: Opposite direction (most dissimilar)
    """
    dot_product = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    return dot_product / (norm_a * norm_b)

# Example
vec_a = np.array([1, 2, 3])
vec_b = np.array([2, 4, 6])  # Same direction as a
vec_c = np.array([3, 2, 1])  # Different direction

print(f"a vs b (same direction): {cosine_similarity(vec_a, vec_b):.4f}")  # 1.0
print(f"a vs c (different): {cosine_similarity(vec_a, vec_c):.4f}")  # 0.7143
```

### Euclidean Distance (L2)

Measures straight-line distance in the embedding space:

```python
def euclidean_distance(a: np.ndarray, b: np.ndarray) -> float:
    """
    Calculate Euclidean distance between two vectors.

    Returns: Non-negative value
    - 0: Identical vectors
    - Higher values: More different
    """
    return np.linalg.norm(a - b)

# For normalized vectors, L2 distance is related to cosine similarity:
# L2^2 = 2 * (1 - cosine_similarity)

vec_a = np.array([1, 0, 0])
vec_b = np.array([0, 1, 0])

print(f"Euclidean distance: {euclidean_distance(vec_a, vec_b):.4f}")  # 1.4142
print(f"Cosine similarity: {cosine_similarity(vec_a, vec_b):.4f}")  # 0.0
```

### Dot Product (Inner Product)

For normalized vectors, equivalent to cosine similarity but faster:

```python
def dot_product(a: np.ndarray, b: np.ndarray) -> float:
    """Calculate dot product between two vectors."""
    return np.dot(a, b)

# Normalize vectors
def normalize(v: np.ndarray) -> np.ndarray:
    return v / np.linalg.norm(v)

vec_a = normalize(np.array([1, 2, 3]))
vec_b = normalize(np.array([2, 4, 6]))

# For normalized vectors: dot product = cosine similarity
print(f"Dot product: {dot_product(vec_a, vec_b):.4f}")  # 1.0
print(f"Cosine similarity: {cosine_similarity(vec_a, vec_b):.4f}")  # 1.0
```

### Choosing the Right Metric

```
+------------------------------------------------------------------+
|                    Similarity Metric Selection Guide              |
+------------------------------------------------------------------+
|                                                                   |
|  Are your embeddings normalized?                                  |
|       |                                                           |
|       +-- Yes --> Use Dot Product (fastest)                       |
|       |                                                           |
|       +-- No  --> Does vector magnitude matter?                   |
|               |                                                   |
|               +-- Yes --> Use Euclidean Distance                  |
|               |                                                   |
|               +-- No  --> Use Cosine Similarity                   |
|                                                                   |
|  Note: Most embedding models output normalized vectors            |
+------------------------------------------------------------------+
```

---

## Use Cases

### Semantic Search

Find documents by meaning, not just keywords:

```python
from sentence_transformers import SentenceTransformer
import numpy as np

class SemanticSearch:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self.documents = []
        self.embeddings = None

    def index_documents(self, documents: list[str]):
        """Index a list of documents."""
        self.documents = documents
        self.embeddings = self.model.encode(documents)

    def search(self, query: str, top_k: int = 5) -> list[tuple[str, float]]:
        """Search for similar documents."""
        query_embedding = self.model.encode([query])[0]

        # Calculate similarities
        similarities = np.dot(self.embeddings, query_embedding)

        # Get top-k results
        top_indices = np.argsort(similarities)[-top_k:][::-1]

        return [
            (self.documents[i], similarities[i])
            for i in top_indices
        ]

# Usage
search_engine = SemanticSearch()

documents = [
    "Python is a programming language",
    "Machine learning uses statistical techniques",
    "Neural networks are inspired by the brain",
    "The Eiffel Tower is in Paris",
    "Deep learning is a subset of machine learning"
]

search_engine.index_documents(documents)

# Search by meaning, not keywords
results = search_engine.search("AI and statistics")
print("Search results for 'AI and statistics':")
for doc, score in results:
    print(f"  {score:.4f}: {doc}")
```

### Document Clustering

Group similar documents automatically:

```python
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
import numpy as np

def cluster_documents(
    documents: list[str],
    n_clusters: int = 3
) -> dict[int, list[str]]:
    """Cluster documents based on semantic similarity."""
    # Generate embeddings
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = model.encode(documents)

    # Perform clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    labels = kmeans.fit_predict(embeddings)

    # Group documents by cluster
    clusters = {}
    for doc, label in zip(documents, labels):
        if label not in clusters:
            clusters[label] = []
        clusters[label].append(doc)

    return clusters

# Example
documents = [
    "Python is great for data science",
    "JavaScript runs in browsers",
    "Machine learning predicts outcomes",
    "React is a frontend framework",
    "Neural networks learn patterns",
    "Vue.js is easy to learn"
]

clusters = cluster_documents(documents, n_clusters=2)
for cluster_id, docs in clusters.items():
    print(f"\nCluster {cluster_id}:")
    for doc in docs:
        print(f"  - {doc}")
```

### Recommendation Systems

Find similar items based on embeddings:

```python
from sentence_transformers import SentenceTransformer
import numpy as np

class ContentRecommender:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.items = []
        self.embeddings = None

    def add_items(self, items: list[dict]):
        """Add items with text descriptions."""
        self.items = items
        descriptions = [item['description'] for item in items]
        self.embeddings = self.model.encode(descriptions)

    def get_similar(
        self,
        item_id: int,
        top_k: int = 5
    ) -> list[tuple[dict, float]]:
        """Find items similar to the given item."""
        item_embedding = self.embeddings[item_id]

        # Calculate similarities (excluding self)
        similarities = np.dot(self.embeddings, item_embedding)
        similarities[item_id] = -np.inf  # Exclude self

        # Get top-k
        top_indices = np.argsort(similarities)[-top_k:][::-1]

        return [
            (self.items[i], similarities[i])
            for i in top_indices
        ]

# Usage
recommender = ContentRecommender()

products = [
    {"id": 0, "name": "Python Book", "description": "Learn Python programming from scratch"},
    {"id": 1, "name": "ML Course", "description": "Machine learning fundamentals with Python"},
    {"id": 2, "name": "Web Dev Guide", "description": "Build websites with HTML, CSS, JavaScript"},
    {"id": 3, "name": "Data Science Kit", "description": "Python tools for data analysis"},
    {"id": 4, "name": "React Tutorial", "description": "Frontend development with React"},
]

recommender.add_items(products)

# Get recommendations for "Python Book"
print("Similar to 'Python Book':")
for item, score in recommender.get_similar(0, top_k=3):
    print(f"  {score:.4f}: {item['name']}")
```

### Duplicate Detection

Find duplicate or near-duplicate content:

```python
from sentence_transformers import SentenceTransformer
import numpy as np
from itertools import combinations

def find_duplicates(
    texts: list[str],
    threshold: float = 0.9
) -> list[tuple[int, int, float]]:
    """Find pairs of texts that are likely duplicates."""
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = model.encode(texts)

    duplicates = []

    for i, j in combinations(range(len(texts)), 2):
        similarity = np.dot(embeddings[i], embeddings[j])
        if similarity >= threshold:
            duplicates.append((i, j, similarity))

    return sorted(duplicates, key=lambda x: x[2], reverse=True)

# Example
texts = [
    "The quick brown fox jumps over the lazy dog",
    "A fast brown fox leaps over a sleepy dog",  # Near duplicate
    "Machine learning is transforming industries",
    "AI and ML are revolutionizing business",  # Semantically similar
    "The weather is nice today"
]

duplicates = find_duplicates(texts, threshold=0.7)
print("Potential duplicates:")
for i, j, score in duplicates:
    print(f"  {score:.4f}:")
    print(f"    - {texts[i]}")
    print(f"    - {texts[j]}")
```

---

## Best Practices

### Preprocessing Text

Clean and normalize text before embedding:

```python
import re
from typing import Optional

def preprocess_text(
    text: str,
    lowercase: bool = True,
    remove_urls: bool = True,
    remove_extra_whitespace: bool = True,
    max_length: Optional[int] = None
) -> str:
    """Preprocess text before embedding."""

    # Remove URLs
    if remove_urls:
        text = re.sub(r'https?://\S+|www\.\S+', '', text)

    # Lowercase
    if lowercase:
        text = text.lower()

    # Remove extra whitespace
    if remove_extra_whitespace:
        text = ' '.join(text.split())

    # Truncate if needed
    if max_length and len(text) > max_length:
        text = text[:max_length]

    return text.strip()

# Example
raw_text = "Check out   https://example.com   for MORE info!!!"
cleaned = preprocess_text(raw_text)
print(f"Cleaned: '{cleaned}'")  # "check out for more info!!!"
```

### Chunking Long Documents

Split long documents for better embeddings:

```python
from typing import Generator

def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 50
) -> Generator[str, None, None]:
    """Split text into overlapping chunks."""
    words = text.split()

    for i in range(0, len(words), chunk_size - overlap):
        chunk = ' '.join(words[i:i + chunk_size])
        if chunk:
            yield chunk

# Example
long_text = " ".join([f"Sentence {i}." for i in range(100)])

chunks = list(chunk_text(long_text, chunk_size=20, overlap=5))
print(f"Number of chunks: {len(chunks)}")
for i, chunk in enumerate(chunks[:3]):
    print(f"Chunk {i}: {chunk[:50]}...")
```

### Batch Processing

Process embeddings in batches for efficiency:

```python
from sentence_transformers import SentenceTransformer
import numpy as np
from tqdm import tqdm

def batch_embed(
    texts: list[str],
    model: SentenceTransformer,
    batch_size: int = 32,
    show_progress: bool = True
) -> np.ndarray:
    """Generate embeddings in batches."""
    all_embeddings = []

    iterator = range(0, len(texts), batch_size)
    if show_progress:
        iterator = tqdm(iterator, desc="Embedding")

    for i in iterator:
        batch = texts[i:i + batch_size]
        embeddings = model.encode(batch, show_progress_bar=False)
        all_embeddings.append(embeddings)

    return np.vstack(all_embeddings)

# Usage
model = SentenceTransformer('all-MiniLM-L6-v2')
texts = [f"Document {i}" for i in range(1000)]

embeddings = batch_embed(texts, model, batch_size=64)
print(f"Embeddings shape: {embeddings.shape}")
```

### Caching Embeddings

Avoid recomputing embeddings:

```python
import hashlib
import os
from pathlib import Path
from typing import Optional
import numpy as np

class EmbeddingCache:
    def __init__(self, cache_dir: str = "./embedding_cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)

    def _get_cache_key(self, text: str, model_name: str) -> str:
        """Generate a unique cache key."""
        content = f"{model_name}:{text}"
        return hashlib.md5(content.encode()).hexdigest()

    def get(
        self,
        text: str,
        model_name: str
    ) -> Optional[np.ndarray]:
        """Get embedding from cache if available."""
        key = self._get_cache_key(text, model_name)
        cache_path = self.cache_dir / f"{key}.npy"

        if cache_path.exists():
            return np.load(cache_path)
        return None

    def set(
        self,
        text: str,
        model_name: str,
        embedding: np.ndarray
    ):
        """Store embedding in cache."""
        key = self._get_cache_key(text, model_name)
        cache_path = self.cache_dir / f"{key}.npy"
        np.save(cache_path, embedding)

# Usage
cache = EmbeddingCache()

text = "Machine learning is amazing"
model_name = "all-MiniLM-L6-v2"

# Check cache first
embedding = cache.get(text, model_name)

if embedding is None:
    # Compute embedding
    model = SentenceTransformer(model_name)
    embedding = model.encode([text])[0]
    cache.set(text, model_name, embedding)
    print("Computed and cached")
else:
    print("Retrieved from cache")
```

### Choosing the Right Model

```
+------------------------------------------------------------------+
|                    Embedding Model Selection Guide                |
+------------------------------------------------------------------+
|                                                                   |
|  What is your priority?                                           |
|       |                                                           |
|       +-- Speed & Efficiency                                      |
|       |       --> all-MiniLM-L6-v2 (384 dim)                     |
|       |                                                           |
|       +-- Quality (English)                                       |
|       |       --> all-mpnet-base-v2 (768 dim)                    |
|       |       --> BAAI/bge-large-en-v1.5 (1024 dim)              |
|       |                                                           |
|       +-- Multilingual Support                                    |
|       |       --> paraphrase-multilingual-MiniLM-L12-v2          |
|       |       --> intfloat/multilingual-e5-large                 |
|       |                                                           |
|       +-- Commercial API (No hosting)                             |
|               --> OpenAI text-embedding-3-small                   |
|               --> Cohere embed-v3                                 |
|                                                                   |
+------------------------------------------------------------------+
```

---

## Performance Optimization

### Dimensionality Reduction

Reduce storage and speed up search:

```python
from sklearn.decomposition import PCA
from sklearn.random_projection import GaussianRandomProjection
import numpy as np

def reduce_dimensions_pca(
    embeddings: np.ndarray,
    target_dim: int = 128
) -> tuple[np.ndarray, PCA]:
    """Reduce embedding dimensions using PCA."""
    pca = PCA(n_components=target_dim)
    reduced = pca.fit_transform(embeddings)

    variance_retained = sum(pca.explained_variance_ratio_)
    print(f"Variance retained: {variance_retained:.2%}")

    return reduced, pca

def reduce_dimensions_random(
    embeddings: np.ndarray,
    target_dim: int = 128
) -> tuple[np.ndarray, GaussianRandomProjection]:
    """Reduce dimensions using random projection (faster)."""
    rp = GaussianRandomProjection(n_components=target_dim)
    reduced = rp.fit_transform(embeddings)
    return reduced, rp

# Example
embeddings = np.random.rand(1000, 768)  # 768-dim embeddings

reduced_pca, pca_model = reduce_dimensions_pca(embeddings, 128)
print(f"PCA reduced shape: {reduced_pca.shape}")

reduced_rp, rp_model = reduce_dimensions_random(embeddings, 128)
print(f"Random projection shape: {reduced_rp.shape}")
```

### GPU Acceleration

Use GPU for faster embedding generation:

```python
from sentence_transformers import SentenceTransformer
import torch

# Check for GPU
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

# Load model on GPU
model = SentenceTransformer('all-MiniLM-L6-v2', device=device)

# Encode with GPU
texts = ["Sample text"] * 1000
embeddings = model.encode(
    texts,
    batch_size=64,
    show_progress_bar=True,
    convert_to_numpy=True
)
```

### Quantization

Reduce memory footprint with quantization:

```python
import numpy as np

def quantize_embeddings(
    embeddings: np.ndarray,
    bits: int = 8
) -> tuple[np.ndarray, float, float]:
    """Quantize embeddings to reduce memory."""
    min_val = embeddings.min()
    max_val = embeddings.max()

    # Scale to 0-255 (for 8-bit)
    scale = (2 ** bits - 1) / (max_val - min_val)
    quantized = ((embeddings - min_val) * scale).astype(np.uint8)

    return quantized, min_val, max_val

def dequantize_embeddings(
    quantized: np.ndarray,
    min_val: float,
    max_val: float,
    bits: int = 8
) -> np.ndarray:
    """Restore quantized embeddings."""
    scale = (max_val - min_val) / (2 ** bits - 1)
    return quantized.astype(np.float32) * scale + min_val

# Example
original = np.random.rand(1000, 384).astype(np.float32)
print(f"Original size: {original.nbytes / 1024:.2f} KB")

quantized, min_v, max_v = quantize_embeddings(original)
print(f"Quantized size: {quantized.nbytes / 1024:.2f} KB")

restored = dequantize_embeddings(quantized, min_v, max_v)
error = np.mean(np.abs(original - restored))
print(f"Mean absolute error: {error:.6f}")
```

---

## Common Pitfalls

### Ignoring Token Limits

Embedding models have maximum token limits:

```python
from transformers import AutoTokenizer

def check_token_length(
    text: str,
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
    max_tokens: int = 256
) -> tuple[bool, int]:
    """Check if text exceeds token limit."""
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokens = tokenizer.encode(text)
    return len(tokens) <= max_tokens, len(tokens)

# Example
long_text = "word " * 500
is_valid, token_count = check_token_length(long_text)
print(f"Token count: {token_count}")
print(f"Within limit: {is_valid}")
```

### Not Normalizing Vectors

For cosine similarity, vectors should be normalized:

```python
import numpy as np

def ensure_normalized(embedding: np.ndarray) -> np.ndarray:
    """Ensure embedding is normalized to unit length."""
    norm = np.linalg.norm(embedding)
    if not np.isclose(norm, 1.0, atol=1e-6):
        return embedding / norm
    return embedding

# Check if normalized
embedding = np.array([0.5, 0.5, 0.5])
print(f"Original norm: {np.linalg.norm(embedding):.4f}")

normalized = ensure_normalized(embedding)
print(f"Normalized norm: {np.linalg.norm(normalized):.4f}")
```

### Using Wrong Similarity for Model

Match the similarity metric to how the model was trained:

```python
# Most sentence transformers are trained with cosine similarity
# Check model documentation!

from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')

query = model.encode("What is machine learning?")
doc = model.encode("ML is a type of artificial intelligence")

# Correct: Use cosine similarity (dot product for normalized vectors)
score = util.cos_sim(query, doc)
print(f"Cosine similarity: {score.item():.4f}")

# Note: Euclidean distance would give different rankings
```

---

## Interview Key Points

### Concept Questions

**Q1: What are embeddings and why are they useful?**

```
Embeddings are dense vector representations that capture semantic meaning.
They enable:
- Semantic similarity comparison
- Efficient search and retrieval
- Transfer learning from pre-trained models
- Mathematical operations on concepts
```

**Q2: How do you choose between different embedding models?**

```
Consider:
1. Quality vs Speed tradeoff
2. Language support requirements
3. Domain specificity needs
4. Deployment constraints (API vs self-hosted)
5. Dimensionality and storage requirements
```

**Q3: What's the difference between cosine similarity and Euclidean distance?**

```
Cosine Similarity:
- Measures angle between vectors
- Range: [-1, 1]
- Ignores magnitude
- Best for normalized embeddings

Euclidean Distance:
- Measures straight-line distance
- Range: [0, infinity)
- Considers magnitude
- Better when magnitude matters
```

### Practical Questions

**Q4: How would you handle long documents for embedding?**

```python
"""
Strategies:
1. Chunking with overlap
2. Summarize then embed
3. Use long-context models
4. Hierarchical embeddings
"""

def embed_long_document(text: str, model, chunk_size: int = 500):
    # Split into chunks
    chunks = chunk_text(text, chunk_size=chunk_size, overlap=50)

    # Embed each chunk
    chunk_embeddings = model.encode(list(chunks))

    # Combine (mean pooling)
    document_embedding = np.mean(chunk_embeddings, axis=0)

    return document_embedding
```

**Q5: How do you measure embedding quality?**

```python
"""
Measurement methods:
1. Downstream task performance (search, classification)
2. Semantic similarity benchmarks (STS-B)
3. Clustering quality metrics
4. Human assessment of similarity rankings
"""

from sentence_transformers import InputExample
from sentence_transformers.evaluation import EmbeddingSimilarityEvaluator

# Create test examples with similarity scores
examples = [
    InputExample(texts=["sentence 1", "similar 1"], label=0.9),
    InputExample(texts=["sentence 2", "similar 2"], label=0.8),
]

# The evaluator measures Spearman correlation with human scores
```

---

## Further Reading

### Official Documentation
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings) - Official OpenAI documentation
- [Sentence Transformers](https://www.sbert.net/) - Comprehensive sentence embedding library
- [Hugging Face Text Embeddings](https://huggingface.co/blog/mteb) - MTEB benchmark and models

### Research Papers
- "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks" - Original Sentence-BERT paper
- "Text Embeddings by Weakly-Supervised Contrastive Pre-training" - E5 embedding models
- "BGE: BAAI General Embedding" - State-of-the-art embedding models

### Tutorials and Courses
- [MTEB Leaderboard](https://huggingface.co/spaces/mteb/leaderboard) - Compare embedding models
- [Pinecone Learning Center](https://www.pinecone.io/learn/) - Vector search tutorials
- [LangChain Embeddings](https://python.langchain.com/docs/modules/data_connection/text_embedding/) - Integration guide

### Related Tools
- [Faiss](https://github.com/facebookresearch/faiss) - Efficient similarity search
- [Annoy](https://github.com/spotify/annoy) - Approximate nearest neighbors
- [Chroma](https://www.trychroma.com/) - AI-native embedding database

---

## Summary

Vector embeddings are foundational to modern AI applications. Key takeaways:

1. **Understanding**: Embeddings convert data to vectors that capture semantic meaning
2. **Models**: Choose based on your quality, speed, and language requirements
3. **Similarity**: Use cosine similarity for normalized vectors, understand your metric
4. **Use Cases**: Semantic search, clustering, recommendations, duplicate detection
5. **Best Practices**: Preprocess text, chunk long documents, cache embeddings, batch process
6. **Optimization**: Consider dimensionality reduction, GPU acceleration, and quantization

Mastering embeddings enables you to build powerful semantic search, recommendation systems, and RAG applications. Start with a simple model like `all-MiniLM-L6-v2` for prototyping, then optimize based on your specific requirements.
