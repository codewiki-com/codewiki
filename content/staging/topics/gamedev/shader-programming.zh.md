---
title: Shader 编程入门与进阶
description: 掌握GPU着色器编程：HLSL/GLSL语法、顶点/片元着色器和计算着色器
track: gamedev
section: graphics
difficulty: advanced
tags:
  - Shader
  - HLSL
  - GLSL
  - GPU编程
status: imported
origin: old/src/content/docs/gamedev/shader-programming.zh.md
divergence: 0.177
issues: []
legacy:
  category: GameDev
  subcategory: Graphics
  order: 11
  lastUpdated: 2026-01-07
---

Shader（着色器）是运行在 GPU 上的小程序，用于控制图形渲染管线中的各个阶段。掌握 Shader 编程是游戏开发、图形学和视觉效果领域的核心技能，能让你实现各种令人惊叹的视觉效果。

## 概念解释：什么是 Shader

### Shader 的本质

Shader 是一种专门为 GPU 设计的编程语言程序，它们在图形管线的不同阶段并行执行，处理顶点变换、像素着色、后处理效果等任务。与 CPU 程序串行执行不同，Shader 利用 GPU 的大规模并行架构，同时处理数以万计的顶点或像素。

### 历史发展

| 时期 | 里程碑 | 特点 |
|------|--------|------|
| 1990s | 固定功能管线 | 硬件固定的渲染流程，无法自定义 |
| 2001 | DirectX 8 / 可编程管线 | 引入顶点和像素着色器 1.0 |
| 2004 | Shader Model 3.0 | 更多指令，支持分支和循环 |
| 2006 | Shader Model 4.0 | 几何着色器，统一着色器架构 |
| 2009 | Shader Model 5.0 | 曲面细分，计算着色器 |
| 2020+ | Shader Model 6.x | 光线追踪着色器，网格着色器 |

### 主要 Shader 语言

```
GLSL (OpenGL Shading Language)
├── 特点：跨平台，语法类似 C
├── 使用场景：OpenGL、WebGL、OpenGL ES
└── 文件扩展名：.vert, .frag, .glsl

HLSL (High-Level Shading Language)
├── 特点：微软开发，与 DirectX 紧密集成
├── 使用场景：DirectX、Unity、Unreal
└── 文件扩展名：.hlsl, .fx

Metal Shading Language
├── 特点：Apple 平台专用，基于 C++14
├── 使用场景：iOS、macOS
└── 文件扩展名：.metal

SPIR-V
├── 特点：中间表示格式，跨 API
├── 使用场景：Vulkan、OpenGL 4.6+
└── 文件扩展名：.spv
```

---

## 图形渲染管线

理解渲染管线是学习 Shader 的基础：

```
顶点数据
    │
    ▼
┌──────────────────┐
│   顶点着色器     │ ← 可编程：变换顶点位置、计算顶点属性
│ (Vertex Shader)  │
└──────────────────┘
    │
    ▼
┌──────────────────┐
│   曲面细分       │ ← 可编程（可选）：细分几何体
│ (Tessellation)   │
└──────────────────┘
    │
    ▼
┌──────────────────┐
│   几何着色器     │ ← 可编程（可选）：生成/删除图元
│ (Geometry Shader)│
└──────────────────┘
    │
    ▼
┌──────────────────┐
│   光栅化         │ ← 固定功能：将图元转换为片元
│ (Rasterization)  │
└──────────────────┘
    │
    ▼
┌──────────────────┐
│   片元着色器     │ ← 可编程：计算每个像素的颜色
│ (Fragment Shader)│
└──────────────────┘
    │
    ▼
┌──────────────────┐
│   输出合并       │ ← 固定功能：深度测试、混合等
│ (Output Merger)  │
└──────────────────┘
    │
    ▼
帧缓冲
```

---

## Shader 语言基础

### GLSL 基础语法

```glsl
// GLSL 版本声明
#version 330 core  // OpenGL 3.3
// #version 300 es // WebGL 2.0

// 基本数据类型
bool b = true;
int i = 42;
uint u = 42u;
float f = 3.14;
double d = 3.14159265359;  // GLSL 4.0+

// 向量类型
vec2 v2 = vec2(1.0, 2.0);
vec3 v3 = vec3(1.0, 2.0, 3.0);
vec4 v4 = vec4(1.0, 2.0, 3.0, 1.0);

// 整数向量
ivec2 iv2 = ivec2(1, 2);
uvec3 uv3 = uvec3(1u, 2u, 3u);

// 布尔向量
bvec2 bv2 = bvec2(true, false);

// 矩阵类型
mat2 m2 = mat2(1.0);  // 2x2 单位矩阵
mat3 m3 = mat3(1.0);  // 3x3 单位矩阵
mat4 m4 = mat4(1.0);  // 4x4 单位矩阵

// 非方阵
mat2x3 m23;  // 2列3行
mat3x4 m34;  // 3列4行

// 采样器类型
sampler2D tex2D;
samplerCube texCube;
sampler2DShadow shadowMap;
sampler3D tex3D;
```

### 向量分量访问（Swizzling）

```glsl
vec4 color = vec4(1.0, 0.5, 0.2, 1.0);

// 位置分量: x, y, z, w
vec3 pos = color.xyz;  // (1.0, 0.5, 0.2)

// 颜色分量: r, g, b, a
vec2 rg = color.rg;    // (1.0, 0.5)

// 纹理分量: s, t, p, q
vec2 st = color.st;    // (1.0, 0.5)

// 重排和重复
vec4 rrra = color.rrra;     // (1.0, 1.0, 1.0, 1.0)
vec3 bgr = color.bgr;       // (0.2, 0.5, 1.0)
vec4 xxxx = color.xxxx;     // (1.0, 1.0, 1.0, 1.0)

// 赋值时的 swizzle
color.rb = vec2(0.8, 0.3);  // 修改 r 和 b 分量
```

### HLSL 基础语法

```hlsl
// HLSL 着色器模型声明
// #pragma target 5.0

// 基本数据类型
bool b = true;
int i = 42;
uint u = 42;
float f = 3.14f;
half h = 3.14h;   // 16位浮点
double d = 3.14;  // SM 5.0+

// 向量类型
float2 v2 = float2(1.0, 2.0);
float3 v3 = float3(1.0, 2.0, 3.0);
float4 v4 = float4(1.0, 2.0, 3.0, 1.0);

// 或使用 vector<T, N> 语法
vector<float, 4> v4_alt = { 1.0, 2.0, 3.0, 1.0 };

// 整数向量
int2 iv2 = int2(1, 2);
uint3 uv3 = uint3(1, 2, 3);

// 矩阵类型
float2x2 m2 = float2x2(1, 0, 0, 1);
float3x3 m3;
float4x4 m4;

// 或使用 matrix<T, R, C> 语法
matrix<float, 4, 4> m4_alt;

// 纹理和采样器
Texture2D tex2D;
TextureCube texCube;
SamplerState sampler0;
```

### 内置函数对比

| 功能 | GLSL | HLSL |
|------|------|------|
| 绝对值 | `abs(x)` | `abs(x)` |
| 取整(向下) | `floor(x)` | `floor(x)` |
| 取整(向上) | `ceil(x)` | `ceil(x)` |
| 四舍五入 | `round(x)` | `round(x)` |
| 小数部分 | `fract(x)` | `frac(x)` |
| 钳制范围 | `clamp(x, min, max)` | `clamp(x, min, max)` |
| 线性插值 | `mix(a, b, t)` | `lerp(a, b, t)` |
| 平滑插值 | `smoothstep(e0, e1, x)` | `smoothstep(e0, e1, x)` |
| 阶跃函数 | `step(edge, x)` | `step(edge, x)` |
| 点积 | `dot(a, b)` | `dot(a, b)` |
| 叉积 | `cross(a, b)` | `cross(a, b)` |
| 归一化 | `normalize(v)` | `normalize(v)` |
| 长度 | `length(v)` | `length(v)` |
| 反射 | `reflect(I, N)` | `reflect(I, N)` |
| 折射 | `refract(I, N, eta)` | `refract(I, N, eta)` |
| 纹理采样 | `texture(sampler, uv)` | `tex2D.Sample(sampler, uv)` |

---

## 顶点着色器

顶点着色器是管线的第一个可编程阶段，主要负责顶点变换。

### GLSL 顶点着色器

```glsl
#version 330 core

// 顶点属性输入
layout(location = 0) in vec3 a_Position;
layout(location = 1) in vec3 a_Normal;
layout(location = 2) in vec2 a_TexCoord;
layout(location = 3) in vec4 a_Color;

// Uniform 变量（所有顶点共享）
uniform mat4 u_Model;
uniform mat4 u_View;
uniform mat4 u_Projection;
uniform mat3 u_NormalMatrix;  // 用于变换法线

// 传递给片元着色器的变量
out vec3 v_WorldPos;
out vec3 v_Normal;
out vec2 v_TexCoord;
out vec4 v_Color;

void main() {
    // 计算世界空间位置
    vec4 worldPos = u_Model * vec4(a_Position, 1.0);
    v_WorldPos = worldPos.xyz;

    // 变换法线到世界空间
    // 使用法线矩阵（模型矩阵逆转置的左上3x3）
    v_Normal = normalize(u_NormalMatrix * a_Normal);

    // 传递纹理坐标和颜色
    v_TexCoord = a_TexCoord;
    v_Color = a_Color;

    // 计算裁剪空间位置（必须设置 gl_Position）
    gl_Position = u_Projection * u_View * worldPos;
}
```

### HLSL 顶点着色器

```hlsl
// 常量缓冲区
cbuffer MatrixBuffer : register(b0) {
    matrix World;
    matrix View;
    matrix Projection;
    matrix NormalMatrix;
};

// 顶点输入结构
struct VertexInput {
    float3 Position : POSITION;
    float3 Normal   : NORMAL;
    float2 TexCoord : TEXCOORD0;
    float4 Color    : COLOR0;
};

// 顶点输出结构
struct VertexOutput {
    float4 Position : SV_POSITION;  // 裁剪空间位置
    float3 WorldPos : TEXCOORD0;
    float3 Normal   : TEXCOORD1;
    float2 TexCoord : TEXCOORD2;
    float4 Color    : COLOR0;
};

VertexOutput main(VertexInput input) {
    VertexOutput output;

    // 计算世界空间位置
    float4 worldPos = mul(World, float4(input.Position, 1.0));
    output.WorldPos = worldPos.xyz;

    // 变换法线
    output.Normal = normalize(mul((float3x3)NormalMatrix, input.Normal));

    // 传递其他属性
    output.TexCoord = input.TexCoord;
    output.Color = input.Color;

    // 计算最终位置
    float4 viewPos = mul(View, worldPos);
    output.Position = mul(Projection, viewPos);

    return output;
}
```

### 常见顶点变换

```glsl
// 骨骼动画顶点变换
#version 330 core

#define MAX_BONES 100
#define MAX_BONE_INFLUENCE 4

layout(location = 0) in vec3 a_Position;
layout(location = 1) in vec3 a_Normal;
layout(location = 2) in vec4 a_BoneIDs;     // 影响此顶点的骨骼索引
layout(location = 3) in vec4 a_BoneWeights; // 对应的权重

uniform mat4 u_BoneMatrices[MAX_BONES];
uniform mat4 u_MVP;

out vec3 v_Normal;

void main() {
    // 计算骨骼变换矩阵
    mat4 boneTransform = mat4(0.0);

    for (int i = 0; i < MAX_BONE_INFLUENCE; i++) {
        int boneID = int(a_BoneIDs[i]);
        if (boneID >= 0 && boneID < MAX_BONES) {
            boneTransform += u_BoneMatrices[boneID] * a_BoneWeights[i];
        }
    }

    // 如果没有骨骼影响，使用单位矩阵
    if (a_BoneWeights.x + a_BoneWeights.y + a_BoneWeights.z + a_BoneWeights.w < 0.01) {
        boneTransform = mat4(1.0);
    }

    // 应用骨骼变换
    vec4 skinnedPosition = boneTransform * vec4(a_Position, 1.0);
    vec3 skinnedNormal = mat3(boneTransform) * a_Normal;

    v_Normal = normalize(skinnedNormal);
    gl_Position = u_MVP * skinnedPosition;
}
```

---

## 片元着色器

片元着色器（或像素着色器）计算每个像素的最终颜色。

### GLSL 片元着色器

```glsl
#version 330 core

// 从顶点着色器接收的变量
in vec3 v_WorldPos;
in vec3 v_Normal;
in vec2 v_TexCoord;
in vec4 v_Color;

// Uniform 变量
uniform sampler2D u_AlbedoMap;
uniform sampler2D u_NormalMap;
uniform sampler2D u_MetallicRoughnessMap;
uniform samplerCube u_IrradianceMap;
uniform samplerCube u_PrefilterMap;
uniform sampler2D u_BRDF_LUT;

uniform vec3 u_CameraPos;
uniform vec3 u_LightPos;
uniform vec3 u_LightColor;
uniform float u_LightIntensity;

// 输出颜色
out vec4 FragColor;

// PBR 常量
const float PI = 3.14159265359;

// 法线分布函数 (GGX/Trowbridge-Reitz)
float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return a2 / denom;
}

// 几何遮蔽函数 (Schlick-GGX)
float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = roughness + 1.0;
    float k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    return GeometrySchlickGGX(NdotV, roughness) * GeometrySchlickGGX(NdotL, roughness);
}

// 菲涅尔方程 (Schlick 近似)
vec3 FresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// 从法线贴图获取世界空间法线
vec3 getNormalFromMap() {
    vec3 tangentNormal = texture(u_NormalMap, v_TexCoord).xyz * 2.0 - 1.0;

    vec3 Q1 = dFdx(v_WorldPos);
    vec3 Q2 = dFdy(v_WorldPos);
    vec2 st1 = dFdx(v_TexCoord);
    vec2 st2 = dFdy(v_TexCoord);

    vec3 N = normalize(v_Normal);
    vec3 T = normalize(Q1 * st2.t - Q2 * st1.t);
    vec3 B = -normalize(cross(N, T));
    mat3 TBN = mat3(T, B, N);

    return normalize(TBN * tangentNormal);
}

void main() {
    // 采样材质贴图
    vec3 albedo = pow(texture(u_AlbedoMap, v_TexCoord).rgb, vec3(2.2)); // sRGB to linear
    float metallic = texture(u_MetallicRoughnessMap, v_TexCoord).b;
    float roughness = texture(u_MetallicRoughnessMap, v_TexCoord).g;
    float ao = 1.0; // 如果有 AO 贴图可以采样

    // 获取法线
    vec3 N = getNormalFromMap();
    vec3 V = normalize(u_CameraPos - v_WorldPos);

    // 计算基础反射率
    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);

    // 直接光照
    vec3 L = normalize(u_LightPos - v_WorldPos);
    vec3 H = normalize(V + L);
    float distance = length(u_LightPos - v_WorldPos);
    float attenuation = 1.0 / (distance * distance);
    vec3 radiance = u_LightColor * u_LightIntensity * attenuation;

    // Cook-Torrance BRDF
    float NDF = DistributionGGX(N, H, roughness);
    float G = GeometrySmith(N, V, L, roughness);
    vec3 F = FresnelSchlick(max(dot(H, V), 0.0), F0);

    vec3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
    vec3 specular = numerator / denominator;

    // 能量守恒
    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - metallic;

    // 漫反射和镜面反射
    float NdotL = max(dot(N, L), 0.0);
    vec3 Lo = (kD * albedo / PI + specular) * radiance * NdotL;

    // 环境光（IBL）
    vec3 ambient = vec3(0.03) * albedo * ao;

    // 最终颜色
    vec3 color = ambient + Lo;

    // HDR 色调映射
    color = color / (color + vec3(1.0));

    // Gamma 校正
    color = pow(color, vec3(1.0 / 2.2));

    FragColor = vec4(color, 1.0);
}
```

### HLSL 片元着色器（像素着色器）

```hlsl
// 常量缓冲区
cbuffer LightBuffer : register(b0) {
    float3 LightPosition;
    float LightIntensity;
    float3 LightColor;
    float _Padding;
    float3 CameraPosition;
};

// 纹理和采样器
Texture2D AlbedoMap : register(t0);
Texture2D NormalMap : register(t1);
Texture2D MetallicRoughnessMap : register(t2);
SamplerState LinearSampler : register(s0);

// 输入结构
struct PixelInput {
    float4 Position : SV_POSITION;
    float3 WorldPos : TEXCOORD0;
    float3 Normal   : TEXCOORD1;
    float2 TexCoord : TEXCOORD2;
    float4 Color    : COLOR0;
};

static const float PI = 3.14159265359;

// PBR 函数
float DistributionGGX(float3 N, float3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return a2 / denom;
}

float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = roughness + 1.0;
    float k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

float GeometrySmith(float3 N, float3 V, float3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    return GeometrySchlickGGX(NdotV, roughness) * GeometrySchlickGGX(NdotL, roughness);
}

float3 FresnelSchlick(float cosTheta, float3 F0) {
    return F0 + (1.0 - F0) * pow(saturate(1.0 - cosTheta), 5.0);
}

float4 main(PixelInput input) : SV_TARGET {
    // 采样材质
    float3 albedo = pow(AlbedoMap.Sample(LinearSampler, input.TexCoord).rgb, 2.2);
    float metallic = MetallicRoughnessMap.Sample(LinearSampler, input.TexCoord).b;
    float roughness = MetallicRoughnessMap.Sample(LinearSampler, input.TexCoord).g;

    // 法线
    float3 N = normalize(input.Normal);
    float3 V = normalize(CameraPosition - input.WorldPos);

    // 基础反射率
    float3 F0 = lerp(float3(0.04, 0.04, 0.04), albedo, metallic);

    // 光照计算
    float3 L = normalize(LightPosition - input.WorldPos);
    float3 H = normalize(V + L);
    float distance = length(LightPosition - input.WorldPos);
    float attenuation = 1.0 / (distance * distance);
    float3 radiance = LightColor * LightIntensity * attenuation;

    // BRDF
    float NDF = DistributionGGX(N, H, roughness);
    float G = GeometrySmith(N, V, L, roughness);
    float3 F = FresnelSchlick(max(dot(H, V), 0.0), F0);

    float3 numerator = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
    float3 specular = numerator / denominator;

    float3 kS = F;
    float3 kD = (1.0 - kS) * (1.0 - metallic);

    float NdotL = max(dot(N, L), 0.0);
    float3 Lo = (kD * albedo / PI + specular) * radiance * NdotL;

    // 环境光
    float3 ambient = 0.03 * albedo;
    float3 color = ambient + Lo;

    // 色调映射和 gamma 校正
    color = color / (color + 1.0);
    color = pow(color, 1.0 / 2.2);

    return float4(color, 1.0);
}
```

---

## Uniform 与 Varying

### 数据传递机制

```
CPU (应用程序)
    │
    ├── Uniform ──────────────────────────────────────────┐
    │   (全局常量，所有着色器实例共享)                      │
    │                                                     │
    ▼                                                     ▼
┌──────────────────┐                           ┌──────────────────┐
│   顶点着色器     │                           │   片元着色器     │
│                  │                           │                  │
│  in: 顶点属性    │ ─── Varying (out/in) ───→ │  in: 插值数据    │
│  out: 输出变量   │     (每顶点计算,          │  out: 颜色       │
│                  │      光栅化时插值)        │                  │
└──────────────────┘                           └──────────────────┘
```

### GLSL Uniform 示例

```glsl
// 顶点着色器
#version 330 core

// 基本类型 Uniform
uniform float u_Time;
uniform vec3 u_CameraPosition;
uniform mat4 u_ModelViewProjection;

// 结构体 Uniform
struct Light {
    vec3 position;
    vec3 color;
    float intensity;
    float radius;
};
uniform Light u_Lights[4];
uniform int u_LightCount;

// Uniform Block（高效批量更新）
layout(std140) uniform CameraBlock {
    mat4 view;
    mat4 projection;
    mat4 viewProjection;
    vec3 cameraPos;
    float nearPlane;
    float farPlane;
} u_Camera;

// 使用
void main() {
    vec4 worldPos = u_Model * vec4(a_Position, 1.0);

    // 访问 Uniform Block 成员
    gl_Position = u_Camera.viewProjection * worldPos;

    // 访问结构体数组
    for (int i = 0; i < u_LightCount; i++) {
        vec3 lightDir = normalize(u_Lights[i].position - worldPos.xyz);
        // ...
    }
}
```

### HLSL Constant Buffer

```hlsl
// 常量缓冲区 - 按更新频率分组
cbuffer PerFrame : register(b0) {
    float Time;
    float DeltaTime;
    float2 Resolution;
};

cbuffer PerCamera : register(b1) {
    matrix View;
    matrix Projection;
    matrix ViewProjection;
    float3 CameraPosition;
    float NearPlane;
    float FarPlane;
};

cbuffer PerObject : register(b2) {
    matrix World;
    matrix WorldInverseTranspose;
    float4 ObjectColor;
};

// 结构化缓冲区（大量数据）
struct LightData {
    float3 Position;
    float Radius;
    float3 Color;
    float Intensity;
};

StructuredBuffer<LightData> Lights : register(t0);
RWStructuredBuffer<float4> OutputBuffer : register(u0);  // 可读写

// 使用
float4 main(VertexOutput input) : SV_TARGET {
    uint lightCount, stride;
    Lights.GetDimensions(lightCount, stride);

    float3 lighting = float3(0, 0, 0);
    for (uint i = 0; i < lightCount; i++) {
        LightData light = Lights[i];
        // 计算光照...
    }

    return float4(lighting, 1.0);
}
```

### Varying（插值变量）

```glsl
// 顶点着色器
#version 330 core

in vec3 a_Position;
in vec3 a_Normal;
in vec2 a_TexCoord;

uniform mat4 u_MVP;
uniform mat4 u_Model;

// 输出到片元着色器（将被插值）
out vec3 v_WorldPos;
out vec3 v_Normal;
out vec2 v_TexCoord;

// 插值限定符
flat out int v_InstanceID;       // 不插值
noperspective out vec2 v_ScreenPos; // 线性插值（无透视校正）
smooth out vec3 v_SmoothData;    // 透视校正插值（默认）

void main() {
    v_WorldPos = (u_Model * vec4(a_Position, 1.0)).xyz;
    v_Normal = mat3(u_Model) * a_Normal;
    v_TexCoord = a_TexCoord;
    v_InstanceID = gl_InstanceID;

    gl_Position = u_MVP * vec4(a_Position, 1.0);
    v_ScreenPos = gl_Position.xy / gl_Position.w;
}

// 片元着色器
#version 330 core

in vec3 v_WorldPos;
in vec3 v_Normal;
in vec2 v_TexCoord;
flat in int v_InstanceID;
noperspective in vec2 v_ScreenPos;

out vec4 FragColor;

void main() {
    // 这里的 v_WorldPos, v_Normal, v_TexCoord
    // 是三角形顶点值的插值结果
    vec3 normal = normalize(v_Normal);  // 插值后需要重新归一化
    // ...
}
```

---

## 纹理采样

### 基本纹理采样

```glsl
#version 330 core

// 不同维度的采样器
uniform sampler1D u_Gradient;     // 1D 纹理（渐变、LUT）
uniform sampler2D u_Albedo;       // 2D 纹理（最常用）
uniform sampler3D u_Volume;       // 3D 纹理（体积数据）
uniform samplerCube u_Skybox;     // 立方体贴图
uniform sampler2DArray u_TextureArray;  // 纹理数组

in vec2 v_TexCoord;
in vec3 v_Normal;
in vec3 v_WorldPos;

out vec4 FragColor;

void main() {
    // 基本 2D 采样
    vec4 albedo = texture(u_Albedo, v_TexCoord);

    // 带 LOD 的采样
    vec4 albedoLod = textureLod(u_Albedo, v_TexCoord, 2.0);

    // 带偏移的采样
    vec4 albedoOffset = textureOffset(u_Albedo, v_TexCoord, ivec2(1, 0));

    // 立方体贴图采样（使用方向向量）
    vec3 reflectDir = reflect(-normalize(v_WorldPos), normalize(v_Normal));
    vec4 envColor = texture(u_Skybox, reflectDir);

    // 3D 纹理采样
    vec4 volumeData = texture(u_Volume, vec3(v_TexCoord, 0.5));

    // 纹理数组采样
    vec4 arrayTex = texture(u_TextureArray, vec3(v_TexCoord, 0.0)); // 第0层

    FragColor = albedo;
}
```

### HLSL 纹理采样

```hlsl
// 纹理声明
Texture2D AlbedoTex : register(t0);
Texture2D NormalTex : register(t1);
TextureCube EnvMap : register(t2);
Texture3D VolumeData : register(t3);
Texture2DArray TexArray : register(t4);

// 采样器状态
SamplerState LinearWrap : register(s0);
SamplerState PointClamp : register(s1);
SamplerState AnisotropicWrap : register(s2);
SamplerComparisonState ShadowSampler : register(s3);

float4 main(PixelInput input) : SV_TARGET {
    // 基本采样
    float4 albedo = AlbedoTex.Sample(LinearWrap, input.TexCoord);

    // 带 LOD 的采样
    float4 albedoLod = AlbedoTex.SampleLevel(LinearWrap, input.TexCoord, 2.0);

    // 采样梯度（用于各向异性过滤）
    float2 ddx = ddx_fine(input.TexCoord);
    float2 ddy = ddy_fine(input.TexCoord);
    float4 albedoGrad = AlbedoTex.SampleGrad(AnisotropicWrap, input.TexCoord, ddx, ddy);

    // 立方体贴图
    float3 reflectDir = reflect(-input.ViewDir, input.Normal);
    float4 envColor = EnvMap.Sample(LinearWrap, reflectDir);

    // 带比较的采样（阴影贴图）
    float shadow = ShadowMap.SampleCmpLevelZero(ShadowSampler,
                                                 input.ShadowCoord.xy,
                                                 input.ShadowCoord.z);

    // 纹理数组
    float4 arrayTex = TexArray.Sample(LinearWrap, float3(input.TexCoord, 0));

    // 直接加载（无过滤，整数坐标）
    int2 texelCoord = int2(input.TexCoord * float2(512, 512));
    float4 texel = AlbedoTex.Load(int3(texelCoord, 0));  // mip level 0

    return albedo;
}
```

### 高级纹理技术

```glsl
#version 330 core

uniform sampler2D u_HeightMap;
uniform sampler2D u_AlbedoMap;
uniform vec3 u_CameraPos;

in vec3 v_WorldPos;
in vec2 v_TexCoord;
in vec3 v_TangentViewDir;

out vec4 FragColor;

// 视差贴图
vec2 parallaxMapping(vec2 texCoords, vec3 viewDir) {
    float height = texture(u_HeightMap, texCoords).r;
    float heightScale = 0.1;
    vec2 p = viewDir.xy / viewDir.z * (height * heightScale);
    return texCoords - p;
}

// 陡峭视差贴图
vec2 steepParallaxMapping(vec2 texCoords, vec3 viewDir) {
    const float numLayers = 32.0;
    float layerDepth = 1.0 / numLayers;
    float currentLayerDepth = 0.0;

    vec2 P = viewDir.xy * 0.1;
    vec2 deltaTexCoords = P / numLayers;

    vec2 currentTexCoords = texCoords;
    float currentDepthMapValue = texture(u_HeightMap, currentTexCoords).r;

    while (currentLayerDepth < currentDepthMapValue) {
        currentTexCoords -= deltaTexCoords;
        currentDepthMapValue = texture(u_HeightMap, currentTexCoords).r;
        currentLayerDepth += layerDepth;
    }

    // 遮挡视差映射（线性插值）
    vec2 prevTexCoords = currentTexCoords + deltaTexCoords;
    float afterDepth = currentDepthMapValue - currentLayerDepth;
    float beforeDepth = texture(u_HeightMap, prevTexCoords).r - currentLayerDepth + layerDepth;
    float weight = afterDepth / (afterDepth - beforeDepth);

    return prevTexCoords * weight + currentTexCoords * (1.0 - weight);
}

// 三线性采样（手动实现）
vec4 trilinearSample(sampler2D tex, vec2 uv, float lod) {
    float lodFloor = floor(lod);
    float lodFract = fract(lod);

    vec4 sample0 = textureLod(tex, uv, lodFloor);
    vec4 sample1 = textureLod(tex, uv, lodFloor + 1.0);

    return mix(sample0, sample1, lodFract);
}

void main() {
    vec3 viewDir = normalize(v_TangentViewDir);
    vec2 texCoords = steepParallaxMapping(v_TexCoord, viewDir);

    // 边界检查
    if (texCoords.x > 1.0 || texCoords.y > 1.0 || texCoords.x < 0.0 || texCoords.y < 0.0) {
        discard;
    }

    vec4 albedo = texture(u_AlbedoMap, texCoords);
    FragColor = albedo;
}
```

---

## Unity 表面着色器

Unity 的表面着色器是对顶点/片元着色器的高级封装，简化了光照计算。

### 基础表面着色器

```hlsl
Shader "Custom/BasicSurface" {
    Properties {
        _Color ("Color", Color) = (1,1,1,1)
        _MainTex ("Albedo (RGB)", 2D) = "white" {}
        _Glossiness ("Smoothness", Range(0,1)) = 0.5
        _Metallic ("Metallic", Range(0,1)) = 0.0
    }

    SubShader {
        Tags { "RenderType"="Opaque" }
        LOD 200

        CGPROGRAM
        // 使用物理基础光照模型 Standard
        #pragma surface surf Standard fullforwardshadows
        #pragma target 3.0

        sampler2D _MainTex;

        struct Input {
            float2 uv_MainTex;
        };

        half _Glossiness;
        half _Metallic;
        fixed4 _Color;

        // 表面函数：填充 SurfaceOutputStandard 结构
        void surf(Input IN, inout SurfaceOutputStandard o) {
            fixed4 c = tex2D(_MainTex, IN.uv_MainTex) * _Color;
            o.Albedo = c.rgb;
            o.Metallic = _Metallic;
            o.Smoothness = _Glossiness;
            o.Alpha = c.a;
        }
        ENDCG
    }
    FallBack "Diffuse"
}
```

### 高级表面着色器

```hlsl
Shader "Custom/AdvancedSurface" {
    Properties {
        _Color ("Color", Color) = (1,1,1,1)
        _MainTex ("Albedo", 2D) = "white" {}
        [Normal] _BumpMap ("Normal Map", 2D) = "bump" {}
        _BumpScale ("Normal Scale", Range(0, 2)) = 1.0
        _MetallicGlossMap ("Metallic (R) Smoothness (A)", 2D) = "white" {}
        _OcclusionMap ("Occlusion", 2D) = "white" {}
        _OcclusionStrength ("Occlusion Strength", Range(0, 1)) = 1.0
        _EmissionMap ("Emission", 2D) = "black" {}
        [HDR] _EmissionColor ("Emission Color", Color) = (0,0,0,1)
        _DetailAlbedoMap ("Detail Albedo", 2D) = "grey" {}
        _DetailNormalMap ("Detail Normal", 2D) = "bump" {}
        _DetailScale ("Detail Scale", Float) = 10
    }

    SubShader {
        Tags { "RenderType"="Opaque" }
        LOD 300

        CGPROGRAM
        #pragma surface surf Standard fullforwardshadows vertex:vert
        #pragma target 4.0

        // 开启各种特性
        #pragma multi_compile_instancing
        #pragma instancing_options assumeuniformscaling

        sampler2D _MainTex;
        sampler2D _BumpMap;
        sampler2D _MetallicGlossMap;
        sampler2D _OcclusionMap;
        sampler2D _EmissionMap;
        sampler2D _DetailAlbedoMap;
        sampler2D _DetailNormalMap;

        float4 _MainTex_ST;
        float4 _DetailAlbedoMap_ST;

        half _BumpScale;
        half _OcclusionStrength;
        half _DetailScale;
        fixed4 _Color;
        fixed4 _EmissionColor;

        struct Input {
            float2 uv_MainTex;
            float2 uv_BumpMap;
            float3 worldPos;
            float3 worldNormal;
            INTERNAL_DATA  // 用于访问世界法线
        };

        // 顶点修改函数
        void vert(inout appdata_full v, out Input o) {
            UNITY_INITIALIZE_OUTPUT(Input, o);
            // 可以在这里修改顶点
        }

        void surf(Input IN, inout SurfaceOutputStandard o) {
            // 基础颜色
            float2 mainUV = IN.uv_MainTex;
            fixed4 c = tex2D(_MainTex, mainUV) * _Color;

            // 细节贴图
            float2 detailUV = mainUV * _DetailScale;
            fixed4 detail = tex2D(_DetailAlbedoMap, detailUV);
            c.rgb *= detail.rgb * 2.0; // 叠加细节

            o.Albedo = c.rgb;

            // 法线贴图
            fixed3 normal = UnpackScaleNormal(tex2D(_BumpMap, IN.uv_BumpMap), _BumpScale);
            fixed3 detailNormal = UnpackNormal(tex2D(_DetailNormalMap, detailUV));
            o.Normal = BlendNormals(normal, detailNormal);

            // 金属度和光滑度
            fixed4 metallicGloss = tex2D(_MetallicGlossMap, mainUV);
            o.Metallic = metallicGloss.r;
            o.Smoothness = metallicGloss.a;

            // 环境光遮蔽
            o.Occlusion = lerp(1.0, tex2D(_OcclusionMap, mainUV).r, _OcclusionStrength);

            // 自发光
            o.Emission = tex2D(_EmissionMap, mainUV).rgb * _EmissionColor.rgb;

            o.Alpha = c.a;
        }
        ENDCG
    }

    // 自定义编辑器
    CustomEditor "StandardShaderGUI"
    FallBack "Standard"
}
```

### 自定义光照模型

```hlsl
Shader "Custom/ToonShading" {
    Properties {
        _Color ("Color", Color) = (1,1,1,1)
        _MainTex ("Albedo", 2D) = "white" {}
        _RampTex ("Ramp Texture", 2D) = "white" {}
        _OutlineColor ("Outline Color", Color) = (0,0,0,1)
        _OutlineWidth ("Outline Width", Range(0, 0.1)) = 0.01
    }

    SubShader {
        Tags { "RenderType"="Opaque" }

        // Pass 1: 描边
        Pass {
            Name "Outline"
            Tags { "LightMode"="Always" }
            Cull Front
            ZWrite On

            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "UnityCG.cginc"

            float _OutlineWidth;
            float4 _OutlineColor;

            struct v2f {
                float4 pos : SV_POSITION;
            };

            v2f vert(appdata_base v) {
                v2f o;
                // 沿法线方向扩展顶点
                float3 norm = normalize(v.normal);
                v.vertex.xyz += norm * _OutlineWidth;
                o.pos = UnityObjectToClipPos(v.vertex);
                return o;
            }

            float4 frag(v2f i) : SV_Target {
                return _OutlineColor;
            }
            ENDCG
        }

        // Pass 2: 卡通着色
        CGPROGRAM
        #pragma surface surf Toon

        sampler2D _MainTex;
        sampler2D _RampTex;
        fixed4 _Color;

        struct Input {
            float2 uv_MainTex;
        };

        // 自定义光照函数
        half4 LightingToon(SurfaceOutput s, half3 lightDir, half atten) {
            // 计算漫反射
            half NdotL = dot(s.Normal, lightDir);

            // 使用渐变纹理作为色阶
            half2 rampUV = half2(NdotL * 0.5 + 0.5, 0.5);
            half3 ramp = tex2D(_RampTex, rampUV).rgb;

            half4 c;
            c.rgb = s.Albedo * _LightColor0.rgb * ramp * atten;
            c.a = s.Alpha;
            return c;
        }

        void surf(Input IN, inout SurfaceOutput o) {
            fixed4 c = tex2D(_MainTex, IN.uv_MainTex) * _Color;
            o.Albedo = c.rgb;
            o.Alpha = c.a;
        }
        ENDCG
    }
    FallBack "Diffuse"
}
```

---

## 计算着色器

计算着色器（Compute Shader）用于 GPU 通用计算，不涉及渲染管线。

### GLSL 计算着色器

```glsl
#version 430 core

// 工作组大小
layout(local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

// 输入输出缓冲区
layout(std430, binding = 0) buffer ParticleBuffer {
    vec4 positions[];
};

layout(std430, binding = 1) buffer VelocityBuffer {
    vec4 velocities[];
};

// 只读纹理
layout(binding = 0) uniform sampler2D noiseTexture;

// 读写纹理
layout(rgba32f, binding = 1) uniform image2D outputImage;

// Uniform
uniform float deltaTime;
uniform vec3 gravity;
uniform int particleCount;

// 共享内存（工作组内共享）
shared vec4 sharedData[256];

void main() {
    // 获取全局和局部索引
    uvec3 globalID = gl_GlobalInvocationID;
    uvec3 localID = gl_LocalInvocationID;
    uvec3 workGroupID = gl_WorkGroupID;
    uint localIndex = gl_LocalInvocationIndex;

    uint index = globalID.x + globalID.y * gl_NumWorkGroups.x * gl_WorkGroupSize.x;

    if (index >= particleCount) return;

    // 读取粒子数据
    vec4 pos = positions[index];
    vec4 vel = velocities[index];

    // 更新速度（应用重力）
    vel.xyz += gravity * deltaTime;

    // 更新位置
    pos.xyz += vel.xyz * deltaTime;

    // 边界碰撞
    if (pos.y < 0.0) {
        pos.y = 0.0;
        vel.y *= -0.8; // 反弹并损失能量
    }

    // 写回数据
    positions[index] = pos;
    velocities[index] = vel;

    // 同步工作组内的线程
    barrier();
    memoryBarrierShared();
}
```

### HLSL 计算着色器

```hlsl
// 粒子结构
struct Particle {
    float3 position;
    float lifetime;
    float3 velocity;
    float size;
    float4 color;
};

// 缓冲区
RWStructuredBuffer<Particle> ParticleBuffer : register(u0);
AppendStructuredBuffer<uint> DeadList : register(u1);
ConsumeStructuredBuffer<uint> AliveList : register(u2);

// 常量
cbuffer SimulationParams : register(b0) {
    float DeltaTime;
    float3 Gravity;
    float3 EmitterPosition;
    float EmissionRate;
    uint MaxParticles;
    float3 WindDirection;
    float WindStrength;
};

// 纹理
Texture3D<float> NoiseVolume : register(t0);
SamplerState LinearSampler : register(s0);

// 工作组大小
[numthreads(256, 1, 1)]
void CSMain(
    uint3 groupID : SV_GroupID,
    uint3 groupThreadID : SV_GroupThreadID,
    uint3 dispatchThreadID : SV_DispatchThreadID,
    uint groupIndex : SV_GroupIndex
) {
    uint index = dispatchThreadID.x;

    if (index >= MaxParticles) return;

    Particle p = ParticleBuffer[index];

    // 检查是否存活
    if (p.lifetime <= 0) {
        DeadList.Append(index);
        return;
    }

    // 更新生命周期
    p.lifetime -= DeltaTime;

    // 采样噪声产生湍流
    float3 noiseCoord = p.position * 0.1 + float3(DeltaTime * 0.5, 0, 0);
    float noise = NoiseVolume.SampleLevel(LinearSampler, noiseCoord, 0);
    float3 turbulence = float3(noise, noise * 0.5, noise * 0.25) * 2.0 - 1.0;

    // 更新速度
    p.velocity += Gravity * DeltaTime;
    p.velocity += WindDirection * WindStrength * DeltaTime;
    p.velocity += turbulence * DeltaTime * 5.0;

    // 阻力
    p.velocity *= 0.99;

    // 更新位置
    p.position += p.velocity * DeltaTime;

    // 更新大小（随生命周期缩小）
    p.size = lerp(0.1, 1.0, p.lifetime / 5.0);

    // 更新颜色（随生命周期变化）
    float lifetimeRatio = p.lifetime / 5.0;
    p.color = lerp(
        float4(1, 0.3, 0, 0),  // 死亡时：暗红色
        float4(1, 1, 0.5, 1),  // 出生时：亮黄色
        lifetimeRatio
    );

    // 写回
    ParticleBuffer[index] = p;
}

// 发射粒子的计算着色器
[numthreads(64, 1, 1)]
void CSEmit(uint3 dispatchThreadID : SV_DispatchThreadID) {
    // 从死亡列表获取可用索引
    uint index = AliveList.Consume();

    // 初始化新粒子
    Particle p;
    p.position = EmitterPosition;
    p.lifetime = 5.0;

    // 随机方向
    float angle = dispatchThreadID.x * 0.1;
    p.velocity = float3(
        cos(angle) * 2.0,
        5.0 + sin(angle * 2.0),
        sin(angle) * 2.0
    );

    p.size = 1.0;
    p.color = float4(1, 1, 0.5, 1);

    ParticleBuffer[index] = p;
}
```

### GPU 图像处理

```hlsl
// 高斯模糊计算着色器
Texture2D<float4> InputTexture : register(t0);
RWTexture2D<float4> OutputTexture : register(u0);

cbuffer BlurParams : register(b0) {
    float2 TextureSize;
    float BlurRadius;
    int KernelSize;
};

// 共享内存用于缓存纹理数据
groupshared float4 SharedCache[20][20];

// 高斯权重
static const float GaussianWeights[5] = { 0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216 };

[numthreads(16, 16, 1)]
void CSBlurHorizontal(uint3 dispatchThreadID : SV_DispatchThreadID,
                       uint3 groupThreadID : SV_GroupThreadID) {
    // 加载到共享内存（包含边界）
    int2 texCoord = dispatchThreadID.xy;
    int2 localCoord = groupThreadID.xy + int2(2, 2); // 偏移以容纳边界

    SharedCache[localCoord.y][localCoord.x] = InputTexture[texCoord];

    // 加载边界
    if (groupThreadID.x < 2) {
        SharedCache[localCoord.y][groupThreadID.x] =
            InputTexture[texCoord + int2(-2, 0)];
    }
    if (groupThreadID.x >= 14) {
        SharedCache[localCoord.y][groupThreadID.x + 4] =
            InputTexture[texCoord + int2(2, 0)];
    }

    // 同步
    GroupMemoryBarrierWithGroupSync();

    // 水平模糊
    float4 result = SharedCache[localCoord.y][localCoord.x] * GaussianWeights[0];

    for (int i = 1; i < 5; i++) {
        result += SharedCache[localCoord.y][localCoord.x - i] * GaussianWeights[i];
        result += SharedCache[localCoord.y][localCoord.x + i] * GaussianWeights[i];
    }

    OutputTexture[texCoord] = result;
}

[numthreads(16, 16, 1)]
void CSBlurVertical(uint3 dispatchThreadID : SV_DispatchThreadID,
                     uint3 groupThreadID : SV_GroupThreadID) {
    int2 texCoord = dispatchThreadID.xy;
    int2 localCoord = groupThreadID.xy + int2(2, 2);

    SharedCache[localCoord.y][localCoord.x] = InputTexture[texCoord];

    if (groupThreadID.y < 2) {
        SharedCache[groupThreadID.y][localCoord.x] =
            InputTexture[texCoord + int2(0, -2)];
    }
    if (groupThreadID.y >= 14) {
        SharedCache[groupThreadID.y + 4][localCoord.x] =
            InputTexture[texCoord + int2(0, 2)];
    }

    GroupMemoryBarrierWithGroupSync();

    float4 result = SharedCache[localCoord.y][localCoord.x] * GaussianWeights[0];

    for (int i = 1; i < 5; i++) {
        result += SharedCache[localCoord.y - i][localCoord.x] * GaussianWeights[i];
        result += SharedCache[localCoord.y + i][localCoord.x] * GaussianWeights[i];
    }

    OutputTexture[texCoord] = result;
}
```

---

## 常见 Shader 效果实现

### 菲涅尔效果

```glsl
#version 330 core

in vec3 v_WorldPos;
in vec3 v_Normal;

uniform vec3 u_CameraPos;
uniform vec4 u_FresnelColor;
uniform float u_FresnelPower;
uniform float u_FresnelBias;
uniform float u_FresnelScale;

out vec4 FragColor;

void main() {
    vec3 N = normalize(v_Normal);
    vec3 V = normalize(u_CameraPos - v_WorldPos);

    // 基础菲涅尔
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), u_FresnelPower);

    // 带偏移和缩放的菲涅尔
    float fresnelAdvanced = u_FresnelBias + u_FresnelScale * pow(1.0 - dot(N, V), u_FresnelPower);
    fresnelAdvanced = clamp(fresnelAdvanced, 0.0, 1.0);

    vec3 baseColor = vec3(0.2, 0.3, 0.4);
    vec3 finalColor = mix(baseColor, u_FresnelColor.rgb, fresnelAdvanced);

    FragColor = vec4(finalColor, 1.0);
}
```

### 溶解效果

```glsl
#version 330 core

in vec2 v_TexCoord;
in vec3 v_WorldPos;

uniform sampler2D u_MainTex;
uniform sampler2D u_NoiseTex;
uniform float u_DissolveThreshold;  // 0-1，控制溶解进度
uniform vec3 u_EdgeColor;
uniform float u_EdgeWidth;

out vec4 FragColor;

void main() {
    vec4 mainColor = texture(u_MainTex, v_TexCoord);
    float noise = texture(u_NoiseTex, v_TexCoord).r;

    // 溶解判断
    float dissolve = noise - u_DissolveThreshold;

    if (dissolve < 0.0) {
        discard;  // 完全溶解的部分
    }

    // 边缘发光
    float edge = smoothstep(0.0, u_EdgeWidth, dissolve);
    vec3 edgeGlow = u_EdgeColor * (1.0 - edge) * 2.0;

    vec3 finalColor = mainColor.rgb + edgeGlow;
    FragColor = vec4(finalColor, mainColor.a);
}
```

### 全息效果

```glsl
#version 330 core

in vec3 v_WorldPos;
in vec3 v_Normal;
in vec2 v_TexCoord;

uniform float u_Time;
uniform vec3 u_CameraPos;
uniform vec4 u_HoloColor;
uniform float u_ScanlineSpeed;
uniform float u_ScanlineCount;
uniform float u_FlickerSpeed;

out vec4 FragColor;

// 随机函数
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec3 N = normalize(v_Normal);
    vec3 V = normalize(u_CameraPos - v_WorldPos);

    // 菲涅尔边缘
    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0);

    // 扫描线
    float scanline = sin(v_WorldPos.y * u_ScanlineCount + u_Time * u_ScanlineSpeed);
    scanline = scanline * 0.5 + 0.5;
    scanline = pow(scanline, 2.0);

    // 闪烁
    float flicker = sin(u_Time * u_FlickerSpeed) * 0.5 + 0.5;
    flicker = mix(0.8, 1.0, flicker);

    // 噪点
    float noise = random(v_TexCoord + vec2(u_Time * 0.1)) * 0.1;

    // 组合
    float alpha = fresnel + scanline * 0.3 + noise;
    alpha *= flicker;
    alpha = clamp(alpha, 0.0, 1.0);

    // 扫描波纹
    float wave = fract((v_WorldPos.y - u_Time * 2.0) * 0.5);
    wave = 1.0 - abs(wave * 2.0 - 1.0);
    wave = pow(wave, 8.0);

    vec3 color = u_HoloColor.rgb + vec3(wave * 0.5);

    FragColor = vec4(color, alpha * u_HoloColor.a);
}
```

### 水面着色器

```glsl
#version 330 core

in vec3 v_WorldPos;
in vec2 v_TexCoord;
in vec4 v_ScreenPos;

uniform sampler2D u_NormalMap1;
uniform sampler2D u_NormalMap2;
uniform sampler2D u_ReflectionTex;
uniform sampler2D u_RefractionTex;
uniform sampler2D u_DepthTex;

uniform float u_Time;
uniform vec3 u_CameraPos;
uniform vec3 u_LightDir;
uniform vec4 u_ShallowColor;
uniform vec4 u_DeepColor;
uniform float u_WaveSpeed;
uniform float u_WaveScale;
uniform float u_Distortion;

out vec4 FragColor;

void main() {
    // 动态 UV
    vec2 uv1 = v_TexCoord * u_WaveScale + vec2(u_Time * u_WaveSpeed, 0.0);
    vec2 uv2 = v_TexCoord * u_WaveScale * 0.7 + vec2(0.0, u_Time * u_WaveSpeed * 0.7);

    // 采样并混合法线
    vec3 normal1 = texture(u_NormalMap1, uv1).xyz * 2.0 - 1.0;
    vec3 normal2 = texture(u_NormalMap2, uv2).xyz * 2.0 - 1.0;
    vec3 normal = normalize(normal1 + normal2);

    // 屏幕空间坐标
    vec2 screenUV = v_ScreenPos.xy / v_ScreenPos.w * 0.5 + 0.5;
    vec2 distortedUV = screenUV + normal.xy * u_Distortion;

    // 采样反射和折射
    vec3 reflection = texture(u_ReflectionTex, vec2(distortedUV.x, 1.0 - distortedUV.y)).rgb;
    vec3 refraction = texture(u_RefractionTex, distortedUV).rgb;

    // 水深
    float depth = texture(u_DepthTex, distortedUV).r;
    float waterDepth = clamp((depth - v_ScreenPos.z / v_ScreenPos.w) * 10.0, 0.0, 1.0);

    // 基于深度的颜色
    vec3 waterColor = mix(u_ShallowColor.rgb, u_DeepColor.rgb, waterDepth);
    refraction = mix(refraction, waterColor, waterDepth * 0.5);

    // 菲涅尔
    vec3 viewDir = normalize(u_CameraPos - v_WorldPos);
    float fresnel = pow(1.0 - max(dot(vec3(0, 1, 0), viewDir), 0.0), 4.0);

    // 混合反射和折射
    vec3 color = mix(refraction, reflection, fresnel);

    // 高光
    vec3 halfDir = normalize(viewDir - u_LightDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 256.0);
    color += vec3(spec);

    FragColor = vec4(color, 1.0);
}
```

---

## Shader 调试技巧

### 可视化调试

```glsl
#version 330 core

in vec3 v_WorldPos;
in vec3 v_Normal;
in vec2 v_TexCoord;

uniform int u_DebugMode;  // 调试模式选择
uniform sampler2D u_MainTex;
uniform sampler2D u_NormalMap;

out vec4 FragColor;

void main() {
    vec3 color = vec3(0.0);

    switch (u_DebugMode) {
        case 0: // 正常渲染
            color = texture(u_MainTex, v_TexCoord).rgb;
            break;

        case 1: // 显示法线（世界空间）
            color = normalize(v_Normal) * 0.5 + 0.5;
            break;

        case 2: // 显示法线贴图
            color = texture(u_NormalMap, v_TexCoord).rgb;
            break;

        case 3: // 显示 UV 坐标
            color = vec3(v_TexCoord, 0.0);
            break;

        case 4: // 显示 UV 棋盘格（检查 UV 是否正确）
            vec2 checker = floor(v_TexCoord * 10.0);
            color = vec3(mod(checker.x + checker.y, 2.0));
            break;

        case 5: // 显示世界位置
            color = fract(v_WorldPos);
            break;

        case 6: // 显示深度
            float depth = gl_FragCoord.z;
            depth = (2.0 * 0.1) / (100.0 + 0.1 - depth * (100.0 - 0.1)); // 线性化
            color = vec3(depth);
            break;

        case 7: // 显示 Mip 级别
            vec2 dx = dFdx(v_TexCoord * 512.0);
            vec2 dy = dFdy(v_TexCoord * 512.0);
            float mipLevel = log2(max(length(dx), length(dy)));
            color = vec3(mipLevel / 10.0, 1.0 - mipLevel / 10.0, 0.0);
            break;
    }

    FragColor = vec4(color, 1.0);
}
```

### 性能分析

```hlsl
// 使用颜色编码显示着色器复杂度
float4 PSDebugComplexity(VertexOutput input) : SV_TARGET {
    // 计算某些复杂操作
    float complexity = 0;

    // 纹理采样数
    float4 tex1 = MainTex.Sample(LinearSampler, input.TexCoord);
    complexity += 1;

    float4 tex2 = NormalTex.Sample(LinearSampler, input.TexCoord);
    complexity += 1;

    // 数学运算
    for (int i = 0; i < LightCount; i++) {
        // 光照计算
        complexity += 5; // 假设每个光源增加5单位复杂度
    }

    // 颜色编码复杂度
    float normalizedComplexity = complexity / 50.0; // 假设最大复杂度50

    // 低复杂度：绿色，高复杂度：红色
    float3 debugColor = lerp(
        float3(0, 1, 0),  // 绿色
        float3(1, 0, 0),  // 红色
        saturate(normalizedComplexity)
    );

    return float4(debugColor, 1);
}

// Overdraw 可视化
// 使用透明叠加显示重绘次数
float4 PSDebugOverdraw(VertexOutput input) : SV_TARGET {
    return float4(0.1, 0.1, 0.1, 0.1); // 每次绘制增加10%亮度
}
```

### 常见问题排查

```glsl
// 检查 NaN 和 Inf
vec3 safeNormalize(vec3 v) {
    float len = length(v);
    if (len < 0.0001) {
        return vec3(0.0, 1.0, 0.0); // 返回默认向上向量
    }
    return v / len;
}

// 检查数值是否有效
bool isValidNumber(float x) {
    return !isnan(x) && !isinf(x);
}

vec3 debugNaN(vec3 value, vec3 replacement) {
    if (any(isnan(value)) || any(isinf(value))) {
        return replacement; // 或者返回警告颜色 vec3(1, 0, 1)
    }
    return value;
}

// 范围检查
float debugRange(float value, float minVal, float maxVal) {
    if (value < minVal) return 0.0; // 蓝色通道
    if (value > maxVal) return 1.0; // 红色通道
    return (value - minVal) / (maxVal - minVal); // 绿色通道
}

void main() {
    // ... 计算 ...

    // 调试输出
    #ifdef DEBUG_MODE
        // 检查法线是否归一化
        float normalLength = length(v_Normal);
        if (abs(normalLength - 1.0) > 0.01) {
            FragColor = vec4(1, 0, 1, 1); // 品红色警告
            return;
        }

        // 检查 UV 范围
        if (v_TexCoord.x < 0.0 || v_TexCoord.x > 1.0 ||
            v_TexCoord.y < 0.0 || v_TexCoord.y > 1.0) {
            FragColor = vec4(1, 0, 0, 1); // 红色警告
            return;
        }
    #endif

    FragColor = vec4(finalColor, 1.0);
}
```

---

## 面试要点

### 基础概念题

**Q1: 解释 GPU 渲染管线的主要阶段**

```
1. 输入装配（Input Assembly）
   - 从顶点缓冲区读取顶点数据
   - 从索引缓冲区确定图元拓扑

2. 顶点着色器（Vertex Shader）
   - 每顶点执行，变换顶点位置
   - 计算顶点属性（法线、纹理坐标等）

3. 曲面细分（Tessellation）- 可选
   - 控制着色器：确定细分级别
   - 曲面细分器：生成新顶点
   - 评估着色器：计算新顶点位置

4. 几何着色器（Geometry Shader）- 可选
   - 每图元执行
   - 可以生成/删除图元

5. 光栅化（Rasterization）
   - 将图元转换为片元
   - 执行裁剪、背面剔除

6. 片元/像素着色器（Fragment/Pixel Shader）
   - 每片元执行
   - 计算最终颜色

7. 输出合并（Output Merger）
   - 深度测试、模板测试
   - 混合、写入帧缓冲
```

**Q2: GLSL 和 HLSL 的主要区别是什么？**

```
语法差异：
- 矩阵乘法：GLSL 用 *，HLSL 用 mul()
- 线性插值：GLSL 用 mix()，HLSL 用 lerp()
- 小数部分：GLSL 用 fract()，HLSL 用 frac()
- 纹理采样：GLSL 用 texture()，HLSL 用 tex.Sample()

矩阵存储：
- GLSL：列主序
- HLSL：行主序（通常）

变量限定符：
- GLSL：in, out, uniform
- HLSL：语义（POSITION, TEXCOORD等）

资源绑定：
- GLSL：layout(binding = 0)
- HLSL：register(t0), register(b0)
```

**Q3: 什么是 Shader 变体？如何管理？**

```hlsl
// Shader 变体通过预处理器宏控制
#pragma multi_compile _ SHADOWS_ON
#pragma multi_compile _ FOG_LINEAR FOG_EXP FOG_EXP2
#pragma shader_feature _NORMALMAP

// 条件编译
#ifdef SHADOWS_ON
    float shadow = CalculateShadow(input.shadowCoord);
#else
    float shadow = 1.0;
#endif

// 变体数量 = 各组选项数的乘积
// 上例：2 * 3 * 2 = 12 个变体

// 优化策略：
// 1. 使用 shader_feature 替代 multi_compile（只编译实际使用的）
// 2. 合并相似功能减少变体
// 3. 运行时按需加载变体
```

### 性能优化题

**Q4: 如何优化 Shader 性能？**

```
1. 减少分支
   // 避免
   if (condition) { a = x; } else { a = y; }
   // 使用
   a = lerp(y, x, condition);

2. 减少纹理采样
   - 合并纹理通道
   - 使用纹理数组
   - 降低采样频率

3. 精度优化
   - 使用 half/mediump 代替 float/highp
   - 只在必要时使用高精度

4. 避免动态数组索引
   // 避免
   color = colors[dynamicIndex];
   // 使用展开的 if-else 或查找表

5. 预计算
   - 将复杂计算移到顶点着色器
   - 使用 LUT 纹理替代复杂数学

6. 减少 Overdraw
   - 前后排序
   - 使用 Early-Z
   - 适当的 LOD
```

**Q5: 什么是 GPU 分支预测？如何避免分支开销？**

```
GPU 特点：
- SIMD 架构，线程以 warp/wavefront 为单位执行
- 分支会导致 warp 内线程分化
- 分化的线程必须串行执行两个分支

避免策略：
// 1. 使用数学替代分支
// 避免
if (x > 0) y = a; else y = b;
// 使用
y = step(0, x) * a + step(x, 0) * b;
// 或
y = x > 0 ? a : b;  // 编译器可能优化

// 2. 使用 saturate/clamp
// 避免
if (x < 0) x = 0;
if (x > 1) x = 1;
// 使用
x = saturate(x);

// 3. 展开循环
#pragma unroll
for (int i = 0; i < 4; i++) { ... }
```

### 高级题

**Q6: 解释 PBR（基于物理的渲染）的核心概念**

```
核心方程（Cook-Torrance BRDF）：
f = kD * fLambert + kS * fCookTorrance

其中：
- kD：漫反射系数（1 - metallic）
- kS：镜面反射系数（fresnel）
- fLambert = albedo / PI
- fCookTorrance = D * F * G / (4 * NdotV * NdotL)

三个核心函数：
1. D（法线分布函数/NDF）：微表面朝向分布
   - GGX/Trowbridge-Reitz 最常用

2. F（菲涅尔方程）：反射率随视角变化
   - Schlick 近似：F0 + (1-F0) * pow(1-cosTheta, 5)

3. G（几何遮蔽函数）：微表面自遮挡
   - Smith-GGX

关键参数：
- Albedo：基础颜色
- Metallic：金属度（影响 F0 和漫反射）
- Roughness：粗糙度（影响 D 和 G）
- Normal：表面法线
- AO：环境光遮蔽
```

**Q7: 如何实现屏幕空间反射（SSR）？**

```
SSR 基本步骤：

1. 计算反射方向
   vec3 viewDir = normalize(positionVS);
   vec3 reflectDir = reflect(viewDir, normalVS);

2. 光线步进（Ray Marching）
   vec3 currentPos = positionVS;
   for (int i = 0; i < maxSteps; i++) {
       currentPos += reflectDir * stepSize;

       // 投影到屏幕空间
       vec4 projPos = projection * vec4(currentPos, 1);
       vec2 screenUV = projPos.xy / projPos.w * 0.5 + 0.5;

       // 采样深度
       float sampledDepth = texture(depthTex, screenUV).r;
       float rayDepth = -currentPos.z;

       // 相交测试
       if (rayDepth > sampledDepth) {
           // 找到相交点，进行二分搜索精确化
           return texture(colorTex, screenUV);
       }
   }

3. 优化技术：
   - 层次化追踪（Hi-Z）
   - 二分搜索精确化
   - 时间滤波降噪
   - 边缘渐隐处理
```

### 常见陷阱

```glsl
// 1. 精度问题
// 避免在片元着色器中用 highp 进行大量计算
// 移动端尤其注意 mediump 精度

// 2. 法线插值后未归一化
vec3 normal = normalize(v_Normal); // 必须重新归一化

// 3. 深度精度问题
// 非线性深度在远处精度很低
// 使用反向深度缓冲或对数深度

// 4. Gamma 校正遗漏
// 输入纹理：sRGB -> Linear
color = pow(texColor, 2.2);
// 输出：Linear -> sRGB
finalColor = pow(color, 1.0/2.2);

// 5. 矩阵乘法顺序
// GLSL：列主序，右乘
gl_Position = projection * view * model * vec4(pos, 1);
// HLSL：行主序，左乘（或转置后右乘）
output.Position = mul(mul(mul(float4(pos, 1), model), view), projection);
```

---

## 学习资源

### 推荐书籍

1. **《Real-Time Rendering》** - 图形学圣经，全面覆盖渲染技术
2. **《GPU Gems》系列** - NVIDIA 出品的经典 Shader 技术合集
3. **《Physically Based Rendering》** - PBR 权威参考
4. **《The Book of Shaders》** - 免费在线教程，适合入门

### 在线资源

- [Shadertoy](https://www.shadertoy.com/) - Shader 效果分享平台
- [The Book of Shaders](https://thebookofshaders.com/) - 交互式 GLSL 教程
- [Learn OpenGL](https://learnopengl.com/) - OpenGL 和 Shader 教程
- [Catlike Coding](https://catlikecoding.com/unity/tutorials/) - Unity Shader 教程

### 学习路径建议

```
入门阶段：
1. 理解渲染管线基本概念
2. 学习 GLSL/HLSL 语法
3. 编写简单的顶点和片元着色器
4. 实现基础光照（Lambert、Phong）

进阶阶段：
1. 学习 PBR 原理和实现
2. 掌握法线贴图、视差贴图
3. 实现后处理效果（模糊、Bloom、色调映射）
4. 学习计算着色器

高级阶段：
1. 阴影技术（CSM、VSM、PCSS）
2. 全局光照（SSAO、SSR、RTGI）
3. 体积渲染、大气散射
4. GPU 粒子系统
5. 光线追踪着色器
```

---

## 总结

Shader 编程是图形开发的核心技能，需要同时掌握：

1. **图形学基础**：理解光照模型、空间变换、投影矩阵
2. **Shader 语言**：熟练使用 GLSL/HLSL 语法和内置函数
3. **GPU 架构**：了解并行执行模型，优化性能
4. **数学知识**：向量运算、矩阵变换、三角函数
5. **调试技巧**：可视化调试、性能分析

通过不断实践和学习，你将能够创造出令人惊叹的视觉效果，从简单的颜色渐变到复杂的 PBR 材质、从后处理特效到物理模拟。Shader 编程的魅力在于它直接控制每一个像素的呈现，是将数学之美转化为视觉艺术的桥梁。
