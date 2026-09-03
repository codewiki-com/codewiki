---
title: Unity 游戏开发基础
description: 全面掌握Unity引擎核心概念：GameObject、Component、生命周期和资源管理
track: gamedev
section: unity
difficulty: beginner
tags:
  - Unity
  - 游戏引擎
  - C#
  - 入门
status: imported
origin: old/src/content/docs/gamedev/unity-fundamentals.zh.md
divergence: 0.174
issues: []
legacy:
  category: GameDev
  subcategory: Unity
  order: 5
  lastUpdated: 2026-01-07
---

Unity 是全球最流行的游戏引擎之一，被广泛应用于手机游戏、PC 游戏、主机游戏、VR/AR 应用等领域。本文将深入探讨 Unity 的核心概念，帮助你建立扎实的 Unity 开发基础。

## 概念解释：Unity 引擎概述

### 什么是 Unity

Unity 是一个跨平台的游戏开发引擎，提供了完整的游戏开发工具链：

- **渲染引擎**：支持 2D 和 3D 图形渲染
- **物理引擎**：内置 PhysX（3D）和 Box2D（2D）物理模拟
- **音频系统**：支持 3D 空间音效
- **动画系统**：Animator 和 Animation 组件
- **UI 系统**：uGUI 和 UI Toolkit
- **脚本系统**：使用 C# 编写游戏逻辑

### Unity 的核心设计理念

Unity 采用 **组件化架构**，这是理解 Unity 开发的关键：

```
场景 (Scene)
└── 游戏对象 (GameObject)
    ├── Transform（必有组件）
    ├── MeshRenderer
    ├── Rigidbody
    └── 自定义脚本组件
```

每个 GameObject 都是一个容器，通过添加不同的组件（Component）来定义其行为和外观。

## Unity 编辑器

### 核心窗口布局

Unity 编辑器由多个窗口组成，了解它们是高效开发的基础：

```
┌─────────────────────────────────────────────────────────────┐
│  Scene View     │  Game View    │                           │
│  （场景编辑）    │  （游戏预览）  │      Inspector            │
│                 │               │      （检视器）            │
├─────────────────┴───────────────┤                           │
│                                 │      显示选中对象的        │
│         Hierarchy               │      所有组件和属性        │
│         （层级面板）             │                           │
│                                 │                           │
├─────────────────────────────────┼───────────────────────────┤
│              Project            │       Console             │
│              （项目资源）        │       （控制台）           │
└─────────────────────────────────┴───────────────────────────┘
```

**各窗口功能**：

- **Scene View**：可视化编辑场景，移动、旋转、缩放对象
- **Game View**：预览玩家视角，测试游戏效果
- **Hierarchy**：显示当前场景中所有 GameObject 的树形结构
- **Inspector**：查看和编辑选中对象的组件属性
- **Project**：管理项目中的所有资源文件
- **Console**：显示日志、警告和错误信息

### 常用快捷键

```csharp
// 编辑器操作
// W - 移动工具
// E - 旋转工具
// R - 缩放工具
// T - Rect 工具（2D）
// Q - 视图平移工具

// 场景导航
// Alt + 左键拖动 - 围绕焦点旋转视图
// Alt + 右键拖动 - 缩放视图
// 鼠标中键拖动 - 平移视图
// F - 聚焦选中对象
// 双击 Hierarchy 中的对象 - 聚焦该对象

// 常用操作
// Ctrl/Cmd + S - 保存场景
// Ctrl/Cmd + D - 复制对象
// Ctrl/Cmd + Z - 撤销
// Delete - 删除对象
// Ctrl/Cmd + P - 播放/停止游戏
```

## GameObject 与 Component 模型

### GameObject 基础

GameObject 是 Unity 中所有实体的基类，它本身只是一个容器：

```csharp
using UnityEngine;

public class GameObjectBasics : MonoBehaviour
{
    void Start()
    {
        // 创建空的 GameObject
        GameObject emptyObject = new GameObject("MyObject");

        // 创建带有基本组件的对象
        GameObject cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
        cube.name = "MyCube";

        // 查找 GameObject
        GameObject player = GameObject.Find("Player");
        GameObject enemy = GameObject.FindWithTag("Enemy");
        GameObject[] allEnemies = GameObject.FindGameObjectsWithTag("Enemy");

        // 获取/设置 GameObject 属性
        gameObject.name = "NewName";
        gameObject.tag = "Player";
        gameObject.layer = LayerMask.NameToLayer("Default");

        // 激活/禁用 GameObject
        gameObject.SetActive(false); // 禁用对象及其所有子对象
        bool isActive = gameObject.activeSelf; // 自身激活状态
        bool isActiveInHierarchy = gameObject.activeInHierarchy; // 实际激活状态

        // 销毁 GameObject
        Destroy(cube); // 在当前帧结束时销毁
        Destroy(cube, 2f); // 2 秒后销毁
        DestroyImmediate(cube); // 立即销毁（慎用，仅编辑器模式推荐）
    }
}
```

### Transform 组件

Transform 是每个 GameObject 必有的组件，用于控制位置、旋转和缩放：

```csharp
using UnityEngine;

public class TransformBasics : MonoBehaviour
{
    public Transform target;

    void Update()
    {
        // 位置操作
        transform.position = new Vector3(0, 1, 0); // 世界坐标
        transform.localPosition = new Vector3(0, 1, 0); // 相对父对象的本地坐标

        // 移动
        transform.Translate(Vector3.forward * Time.deltaTime); // 本地坐标系移动
        transform.Translate(Vector3.forward * Time.deltaTime, Space.World); // 世界坐标系移动

        // 旋转操作
        transform.rotation = Quaternion.identity; // 世界旋转
        transform.localRotation = Quaternion.Euler(0, 90, 0); // 本地旋转
        transform.eulerAngles = new Vector3(0, 90, 0); // 欧拉角形式

        // 旋转方法
        transform.Rotate(Vector3.up * 90 * Time.deltaTime); // 自身旋转
        transform.RotateAround(target.position, Vector3.up, 30 * Time.deltaTime); // 绕点旋转

        // 朝向
        transform.LookAt(target); // 看向目标
        transform.forward = (target.position - transform.position).normalized; // 设置前方向

        // 缩放
        transform.localScale = new Vector3(2, 2, 2);

        // 父子关系
        transform.SetParent(target); // 设置父对象
        transform.SetParent(target, true); // 保持世界坐标不变
        Transform child = transform.GetChild(0); // 获取子对象
        int childCount = transform.childCount;

        // 遍历所有子对象
        foreach (Transform child in transform)
        {
            Debug.Log(child.name);
        }

        // 坐标转换
        Vector3 worldPos = transform.TransformPoint(Vector3.zero); // 本地转世界
        Vector3 localPos = transform.InverseTransformPoint(worldPos); // 世界转本地
        Vector3 worldDir = transform.TransformDirection(Vector3.forward); // 方向转换
    }
}
```

### Component 操作

组件是定义 GameObject 行为的核心：

```csharp
using UnityEngine;

public class ComponentOperations : MonoBehaviour
{
    void Start()
    {
        // 获取组件
        Rigidbody rb = GetComponent<Rigidbody>();

        // 安全获取（可能为空）
        if (TryGetComponent<Collider>(out Collider col))
        {
            col.enabled = true;
        }

        // 获取子对象上的组件
        Renderer childRenderer = GetComponentInChildren<Renderer>();
        Renderer[] allRenderers = GetComponentsInChildren<Renderer>();

        // 获取父对象上的组件
        Canvas parentCanvas = GetComponentInParent<Canvas>();

        // 添加组件
        Rigidbody newRb = gameObject.AddComponent<Rigidbody>();
        newRb.mass = 2f;
        newRb.useGravity = true;

        // 移除组件
        Destroy(GetComponent<BoxCollider>());

        // 启用/禁用组件
        Renderer renderer = GetComponent<Renderer>();
        renderer.enabled = false; // 禁用渲染

        // 获取所有指定类型的组件
        MonoBehaviour[] allScripts = FindObjectsOfType<MonoBehaviour>();
    }
}
```

## MonoBehaviour 生命周期

理解 MonoBehaviour 的生命周期是编写正确游戏逻辑的关键：

### 生命周期方法概览

```
                    ┌─────────────────┐
                    │     Awake()     │  最先调用，对象实例化时
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   OnEnable()    │  对象启用时
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │     Start()     │  第一帧 Update 前调用
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────▼─────────┐ ┌──────▼──────┐ ┌─────────▼─────────┐
│ FixedUpdate()     │ │  Update()   │ │  LateUpdate()     │
│ 固定时间间隔调用   │ │  每帧调用   │ │  Update之后调用   │
│ 用于物理计算       │ │  主要逻辑   │ │  用于相机跟随等   │
└───────────────────┘ └─────────────┘ └───────────────────┘
                             │
                    ┌────────▼────────┐
                    │  OnDisable()    │  对象禁用时
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  OnDestroy()    │  对象销毁时
                    └─────────────────┘
```

### 生命周期方法详解

```csharp
using UnityEngine;

public class LifecycleDemo : MonoBehaviour
{
    // ============= 初始化阶段 =============

    /// <summary>
    /// 最先调用，在对象实例化时调用
    /// 用于初始化引用和不依赖其他对象的设置
    /// 即使脚本被禁用也会调用
    /// </summary>
    void Awake()
    {
        Debug.Log("Awake: 初始化内部引用");
        // 适合：获取自身组件引用、初始化数据结构
        // 不适合：访问其他 GameObject（可能还未初始化）
    }

    /// <summary>
    /// 对象启用时调用
    /// 每次 SetActive(true) 或启用脚本时都会调用
    /// </summary>
    void OnEnable()
    {
        Debug.Log("OnEnable: 对象已启用");
        // 适合：注册事件、订阅消息
    }

    /// <summary>
    /// 第一次 Update 之前调用，仅调用一次
    /// 所有对象的 Awake 都执行完毕后才执行 Start
    /// </summary>
    void Start()
    {
        Debug.Log("Start: 开始游戏逻辑");
        // 适合：访问其他 GameObject、初始化依赖外部的设置
    }

    // ============= 更新阶段 =============

    /// <summary>
    /// 固定时间间隔调用（默认 0.02 秒，即 50 FPS）
    /// 不受帧率影响，用于物理相关计算
    /// </summary>
    void FixedUpdate()
    {
        // 适合：物理运算、Rigidbody 操作
        // Time.fixedDeltaTime 获取固定时间间隔
    }

    /// <summary>
    /// 每帧调用一次
    /// 调用频率取决于帧率
    /// </summary>
    void Update()
    {
        // 适合：输入检测、非物理移动、游戏逻辑
        // 使用 Time.deltaTime 确保帧率无关
        float speed = 5f;
        transform.Translate(Vector3.forward * speed * Time.deltaTime);
    }

    /// <summary>
    /// 在所有 Update 执行完毕后调用
    /// </summary>
    void LateUpdate()
    {
        // 适合：相机跟随、在所有对象移动后调整位置
    }

    // ============= 销毁阶段 =============

    /// <summary>
    /// 对象禁用时调用
    /// SetActive(false) 或禁用脚本时调用
    /// </summary>
    void OnDisable()
    {
        Debug.Log("OnDisable: 对象已禁用");
        // 适合：取消事件注册、清理临时状态
    }

    /// <summary>
    /// 对象销毁时调用
    /// 场景卸载或调用 Destroy() 时触发
    /// </summary>
    void OnDestroy()
    {
        Debug.Log("OnDestroy: 对象被销毁");
        // 适合：释放资源、保存数据
    }

    // ============= 其他重要回调 =============

    /// <summary>
    /// 应用程序暂停/恢复时调用（如切换到后台）
    /// </summary>
    void OnApplicationPause(bool pauseStatus)
    {
        if (pauseStatus)
        {
            Debug.Log("游戏暂停");
            // 保存游戏状态
        }
        else
        {
            Debug.Log("游戏恢复");
        }
    }

    /// <summary>
    /// 应用程序退出前调用
    /// </summary>
    void OnApplicationQuit()
    {
        Debug.Log("应用程序退出");
        // 保存数据、清理资源
    }
}
```

### 物理相关回调

```csharp
using UnityEngine;

public class PhysicsCallbacks : MonoBehaviour
{
    // ============= 3D 碰撞检测 =============

    /// <summary>
    /// 碰撞开始时调用（需要 Collider 组件，至少一方有 Rigidbody）
    /// </summary>
    void OnCollisionEnter(Collision collision)
    {
        Debug.Log($"碰撞开始: {collision.gameObject.name}");

        // 获取碰撞信息
        ContactPoint contact = collision.contacts[0];
        Vector3 hitPoint = contact.point;
        Vector3 hitNormal = contact.normal;
        float impactForce = collision.relativeVelocity.magnitude;
    }

    /// <summary>
    /// 碰撞持续期间每帧调用
    /// </summary>
    void OnCollisionStay(Collision collision)
    {
        // 持续碰撞中
    }

    /// <summary>
    /// 碰撞结束时调用
    /// </summary>
    void OnCollisionExit(Collision collision)
    {
        Debug.Log($"碰撞结束: {collision.gameObject.name}");
    }

    // ============= 3D 触发器检测 =============

    /// <summary>
    /// 进入触发器时调用（Collider 的 isTrigger = true）
    /// </summary>
    void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Player"))
        {
            Debug.Log("玩家进入触发区域");
        }
    }

    void OnTriggerStay(Collider other)
    {
        // 在触发器内部
    }

    void OnTriggerExit(Collider other)
    {
        Debug.Log($"{other.name} 离开触发区域");
    }

    // ============= 2D 碰撞检测 =============

    void OnCollisionEnter2D(Collision2D collision)
    {
        // 2D 碰撞开始
    }

    void OnTriggerEnter2D(Collider2D other)
    {
        // 2D 触发器进入
    }
}
```

## 预制体 Prefab

Prefab（预制体）是 Unity 中实现对象复用和管理的核心机制：

### Prefab 基础概念

```
Prefab 资源文件 (.prefab)
    │
    ├── 实例1 (场景A)
    │   └── Override（可覆盖部分属性）
    │
    ├── 实例2 (场景A)
    │   └── Override
    │
    └── 实例3 (场景B)
        └── Override

修改 Prefab 资源 → 所有实例自动更新
修改实例 Override → 仅影响该实例
```

### Prefab 操作

```csharp
using UnityEngine;

public class PrefabOperations : MonoBehaviour
{
    // 在 Inspector 中拖拽赋值 Prefab
    public GameObject enemyPrefab;
    public GameObject bulletPrefab;

    void Start()
    {
        // 实例化 Prefab
        GameObject enemy = Instantiate(enemyPrefab);

        // 指定位置和旋转实例化
        Vector3 spawnPosition = new Vector3(0, 0, 10);
        Quaternion spawnRotation = Quaternion.identity;
        GameObject enemy2 = Instantiate(enemyPrefab, spawnPosition, spawnRotation);

        // 指定父对象实例化
        Transform parentTransform = transform;
        GameObject enemy3 = Instantiate(enemyPrefab, spawnPosition, spawnRotation, parentTransform);

        // 泛型实例化（保持组件类型）
        Enemy enemyScript = Instantiate(enemyPrefab).GetComponent<Enemy>();
    }

    // 对象池模式示例
    public void SpawnBullet(Vector3 position, Vector3 direction)
    {
        GameObject bullet = Instantiate(bulletPrefab, position, Quaternion.LookRotation(direction));

        // 设置子弹属性
        Rigidbody rb = bullet.GetComponent<Rigidbody>();
        rb.velocity = direction * 20f;

        // 3 秒后销毁
        Destroy(bullet, 3f);
    }
}
```

### 对象池模式

频繁创建和销毁对象会导致性能问题，对象池是解决方案：

```csharp
using UnityEngine;
using System.Collections.Generic;

public class ObjectPool : MonoBehaviour
{
    public static ObjectPool Instance { get; private set; }

    [System.Serializable]
    public class Pool
    {
        public string tag;
        public GameObject prefab;
        public int initialSize;
    }

    public List<Pool> pools;
    private Dictionary<string, Queue<GameObject>> poolDictionary;

    void Awake()
    {
        Instance = this;
        poolDictionary = new Dictionary<string, Queue<GameObject>>();

        // 初始化对象池
        foreach (Pool pool in pools)
        {
            Queue<GameObject> objectPool = new Queue<GameObject>();

            for (int i = 0; i < pool.initialSize; i++)
            {
                GameObject obj = Instantiate(pool.prefab);
                obj.SetActive(false);
                obj.transform.SetParent(transform);
                objectPool.Enqueue(obj);
            }

            poolDictionary.Add(pool.tag, objectPool);
        }
    }

    /// <summary>
    /// 从对象池获取对象
    /// </summary>
    public GameObject SpawnFromPool(string tag, Vector3 position, Quaternion rotation)
    {
        if (!poolDictionary.ContainsKey(tag))
        {
            Debug.LogWarning($"对象池中不存在标签为 {tag} 的池");
            return null;
        }

        Queue<GameObject> pool = poolDictionary[tag];
        GameObject objectToSpawn;

        if (pool.Count > 0)
        {
            objectToSpawn = pool.Dequeue();
        }
        else
        {
            // 池中没有可用对象，创建新的
            Pool poolInfo = pools.Find(p => p.tag == tag);
            objectToSpawn = Instantiate(poolInfo.prefab);
            objectToSpawn.transform.SetParent(transform);
        }

        objectToSpawn.SetActive(true);
        objectToSpawn.transform.position = position;
        objectToSpawn.transform.rotation = rotation;

        // 调用初始化接口
        IPooledObject pooledObj = objectToSpawn.GetComponent<IPooledObject>();
        pooledObj?.OnObjectSpawn();

        return objectToSpawn;
    }

    /// <summary>
    /// 将对象返回对象池
    /// </summary>
    public void ReturnToPool(string tag, GameObject obj)
    {
        obj.SetActive(false);
        poolDictionary[tag].Enqueue(obj);
    }
}

/// <summary>
/// 可池化对象接口
/// </summary>
public interface IPooledObject
{
    void OnObjectSpawn();
}

// 使用示例
public class Bullet : MonoBehaviour, IPooledObject
{
    public float lifetime = 3f;
    private float timer;

    public void OnObjectSpawn()
    {
        timer = lifetime;
    }

    void Update()
    {
        timer -= Time.deltaTime;
        if (timer <= 0)
        {
            ObjectPool.Instance.ReturnToPool("Bullet", gameObject);
        }
    }
}
```

## 场景管理

### 场景基本操作

```csharp
using UnityEngine;
using UnityEngine.SceneManagement;

public class SceneManagement : MonoBehaviour
{
    void Start()
    {
        // 获取当前场景信息
        Scene currentScene = SceneManager.GetActiveScene();
        Debug.Log($"当前场景: {currentScene.name}");
        Debug.Log($"场景索引: {currentScene.buildIndex}");
        Debug.Log($"场景路径: {currentScene.path}");

        // 获取场景中的根对象
        GameObject[] rootObjects = currentScene.GetRootGameObjects();
    }

    /// <summary>
    /// 同步加载场景（会造成卡顿）
    /// </summary>
    public void LoadSceneSync(string sceneName)
    {
        // 单一模式：卸载当前场景，加载新场景
        SceneManager.LoadScene(sceneName);

        // 通过索引加载
        SceneManager.LoadScene(1);

        // 叠加模式：保留当前场景，加载新场景
        SceneManager.LoadScene(sceneName, LoadSceneMode.Additive);
    }

    /// <summary>
    /// 重新加载当前场景
    /// </summary>
    public void ReloadCurrentScene()
    {
        Scene currentScene = SceneManager.GetActiveScene();
        SceneManager.LoadScene(currentScene.name);
    }
}
```

### 异步场景加载

```csharp
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using System.Collections;

public class AsyncSceneLoader : MonoBehaviour
{
    public Slider progressBar;
    public Text progressText;
    public GameObject loadingScreen;

    private AsyncOperation asyncOperation;

    /// <summary>
    /// 异步加载场景（推荐方式）
    /// </summary>
    public void LoadSceneAsync(string sceneName)
    {
        StartCoroutine(LoadSceneCoroutine(sceneName));
    }

    private IEnumerator LoadSceneCoroutine(string sceneName)
    {
        // 显示加载界面
        loadingScreen.SetActive(true);

        // 开始异步加载
        asyncOperation = SceneManager.LoadSceneAsync(sceneName);

        // 阻止场景自动激活
        asyncOperation.allowSceneActivation = false;

        while (!asyncOperation.isDone)
        {
            // 加载进度 0-0.9 表示加载中
            // 0.9 表示加载完成，等待激活
            float progress = Mathf.Clamp01(asyncOperation.progress / 0.9f);

            // 更新 UI
            if (progressBar != null)
                progressBar.value = progress;
            if (progressText != null)
                progressText.text = $"加载中... {progress * 100:F0}%";

            // 加载完成后激活场景
            if (asyncOperation.progress >= 0.9f)
            {
                progressText.text = "按任意键继续";

                if (Input.anyKeyDown)
                {
                    asyncOperation.allowSceneActivation = true;
                }
            }

            yield return null;
        }
    }

    /// <summary>
    /// 异步卸载场景
    /// </summary>
    public void UnloadSceneAsync(string sceneName)
    {
        StartCoroutine(UnloadSceneCoroutine(sceneName));
    }

    private IEnumerator UnloadSceneCoroutine(string sceneName)
    {
        AsyncOperation unloadOperation = SceneManager.UnloadSceneAsync(sceneName);

        while (!unloadOperation.isDone)
        {
            yield return null;
        }

        // 卸载未使用的资源
        Resources.UnloadUnusedAssets();
        Debug.Log($"场景 {sceneName} 已卸载");
    }
}
```

### 场景事件监听

```csharp
using UnityEngine;
using UnityEngine.SceneManagement;

public class SceneEventHandler : MonoBehaviour
{
    void OnEnable()
    {
        // 注册场景事件
        SceneManager.sceneLoaded += OnSceneLoaded;
        SceneManager.sceneUnloaded += OnSceneUnloaded;
        SceneManager.activeSceneChanged += OnActiveSceneChanged;
    }

    void OnDisable()
    {
        // 取消注册
        SceneManager.sceneLoaded -= OnSceneLoaded;
        SceneManager.sceneUnloaded -= OnSceneUnloaded;
        SceneManager.activeSceneChanged -= OnActiveSceneChanged;
    }

    private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        Debug.Log($"场景已加载: {scene.name}, 模式: {mode}");
    }

    private void OnSceneUnloaded(Scene scene)
    {
        Debug.Log($"场景已卸载: {scene.name}");
    }

    private void OnActiveSceneChanged(Scene oldScene, Scene newScene)
    {
        Debug.Log($"活动场景切换: {oldScene.name} -> {newScene.name}");
    }
}
```

### 跨场景数据保持

```csharp
using UnityEngine;

/// <summary>
/// 使用 DontDestroyOnLoad 保持对象跨场景存在
/// </summary>
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    // 需要跨场景保持的数据
    public int playerScore;
    public int playerLevel;
    public string playerName;

    void Awake()
    {
        // 单例模式
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject); // 切换场景时不销毁
        }
        else
        {
            Destroy(gameObject); // 已存在实例则销毁自己
        }
    }

    public void AddScore(int points)
    {
        playerScore += points;
    }

    public void ResetGame()
    {
        playerScore = 0;
        playerLevel = 1;
    }
}

/// <summary>
/// 使用 ScriptableObject 存储跨场景数据
/// </summary>
[CreateAssetMenu(fileName = "GameData", menuName = "Game/GameData")]
public class GameData : ScriptableObject
{
    public int highScore;
    public int totalCoins;
    public bool[] unlockedLevels;

    public void UnlockLevel(int levelIndex)
    {
        if (levelIndex >= 0 && levelIndex < unlockedLevels.Length)
        {
            unlockedLevels[levelIndex] = true;
        }
    }
}
```

## 资源加载

### Resources 文件夹加载

Resources 是 Unity 内置的资源加载方式，简单但有局限性：

```csharp
using UnityEngine;

public class ResourcesLoading : MonoBehaviour
{
    void Start()
    {
        // 同步加载资源
        // 资源必须放在 Assets/Resources 文件夹下
        GameObject prefab = Resources.Load<GameObject>("Prefabs/Enemy");
        Texture2D texture = Resources.Load<Texture2D>("Textures/Icon");
        AudioClip sound = Resources.Load<AudioClip>("Audio/BGM");
        TextAsset jsonFile = Resources.Load<TextAsset>("Data/Config");

        // 实例化加载的 Prefab
        if (prefab != null)
        {
            Instantiate(prefab);
        }

        // 加载所有指定类型的资源
        Sprite[] allSprites = Resources.LoadAll<Sprite>("Sprites/UI");

        // 异步加载
        StartCoroutine(LoadResourceAsync());
    }

    private System.Collections.IEnumerator LoadResourceAsync()
    {
        ResourceRequest request = Resources.LoadAsync<GameObject>("Prefabs/LargeAsset");

        while (!request.isDone)
        {
            Debug.Log($"加载进度: {request.progress * 100}%");
            yield return null;
        }

        GameObject asset = request.asset as GameObject;
        if (asset != null)
        {
            Instantiate(asset);
        }
    }

    void OnDestroy()
    {
        // 卸载未使用的资源
        Resources.UnloadUnusedAssets();
    }
}
```

**Resources 的局限性**：

- 所有 Resources 文件夹中的资源都会被打包，增加包体大小
- 无法实现增量更新
- 加载效率较低
- 不支持异步批量加载

### Addressables 系统

Addressables 是 Unity 推荐的现代资源管理系统：

```csharp
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class AddressablesLoading : MonoBehaviour
{
    // 直接引用 Addressable 资源
    public AssetReference enemyPrefabReference;
    public AssetReferenceGameObject playerPrefabReference;
    public AssetReferenceSprite iconReference;

    private AsyncOperationHandle<GameObject> loadHandle;

    void Start()
    {
        // 通过地址字符串加载
        LoadByAddress();

        // 通过 AssetReference 加载
        LoadByReference();
    }

    /// <summary>
    /// 通过地址加载资源
    /// </summary>
    private async void LoadByAddress()
    {
        // 加载单个资源
        AsyncOperationHandle<GameObject> handle =
            Addressables.LoadAssetAsync<GameObject>("Prefabs/Enemy");

        await handle.Task;

        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            GameObject prefab = handle.Result;
            Instantiate(prefab);
        }
        else
        {
            Debug.LogError("资源加载失败");
        }

        // 保存句柄用于后续释放
        loadHandle = handle;
    }

    /// <summary>
    /// 通过 AssetReference 加载
    /// </summary>
    private void LoadByReference()
    {
        // 实例化 Prefab
        enemyPrefabReference.InstantiateAsync().Completed += (handle) =>
        {
            if (handle.Status == AsyncOperationStatus.Succeeded)
            {
                GameObject instance = handle.Result;
                Debug.Log($"实例化成功: {instance.name}");
            }
        };

        // 加载 Sprite
        iconReference.LoadAssetAsync<Sprite>().Completed += (handle) =>
        {
            if (handle.Status == AsyncOperationStatus.Succeeded)
            {
                Sprite sprite = handle.Result;
                // 使用 sprite
            }
        };
    }

    /// <summary>
    /// 加载标签下的所有资源
    /// </summary>
    private async void LoadByLabel()
    {
        AsyncOperationHandle<System.Collections.Generic.IList<GameObject>> handle =
            Addressables.LoadAssetsAsync<GameObject>(
                "enemies", // 标签名
                (loadedAsset) =>
                {
                    // 每个资源加载完成时的回调
                    Debug.Log($"加载完成: {loadedAsset.name}");
                }
            );

        await handle.Task;

        foreach (GameObject prefab in handle.Result)
        {
            // 处理加载的资源
        }
    }

    /// <summary>
    /// 加载场景
    /// </summary>
    private void LoadAddressableScene()
    {
        Addressables.LoadSceneAsync("GameScene").Completed += (handle) =>
        {
            if (handle.Status == AsyncOperationStatus.Succeeded)
            {
                Debug.Log("场景加载完成");
            }
        };
    }

    void OnDestroy()
    {
        // 释放资源（重要！）
        if (loadHandle.IsValid())
        {
            Addressables.Release(loadHandle);
        }

        // 释放 AssetReference
        enemyPrefabReference.ReleaseAsset();
        iconReference.ReleaseAsset();
    }
}
```

### 资源管理最佳实践

```csharp
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;
using System.Collections.Generic;

/// <summary>
/// 资源管理器示例
/// </summary>
public class AssetManager : MonoBehaviour
{
    public static AssetManager Instance { get; private set; }

    // 缓存已加载的资源句柄
    private Dictionary<string, AsyncOperationHandle> loadedAssets =
        new Dictionary<string, AsyncOperationHandle>();

    void Awake()
    {
        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    /// <summary>
    /// 加载资源（带缓存）
    /// </summary>
    public async void LoadAsset<T>(string address, System.Action<T> onComplete) where T : Object
    {
        // 检查缓存
        if (loadedAssets.TryGetValue(address, out AsyncOperationHandle cachedHandle))
        {
            if (cachedHandle.IsDone && cachedHandle.Status == AsyncOperationStatus.Succeeded)
            {
                onComplete?.Invoke(cachedHandle.Result as T);
                return;
            }
        }

        // 加载资源
        AsyncOperationHandle<T> handle = Addressables.LoadAssetAsync<T>(address);
        loadedAssets[address] = handle;

        await handle.Task;

        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            onComplete?.Invoke(handle.Result);
        }
        else
        {
            Debug.LogError($"加载资源失败: {address}");
            onComplete?.Invoke(null);
        }
    }

    /// <summary>
    /// 预加载资源
    /// </summary>
    public async void PreloadAssets(string[] addresses, System.Action onComplete)
    {
        List<AsyncOperationHandle> handles = new List<AsyncOperationHandle>();

        foreach (string address in addresses)
        {
            var handle = Addressables.LoadAssetAsync<Object>(address);
            loadedAssets[address] = handle;
            handles.Add(handle);
        }

        // 等待所有资源加载完成
        foreach (var handle in handles)
        {
            await handle.Task;
        }

        onComplete?.Invoke();
    }

    /// <summary>
    /// 释放指定资源
    /// </summary>
    public void ReleaseAsset(string address)
    {
        if (loadedAssets.TryGetValue(address, out AsyncOperationHandle handle))
        {
            if (handle.IsValid())
            {
                Addressables.Release(handle);
            }
            loadedAssets.Remove(address);
        }
    }

    /// <summary>
    /// 释放所有资源
    /// </summary>
    public void ReleaseAllAssets()
    {
        foreach (var handle in loadedAssets.Values)
        {
            if (handle.IsValid())
            {
                Addressables.Release(handle);
            }
        }
        loadedAssets.Clear();
    }

    void OnDestroy()
    {
        ReleaseAllAssets();
    }
}
```

## 协程 Coroutine

协程是 Unity 中实现异步操作的重要机制：

### 协程基础

```csharp
using UnityEngine;
using System.Collections;

public class CoroutineBasics : MonoBehaviour
{
    private Coroutine myCoroutine;

    void Start()
    {
        // 启动协程的方式
        StartCoroutine(SimpleCoroutine());
        StartCoroutine("SimpleCoroutineByName");
        myCoroutine = StartCoroutine(CoroutineWithParameter(5));
    }

    /// <summary>
    /// 基本协程
    /// </summary>
    IEnumerator SimpleCoroutine()
    {
        Debug.Log("协程开始");

        // 等待一帧
        yield return null;

        // 等待指定秒数
        yield return new WaitForSeconds(1f);
        Debug.Log("1秒后");

        // 等待不受时间缩放影响
        yield return new WaitForSecondsRealtime(1f);

        // 等待直到条件为真
        yield return new WaitUntil(() => Input.GetKeyDown(KeyCode.Space));
        Debug.Log("空格键被按下");

        // 等待直到条件为假
        yield return new WaitWhile(() => transform.position.y > 0);

        // 等待 FixedUpdate 执行
        yield return new WaitForFixedUpdate();

        // 等待帧结束
        yield return new WaitForEndOfFrame();

        Debug.Log("协程结束");
    }

    /// <summary>
    /// 通过名字调用的协程
    /// </summary>
    IEnumerator SimpleCoroutineByName()
    {
        yield return new WaitForSeconds(1f);
    }

    /// <summary>
    /// 带参数的协程
    /// </summary>
    IEnumerator CoroutineWithParameter(int count)
    {
        for (int i = 0; i < count; i++)
        {
            Debug.Log($"计数: {i + 1}");
            yield return new WaitForSeconds(0.5f);
        }
    }

    /// <summary>
    /// 嵌套协程
    /// </summary>
    IEnumerator NestedCoroutine()
    {
        Debug.Log("外层协程开始");

        // 等待内层协程完成
        yield return StartCoroutine(InnerCoroutine());

        Debug.Log("外层协程结束");
    }

    IEnumerator InnerCoroutine()
    {
        Debug.Log("内层协程");
        yield return new WaitForSeconds(1f);
    }

    void Update()
    {
        // 停止协程
        if (Input.GetKeyDown(KeyCode.S))
        {
            // 停止指定协程引用
            if (myCoroutine != null)
            {
                StopCoroutine(myCoroutine);
                myCoroutine = null;
            }

            // 停止通过名字启动的协程
            StopCoroutine("SimpleCoroutineByName");

            // 停止所有协程
            StopAllCoroutines();
        }
    }
}
```

### 协程实用示例

```csharp
using UnityEngine;
using System.Collections;

public class CoroutineExamples : MonoBehaviour
{
    /// <summary>
    /// 渐变效果
    /// </summary>
    public IEnumerator FadeOut(CanvasGroup canvasGroup, float duration)
    {
        float startAlpha = canvasGroup.alpha;
        float elapsed = 0f;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            canvasGroup.alpha = Mathf.Lerp(startAlpha, 0f, elapsed / duration);
            yield return null;
        }

        canvasGroup.alpha = 0f;
    }

    /// <summary>
    /// 平滑移动
    /// </summary>
    public IEnumerator MoveTo(Transform obj, Vector3 targetPos, float duration)
    {
        Vector3 startPos = obj.position;
        float elapsed = 0f;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / duration;

            // 使用缓动函数
            t = EaseOutQuad(t);

            obj.position = Vector3.Lerp(startPos, targetPos, t);
            yield return null;
        }

        obj.position = targetPos;
    }

    private float EaseOutQuad(float t)
    {
        return 1 - (1 - t) * (1 - t);
    }

    /// <summary>
    /// 打字机效果
    /// </summary>
    public IEnumerator TypewriterEffect(UnityEngine.UI.Text textComponent, string message, float delay = 0.05f)
    {
        textComponent.text = "";

        foreach (char c in message)
        {
            textComponent.text += c;
            yield return new WaitForSeconds(delay);
        }
    }

    /// <summary>
    /// 延迟执行
    /// </summary>
    public IEnumerator DelayedAction(float delay, System.Action action)
    {
        yield return new WaitForSeconds(delay);
        action?.Invoke();
    }

    // 使用示例
    void Start()
    {
        // 延迟 2 秒后执行
        StartCoroutine(DelayedAction(2f, () =>
        {
            Debug.Log("延迟执行的代码");
        }));
    }

    /// <summary>
    /// 闪烁效果
    /// </summary>
    public IEnumerator FlashEffect(SpriteRenderer sprite, Color flashColor, int times, float interval)
    {
        Color originalColor = sprite.color;

        for (int i = 0; i < times; i++)
        {
            sprite.color = flashColor;
            yield return new WaitForSeconds(interval);
            sprite.color = originalColor;
            yield return new WaitForSeconds(interval);
        }
    }

    /// <summary>
    /// 屏幕震动
    /// </summary>
    public IEnumerator ScreenShake(Transform cameraTransform, float duration, float magnitude)
    {
        Vector3 originalPos = cameraTransform.localPosition;
        float elapsed = 0f;

        while (elapsed < duration)
        {
            float x = Random.Range(-1f, 1f) * magnitude;
            float y = Random.Range(-1f, 1f) * magnitude;

            cameraTransform.localPosition = originalPos + new Vector3(x, y, 0);

            elapsed += Time.deltaTime;
            yield return null;
        }

        cameraTransform.localPosition = originalPos;
    }

    /// <summary>
    /// 定时器协程
    /// </summary>
    public IEnumerator Timer(float totalTime, System.Action<float> onUpdate, System.Action onComplete)
    {
        float remainingTime = totalTime;

        while (remainingTime > 0)
        {
            remainingTime -= Time.deltaTime;
            onUpdate?.Invoke(remainingTime);
            yield return null;
        }

        onComplete?.Invoke();
    }

    /// <summary>
    /// 重复执行
    /// </summary>
    public IEnumerator RepeatAction(float interval, System.Action action, int repeatCount = -1)
    {
        int count = 0;

        while (repeatCount < 0 || count < repeatCount)
        {
            action?.Invoke();
            count++;
            yield return new WaitForSeconds(interval);
        }
    }
}
```

### 自定义 YieldInstruction

```csharp
using UnityEngine;

/// <summary>
/// 自定义等待条件
/// </summary>
public class WaitForAnimation : CustomYieldInstruction
{
    private Animator animator;
    private string stateName;

    public WaitForAnimation(Animator animator, string stateName)
    {
        this.animator = animator;
        this.stateName = stateName;
    }

    public override bool keepWaiting
    {
        get
        {
            AnimatorStateInfo stateInfo = animator.GetCurrentAnimatorStateInfo(0);
            return !stateInfo.IsName(stateName) || stateInfo.normalizedTime < 1f;
        }
    }
}

/// <summary>
/// 等待 Web 请求
/// </summary>
public class WaitForWebRequest : CustomYieldInstruction
{
    private UnityEngine.Networking.UnityWebRequest request;

    public WaitForWebRequest(UnityEngine.Networking.UnityWebRequest request)
    {
        this.request = request;
    }

    public override bool keepWaiting => !request.isDone;
}

// 使用示例
public class CustomYieldExample : MonoBehaviour
{
    public Animator animator;

    System.Collections.IEnumerator PlayAnimation()
    {
        animator.Play("Attack");
        yield return new WaitForAnimation(animator, "Attack");
        Debug.Log("动画播放完毕");
    }
}
```

## 常用设计模式

### 单例模式

```csharp
using UnityEngine;

/// <summary>
/// MonoBehaviour 单例基类
/// </summary>
public abstract class Singleton<T> : MonoBehaviour where T : MonoBehaviour
{
    private static T instance;
    private static readonly object lockObj = new object();
    private static bool isApplicationQuitting = false;

    public static T Instance
    {
        get
        {
            if (isApplicationQuitting)
            {
                Debug.LogWarning($"[Singleton] 应用正在退出，返回 null");
                return null;
            }

            lock (lockObj)
            {
                if (instance == null)
                {
                    instance = FindObjectOfType<T>();

                    if (instance == null)
                    {
                        GameObject singletonObj = new GameObject();
                        instance = singletonObj.AddComponent<T>();
                        singletonObj.name = $"[Singleton] {typeof(T)}";
                    }
                }

                return instance;
            }
        }
    }

    protected virtual void Awake()
    {
        if (instance == null)
        {
            instance = this as T;
            DontDestroyOnLoad(gameObject);
        }
        else if (instance != this)
        {
            Destroy(gameObject);
        }
    }

    protected virtual void OnApplicationQuit()
    {
        isApplicationQuitting = true;
    }
}

// 使用示例
public class AudioManager : Singleton<AudioManager>
{
    public void PlaySound(AudioClip clip)
    {
        // 播放音效
    }
}
```

### 观察者模式（事件系统）

```csharp
using UnityEngine;
using System;
using System.Collections.Generic;

/// <summary>
/// 简单事件系统
/// </summary>
public static class EventManager
{
    private static Dictionary<string, Action<object>> eventDictionary =
        new Dictionary<string, Action<object>>();

    /// <summary>
    /// 订阅事件
    /// </summary>
    public static void Subscribe(string eventName, Action<object> listener)
    {
        if (eventDictionary.TryGetValue(eventName, out Action<object> existingEvent))
        {
            existingEvent += listener;
            eventDictionary[eventName] = existingEvent;
        }
        else
        {
            eventDictionary.Add(eventName, listener);
        }
    }

    /// <summary>
    /// 取消订阅
    /// </summary>
    public static void Unsubscribe(string eventName, Action<object> listener)
    {
        if (eventDictionary.TryGetValue(eventName, out Action<object> existingEvent))
        {
            existingEvent -= listener;

            if (existingEvent == null)
            {
                eventDictionary.Remove(eventName);
            }
            else
            {
                eventDictionary[eventName] = existingEvent;
            }
        }
    }

    /// <summary>
    /// 发布事件
    /// </summary>
    public static void Publish(string eventName, object data = null)
    {
        if (eventDictionary.TryGetValue(eventName, out Action<object> eventAction))
        {
            eventAction?.Invoke(data);
        }
    }

    /// <summary>
    /// 清除所有事件
    /// </summary>
    public static void Clear()
    {
        eventDictionary.Clear();
    }
}

// 使用示例
public class Player : MonoBehaviour
{
    public int health = 100;

    public void TakeDamage(int damage)
    {
        health -= damage;
        EventManager.Publish("PlayerHealthChanged", health);

        if (health <= 0)
        {
            EventManager.Publish("PlayerDied", this);
        }
    }
}

public class UIHealthBar : MonoBehaviour
{
    void OnEnable()
    {
        EventManager.Subscribe("PlayerHealthChanged", OnHealthChanged);
    }

    void OnDisable()
    {
        EventManager.Unsubscribe("PlayerHealthChanged", OnHealthChanged);
    }

    private void OnHealthChanged(object data)
    {
        int health = (int)data;
        // 更新血条 UI
        Debug.Log($"玩家血量: {health}");
    }
}
```

### 状态机模式

```csharp
using UnityEngine;

/// <summary>
/// 状态接口
/// </summary>
public interface IState
{
    void Enter();
    void Update();
    void Exit();
}

/// <summary>
/// 状态机
/// </summary>
public class StateMachine
{
    private IState currentState;

    public void ChangeState(IState newState)
    {
        currentState?.Exit();
        currentState = newState;
        currentState?.Enter();
    }

    public void Update()
    {
        currentState?.Update();
    }
}

// 具体状态实现
public class IdleState : IState
{
    private PlayerController player;

    public IdleState(PlayerController player)
    {
        this.player = player;
    }

    public void Enter()
    {
        Debug.Log("进入空闲状态");
        player.animator.Play("Idle");
    }

    public void Update()
    {
        if (Input.GetAxis("Horizontal") != 0 || Input.GetAxis("Vertical") != 0)
        {
            player.stateMachine.ChangeState(player.walkState);
        }

        if (Input.GetButtonDown("Jump"))
        {
            player.stateMachine.ChangeState(player.jumpState);
        }
    }

    public void Exit()
    {
        Debug.Log("退出空闲状态");
    }
}

public class WalkState : IState
{
    private PlayerController player;

    public WalkState(PlayerController player)
    {
        this.player = player;
    }

    public void Enter()
    {
        player.animator.Play("Walk");
    }

    public void Update()
    {
        // 移动逻辑
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");
        player.Move(h, v);

        if (h == 0 && v == 0)
        {
            player.stateMachine.ChangeState(player.idleState);
        }
    }

    public void Exit() { }
}

// 玩家控制器
public class PlayerController : MonoBehaviour
{
    public Animator animator;
    public StateMachine stateMachine;

    public IdleState idleState;
    public WalkState walkState;
    public IState jumpState;

    void Start()
    {
        stateMachine = new StateMachine();
        idleState = new IdleState(this);
        walkState = new WalkState(this);
        // jumpState = new JumpState(this);

        stateMachine.ChangeState(idleState);
    }

    void Update()
    {
        stateMachine.Update();
    }

    public void Move(float h, float v)
    {
        Vector3 movement = new Vector3(h, 0, v) * 5f * Time.deltaTime;
        transform.Translate(movement);
    }
}
```

## 面试要点

### 核心概念题

**1. GameObject 和 Component 的关系是什么？**

GameObject 是一个容器，本身没有功能，通过添加 Component（组件）来获得具体功能。每个 GameObject 必须有 Transform 组件。这种设计遵循组合优于继承的原则，提供了高度的灵活性。

**2. Awake、Start、OnEnable 的执行顺序和区别？**

- `Awake`：对象实例化时调用，最先执行，即使脚本禁用也会调用
- `OnEnable`：对象启用时调用，在 Awake 之后
- `Start`：第一帧 Update 之前调用，仅在脚本启用时调用
- 跨对象时，所有对象的 Awake 先执行，然后是 OnEnable，最后是 Start

**3. Update、FixedUpdate、LateUpdate 的区别？**

- `Update`：每帧调用，频率取决于帧率，用于常规逻辑和输入处理
- `FixedUpdate`：固定时间间隔调用（默认 0.02秒），不受帧率影响，用于物理计算
- `LateUpdate`：在所有 Update 执行完后调用，常用于相机跟随

**4. 协程和异步方法（async/await）的区别？**

- 协程：Unity 特有，基于迭代器，在主线程执行，可以 yield 各种 Unity 特定条件
- async/await：C# 原生支持，可以使用多线程，但不能直接访问 Unity API
- 协程更适合 Unity 游戏逻辑，async/await 适合 I/O 操作

**5. Resources 和 Addressables 的区别？**

- Resources：简单易用，但所有资源都会打包，无法热更新
- Addressables：支持异步加载、远程加载、增量更新，资源管理更灵活

### 实践技巧

**1. 如何优化 GetComponent 调用？**

```csharp
// 缓存组件引用
private Rigidbody rb;

void Awake()
{
    rb = GetComponent<Rigidbody>();
}

void Update()
{
    rb.AddForce(Vector3.up); // 使用缓存的引用
}
```

**2. 如何避免协程内存分配？**

```csharp
// 缓存 WaitForSeconds
private WaitForSeconds waitOneSecond = new WaitForSeconds(1f);

IEnumerator MyCoroutine()
{
    while (true)
    {
        yield return waitOneSecond; // 重用缓存的对象
    }
}
```

**3. Find 系列方法的性能问题**

```csharp
// 避免在 Update 中使用
void Update()
{
    // 不推荐：每帧都会遍历场景
    GameObject player = GameObject.Find("Player");
}

// 推荐：缓存引用
private GameObject player;

void Start()
{
    player = GameObject.Find("Player");
}
```

## 延伸阅读

### 官方资源

- [Unity 官方文档](https://docs.unity3d.com/Manual/index.html)
- [Unity Learn](https://learn.unity.com/)
- [Unity 脚本 API](https://docs.unity3d.com/ScriptReference/index.html)

### 进阶主题

- **Unity DOTS**：面向数据的技术栈，包括 ECS、Job System 和 Burst Compiler
- **Shader 编程**：使用 HLSL 编写自定义着色器
- **Addressables 高级用法**：远程加载、分组策略、内存管理
- **Unity 编辑器扩展**：自定义 Inspector、编辑器窗口

### 推荐插件

- **DOTween**：高性能动画补间库
- **UniTask**：Unity 优化的 async/await 实现
- **Odin Inspector**：强大的 Inspector 扩展
- **Addressables**：Unity 官方资源管理系统

### 性能优化工具

- **Unity Profiler**：内置性能分析工具
- **Frame Debugger**：渲染调试工具
- **Memory Profiler**：内存分析工具
- **Physics Debugger**：物理调试工具

---

> 本文涵盖了 Unity 游戏开发的核心基础知识。掌握 GameObject/Component 模型、生命周期、资源管理和协程是 Unity 开发的必备技能。建议读者通过实际项目练习来加深理解，逐步掌握更高级的 Unity 开发技术。
