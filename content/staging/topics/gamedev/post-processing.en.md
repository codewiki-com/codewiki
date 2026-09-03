---
title: Game Post Processing Effects
description: "Implement common post-processing effects: Bloom, Depth of Field, Motion Blur, and Tone Mapping"
track: gamedev
section: graphics
difficulty: intermediate
tags:
  - post processing
  - bloom
  - DOF
  - tone mapping
status: imported
origin: old/src/content/docs/gamedev/post-processing.en.md
divergence: 0.153
issues: []
legacy:
  category: GameDev
  subcategory: Graphics
  order: 13
  lastUpdated: 2026-01-07
---

Post-processing effects are visual filters applied to the rendered image after the main 3D scene has been drawn. These effects transform the raw output of the rendering pipeline into a polished, cinematic final image. From the ethereal glow of bloom to the cinematic focus of depth of field, post-processing is what separates amateur visuals from professional-quality graphics.

## Understanding the Post-Processing Pipeline

Post-processing operates on 2D textures rather than 3D geometry. The fundamental workflow involves rendering the scene to an off-screen buffer (framebuffer), then applying a series of full-screen shader passes that read from one texture and write to another, progressively building up the final image.

### The Framebuffer Object (FBO) Foundation

Before implementing any post-processing effect, you need to understand framebuffer objects:

```cpp
// OpenGL Framebuffer Setup
class Framebuffer {
public:
    GLuint fbo;
    GLuint colorTexture;
    GLuint depthTexture;
    int width, height;

    void create(int w, int h, bool hdr = true) {
        width = w;
        height = h;

        // Create framebuffer object
        glGenFramebuffers(1, &fbo);
        glBindFramebuffer(GL_FRAMEBUFFER, fbo);

        // Create color attachment texture
        glGenTextures(1, &colorTexture);
        glBindTexture(GL_TEXTURE_2D, colorTexture);

        // Use HDR format for proper bloom and tone mapping
        GLenum internalFormat = hdr ? GL_RGBA16F : GL_RGBA8;
        glTexImage2D(GL_TEXTURE_2D, 0, internalFormat, width, height,
                     0, GL_RGBA, GL_FLOAT, nullptr);

        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

        glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0,
                               GL_TEXTURE_2D, colorTexture, 0);

        // Create depth attachment
        glGenTextures(1, &depthTexture);
        glBindTexture(GL_TEXTURE_2D, depthTexture);
        glTexImage2D(GL_TEXTURE_2D, 0, GL_DEPTH_COMPONENT24, width, height,
                     0, GL_DEPTH_COMPONENT, GL_FLOAT, nullptr);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);

        glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT,
                               GL_TEXTURE_2D, depthTexture, 0);

        // Check framebuffer completeness
        if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) {
            throw std::runtime_error("Framebuffer is not complete!");
        }

        glBindFramebuffer(GL_FRAMEBUFFER, 0);
    }

    void bind() {
        glBindFramebuffer(GL_FRAMEBUFFER, fbo);
        glViewport(0, 0, width, height);
    }

    void unbind() {
        glBindFramebuffer(GL_FRAMEBUFFER, 0);
    }

    void destroy() {
        glDeleteFramebuffers(1, &fbo);
        glDeleteTextures(1, &colorTexture);
        glDeleteTextures(1, &depthTexture);
    }
};
```

### Full-Screen Quad Rendering

Post-processing shaders operate on a full-screen quad that covers the entire viewport:

```cpp
// Vertex shader for full-screen quad
const char* quadVertexShader = R"(
#version 330 core
layout (location = 0) in vec2 aPos;
layout (location = 1) in vec2 aTexCoords;

out vec2 TexCoords;

void main() {
    TexCoords = aTexCoords;
    gl_Position = vec4(aPos, 0.0, 1.0);
}
)";

// Quad vertices: position (x, y) and texture coordinates (u, v)
float quadVertices[] = {
    // positions   // texCoords
    -1.0f,  1.0f,  0.0f, 1.0f,
    -1.0f, -1.0f,  0.0f, 0.0f,
     1.0f, -1.0f,  1.0f, 0.0f,

    -1.0f,  1.0f,  0.0f, 1.0f,
     1.0f, -1.0f,  1.0f, 0.0f,
     1.0f,  1.0f,  1.0f, 1.0f
};

class FullscreenQuad {
public:
    GLuint VAO, VBO;

    void create() {
        glGenVertexArrays(1, &VAO);
        glGenBuffers(1, &VBO);

        glBindVertexArray(VAO);
        glBindBuffer(GL_ARRAY_BUFFER, VBO);
        glBufferData(GL_ARRAY_BUFFER, sizeof(quadVertices),
                     quadVertices, GL_STATIC_DRAW);

        glEnableVertexAttribArray(0);
        glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE,
                              4 * sizeof(float), (void*)0);
        glEnableVertexAttribArray(1);
        glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE,
                              4 * sizeof(float), (void*)(2 * sizeof(float)));

        glBindVertexArray(0);
    }

    void render() {
        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES, 0, 6);
        glBindVertexArray(0);
    }
};
```

### Post-Processing Manager

A well-organized post-processing system chains effects together:

```cpp
class PostProcessingPipeline {
private:
    std::vector<std::unique_ptr<PostProcessEffect>> effects;
    Framebuffer pingPongBuffers[2];
    FullscreenQuad quad;
    int currentBuffer = 0;

public:
    void initialize(int width, int height) {
        pingPongBuffers[0].create(width, height, true);
        pingPongBuffers[1].create(width, height, true);
        quad.create();
    }

    void addEffect(std::unique_ptr<PostProcessEffect> effect) {
        effects.push_back(std::move(effect));
    }

    void process(GLuint inputTexture, GLuint outputFramebuffer) {
        GLuint currentInput = inputTexture;

        for (size_t i = 0; i < effects.size(); ++i) {
            bool isLastEffect = (i == effects.size() - 1);

            if (isLastEffect) {
                // Render to final output
                glBindFramebuffer(GL_FRAMEBUFFER, outputFramebuffer);
            } else {
                // Render to ping-pong buffer
                pingPongBuffers[currentBuffer].bind();
            }

            effects[i]->apply(currentInput, quad);

            if (!isLastEffect) {
                currentInput = pingPongBuffers[currentBuffer].colorTexture;
                currentBuffer = 1 - currentBuffer;
            }
        }
    }

    void resize(int width, int height) {
        pingPongBuffers[0].destroy();
        pingPongBuffers[1].destroy();
        pingPongBuffers[0].create(width, height, true);
        pingPongBuffers[1].create(width, height, true);
    }
};
```

## Bloom Effect

Bloom simulates the way bright light bleeds into surrounding areas, creating a soft glow around luminous objects. This effect is essential for HDR rendering and adds visual richness to scenes with bright light sources.

### How Bloom Works

The bloom algorithm consists of several stages:

1. **Brightness Extraction**: Identify pixels that exceed a luminance threshold
2. **Downsampling**: Create progressively smaller versions of the bright areas
3. **Gaussian Blur**: Apply blur at each mip level
4. **Upsampling**: Combine the blurred mip levels back together
5. **Compositing**: Add the bloom result to the original image

### Brightness Extraction Shader

```glsl
// brightness_extract.frag
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D sceneTexture;
uniform float threshold;
uniform float softThreshold;

void main() {
    vec3 color = texture(sceneTexture, TexCoords).rgb;

    // Calculate luminance using perceptual weights
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));

    // Soft threshold for smoother transition
    float soft = luminance - threshold + softThreshold;
    soft = clamp(soft, 0.0, 2.0 * softThreshold);
    soft = soft * soft / (4.0 * softThreshold + 0.00001);

    float contribution = max(soft, luminance - threshold);
    contribution /= max(luminance, 0.00001);

    FragColor = vec4(color * contribution, 1.0);
}
```

### Gaussian Blur Shader

The blur is typically implemented as a separable filter for efficiency:

```glsl
// gaussian_blur.frag
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D inputTexture;
uniform vec2 texelSize;
uniform bool horizontal;

// 9-tap Gaussian weights (sigma ~= 2)
const float weights[5] = float[](
    0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216
);

void main() {
    vec2 offset = horizontal ? vec2(texelSize.x, 0.0) : vec2(0.0, texelSize.y);

    vec3 result = texture(inputTexture, TexCoords).rgb * weights[0];

    for (int i = 1; i < 5; ++i) {
        result += texture(inputTexture, TexCoords + offset * float(i)).rgb * weights[i];
        result += texture(inputTexture, TexCoords - offset * float(i)).rgb * weights[i];
    }

    FragColor = vec4(result, 1.0);
}
```

### Kawase Blur Alternative

For better performance, especially on mobile, consider the Kawase blur:

```glsl
// kawase_blur.frag
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D inputTexture;
uniform vec2 texelSize;
uniform float offset;

void main() {
    vec2 uv = TexCoords;

    vec3 color = vec3(0.0);
    color += texture(inputTexture, uv + vec2(-offset - 0.5, -offset - 0.5) * texelSize).rgb;
    color += texture(inputTexture, uv + vec2(-offset - 0.5,  offset + 0.5) * texelSize).rgb;
    color += texture(inputTexture, uv + vec2( offset + 0.5, -offset - 0.5) * texelSize).rgb;
    color += texture(inputTexture, uv + vec2( offset + 0.5,  offset + 0.5) * texelSize).rgb;
    color *= 0.25;

    FragColor = vec4(color, 1.0);
}
```

### Complete Bloom Implementation

```cpp
class BloomEffect : public PostProcessEffect {
private:
    Shader brightnessShader;
    Shader blurShader;
    Shader compositeShader;
    std::vector<Framebuffer> mipChain;
    int mipLevels;

    float threshold = 1.0f;
    float softThreshold = 0.5f;
    float intensity = 1.0f;

public:
    void initialize(int width, int height, int levels = 5) {
        mipLevels = levels;
        mipChain.resize(mipLevels * 2); // Each level needs two buffers for ping-pong blur

        int mipWidth = width / 2;
        int mipHeight = height / 2;

        for (int i = 0; i < mipLevels; ++i) {
            mipChain[i * 2].create(mipWidth, mipHeight, true);
            mipChain[i * 2 + 1].create(mipWidth, mipHeight, true);
            mipWidth /= 2;
            mipHeight /= 2;
        }

        brightnessShader.load("fullscreen.vert", "brightness_extract.frag");
        blurShader.load("fullscreen.vert", "gaussian_blur.frag");
        compositeShader.load("fullscreen.vert", "bloom_composite.frag");
    }

    void apply(GLuint inputTexture, FullscreenQuad& quad) override {
        // Step 1: Extract bright pixels and downsample
        brightnessShader.use();
        brightnessShader.setFloat("threshold", threshold);
        brightnessShader.setFloat("softThreshold", softThreshold);

        GLuint currentInput = inputTexture;
        for (int i = 0; i < mipLevels; ++i) {
            mipChain[i * 2].bind();
            glActiveTexture(GL_TEXTURE0);
            glBindTexture(GL_TEXTURE_2D, currentInput);

            if (i == 0) {
                brightnessShader.use();
                brightnessShader.setInt("sceneTexture", 0);
            } else {
                // Simple downsample for subsequent levels
                // Could use a dedicated downsample shader
            }

            quad.render();
            currentInput = mipChain[i * 2].colorTexture;
        }

        // Step 2: Blur each mip level
        blurShader.use();
        for (int i = mipLevels - 1; i >= 0; --i) {
            int width = mipChain[i * 2].width;
            int height = mipChain[i * 2].height;

            // Horizontal blur
            mipChain[i * 2 + 1].bind();
            blurShader.setVec2("texelSize", 1.0f / width, 1.0f / height);
            blurShader.setBool("horizontal", true);
            glBindTexture(GL_TEXTURE_2D, mipChain[i * 2].colorTexture);
            quad.render();

            // Vertical blur
            mipChain[i * 2].bind();
            blurShader.setBool("horizontal", false);
            glBindTexture(GL_TEXTURE_2D, mipChain[i * 2 + 1].colorTexture);
            quad.render();
        }

        // Step 3: Composite bloom with original
        compositeShader.use();
        compositeShader.setFloat("intensity", intensity);
        compositeShader.setInt("sceneTexture", 0);
        compositeShader.setInt("bloomTexture", 1);

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, inputTexture);
        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, mipChain[0].colorTexture);

        quad.render();
    }
};
```

### Bloom Composite Shader

```glsl
// bloom_composite.frag
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D sceneTexture;
uniform sampler2D bloomTexture;
uniform float intensity;

void main() {
    vec3 sceneColor = texture(sceneTexture, TexCoords).rgb;
    vec3 bloomColor = texture(bloomTexture, TexCoords).rgb;

    // Additive blending
    vec3 result = sceneColor + bloomColor * intensity;

    FragColor = vec4(result, 1.0);
}
```

## Depth of Field

Depth of Field (DoF) simulates the focusing characteristics of real camera lenses, blurring objects that are too close or too far from the focal plane. This effect adds cinematic quality and can guide player attention.

### Circle of Confusion

The foundation of DoF is the Circle of Confusion (CoC), which determines how blurry each pixel should be based on its depth:

```glsl
// coc_calculation.frag
#version 330 core
out float FragColor;
in vec2 TexCoords;

uniform sampler2D depthTexture;
uniform float focusDistance;
uniform float focusRange;
uniform float maxBlur;
uniform float nearPlane;
uniform float farPlane;

float linearizeDepth(float depth) {
    float z = depth * 2.0 - 1.0;
    return (2.0 * nearPlane * farPlane) / (farPlane + nearPlane - z * (farPlane - nearPlane));
}

void main() {
    float depth = texture(depthTexture, TexCoords).r;
    float linearDepth = linearizeDepth(depth);

    // Calculate signed CoC
    float coc = (linearDepth - focusDistance) / focusRange;
    coc = clamp(coc, -1.0, 1.0) * maxBlur;

    FragColor = coc;
}
```

### Bokeh Depth of Field

For high-quality bokeh effects, a gather-based approach produces circular blur shapes:

```glsl
// bokeh_dof.frag
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D sceneTexture;
uniform sampler2D cocTexture;
uniform vec2 texelSize;
uniform float maxBlur;

// Bokeh kernel - circular sampling pattern
const int SAMPLE_COUNT = 22;
const vec2 kernel[SAMPLE_COUNT] = vec2[](
    vec2(0.0, 0.0),
    vec2(0.53333336, 0.0),
    vec2(0.3325279, 0.4169768),
    vec2(-0.11867785, 0.5199616),
    vec2(-0.48051673, 0.2314047),
    vec2(-0.48051673, -0.23140468),
    vec2(-0.11867787, -0.51996166),
    vec2(0.33252785, -0.4169769),
    vec2(1.0666667, 0.0),
    vec2(0.83651554, 0.6614378),
    vec2(0.26666668, 1.0376381),
    vec2(-0.43680444, 0.9728201),
    vec2(-0.9438934, 0.4625709),
    vec2(-0.9438934, -0.46257092),
    vec2(-0.43680447, -0.9728201),
    vec2(0.26666665, -1.0376382),
    vec2(0.8365155, -0.6614378),
    vec2(1.3333334, 0.82376385),
    vec2(0.13333333, 1.5591125),
    vec2(-1.1220504, 1.0872898),
    vec2(-1.1220504, -1.0872898),
    vec2(0.13333333, -1.5591125)
);

void main() {
    float centerCoC = texture(cocTexture, TexCoords).r;
    vec3 color = vec3(0.0);
    float totalWeight = 0.0;

    for (int i = 0; i < SAMPLE_COUNT; ++i) {
        vec2 offset = kernel[i] * texelSize * maxBlur;
        vec2 sampleUV = TexCoords + offset * abs(centerCoC);

        float sampleCoC = texture(cocTexture, sampleUV).r;
        vec3 sampleColor = texture(sceneTexture, sampleUV).rgb;

        // Weight based on CoC to prevent bleeding
        float weight = smoothstep(0.0, abs(centerCoC) * 2.0, abs(sampleCoC));

        color += sampleColor * weight;
        totalWeight += weight;
    }

    color /= totalWeight;
    FragColor = vec4(color, 1.0);
}
```

### Separable DoF for Performance

A more performant approach uses separable blur with CoC weighting:

```glsl
// separable_dof.frag
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D sceneTexture;
uniform sampler2D cocTexture;
uniform vec2 direction; // (1, 0) for horizontal, (0, 1) for vertical
uniform vec2 texelSize;

const int KERNEL_SIZE = 9;
const float weights[KERNEL_SIZE] = float[](
    0.0093, 0.028002, 0.065984, 0.121703, 0.175713,
    0.121703, 0.065984, 0.028002, 0.0093, 0.0
);

void main() {
    float centerCoC = abs(texture(cocTexture, TexCoords).r);
    vec3 color = vec3(0.0);
    float totalWeight = 0.0;

    for (int i = -KERNEL_SIZE / 2; i <= KERNEL_SIZE / 2; ++i) {
        vec2 offset = direction * texelSize * float(i) * centerCoC * 10.0;
        vec2 sampleUV = TexCoords + offset;

        float sampleCoC = abs(texture(cocTexture, sampleUV).r);
        vec3 sampleColor = texture(sceneTexture, sampleUV).rgb;

        float weight = weights[i + KERNEL_SIZE / 2];

        // CoC comparison to reduce artifacts
        weight *= smoothstep(0.0, centerCoC, sampleCoC);

        color += sampleColor * weight;
        totalWeight += weight;
    }

    FragColor = vec4(color / totalWeight, 1.0);
}
```

### Combining Near and Far Field

High-quality DoF separates near and far blur for proper handling:

```cpp
class DepthOfFieldEffect : public PostProcessEffect {
private:
    Shader cocShader;
    Shader nearFieldShader;
    Shader farFieldShader;
    Shader compositeShader;
    Framebuffer cocBuffer;
    Framebuffer nearBuffer;
    Framebuffer farBuffer;

    float focusDistance = 10.0f;
    float focusRange = 5.0f;
    float maxBlur = 8.0f;
    float nearPlane = 0.1f;
    float farPlane = 100.0f;

public:
    void apply(GLuint colorTexture, GLuint depthTexture, FullscreenQuad& quad) {
        // Calculate CoC
        cocBuffer.bind();
        cocShader.use();
        cocShader.setFloat("focusDistance", focusDistance);
        cocShader.setFloat("focusRange", focusRange);
        cocShader.setFloat("maxBlur", maxBlur);
        cocShader.setFloat("nearPlane", nearPlane);
        cocShader.setFloat("farPlane", farPlane);
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, depthTexture);
        quad.render();

        // Process near field (positive CoC)
        nearBuffer.bind();
        nearFieldShader.use();
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, colorTexture);
        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, cocBuffer.colorTexture);
        quad.render();

        // Process far field (negative CoC)
        farBuffer.bind();
        farFieldShader.use();
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, colorTexture);
        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, cocBuffer.colorTexture);
        quad.render();

        // Composite
        compositeShader.use();
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, colorTexture);
        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, nearBuffer.colorTexture);
        glActiveTexture(GL_TEXTURE2);
        glBindTexture(GL_TEXTURE_2D, farBuffer.colorTexture);
        glActiveTexture(GL_TEXTURE3);
        glBindTexture(GL_TEXTURE_2D, cocBuffer.colorTexture);
        quad.render();
    }
};
```

## Motion Blur

Motion blur creates the illusion of speed and smooth movement by blending the current frame with information about object or camera motion. There are two main types: camera motion blur and per-object motion blur.

### Camera Motion Blur with Velocity Buffer

```glsl
// velocity_buffer.vert
#version 330 core
layout (location = 0) in vec3 aPos;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform mat4 prevMVP;

out vec4 currentPos;
out vec4 previousPos;

void main() {
    mat4 mvp = projection * view * model;
    currentPos = mvp * vec4(aPos, 1.0);
    previousPos = prevMVP * vec4(aPos, 1.0);
    gl_Position = currentPos;
}

// velocity_buffer.frag
#version 330 core
out vec2 FragColor;

in vec4 currentPos;
in vec4 previousPos;

void main() {
    // Calculate screen-space velocity
    vec2 current = (currentPos.xy / currentPos.w) * 0.5 + 0.5;
    vec2 previous = (previousPos.xy / previousPos.w) * 0.5 + 0.5;

    vec2 velocity = current - previous;
    FragColor = velocity;
}
```

### Motion Blur Application

```glsl
// motion_blur.frag
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D sceneTexture;
uniform sampler2D velocityTexture;
uniform sampler2D depthTexture;
uniform float intensity;
uniform int samples;

void main() {
    vec2 velocity = texture(velocityTexture, TexCoords).rg * intensity;

    // Limit maximum blur length
    float speed = length(velocity);
    const float maxSpeed = 0.1;
    if (speed > maxSpeed) {
        velocity = velocity / speed * maxSpeed;
    }

    vec3 color = texture(sceneTexture, TexCoords).rgb;
    float totalWeight = 1.0;

    // Sample along the velocity vector
    for (int i = 1; i < samples; ++i) {
        float t = float(i) / float(samples - 1) - 0.5;
        vec2 offset = velocity * t;

        vec3 sampleColor = texture(sceneTexture, TexCoords + offset).rgb;

        // Depth-aware weighting to prevent background bleeding
        float sampleDepth = texture(depthTexture, TexCoords + offset).r;
        float centerDepth = texture(depthTexture, TexCoords).r;
        float weight = 1.0 - smoothstep(0.0, 0.01, abs(sampleDepth - centerDepth));

        color += sampleColor * weight;
        totalWeight += weight;
    }

    FragColor = vec4(color / totalWeight, 1.0);
}
```

### Per-Object Motion Blur

For accurate per-object motion blur, store previous transform matrices:

```cpp
class MotionBlurSystem {
private:
    std::unordered_map<Entity*, glm::mat4> previousTransforms;
    Framebuffer velocityBuffer;
    Shader velocityShader;
    Shader motionBlurShader;

public:
    void beginFrame() {
        // Render velocity buffer
        velocityBuffer.bind();
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        velocityShader.use();

        for (auto& [entity, prevMVP] : previousTransforms) {
            glm::mat4 currentMVP = projection * view * entity->getTransform();

            velocityShader.setMat4("prevMVP", prevMVP);
            velocityShader.setMat4("model", entity->getTransform());
            velocityShader.setMat4("view", view);
            velocityShader.setMat4("projection", projection);

            entity->render();

            // Update previous transform
            prevMVP = currentMVP;
        }
    }

    void apply(GLuint sceneTexture, GLuint depthTexture, FullscreenQuad& quad) {
        motionBlurShader.use();
        motionBlurShader.setFloat("intensity", blurIntensity);
        motionBlurShader.setInt("samples", sampleCount);

        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, sceneTexture);
        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, velocityBuffer.colorTexture);
        glActiveTexture(GL_TEXTURE2);
        glBindTexture(GL_TEXTURE_2D, depthTexture);

        quad.render();
    }
};
```

### Tile-Based Motion Blur

For better performance, use a tile-based approach that shares work across pixels:

```glsl
// tile_max_velocity.frag
#version 330 core
out vec2 FragColor;
in vec2 TexCoords;

uniform sampler2D velocityTexture;
uniform vec2 texelSize;
uniform int tileSize;

void main() {
    vec2 maxVelocity = vec2(0.0);
    float maxLength = 0.0;

    ivec2 tileCoord = ivec2(gl_FragCoord.xy);

    for (int y = 0; y < tileSize; ++y) {
        for (int x = 0; x < tileSize; ++x) {
            vec2 uv = (vec2(tileCoord * tileSize + ivec2(x, y)) + 0.5) * texelSize;
            vec2 velocity = texture(velocityTexture, uv).rg;
            float len = length(velocity);

            if (len > maxLength) {
                maxLength = len;
                maxVelocity = velocity;
            }
        }
    }

    FragColor = maxVelocity;
}
```

## Tone Mapping

Tone mapping converts High Dynamic Range (HDR) values to the Low Dynamic Range (LDR) displayable on standard monitors. This process is crucial for maintaining visual quality when rendering scenes with extreme brightness differences.

### Simple Tone Mapping Operators

```glsl
// tonemapping.frag
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D hdrTexture;
uniform float exposure;
uniform int tonemapOperator;

// Reinhard tone mapping
vec3 reinhardTonemap(vec3 hdr) {
    return hdr / (hdr + vec3(1.0));
}

// Extended Reinhard with white point
vec3 reinhardExtended(vec3 hdr, float whitePoint) {
    vec3 numerator = hdr * (1.0 + hdr / (whitePoint * whitePoint));
    return numerator / (1.0 + hdr);
}

// Filmic (Uncharted 2) tone mapping
vec3 uncharted2Tonemap(vec3 x) {
    const float A = 0.15;  // Shoulder strength
    const float B = 0.50;  // Linear strength
    const float C = 0.10;  // Linear angle
    const float D = 0.20;  // Toe strength
    const float E = 0.02;  // Toe numerator
    const float F = 0.30;  // Toe denominator

    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

vec3 filmicTonemap(vec3 hdr) {
    const float exposureBias = 2.0;
    const float W = 11.2; // Linear white point

    vec3 curr = uncharted2Tonemap(hdr * exposureBias);
    vec3 whiteScale = vec3(1.0) / uncharted2Tonemap(vec3(W));

    return curr * whiteScale;
}

// ACES (Academy Color Encoding System) approximation
vec3 acesTonemap(vec3 hdr) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;

    return clamp((hdr * (a * hdr + b)) / (hdr * (c * hdr + d) + e), 0.0, 1.0);
}

// AgX tone mapping (used in Blender 4.0+)
vec3 agxDefaultContrastApprox(vec3 x) {
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

vec3 agxTonemap(vec3 hdr) {
    const mat3 agxTransform = mat3(
        0.842479062253094, 0.0423282422610123, 0.0423756549057051,
        0.0784335999999992, 0.878468636469772, 0.0784336,
        0.0792237451477643, 0.0791661274605434, 0.879142973793104
    );

    const mat3 agxTransformInv = mat3(
        1.19687900512017, -0.0528968517574562, -0.0529716355144438,
        -0.0980208811401368, 1.15190312990417, -0.0980434501171241,
        -0.0990297440797205, -0.0989611768448433, 1.15107367264116
    );

    const float minEv = -12.47393;
    const float maxEv = 4.026069;

    vec3 val = agxTransform * hdr;
    val = clamp(log2(val), minEv, maxEv);
    val = (val - minEv) / (maxEv - minEv);
    val = agxDefaultContrastApprox(val);

    return agxTransformInv * val;
}

void main() {
    vec3 hdr = texture(hdrTexture, TexCoords).rgb;

    // Apply exposure
    hdr *= exposure;

    vec3 ldr;

    switch (tonemapOperator) {
        case 0: ldr = reinhardTonemap(hdr); break;
        case 1: ldr = reinhardExtended(hdr, 4.0); break;
        case 2: ldr = filmicTonemap(hdr); break;
        case 3: ldr = acesTonemap(hdr); break;
        case 4: ldr = agxTonemap(hdr); break;
        default: ldr = hdr;
    }

    FragColor = vec4(ldr, 1.0);
}
```

### Automatic Exposure (Eye Adaptation)

```glsl
// luminance_histogram.comp
#version 430 core
layout (local_size_x = 16, local_size_y = 16) in;

layout (binding = 0) uniform sampler2D hdrTexture;
layout (std430, binding = 1) buffer HistogramBuffer {
    uint histogram[256];
};

uniform vec2 texelSize;
uniform float minLogLum;
uniform float logLumRange;

void main() {
    vec2 uv = (vec2(gl_GlobalInvocationID.xy) + 0.5) * texelSize;
    vec3 color = texture(hdrTexture, uv).rgb;

    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));

    if (luminance < 0.005) return;

    float logLum = clamp((log2(luminance) - minLogLum) / logLumRange, 0.0, 1.0);
    uint binIndex = uint(logLum * 255.0);

    atomicAdd(histogram[binIndex], 1);
}

// exposure_adaptation.comp
#version 430 core
layout (local_size_x = 256) in;

layout (std430, binding = 0) buffer HistogramBuffer {
    uint histogram[256];
};

layout (std430, binding = 1) buffer ExposureBuffer {
    float currentExposure;
    float targetExposure;
};

uniform float minLogLum;
uniform float logLumRange;
uniform float lowPercent;
uniform float highPercent;
uniform float adaptationSpeed;
uniform float deltaTime;

shared uint histogramShared[256];

void main() {
    uint localIndex = gl_LocalInvocationIndex;
    histogramShared[localIndex] = histogram[localIndex];

    barrier();

    // Parallel reduction to find total pixels
    if (localIndex == 0) {
        uint totalPixels = 0;
        for (int i = 0; i < 256; ++i) {
            totalPixels += histogramShared[i];
        }

        // Find the luminance at lowPercent and highPercent
        uint lowCount = uint(float(totalPixels) * lowPercent);
        uint highCount = uint(float(totalPixels) * highPercent);

        uint sum = 0;
        float avgLum = 0.0;
        uint validPixels = 0;

        for (int i = 0; i < 256; ++i) {
            uint prevSum = sum;
            sum += histogramShared[i];

            if (sum > lowCount && prevSum < highCount) {
                float binLum = (float(i) / 255.0) * logLumRange + minLogLum;
                avgLum += binLum * float(histogramShared[i]);
                validPixels += histogramShared[i];
            }
        }

        avgLum = exp2(avgLum / float(max(validPixels, 1u)));

        // Calculate target exposure
        float targetExp = 0.5 / avgLum;

        // Smooth adaptation
        float adaptedExposure = currentExposure + (targetExp - currentExposure) *
                                (1.0 - exp(-deltaTime * adaptationSpeed));

        currentExposure = adaptedExposure;
        targetExposure = targetExp;

        // Clear histogram for next frame
        for (int i = 0; i < 256; ++i) {
            histogram[i] = 0;
        }
    }
}
```

## Color Grading

Color grading adjusts the overall color characteristics of the image for artistic effect or visual consistency.

### 3D LUT Color Grading

```glsl
// color_grading_lut.frag
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D sceneTexture;
uniform sampler3D lutTexture;
uniform float lutSize;
uniform float intensity;

vec3 applyLUT(vec3 color, sampler3D lut, float size) {
    // Scale and offset to sample from center of texels
    float scale = (size - 1.0) / size;
    float offset = 1.0 / (2.0 * size);

    return texture(lut, color * scale + offset).rgb;
}

void main() {
    vec3 color = texture(sceneTexture, TexCoords).rgb;

    // Ensure color is in [0, 1] range for LUT sampling
    color = clamp(color, 0.0, 1.0);

    vec3 graded = applyLUT(color, lutTexture, lutSize);

    // Blend between original and graded
    FragColor = vec4(mix(color, graded, intensity), 1.0);
}
```

### Split Toning

```glsl
// split_toning.frag
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D sceneTexture;
uniform vec3 shadowTint;
uniform vec3 highlightTint;
uniform float balance;

void main() {
    vec3 color = texture(sceneTexture, TexCoords).rgb;

    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));

    // Calculate shadow and highlight masks
    float shadowMask = 1.0 - smoothstep(0.0, 0.5 + balance * 0.5, luminance);
    float highlightMask = smoothstep(0.5 - balance * 0.5, 1.0, luminance);

    // Apply tints
    vec3 shadowColor = mix(color, color * shadowTint, shadowMask);
    vec3 highlightColor = mix(shadowColor, shadowColor * highlightTint, highlightMask);

    FragColor = vec4(highlightColor, 1.0);
}
```

### Color Correction Controls

```glsl
// color_correction.frag
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D sceneTexture;

// Color adjustments
uniform float brightness;    // -1 to 1
uniform float contrast;      // 0 to 2
uniform float saturation;    // 0 to 2
uniform float temperature;   // -1 to 1 (blue to orange)
uniform float tint;          // -1 to 1 (green to magenta)

// Lift, Gamma, Gain
uniform vec3 lift;           // Shadow adjustment
uniform vec3 gamma;          // Midtone adjustment
uniform vec3 gain;           // Highlight adjustment

vec3 adjustTemperature(vec3 color, float temp) {
    // Simple temperature adjustment
    color.r += temp * 0.1;
    color.b -= temp * 0.1;
    return color;
}

vec3 adjustTint(vec3 color, float t) {
    color.g += t * 0.1;
    return color;
}

vec3 applyLiftGammaGain(vec3 color, vec3 l, vec3 g, vec3 gn) {
    // Lift (adds to shadows)
    color = color + l * (1.0 - color);

    // Gamma (midtone adjustment)
    color = pow(color, 1.0 / g);

    // Gain (multiplies highlights)
    color = color * gn;

    return color;
}

void main() {
    vec3 color = texture(sceneTexture, TexCoords).rgb;

    // Apply brightness
    color += brightness;

    // Apply contrast
    color = (color - 0.5) * contrast + 0.5;

    // Apply saturation
    float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(lum), color, saturation);

    // Apply temperature and tint
    color = adjustTemperature(color, temperature);
    color = adjustTint(color, tint);

    // Apply lift/gamma/gain
    color = applyLiftGammaGain(color, lift, gamma, gain);

    FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
```

## Anti-Aliasing

Anti-aliasing smooths jagged edges (aliasing artifacts) that occur when rendering diagonal lines and curves.

### FXAA (Fast Approximate Anti-Aliasing)

FXAA is a post-process technique that detects edges and smooths them:

```glsl
// fxaa.frag
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D sceneTexture;
uniform vec2 texelSize;

// FXAA quality settings
#define FXAA_EDGE_THRESHOLD_MIN 0.0312
#define FXAA_EDGE_THRESHOLD 0.125
#define FXAA_SUBPIX_QUALITY 0.75
#define FXAA_ITERATIONS 12
#define FXAA_SEARCH_ACCELERATION 1

float luminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
    vec2 uv = TexCoords;

    // Sample the neighborhood
    vec3 rgbNW = texture(sceneTexture, uv + vec2(-1.0, -1.0) * texelSize).rgb;
    vec3 rgbNE = texture(sceneTexture, uv + vec2(1.0, -1.0) * texelSize).rgb;
    vec3 rgbSW = texture(sceneTexture, uv + vec2(-1.0, 1.0) * texelSize).rgb;
    vec3 rgbSE = texture(sceneTexture, uv + vec2(1.0, 1.0) * texelSize).rgb;
    vec3 rgbM = texture(sceneTexture, uv).rgb;

    // Calculate luminances
    float lumNW = luminance(rgbNW);
    float lumNE = luminance(rgbNE);
    float lumSW = luminance(rgbSW);
    float lumSE = luminance(rgbSE);
    float lumM = luminance(rgbM);

    // Find luminance range
    float lumMin = min(lumM, min(min(lumNW, lumNE), min(lumSW, lumSE)));
    float lumMax = max(lumM, max(max(lumNW, lumNE), max(lumSW, lumSE)));
    float lumRange = lumMax - lumMin;

    // Skip if contrast is too low
    if (lumRange < max(FXAA_EDGE_THRESHOLD_MIN, lumMax * FXAA_EDGE_THRESHOLD)) {
        FragColor = vec4(rgbM, 1.0);
        return;
    }

    // Calculate edge direction
    vec2 dir;
    dir.x = -((lumNW + lumNE) - (lumSW + lumSE));
    dir.y = ((lumNW + lumSW) - (lumNE + lumSE));

    float dirReduce = max((lumNW + lumNE + lumSW + lumSE) * 0.25 * 0.25, 1.0 / 128.0);
    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = clamp(dir * rcpDirMin, vec2(-8.0), vec2(8.0)) * texelSize;

    // Sample along the edge
    vec3 rgbA = 0.5 * (
        texture(sceneTexture, uv + dir * (1.0 / 3.0 - 0.5)).rgb +
        texture(sceneTexture, uv + dir * (2.0 / 3.0 - 0.5)).rgb
    );

    vec3 rgbB = rgbA * 0.5 + 0.25 * (
        texture(sceneTexture, uv + dir * -0.5).rgb +
        texture(sceneTexture, uv + dir * 0.5).rgb
    );

    float lumB = luminance(rgbB);

    // Final output
    if (lumB < lumMin || lumB > lumMax) {
        FragColor = vec4(rgbA, 1.0);
    } else {
        FragColor = vec4(rgbB, 1.0);
    }
}
```

### TAA (Temporal Anti-Aliasing)

TAA uses temporal information from previous frames for superior quality:

```glsl
// taa.frag
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D currentFrame;
uniform sampler2D historyFrame;
uniform sampler2D velocityTexture;
uniform sampler2D depthTexture;
uniform vec2 texelSize;
uniform vec2 jitterOffset;

// Neighborhood clamping to reduce ghosting
vec3 clipAABB(vec3 aabbMin, vec3 aabbMax, vec3 prevSample) {
    vec3 center = 0.5 * (aabbMax + aabbMin);
    vec3 extents = 0.5 * (aabbMax - aabbMin);

    vec3 offset = prevSample - center;
    vec3 ts = abs(extents / (offset + 0.0001));
    float t = min(min(ts.x, ts.y), ts.z);
    t = clamp(t, 0.0, 1.0);

    return center + offset * t;
}

void main() {
    vec2 uv = TexCoords;

    // Get velocity for reprojection
    vec2 velocity = texture(velocityTexture, uv).rg;
    vec2 historyUV = uv - velocity;

    // Sample current frame
    vec3 current = texture(currentFrame, uv).rgb;

    // Sample history with reprojection
    vec3 history = texture(historyFrame, historyUV).rgb;

    // Sample neighborhood for AABB clamping
    vec3 nearColor[9];
    int index = 0;
    for (int y = -1; y <= 1; ++y) {
        for (int x = -1; x <= 1; ++x) {
            nearColor[index++] = texture(currentFrame, uv + vec2(x, y) * texelSize).rgb;
        }
    }

    // Calculate neighborhood AABB
    vec3 aabbMin = nearColor[0];
    vec3 aabbMax = nearColor[0];
    for (int i = 1; i < 9; ++i) {
        aabbMin = min(aabbMin, nearColor[i]);
        aabbMax = max(aabbMax, nearColor[i]);
    }

    // Clip history to neighborhood bounds
    history = clipAABB(aabbMin, aabbMax, history);

    // Blend factor based on history validity
    float blendFactor = 0.9; // Higher = more temporal stability

    // Reduce blend factor at screen edges (history less reliable)
    vec2 historyCoord = historyUV * 2.0 - 1.0;
    float edgeFactor = max(abs(historyCoord.x), abs(historyCoord.y));
    blendFactor *= 1.0 - smoothstep(0.8, 1.0, edgeFactor);

    // Final blend
    vec3 result = mix(current, history, blendFactor);

    FragColor = vec4(result, 1.0);
}
```

### TAA Jitter Pattern

```cpp
// Halton sequence for sub-pixel jittering
float halton(int index, int base) {
    float result = 0.0f;
    float f = 1.0f / base;
    int i = index;

    while (i > 0) {
        result += f * (i % base);
        i = i / base;
        f = f / base;
    }

    return result;
}

glm::vec2 getJitterOffset(int frameIndex, int width, int height) {
    // Use Halton(2,3) sequence for well-distributed samples
    float jitterX = halton(frameIndex % 16 + 1, 2) - 0.5f;
    float jitterY = halton(frameIndex % 16 + 1, 3) - 0.5f;

    // Scale to pixel size
    return glm::vec2(jitterX / width, jitterY / height);
}

// Apply jitter to projection matrix
glm::mat4 jitteredProjection = projection;
jitteredProjection[2][0] += jitter.x * 2.0f;
jitteredProjection[2][1] += jitter.y * 2.0f;
```

## Volumetric Lighting

Volumetric lighting simulates light scattering through a medium, creating visible light rays (god rays) and atmospheric fog.

### Ray Marching Approach

```glsl
// volumetric_light.frag
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D sceneTexture;
uniform sampler2D depthTexture;
uniform sampler2DShadow shadowMap;

uniform mat4 invViewProj;
uniform mat4 lightViewProj;
uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform vec3 cameraPosition;

uniform float scattering;
uniform float fogDensity;
uniform int samples;
uniform float maxDistance;

// Henyey-Greenstein phase function
float phaseFunction(float cosTheta, float g) {
    float g2 = g * g;
    return (1.0 - g2) / (4.0 * 3.14159 * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
}

vec3 worldPosFromDepth(vec2 uv, float depth) {
    vec4 clipPos = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
    vec4 worldPos = invViewProj * clipPos;
    return worldPos.xyz / worldPos.w;
}

float getShadow(vec3 worldPos) {
    vec4 lightClipPos = lightViewProj * vec4(worldPos, 1.0);
    vec3 projCoords = lightClipPos.xyz / lightClipPos.w;
    projCoords = projCoords * 0.5 + 0.5;

    if (projCoords.z > 1.0) return 1.0;

    return texture(shadowMap, projCoords);
}

void main() {
    vec3 sceneColor = texture(sceneTexture, TexCoords).rgb;
    float depth = texture(depthTexture, TexCoords).r;

    vec3 worldPos = worldPosFromDepth(TexCoords, depth);
    vec3 rayStart = cameraPosition;
    vec3 rayDir = normalize(worldPos - cameraPosition);
    float rayLength = min(length(worldPos - cameraPosition), maxDistance);

    // Direction to light for phase function
    vec3 lightDir = normalize(lightPosition - cameraPosition);
    float cosTheta = dot(rayDir, lightDir);
    float phase = phaseFunction(cosTheta, scattering);

    vec3 volumetricLight = vec3(0.0);
    float stepSize = rayLength / float(samples);

    // Dithered starting offset to reduce banding
    float dither = fract(sin(dot(TexCoords, vec2(12.9898, 78.233))) * 43758.5453);
    vec3 currentPos = rayStart + rayDir * stepSize * dither;

    for (int i = 0; i < samples; ++i) {
        // Check if point is in shadow
        float shadow = getShadow(currentPos);

        // Accumulate light
        float fogAmount = exp(-fogDensity * length(currentPos - cameraPosition));
        volumetricLight += lightColor * shadow * phase * fogAmount * stepSize;

        currentPos += rayDir * stepSize;
    }

    // Combine with scene
    vec3 result = sceneColor + volumetricLight;

    FragColor = vec4(result, 1.0);
}
```

### Optimized Volumetric with Froxels

For better performance, use a 3D froxel (frustum voxel) grid:

```cpp
class FroxelVolumetricLighting {
private:
    GLuint froxelTexture;      // 3D texture for light accumulation
    GLuint scatteringLUT;      // Precomputed scattering lookup
    Shader injectShader;        // Inject light into froxels
    Shader accumulateShader;    // Temporal accumulation
    Shader applyShader;         // Apply to scene

    int froxelWidth = 160;
    int froxelHeight = 90;
    int froxelDepth = 128;

public:
    void initialize() {
        // Create 3D froxel texture
        glGenTextures(1, &froxelTexture);
        glBindTexture(GL_TEXTURE_3D, froxelTexture);
        glTexImage3D(GL_TEXTURE_3D, 0, GL_RGBA16F,
                     froxelWidth, froxelHeight, froxelDepth,
                     0, GL_RGBA, GL_FLOAT, nullptr);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_3D, GL_TEXTURE_WRAP_R, GL_CLAMP_TO_EDGE);
    }

    void render(const Scene& scene, GLuint depthTexture) {
        // Step 1: Clear and inject light into froxels
        injectShader.use();
        glBindImageTexture(0, froxelTexture, 0, GL_TRUE, 0,
                           GL_WRITE_ONLY, GL_RGBA16F);

        // Set uniforms for light injection
        injectShader.setMat4("invViewProj", scene.invViewProj);
        injectShader.setVec3("lightPosition", scene.mainLight.position);
        // ... other uniforms

        glDispatchCompute(froxelWidth / 8, froxelHeight / 8, froxelDepth / 8);
        glMemoryBarrier(GL_SHADER_IMAGE_ACCESS_BARRIER_BIT);

        // Step 2: Accumulate along view rays (back to front)
        accumulateShader.use();
        glDispatchCompute(froxelWidth / 8, froxelHeight / 8, 1);
        glMemoryBarrier(GL_TEXTURE_FETCH_BARRIER_BIT);
    }
};
```

### Froxel Injection Compute Shader

```glsl
// froxel_inject.comp
#version 430 core
layout (local_size_x = 8, local_size_y = 8, local_size_z = 8) in;

layout (rgba16f, binding = 0) writeonly uniform image3D froxelTexture;

uniform mat4 invViewProj;
uniform vec3 lightPosition;
uniform vec3 lightColor;
uniform float nearPlane;
uniform float farPlane;

// Exponential depth distribution for more detail near camera
float sliceToDepth(float slice, float numSlices) {
    return nearPlane * pow(farPlane / nearPlane, slice / numSlices);
}

vec3 froxelToWorldPos(ivec3 froxelCoord, vec3 froxelSize) {
    vec2 uv = (vec2(froxelCoord.xy) + 0.5) / froxelSize.xy;
    float depth = sliceToDepth(float(froxelCoord.z), froxelSize.z);

    // Convert to clip space
    vec4 clipPos = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
    vec4 viewDir = invViewProj * clipPos;
    viewDir /= viewDir.w;

    // Scale by depth
    return viewDir.xyz * depth;
}

void main() {
    ivec3 froxelCoord = ivec3(gl_GlobalInvocationID);
    vec3 froxelSize = vec3(imageSize(froxelTexture));

    if (any(greaterThanEqual(froxelCoord, ivec3(froxelSize)))) return;

    vec3 worldPos = froxelToWorldPos(froxelCoord, froxelSize);

    // Calculate lighting contribution
    vec3 toLight = lightPosition - worldPos;
    float lightDist = length(toLight);
    float attenuation = 1.0 / (lightDist * lightDist);

    // Sample shadow map here...
    float shadow = 1.0; // Simplified

    vec3 inscattering = lightColor * attenuation * shadow;

    // Store scattering and extinction
    float extinction = 0.01; // Constant fog density

    imageStore(froxelTexture, froxelCoord, vec4(inscattering, extinction));
}
```

## Putting It All Together

A complete post-processing pipeline combines these effects in a specific order:

```cpp
class GamePostProcessing {
private:
    Framebuffer hdrBuffer;
    Framebuffer velocityBuffer;

    // Effects in order of application
    VolumetricLightingEffect volumetrics;
    MotionBlurEffect motionBlur;
    DepthOfFieldEffect depthOfField;
    BloomEffect bloom;
    ToneMappingEffect toneMapping;
    ColorGradingEffect colorGrading;
    TAAEffect taa;
    FXAAEffect fxaa;

    PostProcessingPipeline pipeline;

public:
    void initialize(int width, int height) {
        hdrBuffer.create(width, height, true);  // HDR format
        velocityBuffer.create(width, height, false);

        volumetrics.initialize(width, height);
        motionBlur.initialize(width, height);
        depthOfField.initialize(width, height);
        bloom.initialize(width, height, 6);
        toneMapping.initialize();
        colorGrading.initialize();
        taa.initialize(width, height);
        fxaa.initialize();
    }

    void render(Scene& scene) {
        // 1. Render scene to HDR buffer with velocity
        hdrBuffer.bind();
        scene.render();

        // 2. Render velocity buffer
        velocityBuffer.bind();
        scene.renderVelocity();

        // 3. Apply post-processing chain
        GLuint currentTexture = hdrBuffer.colorTexture;

        // Volumetric lighting (needs depth)
        currentTexture = volumetrics.apply(
            currentTexture,
            hdrBuffer.depthTexture,
            scene
        );

        // Motion blur (needs velocity)
        currentTexture = motionBlur.apply(
            currentTexture,
            velocityBuffer.colorTexture,
            hdrBuffer.depthTexture
        );

        // Depth of field (needs depth)
        currentTexture = depthOfField.apply(
            currentTexture,
            hdrBuffer.depthTexture
        );

        // Bloom (HDR)
        currentTexture = bloom.apply(currentTexture);

        // Tone mapping (HDR -> LDR)
        currentTexture = toneMapping.apply(currentTexture);

        // Color grading (LDR)
        currentTexture = colorGrading.apply(currentTexture);

        // TAA (needs velocity and history)
        currentTexture = taa.apply(
            currentTexture,
            velocityBuffer.colorTexture
        );

        // FXAA (final pass to screen)
        glBindFramebuffer(GL_FRAMEBUFFER, 0);
        fxaa.apply(currentTexture);
    }
};
```

## Performance Considerations

### Resolution Scaling

Many effects can be computed at lower resolution:

```cpp
// Compute bloom at half resolution
bloom.initialize(width / 2, height / 2);

// Compute volumetrics at quarter resolution
volumetrics.initialize(width / 4, height / 4);

// Upscale with bilateral filter to preserve edges
bilateralUpscale(lowResResult, fullResDepth, fullResOutput);
```

### Async Compute

On modern GPUs, overlap compute work with graphics:

```cpp
// OpenGL compute
glDispatchCompute(groupsX, groupsY, groupsZ);

// Vulkan async compute
vkCmdPipelineBarrier(computeCmd, ...);
vkQueueSubmit(computeQueue, ...);

// DirectX 12 async compute
computeCommandList->Dispatch(groupsX, groupsY, groupsZ);
computeCommandQueue->ExecuteCommandLists(...);
```

### Quality Presets

Provide quality presets for different hardware:

```cpp
struct PostProcessingQuality {
    int bloomMipLevels;
    int motionBlurSamples;
    int dofSamples;
    int volumetricSamples;
    float renderScale;
    bool taaEnabled;
    bool fxaaEnabled;
};

PostProcessingQuality qualityPresets[] = {
    // Low
    { 3, 4, 8, 16, 0.75f, false, true },
    // Medium
    { 5, 8, 16, 32, 1.0f, true, false },
    // High
    { 6, 12, 32, 64, 1.0f, true, false },
    // Ultra
    { 7, 16, 48, 128, 1.0f, true, false }
};
```

## Summary

Post-processing effects transform raw rendered output into polished, cinematic visuals. The key effects covered in this article form the foundation of modern game graphics:

1. **Bloom** creates the characteristic glow around bright objects, essential for HDR rendering
2. **Depth of Field** simulates camera focus, adding cinematic quality and guiding player attention
3. **Motion Blur** conveys speed and smooth movement, enhancing the sense of motion
4. **Tone Mapping** bridges HDR content to displayable LDR, preserving detail across brightness ranges
5. **Color Grading** provides artistic control over the final image mood and style
6. **Anti-Aliasing** (FXAA/TAA) eliminates jagged edges for cleaner visuals
7. **Volumetric Lighting** adds atmospheric depth with light scattering effects

When implementing post-processing:

- **Order matters**: Effects must be applied in a specific sequence (HDR effects before tone mapping, AA last)
- **Performance budgets**: Balance quality with frame rate using resolution scaling and quality presets
- **Platform differences**: Optimize differently for desktop, console, and mobile GPUs
- **Artist tools**: Expose intuitive controls for non-programmers to tweak visual style

With these techniques mastered, you can elevate your game's visuals from functional to breathtaking, creating the polished aesthetic that players expect from modern titles.
