---
title: Distributed Tracing
description: Master request tracing and monitoring in distributed systems
track: architecture
section: observability
difficulty: intermediate
tags:
  - distributed tracing
  - Jaeger
  - Zipkin
  - OpenTelemetry
status: imported
origin: old/src/content/docs/architecture/distributed-tracing.en.md
divergence: 0.296
issues: []
legacy:
  category: Architecture
  subcategory: Observability
  order: 17
  lastUpdated: 2026-01-07
---

## Why Distributed Tracing?

In modern distributed systems, a single user request often traverses multiple services, databases, message queues, and external APIs before returning a response. When something goes wrong or performance degrades, identifying the root cause becomes extraordinarily challenging without proper visibility into the request's journey.

### The Challenges of Distributed Systems

Consider a typical e-commerce checkout flow:

```
User Request
    │
    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   API       │───▶│   Order     │───▶│  Inventory  │
│   Gateway   │    │   Service   │    │   Service   │
└─────────────┘    └─────────────┘    └─────────────┘
                         │                   │
                         ▼                   ▼
                   ┌─────────────┐    ┌─────────────┐
                   │   Payment   │    │  Shipping   │
                   │   Service   │    │   Service   │
                   └─────────────┘    └─────────────┘
                         │
                         ▼
                   ┌─────────────┐
                   │  Notification│
                   │   Service   │
                   └─────────────┘
```

Traditional logging approaches fail in this environment because:

1. **Correlation Difficulty**: Logs from different services are scattered across multiple systems with no inherent connection
2. **Latency Mysteries**: Determining which service caused a slowdown requires manual correlation of timestamps
3. **Failure Isolation**: Error propagation through services makes finding the original failure point challenging
4. **Dependency Mapping**: Understanding service relationships and call patterns is nearly impossible
5. **Performance Bottlenecks**: Identifying which component in a chain is the slowest requires extensive investigation

### What Distributed Tracing Provides

Distributed tracing solves these problems by providing:

- **End-to-End Visibility**: Follow a single request across all services
- **Latency Analysis**: See exactly how long each component takes
- **Error Tracking**: Pinpoint the exact service and operation where failures occur
- **Dependency Discovery**: Automatically map service relationships
- **Performance Optimization**: Identify bottlenecks with precision

---

## Core Concepts

### Traces

A **trace** represents the complete journey of a request through a distributed system. It captures the entire workflow from the initial request to the final response, including all services touched along the way.

```
Trace ID: abc123
├── Service A (50ms)
│   ├── Service B (20ms)
│   │   └── Database Query (15ms)
│   └── Service C (25ms)
│       ├── Cache Lookup (2ms)
│       └── External API (20ms)
└── Total Duration: 50ms
```

Each trace has a unique **Trace ID** that remains constant across all services, enabling correlation of all related operations.

### Spans

A **span** represents a single unit of work within a trace. Each span captures:

- **Operation Name**: What work is being performed
- **Start Time**: When the operation began
- **Duration**: How long the operation took
- **Status**: Success, error, or other status codes
- **Tags/Attributes**: Key-value pairs providing additional context
- **Logs/Events**: Timestamped records within the span
- **Span Context**: The trace ID, span ID, and propagation data

```typescript
// Conceptual span structure
interface Span {
  traceId: string;           // Unique identifier for the entire trace
  spanId: string;            // Unique identifier for this span
  parentSpanId?: string;     // Parent span (if not root)
  operationName: string;     // Name of the operation
  startTime: number;         // Start timestamp
  duration: number;          // Duration in microseconds
  status: SpanStatus;        // OK, ERROR, UNSET
  attributes: Map<string, AttributeValue>;  // Key-value metadata
  events: SpanEvent[];       // Timestamped events
  links: SpanLink[];         // Links to other spans
}
```

### Span Relationships

Spans form a tree structure within a trace:

```
                          ┌─────────────────────────────────────────────────────────┐
Trace                     │                    Trace ID: abc123                      │
                          └─────────────────────────────────────────────────────────┘

                          ┌─────────────────────────────────────────────────────────┐
Root Span                 │  Span A: HTTP GET /checkout (Parent: none)              │
                          │  Duration: 250ms                                         │
                          └─────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
          ┌─────────────────────┐         ┌─────────────────────┐
Child     │  Span B: OrderSvc   │         │  Span C: PaymentSvc │
Spans     │  Duration: 80ms     │         │  Duration: 150ms    │
          └─────────────────────┘         └─────────────────────┘
                    │                               │
                    ▼                               ▼
          ┌─────────────────────┐         ┌─────────────────────┐
Grandchild│  Span D: DB Query   │         │  Span E: Stripe API │
Spans     │  Duration: 45ms     │         │  Duration: 120ms    │
          └─────────────────────┘         └─────────────────────┘
```

### Context Propagation

**Context propagation** is the mechanism that carries trace information across service boundaries. Without it, each service would create independent traces that cannot be correlated.

#### Propagation Formats

Several standard formats exist for propagating trace context:

**W3C Trace Context (Recommended)**
```http
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
tracestate: vendor1=value1,vendor2=value2
```

The `traceparent` header contains:
- Version (00)
- Trace ID (32 hex characters)
- Parent Span ID (16 hex characters)
- Trace flags (sampling decision)

**B3 Propagation (Zipkin)**
```http
X-B3-TraceId: 80f198ee56343ba864fe8b2a57d3eff7
X-B3-SpanId: e457b5a2e4d86bd1
X-B3-ParentSpanId: 05e3ac9a4f6e3b90
X-B3-Sampled: 1
```

**Jaeger Propagation**
```http
uber-trace-id: {trace-id}:{span-id}:{parent-span-id}:{flags}
```

#### Propagation in Practice

```typescript
// Extracting context from incoming request
const parentContext = propagator.extract(
  context.active(),
  request.headers,
  headerGetter
);

// Creating a new span as a child of the extracted context
const span = tracer.startSpan(
  'process-order',
  { kind: SpanKind.SERVER },
  parentContext
);

// Injecting context into outgoing request
propagator.inject(
  trace.setSpan(context.active(), span),
  outgoingRequest.headers,
  headerSetter
);
```

### Sampling

In high-traffic systems, tracing every request is impractical. **Sampling** determines which traces to record:

```typescript
// Sampling strategies
const samplingStrategies = {
  // Always sample (development/debugging)
  alwaysOn: () => true,

  // Never sample (disabled)
  alwaysOff: () => false,

  // Probabilistic (sample X% of requests)
  probabilistic: (rate: number) => Math.random() < rate,

  // Rate limiting (X traces per second)
  rateLimiting: (tracesPerSecond: number) => {
    // Implementation with token bucket
  },

  // Adaptive (adjust based on traffic)
  adaptive: (currentLoad: number, targetRate: number) => {
    // Dynamic rate adjustment
  }
};
```

**Head-based Sampling**: Decision made at trace start (most common)
**Tail-based Sampling**: Decision made after trace completes (can capture errors)

---

## OpenTelemetry

OpenTelemetry (OTel) is the industry-standard framework for observability, providing a unified API, SDK, and tools for distributed tracing, metrics, and logging.

### Why OpenTelemetry?

Before OpenTelemetry, each tracing system had its own instrumentation:

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Jaeger    │  │   Zipkin    │  │  Datadog    │
│   Client    │  │   Client    │  │   Client    │
└─────────────┘  └─────────────┘  └─────────────┘
       │                │                │
       └────────────────┴────────────────┘
                        │
              Vendor Lock-in Problem
```

OpenTelemetry provides a vendor-neutral abstraction:

```
                    ┌─────────────────────┐
                    │   OpenTelemetry     │
                    │        API          │
                    └─────────────────────┘
                              │
                    ┌─────────────────────┐
                    │   OpenTelemetry     │
                    │        SDK          │
                    └─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Jaeger    │       │   Zipkin    │       │  Datadog    │
│  Exporter   │       │  Exporter   │       │  Exporter   │
└─────────────┘       └─────────────┘       └─────────────┘
```

### OpenTelemetry Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Application                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    OpenTelemetry API                        │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐    │  │
│  │  │  Tracer │  │  Meter  │  │  Logger │  │ Propagator  │    │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────┘    │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    OpenTelemetry SDK                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │  │
│  │  │  Span       │  │  Sampler    │  │  Span Processor     │ │  │
│  │  │  Processor  │  │             │  │  (Batch/Simple)     │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                       Exporters                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │  OTLP    │  │  Jaeger  │  │  Zipkin  │  │ Console  │   │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   OTel Collector    │
                    │   (Optional)        │
                    └─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Jaeger    │       │   Zipkin    │       │   Tempo     │
└─────────────┘       └─────────────┘       └─────────────┘
```

### Setting Up OpenTelemetry (Node.js)

**Installation**

```bash
npm install @opentelemetry/api \
            @opentelemetry/sdk-node \
            @opentelemetry/auto-instrumentations-node \
            @opentelemetry/exporter-trace-otlp-http
```

**Basic Configuration**

```typescript
// tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

// Configure the trace exporter
const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces',
});

// Create the SDK configuration
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'order-service',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: 'production',
  }),
  spanProcessor: new BatchSpanProcessor(traceExporter),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Customize auto-instrumentation
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/health', '/metrics'],
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
    }),
  ],
});

// Start the SDK
sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error shutting down tracing', error))
    .finally(() => process.exit(0));
});

export { sdk };
```

**Application Entry Point**

```typescript
// index.ts
// IMPORTANT: Initialize tracing before importing other modules
import './tracing';

import express from 'express';
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';

const app = express();
const tracer = trace.getTracer('order-service');

app.post('/orders', async (req, res) => {
  // Create a custom span for business logic
  const span = tracer.startSpan('create-order', {
    kind: SpanKind.INTERNAL,
    attributes: {
      'order.customer_id': req.body.customerId,
      'order.items_count': req.body.items?.length || 0,
    },
  });

  try {
    const order = await processOrder(req.body);

    span.setAttributes({
      'order.id': order.id,
      'order.total': order.total,
    });

    span.setStatus({ code: SpanStatusCode.OK });
    res.json(order);
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    span.recordException(error);
    res.status(500).json({ error: error.message });
  } finally {
    span.end();
  }
});

app.listen(3000);
```

### Setting Up OpenTelemetry (Python)

```python
# tracing.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

def configure_tracing(service_name: str):
    # Create resource with service information
    resource = Resource.create({
        SERVICE_NAME: service_name,
        SERVICE_VERSION: "1.0.0",
    })

    # Create tracer provider
    provider = TracerProvider(resource=resource)

    # Configure OTLP exporter
    otlp_exporter = OTLPSpanExporter(
        endpoint="http://localhost:4317",
        insecure=True
    )

    # Add batch processor
    provider.add_span_processor(
        BatchSpanProcessor(otlp_exporter)
    )

    # Set as global tracer provider
    trace.set_tracer_provider(provider)

    # Auto-instrument libraries
    FlaskInstrumentor().instrument()
    RequestsInstrumentor().instrument()

    return trace.get_tracer(service_name)
```

```python
# app.py
from flask import Flask, request, jsonify
from opentelemetry import trace
from opentelemetry.trace import SpanKind, StatusCode
from tracing import configure_tracing

app = Flask(__name__)
tracer = configure_tracing("order-service")

@app.route('/orders', methods=['POST'])
def create_order():
    with tracer.start_as_current_span(
        "create-order",
        kind=SpanKind.INTERNAL
    ) as span:
        try:
            data = request.get_json()

            # Add attributes to span
            span.set_attribute("order.customer_id", data.get("customer_id"))
            span.set_attribute("order.items_count", len(data.get("items", [])))

            # Process order
            order = process_order(data)

            span.set_attribute("order.id", order["id"])
            span.set_status(StatusCode.OK)

            return jsonify(order)

        except Exception as e:
            span.set_status(StatusCode.ERROR, str(e))
            span.record_exception(e)
            return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=3000)
```

### Setting Up OpenTelemetry (Go)

```go
// tracing.go
package tracing

import (
    "context"
    "time"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/propagation"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
)

func InitTracer(ctx context.Context, serviceName string) (*sdktrace.TracerProvider, error) {
    // Create OTLP exporter
    exporter, err := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint("localhost:4317"),
        otlptracegrpc.WithInsecure(),
    )
    if err != nil {
        return nil, err
    }

    // Create resource
    res, err := resource.Merge(
        resource.Default(),
        resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceName(serviceName),
            semconv.ServiceVersion("1.0.0"),
        ),
    )
    if err != nil {
        return nil, err
    }

    // Create tracer provider
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter,
            sdktrace.WithBatchTimeout(5*time.Second),
        ),
        sdktrace.WithResource(res),
        sdktrace.WithSampler(sdktrace.AlwaysSample()),
    )

    // Set global tracer provider
    otel.SetTracerProvider(tp)

    // Set global propagator
    otel.SetTextMapPropagator(
        propagation.NewCompositeTextMapPropagator(
            propagation.TraceContext{},
            propagation.Baggage{},
        ),
    )

    return tp, nil
}
```

```go
// main.go
package main

import (
    "context"
    "log"
    "net/http"

    "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/codes"
    "go.opentelemetry.io/otel/trace"
)

var tracer trace.Tracer

func main() {
    ctx := context.Background()

    // Initialize tracing
    tp, err := tracing.InitTracer(ctx, "order-service")
    if err != nil {
        log.Fatal(err)
    }
    defer tp.Shutdown(ctx)

    tracer = otel.Tracer("order-service")

    // Wrap handlers with OpenTelemetry middleware
    handler := otelhttp.NewHandler(
        http.HandlerFunc(createOrderHandler),
        "POST /orders",
    )

    http.Handle("/orders", handler)
    log.Fatal(http.ListenAndServe(":3000", nil))
}

func createOrderHandler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    // Create custom span
    ctx, span := tracer.Start(ctx, "process-order",
        trace.WithSpanKind(trace.SpanKindInternal),
    )
    defer span.End()

    // Add attributes
    span.SetAttributes(
        attribute.String("order.customer_id", r.FormValue("customer_id")),
    )

    order, err := processOrder(ctx, r)
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    span.SetAttributes(attribute.String("order.id", order.ID))
    span.SetStatus(codes.Ok, "")

    // Return response
    json.NewEncoder(w).Encode(order)
}
```

---

## Jaeger Integration

Jaeger is an open-source distributed tracing system originally developed by Uber. It provides a complete solution for trace collection, storage, and visualization.

### Jaeger Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Applications                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Service A  │  │  Service B  │  │  Service C  │  │  Service D  │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
└─────────┼────────────────┼────────────────┼────────────────┼───────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                    │
                                    ▼
                          ┌─────────────────┐
                          │  Jaeger Agent   │ (Optional - sidecar/daemonset)
                          │  (UDP receiver) │
                          └────────┬────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │ Jaeger Collector│
                          │ (HTTP/gRPC)     │
                          └────────┬────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
           ┌─────────────────┐          ┌─────────────────┐
           │     Storage     │          │      Kafka      │
           │ (Cassandra/ES)  │          │   (Optional)    │
           └────────┬────────┘          └─────────────────┘
                    │
                    ▼
           ┌─────────────────┐
           │  Jaeger Query   │
           │  (UI + API)     │
           └─────────────────┘
```

### Deploying Jaeger with Docker

**All-in-One (Development)**

```bash
docker run -d --name jaeger \
  -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 14250:14250 \
  -p 14268:14268 \
  -p 14269:14269 \
  -p 9411:9411 \
  jaegertracing/all-in-one:latest
```

**Production with Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - "9200:9200"
    volumes:
      - esdata:/usr/share/elasticsearch/data

  jaeger-collector:
    image: jaegertracing/jaeger-collector:latest
    environment:
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://elasticsearch:9200
    ports:
      - "14268:14268"   # HTTP Thrift
      - "14250:14250"   # gRPC
      - "4317:4317"     # OTLP gRPC
      - "4318:4318"     # OTLP HTTP
    depends_on:
      - elasticsearch

  jaeger-query:
    image: jaegertracing/jaeger-query:latest
    environment:
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://elasticsearch:9200
    ports:
      - "16686:16686"   # UI
      - "16687:16687"   # Admin
    depends_on:
      - elasticsearch

  jaeger-agent:
    image: jaegertracing/jaeger-agent:latest
    command: ["--reporter.grpc.host-port=jaeger-collector:14250"]
    ports:
      - "6831:6831/udp"
      - "6832:6832/udp"
      - "5778:5778"
    depends_on:
      - jaeger-collector

volumes:
  esdata:
```

### Configuring OpenTelemetry for Jaeger

```typescript
// jaeger-tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const jaegerExporter = new JaegerExporter({
  endpoint: 'http://localhost:14268/api/traces',
});

// Or use OTLP exporter pointing to Jaeger's OTLP endpoint
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';

const otlpExporter = new OTLPTraceExporter({
  url: 'http://localhost:4317',
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'my-service',
  }),
  traceExporter: otlpExporter, // or jaegerExporter
});

sdk.start();
```

---

## Zipkin Integration

Zipkin is another popular open-source distributed tracing system, originally developed by Twitter based on Google's Dapper paper.

### Zipkin Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Applications                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Service A  │  │  Service B  │  │  Service C  │             │
│  │  (Reporter) │  │  (Reporter) │  │  (Reporter) │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼────────────────────┘
          │                │                │
          └────────────────┴────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │    Zipkin       │
                  │   Collector     │
                  │  (HTTP/Kafka)   │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │    Storage      │
                  │ (MySQL/Cassandra│
                  │  /Elasticsearch)│
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   Zipkin UI     │
                  │   (Query API)   │
                  └─────────────────┘
```

### Deploying Zipkin

```bash
# Simple deployment with in-memory storage
docker run -d -p 9411:9411 openzipkin/zipkin

# With MySQL storage
docker run -d -p 9411:9411 \
  -e STORAGE_TYPE=mysql \
  -e MYSQL_HOST=mysql \
  -e MYSQL_USER=zipkin \
  -e MYSQL_PASS=zipkin \
  openzipkin/zipkin

# With Elasticsearch storage
docker run -d -p 9411:9411 \
  -e STORAGE_TYPE=elasticsearch \
  -e ES_HOSTS=http://elasticsearch:9200 \
  openzipkin/zipkin
```

### Configuring OpenTelemetry for Zipkin

```typescript
// zipkin-tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const zipkinExporter = new ZipkinExporter({
  url: 'http://localhost:9411/api/v2/spans',
  serviceName: 'my-service',
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'my-service',
  }),
  traceExporter: zipkinExporter,
});

sdk.start();
```

---

## Instrumentation Strategies

### Automatic Instrumentation

Automatic instrumentation captures traces from common libraries without code changes:

```typescript
// Node.js auto-instrumentation
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const instrumentations = getNodeAutoInstrumentations({
  // HTTP client and server
  '@opentelemetry/instrumentation-http': {
    enabled: true,
    ignoreIncomingPaths: ['/health', '/ready'],
    ignoreOutgoingUrls: [/localhost:9411/], // Ignore tracing endpoint
  },

  // Express.js
  '@opentelemetry/instrumentation-express': {
    enabled: true,
  },

  // PostgreSQL
  '@opentelemetry/instrumentation-pg': {
    enabled: true,
    enhancedDatabaseReporting: true,
  },

  // Redis
  '@opentelemetry/instrumentation-redis': {
    enabled: true,
  },

  // MongoDB
  '@opentelemetry/instrumentation-mongodb': {
    enabled: true,
  },

  // gRPC
  '@opentelemetry/instrumentation-grpc': {
    enabled: true,
  },
});
```

### Manual Instrumentation

For custom business logic, manual instrumentation provides fine-grained control:

```typescript
import { trace, SpanKind, SpanStatusCode, context } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service', '1.0.0');

class OrderService {
  async createOrder(orderData: OrderData): Promise<Order> {
    // Start a new span
    return tracer.startActiveSpan('OrderService.createOrder',
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'order.customer_id': orderData.customerId,
          'order.items_count': orderData.items.length,
        },
      },
      async (span) => {
        try {
          // Validate order
          await this.validateOrder(orderData);

          // Calculate pricing
          const pricing = await this.calculatePricing(orderData);
          span.setAttribute('order.total', pricing.total);

          // Add event for important milestone
          span.addEvent('pricing_calculated', {
            'pricing.subtotal': pricing.subtotal,
            'pricing.tax': pricing.tax,
            'pricing.discount': pricing.discount,
          });

          // Reserve inventory
          await this.reserveInventory(orderData.items);
          span.addEvent('inventory_reserved');

          // Create order record
          const order = await this.persistOrder(orderData, pricing);

          span.setAttribute('order.id', order.id);
          span.setStatus({ code: SpanStatusCode.OK });

          return order;
        } catch (error) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          span.recordException(error);
          throw error;
        } finally {
          span.end();
        }
      }
    );
  }

  private async validateOrder(orderData: OrderData): Promise<void> {
    return tracer.startActiveSpan('OrderService.validateOrder', async (span) => {
      try {
        // Validation logic
        if (!orderData.items?.length) {
          throw new Error('Order must have at least one item');
        }
        span.setStatus({ code: SpanStatusCode.OK });
      } finally {
        span.end();
      }
    });
  }

  private async calculatePricing(orderData: OrderData): Promise<Pricing> {
    return tracer.startActiveSpan('OrderService.calculatePricing',
      { kind: SpanKind.INTERNAL },
      async (span) => {
        try {
          // Pricing calculation
          const subtotal = orderData.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          );

          span.setAttribute('pricing.items_calculated', orderData.items.length);
          span.setStatus({ code: SpanStatusCode.OK });

          return {
            subtotal,
            tax: subtotal * 0.1,
            discount: 0,
            total: subtotal * 1.1,
          };
        } finally {
          span.end();
        }
      }
    );
  }
}
```

### Distributed Context Propagation

When calling external services, context must be propagated:

```typescript
import { trace, context, propagation } from '@opentelemetry/api';
import axios from 'axios';

const tracer = trace.getTracer('order-service');

async function callPaymentService(orderId: string, amount: number) {
  return tracer.startActiveSpan('call-payment-service',
    { kind: SpanKind.CLIENT },
    async (span) => {
      span.setAttribute('payment.order_id', orderId);
      span.setAttribute('payment.amount', amount);

      // Prepare headers with trace context
      const headers: Record<string, string> = {};
      propagation.inject(context.active(), headers);

      try {
        const response = await axios.post(
          'http://payment-service/payments',
          { orderId, amount },
          { headers }
        );

        span.setAttribute('payment.transaction_id', response.data.transactionId);
        span.setStatus({ code: SpanStatusCode.OK });

        return response.data;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
      } finally {
        span.end();
      }
    }
  );
}
```

### Instrumenting Message Queues

```typescript
import { trace, SpanKind, propagation, context } from '@opentelemetry/api';
import amqp from 'amqplib';

const tracer = trace.getTracer('order-service');

// Producer: Publishing messages
async function publishOrderEvent(order: Order) {
  return tracer.startActiveSpan('publish-order-event',
    {
      kind: SpanKind.PRODUCER,
      attributes: {
        'messaging.system': 'rabbitmq',
        'messaging.destination': 'orders',
        'messaging.operation': 'publish',
      },
    },
    async (span) => {
      // Inject trace context into message headers
      const headers: Record<string, string> = {};
      propagation.inject(context.active(), headers);

      const message = {
        type: 'ORDER_CREATED',
        data: order,
        metadata: { traceContext: headers },
      };

      await channel.publish(
        'orders',
        'order.created',
        Buffer.from(JSON.stringify(message)),
        { headers }
      );

      span.end();
    }
  );
}

// Consumer: Processing messages
async function processMessage(msg: amqp.Message) {
  // Extract trace context from message headers
  const parentContext = propagation.extract(
    context.active(),
    msg.properties.headers
  );

  // Create consumer span linked to producer
  return context.with(parentContext, () => {
    return tracer.startActiveSpan('process-order-event',
      {
        kind: SpanKind.CONSUMER,
        attributes: {
          'messaging.system': 'rabbitmq',
          'messaging.destination': 'orders',
          'messaging.operation': 'process',
        },
      },
      async (span) => {
        try {
          const message = JSON.parse(msg.content.toString());
          span.setAttribute('message.type', message.type);

          // Process the message
          await handleOrderEvent(message);

          span.setStatus({ code: SpanStatusCode.OK });
          channel.ack(msg);
        } catch (error) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          channel.nack(msg, false, true); // Requeue
        } finally {
          span.end();
        }
      }
    );
  });
}
```

### Database Query Instrumentation

```typescript
import { trace, SpanKind } from '@opentelemetry/api';
import { Pool } from 'pg';

const tracer = trace.getTracer('order-service');
const pool = new Pool();

async function findOrderById(orderId: string): Promise<Order | null> {
  return tracer.startActiveSpan('db.query',
    {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.system': 'postgresql',
        'db.name': 'orders',
        'db.operation': 'SELECT',
        'db.sql.table': 'orders',
      },
    },
    async (span) => {
      const query = 'SELECT * FROM orders WHERE id = $1';
      span.setAttribute('db.statement', query);

      try {
        const result = await pool.query(query, [orderId]);
        span.setAttribute('db.rows_affected', result.rowCount);
        span.setStatus({ code: SpanStatusCode.OK });

        return result.rows[0] || null;
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw error;
      } finally {
        span.end();
      }
    }
  );
}
```

---

## Analyzing Traces

### Understanding Trace Visualization

A typical trace view shows:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Trace: abc123                                           Duration: 245ms     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ▼ api-gateway: POST /checkout                          [0ms ─────── 245ms] │
│   │                                                                         │
│   ├─▼ order-service: createOrder                       [5ms ──────── 200ms]│
│   │   │                                                                     │
│   │   ├── order-service: validateOrder                 [6ms ─── 15ms]      │
│   │   │                                                                     │
│   │   ├── order-service: calculatePricing              [16ms ─── 25ms]     │
│   │   │                                                                     │
│   │   ├─▼ inventory-service: reserveItems              [26ms ──── 80ms]    │
│   │   │   │                                                                 │
│   │   │   └── inventory-db: SELECT                     [28ms ── 45ms]      │
│   │   │                                                                     │
│   │   └── order-db: INSERT                             [85ms ─── 120ms]    │
│   │                                                                         │
│   └─▼ payment-service: processPayment                  [125ms ──── 240ms]  │
│       │                                                                     │
│       ├── payment-service: validateCard                [126ms ── 135ms]    │
│       │                                                                     │
│       └── stripe-api: charge                           [136ms ── 235ms]    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Metrics to Analyze

**1. Latency Distribution**

```
Span: order-service.createOrder
───────────────────────────────────────
p50 (median):     45ms
p75:              62ms
p90:              98ms
p95:             145ms
p99:             312ms
Max:             892ms
───────────────────────────────────────
```

**2. Error Rate by Operation**

```
Operation                    Requests    Errors    Error Rate
────────────────────────────────────────────────────────────────
POST /checkout                 10,000       150        1.5%
  └─ createOrder                9,850        50        0.5%
  └─ processPayment             9,800       100        1.0%
     └─ stripe-api               9,700        80        0.8%
```

**3. Dependency Analysis**

```
order-service Dependencies:
────────────────────────────────────────
→ inventory-service   Calls: 9,850   Avg: 54ms   Errors: 0.2%
→ payment-service     Calls: 9,800   Avg: 115ms  Errors: 1.0%
→ notification-svc    Calls: 9,750   Avg: 23ms   Errors: 0.1%
→ postgres (orders)   Calls: 29,400  Avg: 12ms   Errors: 0.01%
```

### Identifying Performance Issues

**Slow Spans Analysis**

```typescript
// Query for slow traces in Jaeger
{
  "service": "order-service",
  "operation": "createOrder",
  "minDuration": "500ms",
  "tags": {
    "error": "true"
  },
  "limit": 20
}
```

**Common Patterns to Look For**

1. **N+1 Query Problem**
```
order-service: getOrders                         [0ms ─── 1200ms]
  ├── db: SELECT orders                          [5ms ─── 15ms]
  ├── db: SELECT order_items WHERE order_id=1    [20ms ─── 25ms]
  ├── db: SELECT order_items WHERE order_id=2    [30ms ─── 35ms]
  ├── db: SELECT order_items WHERE order_id=3    [40ms ─── 45ms]
  ... (repeated 100 times)
```

2. **Sequential Calls That Could Be Parallel**
```
order-service: checkout                          [0ms ─── 500ms]
  ├── inventory-service: check                   [5ms ─── 100ms]
  ├── pricing-service: calculate                 [105ms ─── 200ms]  // Could run parallel
  ├── shipping-service: estimate                 [205ms ─── 300ms]  // Could run parallel
  └── tax-service: calculate                     [305ms ─── 400ms]  // Could run parallel
```

3. **Missing Database Indexes**
```
order-service: findByCustomer                    [0ms ─── 2500ms]
  └── db: SELECT * FROM orders WHERE customer_id = ?
      [5ms ─── 2450ms]  // Extremely slow query
```

### Creating Alerts Based on Traces

```yaml
# Prometheus alerting rules based on trace metrics
groups:
  - name: tracing-alerts
    rules:
      - alert: HighLatencyP99
        expr: |
          histogram_quantile(0.99,
            sum(rate(span_duration_seconds_bucket{
              service="order-service",
              operation="createOrder"
            }[5m])) by (le)
          ) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High p99 latency for order creation"
          description: "99th percentile latency is {{ $value }}s"

      - alert: HighErrorRate
        expr: |
          sum(rate(span_count{
            service="order-service",
            status="error"
          }[5m])) /
          sum(rate(span_count{
            service="order-service"
          }[5m])) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate in order-service"
          description: "Error rate is {{ $value | humanizePercentage }}"
```

### Correlating Traces with Logs and Metrics

**Structured Logging with Trace Context**

```typescript
import { trace, context } from '@opentelemetry/api';
import pino from 'pino';

const logger = pino({
  mixin() {
    const span = trace.getSpan(context.active());
    if (span) {
      const spanContext = span.spanContext();
      return {
        trace_id: spanContext.traceId,
        span_id: spanContext.spanId,
        trace_flags: spanContext.traceFlags,
      };
    }
    return {};
  },
});

// Usage
function processOrder(order: Order) {
  logger.info({ orderId: order.id }, 'Processing order');
  // Log output includes trace_id and span_id automatically
}
```

**Example Log Output**

```json
{
  "level": 30,
  "time": 1704067200000,
  "msg": "Processing order",
  "orderId": "ord_123",
  "trace_id": "abc123def456789",
  "span_id": "span789",
  "trace_flags": 1
}
```

---

## Best Practices

### Semantic Conventions

Follow OpenTelemetry semantic conventions for consistent attribute naming:

```typescript
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

span.setAttributes({
  // HTTP
  [SemanticAttributes.HTTP_METHOD]: 'POST',
  [SemanticAttributes.HTTP_URL]: 'https://api.example.com/orders',
  [SemanticAttributes.HTTP_STATUS_CODE]: 201,

  // Database
  [SemanticAttributes.DB_SYSTEM]: 'postgresql',
  [SemanticAttributes.DB_NAME]: 'orders',
  [SemanticAttributes.DB_OPERATION]: 'INSERT',

  // Messaging
  [SemanticAttributes.MESSAGING_SYSTEM]: 'rabbitmq',
  [SemanticAttributes.MESSAGING_DESTINATION]: 'orders.created',

  // Custom business attributes (use your own namespace)
  'app.order.id': order.id,
  'app.order.total': order.total,
  'app.customer.tier': customer.tier,
});
```

### Span Naming Guidelines

```typescript
// Good: Descriptive, consistent, low cardinality
'HTTP GET /users/{id}'
'OrderService.createOrder'
'PostgreSQL INSERT orders'
'RabbitMQ publish orders.created'

// Bad: High cardinality (includes variable data)
'HTTP GET /users/12345'          // User ID in name
'Process order ord_abc123'        // Order ID in name
'Query SELECT * FROM orders WHERE id = 123'  // Query with values
```

### Sensitive Data Handling

```typescript
// Configure sanitization for sensitive data
const exporter = new OTLPTraceExporter({
  url: 'http://localhost:4317',
});

// Sanitize attributes before export
class SanitizingSpanProcessor extends SimpleSpanProcessor {
  onEnd(span: ReadableSpan): void {
    const sanitizedAttributes = { ...span.attributes };

    // Remove or mask sensitive fields
    const sensitiveKeys = ['password', 'token', 'credit_card', 'ssn'];
    for (const key of Object.keys(sanitizedAttributes)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitizedAttributes[key] = '[REDACTED]';
      }
    }

    // Mask email addresses
    if (sanitizedAttributes['user.email']) {
      sanitizedAttributes['user.email'] = maskEmail(
        sanitizedAttributes['user.email'] as string
      );
    }

    super.onEnd(span);
  }
}
```

### Performance Considerations

```typescript
// Use batch processing for better performance
const batchProcessor = new BatchSpanProcessor(exporter, {
  maxQueueSize: 2048,           // Maximum queue size
  maxExportBatchSize: 512,      // Maximum batch size
  scheduledDelayMillis: 5000,   // Export interval
  exportTimeoutMillis: 30000,   // Export timeout
});

// Implement smart sampling for high-traffic systems
const sampler = new ParentBasedSampler({
  root: new TraceIdRatioBasedSampler(0.1),  // Sample 10% of new traces
  remoteParentSampled: new AlwaysOnSampler(),
  remoteParentNotSampled: new AlwaysOffSampler(),
});
```

### Testing Instrumentation

```typescript
// testing/tracing.test.ts
import {
  InMemorySpanExporter,
  SimpleSpanProcessor
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

describe('Order Service Tracing', () => {
  let exporter: InMemorySpanExporter;
  let provider: NodeTracerProvider;

  beforeEach(() => {
    exporter = new InMemorySpanExporter();
    provider = new NodeTracerProvider();
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    provider.register();
  });

  afterEach(() => {
    exporter.reset();
  });

  it('should create spans for order creation', async () => {
    const orderService = new OrderService();
    await orderService.createOrder({ customerId: 'cust_123', items: [] });

    const spans = exporter.getFinishedSpans();

    expect(spans).toHaveLength(3);
    expect(spans.map(s => s.name)).toEqual([
      'OrderService.validateOrder',
      'OrderService.calculatePricing',
      'OrderService.createOrder',
    ]);

    const rootSpan = spans.find(s => s.name === 'OrderService.createOrder');
    expect(rootSpan?.attributes['order.customer_id']).toBe('cust_123');
  });

  it('should record errors in spans', async () => {
    const orderService = new OrderService();

    await expect(
      orderService.createOrder({ customerId: 'cust_123', items: [] })
    ).rejects.toThrow();

    const spans = exporter.getFinishedSpans();
    const errorSpan = spans.find(s => s.status.code === SpanStatusCode.ERROR);

    expect(errorSpan).toBeDefined();
    expect(errorSpan?.events).toContainEqual(
      expect.objectContaining({ name: 'exception' })
    );
  });
});
```

---

## Summary

Distributed tracing is essential for understanding, debugging, and optimizing modern distributed systems. Key takeaways:

1. **Traces and Spans**: A trace represents an entire request journey; spans represent individual operations within that journey.

2. **Context Propagation**: Use standardized formats (W3C Trace Context) to pass trace information across service boundaries.

3. **OpenTelemetry**: Adopt OpenTelemetry as your instrumentation standard for vendor neutrality and comprehensive tooling.

4. **Automatic + Manual Instrumentation**: Combine automatic instrumentation for common libraries with manual instrumentation for business logic.

5. **Backend Choice**: Choose between Jaeger, Zipkin, or commercial solutions based on your scale, features needed, and operational capacity.

6. **Analysis Skills**: Learn to read trace visualizations, identify performance patterns, and correlate traces with logs and metrics.

7. **Best Practices**: Follow semantic conventions, protect sensitive data, optimize for performance, and test your instrumentation.

By implementing distributed tracing effectively, you gain the visibility needed to operate, debug, and continuously improve your distributed systems.
