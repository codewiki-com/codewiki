---
title: Simplex 噪声算法
description: 掌握 Simplex 噪声实现程序化生成，相比 Perlin 噪声具有更好的性能和视觉质量
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - simplex 噪声
  - 程序化生成
  - 噪声
  - 地形
  - 纹理
  - 算法
status: imported
origin: old/src/content/docs/gamedev/simplex-noise.zh.md
divergence: 0.232
issues:
  - h1-in-body
legacy:
  category: GameDev
  subcategory: Procedural Generation
  order: 55
  lastUpdated: 2026-01-22
---

Simplex 噪声由 Ken Perlin 于 2001 年发明，是对经典 Perlin 噪声的改进。它提供更好的视觉质量、更少的方向性伪影，以及在更高维度下的优越性能。

## 理解 Simplex 噪声

### 相比 Perlin 噪声的优势

Simplex 噪声解决了经典 Perlin 噪声的几个局限性：

1. **更低的计算复杂度**：O(n^2) vs O(2^n)（n 为维度）
2. **更少的方向性伪影**：使用单纯形而非超立方体
3. **定义良好的梯度**：无需插值函数
4. **更好的视觉各向同性**：在所有方向上外观更均匀

### 单纯形概念

单纯形是能够平铺 n 维空间的最简单形状：
- 1D：线段（2 个顶点）
- 2D：等边三角形（3 个顶点）
- 3D：四面体（4 个顶点）
- 4D：五胞体（5 个顶点）

```typescript
// 单纯形顶点数
const SIMPLEX_VERTICES: Record<number, number> = {
  1: 2,  // 线
  2: 3,  // 三角形
  3: 4,  // 四面体
  4: 5   // 五胞体
};
```

## 2D Simplex 噪声实现

### 核心算法

```typescript
class SimplexNoise2D {
  // 2D 的倾斜因子
  private static readonly F2 = 0.5 * (Math.sqrt(3) - 1);
  private static readonly G2 = (3 - Math.sqrt(3)) / 6;

  // 2D 的梯度向量
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
    // 创建置换表
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // 使用种子打乱
    const random = this.seededRandom(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    // 复制以实现无缝环绕
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

    // 倾斜输入空间以确定我们在哪个单纯形单元中
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    // 反向倾斜以在 (x,y) 空间中找到单元原点
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;

    // 相对于单元原点的位置
    const x0 = x - X0;
    const y0 = y - Y0;

    // 确定我们在哪个单纯形（三角形）中
    // 如果 x0 > y0，我们在下三角形中，否则在上三角形中
    let i1: number, j1: number;
    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }

    // 第二和第三角的偏移
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    // 梯度查找的哈希坐标
    const ii = i & 255;
    const jj = j & 255;

    // 计算每个角的贡献
    let n0 = 0, n1 = 0, n2 = 0;

    // 角 0
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      const gi0 = this.permMod12[ii + this.perm[jj]] % 8;
      t0 *= t0;
      n0 = t0 * t0 * this.dot2(GRAD2[gi0], x0, y0);
    }

    // 角 1
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]] % 8;
      t1 *= t1;
      n1 = t1 * t1 * this.dot2(GRAD2[gi1], x1, y1);
    }

    // 角 2
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]] % 8;
      t2 *= t2;
      n2 = t2 * t2 * this.dot2(GRAD2[gi2], x2, y2);
    }

    // 缩放到 [-1, 1]
    return 70 * (n0 + n1 + n2);
  }

  private dot2(grad: [number, number], x: number, y: number): number {
    return grad[0] * x + grad[1] * y;
  }
}
```

## 3D Simplex 噪声

```typescript
class SimplexNoise3D {
  // 3D 的倾斜因子
  private static readonly F3 = 1 / 3;
  private static readonly G3 = 1 / 6;

  // 3D 的梯度向量
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

    // 倾斜输入空间
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);

    // 反向倾斜
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;

    // 相对于单元原点的位置
    const x0 = x - X0;
    const y0 = y - Y0;
    const z0 = z - Z0;

    // 确定我们在哪个单纯形（四面体）中
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

    // 角的偏移
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;

    // 哈希坐标
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    // 计算角的贡献
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

    // 缩放到 [-1, 1]
    return 32 * (n0 + n1 + n2 + n3);
  }

  private dot3(grad: [number, number, number], x: number, y: number, z: number): number {
    return grad[0] * x + grad[1] * y + grad[2] * z;
  }
}
```

## 分形噪声 (fBm)

分数布朗运动结合多个八度的噪声以获得更丰富的细节。

```typescript
class FractalNoise {
  private noise2D: SimplexNoise2D;
  private noise3D: SimplexNoise3D;

  constructor(seed: number = 0) {
    this.noise2D = new SimplexNoise2D(seed);
    this.noise3D = new SimplexNoise3D(seed);
  }

  /**
   * 2D 分数布朗运动
   * @param x - X 坐标
   * @param y - Y 坐标
   * @param octaves - 噪声层数
   * @param lacunarity - 每个八度的频率乘数（通常为 2.0）
   * @param persistence - 每个八度的振幅乘数（通常为 0.5）
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
   * 3D 分数布朗运动
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
   * 脊状多重分形噪声 - 创建脊状特征
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
   * 湍流 - 噪声的绝对值创建起伏的图案
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

## 域扭曲

域扭曲使用噪声来扭曲输入坐标，创建更有机的图案。

```typescript
class DomainWarping {
  private noise: FractalNoise;

  constructor(seed: number = 0) {
    this.noise = new FractalNoise(seed);
  }

  /**
   * 单层域扭曲
   */
  warp2D(
    x: number,
    y: number,
    warpStrength: number = 4,
    octaves: number = 6
  ): number {
    // 计算扭曲偏移
    const qx = this.noise.fbm2D(x, y, octaves);
    const qy = this.noise.fbm2D(x + 5.2, y + 1.3, octaves);

    // 应用扭曲并采样噪声
    return this.noise.fbm2D(
      x + warpStrength * qx,
      y + warpStrength * qy,
      octaves
    );
  }

  /**
   * 双层域扭曲以获得更复杂的图案
   */
  doubleWarp2D(
    x: number,
    y: number,
    warpStrength1: number = 4,
    warpStrength2: number = 4,
    octaves: number = 6
  ): number {
    // 第一扭曲层
    const qx = this.noise.fbm2D(x, y, octaves);
    const qy = this.noise.fbm2D(x + 5.2, y + 1.3, octaves);

    // 第二扭曲层
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

    // 最终采样
    return this.noise.fbm2D(
      x + warpStrength2 * rx,
      y + warpStrength2 * ry,
      octaves
    );
  }

  /**
   * 时变域扭曲用于动画
   */
  animatedWarp2D(
    x: number,
    y: number,
    time: number,
    warpStrength: number = 4,
    octaves: number = 6
  ): number {
    // 动画扭曲偏移位置
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

## 实际应用

### 地形生成

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

        // 使用 fBm 的基础地形
        let elevation = this.noise.fbm2D(nx, ny, 8, 2, 0.5);

        // 添加山脊
        const ridgeNoise = this.noise.ridged2D(nx * 2, ny * 2, 4);
        elevation = elevation * 0.7 + ridgeNoise * 0.3;

        // 应用域扭曲以获得更有机的形状
        const warpedElevation = this.warp.warp2D(nx, ny, 2, 4);
        elevation = elevation * 0.8 + warpedElevation * 0.2;

        // 归一化到 [0, 1]
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
    const biomeMap = new Float32Array(width * height * 2); // 温度、湿度

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nx = x * scale;
        const ny = y * scale;
        const index = (y * width + x) * 2;

        // 温度随纬度和噪声变化
        const latitudeEffect = 1 - Math.abs(y / height - 0.5) * 2;
        const tempNoise = this.noise.fbm2D(nx, ny, 4);
        biomeMap[index] = latitudeEffect * 0.7 + (tempNoise + 1) * 0.15;

        // 来自噪声的湿度
        biomeMap[index + 1] = (this.noise.fbm2D(nx + 100, ny + 100, 4) + 1) * 0.5;
      }
    }

    return biomeMap;
  }
}
```

### 纹理生成

```typescript
class ProceduralTextures {
  private noise: FractalNoise;
  private warp: DomainWarping;

  constructor(seed: number = 0) {
    this.noise = new FractalNoise(seed);
    this.warp = new DomainWarping(seed);
  }

  /**
   * 生成大理石纹理
   */
  marble(x: number, y: number, scale: number = 0.1): number {
    const turbulence = this.noise.turbulence2D(x * scale, y * scale, 6);
    return Math.sin(x * 0.1 + turbulence * 5);
  }

  /**
   * 生成木纹纹理
   */
  wood(x: number, y: number, scale: number = 0.1): number {
    const noise = this.noise.fbm2D(x * scale, y * scale, 4);
    const distance = Math.sqrt(x * x + y * y) * 0.1 + noise * 2;
    return Math.sin(distance * 20) * 0.5 + 0.5;
  }

  /**
   * 生成云彩纹理
   */
  clouds(x: number, y: number, time: number = 0, scale: number = 0.01): number {
    // 使用动画域扭曲实现移动的云彩
    const warped = this.warp.animatedWarp2D(x * scale, y * scale, time, 2, 6);

    // 阈值处理以获得云彩形状
    return Math.max(0, warped * 1.5);
  }

  /**
   * 生成水焦散图案
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

    // 通过组合和阈值处理创建焦散效果
    const combined = Math.abs(n1 - n2);
    return Math.pow(1 - combined, 3);
  }

  /**
   * 生成火焰/等离子效果
   */
  fire(x: number, y: number, time: number = 0, scale: number = 0.02): number {
    // 向上移动的噪声
    const n1 = this.noise.turbulence2D(
      x * scale,
      y * scale - time * 2,
      6
    );

    // 基于高度的衰减
    const heightFactor = Math.max(0, 1 - y * 0.01);

    return n1 * heightFactor;
  }
}
```

### 使用 3D 噪声的洞穴生成

```typescript
class CaveGenerator {
  private noise: SimplexNoise3D;

  threshold: number = 0.3;
  scale: number = 0.05;

  constructor(seed: number = 0) {
    this.noise = new SimplexNoise3D(seed);
  }

  /**
   * 检查位置是实体还是空气
   */
  isSolid(x: number, y: number, z: number): boolean {
    const density = this.getDensity(x, y, z);
    return density > this.threshold;
  }

  /**
   * 获取密度值以实现平滑过渡
   */
  getDensity(x: number, y: number, z: number): number {
    // 基础噪声
    let density = this.fbm3D(x * this.scale, y * this.scale, z * this.scale, 4);

    // 在特定深度更容易形成洞穴
    const depthFactor = Math.sin(y * 0.1) * 0.2;
    density += depthFactor;

    // 添加蠕虫状隧道
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
   * 生成蠕虫状洞穴隧道
   */
  private wormCaves(x: number, y: number, z: number): number {
    const wormScale = 0.02;
    const nx = this.noise.noise(x * wormScale, y * wormScale, z * wormScale);
    const ny = this.noise.noise(x * wormScale + 100, y * wormScale, z * wormScale);

    // 创建管状结构
    const distance = Math.sqrt(nx * nx + ny * ny);
    const wormRadius = 0.3;

    return distance < wormRadius ? -1 : 0;
  }

  /**
   * 生成一个洞穴数据块
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

## GPU 实现 (GLSL)

```glsl
// 用于着色器的 GLSL Simplex 噪声

// 置换多项式
vec4 permute(vec4 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

// 2D Simplex 噪声
float snoise(vec2 v) {
    const vec4 C = vec4(
        0.211324865405187,   // (3.0 - sqrt(3.0)) / 6.0
        0.366025403784439,   // 0.5 * (sqrt(3.0) - 1.0)
        -0.577350269189626,  // -1.0 + 2.0 * C.x
        0.024390243902439    // 1.0 / 41.0
    );

    // 第一个角
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);

    // 其他角
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    // 置换
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));

    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;

    // 梯度
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    // 计算最终噪声值
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// 3D Simplex 噪声
float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // 第一个角
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    // 其他角
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    // 置换
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // 梯度
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

    // 归一化梯度
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // 混合最终噪声值
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// 使用 simplex 噪声的 fBm
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

## 最佳实践

### 1. 性能优化

```typescript
class OptimizedNoise {
  // 预计算昂贵的操作
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

  // 使用查找表进行三角函数
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

// 使用类型化数组以获得更好的性能
class TypedNoise {
  // 在类型化数组中存储中间结果
  private tempBuffer: Float32Array;

  constructor(maxSize: number) {
    this.tempBuffer = new Float32Array(maxSize);
  }

  // 批量生成噪声值
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

### 2. 无缝平铺

```typescript
class TileableNoise {
  private noise: SimplexNoise2D;

  constructor(seed: number = 0) {
    this.noise = new SimplexNoise2D(seed);
  }

  /**
   * 使用 4D 噪声投影生成可平铺噪声
   * 将 2D 坐标映射到 4D 空间中的环面上
   */
  tileable2D(
    x: number,
    y: number,
    width: number,
    height: number
  ): number {
    // 映射到环面坐标
    const s = x / width;
    const t = y / height;

    const nx = Math.cos(s * Math.PI * 2);
    const ny = Math.sin(s * Math.PI * 2);
    const nz = Math.cos(t * Math.PI * 2);
    const nw = Math.sin(t * Math.PI * 2);

    // 使用 4D 噪声（需要 4D 实现）
    // 这里我们用组合的 2D 样本近似
    const n1 = this.noise.noise(nx, ny);
    const n2 = this.noise.noise(nz + 100, nw + 100);
    return (n1 + n2) * 0.5;
  }
}
```

### 3. 导数计算

```typescript
class NoiseWithDerivatives {
  private noise: SimplexNoise2D;

  constructor(seed: number = 0) {
    this.noise = new SimplexNoise2D(seed);
  }

  /**
   * 计算噪声值和偏导数
   * 用于法线贴图生成
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
   * 从噪声生成法线贴图
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

## 总结

Simplex 噪声提供高效、高质量的程序化生成：

- **更好的性能**：比 Perlin 噪声更快，尤其是在更高维度
- **更少的伪影**：由于基于单纯形的插值
- **fBm** 组合八度以获得自然外观的细节
- **域扭曲** 创建有机的、流动的图案
- **广泛应用**：包括地形、纹理、洞穴和效果

理解底层数学使得能够针对特定用例进行定制。

## 延伸阅读

- Ken Perlin 的原始 Simplex 噪声论文
- 《Texturing & Modeling: A Procedural Approach》
- GPU Gems 关于程序化生成的章节
- Inigo Quilez 关于噪声和着色器的文章
- 程序化内容生成的研究论文
