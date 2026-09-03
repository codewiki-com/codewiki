---
title: Collision Detection Algorithms
description: "Master game collision detection: AABB, Separating Axis Theorem, and GJK algorithm"
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - collision detection
  - physics
  - AABB
  - GJK
status: imported
origin: old/src/content/docs/gamedev/collision-detection.en.md
divergence: 0.357
issues:
  - divergent
legacy:
  category: GameDev
  subcategory: Physics
  order: 14
  lastUpdated: 2026-01-07
---

## What is Collision Detection?

Collision detection is a fundamental aspect of game development and physics simulation. It determines when two or more objects in a virtual space intersect or come into contact. This capability enables realistic physics responses, gameplay mechanics, and prevents objects from passing through each other.

### Why Collision Detection Matters

1. **Gameplay Mechanics**: Detecting when a player touches an enemy, collects an item, or enters a trigger zone
2. **Physics Simulation**: Enabling realistic bouncing, sliding, and object interactions
3. **World Boundaries**: Keeping objects within defined areas
4. **User Interface**: Detecting mouse clicks and touch interactions with UI elements
5. **AI Navigation**: Helping AI characters avoid obstacles

### The Two Phases of Collision Detection

Collision detection typically operates in two phases:

1. **Broad Phase**: Quickly eliminates pairs of objects that are definitely not colliding using simple tests
2. **Narrow Phase**: Performs precise collision tests on potentially colliding pairs

```
All Object Pairs --> Broad Phase (Fast, Approximate) --> Candidate Pairs --> Narrow Phase (Slow, Accurate) --> Actual Collisions
```

---

## Bounding Volume Basics

Before diving into specific algorithms, it's important to understand bounding volumes - simplified shapes that enclose complex objects.

### Common Bounding Volumes

| Type | Description | Collision Test Speed | Accuracy |
|------|-------------|---------------------|----------|
| AABB | Axis-Aligned Bounding Box | Very Fast | Low |
| Sphere/Circle | Spherical boundary | Very Fast | Low-Medium |
| OBB | Oriented Bounding Box | Medium | Medium |
| Convex Hull | Tightest convex shape | Slow | High |
| Actual Geometry | Original mesh/polygon | Very Slow | Perfect |

---

## AABB Collision Detection

Axis-Aligned Bounding Boxes (AABBs) are rectangular boundaries aligned with the coordinate axes. They are among the fastest collision tests to perform.

### 2D AABB Implementation

```typescript
interface AABB {
  x: number;      // Left edge
  y: number;      // Top edge
  width: number;
  height: number;
}

// Alternative representation using min/max points
interface AABB2 {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// Check if two AABBs are colliding
function checkAABBCollision(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Using min/max representation (often cleaner)
function checkAABB2Collision(a: AABB2, b: AABB2): boolean {
  return (
    a.minX <= b.maxX &&
    a.maxX >= b.minX &&
    a.minY <= b.maxY &&
    a.maxY >= b.minY
  );
}

// Get the overlap/penetration between two AABBs
function getAABBOverlap(a: AABB, b: AABB): { x: number; y: number } | null {
  const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);

  if (overlapX > 0 && overlapY > 0) {
    return { x: overlapX, y: overlapY };
  }
  return null;
}

// Calculate minimum translation vector to separate AABBs
function getAABBMTV(a: AABB, b: AABB): { x: number; y: number } | null {
  const overlap = getAABBOverlap(a, b);
  if (!overlap) return null;

  // Find the axis with minimum overlap
  if (overlap.x < overlap.y) {
    // Push along X axis
    const direction = (a.x + a.width / 2) < (b.x + b.width / 2) ? -1 : 1;
    return { x: overlap.x * direction, y: 0 };
  } else {
    // Push along Y axis
    const direction = (a.y + a.height / 2) < (b.y + b.height / 2) ? -1 : 1;
    return { x: 0, y: overlap.y * direction };
  }
}
```

### 3D AABB Implementation

```typescript
interface AABB3D {
  minX: number; minY: number; minZ: number;
  maxX: number; maxY: number; maxZ: number;
}

function checkAABB3DCollision(a: AABB3D, b: AABB3D): boolean {
  return (
    a.minX <= b.maxX && a.maxX >= b.minX &&
    a.minY <= b.maxY && a.maxY >= b.minY &&
    a.minZ <= b.maxZ && a.maxZ >= b.minZ
  );
}

// Create AABB from a set of points
function createAABB3DFromPoints(points: { x: number; y: number; z: number }[]): AABB3D {
  if (points.length === 0) {
    throw new Error('Cannot create AABB from empty point set');
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    minZ = Math.min(minZ, point.z);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
    maxZ = Math.max(maxZ, point.z);
  }

  return { minX, minY, minZ, maxX, maxY, maxZ };
}

// Expand AABB by a margin (useful for broad phase)
function expandAABB3D(aabb: AABB3D, margin: number): AABB3D {
  return {
    minX: aabb.minX - margin,
    minY: aabb.minY - margin,
    minZ: aabb.minZ - margin,
    maxX: aabb.maxX + margin,
    maxY: aabb.maxY + margin,
    maxZ: aabb.maxZ + margin
  };
}
```

### AABB Pros and Cons

**Advantages:**
- Extremely fast collision tests
- Simple to implement and debug
- Easy to update when objects move (no rotation)
- Works well for rectangular objects

**Disadvantages:**
- Poor fit for rotated or non-rectangular objects
- Can produce false positives for diagonal objects
- Bounding volume changes size when object rotates

---

## Circle and Sphere Collision

Circle (2D) and sphere (3D) collisions are computationally simple and rotation-invariant.

### 2D Circle Collision

```typescript
interface Circle {
  x: number;
  y: number;
  radius: number;
}

// Check if two circles collide
function checkCircleCollision(a: Circle, b: Circle): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = a.radius + b.radius;

  return distanceSquared <= radiusSum * radiusSum;
}

// Get collision info including normal and penetration depth
function getCircleCollisionInfo(a: Circle, b: Circle): {
  colliding: boolean;
  normal: { x: number; y: number };
  penetration: number;
} | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distanceSquared = dx * dx + dy * dy;
  const radiusSum = a.radius + b.radius;

  if (distanceSquared > radiusSum * radiusSum) {
    return null;
  }

  const distance = Math.sqrt(distanceSquared);

  // Handle case where circles are at the same position
  if (distance === 0) {
    return {
      colliding: true,
      normal: { x: 1, y: 0 },
      penetration: radiusSum
    };
  }

  return {
    colliding: true,
    normal: { x: dx / distance, y: dy / distance },
    penetration: radiusSum - distance
  };
}

// Circle vs AABB collision
function checkCircleAABBCollision(circle: Circle, aabb: AABB): boolean {
  // Find the closest point on the AABB to the circle center
  const closestX = Math.max(aabb.x, Math.min(circle.x, aabb.x + aabb.width));
  const closestY = Math.max(aabb.y, Math.min(circle.y, aabb.y + aabb.height));

  // Calculate distance from circle center to closest point
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;

  return (dx * dx + dy * dy) <= (circle.radius * circle.radius);
}
```

### 3D Sphere Collision

```typescript
interface Sphere {
  x: number;
  y: number;
  z: number;
  radius: number;
}

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

function checkSphereCollision(a: Sphere, b: Sphere): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  const distanceSquared = dx * dx + dy * dy + dz * dz;
  const radiusSum = a.radius + b.radius;

  return distanceSquared <= radiusSum * radiusSum;
}

// Sphere vs AABB collision
function checkSphereAABBCollision(sphere: Sphere, aabb: AABB3D): boolean {
  // Find closest point on AABB to sphere center
  const closestX = Math.max(aabb.minX, Math.min(sphere.x, aabb.maxX));
  const closestY = Math.max(aabb.minY, Math.min(sphere.y, aabb.maxY));
  const closestZ = Math.max(aabb.minZ, Math.min(sphere.z, aabb.maxZ));

  const dx = sphere.x - closestX;
  const dy = sphere.y - closestY;
  const dz = sphere.z - closestZ;

  return (dx * dx + dy * dy + dz * dz) <= (sphere.radius * sphere.radius);
}

// Ray-Sphere intersection
function raySphereIntersection(
  rayOrigin: Vector3,
  rayDirection: Vector3,
  sphere: Sphere
): { hit: boolean; t: number; point: Vector3 | null } {
  // Normalize ray direction
  const dirLen = Math.sqrt(
    rayDirection.x ** 2 + rayDirection.y ** 2 + rayDirection.z ** 2
  );
  const dir = {
    x: rayDirection.x / dirLen,
    y: rayDirection.y / dirLen,
    z: rayDirection.z / dirLen
  };

  // Vector from ray origin to sphere center
  const oc = {
    x: rayOrigin.x - sphere.x,
    y: rayOrigin.y - sphere.y,
    z: rayOrigin.z - sphere.z
  };

  const a = dir.x * dir.x + dir.y * dir.y + dir.z * dir.z;
  const b = 2 * (oc.x * dir.x + oc.y * dir.y + oc.z * dir.z);
  const c = oc.x * oc.x + oc.y * oc.y + oc.z * oc.z - sphere.radius * sphere.radius;

  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return { hit: false, t: -1, point: null };
  }

  const t = (-b - Math.sqrt(discriminant)) / (2 * a);

  if (t < 0) {
    return { hit: false, t: -1, point: null };
  }

  return {
    hit: true,
    t,
    point: {
      x: rayOrigin.x + t * dir.x,
      y: rayOrigin.y + t * dir.y,
      z: rayOrigin.z + t * dir.z
    }
  };
}
```

---

## Oriented Bounding Box (OBB) Collision

OBBs are rectangular boxes that can be rotated to fit objects more tightly than AABBs.

### 2D OBB Implementation

```typescript
interface OBB2D {
  centerX: number;
  centerY: number;
  halfWidth: number;   // Half of the width
  halfHeight: number;  // Half of the height
  rotation: number;    // Rotation angle in radians
}

// Get the four corners of an OBB
function getOBBCorners(obb: OBB2D): { x: number; y: number }[] {
  const cos = Math.cos(obb.rotation);
  const sin = Math.sin(obb.rotation);

  // Local corner positions
  const corners = [
    { x: -obb.halfWidth, y: -obb.halfHeight },
    { x: obb.halfWidth, y: -obb.halfHeight },
    { x: obb.halfWidth, y: obb.halfHeight },
    { x: -obb.halfWidth, y: obb.halfHeight }
  ];

  // Transform to world space
  return corners.map(corner => ({
    x: obb.centerX + corner.x * cos - corner.y * sin,
    y: obb.centerY + corner.x * sin + corner.y * cos
  }));
}

// Get the two local axes of an OBB (normalized)
function getOBBAxes(obb: OBB2D): { x: number; y: number }[] {
  const cos = Math.cos(obb.rotation);
  const sin = Math.sin(obb.rotation);

  return [
    { x: cos, y: sin },     // X-axis (width direction)
    { x: -sin, y: cos }     // Y-axis (height direction)
  ];
}

// Project a point onto an axis
function projectPointOnAxis(
  point: { x: number; y: number },
  axis: { x: number; y: number }
): number {
  return point.x * axis.x + point.y * axis.y;
}

// Project an OBB onto an axis and get min/max
function projectOBBOnAxis(
  obb: OBB2D,
  axis: { x: number; y: number }
): { min: number; max: number } {
  const corners = getOBBCorners(obb);
  let min = Infinity;
  let max = -Infinity;

  for (const corner of corners) {
    const projection = projectPointOnAxis(corner, axis);
    min = Math.min(min, projection);
    max = Math.max(max, projection);
  }

  return { min, max };
}

// Check OBB collision using SAT
function checkOBBCollision(a: OBB2D, b: OBB2D): boolean {
  // Get all potential separating axes (4 axes total)
  const axesA = getOBBAxes(a);
  const axesB = getOBBAxes(b);
  const axes = [...axesA, ...axesB];

  // Test all axes
  for (const axis of axes) {
    const projA = projectOBBOnAxis(a, axis);
    const projB = projectOBBOnAxis(b, axis);

    // Check for gap on this axis
    if (projA.max < projB.min || projB.max < projA.min) {
      return false; // Separating axis found - no collision
    }
  }

  return true; // No separating axis found - collision!
}
```

### 3D OBB Implementation

```typescript
interface OBB3D {
  center: Vector3;
  halfExtents: Vector3;  // Half-widths along local axes
  axes: [Vector3, Vector3, Vector3];  // Local coordinate axes (normalized)
}

function checkOBB3DCollision(a: OBB3D, b: OBB3D): boolean {
  // 15 axes to test: 3 from A, 3 from B, 9 cross products
  const EPSILON = 1e-6;

  // Translation vector
  const t: Vector3 = {
    x: b.center.x - a.center.x,
    y: b.center.y - a.center.y,
    z: b.center.z - a.center.z
  };

  // Rotation matrix from B to A
  const R: number[][] = [];
  const AbsR: number[][] = [];

  for (let i = 0; i < 3; i++) {
    R[i] = [];
    AbsR[i] = [];
    for (let j = 0; j < 3; j++) {
      R[i][j] = dot3D(a.axes[i], b.axes[j]);
      AbsR[i][j] = Math.abs(R[i][j]) + EPSILON;
    }
  }

  const aHalf = [a.halfExtents.x, a.halfExtents.y, a.halfExtents.z];
  const bHalf = [b.halfExtents.x, b.halfExtents.y, b.halfExtents.z];

  // Test axes L = A0, A1, A2
  for (let i = 0; i < 3; i++) {
    const ra = aHalf[i];
    const rb = bHalf[0] * AbsR[i][0] + bHalf[1] * AbsR[i][1] + bHalf[2] * AbsR[i][2];
    const d = Math.abs(dot3D(t, a.axes[i]));
    if (d > ra + rb) return false;
  }

  // Test axes L = B0, B1, B2
  for (let i = 0; i < 3; i++) {
    const ra = aHalf[0] * AbsR[0][i] + aHalf[1] * AbsR[1][i] + aHalf[2] * AbsR[2][i];
    const rb = bHalf[i];
    const d = Math.abs(dot3D(t, b.axes[i]));
    if (d > ra + rb) return false;
  }

  // Test 9 cross product axes
  // L = A0 x B0
  {
    const ra = aHalf[1] * AbsR[2][0] + aHalf[2] * AbsR[1][0];
    const rb = bHalf[1] * AbsR[0][2] + bHalf[2] * AbsR[0][1];
    const d = Math.abs(dot3D(t, a.axes[2]) * R[1][0] - dot3D(t, a.axes[1]) * R[2][0]);
    if (d > ra + rb) return false;
  }

  // ... (similar tests for remaining 8 cross products)
  // A0 x B1, A0 x B2, A1 x B0, A1 x B1, A1 x B2, A2 x B0, A2 x B1, A2 x B2

  return true;
}

function dot3D(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}
```

---

## Separating Axis Theorem (SAT)

The Separating Axis Theorem is a powerful method for detecting collisions between convex polygons. It states that two convex shapes do not overlap if and only if there exists an axis where their projections do not overlap.

### Understanding SAT

```
Shape A        Shape B           Projection Axis
  /\            /\                    |
 /  \          /  \                   |
/    \        /    \                  |
------        ------                  v

Project shapes onto axis:
|===A===|     |===B===|  <- Gap = No collision
|===A===|===B===|        <- Overlap = Possible collision (need more axes)
```

### SAT Implementation for Convex Polygons

```typescript
interface Polygon {
  vertices: { x: number; y: number }[];
}

// Get all edge normals (potential separating axes)
function getPolygonAxes(polygon: Polygon): { x: number; y: number }[] {
  const axes: { x: number; y: number }[] = [];
  const vertices = polygon.vertices;

  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];

    // Edge vector
    const edge = { x: v2.x - v1.x, y: v2.y - v1.y };

    // Normal (perpendicular) - rotate 90 degrees
    const normal = { x: -edge.y, y: edge.x };

    // Normalize
    const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
    if (length > 0) {
      axes.push({ x: normal.x / length, y: normal.y / length });
    }
  }

  return axes;
}

// Project polygon onto axis
function projectPolygon(
  polygon: Polygon,
  axis: { x: number; y: number }
): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;

  for (const vertex of polygon.vertices) {
    const projection = vertex.x * axis.x + vertex.y * axis.y;
    min = Math.min(min, projection);
    max = Math.max(max, projection);
  }

  return { min, max };
}

// Check if projections overlap
function projectionsOverlap(
  proj1: { min: number; max: number },
  proj2: { min: number; max: number }
): number {
  // Returns overlap amount (negative means gap)
  return Math.min(proj1.max - proj2.min, proj2.max - proj1.min);
}

// Full SAT collision detection
function checkSATCollision(polygonA: Polygon, polygonB: Polygon): {
  colliding: boolean;
  mtv: { x: number; y: number } | null;
  overlap: number;
} {
  let minOverlap = Infinity;
  let mtvAxis: { x: number; y: number } | null = null;

  // Get all axes to test
  const axesA = getPolygonAxes(polygonA);
  const axesB = getPolygonAxes(polygonB);
  const allAxes = [...axesA, ...axesB];

  // Test each axis
  for (const axis of allAxes) {
    const projA = projectPolygon(polygonA, axis);
    const projB = projectPolygon(polygonB, axis);
    const overlap = projectionsOverlap(projA, projB);

    if (overlap <= 0) {
      // Separating axis found - no collision
      return { colliding: false, mtv: null, overlap: 0 };
    }

    if (overlap < minOverlap) {
      minOverlap = overlap;
      mtvAxis = axis;
    }
  }

  // Collision detected - calculate MTV
  if (mtvAxis) {
    // Ensure MTV points from A to B
    const centerA = getPolygonCenter(polygonA);
    const centerB = getPolygonCenter(polygonB);
    const direction = {
      x: centerB.x - centerA.x,
      y: centerB.y - centerA.y
    };

    const dot = direction.x * mtvAxis.x + direction.y * mtvAxis.y;
    if (dot < 0) {
      mtvAxis = { x: -mtvAxis.x, y: -mtvAxis.y };
    }

    return {
      colliding: true,
      mtv: { x: mtvAxis.x * minOverlap, y: mtvAxis.y * minOverlap },
      overlap: minOverlap
    };
  }

  return { colliding: true, mtv: null, overlap: minOverlap };
}

function getPolygonCenter(polygon: Polygon): { x: number; y: number } {
  let sumX = 0, sumY = 0;
  for (const vertex of polygon.vertices) {
    sumX += vertex.x;
    sumY += vertex.y;
  }
  return {
    x: sumX / polygon.vertices.length,
    y: sumY / polygon.vertices.length
  };
}
```

### SAT with Circle vs Polygon

```typescript
function checkCirclePolygonSAT(
  circle: Circle,
  polygon: Polygon
): { colliding: boolean; mtv: { x: number; y: number } | null } {
  let minOverlap = Infinity;
  let mtvAxis: { x: number; y: number } | null = null;

  // Get polygon axes
  const polygonAxes = getPolygonAxes(polygon);

  // Add axis from circle center to closest polygon vertex
  let closestVertex = polygon.vertices[0];
  let minDist = Infinity;

  for (const vertex of polygon.vertices) {
    const dx = vertex.x - circle.x;
    const dy = vertex.y - circle.y;
    const dist = dx * dx + dy * dy;
    if (dist < minDist) {
      minDist = dist;
      closestVertex = vertex;
    }
  }

  const circleAxis = {
    x: closestVertex.x - circle.x,
    y: closestVertex.y - circle.y
  };
  const axisLength = Math.sqrt(circleAxis.x ** 2 + circleAxis.y ** 2);
  if (axisLength > 0) {
    circleAxis.x /= axisLength;
    circleAxis.y /= axisLength;
  }

  const allAxes = [...polygonAxes, circleAxis];

  for (const axis of allAxes) {
    // Project circle
    const circleProjection = circle.x * axis.x + circle.y * axis.y;
    const circleProj = {
      min: circleProjection - circle.radius,
      max: circleProjection + circle.radius
    };

    // Project polygon
    const polyProj = projectPolygon(polygon, axis);

    const overlap = projectionsOverlap(circleProj, polyProj);

    if (overlap <= 0) {
      return { colliding: false, mtv: null };
    }

    if (overlap < minOverlap) {
      minOverlap = overlap;
      mtvAxis = axis;
    }
  }

  if (mtvAxis) {
    const polyCenter = getPolygonCenter(polygon);
    const direction = {
      x: circle.x - polyCenter.x,
      y: circle.y - polyCenter.y
    };

    const dot = direction.x * mtvAxis.x + direction.y * mtvAxis.y;
    if (dot < 0) {
      mtvAxis = { x: -mtvAxis.x, y: -mtvAxis.y };
    }

    return {
      colliding: true,
      mtv: { x: mtvAxis.x * minOverlap, y: mtvAxis.y * minOverlap }
    };
  }

  return { colliding: true, mtv: null };
}
```

---

## GJK Algorithm

The Gilbert-Johnson-Keerthi (GJK) algorithm is an elegant and efficient method for detecting collisions between convex shapes. It works by finding if the origin is contained within the Minkowski Difference of two shapes.

### Understanding Minkowski Difference

The Minkowski Difference of two shapes A and B is defined as:
```
A - B = { a - b | a in A, b in B }
```

Key insight: **Two shapes collide if and only if the origin is inside their Minkowski Difference.**

### GJK Implementation

```typescript
interface ConvexShape {
  // Support function: find the point furthest in a given direction
  support(direction: Vector2): Vector2;
}

interface Vector2 {
  x: number;
  y: number;
}

// Vector operations
const vec2 = {
  subtract(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x - b.x, y: a.y - b.y };
  },

  add(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x + b.x, y: a.y + b.y };
  },

  negate(v: Vector2): Vector2 {
    return { x: -v.x, y: -v.y };
  },

  dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  },

  cross(a: Vector2, b: Vector2): number {
    return a.x * b.y - a.y * b.x;
  },

  tripleProduct(a: Vector2, b: Vector2, c: Vector2): Vector2 {
    // (A x B) x C = B(A.C) - A(B.C)
    const ac = vec2.dot(a, c);
    const bc = vec2.dot(b, c);
    return { x: b.x * ac - a.x * bc, y: b.y * ac - a.y * bc };
  }
};

// Support function for Minkowski Difference
function minkowskiSupport(
  shapeA: ConvexShape,
  shapeB: ConvexShape,
  direction: Vector2
): Vector2 {
  const pointA = shapeA.support(direction);
  const pointB = shapeB.support(vec2.negate(direction));
  return vec2.subtract(pointA, pointB);
}

// GJK collision detection
function gjkCollision(shapeA: ConvexShape, shapeB: ConvexShape): boolean {
  // Initial direction (arbitrary)
  let direction: Vector2 = { x: 1, y: 0 };

  // Get first point of the simplex
  const simplex: Vector2[] = [];
  const support = minkowskiSupport(shapeA, shapeB, direction);
  simplex.push(support);

  // New direction towards the origin
  direction = vec2.negate(support);

  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    // Get new support point
    const newPoint = minkowskiSupport(shapeA, shapeB, direction);

    // If the new point didn't pass the origin, no collision
    if (vec2.dot(newPoint, direction) < 0) {
      return false;
    }

    simplex.push(newPoint);

    // Check if the simplex contains the origin
    const result = handleSimplex(simplex, direction);
    if (result.containsOrigin) {
      return true;
    }
    direction = result.newDirection;
  }

  return false;
}

interface SimplexResult {
  containsOrigin: boolean;
  newDirection: Vector2;
}

function handleSimplex(simplex: Vector2[], direction: Vector2): SimplexResult {
  if (simplex.length === 2) {
    return handleLine(simplex, direction);
  }
  return handleTriangle(simplex, direction);
}

function handleLine(simplex: Vector2[], direction: Vector2): SimplexResult {
  const a = simplex[1]; // Most recently added point
  const b = simplex[0];

  const ab = vec2.subtract(b, a);
  const ao = vec2.negate(a);

  // Get perpendicular to AB towards origin
  const newDirection = vec2.tripleProduct(ab, ao, ab);

  return { containsOrigin: false, newDirection };
}

function handleTriangle(simplex: Vector2[], direction: Vector2): SimplexResult {
  const a = simplex[2]; // Most recently added
  const b = simplex[1];
  const c = simplex[0];

  const ab = vec2.subtract(b, a);
  const ac = vec2.subtract(c, a);
  const ao = vec2.negate(a);

  // Perpendicular to AB (pointing away from C)
  const abPerp = vec2.tripleProduct(ac, ab, ab);
  // Perpendicular to AC (pointing away from B)
  const acPerp = vec2.tripleProduct(ab, ac, ac);

  // Check which region the origin is in
  if (vec2.dot(abPerp, ao) > 0) {
    // Origin is outside AB edge
    simplex.splice(0, 1); // Remove C
    return { containsOrigin: false, newDirection: abPerp };
  }

  if (vec2.dot(acPerp, ao) > 0) {
    // Origin is outside AC edge
    simplex.splice(1, 1); // Remove B
    return { containsOrigin: false, newDirection: acPerp };
  }

  // Origin is inside the triangle
  return { containsOrigin: true, newDirection: direction };
}
```

### Common Shape Support Functions

```typescript
// Circle support function
class CircleShape implements ConvexShape {
  constructor(
    public center: Vector2,
    public radius: number
  ) {}

  support(direction: Vector2): Vector2 {
    const length = Math.sqrt(direction.x ** 2 + direction.y ** 2);
    if (length === 0) {
      return this.center;
    }
    return {
      x: this.center.x + (direction.x / length) * this.radius,
      y: this.center.y + (direction.y / length) * this.radius
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
      const dot = vertex.x * direction.x + vertex.y * direction.y;
      if (dot > maxDot) {
        maxDot = dot;
        maxVertex = vertex;
      }
    }

    return maxVertex;
  }
}

// Rectangle support function
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
    const localDir = {
      x: direction.x * cos - direction.y * sin,
      y: direction.x * sin + direction.y * cos
    };

    // Find support in local space
    const localSupport = {
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
```

### EPA (Expanding Polytope Algorithm)

EPA extends GJK to find penetration depth and collision normal:

```typescript
interface EPAResult {
  penetration: number;
  normal: Vector2;
}

function epa(
  shapeA: ConvexShape,
  shapeB: ConvexShape,
  simplex: Vector2[]
): EPAResult {
  const TOLERANCE = 0.0001;
  const maxIterations = 100;

  // Ensure simplex is a triangle
  while (simplex.length < 3) {
    // Add another point if needed
    const direction = { x: 1, y: 0 };
    simplex.push(minkowskiSupport(shapeA, shapeB, direction));
  }

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Find closest edge to origin
    let minDistance = Infinity;
    let minIndex = 0;
    let minNormal: Vector2 = { x: 0, y: 0 };

    for (let i = 0; i < simplex.length; i++) {
      const j = (i + 1) % simplex.length;
      const a = simplex[i];
      const b = simplex[j];

      const edge = vec2.subtract(b, a);

      // Normal pointing towards origin
      let normal: Vector2 = { x: edge.y, y: -edge.x };
      const length = Math.sqrt(normal.x ** 2 + normal.y ** 2);
      normal = { x: normal.x / length, y: normal.y / length };

      // Distance from origin to edge
      const distance = vec2.dot(a, normal);

      if (distance < minDistance) {
        minDistance = distance;
        minIndex = j;
        minNormal = normal;
      }
    }

    // Get support point in direction of closest edge normal
    const support = minkowskiSupport(shapeA, shapeB, minNormal);
    const supportDistance = vec2.dot(support, minNormal);

    if (supportDistance - minDistance < TOLERANCE) {
      // Found the closest edge
      return {
        penetration: minDistance,
        normal: minNormal
      };
    }

    // Expand polytope
    simplex.splice(minIndex, 0, support);
  }

  // Fallback
  return { penetration: 0, normal: { x: 0, y: 1 } };
}
```

---

## Spatial Partitioning

Spatial partitioning dramatically improves collision detection performance by reducing the number of pairs that need to be tested.

### Uniform Grid

```typescript
class UniformGrid<T extends { x: number; y: number; width: number; height: number }> {
  private cells: Map<string, Set<T>>;
  private cellSize: number;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  private getCellKey(cellX: number, cellY: number): string {
    return `${cellX},${cellY}`;
  }

  private getCellCoords(x: number, y: number): { cellX: number; cellY: number } {
    return {
      cellX: Math.floor(x / this.cellSize),
      cellY: Math.floor(y / this.cellSize)
    };
  }

  insert(object: T): void {
    const minCell = this.getCellCoords(object.x, object.y);
    const maxCell = this.getCellCoords(
      object.x + object.width,
      object.y + object.height
    );

    for (let cx = minCell.cellX; cx <= maxCell.cellX; cx++) {
      for (let cy = minCell.cellY; cy <= maxCell.cellY; cy++) {
        const key = this.getCellKey(cx, cy);
        if (!this.cells.has(key)) {
          this.cells.set(key, new Set());
        }
        this.cells.get(key)!.add(object);
      }
    }
  }

  remove(object: T): void {
    const minCell = this.getCellCoords(object.x, object.y);
    const maxCell = this.getCellCoords(
      object.x + object.width,
      object.y + object.height
    );

    for (let cx = minCell.cellX; cx <= maxCell.cellX; cx++) {
      for (let cy = minCell.cellY; cy <= maxCell.cellY; cy++) {
        const key = this.getCellKey(cx, cy);
        this.cells.get(key)?.delete(object);
      }
    }
  }

  clear(): void {
    this.cells.clear();
  }

  getPotentialCollisions(object: T): Set<T> {
    const candidates = new Set<T>();
    const minCell = this.getCellCoords(object.x, object.y);
    const maxCell = this.getCellCoords(
      object.x + object.width,
      object.y + object.height
    );

    for (let cx = minCell.cellX; cx <= maxCell.cellX; cx++) {
      for (let cy = minCell.cellY; cy <= maxCell.cellY; cy++) {
        const key = this.getCellKey(cx, cy);
        const cell = this.cells.get(key);
        if (cell) {
          cell.forEach(obj => {
            if (obj !== object) {
              candidates.add(obj);
            }
          });
        }
      }
    }

    return candidates;
  }

  getAllPairs(): Array<[T, T]> {
    const pairs: Array<[T, T]> = [];
    const checked = new Set<string>();

    for (const cell of this.cells.values()) {
      const objects = Array.from(cell);
      for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
          const key = `${objects[i]}-${objects[j]}`;
          if (!checked.has(key)) {
            checked.add(key);
            pairs.push([objects[i], objects[j]]);
          }
        }
      }
    }

    return pairs;
  }
}
```

### Quadtree

```typescript
interface QuadtreeObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface QuadtreeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

class Quadtree<T extends QuadtreeObject> {
  private bounds: QuadtreeBounds;
  private maxObjects: number;
  private maxLevels: number;
  private level: number;
  private objects: T[];
  private nodes: Quadtree<T>[];

  constructor(
    bounds: QuadtreeBounds,
    maxObjects = 10,
    maxLevels = 4,
    level = 0
  ) {
    this.bounds = bounds;
    this.maxObjects = maxObjects;
    this.maxLevels = maxLevels;
    this.level = level;
    this.objects = [];
    this.nodes = [];
  }

  // Split node into 4 quadrants
  private split(): void {
    const halfWidth = this.bounds.width / 2;
    const halfHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;

    // Top-right
    this.nodes[0] = new Quadtree<T>(
      { x: x + halfWidth, y, width: halfWidth, height: halfHeight },
      this.maxObjects,
      this.maxLevels,
      this.level + 1
    );
    // Top-left
    this.nodes[1] = new Quadtree<T>(
      { x, y, width: halfWidth, height: halfHeight },
      this.maxObjects,
      this.maxLevels,
      this.level + 1
    );
    // Bottom-left
    this.nodes[2] = new Quadtree<T>(
      { x, y: y + halfHeight, width: halfWidth, height: halfHeight },
      this.maxObjects,
      this.maxLevels,
      this.level + 1
    );
    // Bottom-right
    this.nodes[3] = new Quadtree<T>(
      { x: x + halfWidth, y: y + halfHeight, width: halfWidth, height: halfHeight },
      this.maxObjects,
      this.maxLevels,
      this.level + 1
    );
  }

  // Determine which quadrant an object belongs to
  private getIndex(object: T): number[] {
    const indices: number[] = [];
    const verticalMid = this.bounds.x + this.bounds.width / 2;
    const horizontalMid = this.bounds.y + this.bounds.height / 2;

    const topQuadrant = object.y < horizontalMid;
    const bottomQuadrant = object.y + object.height > horizontalMid;
    const leftQuadrant = object.x < verticalMid;
    const rightQuadrant = object.x + object.width > verticalMid;

    if (topQuadrant) {
      if (rightQuadrant) indices.push(0);
      if (leftQuadrant) indices.push(1);
    }
    if (bottomQuadrant) {
      if (leftQuadrant) indices.push(2);
      if (rightQuadrant) indices.push(3);
    }

    return indices;
  }

  insert(object: T): void {
    // If we have subnodes, insert into them
    if (this.nodes.length > 0) {
      const indices = this.getIndex(object);
      for (const index of indices) {
        this.nodes[index].insert(object);
      }
      return;
    }

    // Add to current node
    this.objects.push(object);

    // Split if necessary
    if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
      if (this.nodes.length === 0) {
        this.split();
      }

      // Move all objects to child nodes
      const objectsToMove = this.objects;
      this.objects = [];
      for (const obj of objectsToMove) {
        const indices = this.getIndex(obj);
        for (const index of indices) {
          this.nodes[index].insert(obj);
        }
      }
    }
  }

  retrieve(object: T): T[] {
    const indices = this.getIndex(object);
    let returnObjects = [...this.objects];

    if (this.nodes.length > 0) {
      for (const index of indices) {
        returnObjects = returnObjects.concat(this.nodes[index].retrieve(object));
      }
    }

    // Remove duplicates
    return [...new Set(returnObjects)];
  }

  clear(): void {
    this.objects = [];
    for (const node of this.nodes) {
      node.clear();
    }
    this.nodes = [];
  }
}
```

### Bounding Volume Hierarchy (BVH)

```typescript
interface BVHNode<T> {
  bounds: AABB;
  left: BVHNode<T> | null;
  right: BVHNode<T> | null;
  object: T | null;  // Only leaf nodes have objects
}

function buildBVH<T extends { bounds: AABB }>(objects: T[]): BVHNode<T> | null {
  if (objects.length === 0) return null;

  if (objects.length === 1) {
    return {
      bounds: objects[0].bounds,
      left: null,
      right: null,
      object: objects[0]
    };
  }

  // Calculate bounding box of all objects
  const bounds = calculateCombinedBounds(objects.map(o => o.bounds));

  // Find longest axis
  const width = bounds.x + bounds.width - bounds.x;
  const height = bounds.y + bounds.height - bounds.y;
  const axis = width > height ? 'x' : 'y';

  // Sort objects by center on longest axis
  objects.sort((a, b) => {
    const aCenter = axis === 'x'
      ? a.bounds.x + a.bounds.width / 2
      : a.bounds.y + a.bounds.height / 2;
    const bCenter = axis === 'x'
      ? b.bounds.x + b.bounds.width / 2
      : b.bounds.y + b.bounds.height / 2;
    return aCenter - bCenter;
  });

  // Split objects into two groups
  const mid = Math.floor(objects.length / 2);
  const leftObjects = objects.slice(0, mid);
  const rightObjects = objects.slice(mid);

  return {
    bounds,
    left: buildBVH(leftObjects),
    right: buildBVH(rightObjects),
    object: null
  };
}

function queryBVH<T>(
  node: BVHNode<T> | null,
  queryBounds: AABB
): T[] {
  if (!node) return [];

  // Check if query bounds intersect this node's bounds
  if (!checkAABBCollision(node.bounds, queryBounds)) {
    return [];
  }

  // If leaf node, return the object
  if (node.object !== null) {
    return [node.object];
  }

  // Recurse into children
  return [
    ...queryBVH(node.left, queryBounds),
    ...queryBVH(node.right, queryBounds)
  ];
}

function calculateCombinedBounds(bounds: AABB[]): AABB {
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const b of bounds) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}
```

---

## Continuous Collision Detection (CCD)

Discrete collision detection can miss fast-moving objects (tunneling). Continuous Collision Detection solves this problem.

### Swept AABB

```typescript
interface SweptAABBResult {
  hit: boolean;
  tEntry: number;  // Time of entry (0-1)
  tExit: number;   // Time of exit
  normalX: number;
  normalY: number;
}

function sweptAABB(
  movingBox: AABB,
  velocity: { x: number; y: number },
  staticBox: AABB
): SweptAABBResult {
  // Distance to enter and exit along each axis
  let xInvEntry: number, yInvEntry: number;
  let xInvExit: number, yInvExit: number;

  if (velocity.x > 0) {
    xInvEntry = staticBox.x - (movingBox.x + movingBox.width);
    xInvExit = (staticBox.x + staticBox.width) - movingBox.x;
  } else {
    xInvEntry = (staticBox.x + staticBox.width) - movingBox.x;
    xInvExit = staticBox.x - (movingBox.x + movingBox.width);
  }

  if (velocity.y > 0) {
    yInvEntry = staticBox.y - (movingBox.y + movingBox.height);
    yInvExit = (staticBox.y + staticBox.height) - movingBox.y;
  } else {
    yInvEntry = (staticBox.y + staticBox.height) - movingBox.y;
    yInvExit = staticBox.y - (movingBox.y + movingBox.height);
  }

  // Time of entry and exit for each axis
  let xEntry: number, yEntry: number;
  let xExit: number, yExit: number;

  if (velocity.x === 0) {
    xEntry = -Infinity;
    xExit = Infinity;
  } else {
    xEntry = xInvEntry / velocity.x;
    xExit = xInvExit / velocity.x;
  }

  if (velocity.y === 0) {
    yEntry = -Infinity;
    yExit = Infinity;
  } else {
    yEntry = yInvEntry / velocity.y;
    yExit = yInvExit / velocity.y;
  }

  // Find the latest entry and earliest exit
  const entryTime = Math.max(xEntry, yEntry);
  const exitTime = Math.min(xExit, yExit);

  // Check for no collision
  if (
    entryTime > exitTime ||
    (xEntry < 0 && yEntry < 0) ||
    xEntry > 1 ||
    yEntry > 1
  ) {
    return {
      hit: false,
      tEntry: 1,
      tExit: 1,
      normalX: 0,
      normalY: 0
    };
  }

  // Calculate normal
  let normalX = 0;
  let normalY = 0;

  if (xEntry > yEntry) {
    normalX = xInvEntry < 0 ? 1 : -1;
  } else {
    normalY = yInvEntry < 0 ? 1 : -1;
  }

  return {
    hit: true,
    tEntry: entryTime,
    tExit: exitTime,
    normalX,
    normalY
  };
}
```

### Time of Impact for Spheres

```typescript
function sphereTOI(
  sphereA: Sphere,
  velocityA: Vector3,
  sphereB: Sphere,
  velocityB: Vector3
): { hit: boolean; toi: number } {
  // Relative velocity
  const relVel = {
    x: velocityA.x - velocityB.x,
    y: velocityA.y - velocityB.y,
    z: velocityA.z - velocityB.z
  };

  // Initial separation
  const sep = {
    x: sphereA.x - sphereB.x,
    y: sphereA.y - sphereB.y,
    z: sphereA.z - sphereB.z
  };

  const radiusSum = sphereA.radius + sphereB.radius;

  // Quadratic coefficients
  const a = relVel.x ** 2 + relVel.y ** 2 + relVel.z ** 2;
  const b = 2 * (sep.x * relVel.x + sep.y * relVel.y + sep.z * relVel.z);
  const c = sep.x ** 2 + sep.y ** 2 + sep.z ** 2 - radiusSum ** 2;

  // Already overlapping
  if (c < 0) {
    return { hit: true, toi: 0 };
  }

  // Not moving towards each other
  if (b >= 0) {
    return { hit: false, toi: Infinity };
  }

  // Check discriminant
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) {
    return { hit: false, toi: Infinity };
  }

  // Calculate TOI
  const toi = (-b - Math.sqrt(discriminant)) / (2 * a);

  if (toi < 0 || toi > 1) {
    return { hit: false, toi: Infinity };
  }

  return { hit: true, toi };
}
```

### Conservative Advancement

```typescript
function conservativeAdvancement(
  shapeA: ConvexShape,
  shapeB: ConvexShape,
  velocityA: Vector2,
  velocityB: Vector2,
  tolerance: number = 0.001
): { hit: boolean; toi: number } {
  let t = 0;
  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    // Get positions at time t
    const posA = {
      x: shapeA.center.x + velocityA.x * t,
      y: shapeA.center.y + velocityA.y * t
    };
    const posB = {
      x: shapeB.center.x + velocityB.x * t,
      y: shapeB.center.y + velocityB.y * t
    };

    // Calculate distance between shapes
    const distance = gjkDistance(shapeA, shapeB, posA, posB);

    if (distance < tolerance) {
      return { hit: true, toi: t };
    }

    if (t >= 1) {
      return { hit: false, toi: Infinity };
    }

    // Relative velocity
    const relVel = {
      x: velocityA.x - velocityB.x,
      y: velocityA.y - velocityB.y
    };
    const relSpeed = Math.sqrt(relVel.x ** 2 + relVel.y ** 2);

    if (relSpeed === 0) {
      return { hit: false, toi: Infinity };
    }

    // Advance by safe amount
    const dt = distance / relSpeed;
    t = Math.min(t + dt, 1);
  }

  return { hit: false, toi: Infinity };
}
```

---

## Complete Collision System

Here's how to put it all together:

```typescript
interface CollisionObject {
  id: string;
  position: Vector2;
  velocity: Vector2;
  shape: ConvexShape;
  bounds: AABB;
  isStatic: boolean;
  layer: number;
  mask: number;
}

interface CollisionResult {
  objectA: CollisionObject;
  objectB: CollisionObject;
  normal: Vector2;
  penetration: number;
  point: Vector2;
}

class CollisionWorld {
  private objects: Map<string, CollisionObject> = new Map();
  private spatialHash: UniformGrid<CollisionObject>;
  private layerMatrix: boolean[][] = [];

  constructor(cellSize: number = 64) {
    this.spatialHash = new UniformGrid(cellSize);

    // Initialize layer matrix (all layers collide by default)
    for (let i = 0; i < 32; i++) {
      this.layerMatrix[i] = new Array(32).fill(true);
    }
  }

  // Set whether two layers should collide
  setLayerCollision(layerA: number, layerB: number, shouldCollide: boolean): void {
    this.layerMatrix[layerA][layerB] = shouldCollide;
    this.layerMatrix[layerB][layerA] = shouldCollide;
  }

  addObject(object: CollisionObject): void {
    this.objects.set(object.id, object);
    this.updateObjectInGrid(object);
  }

  removeObject(id: string): void {
    const object = this.objects.get(id);
    if (object) {
      this.spatialHash.remove(object);
      this.objects.delete(id);
    }
  }

  updateObject(id: string, updates: Partial<CollisionObject>): void {
    const object = this.objects.get(id);
    if (object) {
      this.spatialHash.remove(object);
      Object.assign(object, updates);
      this.updateBounds(object);
      this.spatialHash.insert(object);
    }
  }

  private updateBounds(object: CollisionObject): void {
    // Update AABB based on shape
    const vertices = object.shape.getVertices();
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const v of vertices) {
      minX = Math.min(minX, v.x + object.position.x);
      minY = Math.min(minY, v.y + object.position.y);
      maxX = Math.max(maxX, v.x + object.position.x);
      maxY = Math.max(maxY, v.y + object.position.y);
    }

    object.bounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private updateObjectInGrid(object: CollisionObject): void {
    this.updateBounds(object);
    this.spatialHash.insert(object);
  }

  private shouldCollide(a: CollisionObject, b: CollisionObject): boolean {
    // Check layer mask
    if (!this.layerMatrix[a.layer][b.layer]) {
      return false;
    }
    // Check object masks
    if (!(a.mask & (1 << b.layer)) || !(b.mask & (1 << a.layer))) {
      return false;
    }
    return true;
  }

  detectCollisions(): CollisionResult[] {
    const results: CollisionResult[] = [];
    const checked = new Set<string>();

    for (const object of this.objects.values()) {
      const candidates = this.spatialHash.getPotentialCollisions(object);

      for (const candidate of candidates) {
        // Skip duplicates
        const pairKey = object.id < candidate.id
          ? `${object.id}-${candidate.id}`
          : `${candidate.id}-${object.id}`;

        if (checked.has(pairKey)) continue;
        checked.add(pairKey);

        // Skip if layers shouldn't collide
        if (!this.shouldCollide(object, candidate)) continue;

        // Skip static-static pairs
        if (object.isStatic && candidate.isStatic) continue;

        // Broad phase: AABB check
        if (!checkAABBCollision(object.bounds, candidate.bounds)) continue;

        // Narrow phase: GJK + EPA
        if (gjkCollision(object.shape, candidate.shape)) {
          const epaResult = epa(
            object.shape,
            candidate.shape,
            [] // Simplex from GJK
          );

          results.push({
            objectA: object,
            objectB: candidate,
            normal: epaResult.normal,
            penetration: epaResult.penetration,
            point: { x: 0, y: 0 } // Calculate contact point
          });
        }
      }
    }

    return results;
  }

  resolveCollisions(results: CollisionResult[]): void {
    for (const result of results) {
      const { objectA, objectB, normal, penetration } = result;

      if (objectA.isStatic && objectB.isStatic) continue;

      // Calculate mass ratios
      const massA = objectA.isStatic ? Infinity : 1;
      const massB = objectB.isStatic ? Infinity : 1;
      const totalMass = massA + massB;

      // Position correction
      const correction = {
        x: normal.x * penetration,
        y: normal.y * penetration
      };

      if (!objectA.isStatic) {
        objectA.position.x -= correction.x * (massB / totalMass);
        objectA.position.y -= correction.y * (massB / totalMass);
      }

      if (!objectB.isStatic) {
        objectB.position.x += correction.x * (massA / totalMass);
        objectB.position.y += correction.y * (massA / totalMass);
      }

      // Velocity resolution (elastic collision)
      const relVel = {
        x: objectB.velocity.x - objectA.velocity.x,
        y: objectB.velocity.y - objectA.velocity.y
      };

      const velAlongNormal = relVel.x * normal.x + relVel.y * normal.y;

      if (velAlongNormal > 0) continue; // Moving apart

      const restitution = 0.5; // Bounciness
      const impulse = -(1 + restitution) * velAlongNormal / (1/massA + 1/massB);

      if (!objectA.isStatic) {
        objectA.velocity.x -= impulse * normal.x / massA;
        objectA.velocity.y -= impulse * normal.y / massA;
      }

      if (!objectB.isStatic) {
        objectB.velocity.x += impulse * normal.x / massB;
        objectB.velocity.y += impulse * normal.y / massB;
      }
    }
  }

  step(deltaTime: number): void {
    // Update positions
    for (const object of this.objects.values()) {
      if (!object.isStatic) {
        object.position.x += object.velocity.x * deltaTime;
        object.position.y += object.velocity.y * deltaTime;
        this.updateObjectInGrid(object);
      }
    }

    // Detect and resolve collisions
    const collisions = this.detectCollisions();
    this.resolveCollisions(collisions);

    // Update grid after resolution
    for (const object of this.objects.values()) {
      if (!object.isStatic) {
        this.updateObjectInGrid(object);
      }
    }
  }
}
```

---

## Performance Comparison

| Algorithm | Time Complexity | Best For |
|-----------|----------------|----------|
| AABB | O(1) | Axis-aligned rectangles, broad phase |
| Circle/Sphere | O(1) | Round objects, particles |
| OBB | O(1) | Rotated rectangles |
| SAT | O(n) | Convex polygons, n = vertex count |
| GJK | O(n) iterative | Any convex shapes |
| Uniform Grid | O(n/k) | Dense, evenly distributed objects |
| Quadtree | O(log n) | Sparse, clustered objects |
| BVH | O(log n) | Static geometry, ray casting |

---

## Common Pitfalls and Best Practices

### Floating-Point Issues

```typescript
// Bad: Direct equality comparison
if (distance === 0) { ... }

// Good: Epsilon comparison
const EPSILON = 1e-6;
if (Math.abs(distance) < EPSILON) { ... }

// Good: Square distance comparison (avoids sqrt)
if (distanceSquared < radiusSum * radiusSum) { ... }
```

### Tunneling Prevention

```typescript
// Option 1: Limit velocity
const MAX_VELOCITY = 10;
velocity = Math.min(velocity, MAX_VELOCITY);

// Option 2: Substeps
const substeps = Math.ceil(velocity / MAX_SAFE_VELOCITY);
const dt = deltaTime / substeps;
for (let i = 0; i < substeps; i++) {
  updatePhysics(dt);
  detectAndResolveCollisions();
}

// Option 3: Continuous collision detection
const toi = calculateTimeOfImpact(objectA, objectB);
if (toi < 1) {
  advanceToTime(toi);
  resolveCollision();
}
```

### Memory Optimization

```typescript
// Object pooling for collision results
class CollisionResultPool {
  private pool: CollisionResult[] = [];

  acquire(): CollisionResult {
    return this.pool.pop() || this.createNew();
  }

  release(result: CollisionResult): void {
    this.reset(result);
    this.pool.push(result);
  }

  private createNew(): CollisionResult {
    return { objectA: null, objectB: null, normal: { x: 0, y: 0 }, penetration: 0, point: { x: 0, y: 0 } };
  }

  private reset(result: CollisionResult): void {
    result.objectA = null;
    result.objectB = null;
    result.normal.x = 0;
    result.normal.y = 0;
    result.penetration = 0;
  }
}
```

---

## Interview Key Points

### Common Interview Questions

**Q1: What is the difference between broad phase and narrow phase collision detection?**

- **Broad Phase**: Quick, approximate tests using simple bounding volumes (AABB, spheres) to eliminate obviously non-colliding pairs
- **Narrow Phase**: Precise, expensive tests on candidate pairs from broad phase using actual geometry

**Q2: When would you use GJK over SAT?**

- GJK is more versatile (any convex shape via support function)
- SAT requires explicit polygon representation
- GJK naturally extends to 3D with minimal changes
- SAT can be faster for simple cases with few vertices

**Q3: How do you prevent tunneling?**

1. Limit maximum velocity
2. Use substeps
3. Implement Continuous Collision Detection (CCD)
4. Expand collision bounds by velocity

**Q4: What spatial partitioning structure would you choose for different scenarios?**

- **Uniform Grid**: Many small objects, evenly distributed
- **Quadtree**: Variable-size objects, non-uniform distribution
- **BVH**: Static geometry, ray casting, complex scenes
- **Octree**: 3D games with variable object density

---

## Further Reading

### Books
- "Real-Time Collision Detection" by Christer Ericson
- "Game Physics Engine Development" by Ian Millington
- "Physics for Game Developers" by David M. Bourg

### Online Resources
- [Real-Time Collision Detection Blog](http://realtimecollisiondetection.net/)
- [Two-Bit Coding GJK Tutorial](https://www.youtube.com/watch?v=ajv46BSqcK4)
- [Box2D Source Code](https://github.com/erincatto/box2d)
- [Matter.js Physics Engine](https://brm.io/matter-js/)

### Learning Path

1. **Beginner**: Master AABB and circle collisions
2. **Intermediate**: Implement SAT for convex polygons
3. **Advanced**: Understand and implement GJK + EPA
4. **Expert**: Build a complete physics engine with CCD

---

## Summary

Collision detection is a multi-layered problem requiring different techniques for different scenarios:

1. **Start Simple**: AABB and circle collisions cover most basic cases
2. **Use Spatial Partitioning**: Essential for handling many objects efficiently
3. **Choose the Right Algorithm**: SAT for polygons, GJK for general convex shapes
4. **Consider Motion**: Use CCD for fast-moving objects
5. **Profile and Optimize**: Collision detection is often a performance bottleneck

Understanding these fundamentals will help you build robust physics systems for games, simulations, and interactive applications.
