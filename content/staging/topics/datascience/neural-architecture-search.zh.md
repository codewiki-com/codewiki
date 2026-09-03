---
title: 自动化机器学习：神经网络架构搜索
description: 探索NAS方法：DARTS、进化算法和强化学习基础的NAS
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - NAS
  - 架构搜索
  - DARTS
  - AutoML
status: imported
origin: old/src/content/docs/datascience/neural-architecture-search.zh.md
divergence: 0.206
issues:
  - missing-subcategory-zh
  - order-mismatch
  - category-casing
legacy:
  category: datascience
  subcategory: ""
  order: 38
  lastUpdated: 2026-01-07
---

神经网络架构搜索（Neural Architecture Search，NAS）代表了自动化机器学习领域最重要的进展之一，它能够自动发现最优的神经网络架构。与其依赖人类直觉和专业知识来设计网络结构相反，NAS算法系统地探索可能的架构空间，以找到在目标任务上性能优异的设计。

---

## NAS问题定义

### 架构设计挑战

设计有效的神经网络架构传统上是一个耗时的过程，需要深厚的专业知识。考虑从LeNet到ResNet再到EfficientNet的演变——每个突破都需要多年的研究和无数次的实验。NAS的目标是将这个过程自动化。

**形式化定义：**

神经网络架构搜索可以表述为一个优化问题：

$$\alpha^* = \arg\max_{\alpha \in \mathcal{A}} \text{准确度}(\mathcal{N}(\alpha, w^*(\alpha)), \mathcal{D}_{val})$$

其中：
- $\mathcal{A}$ 是可能的架构搜索空间
- $\alpha$ 代表一个架构配置
- $w^*(\alpha)$ 是架构 $\alpha$ 的最优权重
- $\mathcal{D}_{val}$ 是验证数据集

**双层优化：**

NAS本质上是一个双层优化问题：

$$\min_{\alpha} \mathcal{L}_{val}(w^*(\alpha), \alpha)$$
$$\text{s.t.} \quad w^*(\alpha) = \arg\min_w \mathcal{L}_{train}(w, \alpha)$$

外层优化搜索最佳架构，而内层优化将每个候选架构训练至收敛。

### NAS核心组件

```python
# NAS的概念框架
class NASFramework:
    """神经网络架构搜索的抽象框架"""

    def __init__(self, search_space, search_strategy, performance_estimator):
        self.search_space = search_space
        self.search_strategy = search_strategy
        self.performance_estimator = performance_estimator

    def search(self, budget):
        """主NAS循环"""
        best_architecture = None
        best_performance = float('-inf')

        for iteration in range(budget):
            # 1. 采样或生成候选架构
            architecture = self.search_strategy.propose(self.search_space)

            # 2. 估计性能
            performance = self.performance_estimator.evaluate(architecture)

            # 3. 根据反馈更新搜索策略
            self.search_strategy.update(architecture, performance)

            # 4. 跟踪最佳架构
            if performance > best_performance:
                best_performance = performance
                best_architecture = architecture

        return best_architecture, best_performance
```

---

## 搜索空间设计

搜索空间定义了NAS能够发现的架构。精心设计的搜索空间需要在表现力（表示好的架构的能力）和可追踪性（搜索的可行性）之间找到平衡。

### 基于单元的搜索空间

现代NAS通常搜索**单元**（小型重复模块）而不是整个网络。这大大减少了搜索空间，同时利用了优秀架构通常由重复模式组成的洞察。

```python
import torch
import torch.nn as nn

class Operation(nn.Module):
    """可搜索操作的基类"""
    pass

class SeparableConv(Operation):
    """深度可分离卷积"""
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
    """扩张卷积用于更大的感受野"""
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
    """跳连接/恒等映射"""
    def __init__(self):
        super().__init__()

    def forward(self, x):
        return x

class Zero(Operation):
    """零操作 - 有效地移除边"""
    def __init__(self, stride=1):
        super().__init__()
        self.stride = stride

    def forward(self, x):
        if self.stride == 1:
            return x.mul(0.)
        return x[:, :, ::self.stride, ::self.stride].mul(0.)

class PoolBN(Operation):
    """池化后跟批量归一化"""
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


# DARTS和类似方法中使用的标准操作集
PRIMITIVES = [
    'none',           # 零操作
    'max_pool_3x3',   # 最大池化
    'avg_pool_3x3',   # 平均池化
    'skip_connect',   # 恒等/跳连接
    'sep_conv_3x3',   # 可分离卷积 3x3
    'sep_conv_5x5',   # 可分离卷积 5x5
    'dil_conv_3x3',   # 扩张卷积 3x3, dilation=2
    'dil_conv_5x5',   # 扩张卷积 5x5, dilation=2
]

def get_operation(name, in_channels, out_channels, stride=1):
    """工厂函数，按名称创建操作"""
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

### 有向无环图（DAG）表示

单元通常表示为DAG，其中节点是特征图，边是操作：

```python
class Cell(nn.Module):
    """
    表示为DAG的可搜索单元。

    单元有多个中间节点。每个节点从所有先前节点接收输入，
    边代表操作。
    """

    def __init__(self, num_nodes, channels, reduction=False):
        super().__init__()
        self.num_nodes = num_nodes
        self.reduction = reduction
        stride = 2 if reduction else 1

        # 节点对之间的操作
        self.ops = nn.ModuleDict()

        # 节点i从节点0, 1, ..., i-1接收输入
        # 节点0和1是两个输入节点
        for i in range(2, num_nodes):
            for j in range(i):
                # 为边(j, i)创建所有可能的操作
                edge_ops = nn.ModuleList([
                    get_operation(
                        prim, channels, channels,
                        stride if reduction and j < 2 else 1
                    )
                    for prim in PRIMITIVES
                ])
                self.ops[f'{j}_{i}'] = edge_ops

        # 连接所有中间节点输出
        self.num_intermediate = num_nodes - 2

    def forward(self, s0, s1, weights):
        """
        参数：
            s0: 来自单元k-2的输出
            s1: 来自单元k-1的输出
            weights: 每条边的架构权重（alpha）
        """
        states = [s0, s1]

        for i in range(2, self.num_nodes):
            # 计算所有进入边的加权和
            node_inputs = []
            for j in range(i):
                edge_key = f'{j}_{i}'
                edge_ops = self.ops[edge_key]
                edge_weights = weights[edge_key]

                # 所有操作的加权和
                edge_output = sum(
                    w * op(states[j])
                    for w, op in zip(edge_weights, edge_ops)
                )
                node_inputs.append(edge_output)

            # 求和进入节点i的输入
            states.append(sum(node_inputs))

        # 连接所有中间节点
        return torch.cat(states[2:], dim=1)
```

### 宏观与微观搜索空间

| 方面 | 微观（基于单元） | 宏观（完整网络） |
|--------|-------------------|---------------------|
| 搜索空间大小 | 较小 | 非常大 |
| 可转移性 | 高（单元可跨任务转移） | 较低 |
| 搜索成本 | 更高效 | 非常昂贵 |
| 灵活性 | 限于单元设计 | 完整架构控制 |
| 例子 | DARTS、ENAS、NASNet | NAS-RL、AmoebaNet |

---

## 搜索策略

### 随机搜索

尽管简单，但随机搜索对NAS来说是一个出乎意料的强基线。它从搜索空间均匀采样架构并独立评估每个。

```python
import random
import numpy as np

class RandomSearch:
    """NAS的随机搜索策略"""

    def __init__(self, search_space):
        self.search_space = search_space
        self.history = []

    def propose(self):
        """采样随机架构"""
        architecture = {}

        for edge in self.search_space.edges:
            # 为每条边随机选择操作
            op_idx = random.randint(0, len(PRIMITIVES) - 1)
            architecture[edge] = op_idx

        return architecture

    def update(self, architecture, performance):
        """记录结果（随机搜索不使用）"""
        self.history.append((architecture, performance))

    def get_best(self):
        """返回到目前为止找到的最佳架构"""
        return max(self.history, key=lambda x: x[1])


class RandomSearchNAS:
    """完整的随机搜索NAS实现"""

    def __init__(self, search_space, evaluator, budget=100):
        self.search_space = search_space
        self.evaluator = evaluator
        self.budget = budget

    def search(self):
        results = []

        for i in range(self.budget):
            # 采样随机架构
            arch = self._sample_architecture()

            # 评估架构
            accuracy = self.evaluator.evaluate(arch)
            results.append((arch, accuracy))

            print(f"试验{i+1}/{self.budget}: 准确度 = {accuracy:.4f}")

        # 返回最佳架构
        best_arch, best_acc = max(results, key=lambda x: x[1])
        return best_arch, best_acc

    def _sample_architecture(self):
        """从搜索空间均匀采样架构"""
        return {
            edge: random.choice(PRIMITIVES)
            for edge in self.search_space.get_edges()
        }
```

### 进化算法

进化NAS应用生物进化的原理：架构"繁殖"、"变异"，并基于适应度（准确度）进行"自然选择"。

```python
import copy
from collections import deque

class EvolutionaryNAS:
    """
    用于神经网络架构搜索的进化算法。

    基于正则化进化（Real et al., 2019）。
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
        """主进化搜索循环"""
        # 用随机架构初始化种群
        population = deque()
        history = []

        # 创建初始种群
        while len(population) < self.population_size:
            arch = self._random_architecture()
            fitness = self.evaluator.evaluate(arch)
            population.append((arch, fitness))
            history.append((arch, fitness))

        best_arch, best_fitness = max(history, key=lambda x: x[1])

        # 进化循环
        for gen in range(self.num_generations):
            # 竞标赛选择
            sample = random.sample(list(population), self.sample_size)
            parent_arch, parent_fitness = max(sample, key=lambda x: x[1])

            # 变异
            child_arch = self._mutate(parent_arch)
            child_fitness = self.evaluator.evaluate(child_arch)

            # 将子代添加到种群
            population.append((child_arch, child_fitness))
            history.append((child_arch, child_fitness))

            # 移除最旧的（正则化进化）
            population.popleft()

            # 更新最佳
            if child_fitness > best_fitness:
                best_fitness = child_fitness
                best_arch = child_arch

            if gen % 50 == 0:
                print(f"代{gen}: 最佳适应度 = {best_fitness:.4f}")

        return best_arch, best_fitness

    def _random_architecture(self):
        """生成随机架构"""
        return {
            edge: random.choice(PRIMITIVES)
            for edge in self.search_space.get_edges()
        }

    def _mutate(self, architecture):
        """对架构应用随机变异"""
        child = copy.deepcopy(architecture)

        # 随机选择变异类型
        mutation_type = random.choice(['op', 'edge'])

        if mutation_type == 'op':
            # 更改随机边上的操作
            edge = random.choice(list(child.keys()))
            current_op = child[edge]
            new_ops = [op for op in PRIMITIVES if op != current_op]
            child[edge] = random.choice(new_ops)

        elif mutation_type == 'edge':
            # 更改哪些边是活跃的（用于可变拓扑）
            pass  # 简化版本

        return child


class TournamentSelection:
    """用于进化算法的竞标赛选择"""

    def __init__(self, tournament_size=25):
        self.tournament_size = tournament_size

    def select(self, population):
        """使用竞标赛选择选择父代"""
        tournament = random.sample(population, self.tournament_size)
        winner = max(tournament, key=lambda x: x[1])  # x[1]是适应度
        return winner[0]  # 返回架构


class Mutation:
    """NAS的变异操作符"""

    @staticmethod
    def mutate_operation(architecture, primitives, prob=1.0):
        """变异架构中的随机操作"""
        if random.random() > prob:
            return architecture

        arch = copy.deepcopy(architecture)
        edge = random.choice(list(arch.keys()))

        # 选择不同的操作
        current = arch[edge]
        alternatives = [p for p in primitives if p != current]
        arch[edge] = random.choice(alternatives)

        return arch

    @staticmethod
    def mutate_hidden_state(architecture, num_nodes):
        """变异使用哪些隐藏状态（AmoebaNet风格）"""
        arch = copy.deepcopy(architecture)
        # 实现取决于特定的编码
        return arch
```

### 基于强化学习的NAS

基于RL的NAS将架构生成视为顺序决策问题。控制器网络（通常是RNN）生成架构描述，并使用基于生成架构的验证准确度的策略梯度进行训练。

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.distributions import Categorical

class NASController(nn.Module):
    """
    用于基于RL的NAS的RNN控制器。

    控制器通过顺序采样操作来生成架构。
    它使用REINFORCE进行训练。
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

        # LSTM控制器
        self.lstm = nn.LSTMCell(hidden_size, hidden_size)

        # 操作的嵌入
        self.op_embedding = nn.Embedding(num_operations, hidden_size)

        # 输出头
        self.op_classifier = nn.Linear(hidden_size, num_operations)
        self.node_classifier = nn.Linear(hidden_size, num_nodes)

        # 初始隐藏状态
        self.h0 = nn.Parameter(torch.zeros(1, hidden_size))
        self.c0 = nn.Parameter(torch.zeros(1, hidden_size))

        # 开始令牌嵌入
        self.start_token = nn.Parameter(torch.zeros(1, hidden_size))

    def forward(self, batch_size=1):
        """
        通过从控制器采样生成架构。

        返回：
            actions: (operation, input_node)元组列表
            log_probs: REINFORCE的对数概率
            entropy: 策略的熵（用于正则化）
        """
        h = self.h0.expand(batch_size, -1)
        c = self.c0.expand(batch_size, -1)

        actions = []
        log_probs = []
        entropies = []

        input_embed = self.start_token.expand(batch_size, -1)

        # 为单元中的每条边生成决策
        num_edges = (self.num_nodes - 2) * (self.num_nodes - 1) // 2

        for _ in range(num_edges):
            # LSTM步
            h, c = self.lstm(input_embed, (h, c))

            # 采样操作
            op_logits = self.op_classifier(h) / self.temperature
            op_probs = F.softmax(op_logits, dim=-1)
            op_dist = Categorical(op_probs)
            op_action = op_dist.sample()

            actions.append(op_action)
            log_probs.append(op_dist.log_prob(op_action))
            entropies.append(op_dist.entropy())

            # 更新下一步的输入
            input_embed = self.op_embedding(op_action)

        return actions, torch.stack(log_probs), torch.stack(entropies)

    def sample_architecture(self):
        """采样单个架构"""
        with torch.no_grad():
            actions, _, _ = self.forward(batch_size=1)
        return [a.item() for a in actions]


class REINFORCETrainer:
    """
    使用REINFORCE算法训练NAS控制器。
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
        """控制器的一个训练步骤"""

        rewards = []
        all_log_probs = []
        all_entropies = []

        # 采样架构并评估
        for _ in range(num_samples):
            actions, log_probs, entropies = self.controller.forward(batch_size=1)

            # 将动作转换为架构
            architecture = self._actions_to_architecture(actions)

            # 评估架构（昂贵的步骤）
            reward = self.evaluator.evaluate(architecture)

            rewards.append(reward)
            all_log_probs.append(log_probs.sum())
            all_entropies.append(entropies.mean())

        # 计算基线（奖励的移动平均）
        mean_reward = sum(rewards) / len(rewards)
        if self.baseline is None:
            self.baseline = mean_reward
        else:
            self.baseline = (self.baseline_decay * self.baseline +
                           (1 - self.baseline_decay) * mean_reward)

        # 计算策略梯度损失
        policy_loss = 0
        entropy_bonus = 0

        for reward, log_prob, entropy in zip(rewards, all_log_probs, all_entropies):
            advantage = reward - self.baseline
            policy_loss -= advantage * log_prob
            entropy_bonus += entropy

        policy_loss /= num_samples
        entropy_bonus /= num_samples

        # 总损失
        loss = policy_loss - self.entropy_weight * entropy_bonus

        # 更新控制器
        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.controller.parameters(), 1.0)
        self.optimizer.step()

        return mean_reward, loss.item()

    def _actions_to_architecture(self, actions):
        """将控制器动作转换为架构字典"""
        architecture = {}
        action_idx = 0

        for i in range(2, self.controller.num_nodes):
            for j in range(i):
                edge = f'{j}_{i}'
                architecture[edge] = PRIMITIVES[actions[action_idx].item()]
                action_idx += 1

        return architecture
```

### 搜索策略比较

| 策略 | 优点 | 缺点 | GPU天数（CIFAR-10） |
|----------|------|------|---------------------|
| 随机搜索 | 简单、可并行化、强基线 | 不从过去样本学习 | ~1000 |
| 进化 | 处理离散空间好、可并行化 | 需要许多评估 | ~3000 |
| 基于RL | 可学习搜索启发式 | 高方差、不稳定训练 | ~2000 |
| DARTS | 非常高效、连续松弛 | 内存密集、不稳定 | ~1-4 |

---

## DARTS：可微架构搜索

DARTS（可微架构搜索）通过使搜索过程可微化彻底改革了NAS，实现了基于梯度的优化。DARTS没有将架构选择视为离散问题，而是将其松弛到连续问题。

### 连续松弛

DARTS没有为每条边选择单一操作，而是维护对操作的概率分布：

$$\bar{o}(x) = \sum_{o \in \mathcal{O}} \frac{\exp(\alpha_o)}{\sum_{o' \in \mathcal{O}} \exp(\alpha_{o'})} \cdot o(x)$$

其中 $\alpha_o$ 是可学习的架构参数。

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MixedOperation(nn.Module):
    """
    DARTS的混合操作。

    计算所有候选操作的加权和，
    权重由架构参数的softmax确定。
    """

    def __init__(self, in_channels, out_channels, stride=1):
        super().__init__()
        self.ops = nn.ModuleList([
            get_operation(prim, in_channels, out_channels, stride)
            for prim in PRIMITIVES
        ])

    def forward(self, x, weights):
        """
        参数：
            x: 输入张量
            weights: 每个操作的softmax权重
        """
        return sum(w * op(x) for w, op in zip(weights, self.ops))


class DARTSCell(nn.Module):
    """
    具有连续松弛的DARTS单元。
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

        # 为所有边创建混合操作
        self.ops = nn.ModuleDict()
        self.num_edges = 0

        for i in range(2, num_nodes):
            for j in range(i):
                stride = 2 if reduction and j < 2 else 1
                self.ops[f'{j}_{i}'] = MixedOperation(channels, channels, stride)
                self.num_edges += 1

    def forward(self, s0, s1, alphas):
        """
        参数：
            s0: 来自单元k-2的输出
            s1: 来自单元k-1的输出
            alphas: 架构参数（形状：num_edges x num_ops）
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

        # 连接中间节点
        return torch.cat(states[2:], dim=1)


class DARTSNetwork(nn.Module):
    """
    用于架构搜索的完整DARTS网络。
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

        # 主干层
        curr_channels = stem_multiplier * init_channels
        self.stem = nn.Sequential(
            nn.Conv2d(3, curr_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(curr_channels)
        )

        # 构建单元
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

        # 分类器
        self.global_pool = nn.AdaptiveAvgPool2d(1)
        self.classifier = nn.Linear(prev_channels, num_classes)

        # 架构参数
        self._init_arch_parameters()

    def _init_arch_parameters(self):
        """初始化架构参数（alphas）"""
        num_ops = len(PRIMITIVES)
        num_edges = sum(range(2, self.num_nodes))

        # 普通单元alphas
        self.alpha_normal = nn.Parameter(
            torch.randn(num_edges, num_ops) * 1e-3
        )
        # 缩放单元alphas
        self.alpha_reduce = nn.Parameter(
            torch.randn(num_edges, num_ops) * 1e-3
        )

    def arch_parameters(self):
        """返回架构参数"""
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

### DARTS中的双层优化

DARTS在以下之间交替：
1. 在训练数据上更新网络权重 $w$
2. 在验证数据上更新架构参数 $\alpha$

```python
class DARTSTrainer:
    """
    DARTS双层优化训练器。
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

        # 网络权重优化器
        self.optimizer_w = torch.optim.SGD(
            model.parameters(),
            lr=lr_w,
            momentum=momentum,
            weight_decay=weight_decay
        )

        # 架构参数优化器
        self.optimizer_alpha = torch.optim.Adam(
            model.arch_parameters(),
            lr=lr_alpha,
            betas=(0.5, 0.999),
            weight_decay=1e-3
        )

        self.criterion = nn.CrossEntropyLoss()

    def train_epoch(self):
        """DARTS训练的一个周期"""
        self.model.train()

        train_iter = iter(self.train_loader)
        val_iter = iter(self.val_loader)

        for step in range(len(self.train_loader)):
            # 获取训练和验证批
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

            # 步骤1：在验证数据上更新架构参数
            self.optimizer_alpha.zero_grad()
            val_logits = self.model(val_x)
            val_loss = self.criterion(val_logits, val_y)
            val_loss.backward()
            self.optimizer_alpha.step()

            # 步骤2：在训练数据上更新网络权重
            self.optimizer_w.zero_grad()
            train_logits = self.model(train_x)
            train_loss = self.criterion(train_logits, train_y)
            train_loss.backward()
            self.optimizer_w.step()

            if step % 50 == 0:
                print(f"步{step}: 训练损失 = {train_loss:.4f}, "
                      f"验证损失 = {val_loss:.4f}")

    def derive_architecture(self):
        """从连续alphas派生离散架构"""
        def derive_cell(alphas):
            """将柔性alphas转换为离散架构"""
            gene = []
            n = 2
            start = 0

            for i in range(self.model.num_nodes - 2):
                end = start + n
                edge_weights = alphas[start:end]

                # 为每个节点选择前2条边
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

### 二阶近似

架构参数的精确梯度需要计算二阶导数（Hessian），这很昂贵。DARTS使用有限差分近似：

$$\nabla_\alpha \mathcal{L}_{val}(w^*(\alpha), \alpha) \approx \nabla_\alpha \mathcal{L}_{val}(w', \alpha) - \frac{\xi}{2\epsilon}[\nabla_\alpha \mathcal{L}_{val}(w^+, \alpha) - \nabla_\alpha \mathcal{L}_{val}(w^-, \alpha)]$$

其中 $w^\pm = w \pm \epsilon \nabla_{w'} \mathcal{L}_{val}(w', \alpha)$.

```python
def compute_darts_gradient_second_order(model, train_x, train_y, val_x, val_y, xi=0.01):
    """
    使用二阶近似计算架构梯度。

    这提供比一阶更准确的梯度，但更昂贵。
    """
    # 保存当前权重
    w = [p.clone() for p in model.parameters()]

    # 在验证数据上的前向传播
    val_loss = F.cross_entropy(model(val_x), val_y)
    val_grads = torch.autograd.grad(val_loss, model.arch_parameters())

    # 计算验证损失关于权重的梯度
    val_loss_w = F.cross_entropy(model(val_x), val_y)
    w_grads = torch.autograd.grad(val_loss_w, model.parameters())

    # w+ = w + epsilon * grad
    epsilon = 0.01 / torch.cat([g.view(-1) for g in w_grads]).norm()

    # 扰动权重：w+
    with torch.no_grad():
        for p, g in zip(model.parameters(), w_grads):
            p.add_(epsilon * g)

    train_loss_plus = F.cross_entropy(model(train_x), train_y)
    alpha_grads_plus = torch.autograd.grad(train_loss_plus, model.arch_parameters())

    # 扰动权重：w-
    with torch.no_grad():
        for p, g in zip(model.parameters(), w_grads):
            p.sub_(2 * epsilon * g)

    train_loss_minus = F.cross_entropy(model(train_x), train_y)
    alpha_grads_minus = torch.autograd.grad(train_loss_minus, model.arch_parameters())

    # 恢复权重
    with torch.no_grad():
        for p, w_orig in zip(model.parameters(), w):
            p.copy_(w_orig)

    # 计算最终梯度
    alpha_grads = []
    for g, g_plus, g_minus in zip(val_grads, alpha_grads_plus, alpha_grads_minus):
        hessian_term = (g_plus - g_minus) / (2 * epsilon)
        alpha_grads.append(g - xi * hessian_term)

    return alpha_grads
```

---

## 权重共享与单次方法

权重共享通过训练包含所有候选架构作为子网络的单个"超网络"大大降低了NAS的成本。

### 单次范式

单次方法而不是从头训练每个架构：
1. 训练包含所有可能操作的超网络
2. 通过继承超网络的权重来评估架构
3. 基于共享权重性能选择最佳架构

```python
class SuperNet(nn.Module):
    """
    用于NAS的单次超网络。

    所有可能的架构通过这个超网络共享权重。
    """

    def __init__(self, num_classes, num_cells, num_nodes, init_channels):
        super().__init__()
        self.num_nodes = num_nodes

        # 主干
        self.stem = nn.Sequential(
            nn.Conv2d(3, init_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(init_channels)
        )

        # 构建超网络单元
        self.cells = nn.ModuleList()
        channels = init_channels

        for i in range(num_cells):
            reduction = (i in [num_cells // 3, 2 * num_cells // 3])
            if reduction:
                channels *= 2
            cell = SuperNetCell(num_nodes, channels, reduction)
            self.cells.append(cell)

        # 分类器
        self.global_pool = nn.AdaptiveAvgPool2d(1)
        self.classifier = nn.Linear(channels * (num_nodes - 2), num_classes)

    def forward(self, x, architecture):
        """
        使用特定架构的前向传播。

        参数：
            x: 输入张量
            architecture: 将边映射到操作名称的字典
        """
        s0 = s1 = self.stem(x)

        for cell in self.cells:
            s0, s1 = s1, cell(s0, s1, architecture)

        out = self.global_pool(s1)
        out = out.view(out.size(0), -1)
        return self.classifier(out)


class SuperNetCell(nn.Module):
    """
    包含所有候选操作的超网络单元。
    """

    def __init__(self, num_nodes, channels, reduction):
        super().__init__()
        self.num_nodes = num_nodes

        # 每条边的所有操作
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
        """使用特定架构选择的前向传播"""
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
    具有权重共享的单次NAS。
    """

    def __init__(self, supernet, train_loader, val_loader):
        self.supernet = supernet
        self.train_loader = train_loader
        self.val_loader = val_loader

    def train_supernet(self, epochs):
        """使用路径丢弃训练超网络"""
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

                # 采样随机架构
                arch = self._sample_architecture()

                # 前向传播
                logits = self.supernet(x, arch)
                loss = F.cross_entropy(logits, y)

                # 反向传播
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

            print(f"周期{epoch}: 超网络训练完成")

    def search(self, num_samples=1000):
        """通过评估带有共享权重的随机架构搜索"""
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
                print(f"样本{i}: 最佳准确度 = {best_acc:.4f}")

        return best_arch, best_acc

    def _sample_architecture(self):
        """采样随机架构"""
        arch = {}
        for i in range(2, self.supernet.num_nodes):
            for j in range(i):
                arch[f'{j}_{i}'] = random.choice(PRIMITIVES)
        return arch

    @torch.no_grad()
    def _evaluate_architecture(self, arch):
        """在验证集上评估架构"""
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

### ENAS：高效神经网络架构搜索

ENAS结合了基于RL的搜索和权重共享，使NAS在单个GPU上可行：

```python
class ENASController(nn.Module):
    """
    与子网络共享权重的ENAS控制器。
    """

    def __init__(self, num_nodes, num_operations, hidden_size=100):
        super().__init__()
        self.num_nodes = num_nodes
        self.num_operations = num_operations

        self.lstm = nn.LSTMCell(hidden_size, hidden_size)

        # 嵌入
        self.node_embedding = nn.Embedding(num_nodes, hidden_size)
        self.op_embedding = nn.Embedding(num_operations, hidden_size)

        # 输出头
        self.op_classifier = nn.Linear(hidden_size, num_operations)
        self.skip_classifier = nn.Linear(hidden_size, 1)  # 用于跳连接

        # 可学习的初始状态
        self.h0 = nn.Parameter(torch.zeros(1, hidden_size))
        self.c0 = nn.Parameter(torch.zeros(1, hidden_size))

    def forward(self):
        """从控制器采样架构"""
        h = self.h0
        c = self.c0

        arch = {'ops': [], 'skip': []}
        log_probs = []
        entropies = []

        for node_idx in range(2, self.num_nodes):
            # 采样操作
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

            # 采样跳连接（用于每个先前节点）
            skip_conn = []
            for prev_idx in range(node_idx):
                h, c = self.lstm(self.op_embedding(op), (h, c))

                skip_logit = self.skip_classifier(h)
                skip_prob = torch.sigmoid(skip_logit)
                skip = torch.bernoulli(skip_prob)

                skip_conn.append(skip.item())

                # 计算对数概率
                if skip.item() == 1:
                    log_probs.append(torch.log(skip_prob + 1e-8))
                else:
                    log_probs.append(torch.log(1 - skip_prob + 1e-8))

            arch['skip'].append(skip_conn)

        return arch, torch.stack(log_probs).sum(), torch.stack(entropies).mean()
```

---

## 性能估计策略

将每个候选架构训练至充分收敛在计算上是不可行的。存在多种策略可更高效地估计架构性能。

### 低保真估计

```python
class PerformanceEstimator:
    """
    NAS的性能估计策略。
    """

    def __init__(self, dataset, device='cuda'):
        self.dataset = dataset
        self.device = device

    def full_training(self, architecture, epochs=100):
        """
        完整训练（昂贵但准确）。
        最昂贵：每个架构约数小时。
        """
        model = self._build_model(architecture)
        trainer = self._create_trainer(model)

        for epoch in range(epochs):
            trainer.train_epoch()

        return trainer.measure_accuracy()

    def reduced_training(self, architecture, epochs=20, subset_ratio=0.1):
        """
        使用更少周期和/或更小数据集训练。
        更便宜：每个架构约数分钟。
        """
        model = self._build_model(architecture)

        # 使用训练数据的子集
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
        从预训练超网络继承权重。
        非常便宜：每个架构约数秒。
        """
        model = self._build_model(architecture)

        # 从超网络复制权重
        for name, param in model.named_parameters():
            if name in pretrained_supernet:
                param.data.copy_(pretrained_supernet[name].data)

        return self._measure_model_accuracy(model)

    def learning_curve_extrapolation(self, architecture, partial_epochs=10):
        """
        部分训练并外推最终性能。
        """
        model = self._build_model(architecture)
        trainer = self._create_trainer(model)

        # 收集学习曲线数据
        learning_curve = []
        for epoch in range(partial_epochs):
            trainer.train_epoch()
            acc = trainer.measure_accuracy()
            learning_curve.append(acc)

        # 使用曲线拟合进行外推
        predicted_final = self._extrapolate_curve(learning_curve)
        return predicted_final

    def _extrapolate_curve(self, curve, target_epoch=100):
        """使用幂律外推学习曲线"""
        import numpy as np
        from scipy.optimize import curve_fit

        def power_law(x, a, b, c):
            return a - b * np.power(x, -c)

        epochs = np.arange(1, len(curve) + 1)

        try:
            params, _ = curve_fit(power_law, epochs, curve, maxfev=1000)
            predicted = power_law(target_epoch, *params)
        except:
            predicted = curve[-1]  # 回退到最后观察值

        return predicted


class EarlyStoppingEstimator:
    """
    基于验证性能的早停。
    """

    def __init__(self, patience=10, min_delta=0.001):
        self.patience = patience
        self.min_delta = min_delta

    def measure_performance(self, architecture, max_epochs=100):
        """
        使用基于验证性能的早停进行训练。
        """
        model = self._build_model(architecture)

        best_val_acc = 0
        patience_counter = 0

        for epoch in range(max_epochs):
            # 训练一个周期
            self._train_epoch(model)

            # 检查验证准确度
            val_acc = self._check_validation(model)

            if val_acc > best_val_acc + self.min_delta:
                best_val_acc = val_acc
                patience_counter = 0
            else:
                patience_counter += 1

            if patience_counter >= self.patience:
                print(f"在周期{epoch}进行早停")
                break

        return best_val_acc
```

### 代理任务

与其在完整任务上评估，不如使用更简单的代理任务：

```python
class ProxyTaskEvaluator:
    """
    使用代理任务评估架构。
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
        在低分辨率图像上训练和检查。
        例如，CIFAR-10为16x16而不是32x32。
        """
        transform = transforms.Compose([
            transforms.Resize(16),
            transforms.ToTensor()
        ])
        # ... 训练代码

    def _assess_zero_cost(self, architecture):
        """
        零成本代理：无需训练即可评估。
        使用梯度流、synflow等指标。
        """
        model = self._build_model(architecture)
        model.train()

        # 计算synflow分数（梯度的绝对值乘积）
        score = self._compute_synflow(model)
        return score

    def _compute_synflow(self, model):
        """
        SynFlow：零成本代理指标。
        更高的分数通常表示更好的架构。
        """
        # 将所有参数设置为1
        for p in model.parameters():
            p.data = torch.ones_like(p.data)

        # 全1输入的前向传播
        dummy_input = torch.ones(1, 3, 32, 32).cuda()
        output = model(dummy_input)

        # 计算synflow分数
        loss = output.sum()
        loss.backward()

        score = 0
        for p in model.parameters():
            if p.grad is not None:
                score += (p.data * p.grad.data).abs().sum().item()

        return score
```

---

## EfficientNet案例研究

EfficientNet代表了NAS的里程碑式成就，展示了自动搜索如何发现优于手工设计网络的架构，同时效率更高。

### 背景

EfficientNet采用新颖的复合缩放方法结合NAS发现的基础架构：

1. **神经网络架构搜索**：找到高效的基础网络（EfficientNet-B0）
2. **复合缩放**：将深度、宽度和分辨率一起缩放

### MnasNet基础

EfficientNet建立在MnasNet的基础上，它同时优化准确度和延迟：

$$\max_m \text{准确度}(m) \times \left[\frac{\text{延迟}(m)}{T}\right]^w$$

其中：
- $\text{准确度}(m)$ 是模型 $m$ 的准确度
- $\text{延迟}(m)$ 是延迟
- $T$ 是目标延迟
- $w$ 是权重因子（通常为-0.07）

```python
class MobileInvertedResidual(nn.Module):
    """
    移动反向残差块（MBConv）。
    EfficientNet的核心构建块。
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

        # 扩张阶段
        if expand_ratio != 1:
            layers.extend([
                nn.Conv2d(in_channels, hidden_dim, 1, bias=False),
                nn.BatchNorm2d(hidden_dim),
                nn.SiLU(inplace=True)  # Swish激活
            ])

        # 深度卷积
        layers.extend([
            nn.Conv2d(
                hidden_dim, hidden_dim, kernel_size,
                stride=stride, padding=kernel_size // 2,
                groups=hidden_dim, bias=False
            ),
            nn.BatchNorm2d(hidden_dim),
            nn.SiLU(inplace=True)
        ])

        # 压缩与激励
        if se_ratio > 0:
            se_channels = max(1, int(in_channels * se_ratio))
            layers.append(SqueezeExcitation(hidden_dim, se_channels))

        # 输出阶段
        layers.extend([
            nn.Conv2d(hidden_dim, out_channels, 1, bias=False),
            nn.BatchNorm2d(out_channels)
        ])

        self.block = nn.Sequential(*layers)

        # 随机深度
        self.drop_rate = 0.2

    def forward(self, x):
        out = self.block(x)

        if self.use_residual:
            if self.training and self.drop_rate > 0:
                out = self._stochastic_depth(out)
            out = out + x

        return out

    def _stochastic_depth(self, x):
        """应用随机深度（丢弃路径）"""
        if not self.training:
            return x
        keep_prob = 1 - self.drop_rate
        shape = (x.shape[0],) + (1,) * (x.ndim - 1)
        mask = torch.empty(shape, device=x.device).bernoulli_(keep_prob)
        return x * mask / keep_prob


class SqueezeExcitation(nn.Module):
    """压缩与激励块"""

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
    EfficientNet-B0：NAS发现的基础架构。

    该架构是通过在ImageNet上优化准确度和FLOP发现的
    多目标搜索。
    """

    # 块配置：(expand_ratio, channels, num_blocks, kernel_size, stride)
    CONFIG = [
        (1, 16, 1, 3, 1),   # 阶段1
        (6, 24, 2, 3, 2),   # 阶段2
        (6, 40, 2, 5, 2),   # 阶段3
        (6, 80, 3, 3, 2),   # 阶段4
        (6, 112, 3, 5, 1),  # 阶段5
        (6, 192, 4, 5, 2),  # 阶段6
        (6, 320, 1, 3, 1),  # 阶段7
    ]

    def __init__(self, num_classes=1000, dropout_rate=0.2):
        super().__init__()

        # 主干
        self.stem = nn.Sequential(
            nn.Conv2d(3, 32, 3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.SiLU(inplace=True)
        )

        # 构建阶段
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

        # 头
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

### 复合缩放

EfficientNet使用复合系数缩放基础网络：

$$\text{深度}: d = \alpha^\phi$$
$$\text{宽度}: w = \beta^\phi$$
$$\text{分辨率}: r = \gamma^\phi$$

约束条件：$\alpha \cdot \beta^2 \cdot \gamma^2 \approx 2$

```python
import math

class EfficientNetScaler:
    """
    EfficientNet的复合缩放。

    给定phi（复合系数），计算深度、宽度和分辨率的
    最优缩放因子。
    """

    # 通过网格搜索找到的最优缩放参数
    ALPHA = 1.2   # 深度
    BETA = 1.1    # 宽度
    GAMMA = 1.15  # 分辨率

    # EfficientNet变体
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
        按复合系数phi缩放基础模型配置。
        """
        depth_coef = cls.ALPHA ** phi
        width_coef = cls.BETA ** phi
        resolution_coef = cls.GAMMA ** phi

        scaled_config = []
        for expand, channels, num_blocks, kernel, stride in base_config:
            scaled_channels = int(channels * width_coef)
            # 舍入到最近的8的倍数以获得效率
            scaled_channels = ((scaled_channels + 7) // 8) * 8

            scaled_blocks = int(math.ceil(num_blocks * depth_coef))

            scaled_config.append(
                (expand, scaled_channels, scaled_blocks, kernel, stride)
            )

        return scaled_config, resolution_coef

    @classmethod
    def get_efficientnet(cls, variant='b0', num_classes=1000):
        """获取缩放的EfficientNet模型"""
        config = cls.VARIANTS[variant]

        scaled_config, _ = cls.scale_model(
            EfficientNetB0.CONFIG,
            config['phi']
        )

        # 使用缩放配置构建模型
        model = EfficientNetScaled(
            scaled_config,
            config['resolution'],
            num_classes,
            config['dropout']
        )

        return model
```

### EfficientNet关键洞察

1. **平衡缩放很重要**：单独缩放深度、宽度或分辨率会产生递减收益。复合缩放实现更好的准确度/FLOP。

2. **NAS发现的块**：带有压缩-激励的MBConv块被发现非常高效。

3. **准确度与效率权衡**：EfficientNet以显著更少的参数和FLOP实现最先进的准确度。

| 模型 | Top-1准确度 | 参数 | FLOP |
|-------|-----------|------------|-------|
| ResNet-50 | 76.0% | 26M | 4.1B |
| EfficientNet-B0 | 77.3% | 5.3M | 0.39B |
| EfficientNet-B4 | 82.9% | 19M | 4.2B |
| EfficientNet-B7 | 84.3% | 66M | 37B |

---

## 实践实现指南

### 设置NAS实验

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import torchvision
import torchvision.transforms as transforms

class NASExperiment:
    """
    完整的NAS实验设置。
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

        # 设置随机种子
        torch.manual_seed(seed)
        torch.cuda.manual_seed(seed)

        # 设置数据
        self._setup_data()

    def _setup_data(self):
        """为搜索和最终训练准备数据集"""
        if self.dataset == 'cifar10':
            # 变换
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

            # 加载数据集
            train_data = torchvision.datasets.CIFAR10(
                root='./data', train=True, download=True,
                transform=train_transform
            )

            test_data = torchvision.datasets.CIFAR10(
                root='./data', train=False, download=True,
                transform=test_transform
            )

            # 分割训练数据用于搜索
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

            # 用于最终训练的完整数据
            self.final_train_loader = DataLoader(
                train_data, batch_size=96, shuffle=True, num_workers=4
            )

            self.final_test_loader = DataLoader(
                test_data, batch_size=96, shuffle=False, num_workers=4
            )

            self.num_classes = 10

    def run_search(self):
        """运行架构搜索"""
        print("=" * 50)
        print("开始架构搜索")
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
        """运行DARTS搜索"""
        # 创建DARTS模型
        model = DARTSNetwork(
            num_classes=self.num_classes,
            num_cells=8,
            num_nodes=4,
            init_channels=16
        ).cuda()

        # 创建训练器
        trainer = DARTSTrainer(
            model,
            self.search_train_loader,
            self.search_val_loader
        )

        # 运行搜索
        for epoch in range(self.search_epochs):
            print(f"\n搜索周期{epoch + 1}/{self.search_epochs}")
            trainer.train_epoch()

        # 派生最终架构
        architecture = trainer.derive_architecture()
        print("\n派生架构：")
        print(f"普通单元：{architecture['normal']}")
        print(f"缩放单元：{architecture['reduce']}")

        return architecture

    def run_final_training(self, architecture):
        """从头开始训练并检查发现的架构"""
        print("=" * 50)
        print("训练发现的架构")
        print("=" * 50)

        # 从发现的架构构建模型
        model = self._build_final_model(architecture).cuda()

        # 计算参数
        n_params = sum(p.numel() for p in model.parameters())
        print(f"参数数量：{n_params / 1e6:.2f}M")

        # 训练设置
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
            # 训练
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

                # 梯度裁剪
                torch.nn.utils.clip_grad_norm_(model.parameters(), 5.0)

                optimizer.step()

                train_loss += loss.item()
                pred = logits.argmax(dim=1)
                correct += (pred == y).sum().item()
                total += y.size(0)

            scheduler.step()

            train_acc = 100.0 * correct / total

            # 测试
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
                print(f"周期{epoch}: 训练准确度 = {train_acc:.2f}%, "
                      f"测试准确度 = {test_acc:.2f}%, 最佳 = {best_acc:.2f}%")

        return best_acc


def main():
    """运行完整的NAS实验"""
    experiment = NASExperiment(
        dataset='cifar10',
        search_method='darts',
        search_epochs=50,
        final_epochs=600
    )

    # 阶段1：架构搜索
    architecture = experiment.run_search()

    # 阶段2：完整训练
    final_accuracy = experiment.run_final_training(architecture)

    print("=" * 50)
    print(f"最终测试准确度：{final_accuracy:.2f}%")
    print("=" * 50)


if __name__ == '__main__':
    main()
```

### 常见陷阱与解决方案

```python
class NASDebugger:
    """
    NAS的常见问题和调试策略。
    """

    @staticmethod
    def check_architecture_collapse(alphas, threshold=0.9):
        """
        检查架构是否已崩溃为跳连接。

        这是DARTS中的常见失败模式，其中搜索
        收敛到由跳连接主导的架构。
        """
        probs = F.softmax(alphas, dim=-1)
        skip_idx = PRIMITIVES.index('skip_connect')

        skip_probs = probs[:, skip_idx]
        collapse = (skip_probs > threshold).float().mean()

        if collapse > 0.5:
            print("警告：检测到架构崩溃！")
            print(f"{collapse * 100:.1f}%的边由跳连接主导")
            return True
        return False

    @staticmethod
    def regularize_architecture(alphas, regularization='entropy'):
        """
        应用正则化以防止架构崩溃。
        """
        probs = F.softmax(alphas, dim=-1)

        if regularization == 'entropy':
            # 最大化熵以鼓励多样化操作
            entropy = -(probs * torch.log(probs + 1e-8)).sum(dim=-1).mean()
            return -entropy  # 负数因为我们最小化损失

        elif regularization == 'skip_penalty':
            # 惩罚跳连接
            skip_idx = PRIMITIVES.index('skip_connect')
            return probs[:, skip_idx].mean()

    @staticmethod
    def validate_supernet_ranking(supernet, architectures, ground_truth_ranks):
        """
        检查超网络排名是否与真实性能相关。

        排名相关性差表明权重共享不起作用。
        """
        from scipy.stats import kendalltau

        # 获取超网络排名
        supernet_scores = []
        for arch in architectures:
            score = supernet.check_performance(arch)
            supernet_scores.append(score)

        supernet_ranks = np.argsort(np.argsort(-np.array(supernet_scores)))

        # 计算Kendall's tau
        tau, p_value = kendalltau(supernet_ranks, ground_truth_ranks)

        print(f"Kendall's tau: {tau:.3f} (p值: {p_value:.3e})")

        if tau < 0.5:
            print("警告：排名相关性差！")
            print("考虑：更多超网络训练、路径丢弃或不同搜索空间")

        return tau


class BestPractices:
    """
    NAS实验的最佳实践。
    """

    @staticmethod
    def get_recommendations():
        return """
        NAS最佳实践：

        1. 搜索空间设计
           - 从已证实的操作集开始（DARTS基元）
           - 包含跳连接但进行正则化
           - 在表现力和可追踪性之间平衡

        2. 搜索效率
           - 尽可能使用权重共享
           - 从较低保真估计开始
           - 对差的架构采用早停

        3. 最终训练
           - 总是从头重新训练以获得最终数字
           - 使用多个随机种子
           - 报告置信区间

        4. 可重现性
           - 修复所有随机种子
           - 记录所有超参数
           - 保存中间检查点

        5. 常见失败模式
           - 跳连接崩溃：正则化或修改搜索空间
           - 超网络相关性差：更多训练、路径丢弃
           - 高方差：更大种群、更多样本
        """
```

---

## 面试要点

### 概念问题

**Q1：NAS系统的主要组件是什么？**

A：NAS系统由三个主要组件组成：
1. **搜索空间**：定义可以发现的架构（操作、连接、宏观结构）
2. **搜索策略**：如何探索搜索空间（随机、进化、RL、基于梯度）
3. **性能估计**：如何评估候选架构（完整训练、权重共享、代理任务）

**Q2：解释DARTS的关键洞察。**

A：DARTS通过以下方式使离散架构选择可微化：
1. 用所有操作的加权和替换硬操作选择
2. 使用可学习架构参数的softmax作为权重
3. 启用架构参数上的梯度下降
4. 最后，通过选择权重最高的操作派生离散架构

这将搜索成本从数千个GPU天减少到几个GPU天。

**Q3：NAS中的权重共享问题是什么？**

A：权重共享假设在使用共享权重与从头训练时，架构的相对排名被保留。然而：
- 排名相关性往往不完美
- 某些架构可能不公平地受益于共享权重
- 解决方案包括：更长的超网络训练、路径丢弃、渐进式缩减

### 技术问题

**Q4：EfficientNet中的复合缩放如何工作？**

```python
# 复合缩放关系
深度 = alpha ** phi      # 层数
宽度 = beta ** phi       # 通道数
分辨率 = gamma ** phi # 输入图像大小

# 约束：alpha * beta^2 * gamma^2 = 2
# 这在缩放时保持FLOP大致恒定

# EfficientNet最优值：
# alpha = 1.2, beta = 1.1, gamma = 1.15
```

关键洞察是深度、宽度和分辨率应该一起缩放而不是独立缩放，因为它们对模型容量有复合影响。

**Q5：比较单次NAS方法（ENAS、DARTS）与传统NAS（基于RL）。**

| 方面 | 传统（RL） | 单次（ENAS/DARTS） |
|--------|------------------|------------------------|
| 搜索成本 | 1000s GPU天 | 1-4 GPU天 |
| 权重训练 | 从头开始每次 | 共享超网络 |
| 架构采样 | 离散 | 连续（DARTS）或离散（ENAS） |
| 最终性能 | 通常更高 | 可能需要重新训练 |
| 内存使用 | 低每个架构 | 高（存储所有操作） |

**Q6：NAS中的零成本代理是什么？**

A：零成本代理在没有任何训练的情况下估计架构质量：
- **SynFlow**：绝对参数值和梯度的乘积
- **GradNorm**：初始化时的梯度大小
- **NASWOT**：样本间梯度的相关性

这些启用极快的架构排名，但与真实性能的相关性较低。

### 代码实现问题

**Q7：为进化NAS实现简单的架构编码和变异。**

```python
class ArchitectureEncoding:
    """
    将架构编码为字符串用于进化搜索。
    """

    def __init__(self, num_nodes=4, primitives=PRIMITIVES):
        self.num_nodes = num_nodes
        self.primitives = primitives

    def encode(self, architecture):
        """将架构字典转换为字符串"""
        encoding = []
        for i in range(2, self.num_nodes):
            for j in range(i):
                edge = f'{j}_{i}'
                op = architecture.get(edge, 'none')
                encoding.append(str(self.primitives.index(op)))
        return ''.join(encoding)

    def decode(self, encoding):
        """将字符串转换为架构字典"""
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
        """应用单点变异"""
        encoding = list(encoding)
        pos = random.randint(0, len(encoding) - 1)
        current = int(encoding[pos])
        new_op = random.choice([i for i in range(len(self.primitives)) if i != current])
        encoding[pos] = str(new_op)
        return ''.join(encoding)

    def crossover(self, parent1, parent2):
        """单点交叉"""
        point = random.randint(1, len(parent1) - 1)
        child = parent1[:point] + parent2[point:]
        return child
```

---

## 总结

神经网络架构搜索通过自动化架构设计过程改变了深度学习。关键要点：

1. **搜索空间设计**：基于单元的搜索空间与标准操作提供了表现力和效率的良好平衡。

2. **搜索策略**：
   - 随机搜索是强基线
   - 进化算法很好地处理离散空间
   - 基于RL的方法可以学习搜索启发式
   - DARTS实现高效的基于梯度的搜索

3. **权重共享**：对实际NAS至关重要，但需要仔细处理排名相关性。

4. **性能估计**：准确度与成本之间的权衡；零成本代理和早停有所帮助。

5. **EfficientNet**：展示了将NAS发现的架构与原则性缩放策略相结合的力量。

随着硬件改进和搜索方法变得更高效，NAS将继续在为不同应用开发专业化架构中发挥日益重要的作用。

---

## 延伸阅读

### 必读论文

1. **Zoph & Le (2017)** - "使用强化学习的神经架构搜索" - 原始NAS论文
2. **Liu et al. (2019)** - "DARTS：可微架构搜索" - 基于梯度的NAS
3. **Pham et al. (2018)** - "通过参数共享的高效神经架构搜索" - ENAS
4. **Tan & Le (2019)** - "EfficientNet：重新思考CNN的模型缩放" - 复合缩放
5. **Real et al. (2019)** - "图像分类器架构搜索的正则化进化" - AmoebaNet

### 高级主题

- 硬件感知NAS（针对特定设备）
- 多目标NAS（准确度、延迟、能量）
- 可转移NAS（在代理任务上搜索）
- 其他领域的NAS（NLP、语音、图）
- 使用Transformers的NAS

### 推荐资源

- **AutoML.org**：全面的NAS教程和基准
- **NAS-Bench-101/201**：用于可重现NAS研究的基准
- **Microsoft NNI**：开源NAS工具包
- **Google Brain AutoML**：工业NAS系统
