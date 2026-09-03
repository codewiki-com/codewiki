---
title: 游戏性能分析与调试
description: 掌握游戏性能分析工具和技术：CPU/GPU/内存分析
track: gamedev
section: performance
difficulty: intermediate
tags:
  - 性能分析
  - Profiling
  - 调试
  - 优化
status: imported
origin: old/src/content/docs/gamedev/game-profiling.zh.md
divergence: 0.262
issues: []
legacy:
  category: GameDev
  subcategory: Optimization
  order: 37
  lastUpdated: 2026-01-07
---

游戏性能分析是游戏开发中至关重要的环节。一款流畅运行的游戏能够为玩家带来沉浸式体验，而卡顿、掉帧则会严重影响游戏体验。本文将深入探讨游戏性能分析的核心概念、工具使用和优化技术，帮助开发者构建高性能的游戏应用。

## 性能分析基础概念

### 什么是性能分析

性能分析（Profiling）是指通过各种工具和技术手段，收集和分析程序运行时的性能数据，找出性能瓶颈并进行针对性优化的过程。在游戏开发中，性能分析主要关注以下几个方面：

1. **帧率（FPS）**：每秒渲染的帧数，通常目标是 30fps、60fps 或更高
2. **帧时间（Frame Time）**：渲染单帧所需的时间，60fps 对应约 16.67ms
3. **CPU 使用率**：处理器资源的占用情况
4. **GPU 使用率**：图形处理器的负载情况
5. **内存占用**：运行时内存的使用情况

### 性能瓶颈类型

```
┌─────────────────────────────────────────────────────────────┐
│                     游戏性能瓶颈分类                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│    CPU 瓶颈     │    GPU 瓶颈     │      内存瓶颈           │
├─────────────────┼─────────────────┼─────────────────────────┤
│ • 游戏逻辑计算  │ • 顶点处理过多  │ • 内存不足              │
│ • 物理模拟     │ • 片元着色器复杂 │ • 频繁分配/释放         │
│ • AI 计算      │ • 过度绘制      │ • 纹理内存占用大        │
│ • 脚本执行     │ • 带宽瓶颈      │ • 内存碎片              │
│ • 动画系统     │ • 填充率限制    │ • 缓存命中率低          │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### 性能分析的基本流程

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 1. 测量  │───▶│ 2. 分析  │───▶│ 3. 优化  │───▶│ 4. 验证  │
│ Measure  │    │ Analyze  │    │ Optimize │    │ Verify   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │                                               │
     └───────────────────────────────────────────────┘
                        迭代循环
```

**关键原则**：
- 先测量，后优化（不要凭感觉优化）
- 优化最大的瓶颈（80/20 法则）
- 每次只改变一个变量
- 优化后必须验证效果

## 性能分析工作流程

### 建立性能基准

在开始优化之前，首先需要建立性能基准线：

```csharp
// Unity 性能基准测试脚本
using UnityEngine;
using System.Collections.Generic;

public class PerformanceBenchmark : MonoBehaviour
{
    // 采样数据存储
    private List<float> frameTimes = new List<float>();
    private float benchmarkDuration = 10f; // 测试持续时间
    private float elapsedTime = 0f;

    // 统计数据
    private float minFrameTime = float.MaxValue;
    private float maxFrameTime = 0f;
    private float avgFrameTime = 0f;

    void Update()
    {
        if (elapsedTime < benchmarkDuration)
        {
            float frameTime = Time.deltaTime * 1000f; // 转换为毫秒
            frameTimes.Add(frameTime);

            minFrameTime = Mathf.Min(minFrameTime, frameTime);
            maxFrameTime = Mathf.Max(maxFrameTime, frameTime);

            elapsedTime += Time.deltaTime;
        }
        else if (frameTimes.Count > 0)
        {
            CalculateResults();
        }
    }

    void CalculateResults()
    {
        // 计算平均帧时间
        float sum = 0f;
        foreach (float ft in frameTimes)
        {
            sum += ft;
        }
        avgFrameTime = sum / frameTimes.Count;

        // 计算百分位数
        frameTimes.Sort();
        float p95 = frameTimes[(int)(frameTimes.Count * 0.95f)];
        float p99 = frameTimes[(int)(frameTimes.Count * 0.99f)];

        Debug.Log($"===== 性能基准测试结果 =====");
        Debug.Log($"采样数量: {frameTimes.Count}");
        Debug.Log($"平均帧时间: {avgFrameTime:F2}ms ({1000f/avgFrameTime:F1} FPS)");
        Debug.Log($"最小帧时间: {minFrameTime:F2}ms ({1000f/minFrameTime:F1} FPS)");
        Debug.Log($"最大帧时间: {maxFrameTime:F2}ms ({1000f/maxFrameTime:F1} FPS)");
        Debug.Log($"95th 百分位: {p95:F2}ms");
        Debug.Log($"99th 百分位: {p99:F2}ms");

        frameTimes.Clear();
    }
}
```

```cpp
// Unreal Engine 性能基准测试
// GameBenchmark.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "GameBenchmark.generated.h"

UCLASS()
class MYGAME_API AGameBenchmark : public AActor
{
    GENERATED_BODY()

public:
    AGameBenchmark();
    virtual void Tick(float DeltaTime) override;

private:
    TArray<float> FrameTimes;
    float BenchmarkDuration = 10.0f;
    float ElapsedTime = 0.0f;
    bool bBenchmarkComplete = false;

    void CalculateStatistics();
};

// GameBenchmark.cpp
#include "GameBenchmark.h"

AGameBenchmark::AGameBenchmark()
{
    PrimaryActorTick.bCanEverTick = true;
}

void AGameBenchmark::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    if (!bBenchmarkComplete)
    {
        float FrameTimeMs = DeltaTime * 1000.0f;
        FrameTimes.Add(FrameTimeMs);
        ElapsedTime += DeltaTime;

        if (ElapsedTime >= BenchmarkDuration)
        {
            bBenchmarkComplete = true;
            CalculateStatistics();
        }
    }
}

void AGameBenchmark::CalculateStatistics()
{
    if (FrameTimes.Num() == 0) return;

    // 排序计算百分位数
    FrameTimes.Sort();

    float Sum = 0.0f;
    float MinTime = FrameTimes[0];
    float MaxTime = FrameTimes.Last();

    for (float Time : FrameTimes)
    {
        Sum += Time;
    }

    float AvgTime = Sum / FrameTimes.Num();
    float P95 = FrameTimes[(int)(FrameTimes.Num() * 0.95f)];
    float P99 = FrameTimes[(int)(FrameTimes.Num() * 0.99f)];

    UE_LOG(LogTemp, Warning, TEXT("===== Benchmark Results ====="));
    UE_LOG(LogTemp, Warning, TEXT("Samples: %d"), FrameTimes.Num());
    UE_LOG(LogTemp, Warning, TEXT("Avg Frame Time: %.2fms (%.1f FPS)"),
           AvgTime, 1000.0f / AvgTime);
    UE_LOG(LogTemp, Warning, TEXT("Min/Max: %.2fms / %.2fms"), MinTime, MaxTime);
    UE_LOG(LogTemp, Warning, TEXT("P95: %.2fms, P99: %.2fms"), P95, P99);
}
```

### 性能预算分配

为不同系统分配合理的性能预算：

```
目标：60 FPS (16.67ms/帧)

┌─────────────────────────────────────────────────────────┐
│                    帧时间预算分配                        │
├─────────────────────┬───────────────┬───────────────────┤
│       系统          │    时间预算    │      占比         │
├─────────────────────┼───────────────┼───────────────────┤
│ 渲染 (Rendering)    │    8.0 ms     │      48%          │
│ 游戏逻辑 (Logic)    │    3.0 ms     │      18%          │
│ 物理 (Physics)      │    2.0 ms     │      12%          │
│ 动画 (Animation)    │    1.5 ms     │       9%          │
│ AI 系统             │    1.0 ms     │       6%          │
│ 音频 (Audio)        │    0.5 ms     │       3%          │
│ 其他 + 缓冲         │    0.67 ms    │       4%          │
├─────────────────────┼───────────────┼───────────────────┤
│ 总计                │   16.67 ms    │     100%          │
└─────────────────────┴───────────────┴───────────────────┘
```

## Unity Profiler 详解

### Profiler 窗口概览

Unity Profiler 是 Unity 引擎内置的强大性能分析工具，可以通过 `Window > Analysis > Profiler` 打开。

```
┌─────────────────────────────────────────────────────────────────┐
│  Unity Profiler                                          [_][□][X]│
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ▼ CPU Usage        ████████████░░░░░░░░░░░░  45%           ││
│  │ ▼ GPU Usage        ██████████████████░░░░░░  72%           ││
│  │ ▼ Rendering        ████████████████░░░░░░░░  65%           ││
│  │ ▼ Memory           ██████░░░░░░░░░░░░░░░░░░  28%           ││
│  │ ▼ Audio            ██░░░░░░░░░░░░░░░░░░░░░░   8%           ││
│  │ ▼ Physics          ████░░░░░░░░░░░░░░░░░░░░  15%           ││
│  └─────────────────────────────────────────────────────────────┘│
│  [Record] [Deep Profile] [Profile Editor] [Clear]               │
├─────────────────────────────────────────────────────────────────┤
│  Frame: 1234  │ CPU: 12.5ms │ GPU: 8.3ms │ FPS: 72            │
└─────────────────────────────────────────────────────────────────┘
```

### CPU Profiler 使用

```csharp
using UnityEngine;
using UnityEngine.Profiling;

public class CPUProfilingExample : MonoBehaviour
{
    // 使用 Profiler.BeginSample/EndSample 进行自定义采样
    void Update()
    {
        // 标记采样区域 - 会在 Profiler 中显示
        Profiler.BeginSample("GameLogic.Update");

        UpdateGameLogic();

        Profiler.EndSample();

        Profiler.BeginSample("AI.ProcessDecisions");

        ProcessAIDecisions();

        Profiler.EndSample();
    }

    void UpdateGameLogic()
    {
        Profiler.BeginSample("GameLogic.PlayerInput");
        ProcessPlayerInput();
        Profiler.EndSample();

        Profiler.BeginSample("GameLogic.EntityUpdate");
        UpdateEntities();
        Profiler.EndSample();
    }

    void ProcessPlayerInput()
    {
        // 输入处理逻辑
    }

    void UpdateEntities()
    {
        // 实体更新逻辑
    }

    void ProcessAIDecisions()
    {
        // AI 决策逻辑
    }
}

// 使用 CustomSampler 进行更精确的测量
public class AdvancedProfiling : MonoBehaviour
{
    private CustomSampler physicsSampler;
    private CustomSampler renderSampler;
    private Recorder physicsRecorder;

    void Awake()
    {
        // 创建自定义采样器
        physicsSampler = CustomSampler.Create("MyGame.Physics");
        renderSampler = CustomSampler.Create("MyGame.Rendering");

        // 获取记录器用于读取数据
        physicsRecorder = Recorder.Get("MyGame.Physics");
        physicsRecorder.enabled = true;
    }

    void FixedUpdate()
    {
        physicsSampler.Begin();

        // 物理更新逻辑
        SimulatePhysics();

        physicsSampler.End();

        // 读取上一帧的物理时间
        if (physicsRecorder.isValid)
        {
            long nanoseconds = physicsRecorder.elapsedNanoseconds;
            float milliseconds = nanoseconds / 1000000f;

            if (milliseconds > 2.0f)
            {
                Debug.LogWarning($"Physics took {milliseconds:F2}ms - exceeds budget!");
            }
        }
    }

    void SimulatePhysics()
    {
        // 物理模拟代码
    }
}
```

### Memory Profiler 使用

```csharp
using UnityEngine;
using UnityEngine.Profiling;
using System.Runtime.CompilerServices;

public class MemoryProfilingExample : MonoBehaviour
{
    void Start()
    {
        // 获取内存使用情况
        LogMemoryStats();
    }

    void LogMemoryStats()
    {
        // 已分配的托管堆内存
        long monoUsed = Profiler.GetMonoUsedSizeLong();
        long monoHeap = Profiler.GetMonoHeapSizeLong();

        // 已分配的原生内存
        long totalAllocated = Profiler.GetTotalAllocatedMemoryLong();
        long totalReserved = Profiler.GetTotalReservedMemoryLong();

        // 纹理、网格等资源内存
        long textureMemory = Profiler.GetAllocatedMemoryForGraphicsDriver();

        Debug.Log($"===== Memory Statistics =====");
        Debug.Log($"Mono Used: {monoUsed / 1024 / 1024}MB / {monoHeap / 1024 / 1024}MB");
        Debug.Log($"Native: {totalAllocated / 1024 / 1024}MB / {totalReserved / 1024 / 1024}MB");
        Debug.Log($"Graphics: {textureMemory / 1024 / 1024}MB");
    }

    // 追踪特定对象的内存分配
    void TrackObjectMemory()
    {
        GameObject testObject = new GameObject("TestObject");

        // 获取运行时内存大小
        long runtimeMemory = Profiler.GetRuntimeMemorySizeLong(testObject);
        Debug.Log($"GameObject runtime memory: {runtimeMemory} bytes");

        // 对于纹理
        Texture2D texture = new Texture2D(1024, 1024);
        long textureMemory = Profiler.GetRuntimeMemorySizeLong(texture);
        Debug.Log($"Texture memory: {textureMemory / 1024}KB");
    }
}

// 检测 GC 分配的工具类
public static class GCAllocationTracker
{
    private static long lastGCAlloc;

    public static void BeginTracking()
    {
        lastGCAlloc = GC.GetTotalMemory(false);
    }

    public static long EndTracking(string context = "")
    {
        long currentAlloc = GC.GetTotalMemory(false);
        long allocated = currentAlloc - lastGCAlloc;

        if (allocated > 0)
        {
            Debug.Log($"[GC Allocation] {context}: {allocated} bytes");
        }

        return allocated;
    }
}

// 使用示例
public class GCTrackingExample : MonoBehaviour
{
    void Update()
    {
        GCAllocationTracker.BeginTracking();

        // 可能产生 GC 分配的代码
        ProcessFrame();

        GCAllocationTracker.EndTracking("ProcessFrame");
    }

    void ProcessFrame()
    {
        // 避免在 Update 中产生 GC 分配
        // 错误示例：string concatenation = "Player" + " " + "Score"; // 产生 GC
        // 正确示例：使用 StringBuilder 或字符串缓存
    }
}
```

### GPU Profiler 和 Frame Debugger

```csharp
using UnityEngine;
using UnityEngine.Rendering;

public class GPUProfilingExample : MonoBehaviour
{
    // 使用 GPU Profiler 标记
    void OnRenderObject()
    {
        // 在 Frame Debugger 中会显示这些标记
        CommandBuffer cmd = new CommandBuffer();
        cmd.name = "MyCustomRendering";

        cmd.BeginSample("Shadow Pass");
        // 阴影渲染
        cmd.EndSample("Shadow Pass");

        cmd.BeginSample("Main Pass");
        // 主渲染
        cmd.EndSample("Main Pass");

        cmd.BeginSample("Post Processing");
        // 后处理
        cmd.EndSample("Post Processing");

        Graphics.ExecuteCommandBuffer(cmd);
        cmd.Release();
    }
}

// 使用 SRP 的 ProfilingSampler
#if UNITY_2019_3_OR_NEWER
using UnityEngine.Rendering;

public class SRPProfilingExample
{
    private static readonly ProfilingSampler s_MainPassSampler =
        new ProfilingSampler("MainPass");
    private static readonly ProfilingSampler s_ShadowPassSampler =
        new ProfilingSampler("ShadowPass");

    public void ExecuteRenderPass(ScriptableRenderContext context)
    {
        CommandBuffer cmd = CommandBufferPool.Get();

        using (new ProfilingScope(cmd, s_ShadowPassSampler))
        {
            // 阴影渲染逻辑
        }

        using (new ProfilingScope(cmd, s_MainPassSampler))
        {
            // 主渲染逻辑
        }

        context.ExecuteCommandBuffer(cmd);
        CommandBufferPool.Release(cmd);
    }
}
#endif
```

## Unreal Insights 详解

### Unreal Insights 概览

Unreal Insights 是 UE4.25+ 引入的新一代性能分析工具，提供了更强大的数据捕获和分析能力。

```
┌─────────────────────────────────────────────────────────────────┐
│  Unreal Insights                                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Timing Insights                                            ││
│  │  ┌──────────────────────────────────────────────────────┐  ││
│  │  │ Frame 1234 │ Frame 1235 │ Frame 1236 │ Frame 1237 │  │  ││
│  │  │   16.2ms   │   15.8ms   │   18.4ms   │   16.1ms   │  │  ││
│  │  └──────────────────────────────────────────────────────┘  ││
│  │                                                             ││
│  │  ┌──────────────────────────────────────────────────────┐  ││
│  │  │ GameThread  ████████████████░░░░░░░░░░░░  8.2ms     │  ││
│  │  │ RenderThread █████████████░░░░░░░░░░░░░░░  6.8ms    │  ││
│  │  │ RHIThread    ██████████░░░░░░░░░░░░░░░░░░  5.1ms    │  ││
│  │  └──────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
│  [Start Trace] [Stop Trace] [Load Trace] [Analysis]             │
└─────────────────────────────────────────────────────────────────┘
```

### 启用和使用 Unreal Insights

```cpp
// 通过命令行启用 Trace
// 启动游戏时添加参数：
// -trace=cpu,gpu,frame,memory,loadtime -statnamedevents

// 或在代码中动态启用
#include "ProfilingDebugging/TraceAuxiliary.h"

void AMyGameMode::BeginPlay()
{
    Super::BeginPlay();

    // 启动 trace 到文件
    FTraceAuxiliary::Start(
        FTraceAuxiliary::EConnectionType::File,
        TEXT("cpu,gpu,frame,memory"),
        nullptr  // 使用默认文件名
    );
}

void AMyGameMode::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
    // 停止 trace
    FTraceAuxiliary::Stop();

    Super::EndPlay(EndPlayReason);
}
```

### 自定义 Trace 事件

```cpp
// 使用 TRACE_CPUPROFILER_EVENT_SCOPE 宏
#include "ProfilingDebugging/CpuProfilerTrace.h"

void AMyCharacter::ProcessMovement(float DeltaTime)
{
    // CPU Profiler 事件 - 会在 Insights 的 Timing 视图中显示
    TRACE_CPUPROFILER_EVENT_SCOPE(ProcessMovement);

    // 嵌套事件
    {
        TRACE_CPUPROFILER_EVENT_SCOPE(ProcessMovement_Input);
        ProcessInput();
    }

    {
        TRACE_CPUPROFILER_EVENT_SCOPE(ProcessMovement_Physics);
        UpdatePhysics(DeltaTime);
    }

    {
        TRACE_CPUPROFILER_EVENT_SCOPE(ProcessMovement_Animation);
        UpdateAnimation();
    }
}

// 使用 SCOPED_NAMED_EVENT 进行更细粒度的标记
#include "HAL/PlatformMisc.h"

void AMyAIController::UpdateAI(float DeltaTime)
{
    SCOPED_NAMED_EVENT(AIController_UpdateAI, FColor::Red);

    {
        SCOPED_NAMED_EVENT(AIController_Perception, FColor::Green);
        UpdatePerception();
    }

    {
        SCOPED_NAMED_EVENT(AIController_DecisionMaking, FColor::Blue);
        MakeDecisions();
    }

    {
        SCOPED_NAMED_EVENT(AIController_PathFinding, FColor::Yellow);
        UpdatePathFinding();
    }
}

// 使用 Stat 系统进行统计
DECLARE_CYCLE_STAT(TEXT("MyGame - Combat System"), STAT_CombatSystem, STATGROUP_MyGame);
DECLARE_CYCLE_STAT(TEXT("MyGame - Damage Calculation"), STAT_DamageCalc, STATGROUP_MyGame);
DECLARE_DWORD_COUNTER_STAT(TEXT("MyGame - Active Enemies"), STAT_ActiveEnemies, STATGROUP_MyGame);

void ACombatManager::ProcessCombat()
{
    SCOPE_CYCLE_COUNTER(STAT_CombatSystem);

    {
        SCOPE_CYCLE_COUNTER(STAT_DamageCalc);
        CalculateDamage();
    }

    // 设置计数器统计
    SET_DWORD_STAT(STAT_ActiveEnemies, ActiveEnemyCount);
}
```

### 内存分析工具

```cpp
// 使用 LLM (Low Level Memory Tracker)
#include "HAL/LowLevelMemTracker.h"

void AMyActor::LoadResources()
{
    // LLM 标签用于分类内存使用
    LLM_SCOPE(ELLMTag::Assets);

    // 加载资源
    MyTexture = LoadObject<UTexture2D>(nullptr, TEXT("/Game/Textures/MyTexture"));

    // 自定义 LLM 标签
    LLM_SCOPE_BYNAME(TEXT("MyGame/CustomAssets"));
    LoadCustomAssets();
}

// 使用 FMallocBinned 进行内存统计
void LogMemoryStats()
{
    FPlatformMemoryStats MemStats = FPlatformMemory::GetStats();

    UE_LOG(LogTemp, Warning, TEXT("===== Memory Stats ====="));
    UE_LOG(LogTemp, Warning, TEXT("Used Physical: %llu MB"),
           MemStats.UsedPhysical / 1024 / 1024);
    UE_LOG(LogTemp, Warning, TEXT("Peak Used Physical: %llu MB"),
           MemStats.PeakUsedPhysical / 1024 / 1024);
    UE_LOG(LogTemp, Warning, TEXT("Used Virtual: %llu MB"),
           MemStats.UsedVirtual / 1024 / 1024);
}

// 追踪特定类的内存分配
#if !UE_BUILD_SHIPPING
class FMyMemoryTracker
{
public:
    static void TrackAllocation(const TCHAR* Name, SIZE_T Size)
    {
        TotalAllocated += Size;
        UE_LOG(LogTemp, Verbose, TEXT("Allocated %s: %llu bytes (Total: %llu)"),
               Name, Size, TotalAllocated);
    }

    static void TrackDeallocation(const TCHAR* Name, SIZE_T Size)
    {
        TotalAllocated -= Size;
        UE_LOG(LogTemp, Verbose, TEXT("Deallocated %s: %llu bytes (Total: %llu)"),
               Name, Size, TotalAllocated);
    }

private:
    static SIZE_T TotalAllocated;
};
#endif
```

## CPU 性能分析

### 识别 CPU 瓶颈

CPU 瓶颈通常表现为：
- GPU 使用率较低但帧率不高
- 游戏线程时间超过预算
- 特定函数调用耗时过长

```csharp
// Unity - CPU 瓶颈检测
public class CPUBottleneckDetector : MonoBehaviour
{
    private float[] frameTimeHistory = new float[60];
    private int historyIndex = 0;

    void Update()
    {
        float cpuTime = Time.deltaTime * 1000f;
        float gpuTime = GetGPUTime(); // 需要通过 Profiler API 获取

        frameTimeHistory[historyIndex] = cpuTime;
        historyIndex = (historyIndex + 1) % frameTimeHistory.Length;

        // 如果 CPU 时间明显高于 GPU 时间，可能存在 CPU 瓶颈
        if (cpuTime > gpuTime * 1.5f && cpuTime > 16.67f)
        {
            Debug.LogWarning($"Potential CPU bottleneck: CPU={cpuTime:F2}ms, GPU={gpuTime:F2}ms");
        }
    }

    float GetGPUTime()
    {
        // 实际实现需要使用 FrameTimingManager
        #if UNITY_2020_1_OR_NEWER
        FrameTimingManager.CaptureFrameTimings();
        FrameTiming[] timings = new FrameTiming[1];
        FrameTimingManager.GetLatestTimings(1, timings);
        return (float)timings[0].gpuFrameTime;
        #else
        return 0f;
        #endif
    }
}
```

### 常见 CPU 性能问题及优化

#### 循环优化

```csharp
// 问题：每帧遍历所有对象
public class BadExample : MonoBehaviour
{
    void Update()
    {
        // 每帧 FindObjectsOfType 非常昂贵
        Enemy[] enemies = FindObjectsOfType<Enemy>();
        foreach (var enemy in enemies)
        {
            enemy.UpdateAI();
        }
    }
}

// 优化：缓存引用，使用对象池
public class GoodExample : MonoBehaviour
{
    private static List<Enemy> activeEnemies = new List<Enemy>();

    public static void RegisterEnemy(Enemy enemy)
    {
        if (!activeEnemies.Contains(enemy))
            activeEnemies.Add(enemy);
    }

    public static void UnregisterEnemy(Enemy enemy)
    {
        activeEnemies.Remove(enemy);
    }

    void Update()
    {
        // 直接遍历缓存的列表
        for (int i = 0; i < activeEnemies.Count; i++)
        {
            activeEnemies[i].UpdateAI();
        }
    }
}

// 进一步优化：分帧更新
public class FrameDistributedUpdater : MonoBehaviour
{
    private static List<IUpdatable> updatables = new List<IUpdatable>();
    private int currentIndex = 0;
    private int updatesPerFrame = 10;

    void Update()
    {
        // 每帧只更新一部分对象
        int processed = 0;
        while (processed < updatesPerFrame && updatables.Count > 0)
        {
            currentIndex = currentIndex % updatables.Count;
            updatables[currentIndex].OnDistributedUpdate();
            currentIndex++;
            processed++;
        }
    }
}
```

#### 字符串操作优化

```csharp
using System.Text;

public class StringOptimization : MonoBehaviour
{
    // 问题：频繁字符串拼接产生 GC
    void BadUpdate()
    {
        string info = "Player: " + playerName + " Score: " + score + " Health: " + health;
        uiText.text = info; // 每帧产生多次 GC 分配
    }

    // 优化：使用 StringBuilder
    private StringBuilder sb = new StringBuilder(256);

    void GoodUpdate()
    {
        sb.Clear();
        sb.Append("Player: ");
        sb.Append(playerName);
        sb.Append(" Score: ");
        sb.Append(score);
        sb.Append(" Health: ");
        sb.Append(health);
        uiText.text = sb.ToString();
    }

    // 更好的优化：只在数值变化时更新
    private int lastScore = -1;
    private int lastHealth = -1;

    void BetterUpdate()
    {
        if (score != lastScore || health != lastHealth)
        {
            lastScore = score;
            lastHealth = health;

            sb.Clear();
            sb.Append("Player: ");
            sb.Append(playerName);
            sb.Append(" Score: ");
            sb.Append(score);
            sb.Append(" Health: ");
            sb.Append(health);
            uiText.text = sb.ToString();
        }
    }
}
```

#### 物理查询优化

```csharp
public class PhysicsOptimization : MonoBehaviour
{
    // 问题：频繁进行物理查询
    void BadUpdate()
    {
        // 每帧创建新数组
        Collider[] colliders = Physics.OverlapSphere(transform.position, 10f);
        foreach (var col in colliders)
        {
            ProcessCollider(col);
        }
    }

    // 优化：使用 NonAlloc 版本
    private Collider[] colliderBuffer = new Collider[32];

    void GoodUpdate()
    {
        int count = Physics.OverlapSphereNonAlloc(
            transform.position,
            10f,
            colliderBuffer
        );

        for (int i = 0; i < count; i++)
        {
            ProcessCollider(colliderBuffer[i]);
        }
    }

    // 进一步优化：使用 LayerMask 减少查询范围
    [SerializeField] private LayerMask targetLayer;

    void BetterUpdate()
    {
        int count = Physics.OverlapSphereNonAlloc(
            transform.position,
            10f,
            colliderBuffer,
            targetLayer  // 只查询特定层
        );

        for (int i = 0; i < count; i++)
        {
            ProcessCollider(colliderBuffer[i]);
        }
    }
}
```

### Jobs System 和多线程优化

```csharp
using Unity.Jobs;
using Unity.Collections;
using Unity.Burst;

// 使用 Unity Job System 进行并行计算
[BurstCompile]
public struct EnemyAIJob : IJobParallelFor
{
    [ReadOnly] public NativeArray<float3> PlayerPositions;
    [ReadOnly] public NativeArray<float3> EnemyPositions;
    public NativeArray<float3> ResultDirections;
    public float DetectionRadius;

    public void Execute(int index)
    {
        float3 enemyPos = EnemyPositions[index];
        float3 nearestDir = float3.zero;
        float nearestDist = float.MaxValue;

        // 找到最近的玩家
        for (int i = 0; i < PlayerPositions.Length; i++)
        {
            float dist = math.distance(enemyPos, PlayerPositions[i]);
            if (dist < nearestDist && dist < DetectionRadius)
            {
                nearestDist = dist;
                nearestDir = math.normalize(PlayerPositions[i] - enemyPos);
            }
        }

        ResultDirections[index] = nearestDir;
    }
}

public class JobSystemExample : MonoBehaviour
{
    private NativeArray<float3> playerPositions;
    private NativeArray<float3> enemyPositions;
    private NativeArray<float3> resultDirections;

    void Start()
    {
        // 初始化 NativeArrays
        playerPositions = new NativeArray<float3>(4, Allocator.Persistent);
        enemyPositions = new NativeArray<float3>(1000, Allocator.Persistent);
        resultDirections = new NativeArray<float3>(1000, Allocator.Persistent);
    }

    void Update()
    {
        // 更新位置数据
        UpdatePositionData();

        // 创建并调度 Job
        var job = new EnemyAIJob
        {
            PlayerPositions = playerPositions,
            EnemyPositions = enemyPositions,
            ResultDirections = resultDirections,
            DetectionRadius = 50f
        };

        // 并行执行，每批次处理 64 个敌人
        JobHandle handle = job.Schedule(enemyPositions.Length, 64);

        // 等待完成（实际项目中应该延迟到需要结果时再等待）
        handle.Complete();

        // 应用结果
        ApplyResults();
    }

    void OnDestroy()
    {
        // 释放 NativeArrays
        playerPositions.Dispose();
        enemyPositions.Dispose();
        resultDirections.Dispose();
    }
}
```

## GPU 性能分析

### GPU 瓶颈识别

GPU 瓶颈通常表现为：
- GPU 使用率接近 100%
- CPU 时间远低于帧时间
- Draw Call 数量过多
- 填充率超限

```
GPU 渲染管线瓶颈分析：

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   顶点处理   │───▶│   光栅化    │───▶│   片元处理   │───▶│   输出合并   │
│  Vertex     │    │ Rasterize  │    │  Fragment   │    │  Output     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                   │                  │                  │
      ▼                   ▼                  ▼                  ▼
 • 顶点数过多        • 三角形过多       • 着色器复杂       • Overdraw
 • 顶点着色器复杂    • 小三角形过多     • 纹理采样过多     • Alpha 混合
 • 骨骼动画过多                         • 动态分支过多     • 带宽限制
```

### Draw Call 优化

```csharp
// Unity - 使用 GPU Instancing
public class GPUInstancingExample : MonoBehaviour
{
    public Mesh mesh;
    public Material material; // 材质需要启用 GPU Instancing

    private Matrix4x4[] matrices;
    private MaterialPropertyBlock propertyBlock;
    private Vector4[] colors;

    void Start()
    {
        int instanceCount = 1000;
        matrices = new Matrix4x4[instanceCount];
        colors = new Vector4[instanceCount];
        propertyBlock = new MaterialPropertyBlock();

        // 初始化变换矩阵和颜色
        for (int i = 0; i < instanceCount; i++)
        {
            Vector3 position = new Vector3(
                Random.Range(-50f, 50f),
                0,
                Random.Range(-50f, 50f)
            );
            matrices[i] = Matrix4x4.TRS(position, Quaternion.identity, Vector3.one);
            colors[i] = new Vector4(Random.value, Random.value, Random.value, 1f);
        }
    }

    void Update()
    {
        // 设置实例属性
        propertyBlock.SetVectorArray("_Color", colors);

        // 单次 Draw Call 渲染 1000 个实例
        Graphics.DrawMeshInstanced(
            mesh,
            0,
            material,
            matrices,
            matrices.Length,
            propertyBlock
        );
    }
}

// 使用 SRP Batcher
// 确保材质和着色器兼容 SRP Batcher
// 在着色器中使用 CBUFFER 定义属性：
/*
CBUFFER_START(UnityPerMaterial)
    float4 _Color;
    float _Smoothness;
CBUFFER_END
*/

// 静态批处理检查
public class BatchingChecker : MonoBehaviour
{
    void Start()
    {
        // 检查对象是否可以静态批处理
        MeshRenderer renderer = GetComponent<MeshRenderer>();
        MeshFilter filter = GetComponent<MeshFilter>();

        if (renderer != null && filter != null)
        {
            bool canBatch = true;

            // 检查条件
            if (!gameObject.isStatic)
            {
                Debug.LogWarning($"{gameObject.name}: Not marked as static");
                canBatch = false;
            }

            if (filter.sharedMesh.vertexCount > 900)
            {
                Debug.LogWarning($"{gameObject.name}: Mesh has >900 vertices, may not batch well");
            }

            if (renderer.sharedMaterials.Length > 1)
            {
                Debug.LogWarning($"{gameObject.name}: Multiple materials prevent batching");
                canBatch = false;
            }
        }
    }
}
```

### 着色器优化

```hlsl
// 优化前的片元着色器
float4 FragmentShader_Bad(v2f i) : SV_Target
{
    // 问题1：每个像素都采样多张纹理
    float4 albedo = tex2D(_MainTex, i.uv);
    float4 normal = tex2D(_NormalMap, i.uv);
    float4 roughness = tex2D(_RoughnessMap, i.uv);
    float4 metallic = tex2D(_MetallicMap, i.uv);
    float4 ao = tex2D(_AOMap, i.uv);

    // 问题2：动态分支
    if (albedo.a < 0.5)
        discard;

    // 问题3：复杂数学运算
    float3 result = pow(albedo.rgb, 2.2); // gamma 转换
    result = result * ao.rgb;

    return float4(result, 1);
}

// 优化后的片元着色器
float4 FragmentShader_Good(v2f i) : SV_Target
{
    // 优化1：合并纹理（将 Roughness/Metallic/AO 打包到一张纹理）
    float4 albedo = tex2D(_MainTex, i.uv);
    float4 normal = tex2D(_NormalMap, i.uv);
    float4 packed = tex2D(_PackedMap, i.uv); // R=Metallic, G=Roughness, B=AO

    // 优化2：避免动态分支，使用 clip
    clip(albedo.a - 0.5);

    // 优化3：使用近似计算
    // 使用快速 sRGB 近似而不是 pow
    float3 result = albedo.rgb * albedo.rgb; // 近似 gamma 转换
    result = result * packed.b; // AO

    return float4(result, 1);
}

// LOD 着色器变体
// 使用 shader_feature 创建不同复杂度的变体
#pragma shader_feature_local _NORMALMAP
#pragma shader_feature_local _DETAIL_MAP

float4 FragmentShader_LOD(v2f i) : SV_Target
{
    float4 albedo = tex2D(_MainTex, i.uv);

    #ifdef _NORMALMAP
        float3 normal = UnpackNormal(tex2D(_NormalMap, i.uv));
    #else
        float3 normal = float3(0, 0, 1);
    #endif

    #ifdef _DETAIL_MAP
        float4 detail = tex2D(_DetailMap, i.uv * _DetailTiling);
        albedo.rgb *= detail.rgb * 2;
    #endif

    return albedo;
}
```

### Overdraw 分析与优化

```csharp
// 检测 Overdraw 的简单方法
public class OverdrawVisualizer : MonoBehaviour
{
    public Material overdrawMaterial;

    void OnRenderImage(RenderTexture src, RenderTexture dest)
    {
        // 使用特殊材质可视化 overdraw
        // 材质着色器将每个像素累加，颜色越亮表示 overdraw 越多
        Graphics.Blit(src, dest, overdrawMaterial);
    }
}

/*
// Overdraw 可视化着色器
Shader "Debug/Overdraw"
{
    SubShader
    {
        Tags { "Queue" = "Transparent" }
        ZTest Always
        ZWrite Off
        Blend One One // 累加混合

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            float4 vert(float4 v : POSITION) : SV_POSITION
            {
                return UnityObjectToClipPos(v);
            }

            float4 frag() : SV_Target
            {
                return float4(0.1, 0.04, 0.02, 1); // 每层添加一点颜色
            }
            ENDCG
        }
    }
}
*/

// Overdraw 优化策略
public class OverdrawOptimizer : MonoBehaviour
{
    // 1. 使用遮挡剔除
    void SetupOcclusionCulling()
    {
        Camera.main.useOcclusionCulling = true;
    }

    // 2. 前向排序不透明物体
    void SortOpaqueObjects()
    {
        // 从前到后排序，利用 early-z 剔除
        // Unity 会自动处理，但可以通过 RenderQueue 调整
    }

    // 3. 减少透明物体
    // 尽可能使用 Cutout 而不是 Transparent

    // 4. 使用 LOD 系统
    void SetupLOD()
    {
        LODGroup lodGroup = GetComponent<LODGroup>();
        LOD[] lods = new LOD[3];

        // 设置不同距离的 LOD
        lods[0] = new LOD(0.6f, new Renderer[] { highDetailRenderer });
        lods[1] = new LOD(0.3f, new Renderer[] { mediumDetailRenderer });
        lods[2] = new LOD(0.1f, new Renderer[] { lowDetailRenderer });

        lodGroup.SetLODs(lods);
    }
}
```

## 内存性能分析

### 内存分析工具使用

```csharp
// Unity Memory Profiler 使用
using UnityEngine;
using UnityEngine.Profiling;
using System.Collections.Generic;

public class MemoryAnalyzer : MonoBehaviour
{
    [System.Serializable]
    public class MemorySnapshot
    {
        public long totalAllocated;
        public long monoUsed;
        public long monoHeap;
        public long graphicsMemory;
        public string timestamp;
    }

    private List<MemorySnapshot> snapshots = new List<MemorySnapshot>();

    public void TakeSnapshot()
    {
        var snapshot = new MemorySnapshot
        {
            totalAllocated = Profiler.GetTotalAllocatedMemoryLong(),
            monoUsed = Profiler.GetMonoUsedSizeLong(),
            monoHeap = Profiler.GetMonoHeapSizeLong(),
            graphicsMemory = Profiler.GetAllocatedMemoryForGraphicsDriver(),
            timestamp = System.DateTime.Now.ToString("HH:mm:ss")
        };

        snapshots.Add(snapshot);

        Debug.Log($"[Memory Snapshot {snapshot.timestamp}]");
        Debug.Log($"  Total: {snapshot.totalAllocated / 1024 / 1024}MB");
        Debug.Log($"  Mono: {snapshot.monoUsed / 1024 / 1024}MB / {snapshot.monoHeap / 1024 / 1024}MB");
        Debug.Log($"  Graphics: {snapshot.graphicsMemory / 1024 / 1024}MB");
    }

    public void CompareSnapshots(int index1, int index2)
    {
        if (index1 >= snapshots.Count || index2 >= snapshots.Count) return;

        var s1 = snapshots[index1];
        var s2 = snapshots[index2];

        Debug.Log($"[Memory Comparison: {s1.timestamp} vs {s2.timestamp}]");
        Debug.Log($"  Total: {(s2.totalAllocated - s1.totalAllocated) / 1024}KB");
        Debug.Log($"  Mono: {(s2.monoUsed - s1.monoUsed) / 1024}KB");
        Debug.Log($"  Graphics: {(s2.graphicsMemory - s1.graphicsMemory) / 1024}KB");
    }
}
```

### 内存泄漏检测

```csharp
// 内存泄漏检测工具
public class MemoryLeakDetector : MonoBehaviour
{
    private Dictionary<System.Type, int> objectCounts = new Dictionary<System.Type, int>();
    private Dictionary<System.Type, int> previousCounts = new Dictionary<System.Type, int>();

    [ContextMenu("Take Object Count Snapshot")]
    public void TakeObjectCountSnapshot()
    {
        previousCounts = new Dictionary<System.Type, int>(objectCounts);
        objectCounts.Clear();

        // 统计所有 Unity 对象
        Object[] allObjects = Resources.FindObjectsOfTypeAll<Object>();

        foreach (var obj in allObjects)
        {
            System.Type type = obj.GetType();
            if (!objectCounts.ContainsKey(type))
                objectCounts[type] = 0;
            objectCounts[type]++;
        }

        // 报告变化
        foreach (var kvp in objectCounts)
        {
            int previous = previousCounts.ContainsKey(kvp.Key) ? previousCounts[kvp.Key] : 0;
            int delta = kvp.Value - previous;

            if (delta > 10) // 只报告显著增加
            {
                Debug.LogWarning($"[Potential Leak] {kvp.Key.Name}: +{delta} (Total: {kvp.Value})");
            }
        }
    }

    // 检测未释放的资源
    public void CheckForLeakedResources()
    {
        // 检查纹理
        Texture[] textures = Resources.FindObjectsOfTypeAll<Texture>();
        Debug.Log($"Loaded Textures: {textures.Length}");

        // 检查材质
        Material[] materials = Resources.FindObjectsOfTypeAll<Material>();
        Debug.Log($"Loaded Materials: {materials.Length}");

        // 检查网格
        Mesh[] meshes = Resources.FindObjectsOfTypeAll<Mesh>();
        Debug.Log($"Loaded Meshes: {meshes.Length}");

        // 检查音频
        AudioClip[] clips = Resources.FindObjectsOfTypeAll<AudioClip>();
        Debug.Log($"Loaded AudioClips: {clips.Length}");
    }
}

// 资源引用追踪器
public class ResourceTracker : MonoBehaviour
{
    private static Dictionary<string, WeakReference> trackedResources =
        new Dictionary<string, WeakReference>();

    public static void TrackResource(Object resource, string identifier)
    {
        trackedResources[identifier] = new WeakReference(resource);
    }

    public static void CheckTrackedResources()
    {
        List<string> leaked = new List<string>();
        List<string> released = new List<string>();

        foreach (var kvp in trackedResources)
        {
            if (kvp.Value.IsAlive)
            {
                leaked.Add(kvp.Key);
            }
            else
            {
                released.Add(kvp.Key);
            }
        }

        Debug.Log($"Tracked Resources - Active: {leaked.Count}, Released: {released.Count}");

        if (leaked.Count > 0)
        {
            Debug.LogWarning("Potentially leaked resources:");
            foreach (var id in leaked)
            {
                Debug.LogWarning($"  - {id}");
            }
        }
    }
}
```

### 对象池模式

```csharp
using System.Collections.Generic;
using UnityEngine;

// 通用对象池
public class ObjectPool<T> where T : class
{
    private Stack<T> pool;
    private System.Func<T> createFunc;
    private System.Action<T> onGet;
    private System.Action<T> onRelease;
    private int maxSize;

    public int CountActive { get; private set; }
    public int CountInactive => pool.Count;

    public ObjectPool(
        System.Func<T> createFunc,
        System.Action<T> onGet = null,
        System.Action<T> onRelease = null,
        int defaultCapacity = 10,
        int maxSize = 100)
    {
        this.createFunc = createFunc;
        this.onGet = onGet;
        this.onRelease = onRelease;
        this.maxSize = maxSize;
        pool = new Stack<T>(defaultCapacity);
    }

    public T Get()
    {
        T item;
        if (pool.Count > 0)
        {
            item = pool.Pop();
        }
        else
        {
            item = createFunc();
        }

        CountActive++;
        onGet?.Invoke(item);
        return item;
    }

    public void Release(T item)
    {
        if (pool.Count < maxSize)
        {
            onRelease?.Invoke(item);
            pool.Push(item);
        }
        CountActive--;
    }

    public void Clear()
    {
        pool.Clear();
        CountActive = 0;
    }
}

// GameObject 对象池
public class GameObjectPool : MonoBehaviour
{
    [System.Serializable]
    public class Pool
    {
        public string tag;
        public GameObject prefab;
        public int size;
    }

    public List<Pool> pools;
    private Dictionary<string, Queue<GameObject>> poolDictionary;

    public static GameObjectPool Instance { get; private set; }

    void Awake()
    {
        Instance = this;

        poolDictionary = new Dictionary<string, Queue<GameObject>>();

        foreach (Pool pool in pools)
        {
            Queue<GameObject> objectPool = new Queue<GameObject>();

            for (int i = 0; i < pool.size; i++)
            {
                GameObject obj = Instantiate(pool.prefab);
                obj.SetActive(false);
                obj.transform.SetParent(transform);
                objectPool.Enqueue(obj);
            }

            poolDictionary.Add(pool.tag, objectPool);
        }
    }

    public GameObject SpawnFromPool(string tag, Vector3 position, Quaternion rotation)
    {
        if (!poolDictionary.ContainsKey(tag))
        {
            Debug.LogWarning($"Pool with tag {tag} doesn't exist.");
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
            // 池耗尽时创建新对象
            Pool poolConfig = pools.Find(p => p.tag == tag);
            objectToSpawn = Instantiate(poolConfig.prefab);
            objectToSpawn.transform.SetParent(transform);
        }

        objectToSpawn.SetActive(true);
        objectToSpawn.transform.position = position;
        objectToSpawn.transform.rotation = rotation;

        // 调用池对象接口
        IPooledObject pooledObj = objectToSpawn.GetComponent<IPooledObject>();
        pooledObj?.OnSpawnFromPool();

        return objectToSpawn;
    }

    public void ReturnToPool(string tag, GameObject obj)
    {
        if (!poolDictionary.ContainsKey(tag))
        {
            Destroy(obj);
            return;
        }

        IPooledObject pooledObj = obj.GetComponent<IPooledObject>();
        pooledObj?.OnReturnToPool();

        obj.SetActive(false);
        poolDictionary[tag].Enqueue(obj);
    }
}

public interface IPooledObject
{
    void OnSpawnFromPool();
    void OnReturnToPool();
}

// 使用示例：子弹对象池
public class Bullet : MonoBehaviour, IPooledObject
{
    public float speed = 20f;
    public float lifetime = 3f;

    private float timer;

    public void OnSpawnFromPool()
    {
        timer = 0f;
    }

    public void OnReturnToPool()
    {
        // 重置状态
    }

    void Update()
    {
        transform.Translate(Vector3.forward * speed * Time.deltaTime);

        timer += Time.deltaTime;
        if (timer >= lifetime)
        {
            GameObjectPool.Instance.ReturnToPool("Bullet", gameObject);
        }
    }
}
```

## 帧分析与优化

### 帧时间分析

```csharp
using UnityEngine;
using System.Collections.Generic;

public class FrameTimeAnalyzer : MonoBehaviour
{
    // 帧时间阈值
    private const float TARGET_FRAME_TIME = 16.67f; // 60 FPS
    private const float WARNING_FRAME_TIME = 20.0f;
    private const float CRITICAL_FRAME_TIME = 33.33f; // 30 FPS

    // 帧时间历史
    private Queue<float> frameTimeHistory = new Queue<float>();
    private const int HISTORY_SIZE = 120;

    // 统计数据
    private int smoothFrames = 0;
    private int warningFrames = 0;
    private int criticalFrames = 0;

    // 卡顿检测
    private float lastFrameTime;
    private int stutterCount = 0;
    private const float STUTTER_THRESHOLD = 2.0f; // 帧时间突变倍数

    void Update()
    {
        float currentFrameTime = Time.deltaTime * 1000f;

        // 记录历史
        frameTimeHistory.Enqueue(currentFrameTime);
        if (frameTimeHistory.Count > HISTORY_SIZE)
        {
            frameTimeHistory.Dequeue();
        }

        // 分类帧
        if (currentFrameTime <= TARGET_FRAME_TIME)
        {
            smoothFrames++;
        }
        else if (currentFrameTime <= CRITICAL_FRAME_TIME)
        {
            warningFrames++;
        }
        else
        {
            criticalFrames++;
            Debug.LogWarning($"Critical frame time: {currentFrameTime:F2}ms");
        }

        // 检测卡顿
        if (lastFrameTime > 0 && currentFrameTime > lastFrameTime * STUTTER_THRESHOLD)
        {
            stutterCount++;
            Debug.LogWarning($"Stutter detected! {lastFrameTime:F2}ms -> {currentFrameTime:F2}ms");
        }

        lastFrameTime = currentFrameTime;
    }

    public void PrintStatistics()
    {
        int totalFrames = smoothFrames + warningFrames + criticalFrames;

        Debug.Log($"===== Frame Time Statistics =====");
        Debug.Log($"Total Frames: {totalFrames}");
        Debug.Log($"Smooth (<{TARGET_FRAME_TIME}ms): {smoothFrames} ({100f * smoothFrames / totalFrames:F1}%)");
        Debug.Log($"Warning (<{CRITICAL_FRAME_TIME}ms): {warningFrames} ({100f * warningFrames / totalFrames:F1}%)");
        Debug.Log($"Critical (>{CRITICAL_FRAME_TIME}ms): {criticalFrames} ({100f * criticalFrames / totalFrames:F1}%)");
        Debug.Log($"Stutter Count: {stutterCount}");

        // 计算百分位数
        List<float> sortedTimes = new List<float>(frameTimeHistory);
        sortedTimes.Sort();

        if (sortedTimes.Count > 0)
        {
            float p50 = sortedTimes[(int)(sortedTimes.Count * 0.5f)];
            float p95 = sortedTimes[(int)(sortedTimes.Count * 0.95f)];
            float p99 = sortedTimes[(int)(sortedTimes.Count * 0.99f)];

            Debug.Log($"P50: {p50:F2}ms, P95: {p95:F2}ms, P99: {p99:F2}ms");
        }
    }

    void OnGUI()
    {
        // 实时显示帧时间
        float fps = 1f / Time.deltaTime;
        float frameTime = Time.deltaTime * 1000f;

        Color color = Color.green;
        if (frameTime > WARNING_FRAME_TIME) color = Color.yellow;
        if (frameTime > CRITICAL_FRAME_TIME) color = Color.red;

        GUI.color = color;
        GUI.Label(new Rect(10, 10, 200, 20), $"FPS: {fps:F1}");
        GUI.Label(new Rect(10, 30, 200, 20), $"Frame Time: {frameTime:F2}ms");
    }
}
```

### GC 优化

```csharp
using UnityEngine;
using System;
using System.Collections.Generic;

public class GCOptimizationExamples : MonoBehaviour
{
    // 问题1：频繁创建临时对象
    void BadUpdate()
    {
        // 每帧创建新 List
        List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };

        // 字符串拼接
        string info = "Score: " + score.ToString();

        // 匿名委托
        someEvent += () => { Debug.Log("Event!"); };
    }

    // 优化：复用对象
    private List<int> cachedNumbers = new List<int>();
    private System.Text.StringBuilder sb = new System.Text.StringBuilder();
    private Action cachedAction;

    void GoodUpdate()
    {
        // 复用 List
        cachedNumbers.Clear();
        cachedNumbers.Add(1);
        cachedNumbers.Add(2);
        // ...

        // 使用 StringBuilder
        sb.Clear();
        sb.Append("Score: ");
        sb.Append(score);
        string info = sb.ToString();

        // 缓存委托
        if (cachedAction == null)
        {
            cachedAction = OnEvent;
        }
        someEvent += cachedAction;
    }

    void OnEvent() { Debug.Log("Event!"); }

    // 问题2：装箱
    void BadBoxing()
    {
        int value = 42;
        object boxed = value; // 装箱
        int unboxed = (int)boxed; // 拆箱

        // Debug.Log 会导致装箱
        Debug.Log("Value: " + value); // value 被装箱
    }

    // 优化：避免装箱
    void GoodNoBoxing()
    {
        int value = 42;

        // 使用泛型避免装箱
        ProcessValue(value);

        // 使用 ToString() 避免隐式装箱
        Debug.Log("Value: " + value.ToString());
    }

    void ProcessValue<T>(T value) where T : struct
    {
        // 泛型不会装箱
    }

    // 问题3：foreach 在某些集合上会产生 GC
    void BadForeach()
    {
        Dictionary<int, string> dict = new Dictionary<int, string>();

        // 在旧版 Unity 中可能产生 GC
        foreach (var kvp in dict)
        {
            // ...
        }
    }

    // 优化：使用 for 循环或缓存枚举器
    private Dictionary<int, string>.Enumerator cachedEnumerator;

    void GoodIteration()
    {
        // 对于 List，使用 for 循环
        List<int> list = new List<int>();
        for (int i = 0; i < list.Count; i++)
        {
            int item = list[i];
            // ...
        }

        // 对于数组，for 循环是最高效的
        int[] array = new int[100];
        for (int i = 0; i < array.Length; i++)
        {
            // ...
        }
    }

    // 控制 GC 时机
    void ManualGC()
    {
        // 在加载界面或暂停时执行 GC
        System.GC.Collect();

        // 增量 GC (Unity 2019.1+)
        // 在 Project Settings > Player > Other Settings 中启用
        // Incremental GC 会将 GC 工作分散到多帧
    }

    private int score;
    private event Action someEvent;
}

// 零 GC 的字符串格式化
public static class ZeroAllocStringFormatter
{
    private static char[] buffer = new char[32];

    public static string FormatInt(int value)
    {
        if (value == 0) return "0";

        int index = buffer.Length - 1;
        bool negative = value < 0;
        if (negative) value = -value;

        while (value > 0)
        {
            buffer[index--] = (char)('0' + value % 10);
            value /= 10;
        }

        if (negative) buffer[index--] = '-';

        return new string(buffer, index + 1, buffer.Length - index - 1);
    }

    // 对于频繁更新的 UI，考虑使用 TextMeshPro 的 SetText 方法
    // 它支持直接传入数值而不需要字符串转换
}
```

## 性能基准测试

### 自动化性能测试

```csharp
using UnityEngine;
using UnityEngine.TestTools;
using NUnit.Framework;
using System.Collections;

public class PerformanceTests
{
    // 使用 Unity Test Framework 进行性能测试
    [UnityTest]
    [Performance]
    public IEnumerator TestSceneLoadPerformance()
    {
        // 测量场景加载时间
        Measure.Method(() =>
        {
            UnityEngine.SceneManagement.SceneManager.LoadScene("TestScene");
        })
        .WarmupCount(1)
        .MeasurementCount(5)
        .Run();

        yield return null;
    }

    [Test]
    [Performance]
    public void TestPathfindingPerformance()
    {
        // 测量寻路算法性能
        var pathfinder = new AStarPathfinder();
        Vector3 start = Vector3.zero;
        Vector3 end = new Vector3(100, 0, 100);

        Measure.Method(() =>
        {
            pathfinder.FindPath(start, end);
        })
        .WarmupCount(10)
        .MeasurementCount(100)
        .SampleGroup("Pathfinding")
        .Run();
    }

    [Test]
    [Performance]
    public void TestObjectInstantiationVsPool()
    {
        GameObject prefab = new GameObject("TestPrefab");

        // 测试直接实例化
        Measure.Method(() =>
        {
            for (int i = 0; i < 100; i++)
            {
                var obj = Object.Instantiate(prefab);
                Object.Destroy(obj);
            }
        })
        .SampleGroup("Instantiate")
        .MeasurementCount(10)
        .Run();

        // 测试对象池
        var pool = new SimplePool(prefab, 100);

        Measure.Method(() =>
        {
            for (int i = 0; i < 100; i++)
            {
                var obj = pool.Get();
                pool.Return(obj);
            }
        })
        .SampleGroup("ObjectPool")
        .MeasurementCount(10)
        .Run();

        Object.Destroy(prefab);
    }
}

// 简单性能测试工具
public class SimplePerformanceTester
{
    public static void MeasureTime(string name, System.Action action, int iterations = 1000)
    {
        // 预热
        for (int i = 0; i < 10; i++)
        {
            action();
        }

        // 测量
        var sw = System.Diagnostics.Stopwatch.StartNew();

        for (int i = 0; i < iterations; i++)
        {
            action();
        }

        sw.Stop();

        double totalMs = sw.Elapsed.TotalMilliseconds;
        double avgMs = totalMs / iterations;
        double avgUs = avgMs * 1000;

        Debug.Log($"[Performance] {name}:");
        Debug.Log($"  Total: {totalMs:F2}ms for {iterations} iterations");
        Debug.Log($"  Average: {avgMs:F4}ms ({avgUs:F2}us) per call");
    }

    public static void CompareImplementations(
        string name1, System.Action action1,
        string name2, System.Action action2,
        int iterations = 1000)
    {
        MeasureTime(name1, action1, iterations);
        MeasureTime(name2, action2, iterations);
    }
}

// 使用示例
public class PerformanceTestRunner : MonoBehaviour
{
    void Start()
    {
        // 比较不同实现的性能
        SimplePerformanceTester.CompareImplementations(
            "String Concat",
            () => { string s = "Hello" + " " + "World"; },
            "StringBuilder",
            () => {
                var sb = new System.Text.StringBuilder();
                sb.Append("Hello");
                sb.Append(" ");
                sb.Append("World");
                string s = sb.ToString();
            },
            10000
        );
    }
}
```

### 持续性能监控

```csharp
using UnityEngine;
using System;
using System.IO;
using System.Collections.Generic;

public class PerformanceLogger : MonoBehaviour
{
    [Serializable]
    public class PerformanceEntry
    {
        public string timestamp;
        public float fps;
        public float frameTime;
        public long memoryUsed;
        public int drawCalls;
        public int triangles;
    }

    private List<PerformanceEntry> entries = new List<PerformanceEntry>();
    private float logInterval = 1f; // 每秒记录一次
    private float lastLogTime;
    private string logFilePath;

    void Start()
    {
        logFilePath = Path.Combine(Application.persistentDataPath,
            $"performance_log_{DateTime.Now:yyyyMMdd_HHmmss}.json");

        Debug.Log($"Performance log will be saved to: {logFilePath}");
    }

    void Update()
    {
        if (Time.time - lastLogTime >= logInterval)
        {
            RecordPerformanceData();
            lastLogTime = Time.time;
        }
    }

    void RecordPerformanceData()
    {
        var entry = new PerformanceEntry
        {
            timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
            fps = 1f / Time.deltaTime,
            frameTime = Time.deltaTime * 1000f,
            memoryUsed = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemoryLong(),
            // 注意：以下数据在运行时可能不可用
            drawCalls = UnityStats.drawCalls,
            triangles = UnityStats.triangles
        };

        entries.Add(entry);

        // 定期保存
        if (entries.Count % 60 == 0) // 每分钟保存一次
        {
            SaveLog();
        }
    }

    void SaveLog()
    {
        try
        {
            string json = JsonUtility.ToJson(new PerformanceLogWrapper { entries = entries }, true);
            File.WriteAllText(logFilePath, json);
        }
        catch (Exception e)
        {
            Debug.LogError($"Failed to save performance log: {e.Message}");
        }
    }

    void OnApplicationQuit()
    {
        SaveLog();
    }

    [Serializable]
    private class PerformanceLogWrapper
    {
        public List<PerformanceEntry> entries;
    }
}

// 性能报告生成器
public class PerformanceReportGenerator
{
    public static string GenerateReport(List<float> frameTimes, List<long> memoryUsages)
    {
        var sb = new System.Text.StringBuilder();

        sb.AppendLine("===== PERFORMANCE REPORT =====");
        sb.AppendLine($"Generated: {DateTime.Now}");
        sb.AppendLine();

        // 帧时间统计
        if (frameTimes.Count > 0)
        {
            frameTimes.Sort();
            float avg = 0;
            foreach (var ft in frameTimes) avg += ft;
            avg /= frameTimes.Count;

            sb.AppendLine("Frame Time Statistics:");
            sb.AppendLine($"  Samples: {frameTimes.Count}");
            sb.AppendLine($"  Average: {avg:F2}ms ({1000f/avg:F1} FPS)");
            sb.AppendLine($"  Min: {frameTimes[0]:F2}ms");
            sb.AppendLine($"  Max: {frameTimes[frameTimes.Count-1]:F2}ms");
            sb.AppendLine($"  P50: {frameTimes[(int)(frameTimes.Count * 0.5f)]:F2}ms");
            sb.AppendLine($"  P95: {frameTimes[(int)(frameTimes.Count * 0.95f)]:F2}ms");
            sb.AppendLine($"  P99: {frameTimes[(int)(frameTimes.Count * 0.99f)]:F2}ms");
            sb.AppendLine();
        }

        // 内存统计
        if (memoryUsages.Count > 0)
        {
            memoryUsages.Sort();
            long avg = 0;
            foreach (var mem in memoryUsages) avg += mem;
            avg /= memoryUsages.Count;

            sb.AppendLine("Memory Statistics:");
            sb.AppendLine($"  Average: {avg / 1024 / 1024}MB");
            sb.AppendLine($"  Min: {memoryUsages[0] / 1024 / 1024}MB");
            sb.AppendLine($"  Max: {memoryUsages[memoryUsages.Count-1] / 1024 / 1024}MB");
        }

        return sb.ToString();
    }
}
```

## 常见问题与最佳实践

### 性能优化清单

```
┌─────────────────────────────────────────────────────────────────┐
│                     游戏性能优化清单                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [ ] CPU 优化                                                   │
│      [ ] 减少 Update/FixedUpdate 中的计算量                      │
│      [ ] 使用对象池避免频繁实例化/销毁                            │
│      [ ] 优化物理查询（使用 LayerMask, NonAlloc）                 │
│      [ ] 减少 GetComponent 调用，缓存引用                        │
│      [ ] 使用 Jobs System 进行并行计算                           │
│      [ ] 分帧处理大量计算                                       │
│                                                                 │
│  [ ] GPU 优化                                                   │
│      [ ] 减少 Draw Calls（批处理、实例化、合并网格）               │
│      [ ] 使用 LOD 系统                                          │
│      [ ] 优化着色器复杂度                                        │
│      [ ] 减少 Overdraw                                          │
│      [ ] 使用遮挡剔除                                           │
│      [ ] 压缩纹理格式                                           │
│                                                                 │
│  [ ] 内存优化                                                   │
│      [ ] 避免运行时 GC 分配                                      │
│      [ ] 使用对象池                                             │
│      [ ] 及时卸载未使用资源                                      │
│      [ ] 使用合适的纹理尺寸和压缩格式                            │
│      [ ] 使用 Addressables 进行资源管理                          │
│                                                                 │
│  [ ] 加载优化                                                   │
│      [ ] 异步加载资源                                           │
│      [ ] 使用场景流式加载                                        │
│      [ ] 预加载常用资源                                          │
│      [ ] 优化场景复杂度                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 性能分析最佳实践

```csharp
/*
 * 性能分析最佳实践总结
 */

// 1. 建立性能预算
public class PerformanceBudget
{
    public const float TARGET_FPS = 60f;
    public const float FRAME_BUDGET_MS = 16.67f;

    public const float CPU_BUDGET_MS = 10f;
    public const float GPU_BUDGET_MS = 10f;
    public const float PHYSICS_BUDGET_MS = 2f;
    public const float ANIMATION_BUDGET_MS = 1.5f;

    public const long MEMORY_BUDGET_MB = 512;
    public const int DRAW_CALL_BUDGET = 200;
    public const int TRIANGLE_BUDGET = 500000;
}

// 2. 定期进行性能测试
public class PerformanceTestSchedule
{
    /*
     * 推荐测试频率：
     * - 每日构建：自动化性能测试
     * - 每周：完整性能分析会议
     * - 里程碑前：全面性能优化
     *
     * 测试场景：
     * - 最复杂的游戏场景
     * - 玩家密集区域
     * - 战斗/特效高峰期
     * - 场景切换
     */
}

// 3. 分析优先级
public enum OptimizationPriority
{
    Critical,   // 影响游戏可玩性
    High,       // 明显影响体验
    Medium,     // 可感知但不严重
    Low         // 微优化
}

// 4. 优化决策流程
/*
 * Step 1: 测量 - 使用 Profiler 确定瓶颈
 * Step 2: 分析 - 理解问题根因
 * Step 3: 方案 - 列出可能的优化方案
 * Step 4: 评估 - 评估每个方案的收益/成本
 * Step 5: 实施 - 实施最优方案
 * Step 6: 验证 - 确认优化效果
 * Step 7: 记录 - 记录优化结果供参考
 */

// 5. 避免过早优化
/*
 * 优化原则：
 * - 先让代码正确运行
 * - 用 Profiler 找到真正的瓶颈
 * - 优化影响最大的部分（80/20 法则）
 * - 不要凭感觉优化
 * - 每次只改变一个变量
 * - 保留优化前的代码作为参考
 */
```

## 总结

游戏性能分析是一个持续的过程，需要开发者深入理解游戏引擎的工作原理，熟练使用各种分析工具，并建立系统化的优化流程。本文介绍的内容涵盖了：

1. **性能分析基础**：理解帧率、帧时间、性能瓶颈类型等核心概念
2. **引擎工具使用**：Unity Profiler 和 Unreal Insights 的详细使用方法
3. **CPU 优化**：识别 CPU 瓶颈，优化算法、减少 GC、使用多线程
4. **GPU 优化**：减少 Draw Calls、优化着色器、减少 Overdraw
5. **内存管理**：内存泄漏检测、对象池模式、GC 优化
6. **性能测试**：自动化测试、持续监控、报告生成

性能优化的核心原则是：

- **测量先行**：不要凭感觉优化，用数据说话
- **优化瓶颈**：集中精力解决最大的性能问题
- **权衡取舍**：在性能、质量和开发效率之间找平衡
- **持续关注**：性能优化是贯穿整个开发周期的工作

掌握这些性能分析技术，将帮助你开发出流畅、高效的游戏体验。
