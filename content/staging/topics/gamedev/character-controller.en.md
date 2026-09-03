---
title: Game Character Controller Design
description: "Implement smooth character control: kinematic vs dynamic controllers, ground detection, and slopes"
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - character control
  - movement
  - physics
  - game feel
status: imported
origin: old/src/content/docs/gamedev/character-controller.en.md
divergence: 0.2
issues: []
legacy:
  category: GameDev
  subcategory: Physics
  order: 16
  lastUpdated: 2026-01-07
---

Character controllers are the foundation of player interaction in virtually every game. A well-designed character controller creates the responsive, satisfying movement that players expect, while a poorly implemented one can make even the most polished game feel frustrating. This comprehensive guide covers everything you need to know about implementing smooth, professional character controllers, from fundamental physics approaches to advanced techniques like coyote time and input buffering.

## Introduction

### What is a Character Controller?

A character controller is the system responsible for translating player input into character movement within a game world. Unlike simple object movement, character controllers must handle:

- **Collision Response**: Preventing the character from passing through walls and obstacles
- **Ground Detection**: Determining when the character is standing on a surface
- **Slope Handling**: Managing movement on inclined surfaces
- **Jumping Mechanics**: Implementing responsive jump behavior
- **Air Control**: Allowing movement adjustments while airborne
- **Game Feel**: Creating movement that feels satisfying and responsive

### Why Character Controllers Matter

The character controller is often the most-touched system in a game. Players spend their entire playtime interacting with it, making any imperfection immediately noticeable. Consider how iconic platformers like Super Mario Bros, Celeste, or Hollow Knight are remembered largely for how good their movement feels.

A great character controller provides:

1. **Responsiveness**: Immediate reaction to player input
2. **Predictability**: Consistent behavior players can learn and master
3. **Forgiveness**: Subtle assists that help players succeed
4. **Polish**: Smooth transitions and satisfying feedback

---

## Kinematic vs Dynamic Controllers

The first major decision when building a character controller is choosing between kinematic and dynamic (physics-driven) approaches. Each has distinct advantages and use cases.

### Kinematic Controllers

Kinematic controllers manually calculate and apply movement without relying on the physics engine for forces and velocity. You have complete control over every aspect of movement.

```typescript
class KinematicCharacterController {
  private position: Vector2;
  private velocity: Vector2;

  // Movement parameters
  private readonly maxSpeed: number = 8.0;
  private readonly acceleration: number = 50.0;
  private readonly friction: number = 40.0;
  private readonly gravity: number = 30.0;
  private readonly jumpForce: number = 12.0;

  private isGrounded: boolean = false;

  constructor(startPosition: Vector2) {
    this.position = startPosition;
    this.velocity = new Vector2(0, 0);
  }

  update(deltaTime: number, input: InputState): void {
    // Apply horizontal movement
    this.handleHorizontalMovement(deltaTime, input);

    // Apply gravity
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * deltaTime;
    }

    // Handle jumping
    if (input.jumpPressed && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }

    // Move and handle collisions
    this.moveAndSlide(deltaTime);
  }

  private handleHorizontalMovement(deltaTime: number, input: InputState): void {
    const targetVelocityX = input.horizontalAxis * this.maxSpeed;

    if (Math.abs(input.horizontalAxis) > 0.1) {
      // Accelerate toward target velocity
      this.velocity.x = this.moveToward(
        this.velocity.x,
        targetVelocityX,
        this.acceleration * deltaTime
      );
    } else {
      // Apply friction when no input
      this.velocity.x = this.moveToward(
        this.velocity.x,
        0,
        this.friction * deltaTime
      );
    }
  }

  private moveToward(current: number, target: number, maxDelta: number): number {
    if (Math.abs(target - current) <= maxDelta) {
      return target;
    }
    return current + Math.sign(target - current) * maxDelta;
  }

  private moveAndSlide(deltaTime: number): void {
    const motion = this.velocity.multiply(deltaTime);

    // Horizontal movement with collision
    const horizontalMotion = new Vector2(motion.x, 0);
    const horizontalResult = this.castAndMove(horizontalMotion);
    if (horizontalResult.collided) {
      this.velocity.x = 0;
    }

    // Vertical movement with collision
    const verticalMotion = new Vector2(0, motion.y);
    const verticalResult = this.castAndMove(verticalMotion);
    if (verticalResult.collided) {
      if (this.velocity.y < 0) {
        this.isGrounded = true;
      }
      this.velocity.y = 0;
    }
  }

  private castAndMove(motion: Vector2): CollisionResult {
    // Cast the character's collider along the motion vector
    // Return collision information and adjust position
    const result = Physics.cast(this.position, motion, this.colliderSize);

    if (result.hit) {
      this.position = this.position.add(motion.multiply(result.fraction));
      return { collided: true, normal: result.normal };
    }

    this.position = this.position.add(motion);
    return { collided: false, normal: Vector2.zero };
  }
}
```

**Advantages of Kinematic Controllers:**

- **Complete Control**: Every aspect of movement is explicitly defined
- **Predictable Behavior**: No unexpected physics interactions
- **Easier Debugging**: Clear cause and effect in movement code
- **Consistent Feel**: Same behavior regardless of frame rate (with proper delta time)
- **Better for Platformers**: Precise control needed for tight platforming

**Disadvantages:**

- **More Implementation Work**: Must handle all collision cases manually
- **No Physical Interactions**: Cannot be pushed by physics objects naturally
- **Complex Edge Cases**: Stairs, moving platforms, and corners require special handling

### Dynamic (Physics-Driven) Controllers

Dynamic controllers use the physics engine to handle movement, applying forces and impulses while letting the engine handle collision response.

```typescript
class DynamicCharacterController {
  private rigidbody: Rigidbody2D;

  // Movement parameters
  private readonly maxSpeed: number = 8.0;
  private readonly moveForce: number = 100.0;
  private readonly jumpImpulse: number = 12.0;
  private readonly linearDamping: number = 5.0;

  private isGrounded: boolean = false;

  constructor(rigidbody: Rigidbody2D) {
    this.rigidbody = rigidbody;
    this.rigidbody.gravityScale = 1.0;
    this.rigidbody.freezeRotation = true; // Prevent tumbling
  }

  fixedUpdate(input: InputState): void {
    // Check ground status
    this.updateGroundedState();

    // Apply horizontal movement force
    this.handleHorizontalMovement(input);

    // Handle jumping
    if (input.jumpPressed && this.isGrounded) {
      this.jump();
    }

    // Clamp horizontal velocity
    this.clampHorizontalVelocity();
  }

  private handleHorizontalMovement(input: InputState): void {
    const currentVelocity = this.rigidbody.velocity;
    const targetVelocityX = input.horizontalAxis * this.maxSpeed;
    const velocityDifference = targetVelocityX - currentVelocity.x;

    // Apply force proportional to difference from target
    const force = velocityDifference * this.moveForce;
    this.rigidbody.addForce(new Vector2(force, 0));
  }

  private jump(): void {
    // Reset vertical velocity before jumping for consistent jump height
    const velocity = this.rigidbody.velocity;
    this.rigidbody.velocity = new Vector2(velocity.x, 0);

    // Apply jump impulse
    this.rigidbody.addImpulse(new Vector2(0, this.jumpImpulse));
    this.isGrounded = false;
  }

  private clampHorizontalVelocity(): void {
    const velocity = this.rigidbody.velocity;
    if (Math.abs(velocity.x) > this.maxSpeed) {
      this.rigidbody.velocity = new Vector2(
        Math.sign(velocity.x) * this.maxSpeed,
        velocity.y
      );
    }
  }

  private updateGroundedState(): void {
    // Cast a short ray downward from the character's feet
    const rayOrigin = this.rigidbody.position;
    const rayLength = 0.1;

    const hit = Physics.raycast(
      rayOrigin,
      Vector2.down,
      rayLength,
      LayerMask.ground
    );

    this.isGrounded = hit !== null;
  }
}
```

**Advantages of Dynamic Controllers:**

- **Natural Interactions**: Can be pushed, carried, and affected by physics
- **Less Code**: Physics engine handles collision response
- **Realistic Movement**: Momentum and inertia feel natural
- **Complex Interactions**: Works well with physics puzzles and objects

**Disadvantages:**

- **Less Control**: Physics engine may produce unexpected behavior
- **Harder to Tune**: Getting the right feel requires balancing many parameters
- **Frame Rate Sensitivity**: Must use fixed timestep for consistency
- **Floaty Feel**: Often feels less responsive for action games

### Hybrid Approach

Many professional games use a hybrid approach, combining kinematic control with selective physics interactions:

```typescript
class HybridCharacterController {
  private kinematicBody: KinematicBody;
  private velocity: Vector2 = Vector2.zero;

  // Use kinematic movement for precise control
  update(deltaTime: number, input: InputState): void {
    // Calculate velocity kinematically
    this.calculateVelocity(deltaTime, input);

    // Apply movement with kinematic collision
    const collision = this.kinematicBody.moveAndCollide(
      this.velocity.multiply(deltaTime)
    );

    // Handle physics interactions manually when needed
    if (collision && collision.collider.hasRigidbody) {
      this.applyPushForce(collision);
    }
  }

  private applyPushForce(collision: CollisionInfo): void {
    // Calculate push force based on character's momentum
    const pushForce = this.velocity.multiply(this.pushStrength);
    collision.collider.rigidbody.addForce(pushForce);
  }
}
```

---

## Ground Detection

Accurate ground detection is critical for character controllers. It determines when the character can jump, how friction is applied, and whether gravity should affect movement.

### Raycast-Based Detection

The simplest approach uses one or more raycasts from the character's base:

```typescript
class GroundDetector {
  private readonly rayLength: number = 0.1;
  private readonly rayOffset: number = 0.4; // Horizontal offset for multiple rays

  private groundNormal: Vector2 = Vector2.up;
  private isGrounded: boolean = false;

  checkGround(position: Vector2, colliderWidth: number): GroundInfo {
    // Cast multiple rays for better detection on edges
    const rayPositions = [
      position, // Center
      position.add(new Vector2(-this.rayOffset, 0)), // Left
      position.add(new Vector2(this.rayOffset, 0)),  // Right
    ];

    let groundedCount = 0;
    let averageNormal = Vector2.zero;
    let closestDistance = Infinity;

    for (const rayPos of rayPositions) {
      const hit = Physics.raycast(
        rayPos,
        Vector2.down,
        this.rayLength,
        LayerMask.ground
      );

      if (hit) {
        groundedCount++;
        averageNormal = averageNormal.add(hit.normal);
        closestDistance = Math.min(closestDistance, hit.distance);
      }
    }

    this.isGrounded = groundedCount > 0;

    if (this.isGrounded) {
      this.groundNormal = averageNormal.normalized();
    }

    return {
      isGrounded: this.isGrounded,
      normal: this.groundNormal,
      distance: closestDistance,
    };
  }
}
```

### Shape Cast Detection

For more robust detection, especially with complex collider shapes, use a shape cast:

```typescript
class ShapeCastGroundDetector {
  private readonly castDistance: number = 0.1;
  private readonly skinWidth: number = 0.02;

  checkGround(
    position: Vector2,
    colliderShape: ColliderShape
  ): GroundInfo {
    // Shrink the shape slightly to prevent false positives from walls
    const shrunkShape = colliderShape.shrink(this.skinWidth);

    // Cast the shape downward
    const hit = Physics.shapeCast(
      shrunkShape,
      position,
      Vector2.down,
      this.castDistance,
      LayerMask.ground
    );

    if (hit) {
      // Verify it's actually ground (not a wall)
      const isValidGround = Vector2.dot(hit.normal, Vector2.up) > 0.7;

      return {
        isGrounded: isValidGround,
        normal: hit.normal,
        distance: hit.distance,
        point: hit.point,
      };
    }

    return {
      isGrounded: false,
      normal: Vector2.up,
      distance: Infinity,
      point: null,
    };
  }
}
```

### Ground Snapping

To prevent the character from bouncing or floating when walking down slopes, implement ground snapping:

```typescript
class GroundSnappingController {
  private readonly snapDistance: number = 0.5;
  private readonly maxSnapAngle: number = 45; // Degrees

  private wasGrounded: boolean = false;

  applyGroundSnapping(
    position: Vector2,
    velocity: Vector2,
    groundInfo: GroundInfo
  ): Vector2 {
    // Only snap when walking (not jumping)
    if (velocity.y > 0.1) {
      this.wasGrounded = groundInfo.isGrounded;
      return position;
    }

    // If we were grounded last frame but aren't now, try to snap
    if (this.wasGrounded && !groundInfo.isGrounded) {
      const snapHit = Physics.raycast(
        position,
        Vector2.down,
        this.snapDistance,
        LayerMask.ground
      );

      if (snapHit) {
        const slopeAngle = Vector2.angle(snapHit.normal, Vector2.up);

        if (slopeAngle <= this.maxSnapAngle) {
          // Snap to ground
          return new Vector2(position.x, snapHit.point.y);
        }
      }
    }

    this.wasGrounded = groundInfo.isGrounded;
    return position;
  }
}
```

### Handling Different Ground Types

Extend ground detection to support different surface properties:

```typescript
interface GroundSurface {
  friction: number;
  bounciness: number;
  isSlippery: boolean;
  isPlatform: boolean; // Can pass through from below
  movingPlatform?: MovingPlatform;
}

class AdvancedGroundDetector {
  checkGroundWithSurface(position: Vector2): GroundInfoWithSurface {
    const basicInfo = this.checkGround(position);

    if (!basicInfo.isGrounded) {
      return { ...basicInfo, surface: null };
    }

    // Get surface properties from the ground collider
    const surface = this.getSurfaceProperties(basicInfo.collider);

    return {
      ...basicInfo,
      surface,
    };
  }

  private getSurfaceProperties(collider: Collider): GroundSurface {
    // Check for custom surface component
    const surfaceComponent = collider.getComponent<SurfaceProperties>();

    if (surfaceComponent) {
      return {
        friction: surfaceComponent.friction,
        bounciness: surfaceComponent.bounciness,
        isSlippery: surfaceComponent.friction < 0.3,
        isPlatform: surfaceComponent.isPlatform,
        movingPlatform: collider.getComponent<MovingPlatform>() ?? undefined,
      };
    }

    // Return default surface
    return {
      friction: 1.0,
      bounciness: 0,
      isSlippery: false,
      isPlatform: false,
    };
  }
}
```

---

## Slope Handling

Slopes present unique challenges for character controllers. Without proper handling, characters will slide down slopes, struggle to walk up them, or jitter when moving across them.

### Basic Slope Movement

```typescript
class SlopeHandler {
  private readonly maxSlopeAngle: number = 45; // Maximum walkable slope in degrees
  private readonly slopeSpeedMultiplier: number = 1.0;

  calculateSlopeMovement(
    inputDirection: Vector2,
    groundNormal: Vector2,
    currentSpeed: number
  ): Vector2 {
    // Calculate the slope angle
    const slopeAngle = Vector2.angle(groundNormal, Vector2.up);

    // Check if slope is too steep
    if (slopeAngle > this.maxSlopeAngle) {
      return Vector2.zero; // Cannot walk on this slope
    }

    // Project movement direction onto the slope plane
    const slopeDirection = this.projectOnPlane(inputDirection, groundNormal);

    // Apply speed modifier based on slope angle
    const speedModifier = this.calculateSlopeSpeedModifier(
      slopeAngle,
      inputDirection,
      groundNormal
    );

    return slopeDirection.normalized().multiply(currentSpeed * speedModifier);
  }

  private projectOnPlane(direction: Vector2, planeNormal: Vector2): Vector2 {
    // Remove the component of direction that points along the normal
    const dot = Vector2.dot(direction, planeNormal);
    return direction.subtract(planeNormal.multiply(dot));
  }

  private calculateSlopeSpeedModifier(
    slopeAngle: number,
    moveDirection: Vector2,
    groundNormal: Vector2
  ): number {
    // Determine if moving up or down the slope
    const slopeRight = new Vector2(groundNormal.y, -groundNormal.x);
    const movingUpSlope = Vector2.dot(moveDirection, groundNormal) > 0;

    if (movingUpSlope) {
      // Slow down when going uphill
      return 1.0 - (slopeAngle / this.maxSlopeAngle) * 0.3;
    } else {
      // Optionally speed up when going downhill
      return 1.0 + (slopeAngle / this.maxSlopeAngle) * 0.2;
    }
  }
}
```

### Preventing Slope Sliding

Characters naturally want to slide down slopes due to gravity. Prevent this with careful velocity management:

```typescript
class AntiSlideController {
  private readonly stickForce: number = 20.0;

  preventSliding(
    velocity: Vector2,
    groundNormal: Vector2,
    slopeAngle: number,
    maxWalkableAngle: number,
    isReceivingInput: boolean
  ): Vector2 {
    // Allow sliding on steep slopes
    if (slopeAngle > maxWalkableAngle) {
      return velocity;
    }

    // When standing still on a slope, counteract gravity
    if (!isReceivingInput && slopeAngle > 1) {
      // Calculate the gravity component along the slope
      const gravityAlongSlope = this.calculateSlopeGravity(groundNormal);

      // Apply an opposing force to stick to the slope
      return velocity.subtract(gravityAlongSlope);
    }

    return velocity;
  }

  private calculateSlopeGravity(groundNormal: Vector2): Vector2 {
    const gravity = new Vector2(0, -9.81);

    // Project gravity onto the slope surface
    const dot = Vector2.dot(gravity, groundNormal);
    const normalComponent = groundNormal.multiply(dot);

    return gravity.subtract(normalComponent);
  }
}
```

### Slope Detection and Response

```typescript
class CompleteSlopeHandler {
  private readonly maxSlopeAngle: number = 45;
  private readonly slideThreshold: number = 50; // Angle at which sliding begins

  handleSlope(
    position: Vector2,
    velocity: Vector2,
    groundInfo: GroundInfo,
    input: InputState
  ): SlopeResult {
    if (!groundInfo.isGrounded) {
      return { velocity, shouldSlide: false };
    }

    const slopeAngle = this.calculateSlopeAngle(groundInfo.normal);

    // Steep slope - force sliding
    if (slopeAngle >= this.slideThreshold) {
      return this.handleSteepSlope(velocity, groundInfo.normal, slopeAngle);
    }

    // Walkable slope
    if (slopeAngle <= this.maxSlopeAngle) {
      return this.handleWalkableSlope(velocity, groundInfo.normal, input);
    }

    // Slope between walkable and slide threshold
    // Gradually transition to sliding
    return this.handleTransitionSlope(
      velocity,
      groundInfo.normal,
      slopeAngle,
      input
    );
  }

  private calculateSlopeAngle(normal: Vector2): number {
    return Math.acos(Vector2.dot(normal, Vector2.up)) * (180 / Math.PI);
  }

  private handleWalkableSlope(
    velocity: Vector2,
    normal: Vector2,
    input: InputState
  ): SlopeResult {
    // Project velocity onto slope
    const projectedVelocity = this.projectOnSlope(velocity, normal);

    return {
      velocity: projectedVelocity,
      shouldSlide: false,
    };
  }

  private handleSteepSlope(
    velocity: Vector2,
    normal: Vector2,
    angle: number
  ): SlopeResult {
    // Calculate slide direction (down the slope)
    const slideDirection = this.calculateSlideDirection(normal);

    // Calculate slide speed based on angle
    const slideSpeed = Math.sin(angle * Math.PI / 180) * 15;

    return {
      velocity: slideDirection.multiply(slideSpeed),
      shouldSlide: true,
    };
  }

  private handleTransitionSlope(
    velocity: Vector2,
    normal: Vector2,
    angle: number,
    input: InputState
  ): SlopeResult {
    // Blend between walking and sliding based on angle
    const slideAmount = (angle - this.maxSlopeAngle) /
                        (this.slideThreshold - this.maxSlopeAngle);

    const walkVelocity = this.projectOnSlope(velocity, normal);
    const slideVelocity = this.calculateSlideDirection(normal)
      .multiply(Math.sin(angle * Math.PI / 180) * 10);

    return {
      velocity: Vector2.lerp(walkVelocity, slideVelocity, slideAmount),
      shouldSlide: slideAmount > 0.5,
    };
  }

  private projectOnSlope(velocity: Vector2, normal: Vector2): Vector2 {
    const dot = Vector2.dot(velocity, normal);
    return velocity.subtract(normal.multiply(dot));
  }

  private calculateSlideDirection(normal: Vector2): Vector2 {
    // Get the downhill direction along the slope
    const down = new Vector2(0, -1);
    const slopeRight = new Vector2(normal.y, -normal.x);

    if (Vector2.dot(slopeRight, down) > 0) {
      return slopeRight;
    }
    return slopeRight.multiply(-1);
  }
}
```

---

## Jump Implementation

Jumping is one of the most important mechanics in a character controller. A good jump feels responsive, controllable, and satisfying.

### Basic Jump Mechanics

```typescript
class JumpController {
  private readonly jumpForce: number = 15.0;
  private readonly gravity: number = 40.0;
  private readonly fallMultiplier: number = 2.5;
  private readonly lowJumpMultiplier: number = 2.0;

  private verticalVelocity: number = 0;
  private isJumping: boolean = false;

  update(
    deltaTime: number,
    isGrounded: boolean,
    jumpPressed: boolean,
    jumpHeld: boolean
  ): number {
    // Start jump
    if (jumpPressed && isGrounded) {
      this.verticalVelocity = this.jumpForce;
      this.isJumping = true;
    }

    // Apply gravity
    let gravityMultiplier = 1.0;

    if (this.verticalVelocity < 0) {
      // Falling - apply extra gravity for snappier descent
      gravityMultiplier = this.fallMultiplier;
    } else if (this.verticalVelocity > 0 && !jumpHeld) {
      // Rising but jump released - cut jump short
      gravityMultiplier = this.lowJumpMultiplier;
    }

    this.verticalVelocity -= this.gravity * gravityMultiplier * deltaTime;

    // Landing
    if (isGrounded && this.verticalVelocity <= 0) {
      this.verticalVelocity = 0;
      this.isJumping = false;
    }

    return this.verticalVelocity;
  }
}
```

### Variable Jump Height

Allow players to control jump height by how long they hold the jump button:

```typescript
class VariableJumpController {
  private readonly initialJumpVelocity: number = 18.0;
  private readonly maxJumpTime: number = 0.2; // Seconds
  private readonly jumpHoldForce: number = 30.0;

  private jumpTimer: number = 0;
  private isJumping: boolean = false;
  private canExtendJump: boolean = false;

  update(
    deltaTime: number,
    isGrounded: boolean,
    jumpPressed: boolean,
    jumpHeld: boolean,
    currentVelocityY: number
  ): number {
    let velocityY = currentVelocityY;

    // Initiate jump
    if (jumpPressed && isGrounded) {
      velocityY = this.initialJumpVelocity;
      this.isJumping = true;
      this.canExtendJump = true;
      this.jumpTimer = 0;
    }

    // Extend jump while holding button
    if (jumpHeld && this.canExtendJump && this.jumpTimer < this.maxJumpTime) {
      velocityY += this.jumpHoldForce * deltaTime;
      this.jumpTimer += deltaTime;
    }

    // Stop extending when button released
    if (!jumpHeld) {
      this.canExtendJump = false;
    }

    // Stop extending when falling
    if (velocityY <= 0) {
      this.canExtendJump = false;
    }

    return velocityY;
  }
}
```

### Double Jump and Multi-Jump

```typescript
class MultiJumpController {
  private readonly maxJumps: number = 2;
  private readonly jumpForces: number[] = [15.0, 12.0]; // Different force per jump

  private jumpsRemaining: number;
  private hasJumpedThisFrame: boolean = false;

  constructor() {
    this.jumpsRemaining = this.maxJumps;
  }

  update(
    isGrounded: boolean,
    jumpPressed: boolean,
    currentVelocityY: number
  ): JumpResult {
    // Reset jumps when grounded
    if (isGrounded && currentVelocityY <= 0) {
      this.jumpsRemaining = this.maxJumps;
    }

    // Prevent multiple jumps in one frame
    if (this.hasJumpedThisFrame) {
      this.hasJumpedThisFrame = false;
      return { velocityY: currentVelocityY, jumped: false };
    }

    // Attempt jump
    if (jumpPressed && this.jumpsRemaining > 0) {
      const jumpIndex = this.maxJumps - this.jumpsRemaining;
      const jumpForce = this.jumpForces[jumpIndex] ?? this.jumpForces[0];

      this.jumpsRemaining--;
      this.hasJumpedThisFrame = true;

      // For air jumps, reset vertical velocity first
      const newVelocityY = isGrounded ? jumpForce :
        Math.max(currentVelocityY, 0) + jumpForce;

      return {
        velocityY: newVelocityY,
        jumped: true,
        jumpNumber: this.maxJumps - this.jumpsRemaining,
      };
    }

    return { velocityY: currentVelocityY, jumped: false };
  }
}
```

### Wall Jump

```typescript
class WallJumpController {
  private readonly wallJumpForce: Vector2 = new Vector2(12, 14);
  private readonly wallSlideSpeed: number = 2.0;
  private readonly wallStickTime: number = 0.1;

  private wallDirection: number = 0; // -1 left, 0 none, 1 right
  private wallStickTimer: number = 0;

  checkWallContact(
    position: Vector2,
    colliderWidth: number,
    facingDirection: number
  ): WallInfo {
    const rayLength = colliderWidth / 2 + 0.1;

    // Check both directions
    const leftHit = Physics.raycast(
      position,
      Vector2.left,
      rayLength,
      LayerMask.wall
    );

    const rightHit = Physics.raycast(
      position,
      Vector2.right,
      rayLength,
      LayerMask.wall
    );

    if (leftHit) {
      this.wallDirection = -1;
      return { touching: true, direction: -1, normal: leftHit.normal };
    }

    if (rightHit) {
      this.wallDirection = 1;
      return { touching: true, direction: 1, normal: rightHit.normal };
    }

    this.wallDirection = 0;
    return { touching: false, direction: 0, normal: Vector2.zero };
  }

  handleWallInteraction(
    deltaTime: number,
    velocity: Vector2,
    wallInfo: WallInfo,
    isGrounded: boolean,
    jumpPressed: boolean,
    horizontalInput: number
  ): WallJumpResult {
    if (isGrounded || !wallInfo.touching) {
      this.wallStickTimer = 0;
      return { velocity, isWallSliding: false };
    }

    // Check if player is pressing toward the wall
    const pressingIntoWall =
      (wallInfo.direction === -1 && horizontalInput < -0.1) ||
      (wallInfo.direction === 1 && horizontalInput > 0.1);

    let newVelocity = velocity;
    let isWallSliding = false;

    // Wall slide
    if (pressingIntoWall && velocity.y < 0) {
      newVelocity = new Vector2(
        velocity.x,
        Math.max(velocity.y, -this.wallSlideSpeed)
      );
      isWallSliding = true;
    }

    // Wall stick (brief pause when first touching wall)
    if (pressingIntoWall) {
      this.wallStickTimer += deltaTime;
      if (this.wallStickTimer < this.wallStickTime) {
        newVelocity = new Vector2(0, velocity.y);
      }
    }

    // Wall jump
    if (jumpPressed) {
      const jumpDirection = -wallInfo.direction;
      newVelocity = new Vector2(
        this.wallJumpForce.x * jumpDirection,
        this.wallJumpForce.y
      );
      this.wallStickTimer = 0;

      return {
        velocity: newVelocity,
        isWallSliding: false,
        performedWallJump: true,
      };
    }

    return { velocity: newVelocity, isWallSliding };
  }
}
```

---

## Air Control

Air control determines how much players can influence their character's movement while airborne. The right balance creates satisfying gameplay while maintaining physical plausibility.

### Basic Air Control

```typescript
class AirControlController {
  private readonly airAcceleration: number = 25.0;
  private readonly airDeceleration: number = 15.0;
  private readonly maxAirSpeed: number = 8.0;
  private readonly airControlMultiplier: number = 0.6;

  calculateAirVelocity(
    currentVelocity: Vector2,
    inputDirection: number,
    deltaTime: number
  ): Vector2 {
    let targetVelocityX = inputDirection * this.maxAirSpeed;
    let newVelocityX = currentVelocity.x;

    if (Math.abs(inputDirection) > 0.1) {
      // Player is providing input
      const acceleration = this.airAcceleration * this.airControlMultiplier;

      // Accelerate toward target
      if (Math.abs(targetVelocityX) > Math.abs(currentVelocity.x)) {
        newVelocityX = this.moveToward(
          currentVelocity.x,
          targetVelocityX,
          acceleration * deltaTime
        );
      } else {
        // Turning around - use higher acceleration for responsiveness
        newVelocityX = this.moveToward(
          currentVelocity.x,
          targetVelocityX,
          acceleration * 1.5 * deltaTime
        );
      }
    } else {
      // No input - apply air resistance
      newVelocityX = this.moveToward(
        currentVelocity.x,
        0,
        this.airDeceleration * deltaTime
      );
    }

    return new Vector2(newVelocityX, currentVelocity.y);
  }

  private moveToward(current: number, target: number, maxDelta: number): number {
    if (Math.abs(target - current) <= maxDelta) {
      return target;
    }
    return current + Math.sign(target - current) * maxDelta;
  }
}
```

### Momentum-Preserving Air Control

Some games allow maintaining horizontal momentum while in the air:

```typescript
class MomentumAirControl {
  private readonly turnSpeed: number = 5.0;
  private readonly maxInfluence: number = 3.0; // Max speed change from input

  calculateAirVelocity(
    currentVelocity: Vector2,
    inputDirection: number,
    deltaTime: number
  ): Vector2 {
    // Preserve base momentum
    const baseSpeed = currentVelocity.x;

    // Allow player to influence velocity, but not exceed max influence
    const influence = inputDirection * this.maxInfluence;

    // Smoothly apply influence
    const targetVelocityX = baseSpeed + influence;
    const newVelocityX = this.lerp(
      currentVelocity.x,
      targetVelocityX,
      this.turnSpeed * deltaTime
    );

    return new Vector2(newVelocityX, currentVelocity.y);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * Math.min(t, 1);
  }
}
```

### Directional Air Control

For games requiring precise aerial maneuvering:

```typescript
class DirectionalAirControl {
  private readonly forwardInfluence: number = 0.8;
  private readonly backwardInfluence: number = 0.4;
  private readonly lateralInfluence: number = 0.6;

  calculateAirVelocity(
    currentVelocity: Vector2,
    inputDirection: Vector2,
    facingDirection: number,
    deltaTime: number
  ): Vector2 {
    // Determine if input is forward, backward, or lateral relative to velocity
    const velocityDirection = Math.sign(currentVelocity.x);
    const inputDotVelocity = inputDirection.x * velocityDirection;

    let influence: number;

    if (inputDotVelocity > 0.5) {
      // Input in same direction as velocity - forward influence
      influence = this.forwardInfluence;
    } else if (inputDotVelocity < -0.5) {
      // Input opposite to velocity - backward influence (braking)
      influence = this.backwardInfluence;
    } else {
      // Lateral or minimal input
      influence = this.lateralInfluence;
    }

    const targetVelocity = inputDirection.multiply(this.maxAirSpeed);
    const maxDelta = this.airAcceleration * influence * deltaTime;

    return new Vector2(
      this.moveToward(currentVelocity.x, targetVelocity.x, maxDelta),
      currentVelocity.y
    );
  }
}
```

---

## Collision Response

Proper collision response ensures the character moves smoothly through the environment without getting stuck or behaving erratically.

### Slide Along Surfaces

When hitting a wall, slide along it rather than stopping completely:

```typescript
class CollisionResponseHandler {
  private readonly skinWidth: number = 0.02;

  moveAndSlide(
    position: Vector2,
    velocity: Vector2,
    deltaTime: number,
    maxBounces: number = 4
  ): MoveResult {
    let remainingVelocity = velocity;
    let currentPosition = position;
    let totalMotion = Vector2.zero;

    for (let bounce = 0; bounce < maxBounces; bounce++) {
      const motion = remainingVelocity.multiply(deltaTime);

      if (motion.magnitude() < 0.001) {
        break;
      }

      const hit = Physics.shapeCast(
        this.colliderShape,
        currentPosition,
        motion.normalized(),
        motion.magnitude() + this.skinWidth
      );

      if (!hit) {
        // No collision - move full distance
        currentPosition = currentPosition.add(motion);
        totalMotion = totalMotion.add(motion);
        break;
      }

      // Move to contact point
      const safeDistance = Math.max(0, hit.distance - this.skinWidth);
      const safeMotion = motion.normalized().multiply(safeDistance);
      currentPosition = currentPosition.add(safeMotion);
      totalMotion = totalMotion.add(safeMotion);

      // Calculate remaining velocity after collision
      remainingVelocity = this.slideVelocity(remainingVelocity, hit.normal);

      // Reduce deltaTime proportionally
      const usedTime = safeDistance / motion.magnitude() * deltaTime;
      deltaTime -= usedTime;
    }

    return {
      finalPosition: currentPosition,
      finalVelocity: remainingVelocity,
      totalMotion,
    };
  }

  private slideVelocity(velocity: Vector2, normal: Vector2): Vector2 {
    // Remove the component of velocity that points into the surface
    const dot = Vector2.dot(velocity, normal);

    if (dot >= 0) {
      // Moving away from surface - no adjustment needed
      return velocity;
    }

    return velocity.subtract(normal.multiply(dot));
  }
}
```

### Corner Handling

Prevent getting stuck on corners where two surfaces meet:

```typescript
class CornerHandler {
  private readonly cornerPushDistance: number = 0.1;

  handleCorner(
    position: Vector2,
    velocity: Vector2,
    collisionNormals: Vector2[]
  ): Vector2 {
    if (collisionNormals.length < 2) {
      return velocity;
    }

    // Average the normals to find the corner direction
    let averageNormal = Vector2.zero;
    for (const normal of collisionNormals) {
      averageNormal = averageNormal.add(normal);
    }
    averageNormal = averageNormal.normalized();

    // Check if velocity is pointing into the corner
    const dot = Vector2.dot(velocity, averageNormal);

    if (dot < -0.1) {
      // Stuck in corner - slide along the crease
      const crease = this.calculateCornerCrease(collisionNormals);
      return this.projectOnVector(velocity, crease);
    }

    return velocity;
  }

  private calculateCornerCrease(normals: Vector2[]): Vector2 {
    // The crease is perpendicular to both normals
    // In 2D, this is the direction along the corner edge
    if (normals.length === 2) {
      const cross = normals[0].x * normals[1].y - normals[0].y * normals[1].x;
      return new Vector2(-cross, cross).normalized();
    }
    return Vector2.zero;
  }

  private projectOnVector(velocity: Vector2, direction: Vector2): Vector2 {
    const dot = Vector2.dot(velocity, direction);
    return direction.multiply(dot);
  }
}
```

### Step Handling

Automatically step up small obstacles like stairs:

```typescript
class StepHandler {
  private readonly maxStepHeight: number = 0.3;
  private readonly stepCheckDistance: number = 0.5;

  tryStepUp(
    position: Vector2,
    velocity: Vector2,
    colliderSize: Vector2
  ): StepResult {
    // Only try stepping when moving horizontally and blocked
    if (Math.abs(velocity.x) < 0.1) {
      return { canStep: false, newPosition: position };
    }

    const moveDirection = Math.sign(velocity.x);

    // Check for obstacle at foot level
    const footCheckPos = position;
    const footHit = Physics.raycast(
      footCheckPos,
      new Vector2(moveDirection, 0),
      this.stepCheckDistance,
      LayerMask.ground
    );

    if (!footHit) {
      return { canStep: false, newPosition: position };
    }

    // Check for clearance at step height
    const stepCheckPos = position.add(new Vector2(0, this.maxStepHeight));
    const stepHit = Physics.raycast(
      stepCheckPos,
      new Vector2(moveDirection, 0),
      this.stepCheckDistance,
      LayerMask.ground
    );

    if (stepHit) {
      // Still blocked at step height - obstacle too tall
      return { canStep: false, newPosition: position };
    }

    // Find the actual step height
    const stepTop = footHit.point.add(new Vector2(0, this.maxStepHeight));
    const downHit = Physics.raycast(
      stepTop.add(new Vector2(moveDirection * 0.1, 0)),
      Vector2.down,
      this.maxStepHeight,
      LayerMask.ground
    );

    if (downHit) {
      const stepHeight = this.maxStepHeight - downHit.distance;

      if (stepHeight <= this.maxStepHeight) {
        // Valid step - return new position
        return {
          canStep: true,
          newPosition: position.add(new Vector2(0, stepHeight + 0.01)),
        };
      }
    }

    return { canStep: false, newPosition: position };
  }
}
```

---

## Coyote Time

Coyote time (named after cartoon physics where characters can briefly walk on air) is a game feel enhancement that gives players a brief window to jump after leaving a platform.

### Basic Implementation

```typescript
class CoyoteTimeController {
  private readonly coyoteTimeDuration: number = 0.1; // 100ms

  private coyoteTimeCounter: number = 0;
  private wasGroundedLastFrame: boolean = false;

  update(deltaTime: number, isGrounded: boolean, verticalVelocity: number): void {
    if (isGrounded) {
      this.coyoteTimeCounter = this.coyoteTimeDuration;
    } else {
      // Only count down if we walked off (not jumped)
      if (this.wasGroundedLastFrame && verticalVelocity <= 0) {
        // Started falling - begin coyote time
        this.coyoteTimeCounter = this.coyoteTimeDuration;
      }

      this.coyoteTimeCounter -= deltaTime;
    }

    this.wasGroundedLastFrame = isGrounded;
  }

  canJump(): boolean {
    return this.coyoteTimeCounter > 0;
  }

  consumeCoyoteTime(): void {
    this.coyoteTimeCounter = 0;
  }
}
```

### Integration with Jump Controller

```typescript
class JumpControllerWithCoyoteTime {
  private readonly jumpForce: number = 15.0;
  private readonly coyoteTime: number = 0.1;

  private coyoteTimeRemaining: number = 0;
  private hasJumpedDuringCoyote: boolean = false;

  update(
    deltaTime: number,
    isGrounded: boolean,
    jumpPressed: boolean,
    currentVelocityY: number
  ): JumpResult {
    // Update coyote time
    if (isGrounded) {
      this.coyoteTimeRemaining = this.coyoteTime;
      this.hasJumpedDuringCoyote = false;
    } else if (currentVelocityY <= 0 && !this.hasJumpedDuringCoyote) {
      // Falling and haven't jumped - tick coyote time
      this.coyoteTimeRemaining -= deltaTime;
    }

    // Check if can jump
    const canJump = isGrounded ||
      (this.coyoteTimeRemaining > 0 && !this.hasJumpedDuringCoyote);

    if (jumpPressed && canJump) {
      this.hasJumpedDuringCoyote = true;
      this.coyoteTimeRemaining = 0;

      return {
        velocityY: this.jumpForce,
        jumped: true,
        usedCoyoteTime: !isGrounded,
      };
    }

    return {
      velocityY: currentVelocityY,
      jumped: false,
      usedCoyoteTime: false,
    };
  }
}
```

---

## Input Buffering

Input buffering stores player inputs and executes them at the earliest valid opportunity, making the game feel more responsive.

### Jump Buffer Implementation

```typescript
class JumpBuffer {
  private readonly bufferDuration: number = 0.15; // 150ms

  private bufferTimer: number = 0;
  private jumpBuffered: boolean = false;

  update(deltaTime: number, jumpPressed: boolean): void {
    // Store jump input
    if (jumpPressed) {
      this.jumpBuffered = true;
      this.bufferTimer = this.bufferDuration;
    }

    // Decrease buffer timer
    if (this.jumpBuffered) {
      this.bufferTimer -= deltaTime;

      if (this.bufferTimer <= 0) {
        this.jumpBuffered = false;
      }
    }
  }

  hasBufferedJump(): boolean {
    return this.jumpBuffered;
  }

  consumeBuffer(): void {
    this.jumpBuffered = false;
    this.bufferTimer = 0;
  }
}
```

### Complete Input Buffer System

```typescript
interface BufferedInput {
  type: string;
  timestamp: number;
  data?: any;
}

class InputBufferSystem {
  private readonly defaultBufferDuration: number = 0.15;
  private readonly bufferDurations: Map<string, number> = new Map([
    ['jump', 0.15],
    ['attack', 0.1],
    ['dash', 0.12],
    ['interact', 0.2],
  ]);

  private bufferedInputs: BufferedInput[] = [];
  private currentTime: number = 0;

  update(deltaTime: number): void {
    this.currentTime += deltaTime;

    // Remove expired inputs
    this.bufferedInputs = this.bufferedInputs.filter(input => {
      const duration = this.bufferDurations.get(input.type) ??
                       this.defaultBufferDuration;
      return this.currentTime - input.timestamp < duration;
    });
  }

  bufferInput(type: string, data?: any): void {
    // Check for duplicate recent inputs
    const existing = this.bufferedInputs.find(
      input => input.type === type &&
               this.currentTime - input.timestamp < 0.05
    );

    if (!existing) {
      this.bufferedInputs.push({
        type,
        timestamp: this.currentTime,
        data,
      });
    }
  }

  consumeInput(type: string): BufferedInput | null {
    const index = this.bufferedInputs.findIndex(input => input.type === type);

    if (index !== -1) {
      const input = this.bufferedInputs[index];
      this.bufferedInputs.splice(index, 1);
      return input;
    }

    return null;
  }

  hasBufferedInput(type: string): boolean {
    return this.bufferedInputs.some(input => input.type === type);
  }

  clearBuffer(type?: string): void {
    if (type) {
      this.bufferedInputs = this.bufferedInputs.filter(
        input => input.type !== type
      );
    } else {
      this.bufferedInputs = [];
    }
  }
}
```

### Integration with Character Controller

```typescript
class CharacterControllerWithBuffering {
  private inputBuffer: InputBufferSystem;
  private coyoteTime: CoyoteTimeController;
  private jumpController: JumpController;

  constructor() {
    this.inputBuffer = new InputBufferSystem();
    this.coyoteTime = new CoyoteTimeController();
    this.jumpController = new JumpController();
  }

  handleInput(input: InputState): void {
    // Buffer jump input when pressed
    if (input.jumpPressed) {
      this.inputBuffer.bufferInput('jump');
    }

    if (input.attackPressed) {
      this.inputBuffer.bufferInput('attack');
    }

    if (input.dashPressed) {
      this.inputBuffer.bufferInput('dash');
    }
  }

  update(deltaTime: number, isGrounded: boolean): void {
    this.inputBuffer.update(deltaTime);
    this.coyoteTime.update(deltaTime, isGrounded, this.velocity.y);

    // Try to execute buffered jump
    if (this.inputBuffer.hasBufferedInput('jump')) {
      if (this.coyoteTime.canJump()) {
        this.executeJump();
        this.inputBuffer.consumeInput('jump');
        this.coyoteTime.consumeCoyoteTime();
      }
    }

    // Try to execute buffered dash
    if (this.inputBuffer.hasBufferedInput('dash')) {
      if (this.canDash()) {
        this.executeDash();
        this.inputBuffer.consumeInput('dash');
      }
    }
  }
}
```

---

## Complete Character Controller Example

Putting it all together, here is a complete character controller implementation:

```typescript
class CompleteCharacterController {
  // Components
  private groundDetector: ShapeCastGroundDetector;
  private slopeHandler: CompleteSlopeHandler;
  private jumpController: MultiJumpController;
  private airControl: AirControlController;
  private collisionHandler: CollisionResponseHandler;
  private coyoteTime: CoyoteTimeController;
  private inputBuffer: InputBufferSystem;
  private wallJump: WallJumpController;

  // State
  private position: Vector2;
  private velocity: Vector2 = Vector2.zero;
  private facingDirection: number = 1;

  // Movement parameters
  private readonly maxGroundSpeed: number = 8.0;
  private readonly groundAcceleration: number = 50.0;
  private readonly groundDeceleration: number = 60.0;
  private readonly gravity: number = 40.0;
  private readonly terminalVelocity: number = 30.0;

  // State flags
  private isGrounded: boolean = false;
  private isWallSliding: boolean = false;
  private groundNormal: Vector2 = Vector2.up;

  constructor(startPosition: Vector2) {
    this.position = startPosition;

    this.groundDetector = new ShapeCastGroundDetector();
    this.slopeHandler = new CompleteSlopeHandler();
    this.jumpController = new MultiJumpController();
    this.airControl = new AirControlController();
    this.collisionHandler = new CollisionResponseHandler();
    this.coyoteTime = new CoyoteTimeController();
    this.inputBuffer = new InputBufferSystem();
    this.wallJump = new WallJumpController();
  }

  update(deltaTime: number, input: InputState): void {
    // Buffer inputs
    this.handleInputBuffering(input);

    // Detect ground
    const groundInfo = this.groundDetector.checkGround(
      this.position,
      this.colliderShape
    );
    this.isGrounded = groundInfo.isGrounded;
    this.groundNormal = groundInfo.normal;

    // Update systems
    this.inputBuffer.update(deltaTime);
    this.coyoteTime.update(deltaTime, this.isGrounded, this.velocity.y);

    // Handle horizontal movement
    this.handleHorizontalMovement(deltaTime, input);

    // Handle vertical movement
    this.handleVerticalMovement(deltaTime, input);

    // Handle wall interactions
    this.handleWallInteractions(deltaTime, input);

    // Apply movement with collision
    this.applyMovement(deltaTime);

    // Update facing direction
    if (Math.abs(input.horizontalAxis) > 0.1) {
      this.facingDirection = Math.sign(input.horizontalAxis);
    }
  }

  private handleInputBuffering(input: InputState): void {
    if (input.jumpPressed) {
      this.inputBuffer.bufferInput('jump');
    }
  }

  private handleHorizontalMovement(deltaTime: number, input: InputState): void {
    if (this.isGrounded) {
      // Ground movement with slope handling
      const slopeResult = this.slopeHandler.handleSlope(
        this.position,
        this.velocity,
        { isGrounded: this.isGrounded, normal: this.groundNormal },
        input
      );

      if (slopeResult.shouldSlide) {
        this.velocity = slopeResult.velocity;
        return;
      }

      // Normal ground acceleration
      const targetSpeed = input.horizontalAxis * this.maxGroundSpeed;

      if (Math.abs(input.horizontalAxis) > 0.1) {
        this.velocity.x = this.moveToward(
          this.velocity.x,
          targetSpeed,
          this.groundAcceleration * deltaTime
        );
      } else {
        this.velocity.x = this.moveToward(
          this.velocity.x,
          0,
          this.groundDeceleration * deltaTime
        );
      }
    } else {
      // Air control
      const airVelocity = this.airControl.calculateAirVelocity(
        this.velocity,
        input.horizontalAxis,
        deltaTime
      );
      this.velocity.x = airVelocity.x;
    }
  }

  private handleVerticalMovement(deltaTime: number, input: InputState): void {
    // Check for buffered jump
    const wantsToJump = this.inputBuffer.hasBufferedInput('jump');

    // Try to jump
    if (wantsToJump && this.coyoteTime.canJump()) {
      const jumpResult = this.jumpController.update(
        this.isGrounded,
        true,
        this.velocity.y
      );

      if (jumpResult.jumped) {
        this.velocity.y = jumpResult.velocityY;
        this.inputBuffer.consumeInput('jump');
        this.coyoteTime.consumeCoyoteTime();
        this.isGrounded = false;
      }
    }

    // Apply gravity
    if (!this.isGrounded) {
      // Variable gravity for better jump feel
      let gravityMultiplier = 1.0;

      if (this.velocity.y < 0) {
        gravityMultiplier = 2.5; // Faster falling
      } else if (!input.jumpHeld) {
        gravityMultiplier = 2.0; // Short hop
      }

      this.velocity.y -= this.gravity * gravityMultiplier * deltaTime;

      // Clamp to terminal velocity
      this.velocity.y = Math.max(this.velocity.y, -this.terminalVelocity);
    }
  }

  private handleWallInteractions(deltaTime: number, input: InputState): void {
    if (this.isGrounded) {
      this.isWallSliding = false;
      return;
    }

    const wallInfo = this.wallJump.checkWallContact(
      this.position,
      this.colliderWidth,
      this.facingDirection
    );

    if (wallInfo.touching) {
      const wallResult = this.wallJump.handleWallInteraction(
        deltaTime,
        this.velocity,
        wallInfo,
        this.isGrounded,
        this.inputBuffer.hasBufferedInput('jump'),
        input.horizontalAxis
      );

      this.velocity = wallResult.velocity;
      this.isWallSliding = wallResult.isWallSliding;

      if (wallResult.performedWallJump) {
        this.inputBuffer.consumeInput('jump');
      }
    }
  }

  private applyMovement(deltaTime: number): void {
    const moveResult = this.collisionHandler.moveAndSlide(
      this.position,
      this.velocity,
      deltaTime
    );

    this.position = moveResult.finalPosition;
    this.velocity = moveResult.finalVelocity;
  }

  private moveToward(current: number, target: number, maxDelta: number): number {
    if (Math.abs(target - current) <= maxDelta) {
      return target;
    }
    return current + Math.sign(target - current) * maxDelta;
  }

  // Public getters
  getPosition(): Vector2 { return this.position; }
  getVelocity(): Vector2 { return this.velocity; }
  getIsGrounded(): boolean { return this.isGrounded; }
  getIsWallSliding(): boolean { return this.isWallSliding; }
  getFacingDirection(): number { return this.facingDirection; }
}
```

---

## Tuning and Polish

### Recommended Starting Values

Tested parameter ranges for different game styles:

```typescript
// Tight Platformer (Celeste-style)
const tightPlatformer = {
  maxSpeed: 8.0,
  acceleration: 60.0,
  deceleration: 70.0,
  gravity: 50.0,
  jumpForce: 18.0,
  coyoteTime: 0.1,
  jumpBuffer: 0.15,
  airControlMultiplier: 0.8,
};

// Floaty Platformer (Kirby-style)
const floatyPlatformer = {
  maxSpeed: 5.0,
  acceleration: 30.0,
  deceleration: 25.0,
  gravity: 20.0,
  jumpForce: 10.0,
  coyoteTime: 0.15,
  jumpBuffer: 0.2,
  airControlMultiplier: 0.9,
};

// Heavy Character (Dark Souls-style)
const heavyCharacter = {
  maxSpeed: 4.0,
  acceleration: 25.0,
  deceleration: 40.0,
  gravity: 60.0,
  jumpForce: 12.0,
  coyoteTime: 0.05,
  jumpBuffer: 0.1,
  airControlMultiplier: 0.3,
};

// Fast Runner (Sonic-style)
const fastRunner = {
  maxSpeed: 20.0,
  acceleration: 40.0,
  deceleration: 20.0, // Low deceleration preserves momentum
  gravity: 45.0,
  jumpForce: 16.0,
  coyoteTime: 0.12,
  jumpBuffer: 0.12,
  airControlMultiplier: 0.5,
};
```

### Visual Feedback Integration

```typescript
class CharacterAnimationController {
  updateAnimations(controller: CompleteCharacterController): AnimationState {
    const velocity = controller.getVelocity();
    const isGrounded = controller.getIsGrounded();
    const isWallSliding = controller.getIsWallSliding();

    if (isWallSliding) {
      return AnimationState.WallSlide;
    }

    if (!isGrounded) {
      if (velocity.y > 0) {
        return AnimationState.Jump;
      }
      return AnimationState.Fall;
    }

    if (Math.abs(velocity.x) > 0.1) {
      if (Math.abs(velocity.x) > 6) {
        return AnimationState.Run;
      }
      return AnimationState.Walk;
    }

    return AnimationState.Idle;
  }
}
```

---

## Common Pitfalls

### Frame Rate Dependent Movement

```typescript
// WRONG - Speed depends on frame rate
update(): void {
  this.position.x += this.speed;
}

// CORRECT - Use delta time
update(deltaTime: number): void {
  this.position.x += this.speed * deltaTime;
}
```

### Floating Point Accumulation Errors

```typescript
// WRONG - Accumulated error over time
if (this.isGrounded) {
  this.velocity.y = 0;
}

// CORRECT - Snap to ground
if (this.isGrounded && this.velocity.y < 0) {
  this.velocity.y = 0;
  this.position.y = Math.round(this.position.y * 100) / 100;
}
```

### Missing Input Validation

```typescript
// WRONG - Assumes valid input
handleInput(axis: number): void {
  this.velocity.x = axis * this.maxSpeed;
}

// CORRECT - Validate and clamp input
handleInput(axis: number): void {
  const clampedAxis = Math.max(-1, Math.min(1, axis));
  const deadzone = 0.1;

  if (Math.abs(clampedAxis) < deadzone) {
    this.velocity.x = this.moveToward(this.velocity.x, 0, this.friction);
  } else {
    this.velocity.x = clampedAxis * this.maxSpeed;
  }
}
```

### Tunneling Through Thin Walls

```typescript
// WRONG - Direct position update can skip through walls
this.position = this.position.add(this.velocity.multiply(deltaTime));

// CORRECT - Use swept collision detection
const motion = this.velocity.multiply(deltaTime);
const hit = Physics.shapeCast(this.collider, this.position, motion);

if (hit && hit.fraction < 1.0) {
  this.position = this.position.add(motion.multiply(hit.fraction * 0.99));
  this.velocity = this.slideVelocity(this.velocity, hit.normal);
} else {
  this.position = this.position.add(motion);
}
```

### Inconsistent Jump Height

```typescript
// WRONG - Jump height varies with frame rate
jump(): void {
  this.velocity.y = this.jumpForce;
  // Gravity applied in update() at varying deltaTime
}

// CORRECT - Calculate consistent jump parameters
// Using kinematic equation: v^2 = v0^2 + 2*a*d
// For desired jump height h: jumpVelocity = sqrt(2 * gravity * h)
calculateJumpForce(desiredHeight: number): number {
  return Math.sqrt(2 * this.gravity * desiredHeight);
}
```

---

## Interview Key Points

### Common Interview Questions

1. **What is the difference between kinematic and dynamic character controllers?**

   Kinematic controllers manually calculate and apply movement, giving complete control but requiring more implementation. Dynamic controllers use the physics engine for forces and collision response, providing natural interactions but less precise control.

2. **How would you implement coyote time?**

   Track when the character leaves the ground and provide a brief window (typically 100-150ms) during which jumping is still allowed. Only activate when walking off a ledge (not jumping off).

3. **Why is input buffering important for game feel?**

   Input buffering captures player intentions even when the action cannot be immediately executed, making the game feel more responsive. For example, buffering a jump input while falling allows the jump to execute immediately upon landing.

4. **How do you handle slopes in a character controller?**

   Project movement onto the slope surface, implement anti-slide mechanics to prevent unwanted sliding, handle maximum walkable angles, and use ground snapping to prevent bouncing when walking down slopes.

5. **What causes a character to feel "floaty" and how do you fix it?**

   Floatiness typically comes from low gravity, slow acceleration, high air control, or linear jump arcs. Fix by increasing gravity (especially during falling), using faster acceleration/deceleration, and implementing variable jump height with higher gravity when the jump button is released.

6. **How do you prevent tunneling in fast-moving characters?**

   Use swept collision detection (shape casting) instead of discrete position updates. Alternatively, use continuous collision detection or subdivide movement into smaller steps.

### Best Practices to Mention

- Always use delta time for frame-rate independent movement
- Implement multiple assist systems (coyote time, input buffering)
- Use shape casting for robust collision detection
- Tune parameters based on game feel, not just physics accuracy
- Test on various frame rates and input methods
- Separate movement logic from rendering and animation

---

## Further Reading

### Recommended Resources

- **Game Programming Patterns** - Robert Nystrom (Component Pattern, Game Loop)
- **GDC Talks**: "Celeste and TowerFall Physics" by Matt Thorson
- **GDC Talks**: "Building a Better Jump" by Kyle Pittman
- **Gamasutra**: "2D Platformer Collision Detection and Response"

### Related Topics

- State machines for character states
- Animation blending and transitions
- Camera systems for platformers
- Level design for character controllers
- Accessibility options for movement

### Engine-Specific Documentation

- Unity: CharacterController component, Rigidbody2D
- Unreal Engine: Character Movement Component
- Godot: KinematicBody2D, CharacterBody2D
- Game Maker: Physics and collision functions

---

## Summary

Building a great character controller requires understanding both the technical implementation and the game feel you want to achieve:

1. **Choose Your Approach**: Kinematic for precise control (platformers), dynamic for physics interactions (action games), or hybrid for the best of both
2. **Implement Robust Ground Detection**: Use shape casting and multiple checks for reliable ground state
3. **Handle Slopes Properly**: Project movement onto surfaces, prevent sliding, and snap to ground
4. **Create Satisfying Jumps**: Implement variable height, faster falling, and consider multi-jump mechanics
5. **Add Air Control**: Allow appropriate aerial movement adjustment for your game style
6. **Polish with Assists**: Coyote time and input buffering make games feel more responsive
7. **Handle Edge Cases**: Corners, steps, moving platforms, and thin walls all need special attention
8. **Test and Iterate**: Good game feel comes from extensive playtesting and tuning

Remember that a character controller is never truly "done." Even after implementing all these systems, you will spend significant time tuning values, adding edge case handling, and refining the feel based on playtesting. The best character controllers feel invisible - players do not notice them because they simply work exactly as expected.
