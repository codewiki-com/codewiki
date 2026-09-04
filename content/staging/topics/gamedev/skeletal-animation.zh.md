---
title: 骨骼动画系统详解
description: 掌握3D角色动画核心技术：骨骼绑定、蒙皮和动画状态机
track: gamedev
section: graphics
difficulty: intermediate
tags:
  - 骨骼动画
  - 蒙皮
  - 角色动画
  - 3D
status: imported
origin: old/src/content/docs/gamedev/skeletal-animation.zh.md
divergence: 0.256
issues: []
legacy:
  category: GameDev
  subcategory: 3D
  order: 30
  lastUpdated: 2026-01-07
---

骨骼动画（Skeletal Animation）是现代游戏和影视制作中最核心的角色动画技术。它通过模拟生物骨骼结构来驱动角色网格变形，实现自然流畅的角色动作。本文将深入探讨骨骼动画系统的各个核心概念和实现技术。

## 概念解释：什么是骨骼动画

### 传统动画与骨骼动画的对比

在骨骼动画出现之前，角色动画主要依赖逐帧动画（Sprite Animation）或顶点动画（Vertex Animation）：

| 技术 | 优点 | 缺点 |
|------|------|------|
| 逐帧动画 | 简单直观，适合2D | 内存占用大，无法实时混合 |
| 顶点动画 | 可表现复杂变形 | 数据量大，难以复用 |
| 骨骼动画 | 数据量小，支持混合和重定向 | 实现复杂，需要骨骼绑定 |

### 骨骼动画的核心优势

1. **内存效率**：只需存储骨骼变换数据，而非每个顶点的位置
2. **动画混合**：可以平滑过渡和叠加多个动画
3. **动画重定向**：同一套动画可应用于不同角色
4. **程序化控制**：支持 IK（反向运动学）和物理驱动
5. **实时交互**：可根据游戏状态动态调整动画

---

## 骨骼层级结构

### 骨骼的基本概念

骨骼（Bone）是骨骼动画系统的基本单元，每根骨骼包含以下属性：

```typescript
// 骨骼数据结构
interface Bone {
  name: string;              // 骨骼名称
  index: number;             // 骨骼索引
  parentIndex: number;       // 父骨骼索引（-1 表示根骨骼）

  // 本地变换（相对于父骨骼）
  localPosition: Vector3;    // 本地位置
  localRotation: Quaternion; // 本地旋转
  localScale: Vector3;       // 本地缩放

  // 绑定姿势（T-Pose 或 A-Pose）
  bindPose: Matrix4;         // 绑定姿势矩阵
  inverseBindPose: Matrix4;  // 绑定姿势逆矩阵
}

// 骨架数据结构
interface Skeleton {
  bones: Bone[];             // 骨骼数组
  rootBoneIndex: number;     // 根骨骼索引
  boneNameToIndex: Map<string, number>; // 名称到索引的映射
}
```

### 骨骼层级树

骨骼以树状结构组织，形成层级关系：

```
Root (根骨骼)
├── Spine (脊椎)
│   ├── Chest (胸部)
│   │   ├── Neck (颈部)
│   │   │   └── Head (头部)
│   │   ├── LeftShoulder (左肩)
│   │   │   └── LeftArm (左上臂)
│   │   │       └── LeftForeArm (左前臂)
│   │   │           └── LeftHand (左手)
│   │   └── RightShoulder (右肩)
│   │       └── RightArm (右上臂)
│   │           └── RightForeArm (右前臂)
│   │               └── RightHand (右手)
│   └── Hips (髋部)
│       ├── LeftUpLeg (左大腿)
│       │   └── LeftLeg (左小腿)
│       │       └── LeftFoot (左脚)
│       └── RightUpLeg (右大腿)
│           └── RightLeg (右小腿)
│               └── RightFoot (右脚)
```

### 骨骼变换计算

骨骼的世界变换通过递归计算父骨骼链得到：

```typescript
class BoneTransformCalculator {
  private skeleton: Skeleton;
  private localTransforms: Matrix4[];   // 每根骨骼的本地变换
  private worldTransforms: Matrix4[];   // 每根骨骼的世界变换
  private skinningMatrices: Matrix4[];  // 蒙皮矩阵

  constructor(skeleton: Skeleton) {
    this.skeleton = skeleton;
    const boneCount = skeleton.bones.length;
    this.localTransforms = new Array(boneCount);
    this.worldTransforms = new Array(boneCount);
    this.skinningMatrices = new Array(boneCount);
  }

  // 更新所有骨骼变换
  updateTransforms(): void {
    const bones = this.skeleton.bones;

    // 从根骨骼开始递归计算
    for (let i = 0; i < bones.length; i++) {
      const bone = bones[i];

      // 计算本地变换矩阵
      this.localTransforms[i] = this.computeLocalMatrix(
        bone.localPosition,
        bone.localRotation,
        bone.localScale
      );

      // 计算世界变换矩阵
      if (bone.parentIndex === -1) {
        // 根骨骼：世界变换 = 本地变换
        this.worldTransforms[i] = this.localTransforms[i].clone();
      } else {
        // 子骨骼：世界变换 = 父骨骼世界变换 * 本地变换
        this.worldTransforms[i] = Matrix4.multiply(
          this.worldTransforms[bone.parentIndex],
          this.localTransforms[i]
        );
      }

      // 计算蒙皮矩阵：世界变换 * 绑定姿势逆矩阵
      this.skinningMatrices[i] = Matrix4.multiply(
        this.worldTransforms[i],
        bone.inverseBindPose
      );
    }
  }

  // 从位置、旋转、缩放构建变换矩阵
  private computeLocalMatrix(
    position: Vector3,
    rotation: Quaternion,
    scale: Vector3
  ): Matrix4 {
    const matrix = new Matrix4();
    matrix.compose(position, rotation, scale);
    return matrix;
  }

  // 获取蒙皮矩阵数组（用于着色器）
  getSkinningMatrices(): Float32Array {
    const result = new Float32Array(this.skinningMatrices.length * 16);
    for (let i = 0; i < this.skinningMatrices.length; i++) {
      result.set(this.skinningMatrices[i].elements, i * 16);
    }
    return result;
  }
}
```

---

## 蒙皮权重

### 蒙皮的基本原理

蒙皮（Skinning）是将网格顶点与骨骼关联的过程。每个顶点可以受多根骨骼影响，影响程度由权重决定。

```typescript
// 顶点蒙皮数据
interface VertexSkinData {
  boneIndices: number[];  // 影响该顶点的骨骼索引（通常4个）
  boneWeights: number[];  // 对应的权重值（总和为1）
}

// 蒙皮网格
interface SkinnedMesh {
  vertices: Vector3[];           // 顶点位置（绑定姿势）
  normals: Vector3[];            // 法线（绑定姿势）
  skinData: VertexSkinData[];    // 每个顶点的蒙皮数据
  skeleton: Skeleton;            // 关联的骨架
}
```

### 线性混合蒙皮（LBS）

线性混合蒙皮（Linear Blend Skinning）是最常用的蒙皮算法：

```typescript
class LinearBlendSkinning {
  // CPU 蒙皮计算
  static computeSkinnedPosition(
    bindPosePosition: Vector3,
    skinData: VertexSkinData,
    skinningMatrices: Matrix4[]
  ): Vector3 {
    const result = new Vector3(0, 0, 0);

    for (let i = 0; i < skinData.boneIndices.length; i++) {
      const boneIndex = skinData.boneIndices[i];
      const weight = skinData.boneWeights[i];

      if (weight > 0) {
        // 将顶点变换到骨骼空间，再变换回世界空间
        const transformed = skinningMatrices[boneIndex]
          .transformPoint(bindPosePosition);

        // 按权重累加
        result.add(transformed.multiplyScalar(weight));
      }
    }

    return result;
  }

  // 法线蒙皮计算（使用法线矩阵）
  static computeSkinnedNormal(
    bindPoseNormal: Vector3,
    skinData: VertexSkinData,
    skinningMatrices: Matrix4[]
  ): Vector3 {
    const result = new Vector3(0, 0, 0);

    for (let i = 0; i < skinData.boneIndices.length; i++) {
      const boneIndex = skinData.boneIndices[i];
      const weight = skinData.boneWeights[i];

      if (weight > 0) {
        // 法线需要使用逆转置矩阵变换
        const normalMatrix = skinningMatrices[boneIndex]
          .getNormalMatrix();
        const transformed = normalMatrix
          .transformDirection(bindPoseNormal);

        result.add(transformed.multiplyScalar(weight));
      }
    }

    return result.normalize();
  }
}
```

### GPU 蒙皮着色器

现代游戏通常在 GPU 上执行蒙皮计算：

```glsl
// 顶点着色器 - GPU 蒙皮
#version 300 es

// 顶点属性
in vec3 a_position;      // 绑定姿势位置
in vec3 a_normal;        // 绑定姿势法线
in vec2 a_texCoord;      // 纹理坐标
in vec4 a_boneIndices;   // 骨骼索引（最多4个）
in vec4 a_boneWeights;   // 骨骼权重（最多4个）

// 统一变量
uniform mat4 u_viewProjection;           // 视图投影矩阵
uniform mat4 u_boneMatrices[MAX_BONES];  // 蒙皮矩阵数组

// 输出到片元着色器
out vec3 v_worldPosition;
out vec3 v_worldNormal;
out vec2 v_texCoord;

void main() {
  // 计算蒙皮矩阵（加权混合）
  mat4 skinMatrix =
    u_boneMatrices[int(a_boneIndices.x)] * a_boneWeights.x +
    u_boneMatrices[int(a_boneIndices.y)] * a_boneWeights.y +
    u_boneMatrices[int(a_boneIndices.z)] * a_boneWeights.z +
    u_boneMatrices[int(a_boneIndices.w)] * a_boneWeights.w;

  // 变换顶点位置
  vec4 skinnedPosition = skinMatrix * vec4(a_position, 1.0);
  v_worldPosition = skinnedPosition.xyz;

  // 变换法线（使用法线矩阵）
  mat3 normalMatrix = mat3(skinMatrix);
  v_worldNormal = normalize(normalMatrix * a_normal);

  // 传递纹理坐标
  v_texCoord = a_texCoord;

  // 输出裁剪空间位置
  gl_Position = u_viewProjection * skinnedPosition;
}
```

### 双四元数蒙皮（DQS）

双四元数蒙皮解决了线性混合蒙皮在大角度旋转时的"糖纸效应"：

```typescript
// 双四元数表示
class DualQuaternion {
  real: Quaternion;  // 实部（表示旋转）
  dual: Quaternion;  // 对偶部（表示平移）

  constructor(rotation: Quaternion, translation: Vector3) {
    this.real = rotation.clone();

    // 对偶部 = 0.5 * translation * rotation
    const t = new Quaternion(translation.x, translation.y, translation.z, 0);
    this.dual = t.multiply(rotation).multiplyScalar(0.5);
  }

  // 从变换矩阵创建
  static fromMatrix(matrix: Matrix4): DualQuaternion {
    const rotation = new Quaternion().setFromRotationMatrix(matrix);
    const translation = new Vector3().setFromMatrixPosition(matrix);
    return new DualQuaternion(rotation, translation);
  }

  // 双四元数混合
  static blend(
    dualQuats: DualQuaternion[],
    weights: number[]
  ): DualQuaternion {
    const result = new DualQuaternion(
      new Quaternion(0, 0, 0, 0),
      new Vector3(0, 0, 0)
    );

    // 确保所有四元数在同一半球
    const reference = dualQuats[0].real;

    for (let i = 0; i < dualQuats.length; i++) {
      const weight = weights[i];
      let dq = dualQuats[i];

      // 检查是否需要取反（保持在同一半球）
      if (reference.dot(dq.real) < 0) {
        dq = dq.negate();
      }

      result.real.x += dq.real.x * weight;
      result.real.y += dq.real.y * weight;
      result.real.z += dq.real.z * weight;
      result.real.w += dq.real.w * weight;

      result.dual.x += dq.dual.x * weight;
      result.dual.y += dq.dual.y * weight;
      result.dual.z += dq.dual.z * weight;
      result.dual.w += dq.dual.w * weight;
    }

    // 归一化
    return result.normalize();
  }

  // 变换点
  transformPoint(point: Vector3): Vector3 {
    // 归一化
    const len = this.real.length();
    const realNorm = this.real.clone().multiplyScalar(1 / len);
    const dualNorm = this.dual.clone().multiplyScalar(1 / len);

    // 提取平移
    const t = dualNorm.multiply(realNorm.conjugate()).multiplyScalar(2);
    const translation = new Vector3(t.x, t.y, t.z);

    // 旋转点并加上平移
    return point.clone()
      .applyQuaternion(realNorm)
      .add(translation);
  }

  private negate(): DualQuaternion {
    const result = new DualQuaternion(
      this.real.clone().multiplyScalar(-1),
      new Vector3(0, 0, 0)
    );
    result.dual = this.dual.clone().multiplyScalar(-1);
    return result;
  }

  private normalize(): DualQuaternion {
    const len = this.real.length();
    this.real.multiplyScalar(1 / len);
    this.dual.multiplyScalar(1 / len);
    return this;
  }
}
```

---

## 关键帧动画

### 关键帧数据结构

```typescript
// 单个关键帧
interface Keyframe<T> {
  time: number;           // 时间（秒）
  value: T;               // 值（位置/旋转/缩放）
  inTangent?: T;          // 入切线（用于曲线插值）
  outTangent?: T;         // 出切线
  interpolation: 'step' | 'linear' | 'cubic'; // 插值类型
}

// 动画通道（控制单个属性）
interface AnimationChannel<T> {
  targetBone: string;     // 目标骨骼名称
  property: 'position' | 'rotation' | 'scale';
  keyframes: Keyframe<T>[];
}

// 动画剪辑
interface AnimationClip {
  name: string;           // 动画名称
  duration: number;       // 持续时间（秒）
  channels: AnimationChannel<any>[];
  events: AnimationEvent[]; // 动画事件
}

// 动画事件
interface AnimationEvent {
  time: number;           // 触发时间
  name: string;           // 事件名称
  parameters: any;        // 事件参数
}
```

### 关键帧采样

```typescript
class AnimationSampler {
  // 在指定时间采样动画通道
  static sample<T>(
    channel: AnimationChannel<T>,
    time: number
  ): T {
    const keyframes = channel.keyframes;

    if (keyframes.length === 0) {
      throw new Error('No keyframes');
    }

    if (keyframes.length === 1 || time <= keyframes[0].time) {
      return keyframes[0].value;
    }

    if (time >= keyframes[keyframes.length - 1].time) {
      return keyframes[keyframes.length - 1].value;
    }

    // 找到包含当前时间的关键帧区间
    let prevIndex = 0;
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time < keyframes[i + 1].time) {
        prevIndex = i;
        break;
      }
    }

    const prevKey = keyframes[prevIndex];
    const nextKey = keyframes[prevIndex + 1];

    // 计算插值因子
    const t = (time - prevKey.time) / (nextKey.time - prevKey.time);

    // 根据插值类型进行插值
    switch (prevKey.interpolation) {
      case 'step':
        return prevKey.value;
      case 'linear':
        return this.linearInterpolate(prevKey.value, nextKey.value, t);
      case 'cubic':
        return this.cubicInterpolate(prevKey, nextKey, t);
      default:
        return prevKey.value;
    }
  }

  // 线性插值
  private static linearInterpolate<T>(a: T, b: T, t: number): T {
    if (a instanceof Vector3) {
      return new Vector3().lerpVectors(a, b as any, t) as any;
    }
    if (a instanceof Quaternion) {
      return new Quaternion().slerpQuaternions(a, b as any, t) as any;
    }
    // 数值插值
    return (a as any) + ((b as any) - (a as any)) * t;
  }

  // 三次 Hermite 插值
  private static cubicInterpolate<T>(
    prevKey: Keyframe<T>,
    nextKey: Keyframe<T>,
    t: number
  ): T {
    const t2 = t * t;
    const t3 = t2 * t;

    // Hermite 基函数
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    const dt = nextKey.time - prevKey.time;

    // 对于 Vector3
    if (prevKey.value instanceof Vector3) {
      const p0 = prevKey.value as Vector3;
      const p1 = nextKey.value as Vector3;
      const m0 = (prevKey.outTangent as Vector3 || new Vector3()).multiplyScalar(dt);
      const m1 = (nextKey.inTangent as Vector3 || new Vector3()).multiplyScalar(dt);

      return new Vector3(
        h00 * p0.x + h10 * m0.x + h01 * p1.x + h11 * m1.x,
        h00 * p0.y + h10 * m0.y + h01 * p1.y + h11 * m1.y,
        h00 * p0.z + h10 * m0.z + h01 * p1.z + h11 * m1.z
      ) as any;
    }

    // 对于四元数，使用球面插值
    if (prevKey.value instanceof Quaternion) {
      return this.linearInterpolate(prevKey.value, nextKey.value, t);
    }

    return prevKey.value;
  }
}
```

---

## 动画插值

### 四元数插值方法

旋转的插值是动画系统中最重要的部分：

```typescript
class QuaternionInterpolation {
  // 球面线性插值（SLERP）
  static slerp(q1: Quaternion, q2: Quaternion, t: number): Quaternion {
    let cosHalfTheta = q1.dot(q2);

    // 确保走最短路径
    if (cosHalfTheta < 0) {
      q2 = q2.clone().multiplyScalar(-1);
      cosHalfTheta = -cosHalfTheta;
    }

    // 如果两个四元数非常接近，使用线性插值
    if (cosHalfTheta > 0.9995) {
      return new Quaternion(
        q1.x + t * (q2.x - q1.x),
        q1.y + t * (q2.y - q1.y),
        q1.z + t * (q2.z - q1.z),
        q1.w + t * (q2.w - q1.w)
      ).normalize();
    }

    const halfTheta = Math.acos(cosHalfTheta);
    const sinHalfTheta = Math.sqrt(1 - cosHalfTheta * cosHalfTheta);

    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    return new Quaternion(
      q1.x * ratioA + q2.x * ratioB,
      q1.y * ratioA + q2.y * ratioB,
      q1.z * ratioA + q2.z * ratioB,
      q1.w * ratioA + q2.w * ratioB
    );
  }

  // 归一化线性插值（NLERP）- 更快但不均匀
  static nlerp(q1: Quaternion, q2: Quaternion, t: number): Quaternion {
    // 确保走最短路径
    if (q1.dot(q2) < 0) {
      q2 = q2.clone().multiplyScalar(-1);
    }

    return new Quaternion(
      q1.x + t * (q2.x - q1.x),
      q1.y + t * (q2.y - q1.y),
      q1.z + t * (q2.z - q1.z),
      q1.w + t * (q2.w - q1.w)
    ).normalize();
  }

  // 球面三次插值（SQUAD）- 用于平滑曲线
  static squad(
    q0: Quaternion,
    q1: Quaternion,
    q2: Quaternion,
    q3: Quaternion,
    t: number
  ): Quaternion {
    // 计算中间控制点
    const s1 = this.intermediate(q0, q1, q2);
    const s2 = this.intermediate(q1, q2, q3);

    // 双重 SLERP
    const slerpQ1Q2 = this.slerp(q1, q2, t);
    const slerpS1S2 = this.slerp(s1, s2, t);

    return this.slerp(slerpQ1Q2, slerpS1S2, 2 * t * (1 - t));
  }

  // 计算 SQUAD 的中间控制点
  private static intermediate(
    qPrev: Quaternion,
    qCurr: Quaternion,
    qNext: Quaternion
  ): Quaternion {
    const qCurrInv = qCurr.clone().invert();

    const logPrev = this.log(qCurrInv.clone().multiply(qPrev));
    const logNext = this.log(qCurrInv.clone().multiply(qNext));

    const sum = new Quaternion(
      -(logPrev.x + logNext.x) / 4,
      -(logPrev.y + logNext.y) / 4,
      -(logPrev.z + logNext.z) / 4,
      0
    );

    return qCurr.clone().multiply(this.exp(sum));
  }

  // 四元数对数
  private static log(q: Quaternion): Quaternion {
    const theta = Math.acos(Math.min(1, Math.max(-1, q.w)));
    const sinTheta = Math.sin(theta);

    if (Math.abs(sinTheta) < 0.0001) {
      return new Quaternion(q.x, q.y, q.z, 0);
    }

    const k = theta / sinTheta;
    return new Quaternion(q.x * k, q.y * k, q.z * k, 0);
  }

  // 四元数指数
  private static exp(q: Quaternion): Quaternion {
    const theta = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z);

    if (theta < 0.0001) {
      return new Quaternion(q.x, q.y, q.z, 1).normalize();
    }

    const k = Math.sin(theta) / theta;
    return new Quaternion(
      q.x * k,
      q.y * k,
      q.z * k,
      Math.cos(theta)
    );
  }
}
```

### 动画混合

```typescript
// 动画混合器
class AnimationBlender {
  // 简单的两个动画混合
  static blend(
    poseA: BonePose[],
    poseB: BonePose[],
    blendFactor: number
  ): BonePose[] {
    const result: BonePose[] = [];

    for (let i = 0; i < poseA.length; i++) {
      result.push({
        position: new Vector3().lerpVectors(
          poseA[i].position,
          poseB[i].position,
          blendFactor
        ),
        rotation: new Quaternion().slerpQuaternions(
          poseA[i].rotation,
          poseB[i].rotation,
          blendFactor
        ),
        scale: new Vector3().lerpVectors(
          poseA[i].scale,
          poseB[i].scale,
          blendFactor
        )
      });
    }

    return result;
  }

  // 加性混合（用于叠加动画层）
  static additiveBlend(
    basePose: BonePose[],
    additivePose: BonePose[],
    referencePose: BonePose[],
    weight: number
  ): BonePose[] {
    const result: BonePose[] = [];

    for (let i = 0; i < basePose.length; i++) {
      // 计算加性差值
      const deltaPosition = additivePose[i].position.clone()
        .sub(referencePose[i].position)
        .multiplyScalar(weight);

      const deltaRotation = referencePose[i].rotation.clone()
        .invert()
        .multiply(additivePose[i].rotation);

      // 应用到基础姿势
      result.push({
        position: basePose[i].position.clone().add(deltaPosition),
        rotation: basePose[i].rotation.clone()
          .slerp(basePose[i].rotation.clone().multiply(deltaRotation), weight),
        scale: basePose[i].scale.clone()
      });
    }

    return result;
  }

  // 遮罩混合（只混合特定骨骼）
  static maskedBlend(
    poseA: BonePose[],
    poseB: BonePose[],
    blendFactor: number,
    boneMask: Map<number, number>  // 骨骼索引 -> 混合权重
  ): BonePose[] {
    const result: BonePose[] = [];

    for (let i = 0; i < poseA.length; i++) {
      const maskWeight = boneMask.get(i) ?? 0;
      const effectiveFactor = blendFactor * maskWeight;

      result.push({
        position: new Vector3().lerpVectors(
          poseA[i].position,
          poseB[i].position,
          effectiveFactor
        ),
        rotation: new Quaternion().slerpQuaternions(
          poseA[i].rotation,
          poseB[i].rotation,
          effectiveFactor
        ),
        scale: new Vector3().lerpVectors(
          poseA[i].scale,
          poseB[i].scale,
          effectiveFactor
        )
      });
    }

    return result;
  }
}

// 骨骼姿势
interface BonePose {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
}
```

---

## 动画状态机

### 状态机架构

```typescript
// 动画状态
interface AnimationState {
  name: string;
  animation: AnimationClip;
  speed: number;
  loop: boolean;
  transitions: StateTransition[];
}

// 状态转换
interface StateTransition {
  targetState: string;
  conditions: TransitionCondition[];
  duration: number;         // 过渡时间
  exitTime?: number;        // 退出时间（0-1，动画进度）
  hasExitTime: boolean;
}

// 转换条件
interface TransitionCondition {
  parameter: string;
  comparison: 'equals' | 'notEquals' | 'greater' | 'less' | 'greaterOrEqual' | 'lessOrEqual';
  threshold: number | boolean;
}

// 动画参数
interface AnimationParameter {
  name: string;
  type: 'float' | 'int' | 'bool' | 'trigger';
  value: number | boolean;
}
```

### 状态机实现

```typescript
class AnimationStateMachine {
  private states: Map<string, AnimationState> = new Map();
  private parameters: Map<string, AnimationParameter> = new Map();
  private currentState: AnimationState | null = null;
  private currentTime: number = 0;
  private transitionInfo: TransitionInfo | null = null;

  // 添加状态
  addState(state: AnimationState): void {
    this.states.set(state.name, state);
    if (!this.currentState) {
      this.currentState = state;
    }
  }

  // 添加参数
  addParameter(param: AnimationParameter): void {
    this.parameters.set(param.name, param);
  }

  // 设置参数值
  setParameter(name: string, value: number | boolean): void {
    const param = this.parameters.get(name);
    if (param) {
      param.value = value;

      // 触发器自动重置
      if (param.type === 'trigger' && value === true) {
        setTimeout(() => { param.value = false; }, 0);
      }
    }
  }

  // 获取参数值
  getParameter(name: string): number | boolean | undefined {
    return this.parameters.get(name)?.value;
  }

  // 更新状态机
  update(deltaTime: number): BonePose[] {
    if (!this.currentState) {
      return [];
    }

    // 检查转换
    if (!this.transitionInfo) {
      this.checkTransitions();
    }

    // 处理转换中
    if (this.transitionInfo) {
      return this.updateTransition(deltaTime);
    }

    // 更新当前状态
    return this.updateCurrentState(deltaTime);
  }

  // 检查是否满足转换条件
  private checkTransitions(): void {
    if (!this.currentState) return;

    for (const transition of this.currentState.transitions) {
      // 检查退出时间
      if (transition.hasExitTime) {
        const normalizedTime = this.currentTime / this.currentState.animation.duration;
        if (normalizedTime < (transition.exitTime ?? 1)) {
          continue;
        }
      }

      // 检查所有条件
      if (this.checkConditions(transition.conditions)) {
        this.startTransition(transition);
        break;
      }
    }
  }

  // 检查条件
  private checkConditions(conditions: TransitionCondition[]): boolean {
    for (const condition of conditions) {
      const param = this.parameters.get(condition.parameter);
      if (!param) return false;

      const value = param.value;
      const threshold = condition.threshold;

      let result = false;
      switch (condition.comparison) {
        case 'equals':
          result = value === threshold;
          break;
        case 'notEquals':
          result = value !== threshold;
          break;
        case 'greater':
          result = (value as number) > (threshold as number);
          break;
        case 'less':
          result = (value as number) < (threshold as number);
          break;
        case 'greaterOrEqual':
          result = (value as number) >= (threshold as number);
          break;
        case 'lessOrEqual':
          result = (value as number) <= (threshold as number);
          break;
      }

      if (!result) return false;
    }

    return conditions.length > 0;
  }

  // 开始转换
  private startTransition(transition: StateTransition): void {
    const targetState = this.states.get(transition.targetState);
    if (!targetState) return;

    this.transitionInfo = {
      fromState: this.currentState!,
      toState: targetState,
      duration: transition.duration,
      elapsed: 0,
      fromTime: this.currentTime,
      toTime: 0
    };
  }

  // 更新转换
  private updateTransition(deltaTime: number): BonePose[] {
    if (!this.transitionInfo) return [];

    this.transitionInfo.elapsed += deltaTime;

    // 更新两个动画的时间
    this.transitionInfo.fromTime += deltaTime * this.transitionInfo.fromState.speed;
    this.transitionInfo.toTime += deltaTime * this.transitionInfo.toState.speed;

    // 计算混合因子
    const blendFactor = Math.min(
      this.transitionInfo.elapsed / this.transitionInfo.duration,
      1
    );

    // 采样两个动画
    const fromPose = this.sampleAnimation(
      this.transitionInfo.fromState.animation,
      this.transitionInfo.fromTime
    );
    const toPose = this.sampleAnimation(
      this.transitionInfo.toState.animation,
      this.transitionInfo.toTime
    );

    // 混合
    const blendedPose = AnimationBlender.blend(fromPose, toPose, blendFactor);

    // 转换完成
    if (blendFactor >= 1) {
      this.currentState = this.transitionInfo.toState;
      this.currentTime = this.transitionInfo.toTime;
      this.transitionInfo = null;
    }

    return blendedPose;
  }

  // 更新当前状态
  private updateCurrentState(deltaTime: number): BonePose[] {
    if (!this.currentState) return [];

    this.currentTime += deltaTime * this.currentState.speed;

    // 处理循环
    if (this.currentState.loop) {
      this.currentTime %= this.currentState.animation.duration;
    } else {
      this.currentTime = Math.min(
        this.currentTime,
        this.currentState.animation.duration
      );
    }

    return this.sampleAnimation(this.currentState.animation, this.currentTime);
  }

  // 采样动画
  private sampleAnimation(clip: AnimationClip, time: number): BonePose[] {
    // 简化实现，实际需要处理所有骨骼
    const poses: BonePose[] = [];

    // 遍历所有通道，采样并构建姿势
    // ...

    return poses;
  }
}

// 转换信息
interface TransitionInfo {
  fromState: AnimationState;
  toState: AnimationState;
  duration: number;
  elapsed: number;
  fromTime: number;
  toTime: number;
}
```

### 混合树（Blend Tree）

```typescript
// 混合树节点类型
type BlendTreeNode =
  | ClipNode
  | Blend1DNode
  | Blend2DNode
  | DirectNode;

// 动画剪辑节点
interface ClipNode {
  type: 'clip';
  clip: AnimationClip;
  speed: number;
}

// 1D 混合节点
interface Blend1DNode {
  type: 'blend1d';
  parameter: string;
  children: {
    threshold: number;
    node: BlendTreeNode;
  }[];
}

// 2D 混合节点（用于移动混合）
interface Blend2DNode {
  type: 'blend2d';
  parameterX: string;
  parameterY: string;
  children: {
    position: { x: number; y: number };
    node: BlendTreeNode;
  }[];
}

// 直接混合节点
interface DirectNode {
  type: 'direct';
  children: {
    parameter: string;  // 权重参数
    node: BlendTreeNode;
  }[];
}

// 混合树求值器
class BlendTreeEvaluator {
  private parameters: Map<string, number>;

  constructor(parameters: Map<string, number>) {
    this.parameters = parameters;
  }

  // 求值混合树
  evaluate(node: BlendTreeNode, time: number): BonePose[] {
    switch (node.type) {
      case 'clip':
        return this.evaluateClip(node, time);
      case 'blend1d':
        return this.evaluateBlend1D(node, time);
      case 'blend2d':
        return this.evaluateBlend2D(node, time);
      case 'direct':
        return this.evaluateDirect(node, time);
    }
  }

  // 求值剪辑节点
  private evaluateClip(node: ClipNode, time: number): BonePose[] {
    const localTime = time * node.speed;
    // 采样动画...
    return [];
  }

  // 求值 1D 混合
  private evaluateBlend1D(node: Blend1DNode, time: number): BonePose[] {
    const paramValue = this.parameters.get(node.parameter) ?? 0;
    const children = node.children.sort((a, b) => a.threshold - b.threshold);

    // 找到相邻的两个节点
    let lowerIndex = 0;
    for (let i = 0; i < children.length - 1; i++) {
      if (paramValue >= children[i].threshold &&
          paramValue < children[i + 1].threshold) {
        lowerIndex = i;
        break;
      }
    }

    const lower = children[lowerIndex];
    const upper = children[Math.min(lowerIndex + 1, children.length - 1)];

    // 计算混合因子
    const range = upper.threshold - lower.threshold;
    const blendFactor = range > 0
      ? (paramValue - lower.threshold) / range
      : 0;

    // 递归求值子节点并混合
    const lowerPose = this.evaluate(lower.node, time);
    const upperPose = this.evaluate(upper.node, time);

    return AnimationBlender.blend(lowerPose, upperPose, blendFactor);
  }

  // 求值 2D 混合
  private evaluateBlend2D(node: Blend2DNode, time: number): BonePose[] {
    const x = this.parameters.get(node.parameterX) ?? 0;
    const y = this.parameters.get(node.parameterY) ?? 0;

    // 使用重心坐标或梯度带混合
    // 这里简化为找最近的三个点进行三角形插值

    const point = { x, y };
    const weights = this.computeBlend2DWeights(point, node.children);

    // 根据权重混合所有子节点
    let result: BonePose[] | null = null;

    for (let i = 0; i < node.children.length; i++) {
      if (weights[i] > 0) {
        const childPose = this.evaluate(node.children[i].node, time);

        if (!result) {
          result = childPose.map(pose => ({
            position: pose.position.clone().multiplyScalar(weights[i]),
            rotation: pose.rotation.clone(),
            scale: pose.scale.clone().multiplyScalar(weights[i])
          }));
        } else {
          // 累加混合
          for (let j = 0; j < result.length; j++) {
            result[j].position.add(
              childPose[j].position.clone().multiplyScalar(weights[i])
            );
            result[j].rotation.slerp(childPose[j].rotation, weights[i]);
            result[j].scale.add(
              childPose[j].scale.clone().multiplyScalar(weights[i])
            );
          }
        }
      }
    }

    return result ?? [];
  }

  // 计算 2D 混合权重
  private computeBlend2DWeights(
    point: { x: number; y: number },
    children: { position: { x: number; y: number }; node: BlendTreeNode }[]
  ): number[] {
    // 简化实现：基于距离的反比权重
    const distances = children.map(child => {
      const dx = point.x - child.position.x;
      const dy = point.y - child.position.y;
      return Math.sqrt(dx * dx + dy * dy);
    });

    const minDist = Math.min(...distances);

    // 如果非常接近某个点，直接使用该点
    if (minDist < 0.001) {
      return distances.map(d => d < 0.001 ? 1 : 0);
    }

    // 反距离加权
    const inverseDistances = distances.map(d => 1 / Math.max(d, 0.001));
    const sum = inverseDistances.reduce((a, b) => a + b, 0);

    return inverseDistances.map(id => id / sum);
  }

  // 求值直接混合
  private evaluateDirect(node: DirectNode, time: number): BonePose[] {
    let result: BonePose[] | null = null;

    for (const child of node.children) {
      const weight = this.parameters.get(child.parameter) ?? 0;

      if (weight > 0) {
        const childPose = this.evaluate(child.node, time);

        if (!result) {
          result = childPose.map(pose => ({
            position: pose.position.clone().multiplyScalar(weight),
            rotation: pose.rotation.clone(),
            scale: pose.scale.clone().multiplyScalar(weight)
          }));
        } else {
          for (let i = 0; i < result.length; i++) {
            result[i].position.add(
              childPose[i].position.clone().multiplyScalar(weight)
            );
            result[i].rotation.slerp(childPose[i].rotation, weight);
            result[i].scale.add(
              childPose[i].scale.clone().multiplyScalar(weight)
            );
          }
        }
      }
    }

    return result ?? [];
  }
}
```

---

## 动画事件

### 事件系统实现

```typescript
// 动画事件
interface AnimationEvent {
  name: string;
  time: number;           // 触发时间（秒）
  intParameter?: number;
  floatParameter?: number;
  stringParameter?: string;
  objectParameter?: any;
}

// 事件监听器
type AnimationEventListener = (event: AnimationEvent) => void;

// 动画事件管理器
class AnimationEventManager {
  private listeners: Map<string, Set<AnimationEventListener>> = new Map();
  private firedEvents: Set<string> = new Set();  // 防止重复触发

  // 添加事件监听
  addEventListener(eventName: string, listener: AnimationEventListener): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(listener);
  }

  // 移除事件监听
  removeEventListener(eventName: string, listener: AnimationEventListener): void {
    this.listeners.get(eventName)?.delete(listener);
  }

  // 检查并触发事件
  checkAndFireEvents(
    events: AnimationEvent[],
    previousTime: number,
    currentTime: number,
    clipDuration: number,
    isLooping: boolean
  ): void {
    for (const event of events) {
      const eventKey = `${event.name}_${event.time}`;

      // 检查事件是否在时间范围内
      let shouldFire = false;

      if (isLooping && currentTime < previousTime) {
        // 循环情况：检查从 previousTime 到结尾，以及从开头到 currentTime
        shouldFire = (event.time > previousTime && event.time <= clipDuration) ||
                     (event.time >= 0 && event.time <= currentTime);
      } else {
        // 非循环情况
        shouldFire = event.time > previousTime && event.time <= currentTime;
      }

      if (shouldFire && !this.firedEvents.has(eventKey)) {
        this.fireEvent(event);
        this.firedEvents.add(eventKey);
      }
    }
  }

  // 触发事件
  private fireEvent(event: AnimationEvent): void {
    const listeners = this.listeners.get(event.name);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch (error) {
          console.error(`Animation event listener error: ${error}`);
        }
      }
    }

    // 也触发通用事件
    const allListeners = this.listeners.get('*');
    if (allListeners) {
      for (const listener of allListeners) {
        try {
          listener(event);
        } catch (error) {
          console.error(`Animation event listener error: ${error}`);
        }
      }
    }
  }

  // 重置事件状态（动画循环时调用）
  reset(): void {
    this.firedEvents.clear();
  }
}

// 使用示例
const eventManager = new AnimationEventManager();

// 注册脚步声事件
eventManager.addEventListener('FootStep', (event) => {
  const foot = event.stringParameter; // 'left' or 'right'
  const surface = detectSurfaceType(characterPosition);
  playFootstepSound(foot, surface);
});

// 注册攻击伤害事件
eventManager.addEventListener('DealDamage', (event) => {
  const damage = event.floatParameter ?? 10;
  const hitbox = event.objectParameter as HitboxConfig;
  activateHitbox(hitbox, damage);
});

// 注册特效事件
eventManager.addEventListener('SpawnEffect', (event) => {
  const effectName = event.stringParameter;
  const boneAttach = event.objectParameter as string;
  spawnParticleEffect(effectName, getBoneWorldPosition(boneAttach));
});
```

---

## 根运动

### 根运动提取与应用

```typescript
// 根运动数据
interface RootMotion {
  deltaPosition: Vector3;  // 位移增量
  deltaRotation: Quaternion; // 旋转增量
}

// 根运动提取器
class RootMotionExtractor {
  private rootBoneIndex: number;
  private previousRootPosition: Vector3;
  private previousRootRotation: Quaternion;

  constructor(skeleton: Skeleton) {
    this.rootBoneIndex = skeleton.rootBoneIndex;
    this.previousRootPosition = new Vector3();
    this.previousRootRotation = new Quaternion();
  }

  // 提取根运动
  extract(currentPose: BonePose[]): RootMotion {
    const rootPose = currentPose[this.rootBoneIndex];

    // 计算增量
    const deltaPosition = rootPose.position.clone()
      .sub(this.previousRootPosition);

    const deltaRotation = this.previousRootRotation.clone()
      .invert()
      .multiply(rootPose.rotation);

    // 更新前一帧数据
    this.previousRootPosition.copy(rootPose.position);
    this.previousRootRotation.copy(rootPose.rotation);

    // 清除骨骼中的根运动（只保留垂直位置和偏航旋转）
    rootPose.position.x = 0;
    rootPose.position.z = 0;

    // 只保留 Y 轴旋转
    const euler = new Euler().setFromQuaternion(rootPose.rotation);
    euler.x = 0;
    euler.z = 0;
    rootPose.rotation.setFromEuler(euler);

    return { deltaPosition, deltaRotation };
  }

  // 重置（动画开始时调用）
  reset(initialPose: BonePose[]): void {
    const rootPose = initialPose[this.rootBoneIndex];
    this.previousRootPosition.copy(rootPose.position);
    this.previousRootRotation.copy(rootPose.rotation);
  }
}

// 角色控制器中应用根运动
class CharacterController {
  private position: Vector3 = new Vector3();
  private rotation: Quaternion = new Quaternion();
  private rootMotionExtractor: RootMotionExtractor;
  private applyRootMotion: boolean = true;

  // 更新角色变换
  update(animatedPose: BonePose[]): void {
    if (this.applyRootMotion) {
      const rootMotion = this.rootMotionExtractor.extract(animatedPose);

      // 将根运动应用到角色位置
      const worldDeltaPosition = rootMotion.deltaPosition.clone()
        .applyQuaternion(this.rotation);

      this.position.add(worldDeltaPosition);
      this.rotation.multiply(rootMotion.deltaRotation);
    }
  }

  // 获取角色世界变换矩阵
  getWorldMatrix(): Matrix4 {
    const matrix = new Matrix4();
    matrix.compose(this.position, this.rotation, new Vector3(1, 1, 1));
    return matrix;
  }
}
```

### 根运动与物理结合

```typescript
// 带物理的角色控制器
class PhysicsCharacterController {
  private characterBody: RigidBody;
  private rootMotionExtractor: RootMotionExtractor;
  private groundNormal: Vector3 = new Vector3(0, 1, 0);

  // 应用根运动到物理系统
  applyRootMotion(rootMotion: RootMotion, deltaTime: number): void {
    // 计算速度
    const velocity = rootMotion.deltaPosition.clone()
      .divideScalar(deltaTime);

    // 将速度投影到地面
    const groundVelocity = this.projectOnPlane(velocity, this.groundNormal);

    // 应用到刚体
    this.characterBody.setLinearVelocity(new Vector3(
      groundVelocity.x,
      this.characterBody.linearVelocity.y, // 保持垂直速度
      groundVelocity.z
    ));

    // 应用旋转
    const currentRotation = this.characterBody.rotation;
    const newRotation = currentRotation.clone()
      .multiply(rootMotion.deltaRotation);
    this.characterBody.setRotation(newRotation);
  }

  // 投影到平面
  private projectOnPlane(vector: Vector3, normal: Vector3): Vector3 {
    const dot = vector.dot(normal);
    return vector.clone().sub(normal.clone().multiplyScalar(dot));
  }
}
```

---

## 动画重定向

### 重定向原理

动画重定向允许将为一个角色创建的动画应用到骨骼结构不同的另一个角色上：

```typescript
// 骨骼映射
interface BoneMapping {
  sourceBone: string;    // 源骨骼名称
  targetBone: string;    // 目标骨骼名称
  rotationOffset?: Quaternion; // 旋转偏移
  positionScale?: Vector3;     // 位置缩放
}

// 重定向配置
interface RetargetConfig {
  boneMappings: BoneMapping[];
  sourceTPose: BonePose[];     // 源角色 T-Pose
  targetTPose: BonePose[];     // 目标角色 T-Pose
  preserveScale: boolean;
}

// 动画重定向器
class AnimationRetargeter {
  private config: RetargetConfig;
  private sourceSkeleton: Skeleton;
  private targetSkeleton: Skeleton;

  // 骨骼名称到索引的映射
  private sourceBoneMap: Map<string, number>;
  private targetBoneMap: Map<string, number>;

  // 预计算的旋转偏移
  private precomputedOffsets: Map<string, Quaternion>;

  constructor(
    sourceSkeleton: Skeleton,
    targetSkeleton: Skeleton,
    config: RetargetConfig
  ) {
    this.sourceSkeleton = sourceSkeleton;
    this.targetSkeleton = targetSkeleton;
    this.config = config;

    this.sourceBoneMap = this.buildBoneMap(sourceSkeleton);
    this.targetBoneMap = this.buildBoneMap(targetSkeleton);

    this.precomputeOffsets();
  }

  // 构建骨骼名称映射
  private buildBoneMap(skeleton: Skeleton): Map<string, number> {
    const map = new Map<string, number>();
    for (let i = 0; i < skeleton.bones.length; i++) {
      map.set(skeleton.bones[i].name, i);
    }
    return map;
  }

  // 预计算 T-Pose 之间的旋转偏移
  private precomputeOffsets(): void {
    this.precomputedOffsets = new Map();

    for (const mapping of this.config.boneMappings) {
      const sourceIndex = this.sourceBoneMap.get(mapping.sourceBone);
      const targetIndex = this.targetBoneMap.get(mapping.targetBone);

      if (sourceIndex !== undefined && targetIndex !== undefined) {
        const sourceTPoseRot = this.config.sourceTPose[sourceIndex].rotation;
        const targetTPoseRot = this.config.targetTPose[targetIndex].rotation;

        // 计算从源 T-Pose 到目标 T-Pose 的旋转差
        const offset = sourceTPoseRot.clone()
          .invert()
          .multiply(targetTPoseRot);

        this.precomputedOffsets.set(mapping.sourceBone, offset);
      }
    }
  }

  // 重定向动画姿势
  retarget(sourcePose: BonePose[]): BonePose[] {
    const targetPose: BonePose[] = [];

    // 初始化目标姿势为 T-Pose
    for (const pose of this.config.targetTPose) {
      targetPose.push({
        position: pose.position.clone(),
        rotation: pose.rotation.clone(),
        scale: pose.scale.clone()
      });
    }

    // 应用映射
    for (const mapping of this.config.boneMappings) {
      const sourceIndex = this.sourceBoneMap.get(mapping.sourceBone);
      const targetIndex = this.targetBoneMap.get(mapping.targetBone);

      if (sourceIndex === undefined || targetIndex === undefined) {
        continue;
      }

      const sourceRotation = sourcePose[sourceIndex].rotation;
      const sourcePosition = sourcePose[sourceIndex].position;

      // 计算源动画相对于源 T-Pose 的旋转
      const sourceTPoseRot = this.config.sourceTPose[sourceIndex].rotation;
      const animationRotation = sourceTPoseRot.clone()
        .invert()
        .multiply(sourceRotation);

      // 应用到目标骨骼
      const targetTPoseRot = this.config.targetTPose[targetIndex].rotation;
      let finalRotation = targetTPoseRot.clone()
        .multiply(animationRotation);

      // 应用配置的旋转偏移
      if (mapping.rotationOffset) {
        finalRotation = finalRotation.multiply(mapping.rotationOffset);
      }

      targetPose[targetIndex].rotation = finalRotation;

      // 处理位置（主要用于根骨骼）
      if (mapping.positionScale) {
        const sourceTPosePos = this.config.sourceTPose[sourceIndex].position;
        const targetTPosePos = this.config.targetTPose[targetIndex].position;

        const positionDelta = sourcePosition.clone().sub(sourceTPosePos);
        positionDelta.multiply(mapping.positionScale);

        targetPose[targetIndex].position = targetTPosePos.clone()
          .add(positionDelta);
      }
    }

    return targetPose;
  }
}
```

### IK 辅助重定向

```typescript
// 使用 IK 修正手脚位置
class RetargetIKCorrector {
  private ikSolver: IKSolver;

  // 修正重定向后的姿势
  correctPose(
    retargetedPose: BonePose[],
    targetSkeleton: Skeleton,
    ikTargets: IKTarget[]
  ): BonePose[] {
    const correctedPose = retargetedPose.map(p => ({
      position: p.position.clone(),
      rotation: p.rotation.clone(),
      scale: p.scale.clone()
    }));

    for (const target of ikTargets) {
      // 应用 IK 修正
      this.ikSolver.solve(
        correctedPose,
        targetSkeleton,
        target.chainBones,
        target.targetPosition,
        target.targetRotation
      );
    }

    return correctedPose;
  }
}

// IK 目标
interface IKTarget {
  chainBones: string[];      // IK 链骨骼
  targetPosition: Vector3;   // 目标位置
  targetRotation?: Quaternion; // 目标旋转
}
```

---

## 实战案例：完整的角色动画系统

### 角色动画控制器

```typescript
// 角色动画控制器
class CharacterAnimator {
  private skeleton: Skeleton;
  private skinnedMesh: SkinnedMesh;
  private stateMachine: AnimationStateMachine;
  private eventManager: AnimationEventManager;
  private rootMotionExtractor: RootMotionExtractor;
  private boneTransformCalculator: BoneTransformCalculator;

  private currentPose: BonePose[] = [];
  private previousTime: number = 0;

  constructor(
    skeleton: Skeleton,
    skinnedMesh: SkinnedMesh,
    animationClips: Map<string, AnimationClip>
  ) {
    this.skeleton = skeleton;
    this.skinnedMesh = skinnedMesh;
    this.boneTransformCalculator = new BoneTransformCalculator(skeleton);
    this.rootMotionExtractor = new RootMotionExtractor(skeleton);
    this.eventManager = new AnimationEventManager();

    this.setupStateMachine(animationClips);
    this.setupAnimationEvents();
  }

  // 设置状态机
  private setupStateMachine(clips: Map<string, AnimationClip>): void {
    this.stateMachine = new AnimationStateMachine();

    // 添加参数
    this.stateMachine.addParameter({ name: 'Speed', type: 'float', value: 0 });
    this.stateMachine.addParameter({ name: 'IsGrounded', type: 'bool', value: true });
    this.stateMachine.addParameter({ name: 'Jump', type: 'trigger', value: false });
    this.stateMachine.addParameter({ name: 'Attack', type: 'trigger', value: false });

    // 添加状态
    this.stateMachine.addState({
      name: 'Idle',
      animation: clips.get('idle')!,
      speed: 1,
      loop: true,
      transitions: [
        {
          targetState: 'Walk',
          conditions: [{ parameter: 'Speed', comparison: 'greater', threshold: 0.1 }],
          duration: 0.2,
          hasExitTime: false
        },
        {
          targetState: 'Jump',
          conditions: [{ parameter: 'Jump', comparison: 'equals', threshold: true }],
          duration: 0.1,
          hasExitTime: false
        }
      ]
    });

    this.stateMachine.addState({
      name: 'Walk',
      animation: clips.get('walk')!,
      speed: 1,
      loop: true,
      transitions: [
        {
          targetState: 'Idle',
          conditions: [{ parameter: 'Speed', comparison: 'less', threshold: 0.1 }],
          duration: 0.2,
          hasExitTime: false
        },
        {
          targetState: 'Run',
          conditions: [{ parameter: 'Speed', comparison: 'greater', threshold: 0.6 }],
          duration: 0.2,
          hasExitTime: false
        }
      ]
    });

    this.stateMachine.addState({
      name: 'Run',
      animation: clips.get('run')!,
      speed: 1,
      loop: true,
      transitions: [
        {
          targetState: 'Walk',
          conditions: [{ parameter: 'Speed', comparison: 'less', threshold: 0.6 }],
          duration: 0.2,
          hasExitTime: false
        }
      ]
    });

    this.stateMachine.addState({
      name: 'Jump',
      animation: clips.get('jump')!,
      speed: 1,
      loop: false,
      transitions: [
        {
          targetState: 'Idle',
          conditions: [{ parameter: 'IsGrounded', comparison: 'equals', threshold: true }],
          duration: 0.2,
          exitTime: 0.8,
          hasExitTime: true
        }
      ]
    });
  }

  // 设置动画事件
  private setupAnimationEvents(): void {
    this.eventManager.addEventListener('FootStep', (event) => {
      console.log(`Footstep: ${event.stringParameter}`);
      // 播放脚步声
    });

    this.eventManager.addEventListener('JumpStart', () => {
      console.log('Jump started');
      // 播放跳跃声效
    });

    this.eventManager.addEventListener('Land', () => {
      console.log('Landed');
      // 播放落地声效和特效
    });
  }

  // 更新动画
  update(deltaTime: number): RootMotion | null {
    // 更新状态机
    this.currentPose = this.stateMachine.update(deltaTime);

    if (this.currentPose.length === 0) {
      return null;
    }

    // 提取根运动
    const rootMotion = this.rootMotionExtractor.extract(this.currentPose);

    // 更新骨骼变换
    this.updateBoneTransforms();

    // 更新蒙皮
    this.updateSkinning();

    return rootMotion;
  }

  // 更新骨骼变换
  private updateBoneTransforms(): void {
    // 将动画姿势应用到骨骼
    for (let i = 0; i < this.skeleton.bones.length; i++) {
      const bone = this.skeleton.bones[i];
      const pose = this.currentPose[i];

      bone.localPosition = pose.position;
      bone.localRotation = pose.rotation;
      bone.localScale = pose.scale;
    }

    // 计算世界变换和蒙皮矩阵
    this.boneTransformCalculator.updateTransforms();
  }

  // 更新蒙皮
  private updateSkinning(): void {
    const skinningMatrices = this.boneTransformCalculator.getSkinningMatrices();

    // 将蒙皮矩阵传递给着色器
    // 或者在 CPU 上执行蒙皮计算
  }

  // 设置参数
  setFloat(name: string, value: number): void {
    this.stateMachine.setParameter(name, value);
  }

  setBool(name: string, value: boolean): void {
    this.stateMachine.setParameter(name, value);
  }

  setTrigger(name: string): void {
    this.stateMachine.setParameter(name, true);
  }
}
```

### 使用示例

```typescript
// 创建角色动画系统
async function createCharacterAnimation() {
  // 加载骨骼和网格
  const { skeleton, skinnedMesh } = await loadCharacterModel('character.glb');

  // 加载动画
  const animationClips = new Map<string, AnimationClip>();
  animationClips.set('idle', await loadAnimation('idle.glb'));
  animationClips.set('walk', await loadAnimation('walk.glb'));
  animationClips.set('run', await loadAnimation('run.glb'));
  animationClips.set('jump', await loadAnimation('jump.glb'));

  // 创建动画控制器
  const animator = new CharacterAnimator(skeleton, skinnedMesh, animationClips);

  // 游戏循环
  function gameLoop(deltaTime: number) {
    // 根据输入更新参数
    const inputSpeed = getInputSpeed(); // 0-1
    animator.setFloat('Speed', inputSpeed);
    animator.setBool('IsGrounded', isCharacterGrounded());

    if (isJumpPressed()) {
      animator.setTrigger('Jump');
    }

    // 更新动画并获取根运动
    const rootMotion = animator.update(deltaTime);

    if (rootMotion) {
      // 应用根运动到角色位置
      applyRootMotionToCharacter(rootMotion);
    }

    // 渲染
    render();

    requestAnimationFrame(() => gameLoop(1/60));
  }

  gameLoop(1/60);
}
```

---

## 性能优化

### GPU 蒙皮优化

```typescript
// 使用纹理存储蒙皮矩阵（支持更多骨骼）
class TextureSkinning {
  private boneTexture: DataTexture;
  private boneTextureSize: number;

  constructor(maxBones: number) {
    // 计算纹理尺寸（每个骨骼需要 4 个 RGBA 像素存储 4x4 矩阵）
    this.boneTextureSize = Math.ceil(Math.sqrt(maxBones * 4));

    // 创建数据纹理
    const size = this.boneTextureSize * this.boneTextureSize;
    const data = new Float32Array(size * 4);

    this.boneTexture = new DataTexture(
      data,
      this.boneTextureSize,
      this.boneTextureSize,
      RGBAFormat,
      FloatType
    );
    this.boneTexture.needsUpdate = true;
  }

  // 更新蒙皮矩阵纹理
  updateBoneTexture(skinningMatrices: Float32Array): void {
    const data = this.boneTexture.image.data as Float32Array;

    for (let i = 0; i < skinningMatrices.length; i++) {
      data[i] = skinningMatrices[i];
    }

    this.boneTexture.needsUpdate = true;
  }
}
```

### 动画压缩

```typescript
// 动画数据压缩
class AnimationCompressor {
  // 关键帧简化（去除冗余关键帧）
  static simplifyKeyframes<T>(
    keyframes: Keyframe<T>[],
    tolerance: number
  ): Keyframe<T>[] {
    if (keyframes.length <= 2) {
      return keyframes;
    }

    const result: Keyframe<T>[] = [keyframes[0]];

    for (let i = 1; i < keyframes.length - 1; i++) {
      const prev = keyframes[i - 1];
      const curr = keyframes[i];
      const next = keyframes[i + 1];

      // 计算线性插值结果
      const t = (curr.time - prev.time) / (next.time - prev.time);
      const interpolated = AnimationSampler.linearInterpolate(
        prev.value,
        next.value,
        t
      );

      // 如果误差超过容差，保留这个关键帧
      if (this.computeError(curr.value, interpolated) > tolerance) {
        result.push(curr);
      }
    }

    result.push(keyframes[keyframes.length - 1]);
    return result;
  }

  // 量化压缩（降低精度以减少存储）
  static quantize(value: number, bits: number): number {
    const max = Math.pow(2, bits) - 1;
    const quantized = Math.round(value * max);
    return quantized / max;
  }

  // 计算误差
  private static computeError(a: any, b: any): number {
    if (a instanceof Vector3) {
      return a.distanceTo(b);
    }
    if (a instanceof Quaternion) {
      return Math.abs(1 - Math.abs(a.dot(b)));
    }
    return Math.abs(a - b);
  }
}
```

### 动画 LOD

```typescript
// 动画细节层次
class AnimationLOD {
  private fullFPSAnimation: AnimationClip;
  private halfFPSAnimation: AnimationClip;
  private quarterFPSAnimation: AnimationClip;

  constructor(clip: AnimationClip) {
    this.fullFPSAnimation = clip;
    this.halfFPSAnimation = this.reduceFrameRate(clip, 2);
    this.quarterFPSAnimation = this.reduceFrameRate(clip, 4);
  }

  // 根据距离选择动画
  getAnimationForDistance(distance: number): AnimationClip {
    if (distance < 10) {
      return this.fullFPSAnimation;
    } else if (distance < 30) {
      return this.halfFPSAnimation;
    } else {
      return this.quarterFPSAnimation;
    }
  }

  // 降低帧率
  private reduceFrameRate(clip: AnimationClip, factor: number): AnimationClip {
    const reduced: AnimationClip = {
      name: clip.name,
      duration: clip.duration,
      channels: [],
      events: clip.events
    };

    for (const channel of clip.channels) {
      const reducedKeyframes = channel.keyframes.filter(
        (_, index) => index % factor === 0
      );

      reduced.channels.push({
        ...channel,
        keyframes: reducedKeyframes
      });
    }

    return reduced;
  }
}
```

---

## 面试要点

### 核心概念题

**Q1: 解释线性混合蒙皮（LBS）的原理和局限性**

```
线性混合蒙皮原理：
1. 每个顶点关联多个骨骼和对应权重
2. 顶点最终位置 = 各骨骼变换后位置的加权平均
3. 公式：v' = Σ(wi * Mi * v)，wi为权重，Mi为蒙皮矩阵

局限性：
1. 糖纸效应：大角度旋转时体积塌陷
2. 无法表现肌肉膨胀等非线性变形
3. 对扭曲动作效果较差

解决方案：
- 双四元数蒙皮（DQS）
- 混合形状/变形目标
- 物理肌肉系统
```

**Q2: 动画状态机中如何实现平滑过渡？**

```typescript
// 状态过渡的核心是混合两个动画
class StateTransition {
  // 1. 记录过渡开始时两个状态的时间
  startTransition(from: State, to: State, duration: number) {
    this.fromTime = from.currentTime;
    this.toTime = 0;
    this.duration = duration;
    this.elapsed = 0;
  }

  // 2. 每帧更新混合因子
  update(deltaTime: number): BonePose[] {
    this.elapsed += deltaTime;
    const blendFactor = Math.min(this.elapsed / this.duration, 1);

    // 3. 采样两个动画并混合
    const poseA = sampleAnimation(this.from, this.fromTime);
    const poseB = sampleAnimation(this.to, this.toTime);

    return blend(poseA, poseB, blendFactor);
  }
}

// 关键点：
// - 使用球面线性插值（SLERP）混合旋转
// - 过渡期间两个动画都在播放
// - 混合因子从0渐变到1
```

**Q3: 什么是动画重定向？如何处理不同骨骼比例？**

```
动画重定向：将A角色的动画应用到骨骼结构不同的B角色

处理方法：
1. 骨骼映射：建立源/目标骨骼的对应关系

2. 旋转重定向：
   - 计算源动画相对于源T-Pose的旋转差
   - 将旋转差应用到目标T-Pose上

3. 位置缩放：
   - 根据骨骼长度比例缩放位置偏移
   - 特别是根运动的位置缩放

4. IK修正：
   - 对于手脚接触点使用IK调整
   - 保证脚接地、手持物等约束
```

### 性能优化题

**Q4: 如何优化大量角色的动画性能？**

```
1. GPU蒙皮：
   - 在顶点着色器中计算蒙皮
   - 使用纹理存储大量骨骼矩阵

2. 动画LOD：
   - 远距离角色使用低帧率动画
   - 极远距离禁用动画或使用简化骨骼

3. 动画实例化：
   - 共享动画采样结果
   - 使用时间偏移创造变化

4. 异步计算：
   - 使用Web Worker计算动画
   - 分帧更新不同角色

5. 数据压缩：
   - 关键帧简化
   - 数值量化
   - 曲线压缩
```

**Q5: 骨骼动画内存占用优化策略？**

```typescript
// 1. 动画数据共享
class AnimationLibrary {
  private clips: Map<string, AnimationClip> = new Map();

  // 多个角色共享同一份动画数据
  getClip(name: string): AnimationClip {
    return this.clips.get(name)!;
  }
}

// 2. 关键帧压缩
// - 使用更少的关键帧（曲线拟合）
// - 使用16位浮点数而非32位
// - 对旋转使用最小表示（3个分量）

// 3. 骨骼数量优化
// - 移除不必要的骨骼
// - 使用骨骼LOD

// 4. 流式加载
// - 只加载当前需要的动画
// - 按需加载远距离角色的动画
```

### 常见陷阱

```typescript
// 1. 四元数插值方向错误
// 错误：直接线性插值
const wrong = q1.lerp(q2, t); // 可能走长路径

// 正确：确保最短路径
if (q1.dot(q2) < 0) {
  q2 = q2.negate();
}
const correct = q1.slerp(q2, t);

// 2. 蒙皮矩阵计算顺序
// 错误顺序
const wrong = worldMatrix * bindPose; // 错误

// 正确：世界变换 * 绑定姿势逆矩阵
const correct = worldMatrix * inverseBindPose;

// 3. 根运动提取时机
// 应该在应用姿势之前提取根运动
// 否则会影响后续的骨骼计算

// 4. 动画事件重复触发
// 需要记录已触发的事件，防止每帧重复触发
```

---

## 总结

骨骼动画是游戏开发中不可或缺的核心技术。要精通骨骼动画系统，需要掌握：

1. **骨骼层级**：理解骨骼树结构和变换传递
2. **蒙皮算法**：掌握 LBS、DQS 等蒙皮技术
3. **关键帧动画**：理解动画数据存储和采样
4. **插值技术**：熟练运用各种插值算法
5. **状态机**：设计灵活的动画状态管理
6. **事件系统**：实现动画与游戏逻辑的联动
7. **根运动**：正确提取和应用角色位移
8. **重定向**：实现动画在不同角色间的复用
9. **性能优化**：GPU 蒙皮、LOD、数据压缩等

通过深入理解这些概念并在实践中不断积累经验，你将能够构建出专业级的角色动画系统。
