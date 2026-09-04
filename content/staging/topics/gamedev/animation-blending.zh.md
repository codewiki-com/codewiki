---
title: 动画混合与 IK 系统
description: 实现流畅的角色动画：混合树、叠加动画和逆向运动学(IK)
track: gamedev
section: graphics
difficulty: advanced
tags:
  - 动画混合
  - IK
  - 混合树
  - 角色动画
status: imported
origin: old/src/content/docs/gamedev/animation-blending.zh.md
divergence: 0.217
issues:
  - title-lang-en
  - title-language
legacy:
  category: GameDev
  subcategory: 3D
  order: 31
  lastUpdated: 2026-01-07
---

动画混合（Animation Blending）和逆向运动学（Inverse Kinematics，IK）是现代游戏开发中实现流畅、自然角色动画的核心技术。无论是 AAA 大作还是独立游戏，掌握这些技术都是创建高质量角色动画系统的关键。

## 概念解释

### 为什么需要动画混合

在传统动画系统中，角色在不同动画状态之间的切换往往是瞬间完成的，这会导致明显的跳跃感。动画混合技术通过在多个动画之间进行插值，实现平滑过渡：

```
传统方式：站立 -> [瞬间切换] -> 奔跑
混合方式：站立 -> [渐变过渡] -> 奔跑
```

### 动画混合的类型

| 混合类型 | 说明 | 应用场景 |
|---------|------|---------|
| 交叉淡入淡出 | 两个动画之间的线性过渡 | 状态切换 |
| 1D 混合树 | 基于单一参数的多动画混合 | 移动速度控制 |
| 2D 混合树 | 基于两个参数的多动画混合 | 方向性移动 |
| 叠加动画 | 在基础动画上叠加额外动作 | 受伤、呼吸效果 |
| 分层动画 | 不同身体部位播放不同动画 | 边跑边射击 |

### 逆向运动学（IK）

IK 是一种根据末端效应器（如手或脚）的目标位置，反向计算骨骼链各关节角度的技术：

```
正向运动学（FK）：关节角度 -> 末端位置
逆向运动学（IK）：末端位置 -> 关节角度
```

---

## 动画混合基础

### 线性插值混合

最基本的动画混合是两个姿态之间的线性插值：

```typescript
// 基础姿态混合
class PoseBlender {
  /**
   * 在两个姿态之间进行线性插值
   * @param poseA 起始姿态
   * @param poseB 目标姿态
   * @param weight 混合权重 (0-1)
   * @returns 混合后的姿态
   */
  static blend(poseA: Pose, poseB: Pose, weight: number): Pose {
    const result = new Pose(poseA.boneCount);

    for (let i = 0; i < poseA.boneCount; i++) {
      // 位置插值
      result.positions[i] = Vector3.lerp(
        poseA.positions[i],
        poseB.positions[i],
        weight
      );

      // 旋转插值（使用球面线性插值保证平滑）
      result.rotations[i] = Quaternion.slerp(
        poseA.rotations[i],
        poseB.rotations[i],
        weight
      );

      // 缩放插值
      result.scales[i] = Vector3.lerp(
        poseA.scales[i],
        poseB.scales[i],
        weight
      );
    }

    return result;
  }
}

// 姿态数据结构
class Pose {
  positions: Vector3[];
  rotations: Quaternion[];
  scales: Vector3[];
  boneCount: number;

  constructor(boneCount: number) {
    this.boneCount = boneCount;
    this.positions = new Array(boneCount);
    this.rotations = new Array(boneCount);
    this.scales = new Array(boneCount);

    for (let i = 0; i < boneCount; i++) {
      this.positions[i] = new Vector3(0, 0, 0);
      this.rotations[i] = Quaternion.identity();
      this.scales[i] = new Vector3(1, 1, 1);
    }
  }

  clone(): Pose {
    const pose = new Pose(this.boneCount);
    for (let i = 0; i < this.boneCount; i++) {
      pose.positions[i] = this.positions[i].clone();
      pose.rotations[i] = this.rotations[i].clone();
      pose.scales[i] = this.scales[i].clone();
    }
    return pose;
  }
}
```

### 交叉淡入淡出（Crossfade）

交叉淡入淡出是状态机中最常用的过渡方式：

```typescript
class AnimationCrossfade {
  private fromClip: AnimationClip;
  private toClip: AnimationClip;
  private duration: number;
  private elapsed: number = 0;
  private isComplete: boolean = false;

  constructor(from: AnimationClip, to: AnimationClip, duration: number) {
    this.fromClip = from;
    this.toClip = to;
    this.duration = duration;
  }

  update(deltaTime: number): Pose {
    this.elapsed += deltaTime;

    // 计算混合权重
    const t = Math.min(this.elapsed / this.duration, 1.0);
    const weight = this.easeInOut(t);

    if (t >= 1.0) {
      this.isComplete = true;
    }

    // 获取两个动画的当前姿态
    const poseA = this.fromClip.sample(this.fromClip.time);
    const poseB = this.toClip.sample(this.toClip.time);

    // 更新动画时间
    this.fromClip.time += deltaTime;
    this.toClip.time += deltaTime;

    return PoseBlender.blend(poseA, poseB, weight);
  }

  // 平滑的缓动函数
  private easeInOut(t: number): number {
    return t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  get complete(): boolean {
    return this.isComplete;
  }
}

// 使用示例
class AnimationController {
  private currentClip: AnimationClip;
  private crossfade: AnimationCrossfade | null = null;

  transitionTo(newClip: AnimationClip, duration: number = 0.3) {
    if (this.currentClip) {
      this.crossfade = new AnimationCrossfade(
        this.currentClip,
        newClip,
        duration
      );
    }
    this.currentClip = newClip;
  }

  update(deltaTime: number): Pose {
    if (this.crossfade && !this.crossfade.complete) {
      return this.crossfade.update(deltaTime);
    }

    this.currentClip.time += deltaTime;
    return this.currentClip.sample(this.currentClip.time);
  }
}
```

---

## 1D 混合树

1D 混合树根据单一参数（如速度）在多个动画之间进行混合。

### 基本实现

```typescript
interface BlendNode1D {
  clip: AnimationClip;
  threshold: number;  // 该动画对应的参数阈值
}

class BlendTree1D {
  private nodes: BlendNode1D[] = [];
  private parameter: number = 0;

  constructor(nodes: BlendNode1D[]) {
    // 按阈值排序
    this.nodes = nodes.sort((a, b) => a.threshold - b.threshold);
  }

  setParameter(value: number) {
    this.parameter = value;
  }

  sample(time: number): Pose {
    if (this.nodes.length === 0) {
      throw new Error('BlendTree1D: No nodes defined');
    }

    if (this.nodes.length === 1) {
      return this.nodes[0].clip.sample(time);
    }

    // 找到参数所在的区间
    let lowerIndex = 0;
    let upperIndex = this.nodes.length - 1;

    for (let i = 0; i < this.nodes.length - 1; i++) {
      if (this.parameter >= this.nodes[i].threshold &&
          this.parameter <= this.nodes[i + 1].threshold) {
        lowerIndex = i;
        upperIndex = i + 1;
        break;
      }
    }

    // 边界情况处理
    if (this.parameter <= this.nodes[0].threshold) {
      return this.nodes[0].clip.sample(time);
    }
    if (this.parameter >= this.nodes[this.nodes.length - 1].threshold) {
      return this.nodes[this.nodes.length - 1].clip.sample(time);
    }

    // 计算混合权重
    const lower = this.nodes[lowerIndex];
    const upper = this.nodes[upperIndex];
    const range = upper.threshold - lower.threshold;
    const weight = (this.parameter - lower.threshold) / range;

    // 混合两个姿态
    const poseA = lower.clip.sample(time);
    const poseB = upper.clip.sample(time);

    return PoseBlender.blend(poseA, poseB, weight);
  }
}

// 使用示例：移动速度混合
const locomotionBlendTree = new BlendTree1D([
  { clip: idleClip, threshold: 0 },
  { clip: walkClip, threshold: 2 },
  { clip: jogClip, threshold: 4 },
  { clip: runClip, threshold: 6 },
  { clip: sprintClip, threshold: 10 }
]);

// 根据角色速度设置参数
function updateAnimation(characterSpeed: number, deltaTime: number) {
  locomotionBlendTree.setParameter(characterSpeed);
  const pose = locomotionBlendTree.sample(animationTime);
  animationTime += deltaTime;
  return pose;
}
```

### 同步混合

为了避免不同速度动画之间的脚步不同步问题，需要使用归一化时间：

```typescript
class SyncedBlendTree1D {
  private nodes: BlendNode1D[] = [];
  private parameter: number = 0;
  private normalizedTime: number = 0;  // 0-1 之间循环

  setParameter(value: number) {
    this.parameter = value;
  }

  update(deltaTime: number): Pose {
    // 根据参数计算当前主导动画的播放速度
    const dominantNode = this.findDominantNode();
    const playbackRate = this.calculatePlaybackRate();

    // 更新归一化时间
    this.normalizedTime += (deltaTime * playbackRate) / dominantNode.clip.duration;
    this.normalizedTime = this.normalizedTime % 1.0;

    return this.sampleAtNormalizedTime(this.normalizedTime);
  }

  private findDominantNode(): BlendNode1D {
    // 找到权重最大的节点
    let maxWeight = 0;
    let dominant = this.nodes[0];

    for (const node of this.nodes) {
      const weight = this.calculateNodeWeight(node);
      if (weight > maxWeight) {
        maxWeight = weight;
        dominant = node;
      }
    }

    return dominant;
  }

  private calculateNodeWeight(node: BlendNode1D): number {
    // 根据参数计算节点权重
    // 实现省略，与之前的混合逻辑类似
    return 0;
  }

  private calculatePlaybackRate(): number {
    // 可以根据参数调整播放速度
    // 例如：速度越快，动画播放越快
    return this.parameter / 4; // 假设 4 是标准速度
  }

  private sampleAtNormalizedTime(normalizedTime: number): Pose {
    // 使用归一化时间采样所有动画并混合
    // 这样可以保证所有动画在同一相位
    let result: Pose | null = null;

    for (const node of this.nodes) {
      const weight = this.calculateNodeWeight(node);
      if (weight > 0) {
        const actualTime = normalizedTime * node.clip.duration;
        const pose = node.clip.sample(actualTime);

        if (result === null) {
          result = pose;
        } else {
          result = PoseBlender.blend(result, pose, weight);
        }
      }
    }

    return result!;
  }
}
```

---

## 2D 混合树

2D 混合树使用两个参数（如水平和垂直速度）进行混合，常用于方向性移动。

### 自由形式方向混合

```typescript
interface BlendNode2D {
  clip: AnimationClip;
  position: Vector2;  // 在 2D 参数空间中的位置
}

class BlendTree2D {
  private nodes: BlendNode2D[] = [];
  private parameter: Vector2 = new Vector2(0, 0);

  constructor(nodes: BlendNode2D[]) {
    this.nodes = nodes;
  }

  setParameter(x: number, y: number) {
    this.parameter.x = x;
    this.parameter.y = y;
  }

  sample(time: number): Pose {
    // 计算每个节点的权重
    const weights = this.calculateWeights();

    // 归一化权重
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      for (let i = 0; i < weights.length; i++) {
        weights[i] /= totalWeight;
      }
    }

    // 混合所有姿态
    let result: Pose | null = null;
    let accumulatedWeight = 0;

    for (let i = 0; i < this.nodes.length; i++) {
      if (weights[i] > 0.001) {
        const pose = this.nodes[i].clip.sample(time);

        if (result === null) {
          result = pose;
          accumulatedWeight = weights[i];
        } else {
          // 增量混合
          const blendWeight = weights[i] / (accumulatedWeight + weights[i]);
          result = PoseBlender.blend(result, pose, blendWeight);
          accumulatedWeight += weights[i];
        }
      }
    }

    return result!;
  }

  private calculateWeights(): number[] {
    const weights: number[] = [];

    for (const node of this.nodes) {
      // 使用反距离加权
      const distance = Vector2.distance(this.parameter, node.position);

      if (distance < 0.001) {
        // 参数位置非常接近节点
        weights.push(1000);
      } else {
        // 反距离权重
        weights.push(1 / (distance * distance));
      }
    }

    return weights;
  }
}

// 使用示例：八方向移动
const directionalBlendTree = new BlendTree2D([
  // 中心 - 站立
  { clip: idleClip, position: new Vector2(0, 0) },

  // 四个主方向
  { clip: walkForwardClip, position: new Vector2(0, 1) },
  { clip: walkBackwardClip, position: new Vector2(0, -1) },
  { clip: walkLeftClip, position: new Vector2(-1, 0) },
  { clip: walkRightClip, position: new Vector2(1, 0) },

  // 四个对角方向
  { clip: walkForwardLeftClip, position: new Vector2(-0.707, 0.707) },
  { clip: walkForwardRightClip, position: new Vector2(0.707, 0.707) },
  { clip: walkBackwardLeftClip, position: new Vector2(-0.707, -0.707) },
  { clip: walkBackwardRightClip, position: new Vector2(0.707, -0.707) }
]);

// 更新动画
function updateDirectionalAnimation(inputX: number, inputY: number) {
  directionalBlendTree.setParameter(inputX, inputY);
  return directionalBlendTree.sample(animationTime);
}
```

### Delaunay 三角剖分混合

更精确的 2D 混合可以使用三角剖分：

```typescript
interface Triangle {
  indices: [number, number, number];  // 三个顶点的索引
}

class DelaunayBlendTree2D {
  private nodes: BlendNode2D[] = [];
  private triangles: Triangle[] = [];
  private parameter: Vector2 = new Vector2(0, 0);

  constructor(nodes: BlendNode2D[]) {
    this.nodes = nodes;
    this.triangles = this.computeDelaunayTriangulation();
  }

  setParameter(x: number, y: number) {
    this.parameter.x = x;
    this.parameter.y = y;
  }

  sample(time: number): Pose {
    // 找到包含参数点的三角形
    const triangle = this.findContainingTriangle();

    if (!triangle) {
      // 参数在所有三角形外部，找最近的节点
      return this.sampleNearestNode(time);
    }

    // 计算重心坐标
    const weights = this.computeBarycentricCoordinates(triangle);

    // 使用重心坐标混合三个姿态
    const poseA = this.nodes[triangle.indices[0]].clip.sample(time);
    const poseB = this.nodes[triangle.indices[1]].clip.sample(time);
    const poseC = this.nodes[triangle.indices[2]].clip.sample(time);

    // 三个姿态的加权混合
    const poseAB = PoseBlender.blend(poseA, poseB, weights[1] / (weights[0] + weights[1]));
    return PoseBlender.blend(poseAB, poseC, weights[2]);
  }

  private computeDelaunayTriangulation(): Triangle[] {
    // Delaunay 三角剖分算法实现
    // 这里使用 Bowyer-Watson 算法的简化版本
    const triangles: Triangle[] = [];

    // 实际实现中应该使用完整的 Delaunay 算法
    // 这里省略具体实现...

    return triangles;
  }

  private findContainingTriangle(): Triangle | null {
    for (const triangle of this.triangles) {
      if (this.pointInTriangle(this.parameter, triangle)) {
        return triangle;
      }
    }
    return null;
  }

  private pointInTriangle(point: Vector2, triangle: Triangle): boolean {
    const a = this.nodes[triangle.indices[0]].position;
    const b = this.nodes[triangle.indices[1]].position;
    const c = this.nodes[triangle.indices[2]].position;

    const v0 = Vector2.subtract(c, a);
    const v1 = Vector2.subtract(b, a);
    const v2 = Vector2.subtract(point, a);

    const dot00 = Vector2.dot(v0, v0);
    const dot01 = Vector2.dot(v0, v1);
    const dot02 = Vector2.dot(v0, v2);
    const dot11 = Vector2.dot(v1, v1);
    const dot12 = Vector2.dot(v1, v2);

    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return (u >= 0) && (v >= 0) && (u + v <= 1);
  }

  private computeBarycentricCoordinates(triangle: Triangle): [number, number, number] {
    const a = this.nodes[triangle.indices[0]].position;
    const b = this.nodes[triangle.indices[1]].position;
    const c = this.nodes[triangle.indices[2]].position;
    const p = this.parameter;

    const v0 = Vector2.subtract(b, a);
    const v1 = Vector2.subtract(c, a);
    const v2 = Vector2.subtract(p, a);

    const d00 = Vector2.dot(v0, v0);
    const d01 = Vector2.dot(v0, v1);
    const d11 = Vector2.dot(v1, v1);
    const d20 = Vector2.dot(v2, v0);
    const d21 = Vector2.dot(v2, v1);

    const denom = d00 * d11 - d01 * d01;
    const v = (d11 * d20 - d01 * d21) / denom;
    const w = (d00 * d21 - d01 * d20) / denom;
    const u = 1 - v - w;

    return [u, v, w];
  }

  private sampleNearestNode(time: number): Pose {
    let minDistance = Infinity;
    let nearestNode = this.nodes[0];

    for (const node of this.nodes) {
      const distance = Vector2.distance(this.parameter, node.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    }

    return nearestNode.clip.sample(time);
  }
}
```

---

## 叠加动画（Additive Animation）

叠加动画允许在基础动画上添加额外的动作效果，如呼吸、受伤抖动等。

### 叠加动画原理

```typescript
class AdditiveAnimation {
  private baseClip: AnimationClip;      // 基础动画
  private additiveClip: AnimationClip;  // 叠加动画
  private referencePose: Pose;          // 参考姿态（通常是第一帧）
  private weight: number = 1.0;

  constructor(baseClip: AnimationClip, additiveClip: AnimationClip) {
    this.baseClip = baseClip;
    this.additiveClip = additiveClip;
    // 参考姿态通常是叠加动画的第一帧
    this.referencePose = additiveClip.sample(0);
  }

  setWeight(weight: number) {
    this.weight = Math.max(0, Math.min(1, weight));
  }

  sample(baseTime: number, additiveTime: number): Pose {
    // 获取基础姿态
    const basePose = this.baseClip.sample(baseTime);

    // 获取叠加动画当前帧
    const additivePose = this.additiveClip.sample(additiveTime);

    // 计算叠加差值并应用
    return this.applyAdditive(basePose, additivePose, this.referencePose);
  }

  private applyAdditive(base: Pose, additive: Pose, reference: Pose): Pose {
    const result = base.clone();

    for (let i = 0; i < base.boneCount; i++) {
      // 位置叠加：additive - reference
      const positionDelta = Vector3.subtract(
        additive.positions[i],
        reference.positions[i]
      );
      result.positions[i] = Vector3.add(
        base.positions[i],
        Vector3.scale(positionDelta, this.weight)
      );

      // 旋转叠加：使用四元数差值
      const rotationDelta = Quaternion.multiply(
        additive.rotations[i],
        Quaternion.inverse(reference.rotations[i])
      );
      const scaledDelta = Quaternion.slerp(
        Quaternion.identity(),
        rotationDelta,
        this.weight
      );
      result.rotations[i] = Quaternion.multiply(
        scaledDelta,
        base.rotations[i]
      );

      // 缩放叠加：乘法
      const scaleDelta = Vector3.divide(
        additive.scales[i],
        reference.scales[i]
      );
      const scaledScaleDelta = Vector3.lerp(
        new Vector3(1, 1, 1),
        scaleDelta,
        this.weight
      );
      result.scales[i] = Vector3.multiply(base.scales[i], scaledScaleDelta);
    }

    return result;
  }
}

// 使用示例：呼吸效果
class CharacterAnimator {
  private locomotionTree: BlendTree1D;
  private breathingAdditive: AdditiveAnimation;
  private hitReactionAdditive: AdditiveAnimation;

  private breathingTime: number = 0;
  private hitReactionTime: number = 0;
  private hitReactionWeight: number = 0;

  update(deltaTime: number, speed: number): Pose {
    // 基础移动动画
    this.locomotionTree.setParameter(speed);
    let pose = this.locomotionTree.sample(this.locomotionTime);

    // 叠加呼吸效果
    this.breathingTime += deltaTime;
    this.breathingAdditive.setWeight(1.0);
    pose = this.breathingAdditive.applyToPose(pose, this.breathingTime);

    // 叠加受击反应（带衰减）
    if (this.hitReactionWeight > 0) {
      this.hitReactionTime += deltaTime;
      this.hitReactionAdditive.setWeight(this.hitReactionWeight);
      pose = this.hitReactionAdditive.applyToPose(pose, this.hitReactionTime);

      // 衰减受击权重
      this.hitReactionWeight -= deltaTime * 2;
    }

    return pose;
  }

  triggerHitReaction() {
    this.hitReactionTime = 0;
    this.hitReactionWeight = 1.0;
  }
}
```

### 多层叠加

```typescript
class AdditiveLayer {
  clip: AnimationClip;
  referencePose: Pose;
  weight: number;
  time: number;
  speed: number;

  constructor(clip: AnimationClip, weight: number = 1.0, speed: number = 1.0) {
    this.clip = clip;
    this.referencePose = clip.sample(0);
    this.weight = weight;
    this.time = 0;
    this.speed = speed;
  }
}

class MultiLayerAdditiveSystem {
  private layers: AdditiveLayer[] = [];

  addLayer(layer: AdditiveLayer) {
    this.layers.push(layer);
  }

  removeLayer(layer: AdditiveLayer) {
    const index = this.layers.indexOf(layer);
    if (index !== -1) {
      this.layers.splice(index, 1);
    }
  }

  applyToBasePose(basePose: Pose, deltaTime: number): Pose {
    let result = basePose.clone();

    for (const layer of this.layers) {
      if (layer.weight > 0.001) {
        layer.time += deltaTime * layer.speed;

        // 循环播放
        if (layer.time > layer.clip.duration) {
          layer.time = layer.time % layer.clip.duration;
        }

        const additivePose = layer.clip.sample(layer.time);
        result = this.applyAdditiveLayer(result, additivePose, layer);
      }
    }

    return result;
  }

  private applyAdditiveLayer(
    base: Pose,
    additive: Pose,
    layer: AdditiveLayer
  ): Pose {
    const result = base.clone();

    for (let i = 0; i < base.boneCount; i++) {
      // 位置
      const positionDelta = Vector3.subtract(
        additive.positions[i],
        layer.referencePose.positions[i]
      );
      result.positions[i] = Vector3.add(
        base.positions[i],
        Vector3.scale(positionDelta, layer.weight)
      );

      // 旋转
      const rotationDelta = Quaternion.multiply(
        additive.rotations[i],
        Quaternion.inverse(layer.referencePose.rotations[i])
      );
      const scaledDelta = Quaternion.slerp(
        Quaternion.identity(),
        rotationDelta,
        layer.weight
      );
      result.rotations[i] = Quaternion.multiply(scaledDelta, base.rotations[i]);
    }

    return result;
  }
}
```

---

## 动画遮罩（Animation Mask）

动画遮罩允许只对特定骨骼应用动画，实现上半身和下半身播放不同动画。

### 遮罩定义

```typescript
class AnimationMask {
  private boneWeights: Map<string, number> = new Map();

  constructor() {}

  // 设置单个骨骼的权重
  setBoneWeight(boneName: string, weight: number) {
    this.boneWeights.set(boneName, Math.max(0, Math.min(1, weight)));
  }

  // 设置骨骼及其所有子骨骼的权重
  setBoneAndChildrenWeight(
    boneName: string,
    weight: number,
    skeleton: Skeleton
  ) {
    const bone = skeleton.getBoneByName(boneName);
    if (bone) {
      this.setBoneWeightRecursive(bone, weight, skeleton);
    }
  }

  private setBoneWeightRecursive(
    bone: Bone,
    weight: number,
    skeleton: Skeleton
  ) {
    this.boneWeights.set(bone.name, weight);
    for (const childName of bone.children) {
      const child = skeleton.getBoneByName(childName);
      if (child) {
        this.setBoneWeightRecursive(child, weight, skeleton);
      }
    }
  }

  getWeight(boneName: string): number {
    return this.boneWeights.get(boneName) ?? 1.0;
  }

  // 预定义的常用遮罩
  static createUpperBodyMask(skeleton: Skeleton): AnimationMask {
    const mask = new AnimationMask();

    // 先将所有骨骼设为 0
    for (const bone of skeleton.bones) {
      mask.setBoneWeight(bone.name, 0);
    }

    // 上半身骨骼设为 1
    mask.setBoneAndChildrenWeight('Spine', 1, skeleton);

    return mask;
  }

  static createLowerBodyMask(skeleton: Skeleton): AnimationMask {
    const mask = new AnimationMask();

    // 所有骨骼设为 0
    for (const bone of skeleton.bones) {
      mask.setBoneWeight(bone.name, 0);
    }

    // 下半身骨骼设为 1
    mask.setBoneAndChildrenWeight('Hips', 1, skeleton);
    mask.setBoneAndChildrenWeight('LeftUpLeg', 1, skeleton);
    mask.setBoneAndChildrenWeight('RightUpLeg', 1, skeleton);

    // 排除脊柱以上
    mask.setBoneAndChildrenWeight('Spine', 0, skeleton);

    return mask;
  }
}
```

### 分层动画系统

```typescript
interface AnimationLayer {
  name: string;
  clip: AnimationClip | BlendTree1D | BlendTree2D;
  mask: AnimationMask | null;
  weight: number;
  blendMode: 'override' | 'additive';
  time: number;
}

class LayeredAnimationSystem {
  private layers: AnimationLayer[] = [];
  private skeleton: Skeleton;

  constructor(skeleton: Skeleton) {
    this.skeleton = skeleton;
  }

  addLayer(layer: AnimationLayer) {
    this.layers.push(layer);
  }

  setLayerWeight(layerName: string, weight: number) {
    const layer = this.layers.find(l => l.name === layerName);
    if (layer) {
      layer.weight = Math.max(0, Math.min(1, weight));
    }
  }

  update(deltaTime: number): Pose {
    // 从基础层开始
    let resultPose: Pose | null = null;

    for (const layer of this.layers) {
      if (layer.weight < 0.001) continue;

      layer.time += deltaTime;

      // 获取该层的姿态
      const layerPose = this.sampleLayer(layer);

      if (resultPose === null) {
        resultPose = layerPose;
      } else {
        // 应用层混合
        resultPose = this.blendLayer(resultPose, layerPose, layer);
      }
    }

    return resultPose!;
  }

  private sampleLayer(layer: AnimationLayer): Pose {
    if (layer.clip instanceof AnimationClip) {
      return layer.clip.sample(layer.time);
    } else if (layer.clip instanceof BlendTree1D) {
      return layer.clip.sample(layer.time);
    } else {
      return layer.clip.sample(layer.time);
    }
  }

  private blendLayer(base: Pose, layer: Pose, layerConfig: AnimationLayer): Pose {
    const result = base.clone();

    for (let i = 0; i < this.skeleton.bones.length; i++) {
      const boneName = this.skeleton.bones[i].name;

      // 获取遮罩权重
      let maskWeight = 1.0;
      if (layerConfig.mask) {
        maskWeight = layerConfig.mask.getWeight(boneName);
      }

      const finalWeight = layerConfig.weight * maskWeight;

      if (finalWeight < 0.001) continue;

      if (layerConfig.blendMode === 'override') {
        // 覆盖模式：直接混合
        result.positions[i] = Vector3.lerp(
          base.positions[i],
          layer.positions[i],
          finalWeight
        );
        result.rotations[i] = Quaternion.slerp(
          base.rotations[i],
          layer.rotations[i],
          finalWeight
        );
        result.scales[i] = Vector3.lerp(
          base.scales[i],
          layer.scales[i],
          finalWeight
        );
      } else {
        // 叠加模式
        // 这里假设 layer 姿态已经是叠加差值
        const positionDelta = Vector3.scale(layer.positions[i], finalWeight);
        result.positions[i] = Vector3.add(base.positions[i], positionDelta);

        const rotationDelta = Quaternion.slerp(
          Quaternion.identity(),
          layer.rotations[i],
          finalWeight
        );
        result.rotations[i] = Quaternion.multiply(rotationDelta, base.rotations[i]);
      }
    }

    return result;
  }
}

// 使用示例：边跑边射击
const animSystem = new LayeredAnimationSystem(skeleton);

// 基础层：移动动画（全身）
animSystem.addLayer({
  name: 'locomotion',
  clip: locomotionBlendTree,
  mask: null,
  weight: 1.0,
  blendMode: 'override',
  time: 0
});

// 上层：射击动画（仅上半身）
animSystem.addLayer({
  name: 'shooting',
  clip: shootingClip,
  mask: AnimationMask.createUpperBodyMask(skeleton),
  weight: 0.0,  // 默认关闭
  blendMode: 'override',
  time: 0
});

// 射击时启用上半身层
function startShooting() {
  animSystem.setLayerWeight('shooting', 1.0);
}

function stopShooting() {
  animSystem.setLayerWeight('shooting', 0.0);
}
```

---

## 逆向运动学（IK）基础

### IK 链结构

```typescript
interface IKBone {
  index: number;
  length: number;
  minAngle: Vector3;  // 各轴最小角度限制
  maxAngle: Vector3;  // 各轴最大角度限制
}

class IKChain {
  bones: IKBone[] = [];
  totalLength: number = 0;

  constructor(boneIndices: number[], skeleton: Skeleton) {
    for (let i = 0; i < boneIndices.length; i++) {
      const bone = skeleton.bones[boneIndices[i]];
      this.bones.push({
        index: boneIndices[i],
        length: bone.length,
        minAngle: bone.minAngle || new Vector3(-180, -180, -180),
        maxAngle: bone.maxAngle || new Vector3(180, 180, 180)
      });
      this.totalLength += bone.length;
    }
  }
}
```

### CCD（循环坐标下降）IK 算法

CCD 是一种简单高效的 IK 算法，通过迭代调整每个关节来逼近目标：

```typescript
class CCDIKSolver {
  private maxIterations: number = 10;
  private tolerance: number = 0.001;

  solve(
    chain: IKChain,
    pose: Pose,
    skeleton: Skeleton,
    targetPosition: Vector3
  ): Pose {
    const result = pose.clone();

    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      // 获取末端效应器当前位置
      const endEffectorPos = this.getEndEffectorPosition(chain, result, skeleton);

      // 检查是否已达到目标
      if (Vector3.distance(endEffectorPos, targetPosition) < this.tolerance) {
        break;
      }

      // 从末端向根部遍历每个骨骼
      for (let i = chain.bones.length - 1; i >= 0; i--) {
        const bone = chain.bones[i];
        const bonePos = this.getBoneWorldPosition(bone.index, result, skeleton);

        // 当前末端位置
        const currentEnd = this.getEndEffectorPosition(chain, result, skeleton);

        // 计算从当前骨骼到末端的向量
        const toEnd = Vector3.subtract(currentEnd, bonePos);
        // 计算从当前骨骼到目标的向量
        const toTarget = Vector3.subtract(targetPosition, bonePos);

        // 归一化
        const toEndNorm = Vector3.normalize(toEnd);
        const toTargetNorm = Vector3.normalize(toTarget);

        // 计算旋转轴和角度
        const axis = Vector3.cross(toEndNorm, toTargetNorm);
        const axisLength = Vector3.length(axis);

        if (axisLength > 0.0001) {
          const normalizedAxis = Vector3.scale(axis, 1 / axisLength);
          const angle = Math.acos(Math.max(-1, Math.min(1, Vector3.dot(toEndNorm, toTargetNorm))));

          // 创建旋转四元数
          const rotation = Quaternion.fromAxisAngle(normalizedAxis, angle);

          // 应用旋转到骨骼
          result.rotations[bone.index] = Quaternion.multiply(
            rotation,
            result.rotations[bone.index]
          );

          // 应用角度限制
          result.rotations[bone.index] = this.applyAngleLimits(
            result.rotations[bone.index],
            bone.minAngle,
            bone.maxAngle
          );
        }
      }
    }

    return result;
  }

  private getEndEffectorPosition(
    chain: IKChain,
    pose: Pose,
    skeleton: Skeleton
  ): Vector3 {
    const lastBone = chain.bones[chain.bones.length - 1];
    return this.getBoneEndPosition(lastBone.index, pose, skeleton);
  }

  private getBoneWorldPosition(
    boneIndex: number,
    pose: Pose,
    skeleton: Skeleton
  ): Vector3 {
    // 计算骨骼的世界位置
    // 需要遍历父骨骼链累积变换
    let worldPos = pose.positions[boneIndex].clone();
    let parentIndex = skeleton.bones[boneIndex].parentIndex;

    while (parentIndex >= 0) {
      const parentRotation = pose.rotations[parentIndex];
      worldPos = Vector3.add(
        pose.positions[parentIndex],
        Quaternion.rotateVector(parentRotation, worldPos)
      );
      parentIndex = skeleton.bones[parentIndex].parentIndex;
    }

    return worldPos;
  }

  private getBoneEndPosition(
    boneIndex: number,
    pose: Pose,
    skeleton: Skeleton
  ): Vector3 {
    const bonePos = this.getBoneWorldPosition(boneIndex, pose, skeleton);
    const bone = skeleton.bones[boneIndex];

    // 骨骼末端 = 骨骼位置 + 旋转后的骨骼长度向量
    const boneDirection = new Vector3(0, bone.length, 0);
    const rotatedDirection = Quaternion.rotateVector(
      pose.rotations[boneIndex],
      boneDirection
    );

    return Vector3.add(bonePos, rotatedDirection);
  }

  private applyAngleLimits(
    rotation: Quaternion,
    minAngle: Vector3,
    maxAngle: Vector3
  ): Quaternion {
    // 将四元数转换为欧拉角
    const euler = Quaternion.toEuler(rotation);

    // 应用限制
    euler.x = Math.max(minAngle.x, Math.min(maxAngle.x, euler.x));
    euler.y = Math.max(minAngle.y, Math.min(maxAngle.y, euler.y));
    euler.z = Math.max(minAngle.z, Math.min(maxAngle.z, euler.z));

    // 转回四元数
    return Quaternion.fromEuler(euler.x, euler.y, euler.z);
  }
}
```

### FABRIK（前向后向到达逆运动学）算法

FABRIK 是另一种流行的 IK 算法，通常收敛更快：

```typescript
class FABRIKSolver {
  private maxIterations: number = 10;
  private tolerance: number = 0.001;

  solve(
    chain: IKChain,
    pose: Pose,
    skeleton: Skeleton,
    targetPosition: Vector3
  ): Pose {
    const result = pose.clone();

    // 获取所有骨骼的世界位置
    const positions: Vector3[] = [];
    for (const bone of chain.bones) {
      positions.push(this.getBoneWorldPosition(bone.index, result, skeleton));
    }
    // 添加末端效应器位置
    positions.push(this.getEndEffectorPosition(chain, result, skeleton));

    const rootPos = positions[0].clone();

    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      // 检查是否到达目标
      const endPos = positions[positions.length - 1];
      if (Vector3.distance(endPos, targetPosition) < this.tolerance) {
        break;
      }

      // 后向阶段：从末端到根
      positions[positions.length - 1] = targetPosition.clone();

      for (let i = positions.length - 2; i >= 0; i--) {
        const direction = Vector3.subtract(positions[i], positions[i + 1]);
        const normalizedDir = Vector3.normalize(direction);
        positions[i] = Vector3.add(
          positions[i + 1],
          Vector3.scale(normalizedDir, chain.bones[i].length)
        );
      }

      // 前向阶段：从根到末端
      positions[0] = rootPos.clone();

      for (let i = 0; i < positions.length - 1; i++) {
        const direction = Vector3.subtract(positions[i + 1], positions[i]);
        const normalizedDir = Vector3.normalize(direction);
        positions[i + 1] = Vector3.add(
          positions[i],
          Vector3.scale(normalizedDir, chain.bones[i].length)
        );
      }
    }

    // 将位置转换回骨骼旋转
    this.positionsToRotations(chain, positions, result, skeleton);

    return result;
  }

  private positionsToRotations(
    chain: IKChain,
    positions: Vector3[],
    pose: Pose,
    skeleton: Skeleton
  ) {
    for (let i = 0; i < chain.bones.length; i++) {
      const bone = chain.bones[i];
      const currentPos = positions[i];
      const nextPos = positions[i + 1];

      // 计算骨骼应该指向的方向
      const targetDirection = Vector3.normalize(
        Vector3.subtract(nextPos, currentPos)
      );

      // 默认骨骼方向（通常是 Y 轴正方向）
      const defaultDirection = new Vector3(0, 1, 0);

      // 计算从默认方向到目标方向的旋转
      pose.rotations[bone.index] = Quaternion.fromToRotation(
        defaultDirection,
        targetDirection
      );

      // 应用角度限制
      pose.rotations[bone.index] = this.applyAngleLimits(
        pose.rotations[bone.index],
        bone.minAngle,
        bone.maxAngle
      );
    }
  }

  private getBoneWorldPosition(
    boneIndex: number,
    pose: Pose,
    skeleton: Skeleton
  ): Vector3 {
    // 同 CCD 实现
    return new Vector3(0, 0, 0);
  }

  private getEndEffectorPosition(
    chain: IKChain,
    pose: Pose,
    skeleton: Skeleton
  ): Vector3 {
    // 同 CCD 实现
    return new Vector3(0, 0, 0);
  }

  private applyAngleLimits(
    rotation: Quaternion,
    minAngle: Vector3,
    maxAngle: Vector3
  ): Quaternion {
    // 同 CCD 实现
    return rotation;
  }
}
```

---

## 脚部 IK

脚部 IK 是游戏中最常用的 IK 应用，用于使角色的脚正确贴合地面。

### 地面检测

```typescript
interface GroundCheckResult {
  hit: boolean;
  position: Vector3;
  normal: Vector3;
  distance: number;
}

class FootIKSystem {
  private leftFootChain: IKChain;
  private rightFootChain: IKChain;
  private ikSolver: FABRIKSolver;
  private raycastDistance: number = 1.0;
  private footOffset: number = 0.1;  // 脚踝到脚底的距离

  constructor(skeleton: Skeleton) {
    // 创建脚部 IK 链
    this.leftFootChain = new IKChain(
      [skeleton.getBoneIndex('LeftUpLeg'),
       skeleton.getBoneIndex('LeftLeg'),
       skeleton.getBoneIndex('LeftFoot')],
      skeleton
    );

    this.rightFootChain = new IKChain(
      [skeleton.getBoneIndex('RightUpLeg'),
       skeleton.getBoneIndex('RightLeg'),
       skeleton.getBoneIndex('RightFoot')],
      skeleton
    );

    this.ikSolver = new FABRIKSolver();
  }

  update(
    pose: Pose,
    skeleton: Skeleton,
    characterPosition: Vector3,
    physicsWorld: PhysicsWorld
  ): Pose {
    let result = pose.clone();

    // 获取脚的世界位置
    const leftFootPos = this.getFootWorldPosition('left', pose, skeleton, characterPosition);
    const rightFootPos = this.getFootWorldPosition('right', pose, skeleton, characterPosition);

    // 地面射线检测
    const leftGroundCheck = this.checkGround(leftFootPos, physicsWorld);
    const rightGroundCheck = this.checkGround(rightFootPos, physicsWorld);

    // 计算骨盆调整
    const pelvisAdjustment = this.calculatePelvisAdjustment(
      leftGroundCheck,
      rightGroundCheck
    );

    // 应用骨盆调整
    result = this.adjustPelvis(result, skeleton, pelvisAdjustment);

    // 应用左脚 IK
    if (leftGroundCheck.hit) {
      const targetPos = Vector3.add(
        leftGroundCheck.position,
        new Vector3(0, this.footOffset, 0)
      );
      result = this.ikSolver.solve(
        this.leftFootChain,
        result,
        skeleton,
        targetPos
      );

      // 调整脚的旋转以匹配地面法线
      result = this.alignFootToGround(
        result,
        skeleton,
        'LeftFoot',
        leftGroundCheck.normal
      );
    }

    // 应用右脚 IK
    if (rightGroundCheck.hit) {
      const targetPos = Vector3.add(
        rightGroundCheck.position,
        new Vector3(0, this.footOffset, 0)
      );
      result = this.ikSolver.solve(
        this.rightFootChain,
        result,
        skeleton,
        targetPos
      );

      result = this.alignFootToGround(
        result,
        skeleton,
        'RightFoot',
        rightGroundCheck.normal
      );
    }

    return result;
  }

  private checkGround(footPos: Vector3, physicsWorld: PhysicsWorld): GroundCheckResult {
    // 从脚位置向下发射射线
    const rayStart = Vector3.add(footPos, new Vector3(0, this.raycastDistance / 2, 0));
    const rayEnd = Vector3.add(footPos, new Vector3(0, -this.raycastDistance, 0));

    const hitResult = physicsWorld.raycast(rayStart, rayEnd);

    if (hitResult) {
      return {
        hit: true,
        position: hitResult.point,
        normal: hitResult.normal,
        distance: hitResult.distance
      };
    }

    return {
      hit: false,
      position: footPos,
      normal: new Vector3(0, 1, 0),
      distance: this.raycastDistance
    };
  }

  private calculatePelvisAdjustment(
    leftCheck: GroundCheckResult,
    rightCheck: GroundCheckResult
  ): number {
    // 计算需要下移骨盆的距离
    // 取两脚中需要下移更多的那个
    let leftOffset = 0;
    let rightOffset = 0;

    if (leftCheck.hit) {
      leftOffset = leftCheck.position.y - this.footOffset;
    }
    if (rightCheck.hit) {
      rightOffset = rightCheck.position.y - this.footOffset;
    }

    return Math.min(leftOffset, rightOffset);
  }

  private adjustPelvis(
    pose: Pose,
    skeleton: Skeleton,
    adjustment: number
  ): Pose {
    const result = pose.clone();
    const pelvisIndex = skeleton.getBoneIndex('Hips');

    result.positions[pelvisIndex] = Vector3.add(
      pose.positions[pelvisIndex],
      new Vector3(0, adjustment, 0)
    );

    return result;
  }

  private alignFootToGround(
    pose: Pose,
    skeleton: Skeleton,
    footBoneName: string,
    groundNormal: Vector3
  ): Pose {
    const result = pose.clone();
    const footIndex = skeleton.getBoneIndex(footBoneName);

    // 计算将脚对齐到地面法线的旋转
    const upVector = new Vector3(0, 1, 0);
    const alignRotation = Quaternion.fromToRotation(upVector, groundNormal);

    // 只部分应用旋转，避免脚部过度旋转
    const blendedRotation = Quaternion.slerp(
      Quaternion.identity(),
      alignRotation,
      0.5  // 混合因子
    );

    result.rotations[footIndex] = Quaternion.multiply(
      blendedRotation,
      pose.rotations[footIndex]
    );

    return result;
  }

  private getFootWorldPosition(
    side: 'left' | 'right',
    pose: Pose,
    skeleton: Skeleton,
    characterPosition: Vector3
  ): Vector3 {
    const footBoneName = side === 'left' ? 'LeftFoot' : 'RightFoot';
    const footIndex = skeleton.getBoneIndex(footBoneName);

    // 获取脚骨骼的本地位置并转换为世界位置
    const localPos = pose.positions[footIndex];
    return Vector3.add(characterPosition, localPos);
  }
}
```

### 平滑过渡

```typescript
class SmoothFootIK {
  private footIK: FootIKSystem;
  private leftFootTarget: Vector3;
  private rightFootTarget: Vector3;
  private smoothSpeed: number = 10;

  constructor(skeleton: Skeleton) {
    this.footIK = new FootIKSystem(skeleton);
    this.leftFootTarget = new Vector3(0, 0, 0);
    this.rightFootTarget = new Vector3(0, 0, 0);
  }

  update(
    pose: Pose,
    skeleton: Skeleton,
    characterPosition: Vector3,
    physicsWorld: PhysicsWorld,
    deltaTime: number
  ): Pose {
    // 获取理想的脚部目标位置
    const idealLeftTarget = this.getIdealFootTarget('left', pose, skeleton, characterPosition, physicsWorld);
    const idealRightTarget = this.getIdealFootTarget('right', pose, skeleton, characterPosition, physicsWorld);

    // 平滑插值到目标位置
    this.leftFootTarget = Vector3.lerp(
      this.leftFootTarget,
      idealLeftTarget,
      deltaTime * this.smoothSpeed
    );
    this.rightFootTarget = Vector3.lerp(
      this.rightFootTarget,
      idealRightTarget,
      deltaTime * this.smoothSpeed
    );

    // 应用 IK
    return this.applyIK(pose, skeleton, characterPosition);
  }

  private getIdealFootTarget(
    side: 'left' | 'right',
    pose: Pose,
    skeleton: Skeleton,
    characterPosition: Vector3,
    physicsWorld: PhysicsWorld
  ): Vector3 {
    // 地面检测逻辑
    // ...
    return new Vector3(0, 0, 0);
  }

  private applyIK(
    pose: Pose,
    skeleton: Skeleton,
    characterPosition: Vector3
  ): Pose {
    // 使用平滑后的目标位置应用 IK
    // ...
    return pose;
  }
}
```

---

## 手部 IK

手部 IK 用于使角色的手与环境物体交互，如抓握、触摸等。

### 双手 IK 系统

```typescript
interface HandIKTarget {
  position: Vector3;
  rotation: Quaternion;
  weight: number;
}

class HandIKSystem {
  private leftArmChain: IKChain;
  private rightArmChain: IKChain;
  private ikSolver: FABRIKSolver;

  private leftHandTarget: HandIKTarget | null = null;
  private rightHandTarget: HandIKTarget | null = null;

  constructor(skeleton: Skeleton) {
    this.leftArmChain = new IKChain(
      [skeleton.getBoneIndex('LeftShoulder'),
       skeleton.getBoneIndex('LeftArm'),
       skeleton.getBoneIndex('LeftForeArm'),
       skeleton.getBoneIndex('LeftHand')],
      skeleton
    );

    this.rightArmChain = new IKChain(
      [skeleton.getBoneIndex('RightShoulder'),
       skeleton.getBoneIndex('RightArm'),
       skeleton.getBoneIndex('RightForeArm'),
       skeleton.getBoneIndex('RightHand')],
      skeleton
    );

    this.ikSolver = new FABRIKSolver();
  }

  setLeftHandTarget(target: HandIKTarget | null) {
    this.leftHandTarget = target;
  }

  setRightHandTarget(target: HandIKTarget | null) {
    this.rightHandTarget = target;
  }

  update(pose: Pose, skeleton: Skeleton): Pose {
    let result = pose.clone();

    // 左手 IK
    if (this.leftHandTarget && this.leftHandTarget.weight > 0) {
      const ikPose = this.ikSolver.solve(
        this.leftArmChain,
        result,
        skeleton,
        this.leftHandTarget.position
      );

      // 混合 IK 结果
      result = this.blendArmPose(
        result,
        ikPose,
        this.leftArmChain,
        this.leftHandTarget.weight
      );

      // 设置手部旋转
      const handIndex = skeleton.getBoneIndex('LeftHand');
      result.rotations[handIndex] = Quaternion.slerp(
        result.rotations[handIndex],
        this.leftHandTarget.rotation,
        this.leftHandTarget.weight
      );
    }

    // 右手 IK
    if (this.rightHandTarget && this.rightHandTarget.weight > 0) {
      const ikPose = this.ikSolver.solve(
        this.rightArmChain,
        result,
        skeleton,
        this.rightHandTarget.position
      );

      result = this.blendArmPose(
        result,
        ikPose,
        this.rightArmChain,
        this.rightHandTarget.weight
      );

      const handIndex = skeleton.getBoneIndex('RightHand');
      result.rotations[handIndex] = Quaternion.slerp(
        result.rotations[handIndex],
        this.rightHandTarget.rotation,
        this.rightHandTarget.weight
      );
    }

    return result;
  }

  private blendArmPose(
    basePose: Pose,
    ikPose: Pose,
    chain: IKChain,
    weight: number
  ): Pose {
    const result = basePose.clone();

    for (const bone of chain.bones) {
      result.rotations[bone.index] = Quaternion.slerp(
        basePose.rotations[bone.index],
        ikPose.rotations[bone.index],
        weight
      );
    }

    return result;
  }
}

// 使用示例：抓取物体
class GrabSystem {
  private handIK: HandIKSystem;
  private currentGrabTarget: Transform | null = null;
  private grabWeight: number = 0;
  private grabSpeed: number = 5;

  constructor(skeleton: Skeleton) {
    this.handIK = new HandIKSystem(skeleton);
  }

  startGrab(targetObject: Transform) {
    this.currentGrabTarget = targetObject;
  }

  endGrab() {
    this.currentGrabTarget = null;
  }

  update(pose: Pose, skeleton: Skeleton, deltaTime: number): Pose {
    // 平滑过渡抓取权重
    const targetWeight = this.currentGrabTarget ? 1.0 : 0.0;
    this.grabWeight = this.lerp(
      this.grabWeight,
      targetWeight,
      deltaTime * this.grabSpeed
    );

    if (this.grabWeight > 0.01 && this.currentGrabTarget) {
      // 设置右手目标
      this.handIK.setRightHandTarget({
        position: this.currentGrabTarget.position,
        rotation: this.currentGrabTarget.rotation,
        weight: this.grabWeight
      });
    } else {
      this.handIK.setRightHandTarget(null);
    }

    return this.handIK.update(pose, skeleton);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
}
```

### 瞄准 IK

```typescript
class AimIKSystem {
  private spineChain: IKChain;
  private rightArmChain: IKChain;
  private skeleton: Skeleton;

  private aimTarget: Vector3 | null = null;
  private aimWeight: number = 0;

  constructor(skeleton: Skeleton) {
    this.skeleton = skeleton;

    // 脊柱链用于身体转向
    this.spineChain = new IKChain(
      [skeleton.getBoneIndex('Spine'),
       skeleton.getBoneIndex('Spine1'),
       skeleton.getBoneIndex('Spine2')],
      skeleton
    );

    // 右臂链用于持枪瞄准
    this.rightArmChain = new IKChain(
      [skeleton.getBoneIndex('RightShoulder'),
       skeleton.getBoneIndex('RightArm'),
       skeleton.getBoneIndex('RightForeArm')],
      skeleton
    );
  }

  setAimTarget(target: Vector3 | null, weight: number = 1.0) {
    this.aimTarget = target;
    this.aimWeight = weight;
  }

  update(pose: Pose, characterTransform: Transform): Pose {
    if (!this.aimTarget || this.aimWeight < 0.01) {
      return pose;
    }

    let result = pose.clone();

    // 1. 计算瞄准方向
    const weaponPos = this.getWeaponPosition(result, characterTransform);
    const aimDirection = Vector3.normalize(
      Vector3.subtract(this.aimTarget, weaponPos)
    );

    // 2. 应用脊柱旋转（水平方向）
    result = this.applySpineAim(result, aimDirection, characterTransform);

    // 3. 应用手臂调整（垂直方向）
    result = this.applyArmAim(result, aimDirection);

    // 4. 应用头部注视
    result = this.applyHeadLookAt(result, characterTransform);

    return result;
  }

  private getWeaponPosition(pose: Pose, characterTransform: Transform): Vector3 {
    // 计算武器的世界位置（通常在右手位置）
    const handIndex = this.skeleton.getBoneIndex('RightHand');
    const localPos = pose.positions[handIndex];

    // 转换到世界空间
    return characterTransform.transformPoint(localPos);
  }

  private applySpineAim(
    pose: Pose,
    aimDirection: Vector3,
    characterTransform: Transform
  ): Pose {
    const result = pose.clone();

    // 计算水平旋转角度
    const forward = characterTransform.forward;
    const flatAimDir = new Vector3(aimDirection.x, 0, aimDirection.z);
    const flatForward = new Vector3(forward.x, 0, forward.z);

    const horizontalAngle = Vector3.signedAngle(
      flatForward,
      flatAimDir,
      new Vector3(0, 1, 0)
    );

    // 将旋转分配到脊柱各节
    const anglePerBone = (horizontalAngle * this.aimWeight) / this.spineChain.bones.length;

    for (const bone of this.spineChain.bones) {
      const rotation = Quaternion.fromAxisAngle(
        new Vector3(0, 1, 0),
        anglePerBone
      );
      result.rotations[bone.index] = Quaternion.multiply(
        rotation,
        result.rotations[bone.index]
      );
    }

    return result;
  }

  private applyArmAim(pose: Pose, aimDirection: Vector3): Pose {
    const result = pose.clone();

    // 计算垂直角度调整
    const verticalAngle = Math.asin(aimDirection.y);

    // 将垂直调整应用到肩膀和上臂
    const shoulderIndex = this.skeleton.getBoneIndex('RightShoulder');
    const armIndex = this.skeleton.getBoneIndex('RightArm');

    const shoulderRotation = Quaternion.fromAxisAngle(
      new Vector3(1, 0, 0),
      verticalAngle * 0.3 * this.aimWeight
    );
    const armRotation = Quaternion.fromAxisAngle(
      new Vector3(1, 0, 0),
      verticalAngle * 0.7 * this.aimWeight
    );

    result.rotations[shoulderIndex] = Quaternion.multiply(
      shoulderRotation,
      result.rotations[shoulderIndex]
    );
    result.rotations[armIndex] = Quaternion.multiply(
      armRotation,
      result.rotations[armIndex]
    );

    return result;
  }

  private applyHeadLookAt(pose: Pose, characterTransform: Transform): Pose {
    if (!this.aimTarget) return pose;

    const result = pose.clone();
    const headIndex = this.skeleton.getBoneIndex('Head');

    // 计算头部应该看向的方向
    const headPos = characterTransform.transformPoint(pose.positions[headIndex]);
    const lookDirection = Vector3.normalize(
      Vector3.subtract(this.aimTarget, headPos)
    );

    // 创建看向目标的旋转
    const lookRotation = Quaternion.lookRotation(lookDirection, new Vector3(0, 1, 0));

    // 混合原始旋转和目标旋转
    result.rotations[headIndex] = Quaternion.slerp(
      pose.rotations[headIndex],
      lookRotation,
      this.aimWeight * 0.8  // 头部不完全看向目标，更自然
    );

    return result;
  }
}
```

---

## 程序化动画

程序化动画通过代码实时生成动画，无需预制动画资源。

### 程序化行走

```typescript
class ProceduralWalkAnimation {
  private stepLength: number = 0.5;
  private stepHeight: number = 0.1;
  private bobAmount: number = 0.05;
  private swayAmount: number = 0.02;
  private phase: number = 0;
  private speed: number = 0;

  setSpeed(speed: number) {
    this.speed = speed;
  }

  update(skeleton: Skeleton, basePose: Pose, deltaTime: number): Pose {
    if (this.speed < 0.1) {
      return basePose;  // 静止时返回基础姿态
    }

    const result = basePose.clone();

    // 更新相位
    this.phase += deltaTime * this.speed * 2;
    this.phase = this.phase % (Math.PI * 2);

    // 计算步态周期中的位置
    const leftPhase = this.phase;
    const rightPhase = this.phase + Math.PI;  // 相位差 180 度

    // 左脚
    result.positions[skeleton.getBoneIndex('LeftFoot')] = this.calculateFootPosition(
      basePose.positions[skeleton.getBoneIndex('LeftFoot')],
      leftPhase
    );

    // 右脚
    result.positions[skeleton.getBoneIndex('RightFoot')] = this.calculateFootPosition(
      basePose.positions[skeleton.getBoneIndex('RightFoot')],
      rightPhase
    );

    // 骨盆上下移动（双脚支撑时最高）
    const pelvisIndex = skeleton.getBoneIndex('Hips');
    const bobOffset = Math.abs(Math.sin(this.phase * 2)) * this.bobAmount;
    result.positions[pelvisIndex] = Vector3.add(
      basePose.positions[pelvisIndex],
      new Vector3(0, bobOffset, 0)
    );

    // 身体左右摇摆
    const swayAngle = Math.sin(this.phase) * this.swayAmount;
    const spineIndex = skeleton.getBoneIndex('Spine');
    result.rotations[spineIndex] = Quaternion.multiply(
      Quaternion.fromAxisAngle(new Vector3(0, 0, 1), swayAngle),
      basePose.rotations[spineIndex]
    );

    // 手臂摆动（与腿相反）
    result.rotations[skeleton.getBoneIndex('LeftArm')] = this.calculateArmSwing(
      basePose.rotations[skeleton.getBoneIndex('LeftArm')],
      rightPhase  // 与右腿同相
    );
    result.rotations[skeleton.getBoneIndex('RightArm')] = this.calculateArmSwing(
      basePose.rotations[skeleton.getBoneIndex('RightArm')],
      leftPhase  // 与左腿同相
    );

    return result;
  }

  private calculateFootPosition(basePos: Vector3, phase: number): Vector3 {
    // 水平移动（正弦波）
    const forwardOffset = Math.sin(phase) * this.stepLength * 0.5;

    // 垂直移动（只在前半周期抬起）
    const liftPhase = phase % (Math.PI * 2);
    let heightOffset = 0;
    if (liftPhase < Math.PI) {
      heightOffset = Math.sin(liftPhase) * this.stepHeight;
    }

    return Vector3.add(basePos, new Vector3(0, heightOffset, forwardOffset));
  }

  private calculateArmSwing(baseRotation: Quaternion, phase: number): Quaternion {
    const swingAngle = Math.sin(phase) * 0.3;  // 约 17 度
    const swingRotation = Quaternion.fromAxisAngle(
      new Vector3(1, 0, 0),
      swingAngle
    );
    return Quaternion.multiply(swingRotation, baseRotation);
  }
}
```

### 程序化呼吸

```typescript
class ProceduralBreathing {
  private breathRate: number = 0.2;  // 每秒呼吸次数
  private chestExpansion: number = 0.02;
  private shoulderRise: number = 0.01;
  private time: number = 0;

  update(skeleton: Skeleton, basePose: Pose, deltaTime: number): Pose {
    this.time += deltaTime;

    const result = basePose.clone();

    // 呼吸周期（使用正弦波）
    const breathPhase = Math.sin(this.time * Math.PI * 2 * this.breathRate);

    // 胸腔扩张
    const chest1Index = skeleton.getBoneIndex('Spine1');
    const chest2Index = skeleton.getBoneIndex('Spine2');

    // 缩放胸部骨骼
    result.scales[chest1Index] = Vector3.add(
      basePose.scales[chest1Index],
      new Vector3(
        breathPhase * this.chestExpansion,
        breathPhase * this.chestExpansion * 0.5,
        breathPhase * this.chestExpansion
      )
    );

    result.scales[chest2Index] = Vector3.add(
      basePose.scales[chest2Index],
      new Vector3(
        breathPhase * this.chestExpansion * 0.7,
        breathPhase * this.chestExpansion * 0.3,
        breathPhase * this.chestExpansion * 0.7
      )
    );

    // 肩膀微微抬起
    const leftShoulderIndex = skeleton.getBoneIndex('LeftShoulder');
    const rightShoulderIndex = skeleton.getBoneIndex('RightShoulder');

    result.positions[leftShoulderIndex] = Vector3.add(
      basePose.positions[leftShoulderIndex],
      new Vector3(0, breathPhase * this.shoulderRise, 0)
    );

    result.positions[rightShoulderIndex] = Vector3.add(
      basePose.positions[rightShoulderIndex],
      new Vector3(0, breathPhase * this.shoulderRise, 0)
    );

    return result;
  }
}
```

### 程序化注视（Look At）

```typescript
class ProceduralLookAt {
  private currentLookTarget: Vector3 | null = null;
  private smoothLookTarget: Vector3;
  private smoothSpeed: number = 5;

  // 各部位的旋转限制和权重
  private eyeWeight: number = 0.3;
  private headWeight: number = 0.5;
  private neckWeight: number = 0.2;

  private maxEyeAngle: number = 30;  // 度
  private maxHeadAngle: number = 60;
  private maxNeckAngle: number = 30;

  constructor() {
    this.smoothLookTarget = new Vector3(0, 0, 1);
  }

  setLookTarget(target: Vector3 | null) {
    this.currentLookTarget = target;
  }

  update(
    skeleton: Skeleton,
    basePose: Pose,
    characterTransform: Transform,
    deltaTime: number
  ): Pose {
    const result = basePose.clone();

    if (!this.currentLookTarget) {
      // 没有目标时，缓慢恢复到默认朝向
      this.smoothLookTarget = Vector3.lerp(
        this.smoothLookTarget,
        characterTransform.forward,
        deltaTime * this.smoothSpeed
      );
    } else {
      // 有目标时，平滑跟踪
      const headPos = this.getHeadWorldPosition(basePose, skeleton, characterTransform);
      const targetDirection = Vector3.normalize(
        Vector3.subtract(this.currentLookTarget, headPos)
      );
      this.smoothLookTarget = Vector3.lerp(
        this.smoothLookTarget,
        targetDirection,
        deltaTime * this.smoothSpeed
      );
    }

    // 计算总旋转角度
    const forward = characterTransform.forward;
    const totalRotation = this.calculateLookRotation(forward, this.smoothLookTarget);

    // 分配到各部位
    const neckRotation = this.limitRotation(
      Quaternion.slerp(Quaternion.identity(), totalRotation, this.neckWeight),
      this.maxNeckAngle
    );

    const headRotation = this.limitRotation(
      Quaternion.slerp(Quaternion.identity(), totalRotation, this.headWeight),
      this.maxHeadAngle
    );

    const eyeRotation = this.limitRotation(
      Quaternion.slerp(Quaternion.identity(), totalRotation, this.eyeWeight),
      this.maxEyeAngle
    );

    // 应用旋转
    const neckIndex = skeleton.getBoneIndex('Neck');
    const headIndex = skeleton.getBoneIndex('Head');
    const leftEyeIndex = skeleton.getBoneIndex('LeftEye');
    const rightEyeIndex = skeleton.getBoneIndex('RightEye');

    result.rotations[neckIndex] = Quaternion.multiply(
      neckRotation,
      basePose.rotations[neckIndex]
    );

    result.rotations[headIndex] = Quaternion.multiply(
      headRotation,
      basePose.rotations[headIndex]
    );

    if (leftEyeIndex >= 0) {
      result.rotations[leftEyeIndex] = Quaternion.multiply(
        eyeRotation,
        basePose.rotations[leftEyeIndex]
      );
    }

    if (rightEyeIndex >= 0) {
      result.rotations[rightEyeIndex] = Quaternion.multiply(
        eyeRotation,
        basePose.rotations[rightEyeIndex]
      );
    }

    return result;
  }

  private getHeadWorldPosition(
    pose: Pose,
    skeleton: Skeleton,
    characterTransform: Transform
  ): Vector3 {
    const headIndex = skeleton.getBoneIndex('Head');
    return characterTransform.transformPoint(pose.positions[headIndex]);
  }

  private calculateLookRotation(forward: Vector3, target: Vector3): Quaternion {
    return Quaternion.fromToRotation(forward, target);
  }

  private limitRotation(rotation: Quaternion, maxAngle: number): Quaternion {
    const angle = Quaternion.getAngle(rotation);
    if (angle > maxAngle * Math.PI / 180) {
      const axis = Quaternion.getAxis(rotation);
      return Quaternion.fromAxisAngle(axis, maxAngle * Math.PI / 180);
    }
    return rotation;
  }
}
```

---

## 完整动画系统架构

### 统一动画管线

```typescript
class AnimationPipeline {
  private skeleton: Skeleton;

  // 各个动画子系统
  private layeredAnimation: LayeredAnimationSystem;
  private additiveSystem: MultiLayerAdditiveSystem;
  private footIK: SmoothFootIK;
  private handIK: HandIKSystem;
  private aimIK: AimIKSystem;
  private lookAt: ProceduralLookAt;
  private breathing: ProceduralBreathing;

  // 配置
  private footIKEnabled: boolean = true;
  private handIKEnabled: boolean = true;
  private aimIKEnabled: boolean = true;
  private lookAtEnabled: boolean = true;
  private breathingEnabled: boolean = true;

  constructor(skeleton: Skeleton) {
    this.skeleton = skeleton;

    this.layeredAnimation = new LayeredAnimationSystem(skeleton);
    this.additiveSystem = new MultiLayerAdditiveSystem();
    this.footIK = new SmoothFootIK(skeleton);
    this.handIK = new HandIKSystem(skeleton);
    this.aimIK = new AimIKSystem(skeleton);
    this.lookAt = new ProceduralLookAt();
    this.breathing = new ProceduralBreathing();
  }

  update(
    characterTransform: Transform,
    physicsWorld: PhysicsWorld,
    deltaTime: number
  ): Pose {
    // 1. 基础分层动画
    let pose = this.layeredAnimation.update(deltaTime);

    // 2. 叠加动画（呼吸、受伤等）
    pose = this.additiveSystem.applyToBasePose(pose, deltaTime);

    // 3. 程序化呼吸
    if (this.breathingEnabled) {
      pose = this.breathing.update(this.skeleton, pose, deltaTime);
    }

    // 4. 瞄准 IK
    if (this.aimIKEnabled) {
      pose = this.aimIK.update(pose, characterTransform);
    }

    // 5. 手部 IK
    if (this.handIKEnabled) {
      pose = this.handIK.update(pose, this.skeleton);
    }

    // 6. 注视 IK
    if (this.lookAtEnabled) {
      pose = this.lookAt.update(
        this.skeleton,
        pose,
        characterTransform,
        deltaTime
      );
    }

    // 7. 脚部 IK（最后应用，确保脚贴地）
    if (this.footIKEnabled) {
      pose = this.footIK.update(
        pose,
        this.skeleton,
        characterTransform.position,
        physicsWorld,
        deltaTime
      );
    }

    return pose;
  }

  // 配置方法
  setFootIKEnabled(enabled: boolean) { this.footIKEnabled = enabled; }
  setHandIKEnabled(enabled: boolean) { this.handIKEnabled = enabled; }
  setAimIKEnabled(enabled: boolean) { this.aimIKEnabled = enabled; }
  setLookAtEnabled(enabled: boolean) { this.lookAtEnabled = enabled; }
  setBreathingEnabled(enabled: boolean) { this.breathingEnabled = enabled; }

  // 获取子系统引用
  getLayers(): LayeredAnimationSystem { return this.layeredAnimation; }
  getAdditives(): MultiLayerAdditiveSystem { return this.additiveSystem; }
  getFootIK(): SmoothFootIK { return this.footIK; }
  getHandIK(): HandIKSystem { return this.handIK; }
  getAimIK(): AimIKSystem { return this.aimIK; }
  getLookAt(): ProceduralLookAt { return this.lookAt; }
}
```

### 使用示例

```typescript
// 初始化
const skeleton = loadSkeleton('character.skeleton');
const animPipeline = new AnimationPipeline(skeleton);

// 设置基础移动动画
const layers = animPipeline.getLayers();
layers.addLayer({
  name: 'locomotion',
  clip: locomotionBlendTree,
  mask: null,
  weight: 1.0,
  blendMode: 'override',
  time: 0
});

// 设置上半身射击动画
layers.addLayer({
  name: 'shooting',
  clip: shootingClip,
  mask: AnimationMask.createUpperBodyMask(skeleton),
  weight: 0.0,
  blendMode: 'override',
  time: 0
});

// 添加呼吸叠加
animPipeline.getAdditives().addLayer(
  new AdditiveLayer(breathingClip, 1.0, 1.0)
);

// 游戏循环
function gameLoop(deltaTime: number) {
  // 更新移动参数
  locomotionBlendTree.setParameter(characterSpeed);

  // 射击状态
  if (isShooting) {
    layers.setLayerWeight('shooting', 1.0);
    animPipeline.getAimIK().setAimTarget(crosshairWorldPosition);
  } else {
    layers.setLayerWeight('shooting', 0.0);
    animPipeline.getAimIK().setAimTarget(null);
  }

  // 注视目标
  if (nearbyEnemy) {
    animPipeline.getLookAt().setLookTarget(nearbyEnemy.position);
  } else {
    animPipeline.getLookAt().setLookTarget(null);
  }

  // 更新动画
  const pose = animPipeline.update(
    characterTransform,
    physicsWorld,
    deltaTime
  );

  // 应用姿态到骨骼
  applyPoseToSkeleton(pose, skeleton);
}
```

---

## 面试要点

### 核心概念题

**Q1: 动画混合中为什么要用四元数插值（Slerp）而不是欧拉角插值？**

```
欧拉角插值的问题：
1. 万向锁（Gimbal Lock）：当两个轴对齐时丢失一个自由度
2. 路径不一致：不同的欧拉角顺序会产生不同的插值路径
3. 不是最短路径：可能绕远路旋转

四元数 Slerp 的优势：
1. 没有万向锁问题
2. 保证恒定角速度
3. 总是走最短路径
4. 数学上更稳定
```

**Q2: 1D 和 2D 混合树的区别和应用场景？**

```
1D 混合树：
- 单一控制参数
- 适用于：移动速度（站立->走->跑->冲刺）
- 实现简单，性能好

2D 混合树：
- 两个控制参数
- 适用于：方向性移动（前/后/左/右及对角）
- 可以使用笛卡尔坐标或极坐标
- 通常需要三角剖分或梯度下降来计算权重
```

**Q3: 叠加动画（Additive）和覆盖动画（Override）的区别？**

```typescript
// 覆盖模式：直接替换或混合
result = lerp(basePose, layerPose, weight);

// 叠加模式：计算差值并叠加
// delta = layerPose - referencePose
// result = basePose + delta * weight

// 叠加模式的优势：
// 1. 可以在任何基础动画上添加效果
// 2. 不会完全覆盖基础动画
// 3. 适合循环效果（呼吸、抖动）
```

### IK 相关题

**Q4: CCD 和 FABRIK 算法的区别？**

```
CCD（循环坐标下降）：
- 从末端向根部迭代
- 每次只调整一个关节
- 可能产生不自然的解
- 实现简单

FABRIK（前向后向到达）：
- 前向和后向两个阶段
- 直接操作位置而非角度
- 通常收敛更快
- 产生更自然的结果
- 更易于添加约束
```

**Q5: 脚部 IK 中为什么要调整骨盆位置？**

```
原因：
1. IK 只能调整腿部关节角度
2. 如果地面高度差过大，腿可能伸直或无法到达
3. 下移骨盆可以给腿部更多的弯曲空间

计算方法：
- 检测两脚下方的地面高度
- 取较低的那个作为骨盆下移量
- 确保两腿都能舒适地弯曲到达地面
```

### 性能优化题

**Q6: 如何优化大量角色的动画性能？**

```
1. LOD（细节层次）：
   - 远处角色使用简化骨骼
   - 减少 IK 计算
   - 降低动画更新频率

2. 剔除优化：
   - 视锥体外的角色不更新动画
   - 被遮挡的角色使用简化动画

3. 批处理：
   - 相同动画状态的角色批量采样
   - 使用 GPU 蒙皮

4. 动画压缩：
   - 关键帧压缩
   - 曲线简化
   - 使用较低的采样率
```

### 高频考点总结

```
1. 动画混合权重归一化
2. 四元数 Slerp vs Lerp
3. 动画状态机设计
4. IK 链的构建和求解
5. 脚部 IK 地面适配
6. 动画遮罩实现
7. 叠加动画的参考姿态
8. 混合树的同步播放
9. 程序化动画生成
10. 动画系统的管线设计
```

---

## 总结

动画混合和 IK 系统是现代游戏角色动画的核心技术：

1. **动画混合**：通过混合树、叠加动画和分层动画，实现复杂的动画组合
2. **逆向运动学**：使角色能够自然地与环境交互，如脚贴地、手抓物体
3. **程序化动画**：在运行时生成动画，增加角色的真实感和多样性

掌握这些技术需要：
- 扎实的数学基础（向量、矩阵、四元数）
- 对骨骼动画原理的深入理解
- 大量的实践和调优经验

随着游戏画面的不断进步，玩家对角色动画的期望也越来越高。优秀的动画系统不仅能提升游戏的视觉表现，更能让玩家感受到角色的"生命力"。
