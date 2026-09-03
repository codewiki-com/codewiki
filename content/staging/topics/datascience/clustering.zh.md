---
title: 经典机器学习：聚类算法
description: 掌握主流聚类方法：K-Means、DBSCAN、层次聚类和GMM
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - 聚类
  - K-Means
  - DBSCAN
  - 无监督学习
status: imported
origin: old/src/content/docs/datascience/clustering.zh.md
divergence: 0.235
issues: []
legacy:
  category: DataScience
  subcategory: ClassicalML
  order: 16
  lastUpdated: 2026-01-07
---

聚类（Clustering）是无监督学习中最重要的技术之一，它的目标是将数据集中的样本划分为若干个组（簇），使得同一簇内的样本相似度高，而不同簇之间的样本相似度低。本文将系统介绍聚类问题的定义、主流聚类算法原理、评估指标以及实际应用。

## 聚类问题定义

### 什么是聚类

聚类是一种无监督学习方法，与分类不同，聚类不需要预先定义的标签。算法根据数据本身的特征和结构，自动发现数据中的自然分组。

**聚类的核心思想：**

> 物以类聚，人以群分。将相似的对象归为一类，将不相似的对象分开。

**形式化定义：**

给定数据集 $D = \{x_1, x_2, ..., x_n\}$，聚类的目标是将数据划分为 $k$ 个不相交的簇 $C = \{C_1, C_2, ..., C_k\}$，使得：

- $\bigcup_{i=1}^{k} C_i = D$（所有样本都被分配到某个簇）
- $C_i \cap C_j = \emptyset, \forall i \neq j$（簇之间不重叠，硬聚类）

### 聚类的应用场景

| 领域 | 应用场景 | 具体示例 |
|------|----------|----------|
| 市场营销 | 客户细分 | 根据消费行为将客户分为不同群体 |
| 图像处理 | 图像分割 | 将图像像素分组为不同区域 |
| 文本挖掘 | 文档聚类 | 自动将新闻文章按主题分组 |
| 生物信息 | 基因表达分析 | 识别具有相似表达模式的基因 |
| 异常检测 | 欺诈识别 | 发现与正常行为模式不同的交易 |
| 推荐系统 | 用户分群 | 为不同用户群推荐不同内容 |

### 相似度与距离度量

聚类算法的核心是如何衡量样本之间的相似度。常用的距离度量包括：

**欧氏距离（Euclidean Distance）：**

$$d(x, y) = \sqrt{\sum_{i=1}^{n}(x_i - y_i)^2}$$

**曼哈顿距离（Manhattan Distance）：**

$$d(x, y) = \sum_{i=1}^{n}|x_i - y_i|$$

**余弦相似度（Cosine Similarity）：**

$$\cos(\theta) = \frac{x \cdot y}{\|x\| \cdot \|y\|}$$

**闵可夫斯基距离（Minkowski Distance）：**

$$d(x, y) = \left(\sum_{i=1}^{n}|x_i - y_i|^p\right)^{1/p}$$

当 $p=2$ 时为欧氏距离，$p=1$ 时为曼哈顿距离。

```python
import numpy as np
from scipy.spatial.distance import euclidean, cityblock, cosine

# 示例数据点
x = np.array([1, 2, 3])
y = np.array([4, 5, 6])

# 计算各种距离
print(f"欧氏距离: {euclidean(x, y):.4f}")
print(f"曼哈顿距离: {cityblock(x, y):.4f}")
print(f"余弦距离: {cosine(x, y):.4f}")  # 1 - 余弦相似度
print(f"余弦相似度: {1 - cosine(x, y):.4f}")
```

### 聚类算法分类

聚类算法可以从多个维度进行分类：

**按簇的形状：**
- **球形簇**：K-Means、GMM
- **任意形状**：DBSCAN、OPTICS、谱聚类

**按聚类策略：**
- **划分式聚类**：K-Means、K-Medoids
- **层次式聚类**：凝聚式（自底向上）、分裂式（自顶向下）
- **基于密度的聚类**：DBSCAN、OPTICS、Mean Shift
- **基于模型的聚类**：GMM、隐马尔可夫模型

**按簇的类型：**
- **硬聚类**：每个样本只属于一个簇（K-Means、DBSCAN）
- **软聚类**：每个样本以一定概率属于各个簇（GMM）

## K-Means 算法

K-Means 是最经典、最广泛使用的聚类算法，由 Lloyd 于 1982 年提出。

### 算法原理

K-Means 的目标是最小化簇内平方误差和（Within-Cluster Sum of Squares, WCSS）：

$$J = \sum_{i=1}^{k}\sum_{x \in C_i}\|x - \mu_i\|^2$$

其中 $\mu_i$ 是第 $i$ 个簇的质心（均值）。

**算法步骤：**

1. **初始化**：随机选择 $k$ 个样本作为初始质心
2. **分配**：将每个样本分配到最近的质心所属的簇
3. **更新**：重新计算每个簇的质心
4. **迭代**：重复步骤 2-3，直到质心不再变化或达到最大迭代次数

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_blobs

def kmeans_from_scratch(X, k, max_iters=100, tol=1e-4):
    """
    从零实现 K-Means 算法

    参数:
        X: 输入数据 (n_samples, n_features)
        k: 簇的数量
        max_iters: 最大迭代次数
        tol: 收敛阈值

    返回:
        centroids: 最终质心
        labels: 每个样本的簇标签
    """
    n_samples, n_features = X.shape

    # 步骤1: 随机初始化质心
    random_indices = np.random.choice(n_samples, k, replace=False)
    centroids = X[random_indices].copy()

    for iteration in range(max_iters):
        # 步骤2: 分配 - 计算每个样本到各质心的距离
        distances = np.zeros((n_samples, k))
        for i in range(k):
            distances[:, i] = np.linalg.norm(X - centroids[i], axis=1)

        # 分配到最近的质心
        labels = np.argmin(distances, axis=1)

        # 步骤3: 更新 - 重新计算质心
        new_centroids = np.zeros((k, n_features))
        for i in range(k):
            if np.sum(labels == i) > 0:
                new_centroids[i] = X[labels == i].mean(axis=0)
            else:
                # 如果某个簇没有样本，重新随机初始化
                new_centroids[i] = X[np.random.randint(n_samples)]

        # 检查收敛
        centroid_shift = np.linalg.norm(new_centroids - centroids)
        centroids = new_centroids

        if centroid_shift < tol:
            print(f"在第 {iteration + 1} 次迭代后收敛")
            break

    return centroids, labels

# 生成示例数据
np.random.seed(42)
X, y_true = make_blobs(n_samples=300, centers=4, cluster_std=0.6, random_state=42)

# 运行自实现的 K-Means
centroids, labels = kmeans_from_scratch(X, k=4)

# 可视化结果
plt.figure(figsize=(10, 4))

plt.subplot(1, 2, 1)
plt.scatter(X[:, 0], X[:, 1], c=y_true, cmap='viridis', alpha=0.6)
plt.title('真实标签')
plt.xlabel('特征1')
plt.ylabel('特征2')

plt.subplot(1, 2, 2)
plt.scatter(X[:, 0], X[:, 1], c=labels, cmap='viridis', alpha=0.6)
plt.scatter(centroids[:, 0], centroids[:, 1], c='red', marker='X', s=200, label='质心')
plt.title('K-Means 聚类结果')
plt.xlabel('特征1')
plt.ylabel('特征2')
plt.legend()

plt.tight_layout()
plt.show()
```

### K-Means 的优缺点

**优点：**
- 算法简单，易于理解和实现
- 计算效率高，时间复杂度为 $O(n \cdot k \cdot t)$，其中 $t$ 为迭代次数
- 适用于大规模数据集
- 对于球形、大小相近的簇效果好

**缺点：**
- 需要预先指定簇的数量 $k$
- 对初始质心敏感，可能陷入局部最优
- 对异常值敏感
- 只能发现球形簇，无法处理非凸形状的簇
- 假设各簇大小相近

### K 值选择方法

#### 肘部法则（Elbow Method）

绘制不同 $k$ 值对应的 WCSS，选择"肘部"对应的 $k$ 值。

```python
from sklearn.cluster import KMeans

def plot_elbow_method(X, k_range=range(1, 11)):
    """
    使用肘部法则选择最优 K 值
    """
    wcss = []

    for k in k_range:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(X)
        wcss.append(kmeans.inertia_)

    plt.figure(figsize=(8, 5))
    plt.plot(k_range, wcss, 'bo-', linewidth=2, markersize=8)
    plt.xlabel('簇的数量 K')
    plt.ylabel('WCSS (簇内平方误差和)')
    plt.title('肘部法则确定最优 K 值')
    plt.grid(True, alpha=0.3)
    plt.show()

    return wcss

# 使用肘部法则
wcss = plot_elbow_method(X)
```

#### 轮廓系数法

选择使轮廓系数最大的 $k$ 值（详见评估指标部分）。

```python
from sklearn.metrics import silhouette_score

def plot_silhouette_analysis(X, k_range=range(2, 11)):
    """
    使用轮廓系数选择最优 K 值
    """
    silhouette_scores = []

    for k in k_range:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)
        score = silhouette_score(X, labels)
        silhouette_scores.append(score)

    plt.figure(figsize=(8, 5))
    plt.plot(k_range, silhouette_scores, 'go-', linewidth=2, markersize=8)
    plt.xlabel('簇的数量 K')
    plt.ylabel('轮廓系数')
    plt.title('轮廓系数法确定最优 K 值')
    plt.grid(True, alpha=0.3)
    plt.show()

    best_k = list(k_range)[np.argmax(silhouette_scores)]
    print(f"最优 K 值: {best_k}, 轮廓系数: {max(silhouette_scores):.4f}")

    return silhouette_scores

# 使用轮廓系数法
silhouette_scores = plot_silhouette_analysis(X)
```

## K-Means++ 初始化

### 为什么需要 K-Means++

标准 K-Means 的随机初始化可能导致：
- 多个初始质心位于同一簇中
- 收敛到较差的局部最优解
- 聚类结果不稳定

K-Means++ 由 Arthur 和 Vassilvitskii 于 2007 年提出，通过智能初始化质心来解决这些问题。

### K-Means++ 初始化算法

**算法步骤：**

1. 从数据集中随机选择第一个质心 $c_1$
2. 对于每个数据点 $x$，计算它到最近已选质心的距离 $D(x)$
3. 以概率 $\frac{D(x)^2}{\sum_{x'}D(x')^2}$ 选择下一个质心（距离越远，被选中概率越高）
4. 重复步骤 2-3，直到选择了 $k$ 个质心
5. 用选定的质心初始化标准 K-Means 算法

```python
def kmeans_plusplus_init(X, k):
    """
    K-Means++ 初始化算法

    参数:
        X: 输入数据 (n_samples, n_features)
        k: 质心数量

    返回:
        centroids: 初始化的质心
    """
    n_samples, n_features = X.shape
    centroids = np.zeros((k, n_features))

    # 步骤1: 随机选择第一个质心
    first_idx = np.random.randint(n_samples)
    centroids[0] = X[first_idx]

    for i in range(1, k):
        # 步骤2: 计算每个点到最近质心的距离平方
        distances = np.zeros(n_samples)
        for j in range(n_samples):
            min_dist = float('inf')
            for c in range(i):  # 只考虑已选择的质心
                dist = np.linalg.norm(X[j] - centroids[c])
                min_dist = min(min_dist, dist)
            distances[j] = min_dist ** 2

        # 步骤3: 按概率选择下一个质心
        probabilities = distances / distances.sum()
        next_idx = np.random.choice(n_samples, p=probabilities)
        centroids[i] = X[next_idx]

    return centroids

# 比较随机初始化和 K-Means++ 初始化
np.random.seed(42)

# 随机初始化
random_centroids = X[np.random.choice(len(X), 4, replace=False)]

# K-Means++ 初始化
plusplus_centroids = kmeans_plusplus_init(X, 4)

# 可视化比较
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

axes[0].scatter(X[:, 0], X[:, 1], c='lightgray', alpha=0.6)
axes[0].scatter(random_centroids[:, 0], random_centroids[:, 1],
                c='red', marker='X', s=200, label='初始质心')
axes[0].set_title('随机初始化')
axes[0].legend()

axes[1].scatter(X[:, 0], X[:, 1], c='lightgray', alpha=0.6)
axes[1].scatter(plusplus_centroids[:, 0], plusplus_centroids[:, 1],
                c='red', marker='X', s=200, label='初始质心')
axes[1].set_title('K-Means++ 初始化')
axes[1].legend()

plt.tight_layout()
plt.show()
```

### K-Means++ 的优势

- **更好的初始化**：质心分布更均匀，覆盖数据空间更好
- **更快的收敛**：通常需要更少的迭代次数
- **更好的结果**：更容易找到全局最优或接近全局最优的解
- **理论保证**：期望误差在最优解的 $O(\log k)$ 倍以内

在 scikit-learn 中，`KMeans` 默认使用 `init='k-means++'`：

```python
from sklearn.cluster import KMeans

# 使用 K-Means++ (默认)
kmeans_pp = KMeans(n_clusters=4, init='k-means++', random_state=42)
labels_pp = kmeans_pp.fit_predict(X)

# 使用随机初始化
kmeans_random = KMeans(n_clusters=4, init='random', random_state=42)
labels_random = kmeans_random.fit_predict(X)

print(f"K-Means++ WCSS: {kmeans_pp.inertia_:.2f}")
print(f"随机初始化 WCSS: {kmeans_random.inertia_:.2f}")
```

## DBSCAN 密度聚类

### 算法原理

DBSCAN（Density-Based Spatial Clustering of Applications with Noise）是一种基于密度的聚类算法，由 Ester 等人于 1996 年提出。它的核心思想是：簇是由密度相连的点组成的最大集合。

**核心概念：**

- **$\epsilon$-邻域**：以点 $p$ 为圆心，$\epsilon$ 为半径的区域内的所有点
- **核心点（Core Point）**：$\epsilon$-邻域内至少包含 $MinPts$ 个点的点
- **边界点（Border Point）**：在某个核心点的 $\epsilon$-邻域内，但自身不是核心点
- **噪声点（Noise Point）**：既不是核心点也不是边界点
- **密度直达**：点 $q$ 在核心点 $p$ 的 $\epsilon$-邻域内
- **密度可达**：存在一系列点 $p_1, p_2, ..., p_n$，其中 $p_1 = p$，$p_n = q$，且 $p_{i+1}$ 从 $p_i$ 密度直达
- **密度相连**：存在点 $o$，使得 $p$ 和 $q$ 都从 $o$ 密度可达

```python
import numpy as np
from collections import deque

def dbscan_from_scratch(X, eps, min_pts):
    """
    从零实现 DBSCAN 算法

    参数:
        X: 输入数据 (n_samples, n_features)
        eps: 邻域半径
        min_pts: 成为核心点所需的最小邻居数

    返回:
        labels: 聚类标签 (-1 表示噪声点)
    """
    n_samples = len(X)
    labels = np.full(n_samples, -1)  # -1 表示未访问或噪声
    cluster_id = 0

    # 计算距离矩阵
    def get_neighbors(point_idx):
        distances = np.linalg.norm(X - X[point_idx], axis=1)
        return np.where(distances <= eps)[0]

    for i in range(n_samples):
        if labels[i] != -1:  # 已经被访问
            continue

        neighbors = get_neighbors(i)

        if len(neighbors) < min_pts:
            # 暂时标记为噪声（可能后续成为边界点）
            continue

        # 开始新的簇
        labels[i] = cluster_id

        # 使用队列扩展簇
        seed_set = deque(neighbors)
        seed_set.remove(i)

        while seed_set:
            q = seed_set.popleft()

            if labels[q] == -1:  # 之前被标记为噪声
                labels[q] = cluster_id

            if labels[q] != -1 and labels[q] != cluster_id:
                continue  # 已属于其他簇

            labels[q] = cluster_id

            q_neighbors = get_neighbors(q)
            if len(q_neighbors) >= min_pts:
                for neighbor in q_neighbors:
                    if labels[neighbor] == -1:
                        seed_set.append(neighbor)

        cluster_id += 1

    return labels

# 生成适合 DBSCAN 的数据（包含非球形簇）
from sklearn.datasets import make_moons, make_circles

# 创建月牙形数据
X_moons, y_moons = make_moons(n_samples=300, noise=0.05, random_state=42)

# 运行自实现的 DBSCAN
labels_custom = dbscan_from_scratch(X_moons, eps=0.2, min_pts=5)

# 可视化
plt.figure(figsize=(12, 4))

plt.subplot(1, 3, 1)
plt.scatter(X_moons[:, 0], X_moons[:, 1], c=y_moons, cmap='viridis')
plt.title('真实标签')

plt.subplot(1, 3, 2)
plt.scatter(X_moons[:, 0], X_moons[:, 1], c=labels_custom, cmap='viridis')
plt.title('自实现 DBSCAN')

# 使用 sklearn 的 DBSCAN 比较
from sklearn.cluster import DBSCAN
dbscan_sklearn = DBSCAN(eps=0.2, min_samples=5)
labels_sklearn = dbscan_sklearn.fit_predict(X_moons)

plt.subplot(1, 3, 3)
plt.scatter(X_moons[:, 0], X_moons[:, 1], c=labels_sklearn, cmap='viridis')
plt.title('Sklearn DBSCAN')

plt.tight_layout()
plt.show()
```

### 参数选择

DBSCAN 有两个关键参数：

**eps（邻域半径）选择：**

使用 K-距离图（K-Distance Plot）：计算每个点到第 $k$ 近邻的距离，排序后绘图，选择"拐点"对应的距离。

```python
from sklearn.neighbors import NearestNeighbors

def plot_k_distance(X, k=5):
    """
    绘制 K-距离图来选择 eps 参数
    """
    neighbors = NearestNeighbors(n_neighbors=k)
    neighbors.fit(X)
    distances, _ = neighbors.kneighbors(X)

    # 取第 k 近邻的距离
    k_distances = distances[:, k-1]
    k_distances = np.sort(k_distances)

    plt.figure(figsize=(8, 5))
    plt.plot(range(len(k_distances)), k_distances)
    plt.xlabel('样本点（按距离排序）')
    plt.ylabel(f'第 {k} 近邻距离')
    plt.title('K-距离图 (用于选择 eps)')
    plt.grid(True, alpha=0.3)
    plt.show()

    return k_distances

# 绘制 K-距离图
k_distances = plot_k_distance(X_moons, k=5)
```

**min_pts（最小点数）选择：**

经验法则：
- 对于二维数据，$MinPts = 4$ 通常是一个好的起点
- 一般设置为 $MinPts \geq D + 1$，其中 $D$ 是数据维度
- 数据越大或噪声越多，$MinPts$ 应该越大

### DBSCAN 的优缺点

**优点：**
- 无需预先指定簇的数量
- 可以发现任意形状的簇
- 对噪声点不敏感，可以识别异常值
- 只需两个参数，相对简单

**缺点：**
- 对参数 $\epsilon$ 和 $MinPts$ 敏感
- 无法处理密度差异大的簇
- 对高维数据效果差（维度诅咒）
- 时间复杂度为 $O(n^2)$（可通过空间索引优化到 $O(n\log n)$）

### DBSCAN 与 K-Means 对比

```python
from sklearn.cluster import KMeans, DBSCAN
from sklearn.datasets import make_moons, make_blobs

# 生成不同类型的数据
X_moons, y_moons = make_moons(n_samples=300, noise=0.05, random_state=42)
X_blobs, y_blobs = make_blobs(n_samples=300, centers=3, random_state=42)

fig, axes = plt.subplots(2, 3, figsize=(15, 10))

# 月牙形数据
axes[0, 0].scatter(X_moons[:, 0], X_moons[:, 1], c=y_moons, cmap='viridis')
axes[0, 0].set_title('月牙形数据 - 真实标签')

kmeans = KMeans(n_clusters=2, random_state=42)
axes[0, 1].scatter(X_moons[:, 0], X_moons[:, 1],
                   c=kmeans.fit_predict(X_moons), cmap='viridis')
axes[0, 1].set_title('月牙形数据 - K-Means')

dbscan = DBSCAN(eps=0.2, min_samples=5)
axes[0, 2].scatter(X_moons[:, 0], X_moons[:, 1],
                   c=dbscan.fit_predict(X_moons), cmap='viridis')
axes[0, 2].set_title('月牙形数据 - DBSCAN')

# 球形数据
axes[1, 0].scatter(X_blobs[:, 0], X_blobs[:, 1], c=y_blobs, cmap='viridis')
axes[1, 0].set_title('球形数据 - 真实标签')

axes[1, 1].scatter(X_blobs[:, 0], X_blobs[:, 1],
                   c=KMeans(n_clusters=3, random_state=42).fit_predict(X_blobs),
                   cmap='viridis')
axes[1, 1].set_title('球形数据 - K-Means')

axes[1, 2].scatter(X_blobs[:, 0], X_blobs[:, 1],
                   c=DBSCAN(eps=1.0, min_samples=5).fit_predict(X_blobs),
                   cmap='viridis')
axes[1, 2].set_title('球形数据 - DBSCAN')

plt.tight_layout()
plt.show()
```

## 层次聚类

### 算法原理

层次聚类（Hierarchical Clustering）构建一个簇的层次结构，可以是自底向上（凝聚式）或自顶向下（分裂式）。

**凝聚式层次聚类（Agglomerative）：**

1. 将每个样本视为一个单独的簇
2. 计算所有簇对之间的距离
3. 合并距离最近的两个簇
4. 重复步骤 2-3，直到所有样本合并为一个簇或达到指定的簇数

**簇间距离度量（Linkage）：**

| 方法 | 定义 | 特点 |
|------|------|------|
| 单链接（Single） | 两簇中最近两点的距离 | 易产生链式效应 |
| 全链接（Complete） | 两簇中最远两点的距离 | 产生紧凑的簇 |
| 平均链接（Average） | 所有点对距离的平均值 | 折中方案 |
| Ward | 合并后的簇内方差增量最小 | 倾向于产生大小相近的簇 |

```python
from scipy.cluster.hierarchy import dendrogram, linkage, fcluster
from sklearn.cluster import AgglomerativeClustering

# 生成示例数据
np.random.seed(42)
X_hier, y_hier = make_blobs(n_samples=50, centers=3, random_state=42)

# 使用 scipy 进行层次聚类并绘制树状图
def plot_dendrogram(X, method='ward'):
    """
    绘制层次聚类树状图
    """
    # 计算链接矩阵
    Z = linkage(X, method=method)

    plt.figure(figsize=(12, 6))
    dendrogram(Z, truncate_mode='level', p=5)
    plt.title(f'层次聚类树状图 (链接方法: {method})')
    plt.xlabel('样本索引或簇大小')
    plt.ylabel('距离')
    plt.show()

    return Z

# 绘制不同链接方法的树状图
Z_ward = plot_dendrogram(X_hier, method='ward')
```

### 树状图解读与簇的确定

```python
# 比较不同链接方法
methods = ['single', 'complete', 'average', 'ward']

fig, axes = plt.subplots(2, 2, figsize=(14, 10))
axes = axes.flatten()

for ax, method in zip(axes, methods):
    Z = linkage(X_hier, method=method)
    dendrogram(Z, ax=ax, truncate_mode='level', p=4)
    ax.set_title(f'{method.capitalize()} Linkage')
    ax.set_xlabel('样本')
    ax.set_ylabel('距离')

plt.tight_layout()
plt.show()
```

### 使用 scikit-learn 进行层次聚类

```python
from sklearn.cluster import AgglomerativeClustering

# 不同链接方法的聚类结果比较
fig, axes = plt.subplots(2, 2, figsize=(12, 10))
axes = axes.flatten()

linkages = ['ward', 'complete', 'average', 'single']

for ax, linkage_method in zip(axes, linkages):
    model = AgglomerativeClustering(n_clusters=3, linkage=linkage_method)
    labels = model.fit_predict(X_hier)

    ax.scatter(X_hier[:, 0], X_hier[:, 1], c=labels, cmap='viridis')
    ax.set_title(f'{linkage_method.capitalize()} Linkage')

plt.tight_layout()
plt.show()
```

### 层次聚类的优缺点

**优点：**
- 无需预先指定簇的数量（可以通过切割树状图确定）
- 树状图提供了数据的层次结构信息
- 可以使用不同的距离度量和链接方法
- 结果具有可解释性

**缺点：**
- 时间复杂度高：$O(n^2\log n)$ 到 $O(n^3)$
- 空间复杂度高：$O(n^2)$
- 对噪声和异常值敏感
- 一旦合并/分裂，无法撤销（贪心策略）

## 高斯混合模型（GMM）

### 算法原理

高斯混合模型（Gaussian Mixture Model, GMM）假设数据是由 $K$ 个高斯分布混合生成的。每个高斯分布代表一个簇。

**数学表达：**

$$p(x) = \sum_{k=1}^{K}\pi_k \mathcal{N}(x|\mu_k, \Sigma_k)$$

其中：
- $\pi_k$ 是第 $k$ 个高斯分布的混合权重（$\sum_k \pi_k = 1$）
- $\mathcal{N}(x|\mu_k, \Sigma_k)$ 是均值为 $\mu_k$，协方差矩阵为 $\Sigma_k$ 的高斯分布

GMM 使用**期望最大化（EM）算法**进行参数估计。

### EM 算法

**E 步（Expectation）：** 计算每个样本属于各个簇的后验概率（责任度）

$$\gamma_{nk} = \frac{\pi_k \mathcal{N}(x_n|\mu_k, \Sigma_k)}{\sum_{j=1}^{K}\pi_j \mathcal{N}(x_n|\mu_j, \Sigma_j)}$$

**M 步（Maximization）：** 更新参数

$$\mu_k^{new} = \frac{\sum_n \gamma_{nk} x_n}{\sum_n \gamma_{nk}}$$

$$\Sigma_k^{new} = \frac{\sum_n \gamma_{nk}(x_n - \mu_k^{new})(x_n - \mu_k^{new})^T}{\sum_n \gamma_{nk}}$$

$$\pi_k^{new} = \frac{\sum_n \gamma_{nk}}{N}$$

```python
from sklearn.mixture import GaussianMixture
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse
import numpy as np

def plot_gmm_results(X, gmm, ax=None):
    """
    可视化 GMM 聚类结果，包括椭圆形等高线
    """
    if ax is None:
        fig, ax = plt.subplots(figsize=(8, 6))

    labels = gmm.predict(X)
    probs = gmm.predict_proba(X)

    # 绘制数据点，颜色表示聚类标签
    scatter = ax.scatter(X[:, 0], X[:, 1], c=labels, cmap='viridis', alpha=0.6)

    # 绘制高斯分布的等高线
    for k in range(gmm.n_components):
        mean = gmm.means_[k]
        cov = gmm.covariances_[k]

        # 计算椭圆参数
        eigenvalues, eigenvectors = np.linalg.eigh(cov)
        order = eigenvalues.argsort()[::-1]
        eigenvalues = eigenvalues[order]
        eigenvectors = eigenvectors[:, order]

        angle = np.degrees(np.arctan2(eigenvectors[1, 0], eigenvectors[0, 0]))

        # 绘制 1, 2, 3 标准差的椭圆
        for n_std in [1, 2]:
            width = 2 * n_std * np.sqrt(eigenvalues[0])
            height = 2 * n_std * np.sqrt(eigenvalues[1])
            ellipse = Ellipse(mean, width, height, angle=angle,
                            fill=False, edgecolor='red', linestyle='--', linewidth=1.5)
            ax.add_patch(ellipse)

        # 标记均值点
        ax.scatter(*mean, c='red', marker='+', s=200, linewidths=3)

    return ax

# 生成示例数据
np.random.seed(42)
X_gmm, y_gmm = make_blobs(n_samples=300, centers=3, cluster_std=[1.0, 1.5, 0.5],
                          random_state=42)

# 训练 GMM
gmm = GaussianMixture(n_components=3, covariance_type='full', random_state=42)
gmm.fit(X_gmm)

# 可视化结果
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

axes[0].scatter(X_gmm[:, 0], X_gmm[:, 1], c=y_gmm, cmap='viridis')
axes[0].set_title('真实标签')

plot_gmm_results(X_gmm, gmm, ax=axes[1])
axes[1].set_title('GMM 聚类结果（红色为高斯分布）')

plt.tight_layout()
plt.show()

# 打印 GMM 参数
print("GMM 参数:")
print(f"混合权重: {gmm.weights_}")
print(f"均值:\n{gmm.means_}")
```

### 协方差类型

GMM 中的协方差矩阵可以有不同的约束：

| 类型 | 描述 | 参数数量 | 适用场景 |
|------|------|----------|----------|
| full | 每个簇有独立的完整协方差矩阵 | 多 | 簇形状差异大 |
| tied | 所有簇共享同一个协方差矩阵 | 中 | 簇形状相似 |
| diag | 对角协方差矩阵（特征独立） | 少 | 特征独立假设 |
| spherical | 单一方差（各向同性） | 最少 | 球形簇 |

```python
# 比较不同协方差类型
cov_types = ['full', 'tied', 'diag', 'spherical']

fig, axes = plt.subplots(2, 2, figsize=(12, 10))
axes = axes.flatten()

for ax, cov_type in zip(axes, cov_types):
    gmm = GaussianMixture(n_components=3, covariance_type=cov_type, random_state=42)
    gmm.fit(X_gmm)
    labels = gmm.predict(X_gmm)

    ax.scatter(X_gmm[:, 0], X_gmm[:, 1], c=labels, cmap='viridis', alpha=0.6)
    ax.set_title(f'协方差类型: {cov_type}\nBIC: {gmm.bic(X_gmm):.1f}')

plt.tight_layout()
plt.show()
```

### GMM 的优缺点

**优点：**
- 软聚类：提供样本属于各簇的概率
- 灵活性：可以建模椭圆形状的簇
- 理论基础：有扎实的概率论基础
- 可以用于密度估计和生成新样本

**缺点：**
- 需要预先指定簇的数量
- 对初始化敏感
- 计算复杂度较高
- 可能收敛到局部最优
- 假设数据符合高斯分布

### 使用 BIC/AIC 选择最优簇数

```python
def select_n_components(X, max_components=10):
    """
    使用 BIC 和 AIC 选择最优的簇数
    """
    bics = []
    aics = []
    n_components_range = range(1, max_components + 1)

    for n in n_components_range:
        gmm = GaussianMixture(n_components=n, random_state=42)
        gmm.fit(X)
        bics.append(gmm.bic(X))
        aics.append(gmm.aic(X))

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(n_components_range, bics, 'bo-', label='BIC')
    ax.plot(n_components_range, aics, 'ro-', label='AIC')
    ax.set_xlabel('簇的数量')
    ax.set_ylabel('信息准则值')
    ax.set_title('BIC 和 AIC 选择最优簇数')
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.show()

    best_n_bic = n_components_range[np.argmin(bics)]
    best_n_aic = n_components_range[np.argmin(aics)]
    print(f"BIC 最优簇数: {best_n_bic}")
    print(f"AIC 最优簇数: {best_n_aic}")

    return best_n_bic, best_n_aic

# 选择最优簇数
best_bic, best_aic = select_n_components(X_gmm)
```

## 聚类评估指标

### 内部评估指标

内部评估指标不需要真实标签，基于聚类结果本身评估。

#### 轮廓系数（Silhouette Coefficient）

轮廓系数衡量样本与其所属簇的相似度与最近簇的相似度之比。

对于样本 $i$：
- $a(i)$：样本 $i$ 到同簇其他样本的平均距离（簇内凝聚度）
- $b(i)$：样本 $i$ 到最近其他簇中所有样本的平均距离（簇间分离度）

$$s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}$$

- $s(i)$ 接近 1：样本 $i$ 聚类效果好
- $s(i)$ 接近 0：样本 $i$ 在两个簇的边界
- $s(i)$ 接近 -1：样本 $i$ 可能被分错簇

```python
from sklearn.metrics import silhouette_score, silhouette_samples
import matplotlib.cm as cm

def plot_silhouette_analysis_detailed(X, labels):
    """
    详细的轮廓系数分析可视化
    """
    n_clusters = len(np.unique(labels[labels >= 0]))  # 排除噪声点
    silhouette_avg = silhouette_score(X, labels)
    sample_silhouette_values = silhouette_samples(X, labels)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # 轮廓图
    y_lower = 10
    for i in range(n_clusters):
        ith_cluster_silhouette_values = sample_silhouette_values[labels == i]
        ith_cluster_silhouette_values.sort()

        size_cluster_i = ith_cluster_silhouette_values.shape[0]
        y_upper = y_lower + size_cluster_i

        color = cm.nipy_spectral(float(i) / n_clusters)
        ax1.fill_betweenx(np.arange(y_lower, y_upper),
                         0, ith_cluster_silhouette_values,
                         facecolor=color, edgecolor=color, alpha=0.7)

        ax1.text(-0.05, y_lower + 0.5 * size_cluster_i, str(i))
        y_lower = y_upper + 10

    ax1.axvline(x=silhouette_avg, color="red", linestyle="--", label=f'平均轮廓系数: {silhouette_avg:.3f}')
    ax1.set_xlabel('轮廓系数值')
    ax1.set_ylabel('簇标签')
    ax1.set_title('各簇的轮廓图')
    ax1.legend()

    # 聚类结果散点图
    colors = cm.nipy_spectral(labels.astype(float) / n_clusters)
    ax2.scatter(X[:, 0], X[:, 1], c=colors, alpha=0.6)
    ax2.set_xlabel('特征1')
    ax2.set_ylabel('特征2')
    ax2.set_title('聚类结果可视化')

    plt.tight_layout()
    plt.show()

    return silhouette_avg

# 使用示例
kmeans = KMeans(n_clusters=4, random_state=42)
labels = kmeans.fit_predict(X)
silhouette_avg = plot_silhouette_analysis_detailed(X, labels)
```

#### Calinski-Harabasz 指数（CH 指数）

也称为方差比准则，计算簇间方差与簇内方差的比值。

$$CH = \frac{B_k / (k-1)}{W_k / (n-k)}$$

其中：
- $B_k$：簇间离散度矩阵的迹
- $W_k$：簇内离散度矩阵的迹
- $k$：簇的数量
- $n$：样本数量

CH 指数越大越好。

```python
from sklearn.metrics import calinski_harabasz_score

def evaluate_clustering_metrics(X, k_range=range(2, 11)):
    """
    计算不同 K 值下的多种聚类评估指标
    """
    silhouette_scores = []
    ch_scores = []

    for k in k_range:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)

        silhouette_scores.append(silhouette_score(X, labels))
        ch_scores.append(calinski_harabasz_score(X, labels))

    fig, axes = plt.subplots(1, 2, figsize=(12, 4))

    axes[0].plot(k_range, silhouette_scores, 'bo-', linewidth=2)
    axes[0].set_xlabel('簇的数量 K')
    axes[0].set_ylabel('轮廓系数')
    axes[0].set_title('轮廓系数 vs K')
    axes[0].grid(True, alpha=0.3)

    axes[1].plot(k_range, ch_scores, 'go-', linewidth=2)
    axes[1].set_xlabel('簇的数量 K')
    axes[1].set_ylabel('CH 指数')
    axes[1].set_title('Calinski-Harabasz 指数 vs K')
    axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    plt.show()

    best_k_silhouette = list(k_range)[np.argmax(silhouette_scores)]
    best_k_ch = list(k_range)[np.argmax(ch_scores)]

    print(f"轮廓系数最优 K: {best_k_silhouette}")
    print(f"CH 指数最优 K: {best_k_ch}")

    return silhouette_scores, ch_scores

# 评估聚类指标
silhouette_scores, ch_scores = evaluate_clustering_metrics(X)
```

#### Davies-Bouldin 指数（DB 指数）

DB 指数计算每个簇与其最相似簇的相似度平均值。

$$DB = \frac{1}{k}\sum_{i=1}^{k}\max_{j \neq i}\frac{S_i + S_j}{d(c_i, c_j)}$$

其中 $S_i$ 是簇 $i$ 内样本到质心的平均距离，$d(c_i, c_j)$ 是两个质心之间的距离。

DB 指数越小越好。

```python
from sklearn.metrics import davies_bouldin_score

# 计算 Davies-Bouldin 指数
labels = KMeans(n_clusters=4, random_state=42).fit_predict(X)
db_score = davies_bouldin_score(X, labels)
print(f"Davies-Bouldin 指数: {db_score:.4f}")
```

### 外部评估指标

外部评估指标需要真实标签，用于评估聚类结果与真实标签的一致性。

```python
from sklearn.metrics import (adjusted_rand_score, normalized_mutual_info_score,
                             adjusted_mutual_info_score, homogeneity_score,
                             completeness_score, v_measure_score)

def evaluate_external_metrics(y_true, y_pred):
    """
    计算外部评估指标
    """
    metrics = {
        '调整兰德指数 (ARI)': adjusted_rand_score(y_true, y_pred),
        '标准化互信息 (NMI)': normalized_mutual_info_score(y_true, y_pred),
        '调整互信息 (AMI)': adjusted_mutual_info_score(y_true, y_pred),
        '同质性 (Homogeneity)': homogeneity_score(y_true, y_pred),
        '完整性 (Completeness)': completeness_score(y_true, y_pred),
        'V-measure': v_measure_score(y_true, y_pred)
    }

    print("外部评估指标:")
    print("-" * 40)
    for name, score in metrics.items():
        print(f"{name}: {score:.4f}")

    return metrics

# 使用示例
y_pred = KMeans(n_clusters=4, random_state=42).fit_predict(X)
metrics = evaluate_external_metrics(y_true, y_pred)
```

### 评估指标总结

| 指标 | 类型 | 取值范围 | 最优方向 | 特点 |
|------|------|----------|----------|------|
| 轮廓系数 | 内部 | [-1, 1] | 越大越好 | 综合考虑凝聚度和分离度 |
| CH 指数 | 内部 | [0, +inf) | 越大越好 | 对凸形簇效果好 |
| DB 指数 | 内部 | [0, +inf) | 越小越好 | 对球形簇效果好 |
| ARI | 外部 | [-1, 1] | 越大越好 | 考虑随机情况的兰德指数 |
| NMI | 外部 | [0, 1] | 越大越好 | 基于信息论 |

## Scikit-learn 完整实现

### 聚类算法综合比较

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_blobs, make_moons, make_circles
from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering, SpectralClustering
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score
import warnings
warnings.filterwarnings('ignore')

def compare_clustering_algorithms(X, y_true=None, title=""):
    """
    比较不同聚类算法的效果
    """
    # 标准化数据
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # 定义聚类算法
    algorithms = {
        'K-Means': KMeans(n_clusters=3, random_state=42, n_init=10),
        'DBSCAN': DBSCAN(eps=0.5, min_samples=5),
        '层次聚类': AgglomerativeClustering(n_clusters=3),
        'GMM': GaussianMixture(n_components=3, random_state=42),
        '谱聚类': SpectralClustering(n_clusters=3, random_state=42, affinity='nearest_neighbors')
    }

    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    axes = axes.flatten()

    # 绘制真实标签（如果有）
    if y_true is not None:
        axes[0].scatter(X[:, 0], X[:, 1], c=y_true, cmap='viridis', alpha=0.6)
        axes[0].set_title(f'{title} - 真实标签')
    else:
        axes[0].scatter(X[:, 0], X[:, 1], c='gray', alpha=0.6)
        axes[0].set_title(f'{title} - 原始数据')

    # 对每种算法进行聚类
    for idx, (name, algorithm) in enumerate(algorithms.items(), 1):
        try:
            if hasattr(algorithm, 'fit_predict'):
                labels = algorithm.fit_predict(X_scaled)
            else:
                algorithm.fit(X_scaled)
                labels = algorithm.predict(X_scaled)

            # 计算轮廓系数（排除噪声点和单一簇情况）
            unique_labels = set(labels)
            if len(unique_labels - {-1}) > 1:
                score = silhouette_score(X_scaled, labels)
                score_text = f'\n轮廓系数: {score:.3f}'
            else:
                score_text = ''

            axes[idx].scatter(X[:, 0], X[:, 1], c=labels, cmap='viridis', alpha=0.6)
            axes[idx].set_title(f'{name}{score_text}')
        except Exception as e:
            axes[idx].set_title(f'{name}\n错误: {str(e)[:30]}')

    plt.tight_layout()
    plt.show()

# 生成不同类型的数据集
datasets = {
    '球形簇': make_blobs(n_samples=500, centers=3, cluster_std=0.6, random_state=42),
    '月牙形': make_moons(n_samples=500, noise=0.05, random_state=42),
    '同心圆': make_circles(n_samples=500, noise=0.05, factor=0.5, random_state=42),
    '不同密度': make_blobs(n_samples=500, centers=3, cluster_std=[0.5, 1.5, 0.8], random_state=42)
}

# 对每种数据集进行聚类算法比较
for name, (X, y) in datasets.items():
    compare_clustering_algorithms(X, y, title=name)
```

### 客户分群实战案例

```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt

# 创建模拟的客户数据
np.random.seed(42)
n_customers = 1000

# 生成客户特征
data = {
    'customer_id': range(1, n_customers + 1),
    'age': np.random.randint(18, 70, n_customers),
    'annual_income': np.random.normal(50000, 20000, n_customers).clip(10000, 150000),
    'spending_score': np.random.randint(1, 100, n_customers),
    'visit_frequency': np.random.poisson(10, n_customers),
    'avg_transaction': np.random.exponential(100, n_customers),
    'tenure_months': np.random.randint(1, 120, n_customers)
}

df = pd.DataFrame(data)
print("客户数据样本:")
print(df.head(10))
print(f"\n数据形状: {df.shape}")
print(f"\n数据统计:\n{df.describe()}")

# 选择聚类特征
features = ['age', 'annual_income', 'spending_score', 'visit_frequency',
            'avg_transaction', 'tenure_months']
X = df[features].values

# 标准化
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 使用肘部法则和轮廓系数选择最优 K
def find_optimal_k(X, k_range=range(2, 11)):
    wcss = []
    silhouette_scores = []

    for k in k_range:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)
        wcss.append(kmeans.inertia_)
        silhouette_scores.append(silhouette_score(X, labels))

    fig, axes = plt.subplots(1, 2, figsize=(12, 4))

    axes[0].plot(k_range, wcss, 'bo-')
    axes[0].set_xlabel('簇的数量 K')
    axes[0].set_ylabel('WCSS')
    axes[0].set_title('肘部法则')
    axes[0].grid(True, alpha=0.3)

    axes[1].plot(k_range, silhouette_scores, 'go-')
    axes[1].set_xlabel('簇的数量 K')
    axes[1].set_ylabel('轮廓系数')
    axes[1].set_title('轮廓系数法')
    axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    plt.show()

    return silhouette_scores

silhouette_scores = find_optimal_k(X_scaled)

# 选择 K=4 进行聚类
optimal_k = 4
kmeans = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
df['cluster'] = kmeans.fit_predict(X_scaled)

# 分析各客户群特征
cluster_analysis = df.groupby('cluster')[features].mean()
print("\n各客户群特征均值:")
print(cluster_analysis.round(2))

# 可视化（使用 PCA 降维）
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

plt.figure(figsize=(10, 8))
scatter = plt.scatter(X_pca[:, 0], X_pca[:, 1], c=df['cluster'],
                      cmap='viridis', alpha=0.6)
plt.colorbar(scatter, label='客户群')

# 标记质心
centroids_pca = pca.transform(kmeans.cluster_centers_)
plt.scatter(centroids_pca[:, 0], centroids_pca[:, 1],
            c='red', marker='X', s=200, edgecolors='black', linewidths=2)

plt.xlabel(f'主成分1 (解释方差: {pca.explained_variance_ratio_[0]:.2%})')
plt.ylabel(f'主成分2 (解释方差: {pca.explained_variance_ratio_[1]:.2%})')
plt.title('客户分群结果 (PCA 可视化)')
plt.show()

# 客户群画像
print("\n" + "=" * 50)
print("客户群画像分析")
print("=" * 50)

for cluster_id in range(optimal_k):
    cluster_data = df[df['cluster'] == cluster_id]
    print(f"\n【客户群 {cluster_id}】- 共 {len(cluster_data)} 人 ({len(cluster_data)/len(df)*100:.1f}%)")
    print(f"  平均年龄: {cluster_data['age'].mean():.1f} 岁")
    print(f"  平均年收入: ${cluster_data['annual_income'].mean():,.0f}")
    print(f"  平均消费评分: {cluster_data['spending_score'].mean():.1f}")
    print(f"  平均访问频率: {cluster_data['visit_frequency'].mean():.1f} 次/月")
    print(f"  平均交易金额: ${cluster_data['avg_transaction'].mean():,.0f}")
    print(f"  平均会员时长: {cluster_data['tenure_months'].mean():.1f} 个月")
```

### 图像颜色聚类

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans

def color_clustering_demo():
    """
    使用 K-Means 进行图像颜色聚类演示
    """
    # 创建一个示例图像（渐变色块）
    np.random.seed(42)

    # 生成一个有多种颜色的图像
    height, width = 100, 100
    image = np.zeros((height, width, 3), dtype=np.uint8)

    # 添加不同颜色的区域
    image[0:50, 0:50] = [255, 0, 0]      # 红色
    image[0:50, 50:100] = [0, 255, 0]    # 绿色
    image[50:100, 0:50] = [0, 0, 255]    # 蓝色
    image[50:100, 50:100] = [255, 255, 0]  # 黄色

    # 添加一些噪声
    noise = np.random.randint(-30, 30, image.shape)
    image = np.clip(image.astype(int) + noise, 0, 255).astype(np.uint8)

    # 将图像转换为特征矩阵
    pixels = image.reshape(-1, 3)

    # 进行不同 K 值的聚类
    k_values = [2, 4, 8, 16]

    fig, axes = plt.subplots(2, len(k_values) + 1, figsize=(15, 6))

    # 原始图像
    axes[0, 0].imshow(image)
    axes[0, 0].set_title('原始图像')
    axes[0, 0].axis('off')
    axes[1, 0].axis('off')

    for idx, k in enumerate(k_values, 1):
        # K-Means 聚类
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(pixels)

        # 用质心颜色替换像素
        compressed_pixels = kmeans.cluster_centers_[labels]
        compressed_image = compressed_pixels.reshape(image.shape).astype(np.uint8)

        # 显示压缩后的图像
        axes[0, idx].imshow(compressed_image)
        axes[0, idx].set_title(f'K = {k}')
        axes[0, idx].axis('off')

        # 显示调色板
        palette = kmeans.cluster_centers_.astype(np.uint8)
        palette_image = np.zeros((50, k * 50, 3), dtype=np.uint8)
        for i, color in enumerate(palette):
            palette_image[:, i*50:(i+1)*50] = color

        axes[1, idx].imshow(palette_image)
        axes[1, idx].set_title(f'{k} 种颜色')
        axes[1, idx].axis('off')

    plt.suptitle('使用 K-Means 进行图像颜色量化', fontsize=14)
    plt.tight_layout()
    plt.show()

# 运行演示
color_clustering_demo()
```

## 面试要点

### 常见面试问题

**Q1: K-Means 的收敛性如何保证？**

K-Means 的目标函数（WCSS）在每次迭代中单调递减，由于 WCSS 有下界（0），因此算法一定会收敛。但可能收敛到局部最优而非全局最优。

**Q2: 如何处理 K-Means 对初始化敏感的问题？**

- 使用 K-Means++ 初始化
- 多次运行，选择最优结果（`n_init` 参数）
- 使用其他初始化方法（如基于密度的初始化）

**Q3: DBSCAN 如何处理不同密度的簇？**

标准 DBSCAN 无法很好处理不同密度的簇。可以使用：
- OPTICS 算法（可以处理可变密度）
- HDBSCAN（自动选择最优密度阈值）
- 分别对不同区域使用不同的 eps 参数

**Q4: GMM 和 K-Means 的关系是什么？**

当 GMM 的所有协方差矩阵都设为 $\sigma^2 I$（各向同性，且方差相同）时，GMM 的 EM 算法与 K-Means 等价。K-Means 可以看作是 GMM 的一个特例。

**Q5: 如何选择合适的聚类算法？**

- **球形簇、大规模数据**：K-Means
- **任意形状簇、需要发现噪声**：DBSCAN
- **需要层次结构**：层次聚类
- **需要概率输出、软聚类**：GMM
- **复杂形状、中小规模**：谱聚类

**Q6: 聚类和分类的区别？**

| 特性 | 聚类 | 分类 |
|------|------|------|
| 学习类型 | 无监督 | 监督 |
| 标签 | 不需要 | 需要 |
| 目标 | 发现数据结构 | 预测标签 |
| 评估 | 内部/外部指标 | 准确率等 |

### 实战技巧总结

1. **数据预处理**：聚类前通常需要标准化数据
2. **特征选择**：选择有意义的特征，去除冗余特征
3. **多种算法对比**：不同算法可能产生不同结果
4. **参数调优**：使用网格搜索或启发式方法选择参数
5. **结果解释**：聚类结果需要业务解释才有价值
6. **可视化**：使用降维技术（PCA、t-SNE）辅助理解结果
7. **稳定性检验**：多次运行检查结果稳定性

## 延伸阅读

### 进阶算法

- **OPTICS**：可以处理可变密度的密度聚类
- **HDBSCAN**：层次化的 DBSCAN，自动选择最优参数
- **Mean Shift**：基于核密度估计的聚类
- **谱聚类（Spectral Clustering）**：基于图论的聚类方法
- **Affinity Propagation**：基于消息传递的聚类

### 推荐资源

- **书籍**：
  - 《Pattern Recognition and Machine Learning》（Bishop）- 第9章
  - 《机器学习》（周志华）- 第9章
  - 《统计学习方法》（李航）- 第14章

- **在线资源**：
  - scikit-learn 聚类文档
  - Stanford CS229 无监督学习部分
  - Coursera 机器学习专项课程

### 前沿研究方向

- **深度聚类**：结合深度学习的聚类方法（DEC、VaDE）
- **联邦聚类**：保护隐私的分布式聚类
- **流式聚类**：处理实时数据流的聚类
- **图聚类**：针对图结构数据的聚类方法

## 总结

聚类是数据挖掘和机器学习中的基础技术，本文系统介绍了四种主流聚类算法：

1. **K-Means**：简单高效，适合球形簇，需预设 K 值
2. **DBSCAN**：基于密度，可发现任意形状簇和噪声点
3. **层次聚类**：提供层次结构，便于解释，但计算开销大
4. **GMM**：概率模型，提供软聚类结果，基于高斯分布假设

选择合适的聚类算法需要考虑：
- 数据特性（规模、维度、簇的形状）
- 业务需求（是否需要概率输出、是否需要处理噪声）
- 计算资源（时间和空间复杂度要求）

实践中，建议先进行数据探索性分析，尝试多种算法进行比较，结合业务知识解读聚类结果，才能获得真正有价值的洞察。
