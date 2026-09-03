---
title: 强化学习基础
description: 了解强化学习的核心概念和算法
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - 强化学习
  - Q-Learning
  - Policy Gradient
  - 深度强化学习
status: imported
origin: old/src/content/docs/ai/reinforcement-learning.zh.md
divergence: 0.459
issues:
  - divergent
legacy:
  category: AI
  subcategory: ML
  order: 15
  lastUpdated: 2026-01-07
---

强化学习（Reinforcement Learning，RL）是机器学习的三大范式之一，与监督学习和无监督学习并列。它的核心思想是让智能体（Agent）通过与环境（Environment）的交互，学习如何采取行动以最大化累积奖励。强化学习在游戏AI、机器人控制、自动驾驶、推荐系统等领域有着广泛应用。

---

## 核心概念

### 智能体与环境

强化学习的基本框架由智能体（Agent）和环境（Environment）组成。智能体通过观察环境状态，选择动作，并从环境获得奖励反馈。

```
┌─────────────────────────────────────────────────────────┐
│                    强化学习框架                          │
│                                                         │
│    ┌─────────┐      动作 (Action)      ┌─────────┐     │
│    │         │ ───────────────────────▶│         │     │
│    │  智能体  │                         │   环境   │     │
│    │ (Agent) │◀─────────────────────── │(Environ)│     │
│    │         │   状态 (State)          │         │     │
│    │         │◀─────────────────────── │         │     │
│    └─────────┘   奖励 (Reward)         └─────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**核心要素：**

- **状态（State, S）**：环境的当前情况，智能体可观察到的信息
- **动作（Action, A）**：智能体可以执行的操作
- **奖励（Reward, R）**：环境对智能体动作的即时反馈
- **策略（Policy, π）**：从状态到动作的映射，决定智能体的行为
- **价值函数（Value Function）**：评估状态或状态-动作对的长期价值

```python
import numpy as np
from typing import Tuple, List
from abc import ABC, abstractmethod

class Environment(ABC):
    """环境的抽象基类"""

    @abstractmethod
    def reset(self) -> np.ndarray:
        """重置环境，返回初始状态"""
        pass

    @abstractmethod
    def step(self, action: int) -> Tuple[np.ndarray, float, bool, dict]:
        """
        执行动作，返回:
        - next_state: 下一个状态
        - reward: 即时奖励
        - done: 是否结束
        - info: 额外信息
        """
        pass

    @property
    @abstractmethod
    def action_space(self) -> int:
        """动作空间大小"""
        pass

    @property
    @abstractmethod
    def state_space(self) -> int:
        """状态空间大小"""
        pass


class GridWorld(Environment):
    """
    简单的网格世界环境
    智能体需要从起点移动到目标位置
    """

    def __init__(self, size: int = 5):
        self.size = size
        self.state = None
        self.goal = (size - 1, size - 1)
        self.obstacles = [(1, 1), (2, 2), (3, 1)]

    def reset(self) -> np.ndarray:
        self.state = (0, 0)
        return self._get_state_vector()

    def _get_state_vector(self) -> np.ndarray:
        """将位置转换为one-hot向量"""
        state_vec = np.zeros(self.size * self.size)
        idx = self.state[0] * self.size + self.state[1]
        state_vec[idx] = 1
        return state_vec

    def step(self, action: int) -> Tuple[np.ndarray, float, bool, dict]:
        """
        动作: 0=上, 1=下, 2=左, 3=右
        """
        x, y = self.state

        # 根据动作更新位置
        if action == 0 and x > 0:
            x -= 1
        elif action == 1 and x < self.size - 1:
            x += 1
        elif action == 2 and y > 0:
            y -= 1
        elif action == 3 and y < self.size - 1:
            y += 1

        # 检查是否撞到障碍物
        if (x, y) not in self.obstacles:
            self.state = (x, y)

        # 计算奖励
        if self.state == self.goal:
            reward = 10.0
            done = True
        elif self.state in self.obstacles:
            reward = -5.0
            done = False
        else:
            reward = -0.1  # 每步的小惩罚，鼓励快速到达目标
            done = False

        return self._get_state_vector(), reward, done, {}

    @property
    def action_space(self) -> int:
        return 4

    @property
    def state_space(self) -> int:
        return self.size * self.size


class Agent(ABC):
    """智能体的抽象基类"""

    @abstractmethod
    def select_action(self, state: np.ndarray) -> int:
        """根据状态选择动作"""
        pass

    @abstractmethod
    def learn(self, *args, **kwargs):
        """从经验中学习"""
        pass
```

### 回报与折扣因子

强化学习的目标是最大化累积回报（Return），而不仅仅是即时奖励。回报定义为未来奖励的加权和：

$$G_t = R_{t+1} + \gamma R_{t+2} + \gamma^2 R_{t+3} + \cdots = \sum_{k=0}^{\infty} \gamma^k R_{t+k+1}$$

其中 $\gamma \in [0, 1]$ 是折扣因子（Discount Factor）：

- **$\gamma = 0$**：只考虑即时奖励（短视）
- **$\gamma = 1$**：同等看待所有未来奖励
- **$\gamma \in (0, 1)$**：折衷方案，近期奖励权重更高

```python
def calculate_returns(rewards: List[float], gamma: float = 0.99) -> List[float]:
    """
    计算每个时间步的回报

    Args:
        rewards: 奖励序列
        gamma: 折扣因子

    Returns:
        每个时间步的回报列表
    """
    returns = []
    G = 0

    # 从后向前计算回报
    for reward in reversed(rewards):
        G = reward + gamma * G
        returns.insert(0, G)

    return returns


# 示例
rewards = [1, 2, 3, 4, 5]
returns = calculate_returns(rewards, gamma=0.9)
print(f"奖励序列: {rewards}")
print(f"回报序列: {[round(r, 2) for r in returns]}")
# 输出: 回报序列: [12.16, 12.4, 11.56, 9.5, 5.0]
```

---

## 马尔可夫决策过程

### MDP的定义

马尔可夫决策过程（Markov Decision Process，MDP）是强化学习的数学框架，由五元组 $(S, A, P, R, \gamma)$ 定义：

- **$S$**：状态空间（State Space）
- **$A$**：动作空间（Action Space）
- **$P(s'|s, a)$**：状态转移概率
- **$R(s, a, s')$**：奖励函数
- **$\gamma$**：折扣因子

**马尔可夫性质：** 未来状态只依赖于当前状态，与历史无关。

$$P(S_{t+1}|S_t, A_t, S_{t-1}, A_{t-1}, \cdots) = P(S_{t+1}|S_t, A_t)$$

```python
class MDP:
    """
    马尔可夫决策过程的实现
    """

    def __init__(
        self,
        states: List[int],
        actions: List[int],
        transition_probs: dict,
        rewards: dict,
        gamma: float = 0.99
    ):
        """
        Args:
            states: 状态列表
            actions: 动作列表
            transition_probs: 转移概率 {(s, a): {s': prob}}
            rewards: 奖励函数 {(s, a, s'): reward}
            gamma: 折扣因子
        """
        self.states = states
        self.actions = actions
        self.transition_probs = transition_probs
        self.rewards = rewards
        self.gamma = gamma

    def get_next_state_prob(self, state: int, action: int) -> dict:
        """获取给定状态和动作后，下一状态的概率分布"""
        return self.transition_probs.get((state, action), {})

    def get_reward(self, state: int, action: int, next_state: int) -> float:
        """获取奖励"""
        return self.rewards.get((state, action, next_state), 0.0)

    def sample_next_state(self, state: int, action: int) -> Tuple[int, float]:
        """采样下一个状态并返回奖励"""
        probs = self.get_next_state_prob(state, action)
        if not probs:
            return state, 0.0

        next_states = list(probs.keys())
        probabilities = list(probs.values())
        next_state = np.random.choice(next_states, p=probabilities)
        reward = self.get_reward(state, action, next_state)

        return next_state, reward


# 创建一个简单的MDP示例：学生学习问题
# 状态：0=睡觉, 1=学习, 2=玩游戏, 3=毕业
# 动作：0=继续, 1=切换活动

states = [0, 1, 2, 3]
actions = [0, 1]

transition_probs = {
    (0, 0): {0: 0.8, 1: 0.2},  # 睡觉时继续：可能继续睡或醒来学习
    (0, 1): {1: 0.6, 2: 0.4},  # 睡觉时切换：可能去学习或玩游戏
    (1, 0): {1: 0.5, 3: 0.5},  # 学习时继续：可能继续学或毕业
    (1, 1): {0: 0.3, 2: 0.7},  # 学习时切换：可能去睡觉或玩游戏
    (2, 0): {2: 0.9, 0: 0.1},  # 玩游戏继续：大概率继续玩
    (2, 1): {1: 0.4, 0: 0.6},  # 玩游戏切换：可能去学习或睡觉
    (3, 0): {3: 1.0},          # 毕业是终止状态
    (3, 1): {3: 1.0},
}

rewards = {
    (1, 0, 3): 100,   # 学习导致毕业，大奖励
    (1, 0, 1): 1,     # 继续学习，小奖励
    (2, 0, 2): 2,     # 玩游戏，即时愉悦
    (0, 0, 0): -1,    # 一直睡觉，小惩罚
}

student_mdp = MDP(states, actions, transition_probs, rewards, gamma=0.9)
```

### 策略与价值函数

**策略（Policy）** 定义了智能体的行为方式：

- **确定性策略**：$\pi(s) = a$，对于每个状态返回确定的动作
- **随机性策略**：$\pi(a|s)$，返回在状态 $s$ 下选择动作 $a$ 的概率

**状态价值函数**（State Value Function）$V^\pi(s)$：从状态 $s$ 开始，遵循策略 $\pi$ 的期望回报：

$$V^\pi(s) = \mathbb{E}_\pi[G_t | S_t = s] = \mathbb{E}_\pi\left[\sum_{k=0}^{\infty} \gamma^k R_{t+k+1} | S_t = s\right]$$

**动作价值函数**（Action Value Function）$Q^\pi(s, a)$：从状态 $s$ 执行动作 $a$ 后，遵循策略 $\pi$ 的期望回报：

$$Q^\pi(s, a) = \mathbb{E}_\pi[G_t | S_t = s, A_t = a]$$

```python
class PolicyEvaluation:
    """
    策略评估：计算给定策略的价值函数
    """

    def __init__(self, mdp: MDP, policy: dict):
        """
        Args:
            mdp: 马尔可夫决策过程
            policy: 策略 {state: action} 或 {state: {action: prob}}
        """
        self.mdp = mdp
        self.policy = policy
        self.V = {s: 0.0 for s in mdp.states}

    def get_action_prob(self, state: int, action: int) -> float:
        """获取在状态下采取动作的概率"""
        policy_at_state = self.policy.get(state, {})
        if isinstance(policy_at_state, int):
            # 确定性策略
            return 1.0 if policy_at_state == action else 0.0
        else:
            # 随机策略
            return policy_at_state.get(action, 0.0)

    def evaluate(self, theta: float = 1e-6, max_iterations: int = 1000) -> dict:
        """
        迭代策略评估

        Args:
            theta: 收敛阈值
            max_iterations: 最大迭代次数

        Returns:
            价值函数 {state: value}
        """
        for iteration in range(max_iterations):
            delta = 0

            for s in self.mdp.states:
                v = self.V[s]
                new_v = 0

                for a in self.mdp.actions:
                    action_prob = self.get_action_prob(s, a)
                    if action_prob == 0:
                        continue

                    # 计算期望值
                    next_state_probs = self.mdp.get_next_state_prob(s, a)
                    for s_next, trans_prob in next_state_probs.items():
                        reward = self.mdp.get_reward(s, a, s_next)
                        new_v += action_prob * trans_prob * (
                            reward + self.mdp.gamma * self.V[s_next]
                        )

                self.V[s] = new_v
                delta = max(delta, abs(v - new_v))

            if delta < theta:
                print(f"策略评估在第 {iteration + 1} 次迭代后收敛")
                break

        return self.V
```

---

## 值函数与贝尔曼方程

### 贝尔曼期望方程

贝尔曼方程是强化学习的核心方程，它描述了价值函数的递归关系。

**状态价值函数的贝尔曼方程：**

$$V^\pi(s) = \sum_{a} \pi(a|s) \sum_{s'} P(s'|s,a) [R(s,a,s') + \gamma V^\pi(s')]$$

**动作价值函数的贝尔曼方程：**

$$Q^\pi(s,a) = \sum_{s'} P(s'|s,a) [R(s,a,s') + \gamma \sum_{a'} \pi(a'|s') Q^\pi(s',a')]$$

```python
def bellman_expectation_backup(
    V: dict,
    mdp: MDP,
    state: int,
    policy: dict
) -> float:
    """
    贝尔曼期望备份：计算状态的新价值

    Args:
        V: 当前价值函数
        mdp: MDP
        state: 当前状态
        policy: 策略

    Returns:
        更新后的状态价值
    """
    new_value = 0

    for action in mdp.actions:
        # 获取策略概率
        if isinstance(policy[state], int):
            action_prob = 1.0 if policy[state] == action else 0.0
        else:
            action_prob = policy[state].get(action, 0.0)

        if action_prob == 0:
            continue

        # 对所有可能的下一状态求期望
        for next_state, trans_prob in mdp.get_next_state_prob(state, action).items():
            reward = mdp.get_reward(state, action, next_state)
            new_value += action_prob * trans_prob * (reward + mdp.gamma * V[next_state])

    return new_value
```

### 贝尔曼最优方程

最优策略 $\pi^*$ 是使价值函数最大化的策略：

$$V^*(s) = \max_a \sum_{s'} P(s'|s,a) [R(s,a,s') + \gamma V^*(s')]$$

$$Q^*(s,a) = \sum_{s'} P(s'|s,a) [R(s,a,s') + \gamma \max_{a'} Q^*(s',a')]$$

```python
class ValueIteration:
    """
    值迭代算法：直接求解最优价值函数
    """

    def __init__(self, mdp: MDP):
        self.mdp = mdp
        self.V = {s: 0.0 for s in mdp.states}
        self.policy = {s: 0 for s in mdp.states}

    def iterate(self, theta: float = 1e-6, max_iterations: int = 1000) -> Tuple[dict, dict]:
        """
        值迭代

        Returns:
            (最优价值函数, 最优策略)
        """
        for iteration in range(max_iterations):
            delta = 0

            for s in self.mdp.states:
                v = self.V[s]

                # 计算所有动作的价值
                action_values = []
                for a in self.mdp.actions:
                    value = 0
                    for s_next, prob in self.mdp.get_next_state_prob(s, a).items():
                        reward = self.mdp.get_reward(s, a, s_next)
                        value += prob * (reward + self.mdp.gamma * self.V[s_next])
                    action_values.append(value)

                # 取最大值
                self.V[s] = max(action_values) if action_values else 0
                self.policy[s] = np.argmax(action_values) if action_values else 0

                delta = max(delta, abs(v - self.V[s]))

            if delta < theta:
                print(f"值迭代在第 {iteration + 1} 次迭代后收敛")
                break

        return self.V, self.policy


class PolicyIteration:
    """
    策略迭代算法：交替进行策略评估和策略改进
    """

    def __init__(self, mdp: MDP):
        self.mdp = mdp
        self.V = {s: 0.0 for s in mdp.states}
        # 初始化随机策略
        self.policy = {s: np.random.choice(mdp.actions) for s in mdp.states}

    def policy_evaluation(self, theta: float = 1e-6):
        """策略评估"""
        while True:
            delta = 0
            for s in self.mdp.states:
                v = self.V[s]
                a = self.policy[s]

                new_v = 0
                for s_next, prob in self.mdp.get_next_state_prob(s, a).items():
                    reward = self.mdp.get_reward(s, a, s_next)
                    new_v += prob * (reward + self.mdp.gamma * self.V[s_next])

                self.V[s] = new_v
                delta = max(delta, abs(v - new_v))

            if delta < theta:
                break

    def policy_improvement(self) -> bool:
        """策略改进，返回策略是否稳定"""
        policy_stable = True

        for s in self.mdp.states:
            old_action = self.policy[s]

            # 选择使Q值最大的动作
            action_values = []
            for a in self.mdp.actions:
                value = 0
                for s_next, prob in self.mdp.get_next_state_prob(s, a).items():
                    reward = self.mdp.get_reward(s, a, s_next)
                    value += prob * (reward + self.mdp.gamma * self.V[s_next])
                action_values.append(value)

            self.policy[s] = np.argmax(action_values)

            if old_action != self.policy[s]:
                policy_stable = False

        return policy_stable

    def iterate(self, max_iterations: int = 100) -> Tuple[dict, dict]:
        """
        策略迭代

        Returns:
            (最优价值函数, 最优策略)
        """
        for i in range(max_iterations):
            # 策略评估
            self.policy_evaluation()

            # 策略改进
            if self.policy_improvement():
                print(f"策略迭代在第 {i + 1} 次迭代后收敛")
                break

        return self.V, self.policy
```

---

## Q-Learning算法

### 时序差分学习

时序差分（Temporal Difference，TD）学习是强化学习的核心方法，它结合了蒙特卡洛方法和动态规划的优点：

- 不需要等待回合结束就可以学习（与蒙特卡洛不同）
- 不需要环境模型（与动态规划不同）

**TD(0) 更新规则：**

$$V(S_t) \leftarrow V(S_t) + \alpha [R_{t+1} + \gamma V(S_{t+1}) - V(S_t)]$$

其中 $R_{t+1} + \gamma V(S_{t+1})$ 称为 TD 目标，$R_{t+1} + \gamma V(S_{t+1}) - V(S_t)$ 称为 TD 误差。

```python
class TD0:
    """
    TD(0) 算法实现
    """

    def __init__(
        self,
        n_states: int,
        alpha: float = 0.1,
        gamma: float = 0.99
    ):
        self.V = np.zeros(n_states)
        self.alpha = alpha
        self.gamma = gamma

    def update(self, state: int, reward: float, next_state: int, done: bool):
        """
        TD(0) 更新
        """
        if done:
            td_target = reward
        else:
            td_target = reward + self.gamma * self.V[next_state]

        td_error = td_target - self.V[state]
        self.V[state] += self.alpha * td_error

        return td_error
```

### Q-Learning核心原理

Q-Learning 是一种无模型（Model-Free）的离策略（Off-Policy）强化学习算法，直接学习最优动作价值函数 $Q^*$。

**Q-Learning 更新规则：**

$$Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha [R_{t+1} + \gamma \max_a Q(S_{t+1}, a) - Q(S_t, A_t)]$$

```python
class QLearning:
    """
    Q-Learning 算法实现
    """

    def __init__(
        self,
        n_states: int,
        n_actions: int,
        alpha: float = 0.1,
        gamma: float = 0.99,
        epsilon: float = 0.1
    ):
        """
        Args:
            n_states: 状态数量
            n_actions: 动作数量
            alpha: 学习率
            gamma: 折扣因子
            epsilon: 探索率（epsilon-greedy策略）
        """
        self.Q = np.zeros((n_states, n_actions))
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.n_actions = n_actions

    def select_action(self, state: int) -> int:
        """
        Epsilon-Greedy 动作选择
        """
        if np.random.random() < self.epsilon:
            # 探索：随机选择动作
            return np.random.randint(self.n_actions)
        else:
            # 利用：选择最优动作
            return np.argmax(self.Q[state])

    def update(
        self,
        state: int,
        action: int,
        reward: float,
        next_state: int,
        done: bool
    ) -> float:
        """
        Q-Learning 更新

        Returns:
            TD误差
        """
        if done:
            td_target = reward
        else:
            td_target = reward + self.gamma * np.max(self.Q[next_state])

        td_error = td_target - self.Q[state, action]
        self.Q[state, action] += self.alpha * td_error

        return td_error

    def get_policy(self) -> np.ndarray:
        """获取贪婪策略"""
        return np.argmax(self.Q, axis=1)


def train_q_learning(
    env: Environment,
    n_episodes: int = 1000,
    alpha: float = 0.1,
    gamma: float = 0.99,
    epsilon_start: float = 1.0,
    epsilon_end: float = 0.01,
    epsilon_decay: float = 0.995
) -> QLearning:
    """
    训练 Q-Learning 智能体
    """
    agent = QLearning(
        n_states=env.state_space,
        n_actions=env.action_space,
        alpha=alpha,
        gamma=gamma,
        epsilon=epsilon_start
    )

    episode_rewards = []

    for episode in range(n_episodes):
        state = env.reset()
        state_idx = np.argmax(state)  # 将one-hot转换为索引
        total_reward = 0
        done = False

        while not done:
            # 选择动作
            action = agent.select_action(state_idx)

            # 执行动作
            next_state, reward, done, _ = env.step(action)
            next_state_idx = np.argmax(next_state)

            # 更新Q值
            agent.update(state_idx, action, reward, next_state_idx, done)

            state_idx = next_state_idx
            total_reward += reward

        episode_rewards.append(total_reward)

        # 衰减探索率
        agent.epsilon = max(epsilon_end, agent.epsilon * epsilon_decay)

        if (episode + 1) % 100 == 0:
            avg_reward = np.mean(episode_rewards[-100:])
            print(f"Episode {episode + 1}, Avg Reward: {avg_reward:.2f}, Epsilon: {agent.epsilon:.3f}")

    return agent
```

### SARSA算法

SARSA（State-Action-Reward-State-Action）是一种在策略（On-Policy）的TD控制算法：

$$Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha [R_{t+1} + \gamma Q(S_{t+1}, A_{t+1}) - Q(S_t, A_t)]$$

与Q-Learning的区别在于，SARSA使用下一步实际采取的动作来更新，而Q-Learning使用最优动作。

```python
class SARSA:
    """
    SARSA 算法实现
    """

    def __init__(
        self,
        n_states: int,
        n_actions: int,
        alpha: float = 0.1,
        gamma: float = 0.99,
        epsilon: float = 0.1
    ):
        self.Q = np.zeros((n_states, n_actions))
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.n_actions = n_actions

    def select_action(self, state: int) -> int:
        """Epsilon-Greedy 动作选择"""
        if np.random.random() < self.epsilon:
            return np.random.randint(self.n_actions)
        else:
            return np.argmax(self.Q[state])

    def update(
        self,
        state: int,
        action: int,
        reward: float,
        next_state: int,
        next_action: int,
        done: bool
    ) -> float:
        """
        SARSA 更新

        注意：与Q-Learning不同，这里使用next_action而不是max
        """
        if done:
            td_target = reward
        else:
            td_target = reward + self.gamma * self.Q[next_state, next_action]

        td_error = td_target - self.Q[state, action]
        self.Q[state, action] += self.alpha * td_error

        return td_error


def train_sarsa(
    env: Environment,
    n_episodes: int = 1000,
    alpha: float = 0.1,
    gamma: float = 0.99,
    epsilon: float = 0.1
) -> SARSA:
    """
    训练 SARSA 智能体
    """
    agent = SARSA(
        n_states=env.state_space,
        n_actions=env.action_space,
        alpha=alpha,
        gamma=gamma,
        epsilon=epsilon
    )

    for episode in range(n_episodes):
        state = env.reset()
        state_idx = np.argmax(state)
        action = agent.select_action(state_idx)
        done = False

        while not done:
            next_state, reward, done, _ = env.step(action)
            next_state_idx = np.argmax(next_state)
            next_action = agent.select_action(next_state_idx)

            # SARSA 更新：使用实际的下一个动作
            agent.update(state_idx, action, reward, next_state_idx, next_action, done)

            state_idx = next_state_idx
            action = next_action

    return agent
```

### Q-Learning vs SARSA 对比

| 特性 | Q-Learning | SARSA |
|------|-----------|-------|
| 策略类型 | 离策略 (Off-Policy) | 在策略 (On-Policy) |
| 更新目标 | $\max_a Q(s', a)$ | $Q(s', a')$ 实际动作 |
| 收敛策略 | 最优策略 | 当前策略 |
| 探索影响 | 不影响学习目标 | 影响学习目标 |
| 安全性 | 可能激进 | 更保守/安全 |
| 典型应用 | 离线学习，经验回放 | 在线学习，安全敏感场景 |

---

## 策略梯度方法

### 策略梯度定理

策略梯度方法直接优化参数化策略 $\pi_\theta(a|s)$，而不是学习价值函数。

**目标函数**：最大化期望回报

$$J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}[R(\tau)] = \mathbb{E}_{\tau \sim \pi_\theta}\left[\sum_{t=0}^{T} \gamma^t r_t\right]$$

**策略梯度定理**：

$$\nabla_\theta J(\theta) = \mathbb{E}_{\pi_\theta}\left[\sum_{t=0}^{T} \nabla_\theta \log \pi_\theta(a_t|s_t) \cdot G_t\right]$$

其中 $G_t$ 是从时间步 $t$ 开始的回报。

```python
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torch.distributions import Categorical


class PolicyNetwork(nn.Module):
    """
    策略网络：输出动作的概率分布
    """

    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 128):
        super().__init__()
        self.fc1 = nn.Linear(state_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, action_dim)

    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = F.softmax(self.fc3(x), dim=-1)
        return x

    def get_action(self, state):
        """采样动作"""
        probs = self.forward(state)
        dist = Categorical(probs)
        action = dist.sample()
        log_prob = dist.log_prob(action)
        return action.item(), log_prob
```

### REINFORCE算法

REINFORCE是最基础的策略梯度算法，也称为蒙特卡洛策略梯度。

```python
class REINFORCE:
    """
    REINFORCE 算法实现
    """

    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        lr: float = 1e-3,
        gamma: float = 0.99
    ):
        self.policy = PolicyNetwork(state_dim, action_dim)
        self.optimizer = optim.Adam(self.policy.parameters(), lr=lr)
        self.gamma = gamma

        # 存储轨迹
        self.log_probs = []
        self.rewards = []

    def select_action(self, state: np.ndarray) -> int:
        """选择动作并记录log概率"""
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        action, log_prob = self.policy.get_action(state_tensor)
        self.log_probs.append(log_prob)
        return action

    def store_reward(self, reward: float):
        """存储奖励"""
        self.rewards.append(reward)

    def update(self):
        """
        使用完整轨迹更新策略
        """
        # 计算回报
        returns = []
        G = 0
        for reward in reversed(self.rewards):
            G = reward + self.gamma * G
            returns.insert(0, G)

        returns = torch.FloatTensor(returns)

        # 标准化回报（减少方差）
        returns = (returns - returns.mean()) / (returns.std() + 1e-8)

        # 计算策略损失
        policy_loss = []
        for log_prob, G in zip(self.log_probs, returns):
            policy_loss.append(-log_prob * G)

        policy_loss = torch.stack(policy_loss).sum()

        # 更新策略
        self.optimizer.zero_grad()
        policy_loss.backward()
        self.optimizer.step()

        # 清空轨迹
        self.log_probs = []
        self.rewards = []

        return policy_loss.item()


def train_reinforce(
    env,
    agent: REINFORCE,
    n_episodes: int = 1000
):
    """训练 REINFORCE 智能体"""
    episode_rewards = []

    for episode in range(n_episodes):
        state = env.reset()
        done = False
        total_reward = 0

        while not done:
            action = agent.select_action(state)
            next_state, reward, done, _ = env.step(action)
            agent.store_reward(reward)

            state = next_state
            total_reward += reward

        # 回合结束后更新
        loss = agent.update()
        episode_rewards.append(total_reward)

        if (episode + 1) % 100 == 0:
            avg_reward = np.mean(episode_rewards[-100:])
            print(f"Episode {episode + 1}, Avg Reward: {avg_reward:.2f}, Loss: {loss:.4f}")

    return episode_rewards
```

### 带基线的策略梯度

为了减少方差，可以引入基线（Baseline）$b(s)$：

$$\nabla_\theta J(\theta) = \mathbb{E}_{\pi_\theta}\left[\sum_{t=0}^{T} \nabla_\theta \log \pi_\theta(a_t|s_t) \cdot (G_t - b(s_t))\right]$$

通常使用状态价值函数 $V(s)$ 作为基线，此时 $G_t - V(s_t)$ 称为优势函数（Advantage Function）：

$$A(s, a) = Q(s, a) - V(s)$$

```python
class REINFORCEWithBaseline:
    """
    带基线的 REINFORCE 算法
    """

    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        lr_policy: float = 1e-3,
        lr_value: float = 1e-3,
        gamma: float = 0.99
    ):
        # 策略网络
        self.policy = PolicyNetwork(state_dim, action_dim)
        self.policy_optimizer = optim.Adam(self.policy.parameters(), lr=lr_policy)

        # 价值网络（基线）
        self.value = nn.Sequential(
            nn.Linear(state_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 128),
            nn.ReLU(),
            nn.Linear(128, 1)
        )
        self.value_optimizer = optim.Adam(self.value.parameters(), lr=lr_value)

        self.gamma = gamma

        # 存储轨迹
        self.states = []
        self.log_probs = []
        self.rewards = []

    def select_action(self, state: np.ndarray) -> int:
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        self.states.append(state_tensor)

        action, log_prob = self.policy.get_action(state_tensor)
        self.log_probs.append(log_prob)
        return action

    def store_reward(self, reward: float):
        self.rewards.append(reward)

    def update(self):
        # 计算回报
        returns = []
        G = 0
        for reward in reversed(self.rewards):
            G = reward + self.gamma * G
            returns.insert(0, G)

        states = torch.cat(self.states)
        returns = torch.FloatTensor(returns).unsqueeze(1)

        # 计算基线（状态价值）
        values = self.value(states)

        # 计算优势
        advantages = returns - values.detach()
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        # 更新策略
        policy_loss = []
        for log_prob, advantage in zip(self.log_probs, advantages):
            policy_loss.append(-log_prob * advantage)
        policy_loss = torch.stack(policy_loss).sum()

        self.policy_optimizer.zero_grad()
        policy_loss.backward()
        self.policy_optimizer.step()

        # 更新价值函数
        value_loss = F.mse_loss(values, returns)

        self.value_optimizer.zero_grad()
        value_loss.backward()
        self.value_optimizer.step()

        # 清空轨迹
        self.states = []
        self.log_probs = []
        self.rewards = []

        return policy_loss.item(), value_loss.item()
```

---

## 深度Q网络DQN

### DQN核心思想

深度Q网络（Deep Q-Network，DQN）使用神经网络来近似Q函数，解决了传统Q-Learning无法处理高维状态空间的问题。

**DQN的两个关键创新：**

1. **经验回放（Experience Replay）**：将经验存储在回放缓冲区中，随机采样打破数据相关性
2. **目标网络（Target Network）**：使用单独的目标网络计算TD目标，提高训练稳定性

```python
from collections import deque
import random


class ReplayBuffer:
    """
    经验回放缓冲区
    """

    def __init__(self, capacity: int = 100000):
        self.buffer = deque(maxlen=capacity)

    def push(self, state, action, reward, next_state, done):
        """存储经验"""
        self.buffer.append((state, action, reward, next_state, done))

    def sample(self, batch_size: int):
        """随机采样一批经验"""
        batch = random.sample(self.buffer, batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)

        return (
            np.array(states),
            np.array(actions),
            np.array(rewards, dtype=np.float32),
            np.array(next_states),
            np.array(dones, dtype=np.float32)
        )

    def __len__(self):
        return len(self.buffer)


class QNetwork(nn.Module):
    """
    Q值网络
    """

    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 128):
        super().__init__()
        self.fc1 = nn.Linear(state_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, action_dim)

    def forward(self, x):
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        return self.fc3(x)


class DQN:
    """
    DQN 算法实现
    """

    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        lr: float = 1e-3,
        gamma: float = 0.99,
        epsilon_start: float = 1.0,
        epsilon_end: float = 0.01,
        epsilon_decay: float = 0.995,
        target_update_freq: int = 100,
        buffer_size: int = 100000,
        batch_size: int = 64
    ):
        self.action_dim = action_dim
        self.gamma = gamma
        self.epsilon = epsilon_start
        self.epsilon_end = epsilon_end
        self.epsilon_decay = epsilon_decay
        self.target_update_freq = target_update_freq
        self.batch_size = batch_size

        # Q网络和目标网络
        self.q_network = QNetwork(state_dim, action_dim)
        self.target_network = QNetwork(state_dim, action_dim)
        self.target_network.load_state_dict(self.q_network.state_dict())

        self.optimizer = optim.Adam(self.q_network.parameters(), lr=lr)
        self.buffer = ReplayBuffer(buffer_size)

        self.learn_step_counter = 0

    def select_action(self, state: np.ndarray) -> int:
        """Epsilon-Greedy 动作选择"""
        if np.random.random() < self.epsilon:
            return np.random.randint(self.action_dim)

        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        with torch.no_grad():
            q_values = self.q_network(state_tensor)
        return q_values.argmax().item()

    def store_transition(self, state, action, reward, next_state, done):
        """存储转移"""
        self.buffer.push(state, action, reward, next_state, done)

    def update(self) -> float:
        """
        从经验回放中学习

        Returns:
            损失值
        """
        if len(self.buffer) < self.batch_size:
            return 0.0

        # 采样
        states, actions, rewards, next_states, dones = self.buffer.sample(self.batch_size)

        states = torch.FloatTensor(states)
        actions = torch.LongTensor(actions)
        rewards = torch.FloatTensor(rewards)
        next_states = torch.FloatTensor(next_states)
        dones = torch.FloatTensor(dones)

        # 计算当前Q值
        current_q = self.q_network(states).gather(1, actions.unsqueeze(1)).squeeze(1)

        # 计算目标Q值（使用目标网络）
        with torch.no_grad():
            next_q = self.target_network(next_states).max(1)[0]
            target_q = rewards + self.gamma * next_q * (1 - dones)

        # 计算损失
        loss = F.mse_loss(current_q, target_q)

        # 更新网络
        self.optimizer.zero_grad()
        loss.backward()
        # 梯度裁剪
        torch.nn.utils.clip_grad_norm_(self.q_network.parameters(), 1.0)
        self.optimizer.step()

        # 定期更新目标网络
        self.learn_step_counter += 1
        if self.learn_step_counter % self.target_update_freq == 0:
            self.target_network.load_state_dict(self.q_network.state_dict())

        # 衰减探索率
        self.epsilon = max(self.epsilon_end, self.epsilon * self.epsilon_decay)

        return loss.item()


def train_dqn(
    env,
    agent: DQN,
    n_episodes: int = 500,
    max_steps: int = 500
):
    """训练 DQN 智能体"""
    episode_rewards = []

    for episode in range(n_episodes):
        state = env.reset()
        total_reward = 0

        for step in range(max_steps):
            action = agent.select_action(state)
            next_state, reward, done, _ = env.step(action)

            agent.store_transition(state, action, reward, next_state, done)
            loss = agent.update()

            state = next_state
            total_reward += reward

            if done:
                break

        episode_rewards.append(total_reward)

        if (episode + 1) % 50 == 0:
            avg_reward = np.mean(episode_rewards[-50:])
            print(f"Episode {episode + 1}, Avg Reward: {avg_reward:.2f}, Epsilon: {agent.epsilon:.3f}")

    return episode_rewards
```

### DQN改进版本

#### Double DQN

解决Q值过估计问题，使用在线网络选择动作，目标网络评估价值：

$$Q(s,a) \leftarrow r + \gamma Q_{target}(s', \arg\max_a Q_{online}(s', a))$$

```python
class DoubleDQN(DQN):
    """
    Double DQN 实现
    """

    def update(self) -> float:
        if len(self.buffer) < self.batch_size:
            return 0.0

        states, actions, rewards, next_states, dones = self.buffer.sample(self.batch_size)

        states = torch.FloatTensor(states)
        actions = torch.LongTensor(actions)
        rewards = torch.FloatTensor(rewards)
        next_states = torch.FloatTensor(next_states)
        dones = torch.FloatTensor(dones)

        # 当前Q值
        current_q = self.q_network(states).gather(1, actions.unsqueeze(1)).squeeze(1)

        # Double DQN: 用在线网络选择动作，目标网络评估
        with torch.no_grad():
            # 在线网络选择最优动作
            next_actions = self.q_network(next_states).argmax(1, keepdim=True)
            # 目标网络评估该动作的Q值
            next_q = self.target_network(next_states).gather(1, next_actions).squeeze(1)
            target_q = rewards + self.gamma * next_q * (1 - dones)

        loss = F.mse_loss(current_q, target_q)

        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.q_network.parameters(), 1.0)
        self.optimizer.step()

        self.learn_step_counter += 1
        if self.learn_step_counter % self.target_update_freq == 0:
            self.target_network.load_state_dict(self.q_network.state_dict())

        self.epsilon = max(self.epsilon_end, self.epsilon * self.epsilon_decay)

        return loss.item()
```

#### Dueling DQN

将Q值分解为状态价值V和优势函数A：

$$Q(s, a) = V(s) + A(s, a) - \frac{1}{|A|}\sum_{a'} A(s, a')$$

```python
class DuelingQNetwork(nn.Module):
    """
    Dueling DQN 网络结构
    """

    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 128):
        super().__init__()

        # 共享特征层
        self.feature = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU()
        )

        # 价值流
        self.value_stream = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 1)
        )

        # 优势流
        self.advantage_stream = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, action_dim)
        )

    def forward(self, x):
        features = self.feature(x)

        value = self.value_stream(features)
        advantage = self.advantage_stream(features)

        # Q = V + (A - mean(A))
        q_values = value + advantage - advantage.mean(dim=1, keepdim=True)

        return q_values
```

#### 优先经验回放（PER）

根据TD误差的大小对经验进行优先采样：

```python
class PrioritizedReplayBuffer:
    """
    优先经验回放缓冲区
    使用SumTree实现高效采样
    """

    def __init__(self, capacity: int = 100000, alpha: float = 0.6, beta: float = 0.4):
        self.capacity = capacity
        self.alpha = alpha  # 优先级指数
        self.beta = beta    # 重要性采样指数
        self.beta_increment = 0.001

        self.buffer = []
        self.priorities = np.zeros(capacity, dtype=np.float32)
        self.position = 0
        self.max_priority = 1.0

    def push(self, state, action, reward, next_state, done):
        """添加经验，初始优先级为最大值"""
        experience = (state, action, reward, next_state, done)

        if len(self.buffer) < self.capacity:
            self.buffer.append(experience)
        else:
            self.buffer[self.position] = experience

        self.priorities[self.position] = self.max_priority
        self.position = (self.position + 1) % self.capacity

    def sample(self, batch_size: int):
        """基于优先级采样"""
        n = len(self.buffer)

        # 计算采样概率
        priorities = self.priorities[:n] ** self.alpha
        probabilities = priorities / priorities.sum()

        # 采样索引
        indices = np.random.choice(n, batch_size, p=probabilities)

        # 计算重要性采样权重
        weights = (n * probabilities[indices]) ** (-self.beta)
        weights = weights / weights.max()

        # 获取经验
        batch = [self.buffer[i] for i in indices]
        states, actions, rewards, next_states, dones = zip(*batch)

        # 增加beta
        self.beta = min(1.0, self.beta + self.beta_increment)

        return (
            np.array(states),
            np.array(actions),
            np.array(rewards, dtype=np.float32),
            np.array(next_states),
            np.array(dones, dtype=np.float32),
            indices,
            torch.FloatTensor(weights)
        )

    def update_priorities(self, indices: np.ndarray, td_errors: np.ndarray):
        """根据TD误差更新优先级"""
        priorities = np.abs(td_errors) + 1e-6
        for idx, priority in zip(indices, priorities):
            self.priorities[idx] = priority
            self.max_priority = max(self.max_priority, priority)

    def __len__(self):
        return len(self.buffer)
```

---

## PPO算法

### PPO核心思想

近端策略优化（Proximal Policy Optimization，PPO）是目前最流行的策略梯度算法之一。它通过限制策略更新的幅度来保证训练稳定性。

**PPO-Clip 目标函数：**

$$L^{CLIP}(\theta) = \mathbb{E}_t\left[\min\left(r_t(\theta) \hat{A}_t, \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon) \hat{A}_t\right)\right]$$

其中概率比 $r_t(\theta) = \frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_{old}}(a_t|s_t)}$，$\hat{A}_t$ 是优势估计。

```python
class PPO:
    """
    PPO (Proximal Policy Optimization) 算法实现
    """

    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        lr: float = 3e-4,
        gamma: float = 0.99,
        gae_lambda: float = 0.95,
        clip_epsilon: float = 0.2,
        c1: float = 0.5,  # 价值损失系数
        c2: float = 0.01,  # 熵正则化系数
        n_epochs: int = 10,
        batch_size: int = 64
    ):
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_epsilon = clip_epsilon
        self.c1 = c1
        self.c2 = c2
        self.n_epochs = n_epochs
        self.batch_size = batch_size

        # Actor-Critic 网络
        self.policy = PolicyNetwork(state_dim, action_dim)
        self.value = nn.Sequential(
            nn.Linear(state_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 128),
            nn.ReLU(),
            nn.Linear(128, 1)
        )

        self.optimizer = optim.Adam(
            list(self.policy.parameters()) + list(self.value.parameters()),
            lr=lr
        )

        # 存储轨迹
        self.states = []
        self.actions = []
        self.log_probs = []
        self.rewards = []
        self.values = []
        self.dones = []

    def select_action(self, state: np.ndarray) -> int:
        state_tensor = torch.FloatTensor(state).unsqueeze(0)

        with torch.no_grad():
            probs = self.policy(state_tensor)
            value = self.value(state_tensor)

        dist = Categorical(probs)
        action = dist.sample()
        log_prob = dist.log_prob(action)

        self.states.append(state)
        self.actions.append(action.item())
        self.log_probs.append(log_prob.item())
        self.values.append(value.item())

        return action.item()

    def store_reward(self, reward: float, done: bool):
        self.rewards.append(reward)
        self.dones.append(done)

    def compute_gae(self, next_value: float) -> Tuple[np.ndarray, np.ndarray]:
        """
        计算广义优势估计 (GAE)
        """
        advantages = []
        returns = []
        gae = 0

        values = self.values + [next_value]

        for t in reversed(range(len(self.rewards))):
            if self.dones[t]:
                delta = self.rewards[t] - values[t]
                gae = delta
            else:
                delta = self.rewards[t] + self.gamma * values[t + 1] - values[t]
                gae = delta + self.gamma * self.gae_lambda * gae

            advantages.insert(0, gae)
            returns.insert(0, gae + values[t])

        return np.array(advantages), np.array(returns)

    def update(self, next_state: np.ndarray):
        """
        PPO 更新
        """
        # 计算下一状态的价值
        with torch.no_grad():
            next_value = self.value(
                torch.FloatTensor(next_state).unsqueeze(0)
            ).item()

        # 计算 GAE
        advantages, returns = self.compute_gae(next_value)

        # 转换为张量
        states = torch.FloatTensor(np.array(self.states))
        actions = torch.LongTensor(self.actions)
        old_log_probs = torch.FloatTensor(self.log_probs)
        advantages = torch.FloatTensor(advantages)
        returns = torch.FloatTensor(returns)

        # 标准化优势
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        # 多轮更新
        n_samples = len(self.states)

        for _ in range(self.n_epochs):
            # 随机打乱索引
            indices = np.random.permutation(n_samples)

            for start in range(0, n_samples, self.batch_size):
                end = start + self.batch_size
                batch_indices = indices[start:end]

                # 获取批次数据
                batch_states = states[batch_indices]
                batch_actions = actions[batch_indices]
                batch_old_log_probs = old_log_probs[batch_indices]
                batch_advantages = advantages[batch_indices]
                batch_returns = returns[batch_indices]

                # 计算新的log概率和熵
                probs = self.policy(batch_states)
                dist = Categorical(probs)
                new_log_probs = dist.log_prob(batch_actions)
                entropy = dist.entropy().mean()

                # 计算概率比
                ratio = torch.exp(new_log_probs - batch_old_log_probs)

                # PPO-Clip 目标
                surr1 = ratio * batch_advantages
                surr2 = torch.clamp(ratio, 1 - self.clip_epsilon, 1 + self.clip_epsilon) * batch_advantages
                policy_loss = -torch.min(surr1, surr2).mean()

                # 价值损失
                values = self.value(batch_states).squeeze()
                value_loss = F.mse_loss(values, batch_returns)

                # 总损失
                loss = policy_loss + self.c1 * value_loss - self.c2 * entropy

                # 更新
                self.optimizer.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(
                    list(self.policy.parameters()) + list(self.value.parameters()),
                    0.5
                )
                self.optimizer.step()

        # 清空轨迹
        self.states = []
        self.actions = []
        self.log_probs = []
        self.rewards = []
        self.values = []
        self.dones = []

        return policy_loss.item(), value_loss.item()


def train_ppo(
    env,
    agent: PPO,
    n_episodes: int = 1000,
    update_interval: int = 2048
):
    """训练 PPO 智能体"""
    episode_rewards = []
    total_steps = 0

    for episode in range(n_episodes):
        state = env.reset()
        done = False
        total_reward = 0

        while not done:
            action = agent.select_action(state)
            next_state, reward, done, _ = env.step(action)
            agent.store_reward(reward, done)

            state = next_state
            total_reward += reward
            total_steps += 1

            # 定期更新
            if total_steps % update_interval == 0:
                agent.update(next_state)

        episode_rewards.append(total_reward)

        if (episode + 1) % 50 == 0:
            avg_reward = np.mean(episode_rewards[-50:])
            print(f"Episode {episode + 1}, Avg Reward: {avg_reward:.2f}")

    return episode_rewards
```

---

## Actor-Critic方法

### A2C算法

优势Actor-Critic（Advantage Actor-Critic，A2C）是同步版本的Actor-Critic方法。

```python
class A2C:
    """
    Advantage Actor-Critic (A2C) 算法实现
    """

    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        lr: float = 3e-4,
        gamma: float = 0.99,
        entropy_coef: float = 0.01,
        value_coef: float = 0.5,
        n_steps: int = 5
    ):
        self.gamma = gamma
        self.entropy_coef = entropy_coef
        self.value_coef = value_coef
        self.n_steps = n_steps

        # Actor 网络
        self.actor = PolicyNetwork(state_dim, action_dim)

        # Critic 网络
        self.critic = nn.Sequential(
            nn.Linear(state_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 128),
            nn.ReLU(),
            nn.Linear(128, 1)
        )

        self.optimizer = optim.Adam(
            list(self.actor.parameters()) + list(self.critic.parameters()),
            lr=lr
        )

        # N-step 缓存
        self.states = []
        self.actions = []
        self.rewards = []
        self.dones = []

    def select_action(self, state: np.ndarray) -> Tuple[int, torch.Tensor, torch.Tensor]:
        state_tensor = torch.FloatTensor(state).unsqueeze(0)

        probs = self.actor(state_tensor)
        value = self.critic(state_tensor)

        dist = Categorical(probs)
        action = dist.sample()
        log_prob = dist.log_prob(action)
        entropy = dist.entropy()

        return action.item(), log_prob, entropy, value

    def compute_n_step_returns(self, next_value: float) -> List[float]:
        """计算N步回报"""
        returns = []
        R = next_value

        for reward, done in zip(reversed(self.rewards), reversed(self.dones)):
            if done:
                R = 0
            R = reward + self.gamma * R
            returns.insert(0, R)

        return returns

    def update(
        self,
        log_probs: List[torch.Tensor],
        values: List[torch.Tensor],
        entropies: List[torch.Tensor],
        next_state: np.ndarray,
        done: bool
    ):
        """
        A2C 更新
        """
        # 计算下一状态的价值
        with torch.no_grad():
            if done:
                next_value = 0
            else:
                next_value = self.critic(
                    torch.FloatTensor(next_state).unsqueeze(0)
                ).item()

        # 计算N步回报
        returns = self.compute_n_step_returns(next_value)
        returns = torch.FloatTensor(returns)

        # 将值转换为张量
        log_probs = torch.stack(log_probs)
        values = torch.cat(values).squeeze()
        entropies = torch.stack(entropies)

        # 计算优势
        advantages = returns - values.detach()

        # Actor 损失（策略梯度）
        actor_loss = -(log_probs * advantages).mean()

        # Critic 损失（价值函数）
        critic_loss = F.mse_loss(values, returns)

        # 熵正则化
        entropy_loss = -entropies.mean()

        # 总损失
        loss = actor_loss + self.value_coef * critic_loss + self.entropy_coef * entropy_loss

        # 更新
        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(
            list(self.actor.parameters()) + list(self.critic.parameters()),
            0.5
        )
        self.optimizer.step()

        # 清空缓存
        self.states = []
        self.actions = []
        self.rewards = []
        self.dones = []

        return actor_loss.item(), critic_loss.item()
```

### Actor-Critic 架构对比

| 算法 | 特点 | 优势 | 劣势 |
|------|------|------|------|
| A2C | 同步多环境 | 稳定，易于实现 | 样本效率一般 |
| A3C | 异步多线程 | 探索多样性 | 实现复杂 |
| PPO | 策略裁剪 | 稳定，性能好 | 超参数敏感 |
| SAC | 最大熵框架 | 样本效率高 | 计算开销大 |

---

## 实战案例

### 使用 Gymnasium 训练 CartPole

```python
import gymnasium as gym
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torch.distributions import Categorical
import numpy as np
from collections import deque


class ActorCritic(nn.Module):
    """
    共享特征的 Actor-Critic 网络
    """

    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 128):
        super().__init__()

        # 共享特征提取层
        self.shared = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU()
        )

        # Actor 头
        self.actor = nn.Linear(hidden_dim, action_dim)

        # Critic 头
        self.critic = nn.Linear(hidden_dim, 1)

    def forward(self, x):
        features = self.shared(x)
        action_probs = F.softmax(self.actor(features), dim=-1)
        value = self.critic(features)
        return action_probs, value


class CartPoleAgent:
    """
    CartPole 环境的 PPO 智能体
    """

    def __init__(
        self,
        state_dim: int = 4,
        action_dim: int = 2,
        lr: float = 3e-4,
        gamma: float = 0.99,
        gae_lambda: float = 0.95,
        clip_epsilon: float = 0.2,
        n_epochs: int = 4,
        batch_size: int = 64
    ):
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_epsilon = clip_epsilon
        self.n_epochs = n_epochs
        self.batch_size = batch_size

        self.network = ActorCritic(state_dim, action_dim)
        self.optimizer = optim.Adam(self.network.parameters(), lr=lr)

        self.memory = []

    def select_action(self, state: np.ndarray) -> Tuple[int, float, float]:
        state_tensor = torch.FloatTensor(state).unsqueeze(0)

        with torch.no_grad():
            action_probs, value = self.network(state_tensor)

        dist = Categorical(action_probs)
        action = dist.sample()
        log_prob = dist.log_prob(action)

        return action.item(), log_prob.item(), value.item()

    def store_transition(self, state, action, log_prob, reward, value, done):
        self.memory.append((state, action, log_prob, reward, value, done))

    def update(self):
        if len(self.memory) == 0:
            return 0.0, 0.0

        # 解包经验
        states, actions, old_log_probs, rewards, values, dones = zip(*self.memory)

        # 计算 GAE
        advantages = []
        returns = []
        gae = 0
        values = list(values) + [0]

        for t in reversed(range(len(rewards))):
            if dones[t]:
                delta = rewards[t] - values[t]
                gae = delta
            else:
                delta = rewards[t] + self.gamma * values[t + 1] - values[t]
                gae = delta + self.gamma * self.gae_lambda * gae

            advantages.insert(0, gae)
            returns.insert(0, gae + values[t])

        # 转换为张量
        states = torch.FloatTensor(np.array(states))
        actions = torch.LongTensor(actions)
        old_log_probs = torch.FloatTensor(old_log_probs)
        advantages = torch.FloatTensor(advantages)
        returns = torch.FloatTensor(returns)

        # 标准化优势
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        # PPO 更新
        total_policy_loss = 0
        total_value_loss = 0
        n_samples = len(states)

        for _ in range(self.n_epochs):
            indices = np.random.permutation(n_samples)

            for start in range(0, n_samples, self.batch_size):
                end = min(start + self.batch_size, n_samples)
                batch_idx = indices[start:end]

                batch_states = states[batch_idx]
                batch_actions = actions[batch_idx]
                batch_old_log_probs = old_log_probs[batch_idx]
                batch_advantages = advantages[batch_idx]
                batch_returns = returns[batch_idx]

                # 前向传播
                action_probs, values = self.network(batch_states)
                dist = Categorical(action_probs)
                new_log_probs = dist.log_prob(batch_actions)
                entropy = dist.entropy().mean()

                # 计算比率
                ratio = torch.exp(new_log_probs - batch_old_log_probs)

                # PPO-Clip 损失
                surr1 = ratio * batch_advantages
                surr2 = torch.clamp(ratio, 1 - self.clip_epsilon, 1 + self.clip_epsilon) * batch_advantages
                policy_loss = -torch.min(surr1, surr2).mean()

                # 价值损失
                value_loss = F.mse_loss(values.squeeze(), batch_returns)

                # 总损失
                loss = policy_loss + 0.5 * value_loss - 0.01 * entropy

                self.optimizer.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.network.parameters(), 0.5)
                self.optimizer.step()

                total_policy_loss += policy_loss.item()
                total_value_loss += value_loss.item()

        self.memory = []
        return total_policy_loss, total_value_loss


def train_cartpole():
    """
    训练 CartPole 环境
    """
    env = gym.make('CartPole-v1')
    agent = CartPoleAgent()

    n_episodes = 500
    update_interval = 2048
    episode_rewards = deque(maxlen=100)
    total_steps = 0

    for episode in range(n_episodes):
        state, _ = env.reset()
        done = False
        truncated = False
        total_reward = 0

        while not (done or truncated):
            action, log_prob, value = agent.select_action(state)
            next_state, reward, done, truncated, _ = env.step(action)

            agent.store_transition(state, action, log_prob, reward, value, done or truncated)

            state = next_state
            total_reward += reward
            total_steps += 1

            if total_steps % update_interval == 0:
                agent.update()

        episode_rewards.append(total_reward)

        if (episode + 1) % 20 == 0:
            avg_reward = np.mean(episode_rewards)
            print(f"Episode {episode + 1}, Avg Reward: {avg_reward:.2f}")

            if avg_reward >= 495:
                print(f"环境已解决！平均奖励: {avg_reward:.2f}")
                break

    env.close()
    return agent


if __name__ == "__main__":
    trained_agent = train_cartpole()
```

### 使用 Stable-Baselines3

```python
from stable_baselines3 import PPO, DQN, A2C
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.callbacks import EvalCallback
from stable_baselines3.common.evaluation import evaluate_policy
import gymnasium as gym


def train_with_sb3():
    """
    使用 Stable-Baselines3 训练智能体
    """
    # 创建向量化环境（并行训练）
    env = make_vec_env('CartPole-v1', n_envs=4)

    # 创建评估环境
    eval_env = gym.make('CartPole-v1')

    # 创建 PPO 模型
    model = PPO(
        policy='MlpPolicy',
        env=env,
        learning_rate=3e-4,
        n_steps=2048,
        batch_size=64,
        n_epochs=10,
        gamma=0.99,
        gae_lambda=0.95,
        clip_range=0.2,
        ent_coef=0.01,
        verbose=1
    )

    # 创建评估回调
    eval_callback = EvalCallback(
        eval_env,
        best_model_save_path='./logs/',
        log_path='./logs/',
        eval_freq=1000,
        deterministic=True,
        render=False
    )

    # 训练
    model.learn(
        total_timesteps=50000,
        callback=eval_callback
    )

    # 评估
    mean_reward, std_reward = evaluate_policy(model, eval_env, n_eval_episodes=10)
    print(f"平均奖励: {mean_reward:.2f} +/- {std_reward:.2f}")

    # 保存模型
    model.save("ppo_cartpole")

    return model


def compare_algorithms():
    """
    比较不同算法的性能
    """
    env_id = 'CartPole-v1'

    algorithms = {
        'PPO': PPO,
        'DQN': DQN,
        'A2C': A2C
    }

    results = {}

    for name, AlgoClass in algorithms.items():
        print(f"\n训练 {name}...")

        env = make_vec_env(env_id, n_envs=4)
        eval_env = gym.make(env_id)

        model = AlgoClass('MlpPolicy', env, verbose=0)
        model.learn(total_timesteps=50000)

        mean_reward, std_reward = evaluate_policy(model, eval_env, n_eval_episodes=20)
        results[name] = (mean_reward, std_reward)

        print(f"{name} - 平均奖励: {mean_reward:.2f} +/- {std_reward:.2f}")

        env.close()
        eval_env.close()

    return results


# 使用已训练的模型进行推理
def inference_demo():
    """
    加载并使用已训练的模型
    """
    env = gym.make('CartPole-v1', render_mode='human')
    model = PPO.load("ppo_cartpole")

    for episode in range(5):
        state, _ = env.reset()
        done = False
        truncated = False
        total_reward = 0

        while not (done or truncated):
            action, _ = model.predict(state, deterministic=True)
            state, reward, done, truncated, _ = env.step(action)
            total_reward += reward

        print(f"Episode {episode + 1}, Reward: {total_reward}")

    env.close()
```

---

## 面试要点

### 核心概念题

**Q1: 什么是探索与利用的权衡（Exploration-Exploitation Trade-off）？**

探索（Exploration）是尝试新的动作以发现可能更好的策略；利用（Exploitation）是选择当前已知的最优动作。

常见策略：
- **Epsilon-Greedy**：以概率 $\epsilon$ 随机探索，$1-\epsilon$ 贪婪选择
- **UCB**：Upper Confidence Bound，考虑不确定性
- **Boltzmann/Softmax**：按Q值的概率分布选择
- **Thompson Sampling**：基于贝叶斯方法

```python
def epsilon_greedy(Q, state, epsilon):
    if np.random.random() < epsilon:
        return np.random.randint(len(Q[state]))
    return np.argmax(Q[state])

def boltzmann(Q, state, temperature=1.0):
    q_values = Q[state]
    exp_q = np.exp(q_values / temperature)
    probs = exp_q / np.sum(exp_q)
    return np.random.choice(len(q_values), p=probs)
```

**Q2: On-Policy 和 Off-Policy 的区别是什么？**

- **On-Policy**（在策略）：用于生成数据的策略和被优化的策略是同一个
  - 例子：SARSA, A2C, PPO
  - 优点：更稳定
  - 缺点：样本效率低

- **Off-Policy**（离策略）：用于生成数据的策略（行为策略）和被优化的策略（目标策略）不同
  - 例子：Q-Learning, DQN
  - 优点：可以使用经验回放，样本效率高
  - 缺点：可能不稳定

**Q3: 为什么 DQN 需要目标网络？**

目标网络解决了训练不稳定的问题：

1. **问题**：在标准Q-Learning中，TD目标 $r + \gamma \max Q(s', a')$ 会随着网络更新而变化，导致训练不稳定
2. **解决**：使用固定的目标网络计算TD目标，定期从主网络同步参数
3. **效果**：降低了目标的非平稳性，提高了训练稳定性

**Q4: PPO 相比于普通策略梯度有什么优势？**

1. **样本效率**：可以对同一批数据进行多次更新
2. **稳定性**：通过裁剪限制策略更新幅度，避免过大的策略变化
3. **实现简单**：相比 TRPO 不需要复杂的约束优化
4. **性能优异**：在多种任务上表现出色

### 算法对比

| 特性 | Q-Learning | DQN | REINFORCE | PPO |
|------|-----------|-----|-----------|-----|
| 值函数/策略 | 值函数 | 值函数 | 策略 | Actor-Critic |
| 动作空间 | 离散 | 离散 | 离散/连续 | 离散/连续 |
| On/Off Policy | Off | Off | On | On |
| 样本效率 | 高 | 高 | 低 | 中等 |
| 稳定性 | 中 | 中 | 低 | 高 |

### 常见问题与解决方案

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 奖励稀疏 | 环境反馈不足 | 奖励塑造，好奇心驱动，HER |
| 训练不稳定 | 目标非平稳 | 目标网络，PPO裁剪 |
| 过拟合 | 数据相关性 | 经验回放，多环境 |
| 高方差 | 策略梯度固有问题 | 基线，GAE |
| 探索不足 | Epsilon衰减过快 | 熵正则化，好奇心 |

### 实践建议

1. **从简单算法开始**：先用DQN或PPO，确保环境设置正确
2. **监控关键指标**：奖励曲线、损失、熵、Q值分布
3. **超参数调优**：学习率、折扣因子、探索率尤为重要
4. **使用成熟框架**：Stable-Baselines3, RLlib, CleanRL
5. **正确设计奖励**：奖励塑造需要领域知识

---

## 总结

强化学习是一个丰富且不断发展的领域，本文涵盖了从基础概念到高级算法的核心内容：

1. **基础概念**：智能体、环境、状态、动作、奖励、策略
2. **数学框架**：MDP、贝尔曼方程、值函数
3. **经典算法**：Q-Learning、SARSA、策略迭代
4. **深度强化学习**：DQN及其变体、PPO、Actor-Critic
5. **实战技巧**：经验回放、目标网络、GAE、奖励塑造

掌握这些知识后，你可以继续探索更高级的主题，如：

- **多智能体强化学习**（MARL）
- **离线强化学习**（Offline RL）
- **基于模型的强化学习**（Model-based RL）
- **分层强化学习**（Hierarchical RL）
- **安全强化学习**（Safe RL）

## 参考资源

- [Sutton & Barto: Reinforcement Learning: An Introduction](http://incompleteideas.net/book/the-book-2nd.html)
- [OpenAI Spinning Up](https://spinningup.openai.com/)
- [Stable-Baselines3 Documentation](https://stable-baselines3.readthedocs.io/)
- [Deep RL Course by Hugging Face](https://huggingface.co/learn/deep-rl-course)
- [CleanRL: High-quality Implementations](https://github.com/vwxyzjn/cleanrl)
