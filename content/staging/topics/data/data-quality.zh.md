---
title: 数据质量管理
description: 学习数据质量检测和保证方法
track: data
section: data-engineering
difficulty: intermediate
tags:
  - 数据质量
  - 数据治理
  - Great Expectations
  - 测试
status: imported
origin: old/src/content/docs/data/data-quality.zh.md
divergence: 0.181
issues: []
legacy:
  category: Data
  subcategory: Governance
  order: 23
  lastUpdated: 2026-01-07
---

数据质量是数据治理的核心环节，直接影响数据分析的准确性和业务决策的可靠性。本文将全面介绍数据质量管理的理论框架、工具实践和最佳实践，帮助你构建企业级的数据质量保障体系。

## 数据质量概述

### 什么是数据质量？

数据质量（Data Quality）是指数据满足特定用途需求的程度。高质量的数据应当准确、完整、一致、及时，能够有效支撑业务决策和数据分析。

```python
# 数据质量的核心概念
class DataQualityConcept:
    """数据质量核心概念"""

    def __init__(self):
        self.definition = "数据满足业务需求和使用目的的程度"
        self.importance = [
            "提高决策准确性",
            "降低运营风险",
            "提升客户满意度",
            "确保合规性",
            "节约数据修复成本"
        ]
        self.stakeholders = [
            "数据工程师",
            "数据分析师",
            "业务用户",
            "数据治理团队",
            "IT 运维团队"
        ]

    def calculate_business_impact(self, poor_quality_rate: float,
                                   annual_data_decisions: int,
                                   avg_decision_value: float) -> dict:
        """计算数据质量问题的业务影响"""
        potential_loss = annual_data_decisions * avg_decision_value * poor_quality_rate
        return {
            'poor_quality_rate': f"{poor_quality_rate * 100:.1f}%",
            'affected_decisions': int(annual_data_decisions * poor_quality_rate),
            'potential_annual_loss': f"${potential_loss:,.2f}",
            'recommendation': '建立数据质量管理体系' if poor_quality_rate > 0.05 else '持续监控'
        }
```

### 数据质量管理生命周期

```python
# 数据质量管理生命周期
class DQLifecycle:
    """数据质量管理生命周期"""

    PHASES = [
        {
            'phase': '定义',
            'activities': ['确定质量维度', '制定质量标准', '定义业务规则'],
            'deliverables': ['数据质量标准文档', '业务规则库']
        },
        {
            'phase': '评估',
            'activities': ['数据剖析', '质量检测', '问题识别'],
            'deliverables': ['数据质量报告', '问题清单']
        },
        {
            'phase': '改进',
            'activities': ['根因分析', '修复数据', '优化流程'],
            'deliverables': ['修复方案', '流程改进建议']
        },
        {
            'phase': '监控',
            'activities': ['持续检测', '趋势分析', '告警通知'],
            'deliverables': ['监控仪表板', '告警报告']
        },
        {
            'phase': '治理',
            'activities': ['制度建设', '责任分配', '培训宣贯'],
            'deliverables': ['治理制度', '培训材料']
        }
    ]

    @classmethod
    def get_phase_detail(cls, phase_name: str) -> dict:
        for phase in cls.PHASES:
            if phase['phase'] == phase_name:
                return phase
        return None
```

## 数据质量维度

### 六大核心维度

数据质量通常从六个核心维度进行评估，每个维度关注数据的不同方面。

```python
from dataclasses import dataclass
from typing import List, Optional, Callable
from enum import Enum

class QualityDimension(Enum):
    """数据质量六大维度"""
    COMPLETENESS = "completeness"      # 完整性
    ACCURACY = "accuracy"              # 准确性
    CONSISTENCY = "consistency"        # 一致性
    TIMELINESS = "timeliness"          # 及时性
    UNIQUENESS = "uniqueness"          # 唯一性
    VALIDITY = "validity"              # 有效性

@dataclass
class DimensionDefinition:
    """质量维度定义"""
    dimension: QualityDimension
    name_cn: str
    description: str
    metrics: List[str]
    check_methods: List[str]
    example_rules: List[str]

# 定义各维度详细信息
DIMENSION_DEFINITIONS = {
    QualityDimension.COMPLETENESS: DimensionDefinition(
        dimension=QualityDimension.COMPLETENESS,
        name_cn="完整性",
        description="数据记录和字段值的完整程度，是否存在缺失",
        metrics=["空值率", "记录完整率", "必填字段完整率"],
        check_methods=["空值检测", "记录计数对比", "必填字段校验"],
        example_rules=[
            "客户邮箱不能为空",
            "订单金额必须填写",
            "每日数据记录数不低于历史平均的 90%"
        ]
    ),
    QualityDimension.ACCURACY: DimensionDefinition(
        dimension=QualityDimension.ACCURACY,
        name_cn="准确性",
        description="数据值是否正确反映现实世界的真实状态",
        metrics=["错误率", "与源系统一致率", "业务规则符合率"],
        check_methods=["交叉验证", "源数据对比", "业务规则校验"],
        example_rules=[
            "订单总金额 = 商品金额 + 运费 - 折扣",
            "客户年龄在 0-150 之间",
            "销售数据与 ERP 系统一致"
        ]
    ),
    QualityDimension.CONSISTENCY: DimensionDefinition(
        dimension=QualityDimension.CONSISTENCY,
        name_cn="一致性",
        description="相同数据在不同系统或不同时间点的一致程度",
        metrics=["跨系统一致率", "时间序列一致率", "关联数据一致率"],
        check_methods=["跨源对比", "历史数据对比", "参照完整性检查"],
        example_rules=[
            "CRM 和 ERP 中客户数据一致",
            "订单状态变更符合状态机逻辑",
            "父子表数据关联完整"
        ]
    ),
    QualityDimension.TIMELINESS: DimensionDefinition(
        dimension=QualityDimension.TIMELINESS,
        name_cn="及时性",
        description="数据在需要时是否可用，数据更新是否及时",
        metrics=["数据延迟", "更新频率", "数据新鲜度"],
        check_methods=["时间戳检查", "延迟监控", "SLA 追踪"],
        example_rules=[
            "实时数据延迟不超过 5 分钟",
            "日报数据在次日 8 点前就绪",
            "订单数据 T+1 可用"
        ]
    ),
    QualityDimension.UNIQUENESS: DimensionDefinition(
        dimension=QualityDimension.UNIQUENESS,
        name_cn="唯一性",
        description="数据记录是否存在重复，主键是否唯一",
        metrics=["重复率", "主键唯一率", "去重比例"],
        check_methods=["主键检查", "重复记录检测", "模糊匹配去重"],
        example_rules=[
            "客户 ID 全局唯一",
            "同一订单不重复入库",
            "邮箱地址唯一（单租户内）"
        ]
    ),
    QualityDimension.VALIDITY: DimensionDefinition(
        dimension=QualityDimension.VALIDITY,
        name_cn="有效性",
        description="数据值是否符合定义的格式、范围和业务规则",
        metrics=["格式符合率", "范围符合率", "枚举值符合率"],
        check_methods=["正则匹配", "范围检查", "枚举值校验"],
        example_rules=[
            "邮箱格式符合标准",
            "手机号为 11 位数字",
            "状态值在允许列表内"
        ]
    )
}

def print_dimension_overview():
    """打印所有维度概览"""
    for dim, definition in DIMENSION_DEFINITIONS.items():
        print(f"\n{definition.name_cn} ({dim.value})")
        print(f"  描述: {definition.description}")
        print(f"  指标: {', '.join(definition.metrics)}")
        print(f"  规则示例: {definition.example_rules[0]}")
```

### 维度检测实现

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any
import re

class DimensionChecker:
    """数据质量维度检测器"""

    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.results = {}

    def check_completeness(self, columns: List[str] = None) -> Dict[str, Any]:
        """检测完整性"""
        if columns is None:
            columns = self.df.columns.tolist()

        results = {
            'dimension': 'completeness',
            'total_records': len(self.df),
            'column_stats': {}
        }

        for col in columns:
            null_count = self.df[col].isna().sum()
            completeness_rate = 1 - (null_count / len(self.df))
            results['column_stats'][col] = {
                'null_count': int(null_count),
                'completeness_rate': round(completeness_rate, 4),
                'status': 'pass' if completeness_rate >= 0.99 else 'fail'
            }

        results['overall_completeness'] = np.mean([
            v['completeness_rate'] for v in results['column_stats'].values()
        ])

        self.results['completeness'] = results
        return results

    def check_uniqueness(self, key_columns: List[str]) -> Dict[str, Any]:
        """检测唯一性"""
        total_records = len(self.df)
        unique_records = len(self.df.drop_duplicates(subset=key_columns))
        duplicate_count = total_records - unique_records

        # 获取重复记录样本
        duplicates = self.df[self.df.duplicated(subset=key_columns, keep=False)]

        results = {
            'dimension': 'uniqueness',
            'key_columns': key_columns,
            'total_records': total_records,
            'unique_records': unique_records,
            'duplicate_count': duplicate_count,
            'uniqueness_rate': round(unique_records / total_records, 4),
            'duplicate_samples': duplicates.head(10).to_dict('records') if len(duplicates) > 0 else [],
            'status': 'pass' if duplicate_count == 0 else 'fail'
        }

        self.results['uniqueness'] = results
        return results

    def check_validity(self, rules: Dict[str, Dict]) -> Dict[str, Any]:
        """检测有效性

        rules 格式:
        {
            'column_name': {
                'type': 'regex' | 'range' | 'enum' | 'custom',
                'pattern': str,  # for regex
                'min': float, 'max': float,  # for range
                'values': list,  # for enum
                'func': callable  # for custom
            }
        }
        """
        results = {
            'dimension': 'validity',
            'rules_checked': len(rules),
            'column_results': {}
        }

        for col, rule in rules.items():
            if col not in self.df.columns:
                continue

            valid_mask = pd.Series([True] * len(self.df))

            if rule['type'] == 'regex':
                pattern = rule['pattern']
                valid_mask = self.df[col].astype(str).str.match(pattern, na=False)

            elif rule['type'] == 'range':
                min_val = rule.get('min', float('-inf'))
                max_val = rule.get('max', float('inf'))
                valid_mask = (self.df[col] >= min_val) & (self.df[col] <= max_val)

            elif rule['type'] == 'enum':
                valid_values = rule['values']
                valid_mask = self.df[col].isin(valid_values)

            elif rule['type'] == 'custom':
                func = rule['func']
                valid_mask = self.df[col].apply(func)

            valid_count = valid_mask.sum()
            validity_rate = valid_count / len(self.df)

            results['column_results'][col] = {
                'rule_type': rule['type'],
                'valid_count': int(valid_count),
                'invalid_count': int(len(self.df) - valid_count),
                'validity_rate': round(validity_rate, 4),
                'status': 'pass' if validity_rate >= 0.95 else 'fail'
            }

        results['overall_validity'] = np.mean([
            v['validity_rate'] for v in results['column_results'].values()
        ]) if results['column_results'] else 1.0

        self.results['validity'] = results
        return results

    def check_consistency(self, consistency_rules: List[Dict]) -> Dict[str, Any]:
        """检测一致性

        consistency_rules 格式:
        [
            {
                'name': 'rule_name',
                'type': 'cross_column' | 'referential' | 'temporal',
                'expression': str,  # pandas query expression
            }
        ]
        """
        results = {
            'dimension': 'consistency',
            'rules_checked': len(consistency_rules),
            'rule_results': {}
        }

        for rule in consistency_rules:
            rule_name = rule['name']
            try:
                # 使用 pandas query 执行一致性检查
                inconsistent = self.df.query(rule['expression'])
                inconsistent_count = len(inconsistent)
                consistency_rate = 1 - (inconsistent_count / len(self.df))

                results['rule_results'][rule_name] = {
                    'rule_type': rule['type'],
                    'inconsistent_count': inconsistent_count,
                    'consistency_rate': round(consistency_rate, 4),
                    'samples': inconsistent.head(5).to_dict('records') if inconsistent_count > 0 else [],
                    'status': 'pass' if consistency_rate >= 0.99 else 'fail'
                }
            except Exception as e:
                results['rule_results'][rule_name] = {
                    'error': str(e),
                    'status': 'error'
                }

        self.results['consistency'] = results
        return results

    def check_timeliness(self, timestamp_column: str,
                         expected_freshness: timedelta) -> Dict[str, Any]:
        """检测及时性"""
        now = datetime.now()

        # 转换时间戳列
        ts_series = pd.to_datetime(self.df[timestamp_column])
        latest_record = ts_series.max()
        data_age = now - latest_record

        # 计算记录的时间分布
        time_distribution = {
            'last_hour': int((ts_series > now - timedelta(hours=1)).sum()),
            'last_day': int((ts_series > now - timedelta(days=1)).sum()),
            'last_week': int((ts_series > now - timedelta(weeks=1)).sum()),
            'older': int((ts_series <= now - timedelta(weeks=1)).sum())
        }

        results = {
            'dimension': 'timeliness',
            'timestamp_column': timestamp_column,
            'latest_record': latest_record.isoformat(),
            'data_age_seconds': data_age.total_seconds(),
            'expected_freshness_seconds': expected_freshness.total_seconds(),
            'is_fresh': data_age <= expected_freshness,
            'time_distribution': time_distribution,
            'status': 'pass' if data_age <= expected_freshness else 'fail'
        }

        self.results['timeliness'] = results
        return results

    def generate_report(self) -> Dict[str, Any]:
        """生成综合质量报告"""
        report = {
            'generated_at': datetime.now().isoformat(),
            'total_records': len(self.df),
            'dimensions_checked': list(self.results.keys()),
            'overall_status': 'pass',
            'dimension_scores': {},
            'details': self.results
        }

        # 计算各维度得分
        for dim, result in self.results.items():
            if dim == 'completeness':
                score = result.get('overall_completeness', 0)
            elif dim == 'uniqueness':
                score = result.get('uniqueness_rate', 0)
            elif dim == 'validity':
                score = result.get('overall_validity', 0)
            elif dim == 'consistency':
                scores = [r['consistency_rate'] for r in result.get('rule_results', {}).values()
                         if 'consistency_rate' in r]
                score = np.mean(scores) if scores else 1.0
            elif dim == 'timeliness':
                score = 1.0 if result.get('is_fresh', False) else 0.5
            else:
                score = 0

            report['dimension_scores'][dim] = round(score, 4)

            if score < 0.95:
                report['overall_status'] = 'fail'

        report['overall_score'] = round(
            np.mean(list(report['dimension_scores'].values())), 4
        )

        return report


# 使用示例
def run_quality_checks():
    """运行质量检测示例"""
    # 创建示例数据
    df = pd.DataFrame({
        'customer_id': [1, 2, 3, 4, 5, 5],  # 有重复
        'email': ['a@test.com', 'b@test.com', None, 'invalid', 'e@test.com', 'e@test.com'],
        'age': [25, 30, -5, 45, 200, 35],  # 有无效值
        'status': ['active', 'inactive', 'active', 'unknown', 'active', 'active'],
        'created_at': pd.date_range('2024-01-01', periods=6, freq='D')
    })

    checker = DimensionChecker(df)

    # 完整性检测
    checker.check_completeness(['email', 'age'])

    # 唯一性检测
    checker.check_uniqueness(['customer_id'])

    # 有效性检测
    checker.check_validity({
        'email': {'type': 'regex', 'pattern': r'^[\w\.-]+@[\w\.-]+\.\w+$'},
        'age': {'type': 'range', 'min': 0, 'max': 150},
        'status': {'type': 'enum', 'values': ['active', 'inactive', 'pending']}
    })

    # 及时性检测
    checker.check_timeliness('created_at', timedelta(days=7))

    # 生成报告
    return checker.generate_report()
```

## Great Expectations

### Great Expectations 简介

Great Expectations 是一个开源的数据质量框架，提供数据验证、文档生成和数据剖析功能。

```python
# Great Expectations 核心概念
"""
Great Expectations 核心组件：
1. Data Source: 数据源配置
2. Data Asset: 数据资产定义
3. Expectation: 数据期望（质量规则）
4. Expectation Suite: 期望集合
5. Checkpoint: 检查点（执行验证）
6. Data Docs: 数据文档（报告）
"""

# 安装 Great Expectations
# pip install great_expectations

import great_expectations as gx
from great_expectations.core.expectation_configuration import ExpectationConfiguration

# 初始化 Great Expectations 上下文
def init_great_expectations():
    """初始化 GX 上下文"""
    context = gx.get_context()
    return context
```

### 创建 Expectation Suite

```python
import great_expectations as gx
from great_expectations.expectations import (
    ExpectColumnValuesToNotBeNull,
    ExpectColumnValuesToBeUnique,
    ExpectColumnValuesToBeBetween,
    ExpectColumnValuesToMatchRegex,
    ExpectColumnValuesToBeInSet,
    ExpectTableRowCountToBeBetween,
)

def create_customer_expectation_suite(context):
    """创建客户数据期望套件"""

    # 创建期望套件
    suite_name = "customer_data_quality_suite"

    # 定义期望
    expectations = [
        # 表级别检查
        {
            "expectation_type": "expect_table_row_count_to_be_between",
            "kwargs": {
                "min_value": 1000,
                "max_value": 10000000
            },
            "meta": {
                "dimension": "completeness",
                "notes": "确保数据量在合理范围内"
            }
        },
        # 列级别检查 - 完整性
        {
            "expectation_type": "expect_column_values_to_not_be_null",
            "kwargs": {"column": "customer_id"},
            "meta": {"dimension": "completeness", "severity": "critical"}
        },
        {
            "expectation_type": "expect_column_values_to_not_be_null",
            "kwargs": {"column": "email"},
            "meta": {"dimension": "completeness", "severity": "high"}
        },
        # 唯一性检查
        {
            "expectation_type": "expect_column_values_to_be_unique",
            "kwargs": {"column": "customer_id"},
            "meta": {"dimension": "uniqueness", "severity": "critical"}
        },
        {
            "expectation_type": "expect_column_values_to_be_unique",
            "kwargs": {"column": "email"},
            "meta": {"dimension": "uniqueness", "severity": "high"}
        },
        # 有效性检查
        {
            "expectation_type": "expect_column_values_to_match_regex",
            "kwargs": {
                "column": "email",
                "regex": r"^[\w\.-]+@[\w\.-]+\.\w+$"
            },
            "meta": {"dimension": "validity"}
        },
        {
            "expectation_type": "expect_column_values_to_be_between",
            "kwargs": {
                "column": "age",
                "min_value": 0,
                "max_value": 150
            },
            "meta": {"dimension": "validity"}
        },
        {
            "expectation_type": "expect_column_values_to_be_in_set",
            "kwargs": {
                "column": "status",
                "value_set": ["active", "inactive", "pending", "suspended"]
            },
            "meta": {"dimension": "validity"}
        },
        # 格式检查
        {
            "expectation_type": "expect_column_values_to_match_regex",
            "kwargs": {
                "column": "phone",
                "regex": r"^1[3-9]\d{9}$",
                "mostly": 0.95  # 允许 5% 不符合
            },
            "meta": {"dimension": "validity", "notes": "中国大陆手机号格式"}
        }
    ]

    # 创建并保存期望套件
    suite = context.add_expectation_suite(suite_name)

    for exp in expectations:
        expectation_config = ExpectationConfiguration(
            expectation_type=exp["expectation_type"],
            kwargs=exp["kwargs"],
            meta=exp.get("meta", {})
        )
        suite.add_expectation(expectation_config)

    context.save_expectation_suite(suite)
    return suite


def create_order_expectation_suite(context):
    """创建订单数据期望套件"""

    suite_name = "order_data_quality_suite"
    suite = context.add_expectation_suite(suite_name)

    expectations = [
        # 主键检查
        {
            "expectation_type": "expect_column_values_to_not_be_null",
            "kwargs": {"column": "order_id"}
        },
        {
            "expectation_type": "expect_column_values_to_be_unique",
            "kwargs": {"column": "order_id"}
        },
        # 外键检查
        {
            "expectation_type": "expect_column_values_to_not_be_null",
            "kwargs": {"column": "customer_id"}
        },
        # 金额检查
        {
            "expectation_type": "expect_column_values_to_be_between",
            "kwargs": {
                "column": "total_amount",
                "min_value": 0,
                "max_value": 10000000,
                "strict_min": False
            }
        },
        # 日期检查
        {
            "expectation_type": "expect_column_values_to_not_be_null",
            "kwargs": {"column": "order_date"}
        },
        # 状态检查
        {
            "expectation_type": "expect_column_values_to_be_in_set",
            "kwargs": {
                "column": "status",
                "value_set": ["pending", "confirmed", "shipped", "delivered", "cancelled"]
            }
        },
        # 复合列检查
        {
            "expectation_type": "expect_compound_columns_to_be_unique",
            "kwargs": {
                "column_list": ["customer_id", "order_date", "product_id"]
            },
            "meta": {"notes": "同一客户同一天不能重复下单同一商品"}
        }
    ]

    for exp in expectations:
        suite.add_expectation(ExpectationConfiguration(
            expectation_type=exp["expectation_type"],
            kwargs=exp["kwargs"],
            meta=exp.get("meta", {})
        ))

    context.save_expectation_suite(suite)
    return suite
```

### 执行验证

```python
import great_expectations as gx
import pandas as pd

def run_validation(context, suite_name: str, data: pd.DataFrame) -> dict:
    """执行数据验证"""

    # 创建数据源
    datasource = context.sources.add_pandas("pandas_datasource")

    # 创建数据资产
    data_asset = datasource.add_dataframe_asset(name="customer_data")

    # 创建批次请求
    batch_request = data_asset.build_batch_request(dataframe=data)

    # 创建检查点
    checkpoint = context.add_or_update_checkpoint(
        name="customer_checkpoint",
        validations=[
            {
                "batch_request": batch_request,
                "expectation_suite_name": suite_name,
            }
        ],
    )

    # 运行验证
    checkpoint_result = checkpoint.run()

    return checkpoint_result


def analyze_validation_results(result) -> dict:
    """分析验证结果"""
    analysis = {
        'success': result.success,
        'run_time': result.run_id.run_time.isoformat(),
        'statistics': {
            'evaluated_expectations': 0,
            'successful_expectations': 0,
            'unsuccessful_expectations': 0
        },
        'failed_expectations': [],
        'by_dimension': {}
    }

    for validation_result in result.run_results.values():
        results = validation_result.get('results', [])

        for res in results:
            analysis['statistics']['evaluated_expectations'] += 1

            if res.success:
                analysis['statistics']['successful_expectations'] += 1
            else:
                analysis['statistics']['unsuccessful_expectations'] += 1
                analysis['failed_expectations'].append({
                    'expectation_type': res.expectation_config.expectation_type,
                    'kwargs': res.expectation_config.kwargs,
                    'result': res.result
                })

            # 按维度统计
            dimension = res.expectation_config.meta.get('dimension', 'unknown')
            if dimension not in analysis['by_dimension']:
                analysis['by_dimension'][dimension] = {'passed': 0, 'failed': 0}

            if res.success:
                analysis['by_dimension'][dimension]['passed'] += 1
            else:
                analysis['by_dimension'][dimension]['failed'] += 1

    # 计算成功率
    total = analysis['statistics']['evaluated_expectations']
    if total > 0:
        analysis['statistics']['success_rate'] = (
            analysis['statistics']['successful_expectations'] / total
        )

    return analysis
```

### 生成数据文档

```python
def generate_data_docs(context):
    """生成数据文档"""
    # 构建并打开数据文档
    context.build_data_docs()

    # 获取数据文档站点 URL
    site_urls = context.get_docs_sites_urls()
    print(f"数据文档已生成: {site_urls}")

    return site_urls


def create_custom_data_docs_config():
    """自定义数据文档配置"""
    docs_config = {
        "class_name": "SiteBuilder",
        "site_index_builder": {
            "class_name": "DefaultSiteIndexBuilder",
        },
        "store_backend": {
            "class_name": "TupleFilesystemStoreBackend",
            "base_directory": "data_docs/",
        },
        "site_section_builders": {
            "expectations": {
                "class_name": "DefaultSiteSectionBuilder",
                "source_store_name": "expectations_store",
            },
            "validations": {
                "class_name": "DefaultSiteSectionBuilder",
                "source_store_name": "validations_store",
            },
            "profiling": {
                "class_name": "DefaultSiteSectionBuilder",
                "source_store_name": "profiling_store",
            }
        }
    }
    return docs_config
```

## dbt 数据测试

### dbt 测试概述

dbt 提供了强大的数据测试功能，包括内置测试和自定义测试。

```yaml
# models/schema.yml - dbt 测试配置

version: 2

models:
  - name: dim_customers
    description: "客户维度表"
    config:
      tags: ['dimension', 'critical']

    # 模型级别测试
    tests:
      - dbt_utils.equal_rowcount:
          compare_model: ref('stg_customers')

    columns:
      - name: customer_id
        description: "客户唯一标识"
        tests:
          - unique
          - not_null
          - relationships:
              to: ref('stg_customers')
              field: customer_id

      - name: email
        description: "客户邮箱地址"
        tests:
          - unique
          - not_null
          - dbt_utils.not_empty_string

      - name: customer_segment
        description: "客户分层"
        tests:
          - accepted_values:
              values: ['VIP', 'Gold', 'Silver', 'Bronze', 'New']
              quote: true

      - name: created_at
        description: "创建时间"
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: "<= current_timestamp"

  - name: fact_orders
    description: "订单事实表"
    config:
      tags: ['fact', 'critical']

    columns:
      - name: order_id
        tests:
          - unique
          - not_null

      - name: customer_id
        tests:
          - not_null
          - relationships:
              to: ref('dim_customers')
              field: customer_id

      - name: order_amount
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0"
          - dbt_utils.expression_is_true:
              expression: "<= 10000000"
              config:
                severity: warn

      - name: order_status
        tests:
          - accepted_values:
              values: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

      - name: order_date
        tests:
          - not_null
          - dbt_utils.not_null_proportion:
              at_least: 0.99
```

### 自定义 dbt 测试

```sql
-- tests/generic/test_positive_value.sql
-- 通用测试：检查正数值

{% test positive_value(model, column_name) %}

SELECT *
FROM {{ model }}
WHERE {{ column_name }} < 0

{% endtest %}


-- tests/generic/test_valid_email.sql
-- 通用测试：检查邮箱格式

{% test valid_email(model, column_name) %}

SELECT *
FROM {{ model }}
WHERE {{ column_name }} IS NOT NULL
  AND {{ column_name }} !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'

{% endtest %}


-- tests/generic/test_freshness_hours.sql
-- 通用测试：检查数据新鲜度

{% test freshness_hours(model, column_name, max_hours) %}

SELECT *
FROM {{ model }}
WHERE {{ column_name }} < CURRENT_TIMESTAMP - INTERVAL '{{ max_hours }} hours'

{% endtest %}


-- tests/generic/test_referential_integrity.sql
-- 通用测试：检查参照完整性

{% test referential_integrity(model, column_name, to, field) %}

SELECT
    a.{{ column_name }}
FROM {{ model }} a
LEFT JOIN {{ to }} b ON a.{{ column_name }} = b.{{ field }}
WHERE a.{{ column_name }} IS NOT NULL
  AND b.{{ field }} IS NULL

{% endtest %}
```

```yaml
# 使用自定义测试
# models/schema.yml

version: 2

models:
  - name: fact_sales
    columns:
      - name: sales_amount
        tests:
          - positive_value
          - not_null

      - name: customer_email
        tests:
          - valid_email

      - name: updated_at
        tests:
          - freshness_hours:
              max_hours: 24

      - name: product_id
        tests:
          - referential_integrity:
              to: ref('dim_products')
              field: product_id
```

### 单数测试（Singular Tests）

```sql
-- tests/assert_total_amount_calculation.sql
-- 单数测试：验证订单总金额计算正确

SELECT
    o.order_id,
    o.total_amount AS recorded_total,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS calculated_total
FROM {{ ref('fact_orders') }} o
LEFT JOIN {{ ref('fact_order_items') }} oi ON o.order_id = oi.order_id
GROUP BY o.order_id, o.total_amount
HAVING ABS(o.total_amount - COALESCE(SUM(oi.quantity * oi.unit_price), 0)) > 0.01


-- tests/assert_no_future_orders.sql
-- 单数测试：不应存在未来日期的订单

SELECT *
FROM {{ ref('fact_orders') }}
WHERE order_date > CURRENT_DATE


-- tests/assert_customer_order_consistency.sql
-- 单数测试：客户订单数据一致性

WITH customer_orders AS (
    SELECT
        customer_id,
        COUNT(*) AS order_count,
        SUM(total_amount) AS total_spent
    FROM {{ ref('fact_orders') }}
    GROUP BY customer_id
)
SELECT
    c.customer_id,
    c.total_orders AS recorded_orders,
    co.order_count AS actual_orders,
    c.lifetime_value AS recorded_ltv,
    co.total_spent AS actual_ltv
FROM {{ ref('dim_customers') }} c
LEFT JOIN customer_orders co ON c.customer_id = co.customer_id
WHERE c.total_orders != COALESCE(co.order_count, 0)
   OR ABS(c.lifetime_value - COALESCE(co.total_spent, 0)) > 0.01


-- tests/assert_daily_record_count.sql
-- 单数测试：每日记录数不应异常下降

WITH daily_counts AS (
    SELECT
        DATE(created_at) AS record_date,
        COUNT(*) AS record_count
    FROM {{ ref('stg_events') }}
    GROUP BY DATE(created_at)
),
count_changes AS (
    SELECT
        record_date,
        record_count,
        LAG(record_count) OVER (ORDER BY record_date) AS prev_count
    FROM daily_counts
)
SELECT *
FROM count_changes
WHERE prev_count IS NOT NULL
  AND record_count < prev_count * 0.5  -- 下降超过50%
```

## 数据剖析（Data Profiling）

### 数据剖析概述

数据剖析是分析数据结构、内容和质量的过程，用于理解数据特征和发现潜在问题。

```python
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from dataclasses import dataclass
from datetime import datetime

@dataclass
class ColumnProfile:
    """列剖析结果"""
    column_name: str
    data_type: str
    total_count: int
    null_count: int
    null_percentage: float
    unique_count: int
    unique_percentage: float
    min_value: Any
    max_value: Any
    mean_value: float = None
    std_value: float = None
    median_value: float = None
    mode_value: Any = None
    top_values: List[tuple] = None
    pattern_analysis: Dict = None

class DataProfiler:
    """数据剖析器"""

    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.profile_results = {}

    def profile_column(self, column: str) -> ColumnProfile:
        """剖析单列"""
        series = self.df[column]
        total_count = len(series)
        null_count = series.isna().sum()

        profile = ColumnProfile(
            column_name=column,
            data_type=str(series.dtype),
            total_count=total_count,
            null_count=int(null_count),
            null_percentage=round(null_count / total_count * 100, 2),
            unique_count=int(series.nunique()),
            unique_percentage=round(series.nunique() / total_count * 100, 2),
            min_value=series.min() if not series.isna().all() else None,
            max_value=series.max() if not series.isna().all() else None
        )

        # 数值型列的统计
        if pd.api.types.is_numeric_dtype(series):
            profile.mean_value = round(series.mean(), 4) if not series.isna().all() else None
            profile.std_value = round(series.std(), 4) if not series.isna().all() else None
            profile.median_value = round(series.median(), 4) if not series.isna().all() else None

        # 频率分析
        value_counts = series.value_counts()
        profile.mode_value = value_counts.index[0] if len(value_counts) > 0 else None
        profile.top_values = [
            (str(val), int(count))
            for val, count in value_counts.head(10).items()
        ]

        # 字符串模式分析
        if pd.api.types.is_string_dtype(series) or pd.api.types.is_object_dtype(series):
            profile.pattern_analysis = self._analyze_string_patterns(series)

        return profile

    def _analyze_string_patterns(self, series: pd.Series) -> Dict:
        """分析字符串模式"""
        non_null = series.dropna().astype(str)
        if len(non_null) == 0:
            return {}

        patterns = {
            'min_length': int(non_null.str.len().min()),
            'max_length': int(non_null.str.len().max()),
            'avg_length': round(non_null.str.len().mean(), 2),
            'contains_digits': round(non_null.str.contains(r'\d', regex=True).mean() * 100, 2),
            'contains_letters': round(non_null.str.contains(r'[a-zA-Z]', regex=True).mean() * 100, 2),
            'contains_special': round(non_null.str.contains(r'[^a-zA-Z0-9\s]', regex=True).mean() * 100, 2),
            'all_uppercase': round(non_null.str.isupper().mean() * 100, 2),
            'all_lowercase': round(non_null.str.islower().mean() * 100, 2)
        }

        # 检测常见模式
        email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        phone_pattern = r'^1[3-9]\d{9}$'
        date_pattern = r'^\d{4}-\d{2}-\d{2}$'

        patterns['looks_like_email'] = round(non_null.str.match(email_pattern, na=False).mean() * 100, 2)
        patterns['looks_like_phone'] = round(non_null.str.match(phone_pattern, na=False).mean() * 100, 2)
        patterns['looks_like_date'] = round(non_null.str.match(date_pattern, na=False).mean() * 100, 2)

        return patterns

    def profile_all(self) -> Dict[str, ColumnProfile]:
        """剖析所有列"""
        for column in self.df.columns:
            self.profile_results[column] = self.profile_column(column)
        return self.profile_results

    def generate_report(self) -> Dict[str, Any]:
        """生成剖析报告"""
        if not self.profile_results:
            self.profile_all()

        report = {
            'generated_at': datetime.now().isoformat(),
            'dataset_info': {
                'total_rows': len(self.df),
                'total_columns': len(self.df.columns),
                'memory_usage_mb': round(self.df.memory_usage(deep=True).sum() / 1024 / 1024, 2)
            },
            'column_types': {
                'numeric': len(self.df.select_dtypes(include=[np.number]).columns),
                'string': len(self.df.select_dtypes(include=['object', 'string']).columns),
                'datetime': len(self.df.select_dtypes(include=['datetime64']).columns),
                'boolean': len(self.df.select_dtypes(include=['bool']).columns)
            },
            'quality_summary': {
                'columns_with_nulls': sum(1 for p in self.profile_results.values() if p.null_count > 0),
                'columns_all_unique': sum(1 for p in self.profile_results.values()
                                         if p.unique_count == p.total_count),
                'columns_single_value': sum(1 for p in self.profile_results.values()
                                           if p.unique_count == 1),
                'avg_null_percentage': round(np.mean([p.null_percentage for p in self.profile_results.values()]), 2)
            },
            'columns': {}
        }

        for col, profile in self.profile_results.items():
            report['columns'][col] = {
                'data_type': profile.data_type,
                'null_percentage': profile.null_percentage,
                'unique_percentage': profile.unique_percentage,
                'min': str(profile.min_value),
                'max': str(profile.max_value),
                'mean': profile.mean_value,
                'top_values': profile.top_values[:5] if profile.top_values else [],
                'patterns': profile.pattern_analysis
            }

        return report

    def detect_anomalies(self) -> List[Dict]:
        """检测数据异常"""
        if not self.profile_results:
            self.profile_all()

        anomalies = []

        for col, profile in self.profile_results.items():
            # 高空值率
            if profile.null_percentage > 50:
                anomalies.append({
                    'column': col,
                    'type': 'high_null_rate',
                    'severity': 'high',
                    'detail': f"空值率 {profile.null_percentage}%"
                })

            # 单一值列
            if profile.unique_count == 1:
                anomalies.append({
                    'column': col,
                    'type': 'single_value',
                    'severity': 'medium',
                    'detail': f"只有一个唯一值: {profile.mode_value}"
                })

            # 全唯一（可能是标识符）
            if profile.unique_percentage == 100 and profile.total_count > 100:
                anomalies.append({
                    'column': col,
                    'type': 'all_unique',
                    'severity': 'info',
                    'detail': "所有值都是唯一的，可能是标识符"
                })

            # 数值异常
            if profile.mean_value is not None and profile.std_value is not None:
                if profile.std_value > 0:
                    z_min = (profile.min_value - profile.mean_value) / profile.std_value
                    z_max = (profile.max_value - profile.mean_value) / profile.std_value

                    if abs(z_min) > 5 or abs(z_max) > 5:
                        anomalies.append({
                            'column': col,
                            'type': 'extreme_values',
                            'severity': 'medium',
                            'detail': f"存在极端值 (min z-score: {z_min:.2f}, max z-score: {z_max:.2f})"
                        })

        return anomalies


# 使用示例
def run_data_profiling():
    """运行数据剖析示例"""
    # 创建示例数据
    df = pd.DataFrame({
        'customer_id': range(1000),
        'email': [f'user{i}@example.com' for i in range(1000)],
        'age': np.random.randint(18, 80, 1000),
        'income': np.random.normal(50000, 15000, 1000),
        'status': np.random.choice(['active', 'inactive'], 1000),
        'created_at': pd.date_range('2023-01-01', periods=1000, freq='H')
    })

    # 添加一些空值和异常
    df.loc[0:50, 'email'] = None
    df.loc[100, 'income'] = 1000000  # 异常值

    profiler = DataProfiler(df)
    report = profiler.generate_report()
    anomalies = profiler.detect_anomalies()

    return report, anomalies
```

### SQL 数据剖析

```sql
-- 数据剖析 SQL 模板

-- 1. 表级别统计
SELECT
    COUNT(*) AS total_rows,
    COUNT(*) FILTER (WHERE ctid = (SELECT MIN(ctid) FROM customers)) AS has_data
FROM customers;

-- 2. 列级别剖析
WITH column_stats AS (
    SELECT
        'email' AS column_name,
        COUNT(*) AS total_count,
        COUNT(email) AS non_null_count,
        COUNT(DISTINCT email) AS distinct_count,
        COUNT(*) - COUNT(email) AS null_count,
        ROUND((COUNT(*) - COUNT(email))::DECIMAL / COUNT(*) * 100, 2) AS null_percentage,
        ROUND(COUNT(DISTINCT email)::DECIMAL / COUNT(*) * 100, 2) AS distinct_percentage,
        MIN(LENGTH(email)) AS min_length,
        MAX(LENGTH(email)) AS max_length,
        AVG(LENGTH(email)) AS avg_length
    FROM customers
)
SELECT * FROM column_stats;

-- 3. 数值型列统计
SELECT
    'age' AS column_name,
    COUNT(*) AS total_count,
    COUNT(age) AS non_null_count,
    MIN(age) AS min_value,
    MAX(age) AS max_value,
    AVG(age) AS mean_value,
    STDDEV(age) AS std_value,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY age) AS median_value,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY age) AS q1,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY age) AS q3
FROM customers;

-- 4. 值频率分布
SELECT
    status,
    COUNT(*) AS count,
    ROUND(COUNT(*)::DECIMAL / SUM(COUNT(*)) OVER () * 100, 2) AS percentage
FROM customers
GROUP BY status
ORDER BY count DESC;

-- 5. 日期范围分析
SELECT
    'order_date' AS column_name,
    MIN(order_date) AS min_date,
    MAX(order_date) AS max_date,
    MAX(order_date) - MIN(order_date) AS date_range,
    COUNT(DISTINCT DATE(order_date)) AS distinct_days,
    COUNT(*) / NULLIF(COUNT(DISTINCT DATE(order_date)), 0) AS avg_records_per_day
FROM orders;

-- 6. 模式检测
SELECT
    'email' AS column_name,
    SUM(CASE WHEN email ~ '^[\w\.-]+@[\w\.-]+\.\w+$' THEN 1 ELSE 0 END) AS valid_email_count,
    SUM(CASE WHEN email !~ '^[\w\.-]+@[\w\.-]+\.\w+$' THEN 1 ELSE 0 END) AS invalid_email_count,
    ROUND(SUM(CASE WHEN email ~ '^[\w\.-]+@[\w\.-]+\.\w+$' THEN 1 ELSE 0 END)::DECIMAL / COUNT(*) * 100, 2) AS valid_percentage
FROM customers;

-- 7. 重复记录检测
WITH duplicates AS (
    SELECT
        email,
        COUNT(*) AS duplicate_count
    FROM customers
    GROUP BY email
    HAVING COUNT(*) > 1
)
SELECT
    COUNT(*) AS groups_with_duplicates,
    SUM(duplicate_count) AS total_duplicate_records,
    MAX(duplicate_count) AS max_duplicates_per_value
FROM duplicates;

-- 8. 关联完整性检测
SELECT
    'orders.customer_id' AS foreign_key,
    COUNT(*) AS total_records,
    COUNT(c.customer_id) AS matched_records,
    COUNT(*) - COUNT(c.customer_id) AS orphan_records,
    ROUND((COUNT(*) - COUNT(c.customer_id))::DECIMAL / COUNT(*) * 100, 2) AS orphan_percentage
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id;

-- 9. 综合剖析视图
CREATE OR REPLACE VIEW data_profile_customers AS
SELECT
    'customers' AS table_name,
    col.column_name,
    col.data_type,
    (SELECT COUNT(*) FROM customers) AS total_rows,
    (SELECT COUNT(*) FROM customers WHERE customers.*::text LIKE '%' || col.column_name || '%') AS non_null_estimate
FROM information_schema.columns col
WHERE col.table_name = 'customers';
```

## 异常检测

### 统计异常检测

```python
import pandas as pd
import numpy as np
from scipy import stats
from typing import List, Dict, Tuple
from dataclasses import dataclass

@dataclass
class Anomaly:
    """异常记录"""
    index: int
    column: str
    value: Any
    anomaly_type: str
    score: float
    threshold: float

class StatisticalAnomalyDetector:
    """统计异常检测器"""

    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.anomalies = []

    def detect_zscore_anomalies(self, columns: List[str] = None,
                                 threshold: float = 3.0) -> List[Anomaly]:
        """Z-Score 异常检测"""
        if columns is None:
            columns = self.df.select_dtypes(include=[np.number]).columns.tolist()

        anomalies = []
        for col in columns:
            series = self.df[col].dropna()
            if len(series) < 3:
                continue

            mean = series.mean()
            std = series.std()

            if std == 0:
                continue

            z_scores = np.abs((self.df[col] - mean) / std)

            for idx in self.df.index[z_scores > threshold]:
                if pd.notna(self.df.loc[idx, col]):
                    anomalies.append(Anomaly(
                        index=idx,
                        column=col,
                        value=self.df.loc[idx, col],
                        anomaly_type='zscore',
                        score=float(z_scores.loc[idx]),
                        threshold=threshold
                    ))

        self.anomalies.extend(anomalies)
        return anomalies

    def detect_iqr_anomalies(self, columns: List[str] = None,
                             multiplier: float = 1.5) -> List[Anomaly]:
        """IQR 异常检测"""
        if columns is None:
            columns = self.df.select_dtypes(include=[np.number]).columns.tolist()

        anomalies = []
        for col in columns:
            series = self.df[col].dropna()
            if len(series) < 4:
                continue

            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1

            lower_bound = q1 - multiplier * iqr
            upper_bound = q3 + multiplier * iqr

            mask = (self.df[col] < lower_bound) | (self.df[col] > upper_bound)

            for idx in self.df.index[mask]:
                if pd.notna(self.df.loc[idx, col]):
                    value = self.df.loc[idx, col]
                    # 计算异常程度
                    if value < lower_bound:
                        score = (lower_bound - value) / iqr
                    else:
                        score = (value - upper_bound) / iqr

                    anomalies.append(Anomaly(
                        index=idx,
                        column=col,
                        value=value,
                        anomaly_type='iqr',
                        score=float(score),
                        threshold=multiplier
                    ))

        self.anomalies.extend(anomalies)
        return anomalies

    def detect_isolation_forest(self, columns: List[str] = None,
                                contamination: float = 0.1) -> List[Anomaly]:
        """Isolation Forest 异常检测"""
        from sklearn.ensemble import IsolationForest

        if columns is None:
            columns = self.df.select_dtypes(include=[np.number]).columns.tolist()

        # 准备数据
        data = self.df[columns].dropna()
        if len(data) < 10:
            return []

        # 训练模型
        model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )
        predictions = model.fit_predict(data)
        scores = model.decision_function(data)

        # 提取异常
        anomalies = []
        anomaly_indices = data.index[predictions == -1]

        for idx in anomaly_indices:
            for col in columns:
                anomalies.append(Anomaly(
                    index=idx,
                    column=col,
                    value=self.df.loc[idx, col],
                    anomaly_type='isolation_forest',
                    score=float(-scores[data.index.get_loc(idx)]),
                    threshold=contamination
                ))

        self.anomalies.extend(anomalies)
        return anomalies

    def detect_time_series_anomalies(self, value_column: str,
                                      timestamp_column: str,
                                      window_size: int = 7) -> List[Anomaly]:
        """时间序列异常检测（移动平均方法）"""
        df_sorted = self.df.sort_values(timestamp_column).copy()

        # 计算移动平均和标准差
        df_sorted['ma'] = df_sorted[value_column].rolling(window=window_size).mean()
        df_sorted['mstd'] = df_sorted[value_column].rolling(window=window_size).std()

        # 计算偏离程度
        df_sorted['deviation'] = np.abs(df_sorted[value_column] - df_sorted['ma']) / df_sorted['mstd']

        anomalies = []
        threshold = 3.0

        for idx in df_sorted.index[df_sorted['deviation'] > threshold]:
            if pd.notna(df_sorted.loc[idx, 'deviation']):
                anomalies.append(Anomaly(
                    index=idx,
                    column=value_column,
                    value=df_sorted.loc[idx, value_column],
                    anomaly_type='time_series',
                    score=float(df_sorted.loc[idx, 'deviation']),
                    threshold=threshold
                ))

        self.anomalies.extend(anomalies)
        return anomalies

    def get_anomaly_summary(self) -> Dict:
        """获取异常摘要"""
        summary = {
            'total_anomalies': len(self.anomalies),
            'by_type': {},
            'by_column': {},
            'top_anomalies': []
        }

        for anomaly in self.anomalies:
            # 按类型统计
            if anomaly.anomaly_type not in summary['by_type']:
                summary['by_type'][anomaly.anomaly_type] = 0
            summary['by_type'][anomaly.anomaly_type] += 1

            # 按列统计
            if anomaly.column not in summary['by_column']:
                summary['by_column'][anomaly.column] = 0
            summary['by_column'][anomaly.column] += 1

        # 获取最严重的异常
        sorted_anomalies = sorted(self.anomalies, key=lambda x: x.score, reverse=True)
        summary['top_anomalies'] = [
            {
                'index': a.index,
                'column': a.column,
                'value': a.value,
                'type': a.anomaly_type,
                'score': round(a.score, 4)
            }
            for a in sorted_anomalies[:10]
        ]

        return summary


# 使用示例
def run_anomaly_detection():
    """运行异常检测示例"""
    # 创建示例数据
    np.random.seed(42)
    n = 1000

    df = pd.DataFrame({
        'sales': np.random.normal(1000, 200, n),
        'quantity': np.random.poisson(50, n),
        'timestamp': pd.date_range('2024-01-01', periods=n, freq='H')
    })

    # 注入异常
    df.loc[100, 'sales'] = 5000  # 极端高值
    df.loc[200, 'sales'] = -100  # 负值
    df.loc[300, 'quantity'] = 500  # 极端高值

    detector = StatisticalAnomalyDetector(df)

    # 运行各种检测
    detector.detect_zscore_anomalies(['sales', 'quantity'])
    detector.detect_iqr_anomalies(['sales', 'quantity'])
    detector.detect_time_series_anomalies('sales', 'timestamp')

    return detector.get_anomaly_summary()
```

### SQL 异常检测

```sql
-- SQL 异常检测查询

-- 1. Z-Score 异常检测
WITH stats AS (
    SELECT
        AVG(sales_amount) AS mean_val,
        STDDEV(sales_amount) AS std_val
    FROM fact_sales
),
z_scores AS (
    SELECT
        s.*,
        (s.sales_amount - stats.mean_val) / NULLIF(stats.std_val, 0) AS z_score
    FROM fact_sales s
    CROSS JOIN stats
)
SELECT *
FROM z_scores
WHERE ABS(z_score) > 3
ORDER BY ABS(z_score) DESC;

-- 2. IQR 异常检测
WITH quartiles AS (
    SELECT
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY sales_amount) AS q1,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY sales_amount) AS q3
    FROM fact_sales
),
bounds AS (
    SELECT
        q1 - 1.5 * (q3 - q1) AS lower_bound,
        q3 + 1.5 * (q3 - q1) AS upper_bound
    FROM quartiles
)
SELECT s.*
FROM fact_sales s
CROSS JOIN bounds b
WHERE s.sales_amount < b.lower_bound OR s.sales_amount > b.upper_bound;

-- 3. 移动平均异常检测
WITH moving_stats AS (
    SELECT
        order_date,
        sales_amount,
        AVG(sales_amount) OVER (
            ORDER BY order_date
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) AS moving_avg,
        STDDEV(sales_amount) OVER (
            ORDER BY order_date
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) AS moving_std
    FROM daily_sales
)
SELECT
    order_date,
    sales_amount,
    moving_avg,
    moving_std,
    (sales_amount - moving_avg) / NULLIF(moving_std, 0) AS deviation
FROM moving_stats
WHERE ABS((sales_amount - moving_avg) / NULLIF(moving_std, 0)) > 3;

-- 4. 同比/环比异常检测
WITH period_comparison AS (
    SELECT
        order_date,
        sales_amount,
        LAG(sales_amount, 1) OVER (ORDER BY order_date) AS prev_day,
        LAG(sales_amount, 7) OVER (ORDER BY order_date) AS prev_week,
        LAG(sales_amount, 30) OVER (ORDER BY order_date) AS prev_month
    FROM daily_sales
)
SELECT
    order_date,
    sales_amount,
    ROUND((sales_amount - prev_day) / NULLIF(prev_day, 0) * 100, 2) AS day_change_pct,
    ROUND((sales_amount - prev_week) / NULLIF(prev_week, 0) * 100, 2) AS week_change_pct
FROM period_comparison
WHERE ABS((sales_amount - prev_day) / NULLIF(prev_day, 0)) > 0.5  -- 日环比变化超过50%
   OR ABS((sales_amount - prev_week) / NULLIF(prev_week, 0)) > 0.3;  -- 周同比变化超过30%

-- 5. 频率异常检测
WITH value_frequency AS (
    SELECT
        customer_segment,
        COUNT(*) AS segment_count,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () AS percentage
    FROM customers
    GROUP BY customer_segment
)
SELECT *
FROM value_frequency
WHERE percentage < 1  -- 占比小于1%的罕见值
   OR percentage > 90;  -- 占比超过90%的异常集中

-- 6. 记录数异常检测
WITH daily_counts AS (
    SELECT
        DATE(created_at) AS record_date,
        COUNT(*) AS record_count
    FROM events
    GROUP BY DATE(created_at)
),
count_stats AS (
    SELECT
        AVG(record_count) AS avg_count,
        STDDEV(record_count) AS std_count
    FROM daily_counts
)
SELECT
    dc.record_date,
    dc.record_count,
    cs.avg_count,
    (dc.record_count - cs.avg_count) / NULLIF(cs.std_count, 0) AS z_score
FROM daily_counts dc
CROSS JOIN count_stats cs
WHERE ABS((dc.record_count - cs.avg_count) / NULLIF(cs.std_count, 0)) > 2;
```

## 数据契约（Data Contracts）

### 数据契约概述

数据契约是数据生产者和消费者之间的正式协议，定义了数据的结构、质量标准和服务级别。

```python
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import json
import yaml

class DataType(Enum):
    STRING = "string"
    INTEGER = "integer"
    FLOAT = "float"
    BOOLEAN = "boolean"
    DATE = "date"
    TIMESTAMP = "timestamp"
    ARRAY = "array"
    OBJECT = "object"

@dataclass
class FieldContract:
    """字段契约"""
    name: str
    data_type: DataType
    description: str
    required: bool = True
    unique: bool = False
    pii: bool = False
    nullable: bool = False
    default_value: Optional[str] = None
    constraints: Dict = field(default_factory=dict)
    examples: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)

@dataclass
class QualityContract:
    """质量契约"""
    dimension: str
    metric: str
    threshold: float
    severity: str  # 'critical', 'high', 'medium', 'low'
    description: str

@dataclass
class SLAContract:
    """SLA 契约"""
    metric: str
    target: str
    measurement_window: str
    consequences: str

@dataclass
class DataContract:
    """数据契约"""
    contract_id: str
    name: str
    version: str
    status: str  # 'draft', 'active', 'deprecated'
    description: str

    # 参与方
    owner: str
    producer: str
    consumers: List[str]

    # 数据定义
    dataset_name: str
    schema: List[FieldContract]

    # 质量要求
    quality_requirements: List[QualityContract]

    # SLA
    sla: List[SLAContract]

    # 元数据
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    tags: List[str] = field(default_factory=list)

    def to_yaml(self) -> str:
        """导出为 YAML 格式"""
        contract_dict = {
            'contract_id': self.contract_id,
            'name': self.name,
            'version': self.version,
            'status': self.status,
            'description': self.description,
            'owner': self.owner,
            'producer': self.producer,
            'consumers': self.consumers,
            'dataset': {
                'name': self.dataset_name,
                'schema': [
                    {
                        'name': f.name,
                        'type': f.data_type.value,
                        'description': f.description,
                        'required': f.required,
                        'unique': f.unique,
                        'nullable': f.nullable,
                        'constraints': f.constraints,
                        'pii': f.pii
                    }
                    for f in self.schema
                ]
            },
            'quality': [
                {
                    'dimension': q.dimension,
                    'metric': q.metric,
                    'threshold': q.threshold,
                    'severity': q.severity,
                    'description': q.description
                }
                for q in self.quality_requirements
            ],
            'sla': [
                {
                    'metric': s.metric,
                    'target': s.target,
                    'window': s.measurement_window,
                    'consequences': s.consequences
                }
                for s in self.sla
            ]
        }
        return yaml.dump(contract_dict, allow_unicode=True, default_flow_style=False)

    def validate_schema(self, df) -> Dict:
        """验证数据是否符合契约 Schema"""
        import pandas as pd

        results = {
            'valid': True,
            'errors': [],
            'warnings': []
        }

        # 检查必需字段
        for field_contract in self.schema:
            if field_contract.required and field_contract.name not in df.columns:
                results['valid'] = False
                results['errors'].append(f"缺少必需字段: {field_contract.name}")

        # 检查字段类型
        type_mapping = {
            DataType.STRING: ['object', 'string'],
            DataType.INTEGER: ['int64', 'int32', 'Int64'],
            DataType.FLOAT: ['float64', 'float32'],
            DataType.BOOLEAN: ['bool', 'boolean'],
            DataType.DATE: ['datetime64[ns]'],
            DataType.TIMESTAMP: ['datetime64[ns]']
        }

        for field_contract in self.schema:
            if field_contract.name in df.columns:
                actual_type = str(df[field_contract.name].dtype)
                expected_types = type_mapping.get(field_contract.data_type, [])

                if actual_type not in expected_types:
                    results['warnings'].append(
                        f"字段 {field_contract.name} 类型不匹配: "
                        f"期望 {field_contract.data_type.value}, 实际 {actual_type}"
                    )

                # 检查空值约束
                if not field_contract.nullable and df[field_contract.name].isna().any():
                    results['valid'] = False
                    results['errors'].append(f"字段 {field_contract.name} 存在空值，但契约规定不允许")

                # 检查唯一性约束
                if field_contract.unique and df[field_contract.name].duplicated().any():
                    results['valid'] = False
                    results['errors'].append(f"字段 {field_contract.name} 存在重复值，但契约规定必须唯一")

        return results


def create_customer_contract() -> DataContract:
    """创建客户数据契约示例"""
    contract = DataContract(
        contract_id="contract-customer-v1",
        name="客户主数据契约",
        version="1.0.0",
        status="active",
        description="定义客户主数据的结构、质量标准和SLA",
        owner="数据治理团队",
        producer="CRM系统",
        consumers=["数据仓库", "营销平台", "客服系统"],
        dataset_name="customers",
        schema=[
            FieldContract(
                name="customer_id",
                data_type=DataType.STRING,
                description="客户唯一标识",
                required=True,
                unique=True,
                constraints={"pattern": r"^CUS\d{10}$"}
            ),
            FieldContract(
                name="email",
                data_type=DataType.STRING,
                description="客户邮箱",
                required=True,
                unique=True,
                pii=True,
                constraints={"pattern": r"^[\w\.-]+@[\w\.-]+\.\w+$"}
            ),
            FieldContract(
                name="phone",
                data_type=DataType.STRING,
                description="客户手机号",
                required=False,
                pii=True,
                constraints={"pattern": r"^1[3-9]\d{9}$"}
            ),
            FieldContract(
                name="created_at",
                data_type=DataType.TIMESTAMP,
                description="创建时间",
                required=True
            ),
            FieldContract(
                name="segment",
                data_type=DataType.STRING,
                description="客户分层",
                required=True,
                constraints={"enum": ["VIP", "Gold", "Silver", "Bronze"]}
            )
        ],
        quality_requirements=[
            QualityContract(
                dimension="completeness",
                metric="non_null_rate",
                threshold=0.99,
                severity="critical",
                description="必填字段空值率不超过1%"
            ),
            QualityContract(
                dimension="uniqueness",
                metric="duplicate_rate",
                threshold=0.0,
                severity="critical",
                description="主键不允许重复"
            ),
            QualityContract(
                dimension="validity",
                metric="format_compliance_rate",
                threshold=0.95,
                severity="high",
                description="格式符合率不低于95%"
            ),
            QualityContract(
                dimension="timeliness",
                metric="data_freshness_hours",
                threshold=24,
                severity="high",
                description="数据延迟不超过24小时"
            )
        ],
        sla=[
            SLAContract(
                metric="availability",
                target="99.9%",
                measurement_window="monthly",
                consequences="超过SLA需要提供事故报告"
            ),
            SLAContract(
                metric="data_freshness",
                target="< 1 hour",
                measurement_window="daily",
                consequences="延迟超过1小时触发告警"
            )
        ],
        tags=["master_data", "customer", "pii"]
    )

    return contract
```

### 数据契约 YAML 定义

```yaml
# data_contracts/customer_contract.yaml

contract_id: contract-customer-v1
name: 客户主数据契约
version: "1.0.0"
status: active
description: 定义客户主数据的结构、质量标准和SLA

# 参与方
owner: 数据治理团队
producer: CRM系统
consumers:
  - 数据仓库
  - 营销平台
  - 客服系统

# 数据集定义
dataset:
  name: customers
  format: parquet
  location: s3://data-lake/customers/
  partition_by:
    - created_date

  # Schema 定义
  schema:
    - name: customer_id
      type: string
      description: 客户唯一标识
      required: true
      unique: true
      constraints:
        pattern: "^CUS\\d{10}$"
      examples:
        - "CUS0000000001"

    - name: email
      type: string
      description: 客户邮箱地址
      required: true
      unique: true
      pii: true
      constraints:
        pattern: "^[\\w\\.-]+@[\\w\\.-]+\\.\\w+$"

    - name: customer_name
      type: string
      description: 客户姓名
      required: true
      pii: true
      constraints:
        max_length: 200

    - name: phone
      type: string
      description: 联系电话
      required: false
      pii: true
      constraints:
        pattern: "^1[3-9]\\d{9}$"

    - name: segment
      type: string
      description: 客户分层
      required: true
      constraints:
        enum:
          - VIP
          - Gold
          - Silver
          - Bronze

    - name: registration_date
      type: date
      description: 注册日期
      required: true

    - name: last_activity_date
      type: timestamp
      description: 最后活动时间
      required: false

    - name: lifetime_value
      type: float
      description: 客户生命周期价值
      required: false
      constraints:
        min: 0

# 质量要求
quality:
  - dimension: completeness
    rules:
      - name: required_fields_not_null
        description: 必填字段不为空
        threshold: 0.99
        severity: critical
        columns:
          - customer_id
          - email
          - customer_name
          - segment

  - dimension: uniqueness
    rules:
      - name: primary_key_unique
        description: 主键唯一
        threshold: 1.0
        severity: critical
        columns:
          - customer_id
      - name: email_unique
        description: 邮箱唯一
        threshold: 1.0
        severity: high
        columns:
          - email

  - dimension: validity
    rules:
      - name: email_format
        description: 邮箱格式正确
        threshold: 0.95
        severity: high
      - name: segment_values
        description: 分层值在允许范围内
        threshold: 1.0
        severity: critical

  - dimension: timeliness
    rules:
      - name: data_freshness
        description: 数据新鲜度
        threshold: 24  # hours
        severity: high

# SLA 定义
sla:
  availability:
    target: "99.9%"
    measurement: monthly
    consequences: |
      如果月度可用性低于目标：
      1. 生产方需在24小时内提供事故报告
      2. 制定改进计划
      3. 连续两月未达标需升级处理

  data_freshness:
    target: "1 hour"
    measurement: real-time
    consequences: |
      如果数据延迟超过1小时：
      1. 自动触发告警
      2. 通知相关消费方
      3. 记录SLA违规事件

  data_quality:
    target: "99%"
    measurement: daily
    consequences: |
      如果日度质量得分低于99%：
      1. 自动暂停下游数据同步
      2. 通知数据所有者
      3. 需要人工确认后恢复

# 变更管理
change_management:
  breaking_changes:
    - 删除字段
    - 修改字段类型
    - 修改必填属性
    - 修改唯一性约束
  notification:
    lead_time: 14  # days
    channels:
      - email
      - slack
  approval_required: true

# 元数据
metadata:
  created_at: "2024-01-01"
  updated_at: "2024-01-15"
  tags:
    - master_data
    - customer
    - pii
  documentation_url: https://wiki.company.com/data-contracts/customer
```

## 数据可观测性

### 可观测性架构

```python
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import json

class MetricType(Enum):
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"

class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class DataMetric:
    """数据指标"""
    name: str
    metric_type: MetricType
    value: float
    timestamp: datetime
    dimensions: Dict[str, str] = field(default_factory=dict)
    unit: str = ""

@dataclass
class DataAlert:
    """数据告警"""
    alert_id: str
    name: str
    severity: AlertSeverity
    message: str
    timestamp: datetime
    metric_name: str
    metric_value: float
    threshold: float
    dimensions: Dict[str, str] = field(default_factory=dict)
    resolved: bool = False
    resolved_at: Optional[datetime] = None

class DataObservabilityPlatform:
    """数据可观测性平台"""

    def __init__(self):
        self.metrics: List[DataMetric] = []
        self.alerts: List[DataAlert] = []
        self.alert_rules: Dict[str, Dict] = {}
        self.subscribers: List[callable] = []

    def record_metric(self, metric: DataMetric):
        """记录指标"""
        self.metrics.append(metric)
        self._evaluate_alert_rules(metric)

    def add_alert_rule(self, rule_name: str, rule_config: Dict):
        """添加告警规则"""
        self.alert_rules[rule_name] = rule_config

    def _evaluate_alert_rules(self, metric: DataMetric):
        """评估告警规则"""
        for rule_name, rule in self.alert_rules.items():
            if rule['metric_name'] != metric.name:
                continue

            triggered = False
            if rule['operator'] == 'gt' and metric.value > rule['threshold']:
                triggered = True
            elif rule['operator'] == 'lt' and metric.value < rule['threshold']:
                triggered = True
            elif rule['operator'] == 'eq' and metric.value == rule['threshold']:
                triggered = True

            if triggered:
                alert = DataAlert(
                    alert_id=f"{rule_name}-{datetime.now().timestamp()}",
                    name=rule_name,
                    severity=AlertSeverity(rule['severity']),
                    message=rule['message'].format(
                        value=metric.value,
                        threshold=rule['threshold']
                    ),
                    timestamp=datetime.now(),
                    metric_name=metric.name,
                    metric_value=metric.value,
                    threshold=rule['threshold'],
                    dimensions=metric.dimensions
                )
                self.alerts.append(alert)
                self._notify_subscribers(alert)

    def _notify_subscribers(self, alert: DataAlert):
        """通知订阅者"""
        for subscriber in self.subscribers:
            try:
                subscriber(alert)
            except Exception as e:
                print(f"通知订阅者失败: {e}")

    def subscribe(self, callback: callable):
        """订阅告警"""
        self.subscribers.append(callback)

    def get_metrics_summary(self, metric_name: str,
                            time_window: timedelta = timedelta(hours=1)) -> Dict:
        """获取指标摘要"""
        cutoff_time = datetime.now() - time_window
        relevant_metrics = [
            m for m in self.metrics
            if m.name == metric_name and m.timestamp > cutoff_time
        ]

        if not relevant_metrics:
            return {'status': 'no_data'}

        values = [m.value for m in relevant_metrics]

        return {
            'metric_name': metric_name,
            'time_window': str(time_window),
            'count': len(values),
            'min': min(values),
            'max': max(values),
            'avg': sum(values) / len(values),
            'latest': relevant_metrics[-1].value,
            'latest_timestamp': relevant_metrics[-1].timestamp.isoformat()
        }

    def get_active_alerts(self) -> List[DataAlert]:
        """获取活跃告警"""
        return [a for a in self.alerts if not a.resolved]

    def resolve_alert(self, alert_id: str):
        """解决告警"""
        for alert in self.alerts:
            if alert.alert_id == alert_id:
                alert.resolved = True
                alert.resolved_at = datetime.now()
                break


class DataQualityMonitor:
    """数据质量监控器"""

    def __init__(self, observability: DataObservabilityPlatform):
        self.observability = observability
        self._setup_alert_rules()

    def _setup_alert_rules(self):
        """设置告警规则"""
        rules = {
            'high_null_rate': {
                'metric_name': 'null_rate',
                'operator': 'gt',
                'threshold': 0.05,
                'severity': 'warning',
                'message': '空值率 {value:.2%} 超过阈值 {threshold:.2%}'
            },
            'duplicate_detected': {
                'metric_name': 'duplicate_rate',
                'operator': 'gt',
                'threshold': 0,
                'severity': 'error',
                'message': '检测到重复数据，重复率: {value:.2%}'
            },
            'data_freshness_alert': {
                'metric_name': 'data_age_hours',
                'operator': 'gt',
                'threshold': 24,
                'severity': 'critical',
                'message': '数据延迟 {value:.1f} 小时，超过阈值 {threshold} 小时'
            },
            'low_quality_score': {
                'metric_name': 'quality_score',
                'operator': 'lt',
                'threshold': 0.95,
                'severity': 'warning',
                'message': '数据质量得分 {value:.2%} 低于阈值 {threshold:.2%}'
            },
            'record_count_anomaly': {
                'metric_name': 'record_count_change_pct',
                'operator': 'gt',
                'threshold': 50,
                'severity': 'warning',
                'message': '记录数变化 {value:.1f}% 异常'
            }
        }

        for rule_name, rule_config in rules.items():
            self.observability.add_alert_rule(rule_name, rule_config)

    def monitor_table(self, table_name: str, stats: Dict):
        """监控表质量"""
        timestamp = datetime.now()
        dimensions = {'table': table_name}

        # 记录各项指标
        metrics = [
            DataMetric(
                name='null_rate',
                metric_type=MetricType.GAUGE,
                value=stats.get('null_rate', 0),
                timestamp=timestamp,
                dimensions=dimensions,
                unit='percentage'
            ),
            DataMetric(
                name='duplicate_rate',
                metric_type=MetricType.GAUGE,
                value=stats.get('duplicate_rate', 0),
                timestamp=timestamp,
                dimensions=dimensions,
                unit='percentage'
            ),
            DataMetric(
                name='data_age_hours',
                metric_type=MetricType.GAUGE,
                value=stats.get('data_age_hours', 0),
                timestamp=timestamp,
                dimensions=dimensions,
                unit='hours'
            ),
            DataMetric(
                name='quality_score',
                metric_type=MetricType.GAUGE,
                value=stats.get('quality_score', 1),
                timestamp=timestamp,
                dimensions=dimensions,
                unit='score'
            ),
            DataMetric(
                name='record_count',
                metric_type=MetricType.GAUGE,
                value=stats.get('record_count', 0),
                timestamp=timestamp,
                dimensions=dimensions,
                unit='records'
            )
        ]

        for metric in metrics:
            self.observability.record_metric(metric)

    def get_dashboard_data(self, tables: List[str]) -> Dict:
        """获取仪表板数据"""
        dashboard = {
            'generated_at': datetime.now().isoformat(),
            'tables': {},
            'active_alerts': [],
            'summary': {
                'total_tables': len(tables),
                'healthy_tables': 0,
                'warning_tables': 0,
                'critical_tables': 0
            }
        }

        for table in tables:
            quality_summary = self.observability.get_metrics_summary(
                'quality_score',
                time_window=timedelta(hours=24)
            )

            if quality_summary.get('latest', 1) >= 0.99:
                dashboard['summary']['healthy_tables'] += 1
                status = 'healthy'
            elif quality_summary.get('latest', 1) >= 0.95:
                dashboard['summary']['warning_tables'] += 1
                status = 'warning'
            else:
                dashboard['summary']['critical_tables'] += 1
                status = 'critical'

            dashboard['tables'][table] = {
                'status': status,
                'quality_score': quality_summary.get('latest', None),
                'metrics': quality_summary
            }

        dashboard['active_alerts'] = [
            {
                'alert_id': a.alert_id,
                'name': a.name,
                'severity': a.severity.value,
                'message': a.message,
                'timestamp': a.timestamp.isoformat()
            }
            for a in self.observability.get_active_alerts()
        ]

        return dashboard


# 使用示例
def setup_data_observability():
    """设置数据可观测性"""
    platform = DataObservabilityPlatform()
    monitor = DataQualityMonitor(platform)

    # 添加告警订阅
    def alert_handler(alert: DataAlert):
        print(f"[{alert.severity.value.upper()}] {alert.name}: {alert.message}")

    platform.subscribe(alert_handler)

    # 模拟监控
    monitor.monitor_table('customers', {
        'null_rate': 0.02,
        'duplicate_rate': 0,
        'data_age_hours': 2,
        'quality_score': 0.98,
        'record_count': 10000
    })

    # 模拟告警触发
    monitor.monitor_table('orders', {
        'null_rate': 0.08,  # 超过阈值
        'duplicate_rate': 0.01,  # 超过阈值
        'data_age_hours': 30,  # 超过阈值
        'quality_score': 0.85,  # 低于阈值
        'record_count': 50000
    })

    return monitor.get_dashboard_data(['customers', 'orders'])
```

### 监控仪表板 SQL

```sql
-- 数据可观测性监控查询

-- 1. 表级别健康度仪表板
CREATE OR REPLACE VIEW data_health_dashboard AS
WITH table_stats AS (
    SELECT
        table_name,
        -- 完整性指标
        1 - (null_count::DECIMAL / NULLIF(total_count, 0)) AS completeness_score,
        -- 唯一性指标
        1 - (duplicate_count::DECIMAL / NULLIF(total_count, 0)) AS uniqueness_score,
        -- 及时性指标（基于数据延迟小时数）
        CASE
            WHEN data_age_hours <= 1 THEN 1.0
            WHEN data_age_hours <= 24 THEN 0.8
            ELSE 0.5
        END AS timeliness_score,
        -- 有效性指标
        valid_count::DECIMAL / NULLIF(total_count, 0) AS validity_score,
        total_count,
        last_updated
    FROM data_quality_metrics
    WHERE metric_date = CURRENT_DATE
),
weighted_scores AS (
    SELECT
        table_name,
        completeness_score,
        uniqueness_score,
        timeliness_score,
        validity_score,
        -- 加权综合得分
        (completeness_score * 0.3 +
         uniqueness_score * 0.25 +
         timeliness_score * 0.25 +
         validity_score * 0.2) AS overall_score,
        total_count,
        last_updated
    FROM table_stats
)
SELECT
    table_name,
    ROUND(completeness_score * 100, 2) AS completeness_pct,
    ROUND(uniqueness_score * 100, 2) AS uniqueness_pct,
    ROUND(timeliness_score * 100, 2) AS timeliness_pct,
    ROUND(validity_score * 100, 2) AS validity_pct,
    ROUND(overall_score * 100, 2) AS overall_score_pct,
    CASE
        WHEN overall_score >= 0.99 THEN 'HEALTHY'
        WHEN overall_score >= 0.95 THEN 'WARNING'
        ELSE 'CRITICAL'
    END AS health_status,
    total_count,
    last_updated
FROM weighted_scores
ORDER BY overall_score ASC;

-- 2. 数据新鲜度监控
CREATE OR REPLACE VIEW data_freshness_monitor AS
SELECT
    table_name,
    MAX(updated_at) AS latest_record,
    NOW() - MAX(updated_at) AS data_age,
    EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) / 3600 AS age_hours,
    CASE
        WHEN NOW() - MAX(updated_at) <= INTERVAL '1 hour' THEN 'FRESH'
        WHEN NOW() - MAX(updated_at) <= INTERVAL '24 hours' THEN 'ACCEPTABLE'
        ELSE 'STALE'
    END AS freshness_status
FROM (
    SELECT 'customers' AS table_name, MAX(updated_at) AS updated_at FROM customers
    UNION ALL
    SELECT 'orders' AS table_name, MAX(updated_at) AS updated_at FROM orders
    UNION ALL
    SELECT 'products' AS table_name, MAX(updated_at) AS updated_at FROM products
) t
GROUP BY table_name;

-- 3. 质量趋势分析
CREATE OR REPLACE VIEW quality_trend_analysis AS
WITH daily_scores AS (
    SELECT
        metric_date,
        table_name,
        AVG(quality_score) AS avg_score
    FROM data_quality_metrics
    WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY metric_date, table_name
)
SELECT
    table_name,
    metric_date,
    avg_score,
    LAG(avg_score) OVER (PARTITION BY table_name ORDER BY metric_date) AS prev_score,
    avg_score - LAG(avg_score) OVER (PARTITION BY table_name ORDER BY metric_date) AS score_change,
    AVG(avg_score) OVER (
        PARTITION BY table_name
        ORDER BY metric_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7d
FROM daily_scores
ORDER BY table_name, metric_date;

-- 4. 告警历史查询
CREATE OR REPLACE VIEW alert_history AS
SELECT
    alert_id,
    alert_name,
    severity,
    table_name,
    metric_name,
    metric_value,
    threshold_value,
    alert_message,
    triggered_at,
    resolved_at,
    CASE
        WHEN resolved_at IS NOT NULL THEN resolved_at - triggered_at
        ELSE NOW() - triggered_at
    END AS duration,
    CASE
        WHEN resolved_at IS NOT NULL THEN 'RESOLVED'
        ELSE 'ACTIVE'
    END AS status
FROM data_quality_alerts
ORDER BY triggered_at DESC;

-- 5. 每日质量报告
CREATE OR REPLACE VIEW daily_quality_report AS
SELECT
    CURRENT_DATE AS report_date,
    COUNT(DISTINCT table_name) AS tables_monitored,
    SUM(CASE WHEN health_status = 'HEALTHY' THEN 1 ELSE 0 END) AS healthy_count,
    SUM(CASE WHEN health_status = 'WARNING' THEN 1 ELSE 0 END) AS warning_count,
    SUM(CASE WHEN health_status = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_count,
    ROUND(AVG(overall_score_pct), 2) AS avg_quality_score,
    (SELECT COUNT(*) FROM data_quality_alerts
     WHERE triggered_at >= CURRENT_DATE AND resolved_at IS NULL) AS active_alerts,
    (SELECT COUNT(*) FROM data_quality_alerts
     WHERE triggered_at >= CURRENT_DATE) AS total_alerts_today
FROM data_health_dashboard;

-- 6. 异常检测告警
INSERT INTO data_quality_alerts (alert_name, severity, table_name, metric_name,
                                  metric_value, threshold_value, alert_message, triggered_at)
SELECT
    'record_count_anomaly' AS alert_name,
    'WARNING' AS severity,
    table_name,
    'record_count' AS metric_name,
    today_count AS metric_value,
    avg_count AS threshold_value,
    FORMAT('表 %s 记录数异常: 今日 %s 条，历史平均 %s 条，变化 %s%%',
           table_name, today_count, ROUND(avg_count), ROUND(change_pct)) AS alert_message,
    NOW() AS triggered_at
FROM (
    SELECT
        t.table_name,
        t.record_count AS today_count,
        h.avg_count,
        ((t.record_count - h.avg_count) / NULLIF(h.avg_count, 0) * 100) AS change_pct
    FROM (
        SELECT table_name, SUM(record_count) AS record_count
        FROM data_quality_metrics
        WHERE metric_date = CURRENT_DATE
        GROUP BY table_name
    ) t
    JOIN (
        SELECT table_name, AVG(record_count) AS avg_count
        FROM data_quality_metrics
        WHERE metric_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE - INTERVAL '1 day'
        GROUP BY table_name
    ) h ON t.table_name = h.table_name
) stats
WHERE ABS(change_pct) > 50;
```

## 最佳实践

### 数据质量治理框架

```python
# 企业级数据质量治理框架
from dataclasses import dataclass
from typing import List, Dict
from enum import Enum

class GovernanceLevel(Enum):
    STRATEGIC = "战略层"
    TACTICAL = "战术层"
    OPERATIONAL = "操作层"

@dataclass
class DQGovernanceFramework:
    """数据质量治理框架"""

    # 战略层
    strategic_components = {
        'vision': '建立数据驱动的组织文化，确保数据资产价值最大化',
        'objectives': [
            '提升数据可信度至 99%+',
            '降低数据相关故障 50%',
            '实现数据质量自动化监控 100%',
            '建立端到端数据血缘追踪'
        ],
        'governance_structure': {
            '数据治理委员会': '制定政策、解决争议、资源分配',
            '数据质量团队': '标准制定、工具建设、培训支持',
            '数据管家': '日常监督、问题处理、质量报告'
        }
    }

    # 战术层
    tactical_components = {
        'standards': [
            '数据质量评估标准',
            '数据分类分级标准',
            '数据生命周期管理标准',
            '数据质量规则命名规范'
        ],
        'processes': [
            '数据质量评估流程',
            '数据问题处理流程',
            '数据质量改进流程',
            '数据契约管理流程'
        ],
        'metrics': {
            '完整性指标': '空值率、记录完整率',
            '准确性指标': '错误率、一致性率',
            '及时性指标': '数据延迟、更新频率',
            '可用性指标': '系统可用率、查询响应时间'
        }
    }

    # 操作层
    operational_components = {
        'tools': [
            'Great Expectations - 数据验证',
            'dbt - 数据测试',
            'Apache Atlas - 元数据管理',
            'DataHub - 数据发现',
            '自建监控平台 - 可观测性'
        ],
        'daily_activities': [
            '监控质量仪表板',
            '处理质量告警',
            '执行质量规则',
            '更新质量文档',
            '参与质量评审'
        ],
        'automation': [
            'CI/CD 集成质量检查',
            '自动化异常检测',
            '自动化数据剖析',
            '自动化报告生成'
        ]
    }


def create_dq_implementation_roadmap() -> List[Dict]:
    """创建数据质量实施路线图"""
    roadmap = [
        {
            'phase': '第一阶段：基础建设',
            'duration': '1-3 个月',
            'objectives': [
                '建立数据质量标准',
                '识别关键数据资产',
                '部署基础监控工具'
            ],
            'deliverables': [
                '数据质量标准文档',
                '关键数据资产清单',
                '基础质量仪表板'
            ]
        },
        {
            'phase': '第二阶段：规则实施',
            'duration': '3-6 个月',
            'objectives': [
                '实施质量规则',
                '建立告警机制',
                '培训数据管家'
            ],
            'deliverables': [
                '质量规则库',
                '告警配置',
                '培训材料'
            ]
        },
        {
            'phase': '第三阶段：流程优化',
            'duration': '6-9 个月',
            'objectives': [
                '优化质量流程',
                '集成 CI/CD',
                '建立数据契约'
            ],
            'deliverables': [
                '优化后的流程文档',
                'CI/CD 集成方案',
                '数据契约模板'
            ]
        },
        {
            'phase': '第四阶段：持续改进',
            'duration': '持续',
            'objectives': [
                '高级分析能力',
                'AI 驱动的异常检测',
                '全面自动化'
            ],
            'deliverables': [
                '高级分析报告',
                'ML 异常检测模型',
                '自动化运维体系'
            ]
        }
    ]
    return roadmap
```

### 质量规则设计原则

```yaml
# 数据质量规则设计最佳实践

principles:
  - name: 业务驱动
    description: 质量规则应该从业务需求出发，而非技术角度
    examples:
      - good: "客户邮箱必须唯一，因为这是登录凭证"
      - bad: "email 字段添加 unique 约束"

  - name: 可衡量性
    description: 每个规则必须有明确的衡量指标和阈值
    examples:
      - good: "空值率不超过 1%，当前值 0.5%"
      - bad: "数据应该尽量完整"

  - name: 可操作性
    description: 规则触发后应有明确的处理流程
    examples:
      - good: "空值率超标 -> 通知数据管家 -> 24小时内修复"
      - bad: "空值率超标 -> 系统告警"

  - name: 分级管理
    description: 根据影响程度对规则分级，差异化处理
    levels:
      - critical: "阻断流程，立即处理"
      - high: "告警通知，当日处理"
      - medium: "记录日志，计划处理"
      - low: "周期统计，持续优化"

  - name: 渐进式实施
    description: 先监控后强制，避免一次性阻断所有问题
    steps:
      - "第一周：监控模式，收集数据"
      - "第二周：警告模式，通知但不阻断"
      - "第三周：强制模式，阻断不合规数据"

rule_categories:
  schema_rules:
    - 字段存在性检查
    - 字段类型检查
    - 字段长度检查

  business_rules:
    - 值域范围检查
    - 格式合规检查
    - 计算逻辑验证
    - 状态机验证

  cross_reference_rules:
    - 参照完整性
    - 跨表一致性
    - 跨系统一致性

  temporal_rules:
    - 数据新鲜度
    - 时间序列连续性
    - 历史数据一致性

  statistical_rules:
    - 记录数波动
    - 统计分布异常
    - 趋势异常检测
```

## 面试要点

### 核心概念题

**Q1: 数据质量的六个维度是什么？各自如何度量？**

```text
答案要点：

1. 完整性（Completeness）
   - 定义：数据是否完整，有无缺失
   - 度量：空值率、记录完整率
   - 公式：完整性 = 非空值数 / 总记录数

2. 准确性（Accuracy）
   - 定义：数据是否正确反映现实
   - 度量：错误率、与源系统一致率
   - 方法：交叉验证、人工抽检

3. 一致性（Consistency）
   - 定义：相同数据在不同地方是否一致
   - 度量：跨系统一致率、参照完整性
   - 方法：跨源对比、关联检查

4. 及时性（Timeliness）
   - 定义：数据是否在需要时可用
   - 度量：数据延迟、更新频率
   - 方法：时间戳监控、SLA 追踪

5. 唯一性（Uniqueness）
   - 定义：数据是否有重复
   - 度量：重复率、主键唯一率
   - 方法：主键检测、模糊匹配去重

6. 有效性（Validity）
   - 定义：数据是否符合定义的规则
   - 度量：格式符合率、范围符合率
   - 方法：正则匹配、范围检查
```

**Q2: 什么是数据契约？它包含哪些内容？**

```text
答案要点：

数据契约是数据生产者和消费者之间的正式协议，主要包含：

1. 参与方定义
   - 数据所有者
   - 数据生产者
   - 数据消费者

2. 数据定义
   - Schema 结构
   - 字段类型和约束
   - 数据格式

3. 质量要求
   - 各维度质量阈值
   - 检测规则
   - 违规处理

4. SLA 定义
   - 可用性目标
   - 延迟目标
   - 违规后果

5. 变更管理
   - 通知机制
   - 审批流程
   - 版本控制

数据契约的价值：
- 明确责任边界
- 减少沟通成本
- 保障数据质量
- 支持自动化验证
```

**Q3: Great Expectations 和 dbt 测试有什么区别？如何选择？**

```text
答案要点：

Great Expectations：
- 独立的数据质量框架
- 支持多种数据源
- 丰富的内置期望
- 自动生成数据文档
- 适合：独立数据质量项目、多源数据验证

dbt 测试：
- 与 dbt 深度集成
- 基于 SQL 的测试
- 集成到数据转换流程
- 支持自定义测试
- 适合：数据仓库项目、ETL 流程验证

选择建议：
1. 使用 dbt 做数据转换 -> 优先用 dbt 测试
2. 需要跨多数据源验证 -> 使用 Great Expectations
3. 追求数据文档化 -> Great Expectations 更强
4. 需要简单快速 -> dbt 测试更轻量
5. 两者可以互补使用
```

### 实践设计题

**Q4: 设计一个数据质量监控方案**

```text
答案要点：

1. 监控架构
   - 采集层：定时任务采集质量指标
   - 存储层：时序数据库存储指标
   - 计算层：规则引擎评估
   - 展示层：仪表板和告警

2. 监控指标
   - 表级别：记录数、数据延迟、整体质量分
   - 列级别：空值率、唯一率、格式符合率
   - 业务级别：关键业务规则符合率

3. 告警策略
   - 分级告警：Critical/High/Medium/Low
   - 告警渠道：邮件/Slack/PagerDuty
   - 告警聚合：避免告警风暴

4. 仪表板设计
   - 全局概览：健康度热力图
   - 趋势分析：质量得分趋势
   - 下钻能力：问题定位

5. 自动化
   - CI/CD 集成
   - 异常自动诊断
   - 修复建议生成
```

### 总结

数据质量管理是数据治理的核心，关键要点：

1. **维度理解**：掌握六大质量维度的定义和度量方法
2. **工具使用**：熟练使用 Great Expectations、dbt 等工具
3. **数据剖析**：理解数据剖析的方法和应用场景
4. **异常检测**：掌握统计异常检测的基本方法
5. **数据契约**：理解数据契约的价值和设计方法
6. **可观测性**：建立完善的数据可观测性体系
7. **治理框架**：构建企业级数据质量治理框架

高质量的数据是数据驱动决策的基础，值得投入资源持续建设和优化。
