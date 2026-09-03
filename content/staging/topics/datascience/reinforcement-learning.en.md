---
title: Reinforcement Learning Fundamentals
description: Understand core concepts and algorithms in reinforcement learning
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - reinforcement learning
  - Q-Learning
  - Policy Gradient
  - deep RL
status: imported
origin: old/src/content/docs/ai/reinforcement-learning.en.md
divergence: 0.459
issues:
  - divergent
legacy:
  category: AI
  subcategory: ML
  order: 15
  lastUpdated: 2026-01-07
---

Reinforcement Learning (RL) is a powerful machine learning paradigm where an agent learns to make optimal decisions through trial and error interactions with an environment. Unlike supervised learning, which relies on labeled examples, RL learns from the consequences of actions, receiving rewards or penalties that guide the learning process toward optimal behavior.

## Core Concepts

Understanding the fundamental components of reinforcement learning is essential before diving into algorithms and implementations.

### The Agent-Environment Interface

The RL framework consists of two main entities that interact continuously:

**Agent**: The decision-making entity that:
- Observes the current state of the environment
- Selects and executes actions based on its policy
- Receives feedback in the form of rewards
- Updates its knowledge to improve future decisions

**Environment**: The external system that:
- Maintains the current state
- Responds to agent actions with state transitions
- Provides reward signals
- Can be deterministic or stochastic

```python
import numpy as np
from typing import Tuple, Any

class Environment:
    """Abstract base class for RL environments."""

    def reset(self) -> np.ndarray:
        """Reset environment and return initial state."""
        raise NotImplementedError

    def step(self, action: int) -> Tuple[np.ndarray, float, bool, dict]:
        """
        Execute action and return:
        - next_state: The new state after action
        - reward: Immediate reward received
        - done: Whether episode has ended
        - info: Additional diagnostic information
        """
        raise NotImplementedError

    @property
    def action_space(self) -> int:
        """Return number of possible actions."""
        raise NotImplementedError

    @property
    def observation_space(self) -> Tuple[int, ...]:
        """Return shape of state observations."""
        raise NotImplementedError


class Agent:
    """Abstract base class for RL agents."""

    def select_action(self, state: np.ndarray) -> int:
        """Select an action given current state."""
        raise NotImplementedError

    def learn(self, state, action, reward, next_state, done) -> None:
        """Update agent's knowledge based on experience."""
        raise NotImplementedError
```

### States, Actions, and Rewards

**State (S)**: A representation of the environment at a given time step. States can be:
- **Fully observable**: Agent sees complete environment state
- **Partially observable**: Agent has limited or noisy observations

**Action (A)**: The set of possible moves or decisions available to the agent:
- **Discrete actions**: Finite set of choices (e.g., move left, right, up, down)
- **Continuous actions**: Real-valued actions (e.g., steering angle, acceleration)

**Reward (R)**: A scalar feedback signal indicating how good or bad an action was:
- **Immediate reward**: Received right after taking an action
- **Delayed reward**: Consequences of actions appear later
- **Sparse reward**: Reward only at specific milestones

```python
# Example: Simple Grid World Environment
class GridWorld(Environment):
    def __init__(self, size: int = 5):
        self.size = size
        self.goal = (size - 1, size - 1)
        self.reset()

    def reset(self) -> np.ndarray:
        self.agent_pos = [0, 0]
        return self._get_state()

    def _get_state(self) -> np.ndarray:
        state = np.zeros((self.size, self.size))
        state[self.agent_pos[0], self.agent_pos[1]] = 1
        return state.flatten()

    def step(self, action: int) -> Tuple[np.ndarray, float, bool, dict]:
        # Actions: 0=up, 1=down, 2=left, 3=right
        moves = [(-1, 0), (1, 0), (0, -1), (0, 1)]

        new_pos = [
            max(0, min(self.size - 1, self.agent_pos[0] + moves[action][0])),
            max(0, min(self.size - 1, self.agent_pos[1] + moves[action][1]))
        ]
        self.agent_pos = new_pos

        # Check if goal reached
        done = tuple(self.agent_pos) == self.goal
        reward = 1.0 if done else -0.01  # Small penalty for each step

        return self._get_state(), reward, done, {}

    @property
    def action_space(self) -> int:
        return 4

    @property
    def observation_space(self) -> Tuple[int, ...]:
        return (self.size * self.size,)
```

### Policy and Value Functions

**Policy (pi)**: A mapping from states to actions that defines the agent's behavior:
- **Deterministic policy**: pi(s) = a (single action per state)
- **Stochastic policy**: pi(a|s) = P(A=a|S=s) (probability distribution over actions)

**Value Function V(s)**: Expected cumulative reward starting from state s:

```
V^pi(s) = E[sum(gamma^t * R_{t+1}) | S_0 = s, pi]
```

**Action-Value Function Q(s, a)**: Expected cumulative reward starting from state s, taking action a:

```
Q^pi(s, a) = E[sum(gamma^t * R_{t+1}) | S_0 = s, A_0 = a, pi]
```

**Discount Factor (gamma)**: A value between 0 and 1 that determines the importance of future rewards:
- gamma = 0: Only immediate rewards matter (myopic)
- gamma = 1: Future rewards are equally important (far-sighted)
- gamma in (0, 1): Balanced consideration of future rewards

```python
def compute_returns(rewards: list, gamma: float = 0.99) -> list:
    """
    Compute discounted returns for a trajectory.

    Args:
        rewards: List of rewards received at each timestep
        gamma: Discount factor

    Returns:
        List of discounted returns G_t for each timestep
    """
    returns = []
    G = 0

    # Work backwards from the end of the episode
    for reward in reversed(rewards):
        G = reward + gamma * G
        returns.insert(0, G)

    return returns


# Example usage
episode_rewards = [0, 0, 0, 1]  # Reward of 1 at the end
gamma = 0.9

returns = compute_returns(episode_rewards, gamma)
print(f"Returns: {returns}")
# Output: Returns: [0.729, 0.81, 0.9, 1.0]
```

## Markov Decision Process (MDP)

The Markov Decision Process provides the mathematical foundation for reinforcement learning. An MDP formalizes the sequential decision-making problem under uncertainty.

### MDP Definition

An MDP is defined by a tuple (S, A, P, R, gamma) where:
- **S**: Set of all possible states
- **A**: Set of all possible actions
- **P**: State transition probability function P(s'|s, a)
- **R**: Reward function R(s, a, s')
- **gamma**: Discount factor

**Markov Property**: The future state depends only on the current state and action, not on the history:

```
P(S_{t+1} | S_t, A_t, S_{t-1}, A_{t-1}, ...) = P(S_{t+1} | S_t, A_t)
```

### Bellman Equations

The Bellman equations express the relationship between the value of a state and the values of its successor states:

**Bellman Expectation Equation for V**:
```
V^pi(s) = sum_a pi(a|s) * sum_{s'} P(s'|s,a) * [R(s,a,s') + gamma * V^pi(s')]
```

**Bellman Expectation Equation for Q**:
```
Q^pi(s,a) = sum_{s'} P(s'|s,a) * [R(s,a,s') + gamma * sum_{a'} pi(a'|s') * Q^pi(s',a')]
```

**Bellman Optimality Equation**:
```
V*(s) = max_a sum_{s'} P(s'|s,a) * [R(s,a,s') + gamma * V*(s')]
Q*(s,a) = sum_{s'} P(s'|s,a) * [R(s,a,s') + gamma * max_{a'} Q*(s',a')]
```

```python
import numpy as np
from typing import Dict, List, Tuple

class MDP:
    """
    Markov Decision Process implementation.
    """

    def __init__(
        self,
        states: List[str],
        actions: List[str],
        transitions: Dict[Tuple[str, str, str], float],
        rewards: Dict[Tuple[str, str, str], float],
        gamma: float = 0.99
    ):
        self.states = states
        self.actions = actions
        self.transitions = transitions  # P(s'|s, a)
        self.rewards = rewards          # R(s, a, s')
        self.gamma = gamma

    def get_transition_prob(self, state: str, action: str, next_state: str) -> float:
        """Get P(s'|s, a)."""
        return self.transitions.get((state, action, next_state), 0.0)

    def get_reward(self, state: str, action: str, next_state: str) -> float:
        """Get R(s, a, s')."""
        return self.rewards.get((state, action, next_state), 0.0)


def value_iteration(mdp: MDP, theta: float = 1e-6, max_iterations: int = 1000) -> Dict[str, float]:
    """
    Value Iteration algorithm to find optimal value function.

    Args:
        mdp: The MDP to solve
        theta: Convergence threshold
        max_iterations: Maximum number of iterations

    Returns:
        Dictionary mapping states to their optimal values
    """
    # Initialize values to zero
    V = {s: 0.0 for s in mdp.states}

    for iteration in range(max_iterations):
        delta = 0

        for state in mdp.states:
            v = V[state]

            # Compute value for each action and take the maximum
            action_values = []
            for action in mdp.actions:
                action_value = 0
                for next_state in mdp.states:
                    prob = mdp.get_transition_prob(state, action, next_state)
                    reward = mdp.get_reward(state, action, next_state)
                    action_value += prob * (reward + mdp.gamma * V[next_state])
                action_values.append(action_value)

            V[state] = max(action_values) if action_values else 0
            delta = max(delta, abs(v - V[state]))

        if delta < theta:
            print(f"Value iteration converged in {iteration + 1} iterations")
            break

    return V


def policy_iteration(mdp: MDP, theta: float = 1e-6) -> Tuple[Dict[str, str], Dict[str, float]]:
    """
    Policy Iteration algorithm to find optimal policy.

    Returns:
        Tuple of (optimal_policy, optimal_values)
    """
    # Initialize random policy
    policy = {s: mdp.actions[0] for s in mdp.states}
    V = {s: 0.0 for s in mdp.states}

    while True:
        # Policy Evaluation
        while True:
            delta = 0
            for state in mdp.states:
                v = V[state]
                action = policy[state]

                new_value = 0
                for next_state in mdp.states:
                    prob = mdp.get_transition_prob(state, action, next_state)
                    reward = mdp.get_reward(state, action, next_state)
                    new_value += prob * (reward + mdp.gamma * V[next_state])

                V[state] = new_value
                delta = max(delta, abs(v - V[state]))

            if delta < theta:
                break

        # Policy Improvement
        policy_stable = True

        for state in mdp.states:
            old_action = policy[state]

            # Find best action
            best_action = None
            best_value = float('-inf')

            for action in mdp.actions:
                action_value = 0
                for next_state in mdp.states:
                    prob = mdp.get_transition_prob(state, action, next_state)
                    reward = mdp.get_reward(state, action, next_state)
                    action_value += prob * (reward + mdp.gamma * V[next_state])

                if action_value > best_value:
                    best_value = action_value
                    best_action = action

            policy[state] = best_action

            if old_action != best_action:
                policy_stable = False

        if policy_stable:
            break

    return policy, V
```

## Q-Learning

Q-Learning is a model-free, off-policy algorithm that learns the optimal action-value function directly without requiring a model of the environment.

### Q-Learning Algorithm

The Q-Learning update rule:

```
Q(s, a) <- Q(s, a) + alpha * [r + gamma * max_{a'} Q(s', a') - Q(s, a)]
```

Where:
- **alpha**: Learning rate
- **r**: Immediate reward
- **gamma**: Discount factor
- **max_{a'} Q(s', a')**: Maximum Q-value for the next state

```python
import numpy as np
from collections import defaultdict
from typing import Tuple, List
import random

class QLearningAgent:
    """
    Q-Learning agent with epsilon-greedy exploration.
    """

    def __init__(
        self,
        n_actions: int,
        learning_rate: float = 0.1,
        gamma: float = 0.99,
        epsilon: float = 1.0,
        epsilon_min: float = 0.01,
        epsilon_decay: float = 0.995
    ):
        self.n_actions = n_actions
        self.lr = learning_rate
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_min = epsilon_min
        self.epsilon_decay = epsilon_decay

        # Q-table: maps (state, action) -> value
        self.q_table = defaultdict(lambda: np.zeros(n_actions))

    def _state_to_key(self, state: np.ndarray) -> Tuple:
        """Convert state array to hashable tuple for Q-table lookup."""
        return tuple(state.flatten())

    def select_action(self, state: np.ndarray) -> int:
        """
        Select action using epsilon-greedy policy.
        """
        if random.random() < self.epsilon:
            # Exploration: random action
            return random.randint(0, self.n_actions - 1)
        else:
            # Exploitation: best known action
            state_key = self._state_to_key(state)
            return int(np.argmax(self.q_table[state_key]))

    def learn(
        self,
        state: np.ndarray,
        action: int,
        reward: float,
        next_state: np.ndarray,
        done: bool
    ) -> float:
        """
        Update Q-value using the Q-learning update rule.

        Returns:
            The TD error for this update
        """
        state_key = self._state_to_key(state)
        next_state_key = self._state_to_key(next_state)

        # Current Q-value
        current_q = self.q_table[state_key][action]

        # Target Q-value
        if done:
            target_q = reward
        else:
            target_q = reward + self.gamma * np.max(self.q_table[next_state_key])

        # TD error
        td_error = target_q - current_q

        # Update Q-value
        self.q_table[state_key][action] += self.lr * td_error

        return td_error

    def decay_epsilon(self) -> None:
        """Decay exploration rate."""
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)


def train_q_learning(
    env: Environment,
    agent: QLearningAgent,
    n_episodes: int = 1000,
    max_steps: int = 200
) -> List[float]:
    """
    Train Q-Learning agent on environment.

    Returns:
        List of total rewards per episode
    """
    episode_rewards = []

    for episode in range(n_episodes):
        state = env.reset()
        total_reward = 0

        for step in range(max_steps):
            # Select and execute action
            action = agent.select_action(state)
            next_state, reward, done, _ = env.step(action)

            # Learn from experience
            agent.learn(state, action, reward, next_state, done)

            total_reward += reward
            state = next_state

            if done:
                break

        # Decay exploration rate
        agent.decay_epsilon()
        episode_rewards.append(total_reward)

        # Logging
        if (episode + 1) % 100 == 0:
            avg_reward = np.mean(episode_rewards[-100:])
            print(f"Episode {episode + 1}, Avg Reward: {avg_reward:.2f}, Epsilon: {agent.epsilon:.3f}")

    return episode_rewards


# Example usage
env = GridWorld(size=5)
agent = QLearningAgent(n_actions=4)
rewards = train_q_learning(env, agent, n_episodes=500)
```

### SARSA: On-Policy Alternative

SARSA (State-Action-Reward-State-Action) is an on-policy variant that updates Q-values using the action actually taken:

```
Q(s, a) <- Q(s, a) + alpha * [r + gamma * Q(s', a') - Q(s, a)]
```

```python
class SARSAAgent(QLearningAgent):
    """
    SARSA agent - on-policy TD control.
    """

    def learn(
        self,
        state: np.ndarray,
        action: int,
        reward: float,
        next_state: np.ndarray,
        next_action: int,
        done: bool
    ) -> float:
        """
        Update Q-value using SARSA update rule.
        """
        state_key = self._state_to_key(state)
        next_state_key = self._state_to_key(next_state)

        current_q = self.q_table[state_key][action]

        if done:
            target_q = reward
        else:
            # Use the actual next action instead of max
            target_q = reward + self.gamma * self.q_table[next_state_key][next_action]

        td_error = target_q - current_q
        self.q_table[state_key][action] += self.lr * td_error

        return td_error


def train_sarsa(
    env: Environment,
    agent: SARSAAgent,
    n_episodes: int = 1000,
    max_steps: int = 200
) -> List[float]:
    """Train SARSA agent."""
    episode_rewards = []

    for episode in range(n_episodes):
        state = env.reset()
        action = agent.select_action(state)
        total_reward = 0

        for step in range(max_steps):
            next_state, reward, done, _ = env.step(action)
            next_action = agent.select_action(next_state)

            # SARSA update
            agent.learn(state, action, reward, next_state, next_action, done)

            total_reward += reward
            state = next_state
            action = next_action

            if done:
                break

        agent.decay_epsilon()
        episode_rewards.append(total_reward)

    return episode_rewards
```

## Policy Gradient Methods

Policy gradient methods directly optimize the policy without learning a value function. They parameterize the policy and update parameters to maximize expected return.

### REINFORCE Algorithm

REINFORCE is the simplest policy gradient algorithm that uses Monte Carlo sampling:

```
nabla J(theta) = E[sum_t nabla log pi(a_t|s_t; theta) * G_t]
```

```python
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torch.distributions import Categorical
import numpy as np
from typing import List, Tuple

class PolicyNetwork(nn.Module):
    """
    Neural network that outputs action probabilities.
    """

    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 128):
        super().__init__()
        self.fc1 = nn.Linear(state_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, action_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = F.softmax(self.fc3(x), dim=-1)
        return x


class REINFORCEAgent:
    """
    REINFORCE policy gradient agent with baseline.
    """

    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        lr: float = 1e-3,
        gamma: float = 0.99
    ):
        self.gamma = gamma
        self.policy = PolicyNetwork(state_dim, action_dim)
        self.optimizer = optim.Adam(self.policy.parameters(), lr=lr)

        # Episode memory
        self.log_probs = []
        self.rewards = []

    def select_action(self, state: np.ndarray) -> int:
        """Select action from policy distribution."""
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        probs = self.policy(state_tensor)
        distribution = Categorical(probs)
        action = distribution.sample()

        # Store log probability for training
        self.log_probs.append(distribution.log_prob(action))

        return action.item()

    def store_reward(self, reward: float) -> None:
        """Store reward for current step."""
        self.rewards.append(reward)

    def compute_returns(self) -> torch.Tensor:
        """Compute discounted returns with baseline subtraction."""
        returns = []
        G = 0

        for reward in reversed(self.rewards):
            G = reward + self.gamma * G
            returns.insert(0, G)

        returns = torch.tensor(returns)

        # Normalize returns (baseline)
        if len(returns) > 1:
            returns = (returns - returns.mean()) / (returns.std() + 1e-8)

        return returns

    def update(self) -> float:
        """
        Update policy using REINFORCE with baseline.

        Returns:
            Policy loss value
        """
        returns = self.compute_returns()
        log_probs = torch.stack(self.log_probs)

        # Policy gradient loss: -log(pi) * G
        policy_loss = -(log_probs * returns).sum()

        # Gradient descent
        self.optimizer.zero_grad()
        policy_loss.backward()
        self.optimizer.step()

        # Clear episode memory
        self.log_probs = []
        self.rewards = []

        return policy_loss.item()


def train_reinforce(
    env,
    agent: REINFORCEAgent,
    n_episodes: int = 1000,
    max_steps: int = 500
) -> List[float]:
    """Train REINFORCE agent."""
    episode_rewards = []

    for episode in range(n_episodes):
        state = env.reset()
        total_reward = 0

        for step in range(max_steps):
            action = agent.select_action(state)
            next_state, reward, done, _ = env.step(action)

            agent.store_reward(reward)
            total_reward += reward
            state = next_state

            if done:
                break

        # Update policy after episode
        loss = agent.update()
        episode_rewards.append(total_reward)

        if (episode + 1) % 100 == 0:
            avg_reward = np.mean(episode_rewards[-100:])
            print(f"Episode {episode + 1}, Avg Reward: {avg_reward:.2f}, Loss: {loss:.4f}")

    return episode_rewards
```

### Actor-Critic Methods

Actor-Critic combines policy gradient (actor) with value function approximation (critic):

```python
class ActorCritic(nn.Module):
    """
    Combined actor-critic network.
    """

    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 256):
        super().__init__()

        # Shared feature extraction
        self.shared = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU()
        )

        # Actor head (policy)
        self.actor = nn.Linear(hidden_dim, action_dim)

        # Critic head (value function)
        self.critic = nn.Linear(hidden_dim, 1)

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        features = self.shared(x)
        action_probs = F.softmax(self.actor(features), dim=-1)
        state_value = self.critic(features)
        return action_probs, state_value


class A2CAgent:
    """
    Advantage Actor-Critic agent.
    """

    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        lr: float = 3e-4,
        gamma: float = 0.99,
        entropy_coef: float = 0.01,
        value_coef: float = 0.5
    ):
        self.gamma = gamma
        self.entropy_coef = entropy_coef
        self.value_coef = value_coef

        self.network = ActorCritic(state_dim, action_dim)
        self.optimizer = optim.Adam(self.network.parameters(), lr=lr)

        # Storage
        self.values = []
        self.log_probs = []
        self.rewards = []
        self.entropies = []

    def select_action(self, state: np.ndarray) -> int:
        """Select action and store intermediate values."""
        state_tensor = torch.FloatTensor(state).unsqueeze(0)
        action_probs, value = self.network(state_tensor)

        distribution = Categorical(action_probs)
        action = distribution.sample()

        self.log_probs.append(distribution.log_prob(action))
        self.values.append(value.squeeze())
        self.entropies.append(distribution.entropy())

        return action.item()

    def store_reward(self, reward: float) -> None:
        self.rewards.append(reward)

    def update(self, next_state: np.ndarray, done: bool) -> Tuple[float, float, float]:
        """
        Update actor and critic networks.

        Returns:
            Tuple of (actor_loss, critic_loss, entropy_loss)
        """
        # Bootstrap value for incomplete episodes
        if done:
            next_value = 0
        else:
            state_tensor = torch.FloatTensor(next_state).unsqueeze(0)
            _, next_value = self.network(state_tensor)
            next_value = next_value.squeeze().detach()

        # Compute returns and advantages
        returns = []
        G = next_value
        for reward in reversed(self.rewards):
            G = reward + self.gamma * G
            returns.insert(0, G)

        returns = torch.tensor(returns)
        values = torch.stack(self.values)
        log_probs = torch.stack(self.log_probs)
        entropies = torch.stack(self.entropies)

        # Advantage = Return - Value
        advantages = returns - values.detach()

        # Normalize advantages
        if len(advantages) > 1:
            advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        # Actor loss (policy gradient with advantage)
        actor_loss = -(log_probs * advantages).mean()

        # Critic loss (MSE between returns and values)
        critic_loss = F.mse_loss(values, returns)

        # Entropy bonus (encourages exploration)
        entropy_loss = -entropies.mean()

        # Total loss
        total_loss = (
            actor_loss +
            self.value_coef * critic_loss +
            self.entropy_coef * entropy_loss
        )

        # Gradient descent
        self.optimizer.zero_grad()
        total_loss.backward()
        torch.nn.utils.clip_grad_norm_(self.network.parameters(), 0.5)
        self.optimizer.step()

        # Clear storage
        self.values = []
        self.log_probs = []
        self.rewards = []
        self.entropies = []

        return actor_loss.item(), critic_loss.item(), entropy_loss.item()
```

## Deep Q-Network (DQN)

DQN combines Q-learning with deep neural networks, enabling RL in high-dimensional state spaces like images.

### Key Innovations

**Experience Replay**: Store transitions in a buffer and sample randomly for training, breaking correlations between consecutive samples.

**Target Network**: Use a separate, slowly-updated network for computing target values, stabilizing training.

```python
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from collections import deque
import random
from typing import Tuple, List

class ReplayBuffer:
    """
    Experience replay buffer for DQN.
    """

    def __init__(self, capacity: int = 100000):
        self.buffer = deque(maxlen=capacity)

    def push(
        self,
        state: np.ndarray,
        action: int,
        reward: float,
        next_state: np.ndarray,
        done: bool
    ) -> None:
        """Store a transition."""
        self.buffer.append((state, action, reward, next_state, done))

    def sample(self, batch_size: int) -> Tuple[np.ndarray, ...]:
        """Sample a batch of transitions."""
        batch = random.sample(self.buffer, batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)

        return (
            np.array(states),
            np.array(actions),
            np.array(rewards, dtype=np.float32),
            np.array(next_states),
            np.array(dones, dtype=np.float32)
        )

    def __len__(self) -> int:
        return len(self.buffer)


class DQNetwork(nn.Module):
    """
    Deep Q-Network architecture.
    """

    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 256):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, action_dim)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)


class DQNAgent:
    """
    Deep Q-Network agent with experience replay and target network.
    """

    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        lr: float = 1e-4,
        gamma: float = 0.99,
        epsilon: float = 1.0,
        epsilon_min: float = 0.01,
        epsilon_decay: float = 0.995,
        buffer_size: int = 100000,
        batch_size: int = 64,
        target_update_freq: int = 100
    ):
        self.action_dim = action_dim
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_min = epsilon_min
        self.epsilon_decay = epsilon_decay
        self.batch_size = batch_size
        self.target_update_freq = target_update_freq
        self.update_counter = 0

        # Networks
        self.q_network = DQNetwork(state_dim, action_dim)
        self.target_network = DQNetwork(state_dim, action_dim)
        self.target_network.load_state_dict(self.q_network.state_dict())

        self.optimizer = optim.Adam(self.q_network.parameters(), lr=lr)
        self.replay_buffer = ReplayBuffer(buffer_size)

        # Device
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.q_network.to(self.device)
        self.target_network.to(self.device)

    def select_action(self, state: np.ndarray) -> int:
        """Epsilon-greedy action selection."""
        if random.random() < self.epsilon:
            return random.randint(0, self.action_dim - 1)

        state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
        with torch.no_grad():
            q_values = self.q_network(state_tensor)
        return q_values.argmax().item()

    def store_transition(
        self,
        state: np.ndarray,
        action: int,
        reward: float,
        next_state: np.ndarray,
        done: bool
    ) -> None:
        """Store transition in replay buffer."""
        self.replay_buffer.push(state, action, reward, next_state, done)

    def update(self) -> float:
        """
        Sample batch and update Q-network.

        Returns:
            Loss value
        """
        if len(self.replay_buffer) < self.batch_size:
            return 0.0

        # Sample batch
        states, actions, rewards, next_states, dones = self.replay_buffer.sample(self.batch_size)

        # Convert to tensors
        states = torch.FloatTensor(states).to(self.device)
        actions = torch.LongTensor(actions).to(self.device)
        rewards = torch.FloatTensor(rewards).to(self.device)
        next_states = torch.FloatTensor(next_states).to(self.device)
        dones = torch.FloatTensor(dones).to(self.device)

        # Current Q-values
        current_q = self.q_network(states).gather(1, actions.unsqueeze(1)).squeeze()

        # Target Q-values (using target network)
        with torch.no_grad():
            next_q = self.target_network(next_states).max(1)[0]
            target_q = rewards + (1 - dones) * self.gamma * next_q

        # Loss and optimization
        loss = nn.MSELoss()(current_q, target_q)

        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.q_network.parameters(), 10)
        self.optimizer.step()

        # Update target network
        self.update_counter += 1
        if self.update_counter % self.target_update_freq == 0:
            self.target_network.load_state_dict(self.q_network.state_dict())

        return loss.item()

    def decay_epsilon(self) -> None:
        """Decay exploration rate."""
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)


def train_dqn(
    env,
    agent: DQNAgent,
    n_episodes: int = 500,
    max_steps: int = 500
) -> List[float]:
    """Train DQN agent."""
    episode_rewards = []

    for episode in range(n_episodes):
        state = env.reset()
        total_reward = 0

        for step in range(max_steps):
            action = agent.select_action(state)
            next_state, reward, done, _ = env.step(action)

            agent.store_transition(state, action, reward, next_state, done)
            loss = agent.update()

            total_reward += reward
            state = next_state

            if done:
                break

        agent.decay_epsilon()
        episode_rewards.append(total_reward)

        if (episode + 1) % 50 == 0:
            avg_reward = np.mean(episode_rewards[-50:])
            print(f"Episode {episode + 1}, Avg Reward: {avg_reward:.2f}, Epsilon: {agent.epsilon:.3f}")

    return episode_rewards
```

### Double DQN

Double DQN addresses overestimation bias by using the online network for action selection and the target network for value estimation:

```python
class DoubleDQNAgent(DQNAgent):
    """
    Double DQN - addresses overestimation bias.
    """

    def update(self) -> float:
        if len(self.replay_buffer) < self.batch_size:
            return 0.0

        states, actions, rewards, next_states, dones = self.replay_buffer.sample(self.batch_size)

        states = torch.FloatTensor(states).to(self.device)
        actions = torch.LongTensor(actions).to(self.device)
        rewards = torch.FloatTensor(rewards).to(self.device)
        next_states = torch.FloatTensor(next_states).to(self.device)
        dones = torch.FloatTensor(dones).to(self.device)

        # Current Q-values
        current_q = self.q_network(states).gather(1, actions.unsqueeze(1)).squeeze()

        # Double DQN: Use online network to SELECT action, target network to EVALUATE
        with torch.no_grad():
            # Select best action using online network
            next_actions = self.q_network(next_states).argmax(1)
            # Evaluate using target network
            next_q = self.target_network(next_states).gather(1, next_actions.unsqueeze(1)).squeeze()
            target_q = rewards + (1 - dones) * self.gamma * next_q

        loss = nn.MSELoss()(current_q, target_q)

        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.q_network.parameters(), 10)
        self.optimizer.step()

        self.update_counter += 1
        if self.update_counter % self.target_update_freq == 0:
            self.target_network.load_state_dict(self.q_network.state_dict())

        return loss.item()
```

### Dueling DQN

Dueling DQN separates value and advantage estimation:

```python
class DuelingDQNetwork(nn.Module):
    """
    Dueling DQN architecture separating value and advantage streams.
    """

    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 256):
        super().__init__()

        # Shared feature layer
        self.feature = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU()
        )

        # Value stream
        self.value_stream = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )

        # Advantage stream
        self.advantage_stream = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, action_dim)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.feature(x)

        value = self.value_stream(features)
        advantages = self.advantage_stream(features)

        # Combine: Q(s,a) = V(s) + (A(s,a) - mean(A(s,a')))
        q_values = value + advantages - advantages.mean(dim=1, keepdim=True)

        return q_values
```

## Proximal Policy Optimization (PPO)

PPO is a state-of-the-art policy gradient algorithm that achieves stable and efficient learning through clipped objective functions.

### PPO-Clip Algorithm

PPO uses a clipped surrogate objective to prevent too large policy updates:

```
L^CLIP(theta) = E[min(r_t(theta) * A_t, clip(r_t(theta), 1-epsilon, 1+epsilon) * A_t)]
```

Where r_t(theta) is the probability ratio between new and old policies.

```python
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
from torch.distributions import Categorical
import numpy as np
from typing import List, Tuple

class PPONetwork(nn.Module):
    """
    Actor-Critic network for PPO.
    """

    def __init__(self, state_dim: int, action_dim: int, hidden_dim: int = 256):
        super().__init__()

        self.shared = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.Tanh()
        )

        self.actor = nn.Linear(hidden_dim, action_dim)
        self.critic = nn.Linear(hidden_dim, 1)

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        features = self.shared(x)
        action_probs = F.softmax(self.actor(features), dim=-1)
        value = self.critic(features)
        return action_probs, value

    def get_action_and_value(
        self,
        state: torch.Tensor,
        action: torch.Tensor = None
    ) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        """Get action, log probability, entropy, and value."""
        action_probs, value = self.forward(state)
        dist = Categorical(action_probs)

        if action is None:
            action = dist.sample()

        return action, dist.log_prob(action), dist.entropy(), value.squeeze(-1)


class PPOBuffer:
    """
    Buffer for storing trajectories for PPO.
    """

    def __init__(self, buffer_size: int, state_dim: int, gamma: float = 0.99, lam: float = 0.95):
        self.gamma = gamma
        self.lam = lam
        self.ptr = 0
        self.path_start_idx = 0
        self.max_size = buffer_size

        self.states = np.zeros((buffer_size, state_dim), dtype=np.float32)
        self.actions = np.zeros(buffer_size, dtype=np.int64)
        self.rewards = np.zeros(buffer_size, dtype=np.float32)
        self.values = np.zeros(buffer_size, dtype=np.float32)
        self.log_probs = np.zeros(buffer_size, dtype=np.float32)
        self.advantages = np.zeros(buffer_size, dtype=np.float32)
        self.returns = np.zeros(buffer_size, dtype=np.float32)

    def store(
        self,
        state: np.ndarray,
        action: int,
        reward: float,
        value: float,
        log_prob: float
    ) -> None:
        """Store a single timestep."""
        self.states[self.ptr] = state
        self.actions[self.ptr] = action
        self.rewards[self.ptr] = reward
        self.values[self.ptr] = value
        self.log_probs[self.ptr] = log_prob
        self.ptr += 1

    def finish_path(self, last_value: float = 0) -> None:
        """
        Compute GAE-Lambda advantages and returns for completed trajectory.
        """
        path_slice = slice(self.path_start_idx, self.ptr)
        rewards = np.append(self.rewards[path_slice], last_value)
        values = np.append(self.values[path_slice], last_value)

        # GAE-Lambda advantage calculation
        deltas = rewards[:-1] + self.gamma * values[1:] - values[:-1]
        self.advantages[path_slice] = self._discount_cumsum(deltas, self.gamma * self.lam)

        # Returns for value function training
        self.returns[path_slice] = self._discount_cumsum(rewards[:-1], self.gamma)

        self.path_start_idx = self.ptr

    def _discount_cumsum(self, x: np.ndarray, discount: float) -> np.ndarray:
        """Compute discounted cumulative sum."""
        result = np.zeros_like(x)
        result[-1] = x[-1]
        for t in reversed(range(len(x) - 1)):
            result[t] = x[t] + discount * result[t + 1]
        return result

    def get(self) -> Tuple[torch.Tensor, ...]:
        """Get all data and reset buffer."""
        # Normalize advantages
        adv = self.advantages[:self.ptr]
        adv = (adv - adv.mean()) / (adv.std() + 1e-8)

        data = (
            torch.FloatTensor(self.states[:self.ptr]),
            torch.LongTensor(self.actions[:self.ptr]),
            torch.FloatTensor(self.log_probs[:self.ptr]),
            torch.FloatTensor(self.returns[:self.ptr]),
            torch.FloatTensor(adv)
        )

        self.ptr = 0
        self.path_start_idx = 0

        return data


class PPOAgent:
    """
    Proximal Policy Optimization agent.
    """

    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        lr: float = 3e-4,
        gamma: float = 0.99,
        lam: float = 0.95,
        clip_ratio: float = 0.2,
        target_kl: float = 0.01,
        value_coef: float = 0.5,
        entropy_coef: float = 0.01,
        n_epochs: int = 10,
        batch_size: int = 64,
        buffer_size: int = 2048
    ):
        self.clip_ratio = clip_ratio
        self.target_kl = target_kl
        self.value_coef = value_coef
        self.entropy_coef = entropy_coef
        self.n_epochs = n_epochs
        self.batch_size = batch_size

        self.network = PPONetwork(state_dim, action_dim)
        self.optimizer = optim.Adam(self.network.parameters(), lr=lr)
        self.buffer = PPOBuffer(buffer_size, state_dim, gamma, lam)

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.network.to(self.device)

    def select_action(self, state: np.ndarray) -> Tuple[int, float, float]:
        """Select action and return action, log_prob, value."""
        state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)

        with torch.no_grad():
            action, log_prob, _, value = self.network.get_action_and_value(state_tensor)

        return action.item(), log_prob.item(), value.item()

    def store(
        self,
        state: np.ndarray,
        action: int,
        reward: float,
        value: float,
        log_prob: float
    ) -> None:
        """Store experience in buffer."""
        self.buffer.store(state, action, reward, value, log_prob)

    def finish_path(self, last_value: float = 0) -> None:
        """Signal end of trajectory."""
        self.buffer.finish_path(last_value)

    def update(self) -> dict:
        """
        Perform PPO update.

        Returns:
            Dictionary with training statistics
        """
        states, actions, old_log_probs, returns, advantages = self.buffer.get()

        states = states.to(self.device)
        actions = actions.to(self.device)
        old_log_probs = old_log_probs.to(self.device)
        returns = returns.to(self.device)
        advantages = advantages.to(self.device)

        total_policy_loss = 0
        total_value_loss = 0
        total_entropy = 0
        n_updates = 0

        for epoch in range(self.n_epochs):
            # Create random permutation for mini-batches
            indices = np.random.permutation(len(states))

            for start in range(0, len(states), self.batch_size):
                end = start + self.batch_size
                batch_indices = indices[start:end]

                batch_states = states[batch_indices]
                batch_actions = actions[batch_indices]
                batch_old_log_probs = old_log_probs[batch_indices]
                batch_returns = returns[batch_indices]
                batch_advantages = advantages[batch_indices]

                # Get current policy outputs
                _, new_log_probs, entropy, values = self.network.get_action_and_value(
                    batch_states, batch_actions
                )

                # Policy ratio
                ratio = torch.exp(new_log_probs - batch_old_log_probs)

                # Clipped surrogate objective
                surr1 = ratio * batch_advantages
                surr2 = torch.clamp(ratio, 1 - self.clip_ratio, 1 + self.clip_ratio) * batch_advantages
                policy_loss = -torch.min(surr1, surr2).mean()

                # Value loss
                value_loss = F.mse_loss(values, batch_returns)

                # Entropy bonus
                entropy_loss = -entropy.mean()

                # Total loss
                loss = policy_loss + self.value_coef * value_loss + self.entropy_coef * entropy_loss

                self.optimizer.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.network.parameters(), 0.5)
                self.optimizer.step()

                total_policy_loss += policy_loss.item()
                total_value_loss += value_loss.item()
                total_entropy += entropy.mean().item()
                n_updates += 1

            # Early stopping based on KL divergence
            with torch.no_grad():
                _, new_log_probs, _, _ = self.network.get_action_and_value(states, actions)
                kl = (old_log_probs - new_log_probs).mean().item()

                if kl > 1.5 * self.target_kl:
                    break

        return {
            'policy_loss': total_policy_loss / n_updates,
            'value_loss': total_value_loss / n_updates,
            'entropy': total_entropy / n_updates,
            'epochs': epoch + 1
        }


def train_ppo(
    env,
    agent: PPOAgent,
    n_iterations: int = 100,
    steps_per_iteration: int = 2048,
    max_episode_steps: int = 500
) -> List[float]:
    """Train PPO agent."""
    all_rewards = []

    for iteration in range(n_iterations):
        state = env.reset()
        episode_reward = 0
        episode_rewards = []

        for step in range(steps_per_iteration):
            action, log_prob, value = agent.select_action(state)
            next_state, reward, done, _ = env.step(action)

            agent.store(state, action, reward, value, log_prob)
            episode_reward += reward

            state = next_state

            if done:
                agent.finish_path(0)
                episode_rewards.append(episode_reward)
                state = env.reset()
                episode_reward = 0
            elif step == steps_per_iteration - 1:
                # Bootstrap for incomplete episode
                _, _, last_value = agent.select_action(next_state)
                agent.finish_path(last_value)

        # Update policy
        stats = agent.update()

        avg_reward = np.mean(episode_rewards) if episode_rewards else 0
        all_rewards.extend(episode_rewards)

        print(f"Iteration {iteration + 1}, Avg Reward: {avg_reward:.2f}, "
              f"Policy Loss: {stats['policy_loss']:.4f}, "
              f"Value Loss: {stats['value_loss']:.4f}")

    return all_rewards
```

## Practical Applications

### OpenAI Gym Integration

```python
import gymnasium as gym
import numpy as np
import torch

def train_on_gym_env(env_name: str = "CartPole-v1", algorithm: str = "ppo"):
    """
    Train RL agent on OpenAI Gym environment.
    """
    env = gym.make(env_name)
    state_dim = env.observation_space.shape[0]
    action_dim = env.action_space.n

    if algorithm == "dqn":
        agent = DQNAgent(state_dim, action_dim)

        for episode in range(500):
            state, _ = env.reset()
            total_reward = 0

            while True:
                action = agent.select_action(state)
                next_state, reward, terminated, truncated, _ = env.step(action)
                done = terminated or truncated

                agent.store_transition(state, action, reward, next_state, done)
                agent.update()

                total_reward += reward
                state = next_state

                if done:
                    break

            agent.decay_epsilon()

            if (episode + 1) % 50 == 0:
                print(f"Episode {episode + 1}, Reward: {total_reward}")

    elif algorithm == "ppo":
        agent = PPOAgent(state_dim, action_dim)

        for iteration in range(100):
            state, _ = env.reset()
            episode_rewards = []
            episode_reward = 0

            for step in range(2048):
                action, log_prob, value = agent.select_action(state)
                next_state, reward, terminated, truncated, _ = env.step(action)
                done = terminated or truncated

                agent.store(state, action, reward, value, log_prob)
                episode_reward += reward
                state = next_state

                if done:
                    agent.finish_path(0)
                    episode_rewards.append(episode_reward)
                    state, _ = env.reset()
                    episode_reward = 0

            if not done:
                _, _, last_value = agent.select_action(state)
                agent.finish_path(last_value)

            agent.update()
            print(f"Iteration {iteration + 1}, Avg Reward: {np.mean(episode_rewards):.2f}")

    env.close()
    return agent


# Run training
agent = train_on_gym_env("CartPole-v1", "ppo")
```

### Custom Environment Example

```python
import gymnasium as gym
from gymnasium import spaces
import numpy as np

class StockTradingEnv(gym.Env):
    """
    Simple stock trading environment for RL.
    """

    def __init__(self, stock_data: np.ndarray, initial_balance: float = 10000):
        super().__init__()

        self.stock_data = stock_data  # Shape: (n_days, n_features)
        self.initial_balance = initial_balance
        self.n_days = len(stock_data)

        # Actions: 0 = hold, 1 = buy, 2 = sell
        self.action_space = spaces.Discrete(3)

        # State: stock features + portfolio info
        n_stock_features = stock_data.shape[1]
        self.observation_space = spaces.Box(
            low=-np.inf,
            high=np.inf,
            shape=(n_stock_features + 3,),  # +3 for balance, shares, portfolio value
            dtype=np.float32
        )

        self.reset()

    def reset(self, seed=None):
        super().reset(seed=seed)
        self.current_step = 0
        self.balance = self.initial_balance
        self.shares_held = 0
        self.cost_basis = 0

        return self._get_observation(), {}

    def _get_observation(self) -> np.ndarray:
        stock_features = self.stock_data[self.current_step]
        current_price = stock_features[0]  # Assume first feature is price
        portfolio_value = self.balance + self.shares_held * current_price

        return np.concatenate([
            stock_features,
            [self.balance / self.initial_balance],
            [self.shares_held / 100],
            [portfolio_value / self.initial_balance]
        ]).astype(np.float32)

    def step(self, action: int):
        current_price = self.stock_data[self.current_step][0]

        # Execute action
        if action == 1:  # Buy
            shares_to_buy = self.balance // current_price
            if shares_to_buy > 0:
                cost = shares_to_buy * current_price
                self.balance -= cost
                self.shares_held += shares_to_buy
                self.cost_basis = current_price

        elif action == 2:  # Sell
            if self.shares_held > 0:
                revenue = self.shares_held * current_price
                self.balance += revenue
                self.shares_held = 0

        # Move to next day
        self.current_step += 1
        done = self.current_step >= self.n_days - 1

        # Calculate reward (change in portfolio value)
        new_price = self.stock_data[self.current_step][0]
        portfolio_value = self.balance + self.shares_held * new_price
        reward = (portfolio_value - self.initial_balance) / self.initial_balance

        return self._get_observation(), reward, done, False, {}


# Generate synthetic stock data
np.random.seed(42)
n_days = 252  # One trading year
prices = 100 + np.cumsum(np.random.randn(n_days) * 2)
volumes = np.random.randint(1000000, 10000000, n_days)
stock_data = np.column_stack([prices, volumes])

# Create and train on environment
env = StockTradingEnv(stock_data)
agent = DQNAgent(state_dim=5, action_dim=3)

# Training loop
for episode in range(100):
    state, _ = env.reset()
    total_reward = 0

    while True:
        action = agent.select_action(state)
        next_state, reward, done, _, _ = env.step(action)

        agent.store_transition(state, action, reward, next_state, done)
        agent.update()

        total_reward += reward
        state = next_state

        if done:
            break

    agent.decay_epsilon()
    print(f"Episode {episode + 1}, Final Portfolio Return: {total_reward:.2%}")
```

### Multi-Agent Reinforcement Learning

```python
import numpy as np
from typing import List, Dict, Tuple

class MultiAgentEnvironment:
    """
    Base class for multi-agent environments.
    """

    def reset(self) -> Dict[str, np.ndarray]:
        """Reset and return initial observations for all agents."""
        raise NotImplementedError

    def step(self, actions: Dict[str, int]) -> Tuple[
        Dict[str, np.ndarray],  # observations
        Dict[str, float],       # rewards
        Dict[str, bool],        # dones
        Dict[str, dict]         # infos
    ]:
        raise NotImplementedError


class IndependentQLearning:
    """
    Independent Q-Learning for multi-agent settings.
    Each agent learns independently, treating other agents as part of environment.
    """

    def __init__(self, agent_ids: List[str], n_actions: int, **kwargs):
        self.agents = {
            agent_id: QLearningAgent(n_actions, **kwargs)
            for agent_id in agent_ids
        }

    def select_actions(self, observations: Dict[str, np.ndarray]) -> Dict[str, int]:
        """Select actions for all agents."""
        return {
            agent_id: agent.select_action(observations[agent_id])
            for agent_id, agent in self.agents.items()
        }

    def learn(
        self,
        observations: Dict[str, np.ndarray],
        actions: Dict[str, int],
        rewards: Dict[str, float],
        next_observations: Dict[str, np.ndarray],
        dones: Dict[str, bool]
    ) -> None:
        """Update all agents."""
        for agent_id, agent in self.agents.items():
            agent.learn(
                observations[agent_id],
                actions[agent_id],
                rewards[agent_id],
                next_observations[agent_id],
                dones[agent_id]
            )

    def decay_epsilon(self) -> None:
        """Decay exploration for all agents."""
        for agent in self.agents.values():
            agent.decay_epsilon()
```

## Best Practices and Tips

### Hyperparameter Tuning

Key hyperparameters and typical ranges:

| Parameter | Typical Range | Notes |
|-----------|--------------|-------|
| Learning rate | 1e-5 to 1e-3 | Start higher, decay over time |
| Discount factor (gamma) | 0.95 to 0.999 | Higher for long-horizon tasks |
| Epsilon (exploration) | 1.0 to 0.01 | Decay from 1.0 during training |
| Batch size | 32 to 256 | Larger for more stable gradients |
| Replay buffer size | 10K to 1M | Depends on task complexity |
| Target network update | 100 to 10000 | More frequent for faster learning |
| PPO clip ratio | 0.1 to 0.3 | 0.2 is commonly used |

### Common Pitfalls and Solutions

**Reward Shaping**:
- Sparse rewards can make learning difficult
- Add intermediate rewards to guide learning
- Be careful not to introduce reward hacking

**Exploration vs Exploitation**:
- Start with high exploration, decay gradually
- Use curiosity-driven exploration for sparse reward settings
- Consider entropy bonuses in policy gradient methods

**Training Stability**:
- Use gradient clipping to prevent exploding gradients
- Normalize observations and rewards
- Use target networks and experience replay in Q-learning

```python
def normalize_observations(obs: np.ndarray, running_mean: np.ndarray, running_std: np.ndarray) -> np.ndarray:
    """Normalize observations using running statistics."""
    return (obs - running_mean) / (running_std + 1e-8)


class RunningNormalizer:
    """Online computation of mean and std for normalization."""

    def __init__(self, shape: Tuple[int, ...]):
        self.mean = np.zeros(shape)
        self.var = np.ones(shape)
        self.count = 1e-4

    def update(self, x: np.ndarray) -> None:
        batch_mean = np.mean(x, axis=0)
        batch_var = np.var(x, axis=0)
        batch_count = x.shape[0]

        self._update_from_moments(batch_mean, batch_var, batch_count)

    def _update_from_moments(self, batch_mean, batch_var, batch_count):
        delta = batch_mean - self.mean
        tot_count = self.count + batch_count

        new_mean = self.mean + delta * batch_count / tot_count
        m_a = self.var * self.count
        m_b = batch_var * batch_count
        m2 = m_a + m_b + np.square(delta) * self.count * batch_count / tot_count
        new_var = m2 / tot_count

        self.mean = new_mean
        self.var = new_var
        self.count = tot_count

    def normalize(self, x: np.ndarray) -> np.ndarray:
        return (x - self.mean) / (np.sqrt(self.var) + 1e-8)
```

### Evaluation and Debugging

```python
def evaluate_agent(env, agent, n_episodes: int = 10, render: bool = False) -> dict:
    """
    Evaluate trained agent without exploration.
    """
    episode_rewards = []
    episode_lengths = []

    for episode in range(n_episodes):
        state = env.reset()
        if isinstance(state, tuple):
            state = state[0]

        total_reward = 0
        steps = 0

        while True:
            # Greedy action selection (no exploration)
            with torch.no_grad():
                if hasattr(agent, 'q_network'):
                    state_tensor = torch.FloatTensor(state).unsqueeze(0)
                    action = agent.q_network(state_tensor).argmax().item()
                elif hasattr(agent, 'network'):
                    state_tensor = torch.FloatTensor(state).unsqueeze(0)
                    action_probs, _ = agent.network(state_tensor)
                    action = action_probs.argmax().item()
                else:
                    action = agent.select_action(state)

            result = env.step(action)
            if len(result) == 5:
                next_state, reward, terminated, truncated, _ = result
                done = terminated or truncated
            else:
                next_state, reward, done, _ = result

            total_reward += reward
            steps += 1
            state = next_state

            if done:
                break

        episode_rewards.append(total_reward)
        episode_lengths.append(steps)

    return {
        'mean_reward': np.mean(episode_rewards),
        'std_reward': np.std(episode_rewards),
        'mean_length': np.mean(episode_lengths),
        'min_reward': np.min(episode_rewards),
        'max_reward': np.max(episode_rewards)
    }


# Example usage
stats = evaluate_agent(env, trained_agent, n_episodes=100)
print(f"Mean Reward: {stats['mean_reward']:.2f} +/- {stats['std_reward']:.2f}")
print(f"Mean Episode Length: {stats['mean_length']:.1f}")
```

## Summary

Reinforcement learning provides a powerful framework for training agents to make sequential decisions through trial and error. Key takeaways:

1. **Core Components**: Understanding the agent-environment interface, states, actions, and rewards is fundamental to all RL approaches.

2. **MDP Foundation**: The Markov Decision Process provides the mathematical framework for modeling sequential decision problems.

3. **Value-Based Methods**: Q-Learning and its deep variants (DQN, Double DQN, Dueling DQN) learn action-value functions and derive policies from them.

4. **Policy Gradient Methods**: REINFORCE and Actor-Critic methods directly optimize the policy, enabling continuous action spaces and stochastic policies.

5. **Modern Algorithms**: PPO represents the current state-of-the-art for many tasks, offering stable training through clipped objectives.

6. **Practical Considerations**: Successful RL requires careful attention to reward design, exploration strategies, and hyperparameter tuning.

The field continues to advance rapidly with developments in model-based RL, offline RL, hierarchical RL, and multi-agent systems. Understanding these fundamentals provides a solid foundation for exploring these advanced topics.
