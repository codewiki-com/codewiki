---
title: 图形渲染管线深入解析
description: 理解现代图形渲染管线：从顶点处理到像素输出
track: gamedev
section: graphics
difficulty: advanced
tags:
  - rendering pipeline
  - graphics programming
  - GPU
  - shaders
status: imported
origin: old/src/content/docs/gamedev/rendering-pipeline.zh.md
divergence: 0.25
issues: []
legacy:
  category: GameDev
  subcategory: Graphics
  order: 10
  lastUpdated: 2026-01-07
---

## 概念概述

图形渲染管线是图形处理单元（GPU）将 3D 场景数据转换为显示在屏幕上的 2D 图像所执行的一系列步骤。理解这个管线对于任何从事游戏开发、实时图形或 GPU 编程的人来说都是基础性的。

### 历史背景

渲染管线在过去几十年中有了显著的发展：

- **固定功能管线（1990 年代）**：早期 GPU 如 3dfx Voodoo 提供固定操作。开发者对顶点如何变换或像素如何着色的控制有限。
- **可编程管线（2001+）**：随着 NVIDIA GeForce 3 和 DirectX 8，顶点和像素着色器可以使用类似汇编的语言进行编程。
- **统一着色器架构（2006+）**：现代 GPU 使用统一的着色器处理器，可以执行顶点、几何和片段着色器，实现更好的资源利用。
- **计算着色器（2009+）**：DirectX 11 和 OpenGL 4.3 在传统图形管线之外引入了通用 GPU 计算。

### 它解决了哪些问题

渲染管线解决了几个核心挑战：

1. **坐标变换**：将 3D 世界坐标转换为 2D 屏幕位置
2. **可见性判定**：决定哪些物体或物体的哪些部分可见
3. **表面外观**：为每个像素计算颜色、光照和材质属性
4. **性能**：在数千个 GPU 核心上高效地并行化工作
5. **内存管理**：处理纹理、顶点数据和帧缓冲区

---

## 管线架构概述

现代图形管线由几个阶段组成，有些是固定功能的，有些是可编程的：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        应用程序阶段（CPU）                                   │
│  场景管理、剔除、绘制调用、状态设置                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           几何处理                                           │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │    顶点      │ → │    曲面      │ → │    几何      │ → │    裁剪      │  │
│  │   着色器    │   │ 细分(可选)  │   │   着色器    │   │              │  │
│  │ [可编程]    │   │  [可编程]   │   │  [可编程]   │   │   [固定]     │  │
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             光栅化                                           │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                     │
│  │    图元      │ → │   光栅化器   │ → │    早期      │                     │
│  │    装配      │   │              │   │  深度测试   │                     │
│  │   [固定]     │   │   [固定]     │   │   [固定]    │                     │
│  └──────────────┘   └──────────────┘   └──────────────┘                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           像素处理                                           │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │    片段      │ → │   深度/     │ → │    混合      │ → │    帧        │  │
│  │   着色器    │   │ 模板测试    │   │              │   │   缓冲区     │  │
│  │ [可编程]    │   │   [固定]    │   │   [固定]     │   │              │  │
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 顶点处理阶段

顶点着色器是管线中第一个可编程阶段。它独立处理每个顶点，变换位置并计算每顶点属性。

### 顶点着色器职责

1. **空间变换**：模型 → 世界 → 视图 → 裁剪空间
2. **光照计算**：每顶点光照（Gouraud 着色）
3. **纹理坐标生成**：计算或变换 UV 坐标
4. **骨骼动画**：为蒙皮网格应用骨骼变换
5. **属性插值设置**：为光栅化器插值准备数据

### 坐标空间

```
┌─────────────┐    模型      ┌─────────────┐    视图       ┌─────────────┐
│    对象     │   矩阵       │    世界     │   矩阵       │    视图     │
│    空间     │ ───────────→  │    空间     │ ───────────→  │    空间     │
│   (局部)    │               │   (全局)    │               │   (相机)    │
└─────────────┘               └─────────────┘               └─────────────┘
                                                                   │
                    ┌─────────────┐    视口      ┌─────────────┐ │ 投影
                    │    屏幕     │   变换       │    NDC      │ │  矩阵
                    │    空间     │ ◀───────────── │    空间     │◀┘
                    │   (像素)    │                │ (-1 到 +1)  │
                    └─────────────┘                └─────────────┘
```

### 基础顶点着色器（GLSL）

```glsl
#version 450 core

// 顶点属性（输入）
layout(location = 0) in vec3 a_Position;
layout(location = 1) in vec3 a_Normal;
layout(location = 2) in vec2 a_TexCoord;
layout(location = 3) in vec4 a_Color;

// Uniform 缓冲区（对绘制调用中的所有顶点保持不变）
layout(std140, binding = 0) uniform CameraData {
    mat4 u_ViewProjection;
    mat4 u_View;
    vec3 u_CameraPosition;
};

layout(std140, binding = 1) uniform ObjectData {
    mat4 u_Model;
    mat4 u_NormalMatrix;
};

// 输出到片段着色器（将被插值）
out VS_OUT {
    vec3 FragPos;
    vec3 Normal;
    vec2 TexCoord;
    vec4 Color;
} vs_out;

void main() {
    // 将位置变换到世界空间
    vec4 worldPos = u_Model * vec4(a_Position, 1.0);
    vs_out.FragPos = worldPos.xyz;

    // 将法线变换到世界空间（使用法线矩阵处理非均匀缩放）
    vs_out.Normal = normalize(mat3(u_NormalMatrix) * a_Normal);

    // 传递纹理坐标和顶点颜色
    vs_out.TexCoord = a_TexCoord;
    vs_out.Color = a_Color;

    // 变换到裁剪空间（必需输出）
    gl_Position = u_ViewProjection * worldPos;
}
```

### 顶点着色器中的骨骼动画

```glsl
#version 450 core

layout(location = 0) in vec3 a_Position;
layout(location = 1) in vec3 a_Normal;
layout(location = 2) in vec2 a_TexCoord;
layout(location = 3) in ivec4 a_BoneIDs;      // 每顶点最多 4 根骨骼
layout(location = 4) in vec4 a_BoneWeights;   // 每根骨骼的权重

const int MAX_BONES = 128;
uniform mat4 u_BoneTransforms[MAX_BONES];
uniform mat4 u_Model;
uniform mat4 u_ViewProjection;

out vec3 v_Normal;
out vec2 v_TexCoord;
out vec3 v_FragPos;

void main() {
    // 计算骨骼变换矩阵
    mat4 boneTransform = mat4(0.0);

    for (int i = 0; i < 4; i++) {
        if (a_BoneIDs[i] >= 0) {
            boneTransform += u_BoneTransforms[a_BoneIDs[i]] * a_BoneWeights[i];
        }
    }

    // 先应用骨骼变换，再应用模型变换
    vec4 localPos = boneTransform * vec4(a_Position, 1.0);
    vec4 worldPos = u_Model * localPos;

    // 变换法线
    mat3 normalMatrix = mat3(transpose(inverse(u_Model * boneTransform)));
    v_Normal = normalize(normalMatrix * a_Normal);

    v_TexCoord = a_TexCoord;
    v_FragPos = worldPos.xyz;

    gl_Position = u_ViewProjection * worldPos;
}
```

---

## 图元装配

顶点处理后，GPU 将顶点装配成几何图元：点、线或三角形。

### 图元类型

```
点 (GL_POINTS)              线 (GL_LINES)              线带 (GL_LINE_STRIP)
    •   •   •                  •───•   •───•              •───•───•───•
    0   1   2                  0   1   2   3              0   1   2   3

三角形 (GL_TRIANGLES)       三角形带                    三角形扇
    •───•   •───•              •───•───•───•              •───•───•
   /   \ / \   \             / \ / \ / \ /              │ \ │ / │
  •     •   •   •            •───•───•───•              •───•───•
  0,1,2  3,4,5              0   1   2   3   4              (中心在 0)
```

### 面剔除

面剔除消除背向相机的三角形，对于封闭网格可以减少约 50% 的片段着色器工作量。

```cpp
// OpenGL 面剔除设置
glEnable(GL_CULL_FACE);
glCullFace(GL_BACK);           // 剔除背面三角形
glFrontFace(GL_CCW);           // 逆时针 = 正面

// 绕序决定正面/背面
//
// 逆时针（正面）         顺时针（背面 - 被剔除）
//         2                           2
//        /\                          /\
//       /  \                        /  \
//      /    \                      /    \
//     0──────1                    1──────0
```

---

## 曲面细分阶段（可选）

曲面细分动态地细分几何体，在 GPU 上实现细节层次和位移贴图。

### 曲面细分管线

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   曲面细分   │ → │   曲面细分   │ → │   曲面细分   │
│   控制      │   │    图元      │   │    求值      │
│   着色器    │   │   生成器    │   │    着色器    │
│  [可编程]   │   │   [固定]    │   │  [可编程]   │
└──────────────┘   └──────────────┘   └──────────────┘
```

### 曲面细分控制着色器（TCS）

```glsl
#version 450 core

layout(vertices = 3) out;  // 每个 patch 输出 3 个控制点

in VS_OUT {
    vec3 FragPos;
    vec3 Normal;
    vec2 TexCoord;
} tcs_in[];

out TCS_OUT {
    vec3 FragPos;
    vec3 Normal;
    vec2 TexCoord;
} tcs_out[];

uniform vec3 u_CameraPosition;
uniform float u_TessellationLevel;

float calculateTessLevel(vec3 p0, vec3 p1) {
    // 基于距离的曲面细分
    vec3 midpoint = (p0 + p1) * 0.5;
    float distance = length(u_CameraPosition - midpoint);

    // 距离越近，细分越多
    float level = clamp(u_TessellationLevel / distance, 1.0, 64.0);
    return level;
}

void main() {
    // 传递控制点数据
    tcs_out[gl_InvocationID].FragPos = tcs_in[gl_InvocationID].FragPos;
    tcs_out[gl_InvocationID].Normal = tcs_in[gl_InvocationID].Normal;
    tcs_out[gl_InvocationID].TexCoord = tcs_in[gl_InvocationID].TexCoord;

    // 计算曲面细分级别（只需要一个调用执行此操作）
    if (gl_InvocationID == 0) {
        vec3 p0 = tcs_in[0].FragPos;
        vec3 p1 = tcs_in[1].FragPos;
        vec3 p2 = tcs_in[2].FragPos;

        // 外部曲面细分级别（边缘细分）
        gl_TessLevelOuter[0] = calculateTessLevel(p1, p2);
        gl_TessLevelOuter[1] = calculateTessLevel(p2, p0);
        gl_TessLevelOuter[2] = calculateTessLevel(p0, p1);

        // 内部曲面细分级别
        gl_TessLevelInner[0] = (gl_TessLevelOuter[0] +
                                gl_TessLevelOuter[1] +
                                gl_TessLevelOuter[2]) / 3.0;
    }
}
```

### 曲面细分求值着色器（TES）

```glsl
#version 450 core

layout(triangles, equal_spacing, ccw) in;

in TCS_OUT {
    vec3 FragPos;
    vec3 Normal;
    vec2 TexCoord;
} tes_in[];

out TES_OUT {
    vec3 FragPos;
    vec3 Normal;
    vec2 TexCoord;
} tes_out;

uniform mat4 u_ViewProjection;
uniform sampler2D u_DisplacementMap;
uniform float u_DisplacementScale;

vec3 interpolate3(vec3 v0, vec3 v1, vec3 v2) {
    return gl_TessCoord.x * v0 + gl_TessCoord.y * v1 + gl_TessCoord.z * v2;
}

vec2 interpolate2(vec2 v0, vec2 v1, vec2 v2) {
    return gl_TessCoord.x * v0 + gl_TessCoord.y * v1 + gl_TessCoord.z * v2;
}

void main() {
    // 使用重心坐标插值属性
    vec3 fragPos = interpolate3(tes_in[0].FragPos, tes_in[1].FragPos, tes_in[2].FragPos);
    vec3 normal = normalize(interpolate3(tes_in[0].Normal, tes_in[1].Normal, tes_in[2].Normal));
    vec2 texCoord = interpolate2(tes_in[0].TexCoord, tes_in[1].TexCoord, tes_in[2].TexCoord);

    // 应用位移贴图
    float displacement = texture(u_DisplacementMap, texCoord).r;
    fragPos += normal * displacement * u_DisplacementScale;

    tes_out.FragPos = fragPos;
    tes_out.Normal = normal;
    tes_out.TexCoord = texCoord;

    gl_Position = u_ViewProjection * vec4(fragPos, 1.0);
}
```

---

## 几何着色器（可选）

几何着色器可以创建或销毁图元，实现粒子系统、线框渲染和阴影体积挤出等效果。

### 线框渲染的几何着色器

```glsl
#version 450 core

layout(triangles) in;
layout(line_strip, max_vertices = 6) out;

in VS_OUT {
    vec3 FragPos;
    vec3 Normal;
} gs_in[];

out vec3 g_FragPos;

void main() {
    // 发射线框边
    for (int i = 0; i < 3; i++) {
        g_FragPos = gs_in[i].FragPos;
        gl_Position = gl_in[i].gl_Position;
        EmitVertex();

        g_FragPos = gs_in[(i + 1) % 3].FragPos;
        gl_Position = gl_in[(i + 1) % 3].gl_Position;
        EmitVertex();

        EndPrimitive();
    }
}
```

### 公告板粒子的几何着色器

```glsl
#version 450 core

layout(points) in;
layout(triangle_strip, max_vertices = 4) out;

in VS_OUT {
    vec4 Color;
    float Size;
} gs_in[];

out GS_OUT {
    vec2 TexCoord;
    vec4 Color;
} gs_out;

uniform mat4 u_Projection;
uniform vec3 u_CameraRight;
uniform vec3 u_CameraUp;

void main() {
    vec3 center = gl_in[0].gl_Position.xyz;
    float size = gs_in[0].Size;
    vec4 color = gs_in[0].Color;

    // 计算公告板角点
    vec3 right = u_CameraRight * size;
    vec3 up = u_CameraUp * size;

    // 左下
    vec3 pos = center - right - up;
    gl_Position = u_Projection * vec4(pos, 1.0);
    gs_out.TexCoord = vec2(0.0, 0.0);
    gs_out.Color = color;
    EmitVertex();

    // 右下
    pos = center + right - up;
    gl_Position = u_Projection * vec4(pos, 1.0);
    gs_out.TexCoord = vec2(1.0, 0.0);
    gs_out.Color = color;
    EmitVertex();

    // 左上
    pos = center - right + up;
    gl_Position = u_Projection * vec4(pos, 1.0);
    gs_out.TexCoord = vec2(0.0, 1.0);
    gs_out.Color = color;
    EmitVertex();

    // 右上
    pos = center + right + up;
    gl_Position = u_Projection * vec4(pos, 1.0);
    gs_out.TexCoord = vec2(1.0, 1.0);
    gs_out.Color = color;
    EmitVertex();

    EndPrimitive();
}
```

---

## 裁剪和屏幕映射

### 裁剪过程

裁剪移除视锥体外部的图元部分。这发生在裁剪空间（投影之后，透视除法之前）。

```
                    近平面
                        │
              ┌─────────┼─────────┐
             /│         │         │\
            / │   视锥  │ 体      │ \
           /  │         │         │  \
          /   │    ┌────┼────┐    │   \
         /    │    │    │    │    │    \
        /     │    │ 可见 │    │     \
       /      │    │    │    │    │      \
      /       │    └────┼────┘    │       \
     ╱        │         │         │        ╲
    ╱─────────┼─────────┼─────────┼─────────╲
              │         │         │
          相机      远平面

图元对 6 个视锥体平面进行裁剪：
- 近和远
- 左和右
- 上和下
```

### 透视除法和 NDC

```glsl
// 顶点着色器输出 gl_Position 后（裁剪坐标）：
// clip_coords = (x, y, z, w)

// GPU 执行透视除法：
// ndc_coords = (x/w, y/w, z/w)
// 范围：x, y 为 [-1, 1]，z 为 [0, 1] 或 [-1, 1]（取决于 API）

// 视口变换到屏幕坐标：
// screen_x = (ndc_x + 1) * 0.5 * viewport_width + viewport_x
// screen_y = (ndc_y + 1) * 0.5 * viewport_height + viewport_y
```

---

## 光栅化

光栅化将矢量图元转换为离散的片段（潜在像素）。这是一个固定功能阶段，确定每个图元覆盖哪些像素。

### 三角形光栅化算法

```
三角形设置：
1. 为每条边计算边缘方程
2. 计算三角形的边界框
3. 对于边界框中的每个像素：
   - 测试像素中心是否在所有三条边内
   - 如果在内部，生成带有插值属性的片段

边缘方程：
E(x, y) = (y0 - y1) * x + (x1 - x0) * y + (x0 * y1 - x1 * y0)

如果满足以下条件，点在三角形内：
E0(x, y) >= 0 且 E1(x, y) >= 0 且 E2(x, y) >= 0
（假设一致的绕序）

      (x1, y1)
         /\
        /  \
       / P  \         P 在内部如果：
      /  •   \        - 在边 0-1 的正确侧
     /________\       - 在边 1-2 的正确侧
(x0, y0)    (x2, y2)  - 在边 2-0 的正确侧
```

### 属性插值

片段属性使用带透视校正的重心坐标进行插值：

```glsl
// 重心坐标 (w0, w1, w2) 之和为 1.0
// 透视正确插值：

// 对于每个顶点 i，计算：
// wi' = wi / clip_w[i]

// 插值属性：
// attr = (w0' * attr0 + w1' * attr1 + w2' * attr2) / (w0' + w1' + w2')

// GPU 自动为片段着色器中的 'in' 变量处理这个
```

---

## 片段着色

片段着色器（也称为像素着色器）为每个片段运行，计算最终颜色并可能修改深度。

### 带光照的基础片段着色器

```glsl
#version 450 core

in VS_OUT {
    vec3 FragPos;
    vec3 Normal;
    vec2 TexCoord;
    vec4 Color;
} fs_in;

out vec4 FragColor;

// 材质属性
uniform sampler2D u_AlbedoMap;
uniform sampler2D u_NormalMap;
uniform sampler2D u_MetallicRoughnessMap;
uniform sampler2D u_AOMap;

// 光照
struct Light {
    vec3 position;
    vec3 color;
    float intensity;
    float radius;
};

#define MAX_LIGHTS 16
uniform Light u_Lights[MAX_LIGHTS];
uniform int u_LightCount;
uniform vec3 u_CameraPosition;
uniform vec3 u_AmbientColor;

// PBR 常量
const float PI = 3.14159265359;

// 法线分布函数（GGX/Trowbridge-Reitz）
float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float nom = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / denom;
}

// 几何函数（Schlick-GGX）
float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

// 菲涅尔方程（Schlick 近似）
vec3 FresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

void main() {
    // 采样纹理
    vec3 albedo = pow(texture(u_AlbedoMap, fs_in.TexCoord).rgb, vec3(2.2)); // sRGB 到线性
    vec2 metallicRoughness = texture(u_MetallicRoughnessMap, fs_in.TexCoord).bg;
    float metallic = metallicRoughness.x;
    float roughness = metallicRoughness.y;
    float ao = texture(u_AOMap, fs_in.TexCoord).r;

    // 从法线贴图计算法线
    vec3 N = normalize(fs_in.Normal);
    // （切线空间法线贴图的法线映射代码放在这里）

    vec3 V = normalize(u_CameraPosition - fs_in.FragPos);

    // 计算法向入射时的反射率
    vec3 F0 = vec3(0.04); // 电介质的默认值
    F0 = mix(F0, albedo, metallic);

    // 反射率方程
    vec3 Lo = vec3(0.0);

    for (int i = 0; i < u_LightCount; i++) {
        // 计算每个光源的辐射度
        vec3 L = normalize(u_Lights[i].position - fs_in.FragPos);
        vec3 H = normalize(V + L);
        float distance = length(u_Lights[i].position - fs_in.FragPos);
        float attenuation = 1.0 / (distance * distance);
        vec3 radiance = u_Lights[i].color * u_Lights[i].intensity * attenuation;

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
        kD *= 1.0 - metallic; // 金属表面没有漫反射

        float NdotL = max(dot(N, L), 0.0);

        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    }

    // 环境光照
    vec3 ambient = u_AmbientColor * albedo * ao;

    vec3 color = ambient + Lo;

    // HDR 色调映射（Reinhard）
    color = color / (color + vec3(1.0));

    // 伽马校正
    color = pow(color, vec3(1.0 / 2.2));

    FragColor = vec4(color, 1.0);
}
```

### 法线贴图

```glsl
// 在顶点着色器中 - 计算 TBN 矩阵
vec3 T = normalize(mat3(u_Model) * a_Tangent);
vec3 N = normalize(mat3(u_Model) * a_Normal);
T = normalize(T - dot(T, N) * N);  // 重新正交化
vec3 B = cross(N, T);
mat3 TBN = mat3(T, B, N);

// 在片段着色器中 - 采样并变换法线
vec3 normalMapValue = texture(u_NormalMap, fs_in.TexCoord).rgb;
normalMapValue = normalMapValue * 2.0 - 1.0;  // [0,1] 到 [-1,1]
vec3 N = normalize(fs_in.TBN * normalMapValue);
```

---

## 深度测试

深度测试通过比较片段的深度值与深度缓冲区来确定哪些片段可见。

### 深度测试配置

```cpp
// 启用深度测试
glEnable(GL_DEPTH_TEST);

// 深度比较函数
glDepthFunc(GL_LESS);      // 如果片段深度 < 缓冲区深度则通过（默认）
// 其他选项：GL_LEQUAL, GL_GREATER, GL_GEQUAL, GL_EQUAL, GL_NOTEQUAL, GL_ALWAYS, GL_NEVER

// 深度写入
glDepthMask(GL_TRUE);      // 启用写入深度缓冲区
glDepthMask(GL_FALSE);     // 禁用（用于透明对象）

// 深度范围（NDC z 到缓冲区 z 映射）
glDepthRange(0.0, 1.0);    // 默认：近 = 0，远 = 1
```

### 深度缓冲区精度

```
线性与非线性深度：
━━━━━━━━━━━━━━━━━━━━━━━━━━━

透视投影创建非线性深度分布：
- 靠近相机有更高精度
- 远离相机精度较低（z-fighting 问题）

┌───────────────────────────────────────────────────┐
│  近                                          远  │
│  ├──┬──┬──┬──┬──┬───┬───┬────┬─────┬───────────┤  │
│  │  │  │  │  │  │   │   │    │     │           │  │
│  高精度              低精度                       │
└───────────────────────────────────────────────────┘

z-fighting 的解决方案：
1. 增加近平面距离
2. 使用反向 Z（近处 1.0，远处 0.0）
3. 使用对数深度缓冲区
4. 为贴花使用多边形偏移
```

### 反向 Z 技术

```glsl
// 在 C++ / OpenGL 中
glClipControl(GL_LOWER_LEFT, GL_ZERO_TO_ONE);  // 将深度范围改为 [0, 1]
glDepthFunc(GL_GREATER);                         // 反转比较
glClearDepth(0.0);                               // 清除为 0 而不是 1

// 修改投影矩阵
mat4 projection = perspectiveReverseZ(fov, aspect, nearPlane, farPlane);

// 结果：整个视图范围内更均匀的深度精度
```

---

## 模板测试

模板缓冲区支持遮罩操作，用于传送门、镜子和阴影体积等效果。

### 模板操作

```cpp
// 启用模板测试
glEnable(GL_STENCIL_TEST);

// 模板函数：(比较，参考值，掩码)
glStencilFunc(GL_EQUAL, 1, 0xFF);

// 模板操作：(模板失败，深度失败，两者都通过)
glStencilOp(GL_KEEP, GL_KEEP, GL_REPLACE);

// 模板掩码（写入掩码）
glStencilMask(0xFF);
```

### 示例：对象轮廓效果

```cpp
// 第 1 遍：绘制对象并写入模板
glStencilFunc(GL_ALWAYS, 1, 0xFF);
glStencilOp(GL_KEEP, GL_KEEP, GL_REPLACE);
glStencilMask(0xFF);
glDepthMask(GL_TRUE);
glClear(GL_STENCIL_BUFFER_BIT);

drawObject(normalShader);

// 第 2 遍：在模板 != 1 处绘制放大的对象
glStencilFunc(GL_NOTEQUAL, 1, 0xFF);
glStencilMask(0x00);
glDepthMask(GL_FALSE);

// 稍微放大以形成轮廓
object.setScale(1.05f);
drawObject(outlineShader);  // 纯色着色器

// 重置状态
object.setScale(1.0f);
glDepthMask(GL_TRUE);
glStencilMask(0xFF);
glDisable(GL_STENCIL_TEST);
```

---

## 混合

混合将片段颜色与现有帧缓冲区颜色结合，实现透明度和叠加效果。

### 混合方程

```
最终颜色 = (源颜色 * 源因子) [操作] (目标颜色 * 目标因子)

常见混合模式：
━━━━━━━━━━━━━━━━━━

Alpha 混合（标准透明度）：
  glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
  结果 = Src.rgb * Src.a + Dst.rgb * (1 - Src.a)

叠加混合（发光、火焰）：
  glBlendFunc(GL_SRC_ALPHA, GL_ONE);
  结果 = Src.rgb * Src.a + Dst.rgb

乘法混合（阴影、着色）：
  glBlendFunc(GL_DST_COLOR, GL_ZERO);
  结果 = Src.rgb * Dst.rgb

预乘 Alpha：
  glBlendFunc(GL_ONE, GL_ONE_MINUS_SRC_ALPHA);
  结果 = Src.rgb + Dst.rgb * (1 - Src.a)
```

### 顺序无关透明度（OIT）

传统 alpha 混合需要从后到前排序。OIT 技术避免了这一点：

```glsl
// 加权混合 OIT（McGuire 和 Bavoil，2013）

// 累积缓冲区片段着色器
layout(location = 0) out vec4 accumulation;  // RGBA16F
layout(location = 1) out float reveal;        // R16F

void main() {
    vec4 color = texture(u_AlbedoMap, v_TexCoord);
    color.a *= u_Alpha;

    // 权重函数
    float weight = clamp(pow(min(1.0, color.a * 10.0) + 0.01, 3.0) *
                         1e8 * pow(1.0 - gl_FragCoord.z * 0.9, 3.0), 1e-2, 3e3);

    accumulation = vec4(color.rgb * color.a, color.a) * weight;
    reveal = color.a;
}

// 合成着色器
void main() {
    vec4 accum = texture(u_AccumTexture, v_TexCoord);
    float reveal = texture(u_RevealTexture, v_TexCoord).r;

    // 平均颜色
    vec3 averageColor = accum.rgb / max(accum.a, 1e-5);

    FragColor = vec4(averageColor, 1.0 - reveal);
}
```

---

## 前向 vs. 延迟渲染

### 前向渲染

```
┌─────────────────────────────────────────────────────────────────────┐
│                        前向渲染                                     │
│                                                                      │
│  对于每个对象：                                                      │
│    对于影响对象的每个光源：                                          │
│      - 运行顶点着色器                                                │
│      - 运行片段着色器（计算光照）                                    │
│      - 混合结果                                                      │
│                                                                      │
│  复杂度：O(对象 × 光源)                                              │
│                                                                      │
│  优点：                                    缺点：                    │
│  + 实现简单                                - 多光源时开销大          │
│  + 容易支持透明度                          - 过度绘制浪费工作        │
│  + 内存使用较低                            - 每个对象需要所有        │
│  + MSAA 自然工作                             光照计算                │
└─────────────────────────────────────────────────────────────────────┘
```

### 延迟渲染

```
┌─────────────────────────────────────────────────────────────────────┐
│                        延迟渲染                                     │
│                                                                      │
│  第 1 遍 - 几何遍：                                                  │
│    对于每个对象：                                                    │
│      - 渲染到 G-Buffer（位置、法线、反照率等）                       │
│                                                                      │
│  第 2 遍 - 光照遍：                                                  │
│    对于每个光源：                                                    │
│      - 采样 G-Buffer                                                 │
│      - 计算光照贡献                                                  │
│      - 累积到输出                                                    │
│                                                                      │
│  复杂度：O(对象 + 光源 × 屏幕像素)                                   │
│                                                                      │
│  优点：                                    缺点：                    │
│  + 多光源时高效                            - 高内存带宽              │
│  + 无过度绘制浪费                          - 透明度困难              │
│  + 几何与光照解耦                          - 无 MSAA（需要 FXAA/TAA）│
│  + 容易添加光源类型                        - G-Buffer 内存占用       │
└─────────────────────────────────────────────────────────────────────┘
```

### G-Buffer 布局示例

```glsl
// G-Buffer 纹理（MRT - 多渲染目标）
layout(location = 0) out vec4 gPosition;        // RGB：世界位置，A：未使用
layout(location = 1) out vec4 gNormal;          // RGB：法线（编码），A：未使用
layout(location = 2) out vec4 gAlbedoSpec;      // RGB：反照率，A：高光强度
layout(location = 3) out vec4 gMetallicRoughness; // R：金属度，G：粗糙度，BA：未使用

// 几何遍片段着色器
void main() {
    gPosition = vec4(fs_in.FragPos, 1.0);

    // 八面体法线编码以获得更好的精度
    gNormal = vec4(encodeNormal(normalize(fs_in.Normal)), 0.0, 1.0);

    vec4 albedo = texture(u_AlbedoMap, fs_in.TexCoord);
    gAlbedoSpec = vec4(albedo.rgb, texture(u_SpecularMap, fs_in.TexCoord).r);

    vec2 mr = texture(u_MetallicRoughnessMap, fs_in.TexCoord).bg;
    gMetallicRoughness = vec4(mr.x, mr.y, 0.0, 0.0);
}

// 光照遍片段着色器
void main() {
    vec3 FragPos = texture(gPosition, TexCoord).rgb;
    vec3 Normal = decodeNormal(texture(gNormal, TexCoord).rg);
    vec3 Albedo = texture(gAlbedoSpec, TexCoord).rgb;
    float Specular = texture(gAlbedoSpec, TexCoord).a;
    float Metallic = texture(gMetallicRoughness, TexCoord).r;
    float Roughness = texture(gMetallicRoughness, TexCoord).g;

    // 使用 G-Buffer 数据计算光照
    vec3 lighting = calculatePBRLighting(FragPos, Normal, Albedo, Metallic, Roughness);

    FragColor = vec4(lighting, 1.0);
}
```

### Forward+（分块前向渲染）

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Forward+ 渲染                                 │
│                                                                      │
│  预处理：深度预处理遍（可选）                                        │
│                                                                      │
│  光源剔除遍（计算着色器）：                                          │
│    - 将屏幕分成瓦片（例如 16x16 像素）                               │
│    - 对于每个瓦片：                                                  │
│      - 从深度边界计算视锥体                                          │
│      - 测试每个光源与瓦片视锥体                                      │
│      - 构建每瓦片光源列表                                            │
│                                                                      │
│  着色遍：                                                            │
│    对于每个对象：                                                    │
│      - 确定片段在哪个瓦片中                                          │
│      - 只迭代该瓦片列表中的光源                                      │
│                                                                      │
│  结合了前向的优点（MSAA、透明度）与                                  │
│  延迟的高效光源剔除                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 管线优化技术

### 批处理和实例化

```cpp
// 绘制调用批处理：合并相同材质的对象
// 之前：1000 个绘制调用
for (auto& object : objects) {
    setMaterial(object.material);
    drawMesh(object.mesh);
}

// 之后：10 个绘制调用（每个材质一个）
for (auto& batch : materialBatches) {
    setMaterial(batch.material);
    drawMesh(batch.combinedMesh);
}

// GPU 实例化：一次调用绘制多个实例
glDrawElementsInstanced(GL_TRIANGLES, indexCount, GL_UNSIGNED_INT, 0, instanceCount);

// 通过顶点属性或 uniform 缓冲区传递实例数据
layout(location = 4) in mat4 a_InstanceTransform;  // 每实例变换
```

### 状态变更最小化

```cpp
// 按状态排序绘制调用以最小化变更
struct DrawCall {
    uint32_t shaderID;
    uint32_t materialID;
    uint32_t meshID;
    uint32_t textureID;
    // ... 其他状态
};

// 组合所有状态的排序键（着色器变更最昂贵）
uint64_t getSortKey(const DrawCall& dc) {
    return (uint64_t(dc.shaderID) << 48) |
           (uint64_t(dc.materialID) << 32) |
           (uint64_t(dc.textureID) << 16) |
           uint64_t(dc.meshID);
}

std::sort(drawCalls.begin(), drawCalls.end(),
    [](const DrawCall& a, const DrawCall& b) {
        return getSortKey(a) < getSortKey(b);
    });
```

### Early-Z 和深度预处理遍

```cpp
// 深度预处理遍：首先只渲染深度
glColorMask(GL_FALSE, GL_FALSE, GL_FALSE, GL_FALSE);  // 禁用颜色写入
glDepthFunc(GL_LESS);

for (auto& object : opaqueObjects) {
    drawMesh(object.mesh, depthOnlyShader);
}

// 主遍：只着色可见像素
glColorMask(GL_TRUE, GL_TRUE, GL_TRUE, GL_TRUE);
glDepthFunc(GL_EQUAL);  // 只处理精确深度匹配
glDepthMask(GL_FALSE);  // 不需要再写深度

for (auto& object : opaqueObjects) {
    drawMesh(object.mesh, mainShader);
}
```

---

## 现代管线扩展

### 网格着色器（DirectX 12 Ultimate / Vulkan）

```hlsl
// 网格着色器 - 替代顶点/曲面细分/几何阶段
// 更灵活的图元生成，具有类似计算的编程模型

#define GROUP_SIZE 32
#define MAX_VERTICES 64
#define MAX_PRIMITIVES 126

struct VertexOutput {
    float4 position : SV_Position;
    float3 normal : NORMAL;
    float2 texCoord : TEXCOORD;
};

struct Meshlet {
    uint vertexOffset;
    uint triangleOffset;
    uint vertexCount;
    uint triangleCount;
};

[numthreads(GROUP_SIZE, 1, 1)]
[outputtopology("triangle")]
void MeshMain(
    uint gtid : SV_GroupThreadID,
    uint gid : SV_GroupID,
    out indices uint3 triangles[MAX_PRIMITIVES],
    out vertices VertexOutput verts[MAX_VERTICES]
) {
    Meshlet meshlet = meshlets[gid];

    // 设置输出计数
    SetMeshOutputCounts(meshlet.vertexCount, meshlet.triangleCount);

    // 处理顶点
    if (gtid < meshlet.vertexCount) {
        uint vertexIndex = meshlet.vertexOffset + gtid;
        Vertex v = vertices[vertexIndex];

        verts[gtid].position = mul(viewProj, float4(v.position, 1.0));
        verts[gtid].normal = v.normal;
        verts[gtid].texCoord = v.texCoord;
    }

    // 处理三角形
    if (gtid < meshlet.triangleCount) {
        uint triOffset = meshlet.triangleOffset + gtid * 3;
        triangles[gtid] = uint3(
            triangleIndices[triOffset],
            triangleIndices[triOffset + 1],
            triangleIndices[triOffset + 2]
        );
    }
}
```

### 可变速率着色

```cpp
// 配置 VRS（可变速率着色）
// 在不太重要的区域着色更少的像素

// 每绘制调用 VRS
vkCmdSetFragmentShadingRateKHR(cmdBuffer,
    VK_FRAGMENT_SHADING_RATE_2X2_BIT_KHR,  // 每 2x2 像素一次着色器调用
    combiners);

// 基于图像的 VRS - 使用着色率图像
// 注视点渲染：注视点全速率，外围降低
//
//  ┌─────────────────────────────────────┐
//  │  2x2    │  2x2    │  2x2    │  2x2  │
//  ├─────────┼─────────┼─────────┼───────┤
//  │  2x2    │  1x1    │  1x1    │  2x2  │
//  ├─────────┼─────────┼─────────┼───────┤
//  │  2x2    │  1x1    │  1x1    │  2x2  │
//  ├─────────┼─────────┼─────────┼───────┤
//  │  2x2    │  2x2    │  2x2    │  2x2  │
//  └─────────┴─────────┴─────────┴───────┘
//            中心 = 全速率
```

---

## 性能分析

### GPU 计时查询

```cpp
// OpenGL 计时器查询
GLuint queryStart, queryEnd;
glGenQueries(1, &queryStart);
glGenQueries(1, &queryEnd);

// 开始计时
glQueryCounter(queryStart, GL_TIMESTAMP);

// 渲染代码...
drawScene();

// 结束计时
glQueryCounter(queryEnd, GL_TIMESTAMP);

// 等待结果
GLint available = 0;
while (!available) {
    glGetQueryObjectiv(queryEnd, GL_QUERY_RESULT_AVAILABLE, &available);
}

// 获取结果
GLuint64 startTime, endTime;
glGetQueryObjectui64v(queryStart, GL_QUERY_RESULT, &startTime);
glGetQueryObjectui64v(queryEnd, GL_QUERY_RESULT, &endTime);

double elapsedMs = (endTime - startTime) / 1000000.0;
printf("GPU 时间：%.3f ms\n", elapsedMs);
```

---

## 最佳实践

### 着色器优化

```glsl
// 1. 最小化分支
// 差：许多小分支
if (useTexture) color = texture(tex, uv).rgb;
else color = vec3(1.0);

// 更好：使用 mix 或 step
color = mix(vec3(1.0), texture(tex, uv).rgb, float(useTexture));

// 2. 避免数组的动态索引
// 差：可变数组索引
vec3 color = lightColors[variableIndex];

// 更好：展开或使用缓冲区对象
layout(std430) buffer LightBuffer { vec3 colors[]; };

// 3. 使用适当的精度（移动端/Web）
precision mediump float;
// 或每变量
mediump vec3 color;

// 4. 在 CPU 上预计算常量表达式
// 差：每帧在着色器中计算
float angle = time * rotationSpeed;
mat3 rotation = mat3(cos(angle), -sin(angle), 0, ...);

// 更好：作为 uniform 传递预计算的矩阵
uniform mat3 u_Rotation;  // 在 CPU 上计算

// 5. 使用内置函数（它们已优化）
float d = inversesqrt(x);  // 使用这个
// 不要：float d = 1.0 / sqrt(x);
```

---

## 常见陷阱

### Z-Fighting

```cpp
// 问题：共面表面闪烁
// 解决方案：

// 1. 增加近平面距离
float nearPlane = 0.1f;  // 不是 0.001f

// 2. 为贴花使用多边形偏移
glEnable(GL_POLYGON_OFFSET_FILL);
glPolygonOffset(-1.0f, -1.0f);  // 将贴花推向相机
drawDecal();
glDisable(GL_POLYGON_OFFSET_FILL);

// 3. 使用反向 Z（32 位浮点深度缓冲区）
// 4. 对极端范围使用对数深度缓冲区
```

### 着色器编译卡顿

```cpp
// 问题：着色器编译导致帧卡顿
// 解决方案：

// 1. 在加载时预编译着色器
for (auto& shaderPair : allShaderCombinations) {
    compileShader(shaderPair.vertex, shaderPair.fragment);
}

// 2. 使用着色器管线缓存（Vulkan）
VkPipelineCacheCreateInfo cacheInfo = {};
vkCreatePipelineCache(device, &cacheInfo, nullptr, &pipelineCache);

// 将缓存保存到磁盘
size_t cacheSize;
vkGetPipelineCacheData(device, pipelineCache, &cacheSize, nullptr);
std::vector<uint8_t> cacheData(cacheSize);
vkGetPipelineCacheData(device, pipelineCache, &cacheSize, cacheData.data());
saveToFile(cacheData);

// 3. 使用着色器变体/超级着色器与特化常量
layout(constant_id = 0) const bool USE_NORMAL_MAP = true;
layout(constant_id = 1) const int LIGHT_COUNT = 4;
```

---

## 面试主题

### Q1：解释顶点着色器和片段着色器的区别

**答案：**
- **顶点着色器**：每个顶点运行一次，将位置从对象空间变换到裁剪空间，为插值准备属性
- **片段着色器**：每个片段（潜在像素）运行一次，根据插值属性、光照和纹理计算最终颜色
- 顶点着色器的输出在到达片段着色器之前在图元表面上插值

### Q2：深度缓冲区的目的是什么？

**答案：**
深度缓冲区存储每像素深度值来处理可见性：
- 当渲染片段时，其深度与现有缓冲区值比较
- 如果更近（基于深度函数），片段通过并更新颜色和深度缓冲区
- 如果更远，片段被丢弃
- 无需排序即可正确渲染重叠几何体

### Q3：延迟渲染如何提高多光源的性能？

**答案：**
- 前向渲染：O(对象 x 光源) - 每个对象用所有光源着色
- 延迟：O(对象) 用于几何遍 + O(光源 x 可见像素) 用于光照
- G-Buffer 在一遍中捕获所有几何数据
- 光照只为可见像素计算，而不是被遮挡的几何体
- 可以使用光源体积将光照计算限制在受影响的像素

### Q4：什么导致 Z-fighting，如何修复？

**答案：**
原因：
- 有限的深度缓冲区精度
- 共面或接近共面的表面
- 透视投影中的非线性深度分布

解决方案：
- 增加近平面距离
- 使用反向 Z 深度缓冲区（更好的精度分布）
- 为贴花应用多边形偏移
- 对极端深度范围使用对数深度
- 尽可能合并共面几何体

### Q5：解释 GPU 实例化及何时使用

**答案：**
实例化在单个绘制调用中渲染网格的多个副本：
- 每实例数据（变换、颜色）存储在顶点属性或缓冲区中
- GPU 为每个实例复制顶点处理
- 减少许多绘制调用的 CPU 开销

使用时机：
- 绘制许多相同对象（植被、粒子、人群）
- 对象共享相同的网格和材质
- 每实例变化有限（变换、颜色、动画状态）

---

## 延伸阅读

### 官方文档
- [OpenGL 规范](https://www.khronos.org/opengl/)
- [Vulkan 规范](https://www.khronos.org/vulkan/)
- [DirectX 图形文档](https://docs.microsoft.com/en-us/windows/win32/directx)

### 书籍
- "Real-Time Rendering, 4th Edition" - Akenine-Moller, Haines, Hoffman
- "GPU Gems" 系列 - NVIDIA
- "Physically Based Rendering: From Theory to Implementation" - Pharr, Jakob, Humphreys

### 文章和教程
- [Learn OpenGL](https://learnopengl.com/)
- [Vulkan Tutorial](https://vulkan-tutorial.com/)
- [A trip through the Graphics Pipeline](https://fgiesen.wordpress.com/2011/07/09/a-trip-through-the-graphics-pipeline-2011-index/)

### 工具
- RenderDoc - 图形调试器
- NVIDIA Nsight Graphics - GPU 分析器
- AMD Radeon GPU Profiler
- PIX for Windows（DirectX）

---

## 总结

图形渲染管线是一个复杂但高度优化的系统，用于将 3D 场景数据转换为 2D 图像。关键要点：

1. **理解阶段**：顶点处理、图元装配、光栅化、片段着色和输出合并各有不同的职责
2. **可编程 vs. 固定**：现代管线在需要灵活性的地方提供可编程性（着色器），同时保留固定功能阶段以提高效率
3. **选择正确的技术**：前向、延迟和 forward+ 各有权衡；根据场景特性选择
4. **系统性优化**：首先分析，然后针对瓶颈，无论是 CPU 限制（绘制调用）还是 GPU 限制（着色器复杂度、内存带宽）
5. **保持更新**：管线继续发展，包括网格着色器、光线追踪和可变速率着色

掌握渲染管线使你能够创建视觉惊艳且性能出色的实时图形应用程序。
