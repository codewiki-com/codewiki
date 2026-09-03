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
origin: old/src/content/docs/devops/prometheus-monitoring.en.md
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

## Introduction

Prometheus is an open-source systems monitoring and alerting toolkit originally built at SoundCloud. Since its inception in 2012, it has become one of the most popular monitoring solutions in the cloud-native ecosystem and is now a graduated project of the Cloud Native Computing Foundation (CNCF). Prometheus is renowned for its powerful multi-dimensional data model, flexible query language, and reliable alerting mechanism.

### Core Features

Prometheus provides the following core capabilities:

- **Multi-dimensional Data Model**: Time series data identified by metric name and key-value pairs (labels)
- **PromQL Query Language**: A powerful and flexible query language for querying and aggregating time series data
- **Standalone Operation**: No dependency on distributed storage; single server nodes are autonomous
- **Pull-based Model**: Collects metrics by pulling from target endpoints over HTTP
- **Push Support**: Short-lived jobs can push metrics via the Pushgateway
- **Service Discovery**: Multiple service discovery mechanisms for automatic target detection
- **Rich Visualization**: Native support for various graphs and dashboard displays

### Use Cases

Prometheus is particularly well-suited for:

1. **Microservices Monitoring**: Native support for containerized and microservice environments
2. **Dynamic Cloud Environments**: Powerful service discovery adapts to dynamically changing infrastructure
3. **High-Dimensional Metrics**: Label mechanism enables multi-dimensional data analysis
4. **Real-time Alerting**: Flexible alerting rules with multiple notification channels

## Architecture Components

The Prometheus ecosystem consists of multiple core components working together to provide comprehensive monitoring capabilities.

### Architecture Overview

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

### Core Components Explained

#### Prometheus Server

The Prometheus Server is the heart of the monitoring system, responsible for:

- **Scraping**: Collecting metrics from configured targets at regular intervals
- **Storage**: Storing time series data in its local TSDB (Time Series Database)
- **Querying**: Processing PromQL queries and returning results
- **Rule Evaluation**: Evaluating recording and alerting rules

```yaml
# prometheus.yml configuration example
global:
  scrape_interval: 15s      # Global scrape interval
  evaluation_interval: 15s  # Rule evaluation interval
  scrape_timeout: 10s       # Scrape timeout

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

The Pushgateway serves as an intermediary for short-lived jobs that cannot be scraped directly:

```bash
# Push metrics to Pushgateway
echo "batch_job_duration_seconds 42" | curl --data-binary @- \
  http://pushgateway:9091/metrics/job/batch_job/instance/host1

# Push multiple metrics
cat <<EOF | curl --data-binary @- http://pushgateway:9091/metrics/job/batch_job
# TYPE batch_job_records_processed counter
batch_job_records_processed 1000
# TYPE batch_job_duration_seconds gauge
batch_job_duration_seconds 42.5
EOF
```

#### Exporters

Exporters bridge the gap between Prometheus and various systems, exposing metrics in the Prometheus format:

| Exporter | Purpose | Default Port |
|----------|---------|--------------|
| Node Exporter | Host system metrics (CPU, memory, disk, network) | 9100 |
| MySQL Exporter | MySQL database metrics | 9104 |
| PostgreSQL Exporter | PostgreSQL database metrics | 9187 |
| Redis Exporter | Redis cache metrics | 9121 |
| Blackbox Exporter | Probing endpoints (HTTP, TCP, ICMP, DNS) | 9115 |
| cAdvisor | Container metrics | 8080 |
| JMX Exporter | JVM and Java application metrics | 9404 |
| NGINX Exporter | NGINX web server metrics | 9113 |

#### Alertmanager

Alertmanager handles alert deduplication, grouping, routing, and notification:

```yaml
# alertmanager.yml configuration example
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

## Metrics Types

Understanding the four metric types in Prometheus is essential for effective instrumentation.

### Time Series Structure

Every time series in Prometheus is uniquely identified by:

```
<metric_name>{<label_name>=<label_value>, ...}
```

Example:

```
http_requests_total{method="GET", handler="/api/users", status="200"}
```

### The Four Metric Types

#### Counter

A Counter is a cumulative metric that only increases or resets to zero on restart. Use counters for values that accumulate over time.

```go
// Go code example
var httpRequestsTotal = prometheus.NewCounterVec(
    prometheus.CounterOpts{
        Name: "http_requests_total",
        Help: "Total number of HTTP requests",
    },
    []string{"method", "handler", "status"},
)

// Usage
httpRequestsTotal.WithLabelValues("GET", "/api/users", "200").Inc()
httpRequestsTotal.WithLabelValues("POST", "/api/users", "201").Add(5)
```

**Typical Use Cases**: Request counts, completed tasks, error counts, bytes sent/received

#### Gauge

A Gauge represents a value that can go up or down. Use gauges for values that fluctuate.

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

// Usage
memoryUsage.Set(1024 * 1024 * 512)  // Set to 512MB
memoryUsage.Inc()                    // Increase by 1
memoryUsage.Dec()                    // Decrease by 1
memoryUsage.Add(100)                 // Add 100
activeConnections.WithLabelValues("http").Set(42)
```

**Typical Use Cases**: Temperature, memory usage, concurrent request count, queue size

#### Histogram

A Histogram samples observations and counts them in configurable buckets. It also provides a sum of all observed values.

```go
var requestDuration = prometheus.NewHistogramVec(
    prometheus.HistogramOpts{
        Name:    "http_request_duration_seconds",
        Help:    "HTTP request latency distribution",
        Buckets: []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
    },
    []string{"handler"},
)

// Usage
start := time.Now()
// ... handle request ...
duration := time.Since(start).Seconds()
requestDuration.WithLabelValues("/api/users").Observe(duration)
```

Auto-generated metrics:
- `http_request_duration_seconds_bucket{le="0.1"}` - Count of requests <= 0.1 seconds
- `http_request_duration_seconds_sum` - Sum of all request durations
- `http_request_duration_seconds_count` - Total count of requests

#### Summary

A Summary is similar to a Histogram but calculates quantiles on the client side.

```go
var requestLatency = prometheus.NewSummaryVec(
    prometheus.SummaryOpts{
        Name:       "http_request_latency_seconds",
        Help:       "HTTP request latency summary",
        Objectives: map[float64]float64{
            0.5:  0.05,   // 50th percentile with 5% error
            0.9:  0.01,   // 90th percentile with 1% error
            0.99: 0.001,  // 99th percentile with 0.1% error
        },
        MaxAge:     10 * time.Minute,
    },
    []string{"handler"},
)
```

### Histogram vs Summary Comparison

| Feature | Histogram | Summary |
|---------|-----------|---------|
| Quantile Calculation | Server-side (PromQL) | Client-side |
| Aggregatable | Yes | No |
| Resource Consumption | Lower | Higher |
| Accuracy | Approximate | Exact |
| Configuration | Define bucket boundaries | Define quantile objectives |
| Recommended For | Most scenarios | When exact quantiles needed |

## PromQL Queries

PromQL (Prometheus Query Language) is the powerful query language at the heart of Prometheus.

### Basic Queries

```promql
# Instant vector query - returns current value
http_requests_total

# Label filtering with exact match
http_requests_total{method="GET"}

# Regex matching
http_requests_total{method=~"GET|POST"}
http_requests_total{handler=~"/api/.*"}

# Negative matching
http_requests_total{method!="DELETE"}
http_requests_total{status!~"5.."}

# Range vector query (last 5 minutes of data points)
http_requests_total[5m]

# Offset modifier - query data from 1 hour ago
http_requests_total offset 1h
rate(http_requests_total[5m] offset 1h)
```

### Rate and Increase Functions

```promql
# Per-second request rate over the last 5 minutes (smoothed)
rate(http_requests_total[5m])

# Instantaneous rate using last two data points
irate(http_requests_total[5m])

# Total increase over the last hour
increase(http_requests_total[1h])

# Changes in a gauge over time
delta(temperature_celsius[1h])
```

**When to use rate() vs irate()**:
- `rate()`: Provides smoothed average, better for alerting and long-term trends
- `irate()`: More sensitive to spikes, better for real-time dashboards

### Aggregation Operations

```promql
# Sum by handler
sum by (handler) (rate(http_requests_total[5m]))

# Sum excluding specific labels
sum without (instance) (rate(http_requests_total[5m]))

# Average across all instances
avg(node_memory_MemAvailable_bytes)

# Maximum and minimum
max(node_cpu_seconds_total)
min(node_cpu_seconds_total)

# Count of time series
count(up == 1)

# Top 5 by request rate
topk(5, rate(http_requests_total[5m]))

# Bottom 5 by available memory
bottomk(5, node_memory_MemAvailable_bytes)

# Standard deviation
stddev(rate(http_requests_total[5m]))

# Count unique label values
count_values("version", build_info)
```

### Quantile Calculations

```promql
# Calculate P99 latency from histogram
histogram_quantile(0.99,
  sum by (le, handler) (rate(http_request_duration_seconds_bucket[5m]))
)

# P95 latency across all handlers
histogram_quantile(0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket[5m]))
)

# Multiple percentiles in one query
histogram_quantile(0.50, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
histogram_quantile(0.90, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
histogram_quantile(0.99, sum by (le) (rate(http_request_duration_seconds_bucket[5m])))
```

### Practical Query Examples

```promql
# CPU usage percentage
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage percentage
(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100

# Disk usage percentage
(1 - node_filesystem_avail_bytes{mountpoint="/"} /
     node_filesystem_size_bytes{mountpoint="/"}) * 100

# HTTP error rate (5xx errors as percentage)
sum(rate(http_requests_total{status=~"5.."}[5m]))
/ sum(rate(http_requests_total[5m])) * 100

# Request success rate
sum(rate(http_requests_total{status="200"}[5m]))
/ sum(rate(http_requests_total[5m])) * 100

# Service availability over 24 hours
avg_over_time(up{job="my-service"}[24h]) * 100

# Network throughput (bytes per second)
rate(node_network_receive_bytes_total{device="eth0"}[5m])
rate(node_network_transmit_bytes_total{device="eth0"}[5m])

# Container CPU usage
sum(rate(container_cpu_usage_seconds_total{name!=""}[5m])) by (name)

# Requests per second by endpoint
sum by (handler) (rate(http_requests_total[1m]))
```

## Exporters

Exporters are essential components that translate metrics from various systems into the Prometheus format.

### Node Exporter

The most commonly used exporter for host-level metrics:

```bash
# Install Node Exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz
tar xvfz node_exporter-1.7.0.linux-amd64.tar.gz
cd node_exporter-1.7.0.linux-amd64
./node_exporter

# Run as systemd service
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

Key metrics provided:
- `node_cpu_seconds_total` - CPU time spent in various modes
- `node_memory_MemTotal_bytes` - Total memory
- `node_memory_MemAvailable_bytes` - Available memory
- `node_filesystem_size_bytes` - Filesystem size
- `node_filesystem_avail_bytes` - Filesystem available space
- `node_network_receive_bytes_total` - Network bytes received
- `node_network_transmit_bytes_total` - Network bytes transmitted

### Blackbox Exporter

For probing external endpoints:

```yaml
# blackbox.yml
modules:
  http_2xx:
    prober: http
    timeout: 5s
    http:
      valid_http_versions: ["HTTP/1.1", "HTTP/2.0"]
      valid_status_codes: []  # Defaults to 2xx
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

Prometheus configuration for Blackbox:

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

### Custom Exporter Example

Creating a custom exporter in Python:

```python
from prometheus_client import start_http_server, Gauge, Counter, Histogram
import time
import random

# Define metrics
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
    """Simulate request processing"""
    REQUEST_COUNT.labels(method='GET', endpoint='/api/data').inc()

    with REQUEST_LATENCY.labels(endpoint='/api/data').time():
        time.sleep(random.uniform(0.01, 0.5))

    ACTIVE_USERS.set(random.randint(10, 100))

if __name__ == '__main__':
    # Start metrics server on port 8000
    start_http_server(8000)
    print("Metrics server started on port 8000")

    while True:
        process_request()
        time.sleep(1)
```

## Alertmanager

Alertmanager is responsible for handling alerts sent by Prometheus and routing them to the appropriate receivers.

### Alert Rules Configuration

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
          summary: "Instance {{ $labels.instance }} is down"
          description: "{{ $labels.instance }} of job {{ $labels.job }} has been down for more than 5 minutes"
          runbook_url: "https://wiki.example.com/runbooks/instance-down"

      - alert: HighMemoryUsage
        expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 > 90
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Instance {{ $labels.instance }} memory usage is {{ $value | printf \"%.2f\" }}%"

      - alert: HighCPUUsage
        expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "Instance {{ $labels.instance }} CPU usage exceeds 80%"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 20
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space"
          description: "Instance {{ $labels.instance }} has less than 20% disk space available"
```

### Application-Level Alerts

```yaml
groups:
  - name: application-alerts
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) by (job)
          / sum(rate(http_requests_total[5m])) by (job) * 100 > 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High HTTP error rate"
          description: "Service {{ $labels.job }} has {{ $value | printf \"%.2f\" }}% 5xx error rate"

      # High request latency
      - alert: HighRequestLatency
        expr: |
          histogram_quantile(0.99,
            sum by (le, handler) (rate(http_request_duration_seconds_bucket[5m]))
          ) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High request latency"
          description: "Handler {{ $labels.handler }} P99 latency exceeds 2 seconds"

      # Service saturation
      - alert: ServiceSaturation
        expr: |
          sum(rate(http_requests_total[5m])) by (job)
          / on(job) group_left service_max_requests > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Service approaching capacity"
          description: "Service {{ $labels.job }} is at {{ $value | printf \"%.0f\" }}% capacity"

      # Pod restart alert for Kubernetes
      - alert: PodRestarting
        expr: increase(kube_pod_container_status_restarts_total[1h]) > 3
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Pod restarting frequently"
          description: "Pod {{ $labels.namespace }}/{{ $labels.pod }} has restarted {{ $value }} times in the last hour"
```

### Alertmanager Routing

```yaml
# alertmanager.yml - Advanced routing example
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
    # Critical alerts go to PagerDuty immediately
    - match:
        severity: critical
      receiver: 'pagerduty-critical'
      group_wait: 10s
      continue: true  # Also send to other matching routes

    # Database alerts to DBA team
    - match_re:
        alertname: ^(MySQL|PostgreSQL|Redis).*
      receiver: 'dba-team'

    # Infrastructure alerts to ops team
    - match:
        team: infrastructure
      receiver: 'ops-team-slack'

    # Silence alerts during maintenance windows
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
    # Empty receiver for silencing

inhibit_rules:
  # If critical alert fires, suppress warning for same alertname
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']

  # If cluster is down, suppress all other cluster alerts
  - source_match:
      alertname: 'ClusterDown'
    target_match_re:
      alertname: '.+'
    equal: ['cluster']
```

## Service Discovery

Prometheus supports multiple service discovery mechanisms for automatically discovering monitoring targets.

### Static Configuration

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

### Kubernetes Service Discovery

```yaml
scrape_configs:
  # Discover pods with prometheus annotations
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      # Only scrape pods with prometheus.io/scrape annotation
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      # Use custom port from annotation
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
      # Use custom path from annotation
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      # Add pod labels
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: kubernetes_pod_name
      - source_labels: [__meta_kubernetes_namespace]
        target_label: kubernetes_namespace

  # Discover services
  - job_name: 'kubernetes-services'
    kubernetes_sd_configs:
      - role: service
    relabel_configs:
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
        action: keep
        regex: true

  # Discover nodes
  - job_name: 'kubernetes-nodes'
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)
```

### Consul Service Discovery

```yaml
scrape_configs:
  - job_name: 'consul-services'
    consul_sd_configs:
      - server: 'consul.example.com:8500'
        services: []  # Empty means all services
        tags:
          - prometheus  # Only services with this tag
    relabel_configs:
      - source_labels: [__meta_consul_tags]
        regex: .*,prometheus,.*
        action: keep
      - source_labels: [__meta_consul_service]
        target_label: service
      - source_labels: [__meta_consul_dc]
        target_label: datacenter
```

### File-Based Service Discovery

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

### EC2 Service Discovery

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

## Grafana Integration

Grafana is the most popular visualization tool for Prometheus data.

### Configuring Prometheus Data Source

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

### Dashboard Panels

#### System Resource Monitoring

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

#### Application Performance Monitoring

```promql
# Requests per second by endpoint
sum(rate(http_requests_total[1m])) by (handler)

# Latency heatmap
sum(rate(http_request_duration_seconds_bucket[5m])) by (le)

# Error rate by handler
sum(rate(http_requests_total{status=~"5.."}[5m])) by (handler)
/ sum(rate(http_requests_total[5m])) by (handler) * 100

# Apdex score (Application Performance Index)
(
  sum(rate(http_request_duration_seconds_bucket{le="0.5"}[5m]))
  + sum(rate(http_request_duration_seconds_bucket{le="2"}[5m]))
) / 2
/ sum(rate(http_request_duration_seconds_count[5m]))
```

### Recommended Community Dashboards

| Dashboard ID | Name | Purpose |
|-------------|------|---------|
| 1860 | Node Exporter Full | Comprehensive host metrics |
| 3662 | Prometheus 2.0 Overview | Prometheus self-monitoring |
| 7362 | MySQL Overview | MySQL database monitoring |
| 9628 | PostgreSQL Database | PostgreSQL monitoring |
| 11835 | Kubernetes Overview | K8s cluster monitoring |
| 12006 | Kubernetes / Compute Resources | K8s resource utilization |
| 13105 | NGINX Prometheus Exporter | NGINX web server |

## Best Practices

### Metric Naming Conventions

```
# Format: <namespace>_<name>_<unit>
# Examples:

# Counters should end with _total
http_requests_total
errors_total
processed_bytes_total

# Time measurements in seconds
http_request_duration_seconds
process_cpu_seconds_total

# Size measurements in bytes
memory_usage_bytes
file_size_bytes

# Use base units (seconds not milliseconds, bytes not kilobytes)
# Let visualization tools handle unit conversion
```

### Label Design Principles

1. **Avoid High Cardinality Labels**: Never use user IDs, request IDs, or timestamps as labels
2. **Keep Labels Consistent**: Same metric should have consistent labels across instances
3. **Use Meaningful Label Names**: Labels should clearly describe their purpose

```go
// Good practice
httpRequests.WithLabelValues("GET", "/api/users", "200")
httpRequests.WithLabelValues("POST", "/api/orders", "201")

// Bad practice - high cardinality
httpRequests.WithLabelValues(userID, requestID, timestamp)
```

### Alert Design Principles

```yaml
# Follow the alerting pyramid principle
# Critical: Requires immediate action, impacts users
# Warning: Needs attention, might develop into a problem
# Info: For reference only

# Symptom-based alerts (recommended)
- alert: HighErrorRate
  expr: error_rate > 5%
  # User-facing impact

# Cause-based alerts (supplementary)
- alert: DatabaseConnectionFailed
  expr: db_connections == 0
  # Root cause indicator
```

Alert best practices:
- Alert on symptoms, not causes when possible
- Include runbook URLs in annotations
- Set appropriate `for` durations to avoid flapping
- Use severity levels consistently
- Provide context in annotations with `{{ $labels }}` and `{{ $value }}`

### Performance Optimization

```yaml
# Set appropriate scrape intervals
scrape_interval: 30s  # Non-critical services can use longer intervals

# Use recording rules for expensive queries
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

# Configure data retention policy
# Command line flags:
--storage.tsdb.retention.time=15d
--storage.tsdb.retention.size=50GB

# Limit cardinality
# Use relabeling to drop unnecessary labels or metrics
relabel_configs:
  - source_labels: [__name__]
    regex: 'go_.*'
    action: drop
```

### High Availability Architecture

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

## Interview Key Points

### Common Interview Questions

**Q1: What are the differences between pull-based and push-based monitoring? What are the pros and cons of each?**

Pull-based (Prometheus default):
- Pros: Simple, reliable, easy to debug, no pressure on targets
- Cons: Requires exposed endpoints, firewall configuration can be complex

Push-based (via Pushgateway):
- Pros: Suitable for short-lived jobs, can traverse firewalls
- Cons: Single point of failure risk, cannot determine service health

**Q2: What is the difference between Counter and Gauge?**

- Counter: Only increases (or resets to zero), used for counting metrics (requests, errors)
- Gauge: Can increase or decrease, used for state metrics (temperature, memory usage)

**Q3: How do you calculate P99 latency for a service?**

```promql
histogram_quantile(0.99,
  sum by (le) (rate(http_request_duration_seconds_bucket[5m]))
)
```

**Q4: What is the difference between rate() and irate()?**

- `rate()`: Calculates average rate over the time range, smoother result
- `irate()`: Uses only the last two data points, more sensitive to spikes

**Q5: How do you handle high cardinality issues?**

1. Avoid high cardinality labels (user IDs, request IDs)
2. Use relabel_configs to filter unnecessary labels
3. Set appropriate metric retention policies
4. Use recording rules for pre-aggregation
5. Monitor cardinality with `prometheus_tsdb_head_series`

**Q6: Explain Prometheus architecture for high availability.**

1. Run multiple Prometheus instances scraping the same targets
2. Use external labels to distinguish instances
3. Deploy Alertmanager in cluster mode for HA alerting
4. Use Thanos or VictoriaMetrics for long-term storage and global view
5. Consider federation for hierarchical setups

**Q7: How do recording rules improve performance?**

Recording rules pre-compute expensive queries and store results as new time series:
- Reduces query latency for dashboards
- Decreases load on Prometheus during peak usage
- Enables complex queries that would otherwise timeout

### Architecture Design Points

```
1. High Availability Deployment
   - Multiple Prometheus instances scraping same targets
   - Alertmanager cluster deployment
   - External storage for durability

2. Federation
   - Global Prometheus aggregates from regional instances
   - Match labels to control what gets federated

3. Remote Storage
   - Use remote_write for long-term storage (Thanos, VictoriaMetrics, Cortex)
   - Enables unlimited retention and global querying
```

## Production Deployment

### Docker Compose Deployment

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

### Kubernetes Deployment with Helm

```bash
# Add Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create namespace
kubectl create namespace monitoring

# Install kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
  --set alertmanager.alertmanagerSpec.storage.volumeClaimTemplate.spec.resources.requests.storage=10Gi \
  --set grafana.adminPassword=your-secure-password

# Verify installation
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

### Troubleshooting Common Issues

#### Target Status is DOWN

```bash
# Check if target endpoint is reachable
curl -v http://target:9100/metrics

# Check Prometheus logs
docker logs prometheus 2>&1 | grep -i error

# Check firewall rules
iptables -L -n | grep 9100
```

#### Query Timeout

```promql
# Optimize queries - reduce time range
rate(http_requests_total[5m])  # instead of [1h]

# Use recording rules for pre-aggregation
# rules/recording.yml
groups:
  - name: aggregations
    rules:
      - record: job:http_requests:rate5m
        expr: sum by (job) (rate(http_requests_total[5m]))
```

#### Storage Space Issues

```bash
# Check TSDB block size
du -sh /prometheus/

# Adjust retention policy
--storage.tsdb.retention.time=7d
--storage.tsdb.retention.size=20GB

# Clean up tombstones (use carefully)
curl -X POST http://localhost:9090/api/v1/admin/tsdb/clean_tombstones
```

#### High Cardinality Diagnosis

```promql
# Check metric cardinality
prometheus_tsdb_head_series

# Find metrics with highest cardinality
topk(10, count by (__name__) ({__name__=~".+"}))

# Check label combination count for specific metric
count(http_requests_total)
```

## Further Reading

### Official Resources

- [Prometheus Official Documentation](https://prometheus.io/docs/)
- [PromQL Query Examples](https://prometheus.io/docs/prometheus/latest/querying/examples/)
- [Alerting Best Practices](https://prometheus.io/docs/practices/alerting/)
- [Instrumentation Best Practices](https://prometheus.io/docs/practices/instrumentation/)

### Recommended Books

- "Prometheus: Up & Running" by Brian Brazil (O'Reilly)
- "Cloud Native Monitoring with Prometheus" (Packt)

### Related Tools

| Tool | Purpose | Link |
|------|---------|------|
| Thanos | High availability and long-term storage | https://thanos.io |
| VictoriaMetrics | High-performance time series database | https://victoriametrics.com |
| Cortex | Multi-tenant Prometheus | https://cortexmetrics.io |
| Grafana Loki | Log aggregation system | https://grafana.com/oss/loki |
| Mimir | Scalable long-term storage | https://grafana.com/oss/mimir |

### Community Resources

- [Prometheus GitHub Repository](https://github.com/prometheus/prometheus)
- [Awesome Prometheus](https://github.com/roaldnefs/awesome-prometheus)
- [Prometheus Exporters List](https://prometheus.io/docs/instrumenting/exporters/)
- [PromCon Conference Talks](https://promcon.io/)

---

By mastering the concepts covered in this guide, you should have a solid understanding of Prometheus architecture, PromQL queries, alerting configuration, and operational best practices. Start with simple monitoring scenarios in your environment and progressively explore advanced features to build a comprehensive observability platform.
