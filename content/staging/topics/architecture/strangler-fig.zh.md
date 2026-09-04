---
title: 绞杀者模式
description: 深入理解绞杀者模式：一种渐进式迁移遗留系统到现代架构的架构策略
track: architecture
section: design-patterns
difficulty: intermediate
tags:
  - 绞杀者模式
  - 系统迁移
  - 遗留系统
  - 微服务
  - 重构
  - 架构模式
status: imported
origin: old/src/content/docs/architecture/strangler-fig.zh.md
divergence: 0.221
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Architecture
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-21
---

绞杀者模式（Strangler Fig Pattern）是一种强大的架构迁移策略，使组织能够渐进式地将遗留系统替换为现代实现。该模式以绞杀榕树命名——这种榕树会逐渐包裹并替代其宿主树。本模式允许团队在保持系统持续运行的同时，逐步迁移复杂系统的各个部分。本文将探讨该模式的起源、实现策略以及成功进行遗留系统现代化的最佳实践。

## 概念解释

### 什么是绞杀者模式？

**绞杀者模式**是一种渐进式迁移策略，允许你通过将特定功能路由到新实现来逐步替换遗留系统，同时保持旧系统正常运行。与尝试风险较高的"大爆炸"式重写不同，你可以通过拦截调用并将其重定向到新组件来系统性地"绞杀"旧系统。

```
┌─────────────────────────────────────────────────────────────────┐
│                          初始状态                                │
│  ┌─────────┐         ┌──────────────────────────────────────┐  │
│  │  客户端  │ ──────► │           遗留系统                    │  │
│  └─────────┘         │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │  │
│                      │  │ A  │ │ B  │ │ C  │ │ D  │ │ E  │ │  │
│                      │  └────┘ └────┘ └────┘ └────┘ └────┘ │  │
│                      └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        迁移进行中                                │
│  ┌─────────┐         ┌─────────────┐                            │
│  │  客户端  │ ──────► │    门面     │                            │
│  └─────────┘         │   (路由器)   │                            │
│                      └──────┬──────┘                            │
│                       ┌─────┴─────┐                             │
│                       ▼           ▼                             │
│              ┌──────────────┐  ┌──────────────────────────┐    │
│              │   新系统     │  │        遗留系统           │    │
│              │  ┌────┐      │  │  ┌────┐ ┌────┐ ┌────┐   │    │
│              │  │ A' │      │  │  │ B  │ │ C  │ │ D  │   │    │
│              │  └────┘      │  │  └────┘ └────┘ └────┘   │    │
│              └──────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          最终状态                                │
│  ┌─────────┐         ┌──────────────────────────────────────┐  │
│  │  客户端  │ ──────► │            新系统                     │  │
│  └─────────┘         │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │  │
│                      │  │ A' │ │ B' │ │ C' │ │ D' │ │ E' │ │  │
│                      │  └────┘ └────┘ └────┘ └────┘ └────┘ │  │
│                      └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 历史与起源

Martin Fowler 于 2004 年创造了"绞杀者应用"这个术语，灵感来自他在澳大利亚观察到的绞杀榕树：

> "这个地区的自然奇观之一是巨大的绞杀榕树。它们在宿主树的上层枝干中发芽，逐渐向下生长直到根部扎入土壤。经过多年的生长，它们形成了奇妙而美丽的形态，同时绞杀并杀死了作为宿主的树木。"

这个生物学隐喻完美地描述了遗留系统的逐步替换过程：

| 阶段 | 绞杀榕树 | 软件迁移 |
|-----|---------|---------|
| 播种 | 榕树种子落在宿主树冠 | 新组件拦截第一个功能 |
| 生长 | 根系向地面生长 | 更多功能迁移到新系统 |
| 建立 | 根系到达土壤 | 新系统成为主系统 |
| 替换 | 宿主树死亡，榕树独立 | 遗留系统退役 |

### 为什么使用绞杀者模式？

传统的"大爆炸"式重写存在重大风险：

```
大爆炸重写风险：
├── 技术风险
│   ├── 需求理解不完整
│   ├── 遗留代码中的未知边界情况
│   ├── 集成失败
│   └── 性能回退
├── 业务风险
│   ├── 延长的停机时间
│   ├── 迁移期间收入损失
│   ├── 客户不满
│   └── 竞争劣势
└── 组织风险
    ├── 长期项目导致团队疲劳
    ├── 知识孤岛
    └── 利益相关者信心丧失
```

绞杀者模式通过以下方式减轻这些风险：

1. **持续交付**：新功能增量交付
2. **可逆性**：出现问题时易于回滚
3. **风险分散**：风险分散在多个较小的变更中
4. **学习机会**：团队通过渐进迁移了解领域
5. **业务连续性**：系统在整个过程中保持运行

### 何时使用此模式

**适合的场景：**

- 需要现代化的单体应用
- 具有清晰功能边界的系统
- 具有稳定、定义良好接口的应用
- 具有持续交付能力的组织

**不适合的场景：**

- 没有清晰接缝的紧耦合系统
- 迁移期间有严格性能要求的系统
- 具有复杂、未文档化业务逻辑的应用
- 缺乏基础设施自动化技能的团队

## 核心原理

### 绞杀者门面

门面是实现渐进迁移的关键组件。它拦截所有请求并将其路由到遗留系统或新系统：

```typescript
// 绞杀者门面实现
interface RoutingDecision {
  target: 'legacy' | 'new';
  reason: string;
}

class StranglerFacade {
  private featureFlags: Map<string, boolean>;
  private routingRules: Map<string, (request: Request) => RoutingDecision>;

  constructor() {
    this.featureFlags = new Map();
    this.routingRules = new Map();
  }

  // 为特定路径注册路由规则
  registerRoute(
    path: string,
    rule: (request: Request) => RoutingDecision
  ): void {
    this.routingRules.set(path, rule);
  }

  // 启用/禁用功能标志
  setFeatureFlag(feature: string, enabled: boolean): void {
    this.featureFlags.set(feature, enabled);
  }

  // 路由传入请求
  async route(request: Request): Promise<Response> {
    const path = this.extractPath(request);
    const rule = this.routingRules.get(path);

    if (!rule) {
      // 如果没有规则，默认使用遗留系统
      return this.routeToLegacy(request);
    }

    const decision = rule(request);

    // 记录路由决策以便监控
    this.logRoutingDecision(request, decision);

    if (decision.target === 'new') {
      try {
        const response = await this.routeToNew(request);
        return response;
      } catch (error) {
        // 出错时回退到遗留系统（断路器模式）
        this.logFallback(request, error);
        return this.routeToLegacy(request);
      }
    }

    return this.routeToLegacy(request);
  }

  private async routeToLegacy(request: Request): Promise<Response> {
    return fetch(`${LEGACY_URL}${request.url}`, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
  }

  private async routeToNew(request: Request): Promise<Response> {
    return fetch(`${NEW_SYSTEM_URL}${request.url}`, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
  }
}
```

### 资产捕获模式

在开始绞杀之前，你必须"捕获"资产——识别并记录所有需要迁移的功能：

```typescript
// 资产捕获 - 记录遗留功能
interface LegacyAsset {
  id: string;
  name: string;
  description: string;
  endpoints: string[];
  dependencies: string[];
  dataStores: string[];
  businessRules: BusinessRule[];
  complexity: 'low' | 'medium' | 'high';
  priority: number;
  migrationStatus: 'not-started' | 'in-progress' | 'completed' | 'verified';
}

interface BusinessRule {
  id: string;
  description: string;
  implementation: string;
  testCases: TestCase[];
}

// 用于迁移规划的资产清单
class AssetInventory {
  private assets: Map<string, LegacyAsset> = new Map();

  addAsset(asset: LegacyAsset): void {
    this.assets.set(asset.id, asset);
  }

  // 根据依赖关系和优先级获取迁移顺序
  getMigrationOrder(): LegacyAsset[] {
    const sorted: LegacyAsset[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (assetId: string) => {
      if (visited.has(assetId)) return;
      if (visiting.has(assetId)) {
        throw new Error(`检测到循环依赖: ${assetId}`);
      }

      visiting.add(assetId);
      const asset = this.assets.get(assetId)!;

      // 首先访问依赖项
      for (const depId of asset.dependencies) {
        if (this.assets.has(depId)) {
          visit(depId);
        }
      }

      visiting.delete(assetId);
      visited.add(assetId);
      sorted.push(asset);
    };

    // 按优先级排序，然后处理依赖关系
    const byPriority = [...this.assets.values()]
      .sort((a, b) => a.priority - b.priority);

    for (const asset of byPriority) {
      visit(asset.id);
    }

    return sorted;
  }

  // 计算迁移进度
  getProgress(): MigrationProgress {
    const total = this.assets.size;
    const completed = [...this.assets.values()]
      .filter(a => a.migrationStatus === 'verified').length;
    const inProgress = [...this.assets.values()]
      .filter(a => a.migrationStatus === 'in-progress').length;

    return {
      total,
      completed,
      inProgress,
      percentComplete: (completed / total) * 100
    };
  }
}
```

### 事件拦截

对于事件驱动的系统，在迁移期间拦截并复制事件：

```typescript
// 用于渐进迁移的事件拦截
interface DomainEvent {
  id: string;
  type: string;
  timestamp: Date;
  payload: unknown;
  metadata: EventMetadata;
}

class EventInterceptor {
  private legacyHandler: EventHandler;
  private newHandler: EventHandler;
  private comparisonMode: boolean = true;

  constructor(
    legacyHandler: EventHandler,
    newHandler: EventHandler
  ) {
    this.legacyHandler = legacyHandler;
    this.newHandler = newHandler;
  }

  async handleEvent(event: DomainEvent): Promise<void> {
    // 在迁移期间，发送到两个系统
    if (this.comparisonMode) {
      const [legacyResult, newResult] = await Promise.allSettled([
        this.legacyHandler.handle(event),
        this.newHandler.handle(event)
      ]);

      // 比较结果以进行验证
      await this.compareResults(event, legacyResult, newResult);

      // 遗留系统仍然是权威的
      if (legacyResult.status === 'rejected') {
        throw legacyResult.reason;
      }
    } else {
      // 迁移完成后，仅使用新系统
      await this.newHandler.handle(event);
    }
  }

  private async compareResults(
    event: DomainEvent,
    legacyResult: PromiseSettledResult<EventResult>,
    newResult: PromiseSettledResult<EventResult>
  ): Promise<void> {
    const comparison: ResultComparison = {
      eventId: event.id,
      eventType: event.type,
      timestamp: new Date(),
      legacyStatus: legacyResult.status,
      newStatus: newResult.status,
      match: this.resultsMatch(legacyResult, newResult)
    };

    // 记录比较结果以供分析
    await this.logComparison(comparison);

    if (!comparison.match) {
      // 在发现差异时发出警报
      await this.alertDiscrepancy(comparison);
    }
  }
}
```

### 数据迁移策略

数据迁移通常是最具挑战性的方面：

```typescript
// 数据迁移的双写模式
class DualWriteRepository<T extends Entity> {
  private legacyRepo: Repository<T>;
  private newRepo: Repository<T>;
  private migrationPhase: 'legacy-primary' | 'new-primary' | 'new-only';

  async save(entity: T): Promise<T> {
    switch (this.migrationPhase) {
      case 'legacy-primary':
        // 首先写入遗留系统（权威）
        const legacyResult = await this.legacyRepo.save(entity);
        // 异步写入新系统（发送后忘记，带重试）
        this.writeToNewAsync(entity);
        return legacyResult;

      case 'new-primary':
        // 首先写入新系统（权威）
        const newResult = await this.newRepo.save(entity);
        // 异步写入遗留系统以备回退
        this.writeToLegacyAsync(entity);
        return newResult;

      case 'new-only':
        // 遗留系统已完全被绞杀
        return this.newRepo.save(entity);
    }
  }

  async read(id: string): Promise<T | null> {
    switch (this.migrationPhase) {
      case 'legacy-primary':
        return this.legacyRepo.findById(id);

      case 'new-primary':
        const entity = await this.newRepo.findById(id);
        if (!entity) {
          // 在过渡期间回退到遗留系统
          return this.legacyRepo.findById(id);
        }
        return entity;

      case 'new-only':
        return this.newRepo.findById(id);
    }
  }

  private async writeToNewAsync(entity: T): Promise<void> {
    try {
      await this.newRepo.save(entity);
    } catch (error) {
      // 排队重试
      await this.retryQueue.enqueue({
        operation: 'save',
        entity,
        target: 'new',
        error
      });
    }
  }
}

// 历史数据的数据同步
class DataSynchronizer<T extends Entity> {
  async synchronize(
    source: Repository<T>,
    target: Repository<T>,
    options: SyncOptions
  ): Promise<SyncResult> {
    const result: SyncResult = {
      processed: 0,
      synced: 0,
      failed: 0,
      errors: []
    };

    // 分批流式处理数据以避免内存问题
    const stream = source.streamAll({ batchSize: options.batchSize });

    for await (const batch of stream) {
      result.processed += batch.length;

      const transformed = await Promise.all(
        batch.map(entity => this.transform(entity))
      );

      try {
        await target.saveMany(transformed);
        result.synced += batch.length;
      } catch (error) {
        result.failed += batch.length;
        result.errors.push({
          batch: batch.map(e => e.id),
          error: error.message
        });
      }

      // 进度回调
      if (options.onProgress) {
        options.onProgress(result);
      }
    }

    return result;
  }

  private async transform(entity: T): Promise<T> {
    // 应用新模式所需的任何转换
    return entity;
  }
}
```

## 核心要点

### 迁移阶段

典型的绞杀者迁移经历不同的阶段：

```
阶段 1：评估与规划
├── 清点遗留资产
├── 映射依赖关系
├── 定义迁移顺序
├── 设置监控
└── 建立回滚程序

阶段 2：基础设施
├── 部署绞杀者门面
├── 设置双重基础设施
├── 实现功能标志
├── 创建比较测试
└── 建立指标基线

阶段 3：增量迁移
├── 迁移第一个组件（低风险）
├── 使用影子流量验证
├── 提升到生产流量
├── 监控和比较
└── 对剩余组件重复

阶段 4：完成
├── 迁移最后的组件
├── 移除遗留依赖
├── 退役遗留系统
├── 归档遗留代码/数据
└── 记录经验教训
```

### 组件选择标准

谨慎选择初始迁移的组件：

```typescript
interface MigrationCandidate {
  component: string;
  factors: MigrationFactors;
  score: number;
}

interface MigrationFactors {
  // 技术因素
  couplingLevel: number;        // 1-10，越低越好
  testCoverage: number;         // 百分比
  documentationQuality: number; // 1-10
  technicalDebt: number;        // 1-10，越低越好

  // 业务因素
  businessValue: number;        // 1-10
  userImpact: number;           // 1-10，首次迁移越低越好
  changeFrequency: number;      // 每月变更次数

  // 风险因素
  rollbackComplexity: number;   // 1-10，越低越好
  dataComplexity: number;       // 1-10，越低越好
}

function calculateMigrationPriority(
  candidate: MigrationCandidate
): number {
  const { factors } = candidate;

  // 首次迁移的加权评分
  // 偏好：低耦合、高测试覆盖率、低风险
  const score = (
    (10 - factors.couplingLevel) * 2 +
    (factors.testCoverage / 10) * 1.5 +
    (10 - factors.rollbackComplexity) * 2 +
    (10 - factors.dataComplexity) * 1.5 +
    factors.businessValue * 1 +
    (10 - factors.userImpact) * 1.5
  );

  return score;
}

// 示例：为迁移排序组件优先级
const candidates: MigrationCandidate[] = [
  {
    component: '用户认证',
    factors: {
      couplingLevel: 3,
      testCoverage: 80,
      documentationQuality: 7,
      technicalDebt: 4,
      businessValue: 9,
      userImpact: 8,
      changeFrequency: 2,
      rollbackComplexity: 5,
      dataComplexity: 6
    },
    score: 0
  },
  {
    component: '通知服务',
    factors: {
      couplingLevel: 2,
      testCoverage: 90,
      documentationQuality: 8,
      technicalDebt: 2,
      businessValue: 5,
      userImpact: 3,
      changeFrequency: 1,
      rollbackComplexity: 2,
      dataComplexity: 2
    },
    score: 0
  }
];

// 通知服务在首次迁移中得分更高
// （低耦合、低风险、低用户影响）
```

### 流量路由策略

迁移期间路由流量的多种策略：

```typescript
// 金丝雀路由 - 逐渐增加到新系统的流量
class CanaryRouter {
  private canaryPercentage: number = 0;

  setCanaryPercentage(percentage: number): void {
    this.canaryPercentage = Math.min(100, Math.max(0, percentage));
  }

  shouldRouteToNew(request: Request): boolean {
    // 同一用户的一致路由（粘性会话）
    const userId = this.extractUserId(request);
    const hash = this.hashUserId(userId);
    return (hash % 100) < this.canaryPercentage;
  }
}

// 基于功能的路由
class FeatureRouter {
  private featureFlags: FeatureFlagService;

  shouldRouteToNew(request: Request, feature: string): boolean {
    const userId = this.extractUserId(request);
    return this.featureFlags.isEnabled(feature, userId);
  }
}

// 基于请求头的路由（用于测试）
class HeaderRouter {
  shouldRouteToNew(request: Request): boolean {
    // 允许通过请求头显式路由
    const routeHeader = request.headers.get('X-Route-To');
    if (routeHeader === 'new') return true;
    if (routeHeader === 'legacy') return false;

    // 默认行为
    return false;
  }
}

// 组合路由策略
class CompositeRouter {
  private strategies: RoutingStrategy[];

  shouldRouteToNew(request: Request): boolean {
    for (const strategy of this.strategies) {
      const decision = strategy.evaluate(request);
      if (decision !== null) {
        return decision;
      }
    }
    return false; // 默认使用遗留系统
  }
}
```

### 验证与比较

验证新实现是否匹配遗留系统的行为：

```typescript
// 影子测试 - 运行两个系统，比较结果
class ShadowTestRunner {
  async runShadowTest(
    request: Request,
    legacySystem: System,
    newSystem: System
  ): Promise<ShadowTestResult> {
    const startTime = Date.now();

    // 并行执行两者
    const [legacyResponse, newResponse] = await Promise.allSettled([
      this.executeWithTimeout(legacySystem.handle(request), 5000),
      this.executeWithTimeout(newSystem.handle(request), 5000)
    ]);

    const result: ShadowTestResult = {
      requestId: request.id,
      timestamp: new Date(),
      duration: Date.now() - startTime,
      legacy: this.extractResult(legacyResponse),
      new: this.extractResult(newResponse),
      comparison: null
    };

    // 比较结果
    if (legacyResponse.status === 'fulfilled' &&
        newResponse.status === 'fulfilled') {
      result.comparison = this.compareResponses(
        legacyResponse.value,
        newResponse.value
      );
    }

    return result;
  }

  private compareResponses(
    legacy: Response,
    newResp: Response
  ): ComparisonResult {
    return {
      statusMatch: legacy.status === newResp.status,
      bodyMatch: this.compareBody(legacy.body, newResp.body),
      headerDifferences: this.compareHeaders(legacy.headers, newResp.headers),
      performanceDelta: newResp.duration - legacy.duration
    };
  }

  private compareBody(legacy: any, newBody: any): BodyComparison {
    // 带可配置容差的深度比较
    const diff = deepDiff(legacy, newBody, {
      ignoreFields: ['timestamp', 'requestId'], // 预期会不同的字段
      numericTolerance: 0.001 // 浮点比较
    });

    return {
      match: diff.length === 0,
      differences: diff
    };
  }
}

// 生产环境中的持续验证
class ProductionVerifier {
  private sampleRate: number = 0.01; // 1% 的流量

  async verify(request: Request, response: Response): Promise<void> {
    if (Math.random() > this.sampleRate) return;

    // 异步验证 - 不阻塞响应
    setImmediate(async () => {
      try {
        const legacyResponse = await this.callLegacy(request);
        const comparison = this.compare(response, legacyResponse);

        if (!comparison.match) {
          await this.reportDiscrepancy({
            request,
            newResponse: response,
            legacyResponse,
            comparison
          });
        }
      } catch (error) {
        this.logger.warn('验证失败', { error, requestId: request.id });
      }
    });
  }
}
```

## 代码示例

### 完整的绞杀者门面实现

```typescript
// 具有所有路由功能的完整绞杀者门面
import { Request, Response } from 'express';
import { CircuitBreaker } from './circuit-breaker';
import { MetricsCollector } from './metrics';
import { Logger } from './logger';

interface RouteConfig {
  path: string;
  method: string;
  target: 'legacy' | 'new' | 'both';
  canaryPercentage?: number;
  featureFlag?: string;
  fallbackToLegacy?: boolean;
  timeout?: number;
}

interface SystemConfig {
  baseUrl: string;
  timeout: number;
  circuitBreaker: CircuitBreakerConfig;
}

class StranglerFacade {
  private routes: Map<string, RouteConfig> = new Map();
  private legacyCircuitBreaker: CircuitBreaker;
  private newCircuitBreaker: CircuitBreaker;
  private metrics: MetricsCollector;
  private logger: Logger;

  constructor(
    private legacyConfig: SystemConfig,
    private newConfig: SystemConfig,
    private featureFlagService: FeatureFlagService
  ) {
    this.legacyCircuitBreaker = new CircuitBreaker(legacyConfig.circuitBreaker);
    this.newCircuitBreaker = new CircuitBreaker(newConfig.circuitBreaker);
    this.metrics = new MetricsCollector();
    this.logger = new Logger('StranglerFacade');
  }

  registerRoute(config: RouteConfig): void {
    const key = `${config.method}:${config.path}`;
    this.routes.set(key, config);
    this.logger.info('路由已注册', { key, target: config.target });
  }

  async handleRequest(req: Request, res: Response): Promise<void> {
    const routeKey = `${req.method}:${req.path}`;
    const config = this.routes.get(routeKey) || this.getDefaultConfig(req);

    const startTime = Date.now();
    let response: Response;
    let target: string;

    try {
      const routingDecision = await this.makeRoutingDecision(req, config);
      target = routingDecision.target;

      this.logger.debug('路由请求', {
        path: req.path,
        target,
        reason: routingDecision.reason
      });

      switch (target) {
        case 'new':
          response = await this.routeToNew(req, config);
          break;
        case 'both':
          response = await this.routeToBoth(req, config);
          break;
        default:
          response = await this.routeToLegacy(req);
      }

      // 记录指标
      this.metrics.recordRequest({
        path: req.path,
        target,
        duration: Date.now() - startTime,
        status: response.status
      });

    } catch (error) {
      this.logger.error('请求失败', { error, path: req.path });

      // 如果配置了则回退到遗留系统
      if (config.fallbackToLegacy && target !== 'legacy') {
        this.logger.info('回退到遗留系统', { path: req.path });
        response = await this.routeToLegacy(req);
      } else {
        throw error;
      }
    }

    this.sendResponse(res, response);
  }

  private async makeRoutingDecision(
    req: Request,
    config: RouteConfig
  ): Promise<{ target: string; reason: string }> {
    // 首先检查功能标志
    if (config.featureFlag) {
      const userId = this.extractUserId(req);
      if (this.featureFlagService.isEnabled(config.featureFlag, userId)) {
        return { target: 'new', reason: 'feature_flag' };
      }
    }

    // 检查金丝雀百分比
    if (config.canaryPercentage && config.canaryPercentage > 0) {
      const userId = this.extractUserId(req);
      if (this.isInCanary(userId, config.canaryPercentage)) {
        return { target: 'new', reason: 'canary' };
      }
    }

    // 检查请求头覆盖（用于测试）
    const routeHeader = req.headers['x-route-to'];
    if (routeHeader === 'new') {
      return { target: 'new', reason: 'header_override' };
    }

    // 默认使用配置的目标
    return { target: config.target, reason: 'default' };
  }

  private async routeToLegacy(req: Request): Promise<ProxyResponse> {
    return this.legacyCircuitBreaker.execute(async () => {
      const response = await fetch(
        `${this.legacyConfig.baseUrl}${req.path}`,
        this.buildFetchOptions(req, this.legacyConfig.timeout)
      );
      return this.parseResponse(response, 'legacy');
    });
  }

  private async routeToNew(req: Request, config: RouteConfig): Promise<ProxyResponse> {
    return this.newCircuitBreaker.execute(async () => {
      const response = await fetch(
        `${this.newConfig.baseUrl}${req.path}`,
        this.buildFetchOptions(req, config.timeout || this.newConfig.timeout)
      );
      return this.parseResponse(response, 'new');
    });
  }

  private async routeToBoth(req: Request, config: RouteConfig): Promise<ProxyResponse> {
    // 发送到两个系统，返回遗留系统响应（权威）
    const [legacyResult, newResult] = await Promise.allSettled([
      this.routeToLegacy(req),
      this.routeToNew(req, config)
    ]);

    // 异步记录比较结果
    setImmediate(() => {
      this.compareAndLog(req, legacyResult, newResult);
    });

    // 返回遗留系统响应
    if (legacyResult.status === 'fulfilled') {
      return legacyResult.value;
    }

    // 如果遗留系统失败但新系统成功，记录但仍然失败
    if (newResult.status === 'fulfilled') {
      this.logger.warn('遗留系统失败但新系统成功', { path: req.path });
    }

    throw legacyResult.reason;
  }

  private compareAndLog(
    req: Request,
    legacyResult: PromiseSettledResult<ProxyResponse>,
    newResult: PromiseSettledResult<ProxyResponse>
  ): void {
    const comparison: ResponseComparison = {
      path: req.path,
      timestamp: new Date(),
      legacyStatus: legacyResult.status,
      newStatus: newResult.status,
      match: false
    };

    if (legacyResult.status === 'fulfilled' && newResult.status === 'fulfilled') {
      comparison.match = this.responsesMatch(
        legacyResult.value,
        newResult.value
      );
      comparison.legacyDuration = legacyResult.value.duration;
      comparison.newDuration = newResult.value.duration;
    }

    this.metrics.recordComparison(comparison);

    if (!comparison.match) {
      this.logger.warn('检测到响应不匹配', comparison);
    }
  }

  private isInCanary(userId: string, percentage: number): boolean {
    const hash = this.hashString(userId);
    return (hash % 100) < percentage;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
```

### 带双写的数据库迁移

```typescript
// 带同步的完整双写实现
import { Pool } from 'pg';
import { MongoClient } from 'mongodb';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

class DualWriteUserRepository {
  private phase: 'legacy-primary' | 'new-primary' | 'new-only' = 'legacy-primary';
  private legacyPool: Pool;  // PostgreSQL
  private newClient: MongoClient;  // MongoDB
  private syncQueue: AsyncQueue;
  private metrics: MetricsCollector;

  constructor(legacyPool: Pool, newClient: MongoClient) {
    this.legacyPool = legacyPool;
    this.newClient = newClient;
    this.syncQueue = new AsyncQueue({ concurrency: 10 });
    this.metrics = new MetricsCollector();
  }

  setPhase(phase: 'legacy-primary' | 'new-primary' | 'new-only'): void {
    this.phase = phase;
    this.metrics.recordPhaseChange(phase);
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date();
    const newUser: User = {
      ...user,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };

    switch (this.phase) {
      case 'legacy-primary':
        await this.createInLegacy(newUser);
        this.queueSyncToNew('create', newUser);
        break;

      case 'new-primary':
        await this.createInNew(newUser);
        this.queueSyncToLegacy('create', newUser);
        break;

      case 'new-only':
        await this.createInNew(newUser);
        break;
    }

    return newUser;
  }

  async findById(id: string): Promise<User | null> {
    switch (this.phase) {
      case 'legacy-primary':
        return this.findInLegacy(id);

      case 'new-primary':
        const user = await this.findInNew(id);
        if (user) return user;

        // 过渡期间回退到遗留系统
        const legacyUser = await this.findInLegacy(id);
        if (legacyUser) {
          // 读取时迁移
          this.queueSyncToNew('create', legacyUser);
        }
        return legacyUser;

      case 'new-only':
        return this.findInNew(id);
    }
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const updatedData = { ...updates, updatedAt: new Date() };

    switch (this.phase) {
      case 'legacy-primary':
        const legacyResult = await this.updateInLegacy(id, updatedData);
        if (legacyResult) {
          this.queueSyncToNew('update', legacyResult);
        }
        return legacyResult;

      case 'new-primary':
        const newResult = await this.updateInNew(id, updatedData);
        if (newResult) {
          this.queueSyncToLegacy('update', newResult);
        }
        return newResult;

      case 'new-only':
        return this.updateInNew(id, updatedData);
    }
  }

  // 遗留系统（PostgreSQL）操作
  private async createInLegacy(user: User): Promise<void> {
    const query = `
      INSERT INTO users (id, email, name, metadata, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await this.legacyPool.query(query, [
      user.id,
      user.email,
      user.name,
      JSON.stringify(user.metadata),
      user.createdAt,
      user.updatedAt
    ]);
  }

  private async findInLegacy(id: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE id = $1`;
    const result = await this.legacyPool.query(query, [id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      metadata: JSON.parse(row.metadata),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private async updateInLegacy(id: string, updates: Partial<User>): Promise<User | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.email) {
      setClauses.push(`email = $${paramIndex++}`);
      values.push(updates.email);
    }
    if (updates.name) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }
    if (updates.metadata) {
      setClauses.push(`metadata = $${paramIndex++}`);
      values.push(JSON.stringify(updates.metadata));
    }
    setClauses.push(`updated_at = $${paramIndex++}`);
    values.push(updates.updatedAt);
    values.push(id);

    const query = `
      UPDATE users SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.legacyPool.query(query, values);
    return result.rows.length > 0 ? this.mapLegacyRow(result.rows[0]) : null;
  }

  // 新系统（MongoDB）操作
  private async createInNew(user: User): Promise<void> {
    const collection = this.newClient.db().collection('users');
    await collection.insertOne(user);
  }

  private async findInNew(id: string): Promise<User | null> {
    const collection = this.newClient.db().collection('users');
    return collection.findOne({ id }) as Promise<User | null>;
  }

  private async updateInNew(id: string, updates: Partial<User>): Promise<User | null> {
    const collection = this.newClient.db().collection('users');
    const result = await collection.findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result as User | null;
  }

  // 同步队列操作
  private queueSyncToNew(operation: string, user: User): void {
    this.syncQueue.push(async () => {
      try {
        switch (operation) {
          case 'create':
            await this.createInNew(user);
            break;
          case 'update':
            await this.updateInNew(user.id, user);
            break;
        }
        this.metrics.recordSync('toNew', 'success');
      } catch (error) {
        this.metrics.recordSync('toNew', 'failure');
        // 使用指数退避重新排队
        await this.retrySync('new', operation, user);
      }
    });
  }

  private queueSyncToLegacy(operation: string, user: User): void {
    this.syncQueue.push(async () => {
      try {
        switch (operation) {
          case 'create':
            await this.createInLegacy(user);
            break;
          case 'update':
            await this.updateInLegacy(user.id, user);
            break;
        }
        this.metrics.recordSync('toLegacy', 'success');
      } catch (error) {
        this.metrics.recordSync('toLegacy', 'failure');
        await this.retrySync('legacy', operation, user);
      }
    });
  }
}
```

### 带绞杀者的 API 版本控制

```typescript
// 迁移期间的 API 版本控制策略
import express, { Router, Request, Response, NextFunction } from 'express';

interface VersionConfig {
  version: string;
  deprecated: boolean;
  sunsetDate?: Date;
  redirectTo?: string;
}

class VersionedAPIRouter {
  private routers: Map<string, Router> = new Map();
  private configs: Map<string, VersionConfig> = new Map();

  registerVersion(config: VersionConfig, router: Router): void {
    this.routers.set(config.version, router);
    this.configs.set(config.version, config);
  }

  getMiddleware(): express.RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      // 从请求头、URL 或查询参数提取版本
      const version = this.extractVersion(req);
      const config = this.configs.get(version);

      if (!config) {
        return res.status(400).json({
          error: '无效的 API 版本',
          supportedVersions: [...this.configs.keys()]
        });
      }

      // 添加弃用头
      if (config.deprecated) {
        res.setHeader('Deprecation', 'true');
        if (config.sunsetDate) {
          res.setHeader('Sunset', config.sunsetDate.toUTCString());
        }
        if (config.redirectTo) {
          res.setHeader('Link', `</api/${config.redirectTo}>; rel="successor-version"`);
        }
      }

      // 路由到适当的版本
      const router = this.routers.get(version);
      if (router) {
        return router(req, res, next);
      }

      next();
    };
  }

  private extractVersion(req: Request): string {
    // 首先检查请求头
    const headerVersion = req.headers['api-version'];
    if (headerVersion) return headerVersion as string;

    // 检查 URL 路径
    const pathMatch = req.path.match(/^\/v(\d+)\//);
    if (pathMatch) return `v${pathMatch[1]}`;

    // 默认版本
    return 'v1';
  }
}

// 使用示例
const versionedAPI = new VersionedAPIRouter();

// 遗留 API (v1)
const v1Router = Router();
v1Router.get('/users/:id', async (req, res) => {
  // 遗留实现
  const user = await legacyUserService.getUser(req.params.id);
  res.json(user);
});

// 新 API (v2) 具有不同的响应格式
const v2Router = Router();
v2Router.get('/users/:id', async (req, res) => {
  // 新实现
  const user = await newUserService.getUser(req.params.id);
  res.json({
    data: user,
    meta: {
      version: 'v2',
      timestamp: new Date().toISOString()
    }
  });
});

versionedAPI.registerVersion(
  { version: 'v1', deprecated: true, sunsetDate: new Date('2026-06-01'), redirectTo: 'v2' },
  v1Router
);

versionedAPI.registerVersion(
  { version: 'v2', deprecated: false },
  v2Router
);
```

## 最佳实践

### 1. 从接缝开始

识别系统中可以拦截调用的自然边界：

```typescript
// 识别接缝 - 拦截的自然边界
interface Seam {
  name: string;
  type: 'api' | 'event' | 'database' | 'file';
  entryPoints: string[];
  dependencies: string[];
  dataFlows: DataFlow[];
}

function identifySeams(system: SystemArchitecture): Seam[] {
  const seams: Seam[] = [];

  // API 端点是自然的接缝
  for (const endpoint of system.endpoints) {
    seams.push({
      name: `API: ${endpoint.path}`,
      type: 'api',
      entryPoints: [endpoint.path],
      dependencies: endpoint.serviceCalls,
      dataFlows: endpoint.dataFlows
    });
  }

  // 事件处理程序是自然的接缝
  for (const handler of system.eventHandlers) {
    seams.push({
      name: `Event: ${handler.eventType}`,
      type: 'event',
      entryPoints: [handler.eventType],
      dependencies: handler.dependencies,
      dataFlows: handler.dataFlows
    });
  }

  return seams;
}
```

### 2. 在迁移期间保持功能对等

```typescript
// 功能对等检查清单
interface FeatureParityCheck {
  feature: string;
  legacyBehavior: TestCase[];
  newBehavior: TestCase[];
  status: 'pending' | 'verified' | 'divergent';
  divergences?: Divergence[];
}

class FeatureParityValidator {
  private checks: Map<string, FeatureParityCheck> = new Map();

  async validateParity(feature: string): Promise<ValidationResult> {
    const check = this.checks.get(feature);
    if (!check) throw new Error(`未找到功能: ${feature}`);

    const results: TestResult[] = [];

    for (const testCase of check.legacyBehavior) {
      // 对两个系统运行测试
      const legacyResult = await this.runTest(testCase, 'legacy');
      const newResult = await this.runTest(testCase, 'new');

      results.push({
        testCase: testCase.name,
        match: this.compareResults(legacyResult, newResult),
        legacy: legacyResult,
        new: newResult
      });
    }

    const allMatch = results.every(r => r.match);
    check.status = allMatch ? 'verified' : 'divergent';

    if (!allMatch) {
      check.divergences = results
        .filter(r => !r.match)
        .map(r => ({
          testCase: r.testCase,
          expected: r.legacy,
          actual: r.new
        }));
    }

    return { feature, passed: allMatch, results };
  }
}
```

### 3. 实现健壮的监控

```typescript
// 迁移特定指标
interface MigrationMetrics {
  // 流量分布
  legacyRequests: Counter;
  newRequests: Counter;
  bothRequests: Counter;

  // 性能比较
  legacyLatency: Histogram;
  newLatency: Histogram;

  // 错误率
  legacyErrors: Counter;
  newErrors: Counter;
  fallbacks: Counter;

  // 数据一致性
  comparisonRuns: Counter;
  comparisonMatches: Counter;
  comparisonMismatches: Counter;

  // 迁移进度
  migratedFeatures: Gauge;
  totalFeatures: Gauge;
}

class MigrationDashboard {
  private metrics: MigrationMetrics;

  getProgress(): MigrationProgress {
    return {
      percentComplete: (this.metrics.migratedFeatures.value /
                       this.metrics.totalFeatures.value) * 100,
      trafficOnNew: this.metrics.newRequests.value /
                    (this.metrics.legacyRequests.value +
                     this.metrics.newRequests.value) * 100,
      errorRateComparison: {
        legacy: this.metrics.legacyErrors.value / this.metrics.legacyRequests.value,
        new: this.metrics.newErrors.value / this.metrics.newRequests.value
      },
      dataConsistency: this.metrics.comparisonMatches.value /
                       this.metrics.comparisonRuns.value * 100
    };
  }

  // 检查迁移问题的警报
  checkAlerts(): Alert[] {
    const alerts: Alert[] = [];

    // 新系统错误率明显高于遗留系统
    const errorRatio = this.getProgress().errorRateComparison;
    if (errorRatio.new > errorRatio.legacy * 2) {
      alerts.push({
        severity: 'warning',
        message: '新系统错误率升高',
        metric: 'error_rate',
        threshold: errorRatio.legacy * 2,
        current: errorRatio.new
      });
    }

    // 数据一致性下降
    const consistency = this.getProgress().dataConsistency;
    if (consistency < 99) {
      alerts.push({
        severity: 'critical',
        message: '数据一致性低于阈值',
        metric: 'data_consistency',
        threshold: 99,
        current: consistency
      });
    }

    return alerts;
  }
}
```

### 4. 规划回滚

```typescript
// 回滚程序
class RollbackManager {
  private snapshots: Map<string, MigrationSnapshot> = new Map();

  // 在主要迁移步骤之前拍摄快照
  async takeSnapshot(stepId: string): Promise<void> {
    const snapshot: MigrationSnapshot = {
      id: stepId,
      timestamp: new Date(),
      routingConfig: await this.captureRoutingConfig(),
      featureFlags: await this.captureFeatureFlags(),
      dataState: await this.captureDataState()
    };
    this.snapshots.set(stepId, snapshot);
  }

  // 回滚到之前的状态
  async rollback(stepId: string): Promise<void> {
    const snapshot = this.snapshots.get(stepId);
    if (!snapshot) throw new Error(`未找到快照: ${stepId}`);

    console.log(`回滚到快照: ${stepId}`);

    // 恢复路由配置
    await this.restoreRoutingConfig(snapshot.routingConfig);

    // 恢复功能标志
    await this.restoreFeatureFlags(snapshot.featureFlags);

    // 注意：数据回滚可能需要额外的步骤
    if (snapshot.dataState) {
      console.warn('已捕获数据状态 - 需要人工审查');
    }

    console.log(`回滚到 ${stepId} 完成`);
  }

  // 在错误阈值时自动回滚
  async monitorAndRollback(
    stepId: string,
    errorThreshold: number,
    windowMs: number
  ): Promise<void> {
    const startTime = Date.now();
    let errorCount = 0;

    const checkInterval = setInterval(async () => {
      errorCount = await this.getErrorCount(stepId, windowMs);

      if (errorCount > errorThreshold) {
        console.error(`超过错误阈值: ${errorCount} > ${errorThreshold}`);
        clearInterval(checkInterval);
        await this.rollback(stepId);
      }

      // 窗口结束后停止监控
      if (Date.now() - startTime > windowMs) {
        clearInterval(checkInterval);
        console.log(`迁移步骤 ${stepId} 稳定`);
      }
    }, 5000);
  }
}
```

## 常见陷阱

### 1. 一次尝试太多

```typescript
// 反模式：同时迁移多个相互依赖的组件
async function badMigration() {
  // 不要：同时迁移用户服务、订单服务和支付服务
  await migrateUserService();
  await migrateOrderService();  // 依赖用户服务
  await migratePaymentService();  // 依赖订单服务
  // 级联故障的高风险
}

// 更好：一次迁移一个组件并进行验证
async function goodMigration() {
  // 首先迁移用户服务
  await migrateUserService();
  await validateUserService();
  await monitorForStability(Duration.days(7));

  // 然后才迁移依赖的服务
  await migrateOrderService();
  await validateOrderService();
  await monitorForStability(Duration.days(7));

  // 最后迁移支付服务
  await migratePaymentService();
  await validatePaymentService();
}
```

### 2. 忽略数据同步问题

```typescript
// 问题：双写期间的最终一致性问题
class DataSyncPitfalls {
  // 反模式：不处理同步失败
  async badSave(entity: Entity): Promise<void> {
    await this.legacyRepo.save(entity);
    await this.newRepo.save(entity);  // 如果这失败了怎么办？
  }

  // 更好：处理同步失败并进行重试和对账
  async goodSave(entity: Entity): Promise<void> {
    // 带事务的主写入
    await this.legacyRepo.save(entity);

    // 带重试队列的副写入
    try {
      await this.newRepo.save(entity);
    } catch (error) {
      // 排队重试
      await this.syncQueue.enqueue({
        operation: 'save',
        entity,
        retryCount: 0,
        maxRetries: 5,
        backoffMs: 1000
      });
    }
  }

  // 用于捕获偏差的对账作业
  async reconcile(): Promise<ReconciliationReport> {
    const legacyIds = await this.legacyRepo.getAllIds();
    const newIds = await this.newRepo.getAllIds();

    const missing = legacyIds.filter(id => !newIds.includes(id));
    const extra = newIds.filter(id => !legacyIds.includes(id));

    // 同步缺失的记录
    for (const id of missing) {
      const entity = await this.legacyRepo.findById(id);
      await this.newRepo.save(entity);
    }

    return { missing: missing.length, extra: extra.length, synced: missing.length };
  }
}
```

### 3. 迁移期间测试不充分

```typescript
// 反模式：没有全面比较测试的迁移
async function badMigrationTest() {
  // 只检查新系统是否响应
  const response = await newSystem.get('/users/1');
  expect(response.status).toBe(200);  // 不充分！
}

// 更好：全面的比较测试
async function goodMigrationTest() {
  const testCases = await loadProductionSamples(1000);

  for (const testCase of testCases) {
    const [legacyResponse, newResponse] = await Promise.all([
      legacySystem.request(testCase),
      newSystem.request(testCase)
    ]);

    // 比较状态码
    expect(newResponse.status).toBe(legacyResponse.status);

    // 比较响应体（对预期差异有容差）
    const bodyComparison = compareResponses(
      legacyResponse.body,
      newResponse.body,
      {
        ignoreFields: ['timestamp', 'requestId'],
        numericTolerance: 0.001
      }
    );
    expect(bodyComparison.match).toBe(true);

    // 比较性能
    expect(newResponse.duration).toBeLessThan(legacyResponse.duration * 1.5);
  }
}
```

### 4. 没有规划清理阶段

```typescript
// 问题：遗留系统无限期地存在
interface MigrationCleanupPlan {
  phases: CleanupPhase[];
}

interface CleanupPhase {
  name: string;
  trigger: CleanupTrigger;
  actions: CleanupAction[];
  rollbackPlan: string;
}

const cleanupPlan: MigrationCleanupPlan = {
  phases: [
    {
      name: '移除到遗留系统的双写',
      trigger: {
        type: 'metric',
        condition: 'new_system_traffic >= 100% for 7 days'
      },
      actions: [
        { type: 'config', action: 'disable_legacy_writes' },
        { type: 'alert', action: 'notify_team' }
      ],
      rollbackPlan: '重新启用双写，从遗留系统备份恢复'
    },
    {
      name: '移除遗留系统读取回退',
      trigger: {
        type: 'metric',
        condition: 'legacy_reads == 0 for 14 days'
      },
      actions: [
        { type: 'config', action: 'disable_legacy_reads' },
        { type: 'code', action: 'remove_legacy_fallback_code' }
      ],
      rollbackPlan: '重新启用回退，重新部署之前的版本'
    },
    {
      name: '退役遗留基础设施',
      trigger: {
        type: 'manual',
        approvers: ['platform-team', 'product-owner']
      },
      actions: [
        { type: 'infrastructure', action: 'archive_legacy_data' },
        { type: 'infrastructure', action: 'shutdown_legacy_servers' },
        { type: 'code', action: 'remove_legacy_integration_code' }
      ],
      rollbackPlan: '从归档数据恢复，重新部署遗留系统'
    }
  ]
};
```

## 性能考量

### 门面的延迟影响

```typescript
// 测量并最小化门面开销
class FacadePerformanceMonitor {
  private metrics: MetricsCollector;

  async measureOverhead(request: Request): Promise<OverheadMetrics> {
    const facadeStart = process.hrtime.bigint();

    // 路由决策时间
    const routingStart = process.hrtime.bigint();
    const decision = await this.makeRoutingDecision(request);
    const routingTime = Number(process.hrtime.bigint() - routingStart) / 1e6;

    // 后端调用时间
    const backendStart = process.hrtime.bigint();
    const response = await this.callBackend(decision.target, request);
    const backendTime = Number(process.hrtime.bigint() - backendStart) / 1e6;

    // 总门面时间
    const totalTime = Number(process.hrtime.bigint() - facadeStart) / 1e6;

    return {
      routingTimeMs: routingTime,
      backendTimeMs: backendTime,
      totalTimeMs: totalTime,
      overheadMs: totalTime - backendTime
    };
  }
}

// 优化路由决策
class OptimizedRouter {
  private routeCache: LRUCache<string, RoutingDecision>;

  constructor() {
    this.routeCache = new LRUCache({ max: 10000, ttl: 60000 });
  }

  async route(request: Request): Promise<RoutingDecision> {
    const cacheKey = this.getCacheKey(request);

    // 首先检查缓存
    const cached = this.routeCache.get(cacheKey);
    if (cached) return cached;

    // 计算路由决策
    const decision = await this.computeRouting(request);

    // 如果可缓存则缓存
    if (this.isCacheable(request)) {
      this.routeCache.set(cacheKey, decision);
    }

    return decision;
  }
}
```

### 双写性能

```typescript
// 优化双写操作
class OptimizedDualWrite {
  // 异步副写入以避免延迟影响
  async writeWithAsyncSync(entity: Entity): Promise<void> {
    // 主写入（同步）
    await this.primaryRepo.save(entity);

    // 副写入（异步，发送后忘记，带重试）
    setImmediate(async () => {
      try {
        await this.secondaryRepo.save(entity);
      } catch (error) {
        await this.queueForRetry(entity, error);
      }
    });
  }

  // 批量副写入以提高效率
  private writeBatch: Entity[] = [];
  private batchTimer: NodeJS.Timeout | null = null;

  async writeWithBatching(entity: Entity): Promise<void> {
    await this.primaryRepo.save(entity);

    this.writeBatch.push(entity);

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushBatch(), 100);
    }

    if (this.writeBatch.length >= 100) {
      await this.flushBatch();
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const batch = [...this.writeBatch];
    this.writeBatch = [];

    try {
      await this.secondaryRepo.saveMany(batch);
    } catch (error) {
      // 排队单独重试
      for (const entity of batch) {
        await this.queueForRetry(entity, error);
      }
    }
  }
}
```

### 影子流量性能

```typescript
// 管理影子流量而不影响生产
class ShadowTrafficManager {
  private shadowQueue: AsyncQueue;
  private resourceLimiter: ResourceLimiter;

  constructor() {
    // 限制影子流量资源
    this.shadowQueue = new AsyncQueue({
      concurrency: 10,  // 最大并行影子请求
      timeout: 5000     // 影子请求超时
    });

    this.resourceLimiter = new ResourceLimiter({
      maxCpuPercent: 10,   // 影子不要使用超过 10% CPU
      maxMemoryMb: 512     // 影子操作的内存限制
    });
  }

  async sendShadowRequest(request: Request): Promise<void> {
    // 排队前检查资源限制
    if (!this.resourceLimiter.canProceed()) {
      this.metrics.recordShadowDropped('resource_limit');
      return;
    }

    // 排队影子请求（非阻塞）
    this.shadowQueue.push(async () => {
      try {
        const startTime = Date.now();
        const response = await this.newSystem.request(request);

        this.metrics.recordShadowRequest({
          duration: Date.now() - startTime,
          status: response.status
        });
      } catch (error) {
        this.metrics.recordShadowError(error);
      }
    });
  }
}
```

## 实战场景

### 场景 1：电商平台迁移

```typescript
// 将单体电商平台迁移到微服务
interface EcommerceMigrationPlan {
  phases: MigrationPhase[];
}

const ecommerceMigration: EcommerceMigrationPlan = {
  phases: [
    {
      name: '阶段 1：产品目录',
      duration: '3 个月',
      components: ['product-service', 'category-service', 'search-service'],
      strategy: 'strangler',
      steps: [
        '部署具有只读访问的产品服务',
        '为 /api/products/* 实现绞杀者门面',
        '启用影子流量比较',
        '逐步流量转移：1% -> 10% -> 50% -> 100%',
        '禁用遗留产品端点'
      ]
    },
    {
      name: '阶段 2：用户管理',
      duration: '2 个月',
      components: ['user-service', 'auth-service'],
      strategy: 'strangler',
      steps: [
        '部署连接遗留数据库的用户服务',
        '为用户数据实现双写',
        '将认证迁移到认证服务',
        '逐步流量转移',
        '将用户数据库迁移到新模式'
      ]
    },
    {
      name: '阶段 3：订单处理',
      duration: '4 个月',
      components: ['order-service', 'payment-service', 'inventory-service'],
      strategy: 'strangler',
      steps: [
        '使用事件溯源提取订单服务',
        '为订单流程实现 saga 模式',
        '并行运行并比较',
        '谨慎监控的逐步流量转移',
        '退役遗留订单处理'
      ]
    }
  ]
};

// 实现示例：产品目录迁移
class ProductCatalogMigration {
  private facade: StranglerFacade;
  private legacyService: LegacyProductService;
  private newService: ProductMicroservice;

  async execute(): Promise<void> {
    // 步骤 1：使用影子流量部署
    this.facade.registerRoute({
      path: '/api/products/*',
      method: 'GET',
      target: 'both',  // 发送到两者，比较结果
      fallbackToLegacy: true
    });

    // 监控 2 周
    await this.monitorShadowTraffic({ duration: Duration.weeks(2) });

    // 步骤 2：金丝雀部署
    this.facade.registerRoute({
      path: '/api/products/*',
      method: 'GET',
      target: 'new',
      canaryPercentage: 1,
      fallbackToLegacy: true
    });

    // 逐渐增加金丝雀
    for (const percentage of [1, 5, 10, 25, 50, 75, 100]) {
      this.facade.setCanaryPercentage('/api/products/*', percentage);
      await this.monitorAndValidate({ duration: Duration.days(2) });
    }

    // 步骤 3：移除遗留回退
    this.facade.registerRoute({
      path: '/api/products/*',
      method: 'GET',
      target: 'new',
      fallbackToLegacy: false
    });
  }
}
```

### 场景 2：金融系统迁移

```typescript
// 具有严格要求的高风险金融系统迁移
class FinancialSystemMigration {
  private auditLog: AuditLogger;
  private complianceChecker: ComplianceChecker;

  async migrateTransactionProcessing(): Promise<void> {
    // 金融系统需要额外的谨慎
    const migrationConfig = {
      // 延长并行运行期
      parallelRunDuration: Duration.months(3),

      // 并行运行期间 100% 比较
      comparisonRate: 1.0,

      // 对差异零容忍
      maxDiscrepancyRate: 0,

      // 每个阶段需要人工批准
      requireApproval: true,

      // 完整的审计跟踪
      auditLevel: 'comprehensive'
    };

    // 阶段 1：只读镜像
    await this.setupReadOnlyMirror();
    await this.validateReadConsistency(Duration.weeks(4));

    // 阶段 2：写入复制（遗留系统权威）
    await this.setupWriteReplication();
    await this.validateWriteConsistency(Duration.weeks(4));

    // 合规检查
    const complianceResult = await this.complianceChecker.validate({
      dataIntegrity: true,
      auditTrail: true,
      regulatoryRequirements: ['SOX', 'PCI-DSS']
    });

    if (!complianceResult.passed) {
      throw new Error('合规验证失败');
    }

    // 阶段 3：具有即时回滚能力的受控切换
    await this.performCutover({
      rollbackTimeoutMs: 100,  // 即时回滚能力
      monitoringInterval: 1000,  // 每秒检查
      autoRollbackThreshold: {
        errorRate: 0.001,  // 0.1% 错误率触发回滚
        latencyP99: 200    // 200ms p99 延迟触发回滚
      }
    });
  }

  private async validateWriteConsistency(duration: Duration): Promise<void> {
    const startTime = Date.now();
    let totalTransactions = 0;
    let discrepancies = 0;

    while (Date.now() - startTime < duration.toMillis()) {
      // 通过两个系统处理交易
      const transaction = await this.getNextTransaction();

      const [legacyResult, newResult] = await Promise.all([
        this.legacySystem.processTransaction(transaction),
        this.newSystem.processTransaction(transaction)
      ]);

      totalTransactions++;

      // 以金融精度比较结果
      const comparison = this.compareFinancialResults(legacyResult, newResult);

      if (!comparison.match) {
        discrepancies++;

        // 记录差异及完整审计跟踪
        await this.auditLog.logDiscrepancy({
          transaction,
          legacyResult,
          newResult,
          comparison
        });

        // 对于金融系统，任何差异都立即停止
        throw new Error(`检测到金融差异: ${comparison.difference}`);
      }
    }

    console.log(`验证了 ${totalTransactions} 笔交易，0 个差异`);
  }
}
```

### 场景 3：遗留大型机迁移

```typescript
// 将 COBOL 大型机迁移到现代架构
class MainframeMigration {
  private transactionBridge: MainframeBridge;
  private dataTransformer: COBOLDataTransformer;

  async migrateMainframeModule(moduleName: string): Promise<void> {
    // 步骤 1：围绕大型机创建 API 包装器
    const wrapper = await this.createMainframeWrapper(moduleName);

    // 步骤 2：部署现代服务
    const modernService = await this.deployModernService(moduleName);

    // 步骤 3：设置绞杀者门面
    const facade = new StranglerFacade({
      legacy: {
        type: 'mainframe',
        bridge: this.transactionBridge,
        transformer: this.dataTransformer
      },
      new: {
        type: 'rest',
        baseUrl: modernService.url
      }
    });

    // 步骤 4：带转换的数据迁移
    await this.migrateData({
      source: 'mainframe',
      target: 'postgresql',
      transformer: (record) => this.transformCOBOLRecord(record),
      validation: (source, target) => this.validateDataTransformation(source, target)
    });

    // 步骤 5：逐步流量迁移
    await this.migrateTraffic(facade, {
      startPercentage: 0,
      endPercentage: 100,
      incrementPercentage: 5,
      stabilizationPeriod: Duration.days(3)
    });
  }

  private transformCOBOLRecord(record: COBOLRecord): ModernRecord {
    // 将 COBOL 压缩十进制转换为标准数字
    // 将 COBOL 日期转换为 ISO 8601
    // 将定长字符串转换为变长
    return {
      id: this.parsePackedDecimal(record.ID_FIELD),
      name: record.NAME_FIELD.trim(),
      amount: this.parsePackedDecimal(record.AMOUNT_FIELD) / 100,  // 2 位小数
      date: this.parseCOBOLDate(record.DATE_FIELD),
      // ... 其他转换
    };
  }
}
```

## 面试要点

### 核心理解

**Q1：什么是绞杀者模式，何时应该使用它？**

绞杀者模式是一种渐进式迁移策略，允许你通过将特定功能路由到新实现来逐步替换遗留系统，同时保持旧系统运行。主要使用场景：

1. **大型单体现代化**：将单体分解为微服务
2. **技术迁移**：从遗留技术栈迁移到现代技术栈
3. **风险缓解**：当大爆炸式重写风险太高时
4. **持续交付要求**：当无法承受长时间停机时

**Q2：绞杀者实现的关键组件是什么？**

1. **绞杀者门面**：在遗留系统和新系统之间路由请求
2. **功能标志**：控制哪个功能使用哪个系统
3. **双写机制**：在过渡期间保持数据同步
4. **比较测试**：验证新实现匹配遗留行为
5. **监控和指标**：跟踪迁移进度和系统健康
6. **回滚程序**：在出现问题时快速恢复

### 技术问题

**Q3：如何在绞杀者迁移期间处理数据一致性？**

```typescript
// 三种主要策略：
// 1. 带主/副指定的双写
// 2. 事件驱动同步
// 3. 变更数据捕获（CDC）

// 示例：带对账的双写
class DataConsistencyStrategy {
  // 主写入 + 异步副写入
  async write(entity: Entity): Promise<void> {
    await this.primaryRepo.save(entity);
    this.queueSecondaryWrite(entity);
  }

  // 定期对账
  async reconcile(): Promise<void> {
    const drift = await this.detectDrift();
    await this.resolveDrift(drift);
  }
}
```

**Q4：如何验证新系统与遗留系统行为相同？**

1. **影子流量**：将生产流量的副本发送到新系统
2. **响应比较**：比较两个系统的响应
3. **重放测试**：通过新系统重放生产日志
4. **混沌测试**：验证故障条件下的行为

```typescript
// 影子测试示例
async function shadowTest(request: Request): Promise<void> {
  const [legacyResponse, newResponse] = await Promise.allSettled([
    legacySystem.handle(request),
    newSystem.handle(request)
  ]);

  const comparison = compare(legacyResponse, newResponse);
  await logComparison(comparison);
}
```

### 实践问题

**Q5：绞杀者迁移中的常见陷阱是什么？**

1. **范围蔓延**：一次尝试迁移太多
2. **测试不足**：没有验证行为对等
3. **数据同步问题**：最终一致性问题
4. **性能下降**：没有考虑门面开销
5. **无限期并行运行**：永远不完成迁移

**Q6：如何决定迁移顺序？**

在确定组件优先级时考虑以下因素：

1. **耦合度**：从松耦合组件开始
2. **风险**：从较低风险、非关键功能开始
3. **业务价值**：平衡风险和业务影响
4. **依赖关系**：在依赖项之前迁移被依赖项
5. **团队熟悉度**：从充分理解的组件开始

## 延伸阅读

### 官方资源

- [Martin Fowler - Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html) - 原始模式描述
- [Microsoft - 绞杀者模式](https://docs.microsoft.com/en-us/azure/architecture/patterns/strangler-fig) - Azure 架构指南
- [AWS - 绞杀者模式](https://docs.aws.amazon.com/prescriptive-guidance/latest/modernization-decomposing-monoliths/strangler-fig.html) - AWS 实现指南

### 书籍

- 《Building Microservices》 by Sam Newman - 迁移模式章节
- 《Monolith to Microservices》 by Sam Newman - 详细迁移策略
- 《Working Effectively with Legacy Code》 by Michael Feathers - 在遗留代码中找到接缝
- 《Refactoring Databases》 by Scott Ambler - 数据迁移策略

### 技术文章

- [绞杀者模式：最佳实践](https://www.nginx.com/blog/strangler-pattern-modernizing-legacy-applications/) - NGINX 实现指南
- [遗留应用绞杀](https://paulhammant.com/2013/07/14/legacy-application-strangulation-case-studies/) - 案例研究
- [实践中的绞杀者模式](https://www.thoughtworks.com/insights/blog/strangler-pattern-practice) - ThoughtWorks 经验

### 工具和框架

- [Nginx](https://nginx.org/) - 门面实现的反向代理
- [Envoy Proxy](https://www.envoyproxy.io/) - 流量路由的服务网格
- [LaunchDarkly](https://launchdarkly.com/) - 功能标志管理
- [Debezium](https://debezium.io/) - 数据同步的变更数据捕获

### 相关模式

- [抽象分支](https://martinfowler.com/bliki/BranchByAbstraction.html) - 代码级迁移模式
- [并行变更](https://martinfowler.com/bliki/ParallelChange.html) - 扩展-迁移-收缩模式
- [功能开关](https://martinfowler.com/articles/feature-toggles.html) - 控制功能发布
- [防腐层](https://docs.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer) - 保护新系统免受遗留系统影响

---

绞杀者模式提供了一种安全、渐进的方法来现代化遗留系统。通过门面路由流量并逐步迁移功能，组织可以降低风险、保持业务连续性，并在整个迁移过程中持续交付价值。成功需要仔细的规划、健壮的监控，以及每个迁移阶段的规范执行。
