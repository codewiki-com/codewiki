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
origin: old/src/content/docs/gamedev/object-pooling.zh.md
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

在游戏开发中，性能优化是决定游戏体验的关键因素。频繁的对象创建和销毁会导致内存分配压力、垃圾回收（GC）卡顿，严重影响游戏流畅度。对象池（Object Pool）是解决这一问题的核心技术，本文将深入探讨对象池原理、实现方式，以及空间分区、视锥剔除、多线程等进阶优化技术。

## 对象池原理

### 为什么需要对象池

在游戏运行过程中，某些对象会被频繁创建和销毁，例如：

- 子弹、特效粒子
- 敌人单位、NPC
- UI 元素、伤害数字
- 音效对象

每次使用 `new` 创建对象时，系统需要：

1. 在堆内存中分配空间
2. 调用构造函数初始化
3. 返回对象引用

当对象不再使用时：

1. 标记为可回收
2. 等待 GC 触发
3. GC 暂停程序执行
4. 回收内存并整理堆空间

```csharp
// 问题示例：每帧创建大量子弹
public class BadBulletManager : MonoBehaviour
{
    public GameObject bulletPrefab;

    void Update()
    {
        if (Input.GetMouseButton(0))
        {
            // 每次射击都创建新对象 - 导致频繁 GC
            GameObject bullet = Instantiate(bulletPrefab);
            bullet.transform.position = transform.position;

            // 3 秒后销毁 - 触发 GC
            Destroy(bullet, 3f);
        }
    }
}
```

这种方式的问题：

- **内存抖动**：频繁分配和释放导致内存碎片
- **GC 卡顿**：垃圾回收会造成明显的帧率下降
- **CPU 开销**：对象创建和初始化消耗 CPU 时间

### 对象池核心思想

对象池的核心思想是**预先创建、重复利用**：

1. 游戏启动时预先创建一定数量的对象
2. 需要使用时从池中获取（而非新建）
3. 使用完毕后归还到池中（而非销毁）
4. 对象在整个游戏生命周期内被反复使用

```
┌─────────────────────────────────────────────────────────────┐
│                        对象池                                │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                   │
│  │对象1│ │对象2│ │对象3│ │对象4│ │对象5│  ...              │
│  │空闲 │ │使用中│ │空闲 │ │空闲 │ │使用中│                   │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                   │
└─────────────────────────────────────────────────────────────┘
         │                   ▲
         │ 获取              │ 归还
         ▼                   │
    ┌─────────┐         ┌─────────┐
    │ 游戏逻辑 │ ──────▶ │ 使用对象 │
    └─────────┘         └─────────┘
```

## 泛型对象池实现

### 基础对象池接口

首先定义可池化对象的接口：

```csharp
/// <summary>
/// 可池化对象接口
/// </summary>
public interface IPoolable
{
    /// <summary>
    /// 从池中获取时调用，用于初始化/重置状态
    /// </summary>
    void OnSpawn();

    /// <summary>
    /// 归还到池中时调用，用于清理状态
    /// </summary>
    void OnDespawn();

    /// <summary>
    /// 对象是否正在被使用
    /// </summary>
    bool IsActive { get; }
}
```

### 泛型对象池实现

```csharp
using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 泛型对象池
/// </summary>
/// <typeparam name="T">池化对象类型，必须实现 IPoolable 接口</typeparam>
public class ObjectPool<T> where T : class, IPoolable
{
    // 可用对象队列
    private readonly Queue<T> _available;

    // 所有对象列表（用于统计和批量操作）
    private readonly List<T> _all;

    // 对象创建工厂方法
    private readonly Func<T> _factory;

    // 池配置
    private readonly int _initialSize;
    private readonly int _maxSize;
    private readonly bool _autoExpand;

    // 统计信息
    public int TotalCount => _all.Count;
    public int AvailableCount => _available.Count;
    public int ActiveCount => TotalCount - AvailableCount;

    /// <summary>
    /// 构造函数
    /// </summary>
    /// <param name="factory">对象创建工厂方法</param>
    /// <param name="initialSize">初始池大小</param>
    /// <param name="maxSize">最大池大小（0 表示无限制）</param>
    /// <param name="autoExpand">是否自动扩展</param>
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
    /// 预热对象池 - 预先创建对象
    /// </summary>
    public void Prewarm()
    {
        Prewarm(_initialSize);
    }

    /// <summary>
    /// 预热指定数量的对象
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
    /// 从池中获取对象
    /// </summary>
    public T Get()
    {
        T obj;

        if (_available.Count > 0)
        {
            // 从可用队列中获取
            obj = _available.Dequeue();
        }
        else if (_autoExpand && CanCreateMore())
        {
            // 自动扩展：创建新对象
            obj = CreateNew();
            Debug.LogWarning($"[ObjectPool] Pool expanded. Total: {TotalCount}");
        }
        else
        {
            // 无法获取对象
            Debug.LogError($"[ObjectPool] Pool exhausted! Max: {_maxSize}");
            return null;
        }

        // 调用激活回调
        obj.OnSpawn();
        return obj;
    }

    /// <summary>
    /// 归还对象到池中
    /// </summary>
    public void Return(T obj)
    {
        if (obj == null)
        {
            Debug.LogWarning("[ObjectPool] Trying to return null object");
            return;
        }

        // 调用回收回调
        obj.OnDespawn();

        // 放回可用队列
        _available.Enqueue(obj);
    }

    /// <summary>
    /// 归还所有活跃对象
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
    /// 清空对象池
    /// </summary>
    public void Clear()
    {
        _available.Clear();
        _all.Clear();
    }

    /// <summary>
    /// 创建新对象
    /// </summary>
    private T CreateNew()
    {
        T obj = _factory();
        _all.Add(obj);
        return obj;
    }

    /// <summary>
    /// 检查是否可以创建更多对象
    /// </summary>
    private bool CanCreateMore()
    {
        return _maxSize <= 0 || TotalCount < _maxSize;
    }
}
```

### Unity MonoBehaviour 对象池

针对 Unity 的 GameObject，需要特殊处理：

```csharp
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Unity GameObject 对象池
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

        // 预热
        Prewarm(initialSize);
    }

    /// <summary>
    /// 预热对象池
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
    /// 获取对象
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

        // 设置位置和旋转
        obj.transform.SetPositionAndRotation(position, rotation);
        obj.SetActive(true);

        // 通知所有 IPoolable 组件
        var poolables = obj.GetComponents<IPoolable>();
        foreach (var poolable in poolables)
        {
            poolable.OnSpawn();
        }

        return obj;
    }

    /// <summary>
    /// 归还对象
    /// </summary>
    public void Return(GameObject obj)
    {
        if (obj == null) return;

        // 通知所有 IPoolable 组件
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
    /// 延迟归还
    /// </summary>
    public void Return(GameObject obj, float delay)
    {
        if (obj == null) return;

        // 使用协程延迟归还
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
/// 延迟归还辅助组件
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

## 预热和自动扩展

### 预热策略

预热（Prewarm）是指在游戏启动或场景加载时预先创建对象，避免运行时的创建开销：

```csharp
/// <summary>
/// 对象池管理器 - 负责管理多个对象池
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
        OnStart,           // 游戏启动时预热
        OnSceneLoad,       // 场景加载时预热
        OnDemand,          // 按需预热
        Gradual            // 分帧渐进预热
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
        // 启动时预热
        foreach (var config in _poolConfigs)
        {
            if (config.prewarmStrategy == PrewarmStrategy.OnStart)
            {
                CreatePool(config);
            }
        }
    }

    /// <summary>
    /// 创建对象池
    /// </summary>
    public void CreatePool(PoolConfig config)
    {
        if (_pools.ContainsKey(config.poolName))
        {
            Debug.LogWarning($"Pool {config.poolName} already exists");
            return;
        }

        // 创建父容器
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
    /// 渐进式预热 - 分散到多帧执行，避免卡顿
    /// </summary>
    public IEnumerator GradualPrewarm(PoolConfig config, int objectsPerFrame = 5)
    {
        if (_pools.ContainsKey(config.poolName)) yield break;

        var parent = new GameObject($"Pool_{config.poolName}");
        parent.transform.SetParent(transform);

        var pool = new GameObjectPool(
            config.prefab,
            parent.transform,
            0,  // 初始不预热
            config.maxSize,
            config.autoExpand
        );

        _pools[config.poolName] = pool;

        // 分帧预热
        int remaining = config.initialSize;
        while (remaining > 0)
        {
            int count = Mathf.Min(remaining, objectsPerFrame);
            pool.Prewarm(count);
            remaining -= count;

            // 等待下一帧
            yield return null;
        }

        Debug.Log($"[PoolManager] Gradual prewarm completed: {config.poolName}");
    }

    /// <summary>
    /// 获取对象
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
    /// 归还对象
    /// </summary>
    public void Return(string poolName, GameObject obj)
    {
        if (_pools.TryGetValue(poolName, out var pool))
        {
            pool.Return(obj);
        }
    }

    /// <summary>
    /// 获取池统计信息
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

### 自动扩展与收缩策略

```csharp
/// <summary>
/// 自适应对象池 - 支持动态扩展和收缩
/// </summary>
public class AdaptivePool<T> where T : class, IPoolable
{
    private readonly Queue<T> _available;
    private readonly List<T> _all;
    private readonly Func<T> _factory;
    private readonly Action<T> _destroyer;

    // 配置
    private int _minSize;
    private int _maxSize;
    private float _shrinkThreshold;      // 收缩阈值（可用比例）
    private float _shrinkDelay;          // 收缩延迟时间
    private int _shrinkAmount;           // 每次收缩数量

    // 状态追踪
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

        // 初始预热到最小大小
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

        // 更新峰值统计
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
    /// 检查并执行收缩（应在 Update 中定期调用）
    /// </summary>
    public void TryShrink()
    {
        float currentTime = Time.time;

        // 检查是否满足收缩条件
        if (currentTime - _lastUseTime < _shrinkDelay) return;
        if (currentTime - _lastShrinkTime < _shrinkDelay) return;

        float availableRatio = (float)_available.Count / _all.Count;
        if (availableRatio < _shrinkThreshold) return;
        if (_all.Count <= _minSize) return;

        // 执行收缩
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
    /// 根据使用模式自适应调整
    /// </summary>
    public void AdaptToUsagePattern()
    {
        // 根据峰值使用量调整最小大小
        if (_peakActiveCount > _minSize * 0.8f)
        {
            _minSize = Mathf.Min(_maxSize, (int)(_peakActiveCount * 1.2f));
            Prewarm(_minSize - _all.Count);
        }

        // 重置统计
        _peakActiveCount = 0;
    }
}
```

## 空间分区优化

### 四叉树（Quadtree）

四叉树是 2D 空间分区的经典数据结构，将空间递归划分为四个象限：

```csharp
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 四叉树节点
/// </summary>
public class QuadTreeNode<T> where T : class
{
    // 边界
    public Rect Bounds { get; private set; }

    // 存储的对象
    private List<QuadTreeItem<T>> _items;

    // 子节点
    private QuadTreeNode<T>[] _children;

    // 配置
    private readonly int _maxItems;
    private readonly int _maxDepth;
    private readonly int _currentDepth;

    // 是否已分裂
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
    /// 插入对象
    /// </summary>
    public bool Insert(T item, Rect itemBounds)
    {
        // 检查是否在当前节点范围内
        if (!Bounds.Overlaps(itemBounds))
        {
            return false;
        }

        // 如果未分裂且未满，直接添加
        if (!_isSplit && _items.Count < _maxItems)
        {
            _items.Add(new QuadTreeItem<T>(item, itemBounds));
            return true;
        }

        // 尝试分裂
        if (!_isSplit && _currentDepth < _maxDepth)
        {
            Split();
        }

        // 如果已分裂，尝试插入子节点
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

        // 无法插入子节点（跨越边界），存储在当前节点
        _items.Add(new QuadTreeItem<T>(item, itemBounds));
        return true;
    }

    /// <summary>
    /// 查询区域内的对象
    /// </summary>
    public void Query(Rect queryBounds, List<T> results)
    {
        // 检查是否有交集
        if (!Bounds.Overlaps(queryBounds))
        {
            return;
        }

        // 添加当前节点的对象
        foreach (var item in _items)
        {
            if (queryBounds.Overlaps(item.Bounds))
            {
                results.Add(item.Item);
            }
        }

        // 递归查询子节点
        if (_isSplit)
        {
            for (int i = 0; i < 4; i++)
            {
                _children[i].Query(queryBounds, results);
            }
        }
    }

    /// <summary>
    /// 查询圆形区域内的对象
    /// </summary>
    public void QueryCircle(Vector2 center, float radius, List<T> results)
    {
        // 快速 AABB 检测
        Rect circleBounds = new Rect(
            center.x - radius, center.y - radius,
            radius * 2, radius * 2
        );

        if (!Bounds.Overlaps(circleBounds))
        {
            return;
        }

        // 精确圆形检测
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
    /// 移除对象
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
    /// 清空四叉树
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
    /// 分裂节点
    /// </summary>
    private void Split()
    {
        float halfWidth = Bounds.width / 2;
        float halfHeight = Bounds.height / 2;
        float x = Bounds.x;
        float y = Bounds.y;

        _children = new QuadTreeNode<T>[4];

        // 左下
        _children[0] = new QuadTreeNode<T>(
            new Rect(x, y, halfWidth, halfHeight),
            _maxItems, _maxDepth, _currentDepth + 1
        );

        // 右下
        _children[1] = new QuadTreeNode<T>(
            new Rect(x + halfWidth, y, halfWidth, halfHeight),
            _maxItems, _maxDepth, _currentDepth + 1
        );

        // 左上
        _children[2] = new QuadTreeNode<T>(
            new Rect(x, y + halfHeight, halfWidth, halfHeight),
            _maxItems, _maxDepth, _currentDepth + 1
        );

        // 右上
        _children[3] = new QuadTreeNode<T>(
            new Rect(x + halfWidth, y + halfHeight, halfWidth, halfHeight),
            _maxItems, _maxDepth, _currentDepth + 1
        );

        _isSplit = true;

        // 重新分配现有对象到子节点
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

            // 跨越边界的对象保留在当前节点
            if (!inserted)
            {
                _items.Add(item);
            }
        }
    }
}

/// <summary>
/// 四叉树项
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
/// 四叉树管理器
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

### 八叉树（Octree）

八叉树是四叉树的 3D 扩展，适用于 3D 空间分区：

```csharp
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 八叉树节点
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
            // 尝试插入到完全包含该对象的子节点
            for (int i = 0; i < 8; i++)
            {
                if (_children[i].Bounds.Contains(itemBounds.center) &&
                    _children[i].Insert(item, itemBounds))
                {
                    return true;
                }
            }
        }

        // 跨越边界，存储在当前节点
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
    /// 球形区域查询
    /// </summary>
    public void QuerySphere(Vector3 center, float radius, List<T> results)
    {
        // 快速 AABB 排除
        Bounds sphereBounds = new Bounds(center, Vector3.one * radius * 2);
        if (!Bounds.Intersects(sphereBounds))
        {
            return;
        }

        float radiusSq = radius * radius;
        foreach (var item in _items)
        {
            // 检查包围盒中心到球心的距离
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
    /// 射线查询
    /// </summary>
    public void QueryRay(Ray ray, float maxDistance, List<T> results)
    {
        // 检查射线是否与当前节点相交
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

        // 重新分配对象
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

### 空间哈希（Spatial Hashing）

对于均匀分布的对象，空间哈希可能比树结构更高效：

```csharp
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 空间哈希 - 适用于均匀分布的对象
/// </summary>
public class SpatialHash<T> where T : class
{
    private readonly Dictionary<int, List<SpatialHashItem<T>>> _cells;
    private readonly float _cellSize;
    private readonly int _gridWidth;
    private readonly int _gridHeight;

    // 对象池 - 复用列表减少 GC
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
    /// 计算网格哈希值
    /// </summary>
    private int GetHash(int x, int y)
    {
        // 使用简单的线性索引
        return x + y * _gridWidth;
    }

    /// <summary>
    /// 世界坐标转网格坐标
    /// </summary>
    private (int x, int y) WorldToGrid(Vector2 position)
    {
        int x = Mathf.FloorToInt(position.x / _cellSize);
        int y = Mathf.FloorToInt(position.y / _cellSize);
        return (x, y);
    }

    /// <summary>
    /// 插入对象
    /// </summary>
    public void Insert(T item, Vector2 position, float radius = 0)
    {
        // 计算对象覆盖的所有格子
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
    /// 查询圆形区域
    /// </summary>
    public void Query(Vector2 center, float radius, List<T> results)
    {
        int minX = Mathf.FloorToInt((center.x - radius) / _cellSize);
        int maxX = Mathf.FloorToInt((center.x + radius) / _cellSize);
        int minY = Mathf.FloorToInt((center.y - radius) / _cellSize);
        int maxY = Mathf.FloorToInt((center.y + radius) / _cellSize);

        // 使用 HashSet 避免重复（对象可能在多个格子中）
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
    /// 清空
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
    /// 获取列表（从池中或新建）
    /// </summary>
    private List<SpatialHashItem<T>> GetList()
    {
        return _listPool.Count > 0
            ? _listPool.Dequeue()
            : new List<SpatialHashItem<T>>();
    }

    /// <summary>
    /// 归还列表到池
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

## 视锥剔除（Frustum Culling）

### 视锥体原理

视锥剔除是一种重要的渲染优化技术，通过判断对象是否在摄像机可视范围内来决定是否渲染：

```csharp
using UnityEngine;

/// <summary>
/// 视锥剔除管理器
/// </summary>
public class FrustumCullingManager : MonoBehaviour
{
    [SerializeField] private Camera _mainCamera;
    [SerializeField] private float _cullDistance = 100f;

    private Plane[] _frustumPlanes;

    // 缓存，避免每帧分配
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
        // 更新视锥体平面
        GeometryUtility.CalculateFrustumPlanes(_mainCamera, _frustumPlanes);
    }

    /// <summary>
    /// 检查点是否在视锥内
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
    /// 检查包围盒是否在视锥内
    /// </summary>
    public bool IsBoundsVisible(Bounds bounds)
    {
        return GeometryUtility.TestPlanesAABB(_frustumPlanes, bounds);
    }

    /// <summary>
    /// 检查球体是否在视锥内
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
    /// 获取视锥内的所有碰撞体
    /// </summary>
    public int GetVisibleColliders(Vector3 center, LayerMask layer, Collider[] results)
    {
        // 先用球形检测获取附近对象
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
/// 可剔除对象组件
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
        // 启用/禁用渲染器
        foreach (var renderer in _renderers)
        {
            renderer.enabled = visible;
        }

        // 启用/禁用行为组件
        foreach (var behaviour in _behaviours)
        {
            behaviour.enabled = visible;
        }
    }
}
```

### LOD（细节层次）结合

视锥剔除常与 LOD 系统结合使用：

```csharp
using UnityEngine;

/// <summary>
/// 自定义 LOD 系统
/// </summary>
public class CustomLOD : MonoBehaviour
{
    [System.Serializable]
    public class LODLevel
    {
        public GameObject model;
        public float screenRelativeHeight;  // 屏幕占比阈值
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

        // 计算包围盒
        var renderers = GetComponentsInChildren<Renderer>();
        if (renderers.Length > 0)
        {
            _bounds = renderers[0].bounds;
            foreach (var r in renderers)
            {
                _bounds.Encapsulate(r.bounds);
            }
        }

        // 初始禁用所有 LOD
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

        // 计算屏幕占比
        float screenHeight = CalculateScreenHeight();

        // 选择 LOD 级别
        int targetLOD = _lodLevels.Length - 1;  // 默认最低级别

        for (int i = 0; i < _lodLevels.Length; i++)
        {
            if (screenHeight >= _lodLevels[i].screenRelativeHeight)
            {
                targetLOD = i;
                break;
            }
        }

        // 切换 LOD
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
    /// 计算对象在屏幕上的相对高度
    /// </summary>
    private float CalculateScreenHeight()
    {
        float distance = Vector3.Distance(_camera.transform.position, transform.position);
        if (distance < 0.001f) return 1f;

        // 使用包围盒高度计算屏幕占比
        float objectHeight = _bounds.size.y;
        float screenHeight = (objectHeight / distance) * (_camera.fieldOfView * Mathf.Deg2Rad);

        return screenHeight;
    }
}
```

## 多线程 Job 系统

### Unity Job System 基础

Unity 的 Job System 允许我们安全地进行多线程计算：

```csharp
using Unity.Jobs;
using Unity.Collections;
using Unity.Burst;
using UnityEngine;

/// <summary>
/// 使用 Job System 进行批量位置更新
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
        // 分配 Native 数组
        _positions = new NativeArray<Vector3>(_objectCount, Allocator.Persistent);
        _velocities = new NativeArray<Vector3>(_objectCount, Allocator.Persistent);

        // 创建对象并初始化
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
        // 创建并调度 Job
        var moveJob = new MoveJob
        {
            Positions = _positions,
            Velocities = _velocities,
            DeltaTime = Time.deltaTime,
            BoundsSize = 50f
        };

        // 调度 Job（使用 Burst 编译器优化）
        JobHandle moveHandle = moveJob.Schedule(_objectCount, 64);

        // 应用位置到 Transform
        var applyJob = new ApplyPositionJob
        {
            Positions = _positions
        };

        JobHandle applyHandle = applyJob.Schedule(_transforms, moveHandle);

        // 确保 Job 完成
        applyHandle.Complete();
    }

    void OnDestroy()
    {
        // 释放 Native 数组
        if (_positions.IsCreated) _positions.Dispose();
        if (_velocities.IsCreated) _velocities.Dispose();
        if (_transforms.isCreated) _transforms.Dispose();
    }

    /// <summary>
    /// 移动计算 Job
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

            // 更新位置
            pos += vel * DeltaTime;

            // 边界反弹
            if (pos.x > BoundsSize || pos.x < -BoundsSize) pos.x = Mathf.Clamp(pos.x, -BoundsSize, BoundsSize);
            if (pos.y > BoundsSize || pos.y < -BoundsSize) pos.y = Mathf.Clamp(pos.y, -BoundsSize, BoundsSize);
            if (pos.z > BoundsSize || pos.z < -BoundsSize) pos.z = Mathf.Clamp(pos.z, -BoundsSize, BoundsSize);

            Positions[index] = pos;
        }
    }

    /// <summary>
    /// 应用位置到 Transform 的 Job
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

### 多线程碰撞检测

```csharp
using Unity.Jobs;
using Unity.Collections;
using Unity.Burst;
using Unity.Mathematics;
using UnityEngine;

/// <summary>
/// 多线程碰撞检测系统
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

        // 初始化位置
        for (int i = 0; i < _entityCount; i++)
        {
            _positions[i] = UnityEngine.Random.insideUnitSphere * 50f;
            _radii[i] = _collisionRadius;
        }
    }

    void Update()
    {
        // 清空空间哈希
        _spatialHash.Clear();

        // 第一步：构建空间哈希
        var buildHashJob = new BuildSpatialHashJob
        {
            Positions = _positions,
            CellSize = CELL_SIZE,
            SpatialHash = _spatialHash.AsParallelWriter()
        };

        JobHandle buildHandle = buildHashJob.Schedule(_entityCount, 64);

        // 第二步：检测碰撞
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

        // 处理碰撞结果
        ProcessCollisions();
    }

    void ProcessCollisions()
    {
        int totalCollisions = 0;
        for (int i = 0; i < _entityCount; i++)
        {
            totalCollisions += _collisionCounts[i];
        }
        // 每对碰撞被计算两次
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
    /// 构建空间哈希 Job
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

            // 简单哈希函数
            return x * 73856093 ^ y * 19349663 ^ z * 83492791;
        }
    }

    /// <summary>
    /// 碰撞检测 Job
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

            // 检查周围 27 个格子
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

## CPU 性能分析

### Unity Profiler 使用

```csharp
using UnityEngine;
using UnityEngine.Profiling;

/// <summary>
/// 性能分析工具类
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
    /// 开始采样
    /// </summary>
    public static void BeginSample(string name)
    {
        Profiler.BeginSample(name);
    }

    /// <summary>
    /// 结束采样
    /// </summary>
    public static void EndSample()
    {
        Profiler.EndSample();
    }

    /// <summary>
    /// 使用作用域采样
    /// </summary>
    public static ProfilerScope ScopedSample(string name)
    {
        return new ProfilerScope(name);
    }
}

/// <summary>
/// 作用域采样器 - 使用 using 语句自动结束采样
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
/// 运行时性能监控
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

            // 更新内存信息
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

        // FPS 信息
        GUILayout.Label($"FPS: {_fps:F1}");
        GUILayout.Label($"Frame Time: {_frameTime:F2} ms");

        // 内存信息
        GUILayout.Label($"Allocated: {_totalAllocatedMemory / 1024 / 1024} MB");
        GUILayout.Label($"Reserved: {_totalReservedMemory / 1024 / 1024} MB");
        GUILayout.Label($"Mono Heap: {_monoHeapSize / 1024 / 1024} MB");
        GUILayout.Label($"Mono Used: {_monoUsedSize / 1024 / 1024} MB");

        GUILayout.EndVertical();
        GUILayout.EndArea();
    }
}
```

### 帧时间分析

```csharp
using System.Collections.Generic;
using System.Diagnostics;
using UnityEngine;
using Debug = UnityEngine.Debug;

/// <summary>
/// 帧时间分析器
/// </summary>
public class FrameTimeAnalyzer : MonoBehaviour
{
    [SerializeField] private int _sampleCount = 300;
    [SerializeField] private float _warningThreshold = 16.67f;  // 60 FPS
    [SerializeField] private float _criticalThreshold = 33.33f;  // 30 FPS

    private Queue<float> _frameTimes;
    private Stopwatch _stopwatch;

    // 统计数据
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

        // 记录帧时间
        if (_frameTimes.Count >= _sampleCount)
        {
            _frameTimes.Dequeue();
        }
        _frameTimes.Enqueue(frameTime);

        // 检测卡顿
        if (frameTime > _criticalThreshold)
        {
            _spikeCount++;
            Debug.LogWarning($"[FrameTime] Critical spike: {frameTime:F2}ms");
        }
        else if (frameTime > _warningThreshold)
        {
            Debug.Log($"[FrameTime] Warning: {frameTime:F2}ms");
        }

        // 更新统计
        UpdateStatistics();

        // 重新开始计时
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

        // 99 百分位
        int index99 = (int)(times.Count * 0.99f);
        _percentile99 = times[index99];
    }

    /// <summary>
    /// 获取性能报告
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

## 内存优化

### 减少 GC 分配

```csharp
using System.Collections.Generic;
using System.Text;
using UnityEngine;

/// <summary>
/// 内存优化最佳实践示例
/// </summary>
public class MemoryOptimizationExamples : MonoBehaviour
{
    // 1. 缓存组件引用
    private Transform _transform;
    private Rigidbody _rigidbody;

    // 2. 预分配集合
    private List<GameObject> _enemies = new List<GameObject>(100);
    private Dictionary<int, string> _nameCache = new Dictionary<int, string>(256);

    // 3. 复用数组
    private Collider[] _overlapResults = new Collider[32];
    private RaycastHit[] _raycastResults = new RaycastHit[16];

    // 4. 字符串构建器复用
    private StringBuilder _stringBuilder = new StringBuilder(256);

    // 5. 委托缓存
    private System.Action<int> _cachedCallback;

    void Start()
    {
        // 缓存组件
        _transform = transform;
        _rigidbody = GetComponent<Rigidbody>();

        // 缓存委托
        _cachedCallback = OnEnemyDeath;
    }

    void Update()
    {
        // 错误示例：每帧分配新数组
        // Collider[] results = Physics.OverlapSphere(transform.position, 10f);

        // 正确示例：使用预分配数组
        int count = Physics.OverlapSphereNonAlloc(_transform.position, 10f, _overlapResults);
        for (int i = 0; i < count; i++)
        {
            ProcessCollider(_overlapResults[i]);
        }
    }

    /// <summary>
    /// 避免字符串拼接产生 GC
    /// </summary>
    public string GetStatusText(int score, float time, int level)
    {
        // 错误示例：每次调用都产生多个临时字符串
        // return "Score: " + score + " Time: " + time + " Level: " + level;

        // 正确示例：使用 StringBuilder
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
    /// 避免在热路径中使用 LINQ
    /// </summary>
    public GameObject FindNearestEnemy(Vector3 position)
    {
        // 错误示例：LINQ 会产生 GC
        // return _enemies
        //     .Where(e => e != null && e.activeInHierarchy)
        //     .OrderBy(e => Vector3.Distance(e.transform.position, position))
        //     .FirstOrDefault();

        // 正确示例：手动循环
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
    /// 避免装箱
    /// </summary>
    public void ProcessValue<T>(T value) where T : struct
    {
        // 错误示例：装箱
        // object boxed = value;
        // Debug.Log(boxed);

        // 正确示例：使用泛型避免装箱
        Debug.Log(value.ToString());
    }

    /// <summary>
    /// 避免闭包捕获
    /// </summary>
    public void RegisterCallbacks()
    {
        int localId = 42;

        // 错误示例：闭包捕获局部变量，产生 GC
        // SomeEvent += () => OnEvent(localId);

        // 正确示例：使用缓存的委托
        // SomeEvent += _cachedCallback;
    }

    private void OnEnemyDeath(int id)
    {
        Debug.Log($"Enemy {id} died");
    }

    private void ProcessCollider(Collider col)
    {
        // 处理碰撞体
    }
}

/// <summary>
/// 对象池化的数据结构
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

### 结构体优化

```csharp
using System.Runtime.InteropServices;
using UnityEngine;

/// <summary>
/// 结构体优化示例
/// </summary>
public class StructOptimizationExamples
{
    // 1. 使用结构体代替小型类（避免堆分配）
    public struct DamageInfo
    {
        public int Damage;
        public int AttackerId;
        public DamageType Type;
        public Vector3 HitPoint;
    }

    public enum DamageType : byte  // 使用最小的枚举基类型
    {
        Physical,
        Magical,
        True
    }

    // 2. 合理安排字段顺序，减少填充
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

    // 错误示例：字段顺序导致填充
    [StructLayout(LayoutKind.Sequential)]
    public struct UnoptimizedStruct
    {
        public byte ByteValue1;     // 1 byte + 7 padding
        public long LongValue;      // 8 bytes
        public byte ByteValue2;     // 1 byte + 3 padding
        public int IntValue;        // 4 bytes
        // Total: 24 bytes with padding
    }

    // 3. 使用 readonly struct 避免防御性复制
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

    // 4. 使用 ref 返回避免复制
    private DamageInfo[] _damageHistory = new DamageInfo[1000];

    public ref DamageInfo GetDamageRef(int index)
    {
        return ref _damageHistory[index];
    }

    // 5. 使用 Span<T> 避免数组复制
    public void ProcessDamages(Span<DamageInfo> damages)
    {
        for (int i = 0; i < damages.Length; i++)
        {
            // 直接修改，无需复制
            damages[i].Damage *= 2;
        }
    }
}
```

## 综合实战案例

### 子弹系统完整实现

```csharp
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 高性能子弹系统
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

    // 对象池
    private GameObjectPool _bulletPool;

    // 活跃子弹列表
    private List<Bullet> _activeBullets;

    // 空间哈希用于碰撞检测
    private SpatialHash<Bullet> _spatialHash;

    // 敌人列表（用于碰撞检测）
    private List<Enemy> _enemies;

    // 复用的结果列表
    private List<Bullet> _queryResults;

    void Start()
    {
        // 初始化对象池
        var poolParent = new GameObject("BulletPool").transform;
        poolParent.SetParent(transform);

        _bulletPool = new GameObjectPool(
            _bulletPrefab,
            poolParent,
            _initialPoolSize,
            _maxPoolSize,
            autoExpand: true
        );

        // 初始化集合
        _activeBullets = new List<Bullet>(_maxPoolSize);
        _spatialHash = new SpatialHash<Bullet>(_worldSize, _worldSize, _cellSize);
        _enemies = new List<Enemy>(100);
        _queryResults = new List<Bullet>(32);
    }

    /// <summary>
    /// 发射子弹
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

        // 重建空间哈希
        _spatialHash.Clear();

        // 更新所有子弹
        for (int i = _activeBullets.Count - 1; i >= 0; i--)
        {
            var bullet = _activeBullets[i];

            // 更新位置
            bullet.UpdatePosition(deltaTime);

            // 检查生命周期
            if (bullet.IsExpired)
            {
                ReturnBullet(bullet, i);
                continue;
            }

            // 添加到空间哈希
            Vector2 pos2D = new Vector2(bullet.Position.x, bullet.Position.z);
            _spatialHash.Insert(bullet, pos2D, bullet.Radius);
        }

        // 执行碰撞检测
        PerformCollisionDetection();
    }

    /// <summary>
    /// 执行碰撞检测
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

                // 精确距离检测
                float dist = Vector3.Distance(bullet.Position, enemy.Position);
                if (dist < bullet.Radius + enemy.Radius)
                {
                    // 碰撞发生
                    bullet.OnHit();
                    enemy.TakeDamage(bullet.Damage);

                    // 移除子弹
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
    /// 归还子弹到池
    /// </summary>
    private void ReturnBullet(Bullet bullet, int index)
    {
        _activeBullets.RemoveAt(index);
        _bulletPool.Return(bullet.gameObject);
    }

    /// <summary>
    /// 注册敌人
    /// </summary>
    public void RegisterEnemy(Enemy enemy)
    {
        _enemies.Add(enemy);
    }

    /// <summary>
    /// 注销敌人
    /// </summary>
    public void UnregisterEnemy(Enemy enemy)
    {
        _enemies.Remove(enemy);
    }
}

/// <summary>
/// 子弹组件
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
/// 敌人接口（简化版）
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
        // 处理死亡逻辑
        gameObject.SetActive(false);
    }
}
```

## 面试要点

### 核心概念题

**Q1: 什么是对象池？为什么要使用对象池？**

A: 对象池是一种设计模式，预先创建一组可重用的对象，避免频繁创建和销毁带来的性能开销。

使用对象池的原因：
1. **减少 GC 压力**：避免频繁的堆内存分配和垃圾回收
2. **降低 CPU 开销**：对象创建和初始化需要 CPU 时间
3. **避免内存碎片**：频繁分配释放会导致堆内存碎片化
4. **稳定帧率**：避免 GC 导致的帧率突然下降

**Q2: 四叉树和八叉树的区别和适用场景？**

A:
- **四叉树**：2D 空间分区，每个节点分为 4 个子节点，适用于 2D 游戏、俯视角游戏、地图分区
- **八叉树**：3D 空间分区，每个节点分为 8 个子节点，适用于 3D 游戏、空间物体管理、射线检测加速

选择依据：
- 游戏是 2D 还是 3D
- 物体分布是否均匀（均匀分布可考虑空间哈希）
- 是否需要动态更新（树结构更新成本较高）

**Q3: 视锥剔除的原理是什么？**

A: 视锥剔除通过判断对象是否在摄像机可视范围（视锥体）内来决定是否渲染：

1. 摄像机视锥体由 6 个平面组成（近、远、上、下、左、右）
2. 对于每个对象，检查其包围盒/球是否与视锥体相交
3. 不在视锥体内的对象跳过渲染

优化策略：
- 结合空间分区快速排除大量对象
- 使用 LOD 系统根据距离调整细节级别
- 使用遮挡剔除排除被遮挡的对象

### 实践题

**Q4: 如何设计一个支持预热和自动扩展的对象池？**

A: 关键设计要点：

```csharp
// 1. 预热：在游戏加载时创建对象
public void Prewarm(int count)
{
    for (int i = 0; i < count; i++)
    {
        var obj = CreateNew();
        _available.Enqueue(obj);
    }
}

// 2. 自动扩展：池耗尽时动态创建
public T Get()
{
    if (_available.Count > 0)
        return _available.Dequeue();

    if (_autoExpand && _all.Count < _maxSize)
        return CreateNew();

    return null;  // 或使用 LRU 策略回收最旧对象
}

// 3. 分帧预热：避免加载时卡顿
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

**Q5: 如何减少游戏中的 GC？**

A:
1. **对象池化**：复用频繁创建销毁的对象
2. **预分配集合**：使用带初始容量的 List、Dictionary
3. **避免装箱**：使用泛型，避免值类型到 object 的转换
4. **复用数组**：使用 NonAlloc 版本的 Physics API
5. **避免闭包**：缓存委托，避免捕获局部变量
6. **字符串优化**：使用 StringBuilder，缓存常用字符串
7. **避免 LINQ**：在热路径中使用手动循环
8. **使用结构体**：小型数据使用 struct 代替 class

**Q6: Unity Job System 的优势和注意事项？**

A:
优势：
1. **多线程安全**：编译时检查数据竞争
2. **Burst 编译**：SIMD 优化，接近原生代码性能
3. **与 ECS 集成**：充分利用 Unity DOTS 架构

注意事项：
1. NativeArray 等必须手动释放（Dispose）
2. Job 中不能直接访问 Unity API
3. 主线程需等待 Job 完成才能读取结果
4. 数据必须是 blittable 类型

## 总结

游戏性能优化是一个系统性工程，需要从多个层面综合考虑：

1. **内存管理**：使用对象池减少 GC，合理使用结构体和值类型
2. **空间优化**：选择合适的空间分区结构，加速碰撞检测和范围查询
3. **渲染优化**：视锥剔除、LOD、遮挡剔除减少渲染负载
4. **多线程**：利用 Job System 并行处理计算密集型任务
5. **性能分析**：使用 Profiler 定位瓶颈，针对性优化

记住：过早优化是万恶之源。先用 Profiler 找到真正的性能瓶颈，再进行有针对性的优化。同时要在代码可读性和性能之间找到平衡，不要为了微小的性能提升而大幅增加代码复杂度。
