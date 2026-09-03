---
title: "Model Interpretability: Causal Inference"
description: "Master causal inference in ML: causal graphs, do-calculus, and causal effect estimation"
track: datascience
section: evaluation
difficulty: advanced
tags:
  - causal inference
  - causal graphs
  - causal effects
  - XAI
status: imported
origin: old/src/content/docs/datascience/causal-inference.en.md
divergence: 0.208
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DataScience
  subcategory: Interpretability
  order: 36
  lastUpdated: 2026-01-07
---

Causal inference is the science of determining cause-and-effect relationships from data. While traditional machine learning excels at finding correlations and making predictions, it often fails to answer fundamental questions like "What would happen if we changed X?" or "Did intervention Y cause outcome Z?" Understanding causality is essential for making reliable decisions, designing effective interventions, and building truly interpretable AI systems.

---

## Correlation vs Causation

The distinction between correlation and causation is fundamental to causal inference. Correlation measures statistical association, while causation implies that one variable directly influences another.

### The Problem with Correlation

Consider these classic examples of spurious correlations:

- Ice cream sales and drowning deaths are correlated (both increase in summer)
- Shoe size and reading ability are correlated in children (both increase with age)
- Number of firefighters at a fire and damage caused are correlated (larger fires need more firefighters)

None of these correlations imply causation. Understanding this distinction is critical for making sound decisions.

### Why Correlation Fails for Decision Making

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import stats

# Simulate the ice cream / drowning example
np.random.seed(42)
n_days = 365

# Temperature is the common cause (confounder)
temperature = 15 + 10 * np.sin(2 * np.pi * np.arange(n_days) / 365) + np.random.normal(0, 3, n_days)

# Ice cream sales depend on temperature
ice_cream_sales = 100 + 5 * temperature + np.random.normal(0, 20, n_days)

# Swimming (and drowning risk) also depends on temperature
swimming_activity = 20 + 3 * temperature + np.random.normal(0, 10, n_days)
drowning_incidents = np.maximum(0, swimming_activity / 50 + np.random.normal(0, 0.5, n_days))

# Calculate correlations
corr_ice_drowning, p_value = stats.pearsonr(ice_cream_sales, drowning_incidents)
print(f"Correlation between ice cream sales and drowning: {corr_ice_drowning:.3f}")
print(f"P-value: {p_value:.6f}")

# Visualize
fig, axes = plt.subplots(1, 3, figsize=(15, 4))

axes[0].scatter(temperature, ice_cream_sales, alpha=0.5)
axes[0].set_xlabel('Temperature')
axes[0].set_ylabel('Ice Cream Sales')
axes[0].set_title('Temperature -> Ice Cream Sales')

axes[1].scatter(temperature, drowning_incidents, alpha=0.5)
axes[1].set_xlabel('Temperature')
axes[1].set_ylabel('Drowning Incidents')
axes[1].set_title('Temperature -> Drowning Incidents')

axes[2].scatter(ice_cream_sales, drowning_incidents, alpha=0.5)
axes[2].set_xlabel('Ice Cream Sales')
axes[2].set_ylabel('Drowning Incidents')
axes[2].set_title(f'Spurious Correlation (r={corr_ice_drowning:.2f})')

plt.tight_layout()
plt.show()
```

### The Ladder of Causation

Judea Pearl introduced the "Ladder of Causation" to describe three levels of causal reasoning:

**Level 1: Association (Seeing)**
- Questions: "What is the probability of Y given that I observe X?"
- Example: "What is the probability a customer will buy if they visited our website?"
- Operations: Observational data, conditional probabilities P(Y|X)

**Level 2: Intervention (Doing)**
- Questions: "What would happen to Y if I do X?"
- Example: "What would happen to sales if we reduce prices by 10%?"
- Operations: Interventions, do-calculus, P(Y|do(X))

**Level 3: Counterfactual (Imagining)**
- Questions: "What would Y have been if X had been different?"
- Example: "Would this customer have churned if we had offered a discount?"
- Operations: Counterfactual reasoning, structural equations

```python
# Demonstrating different levels of the causal ladder
class CausalLadderDemo:
    """Demonstrate the three levels of causal reasoning"""

    def __init__(self, seed=42):
        np.random.seed(seed)

    def generate_data(self, n=1000):
        """
        Generate data where:
        - U is an unobserved confounder
        - X is treatment (influenced by U)
        - Y is outcome (influenced by X and U)
        """
        # Unobserved confounder (e.g., customer's inherent interest)
        U = np.random.normal(0, 1, n)

        # Treatment decision (influenced by confounder)
        # People with higher U are more likely to receive treatment
        prob_treatment = 1 / (1 + np.exp(-(0.5 + 0.8 * U)))
        X = np.random.binomial(1, prob_treatment)

        # Outcome depends on both treatment and confounder
        # True causal effect of X on Y is 2.0
        Y = 1 + 2.0 * X + 1.5 * U + np.random.normal(0, 0.5, n)

        return pd.DataFrame({'X': X, 'Y': Y, 'U': U})

    def level1_association(self, data):
        """Level 1: What is P(Y|X)?"""
        treated = data[data['X'] == 1]['Y'].mean()
        untreated = data[data['X'] == 0]['Y'].mean()

        # This is the observed association, NOT the causal effect
        naive_effect = treated - untreated

        return {
            'E[Y|X=1]': treated,
            'E[Y|X=0]': untreated,
            'Naive Effect (biased)': naive_effect,
            'Note': 'This is confounded by U!'
        }

    def level2_intervention(self, data):
        """
        Level 2: What is P(Y|do(X))?
        Since we know U, we can adjust for it
        """
        from sklearn.linear_model import LinearRegression

        # Correct approach: adjust for confounder
        model = LinearRegression()
        model.fit(data[['X', 'U']], data['Y'])

        causal_effect = model.coef_[0]  # Coefficient of X

        return {
            'E[Y|do(X=1)] - E[Y|do(X=0)]': causal_effect,
            'True causal effect': 2.0,
            'Method': 'Adjustment for confounder U'
        }

    def level3_counterfactual(self, data, individual_idx=0):
        """
        Level 3: For individual i who received treatment,
        what would Y have been without treatment?
        """
        individual = data.iloc[individual_idx]

        # Factual: what actually happened
        Y_factual = individual['Y']
        X_factual = individual['X']
        U_i = individual['U']

        # Counterfactual: what would have happened
        # Using structural equation: Y = 1 + 2*X + 1.5*U + noise
        # We need to estimate the noise for this individual
        noise_i = Y_factual - (1 + 2 * X_factual + 1.5 * U_i)

        # Counterfactual outcome under opposite treatment
        X_counterfactual = 1 - X_factual
        Y_counterfactual = 1 + 2 * X_counterfactual + 1.5 * U_i + noise_i

        return {
            'Individual': individual_idx,
            'Factual (X, Y)': (X_factual, Y_factual),
            'Counterfactual Y': Y_counterfactual,
            'Individual Treatment Effect': Y_counterfactual - Y_factual if X_factual == 0 else Y_factual - Y_counterfactual
        }

# Demonstrate
demo = CausalLadderDemo()
data = demo.generate_data()

print("=== Level 1: Association (Seeing) ===")
level1 = demo.level1_association(data)
for k, v in level1.items():
    print(f"  {k}: {v}")

print("\n=== Level 2: Intervention (Doing) ===")
level2 = demo.level2_intervention(data)
for k, v in level2.items():
    print(f"  {k}: {v}")

print("\n=== Level 3: Counterfactual (Imagining) ===")
level3 = demo.level3_counterfactual(data, individual_idx=0)
for k, v in level3.items():
    print(f"  {k}: {v}")
```

---

## Causal Graphs and DAGs

Causal graphs, specifically Directed Acyclic Graphs (DAGs), provide a visual and mathematical framework for representing causal relationships between variables.

### Components of a Causal Graph

- **Nodes**: Represent variables
- **Directed Edges**: Represent direct causal relationships (A -> B means A directly causes B)
- **Acyclic**: No cycles (you cannot follow arrows and return to the starting node)

### Key Structures in DAGs

```python
import networkx as nx
import matplotlib.pyplot as plt

def draw_dag(edges, title, pos=None):
    """Draw a DAG with given edges"""
    G = nx.DiGraph()
    G.add_edges_from(edges)

    if pos is None:
        pos = nx.spring_layout(G, seed=42)

    plt.figure(figsize=(8, 5))
    nx.draw(G, pos, with_labels=True, node_color='lightblue',
            node_size=2000, font_size=12, font_weight='bold',
            arrows=True, arrowsize=20, edge_color='gray')
    plt.title(title)
    plt.tight_layout()
    return G

# Chain (Mediation): X -> M -> Y
chain_edges = [('X', 'M'), ('M', 'Y')]
draw_dag(chain_edges, 'Chain (Mediation): X -> M -> Y',
         pos={'X': (0, 0), 'M': (1, 0), 'Y': (2, 0)})
plt.show()

# Fork (Common Cause): X <- Z -> Y
fork_edges = [('Z', 'X'), ('Z', 'Y')]
draw_dag(fork_edges, 'Fork (Common Cause): X <- Z -> Y',
         pos={'Z': (1, 1), 'X': (0, 0), 'Y': (2, 0)})
plt.show()

# Collider: X -> Z <- Y
collider_edges = [('X', 'Z'), ('Y', 'Z')]
draw_dag(collider_edges, 'Collider: X -> Z <- Y',
         pos={'X': (0, 1), 'Y': (2, 1), 'Z': (1, 0)})
plt.show()
```

### Understanding d-Separation

D-separation is a criterion for determining conditional independence in DAGs:

```python
class DAGAnalyzer:
    """Analyze causal relationships in a DAG"""

    def __init__(self, edges):
        self.G = nx.DiGraph()
        self.G.add_edges_from(edges)

    def get_parents(self, node):
        """Get parent nodes"""
        return list(self.G.predecessors(node))

    def get_children(self, node):
        """Get child nodes"""
        return list(self.G.successors(node))

    def get_ancestors(self, node):
        """Get all ancestor nodes"""
        return list(nx.ancestors(self.G, node))

    def get_descendants(self, node):
        """Get all descendant nodes"""
        return list(nx.descendants(self.G, node))

    def find_paths(self, source, target):
        """Find all paths between source and target (ignoring direction)"""
        undirected = self.G.to_undirected()
        return list(nx.all_simple_paths(undirected, source, target))

    def is_collider(self, node, path):
        """Check if a node is a collider on a path"""
        if node not in path:
            return False
        idx = path.index(node)
        if idx == 0 or idx == len(path) - 1:
            return False

        prev_node = path[idx - 1]
        next_node = path[idx + 1]

        # Collider: both adjacent nodes point to this node
        return (self.G.has_edge(prev_node, node) and
                self.G.has_edge(next_node, node))

    def is_path_blocked(self, path, conditioning_set):
        """
        Check if a path is blocked by the conditioning set.

        A path is blocked if:
        1. There's a chain or fork where the middle node is in the conditioning set
        2. There's a collider where neither the collider nor its descendants
           are in the conditioning set
        """
        for i, node in enumerate(path[1:-1], 1):
            prev_node = path[i - 1]
            next_node = path[i + 1]

            # Check if this is a collider
            is_collider = (self.G.has_edge(prev_node, node) and
                          self.G.has_edge(next_node, node))

            if is_collider:
                # Collider: path is blocked unless collider or descendant is conditioned on
                descendants = self.get_descendants(node)
                if node not in conditioning_set and not any(d in conditioning_set for d in descendants):
                    return True
            else:
                # Chain or fork: path is blocked if middle node is conditioned on
                if node in conditioning_set:
                    return True

        return False

    def d_separated(self, X, Y, Z):
        """
        Check if X and Y are d-separated given Z.

        X and Y are d-separated given Z if all paths between X and Y are blocked by Z.
        """
        if isinstance(Z, str):
            Z = {Z}
        else:
            Z = set(Z)

        paths = self.find_paths(X, Y)

        for path in paths:
            if not self.is_path_blocked(path, Z):
                return False

        return True

# Example: Analyzing a medical treatment DAG
# Z = socioeconomic status, X = treatment, M = lifestyle, Y = health outcome
edges = [
    ('Z', 'X'),      # SES affects treatment access
    ('Z', 'M'),      # SES affects lifestyle
    ('X', 'M'),      # Treatment affects lifestyle
    ('M', 'Y'),      # Lifestyle affects health
    ('X', 'Y'),      # Treatment directly affects health
]

analyzer = DAGAnalyzer(edges)

print("DAG Analysis for Medical Treatment Example")
print("=" * 50)
print("\nStructure:")
print("  Z (SES) -> X (Treatment)")
print("  Z (SES) -> M (Lifestyle)")
print("  X (Treatment) -> M (Lifestyle)")
print("  M (Lifestyle) -> Y (Health)")
print("  X (Treatment) -> Y (Health)")

print("\n\nD-separation tests:")
print(f"  X _||_ Y | {{}} : {analyzer.d_separated('X', 'Y', set())}")
print(f"  X _||_ Y | {{Z}} : {analyzer.d_separated('X', 'Y', {'Z'})}")
print(f"  X _||_ Y | {{M}} : {analyzer.d_separated('X', 'Y', {'M'})}")
print(f"  X _||_ Y | {{Z, M}} : {analyzer.d_separated('X', 'Y', {'Z', 'M'})}")

print("\n\nPaths from X to Y:")
for path in analyzer.find_paths('X', 'Y'):
    print(f"  {' -> '.join(path)}")
```

### Building Causal Graphs from Domain Knowledge

```python
def create_causal_model_from_description():
    """
    Example: Building a causal graph for customer churn analysis

    Based on domain knowledge:
    - Customer satisfaction affects churn
    - Product usage affects satisfaction
    - Customer support interactions affect satisfaction
    - Price sensitivity (unobserved) affects both usage and churn
    - Contract type affects churn directly
    """

    edges = [
        ('usage', 'satisfaction'),
        ('support_calls', 'satisfaction'),
        ('satisfaction', 'churn'),
        ('price_sensitivity', 'usage'),
        ('price_sensitivity', 'churn'),
        ('contract_type', 'churn'),
        ('tenure', 'usage'),
        ('tenure', 'satisfaction'),
    ]

    # Create visualization
    G = nx.DiGraph()
    G.add_edges_from(edges)

    pos = {
        'usage': (0, 1),
        'support_calls': (2, 1),
        'satisfaction': (1, 0.5),
        'churn': (1, 0),
        'price_sensitivity': (0, 0),
        'contract_type': (2, 0),
        'tenure': (1, 1.5)
    }

    plt.figure(figsize=(10, 8))

    # Color observed vs unobserved variables
    node_colors = ['lightblue' if node != 'price_sensitivity' else 'lightcoral'
                   for node in G.nodes()]

    nx.draw(G, pos, with_labels=True, node_color=node_colors,
            node_size=3000, font_size=10, font_weight='bold',
            arrows=True, arrowsize=20, edge_color='gray')

    plt.title('Causal Graph for Customer Churn Analysis\n(Red = Unobserved Confounder)')
    plt.tight_layout()
    plt.show()

    return G

churn_dag = create_causal_model_from_description()
```

---

## Do-Calculus and Interventions

Do-calculus, developed by Judea Pearl, provides a formal framework for reasoning about interventions using observational data.

### The Do-Operator

The do-operator distinguishes between:
- **P(Y | X = x)**: Probability of Y given that we *observe* X = x
- **P(Y | do(X = x))**: Probability of Y given that we *set* X = x

```python
import numpy as np
import pandas as pd
from scipy import stats

class DoCalculusDemo:
    """Demonstrate the difference between observing and intervening"""

    def __init__(self, seed=42):
        np.random.seed(seed)

    def generate_confounded_data(self, n=5000):
        """
        Generate data with confounding:
        Z -> X, Z -> Y, X -> Y

        Where:
        - Z is a confounder (e.g., age)
        - X is treatment (e.g., exercise)
        - Y is outcome (e.g., health score)
        """
        # Confounder
        Z = np.random.normal(50, 10, n)  # Age

        # Treatment depends on confounder
        # Younger people exercise more
        prob_exercise = 1 / (1 + np.exp((Z - 50) / 10))
        X = np.random.binomial(1, prob_exercise)

        # Outcome depends on both treatment and confounder
        # True causal effect of exercise: +10 health points
        # Age negatively affects health
        Y = 80 + 10 * X - 0.5 * Z + np.random.normal(0, 5, n)

        return pd.DataFrame({'Z': Z, 'X': X, 'Y': Y})

    def observe(self, data):
        """P(Y | X) - Observational conditioning"""
        treated = data[data['X'] == 1]['Y'].mean()
        untreated = data[data['X'] == 0]['Y'].mean()
        return treated - untreated

    def do_by_adjustment(self, data):
        """
        P(Y | do(X)) using backdoor adjustment:
        P(Y | do(X)) = sum_z P(Y | X, Z) * P(Z)
        """
        # Stratify by Z (discretize for simplicity)
        data['Z_bin'] = pd.qcut(data['Z'], q=10, labels=False)

        effect = 0
        total_weight = 0

        for z_bin in data['Z_bin'].unique():
            stratum = data[data['Z_bin'] == z_bin]

            treated = stratum[stratum['X'] == 1]['Y']
            untreated = stratum[stratum['X'] == 0]['Y']

            if len(treated) > 0 and len(untreated) > 0:
                stratum_effect = treated.mean() - untreated.mean()
                weight = len(stratum) / len(data)
                effect += stratum_effect * weight
                total_weight += weight

        return effect / total_weight if total_weight > 0 else 0

    def do_by_regression(self, data):
        """
        P(Y | do(X)) using regression adjustment
        """
        from sklearn.linear_model import LinearRegression

        model = LinearRegression()
        model.fit(data[['X', 'Z']], data['Y'])

        return model.coef_[0]  # Coefficient of X

    def simulate_intervention(self, n=5000):
        """
        Simulate a randomized experiment (actual intervention)
        This gives us the true P(Y | do(X))
        """
        np.random.seed(42)

        # Confounder
        Z = np.random.normal(50, 10, n)

        # Random assignment (intervention!)
        X = np.random.binomial(1, 0.5, n)  # 50/50 random

        # Same outcome model
        Y = 80 + 10 * X - 0.5 * Z + np.random.normal(0, 5, n)

        data = pd.DataFrame({'Z': Z, 'X': X, 'Y': Y})

        # With random assignment, simple difference works
        treated = data[data['X'] == 1]['Y'].mean()
        untreated = data[data['X'] == 0]['Y'].mean()

        return treated - untreated

# Demonstrate
demo = DoCalculusDemo()
obs_data = demo.generate_confounded_data()

print("=== Do-Calculus Demonstration ===\n")
print(f"True causal effect: 10.0\n")

print("Observational data (confounded):")
print(f"  P(Y|X=1) - P(Y|X=0) = {demo.observe(obs_data):.2f}")
print("  (Biased because of confounding!)\n")

print("Estimating P(Y|do(X)) from observational data:")
print(f"  Backdoor adjustment: {demo.do_by_adjustment(obs_data):.2f}")
print(f"  Regression adjustment: {demo.do_by_regression(obs_data):.2f}\n")

print("Randomized experiment (gold standard):")
print(f"  RCT estimate: {demo.simulate_intervention():.2f}")
```

### The Three Rules of Do-Calculus

Pearl's do-calculus consists of three rules that allow transformation of interventional distributions:

```python
def explain_do_calculus_rules():
    """
    Explain the three rules of do-calculus
    """

    rules = """
    === The Three Rules of Do-Calculus ===

    Given a causal DAG G, let X, Y, Z, W be disjoint sets of variables.

    Rule 1 (Insertion/Deletion of Observations):
    -------------------------------------------------
    P(Y | do(X), Z, W) = P(Y | do(X), W)

    IF: Y is d-separated from Z given X and W in the graph G_X-bar
        (where G_X-bar is G with incoming edges to X removed)

    Intuition: We can ignore Z when computing Y if Z provides no
    additional information about Y once we intervene on X.


    Rule 2 (Action/Observation Exchange):
    -------------------------------------------------
    P(Y | do(X), do(Z), W) = P(Y | do(X), Z, W)

    IF: Y is d-separated from Z given X and W in the graph G_X-bar,Z-bar
        (where we also remove incoming edges to Z)

    Intuition: Intervening on Z is the same as observing Z when
    Z has no confounding effect on Y.


    Rule 3 (Insertion/Deletion of Actions):
    -------------------------------------------------
    P(Y | do(X), do(Z), W) = P(Y | do(X), W)

    IF: Y is d-separated from Z given X and W in the graph G_X-bar,Z(W)-bar
        (where Z(W) are Z-nodes that are not ancestors of any W-node)

    Intuition: We can remove do(Z) if Z has no causal effect on Y.


    These rules, along with standard probability rules, are COMPLETE
    for deriving all identifiable causal effects from observational data.
    """

    print(rules)

explain_do_calculus_rules()
```

### The Backdoor Criterion

The backdoor criterion provides a practical test for identifying sufficient adjustment sets:

```python
def backdoor_criterion_example():
    """
    Demonstrate the backdoor criterion for identifying causal effects
    """

    print("=== The Backdoor Criterion ===\n")

    print("Given treatment X and outcome Y, a set Z satisfies the backdoor")
    print("criterion if:")
    print("  1. No node in Z is a descendant of X")
    print("  2. Z blocks all backdoor paths from X to Y")
    print("     (paths with an arrow INTO X)\n")

    # Example DAG
    edges = [
        ('Z1', 'X'),
        ('Z1', 'Z2'),
        ('Z2', 'Y'),
        ('X', 'M'),
        ('M', 'Y'),
        ('Z1', 'Y')
    ]

    print("Example DAG:")
    print("  Z1 -> X")
    print("  Z1 -> Z2 -> Y")
    print("  Z1 -> Y")
    print("  X -> M -> Y\n")

    print("To estimate the effect of X on Y:")
    print("  - Backdoor paths: X <- Z1 -> Y, X <- Z1 -> Z2 -> Y")
    print("  - Valid adjustment sets: {Z1}, {Z1, Z2}")
    print("  - Invalid: {M} (descendant of X)")
    print("  - Invalid: {Z2} alone (doesn't block X <- Z1 -> Y)\n")

    # Numerical demonstration
    np.random.seed(42)
    n = 5000

    # Generate data
    Z1 = np.random.normal(0, 1, n)
    Z2 = 0.5 * Z1 + np.random.normal(0, 0.5, n)
    X = 0.7 * Z1 + np.random.binomial(1, 0.5, n)  # X also has random component
    M = 0.8 * X + np.random.normal(0, 0.5, n)
    Y = 0.5 * M + 0.3 * Z1 + 0.4 * Z2 + np.random.normal(0, 0.5, n)

    data = pd.DataFrame({'Z1': Z1, 'Z2': Z2, 'X': X, 'M': M, 'Y': Y})

    # True causal effect of X on Y (through M)
    # X -> M with coef 0.8, M -> Y with coef 0.5
    true_effect = 0.8 * 0.5
    print(f"True causal effect of X on Y: {true_effect:.3f}\n")

    from sklearn.linear_model import LinearRegression

    # Naive regression
    model_naive = LinearRegression().fit(data[['X']], data['Y'])
    print(f"Naive (no adjustment): {model_naive.coef_[0]:.3f} (biased)")

    # Adjusting for Z1 (valid)
    model_z1 = LinearRegression().fit(data[['X', 'Z1']], data['Y'])
    print(f"Adjusting for Z1: {model_z1.coef_[0]:.3f} (close to true)")

    # Adjusting for Z1 and Z2 (valid)
    model_z1z2 = LinearRegression().fit(data[['X', 'Z1', 'Z2']], data['Y'])
    print(f"Adjusting for Z1, Z2: {model_z1z2.coef_[0]:.3f} (close to true)")

    # Adjusting for M (invalid - mediator!)
    model_m = LinearRegression().fit(data[['X', 'M']], data['Y'])
    print(f"Adjusting for M (mediator): {model_m.coef_[0]:.3f} (biased - blocks effect!)")

backdoor_criterion_example()
```

---

## Confounding Variables

Confounders are variables that cause both the treatment and the outcome, creating spurious associations that can mislead causal conclusions.

### Types of Confounding

```python
def demonstrate_confounding_types():
    """
    Demonstrate different types of confounding and their effects
    """

    np.random.seed(42)
    n = 2000

    results = {}

    # 1. Classic Confounding: Z -> X, Z -> Y
    print("=== Type 1: Classic Confounding ===")
    print("Structure: Z -> X, Z -> Y, X -> Y")

    Z = np.random.normal(0, 1, n)
    X = 0.7 * Z + np.random.normal(0, 0.5, n)
    Y = 2 * X + 1.5 * Z + np.random.normal(0, 0.5, n)  # True effect of X is 2

    # Naive estimate
    from sklearn.linear_model import LinearRegression
    naive = LinearRegression().fit(X.reshape(-1, 1), Y)
    adjusted = LinearRegression().fit(np.column_stack([X, Z]), Y)

    print(f"  True effect: 2.0")
    print(f"  Naive estimate: {naive.coef_[0]:.3f} (confounded)")
    print(f"  Adjusted estimate: {adjusted.coef_[0]:.3f}")

    # 2. Collider Bias (conditioning on a common effect)
    print("\n=== Type 2: Collider Bias ===")
    print("Structure: X -> C <- Y (C is a collider)")
    print("Problem: Conditioning on C creates spurious association")

    X = np.random.normal(0, 1, n)
    Y = np.random.normal(0, 1, n)  # X and Y are independent!
    C = X + Y + np.random.normal(0, 0.5, n)  # Collider

    # Without conditioning
    corr_unconditional, _ = stats.pearsonr(X, Y)
    print(f"  Correlation X-Y (unconditional): {corr_unconditional:.3f}")

    # Condition on C (e.g., select C > 0)
    mask = C > 0
    corr_conditional, _ = stats.pearsonr(X[mask], Y[mask])
    print(f"  Correlation X-Y (given C > 0): {corr_conditional:.3f} (spurious!)")

    # 3. Selection Bias
    print("\n=== Type 3: Selection Bias ===")
    print("Structure: Analysis restricted to a subpopulation")

    # Full population
    talent = np.random.normal(0, 1, n)
    luck = np.random.normal(0, 1, n)
    success = talent + luck

    # Selection: only observe successful people
    threshold = np.percentile(success, 70)
    selected = success > threshold

    # In full population, talent and luck are independent
    corr_full, _ = stats.pearsonr(talent, luck)
    print(f"  Correlation talent-luck (full): {corr_full:.3f}")

    # In selected sample, they appear negatively correlated
    corr_selected, _ = stats.pearsonr(talent[selected], luck[selected])
    print(f"  Correlation talent-luck (successful only): {corr_selected:.3f}")
    print("  (Selection creates the illusion that talented people are unlucky!)")

demonstrate_confounding_types()
```

### Identifying Confounders

```python
class ConfounderIdentification:
    """Methods for identifying potential confounders"""

    @staticmethod
    def check_confounder_criteria(data, treatment, outcome, potential_confounder):
        """
        Check if a variable meets the criteria for being a confounder:
        1. Associated with treatment
        2. Associated with outcome (conditional on treatment)
        3. Not on the causal pathway between treatment and outcome
        """
        from scipy import stats

        # Check association with treatment
        if data[treatment].dtype in ['int64', 'float64']:
            corr_treatment, p_treatment = stats.pearsonr(
                data[potential_confounder], data[treatment]
            )
        else:
            # For categorical treatment
            groups = data.groupby(treatment)[potential_confounder].mean()
            corr_treatment = groups.std()  # Simplified check
            p_treatment = 0.01  # Placeholder

        # Check association with outcome (controlling for treatment)
        from sklearn.linear_model import LinearRegression
        model = LinearRegression()
        model.fit(data[[treatment, potential_confounder]], data[outcome])
        coef_confounder = model.coef_[1]

        result = {
            'variable': potential_confounder,
            'associated_with_treatment': abs(corr_treatment) > 0.1,
            'associated_with_outcome': abs(coef_confounder) > 0.1,
            'treatment_correlation': corr_treatment,
            'outcome_coefficient': coef_confounder,
            'is_potential_confounder': abs(corr_treatment) > 0.1 and abs(coef_confounder) > 0.1
        }

        return result

    @staticmethod
    def sensitivity_analysis(data, treatment, outcome, confounders,
                           unmeasured_confounder_strength):
        """
        Assess sensitivity of causal estimate to unmeasured confounding

        Parameters:
        - unmeasured_confounder_strength: hypothetical R^2 with treatment and outcome
        """
        from sklearn.linear_model import LinearRegression

        # Get adjusted estimate
        model = LinearRegression()
        X_cols = [treatment] + confounders
        model.fit(data[X_cols], data[outcome])
        adjusted_effect = model.coef_[0]

        # Calculate residual variance
        residuals = data[outcome] - model.predict(data[X_cols])
        residual_var = np.var(residuals)

        # Potential bias from unmeasured confounder
        # Simplified Omitted Variable Bias formula
        potential_bias = np.sqrt(unmeasured_confounder_strength) * np.std(data[outcome])

        return {
            'adjusted_effect': adjusted_effect,
            'potential_bias_range': (-potential_bias, potential_bias),
            'effect_if_positive_confounding': adjusted_effect - potential_bias,
            'effect_if_negative_confounding': adjusted_effect + potential_bias,
            'robust_to_confounding': adjusted_effect - potential_bias > 0 or adjusted_effect + potential_bias < 0
        }

# Example usage
np.random.seed(42)
n = 1000

# Generate data with measured and unmeasured confounders
age = np.random.normal(45, 10, n)
income = 30000 + 500 * age + np.random.normal(0, 10000, n)
health_consciousness = np.random.normal(0, 1, n)  # Unmeasured

# Treatment (exercise) depends on confounders
exercise = (0.02 * (age - 45) + 0.3 * health_consciousness +
            np.random.normal(0, 1, n)) > 0
exercise = exercise.astype(int)

# Outcome (health) depends on treatment and confounders
health = (70 + 5 * exercise - 0.3 * age + 0.0001 * income +
          3 * health_consciousness + np.random.normal(0, 5, n))

data = pd.DataFrame({
    'age': age,
    'income': income,
    'exercise': exercise,
    'health': health
})

# Check age as confounder
ci = ConfounderIdentification()
result = ci.check_confounder_criteria(data, 'exercise', 'health', 'age')
print("Confounder Check for 'age':")
for k, v in result.items():
    print(f"  {k}: {v}")

# Sensitivity analysis
print("\n\nSensitivity Analysis:")
sensitivity = ci.sensitivity_analysis(
    data, 'exercise', 'health', ['age', 'income'],
    unmeasured_confounder_strength=0.1
)
for k, v in sensitivity.items():
    print(f"  {k}: {v}")
```

---

## Propensity Score Matching

Propensity Score Matching (PSM) is a technique for estimating causal effects by matching treated and control units with similar propensity scores (probability of receiving treatment).

### Theory and Implementation

```python
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

class PropensityScoreMatching:
    """
    Propensity Score Matching for causal inference
    """

    def __init__(self, caliper=0.2):
        """
        Initialize PSM

        Parameters:
        - caliper: Maximum allowed difference in propensity scores for matching
        """
        self.caliper = caliper
        self.propensity_model = None
        self.scaler = StandardScaler()

    def estimate_propensity_scores(self, X, treatment):
        """
        Estimate propensity scores using logistic regression

        Parameters:
        - X: Covariates
        - treatment: Binary treatment indicator

        Returns:
        - Propensity scores
        """
        X_scaled = self.scaler.fit_transform(X)
        self.propensity_model = LogisticRegression(max_iter=1000)
        self.propensity_model.fit(X_scaled, treatment)

        propensity_scores = self.propensity_model.predict_proba(X_scaled)[:, 1]
        return propensity_scores

    def match(self, propensity_scores, treatment, replacement=False):
        """
        Perform nearest neighbor matching based on propensity scores

        Parameters:
        - propensity_scores: Estimated propensity scores
        - treatment: Binary treatment indicator
        - replacement: Whether to allow matching with replacement

        Returns:
        - matched_pairs: List of (treated_idx, control_idx) tuples
        """
        treated_idx = np.where(treatment == 1)[0]
        control_idx = np.where(treatment == 0)[0]

        # Reshape for sklearn
        treated_ps = propensity_scores[treated_idx].reshape(-1, 1)
        control_ps = propensity_scores[control_idx].reshape(-1, 1)

        # Find nearest neighbors
        nn = NearestNeighbors(n_neighbors=1, algorithm='ball_tree')
        nn.fit(control_ps)

        distances, indices = nn.kneighbors(treated_ps)

        matched_pairs = []
        used_controls = set()

        for i, (dist, idx) in enumerate(zip(distances.flatten(), indices.flatten())):
            # Check caliper
            ps_diff = abs(propensity_scores[treated_idx[i]] -
                         propensity_scores[control_idx[idx]])

            if ps_diff <= self.caliper:
                if replacement or control_idx[idx] not in used_controls:
                    matched_pairs.append((treated_idx[i], control_idx[idx]))
                    used_controls.add(control_idx[idx])

        return matched_pairs

    def estimate_ate(self, outcome, matched_pairs):
        """
        Estimate Average Treatment Effect from matched pairs

        Parameters:
        - outcome: Outcome variable
        - matched_pairs: List of (treated_idx, control_idx) tuples

        Returns:
        - ATE estimate and standard error
        """
        treated_outcomes = [outcome[t] for t, c in matched_pairs]
        control_outcomes = [outcome[c] for t, c in matched_pairs]

        differences = np.array(treated_outcomes) - np.array(control_outcomes)

        ate = np.mean(differences)
        se = np.std(differences) / np.sqrt(len(differences))

        return {
            'ATE': ate,
            'SE': se,
            'CI_lower': ate - 1.96 * se,
            'CI_upper': ate + 1.96 * se,
            'n_matched': len(matched_pairs)
        }

    def assess_balance(self, X, treatment, matched_pairs, feature_names=None):
        """
        Assess covariate balance before and after matching

        Returns standardized mean differences for each covariate
        """
        if feature_names is None:
            feature_names = [f'X{i}' for i in range(X.shape[1])]

        results = []

        for j, name in enumerate(feature_names):
            # Before matching
            treated_mean_before = X[treatment == 1, j].mean()
            control_mean_before = X[treatment == 0, j].mean()
            pooled_std = np.sqrt(
                (X[treatment == 1, j].var() + X[treatment == 0, j].var()) / 2
            )
            smd_before = (treated_mean_before - control_mean_before) / pooled_std

            # After matching
            treated_idx = [t for t, c in matched_pairs]
            control_idx = [c for t, c in matched_pairs]

            treated_mean_after = X[treated_idx, j].mean()
            control_mean_after = X[control_idx, j].mean()
            smd_after = (treated_mean_after - control_mean_after) / pooled_std

            results.append({
                'covariate': name,
                'SMD_before': smd_before,
                'SMD_after': smd_after,
                'improvement': abs(smd_before) - abs(smd_after)
            })

        return pd.DataFrame(results)

# Example: Effect of job training on earnings
np.random.seed(42)
n = 2000

# Confounders
age = np.random.normal(35, 10, n)
education = np.random.normal(12, 3, n)
prior_earnings = 20000 + 1000 * education + np.random.normal(0, 5000, n)

# Treatment (job training) - depends on confounders
prob_training = 1 / (1 + np.exp(-(0.1 * (education - 12) - 0.05 * (age - 35))))
treatment = np.random.binomial(1, prob_training)

# Outcome (post-training earnings)
# True treatment effect: $3000
earnings = (prior_earnings + 3000 * treatment +
            500 * education - 100 * age +
            np.random.normal(0, 3000, n))

X = np.column_stack([age, education, prior_earnings])
feature_names = ['age', 'education', 'prior_earnings']

# Apply PSM
psm = PropensityScoreMatching(caliper=0.1)

# Estimate propensity scores
propensity_scores = psm.estimate_propensity_scores(X, treatment)

# Perform matching
matched_pairs = psm.match(propensity_scores, treatment)

# Estimate ATE
ate_result = psm.estimate_ate(earnings, matched_pairs)

print("=== Propensity Score Matching Results ===\n")
print(f"True treatment effect: $3,000\n")

# Naive estimate
naive_effect = earnings[treatment == 1].mean() - earnings[treatment == 0].mean()
print(f"Naive estimate: ${naive_effect:.0f}")

print(f"\nPSM estimate:")
print(f"  ATE: ${ate_result['ATE']:.0f}")
print(f"  95% CI: [${ate_result['CI_lower']:.0f}, ${ate_result['CI_upper']:.0f}]")
print(f"  Matched pairs: {ate_result['n_matched']}")

# Check balance
balance = psm.assess_balance(X, treatment, matched_pairs, feature_names)
print(f"\nCovariate Balance:")
print(balance.to_string(index=False))
```

### Propensity Score Weighting

```python
class InversePropensityWeighting:
    """
    Inverse Propensity Score Weighting for causal inference

    More efficient than matching as it uses all observations
    """

    def __init__(self, trim_threshold=0.01):
        """
        Parameters:
        - trim_threshold: Remove observations with extreme propensity scores
        """
        self.trim_threshold = trim_threshold

    def estimate_ate_ipw(self, outcome, treatment, propensity_scores):
        """
        Estimate ATE using inverse propensity weighting

        IPW Estimator:
        ATE = E[Y * T / e(X)] - E[Y * (1-T) / (1-e(X))]
        """
        # Trim extreme propensity scores
        mask = ((propensity_scores > self.trim_threshold) &
                (propensity_scores < 1 - self.trim_threshold))

        y = outcome[mask]
        t = treatment[mask]
        ps = propensity_scores[mask]

        # IPW estimator
        treated_term = np.sum(y * t / ps) / np.sum(t / ps)
        control_term = np.sum(y * (1 - t) / (1 - ps)) / np.sum((1 - t) / (1 - ps))

        ate = treated_term - control_term

        # Bootstrap standard error
        n_bootstrap = 1000
        ate_bootstrap = []

        for _ in range(n_bootstrap):
            idx = np.random.choice(len(y), len(y), replace=True)
            y_b, t_b, ps_b = y[idx], t[idx], ps[idx]

            treated_term_b = np.sum(y_b * t_b / ps_b) / np.sum(t_b / ps_b)
            control_term_b = np.sum(y_b * (1 - t_b) / (1 - ps_b)) / np.sum((1 - t_b) / (1 - ps_b))
            ate_bootstrap.append(treated_term_b - control_term_b)

        se = np.std(ate_bootstrap)

        return {
            'ATE': ate,
            'SE': se,
            'CI_lower': ate - 1.96 * se,
            'CI_upper': ate + 1.96 * se,
            'n_used': mask.sum()
        }

    def estimate_att_ipw(self, outcome, treatment, propensity_scores):
        """
        Estimate Average Treatment Effect on the Treated (ATT)

        ATT = E[Y(1) - Y(0) | T=1]
        """
        mask = ((propensity_scores > self.trim_threshold) &
                (propensity_scores < 1 - self.trim_threshold))

        y = outcome[mask]
        t = treatment[mask]
        ps = propensity_scores[mask]

        # ATT estimator
        treated_mean = np.mean(y[t == 1])

        # Weighted control mean (weight by ps/(1-ps) to match treated distribution)
        weights = ps[t == 0] / (1 - ps[t == 0])
        control_mean_weighted = np.average(y[t == 0], weights=weights)

        att = treated_mean - control_mean_weighted

        return {'ATT': att}

# Using previous data
ipw = InversePropensityWeighting()
ipw_result = ipw.estimate_ate_ipw(earnings, treatment, propensity_scores)

print("\n=== Inverse Propensity Weighting Results ===\n")
print(f"IPW estimate:")
print(f"  ATE: ${ipw_result['ATE']:.0f}")
print(f"  95% CI: [${ipw_result['CI_lower']:.0f}, ${ipw_result['CI_upper']:.0f}]")
```

---

## Difference-in-Differences

Difference-in-Differences (DiD) is a quasi-experimental design that estimates causal effects by comparing changes over time between treatment and control groups.

### The DiD Estimator

```python
class DifferenceInDifferences:
    """
    Difference-in-Differences estimator for causal inference
    """

    def __init__(self):
        pass

    def estimate_did(self, data, outcome_col, treatment_col, time_col,
                     pre_period, post_period):
        """
        Estimate the DiD treatment effect

        Parameters:
        - data: DataFrame with panel data
        - outcome_col: Name of outcome variable
        - treatment_col: Name of treatment indicator (0/1)
        - time_col: Name of time variable
        - pre_period: Value indicating pre-treatment period
        - post_period: Value indicating post-treatment period

        Returns:
        - DiD estimate and components
        """
        # Four group means
        treated_pre = data[(data[treatment_col] == 1) &
                          (data[time_col] == pre_period)][outcome_col].mean()
        treated_post = data[(data[treatment_col] == 1) &
                           (data[time_col] == post_period)][outcome_col].mean()
        control_pre = data[(data[treatment_col] == 0) &
                          (data[time_col] == pre_period)][outcome_col].mean()
        control_post = data[(data[treatment_col] == 0) &
                           (data[time_col] == post_period)][outcome_col].mean()

        # DiD estimate
        did = (treated_post - treated_pre) - (control_post - control_pre)

        return {
            'DID_estimate': did,
            'treated_pre': treated_pre,
            'treated_post': treated_post,
            'control_pre': control_pre,
            'control_post': control_post,
            'treated_change': treated_post - treated_pre,
            'control_change': control_post - control_pre
        }

    def estimate_did_regression(self, data, outcome_col, treatment_col,
                                time_col, covariates=None):
        """
        Estimate DiD using regression:
        Y = beta_0 + beta_1*Treatment + beta_2*Post + beta_3*Treatment*Post + e

        beta_3 is the DiD estimate
        """
        import statsmodels.api as sm

        # Create interaction term
        data = data.copy()
        data['post'] = (data[time_col] == data[time_col].max()).astype(int)
        data['did_interaction'] = data[treatment_col] * data['post']

        # Build regression
        X_cols = [treatment_col, 'post', 'did_interaction']
        if covariates:
            X_cols.extend(covariates)

        X = sm.add_constant(data[X_cols])
        y = data[outcome_col]

        model = sm.OLS(y, X).fit()

        return {
            'DID_estimate': model.params['did_interaction'],
            'SE': model.bse['did_interaction'],
            'p_value': model.pvalues['did_interaction'],
            'CI_lower': model.conf_int().loc['did_interaction', 0],
            'CI_upper': model.conf_int().loc['did_interaction', 1],
            'model_summary': model.summary()
        }

    def parallel_trends_test(self, data, outcome_col, treatment_col,
                            time_col, pre_periods):
        """
        Test the parallel trends assumption using pre-treatment data

        The key assumption of DiD is that treatment and control groups
        would have followed parallel trends in the absence of treatment.
        """
        pre_data = data[data[time_col].isin(pre_periods)].copy()

        # Regression with time trends
        import statsmodels.api as sm

        # Create time dummies and interactions
        time_dummies = pd.get_dummies(pre_data[time_col], prefix='t', drop_first=True)

        interactions = pd.DataFrame()
        for col in time_dummies.columns:
            interactions[f'treat_{col}'] = pre_data[treatment_col] * time_dummies[col]

        X = pd.concat([
            pd.DataFrame({'const': 1, 'treatment': pre_data[treatment_col]}),
            time_dummies,
            interactions
        ], axis=1)

        y = pre_data[outcome_col]

        model = sm.OLS(y, X).fit()

        # Test if interaction coefficients are jointly zero
        interaction_cols = [c for c in X.columns if c.startswith('treat_t')]

        if len(interaction_cols) > 0:
            # F-test for joint significance
            r_matrix = np.zeros((len(interaction_cols), len(X.columns)))
            for i, col in enumerate(interaction_cols):
                r_matrix[i, list(X.columns).index(col)] = 1

            f_test = model.f_test(r_matrix)

            return {
                'f_statistic': f_test.fvalue[0][0],
                'p_value': f_test.pvalue,
                'parallel_trends_holds': f_test.pvalue > 0.05,
                'interaction_coefficients': {col: model.params[col]
                                            for col in interaction_cols}
            }

        return {'message': 'Not enough pre-periods for test'}

# Example: Effect of minimum wage increase on employment
np.random.seed(42)

# Generate panel data
n_units = 200  # Restaurants
n_periods = 6  # Time periods

unit_ids = np.repeat(range(n_units), n_periods)
time_periods = np.tile(range(n_periods), n_units)

# Treatment: minimum wage increase in period 3
treatment_group = np.repeat(np.random.binomial(1, 0.5, n_units), n_periods)
post_treatment = (time_periods >= 3).astype(int)

# Generate outcomes (employment)
# Unit fixed effects
unit_fe = np.repeat(np.random.normal(100, 20, n_units), n_periods)
# Time trend (common to both groups)
time_trend = 2 * time_periods

# True treatment effect: -5 employees after minimum wage increase
treatment_effect = -5 * treatment_group * post_treatment

# Add noise
noise = np.random.normal(0, 5, n_units * n_periods)

employment = unit_fe + time_trend + treatment_effect + noise

panel_data = pd.DataFrame({
    'unit_id': unit_ids,
    'time': time_periods,
    'treatment': treatment_group,
    'employment': employment
})

# Estimate DiD
did = DifferenceInDifferences()

# Simple DiD
simple_result = did.estimate_did(
    panel_data, 'employment', 'treatment', 'time',
    pre_period=2, post_period=3
)

print("=== Difference-in-Differences Results ===\n")
print(f"True treatment effect: -5\n")
print("Simple DiD:")
for k, v in simple_result.items():
    print(f"  {k}: {v:.3f}" if isinstance(v, float) else f"  {k}: {v}")

# Regression DiD
print("\nRegression DiD:")
reg_result = did.estimate_did_regression(
    panel_data, 'employment', 'treatment', 'time'
)
print(f"  DID estimate: {reg_result['DID_estimate']:.3f}")
print(f"  SE: {reg_result['SE']:.3f}")
print(f"  95% CI: [{reg_result['CI_lower']:.3f}, {reg_result['CI_upper']:.3f}]")
print(f"  p-value: {reg_result['p_value']:.4f}")

# Test parallel trends
print("\nParallel Trends Test (pre-treatment periods):")
pt_result = did.parallel_trends_test(
    panel_data, 'employment', 'treatment', 'time',
    pre_periods=[0, 1, 2]
)
print(f"  F-statistic: {pt_result.get('f_statistic', 'N/A'):.3f}")
print(f"  p-value: {pt_result.get('p_value', 'N/A'):.4f}")
print(f"  Parallel trends assumption holds: {pt_result.get('parallel_trends_holds', 'N/A')}")
```

### Visualizing DiD

```python
def visualize_did(data, outcome_col, treatment_col, time_col, treatment_time):
    """
    Create visualization of Difference-in-Differences
    """
    fig, ax = plt.subplots(figsize=(10, 6))

    # Calculate means by group and time
    means = data.groupby([treatment_col, time_col])[outcome_col].mean().reset_index()

    treated_means = means[means[treatment_col] == 1]
    control_means = means[means[treatment_col] == 0]

    # Plot actual trends
    ax.plot(treated_means[time_col], treated_means[outcome_col],
            'b-o', label='Treatment Group', linewidth=2, markersize=8)
    ax.plot(control_means[time_col], control_means[outcome_col],
            'r-s', label='Control Group', linewidth=2, markersize=8)

    # Add counterfactual (parallel trend for treatment group)
    pre_treatment = treated_means[treated_means[time_col] < treatment_time]
    post_treatment = control_means[control_means[time_col] >= treatment_time]

    if len(pre_treatment) > 0 and len(post_treatment) > 0:
        # Calculate counterfactual based on control group trend
        pre_diff = (treated_means[treated_means[time_col] < treatment_time][outcome_col].iloc[-1] -
                   control_means[control_means[time_col] < treatment_time][outcome_col].iloc[-1])

        counterfactual = control_means[outcome_col] + pre_diff
        ax.plot(control_means[time_col], counterfactual,
                'b--', alpha=0.5, label='Counterfactual (Treatment)', linewidth=2)

    # Add vertical line at treatment time
    ax.axvline(x=treatment_time - 0.5, color='gray', linestyle='--', alpha=0.7)
    ax.text(treatment_time - 0.4, ax.get_ylim()[1], 'Treatment',
            rotation=90, va='top', fontsize=10)

    ax.set_xlabel('Time Period')
    ax.set_ylabel(outcome_col)
    ax.set_title('Difference-in-Differences Visualization')
    ax.legend()
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.show()

# Visualize
visualize_did(panel_data, 'employment', 'treatment', 'time', treatment_time=3)
```

---

## Instrumental Variables

Instrumental Variables (IV) provide a way to estimate causal effects when there is unmeasured confounding, by using a variable that affects treatment but only affects outcome through treatment.

### The IV Framework

```python
class InstrumentalVariables:
    """
    Instrumental Variables estimator for causal inference
    """

    def __init__(self):
        pass

    def two_stage_least_squares(self, data, outcome, treatment, instrument,
                                covariates=None):
        """
        Two-Stage Least Squares (2SLS) estimation

        Stage 1: Regress Treatment on Instrument (and covariates)
        Stage 2: Regress Outcome on Predicted Treatment (and covariates)

        Parameters:
        - data: DataFrame
        - outcome: Name of outcome variable
        - treatment: Name of endogenous treatment variable
        - instrument: Name of instrumental variable
        - covariates: List of exogenous control variables
        """
        import statsmodels.api as sm

        # Prepare variables
        Z = data[[instrument]]
        if covariates:
            Z = pd.concat([Z, data[covariates]], axis=1)
        Z = sm.add_constant(Z)

        X = data[[treatment]]
        if covariates:
            X = pd.concat([X, data[covariates]], axis=1)
        X = sm.add_constant(X)

        y = data[outcome]
        D = data[treatment]

        # Stage 1: Regress treatment on instrument
        stage1 = sm.OLS(D, Z).fit()
        D_hat = stage1.predict(Z)

        # Stage 2: Regress outcome on predicted treatment
        X_stage2 = X.copy()
        X_stage2[treatment] = D_hat
        stage2 = sm.OLS(y, X_stage2).fit()

        # Correct standard errors (2SLS SE adjustment)
        # Using linearmodels for proper IV standard errors
        try:
            from linearmodels.iv import IV2SLS

            formula_parts = [f'{outcome} ~ 1']
            if covariates:
                formula_parts[0] += ' + ' + ' + '.join(covariates)
            formula_parts.append(f'[{treatment} ~ {instrument}]')

            iv_model = IV2SLS.from_formula(
                ' '.join(formula_parts),
                data=data
            ).fit()

            return {
                'treatment_effect': iv_model.params[treatment],
                'SE': iv_model.std_errors[treatment],
                'p_value': iv_model.pvalues[treatment],
                'CI_lower': iv_model.conf_int().loc[treatment, 'lower'],
                'CI_upper': iv_model.conf_int().loc[treatment, 'upper'],
                'first_stage_F': stage1.fvalue,
                'stage1_coef': stage1.params[instrument],
                'method': 'linearmodels'
            }
        except ImportError:
            # Fallback to manual 2SLS
            return {
                'treatment_effect': stage2.params[treatment],
                'SE': stage2.bse[treatment],  # Note: These SEs are not correct
                'p_value': stage2.pvalues[treatment],
                'first_stage_F': stage1.fvalue,
                'stage1_coef': stage1.params[instrument],
                'method': 'manual_2sls',
                'warning': 'Install linearmodels for correct standard errors'
            }

    def wald_estimator(self, data, outcome, treatment, instrument):
        """
        Simple Wald (IV) estimator for binary instrument

        IV estimate = Cov(Y, Z) / Cov(D, Z)
        """
        y = data[outcome]
        D = data[treatment]
        Z = data[instrument]

        # Cov(Y, Z) / Cov(D, Z)
        cov_yz = np.cov(y, Z)[0, 1]
        cov_dz = np.cov(D, Z)[0, 1]

        iv_estimate = cov_yz / cov_dz

        # Bootstrap standard error
        n_bootstrap = 1000
        estimates = []

        for _ in range(n_bootstrap):
            idx = np.random.choice(len(data), len(data), replace=True)
            y_b, D_b, Z_b = y.iloc[idx], D.iloc[idx], Z.iloc[idx]
            cov_yz_b = np.cov(y_b, Z_b)[0, 1]
            cov_dz_b = np.cov(D_b, Z_b)[0, 1]
            if cov_dz_b != 0:
                estimates.append(cov_yz_b / cov_dz_b)

        se = np.std(estimates)

        return {
            'IV_estimate': iv_estimate,
            'SE': se,
            'CI_lower': iv_estimate - 1.96 * se,
            'CI_upper': iv_estimate + 1.96 * se
        }

    def test_instrument_validity(self, data, outcome, treatment, instrument,
                                 covariates=None):
        """
        Test instrument validity:
        1. Relevance: Instrument must be correlated with treatment
        2. Exclusion: Instrument affects outcome only through treatment

        We can test (1) but not (2) directly
        """
        import statsmodels.api as sm

        # Test relevance (first stage F-statistic)
        Z = data[[instrument]]
        if covariates:
            Z = pd.concat([Z, data[covariates]], axis=1)
        Z = sm.add_constant(Z)

        D = data[treatment]

        stage1 = sm.OLS(D, Z).fit()

        # Rule of thumb: F > 10 for strong instrument
        f_stat = stage1.fvalue

        # Correlation with treatment
        corr_treatment = np.corrcoef(data[instrument], data[treatment])[0, 1]

        return {
            'first_stage_F': f_stat,
            'strong_instrument': f_stat > 10,
            'instrument_treatment_corr': corr_treatment,
            'instrument_coefficient': stage1.params[instrument],
            'instrument_pvalue': stage1.pvalues[instrument],
            'note': 'Exclusion restriction cannot be tested, must rely on theory'
        }

# Example: Effect of education on earnings using distance to college as instrument
np.random.seed(42)
n = 3000

# Instrument: Distance to nearest college (affects education, not directly earnings)
distance_to_college = np.random.exponential(20, n)

# Unmeasured confounder (ability)
ability = np.random.normal(0, 1, n)

# Treatment: Years of education
# Depends on ability (confounder) and distance (instrument)
education = 12 + 2 * ability - 0.05 * distance_to_college + np.random.normal(0, 2, n)
education = np.clip(education, 8, 20)

# Outcome: Log earnings
# Depends on education and ability
# True causal effect of education: 0.1 (10% increase per year)
log_earnings = 9 + 0.1 * education + 0.3 * ability + np.random.normal(0, 0.5, n)

iv_data = pd.DataFrame({
    'log_earnings': log_earnings,
    'education': education,
    'distance': distance_to_college,
    'ability': ability  # Unmeasured in practice
})

# IV estimation
iv = InstrumentalVariables()

print("=== Instrumental Variables Estimation ===\n")
print("True causal effect of education: 0.10\n")

# Naive OLS (biased due to ability confounding)
import statsmodels.api as sm
naive_ols = sm.OLS(iv_data['log_earnings'],
                   sm.add_constant(iv_data['education'])).fit()
print(f"Naive OLS estimate: {naive_ols.params['education']:.4f} (biased upward)")

# IV estimate
iv_result = iv.two_stage_least_squares(
    iv_data, 'log_earnings', 'education', 'distance'
)
print(f"\nIV (2SLS) estimate: {iv_result['treatment_effect']:.4f}")
print(f"  SE: {iv_result['SE']:.4f}")
print(f"  First-stage F: {iv_result['first_stage_F']:.2f}")

# Test instrument validity
validity = iv.test_instrument_validity(
    iv_data, 'log_earnings', 'education', 'distance'
)
print(f"\nInstrument Validity:")
print(f"  Strong instrument (F > 10): {validity['strong_instrument']}")
print(f"  Instrument-treatment correlation: {validity['instrument_treatment_corr']:.3f}")

# Wald estimator for comparison
wald = iv.wald_estimator(iv_data, 'log_earnings', 'education', 'distance')
print(f"\nWald estimator: {wald['IV_estimate']:.4f}")
```

---

## DoWhy Library Implementation

DoWhy is a Python library that provides a unified interface for causal inference, implementing best practices from causal analysis.

### Complete Causal Analysis with DoWhy

```python
# pip install dowhy

import warnings
warnings.filterwarnings('ignore')

try:
    import dowhy
    from dowhy import CausalModel
    DOWHY_AVAILABLE = True
except ImportError:
    DOWHY_AVAILABLE = False
    print("DoWhy not installed. Install with: pip install dowhy")

if DOWHY_AVAILABLE:

    class DoWhyCausalAnalysis:
        """
        Complete causal analysis workflow using DoWhy
        """

        def __init__(self, data, treatment, outcome, graph=None,
                     common_causes=None, instruments=None):
            """
            Initialize causal model

            Parameters:
            - data: DataFrame
            - treatment: Name of treatment variable
            - outcome: Name of outcome variable
            - graph: Causal graph in DOT format (optional)
            - common_causes: List of confounders
            - instruments: List of instrumental variables
            """
            self.data = data
            self.treatment = treatment
            self.outcome = outcome

            # Create causal model
            self.model = CausalModel(
                data=data,
                treatment=treatment,
                outcome=outcome,
                graph=graph,
                common_causes=common_causes,
                instruments=instruments
            )

        def view_model(self):
            """Visualize the causal model"""
            self.model.view_model()

        def identify_effect(self):
            """
            Step 2: Identify causal effect
            Uses causal graph to determine if effect is identifiable
            """
            self.identified_estimand = self.model.identify_effect(
                proceed_when_unidentifiable=True
            )
            print(self.identified_estimand)
            return self.identified_estimand

        def estimate_effect(self, method='backdoor.propensity_score_matching'):
            """
            Step 3: Estimate causal effect

            Methods:
            - backdoor.propensity_score_matching
            - backdoor.propensity_score_weighting
            - backdoor.linear_regression
            - iv.instrumental_variable
            - frontdoor.two_stage_regression
            """
            self.estimate = self.model.estimate_effect(
                self.identified_estimand,
                method_name=method
            )
            print(f"\nCausal Estimate ({method}):")
            print(f"  Effect: {self.estimate.value:.4f}")

            return self.estimate

        def refute_estimate(self, methods=['random_common_cause',
                                          'placebo_treatment_refuter',
                                          'data_subset_refuter']):
            """
            Step 4: Refute estimate using various tests
            """
            refutation_results = {}

            for method in methods:
                try:
                    refutation = self.model.refute_estimate(
                        self.identified_estimand,
                        self.estimate,
                        method_name=method
                    )
                    refutation_results[method] = refutation
                    print(f"\n{method}:")
                    print(refutation)
                except Exception as e:
                    refutation_results[method] = f"Error: {str(e)}"

            return refutation_results

        def full_analysis(self, estimation_methods=None):
            """
            Run complete causal analysis workflow
            """
            if estimation_methods is None:
                estimation_methods = [
                    'backdoor.linear_regression',
                    'backdoor.propensity_score_matching',
                    'backdoor.propensity_score_weighting'
                ]

            print("=" * 60)
            print("DOWHY CAUSAL ANALYSIS")
            print("=" * 60)

            # Step 1: Model
            print("\n1. CAUSAL MODEL")
            print("-" * 40)
            print(f"Treatment: {self.treatment}")
            print(f"Outcome: {self.outcome}")

            # Step 2: Identify
            print("\n2. IDENTIFICATION")
            print("-" * 40)
            self.identify_effect()

            # Step 3: Estimate with multiple methods
            print("\n3. ESTIMATION")
            print("-" * 40)

            estimates = {}
            for method in estimation_methods:
                try:
                    est = self.model.estimate_effect(
                        self.identified_estimand,
                        method_name=method
                    )
                    estimates[method] = est.value
                    print(f"  {method}: {est.value:.4f}")
                except Exception as e:
                    estimates[method] = f"Error: {str(e)}"

            # Store last estimate for refutation
            self.estimate = self.model.estimate_effect(
                self.identified_estimand,
                method_name=estimation_methods[0]
            )

            # Step 4: Refute
            print("\n4. REFUTATION")
            print("-" * 40)
            self.refute_estimate()

            return estimates

    # Example: Analyzing effect of a marketing campaign
    np.random.seed(42)
    n = 2000

    # Generate data
    # Confounders
    age = np.random.normal(35, 10, n)
    income = np.random.lognormal(10.5, 0.5, n)
    prior_purchases = np.random.poisson(5, n)

    # Treatment: Received marketing email (depends on confounders)
    prob_email = 1 / (1 + np.exp(-(
        0.01 * (age - 35) +
        0.00001 * (income - 40000) +
        0.1 * (prior_purchases - 5)
    )))
    email_received = np.random.binomial(1, prob_email)

    # Outcome: Purchase amount
    # True causal effect of email: $20
    purchase = (50 +
                20 * email_received +  # True effect
                0.5 * age +
                0.001 * income +
                5 * prior_purchases +
                np.random.normal(0, 30, n))
    purchase = np.maximum(0, purchase)

    marketing_data = pd.DataFrame({
        'age': age,
        'income': income,
        'prior_purchases': prior_purchases,
        'email_received': email_received,
        'purchase': purchase
    })

    # Run analysis
    analysis = DoWhyCausalAnalysis(
        data=marketing_data,
        treatment='email_received',
        outcome='purchase',
        common_causes=['age', 'income', 'prior_purchases']
    )

    print("\nTrue causal effect: $20\n")
    estimates = analysis.full_analysis()
```

### Advanced DoWhy Features

```python
if DOWHY_AVAILABLE:

    def dowhy_with_graph():
        """
        DoWhy analysis with explicit causal graph
        """
        # Define causal graph in GML format
        causal_graph = """
        digraph {
            age -> email_received;
            age -> purchase;
            income -> email_received;
            income -> purchase;
            prior_purchases -> email_received;
            prior_purchases -> purchase;
            email_received -> purchase;
        }
        """

        model = CausalModel(
            data=marketing_data,
            treatment='email_received',
            outcome='purchase',
            graph=causal_graph
        )

        # Identify effect
        identified = model.identify_effect(proceed_when_unidentifiable=True)

        # Get all valid adjustment sets
        print("Identification Strategy:")
        print(identified)

        return model

    def sensitivity_analysis_dowhy():
        """
        Sensitivity analysis for unmeasured confounding
        """
        model = CausalModel(
            data=marketing_data,
            treatment='email_received',
            outcome='purchase',
            common_causes=['age', 'income', 'prior_purchases']
        )

        identified = model.identify_effect(proceed_when_unidentifiable=True)
        estimate = model.estimate_effect(
            identified,
            method_name='backdoor.linear_regression'
        )

        # Sensitivity analysis using different refuters

        # 1. Add random common cause
        random_refute = model.refute_estimate(
            identified, estimate,
            method_name='random_common_cause',
            placebo_type='permute'
        )
        print("Random Common Cause Refutation:")
        print(f"  Original estimate: {estimate.value:.4f}")
        print(f"  New estimate: {random_refute.new_effect:.4f}")

        # 2. Subset data refutation
        subset_refute = model.refute_estimate(
            identified, estimate,
            method_name='data_subset_refuter',
            subset_fraction=0.8
        )
        print(f"\nData Subset Refutation:")
        print(f"  Original estimate: {estimate.value:.4f}")
        print(f"  New estimate: {subset_refute.new_effect:.4f}")

        # 3. Placebo treatment
        placebo_refute = model.refute_estimate(
            identified, estimate,
            method_name='placebo_treatment_refuter',
            placebo_type='permute'
        )
        print(f"\nPlacebo Treatment Refutation:")
        print(f"  Original estimate: {estimate.value:.4f}")
        print(f"  Placebo estimate: {placebo_refute.new_effect:.4f}")
        print(f"  (Should be close to 0 if effect is real)")

    # Run advanced analyses
    print("\n=== Advanced DoWhy Analysis ===\n")
    model = dowhy_with_graph()

    print("\n=== Sensitivity Analysis ===\n")
    sensitivity_analysis_dowhy()
```

---

## Advanced Topics

### Causal Discovery

Causal discovery algorithms attempt to learn causal structure from data:

```python
def causal_discovery_example():
    """
    Introduction to causal discovery algorithms
    """

    print("=== Causal Discovery Algorithms ===\n")

    algorithms = {
        'PC Algorithm': {
            'type': 'Constraint-based',
            'assumptions': 'Causal Markov, Faithfulness',
            'output': 'Equivalence class (CPDAG)',
            'library': 'pcalg (R), causal-learn (Python)'
        },
        'FCI Algorithm': {
            'type': 'Constraint-based',
            'assumptions': 'Allows latent confounders',
            'output': 'PAG (allows for uncertainty)',
            'library': 'pcalg, causal-learn'
        },
        'GES (Greedy Equivalence Search)': {
            'type': 'Score-based',
            'assumptions': 'Score function (e.g., BIC)',
            'output': 'Equivalence class',
            'library': 'causal-learn'
        },
        'LiNGAM': {
            'type': 'Functional causal model',
            'assumptions': 'Linear, Non-Gaussian errors',
            'output': 'Full DAG (unique)',
            'library': 'lingam'
        },
        'NOTEARS': {
            'type': 'Optimization-based',
            'assumptions': 'Continuous optimization for DAG',
            'output': 'DAG',
            'library': 'notears, causalnex'
        }
    }

    for algo, details in algorithms.items():
        print(f"{algo}:")
        for key, value in details.items():
            print(f"  {key}: {value}")
        print()

causal_discovery_example()

# Simple implementation of PC-like independence testing
def simple_independence_test(X, Y, Z=None, alpha=0.05):
    """
    Test conditional independence X _||_ Y | Z
    using partial correlation
    """
    from scipy import stats

    if Z is None or len(Z) == 0:
        # Marginal independence
        corr, p_value = stats.pearsonr(X, Y)
    else:
        # Partial correlation
        # Residualize X and Y on Z
        from sklearn.linear_model import LinearRegression

        Z_array = np.column_stack(Z) if isinstance(Z, list) else Z.reshape(-1, 1)

        model_x = LinearRegression().fit(Z_array, X)
        model_y = LinearRegression().fit(Z_array, Y)

        resid_x = X - model_x.predict(Z_array)
        resid_y = Y - model_y.predict(Z_array)

        corr, p_value = stats.pearsonr(resid_x, resid_y)

    return {
        'correlation': corr,
        'p_value': p_value,
        'independent': p_value > alpha
    }

# Example
np.random.seed(42)
n = 500

Z = np.random.normal(0, 1, n)
X = 0.7 * Z + np.random.normal(0, 0.5, n)
Y = 0.6 * Z + np.random.normal(0, 0.5, n)

print("=== Independence Testing Example ===\n")
print("Structure: Z -> X, Z -> Y (X and Y are not directly connected)")

print("\nMarginal test X _||_ Y:")
result = simple_independence_test(X, Y)
print(f"  Correlation: {result['correlation']:.3f}")
print(f"  Independent: {result['independent']} (p={result['p_value']:.4f})")

print("\nConditional test X _||_ Y | Z:")
result = simple_independence_test(X, Y, [Z])
print(f"  Partial correlation: {result['correlation']:.3f}")
print(f"  Independent: {result['independent']} (p={result['p_value']:.4f})")
```

### Heterogeneous Treatment Effects

```python
class HeterogeneousTreatmentEffects:
    """
    Methods for estimating heterogeneous treatment effects
    """

    @staticmethod
    def causal_forest_example():
        """
        Causal Forest for heterogeneous effects
        (Requires econml library)
        """
        try:
            from econml.dml import CausalForestDML
            from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier

            # Generate data with heterogeneous effects
            np.random.seed(42)
            n = 2000

            X1 = np.random.normal(0, 1, n)
            X2 = np.random.normal(0, 1, n)
            X = np.column_stack([X1, X2])

            # Treatment
            T = np.random.binomial(1, 0.5, n)

            # Heterogeneous effect: larger for X1 > 0
            true_effect = 2 + 3 * (X1 > 0)

            # Outcome
            Y = X1 + X2 + true_effect * T + np.random.normal(0, 1, n)

            # Fit Causal Forest
            cf = CausalForestDML(
                model_y=RandomForestRegressor(n_estimators=100),
                model_t=RandomForestClassifier(n_estimators=100),
                n_estimators=100,
                random_state=42
            )
            cf.fit(Y, T, X=X)

            # Get individual treatment effects
            cate = cf.effect(X)

            print("=== Causal Forest Results ===\n")
            print(f"Average Treatment Effect: {np.mean(cate):.3f}")
            print(f"True ATE: {np.mean(true_effect):.3f}")

            # Effects by subgroup
            print(f"\nHeterogeneous Effects:")
            print(f"  X1 <= 0: estimated={np.mean(cate[X1 <= 0]):.3f}, true={2:.1f}")
            print(f"  X1 > 0: estimated={np.mean(cate[X1 > 0]):.3f}, true={5:.1f}")

            return cf, cate

        except ImportError:
            print("econml not installed. Install with: pip install econml")
            return None, None

    @staticmethod
    def subgroup_analysis(data, treatment, outcome, covariates, subgroup_var):
        """
        Simple subgroup analysis for treatment effect heterogeneity
        """
        results = []

        for subgroup in data[subgroup_var].unique():
            subset = data[data[subgroup_var] == subgroup]

            treated = subset[subset[treatment] == 1][outcome].mean()
            control = subset[subset[treatment] == 0][outcome].mean()

            effect = treated - control
            n_treated = (subset[treatment] == 1).sum()
            n_control = (subset[treatment] == 0).sum()

            results.append({
                'subgroup': subgroup,
                'effect': effect,
                'n_treated': n_treated,
                'n_control': n_control
            })

        return pd.DataFrame(results)

# Run examples
hte = HeterogeneousTreatmentEffects()
cf, cate = hte.causal_forest_example()
```

### Mediation Analysis

```python
def mediation_analysis(data, treatment, mediator, outcome, covariates=None):
    """
    Causal mediation analysis

    Decomposes total effect into:
    - Direct effect (treatment -> outcome)
    - Indirect effect (treatment -> mediator -> outcome)
    """
    import statsmodels.api as sm

    # Prepare data
    X_tm = data[[treatment]]
    if covariates:
        X_tm = pd.concat([X_tm, data[covariates]], axis=1)
    X_tm = sm.add_constant(X_tm)

    X_tmy = data[[treatment, mediator]]
    if covariates:
        X_tmy = pd.concat([X_tmy, data[covariates]], axis=1)
    X_tmy = sm.add_constant(X_tmy)

    # Model 1: Mediator ~ Treatment
    model_m = sm.OLS(data[mediator], X_tm).fit()
    a = model_m.params[treatment]  # Effect of T on M

    # Model 2: Outcome ~ Treatment + Mediator
    model_y = sm.OLS(data[outcome], X_tmy).fit()
    b = model_y.params[mediator]  # Effect of M on Y (controlling for T)
    c_prime = model_y.params[treatment]  # Direct effect of T on Y

    # Model 3: Outcome ~ Treatment (total effect)
    X_t = data[[treatment]]
    if covariates:
        X_t = pd.concat([X_t, data[covariates]], axis=1)
    X_t = sm.add_constant(X_t)
    model_total = sm.OLS(data[outcome], X_t).fit()
    c = model_total.params[treatment]  # Total effect

    # Calculate effects
    indirect_effect = a * b
    direct_effect = c_prime
    total_effect = c
    proportion_mediated = indirect_effect / total_effect if total_effect != 0 else 0

    return {
        'total_effect': total_effect,
        'direct_effect': direct_effect,
        'indirect_effect': indirect_effect,
        'proportion_mediated': proportion_mediated,
        'path_a (T->M)': a,
        'path_b (M->Y|T)': b,
        'path_c_prime (T->Y|M)': c_prime
    }

# Example: Effect of education on earnings, mediated by occupation
np.random.seed(42)
n = 1000

education = np.random.normal(14, 3, n)  # Years of education
occupation_prestige = 30 + 3 * education + np.random.normal(0, 10, n)  # Mediator
earnings = 20000 + 1000 * education + 500 * occupation_prestige + np.random.normal(0, 5000, n)

mediation_data = pd.DataFrame({
    'education': education,
    'occupation': occupation_prestige,
    'earnings': earnings
})

print("=== Mediation Analysis ===\n")
print("Path: Education -> Occupation -> Earnings")
print("       Education ---------> Earnings (direct)")
print()

results = mediation_analysis(mediation_data, 'education', 'occupation', 'earnings')
for k, v in results.items():
    if isinstance(v, float):
        print(f"{k}: {v:.2f}")
    else:
        print(f"{k}: {v}")
```

---

## Interview Key Points

### Conceptual Questions

**Q: What is the fundamental problem of causal inference?**

A: The fundamental problem is that we can never observe both potential outcomes for the same unit. For any individual, we observe either the outcome under treatment OR the outcome under control, but never both. This is why we need assumptions (like ignorability, parallel trends, or valid instruments) to estimate causal effects.

**Q: When can you infer causation from observational data?**

A: Causal inference from observational data is possible when:
1. You have a valid causal model (DAG) representing the data-generating process
2. You can identify a valid adjustment set (backdoor criterion)
3. Or you have a valid instrumental variable
4. Or you can exploit natural experiments (DiD, RDD)
5. Key assumptions are satisfied and untestable assumptions are plausible

**Q: Explain the difference between ATE, ATT, and LATE**

A:
- **ATE (Average Treatment Effect)**: Average effect across the entire population: E[Y(1) - Y(0)]
- **ATT (Average Treatment Effect on Treated)**: Average effect for those who actually received treatment: E[Y(1) - Y(0) | T=1]
- **LATE (Local Average Treatment Effect)**: Average effect for "compliers" in IV analysis - those whose treatment status is affected by the instrument

**Q: What are the key assumptions for Propensity Score Matching?**

A:
1. **SUTVA**: No interference between units, consistent treatment
2. **Positivity/Overlap**: 0 < P(T=1|X) < 1 for all X
3. **Ignorability/Unconfoundedness**: Y(0), Y(1) independent of T given X
4. **Correct model specification**: Propensity score model is correctly specified

**Q: How do you validate a DiD analysis?**

A:
1. **Parallel trends**: Check pre-treatment trends are similar (required assumption)
2. **No anticipation**: Treatment group didn't change behavior before treatment
3. **No spillovers**: Control group not affected by treatment
4. **Placebo tests**: Fake treatment timing should show no effect
5. **Sensitivity analysis**: Results robust to different specifications

### Practical Questions

**Q: You want to estimate the effect of a new feature on user engagement. What approach would you use?**

A: The approach depends on how the feature was rolled out:
1. **Randomized A/B test** (gold standard): Simple comparison of means
2. **Non-random rollout with observables**: PSM, IPW, or regression adjustment
3. **Gradual rollout over time**: DiD if there's a clear before/after
4. **Feature driven by unobservables**: Need IV or natural experiment

**Q: How do you handle unmeasured confounding?**

A:
1. **Sensitivity analysis**: How strong would confounding need to be to nullify results?
2. **Instrumental variables**: If a valid instrument is available
3. **Difference-in-differences**: If parallel trends assumption holds
4. **Regression discontinuity**: If there's a cutoff-based assignment
5. **Bounds analysis**: Estimate bounds on true effect under worst-case confounding

---

## Further Reading

### Essential Papers

1. **Pearl, J. (2009)**: "Causality: Models, Reasoning, and Inference" - The foundational text
2. **Rubin, D. (1974)**: "Estimating Causal Effects of Treatments" - Potential outcomes framework
3. **Angrist & Imbens (1996)**: "Identification of Causal Effects Using Instrumental Variables"
4. **Rosenbaum & Rubin (1983)**: "The Central Role of the Propensity Score"

### Books

1. **"The Book of Why"** by Judea Pearl - Accessible introduction to causal inference
2. **"Causal Inference: The Mixtape"** by Scott Cunningham - Applied econometrics perspective
3. **"Mostly Harmless Econometrics"** by Angrist & Pischke - Practical causal methods
4. **"Elements of Causal Inference"** by Peters, Janzing, Scholkopf - Machine learning perspective

### Python Libraries

- **DoWhy**: https://github.com/py-why/dowhy
- **EconML**: https://github.com/microsoft/EconML (Heterogeneous treatment effects)
- **CausalML**: https://github.com/uber/causalml (Uplift modeling)
- **causal-learn**: https://github.com/py-why/causal-learn (Causal discovery)
- **pgmpy**: https://pgmpy.org/ (Probabilistic graphical models)

### Online Resources

- DoWhy documentation and tutorials
- Microsoft Research Causal Inference series
- Brady Neal's "Introduction to Causal Inference" course
- Miguel Hernan's "Causal Diagrams" course (edX)

---

## Summary

Causal inference is essential for understanding the true effects of interventions and making sound decisions. Key takeaways:

1. **Correlation is not causation**: Always think about the causal structure before interpreting associations

2. **Causal graphs are powerful**: DAGs help you identify confounders, mediators, and colliders, and determine what to control for

3. **Multiple methods exist**: PSM, DiD, IV, and other methods each have different assumptions - choose based on your setting

4. **Assumptions matter**: Every causal method relies on untestable assumptions - be explicit about them

5. **Sensitivity analysis is crucial**: Always assess how robust your conclusions are to violations of assumptions

6. **Use appropriate tools**: Libraries like DoWhy provide structured workflows for rigorous causal analysis

7. **Domain knowledge is essential**: Statistical methods cannot replace understanding of the substantive domain

Mastering causal inference transforms you from someone who can find patterns in data to someone who can reliably answer "what if" questions - a critical skill for data science, product development, and policy analysis.
