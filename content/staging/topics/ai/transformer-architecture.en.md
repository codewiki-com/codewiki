---
title: Transformer Architecture Complete Guide
description: Master the Transformer architecture powering modern AI
track: ai
section: deep-learning
difficulty: advanced
tags:
  - Transformer
  - Attention
  - NLP
  - Deep Learning
status: imported
origin: old/src/content/docs/ai/transformer-architecture.en.md
divergence: 0.201
issues: []
legacy:
  category: AI
  subcategory: Deep Learning
  order: 2
  lastUpdated: 2026-01-07
---

The Transformer is one of the most revolutionary architectures in modern deep learning, first introduced by the Google team in the 2017 paper "Attention Is All You Need." It fundamentally changed the research direction in Natural Language Processing (NLP) and has gradually expanded to computer vision, speech recognition, and many other domains. This comprehensive guide explores the core concepts, technical details, and practical applications of the Transformer architecture.

---

## Why Transformers?

Before the Transformer emerged, sequence-to-sequence (Seq2Seq) tasks primarily relied on Recurrent Neural Networks (RNNs) and their variants, such as LSTM and GRU. These models had several critical limitations:

1. **Sequential Computation Constraint**: RNNs must process inputs step by step in temporal order, making parallelization impossible and training inefficient
2. **Long-Range Dependency Problem**: Although LSTM alleviates the vanishing gradient problem through gating mechanisms, handling very long sequences remains challenging
3. **Computational Complexity**: For a sequence of length n, RNN's time complexity is O(n), and it cannot leverage modern GPUs' parallel computing capabilities

The Transformer perfectly solves these problems through the **Self-Attention Mechanism**:

- Allows the model to directly attend to information at any position in the sequence, regardless of distance
- Supports highly parallelized computation, dramatically improving training speed
- Captures different levels of semantic information through multi-head attention

### Core Philosophy

The Transformer's core idea can be summarized as: "Attention is all you need." It completely abandons recurrent and convolutional structures, relying solely on attention mechanisms to capture global dependencies in the input sequence. This design enables the model to:

- Process the entire sequence in parallel
- Directly model relationships between any two positions
- Learn increasingly abstract representations by stacking multiple layers

---

## Attention Mechanism

The attention mechanism was originally developed for sequence-to-sequence models to help decoders focus on relevant parts of the input sequence. The fundamental intuition is that when generating an output, not all input elements are equally important.

### The Intuition Behind Attention

Imagine you're translating a sentence from English to French. When generating each French word, you don't give equal weight to all English words. Instead, you "attend" to the most relevant English words for that particular French word.

### Mathematical Formulation

Given a query vector **q**, a set of key vectors **K**, and corresponding value vectors **V**, the attention output is computed as a weighted sum of values, where weights are determined by query-key compatibility.

The score function measures the compatibility between the query and each key. Common scoring functions include:

- **Dot Product**: score(q, k) = q^T k
- **Scaled Dot Product**: score(q, k) = (q^T k) / sqrt(d_k)
- **Additive (Bahdanau)**: score(q, k) = v^T tanh(W_q q + W_k k)

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import math

def basic_attention(query, keys, values):
    """
    Basic attention mechanism implementation.

    Args:
        query: (batch_size, query_dim)
        keys: (batch_size, seq_len, key_dim)
        values: (batch_size, seq_len, value_dim)

    Returns:
        context: (batch_size, value_dim)
        attention_weights: (batch_size, seq_len)
    """
    # Compute attention scores using dot product
    # query: (batch_size, 1, query_dim) after unsqueeze
    scores = torch.bmm(query.unsqueeze(1), keys.transpose(1, 2))
    # scores: (batch_size, 1, seq_len)

    # Apply softmax to get attention weights
    attention_weights = F.softmax(scores, dim=-1)

    # Compute weighted sum of values
    context = torch.bmm(attention_weights, values)
    # context: (batch_size, 1, value_dim)

    return context.squeeze(1), attention_weights.squeeze(1)
```

---

## Self-Attention

Self-attention (also called intra-attention) is the core component of the Transformer. Unlike traditional attention where queries come from one sequence and keys/values from another, self-attention allows each position in a sequence to attend to all positions within the same sequence.

### Computation Process

Given an input sequence embedding X (with dimensions n x d, where n is sequence length and d is embedding dimension), the self-attention computation proceeds as follows:

**Step 1: Linear Transformations to Generate Q, K, V**

```
Q = X @ W_Q
K = X @ W_K  
V = X @ W_V
```

Where:
- **Query (Q)**: Represents what the current position wants to query
- **Key (K)**: Represents the features each position can be queried by
- **Value (V)**: Represents the actual information each position contains

**Step 2: Compute Attention Scores**

```
Attention(Q, K, V) = softmax(Q @ K^T / sqrt(d_k)) @ V
```

The division by sqrt(d_k) prevents the dot products from becoming too large, which would push the softmax function into regions with extremely small gradients.

### Intuitive Understanding

Self-attention can be understood as a **soft dictionary lookup**:
- Query is the question you want to ask
- Key is the index for each entry in the dictionary
- Value is the content of each entry
- By computing similarity between Query and all Keys, we get weighting coefficients
- The final output is a weighted sum of all Values

### Implementation

```python
class SelfAttention(nn.Module):
    """Self-Attention mechanism implementation."""

    def __init__(self, embed_dim, dropout=0.1):
        super().__init__()
        self.embed_dim = embed_dim

        # Linear transformation layers
        self.W_q = nn.Linear(embed_dim, embed_dim)
        self.W_k = nn.Linear(embed_dim, embed_dim)
        self.W_v = nn.Linear(embed_dim, embed_dim)

        self.dropout = nn.Dropout(dropout)
        self.scale = math.sqrt(embed_dim)

    def forward(self, x, mask=None):
        """
        Args:
            x: Input tensor of shape (batch_size, seq_len, embed_dim)
            mask: Optional mask tensor
        Returns:
            Attention output and attention weights
        """
        # Compute Q, K, V
        Q = self.W_q(x)  # (batch_size, seq_len, embed_dim)
        K = self.W_k(x)
        V = self.W_v(x)

        # Compute attention scores
        # (batch_size, seq_len, seq_len)
        attn_scores = torch.matmul(Q, K.transpose(-2, -1)) / self.scale

        # Apply mask (if provided)
        if mask is not None:
            attn_scores = attn_scores.masked_fill(mask == 0, float('-inf'))

        # Softmax normalization
        attn_weights = F.softmax(attn_scores, dim=-1)
        attn_weights = self.dropout(attn_weights)

        # Weighted sum
        output = torch.matmul(attn_weights, V)

        return output, attn_weights
```

### Why Scale by sqrt(d_k)?

When the dimension d_k is large, the dot products Q * K grow large in magnitude. This pushes the softmax function into regions where it has extremely small gradients, making learning difficult. By scaling by 1/sqrt(d_k), we keep the variance of the dot products at approximately 1, ensuring effective gradient flow.

---

## Multi-Head Attention

A single self-attention mechanism can only capture one type of dependency relationship. To enable the model to simultaneously attend to information from different representation subspaces, the Transformer introduces **Multi-Head Attention**.

### Design Principles

Multi-Head Attention projects Q, K, V into h different subspaces, computes attention independently in each subspace, and then concatenates the results:

```
MultiHead(Q, K, V) = Concat(head_1, ..., head_h) @ W_O
```

Where each head is computed as:

```
head_i = Attention(Q @ W_i^Q, K @ W_i^K, V @ W_i^V)
```

### Advantages

1. **Multi-Perspective Attention**: Different heads can focus on different types of information, such as syntactic relationships, semantic relationships, positional relationships, etc.
2. **Enhanced Expressiveness**: The combination of multiple subspaces provides richer representational capacity
3. **Computational Efficiency**: Although there are multiple heads, each head's dimension is correspondingly reduced, keeping total computation constant

### Implementation

```python
class MultiHeadAttention(nn.Module):
    """Multi-Head Attention mechanism implementation."""

    def __init__(self, embed_dim, num_heads, dropout=0.1):
        super().__init__()
        assert embed_dim % num_heads == 0, "embed_dim must be divisible by num_heads"

        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads

        # Combined linear transformation (more efficient)
        self.W_qkv = nn.Linear(embed_dim, 3 * embed_dim)
        self.W_o = nn.Linear(embed_dim, embed_dim)

        self.dropout = nn.Dropout(dropout)
        self.scale = math.sqrt(self.head_dim)

    def forward(self, x, mask=None):
        """
        Args:
            x: Input tensor of shape (batch_size, seq_len, embed_dim)
            mask: Optional mask tensor
        Returns:
            Multi-head attention output
        """
        batch_size, seq_len, _ = x.shape

        # Compute Q, K, V in one operation
        qkv = self.W_qkv(x)  # (batch_size, seq_len, 3 * embed_dim)
        qkv = qkv.reshape(batch_size, seq_len, 3, self.num_heads, self.head_dim)
        qkv = qkv.permute(2, 0, 3, 1, 4)  # (3, batch_size, num_heads, seq_len, head_dim)
        Q, K, V = qkv[0], qkv[1], qkv[2]

        # Compute attention scores
        # (batch_size, num_heads, seq_len, seq_len)
        attn_scores = torch.matmul(Q, K.transpose(-2, -1)) / self.scale

        if mask is not None:
            attn_scores = attn_scores.masked_fill(mask == 0, float('-inf'))

        attn_weights = F.softmax(attn_scores, dim=-1)
        attn_weights = self.dropout(attn_weights)

        # Weighted sum and merge heads
        # (batch_size, num_heads, seq_len, head_dim)
        attn_output = torch.matmul(attn_weights, V)

        # Reshape and project
        attn_output = attn_output.transpose(1, 2).reshape(batch_size, seq_len, self.embed_dim)
        output = self.W_o(attn_output)

        return output
```

### Visualizing Multi-Head Attention

Each attention head learns to focus on different aspects of the input:

```
Head 1: Captures syntactic dependencies (subject-verb agreement)
Head 2: Captures semantic relationships (word meanings)
Head 3: Captures positional patterns (adjacent words)
Head 4: Captures long-range dependencies (pronouns to antecedents)
...
```

---

## Positional Encoding

Since the Transformer is entirely based on attention mechanisms, it inherently lacks the ability to capture sequence order information. To enable the model to utilize positional information, **Positional Encoding** is introduced.

### Sinusoidal Positional Encoding

The original Transformer uses sine and cosine functions to generate positional encodings:

```
PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```

Where pos is the position index and i is the dimension index.

### Design Rationale

This encoding method has several advantages:
1. **Uniqueness**: Each position has a unique encoding
2. **Boundedness**: Values are bounded between [-1, 1], not growing with position
3. **Relative Position Representation**: For a fixed offset k, PE(pos+k) can be expressed as a linear function of PE(pos)
4. **Generalization**: Can extrapolate to sequence lengths not seen during training

### Learnable Positional Encoding

BERT and other models use learnable positional embeddings, treating position encodings as trainable parameters:

```python
class PositionalEncoding(nn.Module):
    """Sinusoidal Positional Encoding."""

    def __init__(self, embed_dim, max_len=5000, dropout=0.1):
        super().__init__()
        self.dropout = nn.Dropout(dropout)

        # Create positional encoding matrix
        pe = torch.zeros(max_len, embed_dim)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(
            torch.arange(0, embed_dim, 2).float() * (-math.log(10000.0) / embed_dim)
        )

        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)  # (1, max_len, embed_dim)

        # Register as buffer (not updated by gradient)
        self.register_buffer('pe', pe)

    def forward(self, x):
        """
        Args:
            x: Input tensor of shape (batch_size, seq_len, embed_dim)
        """
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)


class LearnablePositionalEncoding(nn.Module):
    """Learnable Positional Encoding."""

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

### Modern Position Encodings

Recent research has introduced several alternatives:

1. **Rotary Position Embedding (RoPE)**: Used in LLaMA, encodes position through rotation matrices
2. **ALiBi (Attention with Linear Biases)**: Adds linear biases to attention scores based on position distance
3. **Relative Position Encoding**: Encodes relative positions between tokens rather than absolute positions

```python
class RotaryPositionalEncoding(nn.Module):
    """Rotary Position Embedding (RoPE) - simplified implementation."""

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

## Encoder-Decoder Architecture

The complete Transformer consists of an **Encoder** and a **Decoder**.

### Encoder Structure

The encoder is composed of N identical stacked layers, each containing two sub-layers:
1. **Multi-Head Self-Attention Layer**
2. **Feed-Forward Network (FFN)**

Each sub-layer applies **residual connection** and **layer normalization**:

```
output = LayerNorm(x + Sublayer(x))
```

### Decoder Structure

The decoder also consists of N identical stacked layers, but each layer contains three sub-layers:
1. **Masked Multi-Head Self-Attention** (prevents attending to future positions)
2. **Encoder-Decoder Attention** (Cross-Attention)
3. **Feed-Forward Network**

The masked attention ensures that when generating output at position i, the model can only attend to positions before i, preventing information leakage.

### Feed-Forward Network

The FFN consists of two linear transformations with a non-linear activation in between:

```
FFN(x) = GELU(x @ W_1 + b_1) @ W_2 + b_2
```

### Complete Implementation

```python
class TransformerEncoderLayer(nn.Module):
    """Transformer Encoder Layer."""

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
        # Self-attention + residual + layer norm
        attn_output = self.self_attn(x, mask)
        x = self.norm1(x + self.dropout(attn_output))

        # FFN + residual + layer norm
        ffn_output = self.ffn(x)
        x = self.norm2(x + ffn_output)

        return x


class TransformerDecoderLayer(nn.Module):
    """Transformer Decoder Layer."""

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
        # Masked self-attention
        attn_output = self.self_attn(x, tgt_mask)
        x = self.norm1(x + self.dropout(attn_output))

        # Cross-attention (uses encoder output as K, V)
        cross_output = self.cross_attn(x, src_mask)
        x = self.norm2(x + self.dropout(cross_output))

        # FFN
        ffn_output = self.ffn(x)
        x = self.norm3(x + ffn_output)

        return x


class Transformer(nn.Module):
    """Complete Transformer Model."""

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

        # Embedding layer
        self.embedding = nn.Embedding(vocab_size, embed_dim)
        self.pos_encoding = PositionalEncoding(embed_dim, max_len, dropout)

        # Encoder
        self.encoder_layers = nn.ModuleList([
            TransformerEncoderLayer(embed_dim, num_heads, ff_dim, dropout)
            for _ in range(num_encoder_layers)
        ])

        # Decoder
        self.decoder_layers = nn.ModuleList([
            TransformerDecoderLayer(embed_dim, num_heads, ff_dim, dropout)
            for _ in range(num_decoder_layers)
        ])

        # Output layer
        self.fc_out = nn.Linear(embed_dim, vocab_size)

        self.embed_dim = embed_dim
        self._init_parameters()

    def _init_parameters(self):
        """Initialize parameters with Xavier uniform."""
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

The original Transformer uses **Post-LN** (residual then normalization):
```
output = LayerNorm(x + Sublayer(x))
```

Later research found **Pre-LN** (normalization then residual) to be more stable:
```
output = x + Sublayer(LayerNorm(x))
```

Pre-LN advantages:
- More stable training, less prone to gradient explosion
- Can use larger learning rates
- Doesn't require warmup strategy

---

## BERT vs GPT

BERT and GPT are two representative models based on the Transformer architecture, employing different design philosophies.

### Architecture Comparison

| Feature | BERT | GPT |
|---------|------|-----|
| Components Used | Encoder only | Decoder only |
| Attention Direction | Bidirectional | Unidirectional (causal) |
| Training Objective | MLM + NSP | Autoregressive LM |
| Position Encoding | Learnable | Learnable |
| Typical Applications | Understanding tasks | Generation tasks |

### BERT's Design

BERT (Bidirectional Encoder Representations from Transformers) uses bidirectional attention through two pre-training tasks:

1. **Masked Language Model (MLM)**: Randomly masks 15% of tokens in the input and trains the model to predict the masked words
2. **Next Sentence Prediction (NSP)**: Determines whether two sentences are consecutive

```python
class BERTModel(nn.Module):
    """Simplified BERT Model implementation."""

    def __init__(self, vocab_size, embed_dim=768, num_heads=12,
                 num_layers=12, ff_dim=3072, max_len=512, dropout=0.1):
        super().__init__()

        # Token, Segment, and Position embeddings
        self.token_embedding = nn.Embedding(vocab_size, embed_dim)
        self.segment_embedding = nn.Embedding(2, embed_dim)
        self.position_embedding = nn.Embedding(max_len, embed_dim)

        self.norm = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(dropout)

        # Transformer encoder layers
        self.layers = nn.ModuleList([
            TransformerEncoderLayer(embed_dim, num_heads, ff_dim, dropout)
            for _ in range(num_layers)
        ])

    def forward(self, input_ids, segment_ids, attention_mask=None):
        seq_len = input_ids.size(1)
        positions = torch.arange(seq_len, device=input_ids.device).unsqueeze(0)

        # Combine three embeddings
        x = (self.token_embedding(input_ids) +
             self.segment_embedding(segment_ids) +
             self.position_embedding(positions))
        x = self.dropout(self.norm(x))

        for layer in self.layers:
            x = layer(x, attention_mask)

        return x
```

### GPT's Design

GPT (Generative Pre-trained Transformer) uses unidirectional attention (causal mask) to generate text autoregressively:

```python
class GPTModel(nn.Module):
    """Simplified GPT Model implementation."""

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

        # Weight tying
        self.lm_head.weight = self.token_embedding.weight

    def forward(self, input_ids):
        seq_len = input_ids.size(1)
        positions = torch.arange(seq_len, device=input_ids.device).unsqueeze(0)

        x = self.token_embedding(input_ids) + self.position_embedding(positions)
        x = self.dropout(x)

        # Create causal mask
        causal_mask = torch.triu(
            torch.ones(seq_len, seq_len, device=input_ids.device),
            diagonal=1
        ).bool()
        causal_mask = ~causal_mask  # Invert: True means can attend

        for layer in self.layers:
            x = layer(x, causal_mask)

        x = self.norm(x)
        logits = self.lm_head(x)

        return logits
```

### Evolution of Language Models

| Model | Year | Parameters | Key Innovation |
|-------|------|------------|----------------|
| BERT-base | 2018 | 110M | Bidirectional pre-training |
| GPT-2 | 2019 | 1.5B | Scale + zero-shot |
| GPT-3 | 2020 | 175B | Few-shot learning |
| GPT-4 | 2023 | ~1.7T (est.) | Multimodal + RLHF |
| LLaMA | 2023 | 7B-70B | Efficient training |

---

## Vision Transformers (ViT)

Vision Transformer successfully applies the Transformer architecture to computer vision tasks, demonstrating the architecture's generality.

### Core Idea

ViT divides an image into fixed-size patches, linearly projects each patch into an embedding, then processes these patch embeddings just like a text sequence.

### Implementation Steps

1. **Image Patching**: Divide an H x W image into N patches of size P x P
2. **Patch Embedding**: Flatten each patch and linearly project to D-dimensional space
3. **Add Position Encoding**: Add learnable positional embeddings
4. **Add CLS Token**: Prepend a classification token to the sequence
5. **Transformer Encoding**: Process through multiple Transformer Encoder layers
6. **Classification Output**: Use the CLS token output for classification

```python
class PatchEmbedding(nn.Module):
    """Image Patch Embedding."""

    def __init__(self, img_size=224, patch_size=16, in_channels=3, embed_dim=768):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.num_patches = (img_size // patch_size) ** 2

        # Use convolution to implement patch embedding
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
    """Vision Transformer (ViT) Model."""

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

        # Patch embedding
        self.patch_embed = PatchEmbedding(
            img_size, patch_size, in_channels, embed_dim
        )
        num_patches = self.patch_embed.num_patches

        # CLS token and position embeddings
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, embed_dim))
        self.dropout = nn.Dropout(dropout)

        # Transformer encoder
        self.layers = nn.ModuleList([
            TransformerEncoderLayer(embed_dim, num_heads, ff_dim, dropout)
            for _ in range(num_layers)
        ])

        self.norm = nn.LayerNorm(embed_dim)
        self.head = nn.Linear(embed_dim, num_classes)

        # Initialization
        nn.init.trunc_normal_(self.cls_token, std=0.02)
        nn.init.trunc_normal_(self.pos_embed, std=0.02)

    def forward(self, x):
        batch_size = x.shape[0]

        # Patch embedding
        x = self.patch_embed(x)

        # Add CLS token
        cls_tokens = self.cls_token.expand(batch_size, -1, -1)
        x = torch.cat([cls_tokens, x], dim=1)

        # Add position encoding
        x = x + self.pos_embed
        x = self.dropout(x)

        # Transformer encoding
        for layer in self.layers:
            x = layer(x)

        x = self.norm(x)

        # Use CLS token for classification
        cls_output = x[:, 0]
        logits = self.head(cls_output)

        return logits
```

### ViT Variants and Extensions

| Model | Innovation | Key Feature |
|-------|------------|-------------|
| DeiT | Data-efficient training | Knowledge distillation |
| Swin Transformer | Hierarchical windows | Shifted window attention |
| BEiT | Masked image modeling | BERT-style pre-training |
| CLIP | Contrastive learning | Text-image alignment |
| DINO | Self-supervised | No labels needed |

---

## Implementation Details

### Mask Types

Understanding different mask types is crucial for correct Transformer implementation:

```python
def create_causal_mask(seq_len, device='cpu'):
    """
    Create causal mask for autoregressive generation.
    Prevents attending to future positions.
    """
    mask = torch.triu(torch.ones(seq_len, seq_len, device=device), diagonal=1)
    return mask == 0  # True means can attend


def create_padding_mask(seq, pad_idx=0):
    """
    Create padding mask to ignore padding tokens.
    """
    return (seq != pad_idx).unsqueeze(1).unsqueeze(2)


def create_masks(src, tgt, pad_idx=0):
    """Create all necessary masks for Transformer."""

    # Source padding mask: (batch_size, 1, 1, src_len)
    src_mask = (src != pad_idx).unsqueeze(1).unsqueeze(2)

    # Target padding mask: (batch_size, 1, 1, tgt_len)
    tgt_padding_mask = (tgt != pad_idx).unsqueeze(1).unsqueeze(2)

    # Causal mask: (1, 1, tgt_len, tgt_len)
    tgt_len = tgt.size(1)
    causal_mask = torch.tril(torch.ones(tgt_len, tgt_len)).unsqueeze(0).unsqueeze(0)

    # Combined target mask
    tgt_mask = tgt_padding_mask & causal_mask.bool()

    return src_mask, tgt_mask
```

### Label Smoothing

Label smoothing is a regularization technique that prevents the model from becoming overconfident:

```python
class LabelSmoothingLoss(nn.Module):
    """Label Smoothing Cross-Entropy Loss."""

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

### Learning Rate Schedule

The original Transformer uses a special learning rate schedule with warmup:

```python
class TransformerLRScheduler:
    """
    Learning rate scheduler as described in the original paper.
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

### Efficient Attention Implementations

Modern implementations use optimized attention computations:

```python
# Using PyTorch's scaled_dot_product_attention (Flash Attention compatible)
def efficient_attention(Q, K, V, mask=None):
    """
    Efficient attention using PyTorch 2.0+ scaled_dot_product_attention.
    Automatically uses Flash Attention when available.
    """
    return F.scaled_dot_product_attention(
        Q, K, V,
        attn_mask=mask,
        dropout_p=0.0,
        is_causal=False
    )
```

---

## Interview Key Points

### Basic Concept Questions

**Q1: Why does Transformer divide by sqrt(d_k)?**

A: When d_k is large, the dot products Q and K become large in magnitude. This pushes the softmax function into regions with extremely small gradients (gradient saturation). Dividing by sqrt(d_k) keeps the variance of the dot products at approximately 1, ensuring effective gradient propagation.

**Q2: What is the purpose of multi-head attention?**

A: Multi-head attention allows the model to simultaneously attend to information from different representation subspaces, improving the model's expressiveness. Different heads may learn different types of information: syntactic dependencies, semantic relationships, positional relationships, etc.

**Q3: Why does Transformer need positional encoding?**

A: The self-attention mechanism of Transformer is permutation invariant - shuffling input order doesn't affect the output. Positional encoding provides sequence order information to the model, allowing it to distinguish tokens at different positions.

### Advanced Questions

**Q4: What are the main differences between BERT and GPT?**

A:
- BERT uses bidirectional attention (sees full context), GPT uses unidirectional attention (only sees left context)
- BERT uses MLM pre-training (fill-in-the-blank), GPT uses autoregressive pre-training (predict next token)
- BERT is better suited for understanding tasks, GPT for generation tasks

**Q5: Difference between Layer Normalization and Batch Normalization?**

A:
- BN normalizes across batch dimension, LN normalizes across feature dimension
- LN doesn't depend on batch size, better suited for sequence models
- LN behavior is consistent between training and inference

**Q6: How can we reduce Transformer's computational complexity?**

A:
- Sparse Attention (e.g., Longformer, BigBird)
- Linear Attention (e.g., Performer, Linear Transformer)
- Local attention + global tokens
- Low-rank decomposition
- Flash Attention and other efficient implementations
- Mixture of Experts (MoE)

### System Design Questions

**Q7: How would you design a large-scale Transformer training system?**

A:
- **Data Parallelism**: Distribute data across GPUs
- **Model Parallelism**: Split model across GPUs (tensor parallel, pipeline parallel)
- **Mixed Precision Training**: Use FP16/BF16 to reduce memory
- **Gradient Checkpointing**: Trade compute for memory
- **ZeRO Optimization**: Partition optimizer states
- **Flash Attention**: Memory-efficient attention computation

**Q8: How do you handle very long sequences?**

A:
- Sliding window attention
- Hierarchical attention
- Memory/retrieval augmentation
- Sparse attention patterns
- State space models (Mamba, RWKV)

### Code Implementation Questions

**Q9: Implement causal mask and padding mask**

```python
def create_all_masks(src, tgt, pad_idx=0):
    """Create all necessary masks for Transformer."""

    # Source padding mask
    src_mask = (src != pad_idx).unsqueeze(1).unsqueeze(2)

    # Target padding mask
    tgt_padding_mask = (tgt != pad_idx).unsqueeze(1).unsqueeze(2)

    # Causal mask
    tgt_len = tgt.size(1)
    causal_mask = torch.tril(torch.ones(tgt_len, tgt_len)).unsqueeze(0).unsqueeze(0)

    # Combined target mask
    tgt_mask = tgt_padding_mask & causal_mask.bool()

    return src_mask, tgt_mask
```

**Q10: Implement a simple text generation function**

```python
def generate(model, prompt_ids, max_len=50, temperature=1.0, top_k=50):
    """
    Generate text using a GPT-style model.

    Args:
        model: Trained GPT model
        prompt_ids: Starting token IDs (batch_size, seq_len)
        max_len: Maximum generation length
        temperature: Sampling temperature
        top_k: Top-k sampling parameter
    """
    model.eval()
    generated = prompt_ids.clone()
    EOS_TOKEN_ID = 2  # Example EOS token

    with torch.no_grad():
        for _ in range(max_len):
            # Get logits for the last position
            logits = model(generated)[:, -1, :]

            # Apply temperature
            logits = logits / temperature

            # Top-k filtering
            if top_k > 0:
                indices_to_remove = logits < torch.topk(logits, top_k)[0][..., -1, None]
                logits[indices_to_remove] = float('-inf')

            # Sample from distribution
            probs = F.softmax(logits, dim=-1)
            next_token = torch.multinomial(probs, num_samples=1)

            # Append to sequence
            generated = torch.cat([generated, next_token], dim=1)

            # Stop if EOS token
            if next_token.item() == EOS_TOKEN_ID:
                break

    return generated
```

---

## Further Reading

### Foundational Papers

1. **"Attention Is All You Need"** (2017) - Original Transformer paper
   - Vaswani et al., Google Brain
   - Introduced self-attention and the Transformer architecture

2. **"BERT: Pre-training of Deep Bidirectional Transformers"** (2018)
   - Devlin et al., Google AI Language
   - Bidirectional pre-training revolutionized NLP

3. **"Language Models are Unsupervised Multitask Learners"** (2019) - GPT-2
   - Radford et al., OpenAI
   - Demonstrated emergent abilities through scale

4. **"An Image is Worth 16x16 Words"** (2020) - ViT
   - Dosovitskiy et al., Google Brain
   - Extended Transformers to computer vision

5. **"FlashAttention: Fast and Memory-Efficient Exact Attention"** (2022)
   - Dao et al., Stanford
   - Hardware-aware efficient attention implementation

### Recommended Resources

- **The Illustrated Transformer** by Jay Alammar - Best visual tutorial
- **Hugging Face Transformers Library** - Industrial-grade implementations
- **Harvard NLP: The Annotated Transformer** - Annotated PyTorch implementation
- **Stanford CS224N** - Natural Language Processing course
- **Andrej Karpathy's "Let's build GPT"** - From scratch implementation

### Advanced Topics

1. **Efficient Transformers**
   - Linformer, Performer, Longformer
   - FlashAttention, PagedAttention
   - Mixture of Experts (MoE)

2. **Multimodal Transformers**
   - CLIP, DALL-E, Flamingo
   - LLaVA, GPT-4V
   - Audio: Whisper, AudioLM

3. **Large-Scale Pre-training**
   - Model parallelism, data parallelism, pipeline parallelism
   - Mixed precision training, gradient checkpointing
   - RLHF and alignment techniques

4. **Transformer Theory**
   - Expressiveness analysis of attention mechanisms
   - Theoretical foundations of positional encoding
   - Scaling Laws (Chinchilla, GPT-4)

### Open Source Implementations

- **Hugging Face Transformers**: Comprehensive model hub
- **PyTorch**: Native Transformer modules
- **JAX/Flax**: High-performance implementations
- **llama.cpp**: Efficient CPU inference
- **vLLM**: High-throughput serving

---

## Summary

The Transformer architecture achieves efficient parallel processing of sequential data through the self-attention mechanism, becoming the foundational architecture of modern deep learning. Understanding its core components (self-attention, multi-head attention, positional encoding, layer normalization) and their design principles is crucial for fully understanding current mainstream large language models and vision models.

Key takeaways:

1. **Self-attention** enables direct modeling of relationships between any positions in a sequence
2. **Multi-head attention** captures different types of dependencies simultaneously
3. **Positional encoding** provides necessary sequence order information
4. **Residual connections and layer normalization** enable training of deep networks
5. **The encoder-decoder structure** is flexible - BERT uses encoder-only, GPT uses decoder-only

As research continues, Transformers keep evolving in efficiency optimization, multimodal fusion, and long-sequence processing. They will remain one of the most important architectures in deep learning, powering the next generation of AI systems.
