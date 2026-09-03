---
title: 特征工程完全指南
description: 掌握特征工程技术，提升机器学习模型性能
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - 特征工程
  - 机器学习
  - 数据预处理
  - 特征选择
status: imported
origin: old/src/content/docs/ai/feature-engineering.zh.md
divergence: 0.407
issues:
  - divergent
legacy:
  category: AI
  subcategory: Machine Learning
  order: 16
  lastUpdated: 2026-01-07
---

特征工程（Feature Engineering）是机器学习中最关键的环节之一。正如业界流传的一句话："数据和特征决定了机器学习的上限，而模型和算法只是逼近这个上限。"本文将全面介绍特征工程的核心技术，包括特征提取、特征转换、特征选择、特征编码和降维等关键主题，帮助你构建更加高效的机器学习模型。

## 特征工程概述

### 什么是特征工程

特征工程是指利用领域知识和数据挖掘技术，从原始数据中提取、构造和选择特征的过程。其目标是创建能够更好地表达问题本质的特征集，从而提升模型的预测能力和泛化性能。

**特征工程的核心价值：**
- 提升模型预测准确率
- 减少模型训练时间
- 提高模型可解释性
- 降低过拟合风险

### 特征工程的工作流程

```
原始数据 → 数据清洗 → 特征提取 → 特征转换 → 特征选择 → 模型训练
              ↓           ↓           ↓           ↓
          处理缺失值    创建新特征    标准化/编码   降维/筛选
```

## 特征提取（Feature Extraction）

特征提取是从原始数据中生成有意义特征的过程。不同类型的数据需要不同的特征提取策略。

### 数值特征提取

对于数值型数据，常见的特征提取方法包括：

```python
import pandas as pd
import numpy as np
from datetime import datetime

# 创建示例数据
df = pd.DataFrame({
    'user_id': [1, 2, 3, 4, 5],
    'age': [25, 32, 45, 28, 35],
    'income': [50000, 75000, 120000, 55000, 80000],
    'purchase_amount': [1200, 3500, 8900, 1800, 4200],
    'login_count': [15, 45, 12, 28, 55],
    'registration_date': pd.to_datetime(['2020-01-15', '2019-06-20',
                                          '2018-03-10', '2021-02-28', '2020-08-05'])
})

# 统计特征提取
df['income_to_purchase_ratio'] = df['income'] / (df['purchase_amount'] + 1)
df['avg_purchase_per_login'] = df['purchase_amount'] / (df['login_count'] + 1)

# 分箱特征（Binning）
df['age_group'] = pd.cut(df['age'], bins=[0, 25, 35, 45, 100],
                         labels=['youth', 'young_adult', 'middle_age', 'senior'])

df['income_level'] = pd.qcut(df['income'], q=3,
                              labels=['low', 'medium', 'high'])

# 时间特征提取
current_date = datetime.now()
df['account_age_days'] = (current_date - df['registration_date']).dt.days
df['registration_year'] = df['registration_date'].dt.year
df['registration_month'] = df['registration_date'].dt.month
df['is_weekend_registration'] = df['registration_date'].dt.dayofweek.isin([5, 6]).astype(int)

print(df.head())
```

### 文本特征提取

文本数据需要转换为数值形式才能被模型使用：

```python
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
import jieba  # 中文分词

# 示例文本数据
texts = [
    "机器学习是人工智能的重要分支",
    "深度学习推动了人工智能的发展",
    "自然语言处理是机器学习的应用领域",
    "计算机视觉也是人工智能的重要方向"
]

# 词袋模型（Bag of Words）
def chinese_tokenizer(text):
    return list(jieba.cut(text))

count_vectorizer = CountVectorizer(tokenizer=chinese_tokenizer)
bow_features = count_vectorizer.fit_transform(texts)
print("词袋特征维度:", bow_features.shape)
print("词汇表:", count_vectorizer.get_feature_names_out()[:10])

# TF-IDF 特征
tfidf_vectorizer = TfidfVectorizer(tokenizer=chinese_tokenizer)
tfidf_features = tfidf_vectorizer.fit_transform(texts)
print("\nTF-IDF特征维度:", tfidf_features.shape)

# N-gram 特征
ngram_vectorizer = CountVectorizer(tokenizer=chinese_tokenizer, ngram_range=(1, 2))
ngram_features = ngram_vectorizer.fit_transform(texts)
print("\nN-gram特征维度:", ngram_features.shape)
```

### 时间序列特征提取

时间序列数据的特征提取需要考虑时间的连续性和周期性：

```python
import pandas as pd
import numpy as np

# 创建时间序列数据
dates = pd.date_range(start='2023-01-01', periods=365, freq='D')
np.random.seed(42)
values = np.cumsum(np.random.randn(365)) + 100

ts_df = pd.DataFrame({'date': dates, 'value': values})

# 滑动窗口特征
ts_df['rolling_mean_7'] = ts_df['value'].rolling(window=7).mean()
ts_df['rolling_std_7'] = ts_df['value'].rolling(window=7).std()
ts_df['rolling_min_7'] = ts_df['value'].rolling(window=7).min()
ts_df['rolling_max_7'] = ts_df['value'].rolling(window=7).max()

# 滞后特征（Lag Features）
for lag in [1, 3, 7, 14]:
    ts_df[f'lag_{lag}'] = ts_df['value'].shift(lag)

# 差分特征
ts_df['diff_1'] = ts_df['value'].diff(1)
ts_df['diff_7'] = ts_df['value'].diff(7)

# 时间组件特征
ts_df['day_of_week'] = ts_df['date'].dt.dayofweek
ts_df['day_of_month'] = ts_df['date'].dt.day
ts_df['month'] = ts_df['date'].dt.month
ts_df['quarter'] = ts_df['date'].dt.quarter
ts_df['is_weekend'] = ts_df['day_of_week'].isin([5, 6]).astype(int)

# 周期性特征（正弦/余弦编码）
ts_df['day_sin'] = np.sin(2 * np.pi * ts_df['day_of_week'] / 7)
ts_df['day_cos'] = np.cos(2 * np.pi * ts_df['day_of_week'] / 7)
ts_df['month_sin'] = np.sin(2 * np.pi * ts_df['month'] / 12)
ts_df['month_cos'] = np.cos(2 * np.pi * ts_df['month'] / 12)

print(ts_df.head(10))
```

## 特征转换（Feature Transformation）

特征转换是将原始特征转换为更适合模型学习的形式。

### 数值特征标准化

```python
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler
from sklearn.preprocessing import PowerTransformer, QuantileTransformer

# 创建示例数据
np.random.seed(42)
data = pd.DataFrame({
    'normal': np.random.normal(50, 10, 1000),
    'skewed': np.random.exponential(10, 1000),
    'with_outliers': np.concatenate([np.random.normal(50, 5, 950),
                                      np.random.normal(150, 10, 50)])
})

# 标准化（Z-score Standardization）
# 将数据转换为均值为0、标准差为1的分布
standard_scaler = StandardScaler()
data_standard = standard_scaler.fit_transform(data)
print("标准化后 - 均值:", np.mean(data_standard, axis=0).round(4))
print("标准化后 - 标准差:", np.std(data_standard, axis=0).round(4))

# 归一化（Min-Max Normalization）
# 将数据缩放到[0, 1]区间
minmax_scaler = MinMaxScaler()
data_minmax = minmax_scaler.fit_transform(data)
print("\n归一化后 - 最小值:", np.min(data_minmax, axis=0))
print("归一化后 - 最大值:", np.max(data_minmax, axis=0))

# 鲁棒标准化（Robust Scaling）
# 使用中位数和四分位距，对异常值不敏感
robust_scaler = RobustScaler()
data_robust = robust_scaler.fit_transform(data)

# 幂变换（Power Transform）
# 将偏态分布转换为近似正态分布
power_transformer = PowerTransformer(method='yeo-johnson')
data_power = power_transformer.fit_transform(data)

# 分位数变换（Quantile Transform）
# 将数据转换为均匀分布或正态分布
quantile_transformer = QuantileTransformer(output_distribution='normal')
data_quantile = quantile_transformer.fit_transform(data)
```

### 对数变换与Box-Cox变换

对于右偏分布的数据，对数变换和Box-Cox变换特别有效：

```python
import numpy as np
import pandas as pd
from scipy import stats
import matplotlib.pyplot as plt

# 创建右偏分布数据
np.random.seed(42)
skewed_data = np.random.exponential(10, 1000)

# 对数变换
log_transformed = np.log1p(skewed_data)  # log1p 处理0值

# 平方根变换
sqrt_transformed = np.sqrt(skewed_data)

# Box-Cox 变换（要求数据为正数）
boxcox_transformed, lambda_param = stats.boxcox(skewed_data + 1)
print(f"Box-Cox 最优 lambda 值: {lambda_param:.4f}")

# Yeo-Johnson 变换（可处理负数）
from sklearn.preprocessing import PowerTransformer
pt = PowerTransformer(method='yeo-johnson')
yeojohnson_transformed = pt.fit_transform(skewed_data.reshape(-1, 1))

# 比较变换效果
print(f"\n原始数据偏度: {stats.skew(skewed_data):.4f}")
print(f"对数变换后偏度: {stats.skew(log_transformed):.4f}")
print(f"Box-Cox变换后偏度: {stats.skew(boxcox_transformed):.4f}")
```

### 多项式特征

创建特征之间的交互项和高阶项：

```python
from sklearn.preprocessing import PolynomialFeatures
import pandas as pd
import numpy as np

# 创建示例数据
X = pd.DataFrame({
    'x1': [1, 2, 3, 4, 5],
    'x2': [2, 3, 4, 5, 6]
})

# 创建多项式特征
poly = PolynomialFeatures(degree=2, include_bias=False, interaction_only=False)
X_poly = poly.fit_transform(X)

# 查看生成的特征
feature_names = poly.get_feature_names_out(['x1', 'x2'])
X_poly_df = pd.DataFrame(X_poly, columns=feature_names)
print("多项式特征:")
print(X_poly_df)

# 仅生成交互特征
poly_interaction = PolynomialFeatures(degree=2, include_bias=False, interaction_only=True)
X_interaction = poly_interaction.fit_transform(X)
feature_names_interaction = poly_interaction.get_feature_names_out(['x1', 'x2'])
print("\n仅交互特征:")
print(pd.DataFrame(X_interaction, columns=feature_names_interaction))
```

## 特征编码（Feature Encoding）

类别型特征需要转换为数值形式才能被大多数机器学习算法使用。

### One-Hot 编码

```python
import pandas as pd
from sklearn.preprocessing import OneHotEncoder
import numpy as np

# 创建示例数据
df = pd.DataFrame({
    'color': ['红色', '蓝色', '绿色', '红色', '蓝色'],
    'size': ['小', '中', '大', '中', '小'],
    'brand': ['A', 'B', 'C', 'A', 'B']
})

# 方法1：使用 pandas get_dummies
df_onehot_pandas = pd.get_dummies(df, columns=['color', 'size', 'brand'])
print("Pandas One-Hot 编码:")
print(df_onehot_pandas)

# 方法2：使用 sklearn OneHotEncoder
encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
encoded_features = encoder.fit_transform(df)
feature_names = encoder.get_feature_names_out(df.columns)
df_onehot_sklearn = pd.DataFrame(encoded_features, columns=feature_names)
print("\nSklearn One-Hot 编码:")
print(df_onehot_sklearn)
```

### Label 编码与 Ordinal 编码

```python
from sklearn.preprocessing import LabelEncoder, OrdinalEncoder
import pandas as pd

# 创建示例数据
df = pd.DataFrame({
    'education': ['高中', '本科', '硕士', '博士', '本科', '高中'],
    'city': ['北京', '上海', '广州', '深圳', '北京', '上海']
})

# Label 编码（适用于目标变量或无序类别）
label_encoder = LabelEncoder()
df['city_encoded'] = label_encoder.fit_transform(df['city'])
print("Label 编码 - 城市映射:")
print(dict(zip(label_encoder.classes_, range(len(label_encoder.classes_)))))

# Ordinal 编码（适用于有序类别）
education_order = ['高中', '本科', '硕士', '博士']
ordinal_encoder = OrdinalEncoder(categories=[education_order])
df['education_encoded'] = ordinal_encoder.fit_transform(df[['education']])
print("\nOrdinal 编码 - 教育程度:")
print(df[['education', 'education_encoded']])
```

### Target 编码（目标编码）

Target 编码使用目标变量的统计信息来编码类别特征：

```python
import pandas as pd
import numpy as np
from sklearn.model_selection import KFold

def target_encode(df, cat_col, target_col, n_splits=5, smoothing=10):
    """
    实现带平滑的目标编码

    参数:
        df: 数据框
        cat_col: 要编码的类别列名
        target_col: 目标列名
        n_splits: 交叉验证折数
        smoothing: 平滑参数
    """
    # 计算全局均值
    global_mean = df[target_col].mean()

    # 初始化编码列
    df[f'{cat_col}_target_encoded'] = np.nan

    # 使用K折交叉验证避免数据泄露
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)

    for train_idx, val_idx in kf.split(df):
        # 计算训练集中每个类别的目标均值和计数
        train_df = df.iloc[train_idx]
        agg = train_df.groupby(cat_col)[target_col].agg(['mean', 'count'])

        # 应用平滑公式
        smooth_mean = (agg['count'] * agg['mean'] + smoothing * global_mean) / (agg['count'] + smoothing)

        # 对验证集应用编码
        df.loc[df.index[val_idx], f'{cat_col}_target_encoded'] = df.iloc[val_idx][cat_col].map(smooth_mean)

    # 处理缺失值（新类别）
    df[f'{cat_col}_target_encoded'].fillna(global_mean, inplace=True)

    return df

# 示例使用
np.random.seed(42)
df = pd.DataFrame({
    'city': np.random.choice(['北京', '上海', '广州', '深圳'], 1000),
    'price': np.random.normal(100, 20, 1000)
})

# 添加城市对价格的影响
city_effect = {'北京': 20, '上海': 15, '广州': 5, '深圳': 10}
df['price'] = df['price'] + df['city'].map(city_effect)

# 应用目标编码
df = target_encode(df, 'city', 'price')
print(df.groupby('city')['city_target_encoded'].first())
```

### 频率编码与计数编码

```python
import pandas as pd
import numpy as np

# 创建示例数据
np.random.seed(42)
df = pd.DataFrame({
    'category': np.random.choice(['A', 'B', 'C', 'D'], 1000, p=[0.4, 0.3, 0.2, 0.1])
})

# 频率编码
freq_encoding = df['category'].value_counts(normalize=True)
df['category_freq'] = df['category'].map(freq_encoding)

# 计数编码
count_encoding = df['category'].value_counts()
df['category_count'] = df['category'].map(count_encoding)

print("频率编码和计数编码:")
print(df.groupby('category')[['category_freq', 'category_count']].first())
```

### 二进制编码

对于高基数类别特征，二进制编码比One-Hot编码更节省空间：

```python
import pandas as pd
import numpy as np

def binary_encode(df, col):
    """
    实现二进制编码
    """
    # 获取唯一值并创建映射
    unique_values = df[col].unique()
    n_values = len(unique_values)
    n_bits = int(np.ceil(np.log2(n_values + 1)))

    value_to_idx = {val: idx + 1 for idx, val in enumerate(unique_values)}

    # 转换为二进制
    binary_cols = []
    for bit in range(n_bits):
        col_name = f'{col}_bin_{bit}'
        df[col_name] = df[col].map(value_to_idx).apply(lambda x: (x >> bit) & 1)
        binary_cols.append(col_name)

    return df, binary_cols

# 示例
df = pd.DataFrame({
    'product': ['产品A', '产品B', '产品C', '产品D', '产品E',
                '产品F', '产品G', '产品H']
})

df_encoded, new_cols = binary_encode(df, 'product')
print("二进制编码结果:")
print(df_encoded)
```

## 特征选择（Feature Selection）

特征选择旨在从原始特征集中选择最相关的特征子集，减少冗余，提高模型效率。

### 过滤法（Filter Methods）

基于统计指标选择特征，与模型无关：

```python
import pandas as pd
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.feature_selection import (SelectKBest, f_classif,
                                        mutual_info_classif, chi2)
from sklearn.preprocessing import MinMaxScaler

# 加载数据
data = load_breast_cancer()
X = pd.DataFrame(data.data, columns=data.feature_names)
y = data.target

# 方差阈值法
from sklearn.feature_selection import VarianceThreshold

# 移除方差小于阈值的特征
selector_var = VarianceThreshold(threshold=0.1)
X_var = selector_var.fit_transform(X)
print(f"方差筛选后特征数: {X_var.shape[1]} (原始: {X.shape[1]})")

# 相关系数法
correlation_matrix = X.corrwith(pd.Series(y))
top_features_corr = correlation_matrix.abs().sort_values(ascending=False).head(10)
print("\n相关系数 Top 10 特征:")
print(top_features_corr)

# 卡方检验（适用于非负特征）
scaler = MinMaxScaler()
X_scaled = scaler.fit_transform(X)
selector_chi2 = SelectKBest(chi2, k=10)
X_chi2 = selector_chi2.fit_transform(X_scaled, y)
chi2_scores = pd.Series(selector_chi2.scores_, index=X.columns)
print("\n卡方检验 Top 10 特征:")
print(chi2_scores.sort_values(ascending=False).head(10))

# 互信息法
selector_mi = SelectKBest(mutual_info_classif, k=10)
X_mi = selector_mi.fit_transform(X, y)
mi_scores = pd.Series(selector_mi.scores_, index=X.columns)
print("\n互信息 Top 10 特征:")
print(mi_scores.sort_values(ascending=False).head(10))

# ANOVA F值（用于分类问题）
selector_f = SelectKBest(f_classif, k=10)
X_f = selector_f.fit_transform(X, y)
f_scores = pd.Series(selector_f.scores_, index=X.columns)
print("\nANOVA F值 Top 10 特征:")
print(f_scores.sort_values(ascending=False).head(10))
```

### 包装法（Wrapper Methods）

使用模型性能来评估特征子集：

```python
from sklearn.feature_selection import RFE, RFECV
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
import pandas as pd
import numpy as np

# 使用之前加载的数据
from sklearn.datasets import load_breast_cancer
data = load_breast_cancer()
X = pd.DataFrame(data.data, columns=data.feature_names)
y = data.target

# 递归特征消除（RFE）
model = RandomForestClassifier(n_estimators=100, random_state=42)
rfe = RFE(estimator=model, n_features_to_select=10, step=1)
rfe.fit(X, y)

rfe_ranking = pd.DataFrame({
    'feature': X.columns,
    'ranking': rfe.ranking_,
    'selected': rfe.support_
}).sort_values('ranking')

print("RFE 特征排名:")
print(rfe_ranking.head(10))

# 带交叉验证的递归特征消除（RFECV）
rfecv = RFECV(estimator=model, step=1, cv=5, scoring='accuracy', n_jobs=-1)
rfecv.fit(X, y)

print(f"\n最优特征数量: {rfecv.n_features_}")
print(f"最优交叉验证得分: {rfecv.cv_results_['mean_test_score'].max():.4f}")

# 前向特征选择（手动实现）
def forward_selection(X, y, model, max_features=10):
    """前向特征选择"""
    selected_features = []
    remaining_features = list(X.columns)
    best_scores = []

    while len(selected_features) < max_features and remaining_features:
        best_score = -np.inf
        best_feature = None

        for feature in remaining_features:
            current_features = selected_features + [feature]
            score = cross_val_score(model, X[current_features], y, cv=5).mean()

            if score > best_score:
                best_score = score
                best_feature = feature

        if best_feature:
            selected_features.append(best_feature)
            remaining_features.remove(best_feature)
            best_scores.append(best_score)
            print(f"添加特征: {best_feature}, 得分: {best_score:.4f}")

    return selected_features, best_scores

# 运行前向选择（限制为5个特征以加快速度）
selected, scores = forward_selection(X, y, model, max_features=5)
```

### 嵌入法（Embedded Methods）

在模型训练过程中进行特征选择：

```python
from sklearn.linear_model import Lasso, LassoCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.feature_selection import SelectFromModel
import pandas as pd
import numpy as np

# 使用之前加载的数据
from sklearn.datasets import load_breast_cancer
data = load_breast_cancer()
X = pd.DataFrame(data.data, columns=data.feature_names)
y = data.target

# L1 正则化（Lasso）特征选择
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

lasso = LassoCV(cv=5, random_state=42)
lasso.fit(X_scaled, y)

lasso_coef = pd.DataFrame({
    'feature': X.columns,
    'coefficient': np.abs(lasso.coef_)
}).sort_values('coefficient', ascending=False)

print("Lasso 特征系数 (非零):")
print(lasso_coef[lasso_coef['coefficient'] > 0])

# 基于树模型的特征重要性
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X, y)

rf_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': rf.feature_importances_
}).sort_values('importance', ascending=False)

print("\n随机森林特征重要性 Top 10:")
print(rf_importance.head(10))

# 使用 SelectFromModel 自动选择
selector = SelectFromModel(rf, threshold='median')
X_selected = selector.fit_transform(X, y)
selected_features = X.columns[selector.get_support()].tolist()

print(f"\nSelectFromModel 选择的特征 ({len(selected_features)} 个):")
print(selected_features)

# 梯度提升特征重要性
gb = GradientBoostingClassifier(n_estimators=100, random_state=42)
gb.fit(X, y)

gb_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': gb.feature_importances_
}).sort_values('importance', ascending=False)

print("\n梯度提升特征重要性 Top 10:")
print(gb_importance.head(10))
```

## 降维（Dimensionality Reduction）

降维技术可以减少特征数量，同时保留数据的主要信息。

### 主成分分析（PCA）

```python
import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import matplotlib.pyplot as plt

# 使用之前加载的数据
from sklearn.datasets import load_breast_cancer
data = load_breast_cancer()
X = pd.DataFrame(data.data, columns=data.feature_names)
y = data.target

# 标准化数据
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 完整 PCA 分析
pca_full = PCA()
pca_full.fit(X_scaled)

# 计算累计解释方差比
cumulative_variance = np.cumsum(pca_full.explained_variance_ratio_)
print("各主成分解释方差比:")
for i, (var, cum_var) in enumerate(zip(pca_full.explained_variance_ratio_[:10],
                                        cumulative_variance[:10])):
    print(f"  PC{i+1}: {var:.4f} (累计: {cum_var:.4f})")

# 选择解释 95% 方差的主成分数
n_components_95 = np.argmax(cumulative_variance >= 0.95) + 1
print(f"\n解释 95% 方差所需主成分数: {n_components_95}")

# 降维
pca = PCA(n_components=n_components_95)
X_pca = pca.fit_transform(X_scaled)
print(f"降维后数据形状: {X_pca.shape}")

# 查看主成分载荷
loadings = pd.DataFrame(
    pca.components_.T,
    columns=[f'PC{i+1}' for i in range(n_components_95)],
    index=X.columns
)
print("\n第一主成分载荷 Top 5:")
print(loadings['PC1'].abs().sort_values(ascending=False).head(5))

# 用于可视化的 2D PCA
pca_2d = PCA(n_components=2)
X_2d = pca_2d.fit_transform(X_scaled)
print(f"\n2D PCA 解释方差比: {pca_2d.explained_variance_ratio_.sum():.4f}")
```

### 线性判别分析（LDA）

LDA 是一种有监督的降维方法：

```python
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis as LDA
import numpy as np
import pandas as pd

# 使用之前加载的数据
from sklearn.datasets import load_iris
iris = load_iris()
X = iris.data
y = iris.target

# LDA 降维（最多 n_classes - 1 个成分）
lda = LDA(n_components=2)
X_lda = lda.fit_transform(X, y)

print(f"LDA 降维后形状: {X_lda.shape}")
print(f"LDA 解释方差比: {lda.explained_variance_ratio_}")

# LDA 也可以用于分类
lda_classifier = LDA()
lda_classifier.fit(X, y)
accuracy = lda_classifier.score(X, y)
print(f"\nLDA 分类准确率: {accuracy:.4f}")
```

### t-SNE 可视化

t-SNE 主要用于高维数据的可视化：

```python
from sklearn.manifold import TSNE
import numpy as np

# 使用之前加载的数据
from sklearn.datasets import load_digits
digits = load_digits()
X = digits.data
y = digits.target

# t-SNE 降维
tsne = TSNE(n_components=2, perplexity=30, random_state=42, n_iter=1000)
X_tsne = tsne.fit_transform(X)

print(f"t-SNE 降维后形状: {X_tsne.shape}")

# 注意：t-SNE 不能用于转换新数据
# 每次调用 fit_transform 都会产生不同的结果（除非固定random_state）
```

### UMAP 降维

UMAP 是 t-SNE 的替代方案，速度更快：

```python
# 需要安装：pip install umap-learn
from umap import UMAP
import numpy as np

# 使用之前加载的数据
from sklearn.datasets import load_digits
digits = load_digits()
X = digits.data
y = digits.target

# UMAP 降维
umap = UMAP(n_components=2, n_neighbors=15, min_dist=0.1, random_state=42)
X_umap = umap.fit_transform(X)

print(f"UMAP 降维后形状: {X_umap.shape}")

# UMAP 可以转换新数据
# X_new_umap = umap.transform(X_new)
```

### 特征哈希（Feature Hashing）

用于处理超高维稀疏特征：

```python
from sklearn.feature_extraction import FeatureHasher
import pandas as pd

# 模拟高基数类别特征
data = [
    {'user_id': 'user_12345', 'product_id': 'prod_67890', 'category': 'electronics'},
    {'user_id': 'user_23456', 'product_id': 'prod_78901', 'category': 'clothing'},
    {'user_id': 'user_34567', 'product_id': 'prod_89012', 'category': 'books'},
]

# 使用 Feature Hashing
hasher = FeatureHasher(n_features=16, input_type='dict')
X_hashed = hasher.fit_transform(data)

print(f"特征哈希后形状: {X_hashed.shape}")
print(f"稀疏矩阵非零元素: {X_hashed.nnz}")
print(f"稀疏矩阵密度: {X_hashed.nnz / (X_hashed.shape[0] * X_hashed.shape[1]):.4f}")
```

## 特征工程最佳实践

### 完整的特征工程Pipeline

```python
import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score

# 创建示例数据
np.random.seed(42)
n_samples = 1000

df = pd.DataFrame({
    'age': np.random.normal(35, 10, n_samples),
    'income': np.random.exponential(50000, n_samples),
    'credit_score': np.random.randint(300, 850, n_samples),
    'gender': np.random.choice(['M', 'F'], n_samples),
    'education': np.random.choice(['高中', '本科', '硕士', '博士'], n_samples),
    'city': np.random.choice(['北京', '上海', '广州', '深圳'], n_samples),
})

# 添加一些缺失值
df.loc[np.random.choice(n_samples, 50, replace=False), 'age'] = np.nan
df.loc[np.random.choice(n_samples, 30, replace=False), 'income'] = np.nan

# 创建目标变量
df['target'] = (df['income'].fillna(50000) > 60000).astype(int)

# 定义特征类型
numeric_features = ['age', 'income', 'credit_score']
categorical_features = ['gender', 'education', 'city']

# 构建预处理Pipeline
numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ]
)

# 完整Pipeline
full_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('feature_selection', SelectKBest(f_classif, k=10)),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# 划分数据
X = df.drop('target', axis=1)
y = df['target']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 训练和评估
full_pipeline.fit(X_train, y_train)
train_score = full_pipeline.score(X_train, y_train)
test_score = full_pipeline.score(X_test, y_test)

print(f"训练集准确率: {train_score:.4f}")
print(f"测试集准确率: {test_score:.4f}")

# 交叉验证
cv_scores = cross_val_score(full_pipeline, X, y, cv=5)
print(f"交叉验证得分: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
```

### 处理数据泄露

```python
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.linear_model import LogisticRegression
import numpy as np

# 正确的做法：在Pipeline中处理所有特征工程步骤
correct_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('feature_selection', SelectKBest(f_classif, k=10)),
    ('classifier', LogisticRegression())
])

# 错误的做法：在划分数据前进行特征工程
# 这会导致数据泄露！
# scaler = StandardScaler()
# X_scaled = scaler.fit_transform(X)  # 使用了全部数据！
# X_train, X_test, y_train, y_test = train_test_split(X_scaled, y)

# 使用交叉验证时，Pipeline会确保每次只在训练折上fit
scores = cross_val_score(correct_pipeline, X, y, cv=5)
print(f"正确Pipeline的交叉验证得分: {scores.mean():.4f}")
```

### 处理不平衡数据的特征工程

```python
from imblearn.pipeline import Pipeline as ImbPipeline
from imblearn.over_sampling import SMOTE
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
import numpy as np

# 创建不平衡数据
np.random.seed(42)
X = np.random.randn(1000, 10)
y = np.concatenate([np.zeros(900), np.ones(100)])  # 9:1 不平衡

print(f"类别分布: {np.bincount(y.astype(int))}")

# 使用 imblearn 的 Pipeline（支持采样器）
imb_pipeline = ImbPipeline([
    ('scaler', StandardScaler()),
    ('smote', SMOTE(random_state=42)),
    ('classifier', RandomForestClassifier(random_state=42))
])

# 注意：SMOTE 只应用于训练数据，不应用于测试数据
from sklearn.model_selection import cross_val_score
scores = cross_val_score(imb_pipeline, X, y, cv=5, scoring='f1')
print(f"F1 得分: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
```

## 面试常见问题

### 特征工程相关面试题

**Q1: 为什么特征工程很重要？**

特征工程决定了模型能够学习到什么信息。好的特征可以让简单的模型表现出色，而差的特征即使用复杂模型也难以获得好的结果。特征工程还能提高模型的可解释性，减少过拟合风险。

**Q2: 什么时候使用标准化，什么时候使用归一化？**

- 标准化（Z-score）：适用于数据近似正态分布的情况，对异常值敏感。常用于线性模型、SVM、神经网络等。
- 归一化（Min-Max）：将数据压缩到[0,1]区间，保留原始数据的分布形状。适用于需要数据在特定范围内的情况，如图像像素值。

**Q3: 如何处理高基数类别特征？**

- Target编码：使用目标变量的统计信息
- 频率编码：使用类别出现的频率
- 特征哈希：将高维特征映射到低维空间
- 嵌入层：使用神经网络学习类别的向量表示
- 聚类：将相似类别合并

**Q4: 特征选择的三种方法有什么区别？**

- 过滤法：独立于模型，速度快，但可能忽略特征交互
- 包装法：考虑特征组合效果，但计算成本高
- 嵌入法：在模型训练中自动选择，平衡效果和效率

**Q5: PCA和LDA有什么区别？**

- PCA：无监督方法，最大化数据方差
- LDA：有监督方法，最大化类间距离，最小化类内距离
- PCA适用于任何降维场景，LDA主要用于分类任务的特征提取

### 实战技巧总结

1. **先理解数据**：深入了解数据的业务含义和分布特征
2. **保持特征可解释**：尽量创建有业务含义的特征
3. **迭代优化**：特征工程是一个迭代过程，需要不断尝试
4. **注意数据泄露**：使用Pipeline确保正确的处理顺序
5. **自动化特征工程**：考虑使用Featuretools等自动化工具
6. **特征重要性分析**：定期分析特征贡献，移除无用特征
7. **领域知识**：结合业务知识创建更有价值的特征

## 延伸阅读

### 推荐资源

- **《Feature Engineering for Machine Learning》**：特征工程专著
- **Kaggle特征工程教程**：实战案例丰富
- **scikit-learn文档**：预处理和特征选择API详解
- **Featuretools库**：自动化特征工程工具

### 进阶主题

- **自动特征工程（AutoFE）**：使用工具自动生成特征
- **深度学习特征学习**：使用神经网络自动学习特征表示
- **时序特征工程**：处理时间序列数据的特殊技术
- **图特征工程**：处理图结构数据的特征提取

## 总结

特征工程是机器学习项目成功的关键因素之一。本文介绍了特征工程的五个核心方面：

1. **特征提取**：从原始数据中创建有意义的特征
2. **特征转换**：将特征转换为更适合模型学习的形式
3. **特征编码**：将类别型特征转换为数值形式
4. **特征选择**：选择最相关的特征子集
5. **降维**：在保留信息的同时减少特征维度

掌握这些技术，结合领域知识和业务理解，你将能够为机器学习模型提供更加优质的输入，从而获得更好的预测性能。记住，特征工程是一个需要不断实践和迭代的过程，没有放之四海而皆准的最优方案，需要根据具体问题选择合适的方法。
