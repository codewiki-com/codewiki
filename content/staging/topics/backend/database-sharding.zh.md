---
title: 数据库分片策略
description: 掌握数据库水平扩展和分片技术
track: backend
section: databases
difficulty: advanced
tags:
  - 分片
  - 分库分表
  - 水平扩展
  - 数据库
status: imported
origin: old/src/content/docs/backend/database-sharding.zh.md
divergence: 0.138
issues: []
legacy:
  category: Backend
  subcategory: Database
  order: 23
  lastUpdated: 2026-01-07
---

随着业务规模的快速增长，单机数据库往往面临存储容量、查询性能和并发处理能力的瓶颈。数据库分片（Sharding）作为一种水平扩展方案，能够将数据分散到多个数据库节点上，从而突破单机限制，实现近乎无限的扩展能力。本文将深入探讨分片策略、实现方案以及常见问题的解决方法。

## 为什么需要分片

### 单机数据库的瓶颈

```
单机数据库瓶颈分析：
┌─────────────────────────────────────────────────────────────┐
│                     单机数据库限制                           │
├─────────────────────────────────────────────────────────────┤
│  存储瓶颈    │ 单表数据量过大，索引效率下降                   │
│             │ 磁盘空间有限，无法无限扩展                     │
├─────────────────────────────────────────────────────────────┤
│  性能瓶颈    │ 单机 CPU、内存资源有限                        │
│             │ 大表查询慢，锁竞争严重                         │
├─────────────────────────────────────────────────────────────┤
│  并发瓶颈    │ 连接数有限（通常 1000-5000）                   │
│             │ 写入吞吐量受限于单机磁盘 IO                    │
└─────────────────────────────────────────────────────────────┘
```

### 分片的核心优势

```typescript
// 分片带来的优势
interface ShardingBenefits {
  // 1. 水平扩展能力
  scalability: {
    description: '理论上可以无限扩展存储和计算能力';
    example: '从 1 个节点扩展到 100 个节点，容量提升 100 倍';
  };

  // 2. 性能提升
  performance: {
    description: '查询和写入负载分散到多个节点';
    example: '10 个分片并行处理，吞吐量提升 10 倍';
  };

  // 3. 高可用性
  availability: {
    description: '单个分片故障不影响整体服务';
    example: '分片 A 宕机，分片 B、C 仍可正常服务';
  };

  // 4. 隔离性
  isolation: {
    description: '不同分片可以独立维护和优化';
    example: '热点分片单独扩容，冷数据分片归档';
  };
}
```

### 何时考虑分片

```typescript
// 分片决策指标
interface ShardingIndicators {
  // 数据量指标
  dataVolume: {
    singleTableRows: '> 5000 万行';
    singleTableSize: '> 100 GB';
    totalDatabaseSize: '> 1 TB';
  };

  // 性能指标
  performance: {
    queryLatencyP99: '> 100 ms';
    writeLatencyP99: '> 50 ms';
    connectionUtilization: '> 80%';
  };

  // 业务增长指标
  growth: {
    dailyDataIncrement: '> 100 万行';
    expectedGrowthRate: '> 100%/年';
    peakQPS: '> 10000';
  };
}

// 分片前的替代方案评估
function evaluateAlternatives(): string[] {
  return [
    '1. 读写分离：主库写入，从库读取，缓解读压力',
    '2. 垂直分库：按业务模块拆分数据库',
    '3. 表分区：使用数据库原生分区功能',
    '4. 硬件升级：更强的 CPU、更大的内存、SSD',
    '5. 查询优化：索引优化、SQL 重写、缓存',
  ];
}
```

## 分片策略详解

### 哈希分片（Hash Sharding）

哈希分片是最常用的分片策略，通过对分片键进行哈希运算，将数据均匀分布到各个分片。

```typescript
// 哈希分片实现
class HashSharding {
  private shardCount: number;

  constructor(shardCount: number) {
    this.shardCount = shardCount;
  }

  // 基础取模分片
  getShardByMod(shardKey: number): number {
    return shardKey % this.shardCount;
  }

  // 一致性哈希分片
  getShardByConsistentHash(shardKey: string): number {
    const hash = this.murmurhash3(shardKey);
    return hash % this.shardCount;
  }

  // MurmurHash3 算法（简化版）
  private murmurhash3(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为 32 位整数
    }
    return Math.abs(hash);
  }

  // 虚拟节点一致性哈希
  getShardWithVirtualNodes(shardKey: string, virtualNodesPerShard: number = 150): number {
    const hash = this.murmurhash3(shardKey);
    const totalVirtualNodes = this.shardCount * virtualNodesPerShard;
    const virtualNodeIndex = hash % totalVirtualNodes;
    return Math.floor(virtualNodeIndex / virtualNodesPerShard);
  }
}

// 使用示例
const sharding = new HashSharding(8);
const userId = 123456789;
const shardId = sharding.getShardByMod(userId);
console.log(`用户 ${userId} 路由到分片 ${shardId}`);
```

```
哈希分片数据分布示意图：
┌─────────────────────────────────────────────────────────────┐
│                    用户数据分片                              │
├─────────────────────────────────────────────────────────────┤
│  user_id % 4 = 0  →  Shard 0  │ 用户 4, 8, 12, 16...        │
│  user_id % 4 = 1  →  Shard 1  │ 用户 1, 5, 9, 13...         │
│  user_id % 4 = 2  →  Shard 2  │ 用户 2, 6, 10, 14...        │
│  user_id % 4 = 3  →  Shard 3  │ 用户 3, 7, 11, 15...        │
└─────────────────────────────────────────────────────────────┘
```

**哈希分片的优缺点：**

```typescript
interface HashShardingAnalysis {
  advantages: [
    '数据分布均匀，避免热点',
    '分片算法简单，路由效率高',
    '扩容时可以使用一致性哈希减少数据迁移',
  ];

  disadvantages: [
    '范围查询需要跨所有分片',
    '分片扩容需要数据迁移',
    '不支持分片键的范围查询优化',
  ];

  suitableScenarios: [
    '用户数据（按用户 ID 分片）',
    '订单数据（按订单 ID 分片）',
    '会话数据（按会话 ID 分片）',
  ];
}
```

### 范围分片（Range Sharding）

范围分片根据分片键的值域范围，将数据划分到不同分片。

```typescript
// 范围分片实现
class RangeSharding {
  private ranges: Array<{ min: number; max: number; shardId: number }>;

  constructor() {
    // 定义分片范围
    this.ranges = [
      { min: 0, max: 999999, shardId: 0 },
      { min: 1000000, max: 1999999, shardId: 1 },
      { min: 2000000, max: 2999999, shardId: 2 },
      { min: 3000000, max: Number.MAX_SAFE_INTEGER, shardId: 3 },
    ];
  }

  // 根据值查找分片
  getShardByRange(value: number): number {
    for (const range of this.ranges) {
      if (value >= range.min && value <= range.max) {
        return range.shardId;
      }
    }
    throw new Error(`Value ${value} out of range`);
  }

  // 时间范围分片（按月）
  getShardByTimeRange(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `orders_${year}_${month}`;
  }

  // 动态范围分片（支持分裂）
  splitRange(shardId: number, splitPoint: number): void {
    const rangeIndex = this.ranges.findIndex(r => r.shardId === shardId);
    if (rangeIndex === -1) return;

    const originalRange = this.ranges[rangeIndex];
    const newShardId = this.ranges.length;

    // 分裂成两个范围
    this.ranges[rangeIndex] = {
      min: originalRange.min,
      max: splitPoint - 1,
      shardId: shardId,
    };

    this.ranges.splice(rangeIndex + 1, 0, {
      min: splitPoint,
      max: originalRange.max,
      shardId: newShardId,
    });
  }
}

// 时间范围分片示例
class TimeRangeSharding {
  // 按年分表
  getYearlyTable(tableName: string, date: Date): string {
    return `${tableName}_${date.getFullYear()}`;
  }

  // 按月分表
  getMonthlyTable(tableName: string, date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${tableName}_${year}${month}`;
  }

  // 按日分表
  getDailyTable(tableName: string, date: Date): string {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    return `${tableName}_${dateStr}`;
  }
}
```

```
范围分片数据分布示意图：
┌─────────────────────────────────────────────────────────────┐
│                    订单时间范围分片                          │
├─────────────────────────────────────────────────────────────┤
│  2024-01 ~ 2024-03  →  orders_2024_q1                       │
│  2024-04 ~ 2024-06  →  orders_2024_q2                       │
│  2024-07 ~ 2024-09  →  orders_2024_q3                       │
│  2024-10 ~ 2024-12  →  orders_2024_q4                       │
├─────────────────────────────────────────────────────────────┤
│  优势：历史数据可以归档，范围查询高效                         │
│  劣势：可能产生热点（最新数据集中在一个分片）                  │
└─────────────────────────────────────────────────────────────┘
```

### 目录分片（Directory Sharding）

目录分片通过维护一个独立的路由表来管理分片键与分片的映射关系。

```typescript
// 目录分片实现
class DirectorySharding {
  private routingTable: Map<string, number> = new Map();
  private shardCount: number;
  private defaultShard: number = 0;

  constructor(shardCount: number) {
    this.shardCount = shardCount;
  }

  // 查找分片
  getShard(shardKey: string): number {
    const shardId = this.routingTable.get(shardKey);
    if (shardId !== undefined) {
      return shardId;
    }
    // 新键分配到负载最低的分片
    return this.allocateToLeastLoadedShard(shardKey);
  }

  // 分配到负载最低的分片
  private allocateToLeastLoadedShard(shardKey: string): number {
    const shardLoads = new Map<number, number>();

    // 统计每个分片的数据量
    for (const shard of this.routingTable.values()) {
      shardLoads.set(shard, (shardLoads.get(shard) || 0) + 1);
    }

    // 找到负载最低的分片
    let minLoad = Infinity;
    let targetShard = 0;

    for (let i = 0; i < this.shardCount; i++) {
      const load = shardLoads.get(i) || 0;
      if (load < minLoad) {
        minLoad = load;
        targetShard = i;
      }
    }

    // 记录映射关系
    this.routingTable.set(shardKey, targetShard);
    return targetShard;
  }

  // 手动迁移数据
  migrateKey(shardKey: string, targetShard: number): void {
    if (targetShard >= this.shardCount) {
      throw new Error(`Invalid shard: ${targetShard}`);
    }
    this.routingTable.set(shardKey, targetShard);
  }

  // 批量迁移
  batchMigrate(keys: string[], targetShard: number): void {
    for (const key of keys) {
      this.migrateKey(key, targetShard);
    }
  }
}

// 基于 Redis 的路由表实现
class RedisDirectorySharding {
  private redis: any; // Redis client
  private routingPrefix = 'shard:routing:';

  async getShard(shardKey: string): Promise<number> {
    const key = this.routingPrefix + shardKey;
    const shardId = await this.redis.get(key);

    if (shardId !== null) {
      return parseInt(shardId, 10);
    }

    // 分配新分片并缓存
    const newShard = await this.allocateNewShard(shardKey);
    await this.redis.set(key, newShard);
    return newShard;
  }

  private async allocateNewShard(shardKey: string): Promise<number> {
    // 使用 Redis 原子操作进行负载均衡分配
    const shardCounts = await this.redis.mget(
      'shard:count:0', 'shard:count:1', 'shard:count:2', 'shard:count:3'
    );

    let minCount = Infinity;
    let targetShard = 0;

    shardCounts.forEach((count: string | null, index: number) => {
      const c = parseInt(count || '0', 10);
      if (c < minCount) {
        minCount = c;
        targetShard = index;
      }
    });

    await this.redis.incr(`shard:count:${targetShard}`);
    return targetShard;
  }
}
```

```
目录分片路由表示意图：
┌─────────────────────────────────────────────────────────────┐
│                      路由表（Directory）                     │
├───────────────┬─────────────────────────────────────────────┤
│  tenant_id    │  shard_id                                   │
├───────────────┼─────────────────────────────────────────────┤
│  tenant_001   │  0                                          │
│  tenant_002   │  1                                          │
│  tenant_003   │  0                                          │
│  tenant_004   │  2                                          │
│  tenant_005   │  1                                          │
└───────────────┴─────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│  优势：灵活的数据迁移，支持租户隔离                          │
│  劣势：路由表成为单点，需要额外维护                          │
└─────────────────────────────────────────────────────────────┘
```

### 复合分片策略

```typescript
// 复合分片：结合多种策略
class CompositeSharding {
  private hashSharding: HashSharding;
  private rangeSharding: RangeSharding;

  constructor() {
    this.hashSharding = new HashSharding(4);
    this.rangeSharding = new RangeSharding();
  }

  // 二级分片：先按租户哈希，再按时间范围
  getShardAndTable(tenantId: string, createTime: Date): { shardId: number; tableName: string } {
    // 第一级：按租户哈希分片（决定数据库实例）
    const shardId = this.hashSharding.getShardByConsistentHash(tenantId);

    // 第二级：按时间范围分表（决定具体表）
    const tableName = this.rangeSharding.getShardByTimeRange(createTime);

    return { shardId, tableName };
  }

  // 复合分片键
  getShardByCompositeKey(userId: number, orderId: number): number {
    // 使用复合键进行分片
    const compositeKey = `${userId}_${orderId}`;
    return this.hashSharding.getShardByConsistentHash(compositeKey);
  }
}

// 分库分表组合策略
interface ShardingConfig {
  // 分库配置
  database: {
    strategy: 'hash';
    shardKey: 'user_id';
    shardCount: 4;
  };
  // 分表配置
  table: {
    strategy: 'range';
    shardKey: 'create_time';
    interval: 'monthly';
  };
}
```

## 跨分片查询

### 跨分片查询的挑战

```typescript
// 跨分片查询问题示例
class CrossShardQueryChallenges {
  // 问题 1：聚合查询
  async getGlobalOrderCount(): Promise<number> {
    // 需要查询所有分片并汇总
    const shardResults = await Promise.all([
      this.queryShardA('SELECT COUNT(*) FROM orders'),
      this.queryShardB('SELECT COUNT(*) FROM orders'),
      this.queryShardC('SELECT COUNT(*) FROM orders'),
      this.queryShardD('SELECT COUNT(*) FROM orders'),
    ]);

    return shardResults.reduce((sum, count) => sum + count, 0);
  }

  // 问题 2：排序和分页
  async getTopOrders(page: number, pageSize: number): Promise<Order[]> {
    // 每个分片都需要返回足够的数据
    const offset = page * pageSize;
    const limit = offset + pageSize; // 需要获取更多数据

    const shardResults = await Promise.all([
      this.queryShardA(`SELECT * FROM orders ORDER BY amount DESC LIMIT ${limit}`),
      this.queryShardB(`SELECT * FROM orders ORDER BY amount DESC LIMIT ${limit}`),
      this.queryShardC(`SELECT * FROM orders ORDER BY amount DESC LIMIT ${limit}`),
      this.queryShardD(`SELECT * FROM orders ORDER BY amount DESC LIMIT ${limit}`),
    ]);

    // 合并、排序、分页
    const allOrders = shardResults.flat();
    allOrders.sort((a, b) => b.amount - a.amount);
    return allOrders.slice(offset, offset + pageSize);
  }

  // 问题 3：JOIN 查询
  async getOrdersWithUsers(): Promise<OrderWithUser[]> {
    // 如果 orders 和 users 在不同分片，JOIN 变得复杂
    // 解决方案：应用层 JOIN
    const orders = await this.getAllOrders();
    const userIds = [...new Set(orders.map(o => o.userId))];

    // 批量获取用户信息
    const users = await this.getUsersByIds(userIds);
    const userMap = new Map(users.map(u => [u.id, u]));

    return orders.map(order => ({
      ...order,
      user: userMap.get(order.userId),
    }));
  }

  private async queryShardA(sql: string): Promise<any> { /* ... */ }
  private async queryShardB(sql: string): Promise<any> { /* ... */ }
  private async queryShardC(sql: string): Promise<any> { /* ... */ }
  private async queryShardD(sql: string): Promise<any> { /* ... */ }
  private async getAllOrders(): Promise<any[]> { /* ... */ }
  private async getUsersByIds(ids: number[]): Promise<any[]> { /* ... */ }
}
```

### 跨分片查询优化策略

```typescript
// 跨分片查询优化器
class CrossShardQueryOptimizer {
  // 策略 1：分片剪枝（Shard Pruning）
  async queryWithPruning(sql: string, shardKey: number): Promise<any[]> {
    // 如果查询条件包含分片键，只查询相关分片
    const targetShard = this.getShardByKey(shardKey);
    return this.queryShards([targetShard], sql);
  }

  // 策略 2：并行查询 + 流式聚合
  async parallelAggregateQuery(sql: string): Promise<AggregateResult> {
    const shards = this.getAllShards();

    // 并行查询所有分片
    const results = await Promise.all(
      shards.map(shard => this.queryWithTimeout(shard, sql, 5000))
    );

    // 流式聚合结果
    return this.streamAggregate(results);
  }

  // 策略 3：二级索引表
  async queryBySecondaryIndex(indexValue: string): Promise<any[]> {
    // 从全局索引表获取分片信息
    const shardKeys = await this.getShardKeysFromIndex(indexValue);

    // 只查询相关分片
    const shardIds = [...new Set(shardKeys.map(k => this.getShardByKey(k)))];
    return this.queryShards(shardIds, `SELECT * FROM orders WHERE index_value = '${indexValue}'`);
  }

  // 策略 4：预计算汇总表
  async getPrecomputedStats(): Promise<Stats> {
    // 定时任务预计算的汇总数据
    return this.redis.get('order:stats:daily');
  }

  private getShardByKey(key: number): number { return key % 4; }
  private getAllShards(): number[] { return [0, 1, 2, 3]; }
  private async queryShards(shards: number[], sql: string): Promise<any[]> { return []; }
  private async queryWithTimeout(shard: number, sql: string, timeout: number): Promise<any[]> { return []; }
  private async streamAggregate(results: any[][]): Promise<AggregateResult> { return {} as AggregateResult; }
  private async getShardKeysFromIndex(value: string): Promise<number[]> { return []; }
  private redis: any;
}

interface AggregateResult {
  count: number;
  sum: number;
  avg: number;
}

// 全局二级索引设计
interface GlobalSecondaryIndex {
  // 索引表结构
  table: 'global_order_index';
  columns: {
    index_key: 'user_email'; // 索引字段
    shard_key: 'user_id';    // 分片键
    shard_id: 'number';      // 分片 ID
    primary_key: 'order_id'; // 原表主键
  };

  // 使用场景
  query: 'SELECT * FROM orders WHERE user_email = ?';

  // 查询流程
  flow: [
    '1. 查询全局索引获取 shard_id 和 primary_key',
    '2. 根据 shard_id 路由到对应分片',
    '3. 使用 primary_key 查询具体数据',
  ];
}
```

### 分页查询优化

```typescript
// 跨分片分页优化
class CrossShardPagination {
  private shardCount = 4;

  // 方案 1：禁止跳页，只支持上一页/下一页
  async cursorBasedPagination(
    cursor: string | null,
    pageSize: number,
    direction: 'next' | 'prev'
  ): Promise<{ data: Order[]; nextCursor: string; prevCursor: string }> {
    // 解析游标
    const cursorData = cursor ? this.decodeCursor(cursor) : null;

    // 并行查询各分片
    const shardResults = await Promise.all(
      Array.from({ length: this.shardCount }, (_, i) =>
        this.queryShardWithCursor(i, cursorData, pageSize + 1, direction)
      )
    );

    // 归并排序
    const merged = this.mergeAndSort(shardResults.flat(), pageSize + 1);

    // 截取结果
    const hasMore = merged.length > pageSize;
    const data = merged.slice(0, pageSize);

    return {
      data,
      nextCursor: hasMore ? this.encodeCursor(data[data.length - 1]) : '',
      prevCursor: cursorData ? this.encodeCursor(data[0]) : '',
    };
  }

  // 方案 2：估算总数 + 采样分页
  async estimatedPagination(page: number, pageSize: number): Promise<{
    data: Order[];
    estimatedTotal: number;
    currentPage: number;
  }> {
    // 获取各分片的估算数量
    const shardCounts = await this.getEstimatedCounts();
    const estimatedTotal = shardCounts.reduce((a, b) => a + b, 0);

    // 计算每个分片应该贡献的数量
    const offset = page * pageSize;
    const shardOffsets = this.calculateShardOffsets(shardCounts, offset, pageSize);

    // 并行查询
    const results = await Promise.all(
      shardOffsets.map((so, i) =>
        this.queryShardPage(i, so.offset, so.limit)
      )
    );

    return {
      data: results.flat().slice(0, pageSize),
      estimatedTotal,
      currentPage: page,
    };
  }

  // 方案 3：分片内部分页（推荐方案）
  async shardAwarePagination(
    shardKey: number,
    page: number,
    pageSize: number
  ): Promise<{ data: Order[]; total: number }> {
    // 根据分片键路由到单个分片
    const shardId = shardKey % this.shardCount;

    // 只在单个分片内分页
    const result = await this.querySingleShard(
      shardId,
      `SELECT * FROM orders WHERE user_id = ? ORDER BY create_time DESC LIMIT ? OFFSET ?`,
      [shardKey, pageSize, page * pageSize]
    );

    const total = await this.querySingleShard(
      shardId,
      `SELECT COUNT(*) as count FROM orders WHERE user_id = ?`,
      [shardKey]
    );

    return { data: result, total: total[0].count };
  }

  private decodeCursor(cursor: string): any { return JSON.parse(Buffer.from(cursor, 'base64').toString()); }
  private encodeCursor(data: any): string { return Buffer.from(JSON.stringify(data)).toString('base64'); }
  private async queryShardWithCursor(shard: number, cursor: any, limit: number, direction: string): Promise<Order[]> { return []; }
  private mergeAndSort(data: Order[], limit: number): Order[] { return data.sort((a, b) => b.createTime.getTime() - a.createTime.getTime()).slice(0, limit); }
  private async getEstimatedCounts(): Promise<number[]> { return []; }
  private calculateShardOffsets(counts: number[], offset: number, limit: number): Array<{ offset: number; limit: number }> { return []; }
  private async queryShardPage(shard: number, offset: number, limit: number): Promise<Order[]> { return []; }
  private async querySingleShard(shard: number, sql: string, params: any[]): Promise<any[]> { return []; }
}

interface Order {
  id: number;
  userId: number;
  amount: number;
  createTime: Date;
}
```

## 分布式事务

### 分布式事务挑战

```typescript
// 跨分片事务问题
class DistributedTransactionProblem {
  // 场景：转账操作涉及两个分片
  async transfer(fromUserId: number, toUserId: number, amount: number): Promise<void> {
    const fromShard = this.getShardByUserId(fromUserId);
    const toShard = this.getShardByUserId(toUserId);

    if (fromShard === toShard) {
      // 同分片事务，使用本地事务
      await this.localTransaction(fromShard, fromUserId, toUserId, amount);
    } else {
      // 跨分片事务，需要分布式事务支持
      await this.distributedTransaction(fromShard, toShard, fromUserId, toUserId, amount);
    }
  }

  private getShardByUserId(userId: number): number { return userId % 4; }
  private async localTransaction(shard: number, from: number, to: number, amount: number): Promise<void> {}
  private async distributedTransaction(fromShard: number, toShard: number, from: number, to: number, amount: number): Promise<void> {}
}
```

### 两阶段提交（2PC）

```typescript
// 两阶段提交实现
class TwoPhaseCommit {
  private coordinator: TransactionCoordinator;
  private participants: Map<number, TransactionParticipant> = new Map();

  // 阶段一：准备阶段
  async prepare(transactionId: string, operations: ShardOperation[]): Promise<boolean> {
    const preparePromises = operations.map(async op => {
      const participant = this.participants.get(op.shardId);
      if (!participant) throw new Error(`Shard ${op.shardId} not found`);

      try {
        // 请求各参与者准备事务
        const result = await participant.prepare(transactionId, op.sql, op.params);
        return { shardId: op.shardId, success: result };
      } catch (error) {
        return { shardId: op.shardId, success: false };
      }
    });

    const results = await Promise.all(preparePromises);

    // 检查所有参与者是否都准备成功
    return results.every(r => r.success);
  }

  // 阶段二：提交/回滚阶段
  async commit(transactionId: string): Promise<void> {
    const commitPromises = Array.from(this.participants.values()).map(
      participant => participant.commit(transactionId)
    );

    await Promise.all(commitPromises);
  }

  async rollback(transactionId: string): Promise<void> {
    const rollbackPromises = Array.from(this.participants.values()).map(
      participant => participant.rollback(transactionId)
    );

    await Promise.all(rollbackPromises);
  }

  // 完整的事务执行流程
  async executeTransaction(operations: ShardOperation[]): Promise<boolean> {
    const transactionId = this.generateTransactionId();

    try {
      // 阶段一：准备
      const prepared = await this.prepare(transactionId, operations);

      if (prepared) {
        // 阶段二：提交
        await this.commit(transactionId);
        return true;
      } else {
        // 准备失败，回滚
        await this.rollback(transactionId);
        return false;
      }
    } catch (error) {
      // 发生异常，回滚
      await this.rollback(transactionId);
      throw error;
    }
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

interface ShardOperation {
  shardId: number;
  sql: string;
  params: any[];
}

interface TransactionCoordinator {
  beginTransaction(): Promise<string>;
  endTransaction(transactionId: string): Promise<void>;
}

interface TransactionParticipant {
  prepare(transactionId: string, sql: string, params: any[]): Promise<boolean>;
  commit(transactionId: string): Promise<void>;
  rollback(transactionId: string): Promise<void>;
}
```

```
两阶段提交流程图：
┌─────────────────────────────────────────────────────────────┐
│                      协调者 (Coordinator)                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  参与者 A    │   │  参与者 B    │   │  参与者 C   │
│  (Shard 0)  │   │  (Shard 1)  │   │  (Shard 2)  │
└─────────────┘   └─────────────┘   └─────────────┘

阶段一（Prepare）：
  协调者 → 参与者: "准备提交事务 T"
  参与者 → 协调者: "准备就绪" 或 "准备失败"

阶段二（Commit/Rollback）：
  如果所有参与者准备就绪:
    协调者 → 参与者: "提交事务 T"
  否则:
    协调者 → 参与者: "回滚事务 T"
```

### Saga 模式

```typescript
// Saga 模式实现
class SagaOrchestrator {
  private steps: SagaStep[] = [];

  // 添加 Saga 步骤
  addStep(step: SagaStep): this {
    this.steps.push(step);
    return this;
  }

  // 执行 Saga
  async execute(context: SagaContext): Promise<SagaResult> {
    const completedSteps: SagaStep[] = [];

    try {
      // 顺序执行各步骤
      for (const step of this.steps) {
        await step.execute(context);
        completedSteps.push(step);
      }

      return { success: true, context };
    } catch (error) {
      // 发生错误，执行补偿操作
      console.error('Saga execution failed:', error);

      // 逆序执行补偿
      for (let i = completedSteps.length - 1; i >= 0; i--) {
        try {
          await completedSteps[i].compensate(context);
        } catch (compensateError) {
          console.error(`Compensation failed for step ${i}:`, compensateError);
          // 补偿失败需要人工介入
        }
      }

      return { success: false, error: error as Error, context };
    }
  }
}

interface SagaStep {
  name: string;
  execute(context: SagaContext): Promise<void>;
  compensate(context: SagaContext): Promise<void>;
}

interface SagaContext {
  [key: string]: any;
}

interface SagaResult {
  success: boolean;
  error?: Error;
  context: SagaContext;
}

// 转账 Saga 示例
class TransferSaga {
  createSaga(): SagaOrchestrator {
    return new SagaOrchestrator()
      // 步骤 1：从源账户扣款
      .addStep({
        name: 'debit',
        async execute(ctx: SagaContext) {
          await ctx.sourceAccountService.debit(ctx.fromUserId, ctx.amount);
          ctx.debited = true;
        },
        async compensate(ctx: SagaContext) {
          if (ctx.debited) {
            await ctx.sourceAccountService.credit(ctx.fromUserId, ctx.amount);
          }
        },
      })
      // 步骤 2：向目标账户入款
      .addStep({
        name: 'credit',
        async execute(ctx: SagaContext) {
          await ctx.targetAccountService.credit(ctx.toUserId, ctx.amount);
          ctx.credited = true;
        },
        async compensate(ctx: SagaContext) {
          if (ctx.credited) {
            await ctx.targetAccountService.debit(ctx.toUserId, ctx.amount);
          }
        },
      })
      // 步骤 3：记录转账日志
      .addStep({
        name: 'log',
        async execute(ctx: SagaContext) {
          await ctx.transferLogService.log({
            from: ctx.fromUserId,
            to: ctx.toUserId,
            amount: ctx.amount,
            status: 'completed',
          });
        },
        async compensate(ctx: SagaContext) {
          await ctx.transferLogService.log({
            from: ctx.fromUserId,
            to: ctx.toUserId,
            amount: ctx.amount,
            status: 'rolled_back',
          });
        },
      });
  }

  async transfer(fromUserId: number, toUserId: number, amount: number): Promise<boolean> {
    const saga = this.createSaga();

    const result = await saga.execute({
      fromUserId,
      toUserId,
      amount,
      sourceAccountService: new AccountService(this.getShardByUserId(fromUserId)),
      targetAccountService: new AccountService(this.getShardByUserId(toUserId)),
      transferLogService: new TransferLogService(),
    });

    return result.success;
  }

  private getShardByUserId(userId: number): number { return userId % 4; }
}

class AccountService {
  constructor(private shardId: number) {}
  async debit(userId: number, amount: number): Promise<void> {}
  async credit(userId: number, amount: number): Promise<void> {}
}

class TransferLogService {
  async log(data: any): Promise<void> {}
}
```

### TCC 模式

```typescript
// TCC (Try-Confirm-Cancel) 模式
interface TCCService<T> {
  // Try: 预留资源
  try(context: T): Promise<void>;
  // Confirm: 确认操作
  confirm(context: T): Promise<void>;
  // Cancel: 取消操作
  cancel(context: T): Promise<void>;
}

// 库存服务 TCC 实现
class InventoryTCCService implements TCCService<OrderContext> {
  async try(context: OrderContext): Promise<void> {
    // 冻结库存（预扣）
    await this.db.execute(
      `UPDATE products
       SET frozen_stock = frozen_stock + ?,
           available_stock = available_stock - ?
       WHERE id = ? AND available_stock >= ?`,
      [context.quantity, context.quantity, context.productId, context.quantity]
    );

    // 记录冻结信息
    await this.db.execute(
      `INSERT INTO stock_freeze (transaction_id, product_id, quantity, status)
       VALUES (?, ?, ?, 'frozen')`,
      [context.transactionId, context.productId, context.quantity]
    );
  }

  async confirm(context: OrderContext): Promise<void> {
    // 确认扣减，清除冻结
    await this.db.execute(
      `UPDATE products
       SET frozen_stock = frozen_stock - ?
       WHERE id = ?`,
      [context.quantity, context.productId]
    );

    // 更新冻结记录状态
    await this.db.execute(
      `UPDATE stock_freeze SET status = 'confirmed' WHERE transaction_id = ?`,
      [context.transactionId]
    );
  }

  async cancel(context: OrderContext): Promise<void> {
    // 取消冻结，恢复库存
    await this.db.execute(
      `UPDATE products
       SET frozen_stock = frozen_stock - ?,
           available_stock = available_stock + ?
       WHERE id = ?`,
      [context.quantity, context.quantity, context.productId]
    );

    // 更新冻结记录状态
    await this.db.execute(
      `UPDATE stock_freeze SET status = 'cancelled' WHERE transaction_id = ?`,
      [context.transactionId]
    );
  }

  private db: any;
}

interface OrderContext {
  transactionId: string;
  productId: number;
  quantity: number;
  userId: number;
  amount: number;
}

// TCC 事务协调器
class TCCCoordinator {
  private services: TCCService<any>[] = [];

  register(service: TCCService<any>): void {
    this.services.push(service);
  }

  async execute<T>(context: T): Promise<boolean> {
    const triedServices: TCCService<T>[] = [];

    try {
      // Try 阶段
      for (const service of this.services) {
        await service.try(context);
        triedServices.push(service);
      }

      // Confirm 阶段
      for (const service of this.services) {
        await service.confirm(context);
      }

      return true;
    } catch (error) {
      // Cancel 阶段（只取消已 try 成功的服务）
      for (const service of triedServices) {
        try {
          await service.cancel(context);
        } catch (cancelError) {
          console.error('Cancel failed:', cancelError);
          // 需要人工介入或重试机制
        }
      }

      return false;
    }
  }
}
```

## 分片再平衡（Rebalancing）

### 为什么需要再平衡

```typescript
// 再平衡触发条件
interface RebalanceTriggers {
  // 数据倾斜
  dataSkew: {
    condition: '分片数据量差异超过 30%';
    example: 'Shard 0: 10GB, Shard 1: 100GB';
  };

  // 热点分片
  hotSpot: {
    condition: '分片 QPS 差异超过 50%';
    example: 'Shard 0: 1000 QPS, Shard 1: 100 QPS';
  };

  // 扩容/缩容
  scaling: {
    condition: '增加或减少分片数量';
    example: '从 4 个分片扩展到 8 个分片';
  };

  // 硬件升级
  hardwareChange: {
    condition: '分片服务器配置变更';
    example: '新服务器性能更强，应该承担更多负载';
  };
}
```

### 再平衡策略

```typescript
// 分片再平衡实现
class ShardRebalancer {
  // 策略 1：全量迁移
  async fullMigration(
    sourceShards: number[],
    targetShards: number[],
    newShardingFunc: (key: string) => number
  ): Promise<void> {
    // 1. 停止写入
    await this.pauseWrites();

    // 2. 计算每条数据的新分片
    for (const sourceShard of sourceShards) {
      const data = await this.getAllData(sourceShard);

      for (const record of data) {
        const newShard = newShardingFunc(record.shardKey);
        if (newShard !== sourceShard) {
          // 迁移数据
          await this.migrateRecord(record, sourceShard, newShard);
        }
      }
    }

    // 3. 恢复写入
    await this.resumeWrites();
  }

  // 策略 2：双写迁移（在线迁移）
  async onlineMigration(
    sourceShard: number,
    targetShard: number,
    keyRange: { start: string; end: string }
  ): Promise<void> {
    // 阶段 1：开始双写
    await this.enableDualWrite(sourceShard, targetShard, keyRange);

    // 阶段 2：后台迁移历史数据
    await this.migrateHistoricalData(sourceShard, targetShard, keyRange);

    // 阶段 3：验证数据一致性
    const isConsistent = await this.verifyConsistency(sourceShard, targetShard, keyRange);
    if (!isConsistent) {
      throw new Error('Data inconsistency detected');
    }

    // 阶段 4：切换读取到新分片
    await this.switchReads(targetShard, keyRange);

    // 阶段 5：停止双写，只写新分片
    await this.disableDualWrite(sourceShard, keyRange);

    // 阶段 6：清理源分片数据
    await this.cleanupSourceData(sourceShard, keyRange);
  }

  // 策略 3：一致性哈希扩容
  async consistentHashExpansion(newNodeId: string): Promise<void> {
    const hashRing = this.getHashRing();

    // 1. 添加新节点到哈希环
    hashRing.addNode(newNodeId);

    // 2. 计算需要迁移的数据范围
    const migrationRanges = hashRing.getMigrationRanges(newNodeId);

    // 3. 逐个范围迁移数据
    for (const range of migrationRanges) {
      await this.onlineMigration(
        range.sourceNode,
        newNodeId,
        { start: range.start, end: range.end }
      );
    }
  }

  private async pauseWrites(): Promise<void> {}
  private async resumeWrites(): Promise<void> {}
  private async getAllData(shard: number): Promise<any[]> { return []; }
  private async migrateRecord(record: any, from: number, to: number): Promise<void> {}
  private async enableDualWrite(source: number, target: number, range: any): Promise<void> {}
  private async migrateHistoricalData(source: number, target: number, range: any): Promise<void> {}
  private async verifyConsistency(source: number, target: number, range: any): Promise<boolean> { return true; }
  private async switchReads(target: number, range: any): Promise<void> {}
  private async disableDualWrite(source: number, range: any): Promise<void> {}
  private async cleanupSourceData(source: number, range: any): Promise<void> {}
  private getHashRing(): any { return null; }
}

// 一致性哈希环
class ConsistentHashRing {
  private ring: Map<number, string> = new Map();
  private virtualNodesCount = 150;

  addNode(nodeId: string): void {
    for (let i = 0; i < this.virtualNodesCount; i++) {
      const hash = this.hash(`${nodeId}:${i}`);
      this.ring.set(hash, nodeId);
    }
    // 排序哈希环
    this.sortRing();
  }

  removeNode(nodeId: string): void {
    for (let i = 0; i < this.virtualNodesCount; i++) {
      const hash = this.hash(`${nodeId}:${i}`);
      this.ring.delete(hash);
    }
  }

  getNode(key: string): string {
    const hash = this.hash(key);
    // 找到第一个大于等于 hash 的节点
    for (const [nodeHash, nodeId] of this.ring) {
      if (nodeHash >= hash) {
        return nodeId;
      }
    }
    // 如果没找到，返回第一个节点（环形结构）
    return this.ring.values().next().value;
  }

  getMigrationRanges(newNodeId: string): Array<{
    sourceNode: string;
    start: string;
    end: string;
  }> {
    // 计算新节点应该接管的数据范围
    const ranges: any[] = [];
    // ... 实现细节
    return ranges;
  }

  private hash(key: string): number {
    // MurmurHash 或其他哈希算法
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private sortRing(): void {
    this.ring = new Map([...this.ring.entries()].sort((a, b) => a[0] - b[0]));
  }
}
```

```
一致性哈希扩容示意图：
┌─────────────────────────────────────────────────────────────┐
│                    扩容前（3 节点）                          │
│                                                             │
│            Node A                                           │
│              ●                                              │
│           ╱     ╲                                           │
│         ╱         ╲                                         │
│       ●─────────────●                                       │
│    Node C         Node B                                    │
│                                                             │
│    每个节点负责 1/3 的数据                                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    扩容后（4 节点）                          │
│                                                             │
│            Node A                                           │
│              ●                                              │
│           ╱     ╲                                           │
│    Node D ●       ╲                                         │
│           │         ●                                       │
│           │      Node B                                     │
│           ●                                                 │
│        Node C                                               │
│                                                             │
│    只需迁移 1/4 的数据到 Node D                              │
└─────────────────────────────────────────────────────────────┘
```

## 分片工具和中间件

### Vitess

```yaml
# Vitess 架构配置示例
vitess:
  # VTGate：查询路由
  vtgate:
    replicas: 3
    resources:
      requests:
        cpu: "2"
        memory: "4Gi"

  # VTTablet：数据节点
  tablets:
    - keyspace: "commerce"
      shards:
        - name: "-80"  # 分片 1
          tablets:
            - type: master
            - type: replica
            - type: replica
        - name: "80-"  # 分片 2
          tablets:
            - type: master
            - type: replica
            - type: replica

  # VTAdmin：管理界面
  vtadmin:
    enabled: true
```

```sql
-- Vitess VSchema 定义
{
  "sharded": true,
  "vindexes": {
    "hash": {
      "type": "hash"
    },
    "user_id_idx": {
      "type": "consistent_lookup_unique",
      "params": {
        "table": "user_id_lookup",
        "from": "email",
        "to": "user_id"
      },
      "owner": "users"
    }
  },
  "tables": {
    "users": {
      "column_vindexes": [
        {
          "column": "user_id",
          "name": "hash"
        }
      ]
    },
    "orders": {
      "column_vindexes": [
        {
          "column": "user_id",
          "name": "hash"
        }
      ]
    }
  }
}
```

```typescript
// Vitess 客户端使用示例
import { createConnection } from 'mysql2/promise';

class VitessClient {
  private connection: any;

  async connect(): Promise<void> {
    // 连接到 VTGate
    this.connection = await createConnection({
      host: 'vtgate.example.com',
      port: 3306,
      user: 'app_user',
      password: 'password',
      database: 'commerce@master', // keyspace@tablet_type
    });
  }

  // 普通查询（VTGate 自动路由）
  async getUser(userId: number): Promise<any> {
    const [rows] = await this.connection.execute(
      'SELECT * FROM users WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  }

  // 跨分片查询（VTGate 自动 scatter-gather）
  async getAllUsers(): Promise<any[]> {
    const [rows] = await this.connection.execute(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT 100'
    );
    return rows;
  }

  // 事务（需要在同一分片内）
  async createOrder(userId: number, orderData: any): Promise<void> {
    await this.connection.beginTransaction();
    try {
      await this.connection.execute(
        'INSERT INTO orders (user_id, amount) VALUES (?, ?)',
        [userId, orderData.amount]
      );
      await this.connection.execute(
        'UPDATE user_stats SET total_orders = total_orders + 1 WHERE user_id = ?',
        [userId]
      );
      await this.connection.commit();
    } catch (error) {
      await this.connection.rollback();
      throw error;
    }
  }
}
```

### Apache ShardingSphere

```yaml
# ShardingSphere-Proxy 配置
schemaName: sharding_db

dataSources:
  ds_0:
    url: jdbc:mysql://mysql-0:3306/db0
    username: root
    password: root
    connectionTimeoutMilliseconds: 30000
    maxPoolSize: 50
  ds_1:
    url: jdbc:mysql://mysql-1:3306/db1
    username: root
    password: root
    connectionTimeoutMilliseconds: 30000
    maxPoolSize: 50
  ds_2:
    url: jdbc:mysql://mysql-2:3306/db2
    username: root
    password: root
    connectionTimeoutMilliseconds: 30000
    maxPoolSize: 50
  ds_3:
    url: jdbc:mysql://mysql-3:3306/db3
    username: root
    password: root
    connectionTimeoutMilliseconds: 30000
    maxPoolSize: 50

rules:
  # 分片规则
  - !SHARDING
    tables:
      # 用户表分片配置
      users:
        actualDataNodes: ds_${0..3}.users_${0..15}
        databaseStrategy:
          standard:
            shardingColumn: user_id
            shardingAlgorithmName: database_inline
        tableStrategy:
          standard:
            shardingColumn: user_id
            shardingAlgorithmName: table_inline
        keyGenerateStrategy:
          column: user_id
          keyGeneratorName: snowflake

      # 订单表分片配置
      orders:
        actualDataNodes: ds_${0..3}.orders_${0..15}
        databaseStrategy:
          standard:
            shardingColumn: user_id
            shardingAlgorithmName: database_inline
        tableStrategy:
          standard:
            shardingColumn: order_id
            shardingAlgorithmName: table_inline

    # 绑定表（JOIN 优化）
    bindingTables:
      - users, orders

    # 广播表（每个分片都有完整数据）
    broadcastTables:
      - config
      - dict

    # 分片算法
    shardingAlgorithms:
      database_inline:
        type: INLINE
        props:
          algorithm-expression: ds_${user_id % 4}
      table_inline:
        type: INLINE
        props:
          algorithm-expression: ${table_name}_${(user_id / 4).intValue() % 16}

    # ID 生成器
    keyGenerators:
      snowflake:
        type: SNOWFLAKE
        props:
          worker-id: 1

  # 读写分离规则
  - !READWRITE_SPLITTING
    dataSources:
      readwrite_ds_0:
        writeDataSourceName: ds_0
        readDataSourceNames:
          - ds_0_slave_0
          - ds_0_slave_1
        loadBalancerName: round_robin
    loadBalancers:
      round_robin:
        type: ROUND_ROBIN
```

```java
// ShardingSphere-JDBC 使用示例
@Configuration
public class ShardingConfig {

    @Bean
    public DataSource dataSource() throws SQLException {
        // 配置真实数据源
        Map<String, DataSource> dataSourceMap = new HashMap<>();
        dataSourceMap.put("ds_0", createDataSource("jdbc:mysql://localhost:3306/db0"));
        dataSourceMap.put("ds_1", createDataSource("jdbc:mysql://localhost:3306/db1"));

        // 配置分片规则
        ShardingRuleConfiguration shardingRuleConfig = new ShardingRuleConfiguration();

        // 用户表分片
        ShardingTableRuleConfiguration userTableRule = new ShardingTableRuleConfiguration(
            "users", "ds_${0..1}.users_${0..3}"
        );
        userTableRule.setDatabaseShardingStrategy(
            new StandardShardingStrategyConfiguration("user_id", "databaseShardingAlgorithm")
        );
        userTableRule.setTableShardingStrategy(
            new StandardShardingStrategyConfiguration("user_id", "tableShardingAlgorithm")
        );
        shardingRuleConfig.getTables().add(userTableRule);

        // 配置分片算法
        Properties dbProps = new Properties();
        dbProps.setProperty("algorithm-expression", "ds_${user_id % 2}");
        shardingRuleConfig.getShardingAlgorithms().put(
            "databaseShardingAlgorithm",
            new AlgorithmConfiguration("INLINE", dbProps)
        );

        Properties tableProps = new Properties();
        tableProps.setProperty("algorithm-expression", "users_${user_id % 4}");
        shardingRuleConfig.getShardingAlgorithms().put(
            "tableShardingAlgorithm",
            new AlgorithmConfiguration("INLINE", tableProps)
        );

        // 创建 ShardingSphere 数据源
        return ShardingSphereDataSourceFactory.createDataSource(
            dataSourceMap,
            Collections.singleton(shardingRuleConfig),
            new Properties()
        );
    }

    private DataSource createDataSource(String url) {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(url);
        dataSource.setUsername("root");
        dataSource.setPassword("root");
        return dataSource;
    }
}
```

### 自建分片中间件

```typescript
// 轻量级分片中间件实现
class ShardingMiddleware {
  private shardingConfig: ShardingConfig;
  private connectionPools: Map<string, ConnectionPool> = new Map();
  private queryParser: SQLParser;

  constructor(config: ShardingConfig) {
    this.shardingConfig = config;
    this.queryParser = new SQLParser();
    this.initConnectionPools();
  }

  private initConnectionPools(): void {
    for (const shard of this.shardingConfig.shards) {
      const pool = new ConnectionPool({
        host: shard.host,
        port: shard.port,
        database: shard.database,
        user: this.shardingConfig.user,
        password: this.shardingConfig.password,
        poolSize: this.shardingConfig.poolSize,
      });
      this.connectionPools.set(shard.name, pool);
    }
  }

  // 执行查询
  async query(sql: string, params: any[] = []): Promise<any[]> {
    // 解析 SQL
    const parsedQuery = this.queryParser.parse(sql);

    // 确定目标分片
    const targetShards = this.routeQuery(parsedQuery, params);

    if (targetShards.length === 1) {
      // 单分片查询
      return this.executeSingle(targetShards[0], sql, params);
    } else {
      // 多分片查询
      return this.executeScatter(targetShards, sql, params, parsedQuery);
    }
  }

  // 路由查询
  private routeQuery(query: ParsedQuery, params: any[]): string[] {
    const tableConfig = this.shardingConfig.tables[query.tableName];

    if (!tableConfig) {
      // 非分片表，发送到默认分片
      return [this.shardingConfig.defaultShard];
    }

    // 检查是否包含分片键条件
    const shardKeyValue = this.extractShardKeyValue(query, params, tableConfig.shardKey);

    if (shardKeyValue !== null) {
      // 有分片键，路由到特定分片
      const shardIndex = this.calculateShard(shardKeyValue, tableConfig.shardCount);
      return [`shard_${shardIndex}`];
    }

    // 没有分片键，需要查询所有分片
    return this.shardingConfig.shards.map(s => s.name);
  }

  // 计算分片
  private calculateShard(value: any, shardCount: number): number {
    if (typeof value === 'number') {
      return value % shardCount;
    }
    // 字符串类型使用哈希
    return this.hash(String(value)) % shardCount;
  }

  // 单分片执行
  private async executeSingle(shard: string, sql: string, params: any[]): Promise<any[]> {
    const pool = this.connectionPools.get(shard);
    if (!pool) throw new Error(`Shard ${shard} not found`);
    return pool.query(sql, params);
  }

  // 多分片并行执行
  private async executeScatter(
    shards: string[],
    sql: string,
    params: any[],
    query: ParsedQuery
  ): Promise<any[]> {
    // 并行查询所有分片
    const results = await Promise.all(
      shards.map(shard => this.executeSingle(shard, sql, params))
    );

    // 合并结果
    let merged = results.flat();

    // 处理排序
    if (query.orderBy) {
      merged = this.sortResults(merged, query.orderBy);
    }

    // 处理限制
    if (query.limit) {
      merged = merged.slice(query.offset || 0, (query.offset || 0) + query.limit);
    }

    return merged;
  }

  // 分布式事务
  async transaction(operations: TransactionOperation[]): Promise<void> {
    // 按分片分组操作
    const shardOperations = this.groupByShards(operations);

    // 检查是否跨分片
    if (shardOperations.size === 1) {
      // 单分片事务
      const [shard, ops] = [...shardOperations.entries()][0];
      await this.executeLocalTransaction(shard, ops);
    } else {
      // 跨分片事务，使用 2PC 或 Saga
      await this.executeDistributedTransaction(shardOperations);
    }
  }

  private extractShardKeyValue(query: ParsedQuery, params: any[], shardKey: string): any { return null; }
  private hash(str: string): number { return 0; }
  private sortResults(results: any[], orderBy: any): any[] { return results; }
  private groupByShards(operations: TransactionOperation[]): Map<string, TransactionOperation[]> { return new Map(); }
  private async executeLocalTransaction(shard: string, ops: TransactionOperation[]): Promise<void> {}
  private async executeDistributedTransaction(shardOps: Map<string, TransactionOperation[]>): Promise<void> {}
}

interface ShardingConfig {
  shards: Array<{
    name: string;
    host: string;
    port: number;
    database: string;
  }>;
  tables: {
    [tableName: string]: {
      shardKey: string;
      shardCount: number;
      strategy: 'hash' | 'range' | 'directory';
    };
  };
  defaultShard: string;
  user: string;
  password: string;
  poolSize: number;
}

interface ParsedQuery {
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  tableName: string;
  conditions: any[];
  orderBy?: any;
  limit?: number;
  offset?: number;
}

interface TransactionOperation {
  sql: string;
  params: any[];
  shardKey: any;
}

class ConnectionPool {
  constructor(config: any) {}
  async query(sql: string, params: any[]): Promise<any[]> { return []; }
}

class SQLParser {
  parse(sql: string): ParsedQuery {
    return {} as ParsedQuery;
  }
}
```

## 分片最佳实践

### 分片键选择

```typescript
// 分片键选择指南
interface ShardKeyGuidelines {
  // 好的分片键特征
  goodCharacteristics: [
    '高基数：值域广泛，避免热点',
    '查询频繁使用：大部分查询都带有此条件',
    '不可变：分片键值不会改变',
    '均匀分布：数据在各分片间均匀分布',
  ];

  // 常见分片键示例
  examples: {
    userTable: 'user_id';           // 用户表按用户 ID
    orderTable: 'user_id';          // 订单表按用户 ID（而非订单 ID）
    logTable: 'timestamp';          // 日志表按时间范围
    tenantTable: 'tenant_id';       // 多租户按租户 ID
  };

  // 避免的分片键
  avoid: [
    '低基数字段（如 status、type）',
    '经常变化的字段',
    '时间戳（除非明确需要时间范围查询）',
    '复合键（增加复杂性）',
  ];
}

// 分片键选择评估器
class ShardKeyEvaluator {
  async evaluate(
    tableName: string,
    candidateKeys: string[],
    sampleQueries: string[]
  ): Promise<ShardKeyScore[]> {
    const scores: ShardKeyScore[] = [];

    for (const key of candidateKeys) {
      const score: ShardKeyScore = {
        key,
        cardinality: await this.measureCardinality(tableName, key),
        distribution: await this.measureDistribution(tableName, key),
        queryAffinity: this.calculateQueryAffinity(key, sampleQueries),
        mutability: await this.checkMutability(tableName, key),
        totalScore: 0,
      };

      // 计算总分
      score.totalScore =
        score.cardinality * 0.3 +
        score.distribution * 0.3 +
        score.queryAffinity * 0.3 +
        (score.mutability ? 0 : 10) * 0.1;

      scores.push(score);
    }

    return scores.sort((a, b) => b.totalScore - a.totalScore);
  }

  private async measureCardinality(table: string, key: string): Promise<number> {
    // 返回 0-100 的基数评分
    return 0;
  }

  private async measureDistribution(table: string, key: string): Promise<number> {
    // 返回 0-100 的分布均匀度评分
    return 0;
  }

  private calculateQueryAffinity(key: string, queries: string[]): number {
    // 返回 0-100 的查询亲和度评分
    return 0;
  }

  private async checkMutability(table: string, key: string): Promise<boolean> {
    // 返回字段是否可变
    return false;
  }
}

interface ShardKeyScore {
  key: string;
  cardinality: number;     // 基数评分
  distribution: number;    // 分布均匀度
  queryAffinity: number;   // 查询亲和度
  mutability: boolean;     // 是否可变
  totalScore: number;      // 综合评分
}
```

### 分片数量规划

```typescript
// 分片数量规划指南
interface ShardingCapacityPlanning {
  // 初始分片数量计算
  initialShardCount: {
    formula: 'Math.ceil(预期数据量 / 单分片最大容量)';
    example: 'Math.ceil(1TB / 100GB) = 10 个分片';
    recommendation: '建议初始设置 2^n 个分片，便于后续扩容';
  };

  // 单分片容量建议
  singleShardCapacity: {
    dataSize: '50-200 GB';
    rowCount: '1000 万 - 5000 万行';
    qps: '1000-5000';
  };

  // 扩容策略
  scalingStrategy: {
    trigger: '任一指标达到阈值的 70%';
    method: '倍增扩容（4 → 8 → 16）';
    预留: '始终保持 30% 以上的容量余量';
  };
}

class CapacityPlanner {
  calculateInitialShards(params: CapacityParams): number {
    const {
      expectedDataSizeGB,
      expectedRowCount,
      expectedQPS,
      growthRatePerYear,
      planningYears,
    } = params;

    // 计算未来数据量
    const futureDataSize = expectedDataSizeGB * Math.pow(1 + growthRatePerYear, planningYears);
    const futureRowCount = expectedRowCount * Math.pow(1 + growthRatePerYear, planningYears);
    const futureQPS = expectedQPS * Math.pow(1 + growthRatePerYear, planningYears);

    // 按各维度计算所需分片数
    const shardsByData = Math.ceil(futureDataSize / 100); // 100GB 每分片
    const shardsByRows = Math.ceil(futureRowCount / 30000000); // 3000 万行每分片
    const shardsByQPS = Math.ceil(futureQPS / 3000); // 3000 QPS 每分片

    // 取最大值
    const requiredShards = Math.max(shardsByData, shardsByRows, shardsByQPS);

    // 向上取整到 2 的幂
    return this.nextPowerOfTwo(requiredShards);
  }

  private nextPowerOfTwo(n: number): number {
    let power = 1;
    while (power < n) {
      power *= 2;
    }
    return power;
  }
}

interface CapacityParams {
  expectedDataSizeGB: number;
  expectedRowCount: number;
  expectedQPS: number;
  growthRatePerYear: number;
  planningYears: number;
}
```

### 监控和告警

```typescript
// 分片健康监控
class ShardingMonitor {
  // 监控指标
  private metrics = {
    // 数据分布
    dataDistribution: new Map<string, number>(),
    // 查询延迟
    queryLatency: new Map<string, number[]>(),
    // 连接池使用率
    connectionPoolUsage: new Map<string, number>(),
    // 错误率
    errorRate: new Map<string, number>(),
  };

  // 收集分片指标
  async collectMetrics(): Promise<ShardMetrics[]> {
    const shardMetrics: ShardMetrics[] = [];

    for (const shard of this.getShards()) {
      const metrics: ShardMetrics = {
        shardId: shard.id,
        dataSize: await this.getDataSize(shard),
        rowCount: await this.getRowCount(shard),
        qps: await this.getQPS(shard),
        latencyP50: await this.getLatencyPercentile(shard, 50),
        latencyP99: await this.getLatencyPercentile(shard, 99),
        connectionUsage: await this.getConnectionUsage(shard),
        replicationLag: await this.getReplicationLag(shard),
        errorRate: await this.getErrorRate(shard),
      };

      shardMetrics.push(metrics);
    }

    return shardMetrics;
  }

  // 检测数据倾斜
  detectDataSkew(metrics: ShardMetrics[]): SkewAlert | null {
    const dataSizes = metrics.map(m => m.dataSize);
    const avg = dataSizes.reduce((a, b) => a + b) / dataSizes.length;
    const maxDeviation = Math.max(...dataSizes.map(s => Math.abs(s - avg) / avg));

    if (maxDeviation > 0.3) { // 30% 偏差阈值
      return {
        type: 'DATA_SKEW',
        severity: 'WARNING',
        message: `数据分布不均匀，最大偏差 ${(maxDeviation * 100).toFixed(1)}%`,
        affectedShards: metrics.filter(m => Math.abs(m.dataSize - avg) / avg > 0.3).map(m => m.shardId),
      };
    }

    return null;
  }

  // 检测热点分片
  detectHotSpot(metrics: ShardMetrics[]): SkewAlert | null {
    const qpsList = metrics.map(m => m.qps);
    const avg = qpsList.reduce((a, b) => a + b) / qpsList.length;
    const hotShards = metrics.filter(m => m.qps > avg * 2);

    if (hotShards.length > 0) {
      return {
        type: 'HOT_SPOT',
        severity: 'CRITICAL',
        message: `检测到热点分片，QPS 是平均值的 2 倍以上`,
        affectedShards: hotShards.map(m => m.shardId),
      };
    }

    return null;
  }

  // 生成健康报告
  async generateHealthReport(): Promise<HealthReport> {
    const metrics = await this.collectMetrics();

    return {
      timestamp: new Date(),
      overallHealth: this.calculateOverallHealth(metrics),
      shardCount: metrics.length,
      totalDataSize: metrics.reduce((sum, m) => sum + m.dataSize, 0),
      totalQPS: metrics.reduce((sum, m) => sum + m.qps, 0),
      alerts: [
        this.detectDataSkew(metrics),
        this.detectHotSpot(metrics),
        this.detectHighLatency(metrics),
        this.detectHighErrorRate(metrics),
      ].filter(Boolean) as SkewAlert[],
      shardDetails: metrics,
    };
  }

  private getShards(): any[] { return []; }
  private async getDataSize(shard: any): Promise<number> { return 0; }
  private async getRowCount(shard: any): Promise<number> { return 0; }
  private async getQPS(shard: any): Promise<number> { return 0; }
  private async getLatencyPercentile(shard: any, percentile: number): Promise<number> { return 0; }
  private async getConnectionUsage(shard: any): Promise<number> { return 0; }
  private async getReplicationLag(shard: any): Promise<number> { return 0; }
  private async getErrorRate(shard: any): Promise<number> { return 0; }
  private calculateOverallHealth(metrics: ShardMetrics[]): string { return 'HEALTHY'; }
  private detectHighLatency(metrics: ShardMetrics[]): SkewAlert | null { return null; }
  private detectHighErrorRate(metrics: ShardMetrics[]): SkewAlert | null { return null; }
}

interface ShardMetrics {
  shardId: string;
  dataSize: number;
  rowCount: number;
  qps: number;
  latencyP50: number;
  latencyP99: number;
  connectionUsage: number;
  replicationLag: number;
  errorRate: number;
}

interface SkewAlert {
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  affectedShards: string[];
}

interface HealthReport {
  timestamp: Date;
  overallHealth: string;
  shardCount: number;
  totalDataSize: number;
  totalQPS: number;
  alerts: SkewAlert[];
  shardDetails: ShardMetrics[];
}
```

## 常见问题和解决方案

### 全局唯一 ID 生成

```typescript
// 分布式 ID 生成方案
class DistributedIdGenerator {
  // 方案 1：Snowflake 算法
  private epoch = 1609459200000n; // 2021-01-01 00:00:00
  private workerId: bigint;
  private sequence = 0n;
  private lastTimestamp = -1n;

  constructor(workerId: number) {
    this.workerId = BigInt(workerId);
  }

  generateSnowflakeId(): bigint {
    let timestamp = BigInt(Date.now());

    if (timestamp < this.lastTimestamp) {
      throw new Error('Clock moved backwards');
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & 4095n; // 12位序列号
      if (this.sequence === 0n) {
        // 序列号用完，等待下一毫秒
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    // 41位时间戳 + 10位机器ID + 12位序列号
    return ((timestamp - this.epoch) << 22n) | (this.workerId << 12n) | this.sequence;
  }

  private waitNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = BigInt(Date.now());
    while (timestamp <= lastTimestamp) {
      timestamp = BigInt(Date.now());
    }
    return timestamp;
  }

  // 方案 2：号段模式
  private segmentStart = 0;
  private segmentEnd = 0;
  private segmentStep = 1000;

  async getSegmentId(): Promise<number> {
    if (this.segmentStart >= this.segmentEnd) {
      // 获取新号段
      await this.fetchNewSegment();
    }
    return this.segmentStart++;
  }

  private async fetchNewSegment(): Promise<void> {
    // 从数据库获取新号段
    const result = await this.db.query(
      `UPDATE id_generator
       SET current_max = current_max + ?
       WHERE biz_tag = 'order'
       RETURNING current_max`,
      [this.segmentStep]
    );

    this.segmentEnd = result.current_max;
    this.segmentStart = this.segmentEnd - this.segmentStep;
  }

  // 方案 3：UUID + 分片前缀
  generateShardedUUID(shardId: number): string {
    const uuid = this.generateUUID();
    // 在 UUID 中嵌入分片信息
    return `${shardId.toString(16).padStart(4, '0')}-${uuid.substring(5)}`;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private db: any;
}
```

### 跨分片关联查询优化

```typescript
// 跨分片 JOIN 优化策略
class CrossShardJoinOptimizer {
  // 策略 1：数据冗余
  async denormalizeData(): Promise<void> {
    // 在订单表中冗余用户信息
    // orders: { order_id, user_id, user_name, user_email, ... }
    // 避免跨分片 JOIN
  }

  // 策略 2：广播表
  async useBroadcastTable(tableName: string): Promise<void> {
    // 将小表复制到每个分片
    // 例如：配置表、字典表
    for (const shard of this.shards) {
      await this.syncBroadcastTable(shard, tableName);
    }
  }

  // 策略 3：应用层 JOIN
  async applicationJoin(orderIds: number[]): Promise<OrderWithUser[]> {
    // 步骤 1：获取订单数据
    const orders = await this.getOrdersByIds(orderIds);

    // 步骤 2：收集用户 ID
    const userIds = [...new Set(orders.map(o => o.userId))];

    // 步骤 3：批量获取用户数据
    const users = await this.getUsersByIds(userIds);
    const userMap = new Map(users.map(u => [u.id, u]));

    // 步骤 4：应用层合并
    return orders.map(order => ({
      ...order,
      user: userMap.get(order.userId)!,
    }));
  }

  // 策略 4：物化视图 / 预计算
  async createMaterializedView(): Promise<void> {
    // 定时任务预计算跨分片聚合数据
    await this.scheduler.schedule('0 * * * *', async () => {
      const results = await this.aggregateCrossShardData();
      await this.redis.set('order_user_summary', JSON.stringify(results));
    });
  }

  private shards: any[] = [];
  private async syncBroadcastTable(shard: any, tableName: string): Promise<void> {}
  private async getOrdersByIds(ids: number[]): Promise<any[]> { return []; }
  private async getUsersByIds(ids: number[]): Promise<any[]> { return []; }
  private scheduler: any;
  private redis: any;
  private async aggregateCrossShardData(): Promise<any> { return null; }
}

interface OrderWithUser {
  id: number;
  userId: number;
  amount: number;
  user: any;
}
```

### 分片迁移和灾备

```typescript
// 分片迁移和灾备策略
class ShardingDisasterRecovery {
  // 主从复制配置
  async configureReplication(masterShard: string, slaveShard: string): Promise<void> {
    // 1. 在从库配置复制
    await this.executeSql(slaveShard, `
      CHANGE MASTER TO
        MASTER_HOST='${this.getHost(masterShard)}',
        MASTER_USER='repl_user',
        MASTER_PASSWORD='repl_password',
        MASTER_AUTO_POSITION=1;
    `);

    // 2. 启动复制
    await this.executeSql(slaveShard, 'START SLAVE');

    // 3. 验证复制状态
    const status = await this.executeSql(slaveShard, 'SHOW SLAVE STATUS');
    if (status.Seconds_Behind_Master > 0) {
      console.log(`复制延迟: ${status.Seconds_Behind_Master} 秒`);
    }
  }

  // 故障转移
  async failover(failedShard: string): Promise<void> {
    const slaveShard = this.getSlave(failedShard);

    // 1. 提升从库为主库
    await this.executeSql(slaveShard, 'STOP SLAVE');
    await this.executeSql(slaveShard, 'RESET SLAVE ALL');

    // 2. 更新路由配置
    await this.updateRoutingConfig(failedShard, slaveShard);

    // 3. 通知应用层
    await this.notifyApplications(failedShard, slaveShard);

    // 4. 创建新的从库
    await this.provisionNewSlave(slaveShard);
  }

  // 在线数据迁移
  async onlineDataMigration(
    sourceShard: string,
    targetShard: string,
    tableConfig: TableMigrationConfig
  ): Promise<void> {
    const { tableName, shardKeyColumn, keyRange } = tableConfig;

    // 阶段 1：初始数据同步
    console.log('开始初始数据同步...');
    await this.initialSync(sourceShard, targetShard, tableName, keyRange);

    // 阶段 2：开启双写
    console.log('开启双写模式...');
    await this.enableDualWrite(tableName, sourceShard, targetShard, keyRange);

    // 阶段 3：增量同步（binlog 消费）
    console.log('开始增量同步...');
    await this.incrementalSync(sourceShard, targetShard, tableName);

    // 阶段 4：数据校验
    console.log('执行数据校验...');
    const isValid = await this.validateData(sourceShard, targetShard, tableName, keyRange);
    if (!isValid) {
      throw new Error('数据校验失败');
    }

    // 阶段 5：切换读流量
    console.log('切换读流量到新分片...');
    await this.switchRead(targetShard, tableName, keyRange);

    // 阶段 6：切换写流量
    console.log('切换写流量到新分片...');
    await this.switchWrite(targetShard, tableName, keyRange);

    // 阶段 7：关闭双写，清理源数据
    console.log('清理迁移状态...');
    await this.disableDualWrite(tableName, sourceShard, keyRange);
    await this.cleanupSourceData(sourceShard, tableName, keyRange);

    console.log('迁移完成!');
  }

  private async executeSql(shard: string, sql: string): Promise<any> { return null; }
  private getHost(shard: string): string { return ''; }
  private getSlave(shard: string): string { return ''; }
  private async updateRoutingConfig(from: string, to: string): Promise<void> {}
  private async notifyApplications(from: string, to: string): Promise<void> {}
  private async provisionNewSlave(master: string): Promise<void> {}
  private async initialSync(source: string, target: string, table: string, range: any): Promise<void> {}
  private async enableDualWrite(table: string, source: string, target: string, range: any): Promise<void> {}
  private async incrementalSync(source: string, target: string, table: string): Promise<void> {}
  private async validateData(source: string, target: string, table: string, range: any): Promise<boolean> { return true; }
  private async switchRead(target: string, table: string, range: any): Promise<void> {}
  private async switchWrite(target: string, table: string, range: any): Promise<void> {}
  private async disableDualWrite(table: string, source: string, range: any): Promise<void> {}
  private async cleanupSourceData(source: string, table: string, range: any): Promise<void> {}
}

interface TableMigrationConfig {
  tableName: string;
  shardKeyColumn: string;
  keyRange: { start: any; end: any };
}
```

## 总结

数据库分片是应对海量数据和高并发访问的有效解决方案，但它也引入了额外的复杂性。在实施分片之前，需要充分评估业务需求和技术成本。

```
分片实施路径：
┌─────────────────────────────────────────────────────────────┐
│                     分片决策流程                             │
├─────────────────────────────────────────────────────────────┤
│  1. 评估阶段                                                 │
│     ├── 确认是否真的需要分片                                 │
│     ├── 评估替代方案（读写分离、垂直拆分等）                  │
│     └── 计算预期收益和成本                                   │
├─────────────────────────────────────────────────────────────┤
│  2. 设计阶段                                                 │
│     ├── 选择分片策略（哈希/范围/目录）                       │
│     ├── 确定分片键                                          │
│     ├── 规划分片数量                                        │
│     └── 设计跨分片查询方案                                   │
├─────────────────────────────────────────────────────────────┤
│  3. 实施阶段                                                 │
│     ├── 选择分片中间件（Vitess/ShardingSphere/自研）         │
│     ├── 改造应用代码                                        │
│     ├── 数据迁移和验证                                      │
│     └── 灰度发布和监控                                       │
├─────────────────────────────────────────────────────────────┤
│  4. 运维阶段                                                 │
│     ├── 监控分片健康状态                                    │
│     ├── 处理数据倾斜和热点                                  │
│     ├── 定期容量评估和扩容                                   │
│     └── 灾备和故障恢复演练                                   │
└─────────────────────────────────────────────────────────────┘
```

**核心要点回顾：**

1. **分片策略选择**：哈希分片适合均匀分布，范围分片适合时序数据，目录分片适合灵活路由
2. **分片键设计**：选择高基数、查询常用、不可变的字段作为分片键
3. **跨分片查询**：尽量避免，必要时使用并行查询、二级索引或预计算
4. **分布式事务**：优先使用 Saga 或 TCC 模式，2PC 作为备选
5. **再平衡策略**：使用一致性哈希减少数据迁移，支持在线迁移
6. **监控告警**：关注数据分布、查询延迟、热点分片等关键指标

分片是一个持续演进的过程，需要根据业务发展不断调整和优化。选择合适的工具和策略，建立完善的监控体系，才能确保分片系统的稳定运行。
