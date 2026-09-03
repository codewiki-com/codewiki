---
title: "Automated Machine Learning: Neural Architecture Search"
description: "Explore NAS methods: DARTS, evolutionary algorithms, and RL-based NAS"
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - NAS
  - architecture search
  - DARTS
  - AutoML
status: imported
origin: old/src/content/docs/datascience/neural-architecture-search.en.md
divergence: 0.206
issues:
  - missing-subcategory-zh
  - order-mismatch
  - category-casing
legacy:
  category: DataScience
  subcategory: AutoML
  order: 38
  lastUpdated: 2026-01-07
---

Neural Architecture Search (NAS) represents one of the most significant advances in automated machine learning, enabling the automatic discovery of optimal neural network architectures. Rather than relying on human intuition and expertise to design network structures, NAS algorithms systematically explore the space of possible architectures to find designs that achieve superior performance on target tasks.

---

## NAS Problem Definition

### The Architecture Design Challenge

Designing effective neural network architectures has traditionally been a labor-intensive process requiring deep expertise. Consider the evolution from LeNet to ResNet to EfficientNet - each breakthrough required years of research and countless experiments. NAS aims to automate this process.

**Formal Definition:**

Neural Architecture Search can be formulated as an optimization problem:

$$\alpha^* = \arg\max_{\alpha \in \mathcal{A}} \text{Accuracy}(\mathcal{N}(\alpha, w^*(\alpha)), \mathcal{D}_{val})$$

where:
- $\mathcal{A}$ is the search space of possible architectures
- $\alpha$ represents an architecture configuration
- $w^*(\alpha)$ are the optimal weights for architecture $\alpha$
- $\mathcal{D}_{val}$ is the validation dataset

**Bi-Level Optimization:**

NAS is inherently a bi-level optimization problem:

$$\min_{\alpha} \mathcal{L}_{val}(w^*(\alpha), \alpha)$$
$$\text{s.t.} \quad w^*(\alpha) = \arg\min_w \mathcal{L}_{train}(w, \alpha)$$

The outer optimization searches for the best architecture, while the inner optimization trains each candidate architecture to convergence.

### Core Components of NAS

```python
# Conceptual framework for NAS
class NASFramework:
    """Abstract framework for Neural Architecture Search"""

    def __init__(self, search_space, search_strategy, performance_estimator):
        self.search_space = search_space
        self.search_strategy = search_strategy
        self.performance_estimator = performance_estimator

    def search(self, budget):
        """Main NAS loop"""
        best_architecture = None
        best_performance = float('-inf')

        for iteration in range(budget):
            # 1. Sample or generate candidate architecture
            architecture = self.search_strategy.propose(self.search_space)

            # 2. Estimate performance
            performance = self.performance_estimator.evaluate(architecture)

            # 3. Update search strategy based on feedback
            self.search_strategy.update(architecture, performance)

            # 4. Track best architecture
            if performance > best_performance:
                best_performance = performance
                best_architecture = architecture

        return best_architecture, best_performance
```

---

## Search Space Design

The search space defines what architectures NAS can discover. A well-designed search space balances expressiveness (ability to represent good architectures) with tractability (feasibility of search).

### Cell-Based Search Spaces

Modern NAS typically searches for **cells** (small repeating modules) rather than entire networks. This dramatically reduces the search space while leveraging the insight that good architectures often consist of repeated patterns.

```python
import torch
import torch.nn as nn

class Operation(nn.Module):
    """Base class for searchable operations"""
    pass

class SeparableConv(Operation):
    """Depthwise separable convolution"""
    def __init__(self, in_channels, out_channels, kernel_size, stride=1):
        super().__init__()
        padding = kernel_size // 2
        self.depthwise = nn.Conv2d(
            in_channels, in_channels, kernel_size,
            stride=stride, padding=padding, groups=in_channels, bias=False
        )
        self.pointwise = nn.Conv2d(in_channels, out_channels, 1, bias=False)
        self.bn = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        x = self.depthwise(x)
        x = self.pointwise(x)
        x = self.bn(x)
        return self.relu(x)

class DilatedConv(Operation):
    """Dilated convolution for larger receptive fields"""
    def __init__(self, in_channels, out_channels, kernel_size, dilation=2):
        super().__init__()
        padding = (kernel_size // 2) * dilation
        self.conv = nn.Conv2d(
            in_channels, out_channels, kernel_size,
            padding=padding, dilation=dilation, bias=False
        )
        self.bn = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        return self.relu(self.bn(self.conv(x)))

class Identity(Operation):
    """Skip connection / identity mapping"""
    def __init__(self):
        super().__init__()

    def forward(self, x):
        return x

class Zero(Operation):
    """Zero operation - effectively removes edge"""
    def __init__(self, stride=1):
        super().__init__()
        self.stride = stride

    def forward(self, x):
        if self.stride == 1:
            return x.mul(0.)
        return x[:, :, ::self.stride, ::self.stride].mul(0.)

class PoolBN(Operation):
    """Pooling followed by batch normalization"""
    def __init__(self, pool_type, channels, kernel_size=3, stride=1):
        super().__init__()
        padding = kernel_size // 2
        if pool_type == 'max':
            self.pool = nn.MaxPool2d(kernel_size, stride, padding)
        elif pool_type == 'avg':
            self.pool = nn.AvgPool2d(kernel_size, stride, padding)
        self.bn = nn.BatchNorm2d(channels)

    def forward(self, x):
        return self.bn(self.pool(x))


# Standard operation set used in DARTS and similar methods
PRIMITIVES = [
    'none',           # Zero operation
    'max_pool_3x3',   # Max pooling
    'avg_pool_3x3',   # Average pooling
    'skip_connect',   # Identity / skip connection
    'sep_conv_3x3',   # Separable conv 3x3
    'sep_conv_5x5',   # Separable conv 5x5
    'dil_conv_3x3',   # Dilated conv 3x3, dilation=2
    'dil_conv_5x5',   # Dilated conv 5x5, dilation=2
]

def get_operation(name, in_channels, out_channels, stride=1):
    """Factory function to create operations by name"""
    if name == 'none':
        return Zero(stride)
    elif name == 'max_pool_3x3':
        return PoolBN('max', out_channels, 3, stride)
    elif name == 'avg_pool_3x3':
        return PoolBN('avg', out_channels, 3, stride)
    elif name == 'skip_connect':
        if stride == 1:
            return Identity()
        else:
            return nn.Sequential(
                nn.AvgPool2d(stride, stride),
                nn.Conv2d(in_channels, out_channels, 1, bias=False),
                nn.BatchNorm2d(out_channels)
            )
    elif name == 'sep_conv_3x3':
        return SeparableConv(in_channels, out_channels, 3, stride)
    elif name == 'sep_conv_5x5':
        return SeparableConv(in_channels, out_channels, 5, stride)
    elif name == 'dil_conv_3x3':
        return DilatedConv(in_channels, out_channels, 3, dilation=2)
    elif name == 'dil_conv_5x5':
        return DilatedConv(in_channels, out_channels, 5, dilation=2)
```

### Directed Acyclic Graph (DAG) Representation

Cells are typically represented as DAGs where nodes are feature maps and edges are operations:

```python
class Cell(nn.Module):
    """
    A searchable cell represented as a DAG.

    The cell has multiple intermediate nodes. Each node receives inputs
    from all previous nodes, with edges representing operations.
    """

    def __init__(self, num_nodes, channels, reduction=False):
        super().__init__()
        self.num_nodes = num_nodes
        self.reduction = reduction
        stride = 2 if reduction else 1

        # Operations between all pairs of nodes
        self.ops = nn.ModuleDict()

        # Each node i receives input from nodes 0, 1, ..., i-1
        # Nodes 0 and 1 are the two input nodes
        for i in range(2, num_nodes):
            for j in range(i):
                # Create all possible operations for edge (j, i)
                edge_ops = nn.ModuleList([
                    get_operation(
                        prim, channels, channels,
                        stride if reduction and j < 2 else 1
                    )
                    for prim in PRIMITIVES
                ])
                self.ops[f'{j}_{i}'] = edge_ops

        # Concat all intermediate node outputs
        self.num_intermediate = num_nodes - 2

    def forward(self, s0, s1, weights):
        """
        Args:
            s0: Output from cell k-2
            s1: Output from cell k-1
            weights: Architecture weights (alpha) for each edge
        """
        states = [s0, s1]

        for i in range(2, self.num_nodes):
            # Compute weighted sum of all incoming edges
            node_inputs = []
            for j in range(i):
                edge_key = f'{j}_{i}'
                edge_ops = self.ops[edge_key]
                edge_weights = weights[edge_key]

                # Weighted sum of all operations
                edge_output = sum(
                    w * op(states[j])
                    for w, op in zip(edge_weights, edge_ops)
                )
                node_inputs.append(edge_output)

            # Sum inputs to node i
            states.append(sum(node_inputs))

        # Concat all intermediate nodes
        return torch.cat(states[2:], dim=1)
```

### Macro vs Micro Search Spaces

| Aspect | Micro (Cell-based) | Macro (Full Network) |
|--------|-------------------|---------------------|
| Search Space Size | Smaller | Much larger |
| Transferability | High (cells transfer across tasks) | Lower |
| Search Cost | More efficient | Very expensive |
| Flexibility | Limited to cell design | Complete architecture control |
| Examples | DARTS, ENAS, NASNet | NAS-RL, AmoebaNet |

---

## Search Strategies

### Random Search

Despite its simplicity, random search is a surprisingly strong baseline for NAS. It samples architectures uniformly from the search space and evaluates each independently.

```python
import random
import numpy as np

class RandomSearch:
    """Random search strategy for NAS"""

    def __init__(self, search_space):
        self.search_space = search_space
        self.history = []

    def propose(self):
        """Sample a random architecture"""
        architecture = {}

        for edge in self.search_space.edges:
            # Randomly select an operation for each edge
            op_idx = random.randint(0, len(PRIMITIVES) - 1)
            architecture[edge] = op_idx

        return architecture

    def update(self, architecture, performance):
        """Record result (random search doesn't use this)"""
        self.history.append((architecture, performance))

    def get_best(self):
        """Return best architecture found so far"""
        return max(self.history, key=lambda x: x[1])


class RandomSearchNAS:
    """Complete random search NAS implementation"""

    def __init__(self, search_space, evaluator, budget=100):
        self.search_space = search_space
        self.evaluator = evaluator
        self.budget = budget

    def search(self):
        results = []

        for i in range(self.budget):
            # Sample random architecture
            arch = self._sample_architecture()

            # Evaluate architecture
            accuracy = self.evaluator.evaluate(arch)
            results.append((arch, accuracy))

            print(f"Trial {i+1}/{self.budget}: Accuracy = {accuracy:.4f}")

        # Return best architecture
        best_arch, best_acc = max(results, key=lambda x: x[1])
        return best_arch, best_acc

    def _sample_architecture(self):
        """Sample architecture uniformly from search space"""
        return {
            edge: random.choice(PRIMITIVES)
            for edge in self.search_space.get_edges()
        }
```

### Evolutionary Algorithms

Evolutionary NAS applies principles from biological evolution: architectures "reproduce," "mutate," and undergo "natural selection" based on fitness (accuracy).

```python
import copy
from collections import deque

class EvolutionaryNAS:
    """
    Evolutionary algorithm for Neural Architecture Search.

    Based on regularized evolution (Real et al., 2019).
    """

    def __init__(
        self,
        search_space,
        evaluator,
        population_size=50,
        sample_size=25,
        mutation_prob=0.1,
        num_generations=500
    ):
        self.search_space = search_space
        self.evaluator = evaluator
        self.population_size = population_size
        self.sample_size = sample_size
        self.mutation_prob = mutation_prob
        self.num_generations = num_generations

    def search(self):
        """Main evolutionary search loop"""
        # Initialize population with random architectures
        population = deque()
        history = []

        # Create initial population
        while len(population) < self.population_size:
            arch = self._random_architecture()
            fitness = self.evaluator.evaluate(arch)
            population.append((arch, fitness))
            history.append((arch, fitness))

        best_arch, best_fitness = max(history, key=lambda x: x[1])

        # Evolution loop
        for gen in range(self.num_generations):
            # Tournament selection
            sample = random.sample(list(population), self.sample_size)
            parent_arch, parent_fitness = max(sample, key=lambda x: x[1])

            # Mutation
            child_arch = self._mutate(parent_arch)
            child_fitness = self.evaluator.evaluate(child_arch)

            # Add child to population
            population.append((child_arch, child_fitness))
            history.append((child_arch, child_fitness))

            # Remove oldest (regularized evolution)
            population.popleft()

            # Update best
            if child_fitness > best_fitness:
                best_fitness = child_fitness
                best_arch = child_arch

            if gen % 50 == 0:
                print(f"Generation {gen}: Best fitness = {best_fitness:.4f}")

        return best_arch, best_fitness

    def _random_architecture(self):
        """Generate random architecture"""
        return {
            edge: random.choice(PRIMITIVES)
            for edge in self.search_space.get_edges()
        }

    def _mutate(self, architecture):
        """Apply random mutation to architecture"""
        child = copy.deepcopy(architecture)

        # Randomly select mutation type
        mutation_type = random.choice(['op', 'edge'])

        if mutation_type == 'op':
            # Change operation on random edge
            edge = random.choice(list(child.keys()))
            current_op = child[edge]
            new_ops = [op for op in PRIMITIVES if op != current_op]
            child[edge] = random.choice(new_ops)

        elif mutation_type == 'edge':
            # Change which edges are active (for variable topology)
            pass  # Simplified version

        return child


class TournamentSelection:
    """Tournament selection for evolutionary algorithms"""

    def __init__(self, tournament_size=25):
        self.tournament_size = tournament_size

    def select(self, population):
        """Select parent using tournament selection"""
        tournament = random.sample(population, self.tournament_size)
        winner = max(tournament, key=lambda x: x[1])  # x[1] is fitness
        return winner[0]  # Return architecture


class Mutation:
    """Mutation operators for NAS"""

    @staticmethod
    def mutate_operation(architecture, primitives, prob=1.0):
        """Mutate a random operation in the architecture"""
        if random.random() > prob:
            return architecture

        arch = copy.deepcopy(architecture)
        edge = random.choice(list(arch.keys()))

        # Select different operation
        current = arch[edge]
        alternatives = [p for p in primitives if p != current]
        arch[edge] = random.choice(alternatives)

        return arch

    @staticmethod
    def mutate_hidden_state(architecture, num_nodes):
        """Mutate which hidden states are used (AmoebaNet style)"""
        arch = copy.deepcopy(architecture)
        # Implementation depends on specific encoding
        return arch
```

### Reinforcement Learning-Based NAS

RL-based NAS treats architecture generation as a sequential decision-making problem. A controller network (typically an RNN) generates architecture descriptions, and is trained using policy gradients based on the validation accuracy of the generated architectures.

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.distributions import Categorical

class NASController(nn.Module):
    """
    RNN Controller for RL-based NAS.

    The controller generates architectures by sampling operations
    sequentially. It is trained using REINFORCE.
    """

    def __init__(
        self,
        num_operations,
        num_nodes,
        hidden_size=100,
        temperature=1.0
    ):
        super().__init__()
        self.num_operations = num_operations
        self.num_nodes = num_nodes
        self.hidden_size = hidden_size
        self.temperature = temperature

        # LSTM controller
        self.lstm = nn.LSTMCell(hidden_size, hidden_size)

        # Embedding for operations
        self.op_embedding = nn.Embedding(num_operations, hidden_size)

        # Output heads
        self.op_classifier = nn.Linear(hidden_size, num_operations)
        self.node_classifier = nn.Linear(hidden_size, num_nodes)

        # Initial hidden state
        self.h0 = nn.Parameter(torch.zeros(1, hidden_size))
        self.c0 = nn.Parameter(torch.zeros(1, hidden_size))

        # Start token embedding
        self.start_token = nn.Parameter(torch.zeros(1, hidden_size))

    def forward(self, batch_size=1):
        """
        Generate architecture by sampling from controller.

        Returns:
            actions: List of (operation, input_node) tuples
            log_probs: Log probabilities for REINFORCE
            entropy: Entropy of the policy (for regularization)
        """
        h = self.h0.expand(batch_size, -1)
        c = self.c0.expand(batch_size, -1)

        actions = []
        log_probs = []
        entropies = []

        input_embed = self.start_token.expand(batch_size, -1)

        # Generate decisions for each edge in the cell
        num_edges = (self.num_nodes - 2) * (self.num_nodes - 1) // 2

        for _ in range(num_edges):
            # LSTM step
            h, c = self.lstm(input_embed, (h, c))

            # Sample operation
            op_logits = self.op_classifier(h) / self.temperature
            op_probs = F.softmax(op_logits, dim=-1)
            op_dist = Categorical(op_probs)
            op_action = op_dist.sample()

            actions.append(op_action)
            log_probs.append(op_dist.log_prob(op_action))
            entropies.append(op_dist.entropy())

            # Update input for next step
            input_embed = self.op_embedding(op_action)

        return actions, torch.stack(log_probs), torch.stack(entropies)

    def sample_architecture(self):
        """Sample a single architecture"""
        with torch.no_grad():
            actions, _, _ = self.forward(batch_size=1)
        return [a.item() for a in actions]


class REINFORCETrainer:
    """
    Train NAS controller using REINFORCE algorithm.
    """

    def __init__(
        self,
        controller,
        evaluator,
        lr=0.001,
        entropy_weight=0.01,
        baseline_decay=0.99
    ):
        self.controller = controller
        self.evaluator = evaluator
        self.optimizer = torch.optim.Adam(controller.parameters(), lr=lr)
        self.entropy_weight = entropy_weight
        self.baseline_decay = baseline_decay
        self.baseline = None

    def train_step(self, num_samples=10):
        """One training step of the controller"""

        rewards = []
        all_log_probs = []
        all_entropies = []

        # Sample architectures and evaluate
        for _ in range(num_samples):
            actions, log_probs, entropies = self.controller.forward(batch_size=1)

            # Convert actions to architecture
            architecture = self._actions_to_architecture(actions)

            # Evaluate architecture (expensive step)
            reward = self.evaluator.evaluate(architecture)

            rewards.append(reward)
            all_log_probs.append(log_probs.sum())
            all_entropies.append(entropies.mean())

        # Compute baseline (moving average of rewards)
        mean_reward = sum(rewards) / len(rewards)
        if self.baseline is None:
            self.baseline = mean_reward
        else:
            self.baseline = (self.baseline_decay * self.baseline +
                           (1 - self.baseline_decay) * mean_reward)

        # Compute policy gradient loss
        policy_loss = 0
        entropy_bonus = 0

        for reward, log_prob, entropy in zip(rewards, all_log_probs, all_entropies):
            advantage = reward - self.baseline
            policy_loss -= advantage * log_prob
            entropy_bonus += entropy

        policy_loss /= num_samples
        entropy_bonus /= num_samples

        # Total loss
        loss = policy_loss - self.entropy_weight * entropy_bonus

        # Update controller
        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.controller.parameters(), 1.0)
        self.optimizer.step()

        return mean_reward, loss.item()

    def _actions_to_architecture(self, actions):
        """Convert controller actions to architecture dict"""
        architecture = {}
        action_idx = 0

        for i in range(2, self.controller.num_nodes):
            for j in range(i):
                edge = f'{j}_{i}'
                architecture[edge] = PRIMITIVES[actions[action_idx].item()]
                action_idx += 1

        return architecture
```

### Comparison of Search Strategies

| Strategy | Pros | Cons | GPU Days (CIFAR-10) |
|----------|------|------|---------------------|
| Random Search | Simple, parallelizable, strong baseline | No learning from past samples | ~1000 |
| Evolutionary | Handles discrete spaces well, parallelizable | Requires many evaluations | ~3000 |
| RL-Based | Can learn search heuristics | High variance, unstable training | ~2000 |
| DARTS | Very efficient, continuous relaxation | Memory intensive, instability | ~1-4 |

---

## DARTS: Differentiable Architecture Search

DARTS (Differentiable Architecture Search) revolutionized NAS by making the search process differentiable, enabling gradient-based optimization. Instead of treating architecture selection as discrete, DARTS relaxes it to a continuous problem.

### Continuous Relaxation

Instead of selecting a single operation for each edge, DARTS maintains a probability distribution over operations:

$$\bar{o}(x) = \sum_{o \in \mathcal{O}} \frac{\exp(\alpha_o)}{\sum_{o' \in \mathcal{O}} \exp(\alpha_{o'})} \cdot o(x)$$

where $\alpha_o$ are learnable architecture parameters.

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MixedOperation(nn.Module):
    """
    Mixed operation for DARTS.

    Computes weighted sum of all candidate operations,
    with weights determined by softmax of architecture parameters.
    """

    def __init__(self, in_channels, out_channels, stride=1):
        super().__init__()
        self.ops = nn.ModuleList([
            get_operation(prim, in_channels, out_channels, stride)
            for prim in PRIMITIVES
        ])

    def forward(self, x, weights):
        """
        Args:
            x: Input tensor
            weights: Softmax weights for each operation
        """
        return sum(w * op(x) for w, op in zip(weights, self.ops))


class DARTSCell(nn.Module):
    """
    DARTS cell with continuous relaxation.
    """

    def __init__(self, num_nodes, channels, reduction=False):
        super().__init__()
        self.num_nodes = num_nodes
        self.reduction = reduction

        self.preprocess0 = nn.Sequential(
            nn.Conv2d(channels, channels, 1, bias=False),
            nn.BatchNorm2d(channels)
        )
        self.preprocess1 = nn.Sequential(
            nn.Conv2d(channels, channels, 1, bias=False),
            nn.BatchNorm2d(channels)
        )

        # Create mixed operations for all edges
        self.ops = nn.ModuleDict()
        self.num_edges = 0

        for i in range(2, num_nodes):
            for j in range(i):
                stride = 2 if reduction and j < 2 else 1
                self.ops[f'{j}_{i}'] = MixedOperation(channels, channels, stride)
                self.num_edges += 1

    def forward(self, s0, s1, alphas):
        """
        Args:
            s0: Output from cell k-2
            s1: Output from cell k-1
            alphas: Architecture parameters (shape: num_edges x num_ops)
        """
        s0 = self.preprocess0(s0)
        s1 = self.preprocess1(s1)

        states = [s0, s1]
        edge_idx = 0

        for i in range(2, self.num_nodes):
            node_inputs = []
            for j in range(i):
                edge_key = f'{j}_{i}'
                weights = F.softmax(alphas[edge_idx], dim=-1)
                node_inputs.append(self.ops[edge_key](states[j], weights))
                edge_idx += 1
            states.append(sum(node_inputs))

        # Concatenate intermediate nodes
        return torch.cat(states[2:], dim=1)


class DARTSNetwork(nn.Module):
    """
    Complete DARTS network for architecture search.
    """

    def __init__(
        self,
        num_classes,
        num_cells,
        num_nodes=4,
        init_channels=16,
        stem_multiplier=3
    ):
        super().__init__()
        self.num_nodes = num_nodes

        # Stem layers
        curr_channels = stem_multiplier * init_channels
        self.stem = nn.Sequential(
            nn.Conv2d(3, curr_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(curr_channels)
        )

        # Build cells
        self.cells = nn.ModuleList()
        reduction_layers = [num_cells // 3, 2 * num_cells // 3]
        prev_channels = curr_channels

        for i in range(num_cells):
            if i in reduction_layers:
                curr_channels *= 2
                reduction = True
            else:
                reduction = False

            cell = DARTSCell(num_nodes, curr_channels, reduction)
            self.cells.append(cell)
            prev_channels = curr_channels * (num_nodes - 2)

        # Classifier
        self.global_pool = nn.AdaptiveAvgPool2d(1)
        self.classifier = nn.Linear(prev_channels, num_classes)

        # Architecture parameters
        self._init_arch_parameters()

    def _init_arch_parameters(self):
        """Initialize architecture parameters (alphas)"""
        num_ops = len(PRIMITIVES)
        num_edges = sum(range(2, self.num_nodes))

        # Normal cell alphas
        self.alpha_normal = nn.Parameter(
            torch.randn(num_edges, num_ops) * 1e-3
        )
        # Reduction cell alphas
        self.alpha_reduce = nn.Parameter(
            torch.randn(num_edges, num_ops) * 1e-3
        )

    def arch_parameters(self):
        """Return architecture parameters"""
        return [self.alpha_normal, self.alpha_reduce]

    def forward(self, x):
        s0 = s1 = self.stem(x)

        for i, cell in enumerate(self.cells):
            if cell.reduction:
                alphas = self.alpha_reduce
            else:
                alphas = self.alpha_normal

            s0, s1 = s1, cell(s0, s1, alphas)

        out = self.global_pool(s1)
        out = out.view(out.size(0), -1)
        return self.classifier(out)
```

### Bi-Level Optimization in DARTS

DARTS alternates between:
1. Updating network weights $w$ on training data
2. Updating architecture parameters $\alpha$ on validation data

```python
class DARTSTrainer:
    """
    DARTS bi-level optimization trainer.
    """

    def __init__(
        self,
        model,
        train_loader,
        val_loader,
        lr_w=0.025,
        lr_alpha=3e-4,
        weight_decay=3e-4,
        momentum=0.9
    ):
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader

        # Optimizer for network weights
        self.optimizer_w = torch.optim.SGD(
            model.parameters(),
            lr=lr_w,
            momentum=momentum,
            weight_decay=weight_decay
        )

        # Optimizer for architecture parameters
        self.optimizer_alpha = torch.optim.Adam(
            model.arch_parameters(),
            lr=lr_alpha,
            betas=(0.5, 0.999),
            weight_decay=1e-3
        )

        self.criterion = nn.CrossEntropyLoss()

    def train_epoch(self):
        """One epoch of DARTS training"""
        self.model.train()

        train_iter = iter(self.train_loader)
        val_iter = iter(self.val_loader)

        for step in range(len(self.train_loader)):
            # Get training and validation batches
            try:
                train_x, train_y = next(train_iter)
            except StopIteration:
                train_iter = iter(self.train_loader)
                train_x, train_y = next(train_iter)

            try:
                val_x, val_y = next(val_iter)
            except StopIteration:
                val_iter = iter(self.val_loader)
                val_x, val_y = next(val_iter)

            train_x, train_y = train_x.cuda(), train_y.cuda()
            val_x, val_y = val_x.cuda(), val_y.cuda()

            # Step 1: Update architecture parameters on validation data
            self.optimizer_alpha.zero_grad()
            val_logits = self.model(val_x)
            val_loss = self.criterion(val_logits, val_y)
            val_loss.backward()
            self.optimizer_alpha.step()

            # Step 2: Update network weights on training data
            self.optimizer_w.zero_grad()
            train_logits = self.model(train_x)
            train_loss = self.criterion(train_logits, train_y)
            train_loss.backward()
            self.optimizer_w.step()

            if step % 50 == 0:
                print(f"Step {step}: Train Loss = {train_loss:.4f}, "
                      f"Val Loss = {val_loss:.4f}")

    def derive_architecture(self):
        """Derive discrete architecture from continuous alphas"""
        def derive_cell(alphas):
            """Convert soft alphas to discrete architecture"""
            gene = []
            n = 2
            start = 0

            for i in range(self.model.num_nodes - 2):
                end = start + n
                edge_weights = alphas[start:end]

                # Select top-2 edges for each node
                edge_max = edge_weights.max(dim=-1)[0]
                topk = torch.topk(edge_max, k=2)[1].tolist()

                for j in topk:
                    op_idx = edge_weights[j].argmax().item()
                    gene.append((PRIMITIVES[op_idx], j))

                start = end
                n += 1

            return gene

        with torch.no_grad():
            normal_gene = derive_cell(F.softmax(self.model.alpha_normal, dim=-1))
            reduce_gene = derive_cell(F.softmax(self.model.alpha_reduce, dim=-1))

        return {'normal': normal_gene, 'reduce': reduce_gene}
```

### Second-Order Approximation

The exact gradient of architecture parameters requires computing second-order derivatives (Hessian), which is expensive. DARTS uses a finite difference approximation:

$$\nabla_\alpha \mathcal{L}_{val}(w^*(\alpha), \alpha) \approx \nabla_\alpha \mathcal{L}_{val}(w', \alpha) - \frac{\xi}{2\epsilon}[\nabla_\alpha \mathcal{L}_{val}(w^+, \alpha) - \nabla_\alpha \mathcal{L}_{val}(w^-, \alpha)]$$

where $w^\pm = w \pm \epsilon \nabla_{w'} \mathcal{L}_{val}(w', \alpha)$.

```python
def compute_darts_gradient_second_order(model, train_x, train_y, val_x, val_y, xi=0.01):
    """
    Compute architecture gradient with second-order approximation.

    This provides a more accurate gradient than first-order but is more expensive.
    """
    # Save current weights
    w = [p.clone() for p in model.parameters()]

    # Forward pass on validation data
    val_loss = F.cross_entropy(model(val_x), val_y)
    val_grads = torch.autograd.grad(val_loss, model.arch_parameters())

    # Compute gradient of validation loss w.r.t. weights
    val_loss_w = F.cross_entropy(model(val_x), val_y)
    w_grads = torch.autograd.grad(val_loss_w, model.parameters())

    # w+ = w + epsilon * grad
    epsilon = 0.01 / torch.cat([g.view(-1) for g in w_grads]).norm()

    # Perturb weights: w+
    with torch.no_grad():
        for p, g in zip(model.parameters(), w_grads):
            p.add_(epsilon * g)

    train_loss_plus = F.cross_entropy(model(train_x), train_y)
    alpha_grads_plus = torch.autograd.grad(train_loss_plus, model.arch_parameters())

    # Perturb weights: w-
    with torch.no_grad():
        for p, g in zip(model.parameters(), w_grads):
            p.sub_(2 * epsilon * g)

    train_loss_minus = F.cross_entropy(model(train_x), train_y)
    alpha_grads_minus = torch.autograd.grad(train_loss_minus, model.arch_parameters())

    # Restore weights
    with torch.no_grad():
        for p, w_orig in zip(model.parameters(), w):
            p.copy_(w_orig)

    # Compute final gradient
    alpha_grads = []
    for g, g_plus, g_minus in zip(val_grads, alpha_grads_plus, alpha_grads_minus):
        hessian_term = (g_plus - g_minus) / (2 * epsilon)
        alpha_grads.append(g - xi * hessian_term)

    return alpha_grads
```

---

## Weight Sharing and One-Shot Methods

Weight sharing dramatically reduces the cost of NAS by training a single "supernet" that contains all candidate architectures as subnetworks.

### The One-Shot Paradigm

Instead of training each architecture from scratch, one-shot methods:
1. Train a supernet with all possible operations
2. Evaluate architectures by inheriting weights from the supernet
3. Select the best architecture based on shared-weight performance

```python
class SuperNet(nn.Module):
    """
    One-shot supernet for NAS.

    All possible architectures share weights through this supernet.
    """

    def __init__(self, num_classes, num_cells, num_nodes, init_channels):
        super().__init__()
        self.num_nodes = num_nodes

        # Stem
        self.stem = nn.Sequential(
            nn.Conv2d(3, init_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(init_channels)
        )

        # Build supernet cells
        self.cells = nn.ModuleList()
        channels = init_channels

        for i in range(num_cells):
            reduction = (i in [num_cells // 3, 2 * num_cells // 3])
            if reduction:
                channels *= 2
            cell = SuperNetCell(num_nodes, channels, reduction)
            self.cells.append(cell)

        # Classifier
        self.global_pool = nn.AdaptiveAvgPool2d(1)
        self.classifier = nn.Linear(channels * (num_nodes - 2), num_classes)

    def forward(self, x, architecture):
        """
        Forward pass with specific architecture.

        Args:
            x: Input tensor
            architecture: Dict mapping edges to operation names
        """
        s0 = s1 = self.stem(x)

        for cell in self.cells:
            s0, s1 = s1, cell(s0, s1, architecture)

        out = self.global_pool(s1)
        out = out.view(out.size(0), -1)
        return self.classifier(out)


class SuperNetCell(nn.Module):
    """
    Supernet cell containing all candidate operations.
    """

    def __init__(self, num_nodes, channels, reduction):
        super().__init__()
        self.num_nodes = num_nodes

        # All operations for each edge
        self.edges = nn.ModuleDict()

        for i in range(2, num_nodes):
            for j in range(i):
                stride = 2 if reduction and j < 2 else 1
                edge_ops = nn.ModuleDict({
                    prim: get_operation(prim, channels, channels, stride)
                    for prim in PRIMITIVES
                })
                self.edges[f'{j}_{i}'] = edge_ops

    def forward(self, s0, s1, architecture):
        """Forward pass with specific architecture choices"""
        states = [s0, s1]

        for i in range(2, self.num_nodes):
            node_inputs = []
            for j in range(i):
                edge_key = f'{j}_{i}'
                op_name = architecture.get(edge_key, 'skip_connect')
                op = self.edges[edge_key][op_name]
                node_inputs.append(op(states[j]))
            states.append(sum(node_inputs))

        return torch.cat(states[2:], dim=1)


class OneShotNAS:
    """
    One-shot NAS with weight sharing.
    """

    def __init__(self, supernet, train_loader, val_loader):
        self.supernet = supernet
        self.train_loader = train_loader
        self.val_loader = val_loader

    def train_supernet(self, epochs):
        """Train supernet with path dropout"""
        optimizer = torch.optim.SGD(
            self.supernet.parameters(),
            lr=0.025,
            momentum=0.9,
            weight_decay=3e-4
        )

        for epoch in range(epochs):
            self.supernet.train()

            for x, y in self.train_loader:
                x, y = x.cuda(), y.cuda()

                # Sample random architecture
                arch = self._sample_architecture()

                # Forward pass
                logits = self.supernet(x, arch)
                loss = F.cross_entropy(logits, y)

                # Backward pass
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

            print(f"Epoch {epoch}: Supernet training complete")

    def search(self, num_samples=1000):
        """Search by evaluating random architectures with shared weights"""
        self.supernet.set_to_evaluation_mode()

        best_arch = None
        best_acc = 0

        for i in range(num_samples):
            arch = self._sample_architecture()
            acc = self._evaluate_architecture(arch)

            if acc > best_acc:
                best_acc = acc
                best_arch = arch

            if i % 100 == 0:
                print(f"Sample {i}: Best accuracy = {best_acc:.4f}")

        return best_arch, best_acc

    def _sample_architecture(self):
        """Sample random architecture"""
        arch = {}
        for i in range(2, self.supernet.num_nodes):
            for j in range(i):
                arch[f'{j}_{i}'] = random.choice(PRIMITIVES)
        return arch

    @torch.no_grad()
    def _evaluate_architecture(self, arch):
        """Evaluate architecture on validation set"""
        self.supernet.set_to_evaluation_mode()
        correct = 0
        total = 0

        for x, y in self.val_loader:
            x, y = x.cuda(), y.cuda()
            logits = self.supernet(x, arch)
            pred = logits.argmax(dim=1)
            correct += (pred == y).sum().item()
            total += y.size(0)

        return correct / total
```

### ENAS: Efficient Neural Architecture Search

ENAS combines RL-based search with weight sharing, making NAS feasible on a single GPU:

```python
class ENASController(nn.Module):
    """
    ENAS controller that shares weights with the child network.
    """

    def __init__(self, num_nodes, num_operations, hidden_size=100):
        super().__init__()
        self.num_nodes = num_nodes
        self.num_operations = num_operations

        self.lstm = nn.LSTMCell(hidden_size, hidden_size)

        # Embeddings
        self.node_embedding = nn.Embedding(num_nodes, hidden_size)
        self.op_embedding = nn.Embedding(num_operations, hidden_size)

        # Output heads
        self.op_classifier = nn.Linear(hidden_size, num_operations)
        self.skip_classifier = nn.Linear(hidden_size, 1)  # For skip connections

        # Learnable initial states
        self.h0 = nn.Parameter(torch.zeros(1, hidden_size))
        self.c0 = nn.Parameter(torch.zeros(1, hidden_size))

    def forward(self):
        """Sample an architecture from the controller"""
        h = self.h0
        c = self.c0

        arch = {'ops': [], 'skip': []}
        log_probs = []
        entropies = []

        for node_idx in range(2, self.num_nodes):
            # Sample operation
            h, c = self.lstm(self.node_embedding(
                torch.tensor([node_idx - 2]).cuda()
            ), (h, c))

            op_logits = self.op_classifier(h)
            op_probs = F.softmax(op_logits, dim=-1)
            op_dist = Categorical(op_probs)
            op = op_dist.sample()

            arch['ops'].append(op.item())
            log_probs.append(op_dist.log_prob(op))
            entropies.append(op_dist.entropy())

            # Sample skip connections (for each previous node)
            skip_conn = []
            for prev_idx in range(node_idx):
                h, c = self.lstm(self.op_embedding(op), (h, c))

                skip_logit = self.skip_classifier(h)
                skip_prob = torch.sigmoid(skip_logit)
                skip = torch.bernoulli(skip_prob)

                skip_conn.append(skip.item())

                # Compute log probability
                if skip.item() == 1:
                    log_probs.append(torch.log(skip_prob + 1e-8))
                else:
                    log_probs.append(torch.log(1 - skip_prob + 1e-8))

            arch['skip'].append(skip_conn)

        return arch, torch.stack(log_probs).sum(), torch.stack(entropies).mean()
```

---

## Performance Estimation Strategies

Training each candidate architecture to full convergence is prohibitively expensive. Various strategies exist to estimate architecture performance more efficiently.

### Lower Fidelity Estimates

```python
class PerformanceEstimator:
    """
    Performance estimation strategies for NAS.
    """

    def __init__(self, dataset, device='cuda'):
        self.dataset = dataset
        self.device = device

    def full_training(self, architecture, epochs=100):
        """
        Full training (expensive but accurate).
        Most expensive: ~hours per architecture.
        """
        model = self._build_model(architecture)
        trainer = self._create_trainer(model)

        for epoch in range(epochs):
            trainer.train_epoch()

        return trainer.measure_accuracy()

    def reduced_training(self, architecture, epochs=20, subset_ratio=0.1):
        """
        Train with fewer epochs and/or smaller dataset.
        Cheaper: ~minutes per architecture.
        """
        model = self._build_model(architecture)

        # Use subset of training data
        subset_size = int(len(self.dataset) * subset_ratio)
        subset = torch.utils.data.Subset(
            self.dataset,
            random.sample(range(len(self.dataset)), subset_size)
        )

        trainer = self._create_trainer(model, subset)

        for epoch in range(epochs):
            trainer.train_epoch()

        return trainer.measure_accuracy()

    def weight_inheritance(self, architecture, pretrained_supernet):
        """
        Inherit weights from pretrained supernet.
        Very cheap: ~seconds per architecture.
        """
        model = self._build_model(architecture)

        # Copy weights from supernet
        for name, param in model.named_parameters():
            if name in pretrained_supernet:
                param.data.copy_(pretrained_supernet[name].data)

        return self._measure_model_accuracy(model)

    def learning_curve_extrapolation(self, architecture, partial_epochs=10):
        """
        Train partially and extrapolate final performance.
        """
        model = self._build_model(architecture)
        trainer = self._create_trainer(model)

        # Collect learning curve data
        learning_curve = []
        for epoch in range(partial_epochs):
            trainer.train_epoch()
            acc = trainer.measure_accuracy()
            learning_curve.append(acc)

        # Extrapolate using curve fitting
        predicted_final = self._extrapolate_curve(learning_curve)
        return predicted_final

    def _extrapolate_curve(self, curve, target_epoch=100):
        """Extrapolate learning curve using power law"""
        import numpy as np
        from scipy.optimize import curve_fit

        def power_law(x, a, b, c):
            return a - b * np.power(x, -c)

        epochs = np.arange(1, len(curve) + 1)

        try:
            params, _ = curve_fit(power_law, epochs, curve, maxfev=1000)
            predicted = power_law(target_epoch, *params)
        except:
            predicted = curve[-1]  # Fallback to last observed value

        return predicted


class EarlyStoppingEstimator:
    """
    Early stopping based on validation performance.
    """

    def __init__(self, patience=10, min_delta=0.001):
        self.patience = patience
        self.min_delta = min_delta

    def measure_performance(self, architecture, max_epochs=100):
        """
        Train with early stopping based on validation performance.
        """
        model = self._build_model(architecture)

        best_val_acc = 0
        patience_counter = 0

        for epoch in range(max_epochs):
            # Train one epoch
            self._train_epoch(model)

            # Check validation accuracy
            val_acc = self._check_validation(model)

            if val_acc > best_val_acc + self.min_delta:
                best_val_acc = val_acc
                patience_counter = 0
            else:
                patience_counter += 1

            if patience_counter >= self.patience:
                print(f"Early stopping at epoch {epoch}")
                break

        return best_val_acc
```

### Proxy Tasks

Instead of evaluating on the full task, use simpler proxy tasks:

```python
class ProxyTaskEvaluator:
    """
    Assess architectures using proxy tasks.
    """

    def __init__(self, proxy_type='reduced_resolution'):
        self.proxy_type = proxy_type

    def assess(self, architecture):
        if self.proxy_type == 'reduced_resolution':
            return self._assess_reduced_resolution(architecture)
        elif self.proxy_type == 'reduced_channels':
            return self._assess_reduced_channels(architecture)
        elif self.proxy_type == 'smaller_dataset':
            return self._assess_smaller_dataset(architecture)
        elif self.proxy_type == 'zero_cost':
            return self._assess_zero_cost(architecture)

    def _assess_reduced_resolution(self, architecture):
        """
        Train and check on lower resolution images.
        E.g., 16x16 instead of 32x32 for CIFAR-10.
        """
        transform = transforms.Compose([
            transforms.Resize(16),
            transforms.ToTensor()
        ])
        # ... training code

    def _assess_zero_cost(self, architecture):
        """
        Zero-cost proxy: assess without training.
        Uses metrics like gradient flow, synflow, etc.
        """
        model = self._build_model(architecture)
        model.train()

        # Compute synflow score (sum of products of gradients)
        score = self._compute_synflow(model)
        return score

    def _compute_synflow(self, model):
        """
        SynFlow: A zero-cost proxy metric.
        Higher scores generally indicate better architectures.
        """
        # Set all parameters to 1
        for p in model.parameters():
            p.data = torch.ones_like(p.data)

        # Forward pass with all-ones input
        dummy_input = torch.ones(1, 3, 32, 32).cuda()
        output = model(dummy_input)

        # Compute synflow score
        loss = output.sum()
        loss.backward()

        score = 0
        for p in model.parameters():
            if p.grad is not None:
                score += (p.data * p.grad.data).abs().sum().item()

        return score
```

---

## EfficientNet Case Study

EfficientNet represents a landmark achievement in NAS, demonstrating how automated search can discover architectures that outperform hand-designed networks while being more efficient.

### Background

EfficientNet uses a novel compound scaling method combined with NAS-discovered base architecture:

1. **Neural Architecture Search**: Find an efficient base network (EfficientNet-B0)
2. **Compound Scaling**: Scale depth, width, and resolution together

### The MnasNet Foundation

EfficientNet builds on MnasNet, which optimizes for both accuracy and latency:

$$\max_m \text{ACC}(m) \times \left[\frac{\text{LAT}(m)}{T}\right]^w$$

where:
- $\text{ACC}(m)$ is accuracy of model $m$
- $\text{LAT}(m)$ is latency
- $T$ is target latency
- $w$ is a weight factor (typically -0.07)

```python
class MobileInvertedResidual(nn.Module):
    """
    Mobile Inverted Residual block (MBConv).
    Core building block of EfficientNet.
    """

    def __init__(
        self,
        in_channels,
        out_channels,
        kernel_size,
        stride,
        expand_ratio,
        se_ratio=0.25
    ):
        super().__init__()
        self.stride = stride
        self.use_residual = stride == 1 and in_channels == out_channels

        hidden_dim = int(in_channels * expand_ratio)

        layers = []

        # Expansion phase
        if expand_ratio != 1:
            layers.extend([
                nn.Conv2d(in_channels, hidden_dim, 1, bias=False),
                nn.BatchNorm2d(hidden_dim),
                nn.SiLU(inplace=True)  # Swish activation
            ])

        # Depthwise convolution
        layers.extend([
            nn.Conv2d(
                hidden_dim, hidden_dim, kernel_size,
                stride=stride, padding=kernel_size // 2,
                groups=hidden_dim, bias=False
            ),
            nn.BatchNorm2d(hidden_dim),
            nn.SiLU(inplace=True)
        ])

        # Squeeze-and-Excitation
        if se_ratio > 0:
            se_channels = max(1, int(in_channels * se_ratio))
            layers.append(SqueezeExcitation(hidden_dim, se_channels))

        # Output phase
        layers.extend([
            nn.Conv2d(hidden_dim, out_channels, 1, bias=False),
            nn.BatchNorm2d(out_channels)
        ])

        self.block = nn.Sequential(*layers)

        # Stochastic depth
        self.drop_rate = 0.2

    def forward(self, x):
        out = self.block(x)

        if self.use_residual:
            if self.training and self.drop_rate > 0:
                out = self._stochastic_depth(out)
            out = out + x

        return out

    def _stochastic_depth(self, x):
        """Apply stochastic depth (drop path)"""
        if not self.training:
            return x
        keep_prob = 1 - self.drop_rate
        shape = (x.shape[0],) + (1,) * (x.ndim - 1)
        mask = torch.empty(shape, device=x.device).bernoulli_(keep_prob)
        return x * mask / keep_prob


class SqueezeExcitation(nn.Module):
    """Squeeze-and-Excitation block"""

    def __init__(self, in_channels, se_channels):
        super().__init__()
        self.se = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Conv2d(in_channels, se_channels, 1),
            nn.SiLU(inplace=True),
            nn.Conv2d(se_channels, in_channels, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        return x * self.se(x)


class EfficientNetB0(nn.Module):
    """
    EfficientNet-B0: NAS-discovered base architecture.

    The architecture was found by optimizing for accuracy and FLOPS
    on ImageNet using a multi-objective search.
    """

    # Block configuration: (expand_ratio, channels, num_blocks, kernel_size, stride)
    CONFIG = [
        (1, 16, 1, 3, 1),   # Stage 1
        (6, 24, 2, 3, 2),   # Stage 2
        (6, 40, 2, 5, 2),   # Stage 3
        (6, 80, 3, 3, 2),   # Stage 4
        (6, 112, 3, 5, 1),  # Stage 5
        (6, 192, 4, 5, 2),  # Stage 6
        (6, 320, 1, 3, 1),  # Stage 7
    ]

    def __init__(self, num_classes=1000, dropout_rate=0.2):
        super().__init__()

        # Stem
        self.stem = nn.Sequential(
            nn.Conv2d(3, 32, 3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.SiLU(inplace=True)
        )

        # Build stages
        layers = []
        in_channels = 32

        for expand, out_channels, num_blocks, kernel, stride in self.CONFIG:
            for i in range(num_blocks):
                layers.append(MobileInvertedResidual(
                    in_channels,
                    out_channels,
                    kernel,
                    stride if i == 0 else 1,
                    expand
                ))
                in_channels = out_channels

        self.blocks = nn.Sequential(*layers)

        # Head
        self.head = nn.Sequential(
            nn.Conv2d(320, 1280, 1, bias=False),
            nn.BatchNorm2d(1280),
            nn.SiLU(inplace=True),
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Dropout(dropout_rate),
            nn.Linear(1280, num_classes)
        )

    def forward(self, x):
        x = self.stem(x)
        x = self.blocks(x)
        x = self.head(x)
        return x
```

### Compound Scaling

EfficientNet scales the base network using compound coefficients:

$$\text{depth}: d = \alpha^\phi$$
$$\text{width}: w = \beta^\phi$$
$$\text{resolution}: r = \gamma^\phi$$

subject to: $\alpha \cdot \beta^2 \cdot \gamma^2 \approx 2$

```python
import math

class EfficientNetScaler:
    """
    Compound scaling for EfficientNet.

    Given phi (compound coefficient), computes optimal scaling factors
    for depth, width, and resolution.
    """

    # Optimal scaling parameters found by grid search
    ALPHA = 1.2   # Depth
    BETA = 1.1    # Width
    GAMMA = 1.15  # Resolution

    # EfficientNet variants
    VARIANTS = {
        'b0': {'phi': 0, 'resolution': 224, 'dropout': 0.2},
        'b1': {'phi': 0.5, 'resolution': 240, 'dropout': 0.2},
        'b2': {'phi': 1, 'resolution': 260, 'dropout': 0.3},
        'b3': {'phi': 2, 'resolution': 300, 'dropout': 0.3},
        'b4': {'phi': 3, 'resolution': 380, 'dropout': 0.4},
        'b5': {'phi': 4, 'resolution': 456, 'dropout': 0.4},
        'b6': {'phi': 5, 'resolution': 528, 'dropout': 0.5},
        'b7': {'phi': 6, 'resolution': 600, 'dropout': 0.5},
    }

    @classmethod
    def scale_model(cls, base_config, phi):
        """
        Scale base model configuration by compound coefficient phi.
        """
        depth_coef = cls.ALPHA ** phi
        width_coef = cls.BETA ** phi
        resolution_coef = cls.GAMMA ** phi

        scaled_config = []
        for expand, channels, num_blocks, kernel, stride in base_config:
            scaled_channels = int(channels * width_coef)
            # Round to nearest multiple of 8 for efficiency
            scaled_channels = ((scaled_channels + 7) // 8) * 8

            scaled_blocks = int(math.ceil(num_blocks * depth_coef))

            scaled_config.append(
                (expand, scaled_channels, scaled_blocks, kernel, stride)
            )

        return scaled_config, resolution_coef

    @classmethod
    def get_efficientnet(cls, variant='b0', num_classes=1000):
        """Get scaled EfficientNet model"""
        config = cls.VARIANTS[variant]

        scaled_config, _ = cls.scale_model(
            EfficientNetB0.CONFIG,
            config['phi']
        )

        # Build model with scaled configuration
        model = EfficientNetScaled(
            scaled_config,
            config['resolution'],
            num_classes,
            config['dropout']
        )

        return model
```

### Key Insights from EfficientNet

1. **Balanced Scaling Matters**: Scaling only depth, width, or resolution alone yields diminishing returns. Compound scaling achieves better accuracy per FLOP.

2. **NAS-Discovered Blocks**: The MBConv block with squeeze-excitation was found to be highly efficient.

3. **Accuracy vs. Efficiency Trade-off**: EfficientNet achieves state-of-the-art accuracy with significantly fewer parameters and FLOPs.

| Model | Top-1 Acc | Parameters | FLOPs |
|-------|-----------|------------|-------|
| ResNet-50 | 76.0% | 26M | 4.1B |
| EfficientNet-B0 | 77.3% | 5.3M | 0.39B |
| EfficientNet-B4 | 82.9% | 19M | 4.2B |
| EfficientNet-B7 | 84.3% | 66M | 37B |

---

## Practical Implementation Guide

### Setting Up a NAS Experiment

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import torchvision
import torchvision.transforms as transforms

class NASExperiment:
    """
    Complete NAS experiment setup.
    """

    def __init__(
        self,
        dataset='cifar10',
        search_method='darts',
        search_epochs=50,
        final_epochs=600,
        seed=42
    ):
        self.dataset = dataset
        self.search_method = search_method
        self.search_epochs = search_epochs
        self.final_epochs = final_epochs

        # Set random seeds
        torch.manual_seed(seed)
        torch.cuda.manual_seed(seed)

        # Setup data
        self._setup_data()

    def _setup_data(self):
        """Prepare datasets for search and final training"""
        if self.dataset == 'cifar10':
            # Transforms
            train_transform = transforms.Compose([
                transforms.RandomCrop(32, padding=4),
                transforms.RandomHorizontalFlip(),
                transforms.ToTensor(),
                transforms.Normalize(
                    (0.4914, 0.4822, 0.4465),
                    (0.2023, 0.1994, 0.2010)
                )
            ])

            test_transform = transforms.Compose([
                transforms.ToTensor(),
                transforms.Normalize(
                    (0.4914, 0.4822, 0.4465),
                    (0.2023, 0.1994, 0.2010)
                )
            ])

            # Load datasets
            train_data = torchvision.datasets.CIFAR10(
                root='./data', train=True, download=True,
                transform=train_transform
            )

            test_data = torchvision.datasets.CIFAR10(
                root='./data', train=False, download=True,
                transform=test_transform
            )

            # Split training data for search
            n_train = len(train_data)
            split = n_train // 2

            indices = list(range(n_train))
            random.shuffle(indices)

            train_indices = indices[:split]
            val_indices = indices[split:]

            self.search_train_loader = DataLoader(
                torch.utils.data.Subset(train_data, train_indices),
                batch_size=64, shuffle=True, num_workers=4
            )

            self.search_val_loader = DataLoader(
                torch.utils.data.Subset(train_data, val_indices),
                batch_size=64, shuffle=False, num_workers=4
            )

            # Full data for final training
            self.final_train_loader = DataLoader(
                train_data, batch_size=96, shuffle=True, num_workers=4
            )

            self.final_test_loader = DataLoader(
                test_data, batch_size=96, shuffle=False, num_workers=4
            )

            self.num_classes = 10

    def run_search(self):
        """Run architecture search"""
        print("=" * 50)
        print("Starting Architecture Search")
        print("=" * 50)

        if self.search_method == 'darts':
            return self._run_darts_search()
        elif self.search_method == 'enas':
            return self._run_enas_search()
        elif self.search_method == 'random':
            return self._run_random_search()
        elif self.search_method == 'evolutionary':
            return self._run_evolutionary_search()

    def _run_darts_search(self):
        """Run DARTS search"""
        # Create DARTS model
        model = DARTSNetwork(
            num_classes=self.num_classes,
            num_cells=8,
            num_nodes=4,
            init_channels=16
        ).cuda()

        # Create trainer
        trainer = DARTSTrainer(
            model,
            self.search_train_loader,
            self.search_val_loader
        )

        # Run search
        for epoch in range(self.search_epochs):
            print(f"\nSearch Epoch {epoch + 1}/{self.search_epochs}")
            trainer.train_epoch()

        # Derive final architecture
        architecture = trainer.derive_architecture()
        print("\nDerived Architecture:")
        print(f"Normal Cell: {architecture['normal']}")
        print(f"Reduce Cell: {architecture['reduce']}")

        return architecture

    def run_final_training(self, architecture):
        """Train and check discovered architecture from scratch"""
        print("=" * 50)
        print("Training Discovered Architecture")
        print("=" * 50)

        # Build model from discovered architecture
        model = self._build_final_model(architecture).cuda()

        # Count parameters
        n_params = sum(p.numel() for p in model.parameters())
        print(f"Number of parameters: {n_params / 1e6:.2f}M")

        # Training setup
        optimizer = torch.optim.SGD(
            model.parameters(),
            lr=0.025,
            momentum=0.9,
            weight_decay=3e-4
        )

        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            optimizer, T_max=self.final_epochs
        )

        criterion = nn.CrossEntropyLoss()

        best_acc = 0

        for epoch in range(self.final_epochs):
            # Train
            model.train()
            train_loss = 0
            correct = 0
            total = 0

            for x, y in self.final_train_loader:
                x, y = x.cuda(), y.cuda()

                optimizer.zero_grad()
                logits = model(x)
                loss = criterion(logits, y)
                loss.backward()

                # Gradient clipping
                torch.nn.utils.clip_grad_norm_(model.parameters(), 5.0)

                optimizer.step()

                train_loss += loss.item()
                pred = logits.argmax(dim=1)
                correct += (pred == y).sum().item()
                total += y.size(0)

            scheduler.step()

            train_acc = 100.0 * correct / total

            # Test
            model.train(False)
            correct = 0
            total = 0

            with torch.no_grad():
                for x, y in self.final_test_loader:
                    x, y = x.cuda(), y.cuda()
                    logits = model(x)
                    pred = logits.argmax(dim=1)
                    correct += (pred == y).sum().item()
                    total += y.size(0)

            test_acc = 100.0 * correct / total

            if test_acc > best_acc:
                best_acc = test_acc

            if epoch % 50 == 0 or epoch == self.final_epochs - 1:
                print(f"Epoch {epoch}: Train Acc = {train_acc:.2f}%, "
                      f"Test Acc = {test_acc:.2f}%, Best = {best_acc:.2f}%")

        return best_acc


def main():
    """Run complete NAS experiment"""
    experiment = NASExperiment(
        dataset='cifar10',
        search_method='darts',
        search_epochs=50,
        final_epochs=600
    )

    # Phase 1: Architecture Search
    architecture = experiment.run_search()

    # Phase 2: Full Training
    final_accuracy = experiment.run_final_training(architecture)

    print("=" * 50)
    print(f"Final Test Accuracy: {final_accuracy:.2f}%")
    print("=" * 50)


if __name__ == '__main__':
    main()
```

### Common Pitfalls and Solutions

```python
class NASDebugger:
    """
    Common issues and debugging strategies for NAS.
    """

    @staticmethod
    def check_architecture_collapse(alphas, threshold=0.9):
        """
        Check if architecture has collapsed to skip connections.

        This is a common failure mode in DARTS where the search
        converges to an architecture dominated by skip connections.
        """
        probs = F.softmax(alphas, dim=-1)
        skip_idx = PRIMITIVES.index('skip_connect')

        skip_probs = probs[:, skip_idx]
        collapse = (skip_probs > threshold).float().mean()

        if collapse > 0.5:
            print("WARNING: Architecture collapse detected!")
            print(f"{collapse * 100:.1f}% of edges dominated by skip connections")
            return True
        return False

    @staticmethod
    def regularize_architecture(alphas, regularization='entropy'):
        """
        Apply regularization to prevent architecture collapse.
        """
        probs = F.softmax(alphas, dim=-1)

        if regularization == 'entropy':
            # Maximize entropy to encourage diverse operations
            entropy = -(probs * torch.log(probs + 1e-8)).sum(dim=-1).mean()
            return -entropy  # Negative because we minimize loss

        elif regularization == 'skip_penalty':
            # Penalize skip connections
            skip_idx = PRIMITIVES.index('skip_connect')
            return probs[:, skip_idx].mean()

    @staticmethod
    def validate_supernet_ranking(supernet, architectures, ground_truth_ranks):
        """
        Check if supernet rankings correlate with true performance.

        Poor correlation indicates the weight sharing is not working well.
        """
        from scipy.stats import kendalltau

        # Get supernet rankings
        supernet_scores = []
        for arch in architectures:
            score = supernet.check_performance(arch)
            supernet_scores.append(score)

        supernet_ranks = np.argsort(np.argsort(-np.array(supernet_scores)))

        # Compute Kendall's tau
        tau, p_value = kendalltau(supernet_ranks, ground_truth_ranks)

        print(f"Kendall's tau: {tau:.3f} (p-value: {p_value:.3e})")

        if tau < 0.5:
            print("WARNING: Poor ranking correlation!")
            print("Consider: more supernet training, path dropout, or different search space")

        return tau


class BestPractices:
    """
    Best practices for NAS experiments.
    """

    @staticmethod
    def get_recommendations():
        return """
        NAS Best Practices:

        1. SEARCH SPACE DESIGN
           - Start with proven operation sets (DARTS primitives)
           - Include skip connections but regularize them
           - Balance expressiveness with tractability

        2. SEARCH EFFICIENCY
           - Use weight sharing when possible
           - Start with lower fidelity estimates
           - Employ early stopping for bad architectures

        3. FINAL TRAINING
           - Always retrain from scratch for final numbers
           - Use multiple random seeds
           - Report confidence intervals

        4. REPRODUCIBILITY
           - Fix all random seeds
           - Log all hyperparameters
           - Save intermediate checkpoints

        5. COMMON FAILURE MODES
           - Skip connection collapse: regularize or modify search space
           - Poor supernet correlation: more training, path dropout
           - High variance: larger populations, more samples
        """
```

---

## Interview Key Points

### Conceptual Questions

**Q1: What are the main components of a NAS system?**

A: A NAS system consists of three main components:
1. **Search Space**: Defines what architectures can be discovered (operations, connections, macro structure)
2. **Search Strategy**: How to explore the search space (random, evolutionary, RL, gradient-based)
3. **Performance Estimation**: How to assess candidate architectures (full training, weight sharing, proxy tasks)

**Q2: Explain the key insight behind DARTS.**

A: DARTS makes the discrete architecture selection differentiable by:
1. Replacing hard operation selection with a weighted sum of all operations
2. Using softmax of learnable architecture parameters as weights
3. Enabling gradient descent on architecture parameters
4. At the end, deriving discrete architecture by selecting operations with highest weights

This reduces search cost from thousands of GPU days to a few GPU days.

**Q3: What is the weight sharing problem in NAS?**

A: Weight sharing assumes that the relative ranking of architectures is preserved when using shared weights vs. training from scratch. However:
- The ranking correlation is often imperfect
- Some architectures may unfairly benefit from shared weights
- Solutions include: longer supernet training, path dropout, progressive shrinking

### Technical Questions

**Q4: How does compound scaling in EfficientNet work?**

```python
# Compound scaling relationship
depth = alpha ** phi      # Number of layers
width = beta ** phi       # Number of channels
resolution = gamma ** phi # Input image size

# Constraint: alpha * beta^2 * gamma^2 = 2
# This keeps FLOPS roughly constant when scaling

# EfficientNet optimal values:
# alpha = 1.2, beta = 1.1, gamma = 1.15
```

The key insight is that depth, width, and resolution should be scaled together rather than independently, as they have compounding effects on model capacity.

**Q5: Compare one-shot NAS methods (ENAS, DARTS) with traditional NAS (RL-based).**

| Aspect | Traditional (RL) | One-Shot (ENAS/DARTS) |
|--------|------------------|------------------------|
| Search Cost | 1000s GPU days | 1-4 GPU days |
| Weight Training | From scratch each time | Shared supernet |
| Architecture Sampling | Discrete | Continuous (DARTS) or Discrete (ENAS) |
| Final Performance | Generally higher | May need retraining |
| Memory Usage | Low per architecture | High (stores all ops) |

**Q6: What are zero-cost proxies in NAS?**

A: Zero-cost proxies estimate architecture quality without any training:
- **SynFlow**: Product of absolute parameter values and gradients
- **GradNorm**: Gradient magnitude at initialization
- **NASWOT**: Correlation of gradients across samples

These enable extremely fast architecture ranking but have lower correlation with true performance.

### Code Implementation Questions

**Q7: Implement a simple architecture encoding and mutation for evolutionary NAS.**

```python
class ArchitectureEncoding:
    """
    Encode architecture as a string for evolutionary search.
    """

    def __init__(self, num_nodes=4, primitives=PRIMITIVES):
        self.num_nodes = num_nodes
        self.primitives = primitives

    def encode(self, architecture):
        """Convert architecture dict to string"""
        encoding = []
        for i in range(2, self.num_nodes):
            for j in range(i):
                edge = f'{j}_{i}'
                op = architecture.get(edge, 'none')
                encoding.append(str(self.primitives.index(op)))
        return ''.join(encoding)

    def decode(self, encoding):
        """Convert string to architecture dict"""
        architecture = {}
        idx = 0
        for i in range(2, self.num_nodes):
            for j in range(i):
                edge = f'{j}_{i}'
                op_idx = int(encoding[idx])
                architecture[edge] = self.primitives[op_idx]
                idx += 1
        return architecture

    def mutate(self, encoding):
        """Apply single-point mutation"""
        encoding = list(encoding)
        pos = random.randint(0, len(encoding) - 1)
        current = int(encoding[pos])
        new_op = random.choice([i for i in range(len(self.primitives)) if i != current])
        encoding[pos] = str(new_op)
        return ''.join(encoding)

    def crossover(self, parent1, parent2):
        """Single-point crossover"""
        point = random.randint(1, len(parent1) - 1)
        child = parent1[:point] + parent2[point:]
        return child
```

---

## Summary

Neural Architecture Search has transformed deep learning by automating the architecture design process. Key takeaways:

1. **Search Space Design**: Cell-based search spaces with standard operations provide a good balance of expressiveness and efficiency.

2. **Search Strategies**:
   - Random search is a strong baseline
   - Evolutionary algorithms handle discrete spaces well
   - RL-based methods can learn search heuristics
   - DARTS enables efficient gradient-based search

3. **Weight Sharing**: Essential for practical NAS, but requires careful handling of ranking correlation.

4. **Performance Estimation**: Trade-off between accuracy and cost; zero-cost proxies and early stopping help.

5. **EfficientNet**: Demonstrates the power of combining NAS-discovered architectures with principled scaling strategies.

As hardware improves and search methods become more efficient, NAS will become increasingly important for developing specialized architectures for diverse applications.

---

## Further Reading

### Essential Papers

1. **Zoph & Le (2017)** - "Neural Architecture Search with Reinforcement Learning" - Original NAS paper
2. **Liu et al. (2019)** - "DARTS: Differentiable Architecture Search" - Gradient-based NAS
3. **Pham et al. (2018)** - "Efficient Neural Architecture Search via Parameter Sharing" - ENAS
4. **Tan & Le (2019)** - "EfficientNet: Rethinking Model Scaling for CNNs" - Compound scaling
5. **Real et al. (2019)** - "Regularized Evolution for Image Classifier Architecture Search" - AmoebaNet

### Advanced Topics

- Hardware-aware NAS (targeting specific devices)
- Multi-objective NAS (accuracy, latency, energy)
- Transferable NAS (searching on proxy tasks)
- NAS for other domains (NLP, speech, graphs)
- NAS with transformers

### Recommended Resources

- **AutoML.org**: Comprehensive NAS tutorials and benchmarks
- **NAS-Bench-101/201**: Benchmarks for reproducible NAS research
- **Microsoft NNI**: Open-source NAS toolkit
- **Google Brain AutoML**: Industrial NAS systems
