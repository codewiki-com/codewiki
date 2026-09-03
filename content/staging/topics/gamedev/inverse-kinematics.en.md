---
title: Inverse Kinematics (IK) Systems
description: Master inverse kinematics for realistic character animation, procedural limb placement, and dynamic motion in game development
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - inverse kinematics
  - IK
  - animation
  - skeletal animation
  - procedural animation
  - FABRIK
  - CCD
status: imported
origin: old/src/content/docs/gamedev/inverse-kinematics.en.md
divergence: 0.21
issues:
  - h1-in-body
legacy:
  category: GameDev
  subcategory: 3D Games
  order: 53
  lastUpdated: 2026-01-22
---

Inverse Kinematics (IK) is a technique for calculating joint rotations needed to place an end effector (like a hand or foot) at a target position. Unlike forward kinematics where you specify joint angles to determine end positions, IK works backwards from a desired position to find the required joint configurations.

## Understanding Kinematics

### Forward Kinematics vs Inverse Kinematics

```typescript
// Forward Kinematics: Given joint angles, find end position
interface Joint {
  localPosition: Vector3;
  localRotation: Quaternion;
  length: number;
  parent: Joint | null;
  children: Joint[];
}

class ForwardKinematics {
  // Calculate world position of a joint using FK
  static getWorldPosition(joint: Joint): Vector3 {
    if (!joint.parent) {
      return joint.localPosition;
    }

    const parentWorld = this.getWorldTransform(joint.parent);
    return parentWorld.transformPoint(joint.localPosition);
  }

  static getWorldTransform(joint: Joint): Matrix4 {
    if (!joint.parent) {
      return Matrix4.compose(
        joint.localPosition,
        joint.localRotation,
        Vector3.one()
      );
    }

    const parentTransform = this.getWorldTransform(joint.parent);
    const localTransform = Matrix4.compose(
      joint.localPosition,
      joint.localRotation,
      Vector3.one()
    );

    return parentTransform.multiply(localTransform);
  }

  // Get end effector position by traversing the kinematic chain
  static getEndEffectorPosition(chain: Joint[]): Vector3 {
    let position = Vector3.zero();
    let rotation = Quaternion.identity();

    for (const joint of chain) {
      position = position.add(rotation.rotate(joint.localPosition));
      rotation = rotation.multiply(joint.localRotation);
    }

    return position;
  }
}

// Inverse Kinematics: Given target position, find joint angles
interface IKSolver {
  solve(chain: Joint[], target: Vector3, iterations?: number): boolean;
}
```

### Kinematic Chain Structure

```typescript
class KinematicChain {
  joints: Joint[] = [];
  root: Joint;
  endEffector: Joint;

  constructor() {
    this.root = this.createJoint(null);
    this.endEffector = this.root;
  }

  private createJoint(parent: Joint | null): Joint {
    const joint: Joint = {
      localPosition: Vector3.zero(),
      localRotation: Quaternion.identity(),
      length: 0,
      parent,
      children: []
    };

    if (parent) {
      parent.children.push(joint);
    }

    this.joints.push(joint);
    return joint;
  }

  addJoint(length: number): Joint {
    const joint = this.createJoint(this.endEffector);
    joint.length = length;
    joint.localPosition = new Vector3(length, 0, 0);
    this.endEffector = joint;
    return joint;
  }

  getTotalLength(): number {
    return this.joints.reduce((sum, joint) => sum + joint.length, 0);
  }

  // Check if target is reachable
  isReachable(target: Vector3): boolean {
    const rootPos = ForwardKinematics.getWorldPosition(this.root);
    const distance = target.subtract(rootPos).length();
    return distance <= this.getTotalLength();
  }

  // Get all joint world positions
  getJointPositions(): Vector3[] {
    return this.joints.map(joint =>
      ForwardKinematics.getWorldPosition(joint)
    );
  }
}
```

## FABRIK Algorithm

FABRIK (Forward And Backward Reaching Inverse Kinematics) is an efficient iterative solver that works by alternating between forward and backward passes.

### Basic FABRIK Implementation

```typescript
class FABRIKSolver implements IKSolver {
  tolerance: number = 0.001;
  maxIterations: number = 10;

  solve(chain: Joint[], target: Vector3, iterations?: number): boolean {
    const maxIter = iterations ?? this.maxIterations;

    // Get initial positions
    const positions = this.getPositions(chain);
    const lengths = this.getLengths(chain);
    const rootPosition = positions[0].clone();

    // Check reachability
    const totalLength = lengths.reduce((a, b) => a + b, 0);
    const distanceToTarget = target.subtract(rootPosition).length();

    if (distanceToTarget > totalLength) {
      // Target unreachable - stretch towards it
      this.stretchTowardsTarget(positions, lengths, target);
      this.applyPositions(chain, positions);
      return false;
    }

    // Iterative solving
    for (let i = 0; i < maxIter; i++) {
      const endEffector = positions[positions.length - 1];
      const error = target.subtract(endEffector).length();

      if (error < this.tolerance) {
        this.applyPositions(chain, positions);
        return true;
      }

      // Backward pass: from end effector to root
      this.backwardPass(positions, lengths, target);

      // Forward pass: from root to end effector
      this.forwardPass(positions, lengths, rootPosition);
    }

    this.applyPositions(chain, positions);
    return false;
  }

  private backwardPass(
    positions: Vector3[],
    lengths: number[],
    target: Vector3
  ): void {
    // Set end effector to target
    positions[positions.length - 1] = target.clone();

    // Work backwards through chain
    for (let i = positions.length - 2; i >= 0; i--) {
      const direction = positions[i]
        .subtract(positions[i + 1])
        .normalize();

      positions[i] = positions[i + 1].add(
        direction.scale(lengths[i])
      );
    }
  }

  private forwardPass(
    positions: Vector3[],
    lengths: number[],
    rootPosition: Vector3
  ): void {
    // Set root to original position
    positions[0] = rootPosition.clone();

    // Work forwards through chain
    for (let i = 0; i < positions.length - 1; i++) {
      const direction = positions[i + 1]
        .subtract(positions[i])
        .normalize();

      positions[i + 1] = positions[i].add(
        direction.scale(lengths[i])
      );
    }
  }

  private stretchTowardsTarget(
    positions: Vector3[],
    lengths: number[],
    target: Vector3
  ): void {
    const direction = target.subtract(positions[0]).normalize();

    for (let i = 0; i < positions.length - 1; i++) {
      positions[i + 1] = positions[i].add(
        direction.scale(lengths[i])
      );
    }
  }

  private getPositions(chain: Joint[]): Vector3[] {
    return chain.map(joint =>
      ForwardKinematics.getWorldPosition(joint)
    );
  }

  private getLengths(chain: Joint[]): number[] {
    return chain.slice(0, -1).map(joint => joint.length);
  }

  private applyPositions(chain: Joint[], positions: Vector3[]): void {
    for (let i = 0; i < chain.length - 1; i++) {
      const current = positions[i];
      const next = positions[i + 1];
      const direction = next.subtract(current).normalize();

      // Calculate rotation to point towards next joint
      chain[i].localRotation = Quaternion.lookRotation(
        direction,
        Vector3.up()
      );
    }
  }
}
```

### FABRIK with Constraints

```typescript
interface JointConstraint {
  apply(joint: Joint, position: Vector3, parentPosition: Vector3): Vector3;
}

class AngleConstraint implements JointConstraint {
  minAngle: number;
  maxAngle: number;
  axis: Vector3;

  constructor(minAngle: number, maxAngle: number, axis: Vector3 = Vector3.up()) {
    this.minAngle = minAngle;
    this.maxAngle = maxAngle;
    this.axis = axis;
  }

  apply(joint: Joint, position: Vector3, parentPosition: Vector3): Vector3 {
    const direction = position.subtract(parentPosition);
    const length = direction.length();

    if (length < 0.0001) return position;

    // Get angle relative to parent's forward direction
    const normalizedDir = direction.normalize();
    const parentForward = joint.parent
      ? joint.parent.localRotation.rotate(Vector3.forward())
      : Vector3.forward();

    const angle = Math.acos(
      Math.max(-1, Math.min(1, normalizedDir.dot(parentForward)))
    );

    // Clamp angle
    const clampedAngle = Math.max(
      this.minAngle,
      Math.min(this.maxAngle, angle)
    );

    if (Math.abs(angle - clampedAngle) < 0.0001) {
      return position;
    }

    // Rotate direction to clamped angle
    const rotationAxis = parentForward.cross(normalizedDir).normalize();
    const rotation = Quaternion.fromAxisAngle(rotationAxis, clampedAngle);
    const constrainedDir = rotation.rotate(parentForward);

    return parentPosition.add(constrainedDir.scale(length));
  }
}

class HingeConstraint implements JointConstraint {
  axis: Vector3;
  minAngle: number;
  maxAngle: number;

  constructor(axis: Vector3, minAngle: number, maxAngle: number) {
    this.axis = axis.normalize();
    this.minAngle = minAngle;
    this.maxAngle = maxAngle;
  }

  apply(joint: Joint, position: Vector3, parentPosition: Vector3): Vector3 {
    const direction = position.subtract(parentPosition);
    const length = direction.length();

    if (length < 0.0001) return position;

    // Project direction onto plane perpendicular to hinge axis
    const projected = direction.subtract(
      this.axis.scale(direction.dot(this.axis))
    );

    if (projected.length() < 0.0001) {
      return position;
    }

    // Calculate angle in hinge plane
    const normalizedProjected = projected.normalize();
    const reference = this.getHingeReference(joint);

    let angle = Math.atan2(
      normalizedProjected.cross(reference).dot(this.axis),
      normalizedProjected.dot(reference)
    );

    // Clamp angle
    angle = Math.max(this.minAngle, Math.min(this.maxAngle, angle));

    // Reconstruct position
    const rotation = Quaternion.fromAxisAngle(this.axis, angle);
    const constrainedDir = rotation.rotate(reference).scale(projected.length());
    const axialComponent = this.axis.scale(direction.dot(this.axis));

    return parentPosition.add(constrainedDir.add(axialComponent).normalize().scale(length));
  }

  private getHingeReference(joint: Joint): Vector3 {
    // Get reference direction for angle measurement
    if (joint.parent) {
      return joint.parent.localRotation.rotate(Vector3.forward());
    }
    return Vector3.forward();
  }
}

class ConstrainedFABRIKSolver extends FABRIKSolver {
  constraints: Map<Joint, JointConstraint[]> = new Map();

  addConstraint(joint: Joint, constraint: JointConstraint): void {
    if (!this.constraints.has(joint)) {
      this.constraints.set(joint, []);
    }
    this.constraints.get(joint)!.push(constraint);
  }

  protected backwardPass(
    positions: Vector3[],
    lengths: number[],
    target: Vector3,
    chain: Joint[]
  ): void {
    positions[positions.length - 1] = target.clone();

    for (let i = positions.length - 2; i >= 0; i--) {
      let direction = positions[i]
        .subtract(positions[i + 1])
        .normalize();

      positions[i] = positions[i + 1].add(
        direction.scale(lengths[i])
      );

      // Apply constraints
      const constraints = this.constraints.get(chain[i]);
      if (constraints) {
        for (const constraint of constraints) {
          positions[i] = constraint.apply(
            chain[i],
            positions[i],
            positions[i + 1]
          );
        }
      }
    }
  }

  protected forwardPass(
    positions: Vector3[],
    lengths: number[],
    rootPosition: Vector3,
    chain: Joint[]
  ): void {
    positions[0] = rootPosition.clone();

    for (let i = 0; i < positions.length - 1; i++) {
      let direction = positions[i + 1]
        .subtract(positions[i])
        .normalize();

      positions[i + 1] = positions[i].add(
        direction.scale(lengths[i])
      );

      // Apply constraints
      const constraints = this.constraints.get(chain[i + 1]);
      if (constraints) {
        for (const constraint of constraints) {
          positions[i + 1] = constraint.apply(
            chain[i + 1],
            positions[i + 1],
            positions[i]
          );
        }
      }
    }
  }
}
```

## CCD (Cyclic Coordinate Descent)

CCD is another popular IK solver that iteratively adjusts each joint to minimize the distance to the target.

### Basic CCD Implementation

```typescript
class CCDSolver implements IKSolver {
  tolerance: number = 0.001;
  maxIterations: number = 10;
  dampingFactor: number = 1.0;

  solve(chain: Joint[], target: Vector3, iterations?: number): boolean {
    const maxIter = iterations ?? this.maxIterations;

    for (let iteration = 0; iteration < maxIter; iteration++) {
      const endEffector = ForwardKinematics.getWorldPosition(
        chain[chain.length - 1]
      );

      const error = target.subtract(endEffector).length();
      if (error < this.tolerance) {
        return true;
      }

      // Iterate through joints from end to root
      for (let i = chain.length - 2; i >= 0; i--) {
        this.adjustJoint(chain, i, target);
      }
    }

    return false;
  }

  private adjustJoint(chain: Joint[], jointIndex: number, target: Vector3): void {
    const joint = chain[jointIndex];
    const endEffector = chain[chain.length - 1];

    const jointPos = ForwardKinematics.getWorldPosition(joint);
    const endPos = ForwardKinematics.getWorldPosition(endEffector);

    // Vectors from joint to end effector and target
    const toEnd = endPos.subtract(jointPos);
    const toTarget = target.subtract(jointPos);

    if (toEnd.length() < 0.0001 || toTarget.length() < 0.0001) {
      return;
    }

    // Calculate rotation to align end effector with target
    const toEndNorm = toEnd.normalize();
    const toTargetNorm = toTarget.normalize();

    const dot = toEndNorm.dot(toTargetNorm);
    if (dot > 0.9999) {
      return; // Already aligned
    }

    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    const axis = toEndNorm.cross(toTargetNorm).normalize();

    // Apply damping
    const dampedAngle = angle * this.dampingFactor;

    // Create rotation quaternion
    const rotation = Quaternion.fromAxisAngle(axis, dampedAngle);

    // Apply rotation to joint (in local space)
    const worldToLocal = this.getWorldToLocalRotation(joint);
    const localRotation = worldToLocal.multiply(rotation).multiply(
      worldToLocal.inverse()
    );

    joint.localRotation = localRotation.multiply(joint.localRotation);
  }

  private getWorldToLocalRotation(joint: Joint): Quaternion {
    if (!joint.parent) {
      return Quaternion.identity();
    }

    return ForwardKinematics.getWorldTransform(joint.parent)
      .getRotation()
      .inverse();
  }
}
```

### CCD with Joint Limits

```typescript
class ConstrainedCCDSolver extends CCDSolver {
  jointLimits: Map<Joint, JointLimits> = new Map();

  setJointLimits(joint: Joint, limits: JointLimits): void {
    this.jointLimits.set(joint, limits);
  }

  protected adjustJoint(
    chain: Joint[],
    jointIndex: number,
    target: Vector3
  ): void {
    const joint = chain[jointIndex];
    const limits = this.jointLimits.get(joint);

    // Store original rotation
    const originalRotation = joint.localRotation.clone();

    // Apply base CCD adjustment
    super.adjustJoint(chain, jointIndex, target);

    // Apply joint limits
    if (limits) {
      joint.localRotation = this.applyLimits(
        joint.localRotation,
        limits
      );
    }
  }

  private applyLimits(
    rotation: Quaternion,
    limits: JointLimits
  ): Quaternion {
    // Convert to euler angles
    const euler = rotation.toEulerAngles();

    // Clamp each axis
    euler.x = Math.max(
      limits.minX,
      Math.min(limits.maxX, euler.x)
    );
    euler.y = Math.max(
      limits.minY,
      Math.min(limits.maxY, euler.y)
    );
    euler.z = Math.max(
      limits.minZ,
      Math.min(limits.maxZ, euler.z)
    );

    return Quaternion.fromEulerAngles(euler);
  }
}

interface JointLimits {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}
```

## Two-Bone IK

Two-bone IK is a specialized analytical solution commonly used for arms and legs.

```typescript
class TwoBoneIKSolver {
  /**
   * Solves IK for a two-bone chain (e.g., upper arm + forearm, thigh + shin)
   */
  solve(
    rootPos: Vector3,
    midPos: Vector3,
    endPos: Vector3,
    targetPos: Vector3,
    poleTarget: Vector3,
    upperLength: number,
    lowerLength: number
  ): { midPosition: Vector3; endPosition: Vector3; upperRotation: Quaternion; lowerRotation: Quaternion } {
    // Vector from root to target
    const rootToTarget = targetPos.subtract(rootPos);
    const targetDistance = rootToTarget.length();

    // Clamp target distance to reachable range
    const totalLength = upperLength + lowerLength;
    const minLength = Math.abs(upperLength - lowerLength);

    const clampedDistance = Math.max(
      minLength + 0.001,
      Math.min(totalLength - 0.001, targetDistance)
    );

    // Calculate mid joint angle using law of cosines
    // c^2 = a^2 + b^2 - 2ab*cos(C)
    const cosAngle = (
      upperLength * upperLength +
      lowerLength * lowerLength -
      clampedDistance * clampedDistance
    ) / (2 * upperLength * lowerLength);

    const midAngle = Math.acos(
      Math.max(-1, Math.min(1, cosAngle))
    );

    // Calculate upper bone rotation
    // First, find the angle at the root
    const cosUpperAngle = (
      clampedDistance * clampedDistance +
      upperLength * upperLength -
      lowerLength * lowerLength
    ) / (2 * clampedDistance * upperLength);

    const upperAngle = Math.acos(
      Math.max(-1, Math.min(1, cosUpperAngle))
    );

    // Direction to target
    const targetDir = rootToTarget.normalize();

    // Calculate pole plane normal
    const rootToMid = midPos.subtract(rootPos).normalize();
    const rootToPole = poleTarget.subtract(rootPos).normalize();

    // Create rotation basis
    const forward = targetDir;
    const right = forward.cross(rootToPole).normalize();
    const up = right.cross(forward).normalize();

    // Calculate new mid position
    const midOffset = forward
      .scale(Math.cos(upperAngle))
      .add(up.scale(Math.sin(upperAngle)))
      .scale(upperLength);

    const newMidPos = rootPos.add(midOffset);

    // Calculate end position
    const midToTarget = targetPos.subtract(newMidPos).normalize();
    const newEndPos = newMidPos.add(midToTarget.scale(lowerLength));

    // Calculate rotations
    const upperRotation = Quaternion.lookRotation(
      newMidPos.subtract(rootPos).normalize(),
      up
    );

    const lowerRotation = Quaternion.lookRotation(
      newEndPos.subtract(newMidPos).normalize(),
      up
    );

    return {
      midPosition: newMidPos,
      endPosition: newEndPos,
      upperRotation,
      lowerRotation
    };
  }
}

// Practical usage for character limbs
class LimbIK {
  private solver: TwoBoneIKSolver;

  upperBone: Joint;
  lowerBone: Joint;
  endEffector: Joint;

  upperLength: number;
  lowerLength: number;

  constructor(upper: Joint, lower: Joint, end: Joint) {
    this.solver = new TwoBoneIKSolver();
    this.upperBone = upper;
    this.lowerBone = lower;
    this.endEffector = end;

    this.upperLength = lower.localPosition.length();
    this.lowerLength = end.localPosition.length();
  }

  solve(target: Vector3, poleTarget: Vector3): void {
    const rootPos = ForwardKinematics.getWorldPosition(this.upperBone);
    const midPos = ForwardKinematics.getWorldPosition(this.lowerBone);
    const endPos = ForwardKinematics.getWorldPosition(this.endEffector);

    const result = this.solver.solve(
      rootPos,
      midPos,
      endPos,
      target,
      poleTarget,
      this.upperLength,
      this.lowerLength
    );

    // Apply rotations
    this.upperBone.localRotation = this.worldToLocalRotation(
      this.upperBone,
      result.upperRotation
    );

    this.lowerBone.localRotation = this.worldToLocalRotation(
      this.lowerBone,
      result.lowerRotation
    );
  }

  private worldToLocalRotation(joint: Joint, worldRot: Quaternion): Quaternion {
    if (!joint.parent) {
      return worldRot;
    }

    const parentWorldRot = ForwardKinematics.getWorldTransform(joint.parent)
      .getRotation();

    return parentWorldRot.inverse().multiply(worldRot);
  }
}
```

## Foot Placement IK

One of the most common IK applications is making characters' feet adapt to terrain.

```typescript
class FootPlacementIK {
  private legIK: LimbIK;
  private raycastSystem: RaycastSystem;

  footOffset: number = 0.1; // Height of foot above ground
  maxStepHeight: number = 0.5;
  smoothSpeed: number = 10;

  private currentFootHeight: number = 0;
  private targetFootHeight: number = 0;

  constructor(legIK: LimbIK, raycastSystem: RaycastSystem) {
    this.legIK = legIK;
    this.raycastSystem = raycastSystem;
  }

  update(deltaTime: number, hipPosition: Vector3, defaultFootPos: Vector3): void {
    // Cast ray from above default foot position
    const rayStart = new Vector3(
      defaultFootPos.x,
      hipPosition.y,
      defaultFootPos.z
    );

    const rayDirection = Vector3.down();
    const maxDistance = hipPosition.y - defaultFootPos.y + this.maxStepHeight;

    const hit = this.raycastSystem.cast(rayStart, rayDirection, maxDistance);

    if (hit) {
      // Calculate target foot position
      this.targetFootHeight = hit.point.y + this.footOffset;
    } else {
      this.targetFootHeight = defaultFootPos.y;
    }

    // Smooth interpolation
    this.currentFootHeight = MathUtils.lerp(
      this.currentFootHeight,
      this.targetFootHeight,
      deltaTime * this.smoothSpeed
    );

    // Calculate IK target
    const ikTarget = new Vector3(
      defaultFootPos.x,
      this.currentFootHeight,
      defaultFootPos.z
    );

    // Calculate pole target (knee direction)
    const kneeDirection = this.calculateKneeDirection(hipPosition, ikTarget);
    const poleTarget = hipPosition.add(kneeDirection.scale(1));

    // Solve IK
    this.legIK.solve(ikTarget, poleTarget);

    // Align foot to ground normal if available
    if (hit) {
      this.alignFootToGround(hit.normal);
    }
  }

  private calculateKneeDirection(hip: Vector3, foot: Vector3): Vector3 {
    // Default knee direction is forward
    const legDirection = foot.subtract(hip).normalize();
    const forward = new Vector3(legDirection.x, 0, legDirection.z).normalize();

    return forward;
  }

  private alignFootToGround(normal: Vector3): void {
    // Rotate foot to align with ground normal
    const footBone = this.legIK.endEffector;

    const currentUp = Vector3.up();
    const targetUp = normal;

    const rotation = Quaternion.fromToRotation(currentUp, targetUp);
    footBone.localRotation = rotation.multiply(footBone.localRotation);
  }
}

interface RaycastHit {
  point: Vector3;
  normal: Vector3;
  distance: number;
}

interface RaycastSystem {
  cast(origin: Vector3, direction: Vector3, maxDistance: number): RaycastHit | null;
}
```

## Look-At IK

Look-at IK orients a bone (typically the head) to face a target.

```typescript
class LookAtIK {
  headBone: Joint;
  neckBone: Joint | null;
  spineBones: Joint[];

  headWeight: number = 1.0;
  neckWeight: number = 0.5;
  spineWeight: number = 0.2;

  maxAngle: number = Math.PI * 0.5; // 90 degrees
  smoothSpeed: number = 5;

  private currentLookDirection: Vector3 = Vector3.forward();

  constructor(
    head: Joint,
    neck: Joint | null = null,
    spine: Joint[] = []
  ) {
    this.headBone = head;
    this.neckBone = neck;
    this.spineBones = spine;
  }

  update(deltaTime: number, target: Vector3): void {
    const headPos = ForwardKinematics.getWorldPosition(this.headBone);
    const targetDirection = target.subtract(headPos).normalize();

    // Smooth look direction
    this.currentLookDirection = Vector3.slerp(
      this.currentLookDirection,
      targetDirection,
      deltaTime * this.smoothSpeed
    ).normalize();

    // Distribute rotation across spine chain
    this.applyLookRotation(this.currentLookDirection);
  }

  private applyLookRotation(direction: Vector3): void {
    const forward = Vector3.forward();

    // Calculate total rotation needed
    let angle = Math.acos(
      Math.max(-1, Math.min(1, forward.dot(direction)))
    );

    // Clamp to max angle
    angle = Math.min(this.maxAngle, angle);

    if (angle < 0.001) return;

    const axis = forward.cross(direction).normalize();

    // Calculate weight sum for normalization
    let totalWeight = this.headWeight;
    if (this.neckBone) totalWeight += this.neckWeight;
    totalWeight += this.spineBones.length * this.spineWeight;

    // Apply to head
    const headAngle = (angle * this.headWeight) / totalWeight;
    this.applyRotationToBone(this.headBone, axis, headAngle);

    // Apply to neck
    if (this.neckBone) {
      const neckAngle = (angle * this.neckWeight) / totalWeight;
      this.applyRotationToBone(this.neckBone, axis, neckAngle);
    }

    // Apply to spine (distributed)
    if (this.spineBones.length > 0) {
      const spineAngleTotal = (angle * this.spineWeight * this.spineBones.length) / totalWeight;
      const spineAnglePerBone = spineAngleTotal / this.spineBones.length;

      for (const bone of this.spineBones) {
        this.applyRotationToBone(bone, axis, spineAnglePerBone);
      }
    }
  }

  private applyRotationToBone(bone: Joint, axis: Vector3, angle: number): void {
    // Convert axis to local space
    const worldToLocal = this.getWorldToLocalRotation(bone);
    const localAxis = worldToLocal.rotate(axis);

    const rotation = Quaternion.fromAxisAngle(localAxis, angle);
    bone.localRotation = rotation.multiply(bone.localRotation);
  }

  private getWorldToLocalRotation(bone: Joint): Quaternion {
    if (!bone.parent) {
      return Quaternion.identity();
    }

    return ForwardKinematics.getWorldTransform(bone.parent)
      .getRotation()
      .inverse();
  }
}
```

## Full Body IK System

A complete IK system that manages multiple IK chains for a humanoid character.

```typescript
class FullBodyIK {
  private skeleton: Skeleton;

  // IK solvers for different parts
  private leftArmIK: LimbIK;
  private rightArmIK: LimbIK;
  private leftLegIK: LimbIK;
  private rightLegIK: LimbIK;
  private spineIK: FABRIKSolver;
  private lookAtIK: LookAtIK;

  // IK targets
  leftHandTarget: IKTarget | null = null;
  rightHandTarget: IKTarget | null = null;
  leftFootTarget: IKTarget | null = null;
  rightFootTarget: IKTarget | null = null;
  lookAtTarget: Vector3 | null = null;

  // Blend weights
  leftHandWeight: number = 0;
  rightHandWeight: number = 0;
  leftFootWeight: number = 0;
  rightFootWeight: number = 0;
  lookAtWeight: number = 0;

  constructor(skeleton: Skeleton) {
    this.skeleton = skeleton;
    this.initializeSolvers();
  }

  private initializeSolvers(): void {
    // Initialize limb IK solvers
    this.leftArmIK = new LimbIK(
      this.skeleton.getBone('LeftUpperArm'),
      this.skeleton.getBone('LeftLowerArm'),
      this.skeleton.getBone('LeftHand')
    );

    this.rightArmIK = new LimbIK(
      this.skeleton.getBone('RightUpperArm'),
      this.skeleton.getBone('RightLowerArm'),
      this.skeleton.getBone('RightHand')
    );

    this.leftLegIK = new LimbIK(
      this.skeleton.getBone('LeftUpperLeg'),
      this.skeleton.getBone('LeftLowerLeg'),
      this.skeleton.getBone('LeftFoot')
    );

    this.rightLegIK = new LimbIK(
      this.skeleton.getBone('RightUpperLeg'),
      this.skeleton.getBone('RightLowerLeg'),
      this.skeleton.getBone('RightFoot')
    );

    // Initialize look-at IK
    this.lookAtIK = new LookAtIK(
      this.skeleton.getBone('Head'),
      this.skeleton.getBone('Neck'),
      [
        this.skeleton.getBone('UpperSpine'),
        this.skeleton.getBone('Spine')
      ]
    );
  }

  update(deltaTime: number): void {
    // Store original pose for blending
    const originalPose = this.skeleton.capturePose();

    // Solve each IK chain
    if (this.leftHandTarget && this.leftHandWeight > 0) {
      this.leftArmIK.solve(
        this.leftHandTarget.position,
        this.leftHandTarget.poleTarget
      );
    }

    if (this.rightHandTarget && this.rightHandWeight > 0) {
      this.rightArmIK.solve(
        this.rightHandTarget.position,
        this.rightHandTarget.poleTarget
      );
    }

    if (this.leftFootTarget && this.leftFootWeight > 0) {
      this.leftLegIK.solve(
        this.leftFootTarget.position,
        this.leftFootTarget.poleTarget
      );
    }

    if (this.rightFootTarget && this.rightFootWeight > 0) {
      this.rightLegIK.solve(
        this.rightFootTarget.position,
        this.rightFootTarget.poleTarget
      );
    }

    if (this.lookAtTarget && this.lookAtWeight > 0) {
      this.lookAtIK.update(deltaTime, this.lookAtTarget);
    }

    // Blend IK results with original animation
    this.blendPoses(originalPose);
  }

  private blendPoses(originalPose: SkeletonPose): void {
    // Blend arm IK
    this.blendBoneChain(
      ['LeftUpperArm', 'LeftLowerArm', 'LeftHand'],
      originalPose,
      this.leftHandWeight
    );

    this.blendBoneChain(
      ['RightUpperArm', 'RightLowerArm', 'RightHand'],
      originalPose,
      this.rightHandWeight
    );

    // Blend leg IK
    this.blendBoneChain(
      ['LeftUpperLeg', 'LeftLowerLeg', 'LeftFoot'],
      originalPose,
      this.leftFootWeight
    );

    this.blendBoneChain(
      ['RightUpperLeg', 'RightLowerLeg', 'RightFoot'],
      originalPose,
      this.rightFootWeight
    );

    // Blend look-at IK
    this.blendBoneChain(
      ['Spine', 'UpperSpine', 'Neck', 'Head'],
      originalPose,
      this.lookAtWeight
    );
  }

  private blendBoneChain(
    boneNames: string[],
    originalPose: SkeletonPose,
    weight: number
  ): void {
    for (const name of boneNames) {
      const bone = this.skeleton.getBone(name);
      const originalRotation = originalPose.getRotation(name);

      bone.localRotation = Quaternion.slerp(
        originalRotation,
        bone.localRotation,
        weight
      );
    }
  }
}

interface IKTarget {
  position: Vector3;
  poleTarget: Vector3;
  rotation?: Quaternion;
}

interface Skeleton {
  getBone(name: string): Joint;
  capturePose(): SkeletonPose;
}

interface SkeletonPose {
  getRotation(boneName: string): Quaternion;
}
```

## Procedural Animation with IK

Using IK for procedural walking and other animations.

```typescript
class ProceduralWalker {
  private leftLegIK: FootPlacementIK;
  private rightLegIK: FootPlacementIK;

  private hipBone: Joint;
  private leftFootDefault: Vector3;
  private rightFootDefault: Vector3;

  private walkCycle: number = 0;
  walkSpeed: number = 1;
  stepLength: number = 0.5;
  stepHeight: number = 0.15;
  hipSwayAmount: number = 0.05;

  constructor(
    hipBone: Joint,
    leftLegIK: FootPlacementIK,
    rightLegIK: FootPlacementIK,
    leftFootDefault: Vector3,
    rightFootDefault: Vector3
  ) {
    this.hipBone = hipBone;
    this.leftLegIK = leftLegIK;
    this.rightLegIK = rightLegIK;
    this.leftFootDefault = leftFootDefault;
    this.rightFootDefault = rightFootDefault;
  }

  update(deltaTime: number, velocity: Vector3): void {
    const speed = velocity.length();

    if (speed < 0.01) {
      // Standing still - plant feet
      this.updateStanding(deltaTime);
      return;
    }

    // Update walk cycle
    this.walkCycle += deltaTime * this.walkSpeed * speed;
    if (this.walkCycle > Math.PI * 2) {
      this.walkCycle -= Math.PI * 2;
    }

    // Calculate foot positions
    const moveDirection = velocity.normalize();

    // Left foot (offset by half cycle)
    const leftPhase = this.walkCycle;
    const leftFootPos = this.calculateFootPosition(
      this.leftFootDefault,
      moveDirection,
      leftPhase,
      speed
    );

    // Right foot
    const rightPhase = this.walkCycle + Math.PI;
    const rightFootPos = this.calculateFootPosition(
      this.rightFootDefault,
      moveDirection,
      rightPhase,
      speed
    );

    // Update hip sway
    this.updateHipSway(leftPhase);

    // Get hip position for IK
    const hipPos = ForwardKinematics.getWorldPosition(this.hipBone);

    // Update leg IK
    this.leftLegIK.update(deltaTime, hipPos, leftFootPos);
    this.rightLegIK.update(deltaTime, hipPos, rightFootPos);
  }

  private calculateFootPosition(
    defaultPos: Vector3,
    direction: Vector3,
    phase: number,
    speed: number
  ): Vector3 {
    // Forward/backward motion
    const forwardOffset = Math.sin(phase) * this.stepLength * speed;

    // Vertical motion (only when foot is moving forward)
    const liftPhase = Math.max(0, Math.sin(phase));
    const verticalOffset = liftPhase * this.stepHeight;

    return new Vector3(
      defaultPos.x + direction.x * forwardOffset,
      defaultPos.y + verticalOffset,
      defaultPos.z + direction.z * forwardOffset
    );
  }

  private updateHipSway(phase: number): void {
    // Sway hips side to side
    const sway = Math.sin(phase) * this.hipSwayAmount;

    this.hipBone.localPosition = new Vector3(
      sway,
      this.hipBone.localPosition.y,
      this.hipBone.localPosition.z
    );
  }

  private updateStanding(deltaTime: number): void {
    const hipPos = ForwardKinematics.getWorldPosition(this.hipBone);

    this.leftLegIK.update(deltaTime, hipPos, this.leftFootDefault);
    this.rightLegIK.update(deltaTime, hipPos, this.rightFootDefault);
  }
}
```

## IK Debugging and Visualization

```typescript
class IKDebugger {
  private renderer: DebugRenderer;

  constructor(renderer: DebugRenderer) {
    this.renderer = renderer;
  }

  drawChain(chain: Joint[], color: Color = Color.white): void {
    const positions = chain.map(j =>
      ForwardKinematics.getWorldPosition(j)
    );

    // Draw bones
    for (let i = 0; i < positions.length - 1; i++) {
      this.renderer.drawLine(
        positions[i],
        positions[i + 1],
        color
      );
    }

    // Draw joints
    for (const pos of positions) {
      this.renderer.drawSphere(pos, 0.02, color);
    }
  }

  drawTarget(target: Vector3, color: Color = Color.green): void {
    this.renderer.drawSphere(target, 0.05, color);

    // Draw crosshair
    const size = 0.1;
    this.renderer.drawLine(
      target.add(new Vector3(-size, 0, 0)),
      target.add(new Vector3(size, 0, 0)),
      color
    );
    this.renderer.drawLine(
      target.add(new Vector3(0, -size, 0)),
      target.add(new Vector3(0, size, 0)),
      color
    );
    this.renderer.drawLine(
      target.add(new Vector3(0, 0, -size)),
      target.add(new Vector3(0, 0, size)),
      color
    );
  }

  drawPoleTarget(
    poleTarget: Vector3,
    jointPos: Vector3,
    color: Color = Color.yellow
  ): void {
    this.renderer.drawSphere(poleTarget, 0.03, color);
    this.renderer.drawLine(jointPos, poleTarget, color);
  }

  drawConstraint(
    joint: Joint,
    constraint: AngleConstraint,
    color: Color = Color.blue
  ): void {
    const pos = ForwardKinematics.getWorldPosition(joint);
    const parentPos = joint.parent
      ? ForwardKinematics.getWorldPosition(joint.parent)
      : pos.subtract(Vector3.up());

    const direction = pos.subtract(parentPos).normalize();

    // Draw cone representing constraint angle
    const segments = 16;
    const radius = 0.2;

    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      const p1 = this.getPointOnCone(
        pos, direction, constraint.maxAngle, angle1, radius
      );
      const p2 = this.getPointOnCone(
        pos, direction, constraint.maxAngle, angle2, radius
      );

      this.renderer.drawLine(pos, p1, color);
      this.renderer.drawLine(p1, p2, color);
    }
  }

  private getPointOnCone(
    apex: Vector3,
    axis: Vector3,
    coneAngle: number,
    rotationAngle: number,
    distance: number
  ): Vector3 {
    // Create perpendicular vector
    const perp = axis.cross(
      Math.abs(axis.y) < 0.9 ? Vector3.up() : Vector3.right()
    ).normalize();

    // Rotate around axis
    const rotation = Quaternion.fromAxisAngle(axis, rotationAngle);
    const rotatedPerp = rotation.rotate(perp);

    // Calculate point on cone
    const coneRadius = Math.tan(coneAngle) * distance;
    return apex
      .add(axis.scale(distance))
      .add(rotatedPerp.scale(coneRadius));
  }
}

interface DebugRenderer {
  drawLine(start: Vector3, end: Vector3, color: Color): void;
  drawSphere(center: Vector3, radius: number, color: Color): void;
}

class Color {
  static white = new Color(1, 1, 1, 1);
  static green = new Color(0, 1, 0, 1);
  static yellow = new Color(1, 1, 0, 1);
  static blue = new Color(0, 0, 1, 1);

  constructor(
    public r: number,
    public g: number,
    public b: number,
    public a: number
  ) {}
}
```

## Best Practices

### 1. Performance Optimization

```typescript
class OptimizedIKSystem {
  // Cache frequently calculated values
  private positionCache: Map<Joint, Vector3> = new Map();
  private cacheValid: boolean = false;

  // LOD for distant characters
  private lodDistances: number[] = [10, 25, 50];
  private lodIterations: number[] = [10, 5, 2];

  update(deltaTime: number, cameraPosition: Vector3): void {
    // Invalidate cache at start of frame
    this.cacheValid = false;

    for (const character of this.characters) {
      const distance = character.position
        .subtract(cameraPosition)
        .length();

      // Determine LOD level
      const lod = this.getLODLevel(distance);

      // Skip IK entirely for very distant characters
      if (lod >= this.lodDistances.length) {
        continue;
      }

      // Solve with reduced iterations for distant characters
      const iterations = this.lodIterations[lod];
      character.solveIK(iterations);
    }
  }

  private getLODLevel(distance: number): number {
    for (let i = 0; i < this.lodDistances.length; i++) {
      if (distance < this.lodDistances[i]) {
        return i;
      }
    }
    return this.lodDistances.length;
  }
}
```

### 2. Animation Blending

```typescript
class IKAnimationBlender {
  // Smoothly transition IK weight when enabling/disabling
  blendToTarget(
    currentWeight: number,
    targetWeight: number,
    speed: number,
    deltaTime: number
  ): number {
    if (Math.abs(currentWeight - targetWeight) < 0.001) {
      return targetWeight;
    }

    return MathUtils.lerp(
      currentWeight,
      targetWeight,
      deltaTime * speed
    );
  }

  // Blend between multiple IK targets
  blendTargets(
    targets: IKTarget[],
    weights: number[]
  ): IKTarget {
    let totalWeight = 0;
    let blendedPosition = Vector3.zero();
    let blendedPole = Vector3.zero();

    for (let i = 0; i < targets.length; i++) {
      const weight = weights[i];
      totalWeight += weight;

      blendedPosition = blendedPosition.add(
        targets[i].position.scale(weight)
      );
      blendedPole = blendedPole.add(
        targets[i].poleTarget.scale(weight)
      );
    }

    if (totalWeight > 0) {
      blendedPosition = blendedPosition.scale(1 / totalWeight);
      blendedPole = blendedPole.scale(1 / totalWeight);
    }

    return {
      position: blendedPosition,
      poleTarget: blendedPole
    };
  }
}
```

### 3. Stability and Error Handling

```typescript
class StableIKSolver {
  private previousSolution: Map<Joint, Quaternion> = new Map();

  solve(chain: Joint[], target: Vector3): boolean {
    // Store current state for rollback
    const backup = this.backupState(chain);

    try {
      const success = this.performSolve(chain, target);

      if (!success) {
        // Partial solution - blend with previous
        this.blendWithPrevious(chain, 0.5);
      }

      // Check for invalid rotations (NaN, etc)
      if (!this.validateSolution(chain)) {
        this.restoreState(chain, backup);
        return false;
      }

      // Store successful solution
      this.storeSolution(chain);
      return success;

    } catch (error) {
      console.error('IK solve failed:', error);
      this.restoreState(chain, backup);
      return false;
    }
  }

  private validateSolution(chain: Joint[]): boolean {
    for (const joint of chain) {
      const q = joint.localRotation;
      if (isNaN(q.x) || isNaN(q.y) || isNaN(q.z) || isNaN(q.w)) {
        return false;
      }

      // Check quaternion is normalized
      const length = Math.sqrt(q.x*q.x + q.y*q.y + q.z*q.z + q.w*q.w);
      if (Math.abs(length - 1) > 0.01) {
        return false;
      }
    }
    return true;
  }

  private backupState(chain: Joint[]): Map<Joint, Quaternion> {
    const backup = new Map();
    for (const joint of chain) {
      backup.set(joint, joint.localRotation.clone());
    }
    return backup;
  }

  private restoreState(chain: Joint[], backup: Map<Joint, Quaternion>): void {
    for (const joint of chain) {
      const rotation = backup.get(joint);
      if (rotation) {
        joint.localRotation = rotation;
      }
    }
  }

  private storeSolution(chain: Joint[]): void {
    for (const joint of chain) {
      this.previousSolution.set(joint, joint.localRotation.clone());
    }
  }

  private blendWithPrevious(chain: Joint[], blend: number): void {
    for (const joint of chain) {
      const previous = this.previousSolution.get(joint);
      if (previous) {
        joint.localRotation = Quaternion.slerp(
          previous,
          joint.localRotation,
          blend
        );
      }
    }
  }
}
```

## Summary

Inverse Kinematics is essential for creating believable character animation and procedural motion:

- **FABRIK** provides fast, intuitive solutions for general IK problems
- **CCD** offers precise control with natural-looking results for iterative solving
- **Two-Bone IK** gives analytical solutions perfect for arms and legs
- **Foot Placement** adapts character feet to terrain automatically
- **Look-At IK** creates natural head and spine tracking
- **Full Body IK** coordinates multiple chains for complete character control
- **Constraints** ensure anatomically plausible poses
- **Procedural Animation** combines IK with motion synthesis for dynamic movement

Choose the right solver for each use case and always implement smooth blending for seamless animation transitions.

## Further Reading

- "Game Programming Gems 3" - IK techniques for games
- "Real-Time Rendering" - Skeletal animation systems
- "The Art of Game Design" - Animation and player feedback
- Unity/Unreal IK documentation for engine-specific implementations
- Research papers on FABRIK and CCD algorithms
