---
title: 地形系统与渲染技术
description: 构建大规模游戏地形：高度图、地形渲染和植被系统
track: gamedev
section: graphics
difficulty: advanced
tags:
  - 地形
  - 渲染
  - 高度图
  - 植被
status: imported
origin: old/src/content/docs/gamedev/terrain-rendering.zh.md
divergence: 0.197
issues: []
legacy:
  category: GameDev
  subcategory: 3D
  order: 32
  lastUpdated: 2026-01-07
---

地形渲染是现代游戏引擎的核心技术之一，它需要在保证视觉质量的同时处理大规模场景的性能优化。本文将深入探讨地形系统的各个方面，从高度图生成到植被渲染，从LOD技术到大气效果。

---

## 高度图地形基础

### 什么是高度图

高度图(Heightmap)是一张灰度图像，其中每个像素的亮度值代表对应位置的高度。白色表示最高点，黑色表示最低点。这种简单而高效的数据结构是地形表示的基础。

### 高度图数据结构

```cpp
// 高度图数据结构
struct Heightmap {
    std::vector<float> data;  // 高度数据，范围[0, 1]
    uint32_t width;           // 宽度
    uint32_t height;          // 高度
    float minHeight;          // 最小高度（世界单位）
    float maxHeight;          // 最大高度（世界单位）

    // 获取指定位置的高度
    float getHeight(int x, int z) const {
        if (x < 0 || x >= width || z < 0 || z >= height) {
            return 0.0f;
        }
        float normalizedHeight = data[z * width + x];
        return minHeight + normalizedHeight * (maxHeight - minHeight);
    }

    // 双线性插值获取任意位置高度
    float getHeightBilinear(float x, float z) const {
        // 获取四个相邻顶点
        int x0 = static_cast<int>(std::floor(x));
        int x1 = x0 + 1;
        int z0 = static_cast<int>(std::floor(z));
        int z1 = z0 + 1;

        // 计算插值因子
        float fx = x - x0;
        float fz = z - z0;

        // 获取四个角的高度
        float h00 = getHeight(x0, z0);
        float h10 = getHeight(x1, z0);
        float h01 = getHeight(x0, z1);
        float h11 = getHeight(x1, z1);

        // 双线性插值
        float h0 = h00 * (1 - fx) + h10 * fx;
        float h1 = h01 * (1 - fx) + h11 * fx;

        return h0 * (1 - fz) + h1 * fz;
    }

    // 计算法线向量
    glm::vec3 getNormal(int x, int z) const {
        float hL = getHeight(x - 1, z);
        float hR = getHeight(x + 1, z);
        float hD = getHeight(x, z - 1);
        float hU = getHeight(x, z + 1);

        glm::vec3 normal(hL - hR, 2.0f, hD - hU);
        return glm::normalize(normal);
    }
};
```

### 从高度图生成网格

```cpp
class TerrainMesh {
public:
    struct Vertex {
        glm::vec3 position;
        glm::vec3 normal;
        glm::vec2 texCoord;
    };

    std::vector<Vertex> vertices;
    std::vector<uint32_t> indices;

    void generateFromHeightmap(const Heightmap& heightmap, float cellSize) {
        // 生成顶点
        vertices.reserve(heightmap.width * heightmap.height);

        for (uint32_t z = 0; z < heightmap.height; ++z) {
            for (uint32_t x = 0; x < heightmap.width; ++x) {
                Vertex vertex;

                // 位置
                vertex.position = glm::vec3(
                    x * cellSize,
                    heightmap.getHeight(x, z),
                    z * cellSize
                );

                // 法线
                vertex.normal = heightmap.getNormal(x, z);

                // 纹理坐标
                vertex.texCoord = glm::vec2(
                    static_cast<float>(x) / heightmap.width,
                    static_cast<float>(z) / heightmap.height
                );

                vertices.push_back(vertex);
            }
        }

        // 生成索引（三角形带）
        for (uint32_t z = 0; z < heightmap.height - 1; ++z) {
            for (uint32_t x = 0; x < heightmap.width - 1; ++x) {
                uint32_t topLeft = z * heightmap.width + x;
                uint32_t topRight = topLeft + 1;
                uint32_t bottomLeft = (z + 1) * heightmap.width + x;
                uint32_t bottomRight = bottomLeft + 1;

                // 第一个三角形
                indices.push_back(topLeft);
                indices.push_back(bottomLeft);
                indices.push_back(topRight);

                // 第二个三角形
                indices.push_back(topRight);
                indices.push_back(bottomLeft);
                indices.push_back(bottomRight);
            }
        }
    }
};
```

### 程序化地形生成

使用噪声函数生成自然的地形高度：

```cpp
#include <cmath>
#include <random>

class PerlinNoise {
private:
    std::vector<int> permutation;

    double fade(double t) const {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    double lerp(double t, double a, double b) const {
        return a + t * (b - a);
    }

    double grad(int hash, double x, double y, double z) const {
        int h = hash & 15;
        double u = h < 8 ? x : y;
        double v = h < 4 ? y : (h == 12 || h == 14 ? x : z);
        return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
    }

public:
    PerlinNoise(unsigned int seed = 0) {
        permutation.resize(512);
        std::vector<int> p(256);

        for (int i = 0; i < 256; ++i) {
            p[i] = i;
        }

        std::shuffle(p.begin(), p.end(), std::default_random_engine(seed));

        for (int i = 0; i < 512; ++i) {
            permutation[i] = p[i & 255];
        }
    }

    double noise(double x, double y, double z) const {
        int X = static_cast<int>(std::floor(x)) & 255;
        int Y = static_cast<int>(std::floor(y)) & 255;
        int Z = static_cast<int>(std::floor(z)) & 255;

        x -= std::floor(x);
        y -= std::floor(y);
        z -= std::floor(z);

        double u = fade(x);
        double v = fade(y);
        double w = fade(z);

        int A = permutation[X] + Y;
        int AA = permutation[A] + Z;
        int AB = permutation[A + 1] + Z;
        int B = permutation[X + 1] + Y;
        int BA = permutation[B] + Z;
        int BB = permutation[B + 1] + Z;

        return lerp(w,
            lerp(v,
                lerp(u, grad(permutation[AA], x, y, z),
                        grad(permutation[BA], x - 1, y, z)),
                lerp(u, grad(permutation[AB], x, y - 1, z),
                        grad(permutation[BB], x - 1, y - 1, z))),
            lerp(v,
                lerp(u, grad(permutation[AA + 1], x, y, z - 1),
                        grad(permutation[BA + 1], x - 1, y, z - 1)),
                lerp(u, grad(permutation[AB + 1], x, y - 1, z - 1),
                        grad(permutation[BB + 1], x - 1, y - 1, z - 1))));
    }

    // 分形布朗运动（FBM）- 叠加多个频率的噪声
    double fbm(double x, double y, int octaves, double persistence = 0.5) const {
        double total = 0.0;
        double frequency = 1.0;
        double amplitude = 1.0;
        double maxValue = 0.0;

        for (int i = 0; i < octaves; ++i) {
            total += noise(x * frequency, y * frequency, 0) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2.0;
        }

        return total / maxValue;
    }
};

// 生成程序化高度图
Heightmap generateProceduralHeightmap(int width, int height, unsigned int seed) {
    Heightmap heightmap;
    heightmap.width = width;
    heightmap.height = height;
    heightmap.minHeight = 0.0f;
    heightmap.maxHeight = 100.0f;
    heightmap.data.resize(width * height);

    PerlinNoise noise(seed);

    for (int z = 0; z < height; ++z) {
        for (int x = 0; x < width; ++x) {
            // 基础地形
            double baseNoise = noise.fbm(x * 0.01, z * 0.01, 6, 0.5);

            // 山脉噪声（更大的振幅变化）
            double mountainNoise = noise.fbm(x * 0.005, z * 0.005, 4, 0.6);
            mountainNoise = std::pow(std::max(0.0, mountainNoise), 2.0);

            // 细节噪声
            double detailNoise = noise.fbm(x * 0.1, z * 0.1, 3, 0.4);

            // 组合
            double finalHeight = baseNoise * 0.4 + mountainNoise * 0.5 + detailNoise * 0.1;
            finalHeight = (finalHeight + 1.0) * 0.5;  // 归一化到[0, 1]

            heightmap.data[z * width + x] = static_cast<float>(finalHeight);
        }
    }

    return heightmap;
}
```

---

## LOD地形系统

大规模地形需要细节层次(Level of Detail, LOD)系统来保证性能。远处的地形使用较少的三角形，近处使用更多细节。

### Chunked LOD系统

```cpp
class TerrainChunk {
public:
    glm::vec3 center;
    float size;
    int lodLevel;

    // 每个LOD级别的网格
    std::vector<TerrainMesh> lodMeshes;

    // 边界盒用于裁剪
    glm::vec3 minBounds;
    glm::vec3 maxBounds;

    bool isVisible(const Frustum& frustum) const {
        return frustum.intersectsAABB(minBounds, maxBounds);
    }

    int calculateLOD(const glm::vec3& cameraPos) const {
        float distance = glm::length(cameraPos - center);

        // 基于距离选择LOD级别
        if (distance < 50.0f) return 0;   // 最高细节
        if (distance < 100.0f) return 1;
        if (distance < 200.0f) return 2;
        if (distance < 400.0f) return 3;
        return 4;  // 最低细节
    }
};

class ChunkedTerrain {
private:
    std::vector<TerrainChunk> chunks;
    int chunksPerSide;
    float chunkSize;

public:
    void initialize(const Heightmap& heightmap, float worldSize, int numChunks) {
        chunksPerSide = numChunks;
        chunkSize = worldSize / numChunks;

        int chunkResolution = heightmap.width / numChunks;

        for (int cz = 0; cz < numChunks; ++cz) {
            for (int cx = 0; cx < numChunks; ++cx) {
                TerrainChunk chunk;
                chunk.size = chunkSize;
                chunk.center = glm::vec3(
                    (cx + 0.5f) * chunkSize,
                    0.0f,
                    (cz + 0.5f) * chunkSize
                );

                // 为每个LOD级别生成网格
                for (int lod = 0; lod < 5; ++lod) {
                    int lodResolution = chunkResolution >> lod;  // 每级减半
                    lodResolution = std::max(lodResolution, 2);

                    TerrainMesh mesh;
                    generateChunkMesh(mesh, heightmap, cx, cz,
                                     chunkResolution, lodResolution, chunkSize);
                    chunk.lodMeshes.push_back(mesh);
                }

                // 计算边界盒
                calculateBounds(chunk, heightmap, cx, cz, chunkResolution);

                chunks.push_back(chunk);
            }
        }
    }

    void render(const Camera& camera, Shader& shader) {
        Frustum frustum = camera.getFrustum();
        glm::vec3 cameraPos = camera.getPosition();

        for (auto& chunk : chunks) {
            // 视锥裁剪
            if (!chunk.isVisible(frustum)) {
                continue;
            }

            // 选择LOD级别
            int lod = chunk.calculateLOD(cameraPos);

            // 渲染对应LOD的网格
            renderChunkMesh(chunk.lodMeshes[lod], shader);
        }
    }

private:
    void generateChunkMesh(TerrainMesh& mesh, const Heightmap& heightmap,
                          int chunkX, int chunkZ, int srcResolution,
                          int dstResolution, float chunkSize) {
        int startX = chunkX * srcResolution;
        int startZ = chunkZ * srcResolution;
        float cellSize = chunkSize / (dstResolution - 1);
        int step = srcResolution / (dstResolution - 1);

        mesh.vertices.clear();
        mesh.indices.clear();

        // 生成顶点
        for (int z = 0; z < dstResolution; ++z) {
            for (int x = 0; x < dstResolution; ++x) {
                int srcX = startX + x * step;
                int srcZ = startZ + z * step;

                TerrainMesh::Vertex vertex;
                vertex.position = glm::vec3(
                    chunkX * chunkSize + x * cellSize,
                    heightmap.getHeight(srcX, srcZ),
                    chunkZ * chunkSize + z * cellSize
                );
                vertex.normal = heightmap.getNormal(srcX, srcZ);
                vertex.texCoord = glm::vec2(
                    static_cast<float>(srcX) / heightmap.width,
                    static_cast<float>(srcZ) / heightmap.height
                );

                mesh.vertices.push_back(vertex);
            }
        }

        // 生成索引
        for (int z = 0; z < dstResolution - 1; ++z) {
            for (int x = 0; x < dstResolution - 1; ++x) {
                uint32_t topLeft = z * dstResolution + x;
                uint32_t topRight = topLeft + 1;
                uint32_t bottomLeft = (z + 1) * dstResolution + x;
                uint32_t bottomRight = bottomLeft + 1;

                mesh.indices.push_back(topLeft);
                mesh.indices.push_back(bottomLeft);
                mesh.indices.push_back(topRight);
                mesh.indices.push_back(topRight);
                mesh.indices.push_back(bottomLeft);
                mesh.indices.push_back(bottomRight);
            }
        }
    }

    void calculateBounds(TerrainChunk& chunk, const Heightmap& heightmap,
                        int chunkX, int chunkZ, int resolution) {
        float minY = std::numeric_limits<float>::max();
        float maxY = std::numeric_limits<float>::lowest();

        int startX = chunkX * resolution;
        int startZ = chunkZ * resolution;

        for (int z = 0; z <= resolution; ++z) {
            for (int x = 0; x <= resolution; ++x) {
                float h = heightmap.getHeight(startX + x, startZ + z);
                minY = std::min(minY, h);
                maxY = std::max(maxY, h);
            }
        }

        chunk.minBounds = glm::vec3(chunkX * chunkSize, minY, chunkZ * chunkSize);
        chunk.maxBounds = glm::vec3((chunkX + 1) * chunkSize, maxY, (chunkZ + 1) * chunkSize);
    }

    void renderChunkMesh(const TerrainMesh& mesh, Shader& shader) {
        // 绑定VAO并绘制
        // ... OpenGL渲染代码
    }
};
```

### GPU Tessellation地形

使用硬件细分曲面实现动态LOD：

```glsl
// 顶点着色器 (terrain_tess.vert)
#version 450

layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec2 inTexCoord;

out VS_OUT {
    vec2 texCoord;
} vs_out;

void main() {
    gl_Position = vec4(inPosition, 1.0);
    vs_out.texCoord = inTexCoord;
}

// 细分控制着色器 (terrain_tess.tesc)
#version 450

layout(vertices = 4) out;

in VS_OUT {
    vec2 texCoord;
} tcs_in[];

out TCS_OUT {
    vec2 texCoord;
} tcs_out[];

uniform vec3 cameraPos;
uniform mat4 model;

float getTessLevel(float distance) {
    if (distance < 20.0) return 64.0;
    if (distance < 50.0) return 32.0;
    if (distance < 100.0) return 16.0;
    if (distance < 200.0) return 8.0;
    if (distance < 500.0) return 4.0;
    return 2.0;
}

void main() {
    tcs_out[gl_InvocationID].texCoord = tcs_in[gl_InvocationID].texCoord;

    if (gl_InvocationID == 0) {
        // 计算patch中心到相机的距离
        vec4 center = vec4(0.0);
        for (int i = 0; i < 4; ++i) {
            center += gl_in[i].gl_Position;
        }
        center /= 4.0;
        center = model * center;

        float distance = length(cameraPos - center.xyz);
        float tessLevel = getTessLevel(distance);

        gl_TessLevelOuter[0] = tessLevel;
        gl_TessLevelOuter[1] = tessLevel;
        gl_TessLevelOuter[2] = tessLevel;
        gl_TessLevelOuter[3] = tessLevel;
        gl_TessLevelInner[0] = tessLevel;
        gl_TessLevelInner[1] = tessLevel;
    }
}

// 细分评估着色器 (terrain_tess.tese)
#version 450

layout(quads, fractional_even_spacing, ccw) in;

in TCS_OUT {
    vec2 texCoord;
} tes_in[];

out TES_OUT {
    vec3 worldPos;
    vec2 texCoord;
    vec3 normal;
} tes_out;

uniform sampler2D heightMap;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform float heightScale;
uniform float terrainSize;

vec2 interpolate2D(vec2 v0, vec2 v1, vec2 v2, vec2 v3) {
    vec2 a = mix(v0, v1, gl_TessCoord.x);
    vec2 b = mix(v3, v2, gl_TessCoord.x);
    return mix(a, b, gl_TessCoord.y);
}

vec4 interpolate4D(vec4 v0, vec4 v1, vec4 v2, vec4 v3) {
    vec4 a = mix(v0, v1, gl_TessCoord.x);
    vec4 b = mix(v3, v2, gl_TessCoord.x);
    return mix(a, b, gl_TessCoord.y);
}

void main() {
    // 插值位置和纹理坐标
    vec4 position = interpolate4D(
        gl_in[0].gl_Position,
        gl_in[1].gl_Position,
        gl_in[2].gl_Position,
        gl_in[3].gl_Position
    );

    vec2 texCoord = interpolate2D(
        tes_in[0].texCoord,
        tes_in[1].texCoord,
        tes_in[2].texCoord,
        tes_in[3].texCoord
    );

    // 从高度图采样高度
    float height = texture(heightMap, texCoord).r * heightScale;
    position.y = height;

    // 计算法线（使用中心差分）
    float texelSize = 1.0 / textureSize(heightMap, 0).x;
    float hL = texture(heightMap, texCoord + vec2(-texelSize, 0)).r * heightScale;
    float hR = texture(heightMap, texCoord + vec2(texelSize, 0)).r * heightScale;
    float hD = texture(heightMap, texCoord + vec2(0, -texelSize)).r * heightScale;
    float hU = texture(heightMap, texCoord + vec2(0, texelSize)).r * heightScale;

    vec3 normal = normalize(vec3(hL - hR, 2.0 * terrainSize * texelSize, hD - hU));

    // 输出
    vec4 worldPos = model * position;
    tes_out.worldPos = worldPos.xyz;
    tes_out.texCoord = texCoord;
    tes_out.normal = mat3(transpose(inverse(model))) * normal;

    gl_Position = projection * view * worldPos;
}
```

---

## 地形纹理混合

### Splatmap纹理混合

Splatmap是一种使用RGBA通道存储多层纹理权重的技术：

```glsl
// 地形片段着色器 (terrain.frag)
#version 450

in TES_OUT {
    vec3 worldPos;
    vec2 texCoord;
    vec3 normal;
} fs_in;

out vec4 fragColor;

// 地形纹理
uniform sampler2D splatMap;        // RGBA权重图
uniform sampler2D texture0;        // 草地
uniform sampler2D texture1;        // 泥土
uniform sampler2D texture2;        // 岩石
uniform sampler2D texture3;        // 雪

// 法线贴图
uniform sampler2D normalMap0;
uniform sampler2D normalMap1;
uniform sampler2D normalMap2;
uniform sampler2D normalMap3;

// 光照参数
uniform vec3 lightDir;
uniform vec3 lightColor;
uniform vec3 ambientColor;
uniform vec3 cameraPos;

// 纹理缩放
uniform float textureScale = 32.0;

vec3 blendNormals(vec3 n1, vec3 n2) {
    return normalize(vec3(n1.xy + n2.xy, n1.z * n2.z));
}

void main() {
    // 获取splat权重
    vec4 splat = texture(splatMap, fs_in.texCoord);

    // 细节纹理坐标
    vec2 detailUV = fs_in.texCoord * textureScale;

    // 采样各层纹理
    vec4 color0 = texture(texture0, detailUV);
    vec4 color1 = texture(texture1, detailUV);
    vec4 color2 = texture(texture2, detailUV);
    vec4 color3 = texture(texture3, detailUV);

    // 高度混合（基于纹理alpha通道的高度）
    float depth = 0.2;
    float h0 = color0.a + splat.r;
    float h1 = color1.a + splat.g;
    float h2 = color2.a + splat.b;
    float h3 = color3.a + splat.a;

    float maxHeight = max(max(h0, h1), max(h2, h3)) - depth;

    float w0 = max(h0 - maxHeight, 0.0);
    float w1 = max(h1 - maxHeight, 0.0);
    float w2 = max(h2 - maxHeight, 0.0);
    float w3 = max(h3 - maxHeight, 0.0);

    float totalWeight = w0 + w1 + w2 + w3;
    w0 /= totalWeight;
    w1 /= totalWeight;
    w2 /= totalWeight;
    w3 /= totalWeight;

    // 混合颜色
    vec3 albedo = color0.rgb * w0 + color1.rgb * w1 +
                  color2.rgb * w2 + color3.rgb * w3;

    // 采样法线贴图
    vec3 n0 = texture(normalMap0, detailUV).rgb * 2.0 - 1.0;
    vec3 n1 = texture(normalMap1, detailUV).rgb * 2.0 - 1.0;
    vec3 n2 = texture(normalMap2, detailUV).rgb * 2.0 - 1.0;
    vec3 n3 = texture(normalMap3, detailUV).rgb * 2.0 - 1.0;

    vec3 detailNormal = n0 * w0 + n1 * w1 + n2 * w2 + n3 * w3;
    detailNormal = normalize(detailNormal);

    // 构建TBN矩阵
    vec3 N = normalize(fs_in.normal);
    vec3 T = normalize(cross(N, vec3(0.0, 0.0, 1.0)));
    vec3 B = cross(N, T);
    mat3 TBN = mat3(T, B, N);

    // 最终法线
    vec3 normal = normalize(TBN * detailNormal);

    // 光照计算
    float NdotL = max(dot(normal, -lightDir), 0.0);
    vec3 diffuse = albedo * lightColor * NdotL;

    // 高光
    vec3 viewDir = normalize(cameraPos - fs_in.worldPos);
    vec3 halfDir = normalize(viewDir - lightDir);
    float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
    vec3 specular = lightColor * spec * 0.3;

    // 环境光
    vec3 ambient = albedo * ambientColor;

    fragColor = vec4(ambient + diffuse + specular, 1.0);
}
```

### 三平面投影（Triplanar Mapping）

解决陡峭表面纹理拉伸问题：

```glsl
// 三平面投影片段着色器
#version 450

uniform sampler2D terrainTexture;
uniform float textureScale;

vec4 triplanarSample(sampler2D tex, vec3 worldPos, vec3 normal) {
    // 计算混合权重
    vec3 blendWeights = abs(normal);
    blendWeights = pow(blendWeights, vec3(4.0));  // 锐化过渡
    blendWeights /= (blendWeights.x + blendWeights.y + blendWeights.z);

    // 三个平面的UV坐标
    vec2 uvX = worldPos.zy * textureScale;
    vec2 uvY = worldPos.xz * textureScale;
    vec2 uvZ = worldPos.xy * textureScale;

    // 采样并混合
    vec4 texX = texture(tex, uvX);
    vec4 texY = texture(tex, uvY);
    vec4 texZ = texture(tex, uvZ);

    return texX * blendWeights.x + texY * blendWeights.y + texZ * blendWeights.z;
}

// 三平面法线贴图
vec3 triplanarNormal(sampler2D normalTex, vec3 worldPos, vec3 normal) {
    vec3 blendWeights = abs(normal);
    blendWeights = pow(blendWeights, vec3(4.0));
    blendWeights /= (blendWeights.x + blendWeights.y + blendWeights.z);

    vec2 uvX = worldPos.zy * textureScale;
    vec2 uvY = worldPos.xz * textureScale;
    vec2 uvZ = worldPos.xy * textureScale;

    // 采样法线并正确旋转到世界空间
    vec3 nX = texture(normalTex, uvX).rgb * 2.0 - 1.0;
    nX = vec3(nX.y, nX.z, nX.x);  // 重新映射到X平面

    vec3 nY = texture(normalTex, uvY).rgb * 2.0 - 1.0;
    // nY已经在正确的朝向

    vec3 nZ = texture(normalTex, uvZ).rgb * 2.0 - 1.0;
    nZ = vec3(nZ.x, nZ.z, nZ.y);  // 重新映射到Z平面

    // 混合
    vec3 worldNormal = nX * blendWeights.x + nY * blendWeights.y + nZ * blendWeights.z;
    return normalize(worldNormal);
}
```

### 基于坡度的纹理混合

根据地形坡度自动混合纹理：

```glsl
vec4 slopeBasedTexturing(vec3 worldPos, vec3 normal, vec2 uv) {
    // 计算坡度（0=平坦，1=垂直）
    float slope = 1.0 - normal.y;

    // 计算高度
    float height = worldPos.y;

    // 采样纹理
    vec4 grassColor = texture(grassTexture, uv * 32.0);
    vec4 rockColor = triplanarSample(rockTexture, worldPos, normal);
    vec4 snowColor = texture(snowTexture, uv * 32.0);

    // 坡度混合：陡峭处显示岩石
    float rockAmount = smoothstep(0.3, 0.7, slope);

    // 高度混合：高处显示雪
    float snowAmount = smoothstep(80.0, 120.0, height);
    snowAmount *= (1.0 - slope * 2.0);  // 陡峭处不积雪
    snowAmount = clamp(snowAmount, 0.0, 1.0);

    // 混合
    vec4 result = mix(grassColor, rockColor, rockAmount);
    result = mix(result, snowColor, snowAmount);

    return result;
}
```

---

## 草地和植被渲染

### GPU实例化草地

使用Compute Shader生成和剔除草地实例：

```glsl
// 草地生成Compute Shader (grass_generate.comp)
#version 450

layout(local_size_x = 64) in;

struct GrassInstance {
    vec4 positionScale;  // xyz=位置, w=缩放
    vec4 rotation;       // 四元数旋转
    vec4 color;          // rgb=颜色, a=风影响
};

layout(std430, binding = 0) buffer GrassInstanceBuffer {
    GrassInstance instances[];
};

layout(std430, binding = 1) buffer DrawIndirectBuffer {
    uint count;
    uint instanceCount;
    uint firstIndex;
    uint baseVertex;
    uint baseInstance;
};

uniform sampler2D heightMap;
uniform sampler2D densityMap;  // 草地密度图
uniform vec3 cameraPos;
uniform float grassDistance;   // 草地最大渲染距离
uniform vec3 terrainOffset;
uniform float terrainSize;
uniform float time;

// 伪随机函数
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    uint id = gl_GlobalInvocationID.x;

    // 基于ID生成位置
    uint gridSize = 512;
    uint x = id % gridSize;
    uint z = id / gridSize;

    vec2 uv = vec2(float(x) / float(gridSize), float(z) / float(gridSize));

    // 采样密度图
    float density = texture(densityMap, uv).r;

    // 随机偏移
    float randX = random(uv) * 2.0 - 1.0;
    float randZ = random(uv.yx) * 2.0 - 1.0;

    vec3 worldPos = terrainOffset + vec3(
        uv.x * terrainSize + randX * (terrainSize / gridSize),
        0.0,
        uv.y * terrainSize + randZ * (terrainSize / gridSize)
    );

    // 从高度图获取高度
    vec2 heightUV = (worldPos.xz - terrainOffset.xz) / terrainSize;
    worldPos.y = texture(heightMap, heightUV).r * 100.0;

    // 距离剔除
    float dist = length(worldPos - cameraPos);
    if (dist > grassDistance || density < random(uv + 0.5)) {
        return;
    }

    // 计算法线（用于朝向）
    float texelSize = 1.0 / textureSize(heightMap, 0).x;
    float hL = texture(heightMap, heightUV + vec2(-texelSize, 0)).r;
    float hR = texture(heightMap, heightUV + vec2(texelSize, 0)).r;
    float hD = texture(heightMap, heightUV + vec2(0, -texelSize)).r;
    float hU = texture(heightMap, heightUV + vec2(0, texelSize)).r;
    vec3 normal = normalize(vec3(hL - hR, 2.0 * texelSize, hD - hU));

    // 陡峭处不生成草
    if (normal.y < 0.7) {
        return;
    }

    // 原子增加实例计数
    uint instanceIndex = atomicAdd(instanceCount, 1);

    // 填充实例数据
    float scale = 0.5 + random(uv * 3.0) * 0.5;
    scale *= smoothstep(grassDistance, grassDistance * 0.8, dist);  // 距离淡出

    instances[instanceIndex].positionScale = vec4(worldPos, scale);

    // 随机旋转
    float angle = random(uv * 7.0) * 6.28318;
    instances[instanceIndex].rotation = vec4(0, sin(angle * 0.5), 0, cos(angle * 0.5));

    // 颜色变化
    float colorVariation = random(uv * 11.0);
    vec3 baseColor = mix(vec3(0.3, 0.5, 0.2), vec3(0.4, 0.6, 0.15), colorVariation);
    instances[instanceIndex].color = vec4(baseColor, random(uv * 13.0));
}
```

### 草地顶点着色器

```glsl
// 草地顶点着色器 (grass.vert)
#version 450

layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec2 inTexCoord;

struct GrassInstance {
    vec4 positionScale;
    vec4 rotation;
    vec4 color;
};

layout(std430, binding = 0) readonly buffer GrassInstanceBuffer {
    GrassInstance instances[];
};

out VS_OUT {
    vec2 texCoord;
    vec3 color;
    float ao;
} vs_out;

uniform mat4 view;
uniform mat4 projection;
uniform float time;
uniform vec3 windDirection;
uniform float windStrength;

// 四元数旋转
vec3 rotateByQuat(vec3 v, vec4 q) {
    vec3 t = 2.0 * cross(q.xyz, v);
    return v + q.w * t + cross(q.xyz, t);
}

void main() {
    GrassInstance instance = instances[gl_InstanceID];

    vec3 position = inPosition;

    // 应用缩放
    position *= instance.positionScale.w;

    // 风效果（顶部受影响更大）
    float windEffect = inTexCoord.y * inTexCoord.y;
    float windPhase = dot(instance.positionScale.xz, vec2(0.1)) + time * 2.0;

    vec3 windOffset = windDirection * sin(windPhase) * windStrength * windEffect;
    windOffset += windDirection * 0.1 * sin(windPhase * 3.0 + instance.color.a * 6.28)
                  * windEffect * instance.color.a;

    position += windOffset;

    // 应用旋转
    position = rotateByQuat(position, instance.rotation);

    // 应用位置
    position += instance.positionScale.xyz;

    vs_out.texCoord = inTexCoord;
    vs_out.color = instance.color.rgb;
    vs_out.ao = 1.0 - inTexCoord.y * 0.5;  // 底部较暗

    gl_Position = projection * view * vec4(position, 1.0);
}
```

### 草地片段着色器

```glsl
// 草地片段着色器 (grass.frag)
#version 450

in VS_OUT {
    vec2 texCoord;
    vec3 color;
    float ao;
} fs_in;

out vec4 fragColor;

uniform sampler2D grassTexture;
uniform vec3 lightDir;
uniform vec3 lightColor;

void main() {
    vec4 texColor = texture(grassTexture, fs_in.texCoord);

    // Alpha测试
    if (texColor.a < 0.5) {
        discard;
    }

    // 简单的次表面散射近似
    float subsurface = pow(max(dot(vec3(0, 1, 0), -lightDir), 0.0), 2.0) * 0.3;

    // 组合颜色
    vec3 finalColor = texColor.rgb * fs_in.color;
    finalColor *= fs_in.ao;
    finalColor += subsurface * vec3(0.2, 0.4, 0.1);
    finalColor *= lightColor;

    fragColor = vec4(finalColor, texColor.a);
}
```

---

## 树木实例化渲染

### 树木LOD系统

```cpp
class TreeSystem {
public:
    struct TreeInstance {
        glm::vec3 position;
        float rotation;
        float scale;
        int treeType;
    };

    struct TreeLOD {
        GLuint vao;
        GLuint indexCount;
        float maxDistance;
    };

    struct TreeType {
        std::vector<TreeLOD> lods;
        GLuint barkTexture;
        GLuint leafTexture;
    };

private:
    std::vector<TreeType> treeTypes;
    std::vector<TreeInstance> instances;

    GLuint instanceBuffer;

    // 按距离分组的实例
    std::vector<std::vector<TreeInstance>> lodGroups;

public:
    void initialize() {
        // 创建实例缓冲
        glGenBuffers(1, &instanceBuffer);

        // 加载不同类型的树
        loadTreeType("pine", {"pine_lod0.obj", "pine_lod1.obj", "pine_lod2.obj", "pine_billboard.obj"});
        loadTreeType("oak", {"oak_lod0.obj", "oak_lod1.obj", "oak_lod2.obj", "oak_billboard.obj"});
    }

    void generateForest(const Heightmap& heightmap, int count, float areaSize) {
        std::mt19937 rng(12345);
        std::uniform_real_distribution<float> posDist(0, areaSize);
        std::uniform_real_distribution<float> rotDist(0, 6.28318f);
        std::uniform_real_distribution<float> scaleDist(0.8f, 1.2f);
        std::uniform_int_distribution<int> typeDist(0, treeTypes.size() - 1);

        for (int i = 0; i < count; ++i) {
            float x = posDist(rng);
            float z = posDist(rng);

            // 获取地形高度和法线
            float u = x / areaSize;
            float v = z / areaSize;
            float y = heightmap.getHeightBilinear(u * heightmap.width, v * heightmap.height);
            glm::vec3 normal = heightmap.getNormal(u * heightmap.width, v * heightmap.height);

            // 陡峭处不种树
            if (normal.y < 0.85f) {
                continue;
            }

            TreeInstance tree;
            tree.position = glm::vec3(x, y, z);
            tree.rotation = rotDist(rng);
            tree.scale = scaleDist(rng);
            tree.treeType = typeDist(rng);

            instances.push_back(tree);
        }
    }

    void update(const glm::vec3& cameraPos) {
        // 按距离分组实例
        lodGroups.clear();
        lodGroups.resize(4);  // 4个LOD级别

        for (const auto& tree : instances) {
            float dist = glm::length(tree.position - cameraPos);

            int lodLevel;
            if (dist < 50.0f) lodLevel = 0;
            else if (dist < 100.0f) lodLevel = 1;
            else if (dist < 200.0f) lodLevel = 2;
            else if (dist < 500.0f) lodLevel = 3;
            else continue;  // 太远，不渲染

            lodGroups[lodLevel].push_back(tree);
        }
    }

    void render(Shader& shader, const glm::mat4& view, const glm::mat4& proj) {
        shader.use();
        shader.setMat4("view", view);
        shader.setMat4("projection", proj);

        for (int lod = 0; lod < 4; ++lod) {
            if (lodGroups[lod].empty()) continue;

            // 按树类型分组渲染
            std::map<int, std::vector<glm::mat4>> typeMatrices;

            for (const auto& tree : lodGroups[lod]) {
                glm::mat4 model = glm::mat4(1.0f);
                model = glm::translate(model, tree.position);
                model = glm::rotate(model, tree.rotation, glm::vec3(0, 1, 0));
                model = glm::scale(model, glm::vec3(tree.scale));

                typeMatrices[tree.treeType].push_back(model);
            }

            for (auto& [type, matrices] : typeMatrices) {
                // 更新实例缓冲
                glBindBuffer(GL_ARRAY_BUFFER, instanceBuffer);
                glBufferData(GL_ARRAY_BUFFER, matrices.size() * sizeof(glm::mat4),
                            matrices.data(), GL_DYNAMIC_DRAW);

                // 绑定纹理
                glActiveTexture(GL_TEXTURE0);
                glBindTexture(GL_TEXTURE_2D, treeTypes[type].barkTexture);
                glActiveTexture(GL_TEXTURE1);
                glBindTexture(GL_TEXTURE_2D, treeTypes[type].leafTexture);

                // 渲染该LOD级别
                const TreeLOD& treeLod = treeTypes[type].lods[lod];
                glBindVertexArray(treeLod.vao);
                glDrawElementsInstanced(GL_TRIANGLES, treeLod.indexCount,
                                       GL_UNSIGNED_INT, 0, matrices.size());
            }
        }
    }

private:
    void loadTreeType(const std::string& name, const std::vector<std::string>& lodFiles) {
        TreeType type;

        float distances[] = {50.0f, 100.0f, 200.0f, 500.0f};

        for (size_t i = 0; i < lodFiles.size(); ++i) {
            TreeLOD lod;
            // 加载网格...
            lod.maxDistance = distances[i];
            type.lods.push_back(lod);
        }

        // 加载纹理
        type.barkTexture = loadTexture(name + "_bark.png");
        type.leafTexture = loadTexture(name + "_leaf.png");

        treeTypes.push_back(type);
    }
};
```

### Billboard树木

远距离使用Billboard替代3D模型：

```glsl
// Billboard顶点着色器 (billboard.vert)
#version 450

layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec2 inTexCoord;
layout(location = 2) in mat4 instanceMatrix;

out VS_OUT {
    vec2 texCoord;
    float depth;
} vs_out;

uniform mat4 view;
uniform mat4 projection;

void main() {
    // 提取相机右向量和上向量
    vec3 cameraRight = vec3(view[0][0], view[1][0], view[2][0]);
    vec3 cameraUp = vec3(view[0][1], view[1][1], view[2][1]);

    // 提取实例位置和缩放
    vec3 instancePos = vec3(instanceMatrix[3]);
    float scale = length(vec3(instanceMatrix[0]));

    // Billboard顶点位置
    vec3 vertexPos = instancePos
                   + cameraRight * inPosition.x * scale
                   + cameraUp * inPosition.y * scale;

    vs_out.texCoord = inTexCoord;
    vs_out.depth = length(instancePos - inverse(view)[3].xyz);

    gl_Position = projection * view * vec4(vertexPos, 1.0);
}
```

### Impostor渲染

预渲染多角度视图用于远距离树木：

```cpp
class ImpostorSystem {
public:
    struct ImpostorAtlas {
        GLuint albedoTexture;
        GLuint normalTexture;
        int framesX;  // 水平方向帧数
        int framesY;  // 垂直方向帧数（仰角）
    };

    void generateImpostor(const Model& model, int framesX, int framesY, int resolution) {
        // 创建帧缓冲
        GLuint fbo;
        glGenFramebuffers(1, &fbo);
        glBindFramebuffer(GL_FRAMEBUFFER, fbo);

        int atlasWidth = resolution * framesX;
        int atlasHeight = resolution * framesY;

        // 创建纹理
        GLuint albedoTex, normalTex;
        glGenTextures(1, &albedoTex);
        glBindTexture(GL_TEXTURE_2D, albedoTex);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, atlasWidth, atlasHeight,
                    0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);

        glGenTextures(1, &normalTex);
        glBindTexture(GL_TEXTURE_2D, normalTex);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, atlasWidth, atlasHeight,
                    0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);

        glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                              GL_TEXTURE_2D, albedoTex, 0);
        glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT1,
                              GL_TEXTURE_2D, normalTex, 0);

        // 渲染每个角度
        for (int y = 0; y < framesY; ++y) {
            float pitch = glm::mix(-30.0f, 30.0f, float(y) / (framesY - 1));

            for (int x = 0; x < framesX; ++x) {
                float yaw = 360.0f * x / framesX;

                glViewport(x * resolution, y * resolution, resolution, resolution);

                // 设置相机
                glm::mat4 view = glm::mat4(1.0f);
                view = glm::rotate(view, glm::radians(pitch), glm::vec3(1, 0, 0));
                view = glm::rotate(view, glm::radians(yaw), glm::vec3(0, 1, 0));
                view = glm::translate(view, glm::vec3(0, 0, -5));

                glm::mat4 proj = glm::ortho(-1.5f, 1.5f, -1.5f, 1.5f, 0.1f, 100.0f);

                // 渲染模型
                renderModel(model, view, proj);
            }
        }

        glDeleteFramebuffers(1, &fbo);
    }

    void renderImpostor(const ImpostorAtlas& atlas, const glm::vec3& position,
                       const glm::vec3& cameraPos, Shader& shader) {
        // 计算相机到Impostor的方向
        glm::vec3 dir = glm::normalize(position - cameraPos);

        // 计算水平角度
        float yaw = atan2(dir.x, dir.z);
        int frameX = int((yaw / (2.0f * 3.14159f) + 0.5f) * atlas.framesX) % atlas.framesX;

        // 计算垂直角度
        float pitch = asin(dir.y);
        int frameY = int((pitch / 3.14159f + 0.5f) * atlas.framesY);
        frameY = glm::clamp(frameY, 0, atlas.framesY - 1);

        // 计算UV偏移
        glm::vec2 uvOffset(float(frameX) / atlas.framesX, float(frameY) / atlas.framesY);
        glm::vec2 uvScale(1.0f / atlas.framesX, 1.0f / atlas.framesY);

        shader.setVec2("uvOffset", uvOffset);
        shader.setVec2("uvScale", uvScale);

        // 渲染Billboard四边形
        renderBillboardQuad(position, cameraPos);
    }
};
```

---

## 天气系统

### 动态天气管理器

```cpp
class WeatherSystem {
public:
    enum class WeatherType {
        Clear,
        Cloudy,
        Rainy,
        Stormy,
        Snowy,
        Foggy
    };

    struct WeatherState {
        float cloudCoverage;      // 0-1 云量
        float precipitation;      // 0-1 降水强度
        float windSpeed;          // 风速
        glm::vec3 windDirection;
        float fogDensity;
        float temperature;
        glm::vec3 ambientColor;
        glm::vec3 sunColor;
        float sunIntensity;
    };

private:
    WeatherState currentState;
    WeatherState targetState;
    float transitionProgress;
    float transitionDuration;

    // 粒子系统
    GLuint rainParticleBuffer;
    GLuint snowParticleBuffer;
    int rainParticleCount;
    int snowParticleCount;

public:
    void setWeather(WeatherType type, float duration = 10.0f) {
        targetState = getStateForType(type);
        transitionDuration = duration;
        transitionProgress = 0.0f;
    }

    void update(float deltaTime) {
        // 平滑过渡
        if (transitionProgress < 1.0f) {
            transitionProgress += deltaTime / transitionDuration;
            transitionProgress = glm::min(transitionProgress, 1.0f);

            currentState = lerpState(currentState, targetState, transitionProgress);
        }

        // 更新降水粒子
        if (currentState.precipitation > 0.01f) {
            if (currentState.temperature > 0.0f) {
                updateRain(deltaTime);
            } else {
                updateSnow(deltaTime);
            }
        }
    }

    void render(const Camera& camera, Shader& precipitationShader) {
        if (currentState.precipitation < 0.01f) return;

        precipitationShader.use();
        precipitationShader.setMat4("view", camera.getViewMatrix());
        precipitationShader.setMat4("projection", camera.getProjectionMatrix());
        precipitationShader.setVec3("cameraPos", camera.getPosition());

        if (currentState.temperature > 0.0f) {
            renderRain(precipitationShader);
        } else {
            renderSnow(precipitationShader);
        }
    }

    const WeatherState& getState() const { return currentState; }

private:
    WeatherState getStateForType(WeatherType type) {
        WeatherState state;

        switch (type) {
            case WeatherType::Clear:
                state.cloudCoverage = 0.1f;
                state.precipitation = 0.0f;
                state.windSpeed = 2.0f;
                state.fogDensity = 0.0001f;
                state.temperature = 20.0f;
                state.ambientColor = glm::vec3(0.4f, 0.5f, 0.6f);
                state.sunColor = glm::vec3(1.0f, 0.95f, 0.8f);
                state.sunIntensity = 1.0f;
                break;

            case WeatherType::Cloudy:
                state.cloudCoverage = 0.7f;
                state.precipitation = 0.0f;
                state.windSpeed = 5.0f;
                state.fogDensity = 0.0005f;
                state.temperature = 15.0f;
                state.ambientColor = glm::vec3(0.5f, 0.5f, 0.55f);
                state.sunColor = glm::vec3(0.8f, 0.8f, 0.75f);
                state.sunIntensity = 0.5f;
                break;

            case WeatherType::Rainy:
                state.cloudCoverage = 0.95f;
                state.precipitation = 0.7f;
                state.windSpeed = 8.0f;
                state.fogDensity = 0.002f;
                state.temperature = 12.0f;
                state.ambientColor = glm::vec3(0.4f, 0.4f, 0.45f);
                state.sunColor = glm::vec3(0.6f, 0.6f, 0.6f);
                state.sunIntensity = 0.2f;
                break;

            case WeatherType::Stormy:
                state.cloudCoverage = 1.0f;
                state.precipitation = 1.0f;
                state.windSpeed = 15.0f;
                state.fogDensity = 0.003f;
                state.temperature = 10.0f;
                state.ambientColor = glm::vec3(0.3f, 0.3f, 0.35f);
                state.sunColor = glm::vec3(0.4f, 0.4f, 0.45f);
                state.sunIntensity = 0.1f;
                break;

            case WeatherType::Snowy:
                state.cloudCoverage = 0.8f;
                state.precipitation = 0.5f;
                state.windSpeed = 3.0f;
                state.fogDensity = 0.001f;
                state.temperature = -5.0f;
                state.ambientColor = glm::vec3(0.6f, 0.65f, 0.7f);
                state.sunColor = glm::vec3(0.9f, 0.9f, 0.95f);
                state.sunIntensity = 0.4f;
                break;

            case WeatherType::Foggy:
                state.cloudCoverage = 0.5f;
                state.precipitation = 0.0f;
                state.windSpeed = 1.0f;
                state.fogDensity = 0.01f;
                state.temperature = 10.0f;
                state.ambientColor = glm::vec3(0.6f, 0.6f, 0.6f);
                state.sunColor = glm::vec3(0.7f, 0.7f, 0.65f);
                state.sunIntensity = 0.3f;
                break;
        }

        state.windDirection = glm::normalize(glm::vec3(1.0f, 0.0f, 0.5f));
        return state;
    }

    WeatherState lerpState(const WeatherState& a, const WeatherState& b, float t) {
        WeatherState result;
        result.cloudCoverage = glm::mix(a.cloudCoverage, b.cloudCoverage, t);
        result.precipitation = glm::mix(a.precipitation, b.precipitation, t);
        result.windSpeed = glm::mix(a.windSpeed, b.windSpeed, t);
        result.windDirection = glm::normalize(glm::mix(a.windDirection, b.windDirection, t));
        result.fogDensity = glm::mix(a.fogDensity, b.fogDensity, t);
        result.temperature = glm::mix(a.temperature, b.temperature, t);
        result.ambientColor = glm::mix(a.ambientColor, b.ambientColor, t);
        result.sunColor = glm::mix(a.sunColor, b.sunColor, t);
        result.sunIntensity = glm::mix(a.sunIntensity, b.sunIntensity, t);
        return result;
    }

    void updateRain(float deltaTime);
    void updateSnow(float deltaTime);
    void renderRain(Shader& shader);
    void renderSnow(Shader& shader);
};
```

### 雨水粒子着色器

```glsl
// 雨滴顶点着色器 (rain.vert)
#version 450

layout(location = 0) in vec3 inPosition;  // 粒子位置
layout(location = 1) in float inLife;     // 生命周期

out VS_OUT {
    float life;
    float stretch;
} vs_out;

uniform mat4 view;
uniform mat4 projection;
uniform vec3 cameraPos;
uniform float time;
uniform vec3 windDirection;
uniform float windSpeed;
uniform float rainSpeed;

void main() {
    vec3 position = inPosition;

    // 基于时间和生命周期计算位置
    float t = mod(time + inLife * 10.0, 10.0);
    position.y -= t * rainSpeed;
    position.xz += windDirection.xz * windSpeed * t * 0.1;

    // 重置到顶部
    if (position.y < 0.0) {
        position.y += 100.0;
    }

    // 相对于相机位置
    position += cameraPos;
    position.y = mod(position.y, 100.0);

    vs_out.life = inLife;
    vs_out.stretch = rainSpeed * 0.1;  // 运动模糊拉伸量

    gl_Position = projection * view * vec4(position, 1.0);
}

// 雨滴几何着色器 (rain.geom)
#version 450

layout(points) in;
layout(line_strip, max_vertices = 2) out;

in VS_OUT {
    float life;
    float stretch;
} gs_in[];

out GS_OUT {
    float alpha;
} gs_out;

uniform mat4 projection;
uniform mat4 view;

void main() {
    vec4 pos = gl_in[0].gl_Position;

    // 起点
    gs_out.alpha = 0.3;
    gl_Position = pos;
    EmitVertex();

    // 拉伸终点（向下）
    gs_out.alpha = 0.0;
    pos.y -= gs_in[0].stretch;
    gl_Position = pos;
    EmitVertex();

    EndPrimitive();
}

// 雨滴片段着色器 (rain.frag)
#version 450

in GS_OUT {
    float alpha;
} fs_in;

out vec4 fragColor;

void main() {
    fragColor = vec4(0.7, 0.8, 0.9, fs_in.alpha);
}
```

---

## 大气散射

### 单次散射大气模型

```glsl
// 大气散射着色器 (atmosphere.frag)
#version 450

in vec3 worldPos;
out vec4 fragColor;

uniform vec3 cameraPos;
uniform vec3 sunDirection;
uniform float planetRadius;       // 6371000.0 (地球)
uniform float atmosphereRadius;   // 6471000.0
uniform vec3 rayleighCoeff;       // vec3(5.5e-6, 13.0e-6, 22.4e-6)
uniform float mieCoeff;           // 21e-6
uniform float rayleighScale;      // 8000.0
uniform float mieScale;           // 1200.0
uniform float mieG;               // 0.758 (Mie散射不对称因子)
uniform int numSamples;           // 16
uniform int numLightSamples;      // 8

// Rayleigh相位函数
float rayleighPhase(float cosTheta) {
    return 3.0 / (16.0 * 3.14159) * (1.0 + cosTheta * cosTheta);
}

// Mie相位函数 (Henyey-Greenstein)
float miePhase(float cosTheta, float g) {
    float g2 = g * g;
    return 3.0 / (8.0 * 3.14159) * ((1.0 - g2) * (1.0 + cosTheta * cosTheta)) /
           ((2.0 + g2) * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
}

// 射线与球体相交
vec2 raySphereIntersect(vec3 rayOrigin, vec3 rayDir, float radius) {
    float a = dot(rayDir, rayDir);
    float b = 2.0 * dot(rayDir, rayOrigin);
    float c = dot(rayOrigin, rayOrigin) - radius * radius;
    float d = b * b - 4.0 * a * c;

    if (d < 0.0) return vec2(-1.0);

    d = sqrt(d);
    return vec2(-b - d, -b + d) / (2.0 * a);
}

// 计算光学深度
float opticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength, float scaleHeight) {
    float sampleLength = rayLength / float(numLightSamples);
    float opticalDepth = 0.0;

    for (int i = 0; i < numLightSamples; i++) {
        vec3 samplePoint = rayOrigin + rayDir * (float(i) + 0.5) * sampleLength;
        float height = length(samplePoint) - planetRadius;
        opticalDepth += exp(-height / scaleHeight) * sampleLength;
    }

    return opticalDepth;
}

void main() {
    vec3 rayOrigin = cameraPos + vec3(0, planetRadius, 0);
    vec3 rayDir = normalize(worldPos - cameraPos);

    // 计算与大气层的交点
    vec2 atmosphereIntersect = raySphereIntersect(rayOrigin, rayDir, atmosphereRadius);

    if (atmosphereIntersect.x > atmosphereIntersect.y) {
        fragColor = vec4(0.0);
        return;
    }

    // 计算与地面的交点
    vec2 planetIntersect = raySphereIntersect(rayOrigin, rayDir, planetRadius);

    float rayStart = max(atmosphereIntersect.x, 0.0);
    float rayEnd = planetIntersect.x > 0.0 ? planetIntersect.x : atmosphereIntersect.y;
    float rayLength = rayEnd - rayStart;

    float sampleLength = rayLength / float(numSamples);

    vec3 rayleighScatter = vec3(0.0);
    vec3 mieScatter = vec3(0.0);
    float rayleighOpticalDepth = 0.0;
    float mieOpticalDepth = 0.0;

    for (int i = 0; i < numSamples; i++) {
        vec3 samplePoint = rayOrigin + rayDir * (rayStart + (float(i) + 0.5) * sampleLength);
        float height = length(samplePoint) - planetRadius;

        // 当前采样点的密度
        float rayleighDensity = exp(-height / rayleighScale) * sampleLength;
        float mieDensity = exp(-height / mieScale) * sampleLength;

        rayleighOpticalDepth += rayleighDensity;
        mieOpticalDepth += mieDensity;

        // 计算到太阳的光学深度
        vec2 sunIntersect = raySphereIntersect(samplePoint, -sunDirection, atmosphereRadius);
        float sunRayLength = sunIntersect.y;

        float sunRayleighOpticalDepth = opticalDepth(samplePoint, -sunDirection,
                                                     sunRayLength, rayleighScale);
        float sunMieOpticalDepth = opticalDepth(samplePoint, -sunDirection,
                                               sunRayLength, mieScale);

        // 透射率
        vec3 tau = rayleighCoeff * (rayleighOpticalDepth + sunRayleighOpticalDepth) +
                   mieCoeff * 1.1 * (mieOpticalDepth + sunMieOpticalDepth);
        vec3 transmittance = exp(-tau);

        rayleighScatter += rayleighDensity * transmittance;
        mieScatter += mieDensity * transmittance;
    }

    // 相位函数
    float cosTheta = dot(rayDir, -sunDirection);
    float rayleighP = rayleighPhase(cosTheta);
    float mieP = miePhase(cosTheta, mieG);

    // 最终颜色
    vec3 color = (rayleighScatter * rayleighCoeff * rayleighP +
                  mieScatter * mieCoeff * mieP) * 20.0;

    // 太阳圆盘
    float sunAngle = acos(cosTheta);
    float sunRadius = 0.0093;  // 太阳角半径
    if (sunAngle < sunRadius) {
        float sunIntensity = smoothstep(sunRadius, sunRadius * 0.9, sunAngle);
        color += vec3(1.0, 0.9, 0.7) * sunIntensity * 5.0;
    }

    // HDR色调映射
    color = 1.0 - exp(-color);

    fragColor = vec4(color, 1.0);
}
```

### 体积云渲染

```glsl
// 体积云着色器 (volumetric_clouds.frag)
#version 450

in vec2 texCoord;
out vec4 fragColor;

uniform sampler3D cloudNoiseTexture;
uniform sampler3D cloudDetailTexture;
uniform sampler2D weatherMap;
uniform sampler2D blueNoiseTexture;

uniform vec3 cameraPos;
uniform mat4 invViewProj;
uniform vec3 sunDirection;
uniform vec3 sunColor;
uniform float time;

uniform float cloudMinHeight;     // 1500.0
uniform float cloudMaxHeight;     // 4000.0
uniform float cloudCoverage;      // 0.5
uniform float cloudDensity;       // 0.1
uniform vec3 windDirection;
uniform float windSpeed;

const int MAX_STEPS = 64;
const int LIGHT_STEPS = 6;
const float EARTH_RADIUS = 6371000.0;

// 从屏幕坐标重建世界射线
vec3 getWorldRay() {
    vec4 clipPos = vec4(texCoord * 2.0 - 1.0, 1.0, 1.0);
    vec4 worldPos = invViewProj * clipPos;
    return normalize(worldPos.xyz / worldPos.w - cameraPos);
}

// 高度重映射
float remap(float value, float oldMin, float oldMax, float newMin, float newMax) {
    return newMin + (value - oldMin) / (oldMax - oldMin) * (newMax - newMin);
}

// 云密度采样
float sampleCloudDensity(vec3 pos, bool cheap) {
    // 高度梯度
    float heightFraction = (pos.y - cloudMinHeight) / (cloudMaxHeight - cloudMinHeight);
    heightFraction = clamp(heightFraction, 0.0, 1.0);

    // 天气图采样
    vec2 weatherUV = pos.xz * 0.00002 + time * windSpeed * windDirection.xz * 0.0001;
    vec4 weather = texture(weatherMap, weatherUV);

    // 高度梯度衰减
    float heightGradient = smoothstep(0.0, 0.1, heightFraction) *
                          smoothstep(1.0, 0.8, heightFraction);

    // 基础云密度
    vec3 noiseUV = pos * 0.0003 + time * windSpeed * windDirection * 0.01;
    float baseNoise = texture(cloudNoiseTexture, noiseUV).r;

    float baseDensity = remap(baseNoise, 1.0 - cloudCoverage - weather.r, 1.0, 0.0, 1.0);
    baseDensity *= heightGradient;
    baseDensity *= cloudDensity;

    if (cheap || baseDensity <= 0.0) {
        return max(baseDensity, 0.0);
    }

    // 细节噪声
    vec3 detailUV = pos * 0.001;
    float detailNoise = texture(cloudDetailTexture, detailUV).r;

    float detailModifier = 0.35 * exp(-cloudCoverage * 0.75);
    baseDensity -= detailNoise * detailModifier;

    return max(baseDensity, 0.0);
}

// 光线步进计算光照
float lightMarch(vec3 pos) {
    vec3 lightDir = -sunDirection;
    float stepSize = (cloudMaxHeight - pos.y) / float(LIGHT_STEPS) / max(lightDir.y, 0.1);

    float totalDensity = 0.0;
    for (int i = 0; i < LIGHT_STEPS; i++) {
        pos += lightDir * stepSize;
        totalDensity += sampleCloudDensity(pos, true) * stepSize;
    }

    float transmittance = exp(-totalDensity * 0.5);

    // Henyey-Greenstein相位函数
    float cosAngle = dot(normalize(pos - cameraPos), lightDir);
    float hg = 0.5 * (1.0 - 0.5 * 0.5) / pow(1.0 + 0.5 * 0.5 - 2.0 * 0.5 * cosAngle, 1.5);

    return transmittance * hg;
}

void main() {
    vec3 rayDir = getWorldRay();

    // 计算与云层的交点
    float tMin = (cloudMinHeight - cameraPos.y) / rayDir.y;
    float tMax = (cloudMaxHeight - cameraPos.y) / rayDir.y;

    if (tMin > tMax) {
        float temp = tMin;
        tMin = tMax;
        tMax = temp;
    }

    if (tMax < 0.0) {
        fragColor = vec4(0.0);
        return;
    }

    tMin = max(tMin, 0.0);

    // 蓝噪声抖动
    float blueNoise = texture(blueNoiseTexture, texCoord * 4.0).r;
    float stepSize = (tMax - tMin) / float(MAX_STEPS);
    float t = tMin + blueNoise * stepSize;

    vec3 color = vec3(0.0);
    float transmittance = 1.0;

    for (int i = 0; i < MAX_STEPS && transmittance > 0.01; i++) {
        vec3 pos = cameraPos + rayDir * t;

        float density = sampleCloudDensity(pos, false);

        if (density > 0.0) {
            float lightEnergy = lightMarch(pos);

            // 环境光散射
            vec3 ambient = vec3(0.5, 0.6, 0.7) * 0.3;
            vec3 radiance = sunColor * lightEnergy + ambient;

            // 啤酒定律衰减
            float sampleTransmittance = exp(-density * stepSize);

            color += radiance * density * transmittance * stepSize;
            transmittance *= sampleTransmittance;
        }

        t += stepSize;
    }

    fragColor = vec4(color, 1.0 - transmittance);
}
```

---

## 水体渲染

### 水面顶点动画

```glsl
// 水面顶点着色器 (water.vert)
#version 450

layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec2 inTexCoord;

out VS_OUT {
    vec3 worldPos;
    vec4 clipPos;
    vec2 texCoord;
    vec3 normal;
} vs_out;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform float time;

// Gerstner波参数
struct GerstnerWave {
    vec2 direction;
    float steepness;
    float wavelength;
    float speed;
};

uniform GerstnerWave waves[4];

vec3 gerstnerWave(vec2 pos, float t, GerstnerWave wave, inout vec3 tangent, inout vec3 binormal) {
    float k = 2.0 * 3.14159 / wave.wavelength;
    float c = sqrt(9.8 / k);
    vec2 d = normalize(wave.direction);
    float f = k * (dot(d, pos) - c * wave.speed * t);
    float a = wave.steepness / k;

    tangent += vec3(
        -d.x * d.x * wave.steepness * sin(f),
        d.x * wave.steepness * cos(f),
        -d.x * d.y * wave.steepness * sin(f)
    );

    binormal += vec3(
        -d.x * d.y * wave.steepness * sin(f),
        d.y * wave.steepness * cos(f),
        -d.y * d.y * wave.steepness * sin(f)
    );

    return vec3(
        d.x * a * cos(f),
        a * sin(f),
        d.y * a * cos(f)
    );
}

void main() {
    vec3 pos = inPosition;
    vec3 tangent = vec3(1, 0, 0);
    vec3 binormal = vec3(0, 0, 1);

    // 叠加多个Gerstner波
    for (int i = 0; i < 4; i++) {
        pos += gerstnerWave(inPosition.xz, time, waves[i], tangent, binormal);
    }

    vs_out.normal = normalize(cross(binormal, tangent));
    vs_out.worldPos = (model * vec4(pos, 1.0)).xyz;
    vs_out.texCoord = inTexCoord;
    vs_out.clipPos = projection * view * vec4(vs_out.worldPos, 1.0);

    gl_Position = vs_out.clipPos;
}
```

### 水面片段着色器

```glsl
// 水面片段着色器 (water.frag)
#version 450

in VS_OUT {
    vec3 worldPos;
    vec4 clipPos;
    vec2 texCoord;
    vec3 normal;
} fs_in;

out vec4 fragColor;

uniform sampler2D reflectionTexture;
uniform sampler2D refractionTexture;
uniform sampler2D depthTexture;
uniform sampler2D normalMap;
uniform sampler2D foamTexture;

uniform vec3 cameraPos;
uniform vec3 sunDirection;
uniform vec3 sunColor;
uniform vec3 waterColor;
uniform float time;
uniform float nearPlane;
uniform float farPlane;

// Fresnel Schlick近似
float fresnelSchlick(float cosTheta, float F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

// 线性化深度
float linearizeDepth(float depth) {
    float z = depth * 2.0 - 1.0;
    return (2.0 * nearPlane * farPlane) / (farPlane + nearPlane - z * (farPlane - nearPlane));
}

void main() {
    // 屏幕空间UV
    vec2 screenUV = (fs_in.clipPos.xy / fs_in.clipPos.w) * 0.5 + 0.5;

    // 法线贴图
    vec2 normalUV1 = fs_in.texCoord * 4.0 + time * 0.02;
    vec2 normalUV2 = fs_in.texCoord * 8.0 - time * 0.01;
    vec3 normalMap1 = texture(normalMap, normalUV1).rgb * 2.0 - 1.0;
    vec3 normalMap2 = texture(normalMap, normalUV2).rgb * 2.0 - 1.0;

    vec3 normalDetail = normalize(normalMap1 + normalMap2);

    // 组合几何法线和细节法线
    vec3 normal = normalize(fs_in.normal + normalDetail * 0.3);

    // 扰动UV用于折射
    vec2 distortion = normal.xz * 0.03;
    vec2 refractUV = screenUV + distortion;
    vec2 reflectUV = vec2(screenUV.x, 1.0 - screenUV.y) + distortion;

    // 采样深度计算水深
    float sceneDepth = linearizeDepth(texture(depthTexture, screenUV).r);
    float waterDepth = linearizeDepth(gl_FragCoord.z);
    float depthDifference = sceneDepth - waterDepth;

    // 确保不采样水面以上的内容
    if (depthDifference < 0.0) {
        refractUV = screenUV;
    }

    // 折射
    vec3 refraction = texture(refractionTexture, refractUV).rgb;

    // 基于深度着色折射
    float depthFactor = clamp(depthDifference * 0.1, 0.0, 1.0);
    refraction = mix(refraction, waterColor, depthFactor * 0.8);

    // 反射
    vec3 reflection = texture(reflectionTexture, reflectUV).rgb;

    // 视角方向
    vec3 viewDir = normalize(cameraPos - fs_in.worldPos);

    // Fresnel
    float fresnel = fresnelSchlick(max(dot(viewDir, normal), 0.0), 0.02);

    // 混合反射和折射
    vec3 color = mix(refraction, reflection, fresnel);

    // 高光
    vec3 halfDir = normalize(viewDir - sunDirection);
    float spec = pow(max(dot(normal, halfDir), 0.0), 256.0);
    color += sunColor * spec * 0.5;

    // 泡沫
    float foamFactor = smoothstep(0.5, 0.0, depthDifference);
    vec3 foam = texture(foamTexture, fs_in.texCoord * 10.0 + time * 0.05).rgb;
    color = mix(color, foam, foamFactor * 0.5);

    // 边缘泡沫
    float edgeFoam = smoothstep(0.1, 0.0, depthDifference);
    color = mix(color, vec3(1.0), edgeFoam);

    fragColor = vec4(color, 1.0);
}
```

### 水下焦散效果

```glsl
// 焦散计算 (caustics.frag)
#version 450

uniform sampler2D causticTexture;
uniform vec3 lightDir;
uniform float time;

vec3 sampleCaustics(vec3 worldPos, vec3 normal) {
    // 投影到水平面
    vec3 projectedPos = worldPos - lightDir * (worldPos.y / lightDir.y);

    // 双层UV动画
    vec2 uv1 = projectedPos.xz * 0.1 + time * 0.05;
    vec2 uv2 = projectedPos.xz * 0.1 - time * 0.03;
    uv2 = vec2(uv2.y, uv2.x);  // 旋转90度

    vec3 caustic1 = texture(causticTexture, uv1).rgb;
    vec3 caustic2 = texture(causticTexture, uv2).rgb;

    // 使用min混合产生更真实的焦散图案
    vec3 caustics = min(caustic1, caustic2);

    // 基于法线朝向衰减
    float NdotL = max(dot(normal, -lightDir), 0.0);

    return caustics * NdotL * 2.0;
}
```

---

## 性能优化技巧

### 地形遮挡剔除

```cpp
class TerrainOcclusionCulling {
public:
    // 软件光栅化深度缓冲用于遮挡查询
    std::vector<float> depthBuffer;
    int bufferWidth;
    int bufferHeight;

    void rasterizeOccluders(const std::vector<TerrainChunk>& chunks,
                           const Camera& camera) {
        // 清空深度缓冲
        std::fill(depthBuffer.begin(), depthBuffer.end(), 1.0f);

        glm::mat4 viewProj = camera.getProjectionMatrix() * camera.getViewMatrix();

        // 光栅化地形块的简化包围盒
        for (const auto& chunk : chunks) {
            rasterizeAABB(chunk.minBounds, chunk.maxBounds, viewProj);
        }
    }

    bool isVisible(const glm::vec3& minBounds, const glm::vec3& maxBounds,
                  const Camera& camera) {
        glm::mat4 viewProj = camera.getProjectionMatrix() * camera.getViewMatrix();

        // 获取包围盒的8个角点
        glm::vec3 corners[8] = {
            glm::vec3(minBounds.x, minBounds.y, minBounds.z),
            glm::vec3(maxBounds.x, minBounds.y, minBounds.z),
            glm::vec3(minBounds.x, maxBounds.y, minBounds.z),
            glm::vec3(maxBounds.x, maxBounds.y, minBounds.z),
            glm::vec3(minBounds.x, minBounds.y, maxBounds.z),
            glm::vec3(maxBounds.x, minBounds.y, maxBounds.z),
            glm::vec3(minBounds.x, maxBounds.y, maxBounds.z),
            glm::vec3(maxBounds.x, maxBounds.y, maxBounds.z)
        };

        // 检查是否有任何角点可见
        for (const auto& corner : corners) {
            glm::vec4 clipPos = viewProj * glm::vec4(corner, 1.0f);

            if (clipPos.w <= 0) continue;

            glm::vec3 ndc = glm::vec3(clipPos) / clipPos.w;

            if (ndc.x < -1 || ndc.x > 1 || ndc.y < -1 || ndc.y > 1) continue;

            int x = int((ndc.x * 0.5f + 0.5f) * bufferWidth);
            int y = int((ndc.y * 0.5f + 0.5f) * bufferHeight);

            x = std::clamp(x, 0, bufferWidth - 1);
            y = std::clamp(y, 0, bufferHeight - 1);

            float depth = ndc.z * 0.5f + 0.5f;

            if (depth <= depthBuffer[y * bufferWidth + x]) {
                return true;  // 至少有一个角点可见
            }
        }

        return false;
    }

private:
    void rasterizeAABB(const glm::vec3& minBounds, const glm::vec3& maxBounds,
                      const glm::mat4& viewProj) {
        // 简化的AABB光栅化
        // ... 实现细节
    }
};
```

### 虚拟纹理

```cpp
class VirtualTexture {
public:
    struct PageTableEntry {
        uint16_t physicalX;
        uint16_t physicalY;
        uint8_t mipLevel;
        bool valid;
    };

    struct TileRequest {
        int virtualX;
        int virtualY;
        int mipLevel;
        float priority;
    };

private:
    GLuint pageTableTexture;
    GLuint physicalTexture;

    int pageTableSize;
    int physicalTextureSize;
    int tileSize;

    std::vector<PageTableEntry> pageTable;
    std::queue<TileRequest> requestQueue;
    std::unordered_set<uint64_t> loadedTiles;

public:
    void initialize(int virtualSize, int physicalSize, int tileSz) {
        tileSize = tileSz;
        pageTableSize = virtualSize / tileSize;
        physicalTextureSize = physicalSize;

        // 创建页表纹理
        glGenTextures(1, &pageTableTexture);
        glBindTexture(GL_TEXTURE_2D, pageTableTexture);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, pageTableSize, pageTableSize,
                    0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);

        // 创建物理纹理（纹理图集）
        glGenTextures(1, &physicalTexture);
        glBindTexture(GL_TEXTURE_2D, physicalTexture);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, physicalTextureSize, physicalTextureSize,
                    0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);

        pageTable.resize(pageTableSize * pageTableSize);
    }

    void requestTile(int virtualX, int virtualY, int mipLevel, float priority) {
        uint64_t key = (uint64_t(mipLevel) << 32) | (uint64_t(virtualY) << 16) | virtualX;

        if (loadedTiles.find(key) == loadedTiles.end()) {
            requestQueue.push({virtualX, virtualY, mipLevel, priority});
        }
    }

    void update() {
        // 每帧处理一定数量的请求
        int processed = 0;
        while (!requestQueue.empty() && processed < 4) {
            TileRequest request = requestQueue.front();
            requestQueue.pop();

            loadTile(request.virtualX, request.virtualY, request.mipLevel);
            processed++;
        }
    }

    void bind(Shader& shader) {
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, pageTableTexture);
        shader.setInt("pageTable", 0);

        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, physicalTexture);
        shader.setInt("physicalTexture", 1);

        shader.setInt("pageTableSize", pageTableSize);
        shader.setInt("tileSize", tileSize);
    }

private:
    void loadTile(int virtualX, int virtualY, int mipLevel) {
        // 分配物理纹理空间
        int physicalX, physicalY;
        allocatePhysicalTile(physicalX, physicalY);

        // 加载纹理数据
        std::vector<uint8_t> tileData = loadTileData(virtualX, virtualY, mipLevel);

        // 上传到物理纹理
        glBindTexture(GL_TEXTURE_2D, physicalTexture);
        glTexSubImage2D(GL_TEXTURE_2D, 0, physicalX * tileSize, physicalY * tileSize,
                       tileSize, tileSize, GL_RGBA, GL_UNSIGNED_BYTE, tileData.data());

        // 更新页表
        int index = virtualY * pageTableSize + virtualX;
        pageTable[index].physicalX = physicalX;
        pageTable[index].physicalY = physicalY;
        pageTable[index].mipLevel = mipLevel;
        pageTable[index].valid = true;

        // 更新页表纹理
        uint8_t pageData[4] = {
            uint8_t(physicalX),
            uint8_t(physicalY),
            uint8_t(mipLevel),
            255  // valid
        };

        glBindTexture(GL_TEXTURE_2D, pageTableTexture);
        glTexSubImage2D(GL_TEXTURE_2D, 0, virtualX, virtualY, 1, 1,
                       GL_RGBA, GL_UNSIGNED_BYTE, pageData);

        uint64_t key = (uint64_t(mipLevel) << 32) | (uint64_t(virtualY) << 16) | virtualX;
        loadedTiles.insert(key);
    }

    void allocatePhysicalTile(int& x, int& y) {
        // 简单的线性分配，实际应使用LRU缓存
        static int nextX = 0;
        static int nextY = 0;

        x = nextX;
        y = nextY;

        nextX++;
        if (nextX >= physicalTextureSize / tileSize) {
            nextX = 0;
            nextY++;
        }
    }

    std::vector<uint8_t> loadTileData(int virtualX, int virtualY, int mipLevel) {
        // 从磁盘加载纹理数据
        std::vector<uint8_t> data(tileSize * tileSize * 4);
        // ... 加载逻辑
        return data;
    }
};
```

### 虚拟纹理着色器

```glsl
// 虚拟纹理采样 (virtual_texture.glsl)
uniform sampler2D pageTable;
uniform sampler2D physicalTexture;
uniform int pageTableSize;
uniform int tileSize;

vec4 sampleVirtualTexture(vec2 uv) {
    // 计算虚拟纹理坐标
    vec2 virtualCoord = uv * float(pageTableSize);
    ivec2 pageCoord = ivec2(floor(virtualCoord));
    vec2 inPageCoord = fract(virtualCoord);

    // 查询页表
    vec4 pageEntry = texelFetch(pageTable, pageCoord, 0);

    if (pageEntry.a < 0.5) {
        // 页面未加载，返回fallback颜色
        return vec4(0.5, 0.5, 0.5, 1.0);
    }

    // 计算物理纹理坐标
    vec2 physicalCoord = (vec2(pageEntry.xy) + inPageCoord) * float(tileSize) /
                         float(textureSize(physicalTexture, 0).x);

    return texture(physicalTexture, physicalCoord);
}
```

---

## 总结

本文详细介绍了现代游戏中地形渲染的核心技术：

1. **高度图地形**：基础的地形表示方法，支持程序化生成和高效存储
2. **LOD系统**：Chunked LOD和GPU Tessellation两种方案，平衡质量与性能
3. **纹理混合**：Splatmap、三平面投影和基于坡度的自动混合
4. **植被渲染**：GPU实例化草地和树木LOD系统
5. **天气系统**：动态天气状态转换和降水效果
6. **大气散射**：物理正确的天空渲染和体积云
7. **水体渲染**：Gerstner波动画、反射折射和焦散效果

这些技术组合使用，可以创建出令人信服的大规模户外场景。在实际项目中，需要根据目标平台和性能预算进行适当的取舍和优化。

### 参考资源

- GPU Gems系列关于地形渲染的章节
- "Real-Time Rendering"第四版
- Unreal Engine和Unity的地形系统文档
- SIGGRAPH关于大气散射和体积云的演讲
