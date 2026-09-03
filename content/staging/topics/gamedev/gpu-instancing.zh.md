---
title: GPU 实例化与批处理渲染
description: 优化渲染性能：批处理、GPU实例化和Draw Call优化
track: gamedev
section: performance
difficulty: advanced
tags:
  - GPU
  - 实例化
  - 批处理
  - 渲染优化
status: imported
origin: old/src/content/docs/gamedev/gpu-instancing.zh.md
divergence: 0.2
issues:
  - title-lang-en
  - title-language
legacy:
  category: GameDev
  subcategory: Optimization
  order: 36
  lastUpdated: 2026-01-07
---

在游戏和实时图形应用中，渲染性能往往是决定用户体验的关键因素。当场景中存在成千上万个物体时，如何高效地将它们渲染到屏幕上，成为每个图形程序员必须面对的挑战。本文将深入探讨 GPU 实例化（GPU Instancing）、批处理（Batching）以及相关的渲染优化技术，帮助你构建高性能的渲染系统。

## 概念解释：为什么需要渲染优化

### 渲染瓶颈的本质

现代图形渲染是一个 CPU 与 GPU 协同工作的过程。理解这个协作机制，是进行渲染优化的基础：

```
渲染流程简图：

CPU 端                           GPU 端
┌─────────────┐                 ┌─────────────┐
│  游戏逻辑    │                 │  顶点着色器  │
│  场景遍历    │    Draw Call    │  光栅化      │
│  状态设置    │  ──────────►   │  片元着色器  │
│  数据准备    │                 │  后处理      │
└─────────────┘                 └─────────────┘
```

**性能瓶颈通常出现在以下几个方面：**

1. **Draw Call 开销**：每次绘制调用都需要 CPU 准备数据、设置状态、与 GPU 通信
2. **状态切换成本**：切换材质、纹理、着色器等会打断 GPU 的流水线
3. **数据传输带宽**：CPU 到 GPU 的数据传输是相对昂贵的操作
4. **GPU 利用率**：小批量绘制无法充分利用 GPU 的并行处理能力

### Draw Call 的真实成本

```csharp
// 这段伪代码展示了一次 Draw Call 背后发生的事情
void ExecuteDrawCall(Mesh mesh, Material material)
{
    // 1. CPU 端准备（开销大）
    ValidateRenderState();           // 验证渲染状态
    BindVertexBuffer(mesh.vertices); // 绑定顶点缓冲
    BindIndexBuffer(mesh.indices);   // 绑定索引缓冲
    BindShader(material.shader);     // 绑定着色器
    BindTextures(material.textures); // 绑定纹理
    SetUniforms(material.properties);// 设置 Uniform 变量

    // 2. 驱动层处理（开销大）
    TranslateToGPUCommands();        // 转换为 GPU 命令
    ValidateAndOptimize();           // 验证和优化命令

    // 3. 命令提交（开销中等）
    SubmitToCommandBuffer();         // 提交到命令缓冲

    // 4. GPU 执行（开销相对较小）
    GPU.Execute();                   // GPU 执行绑定的绘制
}
```

一个典型的 Draw Call 在桌面平台可能需要 0.1-1 毫秒的 CPU 时间，而在移动平台上可能更高。如果场景有 1000 个独立物体，仅 Draw Call 就可能消耗 100-1000 毫秒，远超 60 FPS 所需的 16.67 毫秒帧预算。

## Draw Call 原理深度解析

### 什么是 Draw Call

Draw Call（绘制调用）是 CPU 向 GPU 发送的渲染指令。每次调用都会触发 GPU 绑定资源、执行着色器、输出像素的完整流程。

```cpp
// OpenGL 中典型的 Draw Call
glDrawElements(GL_TRIANGLES, indexCount, GL_UNSIGNED_INT, 0);

// DirectX 11 中的 Draw Call
deviceContext->DrawIndexed(indexCount, startIndex, baseVertex);

// Vulkan 中的 Draw Call
vkCmdDrawIndexed(commandBuffer, indexCount, instanceCount,
                 firstIndex, vertexOffset, firstInstance);
```

### Draw Call 的组成要素

```cpp
// 一次完整的渲染提交包含以下要素
struct DrawCallState
{
    // 几何数据
    VertexBuffer* vertexBuffer;      // 顶点数据
    IndexBuffer* indexBuffer;        // 索引数据
    PrimitiveTopology topology;      // 图元类型（三角形、线等）

    // 着色器程序
    ShaderProgram* shaderProgram;    // 顶点+片元着色器

    // 渲染状态
    BlendState blendState;           // 混合状态
    DepthStencilState depthState;    // 深度模板状态
    RasterizerState rasterizerState; // 光栅化状态

    // 资源绑定
    Texture* textures[MAX_TEXTURES]; // 纹理数组
    Buffer* constantBuffers[MAX_CB]; // 常量缓冲区
    Sampler* samplers[MAX_SAMPLERS]; // 采样器

    // 变换矩阵（通常通过常量缓冲区传递）
    Matrix4x4 worldMatrix;
    Matrix4x4 viewMatrix;
    Matrix4x4 projectionMatrix;
};
```

### 状态切换的代价

```cpp
// 不同类型的状态切换成本（相对值，仅供参考）
//
// 操作类型                    相对成本
// ──────────────────────────────────
// 切换渲染目标                 1000
// 切换着色器程序               100
// 切换纹理                     50
// 切换顶点缓冲                 20
// 更新常量缓冲                 10
// 更新 Uniform                 5
// 同材质的 Draw Call           1

// 优化策略：按状态切换成本排序渲染
void OptimizedRender(std::vector<RenderCommand>& commands)
{
    // 按渲染目标分组
    std::sort(commands.begin(), commands.end(),
        [](const RenderCommand& a, const RenderCommand& b) {
            if (a.renderTarget != b.renderTarget)
                return a.renderTarget < b.renderTarget;
            if (a.shader != b.shader)
                return a.shader < b.shader;
            if (a.material != b.material)
                return a.material < b.material;
            return a.mesh < b.mesh;
        });

    // 执行排序后的渲染命令
    for (const auto& cmd : commands) {
        ExecuteRenderCommand(cmd);
    }
}
```

## 静态批处理（Static Batching）

### 原理与实现

静态批处理将多个静态物体的网格合并成一个大网格，从而将多次 Draw Call 合并为一次。

```csharp
// Unity 风格的静态批处理实现
public class StaticBatcher
{
    public static Mesh CombineMeshes(GameObject[] objects)
    {
        // 收集所有 MeshFilter
        List<CombineInstance> combineInstances = new List<CombineInstance>();

        foreach (var obj in objects)
        {
            MeshFilter mf = obj.GetComponent<MeshFilter>();
            MeshRenderer mr = obj.GetComponent<MeshRenderer>();

            if (mf == null || mr == null) continue;

            CombineInstance ci = new CombineInstance();
            ci.mesh = mf.sharedMesh;
            ci.transform = obj.transform.localToWorldMatrix;
            combineInstances.Add(ci);
        }

        // 创建合并后的网格
        Mesh combinedMesh = new Mesh();
        combinedMesh.CombineMeshes(combineInstances.ToArray(), true, true);

        return combinedMesh;
    }
}
```

### 底层实现细节

```cpp
// C++ 底层的网格合并实现
struct CombinedMesh
{
    std::vector<Vertex> vertices;
    std::vector<uint32_t> indices;

    void AddMesh(const Mesh& mesh, const Matrix4x4& transform)
    {
        uint32_t baseVertex = static_cast<uint32_t>(vertices.size());

        // 变换并添加顶点
        for (const auto& vertex : mesh.vertices)
        {
            Vertex transformedVertex;
            transformedVertex.position = transform.TransformPoint(vertex.position);
            transformedVertex.normal = transform.TransformNormal(vertex.normal);
            transformedVertex.uv = vertex.uv;
            transformedVertex.color = vertex.color;
            vertices.push_back(transformedVertex);
        }

        // 添加偏移后的索引
        for (uint32_t index : mesh.indices)
        {
            indices.push_back(baseVertex + index);
        }
    }

    void Upload()
    {
        // 上传到 GPU
        glGenBuffers(1, &vbo);
        glBindBuffer(GL_ARRAY_BUFFER, vbo);
        glBufferData(GL_ARRAY_BUFFER,
                     vertices.size() * sizeof(Vertex),
                     vertices.data(),
                     GL_STATIC_DRAW);

        glGenBuffers(1, &ibo);
        glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ibo);
        glBufferData(GL_ELEMENT_ARRAY_BUFFER,
                     indices.size() * sizeof(uint32_t),
                     indices.data(),
                     GL_STATIC_DRAW);
    }
};
```

### 静态批处理的优缺点

```
优点：
┌─────────────────────────────────────────────────────────┐
│ + Draw Call 显著减少                                     │
│ + 运行时无额外 CPU 开销                                  │
│ + 对 GPU 友好，可以高效处理大批量顶点                    │
│ + 支持不同的子网格使用不同材质                           │
└─────────────────────────────────────────────────────────┘

缺点：
┌─────────────────────────────────────────────────────────┐
│ - 增加内存占用（每个实例都有独立的顶点数据）             │
│ - 物体必须是静态的，不能移动、旋转、缩放                 │
│ - 合并后的网格可能超出顶点数量限制（65535 for 16-bit）   │
│ - 无法利用遮挡剔除优化单个物体                           │
│ - 构建时间较长                                           │
└─────────────────────────────────────────────────────────┘
```

### 实际应用场景

```csharp
// 适合静态批处理的场景
public class StaticBatchingExample : MonoBehaviour
{
    void Start()
    {
        // 场景中的静态环境物体
        // - 建筑物、围墙、地形装饰
        // - 路灯、长椅等街道设施
        // - 石头、树桩等自然物体

        // 标记为静态
        foreach (var obj in environmentObjects)
        {
            obj.isStatic = true;
        }

        // Unity 会在构建时自动进行静态批处理
        // 或者可以在运行时手动触发
        StaticBatchingUtility.Combine(gameObject);
    }
}
```

## 动态批处理（Dynamic Batching）

### 原理与限制

动态批处理在运行时将小型动态物体合并渲染，无需预处理。

```csharp
// 动态批处理的条件检查
public class DynamicBatchingChecker
{
    public static bool CanBeDynamicallyBatched(Mesh mesh, Material material)
    {
        // 检查顶点数量限制
        // Unity: 顶点属性总数不超过 900
        // 例如：位置(3) + 法线(3) + UV(2) = 8，则最多 900/8 = 112 顶点
        int attributeCount = GetVertexAttributeCount(mesh);
        int maxVertices = 900 / attributeCount;

        if (mesh.vertexCount > maxVertices)
            return false;

        // 检查是否使用实例化
        if (material.enableInstancing)
            return false;

        // 检查是否有多个 Pass
        if (material.passCount > 1)
            return false;

        // 检查缩放
        // 不同缩放值（包括负缩放）的物体不能批处理
        // 除非使用相同的缩放

        return true;
    }

    private static int GetVertexAttributeCount(Mesh mesh)
    {
        int count = 3; // 位置始终存在
        if (mesh.normals.Length > 0) count += 3;
        if (mesh.tangents.Length > 0) count += 4;
        if (mesh.uv.Length > 0) count += 2;
        if (mesh.uv2.Length > 0) count += 2;
        if (mesh.colors.Length > 0) count += 4;
        return count;
    }
}
```

### 动态批处理的实现

```cpp
// 简化的动态批处理实现
class DynamicBatcher
{
private:
    struct BatchData
    {
        std::vector<Vertex> vertices;
        std::vector<uint32_t> indices;
        Material* material;
        uint32_t drawCount;
    };

    std::unordered_map<Material*, BatchData> batches;

    // 动态顶点缓冲（每帧重用）
    GLuint dynamicVBO;
    GLuint dynamicIBO;
    size_t vboCapacity;
    size_t iboCapacity;

public:
    void BeginFrame()
    {
        // 清空上一帧的批次数据
        for (auto& pair : batches)
        {
            pair.second.vertices.clear();
            pair.second.indices.clear();
            pair.second.drawCount = 0;
        }
    }

    void AddToBatch(const Mesh& mesh, const Matrix4x4& transform,
                    Material* material)
    {
        // 检查是否可以批处理
        if (mesh.vertexCount > MAX_DYNAMIC_BATCH_VERTICES)
            return;

        BatchData& batch = batches[material];
        uint32_t baseVertex = static_cast<uint32_t>(batch.vertices.size());

        // CPU 端变换顶点（动态批处理的主要开销）
        for (const auto& v : mesh.vertices)
        {
            Vertex transformed;
            transformed.position = transform.TransformPoint(v.position);
            transformed.normal = transform.TransformNormal(v.normal);
            transformed.uv = v.uv;
            batch.vertices.push_back(transformed);
        }

        for (uint32_t idx : mesh.indices)
        {
            batch.indices.push_back(baseVertex + idx);
        }

        batch.drawCount++;
    }

    void Flush()
    {
        for (auto& pair : batches)
        {
            if (pair.second.vertices.empty())
                continue;

            BatchData& batch = pair.second;

            // 更新动态缓冲
            glBindBuffer(GL_ARRAY_BUFFER, dynamicVBO);
            glBufferSubData(GL_ARRAY_BUFFER, 0,
                           batch.vertices.size() * sizeof(Vertex),
                           batch.vertices.data());

            glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, dynamicIBO);
            glBufferSubData(GL_ELEMENT_ARRAY_BUFFER, 0,
                           batch.indices.size() * sizeof(uint32_t),
                           batch.indices.data());

            // 绑定材质并绘制
            batch.material->Bind();
            glDrawElements(GL_TRIANGLES,
                          static_cast<GLsizei>(batch.indices.size()),
                          GL_UNSIGNED_INT, 0);
        }
    }
};
```

### 动态批处理 vs 静态批处理

```
对比分析：
                    静态批处理              动态批处理
─────────────────────────────────────────────────────────
内存开销            高（顶点数据翻倍）       低（共享原始网格）
CPU 开销            无（预处理完成）         中等（每帧变换顶点）
适用物体            静态物体                 动态小物体
顶点数限制          仅受 GPU 限制            严格限制（~300顶点）
缩放支持            支持任意缩放             相同缩放才能批处理
材质要求            相同材质                 相同材质
推荐场景            大型静态场景             粒子、UI、小道具
```

## GPU Instancing（GPU 实例化）

### 核心概念

GPU Instancing 是最强大的批处理技术，允许在一次 Draw Call 中绘制多个具有不同变换和属性的相同网格。

```
传统渲染 vs GPU Instancing：

传统渲染（N 个物体 = N 次 Draw Call）：
┌─────┐  ┌─────┐  ┌─────┐      ┌─────┐
│ DC1 │  │ DC2 │  │ DC3 │ .... │ DCN │
└─────┘  └─────┘  └─────┘      └─────┘
   │        │        │            │
   ▼        ▼        ▼            ▼
  GPU      GPU      GPU          GPU

GPU Instancing（N 个物体 = 1 次 Draw Call）：
┌───────────────────────────────────────┐
│           Single Draw Call            │
│  Instance 0, 1, 2, 3, ... N-1        │
└───────────────────────────────────────┘
                    │
                    ▼
                   GPU (并行处理所有实例)
```

### OpenGL 实现

```cpp
// OpenGL GPU Instancing 完整实现
class InstancedRenderer
{
private:
    GLuint vao;
    GLuint meshVBO;       // 网格顶点数据
    GLuint meshIBO;       // 网格索引数据
    GLuint instanceVBO;   // 实例数据（变换矩阵等）

    struct InstanceData
    {
        glm::mat4 modelMatrix;      // 模型矩阵
        glm::vec4 color;            // 实例颜色
        glm::vec4 customData;       // 自定义数据
    };

    std::vector<InstanceData> instances;

public:
    void Initialize(const Mesh& mesh)
    {
        glGenVertexArrays(1, &vao);
        glBindVertexArray(vao);

        // 设置网格顶点数据
        glGenBuffers(1, &meshVBO);
        glBindBuffer(GL_ARRAY_BUFFER, meshVBO);
        glBufferData(GL_ARRAY_BUFFER,
                     mesh.vertices.size() * sizeof(Vertex),
                     mesh.vertices.data(), GL_STATIC_DRAW);

        // 顶点属性 0: 位置
        glEnableVertexAttribArray(0);
        glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE,
                              sizeof(Vertex), (void*)offsetof(Vertex, position));

        // 顶点属性 1: 法线
        glEnableVertexAttribArray(1);
        glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE,
                              sizeof(Vertex), (void*)offsetof(Vertex, normal));

        // 顶点属性 2: UV
        glEnableVertexAttribArray(2);
        glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE,
                              sizeof(Vertex), (void*)offsetof(Vertex, uv));

        // 设置索引数据
        glGenBuffers(1, &meshIBO);
        glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, meshIBO);
        glBufferData(GL_ELEMENT_ARRAY_BUFFER,
                     mesh.indices.size() * sizeof(uint32_t),
                     mesh.indices.data(), GL_STATIC_DRAW);

        // 设置实例数据缓冲
        glGenBuffers(1, &instanceVBO);
        glBindBuffer(GL_ARRAY_BUFFER, instanceVBO);

        // 实例矩阵（mat4 需要 4 个 vec4 属性槽位）
        for (int i = 0; i < 4; i++)
        {
            glEnableVertexAttribArray(3 + i);
            glVertexAttribPointer(3 + i, 4, GL_FLOAT, GL_FALSE,
                                  sizeof(InstanceData),
                                  (void*)(offsetof(InstanceData, modelMatrix) +
                                         i * sizeof(glm::vec4)));
            glVertexAttribDivisor(3 + i, 1);  // 关键：每个实例更新一次
        }

        // 实例颜色
        glEnableVertexAttribArray(7);
        glVertexAttribPointer(7, 4, GL_FLOAT, GL_FALSE,
                              sizeof(InstanceData),
                              (void*)offsetof(InstanceData, color));
        glVertexAttribDivisor(7, 1);

        // 自定义数据
        glEnableVertexAttribArray(8);
        glVertexAttribPointer(8, 4, GL_FLOAT, GL_FALSE,
                              sizeof(InstanceData),
                              (void*)offsetof(InstanceData, customData));
        glVertexAttribDivisor(8, 1);

        glBindVertexArray(0);
    }

    void UpdateInstances(const std::vector<InstanceData>& newInstances)
    {
        instances = newInstances;

        glBindBuffer(GL_ARRAY_BUFFER, instanceVBO);
        glBufferData(GL_ARRAY_BUFFER,
                     instances.size() * sizeof(InstanceData),
                     instances.data(), GL_DYNAMIC_DRAW);
    }

    void Draw(GLuint shader, int indexCount)
    {
        glUseProgram(shader);
        glBindVertexArray(vao);

        // 一次 Draw Call 绘制所有实例
        glDrawElementsInstanced(GL_TRIANGLES, indexCount,
                                GL_UNSIGNED_INT, 0,
                                static_cast<GLsizei>(instances.size()));

        glBindVertexArray(0);
    }
};
```

### 着色器实现

```glsl
// 顶点着色器 (instanced.vert)
#version 330 core

// 网格顶点属性
layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoord;

// 实例属性
layout(location = 3) in mat4 aModelMatrix;  // 占用 location 3, 4, 5, 6
layout(location = 7) in vec4 aInstanceColor;
layout(location = 8) in vec4 aCustomData;

// Uniform
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

// 输出到片元着色器
out vec3 vWorldPosition;
out vec3 vWorldNormal;
out vec2 vTexCoord;
out vec4 vInstanceColor;
out vec4 vCustomData;

void main()
{
    // 使用实例矩阵变换顶点
    vec4 worldPos = aModelMatrix * vec4(aPosition, 1.0);
    vWorldPosition = worldPos.xyz;

    // 变换法线（假设统一缩放，否则需要逆转置矩阵）
    mat3 normalMatrix = mat3(aModelMatrix);
    vWorldNormal = normalize(normalMatrix * aNormal);

    vTexCoord = aTexCoord;
    vInstanceColor = aInstanceColor;
    vCustomData = aCustomData;

    gl_Position = uProjectionMatrix * uViewMatrix * worldPos;
}
```

```glsl
// 片元着色器 (instanced.frag)
#version 330 core

in vec3 vWorldPosition;
in vec3 vWorldNormal;
in vec2 vTexCoord;
in vec4 vInstanceColor;
in vec4 vCustomData;

out vec4 FragColor;

uniform sampler2D uMainTexture;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform vec3 uAmbientColor;

void main()
{
    // 采样纹理
    vec4 texColor = texture(uMainTexture, vTexCoord);

    // 应用实例颜色
    vec3 baseColor = texColor.rgb * vInstanceColor.rgb;

    // 简单的兰伯特光照
    float NdotL = max(dot(vWorldNormal, -uLightDirection), 0.0);
    vec3 diffuse = baseColor * uLightColor * NdotL;
    vec3 ambient = baseColor * uAmbientColor;

    // 使用自定义数据（例如：发光强度）
    float emissive = vCustomData.x;
    vec3 finalColor = ambient + diffuse + baseColor * emissive;

    FragColor = vec4(finalColor, texColor.a * vInstanceColor.a);
}
```

### Unity 中的 GPU Instancing

```csharp
// Unity 中使用 GPU Instancing
public class UnityInstancingExample : MonoBehaviour
{
    public Mesh instanceMesh;
    public Material instanceMaterial;
    public int instanceCount = 10000;

    private Matrix4x4[] matrices;
    private MaterialPropertyBlock propertyBlock;
    private Vector4[] colors;

    void Start()
    {
        // 确保材质支持实例化
        instanceMaterial.enableInstancing = true;

        matrices = new Matrix4x4[instanceCount];
        colors = new Vector4[instanceCount];
        propertyBlock = new MaterialPropertyBlock();

        // 初始化实例数据
        for (int i = 0; i < instanceCount; i++)
        {
            Vector3 position = new Vector3(
                Random.Range(-50f, 50f),
                Random.Range(0f, 10f),
                Random.Range(-50f, 50f)
            );

            Quaternion rotation = Random.rotation;
            Vector3 scale = Vector3.one * Random.Range(0.5f, 1.5f);

            matrices[i] = Matrix4x4.TRS(position, rotation, scale);
            colors[i] = new Vector4(
                Random.value, Random.value, Random.value, 1f
            );
        }
    }

    void Update()
    {
        // 设置实例属性
        propertyBlock.SetVectorArray("_Color", colors);

        // 批量绘制（自动分批，每批最多 1023 个实例）
        Graphics.DrawMeshInstanced(
            instanceMesh,
            0,                  // submesh index
            instanceMaterial,
            matrices,
            instanceCount,
            propertyBlock,
            UnityEngine.Rendering.ShadowCastingMode.On,
            true,               // receive shadows
            0,                  // layer
            null,               // camera (null = all cameras)
            UnityEngine.Rendering.LightProbeUsage.BlendProbes
        );
    }
}
```

### 自定义实例化着色器（Unity）

```hlsl
// Unity 实例化着色器
Shader "Custom/GPUInstancing"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _Color ("Color", Color) = (1,1,1,1)
    }

    SubShader
    {
        Tags { "RenderType"="Opaque" }

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile_instancing

            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float3 normal : NORMAL;
                float2 uv : TEXCOORD0;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 worldNormal : TEXCOORD1;
                float3 worldPos : TEXCOORD2;
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;

            // 声明实例化属性
            UNITY_INSTANCING_BUFFER_START(Props)
                UNITY_DEFINE_INSTANCED_PROP(float4, _Color)
                UNITY_DEFINE_INSTANCED_PROP(float, _Metallic)
                UNITY_DEFINE_INSTANCED_PROP(float, _Glossiness)
            UNITY_INSTANCING_BUFFER_END(Props)

            v2f vert(appdata v)
            {
                v2f o;

                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_TRANSFER_INSTANCE_ID(v, o);

                o.pos = UnityObjectToClipPos(v.vertex);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                o.worldNormal = UnityObjectToWorldNormal(v.normal);
                o.worldPos = mul(unity_ObjectToWorld, v.vertex).xyz;

                return o;
            }

            fixed4 frag(v2f i) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(i);

                fixed4 texColor = tex2D(_MainTex, i.uv);
                fixed4 instanceColor = UNITY_ACCESS_INSTANCED_PROP(Props, _Color);

                // 简单光照
                float3 lightDir = normalize(_WorldSpaceLightPos0.xyz);
                float NdotL = max(0, dot(i.worldNormal, lightDir));

                fixed4 finalColor = texColor * instanceColor;
                finalColor.rgb *= (NdotL * 0.5 + 0.5); // Half Lambert

                return finalColor;
            }
            ENDCG
        }
    }
}
```

## Indirect Rendering（间接渲染）

### 概念介绍

间接渲染是 GPU 驱动渲染的高级形式，绘制参数存储在 GPU 缓冲区中，由 GPU 自主决定绘制内容和数量。

```cpp
// 间接绘制命令结构（OpenGL/Vulkan）
struct DrawElementsIndirectCommand
{
    uint32_t count;         // 索引数量
    uint32_t instanceCount; // 实例数量（由 GPU 计算）
    uint32_t firstIndex;    // 起始索引
    int32_t  baseVertex;    // 顶点偏移
    uint32_t baseInstance;  // 实例偏移
};

struct DrawArraysIndirectCommand
{
    uint32_t count;         // 顶点数量
    uint32_t instanceCount; // 实例数量
    uint32_t first;         // 起始顶点
    uint32_t baseInstance;  // 实例偏移
};
```

### OpenGL 间接渲染实现

```cpp
class IndirectRenderer
{
private:
    GLuint indirectBuffer;
    GLuint instanceBuffer;
    GLuint visibilityBuffer;  // 可见性标记（由 Compute Shader 更新）

    struct IndirectDrawCommand
    {
        uint32_t count;
        uint32_t instanceCount;
        uint32_t firstIndex;
        int32_t baseVertex;
        uint32_t baseInstance;
    };

public:
    void Initialize(size_t maxInstances)
    {
        // 创建间接命令缓冲
        glGenBuffers(1, &indirectBuffer);
        glBindBuffer(GL_DRAW_INDIRECT_BUFFER, indirectBuffer);
        glBufferData(GL_DRAW_INDIRECT_BUFFER,
                     sizeof(IndirectDrawCommand),
                     nullptr, GL_DYNAMIC_DRAW);

        // 创建实例数据缓冲
        glGenBuffers(1, &instanceBuffer);
        glBindBuffer(GL_SHADER_STORAGE_BUFFER, instanceBuffer);
        glBufferData(GL_SHADER_STORAGE_BUFFER,
                     maxInstances * sizeof(InstanceData),
                     nullptr, GL_DYNAMIC_DRAW);

        // 创建可见性缓冲
        glGenBuffers(1, &visibilityBuffer);
        glBindBuffer(GL_SHADER_STORAGE_BUFFER, visibilityBuffer);
        glBufferData(GL_SHADER_STORAGE_BUFFER,
                     maxInstances * sizeof(uint32_t),
                     nullptr, GL_DYNAMIC_DRAW);
    }

    void CullAndDraw(GLuint cullShader, GLuint renderShader,
                     const Frustum& frustum, int indexCount)
    {
        // 第一步：GPU 视锥体剔除
        glUseProgram(cullShader);

        // 绑定缓冲区
        glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 0, instanceBuffer);
        glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 1, visibilityBuffer);
        glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 2, indirectBuffer);

        // 设置视锥体平面
        SetFrustumUniforms(cullShader, frustum);

        // 执行剔除
        glDispatchCompute((instanceCount + 63) / 64, 1, 1);
        glMemoryBarrier(GL_COMMAND_BARRIER_BIT | GL_SHADER_STORAGE_BARRIER_BIT);

        // 第二步：间接渲染
        glUseProgram(renderShader);
        glBindVertexArray(vao);
        glBindBuffer(GL_DRAW_INDIRECT_BUFFER, indirectBuffer);

        glDrawElementsIndirect(GL_TRIANGLES, GL_UNSIGNED_INT, 0);
    }
};
```

### GPU 剔除计算着色器

```glsl
// GPU 视锥体剔除计算着色器
#version 450

layout(local_size_x = 64) in;

// 实例数据
struct InstanceData
{
    mat4 modelMatrix;
    vec4 boundingSphere;  // xyz: center, w: radius
    vec4 color;
};

// 缓冲区绑定
layout(std430, binding = 0) readonly buffer InstanceBuffer
{
    InstanceData instances[];
};

layout(std430, binding = 1) writeonly buffer VisibleBuffer
{
    uint visibleIndices[];
};

layout(std430, binding = 2) buffer IndirectBuffer
{
    uint indexCount;
    uint instanceCount;
    uint firstIndex;
    int baseVertex;
    uint baseInstance;
} drawCommand;

// Uniform
uniform vec4 frustumPlanes[6];
uniform uint totalInstances;
uniform uint meshIndexCount;

// 原子计数器
layout(binding = 0, offset = 0) uniform atomic_uint visibleCount;

// 检查球体是否在视锥体内
bool IsInFrustum(vec3 center, float radius)
{
    for (int i = 0; i < 6; i++)
    {
        float distance = dot(frustumPlanes[i].xyz, center) + frustumPlanes[i].w;
        if (distance < -radius)
            return false;
    }
    return true;
}

void main()
{
    uint instanceId = gl_GlobalInvocationID.x;

    if (instanceId >= totalInstances)
        return;

    InstanceData instance = instances[instanceId];

    // 将包围球变换到世界空间
    vec3 worldCenter = (instance.modelMatrix * vec4(instance.boundingSphere.xyz, 1.0)).xyz;
    float worldRadius = instance.boundingSphere.w *
                        length(instance.modelMatrix[0].xyz); // 假设统一缩放

    // 视锥体剔除
    if (IsInFrustum(worldCenter, worldRadius))
    {
        // 原子增加可见数量并获取索引
        uint visibleIndex = atomicCounterIncrement(visibleCount);
        visibleIndices[visibleIndex] = instanceId;
    }
}

// 第二遍：压缩可见实例并更新绘制命令
#version 450

layout(local_size_x = 1) in;

layout(std430, binding = 2) buffer IndirectBuffer
{
    uint indexCount;
    uint instanceCount;
    uint firstIndex;
    int baseVertex;
    uint baseInstance;
} drawCommand;

layout(binding = 0, offset = 0) uniform atomic_uint visibleCount;
uniform uint meshIndexCount;

void main()
{
    // 更新绘制命令
    drawCommand.indexCount = meshIndexCount;
    drawCommand.instanceCount = atomicCounter(visibleCount);
    drawCommand.firstIndex = 0;
    drawCommand.baseVertex = 0;
    drawCommand.baseInstance = 0;

    // 重置计数器
    atomicCounterExchange(visibleCount, 0);
}
```

### Multi-Draw Indirect

```cpp
// 一次调用绘制多种不同网格
class MultiDrawIndirectRenderer
{
private:
    struct MeshData
    {
        uint32_t indexCount;
        uint32_t indexOffset;
        int32_t vertexOffset;
    };

    std::vector<MeshData> meshes;
    std::vector<DrawElementsIndirectCommand> commands;
    GLuint commandBuffer;

public:
    void Initialize(const std::vector<Mesh>& meshList)
    {
        // 合并所有网格到一个大缓冲区
        std::vector<Vertex> allVertices;
        std::vector<uint32_t> allIndices;

        for (const auto& mesh : meshList)
        {
            MeshData data;
            data.vertexOffset = static_cast<int32_t>(allVertices.size());
            data.indexOffset = static_cast<uint32_t>(allIndices.size());
            data.indexCount = static_cast<uint32_t>(mesh.indices.size());

            allVertices.insert(allVertices.end(),
                              mesh.vertices.begin(), mesh.vertices.end());
            allIndices.insert(allIndices.end(),
                             mesh.indices.begin(), mesh.indices.end());

            meshes.push_back(data);
        }

        // 上传合并的网格数据
        UploadMeshData(allVertices, allIndices);

        // 创建命令缓冲
        glGenBuffers(1, &commandBuffer);
    }

    void Draw(const std::vector<RenderBatch>& batches)
    {
        // 构建绘制命令
        commands.clear();
        for (const auto& batch : batches)
        {
            const MeshData& mesh = meshes[batch.meshIndex];

            DrawElementsIndirectCommand cmd;
            cmd.count = mesh.indexCount;
            cmd.instanceCount = batch.instanceCount;
            cmd.firstIndex = mesh.indexOffset;
            cmd.baseVertex = mesh.vertexOffset;
            cmd.baseInstance = batch.baseInstance;

            commands.push_back(cmd);
        }

        // 上传命令
        glBindBuffer(GL_DRAW_INDIRECT_BUFFER, commandBuffer);
        glBufferData(GL_DRAW_INDIRECT_BUFFER,
                     commands.size() * sizeof(DrawElementsIndirectCommand),
                     commands.data(), GL_DYNAMIC_DRAW);

        // 一次调用绘制所有批次
        glMultiDrawElementsIndirect(
            GL_TRIANGLES,
            GL_UNSIGNED_INT,
            nullptr,
            static_cast<GLsizei>(commands.size()),
            sizeof(DrawElementsIndirectCommand)
        );
    }
};
```

## 纹理图集（Texture Atlas）

### 概念与优势

纹理图集将多个小纹理合并成一张大纹理，减少纹理切换开销。

```
传统方式：每个物体使用独立纹理
┌────┐ ┌────┐ ┌────┐ ┌────┐
│Tex1│ │Tex2│ │Tex3│ │Tex4│   4次纹理绑定
└────┘ └────┘ └────┘ └────┘

纹理图集：所有纹理合并为一张
┌────────────────┐
│  ┌──┐  ┌──┐   │
│  │T1│  │T2│   │   1次纹理绑定
│  └──┘  └──┘   │
│  ┌──┐  ┌──┐   │
│  │T3│  │T4│   │
│  └──┘  └──┘   │
└────────────────┘
```

### 纹理图集生成器

```cpp
class TextureAtlasGenerator
{
public:
    struct AtlasRegion
    {
        int x, y;           // 在图集中的位置
        int width, height;  // 纹理尺寸
        float u0, v0;       // UV 左下角
        float u1, v1;       // UV 右上角
    };

private:
    int atlasWidth;
    int atlasHeight;
    std::vector<uint8_t> atlasData;
    std::vector<bool> occupancy;
    std::map<std::string, AtlasRegion> regions;
    int padding;

public:
    TextureAtlasGenerator(int width, int height, int pad = 2)
        : atlasWidth(width), atlasHeight(height), padding(pad)
    {
        atlasData.resize(width * height * 4, 0);
        occupancy.resize(width * height, false);
    }

    bool AddTexture(const std::string& name, const Texture& texture)
    {
        int padWidth = texture.width + padding * 2;
        int padHeight = texture.height + padding * 2;

        // 查找空闲区域（简单的行优先放置算法）
        int posX = -1, posY = -1;
        if (!FindFreeRegion(padWidth, padHeight, posX, posY))
            return false;

        // 复制纹理数据（带边缘扩展以避免采样时的接缝）
        CopyWithPadding(texture, posX + padding, posY + padding);

        // 标记占用
        MarkOccupied(posX, posY, padWidth, padHeight);

        // 记录区域信息
        AtlasRegion region;
        region.x = posX + padding;
        region.y = posY + padding;
        region.width = texture.width;
        region.height = texture.height;
        region.u0 = static_cast<float>(region.x) / atlasWidth;
        region.v0 = static_cast<float>(region.y) / atlasHeight;
        region.u1 = static_cast<float>(region.x + region.width) / atlasWidth;
        region.v1 = static_cast<float>(region.y + region.height) / atlasHeight;

        regions[name] = region;
        return true;
    }

    // 转换原始 UV 到图集 UV
    glm::vec2 TransformUV(const std::string& textureName, const glm::vec2& uv) const
    {
        auto it = regions.find(textureName);
        if (it == regions.end())
            return uv;

        const AtlasRegion& r = it->second;
        return glm::vec2(
            r.u0 + uv.x * (r.u1 - r.u0),
            r.v0 + uv.y * (r.v1 - r.v0)
        );
    }

    GLuint CreateGLTexture()
    {
        GLuint texture;
        glGenTextures(1, &texture);
        glBindTexture(GL_TEXTURE_2D, texture);

        glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8,
                     atlasWidth, atlasHeight, 0,
                     GL_RGBA, GL_UNSIGNED_BYTE, atlasData.data());

        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

        glGenerateMipmap(GL_TEXTURE_2D);

        return texture;
    }

private:
    bool FindFreeRegion(int width, int height, int& outX, int& outY)
    {
        // 简单的 First-Fit 算法
        for (int y = 0; y <= atlasHeight - height; y++)
        {
            for (int x = 0; x <= atlasWidth - width; x++)
            {
                if (IsRegionFree(x, y, width, height))
                {
                    outX = x;
                    outY = y;
                    return true;
                }
            }
        }
        return false;
    }

    bool IsRegionFree(int x, int y, int width, int height)
    {
        for (int dy = 0; dy < height; dy++)
        {
            for (int dx = 0; dx < width; dx++)
            {
                if (occupancy[(y + dy) * atlasWidth + (x + dx)])
                    return false;
            }
        }
        return true;
    }

    void MarkOccupied(int x, int y, int width, int height)
    {
        for (int dy = 0; dy < height; dy++)
        {
            for (int dx = 0; dx < width; dx++)
            {
                occupancy[(y + dy) * atlasWidth + (x + dx)] = true;
            }
        }
    }

    void CopyWithPadding(const Texture& src, int destX, int destY)
    {
        // 复制纹理数据
        for (int y = 0; y < src.height; y++)
        {
            for (int x = 0; x < src.width; x++)
            {
                int srcIdx = (y * src.width + x) * 4;
                int dstIdx = ((destY + y) * atlasWidth + (destX + x)) * 4;

                atlasData[dstIdx + 0] = src.data[srcIdx + 0];
                atlasData[dstIdx + 1] = src.data[srcIdx + 1];
                atlasData[dstIdx + 2] = src.data[srcIdx + 2];
                atlasData[dstIdx + 3] = src.data[srcIdx + 3];
            }
        }

        // 扩展边缘以避免采样接缝
        ExtendEdges(destX, destY, src.width, src.height);
    }

    void ExtendEdges(int x, int y, int width, int height)
    {
        // 扩展上下左右边缘
        for (int i = 1; i <= padding; i++)
        {
            // 左边缘
            for (int dy = 0; dy < height; dy++)
            {
                int srcIdx = ((y + dy) * atlasWidth + x) * 4;
                int dstIdx = ((y + dy) * atlasWidth + (x - i)) * 4;
                memcpy(&atlasData[dstIdx], &atlasData[srcIdx], 4);
            }

            // 右边缘
            for (int dy = 0; dy < height; dy++)
            {
                int srcIdx = ((y + dy) * atlasWidth + (x + width - 1)) * 4;
                int dstIdx = ((y + dy) * atlasWidth + (x + width - 1 + i)) * 4;
                memcpy(&atlasData[dstIdx], &atlasData[srcIdx], 4);
            }

            // 类似处理上下边缘...
        }
    }
};
```

### Texture Array（纹理数组）

```cpp
// 使用纹理数组替代图集（需要相同尺寸的纹理）
class TextureArrayManager
{
private:
    GLuint textureArray;
    int textureSize;
    int layerCount;
    std::map<std::string, int> textureIndices;

public:
    void Initialize(int size, int maxLayers)
    {
        textureSize = size;
        layerCount = 0;

        glGenTextures(1, &textureArray);
        glBindTexture(GL_TEXTURE_2D_ARRAY, textureArray);

        // 预分配存储
        glTexStorage3D(GL_TEXTURE_2D_ARRAY,
                       CalculateMipLevels(size),
                       GL_RGBA8,
                       size, size, maxLayers);

        glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
        glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_WRAP_S, GL_REPEAT);
        glTexParameteri(GL_TEXTURE_2D_ARRAY, GL_TEXTURE_WRAP_T, GL_REPEAT);
    }

    int AddTexture(const std::string& name, const Texture& texture)
    {
        // 纹理必须是正确尺寸，或者进行缩放
        if (texture.width != textureSize || texture.height != textureSize)
        {
            // 缩放纹理到正确尺寸
            Texture resized = ResizeTexture(texture, textureSize, textureSize);
            return AddTextureInternal(name, resized);
        }

        return AddTextureInternal(name, texture);
    }

    int GetTextureIndex(const std::string& name) const
    {
        auto it = textureIndices.find(name);
        return it != textureIndices.end() ? it->second : -1;
    }

private:
    int AddTextureInternal(const std::string& name, const Texture& texture)
    {
        int layerIndex = layerCount++;

        glBindTexture(GL_TEXTURE_2D_ARRAY, textureArray);
        glTexSubImage3D(GL_TEXTURE_2D_ARRAY, 0,
                        0, 0, layerIndex,
                        textureSize, textureSize, 1,
                        GL_RGBA, GL_UNSIGNED_BYTE,
                        texture.data.data());

        glGenerateMipmap(GL_TEXTURE_2D_ARRAY);

        textureIndices[name] = layerIndex;
        return layerIndex;
    }

    static int CalculateMipLevels(int size)
    {
        return static_cast<int>(std::floor(std::log2(size))) + 1;
    }
};
```

```glsl
// 使用纹理数组的着色器
#version 450

in vec2 vTexCoord;
flat in int vTextureIndex;  // 使用 flat 避免插值

out vec4 FragColor;

uniform sampler2DArray uTextureArray;

void main()
{
    FragColor = texture(uTextureArray, vec3(vTexCoord, float(vTextureIndex)));
}
```

## SRP Batcher（可编程渲染管线批处理器）

### 概念介绍

SRP Batcher 是 Unity 的 Scriptable Render Pipeline 中引入的优化技术，通过持久化 GPU 数据来减少 CPU 开销。

```
传统渲染流程：
┌─────────────────────────────────────────────────────────┐
│ 每个 Draw Call：                                         │
│ 1. 收集材质属性                                          │
│ 2. 设置 Constant Buffer                                  │
│ 3. 绑定 Constant Buffer                                  │
│ 4. 执行 Draw Call                                        │
└─────────────────────────────────────────────────────────┘

SRP Batcher 流程：
┌─────────────────────────────────────────────────────────┐
│ 初始化时：                                               │
│ 1. 为每个材质创建持久化 Constant Buffer                  │
│ 2. 上传材质属性到 GPU                                    │
│                                                         │
│ 每帧渲染：                                               │
│ 1. 仅更新变化的属性                                      │
│ 2. 批量提交 Draw Call（无需重新绑定）                    │
└─────────────────────────────────────────────────────────┘
```

### SRP Batcher 兼容性要求

```hlsl
// SRP Batcher 兼容的着色器结构
Shader "Custom/SRPBatcherCompatible"
{
    Properties
    {
        _BaseColor ("Base Color", Color) = (1,1,1,1)
        _BaseMap ("Base Map", 2D) = "white" {}
        _Metallic ("Metallic", Range(0,1)) = 0.5
        _Smoothness ("Smoothness", Range(0,1)) = 0.5
    }

    SubShader
    {
        Tags { "RenderType"="Opaque" "RenderPipeline"="UniversalPipeline" }

        Pass
        {
            HLSLPROGRAM
            #pragma vertex vert
            #pragma fragment frag

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"

            // 关键：使用 CBUFFER 包装材质属性
            // 必须使用 UnityPerMaterial 名称
            CBUFFER_START(UnityPerMaterial)
                float4 _BaseColor;
                float4 _BaseMap_ST;
                float _Metallic;
                float _Smoothness;
            CBUFFER_END

            // 纹理声明在 CBUFFER 外部
            TEXTURE2D(_BaseMap);
            SAMPLER(sampler_BaseMap);

            struct Attributes
            {
                float4 positionOS : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct Varyings
            {
                float4 positionCS : SV_POSITION;
                float2 uv : TEXCOORD0;
            };

            Varyings vert(Attributes input)
            {
                Varyings output;
                output.positionCS = TransformObjectToHClip(input.positionOS.xyz);
                output.uv = TRANSFORM_TEX(input.uv, _BaseMap);
                return output;
            }

            half4 frag(Varyings input) : SV_Target
            {
                half4 baseColor = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, input.uv);
                return baseColor * _BaseColor;
            }
            ENDHLSL
        }
    }
}
```

### 检查 SRP Batcher 兼容性

```csharp
// Unity 编辑器脚本：检查着色器兼容性
#if UNITY_EDITOR
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

public class SRPBatcherChecker : EditorWindow
{
    [MenuItem("Tools/Check SRP Batcher Compatibility")]
    static void CheckCompatibility()
    {
        var renderers = FindObjectsOfType<Renderer>();
        int compatible = 0;
        int incompatible = 0;

        foreach (var renderer in renderers)
        {
            foreach (var material in renderer.sharedMaterials)
            {
                if (material == null || material.shader == null)
                    continue;

                var shader = material.shader;
                var message = "";

                // Unity 2019.3+ 提供直接检查 API
                if (shader.IsPropertyBlock("_BaseColor"))
                {
                    // 检查是否在正确的 CBUFFER 中
                }

                // 使用反射检查 SRP Batcher 兼容性
                bool isCompatible = CheckShaderCompatibility(shader, out message);

                if (isCompatible)
                {
                    compatible++;
                }
                else
                {
                    incompatible++;
                    Debug.LogWarning($"Shader '{shader.name}' is not SRP Batcher compatible: {message}");
                }
            }
        }

        Debug.Log($"SRP Batcher Compatibility: {compatible} compatible, {incompatible} incompatible");
    }

    static bool CheckShaderCompatibility(Shader shader, out string message)
    {
        message = "";

        // 检查每个 Pass
        int passCount = shader.passCount;
        for (int i = 0; i < passCount; i++)
        {
            // Unity 内部 API 检查
            // 实际需要使用 ShaderUtil 或其他内部方法
        }

        return true;
    }
}
#endif
```

### SRP Batcher 性能对比

```csharp
// 性能分析示例
public class SRPBatcherBenchmark : MonoBehaviour
{
    public int objectCount = 10000;
    public Material[] materials;
    public Mesh mesh;

    private List<GameObject> objects = new List<GameObject>();

    void Start()
    {
        // 创建大量物体
        for (int i = 0; i < objectCount; i++)
        {
            var obj = new GameObject($"Object_{i}");
            var mf = obj.AddComponent<MeshFilter>();
            var mr = obj.AddComponent<MeshRenderer>();

            mf.sharedMesh = mesh;

            // 使用不同材质（触发不同的批处理行为）
            mr.sharedMaterial = materials[i % materials.Length];

            obj.transform.position = Random.insideUnitSphere * 50f;
            obj.transform.rotation = Random.rotation;

            objects.Add(obj);
        }
    }

    void OnGUI()
    {
        // 显示性能统计
        var stats = UnityEngine.Rendering.RenderPipelineManager.currentPipeline;

        GUILayout.Label($"Objects: {objectCount}");
        GUILayout.Label($"SetPass Calls: {UnityStats.setPassCalls}");
        GUILayout.Label($"Draw Calls: {UnityStats.drawCalls}");
        GUILayout.Label($"Batches: {UnityStats.batches}");
        GUILayout.Label($"Dynamic Batched: {UnityStats.dynamicBatchedDrawCalls}");
        GUILayout.Label($"Static Batched: {UnityStats.staticBatchedDrawCalls}");
        GUILayout.Label($"Instanced: {UnityStats.instancedBatchedDrawCalls}");
    }
}
```

## LOD 系统优化

### LOD 基础实现

```cpp
// LOD 系统核心实现
class LODSystem
{
public:
    struct LODLevel
    {
        Mesh* mesh;
        float screenSizeThreshold;  // 物体在屏幕上的相对大小阈值
        Material* material;          // 可选：不同 LOD 使用不同材质
    };

    struct LODGroup
    {
        std::vector<LODLevel> levels;
        BoundingSphere bounds;
        int currentLOD;

        int CalculateLOD(const Camera& camera, const glm::vec3& worldPosition)
        {
            // 计算物体在屏幕上的大小
            float distance = glm::length(worldPosition - camera.position);
            float screenSize = bounds.radius / (distance * camera.tanHalfFOV);

            // 选择合适的 LOD 级别
            for (int i = 0; i < levels.size(); i++)
            {
                if (screenSize >= levels[i].screenSizeThreshold)
                {
                    return i;
                }
            }

            // 太小，不渲染
            return -1;
        }
    };

private:
    std::vector<LODGroup> lodGroups;

public:
    void Update(const Camera& camera)
    {
        for (auto& group : lodGroups)
        {
            glm::vec3 worldPos = GetWorldPosition(group);
            int newLOD = group.CalculateLOD(camera, worldPos);

            if (newLOD != group.currentLOD)
            {
                // LOD 切换，可以添加过渡效果
                group.currentLOD = newLOD;
            }
        }
    }

    void Render()
    {
        // 按 LOD 级别分组渲染，以便批处理
        std::map<int, std::vector<LODGroup*>> lodBatches;

        for (auto& group : lodGroups)
        {
            if (group.currentLOD >= 0)
            {
                lodBatches[group.currentLOD].push_back(&group);
            }
        }

        // 渲染每个 LOD 批次
        for (auto& batch : lodBatches)
        {
            RenderLODBatch(batch.first, batch.second);
        }
    }
};
```

### LOD 与 GPU Instancing 结合

```cpp
// 结合 LOD 和 GPU Instancing 的高效渲染系统
class LODInstancedRenderer
{
private:
    struct LODInstanceBatch
    {
        GLuint instanceBuffer;
        std::vector<glm::mat4> matrices;
        std::vector<glm::vec4> colors;
        int count;
    };

    // 每个 LOD 级别有自己的实例批次
    std::vector<LODInstanceBatch> lodBatches;
    std::vector<Mesh*> lodMeshes;

public:
    void PrepareFrame(const std::vector<InstanceData>& instances,
                      const Camera& camera)
    {
        // 清空所有批次
        for (auto& batch : lodBatches)
        {
            batch.matrices.clear();
            batch.colors.clear();
            batch.count = 0;
        }

        // 分配实例到对应的 LOD 批次
        for (const auto& instance : instances)
        {
            float distance = glm::length(instance.position - camera.position);
            int lodLevel = CalculateLODLevel(distance);

            if (lodLevel >= 0 && lodLevel < lodBatches.size())
            {
                auto& batch = lodBatches[lodLevel];
                batch.matrices.push_back(instance.modelMatrix);
                batch.colors.push_back(instance.color);
                batch.count++;
            }
        }

        // 上传实例数据
        for (size_t i = 0; i < lodBatches.size(); i++)
        {
            auto& batch = lodBatches[i];
            if (batch.count > 0)
            {
                UpdateInstanceBuffer(batch);
            }
        }
    }

    void Render()
    {
        for (size_t i = 0; i < lodBatches.size(); i++)
        {
            auto& batch = lodBatches[i];
            if (batch.count > 0)
            {
                // 绑定对应 LOD 的网格
                BindMesh(lodMeshes[i]);
                BindInstanceBuffer(batch.instanceBuffer);

                // 实例化绘制
                glDrawElementsInstanced(
                    GL_TRIANGLES,
                    lodMeshes[i]->indexCount,
                    GL_UNSIGNED_INT,
                    0,
                    batch.count
                );
            }
        }
    }

private:
    int CalculateLODLevel(float distance)
    {
        // LOD 距离阈值
        static const float thresholds[] = { 10.0f, 30.0f, 100.0f, 300.0f };

        for (int i = 0; i < 4; i++)
        {
            if (distance < thresholds[i])
                return i;
        }
        return -1; // 太远，剔除
    }
};
```

### LOD 过渡（Crossfade）

```hlsl
// LOD 过渡着色器
Shader "Custom/LODCrossfade"
{
    Properties
    {
        _MainTex ("Texture", 2D) = "white" {}
        _LODFade ("LOD Fade", Range(0, 1)) = 1
    }

    SubShader
    {
        Tags { "RenderType"="Opaque" }

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile _ LOD_FADE_CROSSFADE

            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
                float4 screenPos : TEXCOORD1;
            };

            sampler2D _MainTex;
            float _LODFade;

            v2f vert(appdata v)
            {
                v2f o;
                o.pos = UnityObjectToClipPos(v.vertex);
                o.uv = v.uv;
                o.screenPos = ComputeScreenPos(o.pos);
                return o;
            }

            fixed4 frag(v2f i) : SV_Target
            {
                #ifdef LOD_FADE_CROSSFADE
                    // 基于屏幕空间抖动的 LOD 过渡
                    float2 screenUV = i.screenPos.xy / i.screenPos.w;
                    float2 ditherCoord = screenUV * _ScreenParams.xy;

                    // 4x4 Bayer 抖动矩阵
                    float4x4 ditherMatrix = float4x4(
                        0.0/16.0, 8.0/16.0, 2.0/16.0, 10.0/16.0,
                        12.0/16.0, 4.0/16.0, 14.0/16.0, 6.0/16.0,
                        3.0/16.0, 11.0/16.0, 1.0/16.0, 9.0/16.0,
                        15.0/16.0, 7.0/16.0, 13.0/16.0, 5.0/16.0
                    );

                    int2 ditherIndex = int2(fmod(ditherCoord, 4));
                    float ditherValue = ditherMatrix[ditherIndex.x][ditherIndex.y];

                    // 使用 Unity 内置的 LOD 淡出值
                    clip(unity_LODFade.x - ditherValue);
                #endif

                return tex2D(_MainTex, i.uv);
            }
            ENDCG
        }
    }
}
```

### Hierarchical LOD (HLOD)

```cpp
// 层级 LOD 系统
class HierarchicalLOD
{
public:
    struct HLODNode
    {
        BoundingBox bounds;
        Mesh* combinedMesh;           // 合并的低精度网格
        std::vector<HLODNode*> children;
        std::vector<GameObject*> objects;  // 原始物体
        bool useCombinedMesh;
    };

private:
    HLODNode* root;

public:
    void Build(const std::vector<GameObject*>& objects)
    {
        // 使用八叉树或 BVH 构建层级结构
        root = BuildHierarchy(objects, 0);

        // 为每个节点生成合并的低精度网格
        GenerateCombinedMeshes(root);
    }

    void Update(const Camera& camera)
    {
        UpdateNode(root, camera);
    }

private:
    HLODNode* BuildHierarchy(const std::vector<GameObject*>& objects, int depth)
    {
        if (objects.empty())
            return nullptr;

        HLODNode* node = new HLODNode();
        node->bounds = CalculateBounds(objects);

        if (objects.size() <= 4 || depth >= 8)
        {
            // 叶节点
            node->objects = objects;
            node->combinedMesh = nullptr;
        }
        else
        {
            // 分割为子节点
            auto splits = SplitObjects(objects, node->bounds);
            for (auto& split : splits)
            {
                HLODNode* child = BuildHierarchy(split, depth + 1);
                if (child)
                    node->children.push_back(child);
            }
        }

        return node;
    }

    void GenerateCombinedMeshes(HLODNode* node)
    {
        if (!node)
            return;

        // 递归处理子节点
        for (auto* child : node->children)
        {
            GenerateCombinedMeshes(child);
        }

        // 为当前节点生成合并网格
        if (!node->children.empty())
        {
            std::vector<Mesh*> childMeshes;
            CollectSimplifiedMeshes(node, childMeshes);

            // 合并并简化网格
            node->combinedMesh = MergeAndSimplify(childMeshes);
        }
        else if (!node->objects.empty())
        {
            // 叶节点：合并原始物体的网格
            node->combinedMesh = MergeObjects(node->objects);
        }
    }

    void UpdateNode(HLODNode* node, const Camera& camera)
    {
        if (!node)
            return;

        float distance = DistanceToCamera(node->bounds, camera);
        float screenSize = EstimateScreenSize(node->bounds, distance, camera);

        // 决定使用合并网格还是展开子节点
        if (screenSize < GetHLODThreshold() || node->children.empty())
        {
            // 使用合并的低精度网格
            node->useCombinedMesh = true;

            // 隐藏子节点
            for (auto* child : node->children)
            {
                SetVisible(child, false);
            }
        }
        else
        {
            // 展开子节点
            node->useCombinedMesh = false;

            for (auto* child : node->children)
            {
                UpdateNode(child, camera);
            }
        }
    }
};
```

## 渲染性能分析

### GPU 性能指标

```cpp
// OpenGL 性能查询
class GPUProfiler
{
private:
    struct QueryPair
    {
        GLuint queries[2];  // 开始和结束时间戳
        bool inUse;
    };

    std::map<std::string, QueryPair> queries;
    std::map<std::string, double> results;

public:
    void Initialize()
    {
        // 检查扩展支持
        if (!GLEW_ARB_timer_query)
        {
            std::cerr << "Timer query not supported!" << std::endl;
            return;
        }
    }

    void BeginQuery(const std::string& name)
    {
        auto& query = queries[name];

        if (!query.queries[0])
        {
            glGenQueries(2, query.queries);
        }

        glQueryCounter(query.queries[0], GL_TIMESTAMP);
        query.inUse = true;
    }

    void EndQuery(const std::string& name)
    {
        auto& query = queries[name];

        if (query.inUse)
        {
            glQueryCounter(query.queries[1], GL_TIMESTAMP);
        }
    }

    void CollectResults()
    {
        for (auto& pair : queries)
        {
            auto& query = pair.second;

            if (!query.inUse)
                continue;

            // 等待查询完成
            GLint available = 0;
            while (!available)
            {
                glGetQueryObjectiv(query.queries[1],
                                   GL_QUERY_RESULT_AVAILABLE,
                                   &available);
            }

            // 获取时间戳
            GLuint64 startTime, endTime;
            glGetQueryObjectui64v(query.queries[0], GL_QUERY_RESULT, &startTime);
            glGetQueryObjectui64v(query.queries[1], GL_QUERY_RESULT, &endTime);

            // 计算耗时（纳秒转毫秒）
            results[pair.first] = (endTime - startTime) / 1000000.0;

            query.inUse = false;
        }
    }

    void PrintResults()
    {
        std::cout << "=== GPU Profiler Results ===" << std::endl;

        double total = 0;
        for (const auto& pair : results)
        {
            std::cout << pair.first << ": " << pair.second << " ms" << std::endl;
            total += pair.second;
        }

        std::cout << "Total: " << total << " ms" << std::endl;
        std::cout << "FPS estimate: " << 1000.0 / total << std::endl;
    }
};

// 使用示例
void RenderFrame()
{
    profiler.BeginQuery("Shadow Pass");
    RenderShadows();
    profiler.EndQuery("Shadow Pass");

    profiler.BeginQuery("Main Pass");
    RenderMainScene();
    profiler.EndQuery("Main Pass");

    profiler.BeginQuery("Post Processing");
    ApplyPostProcessing();
    profiler.EndQuery("Post Processing");

    // 下一帧收集结果
    profiler.CollectResults();
}
```

### 渲染统计收集

```cpp
// 渲染统计系统
class RenderStatistics
{
public:
    struct FrameStats
    {
        // 绘制统计
        uint32_t drawCalls;
        uint32_t triangles;
        uint32_t vertices;

        // 批处理统计
        uint32_t staticBatches;
        uint32_t dynamicBatches;
        uint32_t instancedBatches;
        uint32_t instanceCount;

        // 状态切换
        uint32_t shaderChanges;
        uint32_t materialChanges;
        uint32_t textureBindings;
        uint32_t bufferUploads;

        // 内存
        uint64_t vramUsage;
        uint64_t uploadedBytes;

        // 时间
        double cpuTime;
        double gpuTime;
        double waitTime;
    };

private:
    FrameStats currentFrame;
    std::deque<FrameStats> history;
    static const size_t HISTORY_SIZE = 120; // 2 秒的数据 (60 FPS)

public:
    void BeginFrame()
    {
        currentFrame = FrameStats{};
    }

    void EndFrame()
    {
        history.push_back(currentFrame);
        if (history.size() > HISTORY_SIZE)
        {
            history.pop_front();
        }
    }

    void RecordDrawCall(uint32_t triangles, uint32_t vertices)
    {
        currentFrame.drawCalls++;
        currentFrame.triangles += triangles;
        currentFrame.vertices += vertices;
    }

    void RecordInstanced(uint32_t instances, uint32_t trianglesPerInstance)
    {
        currentFrame.instancedBatches++;
        currentFrame.instanceCount += instances;
        currentFrame.triangles += trianglesPerInstance * instances;
    }

    void RecordStateChange(StateChangeType type)
    {
        switch (type)
        {
            case StateChangeType::Shader:
                currentFrame.shaderChanges++;
                break;
            case StateChangeType::Material:
                currentFrame.materialChanges++;
                break;
            case StateChangeType::Texture:
                currentFrame.textureBindings++;
                break;
        }
    }

    // 获取平均统计
    FrameStats GetAverageStats() const
    {
        FrameStats avg{};
        if (history.empty())
            return avg;

        for (const auto& frame : history)
        {
            avg.drawCalls += frame.drawCalls;
            avg.triangles += frame.triangles;
            avg.instancedBatches += frame.instancedBatches;
            avg.instanceCount += frame.instanceCount;
            avg.gpuTime += frame.gpuTime;
        }

        size_t count = history.size();
        avg.drawCalls /= count;
        avg.triangles /= count;
        avg.instancedBatches /= count;
        avg.instanceCount /= count;
        avg.gpuTime /= count;

        return avg;
    }

    void PrintStats() const
    {
        auto avg = GetAverageStats();

        std::cout << "=== Render Statistics (Average) ===" << std::endl;
        std::cout << "Draw Calls: " << avg.drawCalls << std::endl;
        std::cout << "Triangles: " << avg.triangles / 1000 << "K" << std::endl;
        std::cout << "Instanced Batches: " << avg.instancedBatches << std::endl;
        std::cout << "Total Instances: " << avg.instanceCount << std::endl;
        std::cout << "GPU Time: " << avg.gpuTime << " ms" << std::endl;
        std::cout << "State Changes - Shader: " << currentFrame.shaderChanges
                  << ", Material: " << currentFrame.materialChanges
                  << ", Texture: " << currentFrame.textureBindings << std::endl;
    }
};
```

### Unity Frame Debugger 使用

```csharp
// Unity 性能分析辅助脚本
public class RenderingDebugger : MonoBehaviour
{
    [Header("Statistics")]
    public int drawCalls;
    public int batches;
    public int triangles;
    public int vertices;

    [Header("Instancing Info")]
    public int instancedDrawCalls;
    public int staticBatchedDrawCalls;
    public int dynamicBatchedDrawCalls;

    private void Update()
    {
        // 收集 Unity 内置统计
        #if UNITY_EDITOR
        drawCalls = UnityEditor.UnityStats.drawCalls;
        batches = UnityEditor.UnityStats.batches;
        triangles = UnityEditor.UnityStats.triangles;
        vertices = UnityEditor.UnityStats.vertices;

        // 这些可能需要特定版本的 Unity
        // instancedDrawCalls = UnityEditor.UnityStats.instancedBatchedDrawCalls;
        #endif
    }

    private void OnGUI()
    {
        GUILayout.BeginArea(new Rect(10, 10, 300, 200));

        GUILayout.Label($"Draw Calls: {drawCalls}");
        GUILayout.Label($"Batches: {batches}");
        GUILayout.Label($"Triangles: {triangles:N0}");
        GUILayout.Label($"Vertices: {vertices:N0}");

        GUILayout.Space(10);

        // FPS
        float fps = 1.0f / Time.deltaTime;
        float frameTime = Time.deltaTime * 1000f;
        GUILayout.Label($"FPS: {fps:F1} ({frameTime:F2} ms)");

        GUILayout.EndArea();
    }
}
```

### 性能优化检查清单

```markdown
## 渲染性能优化检查清单

### Draw Call 优化
- [ ] 使用 GPU Instancing 渲染大量相同物体
- [ ] 静态物体启用 Static Batching
- [ ] 检查 Dynamic Batching 是否生效
- [ ] 使用纹理图集减少材质数量
- [ ] 合并使用相同材质的网格

### GPU Instancing 检查
- [ ] 材质启用 GPU Instancing 选项
- [ ] 着色器支持实例化（#pragma multi_compile_instancing）
- [ ] Per-instance 数据正确设置
- [ ] 实例数量足够触发批处理（通常 > 2）

### SRP Batcher 检查（URP/HDRP）
- [ ] 着色器使用正确的 CBUFFER 结构
- [ ] 材质属性在 UnityPerMaterial CBUFFER 中
- [ ] 没有使用 MaterialPropertyBlock 覆盖材质属性
- [ ] 在 Frame Debugger 中确认 SRP Batcher 生效

### LOD 系统
- [ ] 为复杂模型设置 LOD Group
- [ ] LOD 切换距离合理设置
- [ ] 最低 LOD 的三角形数足够少
- [ ] 考虑使用 LOD 过渡避免突变

### 纹理优化
- [ ] 使用纹理压缩（DXT/BC/ASTC/ETC2）
- [ ] 设置合适的纹理尺寸和 Mipmap
- [ ] 使用纹理图集或纹理数组
- [ ] 避免运行时生成大量小纹理

### 剔除优化
- [ ] 启用视锥体剔除（默认启用）
- [ ] 设置合适的 Camera Far Plane
- [ ] 考虑遮挡剔除（Occlusion Culling）
- [ ] 大场景使用空间分割（八叉树/BVH）

### 测量验证
- [ ] 使用 GPU Profiler 定位瓶颈
- [ ] 检查 CPU/GPU 时间平衡
- [ ] 监控内存和带宽使用
- [ ] 在目标平台进行真机测试
```

## 面试要点

### 核心概念题

**Q1: 解释 Draw Call 的成本来源和优化方向**

```
Draw Call 成本来源：

1. CPU 端开销（主要瓶颈）
   - 驱动程序验证渲染状态
   - 准备和提交命令到命令缓冲区
   - 与 GPU 的同步等待

2. 状态切换开销
   - 切换着色器程序
   - 绑定纹理和缓冲区
   - 更新 Uniform/Constant Buffer

3. GPU 端开销（相对较小）
   - 命令解析和调度
   - 管线状态变更

优化方向：
1. 减少 Draw Call 数量
   - 批处理（静态/动态）
   - GPU Instancing
   - 间接渲染

2. 减少状态切换
   - 按材质排序
   - 使用纹理图集
   - SRP Batcher

3. 减少 CPU-GPU 同步
   - 多线程命令录制
   - 异步数据上传
```

**Q2: GPU Instancing 和 Static Batching 的区别**

```
                GPU Instancing              Static Batching
────────────────────────────────────────────────────────────────
网格数据         共享一份                    每个实例独立复制
内存占用         低（只存储变换矩阵）        高（顶点数据翻倍）
适用对象         相同网格的多个实例          任意静态物体
变换支持         支持不同变换                预计算到顶点中
动态属性         支持（颜色、自定义等）      不支持
运行时修改       可以修改实例属性            不能移动/修改
顶点数限制       无特殊限制                  65535（16位索引）
GPU 支持要求     需要 Instancing 支持        无特殊要求
最佳场景         草地、树木、人群            建筑、地形、装饰物
```

**Q3: 什么是 Indirect Rendering，什么时候使用它**

```cpp
// Indirect Rendering 允许 GPU 决定绘制参数
// 典型应用：GPU 驱动的剔除、粒子系统、程序化生成

// 传统渲染：CPU 决定绘制什么和多少
glDrawElementsInstanced(GL_TRIANGLES, indexCount,
                        GL_UNSIGNED_INT, 0, instanceCount);

// 间接渲染：参数存储在 GPU 缓冲区
struct DrawCommand {
    uint count;         // 由 GPU 计算
    uint instanceCount; // 由 GPU 计算
    uint firstIndex;
    int baseVertex;
    uint baseInstance;
};

// CPU 不知道具体绘制数量
glDrawElementsIndirect(GL_TRIANGLES, GL_UNSIGNED_INT, 0);

// 适用场景：
// 1. GPU 剔除（视锥体、遮挡）
// 2. 程序化内容生成
// 3. 复杂粒子系统
// 4. 大规模模拟（植被、人群）
```

### 实践应用题

**Q4: 如何优化一个有 10000 棵树的森林场景**

```cpp
// 综合优化策略

class ForestRenderer
{
    // 1. 分析场景
    // - 树的种类数量（决定网格变体）
    // - 每种树的 LOD 级别
    // - 是否需要风动画

    // 2. 数据结构
    struct TreeInstance {
        glm::vec3 position;
        float rotation;
        float scale;
        uint8_t treeType;  // 0-255 种树
        uint8_t lodLevel;
    };

    // 3. LOD 系统
    std::array<Mesh*, 4> treeLODs;  // 4 个 LOD 级别
    // LOD 0: ~5000 三角形
    // LOD 1: ~1000 三角形
    // LOD 2: ~200 三角形
    // LOD 3: Billboard (~2 三角形)

    // 4. GPU Instancing + LOD
    void PrepareFrame(const Camera& camera) {
        // 按 LOD 级别分组
        std::array<std::vector<TreeInstance>, 4> lodGroups;

        for (const auto& tree : trees) {
            float distance = glm::length(tree.position - camera.position);
            int lod = CalculateLOD(distance);

            if (lod >= 0) {
                lodGroups[lod].push_back(tree);
            }
        }

        // 每个 LOD 使用实例化渲染
        for (int i = 0; i < 4; i++) {
            UpdateInstanceBuffer(i, lodGroups[i]);
        }
    }

    // 5. 空间分割加速
    Octree spatialIndex;

    // 6. 视锥体剔除
    void CullTrees(const Frustum& frustum) {
        visibleTrees.clear();
        spatialIndex.QueryFrustum(frustum, visibleTrees);
    }

    // 7. 结果
    // - 10000 棵树 → ~4-8 Draw Calls（每个 LOD 级别 1-2 次）
    // - GPU 并行处理所有实例
    // - 根据距离自动调整细节
};
```

**Q5: SRP Batcher 不生效的常见原因**

```hlsl
// 常见问题和解决方案

// 问题 1：材质属性不在 CBUFFER 中
// 错误写法
float4 _Color;  // 没有包在 CBUFFER 中

// 正确写法
CBUFFER_START(UnityPerMaterial)
    float4 _Color;
CBUFFER_END

// 问题 2：使用了 MaterialPropertyBlock
// MaterialPropertyBlock 会打断 SRP Batcher
MaterialPropertyBlock block = new MaterialPropertyBlock();
renderer.SetPropertyBlock(block);  // 这会禁用 SRP Batcher

// 解决：对于少量变化的属性，使用 GPU Instancing 代替

// 问题 3：着色器有多个 Pass 使用不同的属性布局
// 确保所有 Pass 的 CBUFFER 结构一致

// 问题 4：使用了不兼容的着色器关键字组合
// 检查 multi_compile 变体是否影响属性布局

// 检查方法：
// 1. 在 Inspector 中查看 Shader 的 "SRP Batcher" 状态
// 2. 使用 Frame Debugger 检查 "SRP Batch" 分组
```

### 常见陷阱

```cpp
// 陷阱 1：过度优化
// 不是所有场景都需要 GPU Instancing
// 几个物体使用普通渲染可能更快

// 陷阱 2：忽略内存成本
// Static Batching 会显著增加内存使用
// 1000 个 1MB 的网格 → 可能需要 1GB+ 内存

// 陷阱 3：LOD 切换过于频繁
// 添加滞后（hysteresis）避免抖动
int CalculateLODWithHysteresis(float distance, int currentLOD) {
    float threshold = lodDistances[currentLOD];
    float hysteresis = threshold * 0.1f;  // 10% 滞后区间

    if (distance > threshold + hysteresis) {
        return currentLOD + 1;  // 切换到下一级
    }
    if (distance < lodDistances[currentLOD - 1] - hysteresis) {
        return currentLOD - 1;  // 切换到上一级
    }
    return currentLOD;  // 保持当前级别
}

// 陷阱 4：不考虑 GPU 能力
// 老旧 GPU 可能不支持某些 Instancing 特性
// 移动端需要特别注意实例数量限制

// 陷阱 5：忽略 Overdraw
// 即使 Draw Call 减少，透明物体的 Overdraw
// 仍然是性能杀手
```

## 总结

GPU 实例化与批处理渲染是现代游戏引擎的核心优化技术。要有效运用这些技术，需要：

1. **理解渲染管线**：知道 CPU 和 GPU 如何协作，瓶颈在哪里
2. **选择合适的技术**：根据场景特点选择 Static Batching、Dynamic Batching、GPU Instancing 或 Indirect Rendering
3. **综合运用**：结合 LOD、纹理图集、SRP Batcher 等技术获得最佳效果
4. **持续测量**：使用性能分析工具验证优化效果
5. **平衡取舍**：在渲染性能、内存占用、开发成本之间找到平衡

掌握这些技术后，你将能够处理包含数万甚至数十万物体的复杂场景，同时保持流畅的帧率表现。
