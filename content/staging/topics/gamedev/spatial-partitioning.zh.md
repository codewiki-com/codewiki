---
title: 空间分区优化技术
description: 掌握空间分区技术，包括四叉树、八叉树、BSP 树和空间哈希，用于游戏优化
track: gamedev
section: performance
difficulty: intermediate
tags:
  - 空间分区
  - 四叉树
  - 八叉树
  - BSP
  - 空间哈希
  - 碰撞检测
  - 优化
status: imported
origin: old/src/content/docs/gamedev/spatial-partitioning.zh.md
divergence: 0.23
issues:
  - h1-in-body
legacy:
  category: GameDev
  subcategory: Optimization
  order: 57
  lastUpdated: 2026-01-22
---

空间分区将游戏空间划分为区域，以加速碰撞检测、可见性剔除和最近邻搜索等查询。选择正确的结构可以显著提高性能。

## 基础知识

### 为什么需要空间分区？

没有空间分区时，检查 N 个对象的所有对需要 O(N^2) 次比较。空间分区通过只检查附近区域的对象，将其减少到大约 O(N log N) 或更好。

```typescript
// 朴素碰撞检测：O(N^2)
function naiveCollisionCheck(objects: GameObject[]): CollisionPair[] {
  const pairs: CollisionPair[] = [];
  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      if (intersects(objects[i].bounds, objects[j].bounds)) {
        pairs.push({ a: objects[i], b: objects[j] });
      }
    }
  }
  return pairs; // 对于大 N 非常慢！
}

// 使用空间分区：~O(N log N)
function optimizedCollisionCheck(
  objects: GameObject[],
  spatialIndex: SpatialIndex
): CollisionPair[] {
  const pairs: CollisionPair[] = [];
  for (const obj of objects) {
    const nearby = spatialIndex.query(obj.bounds);
    for (const other of nearby) {
      if (obj.id < other.id && intersects(obj.bounds, other.bounds)) {
        pairs.push({ a: obj, b: other });
      }
    }
  }
  return pairs;
}
```

### 通用接口

```typescript
interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface AABB3D extends AABB {
  minZ: number;
  maxZ: number;
}

interface SpatialIndex<T> {
  insert(item: T, bounds: AABB): void;
  remove(item: T): void;
  update(item: T, newBounds: AABB): void;
  query(bounds: AABB): T[];
  queryPoint(x: number, y: number): T[];
  clear(): void;
}

function aabbIntersects(a: AABB, b: AABB): boolean {
  return !(a.maxX < b.minX || a.minX > b.maxX ||
           a.maxY < b.minY || a.minY > b.maxY);
}
```

## 四叉树

四叉树递归地将 2D 空间细分为四个象限。

```typescript
class QuadtreeNode<T> {
  bounds: AABB;
  items: { item: T; bounds: AABB }[] = [];
  children: QuadtreeNode<T>[] | null = null;

  private maxItems: number;
  private maxDepth: number;
  private depth: number;

  constructor(
    bounds: AABB,
    maxItems: number = 8,
    maxDepth: number = 8,
    depth: number = 0
  ) {
    this.bounds = bounds;
    this.maxItems = maxItems;
    this.maxDepth = maxDepth;
    this.depth = depth;
  }

  insert(item: T, bounds: AABB): boolean {
    if (!aabbIntersects(this.bounds, bounds)) {
      return false;
    }

    if (this.children) {
      return this.insertIntoChildren(item, bounds);
    }

    this.items.push({ item, bounds });

    if (this.items.length > this.maxItems && this.depth < this.maxDepth) {
      this.split();
    }

    return true;
  }

  private split(): void {
    const midX = (this.bounds.minX + this.bounds.maxX) / 2;
    const midY = (this.bounds.minY + this.bounds.maxY) / 2;

    this.children = [
      new QuadtreeNode(
        { minX: this.bounds.minX, minY: this.bounds.minY, maxX: midX, maxY: midY },
        this.maxItems, this.maxDepth, this.depth + 1
      ),
      new QuadtreeNode(
        { minX: midX, minY: this.bounds.minY, maxX: this.bounds.maxX, maxY: midY },
        this.maxItems, this.maxDepth, this.depth + 1
      ),
      new QuadtreeNode(
        { minX: this.bounds.minX, minY: midY, maxX: midX, maxY: this.bounds.maxY },
        this.maxItems, this.maxDepth, this.depth + 1
      ),
      new QuadtreeNode(
        { minX: midX, minY: midY, maxX: this.bounds.maxX, maxY: this.bounds.maxY },
        this.maxItems, this.maxDepth, this.depth + 1
      )
    ];

    const oldItems = this.items;
    this.items = [];

    for (const { item, bounds } of oldItems) {
      this.insertIntoChildren(item, bounds);
    }
  }

  private insertIntoChildren(item: T, bounds: AABB): boolean {
    let inserted = false;
    for (const child of this.children!) {
      if (aabbIntersects(child.bounds, bounds)) {
        child.insert(item, bounds);
        inserted = true;
      }
    }

    if (!inserted) {
      this.items.push({ item, bounds });
    }

    return inserted;
  }

  query(bounds: AABB, results: T[] = []): T[] {
    if (!aabbIntersects(this.bounds, bounds)) {
      return results;
    }

    for (const { item, bounds: itemBounds } of this.items) {
      if (aabbIntersects(bounds, itemBounds)) {
        results.push(item);
      }
    }

    if (this.children) {
      for (const child of this.children) {
        child.query(bounds, results);
      }
    }

    return results;
  }

  queryPoint(x: number, y: number, results: T[] = []): T[] {
    if (x < this.bounds.minX || x > this.bounds.maxX ||
        y < this.bounds.minY || y > this.bounds.maxY) {
      return results;
    }

    for (const { item, bounds } of this.items) {
      if (x >= bounds.minX && x <= bounds.maxX &&
          y >= bounds.minY && y <= bounds.maxY) {
        results.push(item);
      }
    }

    if (this.children) {
      for (const child of this.children) {
        child.queryPoint(x, y, results);
      }
    }

    return results;
  }

  remove(item: T): boolean {
    const index = this.items.findIndex(i => i.item === item);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }

    if (this.children) {
      for (const child of this.children) {
        if (child.remove(item)) {
          return true;
        }
      }
    }

    return false;
  }

  clear(): void {
    this.items = [];
    this.children = null;
  }
}
```

## 八叉树

八叉树将四叉树扩展到 3D 空间，每个节点有八个子节点。

```typescript
class OctreeNode<T> {
  bounds: AABB3D;
  items: { item: T; bounds: AABB3D }[] = [];
  children: OctreeNode<T>[] | null = null;

  private maxItems: number;
  private maxDepth: number;
  private depth: number;

  constructor(
    bounds: AABB3D,
    maxItems: number = 8,
    maxDepth: number = 6,
    depth: number = 0
  ) {
    this.bounds = bounds;
    this.maxItems = maxItems;
    this.maxDepth = maxDepth;
    this.depth = depth;
  }

  insert(item: T, bounds: AABB3D): boolean {
    if (!this.intersects3D(this.bounds, bounds)) {
      return false;
    }

    if (this.children) {
      return this.insertIntoChildren(item, bounds);
    }

    this.items.push({ item, bounds });

    if (this.items.length > this.maxItems && this.depth < this.maxDepth) {
      this.split();
    }

    return true;
  }

  private split(): void {
    const midX = (this.bounds.minX + this.bounds.maxX) / 2;
    const midY = (this.bounds.minY + this.bounds.maxY) / 2;
    const midZ = (this.bounds.minZ + this.bounds.maxZ) / 2;

    this.children = [];

    for (let z = 0; z < 2; z++) {
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          this.children.push(new OctreeNode(
            {
              minX: x === 0 ? this.bounds.minX : midX,
              maxX: x === 0 ? midX : this.bounds.maxX,
              minY: y === 0 ? this.bounds.minY : midY,
              maxY: y === 0 ? midY : this.bounds.maxY,
              minZ: z === 0 ? this.bounds.minZ : midZ,
              maxZ: z === 0 ? midZ : this.bounds.maxZ
            },
            this.maxItems,
            this.maxDepth,
            this.depth + 1
          ));
        }
      }
    }

    const oldItems = this.items;
    this.items = [];

    for (const { item, bounds } of oldItems) {
      this.insertIntoChildren(item, bounds);
    }
  }

  private insertIntoChildren(item: T, bounds: AABB3D): boolean {
    let count = 0;
    for (const child of this.children!) {
      if (this.intersects3D(child.bounds, bounds)) {
        child.insert(item, bounds);
        count++;
      }
    }

    if (count > 1) {
      this.items.push({ item, bounds });
    }

    return count > 0;
  }

  private intersects3D(a: AABB3D, b: AABB3D): boolean {
    return !(a.maxX < b.minX || a.minX > b.maxX ||
             a.maxY < b.minY || a.minY > b.maxY ||
             a.maxZ < b.minZ || a.minZ > b.maxZ);
  }

  query(bounds: AABB3D, results: Set<T> = new Set()): T[] {
    if (!this.intersects3D(this.bounds, bounds)) {
      return Array.from(results);
    }

    for (const { item, bounds: itemBounds } of this.items) {
      if (this.intersects3D(bounds, itemBounds)) {
        results.add(item);
      }
    }

    if (this.children) {
      for (const child of this.children) {
        child.query(bounds, results);
      }
    }

    return Array.from(results);
  }
}
```

## 空间哈希

空间哈希将空间划分为均匀网格，并使用哈希函数将对象映射到单元格。非常适合均匀分布的对象。

```typescript
class SpatialHash<T> implements SpatialIndex<T> {
  private cellSize: number;
  private cells: Map<string, Set<T>> = new Map();
  private itemCells: Map<T, Set<string>> = new Map();
  private itemBounds: Map<T, AABB> = new Map();

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  private hashKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  private getCellsForBounds(bounds: AABB): string[] {
    const keys: string[] = [];
    const minCellX = Math.floor(bounds.minX / this.cellSize);
    const maxCellX = Math.floor(bounds.maxX / this.cellSize);
    const minCellY = Math.floor(bounds.minY / this.cellSize);
    const maxCellY = Math.floor(bounds.maxY / this.cellSize);

    for (let y = minCellY; y <= maxCellY; y++) {
      for (let x = minCellX; x <= maxCellX; x++) {
        keys.push(`${x},${y}`);
      }
    }

    return keys;
  }

  insert(item: T, bounds: AABB): void {
    const cellKeys = this.getCellsForBounds(bounds);
    const itemCellSet = new Set<string>();

    for (const key of cellKeys) {
      let cell = this.cells.get(key);
      if (!cell) {
        cell = new Set();
        this.cells.set(key, cell);
      }
      cell.add(item);
      itemCellSet.add(key);
    }

    this.itemCells.set(item, itemCellSet);
    this.itemBounds.set(item, bounds);
  }

  remove(item: T): void {
    const cellKeys = this.itemCells.get(item);
    if (cellKeys) {
      for (const key of cellKeys) {
        const cell = this.cells.get(key);
        if (cell) {
          cell.delete(item);
          if (cell.size === 0) {
            this.cells.delete(key);
          }
        }
      }
    }
    this.itemCells.delete(item);
    this.itemBounds.delete(item);
  }

  update(item: T, newBounds: AABB): void {
    const oldBounds = this.itemBounds.get(item);
    if (oldBounds) {
      const oldKeys = this.getCellsForBounds(oldBounds);
      const newKeys = this.getCellsForBounds(newBounds);

      if (!this.arraysEqual(oldKeys, newKeys)) {
        this.remove(item);
        this.insert(item, newBounds);
      } else {
        this.itemBounds.set(item, newBounds);
      }
    } else {
      this.insert(item, newBounds);
    }
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const setA = new Set(a);
    return b.every(x => setA.has(x));
  }

  query(bounds: AABB): T[] {
    const results = new Set<T>();
    const cellKeys = this.getCellsForBounds(bounds);

    for (const key of cellKeys) {
      const cell = this.cells.get(key);
      if (cell) {
        for (const item of cell) {
          const itemBounds = this.itemBounds.get(item);
          if (itemBounds && aabbIntersects(bounds, itemBounds)) {
            results.add(item);
          }
        }
      }
    }

    return Array.from(results);
  }

  queryPoint(x: number, y: number): T[] {
    const results: T[] = [];
    const key = this.hashKey(x, y);
    const cell = this.cells.get(key);

    if (cell) {
      for (const item of cell) {
        const bounds = this.itemBounds.get(item);
        if (bounds &&
            x >= bounds.minX && x <= bounds.maxX &&
            y >= bounds.minY && y <= bounds.maxY) {
          results.push(item);
        }
      }
    }

    return results;
  }

  queryRadius(x: number, y: number, radius: number): T[] {
    const bounds: AABB = {
      minX: x - radius,
      maxX: x + radius,
      minY: y - radius,
      maxY: y + radius
    };

    const candidates = this.query(bounds);
    const radiusSq = radius * radius;

    return candidates.filter(item => {
      const itemBounds = this.itemBounds.get(item)!;
      const centerX = (itemBounds.minX + itemBounds.maxX) / 2;
      const centerY = (itemBounds.minY + itemBounds.maxY) / 2;
      const dx = centerX - x;
      const dy = centerY - y;
      return dx * dx + dy * dy <= radiusSq;
    });
  }

  clear(): void {
    this.cells.clear();
    this.itemCells.clear();
    this.itemBounds.clear();
  }
}
```

## 包围体层次结构 (BVH)

BVH 按照对象的包围体组织对象，非常适合光线追踪和动态场景。

```typescript
interface BVHNode<T> {
  bounds: AABB;
  left: BVHNode<T> | null;
  right: BVHNode<T> | null;
  items: T[];
}

class BVH<T> {
  private root: BVHNode<T> | null = null;
  private getItemBounds: (item: T) => AABB;

  constructor(getItemBounds: (item: T) => AABB) {
    this.getItemBounds = getItemBounds;
  }

  build(items: T[]): void {
    if (items.length === 0) {
      this.root = null;
      return;
    }

    this.root = this.buildNode(items);
  }

  private buildNode(items: T[]): BVHNode<T> {
    const bounds = this.calculateBounds(items);

    if (items.length <= 4) {
      return { bounds, left: null, right: null, items };
    }

    const axis = this.getLongestAxis(bounds);

    const sorted = [...items].sort((a, b) => {
      const boundsA = this.getItemBounds(a);
      const boundsB = this.getItemBounds(b);
      const centerA = this.getAxisCenter(boundsA, axis);
      const centerB = this.getAxisCenter(boundsB, axis);
      return centerA - centerB;
    });

    const mid = Math.floor(sorted.length / 2);
    const leftItems = sorted.slice(0, mid);
    const rightItems = sorted.slice(mid);

    return {
      bounds,
      left: this.buildNode(leftItems),
      right: this.buildNode(rightItems),
      items: []
    };
  }

  private calculateBounds(items: T[]): AABB {
    const bounds: AABB = {
      minX: Infinity, minY: Infinity,
      maxX: -Infinity, maxY: -Infinity
    };

    for (const item of items) {
      const itemBounds = this.getItemBounds(item);
      bounds.minX = Math.min(bounds.minX, itemBounds.minX);
      bounds.minY = Math.min(bounds.minY, itemBounds.minY);
      bounds.maxX = Math.max(bounds.maxX, itemBounds.maxX);
      bounds.maxY = Math.max(bounds.maxY, itemBounds.maxY);
    }

    return bounds;
  }

  private getLongestAxis(bounds: AABB): 'x' | 'y' {
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    return width > height ? 'x' : 'y';
  }

  private getAxisCenter(bounds: AABB, axis: 'x' | 'y'): number {
    if (axis === 'x') {
      return (bounds.minX + bounds.maxX) / 2;
    }
    return (bounds.minY + bounds.maxY) / 2;
  }

  query(bounds: AABB): T[] {
    if (!this.root) return [];
    return this.queryNode(this.root, bounds);
  }

  private queryNode(node: BVHNode<T>, bounds: AABB): T[] {
    if (!aabbIntersects(node.bounds, bounds)) {
      return [];
    }

    const results: T[] = [];

    for (const item of node.items) {
      if (aabbIntersects(bounds, this.getItemBounds(item))) {
        results.push(item);
      }
    }

    if (node.left) {
      results.push(...this.queryNode(node.left, bounds));
    }
    if (node.right) {
      results.push(...this.queryNode(node.right, bounds));
    }

    return results;
  }
}
```

## 选择合适的结构

```typescript
class SpatialPartitioningFactory {
  static create<T>(config: {
    bounds: AABB;
    expectedObjectCount: number;
    objectSizeVariance: 'uniform' | 'varied';
    updateFrequency: 'static' | 'dynamic';
    queryType: 'aabb' | 'ray' | 'both';
  }): SpatialIndex<T> {
    const { bounds, expectedObjectCount, objectSizeVariance, updateFrequency } = config;

    // 动态场景 + 均匀大小 -> 空间哈希
    if (updateFrequency === 'dynamic' && objectSizeVariance === 'uniform') {
      const avgSize = (bounds.maxX - bounds.minX) / Math.sqrt(expectedObjectCount);
      return new SpatialHash<T>(avgSize * 2);
    }

    // 通用场景 -> 四叉树
    const maxDepth = Math.ceil(Math.log2(expectedObjectCount / 8));
    return new Quadtree<T>(bounds, 8, Math.min(maxDepth, 10));
  }
}
```

## 性能比较

| 结构 | 插入 | 删除 | 查询 (AABB) | 查询 (点) | 内存 | 最适合 |
|------|------|------|-------------|-----------|------|--------|
| 四叉树 | O(log n) | O(log n) | O(log n + k) | O(log n) | 中等 | 通用 2D |
| 八叉树 | O(log n) | O(log n) | O(log n + k) | O(log n) | 高 | 3D 世界 |
| 空间哈希 | O(1) | O(1) | O(k) | O(1) | 低 | 均匀对象 |
| BSP | O(n log n) | N/A | O(log n) | O(log n) | 高 | 静态几何 |
| BVH | O(n log n) | O(n log n) | O(log n + k) | O(log n) | 中等 | 光线追踪 |

## 最佳实践

1. **根据用例选择**：静态场景受益于 BVH/BSP；动态场景受益于空间哈希或四叉树
2. **调整参数**：空间哈希的单元格大小，树的最大深度
3. **批量更新**：在物理步骤之后更新空间结构，而不是每个对象
4. **使用对象池**：减少频繁更新结构中的分配开销
5. **考虑混合方法**：对不同类型的对象使用不同的结构

## 总结

空间分区对于高性能游戏至关重要：

- **四叉树/八叉树**：通用，适合各种对象大小
- **空间哈希**：对于频繁更新的均匀对象最快
- **BSP**：最适合静态关卡几何和可见性
- **BVH**：光线追踪和静态对象查询的最优选择

根据查询类型、更新频率和对象分布的具体需求进行选择。

## 延伸阅读

- Christer Ericson 的《Real-Time Collision Detection》
- Ian Millington 的《Game Physics Engine Development》
- 《Physically Based Rendering》 - BVH 构建
- 游戏引擎源代码（Unreal、Unity）- 生产级实现
