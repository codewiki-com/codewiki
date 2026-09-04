---
title: HLSL/GLSL 着色器基础
description: 着色器编程综合指南，涵盖 HLSL 和 GLSL 语法、顶点和片段着色器、uniform 变量、varying 变量以及实用渲染技术
track: gamedev
section: graphics
difficulty: intermediate
tags:
  - shaders
  - HLSL
  - GLSL
  - graphics programming
  - GPU
  - rendering
status: imported
origin: old/src/content/docs/gamedev/shader-fundamentals.zh.md
divergence: 0.224
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: GameDev
  subcategory: ""
  order: 50
  lastUpdated: 2026-01-21
---

着色器是运行在 GPU 上的程序，用于变换顶点和着色像素，最终生成我们在屏幕上看到的视觉输出。理解着色器编程对于任何图形程序员都是必不可少的，无论你是创建风格化效果、优化渲染性能，还是实现自定义光照模型。本指南涵盖 HLSL（High-Level Shading Language，高级着色语言，用于 DirectX 和 Unity）和 GLSL（OpenGL Shading Language，OpenGL 着色语言，用于 OpenGL 和 Vulkan），为着色器开发提供坚实的基础。

---

## 概念解释

### 什么是着色器？

着色器是在 GPU（图形处理单元）上以大规模并行方式执行的小型程序。与通常顺序运行的 CPU 程序不同，着色器可以同时处理数千个顶点或像素，使其在图形操作方面极其高效。

"着色器"一词最初指的是计算着色（光影）的程序，但现代着色器处理的内容要多得多：几何变换、纹理映射、后处理效果，甚至通用计算。

### 图形管线

理解着色器在图形管线中的位置至关重要：

```
[应用程序] -> [顶点着色器] -> [曲面细分*] -> [几何着色器*]
     -> [光栅化] -> [片段/像素着色器] -> [输出合并] -> [帧缓冲区]

* 可选阶段
```

**关键阶段：**
1. **顶点着色器**：处理每个顶点，变换位置并将数据传递给后续阶段
2. **曲面细分着色器**（可选）：细分几何体以增加细节
3. **几何着色器**（可选）：可以创建或销毁几何体
4. **光栅化**：将几何体转换为片段（潜在像素）
5. **片段/像素着色器**：确定每个像素的最终颜色

### HLSL 与 GLSL 对比

| 方面 | HLSL | GLSL |
|--------|------|------|
| **平台** | DirectX、Xbox、Unity | OpenGL、Vulkan、WebGL |
| **入口点** | 命名函数（如 `VSMain`） | 始终是 `main()` |
| **语义** | 必需的（`: POSITION`） | 布局限定符 |
| **矩阵顺序** | 默认行主序 | 列主序 |
| **纹理采样** | `texture.Sample(sampler, uv)` | `texture(sampler, uv)` |
| **向量分量重排** | `.xyzw` 或 `.rgba` | 相同 |

---

## 核心原理

### 着色器数据类型

两种语言共享相似的基本数据类型：

**HLSL：**
```hlsl
// 标量类型
float  f = 1.0;      // 32位浮点数
half   h = 1.0h;     // 16位浮点数（移动端优化）
int    i = 1;        // 32位有符号整数
uint   u = 1u;       // 32位无符号整数
bool   b = true;     // 布尔值

// 向量类型
float2 v2 = float2(1.0, 2.0);
float3 v3 = float3(1.0, 2.0, 3.0);
float4 v4 = float4(1.0, 2.0, 3.0, 4.0);

// 矩阵类型
float3x3 mat3;       // 3x3 矩阵
float4x4 mat4;       // 4x4 矩阵

// 分量重排（Swizzling）- 访问和重新排列分量
float3 rgb = v4.rgb;           // 提取前3个分量
float2 yx = v2.yx;             // 交换分量
float4 xxxx = v4.xxxx;         // 复制单个分量
```

**GLSL：**
```glsl
// 标量类型
float f = 1.0;       // 32位浮点数
int   i = 1;         // 32位有符号整数
uint  u = 1u;        // 32位无符号整数
bool  b = true;      // 布尔值

// 向量类型
vec2 v2 = vec2(1.0, 2.0);
vec3 v3 = vec3(1.0, 2.0, 3.0);
vec4 v4 = vec4(1.0, 2.0, 3.0, 4.0);

// 整数向量
ivec3 iv = ivec3(1, 2, 3);
uvec4 uv = uvec4(1u, 2u, 3u, 4u);

// 矩阵类型
mat3 m3;             // 3x3 矩阵
mat4 m4;             // 4x4 矩阵

// 分量重排的工作方式相同
vec3 rgb = v4.rgb;
vec2 yx = v2.yx;
```

### 坐标空间和变换

顶点经过多个坐标空间：

```
对象空间 -> 世界空间 -> 视图空间 -> 裁剪空间 -> NDC -> 屏幕空间
     |              |             |             |
   模型          视图（相机）   投影        透视
   矩阵           矩阵        矩阵        除法
```

**标准变换（HLSL）：**
```hlsl
cbuffer TransformBuffer : register(b0)
{
    float4x4 WorldMatrix;
    float4x4 ViewMatrix;
    float4x4 ProjectionMatrix;
    float4x4 WorldViewProjection; // 预乘以提高效率
};

struct VSInput
{
    float3 Position : POSITION;
    float3 Normal   : NORMAL;
    float2 TexCoord : TEXCOORD0;
};

struct VSOutput
{
    float4 Position      : SV_POSITION;  // 裁剪空间位置
    float3 WorldPosition : TEXCOORD0;    // 用于光照计算
    float3 WorldNormal   : TEXCOORD1;
    float2 TexCoord      : TEXCOORD2;
};

VSOutput VSMain(VSInput input)
{
    VSOutput output;

    // 变换到裁剪空间
    output.Position = mul(float4(input.Position, 1.0), WorldViewProjection);

    // 变换到世界空间用于光照
    output.WorldPosition = mul(float4(input.Position, 1.0), WorldMatrix).xyz;

    // 变换法线（非均匀缩放时使用逆转置）
    output.WorldNormal = normalize(mul(input.Normal, (float3x3)WorldMatrix));

    output.TexCoord = input.TexCoord;

    return output;
}
```

**标准变换（GLSL）：**
```glsl
#version 450

layout(binding = 0) uniform TransformUBO {
    mat4 model;
    mat4 view;
    mat4 projection;
    mat4 mvp;
} ubo;

layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec3 inNormal;
layout(location = 2) in vec2 inTexCoord;

layout(location = 0) out vec3 fragWorldPos;
layout(location = 1) out vec3 fragNormal;
layout(location = 2) out vec2 fragTexCoord;

void main()
{
    // 变换到裁剪空间
    gl_Position = ubo.mvp * vec4(inPosition, 1.0);

    // 变换到世界空间
    fragWorldPos = (ubo.model * vec4(inPosition, 1.0)).xyz;

    // 变换法线
    fragNormal = normalize(mat3(ubo.model) * inNormal);

    fragTexCoord = inTexCoord;
}
```

---

## 关键概念

### Uniform 和常量缓冲区

Uniform 是在一次绘制调用中所有着色器调用中保持不变的值。

**HLSL 常量缓冲区：**
```hlsl
// 常量缓冲区 - 每帧更新一次
cbuffer PerFrameData : register(b0)
{
    float4x4 ViewProjection;
    float3   CameraPosition;
    float    Time;
    float3   AmbientLight;
    float    DeltaTime;
};

// 常量缓冲区 - 每个对象更新
cbuffer PerObjectData : register(b1)
{
    float4x4 WorldMatrix;
    float4   ObjectColor;
    float    Roughness;
    float    Metallic;
    float2   Padding; // 对齐到16字节
};

// 结构化缓冲区用于多个对象（SRV）
StructuredBuffer<float4x4> InstanceTransforms : register(t0);
```

**GLSL Uniform 缓冲区：**
```glsl
#version 450

// Uniform 缓冲对象
layout(std140, binding = 0) uniform PerFrameData
{
    mat4 viewProjection;
    vec3 cameraPosition;
    float time;
    vec3 ambientLight;
    float deltaTime;
};

layout(std140, binding = 1) uniform PerObjectData
{
    mat4 worldMatrix;
    vec4 objectColor;
    float roughness;
    float metallic;
    vec2 padding;
};

// 存储缓冲区用于多个对象
layout(std430, binding = 2) readonly buffer InstanceData
{
    mat4 instanceTransforms[];
};
```

### 纹理采样

**HLSL 纹理采样：**
```hlsl
// 纹理声明
Texture2D<float4> AlbedoTexture : register(t0);
Texture2D<float3> NormalTexture : register(t1);
Texture2D<float>  RoughnessTexture : register(t2);
TextureCube<float4> EnvironmentMap : register(t3);

// 采样器状态
SamplerState LinearSampler : register(s0);
SamplerState PointSampler : register(s1);
SamplerComparisonState ShadowSampler : register(s2);

float4 PSMain(VSOutput input) : SV_TARGET
{
    // 基本纹理采样
    float4 albedo = AlbedoTexture.Sample(LinearSampler, input.TexCoord);

    // 使用显式 LOD 采样
    float4 albedoLod = AlbedoTexture.SampleLevel(LinearSampler, input.TexCoord, 2.0);

    // 使用梯度采样（用于各向异性过滤）
    float2 ddxUV = ddx(input.TexCoord);
    float2 ddyUV = ddy(input.TexCoord);
    float4 albedoGrad = AlbedoTexture.SampleGrad(LinearSampler, input.TexCoord, ddxUV, ddyUV);

    // 立方体贴图采样
    float3 reflectDir = reflect(-viewDir, normal);
    float4 envColor = EnvironmentMap.Sample(LinearSampler, reflectDir);

    // 带比较的阴影贴图采样
    float shadow = ShadowMap.SampleCmpLevelZero(ShadowSampler, shadowUV, depth);

    return albedo;
}
```

**GLSL 纹理采样：**
```glsl
#version 450

layout(binding = 0) uniform sampler2D albedoTexture;
layout(binding = 1) uniform sampler2D normalTexture;
layout(binding = 2) uniform sampler2D roughnessTexture;
layout(binding = 3) uniform samplerCube environmentMap;
layout(binding = 4) uniform sampler2DShadow shadowMap;

layout(location = 0) in vec2 fragTexCoord;
layout(location = 0) out vec4 outColor;

void main()
{
    // 基本纹理采样
    vec4 albedo = texture(albedoTexture, fragTexCoord);

    // 使用显式 LOD 采样
    vec4 albedoLod = textureLod(albedoTexture, fragTexCoord, 2.0);

    // 使用梯度采样
    vec2 dxUV = dFdx(fragTexCoord);
    vec2 dyUV = dFdy(fragTexCoord);
    vec4 albedoGrad = textureGrad(albedoTexture, fragTexCoord, dxUV, dyUV);

    // 立方体贴图采样
    vec3 reflectDir = reflect(-viewDir, normal);
    vec4 envColor = texture(environmentMap, reflectDir);

    // 阴影贴图采样（返回比较结果）
    vec3 shadowCoord = vec3(shadowUV, depth);
    float shadow = texture(shadowMap, shadowCoord);

    outColor = albedo;
}
```

### 输入/输出语义

**HLSL 语义：**
```hlsl
// 顶点着色器输入语义
struct VSInput
{
    float3 Position  : POSITION;      // 顶点位置
    float3 Normal    : NORMAL;        // 顶点法线
    float4 Tangent   : TANGENT;       // 切线（w = 手性）
    float2 TexCoord0 : TEXCOORD0;     // 主 UV
    float2 TexCoord1 : TEXCOORD1;     // 光照贴图 UV
    float4 Color     : COLOR0;        // 顶点颜色
    uint   VertexID  : SV_VertexID;   // 系统生成的顶点索引
    uint   InstanceID: SV_InstanceID; // 实例化的实例索引
};

// 顶点着色器输出 / 像素着色器输入
struct VSOutput
{
    float4 Position  : SV_POSITION;   // 必需：裁剪空间位置
    float3 WorldPos  : TEXCOORD0;     // 自定义插值数据
    float3 Normal    : TEXCOORD1;
    float2 TexCoord  : TEXCOORD2;
    float4 Color     : COLOR0;

    // 插值修饰符
    nointerpolation uint MaterialID : TEXCOORD3;  // 平面（无插值）
    centroid float2 CentroidUV : TEXCOORD4;       // 中心采样
};

// 像素着色器输出
struct PSOutput
{
    float4 Color  : SV_TARGET0;       // 渲染目标 0
    float4 Normal : SV_TARGET1;       // 渲染目标 1（用于延迟渲染）
    float  Depth  : SV_DEPTH;         // 自定义深度输出（可选）
};
```

**GLSL 布局限定符：**
```glsl
#version 450

// 顶点着色器输入
layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec3 inNormal;
layout(location = 2) in vec4 inTangent;
layout(location = 3) in vec2 inTexCoord0;
layout(location = 4) in vec2 inTexCoord1;
layout(location = 5) in vec4 inColor;

// 顶点着色器输出
layout(location = 0) out vec3 fragWorldPos;
layout(location = 1) out vec3 fragNormal;
layout(location = 2) out vec2 fragTexCoord;
layout(location = 3) flat out uint fragMaterialID;  // 无插值

// 内置变量
// gl_VertexIndex   - 顶点索引
// gl_InstanceIndex - 实例索引
// gl_Position      - 输出裁剪位置

// 片段着色器输出
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 outNormal;
// gl_FragDepth     - 输出深度（可选）
```

---

## 代码示例

### 基本光照着色器（HLSL）

```hlsl
// Common.hlsli - 共享定义
#ifndef COMMON_HLSLI
#define COMMON_HLSLI

#define PI 3.14159265359
#define INV_PI 0.31830988618

cbuffer PerFrame : register(b0)
{
    float4x4 ViewProjection;
    float3 CameraPosition;
    float Time;
    float3 LightDirection;
    float LightIntensity;
    float3 LightColor;
    float AmbientIntensity;
};

cbuffer PerObject : register(b1)
{
    float4x4 World;
    float4x4 WorldInverseTranspose;
};

struct Light
{
    float3 direction;
    float3 color;
    float intensity;
};

float3 FresnelSchlick(float cosTheta, float3 F0)
{
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

#endif // COMMON_HLSLI
```

```hlsl
// LitShader.hlsl
#include "Common.hlsli"

Texture2D<float4> AlbedoMap : register(t0);
Texture2D<float3> NormalMap : register(t1);
SamplerState LinearSampler : register(s0);

struct VSInput
{
    float3 Position : POSITION;
    float3 Normal   : NORMAL;
    float4 Tangent  : TANGENT;
    float2 TexCoord : TEXCOORD0;
};

struct PSInput
{
    float4 Position    : SV_POSITION;
    float3 WorldPos    : TEXCOORD0;
    float3 Normal      : TEXCOORD1;
    float3 Tangent     : TEXCOORD2;
    float3 Bitangent   : TEXCOORD3;
    float2 TexCoord    : TEXCOORD4;
};

PSInput VSMain(VSInput input)
{
    PSInput output;

    float4 worldPos = mul(float4(input.Position, 1.0), World);
    output.Position = mul(worldPos, ViewProjection);
    output.WorldPos = worldPos.xyz;

    // 将 TBN 基变换到世界空间
    output.Normal = normalize(mul(input.Normal, (float3x3)WorldInverseTranspose));
    output.Tangent = normalize(mul(input.Tangent.xyz, (float3x3)World));
    output.Bitangent = cross(output.Normal, output.Tangent) * input.Tangent.w;

    output.TexCoord = input.TexCoord;

    return output;
}

float4 PSMain(PSInput input) : SV_TARGET
{
    // 采样纹理
    float4 albedo = AlbedoMap.Sample(LinearSampler, input.TexCoord);
    float3 normalSample = NormalMap.Sample(LinearSampler, input.TexCoord);

    // 将法线从 [0,1] 解包到 [-1,1]
    float3 normalTS = normalSample * 2.0 - 1.0;

    // 构建 TBN 矩阵并将法线变换到世界空间
    float3x3 TBN = float3x3(
        normalize(input.Tangent),
        normalize(input.Bitangent),
        normalize(input.Normal)
    );
    float3 N = normalize(mul(normalTS, TBN));

    // 光照计算
    float3 L = normalize(-LightDirection);
    float3 V = normalize(CameraPosition - input.WorldPos);
    float3 H = normalize(L + V);

    // 漫反射（Lambert）
    float NdotL = max(dot(N, L), 0.0);
    float3 diffuse = albedo.rgb * NdotL * LightColor * LightIntensity;

    // 镜面反射（Blinn-Phong）
    float NdotH = max(dot(N, H), 0.0);
    float specular = pow(NdotH, 32.0) * LightIntensity;

    // 菲涅尔
    float3 F0 = float3(0.04, 0.04, 0.04);
    float3 fresnel = FresnelSchlick(max(dot(H, V), 0.0), F0);

    // 环境光
    float3 ambient = albedo.rgb * AmbientIntensity;

    // 最终颜色
    float3 color = ambient + diffuse + specular * fresnel;

    return float4(color, albedo.a);
}
```

### 基本光照着色器（GLSL）

```glsl
// vertex_shader.glsl
#version 450

layout(std140, binding = 0) uniform PerFrame
{
    mat4 viewProjection;
    vec3 cameraPosition;
    float time;
    vec3 lightDirection;
    float lightIntensity;
    vec3 lightColor;
    float ambientIntensity;
};

layout(std140, binding = 1) uniform PerObject
{
    mat4 world;
    mat4 worldInverseTranspose;
};

layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec3 inNormal;
layout(location = 2) in vec4 inTangent;
layout(location = 3) in vec2 inTexCoord;

layout(location = 0) out vec3 fragWorldPos;
layout(location = 1) out vec3 fragNormal;
layout(location = 2) out vec3 fragTangent;
layout(location = 3) out vec3 fragBitangent;
layout(location = 4) out vec2 fragTexCoord;

void main()
{
    vec4 worldPos = world * vec4(inPosition, 1.0);
    gl_Position = viewProjection * worldPos;
    fragWorldPos = worldPos.xyz;

    // 变换 TBN 基
    fragNormal = normalize(mat3(worldInverseTranspose) * inNormal);
    fragTangent = normalize(mat3(world) * inTangent.xyz);
    fragBitangent = cross(fragNormal, fragTangent) * inTangent.w;

    fragTexCoord = inTexCoord;
}
```

```glsl
// fragment_shader.glsl
#version 450

const float PI = 3.14159265359;

layout(std140, binding = 0) uniform PerFrame
{
    mat4 viewProjection;
    vec3 cameraPosition;
    float time;
    vec3 lightDirection;
    float lightIntensity;
    vec3 lightColor;
    float ambientIntensity;
};

layout(binding = 2) uniform sampler2D albedoMap;
layout(binding = 3) uniform sampler2D normalMap;

layout(location = 0) in vec3 fragWorldPos;
layout(location = 1) in vec3 fragNormal;
layout(location = 2) in vec3 fragTangent;
layout(location = 3) in vec3 fragBitangent;
layout(location = 4) in vec2 fragTexCoord;

layout(location = 0) out vec4 outColor;

vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

void main()
{
    // 采样纹理
    vec4 albedo = texture(albedoMap, fragTexCoord);
    vec3 normalSample = texture(normalMap, fragTexCoord).rgb;

    // 解包法线
    vec3 normalTS = normalSample * 2.0 - 1.0;

    // TBN 矩阵
    mat3 TBN = mat3(
        normalize(fragTangent),
        normalize(fragBitangent),
        normalize(fragNormal)
    );
    vec3 N = normalize(TBN * normalTS);

    // 光照
    vec3 L = normalize(-lightDirection);
    vec3 V = normalize(cameraPosition - fragWorldPos);
    vec3 H = normalize(L + V);

    // 漫反射
    float NdotL = max(dot(N, L), 0.0);
    vec3 diffuse = albedo.rgb * NdotL * lightColor * lightIntensity;

    // 镜面反射
    float NdotH = max(dot(N, H), 0.0);
    float specular = pow(NdotH, 32.0) * lightIntensity;

    // 菲涅尔
    vec3 F0 = vec3(0.04);
    vec3 fresnel = fresnelSchlick(max(dot(H, V), 0.0), F0);

    // 环境光
    vec3 ambient = albedo.rgb * ambientIntensity;

    // 最终颜色
    vec3 color = ambient + diffuse + specular * fresnel;

    outColor = vec4(color, albedo.a);
}
```

### 动画水面着色器

```hlsl
// WaterShader.hlsl - 风格化水面与顶点动画
cbuffer WaterParams : register(b2)
{
    float4 WaveParams;    // x: 振幅, y: 频率, z: 速度, w: 陡度
    float4 WaveDirection; // xy: 方向1, zw: 方向2
    float4 WaterColor;
    float4 FoamColor;
    float Time;
    float3 Padding;
};

struct VSInput
{
    float3 Position : POSITION;
    float2 TexCoord : TEXCOORD0;
};

struct PSInput
{
    float4 Position : SV_POSITION;
    float3 WorldPos : TEXCOORD0;
    float3 Normal   : TEXCOORD1;
    float2 TexCoord : TEXCOORD2;
    float  Height   : TEXCOORD3;
};

// Gerstner 波函数用于真实的水波效果
float3 GerstnerWave(float2 position, float2 direction, float steepness,
                    float wavelength, float time, inout float3 tangent, inout float3 binormal)
{
    float k = 2.0 * PI / wavelength;
    float c = sqrt(9.8 / k);
    float2 d = normalize(direction);
    float f = k * (dot(d, position) - c * time);
    float a = steepness / k;

    tangent += float3(
        -d.x * d.x * steepness * sin(f),
        d.x * steepness * cos(f),
        -d.x * d.y * steepness * sin(f)
    );

    binormal += float3(
        -d.x * d.y * steepness * sin(f),
        d.y * steepness * cos(f),
        -d.y * d.y * steepness * sin(f)
    );

    return float3(
        d.x * a * cos(f),
        a * sin(f),
        d.y * a * cos(f)
    );
}

PSInput VSMain(VSInput input)
{
    PSInput output;

    float3 position = input.Position;
    float3 tangent = float3(1, 0, 0);
    float3 binormal = float3(0, 0, 1);

    // 应用多个 Gerstner 波
    float3 wave1 = GerstnerWave(position.xz, WaveDirection.xy,
                                 WaveParams.w, 10.0, Time * WaveParams.z, tangent, binormal);
    float3 wave2 = GerstnerWave(position.xz, WaveDirection.zw,
                                 WaveParams.w * 0.5, 5.0, Time * WaveParams.z * 1.3, tangent, binormal);
    float3 wave3 = GerstnerWave(position.xz, float2(0.5, 0.5),
                                 WaveParams.w * 0.25, 2.0, Time * WaveParams.z * 1.7, tangent, binormal);

    position += (wave1 + wave2 + wave3) * WaveParams.x;

    // 从切线和副法线计算法线
    float3 normal = normalize(cross(binormal, tangent));

    float4 worldPos = mul(float4(position, 1.0), World);
    output.Position = mul(worldPos, ViewProjection);
    output.WorldPos = worldPos.xyz;
    output.Normal = normal;
    output.TexCoord = input.TexCoord;
    output.Height = position.y;

    return output;
}

float4 PSMain(PSInput input) : SV_TARGET
{
    float3 N = normalize(input.Normal);
    float3 V = normalize(CameraPosition - input.WorldPos);
    float3 L = normalize(-LightDirection);

    // 用于水面反射/折射混合的菲涅尔
    float fresnel = pow(1.0 - saturate(dot(N, V)), 3.0);

    // 简单反射（生产环境中会使用立方体贴图）
    float3 R = reflect(-V, N);
    float3 skyColor = lerp(float3(0.5, 0.7, 1.0), float3(0.1, 0.2, 0.4), R.y * 0.5 + 0.5);

    // 带深度渐变的水颜色
    float3 waterDeep = WaterColor.rgb * 0.5;
    float3 waterShallow = WaterColor.rgb;
    float3 water = lerp(waterDeep, waterShallow, saturate(input.Height * 0.5 + 0.5));

    // 镜面高光（太阳光斑）
    float3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 256.0) * 2.0;

    // 波峰处的泡沫
    float foam = smoothstep(0.3, 0.5, input.Height) * 0.5;

    // 组合
    float3 color = lerp(water, skyColor, fresnel * 0.5);
    color += spec * LightColor;
    color = lerp(color, FoamColor.rgb, foam);

    return float4(color, 0.9); // 略微透明
}
```

### 后处理着色器

```glsl
// post_process.glsl - 常见后处理效果
#version 450

layout(binding = 0) uniform sampler2D sceneTexture;
layout(binding = 1) uniform sampler2D depthTexture;

layout(std140, binding = 0) uniform PostProcessParams
{
    vec2 screenSize;
    float exposure;
    float gamma;
    float vignetteStrength;
    float chromaticAberration;
    float filmGrain;
    float time;
};

layout(location = 0) in vec2 fragTexCoord;
layout(location = 0) out vec4 outColor;

// ACES 电影色调映射
vec3 ACESFilm(vec3 x)
{
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// 胶片颗粒噪声
float random(vec2 co)
{
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main()
{
    vec2 uv = fragTexCoord;
    vec2 center = vec2(0.5);

    // 色差
    vec2 direction = uv - center;
    float dist = length(direction);
    vec2 offset = direction * chromaticAberration * dist * dist;

    vec3 color;
    color.r = texture(sceneTexture, uv + offset).r;
    color.g = texture(sceneTexture, uv).g;
    color.b = texture(sceneTexture, uv - offset).b;

    // 曝光
    color *= exposure;

    // 色调映射
    color = ACESFilm(color);

    // 暗角
    float vignette = 1.0 - dot(direction, direction) * vignetteStrength;
    color *= vignette;

    // 胶片颗粒
    float grain = random(uv + vec2(time)) * filmGrain;
    color += grain - filmGrain * 0.5;

    // 伽马校正
    color = pow(color, vec3(1.0 / gamma));

    outColor = vec4(color, 1.0);
}
```

---

## 最佳实践

### 1. 组织着色器代码

```hlsl
// 使用包含文件共享代码
#include "Common.hlsli"
#include "Lighting.hlsli"
#include "PBR.hlsli"

// 将相关常量分组
cbuffer MaterialProperties : register(b2)
{
    // 将相关数据打包在一起
    float3 BaseColor;
    float  Metallic;

    float3 EmissiveColor;
    float  Roughness;

    float3 SubsurfaceColor;
    float  SubsurfaceStrength;
};
```

### 2. 使用适当的精度

```hlsl
// HLSL - 对移动端使用最小精度提示
min16float4 color;  // 最小 16 位浮点精度
min10float depth;   // 最小 10 位浮点精度

// GLSL - 使用精度限定符
precision highp float;   // 顶点着色器默认
precision mediump float; // 移动端片段着色器
precision lowp float;    // 当范围 [-2, 2] 足够时
```

### 3. 谨慎分支

```hlsl
// 不好：基于变化数据的动态分支
if (input.TexCoord.x > 0.5)
{
    // 复杂操作 A
}
else
{
    // 复杂操作 B
}

// 好：尽可能使用条件赋值
float mask = step(0.5, input.TexCoord.x);
float3 result = lerp(operationB(), operationA(), mask);

// 可接受：基于 uniform 的分支（所有线程走相同路径）
if (EnableFeature)  // Uniform 值
{
    // 功能代码
}
```

### 4. 最小化寄存器压力

```hlsl
// 不好：一次计算所有内容
float3 normal = computeNormal();
float3 albedo = sampleAlbedo();
float roughness = sampleRoughness();
float metallic = sampleMetallic();
float ao = sampleAO();
// ... 然后使用所有这些

// 更好：分阶段计算和使用
// 阶段 1：基本几何
float3 normal = computeNormal();
float3 viewDir = normalize(CameraPosition - worldPos);

// 阶段 2：材质采样（重用寄存器）
float3 albedo = sampleAlbedo();
float3 diffuse = computeDiffuse(albedo, normal, lightDir);

// 阶段 3：镜面反射（albedo 寄存器已释放）
float roughness = sampleRoughness();
float3 specular = computeSpecular(normal, viewDir, lightDir, roughness);
```

---

## 常见陷阱

### 1. 矩阵乘法顺序

```hlsl
// HLSL 默认使用行主序，向量在左边相乘
float4 worldPos = mul(float4(position, 1.0), WorldMatrix);

// GLSL 使用列主序，向量在右边相乘
vec4 worldPos = worldMatrix * vec4(position, 1.0);

// Unity HLSL 使用列主序（OpenGL 风格）
float4 worldPos = mul(WorldMatrix, float4(position, 1.0));
// 或使用 Unity 的宏
float4 worldPos = UnityObjectToClipPos(position);
```

### 2. 法线变换

```hlsl
// 错误：直接使用模型矩阵变换法线
float3 worldNormal = mul(normal, (float3x3)WorldMatrix);  // 非均匀缩放时不正确

// 正确：使用逆转置
float3 worldNormal = mul(normal, (float3x3)WorldInverseTranspose);
// 或者如果缩放是均匀的，变换后归一化
float3 worldNormal = normalize(mul(normal, (float3x3)WorldMatrix));
```

### 3. 浮点精度

```hlsl
// 错误：直接比较浮点数
if (value == 0.0)  // 由于精度问题可能失败

// 正确：使用 epsilon 比较
if (abs(value) < 0.0001)

// 错误：大世界坐标会丢失精度
float3 worldPos = float3(1000000.0, 0.5, 1000000.0);  // 0.5 可能会丢失

// 正确：对大世界使用相机相对渲染
float3 cameraRelativePos = worldPos - cameraPosition;  // 在 CPU 上用双精度计算
```

### 4. 纹理坐标问题

```hlsl
// 注意 UV 坐标差异
// DirectX: (0,0) 在左上角，Y 向下增加
// OpenGL: (0,0) 在左下角，Y 向上增加

// 从 OpenGL 移植到 DirectX 时：
float2 uv = input.TexCoord;
uv.y = 1.0 - uv.y;  // 如果需要翻转 Y

// 半像素偏移（旧版 DX9 问题，DX10+ 不需要）
// float2 uv = input.TexCoord + 0.5 / textureSize;  // 不再需要
```

### 5. 除以零

```hlsl
// 错误：可能除以零
float3 normalizedDir = direction / length(direction);

// 正确：检查或使用安全归一化
float len = length(direction);
float3 normalizedDir = len > 0.0001 ? direction / len : float3(0, 1, 0);

// 或使用 saturate 来限制分母
float attenuation = 1.0 / max(distanceSquared, 0.0001);
```

---

## 性能考虑

### 1. 指令成本

| 操作 | 相对成本 | 注意事项 |
|-----------|---------------|-------|
| 加法、乘法 | 1 | 基本 ALU 操作 |
| MAD（乘加） | 1 | 融合操作 |
| 除法 | 4 | 避免在内循环中使用 |
| Sqrt | 4 | 尽可能使用 rsqrt |
| Sin、Cos | 8 | 使用查找表进行近似 |
| Pow | 8 | 考虑近似 |
| 纹理采样 | 4-100+ | 变化很大，依赖缓存 |
| 分支 | 可变 | 取决于一致性 |

### 2. 优化纹理访问

```hlsl
// 不好：多个依赖纹理读取
float2 uv = texture(uvOffsetMap, baseUV).xy;
float3 color = texture(colorMap, uv).rgb;
float normal = texture(normalMap, uv).rgb;

// 更好：将数据打包到更少的纹理中
// 使用纹理图集
// 在相似 UV 处采样纹理以获得缓存一致性

// 使用适当的 mip 级别
float lod = computeLOD();
float3 color = colorMap.SampleLevel(sampler, uv, lod);
```

### 3. 减少过度绘制

```hlsl
// 使用早期深度测试（不透明物体自动，alpha 测试需要手动）
// HLSL
[earlydepthstencil]
float4 PSMain(PSInput input) : SV_TARGET
{
    // 着色器代码
}

// GLSL
layout(early_fragment_tests) in;
```

### 4. 向量化操作

```hlsl
// 不好：标量操作
float r = a.r * b.r;
float g = a.g * b.g;
float b = a.b * b.b;

// 好：向量操作
float3 result = a.rgb * b.rgb;

// 利用分量重排处理常见模式
float luminance = dot(color.rgb, float3(0.299, 0.587, 0.114));
```

---

## 实际场景

### 场景 1：溶解效果

```hlsl
// DissolveShader.hlsl - 物体溶解效果
Texture2D<float> NoiseTexture : register(t2);

cbuffer DissolveParams : register(b3)
{
    float DissolveAmount;  // 0 到 1
    float EdgeWidth;
    float3 EdgeColor;
    float UseWorldSpace;
};

float4 PSMain(PSInput input) : SV_TARGET
{
    // 采样溶解图案
    float2 dissolveUV = UseWorldSpace > 0.5 ? input.WorldPos.xz * 0.1 : input.TexCoord;
    float noise = NoiseTexture.Sample(LinearSampler, dissolveUV);

    // 丢弃已溶解的像素
    float dissolve = noise - DissolveAmount;
    clip(dissolve);

    // 计算边缘发光
    float edge = 1.0 - smoothstep(0.0, EdgeWidth, dissolve);

    // 基础颜色
    float4 albedo = AlbedoTexture.Sample(LinearSampler, input.TexCoord);
    float3 lighting = ComputeLighting(input);
    float3 baseColor = albedo.rgb * lighting;

    // 添加边缘发射
    float3 finalColor = lerp(baseColor, EdgeColor * 3.0, edge);

    return float4(finalColor, albedo.a);
}
```

### 场景 2：轮廓/剪影着色器

```hlsl
// TwoPassOutline - 第一遍：扩展的剪影
// 顶点着色器沿法线扩展网格
float4 OutlineVS(float3 position : POSITION, float3 normal : NORMAL) : SV_POSITION
{
    float3 expandedPos = position + normal * OutlineWidth;
    return mul(float4(expandedPos, 1.0), WorldViewProjection);
}

float4 OutlinePS() : SV_TARGET
{
    return OutlineColor;
}

// 第二遍：正常渲染（在上面绘制并进行深度测试）
// 屏幕空间替代方案：
float4 ScreenSpaceOutlinePS(PSInput input) : SV_TARGET
{
    // 以十字图案采样深度
    float depth = DepthTexture.Sample(PointSampler, input.TexCoord);
    float depthL = DepthTexture.Sample(PointSampler, input.TexCoord + float2(-TexelSize.x, 0));
    float depthR = DepthTexture.Sample(PointSampler, input.TexCoord + float2(TexelSize.x, 0));
    float depthT = DepthTexture.Sample(PointSampler, input.TexCoord + float2(0, -TexelSize.y));
    float depthB = DepthTexture.Sample(PointSampler, input.TexCoord + float2(0, TexelSize.y));

    // Sobel 风格的深度边缘检测
    float edge = abs(depthL - depthR) + abs(depthT - depthB);
    edge = step(EdgeThreshold, edge);

    float4 sceneColor = SceneTexture.Sample(LinearSampler, input.TexCoord);
    return lerp(sceneColor, OutlineColor, edge);
}
```

### 场景 3：三平面映射

```glsl
// 无 UV 坐标的地形/岩石三平面映射
vec3 triplanarMapping(vec3 worldPos, vec3 worldNormal)
{
    // 根据法线方向确定混合权重
    vec3 blendWeights = abs(worldNormal);
    blendWeights = pow(blendWeights, vec3(4.0)); // 锐化混合
    blendWeights /= dot(blendWeights, vec3(1.0)); // 归一化

    // 从每个轴采样纹理
    vec2 uvX = worldPos.zy * textureScale;
    vec2 uvY = worldPos.xz * textureScale;
    vec2 uvZ = worldPos.xy * textureScale;

    vec3 texX = texture(albedoMap, uvX).rgb;
    vec3 texY = texture(albedoMap, uvY).rgb;
    vec3 texZ = texture(albedoMap, uvZ).rgb;

    // 根据权重混合
    return texX * blendWeights.x + texY * blendWeights.y + texZ * blendWeights.z;
}
```

---

## 面试要点

### 常见问题

1. **顶点着色器和片段着色器有什么区别？**
   - 顶点着色器：每个顶点运行一次，变换位置，输出每顶点数据
   - 片段着色器：每个潜在像素运行一次，确定最终颜色
   - 顶点输出在三角形上插值作为片段输入

2. **解释图形管线阶段。**
   - 顶点组装 -> 顶点着色器 -> (曲面细分) -> (几何着色器) -> 光栅化 -> 片段着色器 -> 输出合并
   - 了解哪些阶段是可编程的与固定功能的

3. **如何优化着色器性能？**
   - 最小化纹理采样并使用适当的 mip 级别
   - 避免基于变化数据的动态分支
   - 高效打包数据（使用所有向量分量）
   - 通过适当的排序和 early-z 减少过度绘制
   - 使用适当的精度（half vs float）

4. **什么是 TBN 矩阵，为什么需要它？**
   - 切线、副切线、法线矩阵
   - 将法线贴图样本从切线空间变换到世界空间
   - 需要它是因为法线贴图存储的是相对于表面切线的法线

5. **解释 3D 渲染中的坐标空间。**
   - 对象/模型空间：网格本地
   - 世界空间：全局场景坐标
   - 视图/相机空间：相对于相机
   - 裁剪空间：投影后，用于裁剪
   - NDC：归一化设备坐标 [-1,1] 或 [0,1]
   - 屏幕空间：最终像素坐标

### 实践编码问题

1. **在着色器中实现 Phong 光照**
2. **编写正确采样法线贴图的着色器**
3. **创建简单的溶解效果**
4. **实现屏幕空间环境光遮蔽（SSAO）基础**
5. **编写高效的实例化渲染着色器**

---

## 进一步阅读

### 书籍
- "Real-Time Rendering" by Akenine-Moller, Haines, Hoffman
- "GPU Gems" 系列（可从 NVIDIA 免费在线获取）
- "The Book of Shaders" by Patricio Gonzalez Vivo (https://thebookofshaders.com)

### 在线资源
- Shadertoy (https://www.shadertoy.com) - 实时着色器示例
- LearnOpenGL (https://learnopengl.com) - 优秀的 GLSL 教程
- Catlike Coding (https://catlikecoding.com) - Unity 着色器教程
- Microsoft HLSL 文档
- Khronos GLSL 规范

### 工具
- RenderDoc - 图形调试器
- NVIDIA Nsight - GPU 性能分析
- AMD Radeon GPU Profiler
- PIX for Windows - DirectX 调试
- Shader Playground (https://shader-playground.timjones.io) - 在线编译器

### 高级主题探索
- 基于物理的渲染（PBR）
- 屏幕空间反射（SSR）
- 时间抗锯齿（TAA）
- 体积渲染
- 光线步进和有符号距离场
- 计算着色器用于图形
