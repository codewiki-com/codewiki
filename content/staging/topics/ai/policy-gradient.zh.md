---
title: 强化学习：策略梯度方法
description: 掌握策略梯度算法：REINFORCE、Actor-Critic、PPO和SAC
track: ai
section: deep-learning
difficulty: advanced
tags:
  - 策略梯度
  - PPO
  - Actor-Critic
  - 强化学习
status: imported
origin: old/src/content/docs/datascience/policy-gradient.zh.md
divergence: 0.313
issues: []
legacy:
  category: DataScience
  subcategory: RL
  order: 30
  lastUpdated: 2026-01-07
---

策略梯度（Policy Gradient）是强化学习中一类重要的算法，它直接对策略进行参数化并通过梯度上升来优化期望回报。与基于值函数的方法（如Q-Learning、DQN）不同，策略梯度方法可以处理连续动作空间，并且能够学习随机策略。本文将系统性地介绍策略梯度的核心理论、主流算法和实现技巧。

---

## 策略梯度基础

### 从值函数到策略函数

在强化学习中，我们有两种主要的方法来解决序贯决策问题：

**基于值函数的方法（Value-Based）：**
- 学习状态值函数 $V(s)$ 或动作值函数 $Q(s, a)$
- 策略是从值函数隐式导出的（如 $\epsilon$-greedy）
- 代表算法：Q-Learning、DQN、Double DQN

**基于策略的方法（Policy-Based）：**
- 直接参数化策略 $\pi_\theta(a|s)$
- 通过优化期望回报来学习策略参数
- 代表算法：REINFORCE、PPO、SAC

### 策略的参数化

策略 $\pi_\theta(a|s)$ 表示在状态 $s$ 下选择动作 $a$ 的概率分布，其中 $\theta$ 是策略的参数。

**离散动作空间：**

使用 softmax 函数将神经网络输出转换为概率分布：

$$\pi_\theta(a|s) = \frac{\exp(f_\theta(s, a))}{\sum_{a'} \exp(f_\theta(s, a'))}$$

**连续动作空间：**

通常使用高斯分布来表示策略：

$$\pi_\theta(a|s) = \mathcal{N}(\mu_\theta(s), \sigma_\theta(s)^2)$$

其中 $\mu_\theta(s)$ 是均值网络，$\sigma_\theta(s)$ 是标准差网络。

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.distributions import Categorical, Normal

class DiscretePolicy(nn.Module):
    """离散动作空间的策略网络"""
    def __init__(self, state_dim, action_dim, hidden_dim=128):
        super().__init__()
        self.fc1 = nn.Linear(state_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, action_dim)

    def forward(self, state):
        x = F.relu(self.fc1(state))
        x = F.relu(self.fc2(x))
        logits = self.fc3(x)
        return logits

    def get_action(self, state, deterministic=False):
        logits = self.forward(state)
        probs = F.softmax(logits, dim=-1)

        if deterministic:
            action = torch.argmax(probs, dim=-1)
        else:
            dist = Categorical(probs)
            action = dist.sample()

        return action, probs

class ContinuousPolicy(nn.Module):
    """连续动作空间的策略网络（高斯策略）"""
    def __init__(self, state_dim, action_dim, hidden_dim=256):
        super().__init__()
        self.fc1 = nn.Linear(state_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.mu_head = nn.Linear(hidden_dim, action_dim)
        self.log_std = nn.Parameter(torch.zeros(action_dim))

    def forward(self, state):
        x = F.relu(self.fc1(state))
        x = F.relu(self.fc2(x))
        mu = self.mu_head(x)
        std = torch.exp(self.log_std)
        return mu, std

    def get_action(self, state, deterministic=False):
        mu, std = self.forward(state)

        if deterministic:
            action = mu
        else:
            dist = Normal(mu, std)
            action = dist.rsample()  # 重参数化采样

        return action, dist
```

### 策略梯度的优势

| 特性 | 值函数方法 | 策略梯度方法 |
|------|-----------|-------------|
| 动作空间 | 主要处理离散动作 | 可处理连续动作 |
| 策略类型 | 确定性策略 | 可学习随机策略 |
| 收敛性 | 可能不收敛 | 有理论收敛保证 |
| 样本效率 | 相对较高 | 通常较低 |
| 高维动作 | 难以处理 | 可以处理 |

---

## 策略梯度定理

### 目标函数

策略梯度方法的目标是最大化期望累积回报：

$$J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}\left[\sum_{t=0}^{T} \gamma^t r_t\right]$$

其中 $\tau = (s_0, a_0, r_0, s_1, a_1, r_1, \ldots)$ 是一条轨迹，$\gamma$ 是折扣因子。

### 策略梯度定理推导

策略梯度定理告诉我们如何计算目标函数 $J(\theta)$ 对策略参数 $\theta$ 的梯度。

**轨迹概率：**

$$P(\tau|\theta) = p(s_0) \prod_{t=0}^{T-1} \pi_\theta(a_t|s_t) p(s_{t+1}|s_t, a_t)$$

**目标函数梯度：**

$$\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}\left[\sum_{t=0}^{T-1} \nabla_\theta \log \pi_\theta(a_t|s_t) \cdot G_t\right]$$

其中 $G_t = \sum_{k=t}^{T-1} \gamma^{k-t} r_k$ 是从时刻 $t$ 开始的回报（return）。

**推导过程（简化版）：**

1. 使用对数技巧：$\nabla_\theta P(\tau|\theta) = P(\tau|\theta) \nabla_\theta \log P(\tau|\theta)$

2. 轨迹的对数概率：
   $$\log P(\tau|\theta) = \log p(s_0) + \sum_{t=0}^{T-1} \left[\log \pi_\theta(a_t|s_t) + \log p(s_{t+1}|s_t, a_t)\right]$$

3. 对 $\theta$ 求梯度时，与 $\theta$ 无关的项消失：
   $$\nabla_\theta \log P(\tau|\theta) = \sum_{t=0}^{T-1} \nabla_\theta \log \pi_\theta(a_t|s_t)$$

4. 最终得到策略梯度：
   $$\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}\left[\sum_{t=0}^{T-1} \nabla_\theta \log \pi_\theta(a_t|s_t) \cdot R(\tau)\right]$$

### 策略梯度的直观理解

策略梯度的核心思想是：

- **增加高回报动作的概率**：如果某个动作导致了高回报，增加该动作的概率
- **减少低回报动作的概率**：如果某个动作导致了低回报，减少该动作的概率

$$\nabla_\theta J(\theta) \approx \sum_t \nabla_\theta \log \pi_\theta(a_t|s_t) \cdot R_t$$

- 当 $R_t > 0$：沿着 $\nabla_\theta \log \pi_\theta(a_t|s_t)$ 方向更新，增加 $\pi_\theta(a_t|s_t)$
- 当 $R_t < 0$：沿着反方向更新，减少 $\pi_\theta(a_t|s_t)$

---

## REINFORCE算法

### 算法原理

REINFORCE 是最基本的策略梯度算法，由 Williams（1992）提出。它使用蒙特卡洛方法来估计策略梯度。

**算法流程：**

1. 使用当前策略 $\pi_\theta$ 采集一条完整轨迹
2. 计算每个时刻的回报 $G_t$
3. 使用策略梯度更新参数

**梯度估计：**

$$\nabla_\theta J(\theta) \approx \frac{1}{N}\sum_{i=1}^{N}\sum_{t=0}^{T-1} \nabla_\theta \log \pi_\theta(a_t^{(i)}|s_t^{(i)}) \cdot G_t^{(i)}$$

### REINFORCE实现

```python
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torch.distributions import Categorical
import numpy as np
import gymnasium as gym

class REINFORCEAgent:
    """REINFORCE算法实现"""

    def __init__(self, state_dim, action_dim, hidden_dim=128, lr=1e-3, gamma=0.99):
        self.gamma = gamma
        self.policy = DiscretePolicy(state_dim, action_dim, hidden_dim)
        self.optimizer = optim.Adam(self.policy.parameters(), lr=lr)

        # 存储轨迹
        self.saved_log_probs = []
        self.rewards = []

    def select_action(self, state):
        state = torch.FloatTensor(state).unsqueeze(0)
        logits = self.policy(state)
        probs = F.softmax(logits, dim=-1)
        dist = Categorical(probs)
        action = dist.sample()

        # 保存log概率用于后续更新
        self.saved_log_probs.append(dist.log_prob(action))

        return action.item()

    def store_reward(self, reward):
        self.rewards.append(reward)

    def compute_returns(self):
        """计算折扣回报"""
        returns = []
        G = 0
        for r in reversed(self.rewards):
            G = r + self.gamma * G
            returns.insert(0, G)
        returns = torch.tensor(returns)

        # 标准化回报（减少方差）
        returns = (returns - returns.mean()) / (returns.std() + 1e-8)

        return returns

    def update(self):
        """策略更新"""
        returns = self.compute_returns()

        policy_loss = []
        for log_prob, G in zip(self.saved_log_probs, returns):
            # 负号是因为我们要最大化期望回报
            policy_loss.append(-log_prob * G)

        policy_loss = torch.stack(policy_loss).sum()

        self.optimizer.zero_grad()
        policy_loss.backward()
        self.optimizer.step()

        # 清空轨迹
        self.saved_log_probs = []
        self.rewards = []

        return policy_loss.item()

def train_reinforce(env_name='CartPole-v1', num_episodes=1000):
    """训练REINFORCE算法"""
    env = gym.make(env_name)
    state_dim = env.observation_space.shape[0]
    action_dim = env.action_space.n

    agent = REINFORCEAgent(state_dim, action_dim)

    episode_rewards = []

    for episode in range(num_episodes):
        state, _ = env.reset()
        episode_reward = 0

        while True:
            action = agent.select_action(state)
            next_state, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated

            agent.store_reward(reward)
            episode_reward += reward
            state = next_state

            if done:
                break

        loss = agent.update()
        episode_rewards.append(episode_reward)

        if (episode + 1) % 100 == 0:
            avg_reward = np.mean(episode_rewards[-100:])
            print(f'Episode {episode + 1}, Avg Reward: {avg_reward:.2f}, Loss: {loss:.4f}')

    env.close()
    return agent, episode_rewards
```

### REINFORCE的局限性

1. **高方差**：蒙特卡洛采样导致梯度估计方差很大
2. **样本效率低**：需要完整轨迹，无法在线学习
3. **收敛慢**：高方差导致收敛速度慢

---

## 优势函数与基线

### 基线的作用

为了减少策略梯度的方差，我们可以引入一个基线 $b(s)$：

$$\nabla_\theta J(\theta) = \mathbb{E}\left[\sum_{t=0}^{T-1} \nabla_\theta \log \pi_\theta(a_t|s_t) \cdot (G_t - b(s_t))\right]$$

**关键性质**：减去基线不会改变梯度的期望值（无偏），但可以显著降低方差。

**证明（无偏性）：**

$$\mathbb{E}_{a \sim \pi_\theta}\left[\nabla_\theta \log \pi_\theta(a|s) \cdot b(s)\right] = b(s) \cdot \mathbb{E}_{a \sim \pi_\theta}\left[\nabla_\theta \log \pi_\theta(a|s)\right] = 0$$

因为 $\mathbb{E}_{a \sim \pi_\theta}\left[\nabla_\theta \log \pi_\theta(a|s)\right] = \nabla_\theta \sum_a \pi_\theta(a|s) = \nabla_\theta 1 = 0$

### 状态值函数作为基线

最常用的基线是状态值函数 $V(s)$，此时得到的差值称为**优势函数**（Advantage Function）：

$$A(s, a) = Q(s, a) - V(s)$$

优势函数的直观含义：动作 $a$ 相比于平均动作的"优势"有多大。

- $A(s, a) > 0$：动作 $a$ 比平均好
- $A(s, a) < 0$：动作 $a$ 比平均差

### 优势函数的估计方法

**方法1：蒙特卡洛估计**

$$\hat{A}_t = G_t - V(s_t)$$

**方法2：时序差分（TD）估计**

$$\hat{A}_t = r_t + \gamma V(s_{t+1}) - V(s_t)$$

**方法3：广义优势估计（GAE）**

GAE 在偏差和方差之间取得平衡：

$$\hat{A}_t^{GAE(\gamma, \lambda)} = \sum_{l=0}^{\infty} (\gamma\lambda)^l \delta_{t+l}$$

其中 $\delta_t = r_t + \gamma V(s_{t+1}) - V(s_t)$ 是 TD 误差。

```python
def compute_gae(rewards, values, next_value, gamma=0.99, lam=0.95):
    """计算广义优势估计（GAE）"""
    values = values + [next_value]
    gae = 0
    advantages = []

    for t in reversed(range(len(rewards))):
        delta = rewards[t] + gamma * values[t + 1] - values[t]
        gae = delta + gamma * lam * gae
        advantages.insert(0, gae)

    return advantages

def compute_returns_from_advantages(advantages, values):
    """从优势函数计算回报"""
    returns = [adv + val for adv, val in zip(advantages, values)]
    return returns
```

### GAE的超参数

- $\lambda = 0$：等价于单步 TD，低方差高偏差
- $\lambda = 1$：等价于蒙特卡洛，高方差低偏差
- 实践中通常使用 $\lambda = 0.95$

---

## Actor-Critic框架

### 框架概述

Actor-Critic 方法结合了策略梯度（Actor）和值函数估计（Critic）的优点：

- **Actor（演员）**：策略网络 $\pi_\theta(a|s)$，负责选择动作
- **Critic（评论家）**：值函数网络 $V_\phi(s)$ 或 $Q_\phi(s, a)$，负责评估动作

### Actor-Critic更新规则

**Critic更新**（最小化值函数误差）：

$$\mathcal{L}_{critic} = \mathbb{E}\left[(V_\phi(s) - G_t)^2\right]$$

或使用 TD 目标：

$$\mathcal{L}_{critic} = \mathbb{E}\left[(V_\phi(s) - (r + \gamma V_\phi(s')))^2\right]$$

**Actor更新**（策略梯度）：

$$\nabla_\theta J(\theta) = \mathbb{E}\left[\nabla_\theta \log \pi_\theta(a|s) \cdot \hat{A}(s, a)\right]$$

### Actor-Critic实现

```python
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torch.distributions import Categorical
import numpy as np

class ActorCritic(nn.Module):
    """Actor-Critic网络"""

    def __init__(self, state_dim, action_dim, hidden_dim=256):
        super().__init__()

        # 共享特征提取层
        self.shared = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU()
        )

        # Actor头（策略）
        self.actor = nn.Linear(hidden_dim, action_dim)

        # Critic头（值函数）
        self.critic = nn.Linear(hidden_dim, 1)

    def forward(self, state):
        shared_features = self.shared(state)

        # Actor输出动作概率
        action_logits = self.actor(shared_features)
        action_probs = F.softmax(action_logits, dim=-1)

        # Critic输出状态值
        state_value = self.critic(shared_features)

        return action_probs, state_value

    def get_action(self, state, deterministic=False):
        action_probs, state_value = self.forward(state)
        dist = Categorical(action_probs)

        if deterministic:
            action = torch.argmax(action_probs, dim=-1)
        else:
            action = dist.sample()

        log_prob = dist.log_prob(action)
        entropy = dist.entropy()

        return action, log_prob, state_value, entropy

class ActorCriticAgent:
    """Actor-Critic智能体"""

    def __init__(self, state_dim, action_dim, hidden_dim=256,
                 lr=3e-4, gamma=0.99, gae_lambda=0.95,
                 entropy_coef=0.01, value_coef=0.5):

        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.entropy_coef = entropy_coef
        self.value_coef = value_coef

        self.network = ActorCritic(state_dim, action_dim, hidden_dim)
        self.optimizer = optim.Adam(self.network.parameters(), lr=lr)

        # 存储轨迹
        self.states = []
        self.actions = []
        self.rewards = []
        self.values = []
        self.log_probs = []
        self.entropies = []
        self.dones = []

    def select_action(self, state):
        state = torch.FloatTensor(state).unsqueeze(0)
        action, log_prob, value, entropy = self.network.get_action(state)

        self.states.append(state)
        self.actions.append(action)
        self.values.append(value)
        self.log_probs.append(log_prob)
        self.entropies.append(entropy)

        return action.item()

    def store_transition(self, reward, done):
        self.rewards.append(reward)
        self.dones.append(done)

    def compute_gae(self, next_value):
        """计算GAE"""
        values = self.values + [next_value]
        gae = 0
        advantages = []

        for t in reversed(range(len(self.rewards))):
            if self.dones[t]:
                delta = self.rewards[t] - values[t]
                gae = delta
            else:
                delta = self.rewards[t] + self.gamma * values[t + 1] - values[t]
                gae = delta + self.gamma * self.gae_lambda * gae
            advantages.insert(0, gae)

        return torch.tensor(advantages)

    def update(self, next_state):
        """更新Actor和Critic"""
        next_state = torch.FloatTensor(next_state).unsqueeze(0)
        _, next_value = self.network(next_state)
        next_value = next_value.detach()

        advantages = self.compute_gae(next_value)
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        # 计算returns
        values = torch.cat(self.values).squeeze()
        returns = advantages + values.detach()

        # 计算损失
        log_probs = torch.cat(self.log_probs)
        entropies = torch.cat(self.entropies)

        # Actor损失（策略梯度）
        actor_loss = -(log_probs * advantages.detach()).mean()

        # Critic损失（值函数误差）
        critic_loss = F.mse_loss(values, returns)

        # 熵正则化
        entropy_loss = -entropies.mean()

        # 总损失
        loss = actor_loss + self.value_coef * critic_loss + self.entropy_coef * entropy_loss

        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.network.parameters(), 0.5)
        self.optimizer.step()

        # 清空轨迹
        self.clear_memory()

        return {
            'actor_loss': actor_loss.item(),
            'critic_loss': critic_loss.item(),
            'entropy': -entropy_loss.item()
        }

    def clear_memory(self):
        self.states = []
        self.actions = []
        self.rewards = []
        self.values = []
        self.log_probs = []
        self.entropies = []
        self.dones = []
```

---

## A2C与A3C

### A2C（Advantage Actor-Critic）

A2C 是 Actor-Critic 的同步版本，使用多个并行环境来收集经验：

```python
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from multiprocessing import Process, Pipe

class A2CAgent:
    """A2C（同步Actor-Critic）"""

    def __init__(self, state_dim, action_dim, num_envs=4,
                 hidden_dim=256, lr=7e-4, gamma=0.99,
                 gae_lambda=0.95, num_steps=5):

        self.num_envs = num_envs
        self.num_steps = num_steps
        self.gamma = gamma
        self.gae_lambda = gae_lambda

        self.network = ActorCritic(state_dim, action_dim, hidden_dim)
        self.optimizer = optim.RMSprop(self.network.parameters(), lr=lr, alpha=0.99, eps=1e-5)

    def collect_rollouts(self, envs, states):
        """收集n步轨迹"""
        rollout_states = []
        rollout_actions = []
        rollout_rewards = []
        rollout_dones = []
        rollout_values = []
        rollout_log_probs = []

        current_states = states

        for _ in range(self.num_steps):
            states_tensor = torch.FloatTensor(current_states)

            with torch.no_grad():
                action_probs, values = self.network(states_tensor)

            dist = torch.distributions.Categorical(action_probs)
            actions = dist.sample()
            log_probs = dist.log_prob(actions)

            rollout_states.append(current_states.copy())
            rollout_actions.append(actions.numpy())
            rollout_values.append(values.squeeze().numpy())
            rollout_log_probs.append(log_probs.numpy())

            # 执行动作
            next_states = []
            rewards = []
            dones = []

            for i, env in enumerate(envs):
                next_state, reward, terminated, truncated, _ = env.step(actions[i].item())
                done = terminated or truncated

                if done:
                    next_state, _ = env.reset()

                next_states.append(next_state)
                rewards.append(reward)
                dones.append(done)

            rollout_rewards.append(np.array(rewards))
            rollout_dones.append(np.array(dones))
            current_states = np.array(next_states)

        return {
            'states': np.array(rollout_states),
            'actions': np.array(rollout_actions),
            'rewards': np.array(rollout_rewards),
            'dones': np.array(rollout_dones),
            'values': np.array(rollout_values),
            'log_probs': np.array(rollout_log_probs),
            'next_states': current_states
        }

    def compute_advantages(self, rollout):
        """计算GAE优势"""
        rewards = rollout['rewards']
        values = rollout['values']
        dones = rollout['dones']
        next_states = rollout['next_states']

        with torch.no_grad():
            _, next_values = self.network(torch.FloatTensor(next_states))
            next_values = next_values.squeeze().numpy()

        advantages = np.zeros_like(rewards)
        last_gae = 0

        for t in reversed(range(self.num_steps)):
            if t == self.num_steps - 1:
                next_value = next_values
            else:
                next_value = values[t + 1]

            next_non_terminal = 1.0 - dones[t]
            delta = rewards[t] + self.gamma * next_value * next_non_terminal - values[t]
            advantages[t] = last_gae = delta + self.gamma * self.gae_lambda * next_non_terminal * last_gae

        returns = advantages + values
        return advantages, returns

    def update(self, rollout):
        """更新网络"""
        advantages, returns = self.compute_advantages(rollout)

        # 展平数据
        states = torch.FloatTensor(rollout['states'].reshape(-1, rollout['states'].shape[-1]))
        actions = torch.LongTensor(rollout['actions'].reshape(-1))
        old_log_probs = torch.FloatTensor(rollout['log_probs'].reshape(-1))
        advantages = torch.FloatTensor(advantages.reshape(-1))
        returns = torch.FloatTensor(returns.reshape(-1))

        # 标准化优势
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        # 前向传播
        action_probs, values = self.network(states)
        values = values.squeeze()

        dist = torch.distributions.Categorical(action_probs)
        log_probs = dist.log_prob(actions)
        entropy = dist.entropy().mean()

        # 计算损失
        actor_loss = -(log_probs * advantages.detach()).mean()
        critic_loss = F.mse_loss(values, returns)

        loss = actor_loss + 0.5 * critic_loss - 0.01 * entropy

        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.network.parameters(), 0.5)
        self.optimizer.step()

        return {
            'loss': loss.item(),
            'actor_loss': actor_loss.item(),
            'critic_loss': critic_loss.item(),
            'entropy': entropy.item()
        }
```

### A3C（Asynchronous Advantage Actor-Critic）

A3C 使用多个异步工作进程并行训练：

**核心思想：**
1. 多个 worker 并行与环境交互
2. 每个 worker 独立计算梯度
3. 异步更新全局网络参数

**A3C的优势：**
- 并行化加速训练
- 异步更新减少相关性
- 不需要经验回放

**注意：** 由于 Python 的 GIL 限制和 GPU 的高效并行，实践中 A2C 通常比 A3C 更受欢迎。

---

## PPO近端策略优化

### PPO概述

PPO（Proximal Policy Optimization）是 OpenAI 于 2017 年提出的算法，它通过限制策略更新的幅度来保证训练稳定性，同时保持较高的样本效率。

**核心思想：**
- 限制新策略与旧策略之间的差距
- 在保证性能提升的同时避免策略崩溃

### 重要性采样

PPO 使用重要性采样来复用旧策略采集的数据：

$$\frac{\pi_\theta(a|s)}{\pi_{\theta_{old}}(a|s)} \cdot A(s, a)$$

定义概率比：

$$r_t(\theta) = \frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_{old}}(a_t|s_t)}$$

### PPO-Clip目标函数

PPO-Clip 通过裁剪来限制策略更新：

$$L^{CLIP}(\theta) = \mathbb{E}_t\left[\min\left(r_t(\theta)\hat{A}_t, \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon)\hat{A}_t\right)\right]$$

其中 $\epsilon$ 通常取 0.1 或 0.2。

**直观理解：**
- 当 $\hat{A}_t > 0$（好动作）：限制 $r_t$ 不超过 $1+\epsilon$
- 当 $\hat{A}_t < 0$（坏动作）：限制 $r_t$ 不低于 $1-\epsilon$

### PPO完整实现

```python
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torch.distributions import Categorical, Normal
import numpy as np
import gymnasium as gym

class PPOMemory:
    """PPO经验存储"""

    def __init__(self):
        self.states = []
        self.actions = []
        self.rewards = []
        self.values = []
        self.log_probs = []
        self.dones = []

    def store(self, state, action, reward, value, log_prob, done):
        self.states.append(state)
        self.actions.append(action)
        self.rewards.append(reward)
        self.values.append(value)
        self.log_probs.append(log_prob)
        self.dones.append(done)

    def clear(self):
        self.states = []
        self.actions = []
        self.rewards = []
        self.values = []
        self.log_probs = []
        self.dones = []

    def get_batch(self):
        return (
            np.array(self.states),
            np.array(self.actions),
            np.array(self.rewards),
            np.array(self.values),
            np.array(self.log_probs),
            np.array(self.dones)
        )

class PPOActorCritic(nn.Module):
    """PPO的Actor-Critic网络"""

    def __init__(self, state_dim, action_dim, hidden_dim=64, continuous=False):
        super().__init__()
        self.continuous = continuous

        # 共享层
        self.shared = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.Tanh()
        )

        # Actor
        if continuous:
            self.actor_mean = nn.Linear(hidden_dim, action_dim)
            self.actor_log_std = nn.Parameter(torch.zeros(1, action_dim))
        else:
            self.actor = nn.Linear(hidden_dim, action_dim)

        # Critic
        self.critic = nn.Linear(hidden_dim, 1)

        # 初始化
        self.apply(self._init_weights)

    def _init_weights(self, m):
        if isinstance(m, nn.Linear):
            nn.init.orthogonal_(m.weight, gain=np.sqrt(2))
            nn.init.constant_(m.bias, 0)

    def forward(self, state):
        shared_features = self.shared(state)
        value = self.critic(shared_features)

        if self.continuous:
            mean = self.actor_mean(shared_features)
            std = torch.exp(self.actor_log_std.expand_as(mean))
            dist = Normal(mean, std)
        else:
            logits = self.actor(shared_features)
            dist = Categorical(logits=logits)

        return dist, value

    def get_value(self, state):
        shared_features = self.shared(state)
        return self.critic(shared_features)

class PPOAgent:
    """PPO智能体"""

    def __init__(self, state_dim, action_dim, hidden_dim=64,
                 lr=3e-4, gamma=0.99, gae_lambda=0.95,
                 clip_epsilon=0.2, c1=0.5, c2=0.01,
                 update_epochs=10, mini_batch_size=64,
                 continuous=False):

        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_epsilon = clip_epsilon
        self.c1 = c1  # 值函数损失系数
        self.c2 = c2  # 熵正则化系数
        self.update_epochs = update_epochs
        self.mini_batch_size = mini_batch_size
        self.continuous = continuous

        self.network = PPOActorCritic(state_dim, action_dim, hidden_dim, continuous)
        self.optimizer = optim.Adam(self.network.parameters(), lr=lr, eps=1e-5)
        self.memory = PPOMemory()

    def select_action(self, state):
        state = torch.FloatTensor(state).unsqueeze(0)

        with torch.no_grad():
            dist, value = self.network(state)
            action = dist.sample()
            log_prob = dist.log_prob(action)

            if self.continuous:
                log_prob = log_prob.sum(dim=-1)

        return (
            action.squeeze().numpy() if self.continuous else action.item(),
            value.item(),
            log_prob.item()
        )

    def store_transition(self, state, action, reward, value, log_prob, done):
        self.memory.store(state, action, reward, value, log_prob, done)

    def compute_gae(self, rewards, values, dones, next_value):
        """计算GAE"""
        advantages = np.zeros_like(rewards)
        last_gae = 0

        for t in reversed(range(len(rewards))):
            if t == len(rewards) - 1:
                next_val = next_value
            else:
                next_val = values[t + 1]

            next_non_terminal = 1.0 - dones[t]
            delta = rewards[t] + self.gamma * next_val * next_non_terminal - values[t]
            advantages[t] = last_gae = delta + self.gamma * self.gae_lambda * next_non_terminal * last_gae

        returns = advantages + values
        return advantages, returns

    def update(self, next_state):
        """PPO更新"""
        states, actions, rewards, values, old_log_probs, dones = self.memory.get_batch()

        # 计算下一个状态的值
        next_state = torch.FloatTensor(next_state).unsqueeze(0)
        with torch.no_grad():
            next_value = self.network.get_value(next_state).item()

        # 计算GAE
        advantages, returns = self.compute_gae(rewards, values, dones, next_value)

        # 转换为张量
        states = torch.FloatTensor(states)
        if self.continuous:
            actions = torch.FloatTensor(actions)
        else:
            actions = torch.LongTensor(actions)
        old_log_probs = torch.FloatTensor(old_log_probs)
        advantages = torch.FloatTensor(advantages)
        returns = torch.FloatTensor(returns)

        # 标准化优势
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        # 多轮更新
        batch_size = len(states)
        total_loss = 0

        for _ in range(self.update_epochs):
            # 随机打乱
            indices = np.random.permutation(batch_size)

            for start in range(0, batch_size, self.mini_batch_size):
                end = start + self.mini_batch_size
                batch_indices = indices[start:end]

                batch_states = states[batch_indices]
                batch_actions = actions[batch_indices]
                batch_old_log_probs = old_log_probs[batch_indices]
                batch_advantages = advantages[batch_indices]
                batch_returns = returns[batch_indices]

                # 前向传播
                dist, values = self.network(batch_states)

                if self.continuous:
                    new_log_probs = dist.log_prob(batch_actions).sum(dim=-1)
                else:
                    new_log_probs = dist.log_prob(batch_actions)

                entropy = dist.entropy().mean()

                # 计算比率
                ratio = torch.exp(new_log_probs - batch_old_log_probs)

                # PPO-Clip目标
                surr1 = ratio * batch_advantages
                surr2 = torch.clamp(ratio, 1 - self.clip_epsilon, 1 + self.clip_epsilon) * batch_advantages
                actor_loss = -torch.min(surr1, surr2).mean()

                # 值函数损失
                values = values.squeeze()
                critic_loss = F.mse_loss(values, batch_returns)

                # 总损失
                loss = actor_loss + self.c1 * critic_loss - self.c2 * entropy

                self.optimizer.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.network.parameters(), 0.5)
                self.optimizer.step()

                total_loss += loss.item()

        self.memory.clear()

        return {
            'loss': total_loss / (self.update_epochs * (batch_size // self.mini_batch_size + 1)),
            'actor_loss': actor_loss.item(),
            'critic_loss': critic_loss.item(),
            'entropy': entropy.item()
        }

def train_ppo(env_name='CartPole-v1', num_episodes=500, rollout_length=2048):
    """训练PPO"""
    env = gym.make(env_name)
    state_dim = env.observation_space.shape[0]

    continuous = isinstance(env.action_space, gym.spaces.Box)
    action_dim = env.action_space.shape[0] if continuous else env.action_space.n

    agent = PPOAgent(state_dim, action_dim, continuous=continuous)

    state, _ = env.reset()
    episode_reward = 0
    episode_rewards = []
    episode_count = 0
    step = 0

    while episode_count < num_episodes:
        # 收集rollout
        for _ in range(rollout_length):
            action, value, log_prob = agent.select_action(state)
            next_state, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated

            agent.store_transition(state, action, reward, value, log_prob, done)
            episode_reward += reward
            step += 1

            if done:
                episode_rewards.append(episode_reward)
                episode_count += 1
                episode_reward = 0
                state, _ = env.reset()

                if episode_count % 10 == 0:
                    avg_reward = np.mean(episode_rewards[-10:])
                    print(f'Episode {episode_count}, Avg Reward: {avg_reward:.2f}')
            else:
                state = next_state

        # PPO更新
        metrics = agent.update(state)

    env.close()
    return agent, episode_rewards
```

### PPO的变体

**PPO-Penalty**：使用 KL 散度惩罚而非裁剪

$$L^{KLPEN}(\theta) = \mathbb{E}_t\left[r_t(\theta)\hat{A}_t - \beta \cdot KL[\pi_{\theta_{old}}, \pi_\theta]\right]$$

**PPO with Dual Clip**：对负优势的情况也进行裁剪，进一步提高稳定性

---

## SAC软Actor-Critic

### 最大熵强化学习

SAC（Soft Actor-Critic）基于最大熵强化学习框架，在最大化回报的同时最大化策略的熵：

$$J(\pi) = \sum_{t=0}^{T} \mathbb{E}_{(s_t, a_t) \sim \rho_\pi}\left[r(s_t, a_t) + \alpha \mathcal{H}(\pi(\cdot|s_t))\right]$$

其中 $\mathcal{H}(\pi(\cdot|s)) = -\mathbb{E}_{a \sim \pi}[\log \pi(a|s)]$ 是策略的熵，$\alpha$ 是温度参数。

**最大熵的好处：**
1. 鼓励探索
2. 提高鲁棒性
3. 学习多模态策略

### SAC的核心组件

SAC 包含五个神经网络：
1. **策略网络** $\pi_\phi$：输出动作分布
2. **两个Q网络** $Q_{\theta_1}$, $Q_{\theta_2}$：估计动作值（双Q减少过估计）
3. **两个目标Q网络** $Q_{\bar{\theta}_1}$, $Q_{\bar{\theta}_2}$：软更新的目标网络

### SAC更新规则

**Q函数更新**：

$$\mathcal{L}_Q(\theta_i) = \mathbb{E}_{(s,a,r,s') \sim \mathcal{D}}\left[\left(Q_{\theta_i}(s,a) - y\right)^2\right]$$

其中目标值：
$$y = r + \gamma\left(\min_{j=1,2}Q_{\bar{\theta}_j}(s', a') - \alpha \log \pi_\phi(a'|s')\right), \quad a' \sim \pi_\phi(\cdot|s')$$

**策略更新**：

$$\mathcal{L}_\pi(\phi) = \mathbb{E}_{s \sim \mathcal{D}, a \sim \pi_\phi}\left[\alpha \log \pi_\phi(a|s) - \min_{j=1,2}Q_{\theta_j}(s, a)\right]$$

**温度自动调节**：

$$\mathcal{L}(\alpha) = \mathbb{E}_{a \sim \pi}\left[-\alpha(\log \pi(a|s) + \bar{\mathcal{H}})\right]$$

其中 $\bar{\mathcal{H}}$ 是目标熵（通常设为 $-\dim(\mathcal{A})$）。

### SAC完整实现

```python
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torch.distributions import Normal
import numpy as np
from collections import deque
import random

class ReplayBuffer:
    """经验回放缓冲区"""

    def __init__(self, capacity=1000000):
        self.buffer = deque(maxlen=capacity)

    def push(self, state, action, reward, next_state, done):
        self.buffer.append((state, action, reward, next_state, done))

    def sample(self, batch_size):
        batch = random.sample(self.buffer, batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)

        return (
            torch.FloatTensor(np.array(states)),
            torch.FloatTensor(np.array(actions)),
            torch.FloatTensor(np.array(rewards)).unsqueeze(1),
            torch.FloatTensor(np.array(next_states)),
            torch.FloatTensor(np.array(dones)).unsqueeze(1)
        )

    def __len__(self):
        return len(self.buffer)

class SACPolicy(nn.Module):
    """SAC策略网络（高斯策略）"""

    LOG_STD_MIN = -20
    LOG_STD_MAX = 2

    def __init__(self, state_dim, action_dim, hidden_dim=256, action_scale=1.0):
        super().__init__()
        self.action_scale = action_scale

        self.fc1 = nn.Linear(state_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.mean = nn.Linear(hidden_dim, action_dim)
        self.log_std = nn.Linear(hidden_dim, action_dim)

    def forward(self, state):
        x = F.relu(self.fc1(state))
        x = F.relu(self.fc2(x))
        mean = self.mean(x)
        log_std = self.log_std(x)
        log_std = torch.clamp(log_std, self.LOG_STD_MIN, self.LOG_STD_MAX)
        return mean, log_std

    def sample(self, state):
        mean, log_std = self.forward(state)
        std = torch.exp(log_std)

        # 重参数化技巧
        normal = Normal(mean, std)
        x_t = normal.rsample()

        # 使用tanh压缩到[-1, 1]
        action = torch.tanh(x_t) * self.action_scale

        # 计算log概率（需要考虑tanh变换的雅可比行列式）
        log_prob = normal.log_prob(x_t)
        log_prob -= torch.log(self.action_scale * (1 - action.pow(2)) + 1e-6)
        log_prob = log_prob.sum(dim=-1, keepdim=True)

        return action, log_prob, mean

class SACQNetwork(nn.Module):
    """SAC Q网络"""

    def __init__(self, state_dim, action_dim, hidden_dim=256):
        super().__init__()
        self.fc1 = nn.Linear(state_dim + action_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, 1)

    def forward(self, state, action):
        x = torch.cat([state, action], dim=-1)
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        q = self.fc3(x)
        return q

class SACAgent:
    """SAC智能体"""

    def __init__(self, state_dim, action_dim, action_scale=1.0,
                 hidden_dim=256, lr=3e-4, gamma=0.99, tau=0.005,
                 alpha=0.2, auto_alpha=True, target_entropy=None,
                 buffer_size=1000000, batch_size=256):

        self.gamma = gamma
        self.tau = tau
        self.alpha = alpha
        self.auto_alpha = auto_alpha
        self.batch_size = batch_size
        self.action_dim = action_dim

        # 策略网络
        self.policy = SACPolicy(state_dim, action_dim, hidden_dim, action_scale)
        self.policy_optimizer = optim.Adam(self.policy.parameters(), lr=lr)

        # 双Q网络
        self.q1 = SACQNetwork(state_dim, action_dim, hidden_dim)
        self.q2 = SACQNetwork(state_dim, action_dim, hidden_dim)
        self.q1_target = SACQNetwork(state_dim, action_dim, hidden_dim)
        self.q2_target = SACQNetwork(state_dim, action_dim, hidden_dim)

        # 复制参数到目标网络
        self.q1_target.load_state_dict(self.q1.state_dict())
        self.q2_target.load_state_dict(self.q2.state_dict())

        self.q1_optimizer = optim.Adam(self.q1.parameters(), lr=lr)
        self.q2_optimizer = optim.Adam(self.q2.parameters(), lr=lr)

        # 自动温度调节
        if auto_alpha:
            self.target_entropy = target_entropy if target_entropy else -action_dim
            self.log_alpha = torch.zeros(1, requires_grad=True)
            self.alpha_optimizer = optim.Adam([self.log_alpha], lr=lr)

        # 经验回放
        self.replay_buffer = ReplayBuffer(buffer_size)

    def select_action(self, state, deterministic=False):
        state = torch.FloatTensor(state).unsqueeze(0)

        with torch.no_grad():
            if deterministic:
                _, _, action = self.policy.sample(state)
                action = torch.tanh(action) * self.policy.action_scale
            else:
                action, _, _ = self.policy.sample(state)

        return action.squeeze().numpy()

    def update(self):
        if len(self.replay_buffer) < self.batch_size:
            return None

        # 采样
        states, actions, rewards, next_states, dones = self.replay_buffer.sample(self.batch_size)

        # 更新Q网络
        with torch.no_grad():
            next_actions, next_log_probs, _ = self.policy.sample(next_states)
            q1_next = self.q1_target(next_states, next_actions)
            q2_next = self.q2_target(next_states, next_actions)
            q_next = torch.min(q1_next, q2_next) - self.alpha * next_log_probs
            q_target = rewards + self.gamma * (1 - dones) * q_next

        q1_loss = F.mse_loss(self.q1(states, actions), q_target)
        q2_loss = F.mse_loss(self.q2(states, actions), q_target)

        self.q1_optimizer.zero_grad()
        q1_loss.backward()
        self.q1_optimizer.step()

        self.q2_optimizer.zero_grad()
        q2_loss.backward()
        self.q2_optimizer.step()

        # 更新策略网络
        new_actions, log_probs, _ = self.policy.sample(states)
        q1_new = self.q1(states, new_actions)
        q2_new = self.q2(states, new_actions)
        q_new = torch.min(q1_new, q2_new)

        policy_loss = (self.alpha * log_probs - q_new).mean()

        self.policy_optimizer.zero_grad()
        policy_loss.backward()
        self.policy_optimizer.step()

        # 更新温度参数
        if self.auto_alpha:
            alpha_loss = -(self.log_alpha * (log_probs + self.target_entropy).detach()).mean()

            self.alpha_optimizer.zero_grad()
            alpha_loss.backward()
            self.alpha_optimizer.step()

            self.alpha = self.log_alpha.exp().item()

        # 软更新目标网络
        self._soft_update(self.q1, self.q1_target)
        self._soft_update(self.q2, self.q2_target)

        return {
            'q1_loss': q1_loss.item(),
            'q2_loss': q2_loss.item(),
            'policy_loss': policy_loss.item(),
            'alpha': self.alpha
        }

    def _soft_update(self, source, target):
        for source_param, target_param in zip(source.parameters(), target.parameters()):
            target_param.data.copy_(
                self.tau * source_param.data + (1 - self.tau) * target_param.data
            )

def train_sac(env_name='Pendulum-v1', num_episodes=200, max_steps=200):
    """训练SAC"""
    import gymnasium as gym

    env = gym.make(env_name)
    state_dim = env.observation_space.shape[0]
    action_dim = env.action_space.shape[0]
    action_scale = env.action_space.high[0]

    agent = SACAgent(state_dim, action_dim, action_scale=action_scale)

    episode_rewards = []

    for episode in range(num_episodes):
        state, _ = env.reset()
        episode_reward = 0

        for step in range(max_steps):
            action = agent.select_action(state)
            next_state, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated

            agent.replay_buffer.push(state, action, reward, next_state, float(done))

            metrics = agent.update()

            episode_reward += reward
            state = next_state

            if done:
                break

        episode_rewards.append(episode_reward)

        if (episode + 1) % 10 == 0:
            avg_reward = np.mean(episode_rewards[-10:])
            print(f'Episode {episode + 1}, Avg Reward: {avg_reward:.2f}, Alpha: {agent.alpha:.4f}')

    env.close()
    return agent, episode_rewards
```

### SAC vs PPO

| 特性 | SAC | PPO |
|------|-----|-----|
| 策略类型 | Off-policy | On-policy |
| 样本效率 | 高 | 中等 |
| 计算复杂度 | 高（5个网络） | 中等 |
| 适用场景 | 连续控制 | 通用 |
| 超参数敏感度 | 较低 | 中等 |
| 经验回放 | 需要 | 不需要 |

---

## 实现技巧与最佳实践

### 网络架构技巧

**1. 合理的网络初始化**

```python
def layer_init(layer, std=np.sqrt(2), bias_const=0.0):
    """正交初始化"""
    nn.init.orthogonal_(layer.weight, std)
    nn.init.constant_(layer.bias, bias_const)
    return layer

# 策略网络最后一层使用较小的初始化
self.actor = layer_init(nn.Linear(hidden_dim, action_dim), std=0.01)
# 值函数网络最后一层使用标准初始化
self.critic = layer_init(nn.Linear(hidden_dim, 1), std=1.0)
```

**2. 使用独立的Actor和Critic网络**

虽然共享特征层可以加速训练，但独立网络通常更稳定：

```python
class SeparateActorCritic:
    def __init__(self, state_dim, action_dim, hidden_dim=256):
        # 独立的Actor网络
        self.actor = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, action_dim)
        )

        # 独立的Critic网络
        self.critic = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )
```

### 训练稳定性技巧

**1. 梯度裁剪**

```python
torch.nn.utils.clip_grad_norm_(network.parameters(), max_norm=0.5)
```

**2. 学习率调度**

```python
# 线性学习率衰减
def linear_schedule(initial_lr):
    def schedule(progress):
        return initial_lr * (1 - progress)
    return schedule

scheduler = optim.lr_scheduler.LambdaLR(
    optimizer,
    lr_lambda=lambda epoch: 1 - epoch / total_epochs
)
```

**3. 优势标准化**

```python
advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)
```

**4. 值函数裁剪（PPO）**

```python
def value_loss_clipped(values, old_values, returns, clip_range=0.2):
    values_clipped = old_values + torch.clamp(
        values - old_values, -clip_range, clip_range
    )
    loss_unclipped = (values - returns) ** 2
    loss_clipped = (values_clipped - returns) ** 2
    return 0.5 * torch.max(loss_unclipped, loss_clipped).mean()
```

### 超参数设置建议

**PPO推荐超参数：**

```python
ppo_hyperparameters = {
    'learning_rate': 3e-4,
    'gamma': 0.99,
    'gae_lambda': 0.95,
    'clip_epsilon': 0.2,
    'c1': 0.5,           # 值函数损失系数
    'c2': 0.01,          # 熵正则化系数
    'update_epochs': 10,
    'mini_batch_size': 64,
    'rollout_length': 2048,
    'max_grad_norm': 0.5
}
```

**SAC推荐超参数：**

```python
sac_hyperparameters = {
    'learning_rate': 3e-4,
    'gamma': 0.99,
    'tau': 0.005,
    'alpha': 0.2,        # 或使用自动调节
    'buffer_size': 1000000,
    'batch_size': 256,
    'hidden_dim': 256,
    'target_entropy': -action_dim  # 自动alpha时
}
```

### 调试技巧

**1. 监控关键指标**

```python
def log_training_metrics(writer, step, metrics):
    writer.add_scalar('reward/episode', metrics['episode_reward'], step)
    writer.add_scalar('loss/policy', metrics['policy_loss'], step)
    writer.add_scalar('loss/value', metrics['value_loss'], step)
    writer.add_scalar('policy/entropy', metrics['entropy'], step)
    writer.add_scalar('policy/kl_divergence', metrics['kl_div'], step)
    writer.add_scalar('debug/explained_variance', metrics['explained_var'], step)
```

**2. 计算解释方差**

```python
def explained_variance(y_pred, y_true):
    """值越接近1，值函数估计越准确"""
    var_y = np.var(y_true)
    return 1 - np.var(y_true - y_pred) / (var_y + 1e-8)
```

**3. 检查策略熵**

- 熵过低：策略过早收敛，可能陷入局部最优
- 熵过高：策略过于随机，学习效率低

---

## 完整代码示例

### PPO训练连续控制任务

```python
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import gymnasium as gym
from torch.distributions import Normal
from torch.utils.tensorboard import SummaryWriter
import os
from datetime import datetime

class ContinuousPPO:
    """连续动作空间的PPO完整实现"""

    def __init__(self, env_name, hidden_dim=64, lr=3e-4, gamma=0.99,
                 gae_lambda=0.95, clip_epsilon=0.2, c1=0.5, c2=0.01,
                 update_epochs=10, mini_batch_size=64, rollout_length=2048):

        self.env = gym.make(env_name)
        self.state_dim = self.env.observation_space.shape[0]
        self.action_dim = self.env.action_space.shape[0]
        self.action_scale = self.env.action_space.high[0]

        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_epsilon = clip_epsilon
        self.c1 = c1
        self.c2 = c2
        self.update_epochs = update_epochs
        self.mini_batch_size = mini_batch_size
        self.rollout_length = rollout_length

        # 网络
        self.actor = self._build_actor(hidden_dim)
        self.critic = self._build_critic(hidden_dim)

        self.actor_optimizer = optim.Adam(self.actor.parameters(), lr=lr)
        self.critic_optimizer = optim.Adam(self.critic.parameters(), lr=lr)

        # 日志
        log_dir = f"runs/{env_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.writer = SummaryWriter(log_dir)

    def _build_actor(self, hidden_dim):
        return nn.Sequential(
            nn.Linear(self.state_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, self.action_dim * 2)  # mean and log_std
        )

    def _build_critic(self, hidden_dim):
        return nn.Sequential(
            nn.Linear(self.state_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, 1)
        )

    def get_action(self, state, deterministic=False):
        state = torch.FloatTensor(state).unsqueeze(0)

        with torch.no_grad():
            output = self.actor(state)
            mean, log_std = output.chunk(2, dim=-1)
            log_std = torch.clamp(log_std, -20, 2)
            std = torch.exp(log_std)

            if deterministic:
                action = mean
            else:
                dist = Normal(mean, std)
                action = dist.sample()

            action = torch.tanh(action) * self.action_scale

            value = self.critic(state)

        return action.squeeze().numpy(), value.item()

    def compute_log_prob(self, states, actions):
        output = self.actor(states)
        mean, log_std = output.chunk(2, dim=-1)
        log_std = torch.clamp(log_std, -20, 2)
        std = torch.exp(log_std)

        # 反tanh
        actions_normalized = actions / self.action_scale
        actions_normalized = torch.clamp(actions_normalized, -0.999, 0.999)
        pre_tanh = 0.5 * (torch.log(1 + actions_normalized) - torch.log(1 - actions_normalized))

        dist = Normal(mean, std)
        log_prob = dist.log_prob(pre_tanh)
        log_prob -= torch.log(self.action_scale * (1 - actions_normalized.pow(2)) + 1e-6)
        log_prob = log_prob.sum(dim=-1)

        entropy = dist.entropy().sum(dim=-1)

        return log_prob, entropy

    def collect_rollout(self):
        states, actions, rewards, values, log_probs, dones = [], [], [], [], [], []

        state, _ = self.env.reset()

        for _ in range(self.rollout_length):
            action, value = self.get_action(state)

            states.append(state)
            actions.append(action)
            values.append(value)

            next_state, reward, terminated, truncated, _ = self.env.step(action)
            done = terminated or truncated

            rewards.append(reward)
            dones.append(done)

            # 计算log_prob
            state_tensor = torch.FloatTensor(state).unsqueeze(0)
            action_tensor = torch.FloatTensor(action).unsqueeze(0)
            log_prob, _ = self.compute_log_prob(state_tensor, action_tensor)
            log_probs.append(log_prob.item())

            if done:
                state, _ = self.env.reset()
            else:
                state = next_state

        # 获取最后一个状态的值
        _, next_value = self.get_action(state)

        return {
            'states': np.array(states),
            'actions': np.array(actions),
            'rewards': np.array(rewards),
            'values': np.array(values),
            'log_probs': np.array(log_probs),
            'dones': np.array(dones),
            'next_value': next_value
        }

    def compute_gae(self, rollout):
        rewards = rollout['rewards']
        values = rollout['values']
        dones = rollout['dones']
        next_value = rollout['next_value']

        advantages = np.zeros_like(rewards)
        last_gae = 0

        for t in reversed(range(len(rewards))):
            if t == len(rewards) - 1:
                next_val = next_value
            else:
                next_val = values[t + 1]

            next_non_terminal = 1.0 - dones[t]
            delta = rewards[t] + self.gamma * next_val * next_non_terminal - values[t]
            advantages[t] = last_gae = delta + self.gamma * self.gae_lambda * next_non_terminal * last_gae

        returns = advantages + values
        return advantages, returns

    def update(self, rollout):
        advantages, returns = self.compute_gae(rollout)

        states = torch.FloatTensor(rollout['states'])
        actions = torch.FloatTensor(rollout['actions'])
        old_log_probs = torch.FloatTensor(rollout['log_probs'])
        advantages = torch.FloatTensor(advantages)
        returns = torch.FloatTensor(returns)

        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        total_policy_loss = 0
        total_value_loss = 0
        total_entropy = 0

        batch_size = len(states)

        for _ in range(self.update_epochs):
            indices = np.random.permutation(batch_size)

            for start in range(0, batch_size, self.mini_batch_size):
                end = start + self.mini_batch_size
                batch_indices = indices[start:end]

                batch_states = states[batch_indices]
                batch_actions = actions[batch_indices]
                batch_old_log_probs = old_log_probs[batch_indices]
                batch_advantages = advantages[batch_indices]
                batch_returns = returns[batch_indices]

                # 策略损失
                new_log_probs, entropy = self.compute_log_prob(batch_states, batch_actions)

                ratio = torch.exp(new_log_probs - batch_old_log_probs)
                surr1 = ratio * batch_advantages
                surr2 = torch.clamp(ratio, 1 - self.clip_epsilon, 1 + self.clip_epsilon) * batch_advantages
                policy_loss = -torch.min(surr1, surr2).mean()

                self.actor_optimizer.zero_grad()
                (policy_loss - self.c2 * entropy.mean()).backward()
                torch.nn.utils.clip_grad_norm_(self.actor.parameters(), 0.5)
                self.actor_optimizer.step()

                # 值函数损失
                values = self.critic(batch_states).squeeze()
                value_loss = self.c1 * ((values - batch_returns) ** 2).mean()

                self.critic_optimizer.zero_grad()
                value_loss.backward()
                torch.nn.utils.clip_grad_norm_(self.critic.parameters(), 0.5)
                self.critic_optimizer.step()

                total_policy_loss += policy_loss.item()
                total_value_loss += value_loss.item()
                total_entropy += entropy.mean().item()

        num_updates = self.update_epochs * (batch_size // self.mini_batch_size + 1)

        return {
            'policy_loss': total_policy_loss / num_updates,
            'value_loss': total_value_loss / num_updates,
            'entropy': total_entropy / num_updates
        }

    def train(self, total_timesteps):
        timestep = 0
        episode_count = 0
        episode_rewards = []
        current_episode_reward = 0

        while timestep < total_timesteps:
            rollout = self.collect_rollout()
            timestep += self.rollout_length

            # 统计回合奖励
            for i, done in enumerate(rollout['dones']):
                current_episode_reward += rollout['rewards'][i]
                if done:
                    episode_rewards.append(current_episode_reward)
                    episode_count += 1
                    current_episode_reward = 0

            metrics = self.update(rollout)

            # 日志
            if len(episode_rewards) > 0:
                self.writer.add_scalar('reward/episode', episode_rewards[-1], timestep)
                self.writer.add_scalar('reward/avg_100', np.mean(episode_rewards[-100:]), timestep)

            self.writer.add_scalar('loss/policy', metrics['policy_loss'], timestep)
            self.writer.add_scalar('loss/value', metrics['value_loss'], timestep)
            self.writer.add_scalar('policy/entropy', metrics['entropy'], timestep)

            if episode_count % 10 == 0 and len(episode_rewards) > 0:
                print(f"Timestep: {timestep}, Episodes: {episode_count}, "
                      f"Avg Reward: {np.mean(episode_rewards[-10:]):.2f}")

        self.writer.close()
        return episode_rewards

    def save(self, path):
        torch.save({
            'actor': self.actor.state_dict(),
            'critic': self.critic.state_dict()
        }, path)

    def load(self, path):
        checkpoint = torch.load(path)
        self.actor.load_state_dict(checkpoint['actor'])
        self.critic.load_state_dict(checkpoint['critic'])

# 训练示例
if __name__ == "__main__":
    agent = ContinuousPPO(
        env_name='Pendulum-v1',
        hidden_dim=64,
        lr=3e-4,
        rollout_length=2048
    )

    episode_rewards = agent.train(total_timesteps=100000)
    agent.save('ppo_pendulum.pt')
```

---

## 面试要点

### 基础概念

**Q1: 策略梯度和值函数方法的主要区别是什么？**

策略梯度方法直接参数化策略并通过梯度上升优化期望回报，适合连续动作空间和随机策略。值函数方法学习Q值或V值，从中导出策略，主要处理离散动作。策略梯度有理论收敛保证但样本效率较低。

**Q2: 解释策略梯度定理的核心思想。**

策略梯度定理告诉我们如何计算期望回报对策略参数的梯度：
$$\nabla_\theta J(\theta) = \mathbb{E}\left[\nabla_\theta \log \pi_\theta(a|s) \cdot R\right]$$

直观理解：增加高回报动作的概率，减少低回报动作的概率。

**Q3: 为什么REINFORCE算法方差很大？如何降低方差？**

REINFORCE使用蒙特卡洛采样估计梯度，轨迹回报的随机性导致高方差。解决方法：
1. 引入基线（如状态值函数）
2. 使用Actor-Critic架构
3. 使用GAE平衡偏差和方差
4. 增加采样轨迹数

**Q4: 什么是优势函数？为什么使用优势函数？**

优势函数 $A(s, a) = Q(s, a) - V(s)$ 衡量动作相对于平均水平的好坏。使用优势函数可以降低梯度估计的方差，因为它去除了与动作无关的状态值部分。

### 算法理解

**Q5: PPO的核心思想是什么？为什么PPO比TRPO更实用？**

PPO通过裁剪概率比来限制策略更新幅度，避免过大更新导致策略崩溃：
$$L^{CLIP} = \mathbb{E}[\min(r_t A_t, \text{clip}(r_t, 1-\epsilon, 1+\epsilon)A_t)]$$

相比TRPO，PPO不需要计算KL散度约束的二阶优化，实现简单且效果接近。

**Q6: SAC的最大熵目标有什么好处？**

最大熵鼓励探索多样化的行为，好处包括：
1. 更好的探索，避免过早收敛
2. 学习到更鲁棒的策略
3. 可以捕捉多模态的最优策略
4. 对超参数不敏感

**Q7: A2C和A3C的区别是什么？**

A3C使用异步更新，多个worker独立计算梯度并更新全局网络。A2C使用同步更新，等待所有worker完成后批量更新。A2C在GPU上通常更高效，因为可以充分利用并行计算。

### 实践问题

**Q8: 如何选择PPO和SAC？**

- PPO：通用性好，适合离散和连续动作，超参数较稳定，适合快速实验
- SAC：样本效率高，适合连续控制任务，需要经验回放，适合机器人控制等需要高效利用数据的场景

**Q9: 策略梯度算法训练不稳定怎么办？**

1. 使用适当的学习率（通常1e-4到3e-4）
2. 梯度裁剪（max_norm=0.5）
3. 优势标准化
4. 使用PPO-Clip限制更新幅度
5. 添加熵正则化
6. 检查reward scale

**Q10: GAE中lambda参数如何选择？**

- lambda=0：等价于TD(0)，低方差高偏差
- lambda=1：等价于蒙特卡洛，高方差低偏差
- 实践中通常使用lambda=0.95，在偏差和方差间取得平衡

---

## 延伸阅读

### 经典论文

1. **REINFORCE**: Williams, "Simple Statistical Gradient-Following Algorithms for Connectionist Reinforcement Learning", 1992
2. **Actor-Critic**: Konda & Tsitsiklis, "Actor-Critic Algorithms", 1999
3. **A3C**: Mnih et al., "Asynchronous Methods for Deep Reinforcement Learning", 2016
4. **TRPO**: Schulman et al., "Trust Region Policy Optimization", 2015
5. **PPO**: Schulman et al., "Proximal Policy Optimization Algorithms", 2017
6. **SAC**: Haarnoja et al., "Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning", 2018
7. **GAE**: Schulman et al., "High-Dimensional Continuous Control Using Generalized Advantage Estimation", 2016

### 推荐资源

**书籍：**
- **《Reinforcement Learning: An Introduction》** - Sutton & Barto，强化学习经典教材
- **《Deep Reinforcement Learning Hands-On》** - Maxim Lapan，实战导向

**课程：**
- **UC Berkeley CS285**: Deep Reinforcement Learning
- **Stanford CS234**: Reinforcement Learning
- **DeepMind RL Course**: David Silver主讲

**代码库：**
- **Stable-Baselines3**: 高质量的RL算法实现
- **CleanRL**: 单文件的简洁RL实现
- **RLlib**: Ray框架的分布式RL库
- **SpinningUp**: OpenAI的RL教程和代码

### 进阶主题

- **模型基础强化学习**：Dreamer、MBPO
- **离线强化学习**：CQL、IQL、Decision Transformer
- **多智能体强化学习**：MAPPO、QMIX
- **分层强化学习**：Options Framework、HAM
- **逆强化学习**：GAIL、AIRL
- **元强化学习**：MAML、RL^2

---

## 总结

策略梯度方法是现代强化学习的核心技术，本文系统介绍了从基础理论到前沿算法的完整知识体系：

1. **理论基础**：策略梯度定理、优势函数、GAE
2. **经典算法**：REINFORCE、Actor-Critic、A2C/A3C
3. **现代算法**：PPO、SAC
4. **实现技巧**：网络初始化、梯度裁剪、超参数选择

**学习建议：**

1. 从REINFORCE开始理解策略梯度的基本原理
2. 通过Actor-Critic理解如何降低方差
3. 深入学习PPO，它是目前最常用的算法
4. 对于连续控制任务，掌握SAC
5. 通过实际项目巩固理解

策略梯度方法仍在快速发展，掌握核心原理后，可以更好地理解和应用新的算法。建议在理解理论的同时，多做实验，在实践中加深理解。
