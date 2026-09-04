---
title: 生产机器学习：模型监控
description: 监控生产模型：数据漂移检测、概念漂移和性能监控
track: datascience
section: deployment
difficulty: advanced
tags:
  - 模型监控
  - 数据漂移
  - 概念漂移
  - MLOps
status: imported
origin: old/src/content/docs/datascience/model-monitoring.zh.md
divergence: 0.491
issues:
  - divergent
legacy:
  category: DataScience
  subcategory: Production
  order: 44
  lastUpdated: 2026-01-07
---

机器学习模型在生产环境中部署后，其性能往往会随着时间推移而下降。这种现象被称为"模型衰退"（Model Decay），主要由数据漂移、概念漂移等因素引起。本文将全面介绍模型监控的核心概念、检测方法、实践工具以及告警与重训练策略。

## 模型监控的重要性

### 为什么需要模型监控

在传统软件工程中，一旦代码部署成功，只要没有代码变更，系统行为通常是稳定的。但机器学习系统不同：即使模型代码保持不变，模型性能也可能因为外部因素而发生变化。

**模型性能下降的常见原因：**

| 原因 | 描述 | 示例 |
|------|------|------|
| 数据漂移 | 输入数据分布发生变化 | 用户群体结构变化 |
| 概念漂移 | 特征与标签之间的关系变化 | 用户购买偏好改变 |
| 数据质量问题 | 上游数据管道出现问题 | 特征值缺失或异常 |
| 系统变更 | 依赖的系统发生变化 | API 返回格式变更 |
| 季节性因素 | 周期性的行为模式变化 | 节假日购物行为 |

### 模型监控的核心维度

一个完整的模型监控体系应该覆盖以下几个核心维度：

```
┌─────────────────────────────────────────────────────────────────┐
│                        模型监控体系                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│   │  数据质量   │   │  数据漂移   │   │  概念漂移   │          │
│   │  监控      │   │  检测      │   │  检测      │          │
│   └─────────────┘   └─────────────┘   └─────────────┘          │
│                                                                 │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│   │  性能指标   │   │  预测分布   │   │  系统资源   │          │
│   │  监控      │   │  监控      │   │  监控      │          │
│   └─────────────┘   └─────────────┘   └─────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 监控指标层次

模型监控指标可以分为三个层次：

1. **系统层指标**：延迟、吞吐量、错误率、资源使用率
2. **模型层指标**：预测分布、特征分布、数据漂移指标
3. **业务层指标**：转化率、收入影响、用户满意度

```python
from dataclasses import dataclass
from typing import Dict, List
from datetime import datetime

@dataclass
class MonitoringMetrics:
    """模型监控指标数据类"""
    timestamp: datetime

    # 系统层指标
    latency_p50: float
    latency_p99: float
    throughput: float
    error_rate: float

    # 模型层指标
    prediction_mean: float
    prediction_std: float
    feature_drift_scores: Dict[str, float]
    data_quality_score: float

    # 业务层指标
    conversion_rate: float
    revenue_impact: float


class ModelMonitor:
    """模型监控基类"""

    def __init__(self, model_name: str, baseline_data: 'pd.DataFrame'):
        self.model_name = model_name
        self.baseline_data = baseline_data
        self.metrics_history: List[MonitoringMetrics] = []

    def collect_metrics(self, current_data: 'pd.DataFrame',
                        predictions: 'np.ndarray') -> MonitoringMetrics:
        """收集所有监控指标"""
        raise NotImplementedError

    def check_alerts(self, metrics: MonitoringMetrics) -> List[str]:
        """检查是否需要触发告警"""
        raise NotImplementedError

    def should_retrain(self, metrics: MonitoringMetrics) -> bool:
        """判断是否需要重新训练"""
        raise NotImplementedError
```

## 数据漂移检测

数据漂移（Data Drift）是指模型输入数据的统计分布随时间发生变化。这是导致模型性能下降最常见的原因之一。

### 数据漂移的类型

| 类型 | 描述 | 检测方法 |
|------|------|----------|
| 协变量漂移 | 特征分布 P(X) 变化 | KS 检验、PSI |
| 先验概率漂移 | 标签分布 P(Y) 变化 | 卡方检验 |
| 概念漂移 | P(Y\|X) 关系变化 | 性能监控 |

### KS 检验（Kolmogorov-Smirnov Test）

KS 检验是一种非参数检验方法，用于比较两个分布是否相同。它通过计算两个累积分布函数之间的最大差异来判断分布是否发生变化。

**原理：** KS 统计量定义为两个经验累积分布函数之间的最大垂直距离：

$$D_{n,m} = \sup_x |F_1(x) - F_2(x)|$$

```python
import numpy as np
from scipy import stats
from typing import Tuple, Dict
import pandas as pd

class KSTestDriftDetector:
    """基于 KS 检验的数据漂移检测器"""

    def __init__(self, significance_level: float = 0.05):
        self.significance_level = significance_level

    def detect_drift(self,
                     reference_data: np.ndarray,
                     current_data: np.ndarray) -> Tuple[float, float, bool]:
        """
        使用 KS 检验检测单个特征的漂移

        参数:
            reference_data: 参考数据（基准期数据）
            current_data: 当前数据

        返回:
            ks_statistic: KS 统计量
            p_value: p 值
            is_drift: 是否检测到漂移
        """
        ks_statistic, p_value = stats.ks_2samp(reference_data, current_data)
        is_drift = p_value < self.significance_level

        return ks_statistic, p_value, is_drift

    def detect_drift_all_features(self,
                                   reference_df: pd.DataFrame,
                                   current_df: pd.DataFrame) -> pd.DataFrame:
        """
        对所有数值特征进行漂移检测

        返回包含每个特征漂移检测结果的 DataFrame
        """
        results = []

        # 获取数值列
        numeric_cols = reference_df.select_dtypes(include=[np.number]).columns

        for col in numeric_cols:
            ks_stat, p_value, is_drift = self.detect_drift(
                reference_df[col].values,
                current_df[col].values
            )

            results.append({
                'feature': col,
                'ks_statistic': ks_stat,
                'p_value': p_value,
                'is_drift': is_drift,
                'drift_severity': self._get_severity(ks_stat)
            })

        return pd.DataFrame(results).sort_values('ks_statistic', ascending=False)

    def _get_severity(self, ks_stat: float) -> str:
        """根据 KS 统计量判断漂移严重程度"""
        if ks_stat < 0.1:
            return 'none'
        elif ks_stat < 0.2:
            return 'low'
        elif ks_stat < 0.3:
            return 'medium'
        else:
            return 'high'


# 使用示例
def demo_ks_test():
    """KS 检验使用示例"""
    np.random.seed(42)

    # 模拟参考数据和当前数据
    reference_data = pd.DataFrame({
        'feature_1': np.random.normal(0, 1, 10000),
        'feature_2': np.random.exponential(2, 10000),
        'feature_3': np.random.uniform(0, 10, 10000)
    })

    # 模拟漂移数据 - feature_1 和 feature_2 发生漂移
    current_data = pd.DataFrame({
        'feature_1': np.random.normal(0.5, 1.2, 10000),  # 均值和方差都变化
        'feature_2': np.random.exponential(3, 10000),    # 参数变化
        'feature_3': np.random.uniform(0, 10, 10000)     # 保持不变
    })

    detector = KSTestDriftDetector(significance_level=0.05)
    results = detector.detect_drift_all_features(reference_data, current_data)

    print("=== KS 检验漂移检测结果 ===")
    print(results.to_string(index=False))

    return results

# demo_ks_test()
```

### PSI（Population Stability Index）

PSI 是金融行业广泛使用的模型稳定性指标，用于衡量两个分布之间的差异程度。与 KS 检验相比，PSI 更易于解释和设置阈值。

**计算公式：**

$$PSI = \sum_{i=1}^{n} (P_i - Q_i) \times \ln\left(\frac{P_i}{Q_i}\right)$$

其中 $P_i$ 是当前数据在第 $i$ 个分箱的占比，$Q_i$ 是参考数据在第 $i$ 个分箱的占比。

**PSI 阈值解释：**

| PSI 值 | 解释 | 建议操作 |
|--------|------|----------|
| < 0.1 | 无显著变化 | 无需操作 |
| 0.1 - 0.25 | 中等变化 | 需要关注 |
| > 0.25 | 显著变化 | 需要调查或重训练 |

```python
import numpy as np
import pandas as pd
from typing import List, Tuple, Optional

class PSIDriftDetector:
    """基于 PSI 的数据漂移检测器"""

    def __init__(self, n_bins: int = 10, epsilon: float = 1e-6):
        """
        参数:
            n_bins: 分箱数量
            epsilon: 避免除零的小常数
        """
        self.n_bins = n_bins
        self.epsilon = epsilon

    def calculate_psi(self,
                      reference: np.ndarray,
                      current: np.ndarray,
                      bins: Optional[np.ndarray] = None) -> Tuple[float, pd.DataFrame]:
        """
        计算单个特征的 PSI

        参数:
            reference: 参考数据
            current: 当前数据
            bins: 可选的分箱边界

        返回:
            psi_value: PSI 值
            psi_details: 包含每个分箱详细信息的 DataFrame
        """
        # 如果没有提供分箱边界，则基于参考数据计算
        if bins is None:
            bins = np.percentile(reference,
                                np.linspace(0, 100, self.n_bins + 1))
            bins[0] = -np.inf
            bins[-1] = np.inf

        # 计算每个分箱的占比
        ref_counts, _ = np.histogram(reference, bins=bins)
        cur_counts, _ = np.histogram(current, bins=bins)

        ref_pct = ref_counts / len(reference) + self.epsilon
        cur_pct = cur_counts / len(current) + self.epsilon

        # 计算每个分箱的 PSI 贡献
        psi_values = (cur_pct - ref_pct) * np.log(cur_pct / ref_pct)

        # 创建详细报告
        details = pd.DataFrame({
            'bin_index': range(len(psi_values)),
            'bin_lower': bins[:-1],
            'bin_upper': bins[1:],
            'reference_pct': ref_pct,
            'current_pct': cur_pct,
            'psi_contribution': psi_values
        })

        return float(np.sum(psi_values)), details

    def calculate_psi_all_features(self,
                                    reference_df: pd.DataFrame,
                                    current_df: pd.DataFrame) -> pd.DataFrame:
        """
        计算所有数值特征的 PSI
        """
        results = []
        numeric_cols = reference_df.select_dtypes(include=[np.number]).columns

        for col in numeric_cols:
            psi_value, _ = self.calculate_psi(
                reference_df[col].values,
                current_df[col].values
            )

            results.append({
                'feature': col,
                'psi': psi_value,
                'status': self._get_status(psi_value),
                'action_required': psi_value > 0.25
            })

        return pd.DataFrame(results).sort_values('psi', ascending=False)

    def _get_status(self, psi: float) -> str:
        """根据 PSI 值返回状态"""
        if psi < 0.1:
            return 'stable'
        elif psi < 0.25:
            return 'moderate_shift'
        else:
            return 'significant_shift'


class CategoricalDriftDetector:
    """类别特征漂移检测器"""

    def __init__(self, significance_level: float = 0.05):
        self.significance_level = significance_level

    def chi_square_test(self,
                        reference: pd.Series,
                        current: pd.Series) -> Tuple[float, float, bool]:
        """
        使用卡方检验检测类别特征漂移
        """
        # 获取所有类别
        all_categories = set(reference.unique()) | set(current.unique())

        # 计算频率
        ref_counts = reference.value_counts()
        cur_counts = current.value_counts()

        # 确保所有类别都有计数
        ref_freq = np.array([ref_counts.get(cat, 0) for cat in all_categories])
        cur_freq = np.array([cur_counts.get(cat, 0) for cat in all_categories])

        # 进行卡方检验
        chi2, p_value = stats.chisquare(cur_freq, f_exp=ref_freq * len(current) / len(reference))
        is_drift = p_value < self.significance_level

        return chi2, p_value, is_drift

    def calculate_categorical_psi(self,
                                   reference: pd.Series,
                                   current: pd.Series,
                                   epsilon: float = 1e-6) -> float:
        """计算类别特征的 PSI"""
        all_categories = set(reference.unique()) | set(current.unique())

        ref_pct = reference.value_counts(normalize=True)
        cur_pct = current.value_counts(normalize=True)

        psi = 0
        for cat in all_categories:
            ref_p = ref_pct.get(cat, epsilon)
            cur_p = cur_pct.get(cat, epsilon)
            psi += (cur_p - ref_p) * np.log(cur_p / ref_p)

        return psi


# 完整的漂移检测管道示例
def run_drift_detection_pipeline(reference_df: pd.DataFrame,
                                  current_df: pd.DataFrame) -> Dict:
    """
    运行完整的漂移检测管道
    """
    results = {
        'timestamp': pd.Timestamp.now(),
        'numeric_features': {},
        'categorical_features': {},
        'summary': {}
    }

    # 检测数值特征漂移
    numeric_cols = reference_df.select_dtypes(include=[np.number]).columns
    psi_detector = PSIDriftDetector()
    ks_detector = KSTestDriftDetector()

    for col in numeric_cols:
        psi_value, psi_details = psi_detector.calculate_psi(
            reference_df[col].values,
            current_df[col].values
        )
        ks_stat, p_value, is_drift = ks_detector.detect_drift(
            reference_df[col].values,
            current_df[col].values
        )

        results['numeric_features'][col] = {
            'psi': psi_value,
            'ks_statistic': ks_stat,
            'ks_p_value': p_value,
            'is_drift': psi_value > 0.1 or is_drift
        }

    # 检测类别特征漂移
    cat_detector = CategoricalDriftDetector()
    categorical_cols = reference_df.select_dtypes(include=['object', 'category']).columns

    for col in categorical_cols:
        chi2, p_value, is_drift = cat_detector.chi_square_test(
            reference_df[col],
            current_df[col]
        )
        cat_psi = cat_detector.calculate_categorical_psi(
            reference_df[col],
            current_df[col]
        )

        results['categorical_features'][col] = {
            'chi2_statistic': chi2,
            'p_value': p_value,
            'psi': cat_psi,
            'is_drift': is_drift
        }

    # 生成摘要
    drifted_numeric = sum(1 for v in results['numeric_features'].values() if v['is_drift'])
    drifted_categorical = sum(1 for v in results['categorical_features'].values() if v['is_drift'])

    results['summary'] = {
        'total_numeric_features': len(numeric_cols),
        'drifted_numeric_features': drifted_numeric,
        'total_categorical_features': len(categorical_cols),
        'drifted_categorical_features': drifted_categorical,
        'overall_drift_detected': drifted_numeric > 0 or drifted_categorical > 0
    }

    return results
```

### 多变量漂移检测

单变量漂移检测可能会遗漏特征之间关系的变化。多变量漂移检测方法可以捕获这些更复杂的漂移模式。

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
import numpy as np
import pandas as pd

class DomainClassifierDriftDetector:
    """
    基于域分类器的多变量漂移检测

    原理：训练一个分类器来区分参考数据和当前数据。
    如果分类器能够很好地区分两者，说明数据发生了漂移。
    """

    def __init__(self,
                 classifier=None,
                 cv_folds: int = 5,
                 drift_threshold: float = 0.55):
        """
        参数:
            classifier: 用于域分类的模型
            cv_folds: 交叉验证折数
            drift_threshold: 漂移判定阈值（高于此 AUC 认为存在漂移）
        """
        self.classifier = classifier or RandomForestClassifier(
            n_estimators=100,
            max_depth=5,
            random_state=42
        )
        self.cv_folds = cv_folds
        self.drift_threshold = drift_threshold

    def detect_drift(self,
                     reference_df: pd.DataFrame,
                     current_df: pd.DataFrame) -> dict:
        """
        检测多变量漂移

        返回:
            包含 AUC 分数和是否检测到漂移的字典
        """
        # 准备数据：参考数据标签为 0，当前数据标签为 1
        reference_labeled = reference_df.copy()
        reference_labeled['_domain_label'] = 0

        current_labeled = current_df.copy()
        current_labeled['_domain_label'] = 1

        # 合并数据
        combined = pd.concat([reference_labeled, current_labeled], ignore_index=True)

        # 只保留数值特征
        feature_cols = [col for col in combined.columns
                       if col != '_domain_label' and
                       combined[col].dtype in [np.float64, np.int64, np.float32, np.int32]]

        X = combined[feature_cols].fillna(0)
        y = combined['_domain_label']

        # 交叉验证评估
        scores = cross_val_score(
            self.classifier, X, y,
            cv=self.cv_folds,
            scoring='roc_auc'
        )

        mean_auc = scores.mean()
        std_auc = scores.std()

        # 拟合模型获取特征重要性
        self.classifier.fit(X, y)
        feature_importance = pd.DataFrame({
            'feature': feature_cols,
            'importance': self.classifier.feature_importances_
        }).sort_values('importance', ascending=False)

        return {
            'auc_mean': mean_auc,
            'auc_std': std_auc,
            'is_drift': mean_auc > self.drift_threshold,
            'drift_severity': self._get_severity(mean_auc),
            'top_drifting_features': feature_importance.head(10).to_dict('records'),
            'interpretation': self._interpret_result(mean_auc)
        }

    def _get_severity(self, auc: float) -> str:
        """根据 AUC 判断漂移严重程度"""
        if auc < 0.55:
            return 'none'
        elif auc < 0.65:
            return 'low'
        elif auc < 0.75:
            return 'medium'
        else:
            return 'high'

    def _interpret_result(self, auc: float) -> str:
        """解释检测结果"""
        if auc < 0.55:
            return "数据分布无显著变化，无法区分参考数据和当前数据"
        elif auc < 0.65:
            return "检测到轻微的数据漂移，建议持续监控"
        elif auc < 0.75:
            return "检测到中等程度的数据漂移，建议调查原因"
        else:
            return "检测到严重的数据漂移，强烈建议重新训练模型"
```

## 概念漂移检测

概念漂移（Concept Drift）是指特征与目标变量之间的关系发生变化，即 P(Y|X) 随时间变化。这种漂移比数据漂移更难检测，因为它需要真实标签来验证。

### 概念漂移的类型

```
┌────────────────────────────────────────────────────────────────┐
│                    概念漂移类型                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. 突变型（Sudden）     2. 渐变型（Gradual）                   │
│     ┌─────┐                  ╱────────                        │
│     │     └────────        ╱                                  │
│     └──────────────       ╱                                   │
│                                                                │
│  3. 增量型（Incremental） 4. 周期型（Recurring）                │
│         ╱─────────          ╱╲    ╱╲    ╱╲                    │
│       ╱                    ╱  ╲  ╱  ╲  ╱  ╲                   │
│     ╱                     ╱    ╲╱    ╲╱    ╲                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 基于性能的概念漂移检测

最直接的概念漂移检测方法是监控模型在有标签数据上的性能变化。

```python
from collections import deque
from typing import Deque, Optional
import numpy as np
from dataclasses import dataclass
from datetime import datetime

@dataclass
class PerformanceWindow:
    """性能窗口数据"""
    timestamp: datetime
    metric_value: float
    sample_size: int

class PerformanceBasedDriftDetector:
    """
    基于性能监控的概念漂移检测器

    使用 Page-Hinkley 测试检测性能的显著变化
    """

    def __init__(self,
                 window_size: int = 100,
                 threshold: float = 50,
                 alpha: float = 0.005):
        """
        参数:
            window_size: 滑动窗口大小
            threshold: Page-Hinkley 测试阈值
            alpha: 容忍的变化率
        """
        self.window_size = window_size
        self.threshold = threshold
        self.alpha = alpha

        self.performance_history: Deque[PerformanceWindow] = deque(maxlen=window_size)
        self.cumsum = 0
        self.min_cumsum = 0
        self.mean = 0
        self.n = 0

    def update(self, performance: float, timestamp: Optional[datetime] = None) -> dict:
        """
        更新检测器并返回检测结果
        """
        timestamp = timestamp or datetime.now()

        self.n += 1

        # 更新均值
        self.mean = self.mean + (performance - self.mean) / self.n

        # Page-Hinkley 测试
        self.cumsum = self.cumsum + (performance - self.mean - self.alpha)
        self.min_cumsum = min(self.min_cumsum, self.cumsum)

        ph_statistic = self.cumsum - self.min_cumsum
        is_drift = ph_statistic > self.threshold

        # 记录历史
        self.performance_history.append(PerformanceWindow(
            timestamp=timestamp,
            metric_value=performance,
            sample_size=1
        ))

        return {
            'timestamp': timestamp,
            'current_performance': performance,
            'running_mean': self.mean,
            'ph_statistic': ph_statistic,
            'is_drift': is_drift,
            'drift_direction': 'degradation' if performance < self.mean else 'improvement'
        }

    def reset(self):
        """重置检测器状态"""
        self.cumsum = 0
        self.min_cumsum = 0
        self.mean = 0
        self.n = 0
        self.performance_history.clear()


class ADWINDriftDetector:
    """
    ADWIN (Adaptive Windowing) 漂移检测器

    自适应地调整窗口大小来检测概念漂移
    """

    def __init__(self, delta: float = 0.002):
        """
        参数:
            delta: 置信度参数
        """
        self.delta = delta
        self.window: list = []
        self.total = 0
        self.variance = 0
        self.width = 0

    def update(self, value: float) -> bool:
        """
        添加新值并检测漂移

        返回: 是否检测到漂移
        """
        self.window.append(value)
        self._update_statistics(value)

        return self._detect_change()

    def _update_statistics(self, value: float):
        """更新统计量"""
        self.width += 1
        self.total += value

    def _detect_change(self) -> bool:
        """检测是否发生变化"""
        if len(self.window) < 2:
            return False

        # 尝试不同的分割点
        for i in range(1, len(self.window)):
            if self._has_significant_difference(i):
                # 删除较旧的数据
                self.window = self.window[i:]
                self.width = len(self.window)
                self.total = sum(self.window)
                return True

        return False

    def _has_significant_difference(self, split_point: int) -> bool:
        """检查两个子窗口是否有显著差异"""
        n1 = split_point
        n2 = len(self.window) - split_point

        if n1 < 5 or n2 < 5:  # 需要最小样本量
            return False

        mean1 = sum(self.window[:split_point]) / n1
        mean2 = sum(self.window[split_point:]) / n2

        # 使用 Hoeffding 界限
        epsilon = np.sqrt(np.log(4 / self.delta) / (2 * min(n1, n2)))

        return abs(mean1 - mean2) > epsilon
```

### 基于模型的概念漂移检测

```python
from sklearn.base import BaseEstimator
from sklearn.model_selection import train_test_split
import numpy as np

class ModelBasedDriftDetector:
    """
    基于模型性能对比的概念漂移检测

    比较在参考数据上训练的模型与在当前数据上训练的模型的性能差异
    """

    def __init__(self,
                 model_class: type,
                 model_params: dict = None,
                 performance_threshold: float = 0.05):
        """
        参数:
            model_class: 模型类
            model_params: 模型参数
            performance_threshold: 性能下降阈值
        """
        self.model_class = model_class
        self.model_params = model_params or {}
        self.performance_threshold = performance_threshold

    def detect_drift(self,
                     reference_X: np.ndarray,
                     reference_y: np.ndarray,
                     current_X: np.ndarray,
                     current_y: np.ndarray,
                     metric_func) -> dict:
        """
        检测概念漂移

        参数:
            reference_X, reference_y: 参考数据
            current_X, current_y: 当前数据
            metric_func: 评估指标函数
        """
        # 在参考数据上训练模型
        ref_model = self.model_class(**self.model_params)
        ref_model.fit(reference_X, reference_y)

        # 在当前数据上训练模型
        cur_model = self.model_class(**self.model_params)
        cur_model.fit(current_X, current_y)

        # 评估参考模型在两个数据集上的表现
        ref_on_ref = metric_func(reference_y, ref_model.predict(reference_X))
        ref_on_cur = metric_func(current_y, ref_model.predict(current_X))

        # 评估当前模型在当前数据上的表现
        cur_on_cur = metric_func(current_y, cur_model.predict(current_X))

        # 计算性能差异
        performance_drop = ref_on_ref - ref_on_cur
        potential_gain = cur_on_cur - ref_on_cur

        return {
            'reference_model_on_reference': ref_on_ref,
            'reference_model_on_current': ref_on_cur,
            'current_model_on_current': cur_on_cur,
            'performance_drop': performance_drop,
            'potential_gain_from_retraining': potential_gain,
            'is_drift': performance_drop > self.performance_threshold,
            'should_retrain': potential_gain > self.performance_threshold,
            'interpretation': self._interpret(performance_drop, potential_gain)
        }

    def _interpret(self, drop: float, gain: float) -> str:
        """解释检测结果"""
        if drop <= 0:
            return "模型在当前数据上表现更好，无需担心"
        elif drop < self.performance_threshold:
            return "检测到轻微的性能下降，建议持续监控"
        elif gain > self.performance_threshold:
            return f"检测到显著的概念漂移，重训练可提升约 {gain:.2%} 的性能"
        else:
            return "检测到性能下降，但重训练收益有限，建议检查数据质量"
```

## 性能监控

### 模型性能指标监控

```python
import numpy as np
import pandas as pd
from typing import Dict, List, Callable
from datetime import datetime, timedelta
from collections import defaultdict

class ModelPerformanceMonitor:
    """模型性能监控器"""

    def __init__(self,
                 model_name: str,
                 metrics: Dict[str, Callable] = None,
                 window_size: timedelta = timedelta(hours=1)):
        """
        参数:
            model_name: 模型名称
            metrics: 评估指标字典 {指标名: 计算函数}
            window_size: 聚合窗口大小
        """
        self.model_name = model_name
        self.window_size = window_size

        # 默认指标
        self.metrics = metrics or {
            'accuracy': lambda y, p: np.mean(y == p),
            'precision': self._precision,
            'recall': self._recall,
            'f1': self._f1_score
        }

        self.predictions_buffer: List[dict] = []
        self.metrics_history: List[dict] = []
        self.baselines: Dict[str, float] = {}

    def set_baseline(self, metric_name: str, value: float):
        """设置基准性能"""
        self.baselines[metric_name] = value

    def log_prediction(self,
                       prediction: any,
                       actual: any = None,
                       timestamp: datetime = None,
                       metadata: dict = None):
        """记录预测结果"""
        self.predictions_buffer.append({
            'timestamp': timestamp or datetime.now(),
            'prediction': prediction,
            'actual': actual,
            'metadata': metadata or {}
        })

    def compute_metrics(self) -> dict:
        """计算当前窗口的性能指标"""
        if not self.predictions_buffer:
            return {}

        # 过滤有真实标签的预测
        labeled = [p for p in self.predictions_buffer if p['actual'] is not None]

        if not labeled:
            return {'warning': 'No labeled data available'}

        y_true = np.array([p['actual'] for p in labeled])
        y_pred = np.array([p['prediction'] for p in labeled])

        results = {
            'timestamp': datetime.now(),
            'sample_size': len(labeled),
            'metrics': {}
        }

        for metric_name, metric_func in self.metrics.items():
            try:
                value = metric_func(y_true, y_pred)
                results['metrics'][metric_name] = value

                # 与基准比较
                if metric_name in self.baselines:
                    baseline = self.baselines[metric_name]
                    results['metrics'][f'{metric_name}_vs_baseline'] = value - baseline
                    results['metrics'][f'{metric_name}_relative_change'] = (value - baseline) / baseline
            except Exception as e:
                results['metrics'][metric_name] = None
                results['metrics'][f'{metric_name}_error'] = str(e)

        self.metrics_history.append(results)
        return results

    def get_performance_summary(self,
                                 lookback: timedelta = timedelta(days=7)) -> pd.DataFrame:
        """获取性能摘要"""
        cutoff = datetime.now() - lookback
        recent = [m for m in self.metrics_history
                 if m['timestamp'] > cutoff]

        if not recent:
            return pd.DataFrame()

        # 汇总统计
        summary_data = defaultdict(list)
        for record in recent:
            for metric_name, value in record['metrics'].items():
                if value is not None and isinstance(value, (int, float)):
                    summary_data[metric_name].append(value)

        summary = {}
        for metric_name, values in summary_data.items():
            summary[metric_name] = {
                'mean': np.mean(values),
                'std': np.std(values),
                'min': np.min(values),
                'max': np.max(values),
                'latest': values[-1] if values else None
            }

        return pd.DataFrame(summary).T

    def check_degradation(self,
                          threshold: float = 0.1) -> List[str]:
        """检查性能下降"""
        alerts = []

        if not self.metrics_history:
            return alerts

        latest = self.metrics_history[-1]['metrics']

        for metric_name, baseline in self.baselines.items():
            if metric_name in latest and latest[metric_name] is not None:
                relative_change = (latest[metric_name] - baseline) / baseline

                if relative_change < -threshold:
                    alerts.append(
                        f"{metric_name} 下降了 {abs(relative_change):.1%}，"
                        f"当前值: {latest[metric_name]:.4f}, 基准值: {baseline:.4f}"
                    )

        return alerts

    @staticmethod
    def _precision(y_true, y_pred):
        """计算精确率"""
        tp = np.sum((y_true == 1) & (y_pred == 1))
        fp = np.sum((y_true == 0) & (y_pred == 1))
        return tp / (tp + fp) if (tp + fp) > 0 else 0

    @staticmethod
    def _recall(y_true, y_pred):
        """计算召回率"""
        tp = np.sum((y_true == 1) & (y_pred == 1))
        fn = np.sum((y_true == 1) & (y_pred == 0))
        return tp / (tp + fn) if (tp + fn) > 0 else 0

    @staticmethod
    def _f1_score(y_true, y_pred):
        """计算 F1 分数"""
        precision = ModelPerformanceMonitor._precision(y_true, y_pred)
        recall = ModelPerformanceMonitor._recall(y_true, y_pred)
        return 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
```

### 预测分布监控

```python
import numpy as np
from scipy import stats
from typing import List, Optional

class PredictionDistributionMonitor:
    """预测分布监控器"""

    def __init__(self,
                 reference_predictions: np.ndarray,
                 n_bins: int = 20):
        """
        参数:
            reference_predictions: 参考预测分布
            n_bins: 直方图分箱数
        """
        self.reference_predictions = reference_predictions
        self.n_bins = n_bins

        # 计算参考分布的统计量
        self.ref_mean = np.mean(reference_predictions)
        self.ref_std = np.std(reference_predictions)
        self.ref_median = np.median(reference_predictions)
        self.ref_percentiles = np.percentile(reference_predictions, [5, 25, 50, 75, 95])

    def analyze_predictions(self,
                            current_predictions: np.ndarray) -> dict:
        """分析当前预测分布"""
        # 基本统计量
        cur_mean = np.mean(current_predictions)
        cur_std = np.std(current_predictions)
        cur_median = np.median(current_predictions)
        cur_percentiles = np.percentile(current_predictions, [5, 25, 50, 75, 95])

        # KS 检验
        ks_stat, ks_pvalue = stats.ks_2samp(
            self.reference_predictions,
            current_predictions
        )

        # 计算 PSI
        psi = self._calculate_psi(current_predictions)

        # Wasserstein 距离（Earth Mover's Distance）
        wasserstein = stats.wasserstein_distance(
            self.reference_predictions,
            current_predictions
        )

        return {
            'statistics': {
                'mean': {'reference': self.ref_mean, 'current': cur_mean,
                        'change': cur_mean - self.ref_mean},
                'std': {'reference': self.ref_std, 'current': cur_std,
                       'change': cur_std - self.ref_std},
                'median': {'reference': self.ref_median, 'current': cur_median,
                          'change': cur_median - self.ref_median}
            },
            'percentiles': {
                'reference': dict(zip(['p5', 'p25', 'p50', 'p75', 'p95'],
                                     self.ref_percentiles)),
                'current': dict(zip(['p5', 'p25', 'p50', 'p75', 'p95'],
                                   cur_percentiles))
            },
            'drift_metrics': {
                'ks_statistic': ks_stat,
                'ks_pvalue': ks_pvalue,
                'psi': psi,
                'wasserstein_distance': wasserstein
            },
            'alerts': self._generate_alerts(
                cur_mean, cur_std, ks_stat, ks_pvalue, psi
            )
        }

    def _calculate_psi(self, current_predictions: np.ndarray) -> float:
        """计算预测分布的 PSI"""
        epsilon = 1e-6

        # 基于参考数据创建分箱
        bins = np.percentile(self.reference_predictions,
                            np.linspace(0, 100, self.n_bins + 1))
        bins[0] = -np.inf
        bins[-1] = np.inf

        ref_counts, _ = np.histogram(self.reference_predictions, bins=bins)
        cur_counts, _ = np.histogram(current_predictions, bins=bins)

        ref_pct = ref_counts / len(self.reference_predictions) + epsilon
        cur_pct = cur_counts / len(current_predictions) + epsilon

        psi = np.sum((cur_pct - ref_pct) * np.log(cur_pct / ref_pct))

        return psi

    def _generate_alerts(self,
                         cur_mean: float,
                         cur_std: float,
                         ks_stat: float,
                         ks_pvalue: float,
                         psi: float) -> List[str]:
        """生成告警信息"""
        alerts = []

        # 均值偏移检测
        mean_shift = abs(cur_mean - self.ref_mean) / self.ref_std
        if mean_shift > 2:
            alerts.append(f"预测均值偏移显著: {mean_shift:.2f} 个标准差")

        # 方差变化检测
        std_ratio = cur_std / self.ref_std
        if std_ratio < 0.5 or std_ratio > 2:
            alerts.append(f"预测方差变化显著: 变化比例 {std_ratio:.2f}")

        # KS 检验
        if ks_pvalue < 0.05:
            alerts.append(f"KS 检验显示分布变化 (p={ks_pvalue:.4f})")

        # PSI 检查
        if psi > 0.25:
            alerts.append(f"PSI 过高: {psi:.4f}，表明分布显著变化")
        elif psi > 0.1:
            alerts.append(f"PSI 中等: {psi:.4f}，需要关注")

        return alerts
```

## 异常检测

在模型监控中，异常检测用于识别输入数据中的异常样本，这些异常可能导致模型产生不可靠的预测。

### 基于统计的异常检测

```python
import numpy as np
from typing import Tuple
from scipy import stats

class StatisticalAnomalyDetector:
    """基于统计的异常检测器"""

    def __init__(self,
                 method: str = 'zscore',
                 threshold: float = 3.0):
        """
        参数:
            method: 检测方法 ('zscore', 'iqr', 'mad')
            threshold: 异常判定阈值
        """
        self.method = method
        self.threshold = threshold
        self.fitted = False

        # 拟合时存储的统计量
        self.mean = None
        self.std = None
        self.median = None
        self.mad = None
        self.q1 = None
        self.q3 = None
        self.iqr = None

    def fit(self, data: np.ndarray):
        """拟合检测器"""
        self.mean = np.mean(data, axis=0)
        self.std = np.std(data, axis=0)
        self.median = np.median(data, axis=0)
        self.mad = stats.median_abs_deviation(data, axis=0)
        self.q1 = np.percentile(data, 25, axis=0)
        self.q3 = np.percentile(data, 75, axis=0)
        self.iqr = self.q3 - self.q1
        self.fitted = True

        return self

    def detect(self, data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        检测异常

        返回:
            is_anomaly: 布尔数组，指示每个样本是否异常
            anomaly_scores: 异常分数数组
        """
        if not self.fitted:
            raise ValueError("检测器未拟合，请先调用 fit 方法")

        if self.method == 'zscore':
            scores = np.abs((data - self.mean) / (self.std + 1e-10))
            scores = np.max(scores, axis=1) if len(data.shape) > 1 else scores
            is_anomaly = scores > self.threshold

        elif self.method == 'iqr':
            lower_bound = self.q1 - self.threshold * self.iqr
            upper_bound = self.q3 + self.threshold * self.iqr
            is_below = data < lower_bound
            is_above = data > upper_bound
            is_anomaly = np.any(is_below | is_above, axis=1) if len(data.shape) > 1 else (is_below | is_above)
            scores = np.maximum(
                np.max((lower_bound - data) / (self.iqr + 1e-10), axis=1 if len(data.shape) > 1 else 0),
                np.max((data - upper_bound) / (self.iqr + 1e-10), axis=1 if len(data.shape) > 1 else 0)
            )

        elif self.method == 'mad':
            # Modified Z-score using MAD
            scores = 0.6745 * np.abs((data - self.median) / (self.mad + 1e-10))
            scores = np.max(scores, axis=1) if len(data.shape) > 1 else scores
            is_anomaly = scores > self.threshold

        else:
            raise ValueError(f"未知方法: {self.method}")

        return is_anomaly, scores

    def fit_detect(self, data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """拟合并检测"""
        self.fit(data)
        return self.detect(data)


class IsolationForestMonitor:
    """基于 Isolation Forest 的异常检测监控"""

    def __init__(self,
                 contamination: float = 0.1,
                 n_estimators: int = 100):
        """
        参数:
            contamination: 预期异常比例
            n_estimators: 树的数量
        """
        from sklearn.ensemble import IsolationForest

        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            random_state=42
        )
        self.fitted = False

    def fit(self, data: np.ndarray):
        """拟合模型"""
        self.model.fit(data)
        self.fitted = True
        return self

    def detect(self, data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        检测异常

        返回:
            is_anomaly: 布尔数组 (True = 异常)
            anomaly_scores: 异常分数 (越小越异常)
        """
        if not self.fitted:
            raise ValueError("模型未拟合")

        predictions = self.model.predict(data)
        scores = self.model.decision_function(data)

        is_anomaly = predictions == -1

        return is_anomaly, scores

    def get_anomaly_report(self,
                           data: np.ndarray,
                           feature_names: list = None) -> dict:
        """生成异常报告"""
        is_anomaly, scores = self.detect(data)

        return {
            'total_samples': len(data),
            'anomaly_count': int(np.sum(is_anomaly)),
            'anomaly_rate': float(np.mean(is_anomaly)),
            'score_statistics': {
                'mean': float(np.mean(scores)),
                'std': float(np.std(scores)),
                'min': float(np.min(scores)),
                'max': float(np.max(scores))
            },
            'anomaly_indices': np.where(is_anomaly)[0].tolist()
        }
```

### 输入验证与数据质量检查

```python
import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class DataQualityReport:
    """数据质量报告"""
    timestamp: str
    total_records: int
    issues: List[Dict]
    quality_score: float
    is_acceptable: bool

class DataQualityChecker:
    """数据质量检查器"""

    def __init__(self,
                 reference_schema: Dict = None,
                 null_threshold: float = 0.1,
                 outlier_threshold: float = 0.05):
        """
        参数:
            reference_schema: 参考数据模式
            null_threshold: 允许的空值比例
            outlier_threshold: 允许的异常值比例
        """
        self.reference_schema = reference_schema or {}
        self.null_threshold = null_threshold
        self.outlier_threshold = outlier_threshold

        # 存储拟合的统计量
        self.feature_stats: Dict = {}

    def fit(self, reference_data: pd.DataFrame):
        """从参考数据学习数据模式"""
        for col in reference_data.columns:
            col_data = reference_data[col]

            self.feature_stats[col] = {
                'dtype': str(col_data.dtype),
                'null_rate': col_data.isnull().mean(),
                'unique_count': col_data.nunique()
            }

            if np.issubdtype(col_data.dtype, np.number):
                self.feature_stats[col].update({
                    'mean': col_data.mean(),
                    'std': col_data.std(),
                    'min': col_data.min(),
                    'max': col_data.max(),
                    'q1': col_data.quantile(0.25),
                    'q3': col_data.quantile(0.75)
                })
            elif col_data.dtype == 'object' or col_data.dtype.name == 'category':
                self.feature_stats[col]['valid_values'] = set(col_data.dropna().unique())

        return self

    def check(self, data: pd.DataFrame) -> DataQualityReport:
        """检查数据质量"""
        issues = []

        # 检查缺失列
        missing_cols = set(self.feature_stats.keys()) - set(data.columns)
        if missing_cols:
            issues.append({
                'type': 'missing_columns',
                'severity': 'critical',
                'details': list(missing_cols)
            })

        # 检查额外列
        extra_cols = set(data.columns) - set(self.feature_stats.keys())
        if extra_cols:
            issues.append({
                'type': 'extra_columns',
                'severity': 'warning',
                'details': list(extra_cols)
            })

        # 检查每列的数据质量
        for col in data.columns:
            if col not in self.feature_stats:
                continue

            col_issues = self._check_column(data[col], col)
            issues.extend(col_issues)

        # 计算质量分数
        quality_score = self._calculate_quality_score(issues, len(data.columns))

        return DataQualityReport(
            timestamp=pd.Timestamp.now().isoformat(),
            total_records=len(data),
            issues=issues,
            quality_score=quality_score,
            is_acceptable=quality_score >= 0.8 and not any(
                i['severity'] == 'critical' for i in issues
            )
        )

    def _check_column(self, col_data: pd.Series, col_name: str) -> List[Dict]:
        """检查单列数据质量"""
        issues = []
        ref_stats = self.feature_stats[col_name]

        # 检查空值率
        null_rate = col_data.isnull().mean()
        if null_rate > self.null_threshold:
            issues.append({
                'type': 'high_null_rate',
                'severity': 'warning',
                'column': col_name,
                'details': f"空值率 {null_rate:.2%} 超过阈值 {self.null_threshold:.2%}"
            })

        # 检查数据类型
        if str(col_data.dtype) != ref_stats['dtype']:
            issues.append({
                'type': 'dtype_mismatch',
                'severity': 'critical',
                'column': col_name,
                'details': f"期望 {ref_stats['dtype']}，实际 {col_data.dtype}"
            })

        # 数值列的额外检查
        if np.issubdtype(col_data.dtype, np.number) and 'mean' in ref_stats:
            # 检查数值范围
            if col_data.min() < ref_stats['min'] * 0.5 or col_data.max() > ref_stats['max'] * 2:
                issues.append({
                    'type': 'value_range_anomaly',
                    'severity': 'warning',
                    'column': col_name,
                    'details': f"值范围 [{col_data.min():.2f}, {col_data.max():.2f}] "
                              f"超出参考范围 [{ref_stats['min']:.2f}, {ref_stats['max']:.2f}]"
                })

            # 检查异常值比例
            iqr = ref_stats['q3'] - ref_stats['q1']
            lower = ref_stats['q1'] - 1.5 * iqr
            upper = ref_stats['q3'] + 1.5 * iqr
            outlier_rate = ((col_data < lower) | (col_data > upper)).mean()

            if outlier_rate > self.outlier_threshold:
                issues.append({
                    'type': 'high_outlier_rate',
                    'severity': 'warning',
                    'column': col_name,
                    'details': f"异常值比例 {outlier_rate:.2%}"
                })

        # 类别列的额外检查
        if 'valid_values' in ref_stats:
            new_values = set(col_data.dropna().unique()) - ref_stats['valid_values']
            if new_values:
                issues.append({
                    'type': 'new_category_values',
                    'severity': 'warning',
                    'column': col_name,
                    'details': f"发现新类别值: {list(new_values)[:5]}"
                })

        return issues

    def _calculate_quality_score(self, issues: List[Dict], n_columns: int) -> float:
        """计算数据质量分数"""
        if not issues:
            return 1.0

        severity_weights = {
            'critical': 0.3,
            'warning': 0.1,
            'info': 0.02
        }

        penalty = sum(severity_weights.get(i['severity'], 0.05) for i in issues)

        return max(0, 1 - penalty / n_columns)
```

## Evidently AI

Evidently AI 是一个开源的 ML 可观测性平台，提供数据漂移检测、模型性能监控等功能。

### 基本使用

```python
# 安装: pip install evidently

import pandas as pd
import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

# Evidently 导入
from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_preset import (
    DataDriftPreset,
    DataQualityPreset,
    ClassificationPreset,
    TargetDriftPreset
)
from evidently.metrics import (
    DataDriftTable,
    DatasetDriftMetric,
    ColumnDriftMetric,
    ClassificationQualityMetric,
    ClassificationClassBalance
)

def create_evidently_data_drift_report(
    reference_data: pd.DataFrame,
    current_data: pd.DataFrame,
    column_mapping: ColumnMapping = None
) -> Report:
    """
    创建 Evidently 数据漂移报告

    参数:
        reference_data: 参考数据
        current_data: 当前数据
        column_mapping: 列映射配置

    返回:
        Evidently Report 对象
    """
    report = Report(metrics=[
        DataDriftPreset(),
        DatasetDriftMetric(),
        DataDriftTable()
    ])

    report.run(
        reference_data=reference_data,
        current_data=current_data,
        column_mapping=column_mapping
    )

    return report


def create_model_performance_report(
    reference_data: pd.DataFrame,
    current_data: pd.DataFrame,
    column_mapping: ColumnMapping
) -> Report:
    """
    创建模型性能监控报告
    """
    report = Report(metrics=[
        ClassificationPreset(),
        TargetDriftPreset(),
        ClassificationClassBalance()
    ])

    report.run(
        reference_data=reference_data,
        current_data=current_data,
        column_mapping=column_mapping
    )

    return report


def run_evidently_demo():
    """Evidently 使用演示"""
    # 生成示例数据
    X, y = make_classification(
        n_samples=10000,
        n_features=20,
        n_informative=10,
        n_redundant=5,
        random_state=42
    )

    feature_names = [f'feature_{i}' for i in range(20)]
    df = pd.DataFrame(X, columns=feature_names)
    df['target'] = y

    # 划分参考数据和当前数据
    reference_data = df.iloc[:7000].copy()
    current_data = df.iloc[7000:].copy()

    # 模拟漂移
    current_data['feature_0'] = current_data['feature_0'] + 0.5
    current_data['feature_1'] = current_data['feature_1'] * 1.5

    # 训练模型并添加预测
    model = RandomForestClassifier(random_state=42)
    model.fit(reference_data[feature_names], reference_data['target'])

    reference_data['prediction'] = model.predict(reference_data[feature_names])
    current_data['prediction'] = model.predict(current_data[feature_names])

    # 配置列映射
    column_mapping = ColumnMapping()
    column_mapping.target = 'target'
    column_mapping.prediction = 'prediction'
    column_mapping.numerical_features = feature_names

    # 创建数据漂移报告
    drift_report = create_evidently_data_drift_report(
        reference_data,
        current_data,
        column_mapping
    )

    # 保存报告
    drift_report.save_html('data_drift_report.html')

    # 获取 JSON 结果
    drift_results = drift_report.as_dict()

    print("=== 数据漂移报告摘要 ===")
    print(f"数据集漂移检测: {drift_results['metrics'][1]['result']['dataset_drift']}")

    # 创建性能监控报告
    performance_report = create_model_performance_report(
        reference_data,
        current_data,
        column_mapping
    )

    performance_report.save_html('performance_report.html')

    return drift_results

# run_evidently_demo()
```

### Evidently 实时监控

```python
from evidently.test_suite import TestSuite
from evidently.test_preset import (
    DataDriftTestPreset,
    DataQualityTestPreset,
    DataStabilityTestPreset
)
from evidently.tests import (
    TestNumberOfColumnsWithMissingValues,
    TestNumberOfRowsWithMissingValues,
    TestNumberOfConstantColumns,
    TestNumberOfDuplicatedRows,
    TestNumberOfDuplicatedColumns,
    TestColumnsType,
    TestNumberOfDriftedColumns
)

def create_data_quality_test_suite(
    reference_data: pd.DataFrame,
    current_data: pd.DataFrame
) -> TestSuite:
    """
    创建数据质量测试套件
    """
    test_suite = TestSuite(tests=[
        DataQualityTestPreset(),
        DataDriftTestPreset(),
        TestNumberOfColumnsWithMissingValues(),
        TestNumberOfDriftedColumns(lt=5)  # 漂移列数量应小于 5
    ])

    test_suite.run(
        reference_data=reference_data,
        current_data=current_data
    )

    return test_suite


class EvidentlyMonitoringService:
    """Evidently 监控服务封装"""

    def __init__(self, reference_data: pd.DataFrame, column_mapping: ColumnMapping = None):
        self.reference_data = reference_data
        self.column_mapping = column_mapping or ColumnMapping()

    def run_drift_tests(self, current_data: pd.DataFrame) -> dict:
        """运行漂移测试"""
        test_suite = TestSuite(tests=[
            DataDriftTestPreset(),
            TestNumberOfDriftedColumns(lt=len(current_data.columns) * 0.3)
        ])

        test_suite.run(
            reference_data=self.reference_data,
            current_data=current_data,
            column_mapping=self.column_mapping
        )

        results = test_suite.as_dict()

        return {
            'all_passed': all(t['status'] == 'SUCCESS' for t in results['tests']),
            'tests': results['tests'],
            'summary': results['summary']
        }

    def run_quality_tests(self, current_data: pd.DataFrame) -> dict:
        """运行数据质量测试"""
        test_suite = TestSuite(tests=[
            DataQualityTestPreset(),
            TestNumberOfRowsWithMissingValues(lte=len(current_data) * 0.1)
        ])

        test_suite.run(
            reference_data=self.reference_data,
            current_data=current_data,
            column_mapping=self.column_mapping
        )

        return test_suite.as_dict()

    def get_monitoring_summary(self, current_data: pd.DataFrame) -> dict:
        """获取监控摘要"""
        drift_results = self.run_drift_tests(current_data)
        quality_results = self.run_quality_tests(current_data)

        return {
            'timestamp': pd.Timestamp.now().isoformat(),
            'drift_check': {
                'passed': drift_results['all_passed'],
                'drifted_features': [
                    t['name'] for t in drift_results['tests']
                    if t['status'] != 'SUCCESS'
                ]
            },
            'quality_check': {
                'passed': all(
                    t['status'] == 'SUCCESS'
                    for t in quality_results['tests']
                )
            },
            'action_required': not drift_results['all_passed']
        }
```

## Arize AI

Arize AI 是一个企业级的 ML 可观测性平台，提供更强大的监控和分析能力。

### Arize 集成示例

```python
# 安装: pip install arize

from arize.api import Client
from arize.utils.types import (
    ModelTypes,
    Environments,
    Schema,
    Metrics
)
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Optional

class ArizeMonitoringClient:
    """Arize AI 监控客户端封装"""

    def __init__(self,
                 api_key: str,
                 space_key: str,
                 model_id: str,
                 model_version: str = "1.0.0"):
        """
        参数:
            api_key: Arize API 密钥
            space_key: Arize 空间密钥
            model_id: 模型 ID
            model_version: 模型版本
        """
        self.client = Client(space_key=space_key, api_key=api_key)
        self.model_id = model_id
        self.model_version = model_version

    def log_predictions(self,
                        prediction_ids: pd.Series,
                        features: pd.DataFrame,
                        predictions: pd.Series,
                        actuals: Optional[pd.Series] = None,
                        prediction_timestamps: Optional[pd.Series] = None,
                        environment: str = Environments.PRODUCTION) -> dict:
        """
        记录预测数据到 Arize

        参数:
            prediction_ids: 预测 ID
            features: 特征 DataFrame
            predictions: 预测值
            actuals: 实际值（可选）
            prediction_timestamps: 预测时间戳
            environment: 环境（生产/测试）
        """
        schema = Schema(
            prediction_id_column_name="prediction_id",
            feature_column_names=list(features.columns),
            prediction_label_column_name="prediction",
            actual_label_column_name="actual" if actuals is not None else None,
            timestamp_column_name="timestamp" if prediction_timestamps is not None else None
        )

        # 构建数据 DataFrame
        df = features.copy()
        df['prediction_id'] = prediction_ids
        df['prediction'] = predictions

        if actuals is not None:
            df['actual'] = actuals

        if prediction_timestamps is not None:
            df['timestamp'] = prediction_timestamps
        else:
            df['timestamp'] = datetime.now()

        # 发送到 Arize
        response = self.client.log(
            dataframe=df,
            model_id=self.model_id,
            model_version=self.model_version,
            model_type=ModelTypes.SCORE_CATEGORICAL,
            environment=environment,
            schema=schema
        )

        return {
            'status': 'success' if response.status_code == 200 else 'failed',
            'records_logged': len(df),
            'response': response
        }

    def log_training_data(self,
                          features: pd.DataFrame,
                          labels: pd.Series,
                          prediction_ids: Optional[pd.Series] = None) -> dict:
        """记录训练数据作为基准"""
        if prediction_ids is None:
            prediction_ids = pd.Series([f"train_{i}" for i in range(len(features))])

        schema = Schema(
            prediction_id_column_name="prediction_id",
            feature_column_names=list(features.columns),
            actual_label_column_name="actual"
        )

        df = features.copy()
        df['prediction_id'] = prediction_ids
        df['actual'] = labels

        response = self.client.log(
            dataframe=df,
            model_id=self.model_id,
            model_version=self.model_version,
            model_type=ModelTypes.SCORE_CATEGORICAL,
            environment=Environments.TRAINING,
            schema=schema
        )

        return {
            'status': 'success' if response.status_code == 200 else 'failed',
            'records_logged': len(df)
        }


def arize_integration_example():
    """Arize 集成示例（伪代码，需要真实 API 密钥）"""
    # 初始化客户端
    client = ArizeMonitoringClient(
        api_key="your-api-key",
        space_key="your-space-key",
        model_id="fraud-detection-model",
        model_version="2.0.0"
    )

    # 模拟数据
    features = pd.DataFrame({
        'amount': np.random.exponential(100, 1000),
        'merchant_category': np.random.choice(['retail', 'food', 'travel'], 1000),
        'hour_of_day': np.random.randint(0, 24, 1000),
        'is_weekend': np.random.choice([0, 1], 1000)
    })

    predictions = pd.Series(np.random.choice([0, 1], 1000, p=[0.95, 0.05]))
    prediction_ids = pd.Series([f"pred_{i}" for i in range(1000)])

    # 记录预测
    result = client.log_predictions(
        prediction_ids=prediction_ids,
        features=features,
        predictions=predictions
    )

    print(f"记录结果: {result}")

    return result
```

### 自定义监控仪表板配置

```python
from dataclasses import dataclass
from typing import List, Dict, Optional
import json

@dataclass
class MonitorConfig:
    """监控配置"""
    name: str
    metric: str
    threshold: float
    comparison: str  # 'gt', 'lt', 'eq'
    window_minutes: int = 60
    alert_channels: List[str] = None

@dataclass
class DashboardConfig:
    """仪表板配置"""
    name: str
    monitors: List[MonitorConfig]
    refresh_interval_seconds: int = 300

class MonitoringDashboard:
    """监控仪表板管理"""

    def __init__(self, dashboard_config: DashboardConfig):
        self.config = dashboard_config
        self.alert_history: List[Dict] = []

    def check_all_monitors(self, current_metrics: Dict[str, float]) -> List[Dict]:
        """检查所有监控项"""
        triggered_alerts = []

        for monitor in self.config.monitors:
            if monitor.metric not in current_metrics:
                continue

            current_value = current_metrics[monitor.metric]
            is_triggered = self._check_threshold(
                current_value,
                monitor.threshold,
                monitor.comparison
            )

            if is_triggered:
                alert = {
                    'monitor_name': monitor.name,
                    'metric': monitor.metric,
                    'current_value': current_value,
                    'threshold': monitor.threshold,
                    'comparison': monitor.comparison,
                    'timestamp': pd.Timestamp.now().isoformat(),
                    'channels': monitor.alert_channels or ['default']
                }
                triggered_alerts.append(alert)
                self.alert_history.append(alert)

        return triggered_alerts

    def _check_threshold(self,
                         value: float,
                         threshold: float,
                         comparison: str) -> bool:
        """检查阈值"""
        if comparison == 'gt':
            return value > threshold
        elif comparison == 'lt':
            return value < threshold
        elif comparison == 'eq':
            return abs(value - threshold) < 1e-6
        elif comparison == 'gte':
            return value >= threshold
        elif comparison == 'lte':
            return value <= threshold
        return False

    def get_dashboard_status(self) -> Dict:
        """获取仪表板状态"""
        return {
            'dashboard_name': self.config.name,
            'monitors_count': len(self.config.monitors),
            'recent_alerts': self.alert_history[-10:],
            'total_alerts': len(self.alert_history)
        }

    def export_config(self) -> str:
        """导出配置为 JSON"""
        config_dict = {
            'name': self.config.name,
            'refresh_interval_seconds': self.config.refresh_interval_seconds,
            'monitors': [
                {
                    'name': m.name,
                    'metric': m.metric,
                    'threshold': m.threshold,
                    'comparison': m.comparison,
                    'window_minutes': m.window_minutes,
                    'alert_channels': m.alert_channels
                }
                for m in self.config.monitors
            ]
        }
        return json.dumps(config_dict, indent=2)


# 配置示例
def create_production_dashboard():
    """创建生产环境监控仪表板"""
    monitors = [
        MonitorConfig(
            name="模型准确率下降",
            metric="accuracy",
            threshold=0.85,
            comparison="lt",
            window_minutes=60,
            alert_channels=["slack", "pagerduty"]
        ),
        MonitorConfig(
            name="数据漂移检测",
            metric="psi_max",
            threshold=0.25,
            comparison="gt",
            window_minutes=30,
            alert_channels=["slack"]
        ),
        MonitorConfig(
            name="预测延迟过高",
            metric="latency_p99",
            threshold=500,  # 毫秒
            comparison="gt",
            window_minutes=15,
            alert_channels=["slack", "pagerduty"]
        ),
        MonitorConfig(
            name="空值率异常",
            metric="null_rate",
            threshold=0.1,
            comparison="gt",
            window_minutes=30,
            alert_channels=["email"]
        ),
        MonitorConfig(
            name="预测分布偏移",
            metric="prediction_mean_shift",
            threshold=2.0,  # 标准差
            comparison="gt",
            window_minutes=60,
            alert_channels=["slack"]
        )
    ]

    dashboard = DashboardConfig(
        name="生产模型监控仪表板",
        monitors=monitors,
        refresh_interval_seconds=300
    )

    return MonitoringDashboard(dashboard)
```

## 告警和重训练触发

### 告警系统设计

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import json

class AlertSeverity(Enum):
    """告警严重程度"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class AlertStatus(Enum):
    """告警状态"""
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"

@dataclass
class Alert:
    """告警数据类"""
    alert_id: str
    name: str
    severity: AlertSeverity
    message: str
    metric_name: str
    metric_value: float
    threshold: float
    created_at: datetime = field(default_factory=datetime.now)
    status: AlertStatus = AlertStatus.ACTIVE
    resolved_at: Optional[datetime] = None
    metadata: Dict = field(default_factory=dict)

class AlertChannel(ABC):
    """告警通道抽象基类"""

    @abstractmethod
    def send(self, alert: Alert) -> bool:
        """发送告警"""
        pass

class SlackAlertChannel(AlertChannel):
    """Slack 告警通道"""

    def __init__(self, webhook_url: str):
        self.webhook_url = webhook_url

    def send(self, alert: Alert) -> bool:
        """发送 Slack 告警"""
        payload = {
            "text": f"*{alert.severity.value.upper()}* - {alert.name}",
            "attachments": [{
                "color": self._get_color(alert.severity),
                "fields": [
                    {"title": "Message", "value": alert.message, "short": False},
                    {"title": "Metric", "value": alert.metric_name, "short": True},
                    {"title": "Value", "value": f"{alert.metric_value:.4f}", "short": True},
                    {"title": "Threshold", "value": f"{alert.threshold:.4f}", "short": True},
                    {"title": "Time", "value": alert.created_at.isoformat(), "short": True}
                ]
            }]
        }

        # 实际发送逻辑
        # import requests
        # response = requests.post(self.webhook_url, json=payload)
        # return response.status_code == 200

        print(f"[Slack] 发送告警: {json.dumps(payload, indent=2, default=str)}")
        return True

    def _get_color(self, severity: AlertSeverity) -> str:
        """获取告警颜色"""
        colors = {
            AlertSeverity.INFO: "#36a64f",
            AlertSeverity.WARNING: "#ffcc00",
            AlertSeverity.CRITICAL: "#ff0000"
        }
        return colors.get(severity, "#808080")

class EmailAlertChannel(AlertChannel):
    """邮件告警通道"""

    def __init__(self, smtp_config: Dict, recipients: List[str]):
        self.smtp_config = smtp_config
        self.recipients = recipients

    def send(self, alert: Alert) -> bool:
        """发送邮件告警"""
        subject = f"[{alert.severity.value.upper()}] {alert.name}"
        body = f"""
        告警详情：

        名称: {alert.name}
        严重程度: {alert.severity.value}
        消息: {alert.message}

        指标: {alert.metric_name}
        当前值: {alert.metric_value:.4f}
        阈值: {alert.threshold:.4f}

        时间: {alert.created_at.isoformat()}
        告警 ID: {alert.alert_id}
        """

        # 实际发送逻辑
        # import smtplib
        # from email.mime.text import MIMEText
        # ...

        print(f"[Email] 发送告警到 {self.recipients}: {subject}")
        return True

class PagerDutyAlertChannel(AlertChannel):
    """PagerDuty 告警通道"""

    def __init__(self, routing_key: str):
        self.routing_key = routing_key

    def send(self, alert: Alert) -> bool:
        """发送 PagerDuty 告警"""
        payload = {
            "routing_key": self.routing_key,
            "event_action": "trigger",
            "dedup_key": alert.alert_id,
            "payload": {
                "summary": f"{alert.name}: {alert.message}",
                "severity": self._map_severity(alert.severity),
                "source": "ml-monitoring",
                "custom_details": {
                    "metric_name": alert.metric_name,
                    "metric_value": alert.metric_value,
                    "threshold": alert.threshold,
                    "metadata": alert.metadata
                }
            }
        }

        print(f"[PagerDuty] 发送告警: {alert.alert_id}")
        return True

    def _map_severity(self, severity: AlertSeverity) -> str:
        """映射严重程度"""
        mapping = {
            AlertSeverity.INFO: "info",
            AlertSeverity.WARNING: "warning",
            AlertSeverity.CRITICAL: "critical"
        }
        return mapping.get(severity, "info")


class AlertManager:
    """告警管理器"""

    def __init__(self):
        self.channels: Dict[str, AlertChannel] = {}
        self.active_alerts: Dict[str, Alert] = {}
        self.alert_history: List[Alert] = []
        self.suppression_rules: List[Dict] = []

    def register_channel(self, name: str, channel: AlertChannel):
        """注册告警通道"""
        self.channels[name] = channel

    def add_suppression_rule(self, rule: Dict):
        """添加告警抑制规则"""
        self.suppression_rules.append(rule)

    def trigger_alert(self,
                      alert: Alert,
                      channels: List[str] = None) -> bool:
        """触发告警"""
        # 检查是否被抑制
        if self._is_suppressed(alert):
            print(f"告警被抑制: {alert.alert_id}")
            return False

        # 检查是否已有相同告警
        if alert.alert_id in self.active_alerts:
            print(f"告警已存在: {alert.alert_id}")
            return False

        # 记录告警
        self.active_alerts[alert.alert_id] = alert
        self.alert_history.append(alert)

        # 发送到指定通道
        channels = channels or list(self.channels.keys())
        success = True

        for channel_name in channels:
            if channel_name in self.channels:
                try:
                    self.channels[channel_name].send(alert)
                except Exception as e:
                    print(f"发送告警失败 [{channel_name}]: {e}")
                    success = False

        return success

    def resolve_alert(self, alert_id: str):
        """解决告警"""
        if alert_id in self.active_alerts:
            alert = self.active_alerts.pop(alert_id)
            alert.status = AlertStatus.RESOLVED
            alert.resolved_at = datetime.now()

    def _is_suppressed(self, alert: Alert) -> bool:
        """检查告警是否应被抑制"""
        for rule in self.suppression_rules:
            if self._matches_rule(alert, rule):
                return True
        return False

    def _matches_rule(self, alert: Alert, rule: Dict) -> bool:
        """检查告警是否匹配抑制规则"""
        if 'metric_name' in rule and alert.metric_name != rule['metric_name']:
            return False
        if 'severity' in rule and alert.severity != rule['severity']:
            return False
        if 'time_window' in rule:
            start, end = rule['time_window']
            current_hour = datetime.now().hour
            if not (start <= current_hour < end):
                return False
        return True

    def get_active_alerts_summary(self) -> Dict:
        """获取活跃告警摘要"""
        by_severity = {}
        for alert in self.active_alerts.values():
            severity = alert.severity.value
            by_severity[severity] = by_severity.get(severity, 0) + 1

        return {
            'total_active': len(self.active_alerts),
            'by_severity': by_severity,
            'oldest_alert': min(
                (a.created_at for a in self.active_alerts.values()),
                default=None
            )
        }
```

### 重训练触发策略

```python
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass
import numpy as np

@dataclass
class RetrainingDecision:
    """重训练决策"""
    should_retrain: bool
    trigger_reason: str
    priority: str  # 'low', 'medium', 'high', 'critical'
    recommended_action: str
    metrics: Dict
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class RetrainingTrigger(ABC):
    """重训练触发器抽象基类"""

    @abstractmethod
    def evaluate(self, metrics: Dict) -> RetrainingDecision:
        """评估是否需要重训练"""
        pass

class PerformanceDegradationTrigger(RetrainingTrigger):
    """基于性能下降的触发器"""

    def __init__(self,
                 baseline_metrics: Dict[str, float],
                 degradation_threshold: float = 0.1,
                 min_samples: int = 1000):
        self.baseline_metrics = baseline_metrics
        self.degradation_threshold = degradation_threshold
        self.min_samples = min_samples

    def evaluate(self, metrics: Dict) -> RetrainingDecision:
        """评估性能是否下降"""
        if metrics.get('sample_size', 0) < self.min_samples:
            return RetrainingDecision(
                should_retrain=False,
                trigger_reason="样本量不足",
                priority="low",
                recommended_action="继续收集数据",
                metrics=metrics
            )

        degraded_metrics = []
        max_degradation = 0

        for metric_name, baseline_value in self.baseline_metrics.items():
            if metric_name not in metrics:
                continue

            current_value = metrics[metric_name]
            degradation = (baseline_value - current_value) / baseline_value

            if degradation > self.degradation_threshold:
                degraded_metrics.append({
                    'metric': metric_name,
                    'baseline': baseline_value,
                    'current': current_value,
                    'degradation': degradation
                })
                max_degradation = max(max_degradation, degradation)

        if degraded_metrics:
            priority = self._get_priority(max_degradation)
            return RetrainingDecision(
                should_retrain=True,
                trigger_reason=f"性能下降: {[m['metric'] for m in degraded_metrics]}",
                priority=priority,
                recommended_action="立即重训练模型" if priority in ['high', 'critical'] else "计划重训练",
                metrics={'degraded_metrics': degraded_metrics, 'max_degradation': max_degradation}
            )

        return RetrainingDecision(
            should_retrain=False,
            trigger_reason="性能正常",
            priority="low",
            recommended_action="继续监控",
            metrics=metrics
        )

    def _get_priority(self, degradation: float) -> str:
        """根据下降幅度确定优先级"""
        if degradation > 0.3:
            return 'critical'
        elif degradation > 0.2:
            return 'high'
        elif degradation > 0.15:
            return 'medium'
        else:
            return 'low'

class DataDriftTrigger(RetrainingTrigger):
    """基于数据漂移的触发器"""

    def __init__(self,
                 psi_threshold: float = 0.25,
                 drift_ratio_threshold: float = 0.3):
        self.psi_threshold = psi_threshold
        self.drift_ratio_threshold = drift_ratio_threshold

    def evaluate(self, metrics: Dict) -> RetrainingDecision:
        """评估数据漂移"""
        feature_psi = metrics.get('feature_psi', {})

        if not feature_psi:
            return RetrainingDecision(
                should_retrain=False,
                trigger_reason="无漂移数据",
                priority="low",
                recommended_action="检查监控配置",
                metrics=metrics
            )

        # 计算漂移特征比例
        drifted_features = [
            (name, psi) for name, psi in feature_psi.items()
            if psi > self.psi_threshold
        ]

        drift_ratio = len(drifted_features) / len(feature_psi)
        max_psi = max(feature_psi.values())

        if drift_ratio > self.drift_ratio_threshold or max_psi > 0.5:
            priority = 'critical' if max_psi > 0.5 else 'high' if drift_ratio > 0.5 else 'medium'
            return RetrainingDecision(
                should_retrain=True,
                trigger_reason=f"数据漂移: {len(drifted_features)} 个特征漂移",
                priority=priority,
                recommended_action="使用最新数据重训练",
                metrics={
                    'drifted_features': drifted_features,
                    'drift_ratio': drift_ratio,
                    'max_psi': max_psi
                }
            )

        return RetrainingDecision(
            should_retrain=False,
            trigger_reason="数据漂移在可接受范围内",
            priority="low",
            recommended_action="继续监控",
            metrics={'drift_ratio': drift_ratio, 'max_psi': max_psi}
        )

class ScheduledRetrainingTrigger(RetrainingTrigger):
    """基于时间表的触发器"""

    def __init__(self,
                 last_training_time: datetime,
                 max_age_days: int = 30,
                 min_age_days: int = 7):
        self.last_training_time = last_training_time
        self.max_age_days = max_age_days
        self.min_age_days = min_age_days

    def evaluate(self, metrics: Dict) -> RetrainingDecision:
        """评估是否需要定期重训练"""
        model_age = (datetime.now() - self.last_training_time).days

        if model_age >= self.max_age_days:
            return RetrainingDecision(
                should_retrain=True,
                trigger_reason=f"模型已运行 {model_age} 天，超过最大期限",
                priority="medium",
                recommended_action="按计划重训练",
                metrics={'model_age_days': model_age}
            )

        return RetrainingDecision(
            should_retrain=False,
            trigger_reason=f"模型年龄 {model_age} 天，在正常范围内",
            priority="low",
            recommended_action=f"下次评估: {self.max_age_days - model_age} 天后",
            metrics={'model_age_days': model_age, 'max_age_days': self.max_age_days}
        )


class RetrainingOrchestrator:
    """重训练编排器"""

    def __init__(self):
        self.triggers: List[RetrainingTrigger] = []
        self.decision_history: List[RetrainingDecision] = []
        self.callbacks: Dict[str, List[Callable]] = {
            'on_retrain_needed': [],
            'on_retrain_complete': []
        }

    def add_trigger(self, trigger: RetrainingTrigger):
        """添加触发器"""
        self.triggers.append(trigger)

    def register_callback(self, event: str, callback: Callable):
        """注册回调函数"""
        if event in self.callbacks:
            self.callbacks[event].append(callback)

    def evaluate(self, metrics: Dict) -> RetrainingDecision:
        """评估所有触发器"""
        decisions = []

        for trigger in self.triggers:
            decision = trigger.evaluate(metrics)
            decisions.append(decision)
            self.decision_history.append(decision)

        # 选择最高优先级的决策
        priority_order = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}

        retrain_decisions = [d for d in decisions if d.should_retrain]

        if retrain_decisions:
            final_decision = max(
                retrain_decisions,
                key=lambda d: priority_order.get(d.priority, 0)
            )

            # 触发回调
            for callback in self.callbacks['on_retrain_needed']:
                callback(final_decision)

            return final_decision

        # 没有需要重训练的情况，返回最新的决策
        return decisions[-1] if decisions else RetrainingDecision(
            should_retrain=False,
            trigger_reason="无触发器配置",
            priority="low",
            recommended_action="配置重训练触发器",
            metrics={}
        )

    def get_decision_summary(self, lookback_hours: int = 24) -> Dict:
        """获取决策摘要"""
        cutoff = datetime.now() - timedelta(hours=lookback_hours)
        recent_decisions = [
            d for d in self.decision_history
            if d.timestamp > cutoff
        ]

        return {
            'total_evaluations': len(recent_decisions),
            'retrain_recommended': sum(1 for d in recent_decisions if d.should_retrain),
            'by_priority': {
                priority: sum(1 for d in recent_decisions if d.priority == priority)
                for priority in ['low', 'medium', 'high', 'critical']
            },
            'latest_decision': recent_decisions[-1] if recent_decisions else None
        }


# 完整的重训练管道示例
def create_retraining_pipeline():
    """创建重训练管道"""
    # 初始化编排器
    orchestrator = RetrainingOrchestrator()

    # 添加性能下降触发器
    orchestrator.add_trigger(PerformanceDegradationTrigger(
        baseline_metrics={
            'accuracy': 0.92,
            'precision': 0.88,
            'recall': 0.85,
            'f1': 0.86
        },
        degradation_threshold=0.1
    ))

    # 添加数据漂移触发器
    orchestrator.add_trigger(DataDriftTrigger(
        psi_threshold=0.25,
        drift_ratio_threshold=0.3
    ))

    # 添加定期重训练触发器
    orchestrator.add_trigger(ScheduledRetrainingTrigger(
        last_training_time=datetime.now() - timedelta(days=20),
        max_age_days=30
    ))

    # 注册回调
    def on_retrain_needed(decision: RetrainingDecision):
        print(f"[重训练触发] 原因: {decision.trigger_reason}")
        print(f"优先级: {decision.priority}")
        print(f"建议操作: {decision.recommended_action}")
        # 这里可以触发实际的重训练流程
        # trigger_retraining_job(decision)

    orchestrator.register_callback('on_retrain_needed', on_retrain_needed)

    return orchestrator
```

## 完整监控系统示例

### 端到端监控流程

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Optional
import json

class MLMonitoringPipeline:
    """
    完整的 ML 监控管道

    集成数据漂移检测、性能监控、告警和重训练触发
    """

    def __init__(self,
                 model_name: str,
                 reference_data: pd.DataFrame,
                 reference_predictions: np.ndarray,
                 baseline_metrics: Dict[str, float],
                 feature_columns: list,
                 target_column: str = 'target'):
        """
        初始化监控管道
        """
        self.model_name = model_name
        self.feature_columns = feature_columns
        self.target_column = target_column

        # 初始化各个监控组件
        self.drift_detector = PSIDriftDetector()
        self.performance_monitor = ModelPerformanceMonitor(
            model_name=model_name
        )
        self.prediction_monitor = PredictionDistributionMonitor(
            reference_predictions=reference_predictions
        )
        self.anomaly_detector = StatisticalAnomalyDetector(method='zscore')
        self.quality_checker = DataQualityChecker()
        self.alert_manager = AlertManager()
        self.retraining_orchestrator = RetrainingOrchestrator()

        # 拟合检测器
        self._fit_detectors(reference_data, reference_predictions, baseline_metrics)

    def _fit_detectors(self,
                       reference_data: pd.DataFrame,
                       reference_predictions: np.ndarray,
                       baseline_metrics: Dict[str, float]):
        """拟合所有检测器"""
        # 数据质量检查器
        self.quality_checker.fit(reference_data[self.feature_columns])

        # 异常检测器
        self.anomaly_detector.fit(reference_data[self.feature_columns].values)

        # 设置性能基准
        for metric_name, value in baseline_metrics.items():
            self.performance_monitor.set_baseline(metric_name, value)

        # 保存参考数据
        self.reference_data = reference_data
        self.baseline_metrics = baseline_metrics

        # 配置重训练触发器
        self.retraining_orchestrator.add_trigger(
            PerformanceDegradationTrigger(
                baseline_metrics=baseline_metrics,
                degradation_threshold=0.1
            )
        )
        self.retraining_orchestrator.add_trigger(
            DataDriftTrigger(psi_threshold=0.25)
        )

    def process_batch(self,
                      batch_data: pd.DataFrame,
                      predictions: np.ndarray,
                      actuals: Optional[np.ndarray] = None) -> Dict:
        """
        处理一批数据并返回监控结果
        """
        results = {
            'timestamp': datetime.now().isoformat(),
            'batch_size': len(batch_data),
            'checks': {}
        }

        # 1. 数据质量检查
        quality_report = self.quality_checker.check(batch_data[self.feature_columns])
        results['checks']['data_quality'] = {
            'score': quality_report.quality_score,
            'is_acceptable': quality_report.is_acceptable,
            'issues_count': len(quality_report.issues)
        }

        # 2. 异常检测
        is_anomaly, anomaly_scores = self.anomaly_detector.detect(
            batch_data[self.feature_columns].values
        )
        results['checks']['anomalies'] = {
            'anomaly_count': int(np.sum(is_anomaly)),
            'anomaly_rate': float(np.mean(is_anomaly)),
            'mean_anomaly_score': float(np.mean(anomaly_scores))
        }

        # 3. 数据漂移检测
        drift_results = self.drift_detector.calculate_psi_all_features(
            self.reference_data[self.feature_columns],
            batch_data[self.feature_columns]
        )

        drifted_features = drift_results[drift_results['psi'] > 0.1]['feature'].tolist()
        results['checks']['data_drift'] = {
            'drifted_features': drifted_features,
            'max_psi': float(drift_results['psi'].max()),
            'mean_psi': float(drift_results['psi'].mean())
        }

        # 4. 预测分布监控
        prediction_analysis = self.prediction_monitor.analyze_predictions(predictions)
        results['checks']['prediction_distribution'] = {
            'mean_shift': prediction_analysis['statistics']['mean']['change'],
            'psi': prediction_analysis['drift_metrics']['psi'],
            'alerts': prediction_analysis['alerts']
        }

        # 5. 性能监控（如果有实际标签）
        if actuals is not None:
            for pred, actual in zip(predictions, actuals):
                self.performance_monitor.log_prediction(
                    prediction=pred,
                    actual=actual,
                    timestamp=datetime.now()
                )

            performance_metrics = self.performance_monitor.compute_metrics()
            results['checks']['performance'] = performance_metrics

            # 检查性能下降
            degradation_alerts = self.performance_monitor.check_degradation()
            if degradation_alerts:
                results['checks']['performance_alerts'] = degradation_alerts

        # 6. 评估是否需要重训练
        retraining_metrics = {
            'feature_psi': dict(zip(
                drift_results['feature'].tolist(),
                drift_results['psi'].tolist()
            ))
        }

        if actuals is not None and 'metrics' in results['checks'].get('performance', {}):
            retraining_metrics.update(results['checks']['performance']['metrics'])
            retraining_metrics['sample_size'] = len(batch_data)

        retraining_decision = self.retraining_orchestrator.evaluate(retraining_metrics)
        results['retraining'] = {
            'should_retrain': retraining_decision.should_retrain,
            'trigger_reason': retraining_decision.trigger_reason,
            'priority': retraining_decision.priority,
            'recommended_action': retraining_decision.recommended_action
        }

        # 7. 生成告警
        alerts = self._generate_alerts(results)
        results['alerts'] = [
            {
                'name': a.name,
                'severity': a.severity.value,
                'message': a.message
            }
            for a in alerts
        ]

        return results

    def _generate_alerts(self, results: Dict) -> list:
        """根据监控结果生成告警"""
        alerts = []

        # 数据质量告警
        if not results['checks']['data_quality']['is_acceptable']:
            alert = Alert(
                alert_id=f"quality_{datetime.now().timestamp()}",
                name="数据质量问题",
                severity=AlertSeverity.WARNING,
                message=f"数据质量分数: {results['checks']['data_quality']['score']:.2f}",
                metric_name="data_quality_score",
                metric_value=results['checks']['data_quality']['score'],
                threshold=0.8
            )
            alerts.append(alert)
            self.alert_manager.trigger_alert(alert)

        # 高异常率告警
        if results['checks']['anomalies']['anomaly_rate'] > 0.1:
            alert = Alert(
                alert_id=f"anomaly_{datetime.now().timestamp()}",
                name="异常率过高",
                severity=AlertSeverity.WARNING,
                message=f"异常样本比例: {results['checks']['anomalies']['anomaly_rate']:.2%}",
                metric_name="anomaly_rate",
                metric_value=results['checks']['anomalies']['anomaly_rate'],
                threshold=0.1
            )
            alerts.append(alert)
            self.alert_manager.trigger_alert(alert)

        # 数据漂移告警
        if results['checks']['data_drift']['max_psi'] > 0.25:
            alert = Alert(
                alert_id=f"drift_{datetime.now().timestamp()}",
                name="严重数据漂移",
                severity=AlertSeverity.CRITICAL,
                message=f"最大 PSI: {results['checks']['data_drift']['max_psi']:.3f}，"
                       f"漂移特征: {results['checks']['data_drift']['drifted_features']}",
                metric_name="max_psi",
                metric_value=results['checks']['data_drift']['max_psi'],
                threshold=0.25
            )
            alerts.append(alert)
            self.alert_manager.trigger_alert(alert, channels=['slack', 'pagerduty'])

        return alerts

    def get_monitoring_summary(self) -> Dict:
        """获取监控摘要"""
        return {
            'model_name': self.model_name,
            'active_alerts': self.alert_manager.get_active_alerts_summary(),
            'retraining_decisions': self.retraining_orchestrator.get_decision_summary(),
            'performance_summary': self.performance_monitor.get_performance_summary()
        }


# 使用示例
def run_monitoring_demo():
    """运行监控演示"""
    np.random.seed(42)

    # 创建参考数据
    n_samples = 5000
    reference_data = pd.DataFrame({
        'feature_1': np.random.normal(0, 1, n_samples),
        'feature_2': np.random.exponential(2, n_samples),
        'feature_3': np.random.uniform(0, 10, n_samples),
        'feature_4': np.random.normal(5, 2, n_samples),
        'target': np.random.choice([0, 1], n_samples, p=[0.7, 0.3])
    })

    reference_predictions = np.random.choice([0, 1], n_samples, p=[0.7, 0.3])

    baseline_metrics = {
        'accuracy': 0.85,
        'precision': 0.82,
        'recall': 0.78,
        'f1': 0.80
    }

    # 初始化监控管道
    pipeline = MLMonitoringPipeline(
        model_name='fraud_detection_v2',
        reference_data=reference_data,
        reference_predictions=reference_predictions,
        baseline_metrics=baseline_metrics,
        feature_columns=['feature_1', 'feature_2', 'feature_3', 'feature_4'],
        target_column='target'
    )

    # 模拟当前批次数据（有漂移）
    current_batch = pd.DataFrame({
        'feature_1': np.random.normal(0.3, 1.2, 1000),  # 漂移
        'feature_2': np.random.exponential(2.5, 1000),  # 漂移
        'feature_3': np.random.uniform(0, 10, 1000),
        'feature_4': np.random.normal(5, 2, 1000),
        'target': np.random.choice([0, 1], 1000, p=[0.7, 0.3])
    })

    current_predictions = np.random.choice([0, 1], 1000, p=[0.65, 0.35])
    current_actuals = current_batch['target'].values

    # 处理批次
    results = pipeline.process_batch(
        batch_data=current_batch,
        predictions=current_predictions,
        actuals=current_actuals
    )

    print("=== 监控结果 ===")
    print(json.dumps(results, indent=2, default=str))

    print("\n=== 监控摘要 ===")
    summary = pipeline.get_monitoring_summary()
    print(json.dumps(summary, indent=2, default=str))

    return results

# run_monitoring_demo()
```

## 面试要点

### 常见面试问题

**Q1: 什么是数据漂移和概念漂移？如何区分它们？**

数据漂移是指输入特征的分布 P(X) 发生变化，而概念漂移是指特征与标签之间的关系 P(Y|X) 发生变化。区分方法：
- 数据漂移可以通过只检查输入特征的分布变化来检测（如 KS 检验、PSI）
- 概念漂移需要结合预测结果和真实标签来检测，通常表现为模型性能下降但输入分布可能没有变化

**Q2: 解释 PSI 指标及其阈值？**

PSI（Population Stability Index）衡量两个分布之间的差异：
- PSI < 0.1：无显著变化
- 0.1 <= PSI < 0.25：中等变化，需要关注
- PSI >= 0.25：显著变化，需要采取行动

**Q3: 如何设计一个完整的模型监控系统？**

1. **数据层监控**：数据质量、缺失值、异常值
2. **特征层监控**：数据漂移检测、分布变化
3. **模型层监控**：性能指标、预测分布
4. **业务层监控**：业务 KPI、用户反馈
5. **告警系统**：多级别告警、多通道通知
6. **重训练触发**：自动化评估和触发机制

**Q4: 如何处理延迟标签场景下的监控？**

当标签获取有延迟时：
- 使用代理指标（如预测分布变化）进行早期预警
- 监控输入数据漂移作为间接指标
- 使用业务反馈作为软标签
- 建立标签回流机制，定期回填历史评估

**Q5: 什么时候应该触发模型重训练？**

触发条件通常包括：
1. 性能指标显著下降（超过预设阈值）
2. 数据漂移严重（PSI > 0.25 或大量特征漂移）
3. 定期重训练（基于时间策略）
4. 业务需求变化（新增特征或目标变更）

### 实践建议

```
1. 建立基准（Baseline）
   - 部署前在测试集上记录所有指标
   - 保存参考数据的分布统计量
   - 定义可接受的性能范围

2. 分层监控
   - 系统层：延迟、错误率、资源使用
   - 模型层：性能指标、漂移指标
   - 业务层：转化率、收入影响

3. 告警策略
   - 避免告警疲劳，合理设置阈值
   - 实现告警升级机制
   - 定期回顾和调整告警规则

4. 自动化
   - 自动化数据收集和指标计算
   - 自动化报告生成
   - 自动化重训练流程（MLOps）

5. 可视化
   - 实时仪表板展示关键指标
   - 历史趋势分析
   - 异常可视化和根因分析
```

## 延伸阅读

### 推荐资源

**工具和框架：**
- [Evidently AI](https://www.evidentlyai.com/) - 开源 ML 可观测性工具
- [Arize AI](https://arize.com/) - 企业级 ML 可观测性平台
- [Whylogs](https://whylabs.ai/whylogs) - 数据日志记录库
- [Great Expectations](https://greatexpectations.io/) - 数据质量验证
- [NannyML](https://www.nannyml.com/) - 模型性能估计

**论文和书籍：**
- "Learning under Concept Drift: A Review" - 概念漂移综述
- "A Survey on Concept Drift Adaptation" - 漂移适应方法
- "Reliable Machine Learning" - O'Reilly 可靠机器学习
- "Designing Machine Learning Systems" - Chip Huyen

### 相关主题

| 主题 | 描述 | 关联性 |
|------|------|--------|
| MLOps | 机器学习运维 | 监控是 MLOps 的核心组成 |
| 特征存储 | 特征管理和服务 | 提供监控的数据来源 |
| A/B 测试 | 模型对比实验 | 性能验证方法 |
| 模型可解释性 | 预测解释 | 帮助理解异常 |
| 持续训练 | 自动化重训练 | 监控触发的下游操作 |

## 总结

模型监控是机器学习系统在生产环境中可靠运行的关键保障。本文介绍了：

1. **监控的重要性**：理解为什么生产模型需要持续监控
2. **数据漂移检测**：使用 KS 检验、PSI 等方法检测特征分布变化
3. **概念漂移检测**：通过性能监控发现特征-标签关系的变化
4. **性能监控**：跟踪模型的实时性能指标
5. **异常检测**：识别输入数据中的异常样本
6. **监控工具**：Evidently AI、Arize AI 等工具的使用
7. **告警和重训练**：设计告警系统和自动化重训练触发

在实践中，建议从简单的监控指标开始，逐步建立完善的监控体系。记住：一个不被监控的模型，其行为是不可预测的。持续监控、及时发现问题、快速响应，是保障 ML 系统质量的关键。
