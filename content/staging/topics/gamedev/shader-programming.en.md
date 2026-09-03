---
title: "Shader Programming: From Basics to Advanced"
description: "Master GPU shader programming: HLSL/GLSL syntax, vertex/fragment shaders, and compute shaders"
track: gamedev
section: graphics
difficulty: advanced
tags:
  - Shader
  - HLSL
  - GLSL
  - GPU programming
status: imported
origin: old/src/content/docs/gamedev/shader-programming.en.md
divergence: 0.177
issues: []
legacy:
  category: GameDev
  subcategory: Graphics
  order: 11
  lastUpdated: 2026-01-07
---

Shader programming is the art of writing programs that run on the GPU (Graphics Processing Unit) to control how vertices and pixels are processed during rendering. Understanding shaders is essential for creating custom visual effects, optimizing rendering performance, and achieving unique artistic styles in games and real-time graphics applications.

## What Are Shaders?

A shader is a small program that runs on the GPU, executing in parallel across thousands of cores. Unlike CPU programs that run sequentially, shaders process multiple data points simultaneously, making them incredibly efficient for graphics computations.

### Historical Context

The term "shader" originated from the concept of computing light and shadow effects. Early 3D graphics used fixed-function pipelines with limited configurability. The introduction of programmable shaders in the early 2000s revolutionized real-time graphics:

- **2001**: DirectX 8 introduced vertex and pixel shaders
- **2004**: Shader Model 3.0 brought more flexibility
- **2006**: Unified shader architecture in DirectX 10
- **2009**: Compute shaders introduced in DirectX 11
- **Present**: Modern APIs like Vulkan, DirectX 12, and Metal offer low-level GPU control

### Types of Shaders

| Shader Type | Purpose | Runs Per |
|-------------|---------|----------|
| Vertex Shader | Transform vertex positions | Vertex |
| Fragment/Pixel Shader | Calculate pixel colors | Pixel |
| Geometry Shader | Generate or modify primitives | Primitive |
| Tessellation Shaders | Subdivide geometry | Patch |
| Compute Shader | General-purpose GPU computing | Thread group |

---

## Shader Languages Overview

### GLSL (OpenGL Shading Language)

GLSL is used with OpenGL and WebGL. It has a C-like syntax and is widely used for cross-platform development.

```glsl
// GLSL Version Declaration
#version 330 core

// Input from vertex buffer
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoord;

// Output to fragment shader
out vec3 FragPos;
out vec3 Normal;
out vec2 TexCoord;

// Uniform variables (same for all vertices)
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main()
{
    // Transform position to world space
    FragPos = vec3(model * vec4(aPos, 1.0));

    // Transform normal (using normal matrix for non-uniform scaling)
    Normal = mat3(transpose(inverse(model))) * aNormal;

    // Pass through texture coordinates
    TexCoord = aTexCoord;

    // Final clip-space position
    gl_Position = projection * view * vec4(FragPos, 1.0);
}
```

### HLSL (High-Level Shading Language)

HLSL is Microsoft's shader language for DirectX. It's commonly used in Windows games and Unity/Unreal Engine.

```hlsl
// HLSL Vertex Shader

// Input structure
struct VertexInput
{
    float3 position : POSITION;
    float3 normal : NORMAL;
    float2 texCoord : TEXCOORD0;
};

// Output structure
struct VertexOutput
{
    float4 position : SV_POSITION;
    float3 worldPos : TEXCOORD0;
    float3 normal : TEXCOORD1;
    float2 texCoord : TEXCOORD2;
};

// Constant buffer (uniform data)
cbuffer TransformBuffer : register(b0)
{
    float4x4 model;
    float4x4 view;
    float4x4 projection;
};

VertexOutput main(VertexInput input)
{
    VertexOutput output;

    // Transform to world space
    float4 worldPos = mul(model, float4(input.position, 1.0));
    output.worldPos = worldPos.xyz;

    // Transform normal
    output.normal = mul((float3x3)model, input.normal);

    // Pass through texture coordinates
    output.texCoord = input.texCoord;

    // Final position in clip space
    output.position = mul(projection, mul(view, worldPos));

    return output;
}
```

### Key Differences Between GLSL and HLSL

| Feature | GLSL | HLSL |
|---------|------|------|
| Matrix multiplication | `matrix * vector` | `mul(matrix, vector)` |
| Texture sampling | `texture(sampler, uv)` | `tex.Sample(sampler, uv)` |
| Input/Output | `in`/`out` keywords | Semantics (`:POSITION`) |
| Uniform data | `uniform` keyword | Constant buffers (`cbuffer`) |
| Entry point | Always `main()` | Can be any name |
| Vector swizzling | `.xyzw` or `.rgba` | Same as GLSL |

---

## The Graphics Pipeline

Understanding the graphics pipeline is crucial for effective shader programming.

```
CPU (Application)
    |
    v
Input Assembly (Vertices, Indices)
    |
    v
+-------------------+
| Vertex Shader     | <- Programmable
+-------------------+
    |
    v
Tessellation (Optional)
    |
    v
Geometry Shader (Optional)
    |
    v
Rasterization (Fixed-function)
    |
    v
+-------------------+
| Fragment Shader   | <- Programmable
+-------------------+
    |
    v
Depth/Stencil Test
    |
    v
Blending
    |
    v
Framebuffer Output
```

---

## Vertex Shaders

Vertex shaders process each vertex of a mesh. Their primary responsibilities include:

1. Transforming vertex positions from local to clip space
2. Computing per-vertex lighting
3. Passing data to the fragment shader

### Basic Vertex Shader (GLSL)

```glsl
#version 330 core

// Vertex attributes
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoord;
layout (location = 3) in vec3 aTangent;

// Outputs to fragment shader (varyings)
out VS_OUT {
    vec3 FragPos;
    vec3 Normal;
    vec2 TexCoord;
    mat3 TBN;
} vs_out;

// Uniform matrices
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main()
{
    // World position
    vs_out.FragPos = vec3(model * vec4(aPosition, 1.0));

    // Normal matrix for correct normal transformation
    mat3 normalMatrix = transpose(inverse(mat3(model)));
    vs_out.Normal = normalize(normalMatrix * aNormal);

    // Texture coordinates
    vs_out.TexCoord = aTexCoord;

    // TBN matrix for normal mapping
    vec3 T = normalize(normalMatrix * aTangent);
    vec3 N = vs_out.Normal;
    // Re-orthogonalize using Gram-Schmidt process
    T = normalize(T - dot(T, N) * N);
    vec3 B = cross(N, T);
    vs_out.TBN = mat3(T, B, N);

    // Final clip-space position
    gl_Position = projection * view * vec4(vs_out.FragPos, 1.0);
}
```

### Vertex Animation Example

```glsl
#version 330 core

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoord;

out vec2 TexCoord;

uniform mat4 MVP;
uniform float time;
uniform float waveAmplitude;
uniform float waveFrequency;

void main()
{
    vec3 pos = aPosition;

    // Wave animation on Y axis
    float wave = sin(pos.x * waveFrequency + time) * waveAmplitude;
    wave += sin(pos.z * waveFrequency * 0.5 + time * 1.3) * waveAmplitude * 0.5;
    pos.y += wave;

    TexCoord = aTexCoord;
    gl_Position = MVP * vec4(pos, 1.0);
}
```

### Skeletal Animation Vertex Shader (HLSL)

```hlsl
// Skeletal animation with up to 4 bone influences per vertex

struct VertexInput
{
    float3 position : POSITION;
    float3 normal : NORMAL;
    float2 texCoord : TEXCOORD0;
    uint4 boneIndices : BLENDINDICES;
    float4 boneWeights : BLENDWEIGHT;
};

struct VertexOutput
{
    float4 position : SV_POSITION;
    float3 normal : NORMAL;
    float2 texCoord : TEXCOORD0;
};

cbuffer TransformBuffer : register(b0)
{
    float4x4 viewProjection;
};

cbuffer BoneBuffer : register(b1)
{
    float4x4 boneMatrices[128]; // Max 128 bones
};

VertexOutput main(VertexInput input)
{
    VertexOutput output;

    // Initialize skinned position and normal
    float4 skinnedPos = float4(0, 0, 0, 0);
    float3 skinnedNormal = float3(0, 0, 0);

    // Apply bone transformations
    [unroll]
    for (int i = 0; i < 4; i++)
    {
        float weight = input.boneWeights[i];
        if (weight > 0.0)
        {
            uint boneIndex = input.boneIndices[i];
            float4x4 boneMatrix = boneMatrices[boneIndex];

            skinnedPos += weight * mul(boneMatrix, float4(input.position, 1.0));
            skinnedNormal += weight * mul((float3x3)boneMatrix, input.normal);
        }
    }

    output.position = mul(viewProjection, skinnedPos);
    output.normal = normalize(skinnedNormal);
    output.texCoord = input.texCoord;

    return output;
}
```

---

## Fragment/Pixel Shaders

Fragment shaders (called pixel shaders in DirectX) run for each fragment/pixel and determine the final color output.

### Basic Blinn-Phong Lighting (GLSL)

```glsl
#version 330 core

in VS_OUT {
    vec3 FragPos;
    vec3 Normal;
    vec2 TexCoord;
    mat3 TBN;
} fs_in;

out vec4 FragColor;

// Material properties
struct Material {
    sampler2D diffuseMap;
    sampler2D specularMap;
    sampler2D normalMap;
    float shininess;
};

// Light properties
struct Light {
    vec3 position;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float constant;
    float linear;
    float quadratic;
};

uniform Material material;
uniform Light light;
uniform vec3 viewPos;
uniform bool useNormalMap;

void main()
{
    // Sample textures
    vec3 diffuseColor = texture(material.diffuseMap, fs_in.TexCoord).rgb;
    vec3 specularColor = texture(material.specularMap, fs_in.TexCoord).rgb;

    // Normal calculation
    vec3 normal;
    if (useNormalMap)
    {
        // Sample normal map and transform from [0,1] to [-1,1]
        normal = texture(material.normalMap, fs_in.TexCoord).rgb;
        normal = normal * 2.0 - 1.0;
        normal = normalize(fs_in.TBN * normal);
    }
    else
    {
        normal = normalize(fs_in.Normal);
    }

    // Lighting calculations
    vec3 lightDir = normalize(light.position - fs_in.FragPos);
    vec3 viewDir = normalize(viewPos - fs_in.FragPos);
    vec3 halfwayDir = normalize(lightDir + viewDir);

    // Ambient
    vec3 ambient = light.ambient * diffuseColor;

    // Diffuse (Lambertian)
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = light.diffuse * diff * diffuseColor;

    // Specular (Blinn-Phong)
    float spec = pow(max(dot(normal, halfwayDir), 0.0), material.shininess);
    vec3 specular = light.specular * spec * specularColor;

    // Attenuation
    float distance = length(light.position - fs_in.FragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance +
                               light.quadratic * distance * distance);

    // Final color
    vec3 result = (ambient + diffuse + specular) * attenuation;
    FragColor = vec4(result, 1.0);
}
```

### PBR (Physically Based Rendering) Fragment Shader

```glsl
#version 330 core

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoord;

out vec4 FragColor;

// PBR Textures
uniform sampler2D albedoMap;
uniform sampler2D normalMap;
uniform sampler2D metallicMap;
uniform sampler2D roughnessMap;
uniform sampler2D aoMap;

// IBL (Image-Based Lighting)
uniform samplerCube irradianceMap;
uniform samplerCube prefilterMap;
uniform sampler2D brdfLUT;

// Lights
uniform vec3 lightPositions[4];
uniform vec3 lightColors[4];
uniform vec3 camPos;

const float PI = 3.14159265359;

// Normal Distribution Function (GGX/Trowbridge-Reitz)
float DistributionGGX(vec3 N, vec3 H, float roughness)
{
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;

    float num = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return num / denom;
}

// Geometry Function (Schlick-GGX)
float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    float k = (r * r) / 8.0;

    float num = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return num / denom;
}

float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

// Fresnel Equation (Schlick approximation)
vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness)
{
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

void main()
{
    // Sample textures
    vec3 albedo = pow(texture(albedoMap, TexCoord).rgb, vec3(2.2)); // sRGB to linear
    float metallic = texture(metallicMap, TexCoord).r;
    float roughness = texture(roughnessMap, TexCoord).r;
    float ao = texture(aoMap, TexCoord).r;

    vec3 N = normalize(Normal);
    vec3 V = normalize(camPos - FragPos);
    vec3 R = reflect(-V, N);

    // Calculate reflectance at normal incidence
    vec3 F0 = vec3(0.04); // Default for dielectrics
    F0 = mix(F0, albedo, metallic);

    // Direct lighting
    vec3 Lo = vec3(0.0);
    for (int i = 0; i < 4; ++i)
    {
        vec3 L = normalize(lightPositions[i] - FragPos);
        vec3 H = normalize(V + L);
        float distance = length(lightPositions[i] - FragPos);
        float attenuation = 1.0 / (distance * distance);
        vec3 radiance = lightColors[i] * attenuation;

        // Cook-Torrance BRDF
        float NDF = DistributionGGX(N, H, roughness);
        float G = GeometrySmith(N, V, L, roughness);
        vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 numerator = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
        vec3 specular = numerator / denominator;

        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic;

        float NdotL = max(dot(N, L), 0.0);
        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    }

    // Ambient lighting (IBL)
    vec3 F = fresnelSchlickRoughness(max(dot(N, V), 0.0), F0, roughness);
    vec3 kS = F;
    vec3 kD = 1.0 - kS;
    kD *= 1.0 - metallic;

    vec3 irradiance = texture(irradianceMap, N).rgb;
    vec3 diffuse = irradiance * albedo;

    const float MAX_REFLECTION_LOD = 4.0;
    vec3 prefilteredColor = textureLod(prefilterMap, R, roughness * MAX_REFLECTION_LOD).rgb;
    vec2 brdf = texture(brdfLUT, vec2(max(dot(N, V), 0.0), roughness)).rg;
    vec3 specular = prefilteredColor * (F * brdf.x + brdf.y);

    vec3 ambient = (kD * diffuse + specular) * ao;
    vec3 color = ambient + Lo;

    // HDR tonemapping
    color = color / (color + vec3(1.0));
    // Gamma correction
    color = pow(color, vec3(1.0 / 2.2));

    FragColor = vec4(color, 1.0);
}
```

---

## Uniforms and Varyings

### Uniforms

Uniforms are read-only values that remain constant for all vertices/fragments in a single draw call.

```glsl
// GLSL Uniforms
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPosition;
uniform float time;
uniform sampler2D mainTexture;
uniform samplerCube environmentMap;

// Uniform blocks for better performance
layout (std140) uniform Matrices
{
    mat4 projection;
    mat4 view;
};

layout (std140) uniform LightData
{
    vec4 lightPosition;   // 16 bytes
    vec4 lightColor;      // 16 bytes
    float intensity;      // 4 bytes
    float range;          // 4 bytes
    vec2 padding;         // 8 bytes (alignment)
};
```

```hlsl
// HLSL Constant Buffers
cbuffer PerFrame : register(b0)
{
    float4x4 view;
    float4x4 projection;
    float3 cameraPosition;
    float time;
};

cbuffer PerObject : register(b1)
{
    float4x4 model;
    float4x4 modelInverseTranspose;
};

cbuffer MaterialData : register(b2)
{
    float4 albedo;
    float metallic;
    float roughness;
    float2 padding;
};

// Textures and samplers
Texture2D diffuseTexture : register(t0);
Texture2D normalTexture : register(t1);
TextureCube environmentMap : register(t2);
SamplerState linearSampler : register(s0);
```

### Varyings (Interpolated Values)

Varyings are values passed from vertex shader to fragment shader, automatically interpolated across the triangle.

```glsl
// Vertex Shader
out vec3 v_WorldPosition;
out vec3 v_Normal;
out vec2 v_TexCoord;
out vec4 v_Color;

// Fragment Shader
in vec3 v_WorldPosition;
in vec3 v_Normal;
in vec2 v_TexCoord;
in vec4 v_Color;

// Flat qualifier disables interpolation
flat out int v_MaterialID;
```

```hlsl
// Using semantics in HLSL
struct VS_OUTPUT
{
    float4 position : SV_POSITION;  // System value - clip position
    float3 worldPos : TEXCOORD0;    // Interpolated
    float3 normal : TEXCOORD1;      // Interpolated
    float2 texCoord : TEXCOORD2;    // Interpolated
    nointerpolation uint matID : TEXCOORD3; // No interpolation
};
```

---

## Texture Sampling

Textures are fundamental to shader programming, providing color, normal, and other data.

### Basic Texture Sampling (GLSL)

```glsl
#version 330 core

in vec2 TexCoord;
out vec4 FragColor;

uniform sampler2D albedoTexture;
uniform sampler2D normalTexture;
uniform sampler2D heightTexture;
uniform samplerCube cubeMap;

void main()
{
    // Basic 2D sampling
    vec4 albedo = texture(albedoTexture, TexCoord);

    // Sample with explicit LOD
    vec4 mippedColor = textureLod(albedoTexture, TexCoord, 2.0);

    // Sample with offset
    vec4 offsetColor = textureOffset(albedoTexture, TexCoord, ivec2(1, 0));

    // Gather (sample 4 texels at once)
    vec4 gathered = textureGather(albedoTexture, TexCoord, 0); // 0 = red channel

    // Cubemap sampling
    vec3 reflectionDir = reflect(-viewDir, normal);
    vec4 envColor = texture(cubeMap, reflectionDir);

    // Texture size query
    ivec2 texSize = textureSize(albedoTexture, 0);

    FragColor = albedo;
}
```

### Parallax Mapping

```glsl
#version 330 core

in vec3 TangentLightPos;
in vec3 TangentViewPos;
in vec3 TangentFragPos;
in vec2 TexCoord;

out vec4 FragColor;

uniform sampler2D diffuseMap;
uniform sampler2D normalMap;
uniform sampler2D depthMap;
uniform float heightScale;

// Parallax Occlusion Mapping
vec2 ParallaxMapping(vec2 texCoords, vec3 viewDir)
{
    // Number of depth layers
    const float minLayers = 8.0;
    const float maxLayers = 32.0;
    float numLayers = mix(maxLayers, minLayers, abs(dot(vec3(0.0, 0.0, 1.0), viewDir)));

    float layerDepth = 1.0 / numLayers;
    float currentLayerDepth = 0.0;

    vec2 P = viewDir.xy / viewDir.z * heightScale;
    vec2 deltaTexCoords = P / numLayers;

    vec2 currentTexCoords = texCoords;
    float currentDepthMapValue = texture(depthMap, currentTexCoords).r;

    // Ray march through depth layers
    while (currentLayerDepth < currentDepthMapValue)
    {
        currentTexCoords -= deltaTexCoords;
        currentDepthMapValue = texture(depthMap, currentTexCoords).r;
        currentLayerDepth += layerDepth;
    }

    // Interpolation for smoother result
    vec2 prevTexCoords = currentTexCoords + deltaTexCoords;
    float afterDepth = currentDepthMapValue - currentLayerDepth;
    float beforeDepth = texture(depthMap, prevTexCoords).r - currentLayerDepth + layerDepth;
    float weight = afterDepth / (afterDepth - beforeDepth);

    return prevTexCoords * weight + currentTexCoords * (1.0 - weight);
}

void main()
{
    vec3 viewDir = normalize(TangentViewPos - TangentFragPos);
    vec2 texCoords = ParallaxMapping(TexCoord, viewDir);

    // Discard fragments outside texture bounds
    if (texCoords.x > 1.0 || texCoords.y > 1.0 || texCoords.x < 0.0 || texCoords.y < 0.0)
        discard;

    vec3 color = texture(diffuseMap, texCoords).rgb;
    vec3 normal = texture(normalMap, texCoords).rgb;
    normal = normalize(normal * 2.0 - 1.0);

    // Lighting calculation...
    FragColor = vec4(color, 1.0);
}
```

### Texture Sampling in HLSL

```hlsl
// Texture and sampler declarations
Texture2D albedoTexture : register(t0);
Texture2D normalTexture : register(t1);
Texture2DArray textureArray : register(t2);
TextureCube cubeMap : register(t3);
Texture3D volumeTexture : register(t4);

SamplerState linearClamp : register(s0);
SamplerState linearWrap : register(s1);
SamplerState pointSampler : register(s2);
SamplerComparisonState shadowSampler : register(s3);

float4 main(VS_OUTPUT input) : SV_TARGET
{
    // Basic sampling
    float4 albedo = albedoTexture.Sample(linearWrap, input.texCoord);

    // Sample with explicit LOD
    float4 mipped = albedoTexture.SampleLevel(linearWrap, input.texCoord, 2.0);

    // Sample with gradient (for anisotropic filtering control)
    float2 ddx = ddx_fine(input.texCoord);
    float2 ddy = ddy_fine(input.texCoord);
    float4 aniso = albedoTexture.SampleGrad(linearWrap, input.texCoord, ddx, ddy);

    // Texture array sampling
    float4 arrayColor = textureArray.Sample(linearWrap, float3(input.texCoord, 2.0));

    // Cubemap sampling
    float4 envColor = cubeMap.Sample(linearWrap, reflectionDir);

    // Shadow comparison sampling
    float shadow = shadowMap.SampleCmpLevelZero(shadowSampler, shadowCoord.xy, shadowCoord.z);

    return albedo;
}
```

---

## Surface Shaders (Unity)

Unity's Surface Shaders provide a higher-level abstraction for writing shaders, automatically handling lighting and shadows.

### Basic Surface Shader

```hlsl
Shader "Custom/BasicSurface"
{
    Properties
    {
        _Color ("Color", Color) = (1,1,1,1)
        _MainTex ("Albedo (RGB)", 2D) = "white" {}
        _Glossiness ("Smoothness", Range(0,1)) = 0.5
        _Metallic ("Metallic", Range(0,1)) = 0.0
    }

    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 200

        CGPROGRAM
        // Physically based Standard lighting model
        #pragma surface surf Standard fullforwardshadows
        #pragma target 3.0

        sampler2D _MainTex;

        struct Input
        {
            float2 uv_MainTex;
            float3 worldPos;
            float3 worldNormal;
            INTERNAL_DATA
        };

        half _Glossiness;
        half _Metallic;
        fixed4 _Color;

        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            // Albedo comes from a texture tinted by color
            fixed4 c = tex2D (_MainTex, IN.uv_MainTex) * _Color;
            o.Albedo = c.rgb;

            // Metallic and smoothness
            o.Metallic = _Metallic;
            o.Smoothness = _Glossiness;
            o.Alpha = c.a;
        }
        ENDCG
    }
    FallBack "Diffuse"
}
```

### Advanced Surface Shader with Custom Lighting

```hlsl
Shader "Custom/ToonSurface"
{
    Properties
    {
        _Color ("Color", Color) = (1,1,1,1)
        _MainTex ("Albedo (RGB)", 2D) = "white" {}
        _RampTex ("Toon Ramp", 2D) = "white" {}
        _OutlineColor ("Outline Color", Color) = (0,0,0,1)
        _OutlineWidth ("Outline Width", Range(0, 0.1)) = 0.01
    }

    SubShader
    {
        Tags { "RenderType"="Opaque" }
        LOD 200

        // Outline Pass
        Pass
        {
            Name "OUTLINE"
            Tags { "LightMode" = "Always" }
            Cull Front
            ZWrite On

            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float3 normal : NORMAL;
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
            };

            float _OutlineWidth;
            fixed4 _OutlineColor;

            v2f vert(appdata v)
            {
                v2f o;
                float3 norm = normalize(v.normal);
                float3 offset = norm * _OutlineWidth;
                o.pos = UnityObjectToClipPos(v.vertex + float4(offset, 0));
                return o;
            }

            fixed4 frag(v2f i) : SV_Target
            {
                return _OutlineColor;
            }
            ENDCG
        }

        // Main Surface Pass
        CGPROGRAM
        #pragma surface surf Toon fullforwardshadows
        #pragma target 3.0

        sampler2D _MainTex;
        sampler2D _RampTex;
        fixed4 _Color;

        struct Input
        {
            float2 uv_MainTex;
        };

        // Custom toon lighting function
        half4 LightingToon(SurfaceOutput s, half3 lightDir, half atten)
        {
            half NdotL = dot(s.Normal, lightDir);
            half diff = NdotL * 0.5 + 0.5; // Remap to 0-1

            // Sample ramp texture for toon shading
            half3 ramp = tex2D(_RampTex, float2(diff, 0.5)).rgb;

            half4 c;
            c.rgb = s.Albedo * _LightColor0.rgb * ramp * atten;
            c.a = s.Alpha;
            return c;
        }

        void surf (Input IN, inout SurfaceOutput o)
        {
            fixed4 c = tex2D (_MainTex, IN.uv_MainTex) * _Color;
            o.Albedo = c.rgb;
            o.Alpha = c.a;
        }
        ENDCG
    }
    FallBack "Diffuse"
}
```

### Dissolve Effect Surface Shader

```hlsl
Shader "Custom/Dissolve"
{
    Properties
    {
        _Color ("Color", Color) = (1,1,1,1)
        _MainTex ("Albedo (RGB)", 2D) = "white" {}
        _NoiseTex ("Noise Texture", 2D) = "white" {}
        _DissolveAmount ("Dissolve Amount", Range(0,1)) = 0
        _EdgeColor ("Edge Color", Color) = (1,0.5,0,1)
        _EdgeWidth ("Edge Width", Range(0, 0.2)) = 0.05
    }

    SubShader
    {
        Tags { "RenderType"="Opaque" "Queue"="Geometry" }
        LOD 200

        CGPROGRAM
        #pragma surface surf Standard fullforwardshadows
        #pragma target 3.0

        sampler2D _MainTex;
        sampler2D _NoiseTex;
        fixed4 _Color;
        fixed4 _EdgeColor;
        half _DissolveAmount;
        half _EdgeWidth;

        struct Input
        {
            float2 uv_MainTex;
            float2 uv_NoiseTex;
        };

        void surf (Input IN, inout SurfaceOutputStandard o)
        {
            // Sample noise texture
            float noise = tex2D(_NoiseTex, IN.uv_NoiseTex).r;

            // Discard pixels based on dissolve amount
            float dissolve = noise - _DissolveAmount;
            clip(dissolve);

            // Main texture
            fixed4 c = tex2D (_MainTex, IN.uv_MainTex) * _Color;

            // Edge glow
            float edge = smoothstep(0.0, _EdgeWidth, dissolve);
            o.Albedo = lerp(_EdgeColor.rgb, c.rgb, edge);
            o.Emission = (1.0 - edge) * _EdgeColor.rgb * 2.0;

            o.Metallic = 0;
            o.Smoothness = 0.5;
            o.Alpha = c.a;
        }
        ENDCG
    }
    FallBack "Diffuse"
}
```

---

## Compute Shaders

Compute shaders are general-purpose GPU programs not tied to the graphics pipeline. They're used for physics simulations, image processing, and other parallel computations.

### Basic Compute Shader (HLSL/DirectX)

```hlsl
// ComputeShader.hlsl
// Thread group size
#define THREAD_GROUP_SIZE 256

// Structured buffer for input/output
StructuredBuffer<float3> InputPositions : register(t0);
RWStructuredBuffer<float3> OutputPositions : register(u0);

// Constants
cbuffer SimulationParams : register(b0)
{
    float deltaTime;
    float gravity;
    uint particleCount;
    float damping;
};

[numthreads(THREAD_GROUP_SIZE, 1, 1)]
void CSMain(
    uint3 groupId : SV_GroupID,
    uint3 groupThreadId : SV_GroupThreadID,
    uint3 dispatchThreadId : SV_DispatchThreadID,
    uint groupIndex : SV_GroupIndex
)
{
    uint index = dispatchThreadId.x;

    // Bounds check
    if (index >= particleCount)
        return;

    // Read current position
    float3 pos = InputPositions[index];

    // Apply gravity
    pos.y -= gravity * deltaTime;

    // Ground collision
    if (pos.y < 0.0)
    {
        pos.y = 0.0;
    }

    // Write result
    OutputPositions[index] = pos;
}
```

### Particle Simulation Compute Shader

```hlsl
// Particle structure
struct Particle
{
    float3 position;
    float3 velocity;
    float4 color;
    float life;
    float size;
};

// Buffers
RWStructuredBuffer<Particle> Particles : register(u0);
AppendStructuredBuffer<uint> DeadList : register(u1);
ConsumeStructuredBuffer<uint> AliveList : register(u2);

cbuffer SimParams : register(b0)
{
    float deltaTime;
    float3 gravity;
    float3 emitterPosition;
    uint maxParticles;
    float4 startColor;
    float4 endColor;
};

// Random number generation (simple hash)
float random(float2 st)
{
    return frac(sin(dot(st, float2(12.9898, 78.233))) * 43758.5453123);
}

[numthreads(256, 1, 1)]
void UpdateParticles(uint3 id : SV_DispatchThreadID)
{
    uint index = id.x;
    if (index >= maxParticles)
        return;

    Particle p = Particles[index];

    if (p.life <= 0.0)
    {
        // Add to dead list for recycling
        DeadList.Append(index);
        return;
    }

    // Update physics
    p.velocity += gravity * deltaTime;
    p.position += p.velocity * deltaTime;

    // Update life
    p.life -= deltaTime;
    float lifeRatio = saturate(p.life);

    // Interpolate color over lifetime
    p.color = lerp(endColor, startColor, lifeRatio);

    // Shrink over lifetime
    p.size *= 0.99;

    Particles[index] = p;
}

[numthreads(1, 1, 1)]
void EmitParticles(uint3 id : SV_DispatchThreadID)
{
    // Consume a dead particle index
    uint index = AliveList.Consume();

    // Initialize new particle
    Particle p;
    p.position = emitterPosition;

    // Random velocity
    float angle = random(float2(index, deltaTime)) * 6.28318;
    float speed = random(float2(deltaTime, index)) * 5.0 + 2.0;
    p.velocity = float3(cos(angle) * speed, speed * 2.0, sin(angle) * speed);

    p.color = startColor;
    p.life = 2.0 + random(float2(index * 0.1, deltaTime)) * 2.0;
    p.size = 0.1;

    Particles[index] = p;
}
```

### Compute Shader in OpenGL (GLSL)

```glsl
#version 430 core

layout(local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

// Image for read/write
layout(rgba32f, binding = 0) uniform image2D outputImage;

// Uniforms
uniform float time;
uniform vec2 resolution;

// Shared memory for optimization
shared vec4 sharedData[16][16];

void main()
{
    ivec2 pixelCoord = ivec2(gl_GlobalInvocationID.xy);
    vec2 uv = vec2(pixelCoord) / resolution;

    // Procedural pattern example
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(uv, center);

    float wave = sin(dist * 30.0 - time * 3.0) * 0.5 + 0.5;
    float circle = smoothstep(0.3, 0.29, dist);

    vec3 color = vec3(wave * circle);
    color *= vec3(uv.x, 0.5, uv.y); // Add some color variation

    // Write to image
    imageStore(outputImage, pixelCoord, vec4(color, 1.0));
}
```

### GPU Sorting (Bitonic Sort)

```hlsl
// Bitonic sort compute shader
RWStructuredBuffer<uint> Data : register(u0);

cbuffer SortParams : register(b0)
{
    uint level;
    uint levelMask;
    uint width;
    uint height;
};

groupshared uint sharedData[1024];

[numthreads(512, 1, 1)]
void BitonicSort(uint3 DTid : SV_DispatchThreadID, uint GI : SV_GroupIndex)
{
    // Load data into shared memory
    sharedData[GI] = Data[DTid.x];
    GroupMemoryBarrierWithGroupSync();

    // Bitonic sort
    for (uint k = 2; k <= 1024; k *= 2)
    {
        for (uint j = k / 2; j > 0; j /= 2)
        {
            uint index = GI;
            uint ixj = index ^ j;

            if (ixj > index)
            {
                bool ascending = ((index & k) == 0);

                if ((sharedData[index] > sharedData[ixj]) == ascending)
                {
                    // Swap
                    uint temp = sharedData[index];
                    sharedData[index] = sharedData[ixj];
                    sharedData[ixj] = temp;
                }
            }
            GroupMemoryBarrierWithGroupSync();
        }
    }

    // Write back to global memory
    Data[DTid.x] = sharedData[GI];
}
```

---

## Shader Debugging

Debugging shaders can be challenging since traditional debugging tools don't work. Here are effective strategies and techniques.

### Visual Debugging

```glsl
#version 330 core

out vec4 FragColor;

in vec3 Normal;
in vec2 TexCoord;
in vec3 WorldPos;

uniform int debugMode;
uniform sampler2D mainTexture;

void main()
{
    vec3 color;

    switch (debugMode)
    {
        case 0: // Normal visualization
            color = Normal * 0.5 + 0.5;
            break;

        case 1: // UV visualization
            color = vec3(TexCoord, 0.0);
            break;

        case 2: // World position
            color = fract(WorldPos);
            break;

        case 3: // Texture
            color = texture(mainTexture, TexCoord).rgb;
            break;

        case 4: // Checkerboard (UV issues)
            float checker = mod(floor(TexCoord.x * 10.0) + floor(TexCoord.y * 10.0), 2.0);
            color = vec3(checker);
            break;

        case 5: // Depth visualization
            float depth = gl_FragCoord.z;
            color = vec3(depth);
            break;

        case 6: // Facing ratio
            vec3 viewDir = normalize(-WorldPos);
            float facing = dot(Normal, viewDir);
            color = vec3(facing);
            break;

        default:
            color = vec3(1.0, 0.0, 1.0); // Magenta for unknown mode
    }

    FragColor = vec4(color, 1.0);
}
```

### Shader Validation and Error Handling

```cpp
// C++ code for shader compilation with error handling
GLuint CompileShader(GLenum type, const char* source)
{
    GLuint shader = glCreateShader(type);
    glShaderSource(shader, 1, &source, nullptr);
    glCompileShader(shader);

    // Check for compilation errors
    GLint success;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &success);

    if (!success)
    {
        GLchar infoLog[1024];
        glGetShaderInfoLog(shader, sizeof(infoLog), nullptr, infoLog);

        const char* shaderType = (type == GL_VERTEX_SHADER) ? "VERTEX" :
                                 (type == GL_FRAGMENT_SHADER) ? "FRAGMENT" :
                                 (type == GL_COMPUTE_SHADER) ? "COMPUTE" : "UNKNOWN";

        std::cerr << "ERROR::SHADER::" << shaderType << "::COMPILATION_FAILED\n"
                  << infoLog << std::endl;

        glDeleteShader(shader);
        return 0;
    }

    return shader;
}

GLuint CreateShaderProgram(const char* vertexSource, const char* fragmentSource)
{
    GLuint vertexShader = CompileShader(GL_VERTEX_SHADER, vertexSource);
    GLuint fragmentShader = CompileShader(GL_FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader)
    {
        return 0;
    }

    GLuint program = glCreateProgram();
    glAttachShader(program, vertexShader);
    glAttachShader(program, fragmentShader);
    glLinkProgram(program);

    // Check linking errors
    GLint success;
    glGetProgramiv(program, GL_LINK_STATUS, &success);

    if (!success)
    {
        GLchar infoLog[1024];
        glGetProgramInfoLog(program, sizeof(infoLog), nullptr, infoLog);
        std::cerr << "ERROR::PROGRAM::LINKING_FAILED\n" << infoLog << std::endl;

        glDeleteProgram(program);
        return 0;
    }

    // Validate program
    glValidateProgram(program);
    glGetProgramiv(program, GL_VALIDATE_STATUS, &success);

    if (!success)
    {
        GLchar infoLog[1024];
        glGetProgramInfoLog(program, sizeof(infoLog), nullptr, infoLog);
        std::cerr << "WARNING::PROGRAM::VALIDATION\n" << infoLog << std::endl;
    }

    // Clean up shaders (they're linked to the program now)
    glDeleteShader(vertexShader);
    glDeleteShader(fragmentShader);

    return program;
}
```

### Debug Printf in GLSL (Vulkan)

```glsl
#version 450
#extension GL_EXT_debug_printf : enable

layout(location = 0) in vec3 fragColor;
layout(location = 0) out vec4 outColor;

void main()
{
    // Debug output (visible in validation layers)
    debugPrintfEXT("Fragment color: (%f, %f, %f)\n",
                   fragColor.r, fragColor.g, fragColor.b);

    outColor = vec4(fragColor, 1.0);
}
```

### RenderDoc Integration

```cpp
// Code to trigger RenderDoc capture programmatically
#ifdef _DEBUG
#include "renderdoc_app.h"

RENDERDOC_API_1_1_2* rdoc_api = nullptr;

void InitRenderDoc()
{
    if (HMODULE mod = GetModuleHandleA("renderdoc.dll"))
    {
        pRENDERDOC_GetAPI RENDERDOC_GetAPI =
            (pRENDERDOC_GetAPI)GetProcAddress(mod, "RENDERDOC_GetAPI");

        int ret = RENDERDOC_GetAPI(eRENDERDOC_API_Version_1_1_2, (void**)&rdoc_api);
        assert(ret == 1);
    }
}

void BeginCapture()
{
    if (rdoc_api) rdoc_api->StartFrameCapture(nullptr, nullptr);
}

void EndCapture()
{
    if (rdoc_api) rdoc_api->EndFrameCapture(nullptr, nullptr);
}
#endif
```

### Performance Profiling

```glsl
// Using timer queries to measure shader performance (OpenGL)
// Host code:
GLuint queryStart, queryEnd;
glGenQueries(1, &queryStart);
glGenQueries(1, &queryEnd);

// Before draw call
glQueryCounter(queryStart, GL_TIMESTAMP);

// Draw call here
glDrawArrays(GL_TRIANGLES, 0, vertexCount);

// After draw call
glQueryCounter(queryEnd, GL_TIMESTAMP);

// Wait for results
GLint stopTimerAvailable = 0;
while (!stopTimerAvailable)
{
    glGetQueryObjectiv(queryEnd, GL_QUERY_RESULT_AVAILABLE, &stopTimerAvailable);
}

// Get timestamps
GLuint64 startTime, endTime;
glGetQueryObjectui64v(queryStart, GL_QUERY_RESULT, &startTime);
glGetQueryObjectui64v(queryEnd, GL_QUERY_RESULT, &endTime);

// Calculate elapsed time in milliseconds
double elapsedMs = (endTime - startTime) / 1000000.0;
std::cout << "Shader execution time: " << elapsedMs << " ms" << std::endl;
```

---

## Best Practices and Optimization

### General Guidelines

```glsl
// 1. Minimize branching
// Bad:
if (condition)
    result = expensiveCalculationA();
else
    result = expensiveCalculationB();

// Better (if both branches are similar cost):
result = mix(expensiveCalculationB(), expensiveCalculationA(), float(condition));

// 2. Use built-in functions
// Bad:
float len = sqrt(x*x + y*y + z*z);

// Good:
float len = length(vec3(x, y, z));

// 3. Avoid redundant calculations
// Bad:
float a = sin(x) * cos(y);
float b = sin(x) * sin(y);

// Good:
float sinX = sin(x);
float a = sinX * cos(y);
float b = sinX * sin(y);

// 4. Use appropriate precision (GLSL ES / Mobile)
precision mediump float; // For most calculations
precision highp float;   // When precision matters (positions, shadows)

// 5. Texture sampling optimization
// Prefer: Sample once, use multiple times
vec4 texColor = texture(mainTex, uv);
float r = texColor.r;
float g = texColor.g;

// 6. Early depth testing
layout(early_fragment_tests) in; // Enable early-Z when safe

// 7. Discard with caution (disables early-Z)
// Only use when necessary
if (alpha < 0.01) discard;
```

### Memory Access Patterns

```hlsl
// Compute shader optimization: Coalesced memory access
// Bad: Strided access
[numthreads(256, 1, 1)]
void Bad(uint3 id : SV_DispatchThreadID)
{
    // Each thread accesses memory far apart
    float value = data[id.x * 1024];
}

// Good: Coalesced access
[numthreads(256, 1, 1)]
void Good(uint3 id : SV_DispatchThreadID)
{
    // Adjacent threads access adjacent memory
    float value = data[id.x];
}

// Use shared memory for repeated access
groupshared float sharedCache[256];

[numthreads(256, 1, 1)]
void WithSharedMemory(uint3 id : SV_DispatchThreadID, uint gi : SV_GroupIndex)
{
    // Load to shared memory
    sharedCache[gi] = inputData[id.x];
    GroupMemoryBarrierWithGroupSync();

    // Multiple accesses from shared memory (much faster)
    float sum = 0;
    for (int i = 0; i < 256; i++)
    {
        sum += sharedCache[i] * weights[i];
    }
}
```

---

## Interview Preparation

### Core Concepts

**Q1: What is the difference between vertex shaders and fragment shaders?**

```
Vertex Shader:
- Runs once per vertex
- Transforms vertex positions (model -> world -> view -> clip space)
- Calculates per-vertex data (normals, tangents)
- Output: gl_Position (clip-space position)

Fragment Shader:
- Runs once per fragment/pixel (after rasterization)
- Determines final pixel color
- Handles texturing, lighting, effects
- Output: Fragment color (and optionally depth)

Data flows from vertex shader to fragment shader through varyings,
which are automatically interpolated across the triangle.
```

**Q2: Explain the graphics pipeline stages.**

```
1. Input Assembly: Gather vertices and indices
2. Vertex Shader: Transform vertices (programmable)
3. Tessellation (optional): Subdivide geometry
4. Geometry Shader (optional): Generate/modify primitives
5. Rasterization: Convert triangles to fragments
6. Fragment Shader: Calculate pixel colors (programmable)
7. Depth/Stencil Test: Per-fragment visibility testing
8. Blending: Combine with framebuffer
9. Output: Write to render target
```

**Q3: What are uniforms, attributes, and varyings?**

```glsl
// Uniforms: Constants for all vertices/fragments in a draw call
uniform mat4 modelMatrix;     // Set from CPU, read-only
uniform float time;

// Attributes (GLSL) / Input (HLSL): Per-vertex data
in vec3 aPosition;            // From vertex buffer
in vec3 aNormal;
in vec2 aTexCoord;

// Varyings: Data passed from vertex to fragment shader
out vec3 vWorldPos;           // Written in vertex shader
in vec3 vWorldPos;            // Read in fragment shader
// Automatically interpolated across the triangle
```

**Q4: How does normal mapping work?**

```
Normal mapping adds surface detail without extra geometry:

1. Store normals in a texture (tangent space, RGB = XYZ)
2. Build TBN matrix (Tangent, Bitangent, Normal) per vertex
3. Sample normal map in fragment shader
4. Transform sampled normal from tangent space to world space
5. Use transformed normal for lighting calculations

Benefits:
- Adds detail without geometry cost
- Works with any mesh (using tangent space)
- Efficient for runtime deformation

Considerations:
- Requires tangent vectors in vertex data
- Normal map compression can cause artifacts
- MIP mapping needs special handling
```

**Q5: What is a compute shader and when would you use it?**

```
Compute shaders are general-purpose GPU programs:

Characteristics:
- Not part of graphics pipeline
- Organized into thread groups (workgroups)
- Access to shared memory within group
- Read/write access to buffers and images

Use cases:
- Particle simulations
- Post-processing effects
- Physics calculations
- Image processing
- GPU-based culling
- Data parallel algorithms (sorting, reduction)

Dispatch example:
glDispatchCompute(numGroupsX, numGroupsY, numGroupsZ);
// Total threads = numGroups * local_size
```

### Common Pitfalls

```glsl
// 1. Forgetting to normalize vectors
vec3 normal = vNormal; // May not be unit length after interpolation!
vec3 normal = normalize(vNormal); // Correct

// 2. Matrix multiplication order
// GLSL: column-major, multiply left-to-right
vec4 worldPos = modelMatrix * vec4(position, 1.0);
vec4 clipPos = projectionMatrix * viewMatrix * worldPos;

// 3. Precision issues
float depth = gl_FragCoord.z; // Only 24-bit precision
// Use linear depth for distance calculations

// 4. Gamma correction
vec3 color = texture(diffuseMap, uv).rgb;
color = pow(color, vec3(2.2)); // sRGB to linear
// ... lighting calculations ...
color = pow(color, vec3(1.0/2.2)); // Linear to sRGB

// 5. Shadow acne
// Add bias based on surface angle
float bias = max(0.05 * (1.0 - dot(normal, lightDir)), 0.005);
float shadow = currentDepth - bias > closestDepth ? 0.0 : 1.0;
```

### Performance Tips Summary

```
1. Minimize texture samples
2. Use lower precision when possible (mediump, half)
3. Avoid dynamic branching
4. Batch state changes
5. Use instancing for repeated geometry
6. Early-Z: avoid discard when possible
7. Optimize for cache: sequential memory access
8. Use compute shaders for parallel data processing
9. Profile on target hardware (mobile vs desktop differs)
10. LOD for shaders (simpler shaders for distant objects)
```

---

## Resources and Further Learning

### Documentation
- [OpenGL Wiki - GLSL](https://www.khronos.org/opengl/wiki/Core_Language_(GLSL))
- [Microsoft HLSL Documentation](https://docs.microsoft.com/en-us/windows/win32/direct3dhlsl/dx-graphics-hlsl)
- [Vulkan GLSL Reference](https://www.khronos.org/registry/vulkan/specs/1.2-extensions/html/vkspec.html)

### Books
- "Real-Time Rendering" by Akenine-Moller et al.
- "GPU Gems" series (NVIDIA)
- "The Book of Shaders" (online resource)

### Tools
- **RenderDoc**: Graphics debugger for frame analysis
- **NVIDIA Nsight**: GPU profiling and debugging
- **AMD Radeon GPU Profiler**: AMD-specific profiling
- **Shader Playground**: Online shader compiler explorer

### Practice Resources
- **Shadertoy**: Online shader playground
- **The Book of Shaders**: Interactive GLSL tutorials
- **Learn OpenGL**: Comprehensive graphics tutorials

---

## Summary

Shader programming is a fundamental skill for graphics and game development. Key takeaways:

1. **Understand the pipeline**: Know where each shader type fits and what data flows between stages

2. **Master the languages**: Learn both GLSL and HLSL as they're used across different platforms and engines

3. **Think parallel**: Shaders execute in parallel - design for this paradigm

4. **Optimize wisely**: Profile first, optimize bottlenecks, and consider target hardware

5. **Debug systematically**: Use visual debugging, validation layers, and proper error handling

6. **Keep learning**: Graphics technology evolves rapidly - stay current with new techniques and APIs

With practice and experimentation, you'll develop the intuition needed to create stunning real-time graphics and solve complex rendering challenges.
