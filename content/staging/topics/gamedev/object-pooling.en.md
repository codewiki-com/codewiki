---
title: 对象池与游戏优化
description: 掌握游戏性能优化核心技术：对象池、空间分区和多线程
track: gamedev
section: performance
difficulty: intermediate
tags:
  - 对象池
  - 优化
  - 内存管理
  - 性能
status: imported
origin: old/src/content/docs/gamedev/object-pooling.en.md
divergence: 0.198
issues:
  - title-lang-en
  - title-language
legacy:
  category: GameDev
  subcategory: Optimization
  order: 35
  lastUpdated: 2026-01-07
---

In game development, performance optimization is a key factor that determines the gaming experience. Frequent object creation and destruction leads to memory allocation pressure and garbage collection (GC) stuttering, severely impacting game smoothness. Object Pool is the core technique for solving this problem. This article will delve into object pool principles, implementation methods, as well as advanced optimization techniques like spatial partitioning, frustum culling, and multithreading.

## Object Pool Principles

### Why Do We Need Object Pools

During game runtime, certain objects are frequently created and destroyed, such as:

- Bullets, particle effects
- Enemy units, NPCs
- UI elements, damage numbers
- Sound effect objects

Each time an object is created using `new`, the system needs to:

1. Allocate space in heap memory
2. Call the constructor for initialization
3. Return an object reference

When an object is no longer in use:

1. Mark it as reclaimable
2. Wait for GC to trigger
3. GC pauses program execution
4. Reclaim memory and reorganize heap space

```csharp
// Problem example: Creating lots of bullets every frame
public class BadBulletManager : MonoBehaviour
{
    public GameObject bulletPrefab;

    void Update()
    {
        if (Input.GetMouseButton(0))
        {
            // Creating new object every shot - causes frequent GC
            GameObject bullet = Instantiate(bulletPrefab);
            bullet.transform.position = transform.position;

            // Destroy after 3 seconds - triggers GC
            Destroy(bullet, 3f);
        }
    }
}
```

Problems with this approach:

- **Memory thrashing**: Frequent allocation and deallocation causes memory fragmentation
- **GC stuttering**: Garbage collection causes noticeable frame rate drops
- **CPU overhead**: Object creation and initialization consumes CPU time

### Core Concept of Object Pools

The core concept of object pools is **pre-create and reuse**:

1. Pre-create a certain number of objects when the game starts
2. Retrieve from the pool when needed (instead of creating new)
3. Return to the pool after use (instead of destroying)
4. Objects are reused throughout the game's lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                        Object Pool                          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │Obj 1│ │Obj 2│ │Obj 3│ │Obj 4│ │Obj 5│  ...              │
│  │ Idle│ │In Use│ │ Idle│ │ Idle│ │In Use│                  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                   │
└─────────────────────────────────────────────────────────────┘
         │                   ▲
         │ Get               │ Return
         ▼                   │
    ┌─────────┐         ┌─────────┐
    │Game Logic│ ──────▶ │Use Object│
    └─────────┘         └─────────┘
```

## Generic Object Pool Implementation

### Basic Poolable Object Interface

First, define an interface for poolable objects:

```csharp
/// <summary>
/// Poolable object interface
/// </summary>
public interface IPoolable
{
    /// <summary>
    /// Called when retrieved from pool, for initialization/resetting state
    /// </summary>
    void OnSpawn();

    /// <summary>
    /// Called when returned to pool, for cleaning up state
    /// </summary>
    void OnDespawn();

    /// <summary>
    /// Whether the object is currently in use
    /// </summary>
    bool IsActive { get; }
}
```

### Generic Object Pool Implementation

```csharp
using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Generic object pool
/// </summary>
/// <typeparam name="T">Pooled object type, must implement IPoolable interface</typeparam>
public class ObjectPool<T> where T : class, IPoolable
{
    // Queue of available objects
    private readonly Queue<T> _available;

    // List of all objects (for statistics and batch operations)
    private readonly List<T> _all;

    // Object creation factory method
    private readonly Func<T> _factory;

    // Pool configuration
    private readonly int _initialSize;
    private readonly int _maxSize;
    private readonly bool _autoExpand;

    // Statistics
    public int TotalCount => _all.Count;
    public int AvailableCount => _available.Count;
    public int ActiveCount => TotalCount - AvailableCount;

    /// <summary>
    /// Constructor
    /// </summary>
    /// <param name="factory">Object creation factory method</param>
    /// <param name="initialSize">Initial pool size</param>
    /// <param name="maxSize">Maximum pool size (0 means unlimited)</param>
    /// <param name="autoExpand">Whether to auto-expand</param>
    public ObjectPool(
        Func<T> factory,
        int initialSize = 10,
        int maxSize = 100,
        bool autoExpand = true)
    {
        _factory = factory ?? throw new ArgumentNullException(nameof(factory));
        _initialSize = initialSize;
        _maxSize = maxSize;
        _autoExpand = autoExpand;

        _available = new Queue<T>(initialSize);
        _all = new List<T>(initialSize);
    }

    /// <summary>
    /// Prewarm the object pool - pre-create objects
    /// </summary>
    public void Prewarm()
    {
        Prewarm(_initialSize);
    }

    /// <summary>
    /// Prewarm a specified number of objects
    /// </summary>
    public void Prewarm(int count)
    {
        for (int i = 0; i < count && CanCreateMore(); i++)
        {
            T obj = CreateNew();
            _available.Enqueue(obj);
        }
    }

    /// <summary>
    /// Get an object from the pool
    /// </summary>
    public T Get()
    {
        T obj;

        if (_available.Count > 0)
        {
            // Get from available queue
            obj = _available.Dequeue();
        }
        else if (_autoExpand && CanCreateMore())
        {
            // Auto-expand: create new object
            obj = CreateNew();
            Debug.LogWarning($"[ObjectPool] Pool expanded. Total: {TotalCount}");
        }
        else
        {
            // Cannot get object
            Debug.LogError($"[ObjectPool] Pool exhausted! Max: {_maxSize}");
            return null;
        }

        // Call activation callback
        obj.OnSpawn();
        return obj;
    }

    /// <summary>
    /// Return object to the pool
    /// </summary>
    public void Return(T obj)
    {
        if (obj == null)
        {
            Debug.LogWarning("[ObjectPool] Trying to return null object");
            return;
        }

        // Call recycle callback
        obj.OnDespawn();

        // Put back in available queue
        _available.Enqueue(obj);
    }

    /// <summary>
    /// Return all active objects
    /// </summary>
    public void ReturnAll()
    {
        foreach (T obj in _all)
        {
            if (obj.IsActive)
            {
                Return(obj);
            }
        }
    }

    /// <summary>
    /// Clear the object pool
    /// </summary>
    public void Clear()
    {
        _available.Clear();
        _all.Clear();
    }

    /// <summary>
    /// Create new object
    /// </summary>
    private T CreateNew()
    {
        T obj = _factory();
        _all.Add(obj);
        return obj;
    }

    /// <summary>
    /// Check if more objects can be created
    /// </summary>
    private bool CanCreateMore()
    {
        return _maxSize <= 0 || TotalCount < _maxSize;
    }
}
```

### Unity MonoBehaviour Object Pool

For Unity GameObjects, special handling is required:

```csharp
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Unity GameObject object pool
/// </summary>
public class GameObjectPool
{
    private readonly GameObject _prefab;
    private readonly Transform _parent;
    private readonly Queue<GameObject> _available;
    private readonly List<GameObject> _all;
    private readonly int _maxSize;
    private readonly bool _autoExpand;

    public int TotalCount => _all.Count;
    public int AvailableCount => _available.Count;
    public int ActiveCount => TotalCount - AvailableCount;

    public GameObjectPool(
        GameObject prefab,
        Transform parent = null,
        int initialSize = 10,
        int maxSize = 100,
        bool autoExpand = true)
    {
        _prefab = prefab;
        _parent = parent;
        _maxSize = maxSize;
        _autoExpand = autoExpand;

        _available = new Queue<GameObject>(initialSize);
        _all = new List<GameObject>(initialSize);

        // Prewarm
        Prewarm(initialSize);
    }

    /// <summary>
    /// Prewarm the object pool
    /// </summary>
    public void Prewarm(int count)
    {
        for (int i = 0; i < count && CanCreateMore(); i++)
        {
            GameObject obj = CreateNew();
            obj.SetActive(false);
            _available.Enqueue(obj);
        }
    }

    /// <summary>
    /// Get object
    /// </summary>
    public GameObject Get(Vector3 position, Quaternion rotation)
    {
        GameObject obj;

        if (_available.Count > 0)
        {
            obj = _available.Dequeue();
        }
        else if (_autoExpand && CanCreateMore())
        {
            obj = CreateNew();
        }
        else
        {
            return null;
        }

        // Set position and rotation
        obj.transform.SetPositionAndRotation(position, rotation);
        obj.SetActive(true);

        // Notify all IPoolable components
        var poolables = obj.GetComponents<IPoolable>();
        foreach (var poolable in poolables)
        {
            poolable.OnSpawn();
        }

        return obj;
    }

    /// <summary>
    /// Return object
    /// </summary>
    public void Return(GameObject obj)
    {
        if (obj == null) return;

        // Notify all IPoolable components
        var poolables = obj.GetComponents<IPoolable>();
        foreach (var poolable in poolables)
        {
            poolable.OnDespawn();
        }

        obj.SetActive(false);
        obj.transform.SetParent(_parent);
        _available.Enqueue(obj);
    }

    /// <summary>
    /// Delayed return
    /// </summary>
    public void Return(GameObject obj, float delay)
    {
        if (obj == null) return;

        // Use coroutine for delayed return
        var returner = obj.GetComponent<PooledObjectReturner>();
        if (returner == null)
        {
            returner = obj.AddComponent<PooledObjectReturner>();
        }
        returner.ReturnAfterDelay(this, delay);
    }

    private GameObject CreateNew()
    {
        GameObject obj = Object.Instantiate(_prefab, _parent);
        obj.name = $"{_prefab.name}_{_all.Count}";
        _all.Add(obj);
        return obj;
    }

    private bool CanCreateMore()
    {
        return _maxSize <= 0 || TotalCount < _maxSize;
    }
}

/// <summary>
/// Delayed return helper component
/// </summary>
public class PooledObjectReturner : MonoBehaviour
{
    private GameObjectPool _pool;
    private float _returnTime;
    private bool _isPending;

    public void ReturnAfterDelay(GameObjectPool pool, float delay)
    {
        _pool = pool;
        _returnTime = Time.time + delay;
        _isPending = true;
    }

    void Update()
    {
        if (_isPending && Time.time >= _returnTime)
        {
            _isPending = false;
            _pool.Return(gameObject);
        }
    }
}
```

## Prewarming and Auto-Expansion

### Prewarming Strategy

Prewarming refers to pre-creating objects during game startup or scene loading to avoid creation overhead at runtime:

```csharp
/// <summary>
/// Pool Manager - Manages multiple object pools
/// </summary>
public class PoolManager : MonoBehaviour
{
    public static PoolManager Instance { get; private set; }

    [System.Serializable]
    public class PoolConfig
    {
        public string poolName;
        public GameObject prefab;
        public int initialSize = 20;
        public int maxSize = 100;
        public bool autoExpand = true;
        public PrewarmStrategy prewarmStrategy = PrewarmStrategy.OnStart;
    }

    public enum PrewarmStrategy
    {
        OnStart,           // Prewarm on game start
        OnSceneLoad,       // Prewarm on scene load
        OnDemand,          // Prewarm on demand
        Gradual            // Gradual prewarming across frames
    }

    [SerializeField] private List<PoolConfig> _poolConfigs;

    private Dictionary<string, GameObjectPool> _pools;

    void Awake()
    {
        Instance = this;
        _pools = new Dictionary<string, GameObjectPool>();
    }

    void Start()
    {
        // Prewarm on start
        foreach (var config in _poolConfigs)
        {
            if (config.prewarmStrategy == PrewarmStrategy.OnStart)
            {
                CreatePool(config);
            }
        }
    }

    /// <summary>
    /// Create object pool
    /// </summary>
    public void CreatePool(PoolConfig config)
    {
        if (_pools.ContainsKey(config.poolName))
        {
            Debug.LogWarning($"Pool {config.poolName} already exists");
            return;
        }

        // Create parent container
        var parent = new GameObject($"Pool_{config.poolName}");
        parent.transform.SetParent(transform);

        var pool = new GameObjectPool(
            config.prefab,
            parent.transform,
            config.initialSize,
            config.maxSize,
            config.autoExpand
        );

        _pools[config.poolName] = pool;

        Debug.Log($"[PoolManager] Created pool: {config.poolName}, Size: {config.initialSize}");
    }

    /// <summary>
    /// Gradual prewarm - Spread across multiple frames to avoid stuttering
    /// </summary>
    public IEnumerator GradualPrewarm(PoolConfig config, int objectsPerFrame = 5)
    {
        if (_pools.ContainsKey(config.poolName)) yield break;

        var parent = new GameObject($"Pool_{config.poolName}");
        parent.transform.SetParent(transform);

        var pool = new GameObjectPool(
            config.prefab,
            parent.transform,
            0,  // No initial prewarm
            config.maxSize,
            config.autoExpand
        );

        _pools[config.poolName] = pool;

        // Prewarm across frames
        int remaining = config.initialSize;
        while (remaining > 0)
        {
            int count = Mathf.Min(remaining, objectsPerFrame);
            pool.Prewarm(count);
            remaining -= count;

            // Wait for next frame
            yield return null;
        }

        Debug.Log($"[PoolManager] Gradual prewarm completed: {config.poolName}");
    }

    /// <summary>
    /// Get object
    /// </summary>
    public GameObject Get(string poolName, Vector3 position, Quaternion rotation)
    {
        if (_pools.TryGetValue(poolName, out var pool))
        {
            return pool.Get(position, rotation);
        }

        Debug.LogError($"[PoolManager] Pool not found: {poolName}");
        return null;
    }

    /// <summary>
    /// Return object
    /// </summary>
    public void Return(string poolName, GameObject obj)
    {
        if (_pools.TryGetValue(poolName, out var pool))
        {
            pool.Return(obj);
        }
    }

    /// <summary>
    /// Get pool statistics
    /// </summary>
    public void LogPoolStats()
    {
        Debug.Log("=== Pool Statistics ===");
        foreach (var kvp in _pools)
        {
            Debug.Log($"{kvp.Key}: Total={kvp.Value.TotalCount}, " +
                     $"Active={kvp.Value.ActiveCount}, " +
                     $"Available={kvp.Value.AvailableCount}");
        }
    }
}
```

### Auto-Expansion and Shrinking Strategy

```csharp
/// <summary>
/// Adaptive object pool - Supports dynamic expansion and shrinking
/// </summary>
public class AdaptivePool<T> where T : class, IPoolable
{
    private readonly Queue<T> _available;
    private readonly List<T> _all;
    private readonly Func<T> _factory;
    private readonly Action<T> _destroyer;

    // Configuration
    private int _minSize;
    private int _maxSize;
    private float _shrinkThreshold;      // Shrink threshold (available ratio)
    private float _shrinkDelay;          // Shrink delay time
    private int _shrinkAmount;           // Amount to shrink each time

    // State tracking
    private float _lastUseTime;
    private float _lastShrinkTime;
    private int _peakActiveCount;

    public AdaptivePool(
        Func<T> factory,
        Action<T> destroyer = null,
        int minSize = 5,
        int maxSize = 100,
        float shrinkThreshold = 0.5f,
        float shrinkDelay = 30f)
    {
        _factory = factory;
        _destroyer = destroyer;
        _minSize = minSize;
        _maxSize = maxSize;
        _shrinkThreshold = shrinkThreshold;
        _shrinkDelay = shrinkDelay;
        _shrinkAmount = Mathf.Max(1, minSize / 2);

        _available = new Queue<T>(minSize);
        _all = new List<T>(minSize);

        // Initial prewarm to minimum size
        Prewarm(_minSize);
    }

    public void Prewarm(int count)
    {
        for (int i = 0; i < count && _all.Count < _maxSize; i++)
        {
            var obj = _factory();
            _all.Add(obj);
            _available.Enqueue(obj);
        }
    }

    public T Get()
    {
        _lastUseTime = Time.time;

        T obj;
        if (_available.Count > 0)
        {
            obj = _available.Dequeue();
        }
        else if (_all.Count < _maxSize)
        {
            obj = _factory();
            _all.Add(obj);
        }
        else
        {
            return null;
        }

        obj.OnSpawn();

        // Update peak statistics
        int activeCount = _all.Count - _available.Count;
        _peakActiveCount = Mathf.Max(_peakActiveCount, activeCount);

        return obj;
    }

    public void Return(T obj)
    {
        if (obj == null) return;

        obj.OnDespawn();
        _available.Enqueue(obj);
    }

    /// <summary>
    /// Check and perform shrinking (should be called periodically in Update)
    /// </summary>
    public void TryShrink()
    {
        float currentTime = Time.time;

        // Check if shrink conditions are met
        if (currentTime - _lastUseTime < _shrinkDelay) return;
        if (currentTime - _lastShrinkTime < _shrinkDelay) return;

        float availableRatio = (float)_available.Count / _all.Count;
        if (availableRatio < _shrinkThreshold) return;
        if (_all.Count <= _minSize) return;

        // Perform shrinking
        int shrinkCount = Mathf.Min(_shrinkAmount, _all.Count - _minSize);
        for (int i = 0; i < shrinkCount && _available.Count > 0; i++)
        {
            T obj = _available.Dequeue();
            _all.Remove(obj);
            _destroyer?.Invoke(obj);
        }

        _lastShrinkTime = currentTime;
        Debug.Log($"[AdaptivePool] Shrunk by {shrinkCount}. New size: {_all.Count}");
    }

    /// <summary>
    /// Adapt to usage pattern
    /// </summary>
    public void AdaptToUsagePattern()
    {
        // Adjust minimum size based on peak usage
        if (_peakActiveCount > _minSize * 0.8f)
        {
            _minSize = Mathf.Min(_maxSize, (int)(_peakActiveCount * 1.2f));
            Prewarm(_minSize - _all.Count);
        }

        // Reset statistics
        _peakActiveCount = 0;
    }
}
```

## Spatial Partitioning Optimization

### Quadtree

Quadtree is a classic data structure for 2D spatial partitioning, recursively dividing space into four quadrants:

```csharp
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Quadtree node
/// </summary>
public class QuadTreeNode<T> where T : class
{
    // Bounds
    public Rect Bounds { get; private set; }

    // Stored objects
    private List<QuadTreeItem<T>> _items;

    // Child nodes
    private QuadTreeNode<T>[] _children;

    // Configuration
    private readonly int _maxItems;
    private readonly int _maxDepth;
    private readonly int _currentDepth;

    // Whether already split
    private bool _isSplit;

    public QuadTreeNode(Rect bounds, int maxItems = 8, int maxDepth = 5, int currentDepth = 0)
    {
        Bounds = bounds;
        _maxItems = maxItems;
        _maxDepth = maxDepth;
        _currentDepth = currentDepth;
        _items = new List<QuadTreeItem<T>>();
        _isSplit = false;
    }

    /// <summary>
    /// Insert object
    /// </summary>
    public bool Insert(T item, Rect itemBounds)
    {
        // Check if within current node bounds
        if (!Bounds.Overlaps(itemBounds))
        {
            return false;
        }

        // If not split and not full, add directly
        if (!_isSplit && _items.Count < _maxItems)
        {
            _items.Add(new QuadTreeItem<T>(item, itemBounds));
            return true;
        }

        // Try to split
        if (!_isSplit && _currentDepth < _maxDepth)
        {
            Split();
        }

        // If split, try to insert into child nodes
        if (_isSplit)
        {
            for (int i = 0; i < 4; i++)
            {
                if (_children[i].Insert(item, itemBounds))
                {
                    return true;
                }
            }
        }

        // Cannot insert into child nodes (crosses boundaries), store in current node
        _items.Add(new QuadTreeItem<T>(item, itemBounds));
        return true;
    }

    /// <summary>
    /// Query objects within a region
    /// </summary>
    public void Query(Rect queryBounds, List<T> results)
    {
        // Check for intersection
        if (!Bounds.Overlaps(queryBounds))
        {
            return;
        }

        // Add objects from current node
        foreach (var item in _items)
        {
            if (queryBounds.Overlaps(item.Bounds))
            {
                results.Add(item.Item);
            }
        }

        // Recursively query child nodes
        if (_isSplit)
        {
            for (int i = 0; i < 4; i++)
            {
                _children[i].Query(queryBounds, results);
            }
        }
    }

    /// <summary>
    /// Query objects within a circular region
    /// </summary>
    public void QueryCircle(Vector2 center, float radius, List<T> results)
    {
        // Fast AABB check
        Rect circleBounds = new Rect(
            center.x - radius, center.y - radius,
            radius * 2, radius * 2
        );

        if (!Bounds.Overlaps(circleBounds))
        {
            return;
        }

        // Precise circle detection
        float radiusSq = radius * radius;
        foreach (var item in _items)
        {
            Vector2 itemCenter = item.Bounds.center;
            if ((itemCenter - center).sqrMagnitude <= radiusSq)
            {
                results.Add(item.Item);
            }
        }

        if (_isSplit)
        {
            for (int i = 0; i < 4; i++)
            {
                _children[i].QueryCircle(center, radius, results);
            }
        }
    }

    /// <summary>
    /// Remove object
    /// </summary>
    public bool Remove(T item)
    {
        for (int i = _items.Count - 1; i >= 0; i--)
        {
            if (ReferenceEquals(_items[i].Item, item))
            {
                _items.RemoveAt(i);
                return true;
            }
        }

        if (_isSplit)
        {
            for (int i = 0; i < 4; i++)
            {
                if (_children[i].Remove(item))
                {
                    return true;
                }
            }
        }

        return false;
    }

    /// <summary>
    /// Clear the quadtree
    /// </summary>
    public void Clear()
    {
        _items.Clear();

        if (_isSplit)
        {
            for (int i = 0; i < 4; i++)
            {
                _children[i].Clear();
                _children[i] = null;
            }
            _isSplit = false;
        }
    }

    /// <summary>
    /// Split node
    /// </summary>
    private void Split()
    {
        float halfWidth = Bounds.width / 2;
        float halfHeight = Bounds.height / 2;
        float x = Bounds.x;
        float y = Bounds.y;

        _children = new QuadTreeNode<T>[4];

        // Bottom-left
        _children[0] = new QuadTreeNode<T>(
            new Rect(x, y, halfWidth, halfHeight),
            _maxItems, _maxDepth, _currentDepth + 1
        );

        // Bottom-right
        _children[1] = new QuadTreeNode<T>(
            new Rect(x + halfWidth, y, halfWidth, halfHeight),
            _maxItems, _maxDepth, _currentDepth + 1
        );

        // Top-left
        _children[2] = new QuadTreeNode<T>(
            new Rect(x, y + halfHeight, halfWidth, halfHeight),
            _maxItems, _maxDepth, _currentDepth + 1
        );

        // Top-right
        _children[3] = new QuadTreeNode<T>(
            new Rect(x + halfWidth, y + halfHeight, halfWidth, halfHeight),
            _maxItems, _maxDepth, _currentDepth + 1
        );

        _isSplit = true;

        // Redistribute existing objects to child nodes
        var oldItems = new List<QuadTreeItem<T>>(_items);
        _items.Clear();

        foreach (var item in oldItems)
        {
            bool inserted = false;
            for (int i = 0; i < 4; i++)
            {
                if (_children[i].Bounds.Contains(item.Bounds.center))
                {
                    _children[i].Insert(item.Item, item.Bounds);
                    inserted = true;
                    break;
                }
            }

            // Objects crossing boundaries stay in current node
            if (!inserted)
            {
                _items.Add(item);
            }
        }
    }
}

/// <summary>
/// Quadtree item
/// </summary>
public struct QuadTreeItem<T>
{
    public T Item;
    public Rect Bounds;

    public QuadTreeItem(T item, Rect bounds)
    {
        Item = item;
        Bounds = bounds;
    }
}

/// <summary>
/// Quadtree manager
/// </summary>
public class QuadTree<T> where T : class
{
    private QuadTreeNode<T> _root;
    private readonly Rect _worldBounds;

    public QuadTree(Rect worldBounds, int maxItemsPerNode = 8, int maxDepth = 5)
    {
        _worldBounds = worldBounds;
        _root = new QuadTreeNode<T>(worldBounds, maxItemsPerNode, maxDepth);
    }

    public void Insert(T item, Rect bounds) => _root.Insert(item, bounds);
    public void Remove(T item) => _root.Remove(item);
    public void Clear() => _root.Clear();

    public List<T> Query(Rect bounds)
    {
        var results = new List<T>();
        _root.Query(bounds, results);
        return results;
    }

    public List<T> QueryCircle(Vector2 center, float radius)
    {
        var results = new List<T>();
        _root.QueryCircle(center, radius, results);
        return results;
    }
}
```

### Octree

Octree is the 3D extension of quadtree, suitable for 3D spatial partitioning:

```csharp
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Octree node
/// </summary>
public class OctreeNode<T> where T : class
{
    public Bounds Bounds { get; private set; }

    private List<OctreeItem<T>> _items;
    private OctreeNode<T>[] _children;
    private readonly int _maxItems;
    private readonly int _maxDepth;
    private readonly int _currentDepth;
    private bool _isSplit;

    public OctreeNode(Bounds bounds, int maxItems = 8, int maxDepth = 5, int currentDepth = 0)
    {
        Bounds = bounds;
        _maxItems = maxItems;
        _maxDepth = maxDepth;
        _currentDepth = currentDepth;
        _items = new List<OctreeItem<T>>();
    }

    public bool Insert(T item, Bounds itemBounds)
    {
        if (!Bounds.Intersects(itemBounds))
        {
            return false;
        }

        if (!_isSplit && _items.Count < _maxItems)
        {
            _items.Add(new OctreeItem<T>(item, itemBounds));
            return true;
        }

        if (!_isSplit && _currentDepth < _maxDepth)
        {
            Split();
        }

        if (_isSplit)
        {
            // Try to insert into child node that fully contains the object
            for (int i = 0; i < 8; i++)
            {
                if (_children[i].Bounds.Contains(itemBounds.center) &&
                    _children[i].Insert(item, itemBounds))
                {
                    return true;
                }
            }
        }

        // Crosses boundaries, store in current node
        _items.Add(new OctreeItem<T>(item, itemBounds));
        return true;
    }

    public void Query(Bounds queryBounds, List<T> results)
    {
        if (!Bounds.Intersects(queryBounds))
        {
            return;
        }

        foreach (var item in _items)
        {
            if (queryBounds.Intersects(item.Bounds))
            {
                results.Add(item.Item);
            }
        }

        if (_isSplit)
        {
            for (int i = 0; i < 8; i++)
            {
                _children[i].Query(queryBounds, results);
            }
        }
    }

    /// <summary>
    /// Sphere region query
    /// </summary>
    public void QuerySphere(Vector3 center, float radius, List<T> results)
    {
        // Fast AABB exclusion
        Bounds sphereBounds = new Bounds(center, Vector3.one * radius * 2);
        if (!Bounds.Intersects(sphereBounds))
        {
            return;
        }

        float radiusSq = radius * radius;
        foreach (var item in _items)
        {
            // Check distance from bounds center to sphere center
            float distSq = (item.Bounds.center - center).sqrMagnitude;
            if (distSq <= radiusSq)
            {
                results.Add(item.Item);
            }
        }

        if (_isSplit)
        {
            for (int i = 0; i < 8; i++)
            {
                _children[i].QuerySphere(center, radius, results);
            }
        }
    }

    /// <summary>
    /// Ray query
    /// </summary>
    public void QueryRay(Ray ray, float maxDistance, List<T> results)
    {
        // Check if ray intersects current node
        if (!Bounds.IntersectRay(ray, out float distance) || distance > maxDistance)
        {
            return;
        }

        foreach (var item in _items)
        {
            if (item.Bounds.IntersectRay(ray, out float itemDist) && itemDist <= maxDistance)
            {
                results.Add(item.Item);
            }
        }

        if (_isSplit)
        {
            for (int i = 0; i < 8; i++)
            {
                _children[i].QueryRay(ray, maxDistance, results);
            }
        }
    }

    private void Split()
    {
        Vector3 size = Bounds.size / 2;
        Vector3 center = Bounds.center;

        _children = new OctreeNode<T>[8];

        for (int i = 0; i < 8; i++)
        {
            Vector3 offset = new Vector3(
                (i & 1) == 0 ? -size.x / 2 : size.x / 2,
                (i & 2) == 0 ? -size.y / 2 : size.y / 2,
                (i & 4) == 0 ? -size.z / 2 : size.z / 2
            );

            Bounds childBounds = new Bounds(center + offset, size);
            _children[i] = new OctreeNode<T>(childBounds, _maxItems, _maxDepth, _currentDepth + 1);
        }

        _isSplit = true;

        // Redistribute objects
        var oldItems = new List<OctreeItem<T>>(_items);
        _items.Clear();

        foreach (var item in oldItems)
        {
            bool inserted = false;
            for (int i = 0; i < 8; i++)
            {
                if (_children[i].Bounds.Contains(item.Bounds.center))
                {
                    _children[i].Insert(item.Item, item.Bounds);
                    inserted = true;
                    break;
                }
            }

            if (!inserted)
            {
                _items.Add(item);
            }
        }
    }

    public void Clear()
    {
        _items.Clear();
        if (_isSplit)
        {
            for (int i = 0; i < 8; i++)
            {
                _children[i].Clear();
                _children[i] = null;
            }
            _isSplit = false;
        }
    }
}

public struct OctreeItem<T>
{
    public T Item;
    public Bounds Bounds;

    public OctreeItem(T item, Bounds bounds)
    {
        Item = item;
        Bounds = bounds;
    }
}
```

### Spatial Hashing

For uniformly distributed objects, spatial hashing may be more efficient than tree structures:

```csharp
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Spatial hash - Suitable for uniformly distributed objects
/// </summary>
public class SpatialHash<T> where T : class
{
    private readonly Dictionary<int, List<SpatialHashItem<T>>> _cells;
    private readonly float _cellSize;
    private readonly int _gridWidth;
    private readonly int _gridHeight;

    // Object pool - Reuse lists to reduce GC
    private readonly Queue<List<SpatialHashItem<T>>> _listPool;

    public SpatialHash(float worldWidth, float worldHeight, float cellSize)
    {
        _cellSize = cellSize;
        _gridWidth = Mathf.CeilToInt(worldWidth / cellSize);
        _gridHeight = Mathf.CeilToInt(worldHeight / cellSize);
        _cells = new Dictionary<int, List<SpatialHashItem<T>>>();
        _listPool = new Queue<List<SpatialHashItem<T>>>();
    }

    /// <summary>
    /// Calculate grid hash value
    /// </summary>
    private int GetHash(int x, int y)
    {
        // Use simple linear indexing
        return x + y * _gridWidth;
    }

    /// <summary>
    /// World coordinates to grid coordinates
    /// </summary>
    private (int x, int y) WorldToGrid(Vector2 position)
    {
        int x = Mathf.FloorToInt(position.x / _cellSize);
        int y = Mathf.FloorToInt(position.y / _cellSize);
        return (x, y);
    }

    /// <summary>
    /// Insert object
    /// </summary>
    public void Insert(T item, Vector2 position, float radius = 0)
    {
        // Calculate all cells the object covers
        int minX = Mathf.FloorToInt((position.x - radius) / _cellSize);
        int maxX = Mathf.FloorToInt((position.x + radius) / _cellSize);
        int minY = Mathf.FloorToInt((position.y - radius) / _cellSize);
        int maxY = Mathf.FloorToInt((position.y + radius) / _cellSize);

        var hashItem = new SpatialHashItem<T>(item, position, radius);

        for (int y = minY; y <= maxY; y++)
        {
            for (int x = minX; x <= maxX; x++)
            {
                int hash = GetHash(x, y);

                if (!_cells.TryGetValue(hash, out var list))
                {
                    list = GetList();
                    _cells[hash] = list;
                }

                list.Add(hashItem);
            }
        }
    }

    /// <summary>
    /// Query circular region
    /// </summary>
    public void Query(Vector2 center, float radius, List<T> results)
    {
        int minX = Mathf.FloorToInt((center.x - radius) / _cellSize);
        int maxX = Mathf.FloorToInt((center.x + radius) / _cellSize);
        int minY = Mathf.FloorToInt((center.y - radius) / _cellSize);
        int maxY = Mathf.FloorToInt((center.y + radius) / _cellSize);

        // Use HashSet to avoid duplicates (objects may be in multiple cells)
        var seen = new HashSet<T>();
        float radiusSq = radius * radius;

        for (int y = minY; y <= maxY; y++)
        {
            for (int x = minX; x <= maxX; x++)
            {
                int hash = GetHash(x, y);

                if (_cells.TryGetValue(hash, out var list))
                {
                    foreach (var item in list)
                    {
                        if (seen.Contains(item.Item)) continue;

                        float distSq = (item.Position - center).sqrMagnitude;
                        float combinedRadius = radius + item.Radius;

                        if (distSq <= combinedRadius * combinedRadius)
                        {
                            results.Add(item.Item);
                            seen.Add(item.Item);
                        }
                    }
                }
            }
        }
    }

    /// <summary>
    /// Clear
    /// </summary>
    public void Clear()
    {
        foreach (var kvp in _cells)
        {
            kvp.Value.Clear();
            ReturnList(kvp.Value);
        }
        _cells.Clear();
    }

    /// <summary>
    /// Get list (from pool or create new)
    /// </summary>
    private List<SpatialHashItem<T>> GetList()
    {
        return _listPool.Count > 0
            ? _listPool.Dequeue()
            : new List<SpatialHashItem<T>>();
    }

    /// <summary>
    /// Return list to pool
    /// </summary>
    private void ReturnList(List<SpatialHashItem<T>> list)
    {
        list.Clear();
        _listPool.Enqueue(list);
    }
}

public struct SpatialHashItem<T>
{
    public T Item;
    public Vector2 Position;
    public float Radius;

    public SpatialHashItem(T item, Vector2 position, float radius)
    {
        Item = item;
        Position = position;
        Radius = radius;
    }
}
```

## Frustum Culling

### Frustum Principles

Frustum culling is an important rendering optimization technique that determines whether to render objects based on whether they are within the camera's visible range:

```csharp
using UnityEngine;

/// <summary>
/// Frustum culling manager
/// </summary>
public class FrustumCullingManager : MonoBehaviour
{
    [SerializeField] private Camera _mainCamera;
    [SerializeField] private float _cullDistance = 100f;

    private Plane[] _frustumPlanes;

    // Cache to avoid per-frame allocation
    private readonly Collider[] _overlapResults = new Collider[256];

    void Start()
    {
        if (_mainCamera == null)
        {
            _mainCamera = Camera.main;
        }

        _frustumPlanes = new Plane[6];
    }

    void Update()
    {
        // Update frustum planes
        GeometryUtility.CalculateFrustumPlanes(_mainCamera, _frustumPlanes);
    }

    /// <summary>
    /// Check if point is within frustum
    /// </summary>
    public bool IsPointVisible(Vector3 point)
    {
        foreach (var plane in _frustumPlanes)
        {
            if (plane.GetDistanceToPoint(point) < 0)
            {
                return false;
            }
        }
        return true;
    }

    /// <summary>
    /// Check if bounds is within frustum
    /// </summary>
    public bool IsBoundsVisible(Bounds bounds)
    {
        return GeometryUtility.TestPlanesAABB(_frustumPlanes, bounds);
    }

    /// <summary>
    /// Check if sphere is within frustum
    /// </summary>
    public bool IsSphereVisible(Vector3 center, float radius)
    {
        foreach (var plane in _frustumPlanes)
        {
            if (plane.GetDistanceToPoint(center) < -radius)
            {
                return false;
            }
        }
        return true;
    }

    /// <summary>
    /// Get all colliders within frustum
    /// </summary>
    public int GetVisibleColliders(Vector3 center, LayerMask layer, Collider[] results)
    {
        // First use sphere detection to get nearby objects
        int count = Physics.OverlapSphereNonAlloc(
            center, _cullDistance, _overlapResults, layer
        );

        int visibleCount = 0;
        for (int i = 0; i < count && visibleCount < results.Length; i++)
        {
            if (IsBoundsVisible(_overlapResults[i].bounds))
            {
                results[visibleCount++] = _overlapResults[i];
            }
        }

        return visibleCount;
    }
}

/// <summary>
/// Cullable object component
/// </summary>
public class CullableObject : MonoBehaviour
{
    [SerializeField] private Renderer[] _renderers;
    [SerializeField] private Behaviour[] _behaviours;
    [SerializeField] private float _cullCheckInterval = 0.1f;

    private FrustumCullingManager _cullingManager;
    private Bounds _bounds;
    private float _lastCheckTime;
    private bool _isVisible = true;

    void Start()
    {
        _cullingManager = FindObjectOfType<FrustumCullingManager>();

        if (_renderers == null || _renderers.Length == 0)
        {
            _renderers = GetComponentsInChildren<Renderer>();
        }

        UpdateBounds();
    }

    void Update()
    {
        if (Time.time - _lastCheckTime < _cullCheckInterval)
        {
            return;
        }

        _lastCheckTime = Time.time;
        UpdateBounds();

        bool visible = _cullingManager.IsBoundsVisible(_bounds);

        if (visible != _isVisible)
        {
            _isVisible = visible;
            SetVisible(visible);
        }
    }

    private void UpdateBounds()
    {
        if (_renderers.Length == 0) return;

        _bounds = _renderers[0].bounds;
        for (int i = 1; i < _renderers.Length; i++)
        {
            _bounds.Encapsulate(_renderers[i].bounds);
        }
    }

    private void SetVisible(bool visible)
    {
        // Enable/disable renderers
        foreach (var renderer in _renderers)
        {
            renderer.enabled = visible;
        }

        // Enable/disable behavior components
        foreach (var behaviour in _behaviours)
        {
            behaviour.enabled = visible;
        }
    }
}
```

### LOD (Level of Detail) Integration

Frustum culling is often combined with LOD systems:

```csharp
using UnityEngine;

/// <summary>
/// Custom LOD system
/// </summary>
public class CustomLOD : MonoBehaviour
{
    [System.Serializable]
    public class LODLevel
    {
        public GameObject model;
        public float screenRelativeHeight;  // Screen ratio threshold
    }

    [SerializeField] private LODLevel[] _lodLevels;
    [SerializeField] private float _updateInterval = 0.1f;

    private Camera _camera;
    private Bounds _bounds;
    private int _currentLOD = -1;
    private float _lastUpdateTime;

    void Start()
    {
        _camera = Camera.main;

        // Calculate bounds
        var renderers = GetComponentsInChildren<Renderer>();
        if (renderers.Length > 0)
        {
            _bounds = renderers[0].bounds;
            foreach (var r in renderers)
            {
                _bounds.Encapsulate(r.bounds);
            }
        }

        // Initially disable all LODs
        foreach (var lod in _lodLevels)
        {
            lod.model.SetActive(false);
        }
    }

    void Update()
    {
        if (Time.time - _lastUpdateTime < _updateInterval)
        {
            return;
        }
        _lastUpdateTime = Time.time;

        // Calculate screen ratio
        float screenHeight = CalculateScreenHeight();

        // Select LOD level
        int targetLOD = _lodLevels.Length - 1;  // Default to lowest level

        for (int i = 0; i < _lodLevels.Length; i++)
        {
            if (screenHeight >= _lodLevels[i].screenRelativeHeight)
            {
                targetLOD = i;
                break;
            }
        }

        // Switch LOD
        if (targetLOD != _currentLOD)
        {
            if (_currentLOD >= 0 && _currentLOD < _lodLevels.Length)
            {
                _lodLevels[_currentLOD].model.SetActive(false);
            }

            _lodLevels[targetLOD].model.SetActive(true);
            _currentLOD = targetLOD;
        }
    }

    /// <summary>
    /// Calculate object's relative height on screen
    /// </summary>
    private float CalculateScreenHeight()
    {
        float distance = Vector3.Distance(_camera.transform.position, transform.position);
        if (distance < 0.001f) return 1f;

        // Use bounds height to calculate screen ratio
        float objectHeight = _bounds.size.y;
        float screenHeight = (objectHeight / distance) * (_camera.fieldOfView * Mathf.Deg2Rad);

        return screenHeight;
    }
}
```

## Multithreaded Job System

### Unity Job System Basics

Unity's Job System allows us to safely perform multithreaded computations:

```csharp
using Unity.Jobs;
using Unity.Collections;
using Unity.Burst;
using UnityEngine;

/// <summary>
/// Using Job System for batch position updates
/// </summary>
public class JobSystemExample : MonoBehaviour
{
    [SerializeField] private int _objectCount = 10000;
    [SerializeField] private float _speed = 5f;

    private NativeArray<Vector3> _positions;
    private NativeArray<Vector3> _velocities;
    private TransformAccessArray _transforms;

    void Start()
    {
        // Allocate Native arrays
        _positions = new NativeArray<Vector3>(_objectCount, Allocator.Persistent);
        _velocities = new NativeArray<Vector3>(_objectCount, Allocator.Persistent);

        // Create objects and initialize
        var transforms = new Transform[_objectCount];
        for (int i = 0; i < _objectCount; i++)
        {
            var obj = GameObject.CreatePrimitive(PrimitiveType.Cube);
            obj.transform.position = Random.insideUnitSphere * 50f;
            obj.transform.localScale = Vector3.one * 0.5f;

            transforms[i] = obj.transform;
            _positions[i] = obj.transform.position;
            _velocities[i] = Random.insideUnitSphere.normalized * _speed;
        }

        _transforms = new TransformAccessArray(transforms);
    }

    void Update()
    {
        // Create and schedule Job
        var moveJob = new MoveJob
        {
            Positions = _positions,
            Velocities = _velocities,
            DeltaTime = Time.deltaTime,
            BoundsSize = 50f
        };

        // Schedule Job (optimized with Burst compiler)
        JobHandle moveHandle = moveJob.Schedule(_objectCount, 64);

        // Apply positions to Transform
        var applyJob = new ApplyPositionJob
        {
            Positions = _positions
        };

        JobHandle applyHandle = applyJob.Schedule(_transforms, moveHandle);

        // Ensure Job completes
        applyHandle.Complete();
    }

    void OnDestroy()
    {
        // Release Native arrays
        if (_positions.IsCreated) _positions.Dispose();
        if (_velocities.IsCreated) _velocities.Dispose();
        if (_transforms.isCreated) _transforms.Dispose();
    }

    /// <summary>
    /// Movement calculation Job
    /// </summary>
    [BurstCompile]
    struct MoveJob : IJobParallelFor
    {
        public NativeArray<Vector3> Positions;
        [ReadOnly] public NativeArray<Vector3> Velocities;
        [ReadOnly] public float DeltaTime;
        [ReadOnly] public float BoundsSize;

        public void Execute(int index)
        {
            Vector3 pos = Positions[index];
            Vector3 vel = Velocities[index];

            // Update position
            pos += vel * DeltaTime;

            // Boundary bounce
            if (pos.x > BoundsSize || pos.x < -BoundsSize) pos.x = Mathf.Clamp(pos.x, -BoundsSize, BoundsSize);
            if (pos.y > BoundsSize || pos.y < -BoundsSize) pos.y = Mathf.Clamp(pos.y, -BoundsSize, BoundsSize);
            if (pos.z > BoundsSize || pos.z < -BoundsSize) pos.z = Mathf.Clamp(pos.z, -BoundsSize, BoundsSize);

            Positions[index] = pos;
        }
    }

    /// <summary>
    /// Apply position to Transform Job
    /// </summary>
    [BurstCompile]
    struct ApplyPositionJob : IJobParallelForTransform
    {
        [ReadOnly] public NativeArray<Vector3> Positions;

        public void Execute(int index, TransformAccess transform)
        {
            transform.position = Positions[index];
        }
    }
}
```

### Multithreaded Collision Detection

```csharp
using Unity.Jobs;
using Unity.Collections;
using Unity.Burst;
using Unity.Mathematics;
using UnityEngine;

/// <summary>
/// Multithreaded collision detection system
/// </summary>
public class ParallelCollisionSystem : MonoBehaviour
{
    [SerializeField] private int _entityCount = 1000;
    [SerializeField] private float _collisionRadius = 1f;

    private NativeArray<float3> _positions;
    private NativeArray<float> _radii;
    private NativeArray<int> _collisionCounts;
    private NativeMultiHashMap<int, int> _spatialHash;

    private const float CELL_SIZE = 2f;
    private const int HASH_MAP_CAPACITY = 10000;

    void Start()
    {
        _positions = new NativeArray<float3>(_entityCount, Allocator.Persistent);
        _radii = new NativeArray<float>(_entityCount, Allocator.Persistent);
        _collisionCounts = new NativeArray<int>(_entityCount, Allocator.Persistent);
        _spatialHash = new NativeMultiHashMap<int, int>(HASH_MAP_CAPACITY, Allocator.Persistent);

        // Initialize positions
        for (int i = 0; i < _entityCount; i++)
        {
            _positions[i] = UnityEngine.Random.insideUnitSphere * 50f;
            _radii[i] = _collisionRadius;
        }
    }

    void Update()
    {
        // Clear spatial hash
        _spatialHash.Clear();

        // Step 1: Build spatial hash
        var buildHashJob = new BuildSpatialHashJob
        {
            Positions = _positions,
            CellSize = CELL_SIZE,
            SpatialHash = _spatialHash.AsParallelWriter()
        };

        JobHandle buildHandle = buildHashJob.Schedule(_entityCount, 64);

        // Step 2: Detect collisions
        var collisionJob = new DetectCollisionsJob
        {
            Positions = _positions,
            Radii = _radii,
            CollisionCounts = _collisionCounts,
            SpatialHash = _spatialHash,
            CellSize = CELL_SIZE
        };

        JobHandle collisionHandle = collisionJob.Schedule(_entityCount, 64, buildHandle);
        collisionHandle.Complete();

        // Process collision results
        ProcessCollisions();
    }

    void ProcessCollisions()
    {
        int totalCollisions = 0;
        for (int i = 0; i < _entityCount; i++)
        {
            totalCollisions += _collisionCounts[i];
        }
        // Each collision pair is counted twice
        totalCollisions /= 2;

        // Debug.Log($"Total collisions: {totalCollisions}");
    }

    void OnDestroy()
    {
        if (_positions.IsCreated) _positions.Dispose();
        if (_radii.IsCreated) _radii.Dispose();
        if (_collisionCounts.IsCreated) _collisionCounts.Dispose();
        if (_spatialHash.IsCreated) _spatialHash.Dispose();
    }

    /// <summary>
    /// Build spatial hash Job
    /// </summary>
    [BurstCompile]
    struct BuildSpatialHashJob : IJobParallelFor
    {
        [ReadOnly] public NativeArray<float3> Positions;
        [ReadOnly] public float CellSize;
        public NativeMultiHashMap<int, int>.ParallelWriter SpatialHash;

        public void Execute(int index)
        {
            float3 pos = Positions[index];
            int hash = GetCellHash(pos);
            SpatialHash.Add(hash, index);
        }

        int GetCellHash(float3 position)
        {
            int x = (int)math.floor(position.x / CellSize);
            int y = (int)math.floor(position.y / CellSize);
            int z = (int)math.floor(position.z / CellSize);

            // Simple hash function
            return x * 73856093 ^ y * 19349663 ^ z * 83492791;
        }
    }

    /// <summary>
    /// Collision detection Job
    /// </summary>
    [BurstCompile]
    struct DetectCollisionsJob : IJobParallelFor
    {
        [ReadOnly] public NativeArray<float3> Positions;
        [ReadOnly] public NativeArray<float> Radii;
        [WriteOnly] public NativeArray<int> CollisionCounts;
        [ReadOnly] public NativeMultiHashMap<int, int> SpatialHash;
        [ReadOnly] public float CellSize;

        public void Execute(int index)
        {
            float3 pos = Positions[index];
            float radius = Radii[index];
            int collisions = 0;

            // Check surrounding 27 cells
            for (int dx = -1; dx <= 1; dx++)
            {
                for (int dy = -1; dy <= 1; dy++)
                {
                    for (int dz = -1; dz <= 1; dz++)
                    {
                        float3 neighborPos = pos + new float3(dx, dy, dz) * CellSize;
                        int hash = GetCellHash(neighborPos);

                        if (SpatialHash.TryGetFirstValue(hash, out int otherIndex, out var iterator))
                        {
                            do
                            {
                                if (otherIndex != index)
                                {
                                    float3 otherPos = Positions[otherIndex];
                                    float otherRadius = Radii[otherIndex];
                                    float distSq = math.distancesq(pos, otherPos);
                                    float combinedRadius = radius + otherRadius;

                                    if (distSq < combinedRadius * combinedRadius)
                                    {
                                        collisions++;
                                    }
                                }
                            }
                            while (SpatialHash.TryGetNextValue(out otherIndex, ref iterator));
                        }
                    }
                }
            }

            CollisionCounts[index] = collisions;
        }

        int GetCellHash(float3 position)
        {
            int x = (int)math.floor(position.x / CellSize);
            int y = (int)math.floor(position.y / CellSize);
            int z = (int)math.floor(position.z / CellSize);
            return x * 73856093 ^ y * 19349663 ^ z * 83492791;
        }
    }
}
```

## CPU Performance Analysis

### Using Unity Profiler

```csharp
using UnityEngine;
using UnityEngine.Profiling;

/// <summary>
/// Performance profiling utility class
/// </summary>
public static class PerformanceProfiler
{
    private static CustomSampler _updateSampler;
    private static CustomSampler _physicsSampler;
    private static CustomSampler _renderSampler;

    static PerformanceProfiler()
    {
        _updateSampler = CustomSampler.Create("GameUpdate");
        _physicsSampler = CustomSampler.Create("GamePhysics");
        _renderSampler = CustomSampler.Create("GameRender");
    }

    /// <summary>
    /// Begin sampling
    /// </summary>
    public static void BeginSample(string name)
    {
        Profiler.BeginSample(name);
    }

    /// <summary>
    /// End sampling
    /// </summary>
    public static void EndSample()
    {
        Profiler.EndSample();
    }

    /// <summary>
    /// Use scoped sampling
    /// </summary>
    public static ProfilerScope ScopedSample(string name)
    {
        return new ProfilerScope(name);
    }
}

/// <summary>
/// Scoped sampler - Automatically ends sampling with using statement
/// </summary>
public struct ProfilerScope : System.IDisposable
{
    public ProfilerScope(string name)
    {
        Profiler.BeginSample(name);
    }

    public void Dispose()
    {
        Profiler.EndSample();
    }
}

/// <summary>
/// Runtime performance monitor
/// </summary>
public class RuntimePerformanceMonitor : MonoBehaviour
{
    [SerializeField] private bool _showGUI = true;
    [SerializeField] private float _updateInterval = 0.5f;

    private float _fps;
    private float _frameTime;
    private float _lastUpdateTime;
    private int _frameCount;

    private long _totalAllocatedMemory;
    private long _totalReservedMemory;
    private long _monoHeapSize;
    private long _monoUsedSize;

    void Update()
    {
        _frameCount++;

        if (Time.realtimeSinceStartup - _lastUpdateTime >= _updateInterval)
        {
            _fps = _frameCount / (Time.realtimeSinceStartup - _lastUpdateTime);
            _frameTime = 1000f / _fps;
            _frameCount = 0;
            _lastUpdateTime = Time.realtimeSinceStartup;

            // Update memory info
            _totalAllocatedMemory = Profiler.GetTotalAllocatedMemoryLong();
            _totalReservedMemory = Profiler.GetTotalReservedMemoryLong();
            _monoHeapSize = Profiler.GetMonoHeapSizeLong();
            _monoUsedSize = Profiler.GetMonoUsedSizeLong();
        }
    }

    void OnGUI()
    {
        if (!_showGUI) return;

        GUILayout.BeginArea(new Rect(10, 10, 300, 200));
        GUILayout.BeginVertical("box");

        // FPS info
        GUILayout.Label($"FPS: {_fps:F1}");
        GUILayout.Label($"Frame Time: {_frameTime:F2} ms");

        // Memory info
        GUILayout.Label($"Allocated: {_totalAllocatedMemory / 1024 / 1024} MB");
        GUILayout.Label($"Reserved: {_totalReservedMemory / 1024 / 1024} MB");
        GUILayout.Label($"Mono Heap: {_monoHeapSize / 1024 / 1024} MB");
        GUILayout.Label($"Mono Used: {_monoUsedSize / 1024 / 1024} MB");

        GUILayout.EndVertical();
        GUILayout.EndArea();
    }
}
```

### Frame Time Analysis

```csharp
using System.Collections.Generic;
using System.Diagnostics;
using UnityEngine;
using Debug = UnityEngine.Debug;

/// <summary>
/// Frame time analyzer
/// </summary>
public class FrameTimeAnalyzer : MonoBehaviour
{
    [SerializeField] private int _sampleCount = 300;
    [SerializeField] private float _warningThreshold = 16.67f;  // 60 FPS
    [SerializeField] private float _criticalThreshold = 33.33f;  // 30 FPS

    private Queue<float> _frameTimes;
    private Stopwatch _stopwatch;

    // Statistics
    private float _averageFrameTime;
    private float _minFrameTime;
    private float _maxFrameTime;
    private float _percentile99;
    private int _spikeCount;

    void Start()
    {
        _frameTimes = new Queue<float>(_sampleCount);
        _stopwatch = new Stopwatch();
    }

    void Update()
    {
        _stopwatch.Stop();

        float frameTime = (float)_stopwatch.Elapsed.TotalMilliseconds;

        // Record frame time
        if (_frameTimes.Count >= _sampleCount)
        {
            _frameTimes.Dequeue();
        }
        _frameTimes.Enqueue(frameTime);

        // Detect stuttering
        if (frameTime > _criticalThreshold)
        {
            _spikeCount++;
            Debug.LogWarning($"[FrameTime] Critical spike: {frameTime:F2}ms");
        }
        else if (frameTime > _warningThreshold)
        {
            Debug.Log($"[FrameTime] Warning: {frameTime:F2}ms");
        }

        // Update statistics
        UpdateStatistics();

        // Restart timing
        _stopwatch.Restart();
    }

    private void UpdateStatistics()
    {
        if (_frameTimes.Count == 0) return;

        var times = new List<float>(_frameTimes);
        times.Sort();

        float sum = 0;
        _minFrameTime = float.MaxValue;
        _maxFrameTime = float.MinValue;

        foreach (float t in times)
        {
            sum += t;
            _minFrameTime = Mathf.Min(_minFrameTime, t);
            _maxFrameTime = Mathf.Max(_maxFrameTime, t);
        }

        _averageFrameTime = sum / times.Count;

        // 99th percentile
        int index99 = (int)(times.Count * 0.99f);
        _percentile99 = times[index99];
    }

    /// <summary>
    /// Get performance report
    /// </summary>
    public string GetReport()
    {
        return $"Frame Time Report:\n" +
               $"  Average: {_averageFrameTime:F2}ms ({1000f / _averageFrameTime:F1} FPS)\n" +
               $"  Min: {_minFrameTime:F2}ms\n" +
               $"  Max: {_maxFrameTime:F2}ms\n" +
               $"  99th Percentile: {_percentile99:F2}ms\n" +
               $"  Spike Count: {_spikeCount}";
    }

    void OnDestroy()
    {
        Debug.Log(GetReport());
    }
}
```

## Memory Optimization

### Reducing GC Allocations

```csharp
using System.Collections.Generic;
using System.Text;
using UnityEngine;

/// <summary>
/// Memory optimization best practices example
/// </summary>
public class MemoryOptimizationExamples : MonoBehaviour
{
    // 1. Cache component references
    private Transform _transform;
    private Rigidbody _rigidbody;

    // 2. Pre-allocate collections
    private List<GameObject> _enemies = new List<GameObject>(100);
    private Dictionary<int, string> _nameCache = new Dictionary<int, string>(256);

    // 3. Reuse arrays
    private Collider[] _overlapResults = new Collider[32];
    private RaycastHit[] _raycastResults = new RaycastHit[16];

    // 4. Reuse string builder
    private StringBuilder _stringBuilder = new StringBuilder(256);

    // 5. Cache delegates
    private System.Action<int> _cachedCallback;

    void Start()
    {
        // Cache components
        _transform = transform;
        _rigidbody = GetComponent<Rigidbody>();

        // Cache delegate
        _cachedCallback = OnEnemyDeath;
    }

    void Update()
    {
        // Wrong example: Allocating new array every frame
        // Collider[] results = Physics.OverlapSphere(transform.position, 10f);

        // Correct example: Use pre-allocated array
        int count = Physics.OverlapSphereNonAlloc(_transform.position, 10f, _overlapResults);
        for (int i = 0; i < count; i++)
        {
            ProcessCollider(_overlapResults[i]);
        }
    }

    /// <summary>
    /// Avoid string concatenation GC
    /// </summary>
    public string GetStatusText(int score, float time, int level)
    {
        // Wrong example: Creates multiple temporary strings each call
        // return "Score: " + score + " Time: " + time + " Level: " + level;

        // Correct example: Use StringBuilder
        _stringBuilder.Clear();
        _stringBuilder.Append("Score: ");
        _stringBuilder.Append(score);
        _stringBuilder.Append(" Time: ");
        _stringBuilder.Append(time.ToString("F1"));
        _stringBuilder.Append(" Level: ");
        _stringBuilder.Append(level);

        return _stringBuilder.ToString();
    }

    /// <summary>
    /// Avoid LINQ in hot paths
    /// </summary>
    public GameObject FindNearestEnemy(Vector3 position)
    {
        // Wrong example: LINQ causes GC
        // return _enemies
        //     .Where(e => e != null && e.activeInHierarchy)
        //     .OrderBy(e => Vector3.Distance(e.transform.position, position))
        //     .FirstOrDefault();

        // Correct example: Manual loop
        GameObject nearest = null;
        float nearestDistSq = float.MaxValue;

        for (int i = 0; i < _enemies.Count; i++)
        {
            var enemy = _enemies[i];
            if (enemy == null || !enemy.activeInHierarchy)
                continue;

            float distSq = (enemy.transform.position - position).sqrMagnitude;
            if (distSq < nearestDistSq)
            {
                nearestDistSq = distSq;
                nearest = enemy;
            }
        }

        return nearest;
    }

    /// <summary>
    /// Avoid boxing
    /// </summary>
    public void ProcessValue<T>(T value) where T : struct
    {
        // Wrong example: Boxing
        // object boxed = value;
        // Debug.Log(boxed);

        // Correct example: Use generics to avoid boxing
        Debug.Log(value.ToString());
    }

    /// <summary>
    /// Avoid closure capture
    /// </summary>
    public void RegisterCallbacks()
    {
        int localId = 42;

        // Wrong example: Closure captures local variable, causes GC
        // SomeEvent += () => OnEvent(localId);

        // Correct example: Use cached delegate
        // SomeEvent += _cachedCallback;
    }

    private void OnEnemyDeath(int id)
    {
        Debug.Log($"Enemy {id} died");
    }

    private void ProcessCollider(Collider col)
    {
        // Process collider
    }
}

/// <summary>
/// Pooled data structure
/// </summary>
public class PooledList<T>
{
    private static Stack<List<T>> _pool = new Stack<List<T>>();
    private List<T> _list;
    private bool _isReturned;

    public int Count => _list.Count;

    public static PooledList<T> Get()
    {
        var pooledList = new PooledList<T>();
        pooledList._list = _pool.Count > 0 ? _pool.Pop() : new List<T>();
        pooledList._isReturned = false;
        return pooledList;
    }

    public void Add(T item)
    {
        _list.Add(item);
    }

    public T this[int index]
    {
        get => _list[index];
        set => _list[index] = value;
    }

    public void Return()
    {
        if (_isReturned) return;

        _list.Clear();
        _pool.Push(_list);
        _isReturned = true;
    }

    public List<T>.Enumerator GetEnumerator()
    {
        return _list.GetEnumerator();
    }
}
```

### Struct Optimization

```csharp
using System.Runtime.InteropServices;
using UnityEngine;

/// <summary>
/// Struct optimization examples
/// </summary>
public class StructOptimizationExamples
{
    // 1. Use structs instead of small classes (avoid heap allocation)
    public struct DamageInfo
    {
        public int Damage;
        public int AttackerId;
        public DamageType Type;
        public Vector3 HitPoint;
    }

    public enum DamageType : byte  // Use smallest enum base type
    {
        Physical,
        Magical,
        True
    }

    // 2. Arrange fields properly to reduce padding
    [StructLayout(LayoutKind.Sequential)]
    public struct OptimizedStruct
    {
        public long LongValue;      // 8 bytes
        public int IntValue1;       // 4 bytes
        public int IntValue2;       // 4 bytes
        public short ShortValue;    // 2 bytes
        public byte ByteValue1;     // 1 byte
        public byte ByteValue2;     // 1 byte
        // Total: 20 bytes, no padding
    }

    // Wrong example: Field order causes padding
    [StructLayout(LayoutKind.Sequential)]
    public struct UnoptimizedStruct
    {
        public byte ByteValue1;     // 1 byte + 7 padding
        public long LongValue;      // 8 bytes
        public byte ByteValue2;     // 1 byte + 3 padding
        public int IntValue;        // 4 bytes
        // Total: 24 bytes with padding
    }

    // 3. Use readonly struct to avoid defensive copying
    public readonly struct ReadOnlyVector3
    {
        public readonly float X;
        public readonly float Y;
        public readonly float Z;

        public ReadOnlyVector3(float x, float y, float z)
        {
            X = x;
            Y = y;
            Z = z;
        }

        public float Magnitude => Mathf.Sqrt(X * X + Y * Y + Z * Z);

        public static ReadOnlyVector3 operator +(ReadOnlyVector3 a, ReadOnlyVector3 b)
        {
            return new ReadOnlyVector3(a.X + b.X, a.Y + b.Y, a.Z + b.Z);
        }
    }

    // 4. Use ref return to avoid copying
    private DamageInfo[] _damageHistory = new DamageInfo[1000];

    public ref DamageInfo GetDamageRef(int index)
    {
        return ref _damageHistory[index];
    }

    // 5. Use Span<T> to avoid array copying
    public void ProcessDamages(Span<DamageInfo> damages)
    {
        for (int i = 0; i < damages.Length; i++)
        {
            // Modify directly, no copying needed
            damages[i].Damage *= 2;
        }
    }
}
```

## Comprehensive Practical Example

### Complete Bullet System Implementation

```csharp
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// High-performance bullet system
/// </summary>
public class BulletSystem : MonoBehaviour
{
    [Header("Configuration")]
    [SerializeField] private int _initialPoolSize = 100;
    [SerializeField] private int _maxPoolSize = 500;
    [SerializeField] private float _bulletSpeed = 20f;
    [SerializeField] private float _bulletLifetime = 5f;
    [SerializeField] private GameObject _bulletPrefab;

    [Header("Spatial Partitioning")]
    [SerializeField] private float _worldSize = 100f;
    [SerializeField] private float _cellSize = 5f;

    // Object pool
    private GameObjectPool _bulletPool;

    // Active bullets list
    private List<Bullet> _activeBullets;

    // Spatial hash for collision detection
    private SpatialHash<Bullet> _spatialHash;

    // Enemy list (for collision detection)
    private List<Enemy> _enemies;

    // Reusable results list
    private List<Bullet> _queryResults;

    void Start()
    {
        // Initialize object pool
        var poolParent = new GameObject("BulletPool").transform;
        poolParent.SetParent(transform);

        _bulletPool = new GameObjectPool(
            _bulletPrefab,
            poolParent,
            _initialPoolSize,
            _maxPoolSize,
            autoExpand: true
        );

        // Initialize collections
        _activeBullets = new List<Bullet>(_maxPoolSize);
        _spatialHash = new SpatialHash<Bullet>(_worldSize, _worldSize, _cellSize);
        _enemies = new List<Enemy>(100);
        _queryResults = new List<Bullet>(32);
    }

    /// <summary>
    /// Fire bullet
    /// </summary>
    public void Fire(Vector3 position, Vector3 direction)
    {
        GameObject bulletObj = _bulletPool.Get(position, Quaternion.LookRotation(direction));
        if (bulletObj == null) return;

        var bullet = bulletObj.GetComponent<Bullet>();
        bullet.Initialize(direction.normalized * _bulletSpeed, _bulletLifetime);

        _activeBullets.Add(bullet);
    }

    void Update()
    {
        float deltaTime = Time.deltaTime;

        // Rebuild spatial hash
        _spatialHash.Clear();

        // Update all bullets
        for (int i = _activeBullets.Count - 1; i >= 0; i--)
        {
            var bullet = _activeBullets[i];

            // Update position
            bullet.UpdatePosition(deltaTime);

            // Check lifetime
            if (bullet.IsExpired)
            {
                ReturnBullet(bullet, i);
                continue;
            }

            // Add to spatial hash
            Vector2 pos2D = new Vector2(bullet.Position.x, bullet.Position.z);
            _spatialHash.Insert(bullet, pos2D, bullet.Radius);
        }

        // Perform collision detection
        PerformCollisionDetection();
    }

    /// <summary>
    /// Perform collision detection
    /// </summary>
    private void PerformCollisionDetection()
    {
        foreach (var enemy in _enemies)
        {
            if (!enemy.IsAlive) continue;

            Vector2 enemyPos2D = new Vector2(enemy.Position.x, enemy.Position.z);

            _queryResults.Clear();
            _spatialHash.Query(enemyPos2D, enemy.Radius + 1f, _queryResults);

            foreach (var bullet in _queryResults)
            {
                if (bullet.IsHit) continue;

                // Precise distance detection
                float dist = Vector3.Distance(bullet.Position, enemy.Position);
                if (dist < bullet.Radius + enemy.Radius)
                {
                    // Collision occurred
                    bullet.OnHit();
                    enemy.TakeDamage(bullet.Damage);

                    // Remove bullet
                    int index = _activeBullets.IndexOf(bullet);
                    if (index >= 0)
                    {
                        ReturnBullet(bullet, index);
                    }
                }
            }
        }
    }

    /// <summary>
    /// Return bullet to pool
    /// </summary>
    private void ReturnBullet(Bullet bullet, int index)
    {
        _activeBullets.RemoveAt(index);
        _bulletPool.Return(bullet.gameObject);
    }

    /// <summary>
    /// Register enemy
    /// </summary>
    public void RegisterEnemy(Enemy enemy)
    {
        _enemies.Add(enemy);
    }

    /// <summary>
    /// Unregister enemy
    /// </summary>
    public void UnregisterEnemy(Enemy enemy)
    {
        _enemies.Remove(enemy);
    }
}

/// <summary>
/// Bullet component
/// </summary>
public class Bullet : MonoBehaviour, IPoolable
{
    public Vector3 Position => transform.position;
    public float Radius => 0.2f;
    public int Damage => 10;
    public bool IsExpired => Time.time >= _expireTime;
    public bool IsHit { get; private set; }
    public bool IsActive => gameObject.activeInHierarchy;

    private Vector3 _velocity;
    private float _expireTime;

    public void Initialize(Vector3 velocity, float lifetime)
    {
        _velocity = velocity;
        _expireTime = Time.time + lifetime;
        IsHit = false;
    }

    public void UpdatePosition(float deltaTime)
    {
        transform.position += _velocity * deltaTime;
    }

    public void OnHit()
    {
        IsHit = true;
    }

    public void OnSpawn()
    {
        IsHit = false;
    }

    public void OnDespawn()
    {
        _velocity = Vector3.zero;
    }
}

/// <summary>
/// Enemy interface (simplified)
/// </summary>
public class Enemy : MonoBehaviour
{
    public Vector3 Position => transform.position;
    public float Radius => 1f;
    public bool IsAlive => _health > 0;

    private int _health = 100;

    public void TakeDamage(int damage)
    {
        _health -= damage;
        if (_health <= 0)
        {
            OnDeath();
        }
    }

    private void OnDeath()
    {
        // Handle death logic
        gameObject.SetActive(false);
    }
}
```

## Interview Key Points

### Core Concept Questions

**Q1: What is an object pool? Why use object pools?**

A: An object pool is a design pattern that pre-creates a set of reusable objects to avoid performance overhead from frequent creation and destruction.

Reasons to use object pools:
1. **Reduce GC pressure**: Avoid frequent heap memory allocation and garbage collection
2. **Lower CPU overhead**: Object creation and initialization requires CPU time
3. **Avoid memory fragmentation**: Frequent allocation and deallocation causes heap memory fragmentation
4. **Stable frame rate**: Avoid sudden frame rate drops caused by GC

**Q2: What are the differences between quadtree and octree, and their use cases?**

A:
- **Quadtree**: 2D spatial partitioning, each node splits into 4 child nodes, suitable for 2D games, top-down games, map partitioning
- **Octree**: 3D spatial partitioning, each node splits into 8 child nodes, suitable for 3D games, spatial object management, ray detection acceleration

Selection criteria:
- Whether the game is 2D or 3D
- Whether objects are uniformly distributed (consider spatial hashing for uniform distribution)
- Whether dynamic updates are needed (tree structure updates have higher cost)

**Q3: What is the principle of frustum culling?**

A: Frustum culling determines whether to render objects by checking if they are within the camera's visible range (frustum):

1. The camera frustum consists of 6 planes (near, far, top, bottom, left, right)
2. For each object, check if its bounding box/sphere intersects with the frustum
3. Objects not within the frustum skip rendering

Optimization strategies:
- Combine with spatial partitioning to quickly exclude large numbers of objects
- Use LOD system to adjust detail levels based on distance
- Use occlusion culling to exclude occluded objects

### Practical Questions

**Q4: How to design an object pool that supports prewarming and auto-expansion?**

A: Key design points:

```csharp
// 1. Prewarm: Create objects during game loading
public void Prewarm(int count)
{
    for (int i = 0; i < count; i++)
    {
        var obj = CreateNew();
        _available.Enqueue(obj);
    }
}

// 2. Auto-expand: Dynamically create when pool is exhausted
public T Get()
{
    if (_available.Count > 0)
        return _available.Dequeue();

    if (_autoExpand && _all.Count < _maxSize)
        return CreateNew();

    return null;  // Or use LRU strategy to recycle oldest object
}

// 3. Gradual prewarm: Avoid stuttering during loading
public IEnumerator GradualPrewarm(int total, int perFrame)
{
    int remaining = total;
    while (remaining > 0)
    {
        Prewarm(Mathf.Min(remaining, perFrame));
        remaining -= perFrame;
        yield return null;
    }
}
```

**Q5: How to reduce GC in games?**

A:
1. **Object pooling**: Reuse frequently created and destroyed objects
2. **Pre-allocate collections**: Use List, Dictionary with initial capacity
3. **Avoid boxing**: Use generics, avoid value type to object conversion
4. **Reuse arrays**: Use NonAlloc versions of Physics API
5. **Avoid closures**: Cache delegates, avoid capturing local variables
6. **String optimization**: Use StringBuilder, cache commonly used strings
7. **Avoid LINQ**: Use manual loops in hot paths
8. **Use structs**: Use struct instead of class for small data

**Q6: What are the advantages and considerations of Unity Job System?**

A:
Advantages:
1. **Multithreaded safety**: Compile-time data race checking
2. **Burst compilation**: SIMD optimization, near-native code performance
3. **ECS integration**: Fully leverage Unity DOTS architecture

Considerations:
1. NativeArray etc. must be manually disposed (Dispose)
2. Cannot directly access Unity API in Jobs
3. Main thread must wait for Job completion to read results
4. Data must be blittable types

## Summary

Game performance optimization is a systematic engineering effort that requires comprehensive consideration from multiple levels:

1. **Memory management**: Use object pools to reduce GC, properly use structs and value types
2. **Spatial optimization**: Choose appropriate spatial partitioning structures to accelerate collision detection and range queries
3. **Rendering optimization**: Frustum culling, LOD, occlusion culling to reduce rendering load
4. **Multithreading**: Leverage Job System for parallel processing of computationally intensive tasks
5. **Performance analysis**: Use Profiler to identify bottlenecks, optimize targeted areas

Remember: Premature optimization is the root of all evil. First use Profiler to find the real performance bottlenecks, then optimize specifically. Also, find a balance between code readability and performance - don't significantly increase code complexity for minor performance improvements.
