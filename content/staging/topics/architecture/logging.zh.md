---
title: 日志系统设计与最佳实践
description: 掌握日志系统设计，构建可观测的后端服务
track: architecture
section: observability
difficulty: intermediate
tags:
  - 日志
  - 日志系统
  - 可观测性
  - 调试
status: imported
origin: old/src/content/docs/backend/logging.zh.md
divergence: 0.27
issues: []
legacy:
  category: Backend
  subcategory: Observability
  order: 28
  lastUpdated: 2026-01-07
---

日志是软件系统的"黑匣子"，它记录着系统运行的每一个关键时刻。一个设计良好的日志系统不仅能帮助开发者快速定位问题，还是构建可观测性体系的重要基石。本文将深入探讨日志级别设计、结构化日志、日志聚合与分析等核心主题，帮助你构建生产级的日志系统。

## 日志的意义与核心价值

### 为什么日志如此重要

在分布式系统中，日志是连接开发、运维和业务的纽带。它承载着以下核心价值：

```
日志的核心价值：
┌─────────────────────────────────────────────────────────────┐
│ 问题诊断    │ 快速定位系统异常、性能瓶颈和业务逻辑错误      │
│ 审计追踪    │ 记录用户行为、数据变更，满足合规要求          │
│ 性能分析    │ 追踪请求链路耗时，发现性能优化点              │
│ 业务洞察    │ 分析用户行为模式，支撑业务决策                │
│ 安全监控    │ 检测异常访问、攻击行为，保障系统安全          │
└─────────────────────────────────────────────────────────────┘
```

### 日志与可观测性三支柱

可观测性（Observability）由三大支柱组成：日志（Logs）、指标（Metrics）和链路追踪（Traces）。

```typescript
// 可观测性三支柱的协同工作示例
interface ObservabilityPillars {
  // 日志：记录离散事件的详细信息
  logs: {
    purpose: '记录具体事件和上下文';
    example: '用户登录失败，原因：密码错误';
    characteristics: ['高基数', '详细信息', '事件驱动'];
  };

  // 指标：记录可聚合的数值数据
  metrics: {
    purpose: '量化系统状态和趋势';
    example: 'API 响应时间 P99 = 200ms';
    characteristics: ['可聚合', '时序数据', '低存储成本'];
  };

  // 链路追踪：记录请求的完整路径
  traces: {
    purpose: '追踪跨服务的请求链路';
    example: '请求 A -> 服务 B -> 数据库 C';
    characteristics: ['分布式', '因果关系', '端到端可见'];
  };
}
```

## 日志级别详解

### 标准日志级别

日志级别是日志系统的核心概念，它决定了日志的重要程度和过滤策略。

```typescript
// 标准日志级别定义（从低到高）
enum LogLevel {
  TRACE = 0,  // 最详细的追踪信息
  DEBUG = 1,  // 调试信息
  INFO = 2,   // 一般信息
  WARN = 3,   // 警告信息
  ERROR = 4,  // 错误信息
  FATAL = 5,  // 致命错误
}

// 各级别的使用场景
const logLevelGuidelines = {
  TRACE: {
    description: '最细粒度的追踪信息',
    useCase: '追踪代码执行流程、变量值变化',
    example: '进入函数 processOrder，参数: orderId=12345',
    production: false, // 生产环境通常关闭
  },

  DEBUG: {
    description: '开发调试信息',
    useCase: '记录程序内部状态，用于开发和调试',
    example: '查询用户缓存，key=user:1001，结果: 命中',
    production: false, // 生产环境通常关闭
  },

  INFO: {
    description: '重要的业务流程信息',
    useCase: '记录正常的业务操作和系统状态变化',
    example: '用户 1001 成功下单，订单号: ORD-2024-001',
    production: true,
  },

  WARN: {
    description: '潜在问题警告',
    useCase: '记录可能导致问题的情况，但系统仍可正常运行',
    example: '数据库连接池使用率达到 80%，考虑扩容',
    production: true,
  },

  ERROR: {
    description: '错误信息',
    useCase: '记录导致功能失败的错误，需要关注但不影响系统整体运行',
    example: '发送邮件失败，用户: 1001，原因: SMTP 连接超时',
    production: true,
  },

  FATAL: {
    description: '致命错误',
    useCase: '记录导致系统崩溃或无法继续运行的严重错误',
    example: '数据库连接失败，系统无法启动',
    production: true,
  },
};
```

### 日志级别最佳实践

```typescript
import { Logger } from './logger';

const logger = new Logger('OrderService');

class OrderService {
  async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
    // TRACE: 记录方法入口和参数（仅开发环境）
    logger.trace('createOrder 开始', { userId, itemCount: items.length });

    // DEBUG: 记录中间处理过程
    logger.debug('验证订单项', { items });

    try {
      // 验证库存
      const stockCheck = await this.checkStock(items);
      if (!stockCheck.success) {
        // WARN: 业务规则触发的警告
        logger.warn('库存不足', {
          userId,
          insufficientItems: stockCheck.insufficientItems,
        });
        throw new InsufficientStockError(stockCheck.insufficientItems);
      }

      // 创建订单
      const order = await this.orderRepository.create({
        userId,
        items,
        status: 'pending',
      });

      // INFO: 重要业务事件
      logger.info('订单创建成功', {
        orderId: order.id,
        userId,
        totalAmount: order.totalAmount,
      });

      return order;
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        throw error; // 业务异常，已记录 WARN
      }

      // ERROR: 非预期错误
      logger.error('订单创建失败', {
        userId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
```

### 动态日志级别调整

生产环境中，能够动态调整日志级别是非常重要的能力。

```typescript
// 支持动态调整的日志配置
class DynamicLoggerConfig {
  private static instance: DynamicLoggerConfig;
  private logLevels: Map<string, LogLevel> = new Map();
  private defaultLevel: LogLevel = LogLevel.INFO;

  // 从配置中心获取日志级别
  async refreshConfig(): Promise<void> {
    const config = await this.configCenter.get('logging.levels');

    // 更新日志级别配置
    for (const [logger, level] of Object.entries(config)) {
      this.logLevels.set(logger, LogLevel[level as keyof typeof LogLevel]);
    }
  }

  getLevel(loggerName: string): LogLevel {
    // 精确匹配
    if (this.logLevels.has(loggerName)) {
      return this.logLevels.get(loggerName)!;
    }

    // 层级匹配：com.example.service.OrderService -> com.example.service -> com.example
    const parts = loggerName.split('.');
    while (parts.length > 0) {
      parts.pop();
      const parentName = parts.join('.');
      if (this.logLevels.has(parentName)) {
        return this.logLevels.get(parentName)!;
      }
    }

    return this.defaultLevel;
  }
}

// 使用示例：通过 API 动态调整日志级别
app.post('/admin/logging/level', async (req, res) => {
  const { logger, level } = req.body;

  // 验证权限
  if (!req.user.hasPermission('admin:logging')) {
    return res.status(403).json({ error: '权限不足' });
  }

  await loggerConfig.setLevel(logger, level);

  // 记录操作审计日志
  auditLogger.info('日志级别调整', {
    operator: req.user.id,
    logger,
    newLevel: level,
  });

  res.json({ success: true });
});
```

## 结构化日志

### 什么是结构化日志

传统的日志是纯文本格式，难以解析和查询。结构化日志采用标准化的数据格式（如 JSON），使日志更易于处理和分析。

```typescript
// 传统日志 vs 结构化日志
const traditionalLog =
  '[2024-01-15 10:30:45] ERROR OrderService - 订单创建失败: 用户 1001, 原因: 库存不足';

const structuredLog = {
  timestamp: '2024-01-15T10:30:45.123Z',
  level: 'ERROR',
  logger: 'OrderService',
  message: '订单创建失败',
  context: {
    userId: '1001',
    reason: '库存不足',
    items: ['SKU-001', 'SKU-002'],
  },
  trace: {
    traceId: 'abc123',
    spanId: 'def456',
  },
  host: {
    name: 'order-service-pod-xyz',
    ip: '10.0.1.15',
  },
};
```

### 设计结构化日志 Schema

```typescript
// 标准化的日志 Schema
interface StructuredLog {
  // 基础字段
  timestamp: string; // ISO 8601 格式
  level: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  logger: string; // 日志来源
  message: string; // 日志消息

  // 链路追踪
  trace?: {
    traceId: string; // 分布式追踪 ID
    spanId: string; // 当前 Span ID
    parentSpanId?: string; // 父 Span ID
  };

  // 请求上下文
  request?: {
    id: string; // 请求唯一标识
    method: string; // HTTP 方法
    path: string; // 请求路径
    userAgent?: string; // 用户代理
    ip?: string; // 客户端 IP
  };

  // 用户上下文
  user?: {
    id: string; // 用户 ID
    role?: string; // 用户角色
    tenantId?: string; // 租户 ID（多租户场景）
  };

  // 主机信息
  host: {
    name: string; // 主机名
    ip: string; // 主机 IP
    environment: string; // 环境标识
  };

  // 应用信息
  application: {
    name: string; // 应用名称
    version: string; // 应用版本
    instance: string; // 实例标识
  };

  // 错误信息
  error?: {
    type: string; // 错误类型
    message: string; // 错误消息
    stack?: string; // 堆栈信息
    code?: string; // 错误代码
  };

  // 额外上下文
  context?: Record<string, any>;

  // 耗时信息
  duration?: number; // 毫秒
}
```

### 实现结构化日志库

```typescript
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

// 使用 AsyncLocalStorage 管理请求上下文
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

interface RequestContext {
  traceId: string;
  spanId: string;
  requestId: string;
  userId?: string;
  startTime: number;
}

class StructuredLogger {
  private name: string;
  private minLevel: LogLevel;
  private outputs: LogOutput[];

  constructor(name: string, options: LoggerOptions = {}) {
    this.name = name;
    this.minLevel = options.minLevel ?? LogLevel.INFO;
    this.outputs = options.outputs ?? [new ConsoleOutput()];
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level < this.minLevel) return;

    const requestContext = asyncLocalStorage.getStore();

    const logEntry: StructuredLog = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level] as any,
      logger: this.name,
      message,
      host: {
        name: process.env.HOSTNAME ?? 'unknown',
        ip: this.getHostIP(),
        environment: process.env.NODE_ENV ?? 'development',
      },
      application: {
        name: process.env.APP_NAME ?? 'unknown',
        version: process.env.APP_VERSION ?? '0.0.0',
        instance: process.env.INSTANCE_ID ?? uuidv4(),
      },
    };

    // 添加请求上下文
    if (requestContext) {
      logEntry.trace = {
        traceId: requestContext.traceId,
        spanId: requestContext.spanId,
      };
      logEntry.request = {
        id: requestContext.requestId,
        method: '', // 从上下文获取
        path: '', // 从上下文获取
      };
      if (requestContext.userId) {
        logEntry.user = { id: requestContext.userId };
      }
      logEntry.duration = Date.now() - requestContext.startTime;
    }

    // 添加额外上下文
    if (context) {
      // 分离错误信息
      if (context.error instanceof Error) {
        logEntry.error = {
          type: context.error.constructor.name,
          message: context.error.message,
          stack: context.error.stack,
        };
        delete context.error;
      }
      logEntry.context = context;
    }

    // 输出日志
    for (const output of this.outputs) {
      output.write(logEntry);
    }
  }

  trace(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  fatal(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, context);
  }

  // 创建子 Logger
  child(name: string): StructuredLogger {
    return new StructuredLogger(`${this.name}.${name}`, {
      minLevel: this.minLevel,
      outputs: this.outputs,
    });
  }

  private getHostIP(): string {
    const interfaces = require('os').networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  }
}

// 日志输出接口
interface LogOutput {
  write(entry: StructuredLog): void;
}

// 控制台输出
class ConsoleOutput implements LogOutput {
  write(entry: StructuredLog): void {
    const json = JSON.stringify(entry);
    if (entry.level === 'ERROR' || entry.level === 'FATAL') {
      console.error(json);
    } else {
      console.log(json);
    }
  }
}

// 文件输出（支持日志轮转）
class FileOutput implements LogOutput {
  private stream: fs.WriteStream;
  private currentDate: string;
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
    this.currentDate = this.getDateString();
    this.stream = this.createStream();
  }

  write(entry: StructuredLog): void {
    // 检查是否需要轮转
    const today = this.getDateString();
    if (today !== this.currentDate) {
      this.rotate();
    }

    this.stream.write(JSON.stringify(entry) + '\n');
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private createStream(): fs.WriteStream {
    const filePath = `${this.basePath}/app-${this.currentDate}.log`;
    return fs.createWriteStream(filePath, { flags: 'a' });
  }

  private rotate(): void {
    this.stream.end();
    this.currentDate = this.getDateString();
    this.stream = this.createStream();
  }
}
```

### Express 中间件集成

```typescript
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();
const logger = new StructuredLogger('HttpServer');

// 请求日志中间件
function requestLoggingMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string ?? uuidv4();
  const traceId = req.headers['x-trace-id'] as string ?? uuidv4();
  const spanId = uuidv4();

  // 设置响应头
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Trace-Id', traceId);

  const context: RequestContext = {
    traceId,
    spanId,
    requestId,
    userId: (req as any).user?.id,
    startTime,
  };

  // 请求开始日志
  logger.info('请求开始', {
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  // 响应完成时记录日志
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logContext = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length'),
    };

    if (res.statusCode >= 500) {
      logger.error('请求完成', logContext);
    } else if (res.statusCode >= 400) {
      logger.warn('请求完成', logContext);
    } else {
      logger.info('请求完成', logContext);
    }
  });

  // 在 AsyncLocalStorage 上下文中执行后续中间件
  asyncLocalStorage.run(context, () => {
    next();
  });
}

// 错误处理中间件
function errorLoggingMiddleware(
  error: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  logger.error('未捕获的错误', {
    method: req.method,
    path: req.path,
    error: {
      type: error.constructor.name,
      message: error.message,
      stack: error.stack,
    },
  });

  res.status(500).json({
    error: 'Internal Server Error',
    requestId: res.get('X-Request-Id'),
  });
}

// 应用中间件
const app = express();
app.use(requestLoggingMiddleware);
// ... 其他路由
app.use(errorLoggingMiddleware);
```

## 日志聚合

### 日志聚合的必要性

在分布式系统中，日志散落在各个服务节点上，需要统一收集和存储才能有效分析。

```
日志聚合架构：
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Service A   │     │  Service B   │     │  Service C   │
│  (日志产生)   │     │  (日志产生)   │     │  (日志产生)   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                    日志收集层                            │
│         (Fluentd / Filebeat / Vector)                   │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    消息队列                              │
│                    (Kafka)                              │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    日志处理层                            │
│               (Logstash / Flink)                        │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    日志存储层                            │
│           (Elasticsearch / ClickHouse)                  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    可视化分析                            │
│               (Kibana / Grafana)                        │
└─────────────────────────────────────────────────────────┘
```

### 使用 Fluentd 收集日志

```yaml
# fluentd.conf - Fluentd 配置示例
<source>
  @type tail
  path /var/log/app/*.log
  pos_file /var/log/fluentd/app.log.pos
  tag app.logs
  <parse>
    @type json
    time_key timestamp
    time_format %Y-%m-%dT%H:%M:%S.%L%z
  </parse>
</source>

# 添加 Kubernetes 元数据
<filter app.logs>
  @type kubernetes_metadata
</filter>

# 添加额外字段
<filter app.logs>
  @type record_transformer
  <record>
    cluster_name ${ENV['CLUSTER_NAME']}
    datacenter ${ENV['DATACENTER']}
  </record>
</filter>

# 输出到 Elasticsearch
<match app.logs>
  @type elasticsearch
  host elasticsearch.logging.svc.cluster.local
  port 9200
  index_name app-logs
  type_name _doc

  # 缓冲配置
  <buffer>
    @type file
    path /var/log/fluentd/buffer
    flush_interval 5s
    chunk_limit_size 5MB
    total_limit_size 1GB
    retry_max_interval 30
    retry_forever true
  </buffer>
</match>
```

### 使用 Filebeat 收集日志

```yaml
# filebeat.yml - Filebeat 配置示例
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/app/*.log
    json.keys_under_root: true
    json.add_error_key: true
    json.message_key: message

    # 多行日志处理（如堆栈信息）
    multiline.pattern: '^\s'
    multiline.negate: false
    multiline.match: after

    # 添加字段
    fields:
      service: order-service
      environment: production
    fields_under_root: true

# 处理器
processors:
  - add_host_metadata: ~
  - add_cloud_metadata: ~
  - add_docker_metadata: ~
  - add_kubernetes_metadata: ~

# 输出到 Kafka
output.kafka:
  hosts: ['kafka-1:9092', 'kafka-2:9092', 'kafka-3:9092']
  topic: 'app-logs'
  partition.round_robin:
    reachable_only: true
  required_acks: 1
  compression: gzip
  max_message_bytes: 1000000
```

### 直接发送到日志服务

```typescript
// 直接发送日志到 Elasticsearch 的实现
import { Client } from '@elastic/elasticsearch';

class ElasticsearchOutput implements LogOutput {
  private client: Client;
  private buffer: StructuredLog[] = [];
  private flushInterval: number = 5000; // 5秒
  private maxBufferSize: number = 100;
  private indexPrefix: string;

  constructor(options: ESOutputOptions) {
    this.client = new Client({
      node: options.nodes,
      auth: {
        username: options.username,
        password: options.password,
      },
    });
    this.indexPrefix = options.indexPrefix ?? 'app-logs';

    // 定时刷新缓冲区
    setInterval(() => this.flush(), this.flushInterval);

    // 进程退出时刷新
    process.on('beforeExit', () => this.flush());
  }

  write(entry: StructuredLog): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logs = this.buffer.splice(0, this.buffer.length);
    const indexName = `${this.indexPrefix}-${this.getDateString()}`;

    try {
      const body = logs.flatMap((doc) => [
        { index: { _index: indexName } },
        doc,
      ]);

      await this.client.bulk({ body, refresh: false });
    } catch (error) {
      console.error('发送日志到 Elasticsearch 失败:', error);
      // 重新放回缓冲区（可选）
      this.buffer.unshift(...logs);
    }
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }
}

// 使用 Loki 的实现（Grafana 生态）
class LokiOutput implements LogOutput {
  private baseUrl: string;
  private buffer: StructuredLog[] = [];
  private labels: Record<string, string>;

  constructor(options: LokiOutputOptions) {
    this.baseUrl = options.url;
    this.labels = options.labels ?? {};

    setInterval(() => this.flush(), 5000);
  }

  write(entry: StructuredLog): void {
    this.buffer.push(entry);
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logs = this.buffer.splice(0, this.buffer.length);

    // 按标签分组
    const streams = new Map<string, any[]>();

    for (const log of logs) {
      const labels = {
        ...this.labels,
        level: log.level,
        logger: log.logger,
        app: log.application.name,
      };
      const labelKey = JSON.stringify(labels);

      if (!streams.has(labelKey)) {
        streams.set(labelKey, []);
      }

      streams.get(labelKey)!.push([
        (new Date(log.timestamp).getTime() * 1000000).toString(), // 纳秒时间戳
        JSON.stringify(log),
      ]);
    }

    const body = {
      streams: Array.from(streams.entries()).map(([labels, values]) => ({
        stream: JSON.parse(labels),
        values,
      })),
    };

    try {
      await fetch(`${this.baseUrl}/loki/api/v1/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('发送日志到 Loki 失败:', error);
    }
  }
}
```

## 日志分析

### Elasticsearch 查询

```typescript
// 常用的日志查询示例
class LogAnalyzer {
  private esClient: Client;

  // 查询特定时间范围内的错误日志
  async getErrors(timeRange: { from: string; to: string }): Promise<any[]> {
    const result = await this.esClient.search({
      index: 'app-logs-*',
      body: {
        query: {
          bool: {
            must: [
              { term: { level: 'ERROR' } },
              {
                range: {
                  timestamp: {
                    gte: timeRange.from,
                    lte: timeRange.to,
                  },
                },
              },
            ],
          },
        },
        sort: [{ timestamp: 'desc' }],
        size: 100,
      },
    });

    return result.hits.hits.map((hit: any) => hit._source);
  }

  // 按错误类型聚合
  async getErrorAggregation(
    timeRange: { from: string; to: string }
  ): Promise<any> {
    const result = await this.esClient.search({
      index: 'app-logs-*',
      body: {
        query: {
          bool: {
            must: [
              { term: { level: 'ERROR' } },
              {
                range: {
                  timestamp: {
                    gte: timeRange.from,
                    lte: timeRange.to,
                  },
                },
              },
            ],
          },
        },
        aggs: {
          error_types: {
            terms: {
              field: 'error.type.keyword',
              size: 20,
            },
            aggs: {
              sample_message: {
                top_hits: {
                  size: 1,
                  _source: ['message', 'error.message'],
                },
              },
            },
          },
        },
        size: 0,
      },
    });

    return result.aggregations;
  }

  // 追踪单个请求的完整链路
  async traceRequest(traceId: string): Promise<any[]> {
    const result = await this.esClient.search({
      index: 'app-logs-*',
      body: {
        query: {
          term: { 'trace.traceId': traceId },
        },
        sort: [{ timestamp: 'asc' }],
        size: 1000,
      },
    });

    return result.hits.hits.map((hit: any) => hit._source);
  }

  // 分析响应时间分布
  async getLatencyPercentiles(
    path: string,
    timeRange: { from: string; to: string }
  ): Promise<any> {
    const result = await this.esClient.search({
      index: 'app-logs-*',
      body: {
        query: {
          bool: {
            must: [
              { term: { 'request.path.keyword': path } },
              { term: { message: '请求完成' } },
              {
                range: {
                  timestamp: {
                    gte: timeRange.from,
                    lte: timeRange.to,
                  },
                },
              },
            ],
          },
        },
        aggs: {
          latency_percentiles: {
            percentiles: {
              field: 'duration',
              percents: [50, 75, 90, 95, 99],
            },
          },
          latency_histogram: {
            histogram: {
              field: 'duration',
              interval: 100,
            },
          },
        },
        size: 0,
      },
    });

    return result.aggregations;
  }
}
```

### 日志告警规则

```typescript
// 基于日志的告警规则配置
interface AlertRule {
  name: string;
  description: string;
  query: any;
  threshold: number;
  window: string; // 时间窗口
  severity: 'warning' | 'critical';
  notification: NotificationConfig;
}

const alertRules: AlertRule[] = [
  {
    name: 'high_error_rate',
    description: '错误率过高',
    query: {
      bool: {
        must: [{ term: { level: 'ERROR' } }],
      },
    },
    threshold: 100, // 5分钟内超过100条错误
    window: '5m',
    severity: 'critical',
    notification: {
      channels: ['slack', 'pagerduty'],
      template: '服务 {{service}} 在过去5分钟内产生了 {{count}} 条错误日志',
    },
  },
  {
    name: 'slow_requests',
    description: '慢请求过多',
    query: {
      bool: {
        must: [
          { term: { message: '请求完成' } },
          { range: { duration: { gte: 3000 } } },
        ],
      },
    },
    threshold: 50,
    window: '5m',
    severity: 'warning',
    notification: {
      channels: ['slack'],
      template: '服务 {{service}} 在过去5分钟内有 {{count}} 个请求耗时超过3秒',
    },
  },
  {
    name: 'authentication_failures',
    description: '认证失败过多',
    query: {
      bool: {
        must: [
          { term: { 'context.event': 'authentication_failed' } },
        ],
      },
    },
    threshold: 20,
    window: '1m',
    severity: 'critical',
    notification: {
      channels: ['slack', 'security-team'],
      template: '检测到异常：1分钟内有 {{count}} 次认证失败，可能存在暴力破解攻击',
    },
  },
];

// 告警执行器
class AlertExecutor {
  private esClient: Client;
  private notifier: NotificationService;

  async checkAlerts(): Promise<void> {
    for (const rule of alertRules) {
      const count = await this.executeQuery(rule.query, rule.window);

      if (count >= rule.threshold) {
        await this.triggerAlert(rule, count);
      }
    }
  }

  private async executeQuery(query: any, window: string): Promise<number> {
    const result = await this.esClient.count({
      index: 'app-logs-*',
      body: {
        query: {
          bool: {
            must: [
              query,
              {
                range: {
                  timestamp: {
                    gte: `now-${window}`,
                  },
                },
              },
            ],
          },
        },
      },
    });

    return result.count;
  }

  private async triggerAlert(rule: AlertRule, count: number): Promise<void> {
    const message = rule.notification.template
      .replace('{{count}}', count.toString())
      .replace('{{service}}', process.env.APP_NAME ?? 'unknown');

    await this.notifier.send({
      channels: rule.notification.channels,
      severity: rule.severity,
      title: rule.name,
      message,
    });
  }
}
```

### 日志仪表盘设计

```typescript
// Grafana 仪表盘配置（JSON 格式）
const loggingDashboard = {
  title: '应用日志监控',
  panels: [
    {
      title: '日志级别分布',
      type: 'piechart',
      datasource: 'Elasticsearch',
      targets: [
        {
          query: '*',
          metrics: [{ type: 'count' }],
          bucketAggs: [
            {
              type: 'terms',
              field: 'level.keyword',
              settings: { size: '10' },
            },
          ],
        },
      ],
    },
    {
      title: '错误日志趋势',
      type: 'timeseries',
      datasource: 'Elasticsearch',
      targets: [
        {
          query: 'level:ERROR',
          metrics: [{ type: 'count' }],
          bucketAggs: [
            {
              type: 'date_histogram',
              field: 'timestamp',
              settings: { interval: '1m' },
            },
          ],
        },
      ],
    },
    {
      title: '响应时间百分位',
      type: 'timeseries',
      datasource: 'Elasticsearch',
      targets: [
        {
          query: 'message:"请求完成"',
          metrics: [
            { type: 'percentiles', field: 'duration', settings: { percents: ['50', '95', '99'] } },
          ],
          bucketAggs: [
            {
              type: 'date_histogram',
              field: 'timestamp',
              settings: { interval: '1m' },
            },
          ],
        },
      ],
    },
    {
      title: 'Top 10 错误类型',
      type: 'table',
      datasource: 'Elasticsearch',
      targets: [
        {
          query: 'level:ERROR',
          metrics: [{ type: 'count' }],
          bucketAggs: [
            {
              type: 'terms',
              field: 'error.type.keyword',
              settings: { size: '10', order: 'desc', orderBy: '_count' },
            },
          ],
        },
      ],
    },
    {
      title: '最近错误日志',
      type: 'logs',
      datasource: 'Elasticsearch',
      options: {
        showTime: true,
        showLabels: true,
        wrapLogMessage: true,
      },
      targets: [
        {
          query: 'level:ERROR OR level:FATAL',
          metrics: [{ type: 'logs' }],
        },
      ],
    },
  ],
};
```

## 日志最佳实践

### 日志内容规范

```typescript
// 日志内容最佳实践
const loggingGuidelines = {
  // 1. 使用结构化数据
  good: () => {
    logger.info('订单创建成功', {
      orderId: 'ORD-001',
      userId: 'U-1001',
      totalAmount: 199.99,
      itemCount: 3,
    });
  },
  bad: () => {
    logger.info('订单 ORD-001 由用户 U-1001 创建成功，金额 199.99，共 3 件商品');
  },

  // 2. 包含足够的上下文
  good2: () => {
    logger.error('支付失败', {
      orderId: 'ORD-001',
      paymentMethod: 'credit_card',
      errorCode: 'CARD_DECLINED',
      cardLast4: '4242',
      amount: 199.99,
    });
  },
  bad2: () => {
    logger.error('支付失败');
  },

  // 3. 避免敏感信息
  good3: () => {
    logger.info('用户登录', {
      userId: 'U-1001',
      ip: '192.168.1.1',
      // 不记录密码、完整信用卡号等
    });
  },
  bad3: () => {
    logger.info('用户登录', {
      email: 'user@example.com',
      password: 'secret123', // 绝对禁止！
    });
  },

  // 4. 使用一致的命名约定
  good4: () => {
    // 使用 camelCase，保持一致
    logger.info('操作完成', {
      userId: 'U-1001',
      orderId: 'ORD-001',
      processingTime: 150,
    });
  },
  bad4: () => {
    // 混用不同的命名风格
    logger.info('操作完成', {
      user_id: 'U-1001',
      'order-id': 'ORD-001',
      ProcessingTime: 150,
    });
  },

  // 5. 合理的日志量
  good5: () => {
    // 只在关键点记录日志
    logger.debug('开始处理订单', { orderId: 'ORD-001' });
    // ... 处理逻辑
    logger.info('订单处理完成', { orderId: 'ORD-001', status: 'success' });
  },
  bad5: () => {
    // 过度记录日志
    logger.debug('进入 processOrder 函数');
    logger.debug('验证订单参数');
    logger.debug('参数验证通过');
    logger.debug('开始查询库存');
    logger.debug('库存查询完成');
    // ... 每一行代码都记录日志
  },
};
```

### 敏感信息脱敏

```typescript
// 敏感信息脱敏工具
class LogSanitizer {
  private sensitiveFields = [
    'password',
    'secret',
    'token',
    'apiKey',
    'creditCard',
    'ssn',
    'authorization',
  ];

  private patterns = [
    // 信用卡号
    { pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, mask: '****-****-****-$1' },
    // 邮箱
    { pattern: /([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/g, mask: '***@$2' },
    // 手机号
    { pattern: /\b1[3-9]\d{9}\b/g, mask: (match: string) => match.slice(0, 3) + '****' + match.slice(7) },
    // IP 地址（可选）
    { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, mask: '*.*.*.***' },
  ];

  sanitize(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeString(String(obj));
    }

    const sanitized: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      // 检查是否为敏感字段
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value);
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private isSensitiveField(field: string): boolean {
    const lowerField = field.toLowerCase();
    return this.sensitiveFields.some((sensitive) =>
      lowerField.includes(sensitive.toLowerCase())
    );
  }

  private sanitizeString(str: string): string {
    let result = str;
    for (const { pattern, mask } of this.patterns) {
      if (typeof mask === 'function') {
        result = result.replace(pattern, mask);
      } else {
        result = result.replace(pattern, mask);
      }
    }
    return result;
  }
}

// 在日志输出中应用脱敏
class SanitizedLogger extends StructuredLogger {
  private sanitizer = new LogSanitizer();

  protected formatContext(context: Record<string, any>): Record<string, any> {
    return this.sanitizer.sanitize(context);
  }
}
```

### 日志采样

```typescript
// 高流量场景下的日志采样
class SampledLogger {
  private logger: StructuredLogger;
  private sampleRates: Map<string, number> = new Map();
  private counters: Map<string, number> = new Map();

  constructor(logger: StructuredLogger) {
    this.logger = logger;

    // 配置采样率
    this.sampleRates.set('DEBUG', 0.01); // 1% 的 DEBUG 日志
    this.sampleRates.set('INFO', 0.1); // 10% 的 INFO 日志
    this.sampleRates.set('WARN', 1.0); // 100% 的 WARN 日志
    this.sampleRates.set('ERROR', 1.0); // 100% 的 ERROR 日志
  }

  private shouldLog(level: string): boolean {
    const rate = this.sampleRates.get(level) ?? 1.0;

    // 使用计数器实现确定性采样
    const count = (this.counters.get(level) ?? 0) + 1;
    this.counters.set(level, count);

    return count % Math.round(1 / rate) === 0;
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog('INFO')) {
      this.logger.info(message, { ...context, sampled: true });
    }
  }

  // 根据请求特征动态调整采样
  infoWithDynamicSampling(
    message: string,
    context: Record<string, any> & { path?: string; statusCode?: number }
  ): void {
    let shouldLog = false;

    // 错误请求总是记录
    if (context.statusCode && context.statusCode >= 400) {
      shouldLog = true;
    }
    // 特定路径（如健康检查）低采样
    else if (context.path === '/health') {
      shouldLog = Math.random() < 0.001; // 0.1%
    }
    // 其他请求正常采样
    else {
      shouldLog = this.shouldLog('INFO');
    }

    if (shouldLog) {
      this.logger.info(message, context);
    }
  }
}
```

## 面试要点

### 核心概念题

**1. 为什么需要结构化日志？**

结构化日志采用标准化格式（如 JSON），相比纯文本日志具有以下优势：
- 易于解析和处理，支持自动化分析
- 支持复杂查询和聚合操作
- 便于添加上下文信息和元数据
- 兼容现代日志分析工具（如 Elasticsearch）

**2. 如何选择合适的日志级别？**

- TRACE/DEBUG：开发调试，生产环境通常关闭
- INFO：记录正常业务流程的关键节点
- WARN：潜在问题，需要关注但不影响运行
- ERROR：错误但可恢复，需要及时处理
- FATAL：致命错误，系统无法继续运行

**3. 日志采集的常见方案？**

- Agent 采集：Filebeat、Fluentd 部署在节点上
- Sidecar 模式：每个 Pod 旁边部署日志收集器
- SDK 直推：应用直接发送到日志服务
- 标准输出：容器环境将日志输出到 stdout/stderr

### 实践编码题

```typescript
// 实现一个带有请求上下文传递的日志系统
class ContextAwareLogger {
  // 使用 AsyncLocalStorage 在异步调用链中传递上下文
  private static storage = new AsyncLocalStorage<LogContext>();

  static runWithContext<T>(context: LogContext, fn: () => T): T {
    return this.storage.run(context, fn);
  }

  static getContext(): LogContext | undefined {
    return this.storage.getStore();
  }

  log(level: string, message: string, data?: any): void {
    const context = ContextAwareLogger.getContext();
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data,
      ...(context && {
        traceId: context.traceId,
        requestId: context.requestId,
        userId: context.userId,
      }),
    };
    console.log(JSON.stringify(entry));
  }
}

// 使用示例
app.use((req, res, next) => {
  const context = {
    traceId: req.headers['x-trace-id'] || uuid(),
    requestId: uuid(),
    userId: req.user?.id,
  };

  ContextAwareLogger.runWithContext(context, () => {
    next();
  });
});
```

### 性能优化建议

1. **异步写入**：日志写入不应阻塞主业务流程
2. **批量发送**：聚合多条日志一起发送，减少网络开销
3. **合理采样**：高流量场景下对低优先级日志进行采样
4. **本地缓冲**：使用内存缓冲区，定期刷新到持久化存储
5. **日志轮转**：定期归档旧日志，避免磁盘占满
6. **索引优化**：合理设计 Elasticsearch 索引，使用别名管理

## 延伸阅读

### 官方资源

- [OpenTelemetry Logging Specification](https://opentelemetry.io/docs/specs/otel/logs/)
- [Elasticsearch Logging Best Practices](https://www.elastic.co/guide/en/elasticsearch/reference/current/logging.html)
- [Grafana Loki Documentation](https://grafana.com/docs/loki/latest/)

### 推荐工具

- **日志收集**：Fluentd, Filebeat, Vector
- **日志存储**：Elasticsearch, ClickHouse, Loki
- **日志分析**：Kibana, Grafana
- **日志框架**：Winston (Node.js), Pino (Node.js), Logback (Java)

### 相关主题

- **分布式追踪**：与日志配合实现端到端可观测性
- **指标监控**：从日志中提取关键指标
- **告警系统**：基于日志模式触发告警
- **日志合规**：满足 GDPR、SOC2 等合规要求

---

> 本文系统介绍了日志系统的设计与最佳实践。良好的日志系统是构建可观测性体系的基础，建议在项目初期就规划好日志策略，并持续优化。记住：日志不只是记录，更是系统与开发者之间的对话。
