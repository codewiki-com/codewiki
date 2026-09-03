---
title: "Reinforcement Learning: Advanced Topics"
description: "Explore RL frontiers: multi-agent RL, imitation learning, and offline RL"
track: ai
section: deep-learning
difficulty: advanced
tags:
  - multi-agent
  - imitation learning
  - offline RL
  - reinforcement learning
status: imported
origin: old/src/content/docs/datascience/advanced-rl.en.md
divergence: 0.232
issues:
  - missing-subcategory-zh
  - order-mismatch
  - category-casing
legacy:
  category: DataScience
  subcategory: RL
  order: 31
  lastUpdated: 2026-01-07
---

Reinforcement learning (RL) has evolved far beyond simple single-agent scenarios with well-defined simulators. Modern RL research and applications tackle complex challenges including multi-agent coordination, learning from demonstrations, training without online interaction, and transferring policies from simulation to the real world. This comprehensive guide explores these advanced frontiers of reinforcement learning.

## Multi-Agent Reinforcement Learning (MARL)

Multi-Agent Reinforcement Learning extends the RL paradigm to environments where multiple agents interact simultaneously. This introduces unique challenges around coordination, competition, and emergent behaviors that do not exist in single-agent settings.

### MARL Fundamentals

In MARL, the environment becomes a multi-player game where each agent's optimal policy depends on the policies of other agents. This creates a moving target problem: as other agents learn and adapt, the best response for any individual agent also changes.

**Key Concepts:**

- **Non-stationarity**: The environment appears non-stationary from each agent's perspective because other agents are simultaneously learning
- **Partial observability**: Agents typically cannot observe other agents' internal states or intentions
- **Credit assignment**: Determining which agent's actions contributed to team success or failure
- **Scalability**: Computational complexity grows exponentially with the number of agents

**Formal Framework:**

MARL is typically modeled as a Markov Game (also called Stochastic Game):

```python
from dataclasses import dataclass
from typing import List, Tuple, Callable
import numpy as np

@dataclass
class MarkovGame:
    """
    Markov Game framework for multi-agent reinforcement learning.

    N agents interact in a shared environment where:
    - State transitions depend on joint actions
    - Each agent receives individual rewards
    - Each agent has partial observability
    """
    n_agents: int
    state_space: np.ndarray
    action_spaces: List[np.ndarray]  # Action space per agent
    transition_fn: Callable  # P(s' | s, a1, a2, ..., an)
    reward_fns: List[Callable]  # Reward function per agent
    observation_fns: List[Callable]  # Observation function per agent

    def step(self, state: np.ndarray, joint_action: List[int]) -> Tuple:
        """Execute joint action and return next state and rewards."""
        next_state = self.transition_fn(state, joint_action)
        rewards = [r_fn(state, joint_action, next_state)
                   for r_fn in self.reward_fns]
        observations = [o_fn(next_state) for o_fn in self.observation_fns]
        return next_state, rewards, observations
```

### Cooperation in MARL

Cooperative MARL involves agents working together toward a shared objective. The key challenge is coordinating actions without explicit communication and properly attributing credit for team outcomes.

**Independent Learners:**

The simplest approach treats each agent as an independent learner, ignoring other agents:

```python
import torch
import torch.nn as nn
import torch.optim as optim
from collections import deque
import random

class IndependentQLearner:
    """
    Independent Q-learning for multi-agent settings.
    Each agent learns independently, treating other agents as part of the environment.
    """
    def __init__(self, obs_dim: int, n_actions: int, lr: float = 1e-3):
        self.q_network = nn.Sequential(
            nn.Linear(obs_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 128),
            nn.ReLU(),
            nn.Linear(128, n_actions)
        )
        self.target_network = nn.Sequential(
            nn.Linear(obs_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 128),
            nn.ReLU(),
            nn.Linear(128, n_actions)
        )
        self.target_network.load_state_dict(self.q_network.state_dict())
        self.optimizer = optim.Adam(self.q_network.parameters(), lr=lr)
        self.replay_buffer = deque(maxlen=100000)

    def select_action(self, obs: np.ndarray, epsilon: float = 0.1) -> int:
        if random.random() < epsilon:
            return random.randint(0, self.q_network[-1].out_features - 1)
        with torch.no_grad():
            q_values = self.q_network(torch.FloatTensor(obs))
            return q_values.argmax().item()

    def update(self, batch_size: int = 64, gamma: float = 0.99):
        if len(self.replay_buffer) < batch_size:
            return

        batch = random.sample(self.replay_buffer, batch_size)
        obs, actions, rewards, next_obs, dones = zip(*batch)

        obs = torch.FloatTensor(np.array(obs))
        actions = torch.LongTensor(actions)
        rewards = torch.FloatTensor(rewards)
        next_obs = torch.FloatTensor(np.array(next_obs))
        dones = torch.FloatTensor(dones)

        # Current Q values
        current_q = self.q_network(obs).gather(1, actions.unsqueeze(1))

        # Target Q values
        with torch.no_grad():
            next_q = self.target_network(next_obs).max(1)[0]
            target_q = rewards + gamma * next_q * (1 - dones)

        loss = nn.MSELoss()(current_q.squeeze(), target_q)
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
```

**Value Decomposition Methods:**

For cooperative settings with a shared team reward, value decomposition methods learn to factorize the joint value function:

```python
class VDNMixer(nn.Module):
    """
    Value Decomposition Network (VDN).
    Assumes Q_tot = sum of individual Q values.
    Simple but effective for many cooperative tasks.
    """
    def forward(self, agent_qs: torch.Tensor) -> torch.Tensor:
        """
        Args:
            agent_qs: Individual agent Q-values [batch, n_agents]
        Returns:
            Total Q-value [batch, 1]
        """
        return agent_qs.sum(dim=-1, keepdim=True)


class QMIXMixer(nn.Module):
    """
    QMIX: Monotonic value function factorization.
    Q_tot is a monotonic function of individual Q values.
    More expressive than VDN while maintaining easy optimization.
    """
    def __init__(self, n_agents: int, state_dim: int, embed_dim: int = 32):
        super().__init__()
        self.n_agents = n_agents

        # Hypernetworks generate mixing network weights from state
        self.hyper_w1 = nn.Sequential(
            nn.Linear(state_dim, embed_dim),
            nn.ReLU(),
            nn.Linear(embed_dim, n_agents * embed_dim)
        )
        self.hyper_w2 = nn.Sequential(
            nn.Linear(state_dim, embed_dim),
            nn.ReLU(),
            nn.Linear(embed_dim, embed_dim)
        )
        self.hyper_b1 = nn.Linear(state_dim, embed_dim)
        self.hyper_b2 = nn.Sequential(
            nn.Linear(state_dim, embed_dim),
            nn.ReLU(),
            nn.Linear(embed_dim, 1)
        )
        self.embed_dim = embed_dim

    def forward(self, agent_qs: torch.Tensor, state: torch.Tensor) -> torch.Tensor:
        """
        Args:
            agent_qs: Individual Q-values [batch, n_agents]
            state: Global state [batch, state_dim]
        Returns:
            Total Q-value [batch, 1]
        """
        batch_size = agent_qs.size(0)

        # Generate weights (constrained to be non-negative for monotonicity)
        w1 = torch.abs(self.hyper_w1(state)).view(batch_size, self.n_agents, self.embed_dim)
        w2 = torch.abs(self.hyper_w2(state)).view(batch_size, self.embed_dim, 1)
        b1 = self.hyper_b1(state).view(batch_size, 1, self.embed_dim)
        b2 = self.hyper_b2(state).view(batch_size, 1, 1)

        # Forward through mixing network
        agent_qs = agent_qs.view(batch_size, 1, self.n_agents)
        hidden = torch.relu(torch.bmm(agent_qs, w1) + b1)
        q_tot = torch.bmm(hidden, w2) + b2

        return q_tot.squeeze(-1)
```

### Competition and Mixed Settings

Competitive MARL involves agents with opposing objectives, such as in zero-sum games. Mixed settings combine cooperative and competitive elements.

**Self-Play Training:**

```python
class SelfPlayTrainer:
    """
    Self-play training for competitive games.
    Agent learns by playing against copies of itself at various skill levels.
    """
    def __init__(self, agent_class, obs_dim: int, n_actions: int):
        self.current_agent = agent_class(obs_dim, n_actions)
        self.opponent_pool = []  # Historical agent snapshots
        self.pool_size = 10

    def add_to_pool(self):
        """Periodically save agent snapshots for diverse opponents."""
        if len(self.opponent_pool) >= self.pool_size:
            # Remove oldest with some probability
            if random.random() < 0.5:
                self.opponent_pool.pop(0)

        # Deep copy current agent
        import copy
        snapshot = copy.deepcopy(self.current_agent)
        self.opponent_pool.append(snapshot)

    def sample_opponent(self) -> object:
        """Sample opponent from pool or use current agent."""
        if not self.opponent_pool or random.random() < 0.2:
            return self.current_agent
        return random.choice(self.opponent_pool)

    def train_episode(self, env):
        """Train one episode with sampled opponent."""
        opponent = self.sample_opponent()
        state = env.reset()
        done = False

        while not done:
            # Current agent's turn
            obs_current = env.get_observation(player=0)
            action_current = self.current_agent.select_action(obs_current)

            # Opponent's turn
            obs_opponent = env.get_observation(player=1)
            with torch.no_grad():
                action_opponent = opponent.select_action(obs_opponent, epsilon=0.0)

            # Execute joint action
            next_state, rewards, done, info = env.step([action_current, action_opponent])

            # Store experience for current agent only
            self.current_agent.replay_buffer.append(
                (obs_current, action_current, rewards[0],
                 env.get_observation(player=0), done)
            )

            state = next_state

        # Update current agent
        self.current_agent.update()
```

**Nash Equilibrium Approximation:**

```python
def fictitious_play_update(
    agent_policies: List[np.ndarray],  # Each agent's mixed strategy
    payoff_matrices: List[np.ndarray],  # Payoff for each agent
    history_actions: List[List[int]],   # Historical action counts
    learning_rate: float = 0.1
) -> List[np.ndarray]:
    """
    Fictitious play for finding Nash equilibrium.
    Each agent best-responds to the empirical distribution of opponent actions.
    """
    n_agents = len(agent_policies)
    new_policies = []

    for i in range(n_agents):
        # Compute opponent empirical distribution
        opponent_idx = 1 - i  # For 2-player games
        opponent_dist = np.array(history_actions[opponent_idx], dtype=float)
        opponent_dist /= opponent_dist.sum() + 1e-8

        # Compute expected payoff for each action
        expected_payoffs = payoff_matrices[i] @ opponent_dist

        # Best response
        best_action = np.argmax(expected_payoffs)
        best_response = np.zeros_like(agent_policies[i])
        best_response[best_action] = 1.0

        # Smooth update toward best response
        new_policy = (1 - learning_rate) * agent_policies[i] + learning_rate * best_response
        new_policies.append(new_policy)

    return new_policies
```

### Communication in MARL

Enabling explicit communication between agents can dramatically improve coordination:

```python
class CommNet(nn.Module):
    """
    CommNet: Neural network with learned communication.
    Agents exchange continuous messages that are aggregated and processed.
    """
    def __init__(self, obs_dim: int, n_actions: int, n_agents: int,
                 hidden_dim: int = 64, n_comm_rounds: int = 2):
        super().__init__()
        self.n_agents = n_agents
        self.n_comm_rounds = n_comm_rounds

        # Encode observations
        self.encoder = nn.Linear(obs_dim, hidden_dim)

        # Communication layers
        self.comm_layers = nn.ModuleList([
            nn.Linear(hidden_dim, hidden_dim) for _ in range(n_comm_rounds)
        ])

        # Output action logits
        self.decoder = nn.Linear(hidden_dim, n_actions)

    def forward(self, observations: torch.Tensor) -> torch.Tensor:
        """
        Args:
            observations: [batch, n_agents, obs_dim]
        Returns:
            action_logits: [batch, n_agents, n_actions]
        """
        batch_size = observations.size(0)

        # Encode observations
        h = torch.relu(self.encoder(observations))  # [batch, n_agents, hidden]

        # Communication rounds
        for comm_layer in self.comm_layers:
            # Aggregate messages (mean of other agents' hidden states)
            message = h.mean(dim=1, keepdim=True).expand(-1, self.n_agents, -1)
            message = message - h / self.n_agents  # Exclude self

            # Update hidden state with message
            h = torch.relu(comm_layer(h + message))

        # Decode to actions
        action_logits = self.decoder(h)
        return action_logits
```

## Imitation Learning

Imitation learning enables agents to learn behaviors from expert demonstrations rather than from reward signals. This is particularly valuable when reward functions are hard to specify or when expert demonstrations are readily available.

### Behavioral Cloning (BC)

Behavioral Cloning treats imitation learning as supervised learning, directly mapping observations to actions:

```python
class BehavioralCloning:
    """
    Behavioral Cloning: Learn policy via supervised learning on expert data.

    Pros: Simple, stable, works with limited data
    Cons: Suffers from distribution shift (compounding errors)
    """
    def __init__(self, obs_dim: int, n_actions: int, hidden_dim: int = 256):
        self.policy = nn.Sequential(
            nn.Linear(obs_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, n_actions)
        )
        self.optimizer = optim.Adam(self.policy.parameters(), lr=3e-4)

    def train(self, expert_observations: np.ndarray, expert_actions: np.ndarray,
              n_epochs: int = 100, batch_size: int = 64):
        """Train policy to imitate expert actions."""
        dataset = torch.utils.data.TensorDataset(
            torch.FloatTensor(expert_observations),
            torch.LongTensor(expert_actions)
        )
        dataloader = torch.utils.data.DataLoader(
            dataset, batch_size=batch_size, shuffle=True
        )

        for epoch in range(n_epochs):
            total_loss = 0
            for obs_batch, action_batch in dataloader:
                logits = self.policy(obs_batch)
                loss = nn.CrossEntropyLoss()(logits, action_batch)

                self.optimizer.zero_grad()
                loss.backward()
                self.optimizer.step()
                total_loss += loss.item()

            if (epoch + 1) % 10 == 0:
                print(f"Epoch {epoch + 1}, Loss: {total_loss / len(dataloader):.4f}")

    def predict(self, observation: np.ndarray) -> int:
        with torch.no_grad():
            logits = self.policy(torch.FloatTensor(observation))
            return logits.argmax().item()
```

**Addressing Distribution Shift with DAgger:**

```python
class DAgger:
    """
    Dataset Aggregation (DAgger): Iteratively collect data to address distribution shift.

    Key insight: Query expert for labels on states visited by learned policy,
    not just states from expert demonstrations.
    """
    def __init__(self, obs_dim: int, n_actions: int):
        self.policy = BehavioralCloning(obs_dim, n_actions)
        self.dataset_obs = []
        self.dataset_actions = []

    def train(self, env, expert_policy, n_iterations: int = 10,
              n_episodes_per_iter: int = 10, beta_schedule=None):
        """
        DAgger training loop.

        Args:
            env: Environment to collect data in
            expert_policy: Expert policy for labeling
            n_iterations: Number of DAgger iterations
            n_episodes_per_iter: Episodes to collect per iteration
            beta_schedule: Probability of using expert (annealed over time)
        """
        if beta_schedule is None:
            beta_schedule = lambda i: max(0.0, 1.0 - i * 0.1)

        for iteration in range(n_iterations):
            beta = beta_schedule(iteration)
            print(f"\nIteration {iteration + 1}, beta={beta:.2f}")

            # Collect data with mixture policy
            for episode in range(n_episodes_per_iter):
                obs = env.reset()
                done = False

                while not done:
                    # Use expert with probability beta, learned policy otherwise
                    if random.random() < beta:
                        action = expert_policy(obs)
                    else:
                        action = self.policy.predict(obs)

                    # Always label with expert action
                    expert_action = expert_policy(obs)
                    self.dataset_obs.append(obs)
                    self.dataset_actions.append(expert_action)

                    obs, reward, done, info = env.step(action)

            # Retrain policy on aggregated dataset
            self.policy.train(
                np.array(self.dataset_obs),
                np.array(self.dataset_actions),
                n_epochs=50
            )

            # Evaluate
            eval_reward = self.evaluate(env, n_episodes=5)
            print(f"Evaluation reward: {eval_reward:.2f}")

    def evaluate(self, env, n_episodes: int = 10) -> float:
        total_reward = 0
        for _ in range(n_episodes):
            obs = env.reset()
            done = False
            while not done:
                action = self.policy.predict(obs)
                obs, reward, done, info = env.step(action)
                total_reward += reward
        return total_reward / n_episodes
```

### Inverse Reinforcement Learning (IRL)

IRL recovers the reward function that the expert is implicitly optimizing:

```python
class MaxEntIRL:
    """
    Maximum Entropy Inverse Reinforcement Learning.

    Finds reward function such that:
    1. Expert demonstrations have high likelihood
    2. Policy is maximum entropy (most random while matching features)
    """
    def __init__(self, state_dim: int, n_features: int):
        # Linear reward: R(s) = theta^T * phi(s)
        self.theta = np.zeros(n_features)

    def feature_expectations(self, trajectories: List, feature_fn, gamma: float = 0.99):
        """Compute empirical feature expectations from trajectories."""
        feature_sum = np.zeros_like(self.theta)

        for traj in trajectories:
            discount = 1.0
            for state in traj:
                feature_sum += discount * feature_fn(state)
                discount *= gamma

        return feature_sum / len(trajectories)

    def train(self, expert_trajectories: List, env, feature_fn,
              n_iterations: int = 100, lr: float = 0.1, gamma: float = 0.99):
        """
        Train reward function to match expert feature expectations.
        """
        # Compute expert feature expectations
        expert_features = self.feature_expectations(
            expert_trajectories, feature_fn, gamma
        )

        for iteration in range(n_iterations):
            # Solve MDP with current reward to get policy
            policy = self.solve_mdp(env, feature_fn, gamma)

            # Collect trajectories with current policy
            policy_trajectories = self.collect_trajectories(env, policy, n_episodes=50)

            # Compute policy feature expectations
            policy_features = self.feature_expectations(
                policy_trajectories, feature_fn, gamma
            )

            # Gradient step: increase reward for expert features,
            # decrease for policy features
            gradient = expert_features - policy_features
            self.theta += lr * gradient

            if (iteration + 1) % 10 == 0:
                print(f"Iteration {iteration + 1}, ||gradient||: {np.linalg.norm(gradient):.4f}")

    def get_reward(self, state, feature_fn) -> float:
        """Return learned reward for state."""
        return np.dot(self.theta, feature_fn(state))

    def solve_mdp(self, env, feature_fn, gamma):
        """Solve MDP with current reward function (placeholder)."""
        # In practice, use value iteration or policy gradient
        pass

    def collect_trajectories(self, env, policy, n_episodes):
        """Collect trajectories following policy (placeholder)."""
        pass
```

### Generative Adversarial Imitation Learning (GAIL)

GAIL combines ideas from GANs with imitation learning, avoiding explicit reward learning:

```python
class GAIL:
    """
    Generative Adversarial Imitation Learning.

    Discriminator distinguishes expert from policy state-action pairs.
    Policy is trained to fool the discriminator using RL.
    """
    def __init__(self, obs_dim: int, action_dim: int, hidden_dim: int = 256):
        # Discriminator: classifies (s, a) as expert or policy
        self.discriminator = nn.Sequential(
            nn.Linear(obs_dim + action_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, 1),
            nn.Sigmoid()
        )
        self.disc_optimizer = optim.Adam(self.discriminator.parameters(), lr=3e-4)

        # Policy network (actor)
        self.policy = nn.Sequential(
            nn.Linear(obs_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, action_dim),
            nn.Tanh()  # For continuous actions in [-1, 1]
        )

        # Value network (critic)
        self.value = nn.Sequential(
            nn.Linear(obs_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, 1)
        )

        self.policy_optimizer = optim.Adam(
            list(self.policy.parameters()) + list(self.value.parameters()),
            lr=3e-4
        )

    def update_discriminator(self, expert_data: Tuple, policy_data: Tuple,
                             batch_size: int = 64):
        """Update discriminator to distinguish expert from policy."""
        expert_obs, expert_actions = expert_data
        policy_obs, policy_actions = policy_data

        # Sample batches
        expert_idx = np.random.choice(len(expert_obs), batch_size)
        policy_idx = np.random.choice(len(policy_obs), batch_size)

        expert_batch = torch.cat([
            torch.FloatTensor(expert_obs[expert_idx]),
            torch.FloatTensor(expert_actions[expert_idx])
        ], dim=1)

        policy_batch = torch.cat([
            torch.FloatTensor(policy_obs[policy_idx]),
            torch.FloatTensor(policy_actions[policy_idx])
        ], dim=1)

        # Discriminator outputs
        expert_preds = self.discriminator(expert_batch)
        policy_preds = self.discriminator(policy_batch)

        # Binary cross-entropy loss
        expert_loss = -torch.log(expert_preds + 1e-8).mean()
        policy_loss = -torch.log(1 - policy_preds + 1e-8).mean()
        disc_loss = expert_loss + policy_loss

        self.disc_optimizer.zero_grad()
        disc_loss.backward()
        self.disc_optimizer.step()

        return disc_loss.item()

    def get_reward(self, obs: torch.Tensor, action: torch.Tensor) -> torch.Tensor:
        """Compute GAIL reward from discriminator."""
        with torch.no_grad():
            sa = torch.cat([obs, action], dim=-1)
            d = self.discriminator(sa)
            # Reward: -log(1 - D) encourages fooling discriminator
            reward = -torch.log(1 - d + 1e-8)
        return reward

    def train(self, env, expert_obs: np.ndarray, expert_actions: np.ndarray,
              n_iterations: int = 1000, n_steps_per_iter: int = 2048):
        """Main GAIL training loop."""
        for iteration in range(n_iterations):
            # Collect policy data
            policy_obs, policy_actions, policy_rewards = [], [], []
            obs = env.reset()

            for _ in range(n_steps_per_iter):
                with torch.no_grad():
                    action = self.policy(torch.FloatTensor(obs)).numpy()

                next_obs, _, done, _ = env.step(action)

                # Get GAIL reward
                reward = self.get_reward(
                    torch.FloatTensor(obs).unsqueeze(0),
                    torch.FloatTensor(action).unsqueeze(0)
                ).item()

                policy_obs.append(obs)
                policy_actions.append(action)
                policy_rewards.append(reward)

                obs = next_obs if not done else env.reset()

            # Update discriminator
            disc_loss = self.update_discriminator(
                (expert_obs, expert_actions),
                (np.array(policy_obs), np.array(policy_actions))
            )

            # Update policy with PPO using GAIL rewards
            # (PPO implementation omitted for brevity)
            self.update_policy_ppo(policy_obs, policy_actions, policy_rewards)

            if (iteration + 1) % 10 == 0:
                print(f"Iteration {iteration + 1}, Disc Loss: {disc_loss:.4f}")

    def update_policy_ppo(self, obs, actions, rewards):
        """Update policy using PPO (placeholder)."""
        pass
```

## Offline Reinforcement Learning

Offline RL (also called Batch RL) learns policies entirely from a fixed dataset without any environment interaction. This is crucial for applications where online exploration is expensive, dangerous, or impossible.

### The Offline RL Challenge

The fundamental challenge in offline RL is distribution shift: the learned policy may visit states not well-represented in the dataset, leading to incorrect value estimates and poor performance.

```python
def demonstrate_distribution_shift():
    """
    Illustrating why naive Q-learning fails in offline settings.

    The Q-function can be arbitrarily wrong for state-action pairs
    not in the dataset, leading to overestimation and poor policies.
    """
    # Dataset contains only safe actions
    dataset_actions = ["stay_in_lane", "slow_down", "maintain_speed"]

    # Q-learning might assign high values to unseen actions
    # because there's no data to correct these estimates
    q_estimates = {
        "stay_in_lane": 10.0,      # Accurate (in dataset)
        "slow_down": 8.0,          # Accurate (in dataset)
        "accelerate_wildly": 100.0  # Overestimated (NOT in dataset!)
    }

    # Policy greedily selects highest Q-value
    # This leads to dangerous out-of-distribution actions
    selected_action = max(q_estimates, key=q_estimates.get)
    print(f"Selected action: {selected_action}")  # Dangerous!
```

### Conservative Q-Learning (CQL)

CQL adds a regularization term that penalizes Q-values for out-of-distribution actions:

```python
class ConservativeQLearning:
    """
    Conservative Q-Learning (CQL) for offline RL.

    Key idea: Learn a lower bound on the true Q-function by
    penalizing Q-values for actions not seen in the dataset.
    """
    def __init__(self, obs_dim: int, action_dim: int, hidden_dim: int = 256):
        self.q_network = nn.Sequential(
            nn.Linear(obs_dim + action_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )
        self.target_network = nn.Sequential(
            nn.Linear(obs_dim + action_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )
        self.target_network.load_state_dict(self.q_network.state_dict())

        self.policy = nn.Sequential(
            nn.Linear(obs_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, action_dim),
            nn.Tanh()
        )

        self.q_optimizer = optim.Adam(self.q_network.parameters(), lr=3e-4)
        self.policy_optimizer = optim.Adam(self.policy.parameters(), lr=3e-4)

        self.alpha = 1.0  # CQL regularization weight

    def compute_cql_loss(self, obs: torch.Tensor, actions: torch.Tensor,
                         rewards: torch.Tensor, next_obs: torch.Tensor,
                         dones: torch.Tensor, n_samples: int = 10) -> torch.Tensor:
        """
        Compute CQL loss with conservative regularization.
        """
        batch_size = obs.size(0)
        action_dim = actions.size(1)

        # Standard Bellman backup
        with torch.no_grad():
            next_actions = self.policy(next_obs)
            next_q = self.target_network(
                torch.cat([next_obs, next_actions], dim=1)
            )
            target_q = rewards + 0.99 * next_q * (1 - dones)

        current_q = self.q_network(torch.cat([obs, actions], dim=1))
        bellman_loss = nn.MSELoss()(current_q, target_q)

        # CQL regularization: penalize Q-values for random actions
        # Sample random actions
        random_actions = torch.FloatTensor(batch_size * n_samples, action_dim).uniform_(-1, 1)
        obs_repeated = obs.unsqueeze(1).repeat(1, n_samples, 1).view(-1, obs.size(1))

        # Q-values for random actions (should be low)
        random_q = self.q_network(
            torch.cat([obs_repeated, random_actions], dim=1)
        ).view(batch_size, n_samples)

        # Q-values for policy actions
        policy_actions = self.policy(obs)
        policy_q = self.q_network(torch.cat([obs, policy_actions], dim=1))

        # Q-values for dataset actions (should be high)
        dataset_q = current_q

        # CQL penalty: log-sum-exp over random actions minus dataset actions
        cql_loss = (
            torch.logsumexp(random_q, dim=1).mean() -
            dataset_q.mean()
        )

        total_loss = bellman_loss + self.alpha * cql_loss
        return total_loss, bellman_loss, cql_loss

    def train_step(self, batch: Tuple) -> dict:
        obs, actions, rewards, next_obs, dones = batch

        # Update Q-network
        total_loss, bellman_loss, cql_loss = self.compute_cql_loss(
            obs, actions, rewards, next_obs, dones
        )

        self.q_optimizer.zero_grad()
        total_loss.backward()
        self.q_optimizer.step()

        # Update policy to maximize Q
        policy_actions = self.policy(obs)
        policy_q = self.q_network(torch.cat([obs, policy_actions], dim=1))
        policy_loss = -policy_q.mean()

        self.policy_optimizer.zero_grad()
        policy_loss.backward()
        self.policy_optimizer.step()

        # Soft update target network
        for param, target_param in zip(
            self.q_network.parameters(),
            self.target_network.parameters()
        ):
            target_param.data.copy_(0.995 * target_param.data + 0.005 * param.data)

        return {
            'total_loss': total_loss.item(),
            'bellman_loss': bellman_loss.item(),
            'cql_loss': cql_loss.item(),
            'policy_loss': policy_loss.item()
        }
```

### Implicit Q-Learning (IQL)

IQL avoids querying out-of-distribution actions entirely:

```python
class ImplicitQLearning:
    """
    Implicit Q-Learning (IQL) for offline RL.

    Key idea: Learn value function only for in-distribution states,
    and extract policy through advantage-weighted regression.
    """
    def __init__(self, obs_dim: int, action_dim: int, hidden_dim: int = 256):
        # Q-networks (two for double Q-learning)
        self.q1 = self._build_network(obs_dim + action_dim, hidden_dim, 1)
        self.q2 = self._build_network(obs_dim + action_dim, hidden_dim, 1)

        # Value network (state-only)
        self.value = self._build_network(obs_dim, hidden_dim, 1)

        # Policy network
        self.policy = self._build_network(obs_dim, hidden_dim, action_dim, tanh_output=True)

        self.q_optimizer = optim.Adam(
            list(self.q1.parameters()) + list(self.q2.parameters()),
            lr=3e-4
        )
        self.value_optimizer = optim.Adam(self.value.parameters(), lr=3e-4)
        self.policy_optimizer = optim.Adam(self.policy.parameters(), lr=3e-4)

        self.tau = 0.7  # Expectile for asymmetric loss
        self.beta = 3.0  # Inverse temperature for advantage weighting

    def _build_network(self, input_dim, hidden_dim, output_dim, tanh_output=False):
        layers = [
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, output_dim)
        ]
        if tanh_output:
            layers.append(nn.Tanh())
        return nn.Sequential(*layers)

    def expectile_loss(self, pred: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
        """
        Asymmetric loss that focuses on upper expectile.
        This makes V(s) approximate max_a Q(s, a) for in-distribution actions.
        """
        diff = target - pred
        weight = torch.where(diff > 0, self.tau, 1 - self.tau)
        return (weight * diff ** 2).mean()

    def train_step(self, batch: Tuple) -> dict:
        obs, actions, rewards, next_obs, dones = batch

        # Update Q-networks with standard Bellman backup
        with torch.no_grad():
            next_v = self.value(next_obs)
            target_q = rewards + 0.99 * next_v * (1 - dones)

        sa = torch.cat([obs, actions], dim=1)
        q1_pred = self.q1(sa)
        q2_pred = self.q2(sa)

        q_loss = nn.MSELoss()(q1_pred, target_q) + nn.MSELoss()(q2_pred, target_q)

        self.q_optimizer.zero_grad()
        q_loss.backward()
        self.q_optimizer.step()

        # Update value network with expectile loss
        with torch.no_grad():
            q_min = torch.min(q1_pred, q2_pred)

        v_pred = self.value(obs)
        v_loss = self.expectile_loss(v_pred, q_min)

        self.value_optimizer.zero_grad()
        v_loss.backward()
        self.value_optimizer.step()

        # Update policy with advantage-weighted regression
        with torch.no_grad():
            q_for_awr = torch.min(
                self.q1(torch.cat([obs, actions], dim=1)),
                self.q2(torch.cat([obs, actions], dim=1))
            )
            v_for_awr = self.value(obs)
            advantage = q_for_awr - v_for_awr
            weights = torch.exp(self.beta * advantage)
            weights = torch.clamp(weights, max=100.0)  # Clip for stability

        policy_actions = self.policy(obs)
        policy_loss = (weights * (policy_actions - actions) ** 2).mean()

        self.policy_optimizer.zero_grad()
        policy_loss.backward()
        self.policy_optimizer.step()

        return {
            'q_loss': q_loss.item(),
            'v_loss': v_loss.item(),
            'policy_loss': policy_loss.item()
        }
```

### Decision Transformer

Decision Transformer frames RL as sequence modeling:

```python
class DecisionTransformer(nn.Module):
    """
    Decision Transformer: RL via sequence modeling.

    Models trajectories as sequences: (R_1, s_1, a_1, R_2, s_2, a_2, ...)
    where R_t is return-to-go (sum of future rewards).

    At test time, condition on desired return to generate actions.
    """
    def __init__(self, state_dim: int, action_dim: int,
                 hidden_dim: int = 128, n_heads: int = 4,
                 n_layers: int = 3, max_length: int = 20):
        super().__init__()

        self.hidden_dim = hidden_dim
        self.max_length = max_length

        # Embeddings for each modality
        self.state_embed = nn.Linear(state_dim, hidden_dim)
        self.action_embed = nn.Linear(action_dim, hidden_dim)
        self.return_embed = nn.Linear(1, hidden_dim)

        # Positional embedding
        self.pos_embed = nn.Embedding(max_length * 3, hidden_dim)  # 3 tokens per timestep

        # Transformer
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim, nhead=n_heads,
            dim_feedforward=hidden_dim * 4, batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=n_layers)

        # Output heads
        self.action_head = nn.Linear(hidden_dim, action_dim)

    def forward(self, states: torch.Tensor, actions: torch.Tensor,
                returns_to_go: torch.Tensor, timesteps: torch.Tensor) -> torch.Tensor:
        """
        Args:
            states: [batch, seq_len, state_dim]
            actions: [batch, seq_len, action_dim]
            returns_to_go: [batch, seq_len, 1]
            timesteps: [batch, seq_len]
        Returns:
            action_preds: [batch, seq_len, action_dim]
        """
        batch_size, seq_len, _ = states.shape

        # Embed each modality
        state_embeds = self.state_embed(states)
        action_embeds = self.action_embed(actions)
        return_embeds = self.return_embed(returns_to_go)

        # Interleave: (R_1, s_1, a_1, R_2, s_2, a_2, ...)
        # Shape: [batch, seq_len * 3, hidden_dim]
        stacked = torch.stack([return_embeds, state_embeds, action_embeds], dim=2)
        stacked = stacked.view(batch_size, seq_len * 3, self.hidden_dim)

        # Add positional embeddings
        positions = torch.arange(seq_len * 3, device=states.device)
        pos_embeds = self.pos_embed(positions)
        stacked = stacked + pos_embeds

        # Create causal mask
        causal_mask = torch.triu(
            torch.ones(seq_len * 3, seq_len * 3, device=states.device),
            diagonal=1
        ).bool()

        # Transformer forward
        hidden = self.transformer(stacked, mask=causal_mask)

        # Extract state representations (positions 1, 4, 7, ...)
        state_hidden = hidden[:, 1::3, :]

        # Predict actions
        action_preds = self.action_head(state_hidden)

        return torch.tanh(action_preds)  # Assuming bounded actions

    def get_action(self, states: torch.Tensor, actions: torch.Tensor,
                   returns_to_go: torch.Tensor, timesteps: torch.Tensor) -> torch.Tensor:
        """Get action for the last timestep (inference)."""
        action_preds = self.forward(states, actions, returns_to_go, timesteps)
        return action_preds[:, -1, :]  # Return last action prediction


def train_decision_transformer(model, dataset, n_epochs: int = 100,
                               batch_size: int = 64, context_len: int = 20):
    """Training loop for Decision Transformer."""
    optimizer = optim.Adam(model.parameters(), lr=1e-4)

    for epoch in range(n_epochs):
        total_loss = 0
        n_batches = 0

        for batch in sample_trajectories(dataset, batch_size, context_len):
            states, actions, rewards, returns_to_go, timesteps = batch

            # Forward pass
            action_preds = model(
                states[:, :-1],  # Don't need last state for prediction
                actions[:, :-1],
                returns_to_go[:, :-1],
                timesteps[:, :-1]
            )

            # Loss: predict actions (except first, which has no context)
            target_actions = actions[:, 1:]
            loss = nn.MSELoss()(action_preds, target_actions)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            n_batches += 1

        print(f"Epoch {epoch + 1}, Loss: {total_loss / n_batches:.4f}")


def sample_trajectories(dataset, batch_size, context_len):
    """Sample trajectory segments for training (placeholder)."""
    pass
```

## Sim2Real Transfer

Sim2Real transfer addresses the challenge of deploying policies trained in simulation to real-world systems, where dynamics differ from the simulator.

### Domain Randomization

Domain randomization trains policies that are robust to variations in environment parameters:

```python
class DomainRandomizer:
    """
    Domain Randomization for Sim2Real transfer.

    Randomize simulator parameters during training so the policy
    learns to be robust to parameter variations, including the real world.
    """
    def __init__(self):
        # Define randomization ranges for various parameters
        self.param_ranges = {
            # Physics parameters
            'gravity': (9.0, 10.5),
            'friction': (0.5, 1.5),
            'mass_scale': (0.8, 1.2),
            'damping': (0.0, 0.1),

            # Visual parameters (for vision-based policies)
            'lighting_intensity': (0.5, 1.5),
            'camera_fov': (45, 75),
            'texture_randomization': True,

            # Noise parameters
            'observation_noise': (0.0, 0.05),
            'action_noise': (0.0, 0.02),
            'sensor_delay': (0, 3),  # frames
        }

    def sample_params(self) -> dict:
        """Sample random environment parameters."""
        params = {}
        for key, value in self.param_ranges.items():
            if isinstance(value, tuple):
                params[key] = np.random.uniform(value[0], value[1])
            elif isinstance(value, bool):
                params[key] = value
        return params

    def apply_to_env(self, env, params: dict):
        """Apply randomized parameters to environment."""
        if hasattr(env, 'set_gravity'):
            env.set_gravity(params['gravity'])
        if hasattr(env, 'set_friction'):
            env.set_friction(params['friction'])
        # ... apply other parameters
        return env


class DomainRandomizationTrainer:
    """Train policy with domain randomization."""

    def __init__(self, env_fn, policy, randomizer: DomainRandomizer):
        self.env_fn = env_fn
        self.policy = policy
        self.randomizer = randomizer

    def train_episode(self):
        """Train one episode with randomized environment."""
        # Create environment with random parameters
        params = self.randomizer.sample_params()
        env = self.env_fn()
        env = self.randomizer.apply_to_env(env, params)

        # Add observation noise
        obs_noise = params.get('observation_noise', 0.0)
        action_noise = params.get('action_noise', 0.0)

        obs = env.reset()
        done = False
        trajectory = []

        while not done:
            # Add observation noise
            noisy_obs = obs + np.random.normal(0, obs_noise, obs.shape)

            # Get action
            action = self.policy.get_action(noisy_obs)

            # Add action noise
            noisy_action = action + np.random.normal(0, action_noise, action.shape)
            noisy_action = np.clip(noisy_action, -1, 1)

            # Step environment
            next_obs, reward, done, info = env.step(noisy_action)

            trajectory.append((obs, action, reward, next_obs, done))
            obs = next_obs

        # Update policy with trajectory
        self.policy.update(trajectory)

        return sum(t[2] for t in trajectory)  # Return episode reward
```

### System Identification and Adaptation

Learn to identify and adapt to real-world dynamics:

```python
class SystemIdentificationAdapter:
    """
    Online system identification for Sim2Real adaptation.

    Learn a mapping from interaction history to environment parameters,
    then adapt policy accordingly.
    """
    def __init__(self, obs_dim: int, action_dim: int, param_dim: int,
                 hidden_dim: int = 128, context_len: int = 50):
        # Context encoder: maps interaction history to parameter embedding
        self.context_encoder = nn.LSTM(
            input_size=obs_dim + action_dim + obs_dim,  # (s, a, s')
            hidden_size=hidden_dim,
            num_layers=2,
            batch_first=True
        )

        # Parameter predictor
        self.param_predictor = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, param_dim)
        )

        # Adaptive policy: conditioned on parameter embedding
        self.policy = nn.Sequential(
            nn.Linear(obs_dim + param_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, action_dim),
            nn.Tanh()
        )

        self.context_len = context_len
        self.context_buffer = []

    def update_context(self, obs, action, next_obs):
        """Add transition to context buffer."""
        transition = np.concatenate([obs, action, next_obs])
        self.context_buffer.append(transition)
        if len(self.context_buffer) > self.context_len:
            self.context_buffer.pop(0)

    def get_param_embedding(self) -> torch.Tensor:
        """Encode context to parameter embedding."""
        if not self.context_buffer:
            return torch.zeros(1, self.param_predictor[-1].out_features)

        context = torch.FloatTensor(self.context_buffer).unsqueeze(0)
        _, (hidden, _) = self.context_encoder(context)
        param_embed = self.param_predictor(hidden[-1])
        return param_embed

    def get_action(self, obs: np.ndarray) -> np.ndarray:
        """Get action conditioned on inferred parameters."""
        param_embed = self.get_param_embedding()
        obs_tensor = torch.FloatTensor(obs).unsqueeze(0)
        policy_input = torch.cat([obs_tensor, param_embed], dim=1)

        with torch.no_grad():
            action = self.policy(policy_input)
        return action.squeeze().numpy()
```

### Sim2Real with Visual Observations

For vision-based policies, additional techniques are needed:

```python
class VisualDomainAdaptation:
    """
    Domain adaptation for visual Sim2Real transfer.
    Uses adversarial training to learn domain-invariant features.
    """
    def __init__(self, image_dim: tuple, action_dim: int, hidden_dim: int = 256):
        # Shared feature extractor
        self.encoder = nn.Sequential(
            nn.Conv2d(3, 32, 8, stride=4),
            nn.ReLU(),
            nn.Conv2d(32, 64, 4, stride=2),
            nn.ReLU(),
            nn.Conv2d(64, 64, 3, stride=1),
            nn.ReLU(),
            nn.Flatten(),
            nn.Linear(self._get_conv_output(image_dim), hidden_dim)
        )

        # Policy head
        self.policy_head = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, action_dim),
            nn.Tanh()
        )

        # Domain discriminator (for adversarial training)
        self.domain_discriminator = nn.Sequential(
            GradientReversal(),  # Reverses gradients during backprop
            nn.Linear(hidden_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

    def _get_conv_output(self, shape):
        """Calculate conv output size."""
        o = torch.zeros(1, 3, *shape)
        for layer in list(self.encoder.children())[:-2]:
            o = layer(o)
        return int(np.prod(o.size()))

    def train_step(self, sim_images, real_images, sim_actions):
        """
        Train with domain adversarial loss.

        Encoder learns features that:
        1. Are useful for policy (predict correct actions)
        2. Are domain-invariant (discriminator can't distinguish sim/real)
        """
        # Encode both domains
        sim_features = self.encoder(sim_images)
        real_features = self.encoder(real_images)

        # Policy loss (only for sim, where we have labels)
        pred_actions = self.policy_head(sim_features)
        policy_loss = nn.MSELoss()(pred_actions, sim_actions)

        # Domain discrimination loss
        sim_domain_pred = self.domain_discriminator(sim_features)
        real_domain_pred = self.domain_discriminator(real_features)

        domain_loss = (
            nn.BCELoss()(sim_domain_pred, torch.zeros_like(sim_domain_pred)) +
            nn.BCELoss()(real_domain_pred, torch.ones_like(real_domain_pred))
        )

        # Total loss (gradient reversal makes encoder minimize domain_loss)
        total_loss = policy_loss + 0.1 * domain_loss

        return total_loss


class GradientReversal(torch.autograd.Function):
    """Gradient reversal layer for domain adversarial training."""
    @staticmethod
    def forward(ctx, x):
        return x.view_as(x)

    @staticmethod
    def backward(ctx, grad_output):
        return -grad_output
```

## Hierarchical Reinforcement Learning

Hierarchical RL decomposes complex tasks into simpler subtasks, enabling temporal abstraction and transfer.

### Options Framework

The options framework provides temporal abstraction through multi-step actions:

```python
@dataclass
class Option:
    """
    An option is a temporally extended action consisting of:
    - Initiation set: states where option can start
    - Policy: how to act while option is active
    - Termination condition: when to stop the option
    """
    name: str
    initiation_fn: Callable[[np.ndarray], bool]  # Can option start?
    policy: Callable[[np.ndarray], int]  # Action given state
    termination_fn: Callable[[np.ndarray], float]  # Probability of terminating


class OptionsAgent:
    """Agent that learns to select and execute options."""

    def __init__(self, obs_dim: int, options: List[Option]):
        self.options = options
        self.n_options = len(options)

        # Meta-policy: selects options
        self.meta_policy = nn.Sequential(
            nn.Linear(obs_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 128),
            nn.ReLU(),
            nn.Linear(128, self.n_options)
        )
        self.meta_optimizer = optim.Adam(self.meta_policy.parameters(), lr=1e-3)

        self.current_option = None

    def select_option(self, obs: np.ndarray) -> int:
        """Select an option using meta-policy."""
        # Filter to available options (where initiation condition is met)
        available = [i for i, opt in enumerate(self.options)
                     if opt.initiation_fn(obs)]

        if not available:
            return None

        with torch.no_grad():
            q_values = self.meta_policy(torch.FloatTensor(obs))
            # Mask unavailable options
            mask = torch.full((self.n_options,), float('-inf'))
            mask[available] = 0
            masked_q = q_values + mask
            return masked_q.argmax().item()

    def act(self, obs: np.ndarray) -> Tuple[int, bool]:
        """
        Get primitive action to execute.
        Returns (action, option_terminated).
        """
        # Check if current option should terminate
        if self.current_option is not None:
            option = self.options[self.current_option]
            if np.random.random() < option.termination_fn(obs):
                self.current_option = None

        # Select new option if needed
        if self.current_option is None:
            self.current_option = self.select_option(obs)
            if self.current_option is None:
                # No options available, take random action
                return np.random.randint(0, 4), True

        # Execute current option's policy
        option = self.options[self.current_option]
        action = option.policy(obs)

        return action, False

    def update_meta_policy(self, option_trajectories: List):
        """Update meta-policy using option-level experiences."""
        for traj in option_trajectories:
            obs, option_idx, total_reward, final_obs, done = traj

            # Q-learning update for meta-policy
            with torch.no_grad():
                if not done:
                    next_q = self.meta_policy(torch.FloatTensor(final_obs)).max()
                    target = total_reward + 0.99 * next_q
                else:
                    target = total_reward

            q_values = self.meta_policy(torch.FloatTensor(obs))
            loss = (q_values[option_idx] - target) ** 2

            self.meta_optimizer.zero_grad()
            loss.backward()
            self.meta_optimizer.step()
```

### Goal-Conditioned Hierarchical RL

Goal-conditioned policies enable flexible hierarchical structures:

```python
class GoalConditionedHierarchy:
    """
    Two-level goal-conditioned hierarchy:
    - High-level policy: sets subgoals
    - Low-level policy: achieves subgoals
    """
    def __init__(self, obs_dim: int, goal_dim: int, action_dim: int,
                 hidden_dim: int = 256):
        # High-level policy: produces subgoals
        self.high_policy = nn.Sequential(
            nn.Linear(obs_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, goal_dim),
            nn.Tanh()  # Assuming normalized goal space
        )

        # Low-level policy: achieves subgoals
        self.low_policy = nn.Sequential(
            nn.Linear(obs_dim + goal_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, action_dim),
            nn.Tanh()
        )

        self.high_optimizer = optim.Adam(self.high_policy.parameters(), lr=3e-4)
        self.low_optimizer = optim.Adam(self.low_policy.parameters(), lr=3e-4)

        self.subgoal_horizon = 10  # Steps between subgoal updates

    def get_subgoal(self, obs: np.ndarray) -> np.ndarray:
        """High-level policy generates subgoal."""
        with torch.no_grad():
            obs_tensor = torch.FloatTensor(obs).unsqueeze(0)
            subgoal = self.high_policy(obs_tensor).squeeze().numpy()
        return subgoal

    def get_action(self, obs: np.ndarray, subgoal: np.ndarray) -> np.ndarray:
        """Low-level policy generates action to achieve subgoal."""
        with torch.no_grad():
            input_tensor = torch.FloatTensor(
                np.concatenate([obs, subgoal])
            ).unsqueeze(0)
            action = self.low_policy(input_tensor).squeeze().numpy()
        return action

    def compute_intrinsic_reward(self, obs: np.ndarray, subgoal: np.ndarray,
                                 next_obs: np.ndarray) -> float:
        """Reward for low-level policy based on progress toward subgoal."""
        # Distance-based reward
        current_dist = np.linalg.norm(obs[:len(subgoal)] - subgoal)
        next_dist = np.linalg.norm(next_obs[:len(subgoal)] - subgoal)
        return current_dist - next_dist  # Positive if moving toward goal

    def train(self, env, n_episodes: int = 1000):
        """Train hierarchical policy."""
        high_buffer = []
        low_buffer = []

        for episode in range(n_episodes):
            obs = env.reset()
            done = False
            episode_reward = 0

            while not done:
                # High-level: set subgoal
                subgoal = self.get_subgoal(obs)
                subgoal_start_obs = obs
                subgoal_reward = 0

                # Low-level: execute for subgoal_horizon steps
                for _ in range(self.subgoal_horizon):
                    action = self.get_action(obs, subgoal)
                    next_obs, reward, done, info = env.step(action)

                    # Intrinsic reward for low-level
                    intrinsic = self.compute_intrinsic_reward(obs, subgoal, next_obs)
                    low_buffer.append((obs, subgoal, action, intrinsic, next_obs, done))

                    subgoal_reward += reward
                    episode_reward += reward
                    obs = next_obs

                    if done:
                        break

                # Store high-level transition
                high_buffer.append(
                    (subgoal_start_obs, subgoal, subgoal_reward, obs, done)
                )

            # Periodic updates
            if len(high_buffer) >= 64:
                self._update_high_policy(high_buffer)
                high_buffer = []

            if len(low_buffer) >= 256:
                self._update_low_policy(low_buffer)
                low_buffer = []

            if (episode + 1) % 100 == 0:
                print(f"Episode {episode + 1}, Reward: {episode_reward:.2f}")

    def _update_high_policy(self, buffer):
        """Update high-level policy (placeholder)."""
        pass

    def _update_low_policy(self, buffer):
        """Update low-level policy (placeholder)."""
        pass
```

## Meta Reinforcement Learning

Meta-RL learns to learn: training agents that can quickly adapt to new tasks.

### MAML for RL

Model-Agnostic Meta-Learning adapts to new tasks with few gradient steps:

```python
class MAML_RL:
    """
    Model-Agnostic Meta-Learning for Reinforcement Learning.

    Learns initial policy parameters that can be quickly fine-tuned
    to new tasks with just a few gradient steps.
    """
    def __init__(self, obs_dim: int, action_dim: int, hidden_dim: int = 64):
        self.policy = nn.Sequential(
            nn.Linear(obs_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, action_dim),
            nn.Tanh()
        )

        self.meta_optimizer = optim.Adam(self.policy.parameters(), lr=1e-3)
        self.inner_lr = 0.1
        self.n_inner_steps = 1

    def adapt(self, task_data: List[Tuple], n_steps: int = None) -> nn.Module:
        """
        Adapt policy to specific task using gradient descent.
        Returns adapted policy (without modifying original).
        """
        if n_steps is None:
            n_steps = self.n_inner_steps

        # Clone policy parameters
        adapted_params = {name: param.clone()
                         for name, param in self.policy.named_parameters()}

        for _ in range(n_steps):
            # Compute policy gradient loss on task data
            loss = self._compute_policy_gradient_loss(adapted_params, task_data)

            # Manual gradient computation
            grads = torch.autograd.grad(loss, adapted_params.values(),
                                        create_graph=True)

            # Gradient descent step
            adapted_params = {name: param - self.inner_lr * grad
                             for (name, param), grad in zip(adapted_params.items(), grads)}

        return adapted_params

    def _compute_policy_gradient_loss(self, params: dict,
                                      trajectories: List[Tuple]) -> torch.Tensor:
        """Compute REINFORCE loss using given parameters."""
        total_loss = 0

        for obs, action, reward, _, _ in trajectories:
            obs_tensor = torch.FloatTensor(obs)
            action_tensor = torch.FloatTensor(action)

            # Forward pass with adapted parameters
            x = obs_tensor
            for name, param in params.items():
                if 'weight' in name:
                    x = x @ param.T
                elif 'bias' in name:
                    x = x + param
                # Apply ReLU for hidden layers
                if '0' in name or '2' in name:
                    x = torch.relu(x)

            pred_action = torch.tanh(x)

            # Log probability (Gaussian policy)
            log_prob = -0.5 * ((pred_action - action_tensor) ** 2).sum()
            total_loss -= log_prob * reward

        return total_loss / len(trajectories)

    def meta_update(self, task_batch: List[Tuple[List, List]]):
        """
        Meta-update: improve initialization for fast adaptation.

        Args:
            task_batch: List of (train_data, test_data) for each task
        """
        meta_loss = 0

        for train_data, test_data in task_batch:
            # Inner loop: adapt to task
            adapted_params = self.adapt(train_data)

            # Outer loop: evaluate adapted policy on held-out data
            task_loss = self._compute_policy_gradient_loss(adapted_params, test_data)
            meta_loss += task_loss

        meta_loss /= len(task_batch)

        # Update initial parameters
        self.meta_optimizer.zero_grad()
        meta_loss.backward()
        self.meta_optimizer.step()

        return meta_loss.item()
```

### Recurrent Meta-RL (RL^2)

RL^2 uses recurrent networks to implicitly adapt to new tasks:

```python
class RL2:
    """
    RL^2: Fast Reinforcement Learning via Slow Reinforcement Learning.

    Uses an RNN to process entire episodes. The hidden state implicitly
    encodes task-specific information, enabling rapid adaptation.
    """
    def __init__(self, obs_dim: int, action_dim: int, hidden_dim: int = 256):
        # RNN processes (obs, prev_action, prev_reward, done) at each step
        input_dim = obs_dim + action_dim + 1 + 1  # obs + action + reward + done

        self.rnn = nn.GRU(input_dim, hidden_dim, batch_first=True)

        self.policy_head = nn.Sequential(
            nn.Linear(hidden_dim, 64),
            nn.ReLU(),
            nn.Linear(64, action_dim),
            nn.Tanh()
        )

        self.value_head = nn.Sequential(
            nn.Linear(hidden_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 1)
        )

        self.optimizer = optim.Adam(
            list(self.rnn.parameters()) +
            list(self.policy_head.parameters()) +
            list(self.value_head.parameters()),
            lr=3e-4
        )

        self.hidden_dim = hidden_dim

    def get_action(self, obs: np.ndarray, prev_action: np.ndarray,
                   prev_reward: float, prev_done: bool,
                   hidden: torch.Tensor) -> Tuple[np.ndarray, torch.Tensor]:
        """
        Get action and update hidden state.
        Hidden state carries task-relevant information across steps.
        """
        # Construct input
        input_vec = np.concatenate([
            obs, prev_action, [prev_reward], [float(prev_done)]
        ])
        input_tensor = torch.FloatTensor(input_vec).unsqueeze(0).unsqueeze(0)

        # RNN step
        with torch.no_grad():
            rnn_out, new_hidden = self.rnn(input_tensor, hidden)
            action = self.policy_head(rnn_out.squeeze(0)).squeeze(0).numpy()

        return action, new_hidden

    def train_on_tasks(self, task_distribution, n_meta_iterations: int = 1000,
                       n_episodes_per_task: int = 2, n_tasks_per_batch: int = 16):
        """
        Train RL^2 on task distribution.

        Key: RNN hidden state persists across episodes within a task,
        but resets between tasks.
        """
        for meta_iter in range(n_meta_iterations):
            batch_loss = 0

            for _ in range(n_tasks_per_batch):
                # Sample a task
                task_env = task_distribution.sample()

                # Reset hidden state for new task
                hidden = torch.zeros(1, 1, self.hidden_dim)

                # Collect multiple episodes on same task
                all_transitions = []
                prev_action = np.zeros(task_env.action_dim)
                prev_reward = 0.0
                prev_done = False

                for episode in range(n_episodes_per_task):
                    obs = task_env.reset()
                    done = False

                    while not done:
                        # Get action (hidden state carries task information)
                        action, hidden = self.get_action(
                            obs, prev_action, prev_reward, prev_done, hidden
                        )

                        next_obs, reward, done, info = task_env.step(action)

                        all_transitions.append(
                            (obs, prev_action, prev_reward, prev_done,
                             action, reward, next_obs, done)
                        )

                        prev_action = action
                        prev_reward = reward
                        prev_done = done
                        obs = next_obs

                # Compute loss for this task
                task_loss = self._compute_task_loss(all_transitions)
                batch_loss += task_loss

            # Meta update
            batch_loss /= n_tasks_per_batch

            self.optimizer.zero_grad()
            batch_loss.backward()
            self.optimizer.step()

            if (meta_iter + 1) % 100 == 0:
                print(f"Meta iteration {meta_iter + 1}, Loss: {batch_loss.item():.4f}")

    def _compute_task_loss(self, transitions: List) -> torch.Tensor:
        """Compute PPO-style loss for task transitions (placeholder)."""
        # Implementation would compute policy gradient loss
        # using the sequence of transitions
        pass
```

## Application Scenarios

### Robotics

```python
class RoboticsRLPipeline:
    """
    Complete pipeline for robot learning applications.
    Combines multiple advanced techniques for real-world deployment.
    """
    def __init__(self, config: dict):
        self.config = config

        # Stage 1: Train in simulation with domain randomization
        self.sim_trainer = DomainRandomizationTrainer(
            env_fn=self._create_sim_env,
            policy=self._create_policy(),
            randomizer=DomainRandomizer()
        )

        # Stage 2: Collect real-world demonstrations
        self.bc_trainer = BehavioralCloning(
            obs_dim=config['obs_dim'],
            n_actions=config['action_dim']
        )

        # Stage 3: Offline fine-tuning with real data
        self.offline_trainer = ConservativeQLearning(
            obs_dim=config['obs_dim'],
            action_dim=config['action_dim']
        )

    def train_pipeline(self):
        """Execute full training pipeline."""
        print("Stage 1: Simulation training with domain randomization")
        for episode in range(self.config['sim_episodes']):
            reward = self.sim_trainer.train_episode()
            if (episode + 1) % 100 == 0:
                print(f"  Episode {episode + 1}, Reward: {reward:.2f}")

        print("\nStage 2: Behavioral cloning from demonstrations")
        expert_obs, expert_actions = self._load_demonstrations()
        self.bc_trainer.train(expert_obs, expert_actions)

        print("\nStage 3: Offline RL fine-tuning")
        real_world_data = self._load_real_world_data()
        for iteration in range(self.config['offline_iterations']):
            batch = self._sample_batch(real_world_data)
            metrics = self.offline_trainer.train_step(batch)
            if (iteration + 1) % 100 == 0:
                print(f"  Iteration {iteration + 1}, Loss: {metrics['total_loss']:.4f}")

        print("\nTraining complete!")

    def _create_sim_env(self):
        """Create simulation environment (placeholder)."""
        pass

    def _create_policy(self):
        """Create policy network (placeholder)."""
        pass

    def _load_demonstrations(self):
        """Load expert demonstrations (placeholder)."""
        pass

    def _load_real_world_data(self):
        """Load real-world interaction data (placeholder)."""
        pass

    def _sample_batch(self, data):
        """Sample training batch (placeholder)."""
        pass


# Example: Quadruped locomotion
quadruped_config = {
    'obs_dim': 48,  # Joint positions, velocities, IMU
    'action_dim': 12,  # Joint torques
    'sim_episodes': 10000,
    'offline_iterations': 50000
}

pipeline = RoboticsRLPipeline(quadruped_config)
```

### Autonomous Driving

```python
class AutonomousDrivingRL:
    """
    Multi-agent RL for autonomous driving scenarios.
    Handles interactions with other vehicles, pedestrians, etc.
    """
    def __init__(self, config: dict):
        self.config = config

        # Ego vehicle policy (our agent)
        self.ego_policy = self._create_hierarchical_policy()

        # Other agents (simulated traffic)
        self.traffic_model = self._create_traffic_model()

        # Safety constraints
        self.safety_layer = SafetyLayer(config)

    def _create_hierarchical_policy(self):
        """
        Hierarchical policy:
        - High-level: Route planning, lane changes
        - Low-level: Steering, acceleration
        """
        return GoalConditionedHierarchy(
            obs_dim=self.config['obs_dim'],
            goal_dim=self.config['goal_dim'],
            action_dim=self.config['action_dim']
        )

    def _create_traffic_model(self):
        """Model other road users for simulation."""
        return IndependentQLearner(
            obs_dim=self.config['traffic_obs_dim'],
            n_actions=self.config['traffic_actions']
        )

    def train(self, env):
        """Train ego policy in multi-agent traffic environment."""
        for episode in range(self.config['n_episodes']):
            obs = env.reset()
            done = False
            episode_reward = 0

            while not done:
                # Get high-level goal
                subgoal = self.ego_policy.get_subgoal(obs['ego'])

                for _ in range(10):  # Subgoal horizon
                    # Get low-level action
                    raw_action = self.ego_policy.get_action(obs['ego'], subgoal)

                    # Apply safety constraints
                    safe_action = self.safety_layer.project(obs['ego'], raw_action)

                    # Step environment (includes other agents)
                    next_obs, reward, done, info = env.step(safe_action)

                    episode_reward += reward
                    obs = next_obs

                    if done:
                        break

            if (episode + 1) % 100 == 0:
                print(f"Episode {episode + 1}, Reward: {episode_reward:.2f}")


class SafetyLayer:
    """Enforce safety constraints on RL actions."""

    def __init__(self, config: dict):
        self.config = config
        # Control barrier function parameters
        self.safety_margin = config.get('safety_margin', 2.0)

    def project(self, obs: np.ndarray, action: np.ndarray) -> np.ndarray:
        """
        Project action to satisfy safety constraints.
        Uses control barrier functions for collision avoidance.
        """
        # Extract relevant state
        ego_pos = obs[:2]
        ego_vel = obs[2:4]
        obstacles = obs[4:].reshape(-1, 4)  # [x, y, vx, vy] for each obstacle

        safe_action = action.copy()

        for obstacle in obstacles:
            obs_pos = obstacle[:2]
            obs_vel = obstacle[2:4]

            # Relative position and velocity
            rel_pos = obs_pos - ego_pos
            rel_vel = obs_vel - ego_vel

            # Distance
            dist = np.linalg.norm(rel_pos)

            # Control barrier function: h(x) = ||p||^2 - d_safe^2
            h = dist ** 2 - self.safety_margin ** 2

            # If constraint is active, modify action
            if h < 0.5:  # Getting close to constraint
                # Gradient of h with respect to ego position
                grad_h = -2 * rel_pos / (dist + 1e-6)

                # Project action to maintain safety
                action_component = np.dot(safe_action[:2], grad_h)
                if action_component < 0:  # Moving toward obstacle
                    safe_action[:2] -= action_component * grad_h

        return np.clip(safe_action, -1, 1)
```

### Game AI

```python
class GameAI:
    """
    Multi-agent game AI using self-play and population-based training.
    """
    def __init__(self, game_config: dict):
        self.config = game_config

        # Population of agents
        self.population_size = game_config.get('population_size', 10)
        self.population = [
            self._create_agent(i) for i in range(self.population_size)
        ]

        # ELO ratings for matchmaking
        self.elo_ratings = [1200.0] * self.population_size

        # League: historical agents for diverse opponents
        self.league = []

    def _create_agent(self, agent_id: int):
        """Create a new agent."""
        return {
            'id': agent_id,
            'policy': nn.Sequential(
                nn.Linear(self.config['obs_dim'], 256),
                nn.ReLU(),
                nn.Linear(256, 256),
                nn.ReLU(),
                nn.Linear(256, self.config['n_actions'])
            ),
            'optimizer': None  # Created during training
        }

    def train_population(self, env, n_generations: int = 100):
        """Train population using evolutionary self-play."""
        for generation in range(n_generations):
            # Evaluate all agents through matches
            match_results = self._run_tournament(env)

            # Update ELO ratings
            self._update_ratings(match_results)

            # Evolutionary selection and mutation
            self._evolve_population()

            # Add best agent to league
            best_idx = np.argmax(self.elo_ratings)
            if self.elo_ratings[best_idx] > 1400:  # Threshold for league
                self._add_to_league(self.population[best_idx])

            if (generation + 1) % 10 == 0:
                print(f"Generation {generation + 1}")
                print(f"  Max ELO: {max(self.elo_ratings):.0f}")
                print(f"  Mean ELO: {np.mean(self.elo_ratings):.0f}")
                print(f"  League size: {len(self.league)}")

    def _run_tournament(self, env) -> List[Tuple[int, int, float]]:
        """Run tournament and return match results."""
        results = []

        for i in range(self.population_size):
            for j in range(i + 1, self.population_size):
                # Play match
                winner = self._play_match(env, self.population[i], self.population[j])
                results.append((i, j, winner))

            # Also play against league members
            if self.league:
                league_opponent = random.choice(self.league)
                winner = self._play_match(env, self.population[i], league_opponent)
                # League results affect rating but league members don't evolve

        return results

    def _play_match(self, env, agent1, agent2) -> float:
        """Play a match between two agents. Returns winner (0, 0.5, or 1)."""
        obs = env.reset()
        done = False

        while not done:
            # Both agents select actions
            with torch.no_grad():
                logits1 = agent1['policy'](torch.FloatTensor(obs[0]))
                action1 = logits1.argmax().item()

                logits2 = agent2['policy'](torch.FloatTensor(obs[1]))
                action2 = logits2.argmax().item()

            obs, rewards, done, info = env.step([action1, action2])

        # Return result from agent1's perspective
        if rewards[0] > rewards[1]:
            return 1.0
        elif rewards[0] < rewards[1]:
            return 0.0
        else:
            return 0.5

    def _update_ratings(self, match_results: List[Tuple[int, int, float]]):
        """Update ELO ratings based on match results."""
        K = 32  # ELO K-factor

        for i, j, result in match_results:
            # Expected scores
            exp_i = 1 / (1 + 10 ** ((self.elo_ratings[j] - self.elo_ratings[i]) / 400))
            exp_j = 1 - exp_i

            # Update ratings
            self.elo_ratings[i] += K * (result - exp_i)
            self.elo_ratings[j] += K * ((1 - result) - exp_j)

    def _evolve_population(self):
        """Evolve population: select, mutate, replace."""
        # Sort by rating
        sorted_indices = np.argsort(self.elo_ratings)[::-1]

        # Keep top 50%
        survivors = sorted_indices[:self.population_size // 2]

        # Create offspring through mutation
        new_agents = []
        for idx in survivors:
            new_agents.append(self.population[idx])

            # Create mutated copy
            offspring = self._mutate(self.population[idx])
            new_agents.append(offspring)

        self.population = new_agents
        self.elo_ratings = [1200.0] * self.population_size  # Reset ratings

    def _mutate(self, agent: dict) -> dict:
        """Create mutated copy of agent."""
        import copy
        new_agent = {
            'id': agent['id'] + self.population_size,
            'policy': copy.deepcopy(agent['policy']),
            'optimizer': None
        }

        # Add Gaussian noise to weights
        with torch.no_grad():
            for param in new_agent['policy'].parameters():
                param.add_(torch.randn_like(param) * 0.02)

        return new_agent

    def _add_to_league(self, agent: dict):
        """Add agent snapshot to league."""
        import copy
        snapshot = {
            'id': f"league_{len(self.league)}",
            'policy': copy.deepcopy(agent['policy']),
            'optimizer': None
        }
        self.league.append(snapshot)
```

## Best Practices and Common Pitfalls

### Implementation Best Practices

```python
class RLBestPractices:
    """
    Collection of best practices for robust RL implementations.
    """

    @staticmethod
    def normalize_observations(obs: np.ndarray, running_mean: np.ndarray,
                               running_var: np.ndarray, clip: float = 10.0) -> np.ndarray:
        """
        Normalize observations using running statistics.
        Critical for stable training across different environments.
        """
        normalized = (obs - running_mean) / (np.sqrt(running_var) + 1e-8)
        return np.clip(normalized, -clip, clip)

    @staticmethod
    def reward_scaling(rewards: np.ndarray, running_std: float) -> np.ndarray:
        """
        Scale rewards by running standard deviation.
        Helps maintain consistent gradient magnitudes.
        """
        return rewards / (running_std + 1e-8)

    @staticmethod
    def gradient_clipping(model: nn.Module, max_norm: float = 0.5):
        """
        Clip gradients to prevent explosive updates.
        Essential for stable training.
        """
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm)

    @staticmethod
    def orthogonal_initialization(layer: nn.Linear, gain: float = 1.0):
        """
        Orthogonal weight initialization.
        Often works better than default for RL.
        """
        nn.init.orthogonal_(layer.weight, gain=gain)
        if layer.bias is not None:
            nn.init.zeros_(layer.bias)

    @staticmethod
    def entropy_bonus(action_probs: torch.Tensor, coefficient: float = 0.01) -> torch.Tensor:
        """
        Add entropy bonus to encourage exploration.
        Prevents premature convergence to deterministic policies.
        """
        entropy = -(action_probs * torch.log(action_probs + 1e-8)).sum(dim=-1)
        return coefficient * entropy.mean()


class CommonPitfalls:
    """
    Common pitfalls in RL and how to avoid them.
    """

    @staticmethod
    def check_reward_hacking(episode_rewards: List[float],
                            intended_behavior_metrics: List[float]) -> bool:
        """
        Detect if agent is exploiting reward function bugs.

        Signs of reward hacking:
        - High rewards but poor intended behavior
        - Unexpected/degenerate policies
        - Performance doesn't transfer to evaluation
        """
        correlation = np.corrcoef(episode_rewards, intended_behavior_metrics)[0, 1]

        if correlation < 0.5:
            print("WARNING: Possible reward hacking detected!")
            print("High rewards but low correlation with intended behavior.")
            return True
        return False

    @staticmethod
    def detect_catastrophic_forgetting(
        performance_history: List[List[float]],
        n_tasks: int
    ) -> bool:
        """
        Detect catastrophic forgetting in multi-task or continual learning.

        Signs: Performance on earlier tasks drops as new tasks are learned.
        """
        for task_idx in range(n_tasks - 1):
            task_perf = performance_history[task_idx]
            if len(task_perf) > 10:
                early_perf = np.mean(task_perf[:5])
                late_perf = np.mean(task_perf[-5:])

                if late_perf < 0.7 * early_perf:
                    print(f"WARNING: Catastrophic forgetting on task {task_idx}")
                    return True
        return False

    @staticmethod
    def check_distribution_shift(
        training_states: np.ndarray,
        deployment_states: np.ndarray
    ) -> dict:
        """
        Check for distribution shift between training and deployment.
        Critical for offline RL and sim2real transfer.
        """
        from scipy import stats

        results = {}
        n_features = training_states.shape[1]

        for i in range(n_features):
            stat, p_value = stats.ks_2samp(
                training_states[:, i],
                deployment_states[:, i]
            )
            results[f'feature_{i}'] = {
                'ks_statistic': stat,
                'p_value': p_value,
                'significant_shift': p_value < 0.05
            }

        n_shifted = sum(1 for r in results.values() if r['significant_shift'])
        print(f"Distribution shift detected in {n_shifted}/{n_features} features")

        return results
```

## Summary

Advanced reinforcement learning encompasses a rich set of techniques for tackling complex real-world problems:

1. **Multi-Agent RL** enables coordination and competition among multiple learning agents, with applications from game AI to traffic systems.

2. **Imitation Learning** provides powerful alternatives when reward engineering is difficult, allowing agents to learn from demonstrations through behavioral cloning, inverse RL, and adversarial methods.

3. **Offline RL** opens possibilities for learning from fixed datasets, critical for domains where online exploration is costly or dangerous.

4. **Sim2Real Transfer** bridges the gap between simulation and reality through domain randomization, system identification, and domain adaptation.

5. **Hierarchical RL** tackles long-horizon tasks through temporal abstraction and goal-conditioned policies.

6. **Meta-RL** creates agents that can rapidly adapt to new tasks, approaching human-like learning efficiency.

These techniques are not mutually exclusive. State-of-the-art systems often combine multiple approaches: using imitation learning for initialization, offline RL for fine-tuning, hierarchical structures for complex tasks, and domain randomization for robust deployment.

The field continues to evolve rapidly. Key areas of active research include:

- **Foundation models for RL**: Leveraging large pretrained models for decision-making
- **Safe RL**: Ensuring learned policies satisfy safety constraints
- **Sample efficiency**: Reducing the data requirements for learning
- **Scalability**: Training on increasingly complex and realistic environments
- **Human-AI collaboration**: Integrating human feedback and oversight into learning

Mastering these advanced topics requires both theoretical understanding and practical experience. Start with simpler problems, carefully verify your implementations, and gradually increase complexity as you build intuition for what works in different domains.
