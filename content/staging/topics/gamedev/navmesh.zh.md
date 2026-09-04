---
title: 导航网格 (NavMesh) 详解
description: 掌握3D游戏中的导航网格技术：生成、查询和动态更新
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - NavMesh
  - 寻路
  - 导航
  - 3D
status: imported
origin: old/src/content/docs/gamedev/navmesh.zh.md
divergence: 0.205
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: GameDev
  subcategory: AI
  order: 18
  lastUpdated: 2026-01-07
---

导航网格（Navigation Mesh，简称 NavMesh）是现代3D游戏中实现AI寻路的核心技术。与传统的网格寻路或路点系统相比，NavMesh 能够更准确地表示复杂的3D环境，为游戏角色提供自然、流畅的移动路径。本文将深入探讨 NavMesh 的核心概念、生成算法、查询机制以及在主流游戏引擎中的实践应用。

## NavMesh 基础概念

### 什么是导航网格

导航网格是一种用于描述游戏世界中可行走区域的数据结构。它将复杂的3D场景简化为一组相互连接的凸多边形，每个多边形代表一个可以自由行走的区域。

```
传统网格寻路 vs NavMesh 对比：

传统网格寻路：                    NavMesh：
┌─┬─┬─┬─┬─┬─┬─┬─┐               ┌───────────────┐
│ │ │ │ │█│█│█│ │               │               │
├─┼─┼─┼─┼─┼─┼─┼─┤               │     P1        │
│ │ │ │ │█│█│█│ │               │               │
├─┼─┼─┼─┼─┼─┼─┼─┤         ┌─────┴───────┐       │
│ │ │ │ │ │ │ │ │         │             │       │
├─┼─┼─┼─┼─┼─┼─┼─┤         │     P2      │  P3   │
│ │ │ │ │ │ │ │ │         │             │       │
└─┴─┴─┴─┴─┴─┴─┴─┘         └─────────────┴───────┘

缺点：存储开销大           优点：存储高效
      路径不自然                 路径流畅
      精度有限                   支持任意精度
```

**NavMesh 的核心优势：**

- **存储高效**：使用凸多边形而非大量网格单元
- **路径平滑**：生成的路径更自然，无锯齿感
- **支持复杂地形**：能够处理斜坡、楼梯、多层结构
- **查询高效**：点定位和路径搜索都有较好的时间复杂度

### 凸多边形的重要性

NavMesh 使用凸多边形作为基本单元，这是因为凸多边形具有以下关键特性：

**凸多边形定义**：多边形内任意两点的连线都完全位于多边形内部。

```
凸多边形：                非凸多边形：
    ┌─────────┐              ┌─────────┐
   /           \            /           \
  /             \          /      ┌──────┘
 /               \        /       │
/                 \      /        │
──────────────────       ─────────┘

任意两点连线            某些点的连线
都在内部                会穿出边界
```

**使用凸多边形的原因：**

1. **简化路径规划**：在凸多边形内部，任意两点之间的直线路径都是可行的
2. **快速碰撞检测**：凸多边形的点包含测试（Point-in-Polygon）算法简单高效
3. **便于网格简化**：复杂场景可以分解为最少数量的凸多边形

### NavMesh 的组成结构

一个完整的 NavMesh 系统通常包含以下组件：

```
┌─────────────────────────────────────────────────────────────┐
│                      NavMesh 系统架构                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   几何数据层     │    │   拓扑数据层     │                │
│  │                 │    │                 │                │
│  │ • 顶点列表      │    │ • 多边形邻接关系 │                │
│  │ • 多边形顶点索引 │    │ • 边连接信息     │                │
│  │ • 边界框信息    │    │ • 区域标识       │                │
│  └────────┬────────┘    └────────┬────────┘                │
│           │                      │                         │
│           └──────────┬───────────┘                         │
│                      │                                     │
│           ┌──────────▼──────────┐                         │
│           │    空间索引结构      │                         │
│           │  (BVH / Quadtree)   │                         │
│           └──────────┬──────────┘                         │
│                      │                                     │
│  ┌───────────────────▼───────────────────┐                │
│  │              查询接口                   │                │
│  │                                        │                │
│  │  • 点定位 (Point Location)             │                │
│  │  • 路径查询 (Pathfinding)              │                │
│  │  • 射线检测 (Raycast)                  │                │
│  └────────────────────────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## NavMesh 生成算法

### 生成流程概述

NavMesh 的生成是一个将原始3D几何体转换为可导航多边形网格的过程：

```
NavMesh 生成流程：

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  原始几何体   │────▶│   体素化     │────▶│  区域标记    │
│  (Geometry)  │     │ (Voxelization)│    │  (Regions)   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                │
┌──────────────┐     ┌──────────────┐          │
│  路径简化    │◀────│  轮廓追踪    │◀─────────┘
│ (Simplify)  │     │  (Contours)  │
└──────────────┘     └──────────────┘
        │
        ▼
┌──────────────┐     ┌──────────────┐
│  多边形生成   │────▶│  细节网格    │
│ (Polygons)   │     │  (Detail)    │
└──────────────┘     └──────────────┘
```

### 体素化（Voxelization）

体素化是将连续的3D几何体离散化为体素（3D像素）的过程。

```cpp
// 体素化参数配置
struct VoxelConfig {
    float cellSize;        // 水平方向体素大小 (通常 0.1-0.3 米)
    float cellHeight;      // 垂直方向体素高度 (通常为 cellSize 的一半)
    float agentHeight;     // Agent 高度
    float agentRadius;     // Agent 半径
    float maxClimb;        // 最大可攀爬高度 (如台阶)
    float maxSlope;        // 最大可行走坡度 (通常 45-60 度)
};

// 体素化核心逻辑
class Voxelizer {
public:
    void voxelize(const Mesh& mesh, const VoxelConfig& config) {
        // 1. 计算场景包围盒
        BoundingBox bounds = mesh.getBounds();

        // 2. 创建体素网格
        int width = (int)ceil((bounds.max.x - bounds.min.x) / config.cellSize);
        int height = (int)ceil((bounds.max.y - bounds.min.y) / config.cellHeight);
        int depth = (int)ceil((bounds.max.z - bounds.min.z) / config.cellSize);

        heightfield = new Heightfield(width, height, depth);

        // 3. 光栅化三角形
        for (const Triangle& tri : mesh.triangles) {
            rasterizeTriangle(tri, config);
        }
    }

private:
    void rasterizeTriangle(const Triangle& tri, const VoxelConfig& config) {
        // 计算三角形在体素网格中的覆盖范围
        // 对每个覆盖的体素列进行高度场更新
        // 标记实体区域和可行走表面
    }

    Heightfield* heightfield;
};
```

**体素化结果示例**：

```
侧视图（高度场）：

高度 ▲
  8  │        ████
  7  │        ████████
  6  │        ████████
  5  │    ████████████
  4  │    ████████████
  3  │████████████████
  2  │████████████████████
  1  │████████████████████
  0  └────────────────────▶ X

可行走表面标记为 '='：
  8  │        ════
  7  │    ════    ════
  5  │════
  3  │                ════
  0  └────────────────────▶ X
```

### 区域生成与分水岭算法

区域生成将连续的可行走表面划分为独立的导航区域：

```cpp
// 分水岭算法进行区域划分
class RegionBuilder {
public:
    void buildRegions(Heightfield& hf, float walkableHeight, float walkableClimb) {
        // 1. 计算距离场 - 每个体素到最近障碍的距离
        calculateDistanceField(hf);

        // 2. 应用分水岭算法
        // 从距离场最大值（区域中心）开始
        // 向外扩展直到遇到边界或其他区域

        // 3. 标记区域ID
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
        // 使用曼哈顿距离或欧几里得距离
        // 从边界开始向内传播距离值
    }

    void floodFillRegion(Heightfield& hf, int startX, int startZ,
                         Span* startSpan, int regionId) {
        // 从起点开始洪水填充
        // 遇到高度差过大或边界时停止
    }
};
```

### 轮廓追踪

轮廓追踪从区域边界提取多边形轮廓：

```cpp
// 轮廓数据结构
struct Contour {
    std::vector<Vector3> vertices;  // 顶点列表
    std::vector<int> rawVertices;   // 原始体素坐标
    int regionId;                   // 所属区域
    int areaType;                   // 区域类型 (地面/水面/草地等)
};

// 轮廓追踪算法
class ContourTracer {
public:
    std::vector<Contour> traceContours(const Heightfield& hf) {
        std::vector<Contour> contours;

        // 遍历每个区域
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

        // 找到区域边界起点
        int startX, startZ;
        findBoundaryStart(hf, regionId, startX, startZ);

        // 沿边界行走，收集顶点
        int x = startX, z = startZ;
        int dir = 0;  // 初始方向

        do {
            contour.rawVertices.push_back(x);
            contour.rawVertices.push_back(z);

            // 尝试右转、直行、左转
            // 这类似于走迷宫时的"右手法则"
            dir = getNextDirection(hf, regionId, x, z, dir);
            moveInDirection(x, z, dir);

        } while (x != startX || z != startZ);

        return contour;
    }
};
```

### 凸多边形分解

将轮廓分解为凸多边形是 NavMesh 生成的关键步骤：

```cpp
// 凸多边形分解算法
class ConvexDecomposer {
public:
    std::vector<Polygon> decompose(const Contour& contour) {
        std::vector<Polygon> polygons;

        // 使用耳切法或其他凸分解算法
        std::vector<int> indices = contour.rawVertices;

        while (indices.size() > 3) {
            // 找到一个"耳朵"（凸顶点且形成的三角形不包含其他顶点）
            int earIndex = findEar(indices);

            if (earIndex == -1) {
                // 处理退化情况
                break;
            }

            // 切除耳朵，形成三角形
            Triangle tri = cutEar(indices, earIndex);

            // 尝试合并相邻三角形为凸多边形
            mergeIntoConvexPolygon(polygons, tri);
        }

        // 处理剩余的三角形
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

            // 检查是否为凸顶点
            if (!isConvex(a, b, c)) continue;

            // 检查三角形内是否包含其他顶点
            if (!containsOtherVertex(indices, a, b, c, i)) {
                return i;
            }
        }

        return -1;
    }

    bool isConvex(Vector2 a, Vector2 b, Vector2 c) {
        // 使用叉积判断顶点凸凹性
        float cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
        return cross > 0;  // 逆时针为凸
    }
};
```

**凸多边形分解示意图**：

```
原始轮廓（非凸）：           分解后的凸多边形：

     ┌──────────┐              ┌──────────┐
     │          │              │    P1    │
     │    ┌─────┘              │    ┌─────┘
     │    │                    │    │
     │    └─────┐              ├────┤
     │          │              │ P2 │ P3
     └──────────┘              └────┴──────┘

一个凹多边形被分解为3个凸多边形 P1, P2, P3
```

### Recast 导航网格生成库

[Recast](https://github.com/recastnavigation/recastnavigation) 是业界最流行的开源 NavMesh 生成库，被 Unity、Unreal Engine 等众多游戏引擎采用。

```cpp
// Recast NavMesh 生成示例
#include "Recast.h"
#include "DetourNavMesh.h"

class NavMeshBuilder {
public:
    dtNavMesh* buildNavMesh(const float* vertices, int numVerts,
                            const int* triangles, int numTris) {
        // 1. 配置参数
        rcConfig config;
        memset(&config, 0, sizeof(config));

        config.cs = 0.3f;              // 体素水平尺寸
        config.ch = 0.2f;              // 体素高度
        config.walkableSlopeAngle = 45.0f;
        config.walkableHeight = (int)ceilf(2.0f / config.ch);   // Agent 高度
        config.walkableClimb = (int)floorf(0.4f / config.ch);   // 最大攀爬高度
        config.walkableRadius = (int)ceilf(0.6f / config.cs);   // Agent 半径
        config.maxEdgeLen = (int)(12.0f / config.cs);
        config.maxSimplificationError = 1.3f;
        config.minRegionArea = (int)rcSqr(8);
        config.mergeRegionArea = (int)rcSqr(20);
        config.maxVertsPerPoly = 6;
        config.detailSampleDist = 6.0f;
        config.detailSampleMaxError = 1.0f;

        // 计算包围盒
        rcCalcBounds(vertices, numVerts, config.bmin, config.bmax);
        rcCalcGridSize(config.bmin, config.bmax, config.cs,
                       &config.width, &config.height);

        // 2. 分配工作内存
        rcContext ctx;
        rcHeightfield* heightfield = rcAllocHeightfield();
        rcCreateHeightfield(&ctx, *heightfield, config.width, config.height,
                           config.bmin, config.bmax, config.cs, config.ch);

        // 3. 光栅化三角形
        unsigned char* triAreas = new unsigned char[numTris];
        memset(triAreas, 0, numTris);
        rcMarkWalkableTriangles(&ctx, config.walkableSlopeAngle,
                                vertices, numVerts, triangles, numTris, triAreas);
        rcRasterizeTriangles(&ctx, vertices, numVerts, triangles, triAreas,
                            numTris, *heightfield, config.walkableClimb);
        delete[] triAreas;

        // 4. 过滤不可行走区域
        rcFilterLowHangingWalkableObstacles(&ctx, config.walkableClimb, *heightfield);
        rcFilterLedgeSpans(&ctx, config.walkableHeight, config.walkableClimb, *heightfield);
        rcFilterWalkableLowHeightSpans(&ctx, config.walkableHeight, *heightfield);

        // 5. 构建紧凑高度场
        rcCompactHeightfield* compactHeightfield = rcAllocCompactHeightfield();
        rcBuildCompactHeightfield(&ctx, config.walkableHeight, config.walkableClimb,
                                  *heightfield, *compactHeightfield);
        rcFreeHeightField(heightfield);

        // 6. 腐蚀可行走区域
        rcErodeWalkableArea(&ctx, config.walkableRadius, *compactHeightfield);

        // 7. 构建区域
        rcBuildDistanceField(&ctx, *compactHeightfield);
        rcBuildRegions(&ctx, *compactHeightfield, config.borderSize,
                       config.minRegionArea, config.mergeRegionArea);

        // 8. 追踪轮廓
        rcContourSet* contourSet = rcAllocContourSet();
        rcBuildContours(&ctx, *compactHeightfield, config.maxSimplificationError,
                        config.maxEdgeLen, *contourSet);

        // 9. 构建多边形网格
        rcPolyMesh* polyMesh = rcAllocPolyMesh();
        rcBuildPolyMesh(&ctx, *contourSet, config.maxVertsPerPoly, *polyMesh);

        // 10. 构建细节网格
        rcPolyMeshDetail* detailMesh = rcAllocPolyMeshDetail();
        rcBuildPolyMeshDetail(&ctx, *polyMesh, *compactHeightfield,
                              config.detailSampleDist, config.detailSampleMaxError,
                              *detailMesh);

        // 11. 创建 Detour NavMesh
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

        // 清理临时数据
        rcFreeCompactHeightfield(compactHeightfield);
        rcFreeContourSet(contourSet);
        rcFreePolyMesh(polyMesh);
        rcFreePolyMeshDetail(detailMesh);

        return navMesh;
    }
};
```

## NavMesh 寻路查询

### A* 算法在 NavMesh 上的应用

NavMesh 上的路径搜索通常使用 A* 算法的变体：

```cpp
// NavMesh A* 寻路实现
class NavMeshPathfinder {
public:
    struct PathNode {
        int polygonId;
        float gCost;      // 从起点到当前节点的实际代价
        float hCost;      // 从当前节点到终点的启发式代价
        float fCost() const { return gCost + hCost; }
        int parentId;
        Vector3 entryPoint;  // 进入此多边形的点
    };

    std::vector<Vector3> findPath(const Vector3& start, const Vector3& end) {
        // 1. 找到起点和终点所在的多边形
        int startPoly = findPolygonContaining(start);
        int endPoly = findPolygonContaining(end);

        if (startPoly == -1 || endPoly == -1) {
            return {};  // 起点或终点不在导航网格上
        }

        // 2. A* 搜索
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
                // 找到路径，重建路径
                return reconstructPath(nodeMap, current, start, end);
            }

            closedList.insert(current.polygonId);

            // 遍历相邻多边形
            for (int neighborId : getNeighbors(current.polygonId)) {
                if (closedList.count(neighborId)) continue;

                // 计算通过共享边的最优穿越点
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

        return {};  // 无法找到路径
    }

private:
    float heuristic(const Vector3& a, const Vector3& b) {
        // 欧几里得距离作为启发函数
        return distance(a, b);
    }

    Vector3 findBestCrossingPoint(const Vector3& from, const Vector3& to,
                                   const Edge& edge) {
        // 找到边上离直线最近的点
        // 这个点是穿越此边的最优位置
        Vector3 lineDir = normalize(to - from);
        Vector3 edgeDir = normalize(edge.end - edge.start);

        // 计算投影点并钳制到边的范围内
        float t = clamp(dot(from - edge.start, edgeDir) /
                       dot(edge.end - edge.start, edgeDir), 0.0f, 1.0f);

        return edge.start + t * (edge.end - edge.start);
    }
};
```

### 漏斗算法（Funnel Algorithm）

A* 找到的是多边形路径，需要用漏斗算法（也称为 Simple Stupid Funnel Algorithm）将其转换为平滑的点路径：

```cpp
// 漏斗算法实现
class FunnelAlgorithm {
public:
    std::vector<Vector3> stringPull(const std::vector<int>& polyPath,
                                     const Vector3& start,
                                     const Vector3& end) {
        if (polyPath.empty()) return {start, end};
        if (polyPath.size() == 1) return {start, end};

        std::vector<Vector3> path;
        path.push_back(start);

        // 收集所有portal（相邻多边形的共享边）
        std::vector<Portal> portals;
        for (size_t i = 0; i < polyPath.size() - 1; i++) {
            Edge edge = getSharedEdge(polyPath[i], polyPath[i + 1]);
            portals.push_back({edge.start, edge.end});
        }
        // 添加终点作为最后的portal
        portals.push_back({end, end});

        // 漏斗状态
        Vector3 apex = start;       // 漏斗顶点
        Vector3 left = start;       // 漏斗左边界
        Vector3 right = start;      // 漏斗右边界
        int apexIndex = 0;
        int leftIndex = 0;
        int rightIndex = 0;

        for (size_t i = 0; i < portals.size(); i++) {
            Vector3 portalLeft = portals[i].left;
            Vector3 portalRight = portals[i].right;

            // 更新右边界
            if (triArea2D(apex, right, portalRight) <= 0.0f) {
                if (apex == right || triArea2D(apex, left, portalRight) > 0.0f) {
                    // 收紧漏斗
                    right = portalRight;
                    rightIndex = i;
                } else {
                    // 右边界越过左边界，添加左顶点到路径
                    path.push_back(left);

                    // 重置漏斗
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

            // 更新左边界
            if (triArea2D(apex, left, portalLeft) >= 0.0f) {
                if (apex == left || triArea2D(apex, right, portalLeft) < 0.0f) {
                    // 收紧漏斗
                    left = portalLeft;
                    leftIndex = i;
                } else {
                    // 左边界越过右边界，添加右顶点到路径
                    path.push_back(right);

                    // 重置漏斗
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

    // 计算三角形有向面积的两倍（用于判断点的位置关系）
    float triArea2D(const Vector3& a, const Vector3& b, const Vector3& c) {
        return (b.x - a.x) * (c.z - a.z) - (c.x - a.x) * (b.z - a.z);
    }
};
```

**漏斗算法可视化**：

```
起点 S，终点 E，多边形边界用 | 表示

步骤1：初始化漏斗
          S (apex)
         /|\
        / | \
       /  |  \
      L   |   R    漏斗张开

步骤2：处理第一个 portal
          S
         /|\
        / | \
       L' |  R'    漏斗收紧

步骤3：左边界越过右边界
          S
           \
            R ← 添加到路径
           /|\
          / | \
         L  |  R'

步骤4：继续直到终点
      S ——→ R ——→ E

最终路径：S → R → E
```

### 点定位查询

快速确定一个点位于哪个多边形是 NavMesh 系统的基础操作：

```cpp
// 使用 BVH 加速点定位
class PointLocator {
public:
    struct BVHNode {
        BoundingBox bounds;
        int polygonId;       // 叶节点：多边形ID，内部节点：-1
        int leftChild;
        int rightChild;
    };

    int findPolygon(const Vector3& point) {
        return queryBVH(point, 0);
    }

private:
    int queryBVH(const Vector3& point, int nodeIndex) {
        const BVHNode& node = nodes[nodeIndex];

        // 检查点是否在节点包围盒内
        if (!node.bounds.contains(point)) {
            return -1;
        }

        // 叶节点：精确测试点是否在多边形内
        if (node.polygonId >= 0) {
            if (isPointInPolygon(point, node.polygonId)) {
                return node.polygonId;
            }
            return -1;
        }

        // 内部节点：递归查询子节点
        int result = queryBVH(point, node.leftChild);
        if (result >= 0) return result;

        return queryBVH(point, node.rightChild);
    }

    bool isPointInPolygon(const Vector3& point, int polygonId) {
        const Polygon& poly = polygons[polygonId];

        // 使用射线法或重心坐标法判断点是否在多边形内
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

## 动态障碍物处理

### 动态障碍物的挑战

游戏中常常需要处理动态障碍物（如移动的NPC、可破坏的墙壁等），这对 NavMesh 系统提出了额外的挑战：

```
静态 NavMesh 的问题：

时刻 T0:                    时刻 T1:
┌───────────────────┐      ┌───────────────────┐
│                   │      │        ███        │
│    A ────────→ B  │      │    A ──███──→ B   │
│                   │      │        ███        │
└───────────────────┘      └───────────────────┘

如果不更新 NavMesh，Agent 会试图穿过新出现的障碍物
```

### 局部重建策略

对于动态变化的场景，可以采用局部重建策略：

```cpp
// 动态 NavMesh 更新管理器
class DynamicNavMeshManager {
public:
    void addObstacle(const Obstacle& obstacle) {
        // 1. 找到受影响的多边形
        std::vector<int> affectedPolys = findAffectedPolygons(obstacle);

        // 2. 标记这些多边形需要重建
        for (int polyId : affectedPolys) {
            markDirty(polyId);
        }

        // 3. 添加到障碍物列表
        obstacles.push_back(obstacle);

        // 4. 触发异步重建（或延迟到下一帧）
        scheduleRebuild();
    }

    void removeObstacle(int obstacleId) {
        const Obstacle& obstacle = obstacles[obstacleId];

        // 1. 找到受影响的多边形
        std::vector<int> affectedPolys = findAffectedPolygons(obstacle);

        // 2. 移除障碍物
        obstacles.erase(obstacles.begin() + obstacleId);

        // 3. 触发重建
        for (int polyId : affectedPolys) {
            markDirty(polyId);
        }
        scheduleRebuild();
    }

private:
    void rebuildDirtyRegions() {
        for (int polyId : dirtyPolygons) {
            // 获取原始多边形区域
            BoundingBox region = getPolygonBounds(polyId);

            // 扩展区域以包含边界效应
            region.expand(agentRadius);

            // 重新生成该区域的 NavMesh
            NavMesh localMesh = regenerateRegion(region);

            // 合并到主 NavMesh
            mergeNavMesh(localMesh);
        }

        dirtyPolygons.clear();
    }

    std::vector<Obstacle> obstacles;
    std::set<int> dirtyPolygons;
};
```

### 分层 NavMesh（Tiled NavMesh）

分层 NavMesh 将大场景划分为多个独立的 Tile，支持高效的局部更新：

```cpp
// 分层 NavMesh 实现
class TiledNavMesh {
public:
    struct Tile {
        BoundingBox bounds;
        NavMesh* navMesh;
        std::vector<OffMeshConnection> connections;  // 与其他 Tile 的连接
        bool isDirty;
    };

    TiledNavMesh(float tileSize, const BoundingBox& worldBounds)
        : tileSize(tileSize) {
        // 计算 Tile 网格大小
        int tilesX = (int)ceil((worldBounds.max.x - worldBounds.min.x) / tileSize);
        int tilesZ = (int)ceil((worldBounds.max.z - worldBounds.min.z) / tileSize);

        tiles.resize(tilesX * tilesZ);

        // 初始化每个 Tile
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

        // 释放旧的 NavMesh
        if (tile.navMesh) {
            delete tile.navMesh;
        }

        // 收集该 Tile 范围内的几何体
        std::vector<Triangle> geometry = collectGeometry(tile.bounds);

        // 生成新的 NavMesh
        tile.navMesh = buildNavMesh(geometry);

        // 重建与相邻 Tile 的连接
        rebuildConnections(tileX, tileZ);

        tile.isDirty = false;
    }

    std::vector<Vector3> findPath(const Vector3& start, const Vector3& end) {
        // 1. 确定起点和终点所在的 Tile
        int startTileX, startTileZ, endTileX, endTileZ;
        getTileCoords(start, startTileX, startTileZ);
        getTileCoords(end, endTileX, endTileZ);

        // 2. 如果在同一 Tile 内，直接在该 Tile 中寻路
        if (startTileX == endTileX && startTileZ == endTileZ) {
            return findPathInTile(start, end, startTileX, startTileZ);
        }

        // 3. 跨 Tile 寻路：先找 Tile 级别的路径
        std::vector<int> tilePath = findTilePath(startTileX, startTileZ,
                                                  endTileX, endTileZ);

        // 4. 然后在每个 Tile 内细化路径
        return refinePath(tilePath, start, end);
    }

private:
    float tileSize;
    int tilesX, tilesZ;
    std::vector<Tile> tiles;
};
```

### 临时障碍物覆盖（NavMesh Carving）

另一种处理动态障碍物的方法是使用覆盖层，而不是修改原始 NavMesh：

```cpp
// NavMesh Carving 实现
class NavMeshCarver {
public:
    // 添加临时障碍物（不修改原始 NavMesh）
    int addCarve(const ConvexShape& shape) {
        Carve carve;
        carve.id = nextCarveId++;
        carve.shape = shape;
        carve.affectedPolys = findIntersectingPolygons(shape);

        // 计算障碍物覆盖后的有效区域
        for (int polyId : carve.affectedPolys) {
            carve.modifiedPolys[polyId] = subtractShape(polygons[polyId], shape);
        }

        carves[carve.id] = carve;
        return carve.id;
    }

    void removeCarve(int carveId) {
        carves.erase(carveId);
    }

    // 查询时考虑 Carve 的影响
    bool isPointWalkable(const Vector3& point) {
        // 首先检查是否在原始 NavMesh 上
        int polyId = findPolygon(point);
        if (polyId < 0) return false;

        // 检查是否被任何 Carve 阻挡
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

## NavMesh Agent 系统

### Agent 配置

NavMesh Agent 是在 NavMesh 上移动的实体，需要配置各种参数：

```cpp
// NavMesh Agent 配置
struct NavMeshAgentConfig {
    float radius;           // Agent 半径
    float height;           // Agent 高度
    float maxSpeed;         // 最大移动速度
    float acceleration;     // 加速度
    float angularSpeed;     // 最大转向速度
    float stoppingDistance; // 停止距离
    float baseOffset;       // 相对 NavMesh 的高度偏移
    int avoidancePriority;  // 避障优先级
    bool autoRepath;        // 是否自动重新寻路
    float autoRepathRate;   // 重新寻路频率
};

// NavMesh Agent 实现
class NavMeshAgent {
public:
    NavMeshAgent(const NavMeshAgentConfig& config) : config(config) {}

    void setDestination(const Vector3& target) {
        destination = target;
        hasPath = calculatePath();
    }

    void update(float deltaTime) {
        if (!hasPath || path.empty()) return;

        // 1. 获取当前位置到下一个路径点的方向
        Vector3 currentTarget = path[currentPathIndex];
        Vector3 direction = normalize(currentTarget - position);

        // 2. 平滑转向
        if (dot(forward, direction) < 0.99f) {
            float angle = acos(clamp(dot(forward, direction), -1.0f, 1.0f));
            float rotationAmount = min(config.angularSpeed * deltaTime, angle);
            forward = rotateTowards(forward, direction, rotationAmount);
        }

        // 3. 移动
        float distanceToTarget = distance(position, currentTarget);

        // 计算期望速度
        float desiredSpeed = config.maxSpeed;
        if (currentPathIndex == path.size() - 1) {
            // 接近终点时减速
            if (distanceToTarget < config.stoppingDistance * 2) {
                desiredSpeed *= (distanceToTarget / (config.stoppingDistance * 2));
            }
        }

        // 加速/减速
        currentSpeed = moveTowards(currentSpeed, desiredSpeed,
                                   config.acceleration * deltaTime);

        // 更新位置
        Vector3 movement = forward * currentSpeed * deltaTime;
        position += movement;

        // 4. 检查是否到达当前路径点
        if (distanceToTarget < config.stoppingDistance) {
            currentPathIndex++;
            if (currentPathIndex >= path.size()) {
                // 到达终点
                hasPath = false;
                currentSpeed = 0;
            }
        }

        // 5. 将 Agent 约束在 NavMesh 上
        constrainToNavMesh();
    }

private:
    bool calculatePath() {
        path = navMesh->findPath(position, destination);
        currentPathIndex = 0;
        return !path.empty();
    }

    void constrainToNavMesh() {
        // 找到最近的 NavMesh 表面点
        Vector3 nearestPoint;
        int nearestPoly;

        if (navMesh->findNearestPoint(position, nearestPoint, nearestPoly)) {
            // 如果偏离太远，将 Agent 拉回
            float dist = distance(position, nearestPoint);
            if (dist > config.radius) {
                position = nearestPoint;
            }

            // 调整高度以贴合地面
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

### 局部避障（Local Avoidance）

当多个 Agent 同时移动时，需要进行局部避障以避免碰撞：

```cpp
// RVO (Reciprocal Velocity Obstacles) 避障算法
class RVOAvoidance {
public:
    Vector3 computeNewVelocity(const Agent& agent,
                                const std::vector<Agent>& neighbors,
                                const Vector3& preferredVelocity) {
        std::vector<VelocityObstacle> velocityObstacles;

        // 为每个邻居计算速度障碍
        for (const Agent& neighbor : neighbors) {
            VelocityObstacle vo = computeVelocityObstacle(agent, neighbor);
            velocityObstacles.push_back(vo);
        }

        // 在速度空间中搜索最优速度
        // 该速度应该：
        // 1. 不在任何速度障碍内（避免碰撞）
        // 2. 尽可能接近期望速度（朝向目标）
        // 3. 不超过最大速度

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

        // 速度障碍的顶点位于相对位置
        vo.apex = b.velocity;

        // 计算切线方向（速度障碍的两条边）
        float angle = asin(clamp(combinedRadius / dist, -1.0f, 1.0f));
        Vector3 dir = normalize(relativePos);

        vo.leftLeg = rotateVector(dir, angle);
        vo.rightLeg = rotateVector(dir, -angle);

        return vo;
    }

    Vector3 findOptimalVelocity(const Vector3& preferred,
                                 const std::vector<VelocityObstacle>& obstacles,
                                 float maxSpeed) {
        // 使用 ORCA (Optimal Reciprocal Collision Avoidance) 或
        // 采样方法找到最优速度

        const int numSamples = 100;
        Vector3 bestVelocity = Vector3::zero();
        float bestPenalty = FLT_MAX;

        for (int i = 0; i < numSamples; i++) {
            // 随机采样速度空间
            Vector3 sample = sampleVelocity(maxSpeed);

            // 计算惩罚值
            float penalty = 0;

            // 与期望速度的偏离
            penalty += length(sample - preferred);

            // 与速度障碍的碰撞时间
            for (const auto& vo : obstacles) {
                float timeToCollision = computeTimeToCollision(sample, vo);
                if (timeToCollision < 2.0f) {  // 2秒内会碰撞
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

## 区域与代价系统

### NavMesh 区域类型

不同的地形类型可以用不同的区域标记，影响寻路决策：

```cpp
// 区域类型定义
enum class NavMeshAreaType : uint8_t {
    Walkable = 0,      // 普通可行走区域
    Grass = 1,         // 草地（可能减速）
    Water = 2,         // 浅水区（大幅减速）
    Road = 3,          // 道路（加速）
    Mud = 4,           // 泥地（减速）
    Lava = 5,          // 岩浆（危险区域）
    NotWalkable = 255  // 不可行走
};

// 区域代价配置
struct AreaCostConfig {
    std::map<NavMeshAreaType, float> costs = {
        {NavMeshAreaType::Walkable, 1.0f},
        {NavMeshAreaType::Grass, 1.5f},
        {NavMeshAreaType::Water, 3.0f},
        {NavMeshAreaType::Road, 0.5f},
        {NavMeshAreaType::Mud, 2.0f},
        {NavMeshAreaType::Lava, 100.0f}  // 非常高的代价
    };

    float getCost(NavMeshAreaType type) const {
        auto it = costs.find(type);
        return it != costs.end() ? it->second : 1.0f;
    }
};
```

### 代价感知寻路

在寻路时考虑区域代价：

```cpp
// 代价感知 A* 寻路
class CostAwarePathfinder {
public:
    CostAwarePathfinder(const AreaCostConfig& costConfig)
        : costConfig(costConfig) {}

    std::vector<Vector3> findPath(const Vector3& start, const Vector3& end,
                                   uint32_t allowedAreaMask = 0xFFFFFFFF) {
        // allowedAreaMask 可以用来禁止某些区域
        // 例如：0xFFFFFFFB 禁止进入水域 (bit 2)

        int startPoly = navMesh->findPolygon(start);
        int endPoly = navMesh->findPolygon(end);

        if (startPoly < 0 || endPoly < 0) return {};

        // 检查起点和终点是否在允许的区域
        if (!isAreaAllowed(startPoly, allowedAreaMask) ||
            !isAreaAllowed(endPoly, allowedAreaMask)) {
            return {};
        }

        // 使用代价感知的 A* 算法
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

            // 遍历邻居
            for (int neighborId : navMesh->getNeighbors(current.polyId)) {
                // 检查是否允许进入该区域
                if (!isAreaAllowed(neighborId, allowedAreaMask)) continue;

                // 计算到邻居的代价
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

Off-Mesh Links 用于表示 NavMesh 之外的特殊连接，如跳跃、攀爬、传送门等：

```cpp
// Off-Mesh Link 定义
struct OffMeshLink {
    Vector3 startPoint;
    Vector3 endPoint;
    float radius;           // 可以使用此连接的 Agent 半径上限
    bool bidirectional;     // 是否双向
    uint8_t areaType;       // 区域类型（用于代价计算）
    uint16_t flags;         // 自定义标志

    enum Flags : uint16_t {
        None = 0,
        Jump = 1 << 0,      // 需要跳跃
        Climb = 1 << 1,     // 需要攀爬
        Drop = 1 << 2,      // 需要掉落
        Teleport = 1 << 3,  // 传送
        Door = 1 << 4       // 门（可能需要开启）
    };
};

// 在寻路中使用 Off-Mesh Links
class NavMeshWithLinks {
public:
    void addOffMeshLink(const OffMeshLink& link) {
        // 找到起点和终点所在的多边形
        int startPoly = findPolygon(link.startPoint);
        int endPoly = findPolygon(link.endPoint);

        if (startPoly >= 0 && endPoly >= 0) {
            offMeshLinks.push_back(link);

            // 添加到邻接关系
            int linkId = offMeshLinks.size() - 1;
            linkConnections[startPoly].push_back({linkId, endPoly});

            if (link.bidirectional) {
                linkConnections[endPoly].push_back({linkId, startPoly});
            }
        }
    }

    std::vector<Vector3> findPath(const Vector3& start, const Vector3& end,
                                   uint16_t allowedLinkFlags = 0xFFFF) {
        // 在标准 A* 基础上，将 Off-Mesh Links 作为额外的邻居
        // ...

        // 处理邻居时：
        for (int neighborId : getNeighbors(current.polyId)) {
            // 标准邻居处理...
        }

        // 检查 Off-Mesh Links
        for (const auto& [linkId, targetPoly] : linkConnections[current.polyId]) {
            const OffMeshLink& link = offMeshLinks[linkId];

            // 检查 Agent 是否可以使用此链接
            if (agentRadius > link.radius) continue;
            if ((link.flags & allowedLinkFlags) == 0) continue;

            // 将 Off-Mesh Link 作为邻居处理
            // ...
        }
    }

private:
    std::vector<OffMeshLink> offMeshLinks;
    std::map<int, std::vector<std::pair<int, int>>> linkConnections;  // polyId -> [(linkId, targetPoly)]
};
```

## Unity NavMesh 系统

### Unity NavMesh 组件

Unity 提供了完整的 NavMesh 系统，包括以下主要组件：

```csharp
// Unity NavMesh 基础使用示例
using UnityEngine;
using UnityEngine.AI;

public class NavMeshExample : MonoBehaviour
{
    // NavMesh Agent 组件
    private NavMeshAgent agent;

    // 目标位置
    public Transform target;

    void Start()
    {
        agent = GetComponent<NavMeshAgent>();

        // 配置 Agent 参数
        agent.speed = 3.5f;
        agent.angularSpeed = 120f;
        agent.acceleration = 8f;
        agent.stoppingDistance = 0.5f;
        agent.autoBraking = true;
    }

    void Update()
    {
        // 设置目标位置
        if (target != null)
        {
            agent.SetDestination(target.position);
        }

        // 检查路径状态
        if (agent.pathPending)
        {
            Debug.Log("正在计算路径...");
        }
        else if (agent.pathStatus == NavMeshPathStatus.PathComplete)
        {
            Debug.Log("路径计算完成");
        }
        else if (agent.pathStatus == NavMeshPathStatus.PathPartial)
        {
            Debug.Log("只能找到部分路径");
        }
        else if (agent.pathStatus == NavMeshPathStatus.PathInvalid)
        {
            Debug.Log("无法找到路径");
        }
    }
}
```

### 动态烘焙 NavMesh

Unity 支持运行时动态生成 NavMesh：

```csharp
using UnityEngine;
using UnityEngine.AI;
using Unity.AI.Navigation;

public class DynamicNavMeshBuilder : MonoBehaviour
{
    private NavMeshSurface navMeshSurface;

    void Start()
    {
        // 获取或添加 NavMeshSurface 组件
        navMeshSurface = GetComponent<NavMeshSurface>();
        if (navMeshSurface == null)
        {
            navMeshSurface = gameObject.AddComponent<NavMeshSurface>();
        }

        // 配置 NavMesh 参数
        navMeshSurface.agentTypeID = 0;  // 使用默认 Agent 类型
        navMeshSurface.collectObjects = CollectObjects.All;
        navMeshSurface.useGeometry = NavMeshCollectGeometry.RenderMeshes;

        // 初始烘焙
        BuildNavMesh();
    }

    public void BuildNavMesh()
    {
        // 同步烘焙（可能会造成卡顿）
        navMeshSurface.BuildNavMesh();
    }

    public void BuildNavMeshAsync()
    {
        // 异步烘焙（推荐用于大场景）
        StartCoroutine(BuildNavMeshCoroutine());
    }

    private System.Collections.IEnumerator BuildNavMeshCoroutine()
    {
        var operation = navMeshSurface.UpdateNavMesh(navMeshSurface.navMeshData);

        while (!operation.isDone)
        {
            Debug.Log($"NavMesh 构建进度: {operation.progress * 100}%");
            yield return null;
        }

        Debug.Log("NavMesh 构建完成");
    }
}
```

### NavMesh 障碍物

```csharp
using UnityEngine;
using UnityEngine.AI;

public class NavMeshObstacleExample : MonoBehaviour
{
    private NavMeshObstacle obstacle;

    void Start()
    {
        obstacle = GetComponent<NavMeshObstacle>();

        // 配置障碍物
        obstacle.carving = true;        // 启用 carving（会修改 NavMesh）
        obstacle.carveOnlyStationary = true;  // 只在静止时 carve
        obstacle.carvingMoveThreshold = 0.1f;
        obstacle.carvingTimeToStationary = 0.5f;

        // 设置形状
        obstacle.shape = NavMeshObstacleShape.Box;
        obstacle.size = new Vector3(2f, 2f, 2f);
    }

    // 临时禁用障碍物（如开门）
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

### 自定义区域与代价

```csharp
using UnityEngine;
using UnityEngine.AI;

public class AreaCostExample : MonoBehaviour
{
    private NavMeshAgent agent;

    // 区域 ID（在 Navigation 窗口中定义）
    private const int AreaWater = 3;
    private const int AreaRoad = 4;
    private const int AreaGrass = 5;

    void Start()
    {
        agent = GetComponent<NavMeshAgent>();

        // 设置区域代价
        agent.SetAreaCost(AreaWater, 10f);   // 水域代价高
        agent.SetAreaCost(AreaRoad, 0.5f);   // 道路代价低
        agent.SetAreaCost(AreaGrass, 2f);    // 草地代价中等
    }

    // 禁止进入某些区域
    public void AvoidWater()
    {
        // areaMask 是位掩码，每一位代表一个区域
        int walkableMask = NavMesh.AllAreas & ~(1 << AreaWater);
        agent.areaMask = walkableMask;
    }

    // 允许进入所有区域
    public void AllowAllAreas()
    {
        agent.areaMask = NavMesh.AllAreas;
    }
}
```

### Off-Mesh Link 使用

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
        // 检查是否正在通过 Off-Mesh Link
        if (agent.isOnOffMeshLink)
        {
            StartCoroutine(HandleOffMeshLink());
        }
    }

    private System.Collections.IEnumerator HandleOffMeshLink()
    {
        // 禁用自动移动
        agent.autoTraverseOffMeshLink = false;

        OffMeshLinkData data = agent.currentOffMeshLinkData;
        Vector3 startPos = agent.transform.position;
        Vector3 endPos = data.endPos + Vector3.up * agent.baseOffset;

        // 判断连接类型并执行相应动画
        if (data.linkType == OffMeshLinkType.LinkTypeJumpAcross)
        {
            // 跳跃动画
            yield return StartCoroutine(JumpAcross(startPos, endPos));
        }
        else if (data.linkType == OffMeshLinkType.LinkTypeDropDown)
        {
            // 掉落动画
            yield return StartCoroutine(DropDown(startPos, endPos));
        }
        else
        {
            // 默认：线性移动
            yield return StartCoroutine(LinearMove(startPos, endPos));
        }

        // 完成 Off-Mesh Link 穿越
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

            // 抛物线轨迹
            Vector3 pos = Vector3.Lerp(start, end, t);
            pos.y += height * 4f * t * (1f - t);  // 抛物线高度

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

## Unreal Engine NavMesh 系统

### 基础导航配置

```cpp
// Unreal Engine NavMesh 基础使用
#include "NavigationSystem.h"
#include "AIController.h"
#include "NavigationPath.h"

// 在 AI Controller 中使用导航
void AMyAIController::MoveToTarget(AActor* TargetActor)
{
    if (!TargetActor) return;

    // 使用内置的移动函数
    MoveToActor(TargetActor,
                50.0f,  // AcceptanceRadius
                true,   // bStopOnOverlap
                true,   // bUsePathfinding
                false,  // bCanStrafe
                nullptr, // FilterClass
                true);  // bAllowPartialPath
}

// 手动路径查询
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

### 自定义导航区域

```cpp
// 自定义导航区域类
UCLASS()
class UNavArea_Water : public UNavArea
{
    GENERATED_BODY()

public:
    UNavArea_Water()
    {
        // 设置区域代价
        DefaultCost = 5.0f;

        // 设置区域颜色（用于可视化）
        DrawColor = FColor::Blue;

        // 设置区域标志
        AreaFlags = ENavAreaFlag::Default;
    }
};

// 配置 Agent 使用自定义区域代价
void AMyAIController::ConfigureNavigation()
{
    UNavigationSystemV1* NavSys = FNavigationSystem::GetCurrent<UNavigationSystemV1>(GetWorld());
    if (!NavSys) return;

    // 获取导航查询过滤器
    FSharedConstNavQueryFilter QueryFilter = NavSys->GetDefaultQueryFilter();

    // 修改区域代价
    // 注意：这需要创建自定义的 FNavigationQueryFilter
}

// 在蓝图中更常用的方式是使用 Nav Modifier Volume
// 这是一个放置在场景中的 Actor，可以修改其范围内的导航属性
```

### 动态导航网格

```cpp
// 运行时 NavMesh 更新
void AMyGameMode::UpdateNavMesh(FBox UpdateBounds)
{
    UNavigationSystemV1* NavSys = FNavigationSystem::GetCurrent<UNavigationSystemV1>(GetWorld());
    if (!NavSys) return;

    // 标记区域需要更新
    NavSys->AddDirtyArea(UpdateBounds, ENavigationDirtyFlag::All);

    // 或者强制立即重建
    // NavSys->Build();
}

// 动态障碍物组件
UCLASS()
class UDynamicObstacleComponent : public UNavModifierComponent
{
    GENERATED_BODY()

public:
    UDynamicObstacleComponent()
    {
        // 设置为动态障碍物
        bAutoActivate = true;
        AreaClass = UNavArea_Null::StaticClass();  // 不可通行区域
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

### Nav Link Proxy（Off-Mesh Link）

```cpp
// 自定义 Nav Link Proxy
UCLASS()
class AMyNavLinkProxy : public ANavLinkProxy
{
    GENERATED_BODY()

public:
    AMyNavLinkProxy()
    {
        // 启用智能链接（需要代码控制开关）
        bSmartLinkIsRelevant = true;
    }

    // 重写链接开关逻辑
    virtual bool IsNavigationRelevant() const override
    {
        // 例如：只有当门打开时才可通行
        return bIsDoorOpen;
    }

    // 处理 Agent 通过链接
    UFUNCTION()
    void OnSmartLinkReached(AActor* MovingActor, const FVector& DestinationPoint)
    {
        // 执行特殊动作（如跳跃动画）
        if (APawn* Pawn = Cast<APawn>(MovingActor))
        {
            // 播放跳跃动画
            PlayJumpAnimation(Pawn);
        }
    }

protected:
    UPROPERTY(EditAnywhere)
    bool bIsDoorOpen = true;

    void PlayJumpAnimation(APawn* Pawn);
};
```

## 性能优化

### NavMesh 生成优化

```cpp
// NavMesh 生成参数优化建议
struct OptimizedNavMeshConfig {
    // 体素大小 - 越大生成越快，但精度越低
    // 推荐：Agent 半径的 1/4 到 1/2
    float cellSize = 0.2f;

    // 体素高度 - 通常为 cellSize 的一半
    float cellHeight = 0.1f;

    // 区域合并阈值 - 越大多边形越少
    // 但过大会丢失细节
    int mergeRegionArea = 20;

    // 最大边长 - 限制多边形大小
    float maxEdgeLen = 12.0f;

    // 简化误差 - 越大多边形越简单
    float maxSimplificationError = 1.3f;

    // 每个多边形最大顶点数
    int maxVertsPerPoly = 6;
};

// 分层烘焙优化
class OptimizedNavMeshBuilder {
public:
    void buildInChunks(const std::vector<Mesh>& meshes) {
        // 将场景划分为多个区块
        std::vector<BoundingBox> chunks = divideIntoChunks(meshes);

        // 并行处理每个区块
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

### 寻路查询优化

```cpp
// 寻路缓存
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
            // 检查是否在有效期内
            if (currentTime - entry.timestamp > cacheLifetime) continue;

            // 检查起点和终点是否足够接近
            if (distance(entry.start, start) < cacheRadius &&
                distance(entry.end, end) < cacheRadius) {
                entry.timestamp = currentTime;  // 更新访问时间
                return &entry.path;
            }
        }
        return nullptr;
    }

    void addPath(const Vector3& start, const Vector3& end,
                 const std::vector<Vector3>& path) {
        // 如果缓存已满，移除最旧的条目
        if (cache.size() >= maxCacheSize) {
            removeOldestEntry();
        }

        cache.push_back({start, end, path, currentTime});
    }

private:
    std::vector<CacheEntry> cache;
    float cacheLifetime = 5.0f;    // 缓存有效期（秒）
    float cacheRadius = 1.0f;      // 缓存匹配半径
    int maxCacheSize = 100;
    float currentTime;
};

// 分层寻路（Hierarchical Pathfinding）
class HierarchicalPathfinder {
public:
    std::vector<Vector3> findPath(const Vector3& start, const Vector3& end) {
        // 1. 高层寻路（区域级别）
        int startRegion = getRegion(start);
        int endRegion = getRegion(end);

        if (startRegion == endRegion) {
            // 同一区域内，直接使用底层寻路
            return lowLevelPathfinder.findPath(start, end);
        }

        // 2. 找到区域路径
        std::vector<int> regionPath = highLevelPathfinder.findPath(startRegion, endRegion);

        // 3. 在每个区域边界处细化路径
        std::vector<Vector3> fullPath;
        Vector3 currentPos = start;

        for (size_t i = 0; i < regionPath.size() - 1; i++) {
            Vector3 exitPoint = getRegionExitPoint(regionPath[i], regionPath[i + 1]);

            std::vector<Vector3> segmentPath =
                lowLevelPathfinder.findPath(currentPos, exitPoint);

            fullPath.insert(fullPath.end(), segmentPath.begin(), segmentPath.end());
            currentPos = exitPoint;
        }

        // 4. 添加最后一段到终点
        std::vector<Vector3> lastSegment = lowLevelPathfinder.findPath(currentPos, end);
        fullPath.insert(fullPath.end(), lastSegment.begin(), lastSegment.end());

        return fullPath;
    }

private:
    int getRegion(const Vector3& point);
    Vector3 getRegionExitPoint(int fromRegion, int toRegion);

    Pathfinder highLevelPathfinder;  // 区域级别寻路
    Pathfinder lowLevelPathfinder;   // 多边形级别寻路
};
```

### 内存优化

```cpp
// 紧凑的 NavMesh 数据结构
struct CompactNavMesh {
    // 使用 16 位索引而非 32 位
    std::vector<uint16_t> vertexIndices;

    // 量化顶点坐标
    struct QuantizedVertex {
        int16_t x, y, z;  // 相对于边界框的偏移
    };
    std::vector<QuantizedVertex> vertices;

    // 边界框（用于反量化）
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

    // 多边形使用变长编码
    // 格式：[顶点数][索引1][索引2]...[邻居数][邻居1]...
    std::vector<uint8_t> polygonData;
};

// NavMesh 流式加载
class StreamingNavMesh {
public:
    void loadTile(int x, int z) {
        if (loadedTiles.count({x, z})) return;

        // 异步加载 tile 数据
        std::string filename = getTileFilename(x, z);
        asyncLoadFile(filename, [this, x, z](const std::vector<uint8_t>& data) {
            NavMeshTile* tile = deserializeTile(data);

            std::lock_guard<std::mutex> lock(tileMutex);
            loadedTiles[{x, z}] = tile;

            // 重建与相邻 tile 的连接
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

## 调试与可视化

### NavMesh 可视化

```cpp
// NavMesh 调试渲染
class NavMeshDebugRenderer {
public:
    void render(const NavMesh& navMesh) {
        // 渲染多边形
        for (int i = 0; i < navMesh.getPolygonCount(); i++) {
            const Polygon& poly = navMesh.getPolygon(i);

            // 根据区域类型选择颜色
            Color color = getAreaColor(poly.areaType);

            // 绘制多边形边界
            for (int j = 0; j < poly.vertexCount; j++) {
                int nextJ = (j + 1) % poly.vertexCount;
                Vector3 v1 = navMesh.getVertex(poly.vertexIndices[j]);
                Vector3 v2 = navMesh.getVertex(poly.vertexIndices[nextJ]);

                drawLine(v1, v2, color);
            }

            // 绘制多边形填充（半透明）
            drawPolygon(poly, color.withAlpha(0.3f));
        }

        // 渲染多边形中心和编号
        if (showPolygonIds) {
            for (int i = 0; i < navMesh.getPolygonCount(); i++) {
                Vector3 center = navMesh.getPolygonCenter(i);
                drawText(center, std::to_string(i), Color::White);
            }
        }

        // 渲染 Off-Mesh Links
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
        drawSphere(path.back(), 0.2f, Color::Red);  // 终点
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

### 寻路调试

```cpp
// 寻路过程可视化
class PathfindingVisualizer {
public:
    void visualizeSearch(const Vector3& start, const Vector3& end) {
        searchSteps.clear();

        // 使用回调记录搜索过程
        navMesh->findPath(start, end, [this](const SearchStep& step) {
            searchSteps.push_back(step);
        });
    }

    void playback(float time) {
        int stepIndex = (int)(time * playbackSpeed);
        stepIndex = std::min(stepIndex, (int)searchSteps.size() - 1);

        for (int i = 0; i <= stepIndex; i++) {
            const SearchStep& step = searchSteps[i];

            // 绘制已访问的多边形
            Color visitedColor = Color::Red.withAlpha(0.3f);
            drawPolygon(step.polygonId, visitedColor);

            // 绘制当前探索边界
            if (i == stepIndex) {
                for (int neighborId : step.neighbors) {
                    drawPolygon(neighborId, Color::Yellow.withAlpha(0.5f));
                }
            }
        }

        // 绘制最终路径
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
    float playbackSpeed = 10.0f;  // 每秒显示的步骤数
};
```

## 面试要点

### 常见面试问题

**Q1: NavMesh 相比传统网格寻路有什么优势？**

NavMesh 的主要优势包括：
- **存储效率高**：使用凸多边形而非大量网格单元，内存占用小
- **路径平滑**：生成的路径更自然，无锯齿感
- **查询高效**：使用空间索引结构，点定位和路径查询都很快
- **支持复杂地形**：能处理斜坡、多层结构等
- **灵活性强**：易于添加区域代价、Off-Mesh Link 等功能

**Q2: 为什么 NavMesh 使用凸多边形？**

凸多边形具有关键特性：在凸多边形内部，任意两点之间的直线路径都是可行的。这意味着：
- 简化路径规划：不需要在多边形内部进行额外的碰撞检测
- 高效的点包含测试：使用简单的算法即可判断点是否在多边形内
- 便于网格简化：复杂场景可以分解为最少数量的凸多边形

**Q3: 漏斗算法的作用是什么？**

A* 算法在 NavMesh 上找到的是多边形序列路径，但我们需要的是平滑的点路径。漏斗算法的作用是：
- 将多边形路径转换为最短的点路径
- 通过迭代收紧"漏斗"来消除冗余路径点
- 时间复杂度 O(n)，非常高效

**Q4: 如何处理动态障碍物？**

处理动态障碍物的方法包括：
1. **局部重建**：只重新生成受影响区域的 NavMesh
2. **分层 NavMesh**：将场景划分为 Tile，只更新受影响的 Tile
3. **NavMesh Carving**：使用覆盖层临时修改可行走区域，不改变原始 NavMesh
4. **避障算法**：使用 RVO 等算法在运行时避开动态障碍物

**Q5: 什么是 Off-Mesh Link？**

Off-Mesh Link 是 NavMesh 之外的特殊连接，用于表示：
- 跳跃（从一个平台跳到另一个）
- 攀爬（爬梯子、翻墙）
- 传送门（瞬间移动）
- 门（可能需要开启条件）

Off-Mesh Link 允许 AI 执行特殊动作来连接原本不相连的导航区域。

### 实战建议

1. **合理配置参数**：体素大小、Agent 参数等需要根据游戏需求调整
2. **分层架构**：大型场景使用分层 NavMesh 提高更新效率
3. **缓存路径**：对频繁请求的路径进行缓存
4. **异步处理**：NavMesh 生成和复杂寻路应异步执行
5. **调试工具**：开发可视化工具帮助调试 NavMesh 问题
6. **性能监控**：关注寻路请求的频率和耗时

## 总结

导航网格是现代3D游戏中实现AI寻路的核心技术。本文详细介绍了 NavMesh 的核心概念、生成算法、查询机制、动态更新策略以及在 Unity 和 Unreal Engine 中的实践应用。

**核心要点回顾：**

1. **NavMesh 基础**：使用凸多边形表示可行走区域，存储高效、查询快速
2. **生成算法**：体素化 -> 区域划分 -> 轮廓追踪 -> 凸多边形分解
3. **寻路查询**：A* 找多边形路径 + 漏斗算法转换为点路径
4. **动态更新**：分层 NavMesh、局部重建、Carving 等策略
5. **Agent 系统**：路径跟随、局部避障（RVO）、区域代价
6. **引擎实践**：Unity 和 Unreal Engine 都提供完善的 NavMesh 系统

掌握 NavMesh 技术不仅能让你开发出更智能的游戏 AI，也是游戏开发面试中的重要知识点。建议结合实际项目多加练习，深入理解各个算法的原理和应用场景。
