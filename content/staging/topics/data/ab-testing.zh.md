---
title: A/B测试完全指南
description: 掌握A/B测试方法论，用数据驱动产品决策
track: data
section: analytics-engines
difficulty: intermediate
tags:
  - A/B测试
  - 实验
  - 统计学
  - 数据驱动
status: imported
origin: old/src/content/docs/data/ab-testing.zh.md
divergence: 0.213
issues: []
legacy:
  category: Data
  subcategory: Analytics
  order: 10
  lastUpdated: 2026-01-07
---

A/B测试是互联网产品迭代的核心方法论，通过科学的实验设计和统计分析，帮助团队基于数据而非直觉做出产品决策。本文将系统介绍A/B测试的完整知识体系，从基本概念到高级实践，帮助你掌握这一数据驱动决策的核心技能。

## A/B测试基本概念

### 什么是A/B测试

A/B测试（也称为分割测试或随机对照实验）是一种统计假设检验方法，通过将用户随机分配到两个或多个版本中，比较不同版本对特定指标的影响，从而确定哪个版本更优。

```
┌─────────────────────────────────────────────────────────┐
│                     用户流量                              │
└─────────────────────┬───────────────────────────────────┘
                      │
            ┌─────────┴─────────┐
            │     随机分流       │
            └─────────┬─────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ 对照组A  │   │ 实验组B  │   │ 实验组C  │
   │ (Control)│   │(Variant)│   │(Variant)│
   └────┬────┘   └────┬────┘   └────┬────┘
        │             │             │
        ▼             ▼             ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ 指标收集 │   │ 指标收集 │   │ 指标收集 │
   └────┬────┘   └────┬────┘   └────┬────┘
        │             │             │
        └─────────────┼─────────────┘
                      ▼
              ┌───────────────┐
              │   统计分析     │
              └───────────────┘
```

### 核心术语

- **对照组（Control Group）**：保持现有方案不变的用户组，作为基准
- **实验组（Treatment Group）**：接受新方案的用户组
- **实验单元（Experimental Unit）**：被随机分配的最小单位，通常是用户或设备
- **转化率（Conversion Rate）**：完成目标行为的用户占比
- **提升（Lift）**：实验组相对对照组的指标变化百分比

```python
# A/B测试基本数据结构示例
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime

@dataclass
class ExperimentConfig:
    """实验配置"""
    experiment_id: str
    experiment_name: str
    hypothesis: str
    primary_metric: str
    secondary_metrics: List[str]
    traffic_percentage: float  # 参与实验的流量比例
    control_ratio: float  # 对照组比例
    start_date: datetime
    end_date: Optional[datetime]
    min_sample_size: int

@dataclass
class ExperimentGroup:
    """实验组定义"""
    group_id: str
    group_name: str
    traffic_ratio: float
    is_control: bool
    variant_config: dict

# 示例：按钮颜色实验配置
button_experiment = ExperimentConfig(
    experiment_id="exp_2024_001",
    experiment_name="购买按钮颜色优化",
    hypothesis="橙色按钮会比蓝色按钮带来更高的点击率",
    primary_metric="button_click_rate",
    secondary_metrics=["purchase_conversion", "revenue_per_user"],
    traffic_percentage=0.1,  # 10%流量参与实验
    control_ratio=0.5,
    start_date=datetime(2024, 1, 15),
    end_date=None,
    min_sample_size=10000
)
```

### A/B测试的价值

1. **降低决策风险**：用小流量验证方案，避免全量上线后的损失
2. **量化改进效果**：精确测量每个改动带来的业务价值
3. **建立因果关系**：区分相关性和因果性，得出可靠结论
4. **积累知识资产**：形成可复用的实验结论和最佳实践

## 实验设计原则

### MECE原则

实验设计应遵循MECE（Mutually Exclusive, Collectively Exhaustive）原则：

- **互斥性**：每个用户只能进入一个实验组
- **完备性**：所有参与实验的用户都被分配到某个组

```python
import hashlib
from typing import Tuple

class ExperimentAssigner:
    """实验分流器"""

    def __init__(self, experiment_id: str, salt: str = "ab_test"):
        self.experiment_id = experiment_id
        self.salt = salt

    def get_bucket(self, user_id: str, num_buckets: int = 1000) -> int:
        """
        基于用户ID计算分桶，保证：
        1. 同一用户始终进入同一个桶（确定性）
        2. 用户在桶中的分布均匀（随机性）
        """
        hash_input = f"{self.salt}_{self.experiment_id}_{user_id}"
        hash_value = hashlib.md5(hash_input.encode()).hexdigest()
        bucket = int(hash_value, 16) % num_buckets
        return bucket

    def assign_group(
        self,
        user_id: str,
        groups: List[Tuple[str, float]]
    ) -> Optional[str]:
        """
        分配用户到实验组
        groups: [(group_name, traffic_ratio), ...]
        """
        bucket = self.get_bucket(user_id)

        cumulative_ratio = 0
        for group_name, ratio in groups:
            cumulative_ratio += ratio * 1000  # 转换为千分比
            if bucket < cumulative_ratio:
                return group_name

        return None  # 未被分配（不在实验流量中）

# 使用示例
assigner = ExperimentAssigner("button_color_test")
groups = [
    ("control", 0.5),    # 50%对照组
    ("treatment", 0.5)   # 50%实验组
]

# 分配用户
for user_id in ["user_001", "user_002", "user_003"]:
    group = assigner.assign_group(user_id, groups)
    print(f"用户 {user_id} -> {group}")
```

### 随机化的重要性

正确的随机化是A/B测试的基石：

```python
import numpy as np
import pandas as pd
from scipy import stats

def check_randomization_quality(
    df: pd.DataFrame,
    group_col: str,
    covariate_cols: List[str]
) -> dict:
    """
    检验随机化质量：
    - 组间协变量应该无显著差异（AA检验思想）
    """
    results = {}
    groups = df[group_col].unique()

    for col in covariate_cols:
        if df[col].dtype in ['int64', 'float64']:
            # 数值变量：t检验或ANOVA
            group_data = [df[df[group_col] == g][col].dropna() for g in groups]
            if len(groups) == 2:
                stat, p_value = stats.ttest_ind(*group_data)
                test_name = "t-test"
            else:
                stat, p_value = stats.f_oneway(*group_data)
                test_name = "ANOVA"
        else:
            # 分类变量：卡方检验
            contingency = pd.crosstab(df[group_col], df[col])
            stat, p_value, _, _ = stats.chi2_contingency(contingency)
            test_name = "chi-square"

        results[col] = {
            "test": test_name,
            "statistic": stat,
            "p_value": p_value,
            "balanced": p_value > 0.05  # p > 0.05 表示组间无显著差异
        }

    return results

# 检验示例
np.random.seed(42)
n_users = 10000
experiment_data = pd.DataFrame({
    "user_id": range(n_users),
    "group": np.random.choice(["control", "treatment"], n_users),
    "age": np.random.normal(30, 10, n_users),
    "gender": np.random.choice(["M", "F"], n_users),
    "platform": np.random.choice(["iOS", "Android", "Web"], n_users, p=[0.4, 0.4, 0.2])
})

balance_check = check_randomization_quality(
    experiment_data,
    "group",
    ["age", "gender", "platform"]
)
print("随机化质量检验结果：")
for col, result in balance_check.items():
    status = "均衡" if result["balanced"] else "不均衡"
    print(f"  {col}: {status} (p={result['p_value']:.4f})")
```

### 实验假设设定

科学的实验始于明确的假设：

```python
@dataclass
class ExperimentHypothesis:
    """实验假设定义"""
    null_hypothesis: str      # 原假设 H0
    alt_hypothesis: str       # 备择假设 H1
    hypothesis_type: str      # "two-sided", "greater", "less"
    expected_effect: float    # 预期效应大小
    practical_significance: float  # 实际业务意义的最小效应

# 示例
hypothesis = ExperimentHypothesis(
    null_hypothesis="新按钮颜色对点击率无影响 (p_treatment = p_control)",
    alt_hypothesis="新按钮颜色会改变点击率 (p_treatment != p_control)",
    hypothesis_type="two-sided",
    expected_effect=0.02,  # 预期提升2个百分点
    practical_significance=0.01  # 至少1个百分点才有业务价值
)
```

## 样本量计算

### 为什么样本量重要

样本量直接影响实验的统计功效（Power），样本量不足会导致：
- 无法检测到真实存在的效应（假阴性/Type II错误）
- 实验结果波动大，结论不可靠
- 需要更长的实验周期

### 样本量计算公式

对于比例型指标（如转化率），最小样本量计算：

$$n = \frac{(Z_{1-\alpha/2} + Z_{1-\beta})^2 \cdot (p_1(1-p_1) + p_2(1-p_2))}{(p_2 - p_1)^2}$$

其中：
- $\alpha$：显著性水平（通常0.05）
- $\beta$：Type II错误率（1-Power，通常0.2）
- $p_1$：对照组预期转化率
- $p_2$：实验组预期转化率

```python
from scipy.stats import norm
import math

def calculate_sample_size_proportion(
    baseline_rate: float,
    mde: float,  # Minimum Detectable Effect
    alpha: float = 0.05,
    power: float = 0.8,
    two_sided: bool = True
) -> int:
    """
    计算比例型指标的最小样本量（每组）

    Parameters:
    -----------
    baseline_rate : float
        基准转化率
    mde : float
        最小可检测效应（绝对值，如0.02表示2个百分点）
    alpha : float
        显著性水平
    power : float
        统计功效
    two_sided : bool
        是否为双侧检验
    """
    if two_sided:
        z_alpha = norm.ppf(1 - alpha / 2)
    else:
        z_alpha = norm.ppf(1 - alpha)

    z_beta = norm.ppf(power)

    p1 = baseline_rate
    p2 = baseline_rate + mde

    # 合并方差估计
    pooled_var = p1 * (1 - p1) + p2 * (1 - p2)

    n = ((z_alpha + z_beta) ** 2 * pooled_var) / (mde ** 2)

    return math.ceil(n)

def calculate_sample_size_continuous(
    baseline_mean: float,
    baseline_std: float,
    mde: float,  # 相对提升比例
    alpha: float = 0.05,
    power: float = 0.8,
    two_sided: bool = True
) -> int:
    """
    计算连续型指标的最小样本量（每组）
    """
    if two_sided:
        z_alpha = norm.ppf(1 - alpha / 2)
    else:
        z_alpha = norm.ppf(1 - alpha)

    z_beta = norm.ppf(power)

    # 效应量（Cohen's d）
    effect_size = (baseline_mean * mde) / baseline_std

    n = 2 * ((z_alpha + z_beta) / effect_size) ** 2

    return math.ceil(n)

# 样本量计算示例
print("=== 样本量计算 ===\n")

# 场景1：转化率提升
baseline_cvr = 0.05  # 当前转化率5%
mde_absolute = 0.005  # 期望检测0.5个百分点的提升

n_proportion = calculate_sample_size_proportion(
    baseline_rate=baseline_cvr,
    mde=mde_absolute,
    alpha=0.05,
    power=0.8
)
print(f"场景1 - 转化率实验:")
print(f"  基准转化率: {baseline_cvr:.1%}")
print(f"  最小可检测效应: {mde_absolute:.1%}")
print(f"  每组所需样本量: {n_proportion:,}")
print(f"  总样本量: {n_proportion * 2:,}\n")

# 场景2：人均收入提升
baseline_arpu = 50  # 人均收入50元
arpu_std = 80       # 标准差80元
mde_relative = 0.05  # 期望检测5%的相对提升

n_continuous = calculate_sample_size_continuous(
    baseline_mean=baseline_arpu,
    baseline_std=arpu_std,
    mde=mde_relative,
    alpha=0.05,
    power=0.8
)
print(f"场景2 - 人均收入实验:")
print(f"  基准ARPU: {baseline_arpu}元")
print(f"  最小可检测效应: {mde_relative:.0%}相对提升")
print(f"  每组所需样本量: {n_continuous:,}")
print(f"  总样本量: {n_continuous * 2:,}")
```

### 实验周期估算

```python
def estimate_experiment_duration(
    required_sample_size: int,
    daily_traffic: int,
    experiment_traffic_ratio: float = 1.0,
    num_groups: int = 2
) -> dict:
    """
    估算实验所需天数
    """
    # 参与实验的日流量
    experiment_daily_traffic = daily_traffic * experiment_traffic_ratio

    # 每组日流量
    per_group_daily = experiment_daily_traffic / num_groups

    # 所需天数
    days_needed = math.ceil(required_sample_size / per_group_daily)

    # 建议额外增加时间以覆盖周末效应
    recommended_days = max(days_needed, 14)  # 至少两周

    return {
        "minimum_days": days_needed,
        "recommended_days": recommended_days,
        "total_users_needed": required_sample_size * num_groups,
        "daily_per_group": per_group_daily
    }

# 估算示例
duration = estimate_experiment_duration(
    required_sample_size=15000,
    daily_traffic=50000,
    experiment_traffic_ratio=0.2  # 20%流量参与实验
)
print(f"\n实验周期估算:")
print(f"  最少需要天数: {duration['minimum_days']}天")
print(f"  建议实验周期: {duration['recommended_days']}天")
print(f"  每日每组新增: {duration['daily_per_group']:.0f}用户")
```

## 统计显著性与置信度

### 假设检验基础

```python
from scipy import stats
import numpy as np

def ab_test_proportion(
    control_visitors: int,
    control_conversions: int,
    treatment_visitors: int,
    treatment_conversions: int,
    alpha: float = 0.05
) -> dict:
    """
    比例型指标的A/B测试（Z检验）
    """
    # 转化率
    p_control = control_conversions / control_visitors
    p_treatment = treatment_conversions / treatment_visitors

    # 合并转化率
    p_pooled = (control_conversions + treatment_conversions) / \
               (control_visitors + treatment_visitors)

    # 标准误
    se = np.sqrt(p_pooled * (1 - p_pooled) *
                 (1/control_visitors + 1/treatment_visitors))

    # Z统计量
    z_stat = (p_treatment - p_control) / se

    # 双侧p值
    p_value = 2 * (1 - stats.norm.cdf(abs(z_stat)))

    # 置信区间
    z_critical = stats.norm.ppf(1 - alpha/2)
    diff = p_treatment - p_control
    ci_lower = diff - z_critical * se
    ci_upper = diff + z_critical * se

    # 相对提升
    relative_lift = (p_treatment - p_control) / p_control

    return {
        "control_rate": p_control,
        "treatment_rate": p_treatment,
        "absolute_lift": diff,
        "relative_lift": relative_lift,
        "z_statistic": z_stat,
        "p_value": p_value,
        "ci_95": (ci_lower, ci_upper),
        "significant": p_value < alpha
    }

# 示例：按钮点击实验结果分析
result = ab_test_proportion(
    control_visitors=10000,
    control_conversions=500,     # 5%转化率
    treatment_visitors=10000,
    treatment_conversions=560    # 5.6%转化率
)

print("=== A/B测试结果 ===\n")
print(f"对照组转化率: {result['control_rate']:.2%}")
print(f"实验组转化率: {result['treatment_rate']:.2%}")
print(f"绝对提升: {result['absolute_lift']:.2%}")
print(f"相对提升: {result['relative_lift']:.1%}")
print(f"Z统计量: {result['z_statistic']:.3f}")
print(f"P值: {result['p_value']:.4f}")
print(f"95%置信区间: [{result['ci_95'][0]:.3%}, {result['ci_95'][1]:.3%}]")
print(f"统计显著: {'是' if result['significant'] else '否'}")
```

### 理解P值与置信区间

**P值的正确解读**：
- P值是在原假设为真的条件下，观察到当前结果或更极端结果的概率
- P < 0.05 意味着"如果没有效果，看到这种差异的概率小于5%"
- P值**不是**"实验有效的概率"

**置信区间的意义**：
- 95%置信区间意味着：如果重复实验100次，约95次的置信区间会包含真实效应
- 提供效应大小的范围估计，比单纯的显著/不显著判断更有信息量

```python
def interpret_confidence_interval(ci_lower: float, ci_upper: float) -> str:
    """
    解读置信区间
    """
    if ci_lower > 0:
        return "显著正效应：置信区间完全在0以上"
    elif ci_upper < 0:
        return "显著负效应：置信区间完全在0以下"
    elif ci_lower <= 0 <= ci_upper:
        return "不显著：置信区间跨越0"
    return "无法判断"

# 不同场景的置信区间解读
scenarios = [
    ("场景A", 0.005, 0.015),   # 显著正效应
    ("场景B", -0.003, 0.010),  # 不显著
    ("场景C", -0.012, -0.002), # 显著负效应
]

print("\n=== 置信区间解读 ===\n")
for name, ci_low, ci_high in scenarios:
    interpretation = interpret_confidence_interval(ci_low, ci_high)
    print(f"{name} CI: [{ci_low:.3f}, {ci_high:.3f}]")
    print(f"  解读: {interpretation}\n")
```

### 统计功效与Type I/II错误

```python
def calculate_observed_power(
    baseline_rate: float,
    observed_lift: float,
    sample_size: int,
    alpha: float = 0.05
) -> float:
    """
    计算观察到的统计功效（事后功效分析）
    """
    p1 = baseline_rate
    p2 = baseline_rate + observed_lift

    se = np.sqrt(p1*(1-p1)/sample_size + p2*(1-p2)/sample_size)
    z_alpha = norm.ppf(1 - alpha/2)

    z_beta = (abs(observed_lift) / se) - z_alpha
    power = norm.cdf(z_beta)

    return power

# 功效分析示例
power = calculate_observed_power(
    baseline_rate=0.05,
    observed_lift=0.006,
    sample_size=10000,
    alpha=0.05
)
print(f"实验统计功效: {power:.1%}")
```

## 常见指标选择

### 指标分类体系

```python
from enum import Enum
from typing import Dict, Any

class MetricType(Enum):
    """指标类型"""
    RATE = "rate"           # 比率型：转化率、点击率
    MEAN = "mean"           # 均值型：人均时长、人均收入
    COUNT = "count"         # 计数型：PV、UV
    REVENUE = "revenue"     # 收入型：GMV、ARPU
    RATIO = "ratio"         # 比值型：人均订单数

class MetricDefinition:
    """指标定义"""
    def __init__(
        self,
        name: str,
        metric_type: MetricType,
        numerator: str,
        denominator: str,
        is_primary: bool = False,
        direction: str = "higher_is_better"
    ):
        self.name = name
        self.metric_type = metric_type
        self.numerator = numerator
        self.denominator = denominator
        self.is_primary = is_primary
        self.direction = direction

# 电商场景常用指标
ecommerce_metrics = {
    "click_rate": MetricDefinition(
        name="点击率",
        metric_type=MetricType.RATE,
        numerator="点击用户数",
        denominator="曝光用户数",
        is_primary=False
    ),
    "conversion_rate": MetricDefinition(
        name="转化率",
        metric_type=MetricType.RATE,
        numerator="下单用户数",
        denominator="访问用户数",
        is_primary=True
    ),
    "arpu": MetricDefinition(
        name="人均收入",
        metric_type=MetricType.MEAN,
        numerator="总收入",
        denominator="用户数",
        is_primary=False
    ),
    "avg_order_value": MetricDefinition(
        name="客单价",
        metric_type=MetricType.MEAN,
        numerator="总收入",
        denominator="订单数",
        is_primary=False
    ),
    "orders_per_user": MetricDefinition(
        name="人均订单数",
        metric_type=MetricType.RATIO,
        numerator="订单数",
        denominator="用户数",
        is_primary=False
    )
}
```

### 主指标与辅指标

```python
class MetricFramework:
    """
    指标框架：
    - 北极星指标（North Star）：公司层面的核心指标
    - 主指标（Primary）：实验核心衡量指标，用于决策
    - 辅指标（Secondary）：帮助理解实验影响的补充指标
    - 护栏指标（Guardrail）：确保实验不会造成负面影响
    """

    def __init__(self):
        self.metrics: Dict[str, Dict[str, Any]] = {
            "north_star": None,
            "primary": [],
            "secondary": [],
            "guardrail": []
        }

    def set_north_star(self, metric: str, definition: str):
        self.metrics["north_star"] = {
            "metric": metric,
            "definition": definition
        }

    def add_primary(self, metric: str, threshold: float):
        self.metrics["primary"].append({
            "metric": metric,
            "min_detectable_effect": threshold
        })

    def add_secondary(self, metric: str):
        self.metrics["secondary"].append(metric)

    def add_guardrail(self, metric: str, threshold: float, direction: str):
        self.metrics["guardrail"].append({
            "metric": metric,
            "threshold": threshold,
            "direction": direction  # "no_decrease" or "no_increase"
        })

# 搜索推荐实验的指标框架示例
search_experiment = MetricFramework()
search_experiment.set_north_star(
    metric="GMV",
    definition="总交易额，反映业务整体健康度"
)
search_experiment.add_primary("搜索结果点击率", threshold=0.01)
search_experiment.add_secondary("搜索转化率")
search_experiment.add_secondary("人均搜索次数")
search_experiment.add_secondary("首次点击位置")
search_experiment.add_guardrail("页面加载时间", threshold=0.5, direction="no_increase")
search_experiment.add_guardrail("错误率", threshold=0.001, direction="no_increase")
```

### 指标敏感度分析

```python
def analyze_metric_sensitivity(
    metric_data: pd.Series,
    effect_sizes: List[float] = [0.01, 0.02, 0.05, 0.1],
    alpha: float = 0.05,
    power: float = 0.8
) -> pd.DataFrame:
    """
    分析指标对不同效应大小的敏感度
    """
    baseline_mean = metric_data.mean()
    baseline_std = metric_data.std()

    results = []
    for effect in effect_sizes:
        # 计算所需样本量
        if baseline_mean > 0 and baseline_mean < 1:  # 比率型
            n = calculate_sample_size_proportion(
                baseline_rate=baseline_mean,
                mde=effect * baseline_mean,  # 相对效应转绝对效应
                alpha=alpha,
                power=power
            )
        else:  # 连续型
            n = calculate_sample_size_continuous(
                baseline_mean=baseline_mean,
                baseline_std=baseline_std,
                mde=effect,
                alpha=alpha,
                power=power
            )

        results.append({
            "effect_size": f"{effect:.0%}",
            "sample_size_per_group": n,
            "total_sample_size": n * 2
        })

    return pd.DataFrame(results)
```

## 多变量测试（MVT）

### MVT与A/B测试的区别

多变量测试（Multivariate Testing）允许同时测试多个变量的多个变体组合：

```python
from itertools import product
from typing import List, Tuple

class MultivariateTest:
    """多变量测试设计"""

    def __init__(self, test_name: str):
        self.test_name = test_name
        self.factors: Dict[str, List[str]] = {}

    def add_factor(self, factor_name: str, levels: List[str]):
        """添加测试因子及其水平"""
        self.factors[factor_name] = levels

    def get_full_factorial(self) -> List[Tuple]:
        """获取全因子设计的所有组合"""
        factor_names = list(self.factors.keys())
        factor_levels = list(self.factors.values())

        combinations = list(product(*factor_levels))

        result = []
        for combo in combinations:
            variant = dict(zip(factor_names, combo))
            result.append(variant)

        return result

    def estimate_sample_size(
        self,
        baseline_rate: float,
        mde: float,
        alpha: float = 0.05,
        power: float = 0.8
    ) -> dict:
        """估算MVT所需样本量"""
        n_variants = len(self.get_full_factorial())

        # 每个变体所需的样本量
        n_per_variant = calculate_sample_size_proportion(
            baseline_rate, mde, alpha, power
        )

        # Bonferroni校正：多重比较需要更严格的alpha
        alpha_corrected = alpha / (n_variants - 1)
        n_per_variant_corrected = calculate_sample_size_proportion(
            baseline_rate, mde, alpha_corrected, power
        )

        return {
            "num_variants": n_variants,
            "sample_per_variant": n_per_variant,
            "sample_per_variant_corrected": n_per_variant_corrected,
            "total_sample": n_per_variant * n_variants,
            "total_sample_corrected": n_per_variant_corrected * n_variants
        }

# MVT示例：落地页优化
landing_page_mvt = MultivariateTest("landing_page_optimization")
landing_page_mvt.add_factor("headline", ["专业版", "限时优惠", "免费试用"])
landing_page_mvt.add_factor("cta_color", ["blue", "green", "orange"])
landing_page_mvt.add_factor("image", ["product", "lifestyle"])

print("=== 多变量测试设计 ===\n")
print("测试因子:")
for factor, levels in landing_page_mvt.factors.items():
    print(f"  {factor}: {levels}")

combinations = landing_page_mvt.get_full_factorial()
print(f"\n总变体数: {len(combinations)}")
print("\n前5个变体组合:")
for i, combo in enumerate(combinations[:5], 1):
    print(f"  {i}. {combo}")

# 样本量估算
sample_estimate = landing_page_mvt.estimate_sample_size(
    baseline_rate=0.03,
    mde=0.005
)
print(f"\n样本量估算:")
print(f"  每变体所需（未校正）: {sample_estimate['sample_per_variant']:,}")
print(f"  每变体所需（Bonferroni校正）: {sample_estimate['sample_per_variant_corrected']:,}")
print(f"  总样本量（校正后）: {sample_estimate['total_sample_corrected']:,}")
```

### 交互效应分析

```python
import statsmodels.api as sm
from statsmodels.formula.api import ols

def analyze_interaction_effects(
    df: pd.DataFrame,
    factors: List[str],
    response: str
) -> dict:
    """
    分析因子间的交互效应
    """
    # 构建包含主效应和交互效应的模型公式
    main_effects = " + ".join(factors)
    interactions = " + ".join([f"{f1}:{f2}" for i, f1 in enumerate(factors)
                               for f2 in factors[i+1:]])
    formula = f"{response} ~ {main_effects} + {interactions}"

    # 拟合ANOVA模型
    model = ols(formula, data=df).fit()
    anova_table = sm.stats.anova_lm(model, typ=2)

    return {
        "formula": formula,
        "anova_table": anova_table,
        "r_squared": model.rsquared
    }

# 模拟MVT数据并分析
np.random.seed(42)
n = 1000

mvt_data = pd.DataFrame({
    "headline": np.random.choice(["A", "B", "C"], n),
    "cta_color": np.random.choice(["blue", "green"], n),
    "converted": np.zeros(n)
})

# 模拟转化（包含交互效应）
base_rate = 0.03
for idx, row in mvt_data.iterrows():
    p = base_rate
    if row["headline"] == "B":
        p += 0.01
    if row["cta_color"] == "green":
        p += 0.005
    # 交互效应：B标题 + 绿色按钮有额外提升
    if row["headline"] == "B" and row["cta_color"] == "green":
        p += 0.008
    mvt_data.loc[idx, "converted"] = np.random.binomial(1, p)

print("\n各组合转化率:")
print(mvt_data.groupby(["headline", "cta_color"])["converted"].mean().unstack())
```

## 分流与实验平台

### 分流系统架构

```python
from abc import ABC, abstractmethod
import json
import redis
from typing import Optional

class ExperimentPlatform(ABC):
    """实验平台抽象基类"""

    @abstractmethod
    def get_experiment_config(self, experiment_id: str) -> dict:
        pass

    @abstractmethod
    def assign_user(self, user_id: str, experiment_id: str) -> str:
        pass

    @abstractmethod
    def log_exposure(self, user_id: str, experiment_id: str, group: str):
        pass

    @abstractmethod
    def log_conversion(self, user_id: str, experiment_id: str, metric: str, value: float):
        pass

class SimpleExperimentPlatform(ExperimentPlatform):
    """简易实验平台实现"""

    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.experiments = {}
        self.assignments = {}
        self.exposures = []
        self.conversions = []
        self.redis = redis_client

    def create_experiment(
        self,
        experiment_id: str,
        groups: List[dict],
        traffic_ratio: float = 1.0
    ):
        """创建实验"""
        self.experiments[experiment_id] = {
            "id": experiment_id,
            "groups": groups,
            "traffic_ratio": traffic_ratio,
            "status": "running"
        }

    def get_experiment_config(self, experiment_id: str) -> dict:
        return self.experiments.get(experiment_id, {})

    def assign_user(self, user_id: str, experiment_id: str) -> Optional[str]:
        """分配用户到实验组"""
        cache_key = f"{experiment_id}:{user_id}"

        # 检查缓存（保证一致性）
        if cache_key in self.assignments:
            return self.assignments[cache_key]

        experiment = self.experiments.get(experiment_id)
        if not experiment or experiment["status"] != "running":
            return None

        # 计算用户桶
        assigner = ExperimentAssigner(experiment_id)
        bucket = assigner.get_bucket(user_id)

        # 判断是否在实验流量中
        if bucket >= experiment["traffic_ratio"] * 1000:
            return None

        # 分配到具体组
        cumulative = 0
        for group in experiment["groups"]:
            cumulative += group["ratio"] * experiment["traffic_ratio"] * 1000
            if bucket < cumulative:
                self.assignments[cache_key] = group["name"]
                return group["name"]

        return None

    def log_exposure(self, user_id: str, experiment_id: str, group: str):
        """记录曝光"""
        self.exposures.append({
            "user_id": user_id,
            "experiment_id": experiment_id,
            "group": group,
            "timestamp": datetime.now()
        })

    def log_conversion(
        self,
        user_id: str,
        experiment_id: str,
        metric: str,
        value: float
    ):
        """记录转化"""
        self.conversions.append({
            "user_id": user_id,
            "experiment_id": experiment_id,
            "metric": metric,
            "value": value,
            "timestamp": datetime.now()
        })

# 使用示例
platform = SimpleExperimentPlatform()

# 创建实验
platform.create_experiment(
    experiment_id="homepage_banner_test",
    groups=[
        {"name": "control", "ratio": 0.5},
        {"name": "variant_a", "ratio": 0.25},
        {"name": "variant_b", "ratio": 0.25}
    ],
    traffic_ratio=0.2  # 20%流量
)

# 分流用户
for i in range(10):
    user_id = f"user_{i:04d}"
    group = platform.assign_user(user_id, "homepage_banner_test")
    if group:
        platform.log_exposure(user_id, "homepage_banner_test", group)
        print(f"{user_id} -> {group}")
```

### 分层实验

```python
class LayeredExperimentPlatform:
    """
    分层实验平台：
    - 不同层使用不同的随机化种子
    - 同一层内的实验互斥
    - 不同层的实验正交
    """

    def __init__(self):
        self.layers = {}
        self.experiments = {}

    def create_layer(self, layer_id: str, description: str):
        """创建实验层"""
        self.layers[layer_id] = {
            "id": layer_id,
            "description": description,
            "experiments": [],
            "traffic_used": 0
        }

    def add_experiment_to_layer(
        self,
        layer_id: str,
        experiment_id: str,
        traffic_ratio: float,
        groups: List[dict]
    ):
        """将实验添加到指定层"""
        layer = self.layers.get(layer_id)
        if not layer:
            raise ValueError(f"Layer {layer_id} not found")

        if layer["traffic_used"] + traffic_ratio > 1.0:
            raise ValueError("Not enough traffic in layer")

        experiment = {
            "id": experiment_id,
            "layer_id": layer_id,
            "traffic_start": layer["traffic_used"],
            "traffic_end": layer["traffic_used"] + traffic_ratio,
            "groups": groups
        }

        layer["experiments"].append(experiment_id)
        layer["traffic_used"] += traffic_ratio
        self.experiments[experiment_id] = experiment

    def assign_user(self, user_id: str, layer_id: str) -> dict:
        """
        在指定层为用户分配实验
        返回: {"experiment_id": ..., "group": ...} or None
        """
        layer = self.layers.get(layer_id)
        if not layer:
            return {}

        # 使用层ID作为盐值，保证层间正交
        assigner = ExperimentAssigner("", salt=f"layer_{layer_id}")
        bucket = assigner.get_bucket(user_id) / 1000  # 归一化到0-1

        # 找到用户落入的实验
        for exp_id in layer["experiments"]:
            exp = self.experiments[exp_id]
            if exp["traffic_start"] <= bucket < exp["traffic_end"]:
                # 在实验内再次分组
                group_assigner = ExperimentAssigner(exp_id)
                group_bucket = group_assigner.get_bucket(user_id) / 1000

                cumulative = 0
                for group in exp["groups"]:
                    cumulative += group["ratio"]
                    if group_bucket < cumulative:
                        return {"experiment_id": exp_id, "group": group["name"]}

        return {}  # 用户不在任何实验中

# 分层实验示例
layered_platform = LayeredExperimentPlatform()

# 创建UI层和算法层
layered_platform.create_layer("ui_layer", "UI相关实验")
layered_platform.create_layer("algo_layer", "算法相关实验")

# UI层添加实验
layered_platform.add_experiment_to_layer(
    layer_id="ui_layer",
    experiment_id="button_color",
    traffic_ratio=0.3,
    groups=[{"name": "blue", "ratio": 0.5}, {"name": "green", "ratio": 0.5}]
)

layered_platform.add_experiment_to_layer(
    layer_id="ui_layer",
    experiment_id="layout_test",
    traffic_ratio=0.3,
    groups=[{"name": "v1", "ratio": 0.5}, {"name": "v2", "ratio": 0.5}]
)

# 算法层添加实验
layered_platform.add_experiment_to_layer(
    layer_id="algo_layer",
    experiment_id="ranking_model",
    traffic_ratio=0.5,
    groups=[{"name": "baseline", "ratio": 0.5}, {"name": "new_model", "ratio": 0.5}]
)

# 用户可以同时参与不同层的实验
print("\n分层实验分配示例:")
for user_id in ["user_001", "user_002", "user_003"]:
    ui_assignment = layered_platform.assign_user(user_id, "ui_layer")
    algo_assignment = layered_platform.assign_user(user_id, "algo_layer")
    print(f"{user_id}:")
    print(f"  UI层: {ui_assignment}")
    print(f"  算法层: {algo_assignment}")
```

## 结果分析与解读

### 完整的分析流程

```python
class ABTestAnalyzer:
    """A/B测试结果分析器"""

    def __init__(self, experiment_data: pd.DataFrame):
        self.data = experiment_data

    def summary_statistics(self, metric: str, group_col: str = "group") -> pd.DataFrame:
        """计算分组统计摘要"""
        return self.data.groupby(group_col)[metric].agg([
            "count", "mean", "std", "median",
            lambda x: x.quantile(0.25),
            lambda x: x.quantile(0.75)
        ]).rename(columns={
            "<lambda_0>": "q25",
            "<lambda_1>": "q75"
        })

    def run_hypothesis_test(
        self,
        metric: str,
        control_group: str = "control",
        treatment_group: str = "treatment",
        test_type: str = "auto"
    ) -> dict:
        """执行假设检验"""
        control_data = self.data[self.data["group"] == control_group][metric]
        treatment_data = self.data[self.data["group"] == treatment_group][metric]

        # 自动选择检验方法
        if test_type == "auto":
            if set(control_data.unique()) <= {0, 1}:
                test_type = "proportion"
            else:
                test_type = "ttest"

        if test_type == "proportion":
            result = ab_test_proportion(
                control_visitors=len(control_data),
                control_conversions=int(control_data.sum()),
                treatment_visitors=len(treatment_data),
                treatment_conversions=int(treatment_data.sum())
            )
        else:
            # t检验
            stat, p_value = stats.ttest_ind(control_data, treatment_data)
            ci = stats.t.interval(
                0.95,
                len(treatment_data) + len(control_data) - 2,
                loc=treatment_data.mean() - control_data.mean(),
                scale=stats.sem(treatment_data - control_data.mean())
            )
            result = {
                "control_mean": control_data.mean(),
                "treatment_mean": treatment_data.mean(),
                "absolute_lift": treatment_data.mean() - control_data.mean(),
                "relative_lift": (treatment_data.mean() - control_data.mean()) / control_data.mean(),
                "t_statistic": stat,
                "p_value": p_value,
                "ci_95": ci,
                "significant": p_value < 0.05
            }

        return result

    def segment_analysis(
        self,
        metric: str,
        segment_col: str,
        control_group: str = "control",
        treatment_group: str = "treatment"
    ) -> pd.DataFrame:
        """分群分析"""
        results = []

        for segment in self.data[segment_col].unique():
            segment_data = self.data[self.data[segment_col] == segment]

            control = segment_data[segment_data["group"] == control_group][metric]
            treatment = segment_data[segment_data["group"] == treatment_group][metric]

            if len(control) > 0 and len(treatment) > 0:
                stat, p_value = stats.ttest_ind(control, treatment)
                results.append({
                    "segment": segment,
                    "control_n": len(control),
                    "treatment_n": len(treatment),
                    "control_mean": control.mean(),
                    "treatment_mean": treatment.mean(),
                    "lift": (treatment.mean() - control.mean()) / control.mean(),
                    "p_value": p_value,
                    "significant": p_value < 0.05
                })

        return pd.DataFrame(results)

    def novelty_effect_check(
        self,
        metric: str,
        date_col: str,
        treatment_group: str = "treatment"
    ) -> pd.DataFrame:
        """新奇效应检测：分析效果是否随时间衰减"""
        treatment_data = self.data[self.data["group"] == treatment_group]
        control_data = self.data[self.data["group"] == "control"]

        daily_stats = []
        for date in sorted(self.data[date_col].unique()):
            t_daily = treatment_data[treatment_data[date_col] == date][metric]
            c_daily = control_data[control_data[date_col] == date][metric]

            if len(t_daily) > 0 and len(c_daily) > 0:
                daily_stats.append({
                    "date": date,
                    "treatment_mean": t_daily.mean(),
                    "control_mean": c_daily.mean(),
                    "lift": (t_daily.mean() - c_daily.mean()) / c_daily.mean() if c_daily.mean() > 0 else 0
                })

        return pd.DataFrame(daily_stats)

# 分析示例
np.random.seed(42)
n_users = 5000

# 模拟实验数据
analysis_data = pd.DataFrame({
    "user_id": range(n_users),
    "group": np.random.choice(["control", "treatment"], n_users),
    "platform": np.random.choice(["iOS", "Android", "Web"], n_users, p=[0.4, 0.4, 0.2]),
    "date": pd.date_range("2024-01-01", periods=14).repeat(n_users // 14 + 1)[:n_users]
})

# 模拟转化（实验组有5%的相对提升）
analysis_data["converted"] = 0
for idx, row in analysis_data.iterrows():
    base_rate = 0.05
    if row["group"] == "treatment":
        base_rate *= 1.05
    analysis_data.loc[idx, "converted"] = np.random.binomial(1, base_rate)

# 运行分析
analyzer = ABTestAnalyzer(analysis_data)

print("=== A/B测试结果分析 ===\n")

# 整体统计
print("1. 分组统计摘要:")
print(analyzer.summary_statistics("converted"))

# 假设检验
print("\n2. 假设检验结果:")
test_result = analyzer.run_hypothesis_test("converted")
for key, value in test_result.items():
    print(f"  {key}: {value}")

# 分群分析
print("\n3. 平台分群分析:")
segment_result = analyzer.segment_analysis("converted", "platform")
print(segment_result.to_string(index=False))
```

### 可视化报告

```python
import matplotlib.pyplot as plt

def plot_experiment_results(analyzer: ABTestAnalyzer, metric: str):
    """生成实验结果可视化报告"""
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # 1. 各组转化率对比
    ax1 = axes[0, 0]
    group_stats = analyzer.summary_statistics(metric)
    group_stats["mean"].plot(kind="bar", ax=ax1, color=["#3498db", "#e74c3c"])
    ax1.set_title("各组转化率对比")
    ax1.set_ylabel("转化率")
    ax1.set_xticklabels(ax1.get_xticklabels(), rotation=0)

    # 2. 置信区间可视化
    ax2 = axes[0, 1]
    test_result = analyzer.run_hypothesis_test(metric)
    ci = test_result["ci_95"]
    lift = test_result["absolute_lift"]

    ax2.errorbar([0], [lift], yerr=[[lift - ci[0]], [ci[1] - lift]],
                 fmt='o', capsize=5, capthick=2, color="#2ecc71")
    ax2.axhline(y=0, color='red', linestyle='--', alpha=0.7)
    ax2.set_title("效应大小与95%置信区间")
    ax2.set_ylabel("绝对提升")
    ax2.set_xticks([])

    # 3. 分群效果对比
    ax3 = axes[1, 0]
    segment_result = analyzer.segment_analysis(metric, "platform")
    x = range(len(segment_result))
    width = 0.35
    ax3.bar([i - width/2 for i in x], segment_result["control_mean"],
            width, label="Control", color="#3498db")
    ax3.bar([i + width/2 for i in x], segment_result["treatment_mean"],
            width, label="Treatment", color="#e74c3c")
    ax3.set_xticks(x)
    ax3.set_xticklabels(segment_result["segment"])
    ax3.set_title("分平台转化率对比")
    ax3.legend()

    # 4. 效果随时间变化
    ax4 = axes[1, 1]
    daily_result = analyzer.novelty_effect_check(metric, "date")
    ax4.plot(daily_result["date"], daily_result["lift"], marker='o')
    ax4.axhline(y=0, color='red', linestyle='--', alpha=0.7)
    ax4.set_title("效果随时间变化（新奇效应检测）")
    ax4.set_ylabel("相对提升")
    ax4.tick_params(axis='x', rotation=45)

    plt.tight_layout()
    return fig
```

## 常见陷阱与避坑

### 过早停止实验（Peeking Problem）

```python
def demonstrate_peeking_problem(
    true_effect: float = 0,  # 真实无效果
    n_simulations: int = 1000,
    sample_size: int = 1000,
    peek_points: List[int] = [100, 200, 500, 1000]
) -> dict:
    """
    演示过早查看实验结果导致的假阳性问题
    """
    false_positives_no_peek = 0
    false_positives_with_peek = 0

    for _ in range(n_simulations):
        # 模拟数据（无真实效果）
        control = np.random.binomial(1, 0.1, sample_size)
        treatment = np.random.binomial(1, 0.1 + true_effect, sample_size)

        # 不偷看：只在最终检验
        result = ab_test_proportion(
            len(control), sum(control),
            len(treatment), sum(treatment)
        )
        if result["significant"]:
            false_positives_no_peek += 1

        # 偷看：在多个时间点检验，任一显著即停止
        peeked_significant = False
        for n in peek_points:
            result = ab_test_proportion(
                n, sum(control[:n]),
                n, sum(treatment[:n])
            )
            if result["significant"]:
                peeked_significant = True
                break

        if peeked_significant:
            false_positives_with_peek += 1

    return {
        "false_positive_rate_no_peek": false_positives_no_peek / n_simulations,
        "false_positive_rate_with_peek": false_positives_with_peek / n_simulations,
        "inflation_factor": (false_positives_with_peek / n_simulations) / 0.05
    }

# 演示
peeking_result = demonstrate_peeking_problem()
print("=== Peeking Problem 演示 ===\n")
print(f"不偷看的假阳性率: {peeking_result['false_positive_rate_no_peek']:.1%}")
print(f"多次偷看的假阳性率: {peeking_result['false_positive_rate_with_peek']:.1%}")
print(f"假阳性率膨胀倍数: {peeking_result['inflation_factor']:.1f}x")
```

### 辛普森悖论

```python
def demonstrate_simpsons_paradox():
    """演示辛普森悖论在A/B测试中的影响"""

    # 场景：新老用户混合导致的悖论
    data = {
        "整体": {
            "control": {"conversions": 180, "visitors": 2000},
            "treatment": {"conversions": 175, "visitors": 2000}
        },
        "新用户": {
            "control": {"conversions": 30, "visitors": 500},  # 6%
            "treatment": {"conversions": 80, "visitors": 1000}  # 8%
        },
        "老用户": {
            "control": {"conversions": 150, "visitors": 1500},  # 10%
            "treatment": {"conversions": 95, "visitors": 1000}  # 9.5%
        }
    }

    print("=== 辛普森悖论演示 ===\n")

    for segment, groups in data.items():
        control_rate = groups["control"]["conversions"] / groups["control"]["visitors"]
        treatment_rate = groups["treatment"]["conversions"] / groups["treatment"]["visitors"]

        print(f"{segment}:")
        print(f"  对照组: {control_rate:.1%} ({groups['control']['conversions']}/{groups['control']['visitors']})")
        print(f"  实验组: {treatment_rate:.1%} ({groups['treatment']['conversions']}/{groups['treatment']['visitors']})")
        print(f"  结论: {'实验组更优' if treatment_rate > control_rate else '对照组更优'}\n")

    print("解释：实验组整体看起来更差，但在新老用户分群中都更好！")
    print("原因：实验组中新用户占比更高（50% vs 25%），而新用户转化率较低")

demonstrate_simpsons_paradox()
```

### 多重比较问题

```python
def bonferroni_correction(p_values: List[float], alpha: float = 0.05) -> dict:
    """Bonferroni校正处理多重比较"""
    n_tests = len(p_values)
    adjusted_alpha = alpha / n_tests

    results = []
    for i, p in enumerate(p_values):
        results.append({
            "test": i + 1,
            "p_value": p,
            "significant_uncorrected": p < alpha,
            "significant_corrected": p < adjusted_alpha
        })

    return {
        "original_alpha": alpha,
        "adjusted_alpha": adjusted_alpha,
        "results": results
    }

def benjamini_hochberg_correction(p_values: List[float], alpha: float = 0.05) -> dict:
    """Benjamini-Hochberg FDR校正"""
    n_tests = len(p_values)
    sorted_indices = np.argsort(p_values)
    sorted_pvalues = np.array(p_values)[sorted_indices]

    # BH阈值
    bh_thresholds = [(i + 1) / n_tests * alpha for i in range(n_tests)]

    # 找到最大的k使得p(k) <= k/m * alpha
    significant = np.zeros(n_tests, dtype=bool)
    for k in range(n_tests - 1, -1, -1):
        if sorted_pvalues[k] <= bh_thresholds[k]:
            significant[:k+1] = True
            break

    # 还原到原始顺序
    original_significant = np.zeros(n_tests, dtype=bool)
    for i, idx in enumerate(sorted_indices):
        original_significant[idx] = significant[i]

    return {
        "significant": original_significant.tolist(),
        "fdr_controlled_at": alpha
    }

# 多重比较示例
print("=== 多重比较校正 ===\n")

# 假设测试了10个指标
p_values = [0.01, 0.03, 0.04, 0.08, 0.12, 0.15, 0.23, 0.45, 0.67, 0.89]

bonf_result = bonferroni_correction(p_values)
print(f"Bonferroni校正后的alpha: {bonf_result['adjusted_alpha']:.4f}")
print(f"未校正显著的指标数: {sum(1 for r in bonf_result['results'] if r['significant_uncorrected'])}")
print(f"校正后显著的指标数: {sum(1 for r in bonf_result['results'] if r['significant_corrected'])}")

bh_result = benjamini_hochberg_correction(p_values)
print(f"\nBH校正后显著的指标数: {sum(bh_result['significant'])}")
```

### 其他常见陷阱

```python
common_pitfalls = """
### A/B测试常见陷阱清单

1. **样本量不足**
   - 问题：实验结论不稳定，效应估计偏差大
   - 解决：实验前进行样本量计算，确保足够的统计功效

2. **实验污染**
   - 问题：用户跨设备/账号导致同时进入多个组
   - 解决：使用更稳定的用户标识，或在分析时排除可疑用户

3. **新奇效应（Novelty Effect）**
   - 问题：用户对新功能的短期好奇导致虚假提升
   - 解决：延长实验周期，分析效果随时间的变化趋势

4. **选择偏差**
   - 问题：非随机的分流导致组间系统性差异
   - 解决：AA测试验证分流系统，检查协变量均衡性

5. **幸存者偏差**
   - 问题：只分析留存用户，忽略流失用户
   - 解决：使用ITT（Intent-to-Treat）分析，包含所有被分配的用户

6. **网络效应**
   - 问题：社交产品中用户间相互影响
   - 解决：使用cluster randomization，以社群为单位分流

7. **指标冲突**
   - 问题：主指标提升但护栏指标下降
   - 解决：建立清晰的决策框架，权衡短期和长期影响

8. **p-hacking**
   - 问题：尝试多种分析方法直到得到显著结果
   - 解决：预注册实验设计，固定分析方案
"""

print(common_pitfalls)
```

## 面试要点

### 高频面试题与解答

```python
interview_questions = """
### A/B测试面试要点

#### 基础概念题

**Q: 什么是A/B测试？为什么需要A/B测试？**

A: A/B测试是一种随机对照实验方法，通过将用户随机分配到不同版本，比较各版本对业务指标的影响。
需要A/B测试的原因：
- 建立因果关系：区分"相关性"和"因果性"
- 量化效果：精确测量每个改动的业务价值
- 降低风险：用小流量验证，避免全量上线的损失
- 数据驱动：减少主观判断，用数据支持决策

**Q: 解释Type I和Type II错误**

A:
- Type I错误（假阳性）：原假设为真时错误地拒绝它，即"没有效果时误判为有效"
- Type II错误（假阴性）：原假设为假时错误地接受它，即"有效果时误判为无效"
- α（显著性水平）控制Type I错误率，β控制Type II错误率
- 统计功效 = 1 - β，表示检测到真实效应的能力

#### 实验设计题

**Q: 如何计算A/B测试所需的样本量？**

A: 样本量取决于四个因素：
1. 基准转化率（baseline）
2. 最小可检测效应（MDE）
3. 显著性水平（α，通常0.05）
4. 统计功效（1-β，通常0.8）

公式（比例型指标）：
n = (Z_α + Z_β)² × (p₁(1-p₁) + p₂(1-p₂)) / (p₂ - p₁)²

**Q: 如果实验组和对照组的用户特征不均衡怎么办？**

A:
1. 事前检查：通过AA测试或协变量均衡检验发现问题
2. 重新随机化：如果严重不均衡，修复分流逻辑后重新实验
3. 事后调整：使用CUPED、分层分析或回归调整消除协变量影响

#### 统计分析题

**Q: p值为0.03意味着什么？**

A: p=0.03意味着，如果实验真的没有效果（原假设为真），观察到当前结果或更极端结果的概率是3%。
注意：
- p值不是"实验有效的概率"
- p值不能告诉你效应的大小
- 应该结合置信区间和效应大小综合判断

**Q: 如何处理多重比较问题？**

A:
1. Bonferroni校正：将α除以比较次数，最保守
2. Benjamini-Hochberg：控制FDR，较为灵活
3. 预先指定主指标：只对主指标做严格检验
4. 分层假设：将指标分为主要和次要，分别设定标准

#### 场景设计题

**Q: 设计一个推荐算法的A/B测试方案**

A:
1. **实验目标**：验证新推荐模型是否提升用户点击率和转化率

2. **指标体系**：
   - 主指标：推荐位点击率
   - 辅指标：人均点击次数、停留时长、加购率
   - 护栏指标：页面加载时间、推荐多样性

3. **实验设计**：
   - 分流单元：用户ID
   - 分流比例：对照50%，实验50%
   - 流量占比：先用10%流量验证，再扩大

4. **样本量计算**：
   - 假设基准点击率5%，期望检测10%相对提升
   - 计算得每组需约30,000用户

5. **实验周期**：至少14天，覆盖完整周末周期

6. **分析计划**：
   - 整体效果分析
   - 分平台、分用户类型的异质性分析
   - 新奇效应检测

**Q: 实验跑了一周后发现实验组显著负向，该怎么办？**

A:
1. **验证结果可靠性**：
   - 检查分流是否正确
   - 确认样本量是否足够
   - 排除数据采集问题

2. **分析原因**：
   - 分群分析：哪些用户受影响最大
   - 指标下钻：哪个环节出了问题
   - 检查是否有bug或技术问题

3. **决策**：
   - 如果是bug，修复后继续或重启实验
   - 如果是真实负向效果，考虑立即停止
   - 如果影响范围小，可以继续观察更长时间

4. **文档记录**：
   - 记录实验结论和原因分析
   - 为后续迭代提供参考
"""

print(interview_questions)
```

### 代码面试题

```python
def interview_coding_question():
    """
    面试编程题：实现一个简单的A/B测试分析函数

    要求：
    1. 计算两组的转化率
    2. 进行假设检验
    3. 计算置信区间
    4. 返回是否显著
    """

    def analyze_ab_test(
        control_total: int,
        control_converted: int,
        treatment_total: int,
        treatment_converted: int,
        confidence_level: float = 0.95
    ) -> dict:
        """
        A/B测试分析函数

        Parameters:
        -----------
        control_total: 对照组总人数
        control_converted: 对照组转化人数
        treatment_total: 实验组总人数
        treatment_converted: 实验组转化人数
        confidence_level: 置信水平

        Returns:
        --------
        分析结果字典
        """
        from scipy.stats import norm
        import math

        # 计算转化率
        p_c = control_converted / control_total
        p_t = treatment_converted / treatment_total

        # 合并转化率
        p_pooled = (control_converted + treatment_converted) / (control_total + treatment_total)

        # 标准误
        se = math.sqrt(p_pooled * (1 - p_pooled) * (1/control_total + 1/treatment_total))

        # Z统计量和p值
        z = (p_t - p_c) / se
        p_value = 2 * (1 - norm.cdf(abs(z)))

        # 置信区间
        alpha = 1 - confidence_level
        z_crit = norm.ppf(1 - alpha/2)
        diff = p_t - p_c
        ci_lower = diff - z_crit * se
        ci_upper = diff + z_crit * se

        return {
            "control_rate": round(p_c, 4),
            "treatment_rate": round(p_t, 4),
            "lift": round((p_t - p_c) / p_c, 4) if p_c > 0 else None,
            "p_value": round(p_value, 4),
            "confidence_interval": (round(ci_lower, 4), round(ci_upper, 4)),
            "significant": p_value < alpha
        }

    # 测试
    result = analyze_ab_test(
        control_total=10000,
        control_converted=500,
        treatment_total=10000,
        treatment_converted=550
    )

    print("面试编程题 - A/B测试分析结果:")
    for k, v in result.items():
        print(f"  {k}: {v}")

    return analyze_ab_test

# 运行示例
analyze_ab_test = interview_coding_question()
```

## 总结

A/B测试是数据驱动决策的核心方法论，掌握它需要理解：

1. **统计学基础**：假设检验、置信区间、统计功效
2. **实验设计**：样本量计算、分流方法、指标选择
3. **结果分析**：正确解读p值、处理多重比较、识别陷阱
4. **工程实现**：分流系统、实验平台、数据管道

在实际工作中，A/B测试不仅仅是一个统计工具，更是一种科学思维方式。它要求我们：

- 在做决策前形成明确假设
- 设计严谨的实验来验证假设
- 基于数据而非直觉做判断
- 持续学习和迭代优化

无论你是产品经理、数据分析师还是工程师，深入理解A/B测试都将帮助你做出更好的产品决策，创造更大的业务价值。

## 参考资源

- 《Trustworthy Online Controlled Experiments》- Ron Kohavi
- Google: A/B Testing at Scale
- Microsoft ExP Platform Documentation
- Netflix Tech Blog: A/B Testing Series
