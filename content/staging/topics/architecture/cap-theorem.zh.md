---
title: CAP定理与分布式系统
description: 深入了解分布式系统设计中的CAP定理
track: architecture
section: distributed
difficulty: advanced
tags:
  - CAP
  - 分布式
  - 一致性
  - 可用性
status: imported
origin: old/src/content/docs/architecture/cap-theorem.zh.md
divergence: 0.214
issues: []
legacy:
  category: Architecture
  subcategory: Distributed
  order: 12
  lastUpdated: 2026-01-07
---

## 介绍

CAP定理，也称为Brewer定理，是分布式系统设计中最基础的原则之一。它由Eric Brewer在2000年的ACM分布式计算原理研讨会上首次提出，后来由MIT的Seth Gilbert和Nancy Lynch在2002年进行了形式化证明。对于构建跨越多个节点、数据中心或地理区域的系统的架构师和开发人员来说，理解CAP定理是必不可少的。

本文提供了对CAP定理、其含义、扩展性以及在现代分布式系统设计中的实际应用的全面探讨。

## CAP定理解析

### 三个保证

CAP定理指出，分布式数据存储只能同时提供以下三个保证中的两个：

```
┌─────────────────────────────────────────────────────────────┐
│                      CAP定理                                 │
│                                                              │
│                    一致性 (C)                                │
│                         ▲                                    │
│                        / \                                   │
│                       /   \                                  │
│                      /     \                                 │
│               CP    /       \    CA                          │
│            系统    /         \ 系统                           │
│                   /           \                              │
│                  /             \                             │
│                 /      AP       \                            │
│                /     系统        \                            │
│               ▼─────────────────►▼                           │
│      可用性 (A)        分区容错性 (P)                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**1. 一致性 (C)**

每次读操作都会获得最新的写入结果或返回错误。所有节点在同一时间看到相同的数据。这通常被称为"线性一致性"或"强一致性"。

**2. 可用性 (A)**

每个请求都会收到（非错误）响应，不保证该响应包含最新的写入数据。系统保持运行状态且响应灵敏。

**3. 分区容错性 (P)**

系统在发生任意消息丢失或部分系统故障时继续运行。网络分区在分布式系统中是不可避免的。

### 为什么只能选择两个

在分布式系统中，网络分区是不可避免的。当分区发生时，系统必须做出选择：

```typescript
// 场景：节点A和节点B之间发生网络分区

// 选项1：选择一致性（CP系统）
class CPSystem {
  async write(key: string, value: string): Promise<void> {
    try {
      // 尝试复制到所有节点
      await Promise.all([
        this.nodeA.write(key, value),
        this.nodeB.write(key, value)
      ]);
    } catch (error) {
      // 如果任何节点无法访问，拒绝写入
      throw new Error('写入失败：无法保证一致性');
    }
  }

  async read(key: string): Promise<string> {
    // 需要法定人数读取以确保一致性
    const results = await Promise.all([
      this.nodeA.read(key).catch(() => null),
      this.nodeB.read(key).catch(() => null)
    ]);

    const validResults = results.filter(r => r !== null);
    if (validResults.length < this.quorum) {
      throw new Error('读取失败：无法保证一致性');
    }
    return validResults[0];
  }
}

// 选项2：选择可用性（AP系统）
class APSystem {
  async write(key: string, value: string): Promise<void> {
    // 立即写入本地节点
    await this.localNode.write(key, value);

    // 异步复制（尽力而为）
    this.replicateAsync(key, value).catch(err => {
      console.log('复制待处理，稍后重试');
      this.pendingReplications.push({ key, value });
    });
  }

  async read(key: string): Promise<string> {
    // 总是返回本地数据（可能已过期）
    return this.localNode.read(key);
  }
}
```

### 常见误解

**误解1：你必须始终放弃一个属性**

实际上，你只需要在网络分区期间做出这种权衡。当网络正常时，设计良好的系统可以提供所有三个属性。

**误解2：在实践中存在CA系统**

有时人们将PostgreSQL等传统单节点数据库称为"CA系统"，但这具有误导性。单节点系统不会面临CAP定理所涉及的分布式系统挑战。在真正的分布式系统中，分区容错性是必须的，因为分区肯定会发生。

**误解3：CAP中的一致性等于ACID一致性**

CAP一致性（线性一致性）不同于ACID一致性。ACID一致性涉及数据完整性约束，而CAP一致性涉及所有节点对数据有相同的看法。

## 一致性模型

理解一致性模型对于设计分布式系统至关重要。不同的应用有不同的要求。

### 强一致性（线性一致性）

最严格的模型，其中操作看起来在调用和响应之间的某个点以原子方式执行。

```typescript
// 使用两阶段提交实现强一致性
class StrongConsistencyStore {
  private nodes: Node[];
  private coordinator: Coordinator;

  async write(key: string, value: string): Promise<boolean> {
    // 第1阶段：准备
    const preparePromises = this.nodes.map(node =>
      node.prepare(key, value)
    );

    const prepareResults = await Promise.all(preparePromises);
    const allPrepared = prepareResults.every(result => result.ready);

    if (!allPrepared) {
      // 中止事务
      await Promise.all(this.nodes.map(node => node.abort(key)));
      return false;
    }

    // 第2阶段：提交
    await Promise.all(this.nodes.map(node => node.commit(key)));
    return true;
  }

  async read(key: string): Promise<string> {
    // 从多数派读取以确保我们获得最新提交的值
    const quorum = Math.floor(this.nodes.length / 2) + 1;
    const results = await Promise.all(
      this.nodes.map(node => node.read(key).catch(() => null))
    );

    const validResults = results.filter(r => r !== null);
    if (validResults.length < quorum) {
      throw new Error('无法达成法定人数');
    }

    // 返回版本最高的值
    return this.getLatestValue(validResults);
  }
}
```

### 顺序一致性

所有操作以某种顺序出现，每个进程的操作以程序顺序出现。

```typescript
// 顺序一致性 - 操作按顺序出现，但不是实时
class SequentialConsistencyStore {
  private operationLog: Operation[] = [];
  private localCache: Map<string, VersionedValue> = new Map();

  async write(key: string, value: string): Promise<void> {
    const operation: Operation = {
      type: 'write',
      key,
      value,
      timestamp: this.getLogicalClock(),
      processId: this.processId
    };

    // 附加到日志并传播
    this.operationLog.push(operation);
    await this.propagateOperation(operation);

    // 本地应用
    this.localCache.set(key, { value, version: operation.timestamp });
  }

  async read(key: string): Promise<string | null> {
    // 等待所有已知操作被应用
    await this.applyPendingOperations();

    const value = this.localCache.get(key);
    return value?.value ?? null;
  }

  private async applyPendingOperations(): Promise<void> {
    // 按逻辑时间戳排序并按顺序应用
    const sortedOps = [...this.pendingOperations].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    for (const op of sortedOps) {
      if (op.type === 'write') {
        this.localCache.set(op.key, {
          value: op.value,
          version: op.timestamp
        });
      }
    }
  }
}
```

### 最终一致性

如果不进行新的更新，所有副本最终将收敛到相同的值。

```typescript
// 具有冲突解决的最终一致性
class EventualConsistencyStore {
  private replicas: Replica[];
  private antiEntropy: AntiEntropyProtocol;

  async write(key: string, value: string): Promise<void> {
    const entry: VersionedEntry = {
      key,
      value,
      vectorClock: this.incrementVectorClock(),
      nodeId: this.nodeId,
      timestamp: Date.now()
    };

    // 本地写入
    await this.localStorage.put(entry);

    // 异步传播到对等节点
    this.gossipProtocol.propagate(entry);
  }

  async read(key: string): Promise<string | null> {
    // 立即返回本地值
    const entry = await this.localStorage.get(key);
    return entry?.value ?? null;
  }

  // 使用Last-Write-Wins (LWW)进行冲突解决
  resolveConflict(entries: VersionedEntry[]): VersionedEntry {
    return entries.reduce((latest, current) => {
      if (current.timestamp > latest.timestamp) {
        return current;
      }
      if (current.timestamp === latest.timestamp) {
        // 平局打破器：使用节点ID
        return current.nodeId > latest.nodeId ? current : latest;
      }
      return latest;
    });
  }

  // 替代方案：使用CRDTs进行合并
  mergeCRDT(local: GCounter, remote: GCounter): GCounter {
    const merged = new GCounter(this.nodeId);
    for (const [nodeId, count] of local.entries()) {
      merged.set(nodeId, Math.max(count, remote.get(nodeId) || 0));
    }
    for (const [nodeId, count] of remote.entries()) {
      if (!merged.has(nodeId)) {
        merged.set(nodeId, count);
      }
    }
    return merged;
  }
}
```

### 因果一致性

在因果关系上相关的操作由所有节点以相同的顺序看到。

```typescript
// 使用向量时钟的因果一致性
interface VectorClock {
  [nodeId: string]: number;
}

class CausalConsistencyStore {
  private vectorClock: VectorClock = {};
  private pendingWrites: Map<string, CausalEntry[]> = new Map();

  incrementClock(): VectorClock {
    this.vectorClock[this.nodeId] = (this.vectorClock[this.nodeId] || 0) + 1;
    return { ...this.vectorClock };
  }

  mergeClock(remote: VectorClock): void {
    for (const [nodeId, timestamp] of Object.entries(remote)) {
      this.vectorClock[nodeId] = Math.max(
        this.vectorClock[nodeId] || 0,
        timestamp
      );
    }
  }

  happensBefore(vc1: VectorClock, vc2: VectorClock): boolean {
    let atLeastOneLess = false;

    for (const nodeId of new Set([...Object.keys(vc1), ...Object.keys(vc2)])) {
      const t1 = vc1[nodeId] || 0;
      const t2 = vc2[nodeId] || 0;

      if (t1 > t2) return false;
      if (t1 < t2) atLeastOneLess = true;
    }

    return atLeastOneLess;
  }

  async write(key: string, value: string, dependencies: VectorClock): Promise<void> {
    const entry: CausalEntry = {
      key,
      value,
      vectorClock: this.incrementClock(),
      dependencies
    };

    await this.localStorage.put(entry);
    this.broadcast(entry);
  }

  async applyRemoteWrite(entry: CausalEntry): Promise<void> {
    // 检查是否满足所有依赖关系
    if (this.dependenciesSatisfied(entry.dependencies)) {
      await this.localStorage.put(entry);
      this.mergeClock(entry.vectorClock);
    } else {
      // 缓冲直到依赖关系到达
      this.addToPending(entry);
    }
  }
}
```

## 可用性和分区容错性

### 定义可用性

在CAP术语中，可用性意味着对非故障节点的每个请求都必须产生响应。这是一个强定义 - 即使响应缓慢，在实际意义上也可能被视为"不可用"。

```typescript
// 可用性导向的系统设计
class HighAvailabilityService {
  private primaryNode: Node;
  private replicaNodes: Node[];
  private healthChecker: HealthChecker;

  constructor(config: HAConfig) {
    this.primaryNode = config.primary;
    this.replicaNodes = config.replicas;
    this.healthChecker = new HealthChecker(config.healthCheckInterval);

    // 开始监控
    this.healthChecker.start(this.getAllNodes());
  }

  async read(key: string): Promise<Response> {
    const healthyNodes = this.healthChecker.getHealthyNodes();

    if (healthyNodes.length === 0) {
      throw new ServiceUnavailableError('没有可用的健康节点');
    }

    // 从任何健康节点读取
    const selectedNode = this.selectNode(healthyNodes, 'read');

    try {
      const result = await this.withTimeout(
        selectedNode.read(key),
        this.config.readTimeout
      );
      return { success: true, data: result };
    } catch (error) {
      // 故障转移到下一个健康节点
      return this.readWithFailover(key, healthyNodes, selectedNode);
    }
  }

  private async readWithFailover(
    key: string,
    nodes: Node[],
    failedNode: Node
  ): Promise<Response> {
    const remainingNodes = nodes.filter(n => n !== failedNode);

    for (const node of remainingNodes) {
      try {
        const result = await this.withTimeout(
          node.read(key),
          this.config.readTimeout
        );
        return { success: true, data: result };
      } catch (error) {
        this.healthChecker.markUnhealthy(node);
        continue;
      }
    }

    throw new ServiceUnavailableError('所有节点都失败了');
  }

  // 可用性断路器
  private circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 30000,
    halfOpenRequests: 3
  });

  async executeWithCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    if (this.circuitBreaker.isOpen()) {
      throw new Error('断路器已打开');
    }

    try {
      const result = await operation();
      this.circuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      this.circuitBreaker.recordFailure();
      throw error;
    }
  }
}
```

### 理解分区容错性

网络分区不只是理论概念 - 它们在生产系统中定期发生。分区容错系统在网络故障时继续运行。

```typescript
// 分区检测和处理
class PartitionAwareSystem {
  private nodes: Map<string, NodeConnection> = new Map();
  private partitionDetector: PartitionDetector;

  constructor() {
    this.partitionDetector = new PartitionDetector({
      heartbeatInterval: 1000,
      failureThreshold: 3,
      suspicionThreshold: 2
    });
  }

  async detectPartition(): Promise<PartitionState> {
    const reachability: Map<string, boolean> = new Map();

    for (const [nodeId, connection] of this.nodes) {
      try {
        await this.withTimeout(connection.ping(), 1000);
        reachability.set(nodeId, true);
      } catch {
        reachability.set(nodeId, false);
      }
    }

    const reachableNodes = [...reachability.entries()]
      .filter(([, reachable]) => reachable)
      .map(([nodeId]) => nodeId);

    const unreachableNodes = [...reachability.entries()]
      .filter(([, reachable]) => !reachable)
      .map(([nodeId]) => nodeId);

    if (unreachableNodes.length > 0) {
      return {
        partitioned: true,
        reachableNodes,
        unreachableNodes,
        inMajorityPartition: reachableNodes.length > this.nodes.size / 2
      };
    }

    return { partitioned: false, reachableNodes, unreachableNodes: [] };
  }

  async handlePartition(state: PartitionState): Promise<void> {
    if (!state.partitioned) return;

    if (state.inMajorityPartition) {
      // 继续运行，但冗余性降低
      console.log('在多数派分区中运行');
      this.degradeGracefully(state.unreachableNodes);
    } else {
      // 少数派分区 - 变为只读以防止分裂
      console.log('在少数派分区中 - 切换到只读模式');
      this.setReadOnlyMode(true);
    }
  }

  private degradeGracefully(unavailableNodes: string[]): void {
    // 降低法定人数要求
    this.config.writeQuorum = Math.floor(this.nodes.size / 2);
    this.config.readQuorum = 1;

    // 在负载均衡器中标记节点为不可用
    for (const nodeId of unavailableNodes) {
      this.loadBalancer.markUnavailable(nodeId);
    }
  }
}
```

## PACELC扩展

PACELC定理由Daniel Abadi在2010年提出，扩展了CAP来解决没有分区时的系统行为。

### PACELC解析

```
┌───────────────────────────────────────────────────────────────┐
│                        PACELC                                  │
│                                                                │
│   如果有分区：              否则（正常运行）：                  │
│   ┌─────────────────┐          ┌─────────────────────────┐    │
│   │  选择：          │          │  选择：                  │    │
│   │  - 可用性        │          │  - 延迟                  │    │
│   │    或            │          │    或                   │    │
│   │  - 一致性        │          │  - 一致性                │    │
│   └─────────────────┘          └─────────────────────────┘    │
│                                                                │
│   示例：                                                        │
│   PA/EL: DynamoDB, Cassandra (倾向于可用性/延迟)              │
│   PA/EC: MongoDB (分区期间的可用性，否则一致性)                │
│   PC/EC: 传统RDBMS, Spanner (总是一致性)                      │
│   PC/EL: PNUTS (分区期间一致性，否则延迟)                      │
└───────────────────────────────────────────────────────────────┘
```

### 实际PACELC实现

```typescript
// PA/EL系统 - 优先考虑可用性和低延迟
class PAELSystem {
  private replicas: Replica[];

  async write(key: string, value: string): Promise<WriteResult> {
    // 立即写入本地副本（低延迟）
    const localResult = await this.localReplica.write(key, value);

    // 异步复制（最终一致性）
    setImmediate(() => {
      this.replicateAsync(key, value).catch(err => {
        this.retryQueue.add({ key, value, error: err });
      });
    });

    return { success: true, writtenTo: 1, total: this.replicas.length };
  }

  async read(key: string): Promise<string> {
    // 从本地副本读取（最低延迟）
    return this.localReplica.read(key);
  }
}

// PC/EC系统 - 始终优先考虑一致性
class PCECSystem {
  private replicas: Replica[];
  private quorum: number;

  constructor(replicas: Replica[]) {
    this.replicas = replicas;
    this.quorum = Math.floor(replicas.length / 2) + 1;
  }

  async write(key: string, value: string): Promise<WriteResult> {
    const version = this.generateVersion();
    const writePromises = this.replicas.map(replica =>
      this.writeToReplicaWithTimeout(replica, key, value, version)
    );

    const results = await Promise.allSettled(writePromises);
    const successes = results.filter(r => r.status === 'fulfilled').length;

    if (successes < this.quorum) {
      // 回滚成功的写入
      await this.rollback(key, version);
      throw new ConsistencyError('未能达到写入法定人数');
    }

    return { success: true, writtenTo: successes, total: this.replicas.length };
  }

  async read(key: string): Promise<string> {
    // 从副本的法定人数读取
    const readPromises = this.replicas.map(replica =>
      this.readFromReplicaWithTimeout(replica, key)
    );

    const results = await Promise.allSettled(readPromises);
    const successfulReads = results
      .filter((r): r is PromiseFulfilledResult<VersionedValue> =>
        r.status === 'fulfilled'
      )
      .map(r => r.value);

    if (successfulReads.length < this.quorum) {
      throw new ConsistencyError('未能达到读取法定人数');
    }

    // 返回版本最高的值
    return this.resolveLatestValue(successfulReads);
  }
}
```

## 常见系统选择

不同的数据库和分布式系统根据其用例做出不同的CAP权衡。

### CP系统（一致性+分区容错性）

**示例**：HBase、MongoDB（带写关注多数派）、Zookeeper、etcd、Consul

```typescript
// 示例：实现类似Zookeeper的CP行为
class CPCoordinationService {
  private nodes: Node[];
  private leader: Node | null = null;

  async electLeader(): Promise<Node> {
    // 使用Zab或Raft进行领导者选举
    const election = new LeaderElection(this.nodes);
    this.leader = await election.runElection();
    return this.leader;
  }

  async write(key: string, value: string): Promise<boolean> {
    if (!this.leader) {
      throw new Error('没有可用的领导者');
    }

    // 所有写入通过领导者
    if (this.nodeId !== this.leader.id) {
      return this.forwardToLeader(key, value);
    }

    // 领导者在确认前复制到多数派
    const followers = this.nodes.filter(n => n.id !== this.leader!.id);
    const requiredAcks = Math.floor(followers.length / 2) + 1;

    const acks = await this.replicateToFollowers(key, value, followers);

    if (acks >= requiredAcks) {
      await this.commit(key, value);
      return true;
    }

    throw new Error('未能达成共识');
  }

  async read(key: string): Promise<string> {
    // 一致性读取 - 必须通过领导者
    if (this.leader && this.nodeId === this.leader.id) {
      return this.localStorage.get(key);
    }

    // 转发到领导者进行一致性读取
    return this.leader!.read(key);
  }
}
```

### AP系统（可用性+分区容错性）

**示例**：Cassandra、DynamoDB、CouchDB、Riak

```typescript
// 示例：类似Cassandra的AP系统
class APDistributedStore {
  private ring: ConsistentHashRing;
  private replicationFactor: number = 3;

  async write(
    key: string,
    value: string,
    consistency: ConsistencyLevel = 'ONE'
  ): Promise<WriteResult> {
    const replicaNodes = this.ring.getReplicaNodes(key, this.replicationFactor);
    const requiredAcks = this.getRequiredAcks(consistency, replicaNodes.length);

    const writePromises = replicaNodes.map(node =>
      this.writeToNode(node, key, value).catch(err => ({
        success: false,
        error: err
      }))
    );

    // 等待所需的确认
    let acks = 0;
    for await (const result of this.racePromises(writePromises)) {
      if (result.success) {
        acks++;
        if (acks >= requiredAcks) {
          // 返回成功，剩余的写入继续在后台进行
          return { success: true, acks };
        }
      }
    }

    // 对于ONE一致性，我们只需要本地写入
    if (consistency === 'ONE') {
      return { success: true, acks: 1 };
    }

    throw new Error('未能达成' + consistency + '一致性');
  }

  // 用于最终一致性的读取修复
  async readWithRepair(key: string): Promise<string> {
    const replicaNodes = this.ring.getReplicaNodes(key, this.replicationFactor);
    const results = await Promise.all(
      replicaNodes.map(node =>
        node.read(key).catch(() => null)
      )
    );

    const validResults = results.filter(r => r !== null) as VersionedValue[];

    if (validResults.length === 0) {
      throw new Error('未找到键');
    }

    // 找到最新值
    const latest = this.findLatestValue(validResults);

    // 异步读取修复 - 更新过时的副本
    this.repairStaleReplicas(key, latest, validResults, replicaNodes);

    return latest.value;
  }
}
```

### 系统比较表

| 系统 | CAP选择 | PACELC | 用例 |
|--------|-----------|--------|----------|
| PostgreSQL | CA* | PC/EC | ACID事务，单节点 |
| MySQL Cluster | CP | PC/EC | 金融系统 |
| MongoDB | CP | PA/EC | 文档存储 |
| Cassandra | AP | PA/EL | 时间序列，高写入吞吐量 |
| DynamoDB | AP | PA/EL | 无服务器，键值 |
| Redis Cluster | CP | PC/EL | 缓存，会话 |
| CockroachDB | CP | PC/EC | 全局SQL |
| Spanner | CP | PC/EC | 全局事务 |
| etcd | CP | PC/EC | 配置，协调 |
| Riak | AP | PA/EL | 物联网，高可用性 |

*注：PostgreSQL作为单节点数据库，不会真正面临CAP权衡。

## 共识算法

共识算法是CP系统的骨干，使分布式节点能够对单个值达成一致。

### Raft算法

Raft的设计目标是比Paxos更易理解，同时提供相同的保证。

```typescript
// 简化的Raft实现
enum NodeState {
  FOLLOWER = 'follower',
  CANDIDATE = 'candidate',
  LEADER = 'leader'
}

interface LogEntry {
  term: number;
  index: number;
  command: string;
}

class RaftNode {
  private state: NodeState = NodeState.FOLLOWER;
  private currentTerm: number = 0;
  private votedFor: string | null = null;
  private log: LogEntry[] = [];
  private commitIndex: number = 0;
  private lastApplied: number = 0;

  // 领导者状态
  private nextIndex: Map<string, number> = new Map();
  private matchIndex: Map<string, number> = new Map();

  private electionTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(
    private nodeId: string,
    private peers: string[],
    private transport: RaftTransport
  ) {
    this.resetElectionTimeout();
  }

  private resetElectionTimeout(): void {
    if (this.electionTimeout) {
      clearTimeout(this.electionTimeout);
    }

    // 150-300毫秒的随机超时
    const timeout = 150 + Math.random() * 150;
    this.electionTimeout = setTimeout(() => {
      this.startElection();
    }, timeout);
  }

  private async startElection(): Promise<void> {
    this.state = NodeState.CANDIDATE;
    this.currentTerm++;
    this.votedFor = this.nodeId;

    let votesReceived = 1; // 投票给自己
    const votesNeeded = Math.floor(this.peers.length / 2) + 1;

    const voteRequests = this.peers.map(async (peerId) => {
      const response = await this.transport.requestVote(peerId, {
        term: this.currentTerm,
        candidateId: this.nodeId,
        lastLogIndex: this.log.length - 1,
        lastLogTerm: this.log.length > 0 ? this.log[this.log.length - 1].term : 0
      });

      return response;
    });

    for await (const response of this.racePromises(voteRequests)) {
      if (response.term > this.currentTerm) {
        this.stepDown(response.term);
        return;
      }

      if (response.voteGranted) {
        votesReceived++;
        if (votesReceived >= votesNeeded) {
          this.becomeLeader();
          return;
        }
      }
    }

    // 选举失败，重置超时并重试
    this.resetElectionTimeout();
  }

  private becomeLeader(): void {
    this.state = NodeState.LEADER;

    // 初始化领导者状态
    for (const peerId of this.peers) {
      this.nextIndex.set(peerId, this.log.length);
      this.matchIndex.set(peerId, 0);
    }

    // 开始发送心跳
    this.startHeartbeats();
  }

  private startHeartbeats(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeats();
    }, 50); // 每50毫秒发送一次心跳
  }

  private async sendHeartbeats(): Promise<void> {
    for (const peerId of this.peers) {
      const nextIdx = this.nextIndex.get(peerId) || this.log.length;
      const prevLogIndex = nextIdx - 1;
      const prevLogTerm = prevLogIndex >= 0 ? this.log[prevLogIndex]?.term || 0 : 0;

      const entries = this.log.slice(nextIdx);

      this.transport.appendEntries(peerId, {
        term: this.currentTerm,
        leaderId: this.nodeId,
        prevLogIndex,
        prevLogTerm,
        entries,
        leaderCommit: this.commitIndex
      }).then(response => {
        if (response.success) {
          this.nextIndex.set(peerId, nextIdx + entries.length);
          this.matchIndex.set(peerId, nextIdx + entries.length - 1);
          this.updateCommitIndex();
        } else if (response.term > this.currentTerm) {
          this.stepDown(response.term);
        } else {
          // 递减nextIndex并重试
          this.nextIndex.set(peerId, Math.max(0, nextIdx - 1));
        }
      });
    }
  }

  async appendEntry(command: string): Promise<boolean> {
    if (this.state !== NodeState.LEADER) {
      throw new Error('不是领导者');
    }

    const entry: LogEntry = {
      term: this.currentTerm,
      index: this.log.length,
      command
    };

    this.log.push(entry);

    // 复制到追随者
    await this.sendHeartbeats();

    // 等待多数派
    return new Promise((resolve) => {
      const checkCommit = setInterval(() => {
        if (this.commitIndex >= entry.index) {
          clearInterval(checkCommit);
          resolve(true);
        }
      }, 10);
    });
  }

  private stepDown(term: number): void {
    this.state = NodeState.FOLLOWER;
    this.currentTerm = term;
    this.votedFor = null;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.resetElectionTimeout();
  }
}
```

### Paxos概述

Paxos是基础共识算法，虽然比Raft更复杂。

```typescript
// 简化的Multi-Paxos
class PaxosNode {
  private proposalNumber: number = 0;
  private acceptedProposalNumber: number = 0;
  private acceptedValue: string | null = null;
  private promised: number = 0;

  // 提议者第1a阶段：准备
  async prepare(value: string): Promise<boolean> {
    this.proposalNumber++;
    const n = this.proposalNumber;

    const promises = await Promise.all(
      this.acceptors.map(a => a.receivePrepare(n))
    );

    const majority = Math.floor(this.acceptors.length / 2) + 1;
    const promisesReceived = promises.filter(p => p.promised).length;

    if (promisesReceived >= majority) {
      // 检查任何接受者是否已接受值
      const acceptedValues = promises
        .filter(p => p.acceptedValue !== null)
        .sort((a, b) => b.acceptedProposalNumber! - a.acceptedProposalNumber!);

      const valueToPropose = acceptedValues.length > 0
        ? acceptedValues[0].acceptedValue
        : value;

      return this.accept(n, valueToPropose!);
    }

    return false;
  }

  // 接受者：接收准备（第1b阶段）
  receivePrepare(n: number): PrepareResponse {
    if (n > this.promised) {
      this.promised = n;
      return {
        promised: true,
        acceptedProposalNumber: this.acceptedProposalNumber,
        acceptedValue: this.acceptedValue
      };
    }
    return { promised: false };
  }

  // 提议者第2a阶段：接受
  async accept(n: number, value: string): Promise<boolean> {
    const accepts = await Promise.all(
      this.acceptors.map(a => a.receiveAccept(n, value))
    );

    const majority = Math.floor(this.acceptors.length / 2) + 1;
    const acceptsReceived = accepts.filter(a => a).length;

    if (acceptsReceived >= majority) {
      // 值已被选中
      await this.learn(value);
      return true;
    }

    return false;
  }

  // 接受者：接收接受（第2b阶段）
  receiveAccept(n: number, value: string): boolean {
    if (n >= this.promised) {
      this.promised = n;
      this.acceptedProposalNumber = n;
      this.acceptedValue = value;
      return true;
    }
    return false;
  }
}
```

## 分布式锁

分布式锁对于协调多个节点之间对共享资源的访问至关重要。

### Redlock算法

Redis的Redlock提供了强大的分布式锁定机制。

```typescript
// Redlock实现
class Redlock {
  private redisNodes: Redis[];
  private quorum: number;
  private clockDriftFactor: number = 0.01;

  constructor(redisNodes: Redis[]) {
    this.redisNodes = redisNodes;
    this.quorum = Math.floor(redisNodes.length / 2) + 1;
  }

  async lock(
    resource: string,
    ttl: number
  ): Promise<Lock | null> {
    const value = this.generateUniqueValue();
    const startTime = Date.now();

    let acquiredLocks = 0;
    const acquiredNodes: Redis[] = [];

    for (const node of this.redisNodes) {
      try {
        const acquired = await this.acquireLockOnNode(
          node, resource, value, ttl
        );
        if (acquired) {
          acquiredLocks++;
          acquiredNodes.push(node);
        }
      } catch (error) {
        // 节点不可用，继续
      }
    }

    const elapsedTime = Date.now() - startTime;
    const drift = Math.floor(ttl * this.clockDriftFactor) + 2;
    const validityTime = ttl - elapsedTime - drift;

    if (acquiredLocks >= this.quorum && validityTime > 0) {
      return {
        resource,
        value,
        validityTime,
        acquiredNodes
      };
    }

    // 未能获取锁，释放任何已获取的锁
    await this.releaseLockOnNodes(acquiredNodes, resource, value);
    return null;
  }

  private async acquireLockOnNode(
    node: Redis,
    resource: string,
    value: string,
    ttl: number
  ): Promise<boolean> {
    const result = await node.set(
      resource,
      value,
      'PX', ttl,
      'NX'
    );
    return result === 'OK';
  }

  async unlock(lock: Lock): Promise<void> {
    // 使用Lua脚本确保原子性检查和删除
    const unlockScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    await Promise.all(
      lock.acquiredNodes.map(node =>
        node.runScript(unlockScript, [lock.resource], [lock.value])
      )
    );
  }

  async extend(lock: Lock, ttl: number): Promise<Lock | null> {
    const extendScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("pexpire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;

    let extended = 0;
    for (const node of lock.acquiredNodes) {
      try {
        const result = await node.runScript(
          extendScript, [lock.resource], [lock.value, ttl.toString()]
        );
        if (result === 1) extended++;
      } catch (error) {
        // 节点不可用
      }
    }

    if (extended >= this.quorum) {
      return { ...lock, validityTime: ttl };
    }

    return null;
  }
}

// 使用示例
async function processWithLock(resource: string): Promise<void> {
  const redlock = new Redlock(redisNodes);
  const lock = await redlock.lock('locks:' + resource, 10000);

  if (!lock) {
    throw new Error('无法获取锁');
  }

  try {
    // 临界区
    await performCriticalOperation(resource);
  } finally {
    await redlock.unlock(lock);
  }
}
```

### ZooKeeper分布式锁

```typescript
// ZooKeeper分布式锁
class ZooKeeperLock {
  private zk: ZooKeeper;
  private lockPath: string;
  private myNode: string | null = null;

  constructor(zk: ZooKeeper, lockPath: string) {
    this.zk = zk;
    this.lockPath = lockPath;
  }

  async lock(): Promise<void> {
    // 创建有序临时节点
    this.myNode = await this.zk.create(
      this.lockPath + '/lock-',
      '',
      { sequential: true, ephemeral: true }
    );

    while (true) {
      // 获取所有子节点并排序
      const children = await this.zk.getChildren(this.lockPath);
      const sortedChildren = children.sort();

      const mySequence = this.myNode.split('-').pop();
      const myIndex = sortedChildren.findIndex(
        child => child.endsWith(mySequence!)
      );

      if (myIndex === 0) {
        // 我持有锁
        return;
      }

      // 监视我前面的节点
      const nodeToWatch = sortedChildren[myIndex - 1];
      await this.watchNode(this.lockPath + '/' + nodeToWatch);
    }
  }

  private async watchNode(path: string): Promise<void> {
    return new Promise((resolve) => {
      this.zk.exists(path, (event) => {
        if (event.type === 'deleted') {
          resolve();
        }
      });
    });
  }

  async unlock(): Promise<void> {
    if (this.myNode) {
      await this.zk.delete(this.myNode);
      this.myNode = null;
    }
  }
}
```

## 分布式ID生成

在分布式系统中生成唯一标识符是一个常见的挑战，有多种解决方案。

### Snowflake ID生成器

Twitter的Snowflake使用时间戳、机器ID和序列号生成唯一ID。

```typescript
// Snowflake ID生成器
class SnowflakeIdGenerator {
  // 位分配（总共64位）：
  // 1位：符号位（始终为0）
  // 41位：时间戳（自纪元以来的毫秒数）
  // 10位：机器ID（数据中心+工作者）
  // 12位：序列号

  private readonly EPOCH = 1609459200000n; // 2021-01-01
  private readonly MACHINE_ID_BITS = 10n;
  private readonly SEQUENCE_BITS = 12n;

  private readonly MAX_MACHINE_ID = (1n << this.MACHINE_ID_BITS) - 1n;
  private readonly MAX_SEQUENCE = (1n << this.SEQUENCE_BITS) - 1n;

  private readonly MACHINE_ID_SHIFT = this.SEQUENCE_BITS;
  private readonly TIMESTAMP_SHIFT = this.SEQUENCE_BITS + this.MACHINE_ID_BITS;

  private machineId: bigint;
  private sequence: bigint = 0n;
  private lastTimestamp: bigint = -1n;

  constructor(machineId: number) {
    if (BigInt(machineId) > this.MAX_MACHINE_ID) {
      throw new Error('机器ID必须<='+this.MAX_MACHINE_ID);
    }
    this.machineId = BigInt(machineId);
  }

  nextId(): bigint {
    let timestamp = this.currentTimestamp();

    if (timestamp < this.lastTimestamp) {
      throw new Error('时钟向后移动');
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & this.MAX_SEQUENCE;
      if (this.sequence === 0n) {
        // 序列已耗尽，等待下一毫秒
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0n;
    }

    this.lastTimestamp = timestamp;

    return (
      ((timestamp - this.EPOCH) << this.TIMESTAMP_SHIFT) |
      (this.machineId << this.MACHINE_ID_SHIFT) |
      this.sequence
    );
  }

  private currentTimestamp(): bigint {
    return BigInt(Date.now());
  }

  private waitNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = this.currentTimestamp();
    while (timestamp <= lastTimestamp) {
      timestamp = this.currentTimestamp();
    }
    return timestamp;
  }

  // 将Snowflake ID解析回组件
  parseId(id: bigint): SnowflakeComponents {
    const sequence = id & this.MAX_SEQUENCE;
    const machineId = (id >> this.MACHINE_ID_SHIFT) & this.MAX_MACHINE_ID;
    const timestamp = (id >> this.TIMESTAMP_SHIFT) + this.EPOCH;

    return {
      timestamp: new Date(Number(timestamp)),
      machineId: Number(machineId),
      sequence: Number(sequence)
    };
  }
}

// 使用示例
const generator = new SnowflakeIdGenerator(1);
const id = generator.nextId();
console.log(id.toString()); // 例如："1234567890123456789"
```

### UUID变体

```typescript
// UUID生成实用工具
class UUIDGenerator {
  // UUID v1：基于时间戳
  static v1(): string {
    const timestamp = Date.now();
    const clockSeq = Math.floor(Math.random() * 16384);
    const node = this.getNodeId();

    // 基于时间的UUID结构
    const timeLow = (timestamp & 0xffffffff).toString(16).padStart(8, '0');
    const timeMid = ((timestamp >> 32) & 0xffff).toString(16).padStart(4, '0');
    const timeHiAndVersion = (((timestamp >> 48) & 0x0fff) | 0x1000)
      .toString(16).padStart(4, '0');
    const clockSeqHiAndReserved = ((clockSeq >> 8) | 0x80)
      .toString(16).padStart(2, '0');
    const clockSeqLow = (clockSeq & 0xff).toString(16).padStart(2, '0');

    return timeLow + '-' + timeMid + '-' + timeHiAndVersion + '-' +
           clockSeqHiAndReserved + clockSeqLow + '-' + node;
  }

  // UUID v4：随机
  static v4(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // 设置版本（4）和变体（RFC 4122）
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' +
           hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
  }

  // UUID v7：Unix时间戳+随机（对数据库更好）
  static v7(): string {
    const timestamp = Date.now();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // 前48位：Unix时间戳（毫秒）
    bytes[0] = (timestamp >> 40) & 0xff;
    bytes[1] = (timestamp >> 32) & 0xff;
    bytes[2] = (timestamp >> 24) & 0xff;
    bytes[3] = (timestamp >> 16) & 0xff;
    bytes[4] = (timestamp >> 8) & 0xff;
    bytes[5] = timestamp & 0xff;

    // 设置版本（7）和变体
    bytes[6] = (bytes[6] & 0x0f) | 0x70;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' +
           hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
  }

  private static getNodeId(): string {
    // 在实践中，使用MAC地址或随机值
    return Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// 比较：何时使用每一种
const idStrategies = {
  snowflake: {
    pros: ['按时间可排序', '紧凑（64位）', '无需协调'],
    cons: ['机器ID管理', '需要时钟同步'],
    useCase: '高吞吐量系统，时间有序数据'
  },
  uuidV4: {
    pros: ['无需协调', '实现简单'],
    cons: ['不可排序', '更大的存储（128位）', '索引性能差'],
    useCase: '通用，低容量系统'
  },
  uuidV7: {
    pros: ['按时间可排序', '无需协调', '标准格式'],
    cons: ['比Snowflake更大'],
    useCase: '数据库主键，需要时间排序'
  }
};
```

## 面试要点

### 常见面试问题和答案

**Q1：解释CAP定理以及为什么我们不能拥有全部三个属性**

```typescript
/*
回答框架：

1. 定义：CAP指出分布式系统只能保证三个属性中的两个：一致性、可用性、分区容错性。

2. 为什么不是全部三个：
   - 网络分区在分布式系统中是不可避免的
   - 当分区发生时，你必须选择：
     * 停止服务请求（丧失可用性）
     * 服务可能过时的数据（丧失一致性）
   - 你无法"选择"分区容错性 - 这是现实

3. 真实世界示例：
*/

class InterviewExample {
  // 场景：两个节点，发生分区

  // CP选择：如果无法确认一致性则返回错误
  async cpRead(key: string): Promise<string> {
    if (!this.canReachMajority()) {
      throw new Error('无法保证一致性');
    }
    return this.quorumRead(key);
  }

  // AP选择：返回本地数据，可能过时
  async apRead(key: string): Promise<string> {
    return this.localStorage.get(key); // 始终可用
  }
}
```

**Q2：最终一致性和强一致性有什么区别**

```typescript
/*
强一致性：
- 所有读取反映最新的写入
- 线性化 - 操作看起来是原子的
- 延迟更高，可用性更低

最终一致性：
- 给定足够的时间，所有副本收敛
- 读取可能返回过时数据
- 延迟更低，可用性更高

权衡可视化：
*/

const consistencySpectrum = {
  strongest: [
    '线性一致性',           // 所有操作看起来原子
    '顺序一致性',           // 保留每进程顺序
    '因果一致性',           // 因果相关操作有序
  ],
  weaker: [
    '读您写的',             // 看到自己的写入
    '单调读',               // 从不看到较旧的值
    '最终一致性',           // 最终收敛
  ]
};
```

**Q3：你将如何设计具有高可用性的分布式缓存**

```typescript
class DistributedCacheDesign {
  /*
  关键设计决策：

  1. 分区策略：一致哈希
  2. 复制：每个键存储在N个节点上
  3. 一致性：带有读取修复的AP
  4. 故障处理：节点替换，数据迁移
  */

  private ring: ConsistentHashRing;
  private replicationFactor = 3;

  async get(key: string): Promise<string | null> {
    const nodes = this.ring.getNodes(key, this.replicationFactor);

    // 尝试按顺序读取每个副本
    for (const node of nodes) {
      try {
        const value = await node.get(key);
        if (value !== null) {
          // 异步读取修复
          this.repairAsync(key, value, nodes);
          return value;
        }
      } catch {
        continue; // 尝试下一个副本
      }
    }

    return null;
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    const nodes = this.ring.getNodes(key, this.replicationFactor);

    // 写入所有副本（尽力而为）
    const results = await Promise.allSettled(
      nodes.map(node => node.set(key, value, ttl))
    );

    const successes = results.filter(r => r.status === 'fulfilled').length;
    if (successes === 0) {
      throw new Error('未能写入任何副本');
    }

    // 如果至少一个写入成功则返回成功
    // 后台进程将复制到失败的节点
  }
}
```

**Q4：解释Raft共识算法**

```
Raft面试概述：

1. 领导者选举：
   - 节点以追随者身份启动
   - 如果未收到心跳，则成为候选者
   - 从对等节点请求投票
   - 多数投票=成为领导者

2. 日志复制：
   - 所有写入通过领导者
   - 领导者附加到日志，复制到追随者
   - 当多数派确认时条目提交
   - 追随者应用提交的条目

3. 安全保证：
   - 选举安全性：每个任期一个领导者
   - 领导者仅追加：从不覆盖日志
   - 日志匹配：相同索引+任期=相同命令
   - 领导者完整性：提交的条目在未来领导者中

关键洞察：比Paxos更简单，有相同的保证
```

### 快速参考表

| 概念 | 定义 | 示例 |
|---------|------------|---------|
| 法定人数 | 操作的最小节点数 | W + R > N确保一致性 |
| 向量时钟 | 跟踪因果关系 | {A:2, B:1}发生在{A:2, B:2}之前 |
| 分裂 | 多个领导者 | 由多数派法定人数防止 |
| 提示移交 | 为不可用节点存储写入 | Cassandra |
| 读取修复 | 修复过时副本上的读取 | Dynamo式系统 |
| 反熵 | 后台同步 | Merkle树 |
| 八卦协议 | 对等信息传播 | 成员资格，故障检测 |

## 进一步阅读

### 书籍

1. **《设计数据密集型应用》** 作者：Martin Kleppmann
   - 分布式系统概念的全面覆盖
   - 一致性模型的优秀解释

2. **《分布式系统：原则与范例》** 作者：Tanenbaum & Van Steen
   - 分布式计算的学术基础

3. **《数据库内部结构》** 作者：Alex Petrov
   - 分布式数据库实现的深入探讨

### 论文

1. **《Brewer的猜想与一致、可用、分区容错Web服务的可行性》**（2002）
   - Gilbert & Lynch的CAP定理形式化证明

2. **《Dynamo：Amazon的高可用键值存储》**（2007）
   - 许多AP系统的基础

3. **《寻找一个可理解的共识算法》**（2014）
   - Raft论文，必读材料

4. **《Spanner：Google的全球分布式数据库》**（2012）
   - 如何在全球范围内实现一致性

5. **《时间、时钟和分布式系统中的事件顺序》**（1978）
   - Lamport关于逻辑时钟的基础工作

### 在线资源

- **Jepsen.io** - Kyle Kingsbury的分布式系统测试
- **Aphyr的Call Me Maybe系列** - 分布式系统故障分析
- **The Morning Paper** - 学术论文摘要
- **Distributed Systems for Fun and Profit** - 免费在线书籍

### 练习平台

1. **MIT 6.824实验室** - 实现Raft、分布式键值存储
2. **Fly.io分布式系统挑战** - 实践练习
3. **TigerBeetle Learn** - 金融交易处理

## 总结

CAP定理仍然是分布式系统设计的基石，尽管其实际应用需要细致的理解：

1. **CAP关于分区期间的权衡** - 在正常运行中，设计良好的系统可以提供合理的一致性和可用性。

2. **根据需求选择** - 金融系统通常需要CP；社交媒体源适合AP。

3. **PACELC提供更多指导** - 考虑正常运行期间的延迟与一致性权衡。

4. **共识算法至关重要** - 理解Raft或Paxos对于构建CP系统至关重要。

5. **分布式协调很困难** - 尽可能使用经过验证的实现（etcd、ZooKeeper）。

6. **测试故障场景** - 使用Jepsen等工具验证系统在分区下的行为。

成功的分布式系统的关键不是记忆这些概念，而是理解如何应用它们来解决现实世界的问题，同时做出明智的权衡。
