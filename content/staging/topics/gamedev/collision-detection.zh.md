---
title: 碰撞检测算法详解
description: 掌握游戏中的碰撞检测：AABB、分离轴定理和GJK算法
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - 碰撞检测
  - 物理
  - AABB
  - GJK
status: imported
origin: old/src/content/docs/gamedev/collision-detection.zh.md
divergence: 0.357
issues:
  - divergent
legacy:
  category: GameDev
  subcategory: Physics
  order: 14
  lastUpdated: 2026-01-07
---

碰撞检测是游戏开发和物理模拟中最基础也是最重要的技术之一。无论是简单的 2D 平台游戏还是复杂的 3D 射击游戏，都需要精确高效的碰撞检测来实现物体之间的交互。本文将从基础概念入手，逐步深入到高级算法，帮助你全面掌握碰撞检测技术。

## 碰撞检测基础

### 什么是碰撞检测

碰撞检测（Collision Detection）是判断两个或多个几何对象是否相交或接触的过程。在游戏开发中，碰撞检测主要解决以下问题：

1. **是否碰撞**：两个物体是否发生了接触
2. **碰撞点**：物体在哪个位置发生了碰撞
3. **碰撞法向量**：碰撞发生的方向
4. **穿透深度**：物体相互穿透了多深

### 碰撞检测的两个阶段

为了优化性能，碰撞检测通常分为两个阶段：

**宽阶段（Broad Phase）**：快速排除明显不会碰撞的物体对，使用简单的包围盒或空间分区数据结构。

**窄阶段（Narrow Phase）**：对宽阶段筛选出的可能碰撞的物体对进行精确的碰撞检测。

```
所有物体对 ──► 宽阶段过滤 ──► 可能碰撞的物体对 ──► 窄阶段精确检测 ──► 实际碰撞
   O(n^2)        O(n log n)         少量物体对           精确算法          碰撞结果
```

### 基本的点与几何体检测

在学习复杂算法之前，先掌握最基础的碰撞检测：

```typescript
// 点与矩形的碰撞检测
function pointInRect(
  px: number, py: number,
  rx: number, ry: number, rw: number, rh: number
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

// 点与圆的碰撞检测
function pointInCircle(
  px: number, py: number,
  cx: number, cy: number, radius: number
): boolean {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

// 点与三角形的碰撞检测（使用重心坐标）
function pointInTriangle(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number
): boolean {
  const area = 0.5 * (-y2 * x3 + y1 * (-x2 + x3) + x1 * (y2 - y3) + x2 * y3);
  const s = 1 / (2 * area) * (y1 * x3 - x1 * y3 + (y3 - y1) * px + (x1 - x3) * py);
  const t = 1 / (2 * area) * (x1 * y2 - y1 * x2 + (y1 - y2) * px + (x2 - x1) * py);
  return s >= 0 && t >= 0 && (1 - s - t) >= 0;
}
```

## AABB 包围盒

### AABB 概述

AABB（Axis-Aligned Bounding Box，轴对齐包围盒）是最简单也是最常用的包围盒类型。它是一个与坐标轴对齐的矩形（2D）或长方体（3D），由最小点和最大点定义。

**优点**：
- 计算简单，检测速度快
- 内存占用小
- 容易更新

**缺点**：
- 对于旋转物体，包围盒可能过大
- 对于细长或斜向的物体，拟合效果差

### AABB 的数据结构

```typescript
// 2D AABB
interface AABB2D {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// 3D AABB
interface AABB3D {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

// 使用中心点和半尺寸表示
interface AABBCenterHalf {
  centerX: number;
  centerY: number;
  halfWidth: number;
  halfHeight: number;
}
```

### AABB vs AABB 碰撞检测

```typescript
// 2D AABB 碰撞检测
function aabbVsAabb2D(a: AABB2D, b: AABB2D): boolean {
  // 如果在任意轴上不重叠，则不碰撞
  if (a.maxX < b.minX || a.minX > b.maxX) return false;
  if (a.maxY < b.minY || a.minY > b.maxY) return false;
  return true;
}

// 3D AABB 碰撞检测
function aabbVsAabb3D(a: AABB3D, b: AABB3D): boolean {
  if (a.maxX < b.minX || a.minX > b.maxX) return false;
  if (a.maxY < b.minY || a.minY > b.maxY) return false;
  if (a.maxZ < b.minZ || a.minZ > b.maxZ) return false;
  return true;
}

// 使用中心点和半尺寸的版本（有时更高效）
function aabbVsAabbCenterHalf(a: AABBCenterHalf, b: AABBCenterHalf): boolean {
  if (Math.abs(a.centerX - b.centerX) > a.halfWidth + b.halfWidth) return false;
  if (Math.abs(a.centerY - b.centerY) > a.halfHeight + b.halfHeight) return false;
  return true;
}
```

### 计算碰撞信息

仅仅知道是否碰撞往往不够，我们还需要知道穿透深度和碰撞方向：

```typescript
interface CollisionInfo {
  colliding: boolean;
  normal: { x: number; y: number };
  penetration: number;
}

function aabbCollisionInfo(a: AABB2D, b: AABB2D): CollisionInfo {
  // 计算两个 AABB 中心的距离
  const aCenterX = (a.minX + a.maxX) / 2;
  const aCenterY = (a.minY + a.maxY) / 2;
  const bCenterX = (b.minX + b.maxX) / 2;
  const bCenterY = (b.minY + b.maxY) / 2;

  const dx = bCenterX - aCenterX;
  const dy = bCenterY - aCenterY;

  // 计算半宽和半高
  const aHalfW = (a.maxX - a.minX) / 2;
  const aHalfH = (a.maxY - a.minY) / 2;
  const bHalfW = (b.maxX - b.minX) / 2;
  const bHalfH = (b.maxY - b.minY) / 2;

  // 计算重叠量
  const overlapX = aHalfW + bHalfW - Math.abs(dx);
  const overlapY = aHalfH + bHalfH - Math.abs(dy);

  if (overlapX <= 0 || overlapY <= 0) {
    return { colliding: false, normal: { x: 0, y: 0 }, penetration: 0 };
  }

  // 选择穿透较小的轴作为分离方向
  if (overlapX < overlapY) {
    return {
      colliding: true,
      normal: { x: dx > 0 ? 1 : -1, y: 0 },
      penetration: overlapX
    };
  } else {
    return {
      colliding: true,
      normal: { x: 0, y: dy > 0 ? 1 : -1 },
      penetration: overlapY
    };
  }
}
```

### 从点集创建 AABB

```typescript
interface Vector2 {
  x: number;
  y: number;
}

function createAABBFromPoints(points: Vector2[]): AABB2D {
  if (points.length === 0) {
    throw new Error("Points array cannot be empty");
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return { minX, minY, maxX, maxY };
}

// 合并两个 AABB
function mergeAABB(a: AABB2D, b: AABB2D): AABB2D {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY)
  };
}

// 扩展 AABB
function expandAABB(aabb: AABB2D, margin: number): AABB2D {
  return {
    minX: aabb.minX - margin,
    minY: aabb.minY - margin,
    maxX: aabb.maxX + margin,
    maxY: aabb.maxY + margin
  };
}
```

## 圆/球体碰撞

### 圆与圆的碰撞

圆形碰撞检测是最简单的精确碰撞检测，只需比较圆心距离与半径之和：

```typescript
interface Circle {
  x: number;
  y: number;
  radius: number;
}

interface CircleCollisionInfo {
  colliding: boolean;
  normal: { x: number; y: number };
  penetration: number;
  contactPoint: { x: number; y: number };
}

function circleVsCircle(a: Circle, b: Circle): CircleCollisionInfo {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distSq = dx * dx + dy * dy;
  const radiusSum = a.radius + b.radius;

  if (distSq > radiusSum * radiusSum) {
    return {
      colliding: false,
      normal: { x: 0, y: 0 },
      penetration: 0,
      contactPoint: { x: 0, y: 0 }
    };
  }

  const dist = Math.sqrt(distSq);

  // 处理圆心重合的情况
  if (dist === 0) {
    return {
      colliding: true,
      normal: { x: 1, y: 0 },
      penetration: radiusSum,
      contactPoint: { x: a.x, y: a.y }
    };
  }

  const nx = dx / dist;
  const ny = dy / dist;

  return {
    colliding: true,
    normal: { x: nx, y: ny },
    penetration: radiusSum - dist,
    contactPoint: {
      x: a.x + nx * a.radius,
      y: a.y + ny * a.radius
    }
  };
}
```

### 球体与球体的碰撞（3D）

```typescript
interface Sphere {
  x: number;
  y: number;
  z: number;
  radius: number;
}

function sphereVsSphere(a: Sphere, b: Sphere): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  const distSq = dx * dx + dy * dy + dz * dz;
  const radiusSum = a.radius + b.radius;
  return distSq <= radiusSum * radiusSum;
}
```

### 圆与 AABB 的碰撞

这是一个常见的混合碰撞检测场景：

```typescript
function circleVsAABB(circle: Circle, aabb: AABB2D): CircleCollisionInfo {
  // 找到 AABB 上距离圆心最近的点
  const closestX = Math.max(aabb.minX, Math.min(circle.x, aabb.maxX));
  const closestY = Math.max(aabb.minY, Math.min(circle.y, aabb.maxY));

  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq > circle.radius * circle.radius) {
    return {
      colliding: false,
      normal: { x: 0, y: 0 },
      penetration: 0,
      contactPoint: { x: 0, y: 0 }
    };
  }

  const dist = Math.sqrt(distSq);

  // 圆心在 AABB 内部
  if (dist === 0) {
    // 找到最近的边
    const distToLeft = circle.x - aabb.minX;
    const distToRight = aabb.maxX - circle.x;
    const distToTop = circle.y - aabb.minY;
    const distToBottom = aabb.maxY - circle.y;

    const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    if (minDist === distToLeft) {
      return {
        colliding: true,
        normal: { x: -1, y: 0 },
        penetration: distToLeft + circle.radius,
        contactPoint: { x: aabb.minX, y: circle.y }
      };
    } else if (minDist === distToRight) {
      return {
        colliding: true,
        normal: { x: 1, y: 0 },
        penetration: distToRight + circle.radius,
        contactPoint: { x: aabb.maxX, y: circle.y }
      };
    } else if (minDist === distToTop) {
      return {
        colliding: true,
        normal: { x: 0, y: -1 },
        penetration: distToTop + circle.radius,
        contactPoint: { x: circle.x, y: aabb.minY }
      };
    } else {
      return {
        colliding: true,
        normal: { x: 0, y: 1 },
        penetration: distToBottom + circle.radius,
        contactPoint: { x: circle.x, y: aabb.maxY }
      };
    }
  }

  return {
    colliding: true,
    normal: { x: dx / dist, y: dy / dist },
    penetration: circle.radius - dist,
    contactPoint: { x: closestX, y: closestY }
  };
}
```

### 圆与线段的碰撞

```typescript
interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function circleVsLineSegment(circle: Circle, line: LineSegment): boolean {
  // 线段向量
  const dx = line.x2 - line.x1;
  const dy = line.y2 - line.y1;

  // 圆心到线段起点的向量
  const fx = line.x1 - circle.x;
  const fy = line.y1 - circle.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - circle.radius * circle.radius;

  let discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return false;
  }

  discriminant = Math.sqrt(discriminant);

  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);

  // 检查交点是否在线段上
  if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
    return true;
  }

  // 检查线段端点是否在圆内
  const dist1Sq = fx * fx + fy * fy;
  const dist2Sq = (line.x2 - circle.x) ** 2 + (line.y2 - circle.y) ** 2;

  return dist1Sq <= circle.radius * circle.radius ||
         dist2Sq <= circle.radius * circle.radius;
}
```

## OBB 碰撞

### OBB 概述

OBB（Oriented Bounding Box，有向包围盒）是可以任意旋转的包围盒，比 AABB 更紧密地包围物体，但计算更复杂。

```typescript
interface OBB2D {
  centerX: number;
  centerY: number;
  halfWidth: number;
  halfHeight: number;
  rotation: number; // 弧度
}

// 获取 OBB 的四个顶点
function getOBBVertices(obb: OBB2D): Vector2[] {
  const cos = Math.cos(obb.rotation);
  const sin = Math.sin(obb.rotation);

  const vertices: Vector2[] = [];
  const signs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];

  for (const [sx, sy] of signs) {
    const localX = sx * obb.halfWidth;
    const localY = sy * obb.halfHeight;
    vertices.push({
      x: obb.centerX + localX * cos - localY * sin,
      y: obb.centerY + localX * sin + localY * cos
    });
  }

  return vertices;
}

// 获取 OBB 的轴向量
function getOBBAxes(obb: OBB2D): Vector2[] {
  const cos = Math.cos(obb.rotation);
  const sin = Math.sin(obb.rotation);
  return [
    { x: cos, y: sin },
    { x: -sin, y: cos }
  ];
}
```

### OBB vs OBB 碰撞检测

OBB 之间的碰撞检测使用分离轴定理（SAT），我们需要在四个轴上进行投影测试：

```typescript
function projectOBBOnAxis(obb: OBB2D, axis: Vector2): { min: number; max: number } {
  const vertices = getOBBVertices(obb);
  let min = Infinity;
  let max = -Infinity;

  for (const vertex of vertices) {
    const projection = vertex.x * axis.x + vertex.y * axis.y;
    min = Math.min(min, projection);
    max = Math.max(max, projection);
  }

  return { min, max };
}

function obbVsObb(a: OBB2D, b: OBB2D): boolean {
  // 收集所有需要测试的轴
  const axesA = getOBBAxes(a);
  const axesB = getOBBAxes(b);
  const axes = [...axesA, ...axesB];

  for (const axis of axes) {
    const projA = projectOBBOnAxis(a, axis);
    const projB = projectOBBOnAxis(b, axis);

    // 检查投影是否重叠
    if (projA.max < projB.min || projB.max < projA.min) {
      return false; // 找到分离轴，不碰撞
    }
  }

  return true; // 所有轴都重叠，碰撞
}
```

## 分离轴定理（SAT）

### SAT 原理

分离轴定理是凸多边形碰撞检测的基础。其核心思想是：

**如果两个凸形状不相交，则必定存在一条轴，使得两个形状在该轴上的投影不重叠。**

这条轴称为"分离轴"。对于 2D 凸多边形，潜在的分离轴是每条边的法向量。

```
        投影A        投影B
    |-------|    |-------|
    ←───────────────────────→ 轴
                  ↑
             存在间隙，不碰撞

        投影A
    |-----------|
           |-----------|
           投影B
    ←───────────────────────→ 轴
              ↑
         投影重叠，可能碰撞
```

### SAT 实现

```typescript
interface Polygon {
  vertices: Vector2[];
}

// 向量操作辅助函数
function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

function subtract(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function perpendicular(v: Vector2): Vector2 {
  return { x: -v.y, y: v.x };
}

function normalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  return { x: v.x / len, y: v.y / len };
}

// 获取多边形的所有轴（边的法向量）
function getPolygonAxes(polygon: Polygon): Vector2[] {
  const axes: Vector2[] = [];
  const vertices = polygon.vertices;

  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    const edge = subtract(vertices[j], vertices[i]);
    const normal = normalize(perpendicular(edge));
    axes.push(normal);
  }

  return axes;
}

// 将多边形投影到轴上
function projectPolygon(polygon: Polygon, axis: Vector2): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;

  for (const vertex of polygon.vertices) {
    const projection = dot(vertex, axis);
    min = Math.min(min, projection);
    max = Math.max(max, projection);
  }

  return { min, max };
}

// 检查两个投影是否重叠
function projectionsOverlap(
  a: { min: number; max: number },
  b: { min: number; max: number }
): number {
  if (a.max < b.min || b.max < a.min) {
    return 0; // 不重叠
  }
  // 返回重叠量
  return Math.min(a.max - b.min, b.max - a.min);
}

// SAT 碰撞检测主函数
interface SATResult {
  colliding: boolean;
  normal: Vector2 | null;
  penetration: number;
}

function satCollision(polygonA: Polygon, polygonB: Polygon): SATResult {
  const axesA = getPolygonAxes(polygonA);
  const axesB = getPolygonAxes(polygonB);
  const axes = [...axesA, ...axesB];

  let minOverlap = Infinity;
  let minAxis: Vector2 | null = null;

  for (const axis of axes) {
    const projA = projectPolygon(polygonA, axis);
    const projB = projectPolygon(polygonB, axis);
    const overlap = projectionsOverlap(projA, projB);

    if (overlap === 0) {
      return { colliding: false, normal: null, penetration: 0 };
    }

    if (overlap < minOverlap) {
      minOverlap = overlap;
      minAxis = axis;
    }
  }

  // 确保法向量指向正确的方向（从 A 指向 B）
  if (minAxis) {
    const centerA = getPolygonCenter(polygonA);
    const centerB = getPolygonCenter(polygonB);
    const direction = subtract(centerB, centerA);

    if (dot(direction, minAxis) < 0) {
      minAxis = { x: -minAxis.x, y: -minAxis.y };
    }
  }

  return {
    colliding: true,
    normal: minAxis,
    penetration: minOverlap
  };
}

function getPolygonCenter(polygon: Polygon): Vector2 {
  let x = 0, y = 0;
  for (const v of polygon.vertices) {
    x += v.x;
    y += v.y;
  }
  return { x: x / polygon.vertices.length, y: y / polygon.vertices.length };
}
```

### 优化的 SAT 实现

对于性能关键的场景，可以进行以下优化：

```typescript
// 预计算多边形的轴和投影范围
interface OptimizedPolygon {
  vertices: Vector2[];
  axes: Vector2[];
  center: Vector2;
}

function createOptimizedPolygon(vertices: Vector2[]): OptimizedPolygon {
  const axes = getPolygonAxes({ vertices });
  const center = getPolygonCenter({ vertices });
  return { vertices, axes, center };
}

// 早期退出优化：先用 AABB 进行粗略检测
function satCollisionOptimized(
  polygonA: OptimizedPolygon,
  polygonB: OptimizedPolygon
): SATResult {
  // 快速 AABB 检测
  const aabbA = createAABBFromPoints(polygonA.vertices);
  const aabbB = createAABBFromPoints(polygonB.vertices);

  if (!aabbVsAabb2D(aabbA, aabbB)) {
    return { colliding: false, normal: null, penetration: 0 };
  }

  // 完整的 SAT 检测
  const axes = [...polygonA.axes, ...polygonB.axes];
  let minOverlap = Infinity;
  let minAxis: Vector2 | null = null;

  for (const axis of axes) {
    const projA = projectPolygon({ vertices: polygonA.vertices }, axis);
    const projB = projectPolygon({ vertices: polygonB.vertices }, axis);
    const overlap = projectionsOverlap(projA, projB);

    if (overlap === 0) {
      return { colliding: false, normal: null, penetration: 0 };
    }

    if (overlap < minOverlap) {
      minOverlap = overlap;
      minAxis = axis;
    }
  }

  if (minAxis) {
    const direction = subtract(polygonB.center, polygonA.center);
    if (dot(direction, minAxis) < 0) {
      minAxis = { x: -minAxis.x, y: -minAxis.y };
    }
  }

  return { colliding: true, normal: minAxis, penetration: minOverlap };
}
```

### SAT 的局限性

SAT 仅适用于凸多边形。对于凹多边形，需要先将其分解为多个凸多边形：

```typescript
// 检测多边形是否为凸多边形
function isConvex(polygon: Polygon): boolean {
  const vertices = polygon.vertices;
  const n = vertices.length;
  let sign = 0;

  for (let i = 0; i < n; i++) {
    const v0 = vertices[i];
    const v1 = vertices[(i + 1) % n];
    const v2 = vertices[(i + 2) % n];

    const cross = (v1.x - v0.x) * (v2.y - v1.y) - (v1.y - v0.y) * (v2.x - v1.x);

    if (cross !== 0) {
      if (sign === 0) {
        sign = cross > 0 ? 1 : -1;
      } else if ((cross > 0 ? 1 : -1) !== sign) {
        return false;
      }
    }
  }

  return true;
}
```

## GJK 算法

### GJK 概述

GJK（Gilbert-Johnson-Keerthi）算法是一种更通用的碰撞检测算法，可以处理任意凸形状。它的核心思想是计算两个形状的闵可夫斯基差（Minkowski Difference），并检测原点是否在这个差集内。

**闵可夫斯基差**：如果 A 和 B 是两个形状，它们的闵可夫斯基差定义为：
`A - B = { a - b | a in A, b in B }`

**关键性质**：两个形状碰撞当且仅当它们的闵可夫斯基差包含原点。

### Support 函数

GJK 的关键是 Support 函数，它返回形状在给定方向上的最远点：

```typescript
interface Shape {
  support(direction: Vector2): Vector2;
}

// 圆形的 Support 函数
class CircleShape implements Shape {
  constructor(
    public center: Vector2,
    public radius: number
  ) {}

  support(direction: Vector2): Vector2 {
    const len = Math.sqrt(direction.x ** 2 + direction.y ** 2);
    return {
      x: this.center.x + (direction.x / len) * this.radius,
      y: this.center.y + (direction.y / len) * this.radius
    };
  }
}

// 多边形的 Support 函数
class PolygonShape implements Shape {
  constructor(public vertices: Vector2[]) {}

  support(direction: Vector2): Vector2 {
    let maxDot = -Infinity;
    let maxVertex = this.vertices[0];

    for (const vertex of this.vertices) {
      const d = dot(vertex, direction);
      if (d > maxDot) {
        maxDot = d;
        maxVertex = vertex;
      }
    }

    return maxVertex;
  }
}

// 闵可夫斯基差的 Support 函数
function minkowskiSupport(
  shapeA: Shape,
  shapeB: Shape,
  direction: Vector2
): Vector2 {
  const pointA = shapeA.support(direction);
  const pointB = shapeB.support({ x: -direction.x, y: -direction.y });
  return subtract(pointA, pointB);
}
```

### GJK 核心算法

```typescript
interface Simplex {
  points: Vector2[];
}

function tripleProduct(a: Vector2, b: Vector2, c: Vector2): Vector2 {
  // (A x B) x C = B(A . C) - A(B . C)
  const ac = dot(a, c);
  const bc = dot(b, c);
  return {
    x: b.x * ac - a.x * bc,
    y: b.y * ac - a.y * bc
  };
}

function gjkCollision(shapeA: Shape, shapeB: Shape): boolean {
  // 初始方向（可以是任意方向）
  let direction: Vector2 = { x: 1, y: 0 };

  // 获取第一个支持点
  const simplex: Simplex = {
    points: [minkowskiSupport(shapeA, shapeB, direction)]
  };

  // 新的方向指向原点
  direction = { x: -simplex.points[0].x, y: -simplex.points[0].y };

  const maxIterations = 100;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    // 获取新的支持点
    const newPoint = minkowskiSupport(shapeA, shapeB, direction);

    // 如果新点没有越过原点，则不碰撞
    if (dot(newPoint, direction) < 0) {
      return false;
    }

    // 将新点添加到单纯形
    simplex.points.push(newPoint);

    // 处理单纯形并更新方向
    if (handleSimplex(simplex, direction)) {
      return true; // 原点在单纯形内，碰撞
    }
  }

  return false;
}

function handleSimplex(
  simplex: Simplex,
  direction: { x: number; y: number }
): boolean {
  if (simplex.points.length === 2) {
    return handleLine(simplex, direction);
  }
  return handleTriangle(simplex, direction);
}

function handleLine(
  simplex: Simplex,
  direction: { x: number; y: number }
): boolean {
  const b = simplex.points[0];
  const a = simplex.points[1];

  const ab = subtract(b, a);
  const ao = { x: -a.x, y: -a.y };

  // 计算垂直于 AB 并指向原点的方向
  const abPerp = tripleProduct(ab, ao, ab);

  direction.x = abPerp.x;
  direction.y = abPerp.y;

  return false;
}

function handleTriangle(
  simplex: Simplex,
  direction: { x: number; y: number }
): boolean {
  const c = simplex.points[0];
  const b = simplex.points[1];
  const a = simplex.points[2];

  const ab = subtract(b, a);
  const ac = subtract(c, a);
  const ao = { x: -a.x, y: -a.y };

  // 计算边的法向量
  const abPerp = tripleProduct(ac, ab, ab);
  const acPerp = tripleProduct(ab, ac, ac);

  // 检查原点在哪个区域
  if (dot(abPerp, ao) > 0) {
    // 原点在 AB 边外侧
    simplex.points = [b, a];
    direction.x = abPerp.x;
    direction.y = abPerp.y;
    return false;
  }

  if (dot(acPerp, ao) > 0) {
    // 原点在 AC 边外侧
    simplex.points = [c, a];
    direction.x = acPerp.x;
    direction.y = acPerp.y;
    return false;
  }

  // 原点在三角形内部
  return true;
}
```

### EPA 算法（扩展 GJK）

GJK 只能告诉我们是否碰撞，EPA（Expanding Polytope Algorithm）可以计算碰撞的穿透深度和法向量：

```typescript
interface EPAResult {
  normal: Vector2;
  penetration: number;
}

function epa(
  shapeA: Shape,
  shapeB: Shape,
  simplex: Vector2[]
): EPAResult {
  const tolerance = 0.0001;
  const maxIterations = 100;

  // 确保单纯形是顺时针方向
  const winding = getWindingOrder(simplex);
  if (winding < 0) {
    simplex.reverse();
  }

  let polytope = [...simplex];

  for (let i = 0; i < maxIterations; i++) {
    // 找到最近的边
    const { edgeIndex, edgeNormal, edgeDistance } = findClosestEdge(polytope);

    // 在这个方向上获取新的支持点
    const support = minkowskiSupport(shapeA, shapeB, edgeNormal);
    const supportDistance = dot(support, edgeNormal);

    // 如果新点距离边很近，我们找到了答案
    if (supportDistance - edgeDistance < tolerance) {
      return {
        normal: edgeNormal,
        penetration: edgeDistance
      };
    }

    // 扩展多边形
    polytope.splice(edgeIndex + 1, 0, support);
  }

  // 超过迭代次数，返回当前最佳结果
  const { edgeNormal, edgeDistance } = findClosestEdge(polytope);
  return {
    normal: edgeNormal,
    penetration: edgeDistance
  };
}

function getWindingOrder(points: Vector2[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    sum += (next.x - current.x) * (next.y + current.y);
  }
  return sum;
}

function findClosestEdge(polytope: Vector2[]): {
  edgeIndex: number;
  edgeNormal: Vector2;
  edgeDistance: number;
} {
  let minDistance = Infinity;
  let minIndex = 0;
  let minNormal: Vector2 = { x: 0, y: 0 };

  for (let i = 0; i < polytope.length; i++) {
    const j = (i + 1) % polytope.length;
    const a = polytope[i];
    const b = polytope[j];

    const edge = subtract(b, a);
    let normal = normalize({ x: edge.y, y: -edge.x }); // 顺时针法向量

    const distance = dot(a, normal);

    // 确保法向量指向外部
    if (distance < 0) {
      normal = { x: -normal.x, y: -normal.y };
    }

    const absDist = Math.abs(distance);
    if (absDist < minDistance) {
      minDistance = absDist;
      minIndex = i;
      minNormal = normal;
    }
  }

  return {
    edgeIndex: minIndex,
    edgeNormal: minNormal,
    edgeDistance: minDistance
  };
}
```

## 空间分区优化

当场景中存在大量物体时，逐对检测的 O(n^2) 复杂度变得不可接受。空间分区技术可以大幅减少需要检测的物体对数量。

### 网格分区

最简单的空间分区方法是将空间划分为均匀的网格：

```typescript
interface GridCell {
  objects: number[]; // 存储物体的索引
}

class SpatialGrid {
  private cells: Map<string, GridCell> = new Map();
  private cellSize: number;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  private getCell(key: string): GridCell {
    let cell = this.cells.get(key);
    if (!cell) {
      cell = { objects: [] };
      this.cells.set(key, cell);
    }
    return cell;
  }

  // 清空网格
  clear(): void {
    this.cells.clear();
  }

  // 将物体插入网格
  insert(objectIndex: number, aabb: AABB2D): void {
    const startX = Math.floor(aabb.minX / this.cellSize);
    const startY = Math.floor(aabb.minY / this.cellSize);
    const endX = Math.floor(aabb.maxX / this.cellSize);
    const endY = Math.floor(aabb.maxY / this.cellSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const key = `${x},${y}`;
        const cell = this.getCell(key);
        cell.objects.push(objectIndex);
      }
    }
  }

  // 获取可能碰撞的物体对
  getPotentialCollisions(): Set<string> {
    const pairs = new Set<string>();

    for (const cell of this.cells.values()) {
      const objects = cell.objects;
      for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
          const a = Math.min(objects[i], objects[j]);
          const b = Math.max(objects[i], objects[j]);
          pairs.add(`${a},${b}`);
        }
      }
    }

    return pairs;
  }
}

// 使用示例
function broadPhaseWithGrid(objects: { aabb: AABB2D }[]): [number, number][] {
  const grid = new SpatialGrid(100); // 100 像素大小的网格

  // 插入所有物体
  for (let i = 0; i < objects.length; i++) {
    grid.insert(i, objects[i].aabb);
  }

  // 获取潜在碰撞对
  const pairStrings = grid.getPotentialCollisions();
  const pairs: [number, number][] = [];

  for (const pairStr of pairStrings) {
    const [a, b] = pairStr.split(',').map(Number);
    pairs.push([a, b]);
  }

  return pairs;
}
```

### 四叉树

四叉树是一种自适应的空间分区结构，对于物体分布不均匀的场景特别有效：

```typescript
interface QuadTreeNode {
  bounds: AABB2D;
  objects: number[];
  children: QuadTreeNode[] | null;
  depth: number;
}

class QuadTree {
  private root: QuadTreeNode;
  private maxObjects: number;
  private maxDepth: number;
  private objectAABBs: AABB2D[];

  constructor(
    bounds: AABB2D,
    maxObjects: number = 10,
    maxDepth: number = 5
  ) {
    this.root = this.createNode(bounds, 0);
    this.maxObjects = maxObjects;
    this.maxDepth = maxDepth;
    this.objectAABBs = [];
  }

  private createNode(bounds: AABB2D, depth: number): QuadTreeNode {
    return {
      bounds,
      objects: [],
      children: null,
      depth
    };
  }

  private subdivide(node: QuadTreeNode): void {
    const { minX, minY, maxX, maxY } = node.bounds;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const nextDepth = node.depth + 1;

    node.children = [
      this.createNode({ minX, minY, maxX: midX, maxY: midY }, nextDepth),       // 左下
      this.createNode({ minX: midX, minY, maxX, maxY: midY }, nextDepth),       // 右下
      this.createNode({ minX, minY: midY, maxX: midX, maxY }, nextDepth),       // 左上
      this.createNode({ minX: midX, minY: midY, maxX, maxY }, nextDepth)        // 右上
    ];

    // 将当前节点的物体分配到子节点
    for (const objectIndex of node.objects) {
      this.insertToChildren(node, objectIndex);
    }
    node.objects = [];
  }

  private insertToChildren(node: QuadTreeNode, objectIndex: number): void {
    const aabb = this.objectAABBs[objectIndex];
    for (const child of node.children!) {
      if (aabbVsAabb2D(aabb, child.bounds)) {
        this.insertToNode(child, objectIndex);
      }
    }
  }

  private insertToNode(node: QuadTreeNode, objectIndex: number): void {
    if (node.children) {
      this.insertToChildren(node, objectIndex);
      return;
    }

    node.objects.push(objectIndex);

    // 检查是否需要分裂
    if (node.objects.length > this.maxObjects && node.depth < this.maxDepth) {
      this.subdivide(node);
    }
  }

  insert(objectIndex: number, aabb: AABB2D): void {
    this.objectAABBs[objectIndex] = aabb;
    this.insertToNode(this.root, objectIndex);
  }

  clear(): void {
    this.root = this.createNode(this.root.bounds, 0);
    this.objectAABBs = [];
  }

  // 查询与给定 AABB 可能碰撞的物体
  query(aabb: AABB2D): number[] {
    const result: number[] = [];
    this.queryNode(this.root, aabb, result);
    return result;
  }

  private queryNode(node: QuadTreeNode, aabb: AABB2D, result: number[]): void {
    if (!aabbVsAabb2D(aabb, node.bounds)) {
      return;
    }

    for (const objectIndex of node.objects) {
      if (aabbVsAabb2D(aabb, this.objectAABBs[objectIndex])) {
        result.push(objectIndex);
      }
    }

    if (node.children) {
      for (const child of node.children) {
        this.queryNode(child, aabb, result);
      }
    }
  }

  // 获取所有潜在碰撞对
  getPotentialCollisions(): [number, number][] {
    const pairs: Set<string> = new Set();
    this.collectPairs(this.root, pairs);

    const result: [number, number][] = [];
    for (const pairStr of pairs) {
      const [a, b] = pairStr.split(',').map(Number);
      result.push([a, b]);
    }
    return result;
  }

  private collectPairs(node: QuadTreeNode, pairs: Set<string>): void {
    // 节点内物体之间的碰撞
    const objects = node.objects;
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const a = Math.min(objects[i], objects[j]);
        const b = Math.max(objects[i], objects[j]);
        pairs.add(`${a},${b}`);
      }
    }

    if (node.children) {
      // 递归处理子节点
      for (const child of node.children) {
        this.collectPairs(child, pairs);
      }

      // 跨子节点的碰撞检测
      for (let i = 0; i < node.children.length; i++) {
        for (let j = i + 1; j < node.children.length; j++) {
          this.collectCrossPairs(node.children[i], node.children[j], pairs);
        }
      }
    }
  }

  private collectCrossPairs(
    nodeA: QuadTreeNode,
    nodeB: QuadTreeNode,
    pairs: Set<string>
  ): void {
    const objectsA = this.getAllObjects(nodeA);
    const objectsB = this.getAllObjects(nodeB);

    for (const a of objectsA) {
      for (const b of objectsB) {
        if (aabbVsAabb2D(this.objectAABBs[a], this.objectAABBs[b])) {
          const min = Math.min(a, b);
          const max = Math.max(a, b);
          pairs.add(`${min},${max}`);
        }
      }
    }
  }

  private getAllObjects(node: QuadTreeNode): number[] {
    const result = [...node.objects];
    if (node.children) {
      for (const child of node.children) {
        result.push(...this.getAllObjects(child));
      }
    }
    return result;
  }
}
```

### BVH（包围体层次结构）

BVH 是一种自顶向下或自底向上构建的树形结构，常用于光线追踪和碰撞检测：

```typescript
interface BVHNode {
  aabb: AABB2D;
  left: BVHNode | null;
  right: BVHNode | null;
  objectIndex: number | null; // 叶节点存储物体索引
}

class BVH {
  private root: BVHNode | null = null;

  constructor(objects: { aabb: AABB2D }[]) {
    if (objects.length > 0) {
      const indices = objects.map((_, i) => i);
      this.root = this.build(objects, indices);
    }
  }

  private build(
    objects: { aabb: AABB2D }[],
    indices: number[]
  ): BVHNode {
    // 计算所有物体的包围盒
    const combinedAABB = indices.reduce(
      (acc, i) => mergeAABB(acc, objects[i].aabb),
      objects[indices[0]].aabb
    );

    // 叶节点
    if (indices.length === 1) {
      return {
        aabb: combinedAABB,
        left: null,
        right: null,
        objectIndex: indices[0]
      };
    }

    // 选择分割轴（最长的轴）
    const width = combinedAABB.maxX - combinedAABB.minX;
    const height = combinedAABB.maxY - combinedAABB.minY;
    const axis = width > height ? 'x' : 'y';

    // 按中心点排序
    indices.sort((a, b) => {
      const aCenter = axis === 'x'
        ? (objects[a].aabb.minX + objects[a].aabb.maxX) / 2
        : (objects[a].aabb.minY + objects[a].aabb.maxY) / 2;
      const bCenter = axis === 'x'
        ? (objects[b].aabb.minX + objects[b].aabb.maxX) / 2
        : (objects[b].aabb.minY + objects[b].aabb.maxY) / 2;
      return aCenter - bCenter;
    });

    // 分割
    const mid = Math.floor(indices.length / 2);
    const leftIndices = indices.slice(0, mid);
    const rightIndices = indices.slice(mid);

    return {
      aabb: combinedAABB,
      left: this.build(objects, leftIndices),
      right: this.build(objects, rightIndices),
      objectIndex: null
    };
  }

  // 查询与给定 AABB 碰撞的物体
  query(aabb: AABB2D): number[] {
    const result: number[] = [];
    this.queryNode(this.root, aabb, result);
    return result;
  }

  private queryNode(
    node: BVHNode | null,
    aabb: AABB2D,
    result: number[]
  ): void {
    if (!node || !aabbVsAabb2D(aabb, node.aabb)) {
      return;
    }

    if (node.objectIndex !== null) {
      result.push(node.objectIndex);
      return;
    }

    this.queryNode(node.left, aabb, result);
    this.queryNode(node.right, aabb, result);
  }

  // 获取所有潜在碰撞对
  getPotentialCollisions(): [number, number][] {
    const pairs: [number, number][] = [];
    if (this.root) {
      this.findPairs(this.root, this.root, pairs);
    }
    return pairs;
  }

  private findPairs(
    nodeA: BVHNode | null,
    nodeB: BVHNode | null,
    pairs: [number, number][]
  ): void {
    if (!nodeA || !nodeB) return;
    if (!aabbVsAabb2D(nodeA.aabb, nodeB.aabb)) return;

    // 两个叶节点
    if (nodeA.objectIndex !== null && nodeB.objectIndex !== null) {
      if (nodeA.objectIndex < nodeB.objectIndex) {
        pairs.push([nodeA.objectIndex, nodeB.objectIndex]);
      }
      return;
    }

    // 至少一个是内部节点
    if (nodeA.objectIndex === null) {
      this.findPairs(nodeA.left, nodeB, pairs);
      this.findPairs(nodeA.right, nodeB, pairs);
    } else {
      this.findPairs(nodeA, nodeB.left, pairs);
      this.findPairs(nodeA, nodeB.right, pairs);
    }
  }
}
```

## 连续碰撞检测

### 为什么需要 CCD

传统的离散碰撞检测在每帧检测物体是否相交。当物体移动速度很快时，可能会出现"穿隧效应"（Tunneling），即物体穿过薄墙或小物体而不被检测到。

```
帧 N:          帧 N+1:
  ●→            →●
  |             |
墙|             |墙
  |             |

物体从墙的一侧"穿越"到另一侧
```

连续碰撞检测（CCD, Continuous Collision Detection）通过考虑物体在两帧之间的完整运动轨迹来解决这个问题。

### 射线/线段与 AABB 的交点

CCD 的基础是计算运动轨迹与几何体的交点：

```typescript
interface Ray {
  origin: Vector2;
  direction: Vector2;
}

interface RaycastResult {
  hit: boolean;
  t: number;           // 命中时间 (0-1)
  point: Vector2;      // 命中点
  normal: Vector2;     // 命中法向量
}

function rayVsAABB(ray: Ray, aabb: AABB2D): RaycastResult {
  const { origin, direction } = ray;

  // 处理方向为零的情况
  const invDirX = direction.x !== 0 ? 1 / direction.x : Infinity;
  const invDirY = direction.y !== 0 ? 1 / direction.y : Infinity;

  // 计算与各个平面的交点时间
  const tx1 = (aabb.minX - origin.x) * invDirX;
  const tx2 = (aabb.maxX - origin.x) * invDirX;
  const ty1 = (aabb.minY - origin.y) * invDirY;
  const ty2 = (aabb.maxY - origin.y) * invDirY;

  const tmin = Math.max(Math.min(tx1, tx2), Math.min(ty1, ty2));
  const tmax = Math.min(Math.max(tx1, tx2), Math.max(ty1, ty2));

  // 没有交点
  if (tmax < 0 || tmin > tmax) {
    return {
      hit: false,
      t: Infinity,
      point: { x: 0, y: 0 },
      normal: { x: 0, y: 0 }
    };
  }

  const t = tmin >= 0 ? tmin : tmax;
  const point = {
    x: origin.x + direction.x * t,
    y: origin.y + direction.y * t
  };

  // 计算法向量
  let normal: Vector2;
  if (t === tx1) {
    normal = { x: -1, y: 0 };
  } else if (t === tx2) {
    normal = { x: 1, y: 0 };
  } else if (t === ty1) {
    normal = { x: 0, y: -1 };
  } else {
    normal = { x: 0, y: 1 };
  }

  return { hit: true, t, point, normal };
}
```

### 移动 AABB vs 静态 AABB

检测一个移动的 AABB 是否会与静态 AABB 碰撞：

```typescript
interface SweptAABBResult {
  hit: boolean;
  entryTime: number;      // 开始碰撞的时间
  exitTime: number;       // 结束碰撞的时间
  normal: Vector2;        // 碰撞法向量
}

function sweptAABB(
  movingBox: AABB2D,
  velocity: Vector2,
  staticBox: AABB2D
): SweptAABBResult {
  // 计算扩展的 AABB（闵可夫斯基和）
  const expandedBox: AABB2D = {
    minX: staticBox.minX - (movingBox.maxX - movingBox.minX) / 2,
    minY: staticBox.minY - (movingBox.maxY - movingBox.minY) / 2,
    maxX: staticBox.maxX + (movingBox.maxX - movingBox.minX) / 2,
    maxY: staticBox.maxY + (movingBox.maxY - movingBox.minY) / 2
  };

  // 移动盒子的中心点
  const center: Vector2 = {
    x: (movingBox.minX + movingBox.maxX) / 2,
    y: (movingBox.minY + movingBox.maxY) / 2
  };

  // 射线检测
  const result = rayVsAABB({ origin: center, direction: velocity }, expandedBox);

  if (!result.hit || result.t > 1 || result.t < 0) {
    return {
      hit: false,
      entryTime: 1,
      exitTime: 1,
      normal: { x: 0, y: 0 }
    };
  }

  return {
    hit: true,
    entryTime: result.t,
    exitTime: 1, // 简化处理
    normal: result.normal
  };
}
```

### 移动圆与静态圆的 CCD

```typescript
function sweptCircleVsCircle(
  movingCircle: Circle,
  velocity: Vector2,
  staticCircle: Circle
): { hit: boolean; t: number; point: Vector2; normal: Vector2 } {
  // 相对位置
  const dx = movingCircle.x - staticCircle.x;
  const dy = movingCircle.y - staticCircle.y;
  const radiusSum = movingCircle.radius + staticCircle.radius;

  // 二次方程系数: at^2 + bt + c = 0
  const a = velocity.x * velocity.x + velocity.y * velocity.y;
  const b = 2 * (dx * velocity.x + dy * velocity.y);
  const c = dx * dx + dy * dy - radiusSum * radiusSum;

  // 判别式
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return {
      hit: false,
      t: Infinity,
      point: { x: 0, y: 0 },
      normal: { x: 0, y: 0 }
    };
  }

  const sqrtD = Math.sqrt(discriminant);
  let t = (-b - sqrtD) / (2 * a);

  // 如果 t 为负，尝试另一个解
  if (t < 0) {
    t = (-b + sqrtD) / (2 * a);
  }

  // 检查 t 是否在有效范围内
  if (t < 0 || t > 1) {
    return {
      hit: false,
      t: Infinity,
      point: { x: 0, y: 0 },
      normal: { x: 0, y: 0 }
    };
  }

  // 计算碰撞点和法向量
  const hitX = movingCircle.x + velocity.x * t;
  const hitY = movingCircle.y + velocity.y * t;

  const normalX = hitX - staticCircle.x;
  const normalY = hitY - staticCircle.y;
  const normalLen = Math.sqrt(normalX * normalX + normalY * normalY);

  return {
    hit: true,
    t,
    point: {
      x: staticCircle.x + (normalX / normalLen) * staticCircle.radius,
      y: staticCircle.y + (normalY / normalLen) * staticCircle.radius
    },
    normal: {
      x: normalX / normalLen,
      y: normalY / normalLen
    }
  };
}
```

### 完整的 CCD 物理系统示例

```typescript
interface PhysicsBody {
  position: Vector2;
  velocity: Vector2;
  aabb: AABB2D;
  isStatic: boolean;
}

function updatePhysics(bodies: PhysicsBody[], deltaTime: number): void {
  // 更新动态物体
  for (const body of bodies) {
    if (body.isStatic) continue;

    // 应用重力等力
    body.velocity.y += 980 * deltaTime; // 重力加速度

    // 计算这一帧的位移
    const displacement: Vector2 = {
      x: body.velocity.x * deltaTime,
      y: body.velocity.y * deltaTime
    };

    // CCD 碰撞检测和响应
    let remainingTime = 1.0;
    const maxIterations = 4;

    for (let i = 0; i < maxIterations && remainingTime > 0.001; i++) {
      let earliestHit: SweptAABBResult | null = null;
      let earliestTime = remainingTime;

      // 检测与所有静态物体的碰撞
      for (const other of bodies) {
        if (!other.isStatic || other === body) continue;

        const scaledDisplacement = {
          x: displacement.x * remainingTime,
          y: displacement.y * remainingTime
        };

        const result = sweptAABB(body.aabb, scaledDisplacement, other.aabb);

        if (result.hit && result.entryTime < earliestTime) {
          earliestTime = result.entryTime;
          earliestHit = result;
        }
      }

      if (earliestHit) {
        // 移动到碰撞点（稍微往前一点避免穿透）
        const moveTime = Math.max(0, earliestTime - 0.001);
        body.position.x += displacement.x * moveTime * remainingTime;
        body.position.y += displacement.y * moveTime * remainingTime;

        // 更新速度（滑动响应）
        const dotProduct =
          body.velocity.x * earliestHit.normal.x +
          body.velocity.y * earliestHit.normal.y;

        body.velocity.x -= dotProduct * earliestHit.normal.x;
        body.velocity.y -= dotProduct * earliestHit.normal.y;

        // 更新位移
        displacement.x = body.velocity.x * deltaTime;
        displacement.y = body.velocity.y * deltaTime;

        remainingTime *= (1 - earliestTime);
      } else {
        // 没有碰撞，完成移动
        body.position.x += displacement.x * remainingTime;
        body.position.y += displacement.y * remainingTime;
        remainingTime = 0;
      }

      // 更新 AABB
      updateBodyAABB(body);
    }
  }
}

function updateBodyAABB(body: PhysicsBody): void {
  const halfWidth = (body.aabb.maxX - body.aabb.minX) / 2;
  const halfHeight = (body.aabb.maxY - body.aabb.minY) / 2;

  body.aabb.minX = body.position.x - halfWidth;
  body.aabb.maxX = body.position.x + halfWidth;
  body.aabb.minY = body.position.y - halfHeight;
  body.aabb.maxY = body.position.y + halfHeight;
}
```

## 实战：完整的碰撞系统

将前面学到的所有技术整合到一个完整的碰撞检测系统中：

```typescript
// 碰撞器类型
enum ColliderType {
  AABB,
  Circle,
  Polygon
}

interface Collider {
  type: ColliderType;
  data: AABB2D | Circle | Polygon;
  getAABB(): AABB2D;
}

class AABBCollider implements Collider {
  type = ColliderType.AABB;
  constructor(public data: AABB2D) {}

  getAABB(): AABB2D {
    return this.data;
  }
}

class CircleCollider implements Collider {
  type = ColliderType.Circle;
  constructor(public data: Circle) {}

  getAABB(): AABB2D {
    return {
      minX: this.data.x - this.data.radius,
      minY: this.data.y - this.data.radius,
      maxX: this.data.x + this.data.radius,
      maxY: this.data.y + this.data.radius
    };
  }
}

class PolygonCollider implements Collider {
  type = ColliderType.Polygon;
  private cachedAABB: AABB2D | null = null;

  constructor(public data: Polygon) {}

  getAABB(): AABB2D {
    if (!this.cachedAABB) {
      this.cachedAABB = createAABBFromPoints(this.data.vertices);
    }
    return this.cachedAABB;
  }

  invalidateCache(): void {
    this.cachedAABB = null;
  }
}

// 碰撞结果
interface CollisionResult {
  colliding: boolean;
  normal: Vector2;
  penetration: number;
  contactPoints: Vector2[];
}

// 碰撞检测调度器
function detectCollision(a: Collider, b: Collider): CollisionResult {
  // 先进行 AABB 粗略检测
  if (!aabbVsAabb2D(a.getAABB(), b.getAABB())) {
    return {
      colliding: false,
      normal: { x: 0, y: 0 },
      penetration: 0,
      contactPoints: []
    };
  }

  // 根据类型调用具体的检测函数
  if (a.type === ColliderType.AABB && b.type === ColliderType.AABB) {
    const info = aabbCollisionInfo(a.data as AABB2D, b.data as AABB2D);
    return {
      ...info,
      contactPoints: info.colliding ? [calculateAABBContactPoint(a.data as AABB2D, b.data as AABB2D)] : []
    };
  }

  if (a.type === ColliderType.Circle && b.type === ColliderType.Circle) {
    const info = circleVsCircle(a.data as Circle, b.data as Circle);
    return {
      colliding: info.colliding,
      normal: info.normal,
      penetration: info.penetration,
      contactPoints: info.colliding ? [info.contactPoint] : []
    };
  }

  if (a.type === ColliderType.Circle && b.type === ColliderType.AABB) {
    const info = circleVsAABB(a.data as Circle, b.data as AABB2D);
    return {
      colliding: info.colliding,
      normal: info.normal,
      penetration: info.penetration,
      contactPoints: info.colliding ? [info.contactPoint] : []
    };
  }

  if (a.type === ColliderType.AABB && b.type === ColliderType.Circle) {
    const info = circleVsAABB(b.data as Circle, a.data as AABB2D);
    return {
      colliding: info.colliding,
      normal: { x: -info.normal.x, y: -info.normal.y },
      penetration: info.penetration,
      contactPoints: info.colliding ? [info.contactPoint] : []
    };
  }

  if (a.type === ColliderType.Polygon && b.type === ColliderType.Polygon) {
    const result = satCollision(a.data as Polygon, b.data as Polygon);
    return {
      colliding: result.colliding,
      normal: result.normal || { x: 0, y: 0 },
      penetration: result.penetration,
      contactPoints: [] // SAT 不直接提供接触点
    };
  }

  // 其他组合可以用 GJK
  const shapeA = createShapeFromCollider(a);
  const shapeB = createShapeFromCollider(b);

  if (gjkCollision(shapeA, shapeB)) {
    // 使用 EPA 获取穿透信息
    // 这里简化处理，实际需要保存 GJK 的单纯形
    return {
      colliding: true,
      normal: { x: 0, y: 1 },
      penetration: 0,
      contactPoints: []
    };
  }

  return {
    colliding: false,
    normal: { x: 0, y: 0 },
    penetration: 0,
    contactPoints: []
  };
}

function calculateAABBContactPoint(a: AABB2D, b: AABB2D): Vector2 {
  return {
    x: Math.max(a.minX, b.minX) + (Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX)) / 2,
    y: Math.max(a.minY, b.minY) + (Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY)) / 2
  };
}

function createShapeFromCollider(collider: Collider): Shape {
  switch (collider.type) {
    case ColliderType.Circle:
      const circle = collider.data as Circle;
      return new CircleShape({ x: circle.x, y: circle.y }, circle.radius);
    case ColliderType.Polygon:
      return new PolygonShape((collider.data as Polygon).vertices);
    case ColliderType.AABB:
      const aabb = collider.data as AABB2D;
      return new PolygonShape([
        { x: aabb.minX, y: aabb.minY },
        { x: aabb.maxX, y: aabb.minY },
        { x: aabb.maxX, y: aabb.maxY },
        { x: aabb.minX, y: aabb.maxY }
      ]);
    default:
      throw new Error('Unknown collider type');
  }
}

// 完整的碰撞世界
class CollisionWorld {
  private bodies: { collider: Collider; id: number }[] = [];
  private spatialIndex: QuadTree;
  private nextId = 0;

  constructor(bounds: AABB2D) {
    this.spatialIndex = new QuadTree(bounds);
  }

  addBody(collider: Collider): number {
    const id = this.nextId++;
    this.bodies.push({ collider, id });
    return id;
  }

  removeBody(id: number): void {
    const index = this.bodies.findIndex(b => b.id === id);
    if (index !== -1) {
      this.bodies.splice(index, 1);
    }
  }

  update(): CollisionResult[] {
    // 重建空间索引
    this.spatialIndex.clear();
    for (let i = 0; i < this.bodies.length; i++) {
      this.spatialIndex.insert(i, this.bodies[i].collider.getAABB());
    }

    // 获取潜在碰撞对
    const pairs = this.spatialIndex.getPotentialCollisions();
    const results: CollisionResult[] = [];

    // 精确碰撞检测
    for (const [i, j] of pairs) {
      const result = detectCollision(
        this.bodies[i].collider,
        this.bodies[j].collider
      );

      if (result.colliding) {
        results.push(result);
      }
    }

    return results;
  }
}
```

## 性能优化技巧

### 使用对象池

频繁创建和销毁对象会导致垃圾回收压力：

```typescript
class VectorPool {
  private pool: Vector2[] = [];

  acquire(): Vector2 {
    return this.pool.pop() || { x: 0, y: 0 };
  }

  release(v: Vector2): void {
    v.x = 0;
    v.y = 0;
    this.pool.push(v);
  }
}

const vectorPool = new VectorPool();
```

### 避免平方根计算

比较距离时，使用距离的平方而不是实际距离：

```typescript
// 慢
const dist = Math.sqrt(dx * dx + dy * dy);
if (dist < radius) { ... }

// 快
const distSq = dx * dx + dy * dy;
if (distSq < radius * radius) { ... }
```

### 使用位掩码进行碰撞过滤

```typescript
const CollisionLayers = {
  PLAYER: 1 << 0,    // 0001
  ENEMY: 1 << 1,     // 0010
  BULLET: 1 << 2,    // 0100
  WALL: 1 << 3       // 1000
};

interface PhysicsBody {
  layer: number;
  mask: number;  // 与哪些层碰撞
}

function shouldCollide(a: PhysicsBody, b: PhysicsBody): boolean {
  return (a.layer & b.mask) !== 0 && (b.layer & a.mask) !== 0;
}
```

### 时间切片

对于大量物体，将碰撞检测分散到多帧：

```typescript
class TimeSlicedCollisionSystem {
  private currentIndex = 0;
  private bodiesPerFrame = 100;

  update(bodies: PhysicsBody[]): void {
    const endIndex = Math.min(
      this.currentIndex + this.bodiesPerFrame,
      bodies.length
    );

    for (let i = this.currentIndex; i < endIndex; i++) {
      // 检测碰撞
    }

    this.currentIndex = endIndex >= bodies.length ? 0 : endIndex;
  }
}
```

## 面试要点

### 高频面试题

**1. AABB 和 OBB 的区别？各自的优缺点？**

- AABB 与坐标轴对齐，计算简单（6次比较），但对旋转物体拟合差
- OBB 可以任意旋转，拟合更紧密，但需要更多计算（使用 SAT）

**2. 什么是分离轴定理？如何实现？**

- 如果两个凸形状不相交，必存在一条轴使它们的投影不重叠
- 对于多边形，检测所有边的法向量作为潜在分离轴
- 时间复杂度 O(n + m)，n 和 m 是两个多边形的边数

**3. GJK 算法的核心思想是什么？**

- 利用闵可夫斯基差：两形状碰撞当且仅当其闵可夫斯基差包含原点
- 通过 Support 函数迭代构建单纯形来逼近原点
- 结合 EPA 可以获得穿透深度和方向

**4. 如何优化大量物体的碰撞检测？**

- 使用空间分区（网格、四叉树、BVH）将 O(n^2) 降低到 O(n log n)
- 使用 AABB 进行宽阶段筛选
- 使用碰撞层过滤不需要检测的物体对
- 对于静态物体，预计算并缓存碰撞信息

**5. 什么是连续碰撞检测？为什么需要它？**

- CCD 检测物体在运动过程中的碰撞，而不是仅检测当前位置
- 解决高速物体的穿隧问题（子弹穿墙）
- 实现方式：扫掠体积、射线投射、时间步细分

## 延伸阅读

### 推荐资源

- **Real-Time Collision Detection** - Christer Ericson 的经典著作
- **Game Physics Engine Development** - Ian Millington
- **Box2D 源码** - 学习工业级物理引擎的实现

### 开源物理引擎

- **Box2D**：最流行的 2D 物理引擎
- **Matter.js**：JavaScript 2D 物理引擎
- **Bullet**：高性能 3D 物理引擎
- **PhysX**：NVIDIA 的商业级物理引擎

### 进阶主题

- **碰撞响应**：冲量、摩擦、弹性碰撞
- **约束求解器**：关节、接触约束
- **软体物理**：布料、绳索模拟
- **流体动力学**：SPH、网格法

## 总结

碰撞检测是游戏开发的核心技术之一。本文从基础概念出发，详细介绍了：

1. **基础算法**：AABB、圆形、OBB 的碰撞检测
2. **通用算法**：分离轴定理（SAT）和 GJK 算法
3. **空间优化**：网格、四叉树、BVH 等空间分区技术
4. **连续检测**：CCD 解决高速物体的穿隧问题

掌握这些技术后，你将能够：

- 为不同类型的游戏选择合适的碰撞检测方案
- 优化大规模场景的碰撞性能
- 处理高速物体的精确碰撞
- 在面试中自信地讨论碰撞检测相关问题

记住，实际开发中通常使用成熟的物理引擎（如 Box2D、Matter.js），但理解底层原理对于调试问题、优化性能以及实现自定义需求至关重要。
