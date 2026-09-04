---
title: 游戏循环与帧率控制
description: 深入理解游戏循环的工作原理，掌握固定时间步长、可变时间步长和帧率控制技术
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - 游戏循环
  - 帧率
  - 时间步长
  - 性能
status: imported
origin: old/src/content/docs/gamedev/game-loop.zh.md
divergence: 0.189
issues: []
legacy:
  category: GameDev
  subcategory: Fundamentals
  order: 1
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是游戏循环

游戏循环（Game Loop）是游戏引擎的心脏，它是一个持续运行的循环，负责协调游戏中所有系统的更新和渲染。与传统的事件驱动程序不同，游戏需要持续不断地更新状态、处理输入、模拟物理、渲染画面，即使玩家没有任何操作。

一个最简单的游戏循环可以表示为：

```
while (游戏运行中) {
    处理输入();
    更新游戏状态();
    渲染画面();
}
```

这个看似简单的循环背后隐藏着许多复杂的问题：如何保证游戏在不同硬件上以相同的速度运行？如何在低端设备上保持流畅？如何让物理模拟保持稳定？

### 为什么需要游戏循环

传统的桌面应用程序采用事件驱动模型，只有在用户操作（点击、输入等）时才需要响应。但游戏不同，即使玩家静止不动：

- 敌人仍在移动和思考
- 粒子特效持续播放
- 物理模拟持续运算
- 动画需要持续更新
- AI 需要做出决策

游戏循环确保这一切能够持续、稳定地进行，同时保持对玩家输入的即时响应。

### 帧率与时间步长

**帧率（Frame Rate / FPS）** 是指每秒钟渲染的画面数量。常见的目标帧率包括：

| 帧率 | 每帧时间 | 典型应用场景 |
|------|----------|--------------|
| 30 FPS | 33.33 ms | 主机游戏、电影感体验 |
| 60 FPS | 16.67 ms | 大多数游戏的标准目标 |
| 120 FPS | 8.33 ms | 竞技游戏、VR |
| 144+ FPS | <7 ms | 电竞显示器 |

**时间步长（Time Step / Delta Time）** 是指两帧之间经过的时间。理解和正确使用时间步长是实现帧率独立的关键。

---

## 核心原理

### 最简单的游戏循环

让我们从最基础的游戏循环开始：

```cpp
// C++ - 最简单的游戏循环（不推荐用于实际项目）
void SimpleGameLoop() {
    bool isRunning = true;

    while (isRunning) {
        ProcessInput();
        Update();
        Render();
    }
}
```

这个循环存在一个严重问题：它会以 CPU 能达到的最快速度运行。在高端机器上可能每秒运行数千次，而在低端机器上可能只有几十次。这导致：

1. 游戏速度与硬件性能挂钩
2. CPU 满负荷运转，浪费电力
3. 物理模拟不稳定

### 帧率独立（Frame Rate Independence）

帧率独立意味着游戏的行为不受帧率变化的影响。无论是 30 FPS 还是 120 FPS，游戏角色移动相同距离所需的真实时间应该相同。

实现帧率独立的关键是 **Delta Time（增量时间）**：

```cpp
// C++ - 使用 Delta Time 的游戏循环
#include <chrono>

void GameLoopWithDeltaTime() {
    using Clock = std::chrono::high_resolution_clock;
    using Duration = std::chrono::duration<float>;

    auto previousTime = Clock::now();
    bool isRunning = true;

    while (isRunning) {
        auto currentTime = Clock::now();
        float deltaTime = Duration(currentTime - previousTime).count();
        previousTime = currentTime;

        ProcessInput();
        Update(deltaTime);
        Render();
    }
}

// 使用 deltaTime 更新位置
void UpdatePlayer(float deltaTime) {
    // 速度单位：单位/秒
    float speed = 100.0f;

    // 位移 = 速度 * 时间
    // 无论帧率如何，每秒移动 100 单位
    player.position.x += speed * deltaTime;
}
```

```csharp
// C# (Unity) - Delta Time 的使用
public class PlayerMovement : MonoBehaviour
{
    public float speed = 10f;

    void Update()
    {
        // Time.deltaTime 由 Unity 自动计算
        float horizontal = Input.GetAxis("Horizontal");
        float vertical = Input.GetAxis("Vertical");

        Vector3 movement = new Vector3(horizontal, 0, vertical);
        transform.position += movement * speed * Time.deltaTime;
    }
}
```

### Delta Time 的数学原理

理解 Delta Time 的数学原理有助于正确使用它：

```
位移 = 速度 × 时间

如果速度 = 100 单位/秒：
- 60 FPS: deltaTime ≈ 0.0167 秒，每帧移动 1.67 单位
- 30 FPS: deltaTime ≈ 0.0333 秒，每帧移动 3.33 单位
- 1 秒后，两种情况都移动了约 100 单位
```

---

## 时间步长策略

### 可变时间步长（Variable Time Step）

可变时间步长是最直接的方法：每帧测量实际经过的时间，并使用这个时间来更新游戏。

```cpp
// C++ - 可变时间步长实现
class VariableTimeStepLoop {
private:
    std::chrono::high_resolution_clock::time_point lastTime;
    bool running = true;

public:
    void Run() {
        lastTime = std::chrono::high_resolution_clock::now();

        while (running) {
            auto currentTime = std::chrono::high_resolution_clock::now();
            float deltaTime = std::chrono::duration<float>(
                currentTime - lastTime
            ).count();
            lastTime = currentTime;

            // 防止时间步长过大（如调试暂停后）
            if (deltaTime > 0.25f) {
                deltaTime = 0.25f;
            }

            ProcessInput();
            Update(deltaTime);
            Render();
        }
    }
};
```

**优点：**
- 实现简单
- 渲染尽可能流畅
- 充分利用硬件性能

**缺点：**
- 物理模拟可能不稳定
- 帧率波动大时行为不一致
- 非确定性，难以复现问题

### 固定时间步长（Fixed Time Step）

固定时间步长以恒定的间隔更新游戏逻辑，无论实际帧率如何：

```cpp
// C++ - 固定时间步长实现
class FixedTimeStepLoop {
private:
    const float FIXED_TIME_STEP = 1.0f / 60.0f;  // 60 次更新/秒
    float accumulator = 0.0f;
    bool running = true;

public:
    void Run() {
        auto previousTime = std::chrono::high_resolution_clock::now();

        while (running) {
            auto currentTime = std::chrono::high_resolution_clock::now();
            float frameTime = std::chrono::duration<float>(
                currentTime - previousTime
            ).count();
            previousTime = currentTime;

            // 防止死亡螺旋
            if (frameTime > 0.25f) {
                frameTime = 0.25f;
            }

            accumulator += frameTime;

            ProcessInput();

            // 以固定步长更新，可能多次
            while (accumulator >= FIXED_TIME_STEP) {
                FixedUpdate(FIXED_TIME_STEP);
                accumulator -= FIXED_TIME_STEP;
            }

            Render();
        }
    }

    void FixedUpdate(float dt) {
        // 物理更新、游戏逻辑等
        physics.Update(dt);
        gameLogic.Update(dt);
    }
};
```

**优点：**
- 物理模拟稳定、可预测
- 确定性行为，易于调试和录像回放
- 适合网络同步

**缺点：**
- 渲染可能出现"卡顿"
- 需要额外处理渲染平滑

### 半固定时间步长（Semi-Fixed Time Step）

这种方法试图在固定和可变之间找到平衡：

```cpp
// C++ - 半固定时间步长
class SemiFixedTimeStepLoop {
private:
    const float MIN_TIME_STEP = 1.0f / 120.0f;
    const float MAX_TIME_STEP = 1.0f / 30.0f;
    bool running = true;

public:
    void Run() {
        auto previousTime = std::chrono::high_resolution_clock::now();

        while (running) {
            auto currentTime = std::chrono::high_resolution_clock::now();
            float deltaTime = std::chrono::duration<float>(
                currentTime - previousTime
            ).count();
            previousTime = currentTime;

            // 限制时间步长范围
            deltaTime = std::clamp(deltaTime, MIN_TIME_STEP, MAX_TIME_STEP);

            ProcessInput();
            Update(deltaTime);
            Render();
        }
    }
};
```

---

## 物理更新与渲染分离

### 为什么要分离

物理引擎需要固定的时间步长才能保持稳定，而渲染则希望尽可能频繁以获得流畅的画面。将两者分离可以同时满足这两个需求。

```cpp
// C++ - 分离物理更新和渲染
class SeparatedLoop {
private:
    const float PHYSICS_TIME_STEP = 1.0f / 50.0f;  // 50Hz 物理更新
    float accumulator = 0.0f;
    float alpha = 0.0f;  // 插值因子
    bool running = true;

public:
    void Run() {
        auto previousTime = std::chrono::high_resolution_clock::now();

        while (running) {
            auto currentTime = std::chrono::high_resolution_clock::now();
            float frameTime = std::chrono::duration<float>(
                currentTime - previousTime
            ).count();
            previousTime = currentTime;

            if (frameTime > 0.25f) {
                frameTime = 0.25f;
            }

            accumulator += frameTime;

            ProcessInput();

            // 固定步长物理更新
            while (accumulator >= PHYSICS_TIME_STEP) {
                // 保存当前状态用于插值
                SavePreviousState();

                PhysicsUpdate(PHYSICS_TIME_STEP);
                accumulator -= PHYSICS_TIME_STEP;
            }

            // 计算插值因子
            alpha = accumulator / PHYSICS_TIME_STEP;

            // 使用插值渲染
            Render(alpha);
        }
    }
};
```

### 状态插值（State Interpolation）

为了消除固定物理步长带来的视觉卡顿，需要在渲染时对状态进行插值：

```cpp
// C++ - 状态插值实现
struct RigidBody {
    Vector3 position;
    Vector3 previousPosition;
    Quaternion rotation;
    Quaternion previousRotation;

    void SaveState() {
        previousPosition = position;
        previousRotation = rotation;
    }

    // 获取用于渲染的插值状态
    Vector3 GetInterpolatedPosition(float alpha) const {
        return Vector3::Lerp(previousPosition, position, alpha);
    }

    Quaternion GetInterpolatedRotation(float alpha) const {
        return Quaternion::Slerp(previousRotation, rotation, alpha);
    }
};

// 渲染时使用插值状态
void Render(float alpha) {
    for (auto& entity : entities) {
        Vector3 renderPosition = entity.rigidBody.GetInterpolatedPosition(alpha);
        Quaternion renderRotation = entity.rigidBody.GetInterpolatedRotation(alpha);

        DrawEntity(entity, renderPosition, renderRotation);
    }
}
```

```csharp
// C# (Unity) - 使用 FixedUpdate 和插值
public class InterpolatedMovement : MonoBehaviour
{
    private Vector3 previousPosition;
    private Vector3 currentPosition;
    private Quaternion previousRotation;
    private Quaternion currentRotation;

    public float speed = 10f;

    void Start()
    {
        previousPosition = currentPosition = transform.position;
        previousRotation = currentRotation = transform.rotation;
    }

    // 物理更新（固定时间步长，默认 50Hz）
    void FixedUpdate()
    {
        previousPosition = currentPosition;
        previousRotation = currentRotation;

        // 物理相关的移动逻辑
        float h = Input.GetAxis("Horizontal");
        float v = Input.GetAxis("Vertical");
        Vector3 movement = new Vector3(h, 0, v) * speed * Time.fixedDeltaTime;

        currentPosition += movement;
    }

    // 渲染更新（每帧调用）
    void Update()
    {
        // 计算插值因子
        float alpha = (Time.time - Time.fixedTime) / Time.fixedDeltaTime;
        alpha = Mathf.Clamp01(alpha);

        // 插值位置和旋转
        transform.position = Vector3.Lerp(previousPosition, currentPosition, alpha);
        transform.rotation = Quaternion.Slerp(previousRotation, currentRotation, alpha);
    }
}
```

---

## 帧率控制技术

### 垂直同步（VSync）

垂直同步将游戏帧率锁定到显示器刷新率，避免画面撕裂：

```cpp
// C++ - 概念性的 VSync 实现
class VSyncLoop {
public:
    void Run() {
        // 在 OpenGL 中启用 VSync
        // glfwSwapInterval(1);  // 1 表示每次垂直同步交换一次

        // 在 DirectX 中
        // swapChain->Present(1, 0);  // 第一个参数为同步间隔

        while (running) {
            ProcessInput();
            Update(GetDeltaTime());
            Render();

            // Present/SwapBuffers 会自动等待 VSync
            SwapBuffers();
        }
    }
};
```

**VSync 的优缺点：**

| 优点 | 缺点 |
|------|------|
| 消除画面撕裂 | 增加输入延迟 |
| 稳定的帧时间 | 帧率下降时可能减半 |
| 降低 GPU 负载 | 不适合竞技游戏 |

### 帧率上限（Frame Rate Cap）

手动限制帧率可以节省资源并保持一致的体验：

```cpp
// C++ - 帧率上限实现
#include <thread>
#include <chrono>

class FrameRateCappedLoop {
private:
    const float TARGET_FRAME_TIME = 1.0f / 60.0f;  // 60 FPS
    bool running = true;

public:
    void Run() {
        using Clock = std::chrono::high_resolution_clock;

        while (running) {
            auto frameStart = Clock::now();

            ProcessInput();
            Update(TARGET_FRAME_TIME);
            Render();

            // 计算帧剩余时间
            auto frameEnd = Clock::now();
            float frameTime = std::chrono::duration<float>(
                frameEnd - frameStart
            ).count();

            // 如果还有剩余时间，睡眠等待
            if (frameTime < TARGET_FRAME_TIME) {
                float sleepTime = TARGET_FRAME_TIME - frameTime;
                std::this_thread::sleep_for(
                    std::chrono::duration<float>(sleepTime)
                );
            }
        }
    }
};
```

**注意事项：**
- `sleep` 精度有限，可能导致帧时间不均匀
- 考虑使用忙等待（Busy Wait）配合 sleep 提高精度

### 自适应帧率

根据系统负载动态调整帧率目标：

```cpp
// C++ - 自适应帧率实现
class AdaptiveFrameRateLoop {
private:
    float targetFrameTime = 1.0f / 60.0f;
    const float MIN_FRAME_TIME = 1.0f / 120.0f;
    const float MAX_FRAME_TIME = 1.0f / 30.0f;

    float performanceHistory[10] = {0};
    int historyIndex = 0;

public:
    void Run() {
        while (running) {
            auto frameStart = Clock::now();

            ProcessInput();
            Update(GetDeltaTime());
            Render();

            auto frameEnd = Clock::now();
            float actualFrameTime = std::chrono::duration<float>(
                frameEnd - frameStart
            ).count();

            // 更新性能历史
            performanceHistory[historyIndex] = actualFrameTime;
            historyIndex = (historyIndex + 1) % 10;

            // 根据平均帧时间调整目标
            float avgFrameTime = CalculateAverage(performanceHistory, 10);
            AdjustTargetFrameRate(avgFrameTime);
        }
    }

    void AdjustTargetFrameRate(float avgFrameTime) {
        // 如果持续超时，降低目标帧率
        if (avgFrameTime > targetFrameTime * 1.1f) {
            targetFrameTime = std::min(targetFrameTime * 1.2f, MAX_FRAME_TIME);
        }
        // 如果有余量，尝试提高帧率
        else if (avgFrameTime < targetFrameTime * 0.8f) {
            targetFrameTime = std::max(targetFrameTime * 0.9f, MIN_FRAME_TIME);
        }
    }
};
```

---

## 死亡螺旋问题

### 什么是死亡螺旋

当游戏因为某些原因（如加载资源、垃圾回收）导致一帧时间过长时，固定时间步长的累加器会积累大量时间。为了"追赶"，游戏需要在下一帧进行多次物理更新，这又会导致该帧更长，形成恶性循环。

```
帧 1: 正常 (16ms, 1 次物理更新)
帧 2: 卡顿 (200ms, 需要 12 次物理更新)
帧 3: 更卡 (300ms, 需要 18 次物理更新)
...
游戏彻底卡死
```

### 解决死亡螺旋

```cpp
// C++ - 防止死亡螺旋
class SafeFixedTimeStepLoop {
private:
    const float FIXED_TIME_STEP = 1.0f / 60.0f;
    const float MAX_FRAME_TIME = 0.25f;        // 最大帧时间
    const int MAX_UPDATES_PER_FRAME = 5;       // 每帧最大更新次数
    float accumulator = 0.0f;

public:
    void Run() {
        auto previousTime = Clock::now();

        while (running) {
            auto currentTime = Clock::now();
            float frameTime = GetDuration(previousTime, currentTime);
            previousTime = currentTime;

            // 方法1: 限制最大帧时间
            if (frameTime > MAX_FRAME_TIME) {
                frameTime = MAX_FRAME_TIME;
            }

            accumulator += frameTime;

            ProcessInput();

            // 方法2: 限制每帧更新次数
            int updateCount = 0;
            while (accumulator >= FIXED_TIME_STEP &&
                   updateCount < MAX_UPDATES_PER_FRAME) {
                FixedUpdate(FIXED_TIME_STEP);
                accumulator -= FIXED_TIME_STEP;
                updateCount++;
            }

            // 如果仍有剩余，丢弃（游戏会慢放）
            if (accumulator > FIXED_TIME_STEP) {
                accumulator = FIXED_TIME_STEP;
            }

            float alpha = accumulator / FIXED_TIME_STEP;
            Render(alpha);
        }
    }
};
```

```csharp
// C# (Unity) - Unity 自动处理死亡螺旋
// Time.maximumDeltaTime 限制最大帧时间（默认 0.333 秒）
void Start()
{
    // 可以调整最大增量时间
    Time.maximumDeltaTime = 0.1f;  // 最多追赶 100ms

    // 设置固定时间步长
    Time.fixedDeltaTime = 0.02f;  // 50 Hz
}
```

---

## 完整的游戏循环实现

### C++ 完整示例

```cpp
#include <chrono>
#include <thread>
#include <algorithm>

class GameLoop {
private:
    // 时间常量
    static constexpr float FIXED_TIME_STEP = 1.0f / 50.0f;    // 50 Hz 物理
    static constexpr float MAX_FRAME_TIME = 0.25f;             // 防止死亡螺旋
    static constexpr float TARGET_FRAME_TIME = 1.0f / 60.0f;   // 60 FPS 目标

    // 时间状态
    float accumulator = 0.0f;
    float alpha = 0.0f;
    float totalTime = 0.0f;
    float deltaTime = 0.0f;

    // 性能统计
    float fps = 0.0f;
    float frameTime = 0.0f;
    int frameCount = 0;
    float fpsTimer = 0.0f;

    bool running = true;
    bool enableVSync = true;
    bool enableFrameCap = true;

    using Clock = std::chrono::high_resolution_clock;
    using TimePoint = Clock::time_point;

public:
    void Run() {
        TimePoint previousTime = Clock::now();
        TimePoint fpsUpdateTime = previousTime;

        while (running) {
            TimePoint currentTime = Clock::now();
            float rawDeltaTime = std::chrono::duration<float>(
                currentTime - previousTime
            ).count();
            previousTime = currentTime;

            // 限制最大帧时间
            deltaTime = std::min(rawDeltaTime, MAX_FRAME_TIME);
            totalTime += deltaTime;
            accumulator += deltaTime;

            // 更新 FPS 统计
            UpdateFPSCounter(currentTime, fpsUpdateTime);

            // 处理输入（每帧一次）
            ProcessInput();

            // 固定步长更新（物理、游戏逻辑）
            int updateCount = 0;
            while (accumulator >= FIXED_TIME_STEP && updateCount < 5) {
                FixedUpdate(FIXED_TIME_STEP);
                accumulator -= FIXED_TIME_STEP;
                updateCount++;
            }

            // 计算插值因子
            alpha = accumulator / FIXED_TIME_STEP;

            // 可变更新（动画、UI、特效）
            Update(deltaTime);

            // 渲染
            Render(alpha);

            // 帧率控制
            if (enableFrameCap && !enableVSync) {
                LimitFrameRate(currentTime);
            }

            // 交换缓冲区
            Present();
        }
    }

private:
    void ProcessInput() {
        // 处理键盘、鼠标、手柄输入
        // inputSystem.Poll();
    }

    void FixedUpdate(float dt) {
        // 物理更新
        // physics.Step(dt);

        // 游戏逻辑更新
        // gameLogic.Update(dt);

        // AI 更新
        // aiSystem.Update(dt);

        // 网络同步
        // networkSystem.Update(dt);
    }

    void Update(float dt) {
        // 动画更新
        // animationSystem.Update(dt);

        // 粒子系统
        // particleSystem.Update(dt);

        // UI 更新
        // uiSystem.Update(dt);

        // 音频更新
        // audioSystem.Update(dt);
    }

    void Render(float interpolationAlpha) {
        // 清除缓冲区
        // graphics.Clear();

        // 渲染场景（使用插值位置）
        // sceneRenderer.Render(interpolationAlpha);

        // 渲染 UI
        // uiRenderer.Render();

        // 渲染调试信息
        // debugRenderer.Render();
    }

    void Present() {
        // 交换前后缓冲区
        // graphics.SwapBuffers();
    }

    void LimitFrameRate(TimePoint frameStart) {
        TimePoint frameEnd = Clock::now();
        float elapsed = std::chrono::duration<float>(
            frameEnd - frameStart
        ).count();

        if (elapsed < TARGET_FRAME_TIME) {
            float sleepTime = TARGET_FRAME_TIME - elapsed;

            // 睡眠大部分时间
            if (sleepTime > 0.001f) {
                std::this_thread::sleep_for(
                    std::chrono::duration<float>(sleepTime - 0.001f)
                );
            }

            // 忙等待剩余时间（更精确）
            while (std::chrono::duration<float>(
                Clock::now() - frameStart
            ).count() < TARGET_FRAME_TIME) {
                // 空转
            }
        }
    }

    void UpdateFPSCounter(TimePoint currentTime, TimePoint& lastUpdate) {
        frameCount++;
        float elapsed = std::chrono::duration<float>(
            currentTime - lastUpdate
        ).count();

        if (elapsed >= 1.0f) {
            fps = frameCount / elapsed;
            frameTime = elapsed / frameCount * 1000.0f;  // 转换为毫秒
            frameCount = 0;
            lastUpdate = currentTime;
        }
    }

public:
    float GetFPS() const { return fps; }
    float GetFrameTime() const { return frameTime; }
    float GetDeltaTime() const { return deltaTime; }
    float GetTotalTime() const { return totalTime; }

    void Stop() { running = false; }
    void SetVSync(bool enabled) { enableVSync = enabled; }
    void SetFrameCap(bool enabled) { enableFrameCap = enabled; }
};
```

### C# (Unity) 完整示例

```csharp
using UnityEngine;
using System.Collections.Generic;

public class GameManager : MonoBehaviour
{
    // 时间配置
    [Header("Time Settings")]
    [SerializeField] private float targetFrameRate = 60f;
    [SerializeField] private float fixedUpdateRate = 50f;
    [SerializeField] private bool useVSync = true;

    // 性能统计
    private float fps;
    private float frameTime;
    private Queue<float> frameTimes = new Queue<float>();
    private const int FPS_SAMPLE_COUNT = 60;

    // 游戏状态
    private bool isPaused;
    private float gameSpeed = 1f;

    void Awake()
    {
        InitializeTimeSettings();
    }

    void InitializeTimeSettings()
    {
        // 设置目标帧率
        Application.targetFrameRate = (int)targetFrameRate;

        // 设置 VSync
        QualitySettings.vSyncCount = useVSync ? 1 : 0;

        // 设置固定更新率
        Time.fixedDeltaTime = 1f / fixedUpdateRate;

        // 设置最大增量时间（防止死亡螺旋）
        Time.maximumDeltaTime = 0.1f;
    }

    // 固定时间步长更新（物理、网络等）
    void FixedUpdate()
    {
        if (isPaused) return;

        // 物理相关更新在这里进行
        // Unity 自动以 Time.fixedDeltaTime 调用

        UpdatePhysicsLogic();
        UpdateNetworkSync();
        UpdateAI();
    }

    // 每帧更新
    void Update()
    {
        // 更新性能统计
        UpdatePerformanceStats();

        // 处理输入
        ProcessInput();

        if (isPaused) return;

        // 获取经过时间缩放的增量时间
        float dt = Time.deltaTime * gameSpeed;

        // 更新各个系统
        UpdateAnimations(dt);
        UpdateParticles(dt);
        UpdateUI(dt);
        UpdateAudio(dt);
    }

    // 渲染后更新（相机跟随等）
    void LateUpdate()
    {
        if (isPaused) return;

        UpdateCamera();
    }

    void UpdatePerformanceStats()
    {
        // 记录帧时间
        frameTimes.Enqueue(Time.unscaledDeltaTime);
        if (frameTimes.Count > FPS_SAMPLE_COUNT)
        {
            frameTimes.Dequeue();
        }

        // 计算平均帧时间和 FPS
        float totalTime = 0f;
        foreach (float t in frameTimes)
        {
            totalTime += t;
        }
        frameTime = totalTime / frameTimes.Count * 1000f;  // 毫秒
        fps = 1000f / frameTime;
    }

    void ProcessInput()
    {
        // 暂停切换
        if (Input.GetKeyDown(KeyCode.Escape))
        {
            TogglePause();
        }

        // 游戏速度控制（调试用）
        if (Input.GetKeyDown(KeyCode.Equals))
        {
            gameSpeed = Mathf.Min(gameSpeed * 2f, 4f);
            Time.timeScale = gameSpeed;
        }
        if (Input.GetKeyDown(KeyCode.Minus))
        {
            gameSpeed = Mathf.Max(gameSpeed * 0.5f, 0.25f);
            Time.timeScale = gameSpeed;
        }
    }

    void UpdatePhysicsLogic()
    {
        // 物理相关的游戏逻辑
    }

    void UpdateNetworkSync()
    {
        // 网络同步逻辑
    }

    void UpdateAI()
    {
        // AI 更新
    }

    void UpdateAnimations(float dt)
    {
        // 动画更新
    }

    void UpdateParticles(float dt)
    {
        // 粒子系统更新
    }

    void UpdateUI(float dt)
    {
        // UI 更新
    }

    void UpdateAudio(float dt)
    {
        // 音频更新
    }

    void UpdateCamera()
    {
        // 相机跟随和效果
    }

    public void TogglePause()
    {
        isPaused = !isPaused;
        Time.timeScale = isPaused ? 0f : gameSpeed;
    }

    // 公共属性
    public float FPS => fps;
    public float FrameTime => frameTime;
    public bool IsPaused => isPaused;
    public float GameSpeed => gameSpeed;

    // GUI 显示性能信息
    void OnGUI()
    {
        GUILayout.BeginArea(new Rect(10, 10, 200, 100));
        GUILayout.Label($"FPS: {fps:F1}");
        GUILayout.Label($"Frame Time: {frameTime:F2} ms");
        GUILayout.Label($"Game Speed: {gameSpeed:F1}x");
        if (isPaused) GUILayout.Label("PAUSED");
        GUILayout.EndArea();
    }
}
```

---

## 性能分析与调试

### 帧时间分析

```cpp
// C++ - 帧时间分析器
class FrameTimeAnalyzer {
private:
    static constexpr int HISTORY_SIZE = 300;  // 5 秒 @ 60 FPS
    float frameTimeHistory[HISTORY_SIZE] = {0};
    int currentIndex = 0;
    bool historyFull = false;

public:
    void RecordFrameTime(float frameTime) {
        frameTimeHistory[currentIndex] = frameTime;
        currentIndex = (currentIndex + 1) % HISTORY_SIZE;
        if (currentIndex == 0) historyFull = true;
    }

    struct Stats {
        float average;
        float min;
        float max;
        float percentile95;
        float percentile99;
        int spikeCount;  // 超过平均值 50% 的帧数
    };

    Stats GetStats() const {
        int count = historyFull ? HISTORY_SIZE : currentIndex;
        if (count == 0) return {};

        // 复制并排序
        std::vector<float> sorted(
            frameTimeHistory,
            frameTimeHistory + count
        );
        std::sort(sorted.begin(), sorted.end());

        Stats stats;
        stats.min = sorted.front();
        stats.max = sorted.back();
        stats.percentile95 = sorted[static_cast<int>(count * 0.95f)];
        stats.percentile99 = sorted[static_cast<int>(count * 0.99f)];

        float sum = 0;
        for (float t : sorted) sum += t;
        stats.average = sum / count;

        float spikeThreshold = stats.average * 1.5f;
        stats.spikeCount = 0;
        for (float t : sorted) {
            if (t > spikeThreshold) stats.spikeCount++;
        }

        return stats;
    }

    void PrintStats() const {
        auto stats = GetStats();
        printf("Frame Time Statistics:\n");
        printf("  Average: %.2f ms (%.1f FPS)\n",
               stats.average * 1000, 1.0f / stats.average);
        printf("  Min: %.2f ms, Max: %.2f ms\n",
               stats.min * 1000, stats.max * 1000);
        printf("  95th: %.2f ms, 99th: %.2f ms\n",
               stats.percentile95 * 1000, stats.percentile99 * 1000);
        printf("  Spikes: %d (%.1f%%)\n",
               stats.spikeCount,
               stats.spikeCount * 100.0f / (historyFull ? HISTORY_SIZE : currentIndex));
    }
};
```

### 系统性能追踪

```cpp
// C++ - 性能追踪器
class PerformanceTracker {
private:
    struct Section {
        const char* name;
        float startTime;
        float duration;
    };

    std::vector<Section> sections;
    std::chrono::high_resolution_clock::time_point frameStart;

public:
    void BeginFrame() {
        sections.clear();
        frameStart = std::chrono::high_resolution_clock::now();
    }

    void BeginSection(const char* name) {
        Section section;
        section.name = name;
        section.startTime = GetElapsedTime();
        sections.push_back(section);
    }

    void EndSection() {
        if (!sections.empty()) {
            sections.back().duration = GetElapsedTime() - sections.back().startTime;
        }
    }

    float GetElapsedTime() const {
        auto now = std::chrono::high_resolution_clock::now();
        return std::chrono::duration<float>(now - frameStart).count();
    }

    void PrintReport() const {
        float total = GetElapsedTime();
        printf("\n=== Frame Performance Report ===\n");
        printf("Total Frame Time: %.2f ms\n", total * 1000);
        printf("--------------------------------\n");

        for (const auto& section : sections) {
            float percentage = (section.duration / total) * 100;
            printf("%-20s: %6.2f ms (%5.1f%%)\n",
                   section.name,
                   section.duration * 1000,
                   percentage);
        }
    }
};

// 使用示例
PerformanceTracker tracker;

void GameLoop() {
    tracker.BeginFrame();

    tracker.BeginSection("Input");
    ProcessInput();
    tracker.EndSection();

    tracker.BeginSection("Physics");
    PhysicsUpdate();
    tracker.EndSection();

    tracker.BeginSection("GameLogic");
    GameLogicUpdate();
    tracker.EndSection();

    tracker.BeginSection("Render");
    Render();
    tracker.EndSection();

    // 每秒打印一次报告
    if (shouldPrintReport) {
        tracker.PrintReport();
    }
}
```

```csharp
// C# (Unity) - 使用 Profiler
using UnityEngine;
using UnityEngine.Profiling;

public class PerformanceMonitor : MonoBehaviour
{
    void Update()
    {
        // 使用 Unity Profiler 标记代码段
        Profiler.BeginSample("Input Processing");
        ProcessInput();
        Profiler.EndSample();

        Profiler.BeginSample("Game Logic");
        UpdateGameLogic();
        Profiler.EndSample();

        Profiler.BeginSample("AI Update");
        UpdateAI();
        Profiler.EndSample();
    }

    // 在 Unity Profiler 窗口中可以查看这些标记的耗时
}
```

---

## 常见陷阱与解决方案

### 陷阱一：忘记使用 Delta Time

```cpp
// 错误做法
void UpdatePlayerBad() {
    player.position.x += 5.0f;  // 移动速度与帧率成正比！
}

// 正确做法
void UpdatePlayerGood(float deltaTime) {
    float speed = 300.0f;  // 单位/秒
    player.position.x += speed * deltaTime;
}
```

### 陷阱二：在物理更新中使用可变时间步长

```cpp
// 错误做法 - 物理不稳定
void PhysicsUpdateBad(float deltaTime) {
    // 大的 deltaTime 会导致物体穿透
    velocity += gravity * deltaTime;
    position += velocity * deltaTime;
}

// 正确做法 - 使用固定时间步长
void PhysicsUpdateGood(float fixedDeltaTime) {
    // fixedDeltaTime 始终相同，物理稳定
    velocity += gravity * fixedDeltaTime;
    position += velocity * fixedDeltaTime;
}
```

### 陷阱三：浮点数精度问题

```cpp
// 问题：长时间运行后 totalTime 精度下降
float totalTime = 0.0f;
void Update(float dt) {
    totalTime += dt;  // 数小时后精度会下降
}

// 解决方案：使用更大的时间单位或周期性重置
double totalTimeDouble = 0.0;  // 使用 double
void Update(float dt) {
    totalTimeDouble += dt;
}

// 或者分段计时
struct GameTime {
    int hours = 0;
    float seconds = 0.0f;  // 0-3600 秒内的时间

    void Add(float dt) {
        seconds += dt;
        while (seconds >= 3600.0f) {
            seconds -= 3600.0f;
            hours++;
        }
    }
};
```

### 陷阱四：输入延迟

```cpp
// 问题：输入在下一帧才被处理
void BadInputHandling() {
    // 在更新开始时采集输入
    ProcessInput();  // 上一帧的输入
    Update();
    Render();
}

// 优化：尽量减少输入到渲染的延迟
void BetterInputHandling() {
    // 在渲染前立即处理输入
    Update();
    ProcessInput();  // 最新的输入
    Render();
}

// 最佳：预测输入时机
void BestInputHandling() {
    // 在 VSync 等待期间采集输入
    // 需要多线程支持
}
```

### 陷阱五：帧率波动导致的抖动

```cpp
// 问题：deltaTime 波动导致视觉抖动
void UpdateCamera(float deltaTime) {
    // deltaTime 不稳定时，相机会抖动
    camera.position = Lerp(camera.position, target.position,
                           5.0f * deltaTime);
}

// 解决方案：使用帧率独立的平滑
void UpdateCameraSmooth(float deltaTime) {
    float smoothing = 5.0f;
    float factor = 1.0f - std::exp(-smoothing * deltaTime);
    camera.position = Lerp(camera.position, target.position, factor);
}
```

---

## 面试要点

### 什么是游戏循环？为什么需要它？

**参考答案：**
游戏循环是游戏引擎的核心，是一个持续运行的循环，负责：
- 处理玩家输入
- 更新游戏状态（物理、AI、逻辑）
- 渲染画面

与事件驱动程序不同，游戏需要持续更新，即使没有玩家输入，敌人仍要移动，动画仍要播放。

### 解释 Delta Time 的作用和使用方法

**参考答案：**
Delta Time 是两帧之间经过的时间，用于实现帧率独立：

```cpp
// 错误：速度与帧率相关
position += 5.0f;

// 正确：速度与帧率无关
position += speed * deltaTime;
```

这样无论 30 FPS 还是 120 FPS，物体每秒移动相同的距离。

### 固定时间步长 vs 可变时间步长

**参考答案：**

| 特性 | 固定时间步长 | 可变时间步长 |
|------|------------|------------|
| 物理稳定性 | 高 | 低 |
| 确定性 | 是 | 否 |
| 实现复杂度 | 较高（需要插值） | 低 |
| 适用场景 | 物理模拟、网络同步 | 一般渲染 |

最佳实践是组合使用：固定步长更新物理，可变步长更新渲染。

### 什么是死亡螺旋？如何避免？

**参考答案：**
死亡螺旋发生在固定时间步长循环中：当一帧时间过长，累加器积累大量时间，下一帧需要多次更新来追赶，这又导致帧时间更长，形成恶性循环。

解决方法：
1. 限制最大帧时间（如 0.25 秒）
2. 限制每帧最大更新次数（如 5 次）
3. 允许游戏慢放而非追赶

### 如何实现物理和渲染的分离？

**参考答案：**
```cpp
while (running) {
    accumulator += deltaTime;

    // 固定步长物理更新
    while (accumulator >= PHYSICS_STEP) {
        SaveState();  // 保存上一状态
        PhysicsUpdate(PHYSICS_STEP);
        accumulator -= PHYSICS_STEP;
    }

    // 计算插值因子
    float alpha = accumulator / PHYSICS_STEP;

    // 使用插值位置渲染
    RenderInterpolated(alpha);
}
```

关键是保存两帧状态并在渲染时插值，消除视觉卡顿。

---

## 延伸阅读

### 推荐资源

1. **经典文章**
   - [Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/) - Glenn Fiedler 的经典文章
   - [Game Loop](http://gameprogrammingpatterns.com/game-loop.html) - Game Programming Patterns

2. **引擎文档**
   - [Unity - Order of Execution](https://docs.unity3d.com/Manual/ExecutionOrder.html)
   - [Unreal Engine - Game Flow](https://docs.unrealengine.com/en-US/ProgrammingAndScripting/ProgrammingWithCPP/UnrealArchitecture/Actors/ActorLifecycle/)

3. **视频教程**
   - [Game Engine Architecture - Game Loop](https://www.youtube.com/watch?v=cV8aKcGqz9s)
   - [Math for Game Programmers: Timing in Games](https://www.gdcvault.com/play/1025667/Math-for-Game-Programmers-Timing)

4. **书籍**
   - Game Engine Architecture - Jason Gregory
   - Game Programming Patterns - Robert Nystrom
   - Real-Time Rendering - Tomas Akenine-Moller

### 实践建议

1. **从简单开始**：先实现基本的可变时间步长循环，确保游戏能运行
2. **分析需求**：不是所有游戏都需要复杂的时间步长控制
3. **测试极端情况**：在低端设备和高帧率下都要测试
4. **使用性能分析工具**：找出真正的瓶颈，不要过早优化
5. **记录帧时间历史**：有助于诊断性能问题

### 相关概念

- **多线程游戏循环**：将更新和渲染放在不同线程
- **网络同步**：在多人游戏中同步游戏状态
- **录像回放**：使用确定性时间步长实现精确回放
- **慢动作效果**：通过缩放时间步长实现

---

游戏循环是游戏开发的基础，理解其原理对于开发高质量游戏至关重要。无论你使用的是 Unity、Unreal 还是自研引擎，这些概念都是通用的。掌握时间步长控制和帧率优化，将帮助你创造出既流畅又稳定的游戏体验。
