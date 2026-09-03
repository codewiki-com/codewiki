---
title: "Reinforcement Learning: Fundamental Algorithms"
description: "Master RL core concepts: Q-Learning, SARSA, and DQN"
track: ai
section: deep-learning
difficulty: advanced
tags:
  - reinforcement learning
  - Q-Learning
  - DQN
  - fundamentals
status: imported
origin: old/src/content/docs/datascience/rl-fundamentals.en.md
divergence: 0.142
issues: []
legacy:
  category: DataScience
  subcategory: RL
  order: 29
  lastUpdated: 2026-01-07
---

Reinforcement Learning (RL) is a paradigm of machine learning where an agent learns to make decisions by interacting with an environment. Unlike supervised learning, RL does not require labeled data; instead, the agent learns from the consequences of its actions through trial and error. We'll cover the foundational concepts, algorithms, and implementations that form the backbone of modern reinforcement learning.

---

## The RL Framework: Markov Decision Processes

### What is Reinforcement Learning?

Reinforcement Learning is inspired by how humans and animals learn through interaction with their environment. An RL agent:

1. **Observes** the current state of the environment
2. **Takes an action** based on its policy
3. **Receives a reward** signal from the environment
4. **Transitions** to a new state
5. **Learns** to maximize cumulative rewards over time

**Key Components:**

- **Agent**: The learner and decision-maker
- **Environment**: Everything the agent interacts with
- **State (s)**: A representation of the current situation
- **Action (a)**: A choice made by the agent
- **Reward (r)**: Immediate feedback from the environment
- **Policy ($\pi$)**: The agent's strategy for selecting actions

### Markov Decision Process (MDP)

An MDP provides the mathematical framework for modeling RL problems. An MDP is defined by a tuple $(S, A, P, R, \gamma)$:

| Component | Description |
|-----------|-------------|
| $S$ | Set of all possible states |
| $A$ | Set of all possible actions |
| $P(s' \mid s, a)$ | State transition probability |
| $R(s, a, s')$ | Reward function |
| $\gamma \in [0, 1]$ | Discount factor |

**The Markov Property:**

The future depends only on the current state, not on the history of how we got there:

$$P(s_{t+1} \mid s_t, a_t, s_{t-1}, a_{t-1}, ..., s_0) = P(s_{t+1} \mid s_t, a_t)$$

This property makes computation tractable and allows us to define value functions recursively.

### Types of RL Problems

| Type | Description | Example |
|------|-------------|---------|
| Episodic | Tasks with natural endpoints | Chess games, maze navigation |
| Continuing | Tasks that go on forever | Process control, stock trading |
| Model-based | Agent has access to environment model | Planning with known dynamics |
| Model-free | Agent learns without environment model | Q-Learning, Policy Gradient |

```python
import numpy as np
from typing import Tuple, Dict, List

class MDP:
    """A simple Markov Decision Process implementation."""

    def __init__(self,
                 states: List[int],
                 actions: List[int],
                 transition_probs: Dict,
                 rewards: Dict,
                 gamma: float = 0.99):
        """
        Initialize MDP.

        Args:
            states: List of state indices
            actions: List of action indices
            transition_probs: P(s'|s,a) as dict {(s,a,s'): probability}
            rewards: R(s,a,s') as dict {(s,a,s'): reward}
            gamma: Discount factor
        """
        self.states = states
        self.actions = actions
        self.transition_probs = transition_probs
        self.rewards = rewards
        self.gamma = gamma

    def get_transition_prob(self, state: int, action: int, next_state: int) -> float:
        """Get transition probability P(s'|s,a)."""
        return self.transition_probs.get((state, action, next_state), 0.0)

    def get_reward(self, state: int, action: int, next_state: int) -> float:
        """Get reward R(s,a,s')."""
        return self.rewards.get((state, action, next_state), 0.0)

    def get_possible_next_states(self, state: int, action: int) -> List[int]:
        """Get all possible next states from (s,a)."""
        next_states = []
        for (s, a, s_next), prob in self.transition_probs.items():
            if s == state and a == action and prob > 0:
                next_states.append(s_next)
        return next_states


# Example: Simple Grid World
class GridWorld:
    """A simple 4x4 grid world environment."""

    def __init__(self, size: int = 4):
        self.size = size
        self.state = 0  # Start at top-left
        self.terminal_states = [0, size * size - 1]  # Corners

        # Actions: 0=up, 1=right, 2=down, 3=left
        self.actions = [0, 1, 2, 3]
        self.action_effects = {
            0: -size,  # up
            1: 1,      # right
            2: size,   # down
            3: -1      # left
        }

    def reset(self) -> int:
        """Reset to random non-terminal state."""
        valid_states = [s for s in range(self.size * self.size)
                       if s not in self.terminal_states]
        self.state = np.random.choice(valid_states)
        return self.state

    def step(self, action: int) -> Tuple[int, float, bool]:
        """Take an action and return (next_state, reward, done)."""
        if self.state in self.terminal_states:
            return self.state, 0, True

        # Calculate next state
        row, col = self.state // self.size, self.state % self.size

        if action == 0 and row > 0:  # up
            next_state = self.state - self.size
        elif action == 1 and col < self.size - 1:  # right
            next_state = self.state + 1
        elif action == 2 and row < self.size - 1:  # down
            next_state = self.state + self.size
        elif action == 3 and col > 0:  # left
            next_state = self.state - 1
        else:
            next_state = self.state  # Hit wall, stay in place

        self.state = next_state
        reward = -1  # -1 for each step (encourages shortest path)
        done = self.state in self.terminal_states

        return next_state, reward, done

    def render(self):
        """Print the grid with current position."""
        for i in range(self.size * self.size):
            if i % self.size == 0:
                print()
            if i == self.state:
                print(" A ", end="")
            elif i in self.terminal_states:
                print(" T ", end="")
            else:
                print(" . ", end="")
        print("\n")
```

---

## Value Functions and Policies

### Policy

A policy $\pi$ defines the agent's behavior. It maps states to actions (or probability distributions over actions).

**Deterministic Policy:**
$$\pi(s) = a$$

**Stochastic Policy:**
$$\pi(a \mid s) = P(A_t = a \mid S_t = s)$$

### State-Value Function

The state-value function $V^\pi(s)$ represents the expected cumulative reward starting from state $s$ and following policy $\pi$:

$$V^\pi(s) = \mathbb{E}_\pi \left[ \sum_{k=0}^{\infty} \gamma^k R_{t+k+1} \mid S_t = s \right]$$

**Interpretation:** "How good is it to be in state $s$?"

### Action-Value Function (Q-Function)

The action-value function $Q^\pi(s, a)$ represents the expected cumulative reward starting from state $s$, taking action $a$, and then following policy $\pi$:

$$Q^\pi(s, a) = \mathbb{E}_\pi \left[ \sum_{k=0}^{\infty} \gamma^k R_{t+k+1} \mid S_t = s, A_t = a \right]$$

**Interpretation:** "How good is it to take action $a$ in state $s$?"

### Optimal Value Functions

The optimal value functions represent the best possible performance:

$$V^*(s) = \max_\pi V^\pi(s)$$
$$Q^*(s, a) = \max_\pi Q^\pi(s, a)$$

**Relationship between V* and Q*:**

$$V^*(s) = \max_a Q^*(s, a)$$
$$Q^*(s, a) = R(s, a) + \gamma \sum_{s'} P(s' \mid s, a) V^*(s')$$

```python
import numpy as np
from typing import Dict, Callable

class ValueFunctions:
    """Implementation of value function estimation methods."""

    def __init__(self, num_states: int, num_actions: int, gamma: float = 0.99):
        self.num_states = num_states
        self.num_actions = num_actions
        self.gamma = gamma

        # Initialize value functions
        self.V = np.zeros(num_states)
        self.Q = np.zeros((num_states, num_actions))

    def policy_evaluation(self,
                         env,
                         policy: np.ndarray,
                         theta: float = 1e-6,
                         max_iterations: int = 1000) -> np.ndarray:
        """
        Assess a policy using iterative policy evaluation.

        Args:
            env: Environment with step() method
            policy: Policy as array of shape (num_states, num_actions)
            theta: Convergence threshold
            max_iterations: Maximum number of iterations

        Returns:
            Value function as array of shape (num_states,)
        """
        V = np.zeros(self.num_states)

        for iteration in range(max_iterations):
            delta = 0

            for s in range(self.num_states):
                v = V[s]

                # Compute new value
                new_v = 0
                for a in range(self.num_actions):
                    # Get transition dynamics (simplified for demonstration)
                    env.state = s
                    next_s, reward, done = env.step(a)

                    # V(s) = sum_a pi(a|s) * [R + gamma * V(s')]
                    if done:
                        new_v += policy[s, a] * reward
                    else:
                        new_v += policy[s, a] * (reward + self.gamma * V[next_s])

                    env.state = s  # Reset for next action

                V[s] = new_v
                delta = max(delta, abs(v - V[s]))

            if delta < theta:
                print(f"Policy evaluation converged in {iteration + 1} iterations")
                break

        self.V = V
        return V

    def policy_improvement(self, env, V: np.ndarray) -> np.ndarray:
        """
        Improve policy based on value function.

        Args:
            env: Environment
            V: Current value function

        Returns:
            Improved policy
        """
        policy = np.zeros((self.num_states, self.num_actions))

        for s in range(self.num_states):
            action_values = np.zeros(self.num_actions)

            for a in range(self.num_actions):
                env.state = s
                next_s, reward, done = env.step(a)

                if done:
                    action_values[a] = reward
                else:
                    action_values[a] = reward + self.gamma * V[next_s]

                env.state = s

            # Greedy policy: probability 1 for best action
            best_action = np.argmax(action_values)
            policy[s, best_action] = 1.0

        return policy

    def policy_iteration(self, env, theta: float = 1e-6) -> Tuple[np.ndarray, np.ndarray]:
        """
        Find optimal policy using policy iteration.

        Returns:
            Tuple of (optimal_policy, optimal_value_function)
        """
        # Initialize random policy
        policy = np.ones((self.num_states, self.num_actions)) / self.num_actions

        iteration = 0
        while True:
            iteration += 1

            # Policy Evaluation
            V = self.policy_evaluation(env, policy, theta)

            # Policy Improvement
            new_policy = self.policy_improvement(env, V)

            # Check for convergence
            if np.allclose(policy, new_policy):
                print(f"Policy iteration converged in {iteration} iterations")
                break

            policy = new_policy

        return policy, V

    def value_iteration(self, env, theta: float = 1e-6, max_iterations: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
        """
        Find optimal value function using value iteration.

        Returns:
            Tuple of (optimal_policy, optimal_value_function)
        """
        V = np.zeros(self.num_states)

        for iteration in range(max_iterations):
            delta = 0

            for s in range(self.num_states):
                v = V[s]

                # Compute action values
                action_values = np.zeros(self.num_actions)
                for a in range(self.num_actions):
                    env.state = s
                    next_s, reward, done = env.step(a)

                    if done:
                        action_values[a] = reward
                    else:
                        action_values[a] = reward + self.gamma * V[next_s]

                    env.state = s

                # V(s) = max_a Q(s,a)
                V[s] = np.max(action_values)
                delta = max(delta, abs(v - V[s]))

            if delta < theta:
                print(f"Value iteration converged in {iteration + 1} iterations")
                break

        # Extract policy from value function
        policy = self.policy_improvement(env, V)

        self.V = V
        return policy, V
```

---

## The Bellman Equation

The Bellman equation is the foundation of all value-based RL methods. It expresses the relationship between the value of a state and the values of its successor states.

### Bellman Expectation Equation

For a policy $\pi$:

**State-Value Form:**
$$V^\pi(s) = \sum_a \pi(a \mid s) \left[ R(s, a) + \gamma \sum_{s'} P(s' \mid s, a) V^\pi(s') \right]$$

**Action-Value Form:**
$$Q^\pi(s, a) = R(s, a) + \gamma \sum_{s'} P(s' \mid s, a) \sum_{a'} \pi(a' \mid s') Q^\pi(s', a')$$

### Bellman Optimality Equation

For optimal value functions:

**State-Value Form:**
$$V^*(s) = \max_a \left[ R(s, a) + \gamma \sum_{s'} P(s' \mid s, a) V^*(s') \right]$$

**Action-Value Form:**
$$Q^*(s, a) = R(s, a) + \gamma \sum_{s'} P(s' \mid s, a) \max_{a'} Q^*(s', a')$$

### Understanding the Bellman Equation

The Bellman equation can be understood as a recursive decomposition:

$$\text{Value of current state} = \text{Immediate reward} + \gamma \times \text{Value of next state}$$

This recursive structure allows us to:
1. **Compute values iteratively** (Dynamic Programming)
2. **Update estimates from experience** (TD Learning)
3. **Propagate reward information** backward through trajectories

```python
def bellman_expectation_update(V: np.ndarray,
                                state: int,
                                policy: np.ndarray,
                                env,
                                gamma: float) -> float:
    """
    Compute Bellman expectation update for state value.

    V(s) = sum_a pi(a|s) * [R(s,a) + gamma * sum_s' P(s'|s,a) * V(s')]
    """
    new_value = 0

    for action in range(len(policy[state])):
        action_prob = policy[state, action]

        # Get next state and reward (deterministic env for simplicity)
        env.state = state
        next_state, reward, done = env.step(action)

        if done:
            new_value += action_prob * reward
        else:
            new_value += action_prob * (reward + gamma * V[next_state])

        env.state = state  # Reset

    return new_value


def bellman_optimality_update(Q: np.ndarray,
                              state: int,
                              action: int,
                              env,
                              gamma: float) -> float:
    """
    Compute Bellman optimality update for action value.

    Q(s,a) = R(s,a) + gamma * max_a' Q(s', a')
    """
    env.state = state
    next_state, reward, done = env.step(action)

    if done:
        return reward
    else:
        return reward + gamma * np.max(Q[next_state])
```

---

## Q-Learning Algorithm

Q-Learning is a model-free, off-policy algorithm that learns the optimal action-value function directly.

### Algorithm Overview

Q-Learning updates Q-values using the following rule:

$$Q(s, a) \leftarrow Q(s, a) + \alpha \left[ r + \gamma \max_{a'} Q(s', a') - Q(s, a) \right]$$

Where:
- $\alpha$ is the learning rate
- $r$ is the immediate reward
- $\gamma$ is the discount factor
- $\max_{a'} Q(s', a')$ is the maximum Q-value in the next state

### Key Properties

| Property | Description |
|----------|-------------|
| Model-free | Does not require knowledge of transition probabilities |
| Off-policy | Can learn from data generated by any policy |
| Value-based | Learns Q-function, derives policy from it |
| Tabular | Standard version uses Q-table (state-action matrix) |

### Exploration vs Exploitation

Q-Learning typically uses **epsilon-greedy** exploration:

$$a = \begin{cases} \text{random action} & \text{with probability } \epsilon \\ \arg\max_a Q(s, a) & \text{with probability } 1 - \epsilon \end{cases}$$

```python
import numpy as np
from collections import defaultdict
from typing import Tuple, List

class QLearning:
    """Q-Learning algorithm implementation."""

    def __init__(self,
                 num_states: int,
                 num_actions: int,
                 learning_rate: float = 0.1,
                 discount_factor: float = 0.99,
                 epsilon: float = 1.0,
                 epsilon_decay: float = 0.995,
                 epsilon_min: float = 0.01):
        """
        Initialize Q-Learning agent.

        Args:
            num_states: Number of states in the environment
            num_actions: Number of possible actions
            learning_rate: Learning rate (alpha)
            discount_factor: Discount factor (gamma)
            epsilon: Initial exploration rate
            epsilon_decay: Decay rate for epsilon
            epsilon_min: Minimum epsilon value
        """
        self.num_states = num_states
        self.num_actions = num_actions
        self.lr = learning_rate
        self.gamma = discount_factor
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min

        # Initialize Q-table with zeros
        self.Q = np.zeros((num_states, num_actions))

        # For tracking learning progress
        self.training_history = []

    def select_action(self, state: int, training: bool = True) -> int:
        """
        Select action using epsilon-greedy policy.

        Args:
            state: Current state
            training: Whether in training mode (uses exploration)

        Returns:
            Selected action
        """
        if training and np.random.random() < self.epsilon:
            # Exploration: random action
            return np.random.randint(self.num_actions)
        else:
            # Exploitation: best action based on Q-values
            return np.argmax(self.Q[state])

    def update(self, state: int, action: int, reward: float,
               next_state: int, done: bool) -> float:
        """
        Update Q-value using Q-Learning update rule.

        Q(s,a) <- Q(s,a) + alpha * [r + gamma * max_a' Q(s',a') - Q(s,a)]

        Args:
            state: Current state
            action: Action taken
            reward: Reward received
            next_state: Next state
            done: Whether episode is done

        Returns:
            TD error
        """
        # Current Q-value
        current_q = self.Q[state, action]

        # Target Q-value (Bellman optimality)
        if done:
            target_q = reward
        else:
            target_q = reward + self.gamma * np.max(self.Q[next_state])

        # TD error
        td_error = target_q - current_q

        # Update Q-value
        self.Q[state, action] = current_q + self.lr * td_error

        return td_error

    def decay_epsilon(self):
        """Decay exploration rate."""
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)

    def train(self, env, num_episodes: int = 1000,
              max_steps: int = 100, verbose: bool = True) -> List[float]:
        """
        Train the agent on the environment.

        Args:
            env: Environment with reset() and step() methods
            num_episodes: Number of training episodes
            max_steps: Maximum steps per episode
            verbose: Whether to print progress

        Returns:
            List of episode rewards
        """
        episode_rewards = []

        for episode in range(num_episodes):
            state = env.reset()
            total_reward = 0

            for step in range(max_steps):
                # Select action
                action = self.select_action(state)

                # Take action
                next_state, reward, done = env.step(action)

                # Update Q-value
                self.update(state, action, reward, next_state, done)

                total_reward += reward
                state = next_state

                if done:
                    break

            # Decay epsilon after each episode
            self.decay_epsilon()

            episode_rewards.append(total_reward)

            if verbose and (episode + 1) % 100 == 0:
                avg_reward = np.mean(episode_rewards[-100:])
                print(f"Episode {episode + 1}/{num_episodes}, "
                      f"Avg Reward: {avg_reward:.2f}, "
                      f"Epsilon: {self.epsilon:.4f}")

        self.training_history = episode_rewards
        return episode_rewards

    def get_policy(self) -> np.ndarray:
        """Get greedy policy from Q-table."""
        return np.argmax(self.Q, axis=1)

    def get_value_function(self) -> np.ndarray:
        """Get state value function from Q-table."""
        return np.max(self.Q, axis=1)


# Example usage
def train_qlearning_gridworld():
    """Train Q-Learning on GridWorld."""
    # Create environment
    env = GridWorld(size=4)

    # Create agent
    agent = QLearning(
        num_states=16,
        num_actions=4,
        learning_rate=0.1,
        discount_factor=0.99,
        epsilon=1.0,
        epsilon_decay=0.995,
        epsilon_min=0.01
    )

    # Train
    rewards = agent.train(env, num_episodes=1000, max_steps=100)

    # Print results
    print("\nLearned Q-Table:")
    print(agent.Q.round(2))

    print("\nOptimal Policy (0=up, 1=right, 2=down, 3=left):")
    policy = agent.get_policy()
    print(policy.reshape(4, 4))

    return agent, rewards


if __name__ == "__main__":
    agent, rewards = train_qlearning_gridworld()
```

### Q-Learning Convergence

Q-Learning converges to the optimal Q-function under the following conditions:

1. All state-action pairs are visited infinitely often
2. Learning rate satisfies: $\sum_t \alpha_t = \infty$ and $\sum_t \alpha_t^2 < \infty$
3. The MDP is finite

---

## SARSA Algorithm

SARSA (State-Action-Reward-State-Action) is an on-policy TD control algorithm.

### Algorithm Overview

SARSA updates Q-values using the actually taken action in the next state:

$$Q(s, a) \leftarrow Q(s, a) + \alpha \left[ r + \gamma Q(s', a') - Q(s, a) \right]$$

Where $a'$ is the action actually selected in state $s'$ (not necessarily the optimal one).

### Q-Learning vs SARSA

| Aspect | Q-Learning | SARSA |
|--------|------------|-------|
| Type | Off-policy | On-policy |
| Update target | $\max_{a'} Q(s', a')$ | $Q(s', a')$ |
| Behavior | More aggressive | More conservative |
| Best for | Finding optimal policy | Safe exploration |

### Why the Difference Matters

- **Q-Learning** learns about the optimal policy regardless of what actions are taken (off-policy)
- **SARSA** learns about the policy being followed (on-policy)
- In risky environments, SARSA tends to learn safer policies

```python
class SARSA:
    """SARSA (State-Action-Reward-State-Action) algorithm implementation."""

    def __init__(self,
                 num_states: int,
                 num_actions: int,
                 learning_rate: float = 0.1,
                 discount_factor: float = 0.99,
                 epsilon: float = 1.0,
                 epsilon_decay: float = 0.995,
                 epsilon_min: float = 0.01):
        """
        Initialize SARSA agent.
        """
        self.num_states = num_states
        self.num_actions = num_actions
        self.lr = learning_rate
        self.gamma = discount_factor
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min

        # Initialize Q-table
        self.Q = np.zeros((num_states, num_actions))
        self.training_history = []

    def select_action(self, state: int, training: bool = True) -> int:
        """Select action using epsilon-greedy policy."""
        if training and np.random.random() < self.epsilon:
            return np.random.randint(self.num_actions)
        else:
            return np.argmax(self.Q[state])

    def update(self, state: int, action: int, reward: float,
               next_state: int, next_action: int, done: bool) -> float:
        """
        Update Q-value using SARSA update rule.

        Q(s,a) <- Q(s,a) + alpha * [r + gamma * Q(s',a') - Q(s,a)]

        Note: Uses next_action (a') instead of max over actions.
        """
        current_q = self.Q[state, action]

        if done:
            target_q = reward
        else:
            # Key difference: use Q(s', a') instead of max_a' Q(s', a')
            target_q = reward + self.gamma * self.Q[next_state, next_action]

        td_error = target_q - current_q
        self.Q[state, action] = current_q + self.lr * td_error

        return td_error

    def decay_epsilon(self):
        """Decay exploration rate."""
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)

    def train(self, env, num_episodes: int = 1000,
              max_steps: int = 100, verbose: bool = True) -> List[float]:
        """
        Train the agent using SARSA.
        """
        episode_rewards = []

        for episode in range(num_episodes):
            state = env.reset()
            action = self.select_action(state)  # Select first action
            total_reward = 0

            for step in range(max_steps):
                # Take action
                next_state, reward, done = env.step(action)

                # Select next action (needed for SARSA update)
                next_action = self.select_action(next_state)

                # Update Q-value
                self.update(state, action, reward, next_state, next_action, done)

                total_reward += reward
                state = next_state
                action = next_action  # Use the selected next action

                if done:
                    break

            self.decay_epsilon()
            episode_rewards.append(total_reward)

            if verbose and (episode + 1) % 100 == 0:
                avg_reward = np.mean(episode_rewards[-100:])
                print(f"Episode {episode + 1}/{num_episodes}, "
                      f"Avg Reward: {avg_reward:.2f}, "
                      f"Epsilon: {self.epsilon:.4f}")

        self.training_history = episode_rewards
        return episode_rewards


class ExpectedSARSA:
    """Expected SARSA algorithm - uses expected value over actions."""

    def __init__(self,
                 num_states: int,
                 num_actions: int,
                 learning_rate: float = 0.1,
                 discount_factor: float = 0.99,
                 epsilon: float = 1.0,
                 epsilon_decay: float = 0.995,
                 epsilon_min: float = 0.01):
        self.num_states = num_states
        self.num_actions = num_actions
        self.lr = learning_rate
        self.gamma = discount_factor
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min
        self.Q = np.zeros((num_states, num_actions))

    def select_action(self, state: int, training: bool = True) -> int:
        if training and np.random.random() < self.epsilon:
            return np.random.randint(self.num_actions)
        return np.argmax(self.Q[state])

    def get_expected_value(self, state: int) -> float:
        """
        Calculate expected Q-value under epsilon-greedy policy.

        E[Q(s', a')] = (1-epsilon) * max_a Q(s', a) + epsilon * mean_a Q(s', a)
        """
        q_values = self.Q[state]
        best_action = np.argmax(q_values)

        # Probability of each action under epsilon-greedy
        action_probs = np.ones(self.num_actions) * self.epsilon / self.num_actions
        action_probs[best_action] += 1 - self.epsilon

        return np.sum(action_probs * q_values)

    def update(self, state: int, action: int, reward: float,
               next_state: int, done: bool) -> float:
        """
        Update using Expected SARSA rule.

        Q(s,a) <- Q(s,a) + alpha * [r + gamma * E[Q(s',a')] - Q(s,a)]
        """
        current_q = self.Q[state, action]

        if done:
            target_q = reward
        else:
            target_q = reward + self.gamma * self.get_expected_value(next_state)

        td_error = target_q - current_q
        self.Q[state, action] = current_q + self.lr * td_error

        return td_error

    def decay_epsilon(self):
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
```

### SARSA Variants Comparison

| Variant | Update Target | Variance | Use Case |
|---------|---------------|----------|----------|
| SARSA | $Q(s', a')$ | Higher | On-policy learning |
| Expected SARSA | $\mathbb{E}[Q(s', a')]$ | Lower | Reduced variance |
| Q-Learning | $\max_{a'} Q(s', a')$ | Medium | Off-policy, optimal |

---

## Deep Q-Network (DQN)

Deep Q-Network (DQN) extends Q-Learning to handle high-dimensional state spaces using neural networks.

### Why Deep Learning for RL?

Traditional Q-Learning stores Q-values in a table, which becomes infeasible when:
- State space is continuous (e.g., robot joint angles)
- State space is very large (e.g., images from Atari games)
- Generalization across similar states is needed

### DQN Architecture

DQN approximates the Q-function using a neural network:

$$Q(s, a; \theta) \approx Q^*(s, a)$$

Where $\theta$ represents the network parameters.

### Key Innovations

1. **Experience Replay**: Store and sample past experiences
2. **Target Network**: Separate network for computing targets
3. **Reward Clipping**: Normalize rewards for stability

```python
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
import numpy as np
from collections import deque, namedtuple
import random

# Experience tuple for replay buffer
Experience = namedtuple('Experience',
                        ['state', 'action', 'reward', 'next_state', 'done'])


class ReplayBuffer:
    """Experience replay buffer for DQN."""

    def __init__(self, capacity: int = 100000):
        """
        Initialize replay buffer.

        Args:
            capacity: Maximum number of experiences to store
        """
        self.buffer = deque(maxlen=capacity)

    def push(self, state, action, reward, next_state, done):
        """Add experience to buffer."""
        experience = Experience(state, action, reward, next_state, done)
        self.buffer.append(experience)

    def sample(self, batch_size: int) -> List[Experience]:
        """Sample a batch of experiences."""
        return random.sample(self.buffer, batch_size)

    def __len__(self):
        return len(self.buffer)


class DQN(nn.Module):
    """Deep Q-Network architecture."""

    def __init__(self, state_dim: int, action_dim: int, hidden_dims: List[int] = [128, 128]):
        """
        Initialize DQN.

        Args:
            state_dim: Dimension of state space
            action_dim: Number of possible actions
            hidden_dims: List of hidden layer dimensions
        """
        super(DQN, self).__init__()

        # Build network layers
        layers = []
        prev_dim = state_dim

        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(prev_dim, hidden_dim))
            layers.append(nn.ReLU())
            prev_dim = hidden_dim

        layers.append(nn.Linear(prev_dim, action_dim))

        self.network = nn.Sequential(*layers)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass returning Q-values for all actions."""
        return self.network(x)


class DQNAgent:
    """DQN Agent with experience replay and target network."""

    def __init__(self,
                 state_dim: int,
                 action_dim: int,
                 hidden_dims: List[int] = [128, 128],
                 learning_rate: float = 1e-3,
                 discount_factor: float = 0.99,
                 epsilon: float = 1.0,
                 epsilon_decay: float = 0.995,
                 epsilon_min: float = 0.01,
                 buffer_size: int = 100000,
                 batch_size: int = 64,
                 target_update_freq: int = 100,
                 device: str = 'auto'):
        """
        Initialize DQN Agent.

        Args:
            state_dim: Dimension of state space
            action_dim: Number of possible actions
            hidden_dims: Hidden layer dimensions
            learning_rate: Learning rate for optimizer
            discount_factor: Discount factor (gamma)
            epsilon: Initial exploration rate
            epsilon_decay: Epsilon decay rate
            epsilon_min: Minimum epsilon
            buffer_size: Replay buffer capacity
            batch_size: Training batch size
            target_update_freq: Steps between target network updates
            device: Device to use ('auto', 'cuda', or 'cpu')
        """
        # Set device
        if device == 'auto':
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)

        self.state_dim = state_dim
        self.action_dim = action_dim
        self.gamma = discount_factor
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min
        self.batch_size = batch_size
        self.target_update_freq = target_update_freq

        # Networks
        self.policy_net = DQN(state_dim, action_dim, hidden_dims).to(self.device)
        self.target_net = DQN(state_dim, action_dim, hidden_dims).to(self.device)
        self.target_net.load_state_dict(self.policy_net.state_dict())
        self.target_net.requires_grad_(False)  # Target network is not trained

        # Optimizer
        self.optimizer = optim.Adam(self.policy_net.parameters(), lr=learning_rate)

        # Replay buffer
        self.replay_buffer = ReplayBuffer(buffer_size)

        # Step counter for target network updates
        self.steps = 0

        # Training history
        self.losses = []

    def select_action(self, state: np.ndarray, training: bool = True) -> int:
        """Select action using epsilon-greedy policy."""
        if training and random.random() < self.epsilon:
            return random.randint(0, self.action_dim - 1)

        with torch.no_grad():
            state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
            q_values = self.policy_net(state_tensor)
            return q_values.argmax(dim=1).item()

    def store_experience(self, state, action, reward, next_state, done):
        """Store experience in replay buffer."""
        self.replay_buffer.push(state, action, reward, next_state, done)

    def train_step(self) -> float:
        """
        Perform one training step.

        Returns:
            Loss value
        """
        if len(self.replay_buffer) < self.batch_size:
            return 0.0

        # Sample batch from replay buffer
        batch = self.replay_buffer.sample(self.batch_size)

        # Convert to tensors
        states = torch.FloatTensor([e.state for e in batch]).to(self.device)
        actions = torch.LongTensor([e.action for e in batch]).to(self.device)
        rewards = torch.FloatTensor([e.reward for e in batch]).to(self.device)
        next_states = torch.FloatTensor([e.next_state for e in batch]).to(self.device)
        dones = torch.FloatTensor([e.done for e in batch]).to(self.device)

        # Compute current Q-values
        current_q = self.policy_net(states).gather(1, actions.unsqueeze(1)).squeeze(1)

        # Compute target Q-values using target network
        with torch.no_grad():
            next_q = self.target_net(next_states).max(dim=1)[0]
            target_q = rewards + self.gamma * next_q * (1 - dones)

        # Compute loss
        loss = F.mse_loss(current_q, target_q)

        # Optimize
        self.optimizer.zero_grad()
        loss.backward()
        # Gradient clipping for stability
        torch.nn.utils.clip_grad_norm_(self.policy_net.parameters(), max_norm=1.0)
        self.optimizer.step()

        self.losses.append(loss.item())

        # Update target network
        self.steps += 1
        if self.steps % self.target_update_freq == 0:
            self.update_target_network()

        return loss.item()

    def update_target_network(self):
        """Copy weights from policy network to target network."""
        self.target_net.load_state_dict(self.policy_net.state_dict())

    def decay_epsilon(self):
        """Decay exploration rate."""
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)

    def train(self, env, num_episodes: int = 1000, max_steps: int = 500,
              verbose: bool = True) -> List[float]:
        """
        Train the DQN agent.

        Args:
            env: Environment with reset() and step() methods
            num_episodes: Number of training episodes
            max_steps: Maximum steps per episode
            verbose: Whether to print progress

        Returns:
            List of episode rewards
        """
        episode_rewards = []

        for episode in range(num_episodes):
            state = env.reset()
            total_reward = 0

            for step in range(max_steps):
                # Select and take action
                action = self.select_action(state)
                next_state, reward, done = env.step(action)

                # Store experience
                self.store_experience(state, action, reward, next_state, done)

                # Train
                self.train_step()

                total_reward += reward
                state = next_state

                if done:
                    break

            self.decay_epsilon()
            episode_rewards.append(total_reward)

            if verbose and (episode + 1) % 100 == 0:
                avg_reward = np.mean(episode_rewards[-100:])
                avg_loss = np.mean(self.losses[-1000:]) if self.losses else 0
                print(f"Episode {episode + 1}/{num_episodes}, "
                      f"Avg Reward: {avg_reward:.2f}, "
                      f"Avg Loss: {avg_loss:.4f}, "
                      f"Epsilon: {self.epsilon:.4f}")

        return episode_rewards

    def save(self, path: str):
        """Save model weights."""
        torch.save({
            'policy_net': self.policy_net.state_dict(),
            'target_net': self.target_net.state_dict(),
            'optimizer': self.optimizer.state_dict(),
            'epsilon': self.epsilon,
            'steps': self.steps
        }, path)

    def load(self, path: str):
        """Load model weights."""
        checkpoint = torch.load(path, map_location=self.device)
        self.policy_net.load_state_dict(checkpoint['policy_net'])
        self.target_net.load_state_dict(checkpoint['target_net'])
        self.optimizer.load_state_dict(checkpoint['optimizer'])
        self.epsilon = checkpoint['epsilon']
        self.steps = checkpoint['steps']
```

---

## Double DQN

Double DQN addresses the overestimation bias in standard DQN.

### The Overestimation Problem

In standard DQN, the target is:

$$y = r + \gamma \max_{a'} Q(s', a'; \theta^-)$$

The $\max$ operator causes systematic overestimation because noise in Q-value estimates tends to be positive on average when taking the maximum.

### Double DQN Solution

Double DQN decouples action selection from value estimation:

$$y = r + \gamma Q(s', \arg\max_{a'} Q(s', a'; \theta); \theta^-)$$

- **Action Selection**: Use policy network $\theta$ to select the best action
- **Value Estimation**: Use target network $\theta^-$ to assess that action

```python
class DoubleDQNAgent(DQNAgent):
    """Double DQN Agent - reduces overestimation bias."""

    def train_step(self) -> float:
        """
        Perform one training step with Double DQN update.

        Key difference: Action selection uses policy network,
        value estimation uses target network.
        """
        if len(self.replay_buffer) < self.batch_size:
            return 0.0

        # Sample batch
        batch = self.replay_buffer.sample(self.batch_size)

        states = torch.FloatTensor([e.state for e in batch]).to(self.device)
        actions = torch.LongTensor([e.action for e in batch]).to(self.device)
        rewards = torch.FloatTensor([e.reward for e in batch]).to(self.device)
        next_states = torch.FloatTensor([e.next_state for e in batch]).to(self.device)
        dones = torch.FloatTensor([e.done for e in batch]).to(self.device)

        # Current Q-values
        current_q = self.policy_net(states).gather(1, actions.unsqueeze(1)).squeeze(1)

        # Double DQN target
        with torch.no_grad():
            # Action selection: use policy network
            best_actions = self.policy_net(next_states).argmax(dim=1)

            # Value estimation: use target network
            next_q = self.target_net(next_states).gather(1, best_actions.unsqueeze(1)).squeeze(1)

            target_q = rewards + self.gamma * next_q * (1 - dones)

        # Compute loss
        loss = F.mse_loss(current_q, target_q)

        # Optimize
        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.policy_net.parameters(), max_norm=1.0)
        self.optimizer.step()

        self.losses.append(loss.item())

        # Update target network
        self.steps += 1
        if self.steps % self.target_update_freq == 0:
            self.update_target_network()

        return loss.item()
```

### DQN vs Double DQN Comparison

| Aspect | DQN | Double DQN |
|--------|-----|------------|
| Target | $\max_{a'} Q_{\theta^-}(s', a')$ | $Q_{\theta^-}(s', \arg\max_{a'} Q_\theta(s', a'))$ |
| Bias | Tends to overestimate | Reduced bias |
| Performance | Good baseline | Often better, especially in complex environments |
| Complexity | Simpler | Slightly more complex |

---

## Experience Replay

Experience Replay is a crucial technique that improves sample efficiency and stability in DQN.

### Why Experience Replay?

**Problem with Online Learning:**
1. Consecutive samples are highly correlated
2. Recent experiences dominate learning
3. Rare but important experiences are forgotten

**Experience Replay Benefits:**
1. **Breaks correlation**: Random sampling provides i.i.d. data
2. **Improves efficiency**: Each experience can be reused multiple times
3. **Reduces variance**: Diverse batch of experiences stabilizes learning

### Prioritized Experience Replay

Not all experiences are equally valuable. Prioritized Experience Replay (PER) samples important experiences more frequently.

**Priority Criteria:**
- TD error magnitude: $|r + \gamma \max_{a'} Q(s', a') - Q(s, a)|$
- Higher TD error indicates more "surprising" experiences

```python
import numpy as np
from typing import Tuple

class SumTree:
    """
    Sum Tree data structure for efficient priority sampling.

    Allows O(log n) updates and sampling based on priorities.
    """

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.tree = np.zeros(2 * capacity - 1)
        self.data = np.zeros(capacity, dtype=object)
        self.data_pointer = 0
        self.n_entries = 0

    def _propagate(self, idx: int, change: float):
        """Propagate priority change up the tree."""
        parent = (idx - 1) // 2
        self.tree[parent] += change
        if parent != 0:
            self._propagate(parent, change)

    def _retrieve(self, idx: int, s: float) -> int:
        """Find the leaf node for a given value s."""
        left = 2 * idx + 1
        right = left + 1

        if left >= len(self.tree):
            return idx

        if s <= self.tree[left]:
            return self._retrieve(left, s)
        else:
            return self._retrieve(right, s - self.tree[left])

    def total(self) -> float:
        """Return total priority sum."""
        return self.tree[0]

    def add(self, priority: float, data):
        """Add new experience with given priority."""
        idx = self.data_pointer + self.capacity - 1

        self.data[self.data_pointer] = data
        self.update(idx, priority)

        self.data_pointer = (self.data_pointer + 1) % self.capacity
        self.n_entries = min(self.n_entries + 1, self.capacity)

    def update(self, idx: int, priority: float):
        """Update priority at given index."""
        change = priority - self.tree[idx]
        self.tree[idx] = priority
        self._propagate(idx, change)

    def get(self, s: float) -> Tuple[int, float, object]:
        """Get experience for value s."""
        idx = self._retrieve(0, s)
        data_idx = idx - self.capacity + 1
        return idx, self.tree[idx], self.data[data_idx]


class PrioritizedReplayBuffer:
    """Prioritized Experience Replay Buffer."""

    def __init__(self,
                 capacity: int = 100000,
                 alpha: float = 0.6,
                 beta: float = 0.4,
                 beta_increment: float = 0.001,
                 epsilon: float = 1e-6):
        """
        Initialize Prioritized Replay Buffer.

        Args:
            capacity: Maximum buffer size
            alpha: Priority exponent (0 = uniform, 1 = full prioritization)
            beta: Importance sampling exponent (annealed to 1)
            beta_increment: How much to increase beta per sample
            epsilon: Small constant to ensure non-zero priority
        """
        self.tree = SumTree(capacity)
        self.capacity = capacity
        self.alpha = alpha
        self.beta = beta
        self.beta_increment = beta_increment
        self.epsilon = epsilon
        self.max_priority = 1.0

    def push(self, state, action, reward, next_state, done):
        """Add experience with maximum priority."""
        experience = Experience(state, action, reward, next_state, done)
        priority = self.max_priority ** self.alpha
        self.tree.add(priority, experience)

    def sample(self, batch_size: int) -> Tuple[List, np.ndarray, List[int]]:
        """
        Sample a batch with prioritized sampling.

        Returns:
            experiences: List of sampled experiences
            weights: Importance sampling weights
            indices: Tree indices for priority updates
        """
        experiences = []
        indices = []
        priorities = []

        # Divide total priority into segments
        segment = self.tree.total() / batch_size

        # Anneal beta
        self.beta = min(1.0, self.beta + self.beta_increment)

        for i in range(batch_size):
            # Sample from segment
            a = segment * i
            b = segment * (i + 1)
            s = np.random.uniform(a, b)

            idx, priority, experience = self.tree.get(s)

            experiences.append(experience)
            indices.append(idx)
            priorities.append(priority)

        # Compute importance sampling weights
        priorities = np.array(priorities)
        sampling_probs = priorities / self.tree.total()

        # Importance sampling weights for bias correction
        weights = (self.tree.n_entries * sampling_probs) ** (-self.beta)
        weights = weights / weights.max()  # Normalize

        return experiences, weights, indices

    def update_priorities(self, indices: List[int], td_errors: np.ndarray):
        """Update priorities based on TD errors."""
        for idx, td_error in zip(indices, td_errors):
            priority = (abs(td_error) + self.epsilon) ** self.alpha
            self.max_priority = max(self.max_priority, priority)
            self.tree.update(idx, priority)

    def __len__(self):
        return self.tree.n_entries


class PrioritizedDQNAgent(DoubleDQNAgent):
    """DQN Agent with Prioritized Experience Replay."""

    def __init__(self, *args, **kwargs):
        # Extract PER-specific parameters
        alpha = kwargs.pop('per_alpha', 0.6)
        beta = kwargs.pop('per_beta', 0.4)
        beta_increment = kwargs.pop('per_beta_increment', 0.001)

        super().__init__(*args, **kwargs)

        # Replace replay buffer with prioritized version
        self.replay_buffer = PrioritizedReplayBuffer(
            capacity=kwargs.get('buffer_size', 100000),
            alpha=alpha,
            beta=beta,
            beta_increment=beta_increment
        )

    def train_step(self) -> float:
        """Training step with prioritized experience replay."""
        if len(self.replay_buffer) < self.batch_size:
            return 0.0

        # Sample with priorities
        batch, weights, indices = self.replay_buffer.sample(self.batch_size)

        states = torch.FloatTensor([e.state for e in batch]).to(self.device)
        actions = torch.LongTensor([e.action for e in batch]).to(self.device)
        rewards = torch.FloatTensor([e.reward for e in batch]).to(self.device)
        next_states = torch.FloatTensor([e.next_state for e in batch]).to(self.device)
        dones = torch.FloatTensor([e.done for e in batch]).to(self.device)
        weights = torch.FloatTensor(weights).to(self.device)

        # Current Q-values
        current_q = self.policy_net(states).gather(1, actions.unsqueeze(1)).squeeze(1)

        # Double DQN target
        with torch.no_grad():
            best_actions = self.policy_net(next_states).argmax(dim=1)
            next_q = self.target_net(next_states).gather(1, best_actions.unsqueeze(1)).squeeze(1)
            target_q = rewards + self.gamma * next_q * (1 - dones)

        # Compute TD errors for priority update
        td_errors = (target_q - current_q).detach().cpu().numpy()

        # Weighted loss (importance sampling correction)
        loss = (weights * F.mse_loss(current_q, target_q, reduction='none')).mean()

        # Optimize
        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.policy_net.parameters(), max_norm=1.0)
        self.optimizer.step()

        # Update priorities
        self.replay_buffer.update_priorities(indices, td_errors)

        self.losses.append(loss.item())

        # Update target network
        self.steps += 1
        if self.steps % self.target_update_freq == 0:
            self.update_target_network()

        return loss.item()
```

### Experience Replay Variants

| Variant | Key Idea | Benefit |
|---------|----------|---------|
| Uniform Replay | Random sampling | Breaks correlation |
| Prioritized Replay | TD-error based sampling | Focus on surprising experiences |
| Hindsight Replay | Relabel failed experiences | Learn from failures |
| Combined Replay | Mix of online and replay | Balance recency and diversity |

---

## Complete Implementation Examples

### Training DQN on CartPole

```python
import gymnasium as gym
import numpy as np
import matplotlib.pyplot as plt

def train_dqn_cartpole():
    """Complete training example for DQN on CartPole."""

    # Create environment
    env = gym.make('CartPole-v1')

    state_dim = env.observation_space.shape[0]
    action_dim = env.action_space.n

    # Create agent
    agent = DoubleDQNAgent(
        state_dim=state_dim,
        action_dim=action_dim,
        hidden_dims=[128, 128],
        learning_rate=1e-3,
        discount_factor=0.99,
        epsilon=1.0,
        epsilon_decay=0.995,
        epsilon_min=0.01,
        buffer_size=50000,
        batch_size=64,
        target_update_freq=100
    )

    # Training parameters
    num_episodes = 500
    max_steps = 500

    episode_rewards = []

    for episode in range(num_episodes):
        state, _ = env.reset()
        total_reward = 0

        for step in range(max_steps):
            action = agent.select_action(state)
            next_state, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated

            # Store and train
            agent.store_experience(state, action, reward, next_state, done)
            agent.train_step()

            total_reward += reward
            state = next_state

            if done:
                break

        agent.decay_epsilon()
        episode_rewards.append(total_reward)

        # Print progress
        if (episode + 1) % 50 == 0:
            avg_reward = np.mean(episode_rewards[-50:])
            print(f"Episode {episode + 1}, Avg Reward: {avg_reward:.2f}, "
                  f"Epsilon: {agent.epsilon:.4f}")

        # Solved condition
        if len(episode_rewards) >= 100 and np.mean(episode_rewards[-100:]) >= 475:
            print(f"\nEnvironment solved in {episode + 1} episodes!")
            break

    env.close()

    # Plot learning curve
    plt.figure(figsize=(10, 5))
    plt.plot(episode_rewards, alpha=0.6, label='Episode Reward')
    plt.plot(np.convolve(episode_rewards, np.ones(50)/50, mode='valid'),
             label='Moving Average (50)')
    plt.xlabel('Episode')
    plt.ylabel('Reward')
    plt.title('DQN Training on CartPole-v1')
    plt.legend()
    plt.grid(True)
    plt.savefig('dqn_cartpole_learning_curve.png')
    plt.show()

    return agent, episode_rewards


def test_trained_agent(agent, env_name: str, num_episodes: int = 10, render: bool = False):
    """Test a trained agent."""

    env = gym.make(env_name, render_mode='human' if render else None)

    rewards = []
    for episode in range(num_episodes):
        state, _ = env.reset()
        total_reward = 0
        done = False

        while not done:
            action = agent.select_action(state, training=False)
            state, reward, terminated, truncated, _ = env.step(action)
            done = terminated or truncated
            total_reward += reward

        rewards.append(total_reward)
        print(f"Episode {episode + 1}: Reward = {total_reward}")

    env.close()
    print(f"\nAverage Reward: {np.mean(rewards):.2f} +/- {np.std(rewards):.2f}")
    return rewards


if __name__ == "__main__":
    # Train
    agent, training_rewards = train_dqn_cartpole()

    # Test
    print("\nTesting trained agent:")
    test_rewards = test_trained_agent(agent, 'CartPole-v1', num_episodes=10)

    # Save model
    agent.save('dqn_cartpole.pth')
```

### DQN for Atari Games (CNN-based)

```python
import torch
import torch.nn as nn
import numpy as np

class AtariDQN(nn.Module):
    """
    CNN-based DQN for Atari games.

    Architecture from the original DQN paper (Mnih et al., 2015).
    """

    def __init__(self, num_actions: int):
        super(AtariDQN, self).__init__()

        # Convolutional layers
        self.conv = nn.Sequential(
            nn.Conv2d(4, 32, kernel_size=8, stride=4),
            nn.ReLU(),
            nn.Conv2d(32, 64, kernel_size=4, stride=2),
            nn.ReLU(),
            nn.Conv2d(64, 64, kernel_size=3, stride=1),
            nn.ReLU()
        )

        # Calculate conv output size
        conv_out_size = self._get_conv_out_size((4, 84, 84))

        # Fully connected layers
        self.fc = nn.Sequential(
            nn.Linear(conv_out_size, 512),
            nn.ReLU(),
            nn.Linear(512, num_actions)
        )

    def _get_conv_out_size(self, shape):
        """Calculate conv layer output size."""
        o = self.conv(torch.zeros(1, *shape))
        return int(np.prod(o.size()))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass.

        Args:
            x: Input tensor of shape (batch, 4, 84, 84)
               Stacked frames preprocessed to 84x84 grayscale
        """
        # Normalize pixel values to [0, 1]
        x = x.float() / 255.0

        conv_out = self.conv(x)
        conv_out = conv_out.view(conv_out.size(0), -1)
        return self.fc(conv_out)


class FrameStacker:
    """Stack consecutive frames for temporal information."""

    def __init__(self, num_frames: int = 4):
        self.num_frames = num_frames
        self.frames = []

    def reset(self, frame: np.ndarray) -> np.ndarray:
        """Reset with initial frame."""
        frame = self._preprocess(frame)
        self.frames = [frame] * self.num_frames
        return np.stack(self.frames, axis=0)

    def step(self, frame: np.ndarray) -> np.ndarray:
        """Add new frame and return stacked frames."""
        frame = self._preprocess(frame)
        self.frames.pop(0)
        self.frames.append(frame)
        return np.stack(self.frames, axis=0)

    def _preprocess(self, frame: np.ndarray) -> np.ndarray:
        """Preprocess frame: grayscale, resize to 84x84."""
        import cv2

        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)

        # Resize to 84x84
        resized = cv2.resize(gray, (84, 84), interpolation=cv2.INTER_AREA)

        return resized


class AtariDQNAgent:
    """DQN Agent for Atari games."""

    def __init__(self, num_actions: int, device: str = 'cuda'):
        self.device = torch.device(device if torch.cuda.is_available() else 'cpu')
        self.num_actions = num_actions

        self.policy_net = AtariDQN(num_actions).to(self.device)
        self.target_net = AtariDQN(num_actions).to(self.device)
        self.target_net.load_state_dict(self.policy_net.state_dict())

        self.optimizer = torch.optim.Adam(self.policy_net.parameters(), lr=1e-4)
        self.replay_buffer = ReplayBuffer(capacity=100000)

        self.gamma = 0.99
        self.epsilon = 1.0
        self.epsilon_min = 0.1
        self.epsilon_decay = 0.999995
        self.batch_size = 32
        self.target_update = 10000
        self.steps = 0

        self.frame_stacker = FrameStacker(num_frames=4)

    def select_action(self, state: np.ndarray, training: bool = True) -> int:
        if training and np.random.random() < self.epsilon:
            return np.random.randint(self.num_actions)

        with torch.no_grad():
            state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
            q_values = self.policy_net(state_tensor)
            return q_values.argmax(dim=1).item()

    def train_step(self):
        if len(self.replay_buffer) < self.batch_size:
            return

        batch = self.replay_buffer.sample(self.batch_size)

        states = torch.FloatTensor(np.array([e.state for e in batch])).to(self.device)
        actions = torch.LongTensor([e.action for e in batch]).to(self.device)
        rewards = torch.FloatTensor([e.reward for e in batch]).to(self.device)
        next_states = torch.FloatTensor(np.array([e.next_state for e in batch])).to(self.device)
        dones = torch.FloatTensor([e.done for e in batch]).to(self.device)

        # Double DQN
        current_q = self.policy_net(states).gather(1, actions.unsqueeze(1)).squeeze(1)

        with torch.no_grad():
            best_actions = self.policy_net(next_states).argmax(dim=1)
            next_q = self.target_net(next_states).gather(1, best_actions.unsqueeze(1)).squeeze(1)
            target_q = rewards + self.gamma * next_q * (1 - dones)

        loss = nn.functional.smooth_l1_loss(current_q, target_q)

        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.policy_net.parameters(), 10)
        self.optimizer.step()

        # Update epsilon and target network
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
        self.steps += 1

        if self.steps % self.target_update == 0:
            self.target_net.load_state_dict(self.policy_net.state_dict())
```

---

## Interview Key Points

### Fundamental Concepts

**Q1: What is the difference between model-based and model-free RL?**

- **Model-based**: Agent has or learns a model of environment dynamics $P(s'|s,a)$. Can plan ahead. Examples: Dyna-Q, AlphaZero.
- **Model-free**: Agent learns directly from experience without modeling dynamics. Examples: Q-Learning, Policy Gradient.

**Q2: Explain the exploration-exploitation trade-off.**

- **Exploration**: Trying new actions to discover potentially better strategies
- **Exploitation**: Using current knowledge to maximize immediate reward
- Balance is crucial: too much exploration wastes time, too much exploitation may miss optimal solutions
- Common strategies: epsilon-greedy, UCB, Thompson Sampling

**Q3: What is the Bellman equation and why is it important?**

- Expresses the recursive relationship between value of current state and successor states
- Foundation for value-based methods (DP, TD learning, Q-learning)
- Provides the mathematical basis for iterative value computation
- Optimal Bellman equation defines optimal policy

### Algorithm Comparisons

**Q4: Q-Learning vs SARSA - When to use which?**

| Aspect | Q-Learning | SARSA |
|--------|------------|-------|
| Type | Off-policy | On-policy |
| Risk | More aggressive | More conservative |
| Use case | When optimal policy is goal | When safety matters |
| Learning | From any experience | From current policy |

**Q5: Why does DQN use experience replay and target networks?**

- **Experience Replay**:
  - Breaks correlation between consecutive samples
  - Improves sample efficiency (reuse experiences)
  - Provides diverse training batches

- **Target Network**:
  - Provides stable targets during learning
  - Prevents oscillation/divergence
  - Updated periodically, not every step

**Q6: How does Double DQN improve upon DQN?**

- Standard DQN tends to overestimate Q-values due to max operator
- Double DQN decouples action selection (policy net) from assessment (target net)
- Results: more accurate value estimates, better policies, more stable training

### Practical Considerations

**Q7: How do you handle continuous action spaces?**

- Q-Learning/DQN are designed for discrete actions
- Options for continuous:
  - Discretize the action space
  - Use Policy Gradient methods (REINFORCE, PPO, SAC)
  - Use Actor-Critic methods
  - DDPG (Deep Deterministic Policy Gradient)

**Q8: What are common challenges in training RL agents?**

1. **Sample efficiency**: RL often requires millions of interactions
2. **Reward shaping**: Sparse rewards make learning difficult
3. **Stability**: Training can be unstable, especially with function approximation
4. **Hyperparameter sensitivity**: Many parameters to tune
5. **Exploration**: Getting stuck in local optima

**Q9: How do you assess RL agents?**

- Episode return (cumulative reward)
- Success rate (for goal-based tasks)
- Sample efficiency (reward vs. training steps)
- Generalization to unseen states
- Compare against baselines and random policy

### Implementation Tips

**Q10: Best practices for implementing DQN?**

1. **Preprocessing**: Normalize states, clip rewards
2. **Network architecture**: Start simple, add complexity as needed
3. **Hyperparameters**: Use proven defaults, tune learning rate first
4. **Debugging**: Monitor Q-values, gradients, epsilon
5. **Reproducibility**: Set random seeds, log everything
6. **Baseline**: Compare against random and simple policies

---

## Further Reading

### Foundational Papers

1. **Watkins & Dayan (1992)**: "Q-Learning" - Original Q-Learning paper
2. **Mnih et al. (2015)**: "Human-level control through deep reinforcement learning" - DQN paper
3. **Van Hasselt et al. (2016)**: "Deep Reinforcement Learning with Double Q-learning" - Double DQN
4. **Schaul et al. (2016)**: "Prioritized Experience Replay" - PER
5. **Wang et al. (2016)**: "Dueling Network Architectures for Deep Reinforcement Learning" - Dueling DQN
6. **Hessel et al. (2018)**: "Rainbow: Combining Improvements in Deep Reinforcement Learning" - Rainbow DQN

### Recommended Books

1. **Sutton & Barto**: "Reinforcement Learning: An Introduction" (2nd Edition)
   - The definitive textbook for RL fundamentals
   - Free online: http://incompleteideas.net/book/the-book.html

2. **Maxim Lapan**: "Deep Reinforcement Learning Hands-On"
   - Practical implementation guide with PyTorch

3. **Miguel Morales**: "Grokking Deep Reinforcement Learning"
   - Intuitive explanations with detailed illustrations

### Online Resources

1. **OpenAI Spinning Up**: Comprehensive RL tutorial
   - https://spinningup.openai.com

2. **David Silver's RL Course**: Video lectures from DeepMind
   - https://www.davidsilver.uk/teaching/

3. **Berkeley CS285**: Deep RL course materials
   - http://rail.eecs.berkeley.edu/deeprlcourse/

4. **Gymnasium Documentation**: Environment reference
   - https://gymnasium.farama.org/

### Advanced Topics

- **Policy Gradient Methods**: REINFORCE, A2C, A3C, PPO, TRPO
- **Actor-Critic Methods**: DDPG, TD3, SAC
- **Model-Based RL**: Dyna, MBPO, Dreamer
- **Multi-Agent RL**: MADDPG, QMIX
- **Offline RL**: BCQ, CQL, Decision Transformer
- **Meta-RL**: MAML, RL2

---

## Summary

This guide covered the fundamental algorithms of reinforcement learning:

1. **MDP Framework**: States, actions, rewards, transitions, and the Markov property provide the mathematical foundation for RL.

2. **Value Functions**: State-value $V(s)$ and action-value $Q(s,a)$ functions quantify expected returns, enabling policy assessment and improvement.

3. **Bellman Equation**: The recursive relationship between values that underlies all value-based methods.

4. **Q-Learning**: Model-free, off-policy algorithm that learns optimal Q-values directly through temporal difference updates.

5. **SARSA**: On-policy variant that learns about the policy being followed, leading to safer behavior in some environments.

6. **DQN**: Extends Q-Learning to high-dimensional spaces using neural networks, with experience replay and target networks for stability.

7. **Double DQN**: Addresses overestimation bias by decoupling action selection from assessment.

8. **Experience Replay**: Critical technique for sample efficiency and training stability, with prioritized variants focusing on important experiences.

These foundational concepts and algorithms form the basis for more advanced methods like Policy Gradients, Actor-Critic, and state-of-the-art algorithms like PPO and SAC. Mastering these fundamentals is essential for understanding and applying modern reinforcement learning.
