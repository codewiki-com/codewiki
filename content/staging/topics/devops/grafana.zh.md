---
title: Grafana 可视化监控指南
description: 掌握Grafana，构建专业的监控仪表盘
track: devops
section: observability
difficulty: intermediate
tags:
  - Grafana
  - 监控
  - 可视化
  - 仪表盘
status: imported
origin: old/src/content/docs/devops/grafana.zh.md
divergence: 0.219
issues: []
legacy:
  category: DevOps
  subcategory: Observability
  order: 17
  lastUpdated: 2026-01-07
---

## 概念解释

Grafana 是一款开源的数据可视化和监控平台，支持多种数据源，能够创建美观、交互式的仪表盘。它最初由 Torkel Odegaard 于 2014 年创建，现已发展成为可观测性领域最受欢迎的可视化工具之一。

### 核心特性

Grafana 具备以下核心特性：

- **多数据源支持**：原生支持 Prometheus、InfluxDB、Elasticsearch、MySQL 等数十种数据源
- **丰富的可视化**：提供图表、仪表盘、热力图、表格等多种面板类型
- **强大的查询编辑器**：针对不同数据源提供专用的查询编辑器
- **灵活的告警系统**：支持多种告警规则和通知渠道
- **模板变量**：通过变量实现仪表盘的动态过滤和复用
- **插件生态**：丰富的社区插件扩展功能
- **团队协作**：完善的用户权限和团队管理

### 适用场景

Grafana 特别适合以下场景：

1. **基础设施监控**：服务器、网络设备、容器的实时监控
2. **应用性能监控（APM）**：应用程序的性能指标可视化
3. **业务指标展示**：业务 KPI 的实时仪表盘
4. **日志分析**：结合 Loki 或 Elasticsearch 进行日志可视化
5. **IoT 数据展示**：物联网设备数据的实时监控

## Grafana 架构与数据源

### 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Grafana 架构                                │
└─────────────────────────────────────────────────────────────────────┘
                                   │
    ┌──────────────────────────────┼──────────────────────────────┐
    │                              │                              │
    ▼                              ▼                              ▼
┌─────────────┐           ┌─────────────────┐           ┌─────────────────┐
│  前端层     │           │    后端服务      │           │    存储层       │
│  (React)   │◄─────────►│  (Go Server)    │◄─────────►│   (SQLite/     │
│            │           │                 │           │  PostgreSQL/   │
└─────────────┘           └─────────────────┘           │    MySQL)      │
                                   │                    └─────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐        ┌─────────────────┐        ┌─────────────────┐
│  Prometheus   │        │    InfluxDB     │        │  Elasticsearch  │
│  (时序数据)    │        │   (时序数据)     │        │   (日志数据)     │
└───────────────┘        └─────────────────┘        └─────────────────┘
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   │
                          ┌─────────────────┐
                          │   告警通知      │
                          │ (Slack/Email/  │
                          │  Webhook等)    │
                          └─────────────────┘
```

### 核心组件

#### Grafana Server

Grafana Server 是用 Go 语言编写的后端服务，负责：

- 处理 API 请求
- 执行数据源查询
- 管理用户认证和授权
- 处理告警规则
- 提供插件管理

#### 前端应用

基于 React 构建的单页应用，提供：

- 仪表盘编辑器
- 面板配置界面
- 查询编辑器
- 告警管理界面

#### 数据库

存储 Grafana 的配置数据：

- 仪表盘定义
- 用户和组织信息
- 数据源配置
- 告警规则

### 数据源配置

#### Prometheus 数据源配置

```yaml
# 通过 provisioning 配置 Prometheus 数据源
# /etc/grafana/provisioning/datasources/prometheus.yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
    jsonData:
      timeInterval: "15s"
      httpMethod: POST
      manageAlerts: true
      prometheusType: Prometheus
      prometheusVersion: "2.40.0"
```

#### InfluxDB 数据源配置

```yaml
# /etc/grafana/provisioning/datasources/influxdb.yaml
apiVersion: 1

datasources:
  - name: InfluxDB
    type: influxdb
    access: proxy
    url: http://influxdb:8086
    jsonData:
      version: Flux
      organization: myorg
      defaultBucket: monitoring
      tlsSkipVerify: true
    secureJsonData:
      token: ${INFLUXDB_TOKEN}
```

#### Elasticsearch 数据源配置

```yaml
# /etc/grafana/provisioning/datasources/elasticsearch.yaml
apiVersion: 1

datasources:
  - name: Elasticsearch
    type: elasticsearch
    access: proxy
    url: http://elasticsearch:9200
    jsonData:
      index: "logs-*"
      timeField: "@timestamp"
      esVersion: "8.0.0"
      maxConcurrentShardRequests: 5
      logMessageField: message
      logLevelField: level
```

#### Loki 数据源配置

```yaml
# /etc/grafana/provisioning/datasources/loki.yaml
apiVersion: 1

datasources:
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
    jsonData:
      maxLines: 1000
      derivedFields:
        - datasourceUid: tempo
          matcherRegex: "traceID=(\\w+)"
          name: TraceID
          url: "$${__value.raw}"
```

## 仪表盘设计原则

### 设计金字塔

```
                    ┌─────────────┐
                    │   战略层    │  ← 高管视角：业务 KPI
                    │  (概览)     │
                    └─────────────┘
                   ╱               ╲
            ┌─────────────┐  ┌─────────────┐
            │   战术层     │  │   战术层    │  ← 团队视角：服务健康度
            │ (服务概览)   │  │ (服务概览)  │
            └─────────────┘  └─────────────┘
           ╱         ╲              ╱        ╲
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ 操作层  │ │ 操作层  │ │ 操作层  │ │ 操作层  │  ← 工程师视角：详细指标
    │(详细)   │ │(详细)   │ │(详细)   │ │(详细)   │
    └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### USE 方法仪表盘

USE（Utilization, Saturation, Errors）方法适用于资源监控：

```json
{
  "title": "系统资源 USE 方法仪表盘",
  "panels": [
    {
      "title": "CPU 利用率 (Utilization)",
      "type": "gauge",
      "targets": [
        {
          "expr": "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
          "legendFormat": "CPU 使用率"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "thresholds": {
            "steps": [
              {"color": "green", "value": null},
              {"color": "yellow", "value": 70},
              {"color": "red", "value": 90}
            ]
          },
          "unit": "percent",
          "max": 100
        }
      }
    },
    {
      "title": "CPU 饱和度 (Saturation)",
      "type": "timeseries",
      "targets": [
        {
          "expr": "node_load1",
          "legendFormat": "1分钟负载"
        },
        {
          "expr": "node_load5",
          "legendFormat": "5分钟负载"
        },
        {
          "expr": "count(node_cpu_seconds_total{mode=\"idle\"})",
          "legendFormat": "CPU 核心数"
        }
      ]
    },
    {
      "title": "系统错误 (Errors)",
      "type": "stat",
      "targets": [
        {
          "expr": "increase(node_vmstat_oom_kill[1h])",
          "legendFormat": "OOM Kill 次数"
        }
      ]
    }
  ]
}
```

### RED 方法仪表盘

RED（Rate, Errors, Duration）方法适用于服务监控：

```json
{
  "title": "API 服务 RED 方法仪表盘",
  "panels": [
    {
      "title": "请求速率 (Rate)",
      "type": "timeseries",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total[5m])) by (handler)",
          "legendFormat": "{{handler}}"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "reqps"
        }
      }
    },
    {
      "title": "错误率 (Errors)",
      "type": "timeseries",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
          "legendFormat": "错误率"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "percent",
          "thresholds": {
            "steps": [
              {"color": "green", "value": null},
              {"color": "yellow", "value": 1},
              {"color": "red", "value": 5}
            ]
          }
        }
      }
    },
    {
      "title": "请求延迟 (Duration)",
      "type": "timeseries",
      "targets": [
        {
          "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
          "legendFormat": "P50"
        },
        {
          "expr": "histogram_quantile(0.90, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
          "legendFormat": "P90"
        },
        {
          "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
          "legendFormat": "P99"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "s"
        }
      }
    }
  ]
}
```

### 仪表盘布局最佳实践

1. **从上到下，从粗到细**：概览信息放在顶部，详细信息放在底部
2. **从左到右，按时间顺序**：输入在左，输出在右
3. **使用行分组**：相关面板放在同一行
4. **统一时间范围**：确保所有面板使用相同的时间范围
5. **添加文档链接**：在面板中添加链接到相关文档

## 面板类型与配置

### Time Series（时间序列图）

最常用的面板类型，用于展示指标随时间的变化：

```json
{
  "type": "timeseries",
  "title": "HTTP 请求延迟",
  "targets": [
    {
      "datasource": {"type": "prometheus"},
      "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, method))",
      "legendFormat": "{{method}} P95"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "color": {
        "mode": "palette-classic"
      },
      "custom": {
        "axisCenteredZero": false,
        "axisColorMode": "text",
        "axisLabel": "延迟",
        "drawStyle": "line",
        "fillOpacity": 10,
        "gradientMode": "none",
        "lineInterpolation": "smooth",
        "lineWidth": 2,
        "pointSize": 5,
        "showPoints": "auto",
        "spanNulls": false,
        "stacking": {
          "mode": "none"
        }
      },
      "unit": "s",
      "thresholds": {
        "mode": "absolute",
        "steps": [
          {"color": "green", "value": null},
          {"color": "yellow", "value": 0.5},
          {"color": "red", "value": 1}
        ]
      }
    }
  },
  "options": {
    "legend": {
      "displayMode": "table",
      "placement": "bottom",
      "calcs": ["mean", "max", "last"]
    },
    "tooltip": {
      "mode": "multi",
      "sort": "desc"
    }
  }
}
```

### Stat（统计面板）

用于展示单个重要指标的当前值：

```json
{
  "type": "stat",
  "title": "当前活跃用户",
  "targets": [
    {
      "expr": "sum(active_users)",
      "legendFormat": "活跃用户"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "color": {
        "mode": "thresholds"
      },
      "thresholds": {
        "steps": [
          {"color": "red", "value": null},
          {"color": "yellow", "value": 100},
          {"color": "green", "value": 500}
        ]
      },
      "mappings": [],
      "unit": "none"
    }
  },
  "options": {
    "reduceOptions": {
      "calcs": ["lastNotNull"],
      "fields": "",
      "values": false
    },
    "orientation": "auto",
    "textMode": "auto",
    "colorMode": "value",
    "graphMode": "area",
    "justifyMode": "auto"
  }
}
```

### Gauge（仪表盘）

用于展示指标相对于阈值的位置：

```json
{
  "type": "gauge",
  "title": "磁盘使用率",
  "targets": [
    {
      "expr": "(1 - node_filesystem_avail_bytes{mountpoint=\"/\"} / node_filesystem_size_bytes{mountpoint=\"/\"}) * 100",
      "legendFormat": "磁盘使用率"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "color": {
        "mode": "thresholds"
      },
      "thresholds": {
        "steps": [
          {"color": "green", "value": null},
          {"color": "yellow", "value": 70},
          {"color": "orange", "value": 85},
          {"color": "red", "value": 95}
        ]
      },
      "unit": "percent",
      "min": 0,
      "max": 100
    }
  },
  "options": {
    "reduceOptions": {
      "calcs": ["lastNotNull"]
    },
    "orientation": "auto",
    "showThresholdLabels": false,
    "showThresholdMarkers": true
  }
}
```

### Table（表格）

用于展示多维度数据的详细列表：

```json
{
  "type": "table",
  "title": "Pod 资源使用情况",
  "targets": [
    {
      "expr": "sum(container_memory_usage_bytes{namespace=\"production\"}) by (pod)",
      "format": "table",
      "instant": true,
      "legendFormat": ""
    }
  ],
  "fieldConfig": {
    "defaults": {
      "custom": {
        "align": "auto",
        "displayMode": "auto",
        "filterable": true
      }
    },
    "overrides": [
      {
        "matcher": {"id": "byName", "options": "Value"},
        "properties": [
          {"id": "displayName", "value": "内存使用"},
          {"id": "unit", "value": "bytes"},
          {"id": "custom.displayMode", "value": "color-background"},
          {"id": "thresholds", "value": {
            "steps": [
              {"color": "green", "value": null},
              {"color": "yellow", "value": 536870912},
              {"color": "red", "value": 1073741824}
            ]
          }}
        ]
      }
    ]
  },
  "options": {
    "showHeader": true,
    "sortBy": [{"desc": true, "displayName": "Value"}],
    "footer": {
      "enablePagination": true
    }
  }
}
```

### Heatmap（热力图）

用于展示数据分布和密度：

```json
{
  "type": "heatmap",
  "title": "请求延迟分布",
  "targets": [
    {
      "expr": "sum(increase(http_request_duration_seconds_bucket[5m])) by (le)",
      "format": "heatmap",
      "legendFormat": "{{le}}"
    }
  ],
  "options": {
    "calculate": false,
    "cellGap": 1,
    "color": {
      "mode": "scheme",
      "scheme": "Spectral",
      "steps": 64
    },
    "yAxis": {
      "unit": "s"
    },
    "legend": {
      "show": true
    },
    "tooltip": {
      "show": true,
      "yHistogram": true
    }
  }
}
```

### Logs（日志面板）

用于展示日志数据：

```json
{
  "type": "logs",
  "title": "应用日志",
  "targets": [
    {
      "datasource": {"type": "loki"},
      "expr": "{app=\"myapp\"} |= \"error\"",
      "legendFormat": ""
    }
  ],
  "options": {
    "showTime": true,
    "showLabels": true,
    "showCommonLabels": false,
    "wrapLogMessage": true,
    "prettifyLogMessage": false,
    "enableLogDetails": true,
    "dedupStrategy": "none",
    "sortOrder": "Descending"
  }
}
```

## 查询编写（PromQL）

### 基础查询

```promql
# 瞬时向量查询
http_requests_total{job="api-server", method="GET"}

# 范围向量查询
http_requests_total{job="api-server"}[5m]

# 使用正则表达式匹配标签
http_requests_total{job=~"api-.*", status!~"2.."}
```

### 常用函数

#### rate 和 irate

```promql
# rate: 计算每秒平均增长率（推荐用于告警和长时间范围）
rate(http_requests_total[5m])

# irate: 基于最后两个数据点计算瞬时增长率（适合快速变化的计数器）
irate(http_requests_total[5m])
```

#### increase

```promql
# 计算时间范围内的总增量
increase(http_requests_total[1h])

# 每小时请求数
increase(http_requests_total[1h])
```

#### histogram_quantile

```promql
# 计算 P50 延迟
histogram_quantile(0.50,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)

# 计算 P95 延迟，按服务分组
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
)

# 计算 P99 延迟
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)
```

#### 聚合函数

```promql
# 求和
sum(http_requests_total) by (service)

# 平均值
avg(node_cpu_seconds_total{mode="idle"}) by (instance)

# 最大值
max(container_memory_usage_bytes) by (pod)

# 计数
count(up{job="api-server"} == 1)

# 分位数
quantile(0.95, http_request_duration_seconds)

# topk - 获取前 N 个最大值
topk(10, sum(rate(http_requests_total[5m])) by (endpoint))

# bottomk - 获取前 N 个最小值
bottomk(5, sum(rate(http_requests_total[5m])) by (endpoint))
```

### 复杂查询示例

#### 错误率计算

```promql
# 5xx 错误率
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))
* 100
```

#### 服务可用性（SLI）

```promql
# 计算过去 30 天的可用性
(
  1 - (
    sum(increase(http_requests_total{status=~"5.."}[30d]))
    /
    sum(increase(http_requests_total[30d]))
  )
) * 100
```

#### CPU 使用率

```promql
# 单实例 CPU 使用率
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# 集群平均 CPU 使用率
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

#### 内存使用率

```promql
# 内存使用率
(
  node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes
)
/ node_memory_MemTotal_bytes * 100
```

#### 磁盘 I/O

```promql
# 磁盘读取速率
rate(node_disk_read_bytes_total[5m])

# 磁盘写入速率
rate(node_disk_written_bytes_total[5m])

# 磁盘 IOPS
rate(node_disk_reads_completed_total[5m]) + rate(node_disk_writes_completed_total[5m])
```

#### 网络流量

```promql
# 网络接收速率
rate(node_network_receive_bytes_total{device!="lo"}[5m])

# 网络发送速率
rate(node_network_transmit_bytes_total{device!="lo"}[5m])
```

## 变量与模板

### 变量类型

#### Query 变量

从数据源动态获取值：

```yaml
# 获取所有命名空间
name: namespace
type: query
datasource: Prometheus
query: label_values(kube_namespace_labels, namespace)
refresh: On Dashboard Load
sort: Alphabetical (asc)

# 获取指定命名空间下的所有 Pod
name: pod
type: query
datasource: Prometheus
query: label_values(kube_pod_info{namespace="$namespace"}, pod)
refresh: On Time Range Change
sort: Alphabetical (asc)
```

#### Custom 变量

预定义的静态值列表：

```yaml
name: environment
type: custom
values: production, staging, development
default: production
multi: false
```

#### Interval 变量

用于动态调整时间间隔：

```yaml
name: interval
type: interval
values: 1m, 5m, 10m, 30m, 1h
auto: true
auto_count: 30
auto_min: 10s
```

### 在查询中使用变量

```promql
# 使用命名空间变量
sum(rate(http_requests_total{namespace="$namespace"}[5m])) by (service)

# 多选变量（使用正则）
sum(rate(http_requests_total{namespace=~"$namespace"}[$interval])) by (service)

# 在标签中使用变量
label_values(kube_pod_info{namespace="$namespace", pod=~"$pod"}, container)
```

### 变量链接

实现仪表盘间的跳转：

```json
{
  "fieldConfig": {
    "defaults": {
      "links": [
        {
          "title": "查看 Pod 详情",
          "url": "/d/pod-detail?var-namespace=${__data.fields.namespace}&var-pod=${__data.fields.pod}",
          "targetBlank": true
        },
        {
          "title": "查看日志",
          "url": "/explore?left=%7B%22datasource%22:%22Loki%22,%22queries%22:%5B%7B%22expr%22:%22%7Bpod%3D%5C%22${__data.fields.pod}%5C%22%7D%22%7D%5D%7D",
          "targetBlank": true
        }
      ]
    }
  }
}
```

### 动态面板标题

```json
{
  "title": "${namespace} - HTTP 请求统计",
  "description": "显示 ${namespace} 命名空间中所有服务的请求统计"
}
```

## 告警配置

### Grafana Alerting 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Grafana Alerting                        │
└─────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
┌─────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Alert Rules │      │ Contact Points  │      │ Notification    │
│ (告警规则)   │      │ (联系点)        │      │ Policies        │
│             │      │                 │      │ (通知策略)       │
└─────────────┘      └─────────────────┘      └─────────────────┘
       │                      │                        │
       │                      │                        │
       ▼                      ▼                        ▼
┌─────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ - PromQL    │      │ - Slack         │      │ - 路由规则       │
│ - 阈值      │      │ - Email         │      │ - 静默规则       │
│ - 评估周期   │      │ - PagerDuty    │      │ - 分组策略       │
└─────────────┘      │ - Webhook       │      └─────────────────┘
                     └─────────────────┘
```

### 告警规则配置

```yaml
# /etc/grafana/provisioning/alerting/rules.yaml
apiVersion: 1

groups:
  - orgId: 1
    name: Infrastructure Alerts
    folder: Infrastructure
    interval: 1m
    rules:
      # 高 CPU 使用率告警
      - uid: cpu-high-usage
        title: CPU 使用率过高
        condition: C
        data:
          - refId: A
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: prometheus
            model:
              expr: 100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
              intervalMs: 1000
              maxDataPoints: 43200
          - refId: B
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: __expr__
            model:
              conditions:
                - evaluator:
                    params:
                      - 80
                    type: gt
                  operator:
                    type: and
                  query:
                    params:
                      - A
                  reducer:
                    type: avg
              type: classic_conditions
          - refId: C
            relativeTimeRange:
              from: 300
              to: 0
            datasourceUid: __expr__
            model:
              expression: B
              type: threshold
        for: 5m
        annotations:
          summary: "CPU 使用率超过 80%"
          description: "实例 {{ $labels.instance }} 的 CPU 使用率已达到 {{ $values.A }}%"
          runbook_url: "https://wiki.example.com/runbooks/cpu-high"
        labels:
          severity: warning
          team: infrastructure
        noDataState: NoData
        execErrState: Error

      # 内存使用率告警
      - uid: memory-high-usage
        title: 内存使用率过高
        condition: C
        data:
          - refId: A
            datasourceUid: prometheus
            model:
              expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100
          - refId: B
            datasourceUid: __expr__
            model:
              conditions:
                - evaluator:
                    params:
                      - 90
                    type: gt
                  operator:
                    type: and
                  query:
                    params:
                      - A
                  reducer:
                    type: last
              type: classic_conditions
          - refId: C
            datasourceUid: __expr__
            model:
              expression: B
              type: threshold
        for: 5m
        annotations:
          summary: "内存使用率超过 90%"
          description: "实例 {{ $labels.instance }} 的内存使用率已达到 {{ $values.A }}%"
        labels:
          severity: critical
          team: infrastructure
```

### 联系点配置

```yaml
# /etc/grafana/provisioning/alerting/contactpoints.yaml
apiVersion: 1

contactPoints:
  - orgId: 1
    name: Slack Critical
    receivers:
      - uid: slack-critical
        type: slack
        settings:
          url: ${SLACK_WEBHOOK_URL}
          recipient: "#alerts-critical"
          username: Grafana Alerts
          icon_emoji: ":rotating_light:"
          mentionGroups: "S12345678"
          title: |
            {{ template "slack.title" . }}
          text: |
            {{ template "slack.message" . }}
        disableResolveMessage: false

  - orgId: 1
    name: Email Team
    receivers:
      - uid: email-team
        type: email
        settings:
          addresses: "team@example.com"
          singleEmail: true
          message: |
            {{ template "email.message" . }}

  - orgId: 1
    name: PagerDuty
    receivers:
      - uid: pagerduty
        type: pagerduty
        settings:
          integrationKey: ${PAGERDUTY_INTEGRATION_KEY}
          severity: "{{ .CommonLabels.severity }}"
          class: "{{ .CommonLabels.alertname }}"
          component: "{{ .CommonLabels.job }}"
```

### 通知策略配置

```yaml
# /etc/grafana/provisioning/alerting/policies.yaml
apiVersion: 1

policies:
  - orgId: 1
    receiver: Slack Critical
    group_by:
      - alertname
      - cluster
    group_wait: 30s
    group_interval: 5m
    repeat_interval: 4h
    routes:
      - receiver: PagerDuty
        matchers:
          - severity = critical
        continue: true
      - receiver: Email Team
        matchers:
          - severity = warning
        group_wait: 1m
        repeat_interval: 1h
      - receiver: Slack Critical
        matchers:
          - team = infrastructure
```

### 告警模板

```yaml
# /etc/grafana/provisioning/alerting/templates.yaml
apiVersion: 1

templates:
  - orgId: 1
    name: custom_templates
    template: |
      {{ define "slack.title" }}
      [{{ .Status | toUpper }}{{ if eq .Status "firing" }}:{{ .Alerts.Firing | len }}{{ end }}] {{ .CommonLabels.alertname }}
      {{ end }}

      {{ define "slack.message" }}
      {{ range .Alerts }}
      *告警:* {{ .Labels.alertname }}
      *严重程度:* {{ .Labels.severity }}
      *摘要:* {{ .Annotations.summary }}
      *描述:* {{ .Annotations.description }}
      {{ if .Annotations.runbook_url }}*Runbook:* {{ .Annotations.runbook_url }}{{ end }}
      *开始时间:* {{ .StartsAt.Format "2006-01-02 15:04:05" }}
      {{ end }}
      {{ end }}

      {{ define "email.message" }}
      {{ range .Alerts }}
      告警名称: {{ .Labels.alertname }}
      严重程度: {{ .Labels.severity }}
      实例: {{ .Labels.instance }}
      摘要: {{ .Annotations.summary }}
      描述: {{ .Annotations.description }}
      开始时间: {{ .StartsAt.Format "2006-01-02 15:04:05" }}
      ---
      {{ end }}
      {{ end }}
```

## 用户与权限管理

### 组织与用户层级

```
┌─────────────────────────────────────────────────────────────┐
│                    Grafana 权限模型                         │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   Organization  │   │   Organization  │   │   Organization  │
│   (组织 A)      │   │   (组织 B)      │   │   (组织 C)      │
└─────────────────┘   └─────────────────┘   └─────────────────┘
        │
        ├───── Admin (管理员)
        │         └── 完全控制权限
        │
        ├───── Editor (编辑者)
        │         └── 可编辑仪表盘和数据源
        │
        └───── Viewer (查看者)
                  └── 只读访问
```

### 基于角色的访问控制（RBAC）

```yaml
# grafana.ini RBAC 配置
[rbac]
# 启用 RBAC
enabled = true

# 权限缓存时间
permission_cache = true
```

### 团队权限配置

```bash
# 创建团队
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
  -d '{
    "name": "Backend Team",
    "email": "backend@example.com"
  }' \
  http://localhost:3000/api/teams

# 添加团队成员
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
  -d '{
    "userId": 2
  }' \
  http://localhost:3000/api/teams/1/members

# 设置仪表盘权限
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
  -d '{
    "items": [
      {
        "teamId": 1,
        "permission": 2
      },
      {
        "userId": 3,
        "permission": 1
      }
    ]
  }' \
  http://localhost:3000/api/dashboards/uid/abc123/permissions
```

### LDAP/OAuth 集成

```ini
# grafana.ini OAuth 配置示例（GitHub）
[auth.github]
enabled = true
allow_sign_up = true
client_id = YOUR_CLIENT_ID
client_secret = YOUR_CLIENT_SECRET
scopes = user:email,read:org
auth_url = https://github.com/login/oauth/authorize
token_url = https://github.com/login/oauth/access_token
api_url = https://api.github.com/user
team_ids =
allowed_organizations = myorg
role_attribute_path = contains(groups[*], 'admins') && 'Admin' || contains(groups[*], 'editors') && 'Editor' || 'Viewer'
```

```ini
# LDAP 配置
[auth.ldap]
enabled = true
config_file = /etc/grafana/ldap.toml
allow_sign_up = true

# ldap.toml
[[servers]]
host = "ldap.example.com"
port = 389
use_ssl = false
start_tls = true
ssl_skip_verify = false

bind_dn = "cn=admin,dc=example,dc=com"
bind_password = '${LDAP_ADMIN_PASSWORD}'

search_filter = "(sAMAccountName=%s)"
search_base_dns = ["dc=example,dc=com"]

[servers.attributes]
name = "givenName"
surname = "sn"
username = "sAMAccountName"
member_of = "memberOf"
email =  "email"

[[servers.group_mappings]]
group_dn = "cn=admins,ou=groups,dc=example,dc=com"
org_role = "Admin"

[[servers.group_mappings]]
group_dn = "cn=editors,ou=groups,dc=example,dc=com"
org_role = "Editor"

[[servers.group_mappings]]
group_dn = "*"
org_role = "Viewer"
```

## 仪表盘即代码

### Provisioning 配置

```yaml
# /etc/grafana/provisioning/dashboards/default.yaml
apiVersion: 1

providers:
  - name: 'Infrastructure'
    orgId: 1
    folder: 'Infrastructure'
    folderUid: 'infrastructure'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 30
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards/infrastructure
      foldersFromFilesStructure: true

  - name: 'Applications'
    orgId: 1
    folder: 'Applications'
    folderUid: 'applications'
    type: file
    disableDeletion: false
    options:
      path: /var/lib/grafana/dashboards/applications
```

### Grafonnet（Jsonnet 库）

```jsonnet
// dashboard.jsonnet
local grafana = import 'grafonnet/grafana.libsonnet';
local dashboard = grafana.dashboard;
local row = grafana.row;
local prometheus = grafana.prometheus;
local template = grafana.template;
local graphPanel = grafana.graphPanel;
local statPanel = grafana.statPanel;

local promDatasource = 'Prometheus';

// 定义变量
local namespaceTemplate = template.new(
  name='namespace',
  datasource=promDatasource,
  query='label_values(kube_namespace_labels, namespace)',
  refresh='load',
  sort=1,
);

// 定义面板
local cpuPanel = graphPanel.new(
  title='CPU 使用率',
  datasource=promDatasource,
  format='percent',
  min=0,
  max=100,
).addTarget(
  prometheus.target(
    expr='100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
    legendFormat='{{ instance }}',
  )
);

local memoryPanel = graphPanel.new(
  title='内存使用率',
  datasource=promDatasource,
  format='percent',
  min=0,
  max=100,
).addTarget(
  prometheus.target(
    expr='(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100',
    legendFormat='{{ instance }}',
  )
);

local requestsStatPanel = statPanel.new(
  title='请求总数',
  datasource=promDatasource,
).addTarget(
  prometheus.target(
    expr='sum(increase(http_requests_total[24h]))',
    legendFormat='24h 请求数',
  )
);

// 组装仪表盘
dashboard.new(
  title='系统概览仪表盘',
  schemaVersion=30,
  tags=['infrastructure', 'system'],
  time_from='now-1h',
  refresh='30s',
  uid='system-overview',
)
.addTemplate(namespaceTemplate)
.addRow(
  row.new(title='概览')
  .addPanel(requestsStatPanel, gridPos={x: 0, y: 0, w: 6, h: 4})
)
.addRow(
  row.new(title='系统资源')
  .addPanel(cpuPanel, gridPos={x: 0, y: 4, w: 12, h: 8})
  .addPanel(memoryPanel, gridPos={x: 12, y: 4, w: 12, h: 8})
)
```

编译 Jsonnet：

```bash
# 安装 jsonnet
brew install jsonnet

# 克隆 grafonnet 库
git clone https://github.com/grafana/grafonnet-lib.git

# 编译仪表盘
jsonnet -J grafonnet-lib dashboard.jsonnet > dashboard.json
```

### Terraform Provider

```hcl
# main.tf
terraform {
  required_providers {
    grafana = {
      source  = "grafana/grafana"
      version = "~> 2.0"
    }
  }
}

provider "grafana" {
  url  = "http://localhost:3000"
  auth = var.grafana_api_key
}

# 创建文件夹
resource "grafana_folder" "infrastructure" {
  title = "Infrastructure"
}

# 创建数据源
resource "grafana_data_source" "prometheus" {
  type = "prometheus"
  name = "Prometheus"
  url  = "http://prometheus:9090"

  json_data_encoded = jsonencode({
    httpMethod   = "POST"
    timeInterval = "15s"
  })
}

# 创建仪表盘
resource "grafana_dashboard" "system_overview" {
  folder = grafana_folder.infrastructure.id

  config_json = file("${path.module}/dashboards/system-overview.json")
}

# 创建告警联系点
resource "grafana_contact_point" "slack" {
  name = "Slack Alerts"

  slack {
    url       = var.slack_webhook_url
    recipient = "#alerts"
    title     = "{{ template \"slack.title\" . }}"
    text      = "{{ template \"slack.message\" . }}"
  }
}

# 创建告警通知策略
resource "grafana_notification_policy" "default" {
  contact_point = grafana_contact_point.slack.name
  group_by      = ["alertname", "cluster"]

  group_wait      = "30s"
  group_interval  = "5m"
  repeat_interval = "4h"

  policy {
    contact_point = grafana_contact_point.slack.name
    matcher {
      label = "severity"
      match = "="
      value = "critical"
    }
    continue = true
  }
}

# variables.tf
variable "grafana_api_key" {
  description = "Grafana API Key"
  type        = string
  sensitive   = true
}

variable "slack_webhook_url" {
  description = "Slack Webhook URL"
  type        = string
  sensitive   = true
}
```

### 仪表盘 CI/CD 流水线

```yaml
# .github/workflows/grafana-dashboards.yml
name: Grafana Dashboards CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'dashboards/**'
      - 'grafonnet/**'
  pull_request:
    branches: [main]
    paths:
      - 'dashboards/**'
      - 'grafonnet/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Jsonnet
        run: |
          wget https://github.com/google/jsonnet/releases/download/v0.20.0/jsonnet-bin-v0.20.0-linux.tar.gz
          tar -xzf jsonnet-bin-v0.20.0-linux.tar.gz
          sudo mv jsonnet /usr/local/bin/

      - name: Clone Grafonnet
        run: git clone --depth 1 https://github.com/grafana/grafonnet-lib.git

      - name: Compile Dashboards
        run: |
          mkdir -p compiled
          for file in dashboards/*.jsonnet; do
            jsonnet -J grafonnet-lib "$file" > "compiled/$(basename "$file" .jsonnet).json"
          done

      - name: Validate JSON
        run: |
          for file in compiled/*.json; do
            jq . "$file" > /dev/null
          done

      - name: Upload Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dashboards
          path: compiled/

  deploy:
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Download Artifacts
        uses: actions/download-artifact@v3
        with:
          name: dashboards
          path: compiled/

      - name: Deploy to Grafana
        env:
          GRAFANA_URL: ${{ secrets.GRAFANA_URL }}
          GRAFANA_API_KEY: ${{ secrets.GRAFANA_API_KEY }}
        run: |
          for file in compiled/*.json; do
            dashboard_name=$(basename "$file" .json)
            curl -X POST \
              -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
              -H "Content-Type: application/json" \
              -d "{\"dashboard\": $(cat "$file"), \"overwrite\": true, \"folderId\": 0}" \
              "${GRAFANA_URL}/api/dashboards/db"
          done
```

## 最佳实践

### 性能优化

```yaml
# grafana.ini 性能优化配置
[database]
# 使用 PostgreSQL 代替 SQLite（生产环境）
type = postgres
host = postgres:5432
name = grafana
user = grafana
password = ${GF_DATABASE_PASSWORD}
max_open_conn = 100
max_idle_conn = 50
conn_max_lifetime = 14400

[server]
# 启用 gzip 压缩
enable_gzip = true

[caching]
# 启用查询缓存（企业版）
enabled = true

[dataproxy]
# 数据代理超时设置
timeout = 300
dial_timeout = 10
keep_alive_seconds = 30
```

### 查询优化技巧

```promql
# 不推荐：在大数据集上进行高基数查询
sum(rate(http_requests_total[5m])) by (user_id)

# 推荐：先过滤再聚合
sum(rate(http_requests_total{status=~"5.."}[5m])) by (endpoint)

# 不推荐：使用过短的时间范围
rate(http_requests_total[30s])

# 推荐：使用至少 4 倍抓取间隔的时间范围
rate(http_requests_total[2m])

# 使用 recording rules 预计算复杂查询
# prometheus/rules/recording.yml
groups:
  - name: http_requests
    interval: 30s
    rules:
      - record: job:http_requests_total:rate5m
        expr: sum(rate(http_requests_total[5m])) by (job)
      - record: job:http_request_errors:rate5m
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) by (job)
```

### 仪表盘设计规范

```markdown
## 仪表盘命名规范

1. 使用清晰的层级结构：
   - `Infrastructure / Kubernetes / Cluster Overview`
   - `Applications / API Gateway / Performance`

2. 使用统一的 UID 格式：
   - `infra-k8s-cluster-overview`
   - `app-api-gateway-perf`

## 面板设计规范

1. 每个面板必须有：
   - 清晰的标题
   - 单位设置
   - 合适的阈值
   - 描述文档链接

2. 时间序列图：
   - 使用有意义的图例格式
   - 限制系列数量（通常不超过 10 条）
   - 设置合适的 Y 轴范围

3. 统计面板：
   - 选择合适的统计函数（last, avg, max）
   - 设置阈值颜色
   - 添加 sparkline 展示趋势
```

### 高可用部署

```yaml
# docker-compose.yml - Grafana HA 部署
version: '3.8'

services:
  grafana-1:
    image: grafana/grafana:10.2.0
    environment:
      - GF_DATABASE_TYPE=postgres
      - GF_DATABASE_HOST=postgres:5432
      - GF_DATABASE_NAME=grafana
      - GF_DATABASE_USER=grafana
      - GF_DATABASE_PASSWORD=${DB_PASSWORD}
      - GF_SESSION_PROVIDER=redis
      - GF_SESSION_PROVIDER_CONFIG=addr=redis:6379
      - GF_SERVER_ROOT_URL=https://grafana.example.com
    volumes:
      - grafana-data:/var/lib/grafana
      - ./provisioning:/etc/grafana/provisioning
    depends_on:
      - postgres
      - redis
    deploy:
      replicas: 2

  grafana-2:
    image: grafana/grafana:10.2.0
    environment:
      - GF_DATABASE_TYPE=postgres
      - GF_DATABASE_HOST=postgres:5432
      - GF_DATABASE_NAME=grafana
      - GF_DATABASE_USER=grafana
      - GF_DATABASE_PASSWORD=${DB_PASSWORD}
      - GF_SESSION_PROVIDER=redis
      - GF_SESSION_PROVIDER_CONFIG=addr=redis:6379
      - GF_SERVER_ROOT_URL=https://grafana.example.com
    volumes:
      - grafana-data:/var/lib/grafana
      - ./provisioning:/etc/grafana/provisioning
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=grafana
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=grafana
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis-data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - grafana-1
      - grafana-2

volumes:
  grafana-data:
  postgres-data:
  redis-data:
```

### 安全最佳实践

```ini
# grafana.ini 安全配置
[security]
# 禁用管理员密码更改提示
admin_password = ${GF_SECURITY_ADMIN_PASSWORD}
disable_initial_admin_creation = false

# Cookie 安全设置
cookie_secure = true
cookie_samesite = strict
strict_transport_security = true
strict_transport_security_max_age_seconds = 31536000

# 禁用嵌入
allow_embedding = false

# 内容安全策略
content_security_policy = true
content_security_policy_template = """script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'none'; font-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' grafana.com ws: wss:;"""

[users]
# 禁止用户自行注册
allow_sign_up = false
allow_org_create = false
auto_assign_org = true
auto_assign_org_role = Viewer

[auth.anonymous]
# 禁用匿名访问
enabled = false

[snapshots]
# 禁用公开快照
external_enabled = false
```

## 面试要点

### 基础概念题

**Q1: Grafana 和 Prometheus 的关系是什么？**

A: Grafana 和 Prometheus 是互补的工具：

- **Prometheus** 负责数据采集、存储和告警规则评估，是时序数据库
- **Grafana** 负责数据可视化，提供丰富的仪表盘和面板类型
- Prometheus 是 Grafana 最常用的数据源之一
- Grafana 可以查询 Prometheus 的指标数据并进行可视化展示
- Grafana 也支持配置基于 Prometheus 数据的告警

**Q2: Grafana 支持哪些类型的数据源？**

A: Grafana 支持多种类型的数据源：

1. **时序数据库**：Prometheus、InfluxDB、Graphite、OpenTSDB
2. **日志系统**：Loki、Elasticsearch
3. **追踪系统**：Jaeger、Tempo、Zipkin
4. **关系数据库**：MySQL、PostgreSQL、MSSQL
5. **云服务**：CloudWatch、Azure Monitor、Google Cloud Monitoring
6. **其他**：JSON API、CSV 文件等通过插件支持

**Q3: 什么是 Grafana 的 Provisioning？**

A: Provisioning 是 Grafana 的配置即代码功能，允许：

- 通过 YAML 文件预配置数据源、仪表盘、告警规则
- 支持 GitOps 工作流，将配置纳入版本控制
- 实现 Grafana 配置的自动化部署和一致性
- 配置文件放置在 `/etc/grafana/provisioning/` 目录下

### 实践应用题

**Q4: 如何设计一个有效的监控仪表盘？**

A: 设计有效仪表盘的关键原则：

1. **使用 USE/RED 方法论**
   - USE（Utilization, Saturation, Errors）用于资源监控
   - RED（Rate, Errors, Duration）用于服务监控

2. **层次化设计**
   - 顶层：概览仪表盘（业务 KPI、SLO）
   - 中层：服务级仪表盘（服务健康度）
   - 底层：详细指标仪表盘（调试用）

3. **布局原则**
   - 从上到下：概览到详细
   - 从左到右：输入到输出
   - 使用行和折叠分组相关面板

4. **可操作性**
   - 添加阈值和告警
   - 包含跳转链接到相关仪表盘
   - 添加文档和 Runbook 链接

**Q5: PromQL 中 rate 和 irate 的区别是什么？**

A: 主要区别：

- **rate**：计算整个时间范围内的平均增长率
  - 适合告警规则和长时间范围查询
  - 结果更平滑，不易产生毛刺
  - `rate(http_requests_total[5m])`

- **irate**：只使用最后两个数据点计算瞬时增长率
  - 适合展示快速变化的指标
  - 对时间范围内的峰值更敏感
  - `irate(http_requests_total[5m])`

- 建议：告警使用 rate，可视化根据需求选择

**Q6: 如何实现 Grafana 的高可用部署？**

A: 高可用部署要点：

1. **数据库后端**：使用 PostgreSQL 或 MySQL 替代默认的 SQLite
2. **会话存储**：使用 Redis 存储会话数据，实现多实例会话共享
3. **负载均衡**：在多个 Grafana 实例前部署负载均衡器
4. **配置同步**：使用 Provisioning 确保所有实例配置一致
5. **共享存储**：对于文件型配置，使用共享文件系统或对象存储

### 故障排查题

**Q7: 仪表盘查询很慢，如何优化？**

A: 查询优化策略：

1. **减少数据点**
   - 使用更大的查询间隔
   - 限制返回的时间序列数量

2. **使用 Recording Rules**
   - 预计算复杂查询
   - 减少实时计算开销

3. **优化 PromQL**
   - 先过滤再聚合
   - 避免高基数标签的 by 子句
   - 使用合适的时间范围

4. **Grafana 配置优化**
   - 启用查询缓存
   - 调整数据代理超时设置
   - 考虑使用 Mixed 数据源减少并发查询

**Q8: Grafana 告警没有触发，如何排查？**

A: 排查步骤：

1. **检查告警规则状态**
   - 在 Alerting -> Alert rules 中查看规则状态
   - 确认规则是否处于 Active 状态

2. **验证查询**
   - 在 Explore 中手动执行告警查询
   - 确认查询返回预期的数据

3. **检查评估设置**
   - 确认评估间隔和 Pending 时间设置正确
   - 检查 for 子句的持续时间

4. **验证通知配置**
   - 检查 Contact Points 配置是否正确
   - 测试发送通知功能
   - 检查 Notification Policies 的匹配规则

5. **查看 Grafana 日志**
   - 检查 `/var/log/grafana/grafana.log`
   - 查找告警相关的错误信息

### 架构设计题

**Q9: 如何实现仪表盘即代码（Dashboard as Code）？**

A: 实现方案：

1. **使用 Grafonnet**
   - 使用 Jsonnet 语言定义仪表盘
   - 编译生成 JSON 格式的仪表盘文件
   - 支持模板复用和参数化

2. **Terraform Provider**
   - 使用 Grafana Terraform Provider
   - 与基础设施代码一起管理
   - 支持状态管理和变更追踪

3. **Provisioning**
   - 将 JSON 仪表盘文件放入 provisioning 目录
   - 配置自动加载和更新

4. **CI/CD 流水线**
   - 代码审查仪表盘变更
   - 自动化验证和部署
   - 版本控制和回滚能力

**Q10: 大规模 Grafana 部署需要考虑哪些因素？**

A: 大规模部署考虑因素：

1. **性能**
   - 使用企业级数据库后端
   - 配置查询缓存
   - 使用 CDN 分发静态资源

2. **可扩展性**
   - 水平扩展多个 Grafana 实例
   - 分离读写负载
   - 使用 Recording Rules 减轻查询压力

3. **多租户**
   - 使用组织隔离不同团队
   - 配置 RBAC 细粒度权限
   - 考虑使用 Grafana Enterprise 的团队同步功能

4. **运维**
   - 实现配置即代码
   - 建立备份和恢复流程
   - 监控 Grafana 自身的性能指标

5. **安全**
   - 集成 SSO/LDAP
   - 启用 HTTPS 和安全 Cookie
   - 配置内容安全策略

## 总结

Grafana 是可观测性领域最强大的可视化工具之一。掌握 Grafana 需要理解：

1. **架构与数据源**：了解 Grafana 如何与各种数据源集成
2. **仪表盘设计**：应用 USE/RED 方法论设计有效的仪表盘
3. **查询技能**：熟练编写 PromQL 等查询语言
4. **变量与模板**：创建动态、可复用的仪表盘
5. **告警配置**：建立完善的告警规则和通知渠道
6. **权限管理**：实施安全的访问控制策略
7. **基础设施即代码**：使用 Grafonnet、Terraform 管理配置
8. **最佳实践**：性能优化、安全加固、高可用部署

通过深入学习这些内容，您将能够构建专业级的监控可视化平台，为业务提供强大的可观测性支持。
