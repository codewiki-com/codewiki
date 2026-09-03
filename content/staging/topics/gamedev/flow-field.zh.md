---
title: 流场寻路算法
description: 掌握流场寻路：高效多智能体导航、向量场，以及 RTS 和群体模拟的实时实现
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - pathfinding
  - flow field
  - AI
  - RTS
  - crowd simulation
status: imported
origin: old/src/content/docs/gamedev/flow-field.zh.md
divergence: 0.198
issues: []
legacy:
  category: GameDev
  subcategory: Game AI
  order: 53
  lastUpdated: 2026-01-21
---

流场寻路是一种强大的技术，用于将大量智能体导航到共同目的地。与传统的 A* 寻路为每个智能体计算路径不同，流场计算一个所有智能体都可以同时使用的单一向量场，使其非常适合 RTS 游戏、群体模拟和塔防场景。

## 概念解释

### 什么是流场寻路？

流场（也称为向量场）是一个网格，其中每个单元格包含一个指向到达目的地最优路径的方向向量。一旦计算完成，任意数量的智能体都可以使用同一流场进行导航，无需额外的寻路计算。

```
+=====================================================================+
|                    流场可视化                                         |
+=====================================================================+
|                                                                      |
|   传统 A*（每个智能体）:          流场（共享）:                       |
|                                                                      |
|   智能体 1: 寻路 ------+          构建一次场:                        |
|   智能体 2: 寻路 ------+          +--+--+--+--+--+                   |
|   智能体 3: 寻路 ------+          |<-|<-|<-|<-| G|                   |
|   ...                  |          +--+--+--+--+--+                   |
|   智能体 N: 寻路 ------+          |<-|<-|<-|^ |^ |                   |
|                        |          +--+--+--+--+--+                   |
|   N 次寻路调用!        |          |<-|<-|^ |^ |^ |                   |
|                        |          +--+--+--+--+--+                   |
|                        |                                              |
|                        |          所有智能体使用同一场!               |
|                        |          每个智能体 O(1) 查询                |
|                                                                      |
+=====================================================================+
```

### 为什么使用流场？

1. **可扩展性**: 一次计算服务数千个智能体
2. **平滑移动**: 向量提供自然的转向方向
3. **动态更新**: 障碍物改变时容易更新场
4. **群体协调**: 智能体自然形成紧密群体
5. **局部避障**: 与转向行为无缝结合

### 何时使用流场

| 场景 | 使用流场 | 使用 A* |
|------|----------|---------|
| 多智能体，一个目的地 | 是 | 否 |
| 少智能体，多个目的地 | 否 | 是 |
| 大型开放区域 | 是 | 视情况 |
| 复杂迷宫 | 视情况 | 是 |
| 频繁变化的目标 | 否 | 是 |
| 静态或半静态目标 | 是 | 否 |

## 核心原理

### 流场生成步骤

```
+=====================================================================+
|                    流场生成管线                                       |
+=====================================================================+
|                                                                      |
|   步骤 1: 代价场                  步骤 2: 积分场                      |
|   +--+--+--+--+--+                 +--+--+--+--+--+                  |
|   | 1| 1| 1| 1| 1|                 | 4| 3| 2| 1| 0|                  |
|   +--+--+--+--+--+                 +--+--+--+--+--+                  |
|   | 1|##|##| 1| 1|   ------->     | 5|##|##| 2| 1|                  |
|   +--+--+--+--+--+   Dijkstra     +--+--+--+--+--+                  |
|   | 1| 1| 1| 1| 1|                 | 6| 5| 4| 3| 2|                  |
|   +--+--+--+--+--+                 +--+--+--+--+--+                  |
|                                                                      |
|   步骤 3: 流场                                                       |
|   +--+--+--+--+--+                                                   |
|   |->|->|->|->| G|   每个单元格指向代价最低的邻居                     |
|   +--+--+--+--+--+                                                   |
|   |->|##|##|^ |^ |                                                   |
|   +--+--+--+--+--+                                                   |
|   |->|->|->|^ |^ |                                                   |
|   +--+--+--+--+--+                                                   |
|                                                                      |
+=====================================================================+
```

### 三种场

1. **代价场**: 每个单元格的基础穿越代价（地形、障碍物）
2. **积分场**: 每个单元格到目的地的总代价
3. **流场**: 指向目的地的方向向量

## 核心要点

### 代价场

代价场表示穿越每个单元格的代价：

```typescript
interface CostField {
    width: number;
    height: number;
    cells: number[];  // 代价值（1 = 正常, 255 = 不可通行）
}

function createCostField(width: number, height: number): CostField {
    const cells = new Array(width * height).fill(1);  // 默认代价 = 1
    return { width, height, cells };
}

function setCost(field: CostField, x: number, y: number, cost: number): void {
    if (x >= 0 && x < field.width && y >= 0 && y < field.height) {
        field.cells[y * field.width + x] = cost;
    }
}

function getCost(field: CostField, x: number, y: number): number {
    if (x < 0 || x >= field.width || y < 0 || y >= field.height) {
        return 255;  // 越界 = 不可通行
    }
    return field.cells[y * field.width + x];
}

// 标记障碍物
function addObstacle(field: CostField, x: number, y: number,
                     width: number, height: number): void {
    for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
            setCost(field, x + dx, y + dy, 255);
        }
    }
}

// 可变地形代价
function setTerrainCost(field: CostField, x: number, y: number,
                        terrainType: string): void {
    const costs: { [key: string]: number } = {
        'grass': 1,   // 草地
        'road': 1,    // 道路
        'sand': 2,    // 沙地
        'water': 5,   // 水域
        'mud': 3,     // 泥地
        'wall': 255   // 墙壁
    };
    setCost(field, x, y, costs[terrainType] || 1);
}
```

### 积分场

积分场存储每个单元格到目的地的累积代价：

```typescript
interface IntegrationField {
    width: number;
    height: number;
    cells: number[];  // 积分值（到目标的距离）
}

const IMPASSABLE = 65535;

function createIntegrationField(costField: CostField,
                                goalX: number, goalY: number): IntegrationField {
    const { width, height } = costField;
    const cells = new Array(width * height).fill(IMPASSABLE);

    // 从目标开始的 Dijkstra 算法
    const openList: Array<{x: number, y: number, cost: number}> = [];

    // 初始化目标
    const goalIndex = goalY * width + goalX;
    cells[goalIndex] = 0;
    openList.push({ x: goalX, y: goalY, cost: 0 });

    // 邻居偏移量（4 方向）
    const neighbors = [
        { dx: 0, dy: -1 },  // 上
        { dx: 1, dy: 0 },   // 右
        { dx: 0, dy: 1 },   // 下
        { dx: -1, dy: 0 }   // 左
    ];

    // 8 方向以获得更平滑的路径
    const diagonalNeighbors = [
        { dx: -1, dy: -1, cost: 1.414 },
        { dx: 1, dy: -1, cost: 1.414 },
        { dx: -1, dy: 1, cost: 1.414 },
        { dx: 1, dy: 1, cost: 1.414 }
    ];

    while (openList.length > 0) {
        // 按代价排序（使用优先队列以获得更好的性能）
        openList.sort((a, b) => a.cost - b.cost);
        const current = openList.shift()!;

        // 检查基本邻居
        for (const n of neighbors) {
            const nx = current.x + n.dx;
            const ny = current.y + n.dy;

            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const neighborCost = getCost(costField, nx, ny);
            if (neighborCost >= 255) continue;  // 不可通行

            const newCost = current.cost + neighborCost;
            const neighborIndex = ny * width + nx;

            if (newCost < cells[neighborIndex]) {
                cells[neighborIndex] = newCost;
                openList.push({ x: nx, y: ny, cost: newCost });
            }
        }

        // 检查对角邻居
        for (const n of diagonalNeighbors) {
            const nx = current.x + n.dx;
            const ny = current.y + n.dy;

            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            // 检查对角是否被阻挡（角落切割）
            if (getCost(costField, current.x + n.dx, current.y) >= 255 ||
                getCost(costField, current.x, current.y + n.dy) >= 255) {
                continue;
            }

            const neighborCost = getCost(costField, nx, ny);
            if (neighborCost >= 255) continue;

            const newCost = current.cost + neighborCost * n.cost;
            const neighborIndex = ny * width + nx;

            if (newCost < cells[neighborIndex]) {
                cells[neighborIndex] = newCost;
                openList.push({ x: nx, y: ny, cost: newCost });
            }
        }
    }

    return { width, height, cells };
}
```

### 流场

流场包含指向目的地的方向向量：

```typescript
interface Vector2 {
    x: number;
    y: number;
}

interface FlowField {
    width: number;
    height: number;
    vectors: Vector2[];
}

function createFlowField(integrationField: IntegrationField): FlowField {
    const { width, height, cells } = integrationField;
    const vectors: Vector2[] = new Array(width * height);

    const neighbors = [
        { dx: 0, dy: -1 },   // 上
        { dx: 1, dy: -1 },   // 右上
        { dx: 1, dy: 0 },    // 右
        { dx: 1, dy: 1 },    // 右下
        { dx: 0, dy: 1 },    // 下
        { dx: -1, dy: 1 },   // 左下
        { dx: -1, dy: 0 },   // 左
        { dx: -1, dy: -1 }   // 左上
    ];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const currentCost = cells[index];

            if (currentCost >= IMPASSABLE) {
                // 不可通行单元格 - 无方向
                vectors[index] = { x: 0, y: 0 };
                continue;
            }

            if (currentCost === 0) {
                // 目标单元格 - 不需要方向
                vectors[index] = { x: 0, y: 0 };
                continue;
            }

            // 找到积分值最低的邻居
            let bestDir: Vector2 = { x: 0, y: 0 };
            let bestCost = currentCost;

            for (const n of neighbors) {
                const nx = x + n.dx;
                const ny = y + n.dy;

                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

                const neighborCost = cells[ny * width + nx];

                if (neighborCost < bestCost) {
                    bestCost = neighborCost;
                    bestDir = { x: n.dx, y: n.dy };
                }
            }

            // 归一化方向
            const length = Math.sqrt(bestDir.x * bestDir.x + bestDir.y * bestDir.y);
            if (length > 0) {
                vectors[index] = {
                    x: bestDir.x / length,
                    y: bestDir.y / length
                };
            } else {
                vectors[index] = { x: 0, y: 0 };
            }
        }
    }

    return { width, height, vectors };
}
```

## 代码示例

### 完整流场系统

```typescript
class FlowFieldSystem {
    private costField: CostField;
    private integrationField: IntegrationField | null = null;
    private flowField: FlowField | null = null;
    private goalX: number = -1;
    private goalY: number = -1;

    constructor(width: number, height: number) {
        this.costField = createCostField(width, height);
    }

    setCellCost(x: number, y: number, cost: number): void {
        setCost(this.costField, x, y, cost);
        this.invalidate();
    }

    setGoal(x: number, y: number): void {
        this.goalX = x;
        this.goalY = y;
        this.rebuild();
    }

    private invalidate(): void {
        this.integrationField = null;
        this.flowField = null;
    }

    private rebuild(): void {
        if (this.goalX < 0 || this.goalY < 0) return;

        this.integrationField = createIntegrationField(
            this.costField, this.goalX, this.goalY
        );
        this.flowField = createFlowField(this.integrationField);
    }

    getDirection(worldX: number, worldY: number, cellSize: number): Vector2 {
        if (!this.flowField) return { x: 0, y: 0 };

        const cellX = Math.floor(worldX / cellSize);
        const cellY = Math.floor(worldY / cellSize);

        if (cellX < 0 || cellX >= this.flowField.width ||
            cellY < 0 || cellY >= this.flowField.height) {
            return { x: 0, y: 0 };
        }

        return this.flowField.vectors[cellY * this.flowField.width + cellX];
    }

    // 双线性插值以获得更平滑的移动
    getDirectionSmooth(worldX: number, worldY: number, cellSize: number): Vector2 {
        if (!this.flowField) return { x: 0, y: 0 };

        const fx = worldX / cellSize;
        const fy = worldY / cellSize;

        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const tx = fx - x0;
        const ty = fy - y0;

        const getVec = (x: number, y: number): Vector2 => {
            if (x < 0 || x >= this.flowField!.width ||
                y < 0 || y >= this.flowField!.height) {
                return { x: 0, y: 0 };
            }
            return this.flowField!.vectors[y * this.flowField!.width + x];
        };

        const v00 = getVec(x0, y0);
        const v10 = getVec(x1, y0);
        const v01 = getVec(x0, y1);
        const v11 = getVec(x1, y1);

        // 双线性插值
        const topX = v00.x * (1 - tx) + v10.x * tx;
        const topY = v00.y * (1 - tx) + v10.y * tx;
        const bottomX = v01.x * (1 - tx) + v11.x * tx;
        const bottomY = v01.y * (1 - tx) + v11.y * tx;

        return {
            x: topX * (1 - ty) + bottomX * ty,
            y: topY * (1 - ty) + bottomY * ty
        };
    }

    getIntegrationValue(x: number, y: number): number {
        if (!this.integrationField) return IMPASSABLE;
        if (x < 0 || x >= this.integrationField.width ||
            y < 0 || y >= this.integrationField.height) {
            return IMPASSABLE;
        }
        return this.integrationField.cells[y * this.integrationField.width + x];
    }
}
```

### 智能体移动与流场

```typescript
interface Agent {
    x: number;
    y: number;
    vx: number;
    vy: number;
    speed: number;
    radius: number;
}

class FlowFieldAgent {
    private flowFieldSystem: FlowFieldSystem;
    private cellSize: number;

    constructor(flowFieldSystem: FlowFieldSystem, cellSize: number) {
        this.flowFieldSystem = flowFieldSystem;
        this.cellSize = cellSize;
    }

    updateAgent(agent: Agent, deltaTime: number): void {
        // 获取智能体位置的流方向
        const flowDir = this.flowFieldSystem.getDirectionSmooth(
            agent.x, agent.y, this.cellSize
        );

        if (flowDir.x === 0 && flowDir.y === 0) {
            // 在目标或无路径 - 减速
            agent.vx *= 0.9;
            agent.vy *= 0.9;
        } else {
            // 向流方向加速
            const targetVx = flowDir.x * agent.speed;
            const targetVy = flowDir.y * agent.speed;

            // 平滑转向
            const steerStrength = 5.0;
            agent.vx += (targetVx - agent.vx) * steerStrength * deltaTime;
            agent.vy += (targetVy - agent.vy) * steerStrength * deltaTime;
        }

        // 应用速度
        agent.x += agent.vx * deltaTime;
        agent.y += agent.vy * deltaTime;
    }

    updateAgents(agents: Agent[], deltaTime: number): void {
        // 更新所有智能体
        for (const agent of agents) {
            this.updateAgent(agent, deltaTime);
        }

        // 智能体之间的局部避障
        this.resolveCollisions(agents);
    }

    private resolveCollisions(agents: Agent[]): void {
        for (let i = 0; i < agents.length; i++) {
            for (let j = i + 1; j < agents.length; j++) {
                const a = agents[i];
                const b = agents[j];

                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = a.radius + b.radius;

                if (dist < minDist && dist > 0.001) {
                    // 将智能体分开
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    const separation = overlap * 0.5;
                    a.x -= nx * separation;
                    a.y -= ny * separation;
                    b.x += nx * separation;
                    b.y += ny * separation;
                }
            }
        }
    }
}
```

### 分层流场

```typescript
// 对于大型地图，使用多个分辨率级别
class HierarchicalFlowField {
    private levels: FlowFieldSystem[] = [];
    private levelSizes: number[] = [];

    constructor(width: number, height: number, numLevels: number = 3) {
        let w = width;
        let h = height;

        for (let i = 0; i < numLevels; i++) {
            this.levels.push(new FlowFieldSystem(w, h));
            this.levelSizes.push(Math.pow(2, i));
            w = Math.ceil(w / 2);
            h = Math.ceil(h / 2);
        }
    }

    setGoal(x: number, y: number): void {
        for (let i = 0; i < this.levels.length; i++) {
            const scale = this.levelSizes[i];
            this.levels[i].setGoal(
                Math.floor(x / scale),
                Math.floor(y / scale)
            );
        }
    }

    getDirection(worldX: number, worldY: number, cellSize: number): Vector2 {
        // 对远处的单元格使用更粗的级别
        const distToGoal = this.getApproximateDistanceToGoal(worldX, worldY, cellSize);

        // 根据距离选择级别
        let levelIndex = 0;
        if (distToGoal > 50) levelIndex = 1;
        if (distToGoal > 100) levelIndex = 2;
        levelIndex = Math.min(levelIndex, this.levels.length - 1);

        const scale = this.levelSizes[levelIndex];
        return this.levels[levelIndex].getDirection(
            worldX / scale,
            worldY / scale,
            cellSize / scale
        );
    }

    private getApproximateDistanceToGoal(x: number, y: number, cellSize: number): number {
        // 使用最粗的级别进行快速距离估计
        const coarse = this.levels[this.levels.length - 1];
        const scale = this.levelSizes[this.levels.length - 1];
        const value = coarse.getIntegrationValue(
            Math.floor(x / (cellSize * scale)),
            Math.floor(y / (cellSize * scale))
        );
        return value * scale;
    }
}
```

### 基于扇区的流场

```typescript
// 将地图划分为扇区以实现高效的局部更新
interface Sector {
    x: number;
    y: number;
    width: number;
    height: number;
    flowField: FlowField | null;
    dirty: boolean;
}

class SectorFlowField {
    private sectors: Sector[][] = [];
    private sectorSize: number;
    private globalCostField: CostField;
    private goalX: number = -1;
    private goalY: number = -1;

    constructor(width: number, height: number, sectorSize: number = 16) {
        this.sectorSize = sectorSize;
        this.globalCostField = createCostField(width, height);

        const sectorsX = Math.ceil(width / sectorSize);
        const sectorsY = Math.ceil(height / sectorSize);

        for (let sy = 0; sy < sectorsY; sy++) {
            this.sectors[sy] = [];
            for (let sx = 0; sx < sectorsX; sx++) {
                this.sectors[sy][sx] = {
                    x: sx * sectorSize,
                    y: sy * sectorSize,
                    width: Math.min(sectorSize, width - sx * sectorSize),
                    height: Math.min(sectorSize, height - sy * sectorSize),
                    flowField: null,
                    dirty: true
                };
            }
        }
    }

    setCellCost(x: number, y: number, cost: number): void {
        setCost(this.globalCostField, x, y, cost);

        // 将受影响的扇区标记为脏
        const sx = Math.floor(x / this.sectorSize);
        const sy = Math.floor(y / this.sectorSize);
        if (this.sectors[sy] && this.sectors[sy][sx]) {
            this.sectors[sy][sx].dirty = true;
        }
    }

    setGoal(x: number, y: number): void {
        this.goalX = x;
        this.goalY = y;

        // 目标改变时将所有扇区标记为脏
        for (const row of this.sectors) {
            for (const sector of row) {
                sector.dirty = true;
            }
        }
    }

    // 只更新智能体所在的扇区
    updateSectorsNearAgents(agents: Agent[]): void {
        const sectorsToUpdate = new Set<string>();

        for (const agent of agents) {
            const sx = Math.floor(agent.x / this.sectorSize);
            const sy = Math.floor(agent.y / this.sectorSize);

            // 添加周围的扇区
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    sectorsToUpdate.add(`${sx + dx},${sy + dy}`);
                }
            }
        }

        for (const key of sectorsToUpdate) {
            const [sx, sy] = key.split(',').map(Number);
            this.updateSector(sx, sy);
        }
    }

    private updateSector(sx: number, sy: number): void {
        if (!this.sectors[sy] || !this.sectors[sy][sx]) return;

        const sector = this.sectors[sy][sx];
        if (!sector.dirty) return;

        // 为此扇区构建积分和流场
        // 实际中，你需要考虑到其他扇区的传送门连接
        const integration = createIntegrationField(
            this.globalCostField, this.goalX, this.goalY
        );
        sector.flowField = createFlowField(integration);
        sector.dirty = false;
    }

    getDirection(worldX: number, worldY: number, cellSize: number): Vector2 {
        const sx = Math.floor(worldX / this.sectorSize / cellSize);
        const sy = Math.floor(worldY / this.sectorSize / cellSize);

        if (!this.sectors[sy] || !this.sectors[sy][sx]) {
            return { x: 0, y: 0 };
        }

        const sector = this.sectors[sy][sx];
        if (!sector.flowField) {
            this.updateSector(sx, sy);
        }

        if (!sector.flowField) return { x: 0, y: 0 };

        const localX = Math.floor(worldX / cellSize) - sector.x;
        const localY = Math.floor(worldY / cellSize) - sector.y;

        if (localX < 0 || localX >= sector.width ||
            localY < 0 || localY >= sector.height) {
            return { x: 0, y: 0 };
        }

        return sector.flowField.vectors[localY * sector.width + localX];
    }
}
```

### Unity 实现

```csharp
using UnityEngine;
using System.Collections.Generic;

public class FlowFieldManager : MonoBehaviour
{
    [Header("网格设置")]
    public int gridWidth = 50;
    public int gridHeight = 50;
    public float cellSize = 1.0f;

    [Header("调试")]
    public bool showDebug = true;
    public float arrowSize = 0.5f;

    private byte[] costField;
    private ushort[] integrationField;
    private Vector2[] flowField;

    private Vector2Int goalCell = new Vector2Int(-1, -1);

    void Awake()
    {
        costField = new byte[gridWidth * gridHeight];
        integrationField = new ushort[gridWidth * gridHeight];
        flowField = new Vector2[gridWidth * gridHeight];

        // 初始化代价场（1 = 正常）
        for (int i = 0; i < costField.Length; i++)
        {
            costField[i] = 1;
        }
    }

    public void SetObstacle(int x, int y)
    {
        if (IsValidCell(x, y))
        {
            costField[y * gridWidth + x] = 255;
        }
    }

    public void SetGoal(Vector3 worldPosition)
    {
        Vector2Int cell = WorldToCell(worldPosition);
        if (IsValidCell(cell.x, cell.y))
        {
            goalCell = cell;
            RebuildFlowField();
        }
    }

    public Vector2 GetFlowDirection(Vector3 worldPosition)
    {
        Vector2Int cell = WorldToCell(worldPosition);
        if (!IsValidCell(cell.x, cell.y))
        {
            return Vector2.zero;
        }
        return flowField[cell.y * gridWidth + cell.x];
    }

    public Vector2 GetFlowDirectionSmooth(Vector3 worldPosition)
    {
        float fx = worldPosition.x / cellSize;
        float fz = worldPosition.z / cellSize;

        int x0 = Mathf.FloorToInt(fx);
        int z0 = Mathf.FloorToInt(fz);

        float tx = fx - x0;
        float tz = fz - z0;

        Vector2 v00 = GetFlowAt(x0, z0);
        Vector2 v10 = GetFlowAt(x0 + 1, z0);
        Vector2 v01 = GetFlowAt(x0, z0 + 1);
        Vector2 v11 = GetFlowAt(x0 + 1, z0 + 1);

        Vector2 top = Vector2.Lerp(v00, v10, tx);
        Vector2 bottom = Vector2.Lerp(v01, v11, tx);

        return Vector2.Lerp(top, bottom, tz);
    }

    private Vector2 GetFlowAt(int x, int y)
    {
        if (!IsValidCell(x, y)) return Vector2.zero;
        return flowField[y * gridWidth + x];
    }

    private void RebuildFlowField()
    {
        // 重置积分场
        for (int i = 0; i < integrationField.Length; i++)
        {
            integrationField[i] = ushort.MaxValue;
        }

        // 从目标开始的 Dijkstra
        Queue<Vector2Int> openList = new Queue<Vector2Int>();
        integrationField[goalCell.y * gridWidth + goalCell.x] = 0;
        openList.Enqueue(goalCell);

        int[] dx = { 0, 1, 0, -1, 1, 1, -1, -1 };
        int[] dy = { -1, 0, 1, 0, -1, 1, 1, -1 };
        float[] costs = { 1, 1, 1, 1, 1.414f, 1.414f, 1.414f, 1.414f };

        while (openList.Count > 0)
        {
            Vector2Int current = openList.Dequeue();
            int currentCost = integrationField[current.y * gridWidth + current.x];

            for (int i = 0; i < 8; i++)
            {
                int nx = current.x + dx[i];
                int ny = current.y + dy[i];

                if (!IsValidCell(nx, ny)) continue;

                byte cellCost = costField[ny * gridWidth + nx];
                if (cellCost >= 255) continue;

                // 检查对角的角落切割
                if (i >= 4)
                {
                    if (costField[current.y * gridWidth + nx] >= 255 ||
                        costField[ny * gridWidth + current.x] >= 255)
                    {
                        continue;
                    }
                }

                int newCost = currentCost + Mathf.RoundToInt(cellCost * costs[i]);
                int neighborIndex = ny * gridWidth + nx;

                if (newCost < integrationField[neighborIndex])
                {
                    integrationField[neighborIndex] = (ushort)newCost;
                    openList.Enqueue(new Vector2Int(nx, ny));
                }
            }
        }

        // 构建流场
        for (int y = 0; y < gridHeight; y++)
        {
            for (int x = 0; x < gridWidth; x++)
            {
                int index = y * gridWidth + x;

                if (integrationField[index] >= ushort.MaxValue)
                {
                    flowField[index] = Vector2.zero;
                    continue;
                }

                if (integrationField[index] == 0)
                {
                    flowField[index] = Vector2.zero;
                    continue;
                }

                // 找到最低的邻居
                Vector2 bestDir = Vector2.zero;
                int bestCost = integrationField[index];

                for (int i = 0; i < 8; i++)
                {
                    int nx = x + dx[i];
                    int ny = y + dy[i];

                    if (!IsValidCell(nx, ny)) continue;

                    int neighborCost = integrationField[ny * gridWidth + nx];
                    if (neighborCost < bestCost)
                    {
                        bestCost = neighborCost;
                        bestDir = new Vector2(dx[i], dy[i]);
                    }
                }

                flowField[index] = bestDir.normalized;
            }
        }
    }

    private bool IsValidCell(int x, int y)
    {
        return x >= 0 && x < gridWidth && y >= 0 && y < gridHeight;
    }

    private Vector2Int WorldToCell(Vector3 worldPos)
    {
        return new Vector2Int(
            Mathf.FloorToInt(worldPos.x / cellSize),
            Mathf.FloorToInt(worldPos.z / cellSize)
        );
    }

    private Vector3 CellToWorld(int x, int y)
    {
        return new Vector3(
            (x + 0.5f) * cellSize,
            0,
            (y + 0.5f) * cellSize
        );
    }

    void OnDrawGizmos()
    {
        if (!showDebug || flowField == null) return;

        for (int y = 0; y < gridHeight; y++)
        {
            for (int x = 0; x < gridWidth; x++)
            {
                int index = y * gridWidth + x;
                Vector3 cellCenter = CellToWorld(x, y);

                // 绘制单元格
                if (costField != null && costField[index] >= 255)
                {
                    Gizmos.color = Color.black;
                    Gizmos.DrawCube(cellCenter, Vector3.one * cellSize * 0.9f);
                }

                // 绘制流方向
                Vector2 flow = flowField[index];
                if (flow.magnitude > 0.01f)
                {
                    Gizmos.color = Color.blue;
                    Vector3 from = cellCenter;
                    Vector3 to = cellCenter + new Vector3(flow.x, 0, flow.y) * arrowSize;
                    Gizmos.DrawLine(from, to);

                    // 箭头
                    Vector3 dir = (to - from).normalized;
                    Vector3 right = Vector3.Cross(Vector3.up, dir) * 0.2f * arrowSize;
                    Gizmos.DrawLine(to, to - dir * 0.3f * arrowSize + right);
                    Gizmos.DrawLine(to, to - dir * 0.3f * arrowSize - right);
                }
            }
        }

        // 绘制目标
        if (goalCell.x >= 0 && goalCell.y >= 0)
        {
            Gizmos.color = Color.green;
            Gizmos.DrawSphere(CellToWorld(goalCell.x, goalCell.y), cellSize * 0.3f);
        }
    }
}
```

## 最佳实践

### 1. 优化积分场生成

```typescript
// 使用适当的优先队列来实现 Dijkstra 算法
class PriorityQueue<T> {
    private items: { item: T; priority: number }[] = [];

    enqueue(item: T, priority: number): void {
        const newNode = { item, priority };
        let added = false;

        for (let i = 0; i < this.items.length; i++) {
            if (newNode.priority < this.items[i].priority) {
                this.items.splice(i, 0, newNode);
                added = true;
                break;
            }
        }

        if (!added) {
            this.items.push(newNode);
        }
    }

    dequeue(): T | undefined {
        return this.items.shift()?.item;
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }
}
```

### 2. 缓存静态目标的流场

```typescript
class FlowFieldCache {
    private cache: Map<string, FlowField> = new Map();

    getOrCreate(goalX: number, goalY: number,
                costField: CostField): FlowField {
        const key = `${goalX},${goalY}`;

        if (!this.cache.has(key)) {
            const integration = createIntegrationField(costField, goalX, goalY);
            const flow = createFlowField(integration);
            this.cache.set(key, flow);
        }

        return this.cache.get(key)!;
    }

    invalidate(): void {
        this.cache.clear();
    }

    invalidateGoal(goalX: number, goalY: number): void {
        this.cache.delete(`${goalX},${goalY}`);
    }
}
```

### 3. 将计算分散到多帧

```typescript
class AsyncFlowFieldBuilder {
    private integrationQueue: Array<{x: number, y: number, cost: number}> = [];
    private maxIterationsPerFrame: number = 1000;
    private isBuilding: boolean = false;

    startBuilding(costField: CostField, goalX: number, goalY: number,
                  onComplete: (field: FlowField) => void): void {
        this.isBuilding = true;
        this.integrationQueue = [{ x: goalX, y: goalY, cost: 0 }];

        // 存储状态用于增量处理
        // ... 实现类似 createIntegrationField
        // 但每次更新处理 maxIterationsPerFrame
    }

    update(): void {
        if (!this.isBuilding) return;

        let iterations = 0;
        while (this.integrationQueue.length > 0 &&
               iterations < this.maxIterationsPerFrame) {
            // 处理一个单元格
            // ...
            iterations++;
        }

        if (this.integrationQueue.length === 0) {
            // 完成 - 构建流场
            this.isBuilding = false;
        }
    }
}
```

## 常见陷阱

### 陷阱 1: 角落切割

```typescript
// 不好: 智能体穿过对角墙
// 检查对角邻居时，如果相邻的基本方向被阻挡则不允许

// 好: 阻止通过角落的对角移动
if (isDiagonal) {
    const cardinalA = getCost(field, current.x + n.dx, current.y);
    const cardinalB = getCost(field, current.x, current.y + n.dy);
    if (cardinalA >= 255 || cardinalB >= 255) {
        continue;  // 不允许这个对角
    }
}
```

### 陷阱 2: 过期的流场

```typescript
// 不好: 障碍物改变时未使流场失效
setCellCost(x, y, 255);  // 添加障碍物但流场未更新

// 好: 需要时使其失效并重建
setCellCost(x, y, 255);
invalidateFlowField();
// 懒惰重建或立即重建
```

### 陷阱 3: 单元格查找不正确

```typescript
// 不好: 使用截断可能会偏差一个
const cellX = Math.trunc(worldX / cellSize);

// 好: 使用 floor 进行一致的单元格查找
const cellX = Math.floor(worldX / cellSize);
```

## 性能考量

### 内存使用

```
对于 100x100 网格:
- 代价场: 10,000 字节（每单元格 1 字节）
- 积分场: 20,000 字节（每单元格 2 字节）
- 流场: 80,000 字节（2 个浮点数 x 每单元格 4 字节）
总计: 每个流场约 110 KB

优化: 使用压缩方向（8 个方向 = 3 位）
```

### 计算时间

```
流场生成是 O(n * log(n))，其中 n = 网格单元格数
- 50x50 网格: ~5ms
- 100x100 网格: ~20ms
- 200x200 网格: ~100ms

策略:
- 对大型地图使用分层/基于扇区的方法
- 将计算分散到多帧
- 缓存静态目标的流场
- 使用计算着色器进行 GPU 加速
```

## 面试要点

### 常见面试问题

**Q1: 流场相比 A* 对多智能体有什么优势？**

A* 为每个智能体计算单独的路径，导致 O(n * 寻路代价) 复杂度。流场计算一次后所有智能体使用同一场，无论智能体数量多少，每个智能体都是 O(1) 查询。

**Q2: 如何处理流场中的动态障碍物？**

选项包括：1）完全重建（简单但慢），2）基于扇区的更新（只重建受影响的扇区），3）局部修改（只更新附近的单元格），4）混合方法，对动态障碍物使用 A*。

**Q3: 流场系统中的三种场是什么？**

1. 代价场：每个单元格的基础穿越代价
2. 积分场：单元格到目的地的总代价（使用 Dijkstra 构建）
3. 流场：指向目的地的方向向量

**Q4: 如何使智能体移动更平滑？**

采样流场时使用双线性插值，与转向行为结合，应用速度平滑/阻尼，并在智能体之间使用局部避障。

**Q5: 什么时候 A* 比流场更好？**

A* 在以下情况更好：少量智能体有不同目的地，目标频繁变化，非常大的稀疏地图，或路径需要因智能体而异（不同单位大小）。

## 延伸阅读

### 文章和论文

- "Continuum Crowds" by Adrien Treuille 等
- "Crowd Pathfinding and Steering Using Flow Field Tiles"
- "Real-Time Crowd Simulation Using Flow Fields"

### 游戏开发资源

- Elijah Emerson 的流场教程系列
- Red Blob Games - 流场寻路
- Gamasutra - 群体寻路文章

### 相关主题

- 势场
- 导航网格 (NavMesh)
- 转向行为
- A* 和 Dijkstra 算法
- 智能体碰撞的空间哈希
