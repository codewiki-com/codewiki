---
title: 房间与迷宫程序化生成
description: 掌握地牢、房间、走廊和迷宫的生成算法，用于 Roguelike 和程序化游戏
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - 程序化生成
  - 地牢
  - 迷宫
  - BSP
  - 房间
  - 走廊
  - roguelike
status: imported
origin: old/src/content/docs/gamedev/procedural-dungeon.zh.md
divergence: 0.244
issues:
  - h1-in-body
legacy:
  category: GameDev
  subcategory: Procedural Generation
  order: 56
  lastUpdated: 2026-01-22
---

程序化地牢生成是 Roguelike 游戏和许多其他类型游戏的基石。本指南涵盖了创建房间、走廊和迷宫的算法，这些算法能够产生感觉像是经过设计但又提供无限变化的关卡。

## 地牢生成基础

### 基本数据结构

```typescript
enum TileType {
  Wall = 0,
  Floor = 1,
  Door = 2,
  Corridor = 3,
  StairsUp = 4,
  StairsDown = 5
}

interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  connections: Room[];
  id: number;
}

interface Corridor {
  start: { x: number; y: number };
  end: { x: number; y: number };
  points: { x: number; y: number }[];
}

class Dungeon {
  width: number;
  height: number;
  tiles: TileType[][];
  rooms: Room[] = [];
  corridors: Corridor[] = [];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.tiles = Array(height).fill(null).map(() =>
      Array(width).fill(TileType.Wall)
    );
  }

  getTile(x: number, y: number): TileType {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return TileType.Wall;
    }
    return this.tiles[y][x];
  }

  setTile(x: number, y: number, type: TileType): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.tiles[y][x] = type;
    }
  }

  carveRoom(room: Room): void {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        this.setTile(x, y, TileType.Floor);
      }
    }
    this.rooms.push(room);
  }
}
```

### 带种子的随机数生成器

```typescript
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // 线性同余生成器
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  // 范围内的整数 [min, max)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  // 带概率的布尔值
  nextBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  // 从数组中随机选择元素
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)];
  }

  // 原地打乱数组
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
```

## BSP（二叉空间分割）地牢

BSP 通过递归分割空间并在叶节点中放置房间来创建地牢。

```typescript
interface BSPNode {
  x: number;
  y: number;
  width: number;
  height: number;
  left: BSPNode | null;
  right: BSPNode | null;
  room: Room | null;
}

class BSPDungeonGenerator {
  private random: SeededRandom;
  private dungeon: Dungeon;
  private roomIdCounter: number = 0;

  minRoomSize: number = 6;
  maxRoomSize: number = 15;
  minSplitRatio: number = 0.4;
  maxSplitRatio: number = 0.6;
  roomPadding: number = 1;

  constructor(seed: number = Date.now()) {
    this.random = new SeededRandom(seed);
  }

  generate(width: number, height: number, iterations: number): Dungeon {
    this.dungeon = new Dungeon(width, height);
    this.roomIdCounter = 0;

    // 创建覆盖整个地牢的根节点
    const root: BSPNode = {
      x: 0,
      y: 0,
      width,
      height,
      left: null,
      right: null,
      room: null
    };

    // 递归分割空间
    this.splitNode(root, iterations);

    // 在叶节点中创建房间
    this.createRooms(root);

    // 用走廊连接房间
    this.connectRooms(root);

    return this.dungeon;
  }

  private splitNode(node: BSPNode, iterations: number): void {
    if (iterations <= 0) return;

    // 根据宽高比确定分割方向
    const splitHorizontally = node.width < node.height
      ? true
      : node.width > node.height
        ? false
        : this.random.nextBool();

    if (splitHorizontally) {
      // 检查是否可以水平分割
      if (node.height < this.minRoomSize * 2) return;

      const splitRatio = this.random.next() *
        (this.maxSplitRatio - this.minSplitRatio) + this.minSplitRatio;
      const splitY = Math.floor(node.height * splitRatio);

      node.left = {
        x: node.x,
        y: node.y,
        width: node.width,
        height: splitY,
        left: null,
        right: null,
        room: null
      };

      node.right = {
        x: node.x,
        y: node.y + splitY,
        width: node.width,
        height: node.height - splitY,
        left: null,
        right: null,
        room: null
      };
    } else {
      // 垂直分割
      if (node.width < this.minRoomSize * 2) return;

      const splitRatio = this.random.next() *
        (this.maxSplitRatio - this.minSplitRatio) + this.minSplitRatio;
      const splitX = Math.floor(node.width * splitRatio);

      node.left = {
        x: node.x,
        y: node.y,
        width: splitX,
        height: node.height,
        left: null,
        right: null,
        room: null
      };

      node.right = {
        x: node.x + splitX,
        y: node.y,
        width: node.width - splitX,
        height: node.height,
        left: null,
        right: null,
        room: null
      };
    }

    // 递归分割子节点
    this.splitNode(node.left!, iterations - 1);
    this.splitNode(node.right!, iterations - 1);
  }

  private createRooms(node: BSPNode): void {
    if (node.left || node.right) {
      // 非叶节点，递归
      if (node.left) this.createRooms(node.left);
      if (node.right) this.createRooms(node.right);
    } else {
      // 叶节点 - 创建房间
      const maxWidth = node.width - this.roomPadding * 2;
      const maxHeight = node.height - this.roomPadding * 2;

      if (maxWidth < this.minRoomSize || maxHeight < this.minRoomSize) {
        return;
      }

      const roomWidth = this.random.nextInt(
        this.minRoomSize,
        Math.min(this.maxRoomSize, maxWidth) + 1
      );
      const roomHeight = this.random.nextInt(
        this.minRoomSize,
        Math.min(this.maxRoomSize, maxHeight) + 1
      );

      const roomX = node.x + this.roomPadding +
        this.random.nextInt(0, maxWidth - roomWidth + 1);
      const roomY = node.y + this.roomPadding +
        this.random.nextInt(0, maxHeight - roomHeight + 1);

      node.room = {
        x: roomX,
        y: roomY,
        width: roomWidth,
        height: roomHeight,
        connections: [],
        id: this.roomIdCounter++
      };

      this.dungeon.carveRoom(node.room);
    }
  }

  private connectRooms(node: BSPNode): void {
    if (!node.left || !node.right) return;

    // 首先递归连接子节点
    this.connectRooms(node.left);
    this.connectRooms(node.right);

    // 从每个子树获取一个房间
    const leftRoom = this.getRoom(node.left);
    const rightRoom = this.getRoom(node.right);

    if (leftRoom && rightRoom) {
      this.createCorridor(leftRoom, rightRoom);
      leftRoom.connections.push(rightRoom);
      rightRoom.connections.push(leftRoom);
    }
  }

  private getRoom(node: BSPNode): Room | null {
    if (node.room) return node.room;

    // 从随机子节点获取房间
    const rooms: Room[] = [];
    if (node.left) {
      const leftRoom = this.getRoom(node.left);
      if (leftRoom) rooms.push(leftRoom);
    }
    if (node.right) {
      const rightRoom = this.getRoom(node.right);
      if (rightRoom) rooms.push(rightRoom);
    }

    return rooms.length > 0 ? this.random.pick(rooms) : null;
  }

  private createCorridor(room1: Room, room2: Room): void {
    // 获取中心点
    const start = {
      x: Math.floor(room1.x + room1.width / 2),
      y: Math.floor(room1.y + room1.height / 2)
    };
    const end = {
      x: Math.floor(room2.x + room2.width / 2),
      y: Math.floor(room2.y + room2.height / 2)
    };

    // L 形走廊
    const corridor: Corridor = {
      start,
      end,
      points: []
    };

    // 随机选择先水平还是先垂直
    if (this.random.nextBool()) {
      // 先水平后垂直
      this.carveHorizontalTunnel(start.x, end.x, start.y);
      this.carveVerticalTunnel(start.y, end.y, end.x);
    } else {
      // 先垂直后水平
      this.carveVerticalTunnel(start.y, end.y, start.x);
      this.carveHorizontalTunnel(start.x, end.x, end.y);
    }

    this.dungeon.corridors.push(corridor);
  }

  private carveHorizontalTunnel(x1: number, x2: number, y: number): void {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    for (let x = minX; x <= maxX; x++) {
      this.dungeon.setTile(x, y, TileType.Corridor);
    }
  }

  private carveVerticalTunnel(y1: number, y2: number, x: number): void {
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    for (let y = minY; y <= maxY; y++) {
      this.dungeon.setTile(x, y, TileType.Corridor);
    }
  }
}
```

## 带分离的房间放置

一种替代方法，随机放置房间并使用分离来避免重叠。

```typescript
class RandomRoomDungeonGenerator {
  private random: SeededRandom;
  private dungeon: Dungeon;

  roomAttempts: number = 100;
  minRoomSize: number = 5;
  maxRoomSize: number = 12;
  corridorWidth: number = 1;

  constructor(seed: number = Date.now()) {
    this.random = new SeededRandom(seed);
  }

  generate(width: number, height: number, targetRooms: number): Dungeon {
    this.dungeon = new Dungeon(width, height);
    const rooms: Room[] = [];

    // 尝试放置房间
    for (let attempt = 0; attempt < this.roomAttempts && rooms.length < targetRooms; attempt++) {
      const room = this.generateRandomRoom(width, height, rooms.length);

      if (this.canPlaceRoom(room, rooms)) {
        this.dungeon.carveRoom(room);
        rooms.push(room);
      }
    }

    // 使用最小生成树连接房间
    this.connectRoomsMST(rooms);

    // 添加一些额外的连接以形成循环
    this.addExtraConnections(rooms, 0.15);

    return this.dungeon;
  }

  private generateRandomRoom(maxWidth: number, maxHeight: number, id: number): Room {
    const width = this.random.nextInt(this.minRoomSize, this.maxRoomSize + 1);
    const height = this.random.nextInt(this.minRoomSize, this.maxRoomSize + 1);
    const x = this.random.nextInt(1, maxWidth - width - 1);
    const y = this.random.nextInt(1, maxHeight - height - 1);

    return { x, y, width, height, connections: [], id };
  }

  private canPlaceRoom(room: Room, existingRooms: Room[], padding: number = 2): boolean {
    // 检查边界
    if (room.x < 1 || room.y < 1 ||
        room.x + room.width >= this.dungeon.width - 1 ||
        room.y + room.height >= this.dungeon.height - 1) {
      return false;
    }

    // 检查与现有房间的重叠
    for (const other of existingRooms) {
      if (this.roomsOverlap(room, other, padding)) {
        return false;
      }
    }

    return true;
  }

  private roomsOverlap(a: Room, b: Room, padding: number): boolean {
    return !(a.x + a.width + padding <= b.x ||
             b.x + b.width + padding <= a.x ||
             a.y + a.height + padding <= b.y ||
             b.y + b.height + padding <= a.y);
  }

  private connectRoomsMST(rooms: Room[]): void {
    if (rooms.length < 2) return;

    // 使用 Prim 算法构建 MST
    const connected: Set<Room> = new Set([rooms[0]]);
    const edges: { room1: Room; room2: Room; distance: number }[] = [];

    // 生成所有可能的边
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        edges.push({
          room1: rooms[i],
          room2: rooms[j],
          distance: this.roomDistance(rooms[i], rooms[j])
        });
      }
    }

    // 按距离排序边
    edges.sort((a, b) => a.distance - b.distance);

    while (connected.size < rooms.length) {
      // 找到连接已连接房间和未连接房间的最短边
      for (const edge of edges) {
        const room1Connected = connected.has(edge.room1);
        const room2Connected = connected.has(edge.room2);

        if (room1Connected !== room2Connected) {
          // 连接这些房间
          this.createCorridor(edge.room1, edge.room2);
          edge.room1.connections.push(edge.room2);
          edge.room2.connections.push(edge.room1);

          connected.add(edge.room1);
          connected.add(edge.room2);
          break;
        }
      }
    }
  }

  private addExtraConnections(rooms: Room[], probability: number): void {
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        const room1 = rooms[i];
        const room2 = rooms[j];

        // 如果已连接则跳过
        if (room1.connections.includes(room2)) continue;

        // 跳过远距离房间
        const distance = this.roomDistance(room1, room2);
        if (distance > 20) continue;

        if (this.random.nextBool(probability)) {
          this.createCorridor(room1, room2);
          room1.connections.push(room2);
          room2.connections.push(room1);
        }
      }
    }
  }

  private roomDistance(a: Room, b: Room): number {
    const ax = a.x + a.width / 2;
    const ay = a.y + a.height / 2;
    const bx = b.x + b.width / 2;
    const by = b.y + b.height / 2;
    return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
  }

  private createCorridor(room1: Room, room2: Room): void {
    // 使用 A* 实现更有趣的走廊
    const start = this.getRandomPointInRoom(room1);
    const end = this.getRandomPointInRoom(room2);

    const path = this.findPath(start, end);
    for (const point of path) {
      this.dungeon.setTile(point.x, point.y, TileType.Corridor);
    }
  }

  private getRandomPointInRoom(room: Room): { x: number; y: number } {
    return {
      x: room.x + this.random.nextInt(1, room.width - 1),
      y: room.y + this.random.nextInt(1, room.height - 1)
    };
  }

  private findPath(
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): { x: number; y: number }[] {
    // 简单的 A* 寻路
    const openSet: { x: number; y: number; g: number; h: number; parent: any }[] = [];
    const closedSet: Set<string> = new Set();

    const heuristic = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    openSet.push({
      x: start.x,
      y: start.y,
      g: 0,
      h: heuristic(start, end),
      parent: null
    });

    while (openSet.length > 0) {
      // 按 f = g + h 排序
      openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h));
      const current = openSet.shift()!;

      if (current.x === end.x && current.y === end.y) {
        // 重建路径
        const path: { x: number; y: number }[] = [];
        let node = current;
        while (node) {
          path.unshift({ x: node.x, y: node.y });
          node = node.parent;
        }
        return path;
      }

      closedSet.add(`${current.x},${current.y}`);

      // 检查邻居（4 方向）
      const neighbors = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 }
      ];

      for (const neighbor of neighbors) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(key)) continue;
        if (neighbor.x < 1 || neighbor.x >= this.dungeon.width - 1 ||
            neighbor.y < 1 || neighbor.y >= this.dungeon.height - 1) continue;

        const g = current.g + 1;
        const existing = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);

        if (!existing || g < existing.g) {
          if (existing) {
            existing.g = g;
            existing.parent = current;
          } else {
            openSet.push({
              x: neighbor.x,
              y: neighbor.y,
              g,
              h: heuristic(neighbor, end),
              parent: current
            });
          }
        }
      }
    }

    // 回退：直接 L 形路径
    return this.directPath(start, end);
  }

  private directPath(
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    let x = start.x;
    let y = start.y;

    while (x !== end.x) {
      path.push({ x, y });
      x += x < end.x ? 1 : -1;
    }
    while (y !== end.y) {
      path.push({ x, y });
      y += y < end.y ? 1 : -1;
    }
    path.push({ x: end.x, y: end.y });

    return path;
  }
}
```

## 迷宫生成算法

### 递归回溯

```typescript
class RecursiveBacktrackingMaze {
  private random: SeededRandom;
  private dungeon: Dungeon;
  private visited: boolean[][];

  constructor(seed: number = Date.now()) {
    this.random = new SeededRandom(seed);
  }

  generate(width: number, height: number): Dungeon {
    // 确保奇数尺寸以获得正确的迷宫
    const w = width % 2 === 0 ? width - 1 : width;
    const h = height % 2 === 0 ? height - 1 : height;

    this.dungeon = new Dungeon(w, h);
    this.visited = Array(h).fill(null).map(() => Array(w).fill(false));

    // 从 (1, 1) 开始
    this.carve(1, 1);

    return this.dungeon;
  }

  private carve(x: number, y: number): void {
    this.visited[y][x] = true;
    this.dungeon.setTile(x, y, TileType.Floor);

    // 以随机顺序获取邻居
    const directions = this.random.shuffle([
      { dx: 0, dy: -2 }, // 上
      { dx: 0, dy: 2 },  // 下
      { dx: -2, dy: 0 }, // 左
      { dx: 2, dy: 0 }   // 右
    ]);

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;

      // 检查边界和是否未访问
      if (nx > 0 && nx < this.dungeon.width - 1 &&
          ny > 0 && ny < this.dungeon.height - 1 &&
          !this.visited[ny][nx]) {
        // 雕刻当前和邻居之间的墙
        this.dungeon.setTile(x + dx / 2, y + dy / 2, TileType.Floor);
        this.carve(nx, ny);
      }
    }
  }
}
```

### Prim 算法迷宫

```typescript
class PrimsMaze {
  private random: SeededRandom;
  private dungeon: Dungeon;

  constructor(seed: number = Date.now()) {
    this.random = new SeededRandom(seed);
  }

  generate(width: number, height: number): Dungeon {
    const w = width % 2 === 0 ? width - 1 : width;
    const h = height % 2 === 0 ? height - 1 : height;

    this.dungeon = new Dungeon(w, h);
    const inMaze: boolean[][] = Array(h).fill(null).map(() => Array(w).fill(false));

    // 从中心开始
    const startX = Math.floor(w / 2);
    const startY = Math.floor(h / 2);
    const actualStartX = startX % 2 === 0 ? startX + 1 : startX;
    const actualStartY = startY % 2 === 0 ? startY + 1 : startY;

    this.dungeon.setTile(actualStartX, actualStartY, TileType.Floor);
    inMaze[actualStartY][actualStartX] = true;

    // 要考虑的墙
    const walls: { x: number; y: number; nx: number; ny: number }[] = [];
    this.addWalls(actualStartX, actualStartY, walls, inMaze);

    while (walls.length > 0) {
      // 随机选择一面墙
      const index = this.random.nextInt(0, walls.length);
      const wall = walls[index];
      walls.splice(index, 1);

      // 检查另一侧的单元格是否不在迷宫中
      if (!inMaze[wall.ny][wall.nx]) {
        // 将单元格添加到迷宫
        this.dungeon.setTile(wall.x, wall.y, TileType.Floor);
        this.dungeon.setTile(wall.nx, wall.ny, TileType.Floor);
        inMaze[wall.ny][wall.nx] = true;

        // 添加新墙
        this.addWalls(wall.nx, wall.ny, walls, inMaze);
      }
    }

    return this.dungeon;
  }

  private addWalls(
    x: number,
    y: number,
    walls: { x: number; y: number; nx: number; ny: number }[],
    inMaze: boolean[][]
  ): void {
    const directions = [
      { dx: 0, dy: -2 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 },
      { dx: 2, dy: 0 }
    ];

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      const wx = x + dx / 2;
      const wy = y + dy / 2;

      if (nx > 0 && nx < this.dungeon.width - 1 &&
          ny > 0 && ny < this.dungeon.height - 1 &&
          !inMaze[ny][nx]) {
        walls.push({ x: wx, y: wy, nx, ny });
      }
    }
  }
}
```

### Eller 算法（逐行）

Eller 算法逐行生成迷宫，使用最少的内存。

```typescript
class EllersMaze {
  private random: SeededRandom;
  private dungeon: Dungeon;

  constructor(seed: number = Date.now()) {
    this.random = new SeededRandom(seed);
  }

  generate(width: number, height: number): Dungeon {
    const w = width % 2 === 0 ? width - 1 : width;
    const h = height % 2 === 0 ? height - 1 : height;

    this.dungeon = new Dungeon(w, h);

    const cellWidth = Math.floor(w / 2);
    let setIds = new Array(cellWidth).fill(0).map((_, i) => i);
    let nextSetId = cellWidth;

    for (let row = 0; row < Math.floor(h / 2); row++) {
      const y = row * 2 + 1;
      const isLastRow = row === Math.floor(h / 2) - 1;

      // 雕刻这一行的单元格
      for (let col = 0; col < cellWidth; col++) {
        const x = col * 2 + 1;
        this.dungeon.setTile(x, y, TileType.Floor);
      }

      // 随机连接相邻单元格
      for (let col = 0; col < cellWidth - 1; col++) {
        const x = col * 2 + 1;

        // 如果是不同集合且（随机或最后一行）则连接
        if (setIds[col] !== setIds[col + 1] &&
            (isLastRow || this.random.nextBool(0.5))) {
          // 移除单元格之间的墙
          this.dungeon.setTile(x + 1, y, TileType.Floor);

          // 合并集合
          const oldSet = setIds[col + 1];
          const newSet = setIds[col];
          for (let i = 0; i < cellWidth; i++) {
            if (setIds[i] === oldSet) {
              setIds[i] = newSet;
            }
          }
        }
      }

      // 创建垂直连接（除了最后一行）
      if (!isLastRow) {
        // 按集合分组单元格
        const sets: Map<number, number[]> = new Map();
        for (let col = 0; col < cellWidth; col++) {
          const set = setIds[col];
          if (!sets.has(set)) {
            sets.set(set, []);
          }
          sets.get(set)!.push(col);
        }

        // 确保每个集合至少有一个垂直连接
        const newSetIds = new Array(cellWidth).fill(-1);

        for (const [setId, cols] of sets) {
          // 打乱列
          this.random.shuffle(cols);

          // 至少一个必须向下连接
          const connectCount = this.random.nextInt(1, cols.length + 1);

          for (let i = 0; i < cols.length; i++) {
            const col = cols[i];
            const x = col * 2 + 1;

            if (i < connectCount) {
              // 向下连接
              this.dungeon.setTile(x, y + 1, TileType.Floor);
              newSetIds[col] = setId;
            } else {
              // 断开连接的单元格获得新集合
              newSetIds[col] = nextSetId++;
            }
          }
        }

        setIds = newSetIds;
      }
    }

    return this.dungeon;
  }
}
```

## 组合房间和迷宫

```typescript
class HybridDungeonGenerator {
  private random: SeededRandom;
  private dungeon: Dungeon;

  constructor(seed: number = Date.now()) {
    this.random = new SeededRandom(seed);
  }

  generate(width: number, height: number): Dungeon {
    this.dungeon = new Dungeon(width, height);

    // 1. 放置房间
    const rooms = this.placeRooms();

    // 2. 用迷宫填充剩余空间
    this.fillWithMaze(rooms);

    // 3. 将房间连接到迷宫
    this.connectRoomsToMaze(rooms);

    // 4. 移除死胡同（可选）
    this.removeDeadEnds(0.5);

    return this.dungeon;
  }

  private placeRooms(): Room[] {
    const rooms: Room[] = [];
    const attempts = 50;

    for (let i = 0; i < attempts; i++) {
      const room: Room = {
        x: this.random.nextInt(1, this.dungeon.width - 10),
        y: this.random.nextInt(1, this.dungeon.height - 10),
        width: this.random.nextInt(4, 10),
        height: this.random.nextInt(4, 10),
        connections: [],
        id: i
      };

      // 对齐到奇数坐标以兼容迷宫
      room.x = room.x % 2 === 0 ? room.x + 1 : room.x;
      room.y = room.y % 2 === 0 ? room.y + 1 : room.y;
      room.width = room.width % 2 === 0 ? room.width - 1 : room.width;
      room.height = room.height % 2 === 0 ? room.height - 1 : room.height;

      if (this.canPlaceRoom(room, rooms)) {
        this.dungeon.carveRoom(room);
        rooms.push(room);
      }
    }

    return rooms;
  }

  private canPlaceRoom(room: Room, rooms: Room[]): boolean {
    // 检查边界
    if (room.x + room.width >= this.dungeon.width - 1 ||
        room.y + room.height >= this.dungeon.height - 1) {
      return false;
    }

    // 检查带填充的重叠
    for (const other of rooms) {
      if (room.x < other.x + other.width + 3 &&
          room.x + room.width + 3 > other.x &&
          room.y < other.y + other.height + 3 &&
          room.y + room.height + 3 > other.y) {
        return false;
      }
    }

    return true;
  }

  private fillWithMaze(rooms: Room[]): void {
    // 创建房间瓷砖集合
    const roomTiles: Set<string> = new Set();
    for (const room of rooms) {
      for (let y = room.y - 1; y <= room.y + room.height; y++) {
        for (let x = room.x - 1; x <= room.x + room.width; x++) {
          roomTiles.add(`${x},${y}`);
        }
      }
    }

    // 找到迷宫的起始点（不在房间内）
    for (let y = 1; y < this.dungeon.height - 1; y += 2) {
      for (let x = 1; x < this.dungeon.width - 1; x += 2) {
        if (!roomTiles.has(`${x},${y}`) &&
            this.dungeon.getTile(x, y) === TileType.Wall) {
          this.carveMaze(x, y, roomTiles);
        }
      }
    }
  }

  private carveMaze(startX: number, startY: number, roomTiles: Set<string>): void {
    const stack: { x: number; y: number }[] = [{ x: startX, y: startY }];
    this.dungeon.setTile(startX, startY, TileType.Corridor);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];

      const directions = this.random.shuffle([
        { dx: 0, dy: -2 },
        { dx: 0, dy: 2 },
        { dx: -2, dy: 0 },
        { dx: 2, dy: 0 }
      ]);

      let carved = false;
      for (const { dx, dy } of directions) {
        const nx = current.x + dx;
        const ny = current.y + dy;
        const wx = current.x + dx / 2;
        const wy = current.y + dy / 2;

        if (nx > 0 && nx < this.dungeon.width - 1 &&
            ny > 0 && ny < this.dungeon.height - 1 &&
            !roomTiles.has(`${nx},${ny}`) &&
            this.dungeon.getTile(nx, ny) === TileType.Wall) {
          this.dungeon.setTile(wx, wy, TileType.Corridor);
          this.dungeon.setTile(nx, ny, TileType.Corridor);
          stack.push({ x: nx, y: ny });
          carved = true;
          break;
        }
      }

      if (!carved) {
        stack.pop();
      }
    }
  }

  private connectRoomsToMaze(rooms: Room[]): void {
    for (const room of rooms) {
      // 找到与房间相邻的所有墙壁瓷砖
      const connectors: { x: number; y: number }[] = [];

      // 检查所有边
      for (let x = room.x; x < room.x + room.width; x++) {
        // 顶部
        if (room.y > 1 && this.dungeon.getTile(x, room.y - 2) !== TileType.Wall) {
          connectors.push({ x, y: room.y - 1 });
        }
        // 底部
        if (room.y + room.height < this.dungeon.height - 2 &&
            this.dungeon.getTile(x, room.y + room.height + 1) !== TileType.Wall) {
          connectors.push({ x, y: room.y + room.height });
        }
      }
      for (let y = room.y; y < room.y + room.height; y++) {
        // 左侧
        if (room.x > 1 && this.dungeon.getTile(room.x - 2, y) !== TileType.Wall) {
          connectors.push({ x: room.x - 1, y });
        }
        // 右侧
        if (room.x + room.width < this.dungeon.width - 2 &&
            this.dungeon.getTile(room.x + room.width + 1, y) !== TileType.Wall) {
          connectors.push({ x: room.x + room.width, y });
        }
      }

      // 连接 1-3 次
      const connectionCount = this.random.nextInt(1, Math.min(4, connectors.length + 1));
      this.random.shuffle(connectors);

      for (let i = 0; i < connectionCount && i < connectors.length; i++) {
        const conn = connectors[i];
        this.dungeon.setTile(conn.x, conn.y, TileType.Door);
      }
    }
  }

  private removeDeadEnds(probability: number): void {
    let changed = true;
    while (changed) {
      changed = false;

      for (let y = 1; y < this.dungeon.height - 1; y++) {
        for (let x = 1; x < this.dungeon.width - 1; x++) {
          const tile = this.dungeon.getTile(x, y);
          if (tile !== TileType.Corridor) continue;

          // 计算相邻的地板瓷砖
          let adjacent = 0;
          if (this.dungeon.getTile(x - 1, y) !== TileType.Wall) adjacent++;
          if (this.dungeon.getTile(x + 1, y) !== TileType.Wall) adjacent++;
          if (this.dungeon.getTile(x, y - 1) !== TileType.Wall) adjacent++;
          if (this.dungeon.getTile(x, y + 1) !== TileType.Wall) adjacent++;

          // 死胡同只有一个相邻的地板
          if (adjacent === 1 && this.random.nextBool(probability)) {
            this.dungeon.setTile(x, y, TileType.Wall);
            changed = true;
          }
        }
      }
    }
  }
}
```

## 后处理和装饰

```typescript
class DungeonDecorator {
  private random: SeededRandom;
  private dungeon: Dungeon;

  constructor(seed: number = Date.now()) {
    this.random = new SeededRandom(seed);
  }

  decorate(dungeon: Dungeon): void {
    this.dungeon = dungeon;

    this.placeDoors();
    this.placeStairs();
    this.identifySpecialRooms();
  }

  private placeDoors(): void {
    for (let y = 1; y < this.dungeon.height - 1; y++) {
      for (let x = 1; x < this.dungeon.width - 1; x++) {
        if (this.isDoorCandidate(x, y)) {
          this.dungeon.setTile(x, y, TileType.Door);
        }
      }
    }
  }

  private isDoorCandidate(x: number, y: number): boolean {
    const tile = this.dungeon.getTile(x, y);
    if (tile !== TileType.Floor && tile !== TileType.Corridor) {
      return false;
    }

    // 检查水平门位置（上下是墙）
    const horizontalDoor =
      this.dungeon.getTile(x, y - 1) === TileType.Wall &&
      this.dungeon.getTile(x, y + 1) === TileType.Wall &&
      this.dungeon.getTile(x - 1, y) !== TileType.Wall &&
      this.dungeon.getTile(x + 1, y) !== TileType.Wall;

    // 检查垂直门位置（左右是墙）
    const verticalDoor =
      this.dungeon.getTile(x - 1, y) === TileType.Wall &&
      this.dungeon.getTile(x + 1, y) === TileType.Wall &&
      this.dungeon.getTile(x, y - 1) !== TileType.Wall &&
      this.dungeon.getTile(x, y + 1) !== TileType.Wall;

    // 必须是房间和走廊之间的过渡瓷砖
    if (horizontalDoor || verticalDoor) {
      return this.isTransitionTile(x, y);
    }

    return false;
  }

  private isTransitionTile(x: number, y: number): boolean {
    // 检查这是否连接房间和走廊
    const neighbors = [
      this.dungeon.getTile(x - 1, y),
      this.dungeon.getTile(x + 1, y),
      this.dungeon.getTile(x, y - 1),
      this.dungeon.getTile(x, y + 1)
    ];

    const hasFloor = neighbors.includes(TileType.Floor);
    const hasCorridor = neighbors.includes(TileType.Corridor);

    return hasFloor && hasCorridor;
  }

  private placeStairs(): void {
    if (this.dungeon.rooms.length < 2) return;

    // 找到两个相距最远的房间放置楼梯
    let maxDistance = 0;
    let room1: Room = this.dungeon.rooms[0];
    let room2: Room = this.dungeon.rooms[1];

    for (let i = 0; i < this.dungeon.rooms.length; i++) {
      for (let j = i + 1; j < this.dungeon.rooms.length; j++) {
        const r1 = this.dungeon.rooms[i];
        const r2 = this.dungeon.rooms[j];
        const distance = Math.sqrt(
          (r1.x - r2.x) ** 2 + (r1.y - r2.y) ** 2
        );

        if (distance > maxDistance) {
          maxDistance = distance;
          room1 = r1;
          room2 = r2;
        }
      }
    }

    // 在第一个房间放置上楼梯
    const upX = room1.x + Math.floor(room1.width / 2);
    const upY = room1.y + Math.floor(room1.height / 2);
    this.dungeon.setTile(upX, upY, TileType.StairsUp);

    // 在第二个房间放置下楼梯
    const downX = room2.x + Math.floor(room2.width / 2);
    const downY = room2.y + Math.floor(room2.height / 2);
    this.dungeon.setTile(downX, downY, TileType.StairsDown);
  }

  private identifySpecialRooms(): void {
    // 根据特征识别房间（死胡同、大小等）
    for (const room of this.dungeon.rooms) {
      if (room.connections.length === 1) {
        // 死胡同房间 - 适合放宝藏或 Boss
        (room as any).type = 'special';
      } else if (room.width * room.height > 60) {
        // 大房间 - 适合竞技场或重要遭遇
        (room as any).type = 'large';
      }
    }
  }
}
```

## 最佳实践

### 1. 确保连通性

```typescript
class ConnectivityValidator {
  validate(dungeon: Dungeon): boolean {
    // 找到第一个地板瓷砖
    let startX = -1, startY = -1;

    outer: for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        if (dungeon.getTile(x, y) !== TileType.Wall) {
          startX = x;
          startY = y;
          break outer;
        }
      }
    }

    if (startX === -1) return false;

    // 从起点进行洪水填充
    const visited: Set<string> = new Set();
    const stack: { x: number; y: number }[] = [{ x: startX, y: startY }];

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      if (dungeon.getTile(x, y) === TileType.Wall) continue;

      visited.add(key);

      stack.push({ x: x + 1, y });
      stack.push({ x: x - 1, y });
      stack.push({ x, y: y + 1 });
      stack.push({ x, y: y - 1 });
    }

    // 检查是否所有非墙瓷砖都被访问过
    for (let y = 0; y < dungeon.height; y++) {
      for (let x = 0; x < dungeon.width; x++) {
        if (dungeon.getTile(x, y) !== TileType.Wall &&
            !visited.has(`${x},${y}`)) {
          return false;
        }
      }
    }

    return true;
  }
}
```

### 2. 带回退的重新生成

```typescript
class RobustDungeonGenerator {
  private generator: BSPDungeonGenerator;
  private validator: ConnectivityValidator;
  private maxAttempts: number = 10;

  generate(width: number, height: number): Dungeon | null {
    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      const seed = Date.now() + attempt;
      this.generator = new BSPDungeonGenerator(seed);

      const dungeon = this.generator.generate(width, height, 5);

      if (dungeon.rooms.length >= 3 && this.validator.validate(dungeon)) {
        return dungeon;
      }
    }

    return null;
  }
}
```

## 总结

程序化地牢生成为创建无限变化提供了强大的工具：

- **BSP** 提供结构化、相互连接的房间
- **带 MST 的随机放置** 创建有机布局
- **迷宫算法** 用可探索的通道填充空间
- **混合方法** 结合房间和迷宫以创建丰富的环境
- **后处理** 添加门、楼梯和特殊功能
- **验证** 确保可玩的、连通的地牢

根据游戏需求选择算法 - 传统地牢使用结构化的 BSP，谜题使用迷宫，或使用混合方法以获得多样性。

## 延伸阅读

- 《Procedural Content Generation in Games》 - 全面的 PCG 教科书
- 《Dungeon Generation in Diablo》 - 行业案例研究
- Roguebasin wiki - 丰富的地牢生成资源
- 《Maze Generation Algorithm Comparison》 - 算法的视觉比较
- 程序化关卡设计的研究论文
