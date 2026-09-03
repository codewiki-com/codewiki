---
title: "Feature Engineering: Feature Selection Methods"
description: "Master three feature selection approaches: filter, wrapper, and embedded methods"
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - feature selection
  - feature engineering
  - filter method
  - embedded method
status: imported
origin: old/src/content/docs/datascience/feature-selection.zh.md
divergence: 0.242
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DataScience
  subcategory: FeatureEngineering
  order: 9
  lastUpdated: 2026-01-07
---

特征选择是机器学习流程中的关键步骤，它涉及从数据集中识别和选择最相关的特征。通过去除不相关、冗余或噪声特征，您可以提高模型性能、减少训练时间、增强可解释性并防止过拟合。本指南全面介绍了特征选择方法及其 Scikit-learn 实践实现。

## 为什么特征选择很重要

特征选择解决了机器学习中的几个基本挑战：

### 维度灾难

随着特征数量的增加，准确泛化所需的数据量呈指数级增长。这种现象被称为维度灾难，会导致：

- **数据稀疏**：数据点在高维空间中变得越来越分散
- **过拟合**：模型记忆噪声而不是学习模式
- **计算负担**：特征越多，训练时间显著增加

### 特征选择的好处

| 好处 | 描述 |
|------|------|
| 提高准确性 | 去除噪声有助于模型关注相关模式 |
| 减少过拟合 | 更少的特征意味着更小的记忆训练数据的机会 |
| 更快的训练 | 更小的特征空间需要更少的计算 |
| 更好的可解释性 | 更少的特征使模型决策更容易理解 |
| 更低的存储 | 减少数据集和模型的内存需求 |
| 更简单的部署 | 特征更少的模型更容易维护 |

### 特征选择与降维

虽然这两种技术都减少了输入变量的数量，但它们有本质区别：

```python
import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_classif

# 生成示例数据
np.random.seed(42)
X = np.random.randn(100, 10)
y = (X[:, 0] + X[:, 1] > 0).astype(int)

# 特征选择：保留原始特征
selector = SelectKBest(score_func=f_classif, k=3)
X_selected = selector.fit_transform(X, y)
print(f"特征选择 - 形状: {X_selected.shape}")
print(f"选中的特征索引: {selector.get_support(indices=True)}")

# 降维：创建新特征
pca = PCA(n_components=3)
X_pca = pca.fit_transform(X)
print(f"\nPCA - 形状: {X_pca.shape}")
print(f"解释方差: {pca.explained_variance_ratio_}")
```

**主要区别：**
- 特征选择保留原始特征及其可解释性
- 降维创建新的组合特征
- 当可解释性很重要时，首选特征选择

## 过滤方法

过滤方法独立于任何机器学习算法评估特征。它们使用统计度量来对特征进行评分和排名，然后根据这些分数选择前 k 个特征。

### 方差阈值

最简单的过滤方法是去除低方差特征。变化很小的特征对区分样本提供的信息很少。

```python
from sklearn.feature_selection import VarianceThreshold
import pandas as pd
import numpy as np

# 创建具有不同方差的示例数据
np.random.seed(42)
df = pd.DataFrame({
    'constant': [1] * 100,                      # 零方差
    'low_var': np.random.choice([0, 1], 100, p=[0.99, 0.01]),  # 极低方差
    'medium_var': np.random.randn(100) * 0.5,   # 中等方差
    'high_var': np.random.randn(100) * 2,       # 高方差
    'categorical': np.random.randint(0, 10, 100)  # 离散值
})

print("特征方差:")
print(df.var())

# 去除方差低于阈值的特征
selector = VarianceThreshold(threshold=0.1)
X_selected = selector.fit_transform(df)

selected_features = df.columns[selector.get_support()].tolist()
print(f"\n选中的特征: {selected_features}")
print(f"去除的特征: {[col for col in df.columns if col not in selected_features]}")
```

**使用时机：**
- 作为预处理步骤，快速去除明显无信息的特征
- 对于二元特征，使用基于 `p(1-p)` 的阈值，其中 p 是 1 的比例
- 将阈值设置为 0 只去除常量特征

### 基于相关性的选择

高度相关的特征提供冗余信息。从每对高度相关的特征中去除一个可以减少多重共线性并提高模型稳定性。

```python
import numpy as np
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

def correlation_filter(X, threshold=0.9):
    """
    去除彼此高度相关的特征。

    参数：
    -----------
    X : DataFrame
        特征矩阵
    threshold : float
        高于此值的相关性被认为是冗余的

    返回：
    --------
    减少特征后的 DataFrame，被删除的特征列表
    """
    # 计算相关矩阵
    corr_matrix = X.corr().abs()

    # 创建上三角掩码
    upper_tri = corr_matrix.where(
        np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
    )

    # 找出相关性高于阈值的特征
    to_drop = [column for column in upper_tri.columns
               if any(upper_tri[column] > threshold)]

    return X.drop(columns=to_drop), to_drop

# 示例用法
np.random.seed(42)
X = pd.DataFrame({
    'feature_1': np.random.randn(100),
    'feature_2': np.random.randn(100),
    'feature_3': np.random.randn(100),
})
# 添加相关特征
X['feature_1_copy'] = X['feature_1'] + np.random.randn(100) * 0.1
X['feature_2_copy'] = X['feature_2'] + np.random.randn(100) * 0.05

print("原始相关矩阵:")
print(X.corr().round(3))

X_reduced, dropped = correlation_filter(X, threshold=0.9)
print(f"\n删除的特征: {dropped}")
print(f"保留的特征: {X_reduced.columns.tolist()}")
```

**目标相关性选择：**

```python
def select_by_target_correlation(X, y, k=5, method='pearson'):
    """
    选择与目标最相关的前 k 个特征。

    参数：
    -----------
    X : DataFrame
        特征矩阵
    y : Series 或数组
        目标变量
    k : int
        要选择的特征数量
    method : str
        相关性方法（'pearson'、'spearman'、'kendall'）
    """
    correlations = pd.DataFrame({
        'feature': X.columns,
        'correlation': [X[col].corr(pd.Series(y), method=method)
                       for col in X.columns]
    })
    correlations['abs_correlation'] = correlations['correlation'].abs()
    correlations = correlations.sort_values('abs_correlation', ascending=False)

    top_features = correlations.head(k)['feature'].tolist()

    return X[top_features], correlations

# 示例
y = X['feature_1'] * 2 + np.random.randn(100) * 0.5
X_selected, corr_scores = select_by_target_correlation(X, y, k=3)
print("\n与目标的相关性:")
print(corr_scores)
```

### 互信息

互信息衡量两个变量之间的依赖关系，捕获线性和非线性关系。与相关性不同，它可以检测复杂的模式。

```python
from sklearn.feature_selection import mutual_info_classif, mutual_info_regression
from sklearn.feature_selection import SelectKBest
import numpy as np
import pandas as pd

def mutual_information_selection(X, y, task='classification', k=5):
    """
    使用互信息分数选择特征。

    参数：
    -----------
    X : DataFrame 或数组
        特征矩阵
    y : 数组
        目标变量
    task : str
        'classification' 或 'regression'
    k : int
        要选择的特征数量
    """
    # 选择适当的评分函数
    if task == 'classification':
        mi_func = mutual_info_classif
    else:
        mi_func = mutual_info_regression

    # 计算互信息分数
    mi_scores = mi_func(X, y, random_state=42)

    # 创建结果 DataFrame
    if isinstance(X, pd.DataFrame):
        feature_names = X.columns
    else:
        feature_names = [f'feature_{i}' for i in range(X.shape[1])]

    results = pd.DataFrame({
        'feature': feature_names,
        'mi_score': mi_scores
    }).sort_values('mi_score', ascending=False)

    # 选择前 k 个特征
    selector = SelectKBest(score_func=mi_func, k=k)
    X_selected = selector.fit_transform(X, y)
    selected_features = np.array(feature_names)[selector.get_support()]

    return X_selected, results, selected_features

# 非线性关系示例
np.random.seed(42)
X = pd.DataFrame({
    'linear': np.random.randn(500),
    'quadratic': np.random.randn(500),
    'sinusoidal': np.random.randn(500),
    'noise1': np.random.randn(500),
    'noise2': np.random.randn(500),
})

# 创建具有不同关系的目标
y = (X['linear'] + X['quadratic']**2 + np.sin(X['sinusoidal'] * 2) > 1).astype(int)

X_selected, mi_results, selected = mutual_information_selection(X, y, k=3)
print("互信息分数:")
print(mi_results)
print(f"\n选中的特征: {selected}")
```

### 统计检验

不同的统计检验适用于不同的数据类型和任务：

```python
from sklearn.feature_selection import (
    SelectKBest, chi2, f_classif, f_regression
)
from scipy import stats
import numpy as np
import pandas as pd

class StatisticalFeatureSelector:
    """
    使用各种统计检验进行特征选择。
    """

    def __init__(self, task='classification'):
        self.task = task

    def select_with_anova(self, X, y, k=5):
        """
        用于数值特征和分类目标的 ANOVA F 检验。
        检验由目标定义的组的均值是否相等。
        """
        selector = SelectKBest(score_func=f_classif, k=k)
        X_selected = selector.fit_transform(X, y)

        results = pd.DataFrame({
            'feature': X.columns if isinstance(X, pd.DataFrame) else range(X.shape[1]),
            'f_score': selector.scores_,
            'p_value': selector.pvalues_
        }).sort_values('f_score', ascending=False)

        return X_selected, results

    def select_with_chi2(self, X, y, k=5):
        """
        用于非负分类特征的卡方检验。
        检验特征和目标之间的独立性。
        """
        # 卡方检验需要非负值
        X_positive = X - X.min() if (X < 0).any().any() else X

        selector = SelectKBest(score_func=chi2, k=k)
        X_selected = selector.fit_transform(X_positive, y)

        results = pd.DataFrame({
            'feature': X.columns if isinstance(X, pd.DataFrame) else range(X.shape[1]),
            'chi2_score': selector.scores_,
            'p_value': selector.pvalues_
        }).sort_values('chi2_score', ascending=False)

        return X_selected, results

    def select_with_f_regression(self, X, y, k=5):
        """
        用于数值特征和连续目标的 F 检验。
        检验每个特征与目标之间的线性关系。
        """
        selector = SelectKBest(score_func=f_regression, k=k)
        X_selected = selector.fit_transform(X, y)

        results = pd.DataFrame({
            'feature': X.columns if isinstance(X, pd.DataFrame) else range(X.shape[1]),
            'f_score': selector.scores_,
            'p_value': selector.pvalues_
        }).sort_values('f_score', ascending=False)

        return X_selected, results

# 示例用法
np.random.seed(42)
X = pd.DataFrame(np.random.randn(200, 8),
                 columns=[f'feature_{i}' for i in range(8)])
y_class = (X['feature_0'] + X['feature_1'] > 0).astype(int)
y_reg = X['feature_0'] * 2 + X['feature_1'] * 0.5 + np.random.randn(200) * 0.1

selector = StatisticalFeatureSelector()

# 用于分类的 ANOVA
_, anova_results = selector.select_with_anova(X, y_class, k=3)
print("ANOVA F 检验结果:")
print(anova_results.head())

# 用于回归的 F 检验
_, freg_results = selector.select_with_f_regression(X, y_reg, k=3)
print("\nF 回归结果:")
print(freg_results.head())
```

### 完整的过滤方法流水线

```python
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_selection import VarianceThreshold, SelectKBest, mutual_info_classif
import numpy as np
import pandas as pd

class FilterMethodPipeline(BaseEstimator, TransformerMixin):
    """
    组合过滤方法的特征选择流水线。
    """

    def __init__(self, variance_threshold=0.01, correlation_threshold=0.9,
                 k_best=10, score_func=mutual_info_classif):
        self.variance_threshold = variance_threshold
        self.correlation_threshold = correlation_threshold
        self.k_best = k_best
        self.score_func = score_func

        self.variance_selector_ = None
        self.correlation_drops_ = None
        self.kbest_selector_ = None
        self.feature_names_ = None

    def fit(self, X, y=None):
        X = pd.DataFrame(X) if not isinstance(X, pd.DataFrame) else X.copy()
        self.feature_names_ = X.columns.tolist()

        # 步骤 1：方差阈值
        self.variance_selector_ = VarianceThreshold(threshold=self.variance_threshold)
        X_var = pd.DataFrame(
            self.variance_selector_.fit_transform(X),
            columns=X.columns[self.variance_selector_.get_support()]
        )

        # 步骤 2：相关性过滤
        corr_matrix = X_var.corr().abs()
        upper_tri = corr_matrix.where(
            np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
        )
        self.correlation_drops_ = [col for col in upper_tri.columns
                                   if any(upper_tri[col] > self.correlation_threshold)]
        X_corr = X_var.drop(columns=self.correlation_drops_)

        # 步骤 3：SelectKBest
        k = min(self.k_best, X_corr.shape[1])
        self.kbest_selector_ = SelectKBest(score_func=self.score_func, k=k)
        self.kbest_selector_.fit(X_corr, y)

        self.selected_features_ = X_corr.columns[self.kbest_selector_.get_support()].tolist()

        return self

    def transform(self, X):
        X = pd.DataFrame(X) if not isinstance(X, pd.DataFrame) else X.copy()

        # 应用方差阈值
        X_var = pd.DataFrame(
            self.variance_selector_.transform(X),
            columns=[col for i, col in enumerate(self.feature_names_)
                    if self.variance_selector_.get_support()[i]]
        )

        # 应用相关性过滤
        X_corr = X_var.drop(columns=self.correlation_drops_, errors='ignore')

        # 应用 SelectKBest
        X_selected = self.kbest_selector_.transform(X_corr)

        return X_selected

    def get_support(self):
        return self.selected_features_

# 示例用法
np.random.seed(42)
X = pd.DataFrame(np.random.randn(300, 20),
                 columns=[f'feature_{i}' for i in range(20)])
X['constant'] = 1  # 将被方差阈值去除
X['feature_0_dup'] = X['feature_0'] + np.random.randn(300) * 0.01  # 高度相关

y = (X['feature_0'] + X['feature_1'] - X['feature_2'] > 0).astype(int)

pipeline = FilterMethodPipeline(
    variance_threshold=0.01,
    correlation_threshold=0.95,
    k_best=5
)
X_filtered = pipeline.fit_transform(X, y)

print(f"原始特征数: {X.shape[1]}")
print(f"选中的特征数: {X_filtered.shape[1]}")
print(f"选中的特征名称: {pipeline.get_support()}")
```

## 包装方法

包装方法使用机器学习模型来评估特征子集。它们搜索不同的特征组合，并选择产生最佳模型性能的子集。

### 递归特征消除（RFE）

RFE 基于模型系数或特征重要性递归地去除最不重要的特征。

```python
from sklearn.feature_selection import RFE, RFECV
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold
import numpy as np
import pandas as pd

class RFESelector:
    """
    使用递归特征消除进行特征选择。
    """

    def __init__(self, estimator=None, n_features_to_select=5, step=1):
        self.estimator = estimator or LogisticRegression(max_iter=1000)
        self.n_features_to_select = n_features_to_select
        self.step = step
        self.rfe_ = None

    def fit_rfe(self, X, y):
        """
        应用基本的 RFE，指定特征数量。
        """
        self.rfe_ = RFE(
            estimator=self.estimator,
            n_features_to_select=self.n_features_to_select,
            step=self.step
        )
        self.rfe_.fit(X, y)

        # 创建排名 DataFrame
        if isinstance(X, pd.DataFrame):
            feature_names = X.columns
        else:
            feature_names = [f'feature_{i}' for i in range(X.shape[1])]

        rankings = pd.DataFrame({
            'feature': feature_names,
            'ranking': self.rfe_.ranking_,
            'selected': self.rfe_.support_
        }).sort_values('ranking')

        return self.rfe_.transform(X), rankings

    def fit_rfecv(self, X, y, cv=5, scoring='accuracy'):
        """
        应用带交叉验证的 RFE 以找到最优特征数量。
        """
        rfecv = RFECV(
            estimator=self.estimator,
            step=self.step,
            cv=StratifiedKFold(cv),
            scoring=scoring,
            n_jobs=-1
        )
        rfecv.fit(X, y)

        print(f"最优特征数量: {rfecv.n_features_}")

        if isinstance(X, pd.DataFrame):
            feature_names = X.columns
        else:
            feature_names = [f'feature_{i}' for i in range(X.shape[1])]

        rankings = pd.DataFrame({
            'feature': feature_names,
            'ranking': rfecv.ranking_,
            'selected': rfecv.support_
        }).sort_values('ranking')

        # 交叉验证分数
        cv_results = pd.DataFrame({
            'n_features': range(1, len(rfecv.cv_results_['mean_test_score']) + 1),
            'mean_score': rfecv.cv_results_['mean_test_score'],
            'std_score': rfecv.cv_results_['std_test_score']
        })

        return rfecv.transform(X), rankings, cv_results

    def transform(self, X):
        return self.rfe_.transform(X)

# 示例用法
np.random.seed(42)
n_samples, n_features = 500, 20
X = pd.DataFrame(
    np.random.randn(n_samples, n_features),
    columns=[f'feature_{i}' for i in range(n_features)]
)

# 创建只有部分特征相关的目标
y = (2 * X['feature_0'] + 1.5 * X['feature_1'] - X['feature_2'] +
     0.5 * X['feature_3'] + np.random.randn(n_samples) * 0.1 > 0).astype(int)

# 使用随机森林作为基础估计器
selector = RFESelector(
    estimator=RandomForestClassifier(n_estimators=100, random_state=42),
    n_features_to_select=5
)

X_selected, rankings = selector.fit_rfe(X, y)
print("特征排名:")
print(rankings.head(10))
print(f"\n选中特征的形状: {X_selected.shape}")

# 带交叉验证
selector_cv = RFESelector(
    estimator=RandomForestClassifier(n_estimators=100, random_state=42)
)
X_selected_cv, rankings_cv, cv_results = selector_cv.fit_rfecv(X, y, cv=5)
print("\n交叉验证结果:")
print(cv_results.head(10))
```

### 顺序特征选择

顺序特征选择基于交叉验证性能一次添加或删除一个特征。

```python
from sklearn.feature_selection import SequentialFeatureSelector
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
import numpy as np
import pandas as pd

class SequentialSelector:
    """
    前向和后向顺序特征选择。
    """

    def __init__(self, estimator=None, n_features_to_select='auto',
                 direction='forward', cv=5, scoring='accuracy'):
        self.estimator = estimator or RandomForestClassifier(n_estimators=100, random_state=42)
        self.n_features_to_select = n_features_to_select
        self.direction = direction
        self.cv = cv
        self.scoring = scoring
        self.selector_ = None

    def fit_transform(self, X, y):
        """
        拟合选择器并转换数据。
        """
        self.selector_ = SequentialFeatureSelector(
            estimator=self.estimator,
            n_features_to_select=self.n_features_to_select,
            direction=self.direction,
            cv=self.cv,
            scoring=self.scoring,
            n_jobs=-1
        )

        X_selected = self.selector_.fit_transform(X, y)

        if isinstance(X, pd.DataFrame):
            selected_features = X.columns[self.selector_.get_support()].tolist()
        else:
            selected_features = list(np.where(self.selector_.get_support())[0])

        return X_selected, selected_features

    def transform(self, X):
        return self.selector_.transform(X)

def compare_selection_directions(X, y, estimator, n_features=5):
    """
    比较前向和后向选择策略。
    """
    results = {}

    for direction in ['forward', 'backward']:
        selector = SequentialSelector(
            estimator=estimator,
            n_features_to_select=n_features,
            direction=direction,
            cv=5
        )
        X_selected, features = selector.fit_transform(X, y)

        # 使用交叉验证评估
        cv_scores = cross_val_score(estimator, X_selected, y, cv=5)

        results[direction] = {
            'features': features,
            'mean_cv_score': cv_scores.mean(),
            'std_cv_score': cv_scores.std()
        }

    return results

# 示例用法
np.random.seed(42)
X = pd.DataFrame(
    np.random.randn(300, 15),
    columns=[f'feature_{i}' for i in range(15)]
)
y = (X['feature_0'] + X['feature_1'] - X['feature_2'] > 0).astype(int)

# 比较前向和后向选择
comparison = compare_selection_directions(
    X, y,
    LogisticRegression(max_iter=1000),
    n_features=5
)

for direction, result in comparison.items():
    print(f"\n{direction.upper()} 选择:")
    print(f"  选中的特征: {result['features']}")
    print(f"  CV 分数: {result['mean_cv_score']:.4f} (+/- {result['std_cv_score']:.4f})")
```

### 穷举特征选择

对于小型特征集，穷举搜索评估所有可能的组合。

```python
from itertools import combinations
from sklearn.model_selection import cross_val_score
from sklearn.linear_model import LogisticRegression
import numpy as np
import pandas as pd
from concurrent.futures import ProcessPoolExecutor

def exhaustive_feature_selection(X, y, estimator, min_features=1, max_features=None,
                                 cv=5, scoring='accuracy', n_jobs=-1):
    """
    对所有特征子集进行穷举搜索。

    警告：对于大型特征集，计算代价很高！
    时间复杂度：O(2^n)，其中 n 是特征数量。
    """
    if isinstance(X, pd.DataFrame):
        feature_names = X.columns.tolist()
        X_array = X.values
    else:
        feature_names = list(range(X.shape[1]))
        X_array = X

    n_features = len(feature_names)
    max_features = max_features or n_features

    results = []

    for k in range(min_features, max_features + 1):
        for feature_subset in combinations(range(n_features), k):
            X_subset = X_array[:, feature_subset]
            cv_scores = cross_val_score(estimator, X_subset, y, cv=cv, scoring=scoring)

            results.append({
                'features': [feature_names[i] for i in feature_subset],
                'n_features': k,
                'mean_score': cv_scores.mean(),
                'std_score': cv_scores.std()
            })

    results_df = pd.DataFrame(results).sort_values('mean_score', ascending=False)

    return results_df

# 小型特征集示例
np.random.seed(42)
X = pd.DataFrame(
    np.random.randn(200, 6),  # 只有 6 个特征用于穷举搜索
    columns=['A', 'B', 'C', 'D', 'E', 'F']
)
y = (X['A'] + X['B'] > 0).astype(int)

print("运行穷举特征选择...")
results = exhaustive_feature_selection(
    X, y,
    LogisticRegression(max_iter=1000),
    min_features=1,
    max_features=4,
    cv=5
)

print("\n前 10 个特征组合:")
print(results.head(10))
```

## 嵌入方法

嵌入方法将特征选择作为模型训练过程的一部分执行。它们结合了过滤方法和包装方法的优点，同时计算效率高。

### L1 正则化（Lasso）

L1 正则化将特征系数驱动到精确为零，有效地执行特征选择。

```python
from sklearn.linear_model import Lasso, LassoCV, LogisticRegression
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd

class LassoFeatureSelector:
    """
    使用 L1（Lasso）正则化进行特征选择。
    """

    def __init__(self, task='regression', cv=5, max_iter=10000):
        self.task = task
        self.cv = cv
        self.max_iter = max_iter
        self.model_ = None
        self.scaler_ = StandardScaler()

    def fit(self, X, y):
        """
        使用交叉验证拟合 Lasso 模型以找到最优 alpha。
        """
        X_scaled = self.scaler_.fit_transform(X)

        if self.task == 'regression':
            self.model_ = LassoCV(cv=self.cv, max_iter=self.max_iter, random_state=42)
        else:
            # 对于分类，使用带 L1 的 LogisticRegression
            from sklearn.linear_model import LogisticRegressionCV
            self.model_ = LogisticRegressionCV(
                penalty='l1',
                solver='saga',
                cv=self.cv,
                max_iter=self.max_iter,
                random_state=42
            )

        self.model_.fit(X_scaled, y)

        return self

    def get_feature_importance(self, feature_names=None):
        """
        获取特征系数和选择状态。
        """
        if self.task == 'regression':
            coefs = self.model_.coef_
        else:
            coefs = self.model_.coef_.ravel()

        if feature_names is None:
            feature_names = [f'feature_{i}' for i in range(len(coefs))]

        importance = pd.DataFrame({
            'feature': feature_names,
            'coefficient': coefs,
            'abs_coefficient': np.abs(coefs),
            'selected': coefs != 0
        }).sort_values('abs_coefficient', ascending=False)

        return importance

    def transform(self, X, feature_names=None):
        """
        仅返回选中的特征。
        """
        importance = self.get_feature_importance(feature_names)
        selected = importance[importance['selected']]['feature'].tolist()

        if isinstance(X, pd.DataFrame):
            return X[selected]
        else:
            selected_indices = importance[importance['selected']].index.tolist()
            return X[:, selected_indices]

# 回归示例
np.random.seed(42)
n_samples = 500
X = pd.DataFrame({
    'relevant_1': np.random.randn(n_samples),
    'relevant_2': np.random.randn(n_samples),
    'relevant_3': np.random.randn(n_samples),
    'noise_1': np.random.randn(n_samples),
    'noise_2': np.random.randn(n_samples),
    'noise_3': np.random.randn(n_samples),
    'noise_4': np.random.randn(n_samples),
    'noise_5': np.random.randn(n_samples),
})

# 目标仅依赖于相关特征
y = (3 * X['relevant_1'] + 2 * X['relevant_2'] - X['relevant_3'] +
     np.random.randn(n_samples) * 0.5)

selector = LassoFeatureSelector(task='regression')
selector.fit(X, y)

importance = selector.get_feature_importance(X.columns.tolist())
print("Lasso 特征选择结果:")
print(importance)

print(f"\n最优 alpha: {selector.model_.alpha_:.6f}")
print(f"选中的特征数量: {importance['selected'].sum()}")
```

### 基于树的特征重要性

基于树的模型提供内置的特征重要性度量。

```python
from sklearn.ensemble import (
    RandomForestClassifier, RandomForestRegressor,
    GradientBoostingClassifier, GradientBoostingRegressor,
    ExtraTreesClassifier
)
from sklearn.inspection import permutation_importance
import numpy as np
import pandas as pd

class TreeBasedFeatureSelector:
    """
    使用基于树的模型重要性进行特征选择。
    """

    def __init__(self, model_type='random_forest', task='classification',
                 n_estimators=100, random_state=42):
        self.model_type = model_type
        self.task = task
        self.n_estimators = n_estimators
        self.random_state = random_state
        self.model_ = None

    def _get_model(self):
        """根据配置获取适当的模型。"""
        models = {
            ('random_forest', 'classification'): RandomForestClassifier,
            ('random_forest', 'regression'): RandomForestRegressor,
            ('gradient_boosting', 'classification'): GradientBoostingClassifier,
            ('gradient_boosting', 'regression'): GradientBoostingRegressor,
            ('extra_trees', 'classification'): ExtraTreesClassifier,
        }

        model_class = models.get((self.model_type, self.task))
        if model_class is None:
            raise ValueError(f"未知的模型类型: {self.model_type}")

        return model_class(n_estimators=self.n_estimators,
                          random_state=self.random_state)

    def fit(self, X, y):
        """拟合基于树的模型。"""
        self.model_ = self._get_model()
        self.model_.fit(X, y)
        return self

    def get_feature_importance(self, X, feature_names=None, method='default'):
        """
        获取特征重要性分数。

        参数：
        -----------
        method : str
            'default' - 使用模型内置的 feature_importances_
            'permutation' - 使用排列重要性
        """
        if feature_names is None:
            if isinstance(X, pd.DataFrame):
                feature_names = X.columns.tolist()
            else:
                feature_names = [f'feature_{i}' for i in range(X.shape[1])]

        if method == 'default':
            importances = self.model_.feature_importances_
            importance_std = np.zeros_like(importances)

            # 对于随机森林，我们可以从单个树中获取标准差
            if hasattr(self.model_, 'estimators_'):
                all_importances = np.array([tree.feature_importances_
                                           for tree in self.model_.estimators_])
                importance_std = all_importances.std(axis=0)

        elif method == 'permutation':
            # 排列重要性更可靠但更慢
            y_pred = self.model_.predict(X)  # 需要重新拟合以进行正确评估
            perm_importance = permutation_importance(
                self.model_, X, y_pred,
                n_repeats=10,
                random_state=self.random_state
            )
            importances = perm_importance.importances_mean
            importance_std = perm_importance.importances_std
        else:
            raise ValueError(f"未知的方法: {method}")

        results = pd.DataFrame({
            'feature': feature_names,
            'importance': importances,
            'std': importance_std
        }).sort_values('importance', ascending=False)

        return results

    def select_features(self, X, y, threshold='mean'):
        """
        基于重要性阈值选择特征。

        参数：
        -----------
        threshold : str 或 float
            'mean' - 选择高于平均重要性的特征
            'median' - 选择高于中位数重要性的特征
            float - 选择高于此阈值的特征
        """
        self.fit(X, y)
        importance = self.get_feature_importance(X)

        if threshold == 'mean':
            thresh_value = importance['importance'].mean()
        elif threshold == 'median':
            thresh_value = importance['importance'].median()
        else:
            thresh_value = threshold

        selected = importance[importance['importance'] >= thresh_value]['feature'].tolist()

        return selected, importance

# 示例用法
np.random.seed(42)
X = pd.DataFrame(np.random.randn(500, 10),
                 columns=[f'feature_{i}' for i in range(10)])
y = (X['feature_0'] * 3 + X['feature_1'] * 2 + X['feature_2'] +
     np.random.randn(500) * 0.5 > 0).astype(int)

selector = TreeBasedFeatureSelector(model_type='random_forest', task='classification')

selected_features, importance = selector.select_features(X, y, threshold='mean')

print("特征重要性（随机森林）:")
print(importance)
print(f"\n选中的特征（高于平均值）: {selected_features}")

# 与排列重要性比较
selector.fit(X, y)
perm_importance = selector.get_feature_importance(X, method='permutation')
print("\n排列重要性:")
print(perm_importance)
```

### 梯度提升的特征重要性

```python
import numpy as np
import pandas as pd

# XGBoost 特征重要性
def xgboost_feature_selection(X, y, task='classification'):
    """
    使用 XGBoost 重要性类型进行特征选择。
    """
    try:
        import xgboost as xgb
    except ImportError:
        print("XGBoost 未安装。使用以下命令安装: pip install xgboost")
        return None

    if task == 'classification':
        model = xgb.XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss')
    else:
        model = xgb.XGBRegressor(n_estimators=100, random_state=42)

    model.fit(X, y)

    feature_names = X.columns.tolist() if isinstance(X, pd.DataFrame) else \
                    [f'feature_{i}' for i in range(X.shape[1])]

    # XGBoost 提供多种重要性类型
    importance_types = ['weight', 'gain', 'cover']
    results = pd.DataFrame({'feature': feature_names})

    for imp_type in importance_types:
        booster = model.get_booster()
        importance = booster.get_score(importance_type=imp_type)

        # 将特征名称映射到重要性值
        results[imp_type] = [importance.get(f, 0) for f in feature_names]

    # 归一化每种重要性类型
    for col in importance_types:
        if results[col].sum() > 0:
            results[f'{col}_normalized'] = results[col] / results[col].sum()

    return results.sort_values('gain', ascending=False)

# LightGBM 特征重要性
def lightgbm_feature_selection(X, y, task='classification'):
    """
    使用 LightGBM 重要性进行特征选择。
    """
    try:
        import lightgbm as lgb
    except ImportError:
        print("LightGBM 未安装。使用以下命令安装: pip install lightgbm")
        return None

    if task == 'classification':
        model = lgb.LGBMClassifier(n_estimators=100, random_state=42, verbose=-1)
    else:
        model = lgb.LGBMRegressor(n_estimators=100, random_state=42, verbose=-1)

    model.fit(X, y)

    feature_names = X.columns.tolist() if isinstance(X, pd.DataFrame) else \
                    [f'feature_{i}' for i in range(X.shape[1])]

    results = pd.DataFrame({
        'feature': feature_names,
        'split_importance': model.booster_.feature_importance(importance_type='split'),
        'gain_importance': model.booster_.feature_importance(importance_type='gain')
    })

    return results.sort_values('gain_importance', ascending=False)

# 示例用法
np.random.seed(42)
X = pd.DataFrame(np.random.randn(500, 10),
                 columns=[f'feature_{i}' for i in range(10)])
y = (X['feature_0'] * 3 + X['feature_1'] * 2 + X['feature_2'] > 0).astype(int)

print("XGBoost 特征重要性:")
xgb_importance = xgboost_feature_selection(X, y)
if xgb_importance is not None:
    print(xgb_importance)

print("\nLightGBM 特征重要性:")
lgb_importance = lightgbm_feature_selection(X, y)
if lgb_importance is not None:
    print(lgb_importance)
```

### 弹性网络选择

弹性网络结合 L1 和 L2 正则化，用于具有分组变量的特征选择。

```python
from sklearn.linear_model import ElasticNetCV, ElasticNet
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd

class ElasticNetSelector:
    """
    使用弹性网络正则化进行特征选择。
    结合 L1（稀疏性）和 L2（分组）惩罚。
    """

    def __init__(self, l1_ratio=0.5, cv=5, max_iter=10000):
        """
        参数：
        -----------
        l1_ratio : float
            混合参数。l1_ratio=1 是 Lasso，l1_ratio=0 是 Ridge。
            介于 0 和 1 之间的值结合两种惩罚。
        """
        self.l1_ratio = l1_ratio
        self.cv = cv
        self.max_iter = max_iter
        self.model_ = None
        self.scaler_ = StandardScaler()

    def fit(self, X, y):
        """使用交叉验证拟合弹性网络。"""
        X_scaled = self.scaler_.fit_transform(X)

        self.model_ = ElasticNetCV(
            l1_ratio=self.l1_ratio,
            cv=self.cv,
            max_iter=self.max_iter,
            random_state=42
        )
        self.model_.fit(X_scaled, y)

        return self

    def get_feature_importance(self, feature_names=None):
        """获取特征系数和选择状态。"""
        coefs = self.model_.coef_

        if feature_names is None:
            feature_names = [f'feature_{i}' for i in range(len(coefs))]

        results = pd.DataFrame({
            'feature': feature_names,
            'coefficient': coefs,
            'abs_coefficient': np.abs(coefs),
            'selected': coefs != 0
        }).sort_values('abs_coefficient', ascending=False)

        return results

    def compare_l1_ratios(self, X, y, l1_ratios=[0.1, 0.5, 0.7, 0.9, 0.95, 0.99]):
        """
        比较不同 L1 比率下的特征选择。
        """
        X_scaled = self.scaler_.fit_transform(X)
        results = []

        for ratio in l1_ratios:
            model = ElasticNetCV(
                l1_ratio=ratio,
                cv=self.cv,
                max_iter=self.max_iter,
                random_state=42
            )
            model.fit(X_scaled, y)

            n_selected = np.sum(model.coef_ != 0)
            results.append({
                'l1_ratio': ratio,
                'n_selected_features': n_selected,
                'alpha': model.alpha_,
                'r2_score': model.score(X_scaled, y)
            })

        return pd.DataFrame(results)

# 示例用法
np.random.seed(42)
n_samples = 500
n_features = 20

# 创建具有分组的特征（相关）
X = pd.DataFrame()
for i in range(5):
    base = np.random.randn(n_samples)
    for j in range(4):
        X[f'group{i}_feat{j}'] = base + np.random.randn(n_samples) * 0.3

# 目标依赖于每个组中的一个特征
y = (X['group0_feat0'] + X['group1_feat0'] + X['group2_feat0'] +
     np.random.randn(n_samples) * 0.5)

selector = ElasticNetSelector(l1_ratio=0.5)
selector.fit(X, y)

importance = selector.get_feature_importance(X.columns.tolist())
print("弹性网络特征选择:")
print(importance[importance['selected']])

# 比较不同的 L1 比率
comparison = selector.compare_l1_ratios(X, y)
print("\nL1 比率比较:")
print(comparison)
```

## 稳定性选择

稳定性选择通过将随机化与选择算法相结合来解决特征选择的不稳定性问题。

### 使用 Scikit-learn 实现

```python
from sklearn.linear_model import LassoCV
from sklearn.utils import resample
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd

class StabilitySelector:
    """
    用于稳健特征选择的稳定性选择。

    反复对数据进行子采样并应用特征选择方法，
    跟踪每个特征被选中的频率。
    """

    def __init__(self, base_selector=None, n_bootstrap=100,
                 sample_fraction=0.5, threshold=0.6):
        """
        参数：
        -----------
        base_selector : estimator
            要使用的特征选择器（必须有 coef_ 或 feature_importances_）
        n_bootstrap : int
            自助法迭代次数
        sample_fraction : float
            每次迭代中使用的样本比例
        threshold : float
            选择阈值（在 >threshold% 的迭代中被选中的特征）
        """
        self.base_selector = base_selector or LassoCV(cv=5, max_iter=10000)
        self.n_bootstrap = n_bootstrap
        self.sample_fraction = sample_fraction
        self.threshold = threshold
        self.selection_frequencies_ = None
        self.scaler_ = StandardScaler()

    def fit(self, X, y):
        """
        运行稳定性选择。
        """
        n_samples = X.shape[0]
        n_features = X.shape[1]
        sample_size = int(n_samples * self.sample_fraction)

        X_scaled = self.scaler_.fit_transform(X)

        # 跟踪选择计数
        selection_counts = np.zeros(n_features)

        for i in range(self.n_bootstrap):
            # 自助采样
            indices = resample(range(n_samples), n_samples=sample_size,
                             random_state=i)
            X_boot = X_scaled[indices]
            y_boot = y.iloc[indices] if hasattr(y, 'iloc') else y[indices]

            # 拟合选择器
            self.base_selector.fit(X_boot, y_boot)

            # 跟踪选中的特征
            if hasattr(self.base_selector, 'coef_'):
                selected = self.base_selector.coef_ != 0
            elif hasattr(self.base_selector, 'feature_importances_'):
                threshold = np.mean(self.base_selector.feature_importances_)
                selected = self.base_selector.feature_importances_ >= threshold
            else:
                raise ValueError("选择器必须有 coef_ 或 feature_importances_")

            selection_counts += selected.astype(int)

        self.selection_frequencies_ = selection_counts / self.n_bootstrap

        return self

    def get_selected_features(self, feature_names=None):
        """
        获取高于阈值被选中的特征。
        """
        if feature_names is None:
            feature_names = [f'feature_{i}' for i in range(len(self.selection_frequencies_))]

        results = pd.DataFrame({
            'feature': feature_names,
            'selection_frequency': self.selection_frequencies_,
            'selected': self.selection_frequencies_ >= self.threshold
        }).sort_values('selection_frequency', ascending=False)

        return results

    def transform(self, X, feature_names=None):
        """仅返回稳定的特征。"""
        results = self.get_selected_features(feature_names)
        selected = results[results['selected']]['feature'].tolist()

        if isinstance(X, pd.DataFrame):
            return X[selected]
        else:
            selected_indices = results[results['selected']].index.tolist()
            return X[:, selected_indices]

# 示例用法
np.random.seed(42)
n_samples = 300
n_features = 20

X = pd.DataFrame(
    np.random.randn(n_samples, n_features),
    columns=[f'feature_{i}' for i in range(n_features)]
)

# 只有前 5 个特征是相关的
y = (X.iloc[:, :5].sum(axis=1) + np.random.randn(n_samples) * 0.5)

stability_selector = StabilitySelector(
    n_bootstrap=50,
    sample_fraction=0.5,
    threshold=0.6
)

stability_selector.fit(X, y)
results = stability_selector.get_selected_features(X.columns.tolist())

print("稳定性选择结果:")
print(results)

selected = results[results['selected']]['feature'].tolist()
print(f"\n稳定特征（阈值=0.6）: {selected}")
```

### 选择稳定性可视化

```python
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

def plot_stability_path(X, y, base_selector, n_bootstrap=50,
                        sample_fractions=[0.3, 0.5, 0.7]):
    """
    绘制不同采样比例下的稳定性选择频率。
    """
    from sklearn.preprocessing import StandardScaler
    from sklearn.utils import resample

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    feature_names = X.columns.tolist() if isinstance(X, pd.DataFrame) else \
                    [f'feature_{i}' for i in range(X.shape[1])]

    fig, axes = plt.subplots(1, len(sample_fractions), figsize=(5*len(sample_fractions), 5))

    for ax, fraction in zip(axes, sample_fractions):
        n_samples = X.shape[0]
        sample_size = int(n_samples * fraction)
        selection_counts = np.zeros(X.shape[1])

        for i in range(n_bootstrap):
            indices = resample(range(n_samples), n_samples=sample_size, random_state=i)
            X_boot = X_scaled[indices]
            y_boot = y.iloc[indices] if hasattr(y, 'iloc') else y[indices]

            base_selector.fit(X_boot, y_boot)

            if hasattr(base_selector, 'coef_'):
                selected = base_selector.coef_ != 0
            else:
                threshold = np.mean(base_selector.feature_importances_)
                selected = base_selector.feature_importances_ >= threshold

            selection_counts += selected.astype(int)

        frequencies = selection_counts / n_bootstrap

        # 按频率排序
        sorted_idx = np.argsort(frequencies)[::-1]
        sorted_freq = frequencies[sorted_idx]
        sorted_names = [feature_names[i] for i in sorted_idx]

        ax.barh(range(len(sorted_freq)), sorted_freq)
        ax.set_yticks(range(len(sorted_names)))
        ax.set_yticklabels(sorted_names, fontsize=8)
        ax.set_xlabel('选择频率')
        ax.set_title(f'采样比例: {fraction}')
        ax.axvline(x=0.6, color='red', linestyle='--', label='阈值')
        ax.invert_yaxis()
        ax.legend()

    plt.tight_layout()
    return fig

# 示例
from sklearn.linear_model import LassoCV

np.random.seed(42)
X = pd.DataFrame(np.random.randn(200, 10),
                 columns=[f'feat_{i}' for i in range(10)])
y = X['feat_0'] * 3 + X['feat_1'] * 2 + X['feat_2'] + np.random.randn(200) * 0.5

fig = plot_stability_path(X, y, LassoCV(cv=3, max_iter=5000), n_bootstrap=30)
plt.savefig('stability_selection.png', dpi=150, bbox_inches='tight')
print("稳定性选择图已保存。")
```

## 自动特征选择

自动特征选择结合多种方法来创建稳健的特征选择流水线。

### 组合选择策略

```python
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_selection import (
    VarianceThreshold, SelectKBest, mutual_info_classif, RFE
)
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LassoCV
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd

class AutoFeatureSelector(BaseEstimator, TransformerMixin):
    """
    结合多种方法的自动特征选择。

    策略：
    1. 去除低方差特征（过滤）
    2. 去除高度相关的特征（过滤）
    3. 使用互信息进行统计选择（过滤）
    4. 使用 Lasso 进行基于模型的选择（嵌入）
    5. 基于共识进行最终选择
    """

    def __init__(self, variance_threshold=0.01, correlation_threshold=0.95,
                 mi_percentile=50, consensus_threshold=2):
        """
        参数：
        -----------
        variance_threshold : float
            特征的最小方差
        correlation_threshold : float
            特征之间的最大相关性
        mi_percentile : int
            互信息选择的百分位阈值
        consensus_threshold : int
            必须选择某个特征的最少方法数
        """
        self.variance_threshold = variance_threshold
        self.correlation_threshold = correlation_threshold
        self.mi_percentile = mi_percentile
        self.consensus_threshold = consensus_threshold

        self.variance_selector_ = None
        self.correlation_drops_ = []
        self.mi_scores_ = None
        self.lasso_coefs_ = None
        self.selection_summary_ = None
        self.selected_features_ = None

    def fit(self, X, y):
        """拟合所有选择方法。"""
        X = pd.DataFrame(X) if not isinstance(X, pd.DataFrame) else X.copy()
        feature_names = X.columns.tolist()

        selection_votes = pd.DataFrame({'feature': feature_names})
        selection_votes['variance'] = False
        selection_votes['correlation'] = False
        selection_votes['mutual_info'] = False
        selection_votes['lasso'] = False

        # 步骤 1：方差阈值
        self.variance_selector_ = VarianceThreshold(threshold=self.variance_threshold)
        self.variance_selector_.fit(X)
        variance_selected = self.variance_selector_.get_support()
        selection_votes.loc[variance_selected, 'variance'] = True

        # 继续使用方差过滤后的特征
        X_var = X.loc[:, variance_selected]
        var_features = X_var.columns.tolist()

        # 步骤 2：相关性过滤
        corr_matrix = X_var.corr().abs()
        upper_tri = corr_matrix.where(
            np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
        )
        self.correlation_drops_ = [col for col in upper_tri.columns
                                   if any(upper_tri[col] > self.correlation_threshold)]
        corr_selected = [f for f in var_features if f not in self.correlation_drops_]
        selection_votes.loc[selection_votes['feature'].isin(corr_selected), 'correlation'] = True

        # 步骤 3：互信息
        X_corr = X_var.drop(columns=self.correlation_drops_)
        mi_scores = mutual_info_classif(X_corr, y, random_state=42)
        threshold = np.percentile(mi_scores, self.mi_percentile)
        mi_selected = X_corr.columns[mi_scores >= threshold].tolist()
        selection_votes.loc[selection_votes['feature'].isin(mi_selected), 'mutual_info'] = True
        self.mi_scores_ = dict(zip(X_corr.columns, mi_scores))

        # 步骤 4：Lasso 选择
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_corr)
        lasso = LassoCV(cv=5, max_iter=10000, random_state=42)
        lasso.fit(X_scaled, y)
        lasso_selected = X_corr.columns[lasso.coef_ != 0].tolist()
        selection_votes.loc[selection_votes['feature'].isin(lasso_selected), 'lasso'] = True
        self.lasso_coefs_ = dict(zip(X_corr.columns, lasso.coef_))

        # 共识选择
        vote_cols = ['variance', 'correlation', 'mutual_info', 'lasso']
        selection_votes['total_votes'] = selection_votes[vote_cols].sum(axis=1)
        selection_votes['selected'] = selection_votes['total_votes'] >= self.consensus_threshold

        self.selection_summary_ = selection_votes
        self.selected_features_ = selection_votes[selection_votes['selected']]['feature'].tolist()

        return self

    def transform(self, X):
        """将数据转换为选中的特征。"""
        X = pd.DataFrame(X) if not isinstance(X, pd.DataFrame) else X
        return X[self.selected_features_]

    def get_selection_summary(self):
        """返回详细的选择摘要。"""
        return self.selection_summary_.sort_values('total_votes', ascending=False)

# 示例用法
np.random.seed(42)
n_samples = 500
n_features = 30

X = pd.DataFrame(
    np.random.randn(n_samples, n_features),
    columns=[f'feature_{i}' for i in range(n_features)]
)

# 添加一些有问题的特征
X['constant'] = 1  # 零方差
X['low_var'] = np.random.choice([0, 1], n_samples, p=[0.99, 0.01])
X['highly_correlated'] = X['feature_0'] + np.random.randn(n_samples) * 0.01

# 目标依赖于特征子集
y = (X['feature_0'] * 3 + X['feature_1'] * 2 + X['feature_2'] - X['feature_3'] +
     np.random.randn(n_samples) * 0.5 > 0).astype(int)

auto_selector = AutoFeatureSelector(
    variance_threshold=0.01,
    correlation_threshold=0.95,
    mi_percentile=50,
    consensus_threshold=2
)

X_selected = auto_selector.fit_transform(X, y)

print("自动特征选择摘要:")
summary = auto_selector.get_selection_summary()
print(summary.head(15))

print(f"\n选中的特征（{len(auto_selector.selected_features_)} 个）:")
print(auto_selector.selected_features_)
```

### 交叉验证特征选择

```python
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.feature_selection import SelectFromModel
from sklearn.ensemble import RandomForestClassifier
import numpy as np
import pandas as pd

class CrossValidatedFeatureSelector:
    """
    带交叉验证的特征选择以防止过拟合。
    """

    def __init__(self, n_splits=5, random_state=42):
        self.n_splits = n_splits
        self.random_state = random_state
        self.cv_results_ = None

    def evaluate_selection_methods(self, X, y, final_estimator=None):
        """
        使用交叉验证比较不同的特征选择方法。
        """
        if final_estimator is None:
            final_estimator = LogisticRegression(max_iter=1000)

        # 定义选择方法
        selection_methods = {
            'no_selection': None,
            'variance_threshold': VarianceThreshold(threshold=0.01),
            'mutual_info': SelectKBest(score_func=mutual_info_classif, k=10),
            'lasso': SelectFromModel(LassoCV(cv=3, max_iter=5000)),
            'tree_importance': SelectFromModel(
                RandomForestClassifier(n_estimators=50, random_state=42)
            ),
            'rfe': RFE(estimator=LogisticRegression(max_iter=1000),
                      n_features_to_select=10)
        }

        cv = StratifiedKFold(n_splits=self.n_splits, shuffle=True,
                            random_state=self.random_state)

        results = []

        for name, selector in selection_methods.items():
            if selector is None:
                pipeline = Pipeline([
                    ('scaler', StandardScaler()),
                    ('classifier', final_estimator)
                ])
            else:
                pipeline = Pipeline([
                    ('scaler', StandardScaler()),
                    ('selector', selector),
                    ('classifier', final_estimator)
                ])

            scores = cross_val_score(pipeline, X, y, cv=cv, scoring='accuracy')

            results.append({
                'method': name,
                'mean_accuracy': scores.mean(),
                'std_accuracy': scores.std(),
                'min_accuracy': scores.min(),
                'max_accuracy': scores.max()
            })

        self.cv_results_ = pd.DataFrame(results).sort_values(
            'mean_accuracy', ascending=False
        )

        return self.cv_results_

    def nested_cv_selection(self, X, y, selector, estimator,
                           outer_cv=5, inner_cv=3):
        """
        嵌套交叉验证用于特征选择的无偏评估。

        外层循环：评估最终模型性能
        内层循环：调整特征选择
        """
        outer_cv_splits = StratifiedKFold(n_splits=outer_cv, shuffle=True,
                                          random_state=self.random_state)

        outer_scores = []
        selected_features_per_fold = []

        for fold, (train_idx, test_idx) in enumerate(outer_cv_splits.split(X, y)):
            X_train = X.iloc[train_idx] if isinstance(X, pd.DataFrame) else X[train_idx]
            X_test = X.iloc[test_idx] if isinstance(X, pd.DataFrame) else X[test_idx]
            y_train = y.iloc[train_idx] if hasattr(y, 'iloc') else y[train_idx]
            y_test = y.iloc[test_idx] if hasattr(y, 'iloc') else y[test_idx]

            # 内层 CV 用于特征选择
            pipeline = Pipeline([
                ('scaler', StandardScaler()),
                ('selector', selector),
                ('classifier', estimator)
            ])

            pipeline.fit(X_train, y_train)
            score = pipeline.score(X_test, y_test)
            outer_scores.append(score)

            # 跟踪选中的特征
            if hasattr(pipeline.named_steps['selector'], 'get_support'):
                if isinstance(X, pd.DataFrame):
                    selected = X.columns[pipeline.named_steps['selector'].get_support()].tolist()
                else:
                    selected = list(np.where(pipeline.named_steps['selector'].get_support())[0])
                selected_features_per_fold.append(selected)

        return {
            'mean_score': np.mean(outer_scores),
            'std_score': np.std(outer_scores),
            'scores': outer_scores,
            'selected_features_per_fold': selected_features_per_fold
        }

# 示例用法
np.random.seed(42)
X = pd.DataFrame(np.random.randn(400, 20),
                 columns=[f'feature_{i}' for i in range(20)])
y = (X['feature_0'] * 2 + X['feature_1'] - X['feature_2'] > 0).astype(int)

cv_selector = CrossValidatedFeatureSelector(n_splits=5)

# 比较方法
print("比较特征选择方法:")
results = cv_selector.evaluate_selection_methods(X, y)
print(results)

# 嵌套 CV 用于无偏评估
print("\n嵌套 CV 结果:")
nested_results = cv_selector.nested_cv_selection(
    X, y,
    selector=SelectKBest(score_func=mutual_info_classif, k=5),
    estimator=LogisticRegression(max_iter=1000)
)
print(f"平均分数: {nested_results['mean_score']:.4f} (+/- {nested_results['std_score']:.4f})")
```

## 完整的 Scikit-learn 流水线

### 生产就绪的特征选择流水线

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectFromModel, VarianceThreshold
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, GridSearchCV
import numpy as np
import pandas as pd

def create_feature_selection_pipeline(numerical_features, categorical_features,
                                      selection_method='tree', n_features=10):
    """
    创建完整的预处理和特征选择流水线。

    参数：
    -----------
    numerical_features : list
        数值列的名称
    categorical_features : list
        分类列的名称
    selection_method : str
        'tree'、'lasso' 或 'kbest'
    n_features : int
        要选择的特征数量
    """
    # 数值预处理
    numerical_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    # 分类预处理
    categorical_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    # 组合预处理器
    preprocessor = ColumnTransformer([
        ('numerical', numerical_transformer, numerical_features),
        ('categorical', categorical_transformer, categorical_features)
    ])

    # 特征选择步骤
    if selection_method == 'tree':
        selector = SelectFromModel(
            RandomForestClassifier(n_estimators=100, random_state=42),
            max_features=n_features
        )
    elif selection_method == 'lasso':
        selector = SelectFromModel(
            LassoCV(cv=5, max_iter=10000, random_state=42),
            max_features=n_features
        )
    else:
        from sklearn.feature_selection import SelectKBest, mutual_info_classif
        selector = SelectKBest(score_func=mutual_info_classif, k=n_features)

    # 完整流水线
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('variance_filter', VarianceThreshold(threshold=0.01)),
        ('feature_selector', selector),
        ('classifier', LogisticRegression(max_iter=1000))
    ])

    return pipeline

# 混合数据类型示例
np.random.seed(42)
n_samples = 500

data = pd.DataFrame({
    'age': np.random.randint(18, 80, n_samples),
    'income': np.random.exponential(50000, n_samples),
    'credit_score': np.random.randint(300, 850, n_samples),
    'years_employed': np.random.randint(0, 40, n_samples),
    'education': np.random.choice(['HS', 'Bachelor', 'Master', 'PhD'], n_samples),
    'region': np.random.choice(['North', 'South', 'East', 'West'], n_samples),
    'employment_type': np.random.choice(['Full-time', 'Part-time', 'Contract'], n_samples)
})

# 添加一些噪声特征
for i in range(5):
    data[f'noise_{i}'] = np.random.randn(n_samples)

# 目标
y = ((data['income'] > 50000) & (data['credit_score'] > 650)).astype(int)

numerical_features = ['age', 'income', 'credit_score', 'years_employed'] + \
                     [f'noise_{i}' for i in range(5)]
categorical_features = ['education', 'region', 'employment_type']

# 分割数据
X_train, X_test, y_train, y_test = train_test_split(
    data, y, test_size=0.2, random_state=42
)

# 创建和训练流水线
pipeline = create_feature_selection_pipeline(
    numerical_features, categorical_features,
    selection_method='tree', n_features=10
)

pipeline.fit(X_train, y_train)

print(f"训练准确率: {pipeline.score(X_train, y_train):.4f}")
print(f"测试准确率: {pipeline.score(X_test, y_test):.4f}")

# 获取预处理后选中的特征掩码
selector = pipeline.named_steps['feature_selector']
print(f"\n预处理后的特征数量: {selector.n_features_in_}")
print(f"选中的特征数量: {sum(selector.get_support())}")
```

### 特征选择的超参数调优

```python
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, mutual_info_classif, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
import numpy as np
import pandas as pd

def tune_feature_selection(X, y, cv=5):
    """
    使用 GridSearchCV 调优特征选择超参数。
    """
    # 创建流水线
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('selector', SelectKBest()),
        ('classifier', LogisticRegression(max_iter=1000))
    ])

    # 参数网格
    param_grid = {
        'selector__score_func': [mutual_info_classif, f_classif],
        'selector__k': [5, 10, 15, 20, 'all'],
        'classifier__C': [0.1, 1.0, 10.0]
    }

    # 网格搜索
    grid_search = GridSearchCV(
        pipeline,
        param_grid,
        cv=cv,
        scoring='accuracy',
        n_jobs=-1,
        verbose=1
    )

    grid_search.fit(X, y)

    print(f"最佳参数: {grid_search.best_params_}")
    print(f"最佳 CV 分数: {grid_search.best_score_:.4f}")

    # 结果 DataFrame
    results = pd.DataFrame(grid_search.cv_results_)
    results = results[['param_selector__score_func', 'param_selector__k',
                       'param_classifier__C', 'mean_test_score', 'std_test_score']]
    results = results.sort_values('mean_test_score', ascending=False)

    return grid_search.best_estimator_, results

# 示例用法
np.random.seed(42)
X = pd.DataFrame(np.random.randn(500, 25),
                 columns=[f'feature_{i}' for i in range(25)])
y = (X['feature_0'] * 2 + X['feature_1'] - X['feature_2'] + X['feature_3'] > 0).astype(int)

best_pipeline, tuning_results = tune_feature_selection(X, y)

print("\n调优结果前 10 名:")
print(tuning_results.head(10))
```

## 最佳实践总结

### 方法选择指南

| 场景 | 推荐方法 | 原因 |
|------|----------|------|
| 大型数据集，多特征 | 过滤方法 | 快速、可扩展 |
| 小型数据集 | 包装方法（RFE） | 选择更准确 |
| 可解释性重要 | Lasso、树重要性 | 清晰的特征排名 |
| 非线性关系 | 互信息、基于树 | 捕获复杂模式 |
| 相关特征 | 弹性网络 | 处理分组特征 |
| 生产系统 | 带 CV 的流水线 | 稳健、可重现 |
| 研究/探索 | 多种方法 | 全面分析 |

### 常见陷阱避免

1. **数据泄露**：始终仅在训练数据上拟合选择器
2. **过拟合**：使用交叉验证进行无偏评估
3. **单一方法依赖**：比较多种选择方法
4. **忽略领域知识**：将自动选择与专家输入相结合
5. **特征缩放**：在 Lasso 或基于距离的方法之前缩放特征
6. **样本量**：确保有足够的样本进行可靠选择

### 推荐工作流程

```python
def feature_selection_workflow(X, y, task='classification'):
    """
    推荐的特征选择工作流程。
    """
    from sklearn.model_selection import train_test_split

    # 1. 首先分割数据
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # 2. 快速过滤（去除明显无信息的特征）
    variance_selector = VarianceThreshold(threshold=0.01)
    X_train_var = variance_selector.fit_transform(X_train)
    X_test_var = variance_selector.transform(X_test)

    # 3. 去除高度相关的特征
    # （使用前面示例中的 correlation_filter）

    # 4. 应用多种选择方法
    # - 互信息
    # - Lasso/弹性网络
    # - 基于树的重要性

    # 5. 使用稳定性选择以提高稳健性

    # 6. 使用交叉验证验证

    # 7. 在保留的测试集上进行最终模型评估

    return selected_features
```

## 结论

特征选择是构建有效机器学习模型的重要步骤。三种主要方法提供了不同的权衡：

- **过滤方法**提供快速、与模型无关的选择，适合初始筛选
- **包装方法**以更高的计算成本提供更优的选择准确性
- **嵌入方法**将选择与模型训练集成以提高效率

关键要点：

1. 始终在特征选择之前分割数据以防止泄露
2. 使用交叉验证评估选择性能
3. 结合多种方法以获得稳健选择
4. 将领域知识与自动选择相结合
5. 记录您的选择过程以确保可重现性

通过掌握这些技术并审慎应用，您可以显著提高模型的性能、可解释性和泛化能力。从简单的过滤方法开始，然后根据具体问题的需要逐步应用更复杂的技术。
