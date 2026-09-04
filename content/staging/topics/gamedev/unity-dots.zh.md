---
title: Unity DOTS 高性能开发
description: 掌握Unity数据导向技术栈：ECS、Job System和Burst Compiler
track: gamedev
section: unity
difficulty: advanced
tags:
  - Unity
  - DOTS
  - ECS
  - 性能优化
status: imported
origin: old/src/content/docs/gamedev/unity-dots.zh.md
divergence: 0.168
issues: []
legacy:
  category: GameDev
  subcategory: Unity
  order: 6
  lastUpdated: 2026-01-07
---

## 概念解释：什么是 DOTS

DOTS（Data-Oriented Technology Stack）是 Unity 推出的面向数据的技术栈，旨在充分利用现代多核处理器和 SIMD 指令集，实现极致的游戏性能。DOTS 由三个核心组件构成：

- **ECS（Entity Component System）**：一种面向数据的架构模式，将数据与行为分离
- **Job System**：多线程任务调度系统，简化并行编程
- **Burst Compiler**：高性能编译器，将 C# 代码编译为高度优化的原生代码

### 为什么需要 DOTS

传统 Unity 开发使用 GameObject + MonoBehaviour 架构，存在以下性能问题：

```
传统架构的问题：
┌─────────────────────────────────────────────────────────────┐
│  1. 内存布局分散：组件数据分布在堆内存各处，缓存命中率低        │
│  2. 单线程执行：Update 循环主要在主线程执行，无法充分利用多核   │
│  3. 虚函数开销：MonoBehaviour 的虚函数调用带来额外开销         │
│  4. GC 压力：频繁的对象创建和销毁导致垃圾回收卡顿              │
└─────────────────────────────────────────────────────────────┘
```

DOTS 通过数据导向设计解决这些问题：

```
DOTS 架构优势：
┌─────────────────────────────────────────────────────────────┐
│  1. 连续内存布局：相同类型组件紧密排列，提高缓存效率           │
│  2. 多线程并行：Job System 自动调度任务到多个 CPU 核心        │
│  3. 无虚函数：System 直接处理数据，消除虚函数开销             │
│  4. 零 GC 分配：使用原生容器，避免托管堆分配                  │
└─────────────────────────────────────────────────────────────┘
```

## ECS 核心架构

### Entity（实体）

Entity 是一个轻量级的标识符，本质上只是一个整数 ID。它不包含任何数据或行为，仅用于关联组件。

```csharp
using Unity.Entities;

// Entity 的内部结构
public struct Entity : IEquatable<Entity>
{
    public int Index;    // 实体索引
    public int Version;  // 版本号，用于检测实体是否被回收复用
}

// 创建实体的方式
public partial class EntityCreationExample : SystemBase
{
    protected override void OnUpdate()
    {
        // 方式1：使用 EntityManager 直接创建
        EntityManager entityManager = World.DefaultGameObjectInjectionWorld.EntityManager;
        Entity entity = entityManager.CreateEntity();

        // 方式2：使用 EntityCommandBuffer（推荐，线程安全）
        var ecb = new EntityCommandBuffer(Allocator.TempJob);
        Entity newEntity = ecb.CreateEntity();
        ecb.Playback(entityManager);
        ecb.Dispose();

        // 方式3：使用 Archetype 批量创建
        EntityArchetype archetype = entityManager.CreateArchetype(
            typeof(Translation),
            typeof(Rotation),
            typeof(LocalToWorld)
        );

        // 批量创建 1000 个实体
        NativeArray<Entity> entities = new NativeArray<Entity>(1000, Allocator.Temp);
        entityManager.CreateEntity(archetype, entities);
        entities.Dispose();
    }
}
```

### Component（组件）

组件是纯数据容器，使用 `struct` 实现并实现 `IComponentData` 接口。组件只包含数据，不包含任何行为逻辑。

```csharp
using Unity.Entities;
using Unity.Mathematics;

// 基础组件定义
public struct Position : IComponentData
{
    public float3 Value;
}

public struct Velocity : IComponentData
{
    public float3 Value;
}

public struct Health : IComponentData
{
    public float Current;
    public float Max;
}

// 带有多个字段的组件
public struct PlayerStats : IComponentData
{
    public int Level;
    public float Experience;
    public float AttackPower;
    public float Defense;
}

// 标签组件（零大小，用于过滤）
public struct EnemyTag : IComponentData { }
public struct PlayerTag : IComponentData { }
public struct DeadTag : IComponentData { }

// 使用 BlobAsset 存储共享只读数据
public struct BlobData
{
    public BlobArray<float> Values;
    public BlobString Name;
}

public struct SharedConfig : IComponentData
{
    public BlobAssetReference<BlobData> ConfigRef;
}
```

### 组件类型详解

ECS 提供多种组件类型以满足不同需求：

```csharp
using Unity.Entities;
using Unity.Collections;

// 1. IComponentData - 标准组件
public struct StandardComponent : IComponentData
{
    public float Value;
}

// 2. ISharedComponentData - 共享组件（相同值的实体共享同一份数据）
public struct RenderMesh : ISharedComponentData
{
    public Mesh mesh;
    public Material material;
}

// 3. IBufferElementData - 动态缓冲区组件
[InternalBufferCapacity(8)] // 内联容量，超过后使用堆分配
public struct DamageBufferElement : IBufferElementData
{
    public float Value;
    public Entity Source;
}

// 使用动态缓冲区
public partial class DamageSystem : SystemBase
{
    protected override void OnUpdate()
    {
        Entities.ForEach((Entity entity, ref Health health, in DynamicBuffer<DamageBufferElement> damages) =>
        {
            foreach (var damage in damages)
            {
                health.Current -= damage.Value;
            }
        }).Schedule();

        // 清除已处理的伤害
        Entities.ForEach((ref DynamicBuffer<DamageBufferElement> damages) =>
        {
            damages.Clear();
        }).Schedule();
    }
}

// 4. ICleanupComponentData - 清理组件（实体销毁时保留，用于资源清理）
public struct CleanupData : ICleanupComponentData
{
    public int ResourceHandle;
}

// 5. IEnableableComponent - 可启用/禁用的组件
public struct Stunned : IComponentData, IEnableableComponent
{
    public float Duration;
}

// 启用/禁用组件
public partial class StunSystem : SystemBase
{
    protected override void OnUpdate()
    {
        float deltaTime = SystemAPI.Time.DeltaTime;

        Entities
            .WithAll<Stunned>()
            .ForEach((Entity entity, ref Stunned stun) =>
            {
                stun.Duration -= deltaTime;
                if (stun.Duration <= 0)
                {
                    // 禁用而非移除组件
                    EntityManager.SetComponentEnabled<Stunned>(entity, false);
                }
            }).WithStructuralChanges().Run();
    }
}
```

### System（系统）

System 是行为的载体，负责处理具有特定组件组合的实体。Unity ECS 提供多种 System 基类：

```csharp
using Unity.Entities;
using Unity.Transforms;
using Unity.Mathematics;
using Unity.Burst;

// SystemBase - 最常用的系统基类
public partial class MovementSystem : SystemBase
{
    protected override void OnUpdate()
    {
        float deltaTime = SystemAPI.Time.DeltaTime;

        // Entities.ForEach - 简洁的实体查询语法
        Entities
            .WithName("MovementJob")
            .WithBurst(FloatMode.Default, FloatPrecision.Standard)
            .ForEach((ref Translation translation, in Velocity velocity) =>
            {
                translation.Value += velocity.Value * deltaTime;
            }).ScheduleParallel(); // 并行执行
    }
}

// ISystem - 更高性能的系统接口（推荐用于性能关键代码）
[BurstCompile]
public partial struct MovementSystemISystem : ISystem
{
    [BurstCompile]
    public void OnCreate(ref SystemState state)
    {
        state.RequireForUpdate<Velocity>();
    }

    [BurstCompile]
    public void OnDestroy(ref SystemState state) { }

    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        float deltaTime = SystemAPI.Time.DeltaTime;

        // 使用 SystemAPI.Query 进行实体查询
        foreach (var (transform, velocity) in
            SystemAPI.Query<RefRW<LocalTransform>, RefRO<Velocity>>())
        {
            transform.ValueRW.Position += velocity.ValueRO.Value * deltaTime;
        }
    }
}

// 使用 EntityQuery 进行复杂查询
public partial class ComplexQuerySystem : SystemBase
{
    private EntityQuery _enemyQuery;

    protected override void OnCreate()
    {
        // 创建查询：有 Health 和 EnemyTag，没有 DeadTag
        _enemyQuery = GetEntityQuery(
            ComponentType.ReadWrite<Health>(),
            ComponentType.ReadOnly<EnemyTag>(),
            ComponentType.Exclude<DeadTag>()
        );

        // 设置系统只在有匹配实体时更新
        RequireForUpdate(_enemyQuery);
    }

    protected override void OnUpdate()
    {
        // 获取查询匹配的实体数量
        int enemyCount = _enemyQuery.CalculateEntityCount();

        // 使用 Job 处理查询结果
        var job = new ProcessEnemiesJob
        {
            DeltaTime = SystemAPI.Time.DeltaTime
        };

        Dependency = job.ScheduleParallel(_enemyQuery, Dependency);
    }
}

[BurstCompile]
public partial struct ProcessEnemiesJob : IJobEntity
{
    public float DeltaTime;

    public void Execute(ref Health health, in EnemyTag enemy)
    {
        // 处理敌人逻辑
        health.Current = math.max(0, health.Current - DeltaTime);
    }
}
```

### Archetype（原型）

Archetype 是具有相同组件组合的实体集合。理解 Archetype 对于优化内存布局至关重要：

```csharp
using Unity.Entities;
using Unity.Collections;

public partial class ArchetypeExampleSystem : SystemBase
{
    protected override void OnCreate()
    {
        EntityManager em = EntityManager;

        // 创建原型
        EntityArchetype playerArchetype = em.CreateArchetype(
            typeof(Translation),
            typeof(Rotation),
            typeof(PlayerTag),
            typeof(Health),
            typeof(Velocity)
        );

        EntityArchetype enemyArchetype = em.CreateArchetype(
            typeof(Translation),
            typeof(Rotation),
            typeof(EnemyTag),
            typeof(Health),
            typeof(Velocity),
            typeof(AIState)
        );

        // 使用原型创建实体
        Entity player = em.CreateEntity(playerArchetype);

        // 批量创建
        NativeArray<Entity> enemies = em.CreateEntity(enemyArchetype, 100, Allocator.Temp);
        enemies.Dispose();
    }

    protected override void OnUpdate() { }
}

public struct AIState : IComponentData
{
    public int CurrentState;
}
```

原型内存布局示意：

```
Archetype: [Translation, Rotation, Health, Velocity]
┌────────────────────────────────────────────────────────────┐
│ Chunk 0 (16KB)                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Translation[] │ Rotation[] │ Health[] │ Velocity[]       ││
│ │ [E0,E1,E2...] │ [E0,E1,E2] │ [E0,E1,E2]│ [E0,E1,E2...]  ││
│ └──────────────────────────────────────────────────────────┘│
├────────────────────────────────────────────────────────────┤
│ Chunk 1 (16KB)                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Translation[] │ Rotation[] │ Health[] │ Velocity[]       ││
│ │ [E128,E129..] │ [E128,...]│ [E128,...] │ [E128,...]      ││
│ └──────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘

优势：
- 相同类型数据连续存储，提高缓存命中率
- 遍历时可以按数组顺序访问，充分利用 CPU 预取
- 添加/删除组件会改变 Archetype，触发实体迁移
```

## Job System 详解

Job System 是 Unity 的多线程任务调度系统，允许开发者安全高效地使用多核处理器。

### Job 类型

```csharp
using Unity.Jobs;
using Unity.Collections;
using Unity.Burst;
using Unity.Mathematics;

// 1. IJob - 单一任务
[BurstCompile]
public struct SimpleJob : IJob
{
    public NativeArray<float> Data;
    public float Multiplier;

    public void Execute()
    {
        for (int i = 0; i < Data.Length; i++)
        {
            Data[i] *= Multiplier;
        }
    }
}

// 2. IJobParallelFor - 并行处理数组
[BurstCompile]
public struct ParallelJob : IJobParallelFor
{
    [ReadOnly] public NativeArray<float3> Positions;
    [ReadOnly] public NativeArray<float3> Velocities;
    public NativeArray<float3> Results;
    public float DeltaTime;

    public void Execute(int index)
    {
        Results[index] = Positions[index] + Velocities[index] * DeltaTime;
    }
}

// 3. IJobEntity - ECS 专用 Job（推荐）
[BurstCompile]
public partial struct EntityMovementJob : IJobEntity
{
    public float DeltaTime;

    public void Execute(ref LocalTransform transform, in Velocity velocity)
    {
        transform.Position += velocity.Value * DeltaTime;
    }
}

// 4. IJobChunk - 按 Chunk 处理（更多控制）
[BurstCompile]
public struct ChunkJob : IJobChunk
{
    public ComponentTypeHandle<Translation> TranslationHandle;
    [ReadOnly] public ComponentTypeHandle<Velocity> VelocityHandle;
    public float DeltaTime;

    public void Execute(in ArchetypeChunk chunk, int unfilteredChunkIndex,
        bool useEnabledMask, in v128 chunkEnabledMask)
    {
        NativeArray<Translation> translations = chunk.GetNativeArray(ref TranslationHandle);
        NativeArray<Velocity> velocities = chunk.GetNativeArray(ref VelocityHandle);

        for (int i = 0; i < chunk.Count; i++)
        {
            translations[i] = new Translation
            {
                Value = translations[i].Value + velocities[i].Value * DeltaTime
            };
        }
    }
}
```

### Job 调度与依赖

```csharp
using Unity.Jobs;
using Unity.Collections;
using Unity.Entities;

public partial class JobSchedulingSystem : SystemBase
{
    protected override void OnUpdate()
    {
        float deltaTime = SystemAPI.Time.DeltaTime;
        int entityCount = 10000;

        // 创建原生容器
        NativeArray<float3> positions = new NativeArray<float3>(entityCount, Allocator.TempJob);
        NativeArray<float3> velocities = new NativeArray<float3>(entityCount, Allocator.TempJob);
        NativeArray<float3> results = new NativeArray<float3>(entityCount, Allocator.TempJob);

        // 初始化数据的 Job
        var initJob = new InitializeDataJob
        {
            Positions = positions,
            Velocities = velocities,
            Seed = (uint)UnityEngine.Time.frameCount
        };

        // 计算新位置的 Job
        var moveJob = new ParallelJob
        {
            Positions = positions,
            Velocities = velocities,
            Results = results,
            DeltaTime = deltaTime
        };

        // 调度 Job 链
        // initJob 先执行，完成后 moveJob 才开始
        JobHandle initHandle = initJob.Schedule(entityCount, 64);
        JobHandle moveHandle = moveJob.Schedule(entityCount, 64, initHandle);

        // 合并多个依赖
        JobHandle combinedHandle = JobHandle.CombineDependencies(initHandle, moveHandle);

        // 确保 Job 完成后释放内存
        positions.Dispose(moveHandle);
        velocities.Dispose(moveHandle);
        results.Dispose(moveHandle);

        // 将依赖传递给下一个系统
        Dependency = moveHandle;
    }
}

[BurstCompile]
public struct InitializeDataJob : IJobParallelFor
{
    [WriteOnly] public NativeArray<float3> Positions;
    [WriteOnly] public NativeArray<float3> Velocities;
    public uint Seed;

    public void Execute(int index)
    {
        var random = Random.CreateFromIndex(Seed + (uint)index);
        Positions[index] = random.NextFloat3(-100, 100);
        Velocities[index] = random.NextFloat3Direction() * random.NextFloat(1, 10);
    }
}
```

### 原生容器（Native Collections）

```csharp
using Unity.Collections;
using Unity.Jobs;

public class NativeCollectionExamples : MonoBehaviour
{
    void Start()
    {
        // NativeArray - 固定大小数组
        NativeArray<int> array = new NativeArray<int>(100, Allocator.Persistent);
        array[0] = 42;
        // 使用完毕后必须 Dispose
        array.Dispose();

        // NativeList - 动态数组
        NativeList<float> list = new NativeList<float>(Allocator.Temp);
        list.Add(1.0f);
        list.Add(2.0f);
        list.AddRange(new NativeArray<float>(new float[] { 3, 4, 5 }, Allocator.Temp));
        list.Dispose();

        // NativeHashMap - 哈希表
        NativeHashMap<int, float> hashMap = new NativeHashMap<int, float>(100, Allocator.TempJob);
        hashMap.Add(1, 10.5f);
        hashMap.TryGetValue(1, out float value);
        hashMap.Dispose();

        // NativeMultiHashMap - 多值哈希表
        NativeMultiHashMap<int, int> multiMap = new NativeMultiHashMap<int, int>(100, Allocator.TempJob);
        multiMap.Add(1, 10);
        multiMap.Add(1, 20); // 同一个 key 可以有多个值
        multiMap.Dispose();

        // NativeQueue - 队列
        NativeQueue<int> queue = new NativeQueue<int>(Allocator.TempJob);
        queue.Enqueue(1);
        queue.Enqueue(2);
        int dequeued = queue.Dequeue();
        queue.Dispose();

        // NativeStream - 多线程写入流
        NativeStream stream = new NativeStream(4, Allocator.TempJob);
        // 用于 Job 中并行写入数据
        stream.Dispose();
    }

    // 在 Job 中使用 NativeContainer 的属性标记
    [BurstCompile]
    struct ContainerAttributesJob : IJobParallelFor
    {
        [ReadOnly] public NativeArray<float> Input;           // 只读
        [WriteOnly] public NativeArray<float> Output;         // 只写
        public NativeArray<float> ReadWrite;                  // 可读可写

        [NativeDisableParallelForRestriction]
        public NativeArray<int> UnsafeAccess;                 // 禁用并行安全检查

        [NativeDisableContainerSafetyRestriction]
        public NativeArray<float> UnsafeContainer;            // 禁用容器安全检查

        public void Execute(int index)
        {
            Output[index] = Input[index] * 2;
        }
    }
}
```

### Allocator 类型

```csharp
// Allocator.Temp - 临时分配，1帧内有效，最快
NativeArray<int> tempArray = new NativeArray<int>(100, Allocator.Temp);
// 帧结束自动释放，但推荐手动 Dispose

// Allocator.TempJob - Job 临时分配，4帧内有效
NativeArray<int> jobArray = new NativeArray<int>(100, Allocator.TempJob);
// Job 完成后应 Dispose

// Allocator.Persistent - 持久分配，需手动管理
NativeArray<int> persistentArray = new NativeArray<int>(100, Allocator.Persistent);
// 必须手动 Dispose，否则内存泄漏

// 在 Job 中 Dispose
JobHandle jobHandle = myJob.Schedule();
myArray.Dispose(jobHandle); // Job 完成后自动释放
```

## Burst Compiler 深入

Burst Compiler 将 C# 代码（HPC# 子集）编译为高度优化的原生机器码，实现接近手写 C++ 的性能。

### Burst 基础用法

```csharp
using Unity.Burst;
using Unity.Jobs;
using Unity.Collections;
using Unity.Mathematics;

// 基本 Burst 编译
[BurstCompile]
public struct BasicBurstJob : IJob
{
    public NativeArray<float> Data;

    public void Execute()
    {
        for (int i = 0; i < Data.Length; i++)
        {
            Data[i] = math.sqrt(Data[i]);
        }
    }
}

// 配置 Burst 编译选项
[BurstCompile(
    FloatPrecision.Standard,           // 浮点精度
    FloatMode.Fast,                     // 快速浮点模式（允许重排序）
    CompileSynchronously = false,       // 异步编译
    OptimizeFor = OptimizeFor.Performance  // 优化目标
)]
public struct OptimizedBurstJob : IJob
{
    public NativeArray<float> Data;

    public void Execute()
    {
        // Burst 会自动向量化这个循环
        for (int i = 0; i < Data.Length; i++)
        {
            Data[i] *= 2.0f;
        }
    }
}

// FloatMode 选项说明
// FloatMode.Default  - 默认模式，严格遵循 IEEE 754
// FloatMode.Strict   - 严格模式，完全遵循 IEEE 754
// FloatMode.Deterministic - 确定性模式，跨平台一致
// FloatMode.Fast     - 快速模式，允许优化重排序
```

### Unity.Mathematics 数学库

```csharp
using Unity.Mathematics;
using Unity.Burst;
using Unity.Collections;

[BurstCompile]
public struct MathExamplesJob : IJob
{
    public NativeArray<float3> Positions;
    public NativeArray<float3> Results;
    public float3 Target;

    public void Execute()
    {
        for (int i = 0; i < Positions.Length; i++)
        {
            float3 pos = Positions[i];

            // 向量操作
            float3 direction = math.normalize(Target - pos);
            float distance = math.distance(pos, Target);
            float3 newPos = pos + direction * math.min(distance, 1.0f);

            // 数学函数
            float angle = math.atan2(direction.y, direction.x);
            float sinValue = math.sin(angle);
            float cosValue = math.cos(angle);

            // 向量插值
            float3 lerped = math.lerp(pos, Target, 0.1f);

            // 限制范围
            newPos = math.clamp(newPos, new float3(-100), new float3(100));

            Results[i] = newPos;
        }
    }
}

// 矩阵和四元数操作
[BurstCompile]
public struct TransformJob : IJob
{
    public NativeArray<float4x4> Matrices;
    public NativeArray<quaternion> Rotations;

    public void Execute()
    {
        for (int i = 0; i < Matrices.Length; i++)
        {
            // 创建变换矩阵
            float3 position = new float3(i, 0, 0);
            quaternion rotation = quaternion.Euler(0, math.radians(45), 0);
            float3 scale = new float3(1, 1, 1);

            float4x4 matrix = float4x4.TRS(position, rotation, scale);
            Matrices[i] = matrix;

            // 四元数操作
            quaternion q1 = quaternion.identity;
            quaternion q2 = quaternion.Euler(math.radians(90), 0, 0);
            Rotations[i] = math.slerp(q1, q2, 0.5f);
        }
    }
}

// 随机数
[BurstCompile]
public struct RandomJob : IJobParallelFor
{
    [WriteOnly] public NativeArray<float3> RandomPositions;
    public uint Seed;

    public void Execute(int index)
    {
        // 每个线程创建独立的随机数生成器
        Random random = Random.CreateFromIndex(Seed + (uint)index);

        RandomPositions[index] = new float3(
            random.NextFloat(-10, 10),
            random.NextFloat(0, 5),
            random.NextFloat(-10, 10)
        );
    }
}
```

### SIMD 向量化

```csharp
using Unity.Burst;
using Unity.Burst.Intrinsics;
using Unity.Collections;
using Unity.Mathematics;

[BurstCompile]
public struct SIMDJob : IJob
{
    public NativeArray<float4> Vectors;
    public float4 Multiplier;

    public void Execute()
    {
        // Burst 自动向量化
        for (int i = 0; i < Vectors.Length; i++)
        {
            Vectors[i] *= Multiplier;  // 自动使用 SIMD 指令
        }
    }
}

// 手动 SIMD 内置函数
[BurstCompile]
public struct ManualSIMDJob : IJob
{
    public NativeArray<float> Data;

    public void Execute()
    {
        // 使用 Hint 提示编译器
        int length = Data.Length;

        // 告知编译器数组长度是 4 的倍数，有利于向量化
        if (length % 4 != 0) return;

        for (int i = 0; i < length; i += 4)
        {
            // 加载 4 个连续 float
            float4 values = new float4(
                Data[i], Data[i + 1], Data[i + 2], Data[i + 3]
            );

            // 向量化计算
            values = math.sqrt(values) * 2.0f;

            // 写回
            Data[i] = values.x;
            Data[i + 1] = values.y;
            Data[i + 2] = values.z;
            Data[i + 3] = values.w;
        }
    }
}
```

### Burst 限制与最佳实践

```csharp
using Unity.Burst;
using Unity.Collections;

[BurstCompile]
public struct BurstLimitationsJob : IJob
{
    public NativeArray<int> Data;

    public void Execute()
    {
        // ❌ 不能使用的特性：
        // - 托管对象（class 实例、string、数组）
        // - try-catch（部分支持 try-finally）
        // - 虚函数调用
        // - 装箱/拆箱
        // - foreach on managed collections

        // ✅ 可以使用：
        // - 所有值类型（struct）
        // - NativeContainer
        // - 固定大小缓冲区
        // - Unity.Mathematics 类型
        // - 静态只读字段
        // - in, ref, out 参数

        // 循环优化示例
        int length = Data.Length;
        for (int i = 0; i < length; i++)
        {
            Data[i] = Data[i] * 2 + 1;
        }
    }
}

// 使用 SharedStatic 在 Burst 代码间共享数据
public struct SharedData
{
    public static readonly SharedStatic<int> Counter =
        SharedStatic<int>.GetOrCreate<SharedData>();
}

[BurstCompile]
public struct SharedStaticJob : IJob
{
    public void Execute()
    {
        // 原子操作
        System.Threading.Interlocked.Increment(ref SharedData.Counter.Data);
    }
}

// 使用 FunctionPointer 调用 Burst 编译的函数
[BurstCompile]
public static class BurstFunctions
{
    [BurstCompile]
    public static float ComputeDistance(in float3 a, in float3 b)
    {
        return math.distance(a, b);
    }

    public delegate float DistanceDelegate(in float3 a, in float3 b);

    public static readonly FunctionPointer<DistanceDelegate> DistanceFunctionPointer =
        BurstCompiler.CompileFunctionPointer<DistanceDelegate>(ComputeDistance);
}
```

## 完整实战示例

### 万人战斗系统

```csharp
using Unity.Entities;
using Unity.Transforms;
using Unity.Mathematics;
using Unity.Collections;
using Unity.Burst;
using Unity.Jobs;

// ==================== 组件定义 ====================

public struct UnitStats : IComponentData
{
    public float AttackRange;
    public float AttackDamage;
    public float AttackCooldown;
    public float CurrentCooldown;
    public float MoveSpeed;
}

public struct UnitHealth : IComponentData
{
    public float Current;
    public float Max;
}

public struct UnitTarget : IComponentData
{
    public Entity Value;
    public float3 LastKnownPosition;
}

public struct Team : IComponentData
{
    public int Value;
}

public struct Dead : IComponentData { }

// ==================== 空间划分系统 ====================

public struct SpatialHashData : IComponentData
{
    public int CellIndex;
}

[BurstCompile]
public partial struct SpatialHashingSystem : ISystem
{
    private const float CellSize = 10f;
    private const int GridWidth = 100;

    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        var job = new UpdateSpatialHashJob
        {
            CellSize = CellSize,
            GridWidth = GridWidth
        };

        state.Dependency = job.ScheduleParallel(state.Dependency);
    }

    [BurstCompile]
    partial struct UpdateSpatialHashJob : IJobEntity
    {
        public float CellSize;
        public int GridWidth;

        public void Execute(ref SpatialHashData hash, in LocalTransform transform)
        {
            int x = (int)math.floor(transform.Position.x / CellSize);
            int z = (int)math.floor(transform.Position.z / CellSize);
            hash.CellIndex = x + z * GridWidth;
        }
    }
}

// ==================== 目标查找系统 ====================

[BurstCompile]
[UpdateAfter(typeof(SpatialHashingSystem))]
public partial struct TargetFindingSystem : ISystem
{
    [BurstCompile]
    public void OnCreate(ref SystemState state)
    {
        state.RequireForUpdate<UnitStats>();
    }

    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        // 构建空间哈希表
        var spatialMap = new NativeMultiHashMap<int, Entity>(10000, Allocator.TempJob);

        // 收集所有单位位置
        var positions = new NativeHashMap<Entity, float3>(10000, Allocator.TempJob);
        var teams = new NativeHashMap<Entity, int>(10000, Allocator.TempJob);

        // 填充数据
        foreach (var (transform, team, hash, entity) in
            SystemAPI.Query<RefRO<LocalTransform>, RefRO<Team>, RefRO<SpatialHashData>>()
                .WithEntityAccess()
                .WithNone<Dead>())
        {
            spatialMap.Add(hash.ValueRO.CellIndex, entity);
            positions.Add(entity, transform.ValueRO.Position);
            teams.Add(entity, team.ValueRO.Value);
        }

        // 查找目标
        var findTargetJob = new FindTargetJob
        {
            SpatialMap = spatialMap,
            Positions = positions,
            Teams = teams,
            CellSize = 10f,
            GridWidth = 100
        };

        state.Dependency = findTargetJob.ScheduleParallel(state.Dependency);
        state.Dependency = spatialMap.Dispose(state.Dependency);
        state.Dependency = positions.Dispose(state.Dependency);
        state.Dependency = teams.Dispose(state.Dependency);
    }

    [BurstCompile]
    partial struct FindTargetJob : IJobEntity
    {
        [ReadOnly] public NativeMultiHashMap<int, Entity> SpatialMap;
        [ReadOnly] public NativeHashMap<Entity, float3> Positions;
        [ReadOnly] public NativeHashMap<Entity, int> Teams;
        public float CellSize;
        public int GridWidth;

        public void Execute(Entity entity, ref UnitTarget target,
            in LocalTransform transform, in Team team, in UnitStats stats)
        {
            float3 pos = transform.Position;
            int myTeam = team.Value;

            float closestDist = float.MaxValue;
            Entity closestEnemy = Entity.Null;

            // 检查周围9个格子
            int centerX = (int)math.floor(pos.x / CellSize);
            int centerZ = (int)math.floor(pos.z / CellSize);

            for (int dx = -1; dx <= 1; dx++)
            {
                for (int dz = -1; dz <= 1; dz++)
                {
                    int cellIndex = (centerX + dx) + (centerZ + dz) * GridWidth;

                    if (SpatialMap.TryGetFirstValue(cellIndex, out Entity other, out var it))
                    {
                        do
                        {
                            if (other == entity) continue;
                            if (!Teams.TryGetValue(other, out int otherTeam)) continue;
                            if (otherTeam == myTeam) continue;

                            if (Positions.TryGetValue(other, out float3 otherPos))
                            {
                                float dist = math.distancesq(pos, otherPos);
                                if (dist < closestDist && dist < stats.AttackRange * stats.AttackRange * 4)
                                {
                                    closestDist = dist;
                                    closestEnemy = other;
                                }
                            }
                        } while (SpatialMap.TryGetNextValue(out other, ref it));
                    }
                }
            }

            target.Value = closestEnemy;
            if (closestEnemy != Entity.Null && Positions.TryGetValue(closestEnemy, out float3 enemyPos))
            {
                target.LastKnownPosition = enemyPos;
            }
        }
    }
}

// ==================== 移动系统 ====================

[BurstCompile]
[UpdateAfter(typeof(TargetFindingSystem))]
public partial struct UnitMovementSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        float deltaTime = SystemAPI.Time.DeltaTime;

        new MoveToTargetJob { DeltaTime = deltaTime }
            .ScheduleParallel(state.Dependency);
    }

    [BurstCompile]
    partial struct MoveToTargetJob : IJobEntity
    {
        public float DeltaTime;

        public void Execute(ref LocalTransform transform, in UnitTarget target, in UnitStats stats)
        {
            if (target.Value == Entity.Null) return;

            float3 direction = target.LastKnownPosition - transform.Position;
            float distance = math.length(direction);

            if (distance > stats.AttackRange && distance > 0.1f)
            {
                float3 normalizedDir = direction / distance;
                float moveAmount = math.min(stats.MoveSpeed * DeltaTime, distance - stats.AttackRange);
                transform.Position += normalizedDir * moveAmount;

                // 旋转朝向目标
                if (math.lengthsq(normalizedDir) > 0.001f)
                {
                    transform.Rotation = quaternion.LookRotation(normalizedDir, math.up());
                }
            }
        }
    }
}

// ==================== 战斗系统 ====================

[BurstCompile]
[UpdateAfter(typeof(UnitMovementSystem))]
public partial struct CombatSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        float deltaTime = SystemAPI.Time.DeltaTime;
        var ecb = new EntityCommandBuffer(Allocator.TempJob);

        // 更新冷却并攻击
        foreach (var (stats, target, transform, entity) in
            SystemAPI.Query<RefRW<UnitStats>, RefRO<UnitTarget>, RefRO<LocalTransform>>()
                .WithEntityAccess()
                .WithNone<Dead>())
        {
            stats.ValueRW.CurrentCooldown -= deltaTime;

            if (target.ValueRO.Value != Entity.Null && stats.ValueRO.CurrentCooldown <= 0)
            {
                float distance = math.distance(transform.ValueRO.Position, target.ValueRO.LastKnownPosition);

                if (distance <= stats.ValueRO.AttackRange)
                {
                    // 对目标造成伤害（通过缓冲区）
                    if (SystemAPI.HasBuffer<DamageBufferElement>(target.ValueRO.Value))
                    {
                        var damageBuffer = SystemAPI.GetBuffer<DamageBufferElement>(target.ValueRO.Value);
                        damageBuffer.Add(new DamageBufferElement
                        {
                            Value = stats.ValueRO.AttackDamage,
                            Source = entity
                        });
                    }

                    stats.ValueRW.CurrentCooldown = stats.ValueRO.AttackCooldown;
                }
            }
        }

        ecb.Playback(state.EntityManager);
        ecb.Dispose();
    }
}

// ==================== 伤害处理系统 ====================

[BurstCompile]
[UpdateAfter(typeof(CombatSystem))]
public partial struct DamageProcessingSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        var ecb = new EntityCommandBuffer(Allocator.TempJob);

        foreach (var (health, damageBuffer, entity) in
            SystemAPI.Query<RefRW<UnitHealth>, DynamicBuffer<DamageBufferElement>>()
                .WithEntityAccess()
                .WithNone<Dead>())
        {
            float totalDamage = 0;
            foreach (var damage in damageBuffer)
            {
                totalDamage += damage.Value;
            }

            health.ValueRW.Current -= totalDamage;
            damageBuffer.Clear();

            if (health.ValueRO.Current <= 0)
            {
                ecb.AddComponent<Dead>(entity);
            }
        }

        ecb.Playback(state.EntityManager);
        ecb.Dispose();
    }
}

// ==================== 单位生成器 ====================

public partial class UnitSpawnerSystem : SystemBase
{
    protected override void OnCreate()
    {
        // 创建初始单位
        var em = EntityManager;

        EntityArchetype unitArchetype = em.CreateArchetype(
            typeof(LocalTransform),
            typeof(LocalToWorld),
            typeof(UnitStats),
            typeof(UnitHealth),
            typeof(UnitTarget),
            typeof(Team),
            typeof(SpatialHashData),
            typeof(DamageBufferElement)
        );

        Random random = Random.CreateFromIndex(12345);

        // 创建两个阵营各 5000 个单位
        for (int team = 0; team < 2; team++)
        {
            for (int i = 0; i < 5000; i++)
            {
                Entity unit = em.CreateEntity(unitArchetype);

                float3 spawnPos = new float3(
                    random.NextFloat(-200, 200),
                    0,
                    team == 0 ? random.NextFloat(-200, -50) : random.NextFloat(50, 200)
                );

                em.SetComponentData(unit, LocalTransform.FromPosition(spawnPos));
                em.SetComponentData(unit, new UnitStats
                {
                    AttackRange = random.NextFloat(2, 5),
                    AttackDamage = random.NextFloat(5, 15),
                    AttackCooldown = random.NextFloat(0.5f, 1.5f),
                    CurrentCooldown = 0,
                    MoveSpeed = random.NextFloat(3, 8)
                });
                em.SetComponentData(unit, new UnitHealth
                {
                    Current = 100,
                    Max = 100
                });
                em.SetComponentData(unit, new Team { Value = team });
            }
        }

        Enabled = false; // 只执行一次
    }

    protected override void OnUpdate() { }
}
```

## 性能对比

### 基准测试：10000 个实体的移动系统

```
┌─────────────────────────────────────────────────────────────┐
│ 测试场景：10000 个实体执行位置更新                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  传统 MonoBehaviour:                                        │
│  ├─ Update 循环时间: ~16.7ms (60 FPS 极限)                  │
│  ├─ 内存分配: ~2.4MB (组件分散在堆上)                       │
│  └─ CPU 利用率: ~12% (单核)                                 │
│                                                             │
│  DOTS (SystemBase + Burst):                                 │
│  ├─ Update 循环时间: ~0.8ms                                 │
│  ├─ 内存分配: ~0.4MB (连续内存块)                           │
│  └─ CPU 利用率: ~85% (多核并行)                             │
│                                                             │
│  性能提升: ~20x                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 性能优化检查清单

```csharp
// 1. 确保 Burst 编译生效
[BurstCompile(CompileSynchronously = true)] // 开发时同步编译便于调试
public struct MyJob : IJob { ... }

// 2. 避免结构化变更（Structural Changes）
// ❌ 不好：在 ForEach 中添加/删除组件
Entities.ForEach((Entity e) => {
    EntityManager.AddComponent<Tag>(e); // 每次都触发 Archetype 变更
}).WithStructuralChanges().Run();

// ✅ 好：使用 EntityCommandBuffer 批量处理
var ecb = new EntityCommandBuffer(Allocator.TempJob);
Entities.ForEach((Entity e) => {
    ecb.AddComponent<Tag>(e);
}).Schedule();
ecb.Playback(EntityManager);

// 3. 合理设置 Chunk 组件
// 如果某个组件很少改变，但经常用于查询，考虑使用 SharedComponent

// 4. 使用正确的调度方式
.Run()              // 主线程同步执行
.Schedule()         // 单线程异步执行
.ScheduleParallel() // 多线程并行执行（首选）

// 5. 检查 Job 依赖
// 确保没有不必要的同步点
state.Dependency = myJob.Schedule(state.Dependency);
```

## 从传统架构迁移

### 迁移策略

```
┌─────────────────────────────────────────────────────────────┐
│                    渐进式迁移路径                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  阶段 1: 混合模式                                           │
│  ├─ 保留 GameObject 用于渲染和物理                          │
│  ├─ 使用 ECS 处理游戏逻辑                                   │
│  └─ 通过 Companion GameObject 桥接                          │
│                                                             │
│  阶段 2: 纯 ECS 逻辑                                        │
│  ├─ 将核心系统迁移到 ECS                                    │
│  ├─ 使用 Entities Graphics 进行渲染                         │
│  └─ 保留少量 MonoBehaviour 用于 UI                          │
│                                                             │
│  阶段 3: 完全 DOTS                                          │
│  ├─ 所有游戏逻辑使用 ECS                                    │
│  ├─ 使用 Unity Physics 替代传统物理                         │
│  └─ UI 使用 UI Toolkit 或自定义 ECS UI                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Baker：从 GameObject 到 Entity

```csharp
using Unity.Entities;
using Unity.Transforms;
using UnityEngine;

// Authoring 组件（放在 GameObject 上）
public class UnitAuthoring : MonoBehaviour
{
    public float moveSpeed = 5f;
    public float maxHealth = 100f;
    public int team = 0;

    // Baker 负责将 Authoring 数据转换为 ECS 组件
    public class Baker : Baker<UnitAuthoring>
    {
        public override void Bake(UnitAuthoring authoring)
        {
            // 获取要转换的实体
            Entity entity = GetEntity(TransformUsageFlags.Dynamic);

            // 添加组件
            AddComponent(entity, new UnitStats
            {
                MoveSpeed = authoring.moveSpeed,
                AttackRange = 3f,
                AttackDamage = 10f,
                AttackCooldown = 1f,
                CurrentCooldown = 0f
            });

            AddComponent(entity, new UnitHealth
            {
                Current = authoring.maxHealth,
                Max = authoring.maxHealth
            });

            AddComponent(entity, new Team { Value = authoring.team });
            AddComponent(entity, new UnitTarget());
            AddComponent(entity, new SpatialHashData());

            // 添加动态缓冲区
            AddBuffer<DamageBufferElement>(entity);
        }
    }
}

// 复杂 Baker 示例：处理子对象和引用
public class VehicleAuthoring : MonoBehaviour
{
    public GameObject[] wheels;
    public float maxSpeed = 20f;
    public float acceleration = 5f;

    public class Baker : Baker<VehicleAuthoring>
    {
        public override void Bake(VehicleAuthoring authoring)
        {
            Entity vehicleEntity = GetEntity(TransformUsageFlags.Dynamic);

            AddComponent(vehicleEntity, new VehicleData
            {
                MaxSpeed = authoring.maxSpeed,
                Acceleration = authoring.acceleration
            });

            // 处理子对象引用
            var wheelBuffer = AddBuffer<WheelElement>(vehicleEntity);
            foreach (var wheel in authoring.wheels)
            {
                if (wheel != null)
                {
                    Entity wheelEntity = GetEntity(wheel, TransformUsageFlags.Dynamic);
                    wheelBuffer.Add(new WheelElement { WheelEntity = wheelEntity });
                }
            }

            // 声明依赖，确保引用的 Prefab 被正确转换
            foreach (var wheel in authoring.wheels)
            {
                if (wheel != null)
                {
                    DependsOn(wheel);
                }
            }
        }
    }
}

public struct VehicleData : IComponentData
{
    public float MaxSpeed;
    public float Acceleration;
    public float CurrentSpeed;
}

public struct WheelElement : IBufferElementData
{
    public Entity WheelEntity;
}
```

### 与 GameObject 世界交互

```csharp
using Unity.Entities;
using Unity.Transforms;
using UnityEngine;

// 从 MonoBehaviour 访问 ECS
public class HybridController : MonoBehaviour
{
    private EntityManager _entityManager;
    private Entity _linkedEntity;

    void Start()
    {
        _entityManager = World.DefaultGameObjectInjectionWorld.EntityManager;

        // 创建关联实体
        _linkedEntity = _entityManager.CreateEntity(
            typeof(LocalTransform),
            typeof(LocalToWorld),
            typeof(UnitStats)
        );

        _entityManager.SetComponentData(_linkedEntity, new UnitStats
        {
            MoveSpeed = 5f,
            AttackRange = 3f,
            AttackDamage = 10f,
            AttackCooldown = 1f,
            CurrentCooldown = 0f
        });
    }

    void Update()
    {
        // 同步 Transform
        if (_entityManager.Exists(_linkedEntity))
        {
            _entityManager.SetComponentData(_linkedEntity,
                LocalTransform.FromPositionRotation(transform.position, transform.rotation));
        }
    }

    void OnDestroy()
    {
        if (_entityManager != null && _entityManager.Exists(_linkedEntity))
        {
            _entityManager.DestroyEntity(_linkedEntity);
        }
    }
}

// 从 ECS 系统访问 GameObject
public partial class SyncToGameObjectSystem : SystemBase
{
    protected override void OnUpdate()
    {
        // 使用 EntityQuery 过滤有 Companion 的实体
        Entities
            .WithoutBurst() // GameObject 操作需要主线程
            .ForEach((in LocalTransform transform, in GameObjectReference goRef) =>
            {
                if (goRef.Value != null)
                {
                    goRef.Value.transform.position = transform.Position;
                    goRef.Value.transform.rotation = transform.Rotation;
                }
            }).Run();
    }
}

public struct GameObjectReference : IComponentData
{
    public GameObject Value;
}

// 使用 Managed Component 存储托管对象引用
public class ManagedData : IComponentData
{
    public GameObject LinkedGameObject;
    public Material DynamicMaterial;
    public string EntityName;
}
```

## 调试与性能分析

### Entity Debugger

```csharp
// 在代码中添加调试信息
public partial class DebugSystem : SystemBase
{
    protected override void OnUpdate()
    {
        int entityCount = 0;
        int deadCount = 0;

        Entities.ForEach((in UnitHealth health) =>
        {
            entityCount++;
        }).WithoutBurst().Run();

        Entities.WithAll<Dead>().ForEach((Entity e) =>
        {
            deadCount++;
        }).WithoutBurst().Run();

        // 在 Entity Debugger 中可见
        Debug.Log($"Total units: {entityCount}, Dead: {deadCount}");
    }
}

// 使用 SystemGroup 组织系统更新顺序
[UpdateInGroup(typeof(SimulationSystemGroup))]
[UpdateBefore(typeof(TransformSystemGroup))]
public partial class GameLogicSystemGroup : ComponentSystemGroup { }

[UpdateInGroup(typeof(GameLogicSystemGroup))]
public partial class MovementSystem : SystemBase { ... }

[UpdateInGroup(typeof(GameLogicSystemGroup))]
[UpdateAfter(typeof(MovementSystem))]
public partial class CollisionSystem : SystemBase { ... }
```

### Profiler 集成

```csharp
using Unity.Profiling;
using Unity.Entities;

public partial class ProfiledSystem : SystemBase
{
    private static readonly ProfilerMarker s_PrepareMarker =
        new ProfilerMarker("MySystem.Prepare");
    private static readonly ProfilerMarker s_ExecuteMarker =
        new ProfilerMarker("MySystem.Execute");

    protected override void OnUpdate()
    {
        using (s_PrepareMarker.Auto())
        {
            // 准备数据
        }

        using (s_ExecuteMarker.Auto())
        {
            // 执行主要逻辑
            Entities.ForEach((ref LocalTransform transform, in Velocity velocity) =>
            {
                transform.Position += velocity.Value * SystemAPI.Time.DeltaTime;
            }).ScheduleParallel();
        }
    }
}
```

## 常见问题与解决方案

### 问题 1：结构变更导致的性能问题

```csharp
// ❌ 问题：频繁添加/删除组件导致 Archetype 碎片化
Entities.ForEach((Entity e, in Health h) => {
    if (h.Current <= 0)
        EntityManager.AddComponent<Dead>(e);
}).WithStructuralChanges().Run();

// ✅ 解决方案 1：使用 EnableableComponent
public struct Dead : IComponentData, IEnableableComponent { }

Entities.ForEach((Entity e, in Health h) => {
    if (h.Current <= 0)
        EntityManager.SetComponentEnabled<Dead>(e, true);
}).WithStructuralChanges().Run();

// ✅ 解决方案 2：延迟结构变更
var ecb = SystemAPI.GetSingleton<EndSimulationEntityCommandBufferSystem.Singleton>()
    .CreateCommandBuffer(state.WorldUnmanaged);

Entities.ForEach((Entity e, in Health h) => {
    if (h.Current <= 0)
        ecb.AddComponent<Dead>(e);
}).Schedule();
```

### 问题 2：Job 中访问实体数据

```csharp
// ❌ 问题：无法在 Job 中直接访问 EntityManager
[BurstCompile]
partial struct BadJob : IJobEntity
{
    public EntityManager EM; // 不支持！

    public void Execute(Entity e, in UnitTarget target)
    {
        // var pos = EM.GetComponentData<LocalTransform>(target.Value); // 错误！
    }
}

// ✅ 解决方案：使用 ComponentLookup
[BurstCompile]
partial struct GoodJob : IJobEntity
{
    [ReadOnly] public ComponentLookup<LocalTransform> TransformLookup;

    public void Execute(ref UnitTarget target)
    {
        if (TransformLookup.HasComponent(target.Value))
        {
            target.LastKnownPosition = TransformLookup[target.Value].Position;
        }
    }
}

// 在系统中设置
public partial struct MySystem : ISystem
{
    private ComponentLookup<LocalTransform> _transformLookup;

    public void OnCreate(ref SystemState state)
    {
        _transformLookup = state.GetComponentLookup<LocalTransform>(true);
    }

    public void OnUpdate(ref SystemState state)
    {
        _transformLookup.Update(ref state);

        var job = new GoodJob
        {
            TransformLookup = _transformLookup
        };
        state.Dependency = job.ScheduleParallel(state.Dependency);
    }
}
```

### 问题 3：随机数在并行 Job 中的使用

```csharp
// ❌ 问题：共享随机数生成器导致竞态条件
[BurstCompile]
partial struct BadRandomJob : IJobEntity
{
    public Random SharedRandom; // 竞态条件！

    public void Execute(ref Velocity velocity)
    {
        velocity.Value = SharedRandom.NextFloat3Direction(); // 不确定结果
    }
}

// ✅ 解决方案：每个实体使用独立种子
[BurstCompile]
partial struct GoodRandomJob : IJobEntity
{
    public uint BaseSeed;

    public void Execute([EntityIndexInQuery] int index, ref Velocity velocity)
    {
        var random = Random.CreateFromIndex(BaseSeed + (uint)index);
        velocity.Value = random.NextFloat3Direction() * random.NextFloat(1, 10);
    }
}
```

## 面试要点

### 核心概念题

**1. 解释 ECS 架构相比传统 GameObject/MonoBehaviour 的优势？**

ECS 架构的主要优势包括：
- **内存布局优化**：相同类型组件连续存储在 Chunk 中，缓存命中率高
- **多线程友好**：数据和行为分离，便于并行处理
- **零 GC 分配**：使用 NativeContainer 避免托管堆分配
- **代码可测试性**：System 是纯函数，便于单元测试

**2. Archetype 和 Chunk 的关系是什么？**

Archetype 定义了一组特定的组件组合，每个 Archetype 包含多个 16KB 的 Chunk。Chunk 是内存分配的基本单位，存储具有相同 Archetype 的实体数据。当实体的组件组合改变时，实体会从一个 Archetype 的 Chunk 移动到另一个。

**3. Burst Compiler 如何提升性能？**

Burst 通过以下方式提升性能：
- 将 HPC# 代码编译为高度优化的原生代码
- 自动向量化（SIMD）
- 消除边界检查
- 内联函数调用
- 利用特定 CPU 架构的指令集

### 实践编码题

```csharp
// 实现一个简单的空间分区系统
[BurstCompile]
public partial struct SimpleSpatialPartitionSystem : ISystem
{
    public void OnCreate(ref SystemState state) { }

    public void OnDestroy(ref SystemState state) { }

    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        const float cellSize = 10f;
        const int gridWidth = 100;

        var cellMap = new NativeMultiHashMap<int, Entity>(1000, Allocator.TempJob);

        // 构建空间哈希
        foreach (var (transform, entity) in
            SystemAPI.Query<RefRO<LocalTransform>>().WithEntityAccess())
        {
            float3 pos = transform.ValueRO.Position;
            int cellX = (int)math.floor(pos.x / cellSize);
            int cellZ = (int)math.floor(pos.z / cellSize);
            int cellIndex = cellX + cellZ * gridWidth;
            cellMap.Add(cellIndex, entity);
        }

        // 使用空间哈希进行邻近查询...

        cellMap.Dispose();
    }
}

// 实现带并发控制的 EntityCommandBuffer 使用
public partial class SafeECBSystem : SystemBase
{
    private EndSimulationEntityCommandBufferSystem _ecbSystem;

    protected override void OnCreate()
    {
        _ecbSystem = World.GetOrCreateSystemManaged<EndSimulationEntityCommandBufferSystem>();
    }

    protected override void OnUpdate()
    {
        var ecb = _ecbSystem.CreateCommandBuffer().AsParallelWriter();

        Entities
            .WithBurst()
            .ForEach((Entity entity, int entityInQueryIndex, in Health health) =>
            {
                if (health.Current <= 0)
                {
                    // 使用 entityInQueryIndex 保证并行安全
                    ecb.AddComponent<Dead>(entityInQueryIndex, entity);
                }
            }).ScheduleParallel();

        _ecbSystem.AddJobHandleForProducer(Dependency);
    }
}
```

## 延伸阅读

### 官方资源

- [Unity DOTS 官方文档](https://docs.unity3d.com/Packages/com.unity.entities@latest)
- [Unity DOTS 示例项目](https://github.com/Unity-Technologies/EntityComponentSystemSamples)
- [Burst 编译器文档](https://docs.unity3d.com/Packages/com.unity.burst@latest)

### 进阶主题

- **Unity Physics**：基于 DOTS 的高性能物理引擎
- **Netcode for Entities**：DOTS 多人游戏网络解决方案
- **Entities Graphics**：高性能 ECS 渲染系统
- **DOTS Animation**：数据导向动画系统

### 性能分析工具

- **Unity Profiler**：内置性能分析工具，支持 Job 和 Burst 分析
- **Entity Debugger**：ECS 专用调试窗口
- **Burst Inspector**：查看 Burst 编译输出的汇编代码
- **Memory Profiler**：分析内存使用和 Chunk 布局

### 社区资源

- [Unity DOTS Forum](https://forum.unity.com/forums/data-oriented-technology-stack.147/)
- [DOTS Best Practices](https://github.com/Unity-Technologies/DOTSSample)
- [Latios Framework](https://github.com/Dreaming381/Latios-Framework) - 社区扩展框架

---

> DOTS 是 Unity 高性能游戏开发的未来。掌握 ECS、Job System 和 Burst Compiler 的协同使用，是构建大规模游戏的关键。建议从小型项目开始实践，逐步将传统架构迁移到 DOTS，在实践中深入理解数据导向设计的精髓。
