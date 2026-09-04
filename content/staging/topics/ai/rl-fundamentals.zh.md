---
title: 强化学习基础
description: 全面掌握强化学习核心概念与经典算法：Q-Learning、SARSA、DQN和Double DQN
track: ai
section: deep-learning
difficulty: advanced
tags:
  - 强化学习
  - Q-Learning
  - SARSA
  - DQN
  - Double DQN
  - 深度强化学习
status: imported
origin: old/src/content/docs/datascience/rl-fundamentals.zh.md
divergence: 0.142
issues: []
legacy:
  category: DataScience
  subcategory: ReinforcementLearning
  order: 29
  lastUpdated: 2026-01-07
---

强化学习（Reinforcement Learning, RL）是机器学习的三大范式之一，与监督学习和无监督学习并列。它通过智能体与环境的交互来学习最优策略，广泛应用于游戏AI、机器人控制、自动驾驶等领域。本文将系统介绍强化学习的核心概念、经典算法及其Python实现。

---

## 强化学习框架(MDP)

### 马尔可夫决策过程

强化学习问题通常被形式化为**马尔可夫决策过程**（Markov Decision Process, MDP）。MDP由五元组 $(S, A, P, R, \gamma)$ 定义：

| 符号 | 含义 | 说明 |
|------|------|------|
| $S$ | 状态空间 | 环境所有可能状态的集合 |
| $A$ | 动作空间 | 智能体所有可能动作的集合 |
| $P$ | 状态转移概率 | $P(s'|s,a)$ 表示在状态s执行动作a后转移到状态s'的概率 |
| $R$ | 奖励函数 | $R(s,a,s')$ 表示状态转移获得的即时奖励 |
| $\gamma$ | 折扣因子 | $\gamma \in [0,1]$，用于平衡即时奖励和长期收益 |

### 马尔可夫性质

MDP的核心假设是**马尔可夫性质**：下一个状态只依赖于当前状态和动作，与历史状态无关。

$$P(s_{t+1} | s_t, a_t, s_{t-1}, a_{t-1}, ...) = P(s_{t+1} | s_t, a_t)$$

这一性质大大简化了问题的建模和求解。

### 强化学习的基本要素

```python
import numpy as np
from typing import Tuple, List, Dict
from abc import ABC, abstractmethod

class Environment(ABC):
    """强化学习环境的抽象基类"""

    @abstractmethod
    def reset(self) -> int:
        """重置环境，返回初始状态"""
        pass

    @abstractmethod
    def step(self, action: int) -> Tuple[int, float, bool, dict]:
        """
        执行动作，返回下一状态、奖励、是否结束、额外信息

        Args:
            action: 智能体选择的动作

        Returns:
            next_state: 下一个状态
            reward: 即时奖励
            done: 是否到达终止状态
            info: 额外调试信息
        """
        pass

    @property
    @abstractmethod
    def state_space_size(self) -> int:
        """状态空间大小"""
        pass

    @property
    @abstractmethod
    def action_space_size(self) -> int:
        """动作空间大小"""
        pass


class GridWorld(Environment):
    """
    简单的网格世界环境

    智能体从起点出发，目标是到达终点，同时避开障碍物。
    """

    def __init__(self, size: int = 5):
        self.size = size
        self.start = (0, 0)
        self.goal = (size - 1, size - 1)
        self.obstacles = [(1, 1), (2, 2), (3, 1)]
        self.state = self.start

        # 动作定义：0=上, 1=右, 2=下, 3=左
        self.actions = {
            0: (-1, 0),  # 上
            1: (0, 1),   # 右
            2: (1, 0),   # 下
            3: (0, -1)   # 左
        }

    def reset(self) -> int:
        """重置环境到初始状态"""
        self.state = self.start
        return self._state_to_index(self.state)

    def step(self, action: int) -> Tuple[int, float, bool, dict]:
        """执行动作"""
        # 计算下一个位置
        dx, dy = self.actions[action]
        next_row = max(0, min(self.size - 1, self.state[0] + dx))
        next_col = max(0, min(self.size - 1, self.state[1] + dy))
        next_state = (next_row, next_col)

        # 检查障碍物
        if next_state in self.obstacles:
            next_state = self.state  # 撞到障碍物，保持原位
            reward = -1.0
        elif next_state == self.goal:
            reward = 10.0  # 到达目标
        else:
            reward = -0.1  # 每步的小惩罚，鼓励快速到达

        self.state = next_state
        done = (self.state == self.goal)

        return self._state_to_index(self.state), reward, done, {}

    def _state_to_index(self, state: Tuple[int, int]) -> int:
        """将二维状态转换为一维索引"""
        return state[0] * self.size + state[1]

    def _index_to_state(self, index: int) -> Tuple[int, int]:
        """将一维索引转换为二维状态"""
        return (index // self.size, index % self.size)

    @property
    def state_space_size(self) -> int:
        return self.size * self.size

    @property
    def action_space_size(self) -> int:
        return 4

    def render(self):
        """可视化当前环境状态"""
        grid = [['.' for _ in range(self.size)] for _ in range(self.size)]

        for obs in self.obstacles:
            grid[obs[0]][obs[1]] = 'X'

        grid[self.goal[0]][self.goal[1]] = 'G'
        grid[self.state[0]][self.state[1]] = 'A'

        print('\n'.join([' '.join(row) for row in grid]))
        print()


# 使用示例
env = GridWorld(size=5)
state = env.reset()
env.render()

print(f"状态空间大小: {env.state_space_size}")
print(f"动作空间大小: {env.action_space_size}")
```

### 智能体-环境交互循环

强化学习的核心是智能体与环境的交互循环：

```
初始化环境，获得初始状态 s_0
for 每个时间步 t:
    1. 智能体根据当前状态 s_t 选择动作 a_t
    2. 环境执行动作，返回奖励 r_t 和下一状态 s_{t+1}
    3. 智能体根据 (s_t, a_t, r_t, s_{t+1}) 学习
    4. 更新状态 s_t = s_{t+1}
    5. 如果到达终止状态，重置环境
```

---

## 价值函数和策略

### 策略（Policy）

策略 $\pi$ 定义了智能体在每个状态下选择动作的方式。策略可以是：

**确定性策略**：$a = \pi(s)$，给定状态直接输出动作

**随机策略**：$\pi(a|s) = P(a_t = a | s_t = s)$，给定状态输出动作的概率分布

```python
class Policy(ABC):
    """策略的抽象基类"""

    @abstractmethod
    def select_action(self, state: int) -> int:
        """根据状态选择动作"""
        pass


class EpsilonGreedyPolicy(Policy):
    """
    Epsilon-Greedy策略

    以1-epsilon的概率选择最优动作，以epsilon的概率随机探索
    """

    def __init__(self, q_table: np.ndarray, epsilon: float = 0.1):
        self.q_table = q_table
        self.epsilon = epsilon

    def select_action(self, state: int) -> int:
        if np.random.random() < self.epsilon:
            # 探索：随机选择动作
            return np.random.randint(self.q_table.shape[1])
        else:
            # 利用：选择Q值最大的动作
            return np.argmax(self.q_table[state])

    def decay_epsilon(self, decay_rate: float = 0.995, min_epsilon: float = 0.01):
        """衰减epsilon，逐步减少探索"""
        self.epsilon = max(min_epsilon, self.epsilon * decay_rate)


class SoftmaxPolicy(Policy):
    """
    Softmax（Boltzmann）策略

    根据Q值的softmax分布选择动作，温度参数控制探索程度
    """

    def __init__(self, q_table: np.ndarray, temperature: float = 1.0):
        self.q_table = q_table
        self.temperature = temperature

    def select_action(self, state: int) -> int:
        q_values = self.q_table[state]
        # 数值稳定的softmax计算
        q_values = q_values - np.max(q_values)
        exp_q = np.exp(q_values / self.temperature)
        probs = exp_q / np.sum(exp_q)
        return np.random.choice(len(probs), p=probs)
```

### 状态价值函数（State Value Function）

状态价值函数 $V^\pi(s)$ 表示从状态 $s$ 开始，遵循策略 $\pi$ 所能获得的期望累积奖励：

$$V^\pi(s) = \mathbb{E}_\pi \left[ \sum_{t=0}^{\infty} \gamma^t R_{t+1} \bigg| S_0 = s \right]$$

### 动作价值函数（Action Value Function）

动作价值函数 $Q^\pi(s, a)$ 表示在状态 $s$ 执行动作 $a$ 后，遵循策略 $\pi$ 所能获得的期望累积奖励：

$$Q^\pi(s, a) = \mathbb{E}_\pi \left[ \sum_{t=0}^{\infty} \gamma^t R_{t+1} \bigg| S_0 = s, A_0 = a \right]$$

### 最优价值函数

最优状态价值函数：$V^*(s) = \max_\pi V^\pi(s)$

最优动作价值函数：$Q^*(s, a) = \max_\pi Q^\pi(s, a)$

```python
class ValueFunction:
    """价值函数的实现"""

    def __init__(self, state_size: int, action_size: int):
        # Q表：存储每个状态-动作对的价值
        self.q_table = np.zeros((state_size, action_size))
        # V表：存储每个状态的价值
        self.v_table = np.zeros(state_size)

    def get_q_value(self, state: int, action: int) -> float:
        """获取Q值"""
        return self.q_table[state, action]

    def get_v_value(self, state: int) -> float:
        """获取V值"""
        return self.v_table[state]

    def update_q_value(self, state: int, action: int, value: float):
        """更新Q值"""
        self.q_table[state, action] = value

    def get_best_action(self, state: int) -> int:
        """返回最优动作"""
        return np.argmax(self.q_table[state])

    def get_max_q_value(self, state: int) -> float:
        """返回状态的最大Q值"""
        return np.max(self.q_table[state])
```

---

## 贝尔曼方程

### 贝尔曼期望方程

贝尔曼方程描述了价值函数的递归关系，是强化学习的理论基础。

**状态价值函数的贝尔曼期望方程：**

$$V^\pi(s) = \sum_a \pi(a|s) \sum_{s'} P(s'|s,a) \left[ R(s,a,s') + \gamma V^\pi(s') \right]$$

**动作价值函数的贝尔曼期望方程：**

$$Q^\pi(s,a) = \sum_{s'} P(s'|s,a) \left[ R(s,a,s') + \gamma \sum_{a'} \pi(a'|s') Q^\pi(s',a') \right]$$

### 贝尔曼最优方程

最优价值函数满足贝尔曼最优方程：

**状态价值函数的贝尔曼最优方程：**

$$V^*(s) = \max_a \sum_{s'} P(s'|s,a) \left[ R(s,a,s') + \gamma V^*(s') \right]$$

**动作价值函数的贝尔曼最优方程：**

$$Q^*(s,a) = \sum_{s'} P(s'|s,a) \left[ R(s,a,s') + \gamma \max_{a'} Q^*(s',a') \right]$$

### 策略迭代和价值迭代

```python
class PolicyIteration:
    """策略迭代算法"""

    def __init__(self, env: Environment, gamma: float = 0.99, theta: float = 1e-6):
        self.env = env
        self.gamma = gamma
        self.theta = theta  # 收敛阈值

        self.n_states = env.state_space_size
        self.n_actions = env.action_space_size

        # 初始化价值函数和策略
        self.v = np.zeros(self.n_states)
        self.policy = np.zeros(self.n_states, dtype=int)

    def policy_assessment(self, max_iterations: int = 1000):
        """策略评估：计算当前策略的价值函数"""
        for _ in range(max_iterations):
            delta = 0
            for s in range(self.n_states):
                v_old = self.v[s]
                a = self.policy[s]

                # 模拟环境动态（这里简化处理）
                self.env.state = self.env._index_to_state(s)
                next_s, r, done, _ = self.env.step(a)

                if done:
                    self.v[s] = r
                else:
                    self.v[s] = r + self.gamma * self.v[next_s]

                delta = max(delta, abs(v_old - self.v[s]))

            if delta < self.theta:
                break

    def policy_improvement(self) -> bool:
        """策略改进：根据当前价值函数更新策略"""
        policy_stable = True

        for s in range(self.n_states):
            old_action = self.policy[s]

            # 计算所有动作的Q值
            q_values = np.zeros(self.n_actions)
            for a in range(self.n_actions):
                self.env.state = self.env._index_to_state(s)
                next_s, r, done, _ = self.env.step(a)

                if done:
                    q_values[a] = r
                else:
                    q_values[a] = r + self.gamma * self.v[next_s]

            # 选择最优动作
            self.policy[s] = np.argmax(q_values)

            if old_action != self.policy[s]:
                policy_stable = False

        return policy_stable

    def run(self, max_iterations: int = 100):
        """运行策略迭代"""
        for i in range(max_iterations):
            # 策略评估
            self.policy_assessment()

            # 策略改进
            if self.policy_improvement():
                print(f"策略在第 {i+1} 次迭代后收敛")
                break

        return self.policy, self.v


class ValueIteration:
    """价值迭代算法"""

    def __init__(self, env: Environment, gamma: float = 0.99, theta: float = 1e-6):
        self.env = env
        self.gamma = gamma
        self.theta = theta

        self.n_states = env.state_space_size
        self.n_actions = env.action_space_size

        self.v = np.zeros(self.n_states)

    def run(self, max_iterations: int = 1000):
        """运行价值迭代"""
        for iteration in range(max_iterations):
            delta = 0

            for s in range(self.n_states):
                v_old = self.v[s]

                # 计算所有动作的Q值，选择最大值
                q_values = np.zeros(self.n_actions)
                for a in range(self.n_actions):
                    self.env.state = self.env._index_to_state(s)
                    next_s, r, done, _ = self.env.step(a)

                    if done:
                        q_values[a] = r
                    else:
                        q_values[a] = r + self.gamma * self.v[next_s]

                self.v[s] = np.max(q_values)
                delta = max(delta, abs(v_old - self.v[s]))

            if delta < self.theta:
                print(f"价值迭代在第 {iteration+1} 次迭代后收敛")
                break

        # 从最优价值函数提取最优策略
        policy = np.zeros(self.n_states, dtype=int)
        for s in range(self.n_states):
            q_values = np.zeros(self.n_actions)
            for a in range(self.n_actions):
                self.env.state = self.env._index_to_state(s)
                next_s, r, done, _ = self.env.step(a)

                if done:
                    q_values[a] = r
                else:
                    q_values[a] = r + self.gamma * self.v[next_s]

            policy[s] = np.argmax(q_values)

        return policy, self.v
```

---

## Q-Learning算法

### 算法原理

Q-Learning是一种**离线策略（Off-Policy）**的时序差分（TD）学习算法。它直接学习最优动作价值函数 $Q^*$，而不依赖于当前遵循的策略。

**Q-Learning更新公式：**

$$Q(s_t, a_t) \leftarrow Q(s_t, a_t) + \alpha \left[ r_{t+1} + \gamma \max_{a'} Q(s_{t+1}, a') - Q(s_t, a_t) \right]$$

其中：
- $\alpha$：学习率，控制更新步长
- $\gamma$：折扣因子
- $r_{t+1} + \gamma \max_{a'} Q(s_{t+1}, a')$：TD目标
- $r_{t+1} + \gamma \max_{a'} Q(s_{t+1}, a') - Q(s_t, a_t)$：TD误差

### 完整实现

```python
class QLearning:
    """
    Q-Learning算法实现

    核心特点：
    1. 离线策略：使用epsilon-greedy探索，但更新时使用max Q值
    2. 无需环境模型：只需要与环境交互获得经验
    3. 保证收敛到最优Q函数（在一定条件下）
    """

    def __init__(
        self,
        env: Environment,
        learning_rate: float = 0.1,
        gamma: float = 0.99,
        epsilon: float = 1.0,
        epsilon_decay: float = 0.995,
        epsilon_min: float = 0.01
    ):
        self.env = env
        self.lr = learning_rate
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min

        # 初始化Q表
        self.q_table = np.zeros((env.state_space_size, env.action_space_size))

        # 训练统计
        self.episode_rewards = []
        self.episode_lengths = []

    def select_action(self, state: int) -> int:
        """Epsilon-Greedy动作选择"""
        if np.random.random() < self.epsilon:
            return np.random.randint(self.env.action_space_size)
        return np.argmax(self.q_table[state])

    def update(self, state: int, action: int, reward: float,
               next_state: int, done: bool):
        """Q值更新"""
        # 计算TD目标
        if done:
            td_target = reward
        else:
            td_target = reward + self.gamma * np.max(self.q_table[next_state])

        # 计算TD误差
        td_error = td_target - self.q_table[state, action]

        # 更新Q值
        self.q_table[state, action] += self.lr * td_error

        return td_error

    def decay_epsilon(self):
        """衰减探索率"""
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)

    def train(self, num_episodes: int = 1000, max_steps: int = 100,
              verbose: bool = True):
        """训练Q-Learning智能体"""

        for episode in range(num_episodes):
            state = self.env.reset()
            total_reward = 0
            steps = 0

            for step in range(max_steps):
                # 选择动作
                action = self.select_action(state)

                # 执行动作
                next_state, reward, done, _ = self.env.step(action)

                # 更新Q值
                self.update(state, action, reward, next_state, done)

                total_reward += reward
                steps += 1
                state = next_state

                if done:
                    break

            # 衰减epsilon
            self.decay_epsilon()

            # 记录统计信息
            self.episode_rewards.append(total_reward)
            self.episode_lengths.append(steps)

            if verbose and (episode + 1) % 100 == 0:
                avg_reward = np.mean(self.episode_rewards[-100:])
                print(f"Episode {episode + 1}, "
                      f"Avg Reward: {avg_reward:.2f}, "
                      f"Epsilon: {self.epsilon:.3f}")

        return self.q_table

    def get_optimal_policy(self) -> np.ndarray:
        """从Q表提取最优策略"""
        return np.argmax(self.q_table, axis=1)

    def assess(self, num_episodes: int = 10) -> float:
        """评估当前策略"""
        total_rewards = []

        for _ in range(num_episodes):
            state = self.env.reset()
            episode_reward = 0

            while True:
                action = np.argmax(self.q_table[state])  # 贪婪策略
                next_state, reward, done, _ = self.env.step(action)
                episode_reward += reward
                state = next_state

                if done:
                    break

            total_rewards.append(episode_reward)

        return np.mean(total_rewards)


# 训练示例
def train_qlearning():
    """Q-Learning训练示例"""
    env = GridWorld(size=5)

    agent = QLearning(
        env,
        learning_rate=0.1,
        gamma=0.99,
        epsilon=1.0,
        epsilon_decay=0.995,
        epsilon_min=0.01
    )

    # 训练
    q_table = agent.train(num_episodes=1000, max_steps=100)

    # 评估
    avg_reward = agent.assess(num_episodes=10)
    print(f"\n评估结果 - 平均奖励: {avg_reward:.2f}")

    # 可视化Q表
    print("\n最优策略（0=上, 1=右, 2=下, 3=左）:")
    policy = agent.get_optimal_policy()
    action_symbols = ['Up', 'Rt', 'Dn', 'Lt']
    for i in range(env.size):
        row = [action_symbols[policy[i * env.size + j]] for j in range(env.size)]
        print(' '.join(row))

    return agent

# 运行训练
# agent = train_qlearning()
```

### Q-Learning的特点

| 特点 | 说明 |
|------|------|
| 离线策略 | 行为策略（探索）和目标策略（更新）不同 |
| 无模型 | 不需要环境的转移概率和奖励函数 |
| 表格方法 | 适用于离散、小规模状态空间 |
| 收敛性 | 在一定条件下保证收敛到最优Q函数 |

---

## SARSA算法

### 算法原理

SARSA是一种**在线策略（On-Policy）**的时序差分学习算法。它使用实际采取的动作来更新Q值，名字来源于更新所需的五元组：$(S_t, A_t, R_{t+1}, S_{t+1}, A_{t+1})$。

**SARSA更新公式：**

$$Q(s_t, a_t) \leftarrow Q(s_t, a_t) + \alpha \left[ r_{t+1} + \gamma Q(s_{t+1}, a_{t+1}) - Q(s_t, a_t) \right]$$

### Q-Learning vs SARSA

| 方面 | Q-Learning | SARSA |
|------|-----------|-------|
| 策略类型 | 离线策略（Off-Policy） | 在线策略（On-Policy） |
| 更新目标 | $\max_{a'} Q(s', a')$ | $Q(s', a')$，a'是实际采取的动作 |
| 探索影响 | 更新不受探索影响 | 更新受探索策略影响 |
| 收敛策略 | 最优策略 | 探索策略下的最优策略 |
| 安全性 | 可能学习危险策略 | 更保守，考虑探索风险 |

### 完整实现

```python
class SARSA:
    """
    SARSA算法实现

    核心特点：
    1. 在线策略：使用相同的策略进行探索和更新
    2. 更保守：考虑了探索带来的风险
    3. 适合安全关键场景
    """

    def __init__(
        self,
        env: Environment,
        learning_rate: float = 0.1,
        gamma: float = 0.99,
        epsilon: float = 1.0,
        epsilon_decay: float = 0.995,
        epsilon_min: float = 0.01
    ):
        self.env = env
        self.lr = learning_rate
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min

        self.q_table = np.zeros((env.state_space_size, env.action_space_size))
        self.episode_rewards = []

    def select_action(self, state: int) -> int:
        """Epsilon-Greedy动作选择"""
        if np.random.random() < self.epsilon:
            return np.random.randint(self.env.action_space_size)
        return np.argmax(self.q_table[state])

    def update(self, state: int, action: int, reward: float,
               next_state: int, next_action: int, done: bool):
        """SARSA更新：使用实际采取的下一个动作"""
        if done:
            td_target = reward
        else:
            # 关键区别：使用next_action而不是max
            td_target = reward + self.gamma * self.q_table[next_state, next_action]

        td_error = td_target - self.q_table[state, action]
        self.q_table[state, action] += self.lr * td_error

        return td_error

    def train(self, num_episodes: int = 1000, max_steps: int = 100,
              verbose: bool = True):
        """训练SARSA智能体"""

        for episode in range(num_episodes):
            state = self.env.reset()
            action = self.select_action(state)  # 选择初始动作
            total_reward = 0

            for step in range(max_steps):
                # 执行动作
                next_state, reward, done, _ = self.env.step(action)

                # 选择下一个动作（SARSA的关键：先选择再更新）
                next_action = self.select_action(next_state)

                # 更新Q值
                self.update(state, action, reward, next_state, next_action, done)

                total_reward += reward
                state = next_state
                action = next_action  # 关键：使用选择的动作

                if done:
                    break

            self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
            self.episode_rewards.append(total_reward)

            if verbose and (episode + 1) % 100 == 0:
                avg_reward = np.mean(self.episode_rewards[-100:])
                print(f"Episode {episode + 1}, Avg Reward: {avg_reward:.2f}")

        return self.q_table


class ExpectedSARSA:
    """
    Expected SARSA算法

    使用下一状态所有动作Q值的期望，而不是单个动作
    结合了Q-Learning和SARSA的优点
    """

    def __init__(
        self,
        env: Environment,
        learning_rate: float = 0.1,
        gamma: float = 0.99,
        epsilon: float = 1.0,
        epsilon_decay: float = 0.995,
        epsilon_min: float = 0.01
    ):
        self.env = env
        self.lr = learning_rate
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min

        self.q_table = np.zeros((env.state_space_size, env.action_space_size))

    def select_action(self, state: int) -> int:
        if np.random.random() < self.epsilon:
            return np.random.randint(self.env.action_space_size)
        return np.argmax(self.q_table[state])

    def get_expected_q_value(self, state: int) -> float:
        """计算期望Q值：考虑epsilon-greedy策略的概率分布"""
        n_actions = self.env.action_space_size

        # epsilon-greedy策略下各动作的概率
        action_probs = np.ones(n_actions) * (self.epsilon / n_actions)
        best_action = np.argmax(self.q_table[state])
        action_probs[best_action] += (1 - self.epsilon)

        # 期望Q值
        expected_q = np.sum(action_probs * self.q_table[state])
        return expected_q

    def update(self, state: int, action: int, reward: float,
               next_state: int, done: bool):
        """Expected SARSA更新"""
        if done:
            td_target = reward
        else:
            # 使用期望Q值
            td_target = reward + self.gamma * self.get_expected_q_value(next_state)

        td_error = td_target - self.q_table[state, action]
        self.q_table[state, action] += self.lr * td_error

        return td_error

    def train(self, num_episodes: int = 1000, max_steps: int = 100):
        """训练Expected SARSA智能体"""
        episode_rewards = []

        for episode in range(num_episodes):
            state = self.env.reset()
            total_reward = 0

            for _ in range(max_steps):
                action = self.select_action(state)
                next_state, reward, done, _ = self.env.step(action)

                self.update(state, action, reward, next_state, done)

                total_reward += reward
                state = next_state

                if done:
                    break

            self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
            episode_rewards.append(total_reward)

        return self.q_table, episode_rewards
```

### 悬崖行走问题：Q-Learning vs SARSA

悬崖行走是一个经典的强化学习示例，很好地展示了Q-Learning和SARSA的区别：

```python
class CliffWalkingEnv(Environment):
    """
    悬崖行走环境

    +---+---+---+---+---+---+---+---+---+---+---+---+
    |   |   |   |   |   |   |   |   |   |   |   |   |
    +---+---+---+---+---+---+---+---+---+---+---+---+
    |   |   |   |   |   |   |   |   |   |   |   |   |
    +---+---+---+---+---+---+---+---+---+---+---+---+
    |   |   |   |   |   |   |   |   |   |   |   |   |
    +---+---+---+---+---+---+---+---+---+---+---+---+
    | S | C | C | C | C | C | C | C | C | C | C | G |
    +---+---+---+---+---+---+---+---+---+---+---+---+

    S: 起点, G: 目标, C: 悬崖（掉落则回到起点，奖励-100）
    """

    def __init__(self, width: int = 12, height: int = 4):
        self.width = width
        self.height = height
        self.start = (height - 1, 0)
        self.goal = (height - 1, width - 1)
        self.cliff = [(height - 1, i) for i in range(1, width - 1)]
        self.state = self.start

        self.actions = {0: (-1, 0), 1: (0, 1), 2: (1, 0), 3: (0, -1)}

    def reset(self) -> int:
        self.state = self.start
        return self._state_to_index(self.state)

    def step(self, action: int) -> Tuple[int, float, bool, dict]:
        dx, dy = self.actions[action]
        next_row = max(0, min(self.height - 1, self.state[0] + dx))
        next_col = max(0, min(self.width - 1, self.state[1] + dy))
        next_state = (next_row, next_col)

        # 检查是否掉入悬崖
        if next_state in self.cliff:
            self.state = self.start
            return self._state_to_index(self.state), -100, False, {}

        self.state = next_state

        if self.state == self.goal:
            return self._state_to_index(self.state), 0, True, {}

        return self._state_to_index(self.state), -1, False, {}

    def _state_to_index(self, state: Tuple[int, int]) -> int:
        return state[0] * self.width + state[1]

    @property
    def state_space_size(self) -> int:
        return self.width * self.height

    @property
    def action_space_size(self) -> int:
        return 4


def compare_qlearning_sarsa():
    """比较Q-Learning和SARSA在悬崖行走问题上的表现"""
    env_q = CliffWalkingEnv()
    env_s = CliffWalkingEnv()

    # Q-Learning：学习最优路径（靠近悬崖边缘）
    q_agent = QLearning(env_q, learning_rate=0.5, epsilon=0.1,
                        epsilon_decay=1.0)  # 固定epsilon

    # SARSA：学习安全路径（远离悬崖）
    sarsa_agent = SARSA(env_s, learning_rate=0.5, epsilon=0.1,
                        epsilon_decay=1.0)

    q_agent.train(num_episodes=500, verbose=False)
    sarsa_agent.train(num_episodes=500, verbose=False)

    print("Q-Learning学习的路径（倾向于最优但危险的路径）")
    print("SARSA学习的路径（倾向于安全但较长的路径）")

    return q_agent, sarsa_agent
```

---

## DQN深度Q网络

### 从表格方法到函数逼近

当状态空间很大或连续时，表格方法不再适用。DQN（Deep Q-Network）使用神经网络来逼近Q函数：

$$Q(s, a; \theta) \approx Q^*(s, a)$$

其中 $\theta$ 是神经网络的参数。

### DQN的关键创新

1. **经验回放（Experience Replay）**：打破样本相关性
2. **目标网络（Target Network）**：稳定训练过程
3. **使用CNN处理图像输入**：直接从像素学习

### 完整实现

```python
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from collections import deque
import random

class QNetwork(nn.Module):
    """Q网络：将状态映射到各动作的Q值"""

    def __init__(self, state_size: int, action_size: int, hidden_sizes: List[int] = [64, 64]):
        super().__init__()

        layers = []
        prev_size = state_size

        for hidden_size in hidden_sizes:
            layers.append(nn.Linear(prev_size, hidden_size))
            layers.append(nn.ReLU())
            prev_size = hidden_size

        layers.append(nn.Linear(prev_size, action_size))

        self.network = nn.Sequential(*layers)

    def forward(self, state: torch.Tensor) -> torch.Tensor:
        return self.network(state)


class ConvQNetwork(nn.Module):
    """卷积Q网络：用于处理图像输入（如Atari游戏）"""

    def __init__(self, input_channels: int, action_size: int):
        super().__init__()

        # 卷积层（类似Nature DQN）
        self.conv = nn.Sequential(
            nn.Conv2d(input_channels, 32, kernel_size=8, stride=4),
            nn.ReLU(),
            nn.Conv2d(32, 64, kernel_size=4, stride=2),
            nn.ReLU(),
            nn.Conv2d(64, 64, kernel_size=3, stride=1),
            nn.ReLU()
        )

        # 计算卷积输出尺寸（假设输入84x84）
        conv_out_size = self._get_conv_output_size(input_channels)

        # 全连接层
        self.fc = nn.Sequential(
            nn.Linear(conv_out_size, 512),
            nn.ReLU(),
            nn.Linear(512, action_size)
        )

    def _get_conv_output_size(self, input_channels: int) -> int:
        dummy_input = torch.zeros(1, input_channels, 84, 84)
        output = self.conv(dummy_input)
        return int(np.prod(output.shape[1:]))

    def forward(self, state: torch.Tensor) -> torch.Tensor:
        conv_out = self.conv(state)
        conv_out = conv_out.view(conv_out.size(0), -1)
        return self.fc(conv_out)


class ReplayBuffer:
    """经验回放缓冲区"""

    def __init__(self, capacity: int = 100000):
        self.buffer = deque(maxlen=capacity)

    def push(self, state, action, reward, next_state, done):
        """存储经验"""
        self.buffer.append((state, action, reward, next_state, done))

    def sample(self, batch_size: int) -> Tuple:
        """随机采样一批经验"""
        experiences = random.sample(self.buffer, batch_size)

        states = torch.FloatTensor([e[0] for e in experiences])
        actions = torch.LongTensor([e[1] for e in experiences])
        rewards = torch.FloatTensor([e[2] for e in experiences])
        next_states = torch.FloatTensor([e[3] for e in experiences])
        dones = torch.FloatTensor([e[4] for e in experiences])

        return states, actions, rewards, next_states, dones

    def __len__(self) -> int:
        return len(self.buffer)


class DQN:
    """
    Deep Q-Network实现

    关键组件：
    1. Q网络：逼近Q函数
    2. 目标网络：提供稳定的TD目标
    3. 经验回放：打破样本相关性
    """

    def __init__(
        self,
        state_size: int,
        action_size: int,
        learning_rate: float = 1e-3,
        gamma: float = 0.99,
        epsilon: float = 1.0,
        epsilon_decay: float = 0.995,
        epsilon_min: float = 0.01,
        buffer_size: int = 100000,
        batch_size: int = 64,
        target_update_freq: int = 100,
        device: str = 'cuda' if torch.cuda.is_available() else 'cpu'
    ):
        self.state_size = state_size
        self.action_size = action_size
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min
        self.batch_size = batch_size
        self.target_update_freq = target_update_freq
        self.device = device

        # Q网络和目标网络
        self.q_network = QNetwork(state_size, action_size).to(device)
        self.target_network = QNetwork(state_size, action_size).to(device)
        self.target_network.load_state_dict(self.q_network.state_dict())
        self.target_network.requires_grad_(False)

        # 优化器
        self.optimizer = optim.Adam(self.q_network.parameters(), lr=learning_rate)

        # 经验回放
        self.replay_buffer = ReplayBuffer(buffer_size)

        # 训练计数器
        self.train_step = 0

    def select_action(self, state: np.ndarray) -> int:
        """Epsilon-Greedy动作选择"""
        if np.random.random() < self.epsilon:
            return np.random.randint(self.action_size)

        with torch.no_grad():
            state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
            q_values = self.q_network(state_tensor)
            return q_values.argmax(dim=1).item()

    def store_experience(self, state, action, reward, next_state, done):
        """存储经验到回放缓冲区"""
        self.replay_buffer.push(state, action, reward, next_state, done)

    def update(self) -> float:
        """从经验回放中学习"""
        if len(self.replay_buffer) < self.batch_size:
            return 0.0

        # 采样一批经验
        states, actions, rewards, next_states, dones = self.replay_buffer.sample(
            self.batch_size
        )
        states = states.to(self.device)
        actions = actions.to(self.device)
        rewards = rewards.to(self.device)
        next_states = next_states.to(self.device)
        dones = dones.to(self.device)

        # 计算当前Q值
        current_q_values = self.q_network(states).gather(1, actions.unsqueeze(1))

        # 计算目标Q值（使用目标网络）
        with torch.no_grad():
            next_q_values = self.target_network(next_states).max(1)[0]
            target_q_values = rewards + self.gamma * next_q_values * (1 - dones)

        # 计算损失
        loss = F.mse_loss(current_q_values.squeeze(), target_q_values)

        # 更新网络
        self.optimizer.zero_grad()
        loss.backward()
        # 梯度裁剪
        torch.nn.utils.clip_grad_norm_(self.q_network.parameters(), max_norm=10)
        self.optimizer.step()

        # 更新目标网络
        self.train_step += 1
        if self.train_step % self.target_update_freq == 0:
            self.target_network.load_state_dict(self.q_network.state_dict())

        return loss.item()

    def decay_epsilon(self):
        """衰减探索率"""
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)

    def train(self, env, num_episodes: int = 1000, max_steps: int = 500,
              verbose: bool = True):
        """训练DQN智能体"""
        episode_rewards = []
        losses = []

        for episode in range(num_episodes):
            state = env.reset()
            # 处理gym环境返回元组的情况
            if isinstance(state, tuple):
                state = state[0]
            state = np.array(state, dtype=np.float32)

            total_reward = 0
            episode_loss = 0

            for step in range(max_steps):
                # 选择动作
                action = self.select_action(state)

                # 执行动作
                result = env.step(action)
                if len(result) == 5:  # 新版gym
                    next_state, reward, terminated, truncated, _ = result
                    done = terminated or truncated
                else:  # 旧版gym
                    next_state, reward, done, _ = result

                if isinstance(next_state, tuple):
                    next_state = next_state[0]
                next_state = np.array(next_state, dtype=np.float32)

                # 存储经验
                self.store_experience(state, action, reward, next_state, done)

                # 学习
                loss = self.update()
                episode_loss += loss

                total_reward += reward
                state = next_state

                if done:
                    break

            # 衰减epsilon
            self.decay_epsilon()

            episode_rewards.append(total_reward)
            losses.append(episode_loss / (step + 1))

            if verbose and (episode + 1) % 50 == 0:
                avg_reward = np.mean(episode_rewards[-50:])
                avg_loss = np.mean(losses[-50:])
                print(f"Episode {episode + 1}, "
                      f"Avg Reward: {avg_reward:.2f}, "
                      f"Avg Loss: {avg_loss:.4f}, "
                      f"Epsilon: {self.epsilon:.3f}")

        return episode_rewards, losses

    def save(self, path: str):
        """保存模型"""
        torch.save({
            'q_network_state_dict': self.q_network.state_dict(),
            'target_network_state_dict': self.target_network.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'epsilon': self.epsilon,
            'train_step': self.train_step
        }, path)

    def load(self, path: str):
        """加载模型"""
        checkpoint = torch.load(path, map_location=self.device)
        self.q_network.load_state_dict(checkpoint['q_network_state_dict'])
        self.target_network.load_state_dict(checkpoint['target_network_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.epsilon = checkpoint['epsilon']
        self.train_step = checkpoint['train_step']


# 使用示例（需要安装gym）
def train_dqn_cartpole():
    """在CartPole环境上训练DQN"""
    try:
        import gymnasium as gym
    except ImportError:
        import gym

    env = gym.make('CartPole-v1')

    agent = DQN(
        state_size=4,
        action_size=2,
        learning_rate=1e-3,
        gamma=0.99,
        epsilon=1.0,
        epsilon_decay=0.995,
        epsilon_min=0.01,
        batch_size=64,
        target_update_freq=100
    )

    rewards, losses = agent.train(env, num_episodes=500, max_steps=500)

    env.close()
    return agent, rewards, losses

# 运行训练
# agent, rewards, losses = train_dqn_cartpole()
```

---

## Double DQN

### 过估计问题

标准DQN存在**过估计（Overestimation）**问题：由于使用 $\max$ 操作选择和评估动作，会系统性地高估Q值。

**标准DQN的目标：**

$$y = r + \gamma \max_{a'} Q(s', a'; \theta^-)$$

这里使用同一个网络（目标网络）来选择动作和评估价值。

### Double DQN解决方案

Double DQN将动作选择和价值评估分离：
- 使用**在线网络**选择最优动作
- 使用**目标网络**评估该动作的价值

**Double DQN的目标：**

$$y = r + \gamma Q(s', \arg\max_{a'} Q(s', a'; \theta); \theta^-)$$

### 实现

```python
class DoubleDQN(DQN):
    """
    Double DQN实现

    核心改进：解耦动作选择和价值评估，减少过估计
    """

    def update(self) -> float:
        """Double DQN更新"""
        if len(self.replay_buffer) < self.batch_size:
            return 0.0

        states, actions, rewards, next_states, dones = self.replay_buffer.sample(
            self.batch_size
        )
        states = states.to(self.device)
        actions = actions.to(self.device)
        rewards = rewards.to(self.device)
        next_states = next_states.to(self.device)
        dones = dones.to(self.device)

        # 计算当前Q值
        current_q_values = self.q_network(states).gather(1, actions.unsqueeze(1))

        # Double DQN的关键改变
        with torch.no_grad():
            # 使用在线网络选择动作
            next_actions = self.q_network(next_states).argmax(1, keepdim=True)

            # 使用目标网络评估选中动作的价值
            next_q_values = self.target_network(next_states).gather(1, next_actions).squeeze()

            # 计算目标Q值
            target_q_values = rewards + self.gamma * next_q_values * (1 - dones)

        # 计算损失
        loss = F.mse_loss(current_q_values.squeeze(), target_q_values)

        # 更新网络
        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.q_network.parameters(), max_norm=10)
        self.optimizer.step()

        # 更新目标网络
        self.train_step += 1
        if self.train_step % self.target_update_freq == 0:
            self.target_network.load_state_dict(self.q_network.state_dict())

        return loss.item()


class DuelingDQN(nn.Module):
    """
    Dueling DQN网络架构

    将Q值分解为状态价值V(s)和优势函数A(s,a)：
    Q(s,a) = V(s) + A(s,a) - mean(A(s,a'))

    优点：更好地学习状态价值，即使某些动作与结果无关
    """

    def __init__(self, state_size: int, action_size: int, hidden_size: int = 128):
        super().__init__()

        # 共享特征层
        self.feature = nn.Sequential(
            nn.Linear(state_size, hidden_size),
            nn.ReLU()
        )

        # 价值流（Value Stream）
        self.value_stream = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, 1)
        )

        # 优势流（Advantage Stream）
        self.advantage_stream = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, action_size)
        )

    def forward(self, state: torch.Tensor) -> torch.Tensor:
        features = self.feature(state)

        value = self.value_stream(features)
        advantage = self.advantage_stream(features)

        # Q = V + A - mean(A)
        q_values = value + advantage - advantage.mean(dim=1, keepdim=True)

        return q_values


class DuelingDoubleDQN:
    """结合Dueling架构和Double DQN"""

    def __init__(
        self,
        state_size: int,
        action_size: int,
        learning_rate: float = 1e-3,
        gamma: float = 0.99,
        epsilon: float = 1.0,
        epsilon_decay: float = 0.995,
        epsilon_min: float = 0.01,
        buffer_size: int = 100000,
        batch_size: int = 64,
        target_update_freq: int = 100,
        device: str = 'cuda' if torch.cuda.is_available() else 'cpu'
    ):
        self.state_size = state_size
        self.action_size = action_size
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min
        self.batch_size = batch_size
        self.target_update_freq = target_update_freq
        self.device = device

        # 使用Dueling网络架构
        self.q_network = DuelingDQN(state_size, action_size).to(device)
        self.target_network = DuelingDQN(state_size, action_size).to(device)
        self.target_network.load_state_dict(self.q_network.state_dict())
        self.target_network.requires_grad_(False)

        self.optimizer = optim.Adam(self.q_network.parameters(), lr=learning_rate)
        self.replay_buffer = ReplayBuffer(buffer_size)
        self.train_step = 0

    def select_action(self, state: np.ndarray) -> int:
        if np.random.random() < self.epsilon:
            return np.random.randint(self.action_size)

        with torch.no_grad():
            state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
            q_values = self.q_network(state_tensor)
            return q_values.argmax(dim=1).item()

    def store_experience(self, state, action, reward, next_state, done):
        self.replay_buffer.push(state, action, reward, next_state, done)

    def update(self) -> float:
        """Double DQN更新 + Dueling架构"""
        if len(self.replay_buffer) < self.batch_size:
            return 0.0

        states, actions, rewards, next_states, dones = self.replay_buffer.sample(
            self.batch_size
        )
        states = states.to(self.device)
        actions = actions.to(self.device)
        rewards = rewards.to(self.device)
        next_states = next_states.to(self.device)
        dones = dones.to(self.device)

        current_q_values = self.q_network(states).gather(1, actions.unsqueeze(1))

        with torch.no_grad():
            # Double DQN：在线网络选择动作，目标网络评估
            next_actions = self.q_network(next_states).argmax(1, keepdim=True)
            next_q_values = self.target_network(next_states).gather(1, next_actions).squeeze()
            target_q_values = rewards + self.gamma * next_q_values * (1 - dones)

        loss = F.smooth_l1_loss(current_q_values.squeeze(), target_q_values)  # Huber损失

        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.q_network.parameters(), max_norm=10)
        self.optimizer.step()

        self.train_step += 1
        if self.train_step % self.target_update_freq == 0:
            self.target_network.load_state_dict(self.q_network.state_dict())

        return loss.item()

    def decay_epsilon(self):
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
```

---

## 经验回放

### 基本经验回放

经验回放是DQN的核心创新之一，通过存储和重用历史经验来提高样本效率和稳定性。

**优点：**
1. 打破样本之间的时间相关性
2. 提高数据利用效率
3. 支持批量更新
4. 平滑训练过程

### 优先经验回放（Prioritized Experience Replay）

优先经验回放根据TD误差的大小来采样经验，优先学习"意外"的经验。

```python
import numpy as np
from typing import Tuple, List

class SumTree:
    """
    Sum Tree数据结构

    用于高效地按优先级采样，支持O(log n)的更新和采样
    """

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.tree = np.zeros(2 * capacity - 1)
        self.data = np.zeros(capacity, dtype=object)
        self.data_pointer = 0
        self.n_entries = 0

    def _propagate(self, idx: int, change: float):
        """向上传播优先级变化"""
        parent = (idx - 1) // 2
        self.tree[parent] += change
        if parent != 0:
            self._propagate(parent, change)

    def _retrieve(self, idx: int, s: float) -> int:
        """根据优先级采样"""
        left = 2 * idx + 1
        right = left + 1

        if left >= len(self.tree):
            return idx

        if s <= self.tree[left]:
            return self._retrieve(left, s)
        else:
            return self._retrieve(right, s - self.tree[left])

    def total(self) -> float:
        """返回总优先级"""
        return self.tree[0]

    def add(self, priority: float, data):
        """添加新数据"""
        idx = self.data_pointer + self.capacity - 1

        self.data[self.data_pointer] = data
        self.update(idx, priority)

        self.data_pointer += 1
        if self.data_pointer >= self.capacity:
            self.data_pointer = 0

        if self.n_entries < self.capacity:
            self.n_entries += 1

    def update(self, idx: int, priority: float):
        """更新优先级"""
        change = priority - self.tree[idx]
        self.tree[idx] = priority
        self._propagate(idx, change)

    def get(self, s: float) -> Tuple[int, float, object]:
        """根据优先级获取数据"""
        idx = self._retrieve(0, s)
        data_idx = idx - self.capacity + 1
        return idx, self.tree[idx], self.data[data_idx]


class PrioritizedReplayBuffer:
    """
    优先经验回放缓冲区

    根据TD误差大小分配采样优先级
    """

    def __init__(
        self,
        capacity: int = 100000,
        alpha: float = 0.6,  # 优先级指数
        beta: float = 0.4,   # 重要性采样指数
        beta_increment: float = 0.001,  # beta增长率
        epsilon: float = 1e-6  # 避免零优先级
    ):
        self.tree = SumTree(capacity)
        self.capacity = capacity
        self.alpha = alpha
        self.beta = beta
        self.beta_increment = beta_increment
        self.epsilon = epsilon
        self.max_priority = 1.0

    def push(self, state, action, reward, next_state, done):
        """存储经验，使用最大优先级"""
        experience = (state, action, reward, next_state, done)
        priority = self.max_priority ** self.alpha
        self.tree.add(priority, experience)

    def sample(self, batch_size: int) -> Tuple:
        """按优先级采样"""
        batch = []
        indices = []
        priorities = []

        segment = self.tree.total() / batch_size

        # 增加beta
        self.beta = min(1.0, self.beta + self.beta_increment)

        for i in range(batch_size):
            a = segment * i
            b = segment * (i + 1)
            s = np.random.uniform(a, b)

            idx, priority, data = self.tree.get(s)

            batch.append(data)
            indices.append(idx)
            priorities.append(priority)

        # 计算重要性采样权重
        sampling_probabilities = np.array(priorities) / self.tree.total()
        weights = (self.tree.n_entries * sampling_probabilities) ** (-self.beta)
        weights /= weights.max()  # 归一化

        # 解包经验
        states = np.array([e[0] for e in batch])
        actions = np.array([e[1] for e in batch])
        rewards = np.array([e[2] for e in batch])
        next_states = np.array([e[3] for e in batch])
        dones = np.array([e[4] for e in batch])

        return (
            torch.FloatTensor(states),
            torch.LongTensor(actions),
            torch.FloatTensor(rewards),
            torch.FloatTensor(next_states),
            torch.FloatTensor(dones),
            indices,
            torch.FloatTensor(weights)
        )

    def update_priorities(self, indices: List[int], td_errors: np.ndarray):
        """更新优先级"""
        for idx, td_error in zip(indices, td_errors):
            priority = (abs(td_error) + self.epsilon) ** self.alpha
            self.tree.update(idx, priority)
            self.max_priority = max(self.max_priority, priority)

    def __len__(self) -> int:
        return self.tree.n_entries


class PrioritizedDQN(DQN):
    """使用优先经验回放的DQN"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # 替换为优先经验回放
        buffer_size = kwargs.get('buffer_size', 100000)
        self.replay_buffer = PrioritizedReplayBuffer(capacity=buffer_size)

    def update(self) -> float:
        if len(self.replay_buffer) < self.batch_size:
            return 0.0

        # 采样（包含重要性采样权重）
        (states, actions, rewards, next_states,
         dones, indices, weights) = self.replay_buffer.sample(self.batch_size)

        states = states.to(self.device)
        actions = actions.to(self.device)
        rewards = rewards.to(self.device)
        next_states = next_states.to(self.device)
        dones = dones.to(self.device)
        weights = weights.to(self.device)

        # 计算当前Q值
        current_q_values = self.q_network(states).gather(1, actions.unsqueeze(1))

        # 计算目标Q值
        with torch.no_grad():
            next_q_values = self.target_network(next_states).max(1)[0]
            target_q_values = rewards + self.gamma * next_q_values * (1 - dones)

        # 计算TD误差
        td_errors = (current_q_values.squeeze() - target_q_values).detach().cpu().numpy()

        # 更新优先级
        self.replay_buffer.update_priorities(indices, td_errors)

        # 使用重要性采样权重计算损失
        loss = (weights * F.mse_loss(current_q_values.squeeze(),
                                      target_q_values, reduction='none')).mean()

        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.q_network.parameters(), max_norm=10)
        self.optimizer.step()

        self.train_step += 1
        if self.train_step % self.target_update_freq == 0:
            self.target_network.load_state_dict(self.q_network.state_dict())

        return loss.item()
```

### N-Step Returns

N-Step Returns可以加速价值传播，减少偏差：

```python
class NStepReplayBuffer:
    """N-Step经验回放"""

    def __init__(self, capacity: int, n_step: int = 3, gamma: float = 0.99):
        self.capacity = capacity
        self.n_step = n_step
        self.gamma = gamma

        self.buffer = deque(maxlen=capacity)
        self.n_step_buffer = deque(maxlen=n_step)

    def push(self, state, action, reward, next_state, done):
        """存储经验，计算n-step returns"""
        self.n_step_buffer.append((state, action, reward, next_state, done))

        if len(self.n_step_buffer) == self.n_step:
            # 计算n-step return
            n_step_return = 0
            for i, (_, _, r, _, d) in enumerate(self.n_step_buffer):
                n_step_return += (self.gamma ** i) * r
                if d:
                    break

            # 存储第一个状态-动作对和n-step return
            first_state, first_action, _, _, _ = self.n_step_buffer[0]
            _, _, _, last_next_state, last_done = self.n_step_buffer[-1]

            self.buffer.append((
                first_state, first_action, n_step_return,
                last_next_state, last_done
            ))

        # 如果episode结束，清空n_step_buffer
        if done:
            # 处理剩余的经验
            while len(self.n_step_buffer) > 0:
                n_step_return = 0
                for i, (_, _, r, _, d) in enumerate(self.n_step_buffer):
                    n_step_return += (self.gamma ** i) * r

                first_state, first_action, _, _, _ = self.n_step_buffer[0]
                _, _, _, last_next_state, last_done = self.n_step_buffer[-1]

                self.buffer.append((
                    first_state, first_action, n_step_return,
                    last_next_state, last_done
                ))

                self.n_step_buffer.popleft()

    def sample(self, batch_size: int) -> Tuple:
        experiences = random.sample(self.buffer, batch_size)

        states = torch.FloatTensor([e[0] for e in experiences])
        actions = torch.LongTensor([e[1] for e in experiences])
        n_step_returns = torch.FloatTensor([e[2] for e in experiences])
        next_states = torch.FloatTensor([e[3] for e in experiences])
        dones = torch.FloatTensor([e[4] for e in experiences])

        return states, actions, n_step_returns, next_states, dones

    def __len__(self) -> int:
        return len(self.buffer)
```

---

## 面试要点

### 核心概念题

**Q1: 解释强化学习与监督学习的区别？**

| 方面 | 监督学习 | 强化学习 |
|------|----------|----------|
| 数据 | 带标签的数据集 | 与环境交互获得 |
| 反馈 | 即时且明确的标签 | 延迟且稀疏的奖励 |
| 目标 | 最小化预测误差 | 最大化累积奖励 |
| 决策 | 独立预测 | 序列决策 |
| 探索 | 不需要 | 需要平衡探索和利用 |

**Q2: Q-Learning和SARSA的区别？**

- **Q-Learning（离线策略）**：
  - 使用 $\max_{a'} Q(s', a')$ 更新
  - 学习最优策略，不受行为策略影响
  - 可能学习危险策略

- **SARSA（在线策略）**：
  - 使用 $Q(s', a')$（实际采取的动作）更新
  - 学习行为策略下的最优策略
  - 更保守，考虑探索风险

**Q3: 为什么DQN需要目标网络？**

目标网络的作用是稳定训练过程：

1. **减少自举偏差**：TD目标不断变化会导致训练不稳定
2. **打破相关性**：Q网络更新会立即影响TD目标
3. **提供稳定目标**：固定目标网络参数一段时间

**Q4: 解释探索与利用的权衡？**

- **探索（Exploration）**：尝试新动作以发现更好策略
- **利用（Exploitation）**：选择当前已知的最优动作

**常用策略**：
- Epsilon-Greedy：以概率 $\epsilon$ 随机探索
- Softmax：根据Q值概率分布选择
- UCB（置信上界）：考虑不确定性的探索
- 好奇心驱动：内在奖励鼓励探索

**Q5: Double DQN如何解决过估计问题？**

```python
# 标准DQN（过估计）
target = r + gamma * max(Q_target(s'))

# Double DQN（解耦）
best_action = argmax(Q_online(s'))  # 在线网络选择动作
target = r + gamma * Q_target(s', best_action)  # 目标网络评估
```

关键：将动作选择和价值评估分离，使用不同的网络。

### 算法设计题

**Q6: 设计一个完整的DQN训练pipeline**

```python
def dqn_training_pipeline():
    """
    DQN训练流程设计

    关键组件：
    1. 环境预处理（帧堆叠、归一化等）
    2. 网络架构（CNN/MLP）
    3. 经验回放（可选优先级采样）
    4. 目标网络（定期软更新或硬更新）
    5. 探索策略（epsilon-greedy + decay）
    6. 训练循环
    7. 评估和监控
    """

    # 1. 环境预处理
    class PreprocessWrapper:
        def __init__(self, env):
            self.env = env
            self.frame_stack = 4
            self.frames = deque(maxlen=self.frame_stack)

        def reset(self):
            obs = self.env.reset()
            obs = self.preprocess(obs)
            for _ in range(self.frame_stack):
                self.frames.append(obs)
            return np.stack(self.frames)

        def step(self, action):
            obs, reward, done, info = self.env.step(action)
            obs = self.preprocess(obs)
            self.frames.append(obs)
            return np.stack(self.frames), reward, done, info

        def preprocess(self, obs):
            # 灰度化、缩放、归一化
            return obs / 255.0

    # 2. 训练配置
    config = {
        'learning_rate': 1e-4,
        'gamma': 0.99,
        'epsilon_start': 1.0,
        'epsilon_end': 0.01,
        'epsilon_decay_steps': 100000,
        'batch_size': 32,
        'buffer_size': 100000,
        'target_update_freq': 1000,
        'train_freq': 4,
        'learning_starts': 10000
    }

    # 3. 训练循环
    # ... 参见前面的DQN实现

    return config
```

**Q7: 如何处理稀疏奖励问题？**

1. **奖励塑形（Reward Shaping）**：添加中间奖励指导学习
2. **课程学习（Curriculum Learning）**：从简单任务逐渐增加难度
3. **好奇心驱动（Curiosity）**：使用内在奖励鼓励探索
4. **分层强化学习**：分解为子目标
5. **模仿学习**：从专家示范学习
6. **后见经验回放（HER）**：将失败经验转化为成功经验

### 工程实践题

**Q8: 强化学习训练的调试技巧？**

```python
def debugging_tips():
    """强化学习调试建议"""

    tips = {
        "1. 验证环境": [
            "使用随机策略测试环境",
            "检查状态和奖励范围",
            "确保环境reset正确"
        ],

        "2. 检查网络": [
            "确保输入维度正确",
            "初始化输出Q值合理",
            "梯度流动正常"
        ],

        "3. 监控指标": [
            "Episode reward（应该逐渐增加）",
            "TD loss（应该逐渐减小）",
            "Q值（不应该爆炸）",
            "Epsilon（按预期衰减）"
        ],

        "4. 调参顺序": [
            "学习率（最重要）",
            "目标网络更新频率",
            "经验回放大小",
            "探索策略"
        ],

        "5. 常见问题": [
            "Q值爆炸：降低学习率，增加目标网络更新间隔",
            "不学习：检查奖励设计，增加探索",
            "不稳定：增加缓冲区大小，使用Double DQN"
        ]
    }

    return tips
```

**Q9: 如何评估强化学习算法的性能？**

```python
def assessment_metrics():
    """评估指标和方法"""

    metrics = {
        "训练指标": {
            "episode_reward": "每个episode的总奖励",
            "moving_average_reward": "滑动平均奖励（如最近100个episode）",
            "success_rate": "达到目标的比例",
            "episode_length": "episode步数"
        },

        "评估方法": {
            "deterministic_assessment": "使用贪婪策略评估（无探索）",
            "multiple_seeds": "多个随机种子取平均",
            "learning_curve": "奖励随训练步数的变化曲线"
        },

        "统计检验": {
            "confidence_interval": "95%置信区间",
            "statistical_significance": "与baseline比较的显著性"
        }
    }

    return metrics


def assess_agent(agent, env, num_episodes=100, render=False):
    """标准评估函数"""
    rewards = []
    lengths = []
    successes = []

    for _ in range(num_episodes):
        state = env.reset()
        if isinstance(state, tuple):
            state = state[0]

        episode_reward = 0
        episode_length = 0

        while True:
            if render:
                env.render()

            # 使用贪婪策略
            action = agent.select_action(state)
            if hasattr(agent, 'epsilon'):
                old_epsilon = agent.epsilon
                agent.epsilon = 0
                action = agent.select_action(state)
                agent.epsilon = old_epsilon

            result = env.step(action)
            next_state = result[0]
            reward = result[1]
            done = result[2] if len(result) == 4 else result[2] or result[3]

            episode_reward += reward
            episode_length += 1
            state = next_state

            if done:
                break

        rewards.append(episode_reward)
        lengths.append(episode_length)

    return {
        'mean_reward': np.mean(rewards),
        'std_reward': np.std(rewards),
        'mean_length': np.mean(lengths),
        'min_reward': np.min(rewards),
        'max_reward': np.max(rewards)
    }
```

---

## 总结与延伸

### 算法对比总结

| 算法 | 类型 | 特点 | 适用场景 |
|------|------|------|----------|
| Q-Learning | 离线策略、表格方法 | 简单、保证收敛 | 小规模离散空间 |
| SARSA | 在线策略、表格方法 | 更保守、考虑探索 | 安全关键场景 |
| DQN | 离线策略、深度学习 | 可处理连续状态 | Atari游戏等 |
| Double DQN | DQN改进 | 减少过估计 | 通用改进 |
| Dueling DQN | 网络架构改进 | 更好学习状态价值 | 动作不影响结果的场景 |
| 优先经验回放 | 采样改进 | 提高样本效率 | 通用改进 |

### 进阶学习路径

```
基础算法
- 值函数方法
  - Q-Learning / SARSA
  - DQN及其变种
  - Distributional RL

- 策略梯度方法
  - REINFORCE
  - Actor-Critic
  - A2C / A3C
  - PPO
  - TRPO

- 模型基础方法
  - Dyna-Q
  - MBPO
  - World Models

- 高级主题
  - 多智能体强化学习
  - 分层强化学习
  - 元强化学习
  - 离线强化学习
  - 安全强化学习
```

### 推荐资源

**书籍：**
- 《Reinforcement Learning: An Introduction》（Sutton & Barto）- 强化学习圣经
- 《Deep Reinforcement Learning Hands-On》- 实战指南

**课程：**
- David Silver的强化学习课程（UCL）
- Sergey Levine的深度强化学习课程（Berkeley）
- Spinning Up in Deep RL（OpenAI）

**工具和框架：**
- OpenAI Gym / Gymnasium：标准环境接口
- Stable Baselines3：高质量算法实现
- RLlib：分布式强化学习
- CleanRL：简洁的单文件实现

### 实践建议

1. **从简单环境开始**：CartPole、MountainCar、GridWorld
2. **理解算法原理**：手动实现一遍基础算法
3. **注重调试技能**：学会分析训练曲线和日志
4. **逐步增加复杂度**：从表格方法到深度学习
5. **关注工程细节**：超参数、正则化、环境预处理
6. **阅读经典论文**：DQN、A3C、PPO等
7. **参与社区**：Kaggle竞赛、开源项目

---

强化学习是一个充满挑战和机遇的领域。通过本文的学习，你应该能够：

1. 理解强化学习的基本框架和核心概念
2. 掌握Q-Learning、SARSA等经典算法
3. 实现DQN及其重要改进
4. 了解经验回放的原理和优化方法
5. 具备面试中讨论强化学习问题的能力

强化学习的魅力在于它与真实世界决策问题的紧密联系。继续深入学习，你将能够构建更智能的决策系统，解决更复杂的实际问题。
