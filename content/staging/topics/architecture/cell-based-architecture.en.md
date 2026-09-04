---
title: Cell-Based Architecture
description: Design patterns for building highly available systems using cell-based architecture for failure isolation
track: architecture
section: distributed
difficulty: advanced
tags:
  - Cell Architecture
  - Distributed Systems
  - Fault Isolation
  - High Availability
  - Scalability
status: imported
origin: old/src/content/docs/architecture/cell-based-architecture.en.md
divergence: 0.222
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Architecture
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-21
---

## Concept Overview

Cell-based architecture is a distributed systems design pattern that partitions a service into multiple isolated units called **cells**, where each cell can independently serve a subset of users or workloads. When one cell experiences a failure, the **blast radius** is contained to only the users assigned to that cell, while users in other cells remain completely unaffected.

### Historical Background

The cell-based architecture pattern was pioneered by **Amazon Web Services (AWS)** in the early 2010s as a response to cascading failures that could affect entire services. AWS recognized that traditional horizontal scaling, while effective for handling load, did not adequately address the problem of failure isolation.

**Key Industry Adopters:**

| Company | Use Case | Scale |
|---------|----------|-------|
| AWS | Core infrastructure services (Route 53, S3, DynamoDB) | Billions of requests/day |
| Slack | Real-time messaging platform | 750K+ organizations |
| DoorDash | Food delivery logistics | Millions of orders/day |
| Segment | Customer data platform | Trillions of API calls/month |
| Discord | Voice and text communication | 150M+ monthly active users |

### The Fundamental Problem

Traditional horizontally scaled systems share resources across all users. This means a single bug, configuration error, or resource exhaustion issue can potentially affect your entire user base:

```
Traditional Architecture (Shared Infrastructure):
+---------------------------------------------------+
|                 All Users (100%)                  |
|                       |                           |
|                       v                           |
|   +-------------------------------------------+   |
|   |         Shared Service Layer              |   |
|   |   (Single failure = 100% impact)          |   |
|   +-------------------------------------------+   |
|                       |                           |
|                       v                           |
|   +-------------------------------------------+   |
|   |         Shared Database                   |   |
|   +-------------------------------------------+   |
+---------------------------------------------------+

Cell-Based Architecture (Isolated Infrastructure):
+---------------------------------------------------+
|       Cell A (25%)    |        Cell B (25%)       |
|   +----------------+  |   +----------------+      |
|   | Service Layer  |  |   | Service Layer  |      |
|   +----------------+  |   +----------------+      |
|   | Database       |  |   | Database       |      |
|   +----------------+  |   +----------------+      |
|                       |                           |
|       Cell C (25%)    |        Cell D (25%)       |
|   +----------------+  |   +----------------+      |
|   | Service Layer  |  |   | Service Layer  |      |
|   +----------------+  |   +----------------+      |
|   | Database       |  |   | Database       |      |
|   +----------------+  |   +----------------+      |
+---------------------------------------------------+
| Failure in Cell A only affects 25% of users       |
+---------------------------------------------------+
```

The core insight: **You cannot prevent all failures, but you can control the scope of their impact.**

---

## Core Principles

Cell-based architecture is built on several foundational principles that work together to provide fault isolation and high availability.

### 1. Blast Radius Control

The blast radius represents the scope of impact when a failure occurs. In cell-based architecture, the maximum blast radius is limited to one cell.

```
Blast Radius Comparison:

Monolithic System:
Failure Impact = 100% of users

Cell-Based System (10 cells):
Maximum Failure Impact = 10% of users per incident

Cell-Based System (100 cells):
Maximum Failure Impact = 1% of users per incident
```

**Cell Count and Blast Radius Relationship:**

| Number of Cells | Maximum Blast Radius | Trade-off |
|-----------------|---------------------|-----------|
| 2 | 50% | Minimal overhead, limited isolation |
| 10 | 10% | Good balance for most services |
| 50 | 2% | Strong isolation, higher complexity |
| 100 | 1% | Maximum isolation, significant overhead |

### 2. Cell Independence

Each cell must be a fully independent unit with no runtime dependencies on other cells:

```
Cell Independence Architecture:

+------------------------+     +------------------------+
|        Cell A          |     |        Cell B          |
| +--------------------+ |     | +--------------------+ |
| |   Load Balancer    | |     | |   Load Balancer    | |
| +--------------------+ |     | +--------------------+ |
| |   App Servers      | |     | |   App Servers      | |
| |   (Auto-scaling)   | |     | |   (Auto-scaling)   | |
| +--------------------+ |     | +--------------------+ |
| |   Cache Cluster    | |     | |   Cache Cluster    | |
| |   (Redis/Memcached)| |     | |   (Redis/Memcached)| |
| +--------------------+ |     | +--------------------+ |
| |   Database         | |     | |   Database         | |
| |   (Primary/Replica)| |     | |   (Primary/Replica)| |
| +--------------------+ |     | +--------------------+ |
| |   Message Queue    | |     | |   Message Queue    | |
| +--------------------+ |     | +--------------------+ |
+------------------------+     +------------------------+
         ^                              ^
         |                              |
         +------------+  +--------------+
                      |  |
              +-------+--+-------+
              |   Cell Router    |
              |  (Stateless)     |
              +------------------+
                      ^
                      |
              +-------+-------+
              |   Clients     |
              +---------------+
```

**Independence Requirements:**

1. **Isolated Compute**: Each cell has its own set of application servers
2. **Isolated Storage**: Each cell has its own database instances
3. **Isolated Queues**: Message queues are cell-specific
4. **Isolated Caches**: Cache layers are not shared across cells

### 3. Stateless Routing Layer

The routing layer must be:

1. **Stateless**: No session state, allowing horizontal scaling
2. **Highly Available**: Deployed across multiple availability zones
3. **Fast**: Minimal latency overhead (typically < 5ms)
4. **Deterministic**: Same input always routes to same cell

### 4. Cell Sizing Strategy

Cell size is a critical decision balancing blast radius against operational complexity:

```
Cell Sizing Trade-offs:

+------------------+------------------+------------------+
|   Small Cells    |   Medium Cells   |   Large Cells    |
+------------------+------------------+------------------+
| Blast Radius: 1% | Blast Radius: 5% | Blast Radius: 20%|
+------------------+------------------+------------------+
| Pros:            | Pros:            | Pros:            |
| - Min impact     | - Balanced       | - Simple ops     |
| - Fine control   | - Manageable     | - Lower cost     |
|                  |                  |                  |
| Cons:            | Cons:            | Cons:            |
| - High ops cost  | - Moderate cost  | - Large impact   |
| - Complex routing| - Some complexity| - Less flexible  |
+------------------+------------------+------------------+
```

**Sizing Guidelines:**

| Service Criticality | Recommended Cell Size | Blast Radius Target |
|--------------------|-----------------------|---------------------|
| Tier 0 (Core) | 1-2% of users | < 2% |
| Tier 1 (Important) | 5-10% of users | < 10% |
| Tier 2 (Standard) | 10-20% of users | < 20% |

### 5. Data Partitioning Strategy

Choosing the right partition key is essential for even distribution:

| Key Type | Best For | Considerations |
|----------|----------|----------------|
| User ID | B2C applications | Even distribution, user affinity |
| Tenant ID | B2B SaaS | Tenant isolation, varying sizes |
| Region | Global services | Data locality, compliance |
| Shard Key | Database-aligned | Consistent with data partitioning |

---

## Key Concepts

### Cell Isolation Boundaries

Define clear boundaries for what belongs inside a cell versus what remains global:

```
Cell Boundary Definition:

+----------------------------------------------------------+
|                    INSIDE CELL                            |
| - User data and state                                     |
| - Application logic processing                            |
| - Session management                                      |
| - Cell-specific caches                                    |
| - Transactional databases                                 |
| - Message queues for async processing                     |
+----------------------------------------------------------+

+----------------------------------------------------------+
|                   OUTSIDE CELL (Global)                   |
| - Cell routing and discovery                              |
| - Authentication/Authorization (read-only)                |
| - Global configuration (read-only)                        |
| - Cross-cell analytics and reporting                      |
| - Control plane operations                                |
| - CDN and static assets                                   |
+----------------------------------------------------------+
```

### Inter-Cell Communication

Cross-cell communication should be minimized but sometimes is necessary:

**Approaches:**

1. **Avoid entirely** through denormalization
2. **Async messaging** for eventual consistency
3. **Dedicated global service** for truly shared data
4. **Read replicas** for cross-cell queries

### State Management

Each cell manages its own state independently:

```typescript
// Cell-local state management
interface CellState {
  cellId: string;
  users: Map<string, UserData>;
  sessions: Map<string, SessionData>;
  cache: CellCache;
}

class CellStateManager {
  private state: CellState;

  constructor(cellId: string) {
    this.state = {
      cellId,
      users: new Map(),
      sessions: new Map(),
      cache: new CellCache()
    };
  }

  // All operations are cell-local
  async getUser(userId: string): Promise<UserData | null> {
    return this.state.users.get(userId) || null;
  }

  // No cross-cell references
  async updateUser(userId: string, data: Partial<UserData>): Promise<void> {
    const user = this.state.users.get(userId);
    if (user) {
      Object.assign(user, data);
    }
  }
}
```

---

## Code Examples

### Cell Router Implementation

A production-ready cell routing service:

```typescript
import { Redis } from 'ioredis';

interface CellConfig {
  id: string;
  endpoint: string;
  weight: number;
  healthy: boolean;
  region: string;
}

class ConsistentHashRing {
  private readonly ring: Map<number, string> = new Map();
  private readonly sortedHashes: number[] = [];
  private readonly virtualNodes: number;

  constructor(cells: string[], virtualNodes: number = 150) {
    this.virtualNodes = virtualNodes;
    cells.forEach(cell => this.addCell(cell));
  }

  private hash(key: string): number {
    // FNV-1a hash for better distribution
    let hash = 2166136261;
    for (let i = 0; i < key.length; i++) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  addCell(cellId: string): void {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this.hash(`${cellId}:${i}`);
      this.ring.set(hash, cellId);
      this.sortedHashes.push(hash);
    }
    this.sortedHashes.sort((a, b) => a - b);
  }

  removeCell(cellId: string): void {
    for (let i = 0; i < this.virtualNodes; i++) {
      const hash = this.hash(`${cellId}:${i}`);
      this.ring.delete(hash);
      const index = this.sortedHashes.indexOf(hash);
      if (index > -1) {
        this.sortedHashes.splice(index, 1);
      }
    }
  }

  getCell(partitionKey: string): string {
    if (this.ring.size === 0) {
      throw new Error('No cells available');
    }

    const hash = this.hash(partitionKey);

    // Binary search for efficiency
    let left = 0;
    let right = this.sortedHashes.length - 1;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.sortedHashes[mid] < hash) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    const nodeHash = this.sortedHashes[left] >= hash
      ? this.sortedHashes[left]
      : this.sortedHashes[0];

    return this.ring.get(nodeHash)!;
  }
}

class CellRouterService {
  private cells: Map<string, CellConfig> = new Map();
  private hashRing!: ConsistentHashRing;
  private overrides: Map<string, string> = new Map();
  private redis: Redis;
  private localCache: Map<string, { cellId: string; expiry: number }> = new Map();
  private readonly cacheTtlMs: number = 60000;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async initialize(): Promise<void> {
    const cellConfigs = await this.loadCellConfigs();
    cellConfigs.forEach(c => this.cells.set(c.id, c));

    const healthyCells = cellConfigs
      .filter(c => c.healthy)
      .map(c => c.id);
    this.hashRing = new ConsistentHashRing(healthyCells);

    await this.loadOverrides();
    this.subscribeToHealthUpdates();
  }

  async route(partitionKey: string): Promise<CellConfig> {
    // Check local cache first (sub-millisecond)
    const cached = this.localCache.get(partitionKey);
    if (cached && cached.expiry > Date.now()) {
      const cell = this.cells.get(cached.cellId);
      if (cell?.healthy) {
        return cell;
      }
    }

    // Check for explicit override (migrations)
    const override = this.overrides.get(partitionKey);
    if (override) {
      const cell = this.cells.get(override);
      if (cell?.healthy) {
        this.cacheRoute(partitionKey, cell.id);
        return cell;
      }
    }

    // Use consistent hashing
    const cellId = this.hashRing.getCell(partitionKey);
    const cell = this.cells.get(cellId);

    if (!cell || !cell.healthy) {
      throw new CellUnavailableError(cellId);
    }

    this.cacheRoute(partitionKey, cell.id);
    return cell;
  }

  private cacheRoute(partitionKey: string, cellId: string): void {
    this.localCache.set(partitionKey, {
      cellId,
      expiry: Date.now() + this.cacheTtlMs
    });
  }

  async migratePartition(
    partitionKey: string,
    fromCell: string,
    toCell: string
  ): Promise<void> {
    this.overrides.set(partitionKey, toCell);
    await this.redis.hset('cell:overrides', partitionKey, toCell);
    this.localCache.delete(partitionKey);
    console.log(`Migrated partition ${partitionKey}: ${fromCell} -> ${toCell}`);
  }

  private async loadCellConfigs(): Promise<CellConfig[]> {
    const configs = await this.redis.hgetall('cell:configs');
    return Object.values(configs).map(c => JSON.parse(c));
  }

  private async loadOverrides(): Promise<void> {
    const overrides = await this.redis.hgetall('cell:overrides');
    Object.entries(overrides).forEach(([key, cellId]) => {
      this.overrides.set(key, cellId);
    });
  }

  private subscribeToHealthUpdates(): void {
    const subscriber = this.redis.duplicate();
    subscriber.subscribe('cell:health');

    subscriber.on('message', (channel, message) => {
      if (channel === 'cell:health') {
        const update = JSON.parse(message);
        this.handleHealthUpdate(update);
      }
    });
  }

  private handleHealthUpdate(update: { cellId: string; healthy: boolean }): void {
    const cell = this.cells.get(update.cellId);
    if (cell) {
      cell.healthy = update.healthy;

      if (!update.healthy) {
        this.hashRing.removeCell(update.cellId);
        console.log(`Cell ${update.cellId} marked unhealthy, removed from routing`);
      } else {
        this.hashRing.addCell(update.cellId);
        console.log(`Cell ${update.cellId} marked healthy, added to routing`);
      }
    }
  }
}

class CellUnavailableError extends Error {
  constructor(cellId: string) {
    super(`Cell ${cellId} is unavailable`);
    this.name = 'CellUnavailableError';
  }
}
```

### Request Distribution Logic

```typescript
import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

interface ProxyTarget {
  target: string;
  changeOrigin: boolean;
}

class CellProxy {
  private router: CellRouterService;
  private app: express.Application;

  constructor(router: CellRouterService) {
    this.router = router;
    this.app = express();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Extract partition key from request
    this.app.use(async (req: Request, res: Response, next: NextFunction) => {
      try {
        const partitionKey = this.extractPartitionKey(req);

        if (!partitionKey) {
          res.status(400).json({ error: 'Missing partition key' });
          return;
        }

        const cell = await this.router.route(partitionKey);

        // Attach cell info to request
        (req as any).targetCell = cell;
        next();
      } catch (error) {
        if (error instanceof CellUnavailableError) {
          res.status(503).json({
            error: 'Service temporarily unavailable',
            retryAfter: 30
          });
        } else {
          next(error);
        }
      }
    });

    // Proxy request to target cell
    this.app.use('/', (req: Request, res: Response) => {
      const cell = (req as any).targetCell;

      const proxy = createProxyMiddleware({
        target: cell.endpoint,
        changeOrigin: true,
        timeout: 30000,
        onError: (err, req, res) => {
          console.error(`Proxy error for cell ${cell.id}:`, err);
          (res as Response).status(502).json({ error: 'Cell communication error' });
        }
      });

      proxy(req, res, () => {});
    });
  }

  private extractPartitionKey(req: Request): string | null {
    // Try multiple sources for partition key
    return (
      req.headers['x-partition-key'] as string ||
      req.query.userId as string ||
      req.query.tenantId as string ||
      this.extractFromPath(req.path) ||
      this.extractFromBody(req.body)
    );
  }

  private extractFromPath(path: string): string | null {
    const match = path.match(/\/users\/([^/]+)/);
    return match ? match[1] : null;
  }

  private extractFromBody(body: any): string | null {
    return body?.userId || body?.tenantId || null;
  }

  listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`Cell proxy listening on port ${port}`);
    });
  }
}
```

### Health Check Implementation

```typescript
interface HealthCheckResult {
  healthy: boolean;
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    latencyMs: number;
    message?: string;
  }[];
  timestamp: Date;
}

class CellHealthChecker {
  private readonly checkIntervalMs: number = 5000;
  private readonly failureThreshold: number = 3;
  private readonly timeoutMs: number = 5000;
  private failureCounts: Map<string, number> = new Map();
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async checkCellHealth(cell: CellConfig): Promise<HealthCheckResult> {
    const checks = await Promise.allSettled([
      this.checkEndpointHealth(cell),
      this.checkDatabaseHealth(cell),
      this.checkCacheHealth(cell),
      this.checkQueueHealth(cell)
    ]);

    const results = checks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        name: ['endpoint', 'database', 'cache', 'queue'][index],
        status: 'fail' as const,
        latencyMs: this.timeoutMs,
        message: result.reason?.message || 'Check failed'
      };
    });

    const healthy = results.every(c => c.status !== 'fail');

    return {
      healthy,
      checks: results,
      timestamp: new Date()
    };
  }

  private async checkEndpointHealth(cell: CellConfig): Promise<{
    name: string;
    status: 'pass' | 'warn' | 'fail';
    latencyMs: number;
    message?: string;
  }> {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${cell.endpoint}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - start;

      if (response.ok) {
        return {
          name: 'endpoint',
          status: latencyMs > 1000 ? 'warn' : 'pass',
          latencyMs,
          message: latencyMs > 1000 ? 'High latency detected' : undefined
        };
      }

      return {
        name: 'endpoint',
        status: 'fail',
        latencyMs,
        message: `HTTP ${response.status}`
      };
    } catch (error: any) {
      clearTimeout(timeout);
      return {
        name: 'endpoint',
        status: 'fail',
        latencyMs: Date.now() - start,
        message: error.message
      };
    }
  }

  private async checkDatabaseHealth(cell: CellConfig): Promise<{
    name: string;
    status: 'pass' | 'warn' | 'fail';
    latencyMs: number;
    message?: string;
  }> {
    const start = Date.now();
    try {
      const response = await fetch(`${cell.endpoint}/health/db`);
      const data = await response.json();
      const latencyMs = Date.now() - start;

      return {
        name: 'database',
        status: data.replicationLag > 1000 ? 'warn' : 'pass',
        latencyMs,
        message: data.replicationLag > 1000
          ? `Replication lag: ${data.replicationLag}ms`
          : undefined
      };
    } catch (error: any) {
      return {
        name: 'database',
        status: 'fail',
        latencyMs: Date.now() - start,
        message: error.message
      };
    }
  }

  private async checkCacheHealth(cell: CellConfig): Promise<{
    name: string;
    status: 'pass' | 'warn' | 'fail';
    latencyMs: number;
  }> {
    const start = Date.now();
    try {
      const response = await fetch(`${cell.endpoint}/health/cache`);
      return {
        name: 'cache',
        status: response.ok ? 'pass' : 'fail',
        latencyMs: Date.now() - start
      };
    } catch {
      return {
        name: 'cache',
        status: 'fail',
        latencyMs: Date.now() - start
      };
    }
  }

  private async checkQueueHealth(cell: CellConfig): Promise<{
    name: string;
    status: 'pass' | 'warn' | 'fail';
    latencyMs: number;
    message?: string;
  }> {
    const start = Date.now();
    try {
      const response = await fetch(`${cell.endpoint}/health/queue`);
      const data = await response.json();
      const latencyMs = Date.now() - start;

      return {
        name: 'queue',
        status: data.queueDepth > 10000 ? 'warn' : 'pass',
        latencyMs,
        message: data.queueDepth > 10000
          ? `High queue depth: ${data.queueDepth}`
          : undefined
      };
    } catch (error: any) {
      return {
        name: 'queue',
        status: 'fail',
        latencyMs: Date.now() - start,
        message: error.message
      };
    }
  }

  recordHealthResult(cellId: string, result: HealthCheckResult): boolean {
    if (!result.healthy) {
      const currentCount = this.failureCounts.get(cellId) || 0;
      this.failureCounts.set(cellId, currentCount + 1);

      if (currentCount + 1 >= this.failureThreshold) {
        this.publishHealthUpdate(cellId, false);
        return false;
      }
    } else {
      this.failureCounts.set(cellId, 0);
    }
    return true;
  }

  private async publishHealthUpdate(cellId: string, healthy: boolean): Promise<void> {
    await this.redis.publish('cell:health', JSON.stringify({ cellId, healthy }));
  }

  startMonitoring(cells: CellConfig[]): void {
    setInterval(async () => {
      for (const cell of cells) {
        const result = await this.checkCellHealth(cell);
        this.recordHealthResult(cell.id, result);
      }
    }, this.checkIntervalMs);
  }
}
```

---

## Best Practices

### Cell Planning

**1. Start with the Right Number of Cells**

```
Capacity Planning Framework:

1. Determine Total Capacity Needed:
   - Peak QPS: 100,000
   - Storage: 10 TB
   - Connections: 50,000

2. Define Blast Radius Target:
   - Target: < 5% of users affected per incident
   - Minimum cells needed: 20

3. Calculate Per-Cell Capacity:
   - QPS per cell: 5,000
   - Storage per cell: 500 GB
   - Connections per cell: 2,500

4. Add Headroom (30-50%):
   - QPS per cell: 7,500 (with 50% headroom)
   - Storage per cell: 750 GB
   - Connections per cell: 3,750

5. Size Infrastructure:
   - Compute: 3x c5.2xlarge per cell
   - Database: db.r5.xlarge with read replica
   - Cache: cache.r5.large cluster
```

**2. Design for Cell Independence from Day One**

- Never allow synchronous cross-cell calls
- Use async replication for data that needs to span cells
- Design APIs to work within cell boundaries

### Capacity Planning

```typescript
interface CellCapacity {
  cellId: string;
  maxQps: number;
  currentQps: number;
  maxStorage: number;
  currentStorage: number;
  utilizationPercent: number;
}

class CapacityPlanner {
  private readonly utilizationTarget = 0.7; // 70% target utilization
  private readonly scaleUpThreshold = 0.8;
  private readonly scaleDownThreshold = 0.4;

  analyzeCapacity(cells: CellCapacity[]): {
    needsScaleUp: string[];
    canScaleDown: string[];
    balanced: boolean;
  } {
    const needsScaleUp: string[] = [];
    const canScaleDown: string[] = [];

    for (const cell of cells) {
      if (cell.utilizationPercent > this.scaleUpThreshold) {
        needsScaleUp.push(cell.cellId);
      } else if (cell.utilizationPercent < this.scaleDownThreshold) {
        canScaleDown.push(cell.cellId);
      }
    }

    const avgUtilization = cells.reduce((sum, c) => sum + c.utilizationPercent, 0) / cells.length;
    const balanced = Math.abs(avgUtilization - this.utilizationTarget) < 0.1;

    return { needsScaleUp, canScaleDown, balanced };
  }

  recommendNewCellCount(
    currentCells: number,
    avgUtilization: number,
    growthRate: number // monthly growth rate
  ): number {
    // Project 6 months ahead
    const projectedUtilization = avgUtilization * Math.pow(1 + growthRate, 6);

    if (projectedUtilization > 0.9) {
      // Need more cells
      return Math.ceil(currentCells * (projectedUtilization / this.utilizationTarget));
    }

    return currentCells;
  }
}
```

### Deployment Strategy

```typescript
interface DeploymentStage {
  name: string;
  cellPercentage: number;
  waitTimeMinutes: number;
  healthCheckDurationMinutes: number;
}

class CellDeploymentPipeline {
  private readonly stages: DeploymentStage[] = [
    { name: 'canary', cellPercentage: 5, waitTimeMinutes: 30, healthCheckDurationMinutes: 15 },
    { name: 'early-adopter', cellPercentage: 20, waitTimeMinutes: 60, healthCheckDurationMinutes: 30 },
    { name: 'majority', cellPercentage: 50, waitTimeMinutes: 120, healthCheckDurationMinutes: 60 },
    { name: 'remaining', cellPercentage: 100, waitTimeMinutes: 0, healthCheckDurationMinutes: 30 }
  ];

  async deploy(version: string, cells: string[]): Promise<void> {
    let deployedCells: string[] = [];

    for (const stage of this.stages) {
      console.log(`Starting deployment stage: ${stage.name}`);

      const cellsForStage = this.selectCellsForStage(cells, stage.cellPercentage, deployedCells);

      // Deploy to cells in parallel
      await Promise.all(
        cellsForStage.map(cell => this.deployToCell(cell, version))
      );

      deployedCells = [...deployedCells, ...cellsForStage];

      // Monitor health
      const healthy = await this.monitorHealth(cellsForStage, stage.healthCheckDurationMinutes);

      if (!healthy) {
        console.log(`Issues detected in stage ${stage.name}, rolling back`);
        await this.rollback(deployedCells, version);
        throw new Error(`Deployment failed at stage ${stage.name}`);
      }

      if (stage.waitTimeMinutes > 0) {
        console.log(`Waiting ${stage.waitTimeMinutes} minutes before next stage`);
        await this.wait(stage.waitTimeMinutes * 60 * 1000);
      }
    }

    console.log('Deployment completed successfully');
  }

  private selectCellsForStage(
    allCells: string[],
    percentage: number,
    alreadyDeployed: string[]
  ): string[] {
    const remaining = allCells.filter(c => !alreadyDeployed.includes(c));
    const targetCount = Math.ceil(allCells.length * (percentage / 100));
    const neededCount = targetCount - alreadyDeployed.length;
    return remaining.slice(0, neededCount);
  }

  private async deployToCell(cellId: string, version: string): Promise<void> {
    console.log(`Deploying version ${version} to cell ${cellId}`);
    // Implementation
  }

  private async monitorHealth(cells: string[], durationMinutes: number): Promise<boolean> {
    const endTime = Date.now() + durationMinutes * 60 * 1000;
    while (Date.now() < endTime) {
      // Check error rates, latency, etc.
      await this.wait(30000);
    }
    return true;
  }

  private async rollback(cells: string[], version: string): Promise<void> {
    console.log(`Rolling back ${cells.length} cells from version ${version}`);
    // Implementation
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Monitoring and Alerting

```typescript
interface CellMetrics {
  cellId: string;
  timestamp: Date;
  requestCount: number;
  errorCount: number;
  latencyP50: number;
  latencyP99: number;
  cpuUtilization: number;
  memoryUtilization: number;
}

class CellMonitoring {
  private readonly alertThresholds = {
    errorRate: 0.01,      // 1%
    latencyP99: 500,      // ms
    cpuUtilization: 0.8,  // 80%
    memoryUtilization: 0.85
  };

  async checkAlerts(metrics: CellMetrics): Promise<string[]> {
    const alerts: string[] = [];

    const errorRate = metrics.errorCount / Math.max(metrics.requestCount, 1);
    if (errorRate > this.alertThresholds.errorRate) {
      alerts.push(`[${metrics.cellId}] High error rate: ${(errorRate * 100).toFixed(2)}%`);
    }

    if (metrics.latencyP99 > this.alertThresholds.latencyP99) {
      alerts.push(`[${metrics.cellId}] High P99 latency: ${metrics.latencyP99}ms`);
    }

    if (metrics.cpuUtilization > this.alertThresholds.cpuUtilization) {
      alerts.push(`[${metrics.cellId}] High CPU: ${(metrics.cpuUtilization * 100).toFixed(1)}%`);
    }

    if (metrics.memoryUtilization > this.alertThresholds.memoryUtilization) {
      alerts.push(`[${metrics.cellId}] High memory: ${(metrics.memoryUtilization * 100).toFixed(1)}%`);
    }

    return alerts;
  }

  // Compare cell against peers for anomaly detection
  async detectAnomalies(
    cellMetrics: CellMetrics,
    allCellMetrics: CellMetrics[]
  ): Promise<string[]> {
    const anomalies: string[] = [];

    const avgErrorRate = allCellMetrics.reduce(
      (sum, m) => sum + m.errorCount / Math.max(m.requestCount, 1),
      0
    ) / allCellMetrics.length;

    const cellErrorRate = cellMetrics.errorCount / Math.max(cellMetrics.requestCount, 1);

    // Flag if cell error rate is 3x the average
    if (cellErrorRate > avgErrorRate * 3 && cellErrorRate > 0.001) {
      anomalies.push(
        `[${cellMetrics.cellId}] Error rate ${(cellErrorRate * 100).toFixed(2)}% ` +
        `is 3x above average ${(avgErrorRate * 100).toFixed(2)}%`
      );
    }

    return anomalies;
  }
}
```

---

## Common Pitfalls

### Pitfall 1: Cells Too Large

**Problem**: Large cells defeat the purpose of blast radius control.

```
Bad: 3 cells serving 100,000 users each
     Failure impact: 33% of users

Good: 20 cells serving 15,000 users each
      Failure impact: 5% of users
```

**Solution**: Size cells to achieve your target blast radius. For critical services, aim for 1-5% impact per cell failure.

### Pitfall 2: Cells Too Small

**Problem**: Excessive operational overhead and cost.

```
Bad: 1,000 cells serving 300 users each
     - Infrastructure cost: 100x higher
     - Operational complexity: Unmanageable
     - Deployment time: Days instead of hours

Good: 50 cells serving 6,000 users each
      - Reasonable cost
      - Manageable operations
      - Deployment time: Hours
```

**Solution**: Find the balance between blast radius and operational efficiency. 10-50 cells is typically optimal.

### Pitfall 3: Cross-Cell Dependencies

**Problem**: Hidden dependencies negate isolation benefits.

```typescript
// BAD: Cross-cell call creates dependency
class UserService {
  async getUser(userId: string): Promise<User> {
    const user = await this.localDb.findUser(userId);

    // This call to another cell breaks isolation!
    const friendsCell = await this.router.getCellForUser(user.bestFriendId);
    const friend = await friendsCell.getUser(user.bestFriendId);

    return { ...user, bestFriend: friend };
  }
}

// GOOD: Keep all operations within cell
class UserService {
  async getUser(userId: string): Promise<User> {
    const user = await this.localDb.findUser(userId);

    // Return reference, let client resolve if needed
    return {
      ...user,
      bestFriendId: user.bestFriendId
    };
  }
}
```

### Pitfall 4: Shared Database

**Problem**: Sharing database across cells creates single point of failure.

```
BAD Architecture:
+--------+  +--------+  +--------+
| Cell 1 |  | Cell 2 |  | Cell 3 |
+--------+  +--------+  +--------+
    |           |           |
    +-----------+-----------+
                |
        +---------------+
        | Shared DB     |  <-- Single Point of Failure
        +---------------+

GOOD Architecture:
+--------+  +--------+  +--------+
| Cell 1 |  | Cell 2 |  | Cell 3 |
+--------+  +--------+  +--------+
    |           |           |
+-------+   +-------+   +-------+
| DB 1  |   | DB 2  |   | DB 3  |  <-- Isolated DBs
+-------+   +-------+   +-------+
```

### Pitfall 5: Hot Partition

**Problem**: Uneven distribution causing one cell to be overloaded.

```typescript
// Detection
class HotPartitionDetector {
  async detect(cells: CellMetrics[]): Promise<string[]> {
    const avgLoad = cells.reduce((sum, c) => sum + c.requestCount, 0) / cells.length;

    return cells
      .filter(c => c.requestCount > avgLoad * 2)
      .map(c => c.cellId);
  }
}

// Solutions:
// 1. Split the hot partition
// 2. Move to dedicated larger cell
// 3. Add caching layer
// 4. Implement rate limiting
```

### Pitfall 6: Inconsistent State During Migration

**Problem**: Data inconsistency when migrating users between cells.

```typescript
// BAD: Race condition during migration
async migrateUser(userId: string, fromCell: string, toCell: string) {
  await copyUserData(userId, fromCell, toCell);
  await updateRouting(userId, toCell);  // Gap where writes can go to old cell
  await deleteUserData(userId, fromCell);
}

// GOOD: Use write locking during migration
async migrateUser(userId: string, fromCell: string, toCell: string) {
  // 1. Enable write lock
  await this.enableWriteLock(userId);

  // 2. Drain in-flight requests
  await this.drainRequests(userId, 5000);

  // 3. Copy data
  await this.copyUserData(userId, fromCell, toCell);

  // 4. Update routing atomically
  await this.updateRouting(userId, toCell);

  // 5. Disable write lock
  await this.disableWriteLock(userId);

  // 6. Cleanup asynchronously
  this.scheduleCleanup(userId, fromCell);
}
```

---

## Performance Considerations

### Routing Latency

The routing layer adds latency to every request. Optimize carefully:

```typescript
class HighPerformanceRouter {
  private localCache: Map<string, { cellId: string; expiry: number }>;
  private readonly cacheTtlMs: number = 60000;

  async route(partitionKey: string): Promise<string> {
    // Check local cache first (sub-microsecond)
    const cached = this.localCache.get(partitionKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.cellId;
    }

    // Compute route (consistent hashing is O(log n))
    const cellId = this.hashRing.getCell(partitionKey);

    // Cache the result
    this.localCache.set(partitionKey, {
      cellId,
      expiry: Date.now() + this.cacheTtlMs
    });

    return cellId;
  }
}
```

**Latency Targets:**

| Component | Target Latency | Maximum Latency |
|-----------|---------------|-----------------|
| Route computation | < 1ms | 5ms |
| Cache lookup | < 0.1ms | 1ms |
| Health check | < 10ms | 50ms |

### Cross-Cell Query Handling

When queries must span cells (e.g., analytics):

```typescript
class CrossCellQueryExecutor {
  async executeAcrossCells<T>(
    cells: CellConfig[],
    query: (cell: CellConfig) => Promise<T[]>
  ): Promise<T[]> {
    // Execute in parallel with timeout
    const results = await Promise.allSettled(
      cells.map(cell =>
        Promise.race([
          query(cell),
          this.timeout<T[]>(5000, [])
        ])
      )
    );

    // Aggregate successful results
    return results
      .filter((r): r is PromiseFulfilledResult<T[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);
  }

  private timeout<T>(ms: number, defaultValue: T): Promise<T> {
    return new Promise(resolve =>
      setTimeout(() => resolve(defaultValue), ms)
    );
  }
}
```

### Cell Scaling

```typescript
interface ScalingPolicy {
  metric: 'cpu' | 'memory' | 'requests' | 'latency';
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  cooldownSeconds: number;
}

class CellAutoScaler {
  private readonly policies: ScalingPolicy[] = [
    { metric: 'cpu', scaleUpThreshold: 70, scaleDownThreshold: 30, cooldownSeconds: 300 },
    { metric: 'latency', scaleUpThreshold: 200, scaleDownThreshold: 50, cooldownSeconds: 300 }
  ];

  async evaluateScaling(cellId: string): Promise<'scale-up' | 'scale-down' | 'none'> {
    const metrics = await this.getMetrics(cellId);

    for (const policy of this.policies) {
      if (metrics[policy.metric] > policy.scaleUpThreshold) {
        return 'scale-up';
      }
    }

    const allBelowThreshold = this.policies.every(
      policy => metrics[policy.metric] < policy.scaleDownThreshold
    );

    return allBelowThreshold ? 'scale-down' : 'none';
  }

  async scaleCell(cellId: string, direction: 'up' | 'down'): Promise<void> {
    const currentInstances = await this.getInstanceCount(cellId);
    const newCount = direction === 'up'
      ? currentInstances + 1
      : Math.max(2, currentInstances - 1);

    await this.setInstanceCount(cellId, newCount);
    console.log(`Scaled cell ${cellId} ${direction}: ${currentInstances} -> ${newCount}`);
  }

  private async getMetrics(cellId: string): Promise<Record<string, number>> {
    // Implementation
    return { cpu: 0, memory: 0, requests: 0, latency: 0 };
  }

  private async getInstanceCount(cellId: string): Promise<number> {
    return 3;
  }

  private async setInstanceCount(cellId: string, count: number): Promise<void> {
    // Implementation
  }
}
```

---

## Real-World Scenarios

### Scenario 1: Multi-Tenant SaaS Platform

```typescript
interface Tenant {
  id: string;
  tier: 'free' | 'pro' | 'enterprise';
  dedicatedCell?: string;
}

class MultiTenantCellRouter {
  private readonly dedicatedCells: Map<string, string> = new Map();
  private readonly sharedCellRouter: ConsistentHashRing;

  constructor(sharedCells: string[]) {
    this.sharedCellRouter = new ConsistentHashRing(sharedCells);
  }

  routeTenant(tenant: Tenant): string {
    // Enterprise tenants get dedicated cells
    if (tenant.tier === 'enterprise' && tenant.dedicatedCell) {
      return tenant.dedicatedCell;
    }

    // Pro tenants use premium shared cells
    if (tenant.tier === 'pro') {
      return this.sharedCellRouter.getCell(`pro:${tenant.id}`);
    }

    // Free tenants use standard shared cells
    return this.sharedCellRouter.getCell(`free:${tenant.id}`);
  }

  async provisionDedicatedCell(tenant: Tenant): Promise<string> {
    const cellId = `dedicated-${tenant.id}`;

    await this.createCellInfrastructure(cellId, {
      compute: 'c5.4xlarge',
      database: 'db.r5.2xlarge',
      dedicated: true
    });

    this.dedicatedCells.set(tenant.id, cellId);
    return cellId;
  }

  private async createCellInfrastructure(cellId: string, config: any): Promise<void> {
    // Implementation using Terraform, Pulumi, or cloud APIs
  }
}

/*
Multi-Tenant Cell Layout:

+------------------+------------------+------------------+
|  Enterprise      |  Enterprise      |  Enterprise      |
|  Tenant A        |  Tenant B        |  Tenant C        |
|  (Dedicated)     |  (Dedicated)     |  (Dedicated)     |
+------------------+------------------+------------------+

+------------------+------------------+------------------+
|  Pro Shared      |  Pro Shared      |  Pro Shared      |
|  Cell 1          |  Cell 2          |  Cell 3          |
|  (50 tenants)    |  (50 tenants)    |  (50 tenants)    |
+------------------+------------------+------------------+

+------------------+------------------+------------------+
|  Free Shared     |  Free Shared     |  Free Shared     |
|  Cell 1          |  Cell 2          |  Cell 3          |
|  (500 tenants)   |  (500 tenants)   |  (500 tenants)   |
+------------------+------------------+------------------+
*/
```

### Scenario 2: Global Deployment

```typescript
interface RegionalCell {
  id: string;
  region: string;
  availabilityZones: string[];
  isPrimary: boolean;
}

class GlobalCellRouter {
  private readonly regionCells: Map<string, RegionalCell[]> = new Map();

  constructor() {
    this.regionCells.set('us-east-1', [
      { id: 'us-east-1-a', region: 'us-east-1', availabilityZones: ['us-east-1a', 'us-east-1b'], isPrimary: true },
      { id: 'us-east-1-b', region: 'us-east-1', availabilityZones: ['us-east-1c', 'us-east-1d'], isPrimary: false }
    ]);
    this.regionCells.set('eu-west-1', [
      { id: 'eu-west-1-a', region: 'eu-west-1', availabilityZones: ['eu-west-1a', 'eu-west-1b'], isPrimary: true }
    ]);
    this.regionCells.set('ap-northeast-1', [
      { id: 'ap-northeast-1-a', region: 'ap-northeast-1', availabilityZones: ['ap-northeast-1a'], isPrimary: true }
    ]);
  }

  routeRequest(userId: string, userRegion: string): RegionalCell {
    const regionalCells = this.regionCells.get(userRegion) || [];

    if (regionalCells.length === 0) {
      return this.findNearestRegionalCell(userRegion);
    }

    const cellIndex = this.hashToIndex(userId, regionalCells.length);
    return regionalCells[cellIndex];
  }

  async handleRegionFailure(failedRegion: string): Promise<void> {
    const backupRegion = this.getBackupRegion(failedRegion);
    const backupCells = this.regionCells.get(backupRegion) || [];

    console.log(`Region ${failedRegion} failed, failing over to ${backupRegion}`);

    await this.updateDns(failedRegion, backupRegion);

    for (const cell of backupCells) {
      await this.scaleCell(cell.id, 2.0);
    }
  }

  private getBackupRegion(region: string): string {
    const backups: Record<string, string> = {
      'us-east-1': 'us-west-2',
      'us-west-2': 'us-east-1',
      'eu-west-1': 'eu-central-1',
      'ap-northeast-1': 'ap-southeast-1'
    };
    return backups[region] || 'us-east-1';
  }

  private hashToIndex(key: string, max: number): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = ((hash << 5) - hash) + key.charCodeAt(i);
    }
    return Math.abs(hash) % max;
  }

  private findNearestRegionalCell(region: string): RegionalCell {
    return this.regionCells.values().next().value[0];
  }

  private async updateDns(from: string, to: string): Promise<void> {
    // Update Route53 or similar
  }

  private async scaleCell(cellId: string, factor: number): Promise<void> {
    // Scale infrastructure
  }
}
```

### Scenario 3: High-Availability E-Commerce Platform

```typescript
interface PaymentCell {
  id: string;
  region: string;
  processingCapacity: number;
  currentLoad: number;
}

class PaymentCellOrchestrator {
  private cells: PaymentCell[] = [];
  private readonly minHealthyCells: number = 3;

  async processPayment(payment: Payment): Promise<PaymentResult> {
    const cell = await this.selectCell(payment);

    try {
      const result = await Promise.race([
        this.executePayment(cell, payment),
        this.timeout(5000)
      ]);

      return result;
    } catch (error) {
      // Failover to alternate cell
      const alternateCell = await this.selectAlternateCell(cell.id);
      return this.executePayment(alternateCell, payment);
    }
  }

  private async selectCell(payment: Payment): Promise<PaymentCell> {
    const healthyCells = this.cells.filter(c =>
      c.currentLoad < c.processingCapacity * 0.8
    );

    if (healthyCells.length < this.minHealthyCells) {
      throw new Error('Insufficient healthy payment cells');
    }

    const index = this.hashMerchant(payment.merchantId, healthyCells.length);
    return healthyCells[index];
  }

  private async executePayment(cell: PaymentCell, payment: Payment): Promise<PaymentResult> {
    cell.currentLoad++;

    try {
      // Process payment
      return { status: 'success', transactionId: `tx-${Date.now()}` };
    } finally {
      cell.currentLoad--;
    }
  }

  private async selectAlternateCell(excludeId: string): Promise<PaymentCell> {
    const alternates = this.cells.filter(c =>
      c.id !== excludeId && c.currentLoad < c.processingCapacity * 0.9
    );

    if (alternates.length === 0) {
      throw new Error('No alternate cells available');
    }

    return alternates[0];
  }

  private hashMerchant(merchantId: string, max: number): number {
    let hash = 0;
    for (const char of merchantId) {
      hash = ((hash << 5) - hash) + char.charCodeAt(0);
    }
    return Math.abs(hash) % max;
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    );
  }
}

interface Payment {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
}

interface PaymentResult {
  status: 'success' | 'failed' | 'pending';
  transactionId?: string;
  error?: string;
}
```

---

## Interview Questions

### Conceptual Questions

**Q1: What is cell-based architecture and why is it used?**

Cell-based architecture partitions a service into isolated units (cells) where each cell serves a subset of users independently. It is used to limit the blast radius of failures - when one cell fails, only users in that cell are affected, not the entire service.

**Q2: How do you determine the optimal number of cells?**

The number of cells is determined by the target blast radius. If you want a maximum of 5% of users affected by any single failure, you need at least 20 cells. Balance this against operational complexity and cost. Most services use 10-50 cells.

**Q3: What are the key differences between cell-based architecture and traditional horizontal scaling?**

| Aspect | Traditional Horizontal | Cell-Based |
|--------|----------------------|------------|
| Failure impact | All users | Cell users only |
| Data isolation | Shared database | Isolated databases |
| Deployment | All instances | Per-cell rollout |
| Complexity | Lower | Higher |
| Cost | Lower | Higher |

**Q4: How do you handle cross-cell communication?**

Minimize cross-cell communication as it creates dependencies. Options:
1. Avoid entirely through denormalization
2. Use async messaging for eventual consistency
3. Use a separate global service for truly shared data

### Design Questions

**Q5: Design a cell-based architecture for a social media feed service.**

Key considerations:
- Partition by user ID
- Each cell contains users' posts and their feed data
- Friends may be in different cells - store friend posts via async replication
- Global services: user search, trending topics
- Cell size: 1-2% of users for high availability

**Q6: How would you migrate an existing monolithic service to cell-based architecture?**

1. Identify partition key (usually user or tenant ID)
2. Shard database by partition key
3. Deploy cell-aware routing layer
4. Create first cell with subset of traffic
5. Gradually create more cells and migrate users
6. Remove global dependencies iteratively

**Q7: How do you handle a "hot" partition that exceeds cell capacity?**

Options:
1. Split the hot partition across multiple cells
2. Move the hot partition to a dedicated larger cell
3. Implement request throttling
4. Add caching layer in front of the cell

### Scenario Questions

**Q8: A cell is showing elevated error rates but health checks are passing. How do you investigate?**

1. Check application-level metrics (not just infrastructure)
2. Look for partial failures (specific endpoints)
3. Review recent deployments to the cell
4. Check for poison pill requests
5. Compare with other cells to identify cell-specific issues

**Q9: You need to perform maintenance on a cell's database. How do you minimize user impact?**

1. Enable write locking for affected partitions
2. Drain in-flight requests
3. Migrate users to other cells temporarily
4. Perform maintenance
5. Verify database health
6. Migrate users back
7. Disable write locking

---

## Further Reading

### AWS Resources

- [AWS Well-Architected Framework: Reliability Pillar](https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html)
- [Amazon Builders' Library: Avoiding insurmountable queue backlogs](https://aws.amazon.com/builders-library/avoiding-insurmountable-queue-backlogs/)
- [Amazon Builders' Library: Workload isolation using shuffle-sharding](https://aws.amazon.com/builders-library/workload-isolation-using-shuffle-sharding/)

### Engineering Blog Posts

- **Slack Engineering**: [How Slack Built Its Infrastructure for Cell-Based Architecture](https://slack.engineering/)
- **DoorDash Engineering**: [Building Scalable Real-Time Systems](https://doordash.engineering/)
- **Discord Engineering**: [How Discord Stores Trillions of Messages](https://discord.com/blog/how-discord-stores-trillions-of-messages)

### Related Patterns

| Pattern | Relationship to Cell Architecture |
|---------|----------------------------------|
| Bulkhead | Cell architecture is a form of bulkhead at service level |
| Circuit Breaker | Used within cells and for cell-level failover |
| Saga | For handling distributed transactions across cell boundaries |
| Shuffle Sharding | Advanced technique to reduce correlated failures |

### Books

- "Release It!" by Michael Nygard - Patterns for building resilient systems
- "Designing Data-Intensive Applications" by Martin Kleppmann - Distributed systems fundamentals
- "Site Reliability Engineering" by Google - Operational practices for reliable services
- "Building Microservices" by Sam Newman - Service design patterns

---

## Summary

Cell-based architecture is a powerful pattern for building highly available distributed systems. By partitioning your service into isolated cells, you can:

1. **Limit blast radius** - Failures affect only a fraction of users
2. **Deploy safely** - Test changes on individual cells before broad rollout
3. **Scale independently** - Each cell can be sized for its specific workload
4. **Isolate tenants** - Provide dedicated resources for premium customers

**Key Implementation Considerations:**

| Aspect | Recommendation |
|--------|----------------|
| Cell sizing | 1-10% of users per cell for critical services |
| Routing | Use consistent hashing with failover support |
| Health checking | Multi-level checks with automatic failover |
| Deployment | Staged rollout across cells |
| Monitoring | Cell-aware metrics and alerting |

**When to Use Cell-Based Architecture:**

- Tier 0/1 services requiring extreme availability
- Multi-tenant SaaS platforms needing tenant isolation
- Global services requiring regional independence
- Services where the cost of a global outage is very high

The trade-off is increased operational complexity and cost. When implemented correctly, cell-based architecture transforms potential global outages into localized incidents, significantly improving your service's resilience and your customers' experience.
