---
title: 2D Physics Engine and Platformer Games
description: "Master 2D game physics: Box2D principles, platformer physics, and collision response"
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - 2D physics
  - Box2D
  - platformer
  - collision
status: imported
origin: old/src/content/docs/gamedev/2d-physics.en.md
divergence: 0.187
issues: []
legacy:
  category: GameDev
  subcategory: 2D
  order: 27
  lastUpdated: 2026-01-07
---

## Introduction

2D physics simulation is a cornerstone of game development, enabling realistic movement, collisions, and interactions between game objects. From classic platformers like Super Mario to modern physics puzzlers like Angry Birds, understanding physics engines is essential for creating engaging gameplay.

We cover the fundamentals of 2D physics engines, with a focus on Box2D architecture, platformer-specific physics, collision detection and response, and practical implementation techniques.

### Why Use a Physics Engine?

Physics engines handle complex mathematical calculations that would be tedious to implement manually:

- **Rigid body dynamics**: Velocity, acceleration, forces, and torque
- **Collision detection**: Determining when objects intersect
- **Collision response**: Calculating realistic reactions to collisions
- **Constraint solving**: Joints, motors, and other connections between bodies

Popular 2D physics libraries include:

| Library | Language | Notable Features |
|---------|----------|------------------|
| Box2D | C++ (ports available) | Industry standard, feature-rich |
| Matter.js | JavaScript | Web-native, easy to use |
| Chipmunk2D | C | Lightweight, game-focused |
| Planck.js | JavaScript | Box2D port for web |
| Rapier | Rust/WASM | Modern, high-performance |

---

## Box2D Architecture

Box2D is the most widely used 2D physics engine, originally created by Erin Catto. Its architecture serves as a blueprint for understanding physics simulation.

### Core Components

```
World
  |
  +-- Bodies (Dynamic, Static, Kinematic)
  |     |
  |     +-- Fixtures
  |           |
  |           +-- Shapes (Circle, Polygon, Edge, Chain)
  |           +-- Material Properties (density, friction, restitution)
  |
  +-- Joints (Revolute, Distance, Prismatic, etc.)
  |
  +-- Contact Manager
        |
        +-- Broad Phase (AABB tree)
        +-- Narrow Phase (GJK/SAT)
```

### The Physics World

The world is the container for all physics objects and manages the simulation step.

```typescript
// Box2D-style world setup (using Planck.js syntax)
import { World, Vec2 } from 'planck-js';

class PhysicsWorld {
  private world: World;
  private readonly PIXELS_PER_METER = 30;

  constructor(gravity: Vec2 = Vec2(0, -10)) {
    this.world = new World({
      gravity: gravity
    });
  }

  // Convert pixel coordinates to physics units (meters)
  toPhysics(pixels: number): number {
    return pixels / this.PIXELS_PER_METER;
  }

  // Convert physics units to pixel coordinates
  toPixels(meters: number): number {
    return meters * this.PIXELS_PER_METER;
  }

  // Step the simulation forward
  step(deltaTime: number): void {
    const velocityIterations = 8;
    const positionIterations = 3;

    this.world.step(deltaTime, velocityIterations, positionIterations);
  }

  getWorld(): World {
    return this.world;
  }
}
```

### Understanding Iterations

The physics solver uses iterations to resolve constraints:

- **Velocity iterations**: More iterations = more accurate velocity resolution, important for stacking
- **Position iterations**: More iterations = less body overlap, prevents tunneling

```typescript
// Recommended settings by use case
const iterationPresets = {
  // Fast but less accurate (mobile games)
  lowQuality: { velocity: 4, position: 2 },

  // Balanced (most games)
  standard: { velocity: 8, position: 3 },

  // High accuracy (precision games, complex machinery)
  highQuality: { velocity: 12, position: 4 },

  // Extreme (Rube Goldberg machines, physics puzzles)
  extreme: { velocity: 20, position: 8 }
};
```

---

## Body Types

Box2D defines three types of bodies, each with distinct behavior:

### Static Bodies

Static bodies never move and have infinite mass. Perfect for ground, walls, and immovable platforms.

```typescript
import { World, Body, Box, Vec2 } from 'planck-js';

function createGround(world: World): Body {
  // Static bodies are created with no type specification (default)
  // or explicitly with type: 'static'
  const ground = world.createBody({
    type: 'static',
    position: Vec2(0, -10)
  });

  // Add a box fixture
  ground.createFixture({
    shape: Box(50, 1), // half-width, half-height
    friction: 0.6
  });

  return ground;
}
```

### Dynamic Bodies

Dynamic bodies are fully simulated with mass, velocity, and forces.

```typescript
interface DynamicBodyConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  density?: number;
  friction?: number;
  restitution?: number;
}

function createDynamicBox(world: World, config: DynamicBodyConfig): Body {
  const {
    x, y, width, height,
    density = 1.0,
    friction = 0.3,
    restitution = 0.1
  } = config;

  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y),
    linearDamping: 0.1,  // Air resistance
    angularDamping: 0.1, // Rotational damping
    fixedRotation: false // Allow rotation
  });

  body.createFixture({
    shape: Box(width / 2, height / 2),
    density,
    friction,
    restitution // Bounciness (0 = no bounce, 1 = perfect bounce)
  });

  return body;
}
```

### Kinematic Bodies

Kinematic bodies move according to their velocity but are not affected by forces. Ideal for moving platforms and elevators.

```typescript
class MovingPlatform {
  private body: Body;
  private startPos: Vec2;
  private endPos: Vec2;
  private speed: number;
  private direction: number = 1;

  constructor(world: World, start: Vec2, end: Vec2, speed: number = 2) {
    this.startPos = start;
    this.endPos = end;
    this.speed = speed;

    this.body = world.createBody({
      type: 'kinematic',
      position: start
    });

    this.body.createFixture({
      shape: Box(2, 0.5),
      friction: 1.0 // High friction so player doesn't slide
    });
  }

  update(): void {
    const pos = this.body.getPosition();
    const target = this.direction > 0 ? this.endPos : this.startPos;

    // Calculate direction to target
    const diff = Vec2.sub(target, pos);
    const distance = diff.length();

    if (distance < 0.1) {
      // Reached target, reverse direction
      this.direction *= -1;
    } else {
      // Move towards target
      const velocity = Vec2.mul(diff.clamp(1), this.speed);
      this.body.setLinearVelocity(velocity);
    }
  }
}
```

---

## Collision Shapes

### Circle Shape

The simplest and most efficient collision shape.

```typescript
function createBall(world: World, x: number, y: number, radius: number): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y),
    bullet: true // Enable CCD for fast-moving objects
  });

  body.createFixture({
    shape: Circle(radius),
    density: 1.0,
    friction: 0.3,
    restitution: 0.8 // Bouncy ball
  });

  return body;
}
```

### Polygon Shape

Convex polygons with up to 8 vertices (Box2D limit).

```typescript
import { Polygon, Vec2 } from 'planck-js';

// Triangle
function createTriangle(world: World, x: number, y: number, size: number): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y)
  });

  const vertices = [
    Vec2(0, size),           // Top
    Vec2(-size, -size),      // Bottom-left
    Vec2(size, -size)        // Bottom-right
  ];

  body.createFixture({
    shape: Polygon(vertices),
    density: 1.0
  });

  return body;
}

// Hexagon
function createHexagon(world: World, x: number, y: number, radius: number): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y)
  });

  const vertices: Vec2[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
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

For static terrain and boundaries.

```typescript
import { Edge, Chain, Vec2 } from 'planck-js';

// Single edge (line segment)
function createEdge(world: World, v1: Vec2, v2: Vec2): Body {
  const body = world.createBody({
    type: 'static'
  });

  body.createFixture({
    shape: Edge(v1, v2),
    friction: 0.6
  });

  return body;
}

// Chain shape for terrain
function createTerrain(world: World, points: Vec2[]): Body {
  const body = world.createBody({
    type: 'static'
  });

  body.createFixture({
    shape: Chain(points, false), // false = open chain, true = closed loop
    friction: 0.6
  });

  return body;
}

// Example: Create a curved hill
function createHill(world: World): Body {
  const points: Vec2[] = [];

  for (let x = -20; x <= 20; x += 0.5) {
    const y = Math.sin(x * 0.3) * 3 - 5;
    points.push(Vec2(x, y));
  }

  return createTerrain(world, points);
}
```

### Compound Shapes

Create complex shapes by combining multiple fixtures.

```typescript
// L-shaped body
function createLShape(world: World, x: number, y: number): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y)
  });

  // Vertical part of L
  body.createFixture({
    shape: Box(0.5, 1.5, Vec2(0, 0.5), 0),
    density: 1.0
  });

  // Horizontal part of L
  body.createFixture({
    shape: Box(1.0, 0.5, Vec2(0.5, -1), 0),
    density: 1.0
  });

  return body;
}

// Character capsule (common for platformers)
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
    fixedRotation: true // Prevent tipping over
  });

  const radius = width / 2;
  const boxHeight = height - width; // Height minus the two semicircles

  // Middle box
  if (boxHeight > 0) {
    body.createFixture({
      shape: Box(radius, boxHeight / 2),
      density: 1.0,
      friction: 0.0 // Low friction on sides
    });
  }

  // Top circle
  body.createFixture({
    shape: Circle(Vec2(0, boxHeight / 2), radius),
    density: 1.0,
    friction: 0.0
  });

  // Bottom circle (foot sensor)
  body.createFixture({
    shape: Circle(Vec2(0, -boxHeight / 2), radius),
    density: 1.0,
    friction: 1.0 // High friction for ground contact
  });

  return body;
}
```

---

## Joint Types

Joints connect bodies together and constrain their relative motion.

### Revolute Joint (Hinge)

Allows rotation around a single point.

```typescript
import { RevoluteJoint, Vec2 } from 'planck-js';

function createRevoluteJoint(
  world: World,
  bodyA: Body,
  bodyB: Body,
  anchor: Vec2
): RevoluteJoint {
  const joint = world.createJoint(RevoluteJoint({
    bodyA,
    bodyB,
    localAnchorA: bodyA.getLocalPoint(anchor),
    localAnchorB: bodyB.getLocalPoint(anchor),
    enableMotor: false,
    motorSpeed: 0,
    maxMotorTorque: 0,
    enableLimit: false,
    lowerAngle: -Math.PI / 4,
    upperAngle: Math.PI / 4
  }));

  return joint;
}

// Example: Swinging door
function createDoor(world: World): void {
  // Door frame (static)
  const frame = world.createBody({ type: 'static', position: Vec2(0, 0) });
  frame.createFixture({ shape: Box(0.1, 2) });

  // Door panel (dynamic)
  const door = world.createBody({ type: 'dynamic', position: Vec2(1, 0) });
  door.createFixture({ shape: Box(1, 2), density: 1.0 });

  // Hinge at the edge of the door
  const joint = world.createJoint(RevoluteJoint({
    bodyA: frame,
    bodyB: door,
    localAnchorA: Vec2(0.1, 0),
    localAnchorB: Vec2(-1, 0),
    enableLimit: true,
    lowerAngle: 0,
    upperAngle: Math.PI / 2 // 90 degree swing
  }));
}
```

### Distance Joint (Spring)

Maintains a fixed or elastic distance between two points.

```typescript
import { DistanceJoint, Vec2 } from 'planck-js';

function createSpring(
  world: World,
  bodyA: Body,
  bodyB: Body,
  anchorA: Vec2,
  anchorB: Vec2,
  stiffness: number = 4.0,
  damping: number = 0.5
): DistanceJoint {
  const localAnchorA = bodyA.getLocalPoint(anchorA);
  const localAnchorB = bodyB.getLocalPoint(anchorB);
  const length = Vec2.distance(anchorA, anchorB);

  return world.createJoint(DistanceJoint({
    bodyA,
    bodyB,
    localAnchorA,
    localAnchorB,
    length,
    stiffness,  // Spring stiffness (Hz)
    damping     // Damping ratio (0 = no damping, 1 = critical damping)
  }));
}

// Example: Rope bridge
function createRopeBridge(world: World, segments: number = 10): Body[] {
  const bodies: Body[] = [];
  const segmentWidth = 1.0;
  const startX = -segments / 2 * segmentWidth;

  // Create anchor points (static)
  const leftAnchor = world.createBody({ type: 'static', position: Vec2(startX - 1, 0) });
  const rightAnchor = world.createBody({ type: 'static', position: Vec2(-startX + 1, 0) });

  // Create bridge segments
  for (let i = 0; i < segments; i++) {
    const x = startX + i * segmentWidth;
    const body = world.createBody({
      type: 'dynamic',
      position: Vec2(x, 0)
    });

    body.createFixture({
      shape: Box(segmentWidth / 2, 0.1),
      density: 1.0,
      friction: 0.8
    });

    bodies.push(body);

    // Connect to previous segment
    if (i === 0) {
      createSpring(world, leftAnchor, body,
        leftAnchor.getPosition(), Vec2(x - segmentWidth / 2, 0), 8.0, 0.7);
    } else {
      createSpring(world, bodies[i - 1], body,
        Vec2(bodies[i - 1].getPosition().x + segmentWidth / 2, 0),
        Vec2(x - segmentWidth / 2, 0), 8.0, 0.7);
    }

    // Connect last segment to right anchor
    if (i === segments - 1) {
      createSpring(world, body, rightAnchor,
        Vec2(x + segmentWidth / 2, 0), rightAnchor.getPosition(), 8.0, 0.7);
    }
  }

  return bodies;
}
```

### Prismatic Joint (Slider)

Allows translation along a single axis.

```typescript
import { PrismaticJoint, Vec2 } from 'planck-js';

// Elevator
function createElevator(world: World): { platform: Body; joint: PrismaticJoint } {
  // Shaft (static)
  const shaft = world.createBody({ type: 'static', position: Vec2(0, 0) });

  // Platform (dynamic)
  const platform = world.createBody({
    type: 'dynamic',
    position: Vec2(0, 0)
  });
  platform.createFixture({
    shape: Box(2, 0.3),
    density: 1.0,
    friction: 1.0
  });

  const joint = world.createJoint(PrismaticJoint({
    bodyA: shaft,
    bodyB: platform,
    localAnchorA: Vec2(0, 0),
    localAnchorB: Vec2(0, 0),
    localAxisA: Vec2(0, 1), // Vertical movement
    enableLimit: true,
    lowerTranslation: -5,
    upperTranslation: 5,
    enableMotor: true,
    motorSpeed: 2,
    maxMotorForce: 100
  }));

  return { platform, joint };
}
```

### Wheel Joint

Combines revolute and prismatic joints - perfect for vehicle wheels.

```typescript
import { WheelJoint, Vec2 } from 'planck-js';

function createCar(world: World): { chassis: Body; wheels: Body[] } {
  // Car body
  const chassis = world.createBody({
    type: 'dynamic',
    position: Vec2(0, 2)
  });

  chassis.createFixture({
    shape: Box(2, 0.5),
    density: 1.0
  });

  // Create wheels
  const wheels: Body[] = [];
  const wheelPositions = [Vec2(-1.5, 1.5), Vec2(1.5, 1.5)];

  for (const pos of wheelPositions) {
    const wheel = world.createBody({
      type: 'dynamic',
      position: pos
    });

    wheel.createFixture({
      shape: Circle(0.4),
      density: 1.0,
      friction: 0.9 // High friction for grip
    });

    world.createJoint(WheelJoint({
      bodyA: chassis,
      bodyB: wheel,
      localAnchorA: chassis.getLocalPoint(pos),
      localAnchorB: Vec2(0, 0),
      localAxisA: Vec2(0, 1),
      enableMotor: true,
      motorSpeed: 0,
      maxMotorTorque: 20,
      stiffness: 4.0,
      damping: 0.7
    }));

    wheels.push(wheel);
  }

  return { chassis, wheels };
}
```

---

## Platformer Physics

Platformer games often require physics that "feel good" rather than being physically accurate. We cover common techniques for creating responsive platformer controls.

### Character Controller

```typescript
interface CharacterState {
  isGrounded: boolean;
  isOnWall: boolean;
  wallDirection: number; // -1 left, 0 none, 1 right
  canJump: boolean;
  coyoteTime: number;
  jumpBufferTime: number;
}

class PlatformerCharacter {
  private body: Body;
  private world: World;
  private state: CharacterState;

  // Tunable parameters
  private readonly config = {
    moveSpeed: 8,
    jumpForce: 12,
    airControl: 0.7, // Reduced control in air
    groundAcceleration: 50,
    airAcceleration: 30,
    groundFriction: 10,
    airFriction: 2,
    maxFallSpeed: 20,
    coyoteTimeDuration: 0.1, // Seconds after leaving ground you can still jump
    jumpBufferDuration: 0.1, // Seconds before landing that jump input is remembered
    wallSlideSpeed: 2,
    wallJumpForce: Vec2(10, 12)
  };

  constructor(world: World, x: number, y: number) {
    this.world = world;
    this.state = {
      isGrounded: false,
      isOnWall: false,
      wallDirection: 0,
      canJump: false,
      coyoteTime: 0,
      jumpBufferTime: 0
    };

    this.createBody(x, y);
    this.setupContactListeners();
  }

  private createBody(x: number, y: number): void {
    this.body = this.world.createBody({
      type: 'dynamic',
      position: Vec2(x, y),
      fixedRotation: true,
      gravityScale: 1.0
    });

    // Main body fixture
    this.body.createFixture({
      shape: Box(0.4, 0.9),
      density: 1.0,
      friction: 0.0 // We handle friction manually
    });

    // Foot sensor for ground detection
    const footSensor = this.body.createFixture({
      shape: Box(0.35, 0.1, Vec2(0, -0.95), 0),
      isSensor: true
    });
    footSensor.setUserData({ type: 'footSensor' });

    // Wall sensors
    const leftWallSensor = this.body.createFixture({
      shape: Box(0.1, 0.6, Vec2(-0.45, 0), 0),
      isSensor: true
    });
    leftWallSensor.setUserData({ type: 'wallSensor', direction: -1 });

    const rightWallSensor = this.body.createFixture({
      shape: Box(0.1, 0.6, Vec2(0.45, 0), 0),
      isSensor: true
    });
    rightWallSensor.setUserData({ type: 'wallSensor', direction: 1 });
  }

  private setupContactListeners(): void {
    this.world.on('begin-contact', (contact) => {
      this.handleContactBegin(contact);
    });

    this.world.on('end-contact', (contact) => {
      this.handleContactEnd(contact);
    });
  }

  private handleContactBegin(contact: Contact): void {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();

    const sensorFixture = fixtureA.isSensor() ? fixtureA :
                          fixtureB.isSensor() ? fixtureB : null;

    if (!sensorFixture) return;

    const userData = sensorFixture.getUserData() as any;

    if (userData?.type === 'footSensor') {
      this.state.isGrounded = true;
      this.state.coyoteTime = this.config.coyoteTimeDuration;

      // Check for buffered jump
      if (this.state.jumpBufferTime > 0) {
        this.executeJump();
      }
    }

    if (userData?.type === 'wallSensor') {
      this.state.isOnWall = true;
      this.state.wallDirection = userData.direction;
    }
  }

  private handleContactEnd(contact: Contact): void {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();

    const sensorFixture = fixtureA.isSensor() ? fixtureA :
                          fixtureB.isSensor() ? fixtureB : null;

    if (!sensorFixture) return;

    const userData = sensorFixture.getUserData() as any;

    if (userData?.type === 'footSensor') {
      this.state.isGrounded = false;
    }

    if (userData?.type === 'wallSensor') {
      this.state.isOnWall = false;
      this.state.wallDirection = 0;
    }
  }

  update(dt: number, input: { left: boolean; right: boolean; jump: boolean }): void {
    this.updateTimers(dt);
    this.handleMovement(dt, input);
    this.handleJump(input);
    this.applyGravityModifiers();
    this.clampVelocity();
  }

  private updateTimers(dt: number): void {
    if (!this.state.isGrounded) {
      this.state.coyoteTime = Math.max(0, this.state.coyoteTime - dt);
    }
    this.state.jumpBufferTime = Math.max(0, this.state.jumpBufferTime - dt);
    this.state.canJump = this.state.isGrounded || this.state.coyoteTime > 0;
  }

  private handleMovement(dt: number, input: { left: boolean; right: boolean }): void {
    const velocity = this.body.getLinearVelocity();
    let targetVelX = 0;

    if (input.left) targetVelX -= this.config.moveSpeed;
    if (input.right) targetVelX += this.config.moveSpeed;

    // Apply air control modifier
    const controlMultiplier = this.state.isGrounded ? 1 : this.config.airControl;
    targetVelX *= controlMultiplier;

    // Calculate acceleration
    const acceleration = this.state.isGrounded ?
      this.config.groundAcceleration : this.config.airAcceleration;

    // Smoothly approach target velocity
    const velDiff = targetVelX - velocity.x;
    const accel = Math.sign(velDiff) * Math.min(Math.abs(velDiff), acceleration * dt);

    // Apply friction when no input
    let newVelX = velocity.x + accel;
    if (targetVelX === 0) {
      const friction = this.state.isGrounded ?
        this.config.groundFriction : this.config.airFriction;
      newVelX *= Math.max(0, 1 - friction * dt);
    }

    this.body.setLinearVelocity(Vec2(newVelX, velocity.y));
  }

  private handleJump(input: { jump: boolean }): void {
    if (input.jump) {
      this.state.jumpBufferTime = this.config.jumpBufferDuration;

      if (this.state.canJump) {
        this.executeJump();
      } else if (this.state.isOnWall) {
        this.executeWallJump();
      }
    }
  }

  private executeJump(): void {
    const velocity = this.body.getLinearVelocity();
    this.body.setLinearVelocity(Vec2(velocity.x, this.config.jumpForce));
    this.state.coyoteTime = 0;
    this.state.jumpBufferTime = 0;
  }

  private executeWallJump(): void {
    const jumpDir = -this.state.wallDirection;
    this.body.setLinearVelocity(Vec2(
      this.config.wallJumpForce.x * jumpDir,
      this.config.wallJumpForce.y
    ));
    this.state.isOnWall = false;
  }

  private applyGravityModifiers(): void {
    const velocity = this.body.getLinearVelocity();

    // Wall slide
    if (this.state.isOnWall && velocity.y < 0) {
      const clampedY = Math.max(velocity.y, -this.config.wallSlideSpeed);
      this.body.setLinearVelocity(Vec2(velocity.x, clampedY));
    }
  }

  private clampVelocity(): void {
    const velocity = this.body.getLinearVelocity();
    const clampedY = Math.max(velocity.y, -this.config.maxFallSpeed);
    this.body.setLinearVelocity(Vec2(velocity.x, clampedY));
  }

  getPosition(): Vec2 {
    return this.body.getPosition();
  }

  getState(): CharacterState {
    return { ...this.state };
  }
}
```

### Variable Jump Height

Allow the player to control jump height by how long they hold the button.

```typescript
class VariableJumpController {
  private body: Body;
  private isJumping: boolean = false;
  private jumpHoldTime: number = 0;

  private readonly config = {
    initialJumpVelocity: 15,
    maxJumpHoldTime: 0.2,
    jumpHoldGravityScale: 0.4,
    fallingGravityScale: 2.5,
    normalGravityScale: 1.0
  };

  constructor(body: Body) {
    this.body = body;
  }

  startJump(): void {
    if (this.canJump()) {
      this.isJumping = true;
      this.jumpHoldTime = 0;

      const velocity = this.body.getLinearVelocity();
      this.body.setLinearVelocity(Vec2(velocity.x, this.config.initialJumpVelocity));
    }
  }

  endJump(): void {
    this.isJumping = false;
  }

  update(dt: number, isHoldingJump: boolean): void {
    const velocity = this.body.getLinearVelocity();

    if (this.isJumping && isHoldingJump) {
      this.jumpHoldTime += dt;

      if (this.jumpHoldTime < this.config.maxJumpHoldTime) {
        // Reduced gravity while holding jump and ascending
        this.body.setGravityScale(this.config.jumpHoldGravityScale);
      } else {
        this.isJumping = false;
      }
    } else {
      this.isJumping = false;

      // Increased gravity when falling for snappier feel
      if (velocity.y < 0) {
        this.body.setGravityScale(this.config.fallingGravityScale);
      } else {
        this.body.setGravityScale(this.config.normalGravityScale);
      }
    }
  }

  private canJump(): boolean {
    // Implement ground detection
    return true;
  }
}
```

---

## One-Way Platforms

One-way platforms allow characters to jump through from below but stand on top. This is a common platformer mechanic.

### Pre-Solve Contact Approach

```typescript
class OneWayPlatform {
  private world: World;
  private platforms: Set<Body> = new Set();

  constructor(world: World) {
    this.world = world;
    this.setupPreSolve();
  }

  createPlatform(x: number, y: number, width: number): Body {
    const platform = this.world.createBody({
      type: 'static',
      position: Vec2(x, y)
    });

    const fixture = platform.createFixture({
      shape: Box(width / 2, 0.1),
      friction: 0.8
    });

    fixture.setUserData({ type: 'oneWayPlatform' });
    this.platforms.add(platform);

    return platform;
  }

  private setupPreSolve(): void {
    this.world.on('pre-solve', (contact, oldManifold) => {
      const fixtureA = contact.getFixtureA();
      const fixtureB = contact.getFixtureB();

      const platformFixture = this.isPlatformFixture(fixtureA) ? fixtureA :
                              this.isPlatformFixture(fixtureB) ? fixtureB : null;

      if (!platformFixture) return;

      const otherFixture = platformFixture === fixtureA ? fixtureB : fixtureA;
      const otherBody = otherFixture.getBody();

      // Get the relative velocity
      const velocity = otherBody.getLinearVelocity();

      // Get platform position
      const platformY = platformFixture.getBody().getPosition().y;
      const otherY = otherBody.getPosition().y;

      // Disable collision if:
      // 1. Object is below the platform
      // 2. Object is moving upward
      if (otherY < platformY || velocity.y > 0) {
        contact.setEnabled(false);
      }
    });
  }

  private isPlatformFixture(fixture: Fixture): boolean {
    const userData = fixture.getUserData() as any;
    return userData?.type === 'oneWayPlatform';
  }
}
```

### Drop-Through Platform

Allow players to press down to fall through platforms.

```typescript
class DropThroughPlatform extends OneWayPlatform {
  private droppingBodies: Set<Body> = new Set();
  private dropDuration: number = 0.2;

  enableDrop(body: Body): void {
    this.droppingBodies.add(body);

    // Automatically re-enable collision after duration
    setTimeout(() => {
      this.droppingBodies.delete(body);
    }, this.dropDuration * 1000);
  }

  protected shouldDisableCollision(body: Body, platformY: number): boolean {
    // Also disable if body is currently dropping
    if (this.droppingBodies.has(body)) {
      return true;
    }

    return super.shouldDisableCollision(body, platformY);
  }
}

// Usage in character controller
class PlatformerCharacterWithDrop {
  private character: Body;
  private platform: DropThroughPlatform;

  handleInput(input: { down: boolean; jump: boolean }): void {
    if (input.down && input.jump && this.isOnOneWayPlatform()) {
      this.platform.enableDrop(this.character);
    }
  }

  private isOnOneWayPlatform(): boolean {
    // Check if standing on a one-way platform
    return true;
  }
}
```

---

## Collision Response

### Collision Filtering

Control which objects can collide using categories and masks.

```typescript
// Define collision categories as bit flags
const CollisionCategory = {
  PLAYER: 0x0001,
  ENEMY: 0x0002,
  GROUND: 0x0004,
  PROJECTILE: 0x0008,
  SENSOR: 0x0010,
  PICKUP: 0x0020
} as const;

// Define collision masks (what each category collides with)
const CollisionMask = {
  PLAYER: CollisionCategory.GROUND | CollisionCategory.ENEMY | CollisionCategory.PICKUP,
  ENEMY: CollisionCategory.GROUND | CollisionCategory.PLAYER | CollisionCategory.PROJECTILE,
  GROUND: CollisionCategory.PLAYER | CollisionCategory.ENEMY | CollisionCategory.PROJECTILE,
  PROJECTILE: CollisionCategory.GROUND | CollisionCategory.ENEMY,
  PICKUP: CollisionCategory.PLAYER
} as const;

function createPlayerFixture(body: Body): void {
  body.createFixture({
    shape: Box(0.5, 1),
    density: 1.0,
    filterCategoryBits: CollisionCategory.PLAYER,
    filterMaskBits: CollisionMask.PLAYER,
    filterGroupIndex: 0 // 0 uses category/mask, negative = never collide, positive = always collide
  });
}

function createEnemyFixture(body: Body): void {
  body.createFixture({
    shape: Circle(0.5),
    density: 1.0,
    filterCategoryBits: CollisionCategory.ENEMY,
    filterMaskBits: CollisionMask.ENEMY
  });
}
```

### Contact Events

Handle collision events for game logic.

```typescript
interface CollisionHandler {
  onCollisionStart(bodyA: Body, bodyB: Body, contact: Contact): void;
  onCollisionEnd(bodyA: Body, bodyB: Body, contact: Contact): void;
}

class CollisionManager {
  private world: World;
  private handlers: Map<string, CollisionHandler> = new Map();

  constructor(world: World) {
    this.world = world;
    this.setupListeners();
  }

  registerHandler(typeA: string, typeB: string, handler: CollisionHandler): void {
    const key = this.getKey(typeA, typeB);
    this.handlers.set(key, handler);
  }

  private setupListeners(): void {
    this.world.on('begin-contact', (contact) => {
      const bodyA = contact.getFixtureA().getBody();
      const bodyB = contact.getFixtureB().getBody();

      const typeA = this.getBodyType(bodyA);
      const typeB = this.getBodyType(bodyB);

      const handler = this.handlers.get(this.getKey(typeA, typeB)) ||
                      this.handlers.get(this.getKey(typeB, typeA));

      if (handler) {
        handler.onCollisionStart(bodyA, bodyB, contact);
      }
    });

    this.world.on('end-contact', (contact) => {
      const bodyA = contact.getFixtureA().getBody();
      const bodyB = contact.getFixtureB().getBody();

      const typeA = this.getBodyType(bodyA);
      const typeB = this.getBodyType(bodyB);

      const handler = this.handlers.get(this.getKey(typeA, typeB)) ||
                      this.handlers.get(this.getKey(typeB, typeA));

      if (handler) {
        handler.onCollisionEnd(bodyA, bodyB, contact);
      }
    });
  }

  private getKey(typeA: string, typeB: string): string {
    return `${typeA}:${typeB}`;
  }

  private getBodyType(body: Body): string {
    const userData = body.getUserData() as any;
    return userData?.type || 'unknown';
  }
}

// Example handlers
const playerEnemyHandler: CollisionHandler = {
  onCollisionStart(bodyA, bodyB, contact) {
    const player = bodyA.getUserData()?.type === 'player' ? bodyA : bodyB;
    const enemy = bodyA.getUserData()?.type === 'enemy' ? bodyA : bodyB;

    // Check if player is above enemy (stomp)
    const playerPos = player.getPosition();
    const enemyPos = enemy.getPosition();

    if (playerPos.y > enemyPos.y + 0.5) {
      // Player stomped enemy
      enemy.getUserData()?.onStomped?.();

      // Bounce player
      const vel = player.getLinearVelocity();
      player.setLinearVelocity(Vec2(vel.x, 10));
    } else {
      // Player hit by enemy
      player.getUserData()?.onDamage?.(1);
    }
  },
  onCollisionEnd() {}
};

const playerPickupHandler: CollisionHandler = {
  onCollisionStart(bodyA, bodyB, contact) {
    const pickup = bodyA.getUserData()?.type === 'pickup' ? bodyA : bodyB;
    const player = bodyA.getUserData()?.type === 'player' ? bodyA : bodyB;

    pickup.getUserData()?.onCollect?.(player);
  },
  onCollisionEnd() {}
};
```

### Damage and Knockback

```typescript
interface DamageInfo {
  amount: number;
  knockbackForce: Vec2;
  knockbackDuration: number;
  invincibilityDuration: number;
}

class DamageableEntity {
  private body: Body;
  private health: number;
  private maxHealth: number;
  private isInvincible: boolean = false;
  private isKnockedBack: boolean = false;

  constructor(body: Body, maxHealth: number) {
    this.body = body;
    this.health = maxHealth;
    this.maxHealth = maxHealth;
  }

  takeDamage(info: DamageInfo): void {
    if (this.isInvincible) return;

    this.health = Math.max(0, this.health - info.amount);

    // Apply knockback
    this.applyKnockback(info.knockbackForce, info.knockbackDuration);

    // Start invincibility
    this.startInvincibility(info.invincibilityDuration);

    if (this.health <= 0) {
      this.onDeath();
    }
  }

  private applyKnockback(force: Vec2, duration: number): void {
    this.isKnockedBack = true;
    this.body.setLinearVelocity(force);

    setTimeout(() => {
      this.isKnockedBack = false;
    }, duration * 1000);
  }

  private startInvincibility(duration: number): void {
    this.isInvincible = true;

    setTimeout(() => {
      this.isInvincible = false;
    }, duration * 1000);
  }

  private onDeath(): void {
    // Handle death
  }

  canMove(): boolean {
    return !this.isKnockedBack;
  }
}
```

---

## Physics Debugging

### Debug Renderer

```typescript
class PhysicsDebugRenderer {
  private ctx: CanvasRenderingContext2D;
  private scale: number;
  private offset: Vec2;

  private readonly colors = {
    staticBody: '#00ff00',
    dynamicBody: '#ff0000',
    kinematicBody: '#0000ff',
    sensor: '#ffff00',
    joint: '#ff00ff',
    aabb: '#ffffff33',
    velocity: '#00ffff',
    contact: '#ff8800'
  };

  constructor(ctx: CanvasRenderingContext2D, scale: number = 30) {
    this.ctx = ctx;
    this.scale = scale;
    this.offset = Vec2(ctx.canvas.width / 2, ctx.canvas.height / 2);
  }

  render(world: World): void {
    // Draw all bodies
    for (let body = world.getBodyList(); body; body = body.getNext()) {
      this.drawBody(body);
    }

    // Draw all joints
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

    // Set color based on body type
    const color = body.isStatic() ? this.colors.staticBody :
                  body.isKinematic() ? this.colors.kinematicBody :
                  this.colors.dynamicBody;

    // Draw all fixtures
    for (let fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
      this.drawFixture(fixture, fixture.isSensor() ? this.colors.sensor : color);
    }

    // Draw velocity vector for dynamic bodies
    if (body.isDynamic()) {
      this.drawVelocity(body);
    }

    this.ctx.restore();
  }

  private drawFixture(fixture: Fixture, color: string): void {
    const shape = fixture.getShape();

    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color + '33';
    this.ctx.lineWidth = 2;

    switch (shape.getType()) {
      case 'circle':
        this.drawCircle(shape as CircleShape);
        break;
      case 'polygon':
        this.drawPolygon(shape as PolygonShape);
        break;
      case 'edge':
        this.drawEdge(shape as EdgeShape);
        break;
      case 'chain':
        this.drawChain(shape as ChainShape);
        break;
    }
  }

  private drawCircle(shape: CircleShape): void {
    const center = shape.getCenter();
    const radius = shape.getRadius() * this.scale;

    this.ctx.beginPath();
    this.ctx.arc(
      center.x * this.scale,
      -center.y * this.scale,
      radius,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.stroke();

    // Draw line to show rotation
    this.ctx.beginPath();
    this.ctx.moveTo(center.x * this.scale, -center.y * this.scale);
    this.ctx.lineTo(center.x * this.scale + radius, -center.y * this.scale);
    this.ctx.stroke();
  }

  private drawPolygon(shape: PolygonShape): void {
    const vertices = [];
    for (let i = 0; i < shape.m_count; i++) {
      vertices.push(shape.getVertex(i));
    }

    this.ctx.beginPath();
    this.ctx.moveTo(vertices[0].x * this.scale, -vertices[0].y * this.scale);

    for (let i = 1; i < vertices.length; i++) {
      this.ctx.lineTo(vertices[i].x * this.scale, -vertices[i].y * this.scale);
    }

    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  private drawEdge(shape: EdgeShape): void {
    const v1 = shape.m_vertex1;
    const v2 = shape.m_vertex2;

    this.ctx.beginPath();
    this.ctx.moveTo(v1.x * this.scale, -v1.y * this.scale);
    this.ctx.lineTo(v2.x * this.scale, -v2.y * this.scale);
    this.ctx.stroke();
  }

  private drawChain(shape: ChainShape): void {
    const vertices = shape.m_vertices;

    this.ctx.beginPath();
    this.ctx.moveTo(vertices[0].x * this.scale, -vertices[0].y * this.scale);

    for (let i = 1; i < vertices.length; i++) {
      this.ctx.lineTo(vertices[i].x * this.scale, -vertices[i].y * this.scale);
    }

    this.ctx.stroke();
  }

  private drawVelocity(body: Body): void {
    const vel = body.getLinearVelocity();
    const scale = 0.1;

    this.ctx.strokeStyle = this.colors.velocity;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(vel.x * this.scale * scale, -vel.y * this.scale * scale);
    this.ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(-vel.y, vel.x);
    const headLength = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(vel.x * this.scale * scale, -vel.y * this.scale * scale);
    this.ctx.lineTo(
      vel.x * this.scale * scale - headLength * Math.cos(angle - Math.PI / 6),
      -vel.y * this.scale * scale - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(vel.x * this.scale * scale, -vel.y * this.scale * scale);
    this.ctx.lineTo(
      vel.x * this.scale * scale - headLength * Math.cos(angle + Math.PI / 6),
      -vel.y * this.scale * scale - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
  }

  private drawJoint(joint: Joint): void {
    const anchorA = joint.getAnchorA();
    const anchorB = joint.getAnchorB();

    this.ctx.strokeStyle = this.colors.joint;
    this.ctx.lineWidth = 2;
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
    const manifold = contact.getWorldManifold(null);
    if (!manifold) return;

    this.ctx.fillStyle = this.colors.contact;

    for (const point of manifold.points) {
      this.ctx.beginPath();
      this.ctx.arc(
        this.offset.x + point.x * this.scale,
        this.offset.y - point.y * this.scale,
        5,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    }
  }
}
```

### Performance Profiling

```typescript
class PhysicsProfiler {
  private metrics: {
    stepTime: number[];
    bodyCount: number;
    contactCount: number;
    jointCount: number;
  };

  private readonly sampleSize = 60;

  constructor() {
    this.metrics = {
      stepTime: [],
      bodyCount: 0,
      contactCount: 0,
      jointCount: 0
    };
  }

  beginStep(): number {
    return performance.now();
  }

  endStep(startTime: number, world: World): void {
    const stepTime = performance.now() - startTime;

    this.metrics.stepTime.push(stepTime);
    if (this.metrics.stepTime.length > this.sampleSize) {
      this.metrics.stepTime.shift();
    }

    this.metrics.bodyCount = this.countBodies(world);
    this.metrics.contactCount = this.countContacts(world);
    this.metrics.jointCount = this.countJoints(world);
  }

  private countBodies(world: World): number {
    let count = 0;
    for (let body = world.getBodyList(); body; body = body.getNext()) {
      count++;
    }
    return count;
  }

  private countContacts(world: World): number {
    let count = 0;
    for (let contact = world.getContactList(); contact; contact = contact.getNext()) {
      if (contact.isTouching()) count++;
    }
    return count;
  }

  private countJoints(world: World): number {
    let count = 0;
    for (let joint = world.getJointList(); joint; joint = joint.getNext()) {
      count++;
    }
    return count;
  }

  getAverageStepTime(): number {
    if (this.metrics.stepTime.length === 0) return 0;
    const sum = this.metrics.stepTime.reduce((a, b) => a + b, 0);
    return sum / this.metrics.stepTime.length;
  }

  getReport(): string {
    return `
Physics Profiler Report:
- Average Step Time: ${this.getAverageStepTime().toFixed(2)}ms
- Body Count: ${this.metrics.bodyCount}
- Active Contacts: ${this.metrics.contactCount}
- Joint Count: ${this.metrics.jointCount}
    `.trim();
  }

  renderOverlay(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.fillStyle = '#000000aa';
    ctx.fillRect(x, y, 200, 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.textBaseline = 'top';

    const lines = [
      `Step: ${this.getAverageStepTime().toFixed(2)}ms`,
      `Bodies: ${this.metrics.bodyCount}`,
      `Contacts: ${this.metrics.contactCount}`,
      `Joints: ${this.metrics.jointCount}`
    ];

    lines.forEach((line, i) => {
      ctx.fillText(line, x + 10, y + 10 + i * 20);
    });

    ctx.restore();
  }
}
```

---

## Complete Platformer Example

The following is a complete example bringing together the concepts covered:

```typescript
// Game configuration
const CONFIG = {
  canvas: {
    width: 800,
    height: 600
  },
  physics: {
    gravity: Vec2(0, -25),
    pixelsPerMeter: 30,
    velocityIterations: 8,
    positionIterations: 3
  },
  player: {
    width: 0.8,
    height: 1.6,
    moveSpeed: 8,
    jumpForce: 15,
    maxFallSpeed: 20
  }
};

class PlatformerGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private world: World;
  private player: PlatformerCharacter;
  private debugRenderer: PhysicsDebugRenderer;
  private profiler: PhysicsProfiler;
  private oneWayPlatforms: OneWayPlatform;

  private input = {
    left: false,
    right: false,
    jump: false,
    down: false
  };

  private debugMode = false;
  private lastTime = 0;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.canvas.width = CONFIG.canvas.width;
    this.canvas.height = CONFIG.canvas.height;
    this.ctx = this.canvas.getContext('2d')!;

    this.world = new World({ gravity: CONFIG.physics.gravity });
    this.debugRenderer = new PhysicsDebugRenderer(this.ctx, CONFIG.physics.pixelsPerMeter);
    this.profiler = new PhysicsProfiler();
    this.oneWayPlatforms = new OneWayPlatform(this.world);

    this.createLevel();
    this.createPlayer();
    this.setupInput();
  }

  private createLevel(): void {
    // Ground
    const ground = this.world.createBody({ type: 'static', position: Vec2(0, -8) });
    ground.createFixture({ shape: Box(15, 1), friction: 0.8 });
    ground.setUserData({ type: 'ground' });

    // Platforms
    const platform1 = this.world.createBody({ type: 'static', position: Vec2(-5, -4) });
    platform1.createFixture({ shape: Box(2, 0.3), friction: 0.8 });

    const platform2 = this.world.createBody({ type: 'static', position: Vec2(5, -2) });
    platform2.createFixture({ shape: Box(2, 0.3), friction: 0.8 });

    // One-way platforms
    this.oneWayPlatforms.createPlatform(0, 0, 4);
    this.oneWayPlatforms.createPlatform(-3, 3, 3);
    this.oneWayPlatforms.createPlatform(3, 5, 3);

    // Walls
    const leftWall = this.world.createBody({ type: 'static', position: Vec2(-14, 0) });
    leftWall.createFixture({ shape: Box(1, 10), friction: 0.0 });

    const rightWall = this.world.createBody({ type: 'static', position: Vec2(14, 0) });
    rightWall.createFixture({ shape: Box(1, 10), friction: 0.0 });
  }

  private createPlayer(): void {
    this.player = new PlatformerCharacter(this.world, 0, 5);
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.input.left = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.input.right = true;
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          this.input.jump = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.input.down = true;
          break;
        case 'F1':
          this.debugMode = !this.debugMode;
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.input.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.input.right = false;
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          this.input.jump = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.input.down = false;
          break;
      }
    });
  }

  start(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameLoop(): void {
    const currentTime = performance.now();
    const dt = Math.min((currentTime - this.lastTime) / 1000, 1 / 30);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame(() => this.gameLoop());
  }

  private update(dt: number): void {
    // Update player
    this.player.update(dt, this.input);

    // Step physics
    const stepStart = this.profiler.beginStep();
    this.world.step(
      dt,
      CONFIG.physics.velocityIterations,
      CONFIG.physics.positionIterations
    );
    this.profiler.endStep(stepStart, this.world);

    // Clear contacts
    this.world.clearForces();
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.debugMode) {
      // Debug rendering
      this.debugRenderer.render(this.world);
      this.profiler.renderOverlay(this.ctx, 10, 10);
    } else {
      // Game rendering
      this.renderGame();
    }

    // UI
    this.renderUI();
  }

  private renderGame(): void {
    const ppm = CONFIG.physics.pixelsPerMeter;
    const offsetX = this.canvas.width / 2;
    const offsetY = this.canvas.height / 2;

    // Render all bodies
    for (let body = this.world.getBodyList(); body; body = body.getNext()) {
      const pos = body.getPosition();
      const angle = body.getAngle();
      const userData = body.getUserData() as any;

      this.ctx.save();
      this.ctx.translate(offsetX + pos.x * ppm, offsetY - pos.y * ppm);
      this.ctx.rotate(-angle);

      // Set color based on body type
      if (userData?.type === 'player') {
        this.ctx.fillStyle = '#3498db';
      } else if (body.isStatic()) {
        this.ctx.fillStyle = '#2ecc71';
      } else {
        this.ctx.fillStyle = '#e74c3c';
      }

      // Draw fixtures
      for (let fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
        if (fixture.isSensor()) continue;

        const shape = fixture.getShape();

        if (shape.getType() === 'polygon') {
          const polygon = shape as PolygonShape;
          this.ctx.beginPath();

          for (let i = 0; i < polygon.m_count; i++) {
            const v = polygon.getVertex(i);
            if (i === 0) {
              this.ctx.moveTo(v.x * ppm, -v.y * ppm);
            } else {
              this.ctx.lineTo(v.x * ppm, -v.y * ppm);
            }
          }

          this.ctx.closePath();
          this.ctx.fill();
        } else if (shape.getType() === 'circle') {
          const circle = shape as CircleShape;
          const center = circle.getCenter();

          this.ctx.beginPath();
          this.ctx.arc(
            center.x * ppm,
            -center.y * ppm,
            circle.getRadius() * ppm,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        }
      }

      this.ctx.restore();
    }
  }

  private renderUI(): void {
    const state = this.player.getState();

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    const statusText = [
      `Grounded: ${state.isGrounded}`,
      `On Wall: ${state.isOnWall}`,
      `Can Jump: ${state.canJump}`,
      `Press F1 for debug mode`
    ];

    statusText.forEach((text, i) => {
      this.ctx.fillText(text, 10, this.canvas.height - 80 + i * 18);
    });
  }
}

// Initialize and start game
const game = new PlatformerGame('gameCanvas');
game.start();
```

---

## Best Practices

### Performance Optimization

1. **Use appropriate body types**: Static bodies are cheaper than dynamic
2. **Simplify collision shapes**: Fewer vertices = faster collision detection
3. **Use sensors wisely**: Sensors skip collision response but still detect overlaps
4. **Avoid tiny or huge objects**: Keep sizes within 0.1 to 10 meters
5. **Sleep inactive bodies**: Box2D automatically sleeps static bodies

```typescript
// Enable sleeping for better performance
const body = world.createBody({
  type: 'dynamic',
  position: Vec2(0, 0),
  allowSleep: true // Bodies at rest will sleep
});

// Manually wake a body when needed
body.setAwake(true);
```

### Common Pitfalls

1. **Tunneling**: Fast objects passing through thin walls
   - Solution: Enable CCD (Continuous Collision Detection)

```typescript
const bullet = world.createBody({
  type: 'dynamic',
  bullet: true, // Enable CCD
  position: Vec2(0, 0)
});
```

2. **Jittery stacking**: Objects vibrating when stacked
   - Solution: Increase position iterations

3. **Slippery slopes**: Characters sliding on angled surfaces
   - Solution: Use foot sensors and manual grounding

4. **Ghost vertices**: Characters getting stuck on tile edges
   - Solution: Use chain shapes or edge shapes with ghost vertices

### Unit Conversion

Always work in physics units (meters) internally:

```typescript
class UnitConverter {
  constructor(private pixelsPerMeter: number) {}

  toMeters(pixels: number): number {
    return pixels / this.pixelsPerMeter;
  }

  toPixels(meters: number): number {
    return meters * this.pixelsPerMeter;
  }

  vectorToMeters(pixels: Vec2): Vec2 {
    return Vec2(
      this.toMeters(pixels.x),
      this.toMeters(pixels.y)
    );
  }

  vectorToPixels(meters: Vec2): Vec2 {
    return Vec2(
      this.toPixels(meters.x),
      this.toPixels(meters.y)
    );
  }
}
```

---

## Summary

2D physics engines like Box2D provide powerful tools for creating realistic and engaging game physics. Key takeaways:

- **World Setup**: Configure gravity, iterations, and unit scaling appropriately
- **Body Types**: Choose static, dynamic, or kinematic based on behavior needs
- **Collision Shapes**: Use the simplest shape that represents your object
- **Joints**: Connect bodies with constraints for complex mechanisms
- **Platformer Physics**: Supplement physics with custom controllers for responsive gameplay
- **One-Way Platforms**: Use pre-solve callbacks to selectively disable collisions
- **Collision Response**: Implement filtering and contact listeners for game logic
- **Debugging**: Build visualization tools to understand physics behavior

Remember that good game physics often feel right rather than being physically accurate. Do not hesitate to bend the rules of physics to create a better player experience.

---

## Further Reading

### Documentation
- [Box2D Manual](https://box2d.org/documentation/)
- [Planck.js Documentation](https://piqnt.com/planck.js/)
- [Matter.js Documentation](https://brm.io/matter-js/docs/)

### Books
- "Game Physics Engine Development" by Ian Millington
- "Real-Time Collision Detection" by Christer Ericson

### Articles
- [Building a Better Jump](https://www.youtube.com/watch?v=hG9SzQxaCm8) - GDC Talk
- [2D Platformer Collision Detection](https://www.gamedev.net/tutorials/programming/general-and-gameplay-programming/2d-platformer-collision-detection-r4115/)

### Practice Projects
1. Build a simple physics sandbox with draggable objects
2. Create a platformer character controller with all standard moves
3. Implement a physics puzzle game (like Angry Birds)
4. Build a vehicle with wheel joints and suspension
