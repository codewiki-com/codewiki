---
title: A* Pathfinding Algorithm Deep Dive
description: "Master game AI pathfinding: A*, Dijkstra, and heuristic function design"
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - pathfinding
  - A*
  - algorithms
  - game AI
status: imported
origin: old/src/content/docs/gamedev/pathfinding-astar.en.md
divergence: 0.239
issues: []
legacy:
  category: GameDev
  subcategory: AI
  order: 17
  lastUpdated: 2026-01-07
---

Pathfinding is one of the most fundamental problems in game development and robotics. Whether you are building an RPG where characters navigate complex dungeons, a strategy game with units moving across terrain, or a puzzle game with maze-solving mechanics, understanding pathfinding algorithms is essential. We explore graph search algorithms, with a deep focus on the A* algorithm and its practical implementations.

## Graph Search Fundamentals

### What is Pathfinding?

Pathfinding is the computational problem of finding a route between two points. In games, this typically means finding a path for a character or unit to move from its current position to a target destination while avoiding obstacles.

**Key Concepts:**

- **Graph**: A mathematical structure consisting of nodes (vertices) and edges connecting them
- **Node**: A discrete position in space (e.g., a tile, waypoint, or navigation mesh vertex)
- **Edge**: A connection between two nodes, often with an associated cost or weight
- **Path**: A sequence of connected nodes from start to goal
- **Cost**: The expense (time, distance, danger) of traversing an edge or path

### Graph Representations

Games typically represent navigable space in one of several ways:

**Grid-Based Representation:**
```typescript
// 2D grid where 0 = walkable, 1 = obstacle
const grid: number[][] = [
  [0, 0, 0, 1, 0],
  [0, 1, 0, 1, 0],
  [0, 1, 0, 0, 0],
  [0, 0, 0, 1, 0],
  [0, 0, 0, 1, 0]
];

interface GridNode {
  x: number;
  y: number;
  walkable: boolean;
}
```

**Waypoint Graph:**
```typescript
interface Waypoint {
  id: string;
  position: { x: number; y: number; z: number };
  connections: string[]; // IDs of connected waypoints
}

const waypoints: Map<string, Waypoint> = new Map();
```

**Navigation Mesh (NavMesh):**
```typescript
interface NavMeshPolygon {
  id: string;
  vertices: Array<{ x: number; y: number; z: number }>;
  neighbors: string[]; // IDs of adjacent polygons
}
```

### Search Problem Formalization

A pathfinding problem can be formalized as:

- **State Space**: All possible positions/configurations
- **Initial State**: Starting position
- **Goal State**: Target position (or goal test function)
- **Actions**: Possible moves from any state
- **Transition Model**: Result of applying an action
- **Path Cost**: Sum of edge costs along a path

## Breadth-First Search (BFS)

Before diving into A*, it is important to understand simpler graph search algorithms. BFS explores all nodes at the current depth before moving to nodes at the next depth level.

### BFS Implementation

```typescript
interface Node {
  x: number;
  y: number;
}

interface BFSResult {
  path: Node[];
  visited: Set<string>;
}

function nodeToKey(node: Node): string {
  return `${node.x},${node.y}`;
}

function getNeighbors(node: Node, grid: number[][]): Node[] {
  const directions = [
    { x: 0, y: -1 },  // up
    { x: 1, y: 0 },   // right
    { x: 0, y: 1 },   // down
    { x: -1, y: 0 }   // left
  ];

  const neighbors: Node[] = [];

  for (const dir of directions) {
    const newX = node.x + dir.x;
    const newY = node.y + dir.y;

    // Check bounds and walkability
    if (
      newX >= 0 && newX < grid[0].length &&
      newY >= 0 && newY < grid.length &&
      grid[newY][newX] === 0
    ) {
      neighbors.push({ x: newX, y: newY });
    }
  }

  return neighbors;
}

function bfs(start: Node, goal: Node, grid: number[][]): BFSResult {
  const queue: Node[] = [start];
  const visited = new Set<string>([nodeToKey(start)]);
  const cameFrom = new Map<string, Node | null>();
  cameFrom.set(nodeToKey(start), null);

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Goal reached
    if (current.x === goal.x && current.y === goal.y) {
      return {
        path: reconstructPath(cameFrom, current),
        visited
      };
    }

    // Explore neighbors
    for (const neighbor of getNeighbors(current, grid)) {
      const key = nodeToKey(neighbor);

      if (!visited.has(key)) {
        visited.add(key);
        cameFrom.set(key, current);
        queue.push(neighbor);
      }
    }
  }

  // No path found
  return { path: [], visited };
}

function reconstructPath(cameFrom: Map<string, Node | null>, current: Node): Node[] {
  const path: Node[] = [current];
  let currentKey = nodeToKey(current);

  while (cameFrom.get(currentKey) !== null) {
    current = cameFrom.get(currentKey)!;
    currentKey = nodeToKey(current);
    path.unshift(current);
  }

  return path;
}
```

### BFS Characteristics

| Property | Value |
|----------|-------|
| Complete | Yes (will find a path if one exists) |
| Optimal | Yes (for unweighted graphs) |
| Time Complexity | O(V + E) where V = vertices, E = edges |
| Space Complexity | O(V) |

**Limitations:**
- Does not consider edge weights
- Explores uniformly in all directions
- Inefficient for large search spaces

## Dijkstra's Algorithm

Dijkstra's algorithm extends BFS to handle weighted graphs, always expanding the node with the lowest cumulative cost from the start.

### Dijkstra Implementation

```typescript
interface WeightedNode extends Node {
  cost: number;
}

class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority: number): void {
    this.items.push({ item, priority });
    this.items.sort((a, b) => a.priority - b.priority);
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

function dijkstra(
  start: Node,
  goal: Node,
  grid: number[][],
  getCost: (from: Node, to: Node) => number = () => 1
): { path: Node[]; cost: number } {
  const openSet = new PriorityQueue<Node>();
  const gScore = new Map<string, number>();
  const cameFrom = new Map<string, Node | null>();

  const startKey = nodeToKey(start);
  gScore.set(startKey, 0);
  cameFrom.set(startKey, null);
  openSet.enqueue(start, 0);

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue()!;
    const currentKey = nodeToKey(current);

    // Goal reached
    if (current.x === goal.x && current.y === goal.y) {
      return {
        path: reconstructPath(cameFrom, current),
        cost: gScore.get(currentKey)!
      };
    }

    const currentGScore = gScore.get(currentKey) ?? Infinity;

    for (const neighbor of getNeighbors(current, grid)) {
      const neighborKey = nodeToKey(neighbor);
      const moveCost = getCost(current, neighbor);
      const tentativeGScore = currentGScore + moveCost;

      if (tentativeGScore < (gScore.get(neighborKey) ?? Infinity)) {
        gScore.set(neighborKey, tentativeGScore);
        cameFrom.set(neighborKey, current);
        openSet.enqueue(neighbor, tentativeGScore);
      }
    }
  }

  return { path: [], cost: Infinity };
}
```

### Terrain Cost Example

```typescript
// Different terrain types with movement costs
enum Terrain {
  Road = 1,
  Grass = 2,
  Forest = 3,
  Swamp = 5,
  Mountain = 10
}

const terrainGrid: Terrain[][] = [
  [Terrain.Road, Terrain.Road, Terrain.Grass, Terrain.Forest],
  [Terrain.Grass, Terrain.Swamp, Terrain.Swamp, Terrain.Forest],
  [Terrain.Grass, Terrain.Grass, Terrain.Grass, Terrain.Mountain],
  [Terrain.Road, Terrain.Road, Terrain.Road, Terrain.Road]
];

function getTerrainCost(from: Node, to: Node): number {
  return terrainGrid[to.y][to.x];
}

// Find path considering terrain costs
const result = dijkstra(
  { x: 0, y: 0 },
  { x: 3, y: 3 },
  terrainGrid.map(row => row.map(() => 0)), // All walkable
  getTerrainCost
);
```

### Dijkstra Characteristics

| Property | Value |
|----------|-------|
| Complete | Yes |
| Optimal | Yes (for non-negative edge weights) |
| Time Complexity | O((V + E) log V) with binary heap |
| Space Complexity | O(V) |

**Limitations:**
- Still explores in all directions uniformly
- Does not use any information about goal location
- Can be slow for large graphs with distant goals

## The A* Algorithm

A* combines the benefits of Dijkstra's algorithm with heuristic search, making it the most popular pathfinding algorithm in games.

### A* Core Concept

A* evaluates nodes using the function:

$$f(n) = g(n) + h(n)$$

Where:
- **g(n)**: Actual cost from start to node n
- **h(n)**: Estimated cost from node n to goal (heuristic)
- **f(n)**: Estimated total cost of path through node n

The key insight is that A* uses the heuristic to guide the search toward the goal, dramatically reducing the number of nodes explored.

### A* Implementation

```typescript
interface AStarNode extends Node {
  g: number;  // Cost from start
  h: number;  // Heuristic estimate to goal
  f: number;  // Total estimated cost (g + h)
  parent: AStarNode | null;
}

function aStar(
  start: Node,
  goal: Node,
  grid: number[][],
  heuristic: (a: Node, b: Node) => number,
  getCost: (from: Node, to: Node) => number = () => 1
): { path: Node[]; nodesExplored: number } {
  const openSet = new PriorityQueue<AStarNode>();
  const openSetMap = new Map<string, AStarNode>();
  const closedSet = new Set<string>();

  const startNode: AStarNode = {
    ...start,
    g: 0,
    h: heuristic(start, goal),
    f: heuristic(start, goal),
    parent: null
  };

  openSet.enqueue(startNode, startNode.f);
  openSetMap.set(nodeToKey(start), startNode);

  let nodesExplored = 0;

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue()!;
    const currentKey = nodeToKey(current);

    nodesExplored++;

    // Goal reached
    if (current.x === goal.x && current.y === goal.y) {
      return {
        path: reconstructAStarPath(current),
        nodesExplored
      };
    }

    openSetMap.delete(currentKey);
    closedSet.add(currentKey);

    for (const neighbor of getNeighbors(current, grid)) {
      const neighborKey = nodeToKey(neighbor);

      if (closedSet.has(neighborKey)) {
        continue;
      }

      const tentativeG = current.g + getCost(current, neighbor);
      const existingNode = openSetMap.get(neighborKey);

      if (!existingNode) {
        // New node discovered
        const h = heuristic(neighbor, goal);
        const neighborNode: AStarNode = {
          ...neighbor,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: current
        };
        openSet.enqueue(neighborNode, neighborNode.f);
        openSetMap.set(neighborKey, neighborNode);
      } else if (tentativeG < existingNode.g) {
        // Found a better path to existing node
        existingNode.g = tentativeG;
        existingNode.f = tentativeG + existingNode.h;
        existingNode.parent = current;
        // Re-add with updated priority
        openSet.enqueue(existingNode, existingNode.f);
      }
    }
  }

  return { path: [], nodesExplored };
}

function reconstructAStarPath(node: AStarNode): Node[] {
  const path: Node[] = [];
  let current: AStarNode | null = node;

  while (current !== null) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }

  return path;
}
```

### A* Algorithm Pseudocode

```
function A*(start, goal):
    openSet = priority queue containing start
    closedSet = empty set
    gScore[start] = 0
    fScore[start] = heuristic(start, goal)

    while openSet is not empty:
        current = node in openSet with lowest fScore

        if current == goal:
            return reconstruct_path(current)

        remove current from openSet
        add current to closedSet

        for each neighbor of current:
            if neighbor in closedSet:
                continue

            tentative_g = gScore[current] + cost(current, neighbor)

            if neighbor not in openSet:
                add neighbor to openSet
            else if tentative_g >= gScore[neighbor]:
                continue  // Not a better path

            // This is the best path so far
            cameFrom[neighbor] = current
            gScore[neighbor] = tentative_g
            fScore[neighbor] = gScore[neighbor] + heuristic(neighbor, goal)

    return failure  // No path found
```

## Heuristic Functions

The choice of heuristic function is crucial for A* performance. A good heuristic guides the search efficiently without overestimating costs.

### Admissibility and Consistency

**Admissible Heuristic:**
A heuristic h(n) is admissible if it never overestimates the true cost to reach the goal:

$$h(n) \leq h^*(n)$$

where h*(n) is the actual cost from n to the goal.

**Consistent (Monotonic) Heuristic:**
A heuristic is consistent if for every node n and successor n':

$$h(n) \leq cost(n, n') + h(n')$$

Consistency implies admissibility, and ensures A* never needs to re-expand nodes.

### Manhattan Distance

Best for grids with 4-directional movement (no diagonal):

```typescript
function manhattanDistance(a: Node, b: Node): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
```

**Properties:**
- Admissible for 4-directional movement with uniform costs
- Simple and fast to compute
- Returns exact distance on open grids without obstacles

**Visual Example:**
```
Start (S) to Goal (G) = |4-0| + |3-0| = 7

  0 1 2 3 4
0 S . . . .
1 . . . . .
2 . . . . .
3 . . . . G
```

### Euclidean Distance

Best for movement in any direction:

```typescript
function euclideanDistance(a: Node, b: Node): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
```

**Properties:**
- Admissible for any movement pattern
- Provides tighter estimates when diagonal movement costs sqrt(2)
- More computationally expensive due to square root

### Diagonal Distance (Chebyshev/Octile)

Best for 8-directional movement:

```typescript
// Chebyshev distance (diagonal movement costs same as cardinal)
function chebyshevDistance(a: Node, b: Node): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

// Octile distance (diagonal movement costs sqrt(2))
function octileDistance(a: Node, b: Node): number {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  const D = 1;           // Cardinal cost
  const D2 = Math.SQRT2; // Diagonal cost

  return D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy);
}
```

### Weighted Heuristics

Sometimes you want to trade optimality for speed by inflating the heuristic:

```typescript
function weightedHeuristic(
  a: Node,
  b: Node,
  weight: number = 1.0
): number {
  return manhattanDistance(a, b) * weight;
}

// weight = 1.0: Optimal A*
// weight > 1.0: Weighted A* (faster but possibly suboptimal)
// weight = infinity: Greedy Best-First Search
```

**Trade-offs:**

| Weight | Behavior | Path Quality |
|--------|----------|--------------|
| 1.0 | Optimal A* | Guaranteed optimal |
| 1.0-1.5 | Bounded suboptimal | Good balance |
| 2.0+ | Greedy search | May be significantly suboptimal |

### Heuristic Comparison

```typescript
// Compare different heuristics
function compareHeuristics(
  start: Node,
  goal: Node,
  grid: number[][]
): void {
  const heuristics = [
    { name: 'Manhattan', fn: manhattanDistance },
    { name: 'Euclidean', fn: euclideanDistance },
    { name: 'Chebyshev', fn: chebyshevDistance },
    { name: 'Octile', fn: octileDistance },
    { name: 'Weighted (1.5)', fn: (a: Node, b: Node) => manhattanDistance(a, b) * 1.5 }
  ];

  console.log('Heuristic Comparison:');
  console.log('=====================');

  for (const { name, fn } of heuristics) {
    const result = aStar(start, goal, grid, fn);
    console.log(`${name}:`);
    console.log(`  Path length: ${result.path.length}`);
    console.log(`  Nodes explored: ${result.nodesExplored}`);
  }
}
```

## Open and Closed Lists

The open and closed lists (or sets) are fundamental data structures in A*.

### Open List (Frontier)

The open list contains nodes that have been discovered but not yet fully explored. It is typically implemented as a priority queue for efficient minimum extraction.

**Binary Heap Implementation:**

```typescript
class BinaryHeap<T> {
  private heap: Array<{ item: T; priority: number }> = [];

  push(item: T, priority: number): void {
    this.heap.push({ item, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;

    const min = this.heap[0];
    const last = this.heap.pop()!;

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }

    return min.item;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].priority <= this.heap[index].priority) {
        break;
      }
      [this.heap[parentIndex], this.heap[index]] =
        [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (
        leftChild < this.heap.length &&
        this.heap[leftChild].priority < this.heap[smallest].priority
      ) {
        smallest = leftChild;
      }

      if (
        rightChild < this.heap.length &&
        this.heap[rightChild].priority < this.heap[smallest].priority
      ) {
        smallest = rightChild;
      }

      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] =
        [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }
}
```

### Closed List (Explored Set)

The closed list tracks nodes that have been fully explored to avoid redundant work.

**Efficient Implementation with Hash Set:**

```typescript
class ClosedSet {
  private set = new Set<string>();

  add(node: Node): void {
    this.set.add(`${node.x},${node.y}`);
  }

  has(node: Node): boolean {
    return this.set.has(`${node.x},${node.y}`);
  }

  get size(): number {
    return this.set.size;
  }
}
```

### Open List Optimization with Indexed Heap

For large-scale pathfinding, an indexed heap allows O(log n) updates:

```typescript
class IndexedPriorityQueue<T> {
  private heap: Array<{ item: T; key: string; priority: number }> = [];
  private indexMap = new Map<string, number>();

  enqueue(item: T, key: string, priority: number): void {
    if (this.indexMap.has(key)) {
      this.updatePriority(key, priority);
      return;
    }

    const index = this.heap.length;
    this.heap.push({ item, key, priority });
    this.indexMap.set(key, index);
    this.bubbleUp(index);
  }

  updatePriority(key: string, priority: number): void {
    const index = this.indexMap.get(key);
    if (index === undefined) return;

    const oldPriority = this.heap[index].priority;
    this.heap[index].priority = priority;

    if (priority < oldPriority) {
      this.bubbleUp(index);
    } else {
      this.bubbleDown(index);
    }
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;

    const min = this.heap[0];
    this.indexMap.delete(min.key);

    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.indexMap.set(last.key, 0);
      this.bubbleDown(0);
    }

    return min.item;
  }

  has(key: string): boolean {
    return this.indexMap.has(key);
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].priority <= this.heap[index].priority) break;

      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < this.heap.length &&
          this.heap[left].priority < this.heap[smallest].priority) {
        smallest = left;
      }
      if (right < this.heap.length &&
          this.heap[right].priority < this.heap[smallest].priority) {
        smallest = right;
      }

      if (smallest === index) break;

      this.swap(index, smallest);
      index = smallest;
    }
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    this.indexMap.set(this.heap[i].key, i);
    this.indexMap.set(this.heap[j].key, j);
  }
}
```

## Path Smoothing

Raw A* paths on grids often appear unnatural with zigzag patterns. Path smoothing techniques create more natural-looking movement.

### Line-of-Sight Smoothing

Remove unnecessary waypoints if direct line of sight exists:

```typescript
function lineOfSight(
  start: Node,
  end: Node,
  grid: number[][]
): boolean {
  // Bresenham's line algorithm
  let x0 = start.x;
  let y0 = start.y;
  const x1 = end.x;
  const y1 = end.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    if (grid[y0][x0] !== 0) {
      return false; // Obstacle found
    }

    if (x0 === x1 && y0 === y1) {
      return true; // Reached end
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

function smoothPath(path: Node[], grid: number[][]): Node[] {
  if (path.length <= 2) return path;

  const smoothed: Node[] = [path[0]];
  let current = 0;

  while (current < path.length - 1) {
    let farthest = current + 1;

    // Find farthest visible point
    for (let i = current + 2; i < path.length; i++) {
      if (lineOfSight(path[current], path[i], grid)) {
        farthest = i;
      }
    }

    smoothed.push(path[farthest]);
    current = farthest;
  }

  return smoothed;
}
```

### Funnel Algorithm (for Navigation Meshes)

The funnel algorithm produces optimal smooth paths through convex polygon portals:

```typescript
interface Portal {
  left: { x: number; y: number };
  right: { x: number; y: number };
}

function funnelAlgorithm(
  start: { x: number; y: number },
  goal: { x: number; y: number },
  portals: Portal[]
): Array<{ x: number; y: number }> {
  const path: Array<{ x: number; y: number }> = [start];

  let apex = start;
  let apexIndex = 0;
  let leftIndex = 0;
  let rightIndex = 0;

  let portalLeft = start;
  let portalRight = start;

  for (let i = 1; i <= portals.length; i++) {
    const left = i < portals.length ? portals[i].left : goal;
    const right = i < portals.length ? portals[i].right : goal;

    // Update right vertex
    if (triArea2(apex, portalRight, right) <= 0) {
      if (vectorEquals(apex, portalRight) ||
          triArea2(apex, portalLeft, right) > 0) {
        portalRight = right;
        rightIndex = i;
      } else {
        path.push(portalLeft);
        apex = portalLeft;
        apexIndex = leftIndex;

        portalLeft = apex;
        portalRight = apex;
        leftIndex = apexIndex;
        rightIndex = apexIndex;
        i = apexIndex;
        continue;
      }
    }

    // Update left vertex
    if (triArea2(apex, portalLeft, left) >= 0) {
      if (vectorEquals(apex, portalLeft) ||
          triArea2(apex, portalRight, left) < 0) {
        portalLeft = left;
        leftIndex = i;
      } else {
        path.push(portalRight);
        apex = portalRight;
        apexIndex = rightIndex;

        portalLeft = apex;
        portalRight = apex;
        leftIndex = apexIndex;
        rightIndex = apexIndex;
        i = apexIndex;
        continue;
      }
    }
  }

  path.push(goal);
  return path;
}

function triArea2(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number }
): number {
  return (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y);
}

function vectorEquals(
  a: { x: number; y: number },
  b: { x: number; y: number }
): boolean {
  return Math.abs(a.x - b.x) < 0.0001 && Math.abs(a.y - b.y) < 0.0001;
}
```

### Catmull-Rom Spline Smoothing

Create smooth curves through waypoints:

```typescript
interface Vector2 {
  x: number;
  y: number;
}

function catmullRomSpline(
  points: Vector2[],
  segments: number = 10
): Vector2[] {
  if (points.length < 4) return points;

  const result: Vector2[] = [];

  for (let i = 0; i < points.length - 3; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3];

    for (let j = 0; j < segments; j++) {
      const t = j / segments;
      result.push(catmullRomPoint(p0, p1, p2, p3, t));
    }
  }

  result.push(points[points.length - 2]);
  result.push(points[points.length - 1]);

  return result;
}

function catmullRomPoint(
  p0: Vector2,
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
  t: number
): Vector2 {
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    ),
    y: 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    )
  };
}
```

## Jump Point Search (JPS)

Jump Point Search is an optimization for A* on uniform-cost grids that can be 10x or more faster by "jumping" over intermediate nodes.

### JPS Core Concepts

JPS exploits path symmetry on grids. Instead of expanding all neighbors, it identifies "jump points" - nodes where the optimal path could change direction.

**Key Principles:**
1. **Natural Neighbors**: Neighbors reachable optimally without going through current node
2. **Forced Neighbors**: Neighbors that require going through current node due to obstacles
3. **Jump Points**: Nodes with forced neighbors or at direction changes

### JPS Implementation

```typescript
interface JPSNode extends Node {
  g: number;
  f: number;
  parent: JPSNode | null;
  dx: number;
  dy: number;
}

class JumpPointSearch {
  private grid: number[][];
  private width: number;
  private height: number;

  constructor(grid: number[][]) {
    this.grid = grid;
    this.height = grid.length;
    this.width = grid[0].length;
  }

  isWalkable(x: number, y: number): boolean {
    return (
      x >= 0 && x < this.width &&
      y >= 0 && y < this.height &&
      this.grid[y][x] === 0
    );
  }

  findPath(start: Node, goal: Node): Node[] {
    const openSet = new BinaryHeap<JPSNode>();
    const openMap = new Map<string, JPSNode>();
    const closedSet = new Set<string>();

    const startNode: JPSNode = {
      ...start,
      g: 0,
      f: octileDistance(start, goal),
      parent: null,
      dx: 0,
      dy: 0
    };

    openSet.push(startNode, startNode.f);
    openMap.set(nodeToKey(start), startNode);

    while (!openSet.isEmpty()) {
      const current = openSet.pop()!;
      const currentKey = nodeToKey(current);

      if (current.x === goal.x && current.y === goal.y) {
        return this.reconstructPath(current);
      }

      openMap.delete(currentKey);
      closedSet.add(currentKey);

      const neighbors = this.findNeighbors(current);

      for (const neighbor of neighbors) {
        const jumpPoint = this.jump(
          neighbor.x,
          neighbor.y,
          current.x,
          current.y,
          goal
        );

        if (!jumpPoint) continue;

        const jumpKey = nodeToKey(jumpPoint);
        if (closedSet.has(jumpKey)) continue;

        const dx = jumpPoint.x - current.x;
        const dy = jumpPoint.y - current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const g = current.g + distance;

        const existingNode = openMap.get(jumpKey);

        if (!existingNode || g < existingNode.g) {
          const h = octileDistance(jumpPoint, goal);
          const jumpNode: JPSNode = {
            ...jumpPoint,
            g,
            f: g + h,
            parent: current,
            dx: Math.sign(dx),
            dy: Math.sign(dy)
          };

          openSet.push(jumpNode, jumpNode.f);
          openMap.set(jumpKey, jumpNode);
        }
      }
    }

    return [];
  }

  private jump(
    x: number,
    y: number,
    px: number,
    py: number,
    goal: Node
  ): Node | null {
    const dx = x - px;
    const dy = y - py;

    if (!this.isWalkable(x, y)) {
      return null;
    }

    if (x === goal.x && y === goal.y) {
      return { x, y };
    }

    // Check forced neighbors
    if (dx !== 0 && dy !== 0) {
      // Diagonal case
      if (
        (this.isWalkable(x - dx, y + dy) && !this.isWalkable(x - dx, y)) ||
        (this.isWalkable(x + dx, y - dy) && !this.isWalkable(x, y - dy))
      ) {
        return { x, y };
      }

      // Recursive horizontal/vertical checks
      if (
        this.jump(x + dx, y, x, y, goal) ||
        this.jump(x, y + dy, x, y, goal)
      ) {
        return { x, y };
      }
    } else {
      // Horizontal/Vertical case
      if (dx !== 0) {
        if (
          (this.isWalkable(x + dx, y + 1) && !this.isWalkable(x, y + 1)) ||
          (this.isWalkable(x + dx, y - 1) && !this.isWalkable(x, y - 1))
        ) {
          return { x, y };
        }
      } else {
        if (
          (this.isWalkable(x + 1, y + dy) && !this.isWalkable(x + 1, y)) ||
          (this.isWalkable(x - 1, y + dy) && !this.isWalkable(x - 1, y))
        ) {
          return { x, y };
        }
      }
    }

    // Continue jumping
    return this.jump(x + dx, y + dy, x, y, goal);
  }

  private findNeighbors(node: JPSNode): Node[] {
    const { x, y, dx, dy, parent } = node;
    const neighbors: Node[] = [];

    if (!parent) {
      // Start node: return all walkable neighbors
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          if (this.isWalkable(x + i, y + j)) {
            neighbors.push({ x: x + i, y: y + j });
          }
        }
      }
      return neighbors;
    }

    // Pruned neighbors based on direction
    if (dx !== 0 && dy !== 0) {
      // Diagonal movement
      if (this.isWalkable(x, y + dy)) {
        neighbors.push({ x, y: y + dy });
      }
      if (this.isWalkable(x + dx, y)) {
        neighbors.push({ x: x + dx, y });
      }
      if (this.isWalkable(x + dx, y + dy)) {
        neighbors.push({ x: x + dx, y: y + dy });
      }
      if (!this.isWalkable(x - dx, y)) {
        neighbors.push({ x: x - dx, y: y + dy });
      }
      if (!this.isWalkable(x, y - dy)) {
        neighbors.push({ x: x + dx, y: y - dy });
      }
    } else if (dx !== 0) {
      // Horizontal movement
      if (this.isWalkable(x + dx, y)) {
        neighbors.push({ x: x + dx, y });
      }
      if (!this.isWalkable(x, y + 1)) {
        neighbors.push({ x: x + dx, y: y + 1 });
      }
      if (!this.isWalkable(x, y - 1)) {
        neighbors.push({ x: x + dx, y: y - 1 });
      }
    } else {
      // Vertical movement
      if (this.isWalkable(x, y + dy)) {
        neighbors.push({ x, y: y + dy });
      }
      if (!this.isWalkable(x + 1, y)) {
        neighbors.push({ x: x + 1, y: y + dy });
      }
      if (!this.isWalkable(x - 1, y)) {
        neighbors.push({ x: x - 1, y: y + dy });
      }
    }

    return neighbors;
  }

  private reconstructPath(node: JPSNode): Node[] {
    const path: Node[] = [];
    let current: JPSNode | null = node;

    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }

    return path;
  }
}
```

### JPS Performance Comparison

| Scenario | A* Nodes Explored | JPS Nodes Explored | Speedup |
|----------|-------------------|---------------------|---------|
| Open field | 1000 | 50 | 20x |
| Sparse obstacles | 800 | 120 | 6.7x |
| Dense obstacles | 500 | 200 | 2.5x |
| Maze-like | 300 | 250 | 1.2x |

**When to Use JPS:**
- Uniform-cost grids (all movement costs equal)
- Large open areas
- 8-directional movement
- Static environments

**When NOT to Use JPS:**
- Variable terrain costs
- Frequently changing maps
- 4-directional only movement
- Navigation meshes

## Real-Time Pathfinding Optimization

Games require pathfinding to complete within strict time budgets. Key optimization techniques follow.

### Hierarchical Pathfinding (HPA*)

Divide the map into clusters and precompute inter-cluster paths:

```typescript
interface Cluster {
  id: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  entrances: Map<number, Node[]>; // Adjacent cluster ID -> entrance nodes
  intraEdges: Map<string, Map<string, number>>; // Internal path costs
}

class HierarchicalPathfinder {
  private clusters: Cluster[] = [];
  private clusterSize: number;
  private grid: number[][];

  constructor(grid: number[][], clusterSize: number = 10) {
    this.grid = grid;
    this.clusterSize = clusterSize;
    this.buildClusters();
    this.findEntrances();
    this.precomputeIntraClusterPaths();
  }

  private buildClusters(): void {
    const rows = Math.ceil(this.grid.length / this.clusterSize);
    const cols = Math.ceil(this.grid[0].length / this.clusterSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.clusters.push({
          id: row * cols + col,
          bounds: {
            minX: col * this.clusterSize,
            minY: row * this.clusterSize,
            maxX: Math.min((col + 1) * this.clusterSize, this.grid[0].length),
            maxY: Math.min((row + 1) * this.clusterSize, this.grid.length)
          },
          entrances: new Map(),
          intraEdges: new Map()
        });
      }
    }
  }

  private findEntrances(): void {
    // Find transition points between adjacent clusters
    // (Implementation details omitted for brevity)
  }

  private precomputeIntraClusterPaths(): void {
    // Precompute paths between all entrances within each cluster
    // (Implementation details omitted for brevity)
  }

  findPath(start: Node, goal: Node): Node[] {
    // 1. Find which clusters contain start and goal
    const startCluster = this.getCluster(start);
    const goalCluster = this.getCluster(goal);

    if (startCluster === goalCluster) {
      // Use regular A* within the cluster
      return this.intraClusterPath(start, goal, startCluster);
    }

    // 2. Find high-level path through cluster graph
    const abstractPath = this.abstractSearch(startCluster, goalCluster);

    // 3. Refine path with actual coordinates
    return this.refinePath(start, goal, abstractPath);
  }

  private getCluster(node: Node): Cluster {
    const col = Math.floor(node.x / this.clusterSize);
    const row = Math.floor(node.y / this.clusterSize);
    const cols = Math.ceil(this.grid[0].length / this.clusterSize);
    return this.clusters[row * cols + col];
  }

  private abstractSearch(start: Cluster, goal: Cluster): Cluster[] {
    // A* on cluster graph
    // (Simplified implementation)
    return [];
  }

  private intraClusterPath(start: Node, goal: Node, cluster: Cluster): Node[] {
    // Regular A* within cluster bounds
    return [];
  }

  private refinePath(start: Node, goal: Node, clusters: Cluster[]): Node[] {
    // Combine precomputed paths with dynamic portions
    return [];
  }
}
```

### Time-Sliced Pathfinding

Spread pathfinding computation across multiple frames:

```typescript
class TimeSlicedPathfinder {
  private activeRequests: Map<number, PathRequest> = new Map();
  private nextRequestId = 0;
  private maxIterationsPerFrame = 100;

  requestPath(
    start: Node,
    goal: Node,
    grid: number[][],
    callback: (path: Node[]) => void
  ): number {
    const id = this.nextRequestId++;

    const request: PathRequest = {
      id,
      start,
      goal,
      grid,
      callback,
      state: this.initializeSearch(start, goal)
    };

    this.activeRequests.set(id, request);
    return id;
  }

  cancelRequest(id: number): void {
    this.activeRequests.delete(id);
  }

  update(): void {
    let iterationsUsed = 0;

    for (const [id, request] of this.activeRequests) {
      const iterationsForRequest = Math.min(
        this.maxIterationsPerFrame - iterationsUsed,
        50 // Max iterations per request per frame
      );

      const result = this.continueSearch(request, iterationsForRequest);
      iterationsUsed += result.iterations;

      if (result.complete) {
        request.callback(result.path);
        this.activeRequests.delete(id);
      }

      if (iterationsUsed >= this.maxIterationsPerFrame) {
        break;
      }
    }
  }

  private initializeSearch(start: Node, goal: Node): SearchState {
    return {
      openSet: new BinaryHeap<AStarNode>(),
      closedSet: new Set<string>(),
      goal
    };
  }

  private continueSearch(
    request: PathRequest,
    maxIterations: number
  ): { complete: boolean; path: Node[]; iterations: number } {
    const { state, grid } = request;
    let iterations = 0;

    while (!state.openSet.isEmpty() && iterations < maxIterations) {
      iterations++;

      const current = state.openSet.pop()!;

      if (current.x === state.goal.x && current.y === state.goal.y) {
        return {
          complete: true,
          path: reconstructAStarPath(current),
          iterations
        };
      }

      // Continue A* logic...
    }

    if (state.openSet.isEmpty()) {
      return { complete: true, path: [], iterations };
    }

    return { complete: false, path: [], iterations };
  }
}

interface PathRequest {
  id: number;
  start: Node;
  goal: Node;
  grid: number[][];
  callback: (path: Node[]) => void;
  state: SearchState;
}

interface SearchState {
  openSet: BinaryHeap<AStarNode>;
  closedSet: Set<string>;
  goal: Node;
}
```

### Path Caching and Reuse

Cache frequently used paths:

```typescript
class PathCache {
  private cache = new Map<string, CachedPath>();
  private maxCacheSize = 1000;
  private maxPathAge = 60000; // 60 seconds

  private getCacheKey(start: Node, goal: Node): string {
    // Round to grid cells for cache keys
    const sx = Math.floor(start.x / 10) * 10;
    const sy = Math.floor(start.y / 10) * 10;
    const gx = Math.floor(goal.x / 10) * 10;
    const gy = Math.floor(goal.y / 10) * 10;
    return `${sx},${sy}-${gx},${gy}`;
  }

  get(start: Node, goal: Node): Node[] | null {
    const key = this.getCacheKey(start, goal);
    const cached = this.cache.get(key);

    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.maxPathAge) {
      this.cache.delete(key);
      return null;
    }

    cached.hits++;
    return cached.path;
  }

  set(start: Node, goal: Node, path: Node[]): void {
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldest();
    }

    const key = this.getCacheKey(start, goal);
    this.cache.set(key, {
      path,
      timestamp: Date.now(),
      hits: 0
    });
  }

  invalidateArea(bounds: { minX: number; minY: number; maxX: number; maxY: number }): void {
    for (const [key, cached] of this.cache) {
      // Check if any point in path intersects bounds
      for (const node of cached.path) {
        if (
          node.x >= bounds.minX && node.x <= bounds.maxX &&
          node.y >= bounds.minY && node.y <= bounds.maxY
        ) {
          this.cache.delete(key);
          break;
        }
      }
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, cached] of this.cache) {
      if (cached.timestamp < oldestTime) {
        oldestTime = cached.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

interface CachedPath {
  path: Node[];
  timestamp: number;
  hits: number;
}
```

### Spatial Hashing for Neighbor Lookup

Optimize neighbor queries in large worlds:

```typescript
class SpatialHash {
  private cellSize: number;
  private cells = new Map<string, Set<Entity>>();

  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  insert(entity: Entity): void {
    const key = this.getCellKey(entity.x, entity.y);

    if (!this.cells.has(key)) {
      this.cells.set(key, new Set());
    }

    this.cells.get(key)!.add(entity);
    entity.spatialHashKey = key;
  }

  remove(entity: Entity): void {
    if (entity.spatialHashKey) {
      this.cells.get(entity.spatialHashKey)?.delete(entity);
    }
  }

  update(entity: Entity): void {
    const newKey = this.getCellKey(entity.x, entity.y);

    if (newKey !== entity.spatialHashKey) {
      this.remove(entity);
      this.insert(entity);
    }
  }

  queryRadius(x: number, y: number, radius: number): Entity[] {
    const results: Entity[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);

    const centerCellX = Math.floor(x / this.cellSize);
    const centerCellY = Math.floor(y / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerCellX + dx},${centerCellY + dy}`;
        const cell = this.cells.get(key);

        if (cell) {
          for (const entity of cell) {
            const dist = Math.sqrt(
              (entity.x - x) ** 2 + (entity.y - y) ** 2
            );
            if (dist <= radius) {
              results.push(entity);
            }
          }
        }
      }
    }

    return results;
  }
}

interface Entity {
  x: number;
  y: number;
  spatialHashKey?: string;
}
```

## Complete Example: Game Pathfinding System

The following is a complete, production-ready pathfinding system combining the concepts covered:

```typescript
// Complete pathfinding system for games
interface PathfinderConfig {
  gridWidth: number;
  gridHeight: number;
  allowDiagonal: boolean;
  heuristicWeight: number;
  maxSearchNodes: number;
  enableJPS: boolean;
  enableCaching: boolean;
  smoothPaths: boolean;
}

class GamePathfinder {
  private config: PathfinderConfig;
  private grid: number[][];
  private cache: PathCache;
  private jps: JumpPointSearch | null = null;

  constructor(config: Partial<PathfinderConfig> = {}) {
    this.config = {
      gridWidth: 100,
      gridHeight: 100,
      allowDiagonal: true,
      heuristicWeight: 1.0,
      maxSearchNodes: 10000,
      enableJPS: true,
      enableCaching: true,
      smoothPaths: true,
      ...config
    };

    this.grid = this.createEmptyGrid();
    this.cache = new PathCache();

    if (this.config.enableJPS) {
      this.jps = new JumpPointSearch(this.grid);
    }
  }

  private createEmptyGrid(): number[][] {
    return Array(this.config.gridHeight)
      .fill(null)
      .map(() => Array(this.config.gridWidth).fill(0));
  }

  setObstacle(x: number, y: number, blocked: boolean): void {
    if (this.isValidCoord(x, y)) {
      this.grid[y][x] = blocked ? 1 : 0;

      // Invalidate affected cache entries
      if (this.config.enableCaching) {
        this.cache.invalidateArea({
          minX: x - 10,
          minY: y - 10,
          maxX: x + 10,
          maxY: y + 10
        });
      }

      // Rebuild JPS if enabled
      if (this.config.enableJPS) {
        this.jps = new JumpPointSearch(this.grid);
      }
    }
  }

  private isValidCoord(x: number, y: number): boolean {
    return (
      x >= 0 && x < this.config.gridWidth &&
      y >= 0 && y < this.config.gridHeight
    );
  }

  findPath(
    startX: number,
    startY: number,
    goalX: number,
    goalY: number
  ): Node[] {
    const start = { x: Math.round(startX), y: Math.round(startY) };
    const goal = { x: Math.round(goalX), y: Math.round(goalY) };

    // Validate coordinates
    if (!this.isValidCoord(start.x, start.y) ||
        !this.isValidCoord(goal.x, goal.y)) {
      return [];
    }

    // Check if start or goal is blocked
    if (this.grid[start.y][start.x] !== 0 ||
        this.grid[goal.y][goal.x] !== 0) {
      return [];
    }

    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.cache.get(start, goal);
      if (cached) {
        return this.config.smoothPaths ?
          smoothPath(cached, this.grid) : cached;
      }
    }

    // Choose algorithm
    let path: Node[];

    if (this.config.enableJPS && this.jps) {
      path = this.jps.findPath(start, goal);
    } else {
      const heuristic = this.config.allowDiagonal ?
        (a: Node, b: Node) => octileDistance(a, b) * this.config.heuristicWeight :
        (a: Node, b: Node) => manhattanDistance(a, b) * this.config.heuristicWeight;

      const result = aStar(start, goal, this.grid, heuristic);
      path = result.path;
    }

    // Cache result
    if (this.config.enableCaching && path.length > 0) {
      this.cache.set(start, goal, path);
    }

    // Smooth path if enabled
    if (this.config.smoothPaths && path.length > 0) {
      path = smoothPath(path, this.grid);
    }

    return path;
  }

  // Async version for long paths
  async findPathAsync(
    startX: number,
    startY: number,
    goalX: number,
    goalY: number
  ): Promise<Node[]> {
    return new Promise((resolve) => {
      // Use requestIdleCallback in browser, setImmediate in Node
      const schedule = typeof requestIdleCallback !== 'undefined' ?
        requestIdleCallback : setImmediate;

      schedule(() => {
        const path = this.findPath(startX, startY, goalX, goalY);
        resolve(path);
      });
    });
  }

  // Debug visualization
  visualize(path: Node[]): string {
    const display = this.grid.map(row =>
      row.map(cell => cell === 0 ? '.' : '#')
    );

    for (const node of path) {
      display[node.y][node.x] = '*';
    }

    if (path.length > 0) {
      display[path[0].y][path[0].x] = 'S';
      display[path[path.length - 1].y][path[path.length - 1].x] = 'G';
    }

    return display.map(row => row.join('')).join('\n');
  }
}

// Usage example
const pathfinder = new GamePathfinder({
  gridWidth: 50,
  gridHeight: 50,
  enableJPS: true,
  smoothPaths: true
});

// Set up obstacles
for (let i = 10; i < 40; i++) {
  pathfinder.setObstacle(25, i, true);
}

// Find path
const path = pathfinder.findPath(5, 25, 45, 25);
console.log(pathfinder.visualize(path));
console.log(`Path length: ${path.length} nodes`);
```

## Common Pitfalls and Best Practices

### Common Mistakes

**1. Using Wrong Heuristic:**
```typescript
// BAD: Manhattan distance for diagonal movement
const wrongHeuristic = manhattanDistance; // Overestimates!

// GOOD: Octile distance for 8-directional movement
const correctHeuristic = octileDistance;
```

**2. Not Handling Edge Cases:**
```typescript
// BAD: Assuming path always exists
const path = findPath(start, goal);
followPath(path[0]); // Crashes if no path!

// GOOD: Check for empty path
const path = findPath(start, goal);
if (path.length > 0) {
  followPath(path[0]);
} else {
  handleNoPath();
}
```

**3. Pathfinding Every Frame:**
```typescript
// BAD: Recalculate path every frame
function update() {
  const path = findPath(unit.position, target); // Expensive!
  unit.followPath(path);
}

// GOOD: Only recalculate when needed
function update() {
  if (unit.needsNewPath || distanceToTarget(unit) > threshold) {
    unit.path = findPath(unit.position, target);
    unit.needsNewPath = false;
  }
  unit.followPath();
}
```

### Best Practices

| Practice | Benefit |
|----------|---------|
| Use appropriate data structures (heap for open list) | O(log n) vs O(n) extraction |
| Cache frequently requested paths | Avoid redundant computation |
| Use hierarchical pathfinding for large maps | Reduces search space dramatically |
| Time-slice long pathfinding operations | Maintains frame rate |
| Pre-process static obstacles | One-time cost vs per-query |
| Use JPS for uniform grids | 10x+ speedup in open areas |
| Invalidate cache on map changes | Prevents stale paths |

### Performance Benchmarks

Typical performance on modern hardware (1000 pathfinding queries):

| Algorithm | 50x50 Grid | 200x200 Grid | 1000x1000 Grid |
|-----------|------------|--------------|----------------|
| BFS | 2ms | 35ms | 800ms |
| Dijkstra | 3ms | 45ms | 1000ms |
| A* | 1ms | 15ms | 200ms |
| A* + JPS | 0.3ms | 5ms | 50ms |
| HPA* | 0.1ms | 1ms | 10ms |

## Summary

This article covered the fundamentals of game pathfinding:

1. **Graph Search Basics**: Understanding nodes, edges, and search formalization
2. **BFS and Dijkstra**: Foundation algorithms for unweighted and weighted graphs
3. **A* Algorithm**: The gold standard combining actual cost with heuristic estimation
4. **Heuristic Functions**: Manhattan, Euclidean, and Octile distances
5. **Data Structures**: Efficient open/closed list implementations
6. **Path Smoothing**: Making paths look natural
7. **Jump Point Search**: Dramatic speedup for uniform grids
8. **Real-Time Optimization**: Hierarchical search, time-slicing, and caching

**Key Takeaways:**

- A* is optimal when using an admissible heuristic
- Choose heuristics based on movement rules (4-dir vs 8-dir)
- JPS provides significant speedup but only for uniform grids
- Always handle the "no path found" case
- Cache paths and time-slice computation for real-time performance

**Next Steps:**

- Implement flow fields for many-unit pathfinding
- Explore navigation meshes for 3D environments
- Study local avoidance (RVO, ORCA) for dynamic obstacles
- Consider machine learning approaches for complex terrain

## References

- Hart, P. E., Nilsson, N. J., Raphael, B. (1968). "A Formal Basis for the Heuristic Determination of Minimum Cost Paths"
- Harabor, D., Grastien, A. (2011). "Online Graph Pruning for Pathfinding on Grid Maps"
- Botea, A., Muller, M., Schaeffer, J. (2004). "Near Optimal Hierarchical Path-Finding"
- Sturtevant, N. (2012). "Benchmarks for Grid-Based Pathfinding"
- Patel, A. "Red Blob Games - Introduction to A*" (https://www.redblobgames.com/pathfinding/a-star/introduction.html)
