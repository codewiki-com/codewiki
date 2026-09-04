---
title: 碰撞检测算法详解：AABB、SAT 与 GJK
description: 深入解析游戏碰撞检测算法：AABB 包围盒、分离轴定理、Gilbert-Johnson-Keerthi 算法及其实现
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - 碰撞检测
  - AABB
  - SAT
  - GJK
  - 物理引擎
  - 游戏数学
status: imported
origin: old/src/content/docs/gamedev/collision-algorithms.zh.md
divergence: 0.217
issues: []
legacy:
  category: GameDev
  subcategory: Physics
  order: 50
  lastUpdated: 2026-01-22
---

## 碰撞检测简介

碰撞检测是任何基于物理的游戏或模拟系统的基础组件。它用于确定两个或多个对象何时相交，从而实现真实的物理响应、游戏玩法机制和世界交互。本文将深入探讨三种核心碰撞检测算法：AABB（轴对齐包围盒）、SAT（分离轴定理）和 GJK（Gilbert-Johnson-Keerthi 算法）。

### 碰撞检测流程

现代碰撞检测系统通常分为两个阶段：

```
所有对象 --> 粗检测阶段 --> 候选对组 --> 精检测阶段 --> 碰撞对组
              (快速)                      (精确)

粗检测阶段：快速排除明显不碰撞的对象对
精检测阶段：对剩余对象对进行精确碰撞测试
```

本文涵盖的算法在流程中扮演不同角色：
- **AABB**：用于粗检测阶段（空间分区）和精检测阶段（简单形状）
- **SAT**：用于凸多边形的精检测阶段算法
- **GJK**：适用于任何凸形状的高级精检测阶段算法

---

## AABB：轴对齐包围盒

AABB 是最简单、最快速的碰撞检测方法。它使用与坐标轴对齐的矩形盒子来近似对象边界。

### 数学基础

AABB 由两个角点定义：最小点（2D 中的左下角，或 3D 中的最小角）和最大点（2D 中的右上角，或 3D 中的最大角）。

```
2D AABB：
    min = (x_min, y_min)
    max = (x_max, y_max)

3D AABB：
    min = (x_min, y_min, z_min)
    max = (x_max, y_max, z_max)
```

### AABB 碰撞测试

两个 AABB 碰撞当且仅当它们在所有轴上都重叠：

```typescript
interface AABB2D {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface AABB3D {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

// 2D AABB 碰撞测试 - O(1) 复杂度
function checkAABB2DCollision(a: AABB2D, b: AABB2D): boolean {
  return (
    a.minX <= b.maxX &&
    a.maxX >= b.minX &&
    a.minY <= b.maxY &&
    a.maxY >= b.minY
  );
}

// 3D AABB 碰撞测试 - O(1) 复杂度
function checkAABB3DCollision(a: AABB3D, b: AABB3D): boolean {
  return (
    a.minX <= b.maxX && a.maxX >= b.minX &&
    a.minY <= b.maxY && a.maxY >= b.minY &&
    a.minZ <= b.maxZ && a.maxZ >= b.minZ
  );
}

// 使用中心点和半尺寸的替代表示
interface AABBCenterExtent {
  center: { x: number; y: number; z: number };
  halfExtents: { x: number; y: number; z: number };
}

function checkAABBCenterExtent(a: AABBCenterExtent, b: AABBCenterExtent): boolean {
  const dx = Math.abs(a.center.x - b.center.x);
  const dy = Math.abs(a.center.y - b.center.y);
  const dz = Math.abs(a.center.z - b.center.z);

  return (
    dx <= (a.halfExtents.x + b.halfExtents.x) &&
    dy <= (a.halfExtents.y + b.halfExtents.y) &&
    dz <= (a.halfExtents.z + b.halfExtents.z)
  );
}
```

### 计算穿透深度和最小位移向量

最小位移向量（MTV）是分离两个碰撞 AABB 所需的最小向量：

```typescript
interface CollisionResult {
  colliding: boolean;
  penetrationDepth: number;
  normal: { x: number; y: number };
  mtv: { x: number; y: number };
}

function getAABBCollisionInfo(a: AABB2D, b: AABB2D): CollisionResult {
  // 计算每个轴上的重叠量
  const overlapX = Math.min(a.maxX - b.minX, b.maxX - a.minX);
  const overlapY = Math.min(a.maxY - b.minY, b.maxY - a.minY);

  // 如果任何重叠为负则无碰撞
  if (overlapX <= 0 || overlapY <= 0) {
    return {
      colliding: false,
      penetrationDepth: 0,
      normal: { x: 0, y: 0 },
      mtv: { x: 0, y: 0 }
    };
  }

  // 找到穿透最小的轴
  let normal: { x: number; y: number };
  let penetrationDepth: number;

  if (overlapX < overlapY) {
    penetrationDepth = overlapX;
    // 根据相对位置确定方向
    const centerAX = (a.minX + a.maxX) / 2;
    const centerBX = (b.minX + b.maxX) / 2;
    normal = { x: centerAX < centerBX ? -1 : 1, y: 0 };
  } else {
    penetrationDepth = overlapY;
    const centerAY = (a.minY + a.maxY) / 2;
    const centerBY = (b.minY + b.maxY) / 2;
    normal = { x: 0, y: centerAY < centerBY ? -1 : 1 };
  }

  return {
    colliding: true,
    penetrationDepth,
    normal,
    mtv: {
      x: normal.x * penetrationDepth,
      y: normal.y * penetrationDepth
    }
  };
}
```

### AABB 与圆形碰撞

测试 AABB 与圆形（或 3D 中的球体）碰撞是常见需求：

```typescript
interface Circle {
  x: number;
  y: number;
  radius: number;
}

function checkAABBCircleCollision(aabb: AABB2D, circle: Circle): boolean {
  // 找到 AABB 上距离圆心最近的点
  const closestX = Math.max(aabb.minX, Math.min(circle.x, aabb.maxX));
  const closestY = Math.max(aabb.minY, Math.min(circle.y, aabb.maxY));

  // 计算圆心到最近点的距离
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;

  // 比较平方值以避免昂贵的 sqrt 运算
  return distanceSquared <= circle.radius * circle.radius;
}

function getAABBCircleCollisionInfo(aabb: AABB2D, circle: Circle): CollisionResult {
  const closestX = Math.max(aabb.minX, Math.min(circle.x, aabb.maxX));
  const closestY = Math.max(aabb.minY, Math.min(circle.y, aabb.maxY));

  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;

  if (distanceSquared > circle.radius * circle.radius) {
    return {
      colliding: false,
      penetrationDepth: 0,
      normal: { x: 0, y: 0 },
      mtv: { x: 0, y: 0 }
    };
  }

  const distance = Math.sqrt(distanceSquared);

  // 处理圆心在 AABB 内部的情况
  if (distance === 0) {
    // 沿最小穿透方向推出
    const left = circle.x - aabb.minX;
    const right = aabb.maxX - circle.x;
    const top = circle.y - aabb.minY;
    const bottom = aabb.maxY - circle.y;

    const minDist = Math.min(left, right, top, bottom);

    if (minDist === left) {
      return {
        colliding: true,
        penetrationDepth: circle.radius + left,
        normal: { x: -1, y: 0 },
        mtv: { x: -(circle.radius + left), y: 0 }
      };
    } else if (minDist === right) {
      return {
        colliding: true,
        penetrationDepth: circle.radius + right,
        normal: { x: 1, y: 0 },
        mtv: { x: circle.radius + right, y: 0 }
      };
    } else if (minDist === top) {
      return {
        colliding: true,
        penetrationDepth: circle.radius + top,
        normal: { x: 0, y: -1 },
        mtv: { x: 0, y: -(circle.radius + top) }
      };
    } else {
      return {
        colliding: true,
        penetrationDepth: circle.radius + bottom,
        normal: { x: 0, y: 1 },
        mtv: { x: 0, y: circle.radius + bottom }
      };
    }
  }

  const penetrationDepth = circle.radius - distance;
  const normalX = distanceX / distance;
  const normalY = distanceY / distance;

  return {
    colliding: true,
    penetrationDepth,
    normal: { x: normalX, y: normalY },
    mtv: { x: normalX * penetrationDepth, y: normalY * penetrationDepth }
  };
}
```

### 旋转物体的动态 AABB

当物体旋转时，需要重新计算其 AABB：

```typescript
interface RotatedRectangle {
  centerX: number;
  centerY: number;
  halfWidth: number;
  halfHeight: number;
  rotation: number; // 弧度
}

function computeAABBFromRotatedRect(rect: RotatedRectangle): AABB2D {
  const cos = Math.abs(Math.cos(rect.rotation));
  const sin = Math.abs(Math.sin(rect.rotation));

  // 计算 AABB 的半尺寸
  const halfExtentX = rect.halfWidth * cos + rect.halfHeight * sin;
  const halfExtentY = rect.halfWidth * sin + rect.halfHeight * cos;

  return {
    minX: rect.centerX - halfExtentX,
    minY: rect.centerY - halfExtentY,
    maxX: rect.centerX + halfExtentX,
    maxY: rect.centerY + halfExtentY
  };
}

// 从顶点集（多边形）计算 AABB
function computeAABBFromVertices(vertices: { x: number; y: number }[]): AABB2D {
  if (vertices.length === 0) {
    throw new Error('无法从空顶点集计算 AABB');
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const vertex of vertices) {
    minX = Math.min(minX, vertex.x);
    minY = Math.min(minY, vertex.y);
    maxX = Math.max(maxX, vertex.x);
    maxY = Math.max(maxY, vertex.y);
  }

  return { minX, minY, maxX, maxY };
}
```

### AABB 的优势与局限

**优势：**
- 极快的 O(1) 碰撞测试
- 实现和调试简单
- 内存效率高
- 适合粗检测阶段筛选

**局限：**
- 对旋转或非矩形对象拟合效果差
- 对角线对象的误判率高
- 无法检测接触点或精确碰撞法线
- 物体旋转时包围体尺寸会变化

---

## SAT：分离轴定理

分离轴定理为凸多边形之间的碰撞检测提供了一种稳健的方法。其核心思想是：如果存在一条轴，使得两个凸形状在该轴上的投影不重叠，则两个形状不相交。

### 数学基础

对于两个凸多边形 A 和 B：
- 如果存在分离轴，A 和 B **不碰撞**
- 如果**不存在**分离轴，A 和 B **碰撞**

潜在的分离轴是两个多边形所有边的法线。

```
投影到轴上：

形状 A          轴             投影
  ____            |               |====|
 /    \           |          [--A--]
/      \          |             [--B--]
\      /          |
 \____/           |
              重叠 = 投影的交集
```

### 2D 多边形的 SAT 实现

```typescript
interface Vector2 {
  x: number;
  y: number;
}

interface Polygon {
  vertices: Vector2[];
}

// 向量运算
const vec2 = {
  dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  },

  subtract(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x - b.x, y: a.y - b.y };
  },

  perpendicular(v: Vector2): Vector2 {
    return { x: -v.y, y: v.x };
  },

  normalize(v: Vector2): Vector2 {
    const len = Math.sqrt(v.x * v.x + v.y * v.y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
  },

  negate(v: Vector2): Vector2 {
    return { x: -v.x, y: -v.y };
  },

  scale(v: Vector2, s: number): Vector2 {
    return { x: v.x * s, y: v.y * s };
  }
};

// 获取所有边的法线（潜在分离轴）
function getPolygonAxes(polygon: Polygon): Vector2[] {
  const axes: Vector2[] = [];
  const vertices = polygon.vertices;
  const count = vertices.length;

  for (let i = 0; i < count; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % count];

    // 边向量
    const edge = vec2.subtract(v2, v1);

    // 法线垂直于边
    const normal = vec2.perpendicular(edge);

    // 归一化轴
    axes.push(vec2.normalize(normal));
  }

  return axes;
}

// 将多边形投影到轴上，返回最小值和最大值
function projectPolygon(polygon: Polygon, axis: Vector2): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;

  for (const vertex of polygon.vertices) {
    const projection = vec2.dot(vertex, axis);
    min = Math.min(min, projection);
    max = Math.max(max, projection);
  }

  return { min, max };
}

// 检查两个投影是否重叠
function projectionsOverlap(a: { min: number; max: number }, b: { min: number; max: number }): number {
  // 返回重叠量（负值表示有间隙）
  return Math.min(a.max - b.min, b.max - a.min);
}

// 获取多边形中心用于确定 MTV 方向
function getPolygonCenter(polygon: Polygon): Vector2 {
  let sumX = 0, sumY = 0;
  for (const vertex of polygon.vertices) {
    sumX += vertex.x;
    sumY += vertex.y;
  }
  const count = polygon.vertices.length;
  return { x: sumX / count, y: sumY / count };
}

interface SATResult {
  colliding: boolean;
  penetrationDepth: number;
  normal: Vector2;
  mtv: Vector2;
}

// 完整的 SAT 碰撞检测
function checkSATCollision(polygonA: Polygon, polygonB: Polygon): SATResult {
  // 获取所有潜在分离轴
  const axesA = getPolygonAxes(polygonA);
  const axesB = getPolygonAxes(polygonB);
  const allAxes = [...axesA, ...axesB];

  let minOverlap = Infinity;
  let minAxis: Vector2 | null = null;

  // 测试每个轴
  for (const axis of allAxes) {
    const projA = projectPolygon(polygonA, axis);
    const projB = projectPolygon(polygonB, axis);
    const overlap = projectionsOverlap(projA, projB);

    // 找到分离轴 - 无碰撞
    if (overlap <= 0) {
      return {
        colliding: false,
        penetrationDepth: 0,
        normal: { x: 0, y: 0 },
        mtv: { x: 0, y: 0 }
      };
    }

    // 跟踪最小重叠用于 MTV 计算
    if (overlap < minOverlap) {
      minOverlap = overlap;
      minAxis = axis;
    }
  }

  // 未找到分离轴 - 发生碰撞！
  if (!minAxis) {
    return {
      colliding: true,
      penetrationDepth: 0,
      normal: { x: 0, y: 0 },
      mtv: { x: 0, y: 0 }
    };
  }

  // 确保 MTV 从 A 指向 B
  const centerA = getPolygonCenter(polygonA);
  const centerB = getPolygonCenter(polygonB);
  const direction = vec2.subtract(centerB, centerA);

  if (vec2.dot(direction, minAxis) < 0) {
    minAxis = vec2.negate(minAxis);
  }

  return {
    colliding: true,
    penetrationDepth: minOverlap,
    normal: minAxis,
    mtv: vec2.scale(minAxis, minOverlap)
  };
}
```

### OBB（定向包围盒）的 SAT

OBB 是可以旋转的矩形。SAT 对 OBB 之间的测试特别高效：

```typescript
interface OBB {
  center: Vector2;
  halfExtents: Vector2; // 半宽和半高
  rotation: number; // 弧度
}

function getOBBAxes(obb: OBB): Vector2[] {
  const cos = Math.cos(obb.rotation);
  const sin = Math.sin(obb.rotation);

  // 旋转到世界空间的局部轴
  return [
    { x: cos, y: sin },     // X 轴（宽度方向）
    { x: -sin, y: cos }     // Y 轴（高度方向）
  ];
}

function getOBBVertices(obb: OBB): Vector2[] {
  const cos = Math.cos(obb.rotation);
  const sin = Math.sin(obb.rotation);

  // 局部角点位置
  const corners = [
    { x: -obb.halfExtents.x, y: -obb.halfExtents.y },
    { x: obb.halfExtents.x, y: -obb.halfExtents.y },
    { x: obb.halfExtents.x, y: obb.halfExtents.y },
    { x: -obb.halfExtents.x, y: obb.halfExtents.y }
  ];

  // 变换到世界空间
  return corners.map(corner => ({
    x: obb.center.x + corner.x * cos - corner.y * sin,
    y: obb.center.y + corner.x * sin + corner.y * cos
  }));
}

function checkOBBCollision(a: OBB, b: OBB): SATResult {
  const polygonA: Polygon = { vertices: getOBBVertices(a) };
  const polygonB: Polygon = { vertices: getOBBVertices(b) };

  // 对于 OBB，只需要测试 4 个轴（每个 OBB 2 个）
  const axesA = getOBBAxes(a);
  const axesB = getOBBAxes(b);
  const allAxes = [...axesA, ...axesB];

  let minOverlap = Infinity;
  let minAxis: Vector2 | null = null;

  for (const axis of allAxes) {
    const projA = projectPolygon(polygonA, axis);
    const projB = projectPolygon(polygonB, axis);
    const overlap = projectionsOverlap(projA, projB);

    if (overlap <= 0) {
      return {
        colliding: false,
        penetrationDepth: 0,
        normal: { x: 0, y: 0 },
        mtv: { x: 0, y: 0 }
      };
    }

    if (overlap < minOverlap) {
      minOverlap = overlap;
      minAxis = axis;
    }
  }

  if (!minAxis) {
    return {
      colliding: true,
      penetrationDepth: 0,
      normal: { x: 0, y: 0 },
      mtv: { x: 0, y: 0 }
    };
  }

  // 确保 MTV 从 A 指向 B
  const direction = vec2.subtract(b.center, a.center);
  if (vec2.dot(direction, minAxis) < 0) {
    minAxis = vec2.negate(minAxis);
  }

  return {
    colliding: true,
    penetrationDepth: minOverlap,
    normal: minAxis,
    mtv: vec2.scale(minAxis, minOverlap)
  };
}
```

### 圆形与多边形的 SAT

圆形需要特殊处理，因为它们有无限多的边：

```typescript
function checkCirclePolygonSAT(circle: Circle, polygon: Polygon): SATResult {
  // 获取多边形的轴
  const polygonAxes = getPolygonAxes(polygon);

  // 找到距离圆心最近的顶点（用于额外的轴）
  let closestVertex = polygon.vertices[0];
  let minDistSquared = Infinity;

  for (const vertex of polygon.vertices) {
    const dx = vertex.x - circle.x;
    const dy = vertex.y - circle.y;
    const distSquared = dx * dx + dy * dy;

    if (distSquared < minDistSquared) {
      minDistSquared = distSquared;
      closestVertex = vertex;
    }
  }

  // 额外的轴：从圆心到最近顶点
  const circleAxis = vec2.normalize({
    x: closestVertex.x - circle.x,
    y: closestVertex.y - circle.y
  });

  const allAxes = [...polygonAxes, circleAxis];

  let minOverlap = Infinity;
  let minAxis: Vector2 | null = null;

  for (const axis of allAxes) {
    // 投影圆形（圆心 +/- 沿轴方向的半径）
    const circleProjection = vec2.dot({ x: circle.x, y: circle.y }, axis);
    const circleProj = {
      min: circleProjection - circle.radius,
      max: circleProjection + circle.radius
    };

    // 投影多边形
    const polyProj = projectPolygon(polygon, axis);

    const overlap = projectionsOverlap(circleProj, polyProj);

    if (overlap <= 0) {
      return {
        colliding: false,
        penetrationDepth: 0,
        normal: { x: 0, y: 0 },
        mtv: { x: 0, y: 0 }
      };
    }

    if (overlap < minOverlap) {
      minOverlap = overlap;
      minAxis = axis;
    }
  }

  if (!minAxis) {
    return {
      colliding: true,
      penetrationDepth: 0,
      normal: { x: 0, y: 0 },
      mtv: { x: 0, y: 0 }
    };
  }

  // 确保 MTV 从圆形指向多边形
  const polyCenter = getPolygonCenter(polygon);
  const direction = { x: polyCenter.x - circle.x, y: polyCenter.y - circle.y };

  if (vec2.dot(direction, minAxis) < 0) {
    minAxis = vec2.negate(minAxis);
  }

  return {
    colliding: true,
    penetrationDepth: minOverlap,
    normal: minAxis,
    mtv: vec2.scale(minAxis, minOverlap)
  };
}
```

### 3D 中的 SAT

SAT 扩展到 3D 时需要额外的轴。对于两个凸多面体：
- 测试两个形状的面法线
- 测试所有边对的叉积

```typescript
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface OBB3D {
  center: Vector3;
  halfExtents: Vector3;
  axes: [Vector3, Vector3, Vector3]; // 正交轴
}

const vec3 = {
  dot(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  },

  cross(a: Vector3, b: Vector3): Vector3 {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  },

  lengthSquared(v: Vector3): number {
    return v.x * v.x + v.y * v.y + v.z * v.z;
  }
};

function checkOBB3DCollision(a: OBB3D, b: OBB3D): boolean {
  const EPSILON = 1e-6;

  // 平移向量（从 A 到 B）
  const t: Vector3 = {
    x: b.center.x - a.center.x,
    y: b.center.y - a.center.y,
    z: b.center.z - a.center.z
  };

  // 从 B 到 A 坐标系的旋转矩阵
  const R: number[][] = [];
  const AbsR: number[][] = [];

  for (let i = 0; i < 3; i++) {
    R[i] = [];
    AbsR[i] = [];
    for (let j = 0; j < 3; j++) {
      R[i][j] = vec3.dot(a.axes[i], b.axes[j]);
      AbsR[i][j] = Math.abs(R[i][j]) + EPSILON;
    }
  }

  const aExtents = [a.halfExtents.x, a.halfExtents.y, a.halfExtents.z];
  const bExtents = [b.halfExtents.x, b.halfExtents.y, b.halfExtents.z];

  // 测试轴 A0、A1、A2（A 的面法线）
  for (let i = 0; i < 3; i++) {
    const ra = aExtents[i];
    const rb = bExtents[0] * AbsR[i][0] + bExtents[1] * AbsR[i][1] + bExtents[2] * AbsR[i][2];
    const d = Math.abs(vec3.dot(t, a.axes[i]));
    if (d > ra + rb) return false;
  }

  // 测试轴 B0、B1、B2（B 的面法线）
  for (let i = 0; i < 3; i++) {
    const ra = aExtents[0] * AbsR[0][i] + aExtents[1] * AbsR[1][i] + aExtents[2] * AbsR[2][i];
    const rb = bExtents[i];
    const d = Math.abs(vec3.dot(t, b.axes[i]));
    if (d > ra + rb) return false;
  }

  // 测试 9 个叉积轴（Ai x Bj）
  // A0 x B0
  {
    const ra = aExtents[1] * AbsR[2][0] + aExtents[2] * AbsR[1][0];
    const rb = bExtents[1] * AbsR[0][2] + bExtents[2] * AbsR[0][1];
    const d = Math.abs(vec3.dot(t, a.axes[2]) * R[1][0] - vec3.dot(t, a.axes[1]) * R[2][0]);
    if (d > ra + rb) return false;
  }

  // ... 其他 8 个叉积轴测试类似 ...

  // 未找到分离轴 - 发生碰撞！
  return true;
}
```

### SAT 的优势与局限

**优势：**
- 适用于任何凸多边形
- 提供精确的碰撞法线和穿透深度
- 对顶点数较少的形状效率高
- 概念上易于理解

**局限：**
- 仅适用于凸形状（凹形状必须分解）
- 性能随顶点数增加而下降
- 边界情况可能导致数值问题
- 需要所有形状的多边形表示

---

## GJK：Gilbert-Johnson-Keerthi 算法

GJK 是一种优雅的算法，用于检测凸形状之间的碰撞。它通过判断原点是否位于两个形状的闵可夫斯基差内来工作。

### 理解闵可夫斯基差

形状 A 和 B 的闵可夫斯基差是：
```
A - B = { a - b | a 属于 A, b 属于 B }
```

关键洞察：**两个形状碰撞当且仅当原点在它们的闵可夫斯基差内部。**

```
形状 A        形状 B        闵可夫斯基差 A - B
  ____          ____            _________
 /    \        /    \          /         \
|      |  +   |      |   =    |           |
 \____/        \____/          \    O    /   <- 原点在内部 = 碰撞！
                                \_______/
```

### 支撑函数

GJK 使用支撑函数高效查询形状，而无需显式计算闵可夫斯基差：

```typescript
interface ConvexShape {
  // 返回形状上沿给定方向最远的点
  support(direction: Vector2): Vector2;
}

// 闵可夫斯基差的支撑函数：A - B
function minkowskiSupport(
  shapeA: ConvexShape,
  shapeB: ConvexShape,
  direction: Vector2
): Vector2 {
  // A 上沿方向最远的点
  const pointA = shapeA.support(direction);

  // B 上沿相反方向最远的点
  const pointB = shapeB.support(vec2.negate(direction));

  // 闵可夫斯基差的支撑点
  return vec2.subtract(pointA, pointB);
}
```

### 常见形状的支撑函数实现

```typescript
// 圆形支撑函数
class CircleShape implements ConvexShape {
  constructor(
    public center: Vector2,
    public radius: number
  ) {}

  support(direction: Vector2): Vector2 {
    const normalized = vec2.normalize(direction);
    return {
      x: this.center.x + normalized.x * this.radius,
      y: this.center.y + normalized.y * this.radius
    };
  }
}

// 多边形支撑函数
class PolygonShape implements ConvexShape {
  constructor(public vertices: Vector2[]) {}

  support(direction: Vector2): Vector2 {
    let maxDot = -Infinity;
    let maxVertex = this.vertices[0];

    for (const vertex of this.vertices) {
      const dot = vec2.dot(vertex, direction);
      if (dot > maxDot) {
        maxDot = dot;
        maxVertex = vertex;
      }
    }

    return maxVertex;
  }
}

// 矩形/OBB 支撑函数
class RectangleShape implements ConvexShape {
  constructor(
    public center: Vector2,
    public halfWidth: number,
    public halfHeight: number,
    public rotation: number = 0
  ) {}

  support(direction: Vector2): Vector2 {
    // 将方向旋转到局部空间
    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);

    const localDir: Vector2 = {
      x: direction.x * cos - direction.y * sin,
      y: direction.x * sin + direction.y * cos
    };

    // 在局部空间找支撑点（只需每个分量的符号）
    const localSupport: Vector2 = {
      x: localDir.x >= 0 ? this.halfWidth : -this.halfWidth,
      y: localDir.y >= 0 ? this.halfHeight : -this.halfHeight
    };

    // 旋转回世界空间
    const worldCos = Math.cos(this.rotation);
    const worldSin = Math.sin(this.rotation);

    return {
      x: this.center.x + localSupport.x * worldCos - localSupport.y * worldSin,
      y: this.center.y + localSupport.x * worldSin + localSupport.y * worldCos
    };
  }
}

// 胶囊体支撑函数
class CapsuleShape implements ConvexShape {
  constructor(
    public pointA: Vector2,
    public pointB: Vector2,
    public radius: number
  ) {}

  support(direction: Vector2): Vector2 {
    const normalized = vec2.normalize(direction);

    // 将方向投影到胶囊体轴上
    const axis = vec2.subtract(this.pointB, this.pointA);
    const dot = vec2.dot(axis, direction);

    // 根据投影选择端点
    const basePoint = dot >= 0 ? this.pointB : this.pointA;

    // 沿方向加上半径
    return {
      x: basePoint.x + normalized.x * this.radius,
      y: basePoint.y + normalized.y * this.radius
    };
  }
}
```

### GJK 算法实现

```typescript
interface GJKResult {
  colliding: boolean;
  simplex: Vector2[]; // 最终单纯形（用于 EPA）
}

// 三重积：(A x B) x C = B(A.C) - A(B.C)
function tripleProduct(a: Vector2, b: Vector2, c: Vector2): Vector2 {
  const ac = vec2.dot(a, c);
  const bc = vec2.dot(b, c);
  return { x: b.x * ac - a.x * bc, y: b.y * ac - a.y * bc };
}

function gjk(shapeA: ConvexShape, shapeB: ConvexShape): GJKResult {
  // 初始方向（任意）
  let direction: Vector2 = { x: 1, y: 0 };

  // 获取第一个支撑点
  const simplex: Vector2[] = [];
  const support = minkowskiSupport(shapeA, shapeB, direction);
  simplex.push(support);

  // 新方向朝向原点
  direction = vec2.negate(support);

  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    // 获取新的支撑点
    const newPoint = minkowskiSupport(shapeA, shapeB, direction);

    // 如果新点没有越过原点，则无碰撞
    if (vec2.dot(newPoint, direction) < 0) {
      return { colliding: false, simplex };
    }

    // 将点添加到单纯形
    simplex.push(newPoint);

    // 检查单纯形是否包含原点并获取新方向
    const result = handleSimplex(simplex);

    if (result.containsOrigin) {
      return { colliding: true, simplex };
    }

    direction = result.direction;
  }

  // 达到最大迭代次数，假设无碰撞
  return { colliding: false, simplex };
}

interface SimplexResult {
  containsOrigin: boolean;
  direction: Vector2;
}

function handleSimplex(simplex: Vector2[]): SimplexResult {
  switch (simplex.length) {
    case 2:
      return handleLine(simplex);
    case 3:
      return handleTriangle(simplex);
    default:
      throw new Error(`无效的单纯形大小：${simplex.length}`);
  }
}

function handleLine(simplex: Vector2[]): SimplexResult {
  const b = simplex[0];
  const a = simplex[1]; // 最近添加的

  const ab = vec2.subtract(b, a);
  const ao = vec2.negate(a);

  // 获取垂直于 AB、朝向原点的方向
  const perpendicular = tripleProduct(ab, ao, ab);

  // 如果垂直向量为零，原点在线上
  if (vec2.dot(perpendicular, perpendicular) < 1e-10) {
    // 返回垂直于 AB 的向量
    return {
      containsOrigin: false,
      direction: { x: -ab.y, y: ab.x }
    };
  }

  return {
    containsOrigin: false,
    direction: perpendicular
  };
}

function handleTriangle(simplex: Vector2[]): SimplexResult {
  const c = simplex[0];
  const b = simplex[1];
  const a = simplex[2]; // 最近添加的

  const ab = vec2.subtract(b, a);
  const ac = vec2.subtract(c, a);
  const ao = vec2.negate(a);

  // 获取垂直向量
  const abPerp = tripleProduct(ac, ab, ab); // 垂直于 AB，远离 C
  const acPerp = tripleProduct(ab, ac, ac); // 垂直于 AC，远离 B

  // 检查原点是否在 AB 边外侧
  if (vec2.dot(abPerp, ao) > 0) {
    // 移除 C（索引 0）
    simplex.splice(0, 1);
    return {
      containsOrigin: false,
      direction: abPerp
    };
  }

  // 检查原点是否在 AC 边外侧
  if (vec2.dot(acPerp, ao) > 0) {
    // 移除 B（索引 1）
    simplex.splice(1, 1);
    return {
      containsOrigin: false,
      direction: acPerp
    };
  }

  // 原点在三角形内部
  return {
    containsOrigin: true,
    direction: { x: 0, y: 0 }
  };
}
```

### EPA：扩展多胞形算法

EPA 扩展 GJK 以找到穿透深度和碰撞法线：

```typescript
interface EPAResult {
  penetrationDepth: number;
  normal: Vector2;
}

interface Edge {
  index: number;
  distance: number;
  normal: Vector2;
}

function findClosestEdge(simplex: Vector2[]): Edge {
  let minIndex = 0;
  let minDistance = Infinity;
  let minNormal: Vector2 = { x: 0, y: 0 };

  for (let i = 0; i < simplex.length; i++) {
    const j = (i + 1) % simplex.length;

    const a = simplex[i];
    const b = simplex[j];

    const edge = vec2.subtract(b, a);

    // 指向外部的法线（远离原点）
    let normal: Vector2 = { x: edge.y, y: -edge.x };
    normal = vec2.normalize(normal);

    // 原点到边的距离
    const distance = vec2.dot(a, normal);

    // 确保法线指向远离原点的方向
    if (distance < 0) {
      normal = vec2.negate(normal);
    }

    const absDist = Math.abs(distance);

    if (absDist < minDistance) {
      minDistance = absDist;
      minIndex = j;
      minNormal = normal;
    }
  }

  return {
    index: minIndex,
    distance: minDistance,
    normal: minNormal
  };
}

function epa(
  shapeA: ConvexShape,
  shapeB: ConvexShape,
  initialSimplex: Vector2[]
): EPAResult {
  const TOLERANCE = 0.0001;
  const MAX_ITERATIONS = 100;

  // 从 GJK 的单纯形开始（应该是三角形）
  const polytope = [...initialSimplex];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    // 找到距离原点最近的边
    const closest = findClosestEdge(polytope);

    // 沿边法线方向获取支撑点
    const support = minkowskiSupport(shapeA, shapeB, closest.normal);
    const supportDist = vec2.dot(support, closest.normal);

    // 检查是否已到达闵可夫斯基差的边界
    if (supportDist - closest.distance < TOLERANCE) {
      return {
        penetrationDepth: closest.distance,
        normal: closest.normal
      };
    }

    // 通过插入新支撑点扩展多胞形
    polytope.splice(closest.index, 0, support);
  }

  // 达到最大迭代次数，返回最佳结果
  const closest = findClosestEdge(polytope);
  return {
    penetrationDepth: closest.distance,
    normal: closest.normal
  };
}

// 完整的 GJK + EPA 碰撞检测
function gjkEpaCollision(shapeA: ConvexShape, shapeB: ConvexShape): SATResult {
  const gjkResult = gjk(shapeA, shapeB);

  if (!gjkResult.colliding) {
    return {
      colliding: false,
      penetrationDepth: 0,
      normal: { x: 0, y: 0 },
      mtv: { x: 0, y: 0 }
    };
  }

  // 使用 EPA 找到穿透深度和法线
  const epaResult = epa(shapeA, shapeB, gjkResult.simplex);

  return {
    colliding: true,
    penetrationDepth: epaResult.penetrationDepth,
    normal: epaResult.normal,
    mtv: vec2.scale(epaResult.normal, epaResult.penetrationDepth)
  };
}
```

### GJK 的优势与局限

**优势：**
- 通过支撑函数适用于任何凸形状
- 无需存储顶点列表
- 优雅高效
- 自然处理椭圆等连续形状
- 干净地扩展到 3D 及更高维度

**局限：**
- 仅适用于凸形状
- 需要 EPA 来获取穿透深度
- 正确实现较为复杂
- 边界情况存在数值精度问题

---

## 算法比较与选择指南

### 性能特征

| 算法 | 时间复杂度 | 空间复杂度 | 最佳用例 |
|------|-----------|-----------|---------|
| AABB | O(1) | O(1) | 粗检测阶段，简单形状 |
| SAT（多边形） | O(n) | O(n) | 凸多边形，<20 个顶点 |
| SAT（OBB） | O(1) | O(1) | 定向矩形 |
| GJK | O(n) 迭代 | O(1) | 任何凸形状 |
| GJK + EPA | 最坏 O(n^2) | O(n) | 需要完整碰撞信息 |

### 算法选择决策树

```
开始
  |
  v
需要粗检测阶段吗？
  |-- 是 --> 使用 AABB 空间分区
  |-- 否
      |
      v
  形状是简单矩形吗？
    |-- 是，轴对齐 --> 使用 AABB
    |-- 是，旋转的 --> 使用 SAT（OBB）
    |-- 否
        |
        v
    形状是顶点数 <15 的多边形吗？
      |-- 是 --> 使用 SAT
      |-- 否
          |
          v
      形状是圆形、椭圆或复杂形状吗？
        |-- 是 --> 使用 GJK
        |-- 否 --> 考虑分解 + SAT
```

### 混合方法示例

```typescript
class CollisionSystem {
  private spatialHash: SpatialHash;

  constructor(cellSize: number) {
    this.spatialHash = new SpatialHash(cellSize);
  }

  detectCollisions(objects: GameObject[]): CollisionPair[] {
    const pairs: CollisionPair[] = [];

    // 第 1 阶段：更新空间分区
    this.spatialHash.clear();
    for (const obj of objects) {
      this.spatialHash.insert(obj);
    }

    // 第 2 阶段：粗检测 - AABB 测试
    const candidates = this.spatialHash.getPotentialPairs();

    // 第 3 阶段：精检测 - 精确测试
    for (const [objA, objB] of candidates) {
      // 首先，便宜的 AABB 测试
      if (!checkAABBCollision(objA.aabb, objB.aabb)) {
        continue;
      }

      // 然后，适当的精检测测试
      const result = this.narrowPhaseTest(objA, objB);

      if (result.colliding) {
        pairs.push({
          objectA: objA,
          objectB: objB,
          ...result
        });
      }
    }

    return pairs;
  }

  private narrowPhaseTest(objA: GameObject, objB: GameObject): SATResult {
    const shapeA = objA.collisionShape;
    const shapeB = objB.collisionShape;

    // 根据形状类型选择算法
    if (shapeA.type === 'obb' && shapeB.type === 'obb') {
      return checkOBBCollision(shapeA as OBB, shapeB as OBB);
    }

    if (shapeA.type === 'polygon' && shapeB.type === 'polygon') {
      return checkSATCollision(
        { vertices: (shapeA as PolygonCollider).vertices },
        { vertices: (shapeB as PolygonCollider).vertices }
      );
    }

    // 对复杂形状回退到 GJK
    return gjkEpaCollision(
      shapeA as ConvexShape,
      shapeB as ConvexShape
    );
  }
}
```

---

## 优化技术

### 时间相干性

物体在帧之间通常不会移动很远。缓存结果并用作提示：

```typescript
class TemporalCoherenceOptimizer {
  private previousContacts: Map<string, CachedContact> = new Map();

  checkCollision(
    objA: GameObject,
    objB: GameObject
  ): SATResult {
    const key = this.getPairKey(objA.id, objB.id);
    const cached = this.previousContacts.get(key);

    if (cached) {
      // 使用缓存的分离轴作为第一个测试
      const projA = projectPolygon(objA.polygon, cached.separatingAxis);
      const projB = projectPolygon(objB.polygon, cached.separatingAxis);

      if (projA.max < projB.min || projB.max < projA.min) {
        // 仍然分离 - 提前退出
        return { colliding: false, penetrationDepth: 0, normal: { x: 0, y: 0 }, mtv: { x: 0, y: 0 } };
      }
    }

    // 完整碰撞测试
    const result = checkSATCollision(objA.polygon, objB.polygon);

    // 缓存结果
    if (!result.colliding) {
      this.previousContacts.set(key, {
        separatingAxis: result.normal,
        lastChecked: Date.now()
      });
    }

    return result;
  }

  private getPairKey(idA: string, idB: string): string {
    return idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
  }
}
```

---

## 常见陷阱与最佳实践

### 浮点数问题

```typescript
// 错误：直接相等比较
if (distance === 0) { /* ... */ }

// 正确：epsilon 比较
const EPSILON = 1e-6;
if (Math.abs(distance) < EPSILON) { /* ... */ }

// 正确：平方距离比较（避免 sqrt）
if (distanceSquared < radiusSum * radiusSum) { /* ... */ }
```

### 退化情况

```typescript
// 处理零长度向量
function safeNormalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len < 1e-10) {
    return { x: 1, y: 0 }; // 返回默认方向
  }
  return { x: v.x / len, y: v.y / len };
}

// 处理 GJK 中的共线点
function handleCollinearSimplex(simplex: Vector2[]): Vector2 {
  // 选择垂直方向
  const edge = vec2.subtract(simplex[1], simplex[0]);
  return vec2.normalize({ x: -edge.y, y: edge.x });
}
```

### 绕序一致性

```typescript
// 确保多边形顶点按一致的绕序排列
function ensureCounterClockwise(vertices: Vector2[]): Vector2[] {
  // 计算有符号面积
  let signedArea = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    signedArea += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y);
  }

  // 如果是顺时针（正面积），则反转
  if (signedArea > 0) {
    return [...vertices].reverse();
  }

  return vertices;
}
```

---

## 面试题

### Q1：什么时候选择 GJK 而不是 SAT？

**答案：**
- 当形状没有显式顶点表示时使用 GJK（圆形、椭圆）
- 当形状有很多顶点时使用 GJK（>15-20 个）
- 当实现通用物理引擎时使用 GJK
- 当形状是顶点数较少的简单多边形时使用 SAT
- 当需要更简单、更易调试的实现时使用 SAT

### Q2：如何处理大量对象的碰撞检测？

**答案：**
1. 使用空间分区（网格、四叉树、BVH）进行粗检测
2. 使用 AABB 测试快速排除非碰撞对
3. 仅对候选对应用精检测（SAT/GJK）
4. 实现时间相干性以重用上一帧数据
5. 考虑对独立碰撞测试进行多线程处理

### Q3：解释闵可夫斯基差及其在 GJK 中的作用。

**答案：**
闵可夫斯基差 A - B 包含从 B 中的点到 A 中的点的所有向量。如果原点在这个差集内部，意味着存在一个同时在 A 和 B 中的点——因此发生碰撞。GJK 通过构建一个接近或包含原点的单纯形来高效搜索原点是否在内部。

---

## 总结

碰撞检测对于交互式游戏和模拟至关重要。本文涵盖的三种算法服务于不同目的：

1. **AABB**：最快最简单，适合粗检测阶段和轴对齐形状
2. **SAT**：对凸多边形稳健，提供精确碰撞信息
3. **GJK**：最通用，通过支撑函数适用于任何凸形状

关键要点：
- 使用混合方法：粗检测阶段 AABB + 精检测阶段 SAT/GJK
- 根据形状复杂度和精度要求选择算法
- 仔细处理浮点精度
- 使用时间相干性和空间分区进行优化
- 用边界情况充分测试（接触、包含、快速移动）

深入理解这些算法使你能够为任何类型的游戏或模拟构建高效、稳健的物理系统。

---

## 延伸阅读

### 书籍
- "Real-Time Collision Detection" - Christer Ericson
- "Game Physics Engine Development" - Ian Millington
- "Physics for Game Developers" - David M. Bourg

### 论文
- "A Fast Procedure for Computing the Distance Between Complex Objects in Three-Dimensional Space" - Gilbert, Johnson, Keerthi
- "Collision Detection Using the GJK Algorithm" - Gino van den Bergen

### 在线资源
- [dyn4j GJK 教程](http://www.dyn4j.org/2010/04/gjk-gilbert-johnson-keerthi/)
- [Two-Bit Coding GJK 视频](https://www.youtube.com/watch?v=ajv46BSqcK4)
- [Box2D 源代码](https://github.com/erincatto/box2d)
