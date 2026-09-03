---
title: "Reinforcement Learning: Policy Gradient Methods"
description: "Master policy gradient algorithms: REINFORCE, Actor-Critic, PPO, and SAC"
track: ai
section: deep-learning
difficulty: advanced
tags:
  - policy gradient
  - PPO
  - Actor-Critic
  - reinforcement learning
status: imported
origin: old/src/content/docs/datascience/policy-gradient.en.md
divergence: 0.313
issues: []
legacy:
  category: DataScience
  subcategory: RL
  order: 30
  lastUpdated: 2026-01-07
---

Policy gradient methods represent a fundamental class of reinforcement learning algorithms that directly optimize the policy function. Unlike value-based methods such as Q-learning that derive policies from value estimates, policy gradient methods parameterize the policy and update it using gradient ascent on expected returns. We'll provide a comprehensive guide to understanding and implementing policy gradient algorithms, from the foundational theory to state-of-the-art methods like PPO and SAC.

---

## Introduction to Policy-Based Methods

### Why Policy Gradients?

In reinforcement learning, an agent interacts with an environment to maximize cumulative rewards. There are two main approaches to solve this problem:

**Value-Based Methods:**
- Learn a value function (e.g., Q-function)
- Derive policy from the value function (e.g., greedy action selection)
- Examples: DQN, SARSA

**Policy-Based Methods:**
- Directly parameterize and optimize the policy
- No need to maintain an explicit value function (though often combined)
- Examples: REINFORCE, PPO, SAC

### Advantages of Policy Gradient Methods

| Aspect | Policy Gradient | Value-Based |
|--------|-----------------|-------------|
| Action Space | Works with continuous actions | Typically discrete only |
| Stochasticity | Naturally handles stochastic policies | Deterministic policies |
| Convergence | Better convergence properties | May oscillate or diverge |
| Function Approximation | More stable with neural networks | Can be unstable |

### Policy Parameterization

A parameterized policy $\pi_\theta(a|s)$ represents the probability of taking action $a$ in state $s$ given parameters $\theta$:

**Discrete Actions (Softmax Policy):**

$$\pi_\theta(a|s) = \frac{\exp(h_\theta(s, a))}{\sum_{a'} \exp(h_\theta(s, a'))}$$

**Continuous Actions (Gaussian Policy):**

$$\pi_\theta(a|s) = \mathcal{N}(\mu_\theta(s), \sigma_\theta(s)^2)$$

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.distributions import Categorical, Normal

class DiscretePolicy(nn.Module):
    """Policy network for discrete action spaces."""
    def __init__(self, state_dim, action_dim, hidden_dim=256):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, action_dim)
        )

    def forward(self, state):
        logits = self.network(state)
        return Categorical(logits=logits)

    def get_action(self, state, deterministic=False):
        dist = self.forward(state)
        if deterministic:
            action = dist.probs.argmax(dim=-1)
        else:
            action = dist.sample()
        log_prob = dist.log_prob(action)
        return action, log_prob


class GaussianPolicy(nn.Module):
    """Policy network for continuous action spaces."""
    def __init__(self, state_dim, action_dim, hidden_dim=256,
                 log_std_min=-20, log_std_max=2):
        super().__init__()
        self.log_std_min = log_std_min
        self.log_std_max = log_std_max

        self.shared = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU()
        )
        self.mean_head = nn.Linear(hidden_dim, action_dim)
        self.log_std_head = nn.Linear(hidden_dim, action_dim)

    def forward(self, state):
        features = self.shared(state)
        mean = self.mean_head(features)
        log_std = self.log_std_head(features)
        log_std = torch.clamp(log_std, self.log_std_min, self.log_std_max)
        std = log_std.exp()
        return Normal(mean, std)

    def get_action(self, state, deterministic=False):
        dist = self.forward(state)
        if deterministic:
            action = dist.mean
        else:
            action = dist.rsample()  # Reparameterization trick
        log_prob = dist.log_prob(action).sum(dim=-1)
        return action, log_prob
```

---

## The Policy Gradient Theorem

### Objective Function

The goal is to find policy parameters $\theta$ that maximize the expected return:

$$J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}[R(\tau)] = \mathbb{E}_{\tau \sim \pi_\theta}\left[\sum_{t=0}^{T} \gamma^t r_t\right]$$

where $\tau = (s_0, a_0, r_0, s_1, a_1, r_1, \ldots)$ is a trajectory.

### The Theorem

The policy gradient theorem provides a way to compute the gradient of the objective:

$$\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}\left[\sum_{t=0}^{T} \nabla_\theta \log \pi_\theta(a_t|s_t) \cdot G_t\right]$$

where $G_t = \sum_{k=t}^{T} \gamma^{k-t} r_k$ is the return from time step $t$.

**Key Insight:** The gradient can be estimated using samples from the policy, making it tractable for complex environments.

### Derivation Intuition

The gradient computation uses the log-derivative trick:

$$\nabla_\theta \pi_\theta(a|s) = \pi_\theta(a|s) \nabla_\theta \log \pi_\theta(a|s)$$

This transforms the gradient of the probability into an expectation under the policy.

```python
def compute_policy_gradient(states, actions, returns, policy):
    """
    Compute the policy gradient estimator.

    Args:
        states: Tensor of states [batch_size, state_dim]
        actions: Tensor of actions [batch_size, action_dim]
        returns: Tensor of returns [batch_size]
        policy: Policy network

    Returns:
        Policy gradient loss (negative for gradient ascent)
    """
    # Get action distribution
    dist = policy(states)

    # Compute log probabilities
    log_probs = dist.log_prob(actions)
    if len(log_probs.shape) > 1:
        log_probs = log_probs.sum(dim=-1)

    # Policy gradient: -E[log_prob * return]
    # Negative because optimizers minimize
    policy_loss = -(log_probs * returns).mean()

    return policy_loss
```

---

## REINFORCE Algorithm

### Algorithm Overview

REINFORCE is the simplest policy gradient algorithm, also known as Monte Carlo Policy Gradient. It updates the policy using complete episode returns.

**Algorithm Steps:**
1. Generate an episode using the current policy
2. For each time step, compute the return $G_t$
3. Update policy parameters: $\theta \leftarrow \theta + \alpha \nabla_\theta \log \pi_\theta(a_t|s_t) G_t$

### Implementation

```python
import numpy as np
import torch
import torch.optim as optim
from collections import deque

class REINFORCE:
    """REINFORCE (Monte Carlo Policy Gradient) algorithm."""

    def __init__(self, state_dim, action_dim, hidden_dim=256,
                 lr=3e-4, gamma=0.99):
        self.gamma = gamma
        self.policy = DiscretePolicy(state_dim, action_dim, hidden_dim)
        self.optimizer = optim.Adam(self.policy.parameters(), lr=lr)

        # Storage for episode data
        self.log_probs = []
        self.rewards = []

    def select_action(self, state):
        """Select action using the current policy."""
        state = torch.FloatTensor(state).unsqueeze(0)
        action, log_prob = self.policy.get_action(state)
        self.log_probs.append(log_prob)
        return action.item()

    def store_reward(self, reward):
        """Store reward for the current step."""
        self.rewards.append(reward)

    def compute_returns(self):
        """Compute discounted returns for each time step."""
        returns = []
        G = 0
        for reward in reversed(self.rewards):
            G = reward + self.gamma * G
            returns.insert(0, G)
        returns = torch.tensor(returns, dtype=torch.float32)

        # Normalize returns for stability
        returns = (returns - returns.mean()) / (returns.std() + 1e-8)
        return returns

    def update(self):
        """Update policy using collected episode data."""
        returns = self.compute_returns()
        log_probs = torch.cat(self.log_probs)

        # Policy gradient loss
        policy_loss = -(log_probs * returns).mean()

        # Update policy
        self.optimizer.zero_grad()
        policy_loss.backward()
        self.optimizer.step()

        # Clear episode data
        self.log_probs = []
        self.rewards = []

        return policy_loss.item()


def train_reinforce(env, agent, num_episodes=1000, print_every=100):
    """Train REINFORCE agent on an environment."""
    scores = deque(maxlen=100)

    for episode in range(num_episodes):
        state, _ = env.reset()
        episode_reward = 0
        done = False

        while not done:
            action = agent.select_action(state)
            next_state, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated

            agent.store_reward(reward)
            episode_reward += reward
            state = next_state

        # Update policy after episode ends
        loss = agent.update()
        scores.append(episode_reward)

        if (episode + 1) % print_every == 0:
            avg_score = np.mean(scores)
            print(f"Episode {episode + 1}, Avg Score: {avg_score:.2f}, Loss: {loss:.4f}")

    return scores
```

### Limitations of REINFORCE

1. **High Variance:** Using raw returns leads to high variance in gradient estimates
2. **Sample Inefficiency:** Requires complete episodes before updates
3. **Slow Convergence:** High variance leads to slow and unstable learning

---

## Advantage Functions and Baselines

### Reducing Variance with Baselines

A key improvement to REINFORCE is subtracting a baseline $b(s)$ from the return:

$$\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta}\left[\sum_{t=0}^{T} \nabla_\theta \log \pi_\theta(a_t|s_t) (G_t - b(s_t))\right]$$

The baseline does not change the expected gradient but can significantly reduce variance.

### The Advantage Function

The optimal baseline is the state-value function $V(s)$. This leads to the advantage function:

$$A(s, a) = Q(s, a) - V(s)$$

The advantage measures how much better action $a$ is compared to the average action in state $s$.

**Interpretation:**
- $A(s, a) > 0$: Action is better than average
- $A(s, a) < 0$: Action is worse than average
- $A(s, a) = 0$: Action is average

### Value Function Baseline

```python
class ValueNetwork(nn.Module):
    """Value function approximator (critic)."""
    def __init__(self, state_dim, hidden_dim=256):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )

    def forward(self, state):
        return self.network(state).squeeze(-1)


class REINFORCEWithBaseline:
    """REINFORCE with learned value function baseline."""

    def __init__(self, state_dim, action_dim, hidden_dim=256,
                 lr_policy=3e-4, lr_value=1e-3, gamma=0.99):
        self.gamma = gamma

        self.policy = DiscretePolicy(state_dim, action_dim, hidden_dim)
        self.value = ValueNetwork(state_dim, hidden_dim)

        self.policy_optimizer = optim.Adam(self.policy.parameters(), lr=lr_policy)
        self.value_optimizer = optim.Adam(self.value.parameters(), lr=lr_value)

        self.log_probs = []
        self.rewards = []
        self.states = []

    def select_action(self, state):
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        self.states.append(state_tensor)
        action, log_prob = self.policy.get_action(state_tensor)
        self.log_probs.append(log_prob)
        return action.item()

    def store_reward(self, reward):
        self.rewards.append(reward)

    def compute_returns(self):
        returns = []
        G = 0
        for reward in reversed(self.rewards):
            G = reward + self.gamma * G
            returns.insert(0, G)
        return torch.tensor(returns, dtype=torch.float32)

    def update(self):
        returns = self.compute_returns()
        states = torch.cat(self.states)
        log_probs = torch.cat(self.log_probs)

        # Compute value estimates (baseline)
        values = self.value(states)

        # Compute advantages
        advantages = returns - values.detach()
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        # Policy loss
        policy_loss = -(log_probs * advantages).mean()

        # Value loss (MSE)
        value_loss = F.mse_loss(values, returns)

        # Update policy
        self.policy_optimizer.zero_grad()
        policy_loss.backward()
        self.policy_optimizer.step()

        # Update value function
        self.value_optimizer.zero_grad()
        value_loss.backward()
        self.value_optimizer.step()

        # Clear storage
        self.log_probs = []
        self.rewards = []
        self.states = []

        return policy_loss.item(), value_loss.item()
```

### Generalized Advantage Estimation (GAE)

GAE provides a way to balance bias and variance in advantage estimation:

$$\hat{A}_t^{GAE(\gamma, \lambda)} = \sum_{l=0}^{\infty} (\gamma \lambda)^l \delta_{t+l}$$

where $\delta_t = r_t + \gamma V(s_{t+1}) - V(s_t)$ is the TD error.

```python
def compute_gae(rewards, values, next_values, dones, gamma=0.99, gae_lambda=0.95):
    """
    Compute Generalized Advantage Estimation.

    Args:
        rewards: Rewards at each time step [T]
        values: Value estimates at each time step [T]
        next_values: Value estimates at next time steps [T]
        dones: Done flags [T]
        gamma: Discount factor
        gae_lambda: GAE lambda parameter

    Returns:
        advantages: GAE advantages [T]
        returns: Target returns [T]
    """
    advantages = []
    gae = 0

    for t in reversed(range(len(rewards))):
        if dones[t]:
            delta = rewards[t] - values[t]
            gae = delta
        else:
            delta = rewards[t] + gamma * next_values[t] - values[t]
            gae = delta + gamma * gae_lambda * gae
        advantages.insert(0, gae)

    advantages = torch.tensor(advantages, dtype=torch.float32)
    returns = advantages + values

    return advantages, returns
```

---

## Actor-Critic Framework

### Overview

Actor-Critic methods combine policy-based (actor) and value-based (critic) approaches:

- **Actor:** Learns the policy $\pi_\theta(a|s)$
- **Critic:** Learns the value function $V_\phi(s)$ or $Q_\phi(s, a)$

The critic provides a low-variance estimate of the return, while the actor learns to select actions.

### Architecture

```python
class ActorCritic(nn.Module):
    """Combined Actor-Critic network with shared features."""

    def __init__(self, state_dim, action_dim, hidden_dim=256, continuous=False):
        super().__init__()
        self.continuous = continuous

        # Shared feature extractor
        self.shared = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU()
        )

        # Actor head
        if continuous:
            self.actor_mean = nn.Linear(hidden_dim, action_dim)
            self.actor_log_std = nn.Parameter(torch.zeros(action_dim))
        else:
            self.actor = nn.Linear(hidden_dim, action_dim)

        # Critic head
        self.critic = nn.Linear(hidden_dim, 1)

    def forward(self, state):
        features = self.shared(state)
        value = self.critic(features).squeeze(-1)

        if self.continuous:
            mean = self.actor_mean(features)
            std = self.actor_log_std.exp().expand_as(mean)
            dist = Normal(mean, std)
        else:
            logits = self.actor(features)
            dist = Categorical(logits=logits)

        return dist, value

    def get_action_and_value(self, state, action=None, deterministic=False):
        dist, value = self.forward(state)

        if action is None:
            if deterministic:
                action = dist.mean if self.continuous else dist.probs.argmax(dim=-1)
            else:
                action = dist.sample()

        log_prob = dist.log_prob(action)
        if self.continuous:
            log_prob = log_prob.sum(dim=-1)

        entropy = dist.entropy()
        if self.continuous:
            entropy = entropy.sum(dim=-1)

        return action, log_prob, entropy, value
```

### Online Actor-Critic (A2C without parallelism)

```python
class ActorCriticAgent:
    """Single-threaded Actor-Critic agent."""

    def __init__(self, state_dim, action_dim, hidden_dim=256,
                 lr=3e-4, gamma=0.99, gae_lambda=0.95,
                 entropy_coef=0.01, value_coef=0.5):
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.entropy_coef = entropy_coef
        self.value_coef = value_coef

        self.network = ActorCritic(state_dim, action_dim, hidden_dim)
        self.optimizer = optim.Adam(self.network.parameters(), lr=lr)

    def select_action(self, state, deterministic=False):
        state = torch.FloatTensor(state).unsqueeze(0)
        with torch.no_grad():
            action, log_prob, _, value = self.network.get_action_and_value(
                state, deterministic=deterministic
            )
        return action.squeeze(0).numpy(), log_prob.item(), value.item()

    def update(self, states, actions, rewards, dones, next_state):
        """Update using collected trajectory."""
        states = torch.FloatTensor(np.array(states))
        actions = torch.LongTensor(np.array(actions))
        rewards = torch.FloatTensor(np.array(rewards))
        dones = torch.FloatTensor(np.array(dones))
        next_state = torch.FloatTensor(next_state).unsqueeze(0)

        # Get current values
        _, _, _, values = self.network.get_action_and_value(states, actions)

        # Bootstrap from last state
        with torch.no_grad():
            _, _, _, next_value = self.network.get_action_and_value(next_state)

        # Compute GAE
        next_values = torch.cat([values[1:], next_value])
        advantages, returns = compute_gae(
            rewards, values.detach(), next_values, dones,
            self.gamma, self.gae_lambda
        )

        # Normalize advantages
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        # Compute losses
        _, log_probs, entropy, new_values = self.network.get_action_and_value(
            states, actions
        )

        # Policy loss
        policy_loss = -(log_probs * advantages).mean()

        # Value loss
        value_loss = F.mse_loss(new_values, returns)

        # Entropy bonus (encourages exploration)
        entropy_loss = -entropy.mean()

        # Total loss
        total_loss = (policy_loss +
                      self.value_coef * value_loss +
                      self.entropy_coef * entropy_loss)

        # Update
        self.optimizer.zero_grad()
        total_loss.backward()
        nn.utils.clip_grad_norm_(self.network.parameters(), 0.5)
        self.optimizer.step()

        return {
            'policy_loss': policy_loss.item(),
            'value_loss': value_loss.item(),
            'entropy': -entropy_loss.item()
        }
```

---

## A2C and A3C

### A3C: Asynchronous Advantage Actor-Critic

A3C uses multiple parallel workers to collect experience asynchronously, improving sample efficiency and training stability.

**Key Features:**
- Multiple actors run in parallel
- Asynchronous gradient updates to shared parameters
- Different workers explore different parts of the environment

### A2C: Advantage Actor-Critic (Synchronous)

A2C is a synchronous version of A3C that is often more efficient on modern GPUs.

**Key Features:**
- Multiple environments run synchronously
- Batch gradient updates
- More stable than A3C in practice

```python
import multiprocessing as mp
from typing import List, Tuple
import gym

class VectorizedEnv:
    """Vectorized environment wrapper for parallel execution."""

    def __init__(self, env_name: str, num_envs: int):
        self.envs = [gym.make(env_name) for _ in range(num_envs)]
        self.num_envs = num_envs

    def reset(self) -> np.ndarray:
        states = []
        for env in self.envs:
            state, _ = env.reset()
            states.append(state)
        return np.array(states)

    def step(self, actions: np.ndarray) -> Tuple[np.ndarray, np.ndarray,
                                                   np.ndarray, List[dict]]:
        next_states, rewards, dones, infos = [], [], [], []
        for i, (env, action) in enumerate(zip(self.envs, actions)):
            next_state, reward, terminated, truncated, info = env.step(action)
            done = terminated or truncated

            if done:
                next_state, _ = env.reset()

            next_states.append(next_state)
            rewards.append(reward)
            dones.append(done)
            infos.append(info)

        return (np.array(next_states), np.array(rewards),
                np.array(dones), infos)


class A2C:
    """Advantage Actor-Critic with vectorized environments."""

    def __init__(self, state_dim, action_dim, num_envs=8,
                 hidden_dim=256, lr=7e-4, gamma=0.99,
                 gae_lambda=0.95, entropy_coef=0.01,
                 value_coef=0.5, max_grad_norm=0.5):
        self.num_envs = num_envs
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.entropy_coef = entropy_coef
        self.value_coef = value_coef
        self.max_grad_norm = max_grad_norm

        self.network = ActorCritic(state_dim, action_dim, hidden_dim)
        self.optimizer = optim.Adam(self.network.parameters(), lr=lr)

    def collect_rollout(self, envs, rollout_steps=5):
        """Collect experience from vectorized environments."""
        states_list = []
        actions_list = []
        rewards_list = []
        dones_list = []
        values_list = []
        log_probs_list = []

        states = envs.reset()

        for _ in range(rollout_steps):
            states_tensor = torch.FloatTensor(states)

            with torch.no_grad():
                actions, log_probs, _, values = self.network.get_action_and_value(
                    states_tensor
                )

            actions_np = actions.numpy()
            next_states, rewards, dones, _ = envs.step(actions_np)

            states_list.append(states)
            actions_list.append(actions_np)
            rewards_list.append(rewards)
            dones_list.append(dones)
            values_list.append(values.numpy())
            log_probs_list.append(log_probs.numpy())

            states = next_states

        # Get bootstrap value
        with torch.no_grad():
            _, _, _, last_values = self.network.get_action_and_value(
                torch.FloatTensor(states)
            )

        return {
            'states': np.array(states_list),
            'actions': np.array(actions_list),
            'rewards': np.array(rewards_list),
            'dones': np.array(dones_list),
            'values': np.array(values_list),
            'log_probs': np.array(log_probs_list),
            'last_values': last_values.numpy(),
            'last_states': states
        }

    def compute_advantages(self, rollout):
        """Compute GAE advantages for the rollout."""
        rewards = rollout['rewards']
        values = rollout['values']
        dones = rollout['dones']
        last_values = rollout['last_values']

        T, N = rewards.shape
        advantages = np.zeros((T, N), dtype=np.float32)
        last_gae = np.zeros(N, dtype=np.float32)

        for t in reversed(range(T)):
            if t == T - 1:
                next_values = last_values
            else:
                next_values = values[t + 1]

            delta = rewards[t] + self.gamma * next_values * (1 - dones[t]) - values[t]
            last_gae = delta + self.gamma * self.gae_lambda * (1 - dones[t]) * last_gae
            advantages[t] = last_gae

        returns = advantages + values
        return advantages, returns

    def update(self, rollout):
        """Update network using collected rollout."""
        advantages, returns = self.compute_advantages(rollout)

        # Flatten batch
        states = torch.FloatTensor(rollout['states'].reshape(-1, *rollout['states'].shape[2:]))
        actions = torch.LongTensor(rollout['actions'].reshape(-1))
        old_log_probs = torch.FloatTensor(rollout['log_probs'].reshape(-1))
        advantages = torch.FloatTensor(advantages.reshape(-1))
        returns = torch.FloatTensor(returns.reshape(-1))

        # Normalize advantages
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        # Forward pass
        _, log_probs, entropy, values = self.network.get_action_and_value(
            states, actions
        )

        # Losses
        policy_loss = -(log_probs * advantages).mean()
        value_loss = F.mse_loss(values, returns)
        entropy_loss = -entropy.mean()

        total_loss = (policy_loss +
                      self.value_coef * value_loss +
                      self.entropy_coef * entropy_loss)

        # Update
        self.optimizer.zero_grad()
        total_loss.backward()
        nn.utils.clip_grad_norm_(self.network.parameters(), self.max_grad_norm)
        self.optimizer.step()

        return {
            'policy_loss': policy_loss.item(),
            'value_loss': value_loss.item(),
            'entropy': -entropy_loss.item(),
            'total_loss': total_loss.item()
        }
```

---

## Proximal Policy Optimization (PPO)

### Overview

PPO is one of the most popular policy gradient algorithms, known for its simplicity, stability, and strong performance. It prevents large policy updates that could destabilize training.

### Key Ideas

1. **Clipped Surrogate Objective:** Limits how much the policy can change in a single update
2. **Multiple Epochs:** Reuses collected data for multiple gradient updates
3. **Value Function Clipping:** Optional clipping for value function updates

### PPO-Clip Objective

$$L^{CLIP}(\theta) = \mathbb{E}\left[\min\left(r_t(\theta)\hat{A}_t, \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon)\hat{A}_t\right)\right]$$

where $r_t(\theta) = \frac{\pi_\theta(a_t|s_t)}{\pi_{\theta_{old}}(a_t|s_t)}$ is the probability ratio.

### Implementation

```python
class PPO:
    """Proximal Policy Optimization with clipped objective."""

    def __init__(self, state_dim, action_dim, hidden_dim=256,
                 lr=3e-4, gamma=0.99, gae_lambda=0.95,
                 clip_epsilon=0.2, entropy_coef=0.01,
                 value_coef=0.5, max_grad_norm=0.5,
                 update_epochs=10, minibatch_size=64):
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_epsilon = clip_epsilon
        self.entropy_coef = entropy_coef
        self.value_coef = value_coef
        self.max_grad_norm = max_grad_norm
        self.update_epochs = update_epochs
        self.minibatch_size = minibatch_size

        self.network = ActorCritic(state_dim, action_dim, hidden_dim)
        self.optimizer = optim.Adam(self.network.parameters(), lr=lr, eps=1e-5)

    def select_action(self, state, deterministic=False):
        state = torch.FloatTensor(state).unsqueeze(0)
        with torch.no_grad():
            action, log_prob, _, value = self.network.get_action_and_value(
                state, deterministic=deterministic
            )
        return action.squeeze(0).numpy(), log_prob.item(), value.item()

    def compute_advantages(self, rewards, values, dones, last_value):
        """Compute GAE advantages."""
        advantages = np.zeros_like(rewards)
        last_gae = 0

        for t in reversed(range(len(rewards))):
            if t == len(rewards) - 1:
                next_value = last_value
            else:
                next_value = values[t + 1]

            delta = rewards[t] + self.gamma * next_value * (1 - dones[t]) - values[t]
            last_gae = delta + self.gamma * self.gae_lambda * (1 - dones[t]) * last_gae
            advantages[t] = last_gae

        returns = advantages + values
        return advantages, returns

    def update(self, rollout_buffer):
        """Update policy using PPO-Clip objective."""
        states = torch.FloatTensor(rollout_buffer['states'])
        actions = torch.LongTensor(rollout_buffer['actions'])
        old_log_probs = torch.FloatTensor(rollout_buffer['log_probs'])
        advantages = torch.FloatTensor(rollout_buffer['advantages'])
        returns = torch.FloatTensor(rollout_buffer['returns'])

        # Normalize advantages
        advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        # Multiple epochs of updates
        batch_size = len(states)
        metrics = {'policy_loss': [], 'value_loss': [], 'entropy': [],
                   'approx_kl': [], 'clip_fraction': []}

        for _ in range(self.update_epochs):
            # Random permutation for minibatches
            indices = np.random.permutation(batch_size)

            for start in range(0, batch_size, self.minibatch_size):
                end = start + self.minibatch_size
                mb_indices = indices[start:end]

                mb_states = states[mb_indices]
                mb_actions = actions[mb_indices]
                mb_old_log_probs = old_log_probs[mb_indices]
                mb_advantages = advantages[mb_indices]
                mb_returns = returns[mb_indices]

                # Get current policy outputs
                _, log_probs, entropy, values = self.network.get_action_and_value(
                    mb_states, mb_actions
                )

                # Compute ratio
                ratio = torch.exp(log_probs - mb_old_log_probs)

                # Clipped surrogate objective
                surr1 = ratio * mb_advantages
                surr2 = torch.clamp(ratio, 1 - self.clip_epsilon,
                                    1 + self.clip_epsilon) * mb_advantages
                policy_loss = -torch.min(surr1, surr2).mean()

                # Value loss
                value_loss = F.mse_loss(values, mb_returns)

                # Entropy bonus
                entropy_loss = -entropy.mean()

                # Total loss
                total_loss = (policy_loss +
                              self.value_coef * value_loss +
                              self.entropy_coef * entropy_loss)

                # Update
                self.optimizer.zero_grad()
                total_loss.backward()
                nn.utils.clip_grad_norm_(self.network.parameters(), self.max_grad_norm)
                self.optimizer.step()

                # Track metrics
                with torch.no_grad():
                    approx_kl = ((ratio - 1) - torch.log(ratio)).mean().item()
                    clip_fraction = ((ratio - 1).abs() > self.clip_epsilon).float().mean().item()

                metrics['policy_loss'].append(policy_loss.item())
                metrics['value_loss'].append(value_loss.item())
                metrics['entropy'].append(-entropy_loss.item())
                metrics['approx_kl'].append(approx_kl)
                metrics['clip_fraction'].append(clip_fraction)

        return {k: np.mean(v) for k, v in metrics.items()}


def train_ppo(env_name, num_steps=1000000, rollout_length=2048):
    """Train PPO agent."""
    env = gym.make(env_name)
    state_dim = env.observation_space.shape[0]
    action_dim = env.action_space.n

    agent = PPO(state_dim, action_dim)

    state, _ = env.reset()
    episode_reward = 0
    episode_rewards = []

    rollout_buffer = {
        'states': [], 'actions': [], 'rewards': [],
        'dones': [], 'log_probs': [], 'values': []
    }

    for step in range(num_steps):
        # Collect experience
        action, log_prob, value = agent.select_action(state)
        next_state, reward, terminated, truncated, _ = env.step(action)
        done = terminated or truncated

        rollout_buffer['states'].append(state)
        rollout_buffer['actions'].append(action)
        rollout_buffer['rewards'].append(reward)
        rollout_buffer['dones'].append(float(done))
        rollout_buffer['log_probs'].append(log_prob)
        rollout_buffer['values'].append(value)

        episode_reward += reward
        state = next_state

        if done:
            episode_rewards.append(episode_reward)
            episode_reward = 0
            state, _ = env.reset()

        # Update when rollout is complete
        if len(rollout_buffer['states']) >= rollout_length:
            # Get bootstrap value
            _, _, last_value = agent.select_action(state)

            # Compute advantages
            advantages, returns = agent.compute_advantages(
                np.array(rollout_buffer['rewards']),
                np.array(rollout_buffer['values']),
                np.array(rollout_buffer['dones']),
                last_value
            )

            rollout_buffer['advantages'] = advantages
            rollout_buffer['returns'] = returns

            # Update policy
            metrics = agent.update(rollout_buffer)

            # Clear buffer
            rollout_buffer = {
                'states': [], 'actions': [], 'rewards': [],
                'dones': [], 'log_probs': [], 'values': []
            }

            if len(episode_rewards) > 0:
                print(f"Step {step}, Avg Reward: {np.mean(episode_rewards[-100:]):.2f}, "
                      f"Policy Loss: {metrics['policy_loss']:.4f}, "
                      f"KL: {metrics['approx_kl']:.4f}")

    return agent, episode_rewards
```

---

## Soft Actor-Critic (SAC)

### Overview

SAC is a state-of-the-art off-policy actor-critic algorithm that incorporates entropy maximization. It is particularly effective for continuous control tasks.

### Key Features

1. **Maximum Entropy RL:** Maximizes both expected return and policy entropy
2. **Off-Policy:** Uses experience replay for sample efficiency
3. **Automatic Temperature Tuning:** Learns the entropy coefficient automatically
4. **Twin Q-Networks:** Uses two Q-networks to reduce overestimation bias

### Objective Function

$$J(\pi) = \sum_{t=0}^{T} \mathbb{E}\left[r(s_t, a_t) + \alpha \mathcal{H}(\pi(\cdot|s_t))\right]$$

where $\alpha$ is the temperature parameter and $\mathcal{H}$ is the entropy.

### Implementation

```python
import copy
from collections import deque
import random

class ReplayBuffer:
    """Experience replay buffer for off-policy learning."""

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
    """Squashed Gaussian policy for SAC."""

    def __init__(self, state_dim, action_dim, hidden_dim=256,
                 log_std_min=-20, log_std_max=2):
        super().__init__()
        self.log_std_min = log_std_min
        self.log_std_max = log_std_max

        self.net = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU()
        )
        self.mean = nn.Linear(hidden_dim, action_dim)
        self.log_std = nn.Linear(hidden_dim, action_dim)

    def forward(self, state):
        x = self.net(state)
        mean = self.mean(x)
        log_std = self.log_std(x)
        log_std = torch.clamp(log_std, self.log_std_min, self.log_std_max)
        return mean, log_std

    def sample(self, state):
        mean, log_std = self.forward(state)
        std = log_std.exp()

        # Sample from Gaussian
        normal = Normal(mean, std)
        x = normal.rsample()  # Reparameterization trick

        # Squash through tanh
        action = torch.tanh(x)

        # Compute log probability with correction for tanh squashing
        log_prob = normal.log_prob(x)
        log_prob -= torch.log(1 - action.pow(2) + 1e-6)
        log_prob = log_prob.sum(dim=-1, keepdim=True)

        return action, log_prob, mean


class TwinQNetwork(nn.Module):
    """Twin Q-networks for SAC."""

    def __init__(self, state_dim, action_dim, hidden_dim=256):
        super().__init__()

        # Q1 network
        self.q1 = nn.Sequential(
            nn.Linear(state_dim + action_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )

        # Q2 network
        self.q2 = nn.Sequential(
            nn.Linear(state_dim + action_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )

    def forward(self, state, action):
        x = torch.cat([state, action], dim=-1)
        return self.q1(x), self.q2(x)

    def q1_forward(self, state, action):
        x = torch.cat([state, action], dim=-1)
        return self.q1(x)


class SAC:
    """Soft Actor-Critic algorithm."""

    def __init__(self, state_dim, action_dim, hidden_dim=256,
                 lr_actor=3e-4, lr_critic=3e-4, lr_alpha=3e-4,
                 gamma=0.99, tau=0.005, alpha=0.2,
                 auto_alpha=True, target_entropy=None):
        self.gamma = gamma
        self.tau = tau
        self.auto_alpha = auto_alpha

        self.action_dim = action_dim

        # Networks
        self.actor = SACPolicy(state_dim, action_dim, hidden_dim)
        self.critic = TwinQNetwork(state_dim, action_dim, hidden_dim)
        self.critic_target = copy.deepcopy(self.critic)

        # Optimizers
        self.actor_optimizer = optim.Adam(self.actor.parameters(), lr=lr_actor)
        self.critic_optimizer = optim.Adam(self.critic.parameters(), lr=lr_critic)

        # Temperature (alpha)
        if auto_alpha:
            self.target_entropy = target_entropy or -action_dim
            self.log_alpha = torch.zeros(1, requires_grad=True)
            self.alpha_optimizer = optim.Adam([self.log_alpha], lr=lr_alpha)
            self.alpha = self.log_alpha.exp().item()
        else:
            self.alpha = alpha

        # Replay buffer
        self.buffer = ReplayBuffer()

    def select_action(self, state, deterministic=False):
        state = torch.FloatTensor(state).unsqueeze(0)
        with torch.no_grad():
            if deterministic:
                mean, _ = self.actor(state)
                action = torch.tanh(mean)
            else:
                action, _, _ = self.actor.sample(state)
        return action.squeeze(0).numpy()

    def update(self, batch_size=256):
        if len(self.buffer) < batch_size:
            return None

        # Sample from buffer
        states, actions, rewards, next_states, dones = self.buffer.sample(batch_size)

        # Update critic
        with torch.no_grad():
            next_actions, next_log_probs, _ = self.actor.sample(next_states)
            target_q1, target_q2 = self.critic_target(next_states, next_actions)
            target_q = torch.min(target_q1, target_q2) - self.alpha * next_log_probs
            target_q = rewards + self.gamma * (1 - dones) * target_q

        current_q1, current_q2 = self.critic(states, actions)
        critic_loss = F.mse_loss(current_q1, target_q) + F.mse_loss(current_q2, target_q)

        self.critic_optimizer.zero_grad()
        critic_loss.backward()
        self.critic_optimizer.step()

        # Update actor
        new_actions, log_probs, _ = self.actor.sample(states)
        q1, q2 = self.critic(states, new_actions)
        q = torch.min(q1, q2)

        actor_loss = (self.alpha * log_probs - q).mean()

        self.actor_optimizer.zero_grad()
        actor_loss.backward()
        self.actor_optimizer.step()

        # Update temperature
        if self.auto_alpha:
            alpha_loss = -(self.log_alpha * (log_probs + self.target_entropy).detach()).mean()

            self.alpha_optimizer.zero_grad()
            alpha_loss.backward()
            self.alpha_optimizer.step()

            self.alpha = self.log_alpha.exp().item()

        # Soft update target networks
        for param, target_param in zip(self.critic.parameters(),
                                        self.critic_target.parameters()):
            target_param.data.copy_(self.tau * param.data +
                                    (1 - self.tau) * target_param.data)

        return {
            'critic_loss': critic_loss.item(),
            'actor_loss': actor_loss.item(),
            'alpha': self.alpha,
            'log_probs': log_probs.mean().item()
        }


def train_sac(env_name, num_steps=1000000, start_steps=10000,
              update_after=1000, update_every=50, batch_size=256):
    """Train SAC agent."""
    env = gym.make(env_name)
    state_dim = env.observation_space.shape[0]
    action_dim = env.action_space.shape[0]
    action_scale = env.action_space.high[0]

    agent = SAC(state_dim, action_dim)

    state, _ = env.reset()
    episode_reward = 0
    episode_rewards = []

    for step in range(num_steps):
        # Random actions for initial exploration
        if step < start_steps:
            action = env.action_space.sample()
        else:
            action = agent.select_action(state) * action_scale

        next_state, reward, terminated, truncated, _ = env.step(action)
        done = terminated or truncated

        # Store transition
        agent.buffer.push(state, action / action_scale, reward, next_state, float(done))

        episode_reward += reward
        state = next_state

        if done:
            episode_rewards.append(episode_reward)
            episode_reward = 0
            state, _ = env.reset()

            if len(episode_rewards) % 10 == 0:
                print(f"Episode {len(episode_rewards)}, "
                      f"Avg Reward: {np.mean(episode_rewards[-100:]):.2f}")

        # Update
        if step >= update_after and step % update_every == 0:
            for _ in range(update_every):
                metrics = agent.update(batch_size)

    return agent, episode_rewards
```

---

## Implementation Tips and Best Practices

### Hyperparameter Tuning

| Algorithm | Key Hyperparameters | Typical Values |
|-----------|---------------------|----------------|
| REINFORCE | Learning rate, Gamma | lr=1e-3 to 1e-4, gamma=0.99 |
| A2C | Learning rate, GAE lambda, Entropy coef | lr=7e-4, lambda=0.95, ent=0.01 |
| PPO | Clip epsilon, Update epochs, Minibatch size | eps=0.2, epochs=10, mb=64 |
| SAC | Target entropy, Tau, Buffer size | auto, tau=0.005, buf=1e6 |

### Common Issues and Solutions

```python
# Issue 1: Gradient explosion
# Solution: Gradient clipping
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=0.5)

# Issue 2: Unstable training
# Solution: Normalize observations and rewards
class RunningMeanStd:
    """Tracks running mean and standard deviation."""
    def __init__(self, shape=()):
        self.mean = np.zeros(shape)
        self.var = np.ones(shape)
        self.count = 1e-4

    def update(self, x):
        batch_mean = np.mean(x, axis=0)
        batch_var = np.var(x, axis=0)
        batch_count = x.shape[0]

        delta = batch_mean - self.mean
        total_count = self.count + batch_count

        self.mean += delta * batch_count / total_count
        m_a = self.var * self.count
        m_b = batch_var * batch_count
        M2 = m_a + m_b + np.square(delta) * self.count * batch_count / total_count
        self.var = M2 / total_count
        self.count = total_count

    def normalize(self, x):
        return (x - self.mean) / (np.sqrt(self.var) + 1e-8)


# Issue 3: Poor exploration
# Solution: Add entropy bonus and noise
class NoisyLinear(nn.Module):
    """Linear layer with parameter noise for exploration."""
    def __init__(self, in_features, out_features, sigma_init=0.5):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features

        self.weight_mu = nn.Parameter(torch.empty(out_features, in_features))
        self.weight_sigma = nn.Parameter(torch.empty(out_features, in_features))
        self.register_buffer('weight_epsilon', torch.empty(out_features, in_features))

        self.bias_mu = nn.Parameter(torch.empty(out_features))
        self.bias_sigma = nn.Parameter(torch.empty(out_features))
        self.register_buffer('bias_epsilon', torch.empty(out_features))

        self.sigma_init = sigma_init
        self.reset_parameters()
        self.reset_noise()

    def reset_parameters(self):
        mu_range = 1 / np.sqrt(self.in_features)
        self.weight_mu.data.uniform_(-mu_range, mu_range)
        self.weight_sigma.data.fill_(self.sigma_init / np.sqrt(self.in_features))
        self.bias_mu.data.uniform_(-mu_range, mu_range)
        self.bias_sigma.data.fill_(self.sigma_init / np.sqrt(self.out_features))

    def reset_noise(self):
        epsilon_in = self._scale_noise(self.in_features)
        epsilon_out = self._scale_noise(self.out_features)
        self.weight_epsilon.copy_(epsilon_out.outer(epsilon_in))
        self.bias_epsilon.copy_(epsilon_out)

    def _scale_noise(self, size):
        x = torch.randn(size)
        return x.sign() * x.abs().sqrt()

    def forward(self, x):
        weight = self.weight_mu + self.weight_sigma * self.weight_epsilon
        bias = self.bias_mu + self.bias_sigma * self.bias_epsilon
        return F.linear(x, weight, bias)
```

### Network Architecture Guidelines

```python
def create_policy_network(state_dim, action_dim, hidden_sizes=[256, 256],
                          activation=nn.ReLU, output_activation=None):
    """Create a flexible policy network."""
    layers = []
    prev_dim = state_dim

    for hidden_dim in hidden_sizes:
        layers.extend([
            nn.Linear(prev_dim, hidden_dim),
            activation()
        ])
        prev_dim = hidden_dim

    layers.append(nn.Linear(prev_dim, action_dim))

    if output_activation is not None:
        layers.append(output_activation())

    return nn.Sequential(*layers)


# Weight initialization matters
def init_weights(module):
    """Initialize network weights using orthogonal initialization."""
    if isinstance(module, nn.Linear):
        nn.init.orthogonal_(module.weight, gain=np.sqrt(2))
        if module.bias is not None:
            nn.init.constant_(module.bias, 0)
```

### Logging and Monitoring

```python
from torch.utils.tensorboard import SummaryWriter

class TrainingLogger:
    """Logger for tracking training progress."""

    def __init__(self, log_dir="runs/experiment"):
        self.writer = SummaryWriter(log_dir)
        self.step = 0

    def log_scalar(self, tag, value):
        self.writer.add_scalar(tag, value, self.step)

    def log_histogram(self, tag, values):
        self.writer.add_histogram(tag, values, self.step)

    def log_episode(self, reward, length, metrics=None):
        self.log_scalar("episode/reward", reward)
        self.log_scalar("episode/length", length)

        if metrics:
            for key, value in metrics.items():
                self.log_scalar(f"train/{key}", value)

        self.step += 1

    def close(self):
        self.writer.close()
```

---

## Interview Key Points

### Core Concepts

**Q1: What is the difference between value-based and policy-based methods?**

Value-based methods (Q-learning, DQN) learn a value function and derive the policy from it, while policy-based methods directly parameterize and optimize the policy. Policy methods can handle continuous actions, learn stochastic policies, and often have better convergence properties.

**Q2: Explain the policy gradient theorem.**

The policy gradient theorem states that the gradient of the expected return with respect to policy parameters can be written as:

$$\nabla_\theta J(\theta) = \mathbb{E}[\nabla_\theta \log \pi_\theta(a|s) \cdot Q^{\pi}(s, a)]$$

This allows us to estimate gradients using samples without computing gradients through the environment dynamics.

**Q3: What is the advantage function and why is it useful?**

The advantage function $A(s, a) = Q(s, a) - V(s)$ measures how much better an action is compared to the average action in a state. Using advantages instead of raw returns reduces variance in policy gradient estimates while keeping the gradient unbiased.

**Q4: How does PPO prevent large policy updates?**

PPO uses a clipped surrogate objective that limits the probability ratio $r(\theta) = \frac{\pi_\theta(a|s)}{\pi_{\theta_{old}}(a|s)}$ to stay within $[1-\epsilon, 1+\epsilon]$. This prevents destructively large policy updates that could destabilize training.

**Q5: What makes SAC different from other actor-critic methods?**

SAC maximizes both expected return and policy entropy, which encourages exploration and leads to more robust policies. It uses twin Q-networks to reduce overestimation bias and automatic temperature tuning to balance exploration and exploitation.

### Algorithm Comparison

| Aspect | REINFORCE | A2C | PPO | SAC |
|--------|-----------|-----|-----|-----|
| Sample Efficiency | Low | Medium | Medium | High |
| Stability | Low | Medium | High | High |
| Off-Policy | No | No | No | Yes |
| Action Space | Both | Both | Both | Continuous |
| Complexity | Simple | Medium | Medium | Complex |

### Practical Considerations

**Q6: When should you use PPO vs SAC?**

- **PPO:** General-purpose, works well for discrete and continuous actions, good for parallelized training, simpler to implement and tune
- **SAC:** Best for continuous control, more sample efficient due to replay buffer, better final performance on many tasks

**Q7: How do you debug a policy gradient algorithm that is not learning?**

1. Verify the environment: Test with a random policy
2. Check gradient flow: Ensure gradients are not exploding or vanishing
3. Monitor entropy: Ensure policy is exploring sufficiently
4. Tune learning rate: Often the most critical hyperparameter
5. Normalize observations and rewards
6. Start with smaller networks and increase complexity
7. Test on a simpler environment first

---

## Further Reading

### Recommended Papers

1. **Policy Gradient Methods for RL with Function Approximation** (Sutton et al., 2000)
2. **Asynchronous Methods for Deep RL (A3C)** (Mnih et al., 2016)
3. **Proximal Policy Optimization Algorithms** (Schulman et al., 2017)
4. **Soft Actor-Critic** (Haarnoja et al., 2018)
5. **High-Dimensional Continuous Control Using Generalized Advantage Estimation** (Schulman et al., 2016)

### Resources

- **Spinning Up in Deep RL** (OpenAI): Excellent educational resource with clean implementations
- **CleanRL**: Single-file implementations of popular algorithms
- **Stable Baselines3**: Production-ready implementations in PyTorch
- **RLlib**: Scalable RL library for distributed training

### Advanced Topics

- **Multi-Agent RL:** MAPPO, QMIX
- **Model-Based Policy Gradients:** Dreamer, MBPO
- **Hierarchical RL:** Option-Critic, HIRO
- **Meta-RL:** MAML for RL, RL2
- **Offline RL:** Conservative Q-Learning, Decision Transformer

---

## Summary

Policy gradient methods form the backbone of modern deep reinforcement learning. Key takeaways:

1. **REINFORCE** provides the foundation but suffers from high variance
2. **Baselines and advantage functions** are crucial for reducing variance
3. **Actor-Critic** methods combine policy and value learning for efficiency
4. **PPO** offers stability through clipped objectives and is widely applicable
5. **SAC** achieves state-of-the-art performance on continuous control through entropy maximization

When implementing these algorithms:
- Start with PPO for most applications
- Use SAC for continuous control tasks requiring sample efficiency
- Always normalize observations and consider reward scaling
- Monitor entropy to ensure adequate exploration
- Use proper initialization and gradient clipping

Mastering policy gradient methods opens the door to solving complex sequential decision-making problems across robotics, games, and real-world applications.
