---
title: OpenTelemetry 可观测性
description: 使用OpenTelemetry实现统一可观测性
track: devops
section: observability
difficulty: intermediate
tags:
  - OpenTelemetry
  - 可观测性
  - 追踪
  - 监控
status: imported
origin: old/src/content/docs/devops/opentelemetry.zh.md
divergence: 0.138
issues: []
legacy:
  category: DevOps
  subcategory: Observability
  order: 27
  lastUpdated: 2026-01-07
---

## 概念解释

OpenTelemetry（简称 OTel）是云原生计算基金会（CNCF）的一个开源可观测性框架，用于生成、收集、处理和导出遥测数据。它由 OpenTracing 和 OpenCensus 两个项目合并而成，旨在为可观测性提供统一的标准和工具集。

### 为什么选择 OpenTelemetry

在现代分布式系统中，可观测性变得越来越重要：

- **统一标准**：为追踪、指标和日志提供统一的 API 和 SDK
- **厂商中立**：不绑定特定的后端服务，可以灵活切换
- **开源生态**：拥有活跃的社区和丰富的集成支持
- **自动化仪表**：支持多种语言的自动仪表化
- **云原生支持**：与 Kubernetes、Prometheus 等云原生工具无缝集成

### 可观测性三大支柱

OpenTelemetry 统一了可观测性的三大核心组件：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          可观测性三大支柱                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     Traces      │      │     Metrics     │      │      Logs       │
│    (追踪数据)    │      │    (指标数据)    │      │    (日志数据)    │
├─────────────────┤      ├─────────────────┤      ├─────────────────┤
│ - 请求链路追踪   │      │ - 系统性能指标   │      │ - 应用程序日志   │
│ - 服务依赖关系   │      │ - 业务指标统计   │      │ - 事件记录      │
│ - 性能瓶颈分析   │      │ - 资源使用监控   │      │ - 错误堆栈信息   │
│ - 故障根因定位   │      │ - 告警阈值触发   │      │ - 调试信息      │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    ▼
                        ┌─────────────────────┐
                        │   OpenTelemetry     │
                        │   统一收集与导出     │
                        └─────────────────────┘
```

## Traces（追踪）

追踪是理解分布式系统中请求流转的关键工具，它记录了请求在各个服务间的完整调用路径。

### 核心概念

#### Trace（追踪）

一个 Trace 代表一个完整的请求从开始到结束的整个生命周期：

```
Trace ID: 4bf92f3577b34da6a3ce929d0e0e4736
│
├── Span: API Gateway (root span)
│   ├── Duration: 250ms
│   └── Attributes: http.method=GET, http.url=/api/orders
│
├── Span: User Service
│   ├── Duration: 50ms
│   └── Attributes: db.system=postgresql
│
└── Span: Order Service
    ├── Duration: 150ms
    └── Attributes: messaging.system=kafka
```

#### Span（跨度）

Span 是追踪的基本单元，代表一次具体的操作：

```go
// Go 示例：创建 Span
package main

import (
    "context"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/trace"
)

func processOrder(ctx context.Context, orderID string) error {
    tracer := otel.Tracer("order-service")

    // 创建新的 Span
    ctx, span := tracer.Start(ctx, "processOrder",
        trace.WithAttributes(
            attribute.String("order.id", orderID),
            attribute.String("order.status", "processing"),
        ),
    )
    defer span.End()

    // 添加事件
    span.AddEvent("order_validation_started")

    // 业务逻辑处理
    if err := validateOrder(ctx, orderID); err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
        return err
    }

    span.AddEvent("order_validation_completed")
    span.SetStatus(codes.Ok, "order processed successfully")

    return nil
}
```

#### Span Context（跨度上下文）

Span Context 包含了在服务间传递追踪信息所需的数据：

```json
{
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "trace_flags": "01",
  "trace_state": "vendor1=value1,vendor2=value2"
}
```

### Context Propagation（上下文传播）

上下文传播确保追踪信息在服务间正确传递：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          W3C Trace Context 标准                              │
└─────────────────────────────────────────────────────────────────────────────┘

HTTP Headers:
┌──────────────────────────────────────────────────────────────────────────────┐
│ traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01        │
│              │   │                                 │                    │    │
│              │   │                                 │                    │    │
│              │   Trace ID (32 hex)                 Span ID (16 hex)     │    │
│              │                                                          │    │
│              Version                                              Trace Flags│
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ tracestate: rojo=00f067aa0ba902b7,congo=t61rcWkgMzE                          │
│             └── 厂商特定的追踪状态信息                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

```python
# Python 示例：HTTP 上下文传播
from opentelemetry import trace
from opentelemetry.propagate import inject, extract
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
import requests

propagator = TraceContextTextMapPropagator()

def call_downstream_service(ctx, url):
    tracer = trace.get_tracer(__name__)

    with tracer.start_as_current_span("http_request", context=ctx) as span:
        headers = {}
        # 注入追踪上下文到 HTTP headers
        inject(headers)

        span.set_attribute("http.url", url)
        span.set_attribute("http.method", "GET")

        response = requests.get(url, headers=headers)

        span.set_attribute("http.status_code", response.status_code)
        return response

def handle_incoming_request(request):
    # 从传入请求中提取追踪上下文
    ctx = extract(request.headers)

    tracer = trace.get_tracer(__name__)
    with tracer.start_as_current_span("handle_request", context=ctx):
        # 处理请求
        pass
```

## Metrics（指标）

OpenTelemetry Metrics 提供了统一的指标收集和导出机制，支持多种指标类型。

### 指标类型

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OpenTelemetry 指标类型                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Counter      │     │   UpDownCounter │     │    Histogram    │
│   (计数器)       │     │  (可增减计数器)  │     │    (直方图)      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ 只增不减的累计值  │     │ 可增可减的值     │     │ 值的分布统计     │
│                 │     │                 │     │                 │
│ 示例:           │     │ 示例:           │     │ 示例:           │
│ - 请求总数      │     │ - 活跃连接数     │     │ - 请求延迟      │
│ - 错误次数      │     │ - 队列大小       │     │ - 响应大小      │
│ - 处理的字节数   │     │ - 内存使用量     │     │ - 处理时间      │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│     Gauge       │     │ Observable      │
│    (仪表)       │     │  (可观察指标)    │
├─────────────────┤     ├─────────────────┤
│ 瞬时值测量       │     │ 异步回调采集     │
│                 │     │                 │
│ 示例:           │     │ 示例:           │
│ - CPU 使用率    │     │ - 系统负载      │
│ - 温度值        │     │ - 文件描述符数   │
│ - 当前价格      │     │ - 线程数        │
└─────────────────┘     └─────────────────┘
```

### 指标实现示例

```java
// Java 示例：创建和使用指标
import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.metrics.LongCounter;
import io.opentelemetry.api.metrics.LongHistogram;
import io.opentelemetry.api.metrics.Meter;
import io.opentelemetry.api.common.Attributes;

public class OrderMetrics {
    private final LongCounter orderCounter;
    private final LongHistogram orderProcessingTime;
    private final Meter meter;

    public OrderMetrics(OpenTelemetry openTelemetry) {
        this.meter = openTelemetry.getMeter("order-service");

        // 创建计数器
        this.orderCounter = meter
            .counterBuilder("orders.total")
            .setDescription("Total number of orders processed")
            .setUnit("1")
            .build();

        // 创建直方图
        this.orderProcessingTime = meter
            .histogramBuilder("orders.processing_time")
            .setDescription("Order processing time")
            .setUnit("ms")
            .ofLongs()
            .build();

        // 创建可观察仪表（异步）
        meter.gaugeBuilder("orders.pending")
            .setDescription("Number of pending orders")
            .buildWithCallback(measurement -> {
                measurement.record(getPendingOrderCount(),
                    Attributes.of(AttributeKey.stringKey("region"), "us-west"));
            });
    }

    public void recordOrder(String status, long processingTimeMs) {
        Attributes attributes = Attributes.of(
            AttributeKey.stringKey("order.status"), status,
            AttributeKey.stringKey("order.type"), "standard"
        );

        orderCounter.add(1, attributes);
        orderProcessingTime.record(processingTimeMs, attributes);
    }

    private long getPendingOrderCount() {
        // 返回当前待处理订单数
        return 42;
    }
}
```

```javascript
// Node.js 示例：指标收集
const { MeterProvider, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// 配置 Meter Provider
const meterProvider = new MeterProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'order-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
});

// 配置指标导出器
const metricExporter = new OTLPMetricExporter({
  url: 'http://localhost:4318/v1/metrics',
});

meterProvider.addMetricReader(new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: 60000,
}));

// 获取 Meter
const meter = meterProvider.getMeter('order-metrics');

// 创建指标
const httpRequestCounter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
});

const httpRequestDuration = meter.createHistogram('http_request_duration_ms', {
  description: 'HTTP request duration in milliseconds',
  unit: 'ms',
});

const activeConnections = meter.createUpDownCounter('active_connections', {
  description: 'Number of active connections',
});

// 使用指标
function handleRequest(req, res) {
  const startTime = Date.now();

  activeConnections.add(1);

  // 处理请求...

  const duration = Date.now() - startTime;

  httpRequestCounter.add(1, {
    method: req.method,
    path: req.path,
    status: res.statusCode,
  });

  httpRequestDuration.record(duration, {
    method: req.method,
    path: req.path,
  });

  activeConnections.add(-1);
}
```

## Logs（日志）

OpenTelemetry Logs API 提供了结构化日志的标准化方式，并支持与追踪数据的关联。

### 日志模型

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OpenTelemetry Log Record                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ Timestamp: 2024-01-15T10:30:00.000000000Z                                   │
│ Observed Timestamp: 2024-01-15T10:30:00.001000000Z                          │
│ Trace ID: 4bf92f3577b34da6a3ce929d0e0e4736                                  │
│ Span ID: 00f067aa0ba902b7                                                   │
│ Severity: ERROR                                                              │
│ Severity Number: 17                                                          │
│ Body: "Failed to process order: insufficient inventory"                      │
│ Attributes:                                                                  │
│   - order.id: "ORD-12345"                                                   │
│   - error.type: "InventoryException"                                        │
│   - inventory.available: 5                                                  │
│   - inventory.requested: 10                                                 │
│ Resource:                                                                    │
│   - service.name: "order-service"                                           │
│   - service.version: "1.0.0"                                                │
│   - host.name: "prod-server-01"                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 日志与追踪关联

```python
# Python 示例：日志与追踪关联
import logging
from opentelemetry import trace
from opentelemetry._logs import set_logger_provider
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.exporter.otlp.proto.grpc._log_exporter import OTLPLogExporter

# 配置 Logger Provider
logger_provider = LoggerProvider()
set_logger_provider(logger_provider)

# 配置 OTLP 日志导出器
otlp_exporter = OTLPLogExporter(endpoint="localhost:4317", insecure=True)
logger_provider.add_log_record_processor(BatchLogRecordProcessor(otlp_exporter))

# 配置日志处理器
handler = LoggingHandler(level=logging.INFO, logger_provider=logger_provider)
logging.getLogger().addHandler(handler)
logging.getLogger().setLevel(logging.INFO)

logger = logging.getLogger(__name__)

def process_order(order_id: str):
    tracer = trace.get_tracer(__name__)

    with tracer.start_as_current_span("process_order") as span:
        span.set_attribute("order.id", order_id)

        # 日志会自动关联当前的 Trace 和 Span
        logger.info(f"Starting order processing", extra={
            "order.id": order_id,
            "order.status": "processing"
        })

        try:
            # 处理订单逻辑
            validate_order(order_id)
            logger.info(f"Order validated successfully", extra={"order.id": order_id})

        except Exception as e:
            logger.error(f"Order processing failed: {e}", extra={
                "order.id": order_id,
                "error.type": type(e).__name__
            }, exc_info=True)
            raise
```

## Instrumentation（仪表化）

仪表化是将可观测性代码集成到应用程序中的过程。OpenTelemetry 支持自动和手动两种仪表化方式。

### 自动仪表化

自动仪表化无需修改业务代码，通过代理或库钩子自动注入追踪代码：

```yaml
# Java Agent 自动仪表化配置
# 启动参数：-javaagent:opentelemetry-javaagent.jar

# 环境变量配置
OTEL_SERVICE_NAME: order-service
OTEL_TRACES_EXPORTER: otlp
OTEL_METRICS_EXPORTER: otlp
OTEL_LOGS_EXPORTER: otlp
OTEL_EXPORTER_OTLP_ENDPOINT: http://localhost:4317

# 高级配置
OTEL_INSTRUMENTATION_COMMON_DEFAULT_ENABLED: true
OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_SERVER_REQUEST: Authorization,Content-Type
OTEL_INSTRUMENTATION_HTTP_CAPTURE_HEADERS_SERVER_RESPONSE: Content-Type
OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT: 1000
```

```bash
# Python 自动仪表化
pip install opentelemetry-distro opentelemetry-exporter-otlp

# 安装所有可用的仪表化库
opentelemetry-bootstrap -a install

# 使用自动仪表化运行应用
opentelemetry-instrument \
    --service_name order-service \
    --traces_exporter otlp \
    --metrics_exporter otlp \
    --exporter_otlp_endpoint http://localhost:4317 \
    python app.py
```

```javascript
// Node.js 自动仪表化
// tracing.js - 在应用入口前引入
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');

const sdk = new NodeSDK({
  serviceName: 'order-service',
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://localhost:4318/v1/metrics',
    }),
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/health', '/metrics'],
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
      },
    }),
  ],
});

sdk.start();

// 优雅关闭
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

### 手动仪表化

手动仪表化提供更精细的控制：

```go
// Go 手动仪表化示例
package main

import (
    "context"
    "log"
    "time"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
    "go.opentelemetry.io/otel/trace"
)

func initTracer() (*sdktrace.TracerProvider, error) {
    ctx := context.Background()

    // 创建 OTLP 导出器
    exporter, err := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint("localhost:4317"),
        otlptracegrpc.WithInsecure(),
    )
    if err != nil {
        return nil, err
    }

    // 定义资源属性
    res, err := resource.New(ctx,
        resource.WithAttributes(
            semconv.ServiceName("order-service"),
            semconv.ServiceVersion("1.0.0"),
            attribute.String("environment", "production"),
        ),
    )
    if err != nil {
        return nil, err
    }

    // 创建 TracerProvider
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(res),
        sdktrace.WithSampler(sdktrace.TraceIDRatioBased(0.5)), // 50% 采样率
    )

    otel.SetTracerProvider(tp)

    return tp, nil
}

func main() {
    tp, err := initTracer()
    if err != nil {
        log.Fatal(err)
    }
    defer func() {
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()
        tp.Shutdown(ctx)
    }()

    tracer := otel.Tracer("order-processor")

    ctx, span := tracer.Start(context.Background(), "main",
        trace.WithSpanKind(trace.SpanKindServer),
    )
    defer span.End()

    processOrders(ctx)
}

func processOrders(ctx context.Context) {
    tracer := otel.Tracer("order-processor")

    ctx, span := tracer.Start(ctx, "processOrders",
        trace.WithAttributes(
            attribute.Int("batch.size", 100),
        ),
    )
    defer span.End()

    // 模拟处理
    for i := 0; i < 3; i++ {
        processOrder(ctx, i)
    }
}

func processOrder(ctx context.Context, orderID int) {
    tracer := otel.Tracer("order-processor")

    _, span := tracer.Start(ctx, "processOrder",
        trace.WithAttributes(
            attribute.Int("order.id", orderID),
        ),
    )
    defer span.End()

    // 模拟处理时间
    time.Sleep(100 * time.Millisecond)

    span.AddEvent("order_processed", trace.WithAttributes(
        attribute.String("status", "completed"),
    ))
}
```

## OpenTelemetry Collector

OpenTelemetry Collector 是一个独立的数据收集和处理组件，位于应用程序和后端之间。

### 架构概览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      OpenTelemetry Collector 架构                            │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────┐
                    │      OpenTelemetry Collector     │
                    └─────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│    Receivers    │      │   Processors    │      │    Exporters    │
│    (接收器)      │      │    (处理器)     │      │    (导出器)     │
├─────────────────┤      ├─────────────────┤      ├─────────────────┤
│ - OTLP          │      │ - Batch         │      │ - OTLP          │
│ - Jaeger        │      │ - Memory Limit  │      │ - Jaeger        │
│ - Zipkin        │      │ - Filter        │      │ - Prometheus    │
│ - Prometheus    │      │ - Attributes    │      │ - Elasticsearch │
│ - Kafka         │      │ - Sampling      │      │ - Kafka         │
│ - Fluentd       │      │ - Transform     │      │ - Loki          │
└─────────────────┘      └─────────────────┘      └─────────────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    ▼
                    ┌─────────────────────────────────┐
                    │           Pipelines             │
                    │  traces | metrics | logs        │
                    └─────────────────────────────────┘
```

### Collector 配置

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
        cors:
          allowed_origins:
            - "http://localhost:*"
            - "https://*.example.com"

  # Prometheus 接收器
  prometheus:
    config:
      scrape_configs:
        - job_name: 'kubernetes-pods'
          kubernetes_sd_configs:
            - role: pod
          relabel_configs:
            - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
              action: keep
              regex: true

  # Jaeger 接收器（兼容旧系统）
  jaeger:
    protocols:
      thrift_http:
        endpoint: 0.0.0.0:14268
      grpc:
        endpoint: 0.0.0.0:14250

processors:
  # 批处理器 - 提高性能
  batch:
    timeout: 10s
    send_batch_size: 1000
    send_batch_max_size: 2000

  # 内存限制器 - 防止 OOM
  memory_limiter:
    check_interval: 1s
    limit_mib: 1000
    spike_limit_mib: 200

  # 属性处理器 - 添加/修改属性
  attributes:
    actions:
      - key: environment
        value: production
        action: insert
      - key: sensitive_data
        action: delete

  # 过滤处理器 - 过滤数据
  filter/traces:
    traces:
      span:
        - 'attributes["http.url"] == "/health"'
        - 'name == "internal-heartbeat"'

  # 采样处理器 - 尾部采样
  tail_sampling:
    decision_wait: 10s
    num_traces: 100000
    policies:
      - name: errors
        type: status_code
        status_code: {status_codes: [ERROR]}
      - name: slow-traces
        type: latency
        latency: {threshold_ms: 1000}
      - name: probabilistic
        type: probabilistic
        probabilistic: {sampling_percentage: 10}

exporters:
  # OTLP 导出器
  otlp/jaeger:
    endpoint: jaeger-collector:4317
    tls:
      insecure: true

  # Prometheus 导出器
  prometheus:
    endpoint: 0.0.0.0:8889
    namespace: otel
    send_timestamps: true
    metric_expiration: 5m
    resource_to_telemetry_conversion:
      enabled: true

  # Elasticsearch 导出器（日志）
  elasticsearch:
    endpoints: ["https://elasticsearch:9200"]
    logs_index: otel-logs
    traces_index: otel-traces
    user: elastic
    password: ${ELASTIC_PASSWORD}

  # Loki 导出器
  loki:
    endpoint: http://loki:3100/loki/api/v1/push
    labels:
      attributes:
        service.name: "service"
        severity: "severity"

  # 调试导出器
  debug:
    verbosity: detailed

extensions:
  # 健康检查
  health_check:
    endpoint: 0.0.0.0:13133

  # pprof 性能分析
  pprof:
    endpoint: 0.0.0.0:1777

  # zpages 诊断
  zpages:
    endpoint: 0.0.0.0:55679

service:
  extensions: [health_check, pprof, zpages]

  pipelines:
    traces:
      receivers: [otlp, jaeger]
      processors: [memory_limiter, filter/traces, tail_sampling, batch]
      exporters: [otlp/jaeger, debug]

    metrics:
      receivers: [otlp, prometheus]
      processors: [memory_limiter, batch]
      exporters: [prometheus]

    logs:
      receivers: [otlp]
      processors: [memory_limiter, attributes, batch]
      exporters: [elasticsearch, loki]

  telemetry:
    logs:
      level: info
    metrics:
      address: 0.0.0.0:8888
```

### Collector 部署模式

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Collector 部署模式                                       │
└─────────────────────────────────────────────────────────────────────────────┘

方式一：Agent 模式（Sidecar / DaemonSet）
┌─────────────────────────────────────────────────────────────────┐
│  Pod / Node                                                      │
│  ┌───────────────┐    ┌───────────────┐                         │
│  │  Application  │───►│   Collector   │───► Backend             │
│  │               │    │   (Agent)     │                         │
│  └───────────────┘    └───────────────┘                         │
└─────────────────────────────────────────────────────────────────┘

方式二：Gateway 模式（集中式）
┌───────────┐
│   App 1   │────┐
└───────────┘    │
┌───────────┐    │     ┌───────────────┐
│   App 2   │────┼────►│   Collector   │───► Backend
└───────────┘    │     │   (Gateway)   │
┌───────────┐    │     └───────────────┘
│   App 3   │────┘
└───────────┘

方式三：混合模式（推荐生产环境）
┌─────────────────────────────────────────────────────────────────┐
│  Node 1                                                          │
│  ┌─────────┐  ┌─────────┐                                       │
│  │  App 1  │  │  App 2  │                                       │
│  └────┬────┘  └────┬────┘                                       │
│       │            │                                             │
│       └─────┬──────┘                                             │
│             ▼                                                    │
│    ┌────────────────┐                                           │
│    │ Agent Collector│                                           │
│    └───────┬────────┘                                           │
└────────────┼────────────────────────────────────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Gateway Collector  │───► Jaeger / Prometheus / Elasticsearch
    │   (Load Balanced)  │
    └────────────────────┘
```

### Kubernetes 部署

```yaml
# otel-collector-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: otel-collector
  namespace: observability
spec:
  replicas: 3
  selector:
    matchLabels:
      app: otel-collector
  template:
    metadata:
      labels:
        app: otel-collector
    spec:
      containers:
        - name: collector
          image: otel/opentelemetry-collector-contrib:0.92.0
          args:
            - --config=/etc/otel/config.yaml
          ports:
            - containerPort: 4317  # OTLP gRPC
            - containerPort: 4318  # OTLP HTTP
            - containerPort: 8888  # Metrics
            - containerPort: 8889  # Prometheus exporter
            - containerPort: 13133 # Health check
          env:
            - name: ELASTIC_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: elasticsearch-credentials
                  key: password
          resources:
            requests:
              cpu: 200m
              memory: 400Mi
            limits:
              cpu: 1000m
              memory: 2Gi
          volumeMounts:
            - name: config
              mountPath: /etc/otel
          livenessProbe:
            httpGet:
              path: /
              port: 13133
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /
              port: 13133
            initialDelaySeconds: 5
            periodSeconds: 5
      volumes:
        - name: config
          configMap:
            name: otel-collector-config
---
apiVersion: v1
kind: Service
metadata:
  name: otel-collector
  namespace: observability
spec:
  selector:
    app: otel-collector
  ports:
    - name: otlp-grpc
      port: 4317
      targetPort: 4317
    - name: otlp-http
      port: 4318
      targetPort: 4318
    - name: prometheus
      port: 8889
      targetPort: 8889
```

## Exporters（导出器）

导出器负责将收集的遥测数据发送到各种后端系统。

### 常用导出器配置

```yaml
# 完整的导出器配置示例
exporters:
  # OTLP 导出器（通用）
  otlp:
    endpoint: otel-collector.observability:4317
    tls:
      cert_file: /certs/client.crt
      key_file: /certs/client.key
      ca_file: /certs/ca.crt
    headers:
      Authorization: "Bearer ${API_TOKEN}"
    compression: gzip
    timeout: 30s
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
      max_elapsed_time: 300s

  # Jaeger 导出器
  jaeger:
    endpoint: jaeger-collector:14250
    tls:
      insecure: true

  # Zipkin 导出器
  zipkin:
    endpoint: http://zipkin:9411/api/v2/spans
    format: proto

  # Prometheus Remote Write
  prometheusremotewrite:
    endpoint: http://prometheus:9090/api/v1/write
    tls:
      insecure: true
    external_labels:
      cluster: production
    resource_to_telemetry_conversion:
      enabled: true

  # AWS X-Ray
  awsxray:
    region: us-west-2
    role_arn: "arn:aws:iam::123456789:role/xray-role"
    indexed_attributes:
      - otel.resource.service.name
      - aws.xray.sdk

  # Google Cloud Trace
  googlecloud:
    project: my-gcp-project
    trace:
      attribute_mappings:
        - key: "service.name"
          replacement: "/custom/service_name"

  # Azure Monitor
  azuremonitor:
    connection_string: "${APPLICATIONINSIGHTS_CONNECTION_STRING}"
    maxbatchsize: 100
    maxbatchinterval: 10s

  # Datadog
  datadog:
    api:
      site: datadoghq.com
      key: ${DD_API_KEY}
    traces:
      span_name_as_resource_name: true
    metrics:
      histograms:
        mode: distributions
```

## Backend Integration（后端集成）

### Jaeger 集成

```yaml
# docker-compose-jaeger.yaml
version: '3.8'
services:
  jaeger:
    image: jaegertracing/all-in-one:1.53
    ports:
      - "16686:16686"  # UI
      - "14268:14268"  # HTTP collector
      - "14250:14250"  # gRPC collector
      - "4317:4317"    # OTLP gRPC
      - "4318:4318"    # OTLP HTTP
    environment:
      - COLLECTOR_OTLP_ENABLED=true
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://elasticsearch:9200

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.3
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
```

### Grafana + Tempo 集成

```yaml
# tempo-config.yaml
server:
  http_listen_port: 3200

distributor:
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: 0.0.0.0:4317
        http:
          endpoint: 0.0.0.0:4318

ingester:
  trace_idle_period: 10s
  max_block_bytes: 1_000_000
  max_block_duration: 5m

compactor:
  compaction:
    compaction_window: 1h
    max_block_bytes: 100_000_000
    block_retention: 1h
    compacted_block_retention: 10m

storage:
  trace:
    backend: local
    local:
      path: /tmp/tempo/blocks
    wal:
      path: /tmp/tempo/wal

querier:
  frontend_worker:
    frontend_address: tempo-query-frontend:9095
```

```yaml
# grafana-datasource.yaml
apiVersion: 1
datasources:
  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
    jsonData:
      httpMethod: GET
      tracesToLogs:
        datasourceUid: loki
        tags: ['service.name']
        mappedTags: [{ key: 'service.name', value: 'service' }]
        mapTagNamesEnabled: true
        spanStartTimeShift: '1h'
        spanEndTimeShift: '1h'
        filterByTraceID: true
        filterBySpanID: true
      serviceMap:
        datasourceUid: prometheus
      search:
        hide: false
      nodeGraph:
        enabled: true
      lokiSearch:
        datasourceUid: loki
```

### Prometheus + Grafana 指标集成

```yaml
# prometheus-scrape-config.yaml
scrape_configs:
  # 抓取 OpenTelemetry Collector 暴露的指标
  - job_name: 'otel-collector'
    static_configs:
      - targets: ['otel-collector:8889']

  # 抓取 Collector 内部指标
  - job_name: 'otel-collector-internal'
    static_configs:
      - targets: ['otel-collector:8888']

  # Kubernetes 服务发现
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        target_label: __address__
        regex: (.+)
        replacement: ${1}:${2}
```

## 采样策略

采样策略对于控制追踪数据量和成本至关重要。

### 采样类型

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          采样策略类型                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      头部采样 (Head Sampling)                    │
│                                                                  │
│  在 Span 开始时决定是否采样                                        │
│                                                                  │
│  优点：                          缺点：                           │
│  - 简单高效                      - 可能丢失重要追踪                │
│  - 低开销                        - 无法基于完整追踪特征做决策        │
│                                                                  │
│  实现方式：                                                       │
│  - TraceIdRatioBased (按比例)                                    │
│  - AlwaysOn / AlwaysOff                                         │
│  - ParentBased (基于父 Span)                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      尾部采样 (Tail Sampling)                    │
│                                                                  │
│  在 Span 结束后决定是否采样                                        │
│                                                                  │
│  优点：                          缺点：                           │
│  - 可基于完整追踪特征决策         - 需要更多内存和资源              │
│  - 保证重要追踪被采样             - 需要等待追踪完成                 │
│                                                                  │
│  实现方式：                                                       │
│  - 基于延迟 (Latency-based)                                      │
│  - 基于状态码 (Status-based)                                     │
│  - 基于属性 (Attribute-based)                                    │
│  - 组合策略 (Composite)                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 采样配置示例

```go
// Go SDK 采样配置
package main

import (
    "go.opentelemetry.io/otel/sdk/trace"
)

func configureSampler() trace.Sampler {
    // 组合采样器
    return trace.ParentBased(
        // 根采样器：10% 采样率
        trace.TraceIDRatioBased(0.1),
        // 远程父 Span 已采样时：继承
        trace.WithRemoteParentSampled(trace.AlwaysSample()),
        // 远程父 Span 未采样时：不采样
        trace.WithRemoteParentNotSampled(trace.NeverSample()),
        // 本地父 Span 已采样时：继承
        trace.WithLocalParentSampled(trace.AlwaysSample()),
        // 本地父 Span 未采样时：不采样
        trace.WithLocalParentNotSampled(trace.NeverSample()),
    )
}
```

```yaml
# Collector 尾部采样配置
processors:
  tail_sampling:
    decision_wait: 10s
    num_traces: 100000
    expected_new_traces_per_sec: 1000
    policies:
      # 策略1：保留所有错误追踪
      - name: error-policy
        type: status_code
        status_code:
          status_codes: [ERROR]

      # 策略2：保留高延迟追踪
      - name: latency-policy
        type: latency
        latency:
          threshold_ms: 1000

      # 策略3：保留特定服务的追踪
      - name: service-policy
        type: string_attribute
        string_attribute:
          key: service.name
          values: [payment-service, order-service]

      # 策略4：按比例采样其余追踪
      - name: probabilistic-policy
        type: probabilistic
        probabilistic:
          sampling_percentage: 10

      # 策略5：组合策略
      - name: composite-policy
        type: composite
        composite:
          max_total_spans_per_second: 1000
          policy_order: [error-policy, latency-policy, probabilistic-policy]
          rate_allocation:
            - policy: error-policy
              percent: 50
            - policy: latency-policy
              percent: 30
            - policy: probabilistic-policy
              percent: 20
```

## 最佳实践

### 命名约定

```yaml
# 遵循 OpenTelemetry 语义约定
资源属性:
  service.name: order-service
  service.version: 1.2.3
  service.namespace: production
  deployment.environment: prod
  host.name: server-001
  k8s.pod.name: order-service-abc123
  k8s.namespace.name: default

Span 属性:
  # HTTP
  http.method: GET
  http.url: /api/orders
  http.status_code: 200
  http.request_content_length: 1024

  # 数据库
  db.system: postgresql
  db.name: orders_db
  db.operation: SELECT
  db.statement: "SELECT * FROM orders WHERE id = ?"

  # 消息队列
  messaging.system: kafka
  messaging.destination: orders-topic
  messaging.operation: publish

  # RPC
  rpc.system: grpc
  rpc.service: OrderService
  rpc.method: GetOrder
```

### 资源检测

```python
# Python 自动资源检测
from opentelemetry.sdk.resources import Resource, get_aggregated_resources
from opentelemetry.sdk.resources import (
    SERVICE_NAME,
    SERVICE_VERSION,
    DEPLOYMENT_ENVIRONMENT,
)
from opentelemetry.resource.detector.azure import (
    AzureVMResourceDetector,
    AzureAppServiceResourceDetector,
)
from opentelemetry.resource.detector.gcp import GoogleCloudResourceDetector

# 聚合多个资源检测器
resource = get_aggregated_resources([
    AzureVMResourceDetector(),
    GoogleCloudResourceDetector(),
]).merge(Resource.create({
    SERVICE_NAME: "order-service",
    SERVICE_VERSION: "1.0.0",
    DEPLOYMENT_ENVIRONMENT: "production",
}))
```

### 性能优化

```yaml
# Collector 性能优化配置
processors:
  batch:
    # 减少导出频率
    timeout: 10s
    send_batch_size: 10000
    send_batch_max_size: 20000

  memory_limiter:
    # 防止内存溢出
    check_interval: 1s
    limit_percentage: 75
    spike_limit_percentage: 25

  # 属性过滤 - 减少数据量
  filter:
    spans:
      exclude:
        match_type: regexp
        span_names:
          - "health.*"
          - "metrics.*"

  # 资源检测器缓存
  resourcedetection:
    detectors: [env, system, docker, gcp, aws]
    timeout: 5s
    override: false

extensions:
  # 启用 pprof 进行性能分析
  pprof:
    endpoint: 0.0.0.0:1777

  # 启用 zpages 进行诊断
  zpages:
    endpoint: 0.0.0.0:55679

service:
  telemetry:
    logs:
      level: warn  # 生产环境降低日志级别
    metrics:
      level: detailed
      address: 0.0.0.0:8888
```

### 安全配置

```yaml
# 安全相关配置
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
        tls:
          cert_file: /certs/server.crt
          key_file: /certs/server.key
          client_ca_file: /certs/ca.crt
        auth:
          authenticator: oauth2client

extensions:
  oauth2client:
    client_id: ${CLIENT_ID}
    client_secret: ${CLIENT_SECRET}
    token_url: https://auth.example.com/oauth/token

processors:
  # 移除敏感属性
  attributes:
    actions:
      - key: http.request.header.authorization
        action: delete
      - key: db.statement
        action: hash  # 哈希处理而非删除
      - key: user.email
        pattern: "^(.{2}).*(@.*)$"
        replacement: "$1***$2"
        action: extract

  # 过滤敏感 span
  filter:
    spans:
      exclude:
        match_type: strict
        attributes:
          - key: internal
            value: true
```

## 故障排查

### 常见问题诊断

```bash
# 检查 Collector 健康状态
curl http://localhost:13133/

# 查看 Collector 指标
curl http://localhost:8888/metrics

# 检查 zpages
# Pipeline 状态: http://localhost:55679/debug/pipelinez
# 扩展状态: http://localhost:55679/debug/extensionz
# 追踪页面: http://localhost:55679/debug/tracez

# 检查数据是否到达 Collector
curl http://localhost:55679/debug/tracez | jq '.spans[] | select(.status == "ERROR")'

# 测试 OTLP 端点
grpcurl -plaintext localhost:4317 list
```

### 调试配置

```yaml
# 启用调试导出器
exporters:
  debug:
    verbosity: detailed
    sampling_initial: 5
    sampling_thereafter: 200

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp, debug]  # 添加 debug 导出器

  telemetry:
    logs:
      level: debug
      output_paths: ["stdout", "/var/log/otel/collector.log"]
      error_output_paths: ["stderr", "/var/log/otel/collector-error.log"]
```

### 日志检查清单

```markdown
## OpenTelemetry 故障排查清单

### 连接问题
- [ ] 检查 Collector 端点是否可达
- [ ] 验证 TLS 证书配置
- [ ] 确认防火墙规则
- [ ] 检查服务发现配置

### 数据丢失
- [ ] 检查采样配置
- [ ] 验证过滤规则
- [ ] 确认批处理大小
- [ ] 检查内存限制

### 性能问题
- [ ] 监控 Collector 资源使用
- [ ] 检查队列大小
- [ ] 分析导出延迟
- [ ] 优化批处理配置

### 数据质量
- [ ] 验证属性命名
- [ ] 检查资源检测
- [ ] 确认上下文传播
- [ ] 验证采样一致性
```

## 总结

OpenTelemetry 作为云原生可观测性的统一标准，提供了完整的追踪、指标和日志解决方案。通过本指南，您应该能够：

1. **理解核心概念**：掌握 Traces、Metrics、Logs 三大支柱及其关系
2. **实现仪表化**：使用自动或手动方式为应用添加可观测性
3. **部署 Collector**：配置和优化 OpenTelemetry Collector
4. **集成后端**：将数据导出到 Jaeger、Prometheus、Grafana 等后端
5. **优化性能**：通过采样和配置优化控制数据量和成本
6. **故障排查**：诊断和解决常见问题

随着云原生技术的发展，OpenTelemetry 将继续演进，建议持续关注官方文档和社区最佳实践。
