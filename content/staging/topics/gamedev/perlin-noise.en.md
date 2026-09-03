---
title: Noise Algorithms and Procedural Generation
description: "Master procedural generation core algorithms: Perlin noise, Simplex noise, and fractal noise"
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - noise
  - Perlin
  - procedural generation
  - algorithms
status: imported
origin: old/src/content/docs/gamedev/perlin-noise.en.md
divergence: 0.122
issues: []
legacy:
  category: GameDev
  subcategory: Procedural
  order: 33
  lastUpdated: 2026-01-07
---

Noise algorithms are the foundation of procedural generation in game development, computer graphics, and simulation. They enable the creation of natural-looking terrains, textures, clouds, and countless other organic patterns without manually designing every detail. We explore noise algorithms from basic concepts to advanced techniques.

## Understanding Randomness vs. Coherent Noise

### The Problem with Pure Randomness

When developers first attempt procedural generation, they often reach for simple random number generators. However, pure randomness produces results that look unnatural and chaotic.

```javascript
// Pure random noise - produces harsh, disconnected values
function pureRandomNoise(width, height) {
  const noise = [];
  for (let y = 0; y < height; y++) {
    noise[y] = [];
    for (let x = 0; x < width; x++) {
      noise[y][x] = Math.random();
    }
  }
  return noise;
}
```

The problem with pure random noise:
- Adjacent pixels have no relationship to each other
- Results look like TV static rather than natural patterns
- No smooth gradients or organic shapes
- Cannot be reproduced with the same seed reliably

### Coherent Noise: The Solution

Coherent noise solves these problems by ensuring that nearby points have similar values, creating smooth gradients and natural-looking patterns.

**Key Properties of Coherent Noise:**

| Property | Description |
|----------|-------------|
| Deterministic | Same input always produces same output |
| Continuous | Small changes in input yield small changes in output |
| Bounded | Output values fall within a predictable range |
| Reproducible | Can regenerate identical results with same seed |

```javascript
// Conceptual comparison
// Pure random: point(5.0, 5.0) has NO relationship to point(5.1, 5.1)
// Coherent noise: point(5.0, 5.0) is SIMILAR to point(5.1, 5.1)
```

---

## Perlin Noise: The Foundation

### History and Significance

Perlin noise was developed by Ken Perlin in 1983 while working on the movie "Tron." He was frustrated with the machine-like appearance of computer-generated imagery and created this algorithm to produce more natural textures. This innovation earned him an Academy Award for Technical Achievement in 1997.

### How Perlin Noise Works

Perlin noise operates on a grid-based system with these key steps:

1. **Define a Grid**: Create a grid of integer coordinates
2. **Assign Gradient Vectors**: Each grid point gets a pseudo-random gradient vector
3. **Calculate Dot Products**: For any point, compute dot products with surrounding gradients
4. **Interpolate**: Blend the results using a smooth interpolation function

### Implementation in JavaScript

```javascript
class PerlinNoise {
  constructor(seed = Date.now()) {
    this.permutation = this.generatePermutation(seed);
    // Gradient vectors for 2D
    this.gradients2D = [
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ];
  }

  generatePermutation(seed) {
    // Create a seeded random number generator
    const random = this.seededRandom(seed);

    // Generate permutation table (0-255)
    const perm = [];
    for (let i = 0; i < 256; i++) {
      perm[i] = i;
    }

    // Fisher-Yates shuffle
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }

    // Duplicate for overflow handling
    return [...perm, ...perm];
  }

  seededRandom(seed) {
    return function() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  // Fade function for smooth interpolation (6t^5 - 15t^4 + 10t^3)
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  // Linear interpolation
  lerp(a, b, t) {
    return a + t * (b - a);
  }

  // Get gradient vector for grid point
  getGradient(ix, iy) {
    const hash = this.permutation[this.permutation[ix & 255] + (iy & 255)];
    return this.gradients2D[hash & 7];
  }

  // Dot product of gradient and distance vector
  dotGridGradient(ix, iy, x, y) {
    const gradient = this.getGradient(ix, iy);
    const dx = x - ix;
    const dy = y - iy;
    return dx * gradient[0] + dy * gradient[1];
  }

  // Main noise function for 2D
  noise2D(x, y) {
    // Grid cell coordinates
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;

    // Interpolation weights
    const sx = this.fade(x - x0);
    const sy = this.fade(y - y0);

    // Interpolate between grid point gradients
    const n00 = this.dotGridGradient(x0, y0, x, y);
    const n10 = this.dotGridGradient(x1, y0, x, y);
    const n01 = this.dotGridGradient(x0, y1, x, y);
    const n11 = this.dotGridGradient(x1, y1, x, y);

    const ix0 = this.lerp(n00, n10, sx);
    const ix1 = this.lerp(n01, n11, sx);

    // Result is in range [-1, 1]
    return this.lerp(ix0, ix1, sy);
  }

  // Normalize to [0, 1] range
  noise2DNormalized(x, y) {
    return (this.noise2D(x, y) + 1) / 2;
  }
}

// Usage example
const perlin = new PerlinNoise(12345);
const value = perlin.noise2D(3.5, 2.7);
console.log(`Noise value: ${value}`); // Range: -1 to 1
```

### 3D Perlin Noise

Extending Perlin noise to 3D follows the same principles but with an additional dimension:

```javascript
class PerlinNoise3D extends PerlinNoise {
  constructor(seed) {
    super(seed);
    // 3D gradient vectors (edges of a cube)
    this.gradients3D = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];
  }

  getGradient3D(ix, iy, iz) {
    const hash = this.permutation[
      this.permutation[
        this.permutation[ix & 255] + (iy & 255)
      ] + (iz & 255)
    ];
    return this.gradients3D[hash % 12];
  }

  dotGridGradient3D(ix, iy, iz, x, y, z) {
    const gradient = this.getGradient3D(ix, iy, iz);
    return (x - ix) * gradient[0] +
           (y - iy) * gradient[1] +
           (z - iz) * gradient[2];
  }

  noise3D(x, y, z) {
    // Grid cell coordinates
    const x0 = Math.floor(x), x1 = x0 + 1;
    const y0 = Math.floor(y), y1 = y0 + 1;
    const z0 = Math.floor(z), z1 = z0 + 1;

    // Interpolation weights
    const sx = this.fade(x - x0);
    const sy = this.fade(y - y0);
    const sz = this.fade(z - z0);

    // Calculate dot products for all 8 corners
    const n000 = this.dotGridGradient3D(x0, y0, z0, x, y, z);
    const n100 = this.dotGridGradient3D(x1, y0, z0, x, y, z);
    const n010 = this.dotGridGradient3D(x0, y1, z0, x, y, z);
    const n110 = this.dotGridGradient3D(x1, y1, z0, x, y, z);
    const n001 = this.dotGridGradient3D(x0, y0, z1, x, y, z);
    const n101 = this.dotGridGradient3D(x1, y0, z1, x, y, z);
    const n011 = this.dotGridGradient3D(x0, y1, z1, x, y, z);
    const n111 = this.dotGridGradient3D(x1, y1, z1, x, y, z);

    // Trilinear interpolation
    const ix00 = this.lerp(n000, n100, sx);
    const ix10 = this.lerp(n010, n110, sx);
    const ix01 = this.lerp(n001, n101, sx);
    const ix11 = this.lerp(n011, n111, sx);

    const iy0 = this.lerp(ix00, ix10, sy);
    const iy1 = this.lerp(ix01, ix11, sy);

    return this.lerp(iy0, iy1, sz);
  }
}
```

---

## Simplex Noise: The Modern Alternative

### Why Simplex Noise?

Ken Perlin introduced Simplex noise in 2001 to address limitations of the original Perlin noise:

| Aspect | Perlin Noise | Simplex Noise |
|--------|--------------|---------------|
| Complexity | O(2^n) | O(n^2) |
| Grid Shape | Hypercube | Simplex |
| Directional Artifacts | Visible | Minimal |
| Gradient Count | 2^n corners | n+1 vertices |
| Higher Dimensions | Expensive | Efficient |

### How Simplex Noise Works

Instead of using a cubic grid, Simplex noise uses simplexes (triangles in 2D, tetrahedra in 3D). This reduces the number of points to sample and eliminates many directional artifacts.

```javascript
class SimplexNoise {
  constructor(seed = Date.now()) {
    this.perm = this.buildPermutationTable(seed);

    // Skewing factors for 2D
    this.F2 = 0.5 * (Math.sqrt(3) - 1);
    this.G2 = (3 - Math.sqrt(3)) / 6;

    // Gradient vectors
    this.grad3 = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];
  }

  buildPermutationTable(seed) {
    const perm = new Uint8Array(512);
    const random = this.seededRandom(seed);

    // Generate values 0-255
    const source = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      source[i] = i;
    }

    // Shuffle
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [source[i], source[j]] = [source[j], source[i]];
    }

    // Duplicate for wraparound
    for (let i = 0; i < 512; i++) {
      perm[i] = source[i & 255];
    }

    return perm;
  }

  seededRandom(seed) {
    return () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };
  }

  dot2D(g, x, y) {
    return g[0] * x + g[1] * y;
  }

  noise2D(xin, yin) {
    let n0, n1, n2; // Noise contributions from three corners

    // Skew input space to determine which simplex cell we're in
    const s = (xin + yin) * this.F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);

    // Unskew back to (x,y) space
    const t = (i + j) * this.G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0; // Distances from cell origin
    const y0 = yin - Y0;

    // Determine which simplex we're in
    let i1, j1; // Offsets for second corner
    if (x0 > y0) {
      i1 = 1; j1 = 0; // Lower triangle
    } else {
      i1 = 0; j1 = 1; // Upper triangle
    }

    // Offsets for remaining corners
    const x1 = x0 - i1 + this.G2;
    const y1 = y0 - j1 + this.G2;
    const x2 = x0 - 1.0 + 2.0 * this.G2;
    const y2 = y0 - 1.0 + 2.0 * this.G2;

    // Hashed gradient indices
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.perm[ii + this.perm[jj]] % 12;
    const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
    const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;

    // Calculate contributions from each corner
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) {
      n0 = 0.0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot2D(this.grad3[gi0], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) {
      n1 = 0.0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot2D(this.grad3[gi1], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) {
      n2 = 0.0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot2D(this.grad3[gi2], x2, y2);
    }

    // Scale to [-1, 1]
    return 70.0 * (n0 + n1 + n2);
  }
}
```

---

## Fractal Noise (FBM - Fractional Brownian Motion)

### The Concept of Octaves

A single layer of noise produces smooth, uniform patterns. Natural phenomena like mountains, clouds, and coastlines exhibit detail at multiple scales. Fractal noise achieves this by layering multiple "octaves" of noise.

**Key Parameters:**

| Parameter | Description | Typical Range |
|-----------|-------------|---------------|
| Octaves | Number of noise layers | 4-8 |
| Lacunarity | Frequency multiplier per octave | 2.0 |
| Persistence | Amplitude multiplier per octave | 0.5 |

### FBM Implementation

```javascript
class FractalNoise {
  constructor(noiseGenerator) {
    this.noise = noiseGenerator;
  }

  // Standard FBM
  fbm(x, y, octaves = 6, lacunarity = 2.0, persistence = 0.5) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue; // Normalize to [-1, 1]
  }

  // Ridged multifractal - creates sharp ridges
  ridgedMultifractal(x, y, octaves = 6, lacunarity = 2.0, gain = 2.0) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let weight = 1;

    for (let i = 0; i < octaves; i++) {
      // Get absolute value and invert to create ridges
      let signal = this.noise.noise2D(x * frequency, y * frequency);
      signal = 1.0 - Math.abs(signal);
      signal *= signal; // Square for sharper ridges
      signal *= weight;

      weight = Math.min(1.0, Math.max(0.0, signal * gain));
      total += signal * amplitude;
      frequency *= lacunarity;
      amplitude *= 0.5;
    }

    return total;
  }

  // Turbulence - absolute value FBM
  turbulence(x, y, octaves = 6, lacunarity = 2.0, persistence = 0.5) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += Math.abs(this.noise.noise2D(x * frequency, y * frequency)) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }

  // Domain warping - distorts the input coordinates
  domainWarp(x, y, octaves = 4, warpStrength = 0.5) {
    // First pass: calculate warp offsets
    const warpX = this.fbm(x, y, octaves) * warpStrength;
    const warpY = this.fbm(x + 5.2, y + 1.3, octaves) * warpStrength;

    // Second pass: sample with warped coordinates
    return this.fbm(x + warpX, y + warpY, octaves);
  }

  // Multi-level domain warping for complex patterns
  recursiveDomainWarp(x, y, iterations = 2, octaves = 4, warpStrength = 0.8) {
    let px = x, py = y;

    for (let i = 0; i < iterations; i++) {
      const wx = this.fbm(px, py, octaves);
      const wy = this.fbm(px + 5.2, py + 1.3, octaves);
      px = x + wx * warpStrength;
      py = y + wy * warpStrength;
    }

    return this.fbm(px, py, octaves);
  }
}

// Usage example
const perlin = new PerlinNoise(42);
const fractal = new FractalNoise(perlin);

// Different noise types for different purposes
const terrainHeight = fractal.fbm(x * 0.01, y * 0.01, 8);
const mountainRidges = fractal.ridgedMultifractal(x * 0.01, y * 0.01, 6);
const cloudTurbulence = fractal.turbulence(x * 0.02, y * 0.02, 6);
const organicPattern = fractal.domainWarp(x * 0.01, y * 0.01, 4, 2.0);
```

### Visual Comparison of FBM Parameters

```javascript
// Demonstrates effect of different parameters
function compareFBMParameters() {
  const results = [];
  const baseNoise = new PerlinNoise(123);
  const fractal = new FractalNoise(baseNoise);

  // High octaves = more detail
  results.push({
    name: 'Low detail (2 octaves)',
    value: fractal.fbm(1.5, 2.5, 2, 2.0, 0.5)
  });
  results.push({
    name: 'High detail (8 octaves)',
    value: fractal.fbm(1.5, 2.5, 8, 2.0, 0.5)
  });

  // High persistence = rougher appearance
  results.push({
    name: 'Smooth (persistence 0.3)',
    value: fractal.fbm(1.5, 2.5, 6, 2.0, 0.3)
  });
  results.push({
    name: 'Rough (persistence 0.7)',
    value: fractal.fbm(1.5, 2.5, 6, 2.0, 0.7)
  });

  return results;
}
```

---

## Worley Noise (Cellular Noise)

### Overview

Worley noise, also known as cellular or Voronoi noise, produces patterns based on distances to randomly distributed feature points. It creates distinctive cell-like patterns useful for stone textures, biological cells, water caustics, and more.

### Implementation

```javascript
class WorleyNoise {
  constructor(seed = Date.now()) {
    this.seed = seed;
    this.cellSize = 1.0;
  }

  // Seeded random for reproducible point positions
  hash(x, y) {
    let h = this.seed;
    h ^= x * 374761393;
    h ^= y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return h;
  }

  // Get random point within a cell
  getCellPoint(cellX, cellY) {
    const hash = this.hash(cellX, cellY);
    return {
      x: cellX + ((hash & 0xffff) / 0xffff),
      y: cellY + (((hash >> 16) & 0xffff) / 0xffff)
    };
  }

  // Calculate Euclidean distance
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Manhattan distance (creates more angular patterns)
  manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
  }

  // Chebyshev distance (creates square patterns)
  chebyshevDistance(x1, y1, x2, y2) {
    return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  }

  // Main noise function - returns sorted distances to nearest points
  noise2D(x, y, distanceFunc = 'euclidean') {
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);

    const distances = [];

    // Check 3x3 neighborhood
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const neighborX = cellX + dx;
        const neighborY = cellY + dy;
        const point = this.getCellPoint(neighborX, neighborY);

        let dist;
        switch (distanceFunc) {
          case 'manhattan':
            dist = this.manhattanDistance(x, y, point.x, point.y);
            break;
          case 'chebyshev':
            dist = this.chebyshevDistance(x, y, point.x, point.y);
            break;
          default:
            dist = this.distance(x, y, point.x, point.y);
        }
        distances.push(dist);
      }
    }

    // Sort distances
    distances.sort((a, b) => a - b);

    return {
      f1: distances[0], // Distance to nearest point
      f2: distances[1], // Distance to second nearest
      f3: distances[2]  // Distance to third nearest
    };
  }

  // Common Worley noise variations
  // F1: Basic cellular pattern
  cellularF1(x, y) {
    return this.noise2D(x, y).f1;
  }

  // F2 - F1: Creates cell edges
  cellularEdges(x, y) {
    const d = this.noise2D(x, y);
    return d.f2 - d.f1;
  }

  // F1 + F2: Smoother cellular pattern
  cellularCombined(x, y) {
    const d = this.noise2D(x, y);
    return (d.f1 + d.f2) * 0.5;
  }

  // Crackle pattern
  crackle(x, y) {
    const d = this.noise2D(x, y);
    return Math.max(0, 1.0 - (d.f2 - d.f1) * 3);
  }
}

// Usage examples
const worley = new WorleyNoise(42);

// Stone/cell texture
const stonePattern = worley.cellularF1(x * 5, y * 5);

// Cracked earth
const crackedPattern = worley.cellularEdges(x * 3, y * 3);

// Water caustics
const causticsPattern = worley.crackle(x * 8, y * 8);
```

### Combining Worley with Other Noise

```javascript
class HybridNoise {
  constructor(seed) {
    this.perlin = new PerlinNoise(seed);
    this.worley = new WorleyNoise(seed);
    this.fractal = new FractalNoise(this.perlin);
  }

  // Rocky terrain: Worley for rocks, Perlin for variation
  rockyTerrain(x, y) {
    const base = this.fractal.fbm(x, y, 6);
    const cells = this.worley.cellularF1(x * 2, y * 2);
    return base * 0.7 + cells * 0.3;
  }

  // Cracked ground with noise variation
  crackedGround(x, y) {
    const cracks = this.worley.cellularEdges(x * 4, y * 4);
    const variation = this.perlin.noise2D(x * 10, y * 10) * 0.1;
    return cracks + variation;
  }

  // Organic cells (like skin or plant cells)
  organicCells(x, y) {
    // Warp the coordinates for organic feel
    const warpX = this.perlin.noise2D(x * 0.5, y * 0.5) * 0.5;
    const warpY = this.perlin.noise2D(x * 0.5 + 100, y * 0.5) * 0.5;
    return this.worley.cellularCombined(x + warpX, y + warpY);
  }
}
```

---

## Noise Combination Techniques

### Blending Multiple Noise Types

```javascript
class NoiseBlender {
  constructor(seed) {
    this.perlin = new PerlinNoise(seed);
    this.simplex = new SimplexNoise(seed + 1);
    this.worley = new WorleyNoise(seed + 2);
    this.fractal = new FractalNoise(this.perlin);
  }

  // Linear blend between two noise values
  blend(noise1, noise2, factor) {
    return noise1 * (1 - factor) + noise2 * factor;
  }

  // Multiply noise values (emphasizes peaks)
  multiply(noise1, noise2) {
    return noise1 * noise2;
  }

  // Screen blend (emphasizes valleys)
  screen(noise1, noise2) {
    return 1 - (1 - noise1) * (1 - noise2);
  }

  // Overlay blend
  overlay(base, blend) {
    if (base < 0.5) {
      return 2 * base * blend;
    }
    return 1 - 2 * (1 - base) * (1 - blend);
  }

  // Use one noise to control blending of two others
  maskedBlend(noise1, noise2, maskNoise) {
    const mask = (maskNoise + 1) / 2; // Normalize to [0, 1]
    return this.blend(noise1, noise2, mask);
  }

  // Complex terrain example
  complexTerrain(x, y) {
    // Base continental shape (large scale)
    const continental = this.fractal.fbm(x * 0.002, y * 0.002, 4);

    // Mountain ridges
    const mountains = this.fractal.ridgedMultifractal(x * 0.01, y * 0.01, 6);

    // Rolling hills
    const hills = this.fractal.fbm(x * 0.02, y * 0.02, 6);

    // Detail noise
    const detail = this.fractal.fbm(x * 0.1, y * 0.1, 4) * 0.1;

    // Blend based on continental shape
    let height;
    if (continental > 0.3) {
      // Mountainous regions
      height = this.blend(hills, mountains, (continental - 0.3) / 0.7);
    } else {
      // Flat/hilly regions
      height = hills * 0.5;
    }

    return height + detail;
  }

  // Biome-based terrain
  biomeBlendedTerrain(x, y) {
    // Temperature and moisture for biome selection
    const temperature = this.fractal.fbm(x * 0.005, y * 0.005, 3);
    const moisture = this.fractal.fbm(x * 0.005 + 1000, y * 0.005, 3);

    // Different terrain types
    const desert = this.fractal.fbm(x * 0.02, y * 0.02, 4) * 0.3;
    const forest = this.fractal.fbm(x * 0.03, y * 0.03, 6) * 0.5;
    const tundra = this.fractal.ridgedMultifractal(x * 0.02, y * 0.02, 5) * 0.4;
    const tropical = this.fractal.fbm(x * 0.04, y * 0.04, 5) * 0.6;

    // Blend based on climate
    if (temperature > 0.3 && moisture < -0.2) {
      return desert;
    } else if (temperature < -0.3) {
      return tundra;
    } else if (moisture > 0.3 && temperature > 0) {
      return tropical;
    }
    return forest;
  }
}
```

### Noise Transformations

```javascript
class NoiseTransformations {
  // Terrace/step effect
  terrace(value, steps) {
    return Math.floor(value * steps) / steps;
  }

  // Smooth terrace with blending
  smoothTerrace(value, steps, blendWidth = 0.1) {
    const stepValue = Math.floor(value * steps) / steps;
    const nextStep = (Math.floor(value * steps) + 1) / steps;
    const fraction = (value * steps) % 1;

    if (fraction < blendWidth) {
      const t = fraction / blendWidth;
      const prevStep = Math.max(0, stepValue - 1 / steps);
      return this.smoothstep(prevStep, stepValue, t);
    } else if (fraction > 1 - blendWidth) {
      const t = (fraction - (1 - blendWidth)) / blendWidth;
      return this.smoothstep(stepValue, nextStep, t);
    }
    return stepValue;
  }

  smoothstep(a, b, t) {
    t = t * t * (3 - 2 * t);
    return a + (b - a) * t;
  }

  // Power curve (adjusts contrast)
  power(value, exponent) {
    return Math.pow((value + 1) / 2, exponent) * 2 - 1;
  }

  // Bilateral power (preserves sign)
  bilateralPower(value, exponent) {
    const sign = value < 0 ? -1 : 1;
    return sign * Math.pow(Math.abs(value), exponent);
  }

  // Threshold with smoothing
  smoothThreshold(value, threshold, smoothness = 0.1) {
    const low = threshold - smoothness;
    const high = threshold + smoothness;

    if (value <= low) return 0;
    if (value >= high) return 1;

    const t = (value - low) / (high - low);
    return t * t * (3 - 2 * t);
  }

  // Remap value range
  remap(value, inMin, inMax, outMin, outMax) {
    return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
  }

  // Add erosion-like detail
  erode(baseNoise, detailNoise, strength = 0.3) {
    // Detail is stronger in valleys
    const detailStrength = (1 - baseNoise) * strength;
    return baseNoise - detailNoise * detailStrength;
  }
}
```

---

## Practical Applications

### Terrain Generation

```javascript
class TerrainGenerator {
  constructor(seed, width, height) {
    this.width = width;
    this.height = height;
    this.perlin = new PerlinNoise(seed);
    this.fractal = new FractalNoise(this.perlin);
    this.worley = new WorleyNoise(seed);
    this.transforms = new NoiseTransformations();
  }

  generateHeightmap() {
    const heightmap = new Float32Array(this.width * this.height);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const nx = x / this.width;
        const ny = y / this.height;

        // Multi-scale terrain
        let height = 0;

        // Continental plates (very large scale)
        const continental = this.fractal.fbm(nx * 2, ny * 2, 3, 2.0, 0.5);

        // Mountain ranges
        const mountains = this.fractal.ridgedMultifractal(nx * 4, ny * 4, 5);

        // Hills and valleys
        const hills = this.fractal.fbm(nx * 8, ny * 8, 6);

        // Fine detail
        const detail = this.fractal.fbm(nx * 32, ny * 32, 4) * 0.1;

        // Combine layers
        height = continental * 0.4;
        height += mountains * 0.3 * Math.max(0, continental);
        height += hills * 0.2;
        height += detail;

        // Apply erosion simulation
        const erosion = this.worley.cellularEdges(nx * 16, ny * 16) * 0.05;
        height -= erosion * Math.max(0, height);

        // Normalize and store
        heightmap[y * this.width + x] = (height + 1) / 2;
      }
    }

    return heightmap;
  }

  // Generate moisture map for biomes
  generateMoistureMap() {
    const moisture = new Float32Array(this.width * this.height);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const nx = x / this.width;
        const ny = y / this.height;

        // Different seed offset for moisture
        const value = this.fractal.fbm(nx * 4 + 500, ny * 4 + 500, 5);
        moisture[y * this.width + x] = (value + 1) / 2;
      }
    }

    return moisture;
  }

  // Determine biome based on height and moisture
  getBiome(height, moisture) {
    if (height < 0.3) return 'water';
    if (height < 0.35) return 'beach';
    if (height > 0.8) return 'snow';
    if (height > 0.6) return 'mountain';

    if (moisture < 0.2) return 'desert';
    if (moisture < 0.4) return 'grassland';
    if (moisture < 0.6) return 'forest';
    return 'rainforest';
  }
}
```

### Texture Generation

```javascript
class TextureGenerator {
  constructor(seed) {
    this.perlin = new PerlinNoise(seed);
    this.simplex = new SimplexNoise(seed);
    this.worley = new WorleyNoise(seed);
    this.fractal = new FractalNoise(this.perlin);
  }

  // Wood grain texture
  woodGrain(x, y, rings = 20, turbulence = 0.1) {
    // Add turbulence to coordinates
    const turbX = this.fractal.turbulence(x * 4, y * 4, 4) * turbulence;
    const turbY = this.fractal.turbulence(x * 4 + 100, y * 4, 4) * turbulence;

    // Calculate distance from center with turbulence
    const distance = Math.sqrt(
      Math.pow(x + turbX - 0.5, 2) +
      Math.pow((y + turbY - 0.5) * 0.5, 2)
    );

    // Create ring pattern
    const ring = Math.sin(distance * rings * Math.PI * 2);

    // Add fine detail
    const detail = this.fractal.fbm(x * 50, y * 50, 3) * 0.1;

    return (ring + 1) / 2 + detail;
  }

  // Marble texture
  marble(x, y, veins = 5, turbulenceScale = 1.0) {
    // Create vein pattern with turbulence
    const turbulence = this.fractal.turbulence(x * 3, y * 3, 6);
    const pattern = Math.sin(x * veins + turbulence * turbulenceScale * 5);

    // Add detail
    const detail = this.fractal.fbm(x * 20, y * 20, 4) * 0.05;

    return (pattern + 1) / 2 + detail;
  }

  // Cloud texture
  clouds(x, y, coverage = 0.5) {
    // Base cloud shape
    const cloudShape = this.fractal.fbm(x * 2, y * 2, 6, 2.0, 0.5);

    // Add billowy detail
    const detail = this.fractal.fbm(x * 8, y * 8, 4);

    // Combine and apply coverage threshold
    let cloud = (cloudShape + detail * 0.3 + 1) / 2;

    // Apply coverage (0 = no clouds, 1 = full coverage)
    cloud = Math.max(0, cloud - (1 - coverage)) / coverage;

    return Math.min(1, cloud);
  }

  // Fire/plasma effect
  plasma(x, y, time = 0) {
    // Animated turbulence
    const t1 = this.fractal.fbm(x * 3, y * 3 + time * 0.5, 4);
    const t2 = this.fractal.fbm(x * 5 + time * 0.3, y * 5, 4);
    const t3 = this.fractal.turbulence(x * 2 + time * 0.2, y * 2, 3);

    return (t1 + t2 + t3) / 3;
  }

  // Stone/rock texture
  stone(x, y) {
    // Base rock color variation
    const base = this.fractal.fbm(x * 4, y * 4, 5);

    // Cracks and fissures
    const cracks = this.worley.cellularEdges(x * 8, y * 8);

    // Mineral deposits
    const minerals = this.worley.cellularF1(x * 12, y * 12);

    return base * 0.6 + cracks * 0.25 + minerals * 0.15;
  }

  // Water caustics
  caustics(x, y, time = 0) {
    // Animated Worley noise
    const w1 = this.worley.cellularF1(x * 6 + time * 0.1, y * 6);
    const w2 = this.worley.cellularF1(x * 6 - time * 0.15, y * 6 + time * 0.1);

    // Combine for interference pattern
    const caustic = Math.min(w1, w2);
    return 1 - caustic * caustic;
  }
}
```

### 3D Applications

```javascript
class VolumetricNoise {
  constructor(seed) {
    this.perlin3D = new PerlinNoise3D(seed);
  }

  // 3D FBM
  fbm3D(x, y, z, octaves = 6) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.perlin3D.noise3D(
        x * frequency,
        y * frequency,
        z * frequency
      ) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return total / maxValue;
  }

  // Density field for clouds/fog
  cloudDensity(x, y, z, cloudBase = 0.3, cloudTop = 0.7) {
    // Height falloff
    let density = 0;
    if (y >= cloudBase && y <= cloudTop) {
      const heightFactor = 1 - Math.abs((y - (cloudBase + cloudTop) / 2) /
                                        ((cloudTop - cloudBase) / 2));
      density = heightFactor;
    }

    // Cloud shape from noise
    const shape = this.fbm3D(x * 2, y * 4, z * 2, 5);

    // Combine
    density *= Math.max(0, shape + 0.3);

    return Math.max(0, Math.min(1, density));
  }

  // Cave system generation
  caveNoise(x, y, z, threshold = 0.0) {
    // Primary cave channels
    const cave1 = this.fbm3D(x * 3, y * 3, z * 3, 4);

    // Secondary channels at different angle
    const cave2 = this.fbm3D(x * 4 + 100, y * 2, z * 4, 4);

    // Worm-like caves
    const worm = this.fbm3D(x * 5, y * 1, z * 5, 3);

    // Combine
    const combined = Math.max(cave1, cave2 * 0.7, worm * 0.5);

    return combined > threshold ? 1 : 0;
  }

  // Animated 3D noise (using z as time)
  animatedNoise2D(x, y, time) {
    return this.fbm3D(x, y, time, 6);
  }
}
```

---

## Performance Optimization

### Caching and Lookup Tables

```javascript
class OptimizedNoise {
  constructor(seed, cacheSize = 256) {
    this.baseNoise = new PerlinNoise(seed);
    this.cacheSize = cacheSize;

    // Pre-calculate gradient lookup tables
    this.buildLookupTables();
  }

  buildLookupTables() {
    // Pre-calculate sine/cosine tables
    this.sinTable = new Float32Array(this.cacheSize);
    this.cosTable = new Float32Array(this.cacheSize);

    for (let i = 0; i < this.cacheSize; i++) {
      const angle = (i / this.cacheSize) * Math.PI * 2;
      this.sinTable[i] = Math.sin(angle);
      this.cosTable[i] = Math.cos(angle);
    }

    // Pre-calculate fade curve
    this.fadeTable = new Float32Array(this.cacheSize);
    for (let i = 0; i < this.cacheSize; i++) {
      const t = i / (this.cacheSize - 1);
      this.fadeTable[i] = t * t * t * (t * (t * 6 - 15) + 10);
    }
  }

  fastFade(t) {
    const index = Math.floor(t * (this.cacheSize - 1));
    return this.fadeTable[Math.min(index, this.cacheSize - 1)];
  }
}

// Tile-based noise for infinite worlds
class TiledNoiseCache {
  constructor(noiseGenerator, tileSize = 64) {
    this.noise = noiseGenerator;
    this.tileSize = tileSize;
    this.cache = new Map();
    this.maxCacheSize = 100;
  }

  getTileKey(tileX, tileY) {
    return `${tileX},${tileY}`;
  }

  getTile(tileX, tileY) {
    const key = this.getTileKey(tileX, tileY);

    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Generate new tile
    const tile = new Float32Array(this.tileSize * this.tileSize);
    const startX = tileX * this.tileSize;
    const startY = tileY * this.tileSize;

    for (let y = 0; y < this.tileSize; y++) {
      for (let x = 0; x < this.tileSize; x++) {
        tile[y * this.tileSize + x] = this.noise.noise2D(
          (startX + x) * 0.01,
          (startY + y) * 0.01
        );
      }
    }

    // Cache management
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, tile);
    return tile;
  }

  getNoise(worldX, worldY) {
    const tileX = Math.floor(worldX / this.tileSize);
    const tileY = Math.floor(worldY / this.tileSize);
    const localX = worldX - tileX * this.tileSize;
    const localY = worldY - tileY * this.tileSize;

    const tile = this.getTile(tileX, tileY);
    return tile[Math.floor(localY) * this.tileSize + Math.floor(localX)];
  }
}
```

### Web Worker Implementation

```javascript
// noise-worker.js
self.onmessage = function(e) {
  const { type, params } = e.data;

  switch (type) {
    case 'generateHeightmap':
      const heightmap = generateHeightmap(params);
      self.postMessage({ type: 'heightmap', data: heightmap });
      break;

    case 'generateChunk':
      const chunk = generateChunk(params);
      self.postMessage({ type: 'chunk', data: chunk });
      break;
  }
};

function generateHeightmap({ width, height, seed, scale }) {
  const noise = new PerlinNoise(seed);
  const fractal = new FractalNoise(noise);
  const data = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[y * width + x] = fractal.fbm(
        x * scale,
        y * scale,
        6
      );
    }
  }

  return data;
}

// Main thread usage
class NoiseWorkerPool {
  constructor(workerCount = navigator.hardwareConcurrency || 4) {
    this.workers = [];
    this.taskQueue = [];
    this.availableWorkers = [];

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker('noise-worker.js');
      worker.onmessage = (e) => this.handleWorkerMessage(worker, e);
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  generateHeightmap(params) {
    return new Promise((resolve) => {
      this.taskQueue.push({
        type: 'generateHeightmap',
        params,
        resolve
      });
      this.processQueue();
    });
  }

  processQueue() {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue.shift();
      const worker = this.availableWorkers.pop();
      worker.currentTask = task;
      worker.postMessage({ type: task.type, params: task.params });
    }
  }

  handleWorkerMessage(worker, e) {
    const task = worker.currentTask;
    task.resolve(e.data.data);
    this.availableWorkers.push(worker);
    this.processQueue();
  }
}
```

### GPU-Based Noise (WebGL Shader)

```glsl
// Vertex Shader
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}

// Fragment Shader
precision highp float;

varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_scale;
uniform int u_octaves;

// Permutation table (passed as texture or uniform array)
uniform sampler2D u_permTexture;

// Hash function
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)),
           dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Gradient noise
float gradientNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// FBM
float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    value += amplitude * gradientNoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value;
}

// Ridged FBM
float ridgedFBM(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  float weight = 1.0;

  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    float signal = 1.0 - abs(gradientNoise(p * frequency));
    signal *= signal * weight;
    weight = clamp(signal * 2.0, 0.0, 1.0);
    value += signal * amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value;
}

void main() {
  vec2 uv = v_texCoord * u_scale;

  // Generate terrain height
  float height = fbm(uv, u_octaves);

  // Add ridged mountains
  float mountains = ridgedFBM(uv * 2.0, u_octaves);
  height = mix(height, mountains, 0.3);

  // Color based on height
  vec3 color;
  if (height < 0.3) {
    color = vec3(0.1, 0.3, 0.6); // Water
  } else if (height < 0.35) {
    color = vec3(0.76, 0.7, 0.5); // Beach
  } else if (height < 0.6) {
    color = vec3(0.2, 0.5, 0.2); // Grass
  } else if (height < 0.8) {
    color = vec3(0.5, 0.4, 0.3); // Mountain
  } else {
    color = vec3(0.9, 0.9, 0.95); // Snow
  }

  gl_FragColor = vec4(color, 1.0);
}
```

---

## Interview Questions

### Fundamental Concepts

**Q1: What is the difference between random noise and coherent noise?**

Random noise produces completely independent values for each sample point, resulting in harsh, disconnected patterns (like TV static). Coherent noise ensures that nearby points have similar values, creating smooth gradients and natural-looking patterns. Coherent noise is also deterministic - the same input always produces the same output.

**Q2: Explain the key steps in generating Perlin noise.**

1. Define a grid of integer coordinates
2. Assign pseudo-random gradient vectors to each grid point using a permutation table
3. For any sample point, identify the surrounding grid cell
4. Calculate dot products between gradient vectors and distance vectors to each corner
5. Interpolate the dot products using a smooth interpolation function (typically 6t^5 - 15t^4 + 10t^3)
6. Return the blended value

**Q3: Why was Simplex noise developed as an alternative to Perlin noise?**

Simplex noise addresses several limitations of Perlin noise:
- **Computational efficiency**: O(n^2) vs O(2^n) for higher dimensions
- **Fewer directional artifacts**: Uses simplexes instead of hypercubes
- **Better scaling**: More efficient for 3D and higher dimensions
- **Smoother appearance**: Less visible grid alignment

### Practical Applications

**Q4: How do you combine multiple octaves of noise for terrain generation?**

```javascript
function fbm(x, y, octaves, lacunarity, persistence) {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += noise(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;  // Typically 0.5
    frequency *= lacunarity;   // Typically 2.0
  }

  return total / maxValue;
}
```

Octaves add detail at different scales. Higher octaves contribute finer detail with lower amplitude.

**Q5: What is domain warping and when would you use it?**

Domain warping distorts the input coordinates using noise before sampling the final noise value:

```javascript
function domainWarp(x, y) {
  const warpX = noise(x, y) * warpStrength;
  const warpY = noise(x + offset, y) * warpStrength;
  return noise(x + warpX, y + warpY);
}
```

Use cases:
- Creating organic, flowing patterns
- Simulating erosion effects
- Generating alien/fantasy landscapes
- Adding variation to repetitive patterns

**Q6: How does Worley noise differ from Perlin noise, and what is it used for?**

Worley noise calculates distances to randomly distributed feature points rather than interpolating gradients. It produces cell-like patterns.

**Key differences:**
- Perlin: Gradient-based, produces smooth waves
- Worley: Distance-based, produces cellular patterns

**Common applications:**
- Stone and rock textures
- Biological cell structures
- Cracked surfaces
- Water caustics
- Voronoi-based terrain features

### Performance and Optimization

**Q7: What are the main strategies for optimizing noise generation in real-time applications?**

1. **Caching**: Pre-compute noise values for tiles/chunks
2. **LOD (Level of Detail)**: Use fewer octaves for distant terrain
3. **GPU computation**: Move noise generation to shaders
4. **Worker threads**: Use Web Workers for background generation
5. **Lookup tables**: Pre-calculate expensive functions (fade curves, trigonometry)
6. **Spatial data structures**: Only generate visible/needed regions

**Q8: How would you implement infinite procedural terrain?**

```javascript
class InfiniteTerrain {
  constructor(chunkSize, viewDistance) {
    this.chunkSize = chunkSize;
    this.viewDistance = viewDistance;
    this.loadedChunks = new Map();
    this.noiseGenerator = new PerlinNoise(seed);
  }

  update(playerPosition) {
    const playerChunkX = Math.floor(playerPosition.x / this.chunkSize);
    const playerChunkY = Math.floor(playerPosition.y / this.chunkSize);

    // Load chunks within view distance
    for (let dx = -this.viewDistance; dx <= this.viewDistance; dx++) {
      for (let dy = -this.viewDistance; dy <= this.viewDistance; dy++) {
        const chunkX = playerChunkX + dx;
        const chunkY = playerChunkY + dy;
        const key = `${chunkX},${chunkY}`;

        if (!this.loadedChunks.has(key)) {
          this.loadChunk(chunkX, chunkY);
        }
      }
    }

    // Unload distant chunks
    this.unloadDistantChunks(playerChunkX, playerChunkY);
  }
}
```

### Key Points Summary

```
1. Coherent noise vs random noise: Coherent has spatial continuity
2. Perlin noise: Grid + gradients + interpolation
3. Simplex noise: More efficient, fewer artifacts
4. FBM: Multiple octaves for multi-scale detail
5. Worley noise: Distance-based cellular patterns
6. Domain warping: Distort coordinates for organic effects
7. Optimization: Caching, GPU, LOD, workers
8. Applications: Terrain, textures, clouds, caves
```

---

## Further Reading

### Books
- "Texturing and Modeling: A Procedural Approach" by Ebert et al.
- "GPU Gems" series (NVIDIA) - Chapters on noise and procedural generation
- "Real-Time Rendering" by Akenine-Moller et al.

### Online Resources
- [The Book of Shaders - Noise](https://thebookofshaders.com/11/)
- [Inigo Quilez's Articles](https://iquilezles.org/articles/)
- [Red Blob Games - Procedural Generation](https://www.redblobgames.com/)

### Libraries
- **JavaScript**: simplex-noise, noisejs, libnoise
- **Unity**: Unity.Mathematics noise functions
- **Unreal Engine**: Built-in noise nodes in Material Editor

---

## Summary

Noise algorithms form the backbone of procedural generation in games and computer graphics. Understanding the progression from simple random values to coherent noise, and from single-layer noise to complex fractal combinations, enables developers to create infinitely varied, natural-looking content.

Key takeaways:

1. **Start with the fundamentals**: Understand how Perlin and Simplex noise work before using libraries
2. **Layer intelligently**: Use FBM and other combination techniques to add detail at multiple scales
3. **Choose the right noise type**: Perlin for smooth gradients, Worley for cellular patterns
4. **Optimize for your platform**: Consider GPU computation, caching, and chunking for real-time applications
5. **Experiment with transformations**: Domain warping, ridged noise, and other modifications create unique effects

With these tools and techniques, you can generate everything from realistic terrain to abstract textures, all from mathematical functions rather than hand-crafted assets.
