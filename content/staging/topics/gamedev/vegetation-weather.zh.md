---
title: 植被系统与天气效果
description: 掌握在 3D 游戏开发中创建动态植被和沉浸式天气系统的技术
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - 植被
  - 天气
  - 草木
  - 风
  - 雨
  - 雪
  - 粒子
  - 着色器
  - 环境
status: imported
origin: old/src/content/docs/gamedev/vegetation-weather.zh.md
divergence: 0.227
issues:
  - h1-in-body
legacy:
  category: GameDev
  subcategory: 3D Games
  order: 54
  lastUpdated: 2026-01-22
---

创建可信的自然环境需要复杂的植被渲染和动态天气系统。本指南涵盖了逼真草木、风模拟和各种天气效果的技术。

## 植被渲染基础

### 实例化植被系统

```typescript
interface VegetationInstance {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
  color: Color;       // 每实例颜色变化
  windPhase: number;  // 风动画偏移
}

class VegetationSystem {
  private instances: Map<string, VegetationInstance[]> = new Map();
  private instanceBuffers: Map<string, GPUBuffer> = new Map();
  private meshes: Map<string, Mesh> = new Map();

  maxInstancesPerDraw: number = 10000;

  addVegetationType(id: string, mesh: Mesh): void {
    this.meshes.set(id, mesh);
    this.instances.set(id, []);
  }

  addInstance(typeId: string, instance: VegetationInstance): void {
    const instances = this.instances.get(typeId);
    if (instances) {
      instances.push(instance);
    }
  }

  buildInstanceBuffers(): void {
    for (const [typeId, instances] of this.instances) {
      const buffer = this.createInstanceBuffer(instances);
      this.instanceBuffers.set(typeId, buffer);
    }
  }

  private createInstanceBuffer(instances: VegetationInstance[]): GPUBuffer {
    // 将实例数据打包到缓冲区
    // 每个实例：16 个浮点数用于变换矩阵 + 4 个浮点数用于颜色 + 1 个浮点数用于风相位
    const floatsPerInstance = 21;
    const data = new Float32Array(instances.length * floatsPerInstance);

    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      const offset = i * floatsPerInstance;

      // 变换矩阵 (4x4)
      const matrix = Matrix4.compose(inst.position, inst.rotation, inst.scale);
      for (let j = 0; j < 16; j++) {
        data[offset + j] = matrix.elements[j];
      }

      // 颜色
      data[offset + 16] = inst.color.r;
      data[offset + 17] = inst.color.g;
      data[offset + 18] = inst.color.b;
      data[offset + 19] = inst.color.a;

      // 风相位
      data[offset + 20] = inst.windPhase;
    }

    return GPU.createBuffer({
      data,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE
    });
  }

  render(camera: Camera, time: number): void {
    for (const [typeId, buffer] of this.instanceBuffers) {
      const mesh = this.meshes.get(typeId)!;
      const instances = this.instances.get(typeId)!;

      // 批量级别的视锥剔除
      if (!this.isAnyInstanceVisible(instances, camera)) {
        continue;
      }

      this.drawInstanced(mesh, buffer, instances.length, time);
    }
  }

  private isAnyInstanceVisible(
    instances: VegetationInstance[],
    camera: Camera
  ): boolean {
    // 对整个组进行快速 AABB 检查
    const bounds = this.calculateBounds(instances);
    return camera.frustum.intersectsBox(bounds);
  }

  private calculateBounds(instances: VegetationInstance[]): AABB {
    const min = new Vector3(Infinity, Infinity, Infinity);
    const max = new Vector3(-Infinity, -Infinity, -Infinity);

    for (const inst of instances) {
      min.x = Math.min(min.x, inst.position.x);
      min.y = Math.min(min.y, inst.position.y);
      min.z = Math.min(min.z, inst.position.z);
      max.x = Math.max(max.x, inst.position.x);
      max.y = Math.max(max.y, inst.position.y);
      max.z = Math.max(max.z, inst.position.z);
    }

    return new AABB(min, max);
  }

  private drawInstanced(
    mesh: Mesh,
    instanceBuffer: GPUBuffer,
    count: number,
    time: number
  ): void {
    // 设置植被着色器 uniform
    GPU.setUniform('u_time', time);
    GPU.setUniform('u_windStrength', this.windStrength);
    GPU.setUniform('u_windDirection', this.windDirection);

    GPU.bindVertexBuffer(mesh.vertexBuffer);
    GPU.bindInstanceBuffer(instanceBuffer);
    GPU.drawInstanced(mesh.indexCount, count);
  }
}
```

### 带风动画的植被着色器

```glsl
// 顶点着色器
#version 450

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_texcoord;
layout(location = 3) in vec4 a_color;  // 用于风影响的顶点颜色

// 实例属性
layout(location = 4) in mat4 i_modelMatrix;
layout(location = 8) in vec4 i_instanceColor;
layout(location = 9) in float i_windPhase;

uniform mat4 u_viewProjection;
uniform float u_time;
uniform float u_windStrength;
uniform vec3 u_windDirection;

out vec3 v_worldPos;
out vec3 v_normal;
out vec2 v_texcoord;
out vec4 v_color;

// 用于风变化的 Simplex 噪声
float snoise(vec2 v);

vec3 calculateWindOffset(vec3 worldPos, float windInfluence) {
    // 主风波
    float windTime = u_time * 2.0 + i_windPhase;
    float windWave = sin(windTime + worldPos.x * 0.1 + worldPos.z * 0.1);

    // 二次湍流
    vec2 noiseCoord = worldPos.xz * 0.05 + vec2(u_time * 0.5);
    float turbulence = snoise(noiseCoord) * 0.5;

    // 阵风效果
    float gustFrequency = 0.2;
    float gust = max(0.0, sin(u_time * gustFrequency)) * 0.5;

    // 组合效果
    float totalWind = (windWave + turbulence) * (1.0 + gust);

    // 应用风向和基于高度的影响
    vec3 offset = u_windDirection * totalWind * u_windStrength * windInfluence;

    // 添加轻微的垂直弹跳
    offset.y -= abs(totalWind) * 0.1 * windInfluence;

    return offset;
}

void main() {
    // 从顶点颜色获取风影响（alpha 通道）
    float windInfluence = a_color.a;

    // 计算世界位置
    vec4 worldPos = i_modelMatrix * vec4(a_position, 1.0);

    // 应用风偏移
    vec3 windOffset = calculateWindOffset(worldPos.xyz, windInfluence);
    worldPos.xyz += windOffset;

    // 变换法线
    mat3 normalMatrix = mat3(transpose(inverse(i_modelMatrix)));
    v_normal = normalize(normalMatrix * a_normal);

    // 输出
    v_worldPos = worldPos.xyz;
    v_texcoord = a_texcoord;
    v_color = a_color * i_instanceColor;

    gl_Position = u_viewProjection * worldPos;
}

// 片段着色器
#version 450

in vec3 v_worldPos;
in vec3 v_normal;
in vec2 v_texcoord;
in vec4 v_color;

uniform sampler2D u_albedoMap;
uniform sampler2D u_normalMap;
uniform vec3 u_lightDirection;
uniform vec3 u_lightColor;
uniform vec3 u_ambientColor;
uniform float u_subsurfaceScattering;

out vec4 fragColor;

void main() {
    // 采样纹理
    vec4 albedo = texture(u_albedoMap, v_texcoord) * v_color;

    // 草木的 Alpha 测试
    if (albedo.a < 0.5) {
        discard;
    }

    // 法线贴图
    vec3 normalMap = texture(u_normalMap, v_texcoord).xyz * 2.0 - 1.0;
    vec3 normal = normalize(v_normal + normalMap * 0.5);

    // 叶子的双面光照
    vec3 viewNormal = gl_FrontFacing ? normal : -normal;

    // 漫反射光照
    float NdotL = max(dot(viewNormal, -u_lightDirection), 0.0);

    // 薄叶子的次表面散射
    float backLight = max(dot(-viewNormal, -u_lightDirection), 0.0);
    vec3 subsurface = albedo.rgb * backLight * u_subsurfaceScattering;

    // 最终颜色
    vec3 diffuse = albedo.rgb * u_lightColor * NdotL;
    vec3 ambient = albedo.rgb * u_ambientColor;

    fragColor = vec4(diffuse + ambient + subsurface, albedo.a);
}
```

### 植被 LOD 系统

```typescript
interface VegetationLOD {
  mesh: Mesh;
  maxDistance: number;
  billboardAtDistance?: number;
}

class VegetationLODSystem {
  private lodLevels: Map<string, VegetationLOD[]> = new Map();
  private billboardTextures: Map<string, Texture> = new Map();

  setLODLevels(typeId: string, levels: VegetationLOD[]): void {
    // 按距离排序
    levels.sort((a, b) => a.maxDistance - b.maxDistance);
    this.lodLevels.set(typeId, levels);
  }

  generateBillboard(typeId: string, mesh: Mesh): void {
    // 从多个角度渲染网格以创建公告板图集
    const atlasSize = 512;
    const angles = 8; // 视角数量

    const renderTarget = GPU.createRenderTarget(atlasSize, atlasSize);

    // 渲染每个角度
    for (let i = 0; i < angles; i++) {
      const angle = (i / angles) * Math.PI * 2;
      const camera = this.createOrthographicCamera(mesh, angle);

      GPU.setRenderTarget(renderTarget, i);
      GPU.clear();
      GPU.draw(mesh, camera);
    }

    this.billboardTextures.set(typeId, renderTarget.texture);
  }

  selectLOD(
    typeId: string,
    instancePosition: Vector3,
    cameraPosition: Vector3
  ): { mesh: Mesh | null; useBillboard: boolean; billboardAngle: number } {
    const levels = this.lodLevels.get(typeId);
    if (!levels) {
      return { mesh: null, useBillboard: false, billboardAngle: 0 };
    }

    const distance = instancePosition.subtract(cameraPosition).length();

    // 找到适当的 LOD 级别
    for (const level of levels) {
      if (distance <= level.maxDistance) {
        // 检查是否应该使用公告板
        if (level.billboardAtDistance && distance >= level.billboardAtDistance) {
          const direction = cameraPosition.subtract(instancePosition).normalize();
          const angle = Math.atan2(direction.x, direction.z);

          return {
            mesh: null,
            useBillboard: true,
            billboardAngle: angle
          };
        }

        return {
          mesh: level.mesh,
          useBillboard: false,
          billboardAngle: 0
        };
      }
    }

    // 超出所有 LOD 级别 - 剔除
    return { mesh: null, useBillboard: false, billboardAngle: 0 };
  }

  private createOrthographicCamera(mesh: Mesh, angle: number): Camera {
    const bounds = mesh.getBounds();
    const size = Math.max(bounds.width, bounds.height);

    const camera = new OrthographicCamera(-size, size, -size, size, 0.1, 100);
    camera.position = new Vector3(
      Math.sin(angle) * 10,
      bounds.center.y,
      Math.cos(angle) * 10
    );
    camera.lookAt(bounds.center);

    return camera;
  }
}
```

## 草地渲染

### 基于 GPU 的草地系统

```typescript
class GrassSystem {
  private grassDensityMap: Texture;
  private grassHeightMap: Texture;
  private terrainHeightMap: Texture;

  bladesPerPatch: number = 1000;
  patchSize: number = 10;
  maxGrassDistance: number = 100;

  private computeShader: ComputeShader;
  private grassBuffer: GPUBuffer;

  initialize(terrain: Terrain): void {
    this.terrainHeightMap = terrain.heightMap;

    // 创建草叶缓冲区
    const maxBlades = this.calculateMaxBlades();
    this.grassBuffer = GPU.createBuffer({
      size: maxBlades * 32, // 每片草叶 32 字节
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX
    });

    // 初始化草地生成的计算着色器
    this.computeShader = new ComputeShader(`
      struct GrassBlade {
        position: vec3<f32>,
        facing: f32,
        height: f32,
        width: f32,
        tilt: f32,
        bend: f32,
      };

      @group(0) @binding(0) var<storage, read_write> blades: array<GrassBlade>;
      @group(0) @binding(1) var densityMap: texture_2d<f32>;
      @group(0) @binding(2) var heightMap: texture_2d<f32>;
      @group(0) @binding(3) var terrainHeight: texture_2d<f32>;

      @group(1) @binding(0) var<uniform> params: GrassParams;

      fn hash(p: vec2<f32>) -> f32 {
        return fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453);
      }

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let index = id.x;
        if (index >= params.bladeCount) { return; }

        // 在区块内生成伪随机位置
        let seed = vec2<f32>(f32(index), f32(params.patchId));
        let randX = hash(seed);
        let randZ = hash(seed + vec2<f32>(1.0, 0.0));

        let localPos = vec2<f32>(randX, randZ) * params.patchSize;
        let worldPos = params.patchOrigin + localPos;

        // 采样密度图
        let density = textureSampleLevel(densityMap, defaultSampler, worldPos / params.terrainSize, 0.0).r;

        // 如果密度太低则跳过
        if (hash(seed + vec2<f32>(2.0, 0.0)) > density) {
          blades[index].height = 0.0; // 标记为不可见
          return;
        }

        // 采样地形高度
        let terrainY = textureSampleLevel(terrainHeight, defaultSampler, worldPos / params.terrainSize, 0.0).r * params.terrainMaxHeight;

        // 采样草地高度变化
        let heightVariation = textureSampleLevel(heightMap, defaultSampler, worldPos / params.terrainSize, 0.0).r;

        // 生成草叶属性
        blades[index].position = vec3<f32>(worldPos.x, terrainY, worldPos.y);
        blades[index].facing = hash(seed + vec2<f32>(3.0, 0.0)) * 6.283185;
        blades[index].height = params.baseHeight * (0.5 + heightVariation);
        blades[index].width = params.baseWidth * (0.8 + hash(seed + vec2<f32>(4.0, 0.0)) * 0.4);
        blades[index].tilt = (hash(seed + vec2<f32>(5.0, 0.0)) - 0.5) * 0.3;
        blades[index].bend = hash(seed + vec2<f32>(6.0, 0.0)) * 0.2;
      }
    `);
  }

  private calculateMaxBlades(): number {
    const patchCount = Math.ceil(this.maxGrassDistance / this.patchSize) ** 2;
    return patchCount * this.bladesPerPatch;
  }

  update(cameraPosition: Vector3): void {
    // 确定哪些区块需要生成草地
    const visiblePatches = this.getVisiblePatches(cameraPosition);

    // 为每个区块运行计算着色器
    for (const patch of visiblePatches) {
      this.generateGrassForPatch(patch);
    }
  }

  private getVisiblePatches(cameraPosition: Vector3): PatchInfo[] {
    const patches: PatchInfo[] = [];

    const halfDistance = this.maxGrassDistance / 2;
    const startX = Math.floor((cameraPosition.x - halfDistance) / this.patchSize);
    const startZ = Math.floor((cameraPosition.z - halfDistance) / this.patchSize);
    const endX = Math.ceil((cameraPosition.x + halfDistance) / this.patchSize);
    const endZ = Math.ceil((cameraPosition.z + halfDistance) / this.patchSize);

    for (let x = startX; x < endX; x++) {
      for (let z = startZ; z < endZ; z++) {
        const origin = new Vector2(x * this.patchSize, z * this.patchSize);
        const center = origin.add(new Vector2(this.patchSize / 2, this.patchSize / 2));
        const distance = new Vector2(cameraPosition.x, cameraPosition.z)
          .subtract(center)
          .length();

        if (distance <= this.maxGrassDistance) {
          patches.push({
            id: x * 10000 + z,
            origin,
            distance
          });
        }
      }
    }

    // 按距离排序以获得更好的缓存使用
    patches.sort((a, b) => a.distance - b.distance);

    return patches;
  }

  private generateGrassForPatch(patch: PatchInfo): void {
    GPU.bindComputeShader(this.computeShader);
    GPU.setComputeUniform('patchId', patch.id);
    GPU.setComputeUniform('patchOrigin', patch.origin);
    GPU.setComputeUniform('patchSize', this.patchSize);
    GPU.setComputeUniform('bladeCount', this.bladesPerPatch);

    GPU.dispatch(Math.ceil(this.bladesPerPatch / 64), 1, 1);
  }
}

interface PatchInfo {
  id: number;
  origin: Vector2;
  distance: number;
}
```

### 草叶几何着色器

```glsl
// 草叶的几何着色器
#version 450

layout(points) in;
layout(triangle_strip, max_vertices = 7) out;

in VS_OUT {
    vec3 position;
    float facing;
    float height;
    float width;
    float tilt;
    float bend;
} gs_in[];

uniform mat4 u_viewProjection;
uniform float u_time;
uniform vec3 u_windDirection;
uniform float u_windStrength;
uniform vec3 u_cameraPosition;

out vec3 v_worldPos;
out vec3 v_normal;
out vec2 v_texcoord;
out float v_ao;

mat3 rotationY(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat3(c, 0, s, 0, 1, 0, -s, 0, c);
}

vec3 calculateWindOffset(vec3 worldPos, float heightRatio) {
    float windTime = u_time * 1.5;
    float windPhase = worldPos.x * 0.1 + worldPos.z * 0.1;

    // 主风波
    float wave = sin(windTime + windPhase) * 0.5 + 0.5;

    // 湍流
    float turbulence = sin(windTime * 3.0 + windPhase * 2.0) * 0.2;

    float totalWind = (wave + turbulence) * u_windStrength * heightRatio * heightRatio;

    return u_windDirection * totalWind;
}

void main() {
    vec3 basePos = gs_in[0].position;
    float facing = gs_in[0].facing;
    float height = gs_in[0].height;
    float width = gs_in[0].width;
    float tilt = gs_in[0].tilt;
    float bend = gs_in[0].bend;

    // 跳过不可见的草叶
    if (height <= 0.0) return;

    // 计算草叶朝向
    mat3 rotation = rotationY(facing);

    // 面向相机（可选的公告板效果）
    vec3 toCamera = normalize(u_cameraPosition - basePos);
    float cameraAngle = atan(toCamera.x, toCamera.z);
    mat3 billboardRotation = rotationY(cameraAngle);

    // 根据距离在固定朝向和公告板之间混合
    float dist = length(u_cameraPosition - basePos);
    float billboardFactor = smoothstep(20.0, 50.0, dist);
    // 对远处的草使用公告板旋转

    // 生成草叶顶点
    int segments = 3;
    for (int i = 0; i <= segments; i++) {
        float t = float(i) / float(segments);
        float segmentHeight = height * t;

        // 计算风偏移
        vec3 windOffset = calculateWindOffset(basePos, t);

        // 使草叶弯曲
        float curveOffset = bend * t * t;
        vec3 curveDir = rotation * vec3(0, 0, 1);

        // 计算位置
        vec3 bladePos = basePos + vec3(0, segmentHeight, 0);
        bladePos += curveDir * curveOffset;
        bladePos += windOffset;
        bladePos += rotation * vec3(tilt * t, 0, 0);

        // 宽度向尖端递减
        float segmentWidth = width * (1.0 - t * 0.8);

        // 法线
        vec3 normal = rotation * vec3(0, 0, 1);

        // 左顶点
        vec3 leftPos = bladePos + rotation * vec3(-segmentWidth * 0.5, 0, 0);
        v_worldPos = leftPos;
        v_normal = normal;
        v_texcoord = vec2(0, t);
        v_ao = 1.0 - t * 0.3; // 底部更暗
        gl_Position = u_viewProjection * vec4(leftPos, 1.0);
        EmitVertex();

        // 右顶点
        vec3 rightPos = bladePos + rotation * vec3(segmentWidth * 0.5, 0, 0);
        v_worldPos = rightPos;
        v_normal = normal;
        v_texcoord = vec2(1, t);
        v_ao = 1.0 - t * 0.3;
        gl_Position = u_viewProjection * vec4(rightPos, 1.0);
        EmitVertex();
    }

    EndPrimitive();
}
```

## 天气系统

### 天气状态机

```typescript
interface WeatherState {
  name: string;
  cloudCoverage: number;
  precipitationType: 'none' | 'rain' | 'snow' | 'hail';
  precipitationIntensity: number;
  fogDensity: number;
  windStrength: number;
  lightningProbability: number;
  temperature: number;
}

class WeatherSystem {
  private currentState: WeatherState;
  private targetState: WeatherState;
  private transitionProgress: number = 1;
  private transitionDuration: number = 30; // 秒

  private weatherPresets: Map<string, WeatherState> = new Map();

  // 子系统
  private cloudSystem: CloudSystem;
  private precipitationSystem: PrecipitationSystem;
  private fogSystem: FogSystem;
  private lightningSystem: LightningSystem;

  constructor() {
    this.initializePresets();
    this.currentState = this.weatherPresets.get('clear')!;
    this.targetState = this.currentState;
  }

  private initializePresets(): void {
    this.weatherPresets.set('clear', {
      name: 'clear',
      cloudCoverage: 0.1,
      precipitationType: 'none',
      precipitationIntensity: 0,
      fogDensity: 0,
      windStrength: 0.2,
      lightningProbability: 0,
      temperature: 22
    });

    this.weatherPresets.set('cloudy', {
      name: 'cloudy',
      cloudCoverage: 0.7,
      precipitationType: 'none',
      precipitationIntensity: 0,
      fogDensity: 0.1,
      windStrength: 0.4,
      lightningProbability: 0,
      temperature: 18
    });

    this.weatherPresets.set('rain', {
      name: 'rain',
      cloudCoverage: 0.9,
      precipitationType: 'rain',
      precipitationIntensity: 0.6,
      fogDensity: 0.2,
      windStrength: 0.5,
      lightningProbability: 0.1,
      temperature: 15
    });

    this.weatherPresets.set('storm', {
      name: 'storm',
      cloudCoverage: 1.0,
      precipitationType: 'rain',
      precipitationIntensity: 1.0,
      fogDensity: 0.3,
      windStrength: 0.9,
      lightningProbability: 0.4,
      temperature: 12
    });

    this.weatherPresets.set('snow', {
      name: 'snow',
      cloudCoverage: 0.8,
      precipitationType: 'snow',
      precipitationIntensity: 0.5,
      fogDensity: 0.4,
      windStrength: 0.3,
      lightningProbability: 0,
      temperature: -5
    });
  }

  transitionTo(presetName: string, duration?: number): void {
    const preset = this.weatherPresets.get(presetName);
    if (!preset) return;

    this.targetState = preset;
    this.transitionProgress = 0;
    this.transitionDuration = duration ?? 30;
  }

  update(deltaTime: number): void {
    // 更新过渡
    if (this.transitionProgress < 1) {
      this.transitionProgress += deltaTime / this.transitionDuration;
      this.transitionProgress = Math.min(1, this.transitionProgress);
      this.currentState = this.interpolateStates(
        this.currentState,
        this.targetState,
        this.easeInOut(this.transitionProgress)
      );
    }

    // 更新子系统
    this.cloudSystem.update(deltaTime, this.currentState.cloudCoverage);
    this.precipitationSystem.update(
      deltaTime,
      this.currentState.precipitationType,
      this.currentState.precipitationIntensity
    );
    this.fogSystem.update(deltaTime, this.currentState.fogDensity);
    this.lightningSystem.update(
      deltaTime,
      this.currentState.lightningProbability
    );
  }

  private interpolateStates(
    from: WeatherState,
    to: WeatherState,
    t: number
  ): WeatherState {
    return {
      name: t < 0.5 ? from.name : to.name,
      cloudCoverage: MathUtils.lerp(from.cloudCoverage, to.cloudCoverage, t),
      precipitationType: t < 0.5 ? from.precipitationType : to.precipitationType,
      precipitationIntensity: MathUtils.lerp(
        from.precipitationIntensity,
        to.precipitationIntensity,
        t
      ),
      fogDensity: MathUtils.lerp(from.fogDensity, to.fogDensity, t),
      windStrength: MathUtils.lerp(from.windStrength, to.windStrength, t),
      lightningProbability: MathUtils.lerp(
        from.lightningProbability,
        to.lightningProbability,
        t
      ),
      temperature: MathUtils.lerp(from.temperature, to.temperature, t)
    };
  }

  private easeInOut(t: number): number {
    return t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  getCurrentState(): WeatherState {
    return { ...this.currentState };
  }
}
```

### 雨水系统

```typescript
class RainSystem {
  private particles: RainDrop[] = [];
  private maxParticles: number = 10000;
  private particleBuffer: GPUBuffer;

  private splashPool: SplashEffect[] = [];
  private ripplePool: RippleEffect[] = [];

  emissionArea: Vector3 = new Vector3(50, 0, 50);
  emissionHeight: number = 30;
  fallSpeed: number = 15;
  dropLength: number = 0.3;

  private collisionSystem: RaycastSystem;

  constructor(collisionSystem: RaycastSystem) {
    this.collisionSystem = collisionSystem;
    this.initializeParticleBuffer();
    this.initializePools();
  }

  private initializeParticleBuffer(): void {
    // 每个粒子：位置 (3) + 速度 (3) + 生命 (1) + 大小 (1) = 8 个浮点数
    this.particleBuffer = GPU.createBuffer({
      size: this.maxParticles * 8 * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE
    });
  }

  private initializePools(): void {
    // 预分配溅射效果
    for (let i = 0; i < 100; i++) {
      this.splashPool.push(new SplashEffect());
    }

    // 预分配涟漪效果
    for (let i = 0; i < 50; i++) {
      this.ripplePool.push(new RippleEffect());
    }
  }

  update(deltaTime: number, intensity: number, cameraPosition: Vector3): void {
    // 生成新粒子
    const spawnRate = intensity * 1000; // 每秒粒子数
    const spawnCount = Math.floor(spawnRate * deltaTime);

    for (let i = 0; i < spawnCount && this.particles.length < this.maxParticles; i++) {
      this.spawnParticle(cameraPosition);
    }

    // 更新现有粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // 应用重力和风
      particle.velocity.y -= 9.8 * deltaTime;
      particle.position = particle.position.add(
        particle.velocity.scale(deltaTime)
      );

      // 检查碰撞
      if (particle.position.y <= 0) {
        this.onParticleHitGround(particle);
        this.particles.splice(i, 1);
        continue;
      }

      // 检查地形碰撞
      const terrainHit = this.checkTerrainCollision(particle);
      if (terrainHit) {
        this.onParticleHitSurface(particle, terrainHit);
        this.particles.splice(i, 1);
      }
    }

    // 更新效果
    this.updateSplashes(deltaTime);
    this.updateRipples(deltaTime);

    // 更新 GPU 缓冲区
    this.updateParticleBuffer();
  }

  private spawnParticle(cameraPosition: Vector3): void {
    const particle: RainDrop = {
      position: new Vector3(
        cameraPosition.x + (Math.random() - 0.5) * this.emissionArea.x,
        cameraPosition.y + this.emissionHeight,
        cameraPosition.z + (Math.random() - 0.5) * this.emissionArea.z
      ),
      velocity: new Vector3(
        (Math.random() - 0.5) * 2, // 轻微的水平变化
        -this.fallSpeed,
        (Math.random() - 0.5) * 2
      ),
      size: 0.02 + Math.random() * 0.02
    };

    this.particles.push(particle);
  }

  private checkTerrainCollision(particle: RainDrop): RaycastHit | null {
    // 简单的射线检测碰撞
    const hit = this.collisionSystem.cast(
      particle.position,
      particle.velocity.normalize(),
      particle.velocity.length() * 0.016 // 提前一帧
    );

    return hit;
  }

  private onParticleHitGround(particle: RainDrop): void {
    // 生成溅射效果
    const splash = this.splashPool.find(s => !s.active);
    if (splash) {
      splash.activate(particle.position);
    }

    // 如果击中水面则生成涟漪
    if (this.isWaterSurface(particle.position)) {
      const ripple = this.ripplePool.find(r => !r.active);
      if (ripple) {
        ripple.activate(particle.position);
      }
    }
  }

  private onParticleHitSurface(particle: RainDrop, hit: RaycastHit): void {
    // 在击中点生成溅射
    const splash = this.splashPool.find(s => !s.active);
    if (splash) {
      splash.activate(hit.point, hit.normal);
    }
  }

  private isWaterSurface(position: Vector3): boolean {
    // 检查位置是否在水面上
    return position.y <= 0.1; // 简单的水位检查
  }

  private updateSplashes(deltaTime: number): void {
    for (const splash of this.splashPool) {
      if (splash.active) {
        splash.update(deltaTime);
      }
    }
  }

  private updateRipples(deltaTime: number): void {
    for (const ripple of this.ripplePool) {
      if (ripple.active) {
        ripple.update(deltaTime);
      }
    }
  }

  private updateParticleBuffer(): void {
    const data = new Float32Array(this.particles.length * 8);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const offset = i * 8;

      data[offset + 0] = p.position.x;
      data[offset + 1] = p.position.y;
      data[offset + 2] = p.position.z;
      data[offset + 3] = p.velocity.x;
      data[offset + 4] = p.velocity.y;
      data[offset + 5] = p.velocity.z;
      data[offset + 6] = 1; // 生命值
      data[offset + 7] = p.size;
    }

    GPU.updateBuffer(this.particleBuffer, data);
  }

  render(): void {
    // 将雨滴粒子渲染为拉伸的四边形
    GPU.bindShader(this.rainShader);
    GPU.bindBuffer(this.particleBuffer);
    GPU.drawInstanced(6, this.particles.length);

    // 渲染溅射
    for (const splash of this.splashPool) {
      if (splash.active) {
        splash.render();
      }
    }

    // 渲染涟漪
    for (const ripple of this.ripplePool) {
      if (ripple.active) {
        ripple.render();
      }
    }
  }
}

interface RainDrop {
  position: Vector3;
  velocity: Vector3;
  size: number;
}

class SplashEffect {
  active: boolean = false;
  position: Vector3 = Vector3.zero();
  normal: Vector3 = Vector3.up();
  lifetime: number = 0;
  maxLifetime: number = 0.3;

  private particles: Vector3[] = [];

  activate(position: Vector3, normal: Vector3 = Vector3.up()): void {
    this.active = true;
    this.position = position;
    this.normal = normal;
    this.lifetime = 0;

    // 生成溅射粒子
    this.particles = [];
    const count = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      this.particles.push(new Vector3(
        Math.cos(angle) * speed,
        2 + Math.random() * 2,
        Math.sin(angle) * speed
      ));
    }
  }

  update(deltaTime: number): void {
    this.lifetime += deltaTime;

    if (this.lifetime >= this.maxLifetime) {
      this.active = false;
      return;
    }

    // 使用重力更新溅射粒子
    for (const p of this.particles) {
      p.y -= 15 * deltaTime;
    }
  }

  render(): void {
    const alpha = 1 - this.lifetime / this.maxLifetime;
    // 将溅射粒子渲染为小型公告板
  }
}

class RippleEffect {
  active: boolean = false;
  position: Vector3 = Vector3.zero();
  radius: number = 0;
  maxRadius: number = 1;
  lifetime: number = 0;
  maxLifetime: number = 1;

  activate(position: Vector3): void {
    this.active = true;
    this.position = position;
    this.radius = 0;
    this.lifetime = 0;
  }

  update(deltaTime: number): void {
    this.lifetime += deltaTime;

    if (this.lifetime >= this.maxLifetime) {
      this.active = false;
      return;
    }

    this.radius = (this.lifetime / this.maxLifetime) * this.maxRadius;
  }

  render(): void {
    const alpha = 1 - this.lifetime / this.maxLifetime;
    // 在水面上渲染涟漪作为扩展的环
  }
}
```

### 雪花系统

```typescript
class SnowSystem {
  private particles: SnowFlake[] = [];
  private maxParticles: number = 5000;
  private accumulation: SnowAccumulation;

  emissionArea: Vector3 = new Vector3(60, 0, 60);
  emissionHeight: number = 40;
  fallSpeed: number = 2;
  swayAmount: number = 1;
  swayFrequency: number = 2;

  constructor(terrain: Terrain) {
    this.accumulation = new SnowAccumulation(terrain);
  }

  update(deltaTime: number, intensity: number, cameraPosition: Vector3): void {
    // 生成雪花
    const spawnRate = intensity * 500;
    const spawnCount = Math.floor(spawnRate * deltaTime);

    for (let i = 0; i < spawnCount && this.particles.length < this.maxParticles; i++) {
      this.spawnParticle(cameraPosition);
    }

    // 更新粒子
    const time = performance.now() / 1000;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // 带摇摆的轻柔下落
      const sway = Math.sin(time * this.swayFrequency + particle.phase) * this.swayAmount;

      particle.velocity.x = sway;
      particle.velocity.y = -this.fallSpeed * (0.8 + particle.size * 0.4);

      particle.position = particle.position.add(
        particle.velocity.scale(deltaTime)
      );

      // 旋转
      particle.rotation += particle.rotationSpeed * deltaTime;

      // 检查地面碰撞
      const groundHeight = this.accumulation.getHeightAt(
        particle.position.x,
        particle.position.z
      );

      if (particle.position.y <= groundHeight) {
        this.accumulation.addSnow(particle.position, particle.size);
        this.particles.splice(i, 1);
      }
    }

    // 更新积雪
    this.accumulation.update(deltaTime);
  }

  private spawnParticle(cameraPosition: Vector3): void {
    const particle: SnowFlake = {
      position: new Vector3(
        cameraPosition.x + (Math.random() - 0.5) * this.emissionArea.x,
        cameraPosition.y + this.emissionHeight,
        cameraPosition.z + (Math.random() - 0.5) * this.emissionArea.z
      ),
      velocity: new Vector3(0, -this.fallSpeed, 0),
      size: 0.02 + Math.random() * 0.04,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 2,
      phase: Math.random() * Math.PI * 2
    };

    this.particles.push(particle);
  }
}

interface SnowFlake {
  position: Vector3;
  velocity: Vector3;
  size: number;
  rotation: number;
  rotationSpeed: number;
  phase: number;
}

class SnowAccumulation {
  private accumulationMap: Float32Array;
  private resolution: number;
  private terrain: Terrain;
  private accumulationTexture: Texture;

  maxAccumulation: number = 0.5; // 米
  meltRate: number = 0.01;

  constructor(terrain: Terrain) {
    this.terrain = terrain;
    this.resolution = 256;
    this.accumulationMap = new Float32Array(this.resolution * this.resolution);

    this.accumulationTexture = GPU.createTexture({
      width: this.resolution,
      height: this.resolution,
      format: 'R32F'
    });
  }

  addSnow(position: Vector3, amount: number): void {
    const x = Math.floor((position.x / this.terrain.size.x + 0.5) * this.resolution);
    const z = Math.floor((position.z / this.terrain.size.z + 0.5) * this.resolution);

    if (x >= 0 && x < this.resolution && z >= 0 && z < this.resolution) {
      const index = z * this.resolution + x;
      this.accumulationMap[index] = Math.min(
        this.maxAccumulation,
        this.accumulationMap[index] + amount * 0.001
      );
    }
  }

  getHeightAt(worldX: number, worldZ: number): number {
    const terrainHeight = this.terrain.getHeightAt(worldX, worldZ);
    const snowHeight = this.getSnowDepthAt(worldX, worldZ);
    return terrainHeight + snowHeight;
  }

  private getSnowDepthAt(worldX: number, worldZ: number): number {
    const x = Math.floor((worldX / this.terrain.size.x + 0.5) * this.resolution);
    const z = Math.floor((worldZ / this.terrain.size.z + 0.5) * this.resolution);

    if (x >= 0 && x < this.resolution && z >= 0 && z < this.resolution) {
      return this.accumulationMap[z * this.resolution + x];
    }
    return 0;
  }

  update(deltaTime: number): void {
    // 可选：根据温度模拟融化
    // GPU.updateTexture(this.accumulationTexture, this.accumulationMap);
  }

  getAccumulationTexture(): Texture {
    return this.accumulationTexture;
  }
}
```

### 体积雾

```typescript
class VolumetricFogSystem {
  private fogVolume: Texture3D;
  private resolution: Vector3 = new Vector3(160, 90, 128);
  private computeShader: ComputeShader;

  fogColor: Color = new Color(0.8, 0.85, 0.9, 1);
  scattering: number = 0.1;
  absorption: number = 0.02;
  density: number = 0.5;

  constructor() {
    this.fogVolume = GPU.createTexture3D({
      width: this.resolution.x,
      height: this.resolution.y,
      depth: this.resolution.z,
      format: 'RGBA16F'
    });

    this.initializeComputeShader();
  }

  private initializeComputeShader(): void {
    this.computeShader = new ComputeShader(`
      @group(0) @binding(0) var fogVolume: texture_storage_3d<rgba16float, write>;
      @group(0) @binding(1) var depthTexture: texture_2d<f32>;
      @group(0) @binding(2) var<uniform> params: FogParams;

      struct FogParams {
        inverseViewProjection: mat4x4<f32>,
        cameraPosition: vec3<f32>,
        time: f32,
        fogColor: vec4<f32>,
        scattering: f32,
        absorption: f32,
        density: f32,
        maxDistance: f32,
      };

      fn noise3D(p: vec3<f32>) -> f32 {
        // Simplex 或 Perlin 噪声实现
        return 0.0;
      }

      @compute @workgroup_size(8, 8, 1)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let dims = textureDimensions(fogVolume);
        if (id.x >= dims.x || id.y >= dims.y || id.z >= dims.z) { return; }

        // 计算此体素的世界位置
        let uv = vec2<f32>(f32(id.x) / f32(dims.x), f32(id.y) / f32(dims.y));
        let depth = f32(id.z) / f32(dims.z);

        // 指数深度分布以获得更好的近相机细节
        let linearDepth = params.maxDistance * depth * depth;

        // 重建世界位置
        let clipPos = vec4<f32>(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
        var worldPos = params.inverseViewProjection * clipPos;
        worldPos = worldPos / worldPos.w;

        // 计算此位置的雾密度
        var fogDensity = params.density;

        // 基于高度的密度衰减
        let heightFalloff = exp(-max(0.0, worldPos.y) * 0.1);
        fogDensity *= heightFalloff;

        // 添加噪声变化
        let noisePos = worldPos.xyz * 0.05 + vec3<f32>(params.time * 0.1, 0.0, 0.0);
        fogDensity *= 0.5 + noise3D(noisePos) * 0.5;

        // 计算内散射（简化）
        let lightDir = normalize(vec3<f32>(0.5, 0.8, 0.3));
        let viewDir = normalize(worldPos.xyz - params.cameraPosition);
        let phase = 0.5 + 0.5 * dot(lightDir, -viewDir); // 简单的相位函数

        let inScattering = params.fogColor.rgb * params.scattering * phase;

        // 存储密度和散射
        textureStore(fogVolume, id, vec4<f32>(inScattering, fogDensity));
      }
    `);
  }

  update(deltaTime: number, camera: Camera): void {
    GPU.bindComputeShader(this.computeShader);
    GPU.setComputeTexture('fogVolume', this.fogVolume);
    GPU.setComputeUniform('inverseViewProjection', camera.inverseViewProjectionMatrix);
    GPU.setComputeUniform('cameraPosition', camera.position);
    GPU.setComputeUniform('time', performance.now() / 1000);
    GPU.setComputeUniform('fogColor', this.fogColor);
    GPU.setComputeUniform('scattering', this.scattering);
    GPU.setComputeUniform('absorption', this.absorption);
    GPU.setComputeUniform('density', this.density);

    GPU.dispatch(
      Math.ceil(this.resolution.x / 8),
      Math.ceil(this.resolution.y / 8),
      this.resolution.z
    );
  }

  getFogVolume(): Texture3D {
    return this.fogVolume;
  }
}
```

## 最佳实践

### 1. 性能优化

```typescript
class OptimizedEnvironmentSystem {
  // LOD 管理
  private vegetationLODSystem: VegetationLODSystem;

  // 空间剔除
  private octree: Octree<VegetationInstance>;

  // 实例批处理
  private batchSize: number = 1000;

  update(camera: Camera): void {
    // 使用八叉树进行视锥剔除
    const visibleNodes = this.octree.queryFrustum(camera.frustum);

    // 按材质/网格排序以进行批处理
    const batches = this.sortIntoBatches(visibleNodes);

    // 根据距离更新 LOD
    for (const batch of batches) {
      for (const instance of batch.instances) {
        const distance = instance.position.subtract(camera.position).length();
        instance.lod = this.vegetationLODSystem.selectLOD(
          batch.typeId,
          instance.position,
          camera.position
        );
      }
    }
  }

  private sortIntoBatches(instances: VegetationInstance[]): Batch[] {
    // 按网格/材质分组以实现高效渲染
    const batches = new Map<string, Batch>();

    for (const instance of instances) {
      const key = `${instance.typeId}_${instance.lod}`;
      if (!batches.has(key)) {
        batches.set(key, {
          typeId: instance.typeId,
          lod: instance.lod,
          instances: []
        });
      }
      batches.get(key)!.instances.push(instance);
    }

    return Array.from(batches.values());
  }
}
```

### 2. 天气过渡

```typescript
class SmoothWeatherTransition {
  // 使用曲线实现自然感觉的过渡
  transitionCurves: Map<string, AnimationCurve> = new Map();

  constructor() {
    // 雨水逐渐积聚，然后持续
    this.transitionCurves.set('rain', new AnimationCurve([
      { time: 0, value: 0 },
      { time: 0.3, value: 0.2 },
      { time: 0.6, value: 0.8 },
      { time: 1.0, value: 1.0 }
    ]));

    // 雾缓慢出现
    this.transitionCurves.set('fog', new AnimationCurve([
      { time: 0, value: 0 },
      { time: 0.5, value: 0.3 },
      { time: 1.0, value: 1.0 }
    ]));
  }

  evaluate(property: string, progress: number): number {
    const curve = this.transitionCurves.get(property);
    return curve ? curve.evaluate(progress) : progress;
  }
}
```

### 3. 内存管理

```typescript
class WeatherParticlePool<T extends Particle> {
  private pool: T[] = [];
  private active: T[] = [];
  private factory: () => T;

  constructor(initialSize: number, factory: () => T) {
    this.factory = factory;

    // 预分配粒子
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T | null {
    if (this.pool.length > 0) {
      const particle = this.pool.pop()!;
      this.active.push(particle);
      return particle;
    }
    return null;
  }

  release(particle: T): void {
    const index = this.active.indexOf(particle);
    if (index !== -1) {
      this.active.splice(index, 1);
      particle.reset();
      this.pool.push(particle);
    }
  }

  releaseAll(): void {
    for (const particle of this.active) {
      particle.reset();
      this.pool.push(particle);
    }
    this.active = [];
  }
}

interface Particle {
  reset(): void;
}
```

## 总结

创建沉浸式自然环境需要仔细实现：

- **植被系统**：GPU 实例化、LOD、风动画和高效剔除
- **草地渲染**：计算着色器生成、几何着色器和密度图
- **天气状态机**：天气条件之间的平滑过渡
- **雨水效果**：带溅射和涟漪的粒子系统
- **雪花系统**：带积雪的下落粒子
- **体积雾**：使用光线步进的 3D 纹理实现大气深度

通过 LOD 系统、空间分区和粒子池来平衡视觉质量和性能。

## 延伸阅读

- 《Real-Time Rendering》 - 大气效果和参与介质
- GPU Gems 系列 - 植被和天气渲染技术
- 《Game Engine Architecture》 - 环境系统设计
- Unreal/Unity 文档 - 引擎特定实现
- 体积渲染和大气散射的研究论文
