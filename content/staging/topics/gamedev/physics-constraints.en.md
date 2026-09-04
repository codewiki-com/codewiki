---
title: Physics Constraints and Joint Systems
description: "Master physics constraint solving: distance joints, revolute joints, prismatic joints, and iterative solvers for game physics engines"
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - physics engine
  - constraints
  - joints
  - rigid body
  - simulation
status: imported
origin: old/src/content/docs/gamedev/physics-constraints.en.md
divergence: 0.214
issues: []
legacy:
  category: GameDev
  subcategory: Physics
  order: 51
  lastUpdated: 2026-01-22
---

## Introduction to Physics Constraints

Physics constraints are the foundation of realistic physical simulations in games. They allow objects to be connected, restricted, and interact in meaningful ways - from simple pendulums to complex ragdoll characters and vehicle suspensions. This article provides a comprehensive guide to understanding and implementing physics constraints and joint systems.

### What Are Constraints?

A constraint is a mathematical restriction that limits the degrees of freedom of one or more rigid bodies. In physics simulation:

```
Without constraints: Bodies move freely in all directions
With constraints: Bodies are restricted to specific motions

Examples:
- Distance constraint: Two bodies stay at fixed distance
- Point constraint: A point on body A matches a point on body B
- Angle constraint: Bodies maintain a specific relative angle
```

### Constraint Classification

```
┌─────────────────────────────────────────────────────────┐
│                   Physics Constraints                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Equality Constraints          Inequality Constraints    │
│  ├─ Distance Joint             ├─ Contact (no overlap)  │
│  ├─ Revolute Joint             ├─ Joint Limits          │
│  ├─ Prismatic Joint            └─ Friction Cone         │
│  ├─ Fixed Joint                                          │
│  └─ Weld Joint                                           │
│                                                          │
│  Soft Constraints              Hard Constraints          │
│  ├─ Springs                    ├─ All equality joints   │
│  ├─ Dampers                    └─ Collision response    │
│  └─ Motors                                               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Mathematical Foundation

### Constraint Functions

A constraint is defined by a constraint function C that equals zero when the constraint is satisfied:

```typescript
// General constraint form
// C(x) = 0   (equality constraint - must be zero)
// C(x) >= 0  (inequality constraint - must be non-negative)

interface Constraint {
  // Position-level constraint function
  computeC(bodies: RigidBody[]): number;

  // Velocity-level constraint (time derivative of C)
  computeCdot(bodies: RigidBody[]): number;

  // Jacobian matrix (partial derivatives)
  computeJacobian(bodies: RigidBody[]): Jacobian;
}
```

### The Jacobian Matrix

The Jacobian relates constraint velocities to body velocities:

```
C_dot = J * V

Where:
- C_dot: constraint velocity (scalar or vector)
- J: Jacobian matrix
- V: velocity vector [v1, w1, v2, w2, ...]

For a 2D constraint between two bodies:
J = [J_v1, J_w1, J_v2, J_w2]

Where:
- J_v1, J_v2: linear Jacobian (2D vectors)
- J_w1, J_w2: angular Jacobian (scalars in 2D)
```

```typescript
interface Jacobian {
  // For body A
  linearA: Vector2;   // Partial derivative w.r.t. velocity A
  angularA: number;   // Partial derivative w.r.t. angular velocity A

  // For body B
  linearB: Vector2;   // Partial derivative w.r.t. velocity B
  angularB: number;   // Partial derivative w.r.t. angular velocity B
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

### Constraint Force and Impulse

Constraints work by applying forces (or impulses) to maintain the constraint:

```typescript
// Constraint force
F_constraint = J^T * lambda

// Where lambda is the Lagrange multiplier (constraint force magnitude)

// The constraint equation:
// J * M^-1 * J^T * lambda = -C_dot - bias

// Effective mass
effectiveMass = J * M^-1 * J^T

// Impulse magnitude
lambda = -(C_dot + bias) / effectiveMass
```

---

## Sequential Impulse Solver

The Sequential Impulse method is the industry standard for real-time constraint solving, used by Box2D, Bullet, and PhysX.

### Basic Algorithm

```typescript
class SequentialImpulseSolver {
  private constraints: Constraint[] = [];
  private velocityIterations: number = 8;
  private positionIterations: number = 3;

  public solve(bodies: RigidBody[], dt: number): void {
    // Phase 1: Initialize constraints
    for (const constraint of this.constraints) {
      constraint.initialize(bodies, dt);
    }

    // Phase 2: Warm starting (apply cached impulses)
    for (const constraint of this.constraints) {
      constraint.warmStart(bodies);
    }

    // Phase 3: Velocity iterations
    for (let i = 0; i < this.velocityIterations; i++) {
      for (const constraint of this.constraints) {
        constraint.solveVelocity(bodies);
      }
    }

    // Phase 4: Integrate positions
    for (const body of bodies) {
      body.position.x += body.velocity.x * dt;
      body.position.y += body.velocity.y * dt;
      body.rotation += body.angularVelocity * dt;
    }

    // Phase 5: Position iterations (fix drift)
    for (let i = 0; i < this.positionIterations; i++) {
      let maxError = 0;
      for (const constraint of this.constraints) {
        const error = constraint.solvePosition(bodies);
        maxError = Math.max(maxError, error);
      }
      if (maxError < 0.001) break; // Converged
    }
  }
}
```

### Constraint Base Class

```typescript
abstract class BaseConstraint {
  protected bodyA: RigidBody;
  protected bodyB: RigidBody;

  // Cached values for solving
  protected jacobian: Jacobian;
  protected effectiveMass: number;
  protected bias: number;
  protected accumulatedImpulse: number = 0;

  // Tuning parameters
  protected frequencyHz: number = 0; // 0 = hard constraint
  protected dampingRatio: number = 0;

  constructor(bodyA: RigidBody, bodyB: RigidBody) {
    this.bodyA = bodyA;
    this.bodyB = bodyB;
  }

  public initialize(bodies: RigidBody[], dt: number): void {
    // Compute Jacobian
    this.jacobian = this.computeJacobian();

    // Compute effective mass: K = J * M^-1 * J^T
    this.effectiveMass = this.computeEffectiveMass();

    // Compute bias for Baumgarte stabilization
    const C = this.computeConstraint();
    const beta = this.computeBeta(dt);
    this.bias = beta * C / dt;

    // For soft constraints, modify effective mass
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
    // Baumgarte stabilization factor
    // Typical values: 0.1 to 0.3
    return 0.2;
  }

  protected applySoftness(dt: number): void {
    // Convert frequency and damping to stiffness and damping
    const omega = 2 * Math.PI * this.frequencyHz;
    const d = 2 * this.effectiveMass * this.dampingRatio * omega;
    const k = this.effectiveMass * omega * omega;

    // Modify effective mass for soft constraint
    const gamma = 1 / (dt * (d + dt * k));
    const softBeta = dt * k * gamma;

    this.effectiveMass = 1 / (1 / this.effectiveMass + gamma);
    this.bias *= softBeta;
  }

  public warmStart(bodies: RigidBody[]): void {
    // Apply cached impulse from previous frame
    this.applyImpulse(this.accumulatedImpulse);
  }

  public solveVelocity(bodies: RigidBody[]): void {
    // Compute relative velocity at constraint
    const Cdot = this.computeVelocityConstraint();

    // Compute impulse magnitude
    let lambda = -(Cdot + this.bias) / this.effectiveMass;

    // Clamp impulse (for inequality constraints)
    lambda = this.clampImpulse(lambda);

    // Apply impulse
    this.applyImpulse(lambda);

    // Accumulate for warm starting
    this.accumulatedImpulse += lambda;
  }

  public solvePosition(bodies: RigidBody[]): number {
    // Compute position error
    const C = this.computeConstraint();

    if (Math.abs(C) < 0.001) {
      return 0; // Already satisfied
    }

    // Compute position correction
    const correction = -C / this.effectiveMass;

    // Apply position correction directly
    this.applyPositionCorrection(correction);

    return Math.abs(C);
  }

  protected applyImpulse(lambda: number): void {
    const J = this.jacobian;

    // Apply to body A
    this.bodyA.velocity.x += this.bodyA.invMass * J.linearA.x * lambda;
    this.bodyA.velocity.y += this.bodyA.invMass * J.linearA.y * lambda;
    this.bodyA.angularVelocity += this.bodyA.invInertia * J.angularA * lambda;

    // Apply to body B
    this.bodyB.velocity.x += this.bodyB.invMass * J.linearB.x * lambda;
    this.bodyB.velocity.y += this.bodyB.invMass * J.linearB.y * lambda;
    this.bodyB.angularVelocity += this.bodyB.invInertia * J.angularB * lambda;
  }

  protected applyPositionCorrection(correction: number): void {
    const J = this.jacobian;

    // Apply to body A
    this.bodyA.position.x += this.bodyA.invMass * J.linearA.x * correction;
    this.bodyA.position.y += this.bodyA.invMass * J.linearA.y * correction;
    this.bodyA.rotation += this.bodyA.invInertia * J.angularA * correction;

    // Apply to body B
    this.bodyB.position.x += this.bodyB.invMass * J.linearB.x * correction;
    this.bodyB.position.y += this.bodyB.invMass * J.linearB.y * correction;
    this.bodyB.rotation += this.bodyB.invInertia * J.angularB * correction;
  }

  protected clampImpulse(lambda: number): number {
    // Override in subclasses for inequality constraints
    return lambda;
  }

  protected abstract computeConstraint(): number;
  protected abstract computeVelocityConstraint(): number;
  protected abstract computeJacobian(): Jacobian;
}
```

---

## Common Joint Types

### Distance Joint

Maintains a fixed distance between two anchor points:

```typescript
class DistanceJoint extends BaseConstraint {
  private anchorA: Vector2; // Local anchor on body A
  private anchorB: Vector2; // Local anchor on body B
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

    // Calculate initial length if not specified
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

    // Direction from A to B
    const dx = worldB.x - worldA.x;
    const dy = worldB.y - worldA.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    const n = length > 0
      ? { x: dx / length, y: dy / length }
      : { x: 1, y: 0 };

    // Moment arms
    const rA = { x: worldA.x - this.bodyA.position.x, y: worldA.y - this.bodyA.position.y };
    const rB = { x: worldB.x - this.bodyB.position.x, y: worldB.y - this.bodyB.position.y };

    // Cross products (2D): r x n = rx * ny - ry * nx
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

### Revolute Joint (Hinge/Pin Joint)

Constrains two bodies to rotate around a common point:

```typescript
class RevoluteJoint extends BaseConstraint {
  private anchorA: Vector2;
  private anchorB: Vector2;

  // Motor properties
  private motorEnabled: boolean = false;
  private motorSpeed: number = 0;
  private maxMotorTorque: number = 0;
  private motorImpulse: number = 0;

  // Limit properties
  private limitEnabled: boolean = false;
  private lowerAngle: number = 0;
  private upperAngle: number = 0;
  private referenceAngle: number;
  private limitState: 'inactive' | 'atLower' | 'atUpper' | 'equal' = 'inactive';
  private limitImpulse: number = 0;

  // Position constraint (2D point constraint)
  private impulse: Vector2 = { x: 0, y: 0 };
  private mass: number[][] = [[0, 0], [0, 0]]; // 2x2 effective mass

  constructor(
    bodyA: RigidBody,
    bodyB: RigidBody,
    anchor: Vector2 // World space anchor
  ) {
    super(bodyA, bodyB);

    // Convert world anchor to local coordinates
    this.anchorA = this.worldToLocal(bodyA, anchor);
    this.anchorB = this.worldToLocal(bodyB, anchor);

    // Store reference angle
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

  public initialize(bodies: RigidBody[], dt: number): void {
    const worldA = this.localToWorld(this.bodyA, this.anchorA);
    const worldB = this.localToWorld(this.bodyB, this.anchorB);

    const rA = {
      x: worldA.x - this.bodyA.position.x,
      y: worldA.y - this.bodyA.position.y
    };
    const rB = {
      x: worldB.x - this.bodyB.position.x,
      y: worldB.y - this.bodyB.position.y
    };

    // Compute 2x2 effective mass matrix for point constraint
    const mA = this.bodyA.invMass;
    const mB = this.bodyB.invMass;
    const iA = this.bodyA.invInertia;
    const iB = this.bodyB.invInertia;

    // K = [(mA + mB + rAy^2*iA + rBy^2*iB), (-rAx*rAy*iA - rBx*rBy*iB)]
    //     [(-rAx*rAy*iA - rBx*rBy*iB), (mA + mB + rAx^2*iA + rBx^2*iB)]
    const K00 = mA + mB + rA.y * rA.y * iA + rB.y * rB.y * iB;
    const K01 = -rA.x * rA.y * iA - rB.x * rB.y * iB;
    const K11 = mA + mB + rA.x * rA.x * iA + rB.x * rB.x * iB;

    // Invert the mass matrix
    const det = K00 * K11 - K01 * K01;
    if (det !== 0) {
      const invDet = 1 / det;
      this.mass = [
        [K11 * invDet, -K01 * invDet],
        [-K01 * invDet, K00 * invDet]
      ];
    }

    // Update limit state
    if (this.limitEnabled) {
      const angle = this.bodyB.rotation - this.bodyA.rotation - this.referenceAngle;

      if (this.upperAngle - this.lowerAngle < 0.001) {
        this.limitState = 'equal';
      } else if (angle <= this.lowerAngle) {
        this.limitState = 'atLower';
      } else if (angle >= this.upperAngle) {
        this.limitState = 'atUpper';
      } else {
        this.limitState = 'inactive';
        this.limitImpulse = 0;
      }
    }
  }

  public warmStart(bodies: RigidBody[]): void {
    const worldA = this.localToWorld(this.bodyA, this.anchorA);
    const rA = { x: worldA.x - this.bodyA.position.x, y: worldA.y - this.bodyA.position.y };
    const worldB = this.localToWorld(this.bodyB, this.anchorB);
    const rB = { x: worldB.x - this.bodyB.position.x, y: worldB.y - this.bodyB.position.y };

    // Apply accumulated point constraint impulse
    this.bodyA.velocity.x -= this.bodyA.invMass * this.impulse.x;
    this.bodyA.velocity.y -= this.bodyA.invMass * this.impulse.y;
    this.bodyA.angularVelocity -= this.bodyA.invInertia *
      (rA.x * this.impulse.y - rA.y * this.impulse.x);

    this.bodyB.velocity.x += this.bodyB.invMass * this.impulse.x;
    this.bodyB.velocity.y += this.bodyB.invMass * this.impulse.y;
    this.bodyB.angularVelocity += this.bodyB.invInertia *
      (rB.x * this.impulse.y - rB.y * this.impulse.x);

    // Apply motor and limit impulses
    if (this.motorEnabled) {
      this.bodyA.angularVelocity -= this.bodyA.invInertia * this.motorImpulse;
      this.bodyB.angularVelocity += this.bodyB.invInertia * this.motorImpulse;
    }

    if (this.limitEnabled && this.limitState !== 'inactive') {
      this.bodyA.angularVelocity -= this.bodyA.invInertia * this.limitImpulse;
      this.bodyB.angularVelocity += this.bodyB.invInertia * this.limitImpulse;
    }
  }

  public solveVelocity(bodies: RigidBody[]): void {
    const worldA = this.localToWorld(this.bodyA, this.anchorA);
    const worldB = this.localToWorld(this.bodyB, this.anchorB);
    const rA = { x: worldA.x - this.bodyA.position.x, y: worldA.y - this.bodyA.position.y };
    const rB = { x: worldB.x - this.bodyB.position.x, y: worldB.y - this.bodyB.position.y };

    // Solve motor constraint
    if (this.motorEnabled) {
      const Cdot = this.bodyB.angularVelocity - this.bodyA.angularVelocity - this.motorSpeed;
      const motorMass = this.bodyA.invInertia + this.bodyB.invInertia;
      let impulse = -Cdot / motorMass;

      const oldImpulse = this.motorImpulse;
      this.motorImpulse = Math.max(-this.maxMotorTorque, Math.min(this.maxMotorTorque, this.motorImpulse + impulse));
      impulse = this.motorImpulse - oldImpulse;

      this.bodyA.angularVelocity -= this.bodyA.invInertia * impulse;
      this.bodyB.angularVelocity += this.bodyB.invInertia * impulse;
    }

    // Solve limit constraint
    if (this.limitEnabled && this.limitState !== 'inactive') {
      const Cdot = this.bodyB.angularVelocity - this.bodyA.angularVelocity;
      const limitMass = this.bodyA.invInertia + this.bodyB.invInertia;
      let impulse = -Cdot / limitMass;

      if (this.limitState === 'equal') {
        this.limitImpulse += impulse;
      } else if (this.limitState === 'atLower') {
        const oldImpulse = this.limitImpulse;
        this.limitImpulse = Math.max(0, this.limitImpulse + impulse);
        impulse = this.limitImpulse - oldImpulse;
      } else if (this.limitState === 'atUpper') {
        const oldImpulse = this.limitImpulse;
        this.limitImpulse = Math.min(0, this.limitImpulse + impulse);
        impulse = this.limitImpulse - oldImpulse;
      }

      this.bodyA.angularVelocity -= this.bodyA.invInertia * impulse;
      this.bodyB.angularVelocity += this.bodyB.invInertia * impulse;
    }

    // Solve point-to-point constraint
    const vA = {
      x: this.bodyA.velocity.x - this.bodyA.angularVelocity * rA.y,
      y: this.bodyA.velocity.y + this.bodyA.angularVelocity * rA.x
    };
    const vB = {
      x: this.bodyB.velocity.x - this.bodyB.angularVelocity * rB.y,
      y: this.bodyB.velocity.y + this.bodyB.angularVelocity * rB.x
    };

    const Cdot = { x: vB.x - vA.x, y: vB.y - vA.y };

    // impulse = -Mass * Cdot
    const impulseX = -(this.mass[0][0] * Cdot.x + this.mass[0][1] * Cdot.y);
    const impulseY = -(this.mass[1][0] * Cdot.x + this.mass[1][1] * Cdot.y);

    this.impulse.x += impulseX;
    this.impulse.y += impulseY;

    this.bodyA.velocity.x -= this.bodyA.invMass * impulseX;
    this.bodyA.velocity.y -= this.bodyA.invMass * impulseY;
    this.bodyA.angularVelocity -= this.bodyA.invInertia * (rA.x * impulseY - rA.y * impulseX);

    this.bodyB.velocity.x += this.bodyB.invMass * impulseX;
    this.bodyB.velocity.y += this.bodyB.invMass * impulseY;
    this.bodyB.angularVelocity += this.bodyB.invInertia * (rB.x * impulseY - rB.y * impulseX);
  }

  // Required overrides (simplified for this joint type)
  protected computeConstraint(): number { return 0; }
  protected computeVelocityConstraint(): number { return 0; }
  protected computeJacobian(): Jacobian {
    return { linearA: { x: 0, y: 0 }, angularA: 0, linearB: { x: 0, y: 0 }, angularB: 0 };
  }
}
```

### Prismatic Joint (Slider Joint)

Constrains motion to a single axis:

```typescript
class PrismaticJoint extends BaseConstraint {
  private anchorA: Vector2;
  private anchorB: Vector2;
  private localAxisA: Vector2; // Sliding axis in body A's local space
  private referenceAngle: number;

  // Accumulated impulses
  private impulse: Vector2 = { x: 0, y: 0 }; // Point constraint + rotation constraint
  private motorImpulse: number = 0;

  // Motor
  private motorEnabled: boolean = false;
  private motorSpeed: number = 0;
  private maxMotorForce: number = 0;

  // Limits
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

    // Normalize and store axis in local space
    const len = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
    const worldAxis = { x: axis.x / len, y: axis.y / len };

    // Convert to body A local space
    const cos = Math.cos(-bodyA.rotation);
    const sin = Math.sin(-bodyA.rotation);
    this.localAxisA = {
      x: worldAxis.x * cos - worldAxis.y * sin,
      y: worldAxis.x * sin + worldAxis.y * cos
    };

    this.referenceAngle = bodyB.rotation - bodyA.rotation;
  }

  private worldToLocal(body: RigidBody, point: Vector2): Vector2 {
    const cos = Math.cos(-body.rotation);
    const sin = Math.sin(-body.rotation);
    const dx = point.x - body.position.x;
    const dy = point.y - body.position.y;
    return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
  }

  private localToWorld(body: RigidBody, point: Vector2): Vector2 {
    const cos = Math.cos(body.rotation);
    const sin = Math.sin(body.rotation);
    return {
      x: body.position.x + point.x * cos - point.y * sin,
      y: body.position.y + point.x * sin + point.y * cos
    };
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

    // Get world axis
    const cos = Math.cos(this.bodyA.rotation);
    const sin = Math.sin(this.bodyA.rotation);
    const axis = {
      x: this.localAxisA.x * cos - this.localAxisA.y * sin,
      y: this.localAxisA.x * sin + this.localAxisA.y * cos
    };

    const d = { x: worldB.x - worldA.x, y: worldB.y - worldA.y };
    return d.x * axis.x + d.y * axis.y;
  }

  public getJointSpeed(): number {
    // Relative velocity along axis
    const cos = Math.cos(this.bodyA.rotation);
    const sin = Math.sin(this.bodyA.rotation);
    const axis = {
      x: this.localAxisA.x * cos - this.localAxisA.y * sin,
      y: this.localAxisA.x * sin + this.localAxisA.y * cos
    };

    const vA = this.bodyA.velocity;
    const vB = this.bodyB.velocity;

    return (vB.x - vA.x) * axis.x + (vB.y - vA.y) * axis.y;
  }

  protected computeConstraint(): number {
    return this.getJointTranslation();
  }

  protected computeVelocityConstraint(): number {
    return this.getJointSpeed();
  }

  protected computeJacobian(): Jacobian {
    // Simplified - full implementation would compute perpendicular axis constraint
    const cos = Math.cos(this.bodyA.rotation);
    const sin = Math.sin(this.bodyA.rotation);
    const axis = {
      x: this.localAxisA.x * cos - this.localAxisA.y * sin,
      y: this.localAxisA.x * sin + this.localAxisA.y * cos
    };

    return {
      linearA: { x: -axis.x, y: -axis.y },
      angularA: 0,
      linearB: { x: axis.x, y: axis.y },
      angularB: 0
    };
  }
}
```

### Weld Joint (Fixed Joint)

Rigidly connects two bodies:

```typescript
class WeldJoint extends BaseConstraint {
  private anchorA: Vector2;
  private anchorB: Vector2;
  private referenceAngle: number;

  // 3 DOF constraint (x, y, angle)
  private impulse: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  private mass: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; // 3x3 matrix

  // Softness for flexible welds
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

  private worldToLocal(body: RigidBody, point: Vector2): Vector2 {
    const cos = Math.cos(-body.rotation);
    const sin = Math.sin(-body.rotation);
    const dx = point.x - body.position.x;
    const dy = point.y - body.position.y;
    return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
  }

  private localToWorld(body: RigidBody, point: Vector2): Vector2 {
    const cos = Math.cos(body.rotation);
    const sin = Math.sin(body.rotation);
    return {
      x: body.position.x + point.x * cos - point.y * sin,
      y: body.position.y + point.x * sin + point.y * cos
    };
  }

  public setStiffness(stiffness: number, damping: number): void {
    this.stiffness = stiffness;
    this.damping = damping;
  }

  public initialize(bodies: RigidBody[], dt: number): void {
    const worldA = this.localToWorld(this.bodyA, this.anchorA);
    const worldB = this.localToWorld(this.bodyB, this.anchorB);

    const rA = { x: worldA.x - this.bodyA.position.x, y: worldA.y - this.bodyA.position.y };
    const rB = { x: worldB.x - this.bodyB.position.x, y: worldB.y - this.bodyB.position.y };

    const mA = this.bodyA.invMass;
    const mB = this.bodyB.invMass;
    const iA = this.bodyA.invInertia;
    const iB = this.bodyB.invInertia;

    // Build 3x3 effective mass matrix
    // Position rows
    this.mass[0][0] = mA + mB + rA.y * rA.y * iA + rB.y * rB.y * iB;
    this.mass[0][1] = -rA.x * rA.y * iA - rB.x * rB.y * iB;
    this.mass[0][2] = -rA.y * iA - rB.y * iB;

    this.mass[1][0] = this.mass[0][1];
    this.mass[1][1] = mA + mB + rA.x * rA.x * iA + rB.x * rB.x * iB;
    this.mass[1][2] = rA.x * iA + rB.x * iB;

    // Rotation row
    this.mass[2][0] = this.mass[0][2];
    this.mass[2][1] = this.mass[1][2];
    this.mass[2][2] = iA + iB;

    // Apply softness if configured
    if (this.stiffness > 0) {
      const C = this.bodyB.rotation - this.bodyA.rotation - this.referenceAngle;
      const d = this.damping;
      const k = this.stiffness;

      this.gamma = 1 / (dt * (d + dt * k));
      this.bias = C * dt * k * this.gamma;
      this.mass[2][2] += this.gamma;
    }

    // Invert mass matrix (3x3)
    this.invertMass3x3();
  }

  private invertMass3x3(): void {
    // Compute determinant and invert
    // (Implementation omitted for brevity)
  }

  public solveVelocity(bodies: RigidBody[]): void {
    const worldA = this.localToWorld(this.bodyA, this.anchorA);
    const worldB = this.localToWorld(this.bodyB, this.anchorB);
    const rA = { x: worldA.x - this.bodyA.position.x, y: worldA.y - this.bodyA.position.y };
    const rB = { x: worldB.x - this.bodyB.position.x, y: worldB.y - this.bodyB.position.y };

    // Compute velocity error
    const vA = {
      x: this.bodyA.velocity.x - this.bodyA.angularVelocity * rA.y,
      y: this.bodyA.velocity.y + this.bodyA.angularVelocity * rA.x
    };
    const vB = {
      x: this.bodyB.velocity.x - this.bodyB.angularVelocity * rB.y,
      y: this.bodyB.velocity.y + this.bodyB.angularVelocity * rB.x
    };

    const Cdot = {
      x: vB.x - vA.x,
      y: vB.y - vA.y,
      z: this.bodyB.angularVelocity - this.bodyA.angularVelocity + this.gamma * this.impulse.z + this.bias
    };

    // Solve for impulse
    // impulse = -Mass * Cdot
    const impulse = this.solveMass3x3(Cdot);

    this.impulse.x += impulse.x;
    this.impulse.y += impulse.y;
    this.impulse.z += impulse.z;

    // Apply impulse
    this.bodyA.velocity.x -= this.bodyA.invMass * impulse.x;
    this.bodyA.velocity.y -= this.bodyA.invMass * impulse.y;
    this.bodyA.angularVelocity -= this.bodyA.invInertia *
      (rA.x * impulse.y - rA.y * impulse.x + impulse.z);

    this.bodyB.velocity.x += this.bodyB.invMass * impulse.x;
    this.bodyB.velocity.y += this.bodyB.invMass * impulse.y;
    this.bodyB.angularVelocity += this.bodyB.invInertia *
      (rB.x * impulse.y - rB.y * impulse.x + impulse.z);
  }

  private solveMass3x3(b: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
    // Multiply inverse mass matrix by vector
    // (Implementation depends on stored inverse)
    return { x: 0, y: 0, z: 0 };
  }

  protected computeConstraint(): number { return 0; }
  protected computeVelocityConstraint(): number { return 0; }
  protected computeJacobian(): Jacobian {
    return { linearA: { x: 0, y: 0 }, angularA: 0, linearB: { x: 0, y: 0 }, angularB: 0 };
  }
}
```

---

## Spring and Damper Systems

### Spring Joint

```typescript
class SpringJoint {
  private bodyA: RigidBody;
  private bodyB: RigidBody;
  private anchorA: Vector2;
  private anchorB: Vector2;
  private restLength: number;
  private stiffness: number;  // Spring constant (k)
  private damping: number;    // Damping coefficient (c)

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

    // Calculate rest length from initial positions
    const worldA = this.getWorldAnchorA();
    const worldB = this.getWorldAnchorB();
    const dx = worldB.x - worldA.x;
    const dy = worldB.y - worldA.y;
    this.restLength = Math.sqrt(dx * dx + dy * dy);
  }

  private getWorldAnchorA(): Vector2 {
    const cos = Math.cos(this.bodyA.rotation);
    const sin = Math.sin(this.bodyA.rotation);
    return {
      x: this.bodyA.position.x + this.anchorA.x * cos - this.anchorA.y * sin,
      y: this.bodyA.position.y + this.anchorA.x * sin + this.anchorA.y * cos
    };
  }

  private getWorldAnchorB(): Vector2 {
    const cos = Math.cos(this.bodyB.rotation);
    const sin = Math.sin(this.bodyB.rotation);
    return {
      x: this.bodyB.position.x + this.anchorB.x * cos - this.anchorB.y * sin,
      y: this.bodyB.position.y + this.anchorB.x * sin + this.anchorB.y * cos
    };
  }

  public applyForce(dt: number): void {
    const worldA = this.getWorldAnchorA();
    const worldB = this.getWorldAnchorB();

    // Direction and distance
    const dx = worldB.x - worldA.x;
    const dy = worldB.y - worldA.y;
    const currentLength = Math.sqrt(dx * dx + dy * dy);

    if (currentLength < 0.0001) return; // Avoid division by zero

    // Normalized direction
    const nx = dx / currentLength;
    const ny = dy / currentLength;

    // Spring force: F = -k * (length - restLength)
    const stretch = currentLength - this.restLength;
    const springForce = this.stiffness * stretch;

    // Damping force: F = -c * relativeVelocity
    const rA = { x: worldA.x - this.bodyA.position.x, y: worldA.y - this.bodyA.position.y };
    const rB = { x: worldB.x - this.bodyB.position.x, y: worldB.y - this.bodyB.position.y };

    // Velocity at anchor points
    const vA = {
      x: this.bodyA.velocity.x - this.bodyA.angularVelocity * rA.y,
      y: this.bodyA.velocity.y + this.bodyA.angularVelocity * rA.x
    };
    const vB = {
      x: this.bodyB.velocity.x - this.bodyB.angularVelocity * rB.y,
      y: this.bodyB.velocity.y + this.bodyB.angularVelocity * rB.x
    };

    // Relative velocity along spring direction
    const relVel = (vB.x - vA.x) * nx + (vB.y - vA.y) * ny;
    const dampingForce = this.damping * relVel;

    // Total force magnitude
    const forceMag = springForce + dampingForce;

    // Force vector
    const forceX = forceMag * nx;
    const forceY = forceMag * ny;

    // Apply force to body A (positive direction)
    this.bodyA.velocity.x += this.bodyA.invMass * forceX * dt;
    this.bodyA.velocity.y += this.bodyA.invMass * forceY * dt;
    this.bodyA.angularVelocity += this.bodyA.invInertia *
      (rA.x * forceY - rA.y * forceX) * dt;

    // Apply force to body B (negative direction)
    this.bodyB.velocity.x -= this.bodyB.invMass * forceX * dt;
    this.bodyB.velocity.y -= this.bodyB.invMass * forceY * dt;
    this.bodyB.angularVelocity -= this.bodyB.invInertia *
      (rB.x * forceY - rB.y * forceX) * dt;
  }
}
```

### Angular Spring (Torsion Spring)

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

    // Store initial angle difference as rest angle
    this.restAngle = bodyB.rotation - bodyA.rotation;
  }

  public applyTorque(dt: number): void {
    // Current angle difference
    const currentAngle = this.bodyB.rotation - this.bodyA.rotation;

    // Angle error (with proper wrapping)
    let angleError = currentAngle - this.restAngle;
    while (angleError > Math.PI) angleError -= 2 * Math.PI;
    while (angleError < -Math.PI) angleError += 2 * Math.PI;

    // Spring torque
    const springTorque = -this.stiffness * angleError;

    // Damping torque
    const relAngVel = this.bodyB.angularVelocity - this.bodyA.angularVelocity;
    const dampingTorque = -this.damping * relAngVel;

    // Total torque
    const torque = springTorque + dampingTorque;

    // Apply torque
    this.bodyA.angularVelocity -= this.bodyA.invInertia * torque * dt;
    this.bodyB.angularVelocity += this.bodyB.invInertia * torque * dt;
  }
}
```

---

## Advanced Topics

### Contact Constraints

Contact constraints prevent penetration between colliding bodies:

```typescript
interface ContactPoint {
  position: Vector2;
  normal: Vector2;  // Points from A to B
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

      // Relative velocity at contact point
      const vA = {
        x: this.bodyA.velocity.x - this.bodyA.angularVelocity * rA.y,
        y: this.bodyA.velocity.y + this.bodyA.angularVelocity * rA.x
      };
      const vB = {
        x: this.bodyB.velocity.x - this.bodyB.angularVelocity * rB.y,
        y: this.bodyB.velocity.y + this.bodyB.angularVelocity * rB.x
      };

      const relVel = { x: vB.x - vA.x, y: vB.y - vA.y };

      // Normal velocity
      const normalVel = relVel.x * contact.normal.x + relVel.y * contact.normal.y;

      // Only resolve if bodies are approaching
      if (normalVel >= 0) continue;

      // Compute normal impulse
      const rACrossN = rA.x * contact.normal.y - rA.y * contact.normal.x;
      const rBCrossN = rB.x * contact.normal.y - rB.y * contact.normal.x;

      const invMassSum = this.bodyA.invMass + this.bodyB.invMass +
        rACrossN * rACrossN * this.bodyA.invInertia +
        rBCrossN * rBCrossN * this.bodyB.invInertia;

      // Restitution
      const restitutionVel = -this.restitution * normalVel;

      let normalImpulse = (restitutionVel - normalVel) / invMassSum;

      // Clamp to positive (only push, never pull)
      const oldNormalImpulse = contact.normalImpulse;
      contact.normalImpulse = Math.max(0, contact.normalImpulse + normalImpulse);
      normalImpulse = contact.normalImpulse - oldNormalImpulse;

      // Apply normal impulse
      this.bodyA.velocity.x -= this.bodyA.invMass * normalImpulse * contact.normal.x;
      this.bodyA.velocity.y -= this.bodyA.invMass * normalImpulse * contact.normal.y;
      this.bodyA.angularVelocity -= this.bodyA.invInertia * rACrossN * normalImpulse;

      this.bodyB.velocity.x += this.bodyB.invMass * normalImpulse * contact.normal.x;
      this.bodyB.velocity.y += this.bodyB.invMass * normalImpulse * contact.normal.y;
      this.bodyB.angularVelocity += this.bodyB.invInertia * rBCrossN * normalImpulse;

      // Friction impulse
      this.solveFriction(contact, rA, rB);
    }
  }

  private solveFriction(contact: ContactPoint, rA: Vector2, rB: Vector2): void {
    // Tangent direction
    const tangent = { x: -contact.normal.y, y: contact.normal.x };

    // Recalculate relative velocity
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

    // Compute tangent impulse
    const rACrossT = rA.x * tangent.y - rA.y * tangent.x;
    const rBCrossT = rB.x * tangent.y - rB.y * tangent.x;

    const invMassSum = this.bodyA.invMass + this.bodyB.invMass +
      rACrossT * rACrossT * this.bodyA.invInertia +
      rBCrossT * rBCrossT * this.bodyB.invInertia;

    let tangentImpulse = -tangentVel / invMassSum;

    // Coulomb friction: |Ft| <= mu * Fn
    const maxFriction = this.friction * contact.normalImpulse;
    const oldTangentImpulse = contact.tangentImpulse;
    contact.tangentImpulse = Math.max(-maxFriction, Math.min(maxFriction, contact.tangentImpulse + tangentImpulse));
    tangentImpulse = contact.tangentImpulse - oldTangentImpulse;

    // Apply friction impulse
    this.bodyA.velocity.x -= this.bodyA.invMass * tangentImpulse * tangent.x;
    this.bodyA.velocity.y -= this.bodyA.invMass * tangentImpulse * tangent.y;
    this.bodyA.angularVelocity -= this.bodyA.invInertia * rACrossT * tangentImpulse;

    this.bodyB.velocity.x += this.bodyB.invMass * tangentImpulse * tangent.x;
    this.bodyB.velocity.y += this.bodyB.invMass * tangentImpulse * tangent.y;
    this.bodyB.angularVelocity += this.bodyB.invInertia * rBCrossT * tangentImpulse;
  }
}
```

### Constraint Islands

For performance, group connected bodies into islands:

```typescript
class ConstraintIsland {
  public bodies: RigidBody[] = [];
  public constraints: BaseConstraint[] = [];
  public contacts: ContactConstraint[] = [];

  public isSleeping(): boolean {
    // Island sleeps if all bodies have low velocity
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

class IslandManager {
  public buildIslands(bodies: RigidBody[], constraints: BaseConstraint[]): ConstraintIsland[] {
    const visited = new Set<RigidBody>();
    const islands: ConstraintIsland[] = [];

    // Build adjacency from constraints
    const adjacency = new Map<RigidBody, Set<RigidBody>>();

    for (const constraint of constraints) {
      if (!adjacency.has(constraint.bodyA)) {
        adjacency.set(constraint.bodyA, new Set());
      }
      if (!adjacency.has(constraint.bodyB)) {
        adjacency.set(constraint.bodyB, new Set());
      }
      adjacency.get(constraint.bodyA)!.add(constraint.bodyB);
      adjacency.get(constraint.bodyB)!.add(constraint.bodyA);
    }

    // DFS to find connected components
    for (const body of bodies) {
      if (visited.has(body) || body.isStatic) continue;

      const island = new ConstraintIsland();
      const stack = [body];

      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;

        visited.add(current);
        island.bodies.push(current);

        const neighbors = adjacency.get(current);
        if (neighbors) {
          for (const neighbor of neighbors) {
            if (!visited.has(neighbor) && !neighbor.isStatic) {
              stack.push(neighbor);
            }
          }
        }
      }

      // Collect constraints for this island
      for (const constraint of constraints) {
        if (island.bodies.includes(constraint.bodyA) ||
            island.bodies.includes(constraint.bodyB)) {
          island.constraints.push(constraint);
        }
      }

      islands.push(island);
    }

    return islands;
  }
}
```

---

## Performance Optimization

### Warm Starting

Cache impulses between frames for faster convergence:

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

### Sleeping Bodies

```typescript
class SleepManager {
  private sleepTimeThreshold: number = 0.5; // seconds
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

## Common Interview Questions

### Q1: What is the Baumgarte stabilization method?

**Answer:**
Baumgarte stabilization adds a bias term to the velocity constraint to correct position drift:

```
C_dot + beta * C / dt = 0

Where:
- C: Position constraint error
- C_dot: Velocity constraint
- beta: Stabilization factor (0.1-0.3)
- dt: Time step
```

This feeds back position error into the velocity solver, preventing constraint drift over time.

### Q2: Why use iterative solvers instead of direct solvers?

**Answer:**
- **Performance**: Direct solvers are O(n^3), iterative are O(n*iterations)
- **Stability**: Iterative methods handle degenerate cases better
- **Simplicity**: Easier to implement and debug
- **Parallelization**: Each constraint can be solved independently
- **Warm starting**: Previous frame results accelerate convergence

### Q3: How do you handle constraint ordering?

**Answer:**
- Random ordering prevents systematic errors
- Sort by penetration depth for contacts
- Process high-priority constraints first
- Use graph coloring for parallel solving

---

## Summary

Physics constraints are essential for creating realistic game simulations. Key concepts covered:

1. **Mathematical Foundation**: Constraint functions, Jacobians, and Lagrange multipliers
2. **Sequential Impulse Solver**: Industry-standard iterative method
3. **Common Joint Types**: Distance, revolute, prismatic, and weld joints
4. **Spring Systems**: Soft constraints with stiffness and damping
5. **Contact Constraints**: Collision response with friction
6. **Optimization**: Warm starting, sleeping, and constraint islands

Understanding these concepts enables you to implement or extend physics engines, debug complex physical behaviors, and create compelling game mechanics.

---

## Further Reading

- Erin Catto's GDC presentations on Box2D
- "Game Physics Pearls" - Gino van den Bergen
- Bullet Physics documentation
- PhysX SDK documentation
