---
title: Simplex Noise Algorithm
description: Master Simplex noise for procedural generation with better performance and visual quality than Perlin noise
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - simplex noise
  - procedural generation
  - noise
  - terrain
  - textures
  - algorithms
status: imported
origin: old/src/content/docs/gamedev/simplex-noise.en.md
divergence: 0.232
issues:
  - h1-in-body
legacy:
  category: GameDev
  subcategory: Procedural Generation
  order: 55
  lastUpdated: 2026-01-22
---

Simplex noise, invented by Ken Perlin in 2001, is an improvement over classic Perlin noise. It offers better visual quality, fewer directional artifacts, and superior performance in higher dimensions.

## Understanding Simplex Noise

### Advantages Over Perlin Noise

Simplex noise addresses several limitations of classic Perlin noise:

1. **Lower computational complexity**: O(n^2) vs O(2^n) for n dimensions
2. **Fewer directional artifacts**: Uses simplices instead of hypercubes
3. **Well-defined gradient**: No need for interpolation function
4. **Better visual isotropy**: More uniform appearance in all directions

### The Simplex Concept

A simplex is the simplest shape that can tile n-dimensional space:
- 1D: Line segment (2 vertices)
- 2D: Equilateral triangle (3 vertices)
- 3D: Tetrahedron (4 vertices)
- 4D: Pentatope (5 vertices)

```typescript
// Simplex vertex counts
const SIMPLEX_VERTICES: Record<number, number> = {
  1: 2,  // Line
  2: 3,  // Triangle
  3: 4,  // Tetrahedron
  4: 5   // Pentatope
};
```

## 2D Simplex Noise Implementation

### Core Algorithm

```typescript
class SimplexNoise2D {
  // Skewing factors for 2D
  private static readonly F2 = 0.5 * (Math.sqrt(3) - 1);
  private static readonly G2 = (3 - Math.sqrt(3)) / 6;

  // Gradient vectors for 2D
  private static readonly GRAD2: [number, number][] = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1]
  ];

  private perm: Uint8Array;
  private permMod12: Uint8Array;

  constructor(seed: number = 0) {
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    this.initPermutation(seed);
  }

  private initPermutation(seed: number): void {
    // Create permutation table
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // Shuffle using seed
    const random = this.seededRandom(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    // Duplicate for seamless wrapping
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  noise(x: number, y: number): number {
    const { F2, G2, GRAD2 } = SimplexNoise2D;

    // Skew input space to determine which simplex cell we're in
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    // Unskew back to find origin of cell in (x,y) space
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;

    // Position relative to cell origin
    const x0 = x - X0;
    const y0 = y - Y0;

    // Determine which simplex (triangle) we're in
    // If x0 > y0, we're in the lower triangle, else upper
    let i1: number, j1: number;
    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }

    // Offsets for second and third corners
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    // Hash coordinates for gradient lookup
    const ii = i & 255;
    const jj = j & 255;

    // Calculate contributions from each corner
    let n0 = 0, n1 = 0, n2 = 0;

    // Corner 0
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const gi0 = this.permMod12[ii + this.perm[jj]] % 8;
      t0 *= t0;
      n0 = t0 * t0 * this.dot2(GRAD2[gi0], x0, y0);
    }

    // Corner 1
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]] % 8;
      t1 *= t1;
      n1 = t1 * t1 * this.dot2(GRAD2[gi1], x1, y1);
    }

    // Corner 2
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]] % 8;
      t2 *= t2;
      n2 = t2 * t2 * this.dot2(GRAD2[gi2], x2, y2);
    }

    // Scale to [-1, 1]
    return 70 * (n0 + n1 + n2);
  }

  private dot2(grad: [number, number], x: number, y: number): number {
    return grad[0] * x + grad[1] * y;
  }
}
```

## 3D Simplex Noise

```typescript
class SimplexNoise3D {
  // Skewing factors for 3D
  private static readonly F3 = 1 / 3;
  private static readonly G3 = 1 / 6;

  // Gradient vectors for 3D
  private static readonly GRAD3: [number, number, number][] = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
  ];

  private perm: Uint8Array;
  private permMod12: Uint8Array;

  constructor(seed: number = 0) {
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    this.initPermutation(seed);
  }

  private initPermutation(seed: number): void {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;

    const random = this.seededRandom(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  noise(x: number, y: number, z: number): number {
    const { F3, G3, GRAD3 } = SimplexNoise3D;

    // Skew input space
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);

    // Unskew back
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;

    // Position relative to cell origin
    const x0 = x - X0;
    const y0 = y - Y0;
    const z0 = z - Z0;

    // Determine which simplex (tetrahedron) we're in
    let i1: number, j1: number, k1: number;
    let i2: number, j2: number, k2: number;

    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0;
        i2 = 1; j2 = 1; k2 = 0;
      } else if (x0 >= z0) {
        i1 = 1; j1 = 0; k1 = 0;
        i2 = 1; j2 = 0; k2 = 1;
      } else {
        i1 = 0; j1 = 0; k1 = 1;
        i2 = 1; j2 = 0; k2 = 1;
      }
    } else {
      if (y0 < z0) {
        i1 = 0; j1 = 0; k1 = 1;
        i2 = 0; j2 = 1; k2 = 1;
      } else if (x0 < z0) {
        i1 = 0; j1 = 1; k1 = 0;
        i2 = 0; j2 = 1; k2 = 1;
      } else {
        i1 = 0; j1 = 1; k1 = 0;
        i2 = 1; j2 = 1; k2 = 0;
      }
    }

    // Offsets for corners
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;

    // Hash coordinates
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    // Calculate contributions from corners
    let n0 = 0, n1 = 0, n2 = 0, n3 = 0;

    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 >= 0) {
      const gi0 = this.permMod12[ii + this.perm[jj + this.perm[kk]]];
      t0 *= t0;
      n0 = t0 * t0 * this.dot3(GRAD3[gi0], x0, y0, z0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 >= 0) {
      const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]];
      t1 *= t1;
      n1 = t1 * t1 * this.dot3(GRAD3[gi1], x1, y1, z1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 >= 0) {
      const gi2 = this.permMod12[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]];
      t2 *= t2;
      n2 = t2 * t2 * this.dot3(GRAD3[gi2], x2, y2, z2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 >= 0) {
      const gi3 = this.permMod12[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]];
      t3 *= t3;
      n3 = t3 * t3 * this.dot3(GRAD3[gi3], x3, y3, z3);
    }

    // Scale to [-1, 1]
    return 32 * (n0 + n1 + n2 + n3);
  }

  private dot3(grad: [number, number, number], x: number, y: number, z: number): number {
    return grad[0] * x + grad[1] * y + grad[2] * z;
  }
}
```

## Fractal Noise (fBm)

Fractional Brownian motion combines multiple octaves of noise for richer detail.

```typescript
class FractalNoise {
  private noise2D: SimplexNoise2D;
  private noise3D: SimplexNoise3D;

  constructor(seed: number = 0) {
    this.noise2D = new SimplexNoise2D(seed);
    this.noise3D = new SimplexNoise3D(seed);
  }

  /**
   * 2D Fractal Brownian Motion
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param octaves - Number of noise layers
   * @param lacunarity - Frequency multiplier per octave (typically 2.0)
   * @param persistence - Amplitude multiplier per octave (typically 0.5)
   */
  fbm2D(
    x: number,
    y: number,
    octaves: number = 6,
    lacunarity: number = 2,
    persistence: number = 0.5
  ): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise2D.noise(x * frequency, y * frequency);
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue;
  }

  /**
   * 3D Fractal Brownian Motion
   */
  fbm3D(
    x: number,
    y: number,
    z: number,
    octaves: number = 6,
    lacunarity: number = 2,
    persistence: number = 0.5
  ): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise3D.noise(
        x * frequency,
        y * frequency,
        z * frequency
      );
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue;
  }

  /**
   * Ridged multifractal noise - creates ridge-like features
   */
  ridged2D(
    x: number,
    y: number,
    octaves: number = 6,
    lacunarity: number = 2,
    gain: number = 2,
    offset: number = 1
  ): number {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let weight = 1;

    for (let i = 0; i < octaves; i++) {
      let signal = this.noise2D.noise(x * frequency, y * frequency);
      signal = offset - Math.abs(signal);
      signal *= signal * weight;

      weight = Math.min(1, Math.max(0, signal * gain));
      value += amplitude * signal;

      amplitude *= 0.5;
      frequency *= lacunarity;
    }

    return value;
  }

  /**
   * Turbulence - absolute value of noise creates billowy patterns
   */
  turbulence2D(
    x: number,
    y: number,
    octaves: number = 6,
    lacunarity: number = 2,
    persistence: number = 0.5
  ): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * Math.abs(this.noise2D.noise(x * frequency, y * frequency));
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue;
  }
}
```

## Domain Warping

Domain warping uses noise to distort the input coordinates, creating more organic patterns.

```typescript
class DomainWarping {
  private noise: FractalNoise;

  constructor(seed: number = 0) {
    this.noise = new FractalNoise(seed);
  }

  /**
   * Single layer domain warping
   */
  warp2D(
    x: number,
    y: number,
    warpStrength: number = 4,
    octaves: number = 6
  ): number {
    // Calculate warp offsets
    const qx = this.noise.fbm2D(x, y, octaves);
    const qy = this.noise.fbm2D(x + 5.2, y + 1.3, octaves);

    // Apply warp and sample noise
    return this.noise.fbm2D(
      x + warpStrength * qx,
      y + warpStrength * qy,
      octaves
    );
  }

  /**
   * Double layer domain warping for more complex patterns
   */
  doubleWarp2D(
    x: number,
    y: number,
    warpStrength1: number = 4,
    warpStrength2: number = 4,
    octaves: number = 6
  ): number {
    // First warp layer
    const qx = this.noise.fbm2D(x, y, octaves);
    const qy = this.noise.fbm2D(x + 5.2, y + 1.3, octaves);

    // Second warp layer
    const rx = this.noise.fbm2D(
      x + warpStrength1 * qx + 1.7,
      y + warpStrength1 * qy + 9.2,
      octaves
    );
    const ry = this.noise.fbm2D(
      x + warpStrength1 * qx + 8.3,
      y + warpStrength1 * qy + 2.8,
      octaves
    );

    // Final sample
    return this.noise.fbm2D(
      x + warpStrength2 * rx,
      y + warpStrength2 * ry,
      octaves
    );
  }

  /**
   * Time-varying domain warping for animation
   */
  animatedWarp2D(
    x: number,
    y: number,
    time: number,
    warpStrength: number = 4,
    octaves: number = 6
  ): number {
    // Animate the warp offset positions
    const qx = this.noise.fbm2D(x + time * 0.1, y, octaves);
    const qy = this.noise.fbm2D(x, y + time * 0.1, octaves);

    return this.noise.fbm2D(
      x + warpStrength * qx,
      y + warpStrength * qy,
      octaves
    );
  }
}
```

## Practical Applications

### Terrain Generation

```typescript
class TerrainGenerator {
  private noise: FractalNoise;
  private warp: DomainWarping;

  constructor(seed: number = 0) {
    this.noise = new FractalNoise(seed);
    this.warp = new DomainWarping(seed);
  }

  generateHeightmap(
    width: number,
    height: number,
    scale: number = 0.01
  ): Float32Array {
    const heightmap = new Float32Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x * scale;
        const ny = y * scale;

        // Base terrain using fBm
        let elevation = this.noise.fbm2D(nx, ny, 8, 2, 0.5);

        // Add ridges for mountains
        const ridgeNoise = this.noise.ridged2D(nx * 2, ny * 2, 4);
        elevation = elevation * 0.7 + ridgeNoise * 0.3;

        // Apply domain warping for more organic shapes
        const warpedElevation = this.warp.warp2D(nx, ny, 2, 4);
        elevation = elevation * 0.8 + warpedElevation * 0.2;

        // Normalize to [0, 1]
        heightmap[y * width + x] = (elevation + 1) * 0.5;
      }
    }

    return heightmap;
  }

  generateBiomeMap(
    width: number,
    height: number,
    scale: number = 0.005
  ): Float32Array {
    const biomeMap = new Float32Array(width * height * 2); // temperature, moisture

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x * scale;
        const ny = y * scale;
        const index = (y * width + x) * 2;

        // Temperature varies with latitude and noise
        const latitudeEffect = 1 - Math.abs(y / height - 0.5) * 2;
        const tempNoise = this.noise.fbm2D(nx, ny, 4);
        biomeMap[index] = latitudeEffect * 0.7 + (tempNoise + 1) * 0.15;

        // Moisture from noise
        biomeMap[index + 1] = (this.noise.fbm2D(nx + 100, ny + 100, 4) + 1) * 0.5;
      }
    }

    return biomeMap;
  }
}
```

### Texture Generation

```typescript
class ProceduralTextures {
  private noise: FractalNoise;
  private warp: DomainWarping;

  constructor(seed: number = 0) {
    this.noise = new FractalNoise(seed);
    this.warp = new DomainWarping(seed);
  }

  /**
   * Generate marble-like texture
   */
  marble(x: number, y: number, scale: number = 0.1): number {
    const turbulence = this.noise.turbulence2D(x * scale, y * scale, 6);
    return Math.sin(x * 0.1 + turbulence * 5);
  }

  /**
   * Generate wood grain texture
   */
  wood(x: number, y: number, scale: number = 0.1): number {
    const noise = this.noise.fbm2D(x * scale, y * scale, 4);
    const distance = Math.sqrt(x * x + y * y) * 0.1 + noise * 2;
    return Math.sin(distance * 20) * 0.5 + 0.5;
  }

  /**
   * Generate cloud texture
   */
  clouds(x: number, y: number, time: number = 0, scale: number = 0.01): number {
    // Use animated domain warping for moving clouds
    const warped = this.warp.animatedWarp2D(x * scale, y * scale, time, 2, 6);

    // Threshold for cloud shapes
    return Math.max(0, warped * 1.5);
  }

  /**
   * Generate water caustics pattern
   */
  caustics(x: number, y: number, time: number = 0, scale: number = 0.05): number {
    const n1 = this.noise.fbm2D(
      x * scale + Math.sin(time * 0.5) * 0.5,
      y * scale + Math.cos(time * 0.3) * 0.5,
      4
    );
    const n2 = this.noise.fbm2D(
      x * scale * 1.5 + Math.cos(time * 0.4) * 0.5,
      y * scale * 1.5 + Math.sin(time * 0.6) * 0.5,
      4
    );

    // Create caustic effect by combining and thresholding
    const combined = Math.abs(n1 - n2);
    return Math.pow(1 - combined, 3);
  }

  /**
   * Generate fire/plasma effect
   */
  fire(x: number, y: number, time: number = 0, scale: number = 0.02): number {
    // Upward moving noise
    const n1 = this.noise.turbulence2D(
      x * scale,
      y * scale - time * 2,
      6
    );

    // Height-based falloff
    const heightFactor = Math.max(0, 1 - y * 0.01);

    return n1 * heightFactor;
  }
}
```

### Cave Generation with 3D Noise

```typescript
class CaveGenerator {
  private noise: SimplexNoise3D;

  threshold: number = 0.3;
  scale: number = 0.05;

  constructor(seed: number = 0) {
    this.noise = new SimplexNoise3D(seed);
  }

  /**
   * Check if a position is solid or air
   */
  isSolid(x: number, y: number, z: number): boolean {
    const density = this.getDensity(x, y, z);
    return density > this.threshold;
  }

  /**
   * Get density value for smooth transitions
   */
  getDensity(x: number, y: number, z: number): number {
    // Base noise
    let density = this.fbm3D(x * this.scale, y * this.scale, z * this.scale, 4);

    // Make caves more likely at certain depths
    const depthFactor = Math.sin(y * 0.1) * 0.2;
    density += depthFactor;

    // Add worm-like tunnels
    const wormNoise = this.wormCaves(x, y, z);
    density = Math.max(density, wormNoise);

    return density;
  }

  private fbm3D(x: number, y: number, z: number, octaves: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let max = 0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise.noise(
        x * frequency,
        y * frequency,
        z * frequency
      );
      max += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / max;
  }

  /**
   * Generate worm-like cave tunnels
   */
  private wormCaves(x: number, y: number, z: number): number {
    const wormScale = 0.02;
    const nx = this.noise.noise(x * wormScale, y * wormScale, z * wormScale);
    const ny = this.noise.noise(x * wormScale + 100, y * wormScale, z * wormScale);

    // Create tube-like structures
    const distance = Math.sqrt(nx * nx + ny * ny);
    const wormRadius = 0.3;

    return distance < wormRadius ? -1 : 0;
  }

  /**
   * Generate a chunk of cave data
   */
  generateChunk(
    chunkX: number,
    chunkY: number,
    chunkZ: number,
    size: number
  ): Uint8Array {
    const data = new Uint8Array(size * size * size);

    for (let z = 0; z < size; z++) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const worldX = chunkX * size + x;
          const worldY = chunkY * size + y;
          const worldZ = chunkZ * size + z;

          const index = x + y * size + z * size * size;
          data[index] = this.isSolid(worldX, worldY, worldZ) ? 1 : 0;
        }
      }
    }

    return data;
  }
}
```

## GPU Implementation (GLSL)

```glsl
// GLSL Simplex noise for shaders

// Permutation polynomial
vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

// 2D Simplex noise
float snoise(vec2 v) {
    const vec4 C = vec4(
        0.211324865405187,   // (3.0 - sqrt(3.0)) / 6.0
        0.366025403784439,   // 0.5 * (sqrt(3.0) - 1.0)
        -0.577350269189626,  // -1.0 + 2.0 * C.x
        0.024390243902439    // 1.0 / 41.0
    );

    // First corner
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    // Other corners
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    // Permutations
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;

    // Gradients
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    // Compute final noise value
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// 3D Simplex noise
float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    // Permutations
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // Gradients
    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    // Normalize gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// fBm using simplex noise
float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;

    for (int i = 0; i < octaves; i++) {
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return value;
}
```

## Best Practices

### 1. Performance Optimization

```typescript
class OptimizedNoise {
  // Pre-compute expensive operations
  private sinTable: Float32Array;
  private cosTable: Float32Array;

  constructor() {
    const size = 4096;
    this.sinTable = new Float32Array(size);
    this.cosTable = new Float32Array(size);

    for (let i = 0; i < size; i++) {
      const angle = (i / size) * Math.PI * 2;
      this.sinTable[i] = Math.sin(angle);
      this.cosTable[i] = Math.cos(angle);
    }
  }

  // Use lookup tables for trigonometric functions
  fastSin(angle: number): number {
    const normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const index = Math.floor((normalized / (Math.PI * 2)) * this.sinTable.length);
    return this.sinTable[index];
  }

  fastCos(angle: number): number {
    const normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const index = Math.floor((normalized / (Math.PI * 2)) * this.cosTable.length);
    return this.cosTable[index];
  }
}

// Use typed arrays for better performance
class TypedNoise {
  // Store intermediate results in typed arrays
  private tempBuffer: Float32Array;

  constructor(maxSize: number) {
    this.tempBuffer = new Float32Array(maxSize);
  }

  // Batch generate noise values
  generateBatch(
    noise: SimplexNoise2D,
    coords: Float32Array,
    output: Float32Array
  ): void {
    const count = coords.length / 2;
    for (let i = 0; i < count; i++) {
      output[i] = noise.noise(coords[i * 2], coords[i * 2 + 1]);
    }
  }
}
```

### 2. Seamless Tiling

```typescript
class TileableNoise {
  private noise: SimplexNoise2D;

  constructor(seed: number = 0) {
    this.noise = new SimplexNoise2D(seed);
  }

  /**
   * Generate tileable noise using 4D noise projection
   * Maps 2D coordinates onto a torus in 4D space
   */
  tileable2D(
    x: number,
    y: number,
    width: number,
    height: number
  ): number {
    // Map to torus coordinates
    const s = x / width;
    const t = y / height;

    const nx = Math.cos(s * Math.PI * 2);
    const ny = Math.sin(s * Math.PI * 2);
    const nz = Math.cos(t * Math.PI * 2);
    const nw = Math.sin(t * Math.PI * 2);

    // Use 4D noise (would need 4D implementation)
    // Here we approximate with combined 2D samples
    const n1 = this.noise.noise(nx, ny);
    const n2 = this.noise.noise(nz + 100, nw + 100);
    return (n1 + n2) * 0.5;
  }
}
```

### 3. Derivative Calculation

```typescript
class NoiseWithDerivatives {
  private noise: SimplexNoise2D;

  constructor(seed: number = 0) {
    this.noise = new SimplexNoise2D(seed);
  }

  /**
   * Calculate noise value and partial derivatives
   * Useful for normal map generation
   */
  noiseWithDerivatives(
    x: number,
    y: number
  ): { value: number; dx: number; dy: number } {
    const epsilon = 0.001;

    const value = this.noise.noise(x, y);
    const dx = (this.noise.noise(x + epsilon, y) - this.noise.noise(x - epsilon, y)) / (2 * epsilon);
    const dy = (this.noise.noise(x, y + epsilon) - this.noise.noise(x, y - epsilon)) / (2 * epsilon);

    return { value, dx, dy };
  }

  /**
   * Generate normal map from noise
   */
  generateNormalMap(
    width: number,
    height: number,
    scale: number,
    strength: number = 1
  ): Float32Array {
    const normalMap = new Float32Array(width * height * 3);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const { dx, dy } = this.noiseWithDerivatives(x * scale, y * scale);

        const index = (y * width + x) * 3;
        normalMap[index] = -dx * strength * 0.5 + 0.5;
        normalMap[index + 1] = -dy * strength * 0.5 + 0.5;
        normalMap[index + 2] = 1;
      }
    }

    return normalMap;
  }
}
```

## Summary

Simplex noise provides efficient, high-quality procedural generation:

- **Better performance** than Perlin noise, especially in higher dimensions
- **Fewer artifacts** due to simplex-based interpolation
- **fBm** combines octaves for natural-looking detail
- **Domain warping** creates organic, flowing patterns
- **Wide applications** including terrain, textures, caves, and effects

Understanding the underlying mathematics enables customization for specific use cases.

## Further Reading

- Ken Perlin's original Simplex noise paper
- "Texturing & Modeling: A Procedural Approach"
- GPU Gems chapters on procedural generation
- Inigo Quilez's articles on noise and shaders
- Research papers on procedural content generation
