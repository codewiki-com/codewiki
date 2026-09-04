---
title: 瓦片地图系统设计
description: 构建高效的瓦片地图系统：Tilemap、自动瓦片和程序化生成
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - Tilemap
  - 2D
  - 关卡设计
  - 程序化生成
status: imported
origin: old/src/content/docs/gamedev/tilemap-system.zh.md
divergence: 0.329
issues: []
legacy:
  category: GameDev
  subcategory: 2D
  order: 28
  lastUpdated: 2026-01-07
---

瓦片地图（Tilemap）是 2D 游戏开发中最基础也是最重要的技术之一。从经典的《超级马里奥》到现代的《星露谷物语》，瓦片地图一直是构建游戏世界的核心方式。本文将深入探讨瓦片地图系统的设计原理、实现技术和优化方法，帮助你构建高效、灵活的地图系统。

## 概念解释：什么是瓦片地图

### 基本原理

瓦片地图的核心思想是将游戏世界分割成规则的网格，每个网格单元（瓦片）使用预定义的图块进行填充。这种方式具有以下优势：

1. **内存效率**：通过复用相同的图块，大幅减少图像资源占用
2. **设计便利**：关卡设计师可以像拼图一样快速搭建场景
3. **程序化友好**：便于实现程序化地图生成
4. **碰撞检测简化**：基于网格的碰撞检测更加高效

### 瓦片地图的组成

一个完整的瓦片地图系统通常包含以下组件：

```
瓦片地图系统
├── 瓦片集 (Tileset)          // 包含所有可用瓦片的图像集
├── 地图数据 (Map Data)        // 记录每个位置使用哪个瓦片
├── 图层系统 (Layer System)    // 支持多层渲染
├── 碰撞层 (Collision Layer)   // 定义可通行区域
└── 自动瓦片 (Auto-Tile)       // 智能边缘处理
```

## Tilemap 基础实现

### 核心数据结构

首先，我们定义瓦片地图的核心数据结构：

```typescript
// 单个瓦片的定义
interface Tile {
  id: number;                    // 瓦片唯一标识
  textureX: number;              // 在瓦片集中的 X 坐标
  textureY: number;              // 在瓦片集中的 Y 坐标
  collider: boolean;             // 是否可碰撞
  properties: Map<string, any>;  // 自定义属性
}

// 瓦片集定义
interface Tileset {
  image: HTMLImageElement;       // 瓦片集图像
  tileWidth: number;             // 单个瓦片宽度
  tileHeight: number;            // 单个瓦片高度
  columns: number;               // 列数
  rows: number;                  // 行数
  tiles: Map<number, Tile>;      // 所有瓦片
}

// 地图层定义
interface TilemapLayer {
  name: string;
  width: number;                 // 地图宽度（瓦片数）
  height: number;                // 地图高度（瓦片数）
  data: number[][];              // 二维瓦片 ID 数组
  visible: boolean;
  opacity: number;
  zIndex: number;
}

// 完整地图定义
interface Tilemap {
  tileWidth: number;
  tileHeight: number;
  width: number;
  height: number;
  tilesets: Tileset[];
  layers: TilemapLayer[];
  collisionLayer: boolean[][];
}
```

### 基础渲染实现

下面是一个使用 Canvas API 的基础瓦片地图渲染器：

```typescript
class TilemapRenderer {
  private ctx: CanvasRenderingContext2D;
  private tilemap: Tilemap;
  private camera: { x: number; y: number };

  constructor(canvas: HTMLCanvasElement, tilemap: Tilemap) {
    this.ctx = canvas.getContext('2d')!;
    this.tilemap = tilemap;
    this.camera = { x: 0, y: 0 };

    // 禁用图像平滑以保持像素风格
    this.ctx.imageSmoothingEnabled = false;
  }

  // 渲染整个地图
  render(): void {
    const { tileWidth, tileHeight, width, height } = this.tilemap;

    // 计算可见区域
    const startCol = Math.floor(this.camera.x / tileWidth);
    const endCol = Math.min(
      startCol + Math.ceil(this.ctx.canvas.width / tileWidth) + 1,
      width
    );
    const startRow = Math.floor(this.camera.y / tileHeight);
    const endRow = Math.min(
      startRow + Math.ceil(this.ctx.canvas.height / tileHeight) + 1,
      height
    );

    // 清空画布
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // 按 zIndex 排序后渲染每个图层
    const sortedLayers = [...this.tilemap.layers].sort(
      (a, b) => a.zIndex - b.zIndex
    );

    for (const layer of sortedLayers) {
      if (!layer.visible) continue;

      this.ctx.globalAlpha = layer.opacity;
      this.renderLayer(layer, startCol, endCol, startRow, endRow);
    }

    this.ctx.globalAlpha = 1;
  }

  // 渲染单个图层
  private renderLayer(
    layer: TilemapLayer,
    startCol: number,
    endCol: number,
    startRow: number,
    endRow: number
  ): void {
    const { tileWidth, tileHeight, tilesets } = this.tilemap;

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tileId = layer.data[row]?.[col];
        if (tileId === 0 || tileId === undefined) continue;

        // 查找对应的瓦片集和瓦片
        const { tileset, tile } = this.findTile(tileId);
        if (!tileset || !tile) continue;

        // 计算绘制位置
        const destX = col * tileWidth - this.camera.x;
        const destY = row * tileHeight - this.camera.y;

        // 绘制瓦片
        this.ctx.drawImage(
          tileset.image,
          tile.textureX * tileset.tileWidth,
          tile.textureY * tileset.tileHeight,
          tileset.tileWidth,
          tileset.tileHeight,
          destX,
          destY,
          tileWidth,
          tileHeight
        );
      }
    }
  }

  // 根据 tileId 查找瓦片
  private findTile(tileId: number): { tileset: Tileset | null; tile: Tile | null } {
    for (const tileset of this.tilemap.tilesets) {
      const tile = tileset.tiles.get(tileId);
      if (tile) {
        return { tileset, tile };
      }
    }
    return { tileset: null, tile: null };
  }

  // 更新相机位置
  setCamera(x: number, y: number): void {
    this.camera.x = Math.max(0, x);
    this.camera.y = Math.max(0, y);
  }
}
```

### 坐标转换工具

在瓦片地图中，经常需要在世界坐标和瓦片坐标之间转换：

```typescript
class TilemapCoordinates {
  constructor(
    private tileWidth: number,
    private tileHeight: number
  ) {}

  // 世界坐标转瓦片坐标
  worldToTile(worldX: number, worldY: number): { col: number; row: number } {
    return {
      col: Math.floor(worldX / this.tileWidth),
      row: Math.floor(worldY / this.tileHeight)
    };
  }

  // 瓦片坐标转世界坐标（返回瓦片左上角）
  tileToWorld(col: number, row: number): { x: number; y: number } {
    return {
      x: col * this.tileWidth,
      y: row * this.tileHeight
    };
  }

  // 瓦片坐标转世界坐标（返回瓦片中心）
  tileToWorldCenter(col: number, row: number): { x: number; y: number } {
    return {
      x: col * this.tileWidth + this.tileWidth / 2,
      y: row * this.tileHeight + this.tileHeight / 2
    };
  }

  // 获取鼠标位置对应的瓦片
  screenToTile(
    screenX: number,
    screenY: number,
    cameraX: number,
    cameraY: number
  ): { col: number; row: number } {
    return this.worldToTile(screenX + cameraX, screenY + cameraY);
  }
}
```

## 瓦片集设计

### 瓦片集布局规范

一个良好设计的瓦片集应遵循以下原则：

```
瓦片集设计原则
├── 统一尺寸        // 所有瓦片保持相同尺寸（如 16x16, 32x32）
├── 逻辑分组        // 相关瓦片放在一起
├── 边缘处理        // 考虑瓦片之间的无缝拼接
├── 变体支持        // 为同类瓦片提供多个变体
└── 动画帧排列      // 动画瓦片水平排列
```

### 加载和管理瓦片集

```typescript
class TilesetManager {
  private tilesets: Map<string, Tileset> = new Map();
  private loadingPromises: Map<string, Promise<Tileset>> = new Map();

  // 异步加载瓦片集
  async loadTileset(
    name: string,
    imagePath: string,
    tileWidth: number,
    tileHeight: number,
    config?: TilesetConfig
  ): Promise<Tileset> {
    // 检查是否已加载
    if (this.tilesets.has(name)) {
      return this.tilesets.get(name)!;
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name)!;
    }

    // 开始加载
    const loadPromise = this.createTileset(
      imagePath,
      tileWidth,
      tileHeight,
      config
    );
    this.loadingPromises.set(name, loadPromise);

    const tileset = await loadPromise;
    this.tilesets.set(name, tileset);
    this.loadingPromises.delete(name);

    return tileset;
  }

  private async createTileset(
    imagePath: string,
    tileWidth: number,
    tileHeight: number,
    config?: TilesetConfig
  ): Promise<Tileset> {
    const image = await this.loadImage(imagePath);

    const columns = Math.floor(image.width / tileWidth);
    const rows = Math.floor(image.height / tileHeight);
    const tiles = new Map<number, Tile>();

    // 生成瓦片数据
    let tileId = 1; // 0 通常表示空瓦片
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const tileConfig = config?.tiles?.[tileId];

        tiles.set(tileId, {
          id: tileId,
          textureX: col,
          textureY: row,
          collider: tileConfig?.collider ?? false,
          properties: new Map(Object.entries(tileConfig?.properties ?? {}))
        });

        tileId++;
      }
    }

    return {
      image,
      tileWidth,
      tileHeight,
      columns,
      rows,
      tiles
    };
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  getTileset(name: string): Tileset | undefined {
    return this.tilesets.get(name);
  }
}

interface TilesetConfig {
  tiles?: {
    [id: number]: {
      collider?: boolean;
      properties?: Record<string, any>;
    };
  };
}
```

### 动画瓦片支持

```typescript
interface AnimatedTile {
  frames: number[];          // 帧 ID 序列
  frameDuration: number;     // 每帧持续时间（毫秒）
  currentFrame: number;
  elapsedTime: number;
}

class AnimatedTileManager {
  private animatedTiles: Map<number, AnimatedTile> = new Map();

  // 注册动画瓦片
  registerAnimation(
    baseTileId: number,
    frames: number[],
    frameDuration: number
  ): void {
    this.animatedTiles.set(baseTileId, {
      frames,
      frameDuration,
      currentFrame: 0,
      elapsedTime: 0
    });
  }

  // 更新所有动画
  update(deltaTime: number): void {
    for (const animation of this.animatedTiles.values()) {
      animation.elapsedTime += deltaTime;

      while (animation.elapsedTime >= animation.frameDuration) {
        animation.elapsedTime -= animation.frameDuration;
        animation.currentFrame =
          (animation.currentFrame + 1) % animation.frames.length;
      }
    }
  }

  // 获取当前应该显示的瓦片 ID
  getCurrentTileId(tileId: number): number {
    const animation = this.animatedTiles.get(tileId);
    if (!animation) return tileId;

    return animation.frames[animation.currentFrame];
  }
}
```

## 自动瓦片（Auto-Tiling）

自动瓦片是瓦片地图系统中最强大的功能之一。它能够根据相邻瓦片自动选择正确的边缘和角落瓦片，大大简化关卡设计工作。

### Bitmask 自动瓦片原理

最常用的自动瓦片算法是 Bitmask（位掩码）方法。每个相邻方向对应一个位：

```
4-方向 Bitmask（4-bit）:
    1
    |
8 - X - 2
    |
    4

8-方向 Bitmask（8-bit）:
 1   2   4
    \|/
16 - X - 8
    /|\
32  64 128
```

### 4-方向自动瓦片实现

```typescript
enum Direction4 {
  North = 1,
  East = 2,
  South = 4,
  West = 8
}

class AutoTiler4 {
  // 瓦片索引映射：bitmask -> 瓦片集中的索引
  // 共 16 种可能的组合 (2^4 = 16)
  private tileMapping: Map<number, number>;

  constructor(tileMapping: Map<number, number>) {
    this.tileMapping = tileMapping;
  }

  // 计算指定位置的 bitmask
  calculateBitmask(
    map: number[][],
    row: number,
    col: number,
    targetTileType: number
  ): number {
    let bitmask = 0;

    // 检查北方
    if (this.isSameTile(map, row - 1, col, targetTileType)) {
      bitmask |= Direction4.North;
    }
    // 检查东方
    if (this.isSameTile(map, row, col + 1, targetTileType)) {
      bitmask |= Direction4.East;
    }
    // 检查南方
    if (this.isSameTile(map, row + 1, col, targetTileType)) {
      bitmask |= Direction4.South;
    }
    // 检查西方
    if (this.isSameTile(map, row, col - 1, targetTileType)) {
      bitmask |= Direction4.West;
    }

    return bitmask;
  }

  private isSameTile(
    map: number[][],
    row: number,
    col: number,
    targetTileType: number
  ): boolean {
    if (row < 0 || row >= map.length) return false;
    if (col < 0 || col >= map[0].length) return false;
    return map[row][col] === targetTileType;
  }

  // 获取应该使用的瓦片 ID
  getTileIndex(bitmask: number): number {
    return this.tileMapping.get(bitmask) ?? 0;
  }

  // 更新整个地图的自动瓦片
  updateMap(map: number[][], targetTileType: number): number[][] {
    const result: number[][] = [];

    for (let row = 0; row < map.length; row++) {
      result[row] = [];
      for (let col = 0; col < map[row].length; col++) {
        if (map[row][col] === targetTileType) {
          const bitmask = this.calculateBitmask(map, row, col, targetTileType);
          result[row][col] = this.getTileIndex(bitmask);
        } else {
          result[row][col] = map[row][col];
        }
      }
    }

    return result;
  }
}

// 使用示例：创建 4-方向自动瓦片映射
function create4DirectionMapping(): Map<number, number> {
  // 假设瓦片集布局如下（索引从 0 开始）：
  // 0: 孤立  1: 北    2: 东    3: 北东
  // 4: 南    5: 南北  6: 东南  7: 东南北
  // 8: 西    9: 西北  10: 东西 11: 东西北
  // 12: 西南 13: 西南北 14: 东西南 15: 全包围

  const mapping = new Map<number, number>();

  mapping.set(0, 0);   // 孤立
  mapping.set(1, 1);   // 只有北
  mapping.set(2, 2);   // 只有东
  mapping.set(3, 3);   // 北+东
  mapping.set(4, 4);   // 只有南
  mapping.set(5, 5);   // 北+南
  mapping.set(6, 6);   // 东+南
  mapping.set(7, 7);   // 北+东+南
  mapping.set(8, 8);   // 只有西
  mapping.set(9, 9);   // 北+西
  mapping.set(10, 10); // 东+西
  mapping.set(11, 11); // 北+东+西
  mapping.set(12, 12); // 南+西
  mapping.set(13, 13); // 北+南+西
  mapping.set(14, 14); // 东+南+西
  mapping.set(15, 15); // 全包围

  return mapping;
}
```

### 8-方向自动瓦片（Wang Tiles）

8-方向自动瓦片考虑了角落，可以产生更自然的效果：

```typescript
enum Direction8 {
  NorthWest = 1,
  North = 2,
  NorthEast = 4,
  East = 8,
  SouthEast = 16,
  South = 32,
  SouthWest = 64,
  West = 128
}

class AutoTiler8 {
  private tileMapping: Map<number, number>;

  constructor(tileMapping: Map<number, number>) {
    this.tileMapping = tileMapping;
  }

  calculateBitmask(
    map: number[][],
    row: number,
    col: number,
    targetTileType: number
  ): number {
    let bitmask = 0;

    // 首先检查四个主方向
    const north = this.isSameTile(map, row - 1, col, targetTileType);
    const east = this.isSameTile(map, row, col + 1, targetTileType);
    const south = this.isSameTile(map, row + 1, col, targetTileType);
    const west = this.isSameTile(map, row, col - 1, targetTileType);

    if (north) bitmask |= Direction8.North;
    if (east) bitmask |= Direction8.East;
    if (south) bitmask |= Direction8.South;
    if (west) bitmask |= Direction8.West;

    // 角落只在相邻的两个主方向都存在时才计算
    // 这样可以避免不必要的角落瓦片
    if (north && west && this.isSameTile(map, row - 1, col - 1, targetTileType)) {
      bitmask |= Direction8.NorthWest;
    }
    if (north && east && this.isSameTile(map, row - 1, col + 1, targetTileType)) {
      bitmask |= Direction8.NorthEast;
    }
    if (south && east && this.isSameTile(map, row + 1, col + 1, targetTileType)) {
      bitmask |= Direction8.SouthEast;
    }
    if (south && west && this.isSameTile(map, row + 1, col - 1, targetTileType)) {
      bitmask |= Direction8.SouthWest;
    }

    return bitmask;
  }

  private isSameTile(
    map: number[][],
    row: number,
    col: number,
    targetTileType: number
  ): boolean {
    if (row < 0 || row >= map.length) return false;
    if (col < 0 || col >= map[0].length) return false;
    return map[row][col] === targetTileType;
  }

  // 简化的 bitmask：将 256 种可能简化为 47 种常用情况
  simplifyBitmask(bitmask: number): number {
    // 移除不必要的角落位
    // 如果北方没有瓦片，则西北和东北角无意义
    if (!(bitmask & Direction8.North)) {
      bitmask &= ~Direction8.NorthWest;
      bitmask &= ~Direction8.NorthEast;
    }
    if (!(bitmask & Direction8.South)) {
      bitmask &= ~Direction8.SouthWest;
      bitmask &= ~Direction8.SouthEast;
    }
    if (!(bitmask & Direction8.West)) {
      bitmask &= ~Direction8.NorthWest;
      bitmask &= ~Direction8.SouthWest;
    }
    if (!(bitmask & Direction8.East)) {
      bitmask &= ~Direction8.NorthEast;
      bitmask &= ~Direction8.SouthEast;
    }

    return bitmask;
  }

  getTileIndex(bitmask: number): number {
    const simplified = this.simplifyBitmask(bitmask);
    return this.tileMapping.get(simplified) ?? 0;
  }
}
```

### 地形混合自动瓦片

当多种地形需要相互过渡时，需要更复杂的混合系统：

```typescript
interface TerrainTransition {
  from: number;
  to: number;
  tiles: {
    corner: number[];      // 角落过渡瓦片
    edge: number[];        // 边缘过渡瓦片
  };
}

class TerrainBlender {
  private transitions: Map<string, TerrainTransition> = new Map();

  registerTransition(from: number, to: number, tiles: TerrainTransition['tiles']): void {
    const key = `${from}_${to}`;
    this.transitions.set(key, { from, to, tiles });
  }

  getTransitionTile(
    map: number[][],
    row: number,
    col: number,
    currentTerrain: number
  ): number | null {
    const neighbors = this.getNeighborTerrains(map, row, col);

    // 检查是否需要过渡
    for (const [terrain, positions] of neighbors) {
      if (terrain !== currentTerrain) {
        const key = `${currentTerrain}_${terrain}`;
        const transition = this.transitions.get(key);
        if (transition) {
          return this.selectTransitionTile(transition, positions);
        }
      }
    }

    return null;
  }

  private getNeighborTerrains(
    map: number[][],
    row: number,
    col: number
  ): Map<number, string[]> {
    const neighbors = new Map<number, string[]>();
    const directions = [
      ['nw', -1, -1], ['n', -1, 0], ['ne', -1, 1],
      ['w', 0, -1],                  ['e', 0, 1],
      ['sw', 1, -1],  ['s', 1, 0],   ['se', 1, 1]
    ] as const;

    for (const [name, dRow, dCol] of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;

      if (newRow >= 0 && newRow < map.length &&
          newCol >= 0 && newCol < map[0].length) {
        const terrain = map[newRow][newCol];
        if (!neighbors.has(terrain)) {
          neighbors.set(terrain, []);
        }
        neighbors.get(terrain)!.push(name);
      }
    }

    return neighbors;
  }

  private selectTransitionTile(
    transition: TerrainTransition,
    positions: string[]
  ): number {
    // 根据位置选择合适的过渡瓦片
    const isCorner = positions.some(p =>
      ['nw', 'ne', 'sw', 'se'].includes(p)
    );

    if (isCorner && transition.tiles.corner.length > 0) {
      return transition.tiles.corner[
        Math.floor(Math.random() * transition.tiles.corner.length)
      ];
    }

    return transition.tiles.edge[
      Math.floor(Math.random() * transition.tiles.edge.length)
    ];
  }
}
```

## 碰撞层设计

### 碰撞数据结构

```typescript
enum CollisionType {
  None = 0,
  Solid = 1,
  Platform = 2,      // 单向平台（可从下方穿过）
  Ladder = 3,
  Water = 4,
  Hazard = 5
}

interface CollisionLayer {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  data: CollisionType[][];
}

class CollisionSystem {
  private layer: CollisionLayer;

  constructor(layer: CollisionLayer) {
    this.layer = layer;
  }

  // 获取指定位置的碰撞类型
  getCollisionAt(worldX: number, worldY: number): CollisionType {
    const col = Math.floor(worldX / this.layer.tileWidth);
    const row = Math.floor(worldY / this.layer.tileHeight);

    if (row < 0 || row >= this.layer.height ||
        col < 0 || col >= this.layer.width) {
      return CollisionType.Solid; // 地图边界视为实体
    }

    return this.layer.data[row][col];
  }

  // 检查矩形区域是否与实体碰撞
  checkRectCollision(
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    const startCol = Math.floor(x / this.layer.tileWidth);
    const endCol = Math.floor((x + width) / this.layer.tileWidth);
    const startRow = Math.floor(y / this.layer.tileHeight);
    const endRow = Math.floor((y + height) / this.layer.tileHeight);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const collision = this.getCollisionAtTile(col, row);
        if (collision === CollisionType.Solid) {
          return true;
        }
      }
    }

    return false;
  }

  // 获取碰撞后的修正位置
  resolveCollision(
    x: number,
    y: number,
    width: number,
    height: number,
    velocityX: number,
    velocityY: number
  ): { x: number; y: number; collisionX: boolean; collisionY: boolean } {
    let newX = x + velocityX;
    let newY = y + velocityY;
    let collisionX = false;
    let collisionY = false;

    // 先处理 X 轴
    if (this.checkRectCollision(newX, y, width, height)) {
      collisionX = true;
      if (velocityX > 0) {
        // 向右移动，对齐到瓦片左边
        const col = Math.floor((newX + width) / this.layer.tileWidth);
        newX = col * this.layer.tileWidth - width - 0.01;
      } else {
        // 向左移动，对齐到瓦片右边
        const col = Math.floor(newX / this.layer.tileWidth);
        newX = (col + 1) * this.layer.tileWidth + 0.01;
      }
    }

    // 再处理 Y 轴
    if (this.checkRectCollision(newX, newY, width, height)) {
      collisionY = true;
      if (velocityY > 0) {
        // 向下移动，对齐到瓦片上边
        const row = Math.floor((newY + height) / this.layer.tileHeight);
        newY = row * this.layer.tileHeight - height - 0.01;
      } else {
        // 向上移动，对齐到瓦片下边
        const row = Math.floor(newY / this.layer.tileHeight);
        newY = (row + 1) * this.layer.tileHeight + 0.01;
      }
    }

    return { x: newX, y: newY, collisionX, collisionY };
  }

  private getCollisionAtTile(col: number, row: number): CollisionType {
    if (row < 0 || row >= this.layer.height ||
        col < 0 || col >= this.layer.width) {
      return CollisionType.Solid;
    }
    return this.layer.data[row][col];
  }
}
```

### 单向平台处理

```typescript
class PlatformCollision {
  private collisionSystem: CollisionSystem;
  private layer: CollisionLayer;

  constructor(layer: CollisionLayer) {
    this.layer = layer;
    this.collisionSystem = new CollisionSystem(layer);
  }

  // 检查是否可以落到平台上
  checkPlatformCollision(
    x: number,
    y: number,
    width: number,
    height: number,
    velocityY: number,
    previousY: number
  ): { landed: boolean; newY: number } {
    // 只在向下移动时检查平台
    if (velocityY <= 0) {
      return { landed: false, newY: y };
    }

    const col = Math.floor((x + width / 2) / this.layer.tileWidth);
    const currentRow = Math.floor((y + height) / this.layer.tileHeight);
    const previousRow = Math.floor((previousY + height) / this.layer.tileHeight);

    // 检查是否穿过了平台
    for (let row = previousRow; row <= currentRow; row++) {
      const collision = this.getCollisionAtTile(col, row);

      if (collision === CollisionType.Platform) {
        const platformTop = row * this.layer.tileHeight;

        // 检查上一帧是否在平台上方
        if (previousY + height <= platformTop) {
          return {
            landed: true,
            newY: platformTop - height
          };
        }
      }
    }

    return { landed: false, newY: y };
  }

  // 检查是否可以下穿平台
  canDropThrough(x: number, y: number, width: number, height: number): boolean {
    const col = Math.floor((x + width / 2) / this.layer.tileWidth);
    const row = Math.floor((y + height + 1) / this.layer.tileHeight);

    return this.getCollisionAtTile(col, row) === CollisionType.Platform;
  }

  private getCollisionAtTile(col: number, row: number): CollisionType {
    if (row < 0 || row >= this.layer.height ||
        col < 0 || col >= this.layer.width) {
      return CollisionType.None;
    }
    return this.layer.data[row][col];
  }
}
```

## 分层渲染系统

### 图层管理器

```typescript
interface RenderLayer {
  name: string;
  zIndex: number;
  parallaxX: number;       // X 轴视差系数
  parallaxY: number;       // Y 轴视差系数
  offsetX: number;
  offsetY: number;
  visible: boolean;
  opacity: number;
  data: number[][];
}

class LayerManager {
  private layers: Map<string, RenderLayer> = new Map();
  private sortedLayers: RenderLayer[] = [];

  addLayer(layer: RenderLayer): void {
    this.layers.set(layer.name, layer);
    this.updateSortedLayers();
  }

  removeLayer(name: string): void {
    this.layers.delete(name);
    this.updateSortedLayers();
  }

  getLayer(name: string): RenderLayer | undefined {
    return this.layers.get(name);
  }

  setLayerVisibility(name: string, visible: boolean): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.visible = visible;
    }
  }

  setLayerOpacity(name: string, opacity: number): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity));
    }
  }

  private updateSortedLayers(): void {
    this.sortedLayers = Array.from(this.layers.values())
      .sort((a, b) => a.zIndex - b.zIndex);
  }

  // 获取按 zIndex 排序的图层（用于渲染）
  getSortedLayers(): RenderLayer[] {
    return this.sortedLayers;
  }
}
```

### 视差滚动实现

```typescript
class ParallaxRenderer {
  private ctx: CanvasRenderingContext2D;
  private tileWidth: number;
  private tileHeight: number;
  private tileset: Tileset;

  constructor(
    ctx: CanvasRenderingContext2D,
    tileset: Tileset,
    tileWidth: number,
    tileHeight: number
  ) {
    this.ctx = ctx;
    this.tileset = tileset;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
  }

  renderLayer(
    layer: RenderLayer,
    cameraX: number,
    cameraY: number
  ): void {
    if (!layer.visible) return;

    // 应用视差效果
    const parallaxCameraX = cameraX * layer.parallaxX + layer.offsetX;
    const parallaxCameraY = cameraY * layer.parallaxY + layer.offsetY;

    // 计算可见区域
    const startCol = Math.floor(parallaxCameraX / this.tileWidth);
    const endCol = startCol + Math.ceil(this.ctx.canvas.width / this.tileWidth) + 1;
    const startRow = Math.floor(parallaxCameraY / this.tileHeight);
    const endRow = startRow + Math.ceil(this.ctx.canvas.height / this.tileHeight) + 1;

    this.ctx.globalAlpha = layer.opacity;

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        // 处理循环背景
        const wrapCol = this.wrapIndex(col, layer.data[0]?.length ?? 0);
        const wrapRow = this.wrapIndex(row, layer.data.length);

        const tileId = layer.data[wrapRow]?.[wrapCol];
        if (!tileId) continue;

        const tile = this.tileset.tiles.get(tileId);
        if (!tile) continue;

        const destX = col * this.tileWidth - parallaxCameraX;
        const destY = row * this.tileHeight - parallaxCameraY;

        this.ctx.drawImage(
          this.tileset.image,
          tile.textureX * this.tileset.tileWidth,
          tile.textureY * this.tileset.tileHeight,
          this.tileset.tileWidth,
          this.tileset.tileHeight,
          destX,
          destY,
          this.tileWidth,
          this.tileHeight
        );
      }
    }

    this.ctx.globalAlpha = 1;
  }

  // 循环索引（用于无限滚动背景）
  private wrapIndex(index: number, max: number): number {
    if (max <= 0) return 0;
    return ((index % max) + max) % max;
  }
}
```

### 层级排序与遮挡

对于需要角色与环境正确遮挡的场景，可以使用 Y-sorting：

```typescript
interface Renderable {
  x: number;
  y: number;
  zIndex: number;
  render(ctx: CanvasRenderingContext2D): void;
}

class YSortRenderer {
  private renderables: Renderable[] = [];
  private staticLayers: RenderLayer[] = [];

  addRenderable(renderable: Renderable): void {
    this.renderables.push(renderable);
  }

  removeRenderable(renderable: Renderable): void {
    const index = this.renderables.indexOf(renderable);
    if (index !== -1) {
      this.renderables.splice(index, 1);
    }
  }

  setStaticLayers(layers: RenderLayer[]): void {
    this.staticLayers = layers;
  }

  render(ctx: CanvasRenderingContext2D): void {
    // 收集所有需要排序的元素
    const allItems: Array<{
      y: number;
      zIndex: number;
      render: () => void;
    }> = [];

    // 添加静态图层（按行拆分）
    for (const layer of this.staticLayers) {
      if (layer.zIndex > 0) { // 只对前景层进行 Y-sorting
        for (let row = 0; row < layer.data.length; row++) {
          allItems.push({
            y: row * 32, // 假设瓦片高度为 32
            zIndex: layer.zIndex,
            render: () => this.renderRow(ctx, layer, row)
          });
        }
      }
    }

    // 添加动态对象
    for (const renderable of this.renderables) {
      allItems.push({
        y: renderable.y,
        zIndex: renderable.zIndex,
        render: () => renderable.render(ctx)
      });
    }

    // 按 Y 坐标和 zIndex 排序
    allItems.sort((a, b) => {
      if (a.zIndex !== b.zIndex) return a.zIndex - b.zIndex;
      return a.y - b.y;
    });

    // 渲染
    for (const item of allItems) {
      item.render();
    }
  }

  private renderRow(
    ctx: CanvasRenderingContext2D,
    layer: RenderLayer,
    row: number
  ): void {
    // 渲染单行的实现
    // ...
  }
}
```

## Tiled 编辑器集成

Tiled 是最流行的开源瓦片地图编辑器，支持导出 JSON 和 TMX 格式。

### 加载 Tiled JSON 格式

```typescript
interface TiledMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayer[];
  tilesets: TiledTileset[];
  properties?: TiledProperty[];
}

interface TiledLayer {
  name: string;
  type: 'tilelayer' | 'objectgroup' | 'imagelayer' | 'group';
  width: number;
  height: number;
  data?: number[];
  objects?: TiledObject[];
  visible: boolean;
  opacity: number;
  offsetx?: number;
  offsety?: number;
  properties?: TiledProperty[];
}

interface TiledTileset {
  firstgid: number;
  name: string;
  tilewidth: number;
  tileheight: number;
  tilecount: number;
  columns: number;
  image: string;
  imagewidth: number;
  imageheight: number;
  tiles?: TiledTile[];
}

interface TiledTile {
  id: number;
  properties?: TiledProperty[];
  animation?: TiledAnimation[];
}

interface TiledAnimation {
  tileid: number;
  duration: number;
}

interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  visible: boolean;
  properties?: TiledProperty[];
}

interface TiledProperty {
  name: string;
  type: string;
  value: any;
}

class TiledMapLoader {
  private basePath: string;

  constructor(basePath: string = '') {
    this.basePath = basePath;
  }

  async loadMap(jsonPath: string): Promise<Tilemap> {
    const response = await fetch(this.basePath + jsonPath);
    const data: TiledMap = await response.json();

    // 加载所有瓦片集
    const tilesets = await Promise.all(
      data.tilesets.map(ts => this.loadTileset(ts))
    );

    // 转换图层
    const layers = this.convertLayers(data.layers, data.width, data.height);

    // 创建碰撞层
    const collisionLayer = this.createCollisionLayer(
      data.layers,
      data.width,
      data.height,
      data.tilesets
    );

    return {
      tileWidth: data.tilewidth,
      tileHeight: data.tileheight,
      width: data.width,
      height: data.height,
      tilesets,
      layers,
      collisionLayer
    };
  }

  private async loadTileset(tilesetData: TiledTileset): Promise<Tileset> {
    const image = await this.loadImage(this.basePath + tilesetData.image);

    const tiles = new Map<number, Tile>();

    for (let i = 0; i < tilesetData.tilecount; i++) {
      const globalId = tilesetData.firstgid + i;
      const col = i % tilesetData.columns;
      const row = Math.floor(i / tilesetData.columns);

      // 查找瓦片特定属性
      const tileData = tilesetData.tiles?.find(t => t.id === i);
      const collider = this.getPropertyValue(tileData?.properties, 'collider', false);

      tiles.set(globalId, {
        id: globalId,
        textureX: col,
        textureY: row,
        collider,
        properties: this.convertProperties(tileData?.properties)
      });
    }

    return {
      image,
      tileWidth: tilesetData.tilewidth,
      tileHeight: tilesetData.tileheight,
      columns: tilesetData.columns,
      rows: Math.ceil(tilesetData.tilecount / tilesetData.columns),
      tiles
    };
  }

  private convertLayers(
    tiledLayers: TiledLayer[],
    width: number,
    height: number
  ): TilemapLayer[] {
    const layers: TilemapLayer[] = [];
    let zIndex = 0;

    for (const tiledLayer of tiledLayers) {
      if (tiledLayer.type === 'tilelayer' && tiledLayer.data) {
        // 将一维数组转换为二维数组
        const data: number[][] = [];
        for (let row = 0; row < height; row++) {
          data[row] = tiledLayer.data.slice(row * width, (row + 1) * width);
        }

        layers.push({
          name: tiledLayer.name,
          width,
          height,
          data,
          visible: tiledLayer.visible,
          opacity: tiledLayer.opacity,
          zIndex: zIndex++
        });
      }
    }

    return layers;
  }

  private createCollisionLayer(
    tiledLayers: TiledLayer[],
    width: number,
    height: number,
    tilesets: TiledTileset[]
  ): boolean[][] {
    // 查找名为 "collision" 的图层
    const collisionTiledLayer = tiledLayers.find(
      l => l.name.toLowerCase() === 'collision' && l.type === 'tilelayer'
    );

    const collision: boolean[][] = [];

    for (let row = 0; row < height; row++) {
      collision[row] = [];
      for (let col = 0; col < width; col++) {
        if (collisionTiledLayer?.data) {
          const tileId = collisionTiledLayer.data[row * width + col];
          collision[row][col] = tileId !== 0;
        } else {
          collision[row][col] = false;
        }
      }
    }

    return collision;
  }

  private getPropertyValue(
    properties: TiledProperty[] | undefined,
    name: string,
    defaultValue: any
  ): any {
    const prop = properties?.find(p => p.name === name);
    return prop?.value ?? defaultValue;
  }

  private convertProperties(
    tiledProperties: TiledProperty[] | undefined
  ): Map<string, any> {
    const properties = new Map<string, any>();

    if (tiledProperties) {
      for (const prop of tiledProperties) {
        properties.set(prop.name, prop.value);
      }
    }

    return properties;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}

// 使用示例
async function loadGameLevel(): Promise<void> {
  const loader = new TiledMapLoader('/assets/maps/');
  const tilemap = await loader.loadMap('level1.json');

  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const renderer = new TilemapRenderer(canvas, tilemap);

  renderer.render();
}
```

### 对象层处理

Tiled 的对象层可用于放置实体、触发器等：

```typescript
interface GameEntity {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties: Map<string, any>;
}

class ObjectLayerParser {
  parseObjectLayer(layer: TiledLayer): GameEntity[] {
    if (layer.type !== 'objectgroup' || !layer.objects) {
      return [];
    }

    return layer.objects.map(obj => ({
      type: obj.type || obj.name,
      x: obj.x,
      y: obj.y,
      width: obj.width,
      height: obj.height,
      properties: this.convertProperties(obj.properties)
    }));
  }

  private convertProperties(
    tiledProperties: TiledProperty[] | undefined
  ): Map<string, any> {
    const properties = new Map<string, any>();

    if (tiledProperties) {
      for (const prop of tiledProperties) {
        properties.set(prop.name, prop.value);
      }
    }

    return properties;
  }

  // 根据类型创建游戏对象
  createGameObjects(entities: GameEntity[]): void {
    for (const entity of entities) {
      switch (entity.type) {
        case 'spawn_point':
          this.createSpawnPoint(entity);
          break;
        case 'enemy':
          this.createEnemy(entity);
          break;
        case 'collectible':
          this.createCollectible(entity);
          break;
        case 'trigger':
          this.createTrigger(entity);
          break;
        default:
          console.warn(`Unknown entity type: ${entity.type}`);
      }
    }
  }

  private createSpawnPoint(entity: GameEntity): void {
    // 实现生成点逻辑
  }

  private createEnemy(entity: GameEntity): void {
    // 实现敌人创建逻辑
  }

  private createCollectible(entity: GameEntity): void {
    // 实现收集物创建逻辑
  }

  private createTrigger(entity: GameEntity): void {
    // 实现触发器创建逻辑
  }
}
```

## 程序化地图生成

### 基于噪声的地形生成

```typescript
class NoiseGenerator {
  private permutation: number[];

  constructor(seed: number = 0) {
    this.permutation = this.generatePermutation(seed);
  }

  private generatePermutation(seed: number): number[] {
    const perm = Array.from({ length: 256 }, (_, i) => i);

    // 使用种子进行洗牌
    let random = seed;
    for (let i = perm.length - 1; i > 0; i--) {
      random = (random * 1103515245 + 12345) & 0x7fffffff;
      const j = random % (i + 1);
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }

    // 复制一份以避免边界问题
    return [...perm, ...perm];
  }

  // 柏林噪声
  perlin2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.permutation[this.permutation[X] + Y];
    const ab = this.permutation[this.permutation[X] + Y + 1];
    const ba = this.permutation[this.permutation[X + 1] + Y];
    const bb = this.permutation[this.permutation[X + 1] + Y + 1];

    const x1 = this.lerp(
      this.grad(aa, xf, yf),
      this.grad(ba, xf - 1, yf),
      u
    );
    const x2 = this.lerp(
      this.grad(ab, xf, yf - 1),
      this.grad(bb, xf - 1, yf - 1),
      u
    );

    return this.lerp(x1, x2, v);
  }

  // 分形噪声（多层叠加）
  fractalNoise(
    x: number,
    y: number,
    octaves: number = 4,
    persistence: number = 0.5,
    lacunarity: number = 2
  ): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.perlin2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
  }
}

// 地形生成器
interface TerrainConfig {
  waterLevel: number;
  sandLevel: number;
  grassLevel: number;
  forestLevel: number;
  mountainLevel: number;
}

class TerrainGenerator {
  private noise: NoiseGenerator;
  private config: TerrainConfig;

  constructor(seed: number, config?: Partial<TerrainConfig>) {
    this.noise = new NoiseGenerator(seed);
    this.config = {
      waterLevel: -0.2,
      sandLevel: 0,
      grassLevel: 0.3,
      forestLevel: 0.5,
      mountainLevel: 0.7,
      ...config
    };
  }

  generateTerrain(width: number, height: number, scale: number = 0.1): number[][] {
    const terrain: number[][] = [];

    for (let y = 0; y < height; y++) {
      terrain[y] = [];
      for (let x = 0; x < width; x++) {
        const elevation = this.noise.fractalNoise(x * scale, y * scale, 4, 0.5, 2);
        terrain[y][x] = this.getTerrainType(elevation);
      }
    }

    return terrain;
  }

  private getTerrainType(elevation: number): number {
    // 返回对应的瓦片类型 ID
    if (elevation < this.config.waterLevel) return 1;  // 深水
    if (elevation < this.config.sandLevel) return 2;   // 浅水/沙滩
    if (elevation < this.config.grassLevel) return 3;  // 草地
    if (elevation < this.config.forestLevel) return 4; // 树林
    if (elevation < this.config.mountainLevel) return 5; // 山地
    return 6; // 雪山
  }
}
```

### 洞穴生成（元胞自动机）

```typescript
class CaveGenerator {
  private width: number;
  private height: number;
  private fillProbability: number;

  constructor(width: number, height: number, fillProbability: number = 0.45) {
    this.width = width;
    this.height = height;
    this.fillProbability = fillProbability;
  }

  generate(iterations: number = 5, seed?: number): number[][] {
    let map = this.initializeMap(seed);

    for (let i = 0; i < iterations; i++) {
      map = this.simulationStep(map);
    }

    return map;
  }

  private initializeMap(seed?: number): number[][] {
    const map: number[][] = [];
    let random = seed ?? Date.now();

    for (let y = 0; y < this.height; y++) {
      map[y] = [];
      for (let x = 0; x < this.width; x++) {
        // 边界强制为墙
        if (x === 0 || x === this.width - 1 ||
            y === 0 || y === this.height - 1) {
          map[y][x] = 1;
        } else {
          random = (random * 1103515245 + 12345) & 0x7fffffff;
          map[y][x] = (random / 0x7fffffff) < this.fillProbability ? 1 : 0;
        }
      }
    }

    return map;
  }

  private simulationStep(map: number[][]): number[][] {
    const newMap: number[][] = [];

    for (let y = 0; y < this.height; y++) {
      newMap[y] = [];
      for (let x = 0; x < this.width; x++) {
        const neighbors = this.countNeighbors(map, x, y);

        // 规则：
        // - 如果邻居墙数 > 4，变成墙
        // - 如果邻居墙数 < 4，变成空地
        // - 如果邻居墙数 = 4，保持不变
        if (neighbors > 4) {
          newMap[y][x] = 1;
        } else if (neighbors < 4) {
          newMap[y][x] = 0;
        } else {
          newMap[y][x] = map[y][x];
        }
      }
    }

    return newMap;
  }

  private countNeighbors(map: number[][], x: number, y: number): number {
    let count = 0;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
          count++; // 边界外视为墙
        } else if (map[ny][nx] === 1) {
          count++;
        }
      }
    }

    return count;
  }

  // 确保洞穴连通性
  ensureConnectivity(map: number[][]): number[][] {
    const regions = this.findRegions(map);

    if (regions.length <= 1) return map;

    // 连接所有区域到最大区域
    const largestRegion = regions.reduce((a, b) =>
      a.length > b.length ? a : b
    );

    for (const region of regions) {
      if (region === largestRegion) continue;
      this.connectRegions(map, region, largestRegion);
    }

    return map;
  }

  private findRegions(map: number[][]): Array<Array<{ x: number; y: number }>> {
    const visited: boolean[][] = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(false));

    const regions: Array<Array<{ x: number; y: number }>> = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!visited[y][x] && map[y][x] === 0) {
          const region = this.floodFill(map, visited, x, y);
          regions.push(region);
        }
      }
    }

    return regions;
  }

  private floodFill(
    map: number[][],
    visited: boolean[][],
    startX: number,
    startY: number
  ): Array<{ x: number; y: number }> {
    const region: Array<{ x: number; y: number }> = [];
    const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;

      if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
      if (visited[y][x] || map[y][x] === 1) continue;

      visited[y][x] = true;
      region.push({ x, y });

      queue.push({ x: x + 1, y });
      queue.push({ x: x - 1, y });
      queue.push({ x, y: y + 1 });
      queue.push({ x, y: y - 1 });
    }

    return region;
  }

  private connectRegions(
    map: number[][],
    regionA: Array<{ x: number; y: number }>,
    regionB: Array<{ x: number; y: number }>
  ): void {
    // 找到两个区域之间最近的点对
    let minDist = Infinity;
    let pointA = regionA[0];
    let pointB = regionB[0];

    for (const a of regionA) {
      for (const b of regionB) {
        const dist = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        if (dist < minDist) {
          minDist = dist;
          pointA = a;
          pointB = b;
        }
      }
    }

    // 创建通道
    this.createPassage(map, pointA, pointB, 1);
  }

  private createPassage(
    map: number[][],
    from: { x: number; y: number },
    to: { x: number; y: number },
    radius: number
  ): void {
    let x = from.x;
    let y = from.y;

    while (x !== to.x || y !== to.y) {
      // 在当前位置创建圆形空地
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy <= radius * radius) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx > 0 && nx < this.width - 1 &&
                ny > 0 && ny < this.height - 1) {
              map[ny][nx] = 0;
            }
          }
        }
      }

      // 移动到下一个位置
      if (Math.random() < 0.5) {
        x += Math.sign(to.x - x);
      } else {
        y += Math.sign(to.y - y);
      }
    }
  }
}
```

### 房间与走廊生成（BSP）

```typescript
interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  center: { x: number; y: number };
}

class BSPDungeonGenerator {
  private minRoomSize: number;
  private maxRoomSize: number;
  private minSplitRatio: number;
  private maxSplitRatio: number;

  constructor(config?: {
    minRoomSize?: number;
    maxRoomSize?: number;
    minSplitRatio?: number;
    maxSplitRatio?: number;
  }) {
    this.minRoomSize = config?.minRoomSize ?? 6;
    this.maxRoomSize = config?.maxRoomSize ?? 15;
    this.minSplitRatio = config?.minSplitRatio ?? 0.4;
    this.maxSplitRatio = config?.maxSplitRatio ?? 0.6;
  }

  generate(width: number, height: number, depth: number): number[][] {
    const map: number[][] = Array(height)
      .fill(null)
      .map(() => Array(width).fill(1)); // 初始全是墙

    const rooms: Room[] = [];
    const root = { x: 1, y: 1, width: width - 2, height: height - 2 };

    this.splitNode(root, depth, rooms);

    // 绘制房间
    for (const room of rooms) {
      this.carveRoom(map, room);
    }

    // 连接房间
    this.connectRooms(map, rooms);

    return map;
  }

  private splitNode(
    node: { x: number; y: number; width: number; height: number },
    depth: number,
    rooms: Room[]
  ): void {
    if (depth <= 0 ||
        node.width < this.minRoomSize * 2 ||
        node.height < this.minRoomSize * 2) {
      // 创建房间
      const room = this.createRoom(node);
      rooms.push(room);
      return;
    }

    // 决定分割方向
    const splitHorizontal = node.width < node.height
      ? true
      : node.width > node.height
        ? false
        : Math.random() < 0.5;

    if (splitHorizontal) {
      const splitY = Math.floor(
        node.y + node.height * (this.minSplitRatio +
          Math.random() * (this.maxSplitRatio - this.minSplitRatio))
      );

      this.splitNode(
        { x: node.x, y: node.y, width: node.width, height: splitY - node.y },
        depth - 1,
        rooms
      );
      this.splitNode(
        { x: node.x, y: splitY, width: node.width, height: node.y + node.height - splitY },
        depth - 1,
        rooms
      );
    } else {
      const splitX = Math.floor(
        node.x + node.width * (this.minSplitRatio +
          Math.random() * (this.maxSplitRatio - this.minSplitRatio))
      );

      this.splitNode(
        { x: node.x, y: node.y, width: splitX - node.x, height: node.height },
        depth - 1,
        rooms
      );
      this.splitNode(
        { x: splitX, y: node.y, width: node.x + node.width - splitX, height: node.height },
        depth - 1,
        rooms
      );
    }
  }

  private createRoom(
    node: { x: number; y: number; width: number; height: number }
  ): Room {
    const roomWidth = Math.min(
      this.maxRoomSize,
      this.minRoomSize + Math.floor(Math.random() * (node.width - this.minRoomSize))
    );
    const roomHeight = Math.min(
      this.maxRoomSize,
      this.minRoomSize + Math.floor(Math.random() * (node.height - this.minRoomSize))
    );

    const x = node.x + Math.floor(Math.random() * (node.width - roomWidth));
    const y = node.y + Math.floor(Math.random() * (node.height - roomHeight));

    return {
      x,
      y,
      width: roomWidth,
      height: roomHeight,
      center: {
        x: Math.floor(x + roomWidth / 2),
        y: Math.floor(y + roomHeight / 2)
      }
    };
  }

  private carveRoom(map: number[][], room: Room): void {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < map.length && x >= 0 && x < map[0].length) {
          map[y][x] = 0;
        }
      }
    }
  }

  private connectRooms(map: number[][], rooms: Room[]): void {
    for (let i = 1; i < rooms.length; i++) {
      const roomA = rooms[i - 1];
      const roomB = rooms[i];

      // 使用 L 形走廊连接
      if (Math.random() < 0.5) {
        this.carveHorizontalCorridor(map, roomA.center.x, roomB.center.x, roomA.center.y);
        this.carveVerticalCorridor(map, roomA.center.y, roomB.center.y, roomB.center.x);
      } else {
        this.carveVerticalCorridor(map, roomA.center.y, roomB.center.y, roomA.center.x);
        this.carveHorizontalCorridor(map, roomA.center.x, roomB.center.x, roomB.center.y);
      }
    }
  }

  private carveHorizontalCorridor(
    map: number[][],
    x1: number,
    x2: number,
    y: number
  ): void {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);

    for (let x = minX; x <= maxX; x++) {
      if (y >= 0 && y < map.length && x >= 0 && x < map[0].length) {
        map[y][x] = 0;
      }
    }
  }

  private carveVerticalCorridor(
    map: number[][],
    y1: number,
    y2: number,
    x: number
  ): void {
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    for (let y = minY; y <= maxY; y++) {
      if (y >= 0 && y < map.length && x >= 0 && x < map[0].length) {
        map[y][x] = 0;
      }
    }
  }
}
```

## 性能优化

### 视口裁剪优化

只渲染可见区域是最基本的优化：

```typescript
class OptimizedTilemapRenderer {
  private ctx: CanvasRenderingContext2D;
  private tilemap: Tilemap;
  private viewportBuffer: number; // 额外缓冲区（瓦片数）

  constructor(canvas: HTMLCanvasElement, tilemap: Tilemap, buffer: number = 2) {
    this.ctx = canvas.getContext('2d')!;
    this.tilemap = tilemap;
    this.viewportBuffer = buffer;
  }

  render(cameraX: number, cameraY: number): void {
    const { tileWidth, tileHeight, width, height } = this.tilemap;
    const canvasWidth = this.ctx.canvas.width;
    const canvasHeight = this.ctx.canvas.height;

    // 计算可见范围（带缓冲）
    const startCol = Math.max(0, Math.floor(cameraX / tileWidth) - this.viewportBuffer);
    const endCol = Math.min(
      width,
      Math.ceil((cameraX + canvasWidth) / tileWidth) + this.viewportBuffer
    );
    const startRow = Math.max(0, Math.floor(cameraY / tileHeight) - this.viewportBuffer);
    const endRow = Math.min(
      height,
      Math.ceil((cameraY + canvasHeight) / tileHeight) + this.viewportBuffer
    );

    // 只遍历可见区域
    for (const layer of this.tilemap.layers) {
      if (!layer.visible) continue;

      for (let row = startRow; row < endRow; row++) {
        for (let col = startCol; col < endCol; col++) {
          this.renderTile(layer, row, col, cameraX, cameraY);
        }
      }
    }
  }

  private renderTile(
    layer: TilemapLayer,
    row: number,
    col: number,
    cameraX: number,
    cameraY: number
  ): void {
    // 渲染单个瓦片的逻辑
    // ...
  }
}
```

### 分块加载（Chunking）

对于大型地图，使用分块加载可以有效管理内存：

```typescript
interface Chunk {
  x: number;
  y: number;
  width: number;
  height: number;
  data: number[][];
  texture?: HTMLCanvasElement; // 预渲染的纹理
  lastAccess: number;
}

class ChunkedTilemap {
  private chunks: Map<string, Chunk> = new Map();
  private chunkSize: number;
  private tileWidth: number;
  private tileHeight: number;
  private maxCachedChunks: number;
  private dataSource: (chunkX: number, chunkY: number) => number[][];

  constructor(config: {
    chunkSize: number;
    tileWidth: number;
    tileHeight: number;
    maxCachedChunks: number;
    dataSource: (chunkX: number, chunkY: number) => number[][];
  }) {
    this.chunkSize = config.chunkSize;
    this.tileWidth = config.tileWidth;
    this.tileHeight = config.tileHeight;
    this.maxCachedChunks = config.maxCachedChunks;
    this.dataSource = config.dataSource;
  }

  private getChunkKey(chunkX: number, chunkY: number): string {
    return `${chunkX},${chunkY}`;
  }

  getChunk(chunkX: number, chunkY: number): Chunk {
    const key = this.getChunkKey(chunkX, chunkY);

    if (this.chunks.has(key)) {
      const chunk = this.chunks.get(key)!;
      chunk.lastAccess = Date.now();
      return chunk;
    }

    // 加载新块
    const chunk = this.loadChunk(chunkX, chunkY);
    this.chunks.set(key, chunk);

    // 清理旧块
    this.cleanupChunks();

    return chunk;
  }

  private loadChunk(chunkX: number, chunkY: number): Chunk {
    const data = this.dataSource(chunkX, chunkY);

    const chunk: Chunk = {
      x: chunkX * this.chunkSize,
      y: chunkY * this.chunkSize,
      width: this.chunkSize,
      height: this.chunkSize,
      data,
      lastAccess: Date.now()
    };

    // 预渲染块到离屏画布
    chunk.texture = this.prerenderChunk(chunk);

    return chunk;
  }

  private prerenderChunk(chunk: Chunk): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.chunkSize * this.tileWidth;
    canvas.height = this.chunkSize * this.tileHeight;

    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // 渲染所有瓦片到离屏画布
    for (let row = 0; row < chunk.data.length; row++) {
      for (let col = 0; col < chunk.data[row].length; col++) {
        const tileId = chunk.data[row][col];
        if (tileId === 0) continue;

        // 这里需要实际的瓦片渲染逻辑
        this.renderTileToContext(ctx, tileId, col, row);
      }
    }

    return canvas;
  }

  private renderTileToContext(
    ctx: CanvasRenderingContext2D,
    tileId: number,
    col: number,
    row: number
  ): void {
    // 实际渲染逻辑
    // ...
  }

  private cleanupChunks(): void {
    if (this.chunks.size <= this.maxCachedChunks) return;

    // 找出最久未访问的块
    const entries = Array.from(this.chunks.entries());
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    // 删除多余的块
    const toRemove = entries.slice(0, this.chunks.size - this.maxCachedChunks);
    for (const [key] of toRemove) {
      this.chunks.delete(key);
    }
  }

  // 获取可见区域内的所有块
  getVisibleChunks(
    cameraX: number,
    cameraY: number,
    viewWidth: number,
    viewHeight: number
  ): Chunk[] {
    const chunkPixelSize = this.chunkSize * this.tileWidth;

    const startChunkX = Math.floor(cameraX / chunkPixelSize);
    const startChunkY = Math.floor(cameraY / chunkPixelSize);
    const endChunkX = Math.ceil((cameraX + viewWidth) / chunkPixelSize);
    const endChunkY = Math.ceil((cameraY + viewHeight) / chunkPixelSize);

    const chunks: Chunk[] = [];

    for (let cy = startChunkY; cy <= endChunkY; cy++) {
      for (let cx = startChunkX; cx <= endChunkX; cx++) {
        chunks.push(this.getChunk(cx, cy));
      }
    }

    return chunks;
  }
}
```

### 脏矩形渲染

只更新发生变化的区域：

```typescript
interface DirtyRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

class DirtyRectRenderer {
  private ctx: CanvasRenderingContext2D;
  private backBuffer: HTMLCanvasElement;
  private backCtx: CanvasRenderingContext2D;
  private dirtyRects: DirtyRect[] = [];
  private fullRedrawNeeded: boolean = true;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;

    // 创建后台缓冲区
    this.backBuffer = document.createElement('canvas');
    this.backBuffer.width = canvas.width;
    this.backBuffer.height = canvas.height;
    this.backCtx = this.backBuffer.getContext('2d')!;
  }

  markDirty(x: number, y: number, width: number, height: number): void {
    this.dirtyRects.push({ x, y, width, height });
  }

  markFullRedraw(): void {
    this.fullRedrawNeeded = true;
  }

  render(renderCallback: (ctx: CanvasRenderingContext2D, rect?: DirtyRect) => void): void {
    if (this.fullRedrawNeeded) {
      // 完整重绘
      renderCallback(this.backCtx);
      this.ctx.drawImage(this.backBuffer, 0, 0);
      this.fullRedrawNeeded = false;
      this.dirtyRects = [];
      return;
    }

    if (this.dirtyRects.length === 0) return;

    // 合并重叠的脏矩形
    const mergedRects = this.mergeRects(this.dirtyRects);

    for (const rect of mergedRects) {
      // 清除脏区域
      this.backCtx.clearRect(rect.x, rect.y, rect.width, rect.height);

      // 重绘脏区域
      this.backCtx.save();
      this.backCtx.beginPath();
      this.backCtx.rect(rect.x, rect.y, rect.width, rect.height);
      this.backCtx.clip();
      renderCallback(this.backCtx, rect);
      this.backCtx.restore();

      // 更新前台缓冲区
      this.ctx.drawImage(
        this.backBuffer,
        rect.x, rect.y, rect.width, rect.height,
        rect.x, rect.y, rect.width, rect.height
      );
    }

    this.dirtyRects = [];
  }

  private mergeRects(rects: DirtyRect[]): DirtyRect[] {
    if (rects.length <= 1) return rects;

    // 简单的矩形合并算法
    const merged: DirtyRect[] = [];

    for (const rect of rects) {
      let wasMerged = false;

      for (const existing of merged) {
        if (this.rectsOverlap(rect, existing)) {
          // 扩展现有矩形以包含新矩形
          const minX = Math.min(rect.x, existing.x);
          const minY = Math.min(rect.y, existing.y);
          const maxX = Math.max(rect.x + rect.width, existing.x + existing.width);
          const maxY = Math.max(rect.y + rect.height, existing.y + existing.height);

          existing.x = minX;
          existing.y = minY;
          existing.width = maxX - minX;
          existing.height = maxY - minY;

          wasMerged = true;
          break;
        }
      }

      if (!wasMerged) {
        merged.push({ ...rect });
      }
    }

    return merged;
  }

  private rectsOverlap(a: DirtyRect, b: DirtyRect): boolean {
    return !(a.x + a.width < b.x ||
             b.x + b.width < a.x ||
             a.y + a.height < b.y ||
             b.y + b.height < a.y);
  }
}
```

### WebGL 渲染优化

对于大规模地图，WebGL 可以提供更好的性能：

```typescript
class WebGLTilemapRenderer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private tilesetTexture: WebGLTexture;
  private positionBuffer: WebGLBuffer;
  private texCoordBuffer: WebGLBuffer;

  constructor(canvas: HTMLCanvasElement, tilesetImage: HTMLImageElement) {
    const gl = canvas.getContext('webgl');
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;

    this.program = this.createProgram();
    this.tilesetTexture = this.createTexture(tilesetImage);
    this.positionBuffer = gl.createBuffer()!;
    this.texCoordBuffer = gl.createBuffer()!;
  }

  private createProgram(): WebGLProgram {
    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      uniform vec2 u_resolution;
      uniform vec2 u_camera;
      varying vec2 v_texCoord;

      void main() {
        vec2 position = a_position - u_camera;
        vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        v_texCoord = a_texCoord;
      }
    `);

    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform sampler2D u_tileset;
      varying vec2 v_texCoord;

      void main() {
        gl_FragColor = texture2D(u_tileset, v_texCoord);
      }
    `);

    const program = this.gl.createProgram()!;
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error('Program link failed');
    }

    return program;
  }

  private compileShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error('Shader compile failed: ' + this.gl.getShaderInfoLog(shader));
    }

    return shader;
  }

  private createTexture(image: HTMLImageElement): WebGLTexture {
    const texture = this.gl.createTexture()!;
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    // 设置纹理参数（适合像素艺术）
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA,
      this.gl.RGBA, this.gl.UNSIGNED_BYTE, image
    );

    return texture;
  }

  render(
    mapData: number[][],
    tileWidth: number,
    tileHeight: number,
    tilesetColumns: number,
    cameraX: number,
    cameraY: number
  ): void {
    const gl = this.gl;
    const positions: number[] = [];
    const texCoords: number[] = [];

    // 为每个可见瓦片生成顶点数据
    for (let row = 0; row < mapData.length; row++) {
      for (let col = 0; col < mapData[row].length; col++) {
        const tileId = mapData[row][col];
        if (tileId === 0) continue;

        const x = col * tileWidth;
        const y = row * tileHeight;

        // 两个三角形组成一个瓦片
        positions.push(
          x, y,
          x + tileWidth, y,
          x, y + tileHeight,
          x, y + tileHeight,
          x + tileWidth, y,
          x + tileWidth, y + tileHeight
        );

        // 计算纹理坐标
        const tileX = (tileId - 1) % tilesetColumns;
        const tileY = Math.floor((tileId - 1) / tilesetColumns);
        const u = tileX / tilesetColumns;
        const v = tileY / (tilesetColumns); // 假设正方形瓦片集
        const uSize = 1 / tilesetColumns;
        const vSize = uSize;

        texCoords.push(
          u, v,
          u + uSize, v,
          u, v + vSize,
          u, v + vSize,
          u + uSize, v,
          u + uSize, v + vSize
        );
      }
    }

    // 上传数据到 GPU
    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    const texCoordLocation = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // 设置 uniform
    const resolutionLocation = gl.getUniformLocation(this.program, 'u_resolution');
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    const cameraLocation = gl.getUniformLocation(this.program, 'u_camera');
    gl.uniform2f(cameraLocation, cameraX, cameraY);

    // 绘制
    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
  }
}
```

## 实战示例：完整的瓦片地图系统

将以上所有组件整合成一个完整的系统：

```typescript
// 游戏主类
class TilemapGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tilemap: Tilemap | null = null;
  private renderer: TilemapRenderer | null = null;
  private collisionSystem: CollisionSystem | null = null;
  private animatedTileManager: AnimatedTileManager;
  private player: { x: number; y: number; vx: number; vy: number };
  private camera: { x: number; y: number };
  private lastTime: number = 0;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;

    this.animatedTileManager = new AnimatedTileManager();
    this.player = { x: 100, y: 100, vx: 0, vy: 0 };
    this.camera = { x: 0, y: 0 };

    this.setupInput();
  }

  async loadLevel(levelPath: string): Promise<void> {
    const loader = new TiledMapLoader('/assets/maps/');
    this.tilemap = await loader.loadMap(levelPath);
    this.renderer = new TilemapRenderer(this.canvas, this.tilemap);

    // 创建碰撞系统
    this.collisionSystem = new CollisionSystem({
      width: this.tilemap.width,
      height: this.tilemap.height,
      tileWidth: this.tilemap.tileWidth,
      tileHeight: this.tilemap.tileHeight,
      data: this.tilemap.collisionLayer.map(row =>
        row.map(v => v ? CollisionType.Solid : CollisionType.None)
      )
    });

    // 注册动画瓦片
    this.animatedTileManager.registerAnimation(10, [10, 11, 12, 13], 200);
  }

  private setupInput(): void {
    const keys = new Set<string>();

    window.addEventListener('keydown', e => keys.add(e.key));
    window.addEventListener('keyup', e => keys.delete(e.key));

    // 在游戏循环中检查按键
    setInterval(() => {
      this.player.vx = 0;
      if (keys.has('ArrowLeft') || keys.has('a')) this.player.vx = -200;
      if (keys.has('ArrowRight') || keys.has('d')) this.player.vx = 200;
      if (keys.has('ArrowUp') || keys.has('w')) this.player.vy = -200;
      if (keys.has('ArrowDown') || keys.has('s')) this.player.vy = 200;
    }, 16);
  }

  start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private gameLoop(currentTime: number): void {
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  private update(deltaTime: number): void {
    // 更新动画
    this.animatedTileManager.update(deltaTime * 1000);

    // 更新玩家位置（带碰撞检测）
    if (this.collisionSystem) {
      const result = this.collisionSystem.resolveCollision(
        this.player.x,
        this.player.y,
        32, 32, // 玩家尺寸
        this.player.vx * deltaTime,
        this.player.vy * deltaTime
      );

      this.player.x = result.x;
      this.player.y = result.y;
    }

    // 更新相机
    this.camera.x = this.player.x - this.canvas.width / 2;
    this.camera.y = this.player.y - this.canvas.height / 2;

    // 限制相机范围
    if (this.tilemap) {
      const maxX = this.tilemap.width * this.tilemap.tileWidth - this.canvas.width;
      const maxY = this.tilemap.height * this.tilemap.tileHeight - this.canvas.height;
      this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
      this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));
    }
  }

  private render(): void {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 渲染地图
    if (this.renderer) {
      this.renderer.setCamera(this.camera.x, this.camera.y);
      this.renderer.render();
    }

    // 渲染玩家
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(
      this.player.x - this.camera.x,
      this.player.y - this.camera.y,
      32, 32
    );
  }
}

// 启动游戏
async function main(): Promise<void> {
  const game = new TilemapGame('gameCanvas');
  await game.loadLevel('level1.json');
  game.start();
}

main().catch(console.error);
```

## 面试要点

### 高频面试题

**1. 为什么使用瓦片地图而不是大图？**

- 内存效率：复用瓦片减少纹理占用
- 编辑便利：便于关卡设计和迭代
- 程序化支持：易于实现随机地图生成
- 碰撞检测：网格化碰撞更高效

**2. 如何优化大型地图的渲染性能？**

- 视口裁剪：只渲染可见区域
- 分块加载：按需加载地图块
- 预渲染缓存：将静态内容渲染到离屏画布
- WebGL 批处理：减少绘制调用

**3. 自动瓦片的实现原理是什么？**

- 使用位掩码编码邻居状态
- 4-方向：4位编码，16种可能
- 8-方向：8位编码，256种可能（通常简化为47种）
- 根据掩码值查表获取对应瓦片

**4. 如何处理不同图层间的遮挡关系？**

- Z-Index 排序：按层级顺序渲染
- Y-Sorting：按 Y 坐标排序实现深度
- 混合方案：静态层用 Z-Index，动态对象用 Y-Sorting

**5. 程序化地图生成有哪些常用算法？**

- 柏林噪声：自然地形
- 元胞自动机：洞穴生成
- BSP 树：房间走廊型地下城
- 波函数坍缩：基于约束的生成

### 实战技巧

1. **使用成熟的地图编辑器**：Tiled 是最流行的选择，支持多种导出格式
2. **瓦片集设计规范**：统一尺寸，逻辑分组，考虑边缘无缝
3. **碰撞优化**：使用空间划分（如四叉树）加速碰撞检测
4. **内存管理**：实现 LRU 缓存管理分块加载的地图数据
5. **调试工具**：实现碰撞层可视化、网格显示等调试功能

## 延伸阅读

### 工具与资源

- **Tiled Map Editor**：https://www.mapeditor.org/
- **TexturePacker**：瓦片集打包工具
- **Piskel**：像素艺术编辑器
- **Aseprite**：专业像素艺术和动画工具

### 相关技术

- **ECS 架构**：实体组件系统与瓦片地图的结合
- **物理引擎**：Box2D、Matter.js 与瓦片碰撞的集成
- **寻路算法**：A* 在瓦片地图中的应用
- **视野计算**：基于瓦片的视线和迷雾系统

### 游戏引擎参考

- **Phaser**：强大的 HTML5 游戏框架，内置瓦片地图支持
- **Godot**：开源游戏引擎，TileMap 节点功能完善
- **Unity Tilemap**：Unity 的 2D 瓦片地图系统
- **Cocos Creator**：TiledMap 组件支持

## 总结

瓦片地图系统是 2D 游戏开发的基石。通过本文的学习，你应该能够：

1. 理解瓦片地图的核心概念和数据结构
2. 实现基础的瓦片地图渲染器
3. 掌握自动瓦片的位掩码算法
4. 设计多层渲染和碰撞检测系统
5. 集成 Tiled 编辑器导出的地图数据
6. 使用噪声、元胞自动机等算法生成程序化地图
7. 应用各种性能优化技术

瓦片地图系统的设计需要在功能丰富性和性能之间取得平衡。从简单实现开始，随着需求增长逐步引入更复杂的特性，是构建稳健游戏系统的最佳实践。
