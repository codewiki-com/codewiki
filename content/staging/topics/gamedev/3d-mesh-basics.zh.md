---
title: 3D 网格与建模基础
description: 理解3D游戏模型基础：网格结构、UV映射和LOD系统
track: gamedev
section: graphics
difficulty: intermediate
tags:
  - 3D
  - 网格
  - UV映射
  - LOD
status: imported
origin: old/src/content/docs/gamedev/3d-mesh-basics.zh.md
divergence: 0.188
issues: []
legacy:
  category: GameDev
  subcategory: 3D
  order: 29
  lastUpdated: 2026-01-07
---

在 3D 游戏开发中，网格（Mesh）是构建虚拟世界的基础单元。无论是角色、建筑、道具还是地形，都是由网格数据定义的。理解网格的结构和原理，对于游戏开发者和技术美术来说至关重要。

## 顶点、边与面

### 网格的基本组成

3D 网格由三个核心元素构成：

```
顶点（Vertex）  →  边（Edge）  →  面（Face/Polygon）
     ↓                ↓                ↓
   空间中的点      连接两个顶点      三个或更多边围成的区域
```

**顶点（Vertex）**：3D 空间中的一个点，由 (x, y, z) 坐标定义。顶点不仅存储位置信息，还可以携带法线、UV 坐标、顶点颜色、骨骼权重等附加数据。

**边（Edge）**：连接两个顶点的线段。边定义了面的边界，在建模软件中常用于编辑网格拓扑。

**面（Face）**：由三条或更多边围成的平面区域。在实时渲染中，面通常被分解为三角形（Triangle），因为三角形是最简单的多边形，可以保证共面且易于光栅化。

```javascript
// 三角形面的顶点定义示例
const vertices = new Float32Array([
  // 顶点 0: 左下
  -1.0, -1.0, 0.0,
  // 顶点 1: 右下
   1.0, -1.0, 0.0,
  // 顶点 2: 顶部
   0.0,  1.0, 0.0
]);

// 一个三角形由 3 个顶点组成
// 顶点顺序决定了面的朝向（正面/背面）
```

### 三角形与四边形

在 3D 建模中，四边形（Quad）是常用的面类型，因为它便于创建均匀的网格拓扑：

```
四边形（Quad）              三角形分解
    v0 ─────── v1              v0 ─────── v1
     │         │                │ ╲       │
     │         │       →        │   ╲     │
     │         │                │     ╲   │
    v3 ─────── v2              v3 ─────── v2

一个四边形 = 两个三角形
(v0, v1, v2) + (v0, v2, v3)  或
(v0, v1, v3) + (v1, v2, v3)
```

```javascript
// 四边形的两种三角化方式
const quadVertices = [
  { x: -1, y:  1, z: 0 },  // v0: 左上
  { x:  1, y:  1, z: 0 },  // v1: 右上
  { x:  1, y: -1, z: 0 },  // v2: 右下
  { x: -1, y: -1, z: 0 }   // v3: 左下
];

// 方式1：对角线 v0-v2
const triangles1 = [
  [0, 1, 2],  // 三角形 1
  [0, 2, 3]   // 三角形 2
];

// 方式2：对角线 v1-v3
const triangles2 = [
  [0, 1, 3],  // 三角形 1
  [1, 2, 3]   // 三角形 2
];
```

### 顶点环绕顺序

顶点的排列顺序决定了面的朝向，这对于背面剔除（Back-face Culling）至关重要：

```javascript
// 逆时针顺序（Counter-Clockwise）= 正面
// 大多数图形 API 默认将逆时针定义为正面
const frontFace = [0, 1, 2];  // 从正面看，顶点按逆时针排列

// 顺时针顺序（Clockwise）= 背面
const backFace = [0, 2, 1];   // 从正面看，顶点按顺时针排列

// WebGL/Three.js 中的背面剔除设置
const material = new THREE.MeshStandardMaterial({
  side: THREE.FrontSide,    // 只渲染正面（默认）
  // side: THREE.BackSide,  // 只渲染背面
  // side: THREE.DoubleSide // 双面渲染
});
```

## 网格数据结构

### 顶点缓冲区与索引缓冲区

现代图形 API 使用缓冲区（Buffer）来高效存储和传输网格数据：

```javascript
// 顶点缓冲区（Vertex Buffer）
// 存储所有顶点的属性数据
const positions = new Float32Array([
  // 立方体 8 个顶点的位置
  -1, -1,  1,  // 0: 前左下
   1, -1,  1,  // 1: 前右下
   1,  1,  1,  // 2: 前右上
  -1,  1,  1,  // 3: 前左上
  -1, -1, -1,  // 4: 后左下
   1, -1, -1,  // 5: 后右下
   1,  1, -1,  // 6: 后右上
  -1,  1, -1   // 7: 后左上
]);

// 索引缓冲区（Index Buffer）
// 通过索引引用顶点，避免重复存储
const indices = new Uint16Array([
  // 前面
  0, 1, 2,  0, 2, 3,
  // 后面
  5, 4, 7,  5, 7, 6,
  // 上面
  3, 2, 6,  3, 6, 7,
  // 下面
  4, 5, 1,  4, 1, 0,
  // 右面
  1, 5, 6,  1, 6, 2,
  // 左面
  4, 0, 3,  4, 3, 7
]);
```

### 顶点属性

每个顶点可以携带多种属性数据：

```javascript
// 完整的顶点数据结构
class Vertex {
  constructor() {
    this.position = [0, 0, 0];      // 位置 (vec3)
    this.normal = [0, 0, 1];        // 法线 (vec3)
    this.tangent = [1, 0, 0, 1];    // 切线 (vec4, w 分量表示手性)
    this.uv = [0, 0];               // 纹理坐标 (vec2)
    this.uv2 = [0, 0];              // 第二套 UV，用于光照贴图 (vec2)
    this.color = [1, 1, 1, 1];      // 顶点颜色 (vec4)
    this.boneIndices = [0, 0, 0, 0]; // 骨骼索引 (ivec4)
    this.boneWeights = [0, 0, 0, 0]; // 骨骼权重 (vec4)
  }
}

// Three.js 中设置顶点属性
const geometry = new THREE.BufferGeometry();

geometry.setAttribute('position',
  new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('normal',
  new THREE.BufferAttribute(normals, 3));
geometry.setAttribute('uv',
  new THREE.BufferAttribute(uvs, 2));
geometry.setAttribute('color',
  new THREE.BufferAttribute(colors, 4));

geometry.setIndex(new THREE.BufferAttribute(indices, 1));
```

### 交错与分离布局

顶点数据可以采用两种内存布局方式：

```javascript
// 分离布局（Separate/Planar Layout）
// 每种属性单独存储在一个缓冲区中
const positionBuffer = new Float32Array([
  x0, y0, z0, x1, y1, z1, x2, y2, z2, ...
]);
const normalBuffer = new Float32Array([
  nx0, ny0, nz0, nx1, ny1, nz1, nx2, ny2, nz2, ...
]);
const uvBuffer = new Float32Array([
  u0, v0, u1, v1, u2, v2, ...
]);

// 交错布局（Interleaved Layout）
// 所有属性交替存储在一个缓冲区中
// 优点：更好的缓存局部性
const interleavedBuffer = new Float32Array([
  // 顶点 0
  x0, y0, z0,      // position
  nx0, ny0, nz0,   // normal
  u0, v0,          // uv
  // 顶点 1
  x1, y1, z1,      // position
  nx1, ny1, nz1,   // normal
  u1, v1,          // uv
  // ...
]);

// Three.js 交错缓冲区示例
const interleavedArray = new Float32Array(vertexCount * 8); // 3+3+2 = 8
const interleavedBuffer = new THREE.InterleavedBuffer(interleavedArray, 8);

geometry.setAttribute('position',
  new THREE.InterleavedBufferAttribute(interleavedBuffer, 3, 0));
geometry.setAttribute('normal',
  new THREE.InterleavedBufferAttribute(interleavedBuffer, 3, 3));
geometry.setAttribute('uv',
  new THREE.InterleavedBufferAttribute(interleavedBuffer, 2, 6));
```

## 法线与切线

### 法线（Normal）

法线是垂直于表面的单位向量，用于光照计算：

```javascript
// 计算三角形的面法线
function calculateFaceNormal(v0, v1, v2) {
  const edge1 = [
    v1[0] - v0[0],
    v1[1] - v0[1],
    v1[2] - v0[2]
  ];
  const edge2 = [
    v2[0] - v0[0],
    v2[1] - v0[1],
    v2[2] - v0[2]
  ];

  // 叉乘得到法线方向
  const normal = [
    edge1[1] * edge2[2] - edge1[2] * edge2[1],
    edge1[2] * edge2[0] - edge1[0] * edge2[2],
    edge1[0] * edge2[1] - edge1[1] * edge2[0]
  ];

  // 归一化
  const length = Math.sqrt(
    normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2
  );
  return normal.map(n => n / length);
}

// 计算顶点法线（平均相邻面的法线）
function calculateVertexNormals(positions, indices) {
  const vertexCount = positions.length / 3;
  const normals = new Float32Array(vertexCount * 3);
  const counts = new Uint32Array(vertexCount);

  // 遍历每个三角形
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i];
    const i1 = indices[i + 1];
    const i2 = indices[i + 2];

    const v0 = positions.slice(i0 * 3, i0 * 3 + 3);
    const v1 = positions.slice(i1 * 3, i1 * 3 + 3);
    const v2 = positions.slice(i2 * 3, i2 * 3 + 3);

    const faceNormal = calculateFaceNormal(v0, v1, v2);

    // 累加到各顶点
    [i0, i1, i2].forEach(idx => {
      normals[idx * 3] += faceNormal[0];
      normals[idx * 3 + 1] += faceNormal[1];
      normals[idx * 3 + 2] += faceNormal[2];
      counts[idx]++;
    });
  }

  // 归一化
  for (let i = 0; i < vertexCount; i++) {
    const x = normals[i * 3];
    const y = normals[i * 3 + 1];
    const z = normals[i * 3 + 2];
    const len = Math.sqrt(x * x + y * y + z * z);
    normals[i * 3] = x / len;
    normals[i * 3 + 1] = y / len;
    normals[i * 3 + 2] = z / len;
  }

  return normals;
}
```

### 硬边与软边

通过控制法线，可以实现硬边（Sharp Edge）和软边（Smooth Edge）效果：

```javascript
// 软边：共享顶点法线
// 相邻面共用顶点，法线为平均值
//
//      ╱╲
//     ╱  ╲    顶点法线 = 两个面法线的平均
//    ╱    ╲
//   ────────

// 硬边：分离顶点
// 同一位置有多个顶点，各自使用面法线
//
//      ╱╲
//     ╱  ╲    每个面有独立的顶点和法线
//    ╱    ╲
//   ────────

// 实现硬边效果
function createHardEdgedCube() {
  // 每个面需要独立的 4 个顶点（共 24 个顶点）
  // 而不是共享 8 个顶点
  const positions = new Float32Array([
    // 前面 (z = 1)
    -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,
    // 后面 (z = -1)
     1, -1, -1,  -1, -1, -1,  -1,  1, -1,   1,  1, -1,
    // 上面 (y = 1)
    -1,  1,  1,   1,  1,  1,   1,  1, -1,  -1,  1, -1,
    // 下面 (y = -1)
    -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,
    // 右面 (x = 1)
     1, -1,  1,   1, -1, -1,   1,  1, -1,   1,  1,  1,
    // 左面 (x = -1)
    -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1
  ]);

  const normals = new Float32Array([
    // 前面法线
    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    // 后面法线
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    // 上面法线
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
    // 下面法线
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    // 右面法线
    1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
    // 左面法线
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
  ]);

  return { positions, normals };
}
```

### 切线空间

切线空间（Tangent Space）用于法线贴图，由切线（Tangent）、副切线（Bitangent）和法线（Normal）组成：

```javascript
// 计算切线和副切线
function calculateTangents(positions, normals, uvs, indices) {
  const vertexCount = positions.length / 3;
  const tangents = new Float32Array(vertexCount * 4);
  const bitangents = new Float32Array(vertexCount * 3);

  // 遍历每个三角形
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i];
    const i1 = indices[i + 1];
    const i2 = indices[i + 2];

    // 顶点位置
    const p0 = [positions[i0*3], positions[i0*3+1], positions[i0*3+2]];
    const p1 = [positions[i1*3], positions[i1*3+1], positions[i1*3+2]];
    const p2 = [positions[i2*3], positions[i2*3+1], positions[i2*3+2]];

    // UV 坐标
    const uv0 = [uvs[i0*2], uvs[i0*2+1]];
    const uv1 = [uvs[i1*2], uvs[i1*2+1]];
    const uv2 = [uvs[i2*2], uvs[i2*2+1]];

    // 边向量
    const edge1 = [p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2]];
    const edge2 = [p2[0]-p0[0], p2[1]-p0[1], p2[2]-p0[2]];

    // UV 差值
    const deltaUV1 = [uv1[0]-uv0[0], uv1[1]-uv0[1]];
    const deltaUV2 = [uv2[0]-uv0[0], uv2[1]-uv0[1]];

    // 计算切线和副切线
    const r = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);

    const tangent = [
      (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]) * r,
      (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]) * r,
      (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]) * r
    ];

    const bitangent = [
      (deltaUV1[0] * edge2[0] - deltaUV2[0] * edge1[0]) * r,
      (deltaUV1[0] * edge2[1] - deltaUV2[0] * edge1[1]) * r,
      (deltaUV1[0] * edge2[2] - deltaUV2[0] * edge1[2]) * r
    ];

    // 累加到顶点
    [i0, i1, i2].forEach(idx => {
      tangents[idx*4] += tangent[0];
      tangents[idx*4+1] += tangent[1];
      tangents[idx*4+2] += tangent[2];
      bitangents[idx*3] += bitangent[0];
      bitangents[idx*3+1] += bitangent[1];
      bitangents[idx*3+2] += bitangent[2];
    });
  }

  // Gram-Schmidt 正交化并计算手性
  for (let i = 0; i < vertexCount; i++) {
    const n = [normals[i*3], normals[i*3+1], normals[i*3+2]];
    let t = [tangents[i*4], tangents[i*4+1], tangents[i*4+2]];
    const b = [bitangents[i*3], bitangents[i*3+1], bitangents[i*3+2]];

    // 正交化：t = normalize(t - n * dot(n, t))
    const dot = n[0]*t[0] + n[1]*t[1] + n[2]*t[2];
    t = [t[0]-n[0]*dot, t[1]-n[1]*dot, t[2]-n[2]*dot];
    const len = Math.sqrt(t[0]*t[0] + t[1]*t[1] + t[2]*t[2]);
    t = t.map(v => v / len);

    // 计算手性（handedness）
    const cross = [
      n[1]*t[2] - n[2]*t[1],
      n[2]*t[0] - n[0]*t[2],
      n[0]*t[1] - n[1]*t[0]
    ];
    const w = (cross[0]*b[0] + cross[1]*b[1] + cross[2]*b[2]) < 0 ? -1 : 1;

    tangents[i*4] = t[0];
    tangents[i*4+1] = t[1];
    tangents[i*4+2] = t[2];
    tangents[i*4+3] = w;  // 手性存储在 w 分量
  }

  return tangents;
}
```

## UV 映射原理

### 什么是 UV 映射

UV 映射是将 2D 纹理坐标分配给 3D 网格顶点的过程。U 和 V 分别代表纹理的水平和垂直轴：

```
纹理空间 (UV Space)
    v
    ↑
  1 ┌─────────────┐
    │             │
    │   纹理图像   │
    │             │
  0 └─────────────┘→ u
    0             1

3D 模型上的 UV 坐标
每个顶点有一个 (u, v) 值
指定该顶点对应纹理的哪个位置
```

```javascript
// UV 坐标示例
const uvCoordinates = new Float32Array([
  0.0, 0.0,  // 顶点 0 → 纹理左下角
  1.0, 0.0,  // 顶点 1 → 纹理右下角
  1.0, 1.0,  // 顶点 2 → 纹理右上角
  0.0, 1.0   // 顶点 3 → 纹理左上角
]);

// 应用 UV 到 Three.js 几何体
geometry.setAttribute('uv',
  new THREE.BufferAttribute(uvCoordinates, 2));
```

### 常见的 UV 展开方式

```javascript
// 1. 平面投影（Planar Projection）
function planarUV(position, axis = 'z') {
  switch (axis) {
    case 'x': return [position.z, position.y];
    case 'y': return [position.x, position.z];
    case 'z': return [position.x, position.y];
  }
}

// 2. 圆柱投影（Cylindrical Projection）
function cylindricalUV(position) {
  const u = (Math.atan2(position.x, position.z) + Math.PI) / (2 * Math.PI);
  const v = (position.y + 1) / 2;  // 假设 y 范围是 [-1, 1]
  return [u, v];
}

// 3. 球形投影（Spherical Projection）
function sphericalUV(position) {
  const len = Math.sqrt(
    position.x ** 2 + position.y ** 2 + position.z ** 2
  );
  const normalized = {
    x: position.x / len,
    y: position.y / len,
    z: position.z / len
  };

  const u = (Math.atan2(normalized.x, normalized.z) + Math.PI) / (2 * Math.PI);
  const v = Math.acos(normalized.y) / Math.PI;
  return [u, v];
}

// 4. 立方体投影（Cube/Box Projection）
function boxUV(position, normal) {
  // 根据法线方向选择投影面
  const absNormal = {
    x: Math.abs(normal.x),
    y: Math.abs(normal.y),
    z: Math.abs(normal.z)
  };

  if (absNormal.x >= absNormal.y && absNormal.x >= absNormal.z) {
    return [position.z * Math.sign(normal.x), position.y];
  } else if (absNormal.y >= absNormal.x && absNormal.y >= absNormal.z) {
    return [position.x, position.z * Math.sign(normal.y)];
  } else {
    return [position.x * Math.sign(normal.z), position.y];
  }
}
```

### UV 接缝与岛屿

当 3D 模型展开到 2D 时，需要创建接缝（Seam）来分割 UV：

```javascript
// UV 岛屿管理
class UVIsland {
  constructor() {
    this.vertices = [];
    this.bounds = { min: [0, 0], max: [1, 1] };
  }

  // 计算边界框
  calculateBounds() {
    let minU = Infinity, minV = Infinity;
    let maxU = -Infinity, maxV = -Infinity;

    this.vertices.forEach(v => {
      minU = Math.min(minU, v.uv[0]);
      minV = Math.min(minV, v.uv[1]);
      maxU = Math.max(maxU, v.uv[0]);
      maxV = Math.max(maxV, v.uv[1]);
    });

    this.bounds = {
      min: [minU, minV],
      max: [maxU, maxV]
    };
  }

  // 缩放岛屿
  scale(factor) {
    const center = [
      (this.bounds.min[0] + this.bounds.max[0]) / 2,
      (this.bounds.min[1] + this.bounds.max[1]) / 2
    ];

    this.vertices.forEach(v => {
      v.uv[0] = center[0] + (v.uv[0] - center[0]) * factor;
      v.uv[1] = center[1] + (v.uv[1] - center[1]) * factor;
    });
  }

  // 移动岛屿
  translate(offset) {
    this.vertices.forEach(v => {
      v.uv[0] += offset[0];
      v.uv[1] += offset[1];
    });
  }
}

// UV 打包算法（简化版）
function packUVIslands(islands, padding = 0.01) {
  // 按面积排序（大到小）
  islands.sort((a, b) => {
    const areaA = (a.bounds.max[0] - a.bounds.min[0]) *
                  (a.bounds.max[1] - a.bounds.min[1]);
    const areaB = (b.bounds.max[0] - b.bounds.min[0]) *
                  (b.bounds.max[1] - b.bounds.min[1]);
    return areaB - areaA;
  });

  // 使用贪婪算法放置岛屿
  const placed = [];
  islands.forEach(island => {
    island.calculateBounds();
    const size = [
      island.bounds.max[0] - island.bounds.min[0] + padding * 2,
      island.bounds.max[1] - island.bounds.min[1] + padding * 2
    ];

    // 寻找可用位置（简化：从左到右，从下到上）
    let bestPos = [0, 0];
    // ... 实际实现需要更复杂的布局算法

    island.translate([
      bestPos[0] - island.bounds.min[0] + padding,
      bestPos[1] - island.bounds.min[1] + padding
    ]);

    placed.push(island);
  });
}
```

### 多套 UV

一个网格可以有多套 UV 坐标，用于不同目的：

```javascript
// UV1: 主纹理（漫反射、法线等）
// UV2: 光照贴图（Lightmap）
// UV3: 细节纹理

const geometry = new THREE.BufferGeometry();

// 第一套 UV：主纹理坐标
geometry.setAttribute('uv',
  new THREE.BufferAttribute(mainUVs, 2));

// 第二套 UV：光照贴图坐标
// 通常需要无重叠的展开
geometry.setAttribute('uv2',
  new THREE.BufferAttribute(lightmapUVs, 2));

// 使用光照贴图
const material = new THREE.MeshStandardMaterial({
  map: diffuseTexture,
  lightMap: lightmapTexture,
  lightMapIntensity: 1.0
});
```

## LOD 系统

### 什么是 LOD

LOD（Level of Detail，细节层次）是一种优化技术，根据物体与相机的距离切换不同精度的模型：

```
近距离（0-10m）    中等距离（10-50m）   远距离（50m+）
    ┌──┐               ┌─┐                 ·
   ╱    ╲             ╱   ╲               ╱╲
  │      │           │     │             ──
  │      │           │     │
  ────────           ──────

高精度模型          中精度模型          低精度模型
10,000 三角形       2,000 三角形        500 三角形
```

```javascript
// Three.js LOD 实现
import * as THREE from 'three';

// 创建 LOD 对象
const lod = new THREE.LOD();

// 加载不同精度的模型
const highDetail = await loadModel('character_high.glb');   // 10000 tris
const mediumDetail = await loadModel('character_med.glb'); // 2000 tris
const lowDetail = await loadModel('character_low.glb');    // 500 tris

// 添加到 LOD，指定切换距离
lod.addLevel(highDetail, 0);    // 距离 0-20 使用高精度
lod.addLevel(mediumDetail, 20); // 距离 20-50 使用中精度
lod.addLevel(lowDetail, 50);    // 距离 50+ 使用低精度

scene.add(lod);

// 每帧更新 LOD
function animate() {
  requestAnimationFrame(animate);

  // LOD 自动根据相机距离切换模型
  lod.update(camera);

  renderer.render(scene, camera);
}
```

### 自动生成 LOD

```javascript
// 使用网格简化算法自动生成 LOD
class MeshSimplifier {
  constructor(geometry) {
    this.geometry = geometry;
    this.vertices = [];
    this.faces = [];
    this.parseGeometry();
  }

  parseGeometry() {
    const positions = this.geometry.attributes.position.array;
    const indices = this.geometry.index.array;

    // 解析顶点
    for (let i = 0; i < positions.length; i += 3) {
      this.vertices.push({
        position: [positions[i], positions[i+1], positions[i+2]],
        faces: [],
        neighbors: new Set()
      });
    }

    // 解析面和邻接关系
    for (let i = 0; i < indices.length; i += 3) {
      const face = {
        vertices: [indices[i], indices[i+1], indices[i+2]]
      };
      this.faces.push(face);

      // 更新顶点的面列表和邻居
      face.vertices.forEach((vi, idx) => {
        this.vertices[vi].faces.push(face);
        face.vertices.forEach((vj, jdx) => {
          if (idx !== jdx) {
            this.vertices[vi].neighbors.add(vj);
          }
        });
      });
    }
  }

  // 计算边折叠代价（使用 QEM 算法简化版）
  calculateEdgeCost(v1Index, v2Index) {
    const v1 = this.vertices[v1Index];
    const v2 = this.vertices[v2Index];

    // 简化：使用边长作为代价
    const dx = v1.position[0] - v2.position[0];
    const dy = v1.position[1] - v2.position[1];
    const dz = v1.position[2] - v2.position[2];

    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

  // 执行边折叠
  collapseEdge(v1Index, v2Index) {
    const v1 = this.vertices[v1Index];
    const v2 = this.vertices[v2Index];

    // 计算新顶点位置（取中点）
    const newPosition = [
      (v1.position[0] + v2.position[0]) / 2,
      (v1.position[1] + v2.position[1]) / 2,
      (v1.position[2] + v2.position[2]) / 2
    ];

    // 更新 v1 的位置
    v1.position = newPosition;

    // 将 v2 的面转移到 v1
    v2.faces.forEach(face => {
      const idx = face.vertices.indexOf(v2Index);
      if (idx !== -1) {
        face.vertices[idx] = v1Index;
      }
      if (!v1.faces.includes(face)) {
        v1.faces.push(face);
      }
    });

    // 移除退化的面（两个顶点相同）
    this.faces = this.faces.filter(face => {
      const unique = new Set(face.vertices);
      return unique.size === 3;
    });

    // 标记 v2 为已删除
    v2.deleted = true;
  }

  // 简化到目标三角形数量
  simplify(targetTriangleCount) {
    while (this.faces.length > targetTriangleCount) {
      // 找到代价最小的边
      let minCost = Infinity;
      let bestEdge = null;

      this.vertices.forEach((v, i) => {
        if (v.deleted) return;

        v.neighbors.forEach(j => {
          if (this.vertices[j].deleted) return;

          const cost = this.calculateEdgeCost(i, j);
          if (cost < minCost) {
            minCost = cost;
            bestEdge = [i, j];
          }
        });
      });

      if (!bestEdge) break;

      this.collapseEdge(bestEdge[0], bestEdge[1]);
    }

    return this.buildGeometry();
  }

  buildGeometry() {
    // 重建几何体
    const newGeometry = new THREE.BufferGeometry();

    // 重新编号顶点
    const vertexMap = new Map();
    const positions = [];
    let newIndex = 0;

    this.vertices.forEach((v, oldIndex) => {
      if (!v.deleted) {
        vertexMap.set(oldIndex, newIndex++);
        positions.push(...v.position);
      }
    });

    // 重建索引
    const indices = [];
    this.faces.forEach(face => {
      const newIndices = face.vertices.map(vi => vertexMap.get(vi));
      if (newIndices.every(i => i !== undefined)) {
        indices.push(...newIndices);
      }
    });

    newGeometry.setAttribute('position',
      new THREE.BufferAttribute(new Float32Array(positions), 3));
    newGeometry.setIndex(indices);
    newGeometry.computeVertexNormals();

    return newGeometry;
  }
}

// 使用简化器生成 LOD
async function generateLODFromGeometry(geometry) {
  const lod = new THREE.LOD();

  const simplifier = new MeshSimplifier(geometry.clone());
  const originalTriCount = geometry.index.count / 3;

  // LOD 0: 原始模型
  lod.addLevel(new THREE.Mesh(geometry, material), 0);

  // LOD 1: 50% 三角形
  const lod1 = simplifier.simplify(originalTriCount * 0.5);
  lod.addLevel(new THREE.Mesh(lod1, material), 20);

  // LOD 2: 25% 三角形
  const lod2 = simplifier.simplify(originalTriCount * 0.25);
  lod.addLevel(new THREE.Mesh(lod2, material), 40);

  // LOD 3: 10% 三角形
  const lod3 = simplifier.simplify(originalTriCount * 0.1);
  lod.addLevel(new THREE.Mesh(lod3, material), 60);

  return lod;
}
```

### HLOD（层级 LOD）

HLOD 用于大型场景，将多个物体合并为单一的低精度表示：

```javascript
// HLOD 实现概念
class HLOD {
  constructor() {
    this.nodes = [];
    this.combinedMeshes = new Map();
  }

  // 添加一组物体作为 HLOD 节点
  addCluster(objects, boundingSphere) {
    const node = {
      objects: objects,
      boundingSphere: boundingSphere,
      combinedLOD: null
    };

    // 生成合并的低精度网格
    node.combinedLOD = this.generateCombinedMesh(objects);

    this.nodes.push(node);
  }

  // 合并多个物体为一个简化网格
  generateCombinedMesh(objects) {
    const geometries = [];

    objects.forEach(obj => {
      // 获取最低 LOD 或简化版本
      const lowDetailGeo = this.getLowestLOD(obj);

      // 应用物体的变换矩阵
      const transformedGeo = lowDetailGeo.clone();
      transformedGeo.applyMatrix4(obj.matrixWorld);

      geometries.push(transformedGeo);
    });

    // 合并所有几何体
    const mergedGeometry = mergeGeometries(geometries);

    // 可选：进一步简化合并后的网格
    const simplifier = new MeshSimplifier(mergedGeometry);
    return simplifier.simplify(1000);
  }

  // 更新 HLOD 可见性
  update(camera) {
    this.nodes.forEach(node => {
      const distance = camera.position.distanceTo(
        node.boundingSphere.center
      );

      if (distance > node.boundingSphere.radius * 10) {
        // 远距离：显示合并的 LOD，隐藏单独物体
        node.combinedLOD.visible = true;
        node.objects.forEach(obj => obj.visible = false);
      } else {
        // 近距离：显示单独物体，隐藏合并 LOD
        node.combinedLOD.visible = false;
        node.objects.forEach(obj => obj.visible = true);
      }
    });
  }
}
```

## 网格优化

### 顶点缓存优化

优化三角形顺序以提高 GPU 顶点缓存命中率：

```javascript
// 顶点缓存优化（Forsyth 算法简化版）
class VertexCacheOptimizer {
  constructor(indices, vertexCount) {
    this.indices = indices;
    this.vertexCount = vertexCount;
    this.cacheSize = 32;  // 典型的顶点缓存大小
  }

  optimize() {
    const triangleCount = this.indices.length / 3;
    const triangles = [];
    const vertexScores = new Float32Array(this.vertexCount);
    const vertexTriangles = Array(this.vertexCount).fill(null).map(() => []);

    // 构建三角形和顶点关系
    for (let i = 0; i < triangleCount; i++) {
      const tri = {
        vertices: [
          this.indices[i * 3],
          this.indices[i * 3 + 1],
          this.indices[i * 3 + 2]
        ],
        added: false
      };
      triangles.push(tri);

      tri.vertices.forEach(v => {
        vertexTriangles[v].push(i);
      });
    }

    // 初始化顶点分数
    for (let i = 0; i < this.vertexCount; i++) {
      vertexScores[i] = this.calculateVertexScore(
        -1, vertexTriangles[i].length
      );
    }

    // 模拟的 LRU 缓存
    const cache = [];
    const optimizedIndices = [];

    // 贪婪选择三角形
    for (let t = 0; t < triangleCount; t++) {
      // 找分数最高的三角形
      let bestScore = -1;
      let bestTri = -1;

      triangles.forEach((tri, i) => {
        if (tri.added) return;

        let score = 0;
        tri.vertices.forEach(v => {
          score += vertexScores[v];
        });

        if (score > bestScore) {
          bestScore = score;
          bestTri = i;
        }
      });

      if (bestTri === -1) break;

      // 添加三角形
      const tri = triangles[bestTri];
      tri.added = true;
      optimizedIndices.push(...tri.vertices);

      // 更新缓存和分数
      tri.vertices.forEach(v => {
        // 更新缓存
        const cachePos = cache.indexOf(v);
        if (cachePos !== -1) {
          cache.splice(cachePos, 1);
        }
        cache.unshift(v);
        if (cache.length > this.cacheSize) {
          cache.pop();
        }

        // 更新分数
        const newCachePos = cache.indexOf(v);
        const activeTriCount = vertexTriangles[v].filter(
          ti => !triangles[ti].added
        ).length;
        vertexScores[v] = this.calculateVertexScore(newCachePos, activeTriCount);
      });
    }

    return new Uint32Array(optimizedIndices);
  }

  calculateVertexScore(cachePosition, activeTriangleCount) {
    if (activeTriangleCount === 0) return -1;

    let score = 0;

    if (cachePosition >= 0) {
      if (cachePosition < 3) {
        score = 0.75;
      } else {
        score = Math.pow(1 - (cachePosition - 3) / (this.cacheSize - 3), 1.5);
      }
    }

    // 偏好活跃三角形数少的顶点
    score += 2 * Math.pow(activeTriangleCount, -0.5);

    return score;
  }
}

// 使用
const optimizer = new VertexCacheOptimizer(indices, vertexCount);
const optimizedIndices = optimizer.optimize();
geometry.setIndex(new THREE.BufferAttribute(optimizedIndices, 1));
```

### 过度绘制优化

减少片元着色器的重复计算：

```javascript
// 深度预渲染（Depth Pre-pass）
function setupDepthPrepass(scene, camera, renderer) {
  // 深度材质
  const depthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking
  });

  // 深度渲染目标
  const depthTarget = new THREE.WebGLRenderTarget(
    window.innerWidth,
    window.innerHeight
  );
  depthTarget.texture.minFilter = THREE.NearestFilter;
  depthTarget.texture.magFilter = THREE.NearestFilter;

  function render() {
    // 第一遍：只渲染深度
    scene.overrideMaterial = depthMaterial;
    renderer.setRenderTarget(depthTarget);
    renderer.render(scene, camera);

    // 第二遍：正常渲染，使用深度测试 EQUAL
    scene.overrideMaterial = null;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  }

  return render;
}

// 从前到后排序（减少过度绘制）
function sortObjectsFrontToBack(objects, camera) {
  const cameraPosition = camera.position;

  objects.sort((a, b) => {
    const distA = a.position.distanceToSquared(cameraPosition);
    const distB = b.position.distanceToSquared(cameraPosition);
    return distA - distB;  // 近的物体先渲染
  });
}
```

### 批处理（Batching）

```javascript
// 静态批处理
function staticBatch(objects, material) {
  const geometries = [];

  objects.forEach(obj => {
    const geo = obj.geometry.clone();
    geo.applyMatrix4(obj.matrixWorld);
    geometries.push(geo);
  });

  const mergedGeometry = mergeGeometries(geometries);
  return new THREE.Mesh(mergedGeometry, material);
}

// 动态批处理（使用 InstancedMesh）
function dynamicBatch(geometry, material, transforms) {
  const instancedMesh = new THREE.InstancedMesh(
    geometry,
    material,
    transforms.length
  );

  const matrix = new THREE.Matrix4();

  transforms.forEach((transform, i) => {
    matrix.compose(
      transform.position,
      transform.rotation,
      transform.scale
    );
    instancedMesh.setMatrixAt(i, matrix);
  });

  instancedMesh.instanceMatrix.needsUpdate = true;

  return instancedMesh;
}

// 使用实例化渲染大量相同物体
const treeGeometry = await loadModel('tree.glb');
const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x228822 });

const treeTransforms = [];
for (let i = 0; i < 10000; i++) {
  treeTransforms.push({
    position: new THREE.Vector3(
      Math.random() * 1000 - 500,
      0,
      Math.random() * 1000 - 500
    ),
    rotation: new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, Math.random() * Math.PI * 2, 0)
    ),
    scale: new THREE.Vector3(1, 1, 1).multiplyScalar(
      0.8 + Math.random() * 0.4
    )
  });
}

const trees = dynamicBatch(treeGeometry, treeMaterial, treeTransforms);
scene.add(trees);
```

## 模型导入导出

### 常见 3D 格式

```javascript
// 格式比较
const formats = {
  'GLTF/GLB': {
    extension: ['.gltf', '.glb'],
    features: ['PBR材质', '动画', '骨骼', '变形'],
    compression: 'Draco/Meshopt',
    recommended: true,
    description: '现代 Web 3D 的推荐格式'
  },
  'FBX': {
    extension: ['.fbx'],
    features: ['动画', '骨骼', '材质'],
    compression: null,
    recommended: false,
    description: '工业标准，文件较大'
  },
  'OBJ': {
    extension: ['.obj', '.mtl'],
    features: ['静态网格', '基础材质'],
    compression: null,
    recommended: false,
    description: '简单通用，不支持动画'
  },
  'Collada': {
    extension: ['.dae'],
    features: ['动画', '骨骼', '材质'],
    compression: null,
    recommended: false,
    description: 'XML格式，文件较大'
  },
  'STL': {
    extension: ['.stl'],
    features: ['静态网格'],
    compression: null,
    recommended: false,
    description: '3D打印常用，无材质信息'
  },
  'PLY': {
    extension: ['.ply'],
    features: ['点云', '顶点颜色'],
    compression: null,
    recommended: false,
    description: '点云扫描数据'
  }
};
```

### GLTF 加载与处理

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

// 配置加载器
const gltfLoader = new GLTFLoader();

// Draco 压缩支持
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
gltfLoader.setDRACOLoader(dracoLoader);

// Meshopt 压缩支持
gltfLoader.setMeshoptDecoder(MeshoptDecoder);

// 加载模型
async function loadGLTF(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        // 处理模型
        model.traverse((child) => {
          if (child.isMesh) {
            // 启用阴影
            child.castShadow = true;
            child.receiveShadow = true;

            // 获取边界框
            child.geometry.computeBoundingBox();
            child.geometry.computeBoundingSphere();

            // 优化几何体
            if (!child.geometry.attributes.normal) {
              child.geometry.computeVertexNormals();
            }
          }
        });

        resolve({
          scene: model,
          animations: gltf.animations,
          cameras: gltf.cameras,
          asset: gltf.asset
        });
      },
      (progress) => {
        console.log(`加载进度: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
      },
      reject
    );
  });
}

// 使用
const character = await loadGLTF('/models/character.glb');
scene.add(character.scene);

// 播放动画
if (character.animations.length > 0) {
  const mixer = new THREE.AnimationMixer(character.scene);
  const action = mixer.clipAction(character.animations[0]);
  action.play();
}
```

### 导出 GLTF

```javascript
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

async function exportToGLTF(scene, options = {}) {
  const exporter = new GLTFExporter();

  const defaultOptions = {
    binary: true,                    // 导出为 GLB
    trs: false,                      // 使用矩阵而非 TRS
    onlyVisible: true,               // 只导出可见物体
    truncateDrawRange: true,         // 截断绘制范围
    maxTextureSize: 4096,            // 最大纹理尺寸
    animations: [],                  // 要导出的动画
    includeCustomExtensions: false   // 包含自定义扩展
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          // GLB 格式
          const blob = new Blob([result], { type: 'application/octet-stream' });
          resolve(blob);
        } else {
          // GLTF 格式
          const str = JSON.stringify(result, null, 2);
          const blob = new Blob([str], { type: 'text/plain' });
          resolve(blob);
        }
      },
      (error) => reject(error),
      mergedOptions
    );
  });
}

// 下载导出的模型
async function downloadModel(scene, filename = 'model.glb') {
  const blob = await exportToGLTF(scene, { binary: true });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
```

### OBJ 格式处理

```javascript
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

// 加载 OBJ（带材质）
async function loadOBJ(objUrl, mtlUrl) {
  const mtlLoader = new MTLLoader();
  const objLoader = new OBJLoader();

  // 先加载材质
  const materials = await new Promise((resolve) => {
    mtlLoader.load(mtlUrl, resolve);
  });
  materials.preload();

  // 设置材质并加载模型
  objLoader.setMaterials(materials);

  return new Promise((resolve) => {
    objLoader.load(objUrl, resolve);
  });
}

// 导出为 OBJ
function exportToOBJ(object) {
  const exporter = new OBJExporter();
  const result = exporter.parse(object);

  const blob = new Blob([result], { type: 'text/plain' });
  return blob;
}
```

### 自定义二进制格式

```javascript
// 简单的自定义网格格式
class CustomMeshFormat {
  static MAGIC = 0x4D455348;  // 'MESH'
  static VERSION = 1;

  // 编码网格数据
  static encode(geometry) {
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal?.array;
    const uvs = geometry.attributes.uv?.array;
    const indices = geometry.index?.array;

    const vertexCount = positions.length / 3;
    const indexCount = indices?.length || 0;

    // 计算总大小
    const headerSize = 20;  // magic + version + flags + vertexCount + indexCount
    const positionSize = positions.length * 4;
    const normalSize = normals ? normals.length * 4 : 0;
    const uvSize = uvs ? uvs.length * 4 : 0;
    const indexSize = indexCount * 4;

    const totalSize = headerSize + positionSize + normalSize + uvSize + indexSize;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    let offset = 0;

    // 写入头部
    view.setUint32(offset, this.MAGIC, true); offset += 4;
    view.setUint32(offset, this.VERSION, true); offset += 4;

    // 标志位
    let flags = 0;
    if (normals) flags |= 0x01;
    if (uvs) flags |= 0x02;
    if (indices) flags |= 0x04;
    view.setUint32(offset, flags, true); offset += 4;

    view.setUint32(offset, vertexCount, true); offset += 4;
    view.setUint32(offset, indexCount, true); offset += 4;

    // 写入数据
    const floatView = new Float32Array(buffer, offset);
    let floatOffset = 0;

    // 位置
    floatView.set(positions, floatOffset);
    floatOffset += positions.length;

    // 法线
    if (normals) {
      floatView.set(normals, floatOffset);
      floatOffset += normals.length;
    }

    // UV
    if (uvs) {
      floatView.set(uvs, floatOffset);
      floatOffset += uvs.length;
    }

    // 索引
    if (indices) {
      const uint32View = new Uint32Array(buffer, offset + floatOffset * 4);
      uint32View.set(indices);
    }

    return buffer;
  }

  // 解码网格数据
  static decode(buffer) {
    const view = new DataView(buffer);
    let offset = 0;

    // 读取头部
    const magic = view.getUint32(offset, true); offset += 4;
    if (magic !== this.MAGIC) {
      throw new Error('Invalid mesh format');
    }

    const version = view.getUint32(offset, true); offset += 4;
    const flags = view.getUint32(offset, true); offset += 4;
    const vertexCount = view.getUint32(offset, true); offset += 4;
    const indexCount = view.getUint32(offset, true); offset += 4;

    const hasNormals = (flags & 0x01) !== 0;
    const hasUVs = (flags & 0x02) !== 0;
    const hasIndices = (flags & 0x04) !== 0;

    // 读取数据
    const positions = new Float32Array(buffer, offset, vertexCount * 3);
    offset += vertexCount * 3 * 4;

    let normals = null;
    if (hasNormals) {
      normals = new Float32Array(buffer, offset, vertexCount * 3);
      offset += vertexCount * 3 * 4;
    }

    let uvs = null;
    if (hasUVs) {
      uvs = new Float32Array(buffer, offset, vertexCount * 2);
      offset += vertexCount * 2 * 4;
    }

    let indices = null;
    if (hasIndices) {
      indices = new Uint32Array(buffer, offset, indexCount);
    }

    // 创建 Three.js 几何体
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    if (normals) {
      geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    }

    if (uvs) {
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    }

    if (indices) {
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    }

    return geometry;
  }
}
```

## 实战示例

### 程序化生成地形网格

```javascript
// 使用高度图生成地形
function createTerrainFromHeightmap(heightmapData, width, height, scale = 1) {
  const geometry = new THREE.BufferGeometry();

  const segmentsX = width - 1;
  const segmentsZ = height - 1;
  const vertexCount = width * height;
  const triangleCount = segmentsX * segmentsZ * 2;

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const indices = new Uint32Array(triangleCount * 3);

  // 生成顶点
  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      const i = z * width + x;
      const heightValue = heightmapData[i] * scale;

      positions[i * 3] = (x - width / 2) * scale;
      positions[i * 3 + 1] = heightValue;
      positions[i * 3 + 2] = (z - height / 2) * scale;

      uvs[i * 2] = x / (width - 1);
      uvs[i * 2 + 1] = z / (height - 1);
    }
  }

  // 生成索引
  let indexOffset = 0;
  for (let z = 0; z < segmentsZ; z++) {
    for (let x = 0; x < segmentsX; x++) {
      const topLeft = z * width + x;
      const topRight = topLeft + 1;
      const bottomLeft = (z + 1) * width + x;
      const bottomRight = bottomLeft + 1;

      // 第一个三角形
      indices[indexOffset++] = topLeft;
      indices[indexOffset++] = bottomLeft;
      indices[indexOffset++] = topRight;

      // 第二个三角形
      indices[indexOffset++] = topRight;
      indices[indexOffset++] = bottomLeft;
      indices[indexOffset++] = bottomRight;
    }
  }

  // 计算法线
  for (let i = 0; i < triangleCount; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];

    const v0 = [positions[i0*3], positions[i0*3+1], positions[i0*3+2]];
    const v1 = [positions[i1*3], positions[i1*3+1], positions[i1*3+2]];
    const v2 = [positions[i2*3], positions[i2*3+1], positions[i2*3+2]];

    const edge1 = [v1[0]-v0[0], v1[1]-v0[1], v1[2]-v0[2]];
    const edge2 = [v2[0]-v0[0], v2[1]-v0[1], v2[2]-v0[2]];

    const normal = [
      edge1[1]*edge2[2] - edge1[2]*edge2[1],
      edge1[2]*edge2[0] - edge1[0]*edge2[2],
      edge1[0]*edge2[1] - edge1[1]*edge2[0]
    ];

    [i0, i1, i2].forEach(idx => {
      normals[idx*3] += normal[0];
      normals[idx*3+1] += normal[1];
      normals[idx*3+2] += normal[2];
    });
  }

  // 归一化法线
  for (let i = 0; i < vertexCount; i++) {
    const x = normals[i*3];
    const y = normals[i*3+1];
    const z = normals[i*3+2];
    const len = Math.sqrt(x*x + y*y + z*z);
    normals[i*3] /= len;
    normals[i*3+1] /= len;
    normals[i*3+2] /= len;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));

  return geometry;
}

// 使用 Perlin 噪声生成高度图
function generateHeightmap(width, height, frequency = 0.05, octaves = 4) {
  const data = new Float32Array(width * height);

  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      let amplitude = 1;
      let freq = frequency;
      let value = 0;
      let maxValue = 0;

      for (let o = 0; o < octaves; o++) {
        value += noise2D(x * freq, z * freq) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        freq *= 2;
      }

      data[z * width + x] = (value / maxValue + 1) / 2;  // 归一化到 0-1
    }
  }

  return data;
}

// 简单的 2D 噪声函数
function noise2D(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}
```

### 网格变形动画

```javascript
// 基于顶点动画的波浪效果
class WaveMesh {
  constructor(geometry, amplitude = 0.5, frequency = 2) {
    this.geometry = geometry;
    this.amplitude = amplitude;
    this.frequency = frequency;

    // 保存原始位置
    this.originalPositions = new Float32Array(
      geometry.attributes.position.array
    );
  }

  update(time) {
    const positions = this.geometry.attributes.position.array;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      const x = this.originalPositions[i * 3];
      const z = this.originalPositions[i * 3 + 2];

      // 波浪函数
      const wave = Math.sin(x * this.frequency + time) *
                   Math.cos(z * this.frequency + time) *
                   this.amplitude;

      positions[i * 3 + 1] = this.originalPositions[i * 3 + 1] + wave;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }
}

// 使用变形目标（Morph Targets）
function setupMorphTargets(geometry, morphGeometries) {
  geometry.morphAttributes.position = [];

  morphGeometries.forEach((morphGeo, index) => {
    const morphPositions = morphGeo.attributes.position.array.slice();
    geometry.morphAttributes.position.push(
      new THREE.BufferAttribute(morphPositions, 3)
    );
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.morphTargetInfluences = new Array(morphGeometries.length).fill(0);

  return mesh;
}

// 动画变形目标
function animateMorph(mesh, targetIndex, duration = 1) {
  const startInfluences = mesh.morphTargetInfluences.slice();
  const targetInfluences = startInfluences.map((_, i) =>
    i === targetIndex ? 1 : 0
  );

  let elapsed = 0;

  function animate(deltaTime) {
    elapsed += deltaTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = smoothstep(0, 1, t);

    mesh.morphTargetInfluences.forEach((_, i) => {
      mesh.morphTargetInfluences[i] =
        startInfluences[i] + (targetInfluences[i] - startInfluences[i]) * eased;
    });

    if (t < 1) {
      requestAnimationFrame(() => animate(1/60));
    }
  }

  animate(0);
}

function smoothstep(min, max, x) {
  x = Math.max(0, Math.min(1, (x - min) / (max - min)));
  return x * x * (3 - 2 * x);
}
```

## 面试要点

### 基础概念题

**Q1: 什么是网格拓扑？为什么它很重要？**

```
网格拓扑指的是网格中顶点、边、面的连接方式和排列结构。

重要性：
1. 变形动画：良好的拓扑使变形更自然，避免穿插
2. UV 展开：均匀的四边形拓扑更容易展开
3. 细分平滑：好的拓扑细分后形状更平滑
4. 性能：合理的顶点分布提高渲染效率

良好拓扑的特征：
- 主要由四边形组成（动画模型）
- 边缘循环沿着形体流向
- 避免三角形和多边形
- 避免极点（5条以上边汇聚的顶点）
```

**Q2: 法线贴图和位移贴图有什么区别？**

```javascript
// 法线贴图（Normal Map）
// - 只改变光照计算，不改变实际几何
// - 性能好，适合细节
// - RGB 值编码法线方向
const normalMap = textureLoader.load('normal.png');
material.normalMap = normalMap;
material.normalScale = new THREE.Vector2(1, 1);

// 位移贴图（Displacement Map）
// - 实际移动顶点位置
// - 需要高面数网格
// - 性能消耗大，效果真实
const displacementMap = textureLoader.load('displacement.png');
material.displacementMap = displacementMap;
material.displacementScale = 0.1;

// 视差贴图（Parallax Map）
// - 介于两者之间
// - 通过深度偏移模拟凹凸
// - 只在片元着色器中计算
```

**Q3: 解释骨骼蒙皮动画的原理**

```javascript
// 骨骼蒙皮的核心概念
// 1. 骨骼层级：父子关系的骨骼树
// 2. 绑定姿势：模型初始状态下的骨骼位置
// 3. 顶点权重：每个顶点受哪些骨骼影响及影响程度

// 蒙皮顶点计算公式
// position = sum(weight_i * bone_i * bindPose_i^-1 * vertex)

// 顶点属性
// boneIndices: 影响该顶点的骨骼索引（通常最多4个）
// boneWeights: 对应的权重（总和为1）

// GPU 蒙皮（在顶点着色器中计算）
const skinningVertexShader = `
  attribute vec4 skinIndex;
  attribute vec4 skinWeight;
  uniform mat4 boneMatrices[MAX_BONES];

  void main() {
    mat4 skinMatrix =
      boneMatrices[int(skinIndex.x)] * skinWeight.x +
      boneMatrices[int(skinIndex.y)] * skinWeight.y +
      boneMatrices[int(skinIndex.z)] * skinWeight.z +
      boneMatrices[int(skinIndex.w)] * skinWeight.w;

    vec4 skinPosition = skinMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * skinPosition;
  }
`;
```

### 性能优化题

**Q4: 如何优化一个包含大量小物体的场景？**

```javascript
// 优化策略（按优先级排序）

// 1. 实例化渲染（适合完全相同的物体）
const instancedMesh = new THREE.InstancedMesh(geometry, material, 10000);

// 2. 静态批处理（适合不动的不同物体）
const mergedGeometry = mergeGeometries(geometries);

// 3. LOD 系统（根据距离切换精度）
const lod = new THREE.LOD();
lod.addLevel(highDetail, 0);
lod.addLevel(lowDetail, 50);

// 4. 视锥体剔除（自动启用）
mesh.frustumCulled = true;

// 5. 遮挡剔除（需要额外实现）

// 6. 空间分割（八叉树、BVH）
// 用于快速确定可见物体集合

// 7. 减少材质变化
// 使用纹理图集合并材质

// 8. 使用低精度索引
// Uint16 而非 Uint32（小于 65536 个顶点时）
```

**Q5: GPU 实例化 vs 静态批处理，如何选择？**

```
GPU 实例化（Instanced Rendering）:
- 优点：支持动态变换、内存效率高
- 缺点：只能使用相同几何体和材质
- 适用：大量相同物体（树木、草、粒子）

静态批处理（Static Batching）:
- 优点：支持不同几何体
- 缺点：物体不能移动、占用更多内存
- 适用：静态场景元素（建筑、岩石）

选择原则：
1. 相同物体 + 需要移动 → 实例化
2. 不同物体 + 静态 → 静态批处理
3. 少量物体 → 不需要优化
4. 移动的不同物体 → 单独渲染或动态批处理
```

### 实战问题

**Q6: 如何处理网格中的 T 型顶点（T-Junction）问题？**

```javascript
// T-Junction 会导致裂缝，因为相邻面不共享边上的顶点
//
//     A ─────── B
//     │         │
//     │    T    │  ← T点在AB边上但不是AB的顶点
//     │   ╱│    │
//     │  ╱ │    │
//     C ───T─── D
//
// 解决方案：确保所有边都被正确分割

function fixTJunctions(geometry) {
  const positions = geometry.attributes.position.array;
  const indices = geometry.index.array;

  // 构建边映射
  const edgeVertices = new Map();

  for (let i = 0; i < indices.length; i += 3) {
    const tri = [indices[i], indices[i+1], indices[i+2]];

    for (let j = 0; j < 3; j++) {
      const v0 = tri[j];
      const v1 = tri[(j + 1) % 3];
      const edgeKey = `${Math.min(v0,v1)}_${Math.max(v0,v1)}`;

      // 检查边上是否有其他顶点
      for (let k = 0; k < positions.length / 3; k++) {
        if (k === v0 || k === v1) continue;

        if (isPointOnEdge(positions, k, v0, v1)) {
          if (!edgeVertices.has(edgeKey)) {
            edgeVertices.set(edgeKey, []);
          }
          edgeVertices.get(edgeKey).push(k);
        }
      }
    }
  }

  // 细分包含额外顶点的边
  // ... 实现细分逻辑
}

function isPointOnEdge(positions, p, v0, v1, tolerance = 0.001) {
  const px = positions[p * 3];
  const py = positions[p * 3 + 1];
  const pz = positions[p * 3 + 2];

  const v0x = positions[v0 * 3];
  const v0y = positions[v0 * 3 + 1];
  const v0z = positions[v0 * 3 + 2];

  const v1x = positions[v1 * 3];
  const v1y = positions[v1 * 3 + 1];
  const v1z = positions[v1 * 3 + 2];

  // 检查点是否在线段上
  const edge = [v1x - v0x, v1y - v0y, v1z - v0z];
  const toPoint = [px - v0x, py - v0y, pz - v0z];

  const edgeLen = Math.sqrt(edge[0]**2 + edge[1]**2 + edge[2]**2);
  const t = (toPoint[0]*edge[0] + toPoint[1]*edge[1] + toPoint[2]*edge[2]) / (edgeLen * edgeLen);

  if (t < 0 || t > 1) return false;

  const closest = [v0x + edge[0]*t, v0y + edge[1]*t, v0z + edge[2]*t];
  const dist = Math.sqrt(
    (px - closest[0])**2 + (py - closest[1])**2 + (pz - closest[2])**2
  );

  return dist < tolerance;
}
```

## 总结

3D 网格是游戏和实时图形应用的基石。掌握网格基础知识对于开发者来说至关重要：

1. **理解基础结构**：顶点、边、面的概念以及它们如何组成网格
2. **掌握数据表示**：缓冲区、顶点属性、索引的组织方式
3. **法线与切线**：光照计算的基础，法线贴图的原理
4. **UV 映射**：纹理坐标的分配和优化
5. **LOD 系统**：距离自适应的细节管理
6. **网格优化**：顶点缓存、批处理、实例化等技术
7. **格式处理**：各种 3D 格式的特点和转换

通过深入理解这些概念，你将能够更好地创建、优化和调试 3D 内容，构建高性能的游戏和可视化应用。
