---
title: SRE 站点可靠性工程指南
description: 掌握SRE实践，构建可靠的生产系统
track: devops
section: observability
difficulty: advanced
tags:
  - SRE
  - 可靠性
  - SLO
  - On-call
status: imported
origin: old/src/content/docs/devops/sre.zh.md
divergence: 0.205
issues: []
legacy:
  category: DevOps
  subcategory: Operations
  order: 23
  lastUpdated: 2026-01-07
---

## 概念解释

站点可靠性工程（Site Reliability Engineering，SRE）是 Google 于 2003 年创立的一种运维方法论，它将软件工程的思维方式应用于运维工作。SRE 团队的核心职责是确保系统的可靠性、可扩展性和效率，同时推动自动化以减少人工操作。

### 什么是 SRE？

SRE 的创始人 Ben Treynor 曾说过："SRE 就是用软件工程的方法来解决运维问题。"这意味着 SRE 工程师不仅需要具备传统运维的技能，还需要具备软件开发能力，能够编写代码来自动化运维任务、构建监控系统和开发内部工具。

### SRE 的核心原则

```
┌─────────────────────────────────────────────────────────────────┐
│                        SRE 核心原则                              │
└─────────────────────────────────────────────────────────────────┘
                                │
    ┌───────────────┬───────────┼───────────┬───────────────┐
    │               │           │           │               │
    ▼               ▼           ▼           ▼               ▼
┌────────┐    ┌──────────┐  ┌────────┐  ┌─────────┐   ┌──────────┐
│ 拥抱风险 │    │ 服务水平  │  │ 消除琐事 │  │ 监控系统  │   │ 自动化   │
│        │    │   目标   │  │        │  │         │   │          │
└────────┘    └──────────┘  └────────┘  └─────────┘   └──────────┘
    │               │           │           │               │
    ▼               ▼           ▼           ▼               ▼
 错误预算       SLI/SLO/SLA    工程化思维    可观测性       减少人工
 平衡创新       量化可靠性      持续改进     快速响应        提高效率
```

1. **拥抱风险**：100% 的可靠性既不可能也不经济，应该在可靠性和创新速度之间找到平衡
2. **服务水平目标**：使用 SLI、SLO、SLA 来量化和管理服务可靠性
3. **消除琐事**：通过自动化减少重复性的手工操作
4. **监控系统**：建立全面的可观测性体系
5. **自动化一切**：将运维工作代码化

### SRE vs DevOps

| 方面 | SRE | DevOps |
|------|-----|--------|
| 起源 | Google (2003) | 社区运动 (2008) |
| 定义 | 具体实践方法 | 文化理念 |
| 关注点 | 可靠性和可用性 | 协作和交付速度 |
| 指标 | SLI/SLO/SLA | DORA 指标 |
| 团队结构 | 专职 SRE 团队 | 跨职能团队 |

## SLI、SLO 和 SLA

服务水平指标（SLI）、服务水平目标（SLO）和服务水平协议（SLA）构成了 SRE 的核心度量体系。

### 三者的关系

```
┌──────────────────────────────────────────────────────────────────┐
│                        SLA (服务水平协议)                         │
│                   与客户的正式合同承诺                            │
│                   "我们承诺每月可用性达到 99.9%"                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    SLO (服务水平目标)                       │  │
│  │                 内部的可靠性目标                            │  │
│  │                 "目标可用性 99.95%"                         │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │                 SLI (服务水平指标)                    │  │  │
│  │  │               实际测量的指标                          │  │  │
│  │  │               "当前可用性 99.97%"                     │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### SLI（服务水平指标）

SLI 是对服务行为某个方面的定量度量。好的 SLI 应该直接反映用户体验。

#### 常见的 SLI 类型

```python
# SLI 计算示例

class SLICalculator:
    """服务水平指标计算器"""

    def __init__(self, metrics_client):
        self.metrics = metrics_client

    def calculate_availability(self, service: str, window: str = "30d") -> float:
        """
        可用性 SLI
        公式: 成功请求数 / 总请求数
        """
        query = f'''
            sum(rate(http_requests_total{{service="{service}", status!~"5.."}}[{window}]))
            /
            sum(rate(http_requests_total{{service="{service}"}}[{window}]))
        '''
        result = self.metrics.query(query)
        return result * 100  # 返回百分比

    def calculate_latency(self, service: str, percentile: float = 0.99) -> float:
        """
        延迟 SLI
        使用 P99 延迟作为指标
        """
        query = f'''
            histogram_quantile({percentile},
                sum by (le) (rate(http_request_duration_seconds_bucket{{service="{service}"}}[5m]))
            )
        '''
        return self.metrics.query(query)

    def calculate_throughput(self, service: str) -> float:
        """
        吞吐量 SLI
        每秒处理的请求数
        """
        query = f'sum(rate(http_requests_total{{service="{service}"}}[5m]))'
        return self.metrics.query(query)

    def calculate_error_rate(self, service: str) -> float:
        """
        错误率 SLI
        5xx 错误占比
        """
        query = f'''
            sum(rate(http_requests_total{{service="{service}", status=~"5.."}}[5m]))
            /
            sum(rate(http_requests_total{{service="{service}"}}[5m]))
        '''
        return self.metrics.query(query) * 100
```

#### SLI 选择原则

| 服务类型 | 推荐 SLI | 说明 |
|---------|---------|------|
| 用户服务 API | 可用性、延迟 | 关注用户体验 |
| 存储系统 | 可用性、持久性 | 数据不丢失最重要 |
| 数据管道 | 新鲜度、正确性 | 数据质量优先 |
| 流媒体服务 | 吞吐量、启动延迟 | 用户感知性能 |

### SLO（服务水平目标）

SLO 是 SLI 的目标值，表示服务应该达到的可靠性水平。

```yaml
# slo-config.yaml - SLO 配置示例
apiVersion: sloth.slok.dev/v1
kind: PrometheusServiceLevel
metadata:
  name: api-gateway-slo
  namespace: monitoring
spec:
  service: "api-gateway"
  labels:
    team: "platform"
    tier: "tier1"
  slos:
    # 可用性 SLO
    - name: "requests-availability"
      objective: 99.9  # 99.9% 可用性目标
      description: "API 网关请求成功率"
      sli:
        events:
          errorQuery: sum(rate(http_requests_total{service="api-gateway", status=~"5.."}[{{.window}}]))
          totalQuery: sum(rate(http_requests_total{service="api-gateway"}[{{.window}}]))
      alerting:
        name: APIGatewayHighErrorRate
        labels:
          severity: critical
        annotations:
          summary: "API 网关错误率超过 SLO 阈值"
        pageAlert:
          labels:
            severity: critical
        ticketAlert:
          labels:
            severity: warning

    # 延迟 SLO
    - name: "requests-latency"
      objective: 99.0  # 99% 的请求延迟低于阈值
      description: "API 网关 P99 延迟"
      sli:
        events:
          errorQuery: |
            sum(rate(http_request_duration_seconds_bucket{
              service="api-gateway",
              le="0.5"
            }[{{.window}}]))
          totalQuery: sum(rate(http_request_duration_seconds_count{service="api-gateway"}[{{.window}}]))
      alerting:
        name: APIGatewayHighLatency
        labels:
          severity: warning
```

### SLA（服务水平协议）

SLA 是与客户签订的正式合同，包含 SLO 承诺和违约后果。

```python
# sla_management.py - SLA 管理系统

from dataclasses import dataclass
from enum import Enum
from datetime import datetime, timedelta
from typing import Optional
import logging

class SLATier(Enum):
    """SLA 等级"""
    PLATINUM = "platinum"  # 99.99% 可用性
    GOLD = "gold"          # 99.95% 可用性
    SILVER = "silver"      # 99.9% 可用性
    BRONZE = "bronze"      # 99.5% 可用性

@dataclass
class SLADefinition:
    """SLA 定义"""
    tier: SLATier
    availability_target: float
    response_time_p99_ms: int
    support_response_hours: int
    credit_percentage: dict  # 违约时的赔偿比例

    @classmethod
    def get_tier_definition(cls, tier: SLATier) -> "SLADefinition":
        definitions = {
            SLATier.PLATINUM: cls(
                tier=SLATier.PLATINUM,
                availability_target=99.99,
                response_time_p99_ms=100,
                support_response_hours=1,
                credit_percentage={
                    99.99: 0,    # 达标
                    99.9: 10,    # 赔偿 10%
                    99.0: 25,    # 赔偿 25%
                    0: 50        # 赔偿 50%
                }
            ),
            SLATier.GOLD: cls(
                tier=SLATier.GOLD,
                availability_target=99.95,
                response_time_p99_ms=200,
                support_response_hours=4,
                credit_percentage={
                    99.95: 0,
                    99.9: 10,
                    99.0: 20,
                    0: 30
                }
            ),
            SLATier.SILVER: cls(
                tier=SLATier.SILVER,
                availability_target=99.9,
                response_time_p99_ms=500,
                support_response_hours=8,
                credit_percentage={
                    99.9: 0,
                    99.0: 10,
                    95.0: 20,
                    0: 25
                }
            ),
            SLATier.BRONZE: cls(
                tier=SLATier.BRONZE,
                availability_target=99.5,
                response_time_p99_ms=1000,
                support_response_hours=24,
                credit_percentage={
                    99.5: 0,
                    99.0: 5,
                    95.0: 10,
                    0: 15
                }
            )
        }
        return definitions[tier]

class SLAManager:
    """SLA 管理器"""

    def __init__(self, metrics_client, billing_client):
        self.metrics = metrics_client
        self.billing = billing_client
        self.logger = logging.getLogger(__name__)

    def calculate_monthly_availability(self, service: str, month: datetime) -> float:
        """计算月度可用性"""
        start = month.replace(day=1, hour=0, minute=0, second=0)
        if month.month == 12:
            end = month.replace(year=month.year + 1, month=1, day=1)
        else:
            end = month.replace(month=month.month + 1, day=1)

        total_minutes = (end - start).total_seconds() / 60

        # 查询停机时间
        downtime_query = f'''
            sum(
                (1 - avg_over_time(up{{service="{service}"}}[1m]))
            ) * 1  # 转换为分钟
        '''
        downtime_minutes = self.metrics.query_range(downtime_query, start, end)

        availability = ((total_minutes - downtime_minutes) / total_minutes) * 100
        return round(availability, 4)

    def check_sla_breach(self, service: str, sla: SLADefinition,
                         actual_availability: float) -> Optional[float]:
        """检查 SLA 违约并计算赔偿"""
        if actual_availability >= sla.availability_target:
            return None  # 未违约

        # 找到对应的赔偿比例
        credit_pct = 0
        for threshold, pct in sorted(sla.credit_percentage.items(), reverse=True):
            if actual_availability >= threshold:
                credit_pct = pct
                break

        return credit_pct

    def generate_sla_report(self, service: str, sla_tier: SLATier,
                           month: datetime) -> dict:
        """生成 SLA 报告"""
        sla = SLADefinition.get_tier_definition(sla_tier)
        actual_availability = self.calculate_monthly_availability(service, month)
        breach_credit = self.check_sla_breach(service, sla, actual_availability)

        report = {
            "service": service,
            "period": month.strftime("%Y-%m"),
            "sla_tier": sla_tier.value,
            "target_availability": sla.availability_target,
            "actual_availability": actual_availability,
            "sla_met": breach_credit is None,
            "credit_percentage": breach_credit or 0,
            "details": {
                "target_p99_latency_ms": sla.response_time_p99_ms,
                "support_response_hours": sla.support_response_hours
            }
        }

        self.logger.info(f"SLA Report generated: {report}")
        return report
```

## 错误预算

错误预算是 SRE 最重要的概念之一，它将可靠性目标转化为可量化的风险容忍度。

### 错误预算的计算

```
错误预算 = 100% - SLO

例如：
SLO = 99.9%
错误预算 = 100% - 99.9% = 0.1%

按月计算停机时间:
每月总分钟数 = 30 * 24 * 60 = 43,200 分钟
允许停机时间 = 43,200 * 0.001 = 43.2 分钟/月
```

### 错误预算管理系统

```python
# error_budget.py - 错误预算管理

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional
from enum import Enum
import json

class BudgetStatus(Enum):
    """错误预算状态"""
    HEALTHY = "healthy"       # > 50% 剩余
    WARNING = "warning"       # 25-50% 剩余
    CRITICAL = "critical"     # < 25% 剩余
    EXHAUSTED = "exhausted"   # 已耗尽

@dataclass
class ErrorBudgetConfig:
    """错误预算配置"""
    service: str
    slo_target: float  # 如 99.9
    window_days: int   # 计算窗口，通常 30 天

    @property
    def budget_percentage(self) -> float:
        """可用的错误预算百分比"""
        return 100 - self.slo_target

    @property
    def budget_minutes(self) -> float:
        """可用的停机分钟数"""
        total_minutes = self.window_days * 24 * 60
        return total_minutes * (self.budget_percentage / 100)

class ErrorBudgetTracker:
    """错误预算追踪器"""

    def __init__(self, config: ErrorBudgetConfig, metrics_client):
        self.config = config
        self.metrics = metrics_client

    def get_consumed_budget(self) -> dict:
        """获取已消耗的错误预算"""
        window = f"{self.config.window_days}d"

        # 计算不可用时间
        unavailability_query = f'''
            (1 - (
                sum(rate(http_requests_total{{service="{self.config.service}", status!~"5.."}}[{window}]))
                /
                sum(rate(http_requests_total{{service="{self.config.service}"}}[{window}]))
            )) * 100
        '''

        error_rate = self.metrics.query(unavailability_query)
        total_budget = self.config.budget_percentage
        consumed = error_rate
        remaining = max(0, total_budget - consumed)

        return {
            "total_budget_pct": total_budget,
            "consumed_pct": consumed,
            "remaining_pct": remaining,
            "remaining_minutes": (remaining / total_budget) * self.config.budget_minutes,
            "burn_rate": self._calculate_burn_rate(),
            "status": self._get_status(remaining / total_budget * 100)
        }

    def _calculate_burn_rate(self) -> float:
        """
        计算燃烧速率
        burn_rate = 实际错误率 / 预期错误率
        burn_rate = 1: 按预期消耗
        burn_rate > 1: 消耗过快
        burn_rate < 1: 消耗较慢
        """
        # 1 小时窗口的错误率
        hourly_query = f'''
            (1 - (
                sum(rate(http_requests_total{{service="{self.config.service}", status!~"5.."}}[1h]))
                /
                sum(rate(http_requests_total{{service="{self.config.service}"}}[1h]))
            )) * 100
        '''
        current_error_rate = self.metrics.query(hourly_query)
        expected_rate = self.config.budget_percentage / (self.config.window_days * 24)

        if expected_rate == 0:
            return 0
        return current_error_rate / expected_rate

    def _get_status(self, remaining_pct: float) -> BudgetStatus:
        """根据剩余预算返回状态"""
        if remaining_pct <= 0:
            return BudgetStatus.EXHAUSTED
        elif remaining_pct < 25:
            return BudgetStatus.CRITICAL
        elif remaining_pct < 50:
            return BudgetStatus.WARNING
        return BudgetStatus.HEALTHY

    def should_freeze_releases(self) -> bool:
        """判断是否应该冻结发布"""
        budget = self.get_consumed_budget()
        return budget["status"] in [BudgetStatus.EXHAUSTED, BudgetStatus.CRITICAL]

    def get_budget_forecast(self, days: int = 7) -> dict:
        """预测未来错误预算"""
        current = self.get_consumed_budget()
        burn_rate = current["burn_rate"]

        # 按当前燃烧速率预测
        daily_consumption = (current["consumed_pct"] / self.config.window_days) * burn_rate
        forecast_remaining = current["remaining_pct"] - (daily_consumption * days)

        return {
            "current_remaining_pct": current["remaining_pct"],
            "forecast_days": days,
            "forecast_remaining_pct": max(0, forecast_remaining),
            "days_until_exhausted": current["remaining_pct"] / daily_consumption if daily_consumption > 0 else float('inf')
        }


# 错误预算告警规则
ERROR_BUDGET_ALERTS = '''
# prometheus-rules/error-budget.yaml
groups:
  - name: error-budget-alerts
    rules:
      # 错误预算燃烧速率过高（1小时内）
      - alert: ErrorBudgetBurnRateHigh
        expr: |
          (
            1 - (
              sum(rate(http_requests_total{status!~"5.."}[1h])) by (service)
              /
              sum(rate(http_requests_total[1h])) by (service)
            )
          ) / (1 - 0.999) > 14.4
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "服务 {{ $labels.service }} 错误预算消耗过快"
          description: "当前燃烧速率是正常速率的 {{ $value | printf \"%.1f\" }} 倍，将在 1 小时内耗尽月度预算"
          runbook_url: "https://runbooks.example.com/error-budget"

      # 错误预算已消耗超过 50%
      - alert: ErrorBudgetLow
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[30d])) by (service)
            /
            sum(rate(http_requests_total[30d])) by (service)
          ) / 0.001 > 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "服务 {{ $labels.service }} 错误预算不足"
          description: "月度错误预算已消耗超过 50%"

      # 错误预算已耗尽
      - alert: ErrorBudgetExhausted
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[30d])) by (service)
            /
            sum(rate(http_requests_total[30d])) by (service)
          ) > 0.001
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "服务 {{ $labels.service }} 错误预算已耗尽"
          description: "建议暂停功能发布，专注于可靠性改进"
'''
```

### 错误预算策略

```yaml
# error-budget-policy.yaml - 错误预算策略文档

policy:
  name: "错误预算管理策略"
  version: "1.0"
  effective_date: "2024-01-01"

budget_states:
  healthy:
    definition: "剩余预算 > 50%"
    actions:
      - "正常进行功能开发和发布"
      - "可以进行计划内的实验性变更"
      - "鼓励创新和新功能开发"

  warning:
    definition: "25% < 剩余预算 <= 50%"
    actions:
      - "继续功能开发，但增加发布审查"
      - "优先处理已知的可靠性问题"
      - "每次发布需要额外的审批"
      - "限制高风险变更"

  critical:
    definition: "0% < 剩余预算 <= 25%"
    actions:
      - "冻结非关键功能发布"
      - "团队重心转向可靠性改进"
      - "只允许紧急修复和可靠性相关变更"
      - "启动每日站会跟踪恢复进度"

  exhausted:
    definition: "剩余预算 <= 0%"
    actions:
      - "完全冻结所有功能发布"
      - "100% 工程资源投入可靠性改进"
      - "进行事后分析，识别根本原因"
      - "制定恢复计划并每日汇报"
      - "可能需要升级到管理层"

burn_rate_alerts:
  - name: "快速燃烧"
    threshold: "14.4x (1小时内耗尽月度预算)"
    response: "立即响应，可能是严重事故"

  - name: "中速燃烧"
    threshold: "6x (4小时内耗尽月度预算)"
    response: "高优先级响应，需要及时干预"

  - name: "慢速燃烧"
    threshold: "3x (8小时内耗尽月度预算)"
    response: "工作时间内处理"

  - name: "超慢速燃烧"
    threshold: "1x (按预期消耗)"
    response: "正常监控，无需特别行动"
```

## On-call 值班管理

On-call 是 SRE 的核心职责之一，需要建立完善的值班制度和响应流程。

### On-call 轮换配置

```yaml
# oncall-schedule.yaml - PagerDuty 风格的值班配置

schedule:
  name: "Platform SRE On-call"
  timezone: "Asia/Shanghai"

  rotation:
    type: "weekly"
    handoff_time: "09:00"
    handoff_day: "monday"

  layers:
    - name: "primary"
      members:
        - name: "张三"
          email: "zhangsan@example.com"
          phone: "+86-138xxxxxxxx"
        - name: "李四"
          email: "lisi@example.com"
          phone: "+86-139xxxxxxxx"
        - name: "王五"
          email: "wangwu@example.com"
          phone: "+86-137xxxxxxxx"
      rotation_virtual_start: "2024-01-01T09:00:00+08:00"

    - name: "secondary"
      members:
        - name: "赵六"
          email: "zhaoliu@example.com"
          phone: "+86-136xxxxxxxx"
        - name: "钱七"
          email: "qianqi@example.com"
          phone: "+86-135xxxxxxxx"
      rotation_virtual_start: "2024-01-08T09:00:00+08:00"

  escalation_policy:
    name: "Platform Escalation"
    rules:
      - delay_minutes: 0
        targets:
          - type: "schedule"
            id: "primary"
      - delay_minutes: 15
        targets:
          - type: "schedule"
            id: "secondary"
      - delay_minutes: 30
        targets:
          - type: "user"
            id: "sre-manager"

  overrides:
    - start: "2024-02-10T00:00:00+08:00"
      end: "2024-02-17T23:59:59+08:00"
      user: "lisi@example.com"
      reason: "春节值班覆盖"
```

### On-call 响应流程

```python
# oncall_handler.py - On-call 响应处理

from enum import Enum
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional, List
import logging

class AlertSeverity(Enum):
    """告警严重程度"""
    P1 = "critical"   # 严重影响用户，需立即响应
    P2 = "high"       # 显著影响，需在 30 分钟内响应
    P3 = "medium"     # 中等影响，需在 4 小时内响应
    P4 = "low"        # 低影响，下个工作日处理

@dataclass
class Alert:
    """告警信息"""
    id: str
    title: str
    description: str
    severity: AlertSeverity
    service: str
    source: str
    triggered_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    @property
    def time_to_ack(self) -> Optional[timedelta]:
        if self.acknowledged_at:
            return self.acknowledged_at - self.triggered_at
        return None

    @property
    def time_to_resolve(self) -> Optional[timedelta]:
        if self.resolved_at:
            return self.resolved_at - self.triggered_at
        return None

class OnCallResponder:
    """On-call 响应处理器"""

    # 各严重程度的 SLO
    RESPONSE_SLO = {
        AlertSeverity.P1: timedelta(minutes=5),
        AlertSeverity.P2: timedelta(minutes=30),
        AlertSeverity.P3: timedelta(hours=4),
        AlertSeverity.P4: timedelta(hours=24)
    }

    def __init__(self, alert_client, notification_client):
        self.alerts = alert_client
        self.notifications = notification_client
        self.logger = logging.getLogger(__name__)

    def handle_alert(self, alert: Alert) -> dict:
        """处理告警的主流程"""
        self.logger.info(f"Handling alert: {alert.id} - {alert.title}")

        # 1. 确认告警
        response = {
            "alert_id": alert.id,
            "steps": []
        }

        # 2. 根据严重程度执行对应流程
        if alert.severity == AlertSeverity.P1:
            response["steps"] = self._handle_p1(alert)
        elif alert.severity == AlertSeverity.P2:
            response["steps"] = self._handle_p2(alert)
        else:
            response["steps"] = self._handle_p3_p4(alert)

        return response

    def _handle_p1(self, alert: Alert) -> List[str]:
        """P1 严重事故处理流程"""
        steps = []

        # 立即确认
        steps.append("1. 立即确认告警 (5分钟内)")
        self.alerts.acknowledge(alert.id)

        # 通知相关人员
        steps.append("2. 通知团队负责人和相关方")
        self.notifications.send_urgent(
            recipients=["sre-team", "service-owner", "sre-manager"],
            message=f"P1 事故: {alert.title}"
        )

        # 创建事故频道
        steps.append("3. 创建事故响应频道")
        channel = self._create_incident_channel(alert)

        # 开始事故响应
        steps.append("4. 启动事故指挥流程")
        steps.append("5. 持续更新状态页面")
        steps.append("6. 每 15 分钟提供状态更新")

        return steps

    def _handle_p2(self, alert: Alert) -> List[str]:
        """P2 高优先级处理流程"""
        steps = []

        steps.append("1. 在 30 分钟内确认告警")
        steps.append("2. 评估影响范围")
        steps.append("3. 如果升级为 P1，执行 P1 流程")
        steps.append("4. 通知 service owner")
        steps.append("5. 制定修复计划")

        return steps

    def _handle_p3_p4(self, alert: Alert) -> List[str]:
        """P3/P4 常规处理流程"""
        steps = []

        steps.append("1. 在工作时间内确认告警")
        steps.append("2. 创建工单跟踪")
        steps.append("3. 排入工作队列")
        steps.append("4. 按优先级处理")

        return steps

    def _create_incident_channel(self, alert: Alert) -> str:
        """创建事故响应频道"""
        channel_name = f"incident-{alert.id}-{datetime.now().strftime('%Y%m%d')}"
        # 创建 Slack 频道或类似沟通渠道
        return channel_name

    def generate_oncall_report(self, start: datetime, end: datetime) -> dict:
        """生成 On-call 报告"""
        alerts = self.alerts.get_range(start, end)

        report = {
            "period": f"{start.date()} to {end.date()}",
            "total_alerts": len(alerts),
            "by_severity": {},
            "mttr": {},  # 平均修复时间
            "mtta": {},  # 平均确认时间
            "slo_compliance": {}
        }

        for severity in AlertSeverity:
            severity_alerts = [a for a in alerts if a.severity == severity]
            if severity_alerts:
                ack_times = [a.time_to_ack for a in severity_alerts if a.time_to_ack]
                resolve_times = [a.time_to_resolve for a in severity_alerts if a.time_to_resolve]

                report["by_severity"][severity.value] = len(severity_alerts)

                if ack_times:
                    avg_ack = sum(ack_times, timedelta()) / len(ack_times)
                    report["mtta"][severity.value] = str(avg_ack)

                    slo = self.RESPONSE_SLO[severity]
                    within_slo = sum(1 for t in ack_times if t <= slo)
                    report["slo_compliance"][severity.value] = f"{within_slo/len(ack_times)*100:.1f}%"

                if resolve_times:
                    avg_resolve = sum(resolve_times, timedelta()) / len(resolve_times)
                    report["mttr"][severity.value] = str(avg_resolve)

        return report
```

### On-call 最佳实践

```markdown
## On-call 健康指南

### 值班前准备
- [ ] 确保笔记本电脑充电并可随时使用
- [ ] 检查 VPN 连接正常
- [ ] 确认可以访问所有必要的系统和 runbook
- [ ] 测试告警通知（手机、邮件等）
- [ ] 阅读上一班次的交接记录

### 值班期间
- [ ] 保持手机畅通，电量充足
- [ ] 不要饮酒或做无法中断的活动
- [ ] 如需暂时无法响应（如就医），提前安排临时覆盖
- [ ] 记录所有处理过的事件

### 值班结束
- [ ] 撰写值班交接文档
- [ ] 总结本周值班中发现的问题
- [ ] 提出改进建议（自动化、告警优化等）
- [ ] 更新 runbook（如有新的处理经验）

### 心理健康
- 值班后安排休息时间
- 避免连续值班
- 如果值班压力过大，及时与团队沟通
- 定期回顾和优化告警质量，减少噪音
```

## 事故管理

事故管理是 SRE 工作中最关键的能力之一，需要有清晰的流程和角色定义。

### 事故响应框架

```python
# incident_management.py - 事故管理系统

from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
import uuid

class IncidentStatus(Enum):
    """事故状态"""
    DETECTED = "detected"         # 已检测
    INVESTIGATING = "investigating"  # 调查中
    IDENTIFIED = "identified"      # 已识别原因
    MITIGATING = "mitigating"      # 缓解中
    RESOLVED = "resolved"          # 已解决
    POSTMORTEM = "postmortem"      # 事后分析中
    CLOSED = "closed"              # 已关闭

class IncidentSeverity(Enum):
    """事故严重程度"""
    SEV1 = 1  # 大规模用户影响，核心服务完全不可用
    SEV2 = 2  # 显著用户影响，核心功能降级
    SEV3 = 3  # 部分用户影响，非核心功能问题
    SEV4 = 4  # 最小影响，单个用户或边缘情况

@dataclass
class IncidentRole:
    """事故响应角色"""
    name: str
    user: str
    responsibilities: List[str]

@dataclass
class IncidentUpdate:
    """事故更新记录"""
    timestamp: datetime
    author: str
    content: str
    status_change: Optional[IncidentStatus] = None

@dataclass
class Incident:
    """事故记录"""
    id: str
    title: str
    severity: IncidentSeverity
    status: IncidentStatus
    description: str
    services_affected: List[str]
    started_at: datetime
    detected_at: datetime
    resolved_at: Optional[datetime] = None

    # 角色分配
    incident_commander: Optional[str] = None
    communications_lead: Optional[str] = None
    operations_lead: Optional[str] = None

    # 时间线
    updates: List[IncidentUpdate] = field(default_factory=list)

    # 影响指标
    users_affected: int = 0
    error_budget_consumed: float = 0.0

    @property
    def duration(self) -> Optional[float]:
        """事故持续时间（分钟）"""
        if self.resolved_at:
            return (self.resolved_at - self.started_at).total_seconds() / 60
        return None

    @property
    def time_to_detect(self) -> float:
        """检测时间（分钟）"""
        return (self.detected_at - self.started_at).total_seconds() / 60

class IncidentManager:
    """事故管理器"""

    def __init__(self, db, notification_service, status_page):
        self.db = db
        self.notifications = notification_service
        self.status_page = status_page

    def declare_incident(self, title: str, severity: IncidentSeverity,
                        description: str, services: List[str]) -> Incident:
        """宣告事故"""
        incident = Incident(
            id=f"INC-{uuid.uuid4().hex[:8].upper()}",
            title=title,
            severity=severity,
            status=IncidentStatus.DETECTED,
            description=description,
            services_affected=services,
            started_at=datetime.now(),
            detected_at=datetime.now()
        )

        self.db.save(incident)

        # 发送通知
        self._notify_stakeholders(incident)

        # 更新状态页
        self.status_page.create_incident(incident)

        return incident

    def assign_roles(self, incident_id: str,
                     commander: str = None,
                     comms_lead: str = None,
                     ops_lead: str = None) -> Incident:
        """分配事故响应角色"""
        incident = self.db.get(incident_id)

        if commander:
            incident.incident_commander = commander
        if comms_lead:
            incident.communications_lead = comms_lead
        if ops_lead:
            incident.operations_lead = ops_lead

        self.db.save(incident)

        # 发送角色分配通知
        self.notifications.send(
            recipients=[commander, comms_lead, ops_lead],
            message=f"你已被分配到事故 {incident_id} 的响应团队"
        )

        return incident

    def add_update(self, incident_id: str, author: str,
                   content: str, new_status: IncidentStatus = None) -> Incident:
        """添加事故更新"""
        incident = self.db.get(incident_id)

        update = IncidentUpdate(
            timestamp=datetime.now(),
            author=author,
            content=content,
            status_change=new_status
        )

        incident.updates.append(update)

        if new_status:
            incident.status = new_status
            if new_status == IncidentStatus.RESOLVED:
                incident.resolved_at = datetime.now()

        self.db.save(incident)

        # 更新状态页
        self.status_page.add_update(incident_id, update)

        return incident

    def _notify_stakeholders(self, incident: Incident):
        """通知相关方"""
        # 根据严重程度确定通知范围
        recipients = ["sre-team"]

        if incident.severity in [IncidentSeverity.SEV1, IncidentSeverity.SEV2]:
            recipients.extend(["engineering-leads", "product-team"])

        if incident.severity == IncidentSeverity.SEV1:
            recipients.extend(["executives", "customer-success"])

        self.notifications.send(
            recipients=recipients,
            message=f"[{incident.severity.name}] 事故已宣告: {incident.title}",
            urgent=(incident.severity == IncidentSeverity.SEV1)
        )
```

### 事故响应角色

```
┌─────────────────────────────────────────────────────────────────┐
│                      事故响应组织结构                            │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │   事故指挥官 (IC)    │
                    │  Incident Commander │
                    └─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  通讯负责人    │     │  运维负责人    │     │  技术负责人    │
│  Comms Lead   │     │   Ops Lead    │     │  Tech Lead    │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
   外部沟通              问题排查              技术方案
   状态更新              执行操作              根因分析
   客户通知              监控恢复              架构决策
```

### 事故响应角色职责

```yaml
# incident-roles.yaml

roles:
  incident_commander:
    title: "事故指挥官 (Incident Commander)"
    abbreviation: "IC"
    responsibilities:
      - "全面负责事故响应协调"
      - "确保事故响应流程正确执行"
      - "做出关键决策（如是否回滚）"
      - "协调各角色之间的工作"
      - "决定事故何时可以降级或关闭"
      - "确保事后分析的完成"
    should_not:
      - "直接参与技术排查（除非人手不足）"
      - "同时承担其他角色"

  communications_lead:
    title: "通讯负责人 (Communications Lead)"
    abbreviation: "CL"
    responsibilities:
      - "管理事故沟通频道"
      - "定期发布状态更新（每 15-30 分钟）"
      - "更新状态页面"
      - "协调客户沟通"
      - "记录事故时间线"
      - "通知相关干系人"
    templates:
      - "状态更新模板"
      - "客户通知模板"
      - "内部通报模板"

  operations_lead:
    title: "运维负责人 (Operations Lead)"
    abbreviation: "OL"
    responsibilities:
      - "执行技术排查"
      - "实施缓解措施"
      - "监控系统恢复情况"
      - "执行回滚或修复操作"
      - "收集诊断信息"
    tools:
      - "监控仪表板"
      - "日志系统"
      - "追踪系统"
      - "部署工具"

  subject_matter_expert:
    title: "领域专家 (Subject Matter Expert)"
    abbreviation: "SME"
    responsibilities:
      - "提供特定系统或领域的专业知识"
      - "协助根因分析"
      - "建议技术解决方案"
      - "按需加入事故响应"
```

### 事后分析（Postmortem）

```python
# postmortem.py - 事后分析模板和管理

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from enum import Enum

class ActionItemPriority(Enum):
    P0 = "critical"    # 必须在 24 小时内完成
    P1 = "high"        # 必须在 1 周内完成
    P2 = "medium"      # 必须在 1 个月内完成
    P3 = "low"         # 下个季度前完成

@dataclass
class ActionItem:
    """后续行动项"""
    id: str
    title: str
    description: str
    priority: ActionItemPriority
    owner: str
    due_date: datetime
    status: str = "open"
    ticket_url: Optional[str] = None

@dataclass
class Postmortem:
    """事后分析文档"""
    incident_id: str
    title: str
    date: datetime
    authors: List[str]
    reviewers: List[str]
    status: str = "draft"

    # 事故概要
    summary: str = ""
    impact: str = ""

    # 时间线
    timeline: List[dict] = field(default_factory=list)

    # 根因分析
    root_causes: List[str] = field(default_factory=list)
    contributing_factors: List[str] = field(default_factory=list)

    # 经验教训
    what_went_well: List[str] = field(default_factory=list)
    what_went_wrong: List[str] = field(default_factory=list)
    where_we_got_lucky: List[str] = field(default_factory=list)

    # 行动项
    action_items: List[ActionItem] = field(default_factory=list)

    # 指标
    metrics: dict = field(default_factory=dict)

# 事后分析模板
POSTMORTEM_TEMPLATE = '''
# 事故事后分析: {incident_id}

**事故标题**: {title}
**事故日期**: {date}
**作者**: {authors}
**状态**: {status}

---

## 概要

{summary}

## 影响

- **影响时长**: {duration} 分钟
- **受影响用户数**: {users_affected}
- **受影响服务**: {services}
- **错误预算消耗**: {error_budget_consumed}%
- **财务影响**: {financial_impact}

## 时间线 (所有时间为 UTC+8)

| 时间 | 事件 |
|------|------|
{timeline}

## 根本原因

{root_causes}

## 促成因素

{contributing_factors}

## 经验教训

### 做得好的地方
{what_went_well}

### 需要改进的地方
{what_went_wrong}

### 侥幸之处
{where_we_got_lucky}

## 行动项

| ID | 描述 | 优先级 | 负责人 | 截止日期 | 状态 |
|----|------|--------|--------|----------|------|
{action_items}

## 附录

### 相关链接
- 监控仪表板: {dashboard_link}
- 日志查询: {log_query_link}
- 追踪链路: {trace_link}

### 事故指标
- MTTD (平均检测时间): {mttd} 分钟
- MTTA (平均确认时间): {mtta} 分钟
- MTTR (平均恢复时间): {mttr} 分钟

---

*本文档遵循无责文化原则，重点关注系统和流程改进，而非追究个人责任。*
'''

class PostmortemManager:
    """事后分析管理器"""

    def __init__(self, db, notification_service):
        self.db = db
        self.notifications = notification_service

    def create_postmortem(self, incident_id: str, authors: List[str]) -> Postmortem:
        """创建事后分析文档"""
        incident = self.db.get_incident(incident_id)

        postmortem = Postmortem(
            incident_id=incident_id,
            title=f"事故 {incident_id}: {incident.title}",
            date=incident.started_at,
            authors=authors,
            reviewers=[],
            metrics={
                "duration": incident.duration,
                "users_affected": incident.users_affected,
                "error_budget_consumed": incident.error_budget_consumed,
                "mttd": incident.time_to_detect,
                "mttr": incident.duration
            }
        )

        # 自动填充时间线
        postmortem.timeline = self._build_timeline(incident)

        self.db.save_postmortem(postmortem)
        return postmortem

    def _build_timeline(self, incident) -> List[dict]:
        """从事故更新构建时间线"""
        timeline = [
            {"time": incident.started_at, "event": "事故开始"}
        ]

        for update in incident.updates:
            timeline.append({
                "time": update.timestamp,
                "event": update.content
            })

        if incident.resolved_at:
            timeline.append({
                "time": incident.resolved_at,
                "event": "事故解决"
            })

        return sorted(timeline, key=lambda x: x["time"])

    def add_action_item(self, postmortem_id: str, action: ActionItem) -> Postmortem:
        """添加行动项"""
        postmortem = self.db.get_postmortem(postmortem_id)
        postmortem.action_items.append(action)
        self.db.save_postmortem(postmortem)

        # 创建工单
        self._create_ticket(action)

        return postmortem

    def _create_ticket(self, action: ActionItem):
        """在工单系统中创建跟踪项"""
        # 集成 JIRA/GitHub Issues 等
        pass

    def schedule_review(self, postmortem_id: str, reviewers: List[str],
                       review_date: datetime):
        """安排事后分析评审会议"""
        postmortem = self.db.get_postmortem(postmortem_id)
        postmortem.reviewers = reviewers

        self.notifications.schedule_meeting(
            title=f"事后分析评审: {postmortem.incident_id}",
            attendees=postmortem.authors + reviewers,
            date=review_date,
            duration_minutes=60,
            agenda=[
                "事故概要回顾",
                "时间线走查",
                "根因讨论",
                "行动项确认"
            ]
        )
```

## 容量规划

容量规划是确保系统能够满足未来需求的关键 SRE 实践。

### 容量规划流程

```
┌─────────────────────────────────────────────────────────────────┐
│                       容量规划流程                               │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ 需求预测  │───▶│ 资源评估  │───▶│ 差距分析  │───▶│ 扩容决策  │
    └──────────┘    └──────────┘    └──────────┘    └──────────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
    业务增长预测     当前资源使用     识别瓶颈        制定计划
    季节性因素       性能基准线      容量缺口        预算审批
    特殊事件        利用率趋势      时间窗口        实施扩容
```

### 容量规划实现

```python
# capacity_planning.py - 容量规划系统

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import numpy as np
from scipy import stats

@dataclass
class ResourceMetrics:
    """资源指标"""
    cpu_usage: float      # CPU 使用率 (0-100)
    memory_usage: float   # 内存使用率 (0-100)
    disk_usage: float     # 磁盘使用率 (0-100)
    network_in: float     # 入站带宽 (Mbps)
    network_out: float    # 出站带宽 (Mbps)
    request_rate: float   # 请求速率 (req/s)
    latency_p99: float    # P99 延迟 (ms)

@dataclass
class CapacityThresholds:
    """容量阈值配置"""
    cpu_warning: float = 70.0
    cpu_critical: float = 85.0
    memory_warning: float = 75.0
    memory_critical: float = 90.0
    disk_warning: float = 80.0
    disk_critical: float = 90.0

class CapacityPlanner:
    """容量规划器"""

    def __init__(self, metrics_client, thresholds: CapacityThresholds = None):
        self.metrics = metrics_client
        self.thresholds = thresholds or CapacityThresholds()

    def get_current_capacity(self, service: str) -> Dict[str, ResourceMetrics]:
        """获取当前容量使用情况"""
        instances = self.metrics.get_instances(service)
        capacity = {}

        for instance in instances:
            metrics = ResourceMetrics(
                cpu_usage=self._query_metric(instance, "cpu_usage"),
                memory_usage=self._query_metric(instance, "memory_usage"),
                disk_usage=self._query_metric(instance, "disk_usage"),
                network_in=self._query_metric(instance, "network_in"),
                network_out=self._query_metric(instance, "network_out"),
                request_rate=self._query_metric(instance, "request_rate"),
                latency_p99=self._query_metric(instance, "latency_p99")
            )
            capacity[instance] = metrics

        return capacity

    def _query_metric(self, instance: str, metric: str) -> float:
        """查询单个指标"""
        query_map = {
            "cpu_usage": f'100 - (avg(irate(node_cpu_seconds_total{{instance="{instance}", mode="idle"}}[5m])) * 100)',
            "memory_usage": f'(1 - node_memory_MemAvailable_bytes{{instance="{instance}"}} / node_memory_MemTotal_bytes{{instance="{instance}"}}) * 100',
            "disk_usage": f'(1 - node_filesystem_avail_bytes{{instance="{instance}", mountpoint="/"}} / node_filesystem_size_bytes{{instance="{instance}", mountpoint="/"}}) * 100',
            "network_in": f'rate(node_network_receive_bytes_total{{instance="{instance}"}}[5m]) * 8 / 1000000',
            "network_out": f'rate(node_network_transmit_bytes_total{{instance="{instance}"}}[5m]) * 8 / 1000000',
            "request_rate": f'sum(rate(http_requests_total{{instance="{instance}"}}[5m]))',
            "latency_p99": f'histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket{{instance="{instance}"}}[5m]))) * 1000'
        }
        return self.metrics.query(query_map[metric])

    def forecast_capacity(self, service: str, days_ahead: int = 30) -> Dict:
        """预测未来容量需求"""
        # 获取历史数据（过去 90 天）
        historical_data = self._get_historical_data(service, days=90)

        forecasts = {}
        for metric, values in historical_data.items():
            # 使用线性回归预测
            x = np.arange(len(values))
            slope, intercept, r_value, p_value, std_err = stats.linregress(x, values)

            # 预测未来值
            future_x = len(values) + days_ahead
            predicted_value = slope * future_x + intercept

            # 计算置信区间
            confidence_interval = 1.96 * std_err * np.sqrt(1 + 1/len(values))

            forecasts[metric] = {
                "current": values[-1],
                "predicted": predicted_value,
                "confidence_low": predicted_value - confidence_interval,
                "confidence_high": predicted_value + confidence_interval,
                "growth_rate": slope * 30,  # 月增长率
                "r_squared": r_value ** 2
            }

        return forecasts

    def _get_historical_data(self, service: str, days: int) -> Dict[str, List[float]]:
        """获取历史数据"""
        end = datetime.now()
        start = end - timedelta(days=days)

        metrics = ["cpu_usage", "memory_usage", "disk_usage", "request_rate"]
        data = {}

        for metric in metrics:
            query = self._build_historical_query(service, metric)
            data[metric] = self.metrics.query_range(query, start, end, step="1d")

        return data

    def _build_historical_query(self, service: str, metric: str) -> str:
        """构建历史查询"""
        queries = {
            "cpu_usage": f'avg(100 - (avg by (instance) (irate(node_cpu_seconds_total{{service="{service}", mode="idle"}}[1h])) * 100))',
            "memory_usage": f'avg((1 - node_memory_MemAvailable_bytes{{service="{service}"}} / node_memory_MemTotal_bytes{{service="{service}"}}) * 100)',
            "disk_usage": f'avg((1 - node_filesystem_avail_bytes{{service="{service}", mountpoint="/"}} / node_filesystem_size_bytes{{service="{service}", mountpoint="/"}}) * 100)',
            "request_rate": f'sum(rate(http_requests_total{{service="{service}"}}[1h]))'
        }
        return queries[metric]

    def generate_capacity_report(self, service: str) -> Dict:
        """生成容量报告"""
        current = self.get_current_capacity(service)
        forecast = self.forecast_capacity(service)

        # 分析容量风险
        risks = []
        recommendations = []

        for metric, forecast_data in forecast.items():
            # 检查是否会超过阈值
            if metric == "cpu_usage":
                if forecast_data["predicted"] > self.thresholds.cpu_critical:
                    risks.append({
                        "metric": metric,
                        "severity": "critical",
                        "message": f"CPU 使用率预计将在 30 天内达到 {forecast_data['predicted']:.1f}%"
                    })
                    recommendations.append("增加 CPU 资源或优化 CPU 密集型操作")
                elif forecast_data["predicted"] > self.thresholds.cpu_warning:
                    risks.append({
                        "metric": metric,
                        "severity": "warning",
                        "message": f"CPU 使用率预计将在 30 天内达到 {forecast_data['predicted']:.1f}%"
                    })

            if metric == "memory_usage":
                if forecast_data["predicted"] > self.thresholds.memory_critical:
                    risks.append({
                        "metric": metric,
                        "severity": "critical",
                        "message": f"内存使用率预计将在 30 天内达到 {forecast_data['predicted']:.1f}%"
                    })
                    recommendations.append("增加内存或优化内存使用")

            if metric == "disk_usage":
                if forecast_data["predicted"] > self.thresholds.disk_critical:
                    risks.append({
                        "metric": metric,
                        "severity": "critical",
                        "message": f"磁盘使用率预计将在 30 天内达到 {forecast_data['predicted']:.1f}%"
                    })
                    recommendations.append("扩展磁盘空间或清理数据")

        return {
            "service": service,
            "generated_at": datetime.now().isoformat(),
            "current_capacity": {k: vars(v) for k, v in current.items()},
            "forecast_30d": forecast,
            "risks": risks,
            "recommendations": recommendations
        }

    def calculate_scaling_requirements(self, service: str,
                                       target_request_rate: float) -> Dict:
        """计算扩容需求"""
        current = self.get_current_capacity(service)

        # 计算当前每实例处理能力
        total_instances = len(current)
        avg_cpu = np.mean([m.cpu_usage for m in current.values()])
        avg_request_rate = np.mean([m.request_rate for m in current.values()])

        # 假设 CPU 70% 为健康运行阈值
        capacity_per_instance = avg_request_rate * (70 / avg_cpu) if avg_cpu > 0 else 0

        # 计算需要的实例数
        required_instances = np.ceil(target_request_rate / capacity_per_instance) if capacity_per_instance > 0 else float('inf')
        additional_instances = max(0, required_instances - total_instances)

        return {
            "current_instances": total_instances,
            "current_capacity_per_instance": capacity_per_instance,
            "total_current_capacity": capacity_per_instance * total_instances,
            "target_request_rate": target_request_rate,
            "required_instances": int(required_instances),
            "additional_instances_needed": int(additional_instances),
            "scaling_factor": required_instances / total_instances if total_instances > 0 else float('inf')
        }
```

### 自动扩缩容配置

```yaml
# kubernetes-hpa.yaml - Kubernetes 水平自动扩缩容

apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 50
  metrics:
    # CPU 指标
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70

    # 内存指标
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80

    # 自定义指标 - 请求速率
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"

    # 外部指标 - 消息队列长度
    - type: External
      external:
        metric:
          name: kafka_consumer_lag
          selector:
            matchLabels:
              topic: "orders"
        target:
          type: AverageValue
          averageValue: "100"

  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # 5 分钟稳定窗口
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
        - type: Pods
          value: 2
          periodSeconds: 60
      selectPolicy: Min  # 选择最保守的策略

    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max  # 快速扩容

---
# 垂直自动扩缩容 (VPA)
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: api-gateway-vpa
  namespace: production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  updatePolicy:
    updateMode: "Auto"  # 自动更新资源请求
  resourcePolicy:
    containerPolicies:
      - containerName: api-gateway
        minAllowed:
          cpu: 100m
          memory: 128Mi
        maxAllowed:
          cpu: 4
          memory: 8Gi
        controlledResources: ["cpu", "memory"]
```

## SRE 工具链

### 监控与可观测性

```yaml
# observability-stack.yaml - 可观测性工具栈配置

monitoring:
  metrics:
    tool: "Prometheus"
    retention: "30d"
    scrape_interval: "15s"
    federation: true

  logging:
    tool: "Loki"
    retention: "14d"
    index_period: "24h"

  tracing:
    tool: "Jaeger"
    sampling_rate: 0.1
    retention: "7d"

  visualization:
    tool: "Grafana"
    dashboards:
      - "SRE Overview"
      - "Service Health"
      - "Error Budget"
      - "On-call Metrics"

alerting:
  tool: "Alertmanager"
  integrations:
    - type: "pagerduty"
      severity: ["critical"]
    - type: "slack"
      severity: ["critical", "warning"]
      channel: "#sre-alerts"
    - type: "email"
      severity: ["warning", "info"]

status_page:
  tool: "Statuspage.io"
  components:
    - "API Gateway"
    - "Web Application"
    - "Database"
    - "CDN"
  metrics:
    - "Uptime"
    - "Response Time"
```

### SRE 仪表板

```json
{
  "dashboard": {
    "title": "SRE Overview Dashboard",
    "panels": [
      {
        "title": "服务可用性 (30天)",
        "type": "stat",
        "targets": [
          {
            "expr": "avg_over_time(up{job=~\".*\"}[30d]) * 100",
            "legendFormat": "可用性"
          }
        ],
        "thresholds": [
          {"value": 99.9, "color": "green"},
          {"value": 99.0, "color": "yellow"},
          {"value": 0, "color": "red"}
        ]
      },
      {
        "title": "错误预算剩余",
        "type": "gauge",
        "targets": [
          {
            "expr": "(1 - (sum(rate(http_requests_total{status=~\"5..\"}[30d])) / sum(rate(http_requests_total[30d])))) / 0.001 * 100",
            "legendFormat": "剩余预算 %"
          }
        ]
      },
      {
        "title": "P99 延迟趋势",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.99, sum by (le, service) (rate(http_request_duration_seconds_bucket[5m]))) * 1000",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "请求速率",
        "type": "graph",
        "targets": [
          {
            "expr": "sum by (service) (rate(http_requests_total[5m]))",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "On-call 告警统计",
        "type": "table",
        "targets": [
          {
            "expr": "count by (alertname, severity) (ALERTS{alertstate=\"firing\"})",
            "legendFormat": "{{alertname}}"
          }
        ]
      }
    ]
  }
}
```

## 最佳实践

### SRE 成熟度模型

```
┌─────────────────────────────────────────────────────────────────┐
│                      SRE 成熟度等级                              │
└─────────────────────────────────────────────────────────────────┘

Level 1: 基础级
├── 基本监控覆盖
├── 手动事故响应
├── 无正式 SLO
└── 反应式运维

Level 2: 发展级
├── SLI/SLO 已定义
├── 有 On-call 轮换
├── 基本自动化
└── 事后分析流程

Level 3: 成熟级
├── 错误预算驱动决策
├── 全面可观测性
├── 高度自动化
├── 无责文化
└── 容量规划

Level 4: 优化级
├── 预测性分析
├── 混沌工程
├── 平台化 SRE
└── SRE 即服务
```

### 推荐实践清单

```markdown
## SRE 实践检查清单

### 服务水平管理
- [ ] 为每个核心服务定义 SLI
- [ ] 设定合理的 SLO 目标
- [ ] 实施错误预算策略
- [ ] 定期评审和调整 SLO

### 监控与告警
- [ ] 实现三大支柱：日志、指标、追踪
- [ ] 告警与 SLO 对齐
- [ ] 减少告警噪音（< 5% 误报率）
- [ ] 每个告警都有 runbook

### 事故管理
- [ ] 明确的事故等级定义
- [ ] 完善的响应流程
- [ ] 角色和职责明确
- [ ] 无责事后分析文化

### On-call
- [ ] 合理的轮换周期
- [ ] 充足的休息时间
- [ ] 完善的交接流程
- [ ] 定期 On-call 健康评估

### 自动化
- [ ] 基础设施即代码
- [ ] 自动化部署流水线
- [ ] 自动化故障恢复
- [ ] 减少人工操作（< 50% 时间）

### 容量管理
- [ ] 定期容量评审
- [ ] 自动扩缩容配置
- [ ] 容量预测机制
- [ ] 成本优化策略
```

## 面试要点

### 常见面试问题

**Q1: 什么是 SLI、SLO、SLA？它们之间的关系是什么？**

- SLI（服务水平指标）：可量化的服务行为度量，如可用性、延迟、吞吐量
- SLO（服务水平目标）：SLI 的目标值，是内部的可靠性目标
- SLA（服务水平协议）：与客户签订的正式合同，包含 SLO 承诺和违约后果
- 关系：SLI 是测量手段，SLO 是内部目标，SLA 是外部承诺

**Q2: 解释错误预算的概念及其重要性**

错误预算 = 100% - SLO。例如 SLO 为 99.9%，则错误预算为 0.1%。
重要性：
- 将可靠性目标量化为可消耗的资源
- 平衡可靠性和创新速度
- 为发布决策提供数据支撑
- 促进开发和运维团队协作

**Q3: 描述一个你处理过的严重事故的过程**

按以下框架回答：
1. 检测：如何发现问题
2. 响应：如何组织响应团队
3. 缓解：采取了什么措施
4. 解决：最终如何修复
5. 复盘：学到了什么教训

**Q4: 如何设计一个好的 On-call 制度？**

- 合理的轮换周期（通常一周）
- 明确的升级路径
- 充足的休息时间
- 高质量的告警（减少噪音）
- 完善的 runbook
- 定期回顾和改进

**Q5: 容量规划的关键步骤是什么？**

1. 需求预测：业务增长、季节性因素
2. 资源评估：当前使用情况和性能基准
3. 差距分析：识别瓶颈和容量缺口
4. 扩容决策：制定计划、预算审批
5. 实施和验证：执行扩容并验证效果

## 延伸阅读

### 官方资源

- [Google SRE 书籍](https://sre.google/books/) - SRE 权威指南
- [SRE Workbook](https://sre.google/workbook/table-of-contents/) - 实践手册
- [Prometheus 官方文档](https://prometheus.io/docs/)

### 推荐书籍

- 《Site Reliability Engineering》 - Google SRE 团队
- 《The Site Reliability Workbook》 - 实践指南
- 《Seeking SRE》 - 多种 SRE 实践视角
- 《Implementing Service Level Objectives》 - SLO 实施指南

### 社区资源

| 资源 | 链接 | 说明 |
|------|------|------|
| SRE Weekly | https://sreweekly.com | 每周 SRE 新闻 |
| Last Week in AWS | https://lastweekinaws.com | AWS 相关更新 |
| Awesome SRE | https://github.com/dastergon/awesome-sre | 资源集合 |
| SREcon | https://www.usenix.org/conferences/byname/925 | SRE 会议 |

---

通过本文的学习，你应该已经掌握了 SRE 的核心概念、关键实践和工具方法。SRE 不仅仅是一套技术实践，更是一种将工程思维应用于运维的文化。在实际工作中，建议从定义服务的 SLI/SLO 开始，逐步建立完善的可观测性体系、事故响应流程和自动化能力，持续提升系统的可靠性和团队的效率。
