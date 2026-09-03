---
title: Skeletal Animation System Deep Dive
description: "Master 3D character animation: rigging, skinning, and animation state machines"
track: gamedev
section: graphics
difficulty: intermediate
tags:
  - skeletal animation
  - skinning
  - character animation
  - 3D
status: imported
origin: old/src/content/docs/gamedev/skeletal-animation.en.md
divergence: 0.256
issues: []
legacy:
  category: GameDev
  subcategory: 3D
  order: 30
  lastUpdated: 2026-01-07
---

Skeletal animation is the backbone of character animation in modern games and 3D applications. Unlike vertex animation which stores every vertex position for each frame, skeletal animation uses a hierarchical bone structure to deform a mesh, resulting in dramatically smaller file sizes and enabling real-time animation blending.

## Concept Overview

### What is Skeletal Animation?

Skeletal animation (also called rigging or skinned animation) is a technique where a mesh is bound to an underlying skeleton structure. The skeleton consists of interconnected bones arranged in a hierarchy (parent-child relationships). When bones transform (rotate, translate, or scale), the mesh vertices follow based on their assigned weights.

### Why Skeletal Animation?

| Feature | Skeletal Animation | Vertex Animation |
|---------|-------------------|------------------|
| File Size | Small (bone transforms only) | Large (all vertices per frame) |
| Blending | Easy runtime blending | Complex/impossible |
| Procedural | Supports IK, ragdoll | Very limited |
| Memory | Low | High |
| CPU Cost | Moderate | Low |
| Flexibility | High | Low |

---

## Bone Hierarchy

### Understanding the Skeleton Structure

A skeleton is a tree structure where each bone has:
- A parent bone (except the root)
- Zero or more child bones
- Local transformation (relative to parent)
- World transformation (absolute position in space)

```typescript
// Basic bone structure
interface Bone {
  name: string;
  parent: Bone | null;
  children: Bone[];

  // Local space transform (relative to parent)
  localPosition: Vector3;
  localRotation: Quaternion;
  localScale: Vector3;

  // World space transform (computed)
  worldMatrix: Matrix4;

  // Inverse bind pose (for skinning)
  inverseBindMatrix: Matrix4;
}

class Skeleton {
  bones: Map<string, Bone> = new Map();
  root: Bone | null = null;

  constructor(boneData: BoneData[]) {
    this.buildHierarchy(boneData);
  }

  private buildHierarchy(boneData: BoneData[]): void {
    // First pass: create all bones
    for (const data of boneData) {
      const bone: Bone = {
        name: data.name,
        parent: null,
        children: [],
        localPosition: new Vector3(...data.position),
        localRotation: new Quaternion(...data.rotation),
        localScale: new Vector3(...data.scale),
        worldMatrix: new Matrix4(),
        inverseBindMatrix: new Matrix4()
      };
      this.bones.set(data.name, bone);
    }

    // Second pass: establish hierarchy
    for (const data of boneData) {
      const bone = this.bones.get(data.name)!;
      if (data.parentName) {
        const parent = this.bones.get(data.parentName)!;
        bone.parent = parent;
        parent.children.push(bone);
      } else {
        this.root = bone;
      }
    }

    // Compute initial bind pose matrices
    this.computeBindPose();
  }

  private computeBindPose(): void {
    if (!this.root) return;

    const computeWorldMatrix = (bone: Bone, parentWorld: Matrix4): void => {
      // Compute local matrix
      const localMatrix = Matrix4.compose(
        bone.localPosition,
        bone.localRotation,
        bone.localScale
      );

      // World = Parent * Local
      bone.worldMatrix = Matrix4.multiply(parentWorld, localMatrix);

      // Store inverse for skinning
      bone.inverseBindMatrix = Matrix4.invert(bone.worldMatrix);

      // Recurse to children
      for (const child of bone.children) {
        computeWorldMatrix(child, bone.worldMatrix);
      }
    };

    computeWorldMatrix(this.root, Matrix4.identity());
  }

  // Update skeleton from animation
  updateWorldMatrices(): void {
    if (!this.root) return;

    const update = (bone: Bone, parentWorld: Matrix4): void => {
      const localMatrix = Matrix4.compose(
        bone.localPosition,
        bone.localRotation,
        bone.localScale
      );

      bone.worldMatrix = Matrix4.multiply(parentWorld, localMatrix);

      for (const child of bone.children) {
        update(child, bone.worldMatrix);
      }
    };

    update(this.root, Matrix4.identity());
  }

  // Get final bone matrices for shader
  getBoneMatrices(): Float32Array {
    const matrices = new Float32Array(this.bones.size * 16);
    let index = 0;

    for (const bone of this.bones.values()) {
      // Final matrix = World * InverseBindPose
      const finalMatrix = Matrix4.multiply(
        bone.worldMatrix,
        bone.inverseBindMatrix
      );
      matrices.set(finalMatrix.elements, index * 16);
      index++;
    }

    return matrices;
  }
}
```

### Common Bone Hierarchies

A typical humanoid skeleton follows this structure:

```
Root (Hips)
├── Spine
│   ├── Spine1
│   │   └── Spine2
│   │       ├── Neck
│   │       │   └── Head
│   │       ├── LeftShoulder
│   │       │   └── LeftArm
│   │       │       └── LeftForeArm
│   │       │           └── LeftHand
│   │       │               ├── LeftHandThumb1-3
│   │       │               ├── LeftHandIndex1-3
│   │       │               └── ...
│   │       └── RightShoulder
│   │           └── ... (mirror of left)
├── LeftUpLeg
│   └── LeftLeg
│       └── LeftFoot
│           └── LeftToeBase
└── RightUpLeg
    └── ... (mirror of left)
```

---

## Skinning Weights

### The Skinning Process

Skinning (or vertex weighting) determines how much each bone influences each vertex. A vertex can be influenced by multiple bones, with weights that must sum to 1.0.

```typescript
// Vertex skinning data
interface SkinnedVertex {
  position: Vector3;      // Original vertex position
  normal: Vector3;        // Original normal

  // Bone influences (typically max 4 per vertex)
  boneIndices: number[];  // Which bones affect this vertex
  boneWeights: number[];  // How much each bone affects (sum = 1.0)
}

class SkinnedMesh {
  vertices: SkinnedVertex[];
  skeleton: Skeleton;

  // CPU skinning (for understanding, GPU is preferred)
  computeSkinnedPositions(): Vector3[] {
    const skinnedPositions: Vector3[] = [];

    for (const vertex of this.vertices) {
      let finalPosition = new Vector3(0, 0, 0);

      // Accumulate weighted bone transformations
      for (let i = 0; i < vertex.boneIndices.length; i++) {
        const boneIndex = vertex.boneIndices[i];
        const weight = vertex.boneWeights[i];

        if (weight === 0) continue;

        const bone = this.skeleton.getBoneByIndex(boneIndex);
        const boneMatrix = Matrix4.multiply(
          bone.worldMatrix,
          bone.inverseBindMatrix
        );

        // Transform vertex by bone and accumulate
        const transformedPos = boneMatrix.transformPoint(vertex.position);
        finalPosition = Vector3.add(
          finalPosition,
          Vector3.scale(transformedPos, weight)
        );
      }

      skinnedPositions.push(finalPosition);
    }

    return skinnedPositions;
  }
}
```

### Linear Blend Skinning (LBS)

Linear Blend Skinning is the most common skinning algorithm:

```glsl
// Vertex Shader for Linear Blend Skinning
#version 300 es

// Vertex attributes
in vec3 a_position;
in vec3 a_normal;
in vec4 a_boneIndices;  // Up to 4 bone indices
in vec4 a_boneWeights;  // Corresponding weights

// Bone matrices uniform array
uniform mat4 u_boneMatrices[MAX_BONES];
uniform mat4 u_modelViewProjection;

out vec3 v_normal;

void main() {
  // Calculate skinned position
  mat4 skinMatrix =
    u_boneMatrices[int(a_boneIndices.x)] * a_boneWeights.x +
    u_boneMatrices[int(a_boneIndices.y)] * a_boneWeights.y +
    u_boneMatrices[int(a_boneIndices.z)] * a_boneWeights.z +
    u_boneMatrices[int(a_boneIndices.w)] * a_boneWeights.w;

  vec4 skinnedPosition = skinMatrix * vec4(a_position, 1.0);
  vec3 skinnedNormal = mat3(skinMatrix) * a_normal;

  gl_Position = u_modelViewProjection * skinnedPosition;
  v_normal = normalize(skinnedNormal);
}
```

### Dual Quaternion Skinning

Linear blend skinning can cause volume loss at joints (candy wrapper effect). Dual quaternion skinning preserves volume better:

```typescript
class DualQuaternion {
  real: Quaternion;     // Rotation
  dual: Quaternion;     // Translation encoded

  constructor(rotation: Quaternion, translation: Vector3) {
    this.real = rotation.normalized();

    // Dual part encodes translation
    const t = new Quaternion(translation.x, translation.y, translation.z, 0);
    this.dual = Quaternion.multiply(t, this.real).scale(0.5);
  }

  static fromMatrix(matrix: Matrix4): DualQuaternion {
    const rotation = Quaternion.fromMatrix(matrix);
    const translation = matrix.getTranslation();
    return new DualQuaternion(rotation, translation);
  }

  // Blend multiple dual quaternions
  static blend(dqs: DualQuaternion[], weights: number[]): DualQuaternion {
    let blendedReal = new Quaternion(0, 0, 0, 0);
    let blendedDual = new Quaternion(0, 0, 0, 0);

    // Ensure shortest path interpolation
    const pivot = dqs[0].real;

    for (let i = 0; i < dqs.length; i++) {
      let dq = dqs[i];

      // Flip if necessary (antipodality handling)
      if (Quaternion.dot(pivot, dq.real) < 0) {
        dq = dq.negate();
      }

      blendedReal = Quaternion.add(
        blendedReal,
        dq.real.scale(weights[i])
      );
      blendedDual = Quaternion.add(
        blendedDual,
        dq.dual.scale(weights[i])
      );
    }

    // Normalize
    const norm = blendedReal.length();
    return new DualQuaternion(
      blendedReal.scale(1 / norm),
      blendedDual.scale(1 / norm)
    );
  }

  transformPoint(point: Vector3): Vector3 {
    // Convert point to dual quaternion
    const p = new Quaternion(point.x, point.y, point.z, 0);

    // Transform: q * p * q* + 2 * d * q*
    const rotated = Quaternion.multiply(
      Quaternion.multiply(this.real, p),
      this.real.conjugate()
    );

    const translated = Quaternion.multiply(
      this.dual,
      this.real.conjugate()
    ).scale(2);

    return new Vector3(
      rotated.x + translated.x,
      rotated.y + translated.y,
      rotated.z + translated.z
    );
  }
}
```

### Weight Painting Considerations

Good skinning weights are crucial for quality deformation:

```typescript
// Weight normalization utility
function normalizeWeights(weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights;
  return weights.map(w => w / sum);
}

// Limit influences per vertex (common limit: 4)
function limitInfluences(
  boneIndices: number[],
  boneWeights: number[],
  maxInfluences: number = 4
): { indices: number[], weights: number[] } {
  // Pair and sort by weight
  const pairs = boneIndices.map((idx, i) => ({
    index: idx,
    weight: boneWeights[i]
  }));

  pairs.sort((a, b) => b.weight - a.weight);

  // Take top N influences
  const limited = pairs.slice(0, maxInfluences);

  // Renormalize
  const totalWeight = limited.reduce((sum, p) => sum + p.weight, 0);

  return {
    indices: limited.map(p => p.index),
    weights: limited.map(p => p.weight / totalWeight)
  };
}
```

---

## Keyframe Animation

### Animation Clip Structure

Animations are stored as keyframes - snapshots of bone transforms at specific times:

```typescript
interface Keyframe<T> {
  time: number;
  value: T;
  // Optional tangent data for curves
  inTangent?: T;
  outTangent?: T;
}

interface BoneAnimationTrack {
  boneName: string;
  positionKeys: Keyframe<Vector3>[];
  rotationKeys: Keyframe<Quaternion>[];
  scaleKeys: Keyframe<Vector3>[];
}

class AnimationClip {
  name: string;
  duration: number;
  tracks: BoneAnimationTrack[];
  frameRate: number;

  constructor(name: string, duration: number, tracks: BoneAnimationTrack[]) {
    this.name = name;
    this.duration = duration;
    this.tracks = tracks;
    this.frameRate = 30;
  }

  // Sample animation at a specific time
  sample(time: number, skeleton: Skeleton): void {
    // Clamp or loop time
    const localTime = time % this.duration;

    for (const track of this.tracks) {
      const bone = skeleton.bones.get(track.boneName);
      if (!bone) continue;

      // Sample each channel
      bone.localPosition = this.sampleTrack(
        track.positionKeys,
        localTime
      );
      bone.localRotation = this.sampleTrackQuaternion(
        track.rotationKeys,
        localTime
      );
      bone.localScale = this.sampleTrack(
        track.scaleKeys,
        localTime
      );
    }

    // Update skeleton hierarchy
    skeleton.updateWorldMatrices();
  }

  private sampleTrack<T extends Vector3>(
    keys: Keyframe<T>[],
    time: number
  ): T {
    if (keys.length === 0) return new Vector3(0, 0, 0) as T;
    if (keys.length === 1) return keys[0].value;

    // Find surrounding keyframes
    let prevKey = keys[0];
    let nextKey = keys[keys.length - 1];

    for (let i = 0; i < keys.length - 1; i++) {
      if (keys[i].time <= time && keys[i + 1].time >= time) {
        prevKey = keys[i];
        nextKey = keys[i + 1];
        break;
      }
    }

    // Calculate interpolation factor
    const duration = nextKey.time - prevKey.time;
    const t = duration > 0 ? (time - prevKey.time) / duration : 0;

    // Linear interpolation (lerp)
    return Vector3.lerp(prevKey.value, nextKey.value, t) as T;
  }

  private sampleTrackQuaternion(
    keys: Keyframe<Quaternion>[],
    time: number
  ): Quaternion {
    if (keys.length === 0) return Quaternion.identity();
    if (keys.length === 1) return keys[0].value;

    // Find surrounding keyframes
    let prevKey = keys[0];
    let nextKey = keys[keys.length - 1];

    for (let i = 0; i < keys.length - 1; i++) {
      if (keys[i].time <= time && keys[i + 1].time >= time) {
        prevKey = keys[i];
        nextKey = keys[i + 1];
        break;
      }
    }

    const duration = nextKey.time - prevKey.time;
    const t = duration > 0 ? (time - prevKey.time) / duration : 0;

    // Spherical linear interpolation for rotations
    return Quaternion.slerp(prevKey.value, nextKey.value, t);
  }
}
```

### Animation Compression

Large animation datasets need compression for memory and loading efficiency:

```typescript
class AnimationCompressor {
  // Reduce keyframes while maintaining quality
  static compressTrack<T>(
    keys: Keyframe<T>[],
    errorThreshold: number,
    distanceFunc: (a: T, b: T) => number
  ): Keyframe<T>[] {
    if (keys.length <= 2) return keys;

    const result: Keyframe<T>[] = [keys[0]];
    let lastKey = keys[0];

    for (let i = 1; i < keys.length - 1; i++) {
      const currentKey = keys[i];
      const nextKey = keys[i + 1];

      // Calculate interpolated value at current time
      const duration = nextKey.time - lastKey.time;
      const t = (currentKey.time - lastKey.time) / duration;
      const interpolated = this.interpolate(lastKey.value, nextKey.value, t);

      // Check if keyframe is necessary
      const error = distanceFunc(currentKey.value, interpolated);
      if (error > errorThreshold) {
        result.push(currentKey);
        lastKey = currentKey;
      }
    }

    result.push(keys[keys.length - 1]);
    return result;
  }

  // Quantize rotation keyframes (smaller storage)
  static quantizeQuaternion(q: Quaternion, bits: number = 16): number[] {
    const maxVal = (1 << (bits - 1)) - 1;

    // Find largest component and drop it (can be reconstructed)
    let maxIndex = 0;
    let maxAbs = Math.abs(q.x);

    if (Math.abs(q.y) > maxAbs) { maxIndex = 1; maxAbs = Math.abs(q.y); }
    if (Math.abs(q.z) > maxAbs) { maxIndex = 2; maxAbs = Math.abs(q.z); }
    if (Math.abs(q.w) > maxAbs) { maxIndex = 3; maxAbs = Math.abs(q.w); }

    // Store sign and remaining 3 components
    const sign = [q.x, q.y, q.z, q.w][maxIndex] >= 0 ? 1 : -1;
    const components = [q.x, q.y, q.z, q.w].filter((_, i) => i !== maxIndex);

    // Quantize to integer range
    const quantized = components.map(c =>
      Math.round(c * sign * maxVal)
    );

    return [maxIndex, ...quantized];
  }

  static dequantizeQuaternion(data: number[], bits: number = 16): Quaternion {
    const maxVal = (1 << (bits - 1)) - 1;
    const [maxIndex, ...quantized] = data;

    // Dequantize
    const components = quantized.map(v => v / maxVal);

    // Reconstruct dropped component
    const sumSquares = components.reduce((sum, c) => sum + c * c, 0);
    const droppedComponent = Math.sqrt(1 - sumSquares);

    // Rebuild quaternion
    const result = [0, 0, 0, 0];
    let j = 0;
    for (let i = 0; i < 4; i++) {
      if (i === maxIndex) {
        result[i] = droppedComponent;
      } else {
        result[i] = components[j++];
      }
    }

    return new Quaternion(...result);
  }
}
```

---

## Animation Interpolation

### Interpolation Methods

Different interpolation methods create different motion characteristics:

```typescript
// Easing functions for animation
const Easing = {
  // Linear - constant speed
  linear: (t: number) => t,

  // Quadratic - smooth acceleration/deceleration
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // Cubic - smoother curves
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Elastic - spring-like bounce
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

// Vector interpolation
class Interpolation {
  // Linear interpolation
  static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  static lerpVector3(a: Vector3, b: Vector3, t: number): Vector3 {
    return new Vector3(
      this.lerp(a.x, b.x, t),
      this.lerp(a.y, b.y, t),
      this.lerp(a.z, b.z, t)
    );
  }

  // Spherical linear interpolation (for quaternions)
  static slerp(a: Quaternion, b: Quaternion, t: number): Quaternion {
    let dot = Quaternion.dot(a, b);

    // If negative dot, negate one quaternion (shortest path)
    let bAdj = b;
    if (dot < 0) {
      dot = -dot;
      bAdj = b.negate();
    }

    // If quaternions are very close, use linear interpolation
    if (dot > 0.9995) {
      return Quaternion.normalize(new Quaternion(
        this.lerp(a.x, bAdj.x, t),
        this.lerp(a.y, bAdj.y, t),
        this.lerp(a.z, bAdj.z, t),
        this.lerp(a.w, bAdj.w, t)
      ));
    }

    // Standard slerp formula
    const theta0 = Math.acos(dot);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);

    const s0 = Math.cos(theta) - dot * sinTheta / sinTheta0;
    const s1 = sinTheta / sinTheta0;

    return new Quaternion(
      a.x * s0 + bAdj.x * s1,
      a.y * s0 + bAdj.y * s1,
      a.z * s0 + bAdj.z * s1,
      a.w * s0 + bAdj.w * s1
    );
  }

  // Cubic Hermite spline interpolation
  static hermite(
    p0: number, m0: number,  // Start point and tangent
    p1: number, m1: number,  // End point and tangent
    t: number
  ): number {
    const t2 = t * t;
    const t3 = t2 * t;

    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    return h00 * p0 + h10 * m0 + h01 * p1 + h11 * m1;
  }

  // Catmull-Rom spline (passes through all control points)
  static catmullRom(
    p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3,
    t: number
  ): Vector3 {
    const t2 = t * t;
    const t3 = t2 * t;

    return new Vector3(
      0.5 * ((2 * p1.x) +
             (-p0.x + p2.x) * t +
             (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
             (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      0.5 * ((2 * p1.y) +
             (-p0.y + p2.y) * t +
             (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
             (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      0.5 * ((2 * p1.z) +
             (-p0.z + p2.z) * t +
             (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
             (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3)
    );
  }
}
```

### Animation Blending

Blending allows smooth transitions between animations:

```typescript
interface AnimationState {
  clip: AnimationClip;
  time: number;
  weight: number;
  speed: number;
}

class AnimationBlender {
  // Blend two poses
  static blendPose(
    skeleton: Skeleton,
    poseA: Map<string, BoneTransform>,
    poseB: Map<string, BoneTransform>,
    blendFactor: number
  ): void {
    for (const bone of skeleton.bones.values()) {
      const transformA = poseA.get(bone.name);
      const transformB = poseB.get(bone.name);

      if (!transformA || !transformB) continue;

      bone.localPosition = Vector3.lerp(
        transformA.position,
        transformB.position,
        blendFactor
      );

      bone.localRotation = Quaternion.slerp(
        transformA.rotation,
        transformB.rotation,
        blendFactor
      );

      bone.localScale = Vector3.lerp(
        transformA.scale,
        transformB.scale,
        blendFactor
      );
    }
  }

  // Blend multiple animations with weights
  static blendMultiple(
    skeleton: Skeleton,
    states: AnimationState[]
  ): void {
    // Normalize weights
    const totalWeight = states.reduce((sum, s) => sum + s.weight, 0);
    if (totalWeight === 0) return;

    const normalizedStates = states.map(s => ({
      ...s,
      weight: s.weight / totalWeight
    }));

    // Sample all animations
    const poses: { pose: Map<string, BoneTransform>, weight: number }[] = [];

    for (const state of normalizedStates) {
      const pose = this.sampleClipToPose(state.clip, state.time);
      poses.push({ pose, weight: state.weight });
    }

    // Blend all bones
    for (const bone of skeleton.bones.values()) {
      let blendedPos = new Vector3(0, 0, 0);
      let blendedScale = new Vector3(0, 0, 0);
      let blendedRot = new Quaternion(0, 0, 0, 0);

      for (const { pose, weight } of poses) {
        const transform = pose.get(bone.name);
        if (!transform) continue;

        blendedPos = Vector3.add(
          blendedPos,
          Vector3.scale(transform.position, weight)
        );
        blendedScale = Vector3.add(
          blendedScale,
          Vector3.scale(transform.scale, weight)
        );

        // Quaternion blending requires special handling
        if (Quaternion.dot(blendedRot, transform.rotation) < 0) {
          blendedRot = Quaternion.add(
            blendedRot,
            transform.rotation.negate().scale(weight)
          );
        } else {
          blendedRot = Quaternion.add(
            blendedRot,
            transform.rotation.scale(weight)
          );
        }
      }

      bone.localPosition = blendedPos;
      bone.localScale = blendedScale;
      bone.localRotation = Quaternion.normalize(blendedRot);
    }
  }

  // Additive blending (layered animations)
  static additiveBlend(
    skeleton: Skeleton,
    basePose: Map<string, BoneTransform>,
    additivePose: Map<string, BoneTransform>,
    additiveWeight: number
  ): void {
    for (const bone of skeleton.bones.values()) {
      const base = basePose.get(bone.name);
      const additive = additivePose.get(bone.name);

      if (!base || !additive) continue;

      // Add position offset
      bone.localPosition = Vector3.add(
        base.position,
        Vector3.scale(additive.position, additiveWeight)
      );

      // Multiply rotations
      const additiveRot = Quaternion.slerp(
        Quaternion.identity(),
        additive.rotation,
        additiveWeight
      );
      bone.localRotation = Quaternion.multiply(base.rotation, additiveRot);

      // Multiply scales
      bone.localScale = Vector3.multiply(
        base.scale,
        Vector3.lerp(new Vector3(1, 1, 1), additive.scale, additiveWeight)
      );
    }
  }

  private static sampleClipToPose(
    clip: AnimationClip,
    time: number
  ): Map<string, BoneTransform> {
    const pose = new Map<string, BoneTransform>();

    for (const track of clip.tracks) {
      pose.set(track.boneName, {
        position: this.sampleVector3Track(track.positionKeys, time),
        rotation: this.sampleQuaternionTrack(track.rotationKeys, time),
        scale: this.sampleVector3Track(track.scaleKeys, time)
      });
    }

    return pose;
  }
}
```

---

## Animation State Machines

### State Machine Architecture

A Finite State Machine (FSM) manages animation states and transitions:

```typescript
interface AnimationStateConfig {
  name: string;
  clip: AnimationClip;
  loop: boolean;
  speed: number;
}

interface TransitionConfig {
  from: string;
  to: string;
  duration: number;
  condition?: () => boolean;
  exitTime?: number;  // Normalized time (0-1) when transition can occur
}

class AnimationStateMachine {
  private states: Map<string, AnimationStateConfig> = new Map();
  private transitions: TransitionConfig[] = [];

  private currentState: AnimationStateConfig | null = null;
  private currentTime: number = 0;

  private targetState: AnimationStateConfig | null = null;
  private transitionProgress: number = 0;
  private transitionDuration: number = 0;

  // Parameters for transition conditions
  private parameters: Map<string, number | boolean | string> = new Map();

  addState(config: AnimationStateConfig): void {
    this.states.set(config.name, config);
    if (!this.currentState) {
      this.currentState = config;
    }
  }

  addTransition(config: TransitionConfig): void {
    this.transitions.push(config);
  }

  setParameter(name: string, value: number | boolean | string): void {
    this.parameters.set(name, value);
  }

  getParameter<T>(name: string): T | undefined {
    return this.parameters.get(name) as T;
  }

  update(deltaTime: number, skeleton: Skeleton): void {
    if (!this.currentState) return;

    // Update time
    this.currentTime += deltaTime * this.currentState.speed;

    // Check for transitions
    if (!this.targetState) {
      this.checkTransitions();
    }

    // Handle active transition
    if (this.targetState && this.transitionDuration > 0) {
      this.transitionProgress += deltaTime / this.transitionDuration;

      if (this.transitionProgress >= 1) {
        // Transition complete
        this.currentState = this.targetState;
        this.currentTime = this.transitionProgress * this.transitionDuration
          * this.targetState.speed;
        this.targetState = null;
        this.transitionProgress = 0;
      }
    }

    // Sample and blend animations
    this.sampleAnimations(skeleton);
  }

  private checkTransitions(): void {
    if (!this.currentState) return;

    const normalizedTime = this.currentTime / this.currentState.clip.duration;

    for (const transition of this.transitions) {
      if (transition.from !== this.currentState.name) continue;

      // Check exit time
      if (transition.exitTime !== undefined) {
        if (normalizedTime < transition.exitTime) continue;
      }

      // Check condition
      if (transition.condition && !transition.condition()) continue;

      // Start transition
      this.targetState = this.states.get(transition.to) || null;
      this.transitionDuration = transition.duration;
      this.transitionProgress = 0;
      break;
    }
  }

  private sampleAnimations(skeleton: Skeleton): void {
    if (!this.currentState) return;

    // Get current pose
    const currentTime = this.currentState.loop
      ? this.currentTime % this.currentState.clip.duration
      : Math.min(this.currentTime, this.currentState.clip.duration);

    this.currentState.clip.sample(currentTime, skeleton);

    // Blend with target if transitioning
    if (this.targetState && this.transitionProgress > 0) {
      const targetTime = this.transitionProgress * this.transitionDuration
        * this.targetState.speed;

      // Store current pose
      const currentPose = this.capturePose(skeleton);

      // Sample target pose
      this.targetState.clip.sample(targetTime, skeleton);
      const targetPose = this.capturePose(skeleton);

      // Blend
      AnimationBlender.blendPose(
        skeleton,
        currentPose,
        targetPose,
        this.transitionProgress
      );
    }

    skeleton.updateWorldMatrices();
  }

  private capturePose(skeleton: Skeleton): Map<string, BoneTransform> {
    const pose = new Map<string, BoneTransform>();
    for (const bone of skeleton.bones.values()) {
      pose.set(bone.name, {
        position: bone.localPosition.clone(),
        rotation: bone.localRotation.clone(),
        scale: bone.localScale.clone()
      });
    }
    return pose;
  }
}

// Usage example
const stateMachine = new AnimationStateMachine();

// Add states
stateMachine.addState({
  name: 'idle',
  clip: idleAnimation,
  loop: true,
  speed: 1
});

stateMachine.addState({
  name: 'walk',
  clip: walkAnimation,
  loop: true,
  speed: 1
});

stateMachine.addState({
  name: 'run',
  clip: runAnimation,
  loop: true,
  speed: 1
});

stateMachine.addState({
  name: 'jump',
  clip: jumpAnimation,
  loop: false,
  speed: 1
});

// Add transitions
stateMachine.addTransition({
  from: 'idle',
  to: 'walk',
  duration: 0.2,
  condition: () => stateMachine.getParameter<number>('speed')! > 0.1
});

stateMachine.addTransition({
  from: 'walk',
  to: 'idle',
  duration: 0.2,
  condition: () => stateMachine.getParameter<number>('speed')! < 0.1
});

stateMachine.addTransition({
  from: 'walk',
  to: 'run',
  duration: 0.2,
  condition: () => stateMachine.getParameter<number>('speed')! > 0.6
});

stateMachine.addTransition({
  from: 'idle',
  to: 'jump',
  duration: 0.1,
  condition: () => stateMachine.getParameter<boolean>('jump') === true
});

stateMachine.addTransition({
  from: 'jump',
  to: 'idle',
  duration: 0.3,
  exitTime: 0.9  // Transition near end of jump animation
});
```

### Blend Trees

For smooth locomotion, blend trees combine multiple animations based on parameters:

```typescript
interface BlendNode {
  type: 'clip' | '1d' | '2d';
}

interface ClipNode extends BlendNode {
  type: 'clip';
  clip: AnimationClip;
}

interface BlendTree1D extends BlendNode {
  type: '1d';
  parameter: string;
  children: { threshold: number; node: BlendNode }[];
}

interface BlendTree2D extends BlendNode {
  type: '2d';
  parameterX: string;
  parameterY: string;
  children: { x: number; y: number; node: BlendNode }[];
}

class BlendTreeEvaluator {
  private parameters: Map<string, number> = new Map();

  setParameter(name: string, value: number): void {
    this.parameters.set(name, value);
  }

  evaluate(
    node: BlendNode,
    time: number
  ): { clips: AnimationClip[], weights: number[], times: number[] } {
    if (node.type === 'clip') {
      return {
        clips: [(node as ClipNode).clip],
        weights: [1],
        times: [time]
      };
    }

    if (node.type === '1d') {
      return this.evaluate1D(node as BlendTree1D, time);
    }

    if (node.type === '2d') {
      return this.evaluate2D(node as BlendTree2D, time);
    }

    return { clips: [], weights: [], times: [] };
  }

  private evaluate1D(
    tree: BlendTree1D,
    time: number
  ): { clips: AnimationClip[], weights: number[], times: number[] } {
    const param = this.parameters.get(tree.parameter) || 0;
    const children = [...tree.children].sort((a, b) => a.threshold - b.threshold);

    // Find surrounding children
    let lower = children[0];
    let upper = children[children.length - 1];

    for (let i = 0; i < children.length - 1; i++) {
      if (children[i].threshold <= param && children[i + 1].threshold >= param) {
        lower = children[i];
        upper = children[i + 1];
        break;
      }
    }

    // Calculate blend weight
    const range = upper.threshold - lower.threshold;
    const t = range > 0 ? (param - lower.threshold) / range : 0;

    // Recursively evaluate children
    const lowerResult = this.evaluate(lower.node, time);
    const upperResult = this.evaluate(upper.node, time);

    // Combine results
    const clips = [...lowerResult.clips, ...upperResult.clips];
    const weights = [
      ...lowerResult.weights.map(w => w * (1 - t)),
      ...upperResult.weights.map(w => w * t)
    ];
    const times = [...lowerResult.times, ...upperResult.times];

    return { clips, weights, times };
  }

  private evaluate2D(
    tree: BlendTree2D,
    time: number
  ): { clips: AnimationClip[], weights: number[], times: number[] } {
    const paramX = this.parameters.get(tree.parameterX) || 0;
    const paramY = this.parameters.get(tree.parameterY) || 0;

    // Use gradient band interpolation or barycentric coordinates
    // Simplified: inverse distance weighting
    const weights: number[] = [];
    let totalWeight = 0;

    for (const child of tree.children) {
      const dx = paramX - child.x;
      const dy = paramY - child.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const weight = distance < 0.001 ? 1000 : 1 / distance;
      weights.push(weight);
      totalWeight += weight;
    }

    // Normalize weights
    const normalizedWeights = weights.map(w => w / totalWeight);

    // Evaluate all children and combine
    const allClips: AnimationClip[] = [];
    const allWeights: number[] = [];
    const allTimes: number[] = [];

    for (let i = 0; i < tree.children.length; i++) {
      const result = this.evaluate(tree.children[i].node, time);
      allClips.push(...result.clips);
      allWeights.push(...result.weights.map(w => w * normalizedWeights[i]));
      allTimes.push(...result.times);
    }

    return { clips: allClips, weights: allWeights, times: allTimes };
  }
}

// Usage: Locomotion blend tree
const locomotionTree: BlendTree2D = {
  type: '2d',
  parameterX: 'velocityX',  // Strafe
  parameterY: 'velocityZ',  // Forward/back
  children: [
    { x: 0, y: 0, node: { type: 'clip', clip: idleClip } },
    { x: 0, y: 1, node: { type: 'clip', clip: walkForwardClip } },
    { x: 0, y: -1, node: { type: 'clip', clip: walkBackwardClip } },
    { x: 1, y: 0, node: { type: 'clip', clip: walkRightClip } },
    { x: -1, y: 0, node: { type: 'clip', clip: walkLeftClip } },
    { x: 0.7, y: 0.7, node: { type: 'clip', clip: walkForwardRightClip } },
    // ... more directions
  ]
};
```

---

## Animation Events

### Event System

Animation events trigger callbacks at specific times during playback:

```typescript
interface AnimationEvent {
  time: number;           // Time in seconds
  name: string;           // Event identifier
  data?: any;             // Optional payload
  intParameter?: number;
  floatParameter?: number;
  stringParameter?: string;
}

class AnimationEventSystem {
  private events: Map<string, AnimationEvent[]> = new Map();
  private listeners: Map<string, ((event: AnimationEvent) => void)[]> = new Map();
  private firedEvents: Set<string> = new Set();

  registerEvents(clipName: string, events: AnimationEvent[]): void {
    this.events.set(clipName, events.sort((a, b) => a.time - b.time));
  }

  addEventListener(
    eventName: string,
    callback: (event: AnimationEvent) => void
  ): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(callback);
  }

  removeEventListener(
    eventName: string,
    callback: (event: AnimationEvent) => void
  ): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index >= 0) listeners.splice(index, 1);
    }
  }

  update(clipName: string, previousTime: number, currentTime: number): void {
    const events = this.events.get(clipName);
    if (!events) return;

    for (const event of events) {
      const eventKey = `${clipName}:${event.name}:${event.time}`;

      // Check if event should fire (handles looping)
      const shouldFire =
        (previousTime <= event.time && currentTime > event.time) ||
        (currentTime < previousTime && event.time >= previousTime) || // Loop case
        (currentTime < previousTime && event.time <= currentTime);    // Loop case

      if (shouldFire && !this.firedEvents.has(eventKey)) {
        this.fireEvent(event);
        this.firedEvents.add(eventKey);
      }
    }
  }

  resetEvents(clipName: string): void {
    // Clear fired events when animation restarts
    for (const key of this.firedEvents) {
      if (key.startsWith(clipName + ':')) {
        this.firedEvents.delete(key);
      }
    }
  }

  private fireEvent(event: AnimationEvent): void {
    const listeners = this.listeners.get(event.name);
    if (listeners) {
      for (const callback of listeners) {
        callback(event);
      }
    }

    // Also fire wildcard listeners
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      for (const callback of wildcardListeners) {
        callback(event);
      }
    }
  }
}

// Usage
const eventSystem = new AnimationEventSystem();

// Register events for a walk cycle
eventSystem.registerEvents('walk', [
  { time: 0.0, name: 'footstep', stringParameter: 'left' },
  { time: 0.5, name: 'footstep', stringParameter: 'right' }
]);

// Listen for footstep events
eventSystem.addEventListener('footstep', (event) => {
  const foot = event.stringParameter;
  console.log(`Playing footstep sound for ${foot} foot`);
  audioSystem.play('footstep_' + foot);

  // Spawn dust particle
  particleSystem.emit('dust', character.getFootPosition(foot));
});

// In animation update loop
function updateAnimation(deltaTime: number): void {
  const prevTime = animationTime;
  animationTime += deltaTime;

  if (animationTime >= currentClip.duration) {
    animationTime = animationTime % currentClip.duration;
    eventSystem.resetEvents(currentClip.name);
  }

  eventSystem.update(currentClip.name, prevTime, animationTime);
}
```

### Common Event Types

```typescript
// Typical animation events
const commonEvents = {
  // Combat
  'attack_start': { time: 0.1 },
  'attack_hit': { time: 0.3 },      // Enable hitbox
  'attack_end': { time: 0.5 },      // Disable hitbox

  // Sound
  'footstep': { time: 0.25 },
  'voice': { time: 0.0, stringParameter: 'grunt' },
  'weapon_swoosh': { time: 0.2 },

  // VFX
  'spawn_particle': { time: 0.3, stringParameter: 'impact_dust' },
  'screen_shake': { time: 0.35, floatParameter: 0.5 },

  // Gameplay
  'enable_movement': { time: 0.8 },
  'can_cancel': { time: 0.6 },
  'invincibility_start': { time: 0.1 },
  'invincibility_end': { time: 0.4 }
};
```

---

## Root Motion

### Extracting Root Motion

Root motion extracts movement data from the animation to drive character locomotion:

```typescript
interface RootMotionData {
  deltaPosition: Vector3;
  deltaRotation: Quaternion;
}

class RootMotionExtractor {
  private skeleton: Skeleton;
  private rootBoneName: string;

  constructor(skeleton: Skeleton, rootBoneName: string = 'Hips') {
    this.skeleton = skeleton;
    this.rootBoneName = rootBoneName;
  }

  // Extract root motion delta between two times
  extractDelta(
    clip: AnimationClip,
    fromTime: number,
    toTime: number
  ): RootMotionData {
    const track = clip.tracks.find(t => t.boneName === this.rootBoneName);
    if (!track) {
      return {
        deltaPosition: new Vector3(0, 0, 0),
        deltaRotation: Quaternion.identity()
      };
    }

    // Sample positions at both times
    const posFrom = this.samplePosition(track.positionKeys, fromTime);
    const posTo = this.samplePosition(track.positionKeys, toTime);

    // Sample rotations
    const rotFrom = this.sampleRotation(track.rotationKeys, fromTime);
    const rotTo = this.sampleRotation(track.rotationKeys, toTime);

    // Calculate deltas
    let deltaPosition = Vector3.subtract(posTo, posFrom);

    // Only use horizontal movement (XZ plane)
    deltaPosition.y = 0;

    // Delta rotation (usually only Y-axis rotation for locomotion)
    const deltaRotation = Quaternion.multiply(
      rotTo,
      Quaternion.inverse(rotFrom)
    );

    return { deltaPosition, deltaRotation };
  }

  // Apply root motion to character
  applyRootMotion(
    character: CharacterController,
    rootMotion: RootMotionData,
    deltaTime: number
  ): void {
    // Rotate delta position by character's current rotation
    const worldDelta = character.rotation.rotateVector(rootMotion.deltaPosition);

    // Apply to character position
    character.position = Vector3.add(character.position, worldDelta);

    // Apply rotation
    character.rotation = Quaternion.multiply(
      character.rotation,
      rootMotion.deltaRotation
    );
  }

  // Zero out root bone movement (animation plays in-place)
  removeRootMotion(skeleton: Skeleton): void {
    const rootBone = skeleton.bones.get(this.rootBoneName);
    if (rootBone) {
      // Keep only vertical position (for jumps)
      rootBone.localPosition.x = 0;
      rootBone.localPosition.z = 0;

      // Remove horizontal rotation
      // Keep only Y rotation if needed, or zero out entirely
      rootBone.localRotation = Quaternion.identity();
    }
  }

  private samplePosition(
    keys: Keyframe<Vector3>[],
    time: number
  ): Vector3 {
    // Same interpolation logic as AnimationClip
    // ... (implementation similar to earlier examples)
    return new Vector3(0, 0, 0); // Placeholder
  }

  private sampleRotation(
    keys: Keyframe<Quaternion>[],
    time: number
  ): Quaternion {
    // Same interpolation logic as AnimationClip
    return Quaternion.identity(); // Placeholder
  }
}

// Integration with animation system
class RootMotionAnimator {
  private skeleton: Skeleton;
  private extractor: RootMotionExtractor;
  private character: CharacterController;
  private currentClip: AnimationClip | null = null;
  private currentTime: number = 0;

  constructor(
    skeleton: Skeleton,
    character: CharacterController,
    rootBoneName: string
  ) {
    this.skeleton = skeleton;
    this.character = character;
    this.extractor = new RootMotionExtractor(skeleton, rootBoneName);
  }

  update(deltaTime: number): void {
    if (!this.currentClip) return;

    const prevTime = this.currentTime;
    this.currentTime += deltaTime;

    // Handle looping
    if (this.currentTime >= this.currentClip.duration) {
      // Extract motion for remaining time
      const remaining = this.currentClip.duration - prevTime;
      if (remaining > 0) {
        const motion = this.extractor.extractDelta(
          this.currentClip,
          prevTime,
          this.currentClip.duration
        );
        this.extractor.applyRootMotion(this.character, motion, remaining);
      }

      this.currentTime = this.currentTime % this.currentClip.duration;

      // Extract motion for looped portion
      if (this.currentTime > 0) {
        const motion = this.extractor.extractDelta(
          this.currentClip,
          0,
          this.currentTime
        );
        this.extractor.applyRootMotion(this.character, motion, this.currentTime);
      }
    } else {
      // Normal case: extract delta for this frame
      const motion = this.extractor.extractDelta(
        this.currentClip,
        prevTime,
        this.currentTime
      );
      this.extractor.applyRootMotion(this.character, motion, deltaTime);
    }

    // Sample animation (with root motion removed)
    this.currentClip.sample(this.currentTime, this.skeleton);
    this.extractor.removeRootMotion(this.skeleton);
    this.skeleton.updateWorldMatrices();
  }
}
```

---

## Animation Retargeting

### Retargeting Between Different Skeletons

Animation retargeting allows sharing animations between characters with different proportions:

```typescript
interface RetargetMapping {
  sourceBone: string;
  targetBone: string;

  // Optional transform adjustments
  rotationOffset?: Quaternion;
  positionScale?: Vector3;
}

class AnimationRetargeter {
  private sourceSkeleton: Skeleton;
  private targetSkeleton: Skeleton;
  private mapping: RetargetMapping[];

  constructor(
    sourceSkeleton: Skeleton,
    targetSkeleton: Skeleton,
    mapping: RetargetMapping[]
  ) {
    this.sourceSkeleton = sourceSkeleton;
    this.targetSkeleton = targetSkeleton;
    this.mapping = mapping;
  }

  // Auto-generate mapping based on bone names
  static createAutoMapping(
    source: Skeleton,
    target: Skeleton
  ): RetargetMapping[] {
    const mapping: RetargetMapping[] = [];

    for (const [sourceName, sourceBone] of source.bones) {
      // Try exact match
      if (target.bones.has(sourceName)) {
        mapping.push({
          sourceBone: sourceName,
          targetBone: sourceName
        });
        continue;
      }

      // Try common naming variations
      const variations = [
        sourceName.replace('mixamorig:', ''),
        sourceName.replace('Bip01_', ''),
        sourceName.toLowerCase(),
        this.humanoidNameMapping[sourceName]
      ].filter(Boolean);

      for (const variant of variations) {
        if (target.bones.has(variant)) {
          mapping.push({
            sourceBone: sourceName,
            targetBone: variant
          });
          break;
        }
      }
    }

    return mapping;
  }

  // Standard humanoid bone name mapping
  private static humanoidNameMapping: Record<string, string> = {
    'mixamorig:Hips': 'Hips',
    'mixamorig:Spine': 'Spine',
    'mixamorig:Spine1': 'Spine1',
    'mixamorig:Spine2': 'Spine2',
    'mixamorig:Neck': 'Neck',
    'mixamorig:Head': 'Head',
    'mixamorig:LeftShoulder': 'LeftShoulder',
    'mixamorig:LeftArm': 'LeftUpperArm',
    'mixamorig:LeftForeArm': 'LeftLowerArm',
    'mixamorig:LeftHand': 'LeftHand',
    // ... more mappings
  };

  retarget(sourceAnimation: AnimationClip): AnimationClip {
    const retargetedTracks: BoneAnimationTrack[] = [];

    for (const mapping of this.mapping) {
      const sourceTrack = sourceAnimation.tracks.find(
        t => t.boneName === mapping.sourceBone
      );

      if (!sourceTrack) continue;

      // Get bone info for scale calculation
      const sourceBone = this.sourceSkeleton.bones.get(mapping.sourceBone);
      const targetBone = this.targetSkeleton.bones.get(mapping.targetBone);

      if (!sourceBone || !targetBone) continue;

      // Calculate scale ratio
      const scaleRatio = this.calculateBoneScaleRatio(sourceBone, targetBone);

      // Retarget the track
      const retargetedTrack: BoneAnimationTrack = {
        boneName: mapping.targetBone,
        positionKeys: this.retargetPositionKeys(
          sourceTrack.positionKeys,
          scaleRatio,
          mapping.positionScale
        ),
        rotationKeys: this.retargetRotationKeys(
          sourceTrack.rotationKeys,
          mapping.rotationOffset
        ),
        scaleKeys: [...sourceTrack.scaleKeys]  // Scale usually transfers directly
      };

      retargetedTracks.push(retargetedTrack);
    }

    return new AnimationClip(
      sourceAnimation.name + '_retargeted',
      sourceAnimation.duration,
      retargetedTracks
    );
  }

  private calculateBoneScaleRatio(source: Bone, target: Bone): Vector3 {
    // Calculate bone length ratio
    const sourceLength = this.getBoneLength(source);
    const targetLength = this.getBoneLength(target);

    const ratio = targetLength / sourceLength;
    return new Vector3(ratio, ratio, ratio);
  }

  private getBoneLength(bone: Bone): number {
    if (bone.children.length === 0) return 1;

    // Distance to first child
    const childPos = bone.children[0].localPosition;
    return childPos.length();
  }

  private retargetPositionKeys(
    keys: Keyframe<Vector3>[],
    scaleRatio: Vector3,
    additionalScale?: Vector3
  ): Keyframe<Vector3>[] {
    const scale = additionalScale
      ? Vector3.multiply(scaleRatio, additionalScale)
      : scaleRatio;

    return keys.map(key => ({
      time: key.time,
      value: Vector3.multiply(key.value, scale)
    }));
  }

  private retargetRotationKeys(
    keys: Keyframe<Quaternion>[],
    offset?: Quaternion
  ): Keyframe<Quaternion>[] {
    if (!offset) return [...keys];

    return keys.map(key => ({
      time: key.time,
      value: Quaternion.multiply(offset, key.value)
    }));
  }
}

// T-pose matching for proper retargeting
class TPoseCalibrator {
  static calibrate(skeleton: Skeleton): Map<string, Quaternion> {
    const tposeRotations = new Map<string, Quaternion>();

    // Define ideal T-pose orientations
    const idealTPose: Record<string, Vector3> = {
      'LeftArm': new Vector3(-1, 0, 0),     // Pointing left
      'RightArm': new Vector3(1, 0, 0),      // Pointing right
      'LeftForeArm': new Vector3(-1, 0, 0),
      'RightForeArm': new Vector3(1, 0, 0),
      'LeftUpLeg': new Vector3(0, -1, 0),    // Pointing down
      'RightUpLeg': new Vector3(0, -1, 0),
      // ... more bones
    };

    for (const [boneName, idealDir] of Object.entries(idealTPose)) {
      const bone = skeleton.bones.get(boneName);
      if (!bone || bone.children.length === 0) continue;

      // Get current bone direction
      const childPos = bone.children[0].localPosition.normalized();

      // Calculate rotation to align with ideal direction
      const alignRotation = Quaternion.fromToRotation(childPos, idealDir);
      tposeRotations.set(boneName, alignRotation);
    }

    return tposeRotations;
  }
}
```

---

## Performance Optimization

### GPU Skinning

Moving skinning calculations to the GPU:

```glsl
// Optimized GPU skinning vertex shader
#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_texCoord;
layout(location = 3) in vec4 a_boneIndices;
layout(location = 4) in vec4 a_boneWeights;

// Use texture for bone matrices (supports more bones)
uniform sampler2D u_boneMatrixTexture;
uniform int u_numBones;
uniform mat4 u_viewProjection;

out vec3 v_normal;
out vec2 v_texCoord;

mat4 getBoneMatrix(int index) {
  // Each matrix = 4 texels (vec4 per row)
  float y = float(index) / float(u_numBones);
  return mat4(
    texture(u_boneMatrixTexture, vec2(0.0, y)),
    texture(u_boneMatrixTexture, vec2(0.25, y)),
    texture(u_boneMatrixTexture, vec2(0.5, y)),
    texture(u_boneMatrixTexture, vec2(0.75, y))
  );
}

void main() {
  // Build skin matrix from weighted bone matrices
  mat4 skinMatrix = mat4(0.0);

  skinMatrix += getBoneMatrix(int(a_boneIndices.x)) * a_boneWeights.x;
  skinMatrix += getBoneMatrix(int(a_boneIndices.y)) * a_boneWeights.y;
  skinMatrix += getBoneMatrix(int(a_boneIndices.z)) * a_boneWeights.z;
  skinMatrix += getBoneMatrix(int(a_boneIndices.w)) * a_boneWeights.w;

  vec4 skinnedPosition = skinMatrix * vec4(a_position, 1.0);
  mat3 normalMatrix = mat3(skinMatrix);

  gl_Position = u_viewProjection * skinnedPosition;
  v_normal = normalize(normalMatrix * a_normal);
  v_texCoord = a_texCoord;
}
```

### Animation LOD

Reducing animation quality for distant characters:

```typescript
class AnimationLOD {
  private skeleton: Skeleton;
  private fullBones: Set<string>;
  private lodLevels: LODLevel[];

  constructor(skeleton: Skeleton) {
    this.skeleton = skeleton;
    this.fullBones = new Set(skeleton.bones.keys());
    this.lodLevels = this.createLODLevels();
  }

  private createLODLevels(): LODLevel[] {
    return [
      {
        distance: 0,
        updateRate: 1,           // Full framerate
        activeBones: this.fullBones
      },
      {
        distance: 10,
        updateRate: 2,           // Every 2 frames
        activeBones: new Set([   // Major bones only
          'Hips', 'Spine', 'Spine2', 'Head',
          'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm',
          'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg'
        ])
      },
      {
        distance: 25,
        updateRate: 4,           // Every 4 frames
        activeBones: new Set([   // Minimal bones
          'Hips', 'Spine2', 'Head',
          'LeftArm', 'RightArm',
          'LeftUpLeg', 'RightUpLeg'
        ])
      },
      {
        distance: 50,
        updateRate: 8,           // Every 8 frames
        activeBones: new Set(['Hips'])  // Root only
      }
    ];
  }

  selectLOD(cameraDistance: number): LODLevel {
    for (let i = this.lodLevels.length - 1; i >= 0; i--) {
      if (cameraDistance >= this.lodLevels[i].distance) {
        return this.lodLevels[i];
      }
    }
    return this.lodLevels[0];
  }

  shouldUpdate(frameNumber: number, updateRate: number): boolean {
    return frameNumber % updateRate === 0;
  }
}

interface LODLevel {
  distance: number;
  updateRate: number;
  activeBones: Set<string>;
}
```

### Animation Instancing

Efficiently animating many identical characters:

```typescript
class AnimationInstancer {
  private batchSize: number = 100;
  private instances: AnimationInstance[] = [];
  private boneMatrixBuffer: Float32Array;

  constructor(skeleton: Skeleton, maxInstances: number) {
    const bonesPerInstance = skeleton.bones.size;
    this.boneMatrixBuffer = new Float32Array(maxInstances * bonesPerInstance * 16);
  }

  addInstance(
    animation: AnimationClip,
    startTime: number,
    speed: number
  ): number {
    const id = this.instances.length;
    this.instances.push({
      id,
      animation,
      time: startTime,
      speed,
      active: true
    });
    return id;
  }

  update(deltaTime: number): void {
    // Update all instance times
    for (const instance of this.instances) {
      if (!instance.active) continue;

      instance.time += deltaTime * instance.speed;
      if (instance.time >= instance.animation.duration) {
        instance.time = instance.time % instance.animation.duration;
      }
    }

    // Batch compute bone matrices
    this.computeBatchedBoneMatrices();
  }

  private computeBatchedBoneMatrices(): void {
    // Can be parallelized with Web Workers
    const workerData = this.instances
      .filter(i => i.active)
      .map(i => ({
        id: i.id,
        animation: i.animation.name,
        time: i.time
      }));

    // Send to worker pool for parallel computation
    // Results written back to boneMatrixBuffer
  }

  getBoneMatrixTexture(): WebGLTexture {
    // Create/update texture from boneMatrixBuffer
    // Used by instanced draw calls
    return this.matrixTexture;
  }
}

interface AnimationInstance {
  id: number;
  animation: AnimationClip;
  time: number;
  speed: number;
  active: boolean;
}
```

---

## Complete Implementation Example

### Full Skeletal Animation System

```typescript
// Complete animation system integrating all concepts
class SkeletalAnimationSystem {
  skeleton: Skeleton;
  skinnedMesh: SkinnedMesh;
  stateMachine: AnimationStateMachine;
  eventSystem: AnimationEventSystem;
  rootMotionExtractor: RootMotionExtractor;
  blendTreeEvaluator: BlendTreeEvaluator;
  animationLOD: AnimationLOD;

  private animations: Map<string, AnimationClip> = new Map();
  private currentLOD: LODLevel;
  private frameCount: number = 0;
  private lastUpdateFrame: number = 0;

  constructor(
    skeletonData: BoneData[],
    meshData: SkinnedMeshData
  ) {
    this.skeleton = new Skeleton(skeletonData);
    this.skinnedMesh = new SkinnedMesh(meshData, this.skeleton);
    this.stateMachine = new AnimationStateMachine();
    this.eventSystem = new AnimationEventSystem();
    this.rootMotionExtractor = new RootMotionExtractor(this.skeleton);
    this.blendTreeEvaluator = new BlendTreeEvaluator();
    this.animationLOD = new AnimationLOD(this.skeleton);
    this.currentLOD = this.animationLOD.selectLOD(0);
  }

  loadAnimation(name: string, clip: AnimationClip): void {
    this.animations.set(name, clip);
  }

  setupStateMachine(
    states: AnimationStateConfig[],
    transitions: TransitionConfig[]
  ): void {
    for (const state of states) {
      this.stateMachine.addState(state);
    }
    for (const transition of transitions) {
      this.stateMachine.addTransition(transition);
    }
  }

  update(
    deltaTime: number,
    cameraDistance: number,
    character?: CharacterController
  ): void {
    this.frameCount++;

    // Update LOD
    this.currentLOD = this.animationLOD.selectLOD(cameraDistance);

    // Check if we should update this frame
    if (!this.animationLOD.shouldUpdate(
      this.frameCount,
      this.currentLOD.updateRate
    )) {
      return;
    }

    const actualDeltaTime = deltaTime *
      (this.frameCount - this.lastUpdateFrame);
    this.lastUpdateFrame = this.frameCount;

    // Update state machine
    this.stateMachine.update(actualDeltaTime, this.skeleton);

    // Extract and apply root motion if character provided
    if (character) {
      const motion = this.rootMotionExtractor.extractDelta(
        this.stateMachine.getCurrentClip(),
        this.stateMachine.getPreviousTime(),
        this.stateMachine.getCurrentTime()
      );
      this.rootMotionExtractor.applyRootMotion(
        character,
        motion,
        actualDeltaTime
      );
      this.rootMotionExtractor.removeRootMotion(this.skeleton);
    }

    // Update skeleton hierarchy
    this.skeleton.updateWorldMatrices();

    // Update events
    this.eventSystem.update(
      this.stateMachine.getCurrentStateName(),
      this.stateMachine.getPreviousTime(),
      this.stateMachine.getCurrentTime()
    );
  }

  getBoneMatrices(): Float32Array {
    return this.skeleton.getBoneMatrices();
  }

  // Parameter setters for state machine control
  setFloat(name: string, value: number): void {
    this.stateMachine.setParameter(name, value);
    this.blendTreeEvaluator.setParameter(name, value);
  }

  setBool(name: string, value: boolean): void {
    this.stateMachine.setParameter(name, value);
  }

  setTrigger(name: string): void {
    this.stateMachine.setParameter(name, true);
    // Auto-reset trigger next frame
    setTimeout(() => this.stateMachine.setParameter(name, false), 0);
  }

  // Event handling
  onAnimationEvent(
    eventName: string,
    callback: (event: AnimationEvent) => void
  ): void {
    this.eventSystem.addEventListener(eventName, callback);
  }
}

// Usage example
async function createAnimatedCharacter(): Promise<SkeletalAnimationSystem> {
  // Load skeleton and mesh data
  const { skeleton, mesh } = await loadCharacterModel('character.glb');

  // Create animation system
  const animSystem = new SkeletalAnimationSystem(skeleton, mesh);

  // Load animations
  const idleClip = await loadAnimation('idle.glb');
  const walkClip = await loadAnimation('walk.glb');
  const runClip = await loadAnimation('run.glb');
  const jumpClip = await loadAnimation('jump.glb');

  animSystem.loadAnimation('idle', idleClip);
  animSystem.loadAnimation('walk', walkClip);
  animSystem.loadAnimation('run', runClip);
  animSystem.loadAnimation('jump', jumpClip);

  // Setup state machine
  animSystem.setupStateMachine(
    [
      { name: 'idle', clip: idleClip, loop: true, speed: 1 },
      { name: 'walk', clip: walkClip, loop: true, speed: 1 },
      { name: 'run', clip: runClip, loop: true, speed: 1 },
      { name: 'jump', clip: jumpClip, loop: false, speed: 1 }
    ],
    [
      {
        from: 'idle', to: 'walk', duration: 0.2,
        condition: () => animSystem.getFloat('speed') > 0.1
      },
      {
        from: 'walk', to: 'idle', duration: 0.2,
        condition: () => animSystem.getFloat('speed') < 0.1
      },
      {
        from: 'walk', to: 'run', duration: 0.2,
        condition: () => animSystem.getFloat('speed') > 0.6
      },
      {
        from: 'run', to: 'walk', duration: 0.2,
        condition: () => animSystem.getFloat('speed') < 0.6
      },
      {
        from: 'idle', to: 'jump', duration: 0.1,
        condition: () => animSystem.getBool('jump')
      },
      {
        from: 'walk', to: 'jump', duration: 0.1,
        condition: () => animSystem.getBool('jump')
      },
      {
        from: 'jump', to: 'idle', duration: 0.2,
        exitTime: 0.9
      }
    ]
  );

  // Setup animation events
  animSystem.eventSystem.registerEvents('walk', [
    { time: 0.0, name: 'footstep', stringParameter: 'left' },
    { time: 0.5, name: 'footstep', stringParameter: 'right' }
  ]);

  animSystem.onAnimationEvent('footstep', (event) => {
    playSound('footstep');
    spawnDustParticle(event.stringParameter);
  });

  return animSystem;
}

// Game loop integration
function gameLoop(deltaTime: number): void {
  // Get player input
  const moveSpeed = getInputSpeed();
  const jumpPressed = isJumpPressed();

  // Update animation parameters
  animSystem.setFloat('speed', moveSpeed);
  if (jumpPressed) animSystem.setTrigger('jump');

  // Update animation system
  const cameraDistance = getCameraDistanceToCharacter();
  animSystem.update(deltaTime, cameraDistance, characterController);

  // Get bone matrices for rendering
  const boneMatrices = animSystem.getBoneMatrices();
  shader.setUniform('u_boneMatrices', boneMatrices);

  // Render character
  renderer.draw(characterMesh);
}
```

---

## Interview Key Points

### Core Concepts

**Q1: What is the difference between skeletal animation and vertex animation?**

```
Skeletal Animation:
- Uses bone hierarchy to deform mesh
- Small file size (stores bone transforms)
- Supports runtime blending
- Enables procedural animation (IK, ragdoll)
- Requires skinning computation

Vertex Animation:
- Stores all vertex positions per frame
- Large file size
- Difficult to blend
- Pre-baked, not procedural
- Direct vertex lookup (fast)
```

**Q2: Explain the skinning equation.**

```
The skinned vertex position is:
v' = sum(w_i * M_i * B_i^-1 * v)

Where:
- v' = final skinned position
- w_i = weight of bone i (sum of all weights = 1)
- M_i = current world matrix of bone i
- B_i^-1 = inverse bind pose matrix of bone i
- v = original vertex position

The (M_i * B_i^-1) transforms the vertex from bind pose
space to current pose space.
```

**Q3: What is the candy wrapper effect and how to fix it?**

```
Problem: Linear blend skinning (LBS) causes volume loss
at joints when rotating >90 degrees, making the mesh
collapse like a twisted candy wrapper.

Solutions:
1. Dual Quaternion Skinning - preserves volume better
2. Add corrective blend shapes at extreme angles
3. Use helper bones (twist bones) in the skeleton
4. Limit joint rotation angles in the rig
```

### Performance Questions

**Q4: How do you optimize skeletal animation for many characters?**

```
1. GPU Skinning - compute on vertex shader
2. Animation LOD - reduce update rate/bone count for distant characters
3. Animation Instancing - batch similar animated characters
4. Animation Compression - reduce memory footprint
5. Keyframe reduction - remove redundant keyframes
6. Bone texture - store matrices in texture for more bones
7. Web Workers - parallelize animation computation
```

**Q5: What's the typical bone limit per vertex and why?**

```
Typically 4 bones per vertex maximum.

Reasons:
- Shader attribute limits (vec4 for indices + vec4 for weights)
- Performance: each additional bone = more matrix operations
- Quality diminishing returns: 4 influences sufficient for most cases
- Memory efficiency: 4 fits nicely in GPU data structures

Some engines support 8 bones but default to 4 for performance.
```

### Implementation Questions

**Q6: How do animation state machines handle transitions?**

```
1. Detect transition condition (parameter check)
2. Check exit time constraint (can we leave current animation?)
3. Begin crossfade:
   - Sample both animations at their respective times
   - Blend poses based on transition progress (0 to 1)
4. Update transition progress based on duration
5. When progress >= 1:
   - Set target as current state
   - Reset transition state
```

**Q7: What is root motion and when would you use it?**

```
Root motion extracts movement data from animation to drive
character locomotion instead of using procedural movement.

Use cases:
- Precise foot placement (no sliding)
- Complex movements (combat rolls, climbing)
- Motion capture data with realistic movement
- When animation-driven movement looks better than code-driven

Implementation:
- Extract delta position/rotation from root bone per frame
- Apply to character transform
- Zero out root bone in animation (plays in-place)
```

---

## Summary

Skeletal animation is a fundamental technology for bringing characters to life in games and interactive applications. The key components include:

1. **Bone Hierarchy**: Tree structure of interconnected bones
2. **Skinning**: Vertex weighting to bind mesh to skeleton
3. **Keyframe Animation**: Time-sampled bone transforms
4. **Interpolation**: Smooth transitions between keyframes
5. **State Machines**: Managing animation states and transitions
6. **Animation Events**: Triggering gameplay events from animations
7. **Root Motion**: Animation-driven character movement
8. **Retargeting**: Sharing animations between different characters

Mastering these concepts enables you to create fluid, responsive character animation systems that are both visually appealing and performant. Whether building a simple mobile game or a complex AAA title, understanding skeletal animation fundamentals is essential for any game developer.
