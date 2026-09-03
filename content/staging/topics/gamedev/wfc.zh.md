---
title: 波函数坍缩（WFC）生成算法
description: 掌握用于程序化内容生成的波函数坍缩算法 - 从基本的瓦片匹配到复杂的 3D 世界生成
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
origin: old/src/content/docs/gamedev/wfc.zh.md
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

波函数坍缩（Wave Function Collapse，WFC）是一种受量子力学概念启发的革命性程序化生成算法。它可以从一小组输入样本生成复杂、连贯的模式，同时遵守局部约束。WFC 最初由 Maxim Gumin 于 2016 年开发，已成为现代游戏开发中从 2D 瓦片地图到完整 3D 世界生成的核心技术。

## 概念解释

### 什么是波函数坍缩？

**波函数坍缩**是一种基于约束的程序化生成算法，可以从输入样本产生局部相似的输出。这个名称来源于量子力学 - 每个单元格开始时处于所有可能状态的"叠加态"，然后通过观测和约束传播"坍缩"到单一确定状态。

```
初始状态（叠加态）：
┌─────────────────────────────────────────────────────────┐
│ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │         │
│ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │         │
│ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │         │
│ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │ [A,B,C,D] │         │
└─────────────────────────────────────────────────────────┘
每个单元格可以是任意瓦片（A、B、C 或 D）

坍缩后：
┌─────────────────────────────────────────────────────────┐
│     A     │     B     │     B     │     C     │         │
│     A     │     D     │     B     │     C     │         │
│     D     │     D     │     A     │     A     │         │
│     C     │     A     │     A     │     B     │         │
└─────────────────────────────────────────────────────────┘
每个单元格已坍缩到单个有效瓦片
```

### 量子类比

该算法借用了量子力学术语：

| 量子概念 | WFC 等价物 |
|-----------------|----------------|
| 叠加态 | 具有多个可能瓦片的单元格 |
| 观测 | 为单元格选择特定瓦片 |
| 波函数坍缩 | 将可能性减少到一个状态 |
| 纠缠 | 相邻单元格之间的约束 |
| 熵 | 不确定性（可能性数量） |

### 两种主要变体

**1. 简单瓦片模型**
- 使用预定义的瓦片和显式邻接规则
- 每个瓦片指定哪些瓦片可以是邻居
- 更快且更可预测
- 更适合游戏开发

**2. 重叠模型**
- 从输入样本图像学习模式
- 提取 NxN 模式及其关系
- 更灵活但计算成本更高
- 更适合纹理合成

```
简单瓦片模型：
┌────────────────────────────────────────────────┐
│ 输入：瓦片 + 邻接规则                           │
│                                                │
│ [草地]──可连接──[道路]──可连接──[水]            │
│                                                │
│ 输出：有效的瓦片排列                           │
└────────────────────────────────────────────────┘

重叠模型：
┌────────────────────────────────────────────────┐
│ 输入：样本图像                                  │
│ ████░░░░░░                                     │
│ ████░░░░░░  →  提取 3x3 模式                   │
│ ░░░░████░░  →  学习邻接关系                    │
│ ░░░░████░░  →  生成新图像                      │
│                                                │
│ 输出：局部相似的图像                           │
└────────────────────────────────────────────────┘
```

## 核心原理

### WFC 算法

```
┌─────────────────────────────────────────────────────────────────┐
│                    WFC 算法流程                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 初始化                                                      │
│     ┌─────────────────────────────────────────┐                │
│     │ 每个单元格开始时在其域中包含所有          │                │
│     │ 可能的瓦片                               │                │
│     └─────────────────────────────────────────┘                │
│                         ↓                                       │
│  2. 观测（选择熵最低的单元格）                                  │
│     ┌─────────────────────────────────────────┐                │
│     │ 找到剩余可能性最少的未解决单元格          │                │
│     │ 将其坍缩到一个瓦片（加权随机）           │                │
│     └─────────────────────────────────────────┘                │
│                         ↓                                       │
│  3. 传播（强制约束）                                            │
│     ┌─────────────────────────────────────────┐                │
│     │ 对于每个受影响的邻居：                    │                │
│     │ - 移除无效的瓦片选项                     │                │
│     │ - 如果域改变，进一步传播                 │                │
│     │ - 如果域为空 → 矛盾                      │                │
│     └─────────────────────────────────────────┘                │
│                         ↓                                       │
│  4. 检查完成                                                    │
│     ┌─────────────────────────────────────────┐                │
│     │ 所有单元格都坍缩了？→ 成功               │                │
│     │ 矛盾？→ 回溯或重启                       │                │
│     │ 否则？→ 转到步骤 2                       │                │
│     └─────────────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 熵和单元格选择

熵衡量单元格的不确定性。WFC 使用**最小剩余值（MRV）**启发式：

```
熵计算：
entropy = log(权重和) - (权重乘对数权重和 / 权重和)

简单版本（基于计数）：
entropy = 剩余可能性数量

加权版本考虑瓦片频率：
┌──────────────────────────────────────────────────┐
│ 单元格可能性：[草地(70%), 道路(20%), 水(10%)]
│ 香农熵 = -Σ(p * log(p))
│        = -(0.7*log(0.7) + 0.2*log(0.2) + 0.1*log(0.1))
│        ≈ 0.80
└──────────────────────────────────────────────────┘
```

### 约束传播

当一个单元格坍缩时，约束向外扩散：

```
坍缩前：                     在 (1,1) 坍缩后：
┌───────┬───────┬───────┐  ┌───────┬───────┬───────┐
│ ABCD  │ ABCD  │ ABCD  │  │  AC   │  BD   │ ABCD  │
├───────┼───────┼───────┤  ├───────┼───────┼───────┤
│ ABCD  │ ABCD  │ ABCD  │  │  BD   │  [A]  │  AC   │
├───────┼───────┼───────┤  ├───────┼───────┼───────┤
│ ABCD  │ ABCD  │ ABCD  │  │ ABCD  │  BD   │ ABCD  │
└───────┴───────┴───────┘  └───────┴───────┴───────┘

如果 A 只能与以下相邻：B, D（水平），A, C（垂直）
邻居必须相应地更新其域
```

## 关键概念

### 1. 邻接规则

定义哪些瓦片可以放在彼此旁边：

```csharp
// 方向枚举以提高清晰度
public enum Direction { Up, Down, Left, Right }

// 邻接规则结构
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

// 示例：道路瓦片邻接
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

### 2. 插槽系统

使用连接类型的更可扩展方法：

```csharp
// 基于插槽的连接（用于许多 WFC 实现）
public class Tile
{
    public string Id;
    public int[] Sockets; // [上, 右, 下, 左]
    public float Weight;

    public Tile(string id, int top, int right, int bottom, int left, float weight = 1f)
    {
        Id = id;
        Sockets = new int[] { top, right, bottom, left };
        Weight = weight;
    }

    // 如果插槽匹配（或互补），瓦片可以连接
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
            Direction.Up => other.Sockets[2],    // 他们的底部
            Direction.Right => other.Sockets[3], // 他们的左边
            Direction.Down => other.Sockets[0],  // 他们的顶部
            Direction.Left => other.Sockets[1],  // 他们的右边
            _ => -1
        };

        return mySocket == theirSocket;
    }
}

// 插槽含义示例：
// 0 = 空/空气
// 1 = 地面级别
// 2 = 墙壁垂直
// 3 = 墙壁水平

var floorTile = new Tile("floor", 0, 1, 0, 1, weight: 5f);
var wallTile = new Tile("wall", 2, 0, 2, 0, weight: 1f);
var cornerTile = new Tile("corner", 2, 1, 1, 0, weight: 0.5f);
```

### 3. 瓦片变换

自动生成旋转/镜像变体：

```csharp
public class TileVariantGenerator
{
    public static List<Tile> GenerateRotations(Tile baseTile, bool allowMirror = false)
    {
        var variants = new List<Tile>();
        var sockets = baseTile.Sockets;

        // 原始
        variants.Add(baseTile);

        // 90 度旋转：[上, 右, 下, 左] -> [左, 上, 右, 下]
        variants.Add(new Tile(
            baseTile.Id + "_90",
            sockets[3], sockets[0], sockets[1], sockets[2],
            baseTile.Weight
        ));

        // 180 度旋转
        variants.Add(new Tile(
            baseTile.Id + "_180",
            sockets[2], sockets[3], sockets[0], sockets[1],
            baseTile.Weight
        ));

        // 270 度旋转
        variants.Add(new Tile(
            baseTile.Id + "_270",
            sockets[1], sockets[2], sockets[3], sockets[0],
            baseTile.Weight
        ));

        if (allowMirror)
        {
            // 水平镜像：交换左右
            variants.Add(new Tile(
                baseTile.Id + "_mirrorH",
                sockets[0], sockets[3], sockets[2], sockets[1],
                baseTile.Weight
            ));
        }

        // 移除重复（对称的瓦片）
        return variants.Distinct(new TileSocketComparer()).ToList();
    }
}
```

### 4. 加权随机选择

控制输出中的瓦片频率：

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

// 在 WFC 中的使用
Tile SelectTileForCell(Cell cell)
{
    var possibleTiles = cell.PossibleTiles
        .Select(t => (tile: t, weight: t.Weight));

    return weightedSelector.Select(possibleTiles);
}
```

## 代码示例

### 完整的简单瓦片 WFC 实现

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

            // 找到熵最小的单元格
            var (x, y) = FindMinEntropyCell();
            if (x == -1) break;

            // 观测（坍缩）单元格
            if (!Observe(x, y))
            {
                // 矛盾 - 尝试回溯
                if (!Backtrack())
                {
                    Console.WriteLine("生成失败 - 未找到有效解决方案");
                    return false;
                }
                continue;
            }

            // 传播约束
            if (!Propagate(x, y))
            {
                if (!Backtrack())
                {
                    Console.WriteLine("传播期间生成失败");
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

        // 在相等熵的单元格中随机选择
        return candidates[random.Next(candidates.Count)];
    }

    private bool Observe(int x, int y)
    {
        var cell = grid[x, y];
        if (cell.PossibleTiles.Count == 0) return false;

        // 加权随机选择
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

        // 保存状态以便回溯
        var removed = new HashSet<Tile>(cell.PossibleTiles);
        removed.Remove(selected);
        history.Push((x, y, removed));

        // 坍缩到选定的瓦片
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

            // 检查所有四个邻居
            foreach (var (dx, dy, dir) in GetDirections())
            {
                int nx = x + dx;
                int ny = y + dy;

                if (!IsInBounds(nx, ny)) continue;

                var neighbor = grid[nx, ny];
                if (neighbor.IsCollapsed) continue;

                // 根据当前单元格计算邻居的有效瓦片
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

                // 检查矛盾
                if (validTiles.Count == 0 && neighbor.PossibleTiles.Count > 0)
                {
                    return false;
                }

                // 减少邻居的域
                int previousCount = neighbor.PossibleTiles.Count;
                neighbor.PossibleTiles.IntersectWith(validTiles);

                // 如果域改变，添加到传播队列
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

        // 弹出上一个决策
        var (x, y, removed) = history.Pop();

        // 恢复单元格的可能性（排除失败的选择）
        grid[x, y].PossibleTiles = removed;

        // 从受影响区域重新传播
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

### Unity 集成

```csharp
using UnityEngine;
using UnityEngine.Tilemaps;
using System.Collections;

public class WFCTilemapGenerator : MonoBehaviour
{
    [Header("网格设置")]
    [SerializeField] private int gridWidth = 20;
    [SerializeField] private int gridHeight = 20;
    [SerializeField] private int seed = -1; // -1 表示随机

    [Header("引用")]
    [SerializeField] private Tilemap tilemap;
    [SerializeField] private WFCTileSet tileSet;

    [Header("生成设置")]
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
            Debug.Log("生成成功！");
        }
        else
        {
            Debug.LogError("生成失败！");
        }
    }

    private IEnumerator AnimatedGenerate()
    {
        while (!wfc.IsFullyCollapsed())
        {
            wfc.Step(); // Generate() 的单步版本
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

// 用于定义瓦片集的 ScriptableObject
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
        // 通过剥离旋转后缀处理旋转变体
        string baseId = id.Split('_')[0];
        return tileDefinitions.Find(t => t.id == baseId)?.unityTile;
    }
}
```

### 3D 体素 WFC

```csharp
public class WFC3D
{
    private int width, height, depth;
    private Cell3D[,,] grid;
    private List<Module3D> modules;

    // 3D 使用 6 个方向
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
        // 相同的算法，但使用 6 个方向而不是 4 个
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

## 最佳实践

### 1. 瓦片集设计

```csharp
// 好：系统的插槽分配
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

// 使用清晰的插槽语义创建瓦片
var tiles = new List<Tile>
{
    // 地板瓦片
    new Tile("floor",
        (int)SocketType.Empty,      // 上 - 地板上方没有东西
        (int)SocketType.GroundLevel,  // 右 - 连接到其他地面级别
        (int)SocketType.Empty,      // 下
        (int)SocketType.GroundLevel,  // 左
        weight: 10f),  // 常见瓦片权重更高

    // 墙壁瓦片
    new Tile("wall",
        (int)SocketType.WallTop,
        (int)SocketType.WallBase,
        (int)SocketType.WallBase,
        (int)SocketType.WallBase,
        weight: 3f),
};
```

### 2. 边界约束

```csharp
public void ApplyBoundaryConstraints()
{
    // 强制边缘有特定瓦片（例如，边界上的墙壁）
    for (int x = 0; x < width; x++)
    {
        ConstrainCell(x, 0, "wall");           // 底边
        ConstrainCell(x, height - 1, "wall");  // 顶边
    }

    for (int y = 0; y < height; y++)
    {
        ConstrainCell(0, y, "wall");           // 左边
        ConstrainCell(width - 1, y, "wall");   // 右边
    }

    // 在特定位置强制特定瓦片
    ConstrainCell(width / 2, 0, "door");       // 入口
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

### 3. 分块生成

```csharp
public class ChunkedWFC
{
    private Dictionary<Vector2Int, Tile[,]> chunks;
    private int chunkSize = 16;

    public void GenerateChunk(Vector2Int chunkCoord)
    {
        var wfc = new WaveFunctionCollapse(chunkSize, chunkSize, tiles);

        // 应用来自相邻区块的约束
        ApplyNeighborConstraints(wfc, chunkCoord);

        wfc.Generate();
        chunks[chunkCoord] = ExtractResult(wfc);
    }

    private void ApplyNeighborConstraints(WaveFunctionCollapse wfc, Vector2Int coord)
    {
        // 左邻居
        if (chunks.TryGetValue(coord + Vector2Int.left, out var leftChunk))
        {
            for (int y = 0; y < chunkSize; y++)
            {
                var edgeTile = leftChunk[chunkSize - 1, y];
                wfc.ConstrainEdge(0, y, edgeTile, Direction.Left);
            }
        }

        // 其他方向类似...
    }
}
```

### 4. 使用优先队列的性能优化

```csharp
public class OptimizedWFC
{
    private PriorityQueue<(int x, int y), float> entropyQueue;

    private void UpdateEntropyQueue(int x, int y)
    {
        var cell = grid[x, y];
        if (!cell.IsCollapsed)
        {
            // 添加小的随机因子以打破平局
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

## 常见陷阱

### 1. 糟糕的瓦片设计导致的矛盾

```csharp
// 不好：无法形成有效配置的瓦片
var badTiles = new List<Tile>
{
    new Tile("A", 1, 2, 3, 4), // 所有不同的插槽
    new Tile("B", 5, 6, 7, 8), // 与 A 没有匹配的插槽
};
// 这将总是失败 - 没有有效的邻居

// 好：确保每个插槽至少有一个匹配
var goodTiles = new List<Tile>
{
    new Tile("floor", 0, 1, 0, 1),     // 水平插槽 1，垂直插槽 0
    new Tile("wall_h", 2, 1, 2, 1),    // 水平方向插槽 1 与 floor 匹配
    new Tile("wall_v", 0, 2, 0, 2),    // 垂直方向插槽 2 与 wall_h 匹配
};
```

### 2. 没有回溯的无限循环

```csharp
// 不好：没有处理矛盾
public void BadGenerate()
{
    while (!IsComplete())
    {
        var cell = FindMinEntropyCell();
        Collapse(cell); // 如果这产生矛盾怎么办？
        Propagate(cell); // 可能会留下可能性为 0 的单元格
        // 没有回溯 = 无限循环或崩溃
    }
}

// 好：正确处理矛盾
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
                // 完全重启作为最后手段
                InitializeGrid();
                attempts = 0;
            }
        }
    }
    return IsComplete();
}
```

### 3. 权重不平衡

```csharp
// 不好：极端的权重差异
var tiles = new List<Tile>
{
    new Tile("rare_special", ..., weight: 0.001f),
    new Tile("common", ..., weight: 1000f),
};
// "rare_special" 几乎永远不会出现

// 好：平衡的权重比例清晰
var tiles = new List<Tile>
{
    new Tile("rare_special", ..., weight: 1f),    // 大约 1/16 的概率
    new Tile("uncommon", ..., weight: 3f),        // 大约 3/16 的概率
    new Tile("common", ..., weight: 12f),         // 大约 12/16 的概率
};
```

### 4. 未处理边界情况

```csharp
// 不好：假设网格总是有效
var tile = grid[x - 1, y].GetTile(); // 在 x=0 时崩溃

// 好：始终检查边界
public Tile GetNeighborTile(int x, int y, Direction dir)
{
    var (nx, ny) = GetNeighborCoords(x, y, dir);

    if (nx < 0 || nx >= width || ny < 0 || ny >= height)
    {
        return boundaryTile; // 边缘的特殊瓦片，或 null
    }

    return grid[nx, ny].GetTile();
}
```

## 性能考虑

### 复杂度分析

| 操作 | 时间复杂度 | 空间复杂度 |
|-----------|-----------------|------------------|
| 初始化 | O(W * H * T) | O(W * H * T) |
| 找最小熵 | O(W * H) | O(1) |
| 坍缩 | O(T) | O(1) |
| 传播（最坏） | O(W * H * T * D) | O(W * H) |
| 完整生成 | O(W * H * (W * H * T)) | O(W * H * T) |

W = 宽度, H = 高度, T = 瓦片数量, D = 方向（4 或 6）

### 优化技术

```csharp
// 1. 使用位操作处理瓦片集
public class BitSetCell
{
    private ulong possibleTiles; // 支持最多 64 个瓦片

    public bool HasTile(int tileIndex) => (possibleTiles & (1UL << tileIndex)) != 0;
    public void RemoveTile(int tileIndex) => possibleTiles &= ~(1UL << tileIndex);
    public int Count => BitOperations.PopCount(possibleTiles);
}

// 2. 预计算有效邻居
public class PrecomputedAdjacency
{
    // adjacency[tileIndex][direction] = 有效邻居的位掩码
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

    // O(1) 查找而不是 O(T) 迭代
    public ulong GetValidNeighbors(int tileIndex, Direction dir)
    {
        return adjacency[tileIndex, (int)dir];
    }
}

// 3. 并行传播（用于大型网格）
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

    // 继续传播已更改的单元格...
}
```

### 内存高效存储

```csharp
// 对于非常大的网格，使用稀疏存储
public class SparseWFC
{
    private Dictionary<(int x, int y), Cell> cells;
    private Cell defaultCell; // 完全无约束

    public Cell GetCell(int x, int y)
    {
        return cells.TryGetValue((x, y), out var cell) ? cell : defaultCell;
    }

    // 只存储已被修改的单元格
    public void SetCell(int x, int y, Cell cell)
    {
        if (cell.Entropy < defaultCell.Entropy)
        {
            cells[(x, y)] = cell;
        }
    }
}
```

## 实际场景

### 场景 1：地牢房间生成

```csharp
public class DungeonWFC : MonoBehaviour
{
    [SerializeField] private WFCTileSet dungeonTiles;

    public Room GenerateRoom(int width, int height, RoomType type)
    {
        var wfc = new WaveFunctionCollapse(width, height, dungeonTiles.GetTiles());

        // 应用房间类型特定的约束
        switch (type)
        {
            case RoomType.Treasure:
                // 强制宝箱位置
                wfc.ConstrainCenter("treasure_floor");
                wfc.ForceWalls();
                break;

            case RoomType.Boss:
                // 带柱子的大型开放区域
                wfc.ConstrainCorners("pillar");
                wfc.ConstrainCenter("boss_arena");
                break;

            case RoomType.Corridor:
                // 狭窄通道
                wfc.ForceSideWalls();
                break;
        }

        // 添加门位置（由关卡生成器预先确定）
        foreach (var doorPos in room.DoorPositions)
        {
            wfc.ConstrainCell(doorPos.x, doorPos.y, "door");
        }

        if (!wfc.Generate())
        {
            // 回退到更简单的房间
            return GenerateFallbackRoom(width, height);
        }

        return BuildRoom(wfc, width, height);
    }
}
```

### 场景 2：城市街区生成器

```csharp
public class CityBlockGenerator
{
    // 瓦片类型：道路、建筑、公园、交叉口等

    public void GenerateCityBlock(int size)
    {
        var wfc = new WaveFunctionCollapse(size, size, cityTiles);

        // 网格线上的道路
        for (int i = 0; i < size; i += 4)
        {
            for (int j = 0; j < size; j++)
            {
                wfc.ConstrainCell(i, j, "road_horizontal");
                wfc.ConstrainCell(j, i, "road_vertical");
            }

            // 交叉口
            for (int k = 0; k < size; k += 4)
            {
                wfc.ConstrainCell(i, k, "intersection");
            }
        }

        wfc.Generate();

        // 后处理：添加道具、NPC 等
        PopulateCityBlock(wfc);
    }
}
```

### 场景 3：无缝无限世界

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
        // 基于区块位置的确定性种子
        int seed = HashChunkCoord(coord);
        var wfc = new WaveFunctionCollapse(chunkSize, chunkSize, tiles, seed);

        // 从现有邻居获取边缘约束
        ApplyNeighborConstraints(wfc, coord);

        // 分批生成以避免帧率下降
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
        // 一致的哈希用于可重现的生成
        return coord.x * 73856093 ^ coord.y * 19349663;
    }
}
```

## 面试要点

### 概念问题

**问：用简单的话解释波函数坍缩算法。**
> WFC 通过在每个位置从所有可能性开始生成模式，然后迭代地选择最受约束的位置，为其分配一个值，并将约束传播给邻居。这就像解决一个拼图，每放置一块都会消除相邻位置的无效选项。

**问：WFC 与其他程序化生成技术有何不同？**
> 与随机放置或基于噪声的生成不同，WFC 通过约束满足保证局部一致性。与基于模板的生成不同，它可以在保持模式一致性的同时产生无限变化。它介于完全随机和完全设计的内容之间。

**问：WFC 的两种主要变体是什么，什么时候使用每种？**
> 简单瓦片模型使用预定义的瓦片和显式邻接规则 - 最适合具有已知组件的游戏关卡。重叠模型从样本图像学习模式 - 最适合纹理合成或当你想复制艺术家的风格时。

### 实现问题

**问：如何处理 WFC 中的矛盾？**
```csharp
// 三种策略：
// 1. 重启 - 简单但浪费
// 2. 回溯 - 跟踪历史，撤销决策
// 3. 部分重置 - 清除矛盾周围的区域

public bool HandleContradiction(int x, int y)
{
    // 策略 1：完全重启
    if (strategyType == Strategy.Restart)
    {
        InitializeGrid();
        return true;
    }

    // 策略 2：回溯
    if (strategyType == Strategy.Backtrack)
    {
        return Backtrack();
    }

    // 策略 3：局部重置
    ResetRegion(x, y, radius: 3);
    return true;
}
```

**问：如何确保某些功能始终出现在输出中？**
> 在运行 WFC 之前预约束特定单元格。例如，在入口点强制门瓦片，在中心强制 Boss 竞技场瓦片，或在特定位置强制宝藏。这称为"种子"或"固定"，WFC 将围绕这些固定点工作。

**问：如何优化 WFC 以进行实时生成？**
> 关键优化：使用位操作处理瓦片集，预计算邻接表，使用优先队列进行单元格选择，分块生成，对大型网格并行运行传播，考虑缓存常见模式。

### 设计问题

**问：如何为类银河恶魔城风格的游戏设计 WFC 瓦片集？**
> 设计瓦片时考虑：平台连接性（实心、半实心、梯子）、墙壁类型（可攀爬、可破坏）、过渡件（斜坡、角落）、特殊功能（门、存档点）。使用编码这些属性的插槽类型。常见平台权重高，特殊功能权重低。

**问：如何将 WFC 与手工设计的内容结合？**
> 使用 WFC 填充设计的关键房间之间的空间。在连接点预约束瓦片。针对主题区域使用不同的瓦片集按区域运行 WFC。允许设计师"绘制"WFC 必须遵守的约束。

### 快速参考卡

```
WFC 核心概念：
├── 叠加态：具有多种可能性的单元格
├── 熵：不确定性的度量（选项越少 = 熵越低）
├── 观测：将单元格坍缩到单个瓦片
├── 传播：基于约束更新邻居
└── 矛盾：没有有效选项的单元格

算法步骤：
1. 用所有可能的瓦片初始化所有单元格
2. 找到熵最低的单元格
3. 坍缩到随机有效瓦片（加权）
4. 将约束传播给邻居
5. 重复直到完成或矛盾
6. 处理矛盾（回溯/重启）

插槽系统：
- 每个瓦片有 4（2D）或 6（3D）个插槽
- 匹配的插槽可以连接
- 旋转生成新的插槽配置

性能提示：
- 预计算邻接表
- 使用位掩码处理瓦片集
- 优先队列进行单元格选择
- 分块大地图
- 种子以保证可重现性
```

## 进一步阅读

### 学术论文

1. **Gumin, Maxim** - "Wave Function Collapse Algorithm" (2016) - 原始实现和文档
2. **Karth & Smith** - "WaveFunctionCollapse is Constraint Solving in the Wild" (2017) - 形式化分析
3. **Merrell, Paul** - "Model Synthesis" (2007) - 3D 生成的类似方法

### 实现资源

- [原始 WFC 仓库](https://github.com/mxgmn/WaveFunctionCollapse) - 参考实现
- [Unity WFC 实现](https://github.com/selfsame/unity-wave-collapse) - Unity 特定适配
- [Oskar Stalberg 的作品](https://twitter.com/OskSta) - Townscaper 创作者的见解

### 相关主题

- **约束满足问题（CSP）** - 理论基础
- **弧一致性** - 相关的传播技术
- **模型合成** - 类似概念的 3D 扩展
- **马尔可夫链纹理合成** - 替代的基于模式的生成
- **答案集编程** - 声明式替代方案

### 推荐教程

1. "Wave Function Collapse Explained" - Boris the Brave 的博客系列
2. "Implementing WFC in Unity" - Game Developer Magazine
3. "Procedural Generation with WFC" - Oskar Stalberg 的 GDC 演讲

### 工具和库

| 工具 | 语言 | 特点 |
|------|----------|----------|
| mxgmn/WaveFunctionCollapse | C# | 参考实现 |
| kchapelier/wavefunctioncollapse | JavaScript | 基于 Web |
| isaac-udy/WFC | Kotlin | Android/JVM |
| math-fehr/fast-wfc | C++ | 优化性能 |
