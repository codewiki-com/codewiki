---
title: Wave Function Collapse (WFC) Generation Algorithm
description: Master the Wave Function Collapse algorithm for procedural content generation - from basic tile matching to complex 3D world generation
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - Procedural Generation
  - WFC
  - Algorithms
  - Level Design
  - Tilemap
  - Constraint Satisfaction
status: imported
origin: old/src/content/docs/gamedev/wfc.en.md
divergence: 0.211
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: GameDev
  subcategory: ""
  order: 50
  lastUpdated: 2026-01-21
---

Wave Function Collapse (WFC) is a revolutionary procedural generation algorithm inspired by quantum mechanics concepts. It generates complex, coherent patterns from a small set of input samples while respecting local constraints. Originally developed by Maxim Gumin in 2016, WFC has become a cornerstone technique in modern game development for generating everything from 2D tilemaps to entire 3D worlds.

## Concept Explanation

### What is Wave Function Collapse?

**Wave Function Collapse** is a constraint-based procedural generation algorithm that produces locally similar outputs from input samples. The name comes from quantum mechanics - each cell starts in a "superposition" of all possible states, then "collapses" to a single definite state through observation and constraint propagation.

```
Initial State (Superposition):
┌─────────────────────────────────────────────────────────┐
│ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │         │
│ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │         │
│ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │         │
│ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │         │
└─────────────────────────────────────────────────────────┘
Each cell can be any tile (A, B, C, or D)

After Collapse:
┌─────────────────────────────────────────────────────────┐
│     A     │     B     │     B     │     C     │         │
│     A     │     D     │     B     │     C     │         │
│     D     │     D     │     A     │     A     │         │
│     C     │     A     │     A     │     B     │         │
└─────────────────────────────────────────────────────────┘
Each cell has collapsed to a single valid tile
```

### The Quantum Analogy

The algorithm draws from quantum mechanics terminology:

| Quantum Concept | WFC Equivalent |
|-----------------|----------------|
| Superposition | Cell with multiple possible tiles |
| Observation | Selecting a specific tile for a cell |
| Wave function collapse | Reducing possibilities to one state |
| Entanglement | Constraints between adjacent cells |
| Entropy | Uncertainty (number of possibilities) |

### Two Main Variants

**1. Simple Tiled Model**
- Uses predefined tiles with explicit adjacency rules
- Each tile specifies which tiles can be neighbors
- Faster and more predictable
- Better for game development

**2. Overlapping Model**
- Learns patterns from an input sample image
- Extracts NxN patterns and their relationships
- More flexible but computationally expensive
- Better for texture synthesis

```
Simple Tiled Model:
┌────────────────────────────────────────────────┐
│ Input: Tiles + Adjacency Rules                 │
│                                                │
│ [Grass]──can connect──[Path]──can connect──[Water] │
│                                                │
│ Output: Valid tile arrangement                 │
└────────────────────────────────────────────────┘

Overlapping Model:
┌────────────────────────────────────────────────┐
│ Input: Sample Image                            │
│ ████░░░░░░                                     │
│ ████░░░░░░  →  Extract 3x3 patterns           │
│ ░░░░████░░  →  Learn adjacencies              │
│ ░░░░████░░  →  Generate new image             │
│                                                │
│ Output: Locally similar image                  │
└────────────────────────────────────────────────┘
```

## Core Principles

### The WFC Algorithm

```
┌─────────────────────────────────────────────────────────────────┐
│                    WFC Algorithm Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. INITIALIZATION                                              │
│     ┌─────────────────────────────────────────┐                │
│     │ Every cell starts with ALL possible     │                │
│     │ tiles in its domain                     │                │
│     └─────────────────────────────────────────┘                │
│                         ↓                                       │
│  2. OBSERVATION (Select cell with lowest entropy)              │
│     ┌─────────────────────────────────────────┐                │
│     │ Find unresolved cell with fewest        │                │
│     │ remaining possibilities                  │                │
│     │ Collapse it to ONE tile (weighted random)│                │
│     └─────────────────────────────────────────┘                │
│                         ↓                                       │
│  3. PROPAGATION (Enforce constraints)                          │
│     ┌─────────────────────────────────────────┐                │
│     │ For each affected neighbor:              │                │
│     │ - Remove invalid tile options            │                │
│     │ - If domain changed, propagate further   │                │
│     │ - If domain empty → CONTRADICTION        │                │
│     └─────────────────────────────────────────┘                │
│                         ↓                                       │
│  4. CHECK COMPLETION                                            │
│     ┌─────────────────────────────────────────┐                │
│     │ All cells collapsed? → SUCCESS          │                │
│     │ Contradiction? → BACKTRACK or RESTART   │                │
│     │ Otherwise? → Go to step 2               │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Entropy and Cell Selection

Entropy measures uncertainty in a cell. WFC uses the **Minimum Remaining Values (MRV)** heuristic:

```
Entropy Calculation:
entropy = log(sum_of_weights) - (sum_of_weight_log_weights / sum_of_weights)

Simple version (count-based):
entropy = number_of_remaining_possibilities

Weighted version accounts for tile frequencies:
┌──────────────────────────────────────────────────┐
│ Cell possibilities: [Grass(70%), Path(20%), Water(10%)]
│ Shannon entropy = -Σ(p * log(p))
│                 = -(0.7*log(0.7) + 0.2*log(0.2) + 0.1*log(0.1))
│                 ≈ 0.80
└──────────────────────────────────────────────────┘
```

### Constraint Propagation

When a cell collapses, constraints ripple outward:

```
Before Collapse:           After Collapse at (1,1):
┌───────┬───────┬───────┐  ┌───────┬───────┬───────┐
│ ABCD  │ ABCD  │ ABCD  │  │  AC   │  BD   │ ABCD  │
├───────┼───────┼───────┤  ├───────┼───────┼───────┤
│ ABCD  │ ABCD  │ ABCD  │  │  BD   │  [A]  │  AC   │
├───────┼───────┼───────┤  ├───────┼───────┼───────┤
│ ABCD  │ ABCD  │ ABCD  │  │ ABCD  │  BD   │ ABCD  │
└───────┴───────┴───────┘  └───────┴───────┴───────┘

If A can only be adjacent to: B, D (horizontal), A, C (vertical)
Neighbors must update their domains accordingly
```

## Key Concepts

### 1. Adjacency Rules

Define which tiles can be placed next to each other:

```csharp
// Direction enum for clarity
public enum Direction { Up, Down, Left, Right }

// Adjacency rule structure
public class TileAdjacency
{
    public string TileId;
    public Dictionary<Direction, HashSet<string>> ValidNeighbors;

    public TileAdjacency(string id)
    {
        TileId = id;
        ValidNeighbors = new Dictionary<Direction, HashSet<string>>
        {
            { Direction.Up, new HashSet<string>() },
            { Direction.Down, new HashSet<string>() },
            { Direction.Left, new HashSet<string>() },
            { Direction.Right, new HashSet<string>() }
        };
    }

    public bool CanBeNeighbor(string otherId, Direction direction)
    {
        return ValidNeighbors[direction].Contains(otherId);
    }
}

// Example: Road tile adjacencies
var roadTile = new TileAdjacency("road_horizontal");
roadTile.ValidNeighbors[Direction.Left].Add("road_horizontal");
roadTile.ValidNeighbors[Direction.Left].Add("road_corner_ne");
roadTile.ValidNeighbors[Direction.Left].Add("road_corner_se");
roadTile.ValidNeighbors[Direction.Right].Add("road_horizontal");
roadTile.ValidNeighbors[Direction.Right].Add("road_corner_nw");
roadTile.ValidNeighbors[Direction.Right].Add("road_corner_sw");
roadTile.ValidNeighbors[Direction.Up].Add("grass");
roadTile.ValidNeighbors[Direction.Down].Add("grass");
```

### 2. Socket System

A more scalable approach using connection types:

```csharp
// Socket-based connections (used in many WFC implementations)
public class Tile
{
    public string Id;
    public int[] Sockets; // [Top, Right, Bottom, Left]
    public float Weight;

    public Tile(string id, int top, int right, int bottom, int left, float weight = 1f)
    {
        Id = id;
        Sockets = new int[] { top, right, bottom, left };
        Weight = weight;
    }

    // Tiles connect if sockets match (or are complementary)
    public bool CanConnectTo(Tile other, Direction direction)
    {
        int mySocket = direction switch
        {
            Direction.Up => Sockets[0],
            Direction.Right => Sockets[1],
            Direction.Down => Sockets[2],
            Direction.Left => Sockets[3],
            _ => -1
        };

        int theirSocket = direction switch
        {
            Direction.Up => other.Sockets[2],    // Their bottom
            Direction.Right => other.Sockets[3], // Their left
            Direction.Down => other.Sockets[0],  // Their top
            Direction.Left => other.Sockets[1],  // Their right
            _ => -1
        };

        return mySocket == theirSocket;
    }
}

// Socket meanings example:
// 0 = Empty/Air
// 1 = Ground level
// 2 = Wall vertical
// 3 = Wall horizontal

var floorTile = new Tile("floor", 0, 1, 0, 1, weight: 5f);
var wallTile = new Tile("wall", 2, 0, 2, 0, weight: 1f);
var cornerTile = new Tile("corner", 2, 1, 1, 0, weight: 0.5f);
```

### 3. Tile Transformations

Generate rotated/mirrored variants automatically:

```csharp
public class TileVariantGenerator
{
    public static List<Tile> GenerateRotations(Tile baseTile, bool allowMirror = false)
    {
        var variants = new List<Tile>();
        var sockets = baseTile.Sockets;

        // Original
        variants.Add(baseTile);

        // 90 degree rotation: [Top, Right, Bottom, Left] -> [Left, Top, Right, Bottom]
        variants.Add(new Tile(
            baseTile.Id + "_90",
            sockets[3], sockets[0], sockets[1], sockets[2],
            baseTile.Weight
        ));

        // 180 degree rotation
        variants.Add(new Tile(
            baseTile.Id + "_180",
            sockets[2], sockets[3], sockets[0], sockets[1],
            baseTile.Weight
        ));

        // 270 degree rotation
        variants.Add(new Tile(
            baseTile.Id + "_270",
            sockets[1], sockets[2], sockets[3], sockets[0],
            baseTile.Weight
        ));

        if (allowMirror)
        {
            // Horizontal mirror: swap left and right
            variants.Add(new Tile(
                baseTile.Id + "_mirrorH",
                sockets[0], sockets[3], sockets[2], sockets[1],
                baseTile.Weight
            ));
        }

        // Remove duplicates (tiles that are symmetric)
        return variants.Distinct(new TileSocketComparer()).ToList();
    }
}
```

### 4. Weighted Random Selection

Control tile frequency in output:

```csharp
public class WeightedRandomSelector
{
    private Random random;

    public WeightedRandomSelector(int? seed = null)
    {
        random = seed.HasValue ? new Random(seed.Value) : new Random();
    }

    public T Select<T>(IEnumerable<(T item, float weight)> weightedItems)
    {
        var items = weightedItems.ToList();
        float totalWeight = items.Sum(x => x.weight);
        float randomValue = (float)random.NextDouble() * totalWeight;

        float cumulative = 0;
        foreach (var (item, weight) in items)
        {
            cumulative += weight;
            if (randomValue <= cumulative)
                return item;
        }

        return items.Last().item;
    }
}

// Usage in WFC
Tile SelectTileForCell(Cell cell)
{
    var possibleTiles = cell.PossibleTiles
        .Select(t => (tile: t, weight: t.Weight));

    return weightedSelector.Select(possibleTiles);
}
```

## Code Examples

### Complete Simple Tiled WFC Implementation

```csharp
using System;
using System.Collections.Generic;
using System.Linq;

public class WaveFunctionCollapse
{
    private int width, height;
    private Cell[,] grid;
    private List<Tile> allTiles;
    private Random random;
    private Stack<(int x, int y, HashSet<Tile> removed)> history;

    public WaveFunctionCollapse(int width, int height, List<Tile> tiles, int? seed = null)
    {
        this.width = width;
        this.height = height;
        this.allTiles = tiles;
        this.random = seed.HasValue ? new Random(seed.Value) : new Random();
        this.history = new Stack<(int, int, HashSet<Tile>)>();

        InitializeGrid();
    }

    private void InitializeGrid()
    {
        grid = new Cell[width, height];
        for (int x = 0; x < width; x++)
        {
            for (int y = 0; y < height; y++)
            {
                grid[x, y] = new Cell(new HashSet<Tile>(allTiles));
            }
        }
    }

    public bool Generate()
    {
        int iterations = 0;
        int maxIterations = width * height * 10;

        while (!IsFullyCollapsed() && iterations < maxIterations)
        {
            iterations++;

            // Find cell with minimum entropy
            var (x, y) = FindMinEntropyCell();
            if (x == -1) break;

            // Observe (collapse) the cell
            if (!Observe(x, y))
            {
                // Contradiction - try backtracking
                if (!Backtrack())
                {
                    Console.WriteLine("Generation failed - no valid solution found");
                    return false;
                }
                continue;
            }

            // Propagate constraints
            if (!Propagate(x, y))
            {
                if (!Backtrack())
                {
                    Console.WriteLine("Generation failed during propagation");
                    return false;
                }
            }
        }

        return IsFullyCollapsed();
    }

    private (int x, int y) FindMinEntropyCell()
    {
        int minEntropy = int.MaxValue;
        var candidates = new List<(int x, int y)>();

        for (int x = 0; x < width; x++)
        {
            for (int y = 0; y < height; y++)
            {
                if (grid[x, y].IsCollapsed) continue;

                int entropy = grid[x, y].Entropy;
                if (entropy < minEntropy)
                {
                    minEntropy = entropy;
                    candidates.Clear();
                    candidates.Add((x, y));
                }
                else if (entropy == minEntropy)
                {
                    candidates.Add((x, y));
                }
            }
        }

        if (candidates.Count == 0) return (-1, -1);

        // Random selection among equal entropy cells
        return candidates[random.Next(candidates.Count)];
    }

    private bool Observe(int x, int y)
    {
        var cell = grid[x, y];
        if (cell.PossibleTiles.Count == 0) return false;

        // Weighted random selection
        float totalWeight = cell.PossibleTiles.Sum(t => t.Weight);
        float randomValue = (float)random.NextDouble() * totalWeight;

        float cumulative = 0;
        Tile selected = null;
        foreach (var tile in cell.PossibleTiles)
        {
            cumulative += tile.Weight;
            if (randomValue <= cumulative)
            {
                selected = tile;
                break;
            }
        }

        selected ??= cell.PossibleTiles.First();

        // Save state for backtracking
        var removed = new HashSet<Tile>(cell.PossibleTiles);
        removed.Remove(selected);
        history.Push((x, y, removed));

        // Collapse to selected tile
        cell.CollapseTo(selected);
        return true;
    }

    private bool Propagate(int startX, int startY)
    {
        var propagationQueue = new Queue<(int x, int y)>();
        propagationQueue.Enqueue((startX, startY));

        while (propagationQueue.Count > 0)
        {
            var (x, y) = propagationQueue.Dequeue();
            var currentCell = grid[x, y];

            // Check all four neighbors
            foreach (var (dx, dy, dir) in GetDirections())
            {
                int nx = x + dx;
                int ny = y + dy;

                if (!IsInBounds(nx, ny)) continue;

                var neighbor = grid[nx, ny];
                if (neighbor.IsCollapsed) continue;

                // Calculate valid tiles for neighbor based on current cell
                var validTiles = new HashSet<Tile>();
                foreach (var currentTile in currentCell.PossibleTiles)
                {
                    foreach (var neighborTile in neighbor.PossibleTiles)
                    {
                        if (currentTile.CanConnectTo(neighborTile, dir))
                        {
                            validTiles.Add(neighborTile);
                        }
                    }
                }

                // Check for contradiction
                if (validTiles.Count == 0 && neighbor.PossibleTiles.Count > 0)
                {
                    return false;
                }

                // Reduce neighbor's domain
                int previousCount = neighbor.PossibleTiles.Count;
                neighbor.PossibleTiles.IntersectWith(validTiles);

                // If domain changed, add to propagation queue
                if (neighbor.PossibleTiles.Count < previousCount)
                {
                    propagationQueue.Enqueue((nx, ny));
                }
            }
        }

        return true;
    }

    private bool Backtrack()
    {
        if (history.Count == 0) return false;

        // Pop the last decision
        var (x, y, removed) = history.Pop();

        // Restore the cell's possibilities (excluding the failed choice)
        grid[x, y].PossibleTiles = removed;

        // Re-propagate from affected area
        return grid[x, y].PossibleTiles.Count > 0;
    }

    private IEnumerable<(int dx, int dy, Direction dir)> GetDirections()
    {
        yield return (0, -1, Direction.Up);
        yield return (1, 0, Direction.Right);
        yield return (0, 1, Direction.Down);
        yield return (-1, 0, Direction.Left);
    }

    private bool IsInBounds(int x, int y)
    {
        return x >= 0 && x < width && y >= 0 && y < height;
    }

    private bool IsFullyCollapsed()
    {
        for (int x = 0; x < width; x++)
        {
            for (int y = 0; y < height; y++)
            {
                if (!grid[x, y].IsCollapsed) return false;
            }
        }
        return true;
    }

    public Tile GetTileAt(int x, int y)
    {
        return grid[x, y].IsCollapsed ? grid[x, y].PossibleTiles.First() : null;
    }
}

public class Cell
{
    public HashSet<Tile> PossibleTiles { get; set; }

    public int Entropy => PossibleTiles.Count;
    public bool IsCollapsed => PossibleTiles.Count == 1;

    public Cell(HashSet<Tile> initialTiles)
    {
        PossibleTiles = initialTiles;
    }

    public void CollapseTo(Tile tile)
    {
        PossibleTiles = new HashSet<Tile> { tile };
    }
}
```

### Unity Integration

```csharp
using UnityEngine;
using UnityEngine.Tilemaps;
using System.Collections;

public class WFCTilemapGenerator : MonoBehaviour
{
    [Header("Grid Settings")]
    [SerializeField] private int gridWidth = 20;
    [SerializeField] private int gridHeight = 20;
    [SerializeField] private int seed = -1; // -1 for random

    [Header("References")]
    [SerializeField] private Tilemap tilemap;
    [SerializeField] private WFCTileSet tileSet;

    [Header("Generation Settings")]
    [SerializeField] private bool animateGeneration = true;
    [SerializeField] private float stepDelay = 0.05f;

    private WaveFunctionCollapse wfc;

    public void Generate()
    {
        tilemap.ClearAllTiles();

        int actualSeed = seed == -1 ? System.Environment.TickCount : seed;
        wfc = new WaveFunctionCollapse(
            gridWidth,
            gridHeight,
            tileSet.GetTiles(),
            actualSeed
        );

        if (animateGeneration)
        {
            StartCoroutine(AnimatedGenerate());
        }
        else
        {
            InstantGenerate();
        }
    }

    private void InstantGenerate()
    {
        if (wfc.Generate())
        {
            RenderGrid();
            Debug.Log("Generation successful!");
        }
        else
        {
            Debug.LogError("Generation failed!");
        }
    }

    private IEnumerator AnimatedGenerate()
    {
        while (!wfc.IsFullyCollapsed())
        {
            wfc.Step(); // Single step version of Generate()
            RenderGrid();
            yield return new WaitForSeconds(stepDelay);
        }
    }

    private void RenderGrid()
    {
        for (int x = 0; x < gridWidth; x++)
        {
            for (int y = 0; y < gridHeight; y++)
            {
                var tile = wfc.GetTileAt(x, y);
                if (tile != null)
                {
                    var tileBase = tileSet.GetUnityTile(tile.Id);
                    tilemap.SetTile(new Vector3Int(x, y, 0), tileBase);
                }
            }
        }
    }
}

// ScriptableObject for defining tile sets
[CreateAssetMenu(fileName = "WFCTileSet", menuName = "WFC/Tile Set")]
public class WFCTileSet : ScriptableObject
{
    [System.Serializable]
    public class TileDefinition
    {
        public string id;
        public TileBase unityTile;
        public int topSocket;
        public int rightSocket;
        public int bottomSocket;
        public int leftSocket;
        public float weight = 1f;
        public bool generateRotations;
    }

    public List<TileDefinition> tileDefinitions;

    public List<Tile> GetTiles()
    {
        var tiles = new List<Tile>();
        foreach (var def in tileDefinitions)
        {
            var baseTile = new Tile(
                def.id,
                def.topSocket,
                def.rightSocket,
                def.bottomSocket,
                def.leftSocket,
                def.weight
            );

            if (def.generateRotations)
            {
                tiles.AddRange(TileVariantGenerator.GenerateRotations(baseTile));
            }
            else
            {
                tiles.Add(baseTile);
            }
        }
        return tiles;
    }

    public TileBase GetUnityTile(string id)
    {
        // Handle rotated variants by stripping rotation suffix
        string baseId = id.Split('_')[0];
        return tileDefinitions.Find(t => t.id == baseId)?.unityTile;
    }
}
```

### 3D Voxel WFC

```csharp
public class WFC3D
{
    private int width, height, depth;
    private Cell3D[,,] grid;
    private List<Module3D> modules;

    // 3D uses 6 directions
    private static readonly (int dx, int dy, int dz, int face)[] Directions =
    {
        (1, 0, 0, 0),   // +X
        (-1, 0, 0, 1),  // -X
        (0, 1, 0, 2),   // +Y
        (0, -1, 0, 3),  // -Y
        (0, 0, 1, 4),   // +Z
        (0, 0, -1, 5)   // -Z
    };

    public class Module3D
    {
        public string Id;
        public GameObject Prefab;
        public int[] Faces; // [+X, -X, +Y, -Y, +Z, -Z]
        public float Weight;
        public Vector3 Rotation;

        public int GetFace(int direction) => Faces[direction];
        public int GetOppositeFace(int direction) => Faces[direction ^ 1];
    }

    public void Generate()
    {
        // Same algorithm, but with 6 directions instead of 4
        while (!IsComplete())
        {
            var cell = FindMinEntropyCell3D();
            Collapse3D(cell);
            Propagate3D(cell);
        }
    }

    public void InstantiateResult(Transform parent)
    {
        for (int x = 0; x < width; x++)
        {
            for (int y = 0; y < height; y++)
            {
                for (int z = 0; z < depth; z++)
                {
                    var module = grid[x, y, z].CollapsedModule;
                    if (module?.Prefab != null)
                    {
                        var obj = Object.Instantiate(
                            module.Prefab,
                            new Vector3(x, y, z),
                            Quaternion.Euler(module.Rotation),
                            parent
                        );
                    }
                }
            }
        }
    }
}
```

## Best Practices

### 1. Tile Set Design

```csharp
// Good: Systematic socket assignment
public enum SocketType
{
    Empty = 0,
    GroundLevel = 1,
    WallBase = 2,
    WallTop = 3,
    DoorBottom = 4,
    DoorTop = 5,
    WindowLeft = 6,
    WindowRight = 7
}

// Create tiles with clear socket semantics
var tiles = new List<Tile>
{
    // Floor tiles
    new Tile("floor",
        (int)SocketType.Empty,      // top - nothing above floor
        (int)SocketType.GroundLevel,  // right - connects to other ground-level
        (int)SocketType.Empty,      // bottom
        (int)SocketType.GroundLevel,  // left
        weight: 10f),  // Common tile gets higher weight

    // Wall tiles
    new Tile("wall",
        (int)SocketType.WallTop,
        (int)SocketType.WallBase,
        (int)SocketType.WallBase,
        (int)SocketType.WallBase,
        weight: 3f),
};
```

### 2. Boundary Constraints

```csharp
public void ApplyBoundaryConstraints()
{
    // Force edges to have specific tiles (e.g., walls on border)
    for (int x = 0; x < width; x++)
    {
        ConstrainCell(x, 0, "wall");           // Bottom edge
        ConstrainCell(x, height - 1, "wall");  // Top edge
    }

    for (int y = 0; y < height; y++)
    {
        ConstrainCell(0, y, "wall");           // Left edge
        ConstrainCell(width - 1, y, "wall");   // Right edge
    }

    // Force specific tiles at specific locations
    ConstrainCell(width / 2, 0, "door");       // Entrance
}

private void ConstrainCell(int x, int y, string tileId)
{
    var cell = grid[x, y];
    var tile = allTiles.FirstOrDefault(t => t.Id == tileId);
    if (tile != null)
    {
        cell.CollapseTo(tile);
        Propagate(x, y);
    }
}
```

### 3. Chunked Generation

```csharp
public class ChunkedWFC
{
    private Dictionary<Vector2Int, Tile[,]> chunks;
    private int chunkSize = 16;

    public void GenerateChunk(Vector2Int chunkCoord)
    {
        var wfc = new WaveFunctionCollapse(chunkSize, chunkSize, tiles);

        // Apply constraints from neighboring chunks
        ApplyNeighborConstraints(wfc, chunkCoord);

        wfc.Generate();
        chunks[chunkCoord] = ExtractResult(wfc);
    }

    private void ApplyNeighborConstraints(WaveFunctionCollapse wfc, Vector2Int coord)
    {
        // Left neighbor
        if (chunks.TryGetValue(coord + Vector2Int.left, out var leftChunk))
        {
            for (int y = 0; y < chunkSize; y++)
            {
                var edgeTile = leftChunk[chunkSize - 1, y];
                wfc.ConstrainEdge(0, y, edgeTile, Direction.Left);
            }
        }

        // Similar for other directions...
    }
}
```

### 4. Performance Optimization with Priority Queue

```csharp
public class OptimizedWFC
{
    private PriorityQueue<(int x, int y), float> entropyQueue;

    private void UpdateEntropyQueue(int x, int y)
    {
        var cell = grid[x, y];
        if (!cell.IsCollapsed)
        {
            // Add small random factor to break ties
            float entropy = CalculateEntropy(cell) + random.NextDouble() * 0.001f;
            entropyQueue.Enqueue((x, y), entropy);
        }
    }

    private float CalculateEntropy(Cell cell)
    {
        if (cell.PossibleTiles.Count <= 1) return 0;

        float sumWeights = 0;
        float sumWeightLogWeight = 0;

        foreach (var tile in cell.PossibleTiles)
        {
            sumWeights += tile.Weight;
            sumWeightLogWeight += tile.Weight * Mathf.Log(tile.Weight);
        }

        return Mathf.Log(sumWeights) - sumWeightLogWeight / sumWeights;
    }
}
```

## Common Pitfalls

### 1. Contradictions from Poor Tile Design

```csharp
// BAD: Tiles that can't form valid configurations
var badTiles = new List<Tile>
{
    new Tile("A", 1, 2, 3, 4), // All different sockets
    new Tile("B", 5, 6, 7, 8), // No matching sockets with A
};
// This will ALWAYS fail - no valid neighbors

// GOOD: Ensure every socket has at least one match
var goodTiles = new List<Tile>
{
    new Tile("floor", 0, 1, 0, 1),     // Socket 1 horizontal, 0 vertical
    new Tile("wall_h", 2, 1, 2, 1),    // Socket 1 matches floor horizontally
    new Tile("wall_v", 0, 2, 0, 2),    // Socket 2 matches wall_h vertically
};
```

### 2. Infinite Loops Without Backtracking

```csharp
// BAD: No handling for contradictions
public void BadGenerate()
{
    while (!IsComplete())
    {
        var cell = FindMinEntropyCell();
        Collapse(cell); // What if this creates a contradiction?
        Propagate(cell); // Might leave cells with 0 possibilities
        // No backtracking = infinite loop or crash
    }
}

// GOOD: Handle contradictions properly
public bool GoodGenerate()
{
    int attempts = 0;
    while (!IsComplete() && attempts < maxAttempts)
    {
        attempts++;
        var cell = FindMinEntropyCell();

        if (!Collapse(cell) || !Propagate(cell))
        {
            if (!Backtrack())
            {
                // Full restart as last resort
                InitializeGrid();
                attempts = 0;
            }
        }
    }
    return IsComplete();
}
```

### 3. Weight Imbalance

```csharp
// BAD: Extreme weight differences
var tiles = new List<Tile>
{
    new Tile("rare_special", ..., weight: 0.001f),
    new Tile("common", ..., weight: 1000f),
};
// "rare_special" will almost never appear

// GOOD: Balanced weights with clear ratios
var tiles = new List<Tile>
{
    new Tile("rare_special", ..., weight: 1f),    // 1 in ~16 chance
    new Tile("uncommon", ..., weight: 3f),        // 3 in ~16 chance
    new Tile("common", ..., weight: 12f),         // 12 in ~16 chance
};
```

### 4. Not Handling Edge Cases

```csharp
// BAD: Assuming grid is always valid
var tile = grid[x - 1, y].GetTile(); // Crashes at x=0

// GOOD: Always check bounds
public Tile GetNeighborTile(int x, int y, Direction dir)
{
    var (nx, ny) = GetNeighborCoords(x, y, dir);

    if (nx < 0 || nx >= width || ny < 0 || ny >= height)
    {
        return boundaryTile; // Special tile for edges, or null
    }

    return grid[nx, ny].GetTile();
}
```

## Performance Considerations

### Complexity Analysis

| Operation | Time Complexity | Space Complexity |
|-----------|-----------------|------------------|
| Initialization | O(W * H * T) | O(W * H * T) |
| Find min entropy | O(W * H) | O(1) |
| Collapse | O(T) | O(1) |
| Propagation (worst) | O(W * H * T * D) | O(W * H) |
| Full generation | O(W * H * (W * H * T)) | O(W * H * T) |

W = width, H = height, T = number of tiles, D = directions (4 or 6)

### Optimization Techniques

```csharp
// 1. Use bit manipulation for tile sets
public class BitSetCell
{
    private ulong possibleTiles; // Support up to 64 tiles

    public bool HasTile(int tileIndex) => (possibleTiles & (1UL << tileIndex)) != 0;
    public void RemoveTile(int tileIndex) => possibleTiles &= ~(1UL << tileIndex);
    public int Count => BitOperations.PopCount(possibleTiles);
}

// 2. Precompute valid neighbors
public class PrecomputedAdjacency
{
    // adjacency[tileIndex][direction] = bitmask of valid neighbors
    private ulong[,] adjacency;

    public void Precompute(List<Tile> tiles)
    {
        adjacency = new ulong[tiles.Count, 4];

        for (int i = 0; i < tiles.Count; i++)
        {
            for (int dir = 0; dir < 4; dir++)
            {
                ulong validMask = 0;
                for (int j = 0; j < tiles.Count; j++)
                {
                    if (tiles[i].CanConnectTo(tiles[j], (Direction)dir))
                    {
                        validMask |= (1UL << j);
                    }
                }
                adjacency[i, dir] = validMask;
            }
        }
    }

    // O(1) lookup instead of O(T) iteration
    public ulong GetValidNeighbors(int tileIndex, Direction dir)
    {
        return adjacency[tileIndex, (int)dir];
    }
}

// 3. Parallel propagation (for large grids)
public void ParallelPropagate()
{
    var changed = new ConcurrentBag<(int x, int y)>();

    Parallel.For(0, width, x =>
    {
        for (int y = 0; y < height; y++)
        {
            if (UpdateCell(x, y))
            {
                changed.Add((x, y));
            }
        }
    });

    // Continue propagation for changed cells...
}
```

### Memory-Efficient Storage

```csharp
// For very large grids, use sparse storage
public class SparseWFC
{
    private Dictionary<(int x, int y), Cell> cells;
    private Cell defaultCell; // Fully unconstrained

    public Cell GetCell(int x, int y)
    {
        return cells.TryGetValue((x, y), out var cell) ? cell : defaultCell;
    }

    // Only store cells that have been modified
    public void SetCell(int x, int y, Cell cell)
    {
        if (cell.Entropy < defaultCell.Entropy)
        {
            cells[(x, y)] = cell;
        }
    }
}
```

## Real-World Scenarios

### Scenario 1: Dungeon Room Generation

```csharp
public class DungeonWFC : MonoBehaviour
{
    [SerializeField] private WFCTileSet dungeonTiles;

    public Room GenerateRoom(int width, int height, RoomType type)
    {
        var wfc = new WaveFunctionCollapse(width, height, dungeonTiles.GetTiles());

        // Apply room-type-specific constraints
        switch (type)
        {
            case RoomType.Treasure:
                // Force treasure chest location
                wfc.ConstrainCenter("treasure_floor");
                wfc.ForceWalls();
                break;

            case RoomType.Boss:
                // Large open area with pillars
                wfc.ConstrainCorners("pillar");
                wfc.ConstrainCenter("boss_arena");
                break;

            case RoomType.Corridor:
                // Narrow passage
                wfc.ForceSideWalls();
                break;
        }

        // Add door positions (pre-determined by level generator)
        foreach (var doorPos in room.DoorPositions)
        {
            wfc.ConstrainCell(doorPos.x, doorPos.y, "door");
        }

        if (!wfc.Generate())
        {
            // Fallback to simpler room
            return GenerateFallbackRoom(width, height);
        }

        return BuildRoom(wfc, width, height);
    }
}
```

### Scenario 2: City Block Generator

```csharp
public class CityBlockGenerator
{
    // Tile types: road, building, park, intersection, etc.

    public void GenerateCityBlock(int size)
    {
        var wfc = new WaveFunctionCollapse(size, size, cityTiles);

        // Roads on grid lines
        for (int i = 0; i < size; i += 4)
        {
            for (int j = 0; j < size; j++)
            {
                wfc.ConstrainCell(i, j, "road_horizontal");
                wfc.ConstrainCell(j, i, "road_vertical");
            }

            // Intersections
            for (int k = 0; k < size; k += 4)
            {
                wfc.ConstrainCell(i, k, "intersection");
            }
        }

        wfc.Generate();

        // Post-process: Add props, NPCs, etc.
        PopulateCityBlock(wfc);
    }
}
```

### Scenario 3: Seamless Infinite World

```csharp
public class InfiniteWFCWorld : MonoBehaviour
{
    private Dictionary<Vector2Int, Chunk> loadedChunks;
    private int chunkSize = 32;
    private int viewDistance = 2;

    void Update()
    {
        var playerChunk = WorldToChunkCoord(player.position);
        LoadChunksAround(playerChunk);
        UnloadDistantChunks(playerChunk);
    }

    void LoadChunksAround(Vector2Int center)
    {
        for (int dx = -viewDistance; dx <= viewDistance; dx++)
        {
            for (int dy = -viewDistance; dy <= viewDistance; dy++)
            {
                var coord = center + new Vector2Int(dx, dy);
                if (!loadedChunks.ContainsKey(coord))
                {
                    StartCoroutine(GenerateChunkAsync(coord));
                }
            }
        }
    }

    IEnumerator GenerateChunkAsync(Vector2Int coord)
    {
        // Deterministic seed based on chunk position
        int seed = HashChunkCoord(coord);
        var wfc = new WaveFunctionCollapse(chunkSize, chunkSize, tiles, seed);

        // Get edge constraints from existing neighbors
        ApplyNeighborConstraints(wfc, coord);

        // Generate in batches to avoid frame drops
        int stepsPerFrame = 100;
        int steps = 0;

        while (!wfc.IsComplete())
        {
            wfc.Step();
            steps++;

            if (steps >= stepsPerFrame)
            {
                steps = 0;
                yield return null;
            }
        }

        loadedChunks[coord] = CreateChunk(wfc, coord);
    }

    int HashChunkCoord(Vector2Int coord)
    {
        // Consistent hash for reproducible generation
        return coord.x * 73856093 ^ coord.y * 19349663;
    }
}
```

## Interview Key Points

### Conceptual Questions

**Q: Explain the Wave Function Collapse algorithm in simple terms.**
> WFC generates patterns by starting with all possibilities at each position, then iteratively selecting the most constrained position, assigning it a value, and propagating the constraints to neighbors. It's like solving a puzzle where each piece placement eliminates invalid options for adjacent pieces.

**Q: How does WFC differ from other procedural generation techniques?**
> Unlike random placement or noise-based generation, WFC guarantees local coherence through constraint satisfaction. Unlike template-based generation, it can produce infinite variations while maintaining pattern consistency. It sits between fully random and fully authored content.

**Q: What are the two main variants of WFC and when would you use each?**
> Simple Tiled Model uses predefined tiles with explicit adjacency rules - best for game levels with known components. Overlapping Model learns patterns from sample images - best for texture synthesis or when you want to replicate an artist's style.

### Implementation Questions

**Q: How do you handle contradictions in WFC?**
```csharp
// Three strategies:
// 1. Restart - simple but wasteful
// 2. Backtracking - track history, undo decisions
// 3. Partial reset - clear region around contradiction

public bool HandleContradiction(int x, int y)
{
    // Strategy 1: Full restart
    if (strategyType == Strategy.Restart)
    {
        InitializeGrid();
        return true;
    }

    // Strategy 2: Backtracking
    if (strategyType == Strategy.Backtrack)
    {
        return Backtrack();
    }

    // Strategy 3: Local reset
    ResetRegion(x, y, radius: 3);
    return true;
}
```

**Q: How would you ensure certain features always appear in the output?**
> Pre-constrain specific cells before running WFC. For example, force door tiles at entry points, boss arena tiles at center, or treasure at specific locations. This is called "seeding" or "pinning" and WFC will work around these fixed points.

**Q: How do you optimize WFC for real-time generation?**
> Key optimizations: use bit manipulation for tile sets, precompute adjacency tables, use a priority queue for cell selection, generate in chunks, run propagation in parallel for large grids, and consider caching common patterns.

### Design Questions

**Q: How would you design a WFC tile set for a Metroidvania-style game?**
> Design tiles considering: platform connectivity (solid, semi-solid, ladder), wall types (climbable, breakable), transition pieces (slopes, corners), special features (doors, save points). Use socket types that encode these properties. Weight common platforms heavily, special features lightly.

**Q: How would you combine WFC with hand-authored content?**
> Use WFC to fill spaces between authored key rooms. Pre-constrain tiles at connection points. Run WFC per-region with different tile sets for themed areas. Allow designers to "paint" constraints that WFC must respect.

### Quick Reference Card

```
WFC Core Concepts:
├── Superposition: Cell with multiple possibilities
├── Entropy: Measure of uncertainty (fewer options = lower entropy)
├── Observation: Collapse cell to single tile
├── Propagation: Update neighbors based on constraints
└── Contradiction: Cell with zero valid options

Algorithm Steps:
1. Initialize all cells with all possible tiles
2. Find cell with lowest entropy
3. Collapse to random valid tile (weighted)
4. Propagate constraints to neighbors
5. Repeat until complete or contradiction
6. Handle contradiction (backtrack/restart)

Socket System:
- Each tile has 4 (2D) or 6 (3D) sockets
- Matching sockets can connect
- Rotations generate new socket configurations

Performance Tips:
- Precompute adjacency tables
- Use bitmasks for tile sets
- Priority queue for cell selection
- Chunk large maps
- Seed for reproducibility
```

## Further Reading

### Academic Papers

1. **Gumin, Maxim** - "Wave Function Collapse Algorithm" (2016) - Original implementation and documentation
2. **Karth & Smith** - "WaveFunctionCollapse is Constraint Solving in the Wild" (2017) - Formal analysis
3. **Merrell, Paul** - "Model Synthesis" (2007) - Similar approach for 3D generation

### Implementation Resources

- [Original WFC Repository](https://github.com/mxgmn/WaveFunctionCollapse) - Reference implementation
- [Unity WFC Implementation](https://github.com/selfsame/unity-wave-collapse) - Unity-specific adaptation
- [Oskar Stalberg's Work](https://twitter.com/OskSta) - Townscaper creator's insights

### Related Topics

- **Constraint Satisfaction Problems (CSP)** - Theoretical foundation
- **Arc Consistency** - Related propagation technique
- **Model Synthesis** - 3D extension of similar concepts
- **Markov Chain Texture Synthesis** - Alternative pattern-based generation
- **Answer Set Programming** - Declarative alternative

### Recommended Tutorials

1. "Wave Function Collapse Explained" - Boris the Brave's blog series
2. "Implementing WFC in Unity" - Game Developer Magazine
3. "Procedural Generation with WFC" - GDC Talk by Oskar Stalberg

### Tools and Libraries

| Tool | Language | Features |
|------|----------|----------|
| mxgmn/WaveFunctionCollapse | C# | Reference implementation |
| kchapelier/wavefunctioncollapse | JavaScript | Web-based |
| isaac-udy/WFC | Kotlin | Android/JVM |
| math-fehr/fast-wfc | C++ | Optimized performance |
