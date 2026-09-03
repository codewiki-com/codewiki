---
title: Unity MonoBehaviour 生命周期详解
description: Unity MonoBehaviour 生命周期方法、执行顺序与最佳实践完全指南
track: gamedev
section: unity
difficulty: intermediate
tags:
  - unity
  - monobehaviour
  - 生命周期
  - 游戏开发
status: imported
origin: old/src/content/docs/gamedev/unity-monobehaviour.zh.md
divergence: 0.198
issues: []
legacy:
  category: GameDev
  subcategory: Unity
  order: 10
  lastUpdated: 2026-01-07
---

理解 MonoBehaviour 生命周期是成为熟练 Unity 开发者的基础。每个与 GameObject 交互的脚本都继承自 MonoBehaviour，了解每个生命周期方法的执行时机，决定了游戏是流畅运行还是充满 Bug 和性能问题。

## 概念解释

### 什么是 MonoBehaviour？

MonoBehaviour 是所有 Unity 脚本的基类。它提供了让 C# 脚本接入 Unity 游戏循环的接口，使脚本能够响应 GameObject 整个生命周期中的各种事件。当你在 Unity 中创建新的 C# 脚本时，它会自动继承 MonoBehaviour。

```
+---------------------------------------------------------------------+
|                        Unity 引擎                                    |
|                                                                      |
|    +------------------+                                              |
|    |   场景 Scene     |                                              |
|    |                  |                                              |
|    |  +--------------------------------------+                       |
|    |  |       游戏对象 GameObject            |                       |
|    |  |                                      |                       |
|    |  |  +--------------------------------+  |                       |
|    |  |  |  MonoBehaviour 脚本            |  |                       |
|    |  |  |  --------------------------    |  |                       |
|    |  |  |  Awake()                       |<-+--- 引擎自动调用        |
|    |  |  |  Start()                       |                          |
|    |  |  |  Update()                      |                          |
|    |  |  |  OnDestroy()                   |                          |
|    |  |  +--------------------------------+  |                       |
|    |  +--------------------------------------+                       |
|    +------------------+                                              |
|                                                                      |
+---------------------------------------------------------------------+
```

### 历史背景

MonoBehaviour 自 Unity 最早的版本（2005年发布的 Unity 1.0）就已存在。它被设计为一种简单的、事件驱动的编程模型，适合各种技能水平的开发者使用。"MonoBehaviour" 这个名字结合了 "Mono"（Unity 最初使用的基于 Mono 框架的 .NET 运行时）和 "Behaviour"（为 GameObject 添加功能的组件模式）。

虽然 Unity 已经引入了更新的范式，如 DOTS（面向数据的技术栈）和 ECS（实体组件系统），但 MonoBehaviour 仍然是主要的脚本模型，不太可能被废弃。

### 解决什么问题？

生命周期系统解决了游戏开发中的几个关键挑战：

1. **初始化顺序**：游戏需要可预测的设置顺序，确保依赖项在被依赖对象之前初始化
2. **逐帧更新**：游戏需要每帧运行的代码来处理移动、AI 和游戏逻辑
3. **物理同步**：物理计算需要以固定间隔运行，与渲染分离
4. **资源管理**：对象需要在销毁或禁用时有机会清理资源
5. **事件协调**：不同对象上的多个脚本需要以可预测的顺序执行

## 核心原理

### Unity 游戏循环

Unity 引擎运行一个主循环来处理每一帧。在这个循环中，MonoBehaviour 方法按照特定的、确定性的顺序被调用：

```
+=====================================================================+
|                     UNITY 帧执行流程                                  |
+=====================================================================+
|                                                                      |
|  +---------------------------------------------------------------+  |
|  |              初始化阶段 INITIALIZATION                         |  |
|  |  +---------+    +----------+    +---------+                   |  |
|  |  |  Awake  |--->| OnEnable |--->|  Start  |                   |  |
|  |  +---------+    +----------+    +---------+                   |  |
|  |       ^              ^               ^                         |  |
|  |       |              |               |                         |  |
|  |   (仅一次)     (每次启用)        (仅一次,首帧)                   |  |
|  +---------------------------------------------------------------+  |
|                              |                                       |
|                              v                                       |
|  +---------------------------------------------------------------+  |
|  |              物理阶段 PHYSICS (固定时间步长)                    |  |
|  |  +-------------+    +------------------------+                 |  |
|  |  | FixedUpdate |--->|    内部物理更新        |                 |  |
|  |  +-------------+    +------------------------+                 |  |
|  |        ^                                                       |  |
|  |        |                                                       |  |
|  |   (每帧0到N次, 基于 Time.fixedDeltaTime)                       |  |
|  +---------------------------------------------------------------+  |
|                              |                                       |
|                              v                                       |
|  +---------------------------------------------------------------+  |
|  |              游戏逻辑阶段 GAME LOGIC                            |  |
|  |  +--------+    +------------+    +------------+                |  |
|  |  | Update |--->| LateUpdate |--->|   动画     |                |  |
|  |  +--------+    +------------+    +------------+                |  |
|  |       ^                                                        |  |
|  |       |                                                        |  |
|  |   (每帧一次)                                                    |  |
|  +---------------------------------------------------------------+  |
|                              |                                       |
|                              v                                       |
|  +---------------------------------------------------------------+  |
|  |              渲染阶段 RENDERING                                 |  |
|  |  +------------------+    +---------------------+               |  |
|  |  | OnPreRender/Cull |--->| OnRenderObject/Image |               |  |
|  |  +------------------+    +---------------------+               |  |
|  +---------------------------------------------------------------+  |
|                              |                                       |
|                              v                                       |
|  +---------------------------------------------------------------+  |
|  |              清理阶段 DECOMMISSIONING                          |  |
|  |  +-----------+    +-------------+                              |  |
|  |  | OnDisable |--->|  OnDestroy  |                              |  |
|  |  +-----------+    +-------------+                              |  |
|  |       ^                  ^                                     |  |
|  |       |                  |                                     |  |
|  |   (每次禁用)         (销毁时仅一次)                              |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
+=====================================================================+
```

### 基于消息的调用机制

Unity 使用反射和缓存来调用生命周期方法。当 MonoBehaviour 被添加到 GameObject 时，Unity 会扫描类中已知的方法签名。然后通过 Unity 的原生 C++ 引擎调用这些方法，而不是通过 C# 的虚方法分派。这就是为什么生命周期方法不需要标记为 `override`。

### 内部执行机制

Unity 的核心引擎使用 C++ 编写，通过脚本运行时调用 C# MonoBehaviour 方法：

1. **反序列化**：从序列化数据重建 GameObject 和组件
2. **方法绑定**：Unity 原生代码注册指向 MonoBehaviour 生命周期方法的指针
3. **执行队列**：根据方法类型将其添加到执行列表
4. **调用**：引擎遍历列表并按顺序调用方法

## 核心要点

### 初始化方法

#### Awake()

脚本实例加载时调用**一次**。主要特点：

- 即使脚本被禁用也会调用
- 在任何 Start() 方法之前调用
- 调用时机：场景加载、调用 `Instantiate()` 或使用 `AddComponent<T>()` 时
- 用途：初始化脚本间的引用、不依赖其他对象的设置

#### OnEnable()

每次对象变为启用和活动状态时调用：

- 首次启用时在 Awake() 之后调用
- 每次组件重新启用时都会调用
- 用途：订阅事件、对象池重新激活、向管理器注册

#### Start()

在第一帧更新之前调用**一次**：

- 仅在脚本启用时调用
- 在所有 Awake() 方法完成后调用
- 用途：依赖其他对象就绪的初始化

### 更新方法

| 方法 | 时机 | 使用场景 | 时间增量 |
|------|------|----------|----------|
| `FixedUpdate()` | 固定间隔（默认0.02秒） | 物理、一致性模拟 | `Time.fixedDeltaTime` |
| `Update()` | 每帧 | 输入、大多数游戏逻辑 | `Time.deltaTime` |
| `LateUpdate()` | 所有 Update() 之后 | 相机跟随、后处理 | `Time.deltaTime` |

#### FixedUpdate()

- 以固定时间间隔调用（默认：0.02秒 / 每秒50次）
- 与帧率无关
- 每帧可能调用 0、1 或多次
- 用途：物理计算、刚体操作

#### Update()

- 每帧调用一次
- 依赖帧率（随性能变化）
- 用途：输入处理、非物理游戏逻辑、视觉更新

#### LateUpdate()

- 每帧调用一次，在所有 Update() 方法之后
- 用途：相机跟随逻辑、需要在所有对象更新后执行的操作

### 清理方法

#### OnDisable()

- 对象变为禁用或非活动状态时调用
- 在 OnDestroy() 之前调用
- 用途：取消订阅事件、禁用时需要进行的清理

#### OnDestroy()

- 对象被销毁时调用
- 场景或游戏结束时调用
- 用途：最终清理、释放资源

### 完整方法执行顺序

```
首次场景加载
-----------------
Awake
OnEnable
Start

每帧
-----------------
FixedUpdate (0到N次)
  +---> OnTriggerXXX
  +---> OnCollisionXXX
Update
  +---> 协程 yield null
LateUpdate

禁用时
-----------------
OnDisable

重新启用时
-----------------
OnEnable

销毁时
-----------------
OnDisable
OnDestroy

应用程序退出
-----------------
OnApplicationQuit
OnDisable
OnDestroy
```

## 代码示例

### 基本生命周期演示

```csharp
using UnityEngine;

/// <summary>
/// 演示完整的 MonoBehaviour 生命周期并输出日志。
/// 附加到任何 GameObject 以观察执行顺序。
/// </summary>
public class LifecycleDemo : MonoBehaviour
{
    [Header("配置")]
    [SerializeField] private bool logUpdates = false;

    private int frameCount = 0;
    private int fixedUpdateCount = 0;

    // ====== 初始化阶段 ======

    void Awake()
    {
        // 脚本实例加载时调用（即使被禁用）
        Debug.Log($"[{Time.frameCount}] Awake() - 脚本实例已加载");
        Debug.Log($"  - enabled: {enabled}");
        Debug.Log($"  - gameObject.activeInHierarchy: {gameObject.activeInHierarchy}");
    }

    void OnEnable()
    {
        // 每次脚本启用时调用
        Debug.Log($"[{Time.frameCount}] OnEnable() - 脚本已启用");

        // 适合：订阅事件
        GameEvents.OnGamePaused += HandleGamePaused;
    }

    void Start()
    {
        // 首次 Update 前调用一次（仅在启用时）
        Debug.Log($"[{Time.frameCount}] Start() - 首帧初始化");

        // 此时可以安全访问其他脚本 - 它们的 Awake() 已完成
    }

    // ====== 游戏循环阶段 ======

    void FixedUpdate()
    {
        // 以固定间隔调用（默认50Hz）
        fixedUpdateCount++;
        if (logUpdates)
            Debug.Log($"[帧 {Time.frameCount}] FixedUpdate #{fixedUpdateCount}");
    }

    void Update()
    {
        // 每帧调用一次
        frameCount++;
        if (logUpdates)
            Debug.Log($"[帧 {Time.frameCount}] Update #{frameCount}, Delta: {Time.deltaTime}");
    }

    void LateUpdate()
    {
        // 所有 Update() 调用完成后执行
        if (logUpdates)
            Debug.Log($"[帧 {Time.frameCount}] LateUpdate");
    }

    // ====== 物理回调 ======

    void OnCollisionEnter(Collision collision)
    {
        Debug.Log($"[{Time.frameCount}] OnCollisionEnter 与 {collision.gameObject.name}");

        // 访问碰撞详情
        ContactPoint contact = collision.contacts[0];
        Vector3 impactPoint = contact.point;
        float impactForce = collision.relativeVelocity.magnitude;
    }

    void OnTriggerEnter(Collider other)
    {
        Debug.Log($"[{Time.frameCount}] OnTriggerEnter 与 {other.gameObject.name}");
    }

    // ====== 清理阶段 ======

    void OnDisable()
    {
        // 脚本禁用时调用
        Debug.Log($"[{Time.frameCount}] OnDisable() - 脚本已禁用");

        // 始终取消订阅事件
        GameEvents.OnGamePaused -= HandleGamePaused;
    }

    void OnDestroy()
    {
        // 脚本/对象销毁时调用
        Debug.Log($"[{Time.frameCount}] OnDestroy() - 脚本已销毁");
        Debug.Log($"  - 总帧数: {frameCount}");
        Debug.Log($"  - 总固定更新次数: {fixedUpdateCount}");
    }

    // ====== 应用程序回调 ======

    void OnApplicationFocus(bool hasFocus)
    {
        Debug.Log($"[{Time.frameCount}] OnApplicationFocus({hasFocus})");
    }

    void OnApplicationPause(bool pauseStatus)
    {
        Debug.Log($"[{Time.frameCount}] OnApplicationPause({pauseStatus})");
    }

    void OnApplicationQuit()
    {
        Debug.Log($"[{Time.frameCount}] OnApplicationQuit()");
    }

    private void HandleGamePaused(bool isPaused) { }
}
```

### 脚本执行顺序控制

```csharp
using UnityEngine;

// 方法1：使用 DefaultExecutionOrder 属性
// 负值先执行，正值后执行
[DefaultExecutionOrder(-100)]
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    private void Awake()
    {
        // 此 Awake 在执行顺序值更高的脚本之前运行
        Instance = this;
        Debug.Log("GameManager 首先初始化！");
    }
}

[DefaultExecutionOrder(100)]
public class PlayerController : MonoBehaviour
{
    private void Awake()
    {
        // 在 GameManager.Awake 之后运行
        // GameManager.Instance 保证可用
        Debug.Log($"玩家可以访问 GameManager: {GameManager.Instance != null}");
    }
}
```

### 协程与生命周期集成

```csharp
using UnityEngine;
using System.Collections;

public class CoroutineLifecycle : MonoBehaviour
{
    private Coroutine runningCoroutine;

    // 缓存 WaitFor 对象以避免 GC 分配
    private readonly WaitForSeconds waitOneSecond = new WaitForSeconds(1f);
    private readonly WaitForFixedUpdate waitFixed = new WaitForFixedUpdate();
    private readonly WaitForEndOfFrame waitEndOfFrame = new WaitForEndOfFrame();

    private void OnEnable()
    {
        // 启用时开始协程
        runningCoroutine = StartCoroutine(ContinuousProcess());
    }

    private void OnDisable()
    {
        // 禁用时停止协程以防止错误
        if (runningCoroutine != null)
        {
            StopCoroutine(runningCoroutine);
            runningCoroutine = null;
        }
    }

    private IEnumerator ContinuousProcess()
    {
        while (true)
        {
            Debug.Log("协程运行中...");

            // yield return null 在 Update 之后、LateUpdate 之前执行
            yield return null;

            // WaitForFixedUpdate 在 FixedUpdate 之后执行
            yield return waitFixed;

            // WaitForEndOfFrame 在渲染之后执行
            yield return waitEndOfFrame;

            // 等待指定秒数（缓存以避免 GC）
            yield return waitOneSecond;
        }
    }

    /*
     * 协程在一帧内的执行顺序：
     *
     * FixedUpdate
     * yield WaitForFixedUpdate
     * Update
     * yield null / yield WaitForSeconds（时间到达时）
     * LateUpdate
     * 渲染
     * yield WaitForEndOfFrame
     */
}
```

### 物理移动模式

```csharp
using UnityEngine;

public class CharacterPhysics : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 5f;
    [SerializeField] private float jumpForce = 10f;

    private Rigidbody rb;
    private Vector3 moveInput;
    private bool shouldJump;

    void Awake()
    {
        rb = GetComponent<Rigidbody>();
    }

    void Update()
    {
        // 在 Update 中读取输入以获得响应性
        moveInput = new Vector3(
            Input.GetAxisRaw("Horizontal"),
            0f,
            Input.GetAxisRaw("Vertical")
        );

        if (Input.GetButtonDown("Jump"))
            shouldJump = true;
    }

    void FixedUpdate()
    {
        // 在 FixedUpdate 中应用物理以保持一致性
        Vector3 velocity = moveInput.normalized * moveSpeed;
        velocity.y = rb.linearVelocity.y; // 保持垂直速度
        rb.linearVelocity = velocity;

        if (shouldJump)
        {
            rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);
            shouldJump = false;
        }
    }
}
```

### 使用 LateUpdate 的相机跟随

```csharp
using UnityEngine;

public class SmoothCameraFollow : MonoBehaviour
{
    [SerializeField] private Transform target;
    [SerializeField] private Vector3 offset = new Vector3(0, 5, -10);
    [SerializeField] private float smoothSpeed = 5f;

    private Vector3 velocity;

    private void Start()
    {
        // 如果未分配则查找目标
        if (target == null)
        {
            var player = GameObject.FindWithTag("Player");
            if (player != null)
                target = player.transform;
        }
    }

    private void LateUpdate()
    {
        // LateUpdate 确保所有角色移动已完成
        if (target == null) return;

        Vector3 desiredPosition = target.position + offset;
        Vector3 smoothedPosition = Vector3.SmoothDamp(
            transform.position,
            desiredPosition,
            ref velocity,
            1f / smoothSpeed
        );

        transform.position = smoothedPosition;
        transform.LookAt(target);
    }
}
```

## 最佳实践

### Awake() 用于自身初始化，Start() 用于依赖项

```csharp
public class BestPracticeExample : MonoBehaviour
{
    private Rigidbody rb;
    private GameManager gameManager;

    private void Awake()
    {
        // 获取自身组件 - 这些总是安全的
        rb = GetComponent<Rigidbody>();
    }

    private void Start()
    {
        // 访问其他对象/单例 - 此时它们已初始化
        gameManager = GameManager.Instance;
    }
}
```

### 始终配对使用 OnEnable/OnDisable 进行事件订阅

```csharp
public class EventSubscriber : MonoBehaviour
{
    private void OnEnable()
    {
        PlayerHealth.OnPlayerDeath += HandlePlayerDeath;
        GameEvents.OnLevelComplete += HandleLevelComplete;
    }

    private void OnDisable()
    {
        // 始终取消订阅以防止内存泄漏和空引用错误
        PlayerHealth.OnPlayerDeath -= HandlePlayerDeath;
        GameEvents.OnLevelComplete -= HandleLevelComplete;
    }

    private void HandlePlayerDeath() { }
    private void HandleLevelComplete() { }
}
```

### 缓存组件引用

```csharp
public class CachedComponents : MonoBehaviour
{
    // 在 Awake 中缓存，而不是每帧获取
    private Transform cachedTransform;
    private Renderer cachedRenderer;

    private void Awake()
    {
        cachedTransform = transform;  // transform 实际上是属性调用
        cachedRenderer = GetComponent<Renderer>();
    }

    private void Update()
    {
        // 使用缓存的引用 - 比每帧调用 GetComponent 快得多
        cachedTransform.position += Vector3.forward * Time.deltaTime;
    }
}
```

### 为关键系统使用显式执行顺序

```csharp
// 在 Project Settings > Script Execution Order 中设置，或使用属性：
[DefaultExecutionOrder(-1000)]
public class Bootstrap : MonoBehaviour
{
    private void Awake()
    {
        // 首先初始化核心系统
        DontDestroyOnLoad(gameObject);
    }
}
```

### 在 Awake 中验证组件

```csharp
[RequireComponent(typeof(Rigidbody))]
public class ValidatedComponent : MonoBehaviour
{
    private Rigidbody rb;

    private void Awake()
    {
        rb = GetComponent<Rigidbody>();

        // 使用清晰的错误消息进行验证
        if (rb == null)
        {
            Debug.LogError($"[{name}] 缺少 Rigidbody 组件！", this);
            enabled = false;
            return;
        }
    }
}
```

## 常见陷阱

### 陷阱1：在 Awake() 中访问未初始化的引用

```csharp
// 错误 - 其他对象可能尚未初始化
public class PitfallExample : MonoBehaviour
{
    private void Awake()
    {
        // 如果 GameManager 的 Awake 尚未运行，这可能失败
        var manager = GameManager.Instance; // 可能为 null！
    }
}

// 正确 - 使用 Start() 进行跨对象引用
public class CorrectExample : MonoBehaviour
{
    private void Start()
    {
        var manager = GameManager.Instance; // 安全 - 所有 Awake() 调用已完成
    }
}
```

### 陷阱2：未处理禁用状态

```csharp
// 错误 - 如果在禁用状态下实例化，Start() 不会被调用
public class DisabledPitfall : MonoBehaviour
{
    private bool isInitialized = false;

    private void Start()
    {
        isInitialized = true;  // 如果禁用则永远不会调用！
    }
}

// 正确 - 使用 Awake() 进行关键初始化
public class DisabledCorrect : MonoBehaviour
{
    private bool isInitialized = false;

    private void Awake()
    {
        isInitialized = true;  // 总是被调用，即使禁用
    }
}
```

### 陷阱3：在 Update() 中使用物理

```csharp
// 错误 - Update 中的物理会导致抖动
public class PhysicsPitfall : MonoBehaviour
{
    private Rigidbody rb;

    private void Update()
    {
        rb.AddForce(Vector3.forward * 10f);  // 不一致！
    }
}

// 正确 - 使用 FixedUpdate 处理物理
public class PhysicsCorrect : MonoBehaviour
{
    private Rigidbody rb;

    private void FixedUpdate()
    {
        rb.AddForce(Vector3.forward * 10f);  // 平滑一致
    }
}
```

### 陷阱4：忘记停止协程

```csharp
// 错误 - 协程在禁用后继续运行，导致错误
public class CoroutinePitfall : MonoBehaviour
{
    private void Start()
    {
        StartCoroutine(DoSomething());
    }

    private IEnumerator DoSomething()
    {
        while (true)
        {
            yield return new WaitForSeconds(1f);
            transform.position += Vector3.up;  // 如果对象被销毁会出错！
        }
    }
}

// 正确 - 跟踪并停止协程
public class CoroutineCorrect : MonoBehaviour
{
    private Coroutine activeCoroutine;

    private void OnEnable()
    {
        activeCoroutine = StartCoroutine(DoSomething());
    }

    private void OnDisable()
    {
        if (activeCoroutine != null)
            StopCoroutine(activeCoroutine);
    }

    private IEnumerator DoSomething()
    {
        while (true)
        {
            yield return new WaitForSeconds(1f);
            transform.position += Vector3.up;
        }
    }
}
```

### 陷阱5：事件订阅内存泄漏

```csharp
// 错误 - 订阅但从不取消订阅
public class EventLeakPitfall : MonoBehaviour
{
    void Start()
    {
        GameManager.OnScoreChanged += HandleScore;  // 泄漏！
    }
    // 对象销毁但事件仍持有引用

    private void HandleScore(int score) { }
}

// 正确 - 始终取消订阅
public class EventLeakFixed : MonoBehaviour
{
    void OnEnable()
    {
        GameManager.OnScoreChanged += HandleScore;
    }

    void OnDisable()
    {
        GameManager.OnScoreChanged -= HandleScore;
    }

    private void HandleScore(int score) { }
}
```

## 性能考量

### 空的生命周期方法有开销

Unity 通过反射检查并调用生命周期方法。空方法仍有调用开销。

```csharp
// 避免 - 空的 Update 仍有开销
public class EmptyUpdate : MonoBehaviour
{
    private void Update() { }  // 删除它！
}
```

### 不需要时考虑禁用 Update

```csharp
public class ConditionalUpdate : MonoBehaviour
{
    private bool needsUpdate = false;

    public void StartProcessing()
    {
        needsUpdate = true;
        enabled = true;
    }

    public void StopProcessing()
    {
        needsUpdate = false;
        enabled = false;  // 完全禁用 Update 调用
    }

    private void Update()
    {
        if (!needsUpdate) return;
        // 处理...
    }
}
```

### 对大量对象使用更新管理器模式

```csharp
// 不要让1000个对象各自有 Update()，使用一个管理器
public class UpdateManager : MonoBehaviour
{
    private static readonly List<IUpdatable> updatables = new List<IUpdatable>();

    public static void Register(IUpdatable updatable) => updatables.Add(updatable);
    public static void Unregister(IUpdatable updatable) => updatables.Remove(updatable);

    private void Update()
    {
        // 单次 Update 调用，遍历所有注册的对象
        for (int i = 0; i < updatables.Count; i++)
        {
            updatables[i].OnUpdate();
        }
    }
}

public interface IUpdatable
{
    void OnUpdate();
}

public class ManagedObject : MonoBehaviour, IUpdatable
{
    private void OnEnable() => UpdateManager.Register(this);
    private void OnDisable() => UpdateManager.Unregister(this);

    public void OnUpdate()
    {
        // 由管理器调用，而不是 Unity - 减少开销
    }
}
```

### 在协程中缓存 WaitFor 对象

```csharp
public class OptimizedCoroutines : MonoBehaviour
{
    // 缓存以避免每次迭代的 GC 分配
    private readonly WaitForSeconds wait1s = new WaitForSeconds(1f);

    private IEnumerator GoodCoroutine()
    {
        while (true)
        {
            yield return wait1s;  // 重用缓存的实例
            DoWork();
        }
    }

    private IEnumerator BadCoroutine()
    {
        while (true)
        {
            yield return new WaitForSeconds(1f);  // 每次迭代都创建垃圾！
            DoWork();
        }
    }

    private void DoWork() { }
}
```

### 使用非分配的物理方法

```csharp
public class OptimizedPhysics : MonoBehaviour
{
    // 重用数组以避免分配
    private readonly Collider[] overlapResults = new Collider[16];

    private void Update()
    {
        // 差：每帧分配新数组
        // var colliders = Physics.OverlapSphere(transform.position, 5f);

        // 好：重用预分配的数组
        int count = Physics.OverlapSphereNonAlloc(
            transform.position,
            5f,
            overlapResults
        );

        for (int i = 0; i < count; i++)
        {
            ProcessCollider(overlapResults[i]);
        }
    }

    private void ProcessCollider(Collider col) { }
}
```

## 实战场景

### 场景1：带生命周期的对象池

```csharp
using UnityEngine;
using UnityEngine.Pool;

public class PooledProjectile : MonoBehaviour
{
    private IObjectPool<PooledProjectile> pool;
    private Rigidbody rb;
    private float lifetime = 5f;
    private float spawnTime;

    private void Awake()
    {
        // 缓存组件一次 - Awake 仅在首次实例化时调用
        rb = GetComponent<Rigidbody>();
    }

    private void OnEnable()
    {
        // 从池中取出时重置状态
        spawnTime = Time.time;
        rb.linearVelocity = Vector3.zero;
        rb.angularVelocity = Vector3.zero;
    }

    private void Update()
    {
        // 生命期结束后返回池中
        if (Time.time - spawnTime >= lifetime)
        {
            ReturnToPool();
        }
    }

    private void OnDisable()
    {
        // 返回池中时清理
        StopAllCoroutines();
    }

    public void SetPool(IObjectPool<PooledProjectile> pool)
    {
        this.pool = pool;
    }

    public void Launch(Vector3 direction, float force)
    {
        rb.AddForce(direction * force, ForceMode.Impulse);
    }

    private void ReturnToPool()
    {
        pool.Release(this);
    }

    private void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Enemy"))
        {
            other.GetComponent<IDamageable>()?.TakeDamage(10f);
            ReturnToPool();
        }
    }
}
```

### 场景2：玩家生命值系统

```csharp
using UnityEngine;
using System;

public class PlayerHealth : MonoBehaviour
{
    public static event Action<float> OnHealthChanged;
    public static event Action OnPlayerDeath;

    [SerializeField] private float maxHealth = 100f;
    private float currentHealth;
    private bool isDead = false;

    private void Awake()
    {
        // 初始化为最大生命值
        currentHealth = maxHealth;
    }

    private void OnEnable()
    {
        // 订阅伤害事件
        DamageReceiver.OnDamageReceived += TakeDamage;
    }

    private void OnDisable()
    {
        // 始终取消订阅
        DamageReceiver.OnDamageReceived -= TakeDamage;
    }

    private void TakeDamage(float amount)
    {
        if (isDead) return;

        currentHealth = Mathf.Max(0, currentHealth - amount);
        OnHealthChanged?.Invoke(currentHealth / maxHealth);

        if (currentHealth <= 0)
        {
            isDead = true;
            OnPlayerDeath?.Invoke();
        }
    }

    public void Heal(float amount)
    {
        if (isDead) return;

        currentHealth = Mathf.Min(maxHealth, currentHealth + amount);
        OnHealthChanged?.Invoke(currentHealth / maxHealth);
    }
}
```

### 场景3：带生命周期的场景过渡

```csharp
using UnityEngine;
using UnityEngine.SceneManagement;
using System.Collections;

public class SceneTransitionManager : MonoBehaviour
{
    public static SceneTransitionManager Instance { get; private set; }

    [SerializeField] private CanvasGroup fadeCanvas;
    [SerializeField] private float fadeDuration = 0.5f;

    private bool isTransitioning;

    void Awake()
    {
        // 带 DontDestroyOnLoad 的单例模式
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    void OnEnable()
    {
        // 订阅场景事件
        SceneManager.sceneLoaded += OnSceneLoaded;
        SceneManager.sceneUnloaded += OnSceneUnloaded;
    }

    void OnDisable()
    {
        SceneManager.sceneLoaded -= OnSceneLoaded;
        SceneManager.sceneUnloaded -= OnSceneUnloaded;
    }

    void OnDestroy()
    {
        // 清理静态引用
        if (Instance == this)
        {
            Instance = null;
        }
    }

    public void LoadScene(string sceneName)
    {
        if (!isTransitioning)
        {
            StartCoroutine(TransitionToScene(sceneName));
        }
    }

    private IEnumerator TransitionToScene(string sceneName)
    {
        isTransitioning = true;

        // 淡出
        yield return FadeCanvas(1f);

        // 加载新场景（触发新对象的 Awake/OnEnable/Start）
        yield return SceneManager.LoadSceneAsync(sceneName);

        // 淡入
        yield return FadeCanvas(0f);

        isTransitioning = false;
    }

    private IEnumerator FadeCanvas(float targetAlpha)
    {
        float startAlpha = fadeCanvas.alpha;
        float elapsed = 0f;

        while (elapsed < fadeDuration)
        {
            elapsed += Time.unscaledDeltaTime;
            fadeCanvas.alpha = Mathf.Lerp(startAlpha, targetAlpha, elapsed / fadeDuration);
            yield return null;
        }

        fadeCanvas.alpha = targetAlpha;
    }

    private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        Debug.Log($"场景已加载: {scene.name}");
    }

    private void OnSceneUnloaded(Scene scene)
    {
        Debug.Log($"场景已卸载: {scene.name}");
    }
}
```

## 面试要点

### 常见面试问题

**1. Awake() 和 Start() 有什么区别？**

`Awake()` 在脚本实例加载时调用，即使脚本被禁用也会调用。它在任何 `Start()` 方法之前运行。用于自身初始化（缓存同一 GameObject 上的组件）。

`Start()` 在第一帧更新之前调用，但仅在脚本启用时调用。它在所有 `Awake()` 方法完成后运行。用于依赖其他脚本的初始化。

**2. 何时使用 FixedUpdate() 而不是 Update()？**

`FixedUpdate()` 以固定时间间隔运行（默认50Hz），应用于物理计算和刚体操作。`Update()` 每帧运行一次，应用于输入处理和非物理游戏逻辑。

**3. 为什么 LateUpdate() 对相机很重要？**

`LateUpdate()` 在所有 `Update()` 调用完成后运行。这确保相机跟随玩家在该帧的最终位置，防止相机在玩家移动前就移动而导致的抖动。

**4. 如何控制脚本执行顺序？**

使用 `[DefaultExecutionOrder(n)]` 属性或 Edit > Project Settings > Script Execution Order。数字越小越先执行。

**5. 当 GameObject 被禁用时协程会怎样？**

当调用 `OnDisable()` 时协程会立即停止。重新启用时不会自动恢复。必须在 `OnEnable()` 中显式重新启动。

**6. 如何防止 MonoBehaviour 中事件导致的内存泄漏？**

始终在 `OnDisable()` 或 `OnDestroy()` 中取消订阅事件。如果已销毁的 MonoBehaviour 仍然订阅着事件，事件会持有引用从而阻止垃圾回收。

**7. 多个脚本间的执行顺序是什么？**

对于多个脚本：
1. 所有 `Awake()` 方法（顺序基于脚本执行顺序设置）
2. 所有 `OnEnable()` 方法
3. 所有 `Start()` 方法
4. 所有 `FixedUpdate()` 方法（每个物理步骤）
5. 所有 `Update()` 方法
6. 所有 `LateUpdate()` 方法

### 快速参考摘要

```
+=====================================================================+
|                     生命周期快速参考                                  |
+=====================================================================+
|                                                                      |
|  方法             调用时机                   最佳用途                 |
|  ------------------------------------------------------------------ |
|  Awake()         脚本加载时               组件缓存                   |
|  OnEnable()      脚本启用时               事件订阅                   |
|  Start()         首次Update前             跨脚本初始化               |
|  FixedUpdate()   固定时间步长             物理、确定性               |
|  Update()        每帧                     输入、游戏逻辑             |
|  LateUpdate()    所有Update之后           相机、清理                 |
|  OnDisable()     脚本禁用时               取消事件订阅               |
|  OnDestroy()     脚本销毁时               资源清理                   |
|                                                                      |
|  关键规则:                                                           |
|  ---------                                                           |
|  * Awake 即使脚本禁用也会运行                                        |
|  * 所有 Awake -> 所有 OnEnable -> 所有 Start                        |
|  * FixedUpdate 每帧可能运行 0、1 或多次                              |
|  * 始终在 OnDisable 中取消订阅事件                                   |
|  * 物理用 FixedUpdate，输入用 Update，相机用 LateUpdate             |
|                                                                      |
+=====================================================================+
```

## 延伸阅读

### 官方文档

- [Unity 手册 - 执行顺序](https://docs.unity3d.com/Manual/ExecutionOrder.html)
- [Unity 脚本 API - MonoBehaviour](https://docs.unity3d.com/ScriptReference/MonoBehaviour.html)
- [Unity 手册 - 协程](https://docs.unity3d.com/Manual/Coroutines.html)
- [Unity 手册 - 时间和帧率管理](https://docs.unity3d.com/Manual/TimeFrameManagement.html)

### 进阶主题

- **Unity DOTS/ECS**：面向高性能场景的数据驱动替代方案
- **Addressables**：与生命周期集成的异步资源加载
- **Zenject/VContainer**：管理初始化顺序的依赖注入框架
- **UniTask**：作为协程替代的现代 async/await 模式
- **Unity Jobs System**：考虑主线程生命周期的多线程处理

### 相关模式

- Unity 中的单例模式
- 服务定位器模式
- 带生命周期管理的对象池
- 使用生命周期方法的状态机实现
- Update 中输入处理的命令模式

### 推荐书籍

- 《Unity in Action》 - Joe Hocking
- 《Learning C# by Developing Games with Unity》 - Harrison Ferrone
- 《游戏编程模式》 - Robert Nystrom
