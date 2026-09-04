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
origin: old/src/content/docs/gamedev/animation-blending.en.md
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

Animation Blending and Inverse Kinematics (IK) are core technologies in modern game development for achieving smooth, natural character animations. Whether you're working on AAA titles or indie games, mastering these techniques is essential for creating high-quality character animation systems.

## Concept Overview

### Why Animation Blending is Needed

In traditional animation systems, switching between different animation states happens instantaneously, resulting in noticeable jumps. Animation blending technology achieves smooth transitions by interpolating between multiple animations:

```
Traditional approach: Idle -> [Instant switch] -> Run
Blending approach: Idle -> [Gradual transition] -> Run
```

### Types of Animation Blending

| Blend Type | Description | Use Case |
|---------|------|---------|
| Crossfade | Linear transition between two animations | State transitions |
| 1D Blend Tree | Multi-animation blending based on a single parameter | Movement speed control |
| 2D Blend Tree | Multi-animation blending based on two parameters | Directional movement |
| Additive Animation | Layering additional motion on base animation | Injuries, breathing effects |
| Layered Animation | Different body parts play different animations | Running while shooting |

### Inverse Kinematics (IK)

IK is a technique that calculates joint angles in a bone chain by working backwards from the target position of an end effector (such as a hand or foot):

```
Forward Kinematics (FK): Joint angles -> End position
Inverse Kinematics (IK): End position -> Joint angles
```

---

## Animation Blending Fundamentals

### Linear Interpolation Blending

The most basic animation blending is linear interpolation between two poses:

```typescript
// Basic pose blending
class PoseBlender {
  /**
   * Linear interpolation between two poses
   * @param poseA Starting pose
   * @param poseB Target pose
   * @param weight Blend weight (0-1)
   * @returns Blended pose
   */
  static blend(poseA: Pose, poseB: Pose, weight: number): Pose {
    const result = new Pose(poseA.boneCount);

    for (let i = 0; i < poseA.boneCount; i++) {
      // Position interpolation
      result.positions[i] = Vector3.lerp(
        poseA.positions[i],
        poseB.positions[i],
        weight
      );

      // Rotation interpolation (using spherical linear interpolation for smoothness)
      result.rotations[i] = Quaternion.slerp(
        poseA.rotations[i],
        poseB.rotations[i],
        weight
      );

      // Scale interpolation
      result.scales[i] = Vector3.lerp(
        poseA.scales[i],
        poseB.scales[i],
        weight
      );
    }

    return result;
  }
}

// Pose data structure
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

### Crossfade

Crossfade is the most common transition method in state machines:

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

    // Calculate blend weight
    const t = Math.min(this.elapsed / this.duration, 1.0);
    const weight = this.easeInOut(t);

    if (t >= 1.0) {
      this.isComplete = true;
    }

    // Get current poses from both animations
    const poseA = this.fromClip.sample(this.fromClip.time);
    const poseB = this.toClip.sample(this.toClip.time);

    // Update animation times
    this.fromClip.time += deltaTime;
    this.toClip.time += deltaTime;

    return PoseBlender.blend(poseA, poseB, weight);
  }

  // Smooth easing function
  private easeInOut(t: number): number {
    return t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  get complete(): boolean {
    return this.isComplete;
  }
}

// Usage example
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

## 1D Blend Tree

A 1D blend tree blends between multiple animations based on a single parameter (such as speed).

### Basic Implementation

```typescript
interface BlendNode1D {
  clip: AnimationClip;
  threshold: number;  // Parameter threshold for this animation
}

class BlendTree1D {
  private nodes: BlendNode1D[] = [];
  private parameter: number = 0;

  constructor(nodes: BlendNode1D[]) {
    // Sort by threshold
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

    // Find the interval containing the parameter
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

    // Boundary case handling
    if (this.parameter <= this.nodes[0].threshold) {
      return this.nodes[0].clip.sample(time);
    }
    if (this.parameter >= this.nodes[this.nodes.length - 1].threshold) {
      return this.nodes[this.nodes.length - 1].clip.sample(time);
    }

    // Calculate blend weight
    const lower = this.nodes[lowerIndex];
    const upper = this.nodes[upperIndex];
    const range = upper.threshold - lower.threshold;
    const weight = (this.parameter - lower.threshold) / range;

    // Blend the two poses
    const poseA = lower.clip.sample(time);
    const poseB = upper.clip.sample(time);

    return PoseBlender.blend(poseA, poseB, weight);
  }
}

// Usage example: Movement speed blending
const locomotionBlendTree = new BlendTree1D([
  { clip: idleClip, threshold: 0 },
  { clip: walkClip, threshold: 2 },
  { clip: jogClip, threshold: 4 },
  { clip: runClip, threshold: 6 },
  { clip: sprintClip, threshold: 10 }
]);

// Set parameter based on character speed
function updateAnimation(characterSpeed: number, deltaTime: number) {
  locomotionBlendTree.setParameter(characterSpeed);
  const pose = locomotionBlendTree.sample(animationTime);
  animationTime += deltaTime;
  return pose;
}
```

### Synchronized Blending

To avoid footstep synchronization issues between animations at different speeds, normalized time should be used:

```typescript
class SyncedBlendTree1D {
  private nodes: BlendNode1D[] = [];
  private parameter: number = 0;
  private normalizedTime: number = 0;  // Loops between 0-1

  setParameter(value: number) {
    this.parameter = value;
  }

  update(deltaTime: number): Pose {
    // Calculate playback speed based on dominant animation
    const dominantNode = this.findDominantNode();
    const playbackRate = this.calculatePlaybackRate();

    // Update normalized time
    this.normalizedTime += (deltaTime * playbackRate) / dominantNode.clip.duration;
    this.normalizedTime = this.normalizedTime % 1.0;

    return this.sampleAtNormalizedTime(this.normalizedTime);
  }

  private findDominantNode(): BlendNode1D {
    // Find the node with maximum weight
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
    // Calculate node weight based on parameter
    // Implementation omitted, similar to previous blending logic
    return 0;
  }

  private calculatePlaybackRate(): number {
    // Adjust playback speed based on parameter
    // Example: faster speed = faster animation playback
    return this.parameter / 4; // Assuming 4 is the standard speed
  }

  private sampleAtNormalizedTime(normalizedTime: number): Pose {
    // Sample all animations at normalized time and blend
    // This ensures all animations are at the same phase
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

## 2D Blend Tree

A 2D blend tree uses two parameters (such as horizontal and vertical velocity) for blending, commonly used for directional movement.

### Freeform Directional Blending

```typescript
interface BlendNode2D {
  clip: AnimationClip;
  position: Vector2;  // Position in 2D parameter space
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
    // Calculate weight for each node
    const weights = this.calculateWeights();

    // Normalize weights
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      for (let i = 0; i < weights.length; i++) {
        weights[i] /= totalWeight;
      }
    }

    // Blend all poses
    let result: Pose | null = null;
    let accumulatedWeight = 0;

    for (let i = 0; i < this.nodes.length; i++) {
      if (weights[i] > 0.001) {
        const pose = this.nodes[i].clip.sample(time);

        if (result === null) {
          result = pose;
          accumulatedWeight = weights[i];
        } else {
          // Incremental blending
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
      // Use inverse distance weighting
      const distance = Vector2.distance(this.parameter, node.position);

      if (distance < 0.001) {
        // Parameter position is very close to node
        weights.push(1000);
      } else {
        // Inverse distance weight
        weights.push(1 / (distance * distance));
      }
    }

    return weights;
  }
}

// Usage example: Eight-directional movement
const directionalBlendTree = new BlendTree2D([
  // Center - Idle
  { clip: idleClip, position: new Vector2(0, 0) },

  // Four cardinal directions
  { clip: walkForwardClip, position: new Vector2(0, 1) },
  { clip: walkBackwardClip, position: new Vector2(0, -1) },
  { clip: walkLeftClip, position: new Vector2(-1, 0) },
  { clip: walkRightClip, position: new Vector2(1, 0) },

  // Four diagonal directions
  { clip: walkForwardLeftClip, position: new Vector2(-0.707, 0.707) },
  { clip: walkForwardRightClip, position: new Vector2(0.707, 0.707) },
  { clip: walkBackwardLeftClip, position: new Vector2(-0.707, -0.707) },
  { clip: walkBackwardRightClip, position: new Vector2(0.707, -0.707) }
]);

// Update animation
function updateDirectionalAnimation(inputX: number, inputY: number) {
  directionalBlendTree.setParameter(inputX, inputY);
  return directionalBlendTree.sample(animationTime);
}
```

### Delaunay Triangulation Blending

More precise 2D blending can use triangulation:

```typescript
interface Triangle {
  indices: [number, number, number];  // Indices of three vertices
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
    // Find the triangle containing the parameter point
    const triangle = this.findContainingTriangle();

    if (!triangle) {
      // Parameter is outside all triangles, find nearest node
      return this.sampleNearestNode(time);
    }

    // Calculate barycentric coordinates
    const weights = this.computeBarycentricCoordinates(triangle);

    // Blend three poses using barycentric coordinates
    const poseA = this.nodes[triangle.indices[0]].clip.sample(time);
    const poseB = this.nodes[triangle.indices[1]].clip.sample(time);
    const poseC = this.nodes[triangle.indices[2]].clip.sample(time);

    // Weighted blend of three poses
    const poseAB = PoseBlender.blend(poseA, poseB, weights[1] / (weights[0] + weights[1]));
    return PoseBlender.blend(poseAB, poseC, weights[2]);
  }

  private computeDelaunayTriangulation(): Triangle[] {
    // Delaunay triangulation algorithm implementation
    // Using a simplified version of Bowyer-Watson algorithm
    const triangles: Triangle[] = [];

    // Full Delaunay algorithm should be used in actual implementation
    // Implementation omitted here...

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

## Additive Animation

Additive animation allows adding extra motion effects on top of base animations, such as breathing, injury trembles, etc.

### Additive Animation Principles

```typescript
class AdditiveAnimation {
  private baseClip: AnimationClip;      // Base animation
  private additiveClip: AnimationClip;  // Additive animation
  private referencePose: Pose;          // Reference pose (usually first frame)
  private weight: number = 1.0;

  constructor(baseClip: AnimationClip, additiveClip: AnimationClip) {
    this.baseClip = baseClip;
    this.additiveClip = additiveClip;
    // Reference pose is usually the first frame of additive animation
    this.referencePose = additiveClip.sample(0);
  }

  setWeight(weight: number) {
    this.weight = Math.max(0, Math.min(1, weight));
  }

  sample(baseTime: number, additiveTime: number): Pose {
    // Get base pose
    const basePose = this.baseClip.sample(baseTime);

    // Get current frame of additive animation
    const additivePose = this.additiveClip.sample(additiveTime);

    // Calculate and apply additive delta
    return this.applyAdditive(basePose, additivePose, this.referencePose);
  }

  private applyAdditive(base: Pose, additive: Pose, reference: Pose): Pose {
    const result = base.clone();

    for (let i = 0; i < base.boneCount; i++) {
      // Position additive: additive - reference
      const positionDelta = Vector3.subtract(
        additive.positions[i],
        reference.positions[i]
      );
      result.positions[i] = Vector3.add(
        base.positions[i],
        Vector3.scale(positionDelta, this.weight)
      );

      // Rotation additive: use quaternion difference
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

      // Scale additive: multiplication
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

// Usage example: Breathing effect
class CharacterAnimator {
  private locomotionTree: BlendTree1D;
  private breathingAdditive: AdditiveAnimation;
  private hitReactionAdditive: AdditiveAnimation;

  private breathingTime: number = 0;
  private hitReactionTime: number = 0;
  private hitReactionWeight: number = 0;

  update(deltaTime: number, speed: number): Pose {
    // Base locomotion animation
    this.locomotionTree.setParameter(speed);
    let pose = this.locomotionTree.sample(this.locomotionTime);

    // Add breathing effect
    this.breathingTime += deltaTime;
    this.breathingAdditive.setWeight(1.0);
    pose = this.breathingAdditive.applyToPose(pose, this.breathingTime);

    // Add hit reaction (with decay)
    if (this.hitReactionWeight > 0) {
      this.hitReactionTime += deltaTime;
      this.hitReactionAdditive.setWeight(this.hitReactionWeight);
      pose = this.hitReactionAdditive.applyToPose(pose, this.hitReactionTime);

      // Decay hit reaction weight
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

### Multi-Layer Additive

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

        // Loop playback
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
      // Position
      const positionDelta = Vector3.subtract(
        additive.positions[i],
        layer.referencePose.positions[i]
      );
      result.positions[i] = Vector3.add(
        base.positions[i],
        Vector3.scale(positionDelta, layer.weight)
      );

      // Rotation
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

## Animation Masks

Animation masks allow applying animations to specific bones only, enabling different animations for upper and lower body.

### Mask Definition

```typescript
class AnimationMask {
  private boneWeights: Map<string, number> = new Map();

  constructor() {}

  // Set weight for a single bone
  setBoneWeight(boneName: string, weight: number) {
    this.boneWeights.set(boneName, Math.max(0, Math.min(1, weight)));
  }

  // Set weight for a bone and all its children
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

  // Predefined common masks
  static createUpperBodyMask(skeleton: Skeleton): AnimationMask {
    const mask = new AnimationMask();

    // Set all bones to 0 first
    for (const bone of skeleton.bones) {
      mask.setBoneWeight(bone.name, 0);
    }

    // Set upper body bones to 1
    mask.setBoneAndChildrenWeight('Spine', 1, skeleton);

    return mask;
  }

  static createLowerBodyMask(skeleton: Skeleton): AnimationMask {
    const mask = new AnimationMask();

    // Set all bones to 0
    for (const bone of skeleton.bones) {
      mask.setBoneWeight(bone.name, 0);
    }

    // Set lower body bones to 1
    mask.setBoneAndChildrenWeight('Hips', 1, skeleton);
    mask.setBoneAndChildrenWeight('LeftUpLeg', 1, skeleton);
    mask.setBoneAndChildrenWeight('RightUpLeg', 1, skeleton);

    // Exclude spine and above
    mask.setBoneAndChildrenWeight('Spine', 0, skeleton);

    return mask;
  }
}
```

### Layered Animation System

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
    // Start from base layer
    let resultPose: Pose | null = null;

    for (const layer of this.layers) {
      if (layer.weight < 0.001) continue;

      layer.time += deltaTime;

      // Get pose for this layer
      const layerPose = this.sampleLayer(layer);

      if (resultPose === null) {
        resultPose = layerPose;
      } else {
        // Apply layer blending
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

      // Get mask weight
      let maskWeight = 1.0;
      if (layerConfig.mask) {
        maskWeight = layerConfig.mask.getWeight(boneName);
      }

      const finalWeight = layerConfig.weight * maskWeight;

      if (finalWeight < 0.001) continue;

      if (layerConfig.blendMode === 'override') {
        // Override mode: direct blending
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
        // Additive mode
        // Assuming layer pose is already an additive delta
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

// Usage example: Running while shooting
const animSystem = new LayeredAnimationSystem(skeleton);

// Base layer: Locomotion animation (full body)
animSystem.addLayer({
  name: 'locomotion',
  clip: locomotionBlendTree,
  mask: null,
  weight: 1.0,
  blendMode: 'override',
  time: 0
});

// Upper layer: Shooting animation (upper body only)
animSystem.addLayer({
  name: 'shooting',
  clip: shootingClip,
  mask: AnimationMask.createUpperBodyMask(skeleton),
  weight: 0.0,  // Disabled by default
  blendMode: 'override',
  time: 0
});

// Enable upper body layer when shooting
function startShooting() {
  animSystem.setLayerWeight('shooting', 1.0);
}

function stopShooting() {
  animSystem.setLayerWeight('shooting', 0.0);
}
```

---

## Inverse Kinematics (IK) Fundamentals

### IK Chain Structure

```typescript
interface IKBone {
  index: number;
  length: number;
  minAngle: Vector3;  // Minimum angle limit per axis
  maxAngle: Vector3;  // Maximum angle limit per axis
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

### CCD (Cyclic Coordinate Descent) IK Algorithm

CCD is a simple and efficient IK algorithm that iteratively adjusts each joint to approach the target:

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
      // Get current end effector position
      const endEffectorPos = this.getEndEffectorPosition(chain, result, skeleton);

      // Check if target is reached
      if (Vector3.distance(endEffectorPos, targetPosition) < this.tolerance) {
        break;
      }

      // Traverse from end to root for each bone
      for (let i = chain.bones.length - 1; i >= 0; i--) {
        const bone = chain.bones[i];
        const bonePos = this.getBoneWorldPosition(bone.index, result, skeleton);

        // Current end position
        const currentEnd = this.getEndEffectorPosition(chain, result, skeleton);

        // Vector from current bone to end
        const toEnd = Vector3.subtract(currentEnd, bonePos);
        // Vector from current bone to target
        const toTarget = Vector3.subtract(targetPosition, bonePos);

        // Normalize
        const toEndNorm = Vector3.normalize(toEnd);
        const toTargetNorm = Vector3.normalize(toTarget);

        // Calculate rotation axis and angle
        const axis = Vector3.cross(toEndNorm, toTargetNorm);
        const axisLength = Vector3.length(axis);

        if (axisLength > 0.0001) {
          const normalizedAxis = Vector3.scale(axis, 1 / axisLength);
          const angle = Math.acos(Math.max(-1, Math.min(1, Vector3.dot(toEndNorm, toTargetNorm))));

          // Create rotation quaternion
          const rotation = Quaternion.fromAxisAngle(normalizedAxis, angle);

          // Apply rotation to bone
          result.rotations[bone.index] = Quaternion.multiply(
            rotation,
            result.rotations[bone.index]
          );

          // Apply angle limits
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
    // Calculate world position of bone
    // Need to traverse parent chain to accumulate transforms
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

    // Bone end = bone position + rotated bone length vector
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
    // Convert quaternion to Euler angles
    const euler = Quaternion.toEuler(rotation);

    // Apply limits
    euler.x = Math.max(minAngle.x, Math.min(maxAngle.x, euler.x));
    euler.y = Math.max(minAngle.y, Math.min(maxAngle.y, euler.y));
    euler.z = Math.max(minAngle.z, Math.min(maxAngle.z, euler.z));

    // Convert back to quaternion
    return Quaternion.fromEuler(euler.x, euler.y, euler.z);
  }
}
```

### FABRIK (Forward And Backward Reaching Inverse Kinematics) Algorithm

FABRIK is another popular IK algorithm that typically converges faster:

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

    // Get world positions of all bones
    const positions: Vector3[] = [];
    for (const bone of chain.bones) {
      positions.push(this.getBoneWorldPosition(bone.index, result, skeleton));
    }
    // Add end effector position
    positions.push(this.getEndEffectorPosition(chain, result, skeleton));

    const rootPos = positions[0].clone();

    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      // Check if target is reached
      const endPos = positions[positions.length - 1];
      if (Vector3.distance(endPos, targetPosition) < this.tolerance) {
        break;
      }

      // Backward phase: from end to root
      positions[positions.length - 1] = targetPosition.clone();

      for (let i = positions.length - 2; i >= 0; i--) {
        const direction = Vector3.subtract(positions[i], positions[i + 1]);
        const normalizedDir = Vector3.normalize(direction);
        positions[i] = Vector3.add(
          positions[i + 1],
          Vector3.scale(normalizedDir, chain.bones[i].length)
        );
      }

      // Forward phase: from root to end
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

    // Convert positions back to bone rotations
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

      // Calculate the direction bone should point to
      const targetDirection = Vector3.normalize(
        Vector3.subtract(nextPos, currentPos)
      );

      // Default bone direction (usually positive Y axis)
      const defaultDirection = new Vector3(0, 1, 0);

      // Calculate rotation from default direction to target direction
      pose.rotations[bone.index] = Quaternion.fromToRotation(
        defaultDirection,
        targetDirection
      );

      // Apply angle limits
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
    // Same as CCD implementation
    return new Vector3(0, 0, 0);
  }

  private getEndEffectorPosition(
    chain: IKChain,
    pose: Pose,
    skeleton: Skeleton
  ): Vector3 {
    // Same as CCD implementation
    return new Vector3(0, 0, 0);
  }

  private applyAngleLimits(
    rotation: Quaternion,
    minAngle: Vector3,
    maxAngle: Vector3
  ): Quaternion {
    // Same as CCD implementation
    return rotation;
  }
}
```

---

## Foot IK

Foot IK is the most common IK application in games, used to make character feet properly conform to the ground.

### Ground Detection

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
  private footOffset: number = 0.1;  // Distance from ankle to foot bottom

  constructor(skeleton: Skeleton) {
    // Create foot IK chains
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

    // Get world positions of feet
    const leftFootPos = this.getFootWorldPosition('left', pose, skeleton, characterPosition);
    const rightFootPos = this.getFootWorldPosition('right', pose, skeleton, characterPosition);

    // Ground raycast
    const leftGroundCheck = this.checkGround(leftFootPos, physicsWorld);
    const rightGroundCheck = this.checkGround(rightFootPos, physicsWorld);

    // Calculate pelvis adjustment
    const pelvisAdjustment = this.calculatePelvisAdjustment(
      leftGroundCheck,
      rightGroundCheck
    );

    // Apply pelvis adjustment
    result = this.adjustPelvis(result, skeleton, pelvisAdjustment);

    // Apply left foot IK
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

      // Adjust foot rotation to match ground normal
      result = this.alignFootToGround(
        result,
        skeleton,
        'LeftFoot',
        leftGroundCheck.normal
      );
    }

    // Apply right foot IK
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
    // Cast ray downward from foot position
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
    // Calculate distance to lower pelvis
    // Take the foot that needs to lower more
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

    // Calculate rotation to align foot to ground normal
    const upVector = new Vector3(0, 1, 0);
    const alignRotation = Quaternion.fromToRotation(upVector, groundNormal);

    // Only partially apply rotation to avoid excessive foot rotation
    const blendedRotation = Quaternion.slerp(
      Quaternion.identity(),
      alignRotation,
      0.5  // Blend factor
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

    // Get local position of foot bone and convert to world position
    const localPos = pose.positions[footIndex];
    return Vector3.add(characterPosition, localPos);
  }
}
```

### Smooth Transitions

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
    // Get ideal foot target positions
    const idealLeftTarget = this.getIdealFootTarget('left', pose, skeleton, characterPosition, physicsWorld);
    const idealRightTarget = this.getIdealFootTarget('right', pose, skeleton, characterPosition, physicsWorld);

    // Smooth interpolation to target positions
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

    // Apply IK
    return this.applyIK(pose, skeleton, characterPosition);
  }

  private getIdealFootTarget(
    side: 'left' | 'right',
    pose: Pose,
    skeleton: Skeleton,
    characterPosition: Vector3,
    physicsWorld: PhysicsWorld
  ): Vector3 {
    // Ground detection logic
    // ...
    return new Vector3(0, 0, 0);
  }

  private applyIK(
    pose: Pose,
    skeleton: Skeleton,
    characterPosition: Vector3
  ): Pose {
    // Apply IK using smoothed target positions
    // ...
    return pose;
  }
}
```

---

## Hand IK

Hand IK is used to make character hands interact with environmental objects, such as grabbing, touching, etc.

### Two-Hand IK System

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

    // Left hand IK
    if (this.leftHandTarget && this.leftHandTarget.weight > 0) {
      const ikPose = this.ikSolver.solve(
        this.leftArmChain,
        result,
        skeleton,
        this.leftHandTarget.position
      );

      // Blend IK result
      result = this.blendArmPose(
        result,
        ikPose,
        this.leftArmChain,
        this.leftHandTarget.weight
      );

      // Set hand rotation
      const handIndex = skeleton.getBoneIndex('LeftHand');
      result.rotations[handIndex] = Quaternion.slerp(
        result.rotations[handIndex],
        this.leftHandTarget.rotation,
        this.leftHandTarget.weight
      );
    }

    // Right hand IK
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

// Usage example: Grabbing objects
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
    // Smooth transition of grab weight
    const targetWeight = this.currentGrabTarget ? 1.0 : 0.0;
    this.grabWeight = this.lerp(
      this.grabWeight,
      targetWeight,
      deltaTime * this.grabSpeed
    );

    if (this.grabWeight > 0.01 && this.currentGrabTarget) {
      // Set right hand target
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

### Aim IK

```typescript
class AimIKSystem {
  private spineChain: IKChain;
  private rightArmChain: IKChain;
  private skeleton: Skeleton;

  private aimTarget: Vector3 | null = null;
  private aimWeight: number = 0;

  constructor(skeleton: Skeleton) {
    this.skeleton = skeleton;

    // Spine chain for body turning
    this.spineChain = new IKChain(
      [skeleton.getBoneIndex('Spine'),
       skeleton.getBoneIndex('Spine1'),
       skeleton.getBoneIndex('Spine2')],
      skeleton
    );

    // Right arm chain for weapon aiming
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

    // 1. Calculate aim direction
    const weaponPos = this.getWeaponPosition(result, characterTransform);
    const aimDirection = Vector3.normalize(
      Vector3.subtract(this.aimTarget, weaponPos)
    );

    // 2. Apply spine rotation (horizontal direction)
    result = this.applySpineAim(result, aimDirection, characterTransform);

    // 3. Apply arm adjustment (vertical direction)
    result = this.applyArmAim(result, aimDirection);

    // 4. Apply head look-at
    result = this.applyHeadLookAt(result, characterTransform);

    return result;
  }

  private getWeaponPosition(pose: Pose, characterTransform: Transform): Vector3 {
    // Calculate world position of weapon (usually at right hand)
    const handIndex = this.skeleton.getBoneIndex('RightHand');
    const localPos = pose.positions[handIndex];

    // Transform to world space
    return characterTransform.transformPoint(localPos);
  }

  private applySpineAim(
    pose: Pose,
    aimDirection: Vector3,
    characterTransform: Transform
  ): Pose {
    const result = pose.clone();

    // Calculate horizontal rotation angle
    const forward = characterTransform.forward;
    const flatAimDir = new Vector3(aimDirection.x, 0, aimDirection.z);
    const flatForward = new Vector3(forward.x, 0, forward.z);

    const horizontalAngle = Vector3.signedAngle(
      flatForward,
      flatAimDir,
      new Vector3(0, 1, 0)
    );

    // Distribute rotation across spine bones
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

    // Calculate vertical angle adjustment
    const verticalAngle = Math.asin(aimDirection.y);

    // Apply vertical adjustment to shoulder and upper arm
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

    // Calculate direction head should look toward
    const headPos = characterTransform.transformPoint(pose.positions[headIndex]);
    const lookDirection = Vector3.normalize(
      Vector3.subtract(this.aimTarget, headPos)
    );

    // Create rotation to look at target
    const lookRotation = Quaternion.lookRotation(lookDirection, new Vector3(0, 1, 0));

    // Blend original rotation with target rotation
    result.rotations[headIndex] = Quaternion.slerp(
      pose.rotations[headIndex],
      lookRotation,
      this.aimWeight * 0.8  // Head doesn't look directly at target for more natural look
    );

    return result;
  }
}
```

---

## Procedural Animation

Procedural animation generates animations in real-time through code, without pre-made animation assets.

### Procedural Walking

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
      return basePose;  // Return base pose when stationary
    }

    const result = basePose.clone();

    // Update phase
    this.phase += deltaTime * this.speed * 2;
    this.phase = this.phase % (Math.PI * 2);

    // Calculate position in gait cycle
    const leftPhase = this.phase;
    const rightPhase = this.phase + Math.PI;  // 180 degree phase difference

    // Left foot
    result.positions[skeleton.getBoneIndex('LeftFoot')] = this.calculateFootPosition(
      basePose.positions[skeleton.getBoneIndex('LeftFoot')],
      leftPhase
    );

    // Right foot
    result.positions[skeleton.getBoneIndex('RightFoot')] = this.calculateFootPosition(
      basePose.positions[skeleton.getBoneIndex('RightFoot')],
      rightPhase
    );

    // Pelvis vertical movement (highest during double support)
    const pelvisIndex = skeleton.getBoneIndex('Hips');
    const bobOffset = Math.abs(Math.sin(this.phase * 2)) * this.bobAmount;
    result.positions[pelvisIndex] = Vector3.add(
      basePose.positions[pelvisIndex],
      new Vector3(0, bobOffset, 0)
    );

    // Body lateral sway
    const swayAngle = Math.sin(this.phase) * this.swayAmount;
    const spineIndex = skeleton.getBoneIndex('Spine');
    result.rotations[spineIndex] = Quaternion.multiply(
      Quaternion.fromAxisAngle(new Vector3(0, 0, 1), swayAngle),
      basePose.rotations[spineIndex]
    );

    // Arm swing (opposite to legs)
    result.rotations[skeleton.getBoneIndex('LeftArm')] = this.calculateArmSwing(
      basePose.rotations[skeleton.getBoneIndex('LeftArm')],
      rightPhase  // Same phase as right leg
    );
    result.rotations[skeleton.getBoneIndex('RightArm')] = this.calculateArmSwing(
      basePose.rotations[skeleton.getBoneIndex('RightArm')],
      leftPhase  // Same phase as left leg
    );

    return result;
  }

  private calculateFootPosition(basePos: Vector3, phase: number): Vector3 {
    // Horizontal movement (sine wave)
    const forwardOffset = Math.sin(phase) * this.stepLength * 0.5;

    // Vertical movement (only lift during first half of cycle)
    const liftPhase = phase % (Math.PI * 2);
    let heightOffset = 0;
    if (liftPhase < Math.PI) {
      heightOffset = Math.sin(liftPhase) * this.stepHeight;
    }

    return Vector3.add(basePos, new Vector3(0, heightOffset, forwardOffset));
  }

  private calculateArmSwing(baseRotation: Quaternion, phase: number): Quaternion {
    const swingAngle = Math.sin(phase) * 0.3;  // About 17 degrees
    const swingRotation = Quaternion.fromAxisAngle(
      new Vector3(1, 0, 0),
      swingAngle
    );
    return Quaternion.multiply(swingRotation, baseRotation);
  }
}
```

### Procedural Breathing

```typescript
class ProceduralBreathing {
  private breathRate: number = 0.2;  // Breaths per second
  private chestExpansion: number = 0.02;
  private shoulderRise: number = 0.01;
  private time: number = 0;

  update(skeleton: Skeleton, basePose: Pose, deltaTime: number): Pose {
    this.time += deltaTime;

    const result = basePose.clone();

    // Breathing cycle (using sine wave)
    const breathPhase = Math.sin(this.time * Math.PI * 2 * this.breathRate);

    // Chest expansion
    const chest1Index = skeleton.getBoneIndex('Spine1');
    const chest2Index = skeleton.getBoneIndex('Spine2');

    // Scale chest bones
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

    // Shoulders rise slightly
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

### Procedural Look At

```typescript
class ProceduralLookAt {
  private currentLookTarget: Vector3 | null = null;
  private smoothLookTarget: Vector3;
  private smoothSpeed: number = 5;

  // Rotation limits and weights for each body part
  private eyeWeight: number = 0.3;
  private headWeight: number = 0.5;
  private neckWeight: number = 0.2;

  private maxEyeAngle: number = 30;  // Degrees
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
      // When no target, slowly return to default facing
      this.smoothLookTarget = Vector3.lerp(
        this.smoothLookTarget,
        characterTransform.forward,
        deltaTime * this.smoothSpeed
      );
    } else {
      // When target exists, smooth tracking
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

    // Calculate total rotation angle
    const forward = characterTransform.forward;
    const totalRotation = this.calculateLookRotation(forward, this.smoothLookTarget);

    // Distribute to body parts
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

    // Apply rotations
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

## Complete Animation System Architecture

### Unified Animation Pipeline

```typescript
class AnimationPipeline {
  private skeleton: Skeleton;

  // Animation subsystems
  private layeredAnimation: LayeredAnimationSystem;
  private additiveSystem: MultiLayerAdditiveSystem;
  private footIK: SmoothFootIK;
  private handIK: HandIKSystem;
  private aimIK: AimIKSystem;
  private lookAt: ProceduralLookAt;
  private breathing: ProceduralBreathing;

  // Configuration
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
    // 1. Base layered animation
    let pose = this.layeredAnimation.update(deltaTime);

    // 2. Additive animations (breathing, injuries, etc.)
    pose = this.additiveSystem.applyToBasePose(pose, deltaTime);

    // 3. Procedural breathing
    if (this.breathingEnabled) {
      pose = this.breathing.update(this.skeleton, pose, deltaTime);
    }

    // 4. Aim IK
    if (this.aimIKEnabled) {
      pose = this.aimIK.update(pose, characterTransform);
    }

    // 5. Hand IK
    if (this.handIKEnabled) {
      pose = this.handIK.update(pose, this.skeleton);
    }

    // 6. Look-at IK
    if (this.lookAtEnabled) {
      pose = this.lookAt.update(
        this.skeleton,
        pose,
        characterTransform,
        deltaTime
      );
    }

    // 7. Foot IK (applied last to ensure feet stay grounded)
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

  // Configuration methods
  setFootIKEnabled(enabled: boolean) { this.footIKEnabled = enabled; }
  setHandIKEnabled(enabled: boolean) { this.handIKEnabled = enabled; }
  setAimIKEnabled(enabled: boolean) { this.aimIKEnabled = enabled; }
  setLookAtEnabled(enabled: boolean) { this.lookAtEnabled = enabled; }
  setBreathingEnabled(enabled: boolean) { this.breathingEnabled = enabled; }

  // Get subsystem references
  getLayers(): LayeredAnimationSystem { return this.layeredAnimation; }
  getAdditives(): MultiLayerAdditiveSystem { return this.additiveSystem; }
  getFootIK(): SmoothFootIK { return this.footIK; }
  getHandIK(): HandIKSystem { return this.handIK; }
  getAimIK(): AimIKSystem { return this.aimIK; }
  getLookAt(): ProceduralLookAt { return this.lookAt; }
}
```

### Usage Example

```typescript
// Initialization
const skeleton = loadSkeleton('character.skeleton');
const animPipeline = new AnimationPipeline(skeleton);

// Set up base locomotion animation
const layers = animPipeline.getLayers();
layers.addLayer({
  name: 'locomotion',
  clip: locomotionBlendTree,
  mask: null,
  weight: 1.0,
  blendMode: 'override',
  time: 0
});

// Set up upper body shooting animation
layers.addLayer({
  name: 'shooting',
  clip: shootingClip,
  mask: AnimationMask.createUpperBodyMask(skeleton),
  weight: 0.0,
  blendMode: 'override',
  time: 0
});

// Add breathing additive
animPipeline.getAdditives().addLayer(
  new AdditiveLayer(breathingClip, 1.0, 1.0)
);

// Game loop
function gameLoop(deltaTime: number) {
  // Update locomotion parameter
  locomotionBlendTree.setParameter(characterSpeed);

  // Shooting state
  if (isShooting) {
    layers.setLayerWeight('shooting', 1.0);
    animPipeline.getAimIK().setAimTarget(crosshairWorldPosition);
  } else {
    layers.setLayerWeight('shooting', 0.0);
    animPipeline.getAimIK().setAimTarget(null);
  }

  // Look-at target
  if (nearbyEnemy) {
    animPipeline.getLookAt().setLookTarget(nearbyEnemy.position);
  } else {
    animPipeline.getLookAt().setLookTarget(null);
  }

  // Update animation
  const pose = animPipeline.update(
    characterTransform,
    physicsWorld,
    deltaTime
  );

  // Apply pose to skeleton
  applyPoseToSkeleton(pose, skeleton);
}
```

---

## Interview Key Points

### Core Concept Questions

**Q1: Why use quaternion interpolation (Slerp) instead of Euler angle interpolation in animation blending?**

```
Problems with Euler angle interpolation:
1. Gimbal Lock: Losing one degree of freedom when two axes align
2. Inconsistent paths: Different Euler angle orders produce different interpolation paths
3. Not shortest path: May rotate the long way around

Advantages of quaternion Slerp:
1. No gimbal lock issues
2. Guarantees constant angular velocity
3. Always takes the shortest path
4. Mathematically more stable
```

**Q2: What are the differences and use cases for 1D and 2D blend trees?**

```
1D Blend Tree:
- Single control parameter
- Use case: Movement speed (idle->walk->run->sprint)
- Simple implementation, good performance

2D Blend Tree:
- Two control parameters
- Use case: Directional movement (forward/backward/left/right and diagonals)
- Can use Cartesian or polar coordinates
- Usually requires triangulation or gradient descent for weight calculation
```

**Q3: What is the difference between Additive and Override animation?**

```typescript
// Override mode: Direct replacement or blending
result = lerp(basePose, layerPose, weight);

// Additive mode: Calculate delta and add
// delta = layerPose - referencePose
// result = basePose + delta * weight

// Advantages of additive mode:
// 1. Can add effects on top of any base animation
// 2. Doesn't completely override base animation
// 3. Suitable for looping effects (breathing, trembling)
```

### IK Related Questions

**Q4: What are the differences between CCD and FABRIK algorithms?**

```
CCD (Cyclic Coordinate Descent):
- Iterates from end to root
- Adjusts only one joint at a time
- May produce unnatural solutions
- Simple implementation

FABRIK (Forward And Backward Reaching):
- Two phases: forward and backward
- Operates directly on positions rather than angles
- Usually converges faster
- Produces more natural results
- Easier to add constraints
```

**Q5: Why do we need to adjust pelvis position in foot IK?**

```
Reasons:
1. IK can only adjust leg joint angles
2. If ground height difference is too large, legs may straighten or fail to reach
3. Lowering pelvis gives legs more room to bend

Calculation method:
- Detect ground height below both feet
- Take the lower one as pelvis adjustment amount
- Ensure both legs can comfortably bend to reach ground
```

### Performance Optimization Questions

**Q6: How to optimize animation performance for large numbers of characters?**

```
1. LOD (Level of Detail):
   - Use simplified skeletons for distant characters
   - Reduce IK calculations
   - Lower animation update frequency

2. Culling optimization:
   - Don't update animations for characters outside view frustum
   - Use simplified animations for occluded characters

3. Batching:
   - Batch sample characters with same animation state
   - Use GPU skinning

4. Animation compression:
   - Keyframe compression
   - Curve simplification
   - Use lower sampling rates
```

### High-Frequency Topic Summary

```
1. Animation blend weight normalization
2. Quaternion Slerp vs Lerp
3. Animation state machine design
4. IK chain construction and solving
5. Foot IK ground adaptation
6. Animation mask implementation
7. Additive animation reference pose
8. Blend tree synchronized playback
9. Procedural animation generation
10. Animation system pipeline design
```

---

## Summary

Animation blending and IK systems are core technologies for modern game character animation:

1. **Animation Blending**: Through blend trees, additive animations, and layered animations, achieve complex animation combinations
2. **Inverse Kinematics**: Enable characters to naturally interact with environments, such as foot grounding and hand grabbing
3. **Procedural Animation**: Generate animations at runtime to add realism and variety to characters

Mastering these technologies requires:
- Solid mathematical foundation (vectors, matrices, quaternions)
- Deep understanding of skeletal animation principles
- Extensive practical experience and tuning

As game graphics continue to advance, player expectations for character animation keep rising. An excellent animation system enhances visual presentation and makes players feel the "life" in characters.
