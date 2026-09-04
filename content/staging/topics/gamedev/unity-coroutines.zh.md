---
title: Unity 协程深入指南
description: 精通 Unity 协程 - 理解 IEnumerator、yield 语句、时间控制和异步模式在游戏开发中的应用
track: gamedev
section: unity
difficulty: intermediate
tags:
  - Unity
  - 协程
  - C#
  - 游戏开发
  - 异步
  - IEnumerator
status: imported
origin: old/src/content/docs/gamedev/unity-coroutines.zh.md
divergence: 0.2
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: GameDev
  subcategory: ""
  order: 2
  lastUpdated: 2026-01-21
---

协程是 Unity 最强大的功能之一，用于管理基于时间的操作、序列和类异步行为，而无需多线程的复杂性。本综合指南涵盖了从基本的 yield 语句到高级模式的所有内容，帮助你掌握这一 Unity 核心技术。

## 概念解释

### 什么是协程？

**协程**是一种可以暂停执行并将控制权返回给 Unity，然后在下一帧或满足指定条件后从中断处继续执行的函数。与常规方法在单帧内从头执行到尾不同，协程可以跨越多帧同时保持其局部状态。

```csharp
// 常规方法 - 在一帧内完全执行
void RegularMethod()
{
    Debug.Log("开始");
    // 这里无法暂停
    Debug.Log("结束"); // 与"开始"在同一帧
}

// 协程 - 可以跨越多帧
IEnumerator CoroutineMethod()
{
    Debug.Log("开始");
    yield return null; // 暂停直到下一帧
    Debug.Log("结束"); // 与"开始"不在同一帧
}
```

关键点是协程在单线程上提供**协作式多任务处理**。它们不会并行运行——而是在主线程上轮流执行，在 yield 点让出控制权。

### 历史与演进

| 时期 | 技术 | Unity 背景 |
|-----|------|------------|
| 1960年代 | 协程概念（Simula） | 基础计算机科学概念 |
| 2000年代 | C# 迭代器（yield return） | Unity 利用的语言特性 |
| 2005 | Unity 1.0 | 基本协程支持 |
| 2017 | Unity 2017 | 改进的协程调试 |
| 2018 | Unity 中的 C# async/await | 替代的异步模式 |
| 2022 | Awaitable（Unity 2023） | 原生 async/await 支持 |

### 协程解决什么问题？

1. **基于时间的序列**：随时间展开的动画、过场动画、教程
2. **避免回调地狱**：无需嵌套回调的顺序异步操作
3. **帧率无关的延迟**：用 WaitForSeconds 代替帧计数
4. **资源加载**：异步资源加载而不冻结游戏
5. **状态机**：AI、游戏序列的简单状态管理
6. **轮询模式**：等待条件而不阻塞 Update

### 协程 vs 替代方案

```
┌──────────────────┬───────────────────────────────────────────────────────┐
│ 方案             │ 使用场景                                               │
├──────────────────┼───────────────────────────────────────────────────────┤
│ Update + 计时器  │ 简单延迟，但用状态跟踪污染 Update                      │
│ Invoke/InvokeRep │ 简单延迟，但控制有限且无状态                           │
│ 协程             │ 复杂序列、维护状态、基于 yield 的流程                   │
│ async/await      │ 现代 C# 模式，更适合真正的异步（I/O、网络）             │
│ UniTask          │ 零分配异步，更好的性能                                  │
│ DOTween          │ 补间动画，专门用于值变化                                │
└──────────────────┴───────────────────────────────────────────────────────┘
```

## 核心原理

### 协程内部工作原理

Unity 的协程系统基于 C# 的迭代器模式构建：

```
┌─────────────────────────────────────────────────────────────────────┐
│                    协程执行模型                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  StartCoroutine(MyCoroutine())                                      │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────┐                                               │
│  │ 创建 IEnumerator │  ◄── C# 编译器转换方法                         │
│  │ 状态机           │                                               │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────┐                                               │
│  │ 添加到 Unity 的  │  ◄── 协程调度器                                │
│  │ 协程列表         │                                               │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────────────────────────────────────┐               │
│  │              每帧循环                             │               │
│  │  ┌────────────────────────────────────────────┐  │               │
│  │  │ 对于每个活动的协程：                        │  │               │
│  │  │   1. 检查 yield 条件是否满足                │  │               │
│  │  │   2. 如果满足，调用 MoveNext()              │  │               │
│  │  │   3. 如果 MoveNext 返回 false，移除         │  │               │
│  │  │   4. 如果返回 true，检查新的 yield          │  │               │
│  │  └────────────────────────────────────────────┘  │               │
│  └──────────────────────────────────────────────────┘               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### IEnumerator 状态机

当你编写协程时，C# 编译器会将其转换为状态机：

```csharp
// 你编写的代码：
IEnumerator SimpleCoroutine()
{
    Debug.Log("状态 0");
    yield return null;
    Debug.Log("状态 1");
    yield return null;
    Debug.Log("状态 2");
}

// 编译器概念上生成的代码：
class SimpleCoroutine_StateMachine : IEnumerator
{
    private int state = 0;

    public object Current { get; private set; }

    public bool MoveNext()
    {
        switch (state)
        {
            case 0:
                Debug.Log("状态 0");
                Current = null;
                state = 1;
                return true;
            case 1:
                Debug.Log("状态 1");
                Current = null;
                state = 2;
                return true;
            case 2:
                Debug.Log("状态 2");
                state = -1;
                return false; // 协程完成
            default:
                return false;
        }
    }

    public void Reset() { }
}
```

### Yield 执行时机

理解每种 yield 类型何时恢复至关重要：

```
第 N 帧：
├── FixedUpdate（0 到多次）
│   └── yield WaitForFixedUpdate 在此恢复
├── Update
│   └── yield null 在此恢复（Update 之后，LateUpdate 之前）
│   └── yield WaitForSeconds 在此恢复（当时间到达时）
│   └── yield WWW/UnityWebRequest 在此恢复（当完成时）
├── LateUpdate
├── 渲染
│   └── yield WaitForEndOfFrame 在此恢复
└── 帧结束

第 N+1 帧：
├── ...（循环重复）
```

## 核心要点

### 基本 Yield 类型

#### yield return null

```csharp
IEnumerator WaitOneFrame()
{
    Debug.Log($"帧 {Time.frameCount}: yield 之前");
    yield return null; // 等待到下一帧
    Debug.Log($"帧 {Time.frameCount}: yield 之后");
}
```

#### yield return WaitForSeconds

```csharp
IEnumerator WaitForTime()
{
    Debug.Log("开始等待...");

    // 受 Time.timeScale 影响
    yield return new WaitForSeconds(2f);

    Debug.Log("2秒过去了（游戏时间）");
}

IEnumerator WaitRealTime()
{
    Debug.Log("开始等待...");

    // 不受 Time.timeScale 影响（适合暂停菜单）
    yield return new WaitForSecondsRealtime(2f);

    Debug.Log("2秒过去了（真实时间）");
}
```

#### yield return WaitForFixedUpdate

```csharp
IEnumerator PhysicsSync()
{
    // 等待到 FixedUpdate 之后
    yield return new WaitForFixedUpdate();

    // 此时可以安全读取物理状态
    Debug.Log($"速度: {rb.velocity}");
}
```

#### yield return WaitForEndOfFrame

```csharp
IEnumerator CaptureScreenshot()
{
    // 等待渲染完成后
    yield return new WaitForEndOfFrame();

    // 现在可以安全截屏
    Texture2D screenshot = new Texture2D(Screen.width, Screen.height);
    screenshot.ReadPixels(new Rect(0, 0, Screen.width, Screen.height), 0, 0);
    screenshot.Apply();
}
```

#### yield return WaitUntil / WaitWhile

```csharp
IEnumerator WaitForCondition()
{
    Debug.Log("等待玩家着地...");

    // 等待条件变为 true
    yield return new WaitUntil(() => player.IsGrounded);

    Debug.Log("玩家已着地！");
}

IEnumerator WaitWhileCondition()
{
    Debug.Log("等待动画结束...");

    // 在条件为 true 时等待
    yield return new WaitWhile(() => animator.IsPlaying());

    Debug.Log("动画结束！");
}
```

#### yield return 另一个协程

```csharp
IEnumerator ParentCoroutine()
{
    Debug.Log("父协程：开始");

    // 等待子协程完成
    yield return StartCoroutine(ChildCoroutine());

    Debug.Log("父协程：子协程完成，继续");
}

IEnumerator ChildCoroutine()
{
    Debug.Log("子协程：开始");
    yield return new WaitForSeconds(1f);
    Debug.Log("子协程：结束");
}
```

#### yield return AsyncOperation

```csharp
IEnumerator LoadSceneAsync()
{
    AsyncOperation asyncLoad = SceneManager.LoadSceneAsync("GameScene");
    asyncLoad.allowSceneActivation = false;

    while (asyncLoad.progress < 0.9f)
    {
        Debug.Log($"加载中: {asyncLoad.progress * 100}%");
        yield return null;
    }

    Debug.Log("场景就绪，激活中...");
    asyncLoad.allowSceneActivation = true;

    yield return asyncLoad; // 等待激活

    Debug.Log("场景已加载！");
}
```

### 启动和停止协程

```csharp
public class CoroutineControl : MonoBehaviour
{
    private Coroutine myCoroutine;

    void Start()
    {
        // 方法1：通过方法调用启动
        StartCoroutine(MyRoutine());

        // 方法2：通过字符串名称启动（较慢，应避免）
        StartCoroutine("MyRoutine");

        // 方法3：存储引用以便后续控制
        myCoroutine = StartCoroutine(MyRoutine());
    }

    void StopMyCoroutine()
    {
        // 方法1：通过引用停止（推荐）
        if (myCoroutine != null)
        {
            StopCoroutine(myCoroutine);
            myCoroutine = null;
        }

        // 方法2：通过字符串名称停止
        StopCoroutine("MyRoutine");

        // 方法3：停止此 MonoBehaviour 上的所有协程
        StopAllCoroutines();
    }

    IEnumerator MyRoutine()
    {
        while (true)
        {
            Debug.Log("运行中...");
            yield return new WaitForSeconds(1f);
        }
    }
}
```

### 自定义 Yield 指令

```csharp
// 自定义 yield 指令
public class WaitForKeyPress : CustomYieldInstruction
{
    private KeyCode keyCode;

    public WaitForKeyPress(KeyCode key)
    {
        keyCode = key;
    }

    // 返回 false 表示准备继续
    public override bool keepWaiting => !Input.GetKeyDown(keyCode);
}

// 使用
IEnumerator WaitForInput()
{
    Debug.Log("按空格键继续...");
    yield return new WaitForKeyPress(KeyCode.Space);
    Debug.Log("空格键已按下！");
}

// 更复杂的自定义 yield
public class WaitForAnimation : CustomYieldInstruction
{
    private Animator animator;
    private string stateName;
    private int layer;

    public WaitForAnimation(Animator anim, string state, int animLayer = 0)
    {
        animator = anim;
        stateName = state;
        layer = animLayer;
    }

    public override bool keepWaiting
    {
        get
        {
            var stateInfo = animator.GetCurrentAnimatorStateInfo(layer);
            return stateInfo.IsName(stateName) && stateInfo.normalizedTime < 1f;
        }
    }
}
```

## 代码示例

### 全面的协程模式

```csharp
using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class CoroutinePatterns : MonoBehaviour
{
    [Header("引用")]
    [SerializeField] private Transform target;
    [SerializeField] private float moveSpeed = 5f;

    // 缓存 yield 指令以避免 GC
    private readonly WaitForSeconds wait1s = new WaitForSeconds(1f);
    private readonly WaitForFixedUpdate waitFixed = new WaitForFixedUpdate();
    private readonly WaitForEndOfFrame waitEndFrame = new WaitForEndOfFrame();

    private Coroutine currentMovement;

    #region 基本模式

    /// <summary>
    /// 简单延迟模式
    /// </summary>
    IEnumerator DelayedAction(float delay, System.Action action)
    {
        yield return new WaitForSeconds(delay);
        action?.Invoke();
    }

    /// <summary>
    /// 重复动作模式
    /// </summary>
    IEnumerator RepeatAction(float interval, System.Action action)
    {
        var wait = new WaitForSeconds(interval);
        while (true)
        {
            action?.Invoke();
            yield return wait;
        }
    }

    /// <summary>
    /// 倒计时模式
    /// </summary>
    IEnumerator Countdown(int seconds, System.Action<int> onTick, System.Action onComplete)
    {
        for (int i = seconds; i > 0; i--)
        {
            onTick?.Invoke(i);
            yield return wait1s;
        }
        onComplete?.Invoke();
    }

    #endregion

    #region 移动模式

    /// <summary>
    /// 在指定时间内移动到位置
    /// </summary>
    IEnumerator MoveToPosition(Vector3 targetPos, float duration)
    {
        Vector3 startPos = transform.position;
        float elapsed = 0f;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / duration;

            // 应用缓动（平滑开始和结束）
            t = t * t * (3f - 2f * t); // Smoothstep

            transform.position = Vector3.Lerp(startPos, targetPos, t);
            yield return null;
        }

        transform.position = targetPos;
    }

    /// <summary>
    /// 持续跟随目标
    /// </summary>
    IEnumerator FollowTarget(Transform followTarget, float stopDistance)
    {
        while (followTarget != null)
        {
            float distance = Vector3.Distance(transform.position, followTarget.position);

            if (distance > stopDistance)
            {
                Vector3 direction = (followTarget.position - transform.position).normalized;
                transform.position += direction * moveSpeed * Time.deltaTime;
            }

            yield return null;
        }
    }

    /// <summary>
    /// 在路径点之间巡逻
    /// </summary>
    IEnumerator Patrol(Transform[] waypoints, float waitTime)
    {
        int currentIndex = 0;
        var wait = new WaitForSeconds(waitTime);

        while (true)
        {
            // 移动到当前路径点
            yield return MoveToPosition(waypoints[currentIndex].position, 1f);

            // 在路径点等待
            yield return wait;

            // 移动到下一个路径点
            currentIndex = (currentIndex + 1) % waypoints.Length;
        }
    }

    #endregion

    #region 视觉效果模式

    /// <summary>
    /// 淡入淡出对象透明度
    /// </summary>
    IEnumerator FadeAlpha(SpriteRenderer renderer, float targetAlpha, float duration)
    {
        Color startColor = renderer.color;
        Color targetColor = new Color(startColor.r, startColor.g, startColor.b, targetAlpha);
        float elapsed = 0f;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            renderer.color = Color.Lerp(startColor, targetColor, elapsed / duration);
            yield return null;
        }

        renderer.color = targetColor;
    }

    /// <summary>
    /// 闪烁效果（伤害反馈）
    /// </summary>
    IEnumerator FlashEffect(SpriteRenderer renderer, Color flashColor, int flashCount, float flashDuration)
    {
        Color originalColor = renderer.color;
        var halfWait = new WaitForSeconds(flashDuration / 2f);

        for (int i = 0; i < flashCount; i++)
        {
            renderer.color = flashColor;
            yield return halfWait;
            renderer.color = originalColor;
            yield return halfWait;
        }
    }

    /// <summary>
    /// 缩放脉冲效果
    /// </summary>
    IEnumerator PulseScale(float targetScale, float duration)
    {
        Vector3 originalScale = transform.localScale;
        Vector3 targetScaleVec = originalScale * targetScale;
        float halfDuration = duration / 2f;
        float elapsed = 0f;

        // 放大
        while (elapsed < halfDuration)
        {
            elapsed += Time.deltaTime;
            transform.localScale = Vector3.Lerp(originalScale, targetScaleVec, elapsed / halfDuration);
            yield return null;
        }

        // 缩小
        elapsed = 0f;
        while (elapsed < halfDuration)
        {
            elapsed += Time.deltaTime;
            transform.localScale = Vector3.Lerp(targetScaleVec, originalScale, elapsed / halfDuration);
            yield return null;
        }

        transform.localScale = originalScale;
    }

    #endregion

    #region 序列模式

    /// <summary>
    /// 按顺序执行动作
    /// </summary>
    IEnumerator ExecuteSequence(params System.Func<IEnumerator>[] actions)
    {
        foreach (var action in actions)
        {
            yield return StartCoroutine(action());
        }
    }

    /// <summary>
    /// 对话序列
    /// </summary>
    IEnumerator DialogSequence(string[] lines, float charDelay, System.Action<string> onDisplayText)
    {
        foreach (string line in lines)
        {
            string displayed = "";

            foreach (char c in line)
            {
                displayed += c;
                onDisplayText?.Invoke(displayed);
                yield return new WaitForSeconds(charDelay);
            }

            // 等待输入继续
            yield return new WaitUntil(() => Input.GetKeyDown(KeyCode.Space));
        }
    }

    /// <summary>
    /// 过场动画序列
    /// </summary>
    IEnumerator PlayCutscene()
    {
        // 禁用玩家控制
        PlayerController.Instance?.SetControlEnabled(false);

        // 相机平移
        yield return StartCoroutine(CameraPan(targetPosition, 2f));

        // 显示对话
        yield return StartCoroutine(ShowDialog("欢迎来到游戏！"));

        // 等待戏剧效果
        yield return new WaitForSeconds(1f);

        // 生成敌人
        yield return StartCoroutine(SpawnWithEffect(enemyPrefab, spawnPoint));

        // 相机抖动
        yield return StartCoroutine(CameraShake(0.5f, 0.3f));

        // 重新启用玩家控制
        PlayerController.Instance?.SetControlEnabled(true);
    }

    // 过场动画的辅助协程
    IEnumerator CameraPan(Vector3 target, float duration) { yield return null; }
    IEnumerator ShowDialog(string text) { yield return null; }
    IEnumerator SpawnWithEffect(GameObject prefab, Transform point) { yield return null; }
    IEnumerator CameraShake(float duration, float magnitude) { yield return null; }

    private Vector3 targetPosition;
    private GameObject enemyPrefab;
    private Transform spawnPoint;

    #endregion

    #region 资源加载模式

    /// <summary>
    /// 带进度加载多个资源
    /// </summary>
    IEnumerator LoadAssets(string[] assetPaths, System.Action<float> onProgress, System.Action onComplete)
    {
        List<ResourceRequest> requests = new List<ResourceRequest>();

        // 开始所有加载
        foreach (string path in assetPaths)
        {
            requests.Add(Resources.LoadAsync(path));
        }

        // 等待所有完成
        int completed = 0;
        while (completed < requests.Count)
        {
            completed = 0;
            float totalProgress = 0f;

            foreach (var request in requests)
            {
                totalProgress += request.progress;
                if (request.isDone) completed++;
            }

            onProgress?.Invoke(totalProgress / requests.Count);
            yield return null;
        }

        onComplete?.Invoke();
    }

    /// <summary>
    /// 带进度的场景加载
    /// </summary>
    IEnumerator LoadSceneWithProgress(string sceneName, System.Action<float> onProgress)
    {
        AsyncOperation operation = SceneManager.LoadSceneAsync(sceneName);
        operation.allowSceneActivation = false;

        while (operation.progress < 0.9f)
        {
            onProgress?.Invoke(operation.progress / 0.9f);
            yield return null;
        }

        onProgress?.Invoke(1f);

        // 在100%时稍等一下
        yield return new WaitForSeconds(0.5f);

        operation.allowSceneActivation = true;
    }

    #endregion

    #region 错误处理模式

    /// <summary>
    /// 带超时的协程
    /// </summary>
    IEnumerator WithTimeout(IEnumerator coroutine, float timeout, System.Action onTimeout)
    {
        float elapsed = 0f;

        while (elapsed < timeout)
        {
            if (!coroutine.MoveNext())
            {
                yield break; // 协程正常完成
            }

            yield return coroutine.Current;
            elapsed += Time.deltaTime;
        }

        onTimeout?.Invoke();
    }

    /// <summary>
    /// 重试模式
    /// </summary>
    IEnumerator RetryOperation(System.Func<IEnumerator> operation, int maxRetries, float retryDelay)
    {
        int attempts = 0;
        bool success = false;

        while (attempts < maxRetries && !success)
        {
            attempts++;

            var routine = operation();
            bool hasError = false;

            while (routine.MoveNext())
            {
                // 检查当前是否有错误
                if (routine.Current is System.Exception)
                {
                    hasError = true;
                    break;
                }
                yield return routine.Current;
            }

            if (!hasError)
            {
                success = true;
            }
            else if (attempts < maxRetries)
            {
                Debug.Log($"第 {attempts} 次尝试失败，重试中...");
                yield return new WaitForSeconds(retryDelay);
            }
        }

        if (!success)
        {
            Debug.LogError("所有重试尝试均失败");
        }
    }

    #endregion
}
```

### 协程管理器工具

```csharp
using UnityEngine;
using System.Collections;
using System.Collections.Generic;

/// <summary>
/// 集中式协程管理，支持命名协程和分组
/// </summary>
public class CoroutineManager : MonoBehaviour
{
    private static CoroutineManager instance;
    public static CoroutineManager Instance
    {
        get
        {
            if (instance == null)
            {
                var go = new GameObject("CoroutineManager");
                instance = go.AddComponent<CoroutineManager>();
                DontDestroyOnLoad(go);
            }
            return instance;
        }
    }

    private Dictionary<string, Coroutine> namedCoroutines = new Dictionary<string, Coroutine>();
    private Dictionary<string, List<Coroutine>> coroutineGroups = new Dictionary<string, List<Coroutine>>();

    /// <summary>
    /// 启动命名协程（如果存在则自动停止之前的）
    /// </summary>
    public Coroutine StartNamed(string name, IEnumerator routine)
    {
        StopNamed(name);
        var coroutine = StartCoroutine(TrackCoroutine(name, routine));
        namedCoroutines[name] = coroutine;
        return coroutine;
    }

    /// <summary>
    /// 停止命名协程
    /// </summary>
    public void StopNamed(string name)
    {
        if (namedCoroutines.TryGetValue(name, out var coroutine))
        {
            if (coroutine != null)
            {
                StopCoroutine(coroutine);
            }
            namedCoroutines.Remove(name);
        }
    }

    /// <summary>
    /// 在组中启动协程
    /// </summary>
    public Coroutine StartInGroup(string groupName, IEnumerator routine)
    {
        if (!coroutineGroups.ContainsKey(groupName))
        {
            coroutineGroups[groupName] = new List<Coroutine>();
        }

        var coroutine = StartCoroutine(routine);
        coroutineGroups[groupName].Add(coroutine);
        return coroutine;
    }

    /// <summary>
    /// 停止组中的所有协程
    /// </summary>
    public void StopGroup(string groupName)
    {
        if (coroutineGroups.TryGetValue(groupName, out var coroutines))
        {
            foreach (var coroutine in coroutines)
            {
                if (coroutine != null)
                {
                    StopCoroutine(coroutine);
                }
            }
            coroutines.Clear();
        }
    }

    /// <summary>
    /// 运行跨场景持久的协程
    /// </summary>
    public Coroutine StartPersistent(IEnumerator routine)
    {
        return StartCoroutine(routine);
    }

    /// <summary>
    /// 延迟执行
    /// </summary>
    public Coroutine Delay(float seconds, System.Action action)
    {
        return StartCoroutine(DelayRoutine(seconds, action));
    }

    /// <summary>
    /// 延迟执行（真实时间）
    /// </summary>
    public Coroutine DelayRealtime(float seconds, System.Action action)
    {
        return StartCoroutine(DelayRealtimeRoutine(seconds, action));
    }

    /// <summary>
    /// 下一帧执行
    /// </summary>
    public Coroutine NextFrame(System.Action action)
    {
        return StartCoroutine(NextFrameRoutine(action));
    }

    /// <summary>
    /// 帧末执行
    /// </summary>
    public Coroutine EndOfFrame(System.Action action)
    {
        return StartCoroutine(EndOfFrameRoutine(action));
    }

    private IEnumerator TrackCoroutine(string name, IEnumerator routine)
    {
        yield return routine;
        namedCoroutines.Remove(name);
    }

    private IEnumerator DelayRoutine(float seconds, System.Action action)
    {
        yield return new WaitForSeconds(seconds);
        action?.Invoke();
    }

    private IEnumerator DelayRealtimeRoutine(float seconds, System.Action action)
    {
        yield return new WaitForSecondsRealtime(seconds);
        action?.Invoke();
    }

    private IEnumerator NextFrameRoutine(System.Action action)
    {
        yield return null;
        action?.Invoke();
    }

    private IEnumerator EndOfFrameRoutine(System.Action action)
    {
        yield return new WaitForEndOfFrame();
        action?.Invoke();
    }
}

// 使用示例
public class CoroutineManagerUsage : MonoBehaviour
{
    void Start()
    {
        // 延迟动作
        CoroutineManager.Instance.Delay(2f, () => Debug.Log("2秒过去了"));

        // 命名协程（再次调用时自动替换）
        CoroutineManager.Instance.StartNamed("PlayerMovement", MovePlayer());

        // 分组协程（可一次性停止所有）
        CoroutineManager.Instance.StartInGroup("Enemies", EnemyBehavior());
        CoroutineManager.Instance.StartInGroup("Enemies", EnemyBehavior());
        // 稍后: CoroutineManager.Instance.StopGroup("Enemies");
    }

    IEnumerator MovePlayer() { yield return null; }
    IEnumerator EnemyBehavior() { yield return null; }
}
```

### 基于协程的状态机

```csharp
using UnityEngine;
using System.Collections;

public class CoroutineStateMachine : MonoBehaviour
{
    public enum AIState { Idle, Patrol, Chase, Attack, Flee }

    [SerializeField] private AIState currentState = AIState.Idle;
    [SerializeField] private float detectionRange = 10f;
    [SerializeField] private float attackRange = 2f;

    private Transform player;
    private Coroutine currentStateCoroutine;

    void Start()
    {
        player = GameObject.FindWithTag("Player")?.transform;
        TransitionToState(AIState.Idle);
    }

    public void TransitionToState(AIState newState)
    {
        // 停止当前状态协程
        if (currentStateCoroutine != null)
        {
            StopCoroutine(currentStateCoroutine);
        }

        // 退出当前状态
        ExitState(currentState);

        // 进入新状态
        currentState = newState;
        EnterState(newState);

        // 启动新状态协程
        currentStateCoroutine = StartCoroutine(GetStateCoroutine(newState));
    }

    private void EnterState(AIState state)
    {
        Debug.Log($"进入状态: {state}");

        switch (state)
        {
            case AIState.Idle:
                // 播放待机动画
                break;
            case AIState.Patrol:
                // 播放行走动画
                break;
            case AIState.Chase:
                // 播放奔跑动画，警报声
                break;
            case AIState.Attack:
                // 播放攻击动画
                break;
            case AIState.Flee:
                // 播放奔跑动画，逃跑声
                break;
        }
    }

    private void ExitState(AIState state)
    {
        Debug.Log($"退出状态: {state}");
        // 每个状态的清理
    }

    private IEnumerator GetStateCoroutine(AIState state)
    {
        switch (state)
        {
            case AIState.Idle: return IdleState();
            case AIState.Patrol: return PatrolState();
            case AIState.Chase: return ChaseState();
            case AIState.Attack: return AttackState();
            case AIState.Flee: return FleeState();
            default: return IdleState();
        }
    }

    private IEnumerator IdleState()
    {
        float idleTime = Random.Range(2f, 5f);
        float elapsed = 0f;

        while (elapsed < idleTime)
        {
            // 检查玩家检测
            if (IsPlayerInRange(detectionRange))
            {
                TransitionToState(AIState.Chase);
                yield break;
            }

            elapsed += Time.deltaTime;
            yield return null;
        }

        // 待机后开始巡逻
        TransitionToState(AIState.Patrol);
    }

    private IEnumerator PatrolState()
    {
        Vector3[] waypoints = GetPatrolWaypoints();
        int currentWaypoint = 0;

        while (true)
        {
            // 检查玩家检测
            if (IsPlayerInRange(detectionRange))
            {
                TransitionToState(AIState.Chase);
                yield break;
            }

            // 向路径点移动
            Vector3 target = waypoints[currentWaypoint];
            while (Vector3.Distance(transform.position, target) > 0.5f)
            {
                // 移动期间检查玩家
                if (IsPlayerInRange(detectionRange))
                {
                    TransitionToState(AIState.Chase);
                    yield break;
                }

                MoveToward(target);
                yield return null;
            }

            // 在路径点等待
            yield return new WaitForSeconds(1f);

            // 下一个路径点
            currentWaypoint = (currentWaypoint + 1) % waypoints.Length;
        }
    }

    private IEnumerator ChaseState()
    {
        while (true)
        {
            if (player == null)
            {
                TransitionToState(AIState.Idle);
                yield break;
            }

            float distance = Vector3.Distance(transform.position, player.position);

            // 丢失玩家
            if (distance > detectionRange * 1.5f)
            {
                TransitionToState(AIState.Patrol);
                yield break;
            }

            // 在攻击范围内
            if (distance < attackRange)
            {
                TransitionToState(AIState.Attack);
                yield break;
            }

            // 追逐玩家
            MoveToward(player.position);
            yield return null;
        }
    }

    private IEnumerator AttackState()
    {
        // 执行攻击
        Debug.Log("攻击！");
        yield return new WaitForSeconds(1f); // 攻击动画时间

        // 检查是否继续攻击或追逐
        float distance = Vector3.Distance(transform.position, player.position);

        if (distance > attackRange)
        {
            TransitionToState(AIState.Chase);
        }
        else
        {
            // 再次攻击
            TransitionToState(AIState.Attack);
        }
    }

    private IEnumerator FleeState()
    {
        float fleeTime = 3f;
        float elapsed = 0f;

        while (elapsed < fleeTime)
        {
            if (player != null)
            {
                // 远离玩家移动
                Vector3 fleeDirection = (transform.position - player.position).normalized;
                transform.position += fleeDirection * 5f * Time.deltaTime;
            }

            elapsed += Time.deltaTime;
            yield return null;
        }

        TransitionToState(AIState.Idle);
    }

    private bool IsPlayerInRange(float range)
    {
        if (player == null) return false;
        return Vector3.Distance(transform.position, player.position) < range;
    }

    private void MoveToward(Vector3 target)
    {
        Vector3 direction = (target - transform.position).normalized;
        transform.position += direction * 3f * Time.deltaTime;
    }

    private Vector3[] GetPatrolWaypoints()
    {
        return new Vector3[]
        {
            transform.position + Vector3.right * 5f,
            transform.position + Vector3.forward * 5f,
            transform.position - Vector3.right * 5f,
            transform.position - Vector3.forward * 5f
        };
    }
}
```

## 最佳实践

### 1. 缓存 Yield 指令

```csharp
public class CachedYields : MonoBehaviour
{
    // 应该：缓存常用的 yield
    private static readonly WaitForEndOfFrame WaitEndFrame = new WaitForEndOfFrame();
    private static readonly WaitForFixedUpdate WaitFixed = new WaitForFixedUpdate();
    private readonly WaitForSeconds wait1s = new WaitForSeconds(1f);
    private readonly WaitForSeconds wait05s = new WaitForSeconds(0.5f);

    // 对于动态等待，考虑字典缓存
    private Dictionary<float, WaitForSeconds> waitCache = new Dictionary<float, WaitForSeconds>();

    private WaitForSeconds GetWait(float seconds)
    {
        if (!waitCache.TryGetValue(seconds, out var wait))
        {
            wait = new WaitForSeconds(seconds);
            waitCache[seconds] = wait;
        }
        return wait;
    }

    IEnumerator GoodCoroutine()
    {
        while (true)
        {
            yield return wait1s; // 无 GC 分配
        }
    }

    // 不应该：每次迭代创建新的 yield
    IEnumerator BadCoroutine()
    {
        while (true)
        {
            yield return new WaitForSeconds(1f); // 每秒都有 GC 分配！
        }
    }
}
```

### 2. 始终处理协程生命周期

```csharp
public class CoroutineLifecycleManagement : MonoBehaviour
{
    private Coroutine activeCoroutine;
    private bool isRunning = false;

    void OnEnable()
    {
        // 启用时开始协程
        StartMyCoroutine();
    }

    void OnDisable()
    {
        // 禁用时始终停止协程
        StopMyCoroutine();
    }

    void OnDestroy()
    {
        // 销毁时清理（OnDisable 会先调用，但要安全）
        StopMyCoroutine();
    }

    public void StartMyCoroutine()
    {
        if (!isRunning)
        {
            activeCoroutine = StartCoroutine(MyRoutine());
            isRunning = true;
        }
    }

    public void StopMyCoroutine()
    {
        if (activeCoroutine != null)
        {
            StopCoroutine(activeCoroutine);
            activeCoroutine = null;
        }
        isRunning = false;
    }

    IEnumerator MyRoutine()
    {
        while (true)
        {
            // 工作
            yield return null;
        }
    }
}
```

### 3. 使用协程引用而非字符串名称

```csharp
public class CoroutineReferences : MonoBehaviour
{
    // 应该：使用引用
    private Coroutine myRoutine;

    void Start()
    {
        myRoutine = StartCoroutine(MyRoutine());
    }

    void Stop()
    {
        if (myRoutine != null)
        {
            StopCoroutine(myRoutine);
            myRoutine = null;
        }
    }

    // 不应该：使用字符串名称（较慢，易出错）
    void BadStart()
    {
        StartCoroutine("MyRoutine"); // 使用反射
    }

    void BadStop()
    {
        StopCoroutine("MyRoutine"); // 编译时无法捕获拼写错误
    }

    IEnumerator MyRoutine()
    {
        yield return null;
    }
}
```

### 4. 保持协程简单和专注

```csharp
public class FocusedCoroutines : MonoBehaviour
{
    // 应该：单一职责的协程
    IEnumerator FadeOut(CanvasGroup group, float duration)
    {
        float startAlpha = group.alpha;
        float elapsed = 0f;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            group.alpha = Mathf.Lerp(startAlpha, 0f, elapsed / duration);
            yield return null;
        }

        group.alpha = 0f;
    }

    IEnumerator DisableAfterDelay(GameObject obj, float delay)
    {
        yield return new WaitForSeconds(delay);
        obj.SetActive(false);
    }

    // 组合简单协程实现复杂行为
    IEnumerator FadeAndDisable(CanvasGroup group, GameObject obj, float fadeDuration)
    {
        yield return FadeOut(group, fadeDuration);
        yield return DisableAfterDelay(obj, 0f);
    }

    // 不应该：做所有事情的巨型协程
    IEnumerator DoEverything()
    {
        // 数百行混合关注点的代码...
    }
}
```

### 5. 使协程可暂停和可恢复

```csharp
public class ControllableCoroutine : MonoBehaviour
{
    private bool isPaused = false;
    private bool shouldStop = false;

    public void Pause() => isPaused = true;
    public void Resume() => isPaused = false;
    public void Stop() => shouldStop = true;

    IEnumerator ControllableRoutine()
    {
        shouldStop = false;

        while (!shouldStop)
        {
            // 处理暂停
            while (isPaused && !shouldStop)
            {
                yield return null;
            }

            if (shouldStop) break;

            // 执行工作
            Debug.Log("工作中...");
            yield return new WaitForSeconds(0.5f);
        }

        Debug.Log("协程干净地停止了");
    }
}
```

## 常见陷阱

### 1. 当 GameObject/组件被禁用时协程停止

```csharp
public class DisablePitfall : MonoBehaviour
{
    void Start()
    {
        StartCoroutine(LongRunningTask());
    }

    IEnumerator LongRunningTask()
    {
        Debug.Log("开始任务...");
        yield return new WaitForSeconds(10f);
        Debug.Log("任务完成！"); // 如果对象被禁用则永远不会调用！
    }

    // 解决方案：使用持久管理器
    void StartPersistentTask()
    {
        CoroutineManager.Instance.StartPersistent(LongRunningTask());
    }
}
```

### 2. WaitForSeconds 受 TimeScale 影响

```csharp
public class TimeScalePitfall : MonoBehaviour
{
    IEnumerator PauseMenuTimer()
    {
        // 问题：当游戏暂停（timeScale = 0）时，这永远不会完成
        yield return new WaitForSeconds(5f);
        Debug.Log("计时器完成");
    }

    IEnumerator CorrectPauseMenuTimer()
    {
        // 解决方案：使用 WaitForSecondsRealtime
        yield return new WaitForSecondsRealtime(5f);
        Debug.Log("计时器完成（即使暂停也能完成）");
    }
}
```

### 3. 访问已销毁的对象

```csharp
public class DestroyedObjectPitfall : MonoBehaviour
{
    [SerializeField] private GameObject target;

    void Start()
    {
        StartCoroutine(TrackTarget());
        Destroy(target, 2f); // 目标在2秒后销毁
    }

    IEnumerator TrackTarget()
    {
        while (true)
        {
            // 问题：目标销毁后 NullReferenceException
            Debug.Log(target.transform.position);
            yield return null;
        }
    }

    IEnumerator SafeTrackTarget()
    {
        while (target != null) // 解决方案：空值检查
        {
            Debug.Log(target.transform.position);
            yield return null;
        }
        Debug.Log("目标被销毁了");
    }
}
```

### 4. 不存储协程引用

```csharp
public class ReferencesPitfall : MonoBehaviour
{
    void Start()
    {
        // 问题：无法停止这个协程！
        StartCoroutine(EndlessTask());
    }

    IEnumerator EndlessTask()
    {
        while (true)
        {
            Debug.Log("运行中...");
            yield return new WaitForSeconds(1f);
        }
    }

    // 解决方案
    private Coroutine endlessCoroutine;

    void StartProperly()
    {
        endlessCoroutine = StartCoroutine(EndlessTask());
    }

    void StopProperly()
    {
        if (endlessCoroutine != null)
        {
            StopCoroutine(endlessCoroutine);
            endlessCoroutine = null;
        }
    }
}
```

### 5. 多次启动同一协程

```csharp
public class DuplicateCoroutinePitfall : MonoBehaviour
{
    private bool isMoving = false;

    public void MoveToTarget()
    {
        // 问题：快速调用会启动多个协程！
        StartCoroutine(MoveTo(target));
    }

    // 解决方案1：守护标志
    public void MoveToTargetSafe()
    {
        if (!isMoving)
        {
            StartCoroutine(MoveToGuarded(target));
        }
    }

    IEnumerator MoveToGuarded(Vector3 target)
    {
        isMoving = true;
        // ... 移动代码
        yield return null;
        isMoving = false;
    }

    // 解决方案2：启动新的之前停止之前的
    private Coroutine moveCoroutine;

    public void MoveToTargetReplace()
    {
        if (moveCoroutine != null)
        {
            StopCoroutine(moveCoroutine);
        }
        moveCoroutine = StartCoroutine(MoveTo(target));
    }

    private Vector3 target;
    IEnumerator MoveTo(Vector3 t) { yield return null; }
}
```

### 6. 没有 yield 的无限循环

```csharp
public class InfiniteLoopPitfall : MonoBehaviour
{
    IEnumerator BrokenCoroutine()
    {
        // 问题：循环中没有 yield = Unity 冻结！
        while (true)
        {
            Debug.Log("工作中...");
            // 缺少 yield！
        }
    }

    IEnumerator CorrectCoroutine()
    {
        while (true)
        {
            Debug.Log("工作中...");
            yield return null; // 无限循环中始终要 yield！
        }
    }
}
```

## 性能考量

### 内存分配

```csharp
public class CoroutinePerformance : MonoBehaviour
{
    // 每次 StartCoroutine 分配：
    // - Coroutine 对象约 40 字节
    // - 状态机对象（取决于局部变量）

    // 差：每帧分配
    void Update()
    {
        StartCoroutine(QuickTask()); // 不要这样做！
    }

    IEnumerator QuickTask()
    {
        // 单帧任务
        yield return null;
    }

    // 好：重用长时间运行的协程
    private Coroutine continuousTask;

    void Start()
    {
        continuousTask = StartCoroutine(ContinuousTask());
    }

    IEnumerator ContinuousTask()
    {
        while (true)
        {
            // 每帧执行工作而不分配
            yield return null;
        }
    }
}
```

### 协程数量限制

```csharp
public class CoroutineLimits : MonoBehaviour
{
    // Unity 可以处理数千个协程，但有开销
    // 对于非常高的数量考虑替代方案

    // 差：10,000 个独立协程
    void SpawnManyBad()
    {
        for (int i = 0; i < 10000; i++)
        {
            StartCoroutine(IndividualTask(i));
        }
    }

    IEnumerator IndividualTask(int id)
    {
        yield return new WaitForSeconds(Random.Range(1f, 5f));
        Debug.Log($"任务 {id} 完成");
    }

    // 好：单个协程管理多个项目
    void SpawnManyGood()
    {
        StartCoroutine(BatchTask(10000));
    }

    IEnumerator BatchTask(int count)
    {
        var items = new List<(int id, float delay)>();

        for (int i = 0; i < count; i++)
        {
            items.Add((i, Time.time + Random.Range(1f, 5f)));
        }

        items.Sort((a, b) => a.delay.CompareTo(b.delay));

        foreach (var item in items)
        {
            float waitTime = item.delay - Time.time;
            if (waitTime > 0)
            {
                yield return new WaitForSeconds(waitTime);
            }
            Debug.Log($"任务 {item.id} 完成");
        }
    }
}
```

### 何时使用替代方案

```csharp
public class CoroutineAlternatives : MonoBehaviour
{
    // 简单延迟：考虑 Invoke
    void SimpleDelay()
    {
        Invoke(nameof(DelayedMethod), 2f);
    }

    void DelayedMethod() { }

    // 值动画：考虑 DOTween/LeanTween
    // transform.DOMove(target, 1f); // 一行代替协程

    // 高性能异步：考虑 UniTask
    // async UniTaskVoid LoadAsync()
    // {
    //     await UniTask.Delay(1000);
    //     var result = await SomeAsyncOperation();
    // }

    // 许多简单计时器：考虑计时器管理器
    void UseTimerManager()
    {
        TimerManager.Instance.CreateTimer(2f, () => Debug.Log("完成"));
    }
}
```

## 实战场景

### 教程序列

```csharp
using UnityEngine;
using System.Collections;
using UnityEngine.UI;

public class TutorialSequence : MonoBehaviour
{
    [SerializeField] private CanvasGroup tutorialPanel;
    [SerializeField] private Text instructionText;
    [SerializeField] private GameObject highlightArrow;
    [SerializeField] private Transform[] highlightTargets;

    private bool waitingForInput = false;

    void Start()
    {
        StartCoroutine(RunTutorial());
    }

    IEnumerator RunTutorial()
    {
        // 淡入教程面板
        yield return FadeCanvasGroup(tutorialPanel, 0f, 1f, 0.5f);

        // 步骤1：移动
        yield return ShowTutorialStep(
            "使用 WASD 键移动你的角色。",
            highlightTargets[0],
            () => Input.GetAxis("Horizontal") != 0 || Input.GetAxis("Vertical") != 0
        );

        // 步骤之间短暂暂停
        yield return new WaitForSeconds(0.5f);

        // 步骤2：跳跃
        yield return ShowTutorialStep(
            "按空格键跳跃。",
            highlightTargets[1],
            () => Input.GetKeyDown(KeyCode.Space)
        );

        yield return new WaitForSeconds(0.5f);

        // 步骤3：攻击
        yield return ShowTutorialStep(
            "点击鼠标左键攻击。",
            highlightTargets[2],
            () => Input.GetMouseButtonDown(0)
        );

        // 教程完成
        instructionText.text = "教程完成！祝你好运！";
        highlightArrow.SetActive(false);

        yield return new WaitForSeconds(2f);

        // 淡出
        yield return FadeCanvasGroup(tutorialPanel, 1f, 0f, 0.5f);
        tutorialPanel.gameObject.SetActive(false);
    }

    IEnumerator ShowTutorialStep(string instruction, Transform highlight, System.Func<bool> completionCondition)
    {
        // 显示指令
        instructionText.text = instruction;

        // 定位高亮箭头
        if (highlight != null)
        {
            highlightArrow.SetActive(true);
            highlightArrow.transform.position = highlight.position + Vector3.up * 2f;
        }

        // 等待玩家完成动作
        yield return new WaitUntil(completionCondition);

        // 成功反馈
        instructionText.text = "很好！";
        yield return new WaitForSeconds(0.5f);
    }

    IEnumerator FadeCanvasGroup(CanvasGroup group, float from, float to, float duration)
    {
        float elapsed = 0f;
        group.alpha = from;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            group.alpha = Mathf.Lerp(from, to, elapsed / duration);
            yield return null;
        }

        group.alpha = to;
    }
}
```

### 生成波次系统

```csharp
using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class WaveSpawner : MonoBehaviour
{
    [System.Serializable]
    public class Wave
    {
        public string waveName;
        public EnemySpawn[] enemies;
        public float delayBeforeWave = 3f;
    }

    [System.Serializable]
    public class EnemySpawn
    {
        public GameObject prefab;
        public int count;
        public float spawnInterval = 0.5f;
        public Transform[] spawnPoints;
    }

    [SerializeField] private Wave[] waves;
    [SerializeField] private float delayBetweenWaves = 5f;

    public event System.Action<int, string> OnWaveStarted;
    public event System.Action<int> OnWaveCompleted;
    public event System.Action OnAllWavesCompleted;

    private List<GameObject> activeEnemies = new List<GameObject>();
    private int currentWaveIndex = 0;
    private Coroutine waveCoroutine;

    public void StartWaves()
    {
        if (waveCoroutine != null) StopCoroutine(waveCoroutine);
        waveCoroutine = StartCoroutine(WaveSequence());
    }

    public void StopWaves()
    {
        if (waveCoroutine != null)
        {
            StopCoroutine(waveCoroutine);
            waveCoroutine = null;
        }
    }

    IEnumerator WaveSequence()
    {
        for (currentWaveIndex = 0; currentWaveIndex < waves.Length; currentWaveIndex++)
        {
            Wave wave = waves[currentWaveIndex];

            // 波次前延迟
            yield return new WaitForSeconds(wave.delayBeforeWave);

            // 宣布波次
            OnWaveStarted?.Invoke(currentWaveIndex + 1, wave.waveName);

            // 生成此波次的所有敌人
            yield return SpawnWave(wave);

            // 等待所有敌人被击败
            yield return new WaitUntil(() => activeEnemies.Count == 0);

            // 波次完成
            OnWaveCompleted?.Invoke(currentWaveIndex + 1);

            // 下一波前延迟（最后一波除外）
            if (currentWaveIndex < waves.Length - 1)
            {
                yield return new WaitForSeconds(delayBetweenWaves);
            }
        }

        OnAllWavesCompleted?.Invoke();
    }

    IEnumerator SpawnWave(Wave wave)
    {
        foreach (EnemySpawn spawn in wave.enemies)
        {
            yield return SpawnEnemyGroup(spawn);
        }
    }

    IEnumerator SpawnEnemyGroup(EnemySpawn spawn)
    {
        var wait = new WaitForSeconds(spawn.spawnInterval);

        for (int i = 0; i < spawn.count; i++)
        {
            // 选择随机生成点
            Transform spawnPoint = spawn.spawnPoints[Random.Range(0, spawn.spawnPoints.Length)];

            // 生成敌人
            GameObject enemy = Instantiate(spawn.prefab, spawnPoint.position, spawnPoint.rotation);
            activeEnemies.Add(enemy);

            // 订阅死亡事件
            var health = enemy.GetComponent<Health>();
            if (health != null)
            {
                health.OnDeath += () => OnEnemyDeath(enemy);
            }

            yield return wait;
        }
    }

    private void OnEnemyDeath(GameObject enemy)
    {
        activeEnemies.Remove(enemy);
    }
}
```

### 带进度的加载屏幕

```csharp
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;

public class LoadingScreenManager : MonoBehaviour
{
    [SerializeField] private GameObject loadingScreen;
    [SerializeField] private Slider progressBar;
    [SerializeField] private Text progressText;
    [SerializeField] private Text tipText;
    [SerializeField] private string[] loadingTips;

    private static LoadingScreenManager instance;

    void Awake()
    {
        if (instance == null)
        {
            instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public static void LoadScene(string sceneName, string[] additionalAssets = null)
    {
        instance.StartCoroutine(instance.LoadSceneRoutine(sceneName, additionalAssets));
    }

    IEnumerator LoadSceneRoutine(string sceneName, string[] additionalAssets)
    {
        // 显示加载屏幕
        loadingScreen.SetActive(true);
        progressBar.value = 0f;
        progressText.text = "加载中...";

        // 开始提示轮换
        Coroutine tipCoroutine = StartCoroutine(RotateTips());

        // 跟踪总进度
        float sceneWeight = 0.7f;
        float assetsWeight = 0.3f;

        // 异步加载场景
        AsyncOperation sceneLoad = SceneManager.LoadSceneAsync(sceneName);
        sceneLoad.allowSceneActivation = false;

        while (sceneLoad.progress < 0.9f)
        {
            float sceneProgress = sceneLoad.progress / 0.9f;
            UpdateProgress(sceneProgress * sceneWeight, "加载场景中...");
            yield return null;
        }

        UpdateProgress(sceneWeight, "场景已加载...");

        // 如果有额外资源则加载
        if (additionalAssets != null && additionalAssets.Length > 0)
        {
            List<ResourceRequest> assetLoads = new List<ResourceRequest>();

            foreach (string asset in additionalAssets)
            {
                assetLoads.Add(Resources.LoadAsync(asset));
            }

            bool allDone = false;
            while (!allDone)
            {
                allDone = true;
                float totalAssetProgress = 0f;

                foreach (var load in assetLoads)
                {
                    totalAssetProgress += load.progress;
                    if (!load.isDone) allDone = false;
                }

                float assetProgress = totalAssetProgress / assetLoads.Count;
                UpdateProgress(sceneWeight + assetProgress * assetsWeight, "加载资源中...");
                yield return null;
            }
        }

        UpdateProgress(1f, "完成中...");

        // 为 UX 保持最小加载时间
        yield return new WaitForSeconds(0.5f);

        // 停止提示
        StopCoroutine(tipCoroutine);

        // 激活场景
        sceneLoad.allowSceneActivation = true;

        // 等待场景激活
        yield return new WaitUntil(() => sceneLoad.isDone);

        // 隐藏加载屏幕
        loadingScreen.SetActive(false);
    }

    void UpdateProgress(float progress, string status)
    {
        progressBar.value = progress;
        progressText.text = $"{status} ({Mathf.RoundToInt(progress * 100)}%)";
    }

    IEnumerator RotateTips()
    {
        while (true)
        {
            tipText.text = loadingTips[Random.Range(0, loadingTips.Length)];
            yield return new WaitForSeconds(3f);
        }
    }
}
```

## 面试要点

### 核心问题

**Q1: 什么是协程，它与普通方法有什么区别？**

协程是一种可以暂停执行并将控制权返回给 Unity，然后从中断处恢复的方法。与普通方法在一帧内完成不同，协程可以跨越多帧同时保持局部状态。它们使用 `IEnumerator` 返回类型和 `yield` 语句来控制执行流程。

**Q2: 解释不同的 yield 类型及其使用时机。**

- `yield return null`：等待一帧，在 Update 之后恢复
- `yield return new WaitForSeconds(n)`：等待 n 秒（受 timeScale 影响）
- `yield return new WaitForSecondsRealtime(n)`：等待 n 真实秒（忽略 timeScale）
- `yield return new WaitForFixedUpdate()`：等待到 FixedUpdate 之后
- `yield return new WaitForEndOfFrame()`：等待到渲染之后
- `yield return new WaitUntil(condition)`：等待条件为 true
- `yield return StartCoroutine(other)`：等待另一个协程完成

**Q3: 当你禁用带有运行中协程的 GameObject 时会发生什么？**

该 GameObject（及其子对象）上 MonoBehaviour 的所有协程会立即停止。重新启用时它们不会自动恢复——你必须手动重新启动它们。

### 实践问题

**Q4: 如何正确停止协程？**

```csharp
// 存储引用
private Coroutine myCoroutine;

void Start()
{
    myCoroutine = StartCoroutine(MyRoutine());
}

void Stop()
{
    if (myCoroutine != null)
    {
        StopCoroutine(myCoroutine);
        myCoroutine = null;
    }
}
```

使用引用优于字符串名称，因为它更快且能在编译时捕获错误。

**Q5: 如何优化协程以避免垃圾回收？**

1. 缓存 `WaitForSeconds` 和其他 yield 指令而不是创建新的
2. 不要每帧启动协程
3. 重用长时间运行的协程而不是频繁启动/停止
4. 考虑零分配异步的替代方案如 UniTask

**Q6: 如何实现可暂停的协程？**

```csharp
private bool isPaused = false;

IEnumerator PausableRoutine()
{
    while (true)
    {
        while (isPaused)
        {
            yield return null;
        }
        // 执行工作
        yield return new WaitForSeconds(1f);
    }
}
```

### 高级问题

**Q7: 何时应该使用协程 vs async/await？**

- **协程**：基于帧的时间控制、Unity 生命周期集成、依赖 MonoBehaviour 的操作
- **async/await**：真正的异步操作（文件 I/O、网络请求）、更清晰的错误处理、可在 MonoBehaviour 外使用

**Q8: Unity 的协程调度器内部如何工作？**

Unity 维护一个活动协程列表。每帧，它遍历此列表，检查每个协程的 yield 条件是否满足，如果满足则调用 IEnumerator 的 `MoveNext()`。如果 `MoveNext()` 返回 false，则从列表中移除该协程。

## 延伸阅读

### 官方文档

- [Unity 手册：协程](https://docs.unity3d.com/Manual/Coroutines.html)
- [Unity 脚本 API：MonoBehaviour.StartCoroutine](https://docs.unity3d.com/ScriptReference/MonoBehaviour.StartCoroutine.html)
- [Unity 脚本 API：YieldInstruction](https://docs.unity3d.com/ScriptReference/YieldInstruction.html)
- [Unity 脚本 API：CustomYieldInstruction](https://docs.unity3d.com/ScriptReference/CustomYieldInstruction.html)

### 进阶主题

- **UniTask**：零分配的高性能 async/await 替代方案
- **Unity 的 Awaitable**：Unity 2023+ 中的原生 async/await 支持
- **DOTween/LeanTween**：专门用于动画的补间库
- **响应式扩展**：基于 Observable 的异步模式

### 书籍和教程

- 《Unity in Action》 - Joe Hocking - 协程章节
- Unity Learn：中级脚本编程
- Brackeys YouTube：协程教程系列

### 相关概念

- C# 迭代器模式和 IEnumerator
- Unity 执行顺序
- Unity 时间管理
- 状态机模式

---

协程是 Unity 中管理基于时间操作的强大工具。通过理解它们的内部工作原理、遵循生命周期管理和垃圾回收的最佳实践，以及知道何时使用替代方案，你可以为复杂的游戏序列、动画和异步操作创建干净、高效和可维护的代码。
