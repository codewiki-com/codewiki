---
title: Global Illumination Techniques
description: "Master global illumination in game development: ray tracing, path tracing, light probes, and real-time GI techniques"
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
origin: old/src/content/docs/gamedev/global-illumination.en.md
divergence: 0.194
issues: []
legacy:
  category: GameDev
  subcategory: Graphics
  order: 52
  lastUpdated: 2026-01-21
---

Global Illumination (GI) is the holy grail of realistic rendering, simulating how light bounces throughout a scene to create natural-looking environments. This comprehensive guide covers both the theory and practical implementation of various GI techniques used in modern game development.

## Concept Overview

### What is Global Illumination?

Global Illumination refers to a group of algorithms that simulate how light interacts with surfaces in a scene beyond direct lighting. It accounts for indirect light - light that has bounced off one or more surfaces before reaching the viewer.

```
+=====================================================================+
|                    DIRECT vs GLOBAL ILLUMINATION                     |
+=====================================================================+
|                                                                      |
|   Direct Lighting Only:           Global Illumination:               |
|                                                                      |
|       Light Source                    Light Source                   |
|           |                               |                          |
|           v                               v                          |
|      [Surface A]                    [Surface A]                      |
|           |                            /   \                         |
|           v                           v     v                        |
|       Shadow                    [Surface B] [Surface C]              |
|                                       |     |                        |
|                                       v     v                        |
|   Only surfaces directly        Light bounces and                    |
|   lit appear illuminated        illuminates shadows                  |
|                                                                      |
|   Result: Harsh shadows,        Result: Soft shadows,                |
|   unrealistic look              natural color bleeding               |
|                                                                      |
+=====================================================================+
```

### The Rendering Equation

All global illumination algorithms attempt to solve the rendering equation, introduced by James Kajiya in 1986:

```
Lo(x, wo) = Le(x, wo) + Integral[ fr(x, wi, wo) * Li(x, wi) * (wi . n) dwi ]

Where:
- Lo(x, wo)  = Outgoing radiance at point x in direction wo
- Le(x, wo)  = Emitted radiance (if surface is a light source)
- fr()       = BRDF (Bidirectional Reflectance Distribution Function)
- Li(x, wi)  = Incoming radiance from direction wi
- (wi . n)   = Cosine term (dot product with surface normal)
- dwi        = Integration over hemisphere of incoming directions
```

### GI Components

```
+=====================================================================+
|                    GLOBAL ILLUMINATION COMPONENTS                    |
+=====================================================================+
|                                                                      |
|   Direct Light         Indirect Diffuse        Indirect Specular    |
|   +-----------+        +---------------+       +----------------+   |
|   |           |        |    ~~~~~~     |       |    ~~~~~~      |   |
|   |    *      |        |   /      \    |       |   /      \     |   |
|   |    |      |        |  /        \   |       |  /   __   \    |   |
|   |    v      |        | v          v  |       | v   |  |   v   |   |
|   |  [===]    |        |[===]    [===] |       |[===]|__|[===]  |   |
|   +-----------+        +---------------+       +----------------+   |
|                                                                      |
|   Ambient Occlusion    Color Bleeding          Caustics             |
|   +-----------+        +---------------+       +----------------+   |
|   |  _____    |        |   Red Wall    |       |   Glass       |    |
|   | |     |   |        |   |           |       |    /\         |   |
|   | |     |   |        |   v           |       |   /  \        |   |
|   | |_____|   |        |  [Pink floor] |       |  /    \       |   |
|   | Dark      |        |               |       | Bright spot   |   |
|   | corners   |        |               |       | on floor      |   |
|   +-----------+        +---------------+       +----------------+   |
|                                                                      |
+=====================================================================+
```

## Core Principles

### Light Transport Types

| Type | Description | Notation | Example |
|------|-------------|----------|---------|
| Direct | Light travels directly from source | L(D)E | Sunlight on ground |
| Indirect Diffuse | Light bounces diffusely | LD+E | Color bleeding |
| Indirect Specular | Light reflects specularly | LS+E | Mirror reflections |
| Caustics | Light focuses through specular surfaces | LS+D+E | Light through glass |

### BRDF (Bidirectional Reflectance Distribution Function)

The BRDF describes how light reflects off a surface:

```hlsl
// Lambertian (diffuse) BRDF
float3 LambertianBRDF(float3 albedo)
{
    return albedo / PI;
}

// Cook-Torrance (specular) BRDF
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

// GGX Normal Distribution Function
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

## Key Concepts

### 1. Ray Tracing Fundamentals

```hlsl
struct Ray
{
    float3 origin;
    float3 direction;
};

struct HitInfo
{
    float t;           // Distance along ray
    float3 position;
    float3 normal;
    float2 uv;
    int materialId;
};

// Basic ray-sphere intersection
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

// Ray-triangle intersection (Moller-Trumbore)
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

### 2. Path Tracing

Path tracing is a Monte Carlo method that traces random paths through the scene:

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
            // Hit sky - add environment contribution
            radiance += throughput * SampleEnvironment(ray.direction);
            break;
        }

        Material mat = GetMaterial(hit.materialId);

        // Add emission
        radiance += throughput * mat.emission;

        // Sample next direction based on material
        float3 wo = -ray.direction;
        float3 wi;
        float pdf;
        float3 brdf = SampleBRDF(hit.normal, wo, mat, wi, pdf);

        if (pdf < 1e-8)
            break;

        // Update throughput
        float cosTheta = max(dot(hit.normal, wi), 0.0);
        throughput *= brdf * cosTheta / pdf;

        // Russian roulette for path termination
        if (bounce > 3)
        {
            float p = max(throughput.r, max(throughput.g, throughput.b));
            if (Random() > p)
                break;
            throughput /= p;
        }

        // Set up next ray
        ray.origin = hit.position + hit.normal * 0.001;
        ray.direction = wi;
    }

    return radiance;
}

// Importance sampling the GGX distribution
float3 SampleGGX(float3 N, float roughness, out float pdf)
{
    float2 xi = float2(Random(), Random());

    float a = roughness * roughness;
    float phi = 2.0 * PI * xi.x;
    float cosTheta = sqrt((1.0 - xi.y) / (1.0 + (a * a - 1.0) * xi.y));
    float sinTheta = sqrt(1.0 - cosTheta * cosTheta);

    // Spherical to Cartesian
    float3 H;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;

    // Transform to world space
    float3 up = abs(N.z) < 0.999 ? float3(0, 0, 1) : float3(1, 0, 0);
    float3 tangent = normalize(cross(up, N));
    float3 bitangent = cross(N, tangent);

    float3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;

    // PDF for GGX importance sampling
    float d = (cosTheta * a * a - cosTheta) * cosTheta + 1.0;
    pdf = a * a * cosTheta * sinTheta / (PI * d * d);

    return normalize(sampleVec);
}
```

### 3. Acceleration Structures

Efficient ray tracing requires spatial acceleration structures:

```cpp
// Bounding Volume Hierarchy (BVH) Node
struct BVHNode
{
    AABB bounds;
    int leftChild;   // -1 if leaf
    int rightChild;  // -1 if leaf
    int primitiveStart;
    int primitiveCount;
};

// BVH Traversal
bool TraverseBVH(Ray ray, BVHNode* nodes, Triangle* triangles,
                 out HitInfo hit)
{
    hit.t = INFINITY;
    int stack[64];
    int stackPtr = 0;
    stack[stackPtr++] = 0;  // Start at root

    while (stackPtr > 0)
    {
        int nodeIdx = stack[--stackPtr];
        BVHNode node = nodes[nodeIdx];

        if (!RayAABBIntersect(ray, node.bounds, hit.t))
            continue;

        if (node.primitiveCount > 0)  // Leaf node
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
        else  // Internal node
        {
            // Push children (front-to-back order for efficiency)
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

## Code Examples

### Light Probes / Spherical Harmonics

```hlsl
// Spherical Harmonics for diffuse irradiance (L2 bands = 9 coefficients)
struct SHCoefficients
{
    float3 L00;   // Band 0
    float3 L1_1;  // Band 1
    float3 L10;
    float3 L11;
    float3 L2_2;  // Band 2
    float3 L2_1;
    float3 L20;
    float3 L21;
    float3 L22;
};

// Evaluate SH irradiance for a given normal direction
float3 EvaluateSH(SHCoefficients sh, float3 n)
{
    // Constants for SH basis functions
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

// Project environment map to SH coefficients
SHCoefficients ProjectToSH(TextureCube envMap)
{
    SHCoefficients sh = (SHCoefficients)0;

    const int samples = 4096;
    float weight = 0;

    for (int i = 0; i < samples; i++)
    {
        // Generate uniform sphere sample
        float2 xi = Hammersley(i, samples);
        float3 dir = UniformSampleSphere(xi);

        float3 radiance = envMap.SampleLevel(samplerLinear, dir, 0).rgb;

        // SH basis functions
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

### Screen-Space Global Illumination (SSGI)

```hlsl
// SSGI using ray marching in screen space
float3 SSGI(float2 uv, float3 worldPos, float3 normal, Texture2D colorBuffer,
            Texture2D depthBuffer, Texture2D normalBuffer, float4x4 viewProj)
{
    float3 indirectLight = float3(0, 0, 0);
    const int numSamples = 16;

    for (int i = 0; i < numSamples; i++)
    {
        // Generate random direction in hemisphere
        float2 xi = float2(Random(), Random());
        float3 sampleDir = CosineWeightedHemisphere(normal, xi);

        // Ray march in screen space
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

            // Project to screen space
            float4 clipPos = mul(viewProj, float4(currentPos, 1.0));
            float2 screenUV = clipPos.xy / clipPos.w * 0.5 + 0.5;

            if (screenUV.x < 0 || screenUV.x > 1 || screenUV.y < 0 || screenUV.y > 1)
                break;

            // Compare depth
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

            // Check facing
            if (dot(hitNormal, -rayDir) > 0)
            {
                indirectLight += hitColor;
            }
        }
    }

    return indirectLight / numSamples;
}
```

### Voxel Cone Tracing

```hlsl
// Voxel structure
Texture3D<float4> voxelGrid;  // RGB = color, A = opacity

// Cone tracing for indirect lighting
float3 TraceCone(float3 origin, float3 direction, float coneRatio,
                 float maxDistance, float voxelSize)
{
    float3 color = float3(0, 0, 0);
    float occlusion = 0.0;

    float t = voxelSize;  // Start at voxel size to avoid self-intersection
    float3 voxelGridSize = float3(256, 256, 256);

    while (t < maxDistance && occlusion < 1.0)
    {
        // Calculate cone diameter at current distance
        float diameter = max(voxelSize, coneRatio * t);
        float mipLevel = log2(diameter / voxelSize);

        // Sample position in voxel grid
        float3 samplePos = origin + direction * t;
        float3 voxelUV = samplePos / voxelGridSize;

        if (any(voxelUV < 0) || any(voxelUV > 1))
            break;

        // Sample voxel with trilinear filtering at appropriate mip
        float4 voxelSample = voxelGrid.SampleLevel(samplerLinear, voxelUV, mipLevel);

        // Front-to-back compositing
        float a = 1.0 - occlusion;
        color += a * voxelSample.a * voxelSample.rgb;
        occlusion += a * voxelSample.a;

        // Step forward
        t += diameter * 0.5;
    }

    return color;
}

// Full indirect lighting with multiple cones
float3 VoxelConeTracingIndirect(float3 worldPos, float3 normal, float3 albedo)
{
    float3 indirectDiffuse = float3(0, 0, 0);

    // Diffuse cones - sample hemisphere with wide cones
    const float diffuseConeRatio = 0.577; // tan(30 degrees)
    const int numDiffuseCones = 6;

    // Generate cone directions around normal
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

### Light Propagation Volumes (LPV)

```hlsl
// LPV uses spherical harmonics in a 3D grid
struct LPVCell
{
    float4 SH_R;  // Red channel SH coefficients
    float4 SH_G;  // Green channel SH coefficients
    float4 SH_B;  // Blue channel SH coefficients
};

RWStructuredBuffer<LPVCell> lpvGrid;
RWStructuredBuffer<LPVCell> lpvGridNext;

// Inject light into LPV from RSM (Reflective Shadow Map)
[numthreads(8, 8, 1)]
void InjectLightFromRSM(uint3 id : SV_DispatchThreadID)
{
    // Sample RSM
    float2 rsmUV = float2(id.xy) / float2(RSM_SIZE, RSM_SIZE);
    float3 flux = rsmFlux.Sample(samplerLinear, rsmUV).rgb;
    float3 normal = rsmNormal.Sample(samplerLinear, rsmUV).rgb * 2.0 - 1.0;
    float3 worldPos = rsmPosition.Sample(samplerLinear, rsmUV).rgb;

    // Convert world position to LPV cell
    int3 cell = WorldToLPVCell(worldPos);
    if (any(cell < 0) || any(cell >= LPV_SIZE))
        return;

    // Convert flux to SH and inject
    float4 sh = DirectionToSH(normal);

    int cellIndex = cell.x + cell.y * LPV_SIZE + cell.z * LPV_SIZE * LPV_SIZE;

    // Atomic add to SH coefficients
    InterlockedAdd(lpvGrid[cellIndex].SH_R, flux.r * sh);
    InterlockedAdd(lpvGrid[cellIndex].SH_G, flux.g * sh);
    InterlockedAdd(lpvGrid[cellIndex].SH_B, flux.b * sh);
}

// Propagate light through LPV
[numthreads(4, 4, 4)]
void PropagateLPV(uint3 id : SV_DispatchThreadID)
{
    int3 cell = int3(id);
    if (any(cell < 0) || any(cell >= LPV_SIZE))
        return;

    int cellIndex = cell.x + cell.y * LPV_SIZE + cell.z * LPV_SIZE * LPV_SIZE;

    LPVCell newCell = (LPVCell)0;

    // Sum contributions from 6 neighbors
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

        // Evaluate SH in direction of propagation
        float4 sh = DirectionToSH(-faceNormals[i]);
        float solidAngle = 0.4006696846f; // Face solid angle

        newCell.SH_R += EvaluateSH4(neighbor.SH_R, sh) * solidAngle * DirectionToSH(faceNormals[i]);
        newCell.SH_G += EvaluateSH4(neighbor.SH_G, sh) * solidAngle * DirectionToSH(faceNormals[i]);
        newCell.SH_B += EvaluateSH4(neighbor.SH_B, sh) * solidAngle * DirectionToSH(faceNormals[i]);
    }

    lpvGridNext[cellIndex] = newCell;
}

// Sample LPV for indirect lighting
float3 SampleLPV(float3 worldPos, float3 normal)
{
    int3 cell = WorldToLPVCell(worldPos);
    if (any(cell < 0) || any(cell >= LPV_SIZE - 1))
        return float3(0, 0, 0);

    // Trilinear interpolation
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

### Real-Time Ray Traced GI (RTX)

```hlsl
// DXR Ray Generation Shader
[shader("raygeneration")]
void RayGenGI()
{
    uint2 launchIndex = DispatchRaysIndex().xy;
    uint2 launchDim = DispatchRaysDimensions().xy;

    // Get G-buffer data
    float2 uv = (float2(launchIndex) + 0.5) / float2(launchDim);
    float3 worldPos = gPosition.SampleLevel(samplerPoint, uv, 0).xyz;
    float3 normal = gNormal.SampleLevel(samplerPoint, uv, 0).xyz;
    float3 albedo = gAlbedo.SampleLevel(samplerPoint, uv, 0).xyz;

    if (length(normal) < 0.5)  // Sky pixel
    {
        outputGI[launchIndex] = float4(0, 0, 0, 1);
        return;
    }

    float3 indirectLight = float3(0, 0, 0);
    const int numSamples = 4;

    for (int i = 0; i < numSamples; i++)
    {
        // Generate random direction in hemisphere
        uint seed = launchIndex.x + launchIndex.y * launchDim.x + frameIndex * 1000 + i;
        float2 xi = float2(RandomFloat(seed), RandomFloat(seed + 1));
        float3 sampleDir = CosineWeightedHemisphere(normal, xi);

        // Set up ray
        RayDesc ray;
        ray.Origin = worldPos + normal * 0.001;
        ray.Direction = sampleDir;
        ray.TMin = 0.001;
        ray.TMax = 100.0;

        // Trace ray
        GIPayload payload;
        payload.color = float3(0, 0, 0);
        payload.hitDistance = 100.0;

        TraceRay(
            accelerationStructure,
            RAY_FLAG_CULL_BACK_FACING_TRIANGLES,
            0xFF,
            0,  // Hit group index
            1,  // Multiplier for geometry index
            0,  // Miss shader index
            ray,
            payload
        );

        indirectLight += payload.color;
    }

    indirectLight /= numSamples;
    indirectLight *= albedo / PI;

    // Temporal accumulation
    float3 history = historyBuffer[launchIndex].rgb;
    float3 result = lerp(history, indirectLight, 0.1);

    outputGI[launchIndex] = float4(result, 1);
}

// Closest Hit Shader
[shader("closesthit")]
void ClosestHitGI(inout GIPayload payload, in BuiltInTriangleIntersectionAttributes attr)
{
    // Get triangle data
    uint primitiveIndex = PrimitiveIndex();
    uint3 indices = GetIndices(primitiveIndex);

    float3 barycentrics = float3(1 - attr.barycentrics.x - attr.barycentrics.y,
                                  attr.barycentrics.x, attr.barycentrics.y);

    // Interpolate vertex attributes
    float3 normal = InterpolateNormal(indices, barycentrics);
    float2 uv = InterpolateUV(indices, barycentrics);

    // Sample material
    float3 albedo = albedoTexture.SampleLevel(samplerLinear, uv, 0).rgb;
    float3 emission = emissionTexture.SampleLevel(samplerLinear, uv, 0).rgb;

    // Direct lighting at hit point
    float3 hitPos = WorldRayOrigin() + WorldRayDirection() * RayTCurrent();
    float3 directLight = ComputeDirectLighting(hitPos, normal);

    payload.color = emission + directLight * albedo;
    payload.hitDistance = RayTCurrent();
}

// Miss Shader
[shader("miss")]
void MissGI(inout GIPayload payload)
{
    float3 dir = WorldRayDirection();
    payload.color = SampleEnvironment(dir);
    payload.hitDistance = 100.0;
}
```

## Best Practices

### 1. Balance Quality vs Performance

```hlsl
// Adaptive sampling based on variance
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

        // Early out if variance is low enough
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

### 2. Use Temporal Accumulation

```hlsl
// Temporal reprojection for GI
float3 TemporalAccumulateGI(float2 uv, float3 currentGI, float3 worldPos)
{
    // Reproject to previous frame
    float4 prevClip = mul(prevViewProj, float4(worldPos, 1.0));
    float2 prevUV = prevClip.xy / prevClip.w * 0.5 + 0.5;

    // Check if valid reprojection
    bool valid = all(prevUV >= 0 && prevUV <= 1);

    // Check depth similarity
    float currentDepth = depthBuffer.Sample(samplerPoint, uv).r;
    float prevDepth = prevDepthBuffer.Sample(samplerPoint, prevUV).r;
    valid = valid && abs(currentDepth - prevDepth) < 0.01;

    if (valid)
    {
        float3 history = historyBuffer.Sample(samplerLinear, prevUV).rgb;

        // Clamp history to neighborhood to prevent ghosting
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

### 3. LOD and Distance-Based Quality

```hlsl
float3 DistanceBasedGI(float3 worldPos, float3 normal, float cameraDistance)
{
    // Near: Full ray traced GI
    if (cameraDistance < 20.0)
    {
        return RayTracedGI(worldPos, normal, 8);  // 8 samples
    }
    // Medium: Reduced samples
    else if (cameraDistance < 50.0)
    {
        return RayTracedGI(worldPos, normal, 4);  // 4 samples
    }
    // Far: Use light probes only
    else
    {
        return SampleLightProbes(worldPos, normal);
    }
}
```

## Common Pitfalls

### Pitfall 1: Light Leaking

```hlsl
// BAD: No bias causes self-intersection
Ray ray;
ray.Origin = hitPosition;  // May hit same surface again!

// GOOD: Apply bias along normal
Ray ray;
ray.Origin = hitPosition + hitNormal * 0.001;
```

### Pitfall 2: Energy Conservation Violation

```hlsl
// BAD: BRDF that doesn't conserve energy
float3 brdf = albedo;  // Not energy conserving!

// GOOD: Properly normalized BRDF
float3 diffuseBRDF = albedo / PI;
float3 specularBRDF = /* ... properly computed Cook-Torrance ... */;
float3 brdf = diffuseBRDF * (1 - fresnel) + specularBRDF;
```

### Pitfall 3: Fireflies in Path Tracing

```hlsl
// BAD: No clamping allows fireflies
float3 sample = radiance / pdf;

// GOOD: Clamp contribution to prevent fireflies
float3 sample = radiance / max(pdf, 0.001);
sample = min(sample, MAX_CONTRIBUTION);  // Clamp very bright samples
```

## Performance Considerations

### GI Technique Comparison

| Technique | Quality | Performance | Dynamic | Memory |
|-----------|---------|-------------|---------|--------|
| Baked Lightmaps | Excellent | Very Fast | No | High |
| Light Probes/SH | Good | Fast | Limited | Low |
| SSGI | Medium | Medium | Yes | Low |
| Voxel Cone Tracing | Good | Medium | Yes | High |
| LPV | Medium | Medium | Yes | Medium |
| RTGI (RTX) | Excellent | Slow | Yes | Medium |

### Optimization Strategies

1. **Hybrid approaches**: Combine baked and real-time GI
2. **Async compute**: Run GI on async compute queue
3. **Resolution scaling**: Compute GI at lower resolution
4. **Temporal spreading**: Spread samples across frames
5. **Importance sampling**: Focus rays where they matter most

## Interview Focus Points

### Common Interview Questions

**Q1: What is the difference between direct and indirect lighting?**

Direct lighting is light that travels directly from a light source to a surface. Indirect lighting (global illumination) is light that has bounced off at least one surface before reaching the viewer, including effects like color bleeding, ambient occlusion, and caustics.

**Q2: Explain the rendering equation.**

The rendering equation describes how light is distributed in a scene. It states that the outgoing light from a point equals emitted light plus the integral of all incoming light multiplied by the BRDF and cosine term over the hemisphere.

**Q3: What is importance sampling and why is it important for path tracing?**

Importance sampling is a variance reduction technique that samples more frequently in directions where the integrand is large. For path tracing, sampling according to the BRDF or light distribution significantly reduces noise compared to uniform sampling.

**Q4: Compare different real-time GI techniques.**

- **Light Probes/SH**: Fast but static, good for diffuse
- **SSGI**: Screen-space only, misses off-screen objects
- **VCT**: Good quality, high memory usage
- **LPV**: Good for large-scale diffuse, lower quality
- **RTGI**: Best quality, requires RT hardware

**Q5: How do you handle light leaking in GI?**

Use proper ray biasing, implement shadow rays, use geometry-aware filtering, employ robust occlusion testing, and consider using signed distance fields for better occlusion.

## Further Reading

### Academic Papers

- "The Rendering Equation" - James Kajiya (1986)
- "Global Illumination Compendium" - Philip Dutre
- "Real-Time Global Illumination using Precomputed Light Field Probes"
- "Interactive Indirect Illumination Using Voxel Cone Tracing"
- "Light Propagation Volumes in CryEngine 3"

### Books

- "Physically Based Rendering" by Pharr, Jakob, and Humphreys
- "Real-Time Rendering, 4th Edition"
- "Advanced Global Illumination"

### Engine Documentation

- Unity High Definition Render Pipeline GI
- Unreal Engine Lumen GI
- NVIDIA RTX Global Illumination

### Online Resources

- GPU Gems (NVIDIA)
- Advances in Real-Time Rendering (SIGGRAPH)
- Ray Tracing Gems
