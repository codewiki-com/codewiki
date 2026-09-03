---
title: 全局光照技术详解
description: 掌握游戏开发中的全局光照：光线追踪、路径追踪、光照探针和实时 GI 技术
track: gamedev
section: graphics
difficulty: advanced
tags:
  - global illumination
  - ray tracing
  - lighting
  - rendering
  - graphics programming
status: imported
origin: old/src/content/docs/gamedev/global-illumination.zh.md
divergence: 0.194
issues: []
legacy:
  category: GameDev
  subcategory: Graphics
  order: 52
  lastUpdated: 2026-01-21
---

全局光照 (GI) 是真实感渲染的圣杯，模拟光线在场景中如何反弹以创建自然的环境。本指南涵盖了现代游戏开发中使用的各种 GI 技术的理论和实际实现。

## 概念解释

### 什么是全局光照？

全局光照是一组算法，用于模拟光线如何在场景中与表面交互，超越直接光照的范围。它考虑了间接光 - 在到达观察者之前已经从一个或多个表面反弹的光线。

```
+=====================================================================+
|                    直接光照 vs 全局光照                               |
+=====================================================================+
|                                                                      |
|   仅直接光照:                     全局光照:                          |
|                                                                      |
|       光源                            光源                           |
|           |                               |                          |
|           v                               v                          |
|      [表面 A]                       [表面 A]                         |
|           |                            /   \                         |
|           v                           v     v                        |
|        阴影                     [表面 B] [表面 C]                     |
|                                       |     |                        |
|                                       v     v                        |
|   只有直接被照亮的                光线反弹并                          |
|   表面才可见                      照亮阴影区域                        |
|                                                                      |
|   结果: 生硬的阴影，               结果: 柔和的阴影，                 |
|   不真实的外观                    自然的颜色溢出                      |
|                                                                      |
+=====================================================================+
```

### 渲染方程

所有全局光照算法都试图求解渲染方程，这是 James Kajiya 在 1986 年提出的：

```
Lo(x, wo) = Le(x, wo) + Integral[ fr(x, wi, wo) * Li(x, wi) * (wi . n) dwi ]

其中:
- Lo(x, wo)  = 点 x 在方向 wo 的出射辐射度
- Le(x, wo)  = 发射辐射度（如果表面是光源）
- fr()       = BRDF（双向反射分布函数）
- Li(x, wi)  = 来自方向 wi 的入射辐射度
- (wi . n)   = 余弦项（与表面法线的点积）
- dwi        = 对入射方向半球的积分
```

### GI 组成部分

```
+=====================================================================+
|                    全局光照组成部分                                   |
+=====================================================================+
|                                                                      |
|   直接光           间接漫反射           间接镜面反射                  |
|   +-----------+    +---------------+    +----------------+           |
|   |           |    |    ~~~~~~     |    |    ~~~~~~      |           |
|   |    *      |    |   /      \    |    |   /      \     |           |
|   |    |      |    |  /        \   |    |  /   __   \    |           |
|   |    v      |    | v          v  |    | v   |  |   v   |           |
|   |  [===]    |    |[===]    [===] |    |[===]|__|[===]  |           |
|   +-----------+    +---------------+    +----------------+           |
|                                                                      |
|   环境光遮蔽       颜色溢出             焦散                          |
|   +-----------+    +---------------+    +----------------+           |
|   |  _____    |    |   红色墙壁    |    |    玻璃       |            |
|   | |     |   |    |   |           |    |    /\         |           |
|   | |     |   |    |   v           |    |   /  \        |           |
|   | |_____|   |    |  [粉色地板]   |    |  /    \       |           |
|   |  暗角     |    |               |    | 地板亮斑     |            |
|   |           |    |               |    |              |            |
|   +-----------+    +---------------+    +----------------+           |
|                                                                      |
+=====================================================================+
```

## 核心原理

### 光传输类型

| 类型 | 描述 | 符号 | 示例 |
|------|------|------|------|
| 直接 | 光线直接从光源传播 | L(D)E | 阳光照射地面 |
| 间接漫反射 | 光线漫反射弹跳 | LD+E | 颜色溢出 |
| 间接镜面反射 | 光线镜面反射 | LS+E | 镜面反射 |
| 焦散 | 光线通过镜面聚焦 | LS+D+E | 透过玻璃的光 |

### BRDF（双向反射分布函数）

BRDF 描述了光线如何从表面反射：

```hlsl
// Lambertian（漫反射）BRDF
float3 LambertianBRDF(float3 albedo)
{
    return albedo / PI;
}

// Cook-Torrance（镜面反射）BRDF
float3 CookTorranceBRDF(float3 N, float3 V, float3 L, float3 albedo,
                        float metallic, float roughness)
{
    float3 H = normalize(V + L);

    float NDF = DistributionGGX(N, H, roughness);
    float G = GeometrySmith(N, V, L, roughness);
    float3 F = FresnelSchlick(max(dot(H, V), 0.0), F0);

    float3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;

    return numerator / denominator;
}

// GGX 法线分布函数
float DistributionGGX(float3 N, float3 H, float roughness)
{
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return a2 / denom;
}
```

## 核心要点

### 1. 光线追踪基础

```hlsl
struct Ray
{
    float3 origin;
    float3 direction;
};

struct HitInfo
{
    float t;           // 沿光线的距离
    float3 position;
    float3 normal;
    float2 uv;
    int materialId;
};

// 基本光线-球体相交
bool RaySphereIntersect(Ray ray, float3 center, float radius, out float t)
{
    float3 oc = ray.origin - center;
    float a = dot(ray.direction, ray.direction);
    float b = 2.0 * dot(oc, ray.direction);
    float c = dot(oc, oc) - radius * radius;
    float discriminant = b * b - 4 * a * c;

    if (discriminant < 0)
    {
        return false;
    }

    t = (-b - sqrt(discriminant)) / (2.0 * a);
    return t > 0;
}

// 光线-三角形相交 (Moller-Trumbore)
bool RayTriangleIntersect(Ray ray, float3 v0, float3 v1, float3 v2,
                          out float t, out float2 uv)
{
    float3 edge1 = v1 - v0;
    float3 edge2 = v2 - v0;
    float3 h = cross(ray.direction, edge2);
    float a = dot(edge1, h);

    if (abs(a) < 1e-8)
        return false;

    float f = 1.0 / a;
    float3 s = ray.origin - v0;
    float u = f * dot(s, h);

    if (u < 0.0 || u > 1.0)
        return false;

    float3 q = cross(s, edge1);
    float v = f * dot(ray.direction, q);

    if (v < 0.0 || u + v > 1.0)
        return false;

    t = f * dot(edge2, q);
    uv = float2(u, v);

    return t > 0;
}
```

### 2. 路径追踪

路径追踪是一种蒙特卡洛方法，通过场景追踪随机路径：

```hlsl
float3 PathTrace(Ray ray, int maxBounces)
{
    float3 throughput = float3(1, 1, 1);
    float3 radiance = float3(0, 0, 0);

    for (int bounce = 0; bounce < maxBounces; bounce++)
    {
        HitInfo hit;
        if (!TraceRay(ray, hit))
        {
            // 击中天空 - 添加环境贡献
            radiance += throughput * SampleEnvironment(ray.direction);
            break;
        }

        Material mat = GetMaterial(hit.materialId);

        // 添加自发光
        radiance += throughput * mat.emission;

        // 基于材质采样下一个方向
        float3 wo = -ray.direction;
        float3 wi;
        float pdf;
        float3 brdf = SampleBRDF(hit.normal, wo, mat, wi, pdf);

        if (pdf < 1e-8)
            break;

        // 更新吞吐量
        float cosTheta = max(dot(hit.normal, wi), 0.0);
        throughput *= brdf * cosTheta / pdf;

        // 俄罗斯轮盘赌终止路径
        if (bounce > 3)
        {
            float p = max(throughput.r, max(throughput.g, throughput.b));
            if (Random() > p)
                break;
            throughput /= p;
        }

        // 设置下一条光线
        ray.origin = hit.position + hit.normal * 0.001;
        ray.direction = wi;
    }

    return radiance;
}

// 重要性采样 GGX 分布
float3 SampleGGX(float3 N, float roughness, out float pdf)
{
    float2 xi = float2(Random(), Random());

    float a = roughness * roughness;
    float phi = 2.0 * PI * xi.x;
    float cosTheta = sqrt((1.0 - xi.y) / (1.0 + (a * a - 1.0) * xi.y));
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);

    // 球面到笛卡尔坐标
    float3 H;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;

    // 变换到世界空间
    float3 up = abs(N.z) < 0.999 ? float3(0, 0, 1) : float3(1, 0, 0);
    float3 tangent = normalize(cross(up, N));
    float3 bitangent = cross(N, tangent);

    float3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;

    // GGX 重要性采样的 PDF
    float d = (cosTheta * a * a - cosTheta) * cosTheta + 1.0;
    pdf = a * a * cosTheta * sinTheta / (PI * d * d);

    return normalize(sampleVec);
}
```

### 3. 加速结构

高效的光线追踪需要空间加速结构：

```cpp
// 层次包围盒 (BVH) 节点
struct BVHNode
{
    AABB bounds;
    int leftChild;   // 叶子节点为 -1
    int rightChild;  // 叶子节点为 -1
    int primitiveStart;
    int primitiveCount;
};

// BVH 遍历
bool TraverseBVH(Ray ray, BVHNode* nodes, Triangle* triangles,
                 out HitInfo hit)
{
    hit.t = INFINITY;
    int stack[64];
    int stackPtr = 0;
    stack[stackPtr++] = 0;  // 从根节点开始

    while (stackPtr > 0)
    {
        int nodeIdx = stack[--stackPtr];
        BVHNode node = nodes[nodeIdx];

        if (!RayAABBIntersect(ray, node.bounds, hit.t))
            continue;

        if (node.primitiveCount > 0)  // 叶子节点
        {
            for (int i = 0; i < node.primitiveCount; i++)
            {
                Triangle tri = triangles[node.primitiveStart + i];
                float t;
                float2 uv;
                if (RayTriangleIntersect(ray, tri.v0, tri.v1, tri.v2, t, uv))
                {
                    if (t < hit.t)
                    {
                        hit.t = t;
                        hit.position = ray.origin + ray.direction * t;
                        hit.normal = tri.normal;
                        hit.uv = uv;
                    }
                }
            }
        }
        else  // 内部节点
        {
            // 压入子节点（前后顺序以提高效率）
            float tLeft, tRight;
            bool hitLeft = RayAABBIntersect(ray, nodes[node.leftChild].bounds, tLeft);
            bool hitRight = RayAABBIntersect(ray, nodes[node.rightChild].bounds, tRight);

            if (hitLeft && hitRight)
            {
                if (tLeft < tRight)
                {
                    stack[stackPtr++] = node.rightChild;
                    stack[stackPtr++] = node.leftChild;
                }
                else
                {
                    stack[stackPtr++] = node.leftChild;
                    stack[stackPtr++] = node.rightChild;
                }
            }
            else if (hitLeft)
            {
                stack[stackPtr++] = node.leftChild;
            }
            else if (hitRight)
            {
                stack[stackPtr++] = node.rightChild;
            }
        }
    }

    return hit.t < INFINITY;
}
```

## 代码示例

### 光照探针 / 球谐函数

```hlsl
// 漫反射辐照度的球谐函数（L2 带 = 9 个系数）
struct SHCoefficients
{
    float3 L00;   // 带 0
    float3 L1_1;  // 带 1
    float3 L10;
    float3 L11;
    float3 L2_2;  // 带 2
    float3 L2_1;
    float3 L20;
    float3 L21;
    float3 L22;
};

// 计算给定法线方向的 SH 辐照度
float3 EvaluateSH(SHCoefficients sh, float3 n)
{
    // SH 基函数常量
    const float c1 = 0.429043;
    const float c2 = 0.511664;
    const float c3 = 0.743125;
    const float c4 = 0.886227;
    const float c5 = 0.247708;

    float3 irradiance =
        c4 * sh.L00 +

        2.0 * c2 * (sh.L11 * n.x + sh.L1_1 * n.y + sh.L10 * n.z) +

        c1 * sh.L22 * (n.x * n.x - n.y * n.y) +
        c3 * sh.L20 * (n.z * n.z - 1.0/3.0) +
        c1 * sh.L2_2 * n.x * n.y +
        c1 * sh.L21 * n.x * n.z +
        c1 * sh.L2_1 * n.y * n.z;

    return max(irradiance, 0.0);
}

// 将环境贴图投影到 SH 系数
SHCoefficients ProjectToSH(TextureCube envMap)
{
    SHCoefficients sh = (SHCoefficients)0;

    const int samples = 4096;
    float weight = 0;

    for (int i = 0; i < samples; i++)
    {
        // 生成均匀球面采样
        float2 xi = Hammersley(i, samples);
        float3 dir = UniformSampleSphere(xi);

        float3 radiance = envMap.SampleLevel(samplerLinear, dir, 0).rgb;

        // SH 基函数
        sh.L00 += radiance * 0.282095;

        sh.L1_1 += radiance * 0.488603 * dir.y;
        sh.L10 += radiance * 0.488603 * dir.z;
        sh.L11 += radiance * 0.488603 * dir.x;

        sh.L2_2 += radiance * 1.092548 * dir.x * dir.y;
        sh.L2_1 += radiance * 1.092548 * dir.y * dir.z;
        sh.L20 += radiance * 0.315392 * (3.0 * dir.z * dir.z - 1.0);
        sh.L21 += radiance * 1.092548 * dir.x * dir.z;
        sh.L22 += radiance * 0.546274 * (dir.x * dir.x - dir.y * dir.y);

        weight += 1.0;
    }

    float scale = 4.0 * PI / weight;
    sh.L00 *= scale;
    sh.L1_1 *= scale;
    sh.L10 *= scale;
    sh.L11 *= scale;
    sh.L2_2 *= scale;
    sh.L2_1 *= scale;
    sh.L20 *= scale;
    sh.L21 *= scale;
    sh.L22 *= scale;

    return sh;
}
```

### 屏幕空间全局光照 (SSGI)

```hlsl
// 使用屏幕空间光线步进的 SSGI
float3 SSGI(float2 uv, float3 worldPos, float3 normal, Texture2D colorBuffer,
            Texture2D depthBuffer, Texture2D normalBuffer, float4x4 viewProj)
{
    float3 indirectLight = float3(0, 0, 0);
    const int numSamples = 16;

    for (int i = 0; i < numSamples; i++)
    {
        // 在半球内生成随机方向
        float2 xi = float2(Random(), Random());
        float3 sampleDir = CosineWeightedHemisphere(normal, xi);

        // 在屏幕空间进行光线步进
        float3 rayOrigin = worldPos + normal * 0.01;
        float3 rayDir = sampleDir;

        const int maxSteps = 32;
        const float stepSize = 0.1;

        float3 currentPos = rayOrigin;
        bool hit = false;
        float2 hitUV;

        for (int step = 0; step < maxSteps; step++)
        {
            currentPos += rayDir * stepSize * (1.0 + step * 0.5);

            // 投影到屏幕空间
            float4 clipPos = mul(viewProj, float4(currentPos, 1.0));
            float2 screenUV = clipPos.xy / clipPos.w * 0.5 + 0.5;

            if (screenUV.x < 0 || screenUV.x > 1 || screenUV.y < 0 || screenUV.y > 1)
                break;

            // 比较深度
            float sceneDepth = depthBuffer.SampleLevel(samplerPoint, screenUV, 0).r;
            float rayDepth = clipPos.z / clipPos.w;

            if (rayDepth > sceneDepth && rayDepth < sceneDepth + 0.01)
            {
                hit = true;
                hitUV = screenUV;
                break;
            }
        }

        if (hit)
        {
            float3 hitColor = colorBuffer.SampleLevel(samplerLinear, hitUV, 0).rgb;
            float3 hitNormal = normalBuffer.SampleLevel(samplerLinear, hitUV, 0).rgb * 2.0 - 1.0;

            // 检查朝向
            if (dot(hitNormal, -rayDir) > 0)
            {
                indirectLight += hitColor;
            }
        }
    }

    return indirectLight / numSamples;
}
```

### 体素锥追踪

```hlsl
// 体素结构
Texture3D<float4> voxelGrid;  // RGB = 颜色, A = 不透明度

// 间接光照的锥追踪
float3 TraceCone(float3 origin, float3 direction, float coneRatio,
                 float maxDistance, float voxelSize)
{
    float3 color = float3(0, 0, 0);
    float occlusion = 0.0;

    float t = voxelSize;  // 从体素大小开始以避免自相交
    float3 voxelGridSize = float3(256, 256, 256);

    while (t < maxDistance && occlusion < 1.0)
    {
        // 计算当前距离处的锥直径
        float diameter = max(voxelSize, coneRatio * t);
        float mipLevel = log2(diameter / voxelSize);

        // 体素网格中的采样位置
        float3 samplePos = origin + direction * t;
        float3 voxelUV = samplePos / voxelGridSize;

        if (any(voxelUV < 0) || any(voxelUV > 1))
            break;

        // 在适当的 mip 级别使用三线性过滤采样体素
        float4 voxelSample = voxelGrid.SampleLevel(samplerLinear, voxelUV, mipLevel);

        // 前后合成
        float a = 1.0 - occlusion;
        color += a * voxelSample.a * voxelSample.rgb;
        occlusion += a * voxelSample.a;

        // 向前步进
        t += diameter * 0.5;
    }

    return color;
}

// 使用多个锥的完整间接光照
float3 VoxelConeTracingIndirect(float3 worldPos, float3 normal, float3 albedo)
{
    float3 indirectDiffuse = float3(0, 0, 0);

    // 漫反射锥 - 使用宽锥采样半球
    const float diffuseConeRatio = 0.577; // tan(30 度)
    const int numDiffuseCones = 6;

    // 围绕法线生成锥方向
    float3 tangent = abs(normal.y) < 0.999 ? float3(0, 1, 0) : float3(1, 0, 0);
    tangent = normalize(tangent - normal * dot(tangent, normal));
    float3 bitangent = cross(normal, tangent);

    float3 coneDirections[6];
    coneDirections[0] = normal;
    coneDirections[1] = normalize(normal + tangent * 0.707);
    coneDirections[2] = normalize(normal - tangent * 0.707);
    coneDirections[3] = normalize(normal + bitangent * 0.707);
    coneDirections[4] = normalize(normal - bitangent * 0.707);
    coneDirections[5] = normalize(normal + tangent * 0.5 + bitangent * 0.5);

    float weights[6] = { 1.0, 0.5, 0.5, 0.5, 0.5, 0.5 };
    float totalWeight = 0;

    for (int i = 0; i < numDiffuseCones; i++)
    {
        float3 coneColor = TraceCone(worldPos, coneDirections[i],
                                     diffuseConeRatio, 50.0, 0.5);
        indirectDiffuse += coneColor * weights[i];
        totalWeight += weights[i];
    }

    indirectDiffuse /= totalWeight;
    return indirectDiffuse * albedo / PI;
}
```

### 光传播体积 (LPV)

```hlsl
// LPV 在 3D 网格中使用球谐函数
struct LPVCell
{
    float4 SH_R;  // 红色通道 SH 系数
    float4 SH_G;  // 绿色通道 SH 系数
    float4 SH_B;  // 蓝色通道 SH 系数
};

RWStructuredBuffer<LPVCell> lpvGrid;
RWStructuredBuffer<LPVCell> lpvGridNext;

// 从 RSM（反射阴影贴图）注入光到 LPV
[numthreads(8, 8, 1)]
void InjectLightFromRSM(uint3 id : SV_DispatchThreadID)
{
    // 采样 RSM
    float2 rsmUV = float2(id.xy) / float2(RSM_SIZE, RSM_SIZE);
    float3 flux = rsmFlux.Sample(samplerLinear, rsmUV).rgb;
    float3 normal = rsmNormal.Sample(samplerLinear, rsmUV).rgb * 2.0 - 1.0;
    float3 worldPos = rsmPosition.Sample(samplerLinear, rsmUV).rgb;

    // 将世界位置转换为 LPV 单元格
    int3 cell = WorldToLPVCell(worldPos);
    if (any(cell < 0) || any(cell >= LPV_SIZE))
        return;

    // 将通量转换为 SH 并注入
    float4 sh = DirectionToSH(normal);

    int cellIndex = cell.x + cell.y * LPV_SIZE + cell.z * LPV_SIZE * LPV_SIZE;

    // 原子加到 SH 系数
    InterlockedAdd(lpvGrid[cellIndex].SH_R, flux.r * sh);
    InterlockedAdd(lpvGrid[cellIndex].SH_G, flux.g * sh);
    InterlockedAdd(lpvGrid[cellIndex].SH_B, flux.b * sh);
}

// 通过 LPV 传播光
[numthreads(4, 4, 4)]
void PropagateLPV(uint3 id : SV_DispatchThreadID)
{
    int3 cell = int3(id);
    if (any(cell < 0) || any(cell >= LPV_SIZE))
        return;

    int cellIndex = cell.x + cell.y * LPV_SIZE + cell.z * LPV_SIZE * LPV_SIZE;

    LPVCell newCell = (LPVCell)0;

    // 累加来自 6 个邻居的贡献
    int3 neighbors[6] = {
        int3(-1, 0, 0), int3(1, 0, 0),
        int3(0, -1, 0), int3(0, 1, 0),
        int3(0, 0, -1), int3(0, 0, 1)
    };

    float3 faceNormals[6] = {
        float3(1, 0, 0), float3(-1, 0, 0),
        float3(0, 1, 0), float3(0, -1, 0),
        float3(0, 0, 1), float3(0, 0, -1)
    };

    for (int i = 0; i < 6; i++)
    {
        int3 neighborCell = cell + neighbors[i];
        if (any(neighborCell < 0) || any(neighborCell >= LPV_SIZE))
            continue;

        int neighborIndex = neighborCell.x + neighborCell.y * LPV_SIZE +
                           neighborCell.z * LPV_SIZE * LPV_SIZE;

        LPVCell neighbor = lpvGrid[neighborIndex];

        // 在传播方向上计算 SH
        float4 sh = DirectionToSH(-faceNormals[i]);
        float solidAngle = 0.4006696846f; // 面立体角

        newCell.SH_R += EvaluateSH4(neighbor.SH_R, sh) * solidAngle * DirectionToSH(faceNormals[i]);
        newCell.SH_G += EvaluateSH4(neighbor.SH_G, sh) * solidAngle * DirectionToSH(faceNormals[i]);
        newCell.SH_B += EvaluateSH4(neighbor.SH_B, sh) * solidAngle * DirectionToSH(faceNormals[i]);
    }

    lpvGridNext[cellIndex] = newCell;
}

// 采样 LPV 获取间接光照
float3 SampleLPV(float3 worldPos, float3 normal)
{
    int3 cell = WorldToLPVCell(worldPos);
    if (any(cell < 0) || any(cell >= LPV_SIZE - 1))
        return float3(0, 0, 0);

    // 三线性插值
    float3 cellPos = WorldToLPVCellFloat(worldPos);
    float3 frac = frac(cellPos);

    float3 result = float3(0, 0, 0);
    float4 sh = DirectionToSH(normal);

    for (int z = 0; z <= 1; z++)
    for (int y = 0; y <= 1; y++)
    for (int x = 0; x <= 1; x++)
    {
        int3 c = cell + int3(x, y, z);
        int idx = c.x + c.y * LPV_SIZE + c.z * LPV_SIZE * LPV_SIZE;

        float w = (x ? frac.x : 1 - frac.x) *
                  (y ? frac.y : 1 - frac.y) *
                  (z ? frac.z : 1 - frac.z);

        result.r += EvaluateSH4(lpvGrid[idx].SH_R, sh) * w;
        result.g += EvaluateSH4(lpvGrid[idx].SH_G, sh) * w;
        result.b += EvaluateSH4(lpvGrid[idx].SH_B, sh) * w;
    }

    return max(result, 0);
}
```

### 实时光线追踪 GI (RTX)

```hlsl
// DXR 光线生成着色器
[shader("raygeneration")]
void RayGenGI()
{
    uint2 launchIndex = DispatchRaysIndex().xy;
    uint2 launchDim = DispatchRaysDimensions().xy;

    // 获取 G-buffer 数据
    float2 uv = (float2(launchIndex) + 0.5) / float2(launchDim);
    float3 worldPos = gPosition.SampleLevel(samplerPoint, uv, 0).xyz;
    float3 normal = gNormal.SampleLevel(samplerPoint, uv, 0).xyz;
    float3 albedo = gAlbedo.SampleLevel(samplerPoint, uv, 0).xyz;

    if (length(normal) < 0.5)  // 天空像素
    {
        outputGI[launchIndex] = float4(0, 0, 0, 1);
        return;
    }

    float3 indirectLight = float3(0, 0, 0);
    const int numSamples = 4;

    for (int i = 0; i < numSamples; i++)
    {
        // 在半球内生成随机方向
        uint seed = launchIndex.x + launchIndex.y * launchDim.x + frameIndex * 1000 + i;
        float2 xi = float2(RandomFloat(seed), RandomFloat(seed + 1));
        float3 sampleDir = CosineWeightedHemisphere(normal, xi);

        // 设置光线
        RayDesc ray;
        ray.Origin = worldPos + normal * 0.001;
        ray.Direction = sampleDir;
        ray.TMin = 0.001;
        ray.TMax = 100.0;

        // 追踪光线
        GIPayload payload;
        payload.color = float3(0, 0, 0);
        payload.hitDistance = 100.0;

        TraceRay(
            accelerationStructure,
            RAY_FLAG_CULL_BACK_FACING_TRIANGLES,
            0xFF,
            0,  // 命中组索引
            1,  // 几何索引乘数
            0,  // 未命中着色器索引
            ray,
            payload
        );

        indirectLight += payload.color;
    }

    indirectLight /= numSamples;
    indirectLight *= albedo / PI;

    // 时间累积
    float3 history = historyBuffer[launchIndex].rgb;
    float3 result = lerp(history, indirectLight, 0.1);

    outputGI[launchIndex] = float4(result, 1);
}

// 最近命中着色器
[shader("closesthit")]
void ClosestHitGI(inout GIPayload payload, in BuiltInTriangleIntersectionAttributes attr)
{
    // 获取三角形数据
    uint primitiveIndex = PrimitiveIndex();
    uint3 indices = GetIndices(primitiveIndex);

    float3 barycentrics = float3(1 - attr.barycentrics.x - attr.barycentrics.y,
                                  attr.barycentrics.x, attr.barycentrics.y);

    // 插值顶点属性
    float3 normal = InterpolateNormal(indices, barycentrics);
    float2 uv = InterpolateUV(indices, barycentrics);

    // 采样材质
    float3 albedo = albedoTexture.SampleLevel(samplerLinear, uv, 0).rgb;
    float3 emission = emissionTexture.SampleLevel(samplerLinear, uv, 0).rgb;

    // 命中点的直接光照
    float3 hitPos = WorldRayOrigin() + WorldRayDirection() * RayTCurrent();
    float3 directLight = ComputeDirectLighting(hitPos, normal);

    payload.color = emission + directLight * albedo;
    payload.hitDistance = RayTCurrent();
}

// 未命中着色器
[shader("miss")]
void MissGI(inout GIPayload payload)
{
    float3 dir = WorldRayDirection();
    payload.color = SampleEnvironment(dir);
    payload.hitDistance = 100.0;
}
```

## 最佳实践

### 1. 平衡质量与性能

```hlsl
// 基于方差的自适应采样
float3 AdaptiveGISampling(float3 worldPos, float3 normal, int maxSamples)
{
    float3 sum = float3(0, 0, 0);
    float3 sumSquared = float3(0, 0, 0);

    int samplesUsed = 0;

    for (int i = 0; i < maxSamples; i++)
    {
        float3 sample = TraceSingleGISample(worldPos, normal, i);

        sum += sample;
        sumSquared += sample * sample;
        samplesUsed++;

        // 如果方差足够低则提前退出
        if (i >= 4)
        {
            float3 mean = sum / samplesUsed;
            float3 variance = (sumSquared / samplesUsed) - mean * mean;
            float maxVariance = max(variance.r, max(variance.g, variance.b));

            if (maxVariance < VARIANCE_THRESHOLD)
                break;
        }
    }

    return sum / samplesUsed;
}
```

### 2. 使用时间累积

```hlsl
// GI 的时间重投影
float3 TemporalAccumulateGI(float2 uv, float3 currentGI, float3 worldPos)
{
    // 重投影到上一帧
    float4 prevClip = mul(prevViewProj, float4(worldPos, 1.0));
    float2 prevUV = prevClip.xy / prevClip.w * 0.5 + 0.5;

    // 检查重投影是否有效
    bool valid = all(prevUV >= 0 && prevUV <= 1);

    // 检查深度相似性
    float currentDepth = depthBuffer.Sample(samplerPoint, uv).r;
    float prevDepth = prevDepthBuffer.Sample(samplerPoint, prevUV).r;
    valid = valid && abs(currentDepth - prevDepth) < 0.01;

    if (valid)
    {
        float3 history = historyBuffer.Sample(samplerLinear, prevUV).rgb;

        // 将历史值限制在邻域内以防止鬼影
        float3 neighborhood[9];
        GatherNeighborhood(uv, neighborhood);
        float3 minColor = min(neighborhood[0], min(neighborhood[1], /* ... */));
        float3 maxColor = max(neighborhood[0], max(neighborhood[1], /* ... */));
        history = clamp(history, minColor, maxColor);

        return lerp(history, currentGI, 0.05);
    }

    return currentGI;
}
```

### 3. LOD 和基于距离的质量

```hlsl
float3 DistanceBasedGI(float3 worldPos, float3 normal, float cameraDistance)
{
    // 近处: 完整光线追踪 GI
    if (cameraDistance < 20.0)
    {
        return RayTracedGI(worldPos, normal, 8);  // 8 个采样
    }
    // 中等距离: 减少采样
    else if (cameraDistance < 50.0)
    {
        return RayTracedGI(worldPos, normal, 4);  // 4 个采样
    }
    // 远处: 只使用光照探针
    else
    {
        return SampleLightProbes(worldPos, normal);
    }
}
```

## 常见陷阱

### 陷阱 1: 光线泄漏

```hlsl
// 不好: 没有偏移导致自相交
Ray ray;
ray.Origin = hitPosition;  // 可能再次命中同一表面!

// 好: 沿法线应用偏移
Ray ray;
ray.Origin = hitPosition + hitNormal * 0.001;
```

### 陷阱 2: 能量守恒违规

```hlsl
// 不好: 不能量守恒的 BRDF
float3 brdf = albedo;  // 不是能量守恒的!

// 好: 正确归一化的 BRDF
float3 diffuseBRDF = albedo / PI;
float3 specularBRDF = /* ... 正确计算的 Cook-Torrance ... */;
float3 brdf = diffuseBRDF * (1 - fresnel) + specularBRDF;
```

### 陷阱 3: 路径追踪中的萤火虫

```hlsl
// 不好: 没有限制允许萤火虫
float3 sample = radiance / pdf;

// 好: 限制贡献以防止萤火虫
float3 sample = radiance / max(pdf, 0.001);
sample = min(sample, MAX_CONTRIBUTION);  // 限制非常亮的采样
```

## 性能考量

### GI 技术比较

| 技术 | 质量 | 性能 | 动态 | 内存 |
|------|------|------|------|------|
| 烘焙光照贴图 | 优秀 | 非常快 | 否 | 高 |
| 光照探针/SH | 良好 | 快 | 有限 | 低 |
| SSGI | 中等 | 中等 | 是 | 低 |
| 体素锥追踪 | 良好 | 中等 | 是 | 高 |
| LPV | 中等 | 中等 | 是 | 中等 |
| RTGI (RTX) | 优秀 | 慢 | 是 | 中等 |

### 优化策略

1. **混合方法**: 结合烘焙和实时 GI
2. **异步计算**: 在异步计算队列上运行 GI
3. **分辨率缩放**: 以较低分辨率计算 GI
4. **时间分散**: 将采样分散到多帧
5. **重要性采样**: 将光线集中在重要的地方

## 面试要点

### 常见面试问题

**Q1: 直接光照和间接光照有什么区别？**

直接光照是光线直接从光源传播到表面的光。间接光照（全局光照）是在到达观察者之前已经从至少一个表面反弹的光，包括颜色溢出、环境光遮蔽和焦散等效果。

**Q2: 解释渲染方程。**

渲染方程描述了光线如何在场景中分布。它指出，从一点出射的光等于发射光加上所有入射光乘以 BRDF 和余弦项在半球上的积分。

**Q3: 什么是重要性采样，为什么它对路径追踪很重要？**

重要性采样是一种方差减少技术，它在被积函数较大的方向上更频繁地采样。对于路径追踪，根据 BRDF 或光分布进行采样可以显著减少噪声，相比均匀采样。

**Q4: 比较不同的实时 GI 技术。**

- **光照探针/SH**: 快但静态，适合漫反射
- **SSGI**: 仅屏幕空间，会错过屏幕外的物体
- **VCT**: 质量好，内存使用高
- **LPV**: 适合大规模漫反射，质量较低
- **RTGI**: 最佳质量，需要 RT 硬件

**Q5: 如何处理 GI 中的光线泄漏？**

使用正确的光线偏移，实现阴影光线，使用几何感知过滤，采用稳健的遮挡测试，并考虑使用有符号距离场以获得更好的遮挡。

## 延伸阅读

### 学术论文

- "The Rendering Equation" - James Kajiya (1986)
- "Global Illumination Compendium" - Philip Dutre
- "Real-Time Global Illumination using Precomputed Light Field Probes"
- "Interactive Indirect Illumination Using Voxel Cone Tracing"
- "Light Propagation Volumes in CryEngine 3"

### 书籍

- "Physically Based Rendering" - Pharr, Jakob, 和 Humphreys
- "Real-Time Rendering, 4th Edition"
- "Advanced Global Illumination"

### 引擎文档

- Unity 高清渲染管线 GI
- Unreal Engine Lumen GI
- NVIDIA RTX 全局光照

### 在线资源

- GPU Gems (NVIDIA)
- Advances in Real-Time Rendering (SIGGRAPH)
- Ray Tracing Gems
