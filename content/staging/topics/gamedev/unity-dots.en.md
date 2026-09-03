---
title: Unity DOTS High-Performance Development
description: "Master Unity Data-Oriented Technology Stack: ECS, Job System, and Burst Compiler"
track: gamedev
section: unity
difficulty: advanced
tags:
  - Unity
  - DOTS
  - ECS
  - performance
status: imported
origin: old/src/content/docs/gamedev/unity-dots.en.md
divergence: 0.168
issues: []
legacy:
  category: GameDev
  subcategory: Unity
  order: 6
  lastUpdated: 2026-01-07
---

Unity's Data-Oriented Technology Stack (DOTS) represents a paradigm shift in game development, enabling unprecedented performance gains through data-oriented design principles. This comprehensive guide covers the core pillars of DOTS: the Entity Component System (ECS), Job System, and Burst Compiler.

## Understanding DOTS Architecture

### What is DOTS?

DOTS is Unity's collection of technologies designed to leverage modern multi-core processors effectively. It consists of three main components:

1. **Entity Component System (ECS)**: A data-oriented architecture pattern that separates data from behavior
2. **Job System**: A multi-threading system for scheduling work across multiple CPU cores
3. **Burst Compiler**: A compiler that generates highly optimized native code from C#

```
Traditional Unity                 DOTS Architecture
+------------------+             +------------------+
|   MonoBehaviour  |             |     Entity       |
|  (Data + Logic)  |             |   (Just an ID)   |
+------------------+             +------------------+
         |                                |
         v                                v
+------------------+             +------------------+
|   Update Loop    |             |   Components     |
|  (Single Thread) |             |   (Pure Data)    |
+------------------+             +------------------+
                                          |
                                          v
                                 +------------------+
                                 |     Systems      |
                                 | (Logic + Jobs)   |
                                 +------------------+
```

### Why DOTS Matters

The shift from object-oriented to data-oriented design addresses fundamental performance limitations:

- **Cache Efficiency**: Components are stored contiguously in memory, maximizing CPU cache utilization
- **Parallelization**: Logic in Systems can be easily parallelized across CPU cores
- **Determinism**: Data-oriented code is easier to make deterministic, crucial for networking and replays
- **Scalability**: Handle thousands or millions of entities with consistent performance

## Setting Up DOTS

### Prerequisites

To use the Entities package, you need:
- Unity version 2022.3.0f1 or later
- Basic understanding of C# and Unity development

### Installing DOTS Packages

Add the following packages via the Package Manager:

```
com.unity.entities           // Core ECS
com.unity.entities.graphics  // Rendering support
com.unity.physics           // DOTS Physics
com.unity.burst             // Burst Compiler
com.unity.collections       // Native collections
```

Alternatively, add to your `manifest.json`:

```json
{
  "dependencies": {
    "com.unity.entities": "1.0.16",
    "com.unity.entities.graphics": "1.0.16",
    "com.unity.burst": "1.8.12",
    "com.unity.collections": "2.2.1"
  }
}
```

## Entity Component System (ECS)

### Core Concepts

ECS separates data and behavior into three distinct concepts:

- **Entity**: A unique identifier (essentially just an integer ID)
- **Component**: Pure data with no behavior
- **System**: Logic that operates on entities with specific component combinations

### Defining Components with IComponentData

Components are structs that implement `IComponentData`. They contain only data, no methods:

```csharp
using Unity.Entities;
using Unity.Mathematics;

// Simple component holding position data
public struct Position : IComponentData
{
    public float3 Value;
}

// Component for movement speed
public struct MoveSpeed : IComponentData
{
    public float Value;
}

// Tag component (no data, used for filtering)
public struct EnemyTag : IComponentData { }

// Component with multiple fields
public struct Health : IComponentData
{
    public float Current;
    public float Maximum;
    public bool IsInvulnerable;
}
```

### Component Types

ECS provides several component types for different use cases:

```csharp
// Standard component - attached to individual entities
public struct StandardComponent : IComponentData
{
    public int Value;
}

// Shared component - shared between entities with same value
// Useful for grouping entities (e.g., by faction, team)
public struct FactionShared : ISharedComponentData
{
    public int FactionId;
}

// Buffer element - dynamic array per entity
[InternalBufferCapacity(8)]
public struct InventoryItem : IBufferElementData
{
    public int ItemId;
    public int Quantity;
}

// Enableable component - can be toggled without structural changes
public struct Stunned : IComponentData, IEnableableComponent
{
    public float Duration;
}

// Cleanup component - survives entity destruction until explicitly removed
public struct CleanupData : ICleanupComponentData
{
    public int ResourceHandle;
}
```

### Archetypes and Memory Layout

An archetype defines a unique combination of component types. Entities with identical component compositions share the same archetype:

```csharp
// These entities share the same archetype
// Archetype: [Position, Rotation, MoveSpeed]
Entity player = entityManager.CreateEntity(
    typeof(Position),
    typeof(Rotation),
    typeof(MoveSpeed)
);

// Different archetype due to EnemyTag
// Archetype: [Position, Rotation, MoveSpeed, EnemyTag]
Entity enemy = entityManager.CreateEntity(
    typeof(Position),
    typeof(Rotation),
    typeof(MoveSpeed),
    typeof(EnemyTag)
);
```

Memory layout visualization:

```
Archetype: [Position, MoveSpeed]
+------------------------------------------+
|  Chunk 0 (16KB)                          |
|  +--------+--------+--------+--------+   |
|  | Pos[0] | Pos[1] | Pos[2] | Pos[3] |   |  <- Contiguous Position array
|  +--------+--------+--------+--------+   |
|  +--------+--------+--------+--------+   |
|  | Spd[0] | Spd[1] | Spd[2] | Spd[3] |   |  <- Contiguous MoveSpeed array
|  +--------+--------+--------+--------+   |
+------------------------------------------+
```

## Systems: ISystem vs SystemBase

Unity ECS provides two system types: `ISystem` (struct-based) and `SystemBase` (class-based).

### ISystem (Recommended)

`ISystem` is the modern, high-performance approach:

```csharp
using Unity.Burst;
using Unity.Entities;
using Unity.Mathematics;
using Unity.Transforms;

[BurstCompile]
public partial struct MovementSystem : ISystem
{
    [BurstCompile]
    public void OnCreate(ref SystemState state)
    {
        // Called once when system is created
        state.RequireForUpdate<MoveSpeed>();
    }

    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        float deltaTime = SystemAPI.Time.DeltaTime;

        // Iterate over all entities with LocalTransform and MoveSpeed
        foreach (var (transform, speed) in
            SystemAPI.Query<RefRW<LocalTransform>, RefRO<MoveSpeed>>())
        {
            transform.ValueRW.Position +=
                new float3(0, 0, speed.ValueRO.Value * deltaTime);
        }
    }

    [BurstCompile]
    public void OnDestroy(ref SystemState state)
    {
        // Cleanup when system is destroyed
    }
}
```

### SystemBase (Legacy but Still Supported)

`SystemBase` uses class inheritance and provides helper methods:

```csharp
using Unity.Entities;
using Unity.Mathematics;
using Unity.Transforms;

public partial class MovementSystemBase : SystemBase
{
    protected override void OnCreate()
    {
        RequireForUpdate<MoveSpeed>();
    }

    protected override void OnUpdate()
    {
        float deltaTime = SystemAPI.Time.DeltaTime;

        // Entities.ForEach pattern
        Entities
            .WithAll<EnemyTag>()
            .ForEach((ref LocalTransform transform, in MoveSpeed speed) =>
            {
                transform.Position += new float3(0, 0, speed.Value * deltaTime);
            })
            .ScheduleParallel();
    }
}
```

### When to Use Which

| Feature | ISystem | SystemBase |
|---------|---------|------------|
| Burst Compilation | Full support | Limited |
| Memory Allocation | Zero allocations | May allocate |
| Performance | Optimal | Good |
| Ease of Use | Moderate | Easier |
| Managed Types | Not allowed | Supported |

**Recommendation**: Use `ISystem` for new projects and performance-critical systems.

### System Queries

Query entities with specific component combinations:

```csharp
[BurstCompile]
public partial struct QueryExamplesSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        // Basic query - entities with Position AND Velocity
        foreach (var (pos, vel) in
            SystemAPI.Query<RefRW<Position>, RefRO<Velocity>>())
        {
            pos.ValueRW.Value += vel.ValueRO.Value;
        }

        // Query with entity reference
        foreach (var (pos, entity) in
            SystemAPI.Query<RefRO<Position>>().WithEntityAccess())
        {
            // Access entity ID alongside component
        }

        // Filter with WithAll (must have component, don't need data)
        foreach (var pos in
            SystemAPI.Query<RefRW<Position>>().WithAll<EnemyTag>())
        {
            // Only entities that also have EnemyTag
        }

        // Filter with WithNone (exclude entities with component)
        foreach (var pos in
            SystemAPI.Query<RefRW<Position>>().WithNone<DeadTag>())
        {
            // Exclude dead entities
        }

        // Filter with WithAny (at least one of the components)
        foreach (var pos in
            SystemAPI.Query<RefRW<Position>>().WithAny<Player, Enemy>())
        {
            // Either Player OR Enemy (or both)
        }
    }
}
```

## Job System

The Job System enables safe multi-threaded code execution across multiple CPU cores.

### IJobEntity

`IJobEntity` is the recommended way to process entities in parallel:

```csharp
using Unity.Burst;
using Unity.Entities;
using Unity.Mathematics;
using Unity.Transforms;

[BurstCompile]
public partial struct MoveJob : IJobEntity
{
    public float DeltaTime;

    // Execute is called for each entity matching the query
    void Execute(ref LocalTransform transform, in MoveSpeed speed)
    {
        transform.Position += new float3(0, 0, speed.Value * DeltaTime);
    }
}

[BurstCompile]
public partial struct MovementJobSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        var moveJob = new MoveJob
        {
            DeltaTime = SystemAPI.Time.DeltaTime
        };

        // Schedule runs on multiple threads in parallel
        moveJob.ScheduleParallel();
    }
}
```

### IJobParallelFor

For processing arrays in parallel:

```csharp
using Unity.Burst;
using Unity.Collections;
using Unity.Jobs;

[BurstCompile]
public struct SquareNumbersJob : IJobParallelFor
{
    public NativeArray<int> Numbers;

    // Execute is called for each index
    public void Execute(int index)
    {
        Numbers[index] *= Numbers[index];
    }
}

// Scheduling the job
public void ProcessNumbers()
{
    var numbers = new NativeArray<int>(1000, Allocator.TempJob);

    // Initialize array...

    var job = new SquareNumbersJob { Numbers = numbers };

    // Schedule with array length and batch size
    JobHandle handle = job.Schedule(
        numbers.Length,  // Total items to process
        64               // Batch size per thread
    );

    // Wait for completion
    handle.Complete();

    // Use results...

    numbers.Dispose();
}
```

### Job Dependencies

Chain jobs together safely:

```csharp
using Unity.Burst;
using Unity.Collections;
using Unity.Jobs;
using Unity.Mathematics;

[BurstCompile]
public struct SortTargetsJob : IJob
{
    public NativeArray<float3> Positions;

    public void Execute()
    {
        // Sort positions by X coordinate
        // (simplified - use NativeSortExtension in practice)
    }
}

[BurstCompile]
public struct FindNearestJob : IJobParallelFor
{
    [ReadOnly] public NativeArray<float3> SortedTargets;
    [ReadOnly] public NativeArray<float3> Seekers;
    public NativeArray<float3> NearestTargets;

    public void Execute(int index)
    {
        // Find nearest target for each seeker
        float3 seeker = Seekers[index];
        float minDist = float.MaxValue;
        float3 nearest = float3.zero;

        for (int i = 0; i < SortedTargets.Length; i++)
        {
            float dist = math.distance(seeker, SortedTargets[i]);
            if (dist < minDist)
            {
                minDist = dist;
                nearest = SortedTargets[i];
            }
        }

        NearestTargets[index] = nearest;
    }
}

// Chaining jobs with dependencies
public void FindAllNearest()
{
    var sortJob = new SortTargetsJob { Positions = targetPositions };
    JobHandle sortHandle = sortJob.Schedule();

    var findJob = new FindNearestJob
    {
        SortedTargets = targetPositions,
        Seekers = seekerPositions,
        NearestTargets = nearestResults
    };

    // findJob depends on sortJob completing first
    JobHandle findHandle = findJob.Schedule(
        seekerPositions.Length,
        100,
        sortHandle  // Dependency
    );

    // Complete waits for entire chain
    findHandle.Complete();
}
```

### Read/Write Safety Attributes

Control data access patterns for safety:

```csharp
[BurstCompile]
public struct SafetyAttributesJob : IJobParallelFor
{
    // Read-only access - multiple threads can read safely
    [ReadOnly]
    public NativeArray<float3> InputData;

    // Write-only access - each index written by one thread
    [WriteOnly]
    public NativeArray<float3> OutputData;

    // Default is read-write
    public NativeArray<int> CounterData;

    // Disable safety checks (use carefully!)
    [NativeDisableParallelForRestriction]
    public NativeArray<float> SharedData;

    public void Execute(int index)
    {
        OutputData[index] = InputData[index] * 2;
    }
}
```

## Burst Compiler

Burst translates IL/.NET bytecode into highly optimized native code using LLVM.

### Basic Usage

Apply the `[BurstCompile]` attribute to systems and jobs:

```csharp
using Unity.Burst;
using Unity.Collections;
using Unity.Jobs;
using Unity.Mathematics;

[BurstCompile]
public struct OptimizedJob : IJobParallelFor
{
    [ReadOnly] public NativeArray<float3> Positions;
    public NativeArray<float> Distances;

    public void Execute(int index)
    {
        // Burst optimizes math operations
        Distances[index] = math.length(Positions[index]);
    }
}
```

### Burst Configuration

Fine-tune Burst compilation:

```csharp
[BurstCompile(
    FloatPrecision.Standard,      // Float precision
    FloatMode.Fast,               // Allow fast math optimizations
    CompileSynchronously = true,  // Compile at startup
    Debug = false                 // Disable debug mode
)]
public struct ConfiguredJob : IJob
{
    public void Execute() { }
}

// Disable Burst for debugging
[BurstCompile(CompileSynchronously = false, Debug = true)]
public struct DebugJob : IJob
{
    public void Execute() { }
}
```

### What Burst Optimizes

Burst performs numerous optimizations:

```csharp
[BurstCompile]
public struct BurstOptimizationsDemo : IJob
{
    public NativeArray<float3> Vectors;
    public NativeArray<float> Results;

    public void Execute()
    {
        // SIMD vectorization - processes multiple floats simultaneously
        for (int i = 0; i < Vectors.Length; i++)
        {
            Results[i] = math.length(Vectors[i]);
        }

        // Loop unrolling - reduces branch overhead
        // Auto-vectorization - uses CPU SIMD instructions (SSE, AVX)
        // Constant folding - evaluates constants at compile time
        // Dead code elimination - removes unused code paths
    }
}
```

### Burst Restrictions

Burst has limitations to ensure maximum optimization:

```csharp
// NOT ALLOWED in Burst:
// - Managed objects (class instances, strings)
// - Try-catch blocks
// - Virtual methods
// - Boxing
// - Most reflection

// ALLOWED in Burst:
// - Structs and primitive types
// - NativeArray, NativeList, NativeHashMap
// - Unity.Mathematics types (float3, quaternion, etc.)
// - Fixed-size arrays
// - Function pointers

[BurstCompile]
public struct BurstCompatibleJob : IJob
{
    // Good: Native container
    public NativeArray<float> Data;

    // Good: Primitive
    public float Multiplier;

    // Good: Unity.Mathematics struct
    public float3 Direction;

    // BAD: Would cause compile error
    // public string Name;
    // public List<int> ManagedList;

    public void Execute()
    {
        for (int i = 0; i < Data.Length; i++)
        {
            Data[i] *= Multiplier;
        }
    }
}
```

## Native Collections

DOTS provides thread-safe, unmanaged collections:

```csharp
using Unity.Collections;
using Unity.Jobs;

public class NativeCollectionsExample
{
    public void DemonstrateCollections()
    {
        // NativeArray - fixed size, contiguous memory
        var array = new NativeArray<int>(100, Allocator.TempJob);

        // NativeList - dynamic size array
        var list = new NativeList<float>(Allocator.TempJob);
        list.Add(1.0f);
        list.Add(2.0f);

        // NativeHashMap - key-value dictionary
        var map = new NativeHashMap<int, float3>(64, Allocator.TempJob);
        map.Add(1, new float3(0, 0, 0));

        // NativeHashSet - unique values
        var set = new NativeHashSet<int>(32, Allocator.TempJob);
        set.Add(42);

        // NativeQueue - FIFO queue
        var queue = new NativeQueue<int>(Allocator.TempJob);
        queue.Enqueue(1);
        int value = queue.Dequeue();

        // NativeMultiHashMap - multiple values per key
        var multiMap = new NativeMultiHashMap<int, int>(64, Allocator.TempJob);
        multiMap.Add(1, 100);
        multiMap.Add(1, 200);  // Same key, different value

        // Always dispose when done!
        array.Dispose();
        list.Dispose();
        map.Dispose();
        set.Dispose();
        queue.Dispose();
        multiMap.Dispose();
    }
}
```

### Allocator Types

Choose the appropriate allocator:

```csharp
// Temp - single frame, fastest, auto-disposed at frame end
var temp = new NativeArray<int>(10, Allocator.Temp);

// TempJob - few frames (max 4), for jobs
var tempJob = new NativeArray<int>(10, Allocator.TempJob);

// Persistent - lifetime controlled manually
var persistent = new NativeArray<int>(10, Allocator.Persistent);
// Must manually dispose!
persistent.Dispose();
```

## Performance Comparison

### Benchmark Results

Real-world performance comparisons between traditional MonoBehaviour and DOTS approaches:

| Scenario | MonoBehaviour | DOTS (Burst + Jobs) | Improvement |
|----------|--------------|---------------------|-------------|
| 10,000 moving entities | ~15 FPS | ~300 FPS | 20x |
| Physics simulation (10K bodies) | Unplayable | 60+ FPS | N/A |
| Pathfinding (1000 agents) | ~8ms | ~0.5ms | 16x |
| Spatial queries (100K objects) | ~45ms | ~2ms | 22x |

**Note**: Actual results vary based on hardware and implementation quality. CPU performance improvements typically range from 5x to 50x depending on parallelization potential.

### Example: Movement System Comparison

**Traditional MonoBehaviour Approach:**

```csharp
// MonoBehaviour - runs on main thread only
public class TraditionalMover : MonoBehaviour
{
    public float speed = 5f;

    void Update()
    {
        transform.position += Vector3.forward * speed * Time.deltaTime;
    }
}
// With 10,000 objects: Each Update call has overhead
// Cache misses due to scattered memory layout
// Single-threaded execution
```

**DOTS Approach:**

```csharp
// Component - pure data
public struct MoveSpeed : IComponentData
{
    public float Value;
}

// System - processes all entities efficiently
[BurstCompile]
public partial struct MoveSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        new MoveJob
        {
            DeltaTime = SystemAPI.Time.DeltaTime
        }.ScheduleParallel();
    }
}

[BurstCompile]
partial struct MoveJob : IJobEntity
{
    public float DeltaTime;

    void Execute(ref LocalTransform transform, in MoveSpeed speed)
    {
        transform.Position.z += speed.Value * DeltaTime;
    }
}
// With 10,000 entities:
// Contiguous memory = excellent cache utilization
// Burst compilation = SIMD optimization
// Job System = parallel processing across all cores
```

## Migration Strategies

### Approach 1: Gradual Hybrid Migration

Start with performance-critical systems while keeping existing code:

```csharp
// Step 1: Identify hot paths (use Profiler)
// Step 2: Create DOTS equivalents for those systems
// Step 3: Bridge between MonoBehaviour and ECS

// MonoBehaviour that syncs with ECS
public class HybridEnemy : MonoBehaviour
{
    public Entity linkedEntity;
    private EntityManager entityManager;

    void Start()
    {
        var world = World.DefaultGameObjectInjectionWorld;
        entityManager = world.EntityManager;

        // Create ECS entity for this GameObject
        linkedEntity = entityManager.CreateEntity(
            typeof(Position),
            typeof(Health),
            typeof(EnemyTag)
        );

        // Initialize from MonoBehaviour data
        entityManager.SetComponentData(linkedEntity, new Position
        {
            Value = transform.position
        });
    }

    void Update()
    {
        // Sync position from ECS back to GameObject for rendering
        if (entityManager.Exists(linkedEntity))
        {
            var pos = entityManager.GetComponentData<Position>(linkedEntity);
            transform.position = pos.Value;
        }
    }

    void OnDestroy()
    {
        if (entityManager.Exists(linkedEntity))
        {
            entityManager.DestroyEntity(linkedEntity);
        }
    }
}
```

### Approach 2: SubScene-Based Conversion

Use Unity's built-in conversion through SubScenes:

```csharp
// Authoring component (MonoBehaviour used for conversion)
public class EnemyAuthoring : MonoBehaviour
{
    public float moveSpeed = 5f;
    public float maxHealth = 100f;
}

// Baker converts authoring to ECS components
public class EnemyBaker : Baker<EnemyAuthoring>
{
    public override void Bake(EnemyAuthoring authoring)
    {
        var entity = GetEntity(TransformUsageFlags.Dynamic);

        AddComponent(entity, new MoveSpeed { Value = authoring.moveSpeed });
        AddComponent(entity, new Health
        {
            Current = authoring.maxHealth,
            Maximum = authoring.maxHealth
        });
        AddComponent(entity, new EnemyTag());
    }
}
```

### Approach 3: Full DOTS Migration

For new projects or complete rewrites:

```csharp
// 1. Define all components
public struct PlayerInput : IComponentData
{
    public float2 Movement;
    public bool Jump;
    public bool Fire;
}

public struct CharacterController : IComponentData
{
    public float MoveSpeed;
    public float JumpForce;
    public bool IsGrounded;
}

// 2. Create systems for all logic
[BurstCompile]
[UpdateInGroup(typeof(SimulationSystemGroup))]
public partial struct PlayerInputSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        // Read input and update PlayerInput components
        foreach (var input in SystemAPI.Query<RefRW<PlayerInput>>()
            .WithAll<PlayerTag>())
        {
            // In practice, use Input System integration
            // This is simplified for demonstration
        }
    }
}

[BurstCompile]
[UpdateInGroup(typeof(SimulationSystemGroup))]
[UpdateAfter(typeof(PlayerInputSystem))]
public partial struct CharacterMovementSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        float dt = SystemAPI.Time.DeltaTime;

        foreach (var (transform, input, controller) in
            SystemAPI.Query<RefRW<LocalTransform>,
                          RefRO<PlayerInput>,
                          RefRW<CharacterController>>())
        {
            float3 movement = new float3(
                input.ValueRO.Movement.x,
                0,
                input.ValueRO.Movement.y
            );

            transform.ValueRW.Position +=
                movement * controller.ValueRO.MoveSpeed * dt;
        }
    }
}

// 3. Set up entity prefabs for spawning
[BurstCompile]
public partial struct SpawnerSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        var ecb = new EntityCommandBuffer(Allocator.Temp);

        foreach (var (spawner, entity) in
            SystemAPI.Query<RefRW<EnemySpawner>>().WithEntityAccess())
        {
            spawner.ValueRW.Timer -= SystemAPI.Time.DeltaTime;

            if (spawner.ValueRW.Timer <= 0)
            {
                spawner.ValueRW.Timer = spawner.ValueRW.Interval;

                var instance = ecb.Instantiate(spawner.ValueRW.Prefab);
                ecb.SetComponent(instance, new LocalTransform
                {
                    Position = spawner.ValueRW.SpawnPosition,
                    Rotation = quaternion.identity,
                    Scale = 1f
                });
            }
        }

        ecb.Playback(state.EntityManager);
        ecb.Dispose();
    }
}
```

### Migration Checklist

1. **Assessment Phase**
   - Profile existing code to identify bottlenecks
   - Evaluate which systems benefit most from DOTS
   - Plan hybrid vs full migration approach

2. **Data Migration**
   - Convert MonoBehaviour fields to IComponentData structs
   - Design archetypes based on common component combinations
   - Consider data access patterns for cache efficiency

3. **Logic Migration**
   - Rewrite Update() methods as System queries
   - Convert loops to jobs where parallelization helps
   - Add Burst compilation to all compatible code

4. **Testing**
   - Verify behavior matches original implementation
   - Profile to confirm performance improvements
   - Test edge cases (entity creation/destruction, etc.)

## Best Practices

### Component Design

```csharp
// DO: Keep components small and focused
public struct Position : IComponentData
{
    public float3 Value;
}

// DO: Use tag components for filtering
public struct PlayerTag : IComponentData { }

// DON'T: Create monolithic components
// Bad example - too many unrelated fields
public struct BadComponent : IComponentData
{
    public float3 Position;
    public float Health;
    public int Score;
    public float FireRate;
    public int AmmoCount;
    // This should be split into multiple components
}

// DO: Consider data access patterns
// Components accessed together should be in same archetype
```

### System Organization

```csharp
// Use system groups for update ordering
[UpdateInGroup(typeof(SimulationSystemGroup))]
public partial struct GameLogicSystem : ISystem { }

[UpdateInGroup(typeof(PresentationSystemGroup))]
public partial struct RenderPrepSystem : ISystem { }

// Explicit ordering within groups
[UpdateInGroup(typeof(SimulationSystemGroup))]
[UpdateBefore(typeof(MovementSystem))]
public partial struct InputSystem : ISystem { }

[UpdateInGroup(typeof(SimulationSystemGroup))]
[UpdateAfter(typeof(InputSystem))]
public partial struct MovementSystem : ISystem { }
```

### Job Safety

```csharp
// Always use appropriate attributes
[BurstCompile]
public struct SafeJob : IJobParallelFor
{
    [ReadOnly] public NativeArray<float3> Input;    // Thread-safe reads
    [WriteOnly] public NativeArray<float> Output;   // No race conditions

    public void Execute(int index)
    {
        Output[index] = math.length(Input[index]);
    }
}

// Handle job dependencies correctly
public partial struct DependencySystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        var job1 = new FirstJob().Schedule(state.Dependency);
        var job2 = new SecondJob().Schedule(job1);  // Depends on job1
        state.Dependency = job2;  // Update system dependency
    }
}
```

### Memory Management

```csharp
// Always dispose native collections
public partial struct CleanupSystem : ISystem
{
    private NativeList<Entity> entityBuffer;

    public void OnCreate(ref SystemState state)
    {
        entityBuffer = new NativeList<Entity>(100, Allocator.Persistent);
    }

    public void OnDestroy(ref SystemState state)
    {
        if (entityBuffer.IsCreated)
        {
            entityBuffer.Dispose();
        }
    }
}

// Use EntityCommandBuffer for structural changes
public partial struct SpawnSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        var ecb = new EntityCommandBuffer(Allocator.Temp);

        foreach (var (spawner, entity) in
            SystemAPI.Query<RefRO<Spawner>>().WithEntityAccess())
        {
            // Don't modify entities during iteration
            // Use ECB instead
            var newEntity = ecb.Instantiate(spawner.ValueRO.Prefab);
        }

        ecb.Playback(state.EntityManager);
        ecb.Dispose();
    }
}
```

## Real-World Examples

### V Rising (Stunlock Studios)

Used ECS throughout development including:
- World building in the Editor with custom visual scripting
- Scalable open-world streaming
- Multiplayer synchronization

### IXION (Kasedo Games)

Implemented DOTS for:
- Heavy NPC simulation in their city builder
- Survival mechanics processing
- Space exploration systems

## Common Pitfalls

### Unnecessary Structural Changes

```csharp
// BAD: Adding/removing components every frame causes chunk moves
public partial struct BadSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        foreach (var (health, entity) in
            SystemAPI.Query<RefRO<Health>>().WithEntityAccess())
        {
            if (health.ValueRO.Current <= 0)
            {
                // This causes structural change every time
                state.EntityManager.AddComponent<DeadTag>(entity);
            }
        }
    }
}

// GOOD: Use enableable components instead
public struct DeadTag : IComponentData, IEnableableComponent { }

public partial struct GoodSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        foreach (var (health, deadTag) in
            SystemAPI.Query<RefRO<Health>, EnabledRefRW<DeadTag>>())
        {
            if (health.ValueRO.Current <= 0)
            {
                // No structural change, just flips a bit
                deadTag.ValueRW = true;
            }
        }
    }
}
```

### Breaking Burst Compilation

```csharp
// BAD: Using managed types breaks Burst
[BurstCompile]
public partial struct BrokenSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        // This will cause Burst compilation to fail:
        // Debug.Log("Processing...");  // Uses managed string
        // var list = new List<int>();   // Managed allocation
    }
}

// GOOD: Use Burst-compatible alternatives
[BurstCompile]
public partial struct WorkingSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        // Use native collections
        var list = new NativeList<int>(Allocator.Temp);
        // ...
        list.Dispose();
    }
}
```

### Ignoring Job Dependencies

```csharp
// BAD: Race condition - jobs may run simultaneously
public partial struct RaceConditionSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        var job1 = new WriteJob { Data = sharedData }.Schedule();
        var job2 = new ReadJob { Data = sharedData }.Schedule();
        // job2 might read while job1 is writing!
    }
}

// GOOD: Chain dependencies properly
public partial struct SafeSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        var job1Handle = new WriteJob { Data = sharedData }.Schedule();
        var job2Handle = new ReadJob { Data = sharedData }.Schedule(job1Handle);
        state.Dependency = job2Handle;
    }
}
```

## Further Reading

### Official Resources

- [Unity DOTS Documentation](https://docs.unity3d.com/Packages/com.unity.entities@1.0/manual/index.html)
- [Entities Package Overview](https://docs.unity3d.com/Packages/com.unity.entities@1.0/manual/index.html)
- [Unity DOTS Samples Repository](https://github.com/Unity-Technologies/EntityComponentSystemSamples)

### Community Resources

- [Unity DOTS Forum](https://forum.unity.com/forums/data-oriented-technology-stack.147/)
- [DOTS Development Status Updates](https://discussions.unity.com/t/dots-development-status-and-milestones-ecs-for-all-september-2024/1519286)

### Learning Path

1. Complete the official DOTS tutorials and samples
2. Start with hybrid approach on existing projects
3. Profile and optimize critical paths first
4. Gradually expand DOTS usage as familiarity grows

## Summary

Unity DOTS provides a powerful toolkit for high-performance game development:

- **ECS** separates data from logic for better cache utilization and cleaner architecture
- **Job System** enables safe multi-threaded processing across all CPU cores
- **Burst Compiler** generates optimized native code from C#

Key takeaways:

1. DOTS delivers 5-50x performance improvements for parallelizable workloads
2. Start with `ISystem` for new code, reserve `SystemBase` for special cases
3. Use `[BurstCompile]` on all compatible systems and jobs
4. Design components small and focused, use archetypes wisely
5. Migrate gradually using hybrid approaches when appropriate
6. Profile before and after to validate improvements

DOTS represents Unity's investment in the future of game development, aligning with modern multi-core CPU architectures. While the learning curve is steeper than traditional MonoBehaviour development, the performance benefits make it essential knowledge for ambitious Unity projects.
