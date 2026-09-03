---
title: Terrain Systems and Rendering Techniques
description: "Build large-scale game terrains: heightmaps, terrain rendering, and vegetation systems"
track: gamedev
section: graphics
difficulty: advanced
tags:
  - terrain
  - rendering
  - heightmap
  - vegetation
status: imported
origin: old/src/content/docs/gamedev/terrain-rendering.en.md
divergence: 0.197
issues: []
legacy:
  category: GameDev
  subcategory: 3D
  order: 32
  lastUpdated: 2026-01-07
---

Terrain rendering is one of the most fundamental yet complex aspects of 3D game development. From vast open worlds to detailed landscapes, effective terrain systems combine multiple techniques including heightmap-based geometry, level-of-detail management, texture splatting, vegetation rendering, and atmospheric effects. We cover the essential concepts and implementation details for building production-quality terrain systems.

## Core Concepts

### What is Terrain Rendering?

Terrain rendering encompasses the techniques used to display large-scale outdoor environments in real-time applications. Unlike regular 3D models, terrain presents unique challenges:

1. **Scale**: Terrain can span kilometers while requiring centimeter-level detail
2. **Memory**: Raw terrain data can consume gigabytes of memory
3. **Performance**: Rendering millions of triangles at interactive framerates
4. **Visual Quality**: Creating believable, natural-looking landscapes

### Historical Evolution

| Era | Technique | Key Features |
|-----|-----------|--------------|
| 1990s | Simple heightmaps | Fixed resolution, no LOD |
| Early 2000s | ROAM, geomipmapping | Dynamic tessellation |
| Late 2000s | GPU-based clipmaps | Virtual texturing |
| 2010s | Tessellation shaders | Hardware-accelerated detail |
| 2020s | Nanite-style virtualized geometry | Automatic LOD, streaming |

---

## Heightmap Terrain

### Understanding Heightmaps

A heightmap is a grayscale image where each pixel's brightness represents the elevation at that point. This simple representation allows efficient storage and manipulation of terrain geometry.

```cpp
// Heightmap terrain structure
struct HeightmapTerrain {
    std::vector<float> heightData;
    int width;
    int height;
    float heightScale;
    float horizontalScale;

    float getHeight(int x, int z) const {
        if (x < 0 || x >= width || z < 0 || z >= height) {
            return 0.0f;
        }
        return heightData[z * width + x] * heightScale;
    }

    glm::vec3 getWorldPosition(int x, int z) const {
        return glm::vec3(
            x * horizontalScale,
            getHeight(x, z),
            z * horizontalScale
        );
    }
};
```

### Loading and Parsing Heightmaps

```cpp
#include <stb_image.h>

class HeightmapLoader {
public:
    static HeightmapTerrain load(const std::string& path,
                                  float heightScale = 100.0f,
                                  float horizontalScale = 1.0f) {
        HeightmapTerrain terrain;

        int channels;
        unsigned char* data = stbi_load(path.c_str(),
                                         &terrain.width,
                                         &terrain.height,
                                         &channels,
                                         STBI_grey);

        if (!data) {
            throw std::runtime_error("Failed to load heightmap: " + path);
        }

        terrain.heightScale = heightScale;
        terrain.horizontalScale = horizontalScale;
        terrain.heightData.resize(terrain.width * terrain.height);

        // Normalize height values to 0-1 range
        for (int i = 0; i < terrain.width * terrain.height; i++) {
            terrain.heightData[i] = data[i] / 255.0f;
        }

        stbi_image_free(data);
        return terrain;
    }

    // 16-bit heightmap for higher precision
    static HeightmapTerrain load16Bit(const std::string& path,
                                       float heightScale = 100.0f) {
        HeightmapTerrain terrain;

        // Load as 16-bit PNG using custom loader or library
        std::vector<uint16_t> rawData = loadPNG16(path,
                                                   terrain.width,
                                                   terrain.height);

        terrain.heightScale = heightScale;
        terrain.heightData.resize(terrain.width * terrain.height);

        for (size_t i = 0; i < rawData.size(); i++) {
            terrain.heightData[i] = rawData[i] / 65535.0f;
        }

        return terrain;
    }
};
```

### Mesh Generation from Heightmap

```cpp
class TerrainMeshGenerator {
public:
    struct Vertex {
        glm::vec3 position;
        glm::vec3 normal;
        glm::vec2 texCoord;
    };

    static void generateMesh(const HeightmapTerrain& terrain,
                             std::vector<Vertex>& vertices,
                             std::vector<uint32_t>& indices) {
        vertices.clear();
        indices.clear();

        // Generate vertices
        for (int z = 0; z < terrain.height; z++) {
            for (int x = 0; x < terrain.width; x++) {
                Vertex v;
                v.position = terrain.getWorldPosition(x, z);
                v.texCoord = glm::vec2(
                    static_cast<float>(x) / terrain.width,
                    static_cast<float>(z) / terrain.height
                );
                v.normal = calculateNormal(terrain, x, z);
                vertices.push_back(v);
            }
        }

        // Generate indices for triangle strips
        for (int z = 0; z < terrain.height - 1; z++) {
            for (int x = 0; x < terrain.width - 1; x++) {
                int topLeft = z * terrain.width + x;
                int topRight = topLeft + 1;
                int bottomLeft = (z + 1) * terrain.width + x;
                int bottomRight = bottomLeft + 1;

                // First triangle
                indices.push_back(topLeft);
                indices.push_back(bottomLeft);
                indices.push_back(topRight);

                // Second triangle
                indices.push_back(topRight);
                indices.push_back(bottomLeft);
                indices.push_back(bottomRight);
            }
        }
    }

private:
    static glm::vec3 calculateNormal(const HeightmapTerrain& terrain,
                                      int x, int z) {
        // Use central difference for normal calculation
        float hL = terrain.getHeight(x - 1, z);
        float hR = terrain.getHeight(x + 1, z);
        float hD = terrain.getHeight(x, z - 1);
        float hU = terrain.getHeight(x, z + 1);

        glm::vec3 normal(
            hL - hR,
            2.0f * terrain.horizontalScale,
            hD - hU
        );

        return glm::normalize(normal);
    }
};
```

### Terrain Shaders

```glsl
// Vertex Shader - terrain_vert.glsl
#version 450

layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec3 inNormal;
layout(location = 2) in vec2 inTexCoord;

layout(set = 0, binding = 0) uniform CameraUBO {
    mat4 view;
    mat4 projection;
    vec3 cameraPosition;
} camera;

layout(set = 1, binding = 0) uniform TerrainUBO {
    mat4 model;
    vec2 terrainSize;
    float heightScale;
    float textureTiling;
} terrain;

layout(location = 0) out vec3 fragPosition;
layout(location = 1) out vec3 fragNormal;
layout(location = 2) out vec2 fragTexCoord;
layout(location = 3) out float fragHeight;

void main() {
    vec4 worldPosition = terrain.model * vec4(inPosition, 1.0);

    fragPosition = worldPosition.xyz;
    fragNormal = mat3(transpose(inverse(terrain.model))) * inNormal;
    fragTexCoord = inTexCoord * terrain.textureTiling;
    fragHeight = inPosition.y / terrain.heightScale;

    gl_Position = camera.projection * camera.view * worldPosition;
}

// Fragment Shader - terrain_frag.glsl
#version 450

layout(location = 0) in vec3 fragPosition;
layout(location = 1) in vec3 fragNormal;
layout(location = 2) in vec2 fragTexCoord;
layout(location = 3) in float fragHeight;

layout(set = 2, binding = 0) uniform sampler2D grassTexture;
layout(set = 2, binding = 1) uniform sampler2D rockTexture;
layout(set = 2, binding = 2) uniform sampler2D snowTexture;
layout(set = 2, binding = 3) uniform sampler2D sandTexture;

layout(set = 0, binding = 0) uniform CameraUBO {
    mat4 view;
    mat4 projection;
    vec3 cameraPosition;
} camera;

layout(location = 0) out vec4 outColor;

const vec3 lightDirection = normalize(vec3(0.5, 1.0, 0.3));
const vec3 lightColor = vec3(1.0, 0.98, 0.95);
const vec3 ambientColor = vec3(0.3, 0.35, 0.4);

void main() {
    vec3 normal = normalize(fragNormal);

    // Height-based texture blending
    float sandWeight = smoothstep(0.0, 0.1, fragHeight) *
                       (1.0 - smoothstep(0.1, 0.2, fragHeight));
    float grassWeight = smoothstep(0.1, 0.2, fragHeight) *
                        (1.0 - smoothstep(0.5, 0.7, fragHeight));
    float rockWeight = smoothstep(0.5, 0.7, fragHeight) *
                       (1.0 - smoothstep(0.8, 0.9, fragHeight));
    float snowWeight = smoothstep(0.8, 0.9, fragHeight);

    // Slope-based rock blending
    float slope = 1.0 - dot(normal, vec3(0.0, 1.0, 0.0));
    rockWeight = max(rockWeight, smoothstep(0.3, 0.6, slope));

    // Normalize weights
    float totalWeight = sandWeight + grassWeight + rockWeight + snowWeight;
    if (totalWeight > 0.0) {
        sandWeight /= totalWeight;
        grassWeight /= totalWeight;
        rockWeight /= totalWeight;
        snowWeight /= totalWeight;
    }

    // Sample textures with triplanar mapping for steep areas
    vec3 sandColor = texture(sandTexture, fragTexCoord).rgb;
    vec3 grassColor = texture(grassTexture, fragTexCoord).rgb;
    vec3 rockColor = texture(rockTexture, fragTexCoord).rgb;
    vec3 snowColor = texture(snowTexture, fragTexCoord).rgb;

    vec3 albedo = sandColor * sandWeight +
                  grassColor * grassWeight +
                  rockColor * rockWeight +
                  snowColor * snowWeight;

    // Simple diffuse lighting
    float NdotL = max(dot(normal, lightDirection), 0.0);
    vec3 diffuse = albedo * lightColor * NdotL;
    vec3 ambient = albedo * ambientColor;

    outColor = vec4(ambient + diffuse, 1.0);
}
```

---

## Level of Detail (LOD) Terrain

### Chunked LOD System

Large terrains require level-of-detail management to maintain performance. The chunked LOD approach divides terrain into tiles that can be rendered at different resolutions.

```cpp
class TerrainChunk {
public:
    glm::vec2 position;
    glm::vec2 size;
    int lodLevel;
    BoundingBox bounds;

    std::vector<uint32_t> lodIndices[MAX_LOD_LEVELS];

    void generateLODMeshes(const HeightmapTerrain& terrain,
                           int chunkX, int chunkZ,
                           int chunkSize) {
        for (int lod = 0; lod < MAX_LOD_LEVELS; lod++) {
            int step = 1 << lod;  // 1, 2, 4, 8, ...
            generateLODIndices(terrain, chunkX, chunkZ,
                              chunkSize, step, lodIndices[lod]);
        }
    }

private:
    void generateLODIndices(const HeightmapTerrain& terrain,
                            int chunkX, int chunkZ,
                            int chunkSize, int step,
                            std::vector<uint32_t>& indices) {
        indices.clear();

        for (int z = 0; z < chunkSize - step; z += step) {
            for (int x = 0; x < chunkSize - step; x += step) {
                int globalX = chunkX * chunkSize + x;
                int globalZ = chunkZ * chunkSize + z;

                int topLeft = globalZ * terrain.width + globalX;
                int topRight = topLeft + step;
                int bottomLeft = (globalZ + step) * terrain.width + globalX;
                int bottomRight = bottomLeft + step;

                indices.push_back(topLeft);
                indices.push_back(bottomLeft);
                indices.push_back(topRight);

                indices.push_back(topRight);
                indices.push_back(bottomLeft);
                indices.push_back(bottomRight);
            }
        }
    }
};

class ChunkedTerrainSystem {
public:
    static const int CHUNK_SIZE = 64;
    static const int MAX_LOD_LEVELS = 5;

    std::vector<TerrainChunk> chunks;

    void initialize(const HeightmapTerrain& terrain) {
        int chunksX = (terrain.width - 1) / CHUNK_SIZE;
        int chunksZ = (terrain.height - 1) / CHUNK_SIZE;

        for (int z = 0; z < chunksZ; z++) {
            for (int x = 0; x < chunksX; x++) {
                TerrainChunk chunk;
                chunk.position = glm::vec2(x * CHUNK_SIZE, z * CHUNK_SIZE);
                chunk.size = glm::vec2(CHUNK_SIZE, CHUNK_SIZE);
                chunk.generateLODMeshes(terrain, x, z, CHUNK_SIZE);
                chunk.bounds = calculateChunkBounds(terrain, x, z);
                chunks.push_back(chunk);
            }
        }
    }

    void selectLODs(const glm::vec3& cameraPosition,
                    const Frustum& frustum) {
        for (auto& chunk : chunks) {
            // Frustum culling
            if (!frustum.intersects(chunk.bounds)) {
                chunk.lodLevel = -1;  // Don't render
                continue;
            }

            // Distance-based LOD selection
            glm::vec3 chunkCenter = chunk.bounds.getCenter();
            float distance = glm::length(cameraPosition - chunkCenter);

            chunk.lodLevel = calculateLODLevel(distance);
        }
    }

private:
    int calculateLODLevel(float distance) {
        // LOD thresholds
        const float lodDistances[] = {50.0f, 100.0f, 200.0f, 400.0f, 800.0f};

        for (int i = 0; i < MAX_LOD_LEVELS; i++) {
            if (distance < lodDistances[i]) {
                return i;
            }
        }
        return MAX_LOD_LEVELS - 1;
    }

    BoundingBox calculateChunkBounds(const HeightmapTerrain& terrain,
                                      int chunkX, int chunkZ) {
        float minY = FLT_MAX;
        float maxY = -FLT_MAX;

        int startX = chunkX * CHUNK_SIZE;
        int startZ = chunkZ * CHUNK_SIZE;

        for (int z = 0; z <= CHUNK_SIZE; z++) {
            for (int x = 0; x <= CHUNK_SIZE; x++) {
                float height = terrain.getHeight(startX + x, startZ + z);
                minY = std::min(minY, height);
                maxY = std::max(maxY, height);
            }
        }

        glm::vec3 min(startX * terrain.horizontalScale, minY,
                      startZ * terrain.horizontalScale);
        glm::vec3 max((startX + CHUNK_SIZE) * terrain.horizontalScale, maxY,
                      (startZ + CHUNK_SIZE) * terrain.horizontalScale);

        return BoundingBox(min, max);
    }
};
```

### Geomorphing for Smooth LOD Transitions

```glsl
// Vertex shader with geomorphing
#version 450

layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec3 inNormal;
layout(location = 2) in vec2 inTexCoord;
layout(location = 3) in vec3 inMorphTarget;  // Position at coarser LOD

layout(push_constant) uniform PushConstants {
    float morphFactor;  // 0.0 = current LOD, 1.0 = next coarser LOD
} push;

void main() {
    // Interpolate between current LOD position and morph target
    vec3 morphedPosition = mix(inPosition, inMorphTarget, push.morphFactor);

    // Continue with transformation...
    vec4 worldPosition = terrain.model * vec4(morphedPosition, 1.0);
    gl_Position = camera.projection * camera.view * worldPosition;
}
```

### Clipmap-Based Terrain

Clipmaps provide a more efficient approach for very large terrains by using nested grids centered on the camera.

```cpp
class TerrainClipmap {
public:
    static const int CLIPMAP_LEVELS = 8;
    static const int GRID_SIZE = 255;  // Must be odd for center alignment

    struct ClipmapLevel {
        float scale;
        glm::vec2 offset;
        GLuint vertexBuffer;
        GLuint indexBuffer;
    };

    std::array<ClipmapLevel, CLIPMAP_LEVELS> levels;

    void initialize() {
        // Create the clipmap ring geometry
        std::vector<glm::vec3> vertices;
        std::vector<uint32_t> indices;

        generateClipmapRing(vertices, indices);

        // Create buffers for each level
        for (int i = 0; i < CLIPMAP_LEVELS; i++) {
            levels[i].scale = std::pow(2.0f, i);
            createBuffers(levels[i], vertices, indices);
        }
    }

    void update(const glm::vec3& cameraPosition) {
        for (int i = 0; i < CLIPMAP_LEVELS; i++) {
            // Snap to grid at this level's scale
            float gridStep = levels[i].scale;
            levels[i].offset.x = std::floor(cameraPosition.x / gridStep) * gridStep;
            levels[i].offset.y = std::floor(cameraPosition.z / gridStep) * gridStep;
        }
    }

    void render(const HeightmapTerrain& terrain, Shader& shader) {
        for (int i = CLIPMAP_LEVELS - 1; i >= 0; i--) {
            shader.setFloat("clipmapScale", levels[i].scale);
            shader.setVec2("clipmapOffset", levels[i].offset);
            shader.setInt("clipmapLevel", i);

            // Render the clipmap ring (or full grid for outermost level)
            renderLevel(i);
        }
    }

private:
    void generateClipmapRing(std::vector<glm::vec3>& vertices,
                              std::vector<uint32_t>& indices) {
        // Generate vertices for a grid
        int halfSize = GRID_SIZE / 2;

        for (int z = -halfSize; z <= halfSize; z++) {
            for (int x = -halfSize; x <= halfSize; x++) {
                vertices.push_back(glm::vec3(x, 0, z));
            }
        }

        // Generate indices
        for (int z = 0; z < GRID_SIZE - 1; z++) {
            for (int x = 0; x < GRID_SIZE - 1; x++) {
                int topLeft = z * GRID_SIZE + x;
                int topRight = topLeft + 1;
                int bottomLeft = (z + 1) * GRID_SIZE + x;
                int bottomRight = bottomLeft + 1;

                indices.push_back(topLeft);
                indices.push_back(bottomLeft);
                indices.push_back(topRight);

                indices.push_back(topRight);
                indices.push_back(bottomLeft);
                indices.push_back(bottomRight);
            }
        }
    }
};
```

---

## Terrain Texture Blending

### Multi-Layer Splatmap System

Splatmaps use RGBA channels to control the blending of up to 4 terrain textures per splat texture.

```cpp
class TerrainTextureSystem {
public:
    struct TerrainLayer {
        GLuint albedoTexture;
        GLuint normalTexture;
        GLuint roughnessTexture;
        float uvScale;
        float heightBlendFactor;
    };

    std::vector<TerrainLayer> layers;
    std::vector<GLuint> splatmaps;  // Each splatmap controls 4 layers

    void addLayer(const std::string& albedoPath,
                  const std::string& normalPath,
                  const std::string& roughnessPath,
                  float uvScale = 1.0f) {
        TerrainLayer layer;
        layer.albedoTexture = loadTexture(albedoPath);
        layer.normalTexture = loadTexture(normalPath);
        layer.roughnessTexture = loadTexture(roughnessPath);
        layer.uvScale = uvScale;
        layer.heightBlendFactor = 1.0f;
        layers.push_back(layer);
    }

    void bindTextures(Shader& shader) {
        for (size_t i = 0; i < layers.size(); i++) {
            std::string prefix = "layer" + std::to_string(i);

            glActiveTexture(GL_TEXTURE0 + i * 3);
            glBindTexture(GL_TEXTURE_2D, layers[i].albedoTexture);
            shader.setInt(prefix + "Albedo", i * 3);

            glActiveTexture(GL_TEXTURE0 + i * 3 + 1);
            glBindTexture(GL_TEXTURE_2D, layers[i].normalTexture);
            shader.setInt(prefix + "Normal", i * 3 + 1);

            glActiveTexture(GL_TEXTURE0 + i * 3 + 2);
            glBindTexture(GL_TEXTURE_2D, layers[i].roughnessTexture);
            shader.setInt(prefix + "Roughness", i * 3 + 2);

            shader.setFloat(prefix + "UVScale", layers[i].uvScale);
        }

        // Bind splatmaps
        int splatmapStart = layers.size() * 3;
        for (size_t i = 0; i < splatmaps.size(); i++) {
            glActiveTexture(GL_TEXTURE0 + splatmapStart + i);
            glBindTexture(GL_TEXTURE_2D, splatmaps[i]);
            shader.setInt("splatmap" + std::to_string(i), splatmapStart + i);
        }
    }
};
```

### Height-Based Blending Shader

```glsl
// Fragment shader with height-based blending
#version 450

// Splatmap containing blend weights in RGBA
layout(set = 2, binding = 0) uniform sampler2D splatmap;

// Terrain layer textures
layout(set = 2, binding = 1) uniform sampler2D layer0Albedo;
layout(set = 2, binding = 2) uniform sampler2D layer0Normal;
layout(set = 2, binding = 3) uniform sampler2D layer0Height;

layout(set = 2, binding = 4) uniform sampler2D layer1Albedo;
layout(set = 2, binding = 5) uniform sampler2D layer1Normal;
layout(set = 2, binding = 6) uniform sampler2D layer1Height;

layout(set = 2, binding = 7) uniform sampler2D layer2Albedo;
layout(set = 2, binding = 8) uniform sampler2D layer2Normal;
layout(set = 2, binding = 9) uniform sampler2D layer2Height;

layout(set = 2, binding = 10) uniform sampler2D layer3Albedo;
layout(set = 2, binding = 11) uniform sampler2D layer3Normal;
layout(set = 2, binding = 12) uniform sampler2D layer3Height;

layout(location = 0) in vec3 fragPosition;
layout(location = 1) in vec3 fragNormal;
layout(location = 2) in vec2 fragTexCoord;
layout(location = 3) in vec2 splatCoord;

layout(location = 0) out vec4 outColor;

uniform float heightBlendSharpness = 0.2;

// Height-based blend function
vec4 heightBlend(vec4 colors[4], float heights[4], vec4 weights) {
    // Add height to weights
    float h0 = heights[0] + weights.r;
    float h1 = heights[1] + weights.g;
    float h2 = heights[2] + weights.b;
    float h3 = heights[3] + weights.a;

    // Find maximum height
    float maxHeight = max(max(h0, h1), max(h2, h3));

    // Calculate blend factors based on height difference
    float b0 = max(h0 - maxHeight + heightBlendSharpness, 0.0);
    float b1 = max(h1 - maxHeight + heightBlendSharpness, 0.0);
    float b2 = max(h2 - maxHeight + heightBlendSharpness, 0.0);
    float b3 = max(h3 - maxHeight + heightBlendSharpness, 0.0);

    // Normalize
    float sum = b0 + b1 + b2 + b3;
    b0 /= sum; b1 /= sum; b2 /= sum; b3 /= sum;

    return colors[0] * b0 + colors[1] * b1 + colors[2] * b2 + colors[3] * b3;
}

void main() {
    // Sample splatmap
    vec4 weights = texture(splatmap, splatCoord);

    // Sample all layers
    vec4 albedos[4];
    float heights[4];

    albedos[0] = texture(layer0Albedo, fragTexCoord);
    heights[0] = texture(layer0Height, fragTexCoord).r;

    albedos[1] = texture(layer1Albedo, fragTexCoord);
    heights[1] = texture(layer1Height, fragTexCoord).r;

    albedos[2] = texture(layer2Albedo, fragTexCoord);
    heights[2] = texture(layer2Height, fragTexCoord).r;

    albedos[3] = texture(layer3Albedo, fragTexCoord);
    heights[3] = texture(layer3Height, fragTexCoord).r;

    // Blend using height information
    vec4 finalAlbedo = heightBlend(albedos, heights, weights);

    // Continue with lighting calculations...
    outColor = finalAlbedo;
}
```

### Triplanar Mapping for Steep Surfaces

```glsl
// Triplanar mapping function
vec4 triplanarSample(sampler2D tex, vec3 worldPos, vec3 worldNormal, float scale) {
    // Calculate blend weights based on normal
    vec3 blendWeights = abs(worldNormal);
    blendWeights = pow(blendWeights, vec3(4.0));  // Sharpen blend
    blendWeights /= (blendWeights.x + blendWeights.y + blendWeights.z);

    // Sample from each plane
    vec4 xProjection = texture(tex, worldPos.yz * scale);
    vec4 yProjection = texture(tex, worldPos.xz * scale);
    vec4 zProjection = texture(tex, worldPos.xy * scale);

    // Blend based on normal direction
    return xProjection * blendWeights.x +
           yProjection * blendWeights.y +
           zProjection * blendWeights.z;
}

// In main():
vec4 albedo;
float slope = 1.0 - dot(normalize(fragNormal), vec3(0.0, 1.0, 0.0));

if (slope > 0.5) {
    // Use triplanar mapping for steep surfaces
    albedo = triplanarSample(rockTexture, fragPosition, fragNormal, 0.1);
} else {
    // Use standard UV mapping for flat surfaces
    albedo = texture(grassTexture, fragTexCoord);
}
```

---

## Grass and Vegetation Rendering

### GPU-Based Grass Instancing

```cpp
class GrassSystem {
public:
    struct GrassBlade {
        glm::vec3 position;
        float rotation;
        float height;
        float width;
        glm::vec3 color;
    };

    static const int MAX_GRASS_INSTANCES = 1000000;

    GLuint instanceBuffer;
    GLuint grassVAO;
    int instanceCount;

    void initialize(const HeightmapTerrain& terrain,
                    float density,
                    float minHeight, float maxHeight) {
        std::vector<GrassBlade> blades;

        // Generate grass instances
        std::default_random_engine generator;
        std::uniform_real_distribution<float> heightDist(minHeight, maxHeight);
        std::uniform_real_distribution<float> rotDist(0.0f, 2.0f * M_PI);
        std::uniform_real_distribution<float> colorVar(-0.1f, 0.1f);

        for (int z = 0; z < terrain.height; z++) {
            for (int x = 0; x < terrain.width; x++) {
                // Check if grass should be placed here
                float terrainHeight = terrain.getHeight(x, z);
                float slope = calculateSlope(terrain, x, z);

                // Only place grass on relatively flat areas
                if (slope > 0.5f) continue;

                // Poisson-like distribution
                int grassCount = static_cast<int>(density *
                    (1.0f - slope) * (1.0f - terrainHeight / terrain.heightScale));

                for (int i = 0; i < grassCount; i++) {
                    GrassBlade blade;

                    // Random offset within cell
                    float offsetX = (rand() / (float)RAND_MAX) * terrain.horizontalScale;
                    float offsetZ = (rand() / (float)RAND_MAX) * terrain.horizontalScale;

                    blade.position = glm::vec3(
                        x * terrain.horizontalScale + offsetX,
                        terrainHeight,
                        z * terrain.horizontalScale + offsetZ
                    );

                    blade.rotation = rotDist(generator);
                    blade.height = heightDist(generator);
                    blade.width = blade.height * 0.1f;

                    // Slight color variation
                    blade.color = glm::vec3(
                        0.2f + colorVar(generator),
                        0.6f + colorVar(generator),
                        0.1f + colorVar(generator)
                    );

                    blades.push_back(blade);
                }
            }
        }

        instanceCount = blades.size();

        // Create instance buffer
        glGenBuffers(1, &instanceBuffer);
        glBindBuffer(GL_ARRAY_BUFFER, instanceBuffer);
        glBufferData(GL_ARRAY_BUFFER,
                     blades.size() * sizeof(GrassBlade),
                     blades.data(),
                     GL_STATIC_DRAW);
    }

    void render(Shader& shader, float time) {
        shader.use();
        shader.setFloat("time", time);

        glBindVertexArray(grassVAO);
        glDrawArraysInstanced(GL_TRIANGLE_STRIP, 0, 7, instanceCount);
    }

private:
    float calculateSlope(const HeightmapTerrain& terrain, int x, int z) {
        float h = terrain.getHeight(x, z);
        float hL = terrain.getHeight(x - 1, z);
        float hR = terrain.getHeight(x + 1, z);
        float hD = terrain.getHeight(x, z - 1);
        float hU = terrain.getHeight(x, z + 1);

        float dx = (hR - hL) / (2.0f * terrain.horizontalScale);
        float dz = (hU - hD) / (2.0f * terrain.horizontalScale);

        return std::sqrt(dx * dx + dz * dz);
    }
};
```

### Grass Shader with Wind Animation

```glsl
// Vertex Shader - grass_vert.glsl
#version 450

// Per-vertex data (grass blade geometry)
layout(location = 0) in vec3 inPosition;  // Position along blade
layout(location = 1) in vec2 inTexCoord;

// Per-instance data
layout(location = 2) in vec3 instancePosition;
layout(location = 3) in float instanceRotation;
layout(location = 4) in float instanceHeight;
layout(location = 5) in float instanceWidth;
layout(location = 6) in vec3 instanceColor;

layout(set = 0, binding = 0) uniform CameraUBO {
    mat4 view;
    mat4 projection;
    vec3 cameraPosition;
} camera;

layout(push_constant) uniform PushConstants {
    float time;
    vec2 windDirection;
    float windStrength;
} pc;

layout(location = 0) out vec2 fragTexCoord;
layout(location = 1) out vec3 fragColor;
layout(location = 2) out float fragAO;

// Simplex noise for natural wind variation
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    // Calculate wind displacement
    float windPhase = dot(instancePosition.xz, pc.windDirection) * 0.1 + pc.time;
    float windOffset = sin(windPhase) * pc.windStrength;

    // Add noise for natural variation
    float noiseVal = noise(instancePosition.xz * 0.1 + pc.time * 0.5);
    windOffset += noiseVal * pc.windStrength * 0.3;

    // Apply wind based on height along blade (more at top)
    float heightFactor = inPosition.y;
    vec3 windDisplacement = vec3(
        pc.windDirection.x * windOffset * heightFactor * heightFactor,
        -abs(windOffset) * heightFactor * 0.1,  // Slight droop
        pc.windDirection.y * windOffset * heightFactor * heightFactor
    );

    // Scale blade
    vec3 scaledPos = inPosition;
    scaledPos.y *= instanceHeight;
    scaledPos.x *= instanceWidth;

    // Rotate blade around Y axis
    float c = cos(instanceRotation);
    float s = sin(instanceRotation);
    vec3 rotatedPos = vec3(
        scaledPos.x * c - scaledPos.z * s,
        scaledPos.y,
        scaledPos.x * s + scaledPos.z * c
    );

    // Billboard toward camera (optional - for distant grass)
    vec3 toCamera = normalize(camera.cameraPosition - instancePosition);

    // Final position
    vec3 worldPos = instancePosition + rotatedPos + windDisplacement;

    gl_Position = camera.projection * camera.view * vec4(worldPos, 1.0);

    fragTexCoord = inTexCoord;
    fragColor = instanceColor;
    fragAO = 1.0 - heightFactor * 0.3;  // Darker at base
}

// Fragment Shader - grass_frag.glsl
#version 450

layout(location = 0) in vec2 fragTexCoord;
layout(location = 1) in vec3 fragColor;
layout(location = 2) in float fragAO;

layout(set = 1, binding = 0) uniform sampler2D grassAlpha;

layout(location = 0) out vec4 outColor;

void main() {
    float alpha = texture(grassAlpha, fragTexCoord).r;

    // Alpha test for grass blade shape
    if (alpha < 0.5) {
        discard;
    }

    // Apply ambient occlusion and color
    vec3 finalColor = fragColor * fragAO;

    // Simple subsurface scattering approximation
    finalColor += vec3(0.1, 0.15, 0.05) * (1.0 - fragAO);

    outColor = vec4(finalColor, 1.0);
}
```

### Grass LOD and Culling

```cpp
class GrassLODSystem {
public:
    struct GrassCell {
        glm::vec2 position;
        float size;
        int instanceStart;
        int instanceCount;
        BoundingBox bounds;
    };

    std::vector<GrassCell> cells;
    float lodDistances[3] = {50.0f, 100.0f, 200.0f};

    void cullAndLOD(const glm::vec3& cameraPosition,
                    const Frustum& frustum,
                    std::vector<DrawCommand>& drawCommands) {
        drawCommands.clear();

        for (const auto& cell : cells) {
            // Frustum culling
            if (!frustum.intersects(cell.bounds)) {
                continue;
            }

            // Distance-based LOD
            float distance = glm::length(
                glm::vec2(cameraPosition.x, cameraPosition.z) - cell.position
            );

            int instanceCount = cell.instanceCount;

            // Reduce instance count based on distance
            if (distance > lodDistances[2]) {
                instanceCount /= 8;
            } else if (distance > lodDistances[1]) {
                instanceCount /= 4;
            } else if (distance > lodDistances[0]) {
                instanceCount /= 2;
            }

            if (instanceCount > 0) {
                DrawCommand cmd;
                cmd.instanceStart = cell.instanceStart;
                cmd.instanceCount = instanceCount;
                drawCommands.push_back(cmd);
            }
        }
    }
};
```

---

## Tree Instancing and Rendering

### Impostor-Based Tree Rendering

```cpp
class TreeSystem {
public:
    struct TreeInstance {
        glm::vec3 position;
        float rotation;
        float scale;
        int treeType;
    };

    struct TreeType {
        // Full 3D model for close range
        GLuint meshVAO;
        int indexCount;

        // Billboard impostor for medium range
        GLuint impostorAtlas;
        int impostorFrames;

        // Simple billboard for far range
        GLuint simpleBillboard;
    };

    std::vector<TreeType> treeTypes;
    std::vector<TreeInstance> instances;

    void renderTrees(const glm::vec3& cameraPosition,
                     const Frustum& frustum,
                     Shader& meshShader,
                     Shader& impostorShader,
                     Shader& billboardShader) {

        for (const auto& instance : instances) {
            // Frustum culling
            BoundingBox treeBounds = calculateTreeBounds(instance);
            if (!frustum.intersects(treeBounds)) {
                continue;
            }

            float distance = glm::length(cameraPosition - instance.position);

            if (distance < 50.0f) {
                // Full 3D mesh
                renderTreeMesh(instance, meshShader);
            } else if (distance < 200.0f) {
                // Impostor (pre-rendered from multiple angles)
                renderTreeImpostor(instance, cameraPosition, impostorShader);
            } else {
                // Simple billboard
                renderTreeBillboard(instance, cameraPosition, billboardShader);
            }
        }
    }

private:
    void renderTreeImpostor(const TreeInstance& instance,
                            const glm::vec3& cameraPosition,
                            Shader& shader) {
        // Calculate viewing angle
        glm::vec3 toCamera = glm::normalize(cameraPosition - instance.position);
        float angle = atan2(toCamera.x, toCamera.z);

        // Select impostor frame based on viewing angle
        const TreeType& type = treeTypes[instance.treeType];
        int frame = static_cast<int>((angle + M_PI) / (2.0 * M_PI) * type.impostorFrames);
        frame = frame % type.impostorFrames;

        shader.use();
        shader.setInt("impostorFrame", frame);
        shader.setInt("totalFrames", type.impostorFrames);
        shader.setVec3("position", instance.position);
        shader.setFloat("scale", instance.scale);

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, type.impostorAtlas);

        // Render billboard quad
        glDrawArrays(GL_TRIANGLE_STRIP, 0, 4);
    }
};
```

### Tree Impostor Shader

```glsl
// Vertex Shader - tree_impostor_vert.glsl
#version 450

layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec2 inTexCoord;

layout(set = 0, binding = 0) uniform CameraUBO {
    mat4 view;
    mat4 projection;
    vec3 cameraPosition;
    vec3 cameraRight;
    vec3 cameraUp;
} camera;

layout(push_constant) uniform PushConstants {
    vec3 treePosition;
    float treeScale;
    int impostorFrame;
    int totalFrames;
} pc;

layout(location = 0) out vec2 fragTexCoord;

void main() {
    // Billboard vertices (camera-facing quad)
    vec3 worldPos = pc.treePosition;
    worldPos += camera.cameraRight * inPosition.x * pc.treeScale;
    worldPos += camera.cameraUp * inPosition.y * pc.treeScale;

    gl_Position = camera.projection * camera.view * vec4(worldPos, 1.0);

    // Calculate UV coordinates for the current impostor frame
    float frameWidth = 1.0 / float(pc.totalFrames);
    fragTexCoord.x = inTexCoord.x * frameWidth + float(pc.impostorFrame) * frameWidth;
    fragTexCoord.y = inTexCoord.y;
}

// Fragment Shader - tree_impostor_frag.glsl
#version 450

layout(location = 0) in vec2 fragTexCoord;

layout(set = 1, binding = 0) uniform sampler2D impostorAtlas;

layout(location = 0) out vec4 outColor;

void main() {
    vec4 texColor = texture(impostorAtlas, fragTexCoord);

    // Alpha test
    if (texColor.a < 0.5) {
        discard;
    }

    outColor = texColor;
}
```

### SpeedTree-Style Wind Animation

```glsl
// Tree mesh vertex shader with wind
#version 450

layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec3 inNormal;
layout(location = 2) in vec2 inTexCoord;
layout(location = 3) in vec4 inBranchData;  // xyz = branch anchor, w = wind weight

uniform float time;
uniform vec3 windDirection;
uniform float windStrength;
uniform float trunkStiffness;
uniform float branchStiffness;

// Main trunk sway
vec3 calculateTrunkWind(vec3 position, float height) {
    float swayAmount = windStrength * height * height / trunkStiffness;
    float phase = time * 1.5;

    return vec3(
        sin(phase) * swayAmount * windDirection.x,
        0.0,
        sin(phase * 1.1) * swayAmount * windDirection.z
    );
}

// Branch oscillation
vec3 calculateBranchWind(vec3 position, vec3 branchAnchor, float weight) {
    float distFromAnchor = length(position - branchAnchor);
    float phase = time * 3.0 + dot(branchAnchor, vec3(1.0));

    float oscillation = sin(phase) * windStrength * weight / branchStiffness;

    // Perpendicular to branch direction
    vec3 branchDir = normalize(position - branchAnchor);
    vec3 perpendicular = cross(branchDir, vec3(0.0, 1.0, 0.0));

    return perpendicular * oscillation * distFromAnchor;
}

// Leaf flutter
vec3 calculateLeafFlutter(vec3 position, float weight) {
    float phase = time * 8.0 + dot(position, vec3(7.3, 11.7, 13.1));
    float flutter = sin(phase) * windStrength * weight * 0.1;

    return vec3(flutter, flutter * 0.5, flutter);
}

void main() {
    vec3 animatedPos = inPosition;
    float height = inPosition.y;

    // Apply wind effects
    animatedPos += calculateTrunkWind(inPosition, height);

    if (inBranchData.w > 0.0) {
        animatedPos += calculateBranchWind(inPosition, inBranchData.xyz, inBranchData.w);
        animatedPos += calculateLeafFlutter(inPosition, inBranchData.w);
    }

    // Transform to clip space
    gl_Position = projection * view * model * vec4(animatedPos, 1.0);
}
```

---

## Weather Systems

### Rain Particle System

```cpp
class RainSystem {
public:
    static const int MAX_RAINDROPS = 100000;

    struct Raindrop {
        glm::vec3 position;
        float velocity;
        float size;
    };

    std::vector<Raindrop> raindrops;
    GLuint particleBuffer;
    float intensity = 1.0f;

    void initialize() {
        raindrops.resize(MAX_RAINDROPS);

        std::default_random_engine gen;
        std::uniform_real_distribution<float> posDist(-500.0f, 500.0f);
        std::uniform_real_distribution<float> heightDist(0.0f, 100.0f);
        std::uniform_real_distribution<float> velDist(15.0f, 25.0f);
        std::uniform_real_distribution<float> sizeDist(0.1f, 0.3f);

        for (auto& drop : raindrops) {
            drop.position = glm::vec3(posDist(gen), heightDist(gen), posDist(gen));
            drop.velocity = velDist(gen);
            drop.size = sizeDist(gen);
        }

        // Create GPU buffer
        glGenBuffers(1, &particleBuffer);
        glBindBuffer(GL_SHADER_STORAGE_BUFFER, particleBuffer);
        glBufferData(GL_SHADER_STORAGE_BUFFER,
                     sizeof(Raindrop) * MAX_RAINDROPS,
                     raindrops.data(), GL_DYNAMIC_DRAW);
    }

    void update(float deltaTime, const glm::vec3& cameraPosition) {
        // Update on GPU using compute shader
        rainComputeShader.use();
        rainComputeShader.setFloat("deltaTime", deltaTime);
        rainComputeShader.setVec3("cameraPosition", cameraPosition);
        rainComputeShader.setFloat("intensity", intensity);

        glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 0, particleBuffer);
        glDispatchCompute((MAX_RAINDROPS + 255) / 256, 1, 1);
        glMemoryBarrier(GL_SHADER_STORAGE_BARRIER_BIT);
    }

    void render(Shader& shader) {
        shader.use();

        glEnable(GL_BLEND);
        glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

        glBindBuffer(GL_ARRAY_BUFFER, particleBuffer);
        glDrawArrays(GL_POINTS, 0, static_cast<int>(MAX_RAINDROPS * intensity));

        glDisable(GL_BLEND);
    }
};
```

### Rain Compute Shader

```glsl
// rain_compute.glsl
#version 450

layout(local_size_x = 256) in;

struct Raindrop {
    vec3 position;
    float velocity;
    float size;
    float padding[3];
};

layout(std430, binding = 0) buffer RainBuffer {
    Raindrop raindrops[];
};

uniform float deltaTime;
uniform vec3 cameraPosition;
uniform float groundHeight;
uniform vec3 windVelocity;

// Simple hash for randomization
float hash(float n) {
    return fract(sin(n) * 43758.5453);
}

void main() {
    uint idx = gl_GlobalInvocationID.x;

    Raindrop drop = raindrops[idx];

    // Apply gravity and wind
    drop.position.y -= drop.velocity * deltaTime;
    drop.position.xz += windVelocity.xz * deltaTime;

    // Reset raindrop when it hits ground or goes too far from camera
    if (drop.position.y < groundHeight ||
        length(drop.position.xz - cameraPosition.xz) > 500.0) {

        // Respawn above camera
        float angle = hash(float(idx) + deltaTime) * 6.28318;
        float radius = hash(float(idx) * 2.0 + deltaTime) * 400.0;

        drop.position.x = cameraPosition.x + cos(angle) * radius;
        drop.position.z = cameraPosition.z + sin(angle) * radius;
        drop.position.y = cameraPosition.y + 50.0 + hash(float(idx) * 3.0) * 50.0;
    }

    raindrops[idx] = drop;
}
```

### Rain Rendering Shader

```glsl
// rain_vert.glsl
#version 450

layout(location = 0) in vec3 position;
layout(location = 1) in float velocity;
layout(location = 2) in float size;

uniform mat4 viewProjection;
uniform vec3 cameraPosition;

out float fragLength;
out float fragAlpha;

void main() {
    // Calculate streak length based on velocity
    fragLength = velocity * 0.02;

    // Fade based on distance
    float dist = length(position - cameraPosition);
    fragAlpha = 1.0 - smoothstep(100.0, 500.0, dist);

    gl_Position = viewProjection * vec4(position, 1.0);
    gl_PointSize = size * 100.0 / gl_Position.w;
}

// rain_frag.glsl
#version 450

in float fragLength;
in float fragAlpha;

out vec4 outColor;

void main() {
    // Create elongated raindrop shape
    vec2 coord = gl_PointCoord * 2.0 - 1.0;
    coord.y *= fragLength;

    float dist = length(coord);
    float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
    alpha *= fragAlpha * 0.5;

    outColor = vec4(0.7, 0.8, 0.9, alpha);
}
```

### Snow System

```cpp
class SnowSystem {
public:
    struct Snowflake {
        glm::vec3 position;
        glm::vec3 velocity;
        float size;
        float rotation;
        float rotationSpeed;
    };

    void update(float deltaTime) {
        for (auto& flake : snowflakes) {
            // Gentle falling motion
            flake.position.y -= flake.velocity.y * deltaTime;

            // Swaying motion
            float time = glfwGetTime();
            float swayX = sin(time * 0.5f + flake.position.x * 0.1f) * 0.5f;
            float swayZ = cos(time * 0.7f + flake.position.z * 0.1f) * 0.5f;

            flake.position.x += (flake.velocity.x + swayX) * deltaTime;
            flake.position.z += (flake.velocity.z + swayZ) * deltaTime;

            // Rotation
            flake.rotation += flake.rotationSpeed * deltaTime;

            // Respawn at top
            if (flake.position.y < groundLevel) {
                respawnSnowflake(flake);
            }
        }
    }

private:
    void respawnSnowflake(Snowflake& flake) {
        flake.position.y = cameraPosition.y + 50.0f;
        flake.position.x = cameraPosition.x + randomFloat(-100.0f, 100.0f);
        flake.position.z = cameraPosition.z + randomFloat(-100.0f, 100.0f);
        flake.velocity = glm::vec3(
            randomFloat(-1.0f, 1.0f),
            randomFloat(2.0f, 5.0f),
            randomFloat(-1.0f, 1.0f)
        );
        flake.size = randomFloat(0.1f, 0.4f);
        flake.rotationSpeed = randomFloat(-2.0f, 2.0f);
    }
};
```

---

## Atmospheric Scattering

### Sky Rendering with Rayleigh and Mie Scattering

```glsl
// atmospheric_scattering.glsl
#version 450

const float PI = 3.14159265359;
const int NUM_SAMPLES = 16;
const int NUM_LIGHT_SAMPLES = 8;

// Atmosphere parameters
const float EARTH_RADIUS = 6371000.0;
const float ATMOSPHERE_RADIUS = 6471000.0;  // 100km atmosphere
const float H_RAYLEIGH = 8000.0;   // Rayleigh scale height
const float H_MIE = 1200.0;        // Mie scale height

// Scattering coefficients
const vec3 BETA_RAYLEIGH = vec3(5.8e-6, 13.5e-6, 33.1e-6);  // Blue scattering
const vec3 BETA_MIE = vec3(21e-6);  // White scattering
const float G_MIE = 0.76;           // Mie anisotropy

// Sun parameters
uniform vec3 sunDirection;
uniform float sunIntensity;
uniform vec3 cameraPosition;

// Ray-sphere intersection
vec2 raySphereIntersect(vec3 origin, vec3 direction, float radius) {
    float b = dot(origin, direction);
    float c = dot(origin, origin) - radius * radius;
    float d = b * b - c;

    if (d < 0.0) return vec2(-1.0);

    d = sqrt(d);
    return vec2(-b - d, -b + d);
}

// Phase functions
float rayleighPhase(float cosTheta) {
    return 3.0 / (16.0 * PI) * (1.0 + cosTheta * cosTheta);
}

float miePhase(float cosTheta, float g) {
    float g2 = g * g;
    float num = (1.0 - g2) * (1.0 + cosTheta * cosTheta);
    float denom = (2.0 + g2) * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
    return 3.0 / (8.0 * PI) * num / denom;
}

// Calculate optical depth along a ray
vec2 opticalDepth(vec3 origin, vec3 direction, float rayLength) {
    float stepSize = rayLength / float(NUM_LIGHT_SAMPLES);
    vec3 samplePoint = origin + direction * stepSize * 0.5;

    float rayleighDepth = 0.0;
    float mieDepth = 0.0;

    for (int i = 0; i < NUM_LIGHT_SAMPLES; i++) {
        float height = length(samplePoint) - EARTH_RADIUS;
        rayleighDepth += exp(-height / H_RAYLEIGH) * stepSize;
        mieDepth += exp(-height / H_MIE) * stepSize;
        samplePoint += direction * stepSize;
    }

    return vec2(rayleighDepth, mieDepth);
}

// Main scattering calculation
vec3 calculateScattering(vec3 rayOrigin, vec3 rayDirection) {
    // Intersect with atmosphere
    vec2 atmosphereIntersect = raySphereIntersect(rayOrigin, rayDirection, ATMOSPHERE_RADIUS);

    if (atmosphereIntersect.x > atmosphereIntersect.y) {
        return vec3(0.0);  // No intersection
    }

    // Clamp to positive values
    float rayStart = max(atmosphereIntersect.x, 0.0);
    float rayEnd = atmosphereIntersect.y;

    // Check for ground intersection
    vec2 groundIntersect = raySphereIntersect(rayOrigin, rayDirection, EARTH_RADIUS);
    if (groundIntersect.x > 0.0) {
        rayEnd = groundIntersect.x;
    }

    float rayLength = rayEnd - rayStart;
    float stepSize = rayLength / float(NUM_SAMPLES);

    vec3 rayleighScattering = vec3(0.0);
    vec3 mieScattering = vec3(0.0);

    float rayleighOpticalDepth = 0.0;
    float mieOpticalDepth = 0.0;

    vec3 samplePoint = rayOrigin + rayDirection * (rayStart + stepSize * 0.5);

    for (int i = 0; i < NUM_SAMPLES; i++) {
        float height = length(samplePoint) - EARTH_RADIUS;

        // Local density
        float rayleighDensity = exp(-height / H_RAYLEIGH) * stepSize;
        float mieDensity = exp(-height / H_MIE) * stepSize;

        rayleighOpticalDepth += rayleighDensity;
        mieOpticalDepth += mieDensity;

        // Calculate optical depth to sun
        vec2 sunIntersect = raySphereIntersect(samplePoint, sunDirection, ATMOSPHERE_RADIUS);
        vec2 sunDepth = opticalDepth(samplePoint, sunDirection, sunIntersect.y);

        // Total optical depth
        vec3 totalRayleigh = BETA_RAYLEIGH * (rayleighOpticalDepth + sunDepth.x);
        vec3 totalMie = BETA_MIE * (mieOpticalDepth + sunDepth.y);
        vec3 attenuation = exp(-(totalRayleigh + totalMie));

        // Accumulate scattering
        rayleighScattering += rayleighDensity * attenuation;
        mieScattering += mieDensity * attenuation;

        samplePoint += rayDirection * stepSize;
    }

    // Apply phase functions
    float cosTheta = dot(rayDirection, sunDirection);
    float rayleighPhaseVal = rayleighPhase(cosTheta);
    float miePhaseVal = miePhase(cosTheta, G_MIE);

    vec3 color = sunIntensity * (
        rayleighScattering * BETA_RAYLEIGH * rayleighPhaseVal +
        mieScattering * BETA_MIE * miePhaseVal
    );

    return color;
}

void main() {
    vec3 rayDirection = normalize(fragWorldPosition - cameraPosition);
    vec3 atmosphereOrigin = cameraPosition + vec3(0.0, EARTH_RADIUS, 0.0);

    vec3 scattering = calculateScattering(atmosphereOrigin, rayDirection);

    // Tone mapping
    scattering = 1.0 - exp(-scattering);

    outColor = vec4(scattering, 1.0);
}
```

### Time of Day System

```cpp
class TimeOfDaySystem {
public:
    float timeOfDay;  // 0-24 hours

    struct SkyParameters {
        glm::vec3 sunDirection;
        glm::vec3 sunColor;
        float sunIntensity;
        glm::vec3 ambientColor;
        float fogDensity;
        glm::vec3 fogColor;
    };

    SkyParameters calculateParameters() {
        SkyParameters params;

        // Sun position based on time
        float sunAngle = (timeOfDay / 24.0f - 0.25f) * 2.0f * M_PI;
        params.sunDirection = glm::normalize(glm::vec3(
            cos(sunAngle),
            sin(sunAngle),
            0.3f
        ));

        // Sun color changes throughout the day
        float elevation = params.sunDirection.y;

        if (elevation > 0.0f) {
            // Daytime
            float sunset = smoothstep(0.0f, 0.3f, elevation);
            params.sunColor = glm::mix(
                glm::vec3(1.0f, 0.5f, 0.2f),  // Sunset orange
                glm::vec3(1.0f, 0.98f, 0.95f), // Daylight white
                sunset
            );
            params.sunIntensity = glm::mix(0.5f, 1.0f, sunset);
        } else {
            // Nighttime
            params.sunColor = glm::vec3(0.1f, 0.15f, 0.3f);  // Moonlight blue
            params.sunIntensity = 0.1f;
        }

        // Ambient color
        if (elevation > 0.0f) {
            params.ambientColor = glm::mix(
                glm::vec3(0.4f, 0.3f, 0.3f),
                glm::vec3(0.3f, 0.35f, 0.4f),
                smoothstep(0.0f, 0.5f, elevation)
            );
        } else {
            params.ambientColor = glm::vec3(0.05f, 0.05f, 0.1f);
        }

        // Fog
        params.fogDensity = 0.001f + 0.002f * (1.0f - abs(elevation));
        params.fogColor = params.ambientColor * 1.5f;

        return params;
    }
};
```

---

## Water Rendering

### Reflective Water Surface

```cpp
class WaterRenderer {
public:
    GLuint reflectionFBO;
    GLuint refractionFBO;
    GLuint reflectionTexture;
    GLuint refractionTexture;
    GLuint depthTexture;
    GLuint dudvMap;
    GLuint normalMap;

    float waterHeight;
    float waveStrength = 0.02f;
    float waveSpeed = 0.03f;

    void initialize(int width, int height) {
        // Create reflection FBO
        glGenFramebuffers(1, &reflectionFBO);
        glBindFramebuffer(GL_FRAMEBUFFER, reflectionFBO);

        glGenTextures(1, &reflectionTexture);
        glBindTexture(GL_TEXTURE_2D, reflectionTexture);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, nullptr);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, reflectionTexture, 0);

        // Create refraction FBO
        glGenFramebuffers(1, &refractionFBO);
        glBindFramebuffer(GL_FRAMEBUFFER, refractionFBO);

        glGenTextures(1, &refractionTexture);
        glBindTexture(GL_TEXTURE_2D, refractionTexture);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, nullptr);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, refractionTexture, 0);

        // Depth texture for refraction
        glGenTextures(1, &depthTexture);
        glBindTexture(GL_TEXTURE_2D, depthTexture);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_DEPTH_COMPONENT32, width, height, 0, GL_DEPTH_COMPONENT, GL_FLOAT, nullptr);
        glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, depthTexture, 0);

        glBindFramebuffer(GL_FRAMEBUFFER, 0);
    }

    void renderReflection(Scene& scene, Camera& camera) {
        glBindFramebuffer(GL_FRAMEBUFFER, reflectionFBO);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        // Flip camera for reflection
        float distance = 2 * (camera.position.y - waterHeight);
        camera.position.y -= distance;
        camera.pitch = -camera.pitch;
        camera.updateViewMatrix();

        // Enable clipping plane
        glEnable(GL_CLIP_DISTANCE0);
        scene.render(camera, glm::vec4(0, 1, 0, -waterHeight));
        glDisable(GL_CLIP_DISTANCE0);

        // Restore camera
        camera.position.y += distance;
        camera.pitch = -camera.pitch;
        camera.updateViewMatrix();
    }

    void renderRefraction(Scene& scene, Camera& camera) {
        glBindFramebuffer(GL_FRAMEBUFFER, refractionFBO);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        // Clip everything above water
        glEnable(GL_CLIP_DISTANCE0);
        scene.render(camera, glm::vec4(0, -1, 0, waterHeight));
        glDisable(GL_CLIP_DISTANCE0);
    }
};
```

### Water Shader

```glsl
// water_vert.glsl
#version 450

layout(location = 0) in vec3 inPosition;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform vec3 cameraPosition;

out vec4 clipSpace;
out vec2 texCoord;
out vec3 toCameraVector;
out vec3 fromLightVector;

uniform vec3 lightPosition;

const float tiling = 4.0;

void main() {
    vec4 worldPosition = model * vec4(inPosition, 1.0);
    clipSpace = projection * view * worldPosition;

    gl_Position = clipSpace;

    texCoord = vec2(inPosition.x / 2.0 + 0.5, inPosition.z / 2.0 + 0.5) * tiling;
    toCameraVector = cameraPosition - worldPosition.xyz;
    fromLightVector = worldPosition.xyz - lightPosition;
}

// water_frag.glsl
#version 450

in vec4 clipSpace;
in vec2 texCoord;
in vec3 toCameraVector;
in vec3 fromLightVector;

uniform sampler2D reflectionTexture;
uniform sampler2D refractionTexture;
uniform sampler2D dudvMap;
uniform sampler2D normalMap;
uniform sampler2D depthMap;

uniform float moveFactor;
uniform vec3 lightColor;

out vec4 outColor;

const float waveStrength = 0.02;
const float shineDamper = 20.0;
const float reflectivity = 0.6;

void main() {
    // Projective texture coordinates
    vec2 ndc = (clipSpace.xy / clipSpace.w) * 0.5 + 0.5;
    vec2 reflectionCoords = vec2(ndc.x, 1.0 - ndc.y);
    vec2 refractionCoords = ndc;

    // Depth calculation for edge softening
    float near = 0.1;
    float far = 1000.0;
    float depth = texture(depthMap, refractionCoords).r;
    float floorDistance = 2.0 * near * far / (far + near - (2.0 * depth - 1.0) * (far - near));

    depth = gl_FragCoord.z;
    float waterDistance = 2.0 * near * far / (far + near - (2.0 * depth - 1.0) * (far - near));
    float waterDepth = floorDistance - waterDistance;

    // DuDv distortion
    vec2 distortedTexCoords = texture(dudvMap, vec2(texCoord.x + moveFactor, texCoord.y)).rg * 0.1;
    distortedTexCoords = texCoord + vec2(distortedTexCoords.x, distortedTexCoords.y + moveFactor);
    vec2 totalDistortion = (texture(dudvMap, distortedTexCoords).rg * 2.0 - 1.0) * waveStrength;

    // Clamp distortion near edges
    totalDistortion *= clamp(waterDepth / 5.0, 0.0, 1.0);

    // Apply distortion
    reflectionCoords += totalDistortion;
    reflectionCoords = clamp(reflectionCoords, 0.001, 0.999);

    refractionCoords += totalDistortion;
    refractionCoords = clamp(refractionCoords, 0.001, 0.999);

    // Sample textures
    vec4 reflectionColor = texture(reflectionTexture, reflectionCoords);
    vec4 refractionColor = texture(refractionTexture, refractionCoords);

    // Normal from normal map
    vec4 normalMapColor = texture(normalMap, distortedTexCoords);
    vec3 normal = normalize(vec3(normalMapColor.r * 2.0 - 1.0, normalMapColor.b * 3.0, normalMapColor.g * 2.0 - 1.0));

    // Fresnel effect
    vec3 viewVector = normalize(toCameraVector);
    float refractiveFactor = dot(viewVector, normal);
    refractiveFactor = pow(refractiveFactor, 0.5);
    refractiveFactor = clamp(refractiveFactor, 0.0, 1.0);

    // Specular highlights
    vec3 reflectedLight = reflect(normalize(fromLightVector), normal);
    float specular = max(dot(reflectedLight, viewVector), 0.0);
    specular = pow(specular, shineDamper);
    vec3 specularHighlights = lightColor * specular * reflectivity;
    specularHighlights *= clamp(waterDepth / 5.0, 0.0, 1.0);

    // Final color
    outColor = mix(reflectionColor, refractionColor, refractiveFactor);
    outColor = mix(outColor, vec4(0.0, 0.3, 0.5, 1.0), 0.2);  // Blue tint
    outColor += vec4(specularHighlights, 0.0);
    outColor.a = clamp(waterDepth / 3.0, 0.0, 1.0);  // Edge transparency
}
```

### Ocean Waves with FFT

```cpp
class OceanSimulator {
public:
    int gridSize = 256;
    float patchSize = 1000.0f;

    // Phillips spectrum parameters
    float windSpeed = 30.0f;
    glm::vec2 windDirection = glm::normalize(glm::vec2(1.0f, 0.5f));
    float amplitude = 1.0f;

    GLuint h0Texture;
    GLuint htTexture;
    GLuint heightTexture;
    GLuint normalTexture;

    void initialize() {
        // Generate initial spectrum (h0)
        std::vector<glm::vec4> h0Data(gridSize * gridSize);

        std::default_random_engine generator;
        std::normal_distribution<float> gaussian(0.0f, 1.0f);

        for (int y = 0; y < gridSize; y++) {
            for (int x = 0; x < gridSize; x++) {
                glm::vec2 k = getWaveVector(x, y);
                float phillips = phillipsSpectrum(k);

                glm::vec2 h0k = glm::vec2(gaussian(generator), gaussian(generator)) *
                                sqrt(phillips / 2.0f);
                glm::vec2 h0mk = glm::vec2(gaussian(generator), gaussian(generator)) *
                                 sqrt(phillipsSpectrum(-k) / 2.0f);

                h0Data[y * gridSize + x] = glm::vec4(h0k, h0mk);
            }
        }

        // Create textures
        glGenTextures(1, &h0Texture);
        glBindTexture(GL_TEXTURE_2D, h0Texture);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA32F, gridSize, gridSize, 0,
                     GL_RGBA, GL_FLOAT, h0Data.data());

        // Create other textures for FFT
        glGenTextures(1, &htTexture);
        glBindTexture(GL_TEXTURE_2D, htTexture);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_RG32F, gridSize, gridSize, 0,
                     GL_RG, GL_FLOAT, nullptr);

        glGenTextures(1, &heightTexture);
        glBindTexture(GL_TEXTURE_2D, heightTexture);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_R32F, gridSize, gridSize, 0,
                     GL_RED, GL_FLOAT, nullptr);
    }

    void update(float time) {
        // Update h(k,t) using compute shader
        spectrumUpdateShader.use();
        spectrumUpdateShader.setFloat("time", time);
        glBindImageTexture(0, h0Texture, 0, GL_FALSE, 0, GL_READ_ONLY, GL_RGBA32F);
        glBindImageTexture(1, htTexture, 0, GL_FALSE, 0, GL_WRITE_ONLY, GL_RG32F);
        glDispatchCompute(gridSize / 16, gridSize / 16, 1);

        // Perform inverse FFT
        performIFFT();

        // Calculate normals
        calculateNormals();
    }

private:
    glm::vec2 getWaveVector(int x, int y) {
        float kx = (x - gridSize / 2.0f) * 2.0f * M_PI / patchSize;
        float ky = (y - gridSize / 2.0f) * 2.0f * M_PI / patchSize;
        return glm::vec2(kx, ky);
    }

    float phillipsSpectrum(glm::vec2 k) {
        float kLength = glm::length(k);
        if (kLength < 0.0001f) return 0.0f;

        float L = windSpeed * windSpeed / 9.81f;
        float kL = kLength * L;
        float k2 = kLength * kLength;
        float k4 = k2 * k2;

        glm::vec2 kNorm = glm::normalize(k);
        float kDotW = glm::dot(kNorm, windDirection);
        float kDotW2 = kDotW * kDotW;

        // Phillips spectrum
        float phillips = amplitude * exp(-1.0f / (kL * kL)) / k4 * kDotW2;

        // Suppress very small waves
        float l = L / 1000.0f;
        phillips *= exp(-k2 * l * l);

        return phillips;
    }
};
```

---

## Performance Optimization Techniques

### GPU-Based Frustum Culling

```cpp
class GPUFrustumCuller {
public:
    GLuint instanceBuffer;
    GLuint visibleBuffer;
    GLuint counterBuffer;

    void cullInstances(const std::vector<glm::mat4>& instances,
                       const Frustum& frustum) {
        // Upload frustum planes
        cullingShader.use();
        for (int i = 0; i < 6; i++) {
            cullingShader.setVec4("frustumPlanes[" + std::to_string(i) + "]",
                                   frustum.planes[i]);
        }

        // Reset counter
        uint32_t zero = 0;
        glBindBuffer(GL_ATOMIC_COUNTER_BUFFER, counterBuffer);
        glBufferSubData(GL_ATOMIC_COUNTER_BUFFER, 0, sizeof(uint32_t), &zero);

        // Dispatch compute shader
        glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 0, instanceBuffer);
        glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 1, visibleBuffer);
        glBindBufferBase(GL_ATOMIC_COUNTER_BUFFER, 0, counterBuffer);

        int numGroups = (instances.size() + 255) / 256;
        glDispatchCompute(numGroups, 1, 1);
        glMemoryBarrier(GL_SHADER_STORAGE_BARRIER_BIT | GL_ATOMIC_COUNTER_BARRIER_BIT);
    }
};
```

### Frustum Culling Compute Shader

```glsl
#version 450

layout(local_size_x = 256) in;

struct Instance {
    mat4 transform;
    vec4 boundingSphere;  // xyz = center, w = radius
};

layout(std430, binding = 0) readonly buffer InstanceBuffer {
    Instance instances[];
};

layout(std430, binding = 1) writeonly buffer VisibleBuffer {
    uint visibleIndices[];
};

layout(binding = 0, offset = 0) uniform atomic_uint visibleCount;

uniform vec4 frustumPlanes[6];

bool isVisible(vec4 sphere) {
    for (int i = 0; i < 6; i++) {
        float distance = dot(frustumPlanes[i].xyz, sphere.xyz) + frustumPlanes[i].w;
        if (distance < -sphere.w) {
            return false;  // Sphere is behind this plane
        }
    }
    return true;
}

void main() {
    uint idx = gl_GlobalInvocationID.x;

    if (idx >= instances.length()) return;

    Instance inst = instances[idx];
    vec4 worldCenter = inst.transform * vec4(inst.boundingSphere.xyz, 1.0);
    vec4 worldSphere = vec4(worldCenter.xyz, inst.boundingSphere.w);

    if (isVisible(worldSphere)) {
        uint visIdx = atomicCounterIncrement(visibleCount);
        visibleIndices[visIdx] = idx;
    }
}
```

### Terrain Streaming

```cpp
class TerrainStreamer {
public:
    struct TerrainTile {
        glm::ivec2 coord;
        int lodLevel;
        bool isLoaded;
        GLuint heightmapTexture;
        GLuint splatmapTexture;
    };

    std::unordered_map<glm::ivec2, TerrainTile> loadedTiles;
    std::queue<glm::ivec2> loadQueue;
    std::queue<glm::ivec2> unloadQueue;

    int tileSize = 256;
    int viewDistance = 5;  // Number of tiles

    void update(const glm::vec3& cameraPosition) {
        glm::ivec2 centerTile = worldToTile(cameraPosition);

        // Determine which tiles should be loaded
        std::set<glm::ivec2> requiredTiles;
        for (int dz = -viewDistance; dz <= viewDistance; dz++) {
            for (int dx = -viewDistance; dx <= viewDistance; dx++) {
                glm::ivec2 tileCoord = centerTile + glm::ivec2(dx, dz);
                requiredTiles.insert(tileCoord);
            }
        }

        // Queue unloading of tiles that are no longer needed
        for (auto& [coord, tile] : loadedTiles) {
            if (requiredTiles.find(coord) == requiredTiles.end()) {
                unloadQueue.push(coord);
            }
        }

        // Queue loading of new tiles
        for (const auto& coord : requiredTiles) {
            if (loadedTiles.find(coord) == loadedTiles.end()) {
                loadQueue.push(coord);
            }
        }

        // Process queues (limit per frame to avoid stutter)
        processLoadQueue(2);
        processUnloadQueue(2);
    }

private:
    glm::ivec2 worldToTile(const glm::vec3& worldPos) {
        return glm::ivec2(
            static_cast<int>(std::floor(worldPos.x / tileSize)),
            static_cast<int>(std::floor(worldPos.z / tileSize))
        );
    }

    void processLoadQueue(int maxPerFrame) {
        for (int i = 0; i < maxPerFrame && !loadQueue.empty(); i++) {
            glm::ivec2 coord = loadQueue.front();
            loadQueue.pop();

            // Load tile asynchronously
            loadTileAsync(coord);
        }
    }

    void loadTileAsync(glm::ivec2 coord) {
        // Construct file paths
        std::string heightmapPath = "terrain/height_" +
                                     std::to_string(coord.x) + "_" +
                                     std::to_string(coord.y) + ".raw";

        // Load in background thread
        std::async(std::launch::async, [this, coord, heightmapPath]() {
            // Load heightmap data
            std::vector<uint16_t> heightData = loadRawFile(heightmapPath);

            // Upload to GPU on main thread
            pendingUploads.push({coord, heightData});
        });
    }
};
```

---

## Best Practices and Optimization Summary

### Memory Management

```cpp
class TerrainMemoryManager {
public:
    // Use texture arrays for terrain layers
    GLuint layerTextureArray;
    int maxLayers = 16;
    int textureSize = 2048;

    void initializeTextureArray() {
        glGenTextures(1, &layerTextureArray);
        glBindTexture(GL_TEXTURE_2D_ARRAY, layerTextureArray);
        glTexStorage3D(GL_TEXTURE_2D_ARRAY,
                       getMipLevels(textureSize),
                       GL_RGBA8,
                       textureSize, textureSize, maxLayers);

        glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
        glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_WRAP_S, GL_REPEAT);
        glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_WRAP_T, GL_REPEAT);
    }

    void addLayer(int index, const std::string& path) {
        int width, height, channels;
        unsigned char* data = stbi_load(path.c_str(), &width, &height, &channels, 4);

        glBindTexture(GL_TEXTURE_2D_ARRAY, layerTextureArray);
        glTexSubImage3D(GL_TEXTURE_2D_ARRAY, 0,
                        0, 0, index,
                        width, height, 1,
                        GL_RGBA, GL_UNSIGNED_BYTE, data);

        glGenerateMipmap(GL_TEXTURE_2D_ARRAY);
        stbi_image_free(data);
    }
};
```

### Performance Checklist

1. **Geometry Optimization**
   - Use chunked LOD with geomorphing
   - Implement frustum culling for terrain chunks
   - Consider GPU-based tessellation for dynamic detail

2. **Texture Optimization**
   - Use texture arrays to reduce bind calls
   - Implement virtual texturing for large terrains
   - Compress textures with BC/DXT formats

3. **Vegetation Optimization**
   - Use instanced rendering for grass and foliage
   - Implement distance-based LOD for trees
   - Use impostors for distant vegetation

4. **Rendering Optimization**
   - Batch draw calls where possible
   - Use indirect rendering for variable instance counts
   - Implement occlusion culling for complex scenes

5. **Memory Optimization**
   - Stream terrain data based on camera position
   - Use appropriate precision (16-bit heights, 8-bit normals)
   - Implement texture streaming with priority queue

---

## Interview Topics

### Common Questions

**Q1: How does heightmap terrain work?**

```
A heightmap stores elevation data as grayscale values. Each pixel represents
a vertex position, where the brightness determines the Y coordinate. This
allows efficient storage (1 byte per vertex vs 12 bytes for full position)
and simple manipulation through image processing operations.
```

**Q2: Explain LOD systems for terrain.**

```
LOD (Level of Detail) reduces polygon count for distant terrain:

1. Discrete LOD: Swap between pre-built meshes at fixed distances
2. Continuous LOD: Dynamically adjust tessellation based on screen-space error
3. Clipmaps: Nested grids at different resolutions centered on camera
4. GPU Tessellation: Hardware-accelerated detail based on distance

Key considerations:
- Avoid visual "popping" with geomorphing
- Handle T-junction cracks between LOD levels
- Balance memory vs. computational cost
```

**Q3: How do you handle texture blending on terrain?**

```
Texture splatting uses control maps (splatmaps) to blend terrain textures:

1. Splatmap stores blend weights in RGBA channels (4 layers per map)
2. Sample all relevant layers at each pixel
3. Blend based on weights, optionally considering:
   - Height maps for realistic transitions
   - Slope for automatic rock placement
   - Noise for variation

Height-based blending creates more natural transitions by considering
the texture height at blend boundaries.
```

**Q4: Describe grass rendering techniques.**

```
Efficient grass rendering strategies:

1. Geometry Instancing: Single blade geometry drawn thousands of times
2. Billboard: Camera-facing quads with alpha-tested grass texture
3. Billboards with cross-sections: Two perpendicular quads
4. Mesh with LOD: Full 3D blades nearby, simpler geometry far away

Optimization techniques:
- GPU-based culling and LOD selection
- Shader-based wind animation
- Distance-based density reduction
- Hierarchical culling with spatial partitioning
```

**Q5: How does atmospheric scattering work?**

```
Atmospheric scattering simulates how light interacts with air:

Rayleigh Scattering (small particles):
- Wavelength-dependent (blue scattered more)
- Creates blue sky and orange sunsets

Mie Scattering (larger particles):
- Wavelength-independent
- Creates sun halos and bright sky near horizon

Implementation:
1. March rays through atmosphere
2. Calculate optical depth (accumulated density)
3. Apply phase functions for angular distribution
4. Integrate scattering and absorption along path
```

---

## Summary

Terrain rendering is a multifaceted challenge that combines several computer graphics techniques to create believable outdoor environments. Key takeaways include:

1. **Heightmaps** provide efficient storage and manipulation of terrain geometry
2. **LOD systems** are essential for maintaining performance at scale
3. **Texture splatting** with height-based blending creates natural material transitions
4. **GPU instancing** enables dense vegetation rendering
5. **Atmospheric effects** add depth and realism to outdoor scenes
6. **Water rendering** requires reflection, refraction, and wave simulation
7. **Streaming systems** enable truly massive terrains

Modern terrain systems increasingly leverage GPU compute capabilities for culling, LOD selection, and procedural generation. Understanding these fundamentals provides a foundation for implementing or customizing terrain systems for specific game requirements.
