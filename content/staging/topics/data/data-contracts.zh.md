---
title: 数据契约设计
description: 数据契约全面指南 - 数据生产者与消费者之间数据交换的正式协议
track: data
section: data-engineering
difficulty: intermediate
tags:
  - Data Contracts
  - Data Quality
  - Schema
  - Data Mesh
  - Data Governance
status: imported
origin: old/src/content/docs/data/data-contracts.zh.md
divergence: 0.224
issues: []
legacy:
  category: Data
  subcategory: Data Engineering
  order: 24
  lastUpdated: 2026-01-20
---

数据契约是定义数据生产者与消费者之间数据交换结构、语义和质量期望的正式协议。随着组织采用数据网格架构和去中心化数据所有权，数据契约已成为确保跨组织边界可靠、可信数据流的关键。本指南涵盖了有效设计、实施和管理数据契约所需的全部知识。

## 理解数据契约

### 什么是数据契约？

数据契约是在数据生产者（创建数据的团队或系统）和数据消费者（使用数据的团队或系统）之间建立协议的正式规范。与仅定义结构的简单模式不同，数据契约涵盖了数据交付的完整期望集。

**数据契约的关键组成部分：**

| 组成部分 | 描述 | 示例 |
|----------|------|------|
| 模式（Schema） | 结构和数据类型 | 字段名、类型、是否可为空 |
| 语义（Semantics） | 字段的业务含义 | "revenue"表示以美元计的总收入 |
| 质量规则 | 数据质量期望 | 完整性 > 99%，无重复 |
| SLA | 服务级别协议 | 新鲜度 < 1小时，可用性 99.9% |
| 所有权 | 责任方 | 团队联系方式、升级路径 |
| 版本控制 | 变更管理规则 | 语义化版本、弃用策略 |

### 为什么数据契约重要

**没有数据契约的问题：**

```
生产者团队                         消费者团队
     │                                │
     │  修改模式                      │
     ├──────────────────────────────►│
     │                                │  管道中断！
     │                                │  报表数据错误！
     │  没有通知                      │  数据信任度下降
     │                                │
```

**有数据契约时：**

```
生产者团队                    契约                        消费者团队
     │                        │                              │
     │  提议变更              │                              │
     ├───────────────────────►│                              │
     │                        │  根据规则验证                │
     │                        │  通知消费者                  │
     │                        ├─────────────────────────────►│
     │                        │                              │  评估影响
     │                        │◄─────────────────────────────┤
     │  实施变更              │  收到批准                    │
     │                        │                              │
```

### 数据契约 vs 模式

许多团队将数据契约与模式混淆。虽然相关，但它们服务于不同目的：

| 方面 | 模式 | 数据契约 |
|------|------|----------|
| **范围** | 仅技术结构 | 结构 + 语义 + SLA + 治理 |
| **关注点** | "数据是什么形状？" | "我可以对这些数据有什么期望？" |
| **所有权** | 通常隐式 | 明确定义 |
| **版本控制** | 通常是模式注册表 | 契约生命周期管理 |
| **质量** | 未涉及 | 核心组成部分 |
| **SLA** | 不包含 | 明确定义 |
| **消费者** | 未知或隐式 | 注册并追踪 |

**模式示例（Avro）：**

```json
{
  "type": "record",
  "name": "Order",
  "fields": [
    {"name": "order_id", "type": "string"},
    {"name": "amount", "type": "double"},
    {"name": "status", "type": "string"}
  ]
}
```

**数据契约示例：**

```yaml
dataContractSpecification: 0.9.3
id: orders-contract
info:
  title: 订单数据契约
  version: 1.0.0
  owner: order-processing-team
  contact:
    email: orders-team@company.com
    slack: "#orders-data"

schema:
  type: object
  properties:
    order_id:
      type: string
      description: 订单的唯一标识符（UUID v4）
      pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
    amount:
      type: number
      description: 订单总金额（美元，税前总额）
      minimum: 0
    status:
      type: string
      description: 当前订单状态
      enum: [pending, confirmed, shipped, delivered, cancelled]

quality:
  - type: completeness
    column: order_id
    mustBe: 100
  - type: uniqueness
    column: order_id
    mustBe: 100
  - type: freshness
    maxDelay: PT1H

sla:
  availability: 99.9%
  latency: P0DT1H
  support: business-hours
```

## 数据契约设计的核心原则

### 契约优先方法

在实施数据管道之前设计契约，而不是之后。这种方法确保：

1. **生产者和消费者预先对齐**期望
2. **在破坏性变更发生之前识别**它们
3. **文档是内置的**，而不是事后添加
4. **质量期望从第一天就是明确的**

```yaml
# 第一步：首先定义契约
dataContractSpecification: 0.9.3
id: customer-events-v1
info:
  title: 客户事件流
  version: 1.0.0
  status: draft  # 以草稿状态开始
  owner: customer-platform-team

# 第二步：与消费者审核
consumers:
  - team: marketing-analytics
    usage: 客户细分
    contactedOn: 2024-01-15
    approved: true
  - team: fraud-detection
    usage: 实时欺诈评分
    contactedOn: 2024-01-16
    approved: pending

# 第三步：批准后实施
```

### 语义清晰性

每个字段都应该有明确的业务含义：

```yaml
schema:
  type: object
  properties:
    revenue:
      type: number
      description: |
        交易的总收入（美元）。
        - 包含：基础价格、运费、税费
        - 不包含：折扣、退款
        - 货币：始终为美元（交易时转换）
        - 精度：2位小数
      examples:
        - 99.99
        - 1234.56

    created_at:
      type: string
      format: date-time
      description: |
        记录创建的时间戳。
        - 时区：UTC（ISO 8601格式）
        - 精度：毫秒
        - 来源：应用服务器时钟
      examples:
        - "2024-01-15T10:30:00.000Z"
```

### 版本控制策略

使用语义化版本控制，并有明确的变更规则：

```yaml
versioning:
  strategy: semantic  # MAJOR.MINOR.PATCH

  rules:
    major:  # 破坏性变更
      - 删除字段
      - 更改字段类型
      - 更改字段语义
      - 删除枚举值

    minor:  # 向后兼容的添加
      - 添加可选字段
      - 添加枚举值
      - 放宽约束

    patch:  # 无模式变更
      - 文档更新
      - 验证中的错误修复

  deprecation:
    noticePeroid: 90d
    sunsetPeriod: 180d
    communicationChannels:
      - email
      - slack
      - changelog
```

## 数据契约规范格式

### 基于YAML的契约（数据契约规范）

[数据契约规范](https://datacontract.com)是定义数据契约的开放标准：

```yaml
dataContractSpecification: 0.9.3
id: sales-transactions
info:
  title: 销售交易
  version: 2.1.0
  description: |
    包含电商平台的所有已完成销售交易。
    近实时更新（< 5分钟延迟）。
  owner: sales-platform-team
  contact:
    name: 销售平台团队
    email: sales-platform@company.com
    url: https://wiki.company.com/sales-platform

servers:
  production:
    type: kafka
    topic: sales.transactions.v2
    broker: kafka.company.com:9092
    format: avro
    schemaRegistryUrl: https://schema-registry.company.com

  analytics:
    type: bigquery
    project: analytics-prod
    dataset: sales
    table: transactions

models:
  SalesTransaction:
    description: 一笔已完成的销售交易
    type: object
    fields:
      transaction_id:
        type: string
        format: uuid
        description: 交易的唯一标识符
        required: true
        unique: true
        pii: false

      customer_id:
        type: string
        description: 客户标识符
        required: true
        pii: true
        classification: confidential

      amount:
        type: decimal
        precision: 10
        scale: 2
        description: 交易金额（美元）
        required: true
        minimum: 0

      items:
        type: array
        items:
          $ref: "#/definitions/LineItem"
        minItems: 1

      transaction_time:
        type: timestamp
        description: 交易发生时间（UTC）
        required: true

definitions:
  LineItem:
    type: object
    fields:
      sku:
        type: string
        required: true
      quantity:
        type: integer
        minimum: 1
        required: true
      unit_price:
        type: decimal
        precision: 10
        scale: 2
        required: true

quality:
  type: SodaCL
  specification: |
    checks for SalesTransaction:
      - row_count > 0
      - missing_count(transaction_id) = 0
      - duplicate_count(transaction_id) = 0
      - invalid_count(amount) = 0:
          valid min: 0
      - freshness(transaction_time) < 5m

servicelevels:
  availability:
    percentage: 99.9%
  retention:
    period: 2y
    unlimited: false
  latency:
    threshold: 5m
    percentile: p99
  freshness:
    threshold: 5m
  support:
    time: business hours
    responseTime: 4h

terms:
  usage: |
    此数据可用于：
    - 销售分析和报告
    - 客户行为分析
    - 收入预测

    此数据不可用于：
    - 未经同意的直接营销
    - 与第三方共享

  limitations: |
    - 数据是最终一致的
    - 2023-01-01之前的历史数据可能不完整

  billing: 内部计费，每1000条记录$0.01
```

### 带扩展的JSON Schema

对于偏好JSON Schema的团队，通过扩展添加契约元数据：

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://company.com/schemas/order-events/v1",
  "title": "订单事件",
  "description": "订单状态变更时发出的事件",

  "x-data-contract": {
    "version": "1.2.0",
    "owner": {
      "team": "order-service",
      "email": "orders@company.com",
      "slack": "#order-service-support"
    },
    "sla": {
      "availability": "99.95%",
      "maxLatency": "PT30S",
      "freshness": "PT1M"
    },
    "classification": "internal",
    "retentionPeriod": "P2Y"
  },

  "type": "object",
  "required": ["event_id", "event_type", "order_id", "timestamp"],

  "properties": {
    "event_id": {
      "type": "string",
      "format": "uuid",
      "description": "唯一事件标识符",
      "x-pii": false
    },
    "event_type": {
      "type": "string",
      "enum": ["created", "updated", "shipped", "delivered", "cancelled"],
      "description": "订单事件类型"
    },
    "order_id": {
      "type": "string",
      "pattern": "^ORD-[0-9]{10}$",
      "description": "订单标识符",
      "x-pii": false
    },
    "customer_id": {
      "type": "string",
      "description": "客户标识符",
      "x-pii": true,
      "x-classification": "confidential"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "事件时间戳（ISO 8601格式，UTC）"
    },
    "payload": {
      "type": "object",
      "description": "事件特定的载荷数据"
    }
  },

  "x-quality-rules": [
    {
      "name": "event_id_unique",
      "type": "uniqueness",
      "column": "event_id",
      "threshold": 100
    },
    {
      "name": "timestamp_freshness",
      "type": "freshness",
      "column": "timestamp",
      "maxAge": "PT5M"
    }
  ]
}
```

### 带契约元数据的Protocol Buffers

用于gRPC和高性能场景：

```protobuf
syntax = "proto3";

package company.orders.v1;

import "google/protobuf/timestamp.proto";

option java_package = "com.company.orders.v1";
option go_package = "company.com/orders/v1";

// 数据契约元数据
// 所有者：order-processing-team
// 联系方式：orders@company.com
// SLA：99.9%可用性，< 100ms p99延迟
// 版本：1.0.0

// OrderEvent 表示订单状态的变更
message OrderEvent {
  // 唯一事件标识符（UUID v4）
  // 必需：true，PII：false
  string event_id = 1;

  // 发生的事件类型
  EventType event_type = 2;

  // 此事件关联的订单
  // 必需：true，PII：false
  string order_id = 3;

  // 事件发生时间
  google.protobuf.Timestamp timestamp = 4;

  // 订单所属的客户
  // 必需：true，PII：true，分类：机密
  string customer_id = 5;

  // 事件特定详情
  oneof details {
    OrderCreated created = 10;
    OrderUpdated updated = 11;
    OrderShipped shipped = 12;
  }
}

enum EventType {
  EVENT_TYPE_UNSPECIFIED = 0;
  EVENT_TYPE_CREATED = 1;
  EVENT_TYPE_UPDATED = 2;
  EVENT_TYPE_SHIPPED = 3;
  EVENT_TYPE_DELIVERED = 4;
  EVENT_TYPE_CANCELLED = 5;
}

message OrderCreated {
  repeated LineItem items = 1;
  Money total = 2;
}

message OrderUpdated {
  repeated string changed_fields = 1;
}

message OrderShipped {
  string carrier = 1;
  string tracking_number = 2;
}

message LineItem {
  string sku = 1;
  int32 quantity = 2;
  Money unit_price = 3;
}

message Money {
  string currency_code = 1;  // ISO 4217
  int64 units = 2;           // 整数部分
  int32 nanos = 3;           // 纳米单位（10^-9）
}
```

## 实现数据质量检查

### Great Expectations集成

[Great Expectations](https://greatexpectations.io)是一个强大的数据验证框架：

```python
import great_expectations as gx
from great_expectations.core.expectation_configuration import ExpectationConfiguration

def create_contract_expectations(contract: dict) -> gx.ExpectationSuite:
    """将数据契约转换为Great Expectations套件。"""

    suite = gx.ExpectationSuite(
        name=f"{contract['id']}_validation",
        meta={
            "contract_version": contract["info"]["version"],
            "owner": contract["info"]["owner"]
        }
    )

    # 添加模式期望
    for field_name, field_spec in contract["schema"]["properties"].items():
        # 检查字段存在
        suite.add_expectation(
            ExpectationConfiguration(
                expectation_type="expect_column_to_exist",
                kwargs={"column": field_name}
            )
        )

        # 检查数据类型
        type_mapping = {
            "string": "str",
            "integer": "int64",
            "number": "float64",
            "boolean": "bool"
        }
        if field_spec.get("type") in type_mapping:
            suite.add_expectation(
                ExpectationConfiguration(
                    expectation_type="expect_column_values_to_be_of_type",
                    kwargs={
                        "column": field_name,
                        "type_": type_mapping[field_spec["type"]]
                    }
                )
            )

        # 检查必需字段（非空）
        if field_name in contract["schema"].get("required", []):
            suite.add_expectation(
                ExpectationConfiguration(
                    expectation_type="expect_column_values_to_not_be_null",
                    kwargs={"column": field_name}
                )
            )

        # 检查枚举值
        if "enum" in field_spec:
            suite.add_expectation(
                ExpectationConfiguration(
                    expectation_type="expect_column_values_to_be_in_set",
                    kwargs={
                        "column": field_name,
                        "value_set": field_spec["enum"]
                    }
                )
            )

        # 检查正则表达式模式
        if "pattern" in field_spec:
            suite.add_expectation(
                ExpectationConfiguration(
                    expectation_type="expect_column_values_to_match_regex",
                    kwargs={
                        "column": field_name,
                        "regex": field_spec["pattern"]
                    }
                )
            )

        # 检查数值范围
        if "minimum" in field_spec:
            suite.add_expectation(
                ExpectationConfiguration(
                    expectation_type="expect_column_values_to_be_between",
                    kwargs={
                        "column": field_name,
                        "min_value": field_spec["minimum"],
                        "max_value": field_spec.get("maximum")
                    }
                )
            )

    return suite


def validate_data_against_contract(df, contract: dict) -> dict:
    """根据数据契约验证DataFrame。"""

    context = gx.get_context()

    # 从契约创建期望套件
    suite = create_contract_expectations(contract)
    context.suites.add(suite)

    # 创建数据源和批次
    data_source = context.data_sources.add_pandas("contract_validation")
    data_asset = data_source.add_dataframe_asset("data_to_validate")
    batch_definition = data_asset.add_batch_definition_whole_dataframe("full_batch")
    batch = batch_definition.get_batch(batch_parameters={"dataframe": df})

    # 运行验证
    validation_result = batch.validate(suite)

    return {
        "success": validation_result.success,
        "statistics": validation_result.statistics,
        "results": [
            {
                "expectation": r.expectation_config.expectation_type,
                "success": r.success,
                "observed_value": r.result.get("observed_value")
            }
            for r in validation_result.results
        ]
    }


# 使用示例
if __name__ == "__main__":
    import pandas as pd

    # 示例契约
    contract = {
        "id": "orders-contract",
        "info": {"version": "1.0.0", "owner": "orders-team"},
        "schema": {
            "properties": {
                "order_id": {"type": "string", "pattern": "^ORD-[0-9]+$"},
                "amount": {"type": "number", "minimum": 0},
                "status": {"type": "string", "enum": ["pending", "shipped", "delivered"]}
            },
            "required": ["order_id", "amount", "status"]
        }
    }

    # 示例数据
    df = pd.DataFrame({
        "order_id": ["ORD-001", "ORD-002", "ORD-003"],
        "amount": [99.99, 149.50, 75.00],
        "status": ["pending", "shipped", "delivered"]
    })

    result = validate_data_against_contract(df, contract)
    print(f"验证通过: {result['success']}")
```

### Soda Core集成

[Soda Core](https://www.soda.io/)提供了声明式的数据质量方法：

```yaml
# soda_checks.yml - 从数据契约生成
checks for orders:
  # 模式检查
  - schema:
      fail:
        when required column missing:
          - order_id
          - amount
          - status
          - created_at
        when wrong column type:
          order_id: varchar
          amount: decimal
          status: varchar
          created_at: timestamp

  # 完整性检查
  - missing_count(order_id) = 0:
      name: 订单ID不能为空

  - missing_percent(amount) < 1:
      name: 金额完整性高于99%

  # 唯一性检查
  - duplicate_count(order_id) = 0:
      name: 订单ID必须唯一

  # 有效性检查
  - invalid_count(status) = 0:
      valid values: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
      name: 状态必须是有效的枚举值

  - invalid_count(amount) = 0:
      valid min: 0
      name: 金额必须为非负数

  # 新鲜度检查
  - freshness(created_at) < 1h:
      name: 数据必须少于1小时

  # 数量检查
  - row_count > 0:
      name: 表不能为空

  # 自定义SQL检查
  - failed rows:
      name: 订单总额必须与行项目匹配
      fail query: |
        SELECT order_id
        FROM orders o
        WHERE amount != (
          SELECT SUM(quantity * unit_price)
          FROM order_items
          WHERE order_id = o.order_id
        )
```

```python
from soda.core.scan import Scan
import yaml

def run_contract_validation(
    contract_path: str,
    connection_config: dict
) -> dict:
    """基于数据契约运行Soda验证。"""

    # 加载契约并生成Soda检查
    with open(contract_path) as f:
        contract = yaml.safe_load(f)

    soda_checks = generate_soda_checks(contract)

    # 运行扫描
    scan = Scan()
    scan.set_data_source_name("production")
    scan.add_configuration_yaml_str(yaml.dump(connection_config))
    scan.add_sodacl_yaml_str(soda_checks)

    scan.execute()

    return {
        "has_failures": scan.has_check_fails(),
        "has_warnings": scan.has_check_warns(),
        "results": scan.get_scan_results()
    }


def generate_soda_checks(contract: dict) -> str:
    """从数据契约生成SodaCL检查。"""

    table_name = contract.get("server", {}).get("table", contract["id"])
    checks = [f"checks for {table_name}:"]

    # 生成模式检查
    schema_check = ["  - schema:", "      fail:"]
    required_fields = contract.get("schema", {}).get("required", [])
    if required_fields:
        schema_check.append("        when required column missing:")
        for field in required_fields:
            schema_check.append(f"          - {field}")
    checks.extend(schema_check)

    # 从契约生成质量检查
    for quality_rule in contract.get("quality", []):
        if quality_rule["type"] == "completeness":
            column = quality_rule["column"]
            threshold = quality_rule.get("mustBe", 100)
            if threshold == 100:
                checks.append(f"  - missing_count({column}) = 0")
            else:
                checks.append(f"  - missing_percent({column}) < {100 - threshold}")

        elif quality_rule["type"] == "uniqueness":
            column = quality_rule["column"]
            checks.append(f"  - duplicate_count({column}) = 0")

        elif quality_rule["type"] == "freshness":
            max_delay = quality_rule.get("maxDelay", "PT1H")
            # 将ISO 8601持续时间转换为Soda格式
            hours = parse_duration_hours(max_delay)
            checks.append(f"  - freshness(updated_at) < {hours}h")

    return "\n".join(checks)


def parse_duration_hours(iso_duration: str) -> int:
    """将ISO 8601持续时间解析为小时。"""
    import re
    match = re.match(r'PT(\d+)H', iso_duration)
    return int(match.group(1)) if match else 1
```

### 自定义验证框架

为数据契约构建可重用的验证框架：

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Callable, List, Optional
from datetime import datetime, timedelta
import pandas as pd

@dataclass
class ValidationResult:
    rule_name: str
    passed: bool
    actual_value: Any
    expected_value: Any
    message: str
    severity: str = "error"

class ValidationRule(ABC):
    def __init__(self, name: str, severity: str = "error"):
        self.name = name
        self.severity = severity

    @abstractmethod
    def validate(self, data: pd.DataFrame) -> ValidationResult:
        pass

class CompletenessRule(ValidationRule):
    def __init__(self, column: str, threshold: float = 1.0, **kwargs):
        super().__init__(f"completeness_{column}", **kwargs)
        self.column = column
        self.threshold = threshold

    def validate(self, data: pd.DataFrame) -> ValidationResult:
        if self.column not in data.columns:
            return ValidationResult(
                rule_name=self.name,
                passed=False,
                actual_value=None,
                expected_value=f"列 {self.column} 存在",
                message=f"列 {self.column} 未找到"
            )

        completeness = 1 - (data[self.column].isna().sum() / len(data))
        passed = completeness >= self.threshold

        return ValidationResult(
            rule_name=self.name,
            passed=passed,
            actual_value=round(completeness, 4),
            expected_value=self.threshold,
            message=f"完整性: {completeness:.2%}（阈值: {self.threshold:.2%}）",
            severity=self.severity
        )

class UniquenessRule(ValidationRule):
    def __init__(self, column: str, **kwargs):
        super().__init__(f"uniqueness_{column}", **kwargs)
        self.column = column

    def validate(self, data: pd.DataFrame) -> ValidationResult:
        duplicates = data[self.column].duplicated().sum()
        passed = duplicates == 0

        return ValidationResult(
            rule_name=self.name,
            passed=passed,
            actual_value=duplicates,
            expected_value=0,
            message=f"在 {self.column} 中发现 {duplicates} 个重复值",
            severity=self.severity
        )

class FreshnessRule(ValidationRule):
    def __init__(self, column: str, max_age: timedelta, **kwargs):
        super().__init__(f"freshness_{column}", **kwargs)
        self.column = column
        self.max_age = max_age

    def validate(self, data: pd.DataFrame) -> ValidationResult:
        max_timestamp = pd.to_datetime(data[self.column]).max()
        age = datetime.utcnow() - max_timestamp.to_pydatetime()
        passed = age <= self.max_age

        return ValidationResult(
            rule_name=self.name,
            passed=passed,
            actual_value=str(age),
            expected_value=str(self.max_age),
            message=f"数据年龄: {age}，最大允许: {self.max_age}",
            severity=self.severity
        )

class EnumRule(ValidationRule):
    def __init__(self, column: str, allowed_values: List[Any], **kwargs):
        super().__init__(f"enum_{column}", **kwargs)
        self.column = column
        self.allowed_values = set(allowed_values)

    def validate(self, data: pd.DataFrame) -> ValidationResult:
        invalid = data[~data[self.column].isin(self.allowed_values)][self.column].unique()
        passed = len(invalid) == 0

        return ValidationResult(
            rule_name=self.name,
            passed=passed,
            actual_value=list(invalid),
            expected_value=list(self.allowed_values),
            message=f"发现无效值: {list(invalid)}",
            severity=self.severity
        )

class RangeRule(ValidationRule):
    def __init__(
        self,
        column: str,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        **kwargs
    ):
        super().__init__(f"range_{column}", **kwargs)
        self.column = column
        self.min_value = min_value
        self.max_value = max_value

    def validate(self, data: pd.DataFrame) -> ValidationResult:
        violations = 0
        col_data = data[self.column].dropna()

        if self.min_value is not None:
            violations += (col_data < self.min_value).sum()
        if self.max_value is not None:
            violations += (col_data > self.max_value).sum()

        passed = violations == 0

        return ValidationResult(
            rule_name=self.name,
            passed=passed,
            actual_value=violations,
            expected_value=0,
            message=f"发现 {violations} 个值超出范围 [{self.min_value}, {self.max_value}]",
            severity=self.severity
        )

class CustomRule(ValidationRule):
    def __init__(self, name: str, validation_fn: Callable[[pd.DataFrame], bool], **kwargs):
        super().__init__(name, **kwargs)
        self.validation_fn = validation_fn

    def validate(self, data: pd.DataFrame) -> ValidationResult:
        try:
            passed = self.validation_fn(data)
            return ValidationResult(
                rule_name=self.name,
                passed=passed,
                actual_value=passed,
                expected_value=True,
                message=f"自定义验证{'通过' if passed else '失败'}",
                severity=self.severity
            )
        except Exception as e:
            return ValidationResult(
                rule_name=self.name,
                passed=False,
                actual_value=str(e),
                expected_value="无错误",
                message=f"验证错误: {e}",
                severity=self.severity
            )


class DataContractValidator:
    """组合多个规则的主验证器。"""

    def __init__(self, contract_id: str):
        self.contract_id = contract_id
        self.rules: List[ValidationRule] = []

    def add_rule(self, rule: ValidationRule) -> "DataContractValidator":
        self.rules.append(rule)
        return self

    def validate(self, data: pd.DataFrame) -> dict:
        results = [rule.validate(data) for rule in self.rules]

        errors = [r for r in results if not r.passed and r.severity == "error"]
        warnings = [r for r in results if not r.passed and r.severity == "warning"]

        return {
            "contract_id": self.contract_id,
            "timestamp": datetime.utcnow().isoformat(),
            "passed": len(errors) == 0,
            "total_rules": len(self.rules),
            "passed_rules": len([r for r in results if r.passed]),
            "error_count": len(errors),
            "warning_count": len(warnings),
            "results": [
                {
                    "rule": r.rule_name,
                    "passed": r.passed,
                    "actual": r.actual_value,
                    "expected": r.expected_value,
                    "message": r.message,
                    "severity": r.severity
                }
                for r in results
            ]
        }

    @classmethod
    def from_contract(cls, contract: dict) -> "DataContractValidator":
        """从契约定义构建验证器。"""

        validator = cls(contract["id"])
        schema = contract.get("schema", {})
        properties = schema.get("properties", {})
        required = schema.get("required", [])

        # 为必需字段添加完整性规则
        for field in required:
            validator.add_rule(CompletenessRule(field, threshold=1.0))

        # 添加类型特定的规则
        for field_name, field_spec in properties.items():
            if "enum" in field_spec:
                validator.add_rule(EnumRule(field_name, field_spec["enum"]))

            if "minimum" in field_spec or "maximum" in field_spec:
                validator.add_rule(RangeRule(
                    field_name,
                    min_value=field_spec.get("minimum"),
                    max_value=field_spec.get("maximum")
                ))

            if field_spec.get("unique"):
                validator.add_rule(UniquenessRule(field_name))

        # 添加质量规则
        for quality_rule in contract.get("quality", []):
            if quality_rule["type"] == "completeness":
                validator.add_rule(CompletenessRule(
                    quality_rule["column"],
                    threshold=quality_rule.get("mustBe", 100) / 100
                ))
            elif quality_rule["type"] == "uniqueness":
                validator.add_rule(UniquenessRule(quality_rule["column"]))
            elif quality_rule["type"] == "freshness":
                # 解析ISO持续时间
                hours = int(quality_rule.get("maxDelay", "PT1H").replace("PT", "").replace("H", ""))
                validator.add_rule(FreshnessRule(
                    quality_rule.get("column", "updated_at"),
                    max_age=timedelta(hours=hours)
                ))

        return validator


# 使用示例
if __name__ == "__main__":
    # 定义契约
    contract = {
        "id": "user-events-contract",
        "schema": {
            "properties": {
                "event_id": {"type": "string", "unique": True},
                "user_id": {"type": "string"},
                "event_type": {
                    "type": "string",
                    "enum": ["click", "view", "purchase"]
                },
                "amount": {"type": "number", "minimum": 0},
                "timestamp": {"type": "string", "format": "date-time"}
            },
            "required": ["event_id", "user_id", "event_type", "timestamp"]
        },
        "quality": [
            {"type": "completeness", "column": "event_id", "mustBe": 100},
            {"type": "uniqueness", "column": "event_id"},
            {"type": "freshness", "column": "timestamp", "maxDelay": "PT1H"}
        ]
    }

    # 创建验证器
    validator = DataContractValidator.from_contract(contract)

    # 测试数据
    df = pd.DataFrame({
        "event_id": ["e1", "e2", "e3"],
        "user_id": ["u1", "u2", "u3"],
        "event_type": ["click", "view", "purchase"],
        "amount": [10.0, None, 25.0],
        "timestamp": [datetime.utcnow().isoformat()] * 3
    })

    # 验证
    result = validator.validate(df)
    print(f"验证通过: {result['passed']}")
    for r in result["results"]:
        status = "通过" if r["passed"] else "失败"
        print(f"  [{status}] {r['rule']}: {r['message']}")
```

## 数据契约设计最佳实践

### 1. 从消费者需求开始

根据消费者实际需要设计契约，而不是生产者能提供什么：

```yaml
# 不好：以生产者为中心的契约（暴露内部细节）
schema:
  properties:
    _internal_id:
      type: integer
      description: 数据库自增ID
    raw_json_payload:
      type: string
      description: 未解析的JSON块

# 好：以消费者为中心的契约（提供有用的抽象）
schema:
  properties:
    order_id:
      type: string
      format: uuid
      description: 订单的稳定外部标识符
    line_items:
      type: array
      items:
        $ref: "#/definitions/LineItem"
      description: 已解析和验证的订单行项目
```

### 2. 使破坏性变更明确

定义什么构成破坏性变更的明确规则：

```yaml
breaking_change_policy:
  requires_major_version:
    - 删除字段
    - 重命名字段
    - 更改字段类型
    - 更改字段的语义含义
    - 将可选字段变为必需
    - 缩小枚举的允许值
    - 收紧验证约束

  requires_minor_version:
    - 添加新的可选字段
    - 扩展枚举的允许值
    - 放宽验证约束
    - 添加新的可选质量规则

  requires_patch_version:
    - 文档更新
    - 不影响接口的内部实现变更
    - 错误修复
```

### 3. 包含所有权和升级路径

清晰的所有权防止"孤儿"数据：

```yaml
ownership:
  producer:
    team: order-processing-team
    product_owner: jane.smith@company.com
    tech_lead: john.doe@company.com
    slack_channel: "#order-processing"
    on_call_rotation: https://pagerduty.com/order-team

  consumers:
    - team: analytics
      contact: analytics-team@company.com
      usage: 每日收入报告
      criticality: high

    - team: fraud-detection
      contact: fraud-team@company.com
      usage: 实时欺诈评分
      criticality: critical

escalation:
  level_1:
    contact: data-platform-oncall@company.com
    response_time: 15m
    scope: 数据可用性问题

  level_2:
    contact: data-platform-manager@company.com
    response_time: 1h
    scope: SLA违规、契约违反

  level_3:
    contact: vp-engineering@company.com
    response_time: 4h
    scope: 关键业务影响
```

### 4. 正确进行版本控制

实施语义化版本控制，并提供清晰的迁移路径：

```python
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional
import semver

class ChangeType(Enum):
    BREAKING = "breaking"
    FEATURE = "feature"
    FIX = "fix"

@dataclass
class ContractChange:
    change_type: ChangeType
    description: str
    affected_fields: List[str]
    migration_guide: Optional[str] = None

class ContractVersionManager:
    def __init__(self, current_version: str):
        self.current_version = semver.VersionInfo.parse(current_version)
        self.pending_changes: List[ContractChange] = []

    def add_change(self, change: ContractChange):
        self.pending_changes.append(change)

    def calculate_next_version(self) -> str:
        has_breaking = any(c.change_type == ChangeType.BREAKING for c in self.pending_changes)
        has_feature = any(c.change_type == ChangeType.FEATURE for c in self.pending_changes)

        if has_breaking:
            return str(self.current_version.bump_major())
        elif has_feature:
            return str(self.current_version.bump_minor())
        else:
            return str(self.current_version.bump_patch())

    def generate_changelog(self) -> str:
        next_version = self.calculate_next_version()

        changelog = [f"## 版本 {next_version}\n"]

        breaking_changes = [c for c in self.pending_changes if c.change_type == ChangeType.BREAKING]
        if breaking_changes:
            changelog.append("### 破坏性变更\n")
            for change in breaking_changes:
                changelog.append(f"- {change.description}")
                if change.migration_guide:
                    changelog.append(f"  - 迁移指南: {change.migration_guide}")

        features = [c for c in self.pending_changes if c.change_type == ChangeType.FEATURE]
        if features:
            changelog.append("\n### 新功能\n")
            for change in features:
                changelog.append(f"- {change.description}")

        fixes = [c for c in self.pending_changes if c.change_type == ChangeType.FIX]
        if fixes:
            changelog.append("\n### 修复\n")
            for change in fixes:
                changelog.append(f"- {change.description}")

        return "\n".join(changelog)

# 使用示例
version_manager = ContractVersionManager("1.2.3")

version_manager.add_change(ContractChange(
    change_type=ChangeType.BREAKING,
    description="删除了已弃用的 'legacy_id' 字段",
    affected_fields=["legacy_id"],
    migration_guide="请改用 'order_id'。迁移脚本位于 /scripts/migrate_legacy_id.py"
))

version_manager.add_change(ContractChange(
    change_type=ChangeType.FEATURE,
    description="添加了 'shipping_method' 字段",
    affected_fields=["shipping_method"]
))

print(f"下一版本: {version_manager.calculate_next_version()}")  # 2.0.0
print(version_manager.generate_changelog())
```

### 5. 与CI/CD集成

在管道中自动验证契约：

```yaml
# .github/workflows/contract-validation.yml
name: 数据契约验证

on:
  pull_request:
    paths:
      - 'contracts/**'
      - 'schemas/**'

jobs:
  validate-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: 设置Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: 安装依赖
        run: |
          pip install datacontract-cli pyyaml jsonschema

      - name: 验证契约语法
        run: |
          for contract in contracts/*.yaml; do
            echo "验证 $contract..."
            datacontract lint "$contract"
          done

      - name: 检查破坏性变更
        run: |
          # 与main分支比较
          git fetch origin main

          for contract in contracts/*.yaml; do
            contract_name=$(basename "$contract")

            if git show origin/main:"$contract" > /tmp/old_contract.yaml 2>/dev/null; then
              echo "检查 $contract_name 的破坏性变更..."
              datacontract breaking /tmp/old_contract.yaml "$contract"
            else
              echo "$contract_name 是新的，跳过破坏性变更检查"
            fi
          done

      - name: 使用示例数据验证
        run: |
          python scripts/validate_sample_data.py

      - name: 生成文档
        run: |
          mkdir -p docs/contracts
          for contract in contracts/*.yaml; do
            contract_name=$(basename "$contract" .yaml)
            datacontract export --format html "$contract" > "docs/contracts/${contract_name}.html"
          done

      - name: 上传文档
        uses: actions/upload-artifact@v4
        with:
          name: contract-docs
          path: docs/contracts/
```

```python
# scripts/validate_sample_data.py
import yaml
import pandas as pd
from pathlib import Path
from contract_validator import DataContractValidator

def main():
    contracts_dir = Path("contracts")
    sample_data_dir = Path("sample_data")

    failures = []

    for contract_file in contracts_dir.glob("*.yaml"):
        print(f"验证 {contract_file.name}...")

        with open(contract_file) as f:
            contract = yaml.safe_load(f)

        # 查找对应的示例数据
        sample_file = sample_data_dir / f"{contract_file.stem}.csv"
        if not sample_file.exists():
            print(f"  警告: 未找到示例数据 {sample_file}")
            continue

        df = pd.read_csv(sample_file)
        validator = DataContractValidator.from_contract(contract)
        result = validator.validate(df)

        if not result["passed"]:
            failures.append({
                "contract": contract_file.name,
                "errors": [r for r in result["results"] if not r["passed"]]
            })
            print(f"  失败: {result['error_count']} 个错误")
        else:
            print(f"  通过: 所有 {result['total_rules']} 条规则通过")

    if failures:
        print("\n=== 验证失败 ===")
        for failure in failures:
            print(f"\n{failure['contract']}:")
            for error in failure["errors"]:
                print(f"  - {error['rule']}: {error['message']}")
        exit(1)

    print("\n所有契约验证成功！")

if __name__ == "__main__":
    main()
```

## 常见陷阱及如何避免

### 陷阱1：契约过于严格

**问题：** 过于严格的契约经常失败并造成摩擦。

```yaml
# 太严格 - 会在细微变化时失败
quality:
  - type: completeness
    column: optional_notes
    mustBe: 100  # 这个字段是可选的！

  - type: pattern
    column: phone
    regex: "^\\+1-[0-9]{3}-[0-9]{3}-[0-9]{4}$"  # 只支持美国格式！
```

**解决方案：** 为现实中的变化设计：

```yaml
quality:
  - type: completeness
    column: optional_notes
    mustBe: 0  # 可选字段，无完整性要求
    severity: info

  - type: pattern
    column: phone
    regex: "^\\+?[0-9\\-\\s]{7,15}$"  # 国际格式

  - type: custom
    name: phone_format_distribution
    severity: warning
    description: 监控电话格式分布以发现异常
```

### 陷阱2：契约过于宽松

**问题：** 没有约束力的契约无法保护消费者。

```yaml
# 太宽松 - 不提供任何保证
schema:
  properties:
    data:
      type: object
      description: 包含订单数据
      # 没有字段定义，没有验证

quality: []  # 没有质量规则！
```

**解决方案：** 定义有意义的约束：

```yaml
schema:
  properties:
    order_id:
      type: string
      format: uuid
      description: 唯一订单标识符
    amount:
      type: number
      minimum: 0
      maximum: 1000000
    status:
      type: string
      enum: [pending, confirmed, shipped, delivered, cancelled]

quality:
  - type: completeness
    column: order_id
    mustBe: 100
  - type: uniqueness
    column: order_id
  - type: freshness
    maxDelay: PT1H
```

### 陷阱3：版本管理混乱

**问题：** 没有清晰的版本控制导致混乱和消费者损坏。

```
# 混乱的版本控制
contracts/
  orders.yaml           # 这是哪个版本？
  orders_new.yaml       # 这个更新吗？
  orders_v2.yaml        # 那这个呢？
  orders_final.yaml     # 真的是最终版？
  orders_final_v2.yaml  # ...
```

**解决方案：** 使用语义化版本控制和单一真相来源：

```
contracts/
  orders/
    contract.yaml           # 当前版本（元数据中有版本号）
    CHANGELOG.md            # 版本历史
    versions/
      1.0.0.yaml            # 归档版本
      1.1.0.yaml
      2.0.0.yaml
```

```yaml
# contract.yaml
info:
  version: 2.1.0
  previousVersions:
    - version: 2.0.0
      deprecatedOn: 2024-01-15
      sunsetOn: 2024-04-15
    - version: 1.1.0
      deprecatedOn: 2023-10-01
      sunsetOn: 2024-01-01
      status: sunset
```

### 陷阱4：缺乏治理

**问题：** 没有契约变更流程会导致意外。

**解决方案：** 实施治理工作流：

```python
from enum import Enum
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

class ContractStatus(Enum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    SUNSET = "sunset"

@dataclass
class ContractReview:
    reviewer: str
    team: str
    approved: bool
    comments: Optional[str]
    reviewed_at: datetime

@dataclass
class ContractProposal:
    contract_id: str
    version: str
    author: str
    status: ContractStatus
    changes_description: str
    breaking_changes: bool
    affected_consumers: List[str]
    reviews: List[ContractReview]
    created_at: datetime

    def can_activate(self) -> bool:
        """检查提案是否可以激活。"""
        if self.status != ContractStatus.APPROVED:
            return False

        # 所有受影响的消费者必须批准破坏性变更
        if self.breaking_changes:
            approved_teams = {r.team for r in self.reviews if r.approved}
            return all(c in approved_teams for c in self.affected_consumers)

        return True

    def get_pending_reviews(self) -> List[str]:
        """获取尚未审核的消费者列表。"""
        reviewed_teams = {r.team for r in self.reviews}
        return [c for c in self.affected_consumers if c not in reviewed_teams]


class ContractGovernance:
    """管理契约生命周期和审批。"""

    def __init__(self):
        self.proposals: dict[str, ContractProposal] = {}

    def submit_proposal(
        self,
        contract_id: str,
        version: str,
        author: str,
        changes: str,
        breaking: bool,
        consumers: List[str]
    ) -> ContractProposal:
        """提交新的契约变更提案。"""

        proposal = ContractProposal(
            contract_id=contract_id,
            version=version,
            author=author,
            status=ContractStatus.DRAFT,
            changes_description=changes,
            breaking_changes=breaking,
            affected_consumers=consumers,
            reviews=[],
            created_at=datetime.utcnow()
        )

        self.proposals[f"{contract_id}:{version}"] = proposal
        return proposal

    def submit_for_review(self, contract_id: str, version: str):
        """将提案移至审核状态。"""
        key = f"{contract_id}:{version}"
        if key in self.proposals:
            self.proposals[key].status = ContractStatus.REVIEW
            self._notify_consumers(self.proposals[key])

    def add_review(
        self,
        contract_id: str,
        version: str,
        reviewer: str,
        team: str,
        approved: bool,
        comments: Optional[str] = None
    ):
        """添加来自消费者团队的审核。"""
        key = f"{contract_id}:{version}"
        if key not in self.proposals:
            raise ValueError(f"提案 {key} 未找到")

        proposal = self.proposals[key]
        proposal.reviews.append(ContractReview(
            reviewer=reviewer,
            team=team,
            approved=approved,
            comments=comments,
            reviewed_at=datetime.utcnow()
        ))

        # 检查是否所有必需的审核都已完成
        if proposal.breaking_changes:
            pending = proposal.get_pending_reviews()
            all_approved = all(r.approved for r in proposal.reviews)

            if not pending and all_approved:
                proposal.status = ContractStatus.APPROVED
        else:
            # 非破坏性变更自动批准
            proposal.status = ContractStatus.APPROVED

    def _notify_consumers(self, proposal: ContractProposal):
        """通知受影响的消费者待审核请求。"""
        for consumer in proposal.affected_consumers:
            print(f"通知 {consumer} 有契约变更审核请求")
            # 生产环境中：发送Slack/邮件通知
```

### 陷阱5：忽略数据血缘

**问题：** 孤立的契约无法捕获依赖关系。

**解决方案：** 包含血缘信息：

```yaml
lineage:
  upstream:
    - contract: raw-events-contract
      version: ">=1.0.0"
      relationship: source
      fields_used:
        - event_id
        - timestamp
        - user_id

    - contract: user-profiles-contract
      version: ">=2.0.0"
      relationship: enrichment
      fields_used:
        - user_id
        - user_segment

  downstream:
    - contract: daily-aggregates-contract
      version: "1.x"
      fields_consumed:
        - event_id
        - user_segment

    - contract: real-time-metrics-contract
      version: "2.x"
      fields_consumed:
        - event_type
        - timestamp
```

## 性能考虑

### 验证开销

契约验证会增加延迟。针对你的用例进行优化：

```python
from functools import lru_cache
import hashlib
import time
from typing import Optional
import pandas as pd

class OptimizedValidator:
    """带性能优化的验证器。"""

    def __init__(self, contract: dict):
        self.contract = contract
        self.schema_hash = self._compute_schema_hash()
        self._compiled_rules = self._compile_rules()

    def _compute_schema_hash(self) -> str:
        """计算用于缓存的哈希值。"""
        import json
        content = json.dumps(self.contract, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def _compile_rules(self):
        """预编译验证规则以提高性能。"""
        # 预计算正则表达式模式、枚举集合等
        compiled = {}
        for field, spec in self.contract.get("schema", {}).get("properties", {}).items():
            if "pattern" in spec:
                import re
                compiled[f"{field}_pattern"] = re.compile(spec["pattern"])
            if "enum" in spec:
                compiled[f"{field}_enum"] = frozenset(spec["enum"])
        return compiled

    def validate_sample(
        self,
        df: pd.DataFrame,
        sample_size: int = 10000,
        sample_method: str = "random"
    ) -> dict:
        """验证样本而不是完整数据集。"""

        if len(df) <= sample_size:
            return self.validate_full(df)

        if sample_method == "random":
            sample = df.sample(n=sample_size, random_state=42)
        elif sample_method == "stratified":
            # 如果有分类列，进行分层抽样
            category_col = self._find_category_column(df)
            if category_col:
                sample = df.groupby(category_col, group_keys=False).apply(
                    lambda x: x.sample(min(len(x), sample_size // df[category_col].nunique()))
                )
            else:
                sample = df.sample(n=sample_size, random_state=42)
        elif sample_method == "recent":
            # 验证最近的记录
            timestamp_col = self._find_timestamp_column(df)
            if timestamp_col:
                sample = df.nlargest(sample_size, timestamp_col)
            else:
                sample = df.tail(sample_size)
        else:
            sample = df.sample(n=sample_size, random_state=42)

        result = self.validate_full(sample)
        result["sample_size"] = len(sample)
        result["total_size"] = len(df)
        result["sampling_method"] = sample_method

        return result

    def validate_full(self, df: pd.DataFrame) -> dict:
        """带优化的完整验证。"""
        start = time.time()
        results = []

        # 向量化操作以提高性能
        for field, spec in self.contract.get("schema", {}).get("properties", {}).items():
            if field not in df.columns:
                results.append({"field": field, "check": "exists", "passed": False})
                continue

            col = df[field]

            # 空值检查（向量化）
            if field in self.contract.get("schema", {}).get("required", []):
                null_count = col.isna().sum()
                results.append({
                    "field": field,
                    "check": "not_null",
                    "passed": null_count == 0,
                    "violations": int(null_count)
                })

            # 枚举检查（使用预计算集合的向量化）
            enum_key = f"{field}_enum"
            if enum_key in self._compiled_rules:
                valid_values = self._compiled_rules[enum_key]
                invalid = ~col.dropna().isin(valid_values)
                results.append({
                    "field": field,
                    "check": "enum",
                    "passed": not invalid.any(),
                    "violations": int(invalid.sum())
                })

            # 模式检查（使用预编译正则的向量化）
            pattern_key = f"{field}_pattern"
            if pattern_key in self._compiled_rules:
                pattern = self._compiled_rules[pattern_key]
                non_null = col.dropna().astype(str)
                matches = non_null.str.match(pattern)
                results.append({
                    "field": field,
                    "check": "pattern",
                    "passed": matches.all(),
                    "violations": int((~matches).sum())
                })

        elapsed = time.time() - start

        return {
            "passed": all(r["passed"] for r in results),
            "results": results,
            "validation_time_ms": round(elapsed * 1000, 2),
            "records_validated": len(df)
        }

    def _find_timestamp_column(self, df: pd.DataFrame) -> Optional[str]:
        """查找可能的时间戳列。"""
        for col in ["timestamp", "created_at", "updated_at", "event_time"]:
            if col in df.columns:
                return col
        return None

    def _find_category_column(self, df: pd.DataFrame) -> Optional[str]:
        """查找用于分层抽样的可能分类列。"""
        for col in ["category", "type", "status", "segment"]:
            if col in df.columns and df[col].nunique() < 100:
                return col
        return None


class AsyncValidator:
    """用于高吞吐量场景的异步验证器。"""

    def __init__(self, contract: dict, batch_size: int = 1000):
        self.validator = OptimizedValidator(contract)
        self.batch_size = batch_size
        self.pending_batches = []
        self.results = []

    async def validate_stream(self, data_stream):
        """在数据流入时验证。"""
        import asyncio

        batch = []
        async for record in data_stream:
            batch.append(record)

            if len(batch) >= self.batch_size:
                # 异步验证批次
                df = pd.DataFrame(batch)
                result = await asyncio.to_thread(
                    self.validator.validate_full, df
                )
                self.results.append(result)
                batch = []

        # 验证剩余记录
        if batch:
            df = pd.DataFrame(batch)
            result = await asyncio.to_thread(
                self.validator.validate_full, df
            )
            self.results.append(result)

        return self._aggregate_results()

    def _aggregate_results(self) -> dict:
        """聚合所有批次的结果。"""
        if not self.results:
            return {"passed": True, "batches": 0}

        all_passed = all(r["passed"] for r in self.results)
        total_records = sum(r["records_validated"] for r in self.results)
        total_time = sum(r["validation_time_ms"] for r in self.results)

        return {
            "passed": all_passed,
            "batches": len(self.results),
            "total_records": total_records,
            "total_time_ms": total_time,
            "avg_time_per_batch_ms": total_time / len(self.results)
        }
```

### 抽样策略

根据数据选择正确的抽样策略：

| 策略 | 最适合 | 缺点 |
|------|--------|------|
| 随机 | 一般验证 | 可能错过罕见问题 |
| 分层 | 分类数据 | 需要分类列 |
| 最近 | 时间序列数据 | 忽略历史问题 |
| 水库 | 流式数据 | 内存开销 |
| 系统 | 有序数据 | 可能遇到模式 |

```python
def choose_sampling_strategy(
    df: pd.DataFrame,
    contract: dict
) -> str:
    """根据数据特征推荐抽样策略。"""

    # 检查时间戳列
    has_timestamp = any(
        col in df.columns
        for col in ["timestamp", "created_at", "event_time"]
    )

    # 检查分类列
    categorical_cols = [
        col for col in df.columns
        if df[col].dtype == "object" and df[col].nunique() < 100
    ]

    # 检查契约SLA要求
    sla = contract.get("servicelevels", {})
    freshness_critical = sla.get("freshness", {}).get("threshold", "PT1H").startswith("PT")

    if freshness_critical and has_timestamp:
        return "recent"  # 对新鲜度关键的契约优先处理最近数据
    elif categorical_cols:
        return "stratified"  # 确保覆盖所有类别
    else:
        return "random"  # 默认随机抽样
```

## 实战场景

### 场景1：数据网格实施

在数据网格架构中，每个域拥有带契约的数据产品：

```yaml
# 域：订单
# 数据产品：订单事件

dataContractSpecification: 0.9.3
id: orders-domain/order-events
info:
  title: 订单事件数据产品
  version: 3.0.0
  owner: orders-domain-team
  dataProduct: true
  domain: orders

# 自助发现
discovery:
  catalog: https://datacatalog.company.com/products/order-events
  documentation: https://wiki.company.com/orders/data-products/events
  sampleData: https://storage.company.com/samples/order-events.parquet

# 多平台可用性
servers:
  streaming:
    type: kafka
    topic: orders.events.v3
    format: avro

  batch:
    type: s3
    location: s3://data-lake/orders/events/
    format: parquet
    partitioning:
      - column: event_date
        granularity: day

  api:
    type: rest
    baseUrl: https://api.company.com/orders/events
    authentication: oauth2

# 联邦治理
governance:
  classification: internal
  personalData: true
  retentionPolicy: 2-years
  accessControl:
    - role: data-analyst
      access: read
    - role: orders-domain-admin
      access: admin
```

### 场景2：跨团队数据共享

在团队之间共享数据时，契约确保清晰的期望：

```yaml
dataContractSpecification: 0.9.3
id: customer-360-shared
info:
  title: 客户360视图
  version: 1.0.0
  owner: customer-platform-team

# 明确定义消费者及其批准的用途
consumers:
  - name: marketing-team
    approved: true
    approvedUsage:
      - 客户细分
      - 营销活动定向
    restrictedUsage:
      - 未经同意的直接个人联系

  - name: fraud-team
    approved: true
    approvedUsage:
      - 欺诈检测模型
      - 风险评分
    specialPermissions:
      - 访问交易历史

  - name: external-partner
    approved: false
    pendingReview: true
    requestedUsage:
      - 联合分析计划

# 数据共享协议
sharing:
  internalUse:
    allowed: true
    requiresApproval: false

  crossDomain:
    allowed: true
    requiresApproval: true
    approver: data-governance-board

  external:
    allowed: false
    exception_process: https://wiki.company.com/external-data-sharing

# 隐私控制
privacy:
  containsPII: true
  piiFields:
    - name: customer_email
      type: email
      masking: hash
    - name: customer_phone
      type: phone
      masking: partial
    - name: customer_address
      type: address
      masking: generalize

  anonymization:
    available: true
    endpoint: /api/customer-360/anonymized
```

### 场景3：事件驱动架构

对于事件流，契约确保事件兼容性：

```yaml
dataContractSpecification: 0.9.3
id: payment-events
info:
  title: 支付事件流
  version: 2.0.0
  owner: payments-team

# 事件特定元数据
eventMetadata:
  eventTypes:
    - name: PaymentInitiated
      description: 支付已开始
      frequency: ~10000/hour

    - name: PaymentAuthorized
      description: 支付已被处理器授权
      frequency: ~9500/hour

    - name: PaymentCompleted
      description: 支付已完全处理
      frequency: ~9000/hour

    - name: PaymentFailed
      description: 支付处理失败
      frequency: ~500/hour

  ordering:
    guarantees: per-key  # 同一payment_id的事件是有序的
    keyField: payment_id

  delivery:
    semantics: at-least-once
    deduplication:
      field: event_id
      window: PT1H

# 所有事件类型的模式
schema:
  type: object
  required:
    - event_id
    - event_type
    - payment_id
    - timestamp
    - version
  properties:
    event_id:
      type: string
      format: uuid

    event_type:
      type: string
      enum:
        - PaymentInitiated
        - PaymentAuthorized
        - PaymentCompleted
        - PaymentFailed

    payment_id:
      type: string
      format: uuid

    timestamp:
      type: string
      format: date-time

    version:
      type: string
      const: "2.0"

    payload:
      type: object
      description: 事件类型特定的载荷

# 事件兼容性规则
compatibility:
  mode: forward  # 新模式必须向前兼容
  rules:
    - 新事件可以添加可选字段
    - 现有字段不能删除（改为弃用）
    - 字段类型不能更改
    - 枚举值只能添加，不能删除
```

## 面试准备

### 常见面试问题

**问题1：模式和数据契约有什么区别？**

模式定义数据的技术结构（字段、类型、约束），而数据契约是更广泛的协议，包括：
- 模式定义
- 字段的语义含义
- 数据质量期望
- SLA（新鲜度、可用性、延迟）
- 所有权和联系信息
- 版本控制和变更管理策略
- 使用条款和限制

可以将模式视为数据的"形状"，而契约定义了围绕该数据的完整"承诺"。

**问题2：如何处理数据契约中的破坏性变更？**

1. **识别破坏性变更**：字段删除、类型更改、语义更改、约束收紧
2. **适当版本控制**：使用语义化版本（MAJOR.MINOR.PATCH）
3. **尽早沟通**：在变更前通知消费者
4. **提供迁移路径**：记录如何适应
5. **支持过渡期**：并行运行新旧版本
6. **优雅下线**：给予足够的弃用通知（通常90天以上）

**问题3：你会如何在数据网格架构中实施数据契约？**

- 每个域拥有其数据产品并定义契约
- 契约被版本化并存储在中央注册表中
- 联邦治理确保跨域一致性
- 通过数据目录集成实现自助发现
- 在CI/CD管道中自动验证
- 通过血缘追踪跨域依赖

**问题4：你会在数据契约中包含哪些质量检查？**

| 类别 | 示例 |
|------|------|
| 完整性 | 空值检查、必需字段 |
| 唯一性 | 主键唯一性、重复检测 |
| 有效性 | 类型检查、枚举验证、范围检查 |
| 一致性 | 引用完整性、业务规则 |
| 新鲜度 | 数据年龄、更新频率 |
| 准确性 | 与真相来源的比较 |

**问题5：如何平衡契约严格性与灵活性？**

- **保守开始**：从核心保证开始，根据反馈扩展
- **严重性级别**：对关键规则使用错误，对建议使用警告
- **可选vs必需字段**：只要求真正必要的
- **版本灵活性**：使用兼容性范围（如"^1.0.0"）
- **宽限期**：给消费者时间适应变更
- **逃生通道**：为特殊情况提供机制

## 延伸阅读

### 书籍

- **《Data Mesh: Delivering Data-Driven Value at Scale》** 作者 Zhamak Dehghani - 数据网格的奠基书籍，广泛覆盖数据产品和契约
- **《Fundamentals of Data Engineering》** 作者 Joe Reis & Matt Housley - 现代数据工程实践的全面覆盖
- **《Building Event-Driven Microservices》** 作者 Adam Bellemare - 事件驱动模式，包括模式和契约管理

### 工具和框架

| 工具 | 用途 | 链接 |
|------|------|------|
| Data Contract Specification | 契约开放标准 | [datacontract.com](https://datacontract.com) |
| Great Expectations | 数据验证框架 | [greatexpectations.io](https://greatexpectations.io) |
| Soda Core | 数据质量测试 | [soda.io](https://www.soda.io) |
| dbt | 带契约的数据转换 | [getdbt.com](https://www.getdbt.com) |
| Confluent Schema Registry | Kafka模式管理 | [confluent.io](https://www.confluent.io) |
| DataHub | 带契约的数据目录 | [datahubproject.io](https://datahubproject.io) |

### 文章和文档

- [Data Contracts: The Key to Scaling Data Products](https://www.datamesh-architecture.com/data-contracts) - 实施契约的全面指南
- [Confluent Schema Registry Documentation](https://docs.confluent.io/platform/current/schema-registry/) - 模式管理最佳实践
- [Great Expectations Documentation](https://docs.greatexpectations.io/) - 验证框架指南
- [dbt Contracts](https://docs.getdbt.com/docs/collaborate/govern/model-contracts) - dbt中的契约执行

### 社区

- **Data Engineering Weekly** - 涵盖数据契约发展的周刊
- **Data Mesh Learning** - 专注于数据网格模式的社区
- **dbt Community Slack** - 关于dbt中数据契约的活跃讨论

数据契约代表了组织管理数据依赖方式的根本转变。通过将数据视为具有清晰接口和保证的产品，团队可以构建更可靠的数据系统，同时保持演进所需的敏捷性。从清晰的所有权开始，定义有意义的质量规则，并实施平衡控制与速度的治理流程。
