---
title: 程序化关卡生成技术
description: 实现随机关卡生成：房间生成、迷宫算法和波函数坍缩
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - procedural generation
  - level generation
  - WFC
  - maze
status: imported
origin: old/src/content/docs/gamedev/procedural-level.zh.md
divergence: 0.322
issues: []
legacy:
  category: GameDev
  subcategory: Procedural
  order: 34
  lastUpdated: 2026-01-07
---

程序化关卡生成是现代游戏开发中的基石技术，它能够创建无限且独特的游戏体验。从 Roguelike 游戏中蔓延的地下城到生存游戏中无尽的世界，程序化生成使开发者能够以最小的手动工作创建大量内容。本综合指南探讨了实现健壮的程序化关卡生成系统的算法、模式和最佳实践。

## 理解程序化关卡生成

### 什么是程序化生成？

程序化生成是指使用数学函数和规则而非手动设计来创建游戏内容的算法化方法。具体到关卡生成，这意味着以编程方式创建可玩空间，包括：

- 房间布局和平面图
- 走廊和通道连接
- 敌人和物品放置
- 环境细节和装饰
- 难度递进和节奏控制

### 为什么使用程序化生成？

**优势：**

1. **无限重玩性**：每次游玩都提供独特的体验
2. **减少开发时间**：无需手动设计每个关卡
3. **更小的文件大小**：算法替代存储的关卡数据
4. **动态难度**：实时根据玩家技能调整内容
5. **涌现式玩法**：意想不到的组合创造难忘时刻

**挑战：**

1. **质量控制**：确保所有生成的内容都是可玩的
2. **连贯性**：维护逻辑性的空间关系
3. **性能**：生成必须足够快以供实时使用
4. **测试**：更难测试无限的可能性
5. **设计意图**：保持预期的玩家体验

### 核心概念

在深入算法之前，让我们建立基本概念：

```typescript
// 关卡生成的基本类型
interface Point {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

enum TileType {
  WALL = 0,
  FLOOR = 1,
  DOOR = 2,
  CORRIDOR = 3,
  STAIRS_UP = 4,
  STAIRS_DOWN = 5,
}

class Level {
  width: number;
  height: number;
  tiles: TileType[][];
  rooms: Rect[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.rooms = [];

    // 用墙壁初始化
    for (let y = 0; y < height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < width; x++) {
        this.tiles[y][x] = TileType.WALL;
      }
    }
  }

  setTile(x: number, y: number, type: TileType): void {
    if (this.isInBounds(x, y)) {
      this.tiles[y][x] = type;
    }
  }

  getTile(x: number, y: number): TileType {
    if (this.isInBounds(x, y)) {
      return this.tiles[y][x];
    }
    return TileType.WALL;
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
}
```

## BSP（二叉空间分区）算法

BSP 是生成地下城风格关卡最可靠的算法之一。它递归地将空间划分为更小的区域，然后在这些区域内放置房间。

### BSP 工作原理

1. 从整个关卡作为单个区域开始
2. 水平或垂直分割区域
3. 递归分割每个子区域直到达到最小尺寸
4. 在每个叶子节点中放置房间
5. 通过父节点连接房间

### 实现

```typescript
class BSPNode {
  rect: Rect;
  left: BSPNode | null = null;
  right: BSPNode | null = null;
  room: Rect | null = null;

  constructor(rect: Rect) {
    this.rect = rect;
  }

  isLeaf(): boolean {
    return this.left === null && this.right === null;
  }
}

class BSPGenerator {
  private minRoomSize: number = 6;
  private minSplitSize: number = 12;
  private random: () => number;

  constructor(seed?: number) {
    // 使用种子随机数以实现可重现性
    this.random = seed !== undefined
      ? this.seededRandom(seed)
      : Math.random;
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  generate(width: number, height: number): Level {
    const level = new Level(width, height);

    // 创建根节点
    const root = new BSPNode({
      x: 1,
      y: 1,
      width: width - 2,
      height: height - 2
    });

    // 递归分割
    this.split(root);

    // 在叶子节点中创建房间
    this.createRooms(root, level);

    // 连接房间
    this.connectRooms(root, level);

    return level;
  }

  private split(node: BSPNode): void {
    // 如果太小则不分割
    if (node.rect.width < this.minSplitSize * 2 &&
        node.rect.height < this.minSplitSize * 2) {
      return;
    }

    // 确定分割方向
    let splitHorizontally: boolean;
    if (node.rect.width < this.minSplitSize * 2) {
      splitHorizontally = true;
    } else if (node.rect.height < this.minSplitSize * 2) {
      splitHorizontally = false;
    } else {
      // 优先分割较长的维度
      splitHorizontally = node.rect.height > node.rect.width
        ? true
        : (node.rect.width > node.rect.height ? false : this.random() > 0.5);
    }

    // 计算分割位置
    const max = splitHorizontally
      ? node.rect.height - this.minSplitSize
      : node.rect.width - this.minSplitSize;

    if (max <= this.minSplitSize) return;

    const splitPos = Math.floor(
      this.minSplitSize + this.random() * (max - this.minSplitSize)
    );

    // 创建子节点
    if (splitHorizontally) {
      node.left = new BSPNode({
        x: node.rect.x,
        y: node.rect.y,
        width: node.rect.width,
        height: splitPos
      });
      node.right = new BSPNode({
        x: node.rect.x,
        y: node.rect.y + splitPos,
        width: node.rect.width,
        height: node.rect.height - splitPos
      });
    } else {
      node.left = new BSPNode({
        x: node.rect.x,
        y: node.rect.y,
        width: splitPos,
        height: node.rect.height
      });
      node.right = new BSPNode({
        x: node.rect.x + splitPos,
        y: node.rect.y,
        width: node.rect.width - splitPos,
        height: node.rect.height
      });
    }

    // 递归分割子节点
    this.split(node.left);
    this.split(node.right);
  }

  private createRooms(node: BSPNode, level: Level): void {
    if (node.left !== null) {
      this.createRooms(node.left, level);
    }
    if (node.right !== null) {
      this.createRooms(node.right, level);
    }

    if (node.isLeaf()) {
      // 在分区内创建随机大小的房间
      const roomWidth = Math.floor(
        this.minRoomSize + this.random() * (node.rect.width - this.minRoomSize - 1)
      );
      const roomHeight = Math.floor(
        this.minRoomSize + this.random() * (node.rect.height - this.minRoomSize - 1)
      );

      const roomX = Math.floor(
        node.rect.x + this.random() * (node.rect.width - roomWidth - 1)
      );
      const roomY = Math.floor(
        node.rect.y + this.random() * (node.rect.height - roomHeight - 1)
      );

      node.room = {
        x: roomX,
        y: roomY,
        width: roomWidth,
        height: roomHeight
      };

      // 将房间刻入关卡
      this.carveRoom(node.room, level);
    }
  }

  private carveRoom(room: Rect, level: Level): void {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        level.setTile(x, y, TileType.FLOOR);
      }
    }
    level.rooms.push(room);
  }

  private connectRooms(node: BSPNode, level: Level): void {
    if (node.left === null || node.right === null) return;

    // 首先递归连接子节点
    this.connectRooms(node.left, level);
    this.connectRooms(node.right, level);

    // 从每个子树获取房间
    const leftRoom = this.getRoom(node.left);
    const rightRoom = this.getRoom(node.right);

    if (leftRoom && rightRoom) {
      // 获取中心点
      const leftCenter: Point = {
        x: Math.floor(leftRoom.x + leftRoom.width / 2),
        y: Math.floor(leftRoom.y + leftRoom.height / 2)
      };
      const rightCenter: Point = {
        x: Math.floor(rightRoom.x + rightRoom.width / 2),
        y: Math.floor(rightRoom.y + rightRoom.height / 2)
      };

      // 创建 L 形走廊
      this.carveCorridor(leftCenter, rightCenter, level);
    }
  }

  private getRoom(node: BSPNode): Rect | null {
    if (node.room !== null) {
      return node.room;
    }

    if (node.left !== null) {
      const leftRoom = this.getRoom(node.left);
      if (leftRoom) return leftRoom;
    }

    if (node.right !== null) {
      const rightRoom = this.getRoom(node.right);
      if (rightRoom) return rightRoom;
    }

    return null;
  }

  private carveCorridor(start: Point, end: Point, level: Level): void {
    let x = start.x;
    let y = start.y;

    // 随机选择先水平还是先垂直
    if (this.random() > 0.5) {
      // 先水平后垂直
      while (x !== end.x) {
        level.setTile(x, y, TileType.CORRIDOR);
        x += x < end.x ? 1 : -1;
      }
      while (y !== end.y) {
        level.setTile(x, y, TileType.CORRIDOR);
        y += y < end.y ? 1 : -1;
      }
    } else {
      // 先垂直后水平
      while (y !== end.y) {
        level.setTile(x, y, TileType.CORRIDOR);
        y += y < end.y ? 1 : -1;
      }
      while (x !== end.x) {
        level.setTile(x, y, TileType.CORRIDOR);
        x += x < end.x ? 1 : -1;
      }
    }
    level.setTile(end.x, end.y, TileType.CORRIDOR);
  }
}
```

### BSP 优缺点

**优势：**
- 保证房间不重叠
- 生成连接良好的地下城
- 易于控制房间密度
- 结果可预测

**局限性：**
- 可能感觉僵硬和网格化
- 房间形状变化有限
- 可能产生长走廊

## 房间-走廊生成算法

这种方法先生成房间，然后用走廊连接它们。它比 BSP 提供更多灵活性，同时保持连通性。

### 随机房间放置

```typescript
class RoomCorridorGenerator {
  private maxAttempts: number = 100;
  private minRoomSize: number = 5;
  private maxRoomSize: number = 15;
  private roomPadding: number = 2;
  private random: () => number;

  constructor(seed?: number) {
    this.random = seed !== undefined
      ? this.seededRandom(seed)
      : Math.random;
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  generate(width: number, height: number, roomCount: number): Level {
    const level = new Level(width, height);

    // 生成房间
    for (let i = 0; i < roomCount; i++) {
      this.placeRoom(level);
    }

    // 使用最小生成树连接房间
    this.connectRoomsWithMST(level);

    // 可选：添加额外连接以形成环路
    this.addExtraConnections(level, 0.15);

    return level;
  }

  private placeRoom(level: Level): boolean {
    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      const width = Math.floor(
        this.minRoomSize + this.random() * (this.maxRoomSize - this.minRoomSize)
      );
      const height = Math.floor(
        this.minRoomSize + this.random() * (this.maxRoomSize - this.minRoomSize)
      );

      const x = Math.floor(
        1 + this.random() * (level.width - width - 2)
      );
      const y = Math.floor(
        1 + this.random() * (level.height - height - 2)
      );

      const room: Rect = { x, y, width, height };

      if (!this.roomOverlaps(room, level)) {
        this.carveRoom(room, level);
        return true;
      }
    }
    return false;
  }

  private roomOverlaps(room: Rect, level: Level): boolean {
    // 使用间距检查房间之间的空间
    const paddedRoom: Rect = {
      x: room.x - this.roomPadding,
      y: room.y - this.roomPadding,
      width: room.width + this.roomPadding * 2,
      height: room.height + this.roomPadding * 2
    };

    for (const existing of level.rooms) {
      if (this.rectsOverlap(paddedRoom, existing)) {
        return true;
      }
    }
    return false;
  }

  private rectsOverlap(a: Rect, b: Rect): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  private carveRoom(room: Rect, level: Level): void {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        level.setTile(x, y, TileType.FLOOR);
      }
    }
    level.rooms.push(room);
  }

  private connectRoomsWithMST(level: Level): void {
    if (level.rooms.length < 2) return;

    // 计算所有房间对之间的距离
    const edges: Array<{ from: number; to: number; distance: number }> = [];

    for (let i = 0; i < level.rooms.length; i++) {
      for (let j = i + 1; j < level.rooms.length; j++) {
        const distance = this.roomDistance(level.rooms[i], level.rooms[j]);
        edges.push({ from: i, to: j, distance });
      }
    }

    // 按距离排序
    edges.sort((a, b) => a.distance - b.distance);

    // Kruskal 算法构建最小生成树
    const parent = level.rooms.map((_, i) => i);

    const find = (x: number): number => {
      if (parent[x] !== x) {
        parent[x] = find(parent[x]);
      }
      return parent[x];
    };

    const union = (x: number, y: number): boolean => {
      const px = find(x);
      const py = find(y);
      if (px === py) return false;
      parent[px] = py;
      return true;
    };

    for (const edge of edges) {
      if (union(edge.from, edge.to)) {
        this.connectTwoRooms(
          level.rooms[edge.from],
          level.rooms[edge.to],
          level
        );
      }
    }
  }

  private roomDistance(a: Rect, b: Rect): number {
    const ax = a.x + a.width / 2;
    const ay = a.y + a.height / 2;
    const bx = b.x + b.width / 2;
    const by = b.y + b.height / 2;

    return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
  }

  private connectTwoRooms(a: Rect, b: Rect, level: Level): void {
    // 在每个房间内获取随机点
    const startX = Math.floor(a.x + 1 + this.random() * (a.width - 2));
    const startY = Math.floor(a.y + 1 + this.random() * (a.height - 2));
    const endX = Math.floor(b.x + 1 + this.random() * (b.width - 2));
    const endY = Math.floor(b.y + 1 + this.random() * (b.height - 2));

    this.carveCorridor({ x: startX, y: startY }, { x: endX, y: endY }, level);
  }

  private carveCorridor(start: Point, end: Point, level: Level): void {
    let x = start.x;
    let y = start.y;

    while (x !== end.x || y !== end.y) {
      level.setTile(x, y, TileType.CORRIDOR);

      // 随机选择方向
      if (x !== end.x && y !== end.y) {
        if (this.random() > 0.5) {
          x += x < end.x ? 1 : -1;
        } else {
          y += y < end.y ? 1 : -1;
        }
      } else if (x !== end.x) {
        x += x < end.x ? 1 : -1;
      } else {
        y += y < end.y ? 1 : -1;
      }
    }
    level.setTile(end.x, end.y, TileType.CORRIDOR);
  }

  private addExtraConnections(level: Level, probability: number): void {
    // 添加随机连接以形成环路
    for (let i = 0; i < level.rooms.length; i++) {
      for (let j = i + 2; j < level.rooms.length; j++) {
        if (this.random() < probability) {
          this.connectTwoRooms(level.rooms[i], level.rooms[j], level);
        }
      }
    }
  }
}
```

### 使用 Delaunay 三角剖分实现更好的连接

为了获得更自然的连接效果，可以使用 Delaunay 三角剖分：

```typescript
class DelaunayConnector {
  // Bowyer-Watson 算法实现 Delaunay 三角剖分
  triangulate(points: Point[]): Array<[Point, Point, Point]> {
    // 创建包含所有点的超级三角形
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    const dx = maxX - minX;
    const dy = maxY - minY;
    const deltaMax = Math.max(dx, dy);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const p1: Point = { x: midX - 20 * deltaMax, y: midY - deltaMax };
    const p2: Point = { x: midX, y: midY + 20 * deltaMax };
    const p3: Point = { x: midX + 20 * deltaMax, y: midY - deltaMax };

    let triangles: Array<[Point, Point, Point]> = [[p1, p2, p3]];

    // 逐个添加点
    for (const point of points) {
      const badTriangles: Array<[Point, Point, Point]> = [];

      // 找到外接圆包含该点的三角形
      for (const triangle of triangles) {
        if (this.pointInCircumcircle(point, triangle)) {
          badTriangles.push(triangle);
        }
      }

      // 找到多边形空洞的边界
      const polygon: Array<[Point, Point]> = [];
      for (const triangle of badTriangles) {
        const edges: Array<[Point, Point]> = [
          [triangle[0], triangle[1]],
          [triangle[1], triangle[2]],
          [triangle[2], triangle[0]]
        ];

        for (const edge of edges) {
          let shared = false;
          for (const other of badTriangles) {
            if (other === triangle) continue;
            if (this.triangleContainsEdge(other, edge)) {
              shared = true;
              break;
            }
          }
          if (!shared) {
            polygon.push(edge);
          }
        }
      }

      // 移除坏三角形
      triangles = triangles.filter(t => !badTriangles.includes(t));

      // 从多边形边到点创建新三角形
      for (const edge of polygon) {
        triangles.push([edge[0], edge[1], point]);
      }
    }

    // 移除包含超级三角形顶点的三角形
    return triangles.filter(t =>
      !this.containsVertex(t, p1) &&
      !this.containsVertex(t, p2) &&
      !this.containsVertex(t, p3)
    );
  }

  private pointInCircumcircle(
    p: Point,
    triangle: [Point, Point, Point]
  ): boolean {
    const [a, b, c] = triangle;

    const ax = a.x - p.x;
    const ay = a.y - p.y;
    const bx = b.x - p.x;
    const by = b.y - p.y;
    const cx = c.x - p.x;
    const cy = c.y - p.y;

    const det = (
      (ax * ax + ay * ay) * (bx * cy - cx * by) -
      (bx * bx + by * by) * (ax * cy - cx * ay) +
      (cx * cx + cy * cy) * (ax * by - bx * ay)
    );

    return det > 0;
  }

  private triangleContainsEdge(
    triangle: [Point, Point, Point],
    edge: [Point, Point]
  ): boolean {
    const edges: Array<[Point, Point]> = [
      [triangle[0], triangle[1]],
      [triangle[1], triangle[2]],
      [triangle[2], triangle[0]]
    ];

    for (const e of edges) {
      if ((e[0] === edge[0] && e[1] === edge[1]) ||
          (e[0] === edge[1] && e[1] === edge[0])) {
        return true;
      }
    }
    return false;
  }

  private containsVertex(
    triangle: [Point, Point, Point],
    vertex: Point
  ): boolean {
    return triangle[0] === vertex ||
           triangle[1] === vertex ||
           triangle[2] === vertex;
  }

  // 从三角剖分获取唯一边
  getEdges(triangles: Array<[Point, Point, Point]>): Array<[Point, Point]> {
    const edges: Array<[Point, Point]> = [];
    const seen = new Set<string>();

    for (const triangle of triangles) {
      const triEdges: Array<[Point, Point]> = [
        [triangle[0], triangle[1]],
        [triangle[1], triangle[2]],
        [triangle[2], triangle[0]]
      ];

      for (const edge of triEdges) {
        const key = this.edgeKey(edge);
        if (!seen.has(key)) {
          seen.add(key);
          edges.push(edge);
        }
      }
    }

    return edges;
  }

  private edgeKey(edge: [Point, Point]): string {
    const [a, b] = edge;
    if (a.x < b.x || (a.x === b.x && a.y < b.y)) {
      return `${a.x},${a.y}-${b.x},${b.y}`;
    }
    return `${b.x},${b.y}-${a.x},${a.y}`;
  }
}
```

## 迷宫生成算法

迷宫算法创建完美迷宫（单一解）或不完美迷宫（多条路径）。它们对于创建以探索为重点的关卡至关重要。

### 递归回溯

最常见的迷宫算法，产生长而曲折的通道：

```typescript
class RecursiveBacktrackingMaze {
  private random: () => number;

  constructor(seed?: number) {
    this.random = seed !== undefined
      ? this.seededRandom(seed)
      : Math.random;
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  generate(width: number, height: number): Level {
    // 确保奇数维度以生成正确的迷宫
    const w = width % 2 === 0 ? width - 1 : width;
    const h = height % 2 === 0 ? height - 1 : height;

    const level = new Level(w, h);

    // 从随机奇数位置开始
    const startX = 1 + Math.floor(this.random() * ((w - 2) / 2)) * 2;
    const startY = 1 + Math.floor(this.random() * ((h - 2) / 2)) * 2;

    this.carve(startX, startY, level);

    return level;
  }

  private carve(x: number, y: number, level: Level): void {
    const directions = this.shuffle([
      { dx: 0, dy: -2 },  // 北
      { dx: 2, dy: 0 },   // 东
      { dx: 0, dy: 2 },   // 南
      { dx: -2, dy: 0 }   // 西
    ]);

    level.setTile(x, y, TileType.FLOOR);

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (level.isInBounds(nx, ny) &&
          level.getTile(nx, ny) === TileType.WALL) {
        // 刻出通道
        level.setTile(x + dir.dx / 2, y + dir.dy / 2, TileType.FLOOR);
        this.carve(nx, ny, level);
      }
    }
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
```

### Prim 算法

创建分支更多、死胡同更短的迷宫：

```typescript
class PrimMaze {
  private random: () => number;

  constructor(seed?: number) {
    this.random = seed !== undefined
      ? this.seededRandom(seed)
      : Math.random;
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  generate(width: number, height: number): Level {
    const w = width % 2 === 0 ? width - 1 : width;
    const h = height % 2 === 0 ? height - 1 : height;

    const level = new Level(w, h);
    const frontier: Point[] = [];

    // 从随机位置开始
    const startX = 1 + Math.floor(this.random() * ((w - 2) / 2)) * 2;
    const startY = 1 + Math.floor(this.random() * ((h - 2) / 2)) * 2;

    level.setTile(startX, startY, TileType.FLOOR);
    this.addFrontier(startX, startY, frontier, level);

    while (frontier.length > 0) {
      // 选择随机前沿单元格
      const index = Math.floor(this.random() * frontier.length);
      const cell = frontier[index];
      frontier.splice(index, 1);

      if (level.getTile(cell.x, cell.y) === TileType.WALL) {
        // 找到是通道的邻居
        const neighbors = this.getPassageNeighbors(cell, level);

        if (neighbors.length > 0) {
          // 连接到随机邻居
          const neighbor = neighbors[
            Math.floor(this.random() * neighbors.length)
          ];

          // 刻出路径
          level.setTile(cell.x, cell.y, TileType.FLOOR);
          level.setTile(
            (cell.x + neighbor.x) / 2,
            (cell.y + neighbor.y) / 2,
            TileType.FLOOR
          );

          this.addFrontier(cell.x, cell.y, frontier, level);
        }
      }
    }

    return level;
  }

  private addFrontier(x: number, y: number, frontier: Point[], level: Level): void {
    const directions = [
      { dx: 0, dy: -2 },
      { dx: 2, dy: 0 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 }
    ];

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (level.isInBounds(nx, ny) &&
          level.getTile(nx, ny) === TileType.WALL) {
        frontier.push({ x: nx, y: ny });
      }
    }
  }

  private getPassageNeighbors(cell: Point, level: Level): Point[] {
    const neighbors: Point[] = [];
    const directions = [
      { dx: 0, dy: -2 },
      { dx: 2, dy: 0 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 }
    ];

    for (const dir of directions) {
      const nx = cell.x + dir.dx;
      const ny = cell.y + dir.dy;

      if (level.isInBounds(nx, ny) &&
          level.getTile(nx, ny) === TileType.FLOOR) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }
}
```

### Eller 算法

内存高效的算法，逐行生成迷宫：

```typescript
class EllerMaze {
  private random: () => number;

  constructor(seed?: number) {
    this.random = seed !== undefined
      ? this.seededRandom(seed)
      : Math.random;
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  generate(width: number, height: number): Level {
    const w = width % 2 === 0 ? width - 1 : width;
    const h = height % 2 === 0 ? height - 1 : height;

    const level = new Level(w, h);
    const cellWidth = Math.floor((w - 1) / 2);
    const cellHeight = Math.floor((h - 1) / 2);

    // 为第一行初始化集合
    let sets: number[] = [];
    let nextSet = 0;

    for (let i = 0; i < cellWidth; i++) {
      sets[i] = nextSet++;
    }

    for (let row = 0; row < cellHeight; row++) {
      const y = row * 2 + 1;
      const isLastRow = row === cellHeight - 1;

      // 刻出当前行的单元格
      for (let col = 0; col < cellWidth; col++) {
        const x = col * 2 + 1;
        level.setTile(x, y, TileType.FLOOR);
      }

      // 随机连接相邻单元格
      for (let col = 0; col < cellWidth - 1; col++) {
        const x = col * 2 + 1;

        if (sets[col] !== sets[col + 1]) {
          // 在最后一行，总是连接不同的集合
          // 否则，随机连接
          if (isLastRow || this.random() > 0.5) {
            // 连接单元格
            level.setTile(x + 1, y, TileType.FLOOR);

            // 合并集合
            const oldSet = sets[col + 1];
            const newSet = sets[col];
            for (let i = 0; i < cellWidth; i++) {
              if (sets[i] === oldSet) {
                sets[i] = newSet;
              }
            }
          }
        }
      }

      if (!isLastRow) {
        // 创建垂直连接
        const setMembers = new Map<number, number[]>();

        for (let col = 0; col < cellWidth; col++) {
          const set = sets[col];
          if (!setMembers.has(set)) {
            setMembers.set(set, []);
          }
          setMembers.get(set)!.push(col);
        }

        // 每个集合必须至少有一个垂直连接
        const nextSets: number[] = [];

        for (const [set, members] of setMembers) {
          // 打乱成员
          const shuffled = [...members].sort(() => this.random() - 0.5);

          // 确保至少一个连接
          const connectionCount = Math.max(
            1,
            Math.floor(this.random() * members.length) + 1
          );

          for (let i = 0; i < members.length; i++) {
            const col = shuffled[i];
            const x = col * 2 + 1;

            if (i < connectionCount) {
              // 创建垂直连接
              level.setTile(x, y + 1, TileType.FLOOR);
              nextSets[col] = set;
            } else {
              // 下一行的新集合
              nextSets[col] = nextSet++;
            }
          }
        }

        sets = nextSets;
      }
    }

    return level;
  }
}
```

### 迷宫算法比较

| 算法 | 特点 | 最适合 |
|------|------|--------|
| 递归回溯 | 长走廊，深死胡同 | 探索类游戏 |
| Prim 算法 | 更多分支，更短路径 | 动作类游戏 |
| Eller 算法 | 内存高效，逐行生成 | 大型迷宫、流式加载 |
| Kruskal 算法 | 均匀分布 | 平衡探索 |

## 波函数坍缩（WFC）

波函数坍缩是一种受量子力学启发的基于约束的算法。它通过在网格上传播约束来生成连贯的模式。

### 核心概念

1. **瓦片**：预定义的瓦片类型及其允许的邻接关系
2. **波**：每个单元格开始时是所有可能瓦片的叠加态
3. **观测**：将一个单元格坍缩为单个瓦片
4. **传播**：根据约束更新邻近单元格

### 基本 WFC 实现

```typescript
interface WFCTile {
  id: number;
  name: string;
  weight: number;
  // 每个方向允许的相邻瓦片
  validNeighbors: {
    north: Set<number>;
    east: Set<number>;
    south: Set<number>;
    west: Set<number>;
  };
}

interface WFCCell {
  possibilities: Set<number>;
  collapsed: boolean;
  tileId: number | null;
}

class WaveFunctionCollapse {
  private tiles: WFCTile[];
  private grid: WFCCell[][];
  private width: number;
  private height: number;
  private random: () => number;

  constructor(tiles: WFCTile[], seed?: number) {
    this.tiles = tiles;
    this.width = 0;
    this.height = 0;
    this.grid = [];
    this.random = seed !== undefined
      ? this.seededRandom(seed)
      : Math.random;
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  generate(width: number, height: number): number[][] | null {
    this.width = width;
    this.height = height;
    this.initializeGrid();

    while (true) {
      // 找到熵最低（可能性最少）的单元格
      const cell = this.findLowestEntropyCell();

      if (cell === null) {
        // 所有单元格已坍缩 - 成功！
        return this.extractResult();
      }

      // 观测（坍缩）单元格
      if (!this.observe(cell.x, cell.y)) {
        // 矛盾 - 生成失败
        return null;
      }

      // 传播约束
      if (!this.propagate(cell.x, cell.y)) {
        // 传播过程中出现矛盾
        return null;
      }
    }
  }

  private initializeGrid(): void {
    this.grid = [];
    const allTileIds = new Set(this.tiles.map(t => t.id));

    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = {
          possibilities: new Set(allTileIds),
          collapsed: false,
          tileId: null
        };
      }
    }
  }

  private findLowestEntropyCell(): { x: number; y: number } | null {
    let minEntropy = Infinity;
    let candidates: Array<{ x: number; y: number }> = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];

        if (cell.collapsed) continue;

        const entropy = cell.possibilities.size;

        if (entropy < minEntropy) {
          minEntropy = entropy;
          candidates = [{ x, y }];
        } else if (entropy === minEntropy) {
          candidates.push({ x, y });
        }
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    // 在相同熵的单元格中随机选择
    return candidates[Math.floor(this.random() * candidates.length)];
  }

  private observe(x: number, y: number): boolean {
    const cell = this.grid[y][x];

    if (cell.possibilities.size === 0) {
      return false; // 矛盾
    }

    // 根据权重选择瓦片
    const possibleTiles = this.tiles.filter(t =>
      cell.possibilities.has(t.id)
    );

    const totalWeight = possibleTiles.reduce((sum, t) => sum + t.weight, 0);
    let r = this.random() * totalWeight;

    let chosenTile: WFCTile | null = null;
    for (const tile of possibleTiles) {
      r -= tile.weight;
      if (r <= 0) {
        chosenTile = tile;
        break;
      }
    }

    if (chosenTile === null) {
      chosenTile = possibleTiles[possibleTiles.length - 1];
    }

    // 坍缩单元格
    cell.collapsed = true;
    cell.tileId = chosenTile.id;
    cell.possibilities = new Set([chosenTile.id]);

    return true;
  }

  private propagate(startX: number, startY: number): boolean {
    const stack: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const cell = this.grid[y][x];

      // 获取当前可能性允许的邻居
      const allowedNeighbors = {
        north: new Set<number>(),
        east: new Set<number>(),
        south: new Set<number>(),
        west: new Set<number>()
      };

      for (const tileId of cell.possibilities) {
        const tile = this.tiles.find(t => t.id === tileId)!;
        for (const id of tile.validNeighbors.north) allowedNeighbors.north.add(id);
        for (const id of tile.validNeighbors.east) allowedNeighbors.east.add(id);
        for (const id of tile.validNeighbors.south) allowedNeighbors.south.add(id);
        for (const id of tile.validNeighbors.west) allowedNeighbors.west.add(id);
      }

      // 更新邻居
      const directions = [
        { dx: 0, dy: -1, dir: 'north' as const, opposite: 'south' as const },
        { dx: 1, dy: 0, dir: 'east' as const, opposite: 'west' as const },
        { dx: 0, dy: 1, dir: 'south' as const, opposite: 'north' as const },
        { dx: -1, dy: 0, dir: 'west' as const, opposite: 'east' as const }
      ];

      for (const { dx, dy, dir } of directions) {
        const nx = x + dx;
        const ny = y + dy;

        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
          continue;
        }

        const neighbor = this.grid[ny][nx];
        if (neighbor.collapsed) continue;

        const allowed = allowedNeighbors[dir];
        let changed = false;

        // 移除不允许的可能性
        for (const tileId of neighbor.possibilities) {
          if (!allowed.has(tileId)) {
            neighbor.possibilities.delete(tileId);
            changed = true;
          }
        }

        if (neighbor.possibilities.size === 0) {
          return false; // 矛盾
        }

        if (changed) {
          stack.push({ x: nx, y: ny });
        }
      }
    }

    return true;
  }

  private extractResult(): number[][] {
    const result: number[][] = [];

    for (let y = 0; y < this.height; y++) {
      result[y] = [];
      for (let x = 0; x < this.width; x++) {
        result[y][x] = this.grid[y][x].tileId!;
      }
    }

    return result;
  }
}
```

### 定义瓦片规则

```typescript
// 示例：简单地下城瓦片
function createDungeonTiles(): WFCTile[] {
  const FLOOR = 0;
  const WALL = 1;
  const WALL_CORNER_NE = 2;
  const WALL_CORNER_SE = 3;
  const WALL_CORNER_SW = 4;
  const WALL_CORNER_NW = 5;
  const WALL_EDGE_N = 6;
  const WALL_EDGE_E = 7;
  const WALL_EDGE_S = 8;
  const WALL_EDGE_W = 9;

  return [
    {
      id: FLOOR,
      name: 'floor',
      weight: 10,
      validNeighbors: {
        north: new Set([FLOOR, WALL_EDGE_S, WALL_CORNER_SE, WALL_CORNER_SW]),
        east: new Set([FLOOR, WALL_EDGE_W, WALL_CORNER_NW, WALL_CORNER_SW]),
        south: new Set([FLOOR, WALL_EDGE_N, WALL_CORNER_NE, WALL_CORNER_NW]),
        west: new Set([FLOOR, WALL_EDGE_E, WALL_CORNER_NE, WALL_CORNER_SE])
      }
    },
    {
      id: WALL,
      name: 'wall',
      weight: 5,
      validNeighbors: {
        north: new Set([WALL, WALL_EDGE_N, WALL_CORNER_NE, WALL_CORNER_NW]),
        east: new Set([WALL, WALL_EDGE_E, WALL_CORNER_NE, WALL_CORNER_SE]),
        south: new Set([WALL, WALL_EDGE_S, WALL_CORNER_SE, WALL_CORNER_SW]),
        west: new Set([WALL, WALL_EDGE_W, WALL_CORNER_NW, WALL_CORNER_SW])
      }
    },
    {
      id: WALL_EDGE_N,
      name: 'wall_edge_n',
      weight: 2,
      validNeighbors: {
        north: new Set([WALL, WALL_EDGE_N]),
        east: new Set([WALL_EDGE_N, WALL_CORNER_NE]),
        south: new Set([FLOOR]),
        west: new Set([WALL_EDGE_N, WALL_CORNER_NW])
      }
    },
    // ... 定义剩余瓦片
  ];
}
```

## 关卡验证

生成的关卡必须经过验证以确保可玩性。

### 连通性验证

```typescript
class LevelValidator {
  // 检查所有地板瓦片是否可以互相到达
  static isFullyConnected(level: Level): boolean {
    // 找到第一个地板瓦片
    let startX = -1;
    let startY = -1;

    outer:
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        if (level.getTile(x, y) === TileType.FLOOR ||
            level.getTile(x, y) === TileType.CORRIDOR) {
          startX = x;
          startY = y;
          break outer;
        }
      }
    }

    if (startX === -1) return false;

    // 泛洪填充以找到所有可达瓦片
    const visited = new Set<string>();
    const stack: Point[] = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const directions = [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }
      ];

      for (const { dx, dy } of directions) {
        const nx = x + dx;
        const ny = y + dy;
        const tile = level.getTile(nx, ny);

        if (tile === TileType.FLOOR || tile === TileType.CORRIDOR) {
          stack.push({ x: nx, y: ny });
        }
      }
    }

    // 统计总地板瓦片数
    let totalFloor = 0;
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const tile = level.getTile(x, y);
        if (tile === TileType.FLOOR || tile === TileType.CORRIDOR) {
          totalFloor++;
        }
      }
    }

    return visited.size === totalFloor;
  }

  // 检查两点之间的最短路径长度
  static getPathLength(
    level: Level,
    start: Point,
    end: Point
  ): number {
    const visited = new Set<string>();
    const queue: Array<{ point: Point; distance: number }> = [
      { point: start, distance: 0 }
    ];

    while (queue.length > 0) {
      const { point, distance } = queue.shift()!;
      const key = `${point.x},${point.y}`;

      if (point.x === end.x && point.y === end.y) {
        return distance;
      }

      if (visited.has(key)) continue;
      visited.add(key);

      const directions = [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }
      ];

      for (const { dx, dy } of directions) {
        const nx = point.x + dx;
        const ny = point.y + dy;
        const tile = level.getTile(nx, ny);

        if (tile === TileType.FLOOR || tile === TileType.CORRIDOR) {
          queue.push({ point: { x: nx, y: ny }, distance: distance + 1 });
        }
      }
    }

    return -1; // 未找到路径
  }

  // 验证房间数量和大小
  static validateRooms(
    level: Level,
    minRooms: number,
    maxRooms: number,
    minRoomSize: number
  ): boolean {
    if (level.rooms.length < minRooms || level.rooms.length > maxRooms) {
      return false;
    }

    for (const room of level.rooms) {
      if (room.width < minRoomSize || room.height < minRoomSize) {
        return false;
      }
    }

    return true;
  }

  // 检查孤立区域
  static findIsolatedAreas(level: Level): Point[][] {
    const visited = new Set<string>();
    const areas: Point[][] = [];

    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const tile = level.getTile(x, y);
        const key = `${x},${y}`;

        if ((tile === TileType.FLOOR || tile === TileType.CORRIDOR) &&
            !visited.has(key)) {
          const area = this.floodFill(level, x, y, visited);
          areas.push(area);
        }
      }
    }

    return areas;
  }

  private static floodFill(
    level: Level,
    startX: number,
    startY: number,
    visited: Set<string>
  ): Point[] {
    const area: Point[] = [];
    const stack: Point[] = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const point = stack.pop()!;
      const key = `${point.x},${point.y}`;

      if (visited.has(key)) continue;
      visited.add(key);
      area.push(point);

      const directions = [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }
      ];

      for (const { dx, dy } of directions) {
        const nx = point.x + dx;
        const ny = point.y + dy;
        const tile = level.getTile(nx, ny);

        if (tile === TileType.FLOOR || tile === TileType.CORRIDOR) {
          stack.push({ x: nx, y: ny });
        }
      }
    }

    return area;
  }
}
```

## 难度曲线和进展

创建具有适当难度递进的关卡对于玩家参与度至关重要。

### 基于距离的难度

```typescript
class DifficultyManager {
  // 根据距离起点的远近计算难度
  static calculateDistanceDifficulty(
    level: Level,
    startRoom: Rect
  ): Map<string, number> {
    const difficultyMap = new Map<string, number>();
    const startPoint: Point = {
      x: Math.floor(startRoom.x + startRoom.width / 2),
      y: Math.floor(startRoom.y + startRoom.height / 2)
    };

    // BFS 计算距离
    const distances = new Map<string, number>();
    const queue: Array<{ point: Point; distance: number }> = [
      { point: startPoint, distance: 0 }
    ];

    let maxDistance = 0;

    while (queue.length > 0) {
      const { point, distance } = queue.shift()!;
      const key = `${point.x},${point.y}`;

      if (distances.has(key)) continue;
      distances.set(key, distance);
      maxDistance = Math.max(maxDistance, distance);

      const directions = [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 }
      ];

      for (const { dx, dy } of directions) {
        const nx = point.x + dx;
        const ny = point.y + dy;
        const tile = level.getTile(nx, ny);

        if (tile === TileType.FLOOR || tile === TileType.CORRIDOR) {
          queue.push({ point: { x: nx, y: ny }, distance: distance + 1 });
        }
      }
    }

    // 归一化到 0-1 难度范围
    for (const [key, distance] of distances) {
      difficultyMap.set(key, distance / maxDistance);
    }

    return difficultyMap;
  }

  // 为房间分配难度
  static assignRoomDifficulty(
    level: Level,
    startRoomIndex: number = 0
  ): Map<number, number> {
    const roomDifficulty = new Map<number, number>();
    const startRoom = level.rooms[startRoomIndex];

    const tileDifficulty = this.calculateDistanceDifficulty(level, startRoom);

    for (let i = 0; i < level.rooms.length; i++) {
      const room = level.rooms[i];
      const centerX = Math.floor(room.x + room.width / 2);
      const centerY = Math.floor(room.y + room.height / 2);
      const key = `${centerX},${centerY}`;

      roomDifficulty.set(i, tileDifficulty.get(key) || 0);
    }

    return roomDifficulty;
  }
}
```

### 基于难度的内容放置

```typescript
interface Enemy {
  type: string;
  difficulty: number;
  x: number;
  y: number;
}

interface Item {
  type: string;
  rarity: number;
  x: number;
  y: number;
}

class ContentPlacer {
  private random: () => number;

  constructor(seed?: number) {
    this.random = seed !== undefined
      ? this.seededRandom(seed)
      : Math.random;
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  placeEnemies(
    level: Level,
    roomDifficulty: Map<number, number>,
    enemyDensity: number = 0.1
  ): Enemy[] {
    const enemies: Enemy[] = [];

    const enemyTypes = [
      { type: 'goblin', minDifficulty: 0, maxDifficulty: 0.3 },
      { type: 'orc', minDifficulty: 0.2, maxDifficulty: 0.6 },
      { type: 'troll', minDifficulty: 0.4, maxDifficulty: 0.8 },
      { type: 'dragon', minDifficulty: 0.7, maxDifficulty: 1.0 }
    ];

    for (let i = 0; i < level.rooms.length; i++) {
      const room = level.rooms[i];
      const difficulty = roomDifficulty.get(i) || 0;

      // 跳过起始房间
      if (difficulty < 0.05) continue;

      const roomArea = room.width * room.height;
      const enemyCount = Math.floor(roomArea * enemyDensity * (0.5 + difficulty));

      // 找到此难度的有效敌人类型
      const validTypes = enemyTypes.filter(
        e => difficulty >= e.minDifficulty && difficulty <= e.maxDifficulty
      );

      if (validTypes.length === 0) continue;

      for (let j = 0; j < enemyCount; j++) {
        const enemyType = validTypes[
          Math.floor(this.random() * validTypes.length)
        ];

        // 房间内的随机位置（避开边缘）
        const x = room.x + 1 + Math.floor(this.random() * (room.width - 2));
        const y = room.y + 1 + Math.floor(this.random() * (room.height - 2));

        enemies.push({
          type: enemyType.type,
          difficulty: difficulty,
          x,
          y
        });
      }
    }

    return enemies;
  }

  placeItems(
    level: Level,
    roomDifficulty: Map<number, number>,
    itemDensity: number = 0.05
  ): Item[] {
    const items: Item[] = [];

    const itemTypes = [
      { type: 'health_potion', rarity: 0.6, minDifficulty: 0 },
      { type: 'mana_potion', rarity: 0.5, minDifficulty: 0.1 },
      { type: 'sword', rarity: 0.3, minDifficulty: 0.2 },
      { type: 'armor', rarity: 0.25, minDifficulty: 0.3 },
      { type: 'magic_ring', rarity: 0.1, minDifficulty: 0.5 },
      { type: 'legendary_weapon', rarity: 0.02, minDifficulty: 0.8 }
    ];

    for (let i = 0; i < level.rooms.length; i++) {
      const room = level.rooms[i];
      const difficulty = roomDifficulty.get(i) || 0;

      const roomArea = room.width * room.height;
      const itemCount = Math.floor(roomArea * itemDensity);

      // 更好的物品在更难的区域生成
      const validItems = itemTypes.filter(
        item => difficulty >= item.minDifficulty
      );

      for (let j = 0; j < itemCount; j++) {
        // 根据稀有度加权选择（反向 - 稀有物品概率更低）
        const totalWeight = validItems.reduce((sum, i) => sum + i.rarity, 0);
        let r = this.random() * totalWeight;

        let selectedItem = validItems[0];
        for (const item of validItems) {
          r -= item.rarity;
          if (r <= 0) {
            selectedItem = item;
            break;
          }
        }

        const x = room.x + 1 + Math.floor(this.random() * (room.width - 2));
        const y = room.y + 1 + Math.floor(this.random() * (room.height - 2));

        items.push({
          type: selectedItem.type,
          rarity: selectedItem.rarity,
          x,
          y
        });
      }
    }

    return items;
  }
}
```

## 最佳实践和技巧

### 设计指南

1. **从简单开始**：先用基本算法，再添加复杂性
2. **尽早验证**：从一开始就实现验证
3. **使用种子**：始终支持种子生成以便调试和分享
4. **分析性能**：测量生成时间并优化瓶颈
5. **测试边界情况**：生成大量关卡以发现罕见问题

### 常见陷阱

1. **浮点精度问题**：尽可能使用整数运算
2. **内存泄漏**：生成后清理大型数组
3. **无限循环**：添加最大迭代限制
4. **随机性偏差**：需要时确保均匀分布

### 测试策略

```typescript
class LevelGeneratorTests {
  static runSuite(
    generator: BSPGenerator | RoomCorridorGenerator,
    iterations: number = 1000
  ): void {
    let successCount = 0;
    let totalRooms = 0;
    let minRooms = Infinity;
    let maxRooms = 0;

    for (let i = 0; i < iterations; i++) {
      const level = generator instanceof BSPGenerator
        ? generator.generate(80, 60)
        : generator.generate(80, 60, 10);

      if (LevelValidator.isFullyConnected(level)) {
        successCount++;
      }

      totalRooms += level.rooms.length;
      minRooms = Math.min(minRooms, level.rooms.length);
      maxRooms = Math.max(maxRooms, level.rooms.length);
    }

    console.log(`成功率: ${(successCount / iterations * 100).toFixed(2)}%`);
    console.log(`平均房间数: ${(totalRooms / iterations).toFixed(2)}`);
    console.log(`房间范围: ${minRooms} - ${maxRooms}`);
  }
}
```

## 总结

程序化关卡生成是一种强大的技术，它结合了算法、约束和随机性来创建独特的可玩游戏内容。主要要点：

1. **算法选择**：为你的游戏风格选择正确的算法：
   - BSP 用于结构化地下城
   - 房间-走廊用于有机布局
   - 迷宫算法用于探索重点
   - WFC 用于基于模式的生成

2. **验证至关重要**：始终验证生成的内容：
   - 区域之间的连通性
   - 适当的难度递进
   - 最低质量标准

3. **难度管理**：使用基于距离的难度计算，相应地调整内容放置

4. **性能很重要**：考虑分块、缓存和 Web Workers 以进行大规模生成

5. **可重现性**：支持种子生成以便调试、分享和多人游戏

通过这些技术，你可以创建无尽的独特体验，同时保持手工制作关卡设计的质量和意图。

## 扩展阅读

- **Roguelike 开发资源**
  - Roguebasin Wiki
  - r/roguelikedev 社区

- **学术论文**
  - "Procedural Content Generation in Games" by Shaker, Togelius, Nelson
  - "The Model Synthesis Algorithm" by Paul Merrell

- **游戏开发社区**
  - Procedural Generation subreddit
  - GDC Vault 程序化生成演讲

- **库和工具**
  - ROT.js（JavaScript roguelike 工具包）
  - libtcod（C/C++ roguelike 库）
  - Unity PCG 工具和资源

