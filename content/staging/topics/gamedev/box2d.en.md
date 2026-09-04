---
title: Box2D Physics Engine Complete Guide
description: "Master the Box2D 2D physics engine: bodies, shapes, fixtures, joints, collision detection, and game integration strategies"
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - Box2D
  - physics
  - 2D
  - collision
  - rigid body
  - joints
status: imported
origin: old/src/content/docs/gamedev/box2d.en.md
divergence: 0.237
issues: []
legacy:
  category: GameDev
  subcategory: 2D
  order: 52
  lastUpdated: 2026-01-22
---

Box2D is the industry-standard 2D rigid body physics engine, originally created by Erin Catto. It powers physics in countless games from Angry Birds to Limbo. This comprehensive guide covers Box2D's architecture, core concepts, and practical implementation patterns for game development.

## Box2D Architecture Overview

### Core Components

Box2D is built around several key concepts that work together to create realistic physics simulations.

```
World
├── Bodies (Dynamic, Static, Kinematic)
│   └── Fixtures
│       ├── Shape (Circle, Polygon, Edge, Chain)
│       └── Material Properties (density, friction, restitution)
├── Joints (Revolute, Prismatic, Distance, etc.)
└── Contact Manager
    ├── Broad Phase (Dynamic AABB Tree)
    └── Narrow Phase (GJK/SAT)
```

### The Physics World

The world is the container for all physics simulation.

```typescript
// Using a Box2D-style API (Planck.js syntax)
import { World, Vec2, Settings } from 'planck-js';

class PhysicsWorld {
  private world: World;
  private readonly PIXELS_PER_METER = 30;

  // Box2D works best with objects sized 0.1 to 10 meters
  private readonly MIN_SIZE = 0.1;
  private readonly MAX_SIZE = 10;

  constructor(gravity: Vec2 = Vec2(0, -10)) {
    this.world = new World({
      gravity: gravity,
      allowSleep: true // Improve performance by sleeping inactive bodies
    });
  }

  // Unit conversion: pixels to meters
  toMeters(pixels: number): number {
    return pixels / this.PIXELS_PER_METER;
  }

  // Unit conversion: meters to pixels
  toPixels(meters: number): number {
    return meters * this.PIXELS_PER_METER;
  }

  // Step the simulation
  step(deltaTime: number): void {
    // Fixed timestep recommended: 1/60 second
    const timeStep = 1 / 60;

    // Velocity iterations: accuracy of velocity constraint solving
    // Position iterations: accuracy of position constraint solving
    const velocityIterations = 8;
    const positionIterations = 3;

    // Accumulator for fixed timestep
    this.accumulator += deltaTime;

    while (this.accumulator >= timeStep) {
      this.world.step(timeStep, velocityIterations, positionIterations);
      this.accumulator -= timeStep;
    }
  }

  getWorld(): World {
    return this.world;
  }
}
```

### Why Fixed Timestep Matters

```typescript
class FixedTimestepSimulation {
  private accumulator: number = 0;
  private readonly FIXED_DELTA = 1 / 60;
  private readonly MAX_STEPS = 5; // Prevent spiral of death

  update(deltaTime: number): void {
    // Clamp large delta times
    deltaTime = Math.min(deltaTime, this.FIXED_DELTA * this.MAX_STEPS);

    this.accumulator += deltaTime;

    while (this.accumulator >= this.FIXED_DELTA) {
      this.world.step(this.FIXED_DELTA, 8, 3);
      this.accumulator -= this.FIXED_DELTA;
    }

    // Alpha for interpolation (visual smoothing)
    const alpha = this.accumulator / this.FIXED_DELTA;
    this.interpolateRenderPositions(alpha);
  }

  private interpolateRenderPositions(alpha: number): void {
    // Interpolate between previous and current physics positions
    for (const entity of this.entities) {
      entity.renderPosition = {
        x: entity.prevPosition.x * (1 - alpha) + entity.position.x * alpha,
        y: entity.prevPosition.y * (1 - alpha) + entity.position.y * alpha
      };
    }
  }
}
```

---

## Body Types

### Static Bodies

Static bodies never move and have infinite mass. Use for ground, walls, and fixed obstacles.

```typescript
function createStaticPlatform(
  world: World,
  x: number,
  y: number,
  width: number,
  height: number
): Body {
  const body = world.createBody({
    type: 'static',
    position: Vec2(x, y)
  });

  body.createFixture({
    shape: Box(width / 2, height / 2),
    friction: 0.6,
    restitution: 0.0 // No bounce
  });

  return body;
}

// Create ground
const ground = createStaticPlatform(world, 0, -10, 100, 2);
```

### Dynamic Bodies

Dynamic bodies are fully simulated with mass, velocity, and forces.

```typescript
interface DynamicBodyOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  density?: number;
  friction?: number;
  restitution?: number;
  linearDamping?: number;
  angularDamping?: number;
  fixedRotation?: boolean;
  bullet?: boolean; // Enable CCD for fast objects
}

function createDynamicBox(world: World, options: DynamicBodyOptions): Body {
  const {
    x, y, width, height,
    density = 1.0,
    friction = 0.3,
    restitution = 0.1,
    linearDamping = 0.0,
    angularDamping = 0.0,
    fixedRotation = false,
    bullet = false
  } = options;

  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y),
    linearDamping,
    angularDamping,
    fixedRotation,
    bullet // Prevents tunneling for fast-moving objects
  });

  body.createFixture({
    shape: Box(width / 2, height / 2),
    density,
    friction,
    restitution
  });

  return body;
}

// Create a bouncy ball
const ball = world.createBody({
  type: 'dynamic',
  position: Vec2(0, 10),
  bullet: true
});

ball.createFixture({
  shape: Circle(0.5),
  density: 1.0,
  friction: 0.3,
  restitution: 0.8 // Very bouncy
});
```

### Kinematic Bodies

Kinematic bodies move according to velocity but are not affected by forces. Perfect for moving platforms.

```typescript
class MovingPlatform {
  private body: Body;
  private startPos: Vec2;
  private endPos: Vec2;
  private speed: number;
  private progress: number = 0;
  private direction: number = 1;

  constructor(
    world: World,
    start: Vec2,
    end: Vec2,
    width: number,
    height: number,
    speed: number = 2
  ) {
    this.startPos = start;
    this.endPos = end;
    this.speed = speed;

    this.body = world.createBody({
      type: 'kinematic',
      position: start
    });

    this.body.createFixture({
      shape: Box(width / 2, height / 2),
      friction: 1.0 // High friction so objects don't slide off
    });
  }

  update(deltaTime: number): void {
    // Calculate progress along path
    this.progress += this.direction * this.speed * deltaTime;

    if (this.progress >= 1) {
      this.progress = 1;
      this.direction = -1;
    } else if (this.progress <= 0) {
      this.progress = 0;
      this.direction = 1;
    }

    // Calculate target position
    const targetX = this.startPos.x + (this.endPos.x - this.startPos.x) * this.progress;
    const targetY = this.startPos.y + (this.endPos.y - this.startPos.y) * this.progress;

    // Set velocity to reach target (kinematic bodies move via velocity)
    const currentPos = this.body.getPosition();
    this.body.setLinearVelocity(Vec2(
      (targetX - currentPos.x) / deltaTime,
      (targetY - currentPos.y) / deltaTime
    ));
  }
}
```

---

## Shapes and Fixtures

### Circle Shape

The most efficient collision shape.

```typescript
function createCircle(
  world: World,
  x: number,
  y: number,
  radius: number,
  options: FixtureOptions = {}
): Body {
  const body = world.createBody({
    type: options.isStatic ? 'static' : 'dynamic',
    position: Vec2(x, y)
  });

  body.createFixture({
    shape: Circle(radius),
    density: options.density ?? 1.0,
    friction: options.friction ?? 0.3,
    restitution: options.restitution ?? 0.1
  });

  return body;
}

// Circle with offset center (for compound shapes)
const circleWithOffset = Circle(Vec2(1, 0), 0.5); // Offset by (1, 0)
```

### Polygon Shape

Convex polygons with up to 8 vertices (Box2D limitation).

```typescript
// Box (rectangle) - most common polygon
function createBox(
  world: World,
  x: number,
  y: number,
  halfWidth: number,
  halfHeight: number
): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y)
  });

  body.createFixture({
    shape: Box(halfWidth, halfHeight),
    density: 1.0
  });

  return body;
}

// Custom convex polygon
function createTriangle(world: World, x: number, y: number, size: number): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y)
  });

  const vertices = [
    Vec2(0, size),
    Vec2(-size, -size),
    Vec2(size, -size)
  ];

  body.createFixture({
    shape: Polygon(vertices),
    density: 1.0
  });

  return body;
}

// Regular polygon generator
function createRegularPolygon(
  world: World,
  x: number,
  y: number,
  radius: number,
  sides: number
): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y)
  });

  const vertices: Vec2[] = [];
  for (let i = 0; i < Math.min(sides, 8); i++) { // Max 8 vertices
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    vertices.push(Vec2(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius
    ));
  }

  body.createFixture({
    shape: Polygon(vertices),
    density: 1.0
  });

  return body;
}
```

### Edge and Chain Shapes

For static terrain and level geometry.

```typescript
// Single edge (line segment)
function createEdge(world: World, v1: Vec2, v2: Vec2): Body {
  const body = world.createBody({ type: 'static' });

  body.createFixture({
    shape: Edge(v1, v2),
    friction: 0.6
  });

  return body;
}

// Chain shape for terrain
function createTerrain(world: World, points: Vec2[]): Body {
  const body = world.createBody({ type: 'static' });

  body.createFixture({
    shape: Chain(points, false), // false = open chain
    friction: 0.6
  });

  return body;
}

// Generate smooth terrain from heightmap
function createTerrainFromHeightmap(
  world: World,
  heightmap: number[],
  scale: number,
  yOffset: number
): Body {
  const points: Vec2[] = [];

  for (let i = 0; i < heightmap.length; i++) {
    points.push(Vec2(i * scale, heightmap[i] + yOffset));
  }

  return createTerrain(world, points);
}

// Loop chain (closed shape, for static concave shapes)
function createClosedChain(world: World, points: Vec2[]): Body {
  const body = world.createBody({ type: 'static' });

  body.createFixture({
    shape: Chain(points, true), // true = closed loop
    friction: 0.6
  });

  return body;
}
```

### Compound Shapes

Create complex shapes using multiple fixtures.

```typescript
// Car body with multiple shapes
function createCarBody(world: World, x: number, y: number): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y)
  });

  // Main chassis
  body.createFixture({
    shape: Box(2, 0.5),
    density: 1.0
  });

  // Hood (front)
  body.createFixture({
    shape: Polygon([
      Vec2(2, 0.5),
      Vec2(2.5, 0.5),
      Vec2(2.5, 0),
      Vec2(2, -0.5)
    ]),
    density: 0.5
  });

  // Trunk (rear)
  body.createFixture({
    shape: Box(0.5, 0.25, Vec2(-1.75, 0.25), 0),
    density: 0.5
  });

  return body;
}

// Capsule shape (common for characters)
function createCapsule(
  world: World,
  x: number,
  y: number,
  width: number,
  height: number
): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y),
    fixedRotation: true // Characters usually don't rotate
  });

  const radius = width / 2;
  const boxHeight = height - width;

  // Middle rectangle
  if (boxHeight > 0) {
    body.createFixture({
      shape: Box(radius * 0.9, boxHeight / 2), // Slightly narrower
      density: 1.0,
      friction: 0
    });
  }

  // Top circle
  body.createFixture({
    shape: Circle(Vec2(0, boxHeight / 2), radius),
    density: 1.0,
    friction: 0
  });

  // Bottom circle
  body.createFixture({
    shape: Circle(Vec2(0, -boxHeight / 2), radius),
    density: 1.0,
    friction: 1.0 // High friction on feet
  });

  return body;
}
```

---

## Joints

### Revolute Joint (Hinge)

Allows rotation around a single point.

```typescript
// Simple hinge door
function createDoor(world: World): { frame: Body; door: Body } {
  // Frame (static)
  const frame = world.createBody({
    type: 'static',
    position: Vec2(0, 0)
  });
  frame.createFixture({ shape: Box(0.1, 2) });

  // Door panel (dynamic)
  const door = world.createBody({
    type: 'dynamic',
    position: Vec2(1, 0)
  });
  door.createFixture({
    shape: Box(1, 2),
    density: 1.0
  });

  // Hinge joint
  world.createJoint(RevoluteJoint({
    bodyA: frame,
    bodyB: door,
    localAnchorA: Vec2(0.1, 0),
    localAnchorB: Vec2(-1, 0),
    enableLimit: true,
    lowerAngle: 0,
    upperAngle: Math.PI / 2, // 90 degrees
    enableMotor: false
  }));

  return { frame, door };
}

// Motorized wheel
function createMotorizedWheel(
  world: World,
  chassis: Body,
  localAnchor: Vec2,
  wheelRadius: number
): { wheel: Body; joint: RevoluteJoint } {
  const worldAnchor = chassis.getWorldPoint(localAnchor);

  const wheel = world.createBody({
    type: 'dynamic',
    position: worldAnchor
  });

  wheel.createFixture({
    shape: Circle(wheelRadius),
    density: 1.0,
    friction: 0.9 // High friction for grip
  });

  const joint = world.createJoint(RevoluteJoint({
    bodyA: chassis,
    bodyB: wheel,
    localAnchorA: localAnchor,
    localAnchorB: Vec2(0, 0),
    enableMotor: true,
    motorSpeed: 0,
    maxMotorTorque: 50
  }));

  return { wheel, joint };
}
```

### Distance Joint

Maintains distance between two points.

```typescript
// Rope/spring connection
function createRope(
  world: World,
  bodyA: Body,
  bodyB: Body,
  anchorA: Vec2,
  anchorB: Vec2,
  options: {
    stiffness?: number;
    damping?: number;
  } = {}
): DistanceJoint {
  const worldAnchorA = bodyA.getWorldPoint(anchorA);
  const worldAnchorB = bodyB.getWorldPoint(anchorB);
  const length = Vec2.distance(worldAnchorA, worldAnchorB);

  return world.createJoint(DistanceJoint({
    bodyA,
    bodyB,
    localAnchorA: anchorA,
    localAnchorB: anchorB,
    length,
    stiffness: options.stiffness ?? 0, // 0 = rigid
    damping: options.damping ?? 0
  }));
}

// Soft spring
const softSpring = world.createJoint(DistanceJoint({
  bodyA,
  bodyB,
  localAnchorA: Vec2(0, 0),
  localAnchorB: Vec2(0, 0),
  length: 2,
  stiffness: 4, // Spring frequency in Hz
  damping: 0.5 // Damping ratio
}));
```

### Prismatic Joint (Slider)

Allows translation along an axis.

```typescript
// Elevator platform
function createElevator(world: World): {
  platform: Body;
  joint: PrismaticJoint;
} {
  // Shaft (static anchor)
  const shaft = world.createBody({
    type: 'static',
    position: Vec2(0, 0)
  });

  // Platform (dynamic)
  const platform = world.createBody({
    type: 'dynamic',
    position: Vec2(0, 0)
  });
  platform.createFixture({
    shape: Box(2, 0.3),
    density: 1.0
  });

  const joint = world.createJoint(PrismaticJoint({
    bodyA: shaft,
    bodyB: platform,
    localAnchorA: Vec2(0, 0),
    localAnchorB: Vec2(0, 0),
    localAxisA: Vec2(0, 1), // Vertical axis
    enableLimit: true,
    lowerTranslation: -5,
    upperTranslation: 5,
    enableMotor: true,
    motorSpeed: 2,
    maxMotorForce: 100
  }));

  return { platform, joint };
}

// Piston
function createPiston(world: World, anchor: Body, piston: Body): PrismaticJoint {
  return world.createJoint(PrismaticJoint({
    bodyA: anchor,
    bodyB: piston,
    localAnchorA: Vec2(0, 0),
    localAnchorB: Vec2(0, 0),
    localAxisA: Vec2(1, 0), // Horizontal
    enableLimit: true,
    lowerTranslation: 0,
    upperTranslation: 3,
    enableMotor: true,
    motorSpeed: 5,
    maxMotorForce: 200
  }));
}
```

### Wheel Joint

Combines revolute and prismatic - ideal for vehicle suspension.

```typescript
function createVehicle(world: World, x: number, y: number): Vehicle {
  // Chassis
  const chassis = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y)
  });
  chassis.createFixture({
    shape: Box(3, 0.5),
    density: 1.0
  });

  // Create wheels with suspension
  const wheelPositions = [
    Vec2(-2, -0.5),
    Vec2(2, -0.5)
  ];

  const wheels: Body[] = [];
  const joints: WheelJoint[] = [];

  for (const pos of wheelPositions) {
    const wheelPos = Vec2(x + pos.x, y + pos.y);

    const wheel = world.createBody({
      type: 'dynamic',
      position: wheelPos
    });
    wheel.createFixture({
      shape: Circle(0.5),
      density: 1.0,
      friction: 0.9
    });

    const joint = world.createJoint(WheelJoint({
      bodyA: chassis,
      bodyB: wheel,
      localAnchorA: pos,
      localAnchorB: Vec2(0, 0),
      localAxisA: Vec2(0, 1), // Suspension direction
      enableMotor: true,
      motorSpeed: 0,
      maxMotorTorque: 20,
      stiffness: 4.0, // Suspension stiffness
      damping: 0.7 // Suspension damping
    }));

    wheels.push(wheel);
    joints.push(joint);
  }

  return { chassis, wheels, joints };
}

interface Vehicle {
  chassis: Body;
  wheels: Body[];
  joints: WheelJoint[];
}
```

### Weld Joint

Rigidly connects two bodies.

```typescript
// Breakable weld joint
class BreakableJoint {
  private joint: WeldJoint | null;
  private breakForce: number;

  constructor(
    world: World,
    bodyA: Body,
    bodyB: Body,
    anchor: Vec2,
    breakForce: number
  ) {
    this.breakForce = breakForce;

    this.joint = world.createJoint(WeldJoint({
      bodyA,
      bodyB,
      localAnchorA: bodyA.getLocalPoint(anchor),
      localAnchorB: bodyB.getLocalPoint(anchor)
    }));
  }

  update(): void {
    if (!this.joint) return;

    const reactionForce = this.joint.getReactionForce(60); // At 60 Hz
    const forceMagnitude = reactionForce.length();

    if (forceMagnitude > this.breakForce) {
      this.joint.getBodyA().getWorld().destroyJoint(this.joint);
      this.joint = null;
    }
  }

  isIntact(): boolean {
    return this.joint !== null;
  }
}
```

---

## Collision Detection and Callbacks

### Contact Listener

```typescript
class GameContactListener {
  private world: World;

  constructor(world: World) {
    this.world = world;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.world.on('begin-contact', (contact) => {
      this.onBeginContact(contact);
    });

    this.world.on('end-contact', (contact) => {
      this.onEndContact(contact);
    });

    this.world.on('pre-solve', (contact, oldManifold) => {
      this.onPreSolve(contact, oldManifold);
    });

    this.world.on('post-solve', (contact, impulse) => {
      this.onPostSolve(contact, impulse);
    });
  }

  private onBeginContact(contact: Contact): void {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();

    const userDataA = fixtureA.getBody().getUserData() as any;
    const userDataB = fixtureB.getBody().getUserData() as any;

    // Example: Player touches coin
    if (this.isType(userDataA, 'player') && this.isType(userDataB, 'coin')) {
      this.collectCoin(userDataB);
    } else if (this.isType(userDataB, 'player') && this.isType(userDataA, 'coin')) {
      this.collectCoin(userDataA);
    }

    // Example: Player lands on ground
    if (this.isType(userDataA, 'player') && this.isGroundSensor(fixtureA)) {
      userDataA.entity.onLand();
    }
  }

  private onEndContact(contact: Contact): void {
    // Handle contact end (e.g., player leaves ground)
  }

  private onPreSolve(contact: Contact, oldManifold: Manifold): void {
    // Can disable contact before physics solve
    // Example: One-way platform
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();

    if (this.isOneWayPlatform(fixtureA) || this.isOneWayPlatform(fixtureB)) {
      const platform = this.isOneWayPlatform(fixtureA) ? fixtureA : fixtureB;
      const other = platform === fixtureA ? fixtureB : fixtureA;

      const platformBody = platform.getBody();
      const otherBody = other.getBody();

      // Disable if object is below platform or moving up
      const platformY = platformBody.getPosition().y;
      const otherY = otherBody.getPosition().y;
      const velocity = otherBody.getLinearVelocity();

      if (otherY < platformY - 0.5 || velocity.y > 0) {
        contact.setEnabled(false);
      }
    }
  }

  private onPostSolve(contact: Contact, impulse: ContactImpulse): void {
    // Get collision intensity for sound/effects
    const normalImpulses = impulse.normalImpulses;
    const maxImpulse = Math.max(...normalImpulses);

    if (maxImpulse > 5) {
      // Strong collision - play sound, spawn particles
      const worldManifold = contact.getWorldManifold(null);
      if (worldManifold) {
        this.playCollisionEffect(worldManifold.points[0], maxImpulse);
      }
    }
  }

  private isType(userData: any, type: string): boolean {
    return userData && userData.type === type;
  }

  private isOneWayPlatform(fixture: Fixture): boolean {
    const userData = fixture.getUserData() as any;
    return userData && userData.oneWay === true;
  }

  private isGroundSensor(fixture: Fixture): boolean {
    const userData = fixture.getUserData() as any;
    return userData && userData.sensor === 'ground';
  }
}
```

### Collision Filtering

```typescript
// Category bits for collision filtering
const Category = {
  PLAYER: 0x0001,
  ENEMY: 0x0002,
  GROUND: 0x0004,
  PROJECTILE: 0x0008,
  SENSOR: 0x0010,
  PICKUP: 0x0020,
  DEBRIS: 0x0040
};

// What each category collides with
const Mask = {
  PLAYER: Category.GROUND | Category.ENEMY | Category.PICKUP | Category.SENSOR,
  ENEMY: Category.GROUND | Category.PLAYER | Category.PROJECTILE,
  GROUND: Category.PLAYER | Category.ENEMY | Category.PROJECTILE | Category.DEBRIS,
  PROJECTILE: Category.GROUND | Category.ENEMY,
  PICKUP: Category.PLAYER,
  DEBRIS: Category.GROUND | Category.DEBRIS
};

function createPlayerBody(world: World, x: number, y: number): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y),
    fixedRotation: true
  });

  body.createFixture({
    shape: Box(0.4, 0.9),
    density: 1.0,
    friction: 0.0,
    filterCategoryBits: Category.PLAYER,
    filterMaskBits: Mask.PLAYER,
    filterGroupIndex: 0 // 0 = use category/mask
  });

  return body;
}

// Group index for special cases:
// Positive: Always collide with same group
// Negative: Never collide with same group
// Zero: Use category/mask filtering

// Example: Team members that don't collide with each other
function createTeamMember(world: World, teamId: number): Body {
  const body = world.createBody({ type: 'dynamic', position: Vec2(0, 0) });

  body.createFixture({
    shape: Circle(0.5),
    density: 1.0,
    filterGroupIndex: -teamId // Negative = no collision within team
  });

  return body;
}
```

### Raycasting and Queries

```typescript
class PhysicsQueries {
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  // Raycast: Find first hit
  raycastFirst(
    start: Vec2,
    end: Vec2,
    filterMask: number = 0xFFFF
  ): RaycastResult | null {
    let closestResult: RaycastResult | null = null;
    let closestFraction = 1;

    this.world.rayCast(start, end, (fixture, point, normal, fraction) => {
      // Check filter
      if (!(fixture.getFilterCategoryBits() & filterMask)) {
        return -1; // Continue
      }

      if (fraction < closestFraction) {
        closestFraction = fraction;
        closestResult = {
          fixture,
          point: Vec2(point.x, point.y),
          normal: Vec2(normal.x, normal.y),
          fraction
        };
      }

      return fraction; // Clip ray to this hit
    });

    return closestResult;
  }

  // Raycast: Find all hits
  raycastAll(
    start: Vec2,
    end: Vec2,
    filterMask: number = 0xFFFF
  ): RaycastResult[] {
    const results: RaycastResult[] = [];

    this.world.rayCast(start, end, (fixture, point, normal, fraction) => {
      if (!(fixture.getFilterCategoryBits() & filterMask)) {
        return -1;
      }

      results.push({
        fixture,
        point: Vec2(point.x, point.y),
        normal: Vec2(normal.x, normal.y),
        fraction
      });

      return 1; // Continue ray
    });

    // Sort by distance
    results.sort((a, b) => a.fraction - b.fraction);
    return results;
  }

  // AABB Query: Find all fixtures in area
  queryAABB(min: Vec2, max: Vec2): Fixture[] {
    const results: Fixture[] = [];

    this.world.queryAABB(AABB(min, max), (fixture) => {
      results.push(fixture);
      return true; // Continue query
    });

    return results;
  }

  // Point Query: Find fixture at point
  queryPoint(point: Vec2): Fixture | null {
    let result: Fixture | null = null;

    this.world.queryAABB(
      AABB(
        Vec2(point.x - 0.001, point.y - 0.001),
        Vec2(point.x + 0.001, point.y + 0.001)
      ),
      (fixture) => {
        if (fixture.testPoint(point)) {
          result = fixture;
          return false; // Stop query
        }
        return true;
      }
    );

    return result;
  }
}

interface RaycastResult {
  fixture: Fixture;
  point: Vec2;
  normal: Vec2;
  fraction: number;
}
```

---

## Forces and Impulses

```typescript
class PhysicsController {
  // Apply continuous force (e.g., thrust, wind)
  applyForce(body: Body, force: Vec2, worldPoint?: Vec2): void {
    if (worldPoint) {
      body.applyForce(force, worldPoint, true);
    } else {
      body.applyForceToCenter(force, true);
    }
  }

  // Apply instant impulse (e.g., jump, explosion)
  applyImpulse(body: Body, impulse: Vec2, worldPoint?: Vec2): void {
    if (worldPoint) {
      body.applyLinearImpulse(impulse, worldPoint, true);
    } else {
      body.applyLinearImpulse(impulse, body.getWorldCenter(), true);
    }
  }

  // Apply torque (rotation force)
  applyTorque(body: Body, torque: number): void {
    body.applyTorque(torque, true);
  }

  // Apply angular impulse
  applyAngularImpulse(body: Body, impulse: number): void {
    body.applyAngularImpulse(impulse, true);
  }

  // Set velocity directly (use sparingly)
  setVelocity(body: Body, velocity: Vec2): void {
    body.setLinearVelocity(velocity);
  }

  // Add to velocity
  addVelocity(body: Body, velocity: Vec2): void {
    const current = body.getLinearVelocity();
    body.setLinearVelocity(Vec2(
      current.x + velocity.x,
      current.y + velocity.y
    ));
  }
}

// Example: Character movement
class CharacterPhysics {
  private body: Body;
  private moveForce: number = 50;
  private jumpImpulse: number = 10;
  private maxSpeed: number = 8;

  move(direction: number): void {
    const velocity = this.body.getLinearVelocity();

    // Only apply force if under max speed
    if (Math.abs(velocity.x) < this.maxSpeed) {
      this.body.applyForceToCenter(
        Vec2(this.moveForce * direction, 0),
        true
      );
    }
  }

  jump(): void {
    const velocity = this.body.getLinearVelocity();
    this.body.setLinearVelocity(Vec2(velocity.x, this.jumpImpulse));
  }

  // Smooth stop
  stop(): void {
    const velocity = this.body.getLinearVelocity();
    this.body.setLinearVelocity(Vec2(velocity.x * 0.9, velocity.y));
  }
}
```

---

## Debug Rendering

```typescript
class Box2DDebugDraw {
  private ctx: CanvasRenderingContext2D;
  private scale: number;
  private offset: Vec2;

  constructor(
    ctx: CanvasRenderingContext2D,
    scale: number = 30,
    offset: Vec2 = Vec2(400, 300)
  ) {
    this.ctx = ctx;
    this.scale = scale;
    this.offset = offset;
  }

  draw(world: World): void {
    // Draw bodies
    for (let body = world.getBodyList(); body; body = body.getNext()) {
      this.drawBody(body);
    }

    // Draw joints
    for (let joint = world.getJointList(); joint; joint = joint.getNext()) {
      this.drawJoint(joint);
    }

    // Draw contacts
    for (let contact = world.getContactList(); contact; contact = contact.getNext()) {
      if (contact.isTouching()) {
        this.drawContact(contact);
      }
    }
  }

  private drawBody(body: Body): void {
    const pos = body.getPosition();
    const angle = body.getAngle();

    this.ctx.save();
    this.ctx.translate(
      this.offset.x + pos.x * this.scale,
      this.offset.y - pos.y * this.scale
    );
    this.ctx.rotate(-angle);

    // Color based on body type
    if (body.isStatic()) {
      this.ctx.strokeStyle = '#00ff00';
      this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
    } else if (body.isKinematic()) {
      this.ctx.strokeStyle = '#0000ff';
      this.ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
    } else if (body.isAwake()) {
      this.ctx.strokeStyle = '#ff0000';
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    } else {
      this.ctx.strokeStyle = '#999999';
      this.ctx.fillStyle = 'rgba(150, 150, 150, 0.2)';
    }

    this.ctx.lineWidth = 2;

    for (let fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
      this.drawShape(fixture.getShape());
    }

    this.ctx.restore();
  }

  private drawShape(shape: Shape): void {
    const type = shape.getType();

    if (type === 'circle') {
      const circle = shape as CircleShape;
      const center = circle.getCenter();
      const radius = circle.getRadius() * this.scale;

      this.ctx.beginPath();
      this.ctx.arc(center.x * this.scale, -center.y * this.scale, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Draw radius line to show rotation
      this.ctx.beginPath();
      this.ctx.moveTo(center.x * this.scale, -center.y * this.scale);
      this.ctx.lineTo(center.x * this.scale + radius, -center.y * this.scale);
      this.ctx.stroke();
    } else if (type === 'polygon') {
      const polygon = shape as PolygonShape;

      this.ctx.beginPath();
      for (let i = 0; i < polygon.m_count; i++) {
        const v = polygon.getVertex(i);
        if (i === 0) {
          this.ctx.moveTo(v.x * this.scale, -v.y * this.scale);
        } else {
          this.ctx.lineTo(v.x * this.scale, -v.y * this.scale);
        }
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    } else if (type === 'edge') {
      const edge = shape as EdgeShape;
      this.ctx.beginPath();
      this.ctx.moveTo(edge.m_vertex1.x * this.scale, -edge.m_vertex1.y * this.scale);
      this.ctx.lineTo(edge.m_vertex2.x * this.scale, -edge.m_vertex2.y * this.scale);
      this.ctx.stroke();
    }
  }

  private drawJoint(joint: Joint): void {
    const anchorA = joint.getAnchorA();
    const anchorB = joint.getAnchorB();

    this.ctx.strokeStyle = '#ffff00';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);

    this.ctx.beginPath();
    this.ctx.moveTo(
      this.offset.x + anchorA.x * this.scale,
      this.offset.y - anchorA.y * this.scale
    );
    this.ctx.lineTo(
      this.offset.x + anchorB.x * this.scale,
      this.offset.y - anchorB.y * this.scale
    );
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  private drawContact(contact: Contact): void {
    const worldManifold = contact.getWorldManifold(null);
    if (!worldManifold) return;

    this.ctx.fillStyle = '#ff8800';

    for (const point of worldManifold.points) {
      this.ctx.beginPath();
      this.ctx.arc(
        this.offset.x + point.x * this.scale,
        this.offset.y - point.y * this.scale,
        3, 0, Math.PI * 2
      );
      this.ctx.fill();
    }
  }
}
```

---

## Best Practices

### Performance Tips

```typescript
// 1. Use appropriate body counts
// - Aim for < 200 dynamic bodies for stable 60 FPS
// - Static bodies are much cheaper

// 2. Simplify collision shapes
// - Circles are fastest
// - Polygons should have < 8 vertices
// - Chain shapes for static terrain

// 3. Enable sleeping
const world = new World({
  gravity: Vec2(0, -10),
  allowSleep: true
});

// 4. Use sensors for triggers
function createTriggerZone(world: World, x: number, y: number, width: number, height: number): Body {
  const body = world.createBody({
    type: 'static',
    position: Vec2(x, y)
  });

  body.createFixture({
    shape: Box(width / 2, height / 2),
    isSensor: true // No physical response, only detection
  });

  return body;
}

// 5. Object pooling for frequently created/destroyed bodies
class BodyPool {
  private pool: Body[] = [];
  private world: World;

  acquire(): Body {
    if (this.pool.length > 0) {
      const body = this.pool.pop()!;
      body.setActive(true);
      return body;
    }
    return this.createNewBody();
  }

  release(body: Body): void {
    body.setActive(false);
    body.setLinearVelocity(Vec2(0, 0));
    body.setAngularVelocity(0);
    this.pool.push(body);
  }
}
```

### Common Pitfalls

```typescript
// 1. Tunneling: Fast objects passing through thin walls
// Solution: Enable bullet flag
const bullet = world.createBody({
  type: 'dynamic',
  bullet: true // Enable CCD
});

// 2. Jittery stacking
// Solution: Increase position iterations
world.step(1/60, 8, 6); // More position iterations

// 3. Objects getting stuck on tile edges
// Solution: Use chain shapes or add ghost vertices
const chain = Chain(points, false);
chain.setPrevVertex(ghostPrevPoint);
chain.setNextVertex(ghostNextPoint);

// 4. Characters sliding on slopes
// Solution: Use foot sensors and apply counter-force
function handleSlope(body: Body, groundNormal: Vec2): void {
  const slopeAngle = Math.atan2(groundNormal.x, groundNormal.y);
  if (Math.abs(slopeAngle) > 0.1) {
    // Apply friction-like force along slope
    const velocity = body.getLinearVelocity();
    if (Math.abs(velocity.x) < 0.1) {
      body.setLinearVelocity(Vec2(0, velocity.y));
    }
  }
}
```

---

## Summary

Box2D is a powerful and mature physics engine that serves as the foundation for countless 2D games. Key takeaways:

- **World Setup**: Use fixed timestep, appropriate gravity, and enable sleeping
- **Body Types**: Static for immovable, Dynamic for simulated, Kinematic for scripted movement
- **Shapes**: Choose simplest shape that fits; circles are fastest
- **Joints**: Connect bodies for complex mechanisms
- **Collision Filtering**: Use categories and masks for efficient filtering
- **Performance**: Keep body counts reasonable, use sensors for triggers

With these fundamentals, you can create everything from simple platformers to complex physics puzzles.

---

## Further Reading

- [Box2D Official Manual](https://box2d.org/documentation/)
- [Planck.js Documentation](https://piqnt.com/planck.js/)
- [iforce2d Box2D Tutorials](https://www.iforce2d.net/b2dtut/)
- [Game Physics Engine Development by Ian Millington](https://www.amazon.com/Game-Physics-Engine-Development-Commercial-Grade/dp/0123819768)
