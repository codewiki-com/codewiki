---
title: 分布式追踪
description: 掌握分布式系统的请求追踪和监控
track: architecture
section: observability
difficulty: intermediate
tags:
  - 分布式追踪
  - Jaeger
  - Zipkin
  - OpenTelemetry
status: imported
origin: old/src/content/docs/architecture/distributed-tracing.zh.md
divergence: 0.296
issues: []
legacy:
  category: Architecture
  subcategory: Observability
  order: 17
  lastUpdated: 2026-01-07
---

## 为什么需要分布式追踪

### 微服务架构的可观测性挑战

在单体应用时代，追踪一个请求的完整生命周期相对简单 - 所有代码都在同一进程中运行，日志也集中在一处。但在微服务架构中，一个用户请求可能需要经过多个服务的协作才能完成：

```
用户请求
    │
    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   API 网关   │────▶│   订单服务   │────▶│   库存服务   │
└─────────────┘     └─────────────┘     └─────────────┘
                          │                    │
                          ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   支付服务   │     │   数据库     │
                    └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │ 第三方支付API │
                    └─────────────┘
```

当系统出现问题时，我们面临以下挑战：

1. **请求链路不清晰**：不知道请求经过了哪些服务
2. **故障定位困难**：延迟是发生在哪个服务？哪个环节失败了？
3. **性能瓶颈难以发现**：无法识别系统中的慢调用
4. **日志分散**：各服务日志独立，难以关联分析

### 分布式追踪解决的问题

分布式追踪通过在请求流经的每个服务中记录追踪信息，将分散的调用串联成完整的调用链：

- **可视化调用链路**：清晰展示请求在各服务间的流转路径
- **精确的延迟分析**：识别每个服务、每个操作的耗时
- **快速故障定位**：准确定位问题发生的服务和位置
- **依赖关系分析**：自动发现服务间的调用依赖

## 核心概念

### Trace（追踪）

Trace 代表一个完整的请求链路，从用户发起请求到最终返回响应的整个过程。一个 Trace 由多个 Span 组成，它们共享同一个 Trace ID。

```
Trace (trace_id: abc123)
├── Span A: API Gateway (duration: 250ms)
│   ├── Span B: Order Service (duration: 180ms)
│   │   ├── Span C: Database Query (duration: 50ms)
│   │   └── Span D: Payment Service (duration: 100ms)
│   │       └── Span E: External Payment API (duration: 80ms)
│   └── Span F: Inventory Service (duration: 30ms)
```

### Span（跨度）

Span 是分布式追踪的基本工作单元，代表一个独立的操作或工作片段。每个 Span 包含：

```typescript
interface Span {
  traceId: string;        // 所属 Trace 的唯一标识
  spanId: string;         // Span 自身的唯一标识
  parentSpanId?: string;  // 父 Span 的标识（根 Span 没有父级）
  operationName: string;  // 操作名称，如 "HTTP GET /api/orders"
  startTime: number;      // 开始时间戳
  duration: number;       // 持续时间
  tags: Record<string, string>;     // 标签，用于查询和过滤
  logs: SpanLog[];        // 时间点日志事件
  status: SpanStatus;     // 状态（OK, ERROR 等）
}

interface SpanLog {
  timestamp: number;
  message: string;
  fields?: Record<string, any>;
}
```

### Span 的关系类型

Span 之间可以有两种关系：

**1. ChildOf（父子关系）**：子 Span 依赖于父 Span 的完成
```
Parent Span ──────────────────────────────────
    │
    └── Child Span ─────────────
```

**2. FollowsFrom（跟随关系）**：Span 之间有因果关系但不依赖
```
Span A (发送消息) ──────
                        ╲
                         ╲
                          ▶ Span B (处理消息) ──────
```

### Context Propagation（上下文传播）

上下文传播是分布式追踪的核心机制，它确保追踪信息能够跨服务边界传递。

```
┌─────────────────────────────────────────────────────────────┐
│                     Context Propagation                      │
│                                                              │
│  Service A                    Service B                      │
│  ┌──────────────┐            ┌──────────────┐               │
│  │ Create Span  │            │ Extract      │               │
│  │     │        │   HTTP     │ Context      │               │
│  │     ▼        │  ──────▶   │     │        │               │
│  │ Inject       │  Headers   │     ▼        │               │
│  │ Context      │            │ Create Child │               │
│  └──────────────┘            │ Span         │               │
│                              └──────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

#### W3C Trace Context 标准

W3C Trace Context 是目前最广泛采用的上下文传播标准：

```http
# HTTP 请求头
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
tracestate: vendor1=value1,vendor2=value2
```

`traceparent` 格式解析：
```
00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
│   │                                 │                 │
│   │                                 │                 └── Trace Flags (采样标志)
│   │                                 └── Parent Span ID (16字符)
│   └── Trace ID (32字符)
└── Version (版本号)
```

## OpenTelemetry

### 什么是 OpenTelemetry

OpenTelemetry (OTel) 是 CNCF 的一个开源可观测性框架，提供了一套标准化的 API、SDK 和工具，用于生成、收集和导出遥测数据（追踪、指标和日志）。

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenTelemetry 架构                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    Traces    │  │   Metrics    │  │     Logs     │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                 │                │
│         └─────────────────┼─────────────────┘                │
│                           ▼                                  │
│                   ┌───────────────┐                          │
│                   │ OTel SDK      │                          │
│                   │ (处理 & 采样)  │                          │
│                   └───────┬───────┘                          │
│                           │                                  │
│                           ▼                                  │
│                   ┌───────────────┐                          │
│                   │ OTel Exporter │                          │
│                   └───────┬───────┘                          │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            ▼
              ┌─────────────────────────┐
              │   Backend (Jaeger/      │
              │   Zipkin/Prometheus)    │
              └─────────────────────────┘
```

### Node.js 中使用 OpenTelemetry

#### 安装依赖

```bash
npm install @opentelemetry/api \
            @opentelemetry/sdk-node \
            @opentelemetry/auto-instrumentations-node \
            @opentelemetry/exporter-trace-otlp-http \
            @opentelemetry/exporter-metrics-otlp-http
```

#### 初始化配置

```typescript
// tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'order-service',
  [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
});

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
});

const metricExporter = new OTLPMetricExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/metrics',
});

const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 10000,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // 自动检测 HTTP、Express、数据库等
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/health', '/metrics'],
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-redis': {
        enabled: true,
      },
    }),
  ],
});

// 在应用启动前初始化
sdk.start();

// 优雅关闭
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

export { sdk };
```

#### 手动创建 Span

```typescript
// orderService.ts
import { trace, SpanStatusCode, context } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service', '1.0.0');

export class OrderService {
  async createOrder(orderData: CreateOrderDTO): Promise<Order> {
    // 创建一个新的 Span
    return tracer.startActiveSpan('createOrder', async (span) => {
      try {
        // 添加属性
        span.setAttribute('order.customer_id', orderData.customerId);
        span.setAttribute('order.items_count', orderData.items.length);

        // 记录事件
        span.addEvent('validating_order', {
          'order.total': orderData.items.reduce((sum, item) => sum + item.price, 0),
        });

        // 验证订单
        await this.validateOrder(orderData);

        // 检查库存（嵌套 Span）
        const inventoryResult = await tracer.startActiveSpan('checkInventory', async (inventorySpan) => {
          try {
            const result = await this.inventoryService.checkAvailability(orderData.items);
            inventorySpan.setAttribute('inventory.all_available', result.allAvailable);
            return result;
          } finally {
            inventorySpan.end();
          }
        });

        if (!inventoryResult.allAvailable) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: 'Insufficient inventory',
          });
          throw new Error('Insufficient inventory');
        }

        // 处理支付
        await tracer.startActiveSpan('processPayment', async (paymentSpan) => {
          try {
            paymentSpan.setAttribute('payment.method', orderData.paymentMethod);
            await this.paymentService.processPayment(orderData);
            paymentSpan.addEvent('payment_completed');
          } catch (error) {
            paymentSpan.recordException(error as Error);
            paymentSpan.setStatus({
              code: SpanStatusCode.ERROR,
              message: (error as Error).message,
            });
            throw error;
          } finally {
            paymentSpan.end();
          }
        });

        // 保存订单
        const order = await this.orderRepository.save(orderData);

        span.setAttribute('order.id', order.id);
        span.setStatus({ code: SpanStatusCode.OK });

        return order;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message,
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
```

#### 跨服务传播上下文

```typescript
// HTTP 客户端传播上下文
import { trace, context, propagation } from '@opentelemetry/api';
import axios from 'axios';

async function callInventoryService(items: OrderItem[]): Promise<InventoryResult> {
  const tracer = trace.getTracer('order-service');

  return tracer.startActiveSpan('callInventoryService', async (span) => {
    try {
      // 准备传播上下文的 headers
      const headers: Record<string, string> = {};
      propagation.inject(context.active(), headers);

      span.setAttribute('http.method', 'POST');
      span.setAttribute('http.url', 'http://inventory-service/api/check');

      const response = await axios.post(
        'http://inventory-service/api/check',
        { items },
        { headers }
      );

      span.setAttribute('http.status_code', response.status);
      return response.data;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

// 服务端提取上下文
import express from 'express';
import { trace, context, propagation, SpanKind } from '@opentelemetry/api';

const app = express();
const tracer = trace.getTracer('inventory-service');

app.post('/api/check', (req, res) => {
  // 从请求头中提取上下文
  const extractedContext = propagation.extract(context.active(), req.headers);

  // 在提取的上下文中创建新的 Span
  context.with(extractedContext, () => {
    tracer.startActiveSpan('checkInventory', { kind: SpanKind.SERVER }, async (span) => {
      try {
        const { items } = req.body;
        span.setAttribute('inventory.items_count', items.length);

        const result = await inventoryService.checkAvailability(items);

        span.setStatus({ code: SpanStatusCode.OK });
        res.json(result);
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        res.status(500).json({ error: (error as Error).message });
      } finally {
        span.end();
      }
    });
  });
});
```

### 采样策略

采样是控制追踪数据量的重要手段，避免在高流量场景下产生过多数据：

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  AlwaysOnSampler,
  AlwaysOffSampler,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';

// 1. 始终采样 - 开发环境使用
const alwaysOnSampler = new AlwaysOnSampler();

// 2. 从不采样 - 禁用追踪
const alwaysOffSampler = new AlwaysOffSampler();

// 3. 比例采样 - 只采样 10% 的请求
const ratioSampler = new TraceIdRatioBasedSampler(0.1);

// 4. 基于父级采样 - 推荐用于生产环境
// 如果父 Span 被采样，子 Span 也会被采样
const parentBasedSampler = new ParentBasedSampler({
  root: new TraceIdRatioBasedSampler(0.1),
  remoteParentSampled: new AlwaysOnSampler(),
  remoteParentNotSampled: new AlwaysOffSampler(),
  localParentSampled: new AlwaysOnSampler(),
  localParentNotSampled: new AlwaysOffSampler(),
});

// 5. 自定义采样器 - 基于业务逻辑采样
import { Sampler, SamplingResult, SamplingDecision } from '@opentelemetry/sdk-trace-base';

class CustomSampler implements Sampler {
  shouldSample(
    context: Context,
    traceId: string,
    spanName: string,
    spanKind: SpanKind,
    attributes: Attributes
  ): SamplingResult {
    // 错误请求始终采样
    if (attributes['http.status_code'] && attributes['http.status_code'] >= 400) {
      return { decision: SamplingDecision.RECORD_AND_SAMPLED };
    }

    // 关键业务路径始终采样
    if (spanName.includes('payment') || spanName.includes('checkout')) {
      return { decision: SamplingDecision.RECORD_AND_SAMPLED };
    }

    // 其他请求按 5% 采样
    const random = Math.random();
    return {
      decision: random < 0.05
        ? SamplingDecision.RECORD_AND_SAMPLED
        : SamplingDecision.NOT_RECORD,
    };
  }

  toString(): string {
    return 'CustomSampler';
  }
}
```

## Jaeger 集成

### Jaeger 简介

Jaeger 是 Uber 开源的分布式追踪系统，现已成为 CNCF 毕业项目。它提供了完整的追踪数据收集、存储和可视化能力。

### 架构组件

```
┌─────────────────────────────────────────────────────────────────┐
│                        Jaeger 架构                               │
│                                                                  │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐                        │
│  │Service A│   │Service B│   │Service C│                        │
│  └────┬────┘   └────┬────┘   └────┬────┘                        │
│       │             │             │                              │
│       └─────────────┼─────────────┘                              │
│                     ▼                                            │
│            ┌────────────────┐                                    │
│            │  Jaeger Agent  │  (UDP, 每个节点部署)                │
│            └───────┬────────┘                                    │
│                    │                                             │
│                    ▼                                             │
│            ┌────────────────┐                                    │
│            │ Jaeger Collector│  (接收并处理 Span)                 │
│            └───────┬────────┘                                    │
│                    │                                             │
│                    ▼                                             │
│            ┌────────────────┐                                    │
│            │    Storage     │  (Cassandra/Elasticsearch/Memory)  │
│            └───────┬────────┘                                    │
│                    │                                             │
│                    ▼                                             │
│            ┌────────────────┐                                    │
│            │  Jaeger Query  │  (UI & API)                        │
│            └────────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Docker Compose 部署

```yaml
# docker-compose.jaeger.yml
version: '3.8'

services:
  jaeger:
    image: jaegertracing/all-in-one:1.53
    container_name: jaeger
    ports:
      - "6831:6831/udp"   # Jaeger Thrift (UDP)
      - "6832:6832/udp"   # Jaeger Thrift (UDP)
      - "5778:5778"       # Agent config
      - "16686:16686"     # Jaeger UI
      - "4317:4317"       # OTLP gRPC
      - "4318:4318"       # OTLP HTTP
      - "14250:14250"     # gRPC
      - "14268:14268"     # HTTP Thrift
      - "14269:14269"     # Admin port
      - "9411:9411"       # Zipkin compatible
    environment:
      - COLLECTOR_ZIPKIN_HOST_PORT=:9411
      - COLLECTOR_OTLP_ENABLED=true
    networks:
      - tracing

  # 使用 Elasticsearch 存储（生产环境）
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - esdata:/usr/share/elasticsearch/data
    networks:
      - tracing

  jaeger-collector:
    image: jaegertracing/jaeger-collector:1.53
    container_name: jaeger-collector
    environment:
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://elasticsearch:9200
    ports:
      - "14269:14269"
      - "14268:14268"
      - "14250:14250"
      - "4317:4317"
      - "4318:4318"
    depends_on:
      - elasticsearch
    networks:
      - tracing

  jaeger-query:
    image: jaegertracing/jaeger-query:1.53
    container_name: jaeger-query
    environment:
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://elasticsearch:9200
    ports:
      - "16686:16686"
      - "16687:16687"
    depends_on:
      - elasticsearch
    networks:
      - tracing

networks:
  tracing:
    driver: bridge

volumes:
  esdata:
```

### 配置 OpenTelemetry 导出到 Jaeger

```typescript
// 使用 OTLP 协议导出到 Jaeger
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const traceExporter = new OTLPTraceExporter({
  url: 'http://jaeger:4318/v1/traces',
  headers: {},
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'my-service',
  }),
  traceExporter,
});

sdk.start();
```

## Zipkin 集成

### Zipkin 简介

Zipkin 是 Twitter 开源的分布式追踪系统，灵感来自 Google 的 Dapper 论文。它比 Jaeger 更轻量，适合中小规模的系统。

### 部署 Zipkin

```yaml
# docker-compose.zipkin.yml
version: '3.8'

services:
  zipkin:
    image: openzipkin/zipkin:2.27
    container_name: zipkin
    ports:
      - "9411:9411"
    environment:
      - STORAGE_TYPE=elasticsearch
      - ES_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - tracing

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    networks:
      - tracing

  # Zipkin 依赖分析
  zipkin-dependencies:
    image: openzipkin/zipkin-dependencies:2.6
    container_name: zipkin-dependencies
    environment:
      - STORAGE_TYPE=elasticsearch
      - ES_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - tracing

networks:
  tracing:
    driver: bridge
```

### 配置 OpenTelemetry 导出到 Zipkin

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const zipkinExporter = new ZipkinExporter({
  url: 'http://zipkin:9411/api/v2/spans',
  serviceName: 'order-service',
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'order-service',
  }),
  traceExporter: zipkinExporter,
});

sdk.start();
```

## 代码检测（Instrumentation）

### 自动检测 vs 手动检测

| 特性 | 自动检测 | 手动检测 |
|------|---------|---------|
| 实现复杂度 | 低，开箱即用 | 高，需要手动编码 |
| 覆盖范围 | 常见库和框架 | 完全自定义 |
| 灵活性 | 有限 | 完全灵活 |
| 业务语义 | 无法捕获 | 可以添加业务属性 |
| 维护成本 | 低 | 较高 |

### 自动检测配置

```typescript
// 自动检测所有支持的库
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const instrumentations = getNodeAutoInstrumentations({
  // HTTP 检测
  '@opentelemetry/instrumentation-http': {
    enabled: true,
    ignoreIncomingPaths: ['/health', '/ready', '/metrics'],
    ignoreOutgoingUrls: [/.*zipkin.*/],
    requestHook: (span, request) => {
      span.setAttribute('custom.request_id', request.headers['x-request-id']);
    },
    responseHook: (span, response) => {
      span.setAttribute('custom.content_length', response.headers['content-length']);
    },
  },

  // Express 检测
  '@opentelemetry/instrumentation-express': {
    enabled: true,
    ignoreLayers: [],
    ignoreLayersType: [],
  },

  // MongoDB 检测
  '@opentelemetry/instrumentation-mongodb': {
    enabled: true,
    enhancedDatabaseReporting: true,
  },

  // PostgreSQL 检测
  '@opentelemetry/instrumentation-pg': {
    enabled: true,
    enhancedDatabaseReporting: true,
  },

  // Redis 检测
  '@opentelemetry/instrumentation-redis-4': {
    enabled: true,
    dbStatementSerializer: (cmdName, cmdArgs) => {
      return `${cmdName} ${cmdArgs.slice(0, 2).join(' ')}`;
    },
  },

  // gRPC 检测
  '@opentelemetry/instrumentation-grpc': {
    enabled: true,
  },
});
```

### 自定义检测

```typescript
// 创建自定义检测器
import {
  InstrumentationBase,
  InstrumentationNodeModuleDefinition,
} from '@opentelemetry/instrumentation';
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';

class MyCustomLibraryInstrumentation extends InstrumentationBase {
  constructor() {
    super('my-custom-library-instrumentation', '1.0.0');
  }

  protected init(): InstrumentationNodeModuleDefinition<any>[] {
    return [
      new InstrumentationNodeModuleDefinition<any>(
        'my-custom-library',
        ['>=1.0.0'],
        (moduleExports) => {
          // 包装原始方法
          const originalMethod = moduleExports.doSomething;

          moduleExports.doSomething = async function(...args: any[]) {
            const tracer = trace.getTracer('my-custom-instrumentation');

            return tracer.startActiveSpan('my-custom-library.doSomething', {
              kind: SpanKind.INTERNAL,
            }, async (span) => {
              try {
                span.setAttribute('custom.arg_count', args.length);
                const result = await originalMethod.apply(this, args);
                span.setStatus({ code: SpanStatusCode.OK });
                return result;
              } catch (error) {
                span.recordException(error as Error);
                span.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: (error as Error).message,
                });
                throw error;
              } finally {
                span.end();
              }
            });
          };

          return moduleExports;
        },
        (moduleExports) => {
          // 清理：恢复原始方法
        }
      ),
    ];
  }
}
```

### 业务层检测装饰器

```typescript
// 使用装饰器简化手动检测
import { trace, SpanStatusCode, Span } from '@opentelemetry/api';

function Trace(operationName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const tracer = trace.getTracer('business-layer');
    const spanName = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return tracer.startActiveSpan(spanName, async (span: Span) => {
        try {
          // 记录方法参数（注意不要记录敏感数据）
          span.setAttribute('method.name', propertyKey);
          span.setAttribute('method.class', target.constructor.name);

          const result = await originalMethod.apply(this, args);

          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (error as Error).message,
          });
          throw error;
        } finally {
          span.end();
        }
      });
    };

    return descriptor;
  };
}

// 使用装饰器
class OrderService {
  @Trace('order.create')
  async createOrder(orderData: CreateOrderDTO): Promise<Order> {
    // 业务逻辑
    return this.orderRepository.save(orderData);
  }

  @Trace('order.cancel')
  async cancelOrder(orderId: string): Promise<void> {
    // 取消订单逻辑
  }

  @Trace()  // 使用默认名称: OrderService.getOrderById
  async getOrderById(id: string): Promise<Order | null> {
    return this.orderRepository.findById(id);
  }
}
```

## 分析追踪数据

### 常见查询场景

#### 查找慢请求

在 Jaeger UI 中：
- 设置 Service 为目标服务
- 设置 Min Duration 过滤长耗时请求
- 按 Duration 排序查看最慢的请求

```typescript
// 在代码中标记慢查询
import { trace } from '@opentelemetry/api';

const SLOW_THRESHOLD_MS = 1000;

async function queryWithSlowDetection<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const tracer = trace.getTracer('database');

  return tracer.startActiveSpan(`db.${queryName}`, async (span) => {
    const startTime = Date.now();

    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;

      span.setAttribute('db.query_duration_ms', duration);

      if (duration > SLOW_THRESHOLD_MS) {
        span.setAttribute('db.slow_query', true);
        span.addEvent('slow_query_detected', {
          threshold_ms: SLOW_THRESHOLD_MS,
          actual_ms: duration,
        });
      }

      return result;
    } finally {
      span.end();
    }
  });
}
```

#### 错误追踪

```typescript
// 记录详细的错误信息
import { trace, SpanStatusCode } from '@opentelemetry/api';

class ErrorTracker {
  private tracer = trace.getTracer('error-tracker');

  trackError(error: Error, context: Record<string, any> = {}): void {
    const span = trace.getActiveSpan();

    if (span) {
      // 记录异常
      span.recordException(error);

      // 添加错误上下文
      span.setAttribute('error.type', error.constructor.name);
      span.setAttribute('error.message', error.message);

      // 添加自定义上下文
      Object.entries(context).forEach(([key, value]) => {
        span.setAttribute(`error.context.${key}`, String(value));
      });

      // 添加堆栈跟踪作为事件
      span.addEvent('error_stack', {
        stack: error.stack || 'No stack trace available',
      });

      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
    }
  }
}

// 使用示例
const errorTracker = new ErrorTracker();

try {
  await processOrder(orderId);
} catch (error) {
  errorTracker.trackError(error as Error, {
    orderId,
    userId: currentUser.id,
    action: 'process_order',
  });
  throw error;
}
```

#### 服务依赖分析

```typescript
// 收集服务调用统计
import { trace, metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('service-dependencies');

const callCounter = meter.createCounter('service_calls_total', {
  description: 'Total number of calls to downstream services',
});

const callDuration = meter.createHistogram('service_call_duration_ms', {
  description: 'Duration of calls to downstream services',
});

async function callDownstreamService<T>(
  serviceName: string,
  operation: string,
  callFn: () => Promise<T>
): Promise<T> {
  const tracer = trace.getTracer('service-caller');
  const startTime = Date.now();

  return tracer.startActiveSpan(`call.${serviceName}.${operation}`, async (span) => {
    span.setAttribute('downstream.service', serviceName);
    span.setAttribute('downstream.operation', operation);

    try {
      const result = await callFn();

      const duration = Date.now() - startTime;

      // 记录指标
      callCounter.add(1, {
        service: serviceName,
        operation,
        status: 'success',
      });

      callDuration.record(duration, {
        service: serviceName,
        operation,
      });

      span.setAttribute('downstream.duration_ms', duration);
      span.setStatus({ code: SpanStatusCode.OK });

      return result;
    } catch (error) {
      callCounter.add(1, {
        service: serviceName,
        operation,
        status: 'error',
      });

      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

### 追踪数据可视化

#### Jaeger UI 功能

1. **Trace Timeline View**：展示 Span 的时间线，清晰看到并行和串行关系
2. **Trace Graph View**：以图形方式展示服务调用关系
3. **Compare Traces**：比较两个 Trace 的差异
4. **Trace Statistics**：统计分析 Trace 数据
5. **Service Dependencies**：自动生成服务依赖图

#### 创建自定义仪表盘

```typescript
// 使用 Grafana + Jaeger 数据源创建仪表盘

// 示例：导出追踪数据用于分析
import { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base';
import { ExportResult, ExportResultCode } from '@opentelemetry/core';

class AnalyticsExporter implements SpanExporter {
  private spans: ReadableSpan[] = [];

  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void
  ): void {
    // 收集 Span 数据用于分析
    this.spans.push(...spans);

    // 定期分析
    this.analyzeIfNeeded();

    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  private analyzeIfNeeded(): void {
    if (this.spans.length > 1000) {
      const analysis = this.performAnalysis(this.spans);
      console.log('Trace Analysis:', analysis);
      this.spans = [];
    }
  }

  private performAnalysis(spans: ReadableSpan[]): TraceAnalysis {
    const serviceLatencies = new Map<string, number[]>();
    const errorRates = new Map<string, { total: number; errors: number }>();

    spans.forEach((span) => {
      const serviceName = span.resource.attributes['service.name'] as string;
      const duration = span.duration[0] * 1000 + span.duration[1] / 1e6;

      // 收集延迟数据
      if (!serviceLatencies.has(serviceName)) {
        serviceLatencies.set(serviceName, []);
      }
      serviceLatencies.get(serviceName)!.push(duration);

      // 收集错误率
      if (!errorRates.has(serviceName)) {
        errorRates.set(serviceName, { total: 0, errors: 0 });
      }
      const stats = errorRates.get(serviceName)!;
      stats.total++;
      if (span.status.code === SpanStatusCode.ERROR) {
        stats.errors++;
      }
    });

    return {
      serviceLatencies: Object.fromEntries(
        Array.from(serviceLatencies.entries()).map(([service, latencies]) => [
          service,
          {
            p50: this.percentile(latencies, 50),
            p95: this.percentile(latencies, 95),
            p99: this.percentile(latencies, 99),
          },
        ])
      ),
      errorRates: Object.fromEntries(
        Array.from(errorRates.entries()).map(([service, stats]) => [
          service,
          stats.errors / stats.total,
        ])
      ),
    };
  }

  private percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}
```

## 最佳实践

### 合理的命名规范

```typescript
// Span 命名规范
const NAMING_CONVENTIONS = {
  // HTTP 请求: <HTTP_METHOD> <路径模板>
  http: 'GET /api/users/{userId}',

  // 数据库操作: db.<操作类型> <表名>
  database: 'db.query users',

  // 消息队列: <操作> <队列名>
  messaging: 'send order.created',

  // RPC 调用: <服务>.<方法>
  rpc: 'UserService.GetUser',

  // 业务操作: <领域>.<操作>
  business: 'order.create',
};
```

### 属性标准化

```typescript
// 使用语义约定
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

span.setAttribute(SemanticAttributes.HTTP_METHOD, 'GET');
span.setAttribute(SemanticAttributes.HTTP_URL, 'https://api.example.com/users');
span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, 200);
span.setAttribute(SemanticAttributes.DB_SYSTEM, 'postgresql');
span.setAttribute(SemanticAttributes.DB_STATEMENT, 'SELECT * FROM users WHERE id = $1');

// 自定义业务属性使用统一前缀
span.setAttribute('app.order.id', orderId);
span.setAttribute('app.order.status', status);
span.setAttribute('app.user.tier', userTier);
```

### 性能考虑

```typescript
// 避免在热路径上创建过多 Span
function processItems(items: Item[]): void {
  const tracer = trace.getTracer('batch-processor');

  // 好的做法：为批处理创建一个 Span
  tracer.startActiveSpan('processItems', (span) => {
    span.setAttribute('items.count', items.length);

    items.forEach((item, index) => {
      // 只为关键操作创建子 Span
      if (item.requiresSpecialProcessing) {
        tracer.startActiveSpan(`processSpecialItem`, (childSpan) => {
          childSpan.setAttribute('item.id', item.id);
          processSpecialItem(item);
          childSpan.end();
        });
      } else {
        processNormalItem(item);
      }
    });

    span.end();
  });

  // 不好的做法：为每个项目创建 Span
  // items.forEach(item => {
  //   tracer.startActiveSpan(`processItem-${item.id}`, ...);
  // });
}
```

### 敏感数据处理

```typescript
// 过滤敏感数据
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key'];
const SENSITIVE_PARAMS = ['password', 'token', 'secret', 'credit_card'];

function sanitizeAttributes(attributes: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  Object.entries(attributes).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();

    // 检查是否是敏感字段
    const isSensitive = SENSITIVE_HEADERS.some(h => lowerKey.includes(h)) ||
                       SENSITIVE_PARAMS.some(p => lowerKey.includes(p));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 1000) {
      // 截断过长的值
      sanitized[key] = value.substring(0, 1000) + '...[TRUNCATED]';
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

// 配置自动检测时使用过滤器
const httpInstrumentation = {
  '@opentelemetry/instrumentation-http': {
    requestHook: (span, request) => {
      const headers = sanitizeAttributes(request.headers);
      Object.entries(headers).forEach(([key, value]) => {
        span.setAttribute(`http.request.header.${key}`, value);
      });
    },
  },
};
```

### 生产环境配置清单

```typescript
// production-tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const productionConfig = {
  // 采样率：生产环境推荐 10-20%
  samplingRatio: parseFloat(process.env.OTEL_SAMPLING_RATIO || '0.1'),

  // 批量导出配置
  batchConfig: {
    maxQueueSize: 2048,
    maxExportBatchSize: 512,
    scheduledDelayMillis: 5000,
    exportTimeoutMillis: 30000,
  },

  // 导出端点
  exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4318',
};

const traceExporter = new OTLPTraceExporter({
  url: `${productionConfig.exporterEndpoint}/v1/traces`,
});

const spanProcessor = new BatchSpanProcessor(traceExporter, productionConfig.batchConfig);

const sdk = new NodeSDK({
  spanProcessor,
  sampler: new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(productionConfig.samplingRatio),
  }),
});

sdk.start();
```

## 故障排查

### 常见问题

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| Trace 不完整 | 上下文传播丢失 | 检查 HTTP 头是否正确传递 |
| 采样不生效 | 采样器配置错误 | 验证采样器配置，检查父级决策 |
| Span 丢失 | 导出失败 | 检查网络连接和导出器日志 |
| 性能下降 | 创建过多 Span | 优化 Span 粒度，增加采样率 |
| 内存泄漏 | Span 未正确结束 | 确保所有 Span 调用 end() |

### 调试技巧

```typescript
// 启用 OpenTelemetry 调试日志
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// 开发环境开启调试
if (process.env.NODE_ENV === 'development') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

// 验证上下文传播
import { trace, context } from '@opentelemetry/api';

function debugContext(): void {
  const currentSpan = trace.getActiveSpan();
  if (currentSpan) {
    const spanContext = currentSpan.spanContext();
    console.log('Current Trace ID:', spanContext.traceId);
    console.log('Current Span ID:', spanContext.spanId);
    console.log('Is Sampled:', spanContext.traceFlags === 1);
  } else {
    console.log('No active span');
  }
}
```

## 总结

分布式追踪是现代微服务架构不可或缺的可观测性能力。通过本文，我们学习了：

1. **核心概念**：Trace、Span、Context Propagation 的含义和关系
2. **OpenTelemetry**：标准化的可观测性框架，提供统一的 API 和 SDK
3. **后端集成**：Jaeger 和 Zipkin 的部署与配置
4. **代码检测**：自动检测和手动检测的方法
5. **最佳实践**：命名规范、性能优化、敏感数据处理

掌握分布式追踪技术，能够帮助我们更好地理解系统行为、快速定位问题、优化系统性能，是构建可靠的分布式系统的重要基石。

## 延伸阅读

- [OpenTelemetry 官方文档](https://opentelemetry.io/docs/)
- [Jaeger 官方文档](https://www.jaegertracing.io/docs/)
- [W3C Trace Context 规范](https://www.w3.org/TR/trace-context/)
- [Google Dapper 论文](https://research.google/pubs/pub36356/)
- [分布式追踪的原理与实践](https://www.cncf.io/blog/2020/04/30/what-is-distributed-tracing/)
