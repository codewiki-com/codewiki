---
title: Procedural Level Generation Techniques
description: "Implement random level generation: room generation, maze algorithms, and Wave Function Collapse"
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - procedural generation
  - level generation
  - WFC
  - maze
status: imported
origin: old/src/content/docs/gamedev/procedural-level.en.md
divergence: 0.322
issues: []
legacy:
  category: GameDev
  subcategory: Procedural
  order: 34
  lastUpdated: 2026-01-07
---

Procedural level generation is a cornerstone technique in modern game development, enabling the creation of infinite, unique game experiences. From the sprawling dungeons of roguelikes to the endless worlds of survival games, procedural generation empowers developers to create vast content with minimal manual effort. This comprehensive guide explores the algorithms, patterns, and best practices for implementing robust procedural level generation systems.

## Understanding Procedural Level Generation

### What is Procedural Generation?

Procedural generation refers to the algorithmic creation of game content using mathematical functions and rules rather than manual design. For level generation specifically, this means creating playable spaces programmatically, including:

- Room layouts and floor plans
- Corridor and hallway connections
- Enemy and item placement
- Environmental details and decoration
- Difficulty progression and pacing

### Why Use Procedural Generation?

**Advantages:**

1. **Infinite Replayability**: Each playthrough offers unique experiences
2. **Reduced Development Time**: No need to manually design every level
3. **Smaller File Sizes**: Algorithms replace stored level data
4. **Dynamic Difficulty**: Adapt content to player skill in real-time
5. **Emergent Gameplay**: Unexpected combinations create memorable moments

**Challenges:**

1. **Quality Control**: Ensuring all generated content is playable
2. **Coherence**: Maintaining logical spatial relationships
3. **Performance**: Generation must be fast enough for real-time use
4. **Testing**: Harder to test infinite possibilities
5. **Design Intent**: Preserving intended player experience

### Core Concepts

Before diving into algorithms, let's establish fundamental concepts:

```typescript
// Basic types for level generation
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

    // Initialize with walls
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

## BSP (Binary Space Partitioning) Algorithm

BSP is one of the most reliable algorithms for generating dungeon-style levels. It recursively divides space into smaller sections, then places rooms within those sections.

### How BSP Works

1. Start with the entire level as a single region
2. Split the region either horizontally or vertically
3. Recursively split each sub-region until minimum size is reached
4. Place a room in each leaf node
5. Connect rooms through their parent nodes

### Implementation

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
    // Use seeded random for reproducibility
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

    // Create root node
    const root = new BSPNode({
      x: 1,
      y: 1,
      width: width - 2,
      height: height - 2
    });

    // Split recursively
    this.split(root);

    // Create rooms in leaf nodes
    this.createRooms(root, level);

    // Connect rooms
    this.connectRooms(root, level);

    return level;
  }

  private split(node: BSPNode): void {
    // Don't split if too small
    if (node.rect.width < this.minSplitSize * 2 &&
        node.rect.height < this.minSplitSize * 2) {
      return;
    }

    // Determine split direction
    let splitHorizontally: boolean;
    if (node.rect.width < this.minSplitSize * 2) {
      splitHorizontally = true;
    } else if (node.rect.height < this.minSplitSize * 2) {
      splitHorizontally = false;
    } else {
      // Prefer splitting the longer dimension
      splitHorizontally = node.rect.height > node.rect.width
        ? true
        : (node.rect.width > node.rect.height ? false : this.random() > 0.5);
    }

    // Calculate split position
    const max = splitHorizontally
      ? node.rect.height - this.minSplitSize
      : node.rect.width - this.minSplitSize;

    if (max <= this.minSplitSize) return;

    const splitPos = Math.floor(
      this.minSplitSize + this.random() * (max - this.minSplitSize)
    );

    // Create child nodes
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

    // Recursively split children
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
      // Create room with random size within the partition
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

      // Carve room into level
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

    // Recursively connect children first
    this.connectRooms(node.left, level);
    this.connectRooms(node.right, level);

    // Get rooms from each subtree
    const leftRoom = this.getRoom(node.left);
    const rightRoom = this.getRoom(node.right);

    if (leftRoom && rightRoom) {
      // Get center points
      const leftCenter: Point = {
        x: Math.floor(leftRoom.x + leftRoom.width / 2),
        y: Math.floor(leftRoom.y + leftRoom.height / 2)
      };
      const rightCenter: Point = {
        x: Math.floor(rightRoom.x + rightRoom.width / 2),
        y: Math.floor(rightRoom.y + rightRoom.height / 2)
      };

      // Create L-shaped corridor
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

    // Randomly choose to go horizontal or vertical first
    if (this.random() > 0.5) {
      // Horizontal then vertical
      while (x !== end.x) {
        level.setTile(x, y, TileType.CORRIDOR);
        x += x < end.x ? 1 : -1;
      }
      while (y !== end.y) {
        level.setTile(x, y, TileType.CORRIDOR);
        y += y < end.y ? 1 : -1;
      }
    } else {
      // Vertical then horizontal
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

### BSP Advantages and Limitations

**Advantages:**
- Guarantees non-overlapping rooms
- Produces well-connected dungeons
- Easy to control room density
- Predictable results

**Limitations:**
- Can feel rigid and grid-like
- Limited room shape variety
- May produce long corridors

## Room-Corridor Generation Algorithm

This approach generates rooms first, then connects them with corridors. It offers more flexibility than BSP while maintaining connectivity.

### Random Room Placement

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

    // Generate rooms
    for (let i = 0; i < roomCount; i++) {
      this.placeRoom(level);
    }

    // Connect rooms using minimum spanning tree
    this.connectRoomsWithMST(level);

    // Optionally add extra connections for loops
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
    // Check with padding for spacing between rooms
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

    // Calculate distances between all room pairs
    const edges: Array<{ from: number; to: number; distance: number }> = [];

    for (let i = 0; i < level.rooms.length; i++) {
      for (let j = i + 1; j < level.rooms.length; j++) {
        const distance = this.roomDistance(level.rooms[i], level.rooms[j]);
        edges.push({ from: i, to: j, distance });
      }
    }

    // Sort by distance
    edges.sort((a, b) => a.distance - b.distance);

    // Kruskal's algorithm for MST
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
    // Get random points within each room
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

      // Randomly choose direction
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
    // Add random connections for loops
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

### Delaunay Triangulation for Better Connections

For more natural-looking connections, use Delaunay triangulation:

```typescript
class DelaunayConnector {
  // Bowyer-Watson algorithm for Delaunay triangulation
  triangulate(points: Point[]): Array<[Point, Point, Point]> {
    // Create super triangle that contains all points
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

    // Add points one at a time
    for (const point of points) {
      const badTriangles: Array<[Point, Point, Point]> = [];

      // Find triangles whose circumcircle contains the point
      for (const triangle of triangles) {
        if (this.pointInCircumcircle(point, triangle)) {
          badTriangles.push(triangle);
        }
      }

      // Find boundary of polygonal hole
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

      // Remove bad triangles
      triangles = triangles.filter(t => !badTriangles.includes(t));

      // Create new triangles from polygon edges to point
      for (const edge of polygon) {
        triangles.push([edge[0], edge[1], point]);
      }
    }

    // Remove triangles containing super triangle vertices
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

  // Get unique edges from triangulation
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

## Maze Generation Algorithms

Maze algorithms create perfect mazes (single solution) or imperfect mazes (multiple paths). They are essential for creating exploration-focused levels.

### Recursive Backtracking

The most common maze algorithm, producing long, winding passages:

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
    // Ensure odd dimensions for proper maze
    const w = width % 2 === 0 ? width - 1 : width;
    const h = height % 2 === 0 ? height - 1 : height;

    const level = new Level(w, h);

    // Start from random odd position
    const startX = 1 + Math.floor(this.random() * ((w - 2) / 2)) * 2;
    const startY = 1 + Math.floor(this.random() * ((h - 2) / 2)) * 2;

    this.carve(startX, startY, level);

    return level;
  }

  private carve(x: number, y: number, level: Level): void {
    const directions = this.shuffle([
      { dx: 0, dy: -2 },  // North
      { dx: 2, dy: 0 },   // East
      { dx: 0, dy: 2 },   // South
      { dx: -2, dy: 0 }   // West
    ]);

    level.setTile(x, y, TileType.FLOOR);

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (level.isInBounds(nx, ny) &&
          level.getTile(nx, ny) === TileType.WALL) {
        // Carve passage
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

### Prim's Algorithm

Creates mazes with more branching and shorter dead ends:

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

    // Start from random position
    const startX = 1 + Math.floor(this.random() * ((w - 2) / 2)) * 2;
    const startY = 1 + Math.floor(this.random() * ((h - 2) / 2)) * 2;

    level.setTile(startX, startY, TileType.FLOOR);
    this.addFrontier(startX, startY, frontier, level);

    while (frontier.length > 0) {
      // Pick random frontier cell
      const index = Math.floor(this.random() * frontier.length);
      const cell = frontier[index];
      frontier.splice(index, 1);

      if (level.getTile(cell.x, cell.y) === TileType.WALL) {
        // Find neighbors that are passages
        const neighbors = this.getPassageNeighbors(cell, level);

        if (neighbors.length > 0) {
          // Connect to random neighbor
          const neighbor = neighbors[
            Math.floor(this.random() * neighbors.length)
          ];

          // Carve path
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

### Eller's Algorithm

Memory-efficient algorithm that generates mazes row by row:

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

    // Initialize sets for first row
    let sets: number[] = [];
    let nextSet = 0;

    for (let i = 0; i < cellWidth; i++) {
      sets[i] = nextSet++;
    }

    for (let row = 0; row < cellHeight; row++) {
      const y = row * 2 + 1;
      const isLastRow = row === cellHeight - 1;

      // Carve cells in current row
      for (let col = 0; col < cellWidth; col++) {
        const x = col * 2 + 1;
        level.setTile(x, y, TileType.FLOOR);
      }

      // Randomly join adjacent cells
      for (let col = 0; col < cellWidth - 1; col++) {
        const x = col * 2 + 1;

        if (sets[col] !== sets[col + 1]) {
          // On last row, always join different sets
          // Otherwise, randomly join
          if (isLastRow || this.random() > 0.5) {
            // Join cells
            level.setTile(x + 1, y, TileType.FLOOR);

            // Merge sets
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
        // Create vertical connections
        const setMembers = new Map<number, number[]>();

        for (let col = 0; col < cellWidth; col++) {
          const set = sets[col];
          if (!setMembers.has(set)) {
            setMembers.set(set, []);
          }
          setMembers.get(set)!.push(col);
        }

        // Each set must have at least one vertical connection
        const nextSets: number[] = [];

        for (const [set, members] of setMembers) {
          // Shuffle members
          const shuffled = [...members].sort(() => this.random() - 0.5);

          // Ensure at least one connection
          const connectionCount = Math.max(
            1,
            Math.floor(this.random() * members.length) + 1
          );

          for (let i = 0; i < members.length; i++) {
            const col = shuffled[i];
            const x = col * 2 + 1;

            if (i < connectionCount) {
              // Create vertical connection
              level.setTile(x, y + 1, TileType.FLOOR);
              nextSets[col] = set;
            } else {
              // New set for next row
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

### Comparing Maze Algorithms

| Algorithm | Characteristics | Best For |
|-----------|----------------|----------|
| Recursive Backtracking | Long corridors, deep dead ends | Exploration games |
| Prim's | More branching, shorter paths | Action games |
| Eller's | Memory efficient, row-by-row | Large mazes, streaming |
| Kruskal's | Uniform distribution | Balanced exploration |

## Wave Function Collapse (WFC)

Wave Function Collapse is a constraint-based algorithm inspired by quantum mechanics. It generates coherent patterns by propagating constraints across a grid.

### Core Concepts

1. **Tiles**: Pre-defined tile types with allowed adjacencies
2. **Wave**: Each cell starts as a superposition of all possible tiles
3. **Observation**: Collapse a cell to a single tile
4. **Propagation**: Update neighboring cells based on constraints

### Basic WFC Implementation

```typescript
interface WFCTile {
  id: number;
  name: string;
  weight: number;
  // Which tiles can be adjacent in each direction
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
      // Find cell with lowest entropy (fewest possibilities)
      const cell = this.findLowestEntropyCell();

      if (cell === null) {
        // All cells collapsed - success!
        return this.extractResult();
      }

      // Observe (collapse) the cell
      if (!this.observe(cell.x, cell.y)) {
        // Contradiction - generation failed
        return null;
      }

      // Propagate constraints
      if (!this.propagate(cell.x, cell.y)) {
        // Contradiction during propagation
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

    // Random selection among tied cells
    return candidates[Math.floor(this.random() * candidates.length)];
  }

  private observe(x: number, y: number): boolean {
    const cell = this.grid[y][x];

    if (cell.possibilities.size === 0) {
      return false; // Contradiction
    }

    // Choose tile based on weights
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

    // Collapse cell
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

      // Get allowed neighbors for current possibilities
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

      // Update neighbors
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

        // Remove possibilities that are not allowed
        for (const tileId of neighbor.possibilities) {
          if (!allowed.has(tileId)) {
            neighbor.possibilities.delete(tileId);
            changed = true;
          }
        }

        if (neighbor.possibilities.size === 0) {
          return false; // Contradiction
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

### Defining Tile Rules

```typescript
// Example: Simple dungeon tiles
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
    // ... define remaining tiles
  ];
}
```

### WFC with Backtracking

Add backtracking to handle contradictions:

```typescript
class WFCWithBacktracking extends WaveFunctionCollapse {
  private history: Array<{
    grid: WFCCell[][];
    x: number;
    y: number;
  }> = [];

  private maxBacktracks: number = 100;
  private backtrackCount: number = 0;

  generate(width: number, height: number): number[][] | null {
    this.history = [];
    this.backtrackCount = 0;

    return super.generate(width, height);
  }

  protected observe(x: number, y: number): boolean {
    // Save state before observation
    this.history.push({
      grid: this.copyGrid(),
      x,
      y
    });

    return super.observe(x, y);
  }

  protected propagate(startX: number, startY: number): boolean {
    const result = super.propagate(startX, startY);

    if (!result && this.backtrackCount < this.maxBacktracks) {
      // Backtrack
      return this.backtrack();
    }

    return result;
  }

  private backtrack(): boolean {
    while (this.history.length > 0) {
      this.backtrackCount++;

      const state = this.history.pop()!;
      this.grid = state.grid;

      const cell = this.grid[state.y][state.x];

      // Remove the choice that led to contradiction
      if (cell.tileId !== null) {
        cell.possibilities.delete(cell.tileId);
        cell.collapsed = false;
        cell.tileId = null;
      }

      if (cell.possibilities.size > 0) {
        // Try again from this state
        return true;
      }

      // Continue backtracking
    }

    return false; // No more states to backtrack to
  }

  private copyGrid(): WFCCell[][] {
    return this.grid.map(row =>
      row.map(cell => ({
        possibilities: new Set(cell.possibilities),
        collapsed: cell.collapsed,
        tileId: cell.tileId
      }))
    );
  }
}
```

## Level Validation

Generated levels must be validated to ensure playability.

### Connectivity Validation

```typescript
class LevelValidator {
  // Check if all floor tiles are reachable from each other
  static isFullyConnected(level: Level): boolean {
    // Find first floor tile
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

    // Flood fill to find all reachable tiles
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

    // Count total floor tiles
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

  // Check minimum path length between two points
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

    return -1; // No path found
  }

  // Validate room count and sizes
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

  // Check for isolated areas
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

### Regeneration Strategy

```typescript
class LevelGeneratorWithValidation {
  private generator: BSPGenerator | RoomCorridorGenerator;
  private maxAttempts: number = 10;

  constructor(generator: BSPGenerator | RoomCorridorGenerator) {
    this.generator = generator;
  }

  generate(
    width: number,
    height: number,
    config: {
      minRooms?: number;
      maxRooms?: number;
      minPathLength?: number;
    } = {}
  ): Level | null {
    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      let level: Level;

      if (this.generator instanceof BSPGenerator) {
        level = this.generator.generate(width, height);
      } else {
        level = this.generator.generate(
          width,
          height,
          config.minRooms || 8
        );
      }

      // Validate connectivity
      if (!LevelValidator.isFullyConnected(level)) {
        console.log(`Attempt ${attempt + 1}: Not fully connected`);
        continue;
      }

      // Validate room count
      if (config.minRooms && level.rooms.length < config.minRooms) {
        console.log(`Attempt ${attempt + 1}: Too few rooms`);
        continue;
      }

      if (config.maxRooms && level.rooms.length > config.maxRooms) {
        console.log(`Attempt ${attempt + 1}: Too many rooms`);
        continue;
      }

      // Validate minimum path length (if start/end defined)
      if (config.minPathLength && level.rooms.length >= 2) {
        const startRoom = level.rooms[0];
        const endRoom = level.rooms[level.rooms.length - 1];

        const startPoint: Point = {
          x: Math.floor(startRoom.x + startRoom.width / 2),
          y: Math.floor(startRoom.y + startRoom.height / 2)
        };
        const endPoint: Point = {
          x: Math.floor(endRoom.x + endRoom.width / 2),
          y: Math.floor(endRoom.y + endRoom.height / 2)
        };

        const pathLength = LevelValidator.getPathLength(
          level,
          startPoint,
          endPoint
        );

        if (pathLength < config.minPathLength) {
          console.log(`Attempt ${attempt + 1}: Path too short (${pathLength})`);
          continue;
        }
      }

      console.log(`Level generated successfully on attempt ${attempt + 1}`);
      return level;
    }

    console.error('Failed to generate valid level');
    return null;
  }
}
```

## Difficulty Curves and Progression

Creating levels with proper difficulty progression is essential for player engagement.

### Distance-Based Difficulty

```typescript
class DifficultyManager {
  // Calculate difficulty based on distance from start
  static calculateDistanceDifficulty(
    level: Level,
    startRoom: Rect
  ): Map<string, number> {
    const difficultyMap = new Map<string, number>();
    const startPoint: Point = {
      x: Math.floor(startRoom.x + startRoom.width / 2),
      y: Math.floor(startRoom.y + startRoom.height / 2)
    };

    // BFS to calculate distances
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

    // Normalize to 0-1 difficulty range
    for (const [key, distance] of distances) {
      difficultyMap.set(key, distance / maxDistance);
    }

    return difficultyMap;
  }

  // Assign difficulty to rooms
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

### Content Placement Based on Difficulty

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

      // Skip start room
      if (difficulty < 0.05) continue;

      const roomArea = room.width * room.height;
      const enemyCount = Math.floor(roomArea * enemyDensity * (0.5 + difficulty));

      // Find valid enemy types for this difficulty
      const validTypes = enemyTypes.filter(
        e => difficulty >= e.minDifficulty && difficulty <= e.maxDifficulty
      );

      if (validTypes.length === 0) continue;

      for (let j = 0; j < enemyCount; j++) {
        const enemyType = validTypes[
          Math.floor(this.random() * validTypes.length)
        ];

        // Random position within room (avoiding edges)
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

      // Better items spawn in harder areas
      const validItems = itemTypes.filter(
        item => difficulty >= item.minDifficulty
      );

      for (let j = 0; j < itemCount; j++) {
        // Weight selection by rarity (inverse - rarer items less likely)
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

  placeSpecialLocations(
    level: Level,
    roomDifficulty: Map<number, number>
  ): { stairs: Point; boss: Point | null; shop: Point | null } {
    // Find room with highest difficulty for exit/boss
    let maxDifficulty = -1;
    let bossRoomIndex = -1;

    for (const [index, difficulty] of roomDifficulty) {
      if (difficulty > maxDifficulty) {
        maxDifficulty = difficulty;
        bossRoomIndex = index;
      }
    }

    const bossRoom = level.rooms[bossRoomIndex];

    // Find medium difficulty room for shop
    let shopRoomIndex = -1;
    let closestToMiddle = Infinity;

    for (const [index, difficulty] of roomDifficulty) {
      const distanceToMiddle = Math.abs(difficulty - 0.5);
      if (distanceToMiddle < closestToMiddle && index !== bossRoomIndex) {
        closestToMiddle = distanceToMiddle;
        shopRoomIndex = index;
      }
    }

    return {
      stairs: {
        x: Math.floor(bossRoom.x + bossRoom.width / 2),
        y: Math.floor(bossRoom.y + bossRoom.height / 2)
      },
      boss: bossRoomIndex >= 0 ? {
        x: bossRoom.x + 2,
        y: bossRoom.y + 2
      } : null,
      shop: shopRoomIndex >= 0 ? {
        x: Math.floor(level.rooms[shopRoomIndex].x +
           level.rooms[shopRoomIndex].width / 2),
        y: Math.floor(level.rooms[shopRoomIndex].y +
           level.rooms[shopRoomIndex].height / 2)
      } : null
    };
  }
}
```

## Roguelike Level Generation

Roguelike games require specific considerations for level generation.

### Complete Roguelike Level Generator

```typescript
interface RoguelikeLevel extends Level {
  startPoint: Point;
  exitPoint: Point;
  enemies: Enemy[];
  items: Item[];
  traps: Point[];
  secrets: Point[];
}

class RoguelikeLevelGenerator {
  private bspGenerator: BSPGenerator;
  private contentPlacer: ContentPlacer;
  private random: () => number;

  constructor(seed?: number) {
    this.bspGenerator = new BSPGenerator(seed);
    this.contentPlacer = new ContentPlacer(seed);
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

  generate(
    width: number,
    height: number,
    floorNumber: number
  ): RoguelikeLevel {
    // Generate base level
    const baseLevel = this.bspGenerator.generate(width, height);

    // Calculate difficulty scaling based on floor
    const baseDifficulty = Math.min(floorNumber / 20, 1); // Cap at floor 20

    // Assign room difficulty
    const roomDifficulty = DifficultyManager.assignRoomDifficulty(
      baseLevel,
      0
    );

    // Scale difficulty by floor number
    for (const [index, difficulty] of roomDifficulty) {
      roomDifficulty.set(
        index,
        Math.min(difficulty + baseDifficulty * 0.3, 1)
      );
    }

    // Find start and exit rooms
    let startRoomIndex = 0;
    let exitRoomIndex = 0;
    let maxDifficulty = -1;

    for (const [index, difficulty] of roomDifficulty) {
      if (difficulty > maxDifficulty) {
        maxDifficulty = difficulty;
        exitRoomIndex = index;
      }
    }

    const startRoom = baseLevel.rooms[startRoomIndex];
    const exitRoom = baseLevel.rooms[exitRoomIndex];

    // Place stairs
    baseLevel.setTile(
      Math.floor(startRoom.x + startRoom.width / 2),
      Math.floor(startRoom.y + startRoom.height / 2),
      TileType.STAIRS_UP
    );

    baseLevel.setTile(
      Math.floor(exitRoom.x + exitRoom.width / 2),
      Math.floor(exitRoom.y + exitRoom.height / 2),
      TileType.STAIRS_DOWN
    );

    // Place content with floor scaling
    const enemyDensity = 0.05 + floorNumber * 0.01;
    const itemDensity = Math.max(0.03, 0.05 - floorNumber * 0.002);

    const enemies = this.contentPlacer.placeEnemies(
      baseLevel,
      roomDifficulty,
      enemyDensity
    );

    const items = this.contentPlacer.placeItems(
      baseLevel,
      roomDifficulty,
      itemDensity
    );

    // Place traps (more on deeper floors)
    const traps = this.placeTraps(baseLevel, floorNumber);

    // Place secrets
    const secrets = this.placeSecrets(baseLevel);

    return {
      ...baseLevel,
      startPoint: {
        x: Math.floor(startRoom.x + startRoom.width / 2),
        y: Math.floor(startRoom.y + startRoom.height / 2)
      },
      exitPoint: {
        x: Math.floor(exitRoom.x + exitRoom.width / 2),
        y: Math.floor(exitRoom.y + exitRoom.height / 2)
      },
      enemies,
      items,
      traps,
      secrets
    };
  }

  private placeTraps(level: Level, floorNumber: number): Point[] {
    const traps: Point[] = [];
    const trapChance = 0.01 + floorNumber * 0.005;

    // Place traps in corridors
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        if (level.getTile(x, y) === TileType.CORRIDOR) {
          if (this.random() < trapChance) {
            traps.push({ x, y });
          }
        }
      }
    }

    return traps;
  }

  private placeSecrets(level: Level): Point[] {
    const secrets: Point[] = [];

    // Look for potential secret locations (walls adjacent to rooms)
    for (const room of level.rooms) {
      // Check each wall
      const walls = [
        // North wall
        ...Array.from({ length: room.width }, (_, i) => ({
          x: room.x + i,
          y: room.y - 1
        })),
        // South wall
        ...Array.from({ length: room.width }, (_, i) => ({
          x: room.x + i,
          y: room.y + room.height
        })),
        // East wall
        ...Array.from({ length: room.height }, (_, i) => ({
          x: room.x + room.width,
          y: room.y + i
        })),
        // West wall
        ...Array.from({ length: room.height }, (_, i) => ({
          x: room.x - 1,
          y: room.y + i
        }))
      ];

      for (const wall of walls) {
        if (this.random() < 0.02) { // 2% chance per wall tile
          if (level.getTile(wall.x, wall.y) === TileType.WALL) {
            secrets.push(wall);
          }
        }
      }
    }

    return secrets;
  }
}
```

### Seeded Generation for Reproducibility

```typescript
class SeededLevelGenerator {
  private baseSeed: number;

  constructor(baseSeed: number) {
    this.baseSeed = baseSeed;
  }

  // Generate deterministic level for any floor
  generateFloor(floorNumber: number): RoguelikeLevel {
    // Combine base seed with floor number for unique but reproducible seed
    const floorSeed = this.hashCombine(this.baseSeed, floorNumber);

    const generator = new RoguelikeLevelGenerator(floorSeed);

    // Level size can also scale with floor
    const width = 60 + Math.floor(floorNumber / 5) * 10;
    const height = 40 + Math.floor(floorNumber / 5) * 5;

    return generator.generate(width, height, floorNumber);
  }

  private hashCombine(a: number, b: number): number {
    // Simple hash combination
    return a ^ (b + 0x9e3779b9 + (a << 6) + (a >> 2));
  }

  // Allow sharing seeds for multiplayer or challenges
  getSeedString(): string {
    return this.baseSeed.toString(36).toUpperCase();
  }

  static fromSeedString(seedString: string): SeededLevelGenerator {
    const seed = parseInt(seedString, 36);
    return new SeededLevelGenerator(seed);
  }
}
```

## Performance Optimization

### Chunked Generation

For large levels, generate in chunks:

```typescript
class ChunkedLevelGenerator {
  private chunkSize: number;
  private chunks: Map<string, Level>;
  private random: () => number;

  constructor(chunkSize: number = 32, seed?: number) {
    this.chunkSize = chunkSize;
    this.chunks = new Map();
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

  getChunk(chunkX: number, chunkY: number): Level {
    const key = `${chunkX},${chunkY}`;

    if (!this.chunks.has(key)) {
      this.chunks.set(key, this.generateChunk(chunkX, chunkY));
    }

    return this.chunks.get(key)!;
  }

  private generateChunk(chunkX: number, chunkY: number): Level {
    // Use position-based seed for reproducibility
    const chunkSeed = this.hashPosition(chunkX, chunkY);
    const generator = new BSPGenerator(chunkSeed);

    return generator.generate(this.chunkSize, this.chunkSize);
  }

  private hashPosition(x: number, y: number): number {
    // Cantor pairing function
    return ((x + y) * (x + y + 1)) / 2 + y;
  }

  getTile(worldX: number, worldY: number): TileType {
    const chunkX = Math.floor(worldX / this.chunkSize);
    const chunkY = Math.floor(worldY / this.chunkSize);
    const localX = worldX - chunkX * this.chunkSize;
    const localY = worldY - chunkY * this.chunkSize;

    const chunk = this.getChunk(chunkX, chunkY);
    return chunk.getTile(localX, localY);
  }

  unloadDistantChunks(centerX: number, centerY: number, radius: number): void {
    const centerChunkX = Math.floor(centerX / this.chunkSize);
    const centerChunkY = Math.floor(centerY / this.chunkSize);

    for (const [key] of this.chunks) {
      const [cx, cy] = key.split(',').map(Number);
      const distance = Math.max(
        Math.abs(cx - centerChunkX),
        Math.abs(cy - centerChunkY)
      );

      if (distance > radius) {
        this.chunks.delete(key);
      }
    }
  }
}
```

### Web Worker Generation

Offload generation to a web worker:

```typescript
// levelWorker.ts
self.onmessage = (e: MessageEvent) => {
  const { type, params } = e.data;

  switch (type) {
    case 'generate': {
      const { width, height, seed } = params;
      const generator = new BSPGenerator(seed);
      const level = generator.generate(width, height);

      // Serialize level data
      const serialized = {
        width: level.width,
        height: level.height,
        tiles: level.tiles,
        rooms: level.rooms
      };

      self.postMessage({ type: 'complete', level: serialized });
      break;
    }
  }
};

// Main thread usage
class AsyncLevelGenerator {
  private worker: Worker;
  private pendingResolve: ((level: Level) => void) | null = null;

  constructor() {
    this.worker = new Worker('levelWorker.js');

    this.worker.onmessage = (e) => {
      if (e.data.type === 'complete' && this.pendingResolve) {
        const level = this.deserializeLevel(e.data.level);
        this.pendingResolve(level);
        this.pendingResolve = null;
      }
    };
  }

  async generate(width: number, height: number, seed?: number): Promise<Level> {
    return new Promise((resolve) => {
      this.pendingResolve = resolve;
      this.worker.postMessage({
        type: 'generate',
        params: { width, height, seed }
      });
    });
  }

  private deserializeLevel(data: any): Level {
    const level = new Level(data.width, data.height);
    level.tiles = data.tiles;
    level.rooms = data.rooms;
    return level;
  }

  terminate(): void {
    this.worker.terminate();
  }
}
```

## Best Practices and Tips

### Design Guidelines

1. **Start Simple**: Begin with basic algorithms before adding complexity
2. **Validate Early**: Implement validation from the start
3. **Use Seeds**: Always support seeded generation for debugging and sharing
4. **Profile Performance**: Measure generation time and optimize bottlenecks
5. **Test Edge Cases**: Generate many levels to find rare issues

### Common Pitfalls

1. **Floating Point Issues**: Use integer math when possible
2. **Memory Leaks**: Clean up large arrays after generation
3. **Infinite Loops**: Add maximum iteration limits
4. **Bias in Randomness**: Ensure uniform distribution when needed

### Testing Strategies

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

    console.log(`Success rate: ${(successCount / iterations * 100).toFixed(2)}%`);
    console.log(`Average rooms: ${(totalRooms / iterations).toFixed(2)}`);
    console.log(`Room range: ${minRooms} - ${maxRooms}`);
  }
}
```

## Summary

Procedural level generation is a powerful technique that combines algorithms, constraints, and randomness to create unique, playable game content. Key takeaways:

1. **Algorithm Selection**: Choose the right algorithm for your game style:
   - BSP for structured dungeons
   - Room-corridor for organic layouts
   - Maze algorithms for exploration focus
   - WFC for pattern-based generation

2. **Validation is Critical**: Always validate generated content for:
   - Connectivity between areas
   - Proper difficulty progression
   - Minimum quality standards

3. **Difficulty Management**: Use distance-based difficulty calculation and scale content placement accordingly

4. **Performance Matters**: Consider chunking, caching, and web workers for large-scale generation

5. **Reproducibility**: Support seeded generation for debugging, sharing, and multiplayer

With these techniques, you can create endless unique experiences while maintaining the quality and intentionality of hand-crafted level design.

## Further Reading

- **Roguelike Development Resources**
  - Roguebasin Wiki
  - r/roguelikedev community

- **Academic Papers**
  - "Procedural Content Generation in Games" by Shaker, Togelius, Nelson
  - "The Model Synthesis Algorithm" by Paul Merrell

- **Game Development Communities**
  - Procedural Generation subreddit
  - Game Developer Conference (GDC) Vault talks on PCG

- **Libraries and Tools**
  - ROT.js (JavaScript roguelike toolkit)
  - libtcod (C/C++ roguelike library)
  - Unity PCG tools and assets
