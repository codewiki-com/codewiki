---
title: 物理约束求解与关节系统
description: 掌握物理约束求解：距离关节、旋转关节、滑动关节以及游戏物理引擎中的迭代求解器
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - 物理引擎
  - 约束
  - 关节
  - 刚体
  - 模拟
status: imported
origin: old/src/content/docs/gamedev/physics-constraints.zh.md
divergence: 0.214
issues: []
legacy:
  category: GameDev
  subcategory: Physics
  order: 51
  lastUpdated: 2026-01-22
---

## 物理约束简介

物理约束是游戏中实现真实物理模拟的基础。它们允许对象以有意义的方式连接、限制和交互——从简单的钟摆到复杂的布娃娃角色和车辆悬挂系统。本文提供理解和实现物理约束与关节系统的全面指南。

### 什么是约束？

约束是限制一个或多个刚体自由度的数学限制。在物理模拟中：

```
无约束：物体在所有方向上自由移动
有约束：物体被限制在特定运动范围内

示例：
- 距离约束：两个物体保持固定距离
- 点约束：物体 A 上的一点与物体 B 上的一点匹配
- 角度约束：物体保持特定的相对角度
```

### 约束分类

```
┌─────────────────────────────────────────────────────────┐
│                      物理约束                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  等式约束                    不等式约束                   │
│  ├─ 距离关节                ├─ 接触（无穿透）             │
│  ├─ 旋转关节                ├─ 关节限制                  │
│  ├─ 滑动关节                └─ 摩擦锥                    │
│  ├─ 固定关节                                             │
│  └─ 焊接关节                                             │
│                                                          │
│  软约束                     硬约束                        │
│  ├─ 弹簧                    ├─ 所有等式关节               │
│  ├─ 阻尼器                  └─ 碰撞响应                  │
│  └─ 马达                                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 数学基础

### 约束函数

约束由一个约束函数 C 定义，当约束满足时该函数等于零：

```typescript
// 一般约束形式
// C(x) = 0   （等式约束 - 必须为零）
// C(x) >= 0  （不等式约束 - 必须非负）

interface Constraint {
  // 位置级约束函数
  computeC(bodies: RigidBody[]): number;

  // 速度级约束（C 的时间导数）
  computeCdot(bodies: RigidBody[]): number;

  // 雅可比矩阵（偏导数）
  computeJacobian(bodies: RigidBody[]): Jacobian;
}
```

### 雅可比矩阵

雅可比矩阵将约束速度与物体速度联系起来：

```
C_dot = J * V

其中：
- C_dot：约束速度（标量或向量）
- J：雅可比矩阵
- V：速度向量 [v1, w1, v2, w2, ...]

对于两个物体之间的 2D 约束：
J = [J_v1, J_w1, J_v2, J_w2]

其中：
- J_v1, J_v2：线性雅可比（2D 向量）
- J_w1, J_w2：角度雅可比（2D 中为标量）
```

```typescript
interface Jacobian {
  // 物体 A
  linearA: Vector2;   // 对速度 A 的偏导数
  angularA: number;   // 对角速度 A 的偏导数

  // 物体 B
  linearB: Vector2;   // 对速度 B 的偏导数
  angularB: number;   // 对角速度 B 的偏导数
}

interface RigidBody {
  position: Vector2;
  rotation: number;
  velocity: Vector2;
  angularVelocity: number;
  mass: number;
  inertia: number;
  invMass: number;
  invInertia: number;
}
```

### 约束力与冲量

约束通过施加力（或冲量）来维持约束：

```typescript
// 约束力
F_constraint = J^T * lambda

// 其中 lambda 是拉格朗日乘数（约束力大小）

// 约束方程：
// J * M^-1 * J^T * lambda = -C_dot - bias

// 有效质量
effectiveMass = J * M^-1 * J^T

// 冲量大小
lambda = -(C_dot + bias) / effectiveMass
```

---

## 顺序冲量求解器

顺序冲量方法是实时约束求解的行业标准，被 Box2D、Bullet 和 PhysX 使用。

### 基本算法

```typescript
class SequentialImpulseSolver {
  private constraints: Constraint[] = [];
  private velocityIterations: number = 8;
  private positionIterations: number = 3;

  public solve(bodies: RigidBody[], dt: number): void {
    // 阶段 1：初始化约束
    for (const constraint of this.constraints) {
      constraint.initialize(bodies, dt);
    }

    // 阶段 2：热启动（应用缓存的冲量）
    for (const constraint of this.constraints) {
      constraint.warmStart(bodies);
    }

    // 阶段 3：速度迭代
    for (let i = 0; i < this.velocityIterations; i++) {
      for (const constraint of this.constraints) {
        constraint.solveVelocity(bodies);
      }
    }

    // 阶段 4：积分位置
    for (const body of bodies) {
      body.position.x += body.velocity.x * dt;
      body.position.y += body.velocity.y * dt;
      body.rotation += body.angularVelocity * dt;
    }

    // 阶段 5：位置迭代（修复漂移）
    for (let i = 0; i < this.positionIterations; i++) {
      let maxError = 0;
      for (const constraint of this.constraints) {
        const error = constraint.solvePosition(bodies);
        maxError = Math.max(maxError, error);
      }
      if (maxError < 0.001) break; // 已收敛
    }
  }
}
```

### 约束基类

```typescript
abstract class BaseConstraint {
  protected bodyA: RigidBody;
  protected bodyB: RigidBody;

  // 求解时的缓存值
  protected jacobian: Jacobian;
  protected effectiveMass: number;
  protected bias: number;
  protected accumulatedImpulse: number = 0;

  // 调节参数
  protected frequencyHz: number = 0; // 0 = 硬约束
  protected dampingRatio: number = 0;

  constructor(bodyA: RigidBody, bodyB: RigidBody) {
    this.bodyA = bodyA;
    this.bodyB = bodyB;
  }

  public initialize(bodies: RigidBody[], dt: number): void {
    // 计算雅可比
    this.jacobian = this.computeJacobian();

    // 计算有效质量：K = J * M^-1 * J^T
    this.effectiveMass = this.computeEffectiveMass();

    // 计算 Baumgarte 稳定化的偏置
    const C = this.computeConstraint();
    const beta = this.computeBeta(dt);
    this.bias = beta * C / dt;

    // 对于软约束，修改有效质量
    if (this.frequencyHz > 0) {
      this.applySoftness(dt);
    }
  }

  protected computeEffectiveMass(): number {
    const J = this.jacobian;
    const A = this.bodyA;
    const B = this.bodyB;

    // K = J_vA * invMassA * J_vA + J_wA^2 * invInertiaA
    //   + J_vB * invMassB * J_vB + J_wB^2 * invInertiaB

    const linearA = J.linearA.x * J.linearA.x + J.linearA.y * J.linearA.y;
    const linearB = J.linearB.x * J.linearB.x + J.linearB.y * J.linearB.y;

    return A.invMass * linearA + A.invInertia * J.angularA * J.angularA +
           B.invMass * linearB + B.invInertia * J.angularB * J.angularB;
  }

  protected computeBeta(dt: number): number {
    // Baumgarte 稳定化因子
    // 典型值：0.1 到 0.3
    return 0.2;
  }

  protected applySoftness(dt: number): void {
    // 将频率和阻尼转换为刚度和阻尼
    const omega = 2 * Math.PI * this.frequencyHz;
    const d = 2 * this.effectiveMass * this.dampingRatio * omega;
    const k = this.effectiveMass * omega * omega;

    // 修改软约束的有效质量
    const gamma = 1 / (dt * (d + dt * k));
    const softBeta = dt * k * gamma;

    this.effectiveMass = 1 / (1 / this.effectiveMass + gamma);
    this.bias *= softBeta;
  }

  public warmStart(bodies: RigidBody[]): void {
    // 应用上一帧缓存的冲量
    this.applyImpulse(this.accumulatedImpulse);
  }

  public solveVelocity(bodies: RigidBody[]): void {
    // 计算约束处的相对速度
    const Cdot = this.computeVelocityConstraint();

    // 计算冲量大小
    let lambda = -(Cdot + this.bias) / this.effectiveMass;

    // 钳制冲量（用于不等式约束）
    lambda = this.clampImpulse(lambda);

    // 应用冲量
    this.applyImpulse(lambda);

    // 累积用于热启动
    this.accumulatedImpulse += lambda;
  }

  public solvePosition(bodies: RigidBody[]): number {
    // 计算位置误差
    const C = this.computeConstraint();

    if (Math.abs(C) < 0.001) {
      return 0; // 已满足
    }

    // 计算位置修正
    const correction = -C / this.effectiveMass;

    // 直接应用位置修正
    this.applyPositionCorrection(correction);

    return Math.abs(C);
  }

  protected applyImpulse(lambda: number): void {
    const J = this.jacobian;

    // 应用到物体 A
    this.bodyA.velocity.x += this.bodyA.invMass * J.linearA.x * lambda;
    this.bodyA.velocity.y += this.bodyA.invMass * J.linearA.y * lambda;
    this.bodyA.angularVelocity += this.bodyA.invInertia * J.angularA * lambda;

    // 应用到物体 B
    this.bodyB.velocity.x += this.bodyB.invMass * J.linearB.x * lambda;
    this.bodyB.velocity.y += this.bodyB.invMass * J.linearB.y * lambda;
    this.bodyB.angularVelocity += this.bodyB.invInertia * J.angularB * lambda;
  }

  protected applyPositionCorrection(correction: number): void {
    const J = this.jacobian;

    // 应用到物体 A
    this.bodyA.position.x += this.bodyA.invMass * J.linearA.x * correction;
    this.bodyA.position.y += this.bodyA.invMass * J.linearA.y * correction;
    this.bodyA.rotation += this.bodyA.invInertia * J.angularA * correction;

    // 应用到物体 B
    this.bodyB.position.x += this.bodyB.invMass * J.linearB.x * correction;
    this.bodyB.position.y += this.bodyB.invMass * J.linearB.y * correction;
    this.bodyB.rotation += this.bodyB.invInertia * J.angularB * correction;
  }

  protected clampImpulse(lambda: number): number {
    // 在子类中重写用于不等式约束
    return lambda;
  }

  protected abstract computeConstraint(): number;
  protected abstract computeVelocityConstraint(): number;
  protected abstract computeJacobian(): Jacobian;
}
```

---

## 常见关节类型

### 距离关节

保持两个锚点之间的固定距离：

```typescript
class DistanceJoint extends BaseConstraint {
  private anchorA: Vector2; // 物体 A 上的局部锚点
  private anchorB: Vector2; // 物体 B 上的局部锚点
  private targetLength: number;

  constructor(
    bodyA: RigidBody,
    bodyB: RigidBody,
    anchorA: Vector2,
    anchorB: Vector2,
    length?: number
  ) {
    super(bodyA, bodyB);
    this.anchorA = anchorA;
    this.anchorB = anchorB;

    // 如果未指定则计算初始长度
    if (length === undefined) {
      const worldA = this.getWorldAnchorA();
      const worldB = this.getWorldAnchorB();
      this.targetLength = Math.sqrt(
        (worldB.x - worldA.x) ** 2 + (worldB.y - worldA.y) ** 2
      );
    } else {
      this.targetLength = length;
    }
  }

  private getWorldAnchorA(): Vector2 {
    return this.localToWorld(this.bodyA, this.anchorA);
  }

  private getWorldAnchorB(): Vector2 {
    return this.localToWorld(this.bodyB, this.anchorB);
  }

  private localToWorld(body: RigidBody, localPoint: Vector2): Vector2 {
    const cos = Math.cos(body.rotation);
    const sin = Math.sin(body.rotation);
    return {
      x: body.position.x + localPoint.x * cos - localPoint.y * sin,
      y: body.position.y + localPoint.x * sin + localPoint.y * cos
    };
  }

  protected computeConstraint(): number {
    // C = |pB - pA| - L
    const worldA = this.getWorldAnchorA();
    const worldB = this.getWorldAnchorB();

    const dx = worldB.x - worldA.x;
    const dy = worldB.y - worldA.y;
    const currentLength = Math.sqrt(dx * dx + dy * dy);

    return currentLength - this.targetLength;
  }

  protected computeJacobian(): Jacobian {
    const worldA = this.getWorldAnchorA();
    const worldB = this.getWorldAnchorB();

    // 从 A 到 B 的方向
    const dx = worldB.x - worldA.x;
    const dy = worldB.y - worldA.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    const n = length > 0
      ? { x: dx / length, y: dy / length }
      : { x: 1, y: 0 };

    // 力臂
    const rA = { x: worldA.x - this.bodyA.position.x, y: worldA.y - this.bodyA.position.y };
    const rB = { x: worldB.x - this.bodyB.position.x, y: worldB.y - this.bodyB.position.y };

    // 叉积（2D）：r x n = rx * ny - ry * nx
    const crossA = rA.x * n.y - rA.y * n.x;
    const crossB = rB.x * n.y - rB.y * n.x;

    return {
      linearA: { x: -n.x, y: -n.y },
      angularA: -crossA,
      linearB: { x: n.x, y: n.y },
      angularB: crossB
    };
  }

  protected computeVelocityConstraint(): number {
    const J = this.jacobian;
    const A = this.bodyA;
    const B = this.bodyB;

    // C_dot = J * V
    return J.linearA.x * A.velocity.x + J.linearA.y * A.velocity.y +
           J.angularA * A.angularVelocity +
           J.linearB.x * B.velocity.x + J.linearB.y * B.velocity.y +
           J.angularB * B.angularVelocity;
  }
}
```

### 旋转关节（铰链/销关节）

约束两个物体绕一个公共点旋转：

```typescript
class RevoluteJoint extends BaseConstraint {
  private anchorA: Vector2;
  private anchorB: Vector2;

  // 马达属性
  private motorEnabled: boolean = false;
  private motorSpeed: number = 0;
  private maxMotorTorque: number = 0;
  private motorImpulse: number = 0;

  // 限制属性
  private limitEnabled: boolean = false;
  private lowerAngle: number = 0;
  private upperAngle: number = 0;
  private referenceAngle: number;
  private limitState: 'inactive' | 'atLower' | 'atUpper' | 'equal' = 'inactive';
  private limitImpulse: number = 0;

  // 位置约束（2D 点约束）
  private impulse: Vector2 = { x: 0, y: 0 };
  private mass: number[][] = [[0, 0], [0, 0]]; // 2x2 有效质量

  constructor(
    bodyA: RigidBody,
    bodyB: RigidBody,
    anchor: Vector2 // 世界空间锚点
  ) {
    super(bodyA, bodyB);

    // 将世界锚点转换为局部坐标
    this.anchorA = this.worldToLocal(bodyA, anchor);
    this.anchorB = this.worldToLocal(bodyB, anchor);

    // 存储参考角度
    this.referenceAngle = bodyB.rotation - bodyA.rotation;
  }

  private worldToLocal(body: RigidBody, worldPoint: Vector2): Vector2 {
    const cos = Math.cos(-body.rotation);
    const sin = Math.sin(-body.rotation);
    const dx = worldPoint.x - body.position.x;
    const dy = worldPoint.y - body.position.y;
    return {
      x: dx * cos - dy * sin,
      y: dx * sin + dy * cos
    };
  }

  public setMotor(speed: number, maxTorque: number): void {
    this.motorEnabled = true;
    this.motorSpeed = speed;
    this.maxMotorTorque = maxTorque;
  }

  public setLimits(lower: number, upper: number): void {
    this.limitEnabled = true;
    this.lowerAngle = lower;
    this.upperAngle = upper;
  }

  // ... 其余实现与英文版相同
}
```

### 滑动关节（滑块关节）

将运动约束到单一轴上：

```typescript
class PrismaticJoint extends BaseConstraint {
  private anchorA: Vector2;
  private anchorB: Vector2;
  private localAxisA: Vector2; // 物体 A 局部空间中的滑动轴
  private referenceAngle: number;

  // 累积冲量
  private impulse: Vector2 = { x: 0, y: 0 }; // 点约束 + 旋转约束
  private motorImpulse: number = 0;

  // 马达
  private motorEnabled: boolean = false;
  private motorSpeed: number = 0;
  private maxMotorForce: number = 0;

  // 限制
  private limitEnabled: boolean = false;
  private lowerTranslation: number = 0;
  private upperTranslation: number = 0;
  private limitImpulse: number = 0;
  private limitState: 'inactive' | 'atLower' | 'atUpper' | 'equal' = 'inactive';

  constructor(
    bodyA: RigidBody,
    bodyB: RigidBody,
    anchor: Vector2,
    axis: Vector2
  ) {
    super(bodyA, bodyB);

    this.anchorA = this.worldToLocal(bodyA, anchor);
    this.anchorB = this.worldToLocal(bodyB, anchor);

    // 归一化并存储局部空间中的轴
    const len = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
    const worldAxis = { x: axis.x / len, y: axis.y / len };

    // 转换到物体 A 的局部空间
    const cos = Math.cos(-bodyA.rotation);
    const sin = Math.sin(-bodyA.rotation);
    this.localAxisA = {
      x: worldAxis.x * cos - worldAxis.y * sin,
      y: worldAxis.x * sin + worldAxis.y * cos
    };

    this.referenceAngle = bodyB.rotation - bodyA.rotation;
  }

  public setMotor(speed: number, maxForce: number): void {
    this.motorEnabled = true;
    this.motorSpeed = speed;
    this.maxMotorForce = maxForce;
  }

  public setLimits(lower: number, upper: number): void {
    this.limitEnabled = true;
    this.lowerTranslation = lower;
    this.upperTranslation = upper;
  }

  public getJointTranslation(): number {
    const worldA = this.localToWorld(this.bodyA, this.anchorA);
    const worldB = this.localToWorld(this.bodyB, this.anchorB);

    // 获取世界轴
    const cos = Math.cos(this.bodyA.rotation);
    const sin = Math.sin(this.bodyA.rotation);
    const axis = {
      x: this.localAxisA.x * cos - this.localAxisA.y * sin,
      y: this.localAxisA.x * sin + this.localAxisA.y * cos
    };

    const d = { x: worldB.x - worldA.x, y: worldB.y - worldA.y };
    return d.x * axis.x + d.y * axis.y;
  }

  // ... 其余实现
}
```

### 焊接关节（固定关节）

刚性连接两个物体：

```typescript
class WeldJoint extends BaseConstraint {
  private anchorA: Vector2;
  private anchorB: Vector2;
  private referenceAngle: number;

  // 3 自由度约束 (x, y, 角度)
  private impulse: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  private mass: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; // 3x3 矩阵

  // 柔性焊接的软度
  private stiffness: number = 0;
  private damping: number = 0;
  private gamma: number = 0;
  private bias: number = 0;

  constructor(
    bodyA: RigidBody,
    bodyB: RigidBody,
    anchor: Vector2
  ) {
    super(bodyA, bodyB);

    this.anchorA = this.worldToLocal(bodyA, anchor);
    this.anchorB = this.worldToLocal(bodyB, anchor);
    this.referenceAngle = bodyB.rotation - bodyA.rotation;
  }

  public setStiffness(stiffness: number, damping: number): void {
    this.stiffness = stiffness;
    this.damping = damping;
  }

  // ... 其余实现
}
```

---

## 弹簧与阻尼系统

### 弹簧关节

```typescript
class SpringJoint {
  private bodyA: RigidBody;
  private bodyB: RigidBody;
  private anchorA: Vector2;
  private anchorB: Vector2;
  private restLength: number;
  private stiffness: number;  // 弹簧常数 (k)
  private damping: number;    // 阻尼系数 (c)

  constructor(
    bodyA: RigidBody,
    bodyB: RigidBody,
    anchorA: Vector2,
    anchorB: Vector2,
    stiffness: number,
    damping: number
  ) {
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.anchorA = anchorA;
    this.anchorB = anchorB;
    this.stiffness = stiffness;
    this.damping = damping;

    // 从初始位置计算静止长度
    const worldA = this.getWorldAnchorA();
    const worldB = this.getWorldAnchorB();
    const dx = worldB.x - worldA.x;
    const dy = worldB.y - worldA.y;
    this.restLength = Math.sqrt(dx * dx + dy * dy);
  }

  public applyForce(dt: number): void {
    const worldA = this.getWorldAnchorA();
    const worldB = this.getWorldAnchorB();

    // 方向和距离
    const dx = worldB.x - worldA.x;
    const dy = worldB.y - worldA.y;
    const currentLength = Math.sqrt(dx * dx + dy * dy);

    if (currentLength < 0.0001) return; // 避免除以零

    // 归一化方向
    const nx = dx / currentLength;
    const ny = dy / currentLength;

    // 弹簧力：F = -k * (length - restLength)
    const stretch = currentLength - this.restLength;
    const springForce = this.stiffness * stretch;

    // 阻尼力：F = -c * relativeVelocity
    const rA = { x: worldA.x - this.bodyA.position.x, y: worldA.y - this.bodyA.position.y };
    const rB = { x: worldB.x - this.bodyB.position.x, y: worldB.y - this.bodyB.position.y };

    // 锚点处的速度
    const vA = {
      x: this.bodyA.velocity.x - this.bodyA.angularVelocity * rA.y,
      y: this.bodyA.velocity.y + this.bodyA.angularVelocity * rA.x
    };
    const vB = {
      x: this.bodyB.velocity.x - this.bodyB.angularVelocity * rB.y,
      y: this.bodyB.velocity.y + this.bodyB.angularVelocity * rB.x
    };

    // 沿弹簧方向的相对速度
    const relVel = (vB.x - vA.x) * nx + (vB.y - vA.y) * ny;
    const dampingForce = this.damping * relVel;

    // 总力大小
    const forceMag = springForce + dampingForce;

    // 力向量
    const forceX = forceMag * nx;
    const forceY = forceMag * ny;

    // 应用力到物体 A（正方向）
    this.bodyA.velocity.x += this.bodyA.invMass * forceX * dt;
    this.bodyA.velocity.y += this.bodyA.invMass * forceY * dt;
    this.bodyA.angularVelocity += this.bodyA.invInertia *
      (rA.x * forceY - rA.y * forceX) * dt;

    // 应用力到物体 B（负方向）
    this.bodyB.velocity.x -= this.bodyB.invMass * forceX * dt;
    this.bodyB.velocity.y -= this.bodyB.invMass * forceY * dt;
    this.bodyB.angularVelocity -= this.bodyB.invInertia *
      (rB.x * forceY - rB.y * forceX) * dt;
  }
}
```

### 角度弹簧（扭转弹簧）

```typescript
class TorsionSpring {
  private bodyA: RigidBody;
  private bodyB: RigidBody;
  private restAngle: number;
  private stiffness: number;
  private damping: number;

  constructor(
    bodyA: RigidBody,
    bodyB: RigidBody,
    stiffness: number,
    damping: number
  ) {
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.stiffness = stiffness;
    this.damping = damping;

    // 存储初始角度差作为静止角度
    this.restAngle = bodyB.rotation - bodyA.rotation;
  }

  public applyTorque(dt: number): void {
    // 当前角度差
    const currentAngle = this.bodyB.rotation - this.bodyA.rotation;

    // 角度误差（带正确包装）
    let angleError = currentAngle - this.restAngle;
    while (angleError > Math.PI) angleError -= 2 * Math.PI;
    while (angleError < -Math.PI) angleError += 2 * Math.PI;

    // 弹簧扭矩
    const springTorque = -this.stiffness * angleError;

    // 阻尼扭矩
    const relAngVel = this.bodyB.angularVelocity - this.bodyA.angularVelocity;
    const dampingTorque = -this.damping * relAngVel;

    // 总扭矩
    const torque = springTorque + dampingTorque;

    // 应用扭矩
    this.bodyA.angularVelocity -= this.bodyA.invInertia * torque * dt;
    this.bodyB.angularVelocity += this.bodyB.invInertia * torque * dt;
  }
}
```

---

## 高级主题

### 接触约束

接触约束防止碰撞物体之间的穿透：

```typescript
interface ContactPoint {
  position: Vector2;
  normal: Vector2;  // 从 A 指向 B
  penetration: number;
  normalImpulse: number;
  tangentImpulse: number;
}

class ContactConstraint {
  private bodyA: RigidBody;
  private bodyB: RigidBody;
  private contacts: ContactPoint[];
  private friction: number;
  private restitution: number;

  constructor(
    bodyA: RigidBody,
    bodyB: RigidBody,
    contacts: ContactPoint[],
    friction: number,
    restitution: number
  ) {
    this.bodyA = bodyA;
    this.bodyB = bodyB;
    this.contacts = contacts;
    this.friction = friction;
    this.restitution = restitution;
  }

  public solveVelocity(): void {
    for (const contact of this.contacts) {
      const rA = {
        x: contact.position.x - this.bodyA.position.x,
        y: contact.position.y - this.bodyA.position.y
      };
      const rB = {
        x: contact.position.x - this.bodyB.position.x,
        y: contact.position.y - this.bodyB.position.y
      };

      // 接触点处的相对速度
      const vA = {
        x: this.bodyA.velocity.x - this.bodyA.angularVelocity * rA.y,
        y: this.bodyA.velocity.y + this.bodyA.angularVelocity * rA.x
      };
      const vB = {
        x: this.bodyB.velocity.x - this.bodyB.angularVelocity * rB.y,
        y: this.bodyB.velocity.y + this.bodyB.angularVelocity * rB.x
      };

      const relVel = { x: vB.x - vA.x, y: vB.y - vA.y };

      // 法向速度
      const normalVel = relVel.x * contact.normal.x + relVel.y * contact.normal.y;

      // 仅在物体接近时解析
      if (normalVel >= 0) continue;

      // 计算法向冲量
      const rACrossN = rA.x * contact.normal.y - rA.y * contact.normal.x;
      const rBCrossN = rB.x * contact.normal.y - rB.y * contact.normal.x;

      const invMassSum = this.bodyA.invMass + this.bodyB.invMass +
        rACrossN * rACrossN * this.bodyA.invInertia +
        rBCrossN * rBCrossN * this.bodyB.invInertia;

      // 恢复系数
      const restitutionVel = -this.restitution * normalVel;

      let normalImpulse = (restitutionVel - normalVel) / invMassSum;

      // 钳制为正值（只推不拉）
      const oldNormalImpulse = contact.normalImpulse;
      contact.normalImpulse = Math.max(0, contact.normalImpulse + normalImpulse);
      normalImpulse = contact.normalImpulse - oldNormalImpulse;

      // 应用法向冲量
      this.bodyA.velocity.x -= this.bodyA.invMass * normalImpulse * contact.normal.x;
      this.bodyA.velocity.y -= this.bodyA.invMass * normalImpulse * contact.normal.y;
      this.bodyA.angularVelocity -= this.bodyA.invInertia * rACrossN * normalImpulse;

      this.bodyB.velocity.x += this.bodyB.invMass * normalImpulse * contact.normal.x;
      this.bodyB.velocity.y += this.bodyB.invMass * normalImpulse * contact.normal.y;
      this.bodyB.angularVelocity += this.bodyB.invInertia * rBCrossN * normalImpulse;

      // 摩擦冲量
      this.solveFriction(contact, rA, rB);
    }
  }

  private solveFriction(contact: ContactPoint, rA: Vector2, rB: Vector2): void {
    // 切向方向
    const tangent = { x: -contact.normal.y, y: contact.normal.x };

    // 重新计算相对速度
    const vA = {
      x: this.bodyA.velocity.x - this.bodyA.angularVelocity * rA.y,
      y: this.bodyA.velocity.y + this.bodyA.angularVelocity * rA.x
    };
    const vB = {
      x: this.bodyB.velocity.x - this.bodyB.angularVelocity * rB.y,
      y: this.bodyB.velocity.y + this.bodyB.angularVelocity * rB.x
    };

    const relVel = { x: vB.x - vA.x, y: vB.y - vA.y };
    const tangentVel = relVel.x * tangent.x + relVel.y * tangent.y;

    // 计算切向冲量
    const rACrossT = rA.x * tangent.y - rA.y * tangent.x;
    const rBCrossT = rB.x * tangent.y - rB.y * tangent.x;

    const invMassSum = this.bodyA.invMass + this.bodyB.invMass +
      rACrossT * rACrossT * this.bodyA.invInertia +
      rBCrossT * rBCrossT * this.bodyB.invInertia;

    let tangentImpulse = -tangentVel / invMassSum;

    // 库仑摩擦：|Ft| <= mu * Fn
    const maxFriction = this.friction * contact.normalImpulse;
    const oldTangentImpulse = contact.tangentImpulse;
    contact.tangentImpulse = Math.max(-maxFriction, Math.min(maxFriction, contact.tangentImpulse + tangentImpulse));
    tangentImpulse = contact.tangentImpulse - oldTangentImpulse;

    // 应用摩擦冲量
    this.bodyA.velocity.x -= this.bodyA.invMass * tangentImpulse * tangent.x;
    this.bodyA.velocity.y -= this.bodyA.invMass * tangentImpulse * tangent.y;
    this.bodyA.angularVelocity -= this.bodyA.invInertia * rACrossT * tangentImpulse;

    this.bodyB.velocity.x += this.bodyB.invMass * tangentImpulse * tangent.x;
    this.bodyB.velocity.y += this.bodyB.invMass * tangentImpulse * tangent.y;
    this.bodyB.angularVelocity += this.bodyB.invInertia * rBCrossT * tangentImpulse;
  }
}
```

### 约束岛

为了性能，将连接的物体分组为岛：

```typescript
class ConstraintIsland {
  public bodies: RigidBody[] = [];
  public constraints: BaseConstraint[] = [];
  public contacts: ContactConstraint[] = [];

  public isSleeping(): boolean {
    // 如果所有物体速度都很低，岛就休眠
    const sleepThreshold = 0.01;

    for (const body of this.bodies) {
      const speed = body.velocity.x * body.velocity.x +
                    body.velocity.y * body.velocity.y +
                    body.angularVelocity * body.angularVelocity;

      if (speed > sleepThreshold) {
        return false;
      }
    }

    return true;
  }
}
```

---

## 性能优化

### 热启动

在帧之间缓存冲量以加快收敛：

```typescript
class WarmStartManager {
  private impulseCache: Map<string, number[]> = new Map();

  public getCacheKey(constraintId: string): string {
    return constraintId;
  }

  public storeImpulse(key: string, impulses: number[]): void {
    this.impulseCache.set(key, [...impulses]);
  }

  public getStoredImpulse(key: string): number[] | undefined {
    return this.impulseCache.get(key);
  }

  public clearCache(): void {
    this.impulseCache.clear();
  }
}
```

### 休眠物体

```typescript
class SleepManager {
  private sleepTimeThreshold: number = 0.5; // 秒
  private velocityThreshold: number = 0.01;
  private sleepTimers: Map<RigidBody, number> = new Map();

  public update(bodies: RigidBody[], dt: number): void {
    for (const body of bodies) {
      if (body.isStatic) continue;

      const speed = body.velocity.x * body.velocity.x +
                    body.velocity.y * body.velocity.y +
                    body.angularVelocity * body.angularVelocity;

      if (speed < this.velocityThreshold) {
        const timer = (this.sleepTimers.get(body) || 0) + dt;
        this.sleepTimers.set(body, timer);

        if (timer >= this.sleepTimeThreshold) {
          body.isSleeping = true;
          body.velocity = { x: 0, y: 0 };
          body.angularVelocity = 0;
        }
      } else {
        this.sleepTimers.set(body, 0);
        body.isSleeping = false;
      }
    }
  }

  public wakeBody(body: RigidBody): void {
    body.isSleeping = false;
    this.sleepTimers.set(body, 0);
  }
}
```

---

## 常见面试题

### Q1：什么是 Baumgarte 稳定化方法？

**答案：**
Baumgarte 稳定化在速度约束中添加一个偏置项来修正位置漂移：

```
C_dot + beta * C / dt = 0

其中：
- C：位置约束误差
- C_dot：速度约束
- beta：稳定化因子（0.1-0.3）
- dt：时间步长
```

这将位置误差反馈到速度求解器中，防止约束随时间漂移。

### Q2：为什么使用迭代求解器而不是直接求解器？

**答案：**
- **性能**：直接求解器是 O(n^3)，迭代是 O(n*iterations)
- **稳定性**：迭代方法更好地处理退化情况
- **简单性**：更容易实现和调试
- **并行化**：每个约束可以独立求解
- **热启动**：上一帧结果加速收敛

### Q3：如何处理约束顺序？

**答案：**
- 随机顺序防止系统误差
- 按穿透深度对接触排序
- 首先处理高优先级约束
- 使用图着色进行并行求解

---

## 总结

物理约束是创建真实游戏模拟的关键。本文涵盖的关键概念：

1. **数学基础**：约束函数、雅可比矩阵和拉格朗日乘数
2. **顺序冲量求解器**：行业标准的迭代方法
3. **常见关节类型**：距离、旋转、滑动和焊接关节
4. **弹簧系统**：带刚度和阻尼的软约束
5. **接触约束**：带摩擦的碰撞响应
6. **优化**：热启动、休眠和约束岛

理解这些概念使你能够实现或扩展物理引擎、调试复杂的物理行为，并创建引人入胜的游戏机制。

---

## 延伸阅读

- Erin Catto 关于 Box2D 的 GDC 演讲
- "Game Physics Pearls" - Gino van den Bergen
- Bullet Physics 文档
- PhysX SDK 文档
