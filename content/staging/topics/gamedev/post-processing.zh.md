---
title: 游戏后处理效果
description: 实现常见的后处理效果：Bloom、景深、运动模糊和色调映射
track: gamedev
section: graphics
difficulty: intermediate
tags:
  - 后处理
  - Bloom
  - 景深
  - 色调映射
status: imported
origin: old/src/content/docs/gamedev/post-processing.zh.md
divergence: 0.153
issues: []
legacy:
  category: GameDev
  subcategory: Graphics
  order: 13
  lastUpdated: 2026-01-07
---

后处理（Post-Processing）是现代游戏渲染管线中不可或缺的一环。它在场景渲染完成后，对最终图像进行一系列图像处理操作，以实现各种视觉效果。从增强画面真实感的色调映射，到营造电影感的景深效果，后处理技术为游戏画面增添了最后一层"滤镜"，极大地提升了视觉表现力。

## 概念解释：什么是后处理

### 渲染管线中的位置

后处理发生在渲染管线的最后阶段：

```
场景渲染 -> 帧缓冲 -> 后处理效果链 -> 最终输出
    |           |           |
    v           v           v
3D几何体    HDR纹理    Bloom/DOF/...   屏幕显示
光照计算    深度缓冲   色调映射
阴影渲染    法线缓冲   抗锯齿
```

### 为什么需要后处理

1. **模拟真实相机效果**：景深、运动模糊、镜头光晕
2. **增强视觉表现**：Bloom 让光源更耀眼，色彩分级营造氛围
3. **HDR 到 LDR 转换**：色调映射将高动态范围图像转换为显示器可显示的范围
4. **画面质量提升**：抗锯齿消除锯齿，锐化增强细节
5. **特殊艺术效果**：复古滤镜、卡通渲染、故障艺术

## 后处理管线架构

### 基础后处理管线

```cpp
// 后处理管线基础架构
class PostProcessPipeline {
private:
    // 全屏四边形 VAO
    GLuint quadVAO, quadVBO;

    // 帧缓冲对象
    struct FrameBuffer {
        GLuint fbo;
        GLuint colorTexture;
        GLuint depthTexture;
        int width, height;
    };

    FrameBuffer sceneBuffer;      // 场景渲染缓冲（HDR）
    FrameBuffer pingPongBuffers[2]; // 用于多 Pass 效果

    // 后处理效果列表
    std::vector<PostProcessEffect*> effects;

public:
    void Initialize(int width, int height) {
        // 创建全屏四边形
        float quadVertices[] = {
            // 位置        // UV
            -1.0f,  1.0f,  0.0f, 1.0f,
            -1.0f, -1.0f,  0.0f, 0.0f,
             1.0f, -1.0f,  1.0f, 0.0f,

            -1.0f,  1.0f,  0.0f, 1.0f,
             1.0f, -1.0f,  1.0f, 0.0f,
             1.0f,  1.0f,  1.0f, 1.0f
        };

        glGenVertexArrays(1, &quadVAO);
        glGenBuffers(1, &quadVBO);
        glBindVertexArray(quadVAO);
        glBindBuffer(GL_ARRAY_BUFFER, quadVBO);
        glBufferData(GL_ARRAY_BUFFER, sizeof(quadVertices),
                     quadVertices, GL_STATIC_DRAW);

        glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE,
                             4 * sizeof(float), (void*)0);
        glEnableVertexAttribArray(0);
        glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE,
                             4 * sizeof(float), (void*)(2 * sizeof(float)));
        glEnableVertexAttribArray(1);

        // 创建帧缓冲
        CreateFrameBuffer(sceneBuffer, width, height, true);
        CreateFrameBuffer(pingPongBuffers[0], width, height, false);
        CreateFrameBuffer(pingPongBuffers[1], width, height, false);
    }

    void CreateFrameBuffer(FrameBuffer& fb, int w, int h, bool hdr) {
        fb.width = w;
        fb.height = h;

        glGenFramebuffers(1, &fb.fbo);
        glBindFramebuffer(GL_FRAMEBUFFER, fb.fbo);

        // 颜色附件
        glGenTextures(1, &fb.colorTexture);
        glBindTexture(GL_TEXTURE_2D, fb.colorTexture);
        glTexImage2D(GL_TEXTURE_2D, 0,
                     hdr ? GL_RGBA16F : GL_RGBA8,
                     w, h, 0, GL_RGBA,
                     hdr ? GL_FLOAT : GL_UNSIGNED_BYTE, nullptr);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
        glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                               GL_TEXTURE_2D, fb.colorTexture, 0);

        // 深度附件
        glGenTextures(1, &fb.depthTexture);
        glBindTexture(GL_TEXTURE_2D, fb.depthTexture);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_DEPTH_COMPONENT24,
                     w, h, 0, GL_DEPTH_COMPONENT, GL_FLOAT, nullptr);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
        glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT,
                               GL_TEXTURE_2D, fb.depthTexture, 0);

        glBindFramebuffer(GL_FRAMEBUFFER, 0);
    }

    void BeginSceneRendering() {
        glBindFramebuffer(GL_FRAMEBUFFER, sceneBuffer.fbo);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    }

    void EndSceneRendering() {
        glBindFramebuffer(GL_FRAMEBUFFER, 0);
    }

    void ApplyPostProcessing() {
        GLuint currentInput = sceneBuffer.colorTexture;
        int pingPongIndex = 0;

        for (auto* effect : effects) {
            if (!effect->IsEnabled()) continue;

            // 绑定输出缓冲
            glBindFramebuffer(GL_FRAMEBUFFER,
                             pingPongBuffers[pingPongIndex].fbo);
            glClear(GL_COLOR_BUFFER_BIT);

            // 应用效果
            effect->Apply(currentInput, sceneBuffer.depthTexture);
            RenderQuad();

            // 交换 Ping-Pong 缓冲
            currentInput = pingPongBuffers[pingPongIndex].colorTexture;
            pingPongIndex = 1 - pingPongIndex;
        }

        // 最终输出到屏幕
        glBindFramebuffer(GL_FRAMEBUFFER, 0);
        glClear(GL_COLOR_BUFFER_BIT);

        // 使用简单的直通着色器
        finalPassShader.Use();
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, currentInput);
        RenderQuad();
    }

    void RenderQuad() {
        glBindVertexArray(quadVAO);
        glDrawArrays(GL_TRIANGLES, 0, 6);
    }
};
```

### 后处理效果基类

```cpp
// 后处理效果基类
class PostProcessEffect {
protected:
    Shader shader;
    bool enabled = true;

public:
    virtual ~PostProcessEffect() = default;

    virtual void Initialize() = 0;
    virtual void Apply(GLuint colorTexture, GLuint depthTexture) = 0;
    virtual void SetParameters() {}

    bool IsEnabled() const { return enabled; }
    void SetEnabled(bool value) { enabled = value; }
};
```

## Bloom 效果

Bloom（辉光/泛光）是最常见的后处理效果之一，它模拟了真实相机在拍摄明亮光源时产生的光晕现象。

### Bloom 原理

```
原始图像 -> 亮度提取 -> 高斯模糊 -> 与原图混合
    |           |           |           |
    v           v           v           v
 HDR场景    高亮区域    柔和光晕    最终效果
```

### 亮度提取着色器

```glsl
// bloom_threshold.frag - 提取高亮区域
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D sceneTexture;
uniform float threshold;      // 亮度阈值，通常 1.0
uniform float softThreshold;  // 软阈值，用于平滑过渡

void main() {
    vec3 color = texture(sceneTexture, TexCoords).rgb;

    // 计算亮度（使用感知亮度权重）
    float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));

    // 软阈值过渡
    float knee = threshold * softThreshold;
    float soft = brightness - threshold + knee;
    soft = clamp(soft, 0.0, 2.0 * knee);
    soft = soft * soft / (4.0 * knee + 0.00001);

    float contribution = max(soft, brightness - threshold);
    contribution /= max(brightness, 0.00001);

    FragColor = vec4(color * contribution, 1.0);
}
```

### 高斯模糊着色器

```glsl
// gaussian_blur.frag - 可分离高斯模糊
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D image;
uniform bool horizontal;  // 水平/垂直方向
uniform float texelSize;  // 1.0 / textureWidth 或 height

// 9-tap 高斯权重
const float weights[5] = float[](
    0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216
);

void main() {
    vec3 result = texture(image, TexCoords).rgb * weights[0];

    vec2 offset = horizontal ? vec2(texelSize, 0.0) : vec2(0.0, texelSize);

    for (int i = 1; i < 5; ++i) {
        result += texture(image, TexCoords + offset * i).rgb * weights[i];
        result += texture(image, TexCoords - offset * i).rgb * weights[i];
    }

    FragColor = vec4(result, 1.0);
}
```

### 多级模糊（Mipmap Bloom）

更高效的 Bloom 实现使用多级缩放：

```cpp
class BloomEffect : public PostProcessEffect {
private:
    static const int BLUR_LEVELS = 5;

    struct BlurLevel {
        GLuint fbo;
        GLuint texture;
        int width, height;
    };

    BlurLevel downsamples[BLUR_LEVELS];
    BlurLevel upsamples[BLUR_LEVELS];

    Shader thresholdShader;
    Shader downsampleShader;
    Shader upsampleShader;
    Shader combineShader;

    float threshold = 1.0f;
    float softThreshold = 0.5f;
    float intensity = 1.0f;
    float scatter = 0.7f;  // 控制光晕扩散程度

public:
    void Initialize() override {
        thresholdShader.Load("bloom_threshold.vert", "bloom_threshold.frag");
        downsampleShader.Load("fullscreen.vert", "bloom_downsample.frag");
        upsampleShader.Load("fullscreen.vert", "bloom_upsample.frag");
        combineShader.Load("fullscreen.vert", "bloom_combine.frag");

        // 创建多级模糊缓冲
        int w = screenWidth / 2;
        int h = screenHeight / 2;

        for (int i = 0; i < BLUR_LEVELS; ++i) {
            CreateBlurBuffer(downsamples[i], w, h);
            CreateBlurBuffer(upsamples[i], w, h);
            w /= 2;
            h /= 2;
        }
    }

    void Apply(GLuint colorTexture, GLuint depthTexture) override {
        // 1. 亮度提取
        glBindFramebuffer(GL_FRAMEBUFFER, downsamples[0].fbo);
        glViewport(0, 0, downsamples[0].width, downsamples[0].height);

        thresholdShader.Use();
        thresholdShader.SetFloat("threshold", threshold);
        thresholdShader.SetFloat("softThreshold", softThreshold);
        glBindTexture(GL_TEXTURE_2D, colorTexture);
        RenderQuad();

        // 2. 逐级下采样模糊
        GLuint currentTexture = downsamples[0].texture;

        for (int i = 1; i < BLUR_LEVELS; ++i) {
            glBindFramebuffer(GL_FRAMEBUFFER, downsamples[i].fbo);
            glViewport(0, 0, downsamples[i].width, downsamples[i].height);

            downsampleShader.Use();
            downsampleShader.SetVec2("texelSize",
                1.0f / downsamples[i-1].width,
                1.0f / downsamples[i-1].height);
            glBindTexture(GL_TEXTURE_2D, currentTexture);
            RenderQuad();

            currentTexture = downsamples[i].texture;
        }

        // 3. 逐级上采样混合
        for (int i = BLUR_LEVELS - 1; i > 0; --i) {
            glBindFramebuffer(GL_FRAMEBUFFER, upsamples[i-1].fbo);
            glViewport(0, 0, upsamples[i-1].width, upsamples[i-1].height);

            upsampleShader.Use();
            upsampleShader.SetFloat("scatter", scatter);

            glActiveTexture(GL_TEXTURE0);
            glBindTexture(GL_TEXTURE_2D, currentTexture);
            glActiveTexture(GL_TEXTURE1);
            glBindTexture(GL_TEXTURE_2D, downsamples[i-1].texture);

            RenderQuad();

            currentTexture = upsamples[i-1].texture;
        }

        // 4. 与原图混合（在外部完成）
        bloomTexture = currentTexture;
    }
};
```

### 下采样和上采样着色器

```glsl
// bloom_downsample.frag - 13-tap 下采样滤波器
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D srcTexture;
uniform vec2 texelSize;

void main() {
    // 使用 13 个采样点的高质量下采样
    // 中心点权重最高，边缘逐渐降低

    vec3 a = texture(srcTexture, TexCoords + texelSize * vec2(-1, -1)).rgb;
    vec3 b = texture(srcTexture, TexCoords + texelSize * vec2( 0, -1)).rgb;
    vec3 c = texture(srcTexture, TexCoords + texelSize * vec2( 1, -1)).rgb;
    vec3 d = texture(srcTexture, TexCoords + texelSize * vec2(-1,  0)).rgb;
    vec3 e = texture(srcTexture, TexCoords + texelSize * vec2( 0,  0)).rgb;
    vec3 f = texture(srcTexture, TexCoords + texelSize * vec2( 1,  0)).rgb;
    vec3 g = texture(srcTexture, TexCoords + texelSize * vec2(-1,  1)).rgb;
    vec3 h = texture(srcTexture, TexCoords + texelSize * vec2( 0,  1)).rgb;
    vec3 i = texture(srcTexture, TexCoords + texelSize * vec2( 1,  1)).rgb;

    // 应用权重
    vec3 result = e * 0.25;                        // 中心
    result += (b + d + f + h) * 0.125;             // 边
    result += (a + c + g + i) * 0.0625;            // 角

    FragColor = vec4(result, 1.0);
}

// bloom_upsample.frag - 9-tap 上采样滤波器
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D srcTexture;      // 当前级别
uniform sampler2D highResTexture;  // 高分辨率级别
uniform float scatter;

void main() {
    // 帐篷滤波器上采样
    vec3 lowRes = texture(srcTexture, TexCoords).rgb;
    vec3 highRes = texture(highResTexture, TexCoords).rgb;

    // 混合低分辨率（模糊）和高分辨率
    vec3 result = mix(highRes, lowRes, scatter);

    FragColor = vec4(result, 1.0);
}
```

## 景深（Depth of Field）

景深效果模拟真实相机镜头的焦点特性：焦平面内的物体清晰，焦平面外的物体模糊。

### 景深参数

```cpp
struct DOFParameters {
    float focusDistance;    // 对焦距离
    float focusRange;       // 对焦范围（清晰区域）
    float nearBlurScale;    // 前景模糊强度
    float farBlurScale;     // 背景模糊强度
    float maxBlur;          // 最大模糊半径
    float bokehThreshold;   // 散景亮度阈值
    float bokehIntensity;   // 散景强度
};
```

### CoC（Circle of Confusion）计算

```glsl
// dof_coc.frag - 计算弥散圆直径
#version 330 core

out float FragColor;
in vec2 TexCoords;

uniform sampler2D depthTexture;
uniform float focusDistance;
uniform float focusRange;
uniform float nearPlane;
uniform float farPlane;

// 从深度缓冲重建线性深度
float LinearizeDepth(float depth) {
    float z = depth * 2.0 - 1.0;  // NDC
    return (2.0 * nearPlane * farPlane) /
           (farPlane + nearPlane - z * (farPlane - nearPlane));
}

void main() {
    float depth = texture(depthTexture, TexCoords).r;
    float linearDepth = LinearizeDepth(depth);

    // 计算 CoC（正值=背景模糊，负值=前景模糊）
    float coc = (linearDepth - focusDistance) / focusRange;
    coc = clamp(coc, -1.0, 1.0);

    FragColor = coc;
}
```

### 散景模糊着色器

```glsl
// dof_bokeh.frag - 六边形散景模糊
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D colorTexture;
uniform sampler2D cocTexture;
uniform vec2 texelSize;
uniform float maxBlur;

// 六边形采样点（模拟六叶光圈）
const int SAMPLE_COUNT = 22;
const vec2 diskKernel[SAMPLE_COUNT] = vec2[](
    vec2(0.0, 0.0),
    vec2(0.53333, 0.0),
    vec2(0.26667, 0.46188),
    vec2(-0.26667, 0.46188),
    vec2(-0.53333, 0.0),
    vec2(-0.26667, -0.46188),
    vec2(0.26667, -0.46188),
    vec2(1.06667, 0.0),
    vec2(0.80000, 0.46188),
    vec2(0.53333, 0.92376),
    vec2(0.0, 0.92376),
    vec2(-0.26667, 0.92376),
    vec2(-0.53333, 0.92376),
    vec2(-0.80000, 0.46188),
    vec2(-1.06667, 0.0),
    vec2(-0.80000, -0.46188),
    vec2(-0.53333, -0.92376),
    vec2(-0.26667, -0.92376),
    vec2(0.0, -0.92376),
    vec2(0.53333, -0.92376),
    vec2(0.80000, -0.46188),
    vec2(0.26667, -0.46188)
);

void main() {
    float centerCoC = texture(cocTexture, TexCoords).r;
    float blurRadius = abs(centerCoC) * maxBlur;

    if (blurRadius < 0.5) {
        FragColor = texture(colorTexture, TexCoords);
        return;
    }

    vec3 color = vec3(0.0);
    float totalWeight = 0.0;

    for (int i = 0; i < SAMPLE_COUNT; ++i) {
        vec2 offset = diskKernel[i] * blurRadius * texelSize;
        vec2 sampleUV = TexCoords + offset;

        vec3 sampleColor = texture(colorTexture, sampleUV).rgb;
        float sampleCoC = texture(cocTexture, sampleUV).r;

        // 权重计算：考虑采样点的 CoC 和距离
        float sampleBlur = abs(sampleCoC) * maxBlur;
        float weight = saturate(sampleBlur - length(offset / texelSize) + 1.0);

        // 前景物体不应该被背景污染
        if (sampleCoC < centerCoC) {
            weight *= smoothstep(0.0, abs(centerCoC), abs(sampleCoC));
        }

        color += sampleColor * weight;
        totalWeight += weight;
    }

    FragColor = vec4(color / totalWeight, 1.0);
}
```

### 物理精确的 DOF

```glsl
// dof_physical.frag - 基于物理的景深
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D colorTexture;
uniform sampler2D depthTexture;

// 相机参数
uniform float aperture;        // 光圈值 (f-stop)
uniform float focalLength;     // 焦距 (mm)
uniform float focusDistance;   // 对焦距离 (m)
uniform float sensorHeight;    // 传感器高度 (mm)

uniform float nearPlane;
uniform float farPlane;
uniform vec2 resolution;

float LinearizeDepth(float depth) {
    float z = depth * 2.0 - 1.0;
    return (2.0 * nearPlane * farPlane) /
           (farPlane + nearPlane - z * (farPlane - nearPlane));
}

// 计算物理精确的 CoC 直径（像素）
float CalculateCoC(float depth) {
    // 基于薄透镜模型
    // CoC = |A * f * (S - D)| / (D * (S - f))
    // A = 焦距 / 光圈, f = 焦距, S = 对焦距离, D = 物体距离

    float A = focalLength / aperture;
    float S = focusDistance * 1000.0;  // 转换为 mm
    float D = depth * 1000.0;          // 转换为 mm
    float f = focalLength;

    float cocMM = abs(A * f * (S - D)) / (D * (S - f));

    // 转换为像素
    float cocPixels = (cocMM / sensorHeight) * resolution.y;

    return cocPixels;
}

void main() {
    float depth = texture(depthTexture, TexCoords).r;
    float linearDepth = LinearizeDepth(depth);
    float coc = CalculateCoC(linearDepth);

    // 限制最大 CoC
    coc = min(coc, 32.0);

    // ... 后续模糊处理
}
```

## 运动模糊（Motion Blur）

运动模糊模拟快速运动物体在单次曝光时间内的轨迹，增强游戏的速度感和动态表现。

### 相机运动模糊

```glsl
// motion_blur_camera.frag - 基于速度缓冲的运动模糊
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D colorTexture;
uniform sampler2D depthTexture;
uniform sampler2D velocityTexture;  // 屏幕空间速度

uniform mat4 currentViewProj;
uniform mat4 prevViewProj;
uniform mat4 invViewProj;

uniform float velocityScale;
uniform int sampleCount;

// 从深度重建世界坐标
vec3 ReconstructWorldPos(vec2 uv, float depth) {
    vec4 clipPos = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 worldPos = invViewProj * clipPos;
    return worldPos.xyz / worldPos.w;
}

// 计算像素速度（当没有 velocity buffer 时）
vec2 CalculateVelocity(vec2 uv, float depth) {
    vec3 worldPos = ReconstructWorldPos(uv, depth);

    // 当前帧位置
    vec4 currentClip = currentViewProj * vec4(worldPos, 1.0);
    vec2 currentNDC = currentClip.xy / currentClip.w;

    // 上一帧位置
    vec4 prevClip = prevViewProj * vec4(worldPos, 1.0);
    vec2 prevNDC = prevClip.xy / prevClip.w;

    // 速度 = 当前位置 - 上一帧位置
    return (currentNDC - prevNDC) * 0.5;  // NDC -> UV 空间
}

void main() {
    float depth = texture(depthTexture, TexCoords).r;

    // 获取或计算速度
    vec2 velocity = texture(velocityTexture, TexCoords).rg;
    // 或者：vec2 velocity = CalculateVelocity(TexCoords, depth);

    velocity *= velocityScale;

    // 限制最大速度（像素）
    float maxVelocity = 32.0;
    float velocityLength = length(velocity);
    if (velocityLength > maxVelocity / textureSize(colorTexture, 0).x) {
        velocity = normalize(velocity) * maxVelocity / textureSize(colorTexture, 0).x;
    }

    // 沿速度方向采样
    vec3 color = vec3(0.0);
    float totalWeight = 0.0;

    for (int i = 0; i < sampleCount; ++i) {
        float t = float(i) / float(sampleCount - 1) - 0.5;  // -0.5 到 0.5
        vec2 sampleUV = TexCoords + velocity * t;

        // 权重：中心采样点权重最高
        float weight = 1.0 - abs(t * 2.0);

        color += texture(colorTexture, sampleUV).rgb * weight;
        totalWeight += weight;
    }

    FragColor = vec4(color / totalWeight, 1.0);
}
```

### 物体运动模糊（Per-Object）

```glsl
// vertex shader - 输出速度
#version 330 core

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoords;

out vec2 TexCoords;
out vec4 CurrentPos;
out vec4 PrevPos;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat4 prevModel;
uniform mat4 prevViewProj;

void main() {
    TexCoords = aTexCoords;

    // 当前帧位置
    vec4 worldPos = model * vec4(aPosition, 1.0);
    CurrentPos = projection * view * worldPos;
    gl_Position = CurrentPos;

    // 上一帧位置
    vec4 prevWorldPos = prevModel * vec4(aPosition, 1.0);
    PrevPos = prevViewProj * prevWorldPos;
}

// fragment shader - 写入速度缓冲
#version 330 core

in vec4 CurrentPos;
in vec4 PrevPos;

out vec2 Velocity;

void main() {
    vec2 currentNDC = CurrentPos.xy / CurrentPos.w;
    vec2 prevNDC = PrevPos.xy / PrevPos.w;

    Velocity = (currentNDC - prevNDC) * 0.5;
}
```

### 径向运动模糊

```glsl
// radial_blur.frag - 径向/缩放模糊（用于加速效果）
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D colorTexture;
uniform vec2 center;        // 模糊中心（归一化坐标）
uniform float strength;     // 模糊强度
uniform int sampleCount;

void main() {
    vec2 direction = TexCoords - center;
    float dist = length(direction);

    // 距离中心越远，模糊越强
    float blurAmount = dist * strength;

    vec3 color = vec3(0.0);
    float totalWeight = 0.0;

    for (int i = 0; i < sampleCount; ++i) {
        float t = float(i) / float(sampleCount - 1);
        vec2 offset = direction * blurAmount * (t - 0.5);

        float weight = 1.0 - abs(t - 0.5) * 2.0;
        color += texture(colorTexture, TexCoords - offset).rgb * weight;
        totalWeight += weight;
    }

    FragColor = vec4(color / totalWeight, 1.0);
}
```

## 色调映射（Tone Mapping）

色调映射将 HDR 图像转换为 LDR 显示范围，是 HDR 渲染管线的关键步骤。

### 常用色调映射算法

```glsl
// tonemapping.frag - 多种色调映射算法
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D hdrTexture;
uniform float exposure;
uniform int tonemapOperator;  // 0-5

// 1. Reinhard 基础版
vec3 ReinhardTonemap(vec3 color) {
    return color / (color + vec3(1.0));
}

// 2. Reinhard 扩展版（可控最大亮度）
vec3 ReinhardExtended(vec3 color, float maxWhite) {
    vec3 numerator = color * (1.0 + color / (maxWhite * maxWhite));
    return numerator / (1.0 + color);
}

// 3. Filmic（Uncharted 2 风格）
vec3 Uncharted2Tonemap(vec3 x) {
    float A = 0.15;  // Shoulder Strength
    float B = 0.50;  // Linear Strength
    float C = 0.10;  // Linear Angle
    float D = 0.20;  // Toe Strength
    float E = 0.02;  // Toe Numerator
    float F = 0.30;  // Toe Denominator

    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

vec3 FilmicTonemap(vec3 color) {
    float exposureBias = 2.0;
    vec3 curr = Uncharted2Tonemap(color * exposureBias);

    vec3 W = vec3(11.2);
    vec3 whiteScale = vec3(1.0) / Uncharted2Tonemap(W);

    return curr * whiteScale;
}

// 4. ACES（Academy Color Encoding System）
vec3 ACESFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;

    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// 5. ACES 近似（更快）
vec3 ACESApprox(vec3 color) {
    color *= 0.6;
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
}

// 6. AgX（更现代的选择）
vec3 AgXDefaultContrastApprox(vec3 x) {
    vec3 x2 = x * x;
    vec3 x4 = x2 * x2;

    return + 15.5     * x4 * x2
           - 40.14    * x4 * x
           + 31.96    * x4
           - 6.868    * x2 * x
           + 0.4298   * x2
           + 0.1191   * x
           - 0.00232;
}

void main() {
    vec3 hdrColor = texture(hdrTexture, TexCoords).rgb;

    // 应用曝光
    hdrColor *= exposure;

    vec3 ldrColor;

    switch (tonemapOperator) {
        case 0:
            ldrColor = ReinhardTonemap(hdrColor);
            break;
        case 1:
            ldrColor = ReinhardExtended(hdrColor, 4.0);
            break;
        case 2:
            ldrColor = FilmicTonemap(hdrColor);
            break;
        case 3:
            ldrColor = ACESFilm(hdrColor);
            break;
        case 4:
            ldrColor = ACESApprox(hdrColor);
            break;
        default:
            ldrColor = hdrColor;
    }

    FragColor = vec4(ldrColor, 1.0);
}
```

### 自动曝光（Auto Exposure）

```glsl
// luminance_histogram.comp - 计算亮度直方图
#version 430 core

layout(local_size_x = 16, local_size_y = 16) in;

layout(rgba16f, binding = 0) uniform readonly image2D hdrImage;
layout(std430, binding = 1) buffer HistogramBuffer {
    uint histogram[256];
};

uniform float minLogLum;
uniform float logLumRange;

shared uint localHistogram[256];

void main() {
    // 初始化共享内存
    if (gl_LocalInvocationIndex < 256) {
        localHistogram[gl_LocalInvocationIndex] = 0;
    }
    barrier();

    ivec2 pixelCoord = ivec2(gl_GlobalInvocationID.xy);
    ivec2 imageSize = imageSize(hdrImage);

    if (pixelCoord.x < imageSize.x && pixelCoord.y < imageSize.y) {
        vec3 color = imageLoad(hdrImage, pixelCoord).rgb;

        // 计算亮度
        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));

        // 转换为直方图索引
        float logLum = log2(luminance + 0.00001);
        float normalizedLum = (logLum - minLogLum) / logLumRange;
        uint binIndex = uint(clamp(normalizedLum, 0.0, 1.0) * 255.0);

        atomicAdd(localHistogram[binIndex], 1);
    }

    barrier();

    // 合并到全局直方图
    if (gl_LocalInvocationIndex < 256) {
        atomicAdd(histogram[gl_LocalInvocationIndex],
                  localHistogram[gl_LocalInvocationIndex]);
    }
}
```

```cpp
// 自动曝光计算
class AutoExposure {
private:
    GLuint histogramBuffer;
    GLuint averageLuminanceBuffer;

    ComputeShader histogramShader;
    ComputeShader averageShader;

    float minLogLuminance = -10.0f;
    float maxLogLuminance = 2.0f;
    float adaptationSpeed = 1.0f;
    float targetExposure = 0.0f;

public:
    void ComputeExposure(GLuint hdrTexture, float deltaTime) {
        // 清空直方图
        glBindBuffer(GL_SHADER_STORAGE_BUFFER, histogramBuffer);
        glClearBufferData(GL_SHADER_STORAGE_BUFFER, GL_R32UI,
                          GL_RED_INTEGER, GL_UNSIGNED_INT, nullptr);

        // 计算直方图
        histogramShader.Use();
        histogramShader.SetFloat("minLogLum", minLogLuminance);
        histogramShader.SetFloat("logLumRange",
                                  maxLogLuminance - minLogLuminance);

        glBindImageTexture(0, hdrTexture, 0, GL_FALSE, 0,
                          GL_READ_ONLY, GL_RGBA16F);
        glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 1, histogramBuffer);

        glDispatchCompute((screenWidth + 15) / 16,
                          (screenHeight + 15) / 16, 1);
        glMemoryBarrier(GL_SHADER_STORAGE_BARRIER_BIT);

        // 计算平均亮度
        averageShader.Use();
        averageShader.SetFloat("minLogLum", minLogLuminance);
        averageShader.SetFloat("logLumRange",
                                maxLogLuminance - minLogLuminance);
        averageShader.SetInt("totalPixels", screenWidth * screenHeight);

        glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 1, histogramBuffer);
        glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 2, averageLuminanceBuffer);

        glDispatchCompute(1, 1, 1);
        glMemoryBarrier(GL_SHADER_STORAGE_BARRIER_BIT);

        // 读取结果
        float avgLuminance;
        glBindBuffer(GL_SHADER_STORAGE_BUFFER, averageLuminanceBuffer);
        glGetBufferSubData(GL_SHADER_STORAGE_BUFFER, 0,
                          sizeof(float), &avgLuminance);

        // 计算目标曝光
        float targetLum = 0.18f;  // 中间灰
        float newExposure = targetLum / avgLuminance;

        // 平滑过渡
        targetExposure = glm::mix(targetExposure, newExposure,
                                   1.0f - exp(-deltaTime * adaptationSpeed));
    }

    float GetExposure() const { return targetExposure; }
};
```

## 颜色分级（Color Grading）

颜色分级用于调整图像的整体色调、对比度和饱和度，是营造视觉风格的重要工具。

### 基础颜色调整

```glsl
// color_grading.frag - 颜色分级
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D inputTexture;

// 基础调整参数
uniform float contrast;     // 对比度
uniform float saturation;   // 饱和度
uniform float brightness;   // 亮度
uniform vec3 colorFilter;   // 颜色滤镜
uniform float temperature;  // 色温 (-1 到 1)
uniform float tint;         // 色调 (-1 到 1)

// 分离调整参数
uniform vec3 shadows;       // 暗部颜色偏移
uniform vec3 midtones;      // 中间调颜色偏移
uniform vec3 highlights;    // 高光颜色偏移

// 色调映射曲线参数
uniform vec3 lift;          // 黑场
uniform vec3 gamma;         // 伽马
uniform vec3 gain;          // 白场

// 计算亮度
float Luminance(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

// 色温调整（基于 Planckian locus 近似）
vec3 WhiteBalance(vec3 color, float temp, float tint) {
    // 简化的色温调整
    float t1 = temp * 0.1;
    float t2 = tint * 0.1;

    float x = 0.31271 - t1 * 0.1;
    float y = 0.32902 + t2 * 0.1;

    // D65 白点
    float X = x / y;
    float Z = (1.0 - x - y) / y;

    // 简化的颜色变换
    color.r *= 1.0 + t1;
    color.b *= 1.0 - t1;
    color.g *= 1.0 + t2 * 0.5;

    return color;
}

// Lift-Gamma-Gain 调整
vec3 LiftGammaGain(vec3 color, vec3 lift, vec3 gamma, vec3 gain) {
    // Lift: 调整黑场
    color = color * (1.5 - 0.5 * lift) + 0.5 * lift - 0.5;
    color = clamp(color, 0.0, 1.0);

    // Gamma: 调整中间调
    color = pow(color, 1.0 / gamma);

    // Gain: 调整白场
    color *= gain;

    return clamp(color, 0.0, 1.0);
}

// 分离色调（shadows/midtones/highlights）
vec3 ColorBalance(vec3 color, vec3 shadows, vec3 midtones, vec3 highlights) {
    float lum = Luminance(color);

    // 计算每个区域的权重
    float shadowWeight = 1.0 - smoothstep(0.0, 0.3, lum);
    float highlightWeight = smoothstep(0.5, 1.0, lum);
    float midtoneWeight = 1.0 - shadowWeight - highlightWeight;

    // 应用颜色偏移
    vec3 shadowColor = color + shadows * shadowWeight;
    vec3 midtoneColor = color + midtones * midtoneWeight;
    vec3 highlightColor = color + highlights * highlightWeight;

    return shadowColor + midtoneColor + highlightColor - 2.0 * color;
}

void main() {
    vec3 color = texture(inputTexture, TexCoords).rgb;

    // 1. 色温调整
    color = WhiteBalance(color, temperature, tint);

    // 2. 亮度
    color *= brightness;

    // 3. 对比度
    color = (color - 0.5) * contrast + 0.5;

    // 4. 饱和度
    float lum = Luminance(color);
    color = mix(vec3(lum), color, saturation);

    // 5. 颜色滤镜
    color *= colorFilter;

    // 6. 分离调色
    color = ColorBalance(color, shadows, midtones, highlights);

    // 7. Lift-Gamma-Gain
    color = LiftGammaGain(color, lift, gamma, gain);

    FragColor = vec4(color, 1.0);
}
```

### LUT（查找表）颜色分级

```glsl
// lut_grading.frag - 使用 3D LUT 进行颜色分级
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D inputTexture;
uniform sampler3D lutTexture;
uniform float lutIntensity;

void main() {
    vec3 color = texture(inputTexture, TexCoords).rgb;

    // 确保颜色在 0-1 范围内
    color = clamp(color, 0.0, 1.0);

    // LUT 采样（考虑边缘偏移）
    float lutSize = float(textureSize(lutTexture, 0).x);
    vec3 scale = (lutSize - 1.0) / lutSize;
    vec3 offset = 0.5 / lutSize;

    vec3 lutColor = texture(lutTexture, color * scale + offset).rgb;

    // 混合原始颜色和 LUT 结果
    vec3 result = mix(color, lutColor, lutIntensity);

    FragColor = vec4(result, 1.0);
}
```

```cpp
// 加载 LUT 纹理（从 PNG 条带格式）
GLuint LoadLUTTexture(const char* path, int lutSize) {
    int width, height, channels;
    unsigned char* data = stbi_load(path, &width, &height, &channels, 3);

    if (!data) {
        std::cerr << "Failed to load LUT: " << path << std::endl;
        return 0;
    }

    // 验证尺寸（通常是 512x512 的 64x64x64 LUT）
    assert(width == lutSize * lutSize);
    assert(height == lutSize);

    // 创建 3D 纹理
    GLuint texture;
    glGenTextures(1, &texture);
    glBindTexture(GL_TEXTURE_3D, texture);

    // 转换为 3D 纹理数据
    std::vector<unsigned char> texture3D(lutSize * lutSize * lutSize * 3);

    for (int b = 0; b < lutSize; ++b) {
        for (int g = 0; g < lutSize; ++g) {
            for (int r = 0; r < lutSize; ++r) {
                int srcX = r + b * lutSize;
                int srcY = g;
                int srcIdx = (srcY * width + srcX) * 3;

                int dstIdx = (b * lutSize * lutSize + g * lutSize + r) * 3;

                texture3D[dstIdx + 0] = data[srcIdx + 0];
                texture3D[dstIdx + 1] = data[srcIdx + 1];
                texture3D[dstIdx + 2] = data[srcIdx + 2];
            }
        }
    }

    glTexImage3D(GL_TEXTURE_3D, 0, GL_RGB8,
                 lutSize, lutSize, lutSize, 0,
                 GL_RGB, GL_UNSIGNED_BYTE, texture3D.data());

    glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_R, GL_CLAMP_TO_EDGE);

    stbi_image_free(data);

    return texture;
}
```

## 抗锯齿（Anti-Aliasing）

### FXAA（Fast Approximate Anti-Aliasing）

```glsl
// fxaa.frag - FXAA 3.11 质量版
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D inputTexture;
uniform vec2 texelSize;

// FXAA 参数
#define FXAA_EDGE_THRESHOLD     (1.0 / 8.0)
#define FXAA_EDGE_THRESHOLD_MIN (1.0 / 24.0)
#define FXAA_SEARCH_STEPS       16
#define FXAA_SEARCH_ACCELERATION 1
#define FXAA_SUBPIX_CAP         (3.0 / 4.0)
#define FXAA_SUBPIX_TRIM        (1.0 / 4.0)

float FxaaLuma(vec3 rgb) {
    return rgb.g * (0.587 / 0.299) + rgb.r;
}

vec3 FxaaPixelShader(vec2 pos, sampler2D tex, vec2 rcpFrame) {
    // 采样周围像素亮度
    float lumaN = FxaaLuma(textureOffset(tex, pos, ivec2(0, -1)).rgb);
    float lumaW = FxaaLuma(textureOffset(tex, pos, ivec2(-1, 0)).rgb);
    float lumaM = FxaaLuma(texture(tex, pos).rgb);
    float lumaE = FxaaLuma(textureOffset(tex, pos, ivec2(1, 0)).rgb);
    float lumaS = FxaaLuma(textureOffset(tex, pos, ivec2(0, 1)).rgb);

    float rangeMin = min(lumaM, min(min(lumaN, lumaW), min(lumaS, lumaE)));
    float rangeMax = max(lumaM, max(max(lumaN, lumaW), max(lumaS, lumaE)));
    float range = rangeMax - rangeMin;

    // 对比度不够高，跳过处理
    if (range < max(FXAA_EDGE_THRESHOLD_MIN, rangeMax * FXAA_EDGE_THRESHOLD)) {
        return texture(tex, pos).rgb;
    }

    // 采样对角线像素
    float lumaNW = FxaaLuma(textureOffset(tex, pos, ivec2(-1, -1)).rgb);
    float lumaNE = FxaaLuma(textureOffset(tex, pos, ivec2(1, -1)).rgb);
    float lumaSW = FxaaLuma(textureOffset(tex, pos, ivec2(-1, 1)).rgb);
    float lumaSE = FxaaLuma(textureOffset(tex, pos, ivec2(1, 1)).rgb);

    // 计算边缘方向
    float lumaL = (lumaN + lumaW + lumaS + lumaE) * 0.25;
    float rangeL = abs(lumaL - lumaM);
    float blendL = max(0.0, (rangeL / range) - FXAA_SUBPIX_TRIM) * (1.0 / (1.0 - FXAA_SUBPIX_TRIM));
    blendL = min(FXAA_SUBPIX_CAP, blendL);

    // 计算边缘法线
    float edgeVert = abs((0.25 * lumaNW) + (-0.5 * lumaN) + (0.25 * lumaNE)) +
                     abs((0.50 * lumaW ) + (-1.0 * lumaM) + (0.50 * lumaE )) +
                     abs((0.25 * lumaSW) + (-0.5 * lumaS) + (0.25 * lumaSE));
    float edgeHorz = abs((0.25 * lumaNW) + (-0.5 * lumaW) + (0.25 * lumaSW)) +
                     abs((0.50 * lumaN ) + (-1.0 * lumaM) + (0.50 * lumaS )) +
                     abs((0.25 * lumaNE) + (-0.5 * lumaE) + (0.25 * lumaSE));
    bool horzSpan = edgeHorz >= edgeVert;

    // 搜索边缘端点
    vec2 posN, posP;
    float lumaEndN, lumaEndP;

    if (horzSpan) {
        posN = pos + vec2(-rcpFrame.x, 0);
        posP = pos + vec2(rcpFrame.x, 0);
    } else {
        posN = pos + vec2(0, -rcpFrame.y);
        posP = pos + vec2(0, rcpFrame.y);
    }

    // 沿边缘搜索
    float gradientN = horzSpan ? (lumaN - lumaM) : (lumaW - lumaM);
    float gradientP = horzSpan ? (lumaS - lumaM) : (lumaE - lumaM);

    bool doneN = false;
    bool doneP = false;
    float lumaNN = lumaN;
    float lumaPP = lumaS;

    if (abs(gradientN) >= abs(gradientP)) {
        gradientN = gradientP;
    }

    for (int i = 0; i < FXAA_SEARCH_STEPS; i++) {
        if (!doneN) {
            lumaEndN = FxaaLuma(texture(tex, posN).rgb);
            doneN = abs(lumaEndN - lumaNN) >= gradientN;
            posN -= horzSpan ? vec2(rcpFrame.x, 0) : vec2(0, rcpFrame.y);
        }
        if (!doneP) {
            lumaEndP = FxaaLuma(texture(tex, posP).rgb);
            doneP = abs(lumaEndP - lumaPP) >= gradientN;
            posP += horzSpan ? vec2(rcpFrame.x, 0) : vec2(0, rcpFrame.y);
        }
        if (doneN && doneP) break;
    }

    // 计算混合因子
    float dstN = horzSpan ? (pos.x - posN.x) : (pos.y - posN.y);
    float dstP = horzSpan ? (posP.x - pos.x) : (posP.y - pos.y);
    float dst = min(dstN, dstP);
    float spanLength = (dstN + dstP);
    float pixelOffset = 0.5 - dst / spanLength;

    float subPixelOffset = max(pixelOffset, blendL);

    // 最终采样
    vec2 finalPos = pos;
    if (horzSpan) {
        finalPos.y += subPixelOffset * rcpFrame.y * sign(gradientN);
    } else {
        finalPos.x += subPixelOffset * rcpFrame.x * sign(gradientN);
    }

    return texture(tex, finalPos).rgb;
}

void main() {
    FragColor = vec4(FxaaPixelShader(TexCoords, inputTexture, texelSize), 1.0);
}
```

### TAA（Temporal Anti-Aliasing）

```glsl
// taa.frag - 时间抗锯齿
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D currentFrame;
uniform sampler2D historyFrame;
uniform sampler2D velocityTexture;
uniform sampler2D depthTexture;

uniform vec2 texelSize;
uniform float blendFactor;  // 通常 0.1-0.2

// 3x3 邻域裁剪
vec3 ClipAABB(vec3 aabbMin, vec3 aabbMax, vec3 p, vec3 q) {
    vec3 center = 0.5 * (aabbMax + aabbMin);
    vec3 extents = 0.5 * (aabbMax - aabbMin) + 0.001;

    vec3 delta = q - center;
    vec3 v = abs(delta / extents);
    float factor = max(v.x, max(v.y, v.z));

    if (factor > 1.0) {
        return center + delta / factor;
    }
    return q;
}

// YCoCg 颜色空间（更适合 TAA）
vec3 RGBToYCoCg(vec3 rgb) {
    float Y  = (rgb.r + 2.0 * rgb.g + rgb.b) * 0.25;
    float Co = (rgb.r - rgb.b) * 0.5;
    float Cg = (-rgb.r + 2.0 * rgb.g - rgb.b) * 0.25;
    return vec3(Y, Co, Cg);
}

vec3 YCoCgToRGB(vec3 ycocg) {
    float Y = ycocg.x;
    float Co = ycocg.y;
    float Cg = ycocg.z;

    float r = Y + Co - Cg;
    float g = Y + Cg;
    float b = Y - Co - Cg;
    return vec3(r, g, b);
}

void main() {
    // 获取速度进行重投影
    vec2 velocity = texture(velocityTexture, TexCoords).rg;
    vec2 historyUV = TexCoords - velocity;

    // 当前帧采样
    vec3 current = texture(currentFrame, TexCoords).rgb;

    // 历史帧采样
    vec3 history = texture(historyFrame, historyUV).rgb;

    // 计算邻域的颜色范围
    vec3 nearColor[9];
    int idx = 0;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(x, y) * texelSize;
            nearColor[idx++] = texture(currentFrame, TexCoords + offset).rgb;
        }
    }

    // 转换到 YCoCg 空间
    vec3 currentYCoCg = RGBToYCoCg(current);
    vec3 historyYCoCg = RGBToYCoCg(history);

    vec3 nearYCoCg[9];
    for (int i = 0; i < 9; i++) {
        nearYCoCg[i] = RGBToYCoCg(nearColor[i]);
    }

    // 计算 AABB
    vec3 aabbMin = nearYCoCg[0];
    vec3 aabbMax = nearYCoCg[0];
    for (int i = 1; i < 9; i++) {
        aabbMin = min(aabbMin, nearYCoCg[i]);
        aabbMax = max(aabbMax, nearYCoCg[i]);
    }

    // 裁剪历史颜色到当前邻域范围
    vec3 clippedHistory = ClipAABB(aabbMin, aabbMax, currentYCoCg, historyYCoCg);
    clippedHistory = YCoCgToRGB(clippedHistory);

    // 检测遮挡/失效
    float validHistory = 1.0;
    if (historyUV.x < 0.0 || historyUV.x > 1.0 ||
        historyUV.y < 0.0 || historyUV.y > 1.0) {
        validHistory = 0.0;
    }

    // 自适应混合因子
    float lum0 = dot(current, vec3(0.2126, 0.7152, 0.0722));
    float lum1 = dot(clippedHistory, vec3(0.2126, 0.7152, 0.0722));
    float diff = abs(lum0 - lum1) / max(lum0, max(lum1, 0.2));

    float finalBlend = mix(blendFactor, 0.8, diff);
    finalBlend = mix(finalBlend, 1.0, 1.0 - validHistory);

    // 混合当前帧和历史帧
    vec3 result = mix(clippedHistory, current, finalBlend);

    FragColor = vec4(result, 1.0);
}
```

### TAA 抖动矩阵

```cpp
// TAA 需要每帧抖动投影矩阵
class TAAJitter {
private:
    std::vector<glm::vec2> haltonSequence;
    int frameIndex = 0;
    int sequenceLength = 16;

    // 生成 Halton 序列
    float Halton(int index, int base) {
        float f = 1.0f;
        float r = 0.0f;
        while (index > 0) {
            f /= base;
            r += f * (index % base);
            index /= base;
        }
        return r;
    }

public:
    void Initialize() {
        haltonSequence.resize(sequenceLength);
        for (int i = 0; i < sequenceLength; ++i) {
            haltonSequence[i] = glm::vec2(
                Halton(i + 1, 2) - 0.5f,
                Halton(i + 1, 3) - 0.5f
            );
        }
    }

    glm::mat4 GetJitteredProjection(const glm::mat4& projection,
                                      int screenWidth, int screenHeight) {
        glm::vec2 jitter = haltonSequence[frameIndex % sequenceLength];

        // 转换为像素偏移
        jitter.x /= screenWidth;
        jitter.y /= screenHeight;

        // 应用抖动
        glm::mat4 jitteredProj = projection;
        jitteredProj[2][0] += jitter.x * 2.0f;
        jitteredProj[2][1] += jitter.y * 2.0f;

        return jitteredProj;
    }

    void NextFrame() {
        frameIndex = (frameIndex + 1) % sequenceLength;
    }

    glm::vec2 GetCurrentJitter() const {
        return haltonSequence[frameIndex % sequenceLength];
    }
};
```

## 体积光（Volumetric Lighting）

体积光效果模拟光线穿过空气中的尘埃或雾气时产生的"上帝之光"效果。

### 屏幕空间体积光

```glsl
// volumetric_light.frag - 屏幕空间射线步进
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D depthTexture;
uniform sampler2D shadowMap;

uniform mat4 invViewProj;
uniform mat4 lightViewProj;
uniform vec3 lightDir;
uniform vec3 lightColor;
uniform vec3 cameraPos;

uniform float density;       // 体积密度
uniform float scattering;    // 散射系数
uniform int sampleCount;     // 采样次数

// Henyey-Greenstein 相位函数
float HenyeyGreenstein(float cosTheta, float g) {
    float g2 = g * g;
    return (1.0 - g2) / (4.0 * 3.14159 * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
}

// 重建世界位置
vec3 ReconstructWorldPos(vec2 uv, float depth) {
    vec4 clipPos = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 worldPos = invViewProj * clipPos;
    return worldPos.xyz / worldPos.w;
}

// 检查是否在阴影中
float GetShadow(vec3 worldPos) {
    vec4 lightSpacePos = lightViewProj * vec4(worldPos, 1.0);
    vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;
    projCoords = projCoords * 0.5 + 0.5;

    if (projCoords.z > 1.0 || projCoords.x < 0.0 || projCoords.x > 1.0 ||
        projCoords.y < 0.0 || projCoords.y > 1.0) {
        return 1.0;
    }

    float closestDepth = texture(shadowMap, projCoords.xy).r;
    float currentDepth = projCoords.z;

    return currentDepth - 0.001 > closestDepth ? 0.0 : 1.0;
}

void main() {
    float depth = texture(depthTexture, TexCoords).r;
    vec3 worldPos = ReconstructWorldPos(TexCoords, depth);

    vec3 rayDir = normalize(worldPos - cameraPos);
    float rayLength = length(worldPos - cameraPos);
    float stepSize = rayLength / float(sampleCount);

    // 计算散射相位
    float cosTheta = dot(rayDir, -lightDir);
    float phase = HenyeyGreenstein(cosTheta, scattering);

    // 射线步进累积
    vec3 accumScattering = vec3(0.0);
    float transmittance = 1.0;

    // 使用蓝噪声或抖动偏移起始位置
    float ditherOffset = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);

    for (int i = 0; i < sampleCount; ++i) {
        float t = (float(i) + ditherOffset) * stepSize;
        vec3 samplePos = cameraPos + rayDir * t;

        // 检查该点是否被照亮
        float shadow = GetShadow(samplePos);

        // 累积散射
        float scatterAmount = density * stepSize;
        vec3 inScattering = shadow * lightColor * phase * scatterAmount;

        accumScattering += transmittance * inScattering;
        transmittance *= exp(-scatterAmount);

        // 提前退出优化
        if (transmittance < 0.01) break;
    }

    FragColor = vec4(accumScattering, 1.0 - transmittance);
}
```

### 体积雾

```glsl
// volumetric_fog.frag - 高度雾 + 距离雾
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D colorTexture;
uniform sampler2D depthTexture;

uniform mat4 invViewProj;
uniform vec3 cameraPos;

uniform vec3 fogColor;
uniform float fogDensity;
uniform float fogHeightFalloff;
uniform float fogStartDistance;
uniform float fogMaxDistance;

// 指数高度雾
float ExponentialHeightFog(vec3 worldPos) {
    // 距离雾
    float dist = length(worldPos - cameraPos);
    float distanceFog = 1.0 - exp(-dist * fogDensity);

    // 高度雾
    float heightDiff = worldPos.y - cameraPos.y;
    float heightFog = exp(-max(worldPos.y, 0.0) * fogHeightFalloff);

    // 合并
    float fog = distanceFog * heightFog;

    // 距离限制
    fog *= smoothstep(fogStartDistance, fogMaxDistance, dist);

    return clamp(fog, 0.0, 1.0);
}

vec3 ReconstructWorldPos(vec2 uv, float depth) {
    vec4 clipPos = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 worldPos = invViewProj * clipPos;
    return worldPos.xyz / worldPos.w;
}

void main() {
    vec3 color = texture(colorTexture, TexCoords).rgb;
    float depth = texture(depthTexture, TexCoords).r;

    // 天空不应用雾
    if (depth >= 1.0) {
        FragColor = vec4(color, 1.0);
        return;
    }

    vec3 worldPos = ReconstructWorldPos(TexCoords, depth);
    float fogAmount = ExponentialHeightFog(worldPos);

    // 混合雾色
    vec3 finalColor = mix(color, fogColor, fogAmount);

    FragColor = vec4(finalColor, 1.0);
}
```

## 其他常用效果

### 晕影效果（Vignette）

```glsl
// vignette.frag
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D inputTexture;
uniform float intensity;    // 晕影强度
uniform float smoothness;   // 边缘柔和度
uniform float roundness;    // 形状（0=矩形，1=圆形）
uniform vec2 center;        // 中心点

void main() {
    vec3 color = texture(inputTexture, TexCoords).rgb;

    vec2 uv = TexCoords - center;

    // 处理宽高比
    float aspect = textureSize(inputTexture, 0).x / textureSize(inputTexture, 0).y;
    uv.x *= aspect;

    // 计算距离
    float dist = length(uv);

    // 晕影计算
    float vignette = smoothstep(intensity, intensity - smoothness, dist);

    FragColor = vec4(color * vignette, 1.0);
}
```

### 色差效果（Chromatic Aberration）

```glsl
// chromatic_aberration.frag
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D inputTexture;
uniform float intensity;
uniform vec2 center;

void main() {
    vec2 direction = TexCoords - center;
    float dist = length(direction);

    // 基于距离的偏移量
    vec2 offset = direction * dist * intensity;

    // 分别采样 RGB 通道
    float r = texture(inputTexture, TexCoords + offset).r;
    float g = texture(inputTexture, TexCoords).g;
    float b = texture(inputTexture, TexCoords - offset).b;

    FragColor = vec4(r, g, b, 1.0);
}
```

### 锐化效果（Sharpening）

```glsl
// sharpen.frag - Unsharp Mask
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D inputTexture;
uniform float amount;
uniform vec2 texelSize;

void main() {
    vec3 center = texture(inputTexture, TexCoords).rgb;

    // 3x3 高斯模糊
    vec3 blur = vec3(0.0);
    float weights[9] = float[](
        1.0/16.0, 2.0/16.0, 1.0/16.0,
        2.0/16.0, 4.0/16.0, 2.0/16.0,
        1.0/16.0, 2.0/16.0, 1.0/16.0
    );

    int idx = 0;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 offset = vec2(x, y) * texelSize;
            blur += texture(inputTexture, TexCoords + offset).rgb * weights[idx++];
        }
    }

    // Unsharp Mask: 原图 + (原图 - 模糊图) * 强度
    vec3 sharpened = center + (center - blur) * amount;

    FragColor = vec4(sharpened, 1.0);
}
```

### 胶片颗粒效果（Film Grain）

```glsl
// film_grain.frag
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D inputTexture;
uniform float time;
uniform float intensity;
uniform float luminanceAffect;  // 亮度影响：暗部更多噪点

// 噪声函数
float Noise(vec2 uv) {
    return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec3 color = texture(inputTexture, TexCoords).rgb;

    // 生成时变噪声
    float grain = Noise(TexCoords * 1000.0 + time * 100.0);
    grain = (grain - 0.5) * 2.0;  // -1 到 1

    // 亮度影响（暗部更多噪点）
    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    float grainAmount = intensity * mix(1.0, 1.0 - luminance, luminanceAffect);

    // 应用噪点
    color += grain * grainAmount;

    FragColor = vec4(color, 1.0);
}
```

## 性能优化技巧

### 降采样处理

```cpp
// 对开销大的效果使用半分辨率处理
class OptimizedBloom {
    void Apply() {
        // 1. 在半分辨率下进行 Bloom 计算
        glViewport(0, 0, width / 2, height / 2);
        // ... Bloom 处理 ...

        // 2. 双线性上采样回全分辨率
        glViewport(0, 0, width, height);
        upsampleShader.Use();
        // ...
    }
};
```

### 效果合并

```glsl
// 将多个简单效果合并到一个 Pass
// combined_effects.frag
#version 330 core

out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D inputTexture;

// 所有效果参数
uniform float vignetteIntensity;
uniform float grainIntensity;
uniform vec3 colorTint;
uniform float exposure;

void main() {
    vec3 color = texture(inputTexture, TexCoords).rgb;

    // 曝光
    color *= exposure;

    // 颜色调整
    color *= colorTint;

    // 晕影
    vec2 uv = TexCoords - 0.5;
    float vignette = 1.0 - dot(uv, uv) * vignetteIntensity;
    color *= vignette;

    // 噪点
    float grain = fract(sin(dot(TexCoords + fract(time), vec2(12.9898, 78.233))) * 43758.5453);
    color += (grain - 0.5) * grainIntensity;

    FragColor = vec4(color, 1.0);
}
```

### 自适应质量

```cpp
// 根据帧率动态调整后处理质量
class AdaptiveQuality {
    void Update(float deltaTime, float targetFPS) {
        currentFPS = 1.0f / deltaTime;

        if (currentFPS < targetFPS * 0.9f) {
            // 降低质量
            bloomQuality = std::max(bloomQuality - 1, 0);
            dofSamples = std::max(dofSamples - 4, 8);
            motionBlurSamples = std::max(motionBlurSamples - 2, 4);
        } else if (currentFPS > targetFPS * 1.1f) {
            // 提高质量
            bloomQuality = std::min(bloomQuality + 1, 3);
            dofSamples = std::min(dofSamples + 4, 32);
            motionBlurSamples = std::min(motionBlurSamples + 2, 16);
        }
    }
};
```

## 面试要点

### 核心概念题

**Q1: 后处理管线的执行顺序应该如何安排？**

```
推荐顺序（从前到后）：
1. HDR 效果（需要高动态范围数据）
   - Bloom
   - 体积光
   - 镜头光晕

2. 景深/运动模糊（依赖深度/速度信息）
   - DOF
   - Motion Blur

3. 色调映射（HDR -> LDR 转换）
   - Tonemapping
   - 自动曝光

4. 颜色处理（在 LDR 空间进行）
   - 颜色分级
   - LUT 应用

5. 最终处理
   - 抗锯齿（FXAA/SMAA）
   - 晕影
   - 噪点/颗粒
```

**Q2: Bloom 效果为什么需要多级模糊？**

```
原因：
1. 性能优化：
   - 直接在全分辨率做大范围模糊开销极高
   - 多级下采样减少采样数量

2. 质量提升：
   - 多级混合产生更自然的光晕渐变
   - 避免单一模糊半径的"硬边"效果

3. 更好的能量保守：
   - 逐级混合保持总体亮度一致
   - 避免过度模糊导致的能量损失
```

**Q3: TAA 如何解决鬼影问题？**

```glsl
解决方案：
1. 速度缓冲重投影：
   - 使用运动向量找到历史帧对应位置
   - 正确处理移动物体

2. 邻域裁剪：
   - 计算当前帧 3x3 邻域的颜色范围
   - 将历史颜色裁剪到该范围内
   - 防止过时的历史数据污染

3. 置信度调整：
   - 检测遮挡/失效情况
   - 动态调整历史帧权重
```

### 性能优化题

**Q4: 如何优化后处理管线的性能？**

```
1. 降采样处理：
   - Bloom、体积光等在 1/2 或 1/4 分辨率处理
   - 最后双线性上采样

2. 效果合并：
   - 将多个简单效果合并为一个 Pass
   - 减少纹理读写次数

3. 异步计算：
   - 将直方图计算等放到 Compute Shader
   - 利用 GPU 并行能力

4. 自适应质量：
   - 根据帧率动态调整采样数量
   - 在低端设备禁用部分效果

5. 早期退出：
   - 检测无变化区域跳过处理
   - 使用 stencil 标记需要处理的区域
```

### 常见陷阱

```cpp
// 1. HDR 和 LDR 混淆
// 错误：在 LDR 缓冲上做 Bloom
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB8, ...);  // 错误
// 正确：使用 HDR 格式
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, ...);

// 2. Gamma 校正遗漏
// 错误：直接输出到屏幕
FragColor = vec4(color, 1.0);
// 正确：应用 Gamma 校正（如果不使用 sRGB 帧缓冲）
FragColor = vec4(pow(color, vec3(1.0/2.2)), 1.0);

// 3. 纹理过滤错误
// 错误：深度纹理使用线性过滤
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
// 正确：深度纹理使用最近邻过滤
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);

// 4. 边缘采样问题
// 错误：直接采样可能越界
vec3 color = texture(tex, uv + offset).rgb;
// 正确：使用 CLAMP_TO_EDGE 或手动裁剪
uv = clamp(uv + offset, 0.0, 1.0);
```

## 总结

后处理效果是游戏画面质量的重要组成部分。掌握后处理技术需要：

1. **理解原理**：
   - 每种效果的物理或感知基础
   - HDR 渲染和色调映射的必要性
   - 时间相关效果（TAA、运动模糊）的实现机制

2. **性能意识**：
   - 后处理是全屏效果，对带宽敏感
   - 合理使用降采样和效果合并
   - 根据目标平台调整质量级别

3. **实践经验**：
   - 理解不同效果的执行顺序
   - 处理好 HDR/LDR、Gamma 等颜色空间问题
   - 调参技巧：平衡视觉效果和性能开销

4. **保持学习**：
   - 关注新的抗锯齿技术（如 DLSS、FSR）
   - 了解实时渲染的最新进展
   - 参考商业引擎的实现方案

通过系统地学习和实践，你将能够为游戏创造出专业级的视觉效果。
