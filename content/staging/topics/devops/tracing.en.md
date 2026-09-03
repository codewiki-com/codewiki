---
title: 分布式链路追踪指南
description: 掌握分布式链路追踪，实现微服务可观测性
track: devops
section: observability
difficulty: advanced
tags:
  - 链路追踪
  - Jaeger
  - OpenTelemetry
  - 可观测性
status: imported
origin: old/src/content/docs/devops/tracing.en.md
divergence: 0.202
issues:
  - title-lang-en
  - title-language
legacy:
  category: DevOps
  subcategory: Observability
  order: 22
  lastUpdated: 2026-01-07
---

## Concept Explanation

Distributed Tracing is a technology used to monitor and analyze the request flow path in distributed systems. In microservice architectures, a user request may need to pass through multiple services to complete. Tracing links these scattered calls together to form a complete call chain view.

### Why We Need Distributed Tracing

In traditional monolithic applications, all business logic executes within the same process, making troubleshooting relatively simple. However, in microservice architectures:

- **Complex Service Calls**: A single request may involve calls to dozens of services
- **Difficult Problem Location**: When performance issues or errors occur, it's hard to determine which service caused them
- **Unclear Dependencies**: Service call relationships are difficult to visualize
- **Hidden Performance Bottlenecks**: Cross-service latency issues are hard to discover

### Core Concepts

#### Trace

A Trace represents a complete request chain, from when a user initiates a request to when the final response is returned. Each Trace is identified by a globally unique Trace ID.

```
Trace ID: abc123def456
├── Service A (Entry Gateway)
│   ├── Service B (User Service)
│   │   └── Database Query
│   └── Service C (Order Service)
│       ├── Service D (Inventory Service)
│       └── Service E (Payment Service)
```

#### Span

A Span is the basic unit of work in a Trace, representing a specific operation or call. Each Span contains:

```json
{
  "traceId": "abc123def456",
  "spanId": "span001",
  "parentSpanId": null,
  "operationName": "HTTP GET /api/orders",
  "serviceName": "api-gateway",
  "startTime": "2024-01-15T10:30:00.000Z",
  "duration": 250,
  "status": "OK",
  "tags": {
    "http.method": "GET",
    "http.url": "/api/orders",
    "http.status_code": 200
  },
  "logs": [
    {
      "timestamp": "2024-01-15T10:30:00.050Z",
      "message": "Processing order request"
    }
  ]
}
```

#### Context Propagation

Context propagation is the core mechanism of distributed tracing, ensuring that Trace ID and Span ID can be passed between services:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Context Propagation                             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
     ┌──────────────────────────────┼──────────────────────────────┐
     │                              │                              │
     ▼                              ▼                              ▼
┌─────────┐     HTTP Headers    ┌─────────┐     gRPC Metadata   ┌─────────┐
│Service A│ ───────────────────►│Service B│ ───────────────────►│Service C│
│         │  traceparent:       │         │  traceparent:       │         │
│         │  00-abc123-span1-01 │         │  00-abc123-span2-01 │         │
└─────────┘                     └─────────┘                     └─────────┘
```

## OpenTelemetry Ecosystem

OpenTelemetry (OTel for short) is a CNCF open-source project that provides a unified API, SDK, and toolset for generating, collecting, and exporting telemetry data (traces, metrics, logs).

### Architecture Overview

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                   OpenTelemetry Architecture              │
                    └─────────────────────────────────────────────────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        │                                     │                                     │
        ▼                                     ▼                                     ▼
┌───────────────┐                   ┌─────────────────┐                   ┌─────────────────┐
│  Application  │                   │   OTel SDK      │                   │  OTel Collector │
│  Instrumentation│◄─────────────────│  (Language     │──────────────────►│   (Data Pipeline)│
└───────────────┘                   │   Specific)     │                   └─────────────────┘
        │                           └─────────────────┘                           │
        │                                     │                                     │
┌───────┴───────┐                   ┌─────────┴─────────┐               ┌──────────┴──────────┐
│  Auto Instr.  │                   │   Traces         │               │  Receivers         │
│  Manual Instr.│                   │   Metrics        │               │  Processors        │
│  SDK APIs     │                   │   Logs           │               │  Exporters         │
└───────────────┘                   └───────────────────┘               └─────────────────────┘
                                                                                  │
                                                                                  ▼
                                                                        ┌─────────────────┐
                                                                        │  Backends       │
                                                                        │  Jaeger/Zipkin  │
                                                                        │  Prometheus     │
                                                                        └─────────────────┘
```

### OTel Collector Configuration

The OpenTelemetry Collector is a high-performance data collection and processing component:

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

  jaeger:
    protocols:
      thrift_http:
        endpoint: 0.0.0.0:14268
      grpc:
        endpoint: 0.0.0.0:14250

  zipkin:
    endpoint: 0.0.0.0:9411

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
    send_batch_max_size: 2048

  memory_limiter:
    check_interval: 1s
    limit_mib: 2000
    spike_limit_mib: 500

  resource:
    attributes:
      - key: environment
        value: production
        action: upsert
      - key: cluster
        value: k8s-prod-01
        action: upsert

  attributes:
    actions:
      - key: db.statement
        action: hash
      - key: http.request.header.authorization
        action: delete

  tail_sampling:
    decision_wait: 10s
    num_traces: 100000
    expected_new_traces_per_sec: 1000
    policies:
      - name: error-policy
        type: status_code
        status_code:
          status_codes: [ERROR]
      - name: slow-traces
        type: latency
        latency:
          threshold_ms: 1000
      - name: probabilistic-sampling
        type: probabilistic
        probabilistic:
          sampling_percentage: 10

exporters:
  otlp/jaeger:
    endpoint: jaeger:4317
    tls:
      insecure: true

  prometheus:
    endpoint: 0.0.0.0:8889
    namespace: otel
    const_labels:
      source: otel-collector

  logging:
    loglevel: debug
    sampling_initial: 5
    sampling_thereafter: 200

  otlp/tempo:
    endpoint: tempo:4317
    tls:
      insecure: true

extensions:
  health_check:
    endpoint: 0.0.0.0:13133

  pprof:
    endpoint: 0.0.0.0:1888

  zpages:
    endpoint: 0.0.0.0:55679

service:
  extensions: [health_check, pprof, zpages]
  pipelines:
    traces:
      receivers: [otlp, jaeger, zipkin]
      processors: [memory_limiter, batch, resource, tail_sampling]
      exporters: [otlp/jaeger, otlp/tempo]

    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheus]

    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [logging]
```

### Go Language Integration

```go
// tracing/otel.go
package tracing

import (
    "context"
    "time"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/propagation"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
    "go.opentelemetry.io/otel/trace"
    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
)

// Config contains tracing configuration
type Config struct {
    ServiceName    string
    ServiceVersion string
    Environment    string
    CollectorURL   string
    SampleRate     float64
}

// InitTracer initializes OpenTelemetry tracing
func InitTracer(cfg Config) (func(context.Context) error, error) {
    ctx := context.Background()

    // Create OTLP exporter
    conn, err := grpc.DialContext(ctx, cfg.CollectorURL,
        grpc.WithTransportCredentials(insecure.NewCredentials()),
        grpc.WithBlock(),
    )
    if err != nil {
        return nil, err
    }

    exporter, err := otlptrace.New(ctx,
        otlptracegrpc.NewClient(otlptracegrpc.WithGRPCConn(conn)),
    )
    if err != nil {
        return nil, err
    }

    // Create resource information
    res, err := resource.Merge(
        resource.Default(),
        resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceName(cfg.ServiceName),
            semconv.ServiceVersion(cfg.ServiceVersion),
            attribute.String("environment", cfg.Environment),
        ),
    )
    if err != nil {
        return nil, err
    }

    // Create sampler
    sampler := sdktrace.ParentBased(
        sdktrace.TraceIDRatioBased(cfg.SampleRate),
    )

    // Create TracerProvider
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter,
            sdktrace.WithMaxExportBatchSize(512),
            sdktrace.WithBatchTimeout(5*time.Second),
        ),
        sdktrace.WithResource(res),
        sdktrace.WithSampler(sampler),
    )

    // Set global TracerProvider and Propagator
    otel.SetTracerProvider(tp)
    otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
        propagation.TraceContext{},
        propagation.Baggage{},
    ))

    return tp.Shutdown, nil
}

// StartSpan creates a new Span
func StartSpan(ctx context.Context, name string, opts ...trace.SpanStartOption) (context.Context, trace.Span) {
    tracer := otel.Tracer("application")
    return tracer.Start(ctx, name, opts...)
}

// AddEvent adds an event to the current Span
func AddEvent(ctx context.Context, name string, attrs ...attribute.KeyValue) {
    span := trace.SpanFromContext(ctx)
    span.AddEvent(name, trace.WithAttributes(attrs...))
}

// SetError records an error to the current Span
func SetError(ctx context.Context, err error) {
    span := trace.SpanFromContext(ctx)
    span.RecordError(err)
}

// SetAttributes sets Span attributes
func SetAttributes(ctx context.Context, attrs ...attribute.KeyValue) {
    span := trace.SpanFromContext(ctx)
    span.SetAttributes(attrs...)
}
```

```go
// middleware/tracing.go
package middleware

import (
    "net/http"

    "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/propagation"
    semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
    "go.opentelemetry.io/otel/trace"
)

// TracingMiddleware creates HTTP tracing middleware
func TracingMiddleware(next http.Handler) http.Handler {
    return otelhttp.NewHandler(next, "http-server",
        otelhttp.WithSpanNameFormatter(func(operation string, r *http.Request) string {
            return r.Method + " " + r.URL.Path
        }),
    )
}

// CustomTracingMiddleware creates custom tracing middleware
func CustomTracingMiddleware(serviceName string) func(http.Handler) http.Handler {
    tracer := otel.Tracer(serviceName)

    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Extract context from request headers
            ctx := otel.GetTextMapPropagator().Extract(r.Context(), propagation.HeaderCarrier(r.Header))

            // Create Span
            ctx, span := tracer.Start(ctx, r.Method+" "+r.URL.Path,
                trace.WithSpanKind(trace.SpanKindServer),
                trace.WithAttributes(
                    semconv.HTTPMethod(r.Method),
                    semconv.HTTPURL(r.URL.String()),
                    semconv.HTTPScheme(r.URL.Scheme),
                    semconv.NetHostName(r.Host),
                    attribute.String("http.user_agent", r.UserAgent()),
                ),
            )
            defer span.End()

            // Use custom ResponseWriter to capture status code
            rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
            next.ServeHTTP(rw, r.WithContext(ctx))

            // Record response status code
            span.SetAttributes(semconv.HTTPStatusCode(rw.statusCode))
            if rw.statusCode >= 400 {
                span.SetStatus(codes.Error, http.StatusText(rw.statusCode))
            }
        })
    }
}

type responseWriter struct {
    http.ResponseWriter
    statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
    rw.statusCode = code
    rw.ResponseWriter.WriteHeader(code)
}
```

```go
// service/order.go - Business service example
package service

import (
    "context"
    "database/sql"
    "encoding/json"
    "net/http"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/codes"
    "go.opentelemetry.io/otel/propagation"
    semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
    "go.opentelemetry.io/otel/trace"
)

type OrderService struct {
    db         *sql.DB
    httpClient *http.Client
    tracer     trace.Tracer
}

func NewOrderService(db *sql.DB) *OrderService {
    return &OrderService{
        db:         db,
        httpClient: &http.Client{},
        tracer:     otel.Tracer("order-service"),
    }
}

// CreateOrder creates an order
func (s *OrderService) CreateOrder(ctx context.Context, req CreateOrderRequest) (*Order, error) {
    ctx, span := s.tracer.Start(ctx, "CreateOrder",
        trace.WithAttributes(
            attribute.String("order.user_id", req.UserID),
            attribute.Int("order.items_count", len(req.Items)),
        ),
    )
    defer span.End()

    // 1. Validate user
    span.AddEvent("validating user")
    user, err := s.validateUser(ctx, req.UserID)
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "user validation failed")
        return nil, err
    }

    // 2. Check inventory
    span.AddEvent("checking inventory")
    if err := s.checkInventory(ctx, req.Items); err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "inventory check failed")
        return nil, err
    }

    // 3. Create order record
    span.AddEvent("creating order record")
    order, err := s.createOrderRecord(ctx, user, req)
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "order creation failed")
        return nil, err
    }

    // 4. Process payment
    span.AddEvent("processing payment")
    if err := s.processPayment(ctx, order); err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "payment processing failed")
        return nil, err
    }

    span.SetAttributes(
        attribute.String("order.id", order.ID),
        attribute.Float64("order.total", order.Total),
    )
    span.SetStatus(codes.Ok, "order created successfully")

    return order, nil
}

// validateUser validates user (calls user service)
func (s *OrderService) validateUser(ctx context.Context, userID string) (*User, error) {
    ctx, span := s.tracer.Start(ctx, "validateUser",
        trace.WithSpanKind(trace.SpanKindClient),
    )
    defer span.End()

    // Create request
    req, err := http.NewRequestWithContext(ctx, "GET", "http://user-service/users/"+userID, nil)
    if err != nil {
        return nil, err
    }

    // Inject tracing context into request headers
    otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(req.Header))

    // Set HTTP-related attributes
    span.SetAttributes(
        semconv.HTTPMethod("GET"),
        semconv.HTTPURL(req.URL.String()),
        semconv.NetPeerName("user-service"),
    )

    // Execute request
    resp, err := s.httpClient.Do(req)
    if err != nil {
        span.RecordError(err)
        return nil, err
    }
    defer resp.Body.Close()

    span.SetAttributes(semconv.HTTPStatusCode(resp.StatusCode))

    var user User
    if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
        return nil, err
    }

    return &user, nil
}

// createOrderRecord database operation example
func (s *OrderService) createOrderRecord(ctx context.Context, user *User, req CreateOrderRequest) (*Order, error) {
    ctx, span := s.tracer.Start(ctx, "createOrderRecord",
        trace.WithSpanKind(trace.SpanKindClient),
        trace.WithAttributes(
            semconv.DBSystemPostgreSQL,
            semconv.DBName("orders"),
            semconv.DBOperation("INSERT"),
        ),
    )
    defer span.End()

    query := `INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING id`
    span.SetAttributes(attribute.String("db.statement", query))

    var orderID string
    err := s.db.QueryRowContext(ctx, query, user.ID, calculateTotal(req.Items), "pending").Scan(&orderID)
    if err != nil {
        span.RecordError(err)
        return nil, err
    }

    return &Order{ID: orderID, UserID: user.ID, Status: "pending"}, nil
}
```

### Java Language Integration

```java
// TracingConfig.java
package com.example.tracing;

import io.opentelemetry.api.OpenTelemetry;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.api.trace.propagation.W3CTraceContextPropagator;
import io.opentelemetry.context.propagation.ContextPropagators;
import io.opentelemetry.exporter.otlp.trace.OtlpGrpcSpanExporter;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.resources.Resource;
import io.opentelemetry.sdk.trace.SdkTracerProvider;
import io.opentelemetry.sdk.trace.export.BatchSpanProcessor;
import io.opentelemetry.sdk.trace.samplers.Sampler;
import io.opentelemetry.semconv.resource.attributes.ResourceAttributes;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
public class TracingConfig {

    @Value("${otel.service.name}")
    private String serviceName;

    @Value("${otel.service.version}")
    private String serviceVersion;

    @Value("${otel.exporter.otlp.endpoint}")
    private String otlpEndpoint;

    @Value("${otel.traces.sampler.probability:1.0}")
    private double samplerProbability;

    @Bean
    public OpenTelemetry openTelemetry() {
        // Create resource
        Resource resource = Resource.getDefault()
            .merge(Resource.create(Attributes.builder()
                .put(ResourceAttributes.SERVICE_NAME, serviceName)
                .put(ResourceAttributes.SERVICE_VERSION, serviceVersion)
                .put(ResourceAttributes.DEPLOYMENT_ENVIRONMENT, "production")
                .build()));

        // Create OTLP exporter
        OtlpGrpcSpanExporter spanExporter = OtlpGrpcSpanExporter.builder()
            .setEndpoint(otlpEndpoint)
            .setTimeout(30, TimeUnit.SECONDS)
            .build();

        // Create sampler
        Sampler sampler = Sampler.parentBased(
            Sampler.traceIdRatioBased(samplerProbability)
        );

        // Create TracerProvider
        SdkTracerProvider tracerProvider = SdkTracerProvider.builder()
            .addSpanProcessor(BatchSpanProcessor.builder(spanExporter)
                .setMaxExportBatchSize(512)
                .setScheduleDelay(5, TimeUnit.SECONDS)
                .build())
            .setResource(resource)
            .setSampler(sampler)
            .build();

        // Build OpenTelemetry instance
        return OpenTelemetrySdk.builder()
            .setTracerProvider(tracerProvider)
            .setPropagators(ContextPropagators.create(W3CTraceContextPropagator.getInstance()))
            .buildAndRegisterGlobal();
    }

    @Bean
    public Tracer tracer(OpenTelemetry openTelemetry) {
        return openTelemetry.getTracer(serviceName, serviceVersion);
    }
}
```

```java
// TracingInterceptor.java
package com.example.tracing;

import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.context.Context;
import io.opentelemetry.context.Scope;
import io.opentelemetry.context.propagation.TextMapGetter;
import io.opentelemetry.semconv.trace.attributes.SemanticAttributes;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.util.Collections;

@Component
public class TracingInterceptor implements HandlerInterceptor {

    private final Tracer tracer;

    private static final TextMapGetter<HttpServletRequest> GETTER = new TextMapGetter<>() {
        @Override
        public Iterable<String> keys(HttpServletRequest carrier) {
            return Collections.list(carrier.getHeaderNames());
        }

        @Override
        public String get(HttpServletRequest carrier, String key) {
            return carrier.getHeader(key);
        }
    };

    public TracingInterceptor() {
        this.tracer = GlobalOpenTelemetry.getTracer("http-server");
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Extract context from request headers
        Context extractedContext = GlobalOpenTelemetry.getPropagators()
            .getTextMapPropagator()
            .extract(Context.current(), request, GETTER);

        // Create server Span
        Span span = tracer.spanBuilder(request.getMethod() + " " + request.getRequestURI())
            .setParent(extractedContext)
            .setSpanKind(SpanKind.SERVER)
            .setAttribute(SemanticAttributes.HTTP_METHOD, request.getMethod())
            .setAttribute(SemanticAttributes.HTTP_URL, request.getRequestURL().toString())
            .setAttribute(SemanticAttributes.HTTP_SCHEME, request.getScheme())
            .setAttribute(SemanticAttributes.NET_HOST_NAME, request.getServerName())
            .setAttribute(SemanticAttributes.HTTP_USER_AGENT, request.getHeader("User-Agent"))
            .startSpan();

        // Store Span in request attributes
        request.setAttribute("otel-span", span);
        request.setAttribute("otel-scope", span.makeCurrent());

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                 Object handler, Exception ex) {
        Span span = (Span) request.getAttribute("otel-span");
        Scope scope = (Scope) request.getAttribute("otel-scope");

        if (span != null) {
            span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, response.getStatus());

            if (ex != null) {
                span.recordException(ex);
                span.setStatus(StatusCode.ERROR, ex.getMessage());
            } else if (response.getStatus() >= 400) {
                span.setStatus(StatusCode.ERROR, "HTTP " + response.getStatus());
            }

            span.end();
        }

        if (scope != null) {
            scope.close();
        }
    }
}
```

```java
// OrderService.java
package com.example.service;

import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanKind;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.context.Context;
import io.opentelemetry.context.Scope;
import io.opentelemetry.instrumentation.annotations.SpanAttribute;
import io.opentelemetry.instrumentation.annotations.WithSpan;
import io.opentelemetry.semconv.trace.attributes.SemanticAttributes;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class OrderService {

    @Autowired
    private Tracer tracer;

    @Autowired
    private UserServiceClient userServiceClient;

    @Autowired
    private InventoryServiceClient inventoryServiceClient;

    @Autowired
    private PaymentServiceClient paymentServiceClient;

    @Autowired
    private OrderRepository orderRepository;

    @WithSpan("CreateOrder")
    public Order createOrder(
            @SpanAttribute("order.user_id") String userId,
            @SpanAttribute("order.items_count") int itemsCount,
            CreateOrderRequest request) {

        Span currentSpan = Span.current();

        try {
            // 1. Validate user
            currentSpan.addEvent("Validating user");
            User user = validateUser(userId);

            // 2. Check inventory
            currentSpan.addEvent("Checking inventory");
            checkInventory(request.getItems());

            // 3. Create order
            currentSpan.addEvent("Creating order record");
            Order order = createOrderRecord(user, request);

            // 4. Process payment
            currentSpan.addEvent("Processing payment");
            processPayment(order);

            currentSpan.setAttribute("order.id", order.getId());
            currentSpan.setAttribute("order.total", order.getTotal());
            currentSpan.setStatus(StatusCode.OK);

            return order;

        } catch (Exception e) {
            currentSpan.recordException(e);
            currentSpan.setStatus(StatusCode.ERROR, e.getMessage());
            throw e;
        }
    }

    @WithSpan(value = "ValidateUser", kind = SpanKind.CLIENT)
    private User validateUser(@SpanAttribute("user.id") String userId) {
        return userServiceClient.getUser(userId);
    }

    @WithSpan(value = "CheckInventory", kind = SpanKind.CLIENT)
    private void checkInventory(List<OrderItem> items) {
        for (OrderItem item : items) {
            inventoryServiceClient.checkAvailability(item.getProductId(), item.getQuantity());
        }
    }

    @WithSpan(value = "CreateOrderRecord", kind = SpanKind.CLIENT)
    private Order createOrderRecord(User user, CreateOrderRequest request) {
        Span span = Span.current();
        span.setAttribute(SemanticAttributes.DB_SYSTEM, "postgresql");
        span.setAttribute(SemanticAttributes.DB_NAME, "orders");
        span.setAttribute(SemanticAttributes.DB_OPERATION, "INSERT");

        Order order = new Order();
        order.setUserId(user.getId());
        order.setItems(request.getItems());
        order.setTotal(calculateTotal(request.getItems()));
        order.setStatus(OrderStatus.PENDING);

        return orderRepository.save(order);
    }

    @WithSpan(value = "ProcessPayment", kind = SpanKind.CLIENT)
    private void processPayment(Order order) {
        paymentServiceClient.charge(order.getUserId(), order.getTotal());
    }
}
```

### Python Language Integration

```python
# tracing/otel.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.propagate import set_global_textmap
from opentelemetry.propagators.composite import CompositePropagator
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
from opentelemetry.baggage.propagation import W3CBaggagePropagator
from opentelemetry.sdk.trace.sampling import ParentBasedTraceIdRatio
from functools import wraps
import os

class TracingConfig:
    def __init__(
        self,
        service_name: str,
        service_version: str = "1.0.0",
        otlp_endpoint: str = "localhost:4317",
        sample_rate: float = 1.0
    ):
        self.service_name = service_name
        self.service_version = service_version
        self.otlp_endpoint = otlp_endpoint
        self.sample_rate = sample_rate

def init_tracer(config: TracingConfig) -> trace.Tracer:
    """Initialize OpenTelemetry tracer"""

    # Create resource
    resource = Resource.create({
        SERVICE_NAME: config.service_name,
        SERVICE_VERSION: config.service_version,
        "deployment.environment": os.getenv("ENVIRONMENT", "production"),
    })

    # Create sampler
    sampler = ParentBasedTraceIdRatio(config.sample_rate)

    # Create TracerProvider
    provider = TracerProvider(
        resource=resource,
        sampler=sampler
    )

    # Create OTLP exporter
    exporter = OTLPSpanExporter(
        endpoint=config.otlp_endpoint,
        insecure=True
    )

    # Add batch processor
    provider.add_span_processor(
        BatchSpanProcessor(
            exporter,
            max_export_batch_size=512,
            schedule_delay_millis=5000
        )
    )

    # Set global TracerProvider
    trace.set_tracer_provider(provider)

    # Set context propagators
    set_global_textmap(CompositePropagator([
        TraceContextTextMapPropagator(),
        W3CBaggagePropagator()
    ]))

    return trace.get_tracer(config.service_name)


def traced(name: str = None, kind: trace.SpanKind = trace.SpanKind.INTERNAL):
    """Tracing decorator"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            tracer = trace.get_tracer(__name__)
            span_name = name or func.__name__

            with tracer.start_as_current_span(
                span_name,
                kind=kind,
                attributes={
                    "function.name": func.__name__,
                    "function.module": func.__module__
                }
            ) as span:
                try:
                    result = func(*args, **kwargs)
                    span.set_status(trace.Status(trace.StatusCode.OK))
                    return result
                except Exception as e:
                    span.record_exception(e)
                    span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                    raise

        return wrapper
    return decorator


def add_span_attributes(**attrs):
    """Add attributes to current Span"""
    span = trace.get_current_span()
    span.set_attributes(attrs)


def add_span_event(name: str, attributes: dict = None):
    """Add event to current Span"""
    span = trace.get_current_span()
    span.add_event(name, attributes=attributes or {})
```

```python
# middleware/tracing.py
from opentelemetry import trace
from opentelemetry.propagate import extract, inject
from opentelemetry.trace import SpanKind, Status, StatusCode
from opentelemetry.semconv.trace import SpanAttributes
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import time

class TracingMiddleware(BaseHTTPMiddleware):
    """FastAPI/Starlette tracing middleware"""

    def __init__(self, app, service_name: str):
        super().__init__(app)
        self.tracer = trace.get_tracer(service_name)

    async def dispatch(self, request: Request, call_next) -> Response:
        # Extract context from request headers
        context = extract(request.headers)

        # Create Span
        with self.tracer.start_as_current_span(
            f"{request.method} {request.url.path}",
            context=context,
            kind=SpanKind.SERVER,
            attributes={
                SpanAttributes.HTTP_METHOD: request.method,
                SpanAttributes.HTTP_URL: str(request.url),
                SpanAttributes.HTTP_SCHEME: request.url.scheme,
                SpanAttributes.NET_HOST_NAME: request.url.hostname,
                SpanAttributes.HTTP_USER_AGENT: request.headers.get("user-agent", ""),
                SpanAttributes.NET_PEER_IP: request.client.host if request.client else "",
            }
        ) as span:
            start_time = time.time()

            try:
                response = await call_next(request)

                # Record response information
                span.set_attribute(SpanAttributes.HTTP_STATUS_CODE, response.status_code)

                if response.status_code >= 400:
                    span.set_status(Status(StatusCode.ERROR, f"HTTP {response.status_code}"))
                else:
                    span.set_status(Status(StatusCode.OK))

                return response

            except Exception as e:
                span.record_exception(e)
                span.set_status(Status(StatusCode.ERROR, str(e)))
                raise

            finally:
                duration = time.time() - start_time
                span.set_attribute("http.duration_ms", duration * 1000)
```

```python
# service/order_service.py
from opentelemetry import trace
from opentelemetry.propagate import inject
from opentelemetry.trace import SpanKind
from opentelemetry.semconv.trace import SpanAttributes
import httpx
from typing import List
from tracing.otel import traced, add_span_attributes, add_span_event

tracer = trace.get_tracer("order-service")

class OrderService:
    def __init__(self, db_session, http_client: httpx.AsyncClient):
        self.db = db_session
        self.http_client = http_client

    @traced("CreateOrder")
    async def create_order(self, user_id: str, items: List[dict]) -> dict:
        """Create order"""
        add_span_attributes(
            user_id=user_id,
            items_count=len(items)
        )

        # 1. Validate user
        add_span_event("Validating user")
        user = await self._validate_user(user_id)

        # 2. Check inventory
        add_span_event("Checking inventory")
        await self._check_inventory(items)

        # 3. Create order record
        add_span_event("Creating order record")
        order = await self._create_order_record(user, items)

        # 4. Process payment
        add_span_event("Processing payment")
        await self._process_payment(order)

        add_span_attributes(
            order_id=order["id"],
            order_total=order["total"]
        )

        return order

    async def _validate_user(self, user_id: str) -> dict:
        """Call user service to validate user"""
        with tracer.start_as_current_span(
            "ValidateUser",
            kind=SpanKind.CLIENT,
            attributes={
                SpanAttributes.HTTP_METHOD: "GET",
                SpanAttributes.NET_PEER_NAME: "user-service",
            }
        ) as span:
            # Inject tracing context into request headers
            headers = {}
            inject(headers)

            response = await self.http_client.get(
                f"http://user-service/users/{user_id}",
                headers=headers
            )

            span.set_attribute(SpanAttributes.HTTP_STATUS_CODE, response.status_code)
            response.raise_for_status()

            return response.json()

    async def _check_inventory(self, items: List[dict]):
        """Check inventory"""
        with tracer.start_as_current_span(
            "CheckInventory",
            kind=SpanKind.CLIENT
        ) as span:
            headers = {}
            inject(headers)

            for item in items:
                span.add_event("Checking item", {"product_id": item["product_id"]})

                response = await self.http_client.get(
                    f"http://inventory-service/products/{item['product_id']}/availability",
                    params={"quantity": item["quantity"]},
                    headers=headers
                )
                response.raise_for_status()

    async def _create_order_record(self, user: dict, items: List[dict]) -> dict:
        """Create order database record"""
        with tracer.start_as_current_span(
            "CreateOrderRecord",
            kind=SpanKind.CLIENT,
            attributes={
                SpanAttributes.DB_SYSTEM: "postgresql",
                SpanAttributes.DB_NAME: "orders",
                SpanAttributes.DB_OPERATION: "INSERT",
            }
        ) as span:
            total = sum(item["price"] * item["quantity"] for item in items)

            # Execute database operation
            query = "INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING id"
            span.set_attribute(SpanAttributes.DB_STATEMENT, query)

            result = await self.db.fetchrow(query, user["id"], total, "pending")

            return {
                "id": str(result["id"]),
                "user_id": user["id"],
                "total": total,
                "status": "pending"
            }

    async def _process_payment(self, order: dict):
        """Process payment"""
        with tracer.start_as_current_span(
            "ProcessPayment",
            kind=SpanKind.CLIENT
        ):
            headers = {}
            inject(headers)

            response = await self.http_client.post(
                "http://payment-service/charge",
                json={
                    "order_id": order["id"],
                    "user_id": order["user_id"],
                    "amount": order["total"]
                },
                headers=headers
            )
            response.raise_for_status()
```

## Jaeger Distributed Tracing System

Jaeger is a distributed tracing system open-sourced by Uber and is now a CNCF graduated project.

### Architecture Components

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                   Jaeger Architecture                     │
                    └─────────────────────────────────────────────────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        │                                     │                                     │
        ▼                                     ▼                                     ▼
┌───────────────┐                   ┌─────────────────┐                   ┌─────────────────┐
│  Application  │                   │   Jaeger Agent  │                   │  Jaeger Collector│
│  (SDK/Client) │───────UDP────────►│   (Local Agent) │───────gRPC────────►│  (Data Collection)│
└───────────────┘                   └─────────────────┘                   └─────────────────┘
                                                                                   │
                                                                                   │
                                                                          ┌────────┴────────┐
                                                                          │                 │
                                                                          ▼                 ▼
                                                                  ┌─────────────┐   ┌─────────────┐
                                                                  │   Storage   │   │  Jaeger Query│
                                                                  │ (Cassandra/ │   │ (Query Service)│
                                                                  │ Elasticsearch)│   └─────────────┘
                                                                  └─────────────┘           │
                                                                                            ▼
                                                                                    ┌─────────────┐
                                                                                    │  Jaeger UI  │
                                                                                    │ (Visualization)│
                                                                                    └─────────────┘
```

### Deployment Configuration

```yaml
# docker-compose-jaeger.yaml
version: '3.8'

services:
  jaeger:
    image: jaegertracing/all-in-one:1.52
    container_name: jaeger
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411
      - COLLECTOR_OTLP_ENABLED=true
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://elasticsearch:9200
      - ES_TAGS_AS_FIELDS_ALL=true
    ports:
      - "6831:6831/udp"   # Jaeger Thrift (UDP)
      - "6832:6832/udp"   # Jaeger Thrift (UDP)
      - "5778:5778"       # Agent config
      - "16686:16686"     # Jaeger UI
      - "4317:4317"       # OTLP gRPC
      - "4318:4318"       # OTLP HTTP
      - "14250:14250"     # gRPC
      - "14268:14268"     # Thrift HTTP
      - "14269:14269"     # Admin
      - "9411:9411"       # Zipkin
    networks:
      - tracing
    depends_on:
      - elasticsearch

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: jaeger-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    volumes:
      - jaeger_es_data:/usr/share/elasticsearch/data
    networks:
      - tracing

volumes:
  jaeger_es_data:

networks:
  tracing:
    driver: bridge
```

### Kubernetes Deployment

```yaml
# jaeger-operator.yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: jaeger-production
  namespace: observability
spec:
  strategy: production

  collector:
    replicas: 3
    resources:
      limits:
        cpu: 1
        memory: 2Gi
      requests:
        cpu: 500m
        memory: 1Gi
    options:
      collector.queue-size: 5000
      collector.num-workers: 50

  query:
    replicas: 2
    resources:
      limits:
        cpu: 500m
        memory: 1Gi
      requests:
        cpu: 200m
        memory: 512Mi
    options:
      query.max-clock-skew-adjustment: 1s

  storage:
    type: elasticsearch
    elasticsearch:
      nodeCount: 3
      resources:
        limits:
          cpu: 2
          memory: 4Gi
        requests:
          cpu: 1
          memory: 2Gi
      storage:
        size: 100Gi
        storageClassName: ssd

  ingress:
    enabled: true
    annotations:
      kubernetes.io/ingress.class: nginx
      cert-manager.io/cluster-issuer: letsencrypt-prod
    hosts:
      - jaeger.example.com
    tls:
      - secretName: jaeger-tls
        hosts:
          - jaeger.example.com
---
# ServiceMonitor for Prometheus
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: jaeger
  namespace: observability
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: jaeger
  endpoints:
    - port: admin
      path: /metrics
      interval: 30s
```

### Sampling Strategy Configuration

```json
// sampling-strategies.json
{
  "service_strategies": [
    {
      "service": "api-gateway",
      "type": "probabilistic",
      "param": 1.0
    },
    {
      "service": "user-service",
      "type": "probabilistic",
      "param": 0.5
    },
    {
      "service": "order-service",
      "type": "ratelimiting",
      "param": 100
    }
  ],
  "default_strategy": {
    "type": "probabilistic",
    "param": 0.1,
    "operation_strategies": [
      {
        "operation": "health-check",
        "type": "probabilistic",
        "param": 0.001
      },
      {
        "operation": "/api/v1/orders",
        "type": "probabilistic",
        "param": 1.0
      }
    ]
  }
}
```

## Zipkin Tracing System

Zipkin is a distributed tracing system open-sourced by Twitter, designed to be simple and easy to use.

### Deployment Configuration

```yaml
# docker-compose-zipkin.yaml
version: '3.8'

services:
  zipkin:
    image: openzipkin/zipkin:2.24
    container_name: zipkin
    environment:
      - STORAGE_TYPE=elasticsearch
      - ES_HOSTS=http://elasticsearch:9200
      - ES_INDEX=zipkin
      - ES_INDEX_REPLICAS=1
      - ES_INDEX_SHARDS=5
      - COLLECTOR_SAMPLE_RATE=0.1
    ports:
      - "9411:9411"
    networks:
      - tracing
    depends_on:
      - elasticsearch

  zipkin-dependencies:
    image: openzipkin/zipkin-dependencies:2.6
    container_name: zipkin-dependencies
    environment:
      - STORAGE_TYPE=elasticsearch
      - ES_HOSTS=http://elasticsearch:9200
    networks:
      - tracing
    depends_on:
      - elasticsearch

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: zipkin-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    volumes:
      - zipkin_es_data:/usr/share/elasticsearch/data
    networks:
      - tracing

volumes:
  zipkin_es_data:

networks:
  tracing:
    driver: bridge
```

### Zipkin Integration with Spring Boot

```yaml
# application.yml
spring:
  application:
    name: order-service

  zipkin:
    base-url: http://zipkin:9411
    enabled: true
    sender:
      type: web

  sleuth:
    sampler:
      probability: 1.0
    propagation:
      type: W3C
    baggage:
      remote-fields:
        - x-request-id
        - x-user-id
      correlation-fields:
        - x-request-id

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  tracing:
    sampling:
      probability: 1.0
```

```java
// ZipkinConfig.java (Spring Boot 3.x)
package com.example.config;

import io.micrometer.tracing.Tracer;
import io.micrometer.tracing.propagation.Propagator;
import io.zipkin2.reporter.AsyncReporter;
import io.zipkin2.reporter.brave.ZipkinSpanHandler;
import io.zipkin2.reporter.urlconnection.URLConnectionSender;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import brave.Tracing;
import brave.sampler.Sampler;

@Configuration
public class ZipkinConfig {

    @Value("${spring.zipkin.base-url}")
    private String zipkinBaseUrl;

    @Value("${spring.application.name}")
    private String serviceName;

    @Bean
    public Tracing tracing() {
        var sender = URLConnectionSender.create(zipkinBaseUrl + "/api/v2/spans");
        var reporter = AsyncReporter.create(sender);
        var zipkinSpanHandler = ZipkinSpanHandler.create(reporter);

        return Tracing.newBuilder()
            .localServiceName(serviceName)
            .addSpanHandler(zipkinSpanHandler)
            .sampler(Sampler.ALWAYS_SAMPLE)
            .build();
    }
}
```

## Best Practices

### Span Naming Conventions

```go
// Good naming - specific and meaningful
tracer.Start(ctx, "OrderService.CreateOrder")
tracer.Start(ctx, "HTTP GET /api/users/{id}")
tracer.Start(ctx, "PostgreSQL INSERT orders")
tracer.Start(ctx, "Redis GET user:session:{id}")

// Bad naming - too generic
tracer.Start(ctx, "process")
tracer.Start(ctx, "db query")
tracer.Start(ctx, "http call")
```

### Setting Tags Appropriately

```go
// Recommended tag settings
span.SetAttributes(
    // Business tags
    attribute.String("order.id", orderID),
    attribute.String("user.id", userID),
    attribute.Float64("order.total", total),

    // Technical tags
    attribute.String("db.system", "postgresql"),
    attribute.String("db.name", "orders"),
    attribute.String("db.operation", "SELECT"),

    // Environment tags
    attribute.String("deployment.environment", "production"),
    attribute.String("service.version", "1.2.3"),
)

// Avoid high-cardinality tags
// Do not use: request_id, timestamp, random_value as tags
```

### Sampling Strategies

```yaml
# Production environment sampling strategy recommendations
sampling:
  # Default sampling rate - for high-traffic services
  default_rate: 0.01  # 1%

  # Error requests - 100% sampling
  error_rate: 1.0

  # Slow requests - 100% sampling (above threshold)
  slow_threshold_ms: 1000
  slow_rate: 1.0

  # Critical paths - higher sampling rate
  critical_paths:
    - path: "/api/v1/orders"
      rate: 0.1  # 10%
    - path: "/api/v1/payments"
      rate: 0.5  # 50%

  # Health checks - very low sampling rate
  health_check_rate: 0.001  # 0.1%
```

### Context Propagation

```go
// HTTP client - inject context
func (c *Client) Do(ctx context.Context, req *http.Request) (*http.Response, error) {
    // Inject tracing context into request headers
    otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(req.Header))

    return c.httpClient.Do(req.WithContext(ctx))
}

// gRPC client - use interceptors
import "go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"

conn, err := grpc.Dial(
    address,
    grpc.WithUnaryInterceptor(otelgrpc.UnaryClientInterceptor()),
    grpc.WithStreamInterceptor(otelgrpc.StreamClientInterceptor()),
)

// Message queue - manual propagation
func (p *Producer) Publish(ctx context.Context, msg *Message) error {
    carrier := make(map[string]string)
    otel.GetTextMapPropagator().Inject(ctx, propagation.MapCarrier(carrier))

    msg.Headers = carrier
    return p.kafka.Produce(msg)
}

func (c *Consumer) Consume(msg *Message) {
    carrier := propagation.MapCarrier(msg.Headers)
    ctx := otel.GetTextMapPropagator().Extract(context.Background(), carrier)

    // Continue tracing with extracted context
    ctx, span := tracer.Start(ctx, "ProcessMessage")
    defer span.End()
}
```

### Error Handling

```go
// Correct error handling approach
func (s *Service) ProcessOrder(ctx context.Context, order *Order) error {
    ctx, span := tracer.Start(ctx, "ProcessOrder")
    defer span.End()

    if err := s.validateOrder(ctx, order); err != nil {
        // Record error details
        span.RecordError(err, trace.WithAttributes(
            attribute.String("error.type", "validation"),
            attribute.String("order.id", order.ID),
        ))
        span.SetStatus(codes.Error, "order validation failed")
        return fmt.Errorf("validation failed: %w", err)
    }

    if err := s.saveOrder(ctx, order); err != nil {
        span.RecordError(err, trace.WithAttributes(
            attribute.String("error.type", "database"),
        ))
        span.SetStatus(codes.Error, "database operation failed")
        return fmt.Errorf("save order failed: %w", err)
    }

    span.SetStatus(codes.Ok, "order processed successfully")
    return nil
}
```

### Performance Optimization

```yaml
# OTel Collector performance optimization configuration
processors:
  batch:
    # Batch processing optimization
    timeout: 1s
    send_batch_size: 2048
    send_batch_max_size: 4096

  memory_limiter:
    # Memory limits to prevent OOM
    check_interval: 1s
    limit_mib: 4096
    spike_limit_mib: 1024

  filter:
    # Filter unnecessary Spans
    spans:
      exclude:
        match_type: regexp
        span_names:
          - "health.*"
          - "metrics.*"
          - "readiness.*"
        attributes:
          - key: http.target
            value: "/(health|ready|live)"

exporters:
  otlp:
    # Export optimization
    sending_queue:
      enabled: true
      num_consumers: 10
      queue_size: 10000

    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
      max_elapsed_time: 300s

    compression: gzip
```

## Three Pillars of Observability Integration

### Correlating Traces + Metrics + Logs

```go
// Unified observability configuration
package observability

import (
    "context"
    "log/slog"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/metric"
    "go.opentelemetry.io/otel/trace"
)

type ObservabilityContext struct {
    tracer  trace.Tracer
    meter   metric.Meter
    logger  *slog.Logger
}

func NewObservabilityContext(serviceName string) *ObservabilityContext {
    return &ObservabilityContext{
        tracer: otel.Tracer(serviceName),
        meter:  otel.Meter(serviceName),
        logger: slog.Default(),
    }
}

// StartOperation creates an operation with complete observability
func (o *ObservabilityContext) StartOperation(ctx context.Context, name string) (context.Context, *Operation) {
    ctx, span := o.tracer.Start(ctx, name)

    // Create logger with trace context
    traceID := span.SpanContext().TraceID().String()
    spanID := span.SpanContext().SpanID().String()

    logger := o.logger.With(
        slog.String("trace_id", traceID),
        slog.String("span_id", spanID),
        slog.String("operation", name),
    )

    return ctx, &Operation{
        span:   span,
        logger: logger,
        meter:  o.meter,
        name:   name,
    }
}

type Operation struct {
    span   trace.Span
    logger *slog.Logger
    meter  metric.Meter
    name   string
}

func (op *Operation) End() {
    op.span.End()
}

func (op *Operation) Info(msg string, attrs ...any) {
    op.logger.Info(msg, attrs...)
    op.span.AddEvent(msg)
}

func (op *Operation) Error(err error, msg string, attrs ...any) {
    op.logger.Error(msg, append(attrs, slog.Any("error", err))...)
    op.span.RecordError(err)
    op.span.SetStatus(codes.Error, msg)
}

func (op *Operation) SetAttribute(key string, value any) {
    op.span.SetAttributes(attribute.String(key, fmt.Sprint(value)))
}

func (op *Operation) RecordDuration(duration time.Duration) {
    histogram, _ := op.meter.Float64Histogram(
        op.name + ".duration",
        metric.WithUnit("ms"),
    )
    histogram.Record(context.Background(), float64(duration.Milliseconds()))
}
```

### Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Distributed Tracing Overview",
    "panels": [
      {
        "title": "Trace Duration (P99)",
        "type": "timeseries",
        "datasource": "Tempo",
        "targets": [
          {
            "query": "histogram_quantile(0.99, sum(rate(traces_spanmetrics_latency_bucket[5m])) by (le, service))"
          }
        ]
      },
      {
        "title": "Error Rate by Service",
        "type": "timeseries",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum(rate(traces_spanmetrics_calls_total{status_code=\"STATUS_CODE_ERROR\"}[5m])) by (service) / sum(rate(traces_spanmetrics_calls_total[5m])) by (service) * 100"
          }
        ]
      },
      {
        "title": "Service Dependency Graph",
        "type": "nodeGraph",
        "datasource": "Tempo",
        "targets": [
          {
            "queryType": "serviceMap"
          }
        ]
      },
      {
        "title": "Recent Traces",
        "type": "traces",
        "datasource": "Tempo",
        "targets": [
          {
            "query": "{service.name=\"order-service\"} | status = error"
          }
        ]
      }
    ]
  }
}
```

## Troubleshooting

### Common Problem Diagnostics

```bash
#!/bin/bash
# tracing-diagnostics.sh

echo "=== Check OTel Collector Status ==="
curl -s http://localhost:13133/health | jq .

echo -e "\n=== Check Collector Metrics ==="
curl -s http://localhost:8888/metrics | grep -E "(otelcol_receiver|otelcol_processor|otelcol_exporter)"

echo -e "\n=== Check Jaeger Health Status ==="
curl -s http://localhost:14269/health

echo -e "\n=== Check Recent Traces ==="
curl -s "http://localhost:16686/api/traces?service=order-service&limit=5" | jq '.data[0].traceID'

echo -e "\n=== Check Service Dependencies ==="
curl -s http://localhost:16686/api/dependencies?endTs=$(date +%s)000 | jq .

echo -e "\n=== Check Span Statistics ==="
curl -s "http://localhost:16686/api/services/order-service/operations" | jq .
```

### Debugging Tips

```go
// Add debug attributes
span.SetAttributes(
    attribute.String("debug.goroutine_id", fmt.Sprint(runtime.GoID())),
    attribute.Int("debug.memory_alloc", int(memStats.Alloc)),
    attribute.String("debug.stack_trace", string(debug.Stack())),
)

// Conditional detailed tracing
if os.Getenv("OTEL_DEBUG") == "true" {
    span.SetAttributes(
        attribute.String("debug.request_body", string(requestBody)),
        attribute.String("debug.response_body", string(responseBody)),
    )
}
```

## Interview Key Points

### Core Concepts

**Q1: What is distributed tracing? Why do we need it?**

```
A: Distributed tracing is a monitoring technology used to track the complete path of requests in distributed systems.

Why we need it:
1. Visualize request flow - understand which services a request passes through
2. Performance analysis - identify latency bottlenecks
3. Fault location - quickly locate problematic services
4. Dependency analysis - understand service call relationships
5. Capacity planning - optimize resources based on real traffic

Core concepts:
- Trace: A complete call chain for a single request
- Span: An operation unit within the call chain
- Context Propagation: Passing trace information across services
```

**Q2: What is the relationship between Trace, Span, and SpanContext?**

```
A: The relationship between the three:

Trace:
- Represents a complete request chain
- Identified by a unique Trace ID
- Contains multiple Spans

Span:
- Basic unit of work in a Trace
- Represents a specific operation (HTTP call, DB query, etc.)
- Contains: operation name, start time, duration, tags, logs
- Spans form a tree structure through Parent Span ID

SpanContext:
- The immutable part of a Span
- Contains: Trace ID, Span ID, sampling flags
- Used to propagate trace information across services

Relationship diagram:
Trace (ID: abc123)
├── Span A (Parent: null, ID: span1)
│   ├── Span B (Parent: span1, ID: span2)
│   └── Span C (Parent: span1, ID: span3)
│       └── Span D (Parent: span3, ID: span4)
```

**Q3: What is the relationship between OpenTelemetry and Jaeger/Zipkin?**

```
A: OpenTelemetry is the standard, Jaeger/Zipkin are backend implementations.

OpenTelemetry:
- CNCF project providing unified observability standards
- Provides API, SDK, Collector
- Supports Traces, Metrics, Logs
- Vendor-neutral, can export to any backend

Jaeger:
- Distributed tracing system open-sourced by Uber
- Complete tracing backend (collection, storage, query, UI)
- Supports multiple storage backends
- Native OpenTelemetry support

Zipkin:
- Tracing system open-sourced by Twitter
- Simple and easy-to-use tracing backend
- Lightweight design
- OpenTelemetry compatible

Typical architecture:
Application → OTel SDK → OTel Collector → Jaeger/Zipkin → Visualization
```

### Practical Questions

**Q4: How to design a sampling strategy?**

```
A: Sampling strategy design principles:

1. Traffic-based sampling:
   - High-traffic services: low sampling rate (1-5%)
   - Low-traffic services: high sampling rate (50-100%)

2. Importance-based sampling:
   - Critical business paths: 100%
   - Health checks: 0.1%
   - Background tasks: 10%

3. Exception-based sampling:
   - Error requests: 100%
   - Slow requests (>1s): 100%
   - Successful requests: base sampling rate

4. Sampler types:
   - AlwaysOn/AlwaysOff: dev/test environments
   - TraceIdRatio: proportional sampling
   - ParentBased: inherit parent Span decision
   - RateLimiting: limit samples per second

Best practices:
- Use Tail Sampling (in Collector)
- Ensure sampling decision consistency
- Dynamically adjust sampling rate
```

**Q5: How to handle cross-service context propagation?**

```
A: Context propagation solutions:

HTTP:
- W3C Trace Context (traceparent, tracestate)
- B3 Header (X-B3-TraceId, X-B3-SpanId)

gRPC:
- Metadata propagation
- Use interceptors for automatic handling

Message Queue:
- Carry in message headers/attributes
- Manual injection and extraction

Propagation format comparison:
| Format | Header Example |
|--------|---------------|
| W3C    | traceparent: 00-abc123-span1-01 |
| B3     | X-B3-TraceId: abc123 |
| Jaeger | uber-trace-id: abc123:span1:0:1 |

Implementation points:
1. Unify propagation format
2. Use SDK for automatic handling
3. Pay attention to context preservation in async operations
4. Regularly verify propagation integrity
```

## Further Reading

### Official Resources

- [OpenTelemetry Official Documentation](https://opentelemetry.io/docs/)
- [Jaeger Official Documentation](https://www.jaegertracing.io/docs/)
- [Zipkin Official Documentation](https://zipkin.io/)

### Recommended Books

- "Distributed Tracing in Practice" - Austin Parker
- "Observability Engineering" - Charity Majors

### Related Tools

| Tool | Purpose | Link |
|------|---------|------|
| Grafana Tempo | Tracing Backend | https://grafana.com/oss/tempo |
| Lightstep | Commercial Tracing Platform | https://lightstep.com |
| Honeycomb | Observability Platform | https://honeycomb.io |
| SigNoz | Open Source APM | https://signoz.io |

---

By now, you should have mastered the core concepts of distributed tracing, the OpenTelemetry ecosystem, deployment configurations for Jaeger and Zipkin, and implementation approaches in various programming languages. In practical applications, it's recommended to start with small-scale pilots and gradually expand to the entire microservice architecture to build a comprehensive observability system.
