---
title: 噪声算法与程序化生成
description: 掌握程序化生成核心算法：Perlin噪声、Simplex噪声和分形噪声
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - 噪声
  - Perlin
  - 程序化生成
  - 算法
status: imported
origin: old/src/content/docs/gamedev/perlin-noise.zh.md
divergence: 0.122
issues: []
legacy:
  category: GameDev
  subcategory: Procedural
  order: 33
  lastUpdated: 2026-01-07
---

噪声算法是程序化生成的核心技术，广泛应用于游戏开发、计算机图形学和视觉特效领域。从《我的世界》的无限地形到电影中的逼真云层，噪声算法都扮演着关键角色。本文将深入探讨各类噪声算法的原理、实现和应用。

## 随机 vs 噪声：理解本质区别

### 纯随机的局限性

初学者常常误以为随机数可以用于生成自然纹理和地形，但实际效果往往令人失望：

```javascript
// 使用纯随机生成高度图
function generateRandomHeightmap(width, height) {
  const heightmap = [];
  for (let y = 0; y < height; y++) {
    heightmap[y] = [];
    for (let x = 0; x < width; x++) {
      heightmap[y][x] = Math.random(); // 完全随机
    }
  }
  return heightmap;
}
```

纯随机产生的结果缺乏连续性，相邻像素之间没有关联，看起来像电视静态雪花。这与自然界中的地形、云层等完全不同——自然现象通常具有**空间连贯性**。

### 噪声的核心特性

噪声函数的关键在于**连续性**和**可重复性**：

1. **连续性（Coherence）**：相邻输入产生相似输出，形成平滑过渡
2. **确定性（Deterministic）**：相同输入始终产生相同输出
3. **伪随机性（Pseudo-random）**：看起来随机，但可控可预测
4. **无周期性（Aperiodic）**：不会出现明显的重复图案

```javascript
// 噪声函数的基本特性
noise(1.0)  ≈ noise(1.001)  // 连续性：微小变化产生微小差异
noise(5.5)  === noise(5.5)   // 确定性：相同输入相同输出
noise(x) 看起来随机          // 伪随机性
```

## Perlin 噪声：经典算法详解

Perlin 噪声由 Ken Perlin 于 1983 年发明，用于电影《Tron》的特效制作，并因此获得奥斯卡技术成就奖。

### 核心原理

Perlin 噪声的核心思想是**梯度插值**：

1. 在规则网格的每个顶点定义一个随机梯度向量
2. 对于任意输入点，计算其到周围网格顶点的向量
3. 计算这些向量与对应梯度的点积
4. 使用平滑插值函数混合这些点积值

### 一维 Perlin 噪声实现

```javascript
class Perlin1D {
  constructor(seed = 42) {
    this.permutation = this.generatePermutation(seed);
  }

  // 生成排列表用于确定性随机
  generatePermutation(seed) {
    const perm = [];
    for (let i = 0; i < 256; i++) {
      perm[i] = i;
    }
    // Fisher-Yates 洗牌算法
    let random = this.seededRandom(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    // 复制一份避免边界问题
    return [...perm, ...perm];
  }

  seededRandom(seed) {
    return function() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  // 计算梯度（一维情况下只有 +1 或 -1）
  gradient(hash) {
    return (hash & 1) === 0 ? 1 : -1;
  }

  // 平滑插值函数（改进的 Hermite 曲线）
  fade(t) {
    // 6t^5 - 15t^4 + 10t^3
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  // 线性插值
  lerp(a, b, t) {
    return a + t * (b - a);
  }

  noise(x) {
    // 获取整数部分和小数部分
    const xi = Math.floor(x) & 255;
    const xf = x - Math.floor(x);

    // 获取两个端点的梯度
    const g0 = this.gradient(this.permutation[xi]);
    const g1 = this.gradient(this.permutation[xi + 1]);

    // 计算点积（一维情况下就是梯度乘以距离）
    const d0 = g0 * xf;
    const d1 = g1 * (xf - 1);

    // 平滑插值
    const u = this.fade(xf);
    return this.lerp(d0, d1, u);
  }
}

// 使用示例
const perlin = new Perlin1D(12345);
for (let x = 0; x < 10; x += 0.1) {
  console.log(`x=${x.toFixed(1)}, noise=${perlin.noise(x).toFixed(4)}`);
}
```

### 二维 Perlin 噪声实现

```javascript
class Perlin2D {
  constructor(seed = 42) {
    this.permutation = this.generatePermutation(seed);
    // 预定义 8 个方向的梯度向量
    this.gradients = [
      [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [-1, 1], [1, -1], [-1, -1]
    ].map(([x, y]) => {
      const len = Math.sqrt(x * x + y * y);
      return [x / len, y / len]; // 归一化
    });
  }

  generatePermutation(seed) {
    const perm = [];
    for (let i = 0; i < 256; i++) perm[i] = i;
    let random = this.seededRandom(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    return [...perm, ...perm];
  }

  seededRandom(seed) {
    return function() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a, b, t) {
    return a + t * (b - a);
  }

  // 点积
  dot(grad, x, y) {
    return grad[0] * x + grad[1] * y;
  }

  noise(x, y) {
    // 获取单元格坐标
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;

    // 获取单元格内的相对位置
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    // 获取四个角的梯度索引
    const aa = this.permutation[this.permutation[xi] + yi] & 7;
    const ab = this.permutation[this.permutation[xi] + yi + 1] & 7;
    const ba = this.permutation[this.permutation[xi + 1] + yi] & 7;
    const bb = this.permutation[this.permutation[xi + 1] + yi + 1] & 7;

    // 计算四个角的贡献
    const n00 = this.dot(this.gradients[aa], xf, yf);
    const n01 = this.dot(this.gradients[ab], xf, yf - 1);
    const n10 = this.dot(this.gradients[ba], xf - 1, yf);
    const n11 = this.dot(this.gradients[bb], xf - 1, yf - 1);

    // 平滑插值
    const u = this.fade(xf);
    const v = this.fade(yf);

    // 双线性插值
    const nx0 = this.lerp(n00, n10, u);
    const nx1 = this.lerp(n01, n11, u);
    return this.lerp(nx0, nx1, v);
  }
}
```

### 三维 Perlin 噪声

```javascript
class Perlin3D {
  constructor(seed = 42) {
    this.permutation = this.generatePermutation(seed);
    // 12 个梯度方向（指向正十二面体的边）
    this.gradients = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];
  }

  generatePermutation(seed) {
    const perm = [];
    for (let i = 0; i < 256; i++) perm[i] = i;
    let random = this.seededRandom(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    return [...perm, ...perm];
  }

  seededRandom(seed) {
    return function() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a, b, t) {
    return a + t * (b - a);
  }

  dot(grad, x, y, z) {
    return grad[0] * x + grad[1] * y + grad[2] * z;
  }

  noise(x, y, z) {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);

    const u = this.fade(xf);
    const v = this.fade(yf);
    const w = this.fade(zf);

    // 获取 8 个角的哈希值
    const aaa = this.permutation[this.permutation[this.permutation[xi] + yi] + zi] % 12;
    const aab = this.permutation[this.permutation[this.permutation[xi] + yi] + zi + 1] % 12;
    const aba = this.permutation[this.permutation[this.permutation[xi] + yi + 1] + zi] % 12;
    const abb = this.permutation[this.permutation[this.permutation[xi] + yi + 1] + zi + 1] % 12;
    const baa = this.permutation[this.permutation[this.permutation[xi + 1] + yi] + zi] % 12;
    const bab = this.permutation[this.permutation[this.permutation[xi + 1] + yi] + zi + 1] % 12;
    const bba = this.permutation[this.permutation[this.permutation[xi + 1] + yi + 1] + zi] % 12;
    const bbb = this.permutation[this.permutation[this.permutation[xi + 1] + yi + 1] + zi + 1] % 12;

    // 计算 8 个角的贡献
    const n000 = this.dot(this.gradients[aaa], xf, yf, zf);
    const n001 = this.dot(this.gradients[aab], xf, yf, zf - 1);
    const n010 = this.dot(this.gradients[aba], xf, yf - 1, zf);
    const n011 = this.dot(this.gradients[abb], xf, yf - 1, zf - 1);
    const n100 = this.dot(this.gradients[baa], xf - 1, yf, zf);
    const n101 = this.dot(this.gradients[bab], xf - 1, yf, zf - 1);
    const n110 = this.dot(this.gradients[bba], xf - 1, yf - 1, zf);
    const n111 = this.dot(this.gradients[bbb], xf - 1, yf - 1, zf - 1);

    // 三线性插值
    const nx00 = this.lerp(n000, n100, u);
    const nx01 = this.lerp(n001, n101, u);
    const nx10 = this.lerp(n010, n110, u);
    const nx11 = this.lerp(n011, n111, u);

    const nxy0 = this.lerp(nx00, nx10, v);
    const nxy1 = this.lerp(nx01, nx11, v);

    return this.lerp(nxy0, nxy1, w);
  }
}
```

## Simplex 噪声：Perlin 的进化版

Ken Perlin 在 2001 年提出了 Simplex 噪声，解决了 Perlin 噪声的一些缺陷。

### 为什么需要 Simplex 噪声

Perlin 噪声存在以下问题：

1. **计算复杂度高**：n 维需要 2^n 个角点
2. **方向性伪影**：在某些角度可见明显的轴向纹理
3. **复杂度随维度指数增长**：4D、5D 计算代价极高

Simplex 噪声使用**单形**（simplex）代替超立方体：

| 维度 | Perlin 顶点数 | Simplex 顶点数 |
|------|--------------|---------------|
| 2D   | 4            | 3（三角形）    |
| 3D   | 8            | 4（四面体）    |
| 4D   | 16           | 5             |
| nD   | 2^n          | n+1           |

### 二维 Simplex 噪声实现

```javascript
class Simplex2D {
  constructor(seed = 42) {
    this.permutation = this.generatePermutation(seed);
    // 梯度向量
    this.grad3 = [
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ];
    // 倾斜因子
    this.F2 = 0.5 * (Math.sqrt(3) - 1);
    this.G2 = (3 - Math.sqrt(3)) / 6;
  }

  generatePermutation(seed) {
    const perm = [];
    for (let i = 0; i < 256; i++) perm[i] = i;
    let random = this.seededRandom(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    return [...perm, ...perm];
  }

  seededRandom(seed) {
    return function() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  dot(grad, x, y) {
    return grad[0] * x + grad[1] * y;
  }

  noise(x, y) {
    // 将坐标倾斜到单形网格
    const s = (x + y) * this.F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    // 将单形坐标转回标准坐标
    const t = (i + j) * this.G2;
    const X0 = i - t;
    const Y0 = j - t;

    // 计算相对于第一个角的偏移
    const x0 = x - X0;
    const y0 = y - Y0;

    // 确定所在的单形（三角形）
    let i1, j1;
    if (x0 > y0) {
      i1 = 1; j1 = 0;  // 下三角形
    } else {
      i1 = 0; j1 = 1;  // 上三角形
    }

    // 计算其他两个角的偏移
    const x1 = x0 - i1 + this.G2;
    const y1 = y0 - j1 + this.G2;
    const x2 = x0 - 1 + 2 * this.G2;
    const y2 = y0 - 1 + 2 * this.G2;

    // 获取梯度索引
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.permutation[ii + this.permutation[jj]] % 8;
    const gi1 = this.permutation[ii + i1 + this.permutation[jj + j1]] % 8;
    const gi2 = this.permutation[ii + 1 + this.permutation[jj + 1]] % 8;

    // 计算每个角的贡献
    let n0, n1, n2;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
    }

    // 缩放到 [-1, 1] 范围
    return 70 * (n0 + n1 + n2);
  }
}
```

### Perlin vs Simplex 对比

| 特性 | Perlin 噪声 | Simplex 噪声 |
|------|------------|--------------|
| 计算复杂度 | O(2^n) | O(n^2) |
| 方向性伪影 | 明显 | 较少 |
| 视觉质量 | 好 | 更好 |
| 实现复杂度 | 简单 | 较复杂 |
| 专利状态 | 公开 | 曾有专利（已过期）|

## 分形噪声（FBM）：叠加的艺术

单层噪声通常过于平滑，无法模拟自然界的复杂细节。分形布朗运动（Fractal Brownian Motion, FBM）通过叠加多个不同频率的噪声层来创造丰富的细节。

### FBM 原理

FBM 的核心思想来自分形几何：自然界的许多现象在不同尺度上具有相似的结构（自相似性）。

```
FBM(x) = sum(amplitude[i] * noise(frequency[i] * x))

其中：
- frequency[i] = frequency[0] * lacunarity^i
- amplitude[i] = amplitude[0] * persistence^i
```

关键参数：
- **Octaves（八度）**：叠加的噪声层数
- **Lacunarity（空隙度）**：频率的倍增因子，通常为 2
- **Persistence（持续度）**：振幅的衰减因子，通常为 0.5

### FBM 实现

```javascript
class FBM {
  constructor(noiseFunction, options = {}) {
    this.noise = noiseFunction;
    this.octaves = options.octaves || 6;
    this.lacunarity = options.lacunarity || 2.0;
    this.persistence = options.persistence || 0.5;
    this.scale = options.scale || 1.0;
  }

  // 2D FBM
  fbm2D(x, y) {
    let total = 0;
    let frequency = this.scale;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < this.octaves; i++) {
      total += this.noise.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    return total / maxValue; // 归一化到 [-1, 1]
  }

  // 3D FBM
  fbm3D(x, y, z) {
    let total = 0;
    let frequency = this.scale;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < this.octaves; i++) {
      total += this.noise.noise(
        x * frequency,
        y * frequency,
        z * frequency
      ) * amplitude;
      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    return total / maxValue;
  }
}

// 使用示例
const perlin = new Perlin2D(42);
const fbm = new FBM(perlin, {
  octaves: 6,
  lacunarity: 2.0,
  persistence: 0.5,
  scale: 0.01
});

// 生成地形高度图
function generateTerrain(width, height) {
  const terrain = [];
  for (let y = 0; y < height; y++) {
    terrain[y] = [];
    for (let x = 0; x < width; x++) {
      terrain[y][x] = fbm.fbm2D(x, y);
    }
  }
  return terrain;
}
```

### FBM 变体：Ridge Noise（脊噪声）

用于生成山脉和山脊效果：

```javascript
class RidgeNoise {
  constructor(noiseFunction, options = {}) {
    this.noise = noiseFunction;
    this.octaves = options.octaves || 6;
    this.lacunarity = options.lacunarity || 2.0;
    this.persistence = options.persistence || 0.5;
    this.scale = options.scale || 1.0;
    this.offset = options.offset || 1.0;
  }

  ridge(value) {
    // 将值折叠，创造尖锐的脊
    return this.offset - Math.abs(value);
  }

  ridgeNoise2D(x, y) {
    let total = 0;
    let frequency = this.scale;
    let amplitude = 1;
    let maxValue = 0;
    let weight = 1;

    for (let i = 0; i < this.octaves; i++) {
      let signal = this.noise.noise(x * frequency, y * frequency);
      signal = this.ridge(signal);
      signal *= signal; // 平方增强对比
      signal *= weight;

      // 权重受前一层影响，创造层次感
      weight = Math.min(1, Math.max(0, signal * 2));

      total += signal * amplitude;
      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    return total / maxValue;
  }
}
```

### Turbulence（湍流噪声）

使用绝对值创造更剧烈的变化：

```javascript
class Turbulence {
  constructor(noiseFunction, options = {}) {
    this.noise = noiseFunction;
    this.octaves = options.octaves || 6;
    this.lacunarity = options.lacunarity || 2.0;
    this.persistence = options.persistence || 0.5;
    this.scale = options.scale || 1.0;
  }

  turbulence2D(x, y) {
    let total = 0;
    let frequency = this.scale;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < this.octaves; i++) {
      // 使用绝对值
      total += Math.abs(
        this.noise.noise(x * frequency, y * frequency)
      ) * amplitude;
      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    return total / maxValue;
  }
}
```

## Worley 噪声（细胞噪声）

Worley 噪声（也称 Voronoi 噪声或细胞噪声）基于到最近特征点的距离，能产生细胞、石头、水面等效果。

### 基本原理

1. 在空间中分布特征点（通常每个网格单元一个）
2. 对于每个采样点，找到最近的 N 个特征点
3. 使用这些距离计算噪声值

### Worley 噪声实现

```javascript
class Worley2D {
  constructor(seed = 42) {
    this.seed = seed;
  }

  // 为每个单元格生成确定性随机点
  hash(x, y) {
    let n = x * 157 + y * 113 + this.seed;
    n = (n << 13) ^ n;
    return ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 0x7fffffff;
  }

  // 获取单元格内的特征点位置
  getFeaturePoint(cellX, cellY) {
    const px = cellX + this.hash(cellX, cellY);
    const py = cellY + this.hash(cellX + 1000, cellY + 1000);
    return { x: px, y: py };
  }

  // 计算到最近特征点的距离
  noise(x, y) {
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);

    let minDist = Infinity;
    let secondMinDist = Infinity;

    // 检查 3x3 邻域
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const nx = cellX + dx;
        const ny = cellY + dy;
        const point = this.getFeaturePoint(nx, ny);

        const dist = Math.sqrt(
          (x - point.x) ** 2 + (y - point.y) ** 2
        );

        if (dist < minDist) {
          secondMinDist = minDist;
          minDist = dist;
        } else if (dist < secondMinDist) {
          secondMinDist = dist;
        }
      }
    }

    return { f1: minDist, f2: secondMinDist };
  }

  // 不同的输出模式
  f1(x, y) {
    return this.noise(x, y).f1;
  }

  f2(x, y) {
    return this.noise(x, y).f2;
  }

  f2MinusF1(x, y) {
    const { f1, f2 } = this.noise(x, y);
    return f2 - f1;
  }

  f1TimesF2(x, y) {
    const { f1, f2 } = this.noise(x, y);
    return f1 * f2;
  }
}

// 使用示例
const worley = new Worley2D(42);

// F1: 到最近点的距离 - 产生圆形细胞
// F2: 到第二近点的距离 - 更复杂的图案
// F2-F1: 产生细胞边界效果
// F1*F2: 产生更复杂的纹理
```

### 三维 Worley 噪声

```javascript
class Worley3D {
  constructor(seed = 42) {
    this.seed = seed;
  }

  hash(x, y, z) {
    let n = x * 157 + y * 113 + z * 97 + this.seed;
    n = (n << 13) ^ n;
    return ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 0x7fffffff;
  }

  getFeaturePoint(cellX, cellY, cellZ) {
    return {
      x: cellX + this.hash(cellX, cellY, cellZ),
      y: cellY + this.hash(cellX + 1000, cellY + 1000, cellZ + 1000),
      z: cellZ + this.hash(cellX + 2000, cellY + 2000, cellZ + 2000)
    };
  }

  noise(x, y, z) {
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    const cellZ = Math.floor(z);

    let minDist = Infinity;

    // 检查 3x3x3 邻域
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const point = this.getFeaturePoint(
            cellX + dx,
            cellY + dy,
            cellZ + dz
          );

          const dist = Math.sqrt(
            (x - point.x) ** 2 +
            (y - point.y) ** 2 +
            (z - point.z) ** 2
          );

          minDist = Math.min(minDist, dist);
        }
      }
    }

    return minDist;
  }
}
```

## 噪声组合技术

真实的程序化内容往往需要组合多种噪声技术。

### Domain Warping（域扭曲）

使用噪声函数扭曲另一个噪声的输入坐标：

```javascript
class DomainWarping {
  constructor(noiseFunction) {
    this.noise = noiseFunction;
  }

  // 简单域扭曲
  warp(x, y, strength = 1.0) {
    const offsetX = this.noise.noise(x, y) * strength;
    const offsetY = this.noise.noise(x + 5.2, y + 1.3) * strength;
    return this.noise.noise(x + offsetX, y + offsetY);
  }

  // 多层域扭曲（产生更有机的效果）
  multiWarp(x, y, iterations = 2, strength = 1.0) {
    let px = x;
    let py = y;

    for (let i = 0; i < iterations; i++) {
      const offsetX = this.noise.noise(px, py) * strength;
      const offsetY = this.noise.noise(px + 5.2, py + 1.3) * strength;
      px = x + offsetX;
      py = y + offsetY;
    }

    return this.noise.noise(px, py);
  }
}

// 创造类似大理石的纹理
function marbleTexture(x, y, noise) {
  const warping = new DomainWarping(noise);
  const n = warping.multiWarp(x * 0.1, y * 0.1, 3, 4.0);
  return Math.sin(x * 0.1 + n * 5);
}
```

### 噪声混合

```javascript
class NoiseMixer {
  constructor(noise1, noise2) {
    this.noise1 = noise1;
    this.noise2 = noise2;
  }

  // 线性混合
  lerp(x, y, t) {
    const n1 = this.noise1.noise(x, y);
    const n2 = this.noise2.noise(x, y);
    return n1 * (1 - t) + n2 * t;
  }

  // 使用另一个噪声作为混合因子
  noiseLerp(x, y, mixNoise) {
    const t = (mixNoise.noise(x * 0.5, y * 0.5) + 1) * 0.5;
    return this.lerp(x, y, t);
  }

  // 最大值混合
  max(x, y) {
    return Math.max(
      this.noise1.noise(x, y),
      this.noise2.noise(x, y)
    );
  }

  // 最小值混合
  min(x, y) {
    return Math.min(
      this.noise1.noise(x, y),
      this.noise2.noise(x, y)
    );
  }

  // 乘法混合
  multiply(x, y) {
    return this.noise1.noise(x, y) * this.noise2.noise(x, y);
  }
}
```

### 梯度映射

```javascript
// 将噪声值映射到颜色或其他属性
function terrainGradient(noiseValue) {
  // noiseValue: -1 到 1
  const height = (noiseValue + 1) * 0.5; // 0 到 1

  if (height < 0.3) {
    return { type: 'water', color: [0, 100, 200] };
  } else if (height < 0.4) {
    return { type: 'sand', color: [230, 210, 150] };
  } else if (height < 0.6) {
    return { type: 'grass', color: [50, 150, 50] };
  } else if (height < 0.8) {
    return { type: 'rock', color: [100, 100, 100] };
  } else {
    return { type: 'snow', color: [255, 255, 255] };
  }
}
```

## 实际应用案例

### 地形生成

```javascript
class TerrainGenerator {
  constructor(seed = 42) {
    this.perlin = new Perlin2D(seed);
    this.worley = new Worley2D(seed + 1000);
    this.fbm = new FBM(this.perlin, {
      octaves: 8,
      lacunarity: 2.0,
      persistence: 0.5,
      scale: 0.005
    });
    this.ridge = new RidgeNoise(this.perlin, {
      octaves: 6,
      scale: 0.003
    });
  }

  generateHeight(x, y) {
    // 基础地形
    let height = this.fbm.fbm2D(x, y);

    // 添加山脊
    const ridgeNoise = this.ridge.ridgeNoise2D(x, y);
    height = height * 0.7 + ridgeNoise * 0.3;

    // 添加细胞噪声创造岩石细节
    const cellNoise = this.worley.f1(x * 0.1, y * 0.1);
    height += cellNoise * 0.05;

    return height;
  }

  generateChunk(startX, startY, width, height, resolution = 1) {
    const chunk = [];
    for (let y = 0; y < height; y += resolution) {
      const row = [];
      for (let x = 0; x < width; x += resolution) {
        row.push(this.generateHeight(startX + x, startY + y));
      }
      chunk.push(row);
    }
    return chunk;
  }
}

// 使用示例
const terrain = new TerrainGenerator(12345);
const chunk = terrain.generateChunk(0, 0, 256, 256);
```

### 纹理生成

```javascript
class TextureGenerator {
  constructor(seed = 42) {
    this.perlin = new Perlin2D(seed);
    this.worley = new Worley2D(seed + 1);
  }

  // 木纹纹理
  woodTexture(x, y) {
    const scale = 0.1;
    const rings = 20;

    // 基础同心圆
    const dist = Math.sqrt(x * x + y * y);
    let wood = Math.sin(dist * rings * scale);

    // 添加扰动
    const turbulence = this.perlin.noise(x * 0.5, y * 0.5) * 0.3;
    wood += turbulence;

    return (wood + 1) * 0.5;
  }

  // 大理石纹理
  marbleTexture(x, y) {
    const scale = 0.02;
    const noise = this.perlin.noise(x * scale, y * scale);
    const turbulence = this.fbmTurbulence(x * scale * 2, y * scale * 2);

    return Math.sin(x * scale + noise * 10 + turbulence * 5) * 0.5 + 0.5;
  }

  fbmTurbulence(x, y) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;

    for (let i = 0; i < 4; i++) {
      total += Math.abs(
        this.perlin.noise(x * frequency, y * frequency)
      ) * amplitude;
      frequency *= 2;
      amplitude *= 0.5;
    }

    return total;
  }

  // 云朵纹理
  cloudTexture(x, y) {
    const scale = 0.01;
    let cloud = 0;
    let frequency = 1;
    let amplitude = 1;

    for (let i = 0; i < 6; i++) {
      cloud += this.perlin.noise(
        x * scale * frequency,
        y * scale * frequency
      ) * amplitude;
      frequency *= 2;
      amplitude *= 0.5;
    }

    // 调整对比度
    cloud = (cloud + 1) * 0.5;
    cloud = Math.pow(cloud, 1.5);

    return Math.min(1, Math.max(0, cloud));
  }

  // 石头/细胞纹理
  stoneTexture(x, y) {
    const scale = 0.1;
    const cellNoise = this.worley.f2MinusF1(x * scale, y * scale);
    const detail = this.perlin.noise(x * 0.5, y * 0.5) * 0.1;

    return Math.min(1, cellNoise + detail);
  }
}
```

### 动画噪声

```javascript
class AnimatedNoise {
  constructor(seed = 42) {
    this.noise3D = new Perlin3D(seed);
  }

  // 使用 3D 噪声的 Z 轴作为时间
  animate2D(x, y, time) {
    return this.noise3D.noise(x, y, time);
  }

  // 平滑循环动画
  loopingNoise(x, y, time, loopDuration) {
    // 在 3D 噪声中沿圆形路径采样，实现无缝循环
    const angle = (time / loopDuration) * Math.PI * 2;
    const radius = 1;

    const z1 = Math.cos(angle) * radius;
    const z2 = Math.sin(angle) * radius;

    // 使用 4D 噪声会更好，这里用两个 3D 噪声近似
    return this.noise3D.noise(x, y, z1) * 0.5 +
           this.noise3D.noise(x + 100, y + 100, z2) * 0.5;
  }

  // 流动效果
  flowingNoise(x, y, time, speed = 1) {
    return this.noise3D.noise(
      x + time * speed,
      y,
      time * 0.3
    );
  }
}

// 用于 Canvas 动画
function animateNoiseCanvas(canvas, noiseGen) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.createImageData(width, height);

  function render(time) {
    const t = time * 0.001; // 转换为秒

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const value = noiseGen.animate2D(x * 0.02, y * 0.02, t);
        const brightness = Math.floor((value + 1) * 127.5);

        const idx = (y * width + x) * 4;
        imageData.data[idx] = brightness;
        imageData.data[idx + 1] = brightness;
        imageData.data[idx + 2] = brightness;
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
```

## 性能优化技巧

### 预计算和缓存

```javascript
class OptimizedNoise {
  constructor(seed = 42, cacheSize = 256) {
    this.perlin = new Perlin2D(seed);
    this.cacheSize = cacheSize;
    this.cache = new Map();
  }

  // 带缓存的噪声查询
  cachedNoise(x, y) {
    const key = `${Math.floor(x * 1000)},${Math.floor(y * 1000)}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const value = this.perlin.noise(x, y);

    if (this.cache.size >= this.cacheSize) {
      // 简单的 LRU：删除最早的条目
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
    return value;
  }

  clearCache() {
    this.cache.clear();
  }
}
```

### GPU 加速（WebGL Shader）

```glsl
// 顶点着色器
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_position * 0.5 + 0.5;
}

// 片段着色器
precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform float u_scale;

// 伪随机函数
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// 2D 噪声
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  // 四个角的值
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  // 平滑插值
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// FBM
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 6; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value;
}

void main() {
  vec2 uv = v_texCoord * u_scale;
  uv.x += u_time * 0.1;

  float n = fbm(uv);
  gl_FragColor = vec4(vec3(n), 1.0);
}
```

### 分块处理

```javascript
class ChunkedNoiseGenerator {
  constructor(seed = 42, chunkSize = 64) {
    this.seed = seed;
    this.chunkSize = chunkSize;
    this.chunks = new Map();
    this.perlin = new Perlin2D(seed);
  }

  getChunkKey(chunkX, chunkY) {
    return `${chunkX},${chunkY}`;
  }

  generateChunk(chunkX, chunkY) {
    const key = this.getChunkKey(chunkX, chunkY);

    if (this.chunks.has(key)) {
      return this.chunks.get(key);
    }

    const chunk = new Float32Array(this.chunkSize * this.chunkSize);
    const offsetX = chunkX * this.chunkSize;
    const offsetY = chunkY * this.chunkSize;

    for (let y = 0; y < this.chunkSize; y++) {
      for (let x = 0; x < this.chunkSize; x++) {
        chunk[y * this.chunkSize + x] = this.perlin.noise(
          (offsetX + x) * 0.01,
          (offsetY + y) * 0.01
        );
      }
    }

    this.chunks.set(key, chunk);
    return chunk;
  }

  getValue(worldX, worldY) {
    const chunkX = Math.floor(worldX / this.chunkSize);
    const chunkY = Math.floor(worldY / this.chunkSize);
    const localX = worldX - chunkX * this.chunkSize;
    const localY = worldY - chunkY * this.chunkSize;

    const chunk = this.generateChunk(chunkX, chunkY);
    return chunk[localY * this.chunkSize + localX];
  }

  // 卸载远处的 chunk
  unloadDistantChunks(centerX, centerY, maxDistance) {
    const centerChunkX = Math.floor(centerX / this.chunkSize);
    const centerChunkY = Math.floor(centerY / this.chunkSize);

    for (const [key, chunk] of this.chunks) {
      const [cx, cy] = key.split(',').map(Number);
      const dist = Math.abs(cx - centerChunkX) + Math.abs(cy - centerChunkY);

      if (dist > maxDistance) {
        this.chunks.delete(key);
      }
    }
  }
}
```

## 调试与可视化

```javascript
class NoiseVisualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  // 绘制 2D 噪声图
  render2D(noiseFunc, scale = 0.02, colorFunc = null) {
    const { width, height } = this.canvas;
    const imageData = this.ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const value = noiseFunc(x * scale, y * scale);
        const normalized = (value + 1) * 0.5; // 0-1 范围

        let r, g, b;
        if (colorFunc) {
          [r, g, b] = colorFunc(normalized);
        } else {
          r = g = b = Math.floor(normalized * 255);
        }

        const idx = (y * width + x) * 4;
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = 255;
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  // 绘制直方图
  renderHistogram(noiseFunc, samples = 10000) {
    const bins = new Array(100).fill(0);

    for (let i = 0; i < samples; i++) {
      const x = Math.random() * 1000;
      const y = Math.random() * 1000;
      const value = noiseFunc(x * 0.01, y * 0.01);
      const normalized = (value + 1) * 0.5;
      const binIdx = Math.min(99, Math.floor(normalized * 100));
      bins[binIdx]++;
    }

    const maxCount = Math.max(...bins);
    const { width, height } = this.canvas;

    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.fillStyle = '#00d9ff';
    const barWidth = width / bins.length;

    bins.forEach((count, i) => {
      const barHeight = (count / maxCount) * height * 0.9;
      this.ctx.fillRect(
        i * barWidth,
        height - barHeight,
        barWidth - 1,
        barHeight
      );
    });
  }

  // 绘制 1D 噪声曲线
  render1D(noiseFunc, scale = 0.01) {
    const { width, height } = this.canvas;

    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.strokeStyle = '#00d9ff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    for (let x = 0; x < width; x++) {
      const value = noiseFunc(x * scale);
      const y = (1 - (value + 1) * 0.5) * height;

      if (x === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.stroke();
  }
}
```

## 总结与最佳实践

### 选择合适的噪声类型

| 应用场景 | 推荐算法 |
|---------|---------|
| 地形高度 | Perlin FBM + Ridge Noise |
| 云朵 | Perlin FBM（高 octaves）|
| 细胞/石头 | Worley F1 或 F2-F1 |
| 火焰/烟雾 | Turbulence + 动画 |
| 木纹 | 扭曲的同心圆 + Perlin |
| 大理石 | Domain Warping |
| 水面波纹 | 动画 Simplex + 叠加 |

### 性能考量

1. **选择合适的 octaves 数**：视觉需求和性能平衡
2. **使用 LOD**：远处物体使用更少 octaves
3. **预计算**：静态内容可预先生成并缓存
4. **GPU 加速**：大规模实时应用使用着色器
5. **分块生成**：开放世界游戏按需加载

### 常见陷阱

1. **边界问题**：确保排列表正确处理边界
2. **精度问题**：大坐标值可能导致精度丢失
3. **可见接缝**：检查 chunk 边界的连续性
4. **过度使用**：不是所有随机都需要噪声

噪声算法是程序化生成的基石，掌握这些技术将为你打开无限创造可能的大门。从简单的纹理生成到复杂的开放世界地形，噪声算法始终是游戏开发者最强大的工具之一。
