---
title: 光照模型与 PBR 渲染
description: 掌握游戏中的光照技术：从Phong模型到基于物理的渲染(PBR)
track: gamedev
section: graphics
difficulty: advanced
tags:
  - 光照
  - PBR
  - 材质
  - 渲染
status: imported
origin: old/src/content/docs/gamedev/lighting-pbr.zh.md
divergence: 0.197
issues:
  - title-lang-en
  - title-language
legacy:
  category: GameDev
  subcategory: Graphics
  order: 12
  lastUpdated: 2026-01-07
---

光照是计算机图形学的核心话题，它决定了虚拟世界中物体的视觉呈现。从早期的经验模型（如 Phong）到现代的基于物理的渲染（PBR），光照技术的演进让实时渲染越来越接近真实世界的视觉效果。

## 概念解释：光照的本质

### 光与材质的交互

当光线照射到物体表面时，会发生多种物理现象：

1. **反射（Reflection）**：光线在表面反弹，分为镜面反射和漫反射
2. **折射（Refraction）**：光线进入透明材质内部时改变方向
3. **吸收（Absorption）**：部分光能被材质吸收转化为热能
4. **散射（Scattering）**：光线在材质内部多次反弹后射出（次表面散射）

```
入射光
   ↓
   ┌─────────────────────────┐
   │     镜面反射 ↗         │
   │    ──────────          │
   │     漫反射 ↑↗↖         │
   │    ════════════        │ ← 表面
   │         ↓              │
   │    次表面散射          │ ← 材质内部
   │      ↙  ↓  ↘          │
   └─────────────────────────┘
```

### 光照方程基础

所有光照模型的目标都是求解渲染方程的近似：

```
Lo(p, ωo) = Le(p, ωo) + ∫ fr(p, ωi, ωo) * Li(p, ωi) * (n · ωi) dωi
```

其中：
- `Lo`：出射辐射度（我们看到的颜色）
- `Le`：自发光
- `fr`：双向反射分布函数（BRDF）
- `Li`：入射辐射度
- `n · ωi`：余弦项（Lambert 定律）

---

## 经典光照模型

### Lambert 漫反射模型

Lambert 模型是最简单的漫反射模型，基于 Lambert 余弦定律：表面亮度与光线方向和表面法线夹角的余弦成正比。

```glsl
// Lambert 漫反射着色器
// 顶点着色器
#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;

out vec3 FragPos;
out vec3 Normal;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat3 normalMatrix;

void main() {
    FragPos = vec3(model * vec4(aPos, 1.0));
    Normal = normalMatrix * aNormal;
    gl_Position = projection * view * vec4(FragPos, 1.0);
}
```

```glsl
// 片元着色器
#version 330 core
out vec4 FragColor;

in vec3 FragPos;
in vec3 Normal;

uniform vec3 lightPos;
uniform vec3 lightColor;
uniform vec3 objectColor;

void main() {
    // 环境光
    float ambientStrength = 0.1;
    vec3 ambient = ambientStrength * lightColor;

    // 漫反射
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(lightPos - FragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * lightColor;

    // 最终颜色
    vec3 result = (ambient + diffuse) * objectColor;
    FragColor = vec4(result, 1.0);
}
```

### Phong 光照模型

Phong 模型在 Lambert 漫反射基础上增加了镜面高光，更好地模拟了光滑表面的反射特性。

```glsl
// Phong 光照模型片元着色器
#version 330 core
out vec4 FragColor;

in vec3 FragPos;
in vec3 Normal;

uniform vec3 viewPos;
uniform vec3 lightPos;
uniform vec3 lightColor;
uniform vec3 objectColor;

// 材质属性
uniform float ambientStrength;
uniform float specularStrength;
uniform float shininess;  // 高光指数，通常 32-256

void main() {
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(lightPos - FragPos);
    vec3 viewDir = normalize(viewPos - FragPos);

    // 环境光（Ambient）
    vec3 ambient = ambientStrength * lightColor;

    // 漫反射（Diffuse）
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * lightColor;

    // 镜面反射（Specular）- Phong 模型
    // 计算反射向量：R = 2(N·L)N - L
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = specularStrength * spec * lightColor;

    // 组合所有光照分量
    vec3 result = (ambient + diffuse + specular) * objectColor;
    FragColor = vec4(result, 1.0);
}
```

**Phong 模型的组成部分：**

| 分量 | 描述 | 公式 |
|------|------|------|
| 环境光 | 模拟间接光照 | `Ia * Ka` |
| 漫反射 | 粗糙表面的散射 | `Id * Kd * max(N·L, 0)` |
| 镜面反射 | 光滑表面的高光 | `Is * Ks * (R·V)^n` |

### Blinn-Phong 光照模型

Blinn-Phong 是 Phong 模型的优化版本，使用半程向量（Half Vector）代替反射向量计算镜面反射，计算更高效且在某些情况下效果更好。

```glsl
// Blinn-Phong 光照模型
#version 330 core
out vec4 FragColor;

in vec3 FragPos;
in vec3 Normal;

uniform vec3 viewPos;
uniform vec3 lightPos;
uniform vec3 lightColor;
uniform vec3 objectColor;

struct Material {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float shininess;
};

struct Light {
    vec3 position;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    // 衰减参数
    float constant;
    float linear;
    float quadratic;
};

uniform Material material;
uniform Light light;

void main() {
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(light.position - FragPos);
    vec3 viewDir = normalize(viewPos - FragPos);

    // 计算半程向量 H = normalize(L + V)
    vec3 halfwayDir = normalize(lightDir + viewDir);

    // 环境光
    vec3 ambient = light.ambient * material.ambient;

    // 漫反射
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = light.diffuse * diff * material.diffuse;

    // Blinn-Phong 镜面反射
    // 使用 N·H 代替 R·V
    float spec = pow(max(dot(norm, halfwayDir), 0.0), material.shininess);
    vec3 specular = light.specular * spec * material.specular;

    // 计算衰减
    float distance = length(light.position - FragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance +
                              light.quadratic * distance * distance);

    ambient *= attenuation;
    diffuse *= attenuation;
    specular *= attenuation;

    vec3 result = ambient + diffuse + specular;
    FragColor = vec4(result, 1.0);
}
```

**Phong vs Blinn-Phong 对比：**

```
Phong:        R = reflect(-L, N)
              specular = (R · V)^n

Blinn-Phong:  H = normalize(L + V)
              specular = (N · H)^n

优势：
- H 的计算比 R 更简单
- 当光源和视点都在远处时，H 可以预计算
- 在掠射角度下效果更自然
- 对于平行光源，H 是常量
```

---

## 微表面理论（Microfacet Theory）

### 核心概念

微表面理论认为：宏观平滑的表面在微观尺度上是由无数微小的完美镜面（微表面）组成的。表面的粗糙度决定了这些微表面的方向分布。

```
光滑表面（低粗糙度）       粗糙表面（高粗糙度）
    ↓ ↓ ↓                    ↓   ↓   ↓
   ─────────              ╱╲╱╲╱╲╱╲╱╲
   镜面反射集中             反射分散
```

### 微表面 BRDF 公式

Cook-Torrance BRDF 是微表面理论的经典实现：

```
fr = kd * fLambert + ks * fCook-Torrance

fCook-Torrance = D * F * G / (4 * (ωo · n) * (ωi · n))
```

其中：
- **D**：法线分布函数（Normal Distribution Function）
- **F**：菲涅尔方程（Fresnel Equation）
- **G**：几何函数（Geometry Function）

### 法线分布函数（NDF）

NDF 描述了微表面法线的统计分布。常用的有 GGX（Trowbridge-Reitz）分布：

```glsl
// GGX/Trowbridge-Reitz 法线分布函数
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

// Beckmann 分布（对比参考）
float DistributionBeckmann(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float nom = exp((NdotH2 - 1.0) / (a2 * NdotH2));
    float denom = PI * a2 * NdotH2 * NdotH2;

    return nom / denom;
}
```

### 菲涅尔方程（Fresnel Equation）

菲涅尔效应描述了光线在不同角度下反射和折射的比例变化。使用 Schlick 近似：

```glsl
// Fresnel-Schlick 近似
vec3 FresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// 带粗糙度的 Fresnel（用于 IBL）
vec3 FresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) *
           pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}
```

**F0 值参考表：**

| 材质类型 | F0 值（线性空间） |
|---------|------------------|
| 水 | (0.02, 0.02, 0.02) |
| 塑料 | (0.04, 0.04, 0.04) |
| 玻璃 | (0.04, 0.04, 0.04) |
| 钻石 | (0.17, 0.17, 0.17) |
| 铁 | (0.56, 0.57, 0.58) |
| 铜 | (0.95, 0.64, 0.54) |
| 金 | (1.00, 0.71, 0.29) |
| 银 | (0.95, 0.93, 0.88) |
| 铝 | (0.91, 0.92, 0.92) |

### 几何函数（Geometry Function）

几何函数描述了微表面的自遮挡和自阴影。使用 Smith 方法结合 GGX：

```glsl
// Schlick-GGX 几何函数
float GeometrySchlickGGX(float NdotV, float roughness) {
    // 直接光照使用 k = (roughness + 1)^2 / 8
    // IBL 使用 k = roughness^2 / 2
    float r = roughness + 1.0;
    float k = (r * r) / 8.0;

    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}

// Smith 方法：同时考虑视线和光线方向的遮挡
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}
```

---

## PBR 完整实现

### 金属度/粗糙度工作流（Metallic/Roughness）

这是目前最流行的 PBR 工作流，被 glTF 格式、Unreal Engine、Unity 等广泛采用。

```glsl
// PBR 片元着色器 - 金属度/粗糙度工作流
#version 330 core
out vec4 FragColor;

in vec2 TexCoords;
in vec3 WorldPos;
in vec3 Normal;

// 材质贴图
uniform sampler2D albedoMap;
uniform sampler2D normalMap;
uniform sampler2D metallicMap;
uniform sampler2D roughnessMap;
uniform sampler2D aoMap;

// IBL 贴图
uniform samplerCube irradianceMap;
uniform samplerCube prefilterMap;
uniform sampler2D brdfLUT;

// 光源
uniform vec3 lightPositions[4];
uniform vec3 lightColors[4];

uniform vec3 camPos;

const float PI = 3.14159265359;

// 法线贴图处理
vec3 getNormalFromMap() {
    vec3 tangentNormal = texture(normalMap, TexCoords).xyz * 2.0 - 1.0;

    vec3 Q1 = dFdx(WorldPos);
    vec3 Q2 = dFdy(WorldPos);
    vec2 st1 = dFdx(TexCoords);
    vec2 st2 = dFdy(TexCoords);

    vec3 N = normalize(Normal);
    vec3 T = normalize(Q1 * st2.t - Q2 * st1.t);
    vec3 B = -normalize(cross(N, T));
    mat3 TBN = mat3(T, B, N);

    return normalize(TBN * tangentNormal);
}

// NDF - GGX
float DistributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float nom = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / max(denom, 0.0000001);
}

// Geometry Function
float GeometrySchlickGGX(float NdotV, float roughness) {
    float r = roughness + 1.0;
    float k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
}

// Fresnel
vec3 FresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 FresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) *
           pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

void main() {
    // 采样材质贴图
    vec3 albedo = pow(texture(albedoMap, TexCoords).rgb, vec3(2.2)); // sRGB -> Linear
    float metallic = texture(metallicMap, TexCoords).r;
    float roughness = texture(roughnessMap, TexCoords).r;
    float ao = texture(aoMap, TexCoords).r;

    // 计算法线
    vec3 N = getNormalFromMap();
    vec3 V = normalize(camPos - WorldPos);
    vec3 R = reflect(-V, N);

    // 计算 F0
    // 非金属使用 0.04，金属使用 albedo 作为 F0
    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);

    // ==================== 直接光照 ====================
    vec3 Lo = vec3(0.0);
    for (int i = 0; i < 4; ++i) {
        vec3 L = normalize(lightPositions[i] - WorldPos);
        vec3 H = normalize(V + L);
        float distance = length(lightPositions[i] - WorldPos);
        float attenuation = 1.0 / (distance * distance);
        vec3 radiance = lightColors[i] * attenuation;

        // Cook-Torrance BRDF
        float NDF = DistributionGGX(N, H, roughness);
        float G = GeometrySmith(N, V, L, roughness);
        vec3 F = FresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 numerator = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
        vec3 specular = numerator / denominator;

        // 能量守恒：kS + kD = 1
        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic; // 金属没有漫反射

        float NdotL = max(dot(N, L), 0.0);
        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    }

    // ==================== 环境光照（IBL）====================
    vec3 F = FresnelSchlickRoughness(max(dot(N, V), 0.0), F0, roughness);

    vec3 kS = F;
    vec3 kD = 1.0 - kS;
    kD *= 1.0 - metallic;

    // 漫反射 IBL
    vec3 irradiance = texture(irradianceMap, N).rgb;
    vec3 diffuse = irradiance * albedo;

    // 镜面反射 IBL
    const float MAX_REFLECTION_LOD = 4.0;
    vec3 prefilteredColor = textureLod(prefilterMap, R, roughness * MAX_REFLECTION_LOD).rgb;
    vec2 brdf = texture(brdfLUT, vec2(max(dot(N, V), 0.0), roughness)).rg;
    vec3 specular = prefilteredColor * (F * brdf.x + brdf.y);

    vec3 ambient = (kD * diffuse + specular) * ao;

    // ==================== 最终颜色 ====================
    vec3 color = ambient + Lo;

    // HDR 色调映射
    color = color / (color + vec3(1.0));
    // Gamma 校正
    color = pow(color, vec3(1.0 / 2.2));

    FragColor = vec4(color, 1.0);
}
```

### 高光/光泽度工作流（Specular/Glossiness）

另一种常见的 PBR 工作流，被 Unity 旧版材质和某些工具使用：

```glsl
// Specular/Glossiness 工作流
#version 330 core

// 材质参数
uniform sampler2D diffuseMap;     // 漫反射颜色
uniform sampler2D specularMap;    // 镜面反射颜色（包含 F0）
uniform sampler2D glossinessMap;  // 光泽度（= 1 - roughness）
uniform sampler2D normalMap;
uniform sampler2D aoMap;

void main() {
    vec3 diffuse = texture(diffuseMap, TexCoords).rgb;
    vec3 specularColor = texture(specularMap, TexCoords).rgb;
    float glossiness = texture(glossinessMap, TexCoords).r;
    float roughness = 1.0 - glossiness;

    // Specular/Glossiness 工作流中，F0 直接从 specularMap 获取
    vec3 F0 = specularColor;

    // 判断是否为金属：如果 specular 接近 diffuse，则为金属
    // 金属的 diffuse 应该为黑色
    float metallic = max(max(specularColor.r, specularColor.g), specularColor.b);

    // 其余计算与 Metallic/Roughness 工作流相同
    // ...
}
```

**两种工作流对比：**

| 特性 | Metallic/Roughness | Specular/Glossiness |
|------|-------------------|---------------------|
| 贴图数量 | 较少 | 较多 |
| 金属表示 | 单通道（0-1） | RGB 高光颜色 |
| 艺术控制 | 较少 | 更精细 |
| 物理正确性 | 更严格 | 更灵活但易出错 |
| 文件格式 | glTF、UE4 | Unity 旧版 |

---

## 全局光照（Global Illumination）

### 环境光遮蔽（Ambient Occlusion）

AO 模拟了间接光照在物体缝隙和凹陷处的衰减效果。

#### 屏幕空间环境光遮蔽（SSAO）

```glsl
// SSAO 片元着色器
#version 330 core
out float FragColor;

in vec2 TexCoords;

uniform sampler2D gPosition;  // G-buffer 位置
uniform sampler2D gNormal;    // G-buffer 法线
uniform sampler2D texNoise;   // 随机旋转噪声

uniform vec3 samples[64];     // 半球采样核
uniform mat4 projection;

// 参数
int kernelSize = 64;
float radius = 0.5;
float bias = 0.025;

// 噪声缩放（根据屏幕分辨率）
const vec2 noiseScale = vec2(1280.0 / 4.0, 720.0 / 4.0);

void main() {
    // 获取当前像素的位置和法线（视图空间）
    vec3 fragPos = texture(gPosition, TexCoords).xyz;
    vec3 normal = normalize(texture(gNormal, TexCoords).rgb);
    vec3 randomVec = normalize(texture(texNoise, TexCoords * noiseScale).xyz);

    // 创建 TBN 矩阵（将采样从切线空间转到视图空间）
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    // 遍历采样核计算遮蔽
    float occlusion = 0.0;
    for (int i = 0; i < kernelSize; ++i) {
        // 获取采样点位置
        vec3 samplePos = TBN * samples[i]; // 切线空间 -> 视图空间
        samplePos = fragPos + samplePos * radius;

        // 投影到屏幕空间
        vec4 offset = vec4(samplePos, 1.0);
        offset = projection * offset;
        offset.xyz /= offset.w;
        offset.xyz = offset.xyz * 0.5 + 0.5;

        // 获取采样点的深度
        float sampleDepth = texture(gPosition, offset.xy).z;

        // 范围检查：避免远处物体影响
        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPos.z - sampleDepth));

        // 比较深度：如果采样点在几何体内部，则被遮挡
        occlusion += (sampleDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
    }

    occlusion = 1.0 - (occlusion / kernelSize);
    FragColor = occlusion;
}
```

#### SSAO 模糊处理

```glsl
// SSAO 模糊着色器
#version 330 core
out float FragColor;

in vec2 TexCoords;

uniform sampler2D ssaoInput;

void main() {
    vec2 texelSize = 1.0 / vec2(textureSize(ssaoInput, 0));
    float result = 0.0;

    // 4x4 模糊核
    for (int x = -2; x < 2; ++x) {
        for (int y = -2; y < 2; ++y) {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            result += texture(ssaoInput, TexCoords + offset).r;
        }
    }

    FragColor = result / 16.0;
}
```

### 基于图像的光照（IBL）

IBL 使用环境贴图来模拟来自各个方向的间接光照。

#### 预计算辐照度图（Irradiance Map）

```glsl
// 辐照度卷积着色器
#version 330 core
out vec4 FragColor;

in vec3 WorldPos;

uniform samplerCube environmentMap;

const float PI = 3.14159265359;

void main() {
    // 以法线方向为中心的半球积分
    vec3 N = normalize(WorldPos);

    vec3 irradiance = vec3(0.0);

    // 切线空间基向量
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(up, N));
    up = normalize(cross(N, right));

    float sampleDelta = 0.025;
    float nrSamples = 0.0;

    // 半球采样
    for (float phi = 0.0; phi < 2.0 * PI; phi += sampleDelta) {
        for (float theta = 0.0; theta < 0.5 * PI; theta += sampleDelta) {
            // 球面坐标转笛卡尔坐标（切线空间）
            vec3 tangentSample = vec3(
                sin(theta) * cos(phi),
                sin(theta) * sin(phi),
                cos(theta)
            );

            // 切线空间转世界空间
            vec3 sampleVec = tangentSample.x * right +
                            tangentSample.y * up +
                            tangentSample.z * N;

            irradiance += texture(environmentMap, sampleVec).rgb *
                         cos(theta) * sin(theta);
            nrSamples++;
        }
    }

    irradiance = PI * irradiance * (1.0 / float(nrSamples));
    FragColor = vec4(irradiance, 1.0);
}
```

#### 预过滤环境贴图（Pre-filtered Environment Map）

```glsl
// 预过滤卷积着色器 - 根据粗糙度生成 mipmap
#version 330 core
out vec4 FragColor;

in vec3 WorldPos;

uniform samplerCube environmentMap;
uniform float roughness;

const float PI = 3.14159265359;
const uint SAMPLE_COUNT = 1024u;

// 低差异序列（Hammersley 序列）
float RadicalInverse_VdC(uint bits) {
    bits = (bits << 16u) | (bits >> 16u);
    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
    return float(bits) * 2.3283064365386963e-10;
}

vec2 Hammersley(uint i, uint N) {
    return vec2(float(i) / float(N), RadicalInverse_VdC(i));
}

// 重要性采样 GGX
vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
    float a = roughness * roughness;

    float phi = 2.0 * PI * Xi.x;
    float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a * a - 1.0) * Xi.y));
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);

    // 球面坐标转笛卡尔坐标
    vec3 H;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;

    // 切线空间转世界空间
    vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(up, N));
    vec3 bitangent = cross(N, tangent);

    vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
    return normalize(sampleVec);
}

void main() {
    vec3 N = normalize(WorldPos);
    vec3 R = N;
    vec3 V = R;

    float totalWeight = 0.0;
    vec3 prefilteredColor = vec3(0.0);

    for (uint i = 0u; i < SAMPLE_COUNT; ++i) {
        vec2 Xi = Hammersley(i, SAMPLE_COUNT);
        vec3 H = ImportanceSampleGGX(Xi, N, roughness);
        vec3 L = normalize(2.0 * dot(V, H) * H - V);

        float NdotL = max(dot(N, L), 0.0);
        if (NdotL > 0.0) {
            // 根据 PDF 采样 mip level 减少噪声
            float D = DistributionGGX(N, H, roughness);
            float NdotH = max(dot(N, H), 0.0);
            float HdotV = max(dot(H, V), 0.0);
            float pdf = D * NdotH / (4.0 * HdotV) + 0.0001;

            float resolution = 512.0; // 环境贴图分辨率
            float saTexel = 4.0 * PI / (6.0 * resolution * resolution);
            float saSample = 1.0 / (float(SAMPLE_COUNT) * pdf + 0.0001);

            float mipLevel = roughness == 0.0 ? 0.0 :
                            0.5 * log2(saSample / saTexel);

            prefilteredColor += textureLod(environmentMap, L, mipLevel).rgb * NdotL;
            totalWeight += NdotL;
        }
    }

    prefilteredColor = prefilteredColor / totalWeight;
    FragColor = vec4(prefilteredColor, 1.0);
}
```

#### BRDF 积分查找表（LUT）

```glsl
// BRDF 积分预计算
#version 330 core
out vec2 FragColor;

in vec2 TexCoords;

const float PI = 3.14159265359;
const uint SAMPLE_COUNT = 1024u;

// ... Hammersley, ImportanceSampleGGX 等函数同上 ...

float GeometrySchlickGGX(float NdotV, float roughness) {
    float a = roughness;
    float k = (a * a) / 2.0; // IBL 使用不同的 k

    return NdotV / (NdotV * (1.0 - k) + k);
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
}

vec2 IntegrateBRDF(float NdotV, float roughness) {
    vec3 V;
    V.x = sqrt(1.0 - NdotV * NdotV);
    V.y = 0.0;
    V.z = NdotV;

    float A = 0.0;
    float B = 0.0;

    vec3 N = vec3(0.0, 0.0, 1.0);

    for (uint i = 0u; i < SAMPLE_COUNT; ++i) {
        vec2 Xi = Hammersley(i, SAMPLE_COUNT);
        vec3 H = ImportanceSampleGGX(Xi, N, roughness);
        vec3 L = normalize(2.0 * dot(V, H) * H - V);

        float NdotL = max(L.z, 0.0);
        float NdotH = max(H.z, 0.0);
        float VdotH = max(dot(V, H), 0.0);

        if (NdotL > 0.0) {
            float G = GeometrySmith(N, V, L, roughness);
            float G_Vis = (G * VdotH) / (NdotH * NdotV);
            float Fc = pow(1.0 - VdotH, 5.0);

            A += (1.0 - Fc) * G_Vis;
            B += Fc * G_Vis;
        }
    }

    A /= float(SAMPLE_COUNT);
    B /= float(SAMPLE_COUNT);

    return vec2(A, B);
}

void main() {
    vec2 integratedBRDF = IntegrateBRDF(TexCoords.x, TexCoords.y);
    FragColor = integratedBRDF;
}
```

---

## 实战案例：完整 PBR 渲染器

### C++ 渲染器框架

```cpp
// PBRRenderer.h
#pragma once

#include <glad/glad.h>
#include <glm/glm.hpp>
#include <string>
#include <vector>

class PBRRenderer {
public:
    PBRRenderer();
    ~PBRRenderer();

    void Initialize(int width, int height);
    void Render(float deltaTime);

    // 材质设置
    void SetAlbedo(const glm::vec3& albedo);
    void SetMetallic(float metallic);
    void SetRoughness(float roughness);
    void SetAO(float ao);

    // 加载贴图
    void LoadAlbedoMap(const std::string& path);
    void LoadNormalMap(const std::string& path);
    void LoadMetallicMap(const std::string& path);
    void LoadRoughnessMap(const std::string& path);
    void LoadAOMap(const std::string& path);

    // 环境贴图
    void LoadHDREnvironment(const std::string& path);

private:
    // 预计算 IBL
    void PrecomputeIBL();
    void GenerateIrradianceMap();
    void GeneratePrefilterMap();
    void GenerateBRDFLUT();

    // 渲染球体网格
    void RenderSphere();

    // 着色器
    unsigned int m_PBRShader;
    unsigned int m_EquirectangularToCubemapShader;
    unsigned int m_IrradianceShader;
    unsigned int m_PrefilterShader;
    unsigned int m_BRDFShader;

    // 贴图
    unsigned int m_AlbedoMap;
    unsigned int m_NormalMap;
    unsigned int m_MetallicMap;
    unsigned int m_RoughnessMap;
    unsigned int m_AOMap;

    // IBL 贴图
    unsigned int m_EnvCubemap;
    unsigned int m_IrradianceMap;
    unsigned int m_PrefilterMap;
    unsigned int m_BRDFLUT;

    // 帧缓冲
    unsigned int m_CaptureFBO;
    unsigned int m_CaptureRBO;

    // 几何体
    unsigned int m_SphereVAO;
    unsigned int m_SphereIndexCount;

    // 材质参数
    glm::vec3 m_Albedo = glm::vec3(0.5f, 0.0f, 0.0f);
    float m_Metallic = 0.0f;
    float m_Roughness = 0.5f;
    float m_AO = 1.0f;

    // 光源
    std::vector<glm::vec3> m_LightPositions;
    std::vector<glm::vec3> m_LightColors;

    int m_Width, m_Height;
};
```

```cpp
// PBRRenderer.cpp
#include "PBRRenderer.h"
#include <stb_image.h>

void PBRRenderer::Initialize(int width, int height) {
    m_Width = width;
    m_Height = height;

    // 设置光源
    m_LightPositions = {
        glm::vec3(-10.0f,  10.0f, 10.0f),
        glm::vec3( 10.0f,  10.0f, 10.0f),
        glm::vec3(-10.0f, -10.0f, 10.0f),
        glm::vec3( 10.0f, -10.0f, 10.0f)
    };

    m_LightColors = {
        glm::vec3(300.0f, 300.0f, 300.0f),
        glm::vec3(300.0f, 300.0f, 300.0f),
        glm::vec3(300.0f, 300.0f, 300.0f),
        glm::vec3(300.0f, 300.0f, 300.0f)
    };

    // 编译着色器
    m_PBRShader = LoadShader("pbr.vs", "pbr.fs");
    m_EquirectangularToCubemapShader = LoadShader("cubemap.vs", "equirectangular_to_cubemap.fs");
    m_IrradianceShader = LoadShader("cubemap.vs", "irradiance_convolution.fs");
    m_PrefilterShader = LoadShader("cubemap.vs", "prefilter.fs");
    m_BRDFShader = LoadShader("brdf.vs", "brdf.fs");

    // 创建帧缓冲
    glGenFramebuffers(1, &m_CaptureFBO);
    glGenRenderbuffers(1, &m_CaptureRBO);

    // 生成球体网格
    GenerateSphere();

    // 配置 OpenGL 状态
    glEnable(GL_DEPTH_TEST);
    glDepthFunc(GL_LEQUAL);
    glEnable(GL_TEXTURE_CUBE_MAP_SEAMLESS);
}

void PBRRenderer::LoadHDREnvironment(const std::string& path) {
    stbi_set_flip_vertically_on_load(true);
    int width, height, nrComponents;
    float* data = stbi_loadf(path.c_str(), &width, &height, &nrComponents, 0);

    if (data) {
        unsigned int hdrTexture;
        glGenTextures(1, &hdrTexture);
        glBindTexture(GL_TEXTURE_2D, hdrTexture);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB16F, width, height, 0, GL_RGB, GL_FLOAT, data);

        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

        stbi_image_free(data);

        // 转换为立方体贴图
        ConvertEquirectangularToCubemap(hdrTexture);

        // 预计算 IBL
        PrecomputeIBL();
    }
}

void PBRRenderer::PrecomputeIBL() {
    GenerateIrradianceMap();
    GeneratePrefilterMap();
    GenerateBRDFLUT();
}

void PBRRenderer::Render(float deltaTime) {
    glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    glUseProgram(m_PBRShader);

    // 设置相机矩阵
    glm::mat4 view = GetViewMatrix();
    glm::mat4 projection = glm::perspective(glm::radians(45.0f),
        (float)m_Width / (float)m_Height, 0.1f, 100.0f);

    SetUniform(m_PBRShader, "view", view);
    SetUniform(m_PBRShader, "projection", projection);
    SetUniform(m_PBRShader, "camPos", GetCameraPosition());

    // 绑定 IBL 贴图
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_CUBE_MAP, m_IrradianceMap);
    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_CUBE_MAP, m_PrefilterMap);
    glActiveTexture(GL_TEXTURE2);
    glBindTexture(GL_TEXTURE_2D, m_BRDFLUT);

    // 绑定材质贴图
    glActiveTexture(GL_TEXTURE3);
    glBindTexture(GL_TEXTURE_2D, m_AlbedoMap);
    glActiveTexture(GL_TEXTURE4);
    glBindTexture(GL_TEXTURE_2D, m_NormalMap);
    glActiveTexture(GL_TEXTURE5);
    glBindTexture(GL_TEXTURE_2D, m_MetallicMap);
    glActiveTexture(GL_TEXTURE6);
    glBindTexture(GL_TEXTURE_2D, m_RoughnessMap);
    glActiveTexture(GL_TEXTURE7);
    glBindTexture(GL_TEXTURE_2D, m_AOMap);

    // 设置光源
    for (unsigned int i = 0; i < m_LightPositions.size(); ++i) {
        SetUniform(m_PBRShader, "lightPositions[" + std::to_string(i) + "]", m_LightPositions[i]);
        SetUniform(m_PBRShader, "lightColors[" + std::to_string(i) + "]", m_LightColors[i]);
    }

    // 渲染材质球矩阵
    int nrRows = 7;
    int nrColumns = 7;
    float spacing = 2.5f;

    for (int row = 0; row < nrRows; ++row) {
        SetUniform(m_PBRShader, "metallic", (float)row / (float)nrRows);

        for (int col = 0; col < nrColumns; ++col) {
            SetUniform(m_PBRShader, "roughness",
                glm::clamp((float)col / (float)nrColumns, 0.05f, 1.0f));

            glm::mat4 model = glm::mat4(1.0f);
            model = glm::translate(model, glm::vec3(
                (col - (nrColumns / 2)) * spacing,
                (row - (nrRows / 2)) * spacing,
                0.0f
            ));
            SetUniform(m_PBRShader, "model", model);
            SetUniform(m_PBRShader, "normalMatrix",
                glm::transpose(glm::inverse(glm::mat3(model))));

            RenderSphere();
        }
    }

    // 渲染天空盒
    RenderSkybox();
}
```

### Unity Shader 实现

```hlsl
// PBR.shader - Unity Standard PBR 简化版
Shader "Custom/PBR"
{
    Properties
    {
        _Albedo ("Albedo", Color) = (1, 1, 1, 1)
        _AlbedoMap ("Albedo Map", 2D) = "white" {}
        [Normal] _NormalMap ("Normal Map", 2D) = "bump" {}
        _NormalScale ("Normal Scale", Range(0, 2)) = 1
        _Metallic ("Metallic", Range(0, 1)) = 0
        _MetallicMap ("Metallic Map", 2D) = "white" {}
        _Roughness ("Roughness", Range(0, 1)) = 0.5
        _RoughnessMap ("Roughness Map", 2D) = "white" {}
        _AOMap ("AO Map", 2D) = "white" {}
    }

    SubShader
    {
        Tags { "RenderType"="Opaque" "LightMode"="ForwardBase" }

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_fwdbase

            #include "UnityCG.cginc"
            #include "Lighting.cginc"
            #include "AutoLight.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float3 normal : NORMAL;
                float4 tangent : TANGENT;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 worldPos : TEXCOORD1;
                float3 worldNormal : TEXCOORD2;
                float3 worldTangent : TEXCOORD3;
                float3 worldBitangent : TEXCOORD4;
                SHADOW_COORDS(5)
            };

            float4 _Albedo;
            sampler2D _AlbedoMap;
            float4 _AlbedoMap_ST;
            sampler2D _NormalMap;
            float _NormalScale;
            float _Metallic;
            sampler2D _MetallicMap;
            float _Roughness;
            sampler2D _RoughnessMap;
            sampler2D _AOMap;

            #define PI 3.14159265359

            // GGX NDF
            float DistributionGGX(float3 N, float3 H, float roughness)
            {
                float a = roughness * roughness;
                float a2 = a * a;
                float NdotH = max(dot(N, H), 0.0);
                float NdotH2 = NdotH * NdotH;

                float nom = a2;
                float denom = (NdotH2 * (a2 - 1.0) + 1.0);
                denom = PI * denom * denom;

                return nom / denom;
            }

            // Geometry Function
            float GeometrySchlickGGX(float NdotV, float roughness)
            {
                float r = roughness + 1.0;
                float k = (r * r) / 8.0;
                return NdotV / (NdotV * (1.0 - k) + k);
            }

            float GeometrySmith(float3 N, float3 V, float3 L, float roughness)
            {
                float NdotV = max(dot(N, V), 0.0);
                float NdotL = max(dot(N, L), 0.0);
                float ggx2 = GeometrySchlickGGX(NdotV, roughness);
                float ggx1 = GeometrySchlickGGX(NdotL, roughness);
                return ggx1 * ggx2;
            }

            // Fresnel
            float3 FresnelSchlick(float cosTheta, float3 F0)
            {
                return F0 + (1.0 - F0) * pow(saturate(1.0 - cosTheta), 5.0);
            }

            v2f vert(appdata v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _AlbedoMap);
                o.worldPos = mul(unity_ObjectToWorld, v.vertex).xyz;
                o.worldNormal = UnityObjectToWorldNormal(v.normal);
                o.worldTangent = UnityObjectToWorldDir(v.tangent.xyz);
                o.worldBitangent = cross(o.worldNormal, o.worldTangent) * v.tangent.w;
                TRANSFER_SHADOW(o);
                return o;
            }

            fixed4 frag(v2f i) : SV_Target
            {
                // 采样贴图
                float3 albedo = tex2D(_AlbedoMap, i.uv).rgb * _Albedo.rgb;
                float metallic = tex2D(_MetallicMap, i.uv).r * _Metallic;
                float roughness = tex2D(_RoughnessMap, i.uv).r * _Roughness;
                float ao = tex2D(_AOMap, i.uv).r;

                // 法线贴图
                float3 tangentNormal = UnpackNormal(tex2D(_NormalMap, i.uv));
                tangentNormal.xy *= _NormalScale;
                float3x3 TBN = float3x3(i.worldTangent, i.worldBitangent, i.worldNormal);
                float3 N = normalize(mul(tangentNormal, TBN));

                float3 V = normalize(_WorldSpaceCameraPos - i.worldPos);
                float3 L = normalize(_WorldSpaceLightPos0.xyz);
                float3 H = normalize(V + L);

                // F0
                float3 F0 = float3(0.04, 0.04, 0.04);
                F0 = lerp(F0, albedo, metallic);

                // Cook-Torrance BRDF
                float NDF = DistributionGGX(N, H, roughness);
                float G = GeometrySmith(N, V, L, roughness);
                float3 F = FresnelSchlick(max(dot(H, V), 0.0), F0);

                float3 numerator = NDF * G * F;
                float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
                float3 specular = numerator / denominator;

                float3 kS = F;
                float3 kD = float3(1.0, 1.0, 1.0) - kS;
                kD *= 1.0 - metallic;

                float NdotL = max(dot(N, L), 0.0);

                // 直接光照
                float3 Lo = (kD * albedo / PI + specular) * _LightColor0.rgb * NdotL;

                // 环境光
                float3 ambient = UNITY_LIGHTMODEL_AMBIENT.rgb * albedo * ao;

                // 阴影
                float shadow = SHADOW_ATTENUATION(i);

                float3 color = ambient + Lo * shadow;

                // Tone mapping
                color = color / (color + float3(1.0, 1.0, 1.0));
                // Gamma correction
                color = pow(color, 1.0 / 2.2);

                return fixed4(color, 1.0);
            }
            ENDCG
        }
    }

    FallBack "Diffuse"
}
```

### Unreal Engine Material 节点图

```
Unreal Engine PBR 材质节点结构：

[Texture Sample: BaseColor] ──────────────────────> Base Color
                                                        │
[Texture Sample: Normal] ──> [Normal Map Node] ──────> Normal
                                                        │
[Texture Sample: ORM] ────┬─────(R)──────────────────> Ambient Occlusion
                         ├─────(G)──────────────────> Roughness
                         └─────(B)──────────────────> Metallic
                                                        │
[Constant: 0 或 1] ──────────────────────────────────> Specular (可选)
```

```cpp
// Unreal Engine C++ 材质参数设置
void AMyActor::SetupPBRMaterial()
{
    UMaterialInstanceDynamic* DynamicMaterial =
        UMaterialInstanceDynamic::Create(BaseMaterial, this);

    // 设置贴图
    DynamicMaterial->SetTextureParameterValue("BaseColorMap", AlbedoTexture);
    DynamicMaterial->SetTextureParameterValue("NormalMap", NormalTexture);
    DynamicMaterial->SetTextureParameterValue("ORMMap", ORMTexture);

    // 设置标量参数
    DynamicMaterial->SetScalarParameterValue("Roughness", 0.5f);
    DynamicMaterial->SetScalarParameterValue("Metallic", 0.0f);

    // 设置向量参数
    DynamicMaterial->SetVectorParameterValue("BaseColor", FLinearColor(1.0f, 0.5f, 0.0f));

    // 应用材质
    MeshComponent->SetMaterial(0, DynamicMaterial);
}
```

---

## 高级技术

### 次表面散射（Subsurface Scattering）

模拟光线在半透明材质（如皮肤、蜡烛、树叶）内部的散射。

```glsl
// 简化的次表面散射近似
vec3 SubsurfaceScattering(vec3 N, vec3 L, vec3 V, float thickness, vec3 sssColor) {
    // 背光散射
    vec3 H = normalize(L + N * 0.5);
    float VdotH = pow(saturate(dot(V, -H)), 3.0);

    // 基于厚度的衰减
    float sss = VdotH * thickness;

    return sssColor * sss;
}

// 在主着色器中使用
void main() {
    // ... 常规 PBR 计算 ...

    // 添加 SSS
    vec3 sssContribution = SubsurfaceScattering(N, L, V, thickness, sssColor);
    Lo += sssContribution * radiance;

    // ...
}
```

### 各向异性反射（Anisotropic Reflection）

模拟拉丝金属、头发等具有方向性的反射。

```glsl
// 各向异性 GGX
float DistributionGGXAnisotropic(vec3 N, vec3 H, vec3 T, vec3 B,
                                   float roughnessT, float roughnessB) {
    float TdotH = dot(T, H);
    float BdotH = dot(B, H);
    float NdotH = dot(N, H);

    float a2 = roughnessT * roughnessB;
    float d = (TdotH * TdotH) / (roughnessT * roughnessT) +
              (BdotH * BdotH) / (roughnessB * roughnessB) +
              NdotH * NdotH;
    d = d * d;

    return 1.0 / (PI * a2 * d);
}

// Ashikhmin-Shirley 各向异性模型
float AshikhminShirleyNDF(vec3 N, vec3 H, vec3 T, vec3 B, float nu, float nv) {
    float TdotH = dot(T, H);
    float BdotH = dot(B, H);
    float NdotH = max(dot(N, H), 0.0);

    float exponent = (nu * TdotH * TdotH + nv * BdotH * BdotH) /
                    (1.0 - NdotH * NdotH);

    return sqrt((nu + 1.0) * (nv + 1.0)) / (8.0 * PI) *
           pow(NdotH, exponent);
}
```

### 清漆层（Clear Coat）

模拟汽车漆面等双层材质效果。

```glsl
// 清漆层计算
float ClearCoatBRDF(vec3 N, vec3 H, vec3 V, vec3 L,
                    float clearCoat, float clearCoatRoughness) {
    float NdotH = max(dot(N, H), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);
    float VdotH = max(dot(V, H), 0.0);

    // 清漆层使用固定的 F0 = 0.04
    float F = 0.04 + (1.0 - 0.04) * pow(1.0 - VdotH, 5.0);

    float D = DistributionGGX(N, H, clearCoatRoughness);
    float G = GeometrySmith(N, V, L, clearCoatRoughness);

    float clearCoatSpecular = D * F * G / (4.0 * NdotL * NdotV + 0.001);

    return clearCoat * clearCoatSpecular;
}

void main() {
    // 基础层
    vec3 baseBRDF = CalculatePBR(N, V, L, albedo, metallic, roughness);

    // 清漆层
    float clearCoatContribution = ClearCoatBRDF(N, H, V, L,
                                                 clearCoat, clearCoatRoughness);

    // 组合：清漆层会吸收部分光线
    float absorption = 1.0 - clearCoat * FresnelSchlick(NdotV, vec3(0.04)).r;
    vec3 finalColor = baseBRDF * absorption + vec3(clearCoatContribution);
}
```

---

## 性能优化

### 着色器优化技巧

```glsl
// 1. 使用 half 精度（移动端）
#ifdef GL_ES
precision mediump float;
#define HALF half
#define HALF3 half3
#else
#define HALF float
#define HALF3 vec3
#endif

// 2. 预计算常量
const HALF invPI = 0.31830988618;
const HALF PI = 3.14159265359;

// 3. 使用快速近似
// 快速 pow 近似
HALF fastPow(HALF x, HALF y) {
    return exp2(y * log2(x));
}

// 快速 Fresnel 近似
HALF3 FresnelSchlickFast(HALF cosTheta, HALF3 F0) {
    HALF t = 1.0 - cosTheta;
    HALF t2 = t * t;
    HALF t5 = t2 * t2 * t;
    return F0 + (1.0 - F0) * t5;
}

// 4. 分支优化
// 避免：
if (metallic > 0.5) {
    // 金属路径
} else {
    // 非金属路径
}

// 使用 mix 代替：
vec3 result = mix(dielectricResult, metallicResult, metallic);

// 5. 向量化操作
// 避免：
float x = a.x * b.x;
float y = a.y * b.y;
float z = a.z * b.z;

// 使用：
vec3 result = a * b;
```

### LOD 与简化

```glsl
// 基于距离的 PBR 简化
void main() {
    float distance = length(camPos - WorldPos);

    if (distance < 10.0) {
        // 完整 PBR
        color = FullPBR(N, V, L, albedo, metallic, roughness);
    } else if (distance < 50.0) {
        // 简化 PBR：省略某些计算
        color = SimplifiedPBR(N, V, L, albedo, metallic, roughness);
    } else {
        // Lambert + 简单高光
        color = SimpleLighting(N, L, albedo);
    }
}

// 简化的 PBR（省略几何函数）
vec3 SimplifiedPBR(vec3 N, vec3 V, vec3 L, vec3 albedo,
                   float metallic, float roughness) {
    vec3 H = normalize(V + L);

    vec3 F0 = mix(vec3(0.04), albedo, metallic);
    vec3 F = FresnelSchlick(max(dot(H, V), 0.0), F0);

    // 简化的高光项
    float NdotH = max(dot(N, H), 0.0);
    float spec = pow(NdotH, (1.0 - roughness) * 128.0);

    vec3 kD = (1.0 - F) * (1.0 - metallic);
    float NdotL = max(dot(N, L), 0.0);

    return (kD * albedo / PI + F * spec) * NdotL;
}
```

---

## 面试要点

### 核心概念题

**Q1: 解释 PBR 中金属度和粗糙度的物理含义？**

```
金属度（Metallic）：
- 0 = 电介质（塑料、木头、皮肤等）
- 1 = 金属（金、银、铜等）
- 影响：
  - 金属没有漫反射，所有光线都是镜面反射
  - 金属的 F0 值来自 albedo，电介质固定为 0.04

粗糙度（Roughness）：
- 0 = 完美镜面
- 1 = 完全粗糙
- 影响：
  - 控制微表面法线的分布范围
  - 粗糙度越高，高光越分散、越暗淡
```

**Q2: 为什么 PBR 要使用线性空间计算？**

```
原因：
1. 光照计算是物理过程，需要在线性空间进行
2. sRGB 是为人眼感知优化的非线性编码
3. 在 sRGB 空间做计算会导致：
   - 光照衰减不正确
   - 颜色混合结果错误
   - 高光过亮或过暗

工作流：
1. 纹理输入：sRGB 贴图（如 albedo）转换到线性空间
2. 计算：所有光照计算在线性空间进行
3. 输出：最终结果转回 sRGB 显示

代码：
// 输入转换
vec3 albedo = pow(texture(albedoMap, uv).rgb, vec3(2.2));

// 输出转换
color = pow(color, vec3(1.0 / 2.2));
```

**Q3: 解释 Cook-Torrance BRDF 中 D、F、G 项的作用？**

```
D（Normal Distribution Function）- 法线分布函数：
- 描述微表面法线朝向的统计分布
- 决定高光的形状和集中程度
- roughness 越大，分布越分散

F（Fresnel）- 菲涅尔方程：
- 描述光线在不同角度下反射比例的变化
- 掠射角时反射更强（菲涅尔效应）
- 决定边缘高光

G（Geometry Function）- 几何函数：
- 描述微表面的自遮挡和自阴影
- 在掠射角时会遮挡更多光线
- 保证能量守恒
```

### 实践应用题

**Q4: 如何实现实时的全局光照？**

```
常用方法：

1. 屏幕空间方法：
   - SSAO：屏幕空间环境光遮蔽
   - SSGI：屏幕空间全局光照
   - SSR：屏幕空间反射

2. 预计算方法：
   - Light Probes：光照探针
   - Lightmaps：光照贴图
   - IBL：基于图像的光照

3. 实时方法：
   - VXGI：体素全局光照
   - DDGI：动态漫反射全局光照
   - Lumen（UE5）：混合方法

4. 硬件加速：
   - RTX 光线追踪
```

**Q5: 移动端 PBR 优化策略有哪些？**

```
1. 精度优化：
   - 使用 half 精度
   - 简化数学计算（使用近似）

2. 贴图优化：
   - 合并贴图通道（ORM 贴图）
   - 使用压缩纹理（ASTC、ETC2）
   - 降低贴图分辨率

3. 计算优化：
   - 简化 BRDF（省略 G 项）
   - 减少光源数量
   - LOD 系统

4. IBL 优化：
   - 使用低分辨率环境贴图
   - 球谐光照代替完整 IBL
   - 预计算更多，实时计算更少

5. 后处理优化：
   - 降低 SSAO 采样数
   - 使用简化的 bloom
```

### 高频考点总结

```
1. 光照模型演进：Lambert -> Phong -> Blinn-Phong -> PBR

2. 微表面理论三要素：D（分布）、F（菲涅尔）、G（几何）

3. PBR 工作流：
   - Metallic/Roughness（glTF、UE4）
   - Specular/Glossiness（Unity 旧版）

4. IBL 三件套：
   - Irradiance Map（漫反射环境光）
   - Pre-filtered Map（镜面反射）
   - BRDF LUT（积分预计算）

5. 能量守恒：kS + kD = 1，金属无漫反射

6. 线性工作流：输入 gamma 解码，输出 gamma 编码

7. 优化技术：LOD、实例化、贴图压缩、计算简化
```

---

## 学习资源

### 经典论文
- "Microfacet Models for Refraction through Rough Surfaces" - Walter et al.
- "Real Shading in Unreal Engine 4" - Brian Karis
- "Moving Frostbite to PBR" - Sebastien Lagarde

### 在线资源
- [Learn OpenGL - PBR](https://learnopengl.com/PBR/Theory)
- [Filament 文档](https://google.github.io/filament/Filament.html)
- [Marmoset PBR Theory](https://marmoset.co/posts/basic-theory-of-physically-based-rendering/)

### 推荐书籍
- 《Real-Time Rendering》第四版
- 《Physically Based Rendering: From Theory to Implementation》
- 《GPU Gems》系列

---

## 总结

光照模型与 PBR 渲染是现代游戏图形的核心技术。从经典的 Phong 模型到基于物理的渲染，我们追求的是更真实、更一致的视觉效果。掌握这些技术需要：

1. **理解物理基础**：光的反射、折射、散射等物理现象
2. **熟悉数学工具**：向量运算、概率分布、数值积分
3. **掌握实现细节**：着色器编写、贴图制作、性能优化
4. **了解工业标准**：glTF、OpenPBR 等格式和规范

PBR 不是终点，而是起点。随着实时光线追踪、神经渲染等技术的发展，渲染技术将继续向着更真实、更高效的方向演进。
