---
title: Vegetation Systems and Weather Effects
description: Master techniques for creating dynamic vegetation and immersive weather systems in 3D game development
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - vegetation
  - weather
  - foliage
  - wind
  - rain
  - snow
  - particles
  - shaders
  - environment
status: imported
origin: old/src/content/docs/gamedev/vegetation-weather.en.md
divergence: 0.227
issues:
  - h1-in-body
legacy:
  category: GameDev
  subcategory: 3D Games
  order: 54
  lastUpdated: 2026-01-22
---

Creating believable natural environments requires sophisticated vegetation rendering and dynamic weather systems. This guide covers techniques for realistic foliage, wind simulation, and various weather effects.

## Vegetation Rendering Fundamentals

### Instanced Vegetation System

```typescript
interface VegetationInstance {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
  color: Color;       // Per-instance color variation
  windPhase: number;  // Wind animation offset
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
    // Pack instance data into buffer
    // Each instance: 16 floats for transform matrix + 4 floats for color + 1 float for wind phase
    const floatsPerInstance = 21;
    const data = new Float32Array(instances.length * floatsPerInstance);

    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      const offset = i * floatsPerInstance;

      // Transform matrix (4x4)
      const matrix = Matrix4.compose(inst.position, inst.rotation, inst.scale);
      for (let j = 0; j < 16; j++) {
        data[offset + j] = matrix.elements[j];
      }

      // Color
      data[offset + 16] = inst.color.r;
      data[offset + 17] = inst.color.g;
      data[offset + 18] = inst.color.b;
      data[offset + 19] = inst.color.a;

      // Wind phase
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

      // Frustum culling at batch level
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
    // Quick AABB check for the entire group
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
    // Set vegetation shader uniforms
    GPU.setUniform('u_time', time);
    GPU.setUniform('u_windStrength', this.windStrength);
    GPU.setUniform('u_windDirection', this.windDirection);

    GPU.bindVertexBuffer(mesh.vertexBuffer);
    GPU.bindInstanceBuffer(instanceBuffer);
    GPU.drawInstanced(mesh.indexCount, count);
  }
}
```

### Vegetation Shader with Wind Animation

```glsl
// Vertex Shader
#version 450

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_texcoord;
layout(location = 3) in vec4 a_color;  // Vertex color for wind influence

// Instance attributes
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

// Simplex noise for wind variation
float snoise(vec2 v);

vec3 calculateWindOffset(vec3 worldPos, float windInfluence) {
    // Main wind wave
    float windTime = u_time * 2.0 + i_windPhase;
    float windWave = sin(windTime + worldPos.x * 0.1 + worldPos.z * 0.1);

    // Secondary turbulence
    vec2 noiseCoord = worldPos.xz * 0.05 + vec2(u_time * 0.5);
    float turbulence = snoise(noiseCoord) * 0.5;

    // Gust effect
    float gustFrequency = 0.2;
    float gust = max(0.0, sin(u_time * gustFrequency)) * 0.5;

    // Combine effects
    float totalWind = (windWave + turbulence) * (1.0 + gust);

    // Apply wind direction with height-based influence
    vec3 offset = u_windDirection * totalWind * u_windStrength * windInfluence;

    // Add slight vertical bounce
    offset.y -= abs(totalWind) * 0.1 * windInfluence;

    return offset;
}

void main() {
    // Get wind influence from vertex color (alpha channel)
    float windInfluence = a_color.a;

    // Calculate world position
    vec4 worldPos = i_modelMatrix * vec4(a_position, 1.0);

    // Apply wind offset
    vec3 windOffset = calculateWindOffset(worldPos.xyz, windInfluence);
    worldPos.xyz += windOffset;

    // Transform normal
    mat3 normalMatrix = mat3(transpose(inverse(i_modelMatrix)));
    v_normal = normalize(normalMatrix * a_normal);

    // Output
    v_worldPos = worldPos.xyz;
    v_texcoord = a_texcoord;
    v_color = a_color * i_instanceColor;

    gl_Position = u_viewProjection * worldPos;
}

// Fragment Shader
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
    // Sample textures
    vec4 albedo = texture(u_albedoMap, v_texcoord) * v_color;

    // Alpha test for foliage
    if (albedo.a < 0.5) {
        discard;
    }

    // Normal mapping
    vec3 normalMap = texture(u_normalMap, v_texcoord).xyz * 2.0 - 1.0;
    vec3 normal = normalize(v_normal + normalMap * 0.5);

    // Two-sided lighting for leaves
    vec3 viewNormal = gl_FrontFacing ? normal : -normal;

    // Diffuse lighting
    float NdotL = max(dot(viewNormal, -u_lightDirection), 0.0);

    // Subsurface scattering for thin leaves
    float backLight = max(dot(-viewNormal, -u_lightDirection), 0.0);
    vec3 subsurface = albedo.rgb * backLight * u_subsurfaceScattering;

    // Final color
    vec3 diffuse = albedo.rgb * u_lightColor * NdotL;
    vec3 ambient = albedo.rgb * u_ambientColor;

    fragColor = vec4(diffuse + ambient + subsurface, albedo.a);
}
```

### LOD System for Vegetation

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
    // Sort by distance
    levels.sort((a, b) => a.maxDistance - b.maxDistance);
    this.lodLevels.set(typeId, levels);
  }

  generateBillboard(typeId: string, mesh: Mesh): void {
    // Render mesh from multiple angles to create billboard atlas
    const atlasSize = 512;
    const angles = 8; // Number of viewing angles

    const renderTarget = GPU.createRenderTarget(atlasSize, atlasSize);

    // Render each angle
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

    // Find appropriate LOD level
    for (const level of levels) {
      if (distance <= level.maxDistance) {
        // Check if should use billboard
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

    // Beyond all LOD levels - cull
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

## Grass Rendering

### GPU-Based Grass System

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

    // Create grass blade buffer
    const maxBlades = this.calculateMaxBlades();
    this.grassBuffer = GPU.createBuffer({
      size: maxBlades * 32, // 32 bytes per blade
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.VERTEX
    });

    // Initialize compute shader for grass generation
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

        // Generate pseudo-random position within patch
        let seed = vec2<f32>(f32(index), f32(params.patchId));
        let randX = hash(seed);
        let randZ = hash(seed + vec2<f32>(1.0, 0.0));

        let localPos = vec2<f32>(randX, randZ) * params.patchSize;
        let worldPos = params.patchOrigin + localPos;

        // Sample density map
        let density = textureSampleLevel(densityMap, defaultSampler, worldPos / params.terrainSize, 0.0).r;

        // Skip if density too low
        if (hash(seed + vec2<f32>(2.0, 0.0)) > density) {
          blades[index].height = 0.0; // Mark as invisible
          return;
        }

        // Sample terrain height
        let terrainY = textureSampleLevel(terrainHeight, defaultSampler, worldPos / params.terrainSize, 0.0).r * params.terrainMaxHeight;

        // Sample grass height variation
        let heightVariation = textureSampleLevel(heightMap, defaultSampler, worldPos / params.terrainSize, 0.0).r;

        // Generate blade properties
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
    // Determine which patches need grass generation
    const visiblePatches = this.getVisiblePatches(cameraPosition);

    // Run compute shader for each patch
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

    // Sort by distance for better cache usage
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

### Grass Blade Geometry Shader

```glsl
// Geometry Shader for grass blades
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

    // Main wind wave
    float wave = sin(windTime + windPhase) * 0.5 + 0.5;

    // Turbulence
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

    // Skip invisible blades
    if (height <= 0.0) return;

    // Calculate blade orientation
    mat3 rotation = rotationY(facing);

    // Face towards camera (optional billboard effect)
    vec3 toCamera = normalize(u_cameraPosition - basePos);
    float cameraAngle = atan(toCamera.x, toCamera.z);
    mat3 billboardRotation = rotationY(cameraAngle);

    // Blend between fixed facing and billboard based on distance
    float dist = length(u_cameraPosition - basePos);
    float billboardFactor = smoothstep(20.0, 50.0, dist);
    // Use billboard rotation for distant grass

    // Generate blade vertices
    int segments = 3;
    for (int i = 0; i <= segments; i++) {
        float t = float(i) / float(segments);
        float segmentHeight = height * t;

        // Calculate wind offset
        vec3 windOffset = calculateWindOffset(basePos, t);

        // Curve the blade
        float curveOffset = bend * t * t;
        vec3 curveDir = rotation * vec3(0, 0, 1);

        // Calculate position
        vec3 bladePos = basePos + vec3(0, segmentHeight, 0);
        bladePos += curveDir * curveOffset;
        bladePos += windOffset;
        bladePos += rotation * vec3(tilt * t, 0, 0);

        // Width decreases towards tip
        float segmentWidth = width * (1.0 - t * 0.8);

        // Normal
        vec3 normal = rotation * vec3(0, 0, 1);

        // Left vertex
        vec3 leftPos = bladePos + rotation * vec3(-segmentWidth * 0.5, 0, 0);
        v_worldPos = leftPos;
        v_normal = normal;
        v_texcoord = vec2(0, t);
        v_ao = 1.0 - t * 0.3; // Darker at base
        gl_Position = u_viewProjection * vec4(leftPos, 1.0);
        EmitVertex();

        // Right vertex
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

## Weather Systems

### Weather State Machine

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
  private transitionDuration: number = 30; // seconds

  private weatherPresets: Map<string, WeatherState> = new Map();

  // Sub-systems
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
    // Update transition
    if (this.transitionProgress < 1) {
      this.transitionProgress += deltaTime / this.transitionDuration;
      this.transitionProgress = Math.min(1, this.transitionProgress);
      this.currentState = this.interpolateStates(
        this.currentState,
        this.targetState,
        this.easeInOut(this.transitionProgress)
      );
    }

    // Update sub-systems
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

### Rain System

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
    // Each particle: position (3) + velocity (3) + life (1) + size (1) = 8 floats
    this.particleBuffer = GPU.createBuffer({
      size: this.maxParticles * 8 * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE
    });
  }

  private initializePools(): void {
    // Pre-allocate splash effects
    for (let i = 0; i < 100; i++) {
      this.splashPool.push(new SplashEffect());
    }

    // Pre-allocate ripple effects
    for (let i = 0; i < 50; i++) {
      this.ripplePool.push(new RippleEffect());
    }
  }

  update(deltaTime: number, intensity: number, cameraPosition: Vector3): void {
    // Spawn new particles
    const spawnRate = intensity * 1000; // particles per second
    const spawnCount = Math.floor(spawnRate * deltaTime);

    for (let i = 0; i < spawnCount && this.particles.length < this.maxParticles; i++) {
      this.spawnParticle(cameraPosition);
    }

    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Apply gravity and wind
      particle.velocity.y -= 9.8 * deltaTime;
      particle.position = particle.position.add(
        particle.velocity.scale(deltaTime)
      );

      // Check for collision
      if (particle.position.y <= 0) {
        this.onParticleHitGround(particle);
        this.particles.splice(i, 1);
        continue;
      }

      // Check terrain collision
      const terrainHit = this.checkTerrainCollision(particle);
      if (terrainHit) {
        this.onParticleHitSurface(particle, terrainHit);
        this.particles.splice(i, 1);
      }
    }

    // Update effects
    this.updateSplashes(deltaTime);
    this.updateRipples(deltaTime);

    // Update GPU buffer
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
        (Math.random() - 0.5) * 2, // slight horizontal variation
        -this.fallSpeed,
        (Math.random() - 0.5) * 2
      ),
      size: 0.02 + Math.random() * 0.02
    };

    this.particles.push(particle);
  }

  private checkTerrainCollision(particle: RainDrop): RaycastHit | null {
    // Simple raycast for collision
    const hit = this.collisionSystem.cast(
      particle.position,
      particle.velocity.normalize(),
      particle.velocity.length() * 0.016 // One frame ahead
    );

    return hit;
  }

  private onParticleHitGround(particle: RainDrop): void {
    // Spawn splash effect
    const splash = this.splashPool.find(s => !s.active);
    if (splash) {
      splash.activate(particle.position);
    }

    // Spawn ripple if hitting water
    if (this.isWaterSurface(particle.position)) {
      const ripple = this.ripplePool.find(r => !r.active);
      if (ripple) {
        ripple.activate(particle.position);
      }
    }
  }

  private onParticleHitSurface(particle: RainDrop, hit: RaycastHit): void {
    // Spawn splash at hit point
    const splash = this.splashPool.find(s => !s.active);
    if (splash) {
      splash.activate(hit.point, hit.normal);
    }
  }

  private isWaterSurface(position: Vector3): boolean {
    // Check if position is over water
    return position.y <= 0.1; // Simple water level check
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
      data[offset + 6] = 1; // life
      data[offset + 7] = p.size;
    }

    GPU.updateBuffer(this.particleBuffer, data);
  }

  render(): void {
    // Render rain particles as stretched quads
    GPU.bindShader(this.rainShader);
    GPU.bindBuffer(this.particleBuffer);
    GPU.drawInstanced(6, this.particles.length);

    // Render splashes
    for (const splash of this.splashPool) {
      if (splash.active) {
        splash.render();
      }
    }

    // Render ripples
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

    // Generate splash particles
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

    // Update splash particles with gravity
    for (const p of this.particles) {
      p.y -= 15 * deltaTime;
    }
  }

  render(): void {
    const alpha = 1 - this.lifetime / this.maxLifetime;
    // Render splash particles as small billboards
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
    // Render ripple as expanding ring on water surface
  }
}
```

### Snow System

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
    // Spawn snowflakes
    const spawnRate = intensity * 500;
    const spawnCount = Math.floor(spawnRate * deltaTime);

    for (let i = 0; i < spawnCount && this.particles.length < this.maxParticles; i++) {
      this.spawnParticle(cameraPosition);
    }

    // Update particles
    const time = performance.now() / 1000;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // Gentle falling with sway
      const sway = Math.sin(time * this.swayFrequency + particle.phase) * this.swayAmount;

      particle.velocity.x = sway;
      particle.velocity.y = -this.fallSpeed * (0.8 + particle.size * 0.4);

      particle.position = particle.position.add(
        particle.velocity.scale(deltaTime)
      );

      // Rotation
      particle.rotation += particle.rotationSpeed * deltaTime;

      // Check ground collision
      const groundHeight = this.accumulation.getHeightAt(
        particle.position.x,
        particle.position.z
      );

      if (particle.position.y <= groundHeight) {
        this.accumulation.addSnow(particle.position, particle.size);
        this.particles.splice(i, 1);
      }
    }

    // Update accumulation
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

  maxAccumulation: number = 0.5; // meters
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
    // Optional: simulate melting based on temperature
    // GPU.updateTexture(this.accumulationTexture, this.accumulationMap);
  }

  getAccumulationTexture(): Texture {
    return this.accumulationTexture;
  }
}
```

### Volumetric Fog

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
        // Simplex or Perlin noise implementation
        return 0.0;
      }

      @compute @workgroup_size(8, 8, 1)
      fn main(@builtin(global_invocation_id) id: vec3<u32>) {
        let dims = textureDimensions(fogVolume);
        if (id.x >= dims.x || id.y >= dims.y || id.z >= dims.z) { return; }

        // Calculate world position for this voxel
        let uv = vec2<f32>(f32(id.x) / f32(dims.x), f32(id.y) / f32(dims.y));
        let depth = f32(id.z) / f32(dims.z);

        // Exponential depth distribution for better near-camera detail
        let linearDepth = params.maxDistance * depth * depth;

        // Reconstruct world position
        let clipPos = vec4<f32>(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
        var worldPos = params.inverseViewProjection * clipPos;
        worldPos = worldPos / worldPos.w;

        // Calculate fog density at this position
        var fogDensity = params.density;

        // Height-based density falloff
        let heightFalloff = exp(-max(0.0, worldPos.y) * 0.1);
        fogDensity *= heightFalloff;

        // Add noise for variation
        let noisePos = worldPos.xyz * 0.05 + vec3<f32>(params.time * 0.1, 0.0, 0.0);
        fogDensity *= 0.5 + noise3D(noisePos) * 0.5;

        // Calculate in-scattering (simplified)
        let lightDir = normalize(vec3<f32>(0.5, 0.8, 0.3));
        let viewDir = normalize(worldPos.xyz - params.cameraPosition);
        let phase = 0.5 + 0.5 * dot(lightDir, -viewDir); // Simple phase function

        let inScattering = params.fogColor.rgb * params.scattering * phase;

        // Store density and scattering
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

## Best Practices

### 1. Performance Optimization

```typescript
class OptimizedEnvironmentSystem {
  // LOD management
  private vegetationLODSystem: VegetationLODSystem;

  // Spatial culling
  private octree: Octree<VegetationInstance>;

  // Instance batching
  private batchSize: number = 1000;

  update(camera: Camera): void {
    // Frustum culling with octree
    const visibleNodes = this.octree.queryFrustum(camera.frustum);

    // Sort by material/mesh for batching
    const batches = this.sortIntoBatches(visibleNodes);

    // Update LOD based on distance
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
    // Group by mesh/material for efficient rendering
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

### 2. Weather Transitions

```typescript
class SmoothWeatherTransition {
  // Use curves for natural-feeling transitions
  transitionCurves: Map<string, AnimationCurve> = new Map();

  constructor() {
    // Rain builds up gradually, then sustains
    this.transitionCurves.set('rain', new AnimationCurve([
      { time: 0, value: 0 },
      { time: 0.3, value: 0.2 },
      { time: 0.6, value: 0.8 },
      { time: 1.0, value: 1.0 }
    ]));

    // Fog appears slowly
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

### 3. Memory Management

```typescript
class WeatherParticlePool<T extends Particle> {
  private pool: T[] = [];
  private active: T[] = [];
  private factory: () => T;

  constructor(initialSize: number, factory: () => T) {
    this.factory = factory;

    // Pre-allocate particles
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

## Summary

Creating immersive natural environments requires careful implementation of:

- **Vegetation Systems**: GPU instancing, LOD, wind animation, and efficient culling
- **Grass Rendering**: Compute shader generation, geometry shaders, and density maps
- **Weather State Machine**: Smooth transitions between weather conditions
- **Rain Effects**: Particle systems with splashes and ripples
- **Snow Systems**: Falling particles with accumulation
- **Volumetric Fog**: 3D textures with ray marching for atmospheric depth

Balance visual quality with performance through LOD systems, spatial partitioning, and particle pooling.

## Further Reading

- "Real-Time Rendering" - Atmospheric effects and participating media
- GPU Gems series - Vegetation and weather rendering techniques
- "Game Engine Architecture" - Environment system design
- Unreal/Unity documentation for engine-specific implementations
- Research papers on volumetric rendering and atmospheric scattering
