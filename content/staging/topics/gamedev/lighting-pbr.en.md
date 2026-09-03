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
origin: old/src/content/docs/gamedev/lighting-pbr.en.md
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

Lighting is a core topic in computer graphics that determines the visual presentation of objects in virtual worlds. From early empirical models (like Phong) to modern Physically Based Rendering (PBR), the evolution of lighting technology has brought real-time rendering increasingly closer to real-world visual effects.

## Concept Explanation: The Essence of Lighting

### Light-Material Interaction

When light rays hit an object's surface, various physical phenomena occur:

1. **Reflection**: Light bounces off the surface, divided into specular and diffuse reflection
2. **Refraction**: Light changes direction when entering transparent materials
3. **Absorption**: Part of the light energy is absorbed by the material and converted to heat
4. **Scattering**: Light bounces multiple times inside the material before exiting (subsurface scattering)

```
Incident Light
   ↓
   ┌─────────────────────────┐
   │     Specular ↗          │
   │    ──────────           │
   │     Diffuse ↑↗↖         │
   │    ════════════         │ ← Surface
   │         ↓               │
   │    Subsurface           │ ← Material Interior
   │      ↙  ↓  ↘           │
   └─────────────────────────┘
```

### Lighting Equation Basics

The goal of all lighting models is to approximate the rendering equation:

```
Lo(p, ωo) = Le(p, ωo) + ∫ fr(p, ωi, ωo) * Li(p, ωi) * (n · ωi) dωi
```

Where:
- `Lo`: Outgoing radiance (the color we see)
- `Le`: Emissive light
- `fr`: Bidirectional Reflectance Distribution Function (BRDF)
- `Li`: Incoming radiance
- `n · ωi`: Cosine term (Lambert's law)

---

## Classic Lighting Models

### Lambert Diffuse Model

The Lambert model is the simplest diffuse model, based on Lambert's cosine law: surface brightness is proportional to the cosine of the angle between the light direction and surface normal.

```glsl
// Lambert Diffuse Shader
// Vertex Shader
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
// Fragment Shader
#version 330 core
out vec4 FragColor;

in vec3 FragPos;
in vec3 Normal;

uniform vec3 lightPos;
uniform vec3 lightColor;
uniform vec3 objectColor;

void main() {
    // Ambient light
    float ambientStrength = 0.1;
    vec3 ambient = ambientStrength * lightColor;

    // Diffuse
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(lightPos - FragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * lightColor;

    // Final color
    vec3 result = (ambient + diffuse) * objectColor;
    FragColor = vec4(result, 1.0);
}
```

### Phong Lighting Model

The Phong model adds specular highlights on top of Lambert diffuse, better simulating the reflective properties of smooth surfaces.

```glsl
// Phong Lighting Model Fragment Shader
#version 330 core
out vec4 FragColor;

in vec3 FragPos;
in vec3 Normal;

uniform vec3 viewPos;
uniform vec3 lightPos;
uniform vec3 lightColor;
uniform vec3 objectColor;

// Material properties
uniform float ambientStrength;
uniform float specularStrength;
uniform float shininess;  // Specular exponent, typically 32-256

void main() {
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(lightPos - FragPos);
    vec3 viewDir = normalize(viewPos - FragPos);

    // Ambient
    vec3 ambient = ambientStrength * lightColor;

    // Diffuse
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * lightColor;

    // Specular - Phong model
    // Calculate reflection vector: R = 2(N·L)N - L
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = specularStrength * spec * lightColor;

    // Combine all lighting components
    vec3 result = (ambient + diffuse + specular) * objectColor;
    FragColor = vec4(result, 1.0);
}
```

**Components of the Phong Model:**

| Component | Description | Formula |
|-----------|-------------|---------|
| Ambient | Simulates indirect lighting | `Ia * Ka` |
| Diffuse | Scattering from rough surfaces | `Id * Kd * max(N·L, 0)` |
| Specular | Highlights on smooth surfaces | `Is * Ks * (R·V)^n` |

### Blinn-Phong Lighting Model

Blinn-Phong is an optimized version of the Phong model, using a half vector instead of the reflection vector for specular calculations. It's more efficient and produces better results in certain situations.

```glsl
// Blinn-Phong Lighting Model
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
    // Attenuation parameters
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

    // Calculate half vector H = normalize(L + V)
    vec3 halfwayDir = normalize(lightDir + viewDir);

    // Ambient
    vec3 ambient = light.ambient * material.ambient;

    // Diffuse
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = light.diffuse * diff * material.diffuse;

    // Blinn-Phong Specular
    // Use N·H instead of R·V
    float spec = pow(max(dot(norm, halfwayDir), 0.0), material.shininess);
    vec3 specular = light.specular * spec * material.specular;

    // Calculate attenuation
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

**Phong vs Blinn-Phong Comparison:**

```
Phong:        R = reflect(-L, N)
              specular = (R · V)^n

Blinn-Phong:  H = normalize(L + V)
              specular = (N · H)^n

Advantages:
- H is simpler to compute than R
- When light source and viewpoint are distant, H can be precomputed
- More natural results at grazing angles
- For directional lights, H is constant
```

---

## Microfacet Theory

### Core Concept

Microfacet theory states that macroscopically smooth surfaces are composed of countless tiny perfect mirrors (microfacets) at the microscopic scale. The roughness of the surface determines the directional distribution of these microfacets.

```
Smooth Surface (Low Roughness)    Rough Surface (High Roughness)
    ↓ ↓ ↓                              ↓   ↓   ↓
   ─────────                        ╱╲╱╲╱╲╱╲╱╲
   Focused Reflection                 Scattered Reflection
```

### Microfacet BRDF Formula

The Cook-Torrance BRDF is a classic implementation of microfacet theory:

```
fr = kd * fLambert + ks * fCook-Torrance

fCook-Torrance = D * F * G / (4 * (ωo · n) * (ωi · n))
```

Where:
- **D**: Normal Distribution Function
- **F**: Fresnel Equation
- **G**: Geometry Function

### Normal Distribution Function (NDF)

The NDF describes the statistical distribution of microfacet normals. The commonly used GGX (Trowbridge-Reitz) distribution:

```glsl
// GGX/Trowbridge-Reitz Normal Distribution Function
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

// Beckmann Distribution (for comparison)
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

### Fresnel Equation

The Fresnel effect describes how the ratio of reflection to refraction changes at different angles. Using the Schlick approximation:

```glsl
// Fresnel-Schlick Approximation
vec3 FresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

// Fresnel with Roughness (for IBL)
vec3 FresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) *
           pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}
```

**F0 Value Reference Table:**

| Material Type | F0 Value (Linear Space) |
|--------------|-------------------------|
| Water | (0.02, 0.02, 0.02) |
| Plastic | (0.04, 0.04, 0.04) |
| Glass | (0.04, 0.04, 0.04) |
| Diamond | (0.17, 0.17, 0.17) |
| Iron | (0.56, 0.57, 0.58) |
| Copper | (0.95, 0.64, 0.54) |
| Gold | (1.00, 0.71, 0.29) |
| Silver | (0.95, 0.93, 0.88) |
| Aluminum | (0.91, 0.92, 0.92) |

### Geometry Function

The geometry function describes self-occlusion and self-shadowing of microfacets. Using the Smith method combined with GGX:

```glsl
// Schlick-GGX Geometry Function
float GeometrySchlickGGX(float NdotV, float roughness) {
    // Direct lighting uses k = (roughness + 1)^2 / 8
    // IBL uses k = roughness^2 / 2
    float r = roughness + 1.0;
    float k = (r * r) / 8.0;

    float nom = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}

// Smith Method: considers occlusion from both view and light directions
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}
```

---

## Complete PBR Implementation

### Metallic/Roughness Workflow

This is currently the most popular PBR workflow, widely adopted by glTF format, Unreal Engine, Unity, and others.

```glsl
// PBR Fragment Shader - Metallic/Roughness Workflow
#version 330 core
out vec4 FragColor;

in vec2 TexCoords;
in vec3 WorldPos;
in vec3 Normal;

// Material textures
uniform sampler2D albedoMap;
uniform sampler2D normalMap;
uniform sampler2D metallicMap;
uniform sampler2D roughnessMap;
uniform sampler2D aoMap;

// IBL textures
uniform samplerCube irradianceMap;
uniform samplerCube prefilterMap;
uniform sampler2D brdfLUT;

// Lights
uniform vec3 lightPositions[4];
uniform vec3 lightColors[4];

uniform vec3 camPos;

const float PI = 3.14159265359;

// Normal map processing
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
    // Sample material textures
    vec3 albedo = pow(texture(albedoMap, TexCoords).rgb, vec3(2.2)); // sRGB -> Linear
    float metallic = texture(metallicMap, TexCoords).r;
    float roughness = texture(roughnessMap, TexCoords).r;
    float ao = texture(aoMap, TexCoords).r;

    // Calculate normal
    vec3 N = getNormalFromMap();
    vec3 V = normalize(camPos - WorldPos);
    vec3 R = reflect(-V, N);

    // Calculate F0
    // Non-metals use 0.04, metals use albedo as F0
    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);

    // ==================== Direct Lighting ====================
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

        // Energy conservation: kS + kD = 1
        vec3 kS = F;
        vec3 kD = vec3(1.0) - kS;
        kD *= 1.0 - metallic; // Metals have no diffuse

        float NdotL = max(dot(N, L), 0.0);
        Lo += (kD * albedo / PI + specular) * radiance * NdotL;
    }

    // ==================== Ambient Lighting (IBL) ====================
    vec3 F = FresnelSchlickRoughness(max(dot(N, V), 0.0), F0, roughness);

    vec3 kS = F;
    vec3 kD = 1.0 - kS;
    kD *= 1.0 - metallic;

    // Diffuse IBL
    vec3 irradiance = texture(irradianceMap, N).rgb;
    vec3 diffuse = irradiance * albedo;

    // Specular IBL
    const float MAX_REFLECTION_LOD = 4.0;
    vec3 prefilteredColor = textureLod(prefilterMap, R, roughness * MAX_REFLECTION_LOD).rgb;
    vec2 brdf = texture(brdfLUT, vec2(max(dot(N, V), 0.0), roughness)).rg;
    vec3 specular = prefilteredColor * (F * brdf.x + brdf.y);

    vec3 ambient = (kD * diffuse + specular) * ao;

    // ==================== Final Color ====================
    vec3 color = ambient + Lo;

    // HDR Tone Mapping
    color = color / (color + vec3(1.0));
    // Gamma Correction
    color = pow(color, vec3(1.0 / 2.2));

    FragColor = vec4(color, 1.0);
}
```

### Specular/Glossiness Workflow

Another common PBR workflow, used by Unity's legacy materials and certain tools:

```glsl
// Specular/Glossiness Workflow
#version 330 core

// Material parameters
uniform sampler2D diffuseMap;     // Diffuse color
uniform sampler2D specularMap;    // Specular color (contains F0)
uniform sampler2D glossinessMap;  // Glossiness (= 1 - roughness)
uniform sampler2D normalMap;
uniform sampler2D aoMap;

void main() {
    vec3 diffuse = texture(diffuseMap, TexCoords).rgb;
    vec3 specularColor = texture(specularMap, TexCoords).rgb;
    float glossiness = texture(glossinessMap, TexCoords).r;
    float roughness = 1.0 - glossiness;

    // In Specular/Glossiness workflow, F0 comes directly from specularMap
    vec3 F0 = specularColor;

    // Determine if metal: if specular is close to diffuse, it's metal
    // Metal's diffuse should be black
    float metallic = max(max(specularColor.r, specularColor.g), specularColor.b);

    // Remaining calculations are the same as Metallic/Roughness workflow
    // ...
}
```

**Comparison of the Two Workflows:**

| Feature | Metallic/Roughness | Specular/Glossiness |
|---------|-------------------|---------------------|
| Number of textures | Fewer | More |
| Metal representation | Single channel (0-1) | RGB specular color |
| Artistic control | Less | More refined |
| Physical correctness | Stricter | More flexible but error-prone |
| File formats | glTF, UE4 | Unity legacy |

---

## Global Illumination

### Ambient Occlusion

AO simulates the attenuation of indirect lighting in crevices and recesses of objects.

#### Screen Space Ambient Occlusion (SSAO)

```glsl
// SSAO Fragment Shader
#version 330 core
out float FragColor;

in vec2 TexCoords;

uniform sampler2D gPosition;  // G-buffer position
uniform sampler2D gNormal;    // G-buffer normal
uniform sampler2D texNoise;   // Random rotation noise

uniform vec3 samples[64];     // Hemisphere sample kernel
uniform mat4 projection;

// Parameters
int kernelSize = 64;
float radius = 0.5;
float bias = 0.025;

// Noise scale (based on screen resolution)
const vec2 noiseScale = vec2(1280.0 / 4.0, 720.0 / 4.0);

void main() {
    // Get current pixel's position and normal (view space)
    vec3 fragPos = texture(gPosition, TexCoords).xyz;
    vec3 normal = normalize(texture(gNormal, TexCoords).rgb);
    vec3 randomVec = normalize(texture(texNoise, TexCoords * noiseScale).xyz);

    // Create TBN matrix (transform samples from tangent to view space)
    vec3 tangent = normalize(randomVec - normal * dot(randomVec, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, normal);

    // Iterate through sample kernel to calculate occlusion
    float occlusion = 0.0;
    for (int i = 0; i < kernelSize; ++i) {
        // Get sample position
        vec3 samplePos = TBN * samples[i]; // Tangent space -> View space
        samplePos = fragPos + samplePos * radius;

        // Project to screen space
        vec4 offset = vec4(samplePos, 1.0);
        offset = projection * offset;
        offset.xyz /= offset.w;
        offset.xyz = offset.xyz * 0.5 + 0.5;

        // Get sample point depth
        float sampleDepth = texture(gPosition, offset.xy).z;

        // Range check: avoid distant objects affecting result
        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(fragPos.z - sampleDepth));

        // Compare depth: if sample is inside geometry, it's occluded
        occlusion += (sampleDepth >= samplePos.z + bias ? 1.0 : 0.0) * rangeCheck;
    }

    occlusion = 1.0 - (occlusion / kernelSize);
    FragColor = occlusion;
}
```

#### SSAO Blur Processing

```glsl
// SSAO Blur Shader
#version 330 core
out float FragColor;

in vec2 TexCoords;

uniform sampler2D ssaoInput;

void main() {
    vec2 texelSize = 1.0 / vec2(textureSize(ssaoInput, 0));
    float result = 0.0;

    // 4x4 blur kernel
    for (int x = -2; x < 2; ++x) {
        for (int y = -2; y < 2; ++y) {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            result += texture(ssaoInput, TexCoords + offset).r;
        }
    }

    FragColor = result / 16.0;
}
```

### Image-Based Lighting (IBL)

IBL uses environment maps to simulate indirect lighting from all directions.

#### Precomputed Irradiance Map

```glsl
// Irradiance Convolution Shader
#version 330 core
out vec4 FragColor;

in vec3 WorldPos;

uniform samplerCube environmentMap;

const float PI = 3.14159265359;

void main() {
    // Hemisphere integration centered on normal direction
    vec3 N = normalize(WorldPos);

    vec3 irradiance = vec3(0.0);

    // Tangent space basis vectors
    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(up, N));
    up = normalize(cross(N, right));

    float sampleDelta = 0.025;
    float nrSamples = 0.0;

    // Hemisphere sampling
    for (float phi = 0.0; phi < 2.0 * PI; phi += sampleDelta) {
        for (float theta = 0.0; theta < 0.5 * PI; theta += sampleDelta) {
            // Spherical to Cartesian coordinates (tangent space)
            vec3 tangentSample = vec3(
                sin(theta) * cos(phi),
                sin(theta) * sin(phi),
                cos(theta)
            );

            // Tangent space to world space
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

#### Pre-filtered Environment Map

```glsl
// Pre-filter Convolution Shader - Generate mipmaps based on roughness
#version 330 core
out vec4 FragColor;

in vec3 WorldPos;

uniform samplerCube environmentMap;
uniform float roughness;

const float PI = 3.14159265359;
const uint SAMPLE_COUNT = 1024u;

// Low-discrepancy sequence (Hammersley sequence)
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

// Importance sampling GGX
vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
    float a = roughness * roughness;

    float phi = 2.0 * PI * Xi.x;
    float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a * a - 1.0) * Xi.y));
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);

    // Spherical to Cartesian coordinates
    vec3 H;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;

    // Tangent space to world space
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
            // Sample mip level based on PDF to reduce noise
            float D = DistributionGGX(N, H, roughness);
            float NdotH = max(dot(N, H), 0.0);
            float HdotV = max(dot(H, V), 0.0);
            float pdf = D * NdotH / (4.0 * HdotV) + 0.0001;

            float resolution = 512.0; // Environment map resolution
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

#### BRDF Integration Lookup Table (LUT)

```glsl
// BRDF Integration Precomputation
#version 330 core
out vec2 FragColor;

in vec2 TexCoords;

const float PI = 3.14159265359;
const uint SAMPLE_COUNT = 1024u;

// ... Hammersley, ImportanceSampleGGX functions same as above ...

float GeometrySchlickGGX(float NdotV, float roughness) {
    float a = roughness;
    float k = (a * a) / 2.0; // IBL uses different k

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

## Practical Example: Complete PBR Renderer

### C++ Renderer Framework

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

    // Material settings
    void SetAlbedo(const glm::vec3& albedo);
    void SetMetallic(float metallic);
    void SetRoughness(float roughness);
    void SetAO(float ao);

    // Load textures
    void LoadAlbedoMap(const std::string& path);
    void LoadNormalMap(const std::string& path);
    void LoadMetallicMap(const std::string& path);
    void LoadRoughnessMap(const std::string& path);
    void LoadAOMap(const std::string& path);

    // Environment map
    void LoadHDREnvironment(const std::string& path);

private:
    // Precompute IBL
    void PrecomputeIBL();
    void GenerateIrradianceMap();
    void GeneratePrefilterMap();
    void GenerateBRDFLUT();

    // Render sphere mesh
    void RenderSphere();

    // Shaders
    unsigned int m_PBRShader;
    unsigned int m_EquirectangularToCubemapShader;
    unsigned int m_IrradianceShader;
    unsigned int m_PrefilterShader;
    unsigned int m_BRDFShader;

    // Textures
    unsigned int m_AlbedoMap;
    unsigned int m_NormalMap;
    unsigned int m_MetallicMap;
    unsigned int m_RoughnessMap;
    unsigned int m_AOMap;

    // IBL textures
    unsigned int m_EnvCubemap;
    unsigned int m_IrradianceMap;
    unsigned int m_PrefilterMap;
    unsigned int m_BRDFLUT;

    // Framebuffer
    unsigned int m_CaptureFBO;
    unsigned int m_CaptureRBO;

    // Geometry
    unsigned int m_SphereVAO;
    unsigned int m_SphereIndexCount;

    // Material parameters
    glm::vec3 m_Albedo = glm::vec3(0.5f, 0.0f, 0.0f);
    float m_Metallic = 0.0f;
    float m_Roughness = 0.5f;
    float m_AO = 1.0f;

    // Lights
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

    // Set up lights
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

    // Compile shaders
    m_PBRShader = LoadShader("pbr.vs", "pbr.fs");
    m_EquirectangularToCubemapShader = LoadShader("cubemap.vs", "equirectangular_to_cubemap.fs");
    m_IrradianceShader = LoadShader("cubemap.vs", "irradiance_convolution.fs");
    m_PrefilterShader = LoadShader("cubemap.vs", "prefilter.fs");
    m_BRDFShader = LoadShader("brdf.vs", "brdf.fs");

    // Create framebuffer
    glGenFramebuffers(1, &m_CaptureFBO);
    glGenRenderbuffers(1, &m_CaptureRBO);

    // Generate sphere mesh
    GenerateSphere();

    // Configure OpenGL state
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

        // Convert to cubemap
        ConvertEquirectangularToCubemap(hdrTexture);

        // Precompute IBL
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

    // Set camera matrices
    glm::mat4 view = GetViewMatrix();
    glm::mat4 projection = glm::perspective(glm::radians(45.0f),
        (float)m_Width / (float)m_Height, 0.1f, 100.0f);

    SetUniform(m_PBRShader, "view", view);
    SetUniform(m_PBRShader, "projection", projection);
    SetUniform(m_PBRShader, "camPos", GetCameraPosition());

    // Bind IBL textures
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_CUBE_MAP, m_IrradianceMap);
    glActiveTexture(GL_TEXTURE1);
    glBindTexture(GL_TEXTURE_CUBE_MAP, m_PrefilterMap);
    glActiveTexture(GL_TEXTURE2);
    glBindTexture(GL_TEXTURE_2D, m_BRDFLUT);

    // Bind material textures
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

    // Set lights
    for (unsigned int i = 0; i < m_LightPositions.size(); ++i) {
        SetUniform(m_PBRShader, "lightPositions[" + std::to_string(i) + "]", m_LightPositions[i]);
        SetUniform(m_PBRShader, "lightColors[" + std::to_string(i) + "]", m_LightColors[i]);
    }

    // Render material sphere matrix
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

    // Render skybox
    RenderSkybox();
}
```

### Unity Shader Implementation

```hlsl
// PBR.shader - Simplified Unity Standard PBR
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
                // Sample textures
                float3 albedo = tex2D(_AlbedoMap, i.uv).rgb * _Albedo.rgb;
                float metallic = tex2D(_MetallicMap, i.uv).r * _Metallic;
                float roughness = tex2D(_RoughnessMap, i.uv).r * _Roughness;
                float ao = tex2D(_AOMap, i.uv).r;

                // Normal map
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

                // Direct lighting
                float3 Lo = (kD * albedo / PI + specular) * _LightColor0.rgb * NdotL;

                // Ambient
                float3 ambient = UNITY_LIGHTMODEL_AMBIENT.rgb * albedo * ao;

                // Shadows
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

### Unreal Engine Material Node Graph

```
Unreal Engine PBR Material Node Structure:

[Texture Sample: BaseColor] ──────────────────────> Base Color
                                                        │
[Texture Sample: Normal] ──> [Normal Map Node] ──────> Normal
                                                        │
[Texture Sample: ORM] ────┬─────(R)──────────────────> Ambient Occlusion
                         ├─────(G)──────────────────> Roughness
                         └─────(B)──────────────────> Metallic
                                                        │
[Constant: 0 or 1] ──────────────────────────────────> Specular (optional)
```

```cpp
// Unreal Engine C++ Material Parameter Setup
void AMyActor::SetupPBRMaterial()
{
    UMaterialInstanceDynamic* DynamicMaterial =
        UMaterialInstanceDynamic::Create(BaseMaterial, this);

    // Set textures
    DynamicMaterial->SetTextureParameterValue("BaseColorMap", AlbedoTexture);
    DynamicMaterial->SetTextureParameterValue("NormalMap", NormalTexture);
    DynamicMaterial->SetTextureParameterValue("ORMMap", ORMTexture);

    // Set scalar parameters
    DynamicMaterial->SetScalarParameterValue("Roughness", 0.5f);
    DynamicMaterial->SetScalarParameterValue("Metallic", 0.0f);

    // Set vector parameters
    DynamicMaterial->SetVectorParameterValue("BaseColor", FLinearColor(1.0f, 0.5f, 0.0f));

    // Apply material
    MeshComponent->SetMaterial(0, DynamicMaterial);
}
```

---

## Advanced Techniques

### Subsurface Scattering

Simulates light scattering inside translucent materials (such as skin, candles, leaves).

```glsl
// Simplified Subsurface Scattering Approximation
vec3 SubsurfaceScattering(vec3 N, vec3 L, vec3 V, float thickness, vec3 sssColor) {
    // Backlight scattering
    vec3 H = normalize(L + N * 0.5);
    float VdotH = pow(saturate(dot(V, -H)), 3.0);

    // Thickness-based attenuation
    float sss = VdotH * thickness;

    return sssColor * sss;
}

// Usage in main shader
void main() {
    // ... Regular PBR calculations ...

    // Add SSS
    vec3 sssContribution = SubsurfaceScattering(N, L, V, thickness, sssColor);
    Lo += sssContribution * radiance;

    // ...
}
```

### Anisotropic Reflection

Simulates directional reflections found in brushed metal, hair, etc.

```glsl
// Anisotropic GGX
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

// Ashikhmin-Shirley Anisotropic Model
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

### Clear Coat

Simulates dual-layer material effects like automotive paint.

```glsl
// Clear Coat Layer Calculation
float ClearCoatBRDF(vec3 N, vec3 H, vec3 V, vec3 L,
                    float clearCoat, float clearCoatRoughness) {
    float NdotH = max(dot(N, H), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float NdotV = max(dot(N, V), 0.0);
    float VdotH = max(dot(V, H), 0.0);

    // Clear coat layer uses fixed F0 = 0.04
    float F = 0.04 + (1.0 - 0.04) * pow(1.0 - VdotH, 5.0);

    float D = DistributionGGX(N, H, clearCoatRoughness);
    float G = GeometrySmith(N, V, L, clearCoatRoughness);

    float clearCoatSpecular = D * F * G / (4.0 * NdotL * NdotV + 0.001);

    return clearCoat * clearCoatSpecular;
}

void main() {
    // Base layer
    vec3 baseBRDF = CalculatePBR(N, V, L, albedo, metallic, roughness);

    // Clear coat layer
    float clearCoatContribution = ClearCoatBRDF(N, H, V, L,
                                                 clearCoat, clearCoatRoughness);

    // Combine: clear coat absorbs some light
    float absorption = 1.0 - clearCoat * FresnelSchlick(NdotV, vec3(0.04)).r;
    vec3 finalColor = baseBRDF * absorption + vec3(clearCoatContribution);
}
```

---

## Performance Optimization

### Shader Optimization Techniques

```glsl
// 1. Use half precision (mobile)
#ifdef GL_ES
precision mediump float;
#define HALF half
#define HALF3 half3
#else
#define HALF float
#define HALF3 vec3
#endif

// 2. Precompute constants
const HALF invPI = 0.31830988618;
const HALF PI = 3.14159265359;

// 3. Use fast approximations
// Fast pow approximation
HALF fastPow(HALF x, HALF y) {
    return exp2(y * log2(x));
}

// Fast Fresnel approximation
HALF3 FresnelSchlickFast(HALF cosTheta, HALF3 F0) {
    HALF t = 1.0 - cosTheta;
    HALF t2 = t * t;
    HALF t5 = t2 * t2 * t;
    return F0 + (1.0 - F0) * t5;
}

// 4. Branch optimization
// Avoid:
if (metallic > 0.5) {
    // Metal path
} else {
    // Non-metal path
}

// Use mix instead:
vec3 result = mix(dielectricResult, metallicResult, metallic);

// 5. Vectorized operations
// Avoid:
float x = a.x * b.x;
float y = a.y * b.y;
float z = a.z * b.z;

// Use:
vec3 result = a * b;
```

### LOD and Simplification

```glsl
// Distance-based PBR simplification
void main() {
    float distance = length(camPos - WorldPos);

    if (distance < 10.0) {
        // Full PBR
        color = FullPBR(N, V, L, albedo, metallic, roughness);
    } else if (distance < 50.0) {
        // Simplified PBR: skip some calculations
        color = SimplifiedPBR(N, V, L, albedo, metallic, roughness);
    } else {
        // Lambert + simple specular
        color = SimpleLighting(N, L, albedo);
    }
}

// Simplified PBR (skip geometry function)
vec3 SimplifiedPBR(vec3 N, vec3 V, vec3 L, vec3 albedo,
                   float metallic, float roughness) {
    vec3 H = normalize(V + L);

    vec3 F0 = mix(vec3(0.04), albedo, metallic);
    vec3 F = FresnelSchlick(max(dot(H, V), 0.0), F0);

    // Simplified specular term
    float NdotH = max(dot(N, H), 0.0);
    float spec = pow(NdotH, (1.0 - roughness) * 128.0);

    vec3 kD = (1.0 - F) * (1.0 - metallic);
    float NdotL = max(dot(N, L), 0.0);

    return (kD * albedo / PI + F * spec) * NdotL;
}
```

---

## Interview Key Points

### Core Concept Questions

**Q1: Explain the physical meaning of metallic and roughness in PBR?**

```
Metallic:
- 0 = Dielectric (plastic, wood, skin, etc.)
- 1 = Metal (gold, silver, copper, etc.)
- Effects:
  - Metals have no diffuse reflection, all light is specularly reflected
  - Metal's F0 value comes from albedo, dielectrics use fixed 0.04

Roughness:
- 0 = Perfect mirror
- 1 = Completely rough
- Effects:
  - Controls the distribution range of microfacet normals
  - Higher roughness = more scattered, dimmer highlights
```

**Q2: Why does PBR need to use linear space for calculations?**

```
Reasons:
1. Lighting calculations are physical processes that need linear space
2. sRGB is a non-linear encoding optimized for human perception
3. Doing calculations in sRGB space leads to:
   - Incorrect light attenuation
   - Wrong color blending results
   - Highlights too bright or too dark

Workflow:
1. Input: Convert sRGB textures (like albedo) to linear space
2. Calculate: All lighting calculations in linear space
3. Output: Convert final result back to sRGB for display

Code:
// Input conversion
vec3 albedo = pow(texture(albedoMap, uv).rgb, vec3(2.2));

// Output conversion
color = pow(color, vec3(1.0 / 2.2));
```

**Q3: Explain the roles of D, F, G terms in Cook-Torrance BRDF?**

```
D (Normal Distribution Function):
- Describes the statistical distribution of microfacet normal orientations
- Determines the shape and concentration of highlights
- Higher roughness = more spread out distribution

F (Fresnel):
- Describes how reflection ratio changes at different angles
- Stronger reflection at grazing angles (Fresnel effect)
- Determines edge highlights

G (Geometry Function):
- Describes self-occlusion and self-shadowing of microfacets
- More light is blocked at grazing angles
- Ensures energy conservation
```

### Practical Application Questions

**Q4: How to implement real-time global illumination?**

```
Common Methods:

1. Screen-space methods:
   - SSAO: Screen Space Ambient Occlusion
   - SSGI: Screen Space Global Illumination
   - SSR: Screen Space Reflections

2. Precomputed methods:
   - Light Probes
   - Lightmaps
   - IBL: Image-Based Lighting

3. Real-time methods:
   - VXGI: Voxel Global Illumination
   - DDGI: Dynamic Diffuse Global Illumination
   - Lumen (UE5): Hybrid approach

4. Hardware acceleration:
   - RTX Ray Tracing
```

**Q5: What are the optimization strategies for mobile PBR?**

```
1. Precision optimization:
   - Use half precision
   - Simplify math calculations (use approximations)

2. Texture optimization:
   - Combine texture channels (ORM texture)
   - Use compressed textures (ASTC, ETC2)
   - Reduce texture resolution

3. Calculation optimization:
   - Simplify BRDF (skip G term)
   - Reduce light count
   - LOD system

4. IBL optimization:
   - Use low-resolution environment maps
   - Spherical harmonics instead of full IBL
   - More precomputation, less real-time calculation

5. Post-processing optimization:
   - Reduce SSAO sample count
   - Use simplified bloom
```

### High-Frequency Key Points Summary

```
1. Lighting model evolution: Lambert -> Phong -> Blinn-Phong -> PBR

2. Three elements of microfacet theory: D (distribution), F (Fresnel), G (geometry)

3. PBR workflows:
   - Metallic/Roughness (glTF, UE4)
   - Specular/Glossiness (Unity legacy)

4. IBL trio:
   - Irradiance Map (diffuse ambient)
   - Pre-filtered Map (specular reflection)
   - BRDF LUT (integral precomputation)

5. Energy conservation: kS + kD = 1, metals have no diffuse

6. Linear workflow: Input gamma decode, output gamma encode

7. Optimization techniques: LOD, instancing, texture compression, calculation simplification
```

---

## Learning Resources

### Classic Papers
- "Microfacet Models for Refraction through Rough Surfaces" - Walter et al.
- "Real Shading in Unreal Engine 4" - Brian Karis
- "Moving Frostbite to PBR" - Sebastien Lagarde

### Online Resources
- [Learn OpenGL - PBR](https://learnopengl.com/PBR/Theory)
- [Filament Documentation](https://google.github.io/filament/Filament.html)
- [Marmoset PBR Theory](https://marmoset.co/posts/basic-theory-of-physically-based-rendering/)

### Recommended Books
- "Real-Time Rendering" 4th Edition
- "Physically Based Rendering: From Theory to Implementation"
- "GPU Gems" Series

---

## Summary

Lighting models and PBR rendering are core technologies in modern game graphics. From the classic Phong model to physically based rendering, we pursue more realistic and consistent visual effects. Mastering these technologies requires:

1. **Understanding the physical basis**: Reflection, refraction, scattering, and other physical phenomena of light
2. **Familiarity with mathematical tools**: Vector operations, probability distributions, numerical integration
3. **Mastering implementation details**: Shader writing, texture creation, performance optimization
4. **Understanding industry standards**: glTF, OpenPBR, and other formats and specifications

PBR is not the end, but the beginning. As real-time ray tracing, neural rendering, and other technologies, rendering technology will continue to evolve toward more realistic and efficient directions.
