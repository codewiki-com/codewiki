---
title: "Collision Detection Algorithms: AABB, SAT, and GJK"
description: "Deep dive into game collision detection algorithms: AABB bounding boxes, Separating Axis Theorem, and Gilbert-Johnson-Keerthi algorithm with implementations"
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - collision detection
  - AABB
  - SAT
  - GJK
  - physics engine
  - game math
status: imported
origin: old/src/content/docs/gamedev/collision-algorithms.en.md
divergence: 0.217
issues: []
legacy:
  category: GameDev
  subcategory: Physics
  order: 50
  lastUpdated: 2026-01-22
---

## Introduction to Collision Detection

Collision detection is a fundamental component of any physics-based game or simulation. It determines when two or more objects intersect, enabling realistic physics responses, gameplay mechanics, and world interactions. This article provides an in-depth exploration of three essential collision detection algorithms: AABB (Axis-Aligned Bounding Box), SAT (Separating Axis Theorem), and GJK (Gilbert-Johnson-Keerthi).

### The Collision Detection Pipeline

Modern collision detection systems typically operate in two phases:

```
All Objects --> Broad Phase --> Candidate Pairs --> Narrow Phase --> Collision Pairs
                 (Fast)                              (Accurate)

Broad Phase: Quickly eliminate obviously non-colliding pairs
Narrow Phase: Perform precise collision tests on remaining pairs
```

The algorithms we cover serve different roles in this pipeline:
- **AABB**: Used in both broad phase (spatial partitioning) and narrow phase (simple shapes)
- **SAT**: Narrow phase algorithm for convex polygons
- **GJK**: Advanced narrow phase algorithm for any convex shapes

---

## AABB: Axis-Aligned Bounding Box

AABB is the simplest and fastest collision detection method. It uses rectangular boxes aligned with the coordinate axes to approximate object boundaries.

### Mathematical Foundation

An AABB is defined by two corner points: the minimum (bottom-left in 2D, or minimum corner in 3D) and maximum (top-right in 2D, or maximum corner in 3D).

```
2D AABB:
    min = (x_min, y_min)
    max = (x_max, y_max)

3D AABB:
    min = (x_min, y_min, z_min)
    max = (x_max, y_max, z_max)
```

### AABB Collision Test

Two AABBs collide if and only if they overlap on ALL axes:

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

// 2D AABB collision test - O(1) complexity
function checkAABB2DCollision(a: AABB2D, b: AABB2D): boolean {
  return (
    a.minX <= b.maxX &&
    a.maxX >= b.minX &&
    a.minY <= b.maxY &&
    a.maxY >= b.minY
  );
}

// 3D AABB collision test - O(1) complexity
function checkAABB3DCollision(a: AABB3D, b: AABB3D): boolean {
  return (
    a.minX <= b.maxX && a.maxX >= b.minX &&
    a.minY <= b.maxY && a.maxY >= b.minY &&
    a.minZ <= b.maxZ && a.maxZ >= b.minZ
  );
}

// Alternative representation using center and half-extents
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

### Computing Penetration Depth and MTV

The Minimum Translation Vector (MTV) is the smallest vector to separate two colliding AABBs:

```typescript
interface CollisionResult {
  colliding: boolean;
  penetrationDepth: number;
  normal: { x: number; y: number };
  mtv: { x: number; y: number };
}

function getAABBCollisionInfo(a: AABB2D, b: AABB2D): CollisionResult {
  // Calculate overlap on each axis
  const overlapX = Math.min(a.maxX - b.minX, b.maxX - a.minX);
  const overlapY = Math.min(a.maxY - b.minY, b.maxY - a.minY);

  // No collision if any overlap is negative
  if (overlapX <= 0 || overlapY <= 0) {
    return {
      colliding: false,
      penetrationDepth: 0,
      normal: { x: 0, y: 0 },
      mtv: { x: 0, y: 0 }
    };
  }

  // Find the axis with minimum penetration
  let normal: { x: number; y: number };
  let penetrationDepth: number;

  if (overlapX < overlapY) {
    penetrationDepth = overlapX;
    // Determine direction based on relative positions
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

### AABB vs Circle Collision

A common requirement is testing AABB against circles (or spheres in 3D):

```typescript
interface Circle {
  x: number;
  y: number;
  radius: number;
}

function checkAABBCircleCollision(aabb: AABB2D, circle: Circle): boolean {
  // Find the closest point on the AABB to the circle center
  const closestX = Math.max(aabb.minX, Math.min(circle.x, aabb.maxX));
  const closestY = Math.max(aabb.minY, Math.min(circle.y, aabb.maxY));

  // Calculate distance from circle center to closest point
  const distanceX = circle.x - closestX;
  const distanceY = circle.y - closestY;
  const distanceSquared = distanceX * distanceX + distanceY * distanceY;

  // Compare squared values to avoid expensive sqrt
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

  // Handle case where circle center is inside AABB
  if (distance === 0) {
    // Push out in the direction of least penetration
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

### Dynamic AABB for Moving Objects

When objects rotate, their AABB needs to be recalculated:

```typescript
interface RotatedRectangle {
  centerX: number;
  centerY: number;
  halfWidth: number;
  halfHeight: number;
  rotation: number; // radians
}

function computeAABBFromRotatedRect(rect: RotatedRectangle): AABB2D {
  const cos = Math.abs(Math.cos(rect.rotation));
  const sin = Math.abs(Math.sin(rect.rotation));

  // Compute the AABB half-extents
  const halfExtentX = rect.halfWidth * cos + rect.halfHeight * sin;
  const halfExtentY = rect.halfWidth * sin + rect.halfHeight * cos;

  return {
    minX: rect.centerX - halfExtentX,
    minY: rect.centerY - halfExtentY,
    maxX: rect.centerX + halfExtentX,
    maxY: rect.centerY + halfExtentY
  };
}

// Compute AABB from a set of vertices (polygon)
function computeAABBFromVertices(vertices: { x: number; y: number }[]): AABB2D {
  if (vertices.length === 0) {
    throw new Error('Cannot compute AABB from empty vertex set');
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

### AABB Advantages and Limitations

**Advantages:**
- Extremely fast O(1) collision test
- Simple to implement and debug
- Memory efficient
- Excellent for broad-phase culling

**Limitations:**
- Poor fit for rotated or non-rectangular objects
- High false positive rate for diagonal objects
- Cannot detect contact points or accurate collision normals
- Bounding volume changes size when objects rotate

---

## SAT: Separating Axis Theorem

The Separating Axis Theorem provides a robust method for detecting collisions between convex polygons. It states: two convex shapes do not intersect if and only if there exists an axis onto which their projections do not overlap.

### Mathematical Foundation

For two convex polygons A and B:
- If there exists a separating axis, A and B do NOT collide
- If NO separating axis exists, A and B DO collide

The potential separating axes are the normals to each edge of both polygons.

```
Projection onto an axis:

Shape A         Axis            Projection
  ____            |               |====|
 /    \           |          [--A--]
/      \          |             [--B--]
\      /          |
 \____/           |
              overlap = intersection of projections
```

### SAT Implementation for 2D Polygons

```typescript
interface Vector2 {
  x: number;
  y: number;
}

interface Polygon {
  vertices: Vector2[];
}

// Vector operations
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

// Get all edge normals (potential separating axes)
function getPolygonAxes(polygon: Polygon): Vector2[] {
  const axes: Vector2[] = [];
  const vertices = polygon.vertices;
  const count = vertices.length;

  for (let i = 0; i < count; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % count];

    // Edge vector
    const edge = vec2.subtract(v2, v1);

    // Normal is perpendicular to edge
    const normal = vec2.perpendicular(edge);

    // Normalize the axis
    axes.push(vec2.normalize(normal));
  }

  return axes;
}

// Project polygon onto axis, returning min and max values
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

// Check if two projections overlap
function projectionsOverlap(a: { min: number; max: number }, b: { min: number; max: number }): number {
  // Returns overlap amount (negative means gap)
  return Math.min(a.max - b.min, b.max - a.min);
}

// Get polygon center for determining MTV direction
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

// Full SAT collision detection
function checkSATCollision(polygonA: Polygon, polygonB: Polygon): SATResult {
  // Get all potential separating axes
  const axesA = getPolygonAxes(polygonA);
  const axesB = getPolygonAxes(polygonB);
  const allAxes = [...axesA, ...axesB];

  let minOverlap = Infinity;
  let minAxis: Vector2 | null = null;

  // Test each axis
  for (const axis of allAxes) {
    const projA = projectPolygon(polygonA, axis);
    const projB = projectPolygon(polygonB, axis);
    const overlap = projectionsOverlap(projA, projB);

    // Found a separating axis - no collision
    if (overlap <= 0) {
      return {
        colliding: false,
        penetrationDepth: 0,
        normal: { x: 0, y: 0 },
        mtv: { x: 0, y: 0 }
      };
    }

    // Track minimum overlap for MTV calculation
    if (overlap < minOverlap) {
      minOverlap = overlap;
      minAxis = axis;
    }
  }

  // No separating axis found - collision!
  if (!minAxis) {
    return {
      colliding: true,
      penetrationDepth: 0,
      normal: { x: 0, y: 0 },
      mtv: { x: 0, y: 0 }
    };
  }

  // Ensure MTV points from A to B
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

### SAT for OBB (Oriented Bounding Box)

OBBs are rectangles that can be rotated. SAT is particularly efficient for OBB vs OBB tests:

```typescript
interface OBB {
  center: Vector2;
  halfExtents: Vector2; // half width and half height
  rotation: number; // radians
}

function getOBBAxes(obb: OBB): Vector2[] {
  const cos = Math.cos(obb.rotation);
  const sin = Math.sin(obb.rotation);

  // Local axes rotated to world space
  return [
    { x: cos, y: sin },     // X-axis (width direction)
    { x: -sin, y: cos }     // Y-axis (height direction)
  ];
}

function getOBBVertices(obb: OBB): Vector2[] {
  const cos = Math.cos(obb.rotation);
  const sin = Math.sin(obb.rotation);

  // Local corner positions
  const corners = [
    { x: -obb.halfExtents.x, y: -obb.halfExtents.y },
    { x: obb.halfExtents.x, y: -obb.halfExtents.y },
    { x: obb.halfExtents.x, y: obb.halfExtents.y },
    { x: -obb.halfExtents.x, y: obb.halfExtents.y }
  ];

  // Transform to world space
  return corners.map(corner => ({
    x: obb.center.x + corner.x * cos - corner.y * sin,
    y: obb.center.y + corner.x * sin + corner.y * cos
  }));
}

function checkOBBCollision(a: OBB, b: OBB): SATResult {
  const polygonA: Polygon = { vertices: getOBBVertices(a) };
  const polygonB: Polygon = { vertices: getOBBVertices(b) };

  // For OBBs, we only need to test 4 axes (2 from each OBB)
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

  // Ensure MTV points from A to B
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

### SAT for Circle vs Polygon

Circles require special handling since they have infinite edges:

```typescript
function checkCirclePolygonSAT(circle: Circle, polygon: Polygon): SATResult {
  // Get polygon axes
  const polygonAxes = getPolygonAxes(polygon);

  // Find closest vertex to circle center (for additional axis)
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

  // Additional axis: from circle center to closest vertex
  const circleAxis = vec2.normalize({
    x: closestVertex.x - circle.x,
    y: closestVertex.y - circle.y
  });

  const allAxes = [...polygonAxes, circleAxis];

  let minOverlap = Infinity;
  let minAxis: Vector2 | null = null;

  for (const axis of allAxes) {
    // Project circle (center +/- radius along axis)
    const circleProjection = vec2.dot({ x: circle.x, y: circle.y }, axis);
    const circleProj = {
      min: circleProjection - circle.radius,
      max: circleProjection + circle.radius
    };

    // Project polygon
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

  // Ensure MTV points from circle to polygon
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

### SAT in 3D

SAT extends to 3D with additional axes. For two convex polyhedra:
- Test face normals of both shapes
- Test cross products of all edge pairs

```typescript
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface OBB3D {
  center: Vector3;
  halfExtents: Vector3;
  axes: [Vector3, Vector3, Vector3]; // Orthonormal axes
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

  // Translation vector (from A to B)
  const t: Vector3 = {
    x: b.center.x - a.center.x,
    y: b.center.y - a.center.y,
    z: b.center.z - a.center.z
  };

  // Rotation matrix from B to A coordinate system
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

  // Test axes A0, A1, A2 (face normals of A)
  for (let i = 0; i < 3; i++) {
    const ra = aExtents[i];
    const rb = bExtents[0] * AbsR[i][0] + bExtents[1] * AbsR[i][1] + bExtents[2] * AbsR[i][2];
    const d = Math.abs(vec3.dot(t, a.axes[i]));
    if (d > ra + rb) return false;
  }

  // Test axes B0, B1, B2 (face normals of B)
  for (let i = 0; i < 3; i++) {
    const ra = aExtents[0] * AbsR[0][i] + aExtents[1] * AbsR[1][i] + aExtents[2] * AbsR[2][i];
    const rb = bExtents[i];
    const d = Math.abs(vec3.dot(t, b.axes[i]));
    if (d > ra + rb) return false;
  }

  // Test 9 cross-product axes (Ai x Bj)
  // A0 x B0
  {
    const ra = aExtents[1] * AbsR[2][0] + aExtents[2] * AbsR[1][0];
    const rb = bExtents[1] * AbsR[0][2] + bExtents[2] * AbsR[0][1];
    const d = Math.abs(vec3.dot(t, a.axes[2]) * R[1][0] - vec3.dot(t, a.axes[1]) * R[2][0]);
    if (d > ra + rb) return false;
  }

  // A0 x B1
  {
    const ra = aExtents[1] * AbsR[2][1] + aExtents[2] * AbsR[1][1];
    const rb = bExtents[0] * AbsR[0][2] + bExtents[2] * AbsR[0][0];
    const d = Math.abs(vec3.dot(t, a.axes[2]) * R[1][1] - vec3.dot(t, a.axes[1]) * R[2][1]);
    if (d > ra + rb) return false;
  }

  // A0 x B2
  {
    const ra = aExtents[1] * AbsR[2][2] + aExtents[2] * AbsR[1][2];
    const rb = bExtents[0] * AbsR[0][1] + bExtents[1] * AbsR[0][0];
    const d = Math.abs(vec3.dot(t, a.axes[2]) * R[1][2] - vec3.dot(t, a.axes[1]) * R[2][2]);
    if (d > ra + rb) return false;
  }

  // A1 x B0
  {
    const ra = aExtents[0] * AbsR[2][0] + aExtents[2] * AbsR[0][0];
    const rb = bExtents[1] * AbsR[1][2] + bExtents[2] * AbsR[1][1];
    const d = Math.abs(vec3.dot(t, a.axes[0]) * R[2][0] - vec3.dot(t, a.axes[2]) * R[0][0]);
    if (d > ra + rb) return false;
  }

  // A1 x B1
  {
    const ra = aExtents[0] * AbsR[2][1] + aExtents[2] * AbsR[0][1];
    const rb = bExtents[0] * AbsR[1][2] + bExtents[2] * AbsR[1][0];
    const d = Math.abs(vec3.dot(t, a.axes[0]) * R[2][1] - vec3.dot(t, a.axes[2]) * R[0][1]);
    if (d > ra + rb) return false;
  }

  // A1 x B2
  {
    const ra = aExtents[0] * AbsR[2][2] + aExtents[2] * AbsR[0][2];
    const rb = bExtents[0] * AbsR[1][1] + bExtents[1] * AbsR[1][0];
    const d = Math.abs(vec3.dot(t, a.axes[0]) * R[2][2] - vec3.dot(t, a.axes[2]) * R[0][2]);
    if (d > ra + rb) return false;
  }

  // A2 x B0
  {
    const ra = aExtents[0] * AbsR[1][0] + aExtents[1] * AbsR[0][0];
    const rb = bExtents[1] * AbsR[2][2] + bExtents[2] * AbsR[2][1];
    const d = Math.abs(vec3.dot(t, a.axes[1]) * R[0][0] - vec3.dot(t, a.axes[0]) * R[1][0]);
    if (d > ra + rb) return false;
  }

  // A2 x B1
  {
    const ra = aExtents[0] * AbsR[1][1] + aExtents[1] * AbsR[0][1];
    const rb = bExtents[0] * AbsR[2][2] + bExtents[2] * AbsR[2][0];
    const d = Math.abs(vec3.dot(t, a.axes[1]) * R[0][1] - vec3.dot(t, a.axes[0]) * R[1][1]);
    if (d > ra + rb) return false;
  }

  // A2 x B2
  {
    const ra = aExtents[0] * AbsR[1][2] + aExtents[1] * AbsR[0][2];
    const rb = bExtents[0] * AbsR[2][1] + bExtents[1] * AbsR[2][0];
    const d = Math.abs(vec3.dot(t, a.axes[1]) * R[0][2] - vec3.dot(t, a.axes[0]) * R[1][2]);
    if (d > ra + rb) return false;
  }

  // No separating axis found - collision!
  return true;
}
```

### SAT Advantages and Limitations

**Advantages:**
- Works for any convex polygon
- Provides accurate collision normal and penetration depth
- Efficient for shapes with few vertices
- Easy to understand conceptually

**Limitations:**
- Only works for convex shapes (concave shapes must be decomposed)
- Performance degrades with vertex count
- Edge cases can cause numerical issues
- Requires polygon representation of all shapes

---

## GJK: Gilbert-Johnson-Keerthi Algorithm

GJK is an elegant algorithm for detecting collisions between convex shapes. It works by determining if the origin lies within the Minkowski Difference of two shapes.

### Understanding Minkowski Difference

The Minkowski Difference of shapes A and B is:
```
A - B = { a - b | a in A, b in B }
```

Key insight: **Two shapes collide if and only if the origin is inside their Minkowski Difference.**

```
Shape A       Shape B       Minkowski Difference A - B
  ____          ____            _________
 /    \        /    \          /         \
|      |  +   |      |   =    |           |
 \____/        \____/          \    O    /   <- Origin inside = collision!
                                \_______/
```

### Support Function

GJK uses support functions to efficiently query shapes without explicitly computing the Minkowski Difference:

```typescript
interface ConvexShape {
  // Returns the point on the shape furthest in the given direction
  support(direction: Vector2): Vector2;
}

// Support function for Minkowski Difference: A - B
function minkowskiSupport(
  shapeA: ConvexShape,
  shapeB: ConvexShape,
  direction: Vector2
): Vector2 {
  // Furthest point on A in direction
  const pointA = shapeA.support(direction);

  // Furthest point on B in opposite direction
  const pointB = shapeB.support(vec2.negate(direction));

  // Support point of Minkowski Difference
  return vec2.subtract(pointA, pointB);
}
```

### Implementing Support Functions for Common Shapes

```typescript
// Circle support function
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

// Polygon support function
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

// Rectangle/OBB support function
class RectangleShape implements ConvexShape {
  constructor(
    public center: Vector2,
    public halfWidth: number,
    public halfHeight: number,
    public rotation: number = 0
  ) {}

  support(direction: Vector2): Vector2 {
    // Rotate direction to local space
    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);

    const localDir: Vector2 = {
      x: direction.x * cos - direction.y * sin,
      y: direction.x * sin + direction.y * cos
    };

    // Find support in local space (just sign of each component)
    const localSupport: Vector2 = {
      x: localDir.x >= 0 ? this.halfWidth : -this.halfWidth,
      y: localDir.y >= 0 ? this.halfHeight : -this.halfHeight
    };

    // Rotate back to world space
    const worldCos = Math.cos(this.rotation);
    const worldSin = Math.sin(this.rotation);

    return {
      x: this.center.x + localSupport.x * worldCos - localSupport.y * worldSin,
      y: this.center.y + localSupport.x * worldSin + localSupport.y * worldCos
    };
  }
}

// Capsule support function
class CapsuleShape implements ConvexShape {
  constructor(
    public pointA: Vector2,
    public pointB: Vector2,
    public radius: number
  ) {}

  support(direction: Vector2): Vector2 {
    const normalized = vec2.normalize(direction);

    // Project direction onto capsule axis
    const axis = vec2.subtract(this.pointB, this.pointA);
    const dot = vec2.dot(axis, direction);

    // Choose endpoint based on projection
    const basePoint = dot >= 0 ? this.pointB : this.pointA;

    // Add radius in direction
    return {
      x: basePoint.x + normalized.x * this.radius,
      y: basePoint.y + normalized.y * this.radius
    };
  }
}
```

### GJK Algorithm Implementation

```typescript
interface GJKResult {
  colliding: boolean;
  simplex: Vector2[]; // Final simplex (for EPA)
}

// Triple product: (A x B) x C = B(A.C) - A(B.C)
function tripleProduct(a: Vector2, b: Vector2, c: Vector2): Vector2 {
  const ac = vec2.dot(a, c);
  const bc = vec2.dot(b, c);
  return { x: b.x * ac - a.x * bc, y: b.y * ac - a.y * bc };
}

function gjk(shapeA: ConvexShape, shapeB: ConvexShape): GJKResult {
  // Initial direction (arbitrary)
  let direction: Vector2 = { x: 1, y: 0 };

  // Get first support point
  const simplex: Vector2[] = [];
  const support = minkowskiSupport(shapeA, shapeB, direction);
  simplex.push(support);

  // New direction towards the origin
  direction = vec2.negate(support);

  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    // Get new support point
    const newPoint = minkowskiSupport(shapeA, shapeB, direction);

    // If new point didn't pass the origin, no collision
    if (vec2.dot(newPoint, direction) < 0) {
      return { colliding: false, simplex };
    }

    // Add point to simplex
    simplex.push(newPoint);

    // Check if simplex contains origin and get new direction
    const result = handleSimplex(simplex);

    if (result.containsOrigin) {
      return { colliding: true, simplex };
    }

    direction = result.direction;
  }

  // Max iterations reached, assume no collision
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
      throw new Error(`Invalid simplex size: ${simplex.length}`);
  }
}

function handleLine(simplex: Vector2[]): SimplexResult {
  const b = simplex[0];
  const a = simplex[1]; // Most recently added

  const ab = vec2.subtract(b, a);
  const ao = vec2.negate(a);

  // Get direction perpendicular to AB, towards origin
  const perpendicular = tripleProduct(ab, ao, ab);

  // If perpendicular is zero, origin is on the line
  if (vec2.dot(perpendicular, perpendicular) < 1e-10) {
    // Return perpendicular to AB
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
  const a = simplex[2]; // Most recently added

  const ab = vec2.subtract(b, a);
  const ac = vec2.subtract(c, a);
  const ao = vec2.negate(a);

  // Get perpendiculars
  const abPerp = tripleProduct(ac, ab, ab); // Perpendicular to AB, away from C
  const acPerp = tripleProduct(ab, ac, ac); // Perpendicular to AC, away from B

  // Check if origin is outside AB edge
  if (vec2.dot(abPerp, ao) > 0) {
    // Remove C (index 0)
    simplex.splice(0, 1);
    return {
      containsOrigin: false,
      direction: abPerp
    };
  }

  // Check if origin is outside AC edge
  if (vec2.dot(acPerp, ao) > 0) {
    // Remove B (index 1)
    simplex.splice(1, 1);
    return {
      containsOrigin: false,
      direction: acPerp
    };
  }

  // Origin is inside the triangle
  return {
    containsOrigin: true,
    direction: { x: 0, y: 0 }
  };
}
```

### EPA: Expanding Polytope Algorithm

EPA extends GJK to find penetration depth and collision normal:

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

    // Normal pointing outward (away from origin)
    let normal: Vector2 = { x: edge.y, y: -edge.x };
    normal = vec2.normalize(normal);

    // Distance from origin to edge
    const distance = vec2.dot(a, normal);

    // Ensure normal points away from origin
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

  // Start with the simplex from GJK (should be a triangle)
  const polytope = [...initialSimplex];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    // Find the closest edge to the origin
    const closest = findClosestEdge(polytope);

    // Get support point in the direction of the edge normal
    const support = minkowskiSupport(shapeA, shapeB, closest.normal);
    const supportDist = vec2.dot(support, closest.normal);

    // Check if we've reached the edge of the Minkowski Difference
    if (supportDist - closest.distance < TOLERANCE) {
      return {
        penetrationDepth: closest.distance,
        normal: closest.normal
      };
    }

    // Expand the polytope by inserting the new support point
    polytope.splice(closest.index, 0, support);
  }

  // Max iterations reached, return best result
  const closest = findClosestEdge(polytope);
  return {
    penetrationDepth: closest.distance,
    normal: closest.normal
  };
}

// Complete GJK + EPA collision detection
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

  // Use EPA to find penetration depth and normal
  const epaResult = epa(shapeA, shapeB, gjkResult.simplex);

  return {
    colliding: true,
    penetrationDepth: epaResult.penetrationDepth,
    normal: epaResult.normal,
    mtv: vec2.scale(epaResult.normal, epaResult.penetrationDepth)
  };
}
```

### GJK in 3D

GJK naturally extends to 3D with modified simplex handling:

```typescript
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface ConvexShape3D {
  support(direction: Vector3): Vector3;
}

const vec3Extended = {
  ...vec3,

  subtract(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  },

  negate(v: Vector3): Vector3 {
    return { x: -v.x, y: -v.y, z: -v.z };
  },

  scale(v: Vector3, s: number): Vector3 {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
  },

  normalize(v: Vector3): Vector3 {
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (len === 0) return { x: 0, y: 0, z: 0 };
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  },

  tripleProduct(a: Vector3, b: Vector3, c: Vector3): Vector3 {
    // (A x B) x C = B(A.C) - A(B.C)
    const ac = vec3.dot(a, c);
    const bc = vec3.dot(b, c);
    return {
      x: b.x * ac - a.x * bc,
      y: b.y * ac - a.y * bc,
      z: b.z * ac - a.z * bc
    };
  }
};

function minkowskiSupport3D(
  shapeA: ConvexShape3D,
  shapeB: ConvexShape3D,
  direction: Vector3
): Vector3 {
  const pointA = shapeA.support(direction);
  const pointB = shapeB.support(vec3Extended.negate(direction));
  return vec3Extended.subtract(pointA, pointB);
}

// 3D GJK requires handling tetrahedron simplices
function gjk3D(shapeA: ConvexShape3D, shapeB: ConvexShape3D): GJKResult {
  let direction: Vector3 = { x: 1, y: 0, z: 0 };
  const simplex: Vector3[] = [];

  const support = minkowskiSupport3D(shapeA, shapeB, direction);
  simplex.push(support);

  direction = vec3Extended.negate(support);

  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    const newPoint = minkowskiSupport3D(shapeA, shapeB, direction);

    if (vec3.dot(newPoint, direction) < 0) {
      return { colliding: false, simplex: [] };
    }

    simplex.push(newPoint);

    const result = handleSimplex3D(simplex);

    if (result.containsOrigin) {
      return { colliding: true, simplex: simplex as any };
    }

    direction = result.direction as Vector3;
  }

  return { colliding: false, simplex: [] };
}

function handleSimplex3D(simplex: Vector3[]): { containsOrigin: boolean; direction: Vector3 } {
  switch (simplex.length) {
    case 2:
      return handleLine3D(simplex);
    case 3:
      return handleTriangle3D(simplex);
    case 4:
      return handleTetrahedron(simplex);
    default:
      throw new Error(`Invalid simplex size: ${simplex.length}`);
  }
}

function handleLine3D(simplex: Vector3[]): { containsOrigin: boolean; direction: Vector3 } {
  const b = simplex[0];
  const a = simplex[1];

  const ab = vec3Extended.subtract(b, a);
  const ao = vec3Extended.negate(a);

  const direction = vec3Extended.tripleProduct(ab, ao, ab);

  return {
    containsOrigin: false,
    direction: direction
  };
}

function handleTriangle3D(simplex: Vector3[]): { containsOrigin: boolean; direction: Vector3 } {
  const c = simplex[0];
  const b = simplex[1];
  const a = simplex[2];

  const ab = vec3Extended.subtract(b, a);
  const ac = vec3Extended.subtract(c, a);
  const ao = vec3Extended.negate(a);

  const abc = vec3.cross(ab, ac); // Triangle normal

  // Check which side of each edge the origin is on
  if (vec3.dot(vec3.cross(abc, ac), ao) > 0) {
    if (vec3.dot(ac, ao) > 0) {
      simplex.splice(1, 1); // Remove B
      return {
        containsOrigin: false,
        direction: vec3Extended.tripleProduct(ac, ao, ac)
      };
    } else {
      return handleLine3D([b, a]);
    }
  } else {
    if (vec3.dot(vec3.cross(ab, abc), ao) > 0) {
      return handleLine3D([b, a]);
    } else {
      if (vec3.dot(abc, ao) > 0) {
        return {
          containsOrigin: false,
          direction: abc
        };
      } else {
        // Swap B and C
        [simplex[0], simplex[1]] = [simplex[1], simplex[0]];
        return {
          containsOrigin: false,
          direction: vec3Extended.negate(abc)
        };
      }
    }
  }
}

function handleTetrahedron(simplex: Vector3[]): { containsOrigin: boolean; direction: Vector3 } {
  const d = simplex[0];
  const c = simplex[1];
  const b = simplex[2];
  const a = simplex[3];

  const ab = vec3Extended.subtract(b, a);
  const ac = vec3Extended.subtract(c, a);
  const ad = vec3Extended.subtract(d, a);
  const ao = vec3Extended.negate(a);

  const abc = vec3.cross(ab, ac);
  const acd = vec3.cross(ac, ad);
  const adb = vec3.cross(ad, ab);

  // Check each face
  if (vec3.dot(abc, ao) > 0) {
    simplex.splice(0, 1); // Remove D
    return handleTriangle3D(simplex);
  }

  if (vec3.dot(acd, ao) > 0) {
    simplex.splice(2, 1); // Remove B
    return handleTriangle3D(simplex);
  }

  if (vec3.dot(adb, ao) > 0) {
    simplex.splice(1, 1); // Remove C
    [simplex[0], simplex[1]] = [simplex[1], simplex[0]]; // Swap to maintain winding
    return handleTriangle3D(simplex);
  }

  // Origin is inside the tetrahedron
  return {
    containsOrigin: true,
    direction: { x: 0, y: 0, z: 0 }
  };
}
```

### GJK Advantages and Limitations

**Advantages:**
- Works with any convex shape via support functions
- No need to store vertex lists
- Elegant and efficient
- Naturally handles continuous shapes like ellipsoids
- Extends cleanly to 3D and higher dimensions

**Limitations:**
- Only works for convex shapes
- Requires EPA for penetration depth
- More complex to implement correctly
- Numerical precision issues at edge cases

---

## Algorithm Comparison and Selection Guide

### Performance Characteristics

| Algorithm | Time Complexity | Space Complexity | Best Use Case |
|-----------|-----------------|------------------|---------------|
| AABB | O(1) | O(1) | Broad phase, simple shapes |
| SAT (Polygon) | O(n) | O(n) | Convex polygons, <20 vertices |
| SAT (OBB) | O(1) | O(1) | Oriented rectangles |
| GJK | O(n) iterative | O(1) | Any convex shapes |
| GJK + EPA | O(n^2) worst | O(n) | Full collision info needed |

### Decision Tree for Algorithm Selection

```
Start
  |
  v
Is broad phase needed?
  |-- Yes --> Use AABB spatial partitioning
  |-- No
      |
      v
  Are shapes simple rectangles?
    |-- Yes, axis-aligned --> Use AABB
    |-- Yes, rotated --> Use SAT (OBB)
    |-- No
        |
        v
    Are shapes polygons with <15 vertices?
      |-- Yes --> Use SAT
      |-- No
          |
          v
      Are shapes circles, ellipses, or complex?
        |-- Yes --> Use GJK
        |-- No --> Consider decomposition + SAT
```

### Hybrid Approach Example

```typescript
class CollisionSystem {
  private spatialHash: SpatialHash;

  constructor(cellSize: number) {
    this.spatialHash = new SpatialHash(cellSize);
  }

  detectCollisions(objects: GameObject[]): CollisionPair[] {
    const pairs: CollisionPair[] = [];

    // Phase 1: Update spatial partitioning
    this.spatialHash.clear();
    for (const obj of objects) {
      this.spatialHash.insert(obj);
    }

    // Phase 2: Broad phase - AABB tests
    const candidates = this.spatialHash.getPotentialPairs();

    // Phase 3: Narrow phase - precise tests
    for (const [objA, objB] of candidates) {
      // First, cheap AABB test
      if (!checkAABBCollision(objA.aabb, objB.aabb)) {
        continue;
      }

      // Then, appropriate narrow phase test
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

    // Choose algorithm based on shape types
    if (shapeA.type === 'obb' && shapeB.type === 'obb') {
      return checkOBBCollision(shapeA as OBB, shapeB as OBB);
    }

    if (shapeA.type === 'polygon' && shapeB.type === 'polygon') {
      return checkSATCollision(
        { vertices: (shapeA as PolygonCollider).vertices },
        { vertices: (shapeB as PolygonCollider).vertices }
      );
    }

    // Fall back to GJK for complex shapes
    return gjkEpaCollision(
      shapeA as ConvexShape,
      shapeB as ConvexShape
    );
  }
}
```

---

## Optimization Techniques

### Temporal Coherence

Objects usually don't move far between frames. Cache results and use them as hints:

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
      // Use cached separating axis as first test
      const projA = projectPolygon(objA.polygon, cached.separatingAxis);
      const projB = projectPolygon(objB.polygon, cached.separatingAxis);

      if (projA.max < projB.min || projB.max < projA.min) {
        // Still separated - early out
        return { colliding: false, penetrationDepth: 0, normal: { x: 0, y: 0 }, mtv: { x: 0, y: 0 } };
      }
    }

    // Full collision test
    const result = checkSATCollision(objA.polygon, objB.polygon);

    // Cache result
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

### SIMD Optimization

For batch processing many collision tests:

```typescript
// Pseudo-code for SIMD AABB batch testing
class SIMDCollisionTester {
  // Process 4 AABB pairs at once using SIMD
  testBatch4(
    aMinX: Float32Array, // 4 values
    aMinY: Float32Array,
    aMaxX: Float32Array,
    aMaxY: Float32Array,
    bMinX: Float32Array,
    bMinY: Float32Array,
    bMaxX: Float32Array,
    bMaxY: Float32Array
  ): boolean[] {
    // In real implementation, use WASM SIMD or WebGL compute
    const results: boolean[] = [];

    for (let i = 0; i < 4; i++) {
      results.push(
        aMinX[i] <= bMaxX[i] &&
        aMaxX[i] >= bMinX[i] &&
        aMinY[i] <= bMaxY[i] &&
        aMaxY[i] >= bMinY[i]
      );
    }

    return results;
  }
}
```

---

## Common Pitfalls and Best Practices

### Floating Point Issues

```typescript
// Bad: Direct equality comparison
if (distance === 0) { /* ... */ }

// Good: Epsilon comparison
const EPSILON = 1e-6;
if (Math.abs(distance) < EPSILON) { /* ... */ }

// Good: Squared distance comparison (avoids sqrt)
if (distanceSquared < radiusSum * radiusSum) { /* ... */ }
```

### Degenerate Cases

```typescript
// Handle zero-length vectors
function safeNormalize(v: Vector2): Vector2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len < 1e-10) {
    return { x: 1, y: 0 }; // Return default direction
  }
  return { x: v.x / len, y: v.y / len };
}

// Handle collinear points in GJK
function handleCollinearSimplex(simplex: Vector2[]): Vector2 {
  // Choose perpendicular direction
  const edge = vec2.subtract(simplex[1], simplex[0]);
  return vec2.normalize({ x: -edge.y, y: edge.x });
}
```

### Winding Order Consistency

```typescript
// Ensure polygon vertices are in consistent winding order
function ensureCounterClockwise(vertices: Vector2[]): Vector2[] {
  // Calculate signed area
  let signedArea = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    signedArea += (vertices[j].x - vertices[i].x) * (vertices[j].y + vertices[i].y);
  }

  // If clockwise (positive area), reverse
  if (signedArea > 0) {
    return [...vertices].reverse();
  }

  return vertices;
}
```

---

## Interview Questions

### Q1: When would you choose GJK over SAT?

**Answer:**
- GJK when shapes don't have explicit vertex representation (circles, ellipses)
- GJK when shapes have many vertices (>15-20)
- GJK when implementing a general-purpose physics engine
- SAT when shapes are simple polygons with few vertices
- SAT when you need a simpler, easier to debug implementation

### Q2: How would you handle collision detection for a large number of objects?

**Answer:**
1. Use spatial partitioning (grid, quadtree, BVH) for broad phase
2. Use AABB tests to quickly eliminate non-colliding pairs
3. Apply narrow phase (SAT/GJK) only to candidate pairs
4. Implement temporal coherence to reuse previous frame data
5. Consider multi-threading for independent collision tests

### Q3: Explain the Minkowski Difference and its role in GJK.

**Answer:**
The Minkowski Difference A - B contains all vectors from points in B to points in A. If the origin is inside this difference, it means there exists a point that's in both A and B simultaneously - hence collision. GJK efficiently searches for whether the origin is inside by building a simplex that approaches or contains the origin.

---

## Summary

Collision detection is essential for interactive games and simulations. The three algorithms covered serve different purposes:

1. **AABB**: Fastest and simplest, ideal for broad phase and axis-aligned shapes
2. **SAT**: Robust for convex polygons, provides accurate collision info
3. **GJK**: Most versatile, works with any convex shape via support functions

Key takeaways:
- Use a hybrid approach: broad phase AABB + narrow phase SAT/GJK
- Choose algorithms based on shape complexity and accuracy requirements
- Handle floating point precision carefully
- Optimize with temporal coherence and spatial partitioning
- Test thoroughly with edge cases (touching, contained, fast-moving)

Understanding these algorithms deeply enables you to build efficient, robust physics systems for any type of game or simulation.

---

## Further Reading

### Books
- "Real-Time Collision Detection" by Christer Ericson
- "Game Physics Engine Development" by Ian Millington
- "Physics for Game Developers" by David M. Bourg

### Papers
- "A Fast Procedure for Computing the Distance Between Complex Objects in Three-Dimensional Space" - Gilbert, Johnson, Keerthi
- "Collision Detection Using the GJK Algorithm" - Gino van den Bergen

### Online Resources
- [dyn4j GJK Tutorial](http://www.dyn4j.org/2010/04/gjk-gilbert-johnson-keerthi/)
- [Two-Bit Coding GJK Video](https://www.youtube.com/watch?v=ajv46BSqcK4)
- [Box2D Source Code](https://github.com/erincatto/box2d)
