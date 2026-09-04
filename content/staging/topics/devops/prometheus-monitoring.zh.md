---
title: Prometheus Monitoring Complete Guide
description: Master Prometheus for metrics collection and alerting
track: devops
section: observability
difficulty: intermediate
tags:
  - Prometheus
  - Monitoring
  - Metrics
  - Alerting
status: imported
origin: old/src/content/docs/devops/prometheus-monitoring.zh.md
divergence: 0.21
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DevOps
  subcategory: Observability
  order: 6
  lastUpdated: 2026-01-07
---

## 简介

Prometheus 是一个开源的系统监控和告警工具包，最初由 SoundCloud 开发。自 2012 年诞生以来，它已成为云原生生态系统中最受欢迎的监控解决方案之一，现在是云原生计算基金会（CNCF）的毕业项目。Prometheus 以其强大的多维数据模型、灵活的查询语言和可靠的告警机制而闻名。

### 核心特性

Prometheus 提供以下核心能力：

- **多维数据模型**：时间序列数据通过指标名称和键值对（标签）进行标识
- **PromQL 查询语言**：强大而灵活的查询语言，用于查询和聚合时间序列数据
- **独立运行**：不依赖分布式存储，单个服务器节点是自治的
- **拉取模式**：通过 HTTP 从目标端点拉取指标进行收集
- **推送支持**：短期任务可以通过 Pushgateway 推送指标
- **服务发现**：多种服务发现机制，用于自动检测目标
- **丰富的可视化**：原生支持各种图表和仪表板展示

### 使用场景

Prometheus 特别适合以下场景：

1. **微服务监控**：原生支持容器化和微服务环境
2. **动态云环境**：强大的服务发现能力，适应动态变化的基础设施
3. **高维度指标**：标签机制支持多维度数据分析
4. **实时告警**：灵活的告警规则和多种通知渠道

## 架构组件

Prometheus 生态系统由多个核心组件协同工作，提供全面的监控能力。

### 架构概览

```
                    +-----------------------------------------------------+
                    |               Prometheus Ecosystem                   |
                    +-----------------------------------------------------+
                                              |
        +-------------------------------------+-------------------------------------+
        |                                     |                                     |
        v                                     v                                     v
+---------------+                   +-----------------+                   +-----------------+
|   Exporters   |                   | Prometheus      |                   |   Alertmanager  |
| (Metrics      |<------Pull--------|   Server        |------Push-------->|   (Alert        |
|  Collectors)  |                   |   (Core)        |     Alerts        |    Manager)     |
+---------------+                   +-----------------+                   +-----------------+
        |                                     |                                     |
        |                                     |                                     |
+-------+-------+                   +---------+---------+               +----------+----------+
| Node Exporter |                   |   TSDB (Time      |               |  Email/Slack/       |
| MySQL Exporter|                   |   Series DB)      |               |  PagerDuty/Webhook  |
| Redis Exporter|                   |   Service         |               |  (Notification      |
| Custom        |                   |   Discovery       |               |   Channels)         |
+---------------+                   |   Rule Engine     |               +---------------------+
                                    +-------------------+
                                              |
                                              v
                                    +-----------------+
                                    |     Grafana     |
                                    | (Visualization) |
                                    +-----------------+
```

### 核心组件详解

#### Prometheus Server

Prometheus Server 是监控系统的核心，负责：

- **抓取**：按照配置的时间间隔从目标收集指标
- **存储**：将时间序列数据存储在本地 TSDB（时间序列数据库）中
- **查询**：处理 PromQL 查询并返回结果
- **规则评估**：评估记录规则和告警规则

```yaml
# prometheus.yml 配置示例
global:
  scrape_interval: 15s      # 全局抓取间隔
  evaluation_interval: 15s  # 规则评估间隔
  scrape_timeout: 10s       # 抓取超时时间

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

#### Pushgateway

Pushgateway 作为短期任务的中介，用于无法直接抓取的场景：

```bash
# 向 Pushgateway 推送指标
echo "batch_job_duration_seconds 42" | curl --data-binary @- \
  http://pushgateway:9091/metrics/job/batch_job/instance/host1

# 推送多个指标
cat <<EOF | curl --data-binary @- http://pushgateway:9091/metrics/job/batch_job
# TYPE batch_job_records_processed counter
batch_job_records_processed 1000
# TYPE batch_job_duration_seconds gauge
batch_job_duration_seconds 42.5
EOF
```

#### Exporters

Exporters 在 Prometheus 和各种系统之间架起桥梁，以 Prometheus 格式暴露指标：

| Exporter | 用途 | 默认端口 |
|----------|---------|--------------|
| Node Exporter | 主机系统指标（CPU、内存、磁盘、网络） | 9100 |
| MySQL Exporter | MySQL 数据库指标 | 9104 |
| PostgreSQL Exporter | PostgreSQL 数据库指标 | 9187 |
| Redis Exporter | Redis 缓存指标 | 9121 |
| Blackbox Exporter | 端点探测（HTTP、TCP、ICMP、DNS） | 9115 |
| cAdvisor | 容器指标 | 8080 |
| JMX Exporter | JVM 和 Java 应用指标 | 9404 |
| NGINX Exporter | NGINX Web 服务器指标 | 9113 |

#### Alertmanager

Alertmanager 处理告警去重、分组、路由和通知：

```yaml
# alertmanager.yml 配置示例
global:
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alertmanager@example.com'
  smtp_auth_username: 'alertmanager@example.com'
  smtp_auth_password: 'your-password'
  slack_api_url: 'https://hooks.slack.com/services/xxx/xxx/xxx'

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'team-email'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
    - match:
        severity: warning
      receiver: 'slack-warnings'

receivers:
  - name: 'team-email'
    email_configs:
      - to: 'team@example.com'
        send_resolved: true
  - name: 'slack-warnings'
    slack_configs:
      - channel: '#alerts'
        send_resolved: true
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '<your-service-key>'
        severity: critical

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

## 指标类型

理解 Prometheus 中的四种指标类型对于有效的监控埋点至关重要。

### 时间序列结构

Prometheus 中的每个时间序列通过以下方式唯一标识：

```
<metric_name>{<label_name>=<label_value>, ...}
```

示例：

```
http_requests_total{method="GET", handler="/api/users", status="200"}
```

### 四种指标类型

#### Counter（计数器）

Counter 是一个只增不减的累积指标，仅在重启时重置为零。用于记录随时间累积的值。

```go
// Go 代码示例
var httpRequestsTotal = prometheus.NewCounterVec(
    prometheus.CounterOpts{
        Name: "http_requests_total",
        Help: "Total number of HTTP requests",
    },
    []string{"method", "handler", "status"},
)

// 使用方法
httpRequestsTotal.WithLabelValues("GET", "/api/users", "200").Inc()
httpRequestsTotal.WithLabelValues("POST", "/api/users", "201").Add(5)
```

**典型用例**：请求计数、完成的任务数、错误计数、发送/接收的字节数

#### Gauge（仪表盘）

Gauge 表示可以上下波动的值。用于记录波动的状态值。

```go
var memoryUsage = prometheus.NewGauge(
    prometheus.GaugeOpts{
        Name: "memory_usage_bytes",
        Help: "Current memory usage in bytes",
    },
)

var activeConnections = prometheus.NewGaugeVec(
    prometheus.GaugeOpts{
        Name: "active_connections",
        Help: "Number of active connections",
    },
    []string{"protocol"},
)

// 使用方法
memoryUsage.Set(1024 * 1024 * 512)  // 设置为 512MB
memoryUsage.Inc()                    // 增加 1
memoryUsage.Dec()                    // 减少 1
memoryUsage.Add(100)                 // 增加 100
activeConnections.WithLabelValues("http").Set(42)
```

**典型用例**：温度、内存使用量、并发请求数、队列大小

#### Histogram（直方图）

Histogram 对观察值进行采样，并将它们计入可配置的桶中。它还提供所有观察值的总和。

```go
var requestDuration = prometheus.NewHistogramVec(
    prometheus.HistogramOpts{
        Name:    "http_request_duration_seconds",
        Help:    "HTTP request latency distribution",
        Buckets: []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
    },
    []string{"handler"},
)

// 使用方法
start := time.Now()
// ... 处理请求 ...
duration := time.Since(start).Seconds()
requestDuration.WithLabelValues("/api/users").Observe(duration)
```

自动生成的指标：
- `http_request_duration_seconds_bucket{le="0.1"}` - 小于等于 0.1 秒的请求计数
- `http_request_duration_seconds_sum` - 所有请求耗时的总和
- `http_request_duration_seconds_count` - 请求总数

#### Summary（摘要）

Summary 类似于 Histogram，但在客户端计算分位数。

```go
var requestLatency = prometheus.NewSummaryVec(
    prometheus.SummaryOpts{
        Name:       "http_request_latency_seconds",
        Help:       "HTTP request latency summary",
        Objectives: map[float64]float64{
            0.5:  0.05,   // 50 分位数，误差 5%
            0.9:  0.01,   // 90 分位数，误差 1%
            0.99: 0.001,  // 99 分位数，误差 0.1%
        },
        MaxAge:     10 * time.Minute,
    },
    []string{"handler"},
)
```

### Histogram 与 Summary 对比

| 特性 | Histogram | Summary |
|---------|-----------|---------|
| 分位数计算 | 服务端（PromQL） | 客户端 |
| 可聚合性 | 是 | 否 |
| 资源消耗 | 较低 | 较高 |
| 精确度 | 近似值 | 精确值 |
| 配置方式 | 定义桶边界 | 定义分位数目标 |
| 推荐场景 | 大多数场景 | 需要精确分位数时 |

## PromQL 查询

PromQL（Prometheus 查询语言）是 Prometheus 核心的强大查询语言。

### 基础查询

```promql
# 瞬时向量查询 - 返回当前值
http_requests_total

# 精确匹配标签过滤
http_requests_total{method="GET"}

# 正则匹配
http_requests_total{method=~"GET|POST"}
http_requests_total{handler=~"/api/.*"}

# 否定匹配
http_requests_total{method!="DELETE"}
http_requests_total{status!~"5.."}

# 范围向量查询（过去 5 分钟的数据点）
http_requests_total[5m]

# 偏移修饰符 - 查询 1 小时前的数据
http_requests_total offset 1h
rate(http_requests_total[5m] offset 1h)
```

### 速率和增量函数

```promql
# 过去 5 分钟的每秒请求速率（平滑）
rate(http_requests_total[5m])

# 使用最后两个数据点的瞬时速率
irate(http_requests_total[5m])

# 过去一小时的总增量
increase(http_requests_total[1h])

# Gauge 随时间的变化
delta(temperature_celsius[1h])
```

**何时使用 rate() vs irate()**：
- `rate()`：提供平滑的平均值，更适合告警和长期趋势
- `irate()`：对峰值更敏感，更适合实时仪表板

### 聚合操作

```promql
# 按 handler 分组求和
sum by (handler) (rate(http_requests_total[5m]))

# 排除特定标签求和
sum without (instance) (rate(http_requests_total[5m]))

# 所有实例的平均值
avg(node_memory_MemAvailable_bytes)

# 最大值和最小值
max(node_cpu_seconds_total)
min(node_cpu_seconds_total)

# 时间序列计数
count(up == 1)

# 按请求速率排序的前 5 名
topk(5, rate(http_requests_total[5m]))

# 按可用内存排序的后 5 名
bottomk(5, node_memory_MemAvailable_bytes)

# 标准差
stddev(rate(http_requests_total[5m]))

# 统计唯一标签值
count_values("version", build_info)
```

### 分位数计算

```promql
# 从直方图计算 P99 延迟
histogram_quantile(0.99,
  sum by (le, handler) (rate(http_request_duration_seconds_bucket[5m]))
)

# 所有 handler 的 P95 延迟
histogram_quantile(0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket[5m]))
)

# 在一个查询中计算多个分位数
histogram_quantile(0.50, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
histogram_quantile(0.90, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
```

### 实用查询示例

```promql
# CPU 使用百分比
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# 内存使用百分比
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# 磁盘使用百分比
(1 - node_filesystem_avail_bytes{mountpoint="/"} /
     node_filesystem_size_bytes{mountpoint="/"}) * 100

# HTTP 错误率（5xx 错误百分比）
sum(rate(http_requests_total{status=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m])) * 100

# 请求成功率
sum(rate(http_requests_total{status="200"}[5m]))
/ sum(rate(http_requests_total[5m])) * 100

# 24 小时服务可用性
avg_over_time(up{job="my-service"}[24h]) * 100

# 网络吞吐量（每秒字节数）
rate(node_network_receive_bytes_total{device="eth0"}[5m])
rate(node_network_transmit_bytes_total{device="eth0"}[5m])

# 容器 CPU 使用量
sum(rate(container_cpu_usage_seconds_total{name!=""}[5m])) by (name)

# 按端点统计每秒请求数
sum by (handler) (rate(http_requests_total[1m]))
```

## Exporters

Exporters 是将各种系统的指标转换为 Prometheus 格式的重要组件。

### Node Exporter

最常用的主机级指标导出器：

```bash
# 安装 Node Exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz
tar xvfz node_exporter-1.7.0.linux-amd64.tar.gz
cd node_exporter-1.7.0.linux-amd64
./node_exporter

# 作为 systemd 服务运行
sudo cat > /etc/systemd/system/node_exporter.service << EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=prometheus
ExecStart=/usr/local/bin/node_exporter
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter
```

提供的关键指标：
- `node_cpu_seconds_total` - CPU 在各种模式下花费的时间
- `node_memory_MemTotal_bytes` - 总内存
- `node_memory_MemAvailable_bytes` - 可用内存
- `node_filesystem_size_bytes` - 文件系统大小
- `node_filesystem_avail_bytes` - 文件系统可用空间
- `node_network_receive_bytes_total` - 网络接收字节数
- `node_network_transmit_bytes_total` - 网络发送字节数

### Blackbox Exporter

用于探测外部端点：

```yaml
# blackbox.yml
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
      valid_status_codes: []  # 默认为 2xx
      method: GET
      follow_redirects: true
      preferred_ip_protocol: "ip4"

  http_post_2xx:
    prober: http
    http:
      method: POST
      headers:
        Content-Type: application/json
      body: '{"test": "data"}'

  tcp_connect:
    prober: tcp
    timeout: 5s

  icmp:
    prober: icmp
    timeout: 5s
    icmp:
      preferred_ip_protocol: "ip4"

  dns:
    prober: dns
    dns:
      query_name: "example.com"
      query_type: "A"
```

Blackbox 的 Prometheus 配置：

```yaml
scrape_configs:
  - job_name: 'blackbox-http'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
          - https://example.com
          - https://api.example.com/health
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

### 自定义 Exporter 示例

用 Python 创建自定义 exporter：

```python
from prometheus_client import start_http_server, Gauge, Counter, Histogram
import time
import random

# 定义指标
REQUEST_COUNT = Counter(
    'app_requests_total',
    'Total request count',
    ['method', 'endpoint']
)

REQUEST_LATENCY = Histogram(
    'app_request_latency_seconds',
    'Request latency in seconds',
    ['endpoint'],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
)

ACTIVE_USERS = Gauge(
    'app_active_users',
    'Number of active users'
)

def process_request():
    """模拟请求处理"""
    REQUEST_COUNT.labels(method='GET', endpoint='/api/data').inc()

    with REQUEST_LATENCY.labels(endpoint='/api/data').time():
        time.sleep(random.uniform(0.01, 0.5))

    ACTIVE_USERS.set(random.randint(10, 100))

if __name__ == '__main__':
    # 在端口 8000 启动指标服务器
    start_http_server(8000)
    print("Metrics server started on port 8000")

    while True:
        process_request()
        time.sleep(1)
```

## Alertmanager

Alertmanager 负责处理 Prometheus 发送的告警，并将它们路由到适当的接收者。

### 告警规则配置

```yaml
# rules/alerts.yml
groups:
  - name: instance-alerts
    rules:
      - alert: InstanceDown
        expr: up == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "实例 {{ $labels.instance }} 已宕机"
          description: "{{ $labels.job }} 任务的 {{ $labels.instance }} 实例已宕机超过 5 分钟"
          runbook_url: "https://wiki.example.com/runbooks/instance-down"

      - alert: HighMemoryUsage
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 90
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "检测到高内存使用"
          description: "实例 {{ $labels.instance }} 的内存使用率为 {{ $value | printf \"%.2f\" }}%"

      - alert: HighCPUUsage
        expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "检测到高 CPU 使用"
          description: "实例 {{ $labels.instance }} 的 CPU 使用率超过 80%"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 20
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "磁盘空间不足"
          description: "实例 {{ $labels.instance }} 的可用磁盘空间不足 20%"
```

### 应用级告警

```yaml
groups:
  - name: application-alerts
    rules:
      # 高错误率
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) by (job)
          / sum(rate(http_requests_total[5m])) by (job) * 100 > 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "HTTP 错误率过高"
          description: "服务 {{ $labels.job }} 的 5xx 错误率为 {{ $value | printf \"%.2f\" }}%"

      # 高请求延迟
      - alert: HighRequestLatency
        expr: |
          histogram_quantile(0.99,
            sum by (le, handler) (rate(http_request_duration_seconds_bucket[5m]))
          ) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "请求延迟过高"
          description: "处理器 {{ $labels.handler }} 的 P99 延迟超过 2 秒"

      # 服务饱和度
      - alert: ServiceSaturation
        expr: |
          sum(rate(http_requests_total[5m])) by (job)
          / on(job) group_left service_max_requests > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "服务接近容量上限"
          description: "服务 {{ $labels.job }} 已达到 {{ $value | printf \"%.0f\" }}% 的容量"

      # Kubernetes Pod 重启告警
      - alert: PodRestarting
        expr: increase(kube_pod_container_status_restarts_total[1h]) > 3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Pod 频繁重启"
          description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} 在过去一小时内重启了 {{ $value }} 次"
```

### Alertmanager 路由

```yaml
# alertmanager.yml - 高级路由示例
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alertmanager@example.com'
  slack_api_url: 'https://hooks.slack.com/services/xxx'
  pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'

templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  receiver: 'default-receiver'
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    # 严重告警立即发送到 PagerDuty
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      group_wait: 10s
      continue: true  # 同时发送到其他匹配的路由

    # 数据库告警发送给 DBA 团队
    - match_re:
        alertname: ^(MySQL|PostgreSQL|Redis).*
      receiver: 'dba-team'

    # 基础设施告警发送给运维团队
    - match:
        team: infrastructure
      receiver: 'ops-team-slack'

    # 维护窗口期间静默告警
    - match:
        maintenance: "true"
      receiver: 'null'

receivers:
  - name: 'default-receiver'
    email_configs:
      - to: 'alerts@example.com'
        send_resolved: true

  - name: 'pagerduty-critical'
    pagerduty_configs:
      - service_key: '<service-key>'
        severity: critical
        description: '{{ .CommonAnnotations.summary }}'
        details:
          firing: '{{ template "pagerduty.default.instances" .Alerts.Firing }}'
          resolved: '{{ template "pagerduty.default.instances" .Alerts.Resolved }}'

  - name: 'dba-team'
    email_configs:
      - to: 'dba@example.com'
    slack_configs:
      - channel: '#dba-alerts'
        send_resolved: true

  - name: 'ops-team-slack'
    slack_configs:
      - channel: '#ops-alerts'
        send_resolved: true
        title: '{{ .CommonAnnotations.summary }}'
        text: '{{ .CommonAnnotations.description }}'

  - name: 'null'
    # 用于静默的空接收者

inhibit_rules:
  # 如果严重告警触发，抑制相同 alertname 的警告告警
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']

  # 如果集群宕机，抑制所有其他集群告警
  - source_match:
      alertname: 'ClusterDown'
    target_match_re:
      alertname: '.+'
    equal: ['cluster']
```

## 服务发现

Prometheus 支持多种服务发现机制，用于自动发现监控目标。

### 静态配置

```yaml
scrape_configs:
  - job_name: 'static-targets'
    static_configs:
      - targets:
          - 'server1:9100'
          - 'server2:9100'
        labels:
          env: 'production'
          team: 'backend'
```

### Kubernetes 服务发现

```yaml
scrape_configs:
  # 发现带有 prometheus 注解的 Pod
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      # 只抓取带有 prometheus.io/scrape 注解的 Pod
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      # 使用注解中的自定义端口
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      # 使用注解中的自定义路径
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      # 添加 Pod 标签
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: kubernetes_pod_name
      - source_labels: [__meta_kubernetes_namespace]
        target_label: kubernetes_namespace

  # 发现 Service
  - job_name: 'kubernetes-services'
    kubernetes_sd_configs:
      - role: service
    relabel_configs:
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
        action: keep
        regex: true

  # 发现 Node
  - job_name: 'kubernetes-nodes'
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)
```

### Consul 服务发现

```yaml
scrape_configs:
  - job_name: 'consul-services'
    consul_sd_configs:
      - server: 'consul.example.com:8500'
        services: []  # 空表示所有服务
        tags:
          - prometheus  # 只有带此标签的服务
    relabel_configs:
      - source_labels: [__meta_consul_tags]
        regex: .*,prometheus,.*
        action: keep
      - source_labels: [__meta_consul_service]
        target_label: service
      - source_labels: [__meta_consul_dc]
        target_label: datacenter
```

### 基于文件的服务发现

```yaml
scrape_configs:
  - job_name: 'file-sd'
    file_sd_configs:
      - files:
          - '/etc/prometheus/targets/*.json'
          - '/etc/prometheus/targets/*.yml'
        refresh_interval: 5m
```

```json
// /etc/prometheus/targets/apps.json
[
  {
    "targets": ["app1:8080", "app2:8080"],
    "labels": {
      "env": "production",
      "app": "web-api",
      "team": "platform"
    }
  },
  {
    "targets": ["worker1:8080", "worker2:8080"],
    "labels": {
      "env": "production",
      "app": "background-worker",
      "team": "platform"
    }
  }
]
```

### EC2 服务发现

```yaml
scrape_configs:
  - job_name: 'ec2-instances'
    ec2_sd_configs:
      - region: us-west-2
        port: 9100
        filters:
          - name: tag:Environment
            values:
              - production
          - name: tag:Monitoring
            values:
              - enabled
    relabel_configs:
      - source_labels: [__meta_ec2_tag_Name]
        target_label: instance_name
      - source_labels: [__meta_ec2_instance_type]
        target_label: instance_type
      - source_labels: [__meta_ec2_availability_zone]
        target_label: availability_zone
```

## Grafana 集成

Grafana 是最流行的 Prometheus 数据可视化工具。

### 配置 Prometheus 数据源

```yaml
# grafana/provisioning/datasources/prometheus.yml
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
```

### 仪表板面板

#### 系统资源监控

```json
{
  "panels": [
    {
      "title": "CPU Usage",
      "type": "gauge",
      "targets": [
        {
          "expr": "100 - (avg(irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
          "legendFormat": "CPU Usage %"
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
          "max": 100,
          "unit": "percent"
        }
      }
    },
    {
      "title": "Memory Usage Trend",
      "type": "timeseries",
      "targets": [
        {
          "expr": "(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100",
          "legendFormat": "Memory Usage %"
        }
      ]
    },
    {
      "title": "Disk I/O",
      "type": "timeseries",
      "targets": [
        {
          "expr": "rate(node_disk_read_bytes_total[5m])",
          "legendFormat": "Read - {{ device }}"
        },
        {
          "expr": "rate(node_disk_written_bytes_total[5m])",
          "legendFormat": "Write - {{ device }}"
        }
      ]
    }
  ]
}
```

#### 应用性能监控

```promql
# 按端点统计每秒请求数
sum(rate(http_requests_total[1m])) by (handler)

# 延迟热力图
sum(rate(http_request_duration_seconds_bucket[5m])) by (le)

# 按处理器统计错误率
sum(rate(http_requests_total{status=~"5.."}[5m])) by (handler)
/ sum(rate(http_requests_total[5m])) by (handler) * 100

# Apdex 分数（应用性能指数）
(
  sum(rate(http_request_duration_seconds_bucket{le="0.5"}[5m]))
  + sum(rate(http_request_duration_seconds_bucket{le="2"}[5m]))
) / 2
/ sum(rate(http_request_duration_seconds_count[5m]))
```

### 推荐的社区仪表板

| 仪表板 ID | 名称 | 用途 |
|-------------|------|---------|
| 1860 | Node Exporter Full | 全面的主机指标 |
| 3662 | Prometheus 2.0 Overview | Prometheus 自监控 |
| 7362 | MySQL Overview | MySQL 数据库监控 |
| 9628 | PostgreSQL Database | PostgreSQL 监控 |
| 11835 | Kubernetes Overview | K8s 集群监控 |
| 12006 | Kubernetes / Compute Resources | K8s 资源利用率 |
| 13105 | NGINX Prometheus Exporter | NGINX Web 服务器 |

## 最佳实践

### 指标命名规范

```
# 格式：<namespace>_<name>_<unit>
# 示例：

# Counter 应该以 _total 结尾
http_requests_total
errors_total
processed_bytes_total

# 时间测量使用秒
http_request_duration_seconds
process_cpu_seconds_total

# 大小测量使用字节
memory_usage_bytes
file_size_bytes

# 使用基本单位（秒而非毫秒，字节而非千字节）
# 让可视化工具处理单位转换
```

### 标签设计原则

1. **避免高基数标签**：永远不要使用用户 ID、请求 ID 或时间戳作为标签
2. **保持标签一致性**：同一指标在所有实例中应该有一致的标签
3. **使用有意义的标签名**：标签应该清楚地描述其用途

```go
// 好的做法
httpRequests.WithLabelValues("GET", "/api/users", "200")
httpRequests.WithLabelValues("POST", "/api/orders", "201")

// 不好的做法 - 高基数
httpRequests.WithLabelValues(userID, requestID, timestamp)
```

### 告警设计原则

```yaml
# 遵循告警金字塔原则
# Critical：需要立即处理，影响用户
# Warning：需要关注，可能发展成问题
# Info：仅供参考

# 基于症状的告警（推荐）
- alert: HighErrorRate
  expr: error_rate > 5%
  # 面向用户的影响

# 基于原因的告警（补充）
- alert: DatabaseConnectionFailed
  expr: db_connections == 0
  # 根本原因指示
```

告警最佳实践：
- 尽可能基于症状而非原因进行告警
- 在注解中包含运维手册 URL
- 设置适当的 `for` 持续时间以避免抖动
- 一致地使用严重级别
- 在注解中通过 `{{ $labels }}` 和 `{{ $value }}` 提供上下文

### 性能优化

```yaml
# 设置适当的抓取间隔
scrape_interval: 30s  # 非关键服务可以使用更长的间隔

# 对昂贵的查询使用记录规则
groups:
  - name: pre-calculated
    interval: 30s
    rules:
      - record: job:http_requests:rate5m
        expr: sum by (job) (rate(http_requests_total[5m]))

      - record: job:http_request_latency:p99
        expr: |
          histogram_quantile(0.99,
            sum by (job, le) (rate(http_request_duration_seconds_bucket[5m]))
          )

# 配置数据保留策略
# 命令行参数：
--storage.tsdb.retention.time=15d
--storage.tsdb.retention.size=50GB

# 限制基数
# 使用重标签删除不必要的标签或指标
relabel_configs:
  - source_labels: [__name__]
    regex: 'go_.*'
    action: drop
```

### 高可用架构

```
+-----------------------------------------------------------+
|                   Load Balancer (Nginx/HAProxy)            |
+-----------------------------------------------------------+
                              |
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
+---------------+     +---------------+     +---------------+
| Prometheus #1 |     | Prometheus #2 |     | Prometheus #3 |
|   (Primary)   |     |   (Replica)   |     |   (Replica)   |
+---------------+     +---------------+     +---------------+
        |                     |                     |
        +---------------------+---------------------+
                              |
                              v
                    +-----------------+
                    |     Thanos      |
                    | (Long-term      |
                    |  Storage)       |
                    +-----------------+
```

## 面试要点

### 常见面试问题

**问题 1：拉取模式和推送模式监控有什么区别？各有什么优缺点？**

拉取模式（Prometheus 默认）：
- 优点：简单、可靠、易于调试、不会给目标造成压力
- 缺点：需要暴露端点、防火墙配置可能复杂

推送模式（通过 Pushgateway）：
- 优点：适合短期任务、可以穿透防火墙
- 缺点：存在单点故障风险、无法判断服务健康状态

**问题 2：Counter 和 Gauge 有什么区别？**

- Counter：只增不减（或重置为零），用于计数指标（请求数、错误数）
- Gauge：可增可减，用于状态指标（温度、内存使用量）

**问题 3：如何计算服务的 P99 延迟？**

```promql
histogram_quantile(0.99,
  sum by (le) (rate(http_request_duration_seconds_bucket[5m]))
)
```

**问题 4：rate() 和 irate() 有什么区别？**

- `rate()`：计算时间范围内的平均速率，结果更平滑
- `irate()`：只使用最后两个数据点，对峰值更敏感

**问题 5：如何处理高基数问题？**

1. 避免高基数标签（用户 ID、请求 ID）
2. 使用 relabel_configs 过滤不必要的标签
3. 设置适当的指标保留策略
4. 使用记录规则进行预聚合
5. 使用 `prometheus_tsdb_head_series` 监控基数

**问题 6：解释 Prometheus 的高可用架构。**

1. 运行多个 Prometheus 实例抓取相同的目标
2. 使用外部标签区分实例
3. 以集群模式部署 Alertmanager 实现告警高可用
4. 使用 Thanos 或 VictoriaMetrics 实现长期存储和全局视图
5. 考虑使用联邦进行分层设置

**问题 7：记录规则如何提升性能？**

记录规则预先计算昂贵的查询并将结果存储为新的时间序列：
- 减少仪表板的查询延迟
- 降低高峰期 Prometheus 的负载
- 支持原本可能超时的复杂查询

### 架构设计要点

```
1. 高可用部署
   - 多个 Prometheus 实例抓取相同目标
   - Alertmanager 集群部署
   - 外部存储保证持久性

2. 联邦
   - 全局 Prometheus 从区域实例聚合数据
   - 使用 match 标签控制联邦内容

3. 远程存储
   - 使用 remote_write 实现长期存储（Thanos、VictoriaMetrics、Cortex）
   - 支持无限保留和全局查询
```

## 生产环境部署

### Docker Compose 部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.48.0
    container_name: prometheus
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/rules:/etc/prometheus/rules
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
      - '--storage.tsdb.retention.size=50GB'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    ports:
      - "9090:9090"
    networks:
      - monitoring
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager:v0.26.0
    container_name: alertmanager
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--cluster.listen-address='
    ports:
      - "9093:9093"
    networks:
      - monitoring
    restart: unless-stopped

  grafana:
    image: grafana/grafana:10.2.0
    container_name: grafana
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3000:3000"
    networks:
      - monitoring
    restart: unless-stopped

  node-exporter:
    image: prom/node-exporter:v1.7.0
    container_name: node-exporter
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/rootfs'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    ports:
      - "9100:9100"
    networks:
      - monitoring
    restart: unless-stopped

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:v0.47.2
    container_name: cadvisor
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    ports:
      - "8080:8080"
    networks:
      - monitoring
    restart: unless-stopped

volumes:
  prometheus_data:
  alertmanager_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
```

### 使用 Helm 部署到 Kubernetes

```bash
# 添加 Helm 仓库
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# 创建命名空间
kubectl create namespace monitoring

# 安装 kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
  --set alertmanager.alertmanagerSpec.storage.volumeClaimTemplate.spec.resources.requests.storage=10Gi \
  --set grafana.adminPassword=your-secure-password

# 验证安装
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

### 常见问题排查

#### 目标状态为 DOWN

```bash
# 检查目标端点是否可达
curl -v http://target:9100/metrics

# 检查 Prometheus 日志
docker logs prometheus 2>&1 | grep -i error

# 检查防火墙规则
iptables -L -n | grep 9100
```

#### 查询超时

```promql
# 优化查询 - 减少时间范围
rate(http_requests_total[5m])  # 而不是 [1h]

# 使用记录规则进行预聚合
# rules/recording.yml
groups:
  - name: aggregations
    rules:
      - record: job:http_requests:rate5m
        expr: sum by (job) (rate(http_requests_total[5m]))
```

#### 存储空间问题

```bash
# 检查 TSDB 块大小
du -sh /prometheus/

# 调整保留策略
--storage.tsdb.retention.time=7d
--storage.tsdb.retention.size=20GB

# 清理墓碑（谨慎使用）
curl -X POST http://localhost:9090/api/v1/admin/tsdb/clean_tombstones
```

#### 高基数诊断

```promql
# 检查指标基数
prometheus_tsdb_head_series

# 找出基数最高的指标
topk(10, count by (__name__) ({__name__=~".+"}))

# 检查特定指标的标签组合数量
count(http_requests_total)
```

## 延伸阅读

### 官方资源

- [Prometheus 官方文档](https://prometheus.io/docs/)
- [PromQL 查询示例](https://prometheus.io/docs/prometheus/latest/querying/examples/)
- [告警最佳实践](https://prometheus.io/docs/practices/alerting/)
- [埋点最佳实践](https://prometheus.io/docs/practices/instrumentation/)

### 推荐书籍

- "Prometheus: Up & Running" by Brian Brazil (O'Reilly)
- "Cloud Native Monitoring with Prometheus" (Packt)

### 相关工具

| 工具 | 用途 | 链接 |
|------|---------|------|
| Thanos | 高可用和长期存储 | https://thanos.io |
| VictoriaMetrics | 高性能时间序列数据库 | https://victoriametrics.com |
| Cortex | 多租户 Prometheus | https://cortexmetrics.io |
| Grafana Loki | 日志聚合系统 | https://grafana.com/oss/loki |
| Mimir | 可扩展的长期存储 | https://grafana.com/oss/mimir |

### 社区资源

- [Prometheus GitHub 仓库](https://github.com/prometheus/prometheus)
- [Awesome Prometheus](https://github.com/roaldnefs/awesome-prometheus)
- [Prometheus Exporters 列表](https://prometheus.io/docs/instrumenting/exporters/)
- [PromCon 会议演讲](https://promcon.io/)

---

通过掌握本指南涵盖的概念，您应该对 Prometheus 架构、PromQL 查询、告警配置和运维最佳实践有了扎实的理解。从您环境中的简单监控场景开始，逐步探索高级功能，构建全面的可观测性平台。
