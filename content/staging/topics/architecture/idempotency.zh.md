---
title: 幂等性设计
description: 设计幂等 API 和操作以构建可靠分布式系统的全面指南
track: architecture
section: distributed
difficulty: intermediate
tags:
  - Idempotency
  - API Design
  - Distributed Systems
  - Reliability
  - Fault Tolerance
  - Retry Logic
  - Microservices
status: imported
origin: old/src/content/docs/architecture/idempotency.zh.md
divergence: 0.228
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Architecture
  subcategory: ""
  order: 6
  lastUpdated: 2026-01-21
---

在分布式系统中，网络故障、超时和重试是不可避免的。幂等性是一个关键的设计原则，它确保操作可以安全地重试而不会产生意外的副作用。本文探讨幂等性概念、实现模式以及构建能够优雅处理分布式计算现实的可靠系统的最佳实践。

## 概念解释

### 什么是幂等性？

**幂等性**是一种操作属性，执行多次与执行一次产生相同的结果。用数学术语来说，如果 `f(f(x)) = f(x)`，则操作 `f` 是幂等的。

```
幂等操作：
请求 1：创建用户 ID=123 → 用户已创建 (201)
请求 2：创建用户 ID=123 → 用户已存在 (200 或 409)
请求 3：创建用户 ID=123 → 用户已存在 (200 或 409)
                                      ↓
              结果：只存在一个 ID=123 的用户

非幂等操作：
请求 1：计数器加一 → 计数器 = 1
请求 2：计数器加一 → 计数器 = 2
请求 3：计数器加一 → 计数器 = 3
                                ↓
              结果：计数器增加了三次！
```

### 为什么幂等性很重要

在分布式系统中，几种场景使幂等性变得至关重要：

```
场景 1：网络超时
┌────────┐                        ┌────────┐
│  客户端 │ ─── 请求 ──────────▶  │  服务端 │
│        │                        │        │
│        │ ← (超时，无响应)       │ (已处理！)
│        │                        │        │
│        │ ─── 重试请求 ────────▶  │        │
│        │                        │ (重复！)
└────────┘                        └────────┘

没有幂等性：支付被扣款两次！
有幂等性：支付只扣款一次，第二个请求被忽略。

场景 2：客户端崩溃后重试
┌────────┐                        ┌────────┐
│  客户端 │ ─── 请求 ──────────▶  │  服务端 │
│        │                        │        │
│  崩溃！ │ ← 响应（丢失）         │ (已处理！)
│        │                        │        │
│(重启)   │                       │        │
│        │ ─── 相同请求 ────────▶ │        │
└────────┘                        └────────┘

没有幂等性：订单创建两次！
有幂等性：返回相同订单。
```

### HTTP 方法和幂等性

根据 HTTP 规范：

| 方法 | 幂等 | 安全 | 描述 |
|------|------|------|------|
| GET | 是 | 是 | 获取资源，无副作用 |
| HEAD | 是 | 是 | 类似 GET 但无响应体 |
| PUT | 是 | 否 | 替换整个资源 |
| DELETE | 是 | 否 | 删除资源 |
| POST | **否** | 否 | 创建资源，处理数据 |
| PATCH | **否** | 否 | 部分更新 |
| OPTIONS | 是 | 是 | 获取通信选项 |

```typescript
// GET - 天然幂等
GET /users/123
// 无论调用多少次都返回相同用户

// PUT - 设计上幂等
PUT /users/123
{ "name": "John", "email": "john@example.com" }
// 完全替换用户 123 - 每次结果相同

// DELETE - 幂等
DELETE /users/123
// 第一次调用：删除用户，返回 200/204
// 后续调用：用户未找到，返回 404（但状态相同）

// POST - 默认非幂等
POST /orders
{ "items": [...] }
// 每次调用创建新订单 - 重试时很危险！
```

### 非幂等操作的问题

```typescript
// 没有幂等性的支付处理
async function processPayment(amount: number, cardId: string): Promise<Payment> {
  const payment = await paymentGateway.charge({
    amount,
    cardId,
    timestamp: new Date()
  });

  return payment;
}

// 带重试逻辑的客户端代码
async function makePayment(amount: number, cardId: string): Promise<Payment> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await processPayment(amount, cardId);
    } catch (error) {
      if (error.code === 'TIMEOUT' && attempt < 2) {
        continue; // 重试 - 危险！支付可能已成功！
      }
      throw error;
    }
  }
}

// 结果：客户可能被收费 3 次！
```

## 核心原理

### 原理 1：幂等键

使用客户端生成的唯一键来标识请求：

```typescript
// 客户端为每个逻辑操作生成唯一键
interface IdempotentRequest {
  idempotencyKey: string;  // 客户端生成的 UUID
  payload: any;
}

// 服务端检查请求是否已处理
class IdempotentHandler {
  private processedRequests: Map<string, ProcessedResult> = new Map();

  async handle(request: IdempotentRequest): Promise<Response> {
    const { idempotencyKey, payload } = request;

    // 检查是否已处理
    const existing = await this.getProcessedResult(idempotencyKey);
    if (existing) {
      // 返回缓存结果
      return existing.response;
    }

    // 处理新请求
    const result = await this.processRequest(payload);

    // 存储结果供未来重复请求使用
    await this.storeResult(idempotencyKey, result);

    return result;
  }
}
```

### 原理 2：原子检查和处理

检查现有请求和处理必须是原子的：

```typescript
// 反模式：竞态条件
async function nonAtomicHandler(key: string, payload: any): Promise<Result> {
  const existing = await cache.get(key);
  if (existing) return existing;

  // 竞态条件窗口！另一个请求可能在检查和存储之间处理
  const result = await process(payload);
  await cache.set(key, result);

  return result;
}

// 更好：使用数据库事务或锁
async function atomicHandler(key: string, payload: any): Promise<Result> {
  return await database.transaction(async (tx) => {
    // 原子操作：锁定键
    const existing = await tx.query(
      'SELECT result FROM idempotency_keys WHERE key = $1 FOR UPDATE',
      [key]
    );

    if (existing.rows.length > 0) {
      return JSON.parse(existing.rows[0].result);
    }

    // 插入键以防止重复
    await tx.query(
      'INSERT INTO idempotency_keys (key, status) VALUES ($1, $2)',
      [key, 'processing']
    );

    // 处理
    const result = await process(payload);

    // 更新结果
    await tx.query(
      'UPDATE idempotency_keys SET result = $1, status = $2 WHERE key = $3',
      [JSON.stringify(result), 'completed', key]
    );

    return result;
  });
}
```

### 原理 3：天然幂等性

尽可能设计天然幂等的操作：

```typescript
// 非幂等：增量操作
UPDATE accounts SET balance = balance + 100 WHERE id = 123;
// 每次执行都改变状态

// 幂等：绝对值操作
UPDATE accounts SET balance = 1100 WHERE id = 123;
// 多次执行结果状态相同

// 非幂等：状态变更
UPDATE orders SET status = 'next_status' WHERE id = 123;
// 依赖当前状态

// 幂等：条件状态变更
UPDATE orders
SET status = 'shipped'
WHERE id = 123 AND status = 'paid';
// 只在预期状态时变更
```

### 原理 4：请求去重窗口

在合理的时间窗口内存储幂等结果：

```typescript
interface IdempotencyConfig {
  ttl: number;  // 存储结果的生存时间
  storageType: 'memory' | 'redis' | 'database';
}

class IdempotencyStore {
  private readonly ttl: number;

  constructor(config: IdempotencyConfig) {
    this.ttl = config.ttl || 24 * 60 * 60 * 1000; // 默认：24 小时
  }

  async store(key: string, result: any): Promise<void> {
    await this.storage.set(key, {
      result,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ttl
    });
  }

  async get(key: string): Promise<any | null> {
    const entry = await this.storage.get(key);

    if (!entry) return null;

    // 检查过期
    if (Date.now() > entry.expiresAt) {
      await this.storage.delete(key);
      return null;
    }

    return entry.result;
  }

  // 清理过期条目
  async cleanup(): Promise<void> {
    const now = Date.now();
    await this.storage.deleteWhere({ expiresAt: { $lt: now } });
  }
}
```

## 核心要点

### 幂等键策略

生成和管理幂等键的不同策略：

| 策略 | 示例 | 使用场景 |
|------|------|----------|
| UUID | `550e8400-e29b-41d4-a716-446655440000` | 通用，客户端生成 |
| 业务键 | `order-2024-001-payment` | 业务逻辑驱动的唯一性 |
| 请求哈希 | `sha256(payload)` | 自动去重相同请求 |
| 时间戳 + Nonce | `1705123456789-abc123` | 时间限定操作 |
| 组合键 | `user-123-action-pay-ref-456` | 组合多个标识符 |

```typescript
// 策略 1：客户端生成 UUID
const request = {
  idempotencyKey: crypto.randomUUID(),
  action: 'createPayment',
  amount: 100
};

// 策略 2：业务键
const businessKey = `payment-${orderId}-${paymentAttempt}`;

// 策略 3：请求体哈希
import { createHash } from 'crypto';
const requestHash = createHash('sha256')
  .update(JSON.stringify(requestBody))
  .digest('hex');

// 策略 4：组合键
const compositeKey = [
  userId,
  'transfer',
  destinationAccount,
  amount,
  new Date().toISOString().split('T')[0]  // 日期组件
].join(':');
```

### 状态管理

跟踪幂等操作的状态：

```typescript
enum IdempotencyState {
  PENDING = 'pending',      // 请求已接收，处理已开始
  PROCESSING = 'processing', // 正在处理
  COMPLETED = 'completed',   // 成功完成
  FAILED = 'failed'          // 失败（可能可重试）
}

interface IdempotencyRecord {
  key: string;
  state: IdempotencyState;
  request: any;
  response?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

class IdempotencyManager {
  async process<T>(
    key: string,
    request: any,
    operation: () => Promise<T>
  ): Promise<T> {
    // 尝试获取键
    const acquired = await this.tryAcquire(key, request);

    if (!acquired.isNew) {
      // 键存在 - 根据状态返回
      switch (acquired.record.state) {
        case IdempotencyState.COMPLETED:
          return acquired.record.response as T;

        case IdempotencyState.FAILED:
          throw new Error(acquired.record.error);

        case IdempotencyState.PROCESSING:
          // 仍在处理 - 客户端应稍后重试
          throw new ProcessingInProgressError(key);

        case IdempotencyState.PENDING:
          // 卡在 pending - 可能需要清理
          await this.handleStalePending(acquired.record);
          break;
      }
    }

    try {
      // 标记为处理中
      await this.updateState(key, IdempotencyState.PROCESSING);

      // 执行操作
      const result = await operation();

      // 标记为完成
      await this.updateState(key, IdempotencyState.COMPLETED, { response: result });

      return result;
    } catch (error) {
      // 标记为失败
      await this.updateState(key, IdempotencyState.FAILED, {
        error: error.message
      });
      throw error;
    }
  }
}
```

### 处理进行中的请求

当重复请求在原始请求仍在处理时到达：

```typescript
class ConcurrentRequestHandler {
  private processingLocks: Map<string, Promise<any>> = new Map();

  async handle<T>(key: string, operation: () => Promise<T>): Promise<T> {
    // 检查相同请求是否已在处理中
    const existingPromise = this.processingLocks.get(key);
    if (existingPromise) {
      // 等待现有操作完成
      return existingPromise;
    }

    // 检查持久化存储
    const stored = await this.storage.get(key);
    if (stored?.state === 'completed') {
      return stored.response;
    }

    // 为此操作创建新 promise
    const promise = this.executeWithLock(key, operation);
    this.processingLocks.set(key, promise);

    try {
      return await promise;
    } finally {
      this.processingLocks.delete(key);
    }
  }

  private async executeWithLock<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    // 多实例场景使用分布式锁
    const lock = await this.distributedLock.acquire(key, {
      ttl: 30000,  // 30 秒锁
      retries: 3
    });

    try {
      // 获取锁后再次检查存储
      const stored = await this.storage.get(key);
      if (stored?.state === 'completed') {
        return stored.response;
      }

      const result = await operation();
      await this.storage.set(key, {
        state: 'completed',
        response: result
      });

      return result;
    } finally {
      await lock.release();
    }
  }
}
```

## 代码示例

### 完整的幂等 API 实现

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Redis } from 'ioredis';

// 幂等键头
const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';

// 存储接口
interface IdempotencyEntry {
  status: 'processing' | 'completed' | 'failed';
  statusCode?: number;
  headers?: Record<string, string>;
  body?: any;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  private readonly redis: Redis;
  private readonly ttl = 24 * 60 * 60; // 24 小时

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // 只应用于 POST、PUT、PATCH
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers[IDEMPOTENCY_KEY_HEADER.toLowerCase()] as string;

    if (!idempotencyKey) {
      // 无幂等键 - 不保护继续
      return next();
    }

    const storageKey = this.buildStorageKey(req, idempotencyKey);

    // 尝试获取现有条目
    const existingEntry = await this.getEntry(storageKey);

    if (existingEntry) {
      return this.handleExistingEntry(res, existingEntry, storageKey);
    }

    // 尝试获取处理锁
    const acquired = await this.acquireLock(storageKey);

    if (!acquired) {
      // 另一个请求正在处理
      return res.status(409).json({
        error: 'Conflict',
        message: '使用此幂等键的请求正在处理中'
      });
    }

    // 捕获响应
    this.captureResponse(res, storageKey);

    next();
  }

  private buildStorageKey(req: Request, idempotencyKey: string): string {
    // 包含方法和路径以防止跨端点的键冲突
    return `idempotency:${req.method}:${req.path}:${idempotencyKey}`;
  }

  private async getEntry(key: string): Promise<IdempotencyEntry | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  private async acquireLock(key: string): Promise<boolean> {
    // 使用 SET NX（不存在则设置）进行原子锁获取
    const result = await this.redis.set(
      key,
      JSON.stringify({
        status: 'processing',
        createdAt: Date.now()
      }),
      'EX', this.ttl,
      'NX'
    );

    return result === 'OK';
  }

  private handleExistingEntry(
    res: Response,
    entry: IdempotencyEntry,
    key: string
  ) {
    switch (entry.status) {
      case 'processing':
        // 仍在处理 - 返回冲突
        return res.status(409).json({
          error: 'Conflict',
          message: '请求仍在处理中',
          retryAfter: 5
        });

      case 'completed':
        // 返回缓存响应
        res.set('X-Idempotency-Replayed', 'true');
        if (entry.headers) {
          Object.entries(entry.headers).forEach(([k, v]) => {
            if (k.toLowerCase() !== 'content-length') {
              res.set(k, v);
            }
          });
        }
        return res.status(entry.statusCode || 200).json(entry.body);

      case 'failed':
        // 返回缓存错误
        res.set('X-Idempotency-Replayed', 'true');
        return res.status(entry.statusCode || 500).json({
          error: entry.error
        });
    }
  }

  private captureResponse(res: Response, storageKey: string) {
    const originalJson = res.json.bind(res);

    res.json = (body: any) => {
      // 存储响应
      const entry: IdempotencyEntry = {
        status: res.statusCode >= 400 ? 'failed' : 'completed',
        statusCode: res.statusCode,
        headers: this.extractHeaders(res),
        body,
        createdAt: Date.now(),
        completedAt: Date.now()
      };

      // 异步存储 - 不阻塞响应
      this.redis.setex(
        storageKey,
        this.ttl,
        JSON.stringify(entry)
      ).catch(err => console.error('存储幂等条目失败：', err));

      return originalJson(body);
    };
  }

  private extractHeaders(res: Response): Record<string, string> {
    const headers: Record<string, string> = {};
    const headerNames = res.getHeaderNames();

    for (const name of headerNames) {
      const value = res.getHeader(name);
      if (typeof value === 'string') {
        headers[name] = value;
      }
    }

    return headers;
  }
}

// 在 NestJS 控制器中使用
@Controller('payments')
export class PaymentController {
  @Post()
  async createPayment(
    @Headers('Idempotency-Key') idempotencyKey: string,
    @Body() createPaymentDto: CreatePaymentDto
  ): Promise<Payment> {
    // 中间件处理幂等性
    // 此代码只为新请求运行
    return this.paymentService.create(createPaymentDto);
  }
}
```

### 基于数据库的幂等性

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

@Entity('idempotency_keys')
export class IdempotencyKey {
  @PrimaryColumn()
  key: string;

  @Column()
  requestPath: string;

  @Column()
  requestMethod: string;

  @Column('jsonb')
  requestBody: any;

  @Column({
    type: 'enum',
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  })
  status: string;

  @Column('jsonb', { nullable: true })
  response: any;

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;
}

@Injectable()
export class DatabaseIdempotencyService {
  constructor(
    @InjectRepository(IdempotencyKey)
    private readonly repository: Repository<IdempotencyKey>,
    private readonly dataSource: DataSource
  ) {}

  async executeIdempotent<T>(
    key: string,
    request: { path: string; method: string; body: any },
    operation: () => Promise<T>,
    ttlMs: number = 24 * 60 * 60 * 1000
  ): Promise<{ result: T; isReplay: boolean }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 尝试使用咨询锁插入新键
      const existing = await queryRunner.manager.findOne(IdempotencyKey, {
        where: { key },
        lock: { mode: 'pessimistic_write' }
      });

      if (existing) {
        await queryRunner.commitTransaction();
        return this.handleExisting(existing);
      }

      // 插入新记录
      const record = new IdempotencyKey();
      record.key = key;
      record.requestPath = request.path;
      record.requestMethod = request.method;
      record.requestBody = request.body;
      record.status = 'processing';
      record.createdAt = new Date();
      record.expiresAt = new Date(Date.now() + ttlMs);

      await queryRunner.manager.save(record);
      await queryRunner.commitTransaction();

      // 在事务外执行操作
      try {
        const result = await operation();

        // 更新记录与结果
        await this.repository.update(key, {
          status: 'completed',
          response: result,
          completedAt: new Date()
        });

        return { result, isReplay: false };
      } catch (error) {
        // 更新记录与错误
        await this.repository.update(key, {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date()
        });
        throw error;
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async handleExisting<T>(
    existing: IdempotencyKey
  ): Promise<{ result: T; isReplay: boolean }> {
    switch (existing.status) {
      case 'completed':
        return {
          result: existing.response as T,
          isReplay: true
        };

      case 'failed':
        throw new Error(existing.errorMessage);

      case 'processing':
        // 等待并重试
        await this.sleep(1000);
        const updated = await this.repository.findOne({
          where: { key: existing.key }
        });
        if (updated) {
          return this.handleExisting(updated);
        }
        throw new Error('幂等键处理超时');

      default:
        throw new Error(`未知状态：${existing.status}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 清理过期键
  async cleanupExpired(): Promise<number> {
    const result = await this.repository.delete({
      expiresAt: LessThan(new Date())
    });
    return result.affected || 0;
  }
}
```

### 幂等消息处理

```typescript
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

interface Message {
  id: string;
  payload: any;
  timestamp: number;
}

@Injectable()
export class IdempotentMessageProcessor {
  private readonly redis: Redis;
  private readonly processingTimeout = 30000; // 30 秒
  private readonly deduplicationWindow = 7 * 24 * 60 * 60; // 7 天

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async processMessage<T>(
    message: Message,
    handler: (payload: any) => Promise<T>
  ): Promise<{ result: T | null; status: 'processed' | 'duplicate' | 'error' }> {
    const messageKey = `msg:${message.id}`;

    // 检查消息是否已处理
    const existing = await this.redis.get(messageKey);

    if (existing) {
      const record = JSON.parse(existing);

      if (record.status === 'completed') {
        console.log(`消息 ${message.id} 已处理，跳过`);
        return { result: record.result, status: 'duplicate' };
      }

      if (record.status === 'processing') {
        // 检查处理是否过期
        if (Date.now() - record.startedAt > this.processingTimeout) {
          // 过期处理 - 接管
          console.log(`接管消息 ${message.id} 的过期处理`);
        } else {
          // 仍被另一个消费者处理
          return { result: null, status: 'duplicate' };
        }
      }
    }

    // 标记为处理中
    const processingRecord = {
      status: 'processing',
      startedAt: Date.now()
    };

    const acquired = await this.redis.set(
      messageKey,
      JSON.stringify(processingRecord),
      'EX', this.deduplicationWindow,
      'NX'
    );

    if (!acquired) {
      // 竞争失败 - 另一个消费者获取了它
      return { result: null, status: 'duplicate' };
    }

    try {
      // 处理消息
      const result = await handler(message.payload);

      // 标记为完成
      await this.redis.setex(
        messageKey,
        this.deduplicationWindow,
        JSON.stringify({
          status: 'completed',
          result,
          processedAt: Date.now()
        })
      );

      return { result, status: 'processed' };
    } catch (error) {
      // 标记为失败
      await this.redis.setex(
        messageKey,
        this.deduplicationWindow,
        JSON.stringify({
          status: 'failed',
          error: error.message,
          failedAt: Date.now()
        })
      );

      throw error;
    }
  }

  // 用于精确一次语义的有序消息处理
  async processOrderedMessages<T>(
    consumerId: string,
    streamKey: string,
    handler: (message: Message) => Promise<T>
  ): Promise<void> {
    const lastProcessedKey = `consumer:${consumerId}:lastProcessed`;

    while (true) {
      // 获取最后处理的消息 ID
      const lastId = await this.redis.get(lastProcessedKey) || '0';

      // 读取新消息
      const messages = await this.redis.xread(
        'BLOCK', 5000,
        'STREAMS', streamKey, lastId
      );

      if (!messages) continue;

      for (const [streamName, entries] of messages) {
        for (const [messageId, fields] of entries) {
          const message: Message = {
            id: messageId,
            payload: this.parseFields(fields),
            timestamp: this.extractTimestamp(messageId)
          };

          // 幂等处理
          const { status } = await this.processMessage(message, handler);

          if (status === 'processed' || status === 'duplicate') {
            // 更新检查点
            await this.redis.set(lastProcessedKey, messageId);
          }
        }
      }
    }
  }

  private parseFields(fields: string[]): any {
    const obj: any = {};
    for (let i = 0; i < fields.length; i += 2) {
      obj[fields[i]] = JSON.parse(fields[i + 1]);
    }
    return obj;
  }

  private extractTimestamp(messageId: string): number {
    return parseInt(messageId.split('-')[0], 10);
  }
}
```

## 最佳实践

### 1. 始终为修改操作使用幂等键

```typescript
// 客户端：为每个唯一操作生成键
class ApiClient {
  async createOrder(order: CreateOrderRequest): Promise<Order> {
    // 生成一次键并在重试时重用
    const idempotencyKey = this.generateIdempotencyKey(order);

    return this.retryWithIdempotency(
      () => this.http.post('/orders', order, {
        headers: { 'Idempotency-Key': idempotencyKey }
      }),
      { maxRetries: 3 }
    );
  }

  private generateIdempotencyKey(order: CreateOrderRequest): string {
    // 选项 1：UUID
    return crypto.randomUUID();

    // 选项 2：从内容确定性生成
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(order))
      .digest('hex');
  }
}
```

### 2. 验证幂等键请求匹配

```typescript
class StrictIdempotencyService {
  async process(
    key: string,
    request: { method: string; path: string; body: any },
    operation: () => Promise<any>
  ): Promise<any> {
    const existing = await this.storage.get(key);

    if (existing) {
      // 验证请求匹配
      const requestHash = this.hashRequest(request);

      if (existing.requestHash !== requestHash) {
        throw new IdempotencyKeyConflictError(
          '幂等键已用于不同的请求参数'
        );
      }

      return existing.response;
    }

    // 存储时带上请求哈希用于验证
    const result = await operation();

    await this.storage.set(key, {
      requestHash: this.hashRequest(request),
      response: result,
      createdAt: Date.now()
    });

    return result;
  }

  private hashRequest(request: { method: string; path: string; body: any }): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify({
        method: request.method,
        path: request.path,
        body: request.body
      }))
      .digest('hex');
  }
}
```

### 3. 处理部分失败

```typescript
class IdempotentSagaExecutor {
  async execute(
    sagaId: string,
    steps: SagaStep[]
  ): Promise<SagaResult> {
    const saga = await this.getSagaState(sagaId);

    if (saga?.status === 'completed') {
      return saga.result;
    }

    // 从上次中断处恢复
    const startIndex = saga?.completedSteps?.length || 0;

    for (let i = startIndex; i < steps.length; i++) {
      const step = steps[i];
      const stepKey = `${sagaId}:step:${i}`;

      // 每步都是幂等的
      const stepResult = await this.executeIdempotentStep(stepKey, step);

      // 每步后更新 saga 状态
      await this.updateSagaState(sagaId, {
        completedSteps: [...(saga?.completedSteps || []), stepResult],
        currentStep: i + 1
      });
    }

    // 标记 saga 为完成
    const finalState = await this.getSagaState(sagaId);
    await this.updateSagaState(sagaId, {
      status: 'completed',
      result: this.buildResult(finalState.completedSteps)
    });

    return finalState.result;
  }
}
```

### 4. 设置适当的 TTL

```typescript
// 不同用例的不同 TTL
const IDEMPOTENCY_TTLS = {
  // 短期：API 请求（可能在几分钟内重试）
  apiRequest: 24 * 60 * 60,  // 24 小时

  // 中期：Webhook 投递（可能在几小时内重试）
  webhookDelivery: 7 * 24 * 60 * 60,  // 7 天

  // 长期：金融交易（监管要求）
  financialTransaction: 90 * 24 * 60 * 60,  // 90 天

  // 超长期：合规敏感操作
  auditableOperation: 365 * 24 * 60 * 60  // 1 年
};

class ConfigurableIdempotencyService {
  async process(
    key: string,
    operation: () => Promise<any>,
    options: { ttlSeconds?: number; category?: keyof typeof IDEMPOTENCY_TTLS }
  ): Promise<any> {
    const ttl = options.ttlSeconds ||
      IDEMPOTENCY_TTLS[options.category || 'apiRequest'];

    // ... 使用配置 TTL 的实现
  }
}
```

## 常见陷阱

### 1. 不处理进行中状态

```typescript
// 反模式：忽略进行中的请求
class BrokenIdempotency {
  async process(key: string, operation: () => Promise<any>): Promise<any> {
    const existing = await this.storage.get(key);
    if (existing) {
      return existing.result; // 如果状态是 'processing' 怎么办？
    }

    await this.storage.set(key, { status: 'processing' });
    const result = await operation();
    await this.storage.set(key, { status: 'completed', result });

    return result;
  }
}

// 更好：处理所有状态
class RobustIdempotency {
  async process(key: string, operation: () => Promise<any>): Promise<any> {
    const existing = await this.storage.get(key);

    if (existing) {
      switch (existing.status) {
        case 'completed':
          return existing.result;

        case 'failed':
          throw new Error(existing.error);

        case 'processing':
          // 等待并再次检查，或返回特定响应
          if (Date.now() - existing.startedAt > 30000) {
            // 过期 - 清理并重试
            await this.storage.delete(key);
            break;
          }
          throw new RequestInProgressError(key);
      }
    }

    // ... 其余实现
  }
}
```

### 2. 检查和设置的竞态条件

```typescript
// 反模式：非原子检查和设置
async function racyIdempotency(key: string): Promise<void> {
  const exists = await cache.exists(key);  // 检查
  if (exists) return;

  // 另一个进程可能在此间隙插入！

  await cache.set(key, 'processing');  // 设置
  await doOperation();
}

// 更好：原子操作
async function atomicIdempotency(key: string): Promise<void> {
  // SET NX 是原子的 - 只在不存在时设置
  const acquired = await redis.set(key, 'processing', 'NX', 'EX', 3600);

  if (!acquired) {
    // 键已存在
    return;
  }

  await doOperation();
}
```

### 3. 使用可变键

```typescript
// 反模式：随时间戳变化的键
const badKey = `order:${userId}:${Date.now()}`;
// 每次重试生成新键！

// 更好：从请求内容生成稳定键
const goodKey = `order:${userId}:${cartId}:${checkoutSessionId}`;
// 相同逻辑操作的重试使用相同键
```

### 4. 处理前不持久化

```typescript
// 反模式：持久化键前先处理
async function badOrder(key: string): Promise<void> {
  const result = await processOrder();  // 如果这个成功...
  await saveIdempotencyKey(key, result);  // ...但这个失败？
  // 重试会再次处理订单！
}

// 更好：先持久化键
async function goodOrder(key: string): Promise<void> {
  // 先标记为处理中
  const acquired = await tryAcquireKey(key);
  if (!acquired) return getExistingResult(key);

  try {
    const result = await processOrder();
    await markKeyCompleted(key, result);
    return result;
  } catch (error) {
    await markKeyFailed(key, error);
    throw error;
  }
}
```

## 性能考量

### 缓存策略

```typescript
class TieredIdempotencyCache {
  private localCache: LRUCache<string, IdempotencyRecord>;
  private redis: Redis;

  async get(key: string): Promise<IdempotencyRecord | null> {
    // L1：本地缓存（最快）
    const local = this.localCache.get(key);
    if (local) return local;

    // L2：Redis（跨实例共享）
    const remote = await this.redis.get(key);
    if (remote) {
      const record = JSON.parse(remote);
      this.localCache.set(key, record);
      return record;
    }

    return null;
  }

  async set(key: string, record: IdempotencyRecord): Promise<void> {
    // 写入两个缓存
    await Promise.all([
      this.redis.setex(key, 86400, JSON.stringify(record)),
      this.localCache.set(key, record)
    ]);
  }
}
```

### 批量处理

```typescript
class BatchIdempotencyChecker {
  async checkBatch(keys: string[]): Promise<Map<string, IdempotencyRecord | null>> {
    // 多个键的单次往返
    const results = await this.redis.mget(keys);

    return new Map(
      keys.map((key, i) => [
        key,
        results[i] ? JSON.parse(results[i]) : null
      ])
    );
  }
}
```

## 实战场景

### 场景：支付处理

```typescript
class PaymentService {
  async processPayment(
    idempotencyKey: string,
    payment: PaymentRequest
  ): Promise<PaymentResult> {
    return this.idempotency.execute(
      idempotencyKey,
      async () => {
        // 验证支付
        await this.validatePayment(payment);

        // 基于业务规则检查重复
        const existingPayment = await this.findExistingPayment(
          payment.orderId,
          payment.amount
        );

        if (existingPayment) {
          return existingPayment;
        }

        // 通过支付网关处理
        const gatewayResult = await this.paymentGateway.charge({
          amount: payment.amount,
          currency: payment.currency,
          cardToken: payment.cardToken,
          idempotencyKey  // 也传递给网关！
        });

        // 存储结果
        const paymentRecord = await this.savePayment({
          id: generateId(),
          orderId: payment.orderId,
          amount: payment.amount,
          gatewayTransactionId: gatewayResult.transactionId,
          status: 'completed'
        });

        return paymentRecord;
      }
    );
  }
}
```

### 场景：订单创建

```typescript
class OrderService {
  async createOrder(
    idempotencyKey: string,
    request: CreateOrderRequest
  ): Promise<Order> {
    return this.idempotency.execute(
      idempotencyKey,
      async () => {
        // 创建订单包含嵌套的幂等操作
        const order = await this.orderRepository.create({
          id: generateId(),
          customerId: request.customerId,
          items: request.items,
          status: 'pending'
        });

        // 预留库存（幂等）
        await this.inventoryService.reserve({
          orderId: order.id,
          items: request.items,
          idempotencyKey: `${idempotencyKey}:inventory`
        });

        // 初始化支付（幂等）
        await this.paymentService.initiate({
          orderId: order.id,
          amount: order.total,
          idempotencyKey: `${idempotencyKey}:payment`
        });

        return order;
      }
    );
  }
}
```

## 面试要点

### 核心理解

**问题 1：什么是幂等性，为什么它很重要？**

幂等性意味着操作执行一次或多次产生相同结果。它在分布式系统中至关重要，因为：
- 网络故障需要重试
- 可能发生重复消息
- 客户端可能在超时时重试而不知道操作是否成功
- 它使安全重试逻辑成为可能而不会损坏数据

**问题 2：如何为 POST 端点实现幂等性？**

使用幂等键：
1. 客户端在请求头中发送唯一键
2. 服务端检查键是否已见过
3. 如果见过，返回缓存响应
4. 如果是新的，处理请求并用键缓存响应
5. 使用原子操作防止竞态条件

**问题 3：天然幂等性和显式幂等性有什么区别？**

- **天然幂等性**：操作本质上是幂等的（例如，将值设置为 100）
- **显式幂等性**：使用幂等键等机制使非幂等操作对重试安全

### 技术问题

**问题 4：如何处理并发重复请求？**

```typescript
// 使用分布式锁
const lock = await redis.set(key, 'processing', 'NX', 'EX', 30);
if (!lock) {
  // 等待并检查结果，或返回 409 Conflict
}
// 处理并存储结果
```

**问题 5：如果幂等性存储失败会发生什么？**

选项：
1. 请求失败（对金融操作最安全）
2. 不使用幂等性继续（对不太关键的操作可接受）
3. 使用备用存储
4. 实现断路器模式

## 延伸阅读

### 官方资源

- [Stripe 幂等性](https://stripe.com/docs/api/idempotent_requests) - 行业领先实现
- [AWS API Gateway 幂等性](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-private.html)
- [Google Cloud API 设计指南](https://cloud.google.com/apis/design/design_patterns#request_duplication)

### 书籍

- 《数据密集型应用系统设计》Martin Kleppmann 著 - 事务章节
- 《微服务架构设计》Sam Newman 著 - 分布式系统模式
- 《发布！软件的设计与部署》Michael Nygard 著 - 稳定性模式

### 技术文章

- [实现类 Stripe 的幂等键](https://brandur.org/idempotency-keys)
- [Kafka 中的精确一次语义](https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-kafka-does-it/)
- [使用幂等 API 实现安全重试](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)

### 工具

- [Redis](https://redis.io/) - 用于分布式幂等键存储
- [Temporal](https://temporal.io/) - 内置幂等性的工作流引擎
- [AWS Lambda Powertools](https://awslabs.github.io/aws-lambda-powertools-python/latest/utilities/idempotency/) - 幂等性工具

---

幂等性是构建可靠分布式系统的基本原则。通过实现适当的幂等性机制，你可以创建能够优雅处理重试、网络故障和重复请求的 API，而不会产生意外的副作用。记住幂等性不仅仅是防止重复操作 - 它是在不可靠的分布式环境中为客户端提供一致和可预测体验的关键。
