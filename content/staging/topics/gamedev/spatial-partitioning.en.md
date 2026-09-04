---
title: Spatial Partitioning Optimization
description: Master spatial partitioning techniques including quadtrees, octrees, BSP trees, and spatial hashing for game optimization
track: gamedev
section: performance
difficulty: intermediate
tags:
  - spatial partitioning
  - quadtree
  - octree
  - BSP
  - spatial hashing
  - collision detection
  - optimization
status: imported
origin: old/src/content/docs/gamedev/spatial-partitioning.en.md
divergence: 0.23
issues:
  - h1-in-body
legacy:
  category: GameDev
  subcategory: Optimization
  order: 57
  lastUpdated: 2026-01-22
---

Spatial partitioning divides game space into regions to accelerate queries like collision detection, visibility culling, and nearest neighbor searches. Choosing the right structure can dramatically improve performance.

## Fundamentals

### Why Spatial Partitioning?

Without spatial partitioning, checking all pairs of N objects requires O(N^2) comparisons. Spatial partitioning reduces this to approximately O(N log N) or better by only checking objects in nearby regions.

```typescript
// Naive collision detection: O(N^2)
function naiveCollisionCheck(objects: GameObject[]): CollisionPair[] {
  const pairs: CollisionPair[] = [];
  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      if (intersects(objects[i].bounds, objects[j].bounds)) {
        pairs.push({ a: objects[i], b: objects[j] });
      }
    }
  }
  return pairs; // Very slow for large N!
}

// With spatial partitioning: ~O(N log N)
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

### Common Interface

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

function aabbContains(outer: AABB, inner: AABB): boolean {
  return inner.minX >= outer.minX && inner.maxX <= outer.maxX &&
         inner.minY >= outer.minY && inner.maxY <= outer.maxY;
}
```

## Quadtree

Quadtrees recursively subdivide 2D space into four quadrants.

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
    // Check if item fits in this node
    if (!aabbIntersects(this.bounds, bounds)) {
      return false;
    }

    // If we have children, try to insert into them
    if (this.children) {
      return this.insertIntoChildren(item, bounds);
    }

    // Add to this node
    this.items.push({ item, bounds });

    // Split if needed
    if (this.items.length > this.maxItems && this.depth < this.maxDepth) {
      this.split();
    }

    return true;
  }

  private split(): void {
    const midX = (this.bounds.minX + this.bounds.maxX) / 2;
    const midY = (this.bounds.minY + this.bounds.maxY) / 2;

    this.children = [
      // Top-left
      new QuadtreeNode(
        { minX: this.bounds.minX, minY: this.bounds.minY, maxX: midX, maxY: midY },
        this.maxItems, this.maxDepth, this.depth + 1
      ),
      // Top-right
      new QuadtreeNode(
        { minX: midX, minY: this.bounds.minY, maxX: this.bounds.maxX, maxY: midY },
        this.maxItems, this.maxDepth, this.depth + 1
      ),
      // Bottom-left
      new QuadtreeNode(
        { minX: this.bounds.minX, minY: midY, maxX: midX, maxY: this.bounds.maxY },
        this.maxItems, this.maxDepth, this.depth + 1
      ),
      // Bottom-right
      new QuadtreeNode(
        { minX: midX, minY: midY, maxX: this.bounds.maxX, maxY: this.bounds.maxY },
        this.maxItems, this.maxDepth, this.depth + 1
      )
    ];

    // Redistribute items
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

    // If item spans multiple children, keep in parent
    if (!inserted) {
      this.items.push({ item, bounds });
    }

    return inserted;
  }

  query(bounds: AABB, results: T[] = []): T[] {
    if (!aabbIntersects(this.bounds, bounds)) {
      return results;
    }

    // Check items in this node
    for (const { item, bounds: itemBounds } of this.items) {
      if (aabbIntersects(bounds, itemBounds)) {
        results.push(item);
      }
    }

    // Check children
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
    // Check this node's items
    const index = this.items.findIndex(i => i.item === item);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }

    // Check children
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

class Quadtree<T> implements SpatialIndex<T> {
  private root: QuadtreeNode<T>;
  private itemBounds: Map<T, AABB> = new Map();

  constructor(bounds: AABB, maxItems: number = 8, maxDepth: number = 8) {
    this.root = new QuadtreeNode(bounds, maxItems, maxDepth);
  }

  insert(item: T, bounds: AABB): void {
    this.itemBounds.set(item, bounds);
    this.root.insert(item, bounds);
  }

  remove(item: T): void {
    this.root.remove(item);
    this.itemBounds.delete(item);
  }

  update(item: T, newBounds: AABB): void {
    this.remove(item);
    this.insert(item, newBounds);
  }

  query(bounds: AABB): T[] {
    return this.root.query(bounds);
  }

  queryPoint(x: number, y: number): T[] {
    return this.root.queryPoint(x, y);
  }

  clear(): void {
    this.root.clear();
    this.itemBounds.clear();
  }
}
```

## Octree

Octrees extend quadtrees to 3D space with eight children per node.

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

    // Create 8 children for each octant
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

    // Redistribute items
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

    // If spans multiple children, keep reference in parent too
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

  queryFrustum(frustum: Frustum, results: Set<T> = new Set()): T[] {
    // Check if node bounds intersect frustum
    if (!frustum.intersectsAABB(this.bounds)) {
      return Array.from(results);
    }

    for (const { item, bounds } of this.items) {
      if (frustum.intersectsAABB(bounds)) {
        results.add(item);
      }
    }

    if (this.children) {
      for (const child of this.children) {
        child.queryFrustum(frustum, results);
      }
    }

    return Array.from(results);
  }
}

interface Frustum {
  intersectsAABB(bounds: AABB3D): boolean;
}
```

## Spatial Hashing

Spatial hashing divides space into a uniform grid and uses hash functions to map objects to cells. Excellent for uniformly distributed objects.

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

      // Only update if cells changed
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

  // Get all items in a specific cell (useful for debugging)
  getCell(cellX: number, cellY: number): T[] {
    const key = `${cellX},${cellY}`;
    const cell = this.cells.get(key);
    return cell ? Array.from(cell) : [];
  }
}
```

## BSP Tree

Binary Space Partitioning recursively divides space using hyperplanes. Excellent for static geometry.

```typescript
interface Polygon {
  vertices: Vector3[];
  normal: Vector3;
  plane: Plane;
}

interface Plane {
  normal: Vector3;
  distance: number;
}

enum PolygonClassification {
  Front,
  Back,
  Coplanar,
  Spanning
}

class BSPNode {
  plane: Plane;
  front: BSPNode | null = null;
  back: BSPNode | null = null;
  polygons: Polygon[] = [];

  constructor(polygons: Polygon[]) {
    if (polygons.length === 0) {
      this.plane = { normal: new Vector3(1, 0, 0), distance: 0 };
      return;
    }

    // Choose splitting plane (use first polygon's plane)
    this.plane = this.chooseSplittingPlane(polygons);

    const frontPolygons: Polygon[] = [];
    const backPolygons: Polygon[] = [];

    for (const polygon of polygons) {
      const classification = this.classifyPolygon(polygon);

      switch (classification) {
        case PolygonClassification.Coplanar:
          this.polygons.push(polygon);
          break;
        case PolygonClassification.Front:
          frontPolygons.push(polygon);
          break;
        case PolygonClassification.Back:
          backPolygons.push(polygon);
          break;
        case PolygonClassification.Spanning:
          const { front, back } = this.splitPolygon(polygon);
          if (front) frontPolygons.push(front);
          if (back) backPolygons.push(back);
          break;
      }
    }

    if (frontPolygons.length > 0) {
      this.front = new BSPNode(frontPolygons);
    }
    if (backPolygons.length > 0) {
      this.back = new BSPNode(backPolygons);
    }
  }

  private chooseSplittingPlane(polygons: Polygon[]): Plane {
    // Simple heuristic: choose plane that minimizes splits
    let bestPlane = polygons[0].plane;
    let bestScore = Infinity;

    for (const polygon of polygons.slice(0, Math.min(10, polygons.length))) {
      let splits = 0;
      let balance = 0;

      for (const other of polygons) {
        const classification = this.classifyPolygonAgainstPlane(other, polygon.plane);
        if (classification === PolygonClassification.Spanning) splits++;
        else if (classification === PolygonClassification.Front) balance++;
        else if (classification === PolygonClassification.Back) balance--;
      }

      const score = splits * 3 + Math.abs(balance);
      if (score < bestScore) {
        bestScore = score;
        bestPlane = polygon.plane;
      }
    }

    return bestPlane;
  }

  private classifyPolygon(polygon: Polygon): PolygonClassification {
    return this.classifyPolygonAgainstPlane(polygon, this.plane);
  }

  private classifyPolygonAgainstPlane(polygon: Polygon, plane: Plane): PolygonClassification {
    let front = 0;
    let back = 0;
    const epsilon = 0.0001;

    for (const vertex of polygon.vertices) {
      const distance = plane.normal.dot(vertex) - plane.distance;
      if (distance > epsilon) front++;
      else if (distance < -epsilon) back++;
    }

    if (front > 0 && back > 0) return PolygonClassification.Spanning;
    if (front > 0) return PolygonClassification.Front;
    if (back > 0) return PolygonClassification.Back;
    return PolygonClassification.Coplanar;
  }

  private splitPolygon(polygon: Polygon): { front: Polygon | null; back: Polygon | null } {
    const frontVertices: Vector3[] = [];
    const backVertices: Vector3[] = [];
    const epsilon = 0.0001;

    for (let i = 0; i < polygon.vertices.length; i++) {
      const current = polygon.vertices[i];
      const next = polygon.vertices[(i + 1) % polygon.vertices.length];

      const currentDist = this.plane.normal.dot(current) - this.plane.distance;
      const nextDist = this.plane.normal.dot(next) - this.plane.distance;

      if (currentDist >= -epsilon) frontVertices.push(current);
      if (currentDist <= epsilon) backVertices.push(current);

      // Check if edge crosses plane
      if ((currentDist > epsilon && nextDist < -epsilon) ||
          (currentDist < -epsilon && nextDist > epsilon)) {
        const t = currentDist / (currentDist - nextDist);
        const intersection = current.lerp(next, t);
        frontVertices.push(intersection);
        backVertices.push(intersection.clone());
      }
    }

    return {
      front: frontVertices.length >= 3 ? this.createPolygon(frontVertices, polygon.normal) : null,
      back: backVertices.length >= 3 ? this.createPolygon(backVertices, polygon.normal) : null
    };
  }

  private createPolygon(vertices: Vector3[], normal: Vector3): Polygon {
    return {
      vertices,
      normal,
      plane: {
        normal,
        distance: normal.dot(vertices[0])
      }
    };
  }

  // Query for visibility ordering (back-to-front for rendering)
  traverse(cameraPosition: Vector3, callback: (polygon: Polygon) => void): void {
    const distance = this.plane.normal.dot(cameraPosition) - this.plane.distance;

    if (distance > 0) {
      // Camera in front of plane
      this.back?.traverse(cameraPosition, callback);
      for (const polygon of this.polygons) {
        callback(polygon);
      }
      this.front?.traverse(cameraPosition, callback);
    } else {
      // Camera behind plane
      this.front?.traverse(cameraPosition, callback);
      for (const polygon of this.polygons) {
        callback(polygon);
      }
      this.back?.traverse(cameraPosition, callback);
    }
  }
}
```

## Bounding Volume Hierarchy (BVH)

BVH organizes objects by their bounding volumes, excellent for ray tracing and dynamic scenes.

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
    // Calculate bounds for all items
    const bounds = this.calculateBounds(items);

    // Leaf node if few items
    if (items.length <= 4) {
      return { bounds, left: null, right: null, items };
    }

    // Find best split axis
    const axis = this.getLongestAxis(bounds);

    // Sort items along axis
    const sorted = [...items].sort((a, b) => {
      const boundsA = this.getItemBounds(a);
      const boundsB = this.getItemBounds(b);
      const centerA = this.getAxisCenter(boundsA, axis);
      const centerB = this.getAxisCenter(boundsB, axis);
      return centerA - centerB;
    });

    // Split at median
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

    // Check leaf items
    for (const item of node.items) {
      if (aabbIntersects(bounds, this.getItemBounds(item))) {
        results.push(item);
      }
    }

    // Check children
    if (node.left) {
      results.push(...this.queryNode(node.left, bounds));
    }
    if (node.right) {
      results.push(...this.queryNode(node.right, bounds));
    }

    return results;
  }

  raycast(origin: Vector2, direction: Vector2, maxDistance: number): T | null {
    if (!this.root) return null;
    return this.raycastNode(this.root, origin, direction, maxDistance);
  }

  private raycastNode(
    node: BVHNode<T>,
    origin: Vector2,
    direction: Vector2,
    maxDistance: number
  ): T | null {
    // Check if ray intersects node bounds
    if (!this.rayIntersectsAABB(origin, direction, node.bounds, maxDistance)) {
      return null;
    }

    let closest: T | null = null;
    let closestDist = maxDistance;

    // Check leaf items
    for (const item of node.items) {
      const itemBounds = this.getItemBounds(item);
      const dist = this.rayAABBDistance(origin, direction, itemBounds);
      if (dist !== null && dist < closestDist) {
        closest = item;
        closestDist = dist;
      }
    }

    // Check children (closer first)
    if (node.left && node.right) {
      const leftDist = this.rayAABBDistance(origin, direction, node.left.bounds);
      const rightDist = this.rayAABBDistance(origin, direction, node.right.bounds);

      const [first, second] = leftDist !== null && (rightDist === null || leftDist < rightDist)
        ? [node.left, node.right]
        : [node.right, node.left];

      const firstResult = this.raycastNode(first, origin, direction, closestDist);
      if (firstResult) {
        closest = firstResult;
        closestDist = this.rayAABBDistance(origin, direction, this.getItemBounds(firstResult))!;
      }

      const secondResult = this.raycastNode(second, origin, direction, closestDist);
      if (secondResult) {
        closest = secondResult;
      }
    } else if (node.left) {
      const result = this.raycastNode(node.left, origin, direction, closestDist);
      if (result) closest = result;
    } else if (node.right) {
      const result = this.raycastNode(node.right, origin, direction, closestDist);
      if (result) closest = result;
    }

    return closest;
  }

  private rayIntersectsAABB(
    origin: Vector2,
    direction: Vector2,
    bounds: AABB,
    maxDist: number
  ): boolean {
    return this.rayAABBDistance(origin, direction, bounds) !== null;
  }

  private rayAABBDistance(
    origin: Vector2,
    direction: Vector2,
    bounds: AABB
  ): number | null {
    let tmin = 0;
    let tmax = Infinity;

    // X axis
    if (Math.abs(direction.x) < 0.0001) {
      if (origin.x < bounds.minX || origin.x > bounds.maxX) return null;
    } else {
      const t1 = (bounds.minX - origin.x) / direction.x;
      const t2 = (bounds.maxX - origin.x) / direction.x;
      tmin = Math.max(tmin, Math.min(t1, t2));
      tmax = Math.min(tmax, Math.max(t1, t2));
    }

    // Y axis
    if (Math.abs(direction.y) < 0.0001) {
      if (origin.y < bounds.minY || origin.y > bounds.maxY) return null;
    } else {
      const t1 = (bounds.minY - origin.y) / direction.y;
      const t2 = (bounds.maxY - origin.y) / direction.y;
      tmin = Math.max(tmin, Math.min(t1, t2));
      tmax = Math.min(tmax, Math.max(t1, t2));
    }

    if (tmax >= tmin && tmax >= 0) {
      return tmin >= 0 ? tmin : tmax;
    }

    return null;
  }
}

class Vector2 {
  constructor(public x: number, public y: number) {}
}
```

## Choosing the Right Structure

```typescript
class SpatialPartitioningFactory {
  static create<T>(
    config: {
      bounds: AABB;
      expectedObjectCount: number;
      objectSizeVariance: 'uniform' | 'varied';
      updateFrequency: 'static' | 'dynamic';
      queryType: 'aabb' | 'ray' | 'both';
    }
  ): SpatialIndex<T> {
    const { bounds, expectedObjectCount, objectSizeVariance, updateFrequency, queryType } = config;

    // Static scenes with varied sizes -> BVH
    if (updateFrequency === 'static' && queryType === 'ray') {
      // BVH is best for ray tracing static geometry
      console.log('Recommendation: BVH');
    }

    // Dynamic scenes with uniform sizes -> Spatial Hash
    if (updateFrequency === 'dynamic' && objectSizeVariance === 'uniform') {
      const avgSize = (bounds.maxX - bounds.minX) / Math.sqrt(expectedObjectCount);
      return new SpatialHash<T>(avgSize * 2);
    }

    // General purpose -> Quadtree
    const maxDepth = Math.ceil(Math.log2(expectedObjectCount / 8));
    return new Quadtree<T>(bounds, 8, Math.min(maxDepth, 10));
  }
}
```

## Performance Comparison

| Structure | Insert | Remove | Query (AABB) | Query (Point) | Memory | Best For |
|-----------|--------|--------|--------------|---------------|--------|----------|
| Quadtree | O(log n) | O(log n) | O(log n + k) | O(log n) | Medium | General 2D |
| Octree | O(log n) | O(log n) | O(log n + k) | O(log n) | High | 3D worlds |
| Spatial Hash | O(1) | O(1) | O(k) | O(1) | Low | Uniform objects |
| BSP | O(n log n) | N/A | O(log n) | O(log n) | High | Static geometry |
| BVH | O(n log n) | O(n log n) | O(log n + k) | O(log n) | Medium | Ray tracing |

## Best Practices

1. **Choose based on use case**: Static scenes benefit from BVH/BSP; dynamic scenes from spatial hash or quadtree
2. **Tune parameters**: Cell size for spatial hash, max depth for trees
3. **Batch updates**: Update spatial structures after physics step, not per-object
4. **Use object pools**: Reduce allocation overhead in frequently updated structures
5. **Consider hybrid approaches**: Use different structures for different object types

## Summary

Spatial partitioning is essential for performant games:

- **Quadtree/Octree**: Versatile, good for varied object sizes
- **Spatial Hash**: Fastest for uniform objects with frequent updates
- **BSP**: Best for static level geometry and visibility
- **BVH**: Optimal for ray tracing and static object queries

Choose based on your specific requirements for query types, update frequency, and object distribution.

## Further Reading

- "Real-Time Collision Detection" by Christer Ericson
- "Game Physics Engine Development" by Ian Millington
- "Physically Based Rendering" - BVH construction
- Game engine source code (Unreal, Unity) for production implementations
