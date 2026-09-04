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
origin: old/src/content/docs/datascience/causal-inference.zh.md
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

因果推断是从数据中确定因果关系的科学。虽然传统机器学习擅长发现相关性和进行预测，但它往往无法回答诸如"如果我们改变X会发生什么？"或"干预Y是否导致了结果Z？"等根本性问题。理解因果关系对于做出可靠的决策、设计有效的干预措施以及构建真正可解释的人工智能系统至关重要。

---

## 相关性与因果性

相关性与因果性的区别是因果推断的基础。相关性衡量的是统计关联，而因果性意味着一个变量直接影响另一个变量。

### 相关性的问题

考虑以下经典的虚假相关例子：

- 冰淇淋销量和溺水死亡人数相关（两者在夏季都会增加）
- 儿童的鞋码和阅读能力相关（两者都随年龄增长）
- 火灾现场的消防员数量与造成的损失相关（更大的火灾需要更多消防员）

这些相关性都不意味着因果关系。理解这一区别对于做出正确的决策至关重要。

### 为什么相关性不能用于决策

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy import stats

# 模拟冰淇淋/溺水的例子
np.random.seed(42)
n_days = 365

# 温度是共同原因（混杂因素）
temperature = 15 + 10 * np.sin(2 * np.pi * np.arange(n_days) / 365) + np.random.normal(0, 3, n_days)

# 冰淇淋销量取决于温度
ice_cream_sales = 100 + 5 * temperature + np.random.normal(0, 20, n_days)

# 游泳活动（和溺水风险）也取决于温度
swimming_activity = 20 + 3 * temperature + np.random.normal(0, 10, n_days)
drowning_incidents = np.maximum(0, swimming_activity / 50 + np.random.normal(0, 0.5, n_days))

# 计算相关性
corr_ice_drowning, p_value = stats.pearsonr(ice_cream_sales, drowning_incidents)
print(f"冰淇淋销量和溺水事件的相关性: {corr_ice_drowning:.3f}")
print(f"P值: {p_value:.6f}")

# 可视化
fig, axes = plt.subplots(1, 3, figsize=(15, 4))

axes[0].scatter(temperature, ice_cream_sales, alpha=0.5)
axes[0].set_xlabel('温度')
axes[0].set_ylabel('冰淇淋销量')
axes[0].set_title('温度 -> 冰淇淋销量')

axes[1].scatter(temperature, drowning_incidents, alpha=0.5)
axes[1].set_xlabel('温度')
axes[1].set_ylabel('溺水事件')
axes[1].set_title('温度 -> 溺水事件')

axes[2].scatter(ice_cream_sales, drowning_incidents, alpha=0.5)
axes[2].set_xlabel('冰淇淋销量')
axes[2].set_ylabel('溺水事件')
axes[2].set_title(f'虚假相关 (r={corr_ice_drowning:.2f})')

plt.tight_layout()
plt.show()
```

### 因果阶梯

朱迪亚·珀尔提出了"因果阶梯"来描述因果推理的三个层次：

**第一层：关联（观察）**
- 问题："在我观察到X的情况下，Y的概率是多少？"
- 例子："如果客户访问了我们的网站，他们购买的概率是多少？"
- 操作：观察数据，条件概率 P(Y|X)

**第二层：干预（行动）**
- 问题："如果我执行X，Y会发生什么？"
- 例子："如果我们降价10%，销量会怎样？"
- 操作：干预，do演算，P(Y|do(X))

**第三层：反事实（想象）**
- 问题："如果X不同，Y会是什么？"
- 例子："如果我们当时提供了折扣，这个客户还会流失吗？"
- 操作：反事实推理，结构方程

```python
# 演示因果阶梯的不同层次
class CausalLadderDemo:
    """演示因果推理的三个层次"""

    def __init__(self, seed=42):
        np.random.seed(seed)

    def generate_data(self, n=1000):
        """
        生成数据，其中：
        - U是未观察到的混杂因素
        - X是处理（受U影响）
        - Y是结果（受X和U影响）
        """
        # 未观察到的混杂因素（例如，客户的固有兴趣）
        U = np.random.normal(0, 1, n)

        # 处理决策（受混杂因素影响）
        # U值较高的人更可能接受处理
        prob_treatment = 1 / (1 + np.exp(-(0.5 + 0.8 * U)))
        X = np.random.binomial(1, prob_treatment)

        # 结果取决于处理和混杂因素
        # X对Y的真实因果效应是2.0
        Y = 1 + 2.0 * X + 1.5 * U + np.random.normal(0, 0.5, n)

        return pd.DataFrame({'X': X, 'Y': Y, 'U': U})

    def level1_association(self, data):
        """第一层：P(Y|X)是什么？"""
        treated = data[data['X'] == 1]['Y'].mean()
        untreated = data[data['X'] == 0]['Y'].mean()

        # 这是观察到的关联，不是因果效应
        naive_effect = treated - untreated

        return {
            'E[Y|X=1]': treated,
            'E[Y|X=0]': untreated,
            '朴素效应（有偏）': naive_effect,
            '注意': '这被U混杂了！'
        }

    def level2_intervention(self, data):
        """
        第二层：P(Y|do(X))是什么？
        因为我们知道U，所以可以进行调整
        """
        from sklearn.linear_model import LinearRegression

        # 正确方法：调整混杂因素
        model = LinearRegression()
        model.fit(data[['X', 'U']], data['Y'])

        causal_effect = model.coef_[0]  # X的系数

        return {
            'E[Y|do(X=1)] - E[Y|do(X=0)]': causal_effect,
            '真实因果效应': 2.0,
            '方法': '调整混杂因素U'
        }

    def level3_counterfactual(self, data, individual_idx=0):
        """
        第三层：对于接受处理的个体i，
        如果没有接受处理，Y会是多少？
        """
        individual = data.iloc[individual_idx]

        # 事实：实际发生的
        Y_factual = individual['Y']
        X_factual = individual['X']
        U_i = individual['U']

        # 反事实：会发生什么
        # 使用结构方程：Y = 1 + 2*X + 1.5*U + 噪声
        # 我们需要估计这个个体的噪声
        noise_i = Y_factual - (1 + 2 * X_factual + 1.5 * U_i)

        # 相反处理下的反事实结果
        X_counterfactual = 1 - X_factual
        Y_counterfactual = 1 + 2 * X_counterfactual + 1.5 * U_i + noise_i

        return {
            '个体': individual_idx,
            '事实 (X, Y)': (X_factual, Y_factual),
            '反事实 Y': Y_counterfactual,
            '个体处理效应': Y_counterfactual - Y_factual if X_factual == 0 else Y_factual - Y_counterfactual
        }

# 演示
demo = CausalLadderDemo()
data = demo.generate_data()

print("=== 第一层：关联（观察）===")
level1 = demo.level1_association(data)
for k, v in level1.items():
    print(f"  {k}: {v}")

print("\n=== 第二层：干预（行动）===")
level2 = demo.level2_intervention(data)
for k, v in level2.items():
    print(f"  {k}: {v}")

print("\n=== 第三层：反事实（想象）===")
level3 = demo.level3_counterfactual(data, individual_idx=0)
for k, v in level3.items():
    print(f"  {k}: {v}")
```

---

## 因果图与有向无环图

因果图，特别是有向无环图（DAG），为表示变量之间的因果关系提供了可视化和数学框架。

### 因果图的组成部分

- **节点**：表示变量
- **有向边**：表示直接因果关系（A -> B 表示 A 直接导致 B）
- **无环**：没有循环（你不能沿着箭头返回起始节点）

### DAG中的关键结构

```python
import networkx as nx
import matplotlib.pyplot as plt

def draw_dag(edges, title, pos=None):
    """绘制给定边的DAG"""
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

# 链（中介）：X -> M -> Y
chain_edges = [('X', 'M'), ('M', 'Y')]
draw_dag(chain_edges, '链（中介）：X -> M -> Y',
         pos={'X': (0, 0), 'M': (1, 0), 'Y': (2, 0)})
plt.show()

# 叉（共同原因）：X <- Z -> Y
fork_edges = [('Z', 'X'), ('Z', 'Y')]
draw_dag(fork_edges, '叉（共同原因）：X <- Z -> Y',
         pos={'Z': (1, 1), 'X': (0, 0), 'Y': (2, 0)})
plt.show()

# 对撞（碰撞器）：X -> Z <- Y
collider_edges = [('X', 'Z'), ('Y', 'Z')]
draw_dag(collider_edges, '对撞：X -> Z <- Y',
         pos={'X': (0, 1), 'Y': (2, 1), 'Z': (1, 0)})
plt.show()
```

### 理解d-分离

d-分离是确定DAG中条件独立性的准则：

```python
class DAGAnalyzer:
    """分析DAG中的因果关系"""

    def __init__(self, edges):
        self.G = nx.DiGraph()
        self.G.add_edges_from(edges)

    def get_parents(self, node):
        """获取父节点"""
        return list(self.G.predecessors(node))

    def get_children(self, node):
        """获取子节点"""
        return list(self.G.successors(node))

    def get_ancestors(self, node):
        """获取所有祖先节点"""
        return list(nx.ancestors(self.G, node))

    def get_descendants(self, node):
        """获取所有后代节点"""
        return list(nx.descendants(self.G, node))

    def find_paths(self, source, target):
        """找到源和目标之间的所有路径（忽略方向）"""
        undirected = self.G.to_undirected()
        return list(nx.all_simple_paths(undirected, source, target))

    def is_collider(self, node, path):
        """检查节点是否是路径上的对撞节点"""
        if node not in path:
            return False
        idx = path.index(node)
        if idx == 0 or idx == len(path) - 1:
            return False

        prev_node = path[idx - 1]
        next_node = path[idx + 1]

        # 对撞：两个相邻节点都指向这个节点
        return (self.G.has_edge(prev_node, node) and
                self.G.has_edge(next_node, node))

    def is_path_blocked(self, path, conditioning_set):
        """
        检查路径是否被条件集阻断。

        路径被阻断的情况：
        1. 链或叉中的中间节点在条件集中
        2. 对撞节点及其后代都不在条件集中
        """
        for i, node in enumerate(path[1:-1], 1):
            prev_node = path[i - 1]
            next_node = path[i + 1]

            # 检查是否是对撞节点
            is_collider = (self.G.has_edge(prev_node, node) and
                          self.G.has_edge(next_node, node))

            if is_collider:
                # 对撞：除非对撞节点或其后代被条件化，否则路径被阻断
                descendants = self.get_descendants(node)
                if node not in conditioning_set and not any(d in conditioning_set for d in descendants):
                    return True
            else:
                # 链或叉：如果中间节点被条件化，路径被阻断
                if node in conditioning_set:
                    return True

        return False

    def d_separated(self, X, Y, Z):
        """
        检查给定Z时，X和Y是否d-分离。

        如果X和Y之间的所有路径都被Z阻断，则X和Y是d-分离的。
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

# 示例：分析医疗处理DAG
# Z = 社会经济地位，X = 处理，M = 生活方式，Y = 健康结果
edges = [
    ('Z', 'X'),      # 社会经济地位影响处理获取
    ('Z', 'M'),      # 社会经济地位影响生活方式
    ('X', 'M'),      # 处理影响生活方式
    ('M', 'Y'),      # 生活方式影响健康
    ('X', 'Y'),      # 处理直接影响健康
]

analyzer = DAGAnalyzer(edges)

print("医疗处理示例的DAG分析")
print("=" * 50)
print("\n结构：")
print("  Z (社会经济地位) -> X (处理)")
print("  Z (社会经济地位) -> M (生活方式)")
print("  X (处理) -> M (生活方式)")
print("  M (生活方式) -> Y (健康)")
print("  X (处理) -> Y (健康)")

print("\n\nd-分离测试：")
print(f"  X _||_ Y | {{}} : {analyzer.d_separated('X', 'Y', set())}")
print(f"  X _||_ Y | {{Z}} : {analyzer.d_separated('X', 'Y', {'Z'})}")
print(f"  X _||_ Y | {{M}} : {analyzer.d_separated('X', 'Y', {'M'})}")
print(f"  X _||_ Y | {{Z, M}} : {analyzer.d_separated('X', 'Y', {'Z', 'M'})}")

print("\n\n从X到Y的路径：")
for path in analyzer.find_paths('X', 'Y'):
    print(f"  {' -> '.join(path)}")
```

### 从领域知识构建因果图

```python
def create_causal_model_from_description():
    """
    示例：为客户流失分析构建因果图

    基于领域知识：
    - 客户满意度影响流失
    - 产品使用影响满意度
    - 客户支持互动影响满意度
    - 价格敏感度（未观察到）影响使用和流失
    - 合同类型直接影响流失
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

    # 创建可视化
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

    # 为观察到的和未观察到的变量着色
    node_colors = ['lightblue' if node != 'price_sensitivity' else 'lightcoral'
                   for node in G.nodes()]

    nx.draw(G, pos, with_labels=True, node_color=node_colors,
            node_size=3000, font_size=10, font_weight='bold',
            arrows=True, arrowsize=20, edge_color='gray')

    plt.title('客户流失分析的因果图\n（红色 = 未观察到的混杂因素）')
    plt.tight_layout()
    plt.show()

    return G

churn_dag = create_causal_model_from_description()
```

---

## Do演算与干预

Do演算由朱迪亚·珀尔开发，提供了使用观察数据推理干预的形式化框架。

### Do算子

Do算子区分了：
- **P(Y | X = x)**：在*观察到* X = x 的情况下 Y 的概率
- **P(Y | do(X = x))**：在*设定* X = x 的情况下 Y 的概率

```python
import numpy as np
import pandas as pd
from scipy import stats

class DoCalculusDemo:
    """演示观察和干预的区别"""

    def __init__(self, seed=42):
        np.random.seed(seed)

    def generate_confounded_data(self, n=5000):
        """
        生成有混杂的数据：
        Z -> X, Z -> Y, X -> Y

        其中：
        - Z 是混杂因素（例如，年龄）
        - X 是处理（例如，锻炼）
        - Y 是结果（例如，健康评分）
        """
        # 混杂因素
        Z = np.random.normal(50, 10, n)  # 年龄

        # 处理取决于混杂因素
        # 年轻人更多锻炼
        prob_exercise = 1 / (1 + np.exp((Z - 50) / 10))
        X = np.random.binomial(1, prob_exercise)

        # 结果取决于处理和混杂因素
        # 锻炼的真实因果效应：+10健康分
        # 年龄对健康有负面影响
        Y = 80 + 10 * X - 0.5 * Z + np.random.normal(0, 5, n)

        return pd.DataFrame({'Z': Z, 'X': X, 'Y': Y})

    def observe(self, data):
        """P(Y | X) - 观察条件化"""
        treated = data[data['X'] == 1]['Y'].mean()
        untreated = data[data['X'] == 0]['Y'].mean()
        return treated - untreated

    def do_by_adjustment(self, data):
        """
        使用后门调整计算P(Y | do(X))：
        P(Y | do(X)) = sum_z P(Y | X, Z) * P(Z)
        """
        # 按Z分层（为简单起见进行离散化）
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
        使用回归调整计算P(Y | do(X))
        """
        from sklearn.linear_model import LinearRegression

        model = LinearRegression()
        model.fit(data[['X', 'Z']], data['Y'])

        return model.coef_[0]  # X的系数

    def simulate_intervention(self, n=5000):
        """
        模拟随机实验（实际干预）
        这给出了真正的P(Y | do(X))
        """
        np.random.seed(42)

        # 混杂因素
        Z = np.random.normal(50, 10, n)

        # 随机分配（干预！）
        X = np.random.binomial(1, 0.5, n)  # 50/50随机

        # 相同的结果模型
        Y = 80 + 10 * X - 0.5 * Z + np.random.normal(0, 5, n)

        data = pd.DataFrame({'Z': Z, 'X': X, 'Y': Y})

        # 有了随机分配，简单差异就可以了
        treated = data[data['X'] == 1]['Y'].mean()
        untreated = data[data['X'] == 0]['Y'].mean()

        return treated - untreated

# 演示
demo = DoCalculusDemo()
obs_data = demo.generate_confounded_data()

print("=== Do演算演示 ===\n")
print(f"真实因果效应: 10.0\n")

print("观察数据（有混杂）：")
print(f"  P(Y|X=1) - P(Y|X=0) = {demo.observe(obs_data):.2f}")
print("  （由于混杂而有偏！）\n")

print("从观察数据估计P(Y|do(X))：")
print(f"  后门调整: {demo.do_by_adjustment(obs_data):.2f}")
print(f"  回归调整: {demo.do_by_regression(obs_data):.2f}\n")

print("随机实验（黄金标准）：")
print(f"  随机对照试验估计: {demo.simulate_intervention():.2f}")
```

### Do演算的三条规则

珀尔的do演算包含三条规则，允许对干预分布进行变换：

```python
def explain_do_calculus_rules():
    """
    解释do演算的三条规则
    """

    rules = """
    === Do演算的三条规则 ===

    给定因果DAG G，设X, Y, Z, W为不相交的变量集。

    规则1（观察的插入/删除）：
    -------------------------------------------------
    P(Y | do(X), Z, W) = P(Y | do(X), W)

    条件：Y在图G_X-bar中与Z给定X和W是d-分离的
        （其中G_X-bar是移除X的入边后的G）

    直觉：当我们对X进行干预时，如果Z不能提供关于Y的
    额外信息，我们可以忽略Z。


    规则2（行动/观察交换）：
    -------------------------------------------------
    P(Y | do(X), do(Z), W) = P(Y | do(X), Z, W)

    条件：Y在图G_X-bar,Z-bar中与Z给定X和W是d-分离的
        （其中我们也移除了Z的入边）

    直觉：当Z对Y没有混杂效应时，对Z进行干预与
    观察Z是一样的。


    规则3（行动的插入/删除）：
    -------------------------------------------------
    P(Y | do(X), do(Z), W) = P(Y | do(X), W)

    条件：Y在图G_X-bar,Z(W)-bar中与Z给定X和W是d-分离的
        （其中Z(W)是不是任何W节点祖先的Z节点）

    直觉：如果Z对Y没有因果效应，我们可以移除do(Z)。


    这些规则，连同标准概率规则，对于从观察数据中
    推导所有可识别的因果效应是完备的。
    """

    print(rules)

explain_do_calculus_rules()
```

### 后门准则

后门准则提供了识别充分调整集的实用测试：

```python
def backdoor_criterion_example():
    """
    演示用于识别因果效应的后门准则
    """

    print("=== 后门准则 ===\n")

    print("给定处理X和结果Y，集合Z满足后门准则的条件是：")
    print("  1. Z中没有节点是X的后代")
    print("  2. Z阻断所有从X到Y的后门路径")
    print("     （带有箭头指向X的路径）\n")

    # 示例DAG
    edges = [
        ('Z1', 'X'),
        ('Z1', 'Z2'),
        ('Z2', 'Y'),
        ('X', 'M'),
        ('M', 'Y'),
        ('Z1', 'Y')
    ]

    print("示例DAG：")
    print("  Z1 -> X")
    print("  Z1 -> Z2 -> Y")
    print("  Z1 -> Y")
    print("  X -> M -> Y\n")

    print("估计X对Y的效应：")
    print("  - 后门路径: X <- Z1 -> Y, X <- Z1 -> Z2 -> Y")
    print("  - 有效调整集: {Z1}, {Z1, Z2}")
    print("  - 无效: {M}（X的后代）")
    print("  - 无效: 仅{Z2}（不能阻断 X <- Z1 -> Y）\n")

    # 数值演示
    np.random.seed(42)
    n = 5000

    # 生成数据
    Z1 = np.random.normal(0, 1, n)
    Z2 = 0.5 * Z1 + np.random.normal(0, 0.5, n)
    X = 0.7 * Z1 + np.random.binomial(1, 0.5, n)  # X也有随机成分
    M = 0.8 * X + np.random.normal(0, 0.5, n)
    Y = 0.5 * M + 0.3 * Z1 + 0.4 * Z2 + np.random.normal(0, 0.5, n)

    data = pd.DataFrame({'Z1': Z1, 'Z2': Z2, 'X': X, 'M': M, 'Y': Y})

    # X对Y的真实因果效应（通过M）
    # X -> M 系数0.8，M -> Y 系数0.5
    true_effect = 0.8 * 0.5
    print(f"X对Y的真实因果效应: {true_effect:.3f}\n")

    from sklearn.linear_model import LinearRegression

    # 朴素回归
    model_naive = LinearRegression().fit(data[['X']], data['Y'])
    print(f"朴素（无调整）: {model_naive.coef_[0]:.3f}（有偏）")

    # 调整Z1（有效）
    model_z1 = LinearRegression().fit(data[['X', 'Z1']], data['Y'])
    print(f"调整Z1: {model_z1.coef_[0]:.3f}（接近真实值）")

    # 调整Z1和Z2（有效）
    model_z1z2 = LinearRegression().fit(data[['X', 'Z1', 'Z2']], data['Y'])
    print(f"调整Z1, Z2: {model_z1z2.coef_[0]:.3f}（接近真实值）")

    # 调整M（无效 - 中介！）
    model_m = LinearRegression().fit(data[['X', 'M']], data['Y'])
    print(f"调整M（中介）: {model_m.coef_[0]:.3f}（有偏 - 阻断了效应！）")

backdoor_criterion_example()
```

---

## 混杂变量

混杂因素是同时影响处理和结果的变量，会产生虚假关联，从而误导因果结论。

### 混杂的类型

```python
def demonstrate_confounding_types():
    """
    演示不同类型的混杂及其影响
    """

    np.random.seed(42)
    n = 2000

    results = {}

    # 1. 经典混杂：Z -> X, Z -> Y
    print("=== 类型1：经典混杂 ===")
    print("结构: Z -> X, Z -> Y, X -> Y")

    Z = np.random.normal(0, 1, n)
    X = 0.7 * Z + np.random.normal(0, 0.5, n)
    Y = 2 * X + 1.5 * Z + np.random.normal(0, 0.5, n)  # X的真实效应是2

    # 朴素估计
    from sklearn.linear_model import LinearRegression
    naive = LinearRegression().fit(X.reshape(-1, 1), Y)
    adjusted = LinearRegression().fit(np.column_stack([X, Z]), Y)

    print(f"  真实效应: 2.0")
    print(f"  朴素估计: {naive.coef_[0]:.3f}（有混杂）")
    print(f"  调整后估计: {adjusted.coef_[0]:.3f}")

    # 2. 对撞偏差（对共同效应进行条件化）
    print("\n=== 类型2：对撞偏差 ===")
    print("结构: X -> C <- Y（C是对撞节点）")
    print("问题：对C进行条件化会产生虚假关联")

    X = np.random.normal(0, 1, n)
    Y = np.random.normal(0, 1, n)  # X和Y是独立的！
    C = X + Y + np.random.normal(0, 0.5, n)  # 对撞节点

    # 无条件化
    corr_unconditional, _ = stats.pearsonr(X, Y)
    print(f"  X-Y相关性（无条件）: {corr_unconditional:.3f}")

    # 对C进行条件化（例如，选择C > 0）
    mask = C > 0
    corr_conditional, _ = stats.pearsonr(X[mask], Y[mask])
    print(f"  X-Y相关性（给定C > 0）: {corr_conditional:.3f}（虚假！）")

    # 3. 选择偏差
    print("\n=== 类型3：选择偏差 ===")
    print("结构: 分析限制在子群体中")

    # 全体人群
    talent = np.random.normal(0, 1, n)
    luck = np.random.normal(0, 1, n)
    success = talent + luck

    # 选择：只观察成功的人
    threshold = np.percentile(success, 70)
    selected = success > threshold

    # 在全体人群中，天赋和运气是独立的
    corr_full, _ = stats.pearsonr(talent, luck)
    print(f"  天赋-运气相关性（全体）: {corr_full:.3f}")

    # 在选中的样本中，它们表现为负相关
    corr_selected, _ = stats.pearsonr(talent[selected], luck[selected])
    print(f"  天赋-运气相关性（仅成功者）: {corr_selected:.3f}")
    print("  （选择产生了有天赋的人运气不好的假象！）")

demonstrate_confounding_types()
```

### 识别混杂因素

```python
class ConfounderIdentification:
    """识别潜在混杂因素的方法"""

    @staticmethod
    def check_confounder_criteria(data, treatment, outcome, potential_confounder):
        """
        检查变量是否符合混杂因素的标准：
        1. 与处理相关
        2. 与结果相关（条件于处理）
        3. 不在处理和结果之间的因果路径上
        """
        from scipy import stats

        # 检查与处理的关联
        if data[treatment].dtype in ['int64', 'float64']:
            corr_treatment, p_treatment = stats.pearsonr(
                data[potential_confounder], data[treatment]
            )
        else:
            # 对于分类处理
            groups = data.groupby(treatment)[potential_confounder].mean()
            corr_treatment = groups.std()  # 简化检查
            p_treatment = 0.01  # 占位符

        # 检查与结果的关联（控制处理）
        from sklearn.linear_model import LinearRegression
        model = LinearRegression()
        model.fit(data[[treatment, potential_confounder]], data[outcome])
        coef_confounder = model.coef_[1]

        result = {
            '变量': potential_confounder,
            '与处理相关': abs(corr_treatment) > 0.1,
            '与结果相关': abs(coef_confounder) > 0.1,
            '处理相关性': corr_treatment,
            '结果系数': coef_confounder,
            '是潜在混杂因素': abs(corr_treatment) > 0.1 and abs(coef_confounder) > 0.1
        }

        return result

    @staticmethod
    def sensitivity_analysis(data, treatment, outcome, confounders,
                           unmeasured_confounder_strength):
        """
        评估因果估计对未测量混杂的敏感性

        参数：
        - unmeasured_confounder_strength: 假设的与处理和结果的R^2
        """
        from sklearn.linear_model import LinearRegression

        # 获取调整后的估计
        model = LinearRegression()
        X_cols = [treatment] + confounders
        model.fit(data[X_cols], data[outcome])
        adjusted_effect = model.coef_[0]

        # 计算残差方差
        residuals = data[outcome] - model.predict(data[X_cols])
        residual_var = np.var(residuals)

        # 未测量混杂因素的潜在偏差
        # 简化的遗漏变量偏差公式
        potential_bias = np.sqrt(unmeasured_confounder_strength) * np.std(data[outcome])

        return {
            '调整后效应': adjusted_effect,
            '潜在偏差范围': (-potential_bias, potential_bias),
            '正向混杂时的效应': adjusted_effect - potential_bias,
            '负向混杂时的效应': adjusted_effect + potential_bias,
            '对混杂稳健': adjusted_effect - potential_bias > 0 or adjusted_effect + potential_bias < 0
        }

# 示例用法
np.random.seed(42)
n = 1000

# 生成有测量和未测量混杂因素的数据
age = np.random.normal(45, 10, n)
income = 30000 + 500 * age + np.random.normal(0, 10000, n)
health_consciousness = np.random.normal(0, 1, n)  # 未测量

# 处理（锻炼）取决于混杂因素
exercise = (0.02 * (age - 45) + 0.3 * health_consciousness +
            np.random.normal(0, 1, n)) > 0
exercise = exercise.astype(int)

# 结果（健康）取决于处理和混杂因素
health = (70 + 5 * exercise - 0.3 * age + 0.0001 * income +
          3 * health_consciousness + np.random.normal(0, 5, n))

data = pd.DataFrame({
    'age': age,
    'income': income,
    'exercise': exercise,
    'health': health
})

# 检查年龄作为混杂因素
ci = ConfounderIdentification()
result = ci.check_confounder_criteria(data, 'exercise', 'health', 'age')
print("'age'的混杂因素检查：")
for k, v in result.items():
    print(f"  {k}: {v}")

# 敏感性分析
print("\n\n敏感性分析：")
sensitivity = ci.sensitivity_analysis(
    data, 'exercise', 'health', ['age', 'income'],
    unmeasured_confounder_strength=0.1
)
for k, v in sensitivity.items():
    print(f"  {k}: {v}")
```

---

## 倾向得分匹配

倾向得分匹配（PSM）是一种通过匹配具有相似倾向得分（接受处理的概率）的处理组和对照组单位来估计因果效应的技术。

### 理论与实现

```python
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

class PropensityScoreMatching:
    """
    用于因果推断的倾向得分匹配
    """

    def __init__(self, caliper=0.2):
        """
        初始化PSM

        参数：
        - caliper: 匹配时允许的倾向得分最大差异
        """
        self.caliper = caliper
        self.propensity_model = None
        self.scaler = StandardScaler()

    def estimate_propensity_scores(self, X, treatment):
        """
        使用逻辑回归估计倾向得分

        参数：
        - X: 协变量
        - treatment: 二元处理指标

        返回：
        - 倾向得分
        """
        X_scaled = self.scaler.fit_transform(X)
        self.propensity_model = LogisticRegression(max_iter=1000)
        self.propensity_model.fit(X_scaled, treatment)

        propensity_scores = self.propensity_model.predict_proba(X_scaled)[:, 1]
        return propensity_scores

    def match(self, propensity_scores, treatment, replacement=False):
        """
        基于倾向得分执行最近邻匹配

        参数：
        - propensity_scores: 估计的倾向得分
        - treatment: 二元处理指标
        - replacement: 是否允许有放回匹配

        返回：
        - matched_pairs: (treated_idx, control_idx)元组列表
        """
        treated_idx = np.where(treatment == 1)[0]
        control_idx = np.where(treatment == 0)[0]

        # 为sklearn重塑
        treated_ps = propensity_scores[treated_idx].reshape(-1, 1)
        control_ps = propensity_scores[control_idx].reshape(-1, 1)

        # 找到最近邻
        nn = NearestNeighbors(n_neighbors=1, algorithm='ball_tree')
        nn.fit(control_ps)

        distances, indices = nn.kneighbors(treated_ps)

        matched_pairs = []
        used_controls = set()

        for i, (dist, idx) in enumerate(zip(distances.flatten(), indices.flatten())):
            # 检查caliper
            ps_diff = abs(propensity_scores[treated_idx[i]] -
                         propensity_scores[control_idx[idx]])

            if ps_diff <= self.caliper:
                if replacement or control_idx[idx] not in used_controls:
                    matched_pairs.append((treated_idx[i], control_idx[idx]))
                    used_controls.add(control_idx[idx])

        return matched_pairs

    def estimate_ate(self, outcome, matched_pairs):
        """
        从匹配对中估计平均处理效应

        参数：
        - outcome: 结果变量
        - matched_pairs: (treated_idx, control_idx)元组列表

        返回：
        - ATE估计和标准误
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
        评估匹配前后的协变量平衡

        返回每个协变量的标准化均值差异
        """
        if feature_names is None:
            feature_names = [f'X{i}' for i in range(X.shape[1])]

        results = []

        for j, name in enumerate(feature_names):
            # 匹配前
            treated_mean_before = X[treatment == 1, j].mean()
            control_mean_before = X[treatment == 0, j].mean()
            pooled_std = np.sqrt(
                (X[treatment == 1, j].var() + X[treatment == 0, j].var()) / 2
            )
            smd_before = (treated_mean_before - control_mean_before) / pooled_std

            # 匹配后
            treated_idx = [t for t, c in matched_pairs]
            control_idx = [c for t, c in matched_pairs]

            treated_mean_after = X[treated_idx, j].mean()
            control_mean_after = X[control_idx, j].mean()
            smd_after = (treated_mean_after - control_mean_after) / pooled_std

            results.append({
                '协变量': name,
                'SMD_匹配前': smd_before,
                'SMD_匹配后': smd_after,
                '改善': abs(smd_before) - abs(smd_after)
            })

        return pd.DataFrame(results)

# 示例：工作培训对收入的影响
np.random.seed(42)
n = 2000

# 混杂因素
age = np.random.normal(35, 10, n)
education = np.random.normal(12, 3, n)
prior_earnings = 20000 + 1000 * education + np.random.normal(0, 5000, n)

# 处理（工作培训）- 取决于混杂因素
prob_training = 1 / (1 + np.exp(-(0.1 * (education - 12) - 0.05 * (age - 35))))
treatment = np.random.binomial(1, prob_training)

# 结果（培训后收入）
# 真实处理效应：$3000
earnings = (prior_earnings + 3000 * treatment +
            500 * education - 100 * age +
            np.random.normal(0, 3000, n))

X = np.column_stack([age, education, prior_earnings])
feature_names = ['年龄', '教育年限', '之前收入']

# 应用PSM
psm = PropensityScoreMatching(caliper=0.1)

# 估计倾向得分
propensity_scores = psm.estimate_propensity_scores(X, treatment)

# 执行匹配
matched_pairs = psm.match(propensity_scores, treatment)

# 估计ATE
ate_result = psm.estimate_ate(earnings, matched_pairs)

print("=== 倾向得分匹配结果 ===\n")
print(f"真实处理效应: $3,000\n")

# 朴素估计
naive_effect = earnings[treatment == 1].mean() - earnings[treatment == 0].mean()
print(f"朴素估计: ${naive_effect:.0f}")

print(f"\nPSM估计:")
print(f"  ATE: ${ate_result['ATE']:.0f}")
print(f"  95% CI: [${ate_result['CI_lower']:.0f}, ${ate_result['CI_upper']:.0f}]")
print(f"  匹配对数: {ate_result['n_matched']}")

# 检查平衡
balance = psm.assess_balance(X, treatment, matched_pairs, feature_names)
print(f"\n协变量平衡:")
print(balance.to_string(index=False))
```

### 倾向得分加权

```python
class InversePropensityWeighting:
    """
    用于因果推断的逆倾向得分加权

    比匹配更有效，因为它使用所有观测值
    """

    def __init__(self, trim_threshold=0.01):
        """
        参数：
        - trim_threshold: 移除极端倾向得分的观测值
        """
        self.trim_threshold = trim_threshold

    def estimate_ate_ipw(self, outcome, treatment, propensity_scores):
        """
        使用逆倾向加权估计ATE

        IPW估计量：
        ATE = E[Y * T / e(X)] - E[Y * (1-T) / (1-e(X))]
        """
        # 修剪极端倾向得分
        mask = ((propensity_scores > self.trim_threshold) &
                (propensity_scores < 1 - self.trim_threshold))

        y = outcome[mask]
        t = treatment[mask]
        ps = propensity_scores[mask]

        # IPW估计量
        treated_term = np.sum(y * t / ps) / np.sum(t / ps)
        control_term = np.sum(y * (1 - t) / (1 - ps)) / np.sum((1 - t) / (1 - ps))

        ate = treated_term - control_term

        # Bootstrap标准误
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
        估计处理组平均处理效应（ATT）

        ATT = E[Y(1) - Y(0) | T=1]
        """
        mask = ((propensity_scores > self.trim_threshold) &
                (propensity_scores < 1 - self.trim_threshold))

        y = outcome[mask]
        t = treatment[mask]
        ps = propensity_scores[mask]

        # ATT估计量
        treated_mean = np.mean(y[t == 1])

        # 加权对照组均值（按ps/(1-ps)加权以匹配处理组分布）
        weights = ps[t == 0] / (1 - ps[t == 0])
        control_mean_weighted = np.average(y[t == 0], weights=weights)

        att = treated_mean - control_mean_weighted

        return {'ATT': att}

# 使用之前的数据
ipw = InversePropensityWeighting()
ipw_result = ipw.estimate_ate_ipw(earnings, treatment, propensity_scores)

print("\n=== 逆倾向加权结果 ===\n")
print(f"IPW估计:")
print(f"  ATE: ${ipw_result['ATE']:.0f}")
print(f"  95% CI: [${ipw_result['CI_lower']:.0f}, ${ipw_result['CI_upper']:.0f}]")
```

---

## 双重差分法

双重差分法（DiD）是一种准实验设计，通过比较处理组和对照组随时间的变化来估计因果效应。

### DiD估计量

```python
class DifferenceInDifferences:
    """
    用于因果推断的双重差分估计量
    """

    def __init__(self):
        pass

    def estimate_did(self, data, outcome_col, treatment_col, time_col,
                     pre_period, post_period):
        """
        估计DiD处理效应

        参数：
        - data: 面板数据DataFrame
        - outcome_col: 结果变量名
        - treatment_col: 处理指标名（0/1）
        - time_col: 时间变量名
        - pre_period: 处理前时期的值
        - post_period: 处理后时期的值

        返回：
        - DiD估计和组成部分
        """
        # 四组均值
        treated_pre = data[(data[treatment_col] == 1) &
                          (data[time_col] == pre_period)][outcome_col].mean()
        treated_post = data[(data[treatment_col] == 1) &
                           (data[time_col] == post_period)][outcome_col].mean()
        control_pre = data[(data[treatment_col] == 0) &
                          (data[time_col] == pre_period)][outcome_col].mean()
        control_post = data[(data[treatment_col] == 0) &
                           (data[time_col] == post_period)][outcome_col].mean()

        # DiD估计
        did = (treated_post - treated_pre) - (control_post - control_pre)

        return {
            'DID估计': did,
            '处理组_前': treated_pre,
            '处理组_后': treated_post,
            '对照组_前': control_pre,
            '对照组_后': control_post,
            '处理组变化': treated_post - treated_pre,
            '对照组变化': control_post - control_pre
        }

    def estimate_did_regression(self, data, outcome_col, treatment_col,
                                time_col, covariates=None):
        """
        使用回归估计DiD：
        Y = beta_0 + beta_1*Treatment + beta_2*Post + beta_3*Treatment*Post + e

        beta_3是DiD估计
        """
        import statsmodels.api as sm

        # 创建交互项
        data = data.copy()
        data['post'] = (data[time_col] == data[time_col].max()).astype(int)
        data['did_interaction'] = data[treatment_col] * data['post']

        # 构建回归
        X_cols = [treatment_col, 'post', 'did_interaction']
        if covariates:
            X_cols.extend(covariates)

        X = sm.add_constant(data[X_cols])
        y = data[outcome_col]

        model = sm.OLS(y, X).fit()

        return {
            'DID估计': model.params['did_interaction'],
            'SE': model.bse['did_interaction'],
            'p值': model.pvalues['did_interaction'],
            'CI_lower': model.conf_int().loc['did_interaction', 0],
            'CI_upper': model.conf_int().loc['did_interaction', 1],
            '模型摘要': model.summary()
        }

    def parallel_trends_test(self, data, outcome_col, treatment_col,
                            time_col, pre_periods):
        """
        使用处理前数据测试平行趋势假设

        DiD的关键假设是，在没有处理的情况下，
        处理组和对照组会遵循平行趋势。
        """
        pre_data = data[data[time_col].isin(pre_periods)].copy()

        # 带时间趋势的回归
        import statsmodels.api as sm

        # 创建时间虚拟变量和交互项
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

        # 测试交互系数是否联合为零
        interaction_cols = [c for c in X.columns if c.startswith('treat_t')]

        if len(interaction_cols) > 0:
            # 联合显著性的F检验
            r_matrix = np.zeros((len(interaction_cols), len(X.columns)))
            for i, col in enumerate(interaction_cols):
                r_matrix[i, list(X.columns).index(col)] = 1

            f_test = model.f_test(r_matrix)

            return {
                'F统计量': f_test.fvalue[0][0],
                'p值': f_test.pvalue,
                '平行趋势成立': f_test.pvalue > 0.05,
                '交互系数': {col: model.params[col]
                                            for col in interaction_cols}
            }

        return {'消息': '处理前时期不足以进行检验'}

# 示例：最低工资上涨对就业的影响
np.random.seed(42)

# 生成面板数据
n_units = 200  # 餐厅
n_periods = 6  # 时间段

unit_ids = np.repeat(range(n_units), n_periods)
time_periods = np.tile(range(n_periods), n_units)

# 处理：第3期最低工资上涨
treatment_group = np.repeat(np.random.binomial(1, 0.5, n_units), n_periods)
post_treatment = (time_periods >= 3).astype(int)

# 生成结果（就业）
# 单位固定效应
unit_fe = np.repeat(np.random.normal(100, 20, n_units), n_periods)
# 时间趋势（两组共同）
time_trend = 2 * time_periods

# 真实处理效应：最低工资上涨后减少5名员工
treatment_effect = -5 * treatment_group * post_treatment

# 添加噪声
noise = np.random.normal(0, 5, n_units * n_periods)

employment = unit_fe + time_trend + treatment_effect + noise

panel_data = pd.DataFrame({
    'unit_id': unit_ids,
    'time': time_periods,
    'treatment': treatment_group,
    'employment': employment
})

# 估计DiD
did = DifferenceInDifferences()

# 简单DiD
simple_result = did.estimate_did(
    panel_data, 'employment', 'treatment', 'time',
    pre_period=2, post_period=3
)

print("=== 双重差分结果 ===\n")
print(f"真实处理效应: -5\n")
print("简单DiD:")
for k, v in simple_result.items():
    print(f"  {k}: {v:.3f}" if isinstance(v, float) else f"  {k}: {v}")

# 回归DiD
print("\n回归DiD:")
reg_result = did.estimate_did_regression(
    panel_data, 'employment', 'treatment', 'time'
)
print(f"  DID估计: {reg_result['DID估计']:.3f}")
print(f"  SE: {reg_result['SE']:.3f}")
print(f"  95% CI: [{reg_result['CI_lower']:.3f}, {reg_result['CI_upper']:.3f}]")
print(f"  p值: {reg_result['p值']:.4f}")

# 测试平行趋势
print("\n平行趋势检验（处理前时期）:")
pt_result = did.parallel_trends_test(
    panel_data, 'employment', 'treatment', 'time',
    pre_periods=[0, 1, 2]
)
print(f"  F统计量: {pt_result.get('F统计量', 'N/A'):.3f}")
print(f"  p值: {pt_result.get('p值', 'N/A'):.4f}")
print(f"  平行趋势假设成立: {pt_result.get('平行趋势成立', 'N/A')}")
```

### DiD可视化

```python
def visualize_did(data, outcome_col, treatment_col, time_col, treatment_time):
    """
    创建双重差分的可视化
    """
    fig, ax = plt.subplots(figsize=(10, 6))

    # 按组和时间计算均值
    means = data.groupby([treatment_col, time_col])[outcome_col].mean().reset_index()

    treated_means = means[means[treatment_col] == 1]
    control_means = means[means[treatment_col] == 0]

    # 绘制实际趋势
    ax.plot(treated_means[time_col], treated_means[outcome_col],
            'b-o', label='处理组', linewidth=2, markersize=8)
    ax.plot(control_means[time_col], control_means[outcome_col],
            'r-s', label='对照组', linewidth=2, markersize=8)

    # 添加反事实（处理组的平行趋势）
    pre_treatment = treated_means[treated_means[time_col] < treatment_time]
    post_treatment = control_means[control_means[time_col] >= treatment_time]

    if len(pre_treatment) > 0 and len(post_treatment) > 0:
        # 基于对照组趋势计算反事实
        pre_diff = (treated_means[treated_means[time_col] < treatment_time][outcome_col].iloc[-1] -
                   control_means[control_means[time_col] < treatment_time][outcome_col].iloc[-1])

        counterfactual = control_means[outcome_col] + pre_diff
        ax.plot(control_means[time_col], counterfactual,
                'b--', alpha=0.5, label='反事实（处理组）', linewidth=2)

    # 在处理时间添加垂直线
    ax.axvline(x=treatment_time - 0.5, color='gray', linestyle='--', alpha=0.7)
    ax.text(treatment_time - 0.4, ax.get_ylim()[1], '处理',
            rotation=90, va='top', fontsize=10)

    ax.set_xlabel('时间段')
    ax.set_ylabel(outcome_col)
    ax.set_title('双重差分可视化')
    ax.legend()
    ax.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.show()

# 可视化
visualize_did(panel_data, 'employment', 'treatment', 'time', treatment_time=3)
```

---

## 工具变量

工具变量（IV）提供了一种在存在未测量混杂的情况下估计因果效应的方法，通过使用一个影响处理但只通过处理影响结果的变量。

### IV框架

```python
class InstrumentalVariables:
    """
    用于因果推断的工具变量估计量
    """

    def __init__(self):
        pass

    def two_stage_least_squares(self, data, outcome, treatment, instrument,
                                covariates=None):
        """
        两阶段最小二乘（2SLS）估计

        第一阶段：将处理对工具（和协变量）回归
        第二阶段：将结果对预测处理（和协变量）回归

        参数：
        - data: DataFrame
        - outcome: 结果变量名
        - treatment: 内生处理变量名
        - instrument: 工具变量名
        - covariates: 外生控制变量列表
        """
        import statsmodels.api as sm

        # 准备变量
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

        # 第一阶段：将处理对工具回归
        stage1 = sm.OLS(D, Z).fit()
        D_hat = stage1.predict(Z)

        # 第二阶段：将结果对预测处理回归
        X_stage2 = X.copy()
        X_stage2[treatment] = D_hat
        stage2 = sm.OLS(y, X_stage2).fit()

        # 修正标准误（2SLS标准误调整）
        # 使用linearmodels获取正确的IV标准误
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
                '处理效应': iv_model.params[treatment],
                'SE': iv_model.std_errors[treatment],
                'p值': iv_model.pvalues[treatment],
                'CI_lower': iv_model.conf_int().loc[treatment, 'lower'],
                'CI_upper': iv_model.conf_int().loc[treatment, 'upper'],
                '第一阶段F': stage1.fvalue,
                '第一阶段系数': stage1.params[instrument],
                '方法': 'linearmodels'
            }
        except ImportError:
            # 回退到手动2SLS
            return {
                '处理效应': stage2.params[treatment],
                'SE': stage2.bse[treatment],  # 注意：这些SE不正确
                'p值': stage2.pvalues[treatment],
                '第一阶段F': stage1.fvalue,
                '第一阶段系数': stage1.params[instrument],
                '方法': 'manual_2sls',
                '警告': '安装linearmodels以获取正确的标准误'
            }

    def wald_estimator(self, data, outcome, treatment, instrument):
        """
        用于二元工具的简单Wald（IV）估计量

        IV估计 = Cov(Y, Z) / Cov(D, Z)
        """
        y = data[outcome]
        D = data[treatment]
        Z = data[instrument]

        # Cov(Y, Z) / Cov(D, Z)
        cov_yz = np.cov(y, Z)[0, 1]
        cov_dz = np.cov(D, Z)[0, 1]

        iv_estimate = cov_yz / cov_dz

        # Bootstrap标准误
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
            'IV估计': iv_estimate,
            'SE': se,
            'CI_lower': iv_estimate - 1.96 * se,
            'CI_upper': iv_estimate + 1.96 * se
        }

    def test_instrument_validity(self, data, outcome, treatment, instrument,
                                 covariates=None):
        """
        测试工具有效性：
        1. 相关性：工具必须与处理相关
        2. 排他性：工具只通过处理影响结果

        我们可以测试(1)但不能直接测试(2)
        """
        import statsmodels.api as sm

        # 测试相关性（第一阶段F统计量）
        Z = data[[instrument]]
        if covariates:
            Z = pd.concat([Z, data[covariates]], axis=1)
        Z = sm.add_constant(Z)

        D = data[treatment]

        stage1 = sm.OLS(D, Z).fit()

        # 经验法则：F > 10表示强工具
        f_stat = stage1.fvalue

        # 与处理的相关性
        corr_treatment = np.corrcoef(data[instrument], data[treatment])[0, 1]

        return {
            '第一阶段F': f_stat,
            '强工具': f_stat > 10,
            '工具-处理相关性': corr_treatment,
            '工具系数': stage1.params[instrument],
            '工具p值': stage1.pvalues[instrument],
            '注意': '排他性限制无法检验，必须依赖理论'
        }

# 示例：使用到大学的距离作为工具估计教育对收入的影响
np.random.seed(42)
n = 3000

# 工具：到最近大学的距离（影响教育，不直接影响收入）
distance_to_college = np.random.exponential(20, n)

# 未测量的混杂因素（能力）
ability = np.random.normal(0, 1, n)

# 处理：受教育年限
# 取决于能力（混杂因素）和距离（工具）
education = 12 + 2 * ability - 0.05 * distance_to_college + np.random.normal(0, 2, n)
education = np.clip(education, 8, 20)

# 结果：对数收入
# 取决于教育和能力
# 教育的真实因果效应：0.1（每年增加10%）
log_earnings = 9 + 0.1 * education + 0.3 * ability + np.random.normal(0, 0.5, n)

iv_data = pd.DataFrame({
    'log_earnings': log_earnings,
    'education': education,
    'distance': distance_to_college,
    'ability': ability  # 实践中未测量
})

# IV估计
iv = InstrumentalVariables()

print("=== 工具变量估计 ===\n")
print("教育的真实因果效应: 0.10\n")

# 朴素OLS（由于能力混杂而有偏）
import statsmodels.api as sm
naive_ols = sm.OLS(iv_data['log_earnings'],
                   sm.add_constant(iv_data['education'])).fit()
print(f"朴素OLS估计: {naive_ols.params['education']:.4f}（向上有偏）")

# IV估计
iv_result = iv.two_stage_least_squares(
    iv_data, 'log_earnings', 'education', 'distance'
)
print(f"\nIV (2SLS)估计: {iv_result['处理效应']:.4f}")
print(f"  SE: {iv_result['SE']:.4f}")
print(f"  第一阶段F: {iv_result['第一阶段F']:.2f}")

# 测试工具有效性
validity = iv.test_instrument_validity(
    iv_data, 'log_earnings', 'education', 'distance'
)
print(f"\n工具有效性:")
print(f"  强工具 (F > 10): {validity['强工具']}")
print(f"  工具-处理相关性: {validity['工具-处理相关性']:.3f}")

# Wald估计量用于比较
wald = iv.wald_estimator(iv_data, 'log_earnings', 'education', 'distance')
print(f"\nWald估计量: {wald['IV估计']:.4f}")
```

---

## DoWhy库实现

DoWhy是一个Python库，为因果推断提供统一接口，实现了因果分析的最佳实践。

### 使用DoWhy进行完整因果分析

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
    print("DoWhy未安装。使用以下命令安装：pip install dowhy")

if DOWHY_AVAILABLE:

    class DoWhyCausalAnalysis:
        """
        使用DoWhy的完整因果分析工作流程
        """

        def __init__(self, data, treatment, outcome, graph=None,
                     common_causes=None, instruments=None):
            """
            初始化因果模型

            参数：
            - data: DataFrame
            - treatment: 处理变量名
            - outcome: 结果变量名
            - graph: DOT格式的因果图（可选）
            - common_causes: 混杂因素列表
            - instruments: 工具变量列表
            """
            self.data = data
            self.treatment = treatment
            self.outcome = outcome

            # 创建因果模型
            self.model = CausalModel(
                data=data,
                treatment=treatment,
                outcome=outcome,
                graph=graph,
                common_causes=common_causes,
                instruments=instruments
            )

        def view_model(self):
            """可视化因果模型"""
            self.model.view_model()

        def identify_effect(self):
            """
            第2步：识别因果效应
            使用因果图确定效应是否可识别
            """
            self.identified_estimand = self.model.identify_effect(
                proceed_when_unidentifiable=True
            )
            print(self.identified_estimand)
            return self.identified_estimand

        def estimate_effect(self, method='backdoor.propensity_score_matching'):
            """
            第3步：估计因果效应

            方法：
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
            print(f"\n因果估计 ({method}):")
            print(f"  效应: {self.estimate.value:.4f}")

            return self.estimate

        def refute_estimate(self, methods=['random_common_cause',
                                          'placebo_treatment_refuter',
                                          'data_subset_refuter']):
            """
            第4步：使用各种测试反驳估计
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
                    refutation_results[method] = f"错误: {str(e)}"

            return refutation_results

        def full_analysis(self, estimation_methods=None):
            """
            运行完整的因果分析工作流程
            """
            if estimation_methods is None:
                estimation_methods = [
                    'backdoor.linear_regression',
                    'backdoor.propensity_score_matching',
                    'backdoor.propensity_score_weighting'
                ]

            print("=" * 60)
            print("DOWHY因果分析")
            print("=" * 60)

            # 第1步：模型
            print("\n1. 因果模型")
            print("-" * 40)
            print(f"处理: {self.treatment}")
            print(f"结果: {self.outcome}")

            # 第2步：识别
            print("\n2. 识别")
            print("-" * 40)
            self.identify_effect()

            # 第3步：使用多种方法估计
            print("\n3. 估计")
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
                    estimates[method] = f"错误: {str(e)}"

            # 存储最后的估计用于反驳
            self.estimate = self.model.estimate_effect(
                self.identified_estimand,
                method_name=estimation_methods[0]
            )

            # 第4步：反驳
            print("\n4. 反驳")
            print("-" * 40)
            self.refute_estimate()

            return estimates

    # 示例：分析营销活动的效果
    np.random.seed(42)
    n = 2000

    # 生成数据
    # 混杂因素
    age = np.random.normal(35, 10, n)
    income = np.random.lognormal(10.5, 0.5, n)
    prior_purchases = np.random.poisson(5, n)

    # 处理：收到营销邮件（取决于混杂因素）
    prob_email = 1 / (1 + np.exp(-(
        0.01 * (age - 35) +
        0.00001 * (income - 40000) +
        0.1 * (prior_purchases - 5)
    )))
    email_received = np.random.binomial(1, prob_email)

    # 结果：购买金额
    # 邮件的真实因果效应：$20
    purchase = (50 +
                20 * email_received +  # 真实效应
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

    # 运行分析
    analysis = DoWhyCausalAnalysis(
        data=marketing_data,
        treatment='email_received',
        outcome='purchase',
        common_causes=['age', 'income', 'prior_purchases']
    )

    print("\n真实因果效应: $20\n")
    estimates = analysis.full_analysis()
```

### DoWhy高级功能

```python
if DOWHY_AVAILABLE:

    def dowhy_with_graph():
        """
        使用显式因果图的DoWhy分析
        """
        # 用GML格式定义因果图
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

        # 识别效应
        identified = model.identify_effect(proceed_when_unidentifiable=True)

        # 获取所有有效的调整集
        print("识别策略:")
        print(identified)

        return model

    def sensitivity_analysis_dowhy():
        """
        未测量混杂的敏感性分析
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

        # 使用不同的反驳方法进行敏感性分析

        # 1. 添加随机共同原因
        random_refute = model.refute_estimate(
            identified, estimate,
            method_name='random_common_cause',
            placebo_type='permute'
        )
        print("随机共同原因反驳:")
        print(f"  原始估计: {estimate.value:.4f}")
        print(f"  新估计: {random_refute.new_effect:.4f}")

        # 2. 数据子集反驳
        subset_refute = model.refute_estimate(
            identified, estimate,
            method_name='data_subset_refuter',
            subset_fraction=0.8
        )
        print(f"\n数据子集反驳:")
        print(f"  原始估计: {estimate.value:.4f}")
        print(f"  新估计: {subset_refute.new_effect:.4f}")

        # 3. 安慰剂处理
        placebo_refute = model.refute_estimate(
            identified, estimate,
            method_name='placebo_treatment_refuter',
            placebo_type='permute'
        )
        print(f"\n安慰剂处理反驳:")
        print(f"  原始估计: {estimate.value:.4f}")
        print(f"  安慰剂估计: {placebo_refute.new_effect:.4f}")
        print(f"  （如果效应是真实的，应该接近0）")

    # 运行高级分析
    print("\n=== DoWhy高级分析 ===\n")
    model = dowhy_with_graph()

    print("\n=== 敏感性分析 ===\n")
    sensitivity_analysis_dowhy()
```

---

## 高级主题

### 因果发现

因果发现算法试图从数据中学习因果结构：

```python
def causal_discovery_example():
    """
    因果发现算法介绍
    """

    print("=== 因果发现算法 ===\n")

    algorithms = {
        'PC算法': {
            '类型': '基于约束',
            '假设': '因果马尔可夫，忠实性',
            '输出': '等价类（CPDAG）',
            '库': 'pcalg (R), causal-learn (Python)'
        },
        'FCI算法': {
            '类型': '基于约束',
            '假设': '允许潜在混杂因素',
            '输出': 'PAG（允许不确定性）',
            '库': 'pcalg, causal-learn'
        },
        'GES（贪婪等价搜索）': {
            '类型': '基于得分',
            '假设': '得分函数（如BIC）',
            '输出': '等价类',
            '库': 'causal-learn'
        },
        'LiNGAM': {
            '类型': '函数因果模型',
            '假设': '线性，非高斯误差',
            '输出': '完整DAG（唯一）',
            '库': 'lingam'
        },
        'NOTEARS': {
            '类型': '基于优化',
            '假设': 'DAG的连续优化',
            '输出': 'DAG',
            '库': 'notears, causalnex'
        }
    }

    for algo, details in algorithms.items():
        print(f"{algo}:")
        for key, value in details.items():
            print(f"  {key}: {value}")
        print()

causal_discovery_example()

# PC类独立性检验的简单实现
def simple_independence_test(X, Y, Z=None, alpha=0.05):
    """
    使用偏相关检验条件独立性 X _||_ Y | Z
    """
    from scipy import stats

    if Z is None or len(Z) == 0:
        # 边际独立性
        corr, p_value = stats.pearsonr(X, Y)
    else:
        # 偏相关
        # 将X和Y对Z进行残差化
        from sklearn.linear_model import LinearRegression

        Z_array = np.column_stack(Z) if isinstance(Z, list) else Z.reshape(-1, 1)

        model_x = LinearRegression().fit(Z_array, X)
        model_y = LinearRegression().fit(Z_array, Y)

        resid_x = X - model_x.predict(Z_array)
        resid_y = Y - model_y.predict(Z_array)

        corr, p_value = stats.pearsonr(resid_x, resid_y)

    return {
        '相关性': corr,
        'p值': p_value,
        '独立': p_value > alpha
    }

# 示例
np.random.seed(42)
n = 500

Z = np.random.normal(0, 1, n)
X = 0.7 * Z + np.random.normal(0, 0.5, n)
Y = 0.6 * Z + np.random.normal(0, 0.5, n)

print("=== 独立性检验示例 ===\n")
print("结构: Z -> X, Z -> Y（X和Y没有直接连接）")

print("\n边际检验 X _||_ Y:")
result = simple_independence_test(X, Y)
print(f"  相关性: {result['相关性']:.3f}")
print(f"  独立: {result['独立']} (p={result['p值']:.4f})")

print("\n条件检验 X _||_ Y | Z:")
result = simple_independence_test(X, Y, [Z])
print(f"  偏相关: {result['相关性']:.3f}")
print(f"  独立: {result['独立']} (p={result['p值']:.4f})")
```

### 异质性处理效应

```python
class HeterogeneousTreatmentEffects:
    """
    估计异质性处理效应的方法
    """

    @staticmethod
    def causal_forest_example():
        """
        用于异质性效应的因果森林
        （需要econml库）
        """
        try:
            from econml.dml import CausalForestDML
            from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier

            # 生成具有异质性效应的数据
            np.random.seed(42)
            n = 2000

            X1 = np.random.normal(0, 1, n)
            X2 = np.random.normal(0, 1, n)
            X = np.column_stack([X1, X2])

            # 处理
            T = np.random.binomial(1, 0.5, n)

            # 异质性效应：X1 > 0时效应更大
            true_effect = 2 + 3 * (X1 > 0)

            # 结果
            Y = X1 + X2 + true_effect * T + np.random.normal(0, 1, n)

            # 拟合因果森林
            cf = CausalForestDML(
                model_y=RandomForestRegressor(n_estimators=100),
                model_t=RandomForestClassifier(n_estimators=100),
                n_estimators=100,
                random_state=42
            )
            cf.fit(Y, T, X=X)

            # 获取个体处理效应
            cate = cf.effect(X)

            print("=== 因果森林结果 ===\n")
            print(f"平均处理效应: {np.mean(cate):.3f}")
            print(f"真实ATE: {np.mean(true_effect):.3f}")

            # 按子群体的效应
            print(f"\n异质性效应:")
            print(f"  X1 <= 0: 估计={np.mean(cate[X1 <= 0]):.3f}, 真实={2:.1f}")
            print(f"  X1 > 0: 估计={np.mean(cate[X1 > 0]):.3f}, 真实={5:.1f}")

            return cf, cate

        except ImportError:
            print("econml未安装。使用以下命令安装：pip install econml")
            return None, None

    @staticmethod
    def subgroup_analysis(data, treatment, outcome, covariates, subgroup_var):
        """
        处理效应异质性的简单子群体分析
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
                '子群体': subgroup,
                '效应': effect,
                'n_处理': n_treated,
                'n_对照': n_control
            })

        return pd.DataFrame(results)

# 运行示例
hte = HeterogeneousTreatmentEffects()
cf, cate = hte.causal_forest_example()
```

### 中介分析

```python
def mediation_analysis(data, treatment, mediator, outcome, covariates=None):
    """
    因果中介分析

    将总效应分解为：
    - 直接效应（处理 -> 结果）
    - 间接效应（处理 -> 中介 -> 结果）
    """
    import statsmodels.api as sm

    # 准备数据
    X_tm = data[[treatment]]
    if covariates:
        X_tm = pd.concat([X_tm, data[covariates]], axis=1)
    X_tm = sm.add_constant(X_tm)

    X_tmy = data[[treatment, mediator]]
    if covariates:
        X_tmy = pd.concat([X_tmy, data[covariates]], axis=1)
    X_tmy = sm.add_constant(X_tmy)

    # 模型1：中介 ~ 处理
    model_m = sm.OLS(data[mediator], X_tm).fit()
    a = model_m.params[treatment]  # T对M的效应

    # 模型2：结果 ~ 处理 + 中介
    model_y = sm.OLS(data[outcome], X_tmy).fit()
    b = model_y.params[mediator]  # M对Y的效应（控制T）
    c_prime = model_y.params[treatment]  # T对Y的直接效应

    # 模型3：结果 ~ 处理（总效应）
    X_t = data[[treatment]]
    if covariates:
        X_t = pd.concat([X_t, data[covariates]], axis=1)
    X_t = sm.add_constant(X_t)
    model_total = sm.OLS(data[outcome], X_t).fit()
    c = model_total.params[treatment]  # 总效应

    # 计算效应
    indirect_effect = a * b
    direct_effect = c_prime
    total_effect = c
    proportion_mediated = indirect_effect / total_effect if total_effect != 0 else 0

    return {
        '总效应': total_effect,
        '直接效应': direct_effect,
        '间接效应': indirect_effect,
        '中介比例': proportion_mediated,
        '路径a (T->M)': a,
        '路径b (M->Y|T)': b,
        '路径c_prime (T->Y|M)': c_prime
    }

# 示例：教育对收入的影响，由职业中介
np.random.seed(42)
n = 1000

education = np.random.normal(14, 3, n)  # 受教育年限
occupation_prestige = 30 + 3 * education + np.random.normal(0, 10, n)  # 中介
earnings = 20000 + 1000 * education + 500 * occupation_prestige + np.random.normal(0, 5000, n)

mediation_data = pd.DataFrame({
    'education': education,
    'occupation': occupation_prestige,
    'earnings': earnings
})

print("=== 中介分析 ===\n")
print("路径: 教育 -> 职业 -> 收入")
print("       教育 ---------> 收入（直接）")
print()

results = mediation_analysis(mediation_data, 'education', 'occupation', 'earnings')
for k, v in results.items():
    if isinstance(v, float):
        print(f"{k}: {v:.2f}")
    else:
        print(f"{k}: {v}")
```

---

## 面试要点

### 概念性问题

**问：什么是因果推断的根本问题？**

答：根本问题在于我们永远无法同时观察到同一单位的两种潜在结果。对于任何个体，我们只能观察到接受处理的结果或未接受处理的结果，但不能同时观察两者。这就是为什么我们需要假设（如可忽略性、平行趋势或有效工具）来估计因果效应。

**问：什么时候可以从观察数据推断因果关系？**

答：当以下条件满足时，可以从观察数据进行因果推断：
1. 你有一个有效的因果模型（DAG）代表数据生成过程
2. 你可以识别有效的调整集（后门准则）
3. 或者你有有效的工具变量
4. 或者你可以利用自然实验（DiD，RDD）
5. 关键假设得到满足，不可检验的假设是合理的

**问：解释ATE、ATT和LATE的区别**

答：
- **ATE（平均处理效应）**：整个人群的平均效应：E[Y(1) - Y(0)]
- **ATT（处理组平均处理效应）**：实际接受处理者的平均效应：E[Y(1) - Y(0) | T=1]
- **LATE（局部平均处理效应）**：IV分析中"服从者"的平均效应——那些处理状态受工具影响的人

**问：倾向得分匹配的关键假设是什么？**

答：
1. **SUTVA**：单位之间无干扰，处理一致
2. **正定性/重叠**：对所有X，0 < P(T=1|X) < 1
3. **可忽略性/无混杂**：给定X，Y(0), Y(1)与T独立
4. **正确的模型设定**：倾向得分模型正确设定

**问：如何验证DiD分析？**

答：
1. **平行趋势**：检查处理前趋势是否相似（必需假设）
2. **无预期**：处理组在处理前没有改变行为
3. **无溢出**：对照组不受处理影响
4. **安慰剂检验**：虚假的处理时间应该显示无效应
5. **敏感性分析**：结果对不同设定稳健

### 实践性问题

**问：你想估计新功能对用户参与度的影响。你会使用什么方法？**

答：方法取决于功能如何推出：
1. **随机A/B测试**（黄金标准）：简单的均值比较
2. **基于可观测的非随机推出**：PSM、IPW或回归调整
3. **随时间逐步推出**：如果有明确的前后，使用DiD
4. **功能由不可观测因素驱动**：需要IV或自然实验

**问：如何处理未测量的混杂？**

答：
1. **敏感性分析**：混杂需要多强才能使结果失效？
2. **工具变量**：如果有有效的工具可用
3. **双重差分**：如果平行趋势假设成立
4. **断点回归**：如果有基于阈值的分配
5. **边界分析**：在最坏情况混杂下估计真实效应的边界

---

## 延伸阅读

### 重要论文

1. **Pearl, J. (2009)**：《因果关系：模型、推理和推断》- 奠基性著作
2. **Rubin, D. (1974)**：《估计处理的因果效应》- 潜在结果框架
3. **Angrist & Imbens (1996)**：《使用工具变量识别因果效应》
4. **Rosenbaum & Rubin (1983)**：《倾向得分的核心作用》

### 书籍

1. **《为什么》** 朱迪亚·珀尔著 - 因果推断的易懂入门
2. **《因果推断：混合带》** Scott Cunningham著 - 应用计量经济学视角
3. **《基本无害的计量经济学》** Angrist & Pischke著 - 实用因果方法
4. **《因果推断要素》** Peters, Janzing, Scholkopf著 - 机器学习视角

### Python库

- **DoWhy**: https://github.com/py-why/dowhy
- **EconML**: https://github.com/microsoft/EconML（异质性处理效应）
- **CausalML**: https://github.com/uber/causalml（提升建模）
- **causal-learn**: https://github.com/py-why/causal-learn（因果发现）
- **pgmpy**: https://pgmpy.org/（概率图模型）

### 在线资源

- DoWhy文档和教程
- 微软研究院因果推断系列
- Brady Neal的《因果推断入门》课程
- Miguel Hernan的《因果图》课程（edX）

---

## 总结

因果推断对于理解干预的真实效果和做出正确决策至关重要。关键要点：

1. **相关性不是因果性**：在解释关联之前，始终考虑因果结构

2. **因果图很强大**：DAG帮助你识别混杂因素、中介和对撞节点，并确定需要控制什么

3. **存在多种方法**：PSM、DiD、IV和其他方法各有不同的假设——根据你的情境选择

4. **假设很重要**：每种因果方法都依赖于不可检验的假设——明确说明它们

5. **敏感性分析至关重要**：始终评估你的结论对假设违反的稳健性

6. **使用适当的工具**：像DoWhy这样的库提供了严格因果分析的结构化工作流程

7. **领域知识是必不可少的**：统计方法不能替代对实质领域的理解

掌握因果推断将你从一个能在数据中发现模式的人转变为能可靠回答"如果会怎样"问题的人——这是数据科学、产品开发和政策分析的关键技能。
