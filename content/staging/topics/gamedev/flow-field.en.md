---
title: Flow Field Pathfinding
description: "Master flow field pathfinding: efficient multi-agent navigation, vector fields, and real-time implementation for RTS and crowd simulation"
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - pathfinding
  - flow field
  - AI
  - RTS
  - crowd simulation
status: imported
origin: old/src/content/docs/gamedev/flow-field.en.md
divergence: 0.198
issues: []
legacy:
  category: GameDev
  subcategory: Game AI
  order: 53
  lastUpdated: 2026-01-21
---

Flow field pathfinding is a powerful technique for navigating large numbers of agents to a common destination. Unlike traditional A* pathfinding that computes a path for each agent, flow fields compute a single vector field that all agents can use simultaneously, making it ideal for RTS games, crowd simulation, and tower defense scenarios.

## Concept Overview

### What is Flow Field Pathfinding?

A flow field (also called a vector field) is a grid where each cell contains a direction vector pointing toward the optimal path to a destination. Once computed, any number of agents can use the same flow field to navigate without additional pathfinding calculations.

```
+=====================================================================+
|                    FLOW FIELD VISUALIZATION                          |
+=====================================================================+
|                                                                      |
|   Traditional A* (per-agent):        Flow Field (shared):            |
|                                                                      |
|   Agent 1: Find path ------+         Build field once:               |
|   Agent 2: Find path ------+         +--+--+--+--+--+                |
|   Agent 3: Find path ------+         |<-|<-|<-|<-| G|                |
|   ...                      |         +--+--+--+--+--+                |
|   Agent N: Find path ------+         |<-|<-|<-|^ |^ |                |
|                            |         +--+--+--+--+--+                |
|   N pathfinding calls!     |         |<-|<-|^ |^ |^ |                |
|                            |         +--+--+--+--+--+                |
|                            |                                          |
|                            |         All agents use same field!      |
|                            |         O(1) per agent lookup           |
|                                                                      |
+=====================================================================+
```

### Why Use Flow Fields?

1. **Scalability**: One calculation serves thousands of agents
2. **Smooth Movement**: Vectors provide natural steering directions
3. **Dynamic Updates**: Easily update field when obstacles change
4. **Group Coordination**: Agents naturally form cohesive groups
5. **Local Avoidance**: Combine with steering behaviors seamlessly

### When to Use Flow Fields

| Scenario | Use Flow Fields | Use A* |
|----------|----------------|--------|
| Many agents, one destination | Yes | No |
| Few agents, many destinations | No | Yes |
| Large open areas | Yes | Depends |
| Complex mazes | Depends | Yes |
| Frequently changing goals | No | Yes |
| Static or semi-static goals | Yes | No |

## Core Principles

### Flow Field Generation Steps

```
+=====================================================================+
|                    FLOW FIELD GENERATION PIPELINE                    |
+=====================================================================+
|                                                                      |
|   Step 1: Cost Field              Step 2: Integration Field          |
|   +--+--+--+--+--+                 +--+--+--+--+--+                  |
|   | 1| 1| 1| 1| 1|                 | 4| 3| 2| 1| 0|                  |
|   +--+--+--+--+--+                 +--+--+--+--+--+                  |
|   | 1|##|##| 1| 1|   ------->     | 5|##|##| 2| 1|                  |
|   +--+--+--+--+--+   Dijkstra     +--+--+--+--+--+                  |
|   | 1| 1| 1| 1| 1|                 | 6| 5| 4| 3| 2|                  |
|   +--+--+--+--+--+                 +--+--+--+--+--+                  |
|                                                                      |
|   Step 3: Flow Field                                                |
|   +--+--+--+--+--+                                                   |
|   |->|->|->|->| G|   Each cell points to lowest-cost neighbor       |
|   +--+--+--+--+--+                                                   |
|   |->|##|##|^ |^ |                                                   |
|   +--+--+--+--+--+                                                   |
|   |->|->|->|^ |^ |                                                   |
|   +--+--+--+--+--+                                                   |
|                                                                      |
+=====================================================================+
```

### The Three Fields

1. **Cost Field**: Base traversal cost for each cell (terrain, obstacles)
2. **Integration Field**: Total cost from each cell to destination
3. **Flow Field**: Direction vectors pointing toward destination

## Key Concepts

### Cost Field

The cost field represents how expensive it is to traverse each cell:

```typescript
interface CostField {
    width: number;
    height: number;
    cells: number[];  // Cost values (1 = normal, 255 = impassable)
}

function createCostField(width: number, height: number): CostField {
    const cells = new Array(width * height).fill(1);  // Default cost = 1
    return { width, height, cells };
}

function setCost(field: CostField, x: number, y: number, cost: number): void {
    if (x >= 0 && x < field.width && y >= 0 && y < field.height) {
        field.cells[y * field.width + x] = cost;
    }
}

function getCost(field: CostField, x: number, y: number): number {
    if (x < 0 || x >= field.width || y < 0 || y >= field.height) {
        return 255;  // Out of bounds = impassable
    }
    return field.cells[y * field.width + x];
}

// Mark obstacles
function addObstacle(field: CostField, x: number, y: number,
                     width: number, height: number): void {
    for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
            setCost(field, x + dx, y + dy, 255);
        }
    }
}

// Variable terrain costs
function setTerrainCost(field: CostField, x: number, y: number,
                        terrainType: string): void {
    const costs: { [key: string]: number } = {
        'grass': 1,
        'road': 1,
        'sand': 2,
        'water': 5,
        'mud': 3,
        'wall': 255
    };
    setCost(field, x, y, costs[terrainType] || 1);
}
```

### Integration Field

The integration field stores the cumulative cost from each cell to the destination:

```typescript
interface IntegrationField {
    width: number;
    height: number;
    cells: number[];  // Integration values (distance to goal)
}

const IMPASSABLE = 65535;

function createIntegrationField(costField: CostField,
                                goalX: number, goalY: number): IntegrationField {
    const { width, height } = costField;
    const cells = new Array(width * height).fill(IMPASSABLE);

    // Dijkstra's algorithm from goal
    const openList: Array<{x: number, y: number, cost: number}> = [];

    // Initialize goal
    const goalIndex = goalY * width + goalX;
    cells[goalIndex] = 0;
    openList.push({ x: goalX, y: goalY, cost: 0 });

    // Neighbor offsets (4-directional)
    const neighbors = [
        { dx: 0, dy: -1 },  // Up
        { dx: 1, dy: 0 },   // Right
        { dx: 0, dy: 1 },   // Down
        { dx: -1, dy: 0 }   // Left
    ];

    // 8-directional for smoother paths
    const diagonalNeighbors = [
        { dx: -1, dy: -1, cost: 1.414 },
        { dx: 1, dy: -1, cost: 1.414 },
        { dx: -1, dy: 1, cost: 1.414 },
        { dx: 1, dy: 1, cost: 1.414 }
    ];

    while (openList.length > 0) {
        // Sort by cost (use priority queue for better performance)
        openList.sort((a, b) => a.cost - b.cost);
        const current = openList.shift()!;

        // Check cardinal neighbors
        for (const n of neighbors) {
            const nx = current.x + n.dx;
            const ny = current.y + n.dy;

            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            const neighborCost = getCost(costField, nx, ny);
            if (neighborCost >= 255) continue;  // Impassable

            const newCost = current.cost + neighborCost;
            const neighborIndex = ny * width + nx;

            if (newCost < cells[neighborIndex]) {
                cells[neighborIndex] = newCost;
                openList.push({ x: nx, y: ny, cost: newCost });
            }
        }

        // Check diagonal neighbors
        for (const n of diagonalNeighbors) {
            const nx = current.x + n.dx;
            const ny = current.y + n.dy;

            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

            // Check if diagonal is blocked (corner cutting)
            if (getCost(costField, current.x + n.dx, current.y) >= 255 ||
                getCost(costField, current.x, current.y + n.dy) >= 255) {
                continue;
            }

            const neighborCost = getCost(costField, nx, ny);
            if (neighborCost >= 255) continue;

            const newCost = current.cost + neighborCost * n.cost;
            const neighborIndex = ny * width + nx;

            if (newCost < cells[neighborIndex]) {
                cells[neighborIndex] = newCost;
                openList.push({ x: nx, y: ny, cost: newCost });
            }
        }
    }

    return { width, height, cells };
}
```

### Flow Field

The flow field contains direction vectors pointing toward the destination:

```typescript
interface Vector2 {
    x: number;
    y: number;
}

interface FlowField {
    width: number;
    height: number;
    vectors: Vector2[];
}

function createFlowField(integrationField: IntegrationField): FlowField {
    const { width, height, cells } = integrationField;
    const vectors: Vector2[] = new Array(width * height);

    const neighbors = [
        { dx: 0, dy: -1 },   // Up
        { dx: 1, dy: -1 },   // Up-Right
        { dx: 1, dy: 0 },    // Right
        { dx: 1, dy: 1 },    // Down-Right
        { dx: 0, dy: 1 },    // Down
        { dx: -1, dy: 1 },   // Down-Left
        { dx: -1, dy: 0 },   // Left
        { dx: -1, dy: -1 }   // Up-Left
    ];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;
            const currentCost = cells[index];

            if (currentCost >= IMPASSABLE) {
                // Impassable cell - no direction
                vectors[index] = { x: 0, y: 0 };
                continue;
            }

            if (currentCost === 0) {
                // Goal cell - no direction needed
                vectors[index] = { x: 0, y: 0 };
                continue;
            }

            // Find neighbor with lowest integration value
            let bestDir: Vector2 = { x: 0, y: 0 };
            let bestCost = currentCost;

            for (const n of neighbors) {
                const nx = x + n.dx;
                const ny = y + n.dy;

                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

                const neighborCost = cells[ny * width + nx];

                if (neighborCost < bestCost) {
                    bestCost = neighborCost;
                    bestDir = { x: n.dx, y: n.dy };
                }
            }

            // Normalize direction
            const length = Math.sqrt(bestDir.x * bestDir.x + bestDir.y * bestDir.y);
            if (length > 0) {
                vectors[index] = {
                    x: bestDir.x / length,
                    y: bestDir.y / length
                };
            } else {
                vectors[index] = { x: 0, y: 0 };
            }
        }
    }

    return { width, height, vectors };
}
```

## Code Examples

### Complete Flow Field System

```typescript
class FlowFieldSystem {
    private costField: CostField;
    private integrationField: IntegrationField | null = null;
    private flowField: FlowField | null = null;
    private goalX: number = -1;
    private goalY: number = -1;

    constructor(width: number, height: number) {
        this.costField = createCostField(width, height);
    }

    setCellCost(x: number, y: number, cost: number): void {
        setCost(this.costField, x, y, cost);
        this.invalidate();
    }

    setGoal(x: number, y: number): void {
        this.goalX = x;
        this.goalY = y;
        this.rebuild();
    }

    private invalidate(): void {
        this.integrationField = null;
        this.flowField = null;
    }

    private rebuild(): void {
        if (this.goalX < 0 || this.goalY < 0) return;

        this.integrationField = createIntegrationField(
            this.costField, this.goalX, this.goalY
        );
        this.flowField = createFlowField(this.integrationField);
    }

    getDirection(worldX: number, worldY: number, cellSize: number): Vector2 {
        if (!this.flowField) return { x: 0, y: 0 };

        const cellX = Math.floor(worldX / cellSize);
        const cellY = Math.floor(worldY / cellSize);

        if (cellX < 0 || cellX >= this.flowField.width ||
            cellY < 0 || cellY >= this.flowField.height) {
            return { x: 0, y: 0 };
        }

        return this.flowField.vectors[cellY * this.flowField.width + cellX];
    }

    // Bilinear interpolation for smoother movement
    getDirectionSmooth(worldX: number, worldY: number, cellSize: number): Vector2 {
        if (!this.flowField) return { x: 0, y: 0 };

        const fx = worldX / cellSize;
        const fy = worldY / cellSize;

        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const tx = fx - x0;
        const ty = fy - y0;

        const getVec = (x: number, y: number): Vector2 => {
            if (x < 0 || x >= this.flowField!.width ||
                y < 0 || y >= this.flowField!.height) {
                return { x: 0, y: 0 };
            }
            return this.flowField!.vectors[y * this.flowField!.width + x];
        };

        const v00 = getVec(x0, y0);
        const v10 = getVec(x1, y0);
        const v01 = getVec(x0, y1);
        const v11 = getVec(x1, y1);

        // Bilinear interpolation
        const topX = v00.x * (1 - tx) + v10.x * tx;
        const topY = v00.y * (1 - tx) + v10.y * tx;
        const bottomX = v01.x * (1 - tx) + v11.x * tx;
        const bottomY = v01.y * (1 - tx) + v11.y * tx;

        return {
            x: topX * (1 - ty) + bottomX * ty,
            y: topY * (1 - ty) + bottomY * ty
        };
    }

    getIntegrationValue(x: number, y: number): number {
        if (!this.integrationField) return IMPASSABLE;
        if (x < 0 || x >= this.integrationField.width ||
            y < 0 || y >= this.integrationField.height) {
            return IMPASSABLE;
        }
        return this.integrationField.cells[y * this.integrationField.width + x];
    }
}
```

### Agent Movement with Flow Field

```typescript
interface Agent {
    x: number;
    y: number;
    vx: number;
    vy: number;
    speed: number;
    radius: number;
}

class FlowFieldAgent {
    private flowFieldSystem: FlowFieldSystem;
    private cellSize: number;

    constructor(flowFieldSystem: FlowFieldSystem, cellSize: number) {
        this.flowFieldSystem = flowFieldSystem;
        this.cellSize = cellSize;
    }

    updateAgent(agent: Agent, deltaTime: number): void {
        // Get flow direction at agent position
        const flowDir = this.flowFieldSystem.getDirectionSmooth(
            agent.x, agent.y, this.cellSize
        );

        if (flowDir.x === 0 && flowDir.y === 0) {
            // At goal or no path - decelerate
            agent.vx *= 0.9;
            agent.vy *= 0.9;
        } else {
            // Accelerate toward flow direction
            const targetVx = flowDir.x * agent.speed;
            const targetVy = flowDir.y * agent.speed;

            // Smooth steering
            const steerStrength = 5.0;
            agent.vx += (targetVx - agent.vx) * steerStrength * deltaTime;
            agent.vy += (targetVy - agent.vy) * steerStrength * deltaTime;
        }

        // Apply velocity
        agent.x += agent.vx * deltaTime;
        agent.y += agent.vy * deltaTime;
    }

    updateAgents(agents: Agent[], deltaTime: number): void {
        // Update all agents
        for (const agent of agents) {
            this.updateAgent(agent, deltaTime);
        }

        // Local avoidance between agents
        this.resolveCollisions(agents);
    }

    private resolveCollisions(agents: Agent[]): void {
        for (let i = 0; i < agents.length; i++) {
            for (let j = i + 1; j < agents.length; j++) {
                const a = agents[i];
                const b = agents[j];

                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = a.radius + b.radius;

                if (dist < minDist && dist > 0.001) {
                    // Push agents apart
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    const separation = overlap * 0.5;
                    a.x -= nx * separation;
                    a.y -= ny * separation;
                    b.x += nx * separation;
                    b.y += ny * separation;
                }
            }
        }
    }
}
```

### Hierarchical Flow Fields

```typescript
// For large maps, use multiple resolution levels
class HierarchicalFlowField {
    private levels: FlowFieldSystem[] = [];
    private levelSizes: number[] = [];

    constructor(width: number, height: number, numLevels: number = 3) {
        let w = width;
        let h = height;

        for (let i = 0; i < numLevels; i++) {
            this.levels.push(new FlowFieldSystem(w, h));
            this.levelSizes.push(Math.pow(2, i));
            w = Math.ceil(w / 2);
            h = Math.ceil(h / 2);
        }
    }

    setGoal(x: number, y: number): void {
        for (let i = 0; i < this.levels.length; i++) {
            const scale = this.levelSizes[i];
            this.levels[i].setGoal(
                Math.floor(x / scale),
                Math.floor(y / scale)
            );
        }
    }

    getDirection(worldX: number, worldY: number, cellSize: number): Vector2 {
        // Use coarser level for distant cells
        const distToGoal = this.getApproximateDistanceToGoal(worldX, worldY, cellSize);

        // Choose level based on distance
        let levelIndex = 0;
        if (distToGoal > 50) levelIndex = 1;
        if (distToGoal > 100) levelIndex = 2;
        levelIndex = Math.min(levelIndex, this.levels.length - 1);

        const scale = this.levelSizes[levelIndex];
        return this.levels[levelIndex].getDirection(
            worldX / scale,
            worldY / scale,
            cellSize / scale
        );
    }

    private getApproximateDistanceToGoal(x: number, y: number, cellSize: number): number {
        // Use coarsest level for quick distance estimate
        const coarse = this.levels[this.levels.length - 1];
        const scale = this.levelSizes[this.levels.length - 1];
        const value = coarse.getIntegrationValue(
            Math.floor(x / (cellSize * scale)),
            Math.floor(y / (cellSize * scale))
        );
        return value * scale;
    }
}
```

### Sector-Based Flow Fields

```typescript
// Divide map into sectors for efficient partial updates
interface Sector {
    x: number;
    y: number;
    width: number;
    height: number;
    flowField: FlowField | null;
    dirty: boolean;
}

class SectorFlowField {
    private sectors: Sector[][] = [];
    private sectorSize: number;
    private globalCostField: CostField;
    private goalX: number = -1;
    private goalY: number = -1;

    constructor(width: number, height: number, sectorSize: number = 16) {
        this.sectorSize = sectorSize;
        this.globalCostField = createCostField(width, height);

        const sectorsX = Math.ceil(width / sectorSize);
        const sectorsY = Math.ceil(height / sectorSize);

        for (let sy = 0; sy < sectorsY; sy++) {
            this.sectors[sy] = [];
            for (let sx = 0; sx < sectorsX; sx++) {
                this.sectors[sy][sx] = {
                    x: sx * sectorSize,
                    y: sy * sectorSize,
                    width: Math.min(sectorSize, width - sx * sectorSize),
                    height: Math.min(sectorSize, height - sy * sectorSize),
                    flowField: null,
                    dirty: true
                };
            }
        }
    }

    setCellCost(x: number, y: number, cost: number): void {
        setCost(this.globalCostField, x, y, cost);

        // Mark affected sector as dirty
        const sx = Math.floor(x / this.sectorSize);
        const sy = Math.floor(y / this.sectorSize);
        if (this.sectors[sy] && this.sectors[sy][sx]) {
            this.sectors[sy][sx].dirty = true;
        }
    }

    setGoal(x: number, y: number): void {
        this.goalX = x;
        this.goalY = y;

        // Mark all sectors as dirty when goal changes
        for (const row of this.sectors) {
            for (const sector of row) {
                sector.dirty = true;
            }
        }
    }

    // Update only sectors that agents are in
    updateSectorsNearAgents(agents: Agent[]): void {
        const sectorsToUpdate = new Set<string>();

        for (const agent of agents) {
            const sx = Math.floor(agent.x / this.sectorSize);
            const sy = Math.floor(agent.y / this.sectorSize);

            // Add surrounding sectors
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    sectorsToUpdate.add(`${sx + dx},${sy + dy}`);
                }
            }
        }

        for (const key of sectorsToUpdate) {
            const [sx, sy] = key.split(',').map(Number);
            this.updateSector(sx, sy);
        }
    }

    private updateSector(sx: number, sy: number): void {
        if (!this.sectors[sy] || !this.sectors[sy][sx]) return;

        const sector = this.sectors[sy][sx];
        if (!sector.dirty) return;

        // Build integration and flow field for this sector
        // In practice, you'd want to consider portal connections to other sectors
        const integration = createIntegrationField(
            this.globalCostField, this.goalX, this.goalY
        );
        sector.flowField = createFlowField(integration);
        sector.dirty = false;
    }

    getDirection(worldX: number, worldY: number, cellSize: number): Vector2 {
        const sx = Math.floor(worldX / this.sectorSize / cellSize);
        const sy = Math.floor(worldY / this.sectorSize / cellSize);

        if (!this.sectors[sy] || !this.sectors[sy][sx]) {
            return { x: 0, y: 0 };
        }

        const sector = this.sectors[sy][sx];
        if (!sector.flowField) {
            this.updateSector(sx, sy);
        }

        if (!sector.flowField) return { x: 0, y: 0 };

        const localX = Math.floor(worldX / cellSize) - sector.x;
        const localY = Math.floor(worldY / cellSize) - sector.y;

        if (localX < 0 || localX >= sector.width ||
            localY < 0 || localY >= sector.height) {
            return { x: 0, y: 0 };
        }

        return sector.flowField.vectors[localY * sector.width + localX];
    }
}
```

### Unity Implementation

```csharp
using UnityEngine;
using System.Collections.Generic;

public class FlowFieldManager : MonoBehaviour
{
    [Header("Grid Settings")]
    public int gridWidth = 50;
    public int gridHeight = 50;
    public float cellSize = 1.0f;

    [Header("Debug")]
    public bool showDebug = true;
    public float arrowSize = 0.5f;

    private byte[] costField;
    private ushort[] integrationField;
    private Vector2[] flowField;

    private Vector2Int goalCell = new Vector2Int(-1, -1);

    void Awake()
    {
        costField = new byte[gridWidth * gridHeight];
        integrationField = new ushort[gridWidth * gridHeight];
        flowField = new Vector2[gridWidth * gridHeight];

        // Initialize cost field (1 = normal)
        for (int i = 0; i < costField.Length; i++)
        {
            costField[i] = 1;
        }
    }

    public void SetObstacle(int x, int y)
    {
        if (IsValidCell(x, y))
        {
            costField[y * gridWidth + x] = 255;
        }
    }

    public void SetGoal(Vector3 worldPosition)
    {
        Vector2Int cell = WorldToCell(worldPosition);
        if (IsValidCell(cell.x, cell.y))
        {
            goalCell = cell;
            RebuildFlowField();
        }
    }

    public Vector2 GetFlowDirection(Vector3 worldPosition)
    {
        Vector2Int cell = WorldToCell(worldPosition);
        if (!IsValidCell(cell.x, cell.y))
        {
            return Vector2.zero;
        }
        return flowField[cell.y * gridWidth + cell.x];
    }

    public Vector2 GetFlowDirectionSmooth(Vector3 worldPosition)
    {
        float fx = worldPosition.x / cellSize;
        float fz = worldPosition.z / cellSize;

        int x0 = Mathf.FloorToInt(fx);
        int z0 = Mathf.FloorToInt(fz);

        float tx = fx - x0;
        float tz = fz - z0;

        Vector2 v00 = GetFlowAt(x0, z0);
        Vector2 v10 = GetFlowAt(x0 + 1, z0);
        Vector2 v01 = GetFlowAt(x0, z0 + 1);
        Vector2 v11 = GetFlowAt(x0 + 1, z0 + 1);

        Vector2 top = Vector2.Lerp(v00, v10, tx);
        Vector2 bottom = Vector2.Lerp(v01, v11, tx);

        return Vector2.Lerp(top, bottom, tz);
    }

    private Vector2 GetFlowAt(int x, int y)
    {
        if (!IsValidCell(x, y)) return Vector2.zero;
        return flowField[y * gridWidth + x];
    }

    private void RebuildFlowField()
    {
        // Reset integration field
        for (int i = 0; i < integrationField.Length; i++)
        {
            integrationField[i] = ushort.MaxValue;
        }

        // Dijkstra from goal
        Queue<Vector2Int> openList = new Queue<Vector2Int>();
        integrationField[goalCell.y * gridWidth + goalCell.x] = 0;
        openList.Enqueue(goalCell);

        int[] dx = { 0, 1, 0, -1, 1, 1, -1, -1 };
        int[] dy = { -1, 0, 1, 0, -1, 1, 1, -1 };
        float[] costs = { 1, 1, 1, 1, 1.414f, 1.414f, 1.414f, 1.414f };

        while (openList.Count > 0)
        {
            Vector2Int current = openList.Dequeue();
            int currentCost = integrationField[current.y * gridWidth + current.x];

            for (int i = 0; i < 8; i++)
            {
                int nx = current.x + dx[i];
                int ny = current.y + dy[i];

                if (!IsValidCell(nx, ny)) continue;

                byte cellCost = costField[ny * gridWidth + nx];
                if (cellCost >= 255) continue;

                // Check corner cutting for diagonals
                if (i >= 4)
                {
                    if (costField[current.y * gridWidth + nx] >= 255 ||
                        costField[ny * gridWidth + current.x] >= 255)
                    {
                        continue;
                    }
                }

                int newCost = currentCost + Mathf.RoundToInt(cellCost * costs[i]);
                int neighborIndex = ny * gridWidth + nx;

                if (newCost < integrationField[neighborIndex])
                {
                    integrationField[neighborIndex] = (ushort)newCost;
                    openList.Enqueue(new Vector2Int(nx, ny));
                }
            }
        }

        // Build flow field
        for (int y = 0; y < gridHeight; y++)
        {
            for (int x = 0; x < gridWidth; x++)
            {
                int index = y * gridWidth + x;

                if (integrationField[index] >= ushort.MaxValue)
                {
                    flowField[index] = Vector2.zero;
                    continue;
                }

                if (integrationField[index] == 0)
                {
                    flowField[index] = Vector2.zero;
                    continue;
                }

                // Find lowest neighbor
                Vector2 bestDir = Vector2.zero;
                int bestCost = integrationField[index];

                for (int i = 0; i < 8; i++)
                {
                    int nx = x + dx[i];
                    int ny = y + dy[i];

                    if (!IsValidCell(nx, ny)) continue;

                    int neighborCost = integrationField[ny * gridWidth + nx];
                    if (neighborCost < bestCost)
                    {
                        bestCost = neighborCost;
                        bestDir = new Vector2(dx[i], dy[i]);
                    }
                }

                flowField[index] = bestDir.normalized;
            }
        }
    }

    private bool IsValidCell(int x, int y)
    {
        return x >= 0 && x < gridWidth && y >= 0 && y < gridHeight;
    }

    private Vector2Int WorldToCell(Vector3 worldPos)
    {
        return new Vector2Int(
            Mathf.FloorToInt(worldPos.x / cellSize),
            Mathf.FloorToInt(worldPos.z / cellSize)
        );
    }

    private Vector3 CellToWorld(int x, int y)
    {
        return new Vector3(
            (x + 0.5f) * cellSize,
            0,
            (y + 0.5f) * cellSize
        );
    }

    void OnDrawGizmos()
    {
        if (!showDebug || flowField == null) return;

        for (int y = 0; y < gridHeight; y++)
        {
            for (int x = 0; x < gridWidth; x++)
            {
                int index = y * gridWidth + x;
                Vector3 cellCenter = CellToWorld(x, y);

                // Draw cell
                if (costField != null && costField[index] >= 255)
                {
                    Gizmos.color = Color.black;
                    Gizmos.DrawCube(cellCenter, Vector3.one * cellSize * 0.9f);
                }

                // Draw flow direction
                Vector2 flow = flowField[index];
                if (flow.magnitude > 0.01f)
                {
                    Gizmos.color = Color.blue;
                    Vector3 from = cellCenter;
                    Vector3 to = cellCenter + new Vector3(flow.x, 0, flow.y) * arrowSize;
                    Gizmos.DrawLine(from, to);

                    // Arrow head
                    Vector3 dir = (to - from).normalized;
                    Vector3 right = Vector3.Cross(Vector3.up, dir) * 0.2f * arrowSize;
                    Gizmos.DrawLine(to, to - dir * 0.3f * arrowSize + right);
                    Gizmos.DrawLine(to, to - dir * 0.3f * arrowSize - right);
                }
            }
        }

        // Draw goal
        if (goalCell.x >= 0 && goalCell.y >= 0)
        {
            Gizmos.color = Color.green;
            Gizmos.DrawSphere(CellToWorld(goalCell.x, goalCell.y), cellSize * 0.3f);
        }
    }
}
```

## Best Practices

### 1. Optimize Integration Field Generation

```typescript
// Use a proper priority queue for Dijkstra's algorithm
class PriorityQueue<T> {
    private items: { item: T; priority: number }[] = [];

    enqueue(item: T, priority: number): void {
        const newNode = { item, priority };
        let added = false;

        for (let i = 0; i < this.items.length; i++) {
            if (newNode.priority < this.items[i].priority) {
                this.items.splice(i, 0, newNode);
                added = true;
                break;
            }
        }

        if (!added) {
            this.items.push(newNode);
        }
    }

    dequeue(): T | undefined {
        return this.items.shift()?.item;
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }
}
```

### 2. Cache Flow Fields for Static Goals

```typescript
class FlowFieldCache {
    private cache: Map<string, FlowField> = new Map();

    getOrCreate(goalX: number, goalY: number,
                costField: CostField): FlowField {
        const key = `${goalX},${goalY}`;

        if (!this.cache.has(key)) {
            const integration = createIntegrationField(costField, goalX, goalY);
            const flow = createFlowField(integration);
            this.cache.set(key, flow);
        }

        return this.cache.get(key)!;
    }

    invalidate(): void {
        this.cache.clear();
    }

    invalidateGoal(goalX: number, goalY: number): void {
        this.cache.delete(`${goalX},${goalY}`);
    }
}
```

### 3. Spread Computation Over Frames

```typescript
class AsyncFlowFieldBuilder {
    private integrationQueue: Array<{x: number, y: number, cost: number}> = [];
    private maxIterationsPerFrame: number = 1000;
    private isBuilding: boolean = false;

    startBuilding(costField: CostField, goalX: number, goalY: number,
                  onComplete: (field: FlowField) => void): void {
        this.isBuilding = true;
        this.integrationQueue = [{ x: goalX, y: goalY, cost: 0 }];

        // Store state for incremental processing
        // ... implementation similar to createIntegrationField
        // but processes maxIterationsPerFrame per update
    }

    update(): void {
        if (!this.isBuilding) return;

        let iterations = 0;
        while (this.integrationQueue.length > 0 &&
               iterations < this.maxIterationsPerFrame) {
            // Process one cell
            // ...
            iterations++;
        }

        if (this.integrationQueue.length === 0) {
            // Complete - build flow field
            this.isBuilding = false;
        }
    }
}
```

## Common Pitfalls

### Pitfall 1: Corner Cutting

```typescript
// BAD: Agents cut through diagonal walls
// When checking diagonal neighbors, don't allow if adjacent cardinals are blocked

// GOOD: Block diagonal movement through corners
if (isDiagonal) {
    const cardinalA = getCost(field, current.x + n.dx, current.y);
    const cardinalB = getCost(field, current.x, current.y + n.dy);
    if (cardinalA >= 255 || cardinalB >= 255) {
        continue;  // Don't allow this diagonal
    }
}
```

### Pitfall 2: Stale Flow Fields

```typescript
// BAD: Not invalidating when obstacles change
setCellCost(x, y, 255);  // Add obstacle but flow field not updated

// GOOD: Invalidate and rebuild when needed
setCellCost(x, y, 255);
invalidateFlowField();
// Rebuild lazily or immediately
```

### Pitfall 3: Incorrect Cell Lookup

```typescript
// BAD: Using truncation which can be off by one
const cellX = Math.trunc(worldX / cellSize);

// GOOD: Use floor for consistent cell lookup
const cellX = Math.floor(worldX / cellSize);
```

## Performance Considerations

### Memory Usage

```
For a 100x100 grid:
- Cost Field: 10,000 bytes (1 byte per cell)
- Integration Field: 20,000 bytes (2 bytes per cell)
- Flow Field: 80,000 bytes (2 floats x 4 bytes per cell)
Total: ~110 KB per flow field

Optimization: Use compressed directions (8 directions = 3 bits)
```

### Computation Time

```
Flow field generation is O(n * log(n)) where n = grid cells
- 50x50 grid: ~5ms
- 100x100 grid: ~20ms
- 200x200 grid: ~100ms

Strategies:
- Use hierarchical/sector-based approach for large maps
- Spread computation over multiple frames
- Cache flow fields for static goals
- Use compute shaders for GPU acceleration
```

## Interview Focus Points

### Common Interview Questions

**Q1: What is the advantage of flow fields over A* for multiple agents?**

A* computes a separate path for each agent, resulting in O(n * pathfinding_cost) complexity. Flow fields compute once and all agents use the same field, giving O(1) lookup per agent regardless of count.

**Q2: How do you handle dynamic obstacles with flow fields?**

Options include: 1) Full rebuild (simple but slow), 2) Sector-based updates (only rebuild affected sectors), 3) Local modifications (update only nearby cells), 4) Hybrid approach with A* for dynamic obstacles.

**Q3: What are the three fields in a flow field system?**

1. Cost Field: Base traversal cost per cell
2. Integration Field: Total cost from cell to destination (built with Dijkstra's)
3. Flow Field: Direction vectors pointing toward destination

**Q4: How do you make agent movement smoother?**

Use bilinear interpolation when sampling the flow field, combine with steering behaviors, apply velocity smoothing/damping, and use local avoidance between agents.

**Q5: When would A* be better than flow fields?**

A* is better when: few agents with different destinations, frequently changing goals, very large sparse maps, or when paths need to be unique per agent (different unit sizes).

## Further Reading

### Articles and Papers

- "Continuum Crowds" by Adrien Treuille et al.
- "Crowd Pathfinding and Steering Using Flow Field Tiles"
- "Real-Time Crowd Simulation Using Flow Fields"

### Game Development Resources

- Elijah Emerson's Flow Field Tutorial Series
- Red Blob Games - Flow Field Pathfinding
- Gamasutra - Crowd Pathfinding articles

### Related Topics

- Potential Fields
- Navigation Meshes (NavMesh)
- Steering Behaviors
- A* and Dijkstra's Algorithm
- Spatial Hashing for Agent Collision
