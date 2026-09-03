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
origin: old/src/content/docs/devops/tracing.zh.md
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

## 概念解释

分布式链路追踪（Distributed Tracing）是一种用于监控和分析分布式系统中请求流转路径的技术。在微服务架构中，一个用户请求可能需要经过多个服务的协作才能完成，链路追踪能够将这些分散的调用串联起来，形成完整的调用链视图。

### 为什么需要链路追踪

在传统的单体应用中，所有的业务逻辑都在同一个进程中执行，问题排查相对简单。但在微服务架构中：

- **服务调用复杂**：一个请求可能涉及数十个服务的调用
- **问题定位困难**：当出现性能问题或错误时，难以确定是哪个服务导致
- **依赖关系模糊**：服务之间的调用关系难以可视化
- **性能瓶颈隐蔽**：跨服务的延迟问题难以发现

### 核心概念

#### Trace（追踪）

Trace 代表一个完整的请求链路，从用户发起请求到最终返回响应的整个过程。每个 Trace 由一个全局唯一的 Trace ID 标识。

```
Trace ID: abc123def456
├── Service A (入口网关)
│   ├── Service B (用户服务)
│   │   └── Database Query
│   └── Service C (订单服务)
│       ├── Service D (库存服务)
│       └── Service E (支付服务)
```

#### Span（跨度）

Span 是 Trace 中的基本工作单元，代表一次具体的操作或调用。每个 Span 包含：

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

#### Context Propagation（上下文传播）

上下文传播是链路追踪的核心机制，它确保 Trace ID 和 Span ID 能够在服务间传递：

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

## OpenTelemetry 生态系统

OpenTelemetry（简称 OTel）是 CNCF 的一个开源项目，它提供了统一的 API、SDK 和工具集，用于生成、收集和导出遥测数据（追踪、指标、日志）。

### 架构概览

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                   OpenTelemetry 架构                      │
                    └─────────────────────────────────────────────────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        │                                     │                                     │
        ▼                                     ▼                                     ▼
┌───────────────┐                   ┌─────────────────┐                   ┌─────────────────┐
│  Application  │                   │   OTel SDK      │                   │  OTel Collector │
│  Instrumentation│◄─────────────────│  (语言特定)     │──────────────────►│   (数据管道)    │
└───────────────┘                   └─────────────────┘                   └─────────────────┘
        │                                     │                                     │
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

### OTel Collector 配置

OpenTelemetry Collector 是一个高性能的数据收集和处理组件：

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

### Go 语言集成

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

// Config 包含追踪配置
type Config struct {
    ServiceName    string
    ServiceVersion string
    Environment    string
    CollectorURL   string
    SampleRate     float64
}

// InitTracer 初始化 OpenTelemetry 追踪
func InitTracer(cfg Config) (func(context.Context) error, error) {
    ctx := context.Background()

    // 创建 OTLP 导出器
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

    // 创建资源信息
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

    // 创建采样器
    sampler := sdktrace.ParentBased(
        sdktrace.TraceIDRatioBased(cfg.SampleRate),
    )

    // 创建 TracerProvider
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter,
            sdktrace.WithMaxExportBatchSize(512),
            sdktrace.WithBatchTimeout(5*time.Second),
        ),
        sdktrace.WithResource(res),
        sdktrace.WithSampler(sampler),
    )

    // 设置全局 TracerProvider 和 Propagator
    otel.SetTracerProvider(tp)
    otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
        propagation.TraceContext{},
        propagation.Baggage{},
    ))

    return tp.Shutdown, nil
}

// StartSpan 创建一个新的 Span
func StartSpan(ctx context.Context, name string, opts ...trace.SpanStartOption) (context.Context, trace.Span) {
    tracer := otel.Tracer("application")
    return tracer.Start(ctx, name, opts...)
}

// AddEvent 向当前 Span 添加事件
func AddEvent(ctx context.Context, name string, attrs ...attribute.KeyValue) {
    span := trace.SpanFromContext(ctx)
    span.AddEvent(name, trace.WithAttributes(attrs...))
}

// SetError 记录错误到当前 Span
func SetError(ctx context.Context, err error) {
    span := trace.SpanFromContext(ctx)
    span.RecordError(err)
}

// SetAttributes 设置 Span 属性
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

// TracingMiddleware 创建 HTTP 追踪中间件
func TracingMiddleware(next http.Handler) http.Handler {
    return otelhttp.NewHandler(next, "http-server",
        otelhttp.WithSpanNameFormatter(func(operation string, r *http.Request) string {
            return r.Method + " " + r.URL.Path
        }),
    )
}

// CustomTracingMiddleware 自定义追踪中间件
func CustomTracingMiddleware(serviceName string) func(http.Handler) http.Handler {
    tracer := otel.Tracer(serviceName)

    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // 从请求头提取上下文
            ctx := otel.GetTextMapPropagator().Extract(r.Context(), propagation.HeaderCarrier(r.Header))

            // 创建 Span
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

            // 使用自定义 ResponseWriter 捕获状态码
            rw := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
            next.ServeHTTP(rw, r.WithContext(ctx))

            // 记录响应状态码
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
// service/order.go - 业务服务示例
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

// CreateOrder 创建订单
func (s *OrderService) CreateOrder(ctx context.Context, req CreateOrderRequest) (*Order, error) {
    ctx, span := s.tracer.Start(ctx, "CreateOrder",
        trace.WithAttributes(
            attribute.String("order.user_id", req.UserID),
            attribute.Int("order.items_count", len(req.Items)),
        ),
    )
    defer span.End()

    // 1. 验证用户
    span.AddEvent("validating user")
    user, err := s.validateUser(ctx, req.UserID)
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "user validation failed")
        return nil, err
    }

    // 2. 检查库存
    span.AddEvent("checking inventory")
    if err := s.checkInventory(ctx, req.Items); err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "inventory check failed")
        return nil, err
    }

    // 3. 创建订单记录
    span.AddEvent("creating order record")
    order, err := s.createOrderRecord(ctx, user, req)
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "order creation failed")
        return nil, err
    }

    // 4. 处理支付
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

// validateUser 验证用户（调用用户服务）
func (s *OrderService) validateUser(ctx context.Context, userID string) (*User, error) {
    ctx, span := s.tracer.Start(ctx, "validateUser",
        trace.WithSpanKind(trace.SpanKindClient),
    )
    defer span.End()

    // 创建请求
    req, err := http.NewRequestWithContext(ctx, "GET", "http://user-service/users/"+userID, nil)
    if err != nil {
        return nil, err
    }

    // 注入追踪上下文到请求头
    otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(req.Header))

    // 设置 HTTP 相关属性
    span.SetAttributes(
        semconv.HTTPMethod("GET"),
        semconv.HTTPURL(req.URL.String()),
        semconv.NetPeerName("user-service"),
    )

    // 执行请求
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

// createOrderRecord 数据库操作示例
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

### Java 语言集成

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
        // 创建资源
        Resource resource = Resource.getDefault()
            .merge(Resource.create(Attributes.builder()
                .put(ResourceAttributes.SERVICE_NAME, serviceName)
                .put(ResourceAttributes.SERVICE_VERSION, serviceVersion)
                .put(ResourceAttributes.DEPLOYMENT_ENVIRONMENT, "production")
                .build()));

        // 创建 OTLP 导出器
        OtlpGrpcSpanExporter spanExporter = OtlpGrpcSpanExporter.builder()
            .setEndpoint(otlpEndpoint)
            .setTimeout(30, TimeUnit.SECONDS)
            .build();

        // 创建采样器
        Sampler sampler = Sampler.parentBased(
            Sampler.traceIdRatioBased(samplerProbability)
        );

        // 创建 TracerProvider
        SdkTracerProvider tracerProvider = SdkTracerProvider.builder()
            .addSpanProcessor(BatchSpanProcessor.builder(spanExporter)
                .setMaxExportBatchSize(512)
                .setScheduleDelay(5, TimeUnit.SECONDS)
                .build())
            .setResource(resource)
            .setSampler(sampler)
            .build();

        // 构建 OpenTelemetry 实例
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
        // 从请求头提取上下文
        Context extractedContext = GlobalOpenTelemetry.getPropagators()
            .getTextMapPropagator()
            .extract(Context.current(), request, GETTER);

        // 创建服务端 Span
        Span span = tracer.spanBuilder(request.getMethod() + " " + request.getRequestURI())
            .setParent(extractedContext)
            .setSpanKind(SpanKind.SERVER)
            .setAttribute(SemanticAttributes.HTTP_METHOD, request.getMethod())
            .setAttribute(SemanticAttributes.HTTP_URL, request.getRequestURL().toString())
            .setAttribute(SemanticAttributes.HTTP_SCHEME, request.getScheme())
            .setAttribute(SemanticAttributes.NET_HOST_NAME, request.getServerName())
            .setAttribute(SemanticAttributes.HTTP_USER_AGENT, request.getHeader("User-Agent"))
            .startSpan();

        // 将 Span 存储到请求属性中
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
            // 1. 验证用户
            currentSpan.addEvent("Validating user");
            User user = validateUser(userId);

            // 2. 检查库存
            currentSpan.addEvent("Checking inventory");
            checkInventory(request.getItems());

            // 3. 创建订单
            currentSpan.addEvent("Creating order record");
            Order order = createOrderRecord(user, request);

            // 4. 处理支付
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

### Python 语言集成

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
    """初始化 OpenTelemetry 追踪器"""

    # 创建资源
    resource = Resource.create({
        SERVICE_NAME: config.service_name,
        SERVICE_VERSION: config.service_version,
        "deployment.environment": os.getenv("ENVIRONMENT", "production"),
    })

    # 创建采样器
    sampler = ParentBasedTraceIdRatio(config.sample_rate)

    # 创建 TracerProvider
    provider = TracerProvider(
        resource=resource,
        sampler=sampler
    )

    # 创建 OTLP 导出器
    exporter = OTLPSpanExporter(
        endpoint=config.otlp_endpoint,
        insecure=True
    )

    # 添加批处理器
    provider.add_span_processor(
        BatchSpanProcessor(
            exporter,
            max_export_batch_size=512,
            schedule_delay_millis=5000
        )
    )

    # 设置全局 TracerProvider
    trace.set_tracer_provider(provider)

    # 设置上下文传播器
    set_global_textmap(CompositePropagator([
        TraceContextTextMapPropagator(),
        W3CBaggagePropagator()
    ]))

    return trace.get_tracer(config.service_name)


def traced(name: str = None, kind: trace.SpanKind = trace.SpanKind.INTERNAL):
    """追踪装饰器"""
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
    """添加属性到当前 Span"""
    span = trace.get_current_span()
    span.set_attributes(attrs)


def add_span_event(name: str, attributes: dict = None):
    """添加事件到当前 Span"""
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
    """FastAPI/Starlette 追踪中间件"""

    def __init__(self, app, service_name: str):
        super().__init__(app)
        self.tracer = trace.get_tracer(service_name)

    async def dispatch(self, request: Request, call_next) -> Response:
        # 从请求头提取上下文
        context = extract(request.headers)

        # 创建 Span
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

                # 记录响应信息
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
        """创建订单"""
        add_span_attributes(
            user_id=user_id,
            items_count=len(items)
        )

        # 1. 验证用户
        add_span_event("Validating user")
        user = await self._validate_user(user_id)

        # 2. 检查库存
        add_span_event("Checking inventory")
        await self._check_inventory(items)

        # 3. 创建订单记录
        add_span_event("Creating order record")
        order = await self._create_order_record(user, items)

        # 4. 处理支付
        add_span_event("Processing payment")
        await self._process_payment(order)

        add_span_attributes(
            order_id=order["id"],
            order_total=order["total"]
        )

        return order

    async def _validate_user(self, user_id: str) -> dict:
        """调用用户服务验证用户"""
        with tracer.start_as_current_span(
            "ValidateUser",
            kind=SpanKind.CLIENT,
            attributes={
                SpanAttributes.HTTP_METHOD: "GET",
                SpanAttributes.NET_PEER_NAME: "user-service",
            }
        ) as span:
            # 注入追踪上下文到请求头
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
        """检查库存"""
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
        """创建订单数据库记录"""
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

            # 执行数据库操作
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
        """处理支付"""
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

## Jaeger 分布式追踪系统

Jaeger 是 Uber 开源的分布式追踪系统，现已成为 CNCF 毕业项目。

### 架构组件

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                   Jaeger 架构                            │
                    └─────────────────────────────────────────────────────────┘
                                              │
        ┌─────────────────────────────────────┼─────────────────────────────────────┐
        │                                     │                                     │
        ▼                                     ▼                                     ▼
┌───────────────┐                   ┌─────────────────┐                   ┌─────────────────┐
│  Application  │                   │   Jaeger Agent  │                   │  Jaeger Collector│
│  (SDK/Client) │───────UDP────────►│   (本地代理)    │───────gRPC────────►│   (数据收集)     │
└───────────────┘                   └─────────────────┘                   └─────────────────┘
                                                                                   │
                                                                                   │
                                                                          ┌────────┴────────┐
                                                                          │                 │
                                                                          ▼                 ▼
                                                                  ┌─────────────┐   ┌─────────────┐
                                                                  │   Storage   │   │  Jaeger Query│
                                                                  │ (Cassandra/ │   │   (查询服务) │
                                                                  │ Elasticsearch)│   └─────────────┘
                                                                  └─────────────┘           │
                                                                                            ▼
                                                                                    ┌─────────────┐
                                                                                    │  Jaeger UI  │
                                                                                    │  (可视化界面) │
                                                                                    └─────────────┘
```

### 部署配置

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

### Kubernetes 部署

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

### 采样策略配置

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

## Zipkin 追踪系统

Zipkin 是 Twitter 开源的分布式追踪系统，设计简洁易用。

### 部署配置

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

### Zipkin 与 Spring Boot 集成

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

## 最佳实践

### Span 命名规范

```go
// 好的命名 - 具体且有意义
tracer.Start(ctx, "OrderService.CreateOrder")
tracer.Start(ctx, "HTTP GET /api/users/{id}")
tracer.Start(ctx, "PostgreSQL INSERT orders")
tracer.Start(ctx, "Redis GET user:session:{id}")

// 不好的命名 - 太笼统
tracer.Start(ctx, "process")
tracer.Start(ctx, "db query")
tracer.Start(ctx, "http call")
```

### 合理设置标签

```go
// 推荐的标签设置
span.SetAttributes(
    // 业务标签
    attribute.String("order.id", orderID),
    attribute.String("user.id", userID),
    attribute.Float64("order.total", total),

    // 技术标签
    attribute.String("db.system", "postgresql"),
    attribute.String("db.name", "orders"),
    attribute.String("db.operation", "SELECT"),

    // 环境标签
    attribute.String("deployment.environment", "production"),
    attribute.String("service.version", "1.2.3"),
)

// 避免高基数标签
// 不要使用：request_id, timestamp, random_value 等作为标签
```

### 采样策略

```yaml
# 生产环境采样策略建议
sampling:
  # 默认采样率 - 适用于高流量服务
  default_rate: 0.01  # 1%

  # 错误请求 - 100% 采样
  error_rate: 1.0

  # 慢请求 - 100% 采样（超过阈值）
  slow_threshold_ms: 1000
  slow_rate: 1.0

  # 关键路径 - 更高的采样率
  critical_paths:
    - path: "/api/v1/orders"
      rate: 0.1  # 10%
    - path: "/api/v1/payments"
      rate: 0.5  # 50%

  # 健康检查 - 极低采样率
  health_check_rate: 0.001  # 0.1%
```

### 上下文传播

```go
// HTTP 客户端 - 注入上下文
func (c *Client) Do(ctx context.Context, req *http.Request) (*http.Response, error) {
    // 注入追踪上下文到请求头
    otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(req.Header))

    return c.httpClient.Do(req.WithContext(ctx))
}

// gRPC 客户端 - 使用拦截器
import "go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"

conn, err := grpc.Dial(
    address,
    grpc.WithUnaryInterceptor(otelgrpc.UnaryClientInterceptor()),
    grpc.WithStreamInterceptor(otelgrpc.StreamClientInterceptor()),
)

// 消息队列 - 手动传播
func (p *Producer) Publish(ctx context.Context, msg *Message) error {
    carrier := make(map[string]string)
    otel.GetTextMapPropagator().Inject(ctx, propagation.MapCarrier(carrier))

    msg.Headers = carrier
    return p.kafka.Produce(msg)
}

func (c *Consumer) Consume(msg *Message) {
    carrier := propagation.MapCarrier(msg.Headers)
    ctx := otel.GetTextMapPropagator().Extract(context.Background(), carrier)

    // 使用提取的上下文继续追踪
    ctx, span := tracer.Start(ctx, "ProcessMessage")
    defer span.End()
}
```

### 错误处理

```go
// 正确的错误处理方式
func (s *Service) ProcessOrder(ctx context.Context, order *Order) error {
    ctx, span := tracer.Start(ctx, "ProcessOrder")
    defer span.End()

    if err := s.validateOrder(ctx, order); err != nil {
        // 记录错误详情
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

### 性能优化

```yaml
# OTel Collector 性能优化配置
processors:
  batch:
    # 批量处理优化
    timeout: 1s
    send_batch_size: 2048
    send_batch_max_size: 4096

  memory_limiter:
    # 内存限制防止 OOM
    check_interval: 1s
    limit_mib: 4096
    spike_limit_mib: 1024

  filter:
    # 过滤不需要的 Span
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
    # 导出优化
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

## 可观测性三支柱集成

### Traces + Metrics + Logs 关联

```go
// 统一的可观测性配置
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

// StartOperation 创建一个带有完整可观测性的操作
func (o *ObservabilityContext) StartOperation(ctx context.Context, name string) (context.Context, *Operation) {
    ctx, span := o.tracer.Start(ctx, name)

    // 创建带有 trace 上下文的 logger
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

### Grafana 仪表板配置

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

## 故障排查

### 常见问题诊断

```bash
#!/bin/bash
# tracing-diagnostics.sh

echo "=== 检查 OTel Collector 状态 ==="
curl -s http://localhost:13133/health | jq .

echo -e "\n=== 检查 Collector 指标 ==="
curl -s http://localhost:8888/metrics | grep -E "(otelcol_receiver|otelcol_processor|otelcol_exporter)"

echo -e "\n=== 检查 Jaeger 健康状态 ==="
curl -s http://localhost:14269/health

echo -e "\n=== 检查最近的 Trace ==="
curl -s "http://localhost:16686/api/traces?service=order-service&limit=5" | jq '.data[0].traceID'

echo -e "\n=== 检查服务依赖 ==="
curl -s http://localhost:16686/api/dependencies?endTs=$(date +%s)000 | jq .

echo -e "\n=== 检查 Span 统计 ==="
curl -s "http://localhost:16686/api/services/order-service/operations" | jq .
```

### 调试技巧

```go
// 添加调试属性
span.SetAttributes(
    attribute.String("debug.goroutine_id", fmt.Sprint(runtime.GoID())),
    attribute.Int("debug.memory_alloc", int(memStats.Alloc)),
    attribute.String("debug.stack_trace", string(debug.Stack())),
)

// 条件性详细追踪
if os.Getenv("OTEL_DEBUG") == "true" {
    span.SetAttributes(
        attribute.String("debug.request_body", string(requestBody)),
        attribute.String("debug.response_body", string(responseBody)),
    )
}
```

## 面试要点

### 核心概念

**Q1: 什么是分布式链路追踪？为什么需要它？**

```
A: 分布式链路追踪是一种监控技术，用于跟踪请求在分布式系统中的完整路径。

为什么需要：
1. 可视化请求流程 - 了解请求经过哪些服务
2. 性能分析 - 识别延迟瓶颈
3. 故障定位 - 快速定位问题服务
4. 依赖分析 - 理解服务间调用关系
5. 容量规划 - 基于真实流量优化资源

核心概念：
- Trace: 一次完整请求的调用链
- Span: 调用链中的一个操作单元
- Context Propagation: 跨服务传递追踪信息
```

**Q2: Trace、Span 和 SpanContext 的关系是什么？**

```
A: 三者的关系：

Trace（追踪）：
- 代表一个完整的请求链路
- 由唯一的 Trace ID 标识
- 包含多个 Span

Span（跨度）：
- Trace 中的基本工作单元
- 代表一次具体操作（HTTP 调用、DB 查询等）
- 包含：操作名、开始时间、持续时间、标签、日志
- Span 之间通过 Parent Span ID 形成树状结构

SpanContext（跨度上下文）：
- Span 的不可变部分
- 包含：Trace ID、Span ID、采样标志
- 用于跨服务传播追踪信息

关系图：
Trace (ID: abc123)
├── Span A (Parent: null, ID: span1)
│   ├── Span B (Parent: span1, ID: span2)
│   └── Span C (Parent: span1, ID: span3)
│       └── Span D (Parent: span3, ID: span4)
```

**Q3: OpenTelemetry 和 Jaeger/Zipkin 的关系是什么？**

```
A: OpenTelemetry 是标准，Jaeger/Zipkin 是后端实现。

OpenTelemetry：
- CNCF 项目，提供统一的可观测性标准
- 提供 API、SDK、Collector
- 支持 Traces、Metrics、Logs
- 供应商中立，可导出到任意后端

Jaeger：
- Uber 开源的分布式追踪系统
- 完整的追踪后端（收集、存储、查询、UI）
- 支持多种存储后端
- 原生支持 OpenTelemetry

Zipkin：
- Twitter 开源的追踪系统
- 简单易用的追踪后端
- 轻量级设计
- 兼容 OpenTelemetry

典型架构：
应用 → OTel SDK → OTel Collector → Jaeger/Zipkin → 可视化
```

### 实践问题

**Q4: 如何设计采样策略？**

```
A: 采样策略设计原则：

1. 基于流量的采样：
   - 高流量服务：低采样率（1-5%）
   - 低流量服务：高采样率（50-100%）

2. 基于重要性的采样：
   - 关键业务路径：100%
   - 健康检查：0.1%
   - 后台任务：10%

3. 基于异常的采样：
   - 错误请求：100%
   - 慢请求（>1s）：100%
   - 成功请求：基础采样率

4. 采样器类型：
   - AlwaysOn/AlwaysOff：开发/测试环境
   - TraceIdRatio：按比例采样
   - ParentBased：继承父 Span 决策
   - RateLimiting：限制每秒采样数量

最佳实践：
- 使用 Tail Sampling（在 Collector）
- 保证采样决策一致性
- 动态调整采样率
```

**Q5: 如何处理跨服务的上下文传播？**

```
A: 上下文传播方案：

HTTP：
- W3C Trace Context（traceparent, tracestate）
- B3 Header（X-B3-TraceId, X-B3-SpanId）

gRPC：
- Metadata 传递
- 使用拦截器自动处理

消息队列：
- 消息头/属性中携带
- 手动注入和提取

传播格式对比：
| 格式 | Header 示例 |
|------|------------|
| W3C  | traceparent: 00-abc123-span1-01 |
| B3   | X-B3-TraceId: abc123 |
| Jaeger | uber-trace-id: abc123:span1:0:1 |

实现要点：
1. 统一传播格式
2. 使用 SDK 自动处理
3. 异步操作注意上下文保持
4. 定期验证传播完整性
```

## 延伸阅读

### 官方资源

- [OpenTelemetry 官方文档](https://opentelemetry.io/docs/)
- [Jaeger 官方文档](https://www.jaegertracing.io/docs/)
- [Zipkin 官方文档](https://zipkin.io/)

### 推荐书籍

- 《Distributed Tracing in Practice》 - Austin Parker
- 《Observability Engineering》 - Charity Majors

### 相关工具

| 工具 | 用途 | 链接 |
|------|------|------|
| Grafana Tempo | 追踪后端 | https://grafana.com/oss/tempo |
| Lightstep | 商业追踪平台 | https://lightstep.com |
| Honeycomb | 可观测性平台 | https://honeycomb.io |
| SigNoz | 开源 APM | https://signoz.io |

---

通过本文的学习，你应该已经掌握了分布式链路追踪的核心概念、OpenTelemetry 生态系统、Jaeger 和 Zipkin 的部署配置，以及在各种编程语言中的实现方式。在实际应用中，建议从小规模试点开始，逐步扩展到整个微服务架构，构建完善的可观测性体系。
