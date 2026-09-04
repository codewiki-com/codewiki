---
title: A* 寻路算法详解
description: 掌握游戏AI寻路核心算法：A*、Dijkstra和启发式函数设计
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - 寻路
  - A*
  - 算法
  - 游戏AI
status: imported
origin: old/src/content/docs/gamedev/pathfinding-astar.zh.md
divergence: 0.239
issues: []
legacy:
  category: GameDev
  subcategory: AI
  order: 17
  lastUpdated: 2026-01-07
---

寻路算法是游戏开发中最核心的 AI 技术之一。无论是 RTS 游戏中的单位移动、RPG 游戏中的 NPC 导航，还是塔防游戏中的敌人行进路线，都离不开高效的寻路算法。本文将深入讲解图搜索基础、Dijkstra 算法、A* 算法原理及其优化技术。

## 图搜索基础

### 什么是寻路问题

寻路问题本质上是在一个图（Graph）中找到从起点到终点的最优路径。在游戏开发中，这个"图"通常是：

- **网格地图（Grid Map）**：将游戏世界划分为规则的格子
- **路点图（Waypoint Graph）**：在地图上设置关键点并连接
- **导航网格（Navigation Mesh）**：将可行走区域划分为多边形

### 图的基本概念

```typescript
// 图的节点表示
interface Node {
  id: string;
  x: number;
  y: number;
  walkable: boolean;  // 是否可通行
}

// 图的边表示
interface Edge {
  from: Node;
  to: Node;
  cost: number;  // 移动代价
}

// 简单的网格地图类
class GridMap {
  private grid: Node[][];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = this.initializeGrid();
  }

  private initializeGrid(): Node[][] {
    const grid: Node[][] = [];
    for (let y = 0; y < this.height; y++) {
      grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        grid[y][x] = {
          id: `${x},${y}`,
          x,
          y,
          walkable: true
        };
      }
    }
    return grid;
  }

  getNode(x: number, y: number): Node | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.grid[y][x];
  }

  // 获取相邻节点（4方向或8方向）
  getNeighbors(node: Node, allowDiagonal: boolean = true): Node[] {
    const neighbors: Node[] = [];
    const directions = allowDiagonal
      ? [[-1,-1], [0,-1], [1,-1], [-1,0], [1,0], [-1,1], [0,1], [1,1]]
      : [[0,-1], [-1,0], [1,0], [0,1]];

    for (const [dx, dy] of directions) {
      const neighbor = this.getNode(node.x + dx, node.y + dy);
      if (neighbor && neighbor.walkable) {
        // 对角线移动时检查是否被阻挡
        if (dx !== 0 && dy !== 0) {
          const horizontal = this.getNode(node.x + dx, node.y);
          const vertical = this.getNode(node.x, node.y + dy);
          if (!horizontal?.walkable || !vertical?.walkable) {
            continue;  // 不能穿过墙角
          }
        }
        neighbors.push(neighbor);
      }
    }
    return neighbors;
  }

  setWalkable(x: number, y: number, walkable: boolean): void {
    const node = this.getNode(x, y);
    if (node) {
      node.walkable = walkable;
    }
  }
}
```

### 搜索算法分类

| 算法类型 | 代表算法 | 特点 | 适用场景 |
|---------|---------|------|---------|
| 盲目搜索 | BFS、DFS | 不使用启发信息 | 小规模搜索 |
| 启发式搜索 | A*、贪婪最佳优先 | 使用启发函数引导 | 大规模寻路 |
| 增量搜索 | D*、LPA* | 支持动态更新 | 环境变化频繁 |
| 任意角度 | Theta*、ANYA | 非格点路径 | 平滑路径需求 |

## 广度优先搜索（BFS）

在学习 A* 之前，先理解最基础的图搜索算法 BFS。

### BFS 原理

BFS 从起点开始，逐层向外扩展搜索，保证找到的路径是步数最少的。

```typescript
interface SearchResult {
  path: Node[];
  visitedCount: number;
  found: boolean;
}

function bfs(map: GridMap, start: Node, goal: Node): SearchResult {
  const queue: Node[] = [start];
  const visited = new Set<string>();
  const cameFrom = new Map<string, Node | null>();

  visited.add(start.id);
  cameFrom.set(start.id, null);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // 找到目标
    if (current.id === goal.id) {
      return {
        path: reconstructPath(cameFrom, current),
        visitedCount: visited.size,
        found: true
      };
    }

    // 扩展相邻节点
    for (const neighbor of map.getNeighbors(current)) {
      if (!visited.has(neighbor.id)) {
        visited.add(neighbor.id);
        cameFrom.set(neighbor.id, current);
        queue.push(neighbor);
      }
    }
  }

  return { path: [], visitedCount: visited.size, found: false };
}

// 从目标回溯重建路径
function reconstructPath(cameFrom: Map<string, Node | null>, current: Node): Node[] {
  const path: Node[] = [current];
  while (cameFrom.get(current.id) !== null) {
    current = cameFrom.get(current.id)!;
    path.unshift(current);
  }
  return path;
}
```

### BFS 的局限性

- **不考虑边的代价**：所有移动代价视为相等
- **搜索效率低**：向所有方向均匀扩展，没有方向性
- **内存占用大**：需要存储所有已访问节点

## Dijkstra 算法

Dijkstra 算法是处理带权图最短路径的经典算法，是 A* 的重要基础。

### 算法原理

Dijkstra 算法维护一个从起点到各节点的最短距离，每次选择距离最小的未处理节点进行扩展。

**核心思想**：
1. 初始化起点距离为 0，其他节点距离为无穷大
2. 选择距离最小的未处理节点
3. 更新其邻居节点的距离
4. 重复直到找到目标或处理完所有节点

### TypeScript 实现

```typescript
// 优先队列实现（最小堆）
class PriorityQueue<T> {
  private heap: { item: T; priority: number }[] = [];

  enqueue(item: T, priority: number): void {
    this.heap.push({ item, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const result = this.heap[0].item;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return result;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].priority <= this.heap[index].priority) break;
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < this.heap.length &&
          this.heap[leftChild].priority < this.heap[smallest].priority) {
        smallest = leftChild;
      }
      if (rightChild < this.heap.length &&
          this.heap[rightChild].priority < this.heap[smallest].priority) {
        smallest = rightChild;
      }
      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}

// Dijkstra 算法实现
function dijkstra(map: GridMap, start: Node, goal: Node): SearchResult {
  const openSet = new PriorityQueue<Node>();
  const gScore = new Map<string, number>();  // 从起点到当前节点的实际代价
  const cameFrom = new Map<string, Node | null>();
  const closedSet = new Set<string>();

  gScore.set(start.id, 0);
  cameFrom.set(start.id, null);
  openSet.enqueue(start, 0);

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue()!;

    // 跳过已处理的节点
    if (closedSet.has(current.id)) continue;
    closedSet.add(current.id);

    // 找到目标
    if (current.id === goal.id) {
      return {
        path: reconstructPath(cameFrom, current),
        visitedCount: closedSet.size,
        found: true
      };
    }

    // 扩展邻居
    for (const neighbor of map.getNeighbors(current)) {
      if (closedSet.has(neighbor.id)) continue;

      // 计算移动代价（对角线移动代价为 1.414）
      const moveCost = (neighbor.x !== current.x && neighbor.y !== current.y)
        ? Math.SQRT2
        : 1;
      const tentativeG = gScore.get(current.id)! + moveCost;

      if (!gScore.has(neighbor.id) || tentativeG < gScore.get(neighbor.id)!) {
        gScore.set(neighbor.id, tentativeG);
        cameFrom.set(neighbor.id, current);
        openSet.enqueue(neighbor, tentativeG);
      }
    }
  }

  return { path: [], visitedCount: closedSet.size, found: false };
}
```

### Dijkstra 的特点

**优点**：
- 保证找到最短路径
- 适用于任意非负权重的图
- 实现相对简单

**缺点**：
- 向所有方向均匀扩展，效率不如 A*
- 不适合负权边的图
- 大规模地图时性能较差

## A* 算法原理

A* 算法是游戏开发中最常用的寻路算法，它在 Dijkstra 的基础上加入了启发式函数，大大提高了搜索效率。

### 核心公式

A* 算法的核心是评估函数：

$$f(n) = g(n) + h(n)$$

- **f(n)**：节点 n 的综合评估值
- **g(n)**：从起点到节点 n 的实际代价
- **h(n)**：从节点 n 到终点的估计代价（启发式函数）

### 开放列表与关闭列表

A* 算法使用两个重要的数据结构：

- **开放列表（Open List）**：待检查的节点，通常用优先队列实现
- **关闭列表（Closed List）**：已检查的节点，用于避免重复处理

```
算法流程：
1. 将起点加入开放列表
2. 循环：
   a. 从开放列表取出 f 值最小的节点作为当前节点
   b. 如果当前节点是目标，重建路径并返回
   c. 将当前节点移入关闭列表
   d. 遍历当前节点的邻居：
      - 如果邻居在关闭列表中，跳过
      - 计算邻居的 g、h、f 值
      - 如果邻居不在开放列表，加入开放列表
      - 如果邻居已在开放列表且新路径更优，更新其值
3. 开放列表为空时，表示无路径
```

### 完整 TypeScript 实现

```typescript
interface AStarNode extends Node {
  g: number;  // 从起点到当前节点的代价
  h: number;  // 从当前节点到终点的估计代价
  f: number;  // g + h
  parent: AStarNode | null;
}

type HeuristicFunction = (a: Node, b: Node) => number;

class AStar {
  private map: GridMap;
  private heuristic: HeuristicFunction;
  private allowDiagonal: boolean;

  constructor(
    map: GridMap,
    heuristic: HeuristicFunction = AStar.manhattanDistance,
    allowDiagonal: boolean = true
  ) {
    this.map = map;
    this.heuristic = heuristic;
    this.allowDiagonal = allowDiagonal;
  }

  // 曼哈顿距离（适用于4方向移动）
  static manhattanDistance(a: Node, b: Node): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  // 欧几里得距离（适用于任意方向移动）
  static euclideanDistance(a: Node, b: Node): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // 切比雪夫距离（适用于8方向移动，对角代价为1）
  static chebyshevDistance(a: Node, b: Node): number {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  }

  // 八方向距离（对角代价为sqrt(2)）
  static octileDistance(a: Node, b: Node): number {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
  }

  findPath(startNode: Node, goalNode: Node): SearchResult {
    const openSet = new PriorityQueue<AStarNode>();
    const openSetIds = new Set<string>();
    const closedSet = new Set<string>();
    const nodeMap = new Map<string, AStarNode>();

    // 创建起点的 A* 节点
    const start: AStarNode = {
      ...startNode,
      g: 0,
      h: this.heuristic(startNode, goalNode),
      f: 0,
      parent: null
    };
    start.f = start.g + start.h;

    openSet.enqueue(start, start.f);
    openSetIds.add(start.id);
    nodeMap.set(start.id, start);

    while (!openSet.isEmpty()) {
      const current = openSet.dequeue()!;

      // 从开放列表移除
      openSetIds.delete(current.id);

      // 如果已经处理过，跳过
      if (closedSet.has(current.id)) continue;

      // 加入关闭列表
      closedSet.add(current.id);

      // 找到目标
      if (current.id === goalNode.id) {
        return {
          path: this.reconstructPath(current),
          visitedCount: closedSet.size,
          found: true
        };
      }

      // 遍历邻居
      for (const neighborNode of this.map.getNeighbors(current, this.allowDiagonal)) {
        if (closedSet.has(neighborNode.id)) continue;

        // 计算移动代价
        const isDiagonal = neighborNode.x !== current.x && neighborNode.y !== current.y;
        const moveCost = isDiagonal ? Math.SQRT2 : 1;
        const tentativeG = current.g + moveCost;

        let neighbor = nodeMap.get(neighborNode.id);

        if (!neighbor) {
          // 新节点
          neighbor = {
            ...neighborNode,
            g: tentativeG,
            h: this.heuristic(neighborNode, goalNode),
            f: 0,
            parent: current
          };
          neighbor.f = neighbor.g + neighbor.h;
          nodeMap.set(neighbor.id, neighbor);
          openSet.enqueue(neighbor, neighbor.f);
          openSetIds.add(neighbor.id);
        } else if (tentativeG < neighbor.g) {
          // 找到更优路径
          neighbor.g = tentativeG;
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;
          // 重新加入优先队列（旧的会在取出时被跳过）
          openSet.enqueue(neighbor, neighbor.f);
        }
      }
    }

    return { path: [], visitedCount: closedSet.size, found: false };
  }

  private reconstructPath(node: AStarNode): Node[] {
    const path: Node[] = [];
    let current: AStarNode | null = node;
    while (current !== null) {
      path.unshift({
        id: current.id,
        x: current.x,
        y: current.y,
        walkable: current.walkable
      });
      current = current.parent;
    }
    return path;
  }
}

// 使用示例
const map = new GridMap(20, 20);

// 设置障碍物
for (let i = 5; i < 15; i++) {
  map.setWalkable(10, i, false);
}

const astar = new AStar(map, AStar.octileDistance, true);
const startNode = map.getNode(0, 0)!;
const goalNode = map.getNode(19, 19)!;

const result = astar.findPath(startNode, goalNode);
console.log(`找到路径: ${result.found}`);
console.log(`路径长度: ${result.path.length}`);
console.log(`访问节点数: ${result.visitedCount}`);
```

## 启发式函数设计

启发式函数的选择对 A* 的性能和正确性至关重要。

### 可容许性与一致性

**可容许性（Admissibility）**：启发式函数永远不会高估实际代价。
$$h(n) \leq h^*(n)$$

其中 $h^*(n)$ 是从 n 到目标的实际最短距离。可容许的启发式保证 A* 找到最优解。

**一致性（Consistency）**：对于任意节点 n 和其邻居 n'：
$$h(n) \leq cost(n, n') + h(n')$$

一致性意味着可容许性，且能保证更高效的搜索。

### 常用启发式函数比较

```typescript
class HeuristicFunctions {
  // 曼哈顿距离
  // 适用场景：4方向移动，不允许对角线
  // 特点：可容许、一致
  static manhattan(a: Node, b: Node): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  // 欧几里得距离
  // 适用场景：任意方向移动
  // 特点：可容许，但在网格中可能低估，导致搜索更多节点
  static euclidean(a: Node, b: Node): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // 八方向距离（Octile Distance）
  // 适用场景：8方向移动，对角线代价为 sqrt(2)
  // 特点：精确估计，最优选择
  static octile(a: Node, b: Node): number {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    // 直线移动代价为1，对角线为sqrt(2)
    // 等价于: min(dx, dy) * sqrt(2) + |dx - dy| * 1
    return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
  }

  // 切比雪夫距离
  // 适用场景：8方向移动，所有方向代价相同
  // 特点：当对角线代价为1时使用
  static chebyshev(a: Node, b: Node): number {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  }

  // 加权启发式
  // w > 1 时搜索更快但可能非最优
  // w = 1 时等价于标准 A*
  static weighted(base: HeuristicFunction, weight: number): HeuristicFunction {
    return (a: Node, b: Node) => base(a, b) * weight;
  }

  // 打破平局（Tie-breaking）
  // 当多个节点 f 值相同时，优先选择更接近目标的
  static withTieBreaking(
    base: HeuristicFunction,
    start: Node,
    goal: Node
  ): HeuristicFunction {
    // 计算从起点到终点的向量
    const dx1 = goal.x - start.x;
    const dy1 = goal.y - start.y;

    return (a: Node, b: Node) => {
      const h = base(a, b);
      // 计算当前节点到起点-终点连线的偏离
      const dx2 = a.x - start.x;
      const dy2 = a.y - start.y;
      const cross = Math.abs(dx1 * dy2 - dx2 * dy1);
      // 添加微小的偏差
      return h + cross * 0.001;
    };
  }
}
```

### 启发式函数选择指南

| 移动方式 | 推荐启发式 | 原因 |
|---------|----------|------|
| 4方向（上下左右） | 曼哈顿距离 | 精确估计 |
| 8方向（含对角线，代价sqrt(2)） | Octile距离 | 精确估计 |
| 8方向（含对角线，代价1） | 切比雪夫距离 | 精确估计 |
| 任意角度移动 | 欧几里得距离 | 最自然的距离度量 |

## 路径平滑

A* 生成的路径通常是"锯齿状"的，在实际游戏中需要进行平滑处理。

### 简单路径平滑

```typescript
class PathSmoother {
  private map: GridMap;

  constructor(map: GridMap) {
    this.map = map;
  }

  // 视线检测：检查两点之间是否有障碍
  private hasLineOfSight(a: Node, b: Node): boolean {
    let x0 = a.x;
    let y0 = a.y;
    const x1 = b.x;
    const y1 = b.y;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      const node = this.map.getNode(x0, y0);
      if (!node || !node.walkable) {
        return false;
      }

      if (x0 === x1 && y0 === y1) {
        return true;
      }

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  // 简单路径平滑：移除不必要的中间点
  smoothPath(path: Node[]): Node[] {
    if (path.length <= 2) return path;

    const smoothed: Node[] = [path[0]];
    let current = 0;

    while (current < path.length - 1) {
      let furthest = current + 1;

      // 找到能直接到达的最远点
      for (let i = path.length - 1; i > current + 1; i--) {
        if (this.hasLineOfSight(path[current], path[i])) {
          furthest = i;
          break;
        }
      }

      smoothed.push(path[furthest]);
      current = furthest;
    }

    return smoothed;
  }

  // Catmull-Rom 样条插值：生成平滑曲线
  catmullRomSmooth(path: Node[], segments: number = 10): { x: number; y: number }[] {
    if (path.length < 2) return path.map(n => ({ x: n.x, y: n.y }));

    const result: { x: number; y: number }[] = [];

    // 扩展路径以处理边界
    const extended = [
      path[0],
      ...path,
      path[path.length - 1]
    ];

    for (let i = 1; i < extended.length - 2; i++) {
      const p0 = extended[i - 1];
      const p1 = extended[i];
      const p2 = extended[i + 1];
      const p3 = extended[i + 2];

      for (let t = 0; t < segments; t++) {
        const s = t / segments;
        const s2 = s * s;
        const s3 = s2 * s;

        // Catmull-Rom 公式
        const x = 0.5 * (
          2 * p1.x +
          (-p0.x + p2.x) * s +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * s2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * s3
        );

        const y = 0.5 * (
          2 * p1.y +
          (-p0.y + p2.y) * s +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * s2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * s3
        );

        result.push({ x, y });
      }
    }

    // 添加最后一个点
    result.push({ x: path[path.length - 1].x, y: path[path.length - 1].y });

    return result;
  }
}
```

### 漏斗算法（Funnel Algorithm）

漏斗算法是导航网格中常用的路径平滑方法：

```typescript
interface Portal {
  left: { x: number; y: number };
  right: { x: number; y: number };
}

function funnelSmooth(
  start: { x: number; y: number },
  goal: { x: number; y: number },
  portals: Portal[]
): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [start];

  let apex = start;
  let leftIndex = 0;
  let rightIndex = 0;
  let portalLeft = start;
  let portalRight = start;

  // 向量叉积，用于判断点在向量的哪一侧
  function cross(o: { x: number; y: number },
                 a: { x: number; y: number },
                 b: { x: number; y: number }): number {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  for (let i = 0; i < portals.length; i++) {
    const left = portals[i].left;
    const right = portals[i].right;

    // 收紧右边界
    if (cross(apex, portalRight, right) <= 0) {
      if (apex === portalRight || cross(apex, portalLeft, right) > 0) {
        portalRight = right;
        rightIndex = i;
      } else {
        // 右边界越过了左边界，添加左顶点
        path.push(portalLeft);
        apex = portalLeft;
        leftIndex = leftIndex;
        portalLeft = apex;
        portalRight = apex;
        i = leftIndex;
        continue;
      }
    }

    // 收紧左边界
    if (cross(apex, portalLeft, left) >= 0) {
      if (apex === portalLeft || cross(apex, portalRight, left) < 0) {
        portalLeft = left;
        leftIndex = i;
      } else {
        // 左边界越过了右边界，添加右顶点
        path.push(portalRight);
        apex = portalRight;
        rightIndex = rightIndex;
        portalLeft = apex;
        portalRight = apex;
        i = rightIndex;
        continue;
      }
    }
  }

  path.push(goal);
  return path;
}
```

## Jump Point Search（JPS）

JPS 是 A* 的重要优化算法，可以显著减少需要扩展的节点数量。

### JPS 原理

JPS 的核心思想是：在均匀代价的网格中，许多路径是对称等价的。JPS 通过"跳跃"来跳过这些对称路径，只在"跳点"处进行搜索。

**跳点的定义**：
1. 目标节点
2. 强制邻居存在的节点
3. 在某个方向上能到达跳点的节点

### JPS 实现

```typescript
class JumpPointSearch {
  private map: GridMap;

  constructor(map: GridMap) {
    this.map = map;
  }

  // 判断节点是否可通行
  private isWalkable(x: number, y: number): boolean {
    const node = this.map.getNode(x, y);
    return node !== null && node.walkable;
  }

  // 在指定方向上跳跃，寻找跳点
  private jump(
    x: number,
    y: number,
    dx: number,
    dy: number,
    goal: Node
  ): Node | null {
    const nx = x + dx;
    const ny = y + dy;

    // 超出边界或不可通行
    if (!this.isWalkable(nx, ny)) {
      return null;
    }

    // 到达目标
    if (nx === goal.x && ny === goal.y) {
      return this.map.getNode(nx, ny);
    }

    // 检查强制邻居
    if (dx !== 0 && dy !== 0) {
      // 对角线方向
      // 检查是否有强制邻居
      if ((!this.isWalkable(x - dx, y) && this.isWalkable(x - dx, y + dy)) ||
          (!this.isWalkable(x, y - dy) && this.isWalkable(x + dx, y - dy))) {
        return this.map.getNode(nx, ny);
      }

      // 对角线方向需要检查水平和垂直方向
      if (this.jump(nx, ny, dx, 0, goal) !== null ||
          this.jump(nx, ny, 0, dy, goal) !== null) {
        return this.map.getNode(nx, ny);
      }
    } else {
      // 水平或垂直方向
      if (dx !== 0) {
        // 水平方向
        if ((!this.isWalkable(x, y - 1) && this.isWalkable(nx, y - 1)) ||
            (!this.isWalkable(x, y + 1) && this.isWalkable(nx, y + 1))) {
          return this.map.getNode(nx, ny);
        }
      } else {
        // 垂直方向
        if ((!this.isWalkable(x - 1, y) && this.isWalkable(x - 1, ny)) ||
            (!this.isWalkable(x + 1, y) && this.isWalkable(x + 1, ny))) {
          return this.map.getNode(nx, ny);
        }
      }
    }

    // 继续跳跃
    return this.jump(nx, ny, dx, dy, goal);
  }

  // 获取当前节点的后继跳点
  private getSuccessors(
    node: AStarNode,
    goal: Node
  ): { node: Node; dx: number; dy: number }[] {
    const successors: { node: Node; dx: number; dy: number }[] = [];
    const neighbors = this.pruneNeighbors(node);

    for (const { dx, dy } of neighbors) {
      const jumpPoint = this.jump(node.x, node.y, dx, dy, goal);
      if (jumpPoint) {
        successors.push({ node: jumpPoint, dx, dy });
      }
    }

    return successors;
  }

  // 裁剪邻居：基于父节点方向
  private pruneNeighbors(node: AStarNode): { dx: number; dy: number }[] {
    const neighbors: { dx: number; dy: number }[] = [];

    if (!node.parent) {
      // 起点：返回所有方向
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          if (this.isWalkable(node.x + dx, node.y + dy)) {
            neighbors.push({ dx, dy });
          }
        }
      }
      return neighbors;
    }

    const px = node.parent.x;
    const py = node.parent.y;
    const dx = Math.sign(node.x - px);
    const dy = Math.sign(node.y - py);

    if (dx !== 0 && dy !== 0) {
      // 对角线移动
      // 自然邻居
      if (this.isWalkable(node.x, node.y + dy)) {
        neighbors.push({ dx: 0, dy });
      }
      if (this.isWalkable(node.x + dx, node.y)) {
        neighbors.push({ dx, dy: 0 });
      }
      if (this.isWalkable(node.x + dx, node.y + dy)) {
        neighbors.push({ dx, dy });
      }
      // 强制邻居
      if (!this.isWalkable(node.x - dx, node.y) &&
          this.isWalkable(node.x - dx, node.y + dy)) {
        neighbors.push({ dx: -dx, dy });
      }
      if (!this.isWalkable(node.x, node.y - dy) &&
          this.isWalkable(node.x + dx, node.y - dy)) {
        neighbors.push({ dx, dy: -dy });
      }
    } else if (dx !== 0) {
      // 水平移动
      if (this.isWalkable(node.x + dx, node.y)) {
        neighbors.push({ dx, dy: 0 });
      }
      // 强制邻居
      if (!this.isWalkable(node.x, node.y - 1) &&
          this.isWalkable(node.x + dx, node.y - 1)) {
        neighbors.push({ dx, dy: -1 });
      }
      if (!this.isWalkable(node.x, node.y + 1) &&
          this.isWalkable(node.x + dx, node.y + 1)) {
        neighbors.push({ dx, dy: 1 });
      }
    } else {
      // 垂直移动
      if (this.isWalkable(node.x, node.y + dy)) {
        neighbors.push({ dx: 0, dy });
      }
      // 强制邻居
      if (!this.isWalkable(node.x - 1, node.y) &&
          this.isWalkable(node.x - 1, node.y + dy)) {
        neighbors.push({ dx: -1, dy });
      }
      if (!this.isWalkable(node.x + 1, node.y) &&
          this.isWalkable(node.x + 1, node.y + dy)) {
        neighbors.push({ dx: 1, dy });
      }
    }

    return neighbors;
  }

  // JPS 主搜索算法
  findPath(start: Node, goal: Node): SearchResult {
    const openSet = new PriorityQueue<AStarNode>();
    const openSetIds = new Set<string>();
    const closedSet = new Set<string>();
    const nodeMap = new Map<string, AStarNode>();

    const startNode: AStarNode = {
      ...start,
      g: 0,
      h: AStar.octileDistance(start, goal),
      f: 0,
      parent: null
    };
    startNode.f = startNode.h;

    openSet.enqueue(startNode, startNode.f);
    openSetIds.add(startNode.id);
    nodeMap.set(startNode.id, startNode);

    while (!openSet.isEmpty()) {
      const current = openSet.dequeue()!;
      openSetIds.delete(current.id);

      if (closedSet.has(current.id)) continue;
      closedSet.add(current.id);

      if (current.id === goal.id) {
        return {
          path: this.reconstructPath(current),
          visitedCount: closedSet.size,
          found: true
        };
      }

      // 获取跳点后继
      const successors = this.getSuccessors(current, goal);

      for (const { node: jumpPoint } of successors) {
        if (closedSet.has(jumpPoint.id)) continue;

        const dx = jumpPoint.x - current.x;
        const dy = jumpPoint.y - current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const tentativeG = current.g + distance;

        let existingNode = nodeMap.get(jumpPoint.id);

        if (!existingNode) {
          existingNode = {
            ...jumpPoint,
            g: tentativeG,
            h: AStar.octileDistance(jumpPoint, goal),
            f: 0,
            parent: current
          };
          existingNode.f = existingNode.g + existingNode.h;
          nodeMap.set(jumpPoint.id, existingNode);
          openSet.enqueue(existingNode, existingNode.f);
          openSetIds.add(jumpPoint.id);
        } else if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = existingNode.g + existingNode.h;
          existingNode.parent = current;
          openSet.enqueue(existingNode, existingNode.f);
        }
      }
    }

    return { path: [], visitedCount: closedSet.size, found: false };
  }

  private reconstructPath(node: AStarNode): Node[] {
    const path: Node[] = [];
    let current: AStarNode | null = node;

    while (current !== null) {
      // JPS 跳点之间需要插值
      if (current.parent) {
        const interpolated = this.interpolate(current.parent, current);
        path.unshift(...interpolated.slice(1));
      } else {
        path.unshift({
          id: current.id,
          x: current.x,
          y: current.y,
          walkable: current.walkable
        });
      }
      current = current.parent;
    }

    return path;
  }

  // 在两个跳点之间插值
  private interpolate(from: AStarNode, to: AStarNode): Node[] {
    const path: Node[] = [];
    let x = from.x;
    let y = from.y;
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);

    while (x !== to.x || y !== to.y) {
      path.push(this.map.getNode(x, y)!);

      if (x !== to.x && y !== to.y) {
        x += dx;
        y += dy;
      } else if (x !== to.x) {
        x += dx;
      } else {
        y += dy;
      }
    }
    path.push(this.map.getNode(to.x, to.y)!);

    return path;
  }
}
```

### JPS 性能分析

| 特性 | A* | JPS |
|-----|-----|-----|
| 扩展节点数 | 较多 | 大幅减少 |
| 单节点处理时间 | 较短 | 较长（需要跳跃） |
| 内存占用 | 较大 | 较小 |
| 适用地图 | 任意 | 均匀代价网格 |
| 实现复杂度 | 简单 | 复杂 |

## 实时寻路优化

在实际游戏中，需要考虑性能优化以支持大量单位的实时寻路。

### 分层寻路（Hierarchical Pathfinding）

```typescript
// 分层导航网格
class HierarchicalPathfinder {
  private highLevelGraph: Map<string, { neighbors: string[]; costs: number[] }>;
  private lowLevelMaps: Map<string, GridMap>;
  private clusterSize: number;

  constructor(map: GridMap, clusterSize: number = 10) {
    this.clusterSize = clusterSize;
    this.lowLevelMaps = new Map();
    this.highLevelGraph = new Map();
    this.buildHierarchy(map);
  }

  private buildHierarchy(map: GridMap): void {
    // 将地图划分为簇
    // 识别簇之间的边界节点
    // 构建高层抽象图
    // 预计算簇内和簇间的路径
  }

  findPath(start: Node, goal: Node): Node[] {
    // 1. 确定起点和终点所在的簇
    const startCluster = this.getCluster(start);
    const goalCluster = this.getCluster(goal);

    // 2. 在高层图中寻找簇级路径
    const clusterPath = this.findHighLevelPath(startCluster, goalCluster);

    // 3. 在每个簇内细化路径
    const detailedPath: Node[] = [];
    for (let i = 0; i < clusterPath.length - 1; i++) {
      const localPath = this.findLocalPath(
        clusterPath[i],
        clusterPath[i + 1],
        i === 0 ? start : null,
        i === clusterPath.length - 2 ? goal : null
      );
      detailedPath.push(...localPath);
    }

    return detailedPath;
  }

  private getCluster(node: Node): string {
    const cx = Math.floor(node.x / this.clusterSize);
    const cy = Math.floor(node.y / this.clusterSize);
    return `${cx},${cy}`;
  }

  private findHighLevelPath(start: string, goal: string): string[] {
    // 在簇图上运行 A*
    return [];
  }

  private findLocalPath(
    fromCluster: string,
    toCluster: string,
    start: Node | null,
    goal: Node | null
  ): Node[] {
    // 在簇内运行详细寻路
    return [];
  }
}
```

### 流场寻路（Flow Field Pathfinding）

流场适合大量单位向同一目标移动的场景：

```typescript
class FlowField {
  private width: number;
  private height: number;
  private integrationField: number[][];
  private flowField: { dx: number; dy: number }[][];

  constructor(map: GridMap, goal: Node) {
    this.width = 20; // 假设地图宽度
    this.height = 20;
    this.integrationField = this.buildIntegrationField(map, goal);
    this.flowField = this.buildFlowField();
  }

  // 构建积分场：每个格子到目标的代价
  private buildIntegrationField(map: GridMap, goal: Node): number[][] {
    const field: number[][] = [];
    for (let y = 0; y < this.height; y++) {
      field[y] = [];
      for (let x = 0; x < this.width; x++) {
        field[y][x] = Infinity;
      }
    }

    // 使用 Dijkstra 从目标向外扩展
    const queue: { x: number; y: number; cost: number }[] = [
      { x: goal.x, y: goal.y, cost: 0 }
    ];
    field[goal.y][goal.x] = 0;

    while (queue.length > 0) {
      queue.sort((a, b) => a.cost - b.cost);
      const current = queue.shift()!;

      const neighbors = [
        { dx: 0, dy: -1, cost: 1 },
        { dx: 0, dy: 1, cost: 1 },
        { dx: -1, dy: 0, cost: 1 },
        { dx: 1, dy: 0, cost: 1 },
        { dx: -1, dy: -1, cost: Math.SQRT2 },
        { dx: 1, dy: -1, cost: Math.SQRT2 },
        { dx: -1, dy: 1, cost: Math.SQRT2 },
        { dx: 1, dy: 1, cost: Math.SQRT2 }
      ];

      for (const { dx, dy, cost } of neighbors) {
        const nx = current.x + dx;
        const ny = current.y + dy;

        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;

        const node = map.getNode(nx, ny);
        if (!node || !node.walkable) continue;

        const newCost = current.cost + cost;
        if (newCost < field[ny][nx]) {
          field[ny][nx] = newCost;
          queue.push({ x: nx, y: ny, cost: newCost });
        }
      }
    }

    return field;
  }

  // 构建流场：每个格子的移动方向
  private buildFlowField(): { dx: number; dy: number }[][] {
    const field: { dx: number; dy: number }[][] = [];

    for (let y = 0; y < this.height; y++) {
      field[y] = [];
      for (let x = 0; x < this.width; x++) {
        field[y][x] = this.calculateFlowDirection(x, y);
      }
    }

    return field;
  }

  private calculateFlowDirection(x: number, y: number): { dx: number; dy: number } {
    let bestDx = 0;
    let bestDy = 0;
    let bestCost = this.integrationField[y][x];

    const neighbors = [
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
    ];

    for (const { dx, dy } of neighbors) {
      const nx = x + dx;
      const ny = y + dy;

      if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;

      const cost = this.integrationField[ny][nx];
      if (cost < bestCost) {
        bestCost = cost;
        bestDx = dx;
        bestDy = dy;
      }
    }

    // 归一化方向向量
    const length = Math.sqrt(bestDx * bestDx + bestDy * bestDy);
    if (length > 0) {
      return { dx: bestDx / length, dy: bestDy / length };
    }
    return { dx: 0, dy: 0 };
  }

  // 获取某点的移动方向
  getDirection(x: number, y: number): { dx: number; dy: number } {
    const gridX = Math.floor(x);
    const gridY = Math.floor(y);

    if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
      return { dx: 0, dy: 0 };
    }

    return this.flowField[gridY][gridX];
  }
}
```

### 时间切片（Time Slicing）

将寻路计算分散到多帧：

```typescript
class TimeSlicedPathfinder {
  private maxIterationsPerFrame: number;
  private pendingRequests: Map<number, PathfindingRequest>;
  private requestId: number = 0;

  constructor(maxIterationsPerFrame: number = 100) {
    this.maxIterationsPerFrame = maxIterationsPerFrame;
    this.pendingRequests = new Map();
  }

  // 提交寻路请求
  requestPath(
    map: GridMap,
    start: Node,
    goal: Node,
    callback: (path: Node[] | null) => void
  ): number {
    const id = this.requestId++;
    this.pendingRequests.set(id, {
      map,
      start,
      goal,
      callback,
      state: this.initializeSearchState(start, goal)
    });
    return id;
  }

  // 取消寻路请求
  cancelRequest(id: number): void {
    this.pendingRequests.delete(id);
  }

  // 每帧更新
  update(): void {
    let totalIterations = 0;

    for (const [id, request] of this.pendingRequests) {
      const remainingIterations = this.maxIterationsPerFrame - totalIterations;
      if (remainingIterations <= 0) break;

      const result = this.continueSearch(request, remainingIterations);
      totalIterations += result.iterations;

      if (result.complete) {
        request.callback(result.path);
        this.pendingRequests.delete(id);
      }
    }
  }

  private initializeSearchState(start: Node, goal: Node): SearchState {
    const startNode: AStarNode = {
      ...start,
      g: 0,
      h: AStar.octileDistance(start, goal),
      f: 0,
      parent: null
    };
    startNode.f = startNode.h;

    return {
      openSet: new PriorityQueue<AStarNode>(),
      closedSet: new Set<string>(),
      nodeMap: new Map<string, AStarNode>(),
      goal,
      initialized: false,
      startNode
    };
  }

  private continueSearch(
    request: PathfindingRequest,
    maxIterations: number
  ): { complete: boolean; path: Node[] | null; iterations: number } {
    const { state, map } = request;
    let iterations = 0;

    // 初始化
    if (!state.initialized) {
      state.openSet.enqueue(state.startNode, state.startNode.f);
      state.nodeMap.set(state.startNode.id, state.startNode);
      state.initialized = true;
    }

    while (!state.openSet.isEmpty() && iterations < maxIterations) {
      iterations++;

      const current = state.openSet.dequeue()!;

      if (state.closedSet.has(current.id)) continue;
      state.closedSet.add(current.id);

      // 找到目标
      if (current.id === state.goal.id) {
        return {
          complete: true,
          path: this.reconstructPath(current),
          iterations
        };
      }

      // 扩展邻居
      for (const neighborNode of map.getNeighbors(current)) {
        if (state.closedSet.has(neighborNode.id)) continue;

        const isDiagonal = neighborNode.x !== current.x && neighborNode.y !== current.y;
        const moveCost = isDiagonal ? Math.SQRT2 : 1;
        const tentativeG = current.g + moveCost;

        let neighbor = state.nodeMap.get(neighborNode.id);

        if (!neighbor) {
          neighbor = {
            ...neighborNode,
            g: tentativeG,
            h: AStar.octileDistance(neighborNode, state.goal),
            f: 0,
            parent: current
          };
          neighbor.f = neighbor.g + neighbor.h;
          state.nodeMap.set(neighbor.id, neighbor);
          state.openSet.enqueue(neighbor, neighbor.f);
        } else if (tentativeG < neighbor.g) {
          neighbor.g = tentativeG;
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = current;
          state.openSet.enqueue(neighbor, neighbor.f);
        }
      }
    }

    // 搜索未完成
    if (state.openSet.isEmpty()) {
      return { complete: true, path: null, iterations };
    }

    return { complete: false, path: null, iterations };
  }

  private reconstructPath(node: AStarNode): Node[] {
    const path: Node[] = [];
    let current: AStarNode | null = node;
    while (current !== null) {
      path.unshift({
        id: current.id,
        x: current.x,
        y: current.y,
        walkable: current.walkable
      });
      current = current.parent;
    }
    return path;
  }
}

interface SearchState {
  openSet: PriorityQueue<AStarNode>;
  closedSet: Set<string>;
  nodeMap: Map<string, AStarNode>;
  goal: Node;
  initialized: boolean;
  startNode: AStarNode;
}

interface PathfindingRequest {
  map: GridMap;
  start: Node;
  goal: Node;
  callback: (path: Node[] | null) => void;
  state: SearchState;
}
```

### 路径缓存

```typescript
class PathCache {
  private cache: Map<string, { path: Node[]; timestamp: number }>;
  private maxAge: number;
  private maxSize: number;

  constructor(maxAge: number = 5000, maxSize: number = 1000) {
    this.cache = new Map();
    this.maxAge = maxAge;
    this.maxSize = maxSize;
  }

  private getCacheKey(start: Node, goal: Node): string {
    return `${start.x},${start.y}-${goal.x},${goal.y}`;
  }

  get(start: Node, goal: Node): Node[] | null {
    const key = this.getCacheKey(start, goal);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.path;
  }

  set(start: Node, goal: Node, path: Node[]): void {
    // 检查缓存大小
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const key = this.getCacheKey(start, goal);
    this.cache.set(key, { path, timestamp: Date.now() });
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  invalidateArea(minX: number, minY: number, maxX: number, maxY: number): void {
    // 当地图区域变化时，清除相关缓存
    for (const [key, entry] of this.cache) {
      const pathInArea = entry.path.some(
        node => node.x >= minX && node.x <= maxX &&
                node.y >= minY && node.y <= maxY
      );
      if (pathInArea) {
        this.cache.delete(key);
      }
    }
  }
}
```

## 导航网格（Navigation Mesh）

对于复杂的 3D 游戏环境，导航网格是更高效的解决方案。

### NavMesh 基础概念

```typescript
interface NavMeshPolygon {
  id: string;
  vertices: { x: number; y: number; z: number }[];
  neighbors: string[];  // 相邻多边形 ID
  center: { x: number; y: number; z: number };
}

interface NavMesh {
  polygons: Map<string, NavMeshPolygon>;
}

class NavMeshPathfinder {
  private navMesh: NavMesh;

  constructor(navMesh: NavMesh) {
    this.navMesh = navMesh;
  }

  // 找到点所在的多边形
  findContainingPolygon(point: { x: number; y: number; z: number }): NavMeshPolygon | null {
    for (const polygon of this.navMesh.polygons.values()) {
      if (this.isPointInPolygon(point, polygon)) {
        return polygon;
      }
    }
    return null;
  }

  // 点是否在多边形内（2D 投影）
  private isPointInPolygon(
    point: { x: number; y: number; z: number },
    polygon: NavMeshPolygon
  ): boolean {
    const vertices = polygon.vertices;
    let inside = false;

    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].z;
      const xj = vertices[j].x, yj = vertices[j].z;

      if (((yi > point.z) !== (yj > point.z)) &&
          (point.x < (xj - xi) * (point.z - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  // 在导航网格上寻路
  findPath(
    start: { x: number; y: number; z: number },
    goal: { x: number; y: number; z: number }
  ): { x: number; y: number; z: number }[] {
    const startPoly = this.findContainingPolygon(start);
    const goalPoly = this.findContainingPolygon(goal);

    if (!startPoly || !goalPoly) {
      return [];
    }

    // 使用 A* 在多边形图上搜索
    const polyPath = this.findPolygonPath(startPoly, goalPoly);

    if (polyPath.length === 0) {
      return [];
    }

    // 使用漏斗算法生成精确路径
    return this.funnelPath(start, goal, polyPath);
  }

  private findPolygonPath(
    start: NavMeshPolygon,
    goal: NavMeshPolygon
  ): NavMeshPolygon[] {
    // A* 搜索多边形路径
    const openSet = new PriorityQueue<{
      polygon: NavMeshPolygon;
      g: number;
      f: number;
      parent: NavMeshPolygon | null;
    }>();

    const gScore = new Map<string, number>();
    const cameFrom = new Map<string, NavMeshPolygon | null>();
    const closedSet = new Set<string>();

    gScore.set(start.id, 0);
    cameFrom.set(start.id, null);
    openSet.enqueue(
      { polygon: start, g: 0, f: this.polygonDistance(start, goal), parent: null },
      this.polygonDistance(start, goal)
    );

    while (!openSet.isEmpty()) {
      const current = openSet.dequeue()!;

      if (closedSet.has(current.polygon.id)) continue;
      closedSet.add(current.polygon.id);

      if (current.polygon.id === goal.id) {
        // 重建路径
        const path: NavMeshPolygon[] = [];
        let node: NavMeshPolygon | null = current.polygon;
        while (node) {
          path.unshift(node);
          node = cameFrom.get(node.id) || null;
        }
        return path;
      }

      for (const neighborId of current.polygon.neighbors) {
        if (closedSet.has(neighborId)) continue;

        const neighbor = this.navMesh.polygons.get(neighborId)!;
        const tentativeG = gScore.get(current.polygon.id)! +
                          this.polygonDistance(current.polygon, neighbor);

        if (!gScore.has(neighborId) || tentativeG < gScore.get(neighborId)!) {
          gScore.set(neighborId, tentativeG);
          cameFrom.set(neighborId, current.polygon);
          const f = tentativeG + this.polygonDistance(neighbor, goal);
          openSet.enqueue({ polygon: neighbor, g: tentativeG, f, parent: current.polygon }, f);
        }
      }
    }

    return [];
  }

  private polygonDistance(a: NavMeshPolygon, b: NavMeshPolygon): number {
    const dx = a.center.x - b.center.x;
    const dy = a.center.y - b.center.y;
    const dz = a.center.z - b.center.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private funnelPath(
    start: { x: number; y: number; z: number },
    goal: { x: number; y: number; z: number },
    polyPath: NavMeshPolygon[]
  ): { x: number; y: number; z: number }[] {
    // 漏斗算法实现
    // 返回平滑的路径点
    return [start, goal]; // 简化实现
  }
}
```

## 算法比较与选择

### 性能比较

| 算法 | 时间复杂度 | 空间复杂度 | 最优性 | 适用场景 |
|-----|-----------|-----------|-------|---------|
| BFS | O(V + E) | O(V) | 步数最优 | 小地图，无权图 |
| Dijkstra | O((V + E) log V) | O(V) | 最短路径 | 带权图 |
| A* | O(b^d) | O(b^d) | 最短路径 | 通用寻路 |
| JPS | O(b^d) 减少常数 | O(b^d) | 最短路径 | 均匀网格 |
| 流场 | O(V + E) | O(V) | 近似最优 | 多单位同目标 |
| HPA* | 预处理+O(k) | O(V/k) | 近似最优 | 大型地图 |

### 选择建议

```
选择寻路算法的决策树：

1. 地图类型？
   ├── 网格地图
   │   ├── 均匀代价 → JPS
   │   └── 非均匀代价 → A*
   ├── 导航网格 → NavMesh A* + 漏斗算法
   └── 路点图 → 标准 A*

2. 单位数量？
   ├── 少量单位（<10）→ 独立 A*
   ├── 中等数量（10-100）→ 时间切片 A*
   └── 大量单位（>100）
       ├── 共同目标 → 流场
       └── 不同目标 → 分层寻路

3. 地图是否动态变化？
   ├── 静态 → 预计算 + 缓存
   ├── 偶尔变化 → 增量更新
   └── 频繁变化 → D* Lite

4. 路径质量要求？
   ├── 最优路径必须 → A*（可容许启发式）
   └── 近似即可 → 加权 A*（w > 1）
```

## 面试要点

### 常见面试问题

**Q1: A* 算法为什么比 Dijkstra 快？**

A* 使用启发式函数引导搜索方向，优先探索更可能在最短路径上的节点，减少了不必要的搜索。Dijkstra 向所有方向均匀扩展，效率较低。

**Q2: 什么情况下 A* 退化为 Dijkstra？**

当启发式函数 h(n) = 0 时，A* 等价于 Dijkstra。此时 f(n) = g(n)，完全依赖实际代价排序。

**Q3: 如何保证 A* 找到最优路径？**

使用可容许的启发式函数，即 h(n) 永远不高估实际代价。常用的曼哈顿距离、欧几里得距离、Octile距离在相应场景下都是可容许的。

**Q4: JPS 相比 A* 有什么优势和限制？**

优势：大幅减少需要扩展的节点数量，在开阔区域效果显著。
限制：只适用于均匀代价的网格地图，实现复杂，在复杂地形下优势减弱。

**Q5: 如何处理大量单位的实时寻路？**

- 时间切片：将计算分散到多帧
- 流场寻路：共同目标的单位共享一个流场
- 分层寻路：减少搜索空间
- 路径缓存：复用相似请求的结果
- 局部避障：寻路与碰撞检测分离

### 代码实现要点

1. **优先队列实现**：使用二叉堆实现 O(log n) 的入队出队
2. **节点比较**：注意浮点数精度问题
3. **内存管理**：大地图需要考虑对象池复用
4. **边界检查**：防止数组越界
5. **调试工具**：实现路径可视化便于调试

## 延伸阅读

### 推荐资源

- **《游戏编程精粹》系列**：包含大量寻路算法的实用技巧
- **《游戏人工智能编程案例精粹》**：AI 行为与寻路的结合
- **Red Blob Games**：优秀的算法可视化教程网站
- **Recast Navigation**：工业级导航网格库

### 进阶主题

- **D* / D* Lite**：动态环境下的增量搜索算法
- **Theta***：任意角度路径规划
- **ANYA**：最优任意角度寻路
- **RVO / ORCA**：多智能体碰撞避免
- **行为树 + 寻路**：复杂 AI 行为的实现
- **3D 寻路**：考虑高度的寻路算法

## 总结

寻路算法是游戏 AI 的基础组件，选择合适的算法需要综合考虑：

1. **地图特性**：网格、导航网格还是路点图
2. **性能需求**：单位数量和实时性要求
3. **路径质量**：是否必须最优
4. **开发成本**：实现和维护的复杂度

A* 算法是最通用的选择，掌握其原理后可以根据需求进行优化。对于大型游戏项目，通常需要组合使用多种技术：分层寻路处理大地图、流场处理群体移动、时间切片保证帧率稳定。

理解算法原理只是第一步，真正的挑战在于将其集成到完整的游戏系统中，处理好与碰撞检测、动画系统、网络同步等模块的配合。
