---
title: Navigation Mesh (NavMesh) Complete Guide
description: "Master navigation mesh technology in 3D games: generation, querying, and dynamic updates"
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - NavMesh
  - pathfinding
  - navigation
  - 3D
status: imported
origin: old/src/content/docs/gamedev/navmesh.en.md
divergence: 0.205
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: gamedev
  subcategory: ""
  order: 18
  lastUpdated: 2026-01-07
---

Navigation Mesh, commonly known as NavMesh, is the core technology for implementing AI pathfinding in modern 3D games. Compared to traditional grid-based pathfinding or waypoint systems, NavMesh can more accurately represent complex 3D environments and provide natural, smooth movement paths for game characters. This article will provide an deep dive of NavMesh's core concepts, generation algorithms, query mechanisms, and practical applications in mainstream game engines.

## I. NavMesh Fundamentals

### What is a Navigation Mesh?

A navigation mesh is a data structure used to describe walkable areas in a game world. It simplifies complex 3D scenes into a set of interconnected convex polygons, where each polygon represents an area that can be freely traversed.

```
Comparison: Traditional Grid-based Pathfinding vs NavMesh:

Traditional Grid:                 NavMesh:
┌─┬─┬─┬─┬─┬─┬─┬─┐               ┌───────────────┐
│ │ │ │ │█│█│█│ │               │               │
├─┼─┼─┼─┼─┼─┼─┼─┤               │     P1        │
│ │ │ │ │█│█│█│ │               │               │
├─┼─┼─┼─┼─┼─┼─┼─┤         ┌─────┴───────┐       │
│ │ │ │ │ │ │ │ │         │             │       │
├─┼─┼─┼─┼─┼─┼─┼─┤         │     P2      │  P3   │
│ │ │ │ │ │ │ │ │         │             │       │
└─┴─┴─┴─┴─┴─┴─┴─┘         └─────────────┴───────┘

Drawbacks:          Large storage overhead   Advantages:  Efficient storage
                    Unnatural paths                        Smooth paths
                    Limited precision                      Arbitrary precision support
```

**Core advantages of NavMesh:**

- **Storage Efficiency**: Uses convex polygons instead of numerous grid cells
- **Smooth Paths**: Generated paths are more natural without jaggy artifacts
- **Support for Complex Terrain**: Can handle slopes, stairs, and multi-level structures
- **Efficient Queries**: Both point location and pathfinding have good time complexity

### The Importance of Convex Polygons

NavMesh uses convex polygons as basic units because they possess the following key properties:

**Definition of Convex Polygon**: A polygon where the line segment connecting any two points inside the polygon lies entirely within the polygon.

```
Convex Polygon:                Non-convex Polygon:
    ┌─────────┐                  ┌─────────┐
   /           \                /           \
  /             \              /      ┌──────┘
 /               \            /       │
/                 \          /        │
──────────────────           ─────────┘

All line segments          Some line segments
stay inside                extend outside boundaries
```

**Reasons for using convex polygons:**

1. **Simplified Pathfinding**: Inside a convex polygon, the straight line path between any two points is always valid
2. **Fast Collision Detection**: Point-in-polygon tests are simple and efficient for convex shapes
3. **Convenient Mesh Simplification**: Complex scenes can be decomposed into the minimum number of convex polygons

### NavMesh System Architecture

A complete NavMesh system typically contains the following components:

```
┌─────────────────────────────────────────────────────────────┐
│              NavMesh System Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │  Geometry Layer  │    │  Topology Layer  │                │
│  │                 │    │                 │                │
│  │ • Vertex List   │    │ • Polygon Adjacency              │
│  │ • Polygon Indices│   │ • Edge Connections              │
│  │ • Bounding Box  │    │ • Area Identifiers              │
│  └────────┬────────┘    └────────┬────────┘                │
│           │                      │                         │
│           └──────────┬───────────┘                         │
│                      │                                     │
│           ┌──────────▼──────────┐                         │
│           │ Spatial Index       │                         │
│           │ (BVH / Quadtree)    │                         │
│           └──────────┬──────────┘                         │
│                      │                                     │
│  ┌───────────────────▼───────────────────┐                │
│  │           Query Interface              │                │
│  │                                        │                │
│  │  • Point Location                      │                │
│  │  • Pathfinding                         │                │
│  │  • Raycast                             │                │
│  └────────────────────────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## II. NavMesh Generation Algorithm

### Generation Pipeline Overview

NavMesh generation is the process of converting raw 3D geometry into a navigable polygon mesh:

```
NavMesh Generation Pipeline:

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Geometry   │────▶│  Voxelization│────▶│Region Marking│
└──────────────┘     └──────────────┘     └──────────────┘
                                                │
┌──────────────┐     ┌──────────────┐          │
│   Simplify   │◀────│  Contours    │◀─────────┘
└──────────────┘     └──────────────┘
        │
        ▼
┌──────────────┐     ┌──────────────┐
│  Polygons    │────▶│ Detail Mesh  │
└──────────────┘     └──────────────┘
```

### Voxelization

Voxelization is the process of discretizing continuous 3D geometry into voxels (3D pixels).

```cpp
// Voxelization parameter configuration
struct VoxelConfig {
    float cellSize;        // Horizontal voxel size (typically 0.1-0.3 meters)
    float cellHeight;      // Vertical voxel height (typically half of cellSize)
    float agentHeight;     // Agent height
    float agentRadius;     // Agent radius
    float maxClimb;        // Maximum climbable height (e.g., steps)
    float maxSlope;        // Maximum walkable slope (typically 45-60 degrees)
};

// Voxelization core logic
class Voxelizer {
public:
    void voxelize(const Mesh& mesh, const VoxelConfig& config) {
        // 1. Calculate scene bounding box
        BoundingBox bounds = mesh.getBounds();

        // 2. Create voxel grid
        int width = (int)ceil((bounds.max.x - bounds.min.x) / config.cellSize);
        int height = (int)ceil((bounds.max.y - bounds.min.y) / config.cellHeight);
        int depth = (int)ceil((bounds.max.z - bounds.min.z) / config.cellSize);

        heightfield = new Heightfield(width, height, depth);

        // 3. Rasterize triangles
        for (const Triangle& tri : mesh.triangles) {
            rasterizeTriangle(tri, config);
        }
    }

private:
    void rasterizeTriangle(const Triangle& tri, const VoxelConfig& config) {
        // Calculate the coverage range of the triangle in the voxel grid
        // Update height field for each covered voxel column
        // Mark solid areas and walkable surfaces
    }

    Heightfield* heightfield;
};
```

**Voxelization result example**:

```
Side View (Heightfield):

Height ▲
  8  │        ████
  7  │        ████████
  6  │        ████████
  5  │    ████████████
  4  │    ████████████
  3  │████████████████
  2  │████████████████████
  1  │████████████████████
  0  └────────────────────▶ X

Walkable surface marked as '=':
  8  │        ════
  7  │    ════    ════
  5  │════
  3  │                ════
  0  └────────────────────▶ X
```

### Region Generation and Watershed Algorithm

Region generation divides continuous walkable surfaces into independent navigation regions:

```cpp
// Watershed algorithm for region partitioning
class RegionBuilder {
public:
    void buildRegions(Heightfield& hf, float walkableHeight, float walkableClimb) {
        // 1. Calculate distance field - distance from each voxel to nearest obstacle
        calculateDistanceField(hf);

        // 2. Apply watershed algorithm
        // Start from distance field maxima (region centers)
        // Expand outward until encountering boundaries or other regions

        // 3. Mark region IDs
        int regionId = 0;
        for (int z = 0; z < hf.depth; z++) {
            for (int x = 0; x < hf.width; x++) {
                Span* span = hf.getSpan(x, z);
                while (span) {
                    if (span->isWalkable && span->regionId == 0) {
                        floodFillRegion(hf, x, z, span, ++regionId);
                    }
                    span = span->next;
                }
            }
        }
    }

private:
    void calculateDistanceField(Heightfield& hf) {
        // Use Manhattan or Euclidean distance
        // Propagate distance values inward from boundaries
    }

    void floodFillRegion(Heightfield& hf, int startX, int startZ,
                         Span* startSpan, int regionId) {
        // Flood fill from starting point
        // Stop when encountering large height difference or boundary
    }
};
```

### Contour Tracing

Contour tracing extracts polygon contours from region boundaries:

```cpp
// Contour data structure
struct Contour {
    std::vector<Vector3> vertices;  // Vertex list
    std::vector<int> rawVertices;   // Raw voxel coordinates
    int regionId;                   // Owner region
    int areaType;                   // Area type (ground/water/grass etc)
};

// Contour tracing algorithm
class ContourTracer {
public:
    std::vector<Contour> traceContours(const Heightfield& hf) {
        std::vector<Contour> contours;

        // Iterate through each region
        for (int regionId = 1; regionId <= maxRegionId; regionId++) {
            Contour contour = traceRegionContour(hf, regionId);
            if (contour.vertices.size() >= 3) {
                contours.push_back(contour);
            }
        }

        return contours;
    }

private:
    Contour traceRegionContour(const Heightfield& hf, int regionId) {
        Contour contour;
        contour.regionId = regionId;

        // Find region boundary starting point
        int startX, startZ;
        findBoundaryStart(hf, regionId, startX, startZ);

        // Walk along boundary, collecting vertices
        int x = startX, z = startZ;
        int dir = 0;  // Initial direction

        do {
            contour.rawVertices.push_back(x);
            contour.rawVertices.push_back(z);

            // Try right turn, straight, left turn
            // Similar to "right-hand rule" in maze solving
            dir = getNextDirection(hf, regionId, x, z, dir);
            moveInDirection(x, z, dir);

        } while (x != startX || z != startZ);

        return contour;
    }
};
```

### Convex Polygon Decomposition

Decomposing contours into convex polygons is a key step in NavMesh generation:

```cpp
// Convex polygon decomposition algorithm
class ConvexDecomposer {
public:
    std::vector<Polygon> decompose(const Contour& contour) {
        std::vector<Polygon> polygons;

        // Use ear clipping or other convex decomposition algorithms
        std::vector<int> indices = contour.rawVertices;

        while (indices.size() > 3) {
            // Find an "ear" (convex vertex whose triangle contains no other vertices)
            int earIndex = findEar(indices);

            if (earIndex == -1) {
                // Handle degenerate case
                break;
            }

            // Cut ear, forming triangle
            Triangle tri = cutEar(indices, earIndex);

            // Try to merge adjacent triangles into convex polygon
            mergeIntoConvexPolygon(polygons, tri);
        }

        // Handle remaining triangle
        if (indices.size() == 3) {
            polygons.push_back(createPolygon(indices));
        }

        return polygons;
    }

private:
    int findEar(const std::vector<int>& indices) {
        int n = indices.size() / 2;

        for (int i = 0; i < n; i++) {
            int prev = (i - 1 + n) % n;
            int next = (i + 1) % n;

            Vector2 a(indices[prev*2], indices[prev*2+1]);
            Vector2 b(indices[i*2], indices[i*2+1]);
            Vector2 c(indices[next*2], indices[next*2+1]);

            // Check if convex vertex
            if (!isConvex(a, b, c)) continue;

            // Check if triangle contains other vertices
            if (!containsOtherVertex(indices, a, b, c, i)) {
                return i;
            }
        }

        return -1;
    }

    bool isConvex(Vector2 a, Vector2 b, Vector2 c) {
        // Use cross product to determine vertex convexity
        float cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
        return cross > 0;  // Counterclockwise is convex
    }
};
```

**Convex polygon decomposition illustration**:

```
Original Contour (non-convex):    Decomposed Convex Polygons:

     ┌──────────┐                  ┌──────────┐
     │          │                  │    P1    │
     │    ┌─────┘                  │    ┌─────┘
     │    │                        │    │
     │    └─────┐                  ├────┤
     │          │                  │ P2 │ P3
     └──────────┘                  └────┴──────┘

One concave polygon decomposed into 3 convex polygons: P1, P2, P3
```

### Recast Navigation Mesh Generation Library

[Recast](https://github.com/recastnavigation/recastnavigation) is the most popular open-source NavMesh generation library, adopted by numerous game engines including Unity and Unreal Engine.

```cpp
// Recast NavMesh generation example
#include "Recast.h"
#include "DetourNavMesh.h"

class NavMeshBuilder {
public:
    dtNavMesh* buildNavMesh(const float* vertices, int numVerts,
                            const int* triangles, int numTris) {
        // 1. Configure parameters
        rcConfig config;
        memset(&config, 0, sizeof(config));

        config.cs = 0.3f;              // Voxel horizontal size
        config.ch = 0.2f;              // Voxel height
        config.walkableSlopeAngle = 45.0f;
        config.walkableHeight = (int)ceilf(2.0f / config.ch);   // Agent height
        config.walkableClimb = (int)floorf(0.4f / config.ch);   // Max climb height
        config.walkableRadius = (int)ceilf(0.6f / config.cs);   // Agent radius
        config.maxEdgeLen = (int)(12.0f / config.cs);
        config.maxSimplificationError = 1.3f;
        config.minRegionArea = (int)rcSqr(8);
        config.mergeRegionArea = (int)rcSqr(20);
        config.maxVertsPerPoly = 6;
        config.detailSampleDist = 6.0f;
        config.detailSampleMaxError = 1.0f;

        // Calculate bounding box
        rcCalcBounds(vertices, numVerts, config.bmin, config.bmax);
        rcCalcGridSize(config.bmin, config.bmax, config.cs,
                       &config.width, &config.height);

        // 2. Allocate working memory
        rcContext ctx;
        rcHeightfield* heightfield = rcAllocHeightfield();
        rcCreateHeightfield(&ctx, *heightfield, config.width, config.height,
                           config.bmin, config.bmax, config.cs, config.ch);

        // 3. Rasterize triangles
        unsigned char* triAreas = new unsigned char[numTris];
        memset(triAreas, 0, numTris);
        rcMarkWalkableTriangles(&ctx, config.walkableSlopeAngle,
                                vertices, numVerts, triangles, numTris, triAreas);
        rcRasterizeTriangles(&ctx, vertices, numVerts, triangles, triAreas,
                            numTris, *heightfield, config.walkableClimb);
        delete[] triAreas;

        // 4. Filter non-walkable areas
        rcFilterLowHangingWalkableObstacles(&ctx, config.walkableClimb, *heightfield);
        rcFilterLedgeSpans(&ctx, config.walkableHeight, config.walkableClimb, *heightfield);
        rcFilterWalkableLowHeightSpans(&ctx, config.walkableHeight, *heightfield);

        // 5. Build compact heightfield
        rcCompactHeightfield* compactHeightfield = rcAllocCompactHeightfield();
        rcBuildCompactHeightfield(&ctx, config.walkableHeight, config.walkableClimb,
                                  *heightfield, *compactHeightfield);
        rcFreeHeightField(heightfield);

        // 6. Erode walkable area
        rcErodeWalkableArea(&ctx, config.walkableRadius, *compactHeightfield);

        // 7. Build regions
        rcBuildDistanceField(&ctx, *compactHeightfield);
        rcBuildRegions(&ctx, *compactHeightfield, config.borderSize,
                       config.minRegionArea, config.mergeRegionArea);

        // 8. Trace contours
        rcContourSet* contourSet = rcAllocContourSet();
        rcBuildContours(&ctx, *compactHeightfield, config.maxSimplificationError,
                        config.maxEdgeLen, *contourSet);

        // 9. Build polygon mesh
        rcPolyMesh* polyMesh = rcAllocPolyMesh();
        rcBuildPolyMesh(&ctx, *contourSet, config.maxVertsPerPoly, *polyMesh);

        // 10. Build detail mesh
        rcPolyMeshDetail* detailMesh = rcAllocPolyMeshDetail();
        rcBuildPolyMeshDetail(&ctx, *polyMesh, *compactHeightfield,
                              config.detailSampleDist, config.detailSampleMaxError,
                              *detailMesh);

        // 11. Create Detour NavMesh
        dtNavMeshCreateParams params;
        memset(&params, 0, sizeof(params));
        params.verts = polyMesh->verts;
        params.vertCount = polyMesh->nverts;
        params.polys = polyMesh->polys;
        params.polyAreas = polyMesh->areas;
        params.polyFlags = polyMesh->flags;
        params.polyCount = polyMesh->npolys;
        params.nvp = polyMesh->nvp;
        params.detailMeshes = detailMesh->meshes;
        params.detailVerts = detailMesh->verts;
        params.detailVertsCount = detailMesh->nverts;
        params.detailTris = detailMesh->tris;
        params.detailTriCount = detailMesh->ntris;
        params.walkableHeight = 2.0f;
        params.walkableRadius = 0.6f;
        params.walkableClimb = 0.4f;
        rcVcopy(params.bmin, polyMesh->bmin);
        rcVcopy(params.bmax, polyMesh->bmax);
        params.cs = config.cs;
        params.ch = config.ch;
        params.buildBvTree = true;

        unsigned char* navData = 0;
        int navDataSize = 0;
        dtCreateNavMeshData(&params, &navData, &navDataSize);

        dtNavMesh* navMesh = dtAllocNavMesh();
        navMesh->init(navData, navDataSize, DT_TILE_FREE_DATA);

        // Clean up temporary data
        rcFreeCompactHeightfield(compactHeightfield);
        rcFreeContourSet(contourSet);
        rcFreePolyMesh(polyMesh);
        rcFreePolyMeshDetail(detailMesh);

        return navMesh;
    }
};
```

## III. NavMesh Pathfinding Queries

### A* Algorithm on NavMesh

Pathfinding on NavMesh typically uses a variant of the A* algorithm:

```cpp
// NavMesh A* pathfinding implementation
class NavMeshPathfinder {
public:
    struct PathNode {
        int polygonId;
        float gCost;      // Actual cost from start to current node
        float hCost;      // Heuristic cost from current node to end
        float fCost() const { return gCost + hCost; }
        int parentId;
        Vector3 entryPoint;  // Point entering this polygon
    };

    std::vector<Vector3> findPath(const Vector3& start, const Vector3& end) {
        // 1. Find polygons containing start and end points
        int startPoly = findPolygonContaining(start);
        int endPoly = findPolygonContaining(end);

        if (startPoly == -1 || endPoly == -1) {
            return {};  // Start or end point not on NavMesh
        }

        // 2. A* search
        std::priority_queue<PathNode, std::vector<PathNode>, CompareF> openList;
        std::unordered_set<int> closedList;
        std::unordered_map<int, PathNode> nodeMap;

        PathNode startNode{startPoly, 0, heuristic(start, end), -1, start};
        openList.push(startNode);
        nodeMap[startPoly] = startNode;

        while (!openList.empty()) {
            PathNode current = openList.top();
            openList.pop();

            if (current.polygonId == endPoly) {
                // Found path, reconstruct it
                return reconstructPath(nodeMap, current, start, end);
            }

            closedList.insert(current.polygonId);

            // Iterate through adjacent polygons
            for (int neighborId : getNeighbors(current.polygonId)) {
                if (closedList.count(neighborId)) continue;

                // Calculate optimal crossing point through shared edge
                Edge sharedEdge = getSharedEdge(current.polygonId, neighborId);
                Vector3 crossingPoint = findBestCrossingPoint(
                    current.entryPoint, end, sharedEdge);

                float newGCost = current.gCost +
                    distance(current.entryPoint, crossingPoint);

                auto it = nodeMap.find(neighborId);
                if (it == nodeMap.end() || newGCost < it->second.gCost) {
                    PathNode neighbor{
                        neighborId,
                        newGCost,
                        heuristic(crossingPoint, end),
                        current.polygonId,
                        crossingPoint
                    };
                    openList.push(neighbor);
                    nodeMap[neighborId] = neighbor;
                }
            }
        }

        return {};  // No path found
    }

private:
    float heuristic(const Vector3& a, const Vector3& b) {
        // Euclidean distance as heuristic function
        return distance(a, b);
    }

    Vector3 findBestCrossingPoint(const Vector3& from, const Vector3& to,
                                   const Edge& edge) {
        // Find the point on edge closest to the line
        // This point is the optimal location for crossing this edge
        Vector3 lineDir = normalize(to - from);
        Vector3 edgeDir = normalize(edge.end - edge.start);

        // Calculate projection point and clamp to edge range
        float t = clamp(dot(from - edge.start, edgeDir) /
                       dot(edge.end - edge.start, edgeDir), 0.0f, 1.0f);

        return edge.start + t * (edge.end - edge.start);
    }
};
```

### Funnel Algorithm

The path found by A* is a sequence of polygons. To convert it into a smooth point path, we use the Funnel Algorithm (also called Simple Stupid Funnel Algorithm):

```cpp
// Funnel algorithm implementation
class FunnelAlgorithm {
public:
    std::vector<Vector3> stringPull(const std::vector<int>& polyPath,
                                     const Vector3& start,
                                     const Vector3& end) {
        if (polyPath.empty()) return {start, end};
        if (polyPath.size() == 1) return {start, end};

        std::vector<Vector3> path;
        path.push_back(start);

        // Collect all portals (shared edges between adjacent polygons)
        std::vector<Portal> portals;
        for (size_t i = 0; i < polyPath.size() - 1; i++) {
            Edge edge = getSharedEdge(polyPath[i], polyPath[i + 1]);
            portals.push_back({edge.start, edge.end});
        }
        // Add end point as final portal
        portals.push_back({end, end});

        // Funnel state
        Vector3 apex = start;       // Funnel apex
        Vector3 left = start;       // Funnel left boundary
        Vector3 right = start;      // Funnel right boundary
        int apexIndex = 0;
        int leftIndex = 0;
        int rightIndex = 0;

        for (size_t i = 0; i < portals.size(); i++) {
            Vector3 portalLeft = portals[i].left;
            Vector3 portalRight = portals[i].right;

            // Update right boundary
            if (triArea2D(apex, right, portalRight) <= 0.0f) {
                if (apex == right || triArea2D(apex, left, portalRight) > 0.0f) {
                    // Tighten funnel
                    right = portalRight;
                    rightIndex = i;
                } else {
                    // Right boundary crosses left boundary, add left vertex to path
                    path.push_back(left);

                    // Reset funnel
                    apex = left;
                    apexIndex = leftIndex;
                    left = apex;
                    right = apex;
                    leftIndex = apexIndex;
                    rightIndex = apexIndex;
                    i = apexIndex;
                    continue;
                }
            }

            // Update left boundary
            if (triArea2D(apex, left, portalLeft) >= 0.0f) {
                if (apex == left || triArea2D(apex, right, portalLeft) < 0.0f) {
                    // Tighten funnel
                    left = portalLeft;
                    leftIndex = i;
                } else {
                    // Left boundary crosses right boundary, add right vertex to path
                    path.push_back(right);

                    // Reset funnel
                    apex = right;
                    apexIndex = rightIndex;
                    left = apex;
                    right = apex;
                    leftIndex = apexIndex;
                    rightIndex = apexIndex;
                    i = apexIndex;
                    continue;
                }
            }
        }

        path.push_back(end);
        return path;
    }

private:
    struct Portal {
        Vector3 left;
        Vector3 right;
    };

    // Calculate twice the signed area of a triangle (for determining point relationships)
    float triArea2D(const Vector3& a, const Vector3& b, const Vector3& c) {
        return (b.x - a.x) * (c.z - a.z) - (c.x - a.x) * (b.z - a.z);
    }
};
```

**Funnel algorithm visualization**:

```
Start point S, end point E, polygon boundaries marked with |

Step 1: Initialize funnel
          S (apex)
         /|\
        / | \
       /  |  \
      L   |   R    Funnel opens

Step 2: Process first portal
          S
         /|\
        / | \
       L' |  R'    Funnel tightens

Step 3: Left boundary crosses right boundary
          S
           \
            R  ← Add to path
           /|\
          / | \
         L  |  R'

Step 4: Continue until end point
      S ──→ R ──→ E

Final path: S → R → E
```

### Point Location Query

Quickly determining which polygon contains a point is a fundamental operation in NavMesh systems:

```cpp
// Point location using BVH acceleration
class PointLocator {
public:
    struct BVHNode {
        BoundingBox bounds;
        int polygonId;       // Leaf: polygon ID, internal: -1
        int leftChild;
        int rightChild;
    };

    int findPolygon(const Vector3& point) {
        return queryBVH(point, 0);
    }

private:
    int queryBVH(const Vector3& point, int nodeIndex) {
        const BVHNode& node = nodes[nodeIndex];

        // Check if point is within node bounding box
        if (!node.bounds.contains(point)) {
            return -1;
        }

        // Leaf node: precise test if point is in polygon
        if (node.polygonId >= 0) {
            if (isPointInPolygon(point, node.polygonId)) {
                return node.polygonId;
            }
            return -1;
        }

        // Internal node: recursively query child nodes
        int result = queryBVH(point, node.leftChild);
        if (result >= 0) return result;

        return queryBVH(point, node.rightChild);
    }

    bool isPointInPolygon(const Vector3& point, int polygonId) {
        const Polygon& poly = polygons[polygonId];

        // Use ray casting or barycentric coordinates to test point-in-polygon
        int n = poly.vertices.size();
        bool inside = false;

        for (int i = 0, j = n - 1; i < n; j = i++) {
            Vector3 vi = poly.vertices[i];
            Vector3 vj = poly.vertices[j];

            if ((vi.z > point.z) != (vj.z > point.z) &&
                point.x < (vj.x - vi.x) * (point.z - vi.z) / (vj.z - vi.z) + vi.x) {
                inside = !inside;
            }
        }

        return inside;
    }

    std::vector<BVHNode> nodes;
    std::vector<Polygon> polygons;
};
```

## IV. Dynamic Obstacle Handling

### Challenges with Dynamic Obstacles

Games often need to handle dynamic obstacles (such as moving NPCs, destructible walls, etc.), which pose additional challenges to the NavMesh system:

```
Problems with Static NavMesh:

Time T0:                      Time T1:
┌───────────────────┐        ┌───────────────────┐
│                   │        │        ███        │
│    A ────────→ B  │        │    A ──███──→ B   │
│                   │        │        ███        │
└───────────────────┘        └───────────────────┘

Without updating NavMesh, Agent will attempt to pass through new obstacle
```

### Local Rebuild Strategy

For dynamically changing scenes, we can employ local rebuild strategies:

```cpp
// Dynamic NavMesh update manager
class DynamicNavMeshManager {
public:
    void addObstacle(const Obstacle& obstacle) {
        // 1. Find affected polygons
        std::vector<int> affectedPolys = findAffectedPolygons(obstacle);

        // 2. Mark these polygons for rebuild
        for (int polyId : affectedPolys) {
            markDirty(polyId);
        }

        // 3. Add to obstacle list
        obstacles.push_back(obstacle);

        // 4. Schedule asynchronous rebuild
        scheduleRebuild();
    }

    void removeObstacle(int obstacleId) {
        const Obstacle& obstacle = obstacles[obstacleId];

        // 1. Find affected polygons
        std::vector<int> affectedPolys = findAffectedPolygons(obstacle);

        // 2. Remove obstacle
        obstacles.erase(obstacles.begin() + obstacleId);

        // 3. Trigger rebuild
        for (int polyId : affectedPolys) {
            markDirty(polyId);
        }
        scheduleRebuild();
    }

private:
    void rebuildDirtyRegions() {
        for (int polyId : dirtyPolygons) {
            // Get original polygon area bounds
            BoundingBox region = getPolygonBounds(polyId);

            // Expand region to include edge effects
            region.expand(agentRadius);

            // Regenerate NavMesh for this region
            NavMesh localMesh = regenerateRegion(region);

            // Merge into main NavMesh
            mergeNavMesh(localMesh);
        }

        dirtyPolygons.clear();
    }

    std::vector<Obstacle> obstacles;
    std::set<int> dirtyPolygons;
};
```

### Tiled NavMesh

Tiled NavMesh divides large scenes into multiple independent tiles, supporting efficient local updates:

```cpp
// Tiled NavMesh implementation
class TiledNavMesh {
public:
    struct Tile {
        BoundingBox bounds;
        NavMesh* navMesh;
        std::vector<OffMeshConnection> connections;  // Connections with other tiles
        bool isDirty;
    };

    TiledNavMesh(float tileSize, const BoundingBox& worldBounds)
        : tileSize(tileSize) {
        // Calculate tile grid dimensions
        int tilesX = (int)ceil((worldBounds.max.x - worldBounds.min.x) / tileSize);
        int tilesZ = (int)ceil((worldBounds.max.z - worldBounds.min.z) / tileSize);

        tiles.resize(tilesX * tilesZ);

        // Initialize each tile
        for (int z = 0; z < tilesZ; z++) {
            for (int x = 0; x < tilesX; x++) {
                int index = z * tilesX + x;
                tiles[index].bounds = calculateTileBounds(x, z);
                tiles[index].navMesh = nullptr;
                tiles[index].isDirty = true;
            }
        }
    }

    void rebuildTile(int tileX, int tileZ) {
        int index = tileZ * tilesX + tileX;
        Tile& tile = tiles[index];

        // Free old NavMesh
        if (tile.navMesh) {
            delete tile.navMesh;
        }

        // Collect geometry within tile bounds
        std::vector<Triangle> geometry = collectGeometry(tile.bounds);

        // Generate new NavMesh
        tile.navMesh = buildNavMesh(geometry);

        // Rebuild connections with adjacent tiles
        rebuildConnections(tileX, tileZ);

        tile.isDirty = false;
    }

    std::vector<Vector3> findPath(const Vector3& start, const Vector3& end) {
        // 1. Determine which tiles contain start and end points
        int startTileX, startTileZ, endTileX, endTileZ;
        getTileCoords(start, startTileX, startTileZ);
        getTileCoords(end, endTileX, endTileZ);

        // 2. If within same tile, pathfind directly in that tile
        if (startTileX == endTileX && startTileZ == endTileZ) {
            return findPathInTile(start, end, startTileX, startTileZ);
        }

        // 3. Cross-tile pathfinding: first find tile-level path
        std::vector<int> tilePath = findTilePath(startTileX, startTileZ,
                                                  endTileX, endTileZ);

        // 4. Then refine path within each tile
        return refinePath(tilePath, start, end);
    }

private:
    float tileSize;
    int tilesX, tilesZ;
    std::vector<Tile> tiles;
};
```

### NavMesh Carving

Another method for handling dynamic obstacles is using carving layers without modifying the original NavMesh:

```cpp
// NavMesh carving implementation
class NavMeshCarver {
public:
    // Add temporary obstacle (without modifying original NavMesh)
    int addCarve(const ConvexShape& shape) {
        Carve carve;
        carve.id = nextCarveId++;
        carve.shape = shape;
        carve.affectedPolys = findIntersectingPolygons(shape);

        // Calculate effective area after obstacle carving
        for (int polyId : carve.affectedPolys) {
            carve.modifiedPolys[polyId] = subtractShape(polygons[polyId], shape);
        }

        carves[carve.id] = carve;
        return carve.id;
    }

    void removeCarve(int carveId) {
        carves.erase(carveId);
    }

    // Consider carve impact when querying
    bool isPointWalkable(const Vector3& point) {
        // First check if on original NavMesh
        int polyId = findPolygon(point);
        if (polyId < 0) return false;

        // Check if blocked by any carve
        for (const auto& [id, carve] : carves) {
            if (carve.shape.contains(point)) {
                return false;
            }
        }

        return true;
    }

private:
    struct Carve {
        int id;
        ConvexShape shape;
        std::vector<int> affectedPolys;
        std::map<int, std::vector<Polygon>> modifiedPolys;
    };

    int nextCarveId = 0;
    std::map<int, Carve> carves;
};
```

## V. NavMesh Agent System

### Agent Configuration

NavMesh agents are entities that move on NavMesh and require various configuration parameters:

```cpp
// NavMesh agent configuration
struct NavMeshAgentConfig {
    float radius;           // Agent radius
    float height;           // Agent height
    float maxSpeed;         // Maximum movement speed
    float acceleration;     // Acceleration
    float angularSpeed;     // Maximum rotation speed
    float stoppingDistance; // Stopping distance
    float baseOffset;       // Height offset from NavMesh
    int avoidancePriority;  // Avoidance priority
    bool autoRepath;        // Enable automatic rerouting
    float autoRepathRate;   // Rerouting frequency
};

// NavMesh agent implementation
class NavMeshAgent {
public:
    NavMeshAgent(const NavMeshAgentConfig& config) : config(config) {}

    void setDestination(const Vector3& target) {
        destination = target;
        hasPath = calculatePath();
    }

    void update(float deltaTime) {
        if (!hasPath || path.empty()) return;

        // 1. Get direction to next path point
        Vector3 currentTarget = path[currentPathIndex];
        Vector3 direction = normalize(currentTarget - position);

        // 2. Smooth rotation
        if (dot(forward, direction) < 0.99f) {
            float angle = acos(clamp(dot(forward, direction), -1.0f, 1.0f));
            float rotationAmount = min(config.angularSpeed * deltaTime, angle);
            forward = rotateTowards(forward, direction, rotationAmount);
        }

        // 3. Movement
        float distanceToTarget = distance(position, currentTarget);

        // Calculate desired speed
        float desiredSpeed = config.maxSpeed;
        if (currentPathIndex == path.size() - 1) {
            // Slow down approaching end point
            if (distanceToTarget < config.stoppingDistance * 2) {
                desiredSpeed *= (distanceToTarget / (config.stoppingDistance * 2));
            }
        }

        // Accelerate/decelerate
        currentSpeed = moveTowards(currentSpeed, desiredSpeed,
                                   config.acceleration * deltaTime);

        // Update position
        Vector3 movement = forward * currentSpeed * deltaTime;
        position += movement;

        // 4. Check if reached current path point
        if (distanceToTarget < config.stoppingDistance) {
            currentPathIndex++;
            if (currentPathIndex >= path.size()) {
                // Reached end point
                hasPath = false;
                currentSpeed = 0;
            }
        }

        // 5. Constrain agent to NavMesh
        constrainToNavMesh();
    }

private:
    bool calculatePath() {
        path = navMesh->findPath(position, destination);
        currentPathIndex = 0;
        return !path.empty();
    }

    void constrainToNavMesh() {
        // Find nearest NavMesh surface point
        Vector3 nearestPoint;
        int nearestPoly;

        if (navMesh->findNearestPoint(position, nearestPoint, nearestPoly)) {
            // If drifted too far, pull agent back
            float dist = distance(position, nearestPoint);
            if (dist > config.radius) {
                position = nearestPoint;
            }

            // Adjust height to match ground
            position.y = nearestPoint.y + config.baseOffset;
        }
    }

    NavMeshAgentConfig config;
    Vector3 position;
    Vector3 forward;
    Vector3 destination;
    float currentSpeed = 0;

    std::vector<Vector3> path;
    int currentPathIndex = 0;
    bool hasPath = false;

    NavMesh* navMesh;
};
```

### Local Avoidance

When multiple agents move simultaneously, local avoidance is needed to prevent collisions:

```cpp
// RVO (Reciprocal Velocity Obstacles) avoidance algorithm
class RVOAvoidance {
public:
    Vector3 computeNewVelocity(const Agent& agent,
                                const std::vector<Agent>& neighbors,
                                const Vector3& preferredVelocity) {
        std::vector<VelocityObstacle> velocityObstacles;

        // Compute velocity obstacles for each neighbor
        for (const Agent& neighbor : neighbors) {
            VelocityObstacle vo = computeVelocityObstacle(agent, neighbor);
            velocityObstacles.push_back(vo);
        }

        // Search for optimal velocity in velocity space
        // This velocity should:
        // 1. Not be inside any velocity obstacle (avoid collision)
        // 2. Be as close as possible to preferred velocity (toward goal)
        // 3. Not exceed maximum speed

        return findOptimalVelocity(preferredVelocity, velocityObstacles,
                                   agent.maxSpeed);
    }

private:
    struct VelocityObstacle {
        Vector3 apex;
        Vector3 leftLeg;
        Vector3 rightLeg;
    };

    VelocityObstacle computeVelocityObstacle(const Agent& a, const Agent& b) {
        VelocityObstacle vo;

        Vector3 relativePos = b.position - a.position;
        float dist = length(relativePos);
        float combinedRadius = a.radius + b.radius;

        // Velocity obstacle apex is at relative position
        vo.apex = b.velocity;

        // Calculate tangent directions (two edges of velocity obstacle)
        float angle = asin(clamp(combinedRadius / dist, -1.0f, 1.0f));
        Vector3 dir = normalize(relativePos);

        vo.leftLeg = rotateVector(dir, angle);
        vo.rightLeg = rotateVector(dir, -angle);

        return vo;
    }

    Vector3 findOptimalVelocity(const Vector3& preferred,
                                 const std::vector<VelocityObstacle>& obstacles,
                                 float maxSpeed) {
        // Use ORCA (Optimal Reciprocal Collision Avoidance) or
        // sampling method to find optimal velocity

        const int numSamples = 100;
        Vector3 bestVelocity = Vector3::zero();
        float bestPenalty = FLT_MAX;

        for (int i = 0; i < numSamples; i++) {
            // Sample velocity space randomly
            Vector3 sample = sampleVelocity(maxSpeed);

            // Calculate penalty value
            float penalty = 0;

            // Deviation from preferred velocity
            penalty += length(sample - preferred);

            // Collision time with velocity obstacles
            for (const auto& vo : obstacles) {
                float timeToCollision = computeTimeToCollision(sample, vo);
                if (timeToCollision < 2.0f) {  // Will collide within 2 seconds
                    penalty += (2.0f - timeToCollision) * 10.0f;
                }
            }

            if (penalty < bestPenalty) {
                bestPenalty = penalty;
                bestVelocity = sample;
            }
        }

        return bestVelocity;
    }
};
```

## VI. Areas and Cost System

### NavMesh Area Types

Different terrain types can be marked with different area labels, affecting pathfinding decisions:

```cpp
// Area type definitions
enum class NavMeshAreaType : uint8_t {
    Walkable = 0,      // Normal walkable area
    Grass = 1,         // Grass (may slow down)
    Water = 2,         // Shallow water (significantly slows down)
    Road = 3,          // Road (speeds up)
    Mud = 4,           // Mud (slows down)
    Lava = 5,          // Lava (dangerous area)
    NotWalkable = 255  // Non-walkable
};

// Area cost configuration
struct AreaCostConfig {
    std::map<NavMeshAreaType, float> costs = {
        {NavMeshAreaType::Walkable, 1.0f},
        {NavMeshAreaType::Grass, 1.5f},
        {NavMeshAreaType::Water, 3.0f},
        {NavMeshAreaType::Road, 0.5f},
        {NavMeshAreaType::Mud, 2.0f},
        {NavMeshAreaType::Lava, 100.0f}  // Very high cost
    };

    float getCost(NavMeshAreaType type) const {
        auto it = costs.find(type);
        return it != costs.end() ? it->second : 1.0f;
    }
};
```

### Cost-aware Pathfinding

Consider area costs when pathfinding:

```cpp
// Cost-aware A* pathfinding
class CostAwarePathfinder {
public:
    CostAwarePathfinder(const AreaCostConfig& costConfig)
        : costConfig(costConfig) {}

    std::vector<Vector3> findPath(const Vector3& start, const Vector3& end,
                                   uint32_t allowedAreaMask = 0xFFFFFFFF) {
        // allowedAreaMask can be used to forbid certain areas
        // Example: 0xFFFFFFFB forbids entering water (bit 2)

        int startPoly = navMesh->findPolygon(start);
        int endPoly = navMesh->findPolygon(end);

        if (startPoly < 0 || endPoly < 0) return {};

        // Check if start and end are in allowed areas
        if (!isAreaAllowed(startPoly, allowedAreaMask) ||
            !isAreaAllowed(endPoly, allowedAreaMask)) {
            return {};
        }

        // Use cost-aware A* algorithm
        auto compare = [](const PathNode& a, const PathNode& b) {
            return a.fCost() > b.fCost();
        };
        std::priority_queue<PathNode, std::vector<PathNode>, decltype(compare)>
            openList(compare);

        std::unordered_map<int, PathNode> allNodes;

        PathNode startNode;
        startNode.polyId = startPoly;
        startNode.gCost = 0;
        startNode.hCost = heuristic(start, end);
        startNode.point = start;

        openList.push(startNode);
        allNodes[startPoly] = startNode;

        while (!openList.empty()) {
            PathNode current = openList.top();
            openList.pop();

            if (current.polyId == endPoly) {
                return reconstructPath(allNodes, current, end);
            }

            // Iterate through neighbors
            for (int neighborId : navMesh->getNeighbors(current.polyId)) {
                // Check if entering this area is allowed
                if (!isAreaAllowed(neighborId, allowedAreaMask)) continue;

                // Calculate cost to neighbor
                Edge edge = navMesh->getSharedEdge(current.polyId, neighborId);
                Vector3 crossPoint = findCrossPoint(current.point, end, edge);

                float moveCost = distance(current.point, crossPoint);
                float areaCost = costConfig.getCost(navMesh->getAreaType(neighborId));
                float totalCost = moveCost * areaCost;

                float newGCost = current.gCost + totalCost;

                auto it = allNodes.find(neighborId);
                if (it == allNodes.end() || newGCost < it->second.gCost) {
                    PathNode neighbor;
                    neighbor.polyId = neighborId;
                    neighbor.gCost = newGCost;
                    neighbor.hCost = heuristic(crossPoint, end) *
                                     costConfig.getCost(navMesh->getAreaType(neighborId));
                    neighbor.parentId = current.polyId;
                    neighbor.point = crossPoint;

                    openList.push(neighbor);
                    allNodes[neighborId] = neighbor;
                }
            }
        }

        return {};
    }

private:
    bool isAreaAllowed(int polyId, uint32_t mask) {
        NavMeshAreaType type = navMesh->getAreaType(polyId);
        return (mask & (1 << static_cast<int>(type))) != 0;
    }

    AreaCostConfig costConfig;
    NavMesh* navMesh;
};
```

### Off-Mesh Links

Off-Mesh Links represent special connections outside the NavMesh, such as jumps, climbs, and portals:

```cpp
// Off-Mesh Link definition
struct OffMeshLink {
    Vector3 startPoint;
    Vector3 endPoint;
    float radius;           // Maximum agent radius that can use this link
    bool bidirectional;     // Whether bidirectional
    uint8_t areaType;       // Area type (for cost calculation)
    uint16_t flags;         // Custom flags

    enum Flags : uint16_t {
        None = 0,
        Jump = 1 << 0,      // Requires jump
        Climb = 1 << 1,     // Requires climb
        Drop = 1 << 2,      // Requires drop
        Teleport = 1 << 3,  // Teleport
        Door = 1 << 4       // Door (may need to open)
    };
};

// Using Off-Mesh Links in pathfinding
class NavMeshWithLinks {
public:
    void addOffMeshLink(const OffMeshLink& link) {
        // Find polygons containing start and end points
        int startPoly = findPolygon(link.startPoint);
        int endPoly = findPolygon(link.endPoint);

        if (startPoly >= 0 && endPoly >= 0) {
            offMeshLinks.push_back(link);

            // Add to adjacency relationships
            int linkId = offMeshLinks.size() - 1;
            linkConnections[startPoly].push_back({linkId, endPoly});

            if (link.bidirectional) {
                linkConnections[endPoly].push_back({linkId, startPoly});
            }
        }
    }

    std::vector<Vector3> findPath(const Vector3& start, const Vector3& end,
                                   uint16_t allowedLinkFlags = 0xFFFF) {
        // On top of standard A*, treat Off-Mesh Links as additional neighbors
        // ...

        // When processing neighbors:
        for (int neighborId : getNeighbors(current.polyId)) {
            // Standard neighbor handling...
        }

        // Check Off-Mesh Links
        for (const auto& [linkId, targetPoly] : linkConnections[current.polyId]) {
            const OffMeshLink& link = offMeshLinks[linkId];

            // Check if agent can use this link
            if (agentRadius > link.radius) continue;
            if ((link.flags & allowedLinkFlags) == 0) continue;

            // Handle Off-Mesh Link as neighbor
            // ...
        }
    }

private:
    std::vector<OffMeshLink> offMeshLinks;
    std::map<int, std::vector<std::pair<int, int>>> linkConnections;  // polyId -> [(linkId, targetPoly)]
};
```

## VII. Unity NavMesh System

### Unity NavMesh Components

Unity provides a complete NavMesh system with the following main components:

```csharp
// Unity NavMesh basic usage example
using UnityEngine;
using UnityEngine.AI;

public class NavMeshExample : MonoBehaviour
{
    // NavMesh Agent component
    private NavMeshAgent agent;

    // Target position
    public Transform target;

    void Start()
    {
        agent = GetComponent<NavMeshAgent>();

        // Configure agent parameters
        agent.speed = 3.5f;
        agent.angularSpeed = 120f;
        agent.acceleration = 8f;
        agent.stoppingDistance = 0.5f;
        agent.autoBraking = true;
    }

    void Update()
    {
        // Set target position
        if (target != null)
        {
            agent.SetDestination(target.position);
        }

        // Check path status
        if (agent.pathPending)
        {
            Debug.Log("Computing path...");
        }
        else if (agent.pathStatus == NavMeshPathStatus.PathComplete)
        {
            Debug.Log("Path computed successfully");
        }
        else if (agent.pathStatus == NavMeshPathStatus.PathPartial)
        {
            Debug.Log("Only partial path found");
        }
        else if (agent.pathStatus == NavMeshPathStatus.PathInvalid)
        {
            Debug.Log("No path found");
        }
    }
}
```

### Dynamic NavMesh Baking

Unity supports runtime NavMesh generation:

```csharp
using UnityEngine;
using UnityEngine.AI;
using Unity.AI.Navigation;

public class DynamicNavMeshBuilder : MonoBehaviour
{
    private NavMeshSurface navMeshSurface;

    void Start()
    {
        // Get or add NavMeshSurface component
        navMeshSurface = GetComponent<NavMeshSurface>();
        if (navMeshSurface == null)
        {
            navMeshSurface = gameObject.AddComponent<NavMeshSurface>();
        }

        // Configure NavMesh parameters
        navMeshSurface.agentTypeID = 0;  // Use default agent type
        navMeshSurface.collectObjects = CollectObjects.All;
        navMeshSurface.useGeometry = NavMeshCollectGeometry.RenderMeshes;

        // Initial baking
        BuildNavMesh();
    }

    public void BuildNavMesh()
    {
        // Synchronous baking (may cause stuttering)
        navMeshSurface.BuildNavMesh();
    }

    public void BuildNavMeshAsync()
    {
        // Asynchronous baking (recommended for large scenes)
        StartCoroutine(BuildNavMeshCoroutine());
    }

    private System.Collections.IEnumerator BuildNavMeshCoroutine()
    {
        var operation = navMeshSurface.UpdateNavMesh(navMeshSurface.navMeshData);

        while (!operation.isDone)
        {
            Debug.Log($"NavMesh building progress: {operation.progress * 100}%");
            yield return null;
        }

        Debug.Log("NavMesh building completed");
    }
}
```

### NavMesh Obstacles

```csharp
using UnityEngine;
using UnityEngine.AI;

public class NavMeshObstacleExample : MonoBehaviour
{
    private NavMeshObstacle obstacle;

    void Start()
    {
        obstacle = GetComponent<NavMeshObstacle>();

        // Configure obstacle
        obstacle.carving = true;        // Enable carving (modifies NavMesh)
        obstacle.carveOnlyStationary = true;  // Only carve when stationary
        obstacle.carvingMoveThreshold = 0.1f;
        obstacle.carvingTimeToStationary = 0.5f;

        // Set shape
        obstacle.shape = NavMeshObstacleShape.Box;
        obstacle.size = new Vector3(2f, 2f, 2f);
    }

    // Temporarily disable obstacle (e.g., opening door)
    public void OpenDoor()
    {
        obstacle.enabled = false;
    }

    public void CloseDoor()
    {
        obstacle.enabled = true;
    }
}
```

### Custom Areas and Costs

```csharp
using UnityEngine;
using UnityEngine.AI;

public class AreaCostExample : MonoBehaviour
{
    private NavMeshAgent agent;

    // Area IDs (defined in Navigation window)
    private const int AreaWater = 3;
    private const int AreaRoad = 4;
    private const int AreaGrass = 5;

    void Start()
    {
        agent = GetComponent<NavMeshAgent>();

        // Set area costs
        agent.SetAreaCost(AreaWater, 10f);   // High cost for water
        agent.SetAreaCost(AreaRoad, 0.5f);   // Low cost for roads
        agent.SetAreaCost(AreaGrass, 2f);    // Medium cost for grass
    }

    // Forbid entering certain areas
    public void AvoidWater()
    {
        // areaMask is a bitmask, each bit represents an area
        int walkableMask = NavMesh.AllAreas & ~(1 << AreaWater);
        agent.areaMask = walkableMask;
    }

    // Allow entering all areas
    public void AllowAllAreas()
    {
        agent.areaMask = NavMesh.AllAreas;
    }
}
```

### Off-Mesh Link Usage

```csharp
using UnityEngine;
using UnityEngine.AI;

public class OffMeshLinkHandler : MonoBehaviour
{
    private NavMeshAgent agent;

    void Start()
    {
        agent = GetComponent<NavMeshAgent>();
    }

    void Update()
    {
        // Check if traversing Off-Mesh Link
        if (agent.isOnOffMeshLink)
        {
            StartCoroutine(HandleOffMeshLink());
        }
    }

    private System.Collections.IEnumerator HandleOffMeshLink()
    {
        // Disable automatic movement
        agent.autoTraverseOffMeshLink = false;

        OffMeshLinkData data = agent.currentOffMeshLinkData;
        Vector3 startPos = agent.transform.position;
        Vector3 endPos = data.endPos + Vector3.up * agent.baseOffset;

        // Determine link type and execute corresponding animation
        if (data.linkType == OffMeshLinkType.LinkTypeJumpAcross)
        {
            // Jump animation
            yield return StartCoroutine(JumpAcross(startPos, endPos));
        }
        else if (data.linkType == OffMeshLinkType.LinkTypeDropDown)
        {
            // Drop animation
            yield return StartCoroutine(DropDown(startPos, endPos));
        }
        else
        {
            // Default: linear movement
            yield return StartCoroutine(LinearMove(startPos, endPos));
        }

        // Complete Off-Mesh Link traversal
        agent.CompleteOffMeshLink();
    }

    private System.Collections.IEnumerator JumpAcross(Vector3 start, Vector3 end)
    {
        float duration = 0.5f;
        float elapsed = 0f;
        float height = 1.5f;

        while (elapsed < duration)
        {
            float t = elapsed / duration;

            // Parabolic trajectory
            Vector3 pos = Vector3.Lerp(start, end, t);
            pos.y += height * 4f * t * (1f - t);  // Parabolic height

            transform.position = pos;
            elapsed += Time.deltaTime;
            yield return null;
        }

        transform.position = end;
    }

    private System.Collections.IEnumerator DropDown(Vector3 start, Vector3 end)
    {
        float gravity = 10f;
        Vector3 velocity = Vector3.zero;

        while (transform.position.y > end.y + 0.1f)
        {
            velocity.y -= gravity * Time.deltaTime;
            transform.position += velocity * Time.deltaTime;
            yield return null;
        }

        transform.position = end;
    }

    private System.Collections.IEnumerator LinearMove(Vector3 start, Vector3 end)
    {
        float speed = agent.speed;

        while (Vector3.Distance(transform.position, end) > 0.1f)
        {
            transform.position = Vector3.MoveTowards(
                transform.position, end, speed * Time.deltaTime);
            yield return null;
        }

        transform.position = end;
    }
}
```

## VIII. Unreal Engine NavMesh System

### Basic Navigation Configuration

```cpp
// Unreal Engine NavMesh basic usage
#include "NavigationSystem.h"
#include "AIController.h"
#include "NavigationPath.h"

// Use navigation in AI Controller
void AMyAIController::MoveToTarget(AActor* TargetActor)
{
    if (!TargetActor) return;

    // Use built-in movement function
    MoveToActor(TargetActor,
                50.0f,  // AcceptanceRadius
                true,   // bStopOnOverlap
                true,   // bUsePathfinding
                false,  // bCanStrafe
                nullptr, // FilterClass
                true);  // bAllowPartialPath
}

// Manual path query
void AMyAIController::FindPathToLocation(FVector Destination)
{
    UNavigationSystemV1* NavSys = FNavigationSystem::GetCurrent<UNavigationSystemV1>(GetWorld());
    if (!NavSys) return;

    FPathFindingQuery Query;
    Query.StartLocation = GetPawn()->GetActorLocation();
    Query.EndLocation = Destination;
    Query.NavData = NavSys->GetDefaultNavDataInstance();

    FPathFindingResult Result = NavSys->FindPathSync(Query);

    if (Result.IsSuccessful())
    {
        TArray<FNavPathPoint>& PathPoints = Result.Path->GetPathPoints();
        for (const FNavPathPoint& Point : PathPoints)
        {
            UE_LOG(LogTemp, Log, TEXT("Path Point: %s"), *Point.Location.ToString());
        }
    }
}
```

### Custom Navigation Areas

```cpp
// Custom navigation area class
UCLASS()
class UNavArea_Water : public UNavArea
{
    GENERATED_BODY()

public:
    UNavArea_Water()
    {
        // Set area cost
        DefaultCost = 5.0f;

        // Set area color (for visualization)
        DrawColor = FColor::Blue;

        // Set area flags
        AreaFlags = ENavAreaFlag::Default;
    }
};

// Configure agent to use custom area costs
void AMyAIController::ConfigureNavigation()
{
    UNavigationSystemV1* NavSys = FNavigationSystem::GetCurrent<UNavigationSystemV1>(GetWorld());
    if (!NavSys) return;

    // Get navigation query filter
    FSharedConstNavQueryFilter QueryFilter = NavSys->GetDefaultQueryFilter();

    // Modify area costs
    // Note: This requires creating a custom FNavigationQueryFilter
}

// More commonly used in blueprints via Nav Modifier Volume
// This is an actor placed in the scene that can modify navigation properties within its bounds
```

### Dynamic Navigation Mesh

```cpp
// Runtime NavMesh updates
void AMyGameMode::UpdateNavMesh(FBox UpdateBounds)
{
    UNavigationSystemV1* NavSys = FNavigationSystem::GetCurrent<UNavigationSystemV1>(GetWorld());
    if (!NavSys) return;

    // Mark area for update
    NavSys->AddDirtyArea(UpdateBounds, ENavigationDirtyFlag::All);

    // Or force immediate rebuild
    // NavSys->Build();
}

// Dynamic obstacle component
UCLASS()
class UDynamicObstacleComponent : public UNavModifierComponent
{
    GENERATED_BODY()

public:
    UDynamicObstacleComponent()
    {
        // Set as dynamic obstacle
        bAutoActivate = true;
        AreaClass = UNavArea_Null::StaticClass();  // Non-walkable area
    }

    void ActivateObstacle()
    {
        SetAreaClass(UNavArea_Null::StaticClass());
    }

    void DeactivateObstacle()
    {
        SetAreaClass(UNavArea_Default::StaticClass());
    }
};
```

### Nav Link Proxy (Off-Mesh Link)

```cpp
// Custom Nav Link Proxy
UCLASS()
class AMyNavLinkProxy : public ANavLinkProxy
{
    GENERATED_BODY()

public:
    AMyNavLinkProxy()
    {
        // Enable smart links (requires code control for switching)
        bSmartLinkIsRelevant = true;
    }

    // Override link switch logic
    virtual bool IsNavigationRelevant() const override
    {
        // Example: only passable when door is open
        return bIsDoorOpen;
    }

    // Handle agent traversing link
    UFUNCTION()
    void OnSmartLinkReached(AActor* MovingActor, const FVector& DestinationPoint)
    {
        // Execute special action (e.g., jump animation)
        if (APawn* Pawn = Cast<APawn>(MovingActor))
        {
            // Play jump animation
            PlayJumpAnimation(Pawn);
        }
    }

protected:
    UPROPERTY(EditAnywhere)
    bool bIsDoorOpen = true;

    void PlayJumpAnimation(APawn* Pawn);
};
```

## IX. Performance Optimization

### NavMesh Generation Optimization

```cpp
// NavMesh generation parameter optimization suggestions
struct OptimizedNavMeshConfig {
    // Voxel size - larger is faster but less precise
    // Recommendation: 1/4 to 1/2 of agent radius
    float cellSize = 0.2f;

    // Voxel height - typically half of cellSize
    float cellHeight = 0.1f;

    // Region merge threshold - larger results in fewer polygons
    // But too large loses details
    int mergeRegionArea = 20;

    // Maximum edge length - limits polygon size
    float maxEdgeLen = 12.0f;

    // Simplification error - larger results in simpler polygons
    float maxSimplificationError = 1.3f;

    // Maximum vertices per polygon
    int maxVertsPerPoly = 6;
};

// Chunked baking optimization
class OptimizedNavMeshBuilder {
public:
    void buildInChunks(const std::vector<Mesh>& meshes) {
        // Divide scene into multiple chunks
        std::vector<BoundingBox> chunks = divideIntoChunks(meshes);

        // Process each chunk in parallel
        #pragma omp parallel for
        for (int i = 0; i < chunks.size(); i++) {
            NavMesh* chunkMesh = buildChunk(chunks[i], meshes);

            #pragma omp critical
            {
                mergeChunk(chunkMesh);
            }
        }
    }

private:
    std::vector<BoundingBox> divideIntoChunks(const std::vector<Mesh>& meshes);
    NavMesh* buildChunk(const BoundingBox& bounds, const std::vector<Mesh>& meshes);
    void mergeChunk(NavMesh* chunk);
};
```

### Pathfinding Query Optimization

```cpp
// Path caching
class PathCache {
public:
    struct CacheEntry {
        Vector3 start;
        Vector3 end;
        std::vector<Vector3> path;
        float timestamp;
    };

    std::vector<Vector3>* findCachedPath(const Vector3& start, const Vector3& end) {
        for (auto& entry : cache) {
            // Check if within valid period
            if (currentTime - entry.timestamp > cacheLifetime) continue;

            // Check if start and end points are close enough
            if (distance(entry.start, start) < cacheRadius &&
                distance(entry.end, end) < cacheRadius) {
                entry.timestamp = currentTime;  // Update access time
                return &entry.path;
            }
        }
        return nullptr;
    }

    void addPath(const Vector3& start, const Vector3& end,
                 const std::vector<Vector3>& path) {
        // If cache is full, remove oldest entry
        if (cache.size() >= maxCacheSize) {
            removeOldestEntry();
        }

        cache.push_back({start, end, path, currentTime});
    }

private:
    std::vector<CacheEntry> cache;
    float cacheLifetime = 5.0f;    // Cache validity period (seconds)
    float cacheRadius = 1.0f;      // Cache matching radius
    int maxCacheSize = 100;
    float currentTime;
};

// Hierarchical pathfinding
class HierarchicalPathfinder {
public:
    std::vector<Vector3> findPath(const Vector3& start, const Vector3& end) {
        // 1. High-level pathfinding (region level)
        int startRegion = getRegion(start);
        int endRegion = getRegion(end);

        if (startRegion == endRegion) {
            // Same region, use low-level pathfinding directly
            return lowLevelPathfinder.findPath(start, end);
        }

        // 2. Find region-level path
        std::vector<int> regionPath = highLevelPathfinder.findPath(startRegion, endRegion);

        // 3. Refine path at each region boundary
        std::vector<Vector3> fullPath;
        Vector3 currentPos = start;

        for (size_t i = 0; i < regionPath.size() - 1; i++) {
            Vector3 exitPoint = getRegionExitPoint(regionPath[i], regionPath[i + 1]);

            std::vector<Vector3> segmentPath =
                lowLevelPathfinder.findPath(currentPos, exitPoint);

            fullPath.insert(fullPath.end(), segmentPath.begin(), segmentPath.end());
            currentPos = exitPoint;
        }

        // 4. Add final segment to end point
        std::vector<Vector3> lastSegment = lowLevelPathfinder.findPath(currentPos, end);
        fullPath.insert(fullPath.end(), lastSegment.begin(), lastSegment.end());

        return fullPath;
    }

private:
    int getRegion(const Vector3& point);
    Vector3 getRegionExitPoint(int fromRegion, int toRegion);

    Pathfinder highLevelPathfinder;  // Region-level pathfinding
    Pathfinder lowLevelPathfinder;   // Polygon-level pathfinding
};
```

### Memory Optimization

```cpp
// Compact NavMesh data structure
struct CompactNavMesh {
    // Use 16-bit indices instead of 32-bit
    std::vector<uint16_t> vertexIndices;

    // Quantize vertex coordinates
    struct QuantizedVertex {
        int16_t x, y, z;  // Offsets relative to bounding box
    };
    std::vector<QuantizedVertex> vertices;

    // Bounding box (for dequantization)
    Vector3 boundsMin;
    Vector3 boundsMax;
    float quantizationScale;

    Vector3 getVertex(int index) const {
        const QuantizedVertex& qv = vertices[index];
        return Vector3(
            boundsMin.x + qv.x * quantizationScale,
            boundsMin.y + qv.y * quantizationScale,
            boundsMin.z + qv.z * quantizationScale
        );
    }

    // Polygons use variable-length encoding
    // Format: [vertex count][index1][index2]...[neighbor count][neighbor1]...
    std::vector<uint8_t> polygonData;
};

// Streaming NavMesh loading
class StreamingNavMesh {
public:
    void loadTile(int x, int z) {
        if (loadedTiles.count({x, z})) return;

        // Asynchronously load tile data
        std::string filename = getTileFilename(x, z);
        asyncLoadFile(filename, [this, x, z](const std::vector<uint8_t>& data) {
            NavMeshTile* tile = deserializeTile(data);

            std::lock_guard<std::mutex> lock(tileMutex);
            loadedTiles[{x, z}] = tile;

            // Rebuild connections with adjacent tiles
            connectToNeighbors(x, z);
        });
    }

    void unloadTile(int x, int z) {
        std::lock_guard<std::mutex> lock(tileMutex);

        auto it = loadedTiles.find({x, z});
        if (it != loadedTiles.end()) {
            delete it->second;
            loadedTiles.erase(it);
        }
    }

private:
    std::map<std::pair<int, int>, NavMeshTile*> loadedTiles;
    std::mutex tileMutex;
};
```

## X. Debugging and Visualization

### NavMesh Visualization

```cpp
// NavMesh debug rendering
class NavMeshDebugRenderer {
public:
    void render(const NavMesh& navMesh) {
        // Render polygons
        for (int i = 0; i < navMesh.getPolygonCount(); i++) {
            const Polygon& poly = navMesh.getPolygon(i);

            // Select color based on area type
            Color color = getAreaColor(poly.areaType);

            // Draw polygon boundaries
            for (int j = 0; j < poly.vertexCount; j++) {
                int nextJ = (j + 1) % poly.vertexCount;
                Vector3 v1 = navMesh.getVertex(poly.vertexIndices[j]);
                Vector3 v2 = navMesh.getVertex(poly.vertexIndices[nextJ]);

                drawLine(v1, v2, color);
            }

            // Draw polygon fill (semi-transparent)
            drawPolygon(poly, color.withAlpha(0.3f));
        }

        // Render polygon centers and IDs
        if (showPolygonIds) {
            for (int i = 0; i < navMesh.getPolygonCount(); i++) {
                Vector3 center = navMesh.getPolygonCenter(i);
                drawText(center, std::to_string(i), Color::White);
            }
        }

        // Render Off-Mesh Links
        for (const auto& link : navMesh.getOffMeshLinks()) {
            Color linkColor = link.bidirectional ? Color::Green : Color::Yellow;
            drawLine(link.startPoint, link.endPoint, linkColor);
            drawSphere(link.startPoint, 0.2f, linkColor);
            drawSphere(link.endPoint, 0.2f, linkColor);
        }
    }

    void renderPath(const std::vector<Vector3>& path) {
        if (path.size() < 2) return;

        for (size_t i = 0; i < path.size() - 1; i++) {
            drawLine(path[i], path[i + 1], Color::Magenta, 3.0f);
            drawSphere(path[i], 0.1f, Color::Cyan);
        }
        drawSphere(path.back(), 0.2f, Color::Red);  // End point
    }

private:
    Color getAreaColor(NavMeshAreaType type) {
        switch (type) {
            case NavMeshAreaType::Walkable: return Color::Gray;
            case NavMeshAreaType::Grass: return Color::Green;
            case NavMeshAreaType::Water: return Color::Blue;
            case NavMeshAreaType::Road: return Color::Brown;
            default: return Color::White;
        }
    }

    bool showPolygonIds = false;
};
```

### Pathfinding Debugging

```cpp
// Pathfinding process visualization
class PathfindingVisualizer {
public:
    void visualizeSearch(const Vector3& start, const Vector3& end) {
        searchSteps.clear();

        // Use callback to record search process
        navMesh->findPath(start, end, [this](const SearchStep& step) {
            searchSteps.push_back(step);
        });
    }

    void playback(float time) {
        int stepIndex = (int)(time * playbackSpeed);
        stepIndex = std::min(stepIndex, (int)searchSteps.size() - 1);

        for (int i = 0; i <= stepIndex; i++) {
            const SearchStep& step = searchSteps[i];

            // Draw visited polygons
            Color visitedColor = Color::Red.withAlpha(0.3f);
            drawPolygon(step.polygonId, visitedColor);

            // Draw current exploration boundary
            if (i == stepIndex) {
                for (int neighborId : step.neighbors) {
                    drawPolygon(neighborId, Color::Yellow.withAlpha(0.5f));
                }
            }
        }

        // Draw final path
        if (stepIndex == searchSteps.size() - 1) {
            renderPath(finalPath);
        }
    }

private:
    struct SearchStep {
        int polygonId;
        float gCost;
        float fCost;
        std::vector<int> neighbors;
    };

    std::vector<SearchStep> searchSteps;
    std::vector<Vector3> finalPath;
    float playbackSpeed = 10.0f;  // Search steps shown per second
};
```

## XI. Interview Key Points

### Common Interview Questions

**Q1: What are the advantages of NavMesh compared to traditional grid-based pathfinding?**

The main advantages of NavMesh include:
- **High storage efficiency**: Uses convex polygons instead of numerous grid cells, small memory footprint
- **Smooth paths**: Generated paths are more natural without jaggy artifacts
- **Efficient queries**: Using spatial index structures, both point location and pathfinding are fast
- **Support for complex terrain**: Can handle slopes, multi-level structures, etc.
- **Strong flexibility**: Easy to add area costs, Off-Mesh Links, and other features

**Q2: Why does NavMesh use convex polygons?**

Convex polygons have the key property that any straight line between two points inside a convex polygon lies entirely within the polygon. This means:
- Simplified pathfinding: No additional collision detection needed within polygons
- Efficient point-in-polygon test: Simple algorithms can determine if a point is in a polygon
- Convenient mesh simplification: Complex scenes can be decomposed into the minimum number of convex polygons

**Q3: What is the purpose of the Funnel Algorithm?**

The A* algorithm on NavMesh finds a sequence of polygons, but we need a smooth point path. The Funnel Algorithm:
- Converts polygon paths into the shortest point paths
- Eliminates redundant path points by iteratively tightening the "funnel"
- O(n) time complexity, very efficient

**Q4: How do you handle dynamic obstacles?**

Methods for handling dynamic obstacles include:
1. **Local rebuild**: Only regenerate the NavMesh in affected areas
2. **Tiled NavMesh**: Divide scenes into tiles, update only affected tiles
3. **NavMesh Carving**: Use overlay layers to temporarily modify walkable areas without changing the original NavMesh
4. **Avoidance algorithms**: Use RVO and other algorithms at runtime to avoid dynamic obstacles

**Q5: What is an Off-Mesh Link?**

Off-Mesh Links are special connections outside the NavMesh, used to represent:
- Jumps (from one platform to another)
- Climbs (climbing ladders, vaulting walls)
- Portals (instant teleportation)
- Doors (may require opening conditions)

Off-Mesh Links allow AI to perform special actions to connect otherwise disconnected navigation areas.

### Practical Recommendations

1. **Configure parameters carefully**: Voxel size, agent parameters, etc. need adjustment based on game requirements
2. **Layered architecture**: For large scenes, use tiled NavMesh to improve update efficiency
3. **Cache paths**: Cache frequently requested paths
4. **Asynchronous processing**: NavMesh generation and complex pathfinding should be asynchronous
5. **Debugging tools**: Develop visualization tools to debug NavMesh issues
6. **Performance monitoring**: Track pathfinding request frequency and time consumption

## Summary

Navigation Mesh is the core technology for implementing AI pathfinding in modern 3D games. This article detailed NavMesh's core concepts, generation algorithms, query mechanisms, dynamic update strategies, and practical applications in Unity and Unreal Engine.

**Core Points Summary:**

1. **NavMesh Fundamentals**: Uses convex polygons to represent walkable areas, efficient storage and fast queries
2. **Generation Algorithm**: Voxelization -> Region partitioning -> Contour tracing -> Convex decomposition
3. **Pathfinding Queries**: A* finds polygon paths + Funnel Algorithm converts to point paths
4. **Dynamic Updates**: Tiled NavMesh, local rebuild, Carving strategies
5. **Agent System**: Path following, local avoidance (RVO), area costs
6. **Engine Practice**: Both Unity and Unreal Engine provide complete NavMesh systems

Mastering NavMesh technology not only enables developing smarter game AI but is also an important knowledge point in game development interviews. It's recommended to practice with real projects and gain a deep understanding of each algorithm's principles and application scenarios.
