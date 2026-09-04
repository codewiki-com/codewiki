---
title: HLSL/GLSL Shader Fundamentals
description: Comprehensive guide to shader programming covering HLSL and GLSL syntax, vertex and fragment shaders, uniforms, varyings, and practical rendering techniques
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
origin: old/src/content/docs/gamedev/shader-fundamentals.en.md
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

Shaders are programs that run on the GPU, transforming vertices and coloring pixels to create the visual output we see on screen. Understanding shader programming is essential for any graphics programmer, whether you're creating stylized effects, optimizing rendering performance, or implementing custom lighting models. This guide covers both HLSL (High-Level Shading Language, used in DirectX and Unity) and GLSL (OpenGL Shading Language, used in OpenGL and Vulkan), providing a solid foundation for shader development.

---

## Concept Explanation

### What Are Shaders?

Shaders are small programs that execute on the GPU (Graphics Processing Unit) in a massively parallel fashion. Unlike CPU programs that typically run sequentially, shaders process thousands of vertices or pixels simultaneously, making them incredibly efficient for graphics operations.

The term "shader" originally referred to programs that computed shading (light and shadow), but modern shaders handle much more: geometry transformation, texture mapping, post-processing effects, and even general-purpose computation.

### The Graphics Pipeline

Understanding where shaders fit in the graphics pipeline is crucial:

```
[Application] -> [Vertex Shader] -> [Tessellation*] -> [Geometry Shader*]
     -> [Rasterization] -> [Fragment/Pixel Shader] -> [Output Merger] -> [Framebuffer]

* Optional stages
```

**Key Stages:**
1. **Vertex Shader**: Processes each vertex, transforming positions and passing data to later stages
2. **Tessellation Shaders** (optional): Subdivide geometry for detail
3. **Geometry Shader** (optional): Can create or destroy geometry
4. **Rasterization**: Converts geometry to fragments (potential pixels)
5. **Fragment/Pixel Shader**: Determines the final color of each pixel

### HLSL vs GLSL

| Aspect | HLSL | GLSL |
|--------|------|------|
| **Platform** | DirectX, Xbox, Unity | OpenGL, Vulkan, WebGL |
| **Entry Point** | Named functions (e.g., `VSMain`) | Always `main()` |
| **Semantics** | Required (`: POSITION`) | Layout qualifiers |
| **Matrix Order** | Row-major by default | Column-major |
| **Texture Sampling** | `texture.Sample(sampler, uv)` | `texture(sampler, uv)` |
| **Vector Swizzling** | `.xyzw` or `.rgba` | Same |

---

## Core Principles

### Shader Data Types

Both languages share similar fundamental data types:

**HLSL:**
```hlsl
// Scalar types
float  f = 1.0;      // 32-bit floating point
half   h = 1.0h;     // 16-bit floating point (mobile optimization)
int    i = 1;        // 32-bit signed integer
uint   u = 1u;       // 32-bit unsigned integer
bool   b = true;     // Boolean

// Vector types
float2 v2 = float2(1.0, 2.0);
float3 v3 = float3(1.0, 2.0, 3.0);
float4 v4 = float4(1.0, 2.0, 3.0, 4.0);

// Matrix types
float3x3 mat3;       // 3x3 matrix
float4x4 mat4;       // 4x4 matrix

// Swizzling - access and rearrange components
float3 rgb = v4.rgb;           // Extract first 3 components
float2 yx = v2.yx;             // Swapped components
float4 xxxx = v4.xxxx;         // Replicate single component
```

**GLSL:**
```glsl
// Scalar types
float f = 1.0;       // 32-bit floating point
int   i = 1;         // 32-bit signed integer
uint  u = 1u;        // 32-bit unsigned integer
bool  b = true;      // Boolean

// Vector types
vec2 v2 = vec2(1.0, 2.0);
vec3 v3 = vec3(1.0, 2.0, 3.0);
vec4 v4 = vec4(1.0, 2.0, 3.0, 4.0);

// Integer vectors
ivec3 iv = ivec3(1, 2, 3);
uvec4 uv = uvec4(1u, 2u, 3u, 4u);

// Matrix types
mat3 m3;             // 3x3 matrix
mat4 m4;             // 4x4 matrix

// Swizzling works the same way
vec3 rgb = v4.rgb;
vec2 yx = v2.yx;
```

### Coordinate Spaces and Transformations

Vertices pass through several coordinate spaces:

```
Object Space -> World Space -> View Space -> Clip Space -> NDC -> Screen Space
     |              |             |             |
   Model        View (Camera)  Projection    Perspective
   Matrix         Matrix        Matrix        Division
```

**Standard Transformation (HLSL):**
```hlsl
cbuffer TransformBuffer : register(b0)
{
    float4x4 WorldMatrix;
    float4x4 ViewMatrix;
    float4x4 ProjectionMatrix;
    float4x4 WorldViewProjection; // Pre-multiplied for efficiency
};

struct VSInput
{
    float3 Position : POSITION;
    float3 Normal   : NORMAL;
    float2 TexCoord : TEXCOORD0;
};

struct VSOutput
{
    float4 Position      : SV_POSITION;  // Clip space position
    float3 WorldPosition : TEXCOORD0;    // For lighting calculations
    float3 WorldNormal   : TEXCOORD1;
    float2 TexCoord      : TEXCOORD2;
};

VSOutput VSMain(VSInput input)
{
    VSOutput output;

    // Transform to clip space
    output.Position = mul(float4(input.Position, 1.0), WorldViewProjection);

    // Transform to world space for lighting
    output.WorldPosition = mul(float4(input.Position, 1.0), WorldMatrix).xyz;

    // Transform normal (use inverse transpose for non-uniform scaling)
    output.WorldNormal = normalize(mul(input.Normal, (float3x3)WorldMatrix));

    output.TexCoord = input.TexCoord;

    return output;
}
```

**Standard Transformation (GLSL):**
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
    // Transform to clip space
    gl_Position = ubo.mvp * vec4(inPosition, 1.0);

    // Transform to world space
    fragWorldPos = (ubo.model * vec4(inPosition, 1.0)).xyz;

    // Transform normal
    fragNormal = normalize(mat3(ubo.model) * inNormal);

    fragTexCoord = inTexCoord;
}
```

---

## Key Concepts

### Uniforms and Constant Buffers

Uniforms are values that remain constant across all shader invocations in a draw call.

**HLSL Constant Buffers:**
```hlsl
// Constant buffer - updated once per frame
cbuffer PerFrameData : register(b0)
{
    float4x4 ViewProjection;
    float3   CameraPosition;
    float    Time;
    float3   AmbientLight;
    float    DeltaTime;
};

// Constant buffer - updated per object
cbuffer PerObjectData : register(b1)
{
    float4x4 WorldMatrix;
    float4   ObjectColor;
    float    Roughness;
    float    Metallic;
    float2   Padding; // Align to 16 bytes
};

// Structured buffer for many objects (SRV)
StructuredBuffer<float4x4> InstanceTransforms : register(t0);
```

**GLSL Uniform Buffers:**
```glsl
#version 450

// Uniform buffer object
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

// Storage buffer for many objects
layout(std430, binding = 2) readonly buffer InstanceData
{
    mat4 instanceTransforms[];
};
```

### Texture Sampling

**HLSL Texture Sampling:**
```hlsl
// Texture declarations
Texture2D<float4> AlbedoTexture : register(t0);
Texture2D<float3> NormalTexture : register(t1);
Texture2D<float>  RoughnessTexture : register(t2);
TextureCube<float4> EnvironmentMap : register(t3);

// Sampler states
SamplerState LinearSampler : register(s0);
SamplerState PointSampler : register(s1);
SamplerComparisonState ShadowSampler : register(s2);

float4 PSMain(VSOutput input) : SV_TARGET
{
    // Basic texture sampling
    float4 albedo = AlbedoTexture.Sample(LinearSampler, input.TexCoord);

    // Sample with explicit LOD
    float4 albedoLod = AlbedoTexture.SampleLevel(LinearSampler, input.TexCoord, 2.0);

    // Sample with gradient (for anisotropic filtering)
    float2 ddxUV = ddx(input.TexCoord);
    float2 ddyUV = ddy(input.TexCoord);
    float4 albedoGrad = AlbedoTexture.SampleGrad(LinearSampler, input.TexCoord, ddxUV, ddyUV);

    // Cubemap sampling
    float3 reflectDir = reflect(-viewDir, normal);
    float4 envColor = EnvironmentMap.Sample(LinearSampler, reflectDir);

    // Shadow map sampling with comparison
    float shadow = ShadowMap.SampleCmpLevelZero(ShadowSampler, shadowUV, depth);

    return albedo;
}
```

**GLSL Texture Sampling:**
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
    // Basic texture sampling
    vec4 albedo = texture(albedoTexture, fragTexCoord);

    // Sample with explicit LOD
    vec4 albedoLod = textureLod(albedoTexture, fragTexCoord, 2.0);

    // Sample with gradient
    vec2 dxUV = dFdx(fragTexCoord);
    vec2 dyUV = dFdy(fragTexCoord);
    vec4 albedoGrad = textureGrad(albedoTexture, fragTexCoord, dxUV, dyUV);

    // Cubemap sampling
    vec3 reflectDir = reflect(-viewDir, normal);
    vec4 envColor = texture(environmentMap, reflectDir);

    // Shadow map sampling (returns comparison result)
    vec3 shadowCoord = vec3(shadowUV, depth);
    float shadow = texture(shadowMap, shadowCoord);

    outColor = albedo;
}
```

### Input/Output Semantics

**HLSL Semantics:**
```hlsl
// Vertex shader input semantics
struct VSInput
{
    float3 Position  : POSITION;      // Vertex position
    float3 Normal    : NORMAL;        // Vertex normal
    float4 Tangent   : TANGENT;       // Tangent (w = handedness)
    float2 TexCoord0 : TEXCOORD0;     // Primary UV
    float2 TexCoord1 : TEXCOORD1;     // Lightmap UV
    float4 Color     : COLOR0;        // Vertex color
    uint   VertexID  : SV_VertexID;   // System-generated vertex index
    uint   InstanceID: SV_InstanceID; // Instance index for instancing
};

// Vertex shader output / Pixel shader input
struct VSOutput
{
    float4 Position  : SV_POSITION;   // Required: clip space position
    float3 WorldPos  : TEXCOORD0;     // Custom interpolated data
    float3 Normal    : TEXCOORD1;
    float2 TexCoord  : TEXCOORD2;
    float4 Color     : COLOR0;

    // Interpolation modifiers
    nointerpolation uint MaterialID : TEXCOORD3;  // Flat (no interpolation)
    centroid float2 CentroidUV : TEXCOORD4;       // Centroid sampling
};

// Pixel shader output
struct PSOutput
{
    float4 Color  : SV_TARGET0;       // Render target 0
    float4 Normal : SV_TARGET1;       // Render target 1 (for deferred)
    float  Depth  : SV_DEPTH;         // Custom depth output (optional)
};
```

**GLSL Layout Qualifiers:**
```glsl
#version 450

// Vertex shader inputs
layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec3 inNormal;
layout(location = 2) in vec4 inTangent;
layout(location = 3) in vec2 inTexCoord0;
layout(location = 4) in vec2 inTexCoord1;
layout(location = 5) in vec4 inColor;

// Vertex shader outputs
layout(location = 0) out vec3 fragWorldPos;
layout(location = 1) out vec3 fragNormal;
layout(location = 2) out vec2 fragTexCoord;
layout(location = 3) flat out uint fragMaterialID;  // No interpolation

// Built-in variables
// gl_VertexIndex   - Vertex index
// gl_InstanceIndex - Instance index
// gl_Position      - Output clip position

// Fragment shader outputs
layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 outNormal;
// gl_FragDepth     - Output depth (optional)
```

---

## Code Examples

### Basic Lit Shader (HLSL)

```hlsl
// Common.hlsli - Shared definitions
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

    // Transform TBN basis to world space
    output.Normal = normalize(mul(input.Normal, (float3x3)WorldInverseTranspose));
    output.Tangent = normalize(mul(input.Tangent.xyz, (float3x3)World));
    output.Bitangent = cross(output.Normal, output.Tangent) * input.Tangent.w;

    output.TexCoord = input.TexCoord;

    return output;
}

float4 PSMain(PSInput input) : SV_TARGET
{
    // Sample textures
    float4 albedo = AlbedoMap.Sample(LinearSampler, input.TexCoord);
    float3 normalSample = NormalMap.Sample(LinearSampler, input.TexCoord);

    // Unpack normal from [0,1] to [-1,1]
    float3 normalTS = normalSample * 2.0 - 1.0;

    // Construct TBN matrix and transform normal to world space
    float3x3 TBN = float3x3(
        normalize(input.Tangent),
        normalize(input.Bitangent),
        normalize(input.Normal)
    );
    float3 N = normalize(mul(normalTS, TBN));

    // Lighting calculations
    float3 L = normalize(-LightDirection);
    float3 V = normalize(CameraPosition - input.WorldPos);
    float3 H = normalize(L + V);

    // Diffuse (Lambert)
    float NdotL = max(dot(N, L), 0.0);
    float3 diffuse = albedo.rgb * NdotL * LightColor * LightIntensity;

    // Specular (Blinn-Phong)
    float NdotH = max(dot(N, H), 0.0);
    float specular = pow(NdotH, 32.0) * LightIntensity;

    // Fresnel
    float3 F0 = float3(0.04, 0.04, 0.04);
    float3 fresnel = FresnelSchlick(max(dot(H, V), 0.0), F0);

    // Ambient
    float3 ambient = albedo.rgb * AmbientIntensity;

    // Final color
    float3 color = ambient + diffuse + specular * fresnel;

    return float4(color, albedo.a);
}
```

### Basic Lit Shader (GLSL)

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

    // Transform TBN basis
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
    // Sample textures
    vec4 albedo = texture(albedoMap, fragTexCoord);
    vec3 normalSample = texture(normalMap, fragTexCoord).rgb;

    // Unpack normal
    vec3 normalTS = normalSample * 2.0 - 1.0;

    // TBN matrix
    mat3 TBN = mat3(
        normalize(fragTangent),
        normalize(fragBitangent),
        normalize(fragNormal)
    );
    vec3 N = normalize(TBN * normalTS);

    // Lighting
    vec3 L = normalize(-lightDirection);
    vec3 V = normalize(cameraPosition - fragWorldPos);
    vec3 H = normalize(L + V);

    // Diffuse
    float NdotL = max(dot(N, L), 0.0);
    vec3 diffuse = albedo.rgb * NdotL * lightColor * lightIntensity;

    // Specular
    float NdotH = max(dot(N, H), 0.0);
    float specular = pow(NdotH, 32.0) * lightIntensity;

    // Fresnel
    vec3 F0 = vec3(0.04);
    vec3 fresnel = fresnelSchlick(max(dot(H, V), 0.0), F0);

    // Ambient
    vec3 ambient = albedo.rgb * ambientIntensity;

    // Final color
    vec3 color = ambient + diffuse + specular * fresnel;

    outColor = vec4(color, albedo.a);
}
```

### Animated Water Shader

```hlsl
// WaterShader.hlsl - Stylized water with vertex animation

cbuffer WaterParams : register(b2)
{
    float4 WaveParams;    // x: amplitude, y: frequency, z: speed, w: steepness
    float4 WaveDirection; // xy: direction1, zw: direction2
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

// Gerstner wave function for realistic water waves
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

    // Apply multiple Gerstner waves
    float3 wave1 = GerstnerWave(position.xz, WaveDirection.xy,
                                 WaveParams.w, 10.0, Time * WaveParams.z, tangent, binormal);
    float3 wave2 = GerstnerWave(position.xz, WaveDirection.zw,
                                 WaveParams.w * 0.5, 5.0, Time * WaveParams.z * 1.3, tangent, binormal);
    float3 wave3 = GerstnerWave(position.xz, float2(0.5, 0.5),
                                 WaveParams.w * 0.25, 2.0, Time * WaveParams.z * 1.7, tangent, binormal);

    position += (wave1 + wave2 + wave3) * WaveParams.x;

    // Calculate normal from tangent and binormal
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

    // Fresnel for water reflection/refraction blend
    float fresnel = pow(1.0 - saturate(dot(N, V)), 3.0);

    // Simple reflection (would use cubemap in production)
    float3 R = reflect(-V, N);
    float3 skyColor = lerp(float3(0.5, 0.7, 1.0), float3(0.1, 0.2, 0.4), R.y * 0.5 + 0.5);

    // Water color with depth fade
    float3 waterDeep = WaterColor.rgb * 0.5;
    float3 waterShallow = WaterColor.rgb;
    float3 water = lerp(waterDeep, waterShallow, saturate(input.Height * 0.5 + 0.5));

    // Specular highlight (sun glint)
    float3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 256.0) * 2.0;

    // Foam at wave peaks
    float foam = smoothstep(0.3, 0.5, input.Height) * 0.5;

    // Combine
    float3 color = lerp(water, skyColor, fresnel * 0.5);
    color += spec * LightColor;
    color = lerp(color, FoamColor.rgb, foam);

    return float4(color, 0.9); // Slightly transparent
}
```

### Post-Processing Shader

```glsl
// post_process.glsl - Common post-processing effects
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

// ACES Filmic Tone Mapping
vec3 ACESFilm(vec3 x)
{
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// Film grain noise
float random(vec2 co)
{
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main()
{
    vec2 uv = fragTexCoord;
    vec2 center = vec2(0.5);

    // Chromatic aberration
    vec2 direction = uv - center;
    float dist = length(direction);
    vec2 offset = direction * chromaticAberration * dist * dist;

    vec3 color;
    color.r = texture(sceneTexture, uv + offset).r;
    color.g = texture(sceneTexture, uv).g;
    color.b = texture(sceneTexture, uv - offset).b;

    // Exposure
    color *= exposure;

    // Tone mapping
    color = ACESFilm(color);

    // Vignette
    float vignette = 1.0 - dot(direction, direction) * vignetteStrength;
    color *= vignette;

    // Film grain
    float grain = random(uv + vec2(time)) * filmGrain;
    color += grain - filmGrain * 0.5;

    // Gamma correction
    color = pow(color, vec3(1.0 / gamma));

    outColor = vec4(color, 1.0);
}
```

---

## Best Practices

### 1. Organize Shader Code

```hlsl
// Use include files for shared code
#include "Common.hlsli"
#include "Lighting.hlsli"
#include "PBR.hlsli"

// Group related constants
cbuffer MaterialProperties : register(b2)
{
    // Pack related data together
    float3 BaseColor;
    float  Metallic;

    float3 EmissiveColor;
    float  Roughness;

    float3 SubsurfaceColor;
    float  SubsurfaceStrength;
};
```

### 2. Use Proper Precision

```hlsl
// HLSL - Use min precision hints for mobile
min16float4 color;  // 16-bit float minimum precision
min10float depth;   // 10-bit float minimum precision

// GLSL - Use precision qualifiers
precision highp float;   // Vertex shader default
precision mediump float; // Fragment shader for mobile
precision lowp float;    // When range [-2, 2] is sufficient
```

### 3. Branch Carefully

```hlsl
// BAD: Dynamic branching based on varying data
if (input.TexCoord.x > 0.5)
{
    // Complex operation A
}
else
{
    // Complex operation B
}

// GOOD: Use conditional assignment when possible
float mask = step(0.5, input.TexCoord.x);
float3 result = lerp(operationB(), operationA(), mask);

// ACCEPTABLE: Uniform-based branching (all threads take same path)
if (EnableFeature)  // Uniform value
{
    // Feature code
}
```

### 4. Minimize Register Pressure

```hlsl
// BAD: Computing everything at once
float3 normal = computeNormal();
float3 albedo = sampleAlbedo();
float roughness = sampleRoughness();
float metallic = sampleMetallic();
float ao = sampleAO();
// ... then use all of them

// BETTER: Compute and use in stages
// Stage 1: Basic geometry
float3 normal = computeNormal();
float3 viewDir = normalize(CameraPosition - worldPos);

// Stage 2: Material sampling (reuse registers)
float3 albedo = sampleAlbedo();
float3 diffuse = computeDiffuse(albedo, normal, lightDir);

// Stage 3: Specular (albedo registers freed)
float roughness = sampleRoughness();
float3 specular = computeSpecular(normal, viewDir, lightDir, roughness);
```

---

## Common Pitfalls

### 1. Matrix Multiplication Order

```hlsl
// HLSL uses row-major by default, multiply vector on LEFT
float4 worldPos = mul(float4(position, 1.0), WorldMatrix);

// GLSL uses column-major, multiply vector on RIGHT
vec4 worldPos = worldMatrix * vec4(position, 1.0);

// Unity HLSL uses column-major (OpenGL style)
float4 worldPos = mul(WorldMatrix, float4(position, 1.0));
// OR use Unity's macro
float4 worldPos = UnityObjectToClipPos(position);
```

### 2. Normal Transformation

```hlsl
// WRONG: Using model matrix directly for normals
float3 worldNormal = mul(normal, (float3x3)WorldMatrix);  // Incorrect for non-uniform scale

// CORRECT: Use inverse transpose
float3 worldNormal = mul(normal, (float3x3)WorldInverseTranspose);
// Or normalize after transformation if scale is uniform
float3 worldNormal = normalize(mul(normal, (float3x3)WorldMatrix));
```

### 3. Floating Point Precision

```hlsl
// WRONG: Comparing floats directly
if (value == 0.0)  // May fail due to precision

// CORRECT: Use epsilon comparison
if (abs(value) < 0.0001)

// WRONG: Large world coordinates lose precision
float3 worldPos = float3(1000000.0, 0.5, 1000000.0);  // 0.5 may be lost

// CORRECT: Use camera-relative rendering for large worlds
float3 cameraRelativePos = worldPos - cameraPosition;  // Computed on CPU with doubles
```

### 4. Texture Coordinate Issues

```hlsl
// Watch for UV coordinate differences
// DirectX: (0,0) is top-left, Y increases downward
// OpenGL: (0,0) is bottom-left, Y increases upward

// When porting from OpenGL to DirectX:
float2 uv = input.TexCoord;
uv.y = 1.0 - uv.y;  // Flip Y if needed

// Half-pixel offset (legacy DX9 issue, not needed in DX10+)
// float2 uv = input.TexCoord + 0.5 / textureSize;  // No longer needed
```

### 5. Division by Zero

```hlsl
// WRONG: Potential division by zero
float3 normalizedDir = direction / length(direction);

// CORRECT: Check or use safe normalization
float len = length(direction);
float3 normalizedDir = len > 0.0001 ? direction / len : float3(0, 1, 0);

// OR use saturate to clamp denominators
float attenuation = 1.0 / max(distanceSquared, 0.0001);
```

---

## Performance Considerations

### 1. Instruction Costs

| Operation | Relative Cost | Notes |
|-----------|---------------|-------|
| Add, Multiply | 1 | Basic ALU ops |
| MAD (multiply-add) | 1 | Fused operation |
| Divide | 4 | Avoid in inner loops |
| Sqrt | 4 | Use rsqrt when possible |
| Sin, Cos | 8 | Use lookup tables for approximations |
| Pow | 8 | Consider approximations |
| Texture Sample | 4-100+ | Highly variable, cache dependent |
| Branch | Variable | Depends on coherence |

### 2. Optimize Texture Access

```hlsl
// BAD: Multiple dependent texture reads
float2 uv = texture(uvOffsetMap, baseUV).xy;
float3 color = texture(colorMap, uv).rgb;
float normal = texture(normalMap, uv).rgb;

// BETTER: Pack data into fewer textures
// Use texture atlases
// Sample textures at similar UVs together for cache coherency

// Use appropriate mip levels
float lod = computeLOD();
float3 color = colorMap.SampleLevel(sampler, uv, lod);
```

### 3. Reduce Overdraw

```hlsl
// Use early depth test (automatic with opaque, manual for alpha test)
// HLSL
[earlydepthstencil]
float4 PSMain(PSInput input) : SV_TARGET
{
    // Shader code
}

// GLSL
layout(early_fragment_tests) in;
```

### 4. Vectorize Operations

```hlsl
// BAD: Scalar operations
float r = a.r * b.r;
float g = a.g * b.g;
float b = a.b * b.b;

// GOOD: Vector operation
float3 result = a.rgb * b.rgb;

// Leverage swizzling for common patterns
float luminance = dot(color.rgb, float3(0.299, 0.587, 0.114));
```

---

## Real-World Scenarios

### Scenario 1: Dissolve Effect

```hlsl
// DissolveShader.hlsl - Object dissolution effect
Texture2D<float> NoiseTexture : register(t2);

cbuffer DissolveParams : register(b3)
{
    float DissolveAmount;  // 0 to 1
    float EdgeWidth;
    float3 EdgeColor;
    float UseWorldSpace;
};

float4 PSMain(PSInput input) : SV_TARGET
{
    // Sample dissolve pattern
    float2 dissolveUV = UseWorldSpace > 0.5 ? input.WorldPos.xz * 0.1 : input.TexCoord;
    float noise = NoiseTexture.Sample(LinearSampler, dissolveUV);

    // Discard dissolved pixels
    float dissolve = noise - DissolveAmount;
    clip(dissolve);

    // Calculate edge glow
    float edge = 1.0 - smoothstep(0.0, EdgeWidth, dissolve);

    // Base color
    float4 albedo = AlbedoTexture.Sample(LinearSampler, input.TexCoord);
    float3 lighting = ComputeLighting(input);
    float3 baseColor = albedo.rgb * lighting;

    // Add edge emission
    float3 finalColor = lerp(baseColor, EdgeColor * 3.0, edge);

    return float4(finalColor, albedo.a);
}
```

### Scenario 2: Outline/Silhouette Shader

```hlsl
// TwoPassOutline - Pass 1: Expanded silhouette
// Vertex shader expands mesh along normals
float4 OutlineVS(float3 position : POSITION, float3 normal : NORMAL) : SV_POSITION
{
    float3 expandedPos = position + normal * OutlineWidth;
    return mul(float4(expandedPos, 1.0), WorldViewProjection);
}

float4 OutlinePS() : SV_TARGET
{
    return OutlineColor;
}

// Pass 2: Normal rendering (draw on top with depth test)
// Screen-space alternative:
float4 ScreenSpaceOutlinePS(PSInput input) : SV_TARGET
{
    // Sample depth in cross pattern
    float depth = DepthTexture.Sample(PointSampler, input.TexCoord);
    float depthL = DepthTexture.Sample(PointSampler, input.TexCoord + float2(-TexelSize.x, 0));
    float depthR = DepthTexture.Sample(PointSampler, input.TexCoord + float2(TexelSize.x, 0));
    float depthT = DepthTexture.Sample(PointSampler, input.TexCoord + float2(0, -TexelSize.y));
    float depthB = DepthTexture.Sample(PointSampler, input.TexCoord + float2(0, TexelSize.y));

    // Sobel-style edge detection on depth
    float edge = abs(depthL - depthR) + abs(depthT - depthB);
    edge = step(EdgeThreshold, edge);

    float4 sceneColor = SceneTexture.Sample(LinearSampler, input.TexCoord);
    return lerp(sceneColor, OutlineColor, edge);
}
```

### Scenario 3: Triplanar Mapping

```glsl
// Triplanar mapping for terrain/rocks without UV coordinates
vec3 triplanarMapping(vec3 worldPos, vec3 worldNormal)
{
    // Determine blend weights based on normal direction
    vec3 blendWeights = abs(worldNormal);
    blendWeights = pow(blendWeights, vec3(4.0)); // Sharpen blend
    blendWeights /= dot(blendWeights, vec3(1.0)); // Normalize

    // Sample texture from each axis
    vec2 uvX = worldPos.zy * textureScale;
    vec2 uvY = worldPos.xz * textureScale;
    vec2 uvZ = worldPos.xy * textureScale;

    vec3 texX = texture(albedoMap, uvX).rgb;
    vec3 texY = texture(albedoMap, uvY).rgb;
    vec3 texZ = texture(albedoMap, uvZ).rgb;

    // Blend based on weights
    return texX * blendWeights.x + texY * blendWeights.y + texZ * blendWeights.z;
}
```

---

## Interview Key Points

### Frequently Asked Questions

1. **What's the difference between vertex and fragment shaders?**
   - Vertex shader: Runs once per vertex, transforms positions, outputs per-vertex data
   - Fragment shader: Runs once per potential pixel, determines final color
   - Vertex outputs are interpolated across triangles for fragment input

2. **Explain the graphics pipeline stages.**
   - Vertex Assembly -> Vertex Shader -> (Tessellation) -> (Geometry Shader) -> Rasterization -> Fragment Shader -> Output Merger
   - Know which stages are programmable vs fixed-function

3. **How do you optimize shader performance?**
   - Minimize texture samples and use appropriate mip levels
   - Avoid dynamic branching on varying data
   - Pack data efficiently (use all vector components)
   - Reduce overdraw with proper sorting and early-z
   - Use appropriate precision (half vs float)

4. **What is the TBN matrix and why is it needed?**
   - Tangent, Bitangent, Normal matrix
   - Transforms normal map samples from tangent space to world space
   - Required because normal maps store normals relative to surface tangent

5. **Explain coordinate spaces in 3D rendering.**
   - Object/Model space: Local to the mesh
   - World space: Global scene coordinates
   - View/Camera space: Relative to camera
   - Clip space: After projection, used for clipping
   - NDC: Normalized device coordinates [-1,1] or [0,1]
   - Screen space: Final pixel coordinates

### Practical Coding Questions

1. **Implement Phong lighting in a shader**
2. **Write a shader that samples a normal map correctly**
3. **Create a simple dissolve effect**
4. **Implement screen-space ambient occlusion (SSAO) basics**
5. **Write an efficient instanced rendering shader**

---

## Further Reading

### Books
- "Real-Time Rendering" by Akenine-Moller, Haines, Hoffman
- "GPU Gems" series (available free online from NVIDIA)
- "The Book of Shaders" by Patricio Gonzalez Vivo (https://thebookofshaders.com)

### Online Resources
- Shadertoy (https://www.shadertoy.com) - Live shader examples
- LearnOpenGL (https://learnopengl.com) - Excellent GLSL tutorials
- Catlike Coding (https://catlikecoding.com) - Unity shader tutorials
- Microsoft HLSL Documentation
- Khronos GLSL Specification

### Tools
- RenderDoc - Graphics debugger
- NVIDIA Nsight - GPU profiling
- AMD Radeon GPU Profiler
- PIX for Windows - DirectX debugging
- Shader Playground (https://shader-playground.timjones.io) - Online compiler

### Advanced Topics to Explore
- Physically Based Rendering (PBR)
- Screen-Space Reflections (SSR)
- Temporal Anti-Aliasing (TAA)
- Volumetric Rendering
- Ray Marching and Signed Distance Fields
- Compute Shaders for Graphics
