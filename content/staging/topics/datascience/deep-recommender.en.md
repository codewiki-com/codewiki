---
title: 推荐系统：深度学习方法
description: 掌握深度推荐模型：Wide & Deep、DeepFM、DIN和双塔模型
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - 深度学习
  - 推荐系统
  - DeepFM
  - 双塔模型
status: imported
origin: old/src/content/docs/datascience/deep-recommender.en.md
divergence: 0.184
issues:
  - title-lang-en
  - title-language
legacy:
  category: DataScience
  subcategory: Recommender
  order: 25
  lastUpdated: 2026-01-07
---

The rise of deep learning has brought revolutionary changes to recommender systems. Compared to traditional collaborative filtering and matrix factorization methods, deep recommendation models can automatically learn feature interactions, capture temporal dependencies in user behavior sequences, and support multimodal information fusion. This article covers the core model architectures and engineering practices of deep recommender systems.

---

## Evolution of Deep Recommender Systems

### Development History of Recommender Systems

Recommender systems have evolved from collaborative filtering to deep learning:

| Stage | Representative Methods | Characteristics | Limitations |
|-------|----------------------|-----------------|-------------|
| Traditional Methods | UserCF, ItemCF | Simple and intuitive | Sparsity, cold start |
| Matrix Factorization | SVD, ALS, FM | Latent vector representation | Linear interactions |
| Deep Learning | Wide&Deep, DeepFM | Automatic feature interaction | Computationally complex |
| Sequential Modeling | DIN, DIEN, SASRec | Interest evolution | Long sequence modeling |
| Large-scale Retrieval | Two-tower models, MIND | Efficient recall | Ranking precision |

### Core Advantages of Deep Recommendation

**1. Automatic Feature Interaction**

Traditional methods require manually designing feature combinations, while deep models can automatically learn high-order feature interactions:

$$\text{Traditional: } y = w_1 x_1 + w_2 x_2 + w_{12} x_1 x_2 + ...$$

$$\text{Deep: } y = f(x_1, x_2, ..., x_n) \text{ (automatically learns arbitrary-order interactions)}$$

**2. Multimodal Information Fusion**

Deep models can easily integrate different types of features:
- User profile features (dense features)
- Item attribute features (categorical features)
- Behavioral sequence features (sequential features)
- Image and text content features (multimodal features)

**3. End-to-End Learning**

The entire pipeline from raw features to final prediction can be optimized end-to-end:

```
Raw Features -> Embedding -> Feature Interaction -> Deep Network -> Prediction
```

### Recommender System Architecture

Modern recommender systems typically adopt a multi-stage architecture:

```
Candidate Pool (millions)
    | Recall Layer (two-tower models, multi-channel recall)
Coarse Ranking Set (tens of thousands)
    | Coarse Ranking Layer (simple models for quick filtering)
Fine Ranking Set (thousands)
    | Fine Ranking Layer (complex models for precise ranking)
Re-ranking Set (hundreds)
    | Re-ranking Layer (diversity, business rules)
Display Results (tens)
```

---

## Wide & Deep Model

### Model Motivation

Google proposed the Wide & Deep model in 2016, aiming to simultaneously achieve:
- **Memorization**: Remember direct feature combinations from historical data
- **Generalization**: Learn latent relationships between features through deep networks

### Model Structure

Wide & Deep consists of two parts:

**Wide Part (Linear Model):**

$$y_{wide} = \mathbf{w}^T [\mathbf{x}, \phi(\mathbf{x})] + b$$

Where $\phi(\mathbf{x})$ represents manually designed cross features.

**Deep Part (Deep Neural Network):**

$$\mathbf{a}^{(l+1)} = f(W^{(l)} \mathbf{a}^{(l)} + \mathbf{b}^{(l)})$$

**Joint Training:**

$$P(y=1|\mathbf{x}) = \sigma(y_{wide} + y_{deep})$$

### PyTorch Implementation

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class WideAndDeep(nn.Module):
    """
    Wide & Deep Model

    Parameters:
        wide_dim: Input dimension for Wide part (including cross features)
        deep_input_dims: List of dimensions for each feature field in Deep part
        embed_dim: Embedding dimension
        hidden_dims: List of hidden layer dimensions
        num_classes: Number of output classes (1 for binary classification)
        dropout: Dropout rate
    """
    def __init__(
        self,
        wide_dim: int,
        deep_input_dims: list,
        embed_dim: int = 8,
        hidden_dims: list = [256, 128, 64],
        num_classes: int = 1,
        dropout: float = 0.2
    ):
        super().__init__()

        # Wide part: Linear layer
        self.wide = nn.Linear(wide_dim, num_classes)

        # Deep part: Embedding layers
        self.embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in deep_input_dims
        ])

        # Deep part: MLP layers
        deep_input_dim = len(deep_input_dims) * embed_dim
        layers = []
        prev_dim = deep_input_dim

        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout)
            ])
            prev_dim = hidden_dim

        layers.append(nn.Linear(prev_dim, num_classes))
        self.deep = nn.Sequential(*layers)

    def forward(self, wide_input, deep_inputs):
        """
        Forward pass

        Parameters:
            wide_input: Wide part input (batch_size, wide_dim)
            deep_inputs: Deep part input list [(batch_size,), ...]

        Returns:
            Prediction logits (batch_size, num_classes)
        """
        # Wide part
        wide_out = self.wide(wide_input)

        # Deep part: Embedding
        embed_list = [
            emb(deep_inputs[i])
            for i, emb in enumerate(self.embeddings)
        ]
        deep_input = torch.cat(embed_list, dim=-1)

        # Deep part: MLP
        deep_out = self.deep(deep_input)

        # Joint output
        output = wide_out + deep_out
        return output


# Usage example
def demo_wide_and_deep():
    # Simulated data
    batch_size = 32
    wide_dim = 100  # Wide feature dimension

    # Deep part: Assume 5 categorical features, each with different cardinalities
    deep_input_dims = [1000, 500, 100, 50, 20]  # User ID, Item ID, Category, etc.

    # Create model
    model = WideAndDeep(
        wide_dim=wide_dim,
        deep_input_dims=deep_input_dims,
        embed_dim=16,
        hidden_dims=[256, 128, 64]
    )

    # Simulated input
    wide_input = torch.randn(batch_size, wide_dim)
    deep_inputs = [
        torch.randint(0, dim, (batch_size,))
        for dim in deep_input_dims
    ]

    # Forward pass
    output = model(wide_input, deep_inputs)
    print(f"Output shape: {output.shape}")  # (32, 1)

    # Compute prediction probability
    prob = torch.sigmoid(output)
    print(f"Prediction probability range: [{prob.min():.4f}, {prob.max():.4f}]")


if __name__ == "__main__":
    demo_wide_and_deep()
```

### Advantages and Disadvantages of Wide & Deep

**Advantages:**
- Combines the strengths of linear models and deep models
- Wide part can memorize important feature combinations
- Deep part can generalize to unseen feature combinations

**Disadvantages:**
- Wide part requires manually designed cross features
- Feature engineering is still important
- Model structure is relatively simple

---

## DeepFM Model

### Model Motivation

DeepFM (2017) builds upon Wide & Deep by replacing the Wide part with FM (Factorization Machine), achieving automatic second-order feature interaction without manual feature engineering.

### FM Factorization Machine

FM achieves feature interaction through latent vectors:

$$y_{FM} = w_0 + \sum_{i=1}^{n} w_i x_i + \sum_{i=1}^{n} \sum_{j=i+1}^{n} \langle \mathbf{v}_i, \mathbf{v}_j \rangle x_i x_j$$

Where $\mathbf{v}_i$ is the latent vector for feature $i$, and $\langle \cdot, \cdot \rangle$ denotes the inner product.

**FM Computation Optimization:**

The second-order interaction term can be optimized to $O(nk)$ complexity:

$$\sum_{i=1}^{n} \sum_{j=i+1}^{n} \langle \mathbf{v}_i, \mathbf{v}_j \rangle x_i x_j = \frac{1}{2} \sum_{f=1}^{k} \left[ \left( \sum_{i=1}^{n} v_{i,f} x_i \right)^2 - \sum_{i=1}^{n} v_{i,f}^2 x_i^2 \right]$$

### DeepFM Model Structure

```
Input Features
    |
Embedding Layer (shared)
    |
  +-----+-----+
  |           |
FM Layer    DNN Layer
  |           |
  +-----+-----+
        |
   Joint Output
```

### PyTorch Implementation

```python
import torch
import torch.nn as nn


class FMLayer(nn.Module):
    """
    FM Factorization Machine Layer
    Implements second-order feature interaction
    """
    def __init__(self):
        super().__init__()

    def forward(self, embeddings):
        """
        Parameters:
            embeddings: (batch_size, num_fields, embed_dim)
        Returns:
            fm_output: (batch_size, 1)
        """
        # Optimized computation O(n*k)
        # sum_of_square: (batch_size, embed_dim)
        sum_of_square = torch.sum(embeddings, dim=1) ** 2
        # square_of_sum: (batch_size, embed_dim)
        square_of_sum = torch.sum(embeddings ** 2, dim=1)
        # Second-order interaction: (batch_size, 1)
        fm_output = 0.5 * torch.sum(sum_of_square - square_of_sum, dim=1, keepdim=True)

        return fm_output


class DeepFM(nn.Module):
    """
    DeepFM Model

    Parameters:
        feature_dims: List of dimensions for each feature field
        embed_dim: Embedding dimension
        hidden_dims: DNN hidden layer dimensions
        dropout: Dropout rate
    """
    def __init__(
        self,
        feature_dims: list,
        embed_dim: int = 8,
        hidden_dims: list = [256, 128, 64],
        dropout: float = 0.2
    ):
        super().__init__()

        self.num_fields = len(feature_dims)
        self.embed_dim = embed_dim

        # First-order feature weights
        self.first_order_weights = nn.ModuleList([
            nn.Embedding(dim, 1) for dim in feature_dims
        ])

        # Shared Embedding layer (used for both FM and DNN)
        self.embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in feature_dims
        ])

        # FM layer
        self.fm = FMLayer()

        # DNN layer
        dnn_input_dim = self.num_fields * embed_dim
        layers = []
        prev_dim = dnn_input_dim

        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout)
            ])
            prev_dim = hidden_dim

        layers.append(nn.Linear(prev_dim, 1))
        self.dnn = nn.Sequential(*layers)

        # Bias term
        self.bias = nn.Parameter(torch.zeros(1))

    def forward(self, inputs):
        """
        Parameters:
            inputs: Feature input list [(batch_size,), ...]
        Returns:
            logits: (batch_size, 1)
        """
        # First-order features
        first_order = torch.cat([
            self.first_order_weights[i](inputs[i])
            for i in range(self.num_fields)
        ], dim=1).sum(dim=1, keepdim=True)

        # Get Embedding (shared)
        embeddings = torch.stack([
            self.embeddings[i](inputs[i])
            for i in range(self.num_fields)
        ], dim=1)  # (batch_size, num_fields, embed_dim)

        # FM second-order interaction
        fm_output = self.fm(embeddings)

        # DNN
        dnn_input = embeddings.view(-1, self.num_fields * self.embed_dim)
        dnn_output = self.dnn(dnn_input)

        # Joint output
        output = self.bias + first_order + fm_output + dnn_output

        return output


class DeepFMWithDenseFeatures(nn.Module):
    """
    DeepFM with Dense Features
    Handles both categorical and numerical features
    """
    def __init__(
        self,
        sparse_feature_dims: list,
        dense_feature_dim: int,
        embed_dim: int = 8,
        hidden_dims: list = [256, 128, 64],
        dropout: float = 0.2
    ):
        super().__init__()

        self.num_sparse_fields = len(sparse_feature_dims)
        self.dense_feature_dim = dense_feature_dim
        self.embed_dim = embed_dim

        # Sparse feature Embedding
        self.sparse_embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in sparse_feature_dims
        ])

        # Sparse feature first-order weights
        self.sparse_first_order = nn.ModuleList([
            nn.Embedding(dim, 1) for dim in sparse_feature_dims
        ])

        # Dense feature processing
        self.dense_embedding = nn.Linear(dense_feature_dim,
                                         dense_feature_dim * embed_dim)
        self.dense_first_order = nn.Linear(dense_feature_dim, 1)

        # FM layer
        self.fm = FMLayer()

        # DNN layer
        total_fields = self.num_sparse_fields + dense_feature_dim
        dnn_input_dim = total_fields * embed_dim

        layers = []
        prev_dim = dnn_input_dim
        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout)
            ])
            prev_dim = hidden_dim
        layers.append(nn.Linear(prev_dim, 1))
        self.dnn = nn.Sequential(*layers)

        self.bias = nn.Parameter(torch.zeros(1))

    def forward(self, sparse_inputs, dense_inputs):
        """
        Parameters:
            sparse_inputs: Sparse feature list [(batch_size,), ...]
            dense_inputs: Dense features (batch_size, dense_feature_dim)
        """
        batch_size = dense_inputs.shape[0]

        # First-order features
        sparse_first = torch.cat([
            self.sparse_first_order[i](sparse_inputs[i])
            for i in range(self.num_sparse_fields)
        ], dim=1).sum(dim=1, keepdim=True)

        dense_first = self.dense_first_order(dense_inputs)
        first_order = sparse_first + dense_first

        # Sparse feature Embedding
        sparse_embeds = torch.stack([
            self.sparse_embeddings[i](sparse_inputs[i])
            for i in range(self.num_sparse_fields)
        ], dim=1)  # (batch_size, num_sparse, embed_dim)

        # Dense feature Embedding
        dense_embeds = self.dense_embedding(dense_inputs)
        dense_embeds = dense_embeds.view(
            batch_size, self.dense_feature_dim, self.embed_dim
        )  # (batch_size, dense_dim, embed_dim)

        # Merge all Embeddings
        all_embeds = torch.cat([sparse_embeds, dense_embeds], dim=1)

        # FM interaction
        fm_output = self.fm(all_embeds)

        # DNN
        dnn_input = all_embeds.view(batch_size, -1)
        dnn_output = self.dnn(dnn_input)

        # Output
        output = self.bias + first_order + fm_output + dnn_output
        return output


# Usage example
def demo_deepfm():
    batch_size = 64

    # Define feature dimensions
    sparse_dims = [10000, 5000, 1000, 500, 100]  # 5 categorical features
    dense_dim = 13  # 13 numerical features

    # Create model
    model = DeepFMWithDenseFeatures(
        sparse_feature_dims=sparse_dims,
        dense_feature_dim=dense_dim,
        embed_dim=16,
        hidden_dims=[256, 128, 64]
    )

    # Simulated input
    sparse_inputs = [
        torch.randint(0, dim, (batch_size,))
        for dim in sparse_dims
    ]
    dense_inputs = torch.randn(batch_size, dense_dim)

    # Forward pass
    output = model(sparse_inputs, dense_inputs)
    print(f"DeepFM output shape: {output.shape}")

    # Calculate model parameters
    total_params = sum(p.numel() for p in model.parameters())
    print(f"Model parameters: {total_params:,}")


if __name__ == "__main__":
    demo_deepfm()
```

### Key Points of DeepFM

**1. Embedding Sharing**

The FM layer and DNN layer share the same set of Embeddings, which is the core design of DeepFM:
- Reduces parameter count
- FM and DNN can reinforce each other

**2. No Feature Engineering Required**

Compared to Wide & Deep, DeepFM does not require manually designed cross features; the FM layer automatically learns second-order interactions.

**3. End-to-End Training**

The entire model can be trained jointly end-to-end, avoiding the complexity of multi-stage training.

---

## Deep Interest Network (DIN)

### Model Motivation

Traditional recommendation models compress user historical behavior into a fixed vector through simple pooling (e.g., mean/max), losing the diversity information of behaviors. DIN (Alibaba, 2018) introduces attention mechanisms to adaptively extract relevant interests from user historical behaviors for different candidate items.

### Core Idea

User interests are diverse, and for different candidate items, the relevant historical behaviors differ:

- User browsed: phone case, earphones, sneakers, books
- Candidate item: Bluetooth earphones
- DIN focuses: mainly on the "earphones" historical behavior

### Attention Weight Calculation

DIN uses a small attention network to calculate weights:

$$\alpha_i = \frac{\exp(a(\mathbf{e}_i, \mathbf{e}_a))}{\sum_j \exp(a(\mathbf{e}_j, \mathbf{e}_a))}$$

Where $\mathbf{e}_i$ is the historical behavior embedding, $\mathbf{e}_a$ is the candidate item embedding, and $a(\cdot)$ is the attention network.

**Attention Network Design:**

```
[e_i, e_a, e_i - e_a, e_i * e_a] -> MLP -> attention_score
```

### PyTorch Implementation

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class AttentionLayer(nn.Module):
    """
    DIN Attention Layer
    Computes attention weights between candidate items and historical behaviors
    """
    def __init__(self, embed_dim: int, hidden_dims: list = [64, 32]):
        super().__init__()

        # Attention network input: [embed, embed, embed-embed, embed*embed]
        input_dim = embed_dim * 4

        layers = []
        prev_dim = input_dim
        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.PReLU(),  # DIN uses PReLU
            ])
            prev_dim = hidden_dim
        layers.append(nn.Linear(prev_dim, 1))

        self.attention_net = nn.Sequential(*layers)

    def forward(self, query, keys, keys_mask=None):
        """
        Parameters:
            query: Candidate item embedding (batch_size, embed_dim)
            keys: Historical behavior embeddings (batch_size, seq_len, embed_dim)
            keys_mask: Historical behavior mask (batch_size, seq_len), True indicates valid
        Returns:
            weighted_sum: Weighted user interest (batch_size, embed_dim)
            attention_weights: Attention weights (batch_size, seq_len)
        """
        batch_size, seq_len, embed_dim = keys.shape

        # Expand query to match keys shape
        query = query.unsqueeze(1).expand(-1, seq_len, -1)

        # Build attention network input
        attention_input = torch.cat([
            keys,                    # Original embedding
            query,                   # Candidate embedding
            keys - query,            # Difference
            keys * query             # Element-wise product
        ], dim=-1)  # (batch_size, seq_len, embed_dim * 4)

        # Calculate attention scores
        attention_scores = self.attention_net(attention_input)
        attention_scores = attention_scores.squeeze(-1)  # (batch_size, seq_len)

        # Apply mask
        if keys_mask is not None:
            attention_scores = attention_scores.masked_fill(
                ~keys_mask, float('-inf')
            )

        # Softmax normalization
        attention_weights = F.softmax(attention_scores, dim=-1)

        # Handle fully masked cases
        if keys_mask is not None:
            attention_weights = attention_weights.masked_fill(
                ~keys_mask, 0.0
            )

        # Weighted sum
        weighted_sum = torch.bmm(
            attention_weights.unsqueeze(1),
            keys
        ).squeeze(1)  # (batch_size, embed_dim)

        return weighted_sum, attention_weights


class DIN(nn.Module):
    """
    Deep Interest Network

    Parameters:
        user_feature_dims: User feature dimensions list
        item_feature_dims: Item feature dimensions list
        embed_dim: Embedding dimension
        attention_hidden: Attention network hidden layers
        mlp_hidden: MLP hidden layers
        dropout: Dropout rate
    """
    def __init__(
        self,
        user_feature_dims: list,
        item_feature_dims: list,
        embed_dim: int = 32,
        attention_hidden: list = [64, 32],
        mlp_hidden: list = [256, 128, 64],
        dropout: float = 0.2
    ):
        super().__init__()

        self.embed_dim = embed_dim

        # User feature Embedding
        self.user_embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in user_feature_dims
        ])

        # Item feature Embedding
        self.item_embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in item_feature_dims
        ])

        # Attention layer
        item_embed_total = len(item_feature_dims) * embed_dim
        self.attention = AttentionLayer(
            embed_dim=item_embed_total,
            hidden_dims=attention_hidden
        )

        # MLP layer
        user_embed_total = len(user_feature_dims) * embed_dim
        mlp_input_dim = user_embed_total + item_embed_total * 2  # User + Interest + Candidate

        layers = []
        prev_dim = mlp_input_dim
        for hidden_dim in mlp_hidden:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.PReLU(),
                nn.Dropout(dropout)
            ])
            prev_dim = hidden_dim
        layers.append(nn.Linear(prev_dim, 1))
        self.mlp = nn.Sequential(*layers)

    def forward(
        self,
        user_features,
        candidate_features,
        history_features,
        history_mask=None
    ):
        """
        Parameters:
            user_features: User feature list [(batch_size,), ...]
            candidate_features: Candidate item feature list [(batch_size,), ...]
            history_features: Historical behavior feature list [(batch_size, seq_len), ...]
            history_mask: Historical behavior mask (batch_size, seq_len)
        Returns:
            logits: (batch_size, 1)
        """
        # User feature Embedding
        user_embeds = torch.cat([
            emb(user_features[i])
            for i, emb in enumerate(self.user_embeddings)
        ], dim=-1)  # (batch_size, user_embed_total)

        # Candidate item Embedding
        candidate_embeds = torch.cat([
            emb(candidate_features[i])
            for i, emb in enumerate(self.item_embeddings)
        ], dim=-1)  # (batch_size, item_embed_total)

        # Historical behavior Embedding
        batch_size = history_features[0].shape[0]
        seq_len = history_features[0].shape[1]

        history_embeds = torch.cat([
            emb(history_features[i])
            for i, emb in enumerate(self.item_embeddings)
        ], dim=-1)  # (batch_size, seq_len, item_embed_total)

        # Attention computation
        interest_embed, attention_weights = self.attention(
            candidate_embeds,
            history_embeds,
            history_mask
        )

        # Concatenate all features
        concat_features = torch.cat([
            user_embeds,
            interest_embed,
            candidate_embeds
        ], dim=-1)

        # MLP prediction
        output = self.mlp(concat_features)

        return output, attention_weights


# DIN usage example
def demo_din():
    batch_size = 32
    seq_len = 50  # Historical behavior sequence length

    # Feature dimension definition
    user_dims = [100000, 1000, 100]  # User ID, Age group, Gender
    item_dims = [500000, 10000, 1000]  # Item ID, Brand, Category

    # Create model
    model = DIN(
        user_feature_dims=user_dims,
        item_feature_dims=item_dims,
        embed_dim=16,
        attention_hidden=[64, 32],
        mlp_hidden=[256, 128, 64]
    )

    # Simulated input
    user_features = [
        torch.randint(0, dim, (batch_size,))
        for dim in user_dims
    ]

    candidate_features = [
        torch.randint(0, dim, (batch_size,))
        for dim in item_dims
    ]

    history_features = [
        torch.randint(0, dim, (batch_size, seq_len))
        for dim in item_dims
    ]

    # Historical behavior mask (simulating variable-length sequences)
    history_lengths = torch.randint(10, seq_len, (batch_size,))
    history_mask = torch.arange(seq_len).expand(batch_size, -1) < history_lengths.unsqueeze(1)

    # Forward pass
    output, attention_weights = model(
        user_features,
        candidate_features,
        history_features,
        history_mask
    )

    print(f"DIN output shape: {output.shape}")
    print(f"Attention weights shape: {attention_weights.shape}")

    # Verify attention weights
    print(f"Attention weight sum (should be close to 1): {attention_weights[0, :history_lengths[0]].sum():.4f}")


if __name__ == "__main__":
    demo_din()
```

### DIN's Dice Activation Function

DIN also proposes Dice (Data-adaptive Activation Function), a data-adaptive activation function:

```python
class Dice(nn.Module):
    """
    Dice Activation Function
    f(s) = p(s) * s + (1 - p(s)) * alpha * s
    where p(s) = sigmoid((s - E[s]) / sqrt(Var[s] + eps))
    """
    def __init__(self, num_features, eps=1e-8):
        super().__init__()
        self.bn = nn.BatchNorm1d(num_features, affine=False)
        self.alpha = nn.Parameter(torch.zeros(num_features))
        self.eps = eps

    def forward(self, x):
        # Normalization
        x_norm = self.bn(x)
        # Calculate probability
        p = torch.sigmoid(x_norm)
        # Dice activation
        return p * x + (1 - p) * self.alpha * x
```

---

## DIEN Sequential Model

### Model Motivation

DIN only considers the diversity of user interests but does not model the evolution process of interests. DIEN (Deep Interest Evolution Network, 2019) introduces GRU to capture the temporal evolution of interests.

### Model Structure

DIEN contains three core modules:

1. **Behavior Sequence Layer**: Converts raw behavior sequences into embedding sequences
2. **Interest Extraction Layer**: Uses GRU to extract user interest sequences
3. **Interest Evolution Layer**: Uses Attention-enhanced GRU (AUGRU) to capture interest evolution

### PyTorch Implementation

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class AUGRUCell(nn.Module):
    """
    Attention Update GRU Cell
    Adds attention weight to GRU update gate
    """
    def __init__(self, input_size, hidden_size):
        super().__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size

        # Reset gate
        self.W_r = nn.Linear(input_size + hidden_size, hidden_size)
        # Update gate
        self.W_z = nn.Linear(input_size + hidden_size, hidden_size)
        # Candidate hidden state
        self.W_h = nn.Linear(input_size + hidden_size, hidden_size)

    def forward(self, x, h_prev, attention_score):
        """
        Parameters:
            x: Input (batch_size, input_size)
            h_prev: Previous hidden state (batch_size, hidden_size)
            attention_score: Attention score (batch_size, 1)
        Returns:
            h: Current hidden state (batch_size, hidden_size)
        """
        combined = torch.cat([x, h_prev], dim=-1)

        # Reset gate
        r = torch.sigmoid(self.W_r(combined))
        # Update gate (original)
        z = torch.sigmoid(self.W_z(combined))

        # Adjust update gate with attention
        z_hat = attention_score * z

        # Candidate hidden state
        combined_reset = torch.cat([x, r * h_prev], dim=-1)
        h_tilde = torch.tanh(self.W_h(combined_reset))

        # Final hidden state
        h = (1 - z_hat) * h_prev + z_hat * h_tilde

        return h


class InterestExtractorLayer(nn.Module):
    """
    Interest Extraction Layer
    Uses GRU to extract interest sequences from behavior sequences
    """
    def __init__(self, input_size, hidden_size):
        super().__init__()
        self.gru = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            batch_first=True
        )

    def forward(self, behavior_embeds, behavior_mask=None):
        """
        Parameters:
            behavior_embeds: (batch_size, seq_len, embed_dim)
            behavior_mask: (batch_size, seq_len)
        Returns:
            interest_states: (batch_size, seq_len, hidden_size)
        """
        if behavior_mask is not None:
            # Get actual sequence lengths
            lengths = behavior_mask.sum(dim=1).cpu()
            # Pack sequence
            packed = nn.utils.rnn.pack_padded_sequence(
                behavior_embeds,
                lengths,
                batch_first=True,
                enforce_sorted=False
            )
            output, _ = self.gru(packed)
            interest_states, _ = nn.utils.rnn.pad_packed_sequence(
                output, batch_first=True
            )
        else:
            interest_states, _ = self.gru(behavior_embeds)

        return interest_states


class InterestEvolutionLayer(nn.Module):
    """
    Interest Evolution Layer
    Uses AUGRU to capture interest evolution related to target item
    """
    def __init__(self, input_size, hidden_size):
        super().__init__()
        self.hidden_size = hidden_size
        self.augru_cell = AUGRUCell(input_size, hidden_size)

        # Attention network
        self.attention_net = nn.Sequential(
            nn.Linear(input_size * 4, 64),
            nn.PReLU(),
            nn.Linear(64, 1)
        )

    def forward(self, interest_states, target_embed, mask=None):
        """
        Parameters:
            interest_states: Interest sequence (batch_size, seq_len, input_size)
            target_embed: Target item embedding (batch_size, input_size)
            mask: Sequence mask (batch_size, seq_len)
        Returns:
            final_interest: Final interest representation (batch_size, hidden_size)
        """
        batch_size, seq_len, _ = interest_states.shape
        device = interest_states.device

        # Calculate attention scores
        target_expanded = target_embed.unsqueeze(1).expand(-1, seq_len, -1)
        attention_input = torch.cat([
            interest_states,
            target_expanded,
            interest_states - target_expanded,
            interest_states * target_expanded
        ], dim=-1)

        attention_scores = self.attention_net(attention_input).squeeze(-1)

        if mask is not None:
            attention_scores = attention_scores.masked_fill(~mask, float('-inf'))

        attention_weights = F.softmax(attention_scores, dim=-1)

        if mask is not None:
            attention_weights = attention_weights.masked_fill(~mask, 0.0)

        # AUGRU forward pass
        h = torch.zeros(batch_size, self.hidden_size, device=device)

        for t in range(seq_len):
            x_t = interest_states[:, t, :]
            a_t = attention_weights[:, t:t+1]
            h = self.augru_cell(x_t, h, a_t)

        return h


class DIEN(nn.Module):
    """
    Deep Interest Evolution Network

    Parameters:
        user_feature_dims: User feature dimensions
        item_feature_dims: Item feature dimensions
        embed_dim: Embedding dimension
        gru_hidden_size: GRU hidden layer size
        mlp_hidden: MLP hidden layers
    """
    def __init__(
        self,
        user_feature_dims: list,
        item_feature_dims: list,
        embed_dim: int = 32,
        gru_hidden_size: int = 64,
        mlp_hidden: list = [256, 128, 64],
        dropout: float = 0.2
    ):
        super().__init__()

        self.embed_dim = embed_dim

        # Embedding layers
        self.user_embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in user_feature_dims
        ])
        self.item_embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in item_feature_dims
        ])

        item_embed_total = len(item_feature_dims) * embed_dim

        # Interest extraction layer
        self.interest_extractor = InterestExtractorLayer(
            input_size=item_embed_total,
            hidden_size=gru_hidden_size
        )

        # Interest evolution layer
        self.interest_evolution = InterestEvolutionLayer(
            input_size=gru_hidden_size,
            hidden_size=gru_hidden_size
        )

        # Auxiliary loss: predict next behavior
        self.auxiliary_net = nn.Linear(gru_hidden_size, item_embed_total)

        # MLP layer
        user_embed_total = len(user_feature_dims) * embed_dim
        mlp_input_dim = user_embed_total + gru_hidden_size + item_embed_total

        layers = []
        prev_dim = mlp_input_dim
        for hidden_dim in mlp_hidden:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.PReLU(),
                nn.Dropout(dropout)
            ])
            prev_dim = hidden_dim
        layers.append(nn.Linear(prev_dim, 1))
        self.mlp = nn.Sequential(*layers)

    def forward(
        self,
        user_features,
        candidate_features,
        history_features,
        history_mask=None,
        neg_history_features=None
    ):
        """
        Parameters:
            user_features: User features
            candidate_features: Candidate item features
            history_features: Historical positive sample behaviors
            history_mask: Historical behavior mask
            neg_history_features: Historical negative samples (for auxiliary loss)
        Returns:
            logits: Prediction scores
            auxiliary_loss: Auxiliary loss
        """
        # User Embedding
        user_embeds = torch.cat([
            emb(user_features[i])
            for i, emb in enumerate(self.user_embeddings)
        ], dim=-1)

        # Candidate item Embedding
        candidate_embeds = torch.cat([
            emb(candidate_features[i])
            for i, emb in enumerate(self.item_embeddings)
        ], dim=-1)

        # Historical behavior Embedding
        history_embeds = torch.cat([
            emb(history_features[i])
            for i, emb in enumerate(self.item_embeddings)
        ], dim=-1)

        # Interest extraction
        interest_states = self.interest_extractor(history_embeds, history_mask)

        # Interest evolution
        evolved_interest = self.interest_evolution(
            interest_states, candidate_embeds, history_mask
        )

        # Concatenate and predict
        concat_features = torch.cat([
            user_embeds,
            evolved_interest,
            candidate_embeds
        ], dim=-1)

        logits = self.mlp(concat_features)

        # Calculate auxiliary loss
        auxiliary_loss = None
        if neg_history_features is not None and self.training:
            auxiliary_loss = self._auxiliary_loss(
                interest_states,
                history_embeds,
                neg_history_features,
                history_mask
            )

        return logits, auxiliary_loss

    def _auxiliary_loss(
        self,
        interest_states,
        pos_embeds,
        neg_features,
        mask
    ):
        """
        Auxiliary loss: Use interest states to predict next behavior
        """
        # Negative sample Embedding
        neg_embeds = torch.cat([
            emb(neg_features[i])
            for i, emb in enumerate(self.item_embeddings)
        ], dim=-1)

        # Use h_t to predict e_{t+1}
        pred_embeds = self.auxiliary_net(interest_states[:, :-1, :])
        pos_next = pos_embeds[:, 1:, :]
        neg_next = neg_embeds[:, 1:, :]

        # Positive sample scores
        pos_scores = (pred_embeds * pos_next).sum(dim=-1)
        # Negative sample scores
        neg_scores = (pred_embeds * neg_next).sum(dim=-1)

        # Cross-entropy loss
        if mask is not None:
            mask = mask[:, 1:]  # Alignment
            pos_scores = pos_scores.masked_fill(~mask, 0)
            neg_scores = neg_scores.masked_fill(~mask, 0)
            valid_count = mask.sum()
        else:
            valid_count = pos_scores.numel()

        loss = -torch.log(torch.sigmoid(pos_scores - neg_scores) + 1e-8)

        return loss.sum() / (valid_count + 1e-8)


# DIEN usage example
def demo_dien():
    batch_size = 32
    seq_len = 50

    user_dims = [100000, 100, 10]
    item_dims = [500000, 10000, 1000]

    model = DIEN(
        user_feature_dims=user_dims,
        item_feature_dims=item_dims,
        embed_dim=16,
        gru_hidden_size=64,
        mlp_hidden=[256, 128, 64]
    )

    # Simulated data
    user_features = [torch.randint(0, d, (batch_size,)) for d in user_dims]
    candidate_features = [torch.randint(0, d, (batch_size,)) for d in item_dims]
    history_features = [torch.randint(0, d, (batch_size, seq_len)) for d in item_dims]
    neg_history_features = [torch.randint(0, d, (batch_size, seq_len)) for d in item_dims]

    history_lengths = torch.randint(10, seq_len, (batch_size,))
    history_mask = torch.arange(seq_len).expand(batch_size, -1) < history_lengths.unsqueeze(1)

    model.train()
    logits, aux_loss = model(
        user_features,
        candidate_features,
        history_features,
        history_mask,
        neg_history_features
    )

    print(f"DIEN output shape: {logits.shape}")
    print(f"Auxiliary loss: {aux_loss:.4f}")


if __name__ == "__main__":
    demo_dien()
```

---

## Two-Tower Model Architecture

### Model Motivation

In large-scale recommender systems, candidate items can reach millions or even tens of millions. The two-tower model encodes users and items into independent vectors separately, enabling fast retrieval through vector similarity.

### Two-Tower Structure

```
User Features              Item Features
    |                          |
User Tower              Item Tower
    |                          |
User Vector              Item Vector
    |                          |
    +----------+---------------+
               |
      Similarity Computation (inner product/cosine)
               |
         Prediction Score
```

### PyTorch Implementation

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class Tower(nn.Module):
    """
    Tower Structure: Multi-layer MLP
    """
    def __init__(
        self,
        input_dim: int,
        hidden_dims: list,
        output_dim: int,
        dropout: float = 0.2
    ):
        super().__init__()

        layers = []
        prev_dim = input_dim

        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout)
            ])
            prev_dim = hidden_dim

        layers.append(nn.Linear(prev_dim, output_dim))
        self.mlp = nn.Sequential(*layers)

    def forward(self, x):
        return self.mlp(x)


class TwoTowerModel(nn.Module):
    """
    Two-Tower Model

    Parameters:
        user_feature_dims: User feature dimensions list
        item_feature_dims: Item feature dimensions list
        embed_dim: Embedding dimension
        tower_hidden: Tower hidden layers
        output_dim: Output vector dimension
        temperature: Softmax temperature coefficient
    """
    def __init__(
        self,
        user_feature_dims: list,
        item_feature_dims: list,
        embed_dim: int = 32,
        tower_hidden: list = [256, 128],
        output_dim: int = 64,
        temperature: float = 0.05,
        dropout: float = 0.2
    ):
        super().__init__()

        self.temperature = temperature

        # User feature Embedding
        self.user_embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in user_feature_dims
        ])

        # Item feature Embedding
        self.item_embeddings = nn.ModuleList([
            nn.Embedding(dim, embed_dim) for dim in item_feature_dims
        ])

        # User tower
        user_input_dim = len(user_feature_dims) * embed_dim
        self.user_tower = Tower(
            input_dim=user_input_dim,
            hidden_dims=tower_hidden,
            output_dim=output_dim,
            dropout=dropout
        )

        # Item tower
        item_input_dim = len(item_feature_dims) * embed_dim
        self.item_tower = Tower(
            input_dim=item_input_dim,
            hidden_dims=tower_hidden,
            output_dim=output_dim,
            dropout=dropout
        )

    def get_user_embedding(self, user_features):
        """Get user vector"""
        user_embeds = torch.cat([
            emb(user_features[i])
            for i, emb in enumerate(self.user_embeddings)
        ], dim=-1)
        user_vector = self.user_tower(user_embeds)
        # L2 normalization
        user_vector = F.normalize(user_vector, p=2, dim=-1)
        return user_vector

    def get_item_embedding(self, item_features):
        """Get item vector"""
        item_embeds = torch.cat([
            emb(item_features[i])
            for i, emb in enumerate(self.item_embeddings)
        ], dim=-1)
        item_vector = self.item_tower(item_embeds)
        # L2 normalization
        item_vector = F.normalize(item_vector, p=2, dim=-1)
        return item_vector

    def forward(self, user_features, item_features):
        """
        Forward pass
        Returns user vector, item vector, and similarity score
        """
        user_vector = self.get_user_embedding(user_features)
        item_vector = self.get_item_embedding(item_features)

        # Calculate similarity (inner product)
        similarity = torch.sum(user_vector * item_vector, dim=-1, keepdim=True)

        return user_vector, item_vector, similarity

    def compute_loss(
        self,
        user_features,
        pos_item_features,
        neg_item_features=None,
        in_batch_neg=True
    ):
        """
        Compute loss

        Parameters:
            user_features: User features
            pos_item_features: Positive sample item features
            neg_item_features: Negative sample item features (optional)
            in_batch_neg: Whether to use in-batch negative sampling
        """
        user_vectors = self.get_user_embedding(user_features)
        pos_item_vectors = self.get_item_embedding(pos_item_features)

        if in_batch_neg:
            # In-batch negative sampling: each user's positive sample is other users' negative sample
            # Calculate similarity for all user-item pairs
            similarity_matrix = torch.mm(
                user_vectors, pos_item_vectors.t()
            ) / self.temperature  # (batch_size, batch_size)

            # Diagonal elements are positive samples
            labels = torch.arange(
                similarity_matrix.size(0),
                device=similarity_matrix.device
            )

            # Cross-entropy loss
            loss = F.cross_entropy(similarity_matrix, labels)

        else:
            # Explicit negative sampling
            neg_item_vectors = self.get_item_embedding(neg_item_features)

            pos_scores = torch.sum(
                user_vectors * pos_item_vectors, dim=-1
            ) / self.temperature
            neg_scores = torch.sum(
                user_vectors * neg_item_vectors, dim=-1
            ) / self.temperature

            # BPR loss or cross-entropy loss
            loss = -torch.log(
                torch.sigmoid(pos_scores - neg_scores) + 1e-8
            ).mean()

        return loss


# Two-tower model usage example
def demo_two_tower():
    batch_size = 128

    user_dims = [100000, 100, 10, 5]  # User ID, Age, Gender, Membership level
    item_dims = [500000, 10000, 1000, 100]  # Item ID, Brand, Category, Tags

    model = TwoTowerModel(
        user_feature_dims=user_dims,
        item_feature_dims=item_dims,
        embed_dim=32,
        tower_hidden=[256, 128],
        output_dim=64,
        temperature=0.05
    )

    # Simulated data
    user_features = [torch.randint(0, d, (batch_size,)) for d in user_dims]
    pos_item_features = [torch.randint(0, d, (batch_size,)) for d in item_dims]

    # Training mode
    model.train()
    loss = model.compute_loss(user_features, pos_item_features, in_batch_neg=True)
    print(f"Training loss: {loss:.4f}")

    # Inference mode: get vectors
    model.set_eval_mode()
    with torch.no_grad():
        user_vectors = model.get_user_embedding(user_features)
        item_vectors = model.get_item_embedding(pos_item_features)

        print(f"User vector shape: {user_vectors.shape}")
        print(f"Item vector shape: {item_vectors.shape}")

        # Verify L2 normalization
        print(f"Vector norm: {torch.norm(user_vectors[0]):.4f}")


if __name__ == "__main__":
    demo_two_tower()
```

### Two-Tower Model Deployment

The key advantage of two-tower models is the ability to pre-compute item vectors for efficient retrieval:

```python
import faiss
import numpy as np


class TwoTowerRetrieval:
    """
    Two-Tower Model Recall Service
    """
    def __init__(self, model, item_features_dict, device='cuda'):
        self.model = model
        self.device = device
        self.model.set_eval_mode()

        # Pre-compute all item vectors
        self._build_item_index(item_features_dict)

    def _build_item_index(self, item_features_dict):
        """Build item vector index"""
        item_ids = list(item_features_dict.keys())
        item_vectors = []

        with torch.no_grad():
            for item_id in item_ids:
                features = item_features_dict[item_id]
                # Convert to tensor and get vector
                features = [
                    torch.tensor([f]).to(self.device)
                    for f in features
                ]
                vector = self.model.get_item_embedding(features)
                item_vectors.append(vector.cpu().numpy())

        item_vectors = np.vstack(item_vectors).astype('float32')

        # Build Faiss index
        dimension = item_vectors.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # Inner product similarity
        self.index.add(item_vectors)

        self.item_ids = item_ids
        print(f"Index built, total {len(item_ids)} items")

    def retrieve(self, user_features, top_k=100):
        """
        Retrieve Top-K items

        Parameters:
            user_features: User features
            top_k: Number of items to retrieve
        Returns:
            item_ids: List of retrieved item IDs
            scores: List of similarity scores
        """
        with torch.no_grad():
            features = [
                torch.tensor([f]).to(self.device)
                for f in user_features
            ]
            user_vector = self.model.get_user_embedding(features)
            user_vector = user_vector.cpu().numpy().astype('float32')

        # Faiss retrieval
        scores, indices = self.index.search(user_vector, top_k)

        # Convert to item IDs
        retrieved_items = [self.item_ids[i] for i in indices[0]]

        return retrieved_items, scores[0].tolist()
```

---

## Negative Sampling Strategies

### Importance of Negative Sampling

In recommender systems, positive samples (items the user has interacted with) are relatively sparse, and the choice of negative samples has a significant impact on model performance.

### Common Negative Sampling Strategies

**1. Random Negative Sampling**

The simplest approach, randomly selecting from all items:

```python
def random_negative_sampling(
    num_items: int,
    positive_items: set,
    num_negatives: int
) -> list:
    """
    Random Negative Sampling

    Parameters:
        num_items: Total number of items
        positive_items: Set of positive sample items
        num_negatives: Number of negative samples
    """
    negatives = []
    while len(negatives) < num_negatives:
        item = np.random.randint(0, num_items)
        if item not in positive_items:
            negatives.append(item)
    return negatives
```

**2. Popularity-based Sampling**

Sample based on item popularity, with more popular items more likely to be sampled as negatives:

```python
def popularity_negative_sampling(
    item_popularity: np.ndarray,
    positive_items: set,
    num_negatives: int,
    alpha: float = 0.75
) -> list:
    """
    Popularity-based Negative Sampling

    Parameters:
        item_popularity: Item popularity array
        positive_items: Set of positive sample items
        num_negatives: Number of negative samples
        alpha: Smoothing exponent (Word2Vec uses 0.75)
    """
    # Calculate sampling probability
    smoothed_popularity = item_popularity ** alpha
    sampling_prob = smoothed_popularity / smoothed_popularity.sum()

    negatives = []
    while len(negatives) < num_negatives:
        item = np.random.choice(len(item_popularity), p=sampling_prob)
        if item not in positive_items:
            negatives.append(item)
    return negatives
```

**3. Hard Negative Mining**

Select items similar to positive samples but are actually negative:

```python
def hard_negative_mining(
    user_vector: np.ndarray,
    item_vectors: np.ndarray,
    positive_items: set,
    num_negatives: int,
    num_candidates: int = 1000
) -> list:
    """
    Hard Negative Mining
    Select negative samples from similar but non-interacted items
    """
    # Calculate similarity with all items
    similarities = np.dot(item_vectors, user_vector)

    # Exclude positive samples
    for pos_item in positive_items:
        similarities[pos_item] = -np.inf

    # Select top candidates with highest similarity
    top_candidates = np.argsort(similarities)[-num_candidates:]

    # Randomly select negative samples from candidates
    negatives = np.random.choice(
        top_candidates,
        size=num_negatives,
        replace=False
    ).tolist()

    return negatives
```

**4. In-Batch Negative Sampling**

Use other users' positive samples in the same batch as negative samples:

```python
class InBatchNegativeSampling:
    """
    In-Batch Negative Sampling
    """
    def __init__(self, temperature: float = 0.05):
        self.temperature = temperature

    def compute_loss(
        self,
        user_vectors: torch.Tensor,
        item_vectors: torch.Tensor
    ) -> torch.Tensor:
        """
        Parameters:
            user_vectors: (batch_size, dim)
            item_vectors: (batch_size, dim)
        """
        batch_size = user_vectors.shape[0]

        # Calculate similarity matrix
        similarity_matrix = torch.mm(
            user_vectors, item_vectors.t()
        ) / self.temperature

        # Diagonal elements are positive pairs
        labels = torch.arange(batch_size, device=similarity_matrix.device)

        # InfoNCE loss
        loss = F.cross_entropy(similarity_matrix, labels)

        return loss
```

**5. Mixed Negative Sampling**

Combine multiple strategies:

```python
class MixedNegativeSampler:
    """
    Mixed Negative Sampling Strategy
    """
    def __init__(
        self,
        num_items: int,
        item_popularity: np.ndarray,
        random_ratio: float = 0.5,
        popular_ratio: float = 0.3,
        hard_ratio: float = 0.2
    ):
        self.num_items = num_items
        self.item_popularity = item_popularity
        self.random_ratio = random_ratio
        self.popular_ratio = popular_ratio
        self.hard_ratio = hard_ratio

        # Pre-compute popularity sampling probability
        smoothed = item_popularity ** 0.75
        self.popular_prob = smoothed / smoothed.sum()

    def sample(
        self,
        positive_items: set,
        num_negatives: int,
        user_vector: np.ndarray = None,
        item_vectors: np.ndarray = None
    ) -> list:
        """
        Mixed sampling
        """
        num_random = int(num_negatives * self.random_ratio)
        num_popular = int(num_negatives * self.popular_ratio)
        num_hard = num_negatives - num_random - num_popular

        negatives = set()

        # Random sampling
        while len(negatives) < num_random:
            item = np.random.randint(0, self.num_items)
            if item not in positive_items:
                negatives.add(item)

        # Popularity sampling
        while len(negatives) < num_random + num_popular:
            item = np.random.choice(self.num_items, p=self.popular_prob)
            if item not in positive_items and item not in negatives:
                negatives.add(item)

        # Hard negative sampling
        if user_vector is not None and item_vectors is not None:
            similarities = np.dot(item_vectors, user_vector)
            for pos in positive_items:
                similarities[pos] = -np.inf
            for neg in negatives:
                similarities[neg] = -np.inf

            top_indices = np.argsort(similarities)[-num_hard*10:]
            hard_candidates = [
                i for i in top_indices
                if i not in positive_items and i not in negatives
            ]
            negatives.update(hard_candidates[:num_hard])

        return list(negatives)[:num_negatives]
```

---

## Complete PyTorch Implementation

### Complete Training Pipeline

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
from tqdm import tqdm
from collections import defaultdict


class RecommendationDataset(Dataset):
    """
    Recommender System Dataset
    """
    def __init__(
        self,
        interactions: list,
        user_features: dict,
        item_features: dict,
        num_items: int,
        num_negatives: int = 4,
        item_popularity: np.ndarray = None
    ):
        """
        Parameters:
            interactions: [(user_id, item_id, label), ...]
            user_features: {user_id: [feature1, feature2, ...]}
            item_features: {item_id: [feature1, feature2, ...]}
            num_items: Total number of items
            num_negatives: Number of negative samples per positive sample
            item_popularity: Item popularity
        """
        self.interactions = interactions
        self.user_features = user_features
        self.item_features = item_features
        self.num_items = num_items
        self.num_negatives = num_negatives
        self.item_popularity = item_popularity

        # Build user-item interaction set
        self.user_positive_items = defaultdict(set)
        for user_id, item_id, label in interactions:
            if label == 1:
                self.user_positive_items[user_id].add(item_id)

        # Calculate sampling probability
        if item_popularity is not None:
            smoothed = item_popularity ** 0.75
            self.sampling_prob = smoothed / smoothed.sum()
        else:
            self.sampling_prob = None

    def __len__(self):
        return len(self.interactions)

    def __getitem__(self, idx):
        user_id, pos_item_id, _ = self.interactions[idx]

        # Get user features
        user_feat = self.user_features[user_id]

        # Get positive sample item features
        pos_item_feat = self.item_features[pos_item_id]

        # Negative sampling
        positive_items = self.user_positive_items[user_id]
        neg_items = []

        while len(neg_items) < self.num_negatives:
            if self.sampling_prob is not None:
                neg_item = np.random.choice(
                    self.num_items, p=self.sampling_prob
                )
            else:
                neg_item = np.random.randint(0, self.num_items)

            if neg_item not in positive_items:
                neg_items.append(neg_item)

        # Get negative sample item features
        neg_item_feats = [self.item_features[i] for i in neg_items]

        return {
            'user_features': torch.tensor(user_feat, dtype=torch.long),
            'pos_item_features': torch.tensor(pos_item_feat, dtype=torch.long),
            'neg_item_features': torch.tensor(neg_item_feats, dtype=torch.long)
        }


class DeepRecommenderTrainer:
    """
    Deep Recommender Model Trainer
    """
    def __init__(
        self,
        model: nn.Module,
        train_loader: DataLoader,
        val_loader: DataLoader = None,
        learning_rate: float = 1e-3,
        weight_decay: float = 1e-5,
        device: str = 'cuda'
    ):
        self.model = model.to(device)
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device

        self.optimizer = optim.Adam(
            model.parameters(),
            lr=learning_rate,
            weight_decay=weight_decay
        )

        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer,
            mode='min',
            factor=0.5,
            patience=3,
            verbose=True
        )

        self.best_val_loss = float('inf')
        self.train_losses = []
        self.val_losses = []

    def train_epoch(self):
        """Train one epoch"""
        self.model.train()
        total_loss = 0
        num_batches = 0

        pbar = tqdm(self.train_loader, desc='Training')
        for batch in pbar:
            # Move data to device
            user_features = batch['user_features'].to(self.device)
            pos_item_features = batch['pos_item_features'].to(self.device)
            neg_item_features = batch['neg_item_features'].to(self.device)

            # Convert feature format
            user_feat_list = [
                user_features[:, i] for i in range(user_features.shape[1])
            ]
            pos_item_feat_list = [
                pos_item_features[:, i] for i in range(pos_item_features.shape[1])
            ]

            # Forward pass
            self.optimizer.zero_grad()

            # Get vectors
            user_vectors = self.model.get_user_embedding(user_feat_list)
            pos_item_vectors = self.model.get_item_embedding(pos_item_feat_list)

            # Calculate positive sample scores
            pos_scores = torch.sum(
                user_vectors * pos_item_vectors, dim=-1
            )

            # Calculate negative sample scores
            batch_size, num_neg, num_feat = neg_item_features.shape
            neg_scores_list = []

            for i in range(num_neg):
                neg_feat_list = [
                    neg_item_features[:, i, j] for j in range(num_feat)
                ]
                neg_vectors = self.model.get_item_embedding(neg_feat_list)
                neg_score = torch.sum(user_vectors * neg_vectors, dim=-1)
                neg_scores_list.append(neg_score)

            neg_scores = torch.stack(neg_scores_list, dim=1)

            # BPR loss
            diff = pos_scores.unsqueeze(1) - neg_scores
            loss = -torch.log(torch.sigmoid(diff) + 1e-8).mean()

            # Backward pass
            loss.backward()

            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(
                self.model.parameters(), max_norm=1.0
            )

            self.optimizer.step()

            total_loss += loss.item()
            num_batches += 1

            pbar.set_postfix({'loss': f'{loss.item():.4f}'})

        return total_loss / num_batches

    def train(
        self,
        num_epochs: int,
        early_stopping_patience: int = 10,
        save_path: str = 'best_model.pt'
    ):
        """Complete training pipeline"""
        patience_counter = 0

        for epoch in range(num_epochs):
            print(f"\nEpoch {epoch + 1}/{num_epochs}")

            # Training
            train_loss = self.train_epoch()
            self.train_losses.append(train_loss)
            print(f"Train Loss: {train_loss:.4f}")

        return self.train_losses, self.val_losses


# Evaluation metrics
class RecommendationMetrics:
    """
    Recommender System Evaluation Metrics
    """
    @staticmethod
    def hit_rate_at_k(recommendations: list, ground_truth: set, k: int) -> float:
        """Hit Rate@K"""
        hits = len(set(recommendations[:k]) & ground_truth)
        return 1.0 if hits > 0 else 0.0

    @staticmethod
    def ndcg_at_k(recommendations: list, ground_truth: set, k: int) -> float:
        """NDCG@K"""
        dcg = 0.0
        for i, item in enumerate(recommendations[:k]):
            if item in ground_truth:
                dcg += 1.0 / np.log2(i + 2)

        ideal_dcg = sum(1.0 / np.log2(i + 2) for i in range(min(k, len(ground_truth))))

        return dcg / ideal_dcg if ideal_dcg > 0 else 0.0

    @staticmethod
    def recall_at_k(recommendations: list, ground_truth: set, k: int) -> float:
        """Recall@K"""
        hits = len(set(recommendations[:k]) & ground_truth)
        return hits / len(ground_truth) if ground_truth else 0.0

    @staticmethod
    def precision_at_k(recommendations: list, ground_truth: set, k: int) -> float:
        """Precision@K"""
        hits = len(set(recommendations[:k]) & ground_truth)
        return hits / k

    @staticmethod
    def mrr(recommendations: list, ground_truth: set) -> float:
        """Mean Reciprocal Rank"""
        for i, item in enumerate(recommendations):
            if item in ground_truth:
                return 1.0 / (i + 1)
        return 0.0
```

---

## Interview Key Points

### Core Concept Questions

**Q1: What is the difference between Wide & Deep and DeepFM?**

- **Wide & Deep**: Wide part is manually designed cross features + linear model, requires feature engineering
- **DeepFM**: Replaces Wide part with FM, automatically learns second-order feature interactions, no manual design needed
- **Common points**: Both combine shallow and deep models, share Embeddings

**Q2: How does DIN's attention mechanism work?**

DIN adaptively extracts relevant interests from user historical behaviors for different candidate items:
1. Calculate attention scores between candidate item and each historical behavior
2. Attention network input: [behavior embedding, candidate embedding, difference, element-wise product]
3. Normalize through Softmax to get attention weights
4. Weighted sum to obtain user interest representation

**Q3: What are the advantages and disadvantages of two-tower models?**

**Advantages**:
- User and item vectors can be computed independently
- Item vectors can be pre-computed offline
- Supports ANN fast retrieval, suitable for large-scale recall

**Disadvantages**:
- Weak user-item interaction modeling (only inner product)
- Cannot model complex cross relationships
- Ranking performance is not as good as complex models

**Q4: What are the negative sampling strategies? How to choose?**

| Strategy | Characteristics | Applicable Scenarios |
|----------|-----------------|---------------------|
| Random Sampling | Simple and efficient | Basic method |
| Popularity Sampling | Avoids recommending popular items | Cold start scenarios |
| Hard Negative | More challenging negative samples | Improve model discrimination |
| In-Batch Negative | Fully utilizes batch information | Large batch training |

**Q5: How to handle user behavior sequences?**

- **Simple methods**: Mean/Max Pooling
- **Attention methods**: DIN dynamically weights based on candidate items
- **Sequential methods**: GRU/LSTM/Transformer for temporal dependencies
- **Interest evolution**: DIEN uses AUGRU to capture interest changes

### Engineering Practice Questions

**Q6: How to deploy two-tower model for online recall?**

1. Offline: Compute all item vectors, build Faiss index
2. Online: Real-time compute user vectors, ANN retrieval Top-K
3. Incremental update: Periodically update item vectors and index

**Q7: What are the evaluation metrics for recommender systems?**

- **Ranking metrics**: AUC, LogLoss, GAUC
- **Recall metrics**: Recall@K, Hit Rate@K
- **Ranking metrics**: NDCG@K, MRR, MAP
- **Business metrics**: CTR, CVR, GMV, User retention

**Q8: How to handle cold start problems?**

- **User cold start**: Recommend based on user profile, popular items, exploration strategy
- **Item cold start**: Content-based recommendation, similar items, Bandit exploration
- **System cold start**: Incorporate prior knowledge, transfer learning

### Algorithm Design Questions

**Q9: Design a recall layer for an e-commerce recommender system**

```
Multi-channel Recall Strategy:
1. Collaborative filtering recall: I2I recall based on user behavior
2. Vector recall: Two-tower model U2I recall
3. Popular recall: Popular items by category
4. Real-time recall: Session-based real-time interests
5. Content recall: Tag matching based on user profile

Recall Fusion:
- Deduplicate across channels
- Allocate quota by source
- Simple model for initial ranking
```

**Q10: How to optimize efficiency of sequential recommendation models?**

- **Sequence truncation**: Only use the most recent N behaviors
- **Sampling training**: Randomly sample subsequences from long sequences
- **Caching mechanism**: Cache user historical embeddings
- **Model simplification**: Use lightweight models to approximate attention

---

## Further Reading

### Recommended Papers

1. **Wide & Deep Learning** (2016) - Google
2. **DeepFM** (2017) - Huawei
3. **Deep Interest Network** (2018) - Alibaba
4. **Deep Interest Evolution Network** (2019) - Alibaba
5. **Sampling-Bias-Corrected Neural Modeling** (2019) - Google
6. **MIND: Multi-Interest Network** (2019) - Alibaba
7. **SASRec: Self-Attentive Sequential Recommendation** (2018)

### Open Source Frameworks

- **DeepCTR**: Collection of CTR prediction models
- **RecBole**: Recommender system benchmark library
- **TensorFlow Recommenders**: Google recommender system library
- **Merlin**: NVIDIA recommender system framework

### Advanced Topics

- **Multi-task Learning**: MMOE, PLE
- **Graph Neural Networks**: LightGCN, PinSage
- **Reinforcement Learning for Recommendation**: Bandit, RL4Rec
- **Large Model Recommendation**: LLM4Rec, P5
- **Federated Recommendation**: Privacy-preserving recommendation

---

After reading this, you should be able to:
1. Understand the core model architectures of deep recommender systems
2. Master the implementation of classic models like Wide & Deep, DeepFM, and DIN
3. Understand the design and deployment of two-tower models
4. Be familiar with various negative sampling strategies and their applicable scenarios
5. Have complete development capabilities for deep recommender systems

Deep recommender systems are a rapidly evolving field, and keeping up with the latest research and industry practices is key to maintaining competitiveness. We recommend reading top conference papers frequently, participating in actual projects, and accumulating engineering experience.
