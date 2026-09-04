---
title: OpenTelemetry Observability
description: Implement unified observability with OpenTelemetry
track: devops
section: observability
difficulty: intermediate
tags:
  - OpenTelemetry
  - observability
  - tracing
  - monitoring
status: imported
origin: old/src/content/docs/devops/opentelemetry.en.md
divergence: 0.138
issues: []
legacy:
  category: DevOps
  subcategory: Observability
  order: 27
  lastUpdated: 2026-01-07
---

## Introduction

OpenTelemetry (OTel) is a vendor-neutral, open-source observability framework for generating, collecting, and exporting telemetry data including traces, metrics, and logs. As a Cloud Native Computing Foundation (CNCF) project formed from the merger of OpenTracing and OpenCensus, OpenTelemetry has become the industry standard for instrumenting cloud-native applications.

### Why OpenTelemetry?

Traditional observability approaches often require multiple vendor-specific agents and SDKs, leading to:

- **Vendor Lock-in**: Difficulty switching between observability backends
- **Inconsistent Data**: Different telemetry formats across tools
- **Complex Integration**: Managing multiple instrumentation libraries
- **Maintenance Overhead**: Keeping various agents updated and compatible

OpenTelemetry solves these challenges by providing a single, standardized approach to telemetry collection.

### Core Benefits

OpenTelemetry delivers several key advantages:

- **Vendor Neutrality**: Export data to any compatible backend without code changes
- **Unified API**: Single set of APIs for traces, metrics, and logs
- **Auto-Instrumentation**: Out-of-the-box instrumentation for popular frameworks
- **Language Support**: SDKs available for all major programming languages
- **Extensibility**: Custom instrumentation and processing pipelines
- **Community Driven**: Backed by major cloud and observability vendors

## Core Concepts

Understanding OpenTelemetry requires familiarity with its three main telemetry signals and supporting infrastructure.

### The Three Signals

OpenTelemetry unifies the three pillars of observability:

```
+-------------------+-------------------+-------------------+
|      Traces       |      Metrics      |       Logs        |
+-------------------+-------------------+-------------------+
| Request flow      | Numerical         | Discrete events   |
| across services   | measurements      | with context      |
| Latency analysis  | over time         | Debugging info    |
| Dependency maps   | Aggregations      | Error details     |
+-------------------+-------------------+-------------------+
                           |
                           v
              +------------------------+
              |    OpenTelemetry API   |
              +------------------------+
                           |
                           v
              +------------------------+
              |   OpenTelemetry SDK    |
              +------------------------+
                           |
                           v
              +------------------------+
              |      Exporters         |
              +------------------------+
                           |
        +------------------+------------------+
        v                  v                  v
   +--------+        +----------+       +---------+
   | Jaeger |        | Prometheus|       | Grafana |
   +--------+        +----------+       |  Loki   |
                                        +---------+
```

### Traces

Traces track the path of a request as it moves through a distributed system. A trace consists of one or more spans.

**Key Components:**

- **Trace**: A collection of spans representing a single transaction
- **Span**: A unit of work within a trace with timing and metadata
- **Span Context**: Identifiers and state propagated across service boundaries
- **Attributes**: Key-value pairs providing additional context
- **Events**: Time-stamped annotations within a span
- **Links**: Associations between spans in different traces

**Span Structure Example:**

```json
{
  "traceId": "5b8aa5a2d2c872e8321cf37308d69df2",
  "spanId": "051581bf3cb55c13",
  "parentSpanId": "ab6c23e13f2a5b7d",
  "name": "HTTP GET /api/users",
  "kind": "SERVER",
  "startTimeUnixNano": 1704067200000000000,
  "endTimeUnixNano": 1704067200150000000,
  "attributes": [
    { "key": "http.method", "value": { "stringValue": "GET" } },
    { "key": "http.status_code", "value": { "intValue": 200 } },
    { "key": "http.url", "value": { "stringValue": "/api/users/123" } }
  ],
  "status": { "code": "OK" }
}
```

### Metrics

Metrics are numerical measurements collected over time, ideal for tracking system health and performance trends.

**Metric Instruments:**

| Instrument | Sync/Async | Description | Example |
|------------|------------|-------------|---------|
| Counter | Sync | Monotonically increasing value | Request count |
| UpDownCounter | Sync | Value that can increase or decrease | Active connections |
| Histogram | Sync | Statistical distribution of values | Request latency |
| Gauge | Async | Point-in-time value | CPU usage |
| ObservableCounter | Async | Monotonic counter observed periodically | Total bytes sent |
| ObservableUpDownCounter | Async | Observable value that changes | Queue size |

**Metric Attributes and Aggregation:**

```
Counter: http.server.request.count
  Attributes:
    - http.method: GET
    - http.status_code: 200
    - service.name: api-gateway

  Aggregation: Sum over time

  Time Series:
  t1: 100 requests
  t2: 250 requests
  t3: 475 requests
```

### Logs

Logs capture discrete events with timestamps and contextual information. OpenTelemetry correlates logs with traces for enhanced debugging.

**Log Record Structure:**

```json
{
  "timeUnixNano": 1704067200000000000,
  "severityNumber": 9,
  "severityText": "INFO",
  "body": { "stringValue": "User authentication successful" },
  "attributes": [
    { "key": "user.id", "value": { "stringValue": "user-123" } },
    { "key": "auth.method", "value": { "stringValue": "oauth2" } }
  ],
  "traceId": "5b8aa5a2d2c872e8321cf37308d69df2",
  "spanId": "051581bf3cb55c13"
}
```

## Instrumentation

Instrumentation is the process of adding observability code to your applications. OpenTelemetry supports both automatic and manual instrumentation.

### Auto-Instrumentation

Auto-instrumentation automatically captures telemetry from popular libraries and frameworks without code changes.

**Java Auto-Instrumentation:**

```bash
# Download the Java agent
curl -L -o opentelemetry-javaagent.jar \
  https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar

# Run your application with the agent
java -javaagent:opentelemetry-javaagent.jar \
     -Dotel.service.name=my-service \
     -Dotel.exporter.otlp.endpoint=http://localhost:4317 \
     -jar myapp.jar
```

**Python Auto-Instrumentation:**

```bash
# Install OpenTelemetry packages
pip install opentelemetry-distro opentelemetry-exporter-otlp

# Install auto-instrumentation for detected libraries
opentelemetry-bootstrap -a install

# Run with auto-instrumentation
opentelemetry-instrument \
    --service_name my-python-service \
    --exporter_otlp_endpoint http://localhost:4317 \
    python myapp.py
```

**Node.js Auto-Instrumentation:**

```javascript
// tracing.js - Load before your application
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-grpc');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');

const sdk = new NodeSDK({
  serviceName: 'my-node-service',
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4317',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://localhost:4317',
    }),
    exportIntervalMillis: 60000,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('SDK shut down successfully'))
    .catch((error) => console.log('Error shutting down SDK', error))
    .finally(() => process.exit(0));
});
```

### Manual Instrumentation

Manual instrumentation provides fine-grained control over telemetry collection.

**Creating Custom Spans (Python):**

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource

# Configure the tracer provider
resource = Resource.create({"service.name": "order-service"})
provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="localhost:4317"))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

# Get a tracer
tracer = trace.get_tracer(__name__)

# Create spans
def process_order(order_id: str):
    with tracer.start_as_current_span("process_order") as span:
        span.set_attribute("order.id", order_id)

        # Nested span for validation
        with tracer.start_as_current_span("validate_order") as validation_span:
            validation_span.set_attribute("validation.type", "schema")
            validate_order_data(order_id)

        # Nested span for payment
        with tracer.start_as_current_span("process_payment") as payment_span:
            payment_span.set_attribute("payment.method", "credit_card")
            result = charge_customer(order_id)
            payment_span.set_attribute("payment.status", result.status)

            if result.failed:
                span.set_status(trace.Status(trace.StatusCode.ERROR, "Payment failed"))
                span.record_exception(result.error)
```

**Recording Metrics (Go):**

```go
package main

import (
    "context"
    "log"
    "time"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
    "go.opentelemetry.io/otel/metric"
    sdkmetric "go.opentelemetry.io/otel/sdk/metric"
    "go.opentelemetry.io/otel/sdk/resource"
    semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
)

func initMeterProvider() (*sdkmetric.MeterProvider, error) {
    ctx := context.Background()

    exporter, err := otlpmetricgrpc.New(ctx,
        otlpmetricgrpc.WithEndpoint("localhost:4317"),
        otlpmetricgrpc.WithInsecure(),
    )
    if err != nil {
        return nil, err
    }

    res, err := resource.Merge(
        resource.Default(),
        resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceName("my-go-service"),
        ),
    )
    if err != nil {
        return nil, err
    }

    mp := sdkmetric.NewMeterProvider(
        sdkmetric.WithResource(res),
        sdkmetric.WithReader(sdkmetric.NewPeriodicReader(exporter,
            sdkmetric.WithInterval(30*time.Second),
        )),
    )
    otel.SetMeterProvider(mp)
    return mp, nil
}

func main() {
    mp, err := initMeterProvider()
    if err != nil {
        log.Fatal(err)
    }
    defer mp.Shutdown(context.Background())

    meter := otel.Meter("example.com/metrics")

    // Create a counter
    requestCounter, _ := meter.Int64Counter(
        "http.server.request.count",
        metric.WithDescription("Total number of HTTP requests"),
        metric.WithUnit("{request}"),
    )

    // Create a histogram
    latencyHistogram, _ := meter.Float64Histogram(
        "http.server.request.duration",
        metric.WithDescription("HTTP request latency"),
        metric.WithUnit("ms"),
    )

    // Record metrics
    ctx := context.Background()
    requestCounter.Add(ctx, 1,
        metric.WithAttributes(
            semconv.HTTPMethod("GET"),
            semconv.HTTPStatusCode(200),
        ),
    )
    latencyHistogram.Record(ctx, 45.2,
        metric.WithAttributes(
            semconv.HTTPMethod("GET"),
            semconv.HTTPRoute("/api/users"),
        ),
    )
}
```

**Emitting Logs (Java):**

```java
import io.opentelemetry.api.logs.Logger;
import io.opentelemetry.api.logs.LoggerProvider;
import io.opentelemetry.api.logs.Severity;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.sdk.logs.SdkLoggerProvider;
import io.opentelemetry.sdk.logs.export.BatchLogRecordProcessor;
import io.opentelemetry.exporter.otlp.logs.OtlpGrpcLogRecordExporter;

public class LoggingExample {
    private static Logger logger;

    public static void initLogging() {
        OtlpGrpcLogRecordExporter logExporter = OtlpGrpcLogRecordExporter.builder()
            .setEndpoint("http://localhost:4317")
            .build();

        SdkLoggerProvider loggerProvider = SdkLoggerProvider.builder()
            .addLogRecordProcessor(BatchLogRecordProcessor.builder(logExporter).build())
            .build();

        logger = loggerProvider.get("com.example.myapp");
    }

    public static void logUserAction(String userId, String action) {
        logger.logRecordBuilder()
            .setSeverity(Severity.INFO)
            .setBody("User performed action")
            .setAllAttributes(Attributes.builder()
                .put("user.id", userId)
                .put("action.type", action)
                .put("timestamp", System.currentTimeMillis())
                .build())
            .emit();
    }
}
```

## OpenTelemetry Collector

The OpenTelemetry Collector is a vendor-agnostic proxy that receives, processes, and exports telemetry data. It serves as a central hub for telemetry pipelines.

### Architecture

```
+------------------+     +------------------------------------------+     +------------------+
|   Applications   |     |         OpenTelemetry Collector          |     |     Backends     |
|                  |     |                                          |     |                  |
| +-------------+  |     |  +-----------+  +-----------+  +------+  |     | +-------------+  |
| | App with    |--+---->|  | Receivers |->|Processors |->|Export|--+---->| | Jaeger      |  |
| | OTel SDK    |  |     |  +-----------+  +-----------+  +------+  |     | +-------------+  |
| +-------------+  |     |                                          |     |                  |
|                  |     |  Supported Receivers:                    |     | +-------------+  |
| +-------------+  |     |  - OTLP (gRPC/HTTP)                     |     | | Prometheus  |  |
| | Legacy App  |--+---->|  - Jaeger                               |     | +-------------+  |
| | (Zipkin)    |  |     |  - Zipkin                               |     |                  |
| +-------------+  |     |  - Prometheus                           |     | +-------------+  |
|                  |     |  - Kafka                                |     | | Grafana     |  |
| +-------------+  |     |  - And more...                          |     | | Cloud       |  |
| | Infrastructure|---->|                                          |     | +-------------+  |
| | (hostmetrics)|  |     |  Processors:                           |     |                  |
| +-------------+  |     |  - Batch                                |     | +-------------+  |
+------------------+     |  - Memory Limiter                       |     | | Datadog     |  |
                         |  - Attributes                           |     | +-------------+  |
                         |  - Filter                               |     |                  |
                         |  - Tail Sampling                        |     | +-------------+  |
                         |  - Transform                            |     | | New Relic   |  |
                         +------------------------------------------+     | +-------------+  |
                                                                          +------------------+
```

### Collector Configuration

**Basic Configuration (otel-collector-config.yaml):**

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

  # Receive Prometheus metrics
  prometheus:
    config:
      scrape_configs:
        - job_name: 'otel-collector'
          scrape_interval: 10s
          static_configs:
            - targets: ['localhost:8888']

  # Host metrics
  hostmetrics:
    collection_interval: 30s
    scrapers:
      cpu:
      memory:
      disk:
      network:

processors:
  # Batch telemetry for efficiency
  batch:
    timeout: 10s
    send_batch_size: 1024
    send_batch_max_size: 2048

  # Prevent out-of-memory issues
  memory_limiter:
    check_interval: 1s
    limit_mib: 1000
    spike_limit_mib: 200

  # Add resource attributes
  resource:
    attributes:
      - key: environment
        value: production
        action: upsert
      - key: service.namespace
        value: ecommerce
        action: insert

  # Filter unwanted telemetry
  filter:
    error_mode: ignore
    traces:
      span:
        - 'attributes["http.target"] == "/health"'
        - 'attributes["http.target"] == "/ready"'

exporters:
  # Debug output
  debug:
    verbosity: detailed

  # OTLP export to Jaeger
  otlp/jaeger:
    endpoint: jaeger:4317
    tls:
      insecure: true

  # Prometheus remote write
  prometheusremotewrite:
    endpoint: http://prometheus:9090/api/v1/write
    tls:
      insecure: true

  # Loki for logs
  loki:
    endpoint: http://loki:3100/loki/api/v1/push
    labels:
      attributes:
        service.name: "service"
        severity: "level"

extensions:
  health_check:
    endpoint: 0.0.0.0:13133

  pprof:
    endpoint: 0.0.0.0:1777

  zpages:
    endpoint: 0.0.0.0:55679

service:
  extensions: [health_check, pprof, zpages]

  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource, filter]
      exporters: [otlp/jaeger, debug]

    metrics:
      receivers: [otlp, prometheus, hostmetrics]
      processors: [memory_limiter, batch, resource]
      exporters: [prometheusremotewrite]

    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [loki, debug]

  telemetry:
    logs:
      level: info
    metrics:
      address: 0.0.0.0:8888
```

### Deployment Patterns

**Agent Mode (Sidecar/DaemonSet):**

```yaml
# Kubernetes DaemonSet deployment
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: otel-collector-agent
  namespace: observability
spec:
  selector:
    matchLabels:
      app: otel-collector-agent
  template:
    metadata:
      labels:
        app: otel-collector-agent
    spec:
      containers:
        - name: otel-collector
          image: otel/opentelemetry-collector-contrib:latest
          args:
            - --config=/conf/otel-collector-config.yaml
          ports:
            - containerPort: 4317  # OTLP gRPC
            - containerPort: 4318  # OTLP HTTP
          resources:
            limits:
              cpu: 200m
              memory: 256Mi
            requests:
              cpu: 100m
              memory: 128Mi
          volumeMounts:
            - name: config
              mountPath: /conf
      volumes:
        - name: config
          configMap:
            name: otel-collector-agent-config
```

**Gateway Mode (Centralized):**

```yaml
# Kubernetes Deployment for gateway collector
apiVersion: apps/v1
kind: Deployment
metadata:
  name: otel-collector-gateway
  namespace: observability
spec:
  replicas: 3
  selector:
    matchLabels:
      app: otel-collector-gateway
  template:
    metadata:
      labels:
        app: otel-collector-gateway
    spec:
      containers:
        - name: otel-collector
          image: otel/opentelemetry-collector-contrib:latest
          args:
            - --config=/conf/otel-collector-config.yaml
          ports:
            - containerPort: 4317
            - containerPort: 4318
          resources:
            limits:
              cpu: "1"
              memory: 2Gi
            requests:
              cpu: 500m
              memory: 1Gi
          volumeMounts:
            - name: config
              mountPath: /conf
      volumes:
        - name: config
          configMap:
            name: otel-collector-gateway-config
---
apiVersion: v1
kind: Service
metadata:
  name: otel-collector-gateway
  namespace: observability
spec:
  type: ClusterIP
  selector:
    app: otel-collector-gateway
  ports:
    - name: otlp-grpc
      port: 4317
      targetPort: 4317
    - name: otlp-http
      port: 4318
      targetPort: 4318
```

## Exporters and Backend Integration

OpenTelemetry exporters send telemetry data to various backend systems for storage and analysis.

### OTLP Exporter

The OpenTelemetry Protocol (OTLP) is the native export format:

```yaml
# Collector configuration for OTLP export
exporters:
  otlp:
    endpoint: otel-gateway.example.com:4317
    tls:
      cert_file: /certs/client.crt
      key_file: /certs/client.key
      ca_file: /certs/ca.crt
    headers:
      Authorization: "Bearer ${OTEL_AUTH_TOKEN}"
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
      max_elapsed_time: 300s
```

### Jaeger Integration

Export traces to Jaeger for distributed tracing visualization:

```yaml
exporters:
  jaeger:
    endpoint: jaeger-collector:14250
    tls:
      insecure: true

  # Or use OTLP with Jaeger
  otlp/jaeger:
    endpoint: jaeger-collector:4317
    tls:
      insecure: true
```

### Prometheus Integration

Export metrics to Prometheus:

```yaml
exporters:
  # Prometheus remote write
  prometheusremotewrite:
    endpoint: http://prometheus:9090/api/v1/write
    resource_to_telemetry_conversion:
      enabled: true

  # Or expose Prometheus endpoint for scraping
  prometheus:
    endpoint: 0.0.0.0:8889
    namespace: otel
    const_labels:
      environment: production
```

### Grafana Stack Integration

Complete Grafana LGTM stack configuration:

```yaml
exporters:
  # Tempo for traces
  otlp/tempo:
    endpoint: tempo:4317
    tls:
      insecure: true

  # Mimir for metrics
  prometheusremotewrite/mimir:
    endpoint: http://mimir:9009/api/v1/push
    headers:
      X-Scope-OrgID: tenant-1

  # Loki for logs
  loki:
    endpoint: http://loki:3100/loki/api/v1/push
    labels:
      attributes:
        service.name: "service_name"
        severity: "level"
      resource:
        deployment.environment: "env"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlp/tempo]

    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheusremotewrite/mimir]

    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [loki]
```

### Cloud Provider Integration

**AWS X-Ray:**

```yaml
exporters:
  awsxray:
    region: us-west-2
    role_arn: arn:aws:iam::123456789012:role/xray-write-role
```

**Google Cloud Operations:**

```yaml
exporters:
  googlecloud:
    project: my-gcp-project
    trace:
      endpoint: cloudtrace.googleapis.com
    metric:
      endpoint: monitoring.googleapis.com
    log:
      endpoint: logging.googleapis.com
```

**Azure Monitor:**

```yaml
exporters:
  azuremonitor:
    connection_string: ${APPLICATIONINSIGHTS_CONNECTION_STRING}
```

## Sampling Strategies

Sampling reduces telemetry volume while maintaining observability. OpenTelemetry supports multiple sampling strategies.

### Head-Based Sampling

Sampling decisions made at trace start:

```python
from opentelemetry.sdk.trace.sampling import (
    TraceIdRatioBased,
    ParentBased,
    ALWAYS_ON,
    ALWAYS_OFF
)
from opentelemetry.sdk.trace import TracerProvider

# Sample 10% of traces
sampler = TraceIdRatioBased(0.1)

# Respect parent sampling decision, sample 10% of root spans
parent_based_sampler = ParentBased(
    root=TraceIdRatioBased(0.1),
    remote_parent_sampled=ALWAYS_ON,
    remote_parent_not_sampled=ALWAYS_OFF,
    local_parent_sampled=ALWAYS_ON,
    local_parent_not_sampled=ALWAYS_OFF,
)

provider = TracerProvider(sampler=parent_based_sampler)
```

### Tail-Based Sampling

Sampling decisions made after trace completion in the Collector:

```yaml
processors:
  tail_sampling:
    decision_wait: 10s
    num_traces: 100000
    expected_new_traces_per_sec: 1000
    policies:
      # Always sample errors
      - name: errors
        type: status_code
        status_code:
          status_codes: [ERROR]

      # Always sample slow requests
      - name: slow-traces
        type: latency
        latency:
          threshold_ms: 5000

      # Sample 10% of everything else
      - name: probabilistic
        type: probabilistic
        probabilistic:
          sampling_percentage: 10

      # Always sample specific operations
      - name: important-operations
        type: string_attribute
        string_attribute:
          key: http.target
          values: ["/api/checkout", "/api/payment"]
          enabled_regex_matching: false

      # Composite policy combining multiple rules
      - name: composite
        type: composite
        composite:
          max_total_spans_per_second: 1000
          policy_order: [errors, slow-traces, important-operations, probabilistic]
          composite_sub_policy:
            - name: errors
              type: status_code
              status_code:
                status_codes: [ERROR]
            - name: slow-traces
              type: latency
              latency:
                threshold_ms: 2000
```

## Best Practices

### Resource Attributes

Always set meaningful resource attributes:

```python
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes

resource = Resource.create({
    ResourceAttributes.SERVICE_NAME: "order-service",
    ResourceAttributes.SERVICE_VERSION: "1.2.3",
    ResourceAttributes.SERVICE_NAMESPACE: "ecommerce",
    ResourceAttributes.DEPLOYMENT_ENVIRONMENT: "production",
    ResourceAttributes.HOST_NAME: "pod-xyz-123",
    ResourceAttributes.CLOUD_PROVIDER: "aws",
    ResourceAttributes.CLOUD_REGION: "us-west-2",
    "team.name": "platform",
    "cost.center": "eng-123",
})
```

### Context Propagation

Ensure context propagates across service boundaries:

```python
from opentelemetry.propagate import set_global_textmap
from opentelemetry.propagators.composite import CompositePropagator
from opentelemetry.propagators.b3 import B3MultiFormat
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
from opentelemetry.baggage.propagation import W3CBaggagePropagator

# Support multiple propagation formats
propagator = CompositePropagator([
    TraceContextTextMapPropagator(),  # W3C Trace Context
    W3CBaggagePropagator(),           # W3C Baggage
    B3MultiFormat(),                   # Zipkin B3
])
set_global_textmap(propagator)
```

### Error Handling

Properly record errors and exceptions:

```python
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

tracer = trace.get_tracer(__name__)

def process_request(request):
    with tracer.start_as_current_span("process_request") as span:
        try:
            result = do_work(request)
            span.set_status(Status(StatusCode.OK))
            return result
        except ValidationError as e:
            span.set_status(Status(StatusCode.ERROR, "Validation failed"))
            span.record_exception(e)
            span.set_attribute("error.type", "validation")
            raise
        except Exception as e:
            span.set_status(Status(StatusCode.ERROR, str(e)))
            span.record_exception(e)
            span.set_attribute("error.type", "internal")
            raise
```

### Metric Cardinality

Avoid high-cardinality labels that can explode metric storage:

```python
# BAD: High cardinality
meter.create_counter("requests").add(1, {
    "user_id": user.id,        # Millions of unique values
    "request_id": request.id,   # Unique per request
})

# GOOD: Bounded cardinality
meter.create_counter("requests").add(1, {
    "user_tier": user.tier,     # Few distinct values
    "http_method": request.method,
    "http_status_code": response.status,
    "endpoint": request.endpoint,  # Bounded set of endpoints
})
```

### Performance Considerations

Configure batching and limits appropriately:

```yaml
processors:
  batch:
    timeout: 10s
    send_batch_size: 8192
    send_batch_max_size: 16384

  memory_limiter:
    check_interval: 1s
    limit_mib: 2000
    spike_limit_mib: 400
    limit_percentage: 80
    spike_limit_percentage: 25

service:
  telemetry:
    metrics:
      level: detailed
      address: 0.0.0.0:8888
```

## Complete Example: Microservices Observability

The following example demonstrates OpenTelemetry integration across microservices.

### Docker Compose Setup

```yaml
version: '3.8'

services:
  # OpenTelemetry Collector
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: --config=/etc/otel-collector-config.yaml
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "8888:8888"   # Metrics
    depends_on:
      - jaeger
      - prometheus

  # Jaeger for tracing
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # UI
      - "14250:14250"  # gRPC

  # Prometheus for metrics
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  # Grafana for visualization
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - ./grafana/provisioning:/etc/grafana/provisioning

  # Example application
  api-gateway:
    build: ./api-gateway
    environment:
      - OTEL_SERVICE_NAME=api-gateway
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
      - OTEL_TRACES_SAMPLER=parentbased_traceidratio
      - OTEL_TRACES_SAMPLER_ARG=0.1
    ports:
      - "8080:8080"
    depends_on:
      - otel-collector
      - order-service

  order-service:
    build: ./order-service
    environment:
      - OTEL_SERVICE_NAME=order-service
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
    depends_on:
      - otel-collector
```

### Application Code (Python FastAPI)

```python
# api_gateway/main.py
from fastapi import FastAPI, Request
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.sdk.resources import Resource
import httpx
import os

# Configure OpenTelemetry
resource = Resource.create({
    "service.name": os.getenv("OTEL_SERVICE_NAME", "api-gateway"),
    "service.version": "1.0.0",
    "deployment.environment": os.getenv("ENVIRONMENT", "development"),
})

# Tracing
trace_provider = TracerProvider(resource=resource)
trace_provider.add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter())
)
trace.set_tracer_provider(trace_provider)

# Metrics
metric_reader = PeriodicExportingMetricReader(
    OTLPMetricExporter(),
    export_interval_millis=60000,
)
meter_provider = MeterProvider(resource=resource, metric_readers=[metric_reader])
metrics.set_meter_provider(meter_provider)

# Create app
app = FastAPI()

# Auto-instrument FastAPI and HTTP client
FastAPIInstrumentor.instrument_app(app)
HTTPXClientInstrumentor().instrument()

# Custom metrics
meter = metrics.get_meter(__name__)
request_counter = meter.create_counter(
    "api.requests.total",
    description="Total API requests",
)
request_latency = meter.create_histogram(
    "api.request.latency",
    description="Request latency in milliseconds",
    unit="ms",
)

tracer = trace.get_tracer(__name__)

@app.get("/api/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    with tracer.start_as_current_span("get_order_handler") as span:
        span.set_attribute("order.id", order_id)

        # Record metrics
        request_counter.add(1, {"endpoint": "/api/orders", "method": "GET"})

        # Call downstream service
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"http://order-service:8081/orders/{order_id}"
            )

        return response.json()

@app.post("/api/orders")
async def create_order(request: Request):
    with tracer.start_as_current_span("create_order_handler") as span:
        body = await request.json()
        span.set_attribute("order.items_count", len(body.get("items", [])))

        request_counter.add(1, {"endpoint": "/api/orders", "method": "POST"})

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://order-service:8081/orders",
                json=body
            )

        return response.json()
```

## Troubleshooting

### Common Issues

**No Data Appearing in Backend:**

1. Verify collector connectivity:
```bash
# Check collector health
curl http://localhost:13133/health

# Check collector metrics
curl http://localhost:8888/metrics
```

2. Enable debug logging:
```yaml
service:
  telemetry:
    logs:
      level: debug
```

**High Memory Usage:**

Configure memory limits:
```yaml
processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 1500
    spike_limit_mib: 300
```

**Missing Trace Context:**

Verify propagator configuration:
```python
from opentelemetry import propagate
print(propagate.get_global_textmap())
```

### Debugging Tools

**zpages Extension:**

```yaml
extensions:
  zpages:
    endpoint: 0.0.0.0:55679

service:
  extensions: [zpages]
```

Access debugging pages:
- `http://localhost:55679/debug/tracez` - Trace samples
- `http://localhost:55679/debug/pipelinez` - Pipeline status

## Conclusion

OpenTelemetry provides a comprehensive, vendor-neutral solution for implementing observability in modern applications. By unifying traces, metrics, and logs under a single framework, it simplifies instrumentation while providing the flexibility to export data to any compatible backend.

Key takeaways:

1. **Start with auto-instrumentation** to quickly gain visibility, then add manual instrumentation for custom business logic
2. **Deploy the Collector** as a central telemetry hub for processing, filtering, and routing
3. **Implement sampling strategies** to balance observability needs with cost and performance
4. **Follow semantic conventions** for consistent, meaningful telemetry across services
5. **Use proper resource attributes** to enable effective filtering and aggregation

As you adopt OpenTelemetry, begin with traces for immediate value in understanding request flows, then expand to metrics for trend analysis and alerting, and finally integrate logs for complete debugging capabilities.
