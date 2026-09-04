---
title: 计算着色器入门与实战
description: 掌握 GPU 计算着色器：并行编程、GPGPU 基础，以及游戏开发中的实际应用
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
origin: old/src/content/docs/gamedev/compute-shaders.zh.md
divergence: 0.213
issues: []
legacy:
  category: GameDev
  subcategory: Graphics
  order: 51
  lastUpdated: 2026-01-21
---

计算着色器代表了游戏开发中的范式转变，让我们能够利用现代 GPU 的大规模并行处理能力进行通用计算。本指南涵盖从基本概念到主流游戏引擎中的实际实现的所有内容。

## 概念解释

### 什么是计算着色器？

计算着色器是在 GPU 上运行但不与渲染几何体绑定的程序。与处理特定图形数据的顶点着色器或片段着色器不同，计算着色器可以对缓冲区进行任意读写操作，使其成为通用 GPU 计算（GPGPU）的理想选择。

```
+=====================================================================+
|                    GPU 着色器管线                                     |
+=====================================================================+
|                                                                      |
|   传统图形管线:                                                       |
|   +----------+     +----------+     +----------+     +----------+   |
|   |  顶点    |---->|  几何    |---->|  片段    |---->|  输出    |   |
|   |  着色器   |     |  着色器   |     |  着色器   |     |  合并    |   |
|   +----------+     +----------+     +----------+     +----------+   |
|        |                                                             |
|        v                                                             |
|   处理顶点、光栅化、着色像素                                           |
|                                                                      |
|   -------------------------------------------------------------------
|                                                                      |
|   计算管线:                                                           |
|   +----------+                      +----------+                     |
|   |  输入    |--------------------->|  计算    |----> 输出            |
|   |  缓冲区   |                      |  着色器   |     缓冲区          |
|   +----------+                      +----------+                     |
|        |                                                             |
|        v                                                             |
|   通用并行计算                                                        |
|   (物理、AI、模拟、图像处理)                                           |
|                                                                      |
+=====================================================================+
```

### 为什么使用计算着色器？

1. **大规模并行**：GPU 有数千个核心，可实现大规模并行处理
2. **高内存带宽**：GPU 提供比 CPU 高得多的内存带宽
3. **卸载 CPU 工作**：将计算转移到 GPU，释放 CPU 用于其他任务
4. **直接缓冲区访问**：无需渲染目标限制即可读写缓冲区
5. **灵活的工作组**：控制线程组织以获得最佳性能

### GPU vs CPU 架构

```
CPU 架构:                           GPU 架构:
+-------------------+               +-------------------+
| 核心 1 | 核心 2  |               | SM  | SM  | SM  | SM  |
|--------|---------|               |-----|-----|-----|-----|
| 核心 3 | 核心 4  |               | SM  | SM  | SM  | SM  |
+-------------------+               |-----|-----|-----|-----|
| 大缓存            |               | SM  | SM  | SM  | SM  |
| 复杂控制          |               +-------------------+
| 分支预测          |               |    高带宽内存      |
+-------------------+               +-------------------+

少量强大核心                        大量简单核心
低延迟                              高吞吐量
复杂操作                            简单并行操作
```

## 核心原理

### 线程组织

计算着色器将工作组织成线程组（工作组）的层次结构：

```
+=====================================================================+
|                    计算着色器线程层次结构                              |
+=====================================================================+
|                                                                      |
|   调度 (网格)                                                         |
|   +-----------------------------------------------------------+     |
|   |  线程组    |  线程组    |  线程组    |  线程组    |               |
|   |  (8,8,1)   |  (8,8,1)   |  (8,8,1)   |  (8,8,1)   |               |
|   +-------------+--------------+--------------+---------------+     |
|   |  线程组    |  线程组    |  线程组    |  线程组    |               |
|   |  (8,8,1)   |  (8,8,1)   |  (8,8,1)   |  (8,8,1)   |               |
|   +-----------------------------------------------------------+     |
|                                                                      |
|   线程组 (工作组):                                                    |
|   +-------------------+                                              |
|   | T T T T T T T T  |  <- 8 个线程                                  |
|   | T T T T T T T T  |                                              |
|   | T T T T T T T T  |                                              |
|   | T T T T T T T T  |  总计: 8x8x1 = 64 个线程每组                  |
|   | T T T T T T T T  |                                              |
|   | T T T T T T T T  |                                              |
|   | T T T T T T T T  |                                              |
|   | T T T T T T T T  |                                              |
|   +-------------------+                                              |
|                                                                      |
|   总线程数 = numGroupsX * numGroupsY * numGroupsZ *                   |
|              groupSizeX * groupSizeY * groupSizeZ                    |
|                                                                      |
+=====================================================================+
```

### 线程标识

每个线程有多个标识符：

```hlsl
// HLSL 语义
uint3 groupId       : SV_GroupID;           // 哪个线程组
uint3 groupThreadId : SV_GroupThreadID;     // 组内线程位置
uint3 dispatchId    : SV_DispatchThreadID;  // 全局线程位置
uint  groupIndex    : SV_GroupIndex;        // 组内展平索引

// 示例: Dispatch(4, 4, 1) 配合 [numthreads(8, 8, 1)]
// 对于位置 (10, 5, 0) 的线程:
// groupId        = (1, 0, 0)     // X 方向第 1 组
// groupThreadId  = (2, 5, 0)     // 组内位置
// dispatchId     = (10, 5, 0)    // 全局位置
// groupIndex     = 5 * 8 + 2 = 42 // 组内展平索引
```

### 内存层次结构

```
+=====================================================================+
|                    GPU 内存层次结构                                   |
+=====================================================================+
|                                                                      |
|   +--------------------+                                             |
|   |    全局内存        |  最大，最慢                                  |
|   |    (VRAM)          |  所有线程可见                                |
|   +--------------------+                                             |
|            |                                                         |
|            v                                                         |
|   +--------------------+                                             |
|   |    共享内存        |  快速，大小有限 (每组 16-48KB)               |
|   |    (组局部)        |  线程组内共享                                |
|   +--------------------+                                             |
|            |                                                         |
|            v                                                         |
|   +--------------------+                                             |
|   |    寄存器          |  最快，非常有限                              |
|   |    (线程局部)      |  每个线程私有                                |
|   +--------------------+                                             |
|                                                                      |
|   访问延迟:                                                           |
|   寄存器: ~1 周期                                                     |
|   共享内存: ~5-30 周期                                                |
|   全局内存: ~200-400 周期                                             |
|                                                                      |
+=====================================================================+
```

## 核心要点

### 缓冲区类型

```hlsl
// 结构化缓冲区 (只读)
StructuredBuffer<float4> inputBuffer;

// RW结构化缓冲区 (读写)
RWStructuredBuffer<float4> outputBuffer;

// 字节地址缓冲区 (原始内存访问)
ByteAddressBuffer rawInput;
RWByteAddressBuffer rawOutput;

// 类型化缓冲区
Buffer<float4> typedInput;
RWBuffer<float4> typedOutput;

// 纹理作为计算目标
RWTexture2D<float4> outputTexture;
```

### 同步

```hlsl
// 组内存屏障 - 等待所有组共享内存写入
GroupMemoryBarrierWithGroupSync();

// 设备内存屏障 - 等待所有设备内存写入
DeviceMemoryBarrierWithGroupSync();

// 所有内存屏障
AllMemoryBarrierWithGroupSync();

// 无同步 (仅屏障，线程继续)
GroupMemoryBarrier();
DeviceMemoryBarrier();
AllMemoryBarrier();
```

### 原子操作

```hlsl
// 线程安全更新的原子操作
uint originalValue;

InterlockedAdd(buffer[index], 1, originalValue);      // 加法
InterlockedMin(buffer[index], value, originalValue);  // 最小值
InterlockedMax(buffer[index], value, originalValue);  // 最大值
InterlockedAnd(buffer[index], value, originalValue);  // 按位与
InterlockedOr(buffer[index], value, originalValue);   // 按位或
InterlockedXor(buffer[index], value, originalValue);  // 按位异或
InterlockedExchange(buffer[index], value, originalValue);  // 交换
InterlockedCompareStore(buffer[index], compare, value);    // CAS
InterlockedCompareExchange(buffer[index], compare, value, originalValue);
```

## 代码示例

### 基础计算着色器 (HLSL)

```hlsl
// SimpleCompute.compute
#pragma kernel CSMain

// 输入/输出缓冲区
StructuredBuffer<float> Input;
RWStructuredBuffer<float> Output;

// 常量
cbuffer Constants : register(b0)
{
    uint _Count;
    float _Multiplier;
};

[numthreads(256, 1, 1)]
void CSMain(uint3 id : SV_DispatchThreadID)
{
    // 边界检查
    if (id.x >= _Count)
        return;

    // 简单操作：输入乘以常数
    Output[id.x] = Input[id.x] * _Multiplier;
}
```

### 粒子系统

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
RWStructuredBuffer<uint> _DeadList;        // 死亡粒子索引池
RWStructuredBuffer<uint> _AliveList;       // 当前存活粒子
RWStructuredBuffer<uint> _CounterBuffer;   // [0]=死亡计数, [1]=存活计数

// 常量
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

// 伪随机数生成器
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

    // 更新生命周期
    p.lifetime -= _DeltaTime;

    if (p.lifetime <= 0)
    {
        // 杀死粒子
        p.isAlive = 0;

        // 添加到死亡列表
        uint deadIndex;
        InterlockedAdd(_CounterBuffer[0], 1, deadIndex);
        _DeadList[deadIndex] = id.x;
    }
    else
    {
        // 更新物理
        p.velocity += _Gravity * _DeltaTime;
        p.position += p.velocity * _DeltaTime;

        // 淡出
        float lifetimeRatio = p.lifetime / _InitialLifetime;
        p.color.a = lifetimeRatio;
        p.size = lerp(0.1, 1.0, lifetimeRatio);

        // 添加到存活列表
        uint aliveIndex;
        InterlockedAdd(_CounterBuffer[1], 1, aliveIndex);
        _AliveList[aliveIndex] = id.x;
    }

    _Particles[id.x] = p;
}

[numthreads(256, 1, 1)]
void EmitParticles(uint3 id : SV_DispatchThreadID, uint3 groupId : SV_GroupID)
{
    // 获取死亡粒子索引
    uint deadCount;
    InterlockedAdd(_CounterBuffer[0], -1, deadCount);

    if (deadCount <= 0)
    {
        InterlockedAdd(_CounterBuffer[0], 1);  // 恢复计数
        return;
    }

    uint particleIndex = _DeadList[deadCount - 1];

    // 初始化新粒子
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

### 图像处理（模糊）

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

// 半径 4 的预计算高斯权重
static const float weights[9] = {
    0.0162162162, 0.0540540541, 0.1216216216, 0.1945945946,
    0.2270270270,
    0.1945945946, 0.1216216216, 0.0540540541, 0.0162162162
};

groupshared float4 sharedData[256 + 16];  // 额外用于模糊半径

[numthreads(256, 1, 1)]
void GaussianBlurHorizontal(uint3 id : SV_DispatchThreadID,
                            uint3 groupThreadId : SV_GroupThreadID,
                            uint3 groupId : SV_GroupID)
{
    int2 pixelCoord = int2(id.x, groupId.y);

    // 加载到共享内存（带填充）
    int loadIndex = groupThreadId.x - 8;
    int2 loadCoord = int2(clamp(groupId.x * 256 + loadIndex, 0, _TextureWidth - 1), groupId.y);

    sharedData[groupThreadId.x] = _InputTexture.Load(int3(loadCoord, 0));

    // 为模糊半径加载额外像素
    if (groupThreadId.x < 16)
    {
        int extraLoadIndex = 256 + loadIndex;
        int2 extraCoord = int2(clamp(groupId.x * 256 + extraLoadIndex, 0, _TextureWidth - 1), groupId.y);
        sharedData[256 + groupThreadId.x] = _InputTexture.Load(int3(extraCoord, 0));
    }

    GroupMemoryBarrierWithGroupSync();

    // 应用模糊
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

    // 与水平类似，但在 Y 方向
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

### Unity 集成

```csharp
// ParticleSystemCompute.cs
using UnityEngine;

public class GPUParticleSystem : MonoBehaviour
{
    [Header("计算着色器")]
    public ComputeShader particleCompute;

    [Header("粒子设置")]
    public int maxParticles = 100000;
    public float emitRate = 10000f;
    public float initialLifetime = 3f;
    public float initialSpeed = 5f;
    public Vector3 gravity = new Vector3(0, -9.81f, 0);
    public float emitterRadius = 1f;
    public Color initialColor = Color.white;

    [Header("渲染")]
    public Material particleMaterial;
    public Mesh particleMesh;

    // 计算缓冲区
    private ComputeBuffer particleBuffer;
    private ComputeBuffer deadListBuffer;
    private ComputeBuffer aliveListBuffer;
    private ComputeBuffer counterBuffer;
    private ComputeBuffer argsBuffer;

    // Kernel IDs
    private int updateKernel;
    private int emitKernel;

    // 内部状态
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
        // 获取 kernel IDs
        updateKernel = particleCompute.FindKernel("UpdateParticles");
        emitKernel = particleCompute.FindKernel("EmitParticles");

        // 创建缓冲区
        int particleStride = System.Runtime.InteropServices.Marshal.SizeOf(typeof(Particle));
        particleBuffer = new ComputeBuffer(maxParticles, particleStride);
        deadListBuffer = new ComputeBuffer(maxParticles, sizeof(uint));
        aliveListBuffer = new ComputeBuffer(maxParticles, sizeof(uint));
        counterBuffer = new ComputeBuffer(2, sizeof(uint));
        argsBuffer = new ComputeBuffer(5, sizeof(uint), ComputeBufferType.IndirectArguments);

        // 用所有粒子索引初始化死亡列表
        uint[] deadIndices = new uint[maxParticles];
        for (int i = 0; i < maxParticles; i++)
        {
            deadIndices[i] = (uint)i;
        }
        deadListBuffer.SetData(deadIndices);

        // 初始化计数器（所有粒子初始为死亡）
        counterData[0] = maxParticles;  // 死亡计数
        counterData[1] = 0;             // 存活计数
        counterBuffer.SetData(counterData);

        // 将粒子初始化为死亡状态
        Particle[] particles = new Particle[maxParticles];
        for (int i = 0; i < maxParticles; i++)
        {
            particles[i].isAlive = 0;
        }
        particleBuffer.SetData(particles);

        // 为实例化渲染设置间接参数
        uint[] args = new uint[5] {
            particleMesh.GetIndexCount(0),
            0,  // 每帧更新
            particleMesh.GetIndexStart(0),
            particleMesh.GetBaseVertex(0),
            0
        };
        argsBuffer.SetData(args);

        // 绑定缓冲区到计算着色器
        particleCompute.SetBuffer(updateKernel, "_Particles", particleBuffer);
        particleCompute.SetBuffer(updateKernel, "_DeadList", deadListBuffer);
        particleCompute.SetBuffer(updateKernel, "_AliveList", aliveListBuffer);
        particleCompute.SetBuffer(updateKernel, "_CounterBuffer", counterBuffer);

        particleCompute.SetBuffer(emitKernel, "_Particles", particleBuffer);
        particleCompute.SetBuffer(emitKernel, "_DeadList", deadListBuffer);
        particleCompute.SetBuffer(emitKernel, "_CounterBuffer", counterBuffer);

        // 绑定缓冲区到材质
        particleMaterial.SetBuffer("_Particles", particleBuffer);
        particleMaterial.SetBuffer("_AliveList", aliveListBuffer);
    }

    void Update()
    {
        float dt = Time.deltaTime;

        // 重置存活计数器
        counterData[1] = 0;
        counterBuffer.SetData(counterData);

        // 设置常量
        particleCompute.SetFloat("_DeltaTime", dt);
        particleCompute.SetVector("_Gravity", gravity);
        particleCompute.SetVector("_EmitterPosition", transform.position);
        particleCompute.SetFloat("_EmitterRadius", emitterRadius);
        particleCompute.SetInt("_MaxParticles", maxParticles);
        particleCompute.SetFloat("_InitialLifetime", initialLifetime);
        particleCompute.SetFloat("_InitialSpeed", initialSpeed);
        particleCompute.SetVector("_InitialColor", initialColor);

        // 更新粒子
        int threadGroups = Mathf.CeilToInt(maxParticles / 256f);
        particleCompute.Dispatch(updateKernel, threadGroups, 1, 1);

        // 发射新粒子
        emitAccumulator += emitRate * dt;
        int emitCount = Mathf.FloorToInt(emitAccumulator);
        if (emitCount > 0)
        {
            emitAccumulator -= emitCount;
            int emitGroups = Mathf.CeilToInt(emitCount / 256f);
            particleCompute.Dispatch(emitKernel, emitGroups, 1, 1);
        }

        // 获取存活计数用于渲染
        counterBuffer.GetData(counterData);
        uint[] args = new uint[5] {
            particleMesh.GetIndexCount(0),
            (uint)counterData[1],
            particleMesh.GetIndexStart(0),
            particleMesh.GetBaseVertex(0),
            0
        };
        argsBuffer.SetData(args);

        // 渲染粒子
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

### 并行归约（求和）

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

    // 加载数据到共享内存
    if (globalId < _InputCount)
    {
        sharedData[tid] = _Input[globalId];
    }
    else
    {
        sharedData[tid] = 0;
    }

    GroupMemoryBarrierWithGroupSync();

    // 在共享内存中执行归约
    [unroll]
    for (uint stride = 128; stride > 0; stride >>= 1)
    {
        if (tid < stride)
        {
            sharedData[tid] += sharedData[tid + stride];
        }
        GroupMemoryBarrierWithGroupSync();
    }

    // 写入此组的结果
    if (tid == 0)
    {
        _Output[groupId.x] = sharedData[0];
    }
}

// 小数组的最终归约
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

## 最佳实践

### 1. 优化线程组大小

```hlsl
// GPU 波前/warp 大小:
// NVIDIA: 32 线程 (warp)
// AMD: 64 线程 (wavefront)
// 使用 64 的倍数以获得最佳跨平台性能

// 好: 64 的倍数
[numthreads(64, 1, 1)]   // 1D 工作负载
[numthreads(8, 8, 1)]    // 2D 工作负载 (64 线程)
[numthreads(4, 4, 4)]    // 3D 工作负载 (64 线程)

// 避免: 非 32/64 的倍数
[numthreads(100, 1, 1)]  // 浪费线程
[numthreads(7, 7, 1)]    // 49 线程，利用率低
```

### 2. 合并内存访问

```hlsl
// 不好: 分散的内存访问
[numthreads(256, 1, 1)]
void BadAccess(uint3 id : SV_DispatchThreadID)
{
    // 线程访问非连续内存
    float value = _Buffer[id.x * stride + offset];  // 分散!
}

// 好: 合并的内存访问
[numthreads(256, 1, 1)]
void GoodAccess(uint3 id : SV_DispatchThreadID)
{
    // 相邻线程访问相邻内存
    float value = _Buffer[id.x];  // 合并!
}
```

### 3. 使用共享内存复用数据

```hlsl
// 不好: 多次全局内存读取
[numthreads(8, 8, 1)]
void BadStencil(uint3 id : SV_DispatchThreadID)
{
    float sum = 0;
    // 每次邻居读取都访问全局内存
    for (int dy = -1; dy <= 1; dy++)
    {
        for (int dx = -1; dx <= 1; dx++)
        {
            sum += _Input[id.xy + int2(dx, dy)];
        }
    }
    _Output[id.xy] = sum / 9.0;
}

// 好: 先加载到共享内存
groupshared float tile[10][10];  // 8x8 + 1 像素边框

[numthreads(8, 8, 1)]
void GoodStencil(uint3 id : SV_DispatchThreadID,
                 uint3 groupThreadId : SV_GroupThreadID)
{
    // 协作加载到共享内存
    int2 localId = groupThreadId.xy + int2(1, 1);
    tile[localId.y][localId.x] = _Input[id.xy];

    // 加载边框
    if (groupThreadId.x == 0)
        tile[localId.y][0] = _Input[id.xy + int2(-1, 0)];
    if (groupThreadId.x == 7)
        tile[localId.y][9] = _Input[id.xy + int2(1, 0)];
    // ... y 边框类似

    GroupMemoryBarrierWithGroupSync();

    // 现在所有数据都在快速共享内存中
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

### 4. 避免分支发散

```hlsl
// 不好: warp 内的发散分支
[numthreads(64, 1, 1)]
void BadBranch(uint3 id : SV_DispatchThreadID)
{
    // 不同线程走不同路径
    if (id.x % 2 == 0)
    {
        DoExpensiveWork();
    }
    else
    {
        DoOtherExpensiveWork();
    }
}

// 好: 最小化发散
[numthreads(64, 1, 1)]
void GoodBranch(uint3 id : SV_DispatchThreadID)
{
    // 使用谓词或确保整个 warp 走同一路径
    float result = lerp(
        ComputePathA(id.x),
        ComputePathB(id.x),
        id.x % 2
    );
}
```

### 5. 读写使用双缓冲

```csharp
// 避免在一次调度中读写同一缓冲区
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

        // 交换缓冲区
        useBufferA = !useBufferA;
    }
}
```

## 常见陷阱

### 陷阱 1: 竞态条件

```hlsl
// 不好: 竞态条件
RWStructuredBuffer<uint> _Counter;

[numthreads(256, 1, 1)]
void BadIncrement(uint3 id : SV_DispatchThreadID)
{
    _Counter[0] = _Counter[0] + 1;  // 竞态条件!
}

// 好: 使用原子操作
[numthreads(256, 1, 1)]
void GoodIncrement(uint3 id : SV_DispatchThreadID)
{
    uint original;
    InterlockedAdd(_Counter[0], 1, original);  // 线程安全
}
```

### 陷阱 2: 缺少边界检查

```hlsl
// 不好: 越界访问
[numthreads(256, 1, 1)]
void BadBounds(uint3 id : SV_DispatchThreadID)
{
    _Output[id.x] = _Input[id.x];  // 可能读写越界!
}

// 好: 始终检查边界
[numthreads(256, 1, 1)]
void GoodBounds(uint3 id : SV_DispatchThreadID)
{
    if (id.x >= _Count)
        return;

    _Output[id.x] = _Input[id.x];
}
```

### 陷阱 3: 缓冲区大小不匹配

```csharp
// 不好: 错误的缓冲区步长
struct MyStruct
{
    public Vector3 position;  // 12 字节
    public float value;       // 4 字节
    // 总计: 16 字节
}

// 错误的步长!
buffer = new ComputeBuffer(count, 12);  // 应该是 16!

// 好: 使用 Marshal.SizeOf 或显式计算
buffer = new ComputeBuffer(count, System.Runtime.InteropServices.Marshal.SizeOf(typeof(MyStruct)));
// 或
buffer = new ComputeBuffer(count, 16);
```

### 陷阱 4: 忘记同步

```hlsl
// 不好: 使用共享内存但没有同步
groupshared float cache[64];

[numthreads(64, 1, 1)]
void BadSync(uint3 id : SV_DispatchThreadID, uint3 groupThreadId : SV_GroupThreadID)
{
    cache[groupThreadId.x] = _Input[id.x];

    // 缺少 GroupMemoryBarrierWithGroupSync()!

    float neighbor = cache[(groupThreadId.x + 1) % 64];  // 可能读取过期数据!
}

// 好: 共享内存写入后始终同步
[numthreads(64, 1, 1)]
void GoodSync(uint3 id : SV_DispatchThreadID, uint3 groupThreadId : SV_GroupThreadID)
{
    cache[groupThreadId.x] = _Input[id.x];

    GroupMemoryBarrierWithGroupSync();  // 等待所有写入

    float neighbor = cache[(groupThreadId.x + 1) % 64];  // 安全
}
```

## 性能考量

### 占用率

```
占用率 = 活跃 Warps / 每 SM 最大 Warps

更高的占用率通常意味着更好的延迟隐藏。
影响占用率的因素:
- 每线程寄存器使用量
- 每线程组共享内存使用量
- 线程组大小

分析工具:
- NVIDIA Nsight
- AMD Radeon GPU Profiler
- Unity Frame Debugger
```

### 内存带宽

```
理论带宽 vs 实际带宽:

示例: RTX 3080
- 内存: 760 GB/s 理论值
- 实际达到: 600-700 GB/s 典型值

优化策略:
1. 最大化合并访问
2. 使用共享内存减少全局读取
3. 打包数据减少内存事务
4. 对需要过滤读取的数据使用纹理采样
```

### 调度开销

```csharp
// 不好: 许多小调度
for (int i = 0; i < 1000; i++)
{
    computeShader.SetInt("_Index", i);
    computeShader.Dispatch(kernel, 1, 1, 1);
}

// 好: 单次大调度
computeShader.SetInt("_Count", 1000);
computeShader.Dispatch(kernel, Mathf.CeilToInt(1000 / 256f), 1, 1);
```

## 实战场景

### 场景 1: GPU 蒙皮

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

### 场景 2: 视锥剔除

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
    // 将包围盒角点变换到世界空间
    float3 corners[8];
    corners[0] = mul(worldMatrix, float4(minPoint.x, minPoint.y, minPoint.z, 1)).xyz;
    corners[1] = mul(worldMatrix, float4(maxPoint.x, minPoint.y, minPoint.z, 1)).xyz;
    corners[2] = mul(worldMatrix, float4(minPoint.x, maxPoint.y, minPoint.z, 1)).xyz;
    corners[3] = mul(worldMatrix, float4(maxPoint.x, maxPoint.y, minPoint.z, 1)).xyz;
    corners[4] = mul(worldMatrix, float4(minPoint.x, minPoint.y, maxPoint.z, 1)).xyz;
    corners[5] = mul(worldMatrix, float4(maxPoint.x, minPoint.y, maxPoint.z, 1)).xyz;
    corners[6] = mul(worldMatrix, float4(minPoint.x, maxPoint.y, maxPoint.z, 1)).xyz;
    corners[7] = mul(worldMatrix, float4(maxPoint.x, maxPoint.y, maxPoint.z, 1)).xyz;

    // 对每个视锥平面进行测试
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

        // 所有角点都在这个平面外
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

### 场景 3: 流体模拟 (SPH)

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

// SPH 核函数
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

    // 累加邻居的贡献
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
            // 压力
            pressureForce += -normalize(rij) * (pi.pressure + pj.pressure) /
                            (2 * pj.density) * SpikyGradient(rij, _SmoothingRadius);

            // 粘性力
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

    // 边界条件
    if (p.position.x < _BoundaryMin.x) { p.position.x = _BoundaryMin.x; p.velocity.x *= -0.5; }
    if (p.position.x > _BoundaryMax.x) { p.position.x = _BoundaryMax.x; p.velocity.x *= -0.5; }
    if (p.position.y < _BoundaryMin.y) { p.position.y = _BoundaryMin.y; p.velocity.y *= -0.5; }
    if (p.position.y > _BoundaryMax.y) { p.position.y = _BoundaryMax.y; p.velocity.y *= -0.5; }
    if (p.position.z < _BoundaryMin.z) { p.position.z = _BoundaryMin.z; p.velocity.z *= -0.5; }
    if (p.position.z > _BoundaryMax.z) { p.position.z = _BoundaryMax.z; p.velocity.z *= -0.5; }

    _Particles[id.x] = p;
}
```

## 面试要点

### 常见面试问题

**Q1: 计算着色器和片段着色器有什么区别？**

片段着色器是图形管线的一部分，在光栅化期间处理像素。它们有固定的输入（插值顶点数据）和输出（颜色值）。计算着色器独立于图形管线运行，对缓冲区有任意读写权限，并且可以自由地将线程组织成工作组。

**Q2: 什么是线程组，为什么它很重要？**

线程组（工作组）是一组在 GPU 上一起执行的线程。组内的线程可以通过组共享内存共享数据，并使用屏障进行同步。线程组大小影响占用率和性能 - 它应该是 GPU 的 warp/wavefront 大小的倍数（NVIDIA 为 32，AMD 为 64）。

**Q3: 什么时候会使用原子操作？**

当多个线程可能同时写入同一内存位置时需要原子操作。常见用途包括计数器、直方图和追加缓冲区。它们序列化访问以防止竞态条件，但如果过度使用可能成为瓶颈。

**Q4: 如何优化计算着色器中的内存访问？**

- 使用合并内存访问（相邻线程访问相邻内存）
- 利用共享内存存储线程组内复用的数据
- 最小化全局内存事务
- 打包数据以减少内存占用
- 对受益于缓存的数据使用纹理读取

**Q5: 什么是占用率，为什么它很重要？**

占用率是活跃 warps 与每流处理器最大 warps 的比率。更高的占用率有助于通过上下文切换隐藏内存延迟。它受寄存器使用、共享内存和线程组大小的影响。NSight 等工具可以帮助分析和优化占用率。

### 快速参考

```
+=====================================================================+
|                    计算着色器快速参考                                  |
+=====================================================================+
|                                                                      |
|  线程层次结构:                                                        |
|  调度 -> 线程组 -> 线程                                               |
|                                                                      |
|  线程 ID (HLSL):                                                      |
|  SV_GroupID          - 哪个线程组                                     |
|  SV_GroupThreadID    - 组内位置                                       |
|  SV_DispatchThreadID - 全局位置                                       |
|  SV_GroupIndex       - 组内展平索引                                   |
|                                                                      |
|  内存类型:                                                            |
|  全局 (VRAM)         - 最大，最慢，所有线程可见                        |
|  共享 (LDS)          - 小，快速，每组                                 |
|  寄存器              - 最快，每线程                                    |
|                                                                      |
|  同步:                                                                |
|  GroupMemoryBarrierWithGroupSync()  - 等待共享内存                     |
|  DeviceMemoryBarrierWithGroupSync() - 等待全局内存                     |
|  AllMemoryBarrierWithGroupSync()    - 等待所有内存                     |
|                                                                      |
|  原子操作:                                                            |
|  InterlockedAdd, InterlockedMin, InterlockedMax                      |
|  InterlockedAnd, InterlockedOr, InterlockedXor                       |
|  InterlockedExchange, InterlockedCompareExchange                     |
|                                                                      |
|  最佳线程组大小:                                                      |
|  NVIDIA: 32 的倍数                                                    |
|  AMD: 64 的倍数                                                       |
|  跨平台: 使用 64 或 256                                               |
|                                                                      |
+=====================================================================+
```

## 延伸阅读

### 官方文档

- [Microsoft HLSL 计算着色器参考](https://docs.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl-compute-shader)
- [Unity 计算着色器手册](https://docs.unity3d.com/Manual/class-ComputeShader.html)
- [Unreal Engine 计算着色器](https://docs.unrealengine.com/en-US/RenderingAndGraphics/ComputeShaders/)
- [Vulkan 计算着色器](https://www.khronos.org/registry/vulkan/specs/1.2/html/vkspec.html#shaders-compute)

### 书籍

- "GPU Gems 3" - NVIDIA（GPGPU 章节）
- "OpenCL Programming Guide" - Munshi 等著
- "Real-Time Rendering, 4th Edition" - GPU 计算章节

### 高级主题

- 层次化任务着色器（网格着色器）
- 异步计算队列
- 多 GPU 计算
- CUDA 互操作性
- GPU 上的机器学习推理

### 工具

- NVIDIA Nsight Graphics
- AMD Radeon GPU Profiler
- RenderDoc
- Intel GPA
- PIX for Windows
