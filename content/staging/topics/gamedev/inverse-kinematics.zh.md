---
title: 反向运动学 (IK) 系统
description: 掌握反向运动学技术，实现逼真的角色动画、程序化肢体放置和游戏开发中的动态运动
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - 反向运动学
  - IK
  - 动画
  - 骨骼动画
  - 程序化动画
  - FABRIK
  - CCD
status: imported
origin: old/src/content/docs/gamedev/inverse-kinematics.zh.md
divergence: 0.21
issues:
  - h1-in-body
legacy:
  category: GameDev
  subcategory: 3D Games
  order: 53
  lastUpdated: 2026-01-22
---

反向运动学 (Inverse Kinematics, IK) 是一种计算关节旋转以将末端执行器（如手或脚）放置到目标位置的技术。与正向运动学（指定关节角度来确定末端位置）不同，IK 从期望位置反向计算所需的关节配置。

## 理解运动学

### 正向运动学 vs 反向运动学

```typescript
// 正向运动学：给定关节角度，求末端位置
interface Joint {
  localPosition: Vector3;
  localRotation: Quaternion;
  length: number;
  parent: Joint | null;
  children: Joint[];
}

class ForwardKinematics {
  // 使用 FK 计算关节的世界位置
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

  // 通过遍历运动链获取末端执行器位置
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

// 反向运动学：给定目标位置，求关节角度
interface IKSolver {
  solve(chain: Joint[], target: Vector3, iterations?: number): boolean;
}
```

### 运动链结构

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

  // 检查目标是否可达
  isReachable(target: Vector3): boolean {
    const rootPos = ForwardKinematics.getWorldPosition(this.root);
    const distance = target.subtract(rootPos).length();
    return distance <= this.getTotalLength();
  }

  // 获取所有关节的世界位置
  getJointPositions(): Vector3[] {
    return this.joints.map(joint =>
      ForwardKinematics.getWorldPosition(joint)
    );
  }
}
```

## FABRIK 算法

FABRIK（前向和后向可达反向运动学）是一种高效的迭代求解器，通过交替进行前向和后向传递来工作。

### 基础 FABRIK 实现

```typescript
class FABRIKSolver implements IKSolver {
  tolerance: number = 0.001;
  maxIterations: number = 10;

  solve(chain: Joint[], target: Vector3, iterations?: number): boolean {
    const maxIter = iterations ?? this.maxIterations;

    // 获取初始位置
    const positions = this.getPositions(chain);
    const lengths = this.getLengths(chain);
    const rootPosition = positions[0].clone();

    // 检查可达性
    const totalLength = lengths.reduce((a, b) => a + b, 0);
    const distanceToTarget = target.subtract(rootPosition).length();

    if (distanceToTarget > totalLength) {
      // 目标不可达 - 向目标方向伸展
      this.stretchTowardsTarget(positions, lengths, target);
      this.applyPositions(chain, positions);
      return false;
    }

    // 迭代求解
    for (let i = 0; i < maxIter; i++) {
      const endEffector = positions[positions.length - 1];
      const error = target.subtract(endEffector).length();

      if (error < this.tolerance) {
        this.applyPositions(chain, positions);
        return true;
      }

      // 后向传递：从末端执行器到根节点
      this.backwardPass(positions, lengths, target);

      // 前向传递：从根节点到末端执行器
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
    // 将末端执行器设置到目标位置
    positions[positions.length - 1] = target.clone();

    // 从后向前遍历链
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
    // 将根节点设置到原始位置
    positions[0] = rootPosition.clone();

    // 从前向后遍历链
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

      // 计算指向下一个关节的旋转
      chain[i].localRotation = Quaternion.lookRotation(
        direction,
        Vector3.up()
      );
    }
  }
}
```

### 带约束的 FABRIK

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

    // 获取相对于父节点前向方向的角度
    const normalizedDir = direction.normalize();
    const parentForward = joint.parent
      ? joint.parent.localRotation.rotate(Vector3.forward())
      : Vector3.forward();

    const angle = Math.acos(
      Math.max(-1, Math.min(1, normalizedDir.dot(parentForward)))
    );

    // 限制角度
    const clampedAngle = Math.max(
      this.minAngle,
      Math.min(this.maxAngle, angle)
    );

    if (Math.abs(angle - clampedAngle) < 0.0001) {
      return position;
    }

    // 将方向旋转到限制角度
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

    // 将方向投影到垂直于铰链轴的平面上
    const projected = direction.subtract(
      this.axis.scale(direction.dot(this.axis))
    );

    if (projected.length() < 0.0001) {
      return position;
    }

    // 计算铰链平面内的角度
    const normalizedProjected = projected.normalize();
    const reference = this.getHingeReference(joint);

    let angle = Math.atan2(
      normalizedProjected.cross(reference).dot(this.axis),
      normalizedProjected.dot(reference)
    );

    // 限制角度
    angle = Math.max(this.minAngle, Math.min(this.maxAngle, angle));

    // 重建位置
    const rotation = Quaternion.fromAxisAngle(this.axis, angle);
    const constrainedDir = rotation.rotate(reference).scale(projected.length());
    const axialComponent = this.axis.scale(direction.dot(this.axis));

    return parentPosition.add(constrainedDir.add(axialComponent).normalize().scale(length));
  }

  private getHingeReference(joint: Joint): Vector3 {
    // 获取角度测量的参考方向
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

      // 应用约束
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

      // 应用约束
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

## CCD（循环坐标下降）

CCD 是另一种流行的 IK 求解器，通过迭代调整每个关节来最小化到目标的距离。

### 基础 CCD 实现

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

      // 从末端到根节点遍历关节
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

    // 从关节到末端执行器和目标的向量
    const toEnd = endPos.subtract(jointPos);
    const toTarget = target.subtract(jointPos);

    if (toEnd.length() < 0.0001 || toTarget.length() < 0.0001) {
      return;
    }

    // 计算将末端执行器对齐到目标的旋转
    const toEndNorm = toEnd.normalize();
    const toTargetNorm = toTarget.normalize();

    const dot = toEndNorm.dot(toTargetNorm);
    if (dot > 0.9999) {
      return; // 已经对齐
    }

    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    const axis = toEndNorm.cross(toTargetNorm).normalize();

    // 应用阻尼
    const dampedAngle = angle * this.dampingFactor;

    // 创建旋转四元数
    const rotation = Quaternion.fromAxisAngle(axis, dampedAngle);

    // 在局部空间应用旋转
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

### 带关节限制的 CCD

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

    // 存储原始旋转
    const originalRotation = joint.localRotation.clone();

    // 应用基础 CCD 调整
    super.adjustJoint(chain, jointIndex, target);

    // 应用关节限制
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
    // 转换为欧拉角
    const euler = rotation.toEulerAngles();

    // 限制每个轴
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

## 双骨骼 IK

双骨骼 IK 是一种专门的解析解，常用于手臂和腿部。

```typescript
class TwoBoneIKSolver {
  /**
   * 求解双骨骼链的 IK（例如：上臂+前臂，大腿+小腿）
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
    // 从根节点到目标的向量
    const rootToTarget = targetPos.subtract(rootPos);
    const targetDistance = rootToTarget.length();

    // 将目标距离限制在可达范围内
    const totalLength = upperLength + lowerLength;
    const minLength = Math.abs(upperLength - lowerLength);

    const clampedDistance = Math.max(
      minLength + 0.001,
      Math.min(totalLength - 0.001, targetDistance)
    );

    // 使用余弦定理计算中间关节角度
    // c^2 = a^2 + b^2 - 2ab*cos(C)
    const cosAngle = (
      upperLength * upperLength +
      lowerLength * lowerLength -
      clampedDistance * clampedDistance
    ) / (2 * upperLength * lowerLength);

    const midAngle = Math.acos(
      Math.max(-1, Math.min(1, cosAngle))
    );

    // 计算上骨骼旋转
    // 首先，找到根节点处的角度
    const cosUpperAngle = (
      clampedDistance * clampedDistance +
      upperLength * upperLength -
      lowerLength * lowerLength
    ) / (2 * clampedDistance * upperLength);

    const upperAngle = Math.acos(
      Math.max(-1, Math.min(1, cosUpperAngle))
    );

    // 指向目标的方向
    const targetDir = rootToTarget.normalize();

    // 计算极点平面法线
    const rootToMid = midPos.subtract(rootPos).normalize();
    const rootToPole = poleTarget.subtract(rootPos).normalize();

    // 创建旋转基准
    const forward = targetDir;
    const right = forward.cross(rootToPole).normalize();
    const up = right.cross(forward).normalize();

    // 计算新的中间位置
    const midOffset = forward
      .scale(Math.cos(upperAngle))
      .add(up.scale(Math.sin(upperAngle)))
      .scale(upperLength);

    const newMidPos = rootPos.add(midOffset);

    // 计算末端位置
    const midToTarget = targetPos.subtract(newMidPos).normalize();
    const newEndPos = newMidPos.add(midToTarget.scale(lowerLength));

    // 计算旋转
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

// 角色肢体的实际用法
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

    // 应用旋转
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

## 脚部放置 IK

最常见的 IK 应用之一是让角色的脚适应地形。

```typescript
class FootPlacementIK {
  private legIK: LimbIK;
  private raycastSystem: RaycastSystem;

  footOffset: number = 0.1; // 脚部在地面上方的高度
  maxStepHeight: number = 0.5;
  smoothSpeed: number = 10;

  private currentFootHeight: number = 0;
  private targetFootHeight: number = 0;

  constructor(legIK: LimbIK, raycastSystem: RaycastSystem) {
    this.legIK = legIK;
    this.raycastSystem = raycastSystem;
  }

  update(deltaTime: number, hipPosition: Vector3, defaultFootPos: Vector3): void {
    // 从默认脚部位置上方投射射线
    const rayStart = new Vector3(
      defaultFootPos.x,
      hipPosition.y,
      defaultFootPos.z
    );

    const rayDirection = Vector3.down();
    const maxDistance = hipPosition.y - defaultFootPos.y + this.maxStepHeight;

    const hit = this.raycastSystem.cast(rayStart, rayDirection, maxDistance);

    if (hit) {
      // 计算目标脚部位置
      this.targetFootHeight = hit.point.y + this.footOffset;
    } else {
      this.targetFootHeight = defaultFootPos.y;
    }

    // 平滑插值
    this.currentFootHeight = MathUtils.lerp(
      this.currentFootHeight,
      this.targetFootHeight,
      deltaTime * this.smoothSpeed
    );

    // 计算 IK 目标
    const ikTarget = new Vector3(
      defaultFootPos.x,
      this.currentFootHeight,
      defaultFootPos.z
    );

    // 计算极点目标（膝盖方向）
    const kneeDirection = this.calculateKneeDirection(hipPosition, ikTarget);
    const poleTarget = hipPosition.add(kneeDirection.scale(1));

    // 求解 IK
    this.legIK.solve(ikTarget, poleTarget);

    // 如果可用，将脚部对齐到地面法线
    if (hit) {
      this.alignFootToGround(hit.normal);
    }
  }

  private calculateKneeDirection(hip: Vector3, foot: Vector3): Vector3 {
    // 默认膝盖方向朝前
    const legDirection = foot.subtract(hip).normalize();
    const forward = new Vector3(legDirection.x, 0, legDirection.z).normalize();

    return forward;
  }

  private alignFootToGround(normal: Vector3): void {
    // 旋转脚部以对齐地面法线
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

## 注视 IK

注视 IK 使骨骼（通常是头部）朝向目标。

```typescript
class LookAtIK {
  headBone: Joint;
  neckBone: Joint | null;
  spineBones: Joint[];

  headWeight: number = 1.0;
  neckWeight: number = 0.5;
  spineWeight: number = 0.2;

  maxAngle: number = Math.PI * 0.5; // 90 度
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

    // 平滑注视方向
    this.currentLookDirection = Vector3.slerp(
      this.currentLookDirection,
      targetDirection,
      deltaTime * this.smoothSpeed
    ).normalize();

    // 在脊柱链上分配旋转
    this.applyLookRotation(this.currentLookDirection);
  }

  private applyLookRotation(direction: Vector3): void {
    const forward = Vector3.forward();

    // 计算所需的总旋转
    let angle = Math.acos(
      Math.max(-1, Math.min(1, forward.dot(direction)))
    );

    // 限制到最大角度
    angle = Math.min(this.maxAngle, angle);

    if (angle < 0.001) return;

    const axis = forward.cross(direction).normalize();

    // 计算归一化的权重总和
    let totalWeight = this.headWeight;
    if (this.neckBone) totalWeight += this.neckWeight;
    totalWeight += this.spineBones.length * this.spineWeight;

    // 应用到头部
    const headAngle = (angle * this.headWeight) / totalWeight;
    this.applyRotationToBone(this.headBone, axis, headAngle);

    // 应用到颈部
    if (this.neckBone) {
      const neckAngle = (angle * this.neckWeight) / totalWeight;
      this.applyRotationToBone(this.neckBone, axis, neckAngle);
    }

    // 应用到脊柱（分布）
    if (this.spineBones.length > 0) {
      const spineAngleTotal = (angle * this.spineWeight * this.spineBones.length) / totalWeight;
      const spineAnglePerBone = spineAngleTotal / this.spineBones.length;

      for (const bone of this.spineBones) {
        this.applyRotationToBone(bone, axis, spineAnglePerBone);
      }
    }
  }

  private applyRotationToBone(bone: Joint, axis: Vector3, angle: number): void {
    // 将轴转换到局部空间
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

## 全身 IK 系统

一个完整的 IK 系统，管理人形角色的多个 IK 链。

```typescript
class FullBodyIK {
  private skeleton: Skeleton;

  // 不同部位的 IK 求解器
  private leftArmIK: LimbIK;
  private rightArmIK: LimbIK;
  private leftLegIK: LimbIK;
  private rightLegIK: LimbIK;
  private spineIK: FABRIKSolver;
  private lookAtIK: LookAtIK;

  // IK 目标
  leftHandTarget: IKTarget | null = null;
  rightHandTarget: IKTarget | null = null;
  leftFootTarget: IKTarget | null = null;
  rightFootTarget: IKTarget | null = null;
  lookAtTarget: Vector3 | null = null;

  // 混合权重
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
    // 初始化肢体 IK 求解器
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

    // 初始化注视 IK
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
    // 存储原始姿势用于混合
    const originalPose = this.skeleton.capturePose();

    // 求解每个 IK 链
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

    // 将 IK 结果与原始动画混合
    this.blendPoses(originalPose);
  }

  private blendPoses(originalPose: SkeletonPose): void {
    // 混合手臂 IK
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

    // 混合腿部 IK
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

    // 混合注视 IK
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

## 使用 IK 的程序化动画

使用 IK 实现程序化行走和其他动画。

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
      // 站立静止 - 固定脚部
      this.updateStanding(deltaTime);
      return;
    }

    // 更新行走周期
    this.walkCycle += deltaTime * this.walkSpeed * speed;
    if (this.walkCycle > Math.PI * 2) {
      this.walkCycle -= Math.PI * 2;
    }

    // 计算脚部位置
    const moveDirection = velocity.normalize();

    // 左脚（偏移半个周期）
    const leftPhase = this.walkCycle;
    const leftFootPos = this.calculateFootPosition(
      this.leftFootDefault,
      moveDirection,
      leftPhase,
      speed
    );

    // 右脚
    const rightPhase = this.walkCycle + Math.PI;
    const rightFootPos = this.calculateFootPosition(
      this.rightFootDefault,
      moveDirection,
      rightPhase,
      speed
    );

    // 更新臀部摇摆
    this.updateHipSway(leftPhase);

    // 获取臀部位置用于 IK
    const hipPos = ForwardKinematics.getWorldPosition(this.hipBone);

    // 更新腿部 IK
    this.leftLegIK.update(deltaTime, hipPos, leftFootPos);
    this.rightLegIK.update(deltaTime, hipPos, rightFootPos);
  }

  private calculateFootPosition(
    defaultPos: Vector3,
    direction: Vector3,
    phase: number,
    speed: number
  ): Vector3 {
    // 前后运动
    const forwardOffset = Math.sin(phase) * this.stepLength * speed;

    // 垂直运动（仅当脚向前移动时）
    const liftPhase = Math.max(0, Math.sin(phase));
    const verticalOffset = liftPhase * this.stepHeight;

    return new Vector3(
      defaultPos.x + direction.x * forwardOffset,
      defaultPos.y + verticalOffset,
      defaultPos.z + direction.z * forwardOffset
    );
  }

  private updateHipSway(phase: number): void {
    // 左右摇摆臀部
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

## IK 调试和可视化

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

    // 绘制骨骼
    for (let i = 0; i < positions.length - 1; i++) {
      this.renderer.drawLine(
        positions[i],
        positions[i + 1],
        color
      );
    }

    // 绘制关节
    for (const pos of positions) {
      this.renderer.drawSphere(pos, 0.02, color);
    }
  }

  drawTarget(target: Vector3, color: Color = Color.green): void {
    this.renderer.drawSphere(target, 0.05, color);

    // 绘制十字准星
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

    // 绘制表示约束角度的圆锥
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
    // 创建垂直向量
    const perp = axis.cross(
      Math.abs(axis.y) < 0.9 ? Vector3.up() : Vector3.right()
    ).normalize();

    // 绕轴旋转
    const rotation = Quaternion.fromAxisAngle(axis, rotationAngle);
    const rotatedPerp = rotation.rotate(perp);

    // 计算圆锥上的点
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

## 最佳实践

### 1. 性能优化

```typescript
class OptimizedIKSystem {
  // 缓存频繁计算的值
  private positionCache: Map<Joint, Vector3> = new Map();
  private cacheValid: boolean = false;

  // 远距离角色的 LOD
  private lodDistances: number[] = [10, 25, 50];
  private lodIterations: number[] = [10, 5, 2];

  update(deltaTime: number, cameraPosition: Vector3): void {
    // 在帧开始时使缓存失效
    this.cacheValid = false;

    for (const character of this.characters) {
      const distance = character.position
        .subtract(cameraPosition)
        .length();

      // 确定 LOD 级别
      const lod = this.getLODLevel(distance);

      // 对非常远的角色完全跳过 IK
      if (lod >= this.lodDistances.length) {
        continue;
      }

      // 对远距离角色使用减少的迭代次数求解
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

### 2. 动画混合

```typescript
class IKAnimationBlender {
  // 启用/禁用时平滑过渡 IK 权重
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

  // 在多个 IK 目标之间混合
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

### 3. 稳定性和错误处理

```typescript
class StableIKSolver {
  private previousSolution: Map<Joint, Quaternion> = new Map();

  solve(chain: Joint[], target: Vector3): boolean {
    // 存储当前状态用于回滚
    const backup = this.backupState(chain);

    try {
      const success = this.performSolve(chain, target);

      if (!success) {
        // 部分解决方案 - 与之前混合
        this.blendWithPrevious(chain, 0.5);
      }

      // 检查无效旋转（NaN 等）
      if (!this.validateSolution(chain)) {
        this.restoreState(chain, backup);
        return false;
      }

      // 存储成功的解决方案
      this.storeSolution(chain);
      return success;

    } catch (error) {
      console.error('IK 求解失败:', error);
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

      // 检查四元数是否已归一化
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

## 总结

反向运动学对于创建可信的角色动画和程序化运动至关重要：

- **FABRIK** 为一般 IK 问题提供快速、直观的解决方案
- **CCD** 为迭代求解提供精确控制和自然外观的结果
- **双骨骼 IK** 为手臂和腿部提供完美的解析解
- **脚部放置** 自动使角色脚部适应地形
- **注视 IK** 创建自然的头部和脊柱跟踪
- **全身 IK** 协调多个链以实现完整的角色控制
- **约束** 确保解剖学上合理的姿势
- **程序化动画** 将 IK 与运动合成相结合以实现动态运动

为每个用例选择正确的求解器，并始终实现平滑混合以实现无缝动画过渡。

## 延伸阅读

- 《Game Programming Gems 3》 - 游戏中的 IK 技术
- 《Real-Time Rendering》 - 骨骼动画系统
- 《The Art of Game Design》 - 动画和玩家反馈
- Unity/Unreal IK 文档 - 引擎特定实现
- FABRIK 和 CCD 算法研究论文
