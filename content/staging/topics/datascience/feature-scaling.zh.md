---
title: "Feature Engineering: Feature Transformation and Dimensionality Reduction"
description: "Master feature transformation: standardization, normalization, feature crossing, and dimensionality reduction"
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - feature transformation
  - dimensionality reduction
  - PCA
  - standardization
status: imported
origin: old/src/content/docs/datascience/feature-scaling.zh.md
divergence: 0.209
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DataScience
  subcategory: FeatureEngineering
  order: 10
  lastUpdated: 2026-01-07
---

特征变换是机器学习流程中最关键的步骤之一。原始数据很少以最适合模型训练的格式出现。通过精心的特征变换，我们可以提高模型性能、减少训练时间，并从数据中提取更有意义的模式。本综合指南涵盖了每位数据科学家都应掌握的核心技术，从基本的缩放方法到高级降维算法。

## 特征变换的重要性

在深入具体技术之前，了解特征变换为何至关重要非常重要：

1. **算法要求**：许多机器学习算法假设特征在相似的尺度上。当特征经过归一化处理后，梯度下降收敛更快。

2. **基于距离的方法**：KNN、K-Means 和 SVM 等算法依赖距离计算，这些计算可能被较大量级的特征所主导。

3. **正则化公平性**：L1 和 L2 正则化对系数施加相同的惩罚，这只有在特征处于可比较的尺度时才有意义。

4. **数值稳定性**：极端值可能在计算过程中导致数值溢出或下溢。

5. **特征可解释性**：变换后的特征可以揭示隐藏在原始数据中的模式。

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.datasets import make_classification

# 演示特征缩放的影响
np.random.seed(42)

# 创建具有截然不同尺度的特征
X = np.column_stack([
    np.random.normal(0, 1, 1000),           # 特征1：尺度约为1
    np.random.normal(1000, 100, 1000),      # 特征2：尺度约为1000
    np.random.normal(0.001, 0.0001, 1000)   # 特征3：尺度约为0.001
])
y = (X[:, 0] + X[:, 1]/1000 + X[:, 2]*1000 > 1).astype(int)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 不进行缩放
model_unscaled = LogisticRegression(max_iter=1000)
model_unscaled.fit(X_train, y_train)
print(f"不缩放时的准确率: {model_unscaled.score(X_test, y_test):.4f}")
print(f"系数: {model_unscaled.coef_[0]}")

# 进行缩放
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model_scaled = LogisticRegression(max_iter=1000)
model_scaled.fit(X_train_scaled, y_train)
print(f"\n缩放后的准确率: {model_scaled.score(X_test_scaled, y_test):.4f}")
print(f"系数: {model_scaled.coef_[0]}")
```

## 标准化与归一化

"标准化"和"归一化"这两个术语经常被交替使用，但它们指的是不同的变换。理解何时使用每种方法对于有效的特征工程至关重要。

### 标准化（Z-Score 归一化）

标准化将特征变换为零均值和单位方差。该技术基于特征服从高斯分布的假设。

$$z = \frac{x - \mu}{\sigma}$$

其中：
- $x$ 是原始值
- $\mu$ 是特征的均值
- $\sigma$ 是特征的标准差

**何时使用标准化：**
- 当特征大致服从高斯分布时
- 对于假设数据以零为中心的算法（PCA、许多神经网络）
- 当离群值应保持其相对位置时
- 对于正则化模型（Ridge、Lasso、Elastic Net）

```python
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd

# 创建具有不同分布的样本数据
np.random.seed(42)
data = pd.DataFrame({
    'age': np.random.normal(35, 10, 1000),
    'income': np.random.normal(50000, 15000, 1000),
    'score': np.random.normal(75, 12, 1000)
})

print("原始数据统计:")
print(data.describe())

# 应用标准化
scaler = StandardScaler()
data_standardized = pd.DataFrame(
    scaler.fit_transform(data),
    columns=data.columns
)

print("\n标准化后的数据统计:")
print(data_standardized.describe())

# 验证：均值应约为0，标准差应约为1
print(f"\n验证 - 均值: {data_standardized.mean().values}")
print(f"验证 - 标准差:  {data_standardized.std().values}")

# 重要：保存缩放器参数供后续使用
print(f"\n缩放器均值: {scaler.mean_}")
print(f"缩放器标准差:  {scaler.scale_}")

# 使用相同参数变换新数据
new_data = pd.DataFrame({
    'age': [25, 45, 60],
    'income': [30000, 70000, 100000],
    'score': [60, 80, 95]
})
new_data_standardized = scaler.transform(new_data)
print(f"\n新数据变换后:\n{new_data_standardized}")
```

### 最小-最大归一化

最小-最大归一化将特征缩放到固定范围，通常是 [0, 1] 或 [-1, 1]。

$$x_{norm} = \frac{x - x_{min}}{x_{max} - x_{min}}$$

对于自定义范围 [a, b]：

$$x_{scaled} = a + \frac{(x - x_{min})(b - a)}{x_{max} - x_{min}}$$

**何时使用最小-最大归一化：**
- 当需要有界值时（例如图像像素、神经网络输入）
- 当分布不是高斯分布时
- 当希望保留零值时
- 对于期望输入在特定范围内的算法

```python
from sklearn.preprocessing import MinMaxScaler

# 样本数据
np.random.seed(42)
data = pd.DataFrame({
    'feature_a': np.random.exponential(5, 1000),
    'feature_b': np.random.uniform(10, 100, 1000),
    'feature_c': np.random.beta(2, 5, 1000) * 50
})

print("原始数据范围:")
print(f"最小值:\n{data.min()}")
print(f"最大值:\n{data.max()}")

# 默认 [0, 1] 范围
scaler_01 = MinMaxScaler()
data_01 = pd.DataFrame(
    scaler_01.fit_transform(data),
    columns=data.columns
)

print("\n归一化到 [0, 1]:")
print(f"最小值:\n{data_01.min()}")
print(f"最大值:\n{data_01.max()}")

# 自定义 [-1, 1] 范围
scaler_11 = MinMaxScaler(feature_range=(-1, 1))
data_11 = pd.DataFrame(
    scaler_11.fit_transform(data),
    columns=data.columns
)

print("\n归一化到 [-1, 1]:")
print(f"最小值:\n{data_11.min()}")
print(f"最大值:\n{data_11.max()}")
```

### 鲁棒缩放

鲁棒缩放使用对离群值稳健的统计量：中位数和四分位距（IQR）。

$$x_{robust} = \frac{x - Q_{50}}{Q_{75} - Q_{25}}$$

**何时使用鲁棒缩放：**
- 当数据包含显著的离群值时
- 当希望减少极端值的影响时
- 对于离群值是有效数据点（而非错误）的数据集

```python
from sklearn.preprocessing import RobustScaler

# 创建包含离群值的数据
np.random.seed(42)
normal_data = np.random.normal(50, 10, 1000)
outliers = np.array([200, 250, 300, -100, -150])
data_with_outliers = np.concatenate([normal_data, outliers]).reshape(-1, 1)

# 比较不同的缩放器
scalers = {
    'StandardScaler': StandardScaler(),
    'MinMaxScaler': MinMaxScaler(),
    'RobustScaler': RobustScaler()
}

fig, axes = plt.subplots(2, 2, figsize=(12, 10))
axes = axes.flatten()

# 原始数据
axes[0].hist(data_with_outliers, bins=50, edgecolor='black')
axes[0].set_title('原始数据（含离群值）')
axes[0].axvline(x=np.median(data_with_outliers), color='r', linestyle='--', label='中位数')
axes[0].legend()

for i, (name, scaler) in enumerate(scalers.items(), 1):
    scaled_data = scaler.fit_transform(data_with_outliers)
    axes[i].hist(scaled_data, bins=50, edgecolor='black')
    axes[i].set_title(f'{name}')
    axes[i].axvline(x=np.median(scaled_data), color='r', linestyle='--')

plt.tight_layout()
plt.show()

# 定量比较
print("离群值对不同缩放器的影响:")
print("-" * 60)
for name, scaler in scalers.items():
    scaled = scaler.fit_transform(data_with_outliers)
    print(f"{name:20} - 范围: [{scaled.min():.2f}, {scaled.max():.2f}], "
          f"均值: {scaled.mean():.2f}, 中位数: {np.median(scaled):.2f}")
```

### 比较与选择指南

| 缩放器 | 保留离群值 | 有界输出 | 处理稀疏数据 | 最适用于 |
|--------|-----------|---------|-------------|----------|
| StandardScaler | 是 | 否 | 是（with_mean=False） | 类高斯数据、PCA |
| MinMaxScaler | 否 | 是 | 否 | 神经网络、图像数据 |
| RobustScaler | 否 | 否 | 是 | 含离群值的数据 |
| MaxAbsScaler | 是 | [-1, 1] | 是 | 稀疏数据 |

```python
from sklearn.preprocessing import MaxAbsScaler

# 缩放器选择决策框架
def recommend_scaler(data, has_outliers=False, needs_bounded=False,
                     is_sparse=False, is_gaussian=True):
    """
    根据数据特征推荐适当的缩放器。
    """
    recommendations = []

    if is_sparse:
        recommendations.append("MaxAbsScaler（保持稀疏性）")
        if has_outliers:
            recommendations.append("RobustScaler（with_centering=False）")
    elif has_outliers:
        recommendations.append("RobustScaler（对离群值稳健）")
    elif needs_bounded:
        recommendations.append("MinMaxScaler（有界输出）")
    elif is_gaussian:
        recommendations.append("StandardScaler（对高斯数据最优）")
    else:
        recommendations.append("MinMaxScaler 或 QuantileTransformer")

    return recommendations

# 示例用法
print("场景1：含离群值的数据")
print(recommend_scaler(None, has_outliers=True))

print("\n场景2：神经网络输入")
print(recommend_scaler(None, needs_bounded=True))

print("\n场景3：稀疏文本数据")
print(recommend_scaler(None, is_sparse=True))
```

## 数值变换

除了缩放之外，各种数学变换可以帮助正态化分布、稳定方差并提高模型性能。

### 对数变换

对数变换对右偏数据（正偏度）有效。它压缩大值并扩展小值。

$$x_{log} = \log(x + c)$$

其中 $c$ 是一个常数（通常为1），用于处理零值。

**何时使用：**
- 右偏分布（收入、人口、价格）
- 乘法关系
- 当方差随均值增加时
- 跨越多个数量级的数据

```python
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# 生成右偏数据（如收入或房价）
np.random.seed(42)
skewed_data = np.random.lognormal(mean=10, sigma=1, size=5000)

# 对数变换
log_data = np.log1p(skewed_data)  # log(1 + x) 用于处理潜在的零值

fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# 原始分布
axes[0, 0].hist(skewed_data, bins=50, edgecolor='black', density=True)
axes[0, 0].set_title(f'原始数据（偏度: {stats.skew(skewed_data):.2f}）')
axes[0, 0].set_xlabel('值')

# 对数变换后的分布
axes[0, 1].hist(log_data, bins=50, edgecolor='black', density=True)
axes[0, 1].set_title(f'对数变换后（偏度: {stats.skew(log_data):.2f}）')
axes[0, 1].set_xlabel('log(1 + 值)')

# Q-Q 图
stats.probplot(skewed_data, dist="norm", plot=axes[1, 0])
axes[1, 0].set_title('Q-Q图：原始数据')

stats.probplot(log_data, dist="norm", plot=axes[1, 1])
axes[1, 1].set_title('Q-Q图：对数变换后')

plt.tight_layout()
plt.show()

# 实际示例：房价
house_prices = pd.DataFrame({
    'price': [150000, 200000, 175000, 450000, 280000, 1200000, 350000, 195000],
    'sqft': [1200, 1500, 1350, 2800, 1800, 4500, 2200, 1400]
})

house_prices['log_price'] = np.log1p(house_prices['price'])
house_prices['log_sqft'] = np.log1p(house_prices['sqft'])

print("房价数据:")
print(house_prices)
print(f"\n原始价格偏度: {stats.skew(house_prices['price']):.2f}")
print(f"对数价格偏度: {stats.skew(house_prices['log_price']):.2f}")
```

### Box-Cox 变换

Box-Cox 变换是一系列幂变换，可以处理广泛的分布。它找到最优的 lambda 值来正态化数据。

$$y(\lambda) = \begin{cases}
\frac{x^\lambda - 1}{\lambda} & \text{如果 } \lambda \neq 0 \\
\ln(x) & \text{如果 } \lambda = 0
\end{cases}$$

**要求：**
- 数据必须严格为正（x > 0）
- Scikit-learn 的 PowerTransformer 可以使用 Yeo-Johnson 处理零值和负值

```python
from sklearn.preprocessing import PowerTransformer
from scipy import stats
import numpy as np

# 生成各种偏态分布
np.random.seed(42)
distributions = {
    '右偏': np.random.exponential(2, 1000),
    '左偏': 10 - np.random.exponential(2, 1000),
    '重尾': np.random.standard_t(df=3, size=1000)
}

fig, axes = plt.subplots(3, 3, figsize=(15, 12))

for i, (name, data) in enumerate(distributions.items()):
    # 原始数据
    axes[i, 0].hist(data, bins=50, edgecolor='black', density=True)
    axes[i, 0].set_title(f'{name} - 原始\n偏度: {stats.skew(data):.2f}')

    # Box-Cox（正数据）或 Yeo-Johnson
    pt_bc = PowerTransformer(method='yeo-johnson')
    data_bc = pt_bc.fit_transform(data.reshape(-1, 1)).flatten()
    axes[i, 1].hist(data_bc, bins=50, edgecolor='black', density=True)
    axes[i, 1].set_title(f'Yeo-Johnson (lambda={pt_bc.lambdas_[0]:.2f})\n偏度: {stats.skew(data_bc):.2f}')

    # 标准正态分布作为参考
    normal_data = np.random.normal(0, 1, 1000)
    axes[i, 2].hist(normal_data, bins=50, edgecolor='black', density=True)
    axes[i, 2].set_title(f'标准正态\n偏度: {stats.skew(normal_data):.2f}')

plt.tight_layout()
plt.show()

# 严格正数据的 Box-Cox
positive_data = np.random.exponential(5, 1000) + 0.1
boxcox_data, fitted_lambda = stats.boxcox(positive_data)
print(f"Box-Cox 最优 lambda: {fitted_lambda:.4f}")
print(f"原始偏度: {stats.skew(positive_data):.4f}")
print(f"变换后偏度: {stats.skew(boxcox_data):.4f}")
```

### 分位数变换

分位数变换使用分位数函数将数据映射到指定的分布（均匀分布或正态分布）。这是一种非线性变换，可以处理任何分布。

```python
from sklearn.preprocessing import QuantileTransformer

# 创建严重偏态数据
np.random.seed(42)
skewed = np.random.exponential(3, 5000).reshape(-1, 1)

# 变换为均匀分布
qt_uniform = QuantileTransformer(output_distribution='uniform', random_state=42)
uniform_data = qt_uniform.fit_transform(skewed)

# 变换为正态分布
qt_normal = QuantileTransformer(output_distribution='normal', random_state=42)
normal_data = qt_normal.fit_transform(skewed)

fig, axes = plt.subplots(1, 3, figsize=(15, 4))

axes[0].hist(skewed, bins=50, edgecolor='black', density=True)
axes[0].set_title(f'原始数据（偏度: {stats.skew(skewed.flatten()):.2f}）')

axes[1].hist(uniform_data, bins=50, edgecolor='black', density=True)
axes[1].set_title('分位数变换 -> 均匀分布')

axes[2].hist(normal_data, bins=50, edgecolor='black', density=True)
axes[2].set_title(f'分位数变换 -> 正态分布（偏度: {stats.skew(normal_data.flatten()):.2f}）')

plt.tight_layout()
plt.show()

# 重要：QuantileTransformer 对新数据中的离群值敏感
print("注意：超出训练范围的值将被裁剪到最小/最大分位数")
```

### 变换选择指南

| 变换 | 最适用于 | 处理零值 | 处理负值 | 可解释性 |
|------|---------|---------|---------|----------|
| 对数 | 右偏、乘法关系 | 需加 +c | 否 | 是 |
| 平方根 | 计数数据、中等偏态 | 是 | 否 | 是 |
| Box-Cox | 各种偏态，需要最优值 | 否（需位移） | 否 | Lambda 值 |
| Yeo-Johnson | 各种偏态 | 是 | 是 | Lambda 值 |
| 分位数 | 任何分布 | 是 | 是 | 否 |

```python
# 综合变换比较函数
def compare_transformations(data, title="变换比较"):
    """在同一数据上比较多种变换方法。"""
    from sklearn.preprocessing import FunctionTransformer

    transformations = {
        '原始': data.copy(),
        'Log(1+x)': np.log1p(np.maximum(data, 0)),
        'Sqrt': np.sqrt(np.maximum(data, 0)),
        'Yeo-Johnson': PowerTransformer(method='yeo-johnson').fit_transform(data.reshape(-1, 1)).flatten(),
        '分位数-正态': QuantileTransformer(output_distribution='normal', random_state=42).fit_transform(data.reshape(-1, 1)).flatten()
    }

    fig, axes = plt.subplots(1, len(transformations), figsize=(20, 4))

    for ax, (name, transformed) in zip(axes, transformations.items()):
        ax.hist(transformed, bins=50, edgecolor='black', density=True)
        skewness = stats.skew(transformed[~np.isnan(transformed)])
        ax.set_title(f'{name}\n偏度: {skewness:.2f}')

    plt.suptitle(title, fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.show()

# 示例用法
np.random.seed(42)
test_data = np.random.lognormal(3, 1.5, 3000)
compare_transformations(test_data, "类收入数据")
```

## 特征交叉与交互

特征交叉通过组合现有特征来创建新特征。这可以捕获线性模型无法直接学习的非线性关系和交互作用。

### 手动特征交叉

```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import PolynomialFeatures

# 电商数据示例
np.random.seed(42)
data = pd.DataFrame({
    'user_age': np.random.randint(18, 65, 1000),
    'session_duration': np.random.exponential(10, 1000),
    'pages_viewed': np.random.poisson(5, 1000),
    'is_mobile': np.random.binomial(1, 0.6, 1000),
    'day_of_week': np.random.randint(0, 7, 1000)
})

# 手动特征交叉
data['age_x_duration'] = data['user_age'] * data['session_duration']
data['pages_per_minute'] = data['pages_viewed'] / (data['session_duration'] + 1)
data['mobile_duration'] = data['is_mobile'] * data['session_duration']
data['is_weekend'] = (data['day_of_week'] >= 5).astype(int)
data['weekend_x_mobile'] = data['is_weekend'] * data['is_mobile']

# 年龄分箱用于分类交叉
data['age_group'] = pd.cut(data['user_age'],
                           bins=[0, 25, 35, 50, 100],
                           labels=['青年', '成年', '中年', '老年'])

print("创建的特征交叉:")
print(data.head())
print(f"\n新特征统计:")
print(data[['age_x_duration', 'pages_per_minute', 'mobile_duration']].describe())
```

### 多项式特征

多项式特征自动生成高阶项和交互项。

```python
from sklearn.preprocessing import PolynomialFeatures

# 简单示例
X = np.array([[1, 2], [3, 4], [5, 6]])

# 2次多项式特征
poly = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly.fit_transform(X)

print("原始特征: x1, x2")
print(X)
print(f"\n多项式特征: {poly.get_feature_names_out(['x1', 'x2'])}")
print(X_poly)

# 实际示例：预测房价
np.random.seed(42)
n_samples = 500

sqft = np.random.uniform(800, 3000, n_samples)
bedrooms = np.random.randint(1, 6, n_samples)
bathrooms = np.random.randint(1, 4, n_samples)

# 真实关系包含交互项
true_price = (100 * sqft +
              20000 * bedrooms +
              15000 * bathrooms +
              50 * sqft * bedrooms / 1000 +  # 交互项
              0.01 * sqft ** 2 / 1000 +      # 非线性项
              np.random.normal(0, 20000, n_samples))

X = np.column_stack([sqft, bedrooms, bathrooms])
y = true_price

from sklearn.linear_model import LinearRegression
from sklearn.model_selection import cross_val_score

# 不使用多项式特征
lr_simple = LinearRegression()
scores_simple = cross_val_score(lr_simple, X, y, cv=5, scoring='r2')
print(f"\n线性模型 R2: {scores_simple.mean():.4f} (+/- {scores_simple.std()*2:.4f})")

# 使用多项式特征
poly = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly.fit_transform(X)
lr_poly = LinearRegression()
scores_poly = cross_val_score(lr_poly, X_poly, y, cv=5, scoring='r2')
print(f"多项式模型 R2: {scores_poly.mean():.4f} (+/- {scores_poly.std()*2:.4f})")

print(f"\n生成的多项式特征数: {X_poly.shape[1]}")
print(f"特征名称: {poly.get_feature_names_out(['sqft', 'beds', 'baths'])}")
```

### 分类变量的特征交叉

```python
import pandas as pd
from sklearn.preprocessing import OneHotEncoder

# 分类数据
data = pd.DataFrame({
    'color': ['red', 'blue', 'green', 'red', 'blue'],
    'size': ['S', 'M', 'L', 'M', 'S'],
    'material': ['cotton', 'silk', 'cotton', 'wool', 'silk']
})

# 创建交叉特征
data['color_size'] = data['color'] + '_' + data['size']
data['full_combo'] = data['color'] + '_' + data['size'] + '_' + data['material']

print("原始 + 交叉特征:")
print(data)

# 对交叉特征进行独热编码
encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
crossed_encoded = encoder.fit_transform(data[['color_size']])
print(f"\n独热编码后的交叉特征形状: {crossed_encoded.shape}")
print(f"类别: {encoder.categories_[0]}")
```

### 实践中的交互特征

```python
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV
from sklearn.datasets import make_classification

# 创建具有交互的分类问题
np.random.seed(42)
X, y = make_classification(n_samples=1000, n_features=4, n_informative=2,
                           n_redundant=0, random_state=42)

# 添加有意义的特征名称
feature_names = ['feature_A', 'feature_B', 'feature_C', 'feature_D']

# 包含多项式特征的流水线
pipeline = Pipeline([
    ('poly', PolynomialFeatures(include_bias=False)),
    ('scaler', StandardScaler()),
    ('classifier', LogisticRegression(max_iter=1000))
])

# 网格搜索最优多项式阶数
param_grid = {
    'poly__degree': [1, 2, 3],
    'poly__interaction_only': [True, False],
    'classifier__C': [0.1, 1, 10]
}

grid_search = GridSearchCV(pipeline, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
grid_search.fit(X, y)

print(f"最佳参数: {grid_search.best_params_}")
print(f"最佳交叉验证准确率: {grid_search.best_score_:.4f}")

# 具有交互的特征重要性
best_model = grid_search.best_estimator_
poly = best_model.named_steps['poly']
classifier = best_model.named_steps['classifier']

feature_names_poly = poly.get_feature_names_out(feature_names)
coef_importance = pd.DataFrame({
    'feature': feature_names_poly,
    'coefficient': classifier.coef_[0]
}).sort_values('coefficient', key=abs, ascending=False)

print("\n前10个最重要的特征（按系数绝对值）:")
print(coef_importance.head(10))
```

## 主成分分析（PCA）

PCA 是使用最广泛的降维技术。它找到正交方向（主成分），这些方向最大化数据中的方差。

### PCA 基础

PCA 的工作原理：
1. 中心化数据（减去均值）
2. 计算协方差矩阵
3. 找到特征值和特征向量
4. 将数据投影到前 k 个特征向量上

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

# 生成相关的二维数据
np.random.seed(42)
n_samples = 500

# 创建相关特征
mean = [0, 0]
cov = [[1, 0.8], [0.8, 1]]
X = np.random.multivariate_normal(mean, cov, n_samples)

# 拟合 PCA
pca = PCA()
X_pca = pca.fit_transform(X)

# 可视化
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# 带主成分的原始数据
axes[0].scatter(X[:, 0], X[:, 1], alpha=0.5)
origin = pca.mean_
for i, (comp, var) in enumerate(zip(pca.components_, pca.explained_variance_)):
    axes[0].annotate('', xy=origin + comp * np.sqrt(var) * 2,
                     xytext=origin,
                     arrowprops=dict(arrowstyle='->', color='red', lw=2))
axes[0].set_xlabel('特征 1')
axes[0].set_ylabel('特征 2')
axes[0].set_title('带主成分的原始数据')
axes[0].axis('equal')

# 变换后的数据
axes[1].scatter(X_pca[:, 0], X_pca[:, 1], alpha=0.5)
axes[1].set_xlabel('PC1')
axes[1].set_ylabel('PC2')
axes[1].set_title('PCA 变换后的数据')
axes[1].axis('equal')

# 解释方差
axes[2].bar([1, 2], pca.explained_variance_ratio_, color='steelblue')
axes[2].set_xlabel('主成分')
axes[2].set_ylabel('解释方差比例')
axes[2].set_title(f'总解释方差: {sum(pca.explained_variance_ratio_)*100:.1f}%')

plt.tight_layout()
plt.show()

print(f"解释方差比例: {pca.explained_variance_ratio_}")
print(f"成分:\n{pca.components_}")
```

### 选择成分数量

```python
from sklearn.datasets import load_digits

# 加载高维数据
digits = load_digits()
X = digits.data
y = digits.target

print(f"原始数据形状: {X.shape}")

# PCA 之前标准化
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 使用所有成分拟合 PCA
pca_full = PCA()
pca_full.fit(X_scaled)

# 绘制累积解释方差
cumulative_variance = np.cumsum(pca_full.explained_variance_ratio_)

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# 碎石图
axes[0].plot(range(1, len(pca_full.explained_variance_ratio_) + 1),
             pca_full.explained_variance_ratio_, 'bo-')
axes[0].set_xlabel('主成分')
axes[0].set_ylabel('解释方差比例')
axes[0].set_title('碎石图')

# 累积方差
axes[1].plot(range(1, len(cumulative_variance) + 1), cumulative_variance, 'ro-')
axes[1].axhline(y=0.95, color='k', linestyle='--', label='95% 阈值')
axes[1].axhline(y=0.99, color='g', linestyle='--', label='99% 阈值')
axes[1].set_xlabel('成分数量')
axes[1].set_ylabel('累积解释方差')
axes[1].set_title('累积解释方差')
axes[1].legend()

plt.tight_layout()
plt.show()

# 找到不同阈值所需的成分数量
for threshold in [0.90, 0.95, 0.99]:
    n_components = np.argmax(cumulative_variance >= threshold) + 1
    print(f"{threshold*100:.0f}% 方差需要 {n_components} 个成分解释")

# 使用方差阈值自动选择
pca_auto = PCA(n_components=0.95)
X_reduced = pca_auto.fit_transform(X_scaled)
print(f"\n使用 95% 方差阈值:")
print(f"  成分数: {pca_auto.n_components_}")
print(f"  降维后形状: {X_reduced.shape}")
```

### 用于可视化的 PCA

```python
from sklearn.datasets import load_iris, fetch_openml
from sklearn.decomposition import PCA

# 加载鸢尾花数据集
iris = load_iris()
X, y = iris.data, iris.target

# 标准化并应用 PCA
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

# 可视化
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# 二维 PCA 图
scatter = axes[0].scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap='viridis', alpha=0.7)
axes[0].set_xlabel(f'PC1 ({pca.explained_variance_ratio_[0]*100:.1f}%)')
axes[0].set_ylabel(f'PC2 ({pca.explained_variance_ratio_[1]*100:.1f}%)')
axes[0].set_title('鸢尾花数据集 - PCA 投影')
plt.colorbar(scatter, ax=axes[0], label='物种')

# 特征载荷
feature_names = iris.feature_names
loadings = pd.DataFrame(
    pca.components_.T,
    columns=['PC1', 'PC2'],
    index=feature_names
)

loadings.plot(kind='bar', ax=axes[1])
axes[1].set_title('特征载荷')
axes[1].set_ylabel('载荷')
axes[1].legend(title='成分')
plt.xticks(rotation=45, ha='right')

plt.tight_layout()
plt.show()

print("\n特征载荷:")
print(loadings)

# 解释：哪些特征对每个成分贡献最大？
for i, pc in enumerate(['PC1', 'PC2']):
    top_features = loadings[pc].abs().sort_values(ascending=False).head(2)
    print(f"\n{pc} 主要贡献者: {list(top_features.index)}")
```

### 机器学习流水线中的 PCA

```python
from sklearn.pipeline import Pipeline
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, cross_val_score
from sklearn.datasets import load_digits

# 加载数据
digits = load_digits()
X, y = digits.data, digits.target

# 创建流水线
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('pca', PCA()),
    ('classifier', LogisticRegression(max_iter=1000))
])

# 网格搜索最优成分数量
param_grid = {
    'pca__n_components': [10, 20, 30, 40, 50, 60],
    'classifier__C': [0.1, 1, 10]
}

grid_search = GridSearchCV(pipeline, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
grid_search.fit(X, y)

print(f"最佳参数: {grid_search.best_params_}")
print(f"最佳交叉验证准确率: {grid_search.best_score_:.4f}")

# 与全部特征比较
pipeline_full = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', LogisticRegression(max_iter=1000, C=grid_search.best_params_['classifier__C']))
])
scores_full = cross_val_score(pipeline_full, X, y, cv=5, scoring='accuracy')

print(f"\n全部特征（{X.shape[1]} 维）准确率: {scores_full.mean():.4f}")
print(f"PCA（{grid_search.best_params_['pca__n_components']} 维）准确率: {grid_search.best_score_:.4f}")
print(f"降维比例: {100*(1 - grid_search.best_params_['pca__n_components']/X.shape[1]):.1f}%")
```

## t-SNE 和 UMAP 可视化

虽然 PCA 对线性降维有效，但 t-SNE 和 UMAP 擅长保留局部结构并揭示非线性数据中的聚类。

### t-SNE（t-分布随机邻域嵌入）

t-SNE 将高维距离转换为概率分布，并最小化高维和低维分布之间的 KL 散度。

```python
from sklearn.manifold import TSNE
from sklearn.datasets import load_digits
import matplotlib.pyplot as plt

# 加载数据
digits = load_digits()
X, y = digits.data, digits.target

# 应用 t-SNE
tsne = TSNE(n_components=2, random_state=42, perplexity=30, n_iter=1000)
X_tsne = tsne.fit_transform(X)

# 可视化
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

# t-SNE 可视化
scatter = axes[0].scatter(X_tsne[:, 0], X_tsne[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
axes[0].set_xlabel('t-SNE 1')
axes[0].set_ylabel('t-SNE 2')
axes[0].set_title('数字数据集的 t-SNE 可视化')
plt.colorbar(scatter, ax=axes[0], label='数字')

# 与 PCA 比较
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X)
scatter2 = axes[1].scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
axes[1].set_xlabel('PC1')
axes[1].set_ylabel('PC2')
axes[1].set_title('数字数据集的 PCA 可视化')
plt.colorbar(scatter2, ax=axes[1], label='数字')

plt.tight_layout()
plt.show()

print("t-SNE 揭示了 PCA 无法发现的清晰聚类结构")
```

### t-SNE 超参数调优

```python
# 困惑度影响局部和全局结构之间的平衡
perplexities = [5, 30, 50, 100]

fig, axes = plt.subplots(2, 2, figsize=(12, 12))
axes = axes.flatten()

for ax, perp in zip(axes, perplexities):
    tsne = TSNE(n_components=2, perplexity=perp, random_state=42, n_iter=1000)
    X_embedded = tsne.fit_transform(X)

    scatter = ax.scatter(X_embedded[:, 0], X_embedded[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
    ax.set_title(f'困惑度 = {perp}')
    ax.set_xlabel('t-SNE 1')
    ax.set_ylabel('t-SNE 2')

plt.suptitle('困惑度对 t-SNE 的影响', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()

print("困惑度指南:")
print("- 典型范围: 5-50")
print("- 较大数据集可能受益于较高困惑度")
print("- 较低困惑度强调局部结构")
print("- 较高困惑度强调全局结构")
```

### UMAP（均匀流形近似和投影）

UMAP 通常比 t-SNE 更快，且更好地保留全局结构。它已成为许多应用的首选方法。

```python
# 注意：UMAP 需要安装: pip install umap-learn
try:
    import umap

    # 应用 UMAP
    reducer = umap.UMAP(n_components=2, random_state=42, n_neighbors=15, min_dist=0.1)
    X_umap = reducer.fit_transform(X)

    # 比较三种方法
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))

    # PCA
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X)
    axes[0].scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
    axes[0].set_title('PCA')

    # t-SNE
    tsne = TSNE(n_components=2, random_state=42, perplexity=30)
    X_tsne = tsne.fit_transform(X)
    axes[1].scatter(X_tsne[:, 0], X_tsne[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
    axes[1].set_title('t-SNE')

    # UMAP
    axes[2].scatter(X_umap[:, 0], X_umap[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
    axes[2].set_title('UMAP')

    plt.suptitle('降维方法比较', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.show()

except ImportError:
    print("UMAP 未安装。请使用以下命令安装: pip install umap-learn")
    print("\nUMAP 示例代码:")
    print("""
import umap

reducer = umap.UMAP(
    n_components=2,      # 输出维度
    n_neighbors=15,      # 局部邻域大小
    min_dist=0.1,        # 点之间的最小距离
    metric='euclidean',  # 距离度量
    random_state=42
)
X_umap = reducer.fit_transform(X)
""")
```

### 何时使用每种方法

| 方法 | 最适用于 | 速度 | 保留全局结构 | 保留局部结构 |
|------|---------|------|-------------|-------------|
| PCA | 线性关系、预处理 | 快 | 是 | 有限 |
| t-SNE | 聚类可视化 | 慢 | 差 | 优秀 |
| UMAP | 通用可视化、聚类 | 快 | 好 | 优秀 |

```python
# 实用建议
def recommend_reduction_method(n_samples, n_features, purpose):
    """推荐适当的降维方法。"""
    recommendations = []

    if purpose == 'preprocessing':
        recommendations.append("PCA - 快速、可逆、适合去噪")
        if n_features > 100:
            recommendations.append("考虑对稀疏数据使用 Truncated SVD")

    elif purpose == 'visualization':
        if n_samples < 5000:
            recommendations.append("t-SNE - 最佳局部结构，尝试困惑度 5-50")
        recommendations.append("UMAP - 更快，保留更多全局结构")

    elif purpose == 'clustering':
        recommendations.append("UMAP - 更适合下游聚类任务")
        recommendations.append("PCA - 如果数据具有线性关系")

    return recommendations

# 示例
print("对于 10000 个样本，500 个特征:")
print("\n用于预处理:")
print(recommend_reduction_method(10000, 500, 'preprocessing'))
print("\n用于可视化:")
print(recommend_reduction_method(10000, 500, 'visualization'))
```

## 基于自编码器的降维

自编码器是学习数据压缩表示的神经网络。它们可以捕获 PCA 无法捕获的非线性关系。

### 基本自编码器架构

```python
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
from sklearn.datasets import load_digits
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# 加载和准备数据
digits = load_digits()
X = digits.data
y = digits.target

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# 定义自编码器架构
input_dim = X.shape[1]  # 64
encoding_dim = 2  # 用于可视化

# 编码器
inputs = keras.Input(shape=(input_dim,))
encoded = layers.Dense(32, activation='relu')(inputs)
encoded = layers.Dense(16, activation='relu')(encoded)
encoded = layers.Dense(encoding_dim, activation='linear')(encoded)

# 解码器
decoded = layers.Dense(16, activation='relu')(encoded)
decoded = layers.Dense(32, activation='relu')(decoded)
decoded = layers.Dense(input_dim, activation='linear')(decoded)

# 模型
autoencoder = Model(inputs, decoded)
encoder = Model(inputs, encoded)

# 编译和训练
autoencoder.compile(optimizer='adam', loss='mse')
history = autoencoder.fit(
    X_train, X_train,
    epochs=100,
    batch_size=32,
    validation_data=(X_test, X_test),
    verbose=0
)

# 绘制训练历史
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# 损失曲线
axes[0].plot(history.history['loss'], label='训练损失')
axes[0].plot(history.history['val_loss'], label='验证损失')
axes[0].set_xlabel('轮次')
axes[0].set_ylabel('MSE 损失')
axes[0].set_title('自编码器训练')
axes[0].legend()

# 编码表示
X_encoded = encoder.predict(X_scaled, verbose=0)
scatter = axes[1].scatter(X_encoded[:, 0], X_encoded[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
axes[1].set_xlabel('编码维度 1')
axes[1].set_ylabel('编码维度 2')
axes[1].set_title('自编码器 2D 编码')
plt.colorbar(scatter, ax=axes[1], label='数字')

plt.tight_layout()
plt.show()

print(f"最终训练损失: {history.history['loss'][-1]:.4f}")
print(f"最终验证损失: {history.history['val_loss'][-1]:.4f}")
```

### 变分自编码器（VAE）

VAE 学习概率潜在空间，使其对生成和更结构化的表示很有用。

```python
from tensorflow.keras import backend as K

# 采样层
class Sampling(layers.Layer):
    def call(self, inputs):
        z_mean, z_log_var = inputs
        batch = tf.shape(z_mean)[0]
        dim = tf.shape(z_mean)[1]
        epsilon = tf.random.normal(shape=(batch, dim))
        return z_mean + tf.exp(0.5 * z_log_var) * epsilon

# VAE 架构
latent_dim = 2
input_dim = X.shape[1]

# 编码器
encoder_inputs = keras.Input(shape=(input_dim,))
x = layers.Dense(32, activation='relu')(encoder_inputs)
x = layers.Dense(16, activation='relu')(x)
z_mean = layers.Dense(latent_dim, name='z_mean')(x)
z_log_var = layers.Dense(latent_dim, name='z_log_var')(x)
z = Sampling()([z_mean, z_log_var])

encoder_vae = Model(encoder_inputs, [z_mean, z_log_var, z], name='encoder')

# 解码器
latent_inputs = keras.Input(shape=(latent_dim,))
x = layers.Dense(16, activation='relu')(latent_inputs)
x = layers.Dense(32, activation='relu')(x)
decoder_outputs = layers.Dense(input_dim, activation='linear')(x)

decoder_vae = Model(latent_inputs, decoder_outputs, name='decoder')

# VAE 模型
class VAE(Model):
    def __init__(self, encoder, decoder, **kwargs):
        super().__init__(**kwargs)
        self.encoder = encoder
        self.decoder = decoder
        self.total_loss_tracker = keras.metrics.Mean(name='total_loss')
        self.reconstruction_loss_tracker = keras.metrics.Mean(name='reconstruction_loss')
        self.kl_loss_tracker = keras.metrics.Mean(name='kl_loss')

    @property
    def metrics(self):
        return [self.total_loss_tracker, self.reconstruction_loss_tracker, self.kl_loss_tracker]

    def train_step(self, data):
        with tf.GradientTape() as tape:
            z_mean, z_log_var, z = self.encoder(data)
            reconstruction = self.decoder(z)
            reconstruction_loss = tf.reduce_mean(
                keras.losses.mse(data, reconstruction)
            ) * input_dim
            kl_loss = -0.5 * tf.reduce_mean(
                1 + z_log_var - tf.square(z_mean) - tf.exp(z_log_var)
            )
            total_loss = reconstruction_loss + kl_loss

        grads = tape.gradient(total_loss, self.trainable_weights)
        self.optimizer.apply_gradients(zip(grads, self.trainable_weights))

        self.total_loss_tracker.update_state(total_loss)
        self.reconstruction_loss_tracker.update_state(reconstruction_loss)
        self.kl_loss_tracker.update_state(kl_loss)

        return {
            'loss': self.total_loss_tracker.result(),
            'reconstruction_loss': self.reconstruction_loss_tracker.result(),
            'kl_loss': self.kl_loss_tracker.result()
        }

# 训练 VAE
vae = VAE(encoder_vae, decoder_vae)
vae.compile(optimizer='adam')
vae.fit(X_train, epochs=100, batch_size=32, verbose=0)

# 可视化 VAE 潜在空间
z_mean, z_log_var, z = encoder_vae.predict(X_scaled, verbose=0)

plt.figure(figsize=(10, 8))
scatter = plt.scatter(z_mean[:, 0], z_mean[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
plt.xlabel('潜在维度 1')
plt.ylabel('潜在维度 2')
plt.title('VAE 潜在空间')
plt.colorbar(scatter, label='数字')
plt.show()

print("VAE 优势:")
print("- 连续潜在空间允许插值")
print("- 可以生成新样本")
print("- 正则化以防止过拟合")
```

### 自编码器方法比较

```python
# 比较重建质量
methods = {
    'PCA': PCA(n_components=10),
    '标准 AE': autoencoder,  # 来自前一个单元格
}

# 为了公平比较，使用与 PCA 相同的瓶颈训练自编码器
# 这是概念性比较

print("降维方法比较:")
print("-" * 60)
print(f"{'方法':<20} {'维度':<15} {'重建误差':<20}")
print("-" * 60)

# PCA 重建
pca_10 = PCA(n_components=10)
X_pca_10 = pca_10.fit_transform(X_scaled)
X_pca_reconstructed = pca_10.inverse_transform(X_pca_10)
pca_error = np.mean((X_scaled - X_pca_reconstructed) ** 2)
print(f"{'PCA':<20} {'10':<15} {pca_error:.4f}")

# 标准自编码器
ae_reconstructed = autoencoder.predict(X_scaled, verbose=0)
ae_error = np.mean((X_scaled - ae_reconstructed) ** 2)
print(f"{'自编码器':<20} {'2':<15} {ae_error:.4f}")

print("-" * 60)
print("\n主要区别:")
print("- PCA: 线性、快速、确定性")
print("- 自编码器: 非线性、需要训练、更具表现力")
print("- VAE: 概率性、正则化潜在空间、生成式")
```

## Scikit-learn 实现指南

### 完整的特征变换流水线

```python
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, RobustScaler,
    OneHotEncoder, OrdinalEncoder, PowerTransformer
)
from sklearn.impute import SimpleImputer
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

# 创建混合类型的样本数据集
np.random.seed(42)
n_samples = 1000

data = pd.DataFrame({
    # 数值特征
    'age': np.random.normal(35, 10, n_samples),
    'income': np.random.lognormal(10.5, 0.5, n_samples),  # 偏态
    'years_employed': np.random.exponential(5, n_samples),
    'credit_score': np.random.normal(700, 50, n_samples),

    # 分类特征
    'education': np.random.choice(['High School', 'Bachelor', 'Master', 'PhD'], n_samples),
    'job_type': np.random.choice(['Full-time', 'Part-time', 'Contract', 'Freelance'], n_samples),
    'region': np.random.choice(['North', 'South', 'East', 'West'], n_samples),

    # 目标
    'approved': np.random.binomial(1, 0.3, n_samples)
})

# 定义特征类型
numeric_features = ['age', 'income', 'years_employed', 'credit_score']
skewed_features = ['income', 'years_employed']
normal_features = ['age', 'credit_score']
categorical_features = ['education', 'job_type', 'region']

X = data.drop('approved', axis=1)
y = data['approved']

# 构建综合预处理流水线
numeric_transformer_standard = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

numeric_transformer_skewed = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('power', PowerTransformer(method='yeo-johnson')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

# 组合变换器
preprocessor = ColumnTransformer(
    transformers=[
        ('num_standard', numeric_transformer_standard, normal_features),
        ('num_skewed', numeric_transformer_skewed, skewed_features),
        ('cat', categorical_transformer, categorical_features)
    ]
)

# 完整流水线，包括特征选择和分类
full_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('feature_selection', SelectKBest(f_classif, k='all')),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# 评估
scores = cross_val_score(full_pipeline, X, y, cv=5, scoring='accuracy')
print(f"交叉验证准确率: {scores.mean():.4f} (+/- {scores.std()*2:.4f})")

# 拟合并检查
full_pipeline.fit(X, y)

# 获取变换后的特征名称
preprocessor_fitted = full_pipeline.named_steps['preprocessor']
feature_names = preprocessor_fitted.get_feature_names_out()
print(f"\n变换后的特征（{len(feature_names)} 个）:")
for name in feature_names[:10]:
    print(f"  - {name}")
if len(feature_names) > 10:
    print(f"  ... 还有 {len(feature_names) - 10} 个")
```

### 自定义变换器

```python
from sklearn.base import BaseEstimator, TransformerMixin

class LogTransformer(BaseEstimator, TransformerMixin):
    """自定义对数变换器，处理零值和负值。"""

    def __init__(self, offset=1.0):
        self.offset = offset

    def fit(self, X, y=None):
        # 存储最小值以便可能的偏移调整
        self.min_values_ = np.min(X, axis=0)
        return self

    def transform(self, X):
        X = np.array(X)
        # 如果需要，将值移位为正数
        X_shifted = X - self.min_values_ + self.offset
        return np.log(X_shifted)

    def inverse_transform(self, X):
        X = np.array(X)
        return np.exp(X) + self.min_values_ - self.offset

class OutlierClipper(BaseEstimator, TransformerMixin):
    """基于 IQR 方法裁剪离群值。"""

    def __init__(self, multiplier=1.5):
        self.multiplier = multiplier

    def fit(self, X, y=None):
        X = np.array(X)
        q1 = np.percentile(X, 25, axis=0)
        q3 = np.percentile(X, 75, axis=0)
        iqr = q3 - q1
        self.lower_bound_ = q1 - self.multiplier * iqr
        self.upper_bound_ = q3 + self.multiplier * iqr
        return self

    def transform(self, X):
        X = np.array(X).copy()
        for i in range(X.shape[1]):
            X[:, i] = np.clip(X[:, i], self.lower_bound_[i], self.upper_bound_[i])
        return X

class FeatureCrosser(BaseEstimator, TransformerMixin):
    """在指定列之间创建交互特征。"""

    def __init__(self, feature_pairs):
        """
        feature_pairs: 元组列表，例如 [(0, 1), (1, 2)]
        """
        self.feature_pairs = feature_pairs

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = np.array(X)
        crossed = []
        for i, j in self.feature_pairs:
            crossed.append(X[:, i] * X[:, j])
        return np.column_stack([X] + crossed)

# 示例用法
np.random.seed(42)
X_example = np.column_stack([
    np.random.exponential(5, 100),  # 偏态
    np.random.normal(50, 10, 100),
    np.random.uniform(0, 100, 100)
])

# 添加离群值
X_example[0, 0] = 100
X_example[1, 1] = 150

pipeline_custom = Pipeline([
    ('clipper', OutlierClipper(multiplier=2.0)),
    ('log', LogTransformer()),
    ('crosser', FeatureCrosser([(0, 1), (1, 2)])),
    ('scaler', StandardScaler())
])

X_transformed = pipeline_custom.fit_transform(X_example)
print(f"原始形状: {X_example.shape}")
print(f"变换后形状: {X_transformed.shape}")
print(f"添加了 2 个交互特征")
```

### 处理不同数据类型

```python
from sklearn.preprocessing import FunctionTransformer

# 日期时间特征提取
def extract_datetime_features(X):
    """从日期时间列中提取有用特征。"""
    result = []
    for col in X.columns:
        dt = pd.to_datetime(X[col])
        result.append(pd.DataFrame({
            f'{col}_year': dt.dt.year,
            f'{col}_month': dt.dt.month,
            f'{col}_day': dt.dt.day,
            f'{col}_dayofweek': dt.dt.dayofweek,
            f'{col}_hour': dt.dt.hour if dt.dt.hour.notna().any() else 0,
            f'{col}_is_weekend': (dt.dt.dayofweek >= 5).astype(int)
        }))
    return pd.concat(result, axis=1)

# 文本长度特征
def extract_text_features(X):
    """从文本列中提取基本特征。"""
    result = []
    for col in X.columns:
        result.append(pd.DataFrame({
            f'{col}_length': X[col].str.len(),
            f'{col}_word_count': X[col].str.split().str.len(),
            f'{col}_has_special': X[col].str.contains(r'[!@#$%^&*()]', regex=True).astype(int)
        }))
    return pd.concat(result, axis=1)

# 创建包含日期和文本的样本数据
sample_data = pd.DataFrame({
    'signup_date': pd.date_range('2023-01-01', periods=100, freq='D'),
    'description': ['Product review text here!' * np.random.randint(1, 5) for _ in range(100)],
    'amount': np.random.exponential(100, 100)
})

# 应用变换
date_features = extract_datetime_features(sample_data[['signup_date']])
text_features = extract_text_features(sample_data[['description']])

print("日期时间特征:")
print(date_features.head())
print("\n文本特征:")
print(text_features.head())
```

## 最佳实践和常见陷阱

### 防止数据泄露

```python
from sklearn.model_selection import train_test_split

# 错误：在整个数据集上拟合缩放器
# 这会将测试集信息泄露到训练中
X_scaled_wrong = StandardScaler().fit_transform(X)
X_train_wrong, X_test_wrong = train_test_split(X_scaled_wrong, test_size=0.2)

# 正确：仅在训练数据上拟合缩放器
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)  # 拟合并变换
X_test_scaled = scaler.transform(X_test)        # 仅变换（不拟合！）

print("正确方法：仅在训练数据上拟合预处理")

# 使用 Pipeline 确保无泄露
from sklearn.pipeline import Pipeline

pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', RandomForestClassifier())
])

# 这会自动处理仅在训练数据上拟合
pipeline.fit(X_train, y_train)
score = pipeline.score(X_test, y_test)
print(f"测试准确率: {score:.4f}")
```

### 变换前处理缺失值

```python
from sklearn.impute import SimpleImputer, KNNImputer

# 创建包含缺失值的数据
X_missing = np.random.randn(100, 3)
X_missing[np.random.choice(100, 20), 0] = np.nan
X_missing[np.random.choice(100, 15), 1] = np.nan

# 不同的填充策略
imputers = {
    '均值': SimpleImputer(strategy='mean'),
    '中位数': SimpleImputer(strategy='median'),
    'KNN': KNNImputer(n_neighbors=5)
}

print("填充比较:")
print("-" * 50)
for name, imputer in imputers.items():
    X_imputed = imputer.fit_transform(X_missing)
    print(f"{name:10} - 填充后均值: {X_imputed[:, 0].mean():.4f}")

# 重要：始终在缩放之前填充
correct_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler()),
    ('pca', PCA(n_components=2))
])

# 如果 NaN 值到达缩放器将会失败
try:
    wrong_pipeline = Pipeline([
        ('scaler', StandardScaler()),  # 遇到 NaN 会失败
        ('imputer', SimpleImputer(strategy='median')),
    ])
    wrong_pipeline.fit_transform(X_missing)
except ValueError as e:
    print(f"\n错误顺序时的错误: {str(e)[:50]}...")
```

### 保留特征名称

```python
from sklearn.compose import make_column_transformer
from sklearn.pipeline import make_pipeline

# 创建命名变换器
preprocessor = make_column_transformer(
    (StandardScaler(), normal_features),
    (PowerTransformer(), skewed_features),
    (OneHotEncoder(handle_unknown='ignore'), categorical_features),
    remainder='passthrough',
    verbose_feature_names_out=True
)

# 拟合并获取特征名称
preprocessor.fit(X)
transformed_names = preprocessor.get_feature_names_out()

print("变换后的特征名称:")
for i, name in enumerate(transformed_names[:15]):
    print(f"  {i}: {name}")

# 创建具有正确列名的 DataFrame
X_transformed = preprocessor.transform(X)
X_transformed_df = pd.DataFrame(X_transformed, columns=transformed_names)
print(f"\n变换后 DataFrame 形状: {X_transformed_df.shape}")
print(X_transformed_df.head())
```

### 按算法的变换策略

```python
# 不同算法有不同的预处理要求

algorithm_recommendations = {
    '线性回归': {
        '缩放': 'StandardScaler（对正则化版本很重要）',
        '偏态特征': '对数或 Box-Cox 变换',
        '离群值': '考虑 RobustScaler 或离群值移除',
        '分类': 'OneHotEncoder'
    },
    '逻辑回归': {
        '缩放': 'StandardScaler（收敛所需）',
        '偏态特征': '建议幂变换',
        '离群值': 'RobustScaler 或裁剪离群值',
        '分类': 'OneHotEncoder 或 TargetEncoder'
    },
    '随机森林': {
        '缩放': '不需要（基于树）',
        '偏态特征': '不需要',
        '离群值': '对离群值稳健',
        '分类': 'OrdinalEncoder 或 OneHotEncoder'
    },
    'SVM': {
        '缩放': '必需（StandardScaler 或 MinMaxScaler）',
        '偏态特征': '建议变换',
        '离群值': '非常敏感 - 使用 RobustScaler',
        '分类': 'OneHotEncoder'
    },
    'KNN': {
        '缩放': '必需（距离受尺度影响）',
        '偏态特征': '建议变换',
        '离群值': '敏感 - 考虑裁剪',
        '分类': 'OneHotEncoder 或基于距离的编码'
    },
    '神经网络': {
        '缩放': '必需（BatchNorm 或 StandardScaler）',
        '偏态特征': '变换有助于收敛',
        '离群值': '裁剪到合理范围',
        '分类': 'OneHotEncoder 或学习嵌入'
    },
    'XGBoost/LightGBM': {
        '缩放': '不需要',
        '偏态特征': '不需要',
        '离群值': '对离群值稳健',
        '分类': '原生支持（LightGBM）或 OrdinalEncoder'
    }
}

print("按算法的特征变换建议")
print("=" * 70)
for algo, recs in algorithm_recommendations.items():
    print(f"\n{algo}:")
    for aspect, rec in recs.items():
        print(f"  - {aspect}: {rec}")
```

## 面试重点

### 常见面试问题

**问题1：标准化和归一化有什么区别？**

标准化（Z-score）将数据变换为均值=0 和标准差=1。它适用于高斯分布数据和假设数据以零为中心的算法（PCA、神经网络）。

归一化（Min-Max）将数据缩放到固定范围 [0, 1]。它适用于有界要求和非高斯数据。

**问题2：何时应该应用特征缩放？**

- 基于距离的算法（KNN、K-Means、SVM）
- 梯度下降优化（线性回归、神经网络）
- 正则化模型（Ridge、Lasso）
- PCA 和其他基于方差的方法

基于树的算法（随机森林、XGBoost）通常不需要缩放。

**问题3：什么是特征变换中的数据泄露？**

数据泄露发生在测试集信息影响训练过程时。在特征变换中：
- 错误：先在整个数据集上拟合缩放器，再分割
- 正确：先分割，然后仅在训练数据上拟合缩放器

始终使用 sklearn Pipeline 自动防止泄露。

**问题4：解释 PCA 及其使用场景。**

PCA 找到最大方差的正交方向：
1. 中心化数据
2. 计算协方差矩阵
3. 找到特征值/特征向量
4. 投影到前 k 个成分

使用 PCA 的场景：
- 降维用于可视化
- 去除多重共线性
- 用高维数据加速训练
- 作为对特征数量敏感的算法的预处理

**问题5：如何处理偏态特征？**

选项包括：
- 对数变换：用于右偏、正数据
- 平方根：用于中等偏态、计数数据
- Box-Cox：找到最优变换参数
- Yeo-Johnson：处理零值和负值
- 分位数变换：非参数，映射到任何分布

**问题6：t-SNE 和 UMAP 有什么区别？**

两者都是用于可视化的非线性降维：

t-SNE：
- 出色地保留局部结构
- 较慢，尤其对大数据集
- 困惑度参数控制邻域大小
- 不适合新数据投影

UMAP：
- 更快，扩展性更好
- 同时保留局部和全局结构
- 可以投影新数据
- n_neighbors 和 min_dist 控制结构

### 快速参考公式

**标准化（Z-score）：**
$$z = \frac{x - \mu}{\sigma}$$

**最小-最大归一化：**
$$x_{norm} = \frac{x - x_{min}}{x_{max} - x_{min}}$$

**鲁棒缩放：**
$$x_{robust} = \frac{x - Q_{50}}{Q_{75} - Q_{25}}$$

**对数变换：**
$$x_{log} = \log(x + c)$$

**解释方差比例（PCA）：**
$$EVR_i = \frac{\lambda_i}{\sum_{j=1}^{n}\lambda_j}$$

## 总结

特征变换是每位数据科学家或机器学习从业者的基本技能。本指南涵盖了：

1. **缩放方法**：StandardScaler、MinMaxScaler、RobustScaler - 每种都适用于不同的数据特征和算法要求。

2. **数值变换**：对数、Box-Cox、Yeo-Johnson 和分位数变换，用于处理偏态分布。

3. **特征交叉**：通过多项式展开和手动特征工程创建交互特征。

4. **降维**：PCA 用于线性降维，t-SNE 和 UMAP 用于可视化，自编码器用于非线性表示。

5. **实现最佳实践**：使用 scikit-learn 流水线、防止数据泄露和创建自定义变换器。

关键要点：

1. **始终防止数据泄露**，仅在训练数据上拟合变换器
2. **根据算法要求**和数据特征选择变换
3. **使用流水线**创建可重复和可维护的预处理工作流
4. **可视化分布**在变换前后以验证效果
5. **在选择不同变换方法时考虑可解释性**

特征变换通常是模型性能获得最显著提升的地方。一个精心设计的特征流水线可能比复杂的算法调优更有价值。

## 延伸阅读

### 推荐资源

1. **《Feature Engineering and Selection》作者 Max Kuhn 和 Kjell Johnson** - 特征工程技术综合指南

2. **《Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow》作者 Aurelien Geron** - 实践实现指南

3. **Scikit-learn 文档** - [预处理](https://scikit-learn.org/stable/modules/preprocessing.html) - 所有变换器的官方参考

4. **《An Introduction to Statistical Learning》作者 James 等** - 理解变换的统计基础

### 在线资源

- [Scikit-learn 用户指南：预处理](https://scikit-learn.org/stable/modules/preprocessing.html)
- [Feature Engine 库](https://feature-engine.readthedocs.io/) - 额外的变换器
- [Kaggle 特征工程课程](https://www.kaggle.com/learn/feature-engineering)

### 进阶主题探索

- 高基数分类特征的目标编码
- 分类变量的实体嵌入
- 特征选择方法（过滤、包装、嵌入）
- 自动化特征工程（Featuretools、AutoML）
- 领域特定变换（文本、图像、时间序列）
