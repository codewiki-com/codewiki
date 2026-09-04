---
title: "Graph Machine Learning: Graph Neural Networks"
description: "Master GNN core models: GCN, GraphSAGE, and GAT"
track: ai
section: deep-learning
difficulty: advanced
tags:
  - GNN
  - GCN
  - graph learning
  - deep learning
status: imported
origin: old/src/content/docs/datascience/gnn.en.md
divergence: 0.132
issues: []
legacy:
  category: DataScience
  subcategory: GraphML
  order: 27
  lastUpdated: 2026-01-07
---

Graph Neural Networks (GNNs) represent one of the most significant advances in deep learning, enabling powerful representations of graph-structured data. Unlike traditional neural networks designed for grid-like data (images) or sequential data (text), GNNs can directly operate on graphs, capturing complex relationships between entities in domains such as social networks, molecular structures, knowledge graphs, and recommendation systems.

---

## Introduction to Graph Data

### What is a Graph?

A graph $G = (V, E)$ consists of a set of **nodes** (or vertices) $V$ and a set of **edges** $E$ that connect pairs of nodes. Graphs are fundamental data structures for representing relationships and interactions.

**Key Components:**

- **Nodes (Vertices)**: Entities in the graph (e.g., users, atoms, documents)
- **Edges**: Connections between nodes (e.g., friendships, chemical bonds, citations)
- **Node Features**: Attribute vectors associated with each node
- **Edge Features**: Attribute vectors associated with each edge
- **Adjacency Matrix**: Matrix representation of graph connectivity

### Graph Representations

```python
import torch
import numpy as np

# Example: A simple social network graph
# Nodes: 5 users
# Edges: Friendship connections

# Adjacency Matrix representation
# A[i][j] = 1 if there's an edge from node i to node j
adjacency_matrix = torch.tensor([
    [0, 1, 1, 0, 0],
    [1, 0, 1, 1, 0],
    [1, 1, 0, 0, 1],
    [0, 1, 0, 0, 1],
    [0, 0, 1, 1, 0]
], dtype=torch.float)

# Edge List representation (more memory efficient for sparse graphs)
# Each column represents an edge: [source_node, target_node]
edge_index = torch.tensor([
    [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4],  # source nodes
    [1, 2, 0, 2, 3, 0, 1, 4, 1, 4, 2, 3]   # target nodes
], dtype=torch.long)

# Node Features (e.g., user profiles with 16 features each)
num_nodes = 5
num_features = 16
node_features = torch.randn(num_nodes, num_features)

print(f"Adjacency Matrix shape: {adjacency_matrix.shape}")
print(f"Edge Index shape: {edge_index.shape}")
print(f"Node Features shape: {node_features.shape}")
```

### Types of Graphs

| Graph Type | Description | Example |
|------------|-------------|---------|
| Undirected | Edges have no direction | Social networks |
| Directed | Edges have direction | Citation networks |
| Weighted | Edges have weights | Transportation networks |
| Bipartite | Two types of nodes | User-item interactions |
| Heterogeneous | Multiple node/edge types | Knowledge graphs |
| Dynamic | Structure changes over time | Temporal networks |

### Why Traditional Neural Networks Fail on Graphs

Traditional neural networks (CNNs, RNNs) assume:
- **Fixed-size input**: Graphs have varying numbers of nodes
- **Regular structure**: Images have grid topology; graphs are irregular
- **Order sensitivity**: Sequences have inherent order; graphs are permutation invariant

GNNs address these challenges by:
1. Operating on arbitrary graph structures
2. Being invariant to node ordering
3. Aggregating information from local neighborhoods

---

## The Message Passing Framework

The **Message Passing Neural Network (MPNN)** framework provides a unified view of most GNN architectures. It describes how information flows through the graph in each layer.

### Core Concept

At each layer, every node:
1. **Aggregates** messages from its neighbors
2. **Updates** its representation based on aggregated information

**Mathematical Formulation:**

For node $v$ at layer $k$:

$$h_v^{(k)} = \text{UPDATE}^{(k)}\left(h_v^{(k-1)}, \text{AGGREGATE}^{(k)}\left(\{h_u^{(k-1)} : u \in \mathcal{N}(v)\}\right)\right)$$

Where:
- $h_v^{(k)}$ is the hidden representation of node $v$ at layer $k$
- $\mathcal{N}(v)$ denotes the neighbors of node $v$
- AGGREGATE collects information from neighbors
- UPDATE combines neighbor information with the node's own representation

### Generic Implementation

```python
import torch
import torch.nn as nn

class MessagePassingLayer(nn.Module):
    """Generic message passing layer"""

    def __init__(self, in_features, out_features):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features

        # Linear transformation for messages
        self.message_mlp = nn.Linear(in_features, out_features)
        # Linear transformation for update
        self.update_mlp = nn.Linear(out_features + in_features, out_features)

    def message(self, x_j):
        """
        Compute messages from neighboring nodes.
        x_j: Features of neighboring nodes
        """
        return self.message_mlp(x_j)

    def aggregate(self, messages, edge_index, num_nodes):
        """
        Aggregate messages from neighbors (sum aggregation).
        """
        target_nodes = edge_index[1]
        aggregated = torch.zeros(num_nodes, messages.size(1), device=messages.device)
        aggregated.scatter_add_(0, target_nodes.unsqueeze(1).expand_as(messages), messages)
        return aggregated

    def update(self, aggregated, x):
        """
        Update node representations.
        """
        combined = torch.cat([x, aggregated], dim=-1)
        return self.update_mlp(combined)

    def forward(self, x, edge_index):
        """
        Forward pass of message passing.

        Args:
            x: Node features (num_nodes, in_features)
            edge_index: Edge indices (2, num_edges)

        Returns:
            Updated node features (num_nodes, out_features)
        """
        num_nodes = x.size(0)
        source_nodes = edge_index[0]

        # 1. Compute messages from source nodes
        messages = self.message(x[source_nodes])

        # 2. Aggregate messages at target nodes
        aggregated = self.aggregate(messages, edge_index, num_nodes)

        # 3. Update node representations
        output = self.update(aggregated, x)

        return output


# Example usage
layer = MessagePassingLayer(in_features=16, out_features=32)
x = torch.randn(5, 16)  # 5 nodes, 16 features each
edge_index = torch.tensor([[0, 1, 1, 2, 3], [1, 0, 2, 3, 4]])  # 5 edges

output = layer(x, edge_index)
print(f"Input shape: {x.shape}")
print(f"Output shape: {output.shape}")
```

### Common Aggregation Functions

| Aggregation | Formula | Properties |
|-------------|---------|------------|
| Sum | $\sum_{u \in \mathcal{N}(v)} h_u$ | Captures neighborhood size |
| Mean | $\frac{1}{|\mathcal{N}(v)|}\sum_{u \in \mathcal{N}(v)} h_u$ | Normalized by degree |
| Max | $\max_{u \in \mathcal{N}(v)} h_u$ | Captures salient features |
| Attention | $\sum_{u \in \mathcal{N}(v)} \alpha_{vu} h_u$ | Weighted by importance |

---

## Graph Convolutional Networks (GCN)

**Graph Convolutional Networks (GCN)**, introduced by Kipf and Welling (2017), are one of the most influential GNN architectures. They extend the concept of convolution to graph-structured data.

### Spectral Motivation

GCN is derived from spectral graph theory. The graph Laplacian $L = D - A$ (where $D$ is the degree matrix and $A$ is the adjacency matrix) is central to defining graph convolutions.

### Layer-wise Propagation Rule

The GCN layer is defined as:

$$H^{(l+1)} = \sigma\left(\tilde{D}^{-\frac{1}{2}} \tilde{A} \tilde{D}^{-\frac{1}{2}} H^{(l)} W^{(l)}\right)$$

Where:
- $\tilde{A} = A + I$ (adjacency matrix with self-loops)
- $\tilde{D}$ is the degree matrix of $\tilde{A}$
- $H^{(l)}$ is the node feature matrix at layer $l$
- $W^{(l)}$ is the learnable weight matrix
- $\sigma$ is an activation function (typically ReLU)

### Intuition

1. **Self-loops** ($A + I$): Allow nodes to aggregate their own features
2. **Symmetric normalization** ($\tilde{D}^{-1/2} \tilde{A} \tilde{D}^{-1/2}$): Prevents feature magnitudes from exploding/vanishing based on node degree
3. **Linear transformation** ($W$): Projects features to a new space
4. **Non-linearity** ($\sigma$): Enables learning complex patterns

### Implementation

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class GCNLayer(nn.Module):
    """Graph Convolutional Network Layer"""

    def __init__(self, in_features, out_features, bias=True):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features

        # Learnable weight matrix
        self.weight = nn.Parameter(torch.FloatTensor(in_features, out_features))
        if bias:
            self.bias = nn.Parameter(torch.FloatTensor(out_features))
        else:
            self.register_parameter('bias', None)

        self.reset_parameters()

    def reset_parameters(self):
        nn.init.xavier_uniform_(self.weight)
        if self.bias is not None:
            nn.init.zeros_(self.bias)

    def forward(self, x, adj):
        """
        Forward pass of GCN layer.

        Args:
            x: Node features (num_nodes, in_features)
            adj: Normalized adjacency matrix (num_nodes, num_nodes)

        Returns:
            Updated node features (num_nodes, out_features)
        """
        # Linear transformation
        support = torch.mm(x, self.weight)
        # Graph convolution (neighborhood aggregation)
        output = torch.spmm(adj, support)

        if self.bias is not None:
            output = output + self.bias

        return output


class GCN(nn.Module):
    """Complete GCN model for node classification"""

    def __init__(self, num_features, num_hidden, num_classes, dropout=0.5):
        super().__init__()
        self.conv1 = GCNLayer(num_features, num_hidden)
        self.conv2 = GCNLayer(num_hidden, num_classes)
        self.dropout = dropout

    def forward(self, x, adj):
        # First GCN layer with ReLU activation
        x = self.conv1(x, adj)
        x = F.relu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)

        # Second GCN layer (output layer)
        x = self.conv2(x, adj)

        return F.log_softmax(x, dim=1)


def normalize_adjacency(adj):
    """
    Compute the normalized adjacency matrix with self-loops.

    D^(-1/2) * (A + I) * D^(-1/2)
    """
    # Add self-loops
    adj = adj + torch.eye(adj.size(0), device=adj.device)

    # Compute degree matrix
    degree = adj.sum(dim=1)
    degree_inv_sqrt = torch.pow(degree, -0.5)
    degree_inv_sqrt[torch.isinf(degree_inv_sqrt)] = 0.0

    # Normalize: D^(-1/2) * A * D^(-1/2)
    d_mat_inv_sqrt = torch.diag(degree_inv_sqrt)
    normalized_adj = torch.mm(torch.mm(d_mat_inv_sqrt, adj), d_mat_inv_sqrt)

    return normalized_adj


# Example: Node classification on a small graph
num_nodes = 100
num_features = 16
num_classes = 7

# Create random graph data
x = torch.randn(num_nodes, num_features)
adj = torch.rand(num_nodes, num_nodes) > 0.9  # Sparse random adjacency
adj = adj.float()
adj = (adj + adj.t()) / 2  # Make symmetric (undirected)

# Normalize adjacency
adj_norm = normalize_adjacency(adj)

# Create model and run forward pass
model = GCN(num_features=num_features, num_hidden=64, num_classes=num_classes)
output = model(x, adj_norm)
print(f"GCN output shape: {output.shape}")  # (100, 7) - probability for each class
```

### GCN Limitations

1. **Over-smoothing**: Deep GCNs cause node representations to become indistinguishable
2. **Fixed aggregation**: Equal weight to all neighbors
3. **Transductive**: Cannot easily handle new (unseen) nodes
4. **Scalability**: Full-batch training requires entire graph in memory

---

## GraphSAGE: Sampling and Aggregation

**GraphSAGE (Graph SAmple and aggreGatE)**, introduced by Hamilton et al. (2017), addresses scalability and inductive learning limitations of GCN.

### Key Innovations

1. **Sampling**: Instead of using all neighbors, sample a fixed number
2. **Aggregation**: Use learnable aggregation functions
3. **Inductive**: Generate embeddings for unseen nodes

### Algorithm

For each layer:
1. Sample a fixed number of neighbors for each node
2. Aggregate neighbor features using a learnable aggregator
3. Concatenate with the node's own features and transform

$$h_v^{(k)} = \sigma\left(W^{(k)} \cdot \text{CONCAT}\left(h_v^{(k-1)}, \text{AGGREGATE}_k\left(\{h_u^{(k-1)} : u \in \mathcal{N}_s(v)\}\right)\right)\right)$$

Where $\mathcal{N}_s(v)$ is the sampled neighborhood of node $v$.

### Aggregator Types

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import List

class MeanAggregator(nn.Module):
    """Mean aggregator for GraphSAGE"""

    def __init__(self, in_features, out_features):
        super().__init__()
        self.linear = nn.Linear(in_features * 2, out_features)

    def forward(self, self_feats, neighbor_feats):
        """
        Args:
            self_feats: Features of center nodes (batch_size, in_features)
            neighbor_feats: Features of neighbors (batch_size, num_samples, in_features)
        """
        # Mean aggregation over neighbors
        neighbor_mean = neighbor_feats.mean(dim=1)

        # Concatenate self and neighbor features
        combined = torch.cat([self_feats, neighbor_mean], dim=-1)

        return F.relu(self.linear(combined))


class MaxPoolAggregator(nn.Module):
    """Max pooling aggregator for GraphSAGE"""

    def __init__(self, in_features, out_features, hidden_features=None):
        super().__init__()
        hidden_features = hidden_features or in_features

        # MLP applied to each neighbor before pooling
        self.neighbor_mlp = nn.Sequential(
            nn.Linear(in_features, hidden_features),
            nn.ReLU(),
        )
        self.linear = nn.Linear(in_features + hidden_features, out_features)

    def forward(self, self_feats, neighbor_feats):
        # Apply MLP to neighbors
        neighbor_transformed = self.neighbor_mlp(neighbor_feats)

        # Max pooling over neighbors
        neighbor_pooled = neighbor_transformed.max(dim=1)[0]

        # Concatenate and transform
        combined = torch.cat([self_feats, neighbor_pooled], dim=-1)

        return F.relu(self.linear(combined))


class LSTMAggregator(nn.Module):
    """LSTM aggregator for GraphSAGE (requires neighbor ordering)"""

    def __init__(self, in_features, out_features):
        super().__init__()
        self.lstm = nn.LSTM(in_features, in_features, batch_first=True)
        self.linear = nn.Linear(in_features * 2, out_features)

    def forward(self, self_feats, neighbor_feats):
        # LSTM over neighbors (after random permutation in practice)
        _, (h_n, _) = self.lstm(neighbor_feats)
        neighbor_lstm = h_n.squeeze(0)

        # Concatenate and transform
        combined = torch.cat([self_feats, neighbor_lstm], dim=-1)

        return F.relu(self.linear(combined))
```

### Complete GraphSAGE Implementation

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import List, Tuple

class NeighborSampler:
    """Samples fixed number of neighbors for each node"""

    def __init__(self, adj_list: List[List[int]], num_samples: List[int]):
        """
        Args:
            adj_list: Adjacency list representation of graph
            num_samples: Number of neighbors to sample at each layer
        """
        self.adj_list = adj_list
        self.num_samples = num_samples

    def sample(self, nodes: np.ndarray) -> List[Tuple[np.ndarray, np.ndarray]]:
        """
        Sample neighbors for given nodes at each layer.

        Returns:
            List of (sampled_nodes, sampled_neighbors) for each layer
        """
        samples = []
        current_nodes = nodes

        for num_sample in self.num_samples:
            sampled_neighbors = []

            for node in current_nodes:
                neighbors = self.adj_list[node]
                if len(neighbors) == 0:
                    # Node has no neighbors, sample itself
                    sampled = [node] * num_sample
                elif len(neighbors) < num_sample:
                    # Sample with replacement
                    sampled = np.random.choice(neighbors, num_sample, replace=True)
                else:
                    # Sample without replacement
                    sampled = np.random.choice(neighbors, num_sample, replace=False)
                sampled_neighbors.append(sampled)

            sampled_neighbors = np.array(sampled_neighbors)
            samples.append((current_nodes, sampled_neighbors))

            # Prepare for next layer (unique neighbors become current nodes)
            current_nodes = np.unique(sampled_neighbors.flatten())

        return samples


class GraphSAGELayer(nn.Module):
    """Single GraphSAGE layer"""

    def __init__(self, in_features, out_features, aggregator_type='mean'):
        super().__init__()
        self.aggregator_type = aggregator_type

        if aggregator_type == 'mean':
            self.aggregator = MeanAggregator(in_features, out_features)
        elif aggregator_type == 'maxpool':
            self.aggregator = MaxPoolAggregator(in_features, out_features)
        elif aggregator_type == 'lstm':
            self.aggregator = LSTMAggregator(in_features, out_features)
        else:
            raise ValueError(f"Unknown aggregator type: {aggregator_type}")

    def forward(self, self_feats, neighbor_feats):
        return self.aggregator(self_feats, neighbor_feats)


class GraphSAGE(nn.Module):
    """Complete GraphSAGE model"""

    def __init__(self, num_features, hidden_dims: List[int], num_classes,
                 aggregator_type='mean', dropout=0.5):
        super().__init__()

        self.num_layers = len(hidden_dims)
        self.dropout = dropout

        # Build layers
        dims = [num_features] + hidden_dims
        self.layers = nn.ModuleList([
            GraphSAGELayer(dims[i], dims[i+1], aggregator_type)
            for i in range(self.num_layers)
        ])

        # Output classifier
        self.classifier = nn.Linear(hidden_dims[-1], num_classes)

    def forward(self, x, sampled_neighbors_list):
        """
        Forward pass using pre-sampled neighbors.

        Args:
            x: All node features (num_nodes, num_features)
            sampled_neighbors_list: List of (batch_nodes, sampled_neighbors) per layer
        """
        h = x

        for layer_idx, layer in enumerate(self.layers):
            batch_nodes, sampled_neighbors = sampled_neighbors_list[layer_idx]

            # Get features for batch nodes and their sampled neighbors
            self_feats = h[batch_nodes]
            neighbor_feats = h[sampled_neighbors]

            # Apply GraphSAGE layer
            h_new = layer(self_feats, neighbor_feats)
            h_new = F.dropout(h_new, p=self.dropout, training=self.training)

            # L2 normalize
            h_new = F.normalize(h_new, p=2, dim=1)

            # Update features for batch nodes
            h = h.clone()
            h[batch_nodes] = h_new

        # Classification
        batch_nodes = sampled_neighbors_list[0][0]
        output = self.classifier(h[batch_nodes])

        return F.log_softmax(output, dim=1)
```

### GraphSAGE Advantages

| Feature | Benefit |
|---------|---------|
| Sampling | Scalable to large graphs |
| Inductive | Handles new nodes without retraining |
| Flexible aggregators | Can capture different patterns |
| Mini-batch training | Memory efficient |

---

## Graph Attention Networks (GAT)

**Graph Attention Networks (GAT)**, introduced by Velickovic et al. (2018), use attention mechanisms to learn adaptive importance weights for neighbors.

### Motivation

Unlike GCN (equal neighbor weights) or GraphSAGE (learned but fixed aggregation), GAT learns to assign different importance to different neighbors **dynamically based on node features**.

### Attention Mechanism

For each edge $(i, j)$, compute attention coefficient:

$$e_{ij} = \text{LeakyReLU}\left(\mathbf{a}^T \left[\mathbf{W}\mathbf{h}_i \| \mathbf{W}\mathbf{h}_j\right]\right)$$

Normalize using softmax over all neighbors:

$$\alpha_{ij} = \frac{\exp(e_{ij})}{\sum_{k \in \mathcal{N}(i)} \exp(e_{ik})}$$

Compute output features:

$$\mathbf{h}'_i = \sigma\left(\sum_{j \in \mathcal{N}(i)} \alpha_{ij} \mathbf{W}\mathbf{h}_j\right)$$

### Multi-Head Attention

To stabilize learning, GAT uses multiple attention heads:

$$\mathbf{h}'_i = \|_{k=1}^{K} \sigma\left(\sum_{j \in \mathcal{N}(i)} \alpha_{ij}^k \mathbf{W}^k\mathbf{h}_j\right)$$

Where $\|$ denotes concatenation and $K$ is the number of heads.

### Implementation

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class GATLayer(nn.Module):
    """Graph Attention Network Layer"""

    def __init__(self, in_features, out_features, num_heads=1,
                 dropout=0.6, alpha=0.2, concat=True):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.num_heads = num_heads
        self.concat = concat
        self.dropout = dropout
        self.alpha = alpha

        # Learnable parameters for each attention head
        self.W = nn.Parameter(torch.FloatTensor(num_heads, in_features, out_features))
        self.a = nn.Parameter(torch.FloatTensor(num_heads, 2 * out_features, 1))

        self.leaky_relu = nn.LeakyReLU(alpha)
        self.reset_parameters()

    def reset_parameters(self):
        nn.init.xavier_uniform_(self.W)
        nn.init.xavier_uniform_(self.a)

    def forward(self, x, edge_index):
        """
        Forward pass of GAT layer.

        Args:
            x: Node features (num_nodes, in_features)
            edge_index: Edge indices (2, num_edges)

        Returns:
            Updated node features
        """
        num_nodes = x.size(0)

        # Linear transformation for each head
        # (num_heads, num_nodes, out_features)
        h = torch.einsum('nf,hfo->hno', x, self.W)

        source_nodes = edge_index[0]
        target_nodes = edge_index[1]

        # Get source and target node features
        h_source = h[:, source_nodes, :]  # (num_heads, num_edges, out_features)
        h_target = h[:, target_nodes, :]

        # Concatenate source and target features
        edge_features = torch.cat([h_source, h_target], dim=-1)

        # Compute attention coefficients
        # (num_heads, num_edges, 1) -> (num_heads, num_edges)
        e = self.leaky_relu(torch.einsum('hef,hfx->hex', edge_features, self.a)).squeeze(-1)

        # Apply softmax over neighbors for each node
        attention = torch.zeros(self.num_heads, num_nodes, num_nodes, device=x.device)
        attention[:, target_nodes, source_nodes] = e

        # Mask non-edges with large negative value
        mask = torch.zeros(num_nodes, num_nodes, device=x.device)
        mask[target_nodes, source_nodes] = 1
        attention = attention.masked_fill(mask.unsqueeze(0) == 0, float('-inf'))

        # Softmax normalization
        attention = F.softmax(attention, dim=-1)
        attention = F.dropout(attention, p=self.dropout, training=self.training)

        # Replace NaN (from isolated nodes) with 0
        attention = torch.nan_to_num(attention, nan=0.0)

        # Aggregate neighbor features
        # (num_heads, num_nodes, out_features)
        h_prime = torch.bmm(attention, h)

        if self.concat:
            # Concatenate heads
            output = h_prime.permute(1, 0, 2).reshape(num_nodes, -1)
        else:
            # Average heads
            output = h_prime.mean(dim=0)

        return output


class GAT(nn.Module):
    """Complete GAT model for node classification"""

    def __init__(self, num_features, num_hidden, num_classes,
                 num_heads=8, dropout=0.6):
        super().__init__()

        # First GAT layer (multi-head, concat)
        self.gat1 = GATLayer(
            in_features=num_features,
            out_features=num_hidden,
            num_heads=num_heads,
            dropout=dropout,
            concat=True
        )

        # Second GAT layer (multi-head, average for classification)
        self.gat2 = GATLayer(
            in_features=num_hidden * num_heads,
            out_features=num_classes,
            num_heads=1,
            dropout=dropout,
            concat=False
        )

        self.dropout = dropout

    def forward(self, x, edge_index):
        # First GAT layer
        x = self.gat1(x, edge_index)
        x = F.elu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)

        # Second GAT layer
        x = self.gat2(x, edge_index)

        return F.log_softmax(x, dim=1)


# Example usage
num_nodes = 100
num_features = 16
num_classes = 7
num_edges = 500

# Random node features
x = torch.randn(num_nodes, num_features)

# Random edges
edge_index = torch.randint(0, num_nodes, (2, num_edges))

# Create and run model
model = GAT(
    num_features=num_features,
    num_hidden=8,
    num_classes=num_classes,
    num_heads=8
)

output = model(x, edge_index)
print(f"GAT output shape: {output.shape}")
```

### Comparison: GCN vs GraphSAGE vs GAT

| Aspect | GCN | GraphSAGE | GAT |
|--------|-----|-----------|-----|
| Neighbor weighting | Fixed (degree-based) | Learnable (aggregator) | Learnable (attention) |
| Scalability | Full-batch | Mini-batch sampling | Full-batch / sampling |
| Inductive capability | Transductive | Inductive | Both |
| Computational cost | Low | Medium | Higher |
| Interpretability | Low | Medium | High (attention weights) |

---

## Common GNN Tasks

### Node Classification

Predict labels for individual nodes (e.g., categorize users in a social network).

```python
import torch
import torch.nn.functional as F

def train_node_classification(model, x, edge_index, labels, train_mask,
                               optimizer, epochs=200):
    """
    Train GNN for node classification.

    Args:
        model: GNN model
        x: Node features
        edge_index: Edge indices
        labels: Node labels
        train_mask: Boolean mask for training nodes
        optimizer: Optimizer
        epochs: Number of training epochs
    """
    model.train()

    for epoch in range(epochs):
        optimizer.zero_grad()

        # Forward pass
        out = model(x, edge_index)

        # Compute loss only on training nodes
        loss = F.nll_loss(out[train_mask], labels[train_mask])

        # Backward pass
        loss.backward()
        optimizer.step()

        if epoch % 20 == 0:
            # Evaluate accuracy on training set
            with torch.no_grad():
                pred = model(x, edge_index).argmax(dim=1)
                train_acc = (pred[train_mask] == labels[train_mask]).float().mean()
            print(f"Epoch {epoch}: Loss = {loss.item():.4f}, Train Acc = {train_acc:.4f}")

    return model
```

### Graph Classification

Predict labels for entire graphs (e.g., classify molecules).

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class GraphClassifier(nn.Module):
    """GNN for graph-level classification"""

    def __init__(self, num_features, hidden_dim, num_classes, num_layers=3):
        super().__init__()

        # Node embedding layers
        self.convs = nn.ModuleList()
        self.convs.append(GCNLayer(num_features, hidden_dim))
        for _ in range(num_layers - 1):
            self.convs.append(GCNLayer(hidden_dim, hidden_dim))

        # Graph-level readout and classification
        self.pool = GlobalMeanPool()
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(hidden_dim, num_classes)
        )

    def forward(self, x, edge_index, batch):
        """
        Args:
            x: Node features (total_nodes, num_features)
            edge_index: Edge indices (2, total_edges)
            batch: Batch assignment vector (total_nodes,)
        """
        # Node embeddings
        for conv in self.convs:
            x = conv(x, edge_index)
            x = F.relu(x)

        # Graph-level pooling
        graph_embed = self.pool(x, batch)

        # Classification
        out = self.classifier(graph_embed)

        return F.log_softmax(out, dim=1)


class GlobalMeanPool(nn.Module):
    """Global mean pooling over nodes in each graph"""

    def forward(self, x, batch):
        """
        Args:
            x: Node features (total_nodes, hidden_dim)
            batch: Batch assignment (total_nodes,)
        """
        num_graphs = batch.max().item() + 1

        # Sum features for each graph
        pooled = torch.zeros(num_graphs, x.size(1), device=x.device)
        pooled.scatter_add_(0, batch.unsqueeze(1).expand_as(x), x)

        # Count nodes per graph
        counts = torch.bincount(batch, minlength=num_graphs).float().unsqueeze(1)

        # Mean pooling
        return pooled / counts
```

### Link Prediction

Predict whether edges exist between pairs of nodes (e.g., friend recommendations).

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class LinkPredictor(nn.Module):
    """GNN-based link prediction model"""

    def __init__(self, num_features, hidden_dim, num_layers=2):
        super().__init__()

        # GNN encoder
        self.convs = nn.ModuleList()
        self.convs.append(GCNLayer(num_features, hidden_dim))
        for _ in range(num_layers - 1):
            self.convs.append(GCNLayer(hidden_dim, hidden_dim))

        # Link prediction decoder
        self.decoder = nn.Sequential(
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(hidden_dim, 1)
        )

    def encode(self, x, edge_index):
        """Get node embeddings"""
        for conv in self.convs:
            x = conv(x, edge_index)
            x = F.relu(x)
        return x

    def decode(self, z, edge_pairs):
        """
        Predict link probability for given node pairs.

        Args:
            z: Node embeddings (num_nodes, hidden_dim)
            edge_pairs: Node pairs to predict (2, num_pairs)
        """
        src, dst = edge_pairs

        # Concatenate source and destination embeddings
        edge_features = torch.cat([z[src], z[dst]], dim=-1)

        # Predict link probability
        return torch.sigmoid(self.decoder(edge_features).squeeze(-1))

    def forward(self, x, edge_index, edge_pairs):
        z = self.encode(x, edge_index)
        return self.decode(z, edge_pairs)
```

---

## PyTorch Geometric Implementation

**PyTorch Geometric (PyG)** is the most popular library for GNNs in PyTorch, providing efficient implementations and datasets.

### Installation

```bash
pip install torch-geometric

# Additional dependencies for specific features
pip install pyg-lib torch-scatter torch-sparse torch-cluster torch-spline-conv
```

### Basic Usage

```python
import torch
import torch.nn.functional as F
from torch_geometric.nn import GCNConv, SAGEConv, GATConv
from torch_geometric.datasets import Planetoid
from torch_geometric.loader import NeighborLoader

# Load Cora dataset
dataset = Planetoid(root='/tmp/Cora', name='Cora')
data = dataset[0]

print(f"Dataset: {dataset}")
print(f"Number of graphs: {len(dataset)}")
print(f"Number of features: {dataset.num_features}")
print(f"Number of classes: {dataset.num_classes}")
print(f"Number of nodes: {data.num_nodes}")
print(f"Number of edges: {data.num_edges}")


class GCN_PyG(torch.nn.Module):
    """GCN using PyTorch Geometric"""

    def __init__(self, num_features, num_hidden, num_classes, dropout=0.5):
        super().__init__()
        self.conv1 = GCNConv(num_features, num_hidden)
        self.conv2 = GCNConv(num_hidden, num_classes)
        self.dropout = dropout

    def forward(self, data):
        x, edge_index = data.x, data.edge_index

        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)
        x = self.conv2(x, edge_index)

        return F.log_softmax(x, dim=1)


class GraphSAGE_PyG(torch.nn.Module):
    """GraphSAGE using PyTorch Geometric"""

    def __init__(self, num_features, num_hidden, num_classes, dropout=0.5):
        super().__init__()
        self.conv1 = SAGEConv(num_features, num_hidden)
        self.conv2 = SAGEConv(num_hidden, num_classes)
        self.dropout = dropout

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)
        x = self.conv2(x, edge_index)

        return F.log_softmax(x, dim=1)


class GAT_PyG(torch.nn.Module):
    """GAT using PyTorch Geometric"""

    def __init__(self, num_features, num_hidden, num_classes,
                 num_heads=8, dropout=0.6):
        super().__init__()
        self.conv1 = GATConv(num_features, num_hidden, heads=num_heads, dropout=dropout)
        self.conv2 = GATConv(num_hidden * num_heads, num_classes, heads=1,
                             concat=False, dropout=dropout)
        self.dropout = dropout

    def forward(self, data):
        x, edge_index = data.x, data.edge_index

        x = F.dropout(x, p=self.dropout, training=self.training)
        x = self.conv1(x, edge_index)
        x = F.elu(x)
        x = F.dropout(x, p=self.dropout, training=self.training)
        x = self.conv2(x, edge_index)

        return F.log_softmax(x, dim=1)
```

### Complete Training Pipeline

```python
import torch
import torch.nn.functional as F
from torch_geometric.datasets import Planetoid
from torch_geometric.transforms import NormalizeFeatures

def train(model, data, optimizer):
    model.train()
    optimizer.zero_grad()

    out = model(data)
    loss = F.nll_loss(out[data.train_mask], data.y[data.train_mask])

    loss.backward()
    optimizer.step()

    return loss.item()


@torch.no_grad()
def test(model, data):
    model.set_to_evaluation_mode()
    out = model(data)
    pred = out.argmax(dim=1)

    accs = {}
    for split in ['train_mask', 'val_mask', 'test_mask']:
        mask = getattr(data, split)
        correct = (pred[mask] == data.y[mask]).sum()
        accs[split] = correct.item() / mask.sum().item()

    return accs


def run_experiment(model_class, dataset_name='Cora', epochs=200, lr=0.01,
                   weight_decay=5e-4, hidden=16):
    """Run complete GNN experiment"""

    # Load dataset
    dataset = Planetoid(root=f'/tmp/{dataset_name}', name=dataset_name,
                        transform=NormalizeFeatures())
    data = dataset[0]

    # Create model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model_class(
        num_features=dataset.num_features,
        num_hidden=hidden,
        num_classes=dataset.num_classes
    ).to(device)
    data = data.to(device)

    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=weight_decay)

    # Training loop
    best_val_acc = 0
    best_test_acc = 0

    for epoch in range(1, epochs + 1):
        loss = train(model, data, optimizer)
        accs = test(model, data)

        if accs['val_mask'] > best_val_acc:
            best_val_acc = accs['val_mask']
            best_test_acc = accs['test_mask']

        if epoch % 20 == 0:
            print(f"Epoch {epoch:03d}: Loss={loss:.4f}, "
                  f"Train={accs['train_mask']:.4f}, "
                  f"Val={accs['val_mask']:.4f}, "
                  f"Test={accs['test_mask']:.4f}")

    print(f"\nBest Val Acc: {best_val_acc:.4f}")
    print(f"Best Test Acc: {best_test_acc:.4f}")

    return best_test_acc
```

### Mini-Batch Training for Large Graphs

```python
from torch_geometric.loader import NeighborLoader

def train_minibatch(model, data, optimizer, batch_size=1024, num_neighbors=[25, 10]):
    """Mini-batch training using NeighborLoader"""

    # Create data loader for training nodes
    train_loader = NeighborLoader(
        data,
        num_neighbors=num_neighbors,
        batch_size=batch_size,
        input_nodes=data.train_mask,
        shuffle=True
    )

    model.train()
    total_loss = 0

    for batch in train_loader:
        optimizer.zero_grad()

        # Forward pass on subgraph
        out = model(batch.x, batch.edge_index)

        # Only compute loss for seed nodes (first batch_size nodes)
        loss = F.nll_loss(out[:batch.batch_size], batch.y[:batch.batch_size])

        loss.backward()
        optimizer.step()

        total_loss += loss.item() * batch.batch_size

    return total_loss / int(data.train_mask.sum())
```

### Graph Classification with PyG

```python
import torch
import torch.nn.functional as F
from torch_geometric.nn import GCNConv, global_mean_pool, global_max_pool
from torch_geometric.datasets import TUDataset
from torch_geometric.loader import DataLoader

class GraphClassifier_PyG(torch.nn.Module):
    """Graph classification model using PyG"""

    def __init__(self, num_features, hidden_dim, num_classes, num_layers=3):
        super().__init__()

        self.convs = torch.nn.ModuleList()
        self.convs.append(GCNConv(num_features, hidden_dim))
        for _ in range(num_layers - 1):
            self.convs.append(GCNConv(hidden_dim, hidden_dim))

        self.classifier = torch.nn.Sequential(
            torch.nn.Linear(hidden_dim * 2, hidden_dim),  # concat mean and max
            torch.nn.ReLU(),
            torch.nn.Dropout(0.5),
            torch.nn.Linear(hidden_dim, num_classes)
        )

    def forward(self, data):
        x, edge_index, batch = data.x, data.edge_index, data.batch

        # Node embeddings
        for conv in self.convs:
            x = conv(x, edge_index)
            x = F.relu(x)

        # Graph-level readout (combine mean and max pooling)
        mean_pool = global_mean_pool(x, batch)
        max_pool = global_max_pool(x, batch)
        graph_embed = torch.cat([mean_pool, max_pool], dim=-1)

        # Classification
        return self.classifier(graph_embed)
```

---

## Advanced Topics and Best Practices

### Handling Over-Smoothing

Over-smoothing occurs when node representations become indistinguishable after many GNN layers.

**Solutions:**

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class ResidualGCN(nn.Module):
    """GCN with residual connections to mitigate over-smoothing"""

    def __init__(self, num_features, hidden_dim, num_classes, num_layers=8):
        super().__init__()

        self.input_proj = nn.Linear(num_features, hidden_dim)

        self.convs = nn.ModuleList([
            GCNLayer(hidden_dim, hidden_dim)
            for _ in range(num_layers)
        ])

        self.norms = nn.ModuleList([
            nn.LayerNorm(hidden_dim)
            for _ in range(num_layers)
        ])

        self.classifier = nn.Linear(hidden_dim, num_classes)
        self.dropout = 0.5

    def forward(self, x, adj):
        x = self.input_proj(x)

        for conv, norm in zip(self.convs, self.norms):
            # Residual connection
            identity = x
            x = conv(x, adj)
            x = norm(x)
            x = F.relu(x)
            x = F.dropout(x, p=self.dropout, training=self.training)
            x = x + identity  # Skip connection

        return F.log_softmax(self.classifier(x), dim=1)


class JumpingKnowledge(nn.Module):
    """Jumping Knowledge Networks - aggregate representations from all layers"""

    def __init__(self, num_features, hidden_dim, num_classes, num_layers=4, mode='cat'):
        super().__init__()

        self.mode = mode
        self.convs = nn.ModuleList()
        self.convs.append(GCNLayer(num_features, hidden_dim))
        for _ in range(num_layers - 1):
            self.convs.append(GCNLayer(hidden_dim, hidden_dim))

        if mode == 'cat':
            self.classifier = nn.Linear(hidden_dim * num_layers, num_classes)
        elif mode == 'max':
            self.classifier = nn.Linear(hidden_dim, num_classes)
        elif mode == 'lstm':
            self.lstm = nn.LSTM(hidden_dim, hidden_dim, batch_first=True)
            self.classifier = nn.Linear(hidden_dim, num_classes)

    def forward(self, x, adj):
        layer_outputs = []

        for conv in self.convs:
            x = conv(x, adj)
            x = F.relu(x)
            layer_outputs.append(x)

        if self.mode == 'cat':
            # Concatenate all layer outputs
            h = torch.cat(layer_outputs, dim=-1)
        elif self.mode == 'max':
            # Element-wise max
            h = torch.stack(layer_outputs, dim=0).max(dim=0)[0]
        elif self.mode == 'lstm':
            # LSTM aggregation
            stacked = torch.stack(layer_outputs, dim=1)
            _, (h, _) = self.lstm(stacked)
            h = h.squeeze(0)

        return F.log_softmax(self.classifier(h), dim=1)
```

### Best Practices Summary

| Aspect | Recommendation |
|--------|---------------|
| **Model Depth** | 2-3 layers usually sufficient; use residual connections for deeper |
| **Hidden Dimensions** | 64-256 for most tasks |
| **Dropout** | 0.5-0.6 for small datasets, 0.1-0.3 for large |
| **Normalization** | LayerNorm or BatchNorm between layers |
| **Aggregation** | Mean for homogeneous degree; sum for varying degree |
| **Learning Rate** | 0.01 for GCN, 0.005 for GAT |
| **Weight Decay** | 5e-4 to 1e-3 |
| **Early Stopping** | Monitor validation performance |

---

## Interview Questions

### Conceptual Questions

**Q1: What is the key difference between GNN and traditional neural networks?**

A: Traditional neural networks (CNNs, RNNs) assume regular, grid-like input structures. GNNs operate on irregular graph structures by:
- Handling varying numbers of neighbors per node
- Being permutation invariant (node ordering doesn't matter)
- Aggregating information from local neighborhoods through message passing

**Q2: Explain the over-smoothing problem in GNNs and how to address it.**

A: Over-smoothing occurs when node representations become increasingly similar as we stack more GNN layers. After many iterations, all nodes converge to similar representations, losing discriminative power.

Solutions include:
- Residual/skip connections
- Jumping Knowledge networks (aggregate all layer outputs)
- DropEdge (randomly drop edges during training)
- PairNorm (normalize to maintain feature diversity)
- Using fewer layers (2-3 is often optimal)

**Q3: Compare GCN, GraphSAGE, and GAT.**

A:
- **GCN**: Uses fixed, degree-based neighbor weighting. Efficient but requires full-batch training.
- **GraphSAGE**: Samples neighbors and uses learnable aggregators. Enables mini-batch training and inductive learning.
- **GAT**: Uses attention to learn adaptive neighbor weights. Most expressive but computationally expensive.

**Q4: What is the difference between transductive and inductive learning in GNNs?**

A:
- **Transductive**: Model sees all nodes (including test nodes) during training, only labels are masked. Cannot generalize to new nodes. (GCN default mode)
- **Inductive**: Model trained on subset of nodes, must generalize to unseen nodes at test time. Requires sampling-based methods like GraphSAGE.

### Implementation Questions

**Q5: Implement attention coefficient computation for GAT.**

```python
def compute_attention(self, h_i, h_j, a):
    """
    Compute attention coefficient between nodes i and j.

    Args:
        h_i: Transformed features of node i (out_features,)
        h_j: Transformed features of node j (out_features,)
        a: Attention weight vector (2 * out_features,)

    Returns:
        Unnormalized attention coefficient
    """
    # Concatenate features
    concat = torch.cat([h_i, h_j], dim=-1)

    # Compute attention score
    e = F.leaky_relu(torch.dot(a, concat), negative_slope=0.2)

    return e
```

**Q6: How would you handle a graph that doesn't fit in GPU memory?**

A: Several approaches:
1. **Mini-batch training with neighbor sampling** (GraphSAGE approach)
2. **Graph partitioning**: Split graph into subgraphs, train on each
3. **Layer-wise training**: Compute one layer at a time, store intermediate results
4. **Gradient checkpointing**: Trade compute for memory
5. **Use sparse operations**: Avoid dense adjacency matrices

---

## Further Reading

### Key Papers

1. **GCN**: "Semi-Supervised Classification with Graph Convolutional Networks" (Kipf & Welling, 2017)
2. **GraphSAGE**: "Inductive Representation Learning on Large Graphs" (Hamilton et al., 2017)
3. **GAT**: "Graph Attention Networks" (Velickovic et al., 2018)
4. **GIN**: "How Powerful are Graph Neural Networks?" (Xu et al., 2019)
5. **Over-smoothing**: "Deeper Insights into Graph Convolutional Networks" (Li et al., 2018)

### Resources

- **PyTorch Geometric Documentation**: https://pytorch-geometric.readthedocs.io/
- **Deep Graph Library (DGL)**: Alternative GNN library
- **Stanford CS224W**: Machine Learning with Graphs course
- **OGB**: Open Graph Benchmark for standardized evaluation

### Advanced Topics to Explore

1. **Expressive Power**: Weisfeiler-Lehman test and GNN expressiveness
2. **Equivariant GNNs**: For 3D molecular structures
3. **Temporal GNNs**: For dynamic graphs
4. **Knowledge Graph Embeddings**: TransE, RotatE, CompGCN
5. **Graph Transformers**: Combining attention with graph structure
6. **Self-Supervised Learning on Graphs**: Contrastive methods, masked prediction

---

## Summary

Graph Neural Networks have revolutionized machine learning on structured data. Key takeaways:

1. **Message Passing** is the unifying framework for most GNNs
2. **GCN** provides efficient spectral-inspired convolutions
3. **GraphSAGE** enables scalable, inductive learning through sampling
4. **GAT** learns adaptive attention weights for neighbors
5. **PyTorch Geometric** offers production-ready implementations
6. **Over-smoothing** limits depth; use residual connections or layer aggregation
7. Choose model based on: graph size, inductive needs, interpretability requirements

As graph data becomes increasingly important in AI applications, from social networks to drug discovery, mastering GNNs is essential for modern machine learning practitioners.
