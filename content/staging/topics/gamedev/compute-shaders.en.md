---
title: Compute Shaders Introduction and Practice
description: "Master GPU compute shaders: parallel programming, GPGPU fundamentals, and practical game development applications"
track: gamedev
section: graphics
difficulty: advanced
tags:
  - compute shaders
  - GPU
  - GPGPU
  - parallel computing
  - HLSL
  - GLSL
status: imported
origin: old/src/content/docs/gamedev/compute-shaders.en.md
divergence: 0.213
issues: []
legacy:
  category: GameDev
  subcategory: Graphics
  order: 51
  lastUpdated: 2026-01-21
---

Compute shaders represent a paradigm shift in game development, allowing us to harness the massive parallel processing power of modern GPUs for general-purpose computing. This guide covers everything from fundamental concepts to practical implementations in major game engines.

## Concept Overview

### What Are Compute Shaders?

Compute shaders are programs that run on the GPU but are not tied to rendering geometry. Unlike vertex or fragment shaders that process specific graphics data, compute shaders can read and write arbitrary data to buffers, making them ideal for general-purpose GPU computing (GPGPU).

```
+=====================================================================+
|                    GPU SHADER PIPELINE                               |
+=====================================================================+
|                                                                      |
|   Traditional Graphics Pipeline:                                     |
|   +----------+     +----------+     +----------+     +----------+   |
|   | Vertex   |---->| Geometry |---->| Fragment |---->| Output   |   |
|   | Shader   |     | Shader   |     | Shader   |     | Merger   |   |
|   +----------+     +----------+     +----------+     +----------+   |
|        |                                                             |
|        v                                                             |
|   Processes vertices, rasterizes, shades pixels                      |
|                                                                      |
|   -------------------------------------------------------------------
|                                                                      |
|   Compute Pipeline:                                                  |
|   +----------+                      +----------+                     |
|   | Input    |--------------------->| Compute  |----> Output         |
|   | Buffers  |                      | Shader   |      Buffers        |
|   +----------+                      +----------+                     |
|        |                                                             |
|        v                                                             |
|   General-purpose parallel computation                               |
|   (Physics, AI, Simulation, Image Processing)                        |
|                                                                      |
+=====================================================================+
```

### Why Use Compute Shaders?

1. **Massive Parallelism**: GPUs have thousands of cores, enabling massive parallel processing
2. **High Memory Bandwidth**: GPUs offer much higher memory bandwidth than CPUs
3. **Offload CPU Work**: Free the CPU for other tasks by moving computation to GPU
4. **Direct Buffer Access**: Read/write to buffers without render target limitations
5. **Flexible Workgroups**: Control thread organization for optimal performance

### GPU vs CPU Architecture

```
CPU Architecture:                    GPU Architecture:
+-------------------+               +-------------------+
| Core 1 | Core 2  |               | SM  | SM  | SM  | SM  |
|--------|---------|               |-----|-----|-----|-----|
| Core 3 | Core 4  |               | SM  | SM  | SM  | SM  |
+-------------------+               |-----|-----|-----|-----|
| Large Cache       |               | SM  | SM  | SM  | SM  |
| Complex Control   |               +-------------------+
| Branch Prediction |               | High Bandwidth Memory |
+-------------------+               +-------------------+

Few powerful cores                  Many simple cores
Low latency                         High throughput
Complex operations                  Simple parallel operations
```

## Core Principles

### Thread Organization

Compute shaders organize work into a hierarchy of thread groups (workgroups):

```
+=====================================================================+
|                    COMPUTE SHADER THREAD HIERARCHY                   |
+=====================================================================+
|                                                                      |
|   Dispatch (Grid)                                                    |
|   +-----------------------------------------------------------+     |
|   | Thread Group | Thread Group | Thread Group | Thread Group |     |
|   |   (8,8,1)    |   (8,8,1)    |   (8,8,1)    |   (8,8,1)    |     |
|   +-------------+--------------+--------------+---------------+     |
|   | Thread Group | Thread Group | Thread Group | Thread Group |     |
|   |   (8,8,1)    |   (8,8,1)    |   (8,8,1)    |   (8,8,1)    |     |
|   +-----------------------------------------------------------+     |
|                                                                      |
|   Thread Group (Workgroup):                                          |
|   +-------------------+                                              |
|   | T T T T T T T T  |  <- 8 threads                                |
|   | T T T T T T T T  |                                              |
|   | T T T T T T T T  |                                              |
|   | T T T T T T T T  |  Total: 8x8x1 = 64 threads per group         |
|   | T T T T T T T T  |                                              |
|   | T T T T T T T T  |                                              |
|   | T T T T T T T T  |                                              |
|   | T T T T T T T T  |                                              |
|   +-------------------+                                              |
|                                                                      |
|   Total threads = numGroupsX * numGroupsY * numGroupsZ *             |
|                   groupSizeX * groupSizeY * groupSizeZ               |
|                                                                      |
+=====================================================================+
```

### Thread Identification

Each thread has multiple identifiers:

```hlsl
// HLSL Semantics
uint3 groupId       : SV_GroupID;           // Which thread group
uint3 groupThreadId : SV_GroupThreadID;     // Thread position within group
uint3 dispatchId    : SV_DispatchThreadID;  // Global thread position
uint  groupIndex    : SV_GroupIndex;        // Flattened index within group

// Example: Dispatch(4, 4, 1) with [numthreads(8, 8, 1)]
// For thread at position (10, 5, 0):
// groupId        = (1, 0, 0)     // Group 1 in X
// groupThreadId  = (2, 5, 0)     // Position within group
// dispatchId     = (10, 5, 0)    // Global position
// groupIndex     = 5 * 8 + 2 = 42 // Flattened within group
```

### Memory Hierarchy

```
+=====================================================================+
|                    GPU MEMORY HIERARCHY                              |
+=====================================================================+
|                                                                      |
|   +--------------------+                                             |
|   |   Global Memory    |  Largest, slowest                          |
|   |   (VRAM)           |  Visible to all threads                    |
|   +--------------------+                                             |
|            |                                                         |
|            v                                                         |
|   +--------------------+                                             |
|   |   Shared Memory    |  Fast, limited size (16-48KB per group)    |
|   |   (Group Local)    |  Shared within thread group                |
|   +--------------------+                                             |
|            |                                                         |
|            v                                                         |
|   +--------------------+                                             |
|   |   Registers        |  Fastest, very limited                     |
|   |   (Thread Local)   |  Private to each thread                    |
|   +--------------------+                                             |
|                                                                      |
|   Access Latency:                                                    |
|   Registers: ~1 cycle                                                |
|   Shared Memory: ~5-30 cycles                                        |
|   Global Memory: ~200-400 cycles                                     |
|                                                                      |
+=====================================================================+
```

## Key Concepts

### Buffer Types

```hlsl
// Structured Buffer (read-only)
StructuredBuffer<float4> inputBuffer;

// RWStructuredBuffer (read-write)
RWStructuredBuffer<float4> outputBuffer;

// Byte Address Buffer (raw memory access)
ByteAddressBuffer rawInput;
RWByteAddressBuffer rawOutput;

// Typed Buffer
Buffer<float4> typedInput;
RWBuffer<float4> typedOutput;

// Texture as compute target
RWTexture2D<float4> outputTexture;
```

### Synchronization

```hlsl
// Group memory barrier - wait for all group shared memory writes
GroupMemoryBarrierWithGroupSync();

// Device memory barrier - wait for all device memory writes
DeviceMemoryBarrierWithGroupSync();

// All memory barrier
AllMemoryBarrierWithGroupSync();

// Without sync (just barrier, threads continue)
GroupMemoryBarrier();
DeviceMemoryBarrier();
AllMemoryBarrier();
```

### Atomic Operations

```hlsl
// Atomic operations for thread-safe updates
uint originalValue;

InterlockedAdd(buffer[index], 1, originalValue);      // Add
InterlockedMin(buffer[index], value, originalValue);  // Minimum
InterlockedMax(buffer[index], value, originalValue);  // Maximum
InterlockedAnd(buffer[index], value, originalValue);  // Bitwise AND
InterlockedOr(buffer[index], value, originalValue);   // Bitwise OR
InterlockedXor(buffer[index], value, originalValue);  // Bitwise XOR
InterlockedExchange(buffer[index], value, originalValue);  // Swap
InterlockedCompareStore(buffer[index], compare, value);    // CAS
InterlockedCompareExchange(buffer[index], compare, value, originalValue);
```

## Code Examples

### Basic Compute Shader (HLSL)

```hlsl
// SimpleCompute.compute
#pragma kernel CSMain

// Input/output buffers
StructuredBuffer<float> Input;
RWStructuredBuffer<float> Output;

// Constants
cbuffer Constants : register(b0)
{
    uint _Count;
    float _Multiplier;
};

[numthreads(256, 1, 1)]
void CSMain(uint3 id : SV_DispatchThreadID)
{
    // Bounds check
    if (id.x >= _Count)
        return;

    // Simple operation: multiply input by constant
    Output[id.x] = Input[id.x] * _Multiplier;
}
```

### Particle System

```hlsl
// ParticleCompute.compute
#pragma kernel UpdateParticles
#pragma kernel EmitParticles

struct Particle
{
    float3 position;
    float3 velocity;
    float4 color;
    float lifetime;
    float size;
    uint isAlive;
    uint _padding;
};

RWStructuredBuffer<Particle> _Particles;
RWStructuredBuffer<uint> _DeadList;        // Pool of dead particle indices
RWStructuredBuffer<uint> _AliveList;       // Currently alive particles
RWStructuredBuffer<uint> _CounterBuffer;   // [0]=deadCount, [1]=aliveCount

// Constants
cbuffer ParticleConstants : register(b0)
{
    float _DeltaTime;
    float3 _Gravity;
    float3 _EmitterPosition;
    float _EmitterRadius;
    uint _MaxParticles;
    float _InitialLifetime;
    float _InitialSpeed;
    float4 _InitialColor;
};

// Pseudo-random number generator
float random(uint seed)
{
    seed = seed * 747796405u + 2891336453u;
    uint result = ((seed >> ((seed >> 28) + 4)) ^ seed) * 277803737u;
    return float(result) / 4294967295.0;
}

float3 randomDirection(uint seed)
{
    float theta = random(seed) * 6.28318530718;
    float phi = acos(2.0 * random(seed + 1) - 1.0);

    return float3(
        sin(phi) * cos(theta),
        sin(phi) * sin(theta),
        cos(phi)
    );
}

[numthreads(256, 1, 1)]
void UpdateParticles(uint3 id : SV_DispatchThreadID)
{
    if (id.x >= _MaxParticles)
        return;

    Particle p = _Particles[id.x];

    if (p.isAlive == 0)
        return;

    // Update lifetime
    p.lifetime -= _DeltaTime;

    if (p.lifetime <= 0)
    {
        // Kill particle
        p.isAlive = 0;

        // Add to dead list
        uint deadIndex;
        InterlockedAdd(_CounterBuffer[0], 1, deadIndex);
        _DeadList[deadIndex] = id.x;
    }
    else
    {
        // Update physics
        p.velocity += _Gravity * _DeltaTime;
        p.position += p.velocity * _DeltaTime;

        // Fade out
        float lifetimeRatio = p.lifetime / _InitialLifetime;
        p.color.a = lifetimeRatio;
        p.size = lerp(0.1, 1.0, lifetimeRatio);

        // Add to alive list
        uint aliveIndex;
        InterlockedAdd(_CounterBuffer[1], 1, aliveIndex);
        _AliveList[aliveIndex] = id.x;
    }

    _Particles[id.x] = p;
}

[numthreads(256, 1, 1)]
void EmitParticles(uint3 id : SV_DispatchThreadID, uint3 groupId : SV_GroupID)
{
    // Get a dead particle index
    uint deadCount;
    InterlockedAdd(_CounterBuffer[0], -1, deadCount);

    if (deadCount <= 0)
    {
        InterlockedAdd(_CounterBuffer[0], 1);  // Restore count
        return;
    }

    uint particleIndex = _DeadList[deadCount - 1];

    // Initialize new particle
    uint seed = id.x + groupId.x * 256 + uint(_DeltaTime * 1000000);

    Particle p;
    p.position = _EmitterPosition + randomDirection(seed) * random(seed + 10) * _EmitterRadius;
    p.velocity = randomDirection(seed + 20) * _InitialSpeed;
    p.color = _InitialColor;
    p.lifetime = _InitialLifetime * (0.5 + random(seed + 30) * 0.5);
    p.size = 1.0;
    p.isAlive = 1;
    p._padding = 0;

    _Particles[particleIndex] = p;
}
```

### Image Processing (Blur)

```hlsl
// ImageBlur.compute
#pragma kernel GaussianBlurHorizontal
#pragma kernel GaussianBlurVertical

Texture2D<float4> _InputTexture;
RWTexture2D<float4> _OutputTexture;

cbuffer BlurConstants : register(b0)
{
    int _TextureWidth;
    int _TextureHeight;
    float _BlurRadius;
};

// Precomputed Gaussian weights for radius 4
static const float weights[9] = {
    0.0162162162, 0.0540540541, 0.1216216216, 0.1945945946,
    0.2270270270,
    0.1945945946, 0.1216216216, 0.0540540541, 0.0162162162
};

groupshared float4 sharedData[256 + 16];  // Extra for blur radius

[numthreads(256, 1, 1)]
void GaussianBlurHorizontal(uint3 id : SV_DispatchThreadID,
                            uint3 groupThreadId : SV_GroupThreadID,
                            uint3 groupId : SV_GroupID)
{
    int2 pixelCoord = int2(id.x, groupId.y);

    // Load to shared memory with padding
    int loadIndex = groupThreadId.x - 8;
    int2 loadCoord = int2(clamp(groupId.x * 256 + loadIndex, 0, _TextureWidth - 1), groupId.y);

    sharedData[groupThreadId.x] = _InputTexture.Load(int3(loadCoord, 0));

    // Load extra pixels for blur radius
    if (groupThreadId.x < 16)
    {
        int extraLoadIndex = 256 + loadIndex;
        int2 extraCoord = int2(clamp(groupId.x * 256 + extraLoadIndex, 0, _TextureWidth - 1), groupId.y);
        sharedData[256 + groupThreadId.x] = _InputTexture.Load(int3(extraCoord, 0));
    }

    GroupMemoryBarrierWithGroupSync();

    // Apply blur
    if (pixelCoord.x >= _TextureWidth)
        return;

    float4 result = float4(0, 0, 0, 0);
    int baseIndex = groupThreadId.x + 8;

    [unroll]
    for (int i = -4; i <= 4; i++)
    {
        result += sharedData[baseIndex + i] * weights[i + 4];
    }

    _OutputTexture[pixelCoord] = result;
}

[numthreads(1, 256, 1)]
void GaussianBlurVertical(uint3 id : SV_DispatchThreadID,
                          uint3 groupThreadId : SV_GroupThreadID,
                          uint3 groupId : SV_GroupID)
{
    int2 pixelCoord = int2(groupId.x, id.y);

    // Similar to horizontal but in Y direction
    int loadIndex = groupThreadId.y - 8;
    int2 loadCoord = int2(groupId.x, clamp(groupId.y * 256 + loadIndex, 0, _TextureHeight - 1));

    sharedData[groupThreadId.y] = _InputTexture.Load(int3(loadCoord, 0));

    if (groupThreadId.y < 16)
    {
        int extraLoadIndex = 256 + loadIndex;
        int2 extraCoord = int2(groupId.x, clamp(groupId.y * 256 + extraLoadIndex, 0, _TextureHeight - 1));
        sharedData[256 + groupThreadId.y] = _InputTexture.Load(int3(extraCoord, 0));
    }

    GroupMemoryBarrierWithGroupSync();

    if (pixelCoord.y >= _TextureHeight)
        return;

    float4 result = float4(0, 0, 0, 0);
    int baseIndex = groupThreadId.y + 8;

    [unroll]
    for (int i = -4; i <= 4; i++)
    {
        result += sharedData[baseIndex + i] * weights[i + 4];
    }

    _OutputTexture[pixelCoord] = result;
}
```

### Unity Integration

```csharp
// ParticleSystemCompute.cs
using UnityEngine;

public class GPUParticleSystem : MonoBehaviour
{
    [Header("Compute Shader")]
    public ComputeShader particleCompute;

    [Header("Particle Settings")]
    public int maxParticles = 100000;
    public float emitRate = 10000f;
    public float initialLifetime = 3f;
    public float initialSpeed = 5f;
    public Vector3 gravity = new Vector3(0, -9.81f, 0);
    public float emitterRadius = 1f;
    public Color initialColor = Color.white;

    [Header("Rendering")]
    public Material particleMaterial;
    public Mesh particleMesh;

    // Compute buffers
    private ComputeBuffer particleBuffer;
    private ComputeBuffer deadListBuffer;
    private ComputeBuffer aliveListBuffer;
    private ComputeBuffer counterBuffer;
    private ComputeBuffer argsBuffer;

    // Kernel IDs
    private int updateKernel;
    private int emitKernel;

    // Internal state
    private int[] counterData = new int[2];
    private float emitAccumulator;

    struct Particle
    {
        public Vector3 position;
        public Vector3 velocity;
        public Vector4 color;
        public float lifetime;
        public float size;
        public uint isAlive;
        public uint padding;
    }

    void Start()
    {
        // Get kernel IDs
        updateKernel = particleCompute.FindKernel("UpdateParticles");
        emitKernel = particleCompute.FindKernel("EmitParticles");

        // Create buffers
        int particleStride = System.Runtime.InteropServices.Marshal.SizeOf(typeof(Particle));
        particleBuffer = new ComputeBuffer(maxParticles, particleStride);
        deadListBuffer = new ComputeBuffer(maxParticles, sizeof(uint));
        aliveListBuffer = new ComputeBuffer(maxParticles, sizeof(uint));
        counterBuffer = new ComputeBuffer(2, sizeof(uint));
        argsBuffer = new ComputeBuffer(5, sizeof(uint), ComputeBufferType.IndirectArguments);

        // Initialize dead list with all particle indices
        uint[] deadIndices = new uint[maxParticles];
        for (int i = 0; i < maxParticles; i++)
        {
            deadIndices[i] = (uint)i;
        }
        deadListBuffer.SetData(deadIndices);

        // Initialize counter (all particles dead initially)
        counterData[0] = maxParticles;  // Dead count
        counterData[1] = 0;             // Alive count
        counterBuffer.SetData(counterData);

        // Initialize particles as dead
        Particle[] particles = new Particle[maxParticles];
        for (int i = 0; i < maxParticles; i++)
        {
            particles[i].isAlive = 0;
        }
        particleBuffer.SetData(particles);

        // Set up indirect args for instanced rendering
        uint[] args = new uint[5] {
            particleMesh.GetIndexCount(0),
            0,  // Will be updated each frame
            particleMesh.GetIndexStart(0),
            particleMesh.GetBaseVertex(0),
            0
        };
        argsBuffer.SetData(args);

        // Bind buffers to compute shader
        particleCompute.SetBuffer(updateKernel, "_Particles", particleBuffer);
        particleCompute.SetBuffer(updateKernel, "_DeadList", deadListBuffer);
        particleCompute.SetBuffer(updateKernel, "_AliveList", aliveListBuffer);
        particleCompute.SetBuffer(updateKernel, "_CounterBuffer", counterBuffer);

        particleCompute.SetBuffer(emitKernel, "_Particles", particleBuffer);
        particleCompute.SetBuffer(emitKernel, "_DeadList", deadListBuffer);
        particleCompute.SetBuffer(emitKernel, "_CounterBuffer", counterBuffer);

        // Bind buffer to material
        particleMaterial.SetBuffer("_Particles", particleBuffer);
        particleMaterial.SetBuffer("_AliveList", aliveListBuffer);
    }

    void Update()
    {
        float dt = Time.deltaTime;

        // Reset alive counter
        counterData[1] = 0;
        counterBuffer.SetData(counterData);

        // Set constants
        particleCompute.SetFloat("_DeltaTime", dt);
        particleCompute.SetVector("_Gravity", gravity);
        particleCompute.SetVector("_EmitterPosition", transform.position);
        particleCompute.SetFloat("_EmitterRadius", emitterRadius);
        particleCompute.SetInt("_MaxParticles", maxParticles);
        particleCompute.SetFloat("_InitialLifetime", initialLifetime);
        particleCompute.SetFloat("_InitialSpeed", initialSpeed);
        particleCompute.SetVector("_InitialColor", initialColor);

        // Update particles
        int threadGroups = Mathf.CeilToInt(maxParticles / 256f);
        particleCompute.Dispatch(updateKernel, threadGroups, 1, 1);

        // Emit new particles
        emitAccumulator += emitRate * dt;
        int emitCount = Mathf.FloorToInt(emitAccumulator);
        if (emitCount > 0)
        {
            emitAccumulator -= emitCount;
            int emitGroups = Mathf.CeilToInt(emitCount / 256f);
            particleCompute.Dispatch(emitKernel, emitGroups, 1, 1);
        }

        // Get alive count for rendering
        counterBuffer.GetData(counterData);
        uint[] args = new uint[5] {
            particleMesh.GetIndexCount(0),
            (uint)counterData[1],
            particleMesh.GetIndexStart(0),
            particleMesh.GetBaseVertex(0),
            0
        };
        argsBuffer.SetData(args);

        // Render particles
        Bounds bounds = new Bounds(transform.position, Vector3.one * 100);
        Graphics.DrawMeshInstancedIndirect(particleMesh, 0, particleMaterial, bounds, argsBuffer);
    }

    void OnDestroy()
    {
        particleBuffer?.Release();
        deadListBuffer?.Release();
        aliveListBuffer?.Release();
        counterBuffer?.Release();
        argsBuffer?.Release();
    }
}
```

### Parallel Reduction (Sum)

```hlsl
// ParallelReduction.compute
#pragma kernel ReduceSum
#pragma kernel ReduceSumFinal

StructuredBuffer<float> _Input;
RWStructuredBuffer<float> _Output;

cbuffer ReductionConstants : register(b0)
{
    uint _InputCount;
};

groupshared float sharedData[256];

[numthreads(256, 1, 1)]
void ReduceSum(uint3 id : SV_DispatchThreadID,
               uint3 groupId : SV_GroupID,
               uint3 groupThreadId : SV_GroupThreadID)
{
    uint tid = groupThreadId.x;
    uint globalId = id.x;

    // Load data to shared memory
    if (globalId < _InputCount)
    {
        sharedData[tid] = _Input[globalId];
    }
    else
    {
        sharedData[tid] = 0;
    }

    GroupMemoryBarrierWithGroupSync();

    // Perform reduction in shared memory
    [unroll]
    for (uint stride = 128; stride > 0; stride >>= 1)
    {
        if (tid < stride)
        {
            sharedData[tid] += sharedData[tid + stride];
        }
        GroupMemoryBarrierWithGroupSync();
    }

    // Write result for this group
    if (tid == 0)
    {
        _Output[groupId.x] = sharedData[0];
    }
}

// Final reduction for small arrays
[numthreads(64, 1, 1)]
void ReduceSumFinal(uint3 id : SV_DispatchThreadID,
                    uint3 groupThreadId : SV_GroupThreadID)
{
    uint tid = groupThreadId.x;

    if (id.x < _InputCount)
    {
        sharedData[tid] = _Input[id.x];
    }
    else
    {
        sharedData[tid] = 0;
    }

    GroupMemoryBarrierWithGroupSync();

    [unroll]
    for (uint stride = 32; stride > 0; stride >>= 1)
    {
        if (tid < stride)
        {
            sharedData[tid] += sharedData[tid + stride];
        }
        GroupMemoryBarrierWithGroupSync();
    }

    if (tid == 0)
    {
        _Output[0] = sharedData[0];
    }
}
```

## Best Practices

### 1. Optimize Thread Group Size

```hlsl
// GPU wavefront/warp sizes:
// NVIDIA: 32 threads (warp)
// AMD: 64 threads (wavefront)
// Use multiples of 64 for best cross-platform performance

// Good: Multiple of 64
[numthreads(64, 1, 1)]   // 1D workload
[numthreads(8, 8, 1)]    // 2D workload (64 threads)
[numthreads(4, 4, 4)]    // 3D workload (64 threads)

// Avoid: Non-multiple of 32/64
[numthreads(100, 1, 1)]  // Wastes threads
[numthreads(7, 7, 1)]    // 49 threads, poor utilization
```

### 2. Coalesce Memory Access

```hlsl
// BAD: Scattered memory access
[numthreads(256, 1, 1)]
void BadAccess(uint3 id : SV_DispatchThreadID)
{
    // Threads access non-contiguous memory
    float value = _Buffer[id.x * stride + offset];  // Scattered!
}

// GOOD: Coalesced memory access
[numthreads(256, 1, 1)]
void GoodAccess(uint3 id : SV_DispatchThreadID)
{
    // Adjacent threads access adjacent memory
    float value = _Buffer[id.x];  // Coalesced!
}
```

### 3. Use Shared Memory for Data Reuse

```hlsl
// BAD: Multiple global memory reads
[numthreads(8, 8, 1)]
void BadStencil(uint3 id : SV_DispatchThreadID)
{
    float sum = 0;
    // Each neighbor read hits global memory
    for (int dy = -1; dy <= 1; dy++)
    {
        for (int dx = -1; dx <= 1; dx++)
        {
            sum += _Input[id.xy + int2(dx, dy)];
        }
    }
    _Output[id.xy] = sum / 9.0;
}

// GOOD: Load to shared memory first
groupshared float tile[10][10];  // 8x8 + 1 pixel border

[numthreads(8, 8, 1)]
void GoodStencil(uint3 id : SV_DispatchThreadID,
                 uint3 groupThreadId : SV_GroupThreadID)
{
    // Cooperative loading to shared memory
    int2 localId = groupThreadId.xy + int2(1, 1);
    tile[localId.y][localId.x] = _Input[id.xy];

    // Load borders
    if (groupThreadId.x == 0)
        tile[localId.y][0] = _Input[id.xy + int2(-1, 0)];
    if (groupThreadId.x == 7)
        tile[localId.y][9] = _Input[id.xy + int2(1, 0)];
    // ... similar for y borders

    GroupMemoryBarrierWithGroupSync();

    // Now all data is in fast shared memory
    float sum = 0;
    for (int dy = -1; dy <= 1; dy++)
    {
        for (int dx = -1; dx <= 1; dx++)
        {
            sum += tile[localId.y + dy][localId.x + dx];
        }
    }
    _Output[id.xy] = sum / 9.0;
}
```

### 4. Avoid Branch Divergence

```hlsl
// BAD: Divergent branches within warp
[numthreads(64, 1, 1)]
void BadBranch(uint3 id : SV_DispatchThreadID)
{
    // Different threads take different paths
    if (id.x % 2 == 0)
    {
        DoExpensiveWork();
    }
    else
    {
        DoOtherExpensiveWork();
    }
}

// GOOD: Minimize divergence
[numthreads(64, 1, 1)]
void GoodBranch(uint3 id : SV_DispatchThreadID)
{
    // Use predication or ensure whole warps take same path
    float result = lerp(
        ComputePathA(id.x),
        ComputePathB(id.x),
        id.x % 2
    );
}
```

### 5. Double Buffering for Read/Write

```csharp
// Avoid reading and writing same buffer in one dispatch
public class DoubleBufferedSimulation : MonoBehaviour
{
    private ComputeBuffer bufferA;
    private ComputeBuffer bufferB;
    private bool useBufferA = true;

    void Update()
    {
        ComputeBuffer readBuffer = useBufferA ? bufferA : bufferB;
        ComputeBuffer writeBuffer = useBufferA ? bufferB : bufferA;

        computeShader.SetBuffer(kernel, "_Read", readBuffer);
        computeShader.SetBuffer(kernel, "_Write", writeBuffer);
        computeShader.Dispatch(kernel, threadGroups, 1, 1);

        // Swap buffers
        useBufferA = !useBufferA;
    }
}
```

## Common Pitfalls

### Pitfall 1: Race Conditions

```hlsl
// BAD: Race condition
RWStructuredBuffer<uint> _Counter;

[numthreads(256, 1, 1)]
void BadIncrement(uint3 id : SV_DispatchThreadID)
{
    _Counter[0] = _Counter[0] + 1;  // Race condition!
}

// GOOD: Use atomic operations
[numthreads(256, 1, 1)]
void GoodIncrement(uint3 id : SV_DispatchThreadID)
{
    uint original;
    InterlockedAdd(_Counter[0], 1, original);  // Thread-safe
}
```

### Pitfall 2: Missing Bounds Checks

```hlsl
// BAD: Out of bounds access
[numthreads(256, 1, 1)]
void BadBounds(uint3 id : SV_DispatchThreadID)
{
    _Output[id.x] = _Input[id.x];  // May read/write out of bounds!
}

// GOOD: Always check bounds
[numthreads(256, 1, 1)]
void GoodBounds(uint3 id : SV_DispatchThreadID)
{
    if (id.x >= _Count)
        return;

    _Output[id.x] = _Input[id.x];
}
```

### Pitfall 3: Buffer Size Mismatch

```csharp
// BAD: Incorrect buffer stride
struct MyStruct
{
    public Vector3 position;  // 12 bytes
    public float value;       // 4 bytes
    // Total: 16 bytes
}

// Wrong stride!
buffer = new ComputeBuffer(count, 12);  // Should be 16!

// GOOD: Use Marshal.SizeOf or explicit calculation
buffer = new ComputeBuffer(count, System.Runtime.InteropServices.Marshal.SizeOf(typeof(MyStruct)));
// Or
buffer = new ComputeBuffer(count, 16);
```

### Pitfall 4: Forgetting Synchronization

```hlsl
// BAD: Using shared memory without sync
groupshared float cache[64];

[numthreads(64, 1, 1)]
void BadSync(uint3 id : SV_DispatchThreadID, uint3 groupThreadId : SV_GroupThreadID)
{
    cache[groupThreadId.x] = _Input[id.x];

    // Missing GroupMemoryBarrierWithGroupSync()!

    float neighbor = cache[(groupThreadId.x + 1) % 64];  // May read stale data!
}

// GOOD: Always sync after shared memory writes
[numthreads(64, 1, 1)]
void GoodSync(uint3 id : SV_DispatchThreadID, uint3 groupThreadId : SV_GroupThreadID)
{
    cache[groupThreadId.x] = _Input[id.x];

    GroupMemoryBarrierWithGroupSync();  // Wait for all writes

    float neighbor = cache[(groupThreadId.x + 1) % 64];  // Safe
}
```

## Performance Considerations

### Occupancy

```
Occupancy = Active Warps / Maximum Warps per SM

Higher occupancy generally means better latency hiding.
Factors affecting occupancy:
- Register usage per thread
- Shared memory usage per thread group
- Thread group size

Tools to analyze:
- NVIDIA Nsight
- AMD Radeon GPU Profiler
- Unity Frame Debugger
```

### Memory Bandwidth

```
Theoretical bandwidth vs achieved bandwidth:

Example: RTX 3080
- Memory: 760 GB/s theoretical
- Actual achieved: 600-700 GB/s typical

Optimization strategies:
1. Maximize coalesced accesses
2. Use shared memory to reduce global reads
3. Pack data to reduce memory transactions
4. Use texture sampling for filtered reads
```

### Dispatch Overhead

```csharp
// BAD: Many small dispatches
for (int i = 0; i < 1000; i++)
{
    computeShader.SetInt("_Index", i);
    computeShader.Dispatch(kernel, 1, 1, 1);
}

// GOOD: Single large dispatch
computeShader.SetInt("_Count", 1000);
computeShader.Dispatch(kernel, Mathf.CeilToInt(1000 / 256f), 1, 1);
```

## Real-World Scenarios

### Scenario 1: GPU Skinning

```hlsl
// GPUSkinning.compute
#pragma kernel SkinMesh

struct VertexInput
{
    float3 position;
    float3 normal;
    float4 boneWeights;
    uint4 boneIndices;
};

struct VertexOutput
{
    float3 position;
    float3 normal;
};

StructuredBuffer<VertexInput> _Vertices;
RWStructuredBuffer<VertexOutput> _SkinnedVertices;
StructuredBuffer<float4x4> _BoneMatrices;

cbuffer SkinningConstants : register(b0)
{
    uint _VertexCount;
};

[numthreads(256, 1, 1)]
void SkinMesh(uint3 id : SV_DispatchThreadID)
{
    if (id.x >= _VertexCount)
        return;

    VertexInput v = _Vertices[id.x];

    float4x4 skinMatrix =
        _BoneMatrices[v.boneIndices.x] * v.boneWeights.x +
        _BoneMatrices[v.boneIndices.y] * v.boneWeights.y +
        _BoneMatrices[v.boneIndices.z] * v.boneWeights.z +
        _BoneMatrices[v.boneIndices.w] * v.boneWeights.w;

    VertexOutput output;
    output.position = mul(skinMatrix, float4(v.position, 1.0)).xyz;
    output.normal = normalize(mul((float3x3)skinMatrix, v.normal));

    _SkinnedVertices[id.x] = output;
}
```

### Scenario 2: Frustum Culling

```hlsl
// FrustumCulling.compute
#pragma kernel CullInstances

struct InstanceData
{
    float4x4 objectToWorld;
    float3 boundingBoxMin;
    float3 boundingBoxMax;
};

struct DrawArgs
{
    uint indexCount;
    uint instanceCount;
    uint startIndex;
    uint baseVertex;
    uint startInstance;
};

StructuredBuffer<InstanceData> _AllInstances;
AppendStructuredBuffer<uint> _VisibleIndices;
RWStructuredBuffer<DrawArgs> _DrawArgs;

cbuffer CullingConstants : register(b0)
{
    float4 _FrustumPlanes[6];
    uint _InstanceCount;
};

bool IsBoxInFrustum(float3 minPoint, float3 maxPoint, float4x4 worldMatrix)
{
    // Transform bounding box corners to world space
    float3 corners[8];
    corners[0] = mul(worldMatrix, float4(minPoint.x, minPoint.y, minPoint.z, 1)).xyz;
    corners[1] = mul(worldMatrix, float4(maxPoint.x, minPoint.y, minPoint.z, 1)).xyz;
    corners[2] = mul(worldMatrix, float4(minPoint.x, maxPoint.y, minPoint.z, 1)).xyz;
    corners[3] = mul(worldMatrix, float4(maxPoint.x, maxPoint.y, minPoint.z, 1)).xyz;
    corners[4] = mul(worldMatrix, float4(minPoint.x, minPoint.y, maxPoint.z, 1)).xyz;
    corners[5] = mul(worldMatrix, float4(maxPoint.x, minPoint.y, maxPoint.z, 1)).xyz;
    corners[6] = mul(worldMatrix, float4(minPoint.x, maxPoint.y, maxPoint.z, 1)).xyz;
    corners[7] = mul(worldMatrix, float4(maxPoint.x, maxPoint.y, maxPoint.z, 1)).xyz;

    // Test against each frustum plane
    [unroll]
    for (int p = 0; p < 6; p++)
    {
        int outside = 0;
        [unroll]
        for (int c = 0; c < 8; c++)
        {
            if (dot(_FrustumPlanes[p].xyz, corners[c]) + _FrustumPlanes[p].w < 0)
            {
                outside++;
            }
        }

        // All corners outside this plane
        if (outside == 8)
            return false;
    }

    return true;
}

[numthreads(256, 1, 1)]
void CullInstances(uint3 id : SV_DispatchThreadID)
{
    if (id.x >= _InstanceCount)
        return;

    InstanceData instance = _AllInstances[id.x];

    if (IsBoxInFrustum(instance.boundingBoxMin, instance.boundingBoxMax, instance.objectToWorld))
    {
        _VisibleIndices.Append(id.x);
    }
}
```

### Scenario 3: Fluid Simulation (SPH)

```hlsl
// FluidSimulation.compute
#pragma kernel ComputeDensityPressure
#pragma kernel ComputeForces
#pragma kernel Integrate

struct Particle
{
    float3 position;
    float3 velocity;
    float density;
    float pressure;
};

RWStructuredBuffer<Particle> _Particles;
StructuredBuffer<uint> _SpatialHashTable;
StructuredBuffer<uint> _ParticleIndices;

cbuffer FluidConstants : register(b0)
{
    float _RestDensity;
    float _GasConstant;
    float _Viscosity;
    float _SmoothingRadius;
    float _DeltaTime;
    float3 _Gravity;
    uint _ParticleCount;
    float3 _BoundaryMin;
    float3 _BoundaryMax;
};

// SPH Kernel functions
float Poly6Kernel(float r, float h)
{
    if (r > h) return 0;
    float x = h * h - r * r;
    return 315.0 / (64.0 * 3.14159 * pow(h, 9)) * x * x * x;
}

float3 SpikyGradient(float3 r, float h)
{
    float rLen = length(r);
    if (rLen > h || rLen < 0.0001) return float3(0, 0, 0);
    float x = h - rLen;
    return -45.0 / (3.14159 * pow(h, 6)) * x * x * normalize(r);
}

float ViscosityLaplacian(float r, float h)
{
    if (r > h) return 0;
    return 45.0 / (3.14159 * pow(h, 6)) * (h - r);
}

[numthreads(256, 1, 1)]
void ComputeDensityPressure(uint3 id : SV_DispatchThreadID)
{
    if (id.x >= _ParticleCount)
        return;

    Particle p = _Particles[id.x];
    float density = 0;

    // Sum contributions from neighbors
    for (uint j = 0; j < _ParticleCount; j++)
    {
        float3 rij = p.position - _Particles[j].position;
        float r = length(rij);
        density += Poly6Kernel(r, _SmoothingRadius);
    }

    p.density = density;
    p.pressure = _GasConstant * (density - _RestDensity);

    _Particles[id.x] = p;
}

[numthreads(256, 1, 1)]
void ComputeForces(uint3 id : SV_DispatchThreadID)
{
    if (id.x >= _ParticleCount)
        return;

    Particle pi = _Particles[id.x];
    float3 pressureForce = float3(0, 0, 0);
    float3 viscosityForce = float3(0, 0, 0);

    for (uint j = 0; j < _ParticleCount; j++)
    {
        if (id.x == j) continue;

        Particle pj = _Particles[j];
        float3 rij = pi.position - pj.position;
        float r = length(rij);

        if (r < _SmoothingRadius)
        {
            // Pressure force
            pressureForce += -normalize(rij) * (pi.pressure + pj.pressure) /
                            (2 * pj.density) * SpikyGradient(rij, _SmoothingRadius);

            // Viscosity force
            viscosityForce += _Viscosity * (pj.velocity - pi.velocity) /
                             pj.density * ViscosityLaplacian(r, _SmoothingRadius);
        }
    }

    float3 totalForce = pressureForce + viscosityForce + _Gravity * pi.density;
    pi.velocity += totalForce / pi.density * _DeltaTime;

    _Particles[id.x] = pi;
}

[numthreads(256, 1, 1)]
void Integrate(uint3 id : SV_DispatchThreadID)
{
    if (id.x >= _ParticleCount)
        return;

    Particle p = _Particles[id.x];

    p.position += p.velocity * _DeltaTime;

    // Boundary conditions
    if (p.position.x < _BoundaryMin.x) { p.position.x = _BoundaryMin.x; p.velocity.x *= -0.5; }
    if (p.position.x > _BoundaryMax.x) { p.position.x = _BoundaryMax.x; p.velocity.x *= -0.5; }
    if (p.position.y < _BoundaryMin.y) { p.position.y = _BoundaryMin.y; p.velocity.y *= -0.5; }
    if (p.position.y > _BoundaryMax.y) { p.position.y = _BoundaryMax.y; p.velocity.y *= -0.5; }
    if (p.position.z < _BoundaryMin.z) { p.position.z = _BoundaryMin.z; p.velocity.z *= -0.5; }
    if (p.position.z > _BoundaryMax.z) { p.position.z = _BoundaryMax.z; p.velocity.z *= -0.5; }

    _Particles[id.x] = p;
}
```

## Interview Focus Points

### Common Interview Questions

**Q1: What is the difference between a compute shader and a fragment shader?**

Fragment shaders are part of the graphics pipeline and process pixels during rasterization. They have fixed inputs (interpolated vertex data) and outputs (color values). Compute shaders run independently of the graphics pipeline, have arbitrary read/write access to buffers, and can organize threads freely into workgroups.

**Q2: What is a thread group and why is it important?**

A thread group (workgroup) is a collection of threads that execute together on the GPU. Threads within a group can share data through group shared memory and synchronize using barriers. Thread group size affects occupancy and performance - it should be a multiple of the GPU's warp/wavefront size (32 for NVIDIA, 64 for AMD).

**Q3: When would you use atomic operations?**

Atomic operations are needed when multiple threads may write to the same memory location simultaneously. Common uses include counters, histograms, and append buffers. They serialize access to prevent race conditions but can become a bottleneck if overused.

**Q4: How do you optimize memory access in compute shaders?**

- Use coalesced memory access (adjacent threads access adjacent memory)
- Leverage shared memory for data that is reused within a thread group
- Minimize global memory transactions
- Pack data to reduce memory footprint
- Use texture reads for data that benefits from caching

**Q5: What is occupancy and why does it matter?**

Occupancy is the ratio of active warps to maximum warps per streaming multiprocessor. Higher occupancy helps hide memory latency through context switching. It's affected by register usage, shared memory, and thread group size. Tools like NSight can help analyze and optimize occupancy.

### Quick Reference

```
+=====================================================================+
|                    COMPUTE SHADER QUICK REFERENCE                    |
+=====================================================================+
|                                                                      |
|  Thread Hierarchy:                                                   |
|  Dispatch -> Thread Groups -> Threads                                |
|                                                                      |
|  Thread IDs (HLSL):                                                  |
|  SV_GroupID          - Which thread group                            |
|  SV_GroupThreadID    - Position within group                         |
|  SV_DispatchThreadID - Global position                               |
|  SV_GroupIndex       - Flattened index in group                      |
|                                                                      |
|  Memory Types:                                                       |
|  Global (VRAM)       - Large, slow, visible to all                   |
|  Shared (LDS)        - Small, fast, per-group                        |
|  Registers           - Fastest, per-thread                           |
|                                                                      |
|  Synchronization:                                                    |
|  GroupMemoryBarrierWithGroupSync()  - Wait for shared memory         |
|  DeviceMemoryBarrierWithGroupSync() - Wait for global memory         |
|  AllMemoryBarrierWithGroupSync()    - Wait for all memory            |
|                                                                      |
|  Atomics:                                                            |
|  InterlockedAdd, InterlockedMin, InterlockedMax                      |
|  InterlockedAnd, InterlockedOr, InterlockedXor                       |
|  InterlockedExchange, InterlockedCompareExchange                     |
|                                                                      |
|  Optimal Thread Group Sizes:                                         |
|  NVIDIA: Multiple of 32                                              |
|  AMD: Multiple of 64                                                 |
|  Cross-platform: Use 64 or 256                                       |
|                                                                      |
+=====================================================================+
```

## Further Reading

### Official Documentation

- [Microsoft HLSL Compute Shader Reference](https://docs.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-compute-shader)
- [Unity Compute Shaders Manual](https://docs.unity3d.com/Manual/class-ComputeShader.html)
- [Unreal Engine Compute Shaders](https://docs.unrealengine.com/en-US/RenderingAndGraphics/ComputeShaders/)
- [Vulkan Compute Shaders](https://www.khronos.org/registry/vulkan/specs/1.2/html/vkspec.html#shaders-compute)

### Books

- "GPU Gems 3" - NVIDIA (Chapters on GPGPU)
- "OpenCL Programming Guide" by Munshi et al.
- "Real-Time Rendering, 4th Edition" - Chapter on GPU Computing

### Advanced Topics

- Hierarchical task shaders (Mesh shaders)
- Async compute queues
- Multi-GPU computing
- CUDA interoperability
- Machine learning inference on GPU

### Tools

- NVIDIA Nsight Graphics
- AMD Radeon GPU Profiler
- RenderDoc
- Intel GPA
- PIX for Windows
