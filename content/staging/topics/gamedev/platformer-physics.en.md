---
title: Platformer Physics Implementation
description: Master the art of implementing tight, responsive platformer physics with proper collision detection, character controllers, and movement mechanics
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - platformer
  - physics
  - collision detection
  - character controller
  - game mechanics
  - unity
  - godot
status: imported
origin: old/src/content/docs/gamedev/platformer-physics.en.md
divergence: 0.223
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - h1-in-body
legacy:
  category: GameDev
  subcategory: ""
  order: 45
  lastUpdated: 2026-01-22
---

## Concept Explanation

### What is Platformer Physics?

Platformer physics refers to the specialized movement and collision systems that create the "feel" of 2D side-scrolling games. Unlike realistic physics simulations, platformer physics prioritizes player control, responsiveness, and game feel over physical accuracy.

Great platformers like Super Mario Bros, Celeste, and Hollow Knight achieve their signature feel through carefully tuned physics parameters. The jump arc, running acceleration, air control, and collision response all contribute to what players experience as "tight" or "floaty" controls.

### Why Custom Physics?

While game engines provide built-in physics, platformers often require custom solutions because:

1. **Predictability**: Players need consistent, repeatable movements
2. **Control**: Fine-grained parameter tuning for game feel
3. **Special Cases**: Coyote time, jump buffering, one-way platforms
4. **Performance**: Simplified calculations for 2D movement
5. **Design Freedom**: Mechanics that defy real physics (double jumps, wall slides)

### Core Components

A complete platformer physics system includes:

- **Character Controller**: Manages movement state and input processing
- **Collision Detection**: Determines when and where collisions occur
- **Collision Resolution**: Responds appropriately to collisions
- **Ground Detection**: Determines if the player is grounded
- **Movement Mechanics**: Jump, run, crouch, dash, etc.

## Core Principles

### 1. Kinematic vs Dynamic Bodies

```
┌─────────────────────────────────────────────────────────────┐
│                  Physics Body Types                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Dynamic Body (Rigidbody)          Kinematic Body           │
│  ┌─────────────────────┐           ┌─────────────────────┐  │
│  │ • Physics-driven    │           │ • Code-driven       │  │
│  │ • Forces & impulses │           │ • Direct velocity   │  │
│  │ • Realistic but     │           │ • Full control      │  │
│  │   unpredictable     │           │ • Predictable       │  │
│  │ • Affected by       │           │ • Ignores external  │  │
│  │   external forces   │           │   forces            │  │
│  └─────────────────────┘           └─────────────────────┘  │
│                                                             │
│  Use for: Moving platforms,        Use for: Player         │
│           physics objects          character, enemies      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. The Physics Loop

```
┌─────────────────────────────────────────────────────────────┐
│                    Frame Update Loop                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐                                          │
│   │ Process Input│ ◄── Read horizontal, jump, etc.         │
│   └──────┬───────┘                                          │
│          ▼                                                  │
│   ┌──────────────┐                                          │
│   │Apply Gravity │ ◄── velocity.y += gravity * dt          │
│   └──────┬───────┘                                          │
│          ▼                                                  │
│   ┌──────────────┐                                          │
│   │ Apply Forces │ ◄── Acceleration, friction, drag        │
│   └──────┬───────┘                                          │
│          ▼                                                  │
│   ┌──────────────┐                                          │
│   │Move & Collide│ ◄── Detect collisions, resolve          │
│   └──────┬───────┘                                          │
│          ▼                                                  │
│   ┌──────────────┐                                          │
│   │Update State  │ ◄── Grounded, wall slide, etc.          │
│   └──────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Fixed vs Variable Timestep

```csharp
// Variable timestep - frame-dependent (BAD)
void Update() {
    velocity.y += gravity * Time.deltaTime;  // Inconsistent at different framerates
}

// Fixed timestep - consistent physics (GOOD)
void FixedUpdate() {
    velocity.y += gravity * Time.fixedDeltaTime;  // Always same rate
}
```

### 4. Collision Detection Methods

```
┌─────────────────────────────────────────────────────────────┐
│              Collision Detection Approaches                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Discrete Detection          Continuous Detection          │
│  ┌─────────────────┐         ┌─────────────────────────┐   │
│  │    ●───────●    │         │    ●─────────────●      │   │
│  │    t0     t1    │         │    t0    ████   t1      │   │
│  │         ████    │         │          ▲             │   │
│  │    Tunnel!      │         │    Sweep test catches   │   │
│  └─────────────────┘         └─────────────────────────┘   │
│                                                             │
│  • Fast but misses           • Catches all collisions      │
│    thin objects              • More expensive              │
│  • Use for slow objects      • Use for fast objects        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. AABB Collision Detection

Axis-Aligned Bounding Boxes provide fast, simple collision detection:

```
┌─────────────────────────────────────────────────────────────┐
│                    AABB Overlap Test                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     Box A                  Box B                            │
│   ┌───────┐              ┌───────┐                          │
│   │(x1,y1)│              │(x1,y1)│                          │
│   │   ┌───┼──────────────┼───┐   │                          │
│   │   │   │   Overlap    │   │   │                          │
│   └───┼───┘              └───┼───┘                          │
│       │(x2,y2)    (x2,y2)    │                              │
│       └──────────────────────┘                              │
│                                                             │
│   Overlap exists when ALL conditions are true:              │
│   • A.x1 < B.x2  AND  A.x2 > B.x1                          │
│   • A.y1 < B.y2  AND  A.y2 > B.y1                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Raycasting for Ground Detection

```
┌─────────────────────────────────────────────────────────────┐
│                  Ground Detection Rays                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           ┌─────────┐                                       │
│           │ Player  │                                       │
│           │  ┌───┐  │                                       │
│           │  │   │  │                                       │
│           └──┼───┼──┘                                       │
│              │   │                                          │
│        ▼     ▼   ▼     ▼    ◄── Multiple rays              │
│     ═══════════════════════     for edge detection          │
│                                                             │
│   Single ray: Misses edges                                  │
│   Multiple rays: Better coverage                            │
│   Boxcast: Most accurate but expensive                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Coyote Time and Jump Buffering

These mechanics improve game feel by being forgiving:

```
┌─────────────────────────────────────────────────────────────┐
│             Coyote Time (Grace Period)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Player runs off edge:                                     │
│                                                             │
│   ┌─────┐                    ┌─────┐                        │
│   │  P  │══════              │     │══════                  │
│   │     │                    │     │                        │
│   └─────┘                    └─────┘ ← P (still can jump!)  │
│          ║                          ║                       │
│          ║     t=0        t=0.1s    ║                       │
│          ║     Left       Coyote    ║                       │
│          ║     ground     window    ║                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                  Jump Buffering                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Player presses jump slightly before landing:              │
│                                                             │
│          ↓ Jump pressed                                     │
│      ┌─────┐                                                │
│      │  P  │                 Jump executes when             │
│      │     │                 player lands within            │
│      └─────┘                 buffer window                  │
│   ═══════════════                                           │
│                                                             │
│   Without buffer: Jump missed, player frustrated            │
│   With buffer: Jump executes, smooth gameplay               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. One-Way Platforms

```
┌─────────────────────────────────────────────────────────────┐
│                  One-Way Platform Logic                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Allow collision only when:                                │
│   1. Player is above platform                               │
│   2. Player is moving downward                              │
│                                                             │
│      ┌───┐                    ┌───┐                         │
│      │ P │ ▼ Moving down      │ P │ ▲ Moving up             │
│      └───┘                    └───┘                         │
│   ═══════════                ─────────                      │
│    Collide!               Pass through                      │
│                                                             │
│        ┌───┐                                                │
│   ═════│ P │═════                                           │
│        └───┘                                                │
│     Pass through (inside platform)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5. Jump Curves and Gravity

```
┌─────────────────────────────────────────────────────────────┐
│                    Jump Arc Design                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Height                                                    │
│      ▲                                                      │
│      │         ╭───╮                                        │
│      │       ╱       ╲                                      │
│      │     ╱           ╲ ← Variable gravity                │
│      │   ╱               ╲   for snappier descent          │
│      │ ╱                   ╲                                │
│      └──────────────────────────► Time                      │
│                                                             │
│   Physics equations:                                        │
│   • Jump velocity = √(2 × gravity × jumpHeight)            │
│   • Time to apex = jumpVelocity / gravity                  │
│   • Fall gravity = jumpGravity × fallMultiplier            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Code Examples

### Basic Character Controller (Unity C#)

```csharp
using UnityEngine;

[RequireComponent(typeof(BoxCollider2D))]
public class PlatformerController : MonoBehaviour
{
    [Header("Movement")]
    [SerializeField] private float moveSpeed = 8f;
    [SerializeField] private float acceleration = 50f;
    [SerializeField] private float deceleration = 50f;
    [SerializeField] private float airAcceleration = 30f;

    [Header("Jump")]
    [SerializeField] private float jumpHeight = 3f;
    [SerializeField] private float jumpTimeToApex = 0.4f;
    [SerializeField] private float fallGravityMultiplier = 2f;
    [SerializeField] private float maxFallSpeed = 20f;

    [Header("Assists")]
    [SerializeField] private float coyoteTime = 0.1f;
    [SerializeField] private float jumpBufferTime = 0.1f;

    [Header("Collision")]
    [SerializeField] private LayerMask groundLayer;
    [SerializeField] private float groundCheckDistance = 0.05f;
    [SerializeField] private int horizontalRayCount = 4;
    [SerializeField] private int verticalRayCount = 3;

    // Calculated physics values
    private float gravity;
    private float jumpVelocity;

    // State
    private Vector2 velocity;
    private bool isGrounded;
    private bool wasGrounded;
    private float lastGroundedTime;
    private float lastJumpPressedTime;
    private bool jumpHeld;

    // Components
    private BoxCollider2D boxCollider;
    private RaycastOrigins raycastOrigins;
    private CollisionInfo collisionInfo;

    // Skin width prevents getting stuck in geometry
    private const float SkinWidth = 0.015f;

    private struct RaycastOrigins
    {
        public Vector2 topLeft, topRight;
        public Vector2 bottomLeft, bottomRight;
    }

    private struct CollisionInfo
    {
        public bool above, below;
        public bool left, right;
        public bool climbingSlope, descendingSlope;
        public float slopeAngle, slopeAngleOld;

        public void Reset()
        {
            above = below = left = right = false;
            climbingSlope = descendingSlope = false;
            slopeAngleOld = slopeAngle;
            slopeAngle = 0;
        }
    }

    private void Awake()
    {
        boxCollider = GetComponent<BoxCollider2D>();
        CalculatePhysicsValues();
    }

    private void CalculatePhysicsValues()
    {
        // Calculate gravity and jump velocity from desired jump height and time
        // Using kinematic equations: h = v*t - 0.5*g*t^2 and v = g*t
        gravity = (2 * jumpHeight) / (jumpTimeToApex * jumpTimeToApex);
        jumpVelocity = gravity * jumpTimeToApex;
    }

    private void Update()
    {
        // Process input
        float horizontalInput = Input.GetAxisRaw("Horizontal");
        bool jumpPressed = Input.GetButtonDown("Jump");
        jumpHeld = Input.GetButton("Jump");

        if (jumpPressed)
        {
            lastJumpPressedTime = Time.time;
        }

        // Apply horizontal movement
        ApplyHorizontalMovement(horizontalInput);

        // Handle jumping
        HandleJump();

        // Apply gravity
        ApplyGravity();
    }

    private void FixedUpdate()
    {
        // Store previous grounded state
        wasGrounded = isGrounded;

        // Update raycast origins based on current position
        UpdateRaycastOrigins();

        // Reset collision info
        collisionInfo.Reset();

        // Move with collision detection
        Vector2 deltaMovement = velocity * Time.fixedDeltaTime;

        if (deltaMovement.x != 0)
        {
            HorizontalCollisions(ref deltaMovement);
        }

        if (deltaMovement.y != 0)
        {
            VerticalCollisions(ref deltaMovement);
        }

        // Apply movement
        transform.Translate(deltaMovement);

        // Update grounded state
        isGrounded = collisionInfo.below;

        if (isGrounded)
        {
            lastGroundedTime = Time.time;
        }

        // Zero velocity on collision
        if (collisionInfo.above || collisionInfo.below)
        {
            velocity.y = 0;
        }
        if (collisionInfo.left || collisionInfo.right)
        {
            velocity.x = 0;
        }
    }

    private void ApplyHorizontalMovement(float input)
    {
        float targetSpeed = input * moveSpeed;
        float accel = isGrounded ? acceleration : airAcceleration;

        if (Mathf.Abs(input) > 0.01f)
        {
            // Accelerate towards target speed
            velocity.x = Mathf.MoveTowards(velocity.x, targetSpeed, accel * Time.deltaTime);
        }
        else
        {
            // Decelerate when no input
            velocity.x = Mathf.MoveTowards(velocity.x, 0, deceleration * Time.deltaTime);
        }
    }

    private void HandleJump()
    {
        // Check coyote time and jump buffer
        bool canCoyoteJump = (Time.time - lastGroundedTime) <= coyoteTime;
        bool hasBufferedJump = (Time.time - lastJumpPressedTime) <= jumpBufferTime;

        if (hasBufferedJump && (isGrounded || canCoyoteJump))
        {
            // Execute jump
            velocity.y = jumpVelocity;
            lastJumpPressedTime = 0; // Consume the buffer
            lastGroundedTime = 0;    // Consume coyote time
        }

        // Variable jump height - cut jump short if button released
        if (!jumpHeld && velocity.y > 0)
        {
            velocity.y *= 0.5f;
        }
    }

    private void ApplyGravity()
    {
        // Apply stronger gravity when falling for snappier feel
        float currentGravity = gravity;
        if (velocity.y < 0)
        {
            currentGravity *= fallGravityMultiplier;
        }

        velocity.y -= currentGravity * Time.deltaTime;

        // Cap fall speed
        velocity.y = Mathf.Max(velocity.y, -maxFallSpeed);
    }

    private void UpdateRaycastOrigins()
    {
        Bounds bounds = boxCollider.bounds;
        bounds.Expand(SkinWidth * -2);

        raycastOrigins.bottomLeft = new Vector2(bounds.min.x, bounds.min.y);
        raycastOrigins.bottomRight = new Vector2(bounds.max.x, bounds.min.y);
        raycastOrigins.topLeft = new Vector2(bounds.min.x, bounds.max.y);
        raycastOrigins.topRight = new Vector2(bounds.max.x, bounds.max.y);
    }

    private void HorizontalCollisions(ref Vector2 deltaMovement)
    {
        float directionX = Mathf.Sign(deltaMovement.x);
        float rayLength = Mathf.Abs(deltaMovement.x) + SkinWidth;

        float spacing = (raycastOrigins.topLeft.y - raycastOrigins.bottomLeft.y) / (horizontalRayCount - 1);

        for (int i = 0; i < horizontalRayCount; i++)
        {
            Vector2 rayOrigin = (directionX == -1) ? raycastOrigins.bottomLeft : raycastOrigins.bottomRight;
            rayOrigin += Vector2.up * (spacing * i);

            RaycastHit2D hit = Physics2D.Raycast(rayOrigin, Vector2.right * directionX, rayLength, groundLayer);

            Debug.DrawRay(rayOrigin, Vector2.right * directionX * rayLength, Color.red);

            if (hit)
            {
                deltaMovement.x = (hit.distance - SkinWidth) * directionX;
                rayLength = hit.distance;

                collisionInfo.left = directionX == -1;
                collisionInfo.right = directionX == 1;
            }
        }
    }

    private void VerticalCollisions(ref Vector2 deltaMovement)
    {
        float directionY = Mathf.Sign(deltaMovement.y);
        float rayLength = Mathf.Abs(deltaMovement.y) + SkinWidth;

        float spacing = (raycastOrigins.bottomRight.x - raycastOrigins.bottomLeft.x) / (verticalRayCount - 1);

        for (int i = 0; i < verticalRayCount; i++)
        {
            Vector2 rayOrigin = (directionY == -1) ? raycastOrigins.bottomLeft : raycastOrigins.topLeft;
            rayOrigin += Vector2.right * (spacing * i + deltaMovement.x);

            RaycastHit2D hit = Physics2D.Raycast(rayOrigin, Vector2.up * directionY, rayLength, groundLayer);

            Debug.DrawRay(rayOrigin, Vector2.up * directionY * rayLength, Color.green);

            if (hit)
            {
                deltaMovement.y = (hit.distance - SkinWidth) * directionY;
                rayLength = hit.distance;

                collisionInfo.below = directionY == -1;
                collisionInfo.above = directionY == 1;
            }
        }
    }
}
```

### Platformer Controller (Godot GDScript)

```gdscript
extends CharacterBody2D
class_name PlatformerController

# Movement parameters
@export_group("Movement")
@export var move_speed: float = 300.0
@export var acceleration: float = 2000.0
@export var deceleration: float = 2000.0
@export var air_acceleration: float = 1200.0

# Jump parameters
@export_group("Jump")
@export var jump_height: float = 64.0
@export var jump_time_to_apex: float = 0.4
@export var fall_gravity_multiplier: float = 2.0
@export var max_fall_speed: float = 600.0
@export var max_jumps: int = 1

# Assist parameters
@export_group("Assists")
@export var coyote_time: float = 0.1
@export var jump_buffer_time: float = 0.1

# Wall mechanics
@export_group("Wall Mechanics")
@export var wall_slide_enabled: bool = true
@export var wall_slide_speed: float = 100.0
@export var wall_jump_enabled: bool = true
@export var wall_jump_velocity: Vector2 = Vector2(400, -300)

# Calculated values
var gravity: float
var jump_velocity: float

# State tracking
var jumps_remaining: int
var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0
var is_wall_sliding: bool = false
var wall_direction: int = 0

func _ready() -> void:
    calculate_physics_values()

func calculate_physics_values() -> void:
    # h = v*t - 0.5*g*t^2, at apex v = g*t
    # So: h = g*t*t - 0.5*g*t^2 = 0.5*g*t^2
    # Therefore: g = 2*h / t^2
    gravity = (2.0 * jump_height) / (jump_time_to_apex * jump_time_to_apex)
    jump_velocity = gravity * jump_time_to_apex

func _physics_process(delta: float) -> void:
    var was_on_floor = is_on_floor()

    # Update timers
    update_timers(delta, was_on_floor)

    # Get input
    var input_direction = Input.get_axis("move_left", "move_right")
    var jump_pressed = Input.is_action_just_pressed("jump")
    var jump_held = Input.is_action_pressed("jump")

    # Buffer jump input
    if jump_pressed:
        jump_buffer_timer = jump_buffer_time

    # Apply horizontal movement
    apply_horizontal_movement(input_direction, delta)

    # Check wall sliding
    check_wall_slide(input_direction)

    # Handle jumping
    handle_jump(jump_held)

    # Apply gravity
    apply_gravity(delta)

    # Move and slide
    move_and_slide()

    # Post-movement updates
    if is_on_floor():
        jumps_remaining = max_jumps

func update_timers(delta: float, was_on_floor: bool) -> void:
    # Coyote time - grace period after leaving ground
    if was_on_floor and not is_on_floor():
        coyote_timer = coyote_time
    elif coyote_timer > 0:
        coyote_timer -= delta

    # Jump buffer countdown
    if jump_buffer_timer > 0:
        jump_buffer_timer -= delta

func apply_horizontal_movement(input_direction: float, delta: float) -> void:
    var target_speed = input_direction * move_speed
    var current_acceleration = acceleration if is_on_floor() else air_acceleration

    if abs(input_direction) > 0.1:
        # Accelerate towards target
        velocity.x = move_toward(velocity.x, target_speed, current_acceleration * delta)
    else:
        # Decelerate when no input
        velocity.x = move_toward(velocity.x, 0, deceleration * delta)

func check_wall_slide(input_direction: float) -> void:
    if not wall_slide_enabled:
        is_wall_sliding = false
        return

    wall_direction = 0
    if is_on_wall():
        # Determine wall direction
        var collision = get_last_slide_collision()
        if collision:
            wall_direction = -1 if collision.get_normal().x > 0 else 1

    # Wall slide conditions
    is_wall_sliding = (
        is_on_wall() and
        not is_on_floor() and
        velocity.y > 0 and
        input_direction == wall_direction
    )

func handle_jump(jump_held: bool) -> void:
    var can_coyote_jump = coyote_timer > 0
    var has_buffered_jump = jump_buffer_timer > 0
    var can_regular_jump = is_on_floor() or can_coyote_jump
    var can_air_jump = jumps_remaining > 0 and not can_regular_jump

    # Wall jump
    if has_buffered_jump and wall_jump_enabled and is_wall_sliding:
        velocity.y = wall_jump_velocity.y
        velocity.x = -wall_direction * wall_jump_velocity.x
        jump_buffer_timer = 0
        coyote_timer = 0
        is_wall_sliding = false
        return

    # Regular or coyote jump
    if has_buffered_jump and can_regular_jump:
        velocity.y = -jump_velocity
        jump_buffer_timer = 0
        coyote_timer = 0
        jumps_remaining = max_jumps - 1
        return

    # Air jump (double jump)
    if has_buffered_jump and can_air_jump:
        velocity.y = -jump_velocity
        jump_buffer_timer = 0
        jumps_remaining -= 1
        return

    # Variable jump height - cut jump short when button released
    if not jump_held and velocity.y < 0:
        velocity.y *= 0.5

func apply_gravity(delta: float) -> void:
    if is_wall_sliding:
        # Slower fall when wall sliding
        velocity.y = min(velocity.y + gravity * delta * 0.1, wall_slide_speed)
    else:
        # Normal or enhanced gravity
        var current_gravity = gravity
        if velocity.y > 0:
            current_gravity *= fall_gravity_multiplier

        velocity.y += current_gravity * delta
        velocity.y = min(velocity.y, max_fall_speed)
```

### Advanced Movement: Dash Mechanic

```csharp
// Add to PlatformerController class
[Header("Dash")]
[SerializeField] private float dashSpeed = 20f;
[SerializeField] private float dashDuration = 0.15f;
[SerializeField] private float dashCooldown = 0.5f;
[SerializeField] private bool dashResetOnGround = true;
[SerializeField] private AnimationCurve dashSpeedCurve;

private bool canDash = true;
private bool isDashing = false;
private float dashTimer;
private float dashCooldownTimer;
private Vector2 dashDirection;

private void HandleDash()
{
    // Cooldown timer
    if (dashCooldownTimer > 0)
    {
        dashCooldownTimer -= Time.deltaTime;
    }

    // Reset dash on ground
    if (dashResetOnGround && isGrounded && !canDash && dashCooldownTimer <= 0)
    {
        canDash = true;
    }

    // Start dash
    if (Input.GetButtonDown("Dash") && canDash && !isDashing)
    {
        StartDash();
    }

    // Process active dash
    if (isDashing)
    {
        ProcessDash();
    }
}

private void StartDash()
{
    isDashing = true;
    canDash = false;
    dashTimer = 0;

    // Determine dash direction
    float inputX = Input.GetAxisRaw("Horizontal");
    float inputY = Input.GetAxisRaw("Vertical");

    if (Mathf.Abs(inputX) > 0.1f || Mathf.Abs(inputY) > 0.1f)
    {
        dashDirection = new Vector2(inputX, inputY).normalized;
    }
    else
    {
        // Dash in facing direction if no input
        dashDirection = new Vector2(transform.localScale.x > 0 ? 1 : -1, 0);
    }

    // Cancel vertical momentum
    velocity.y = 0;

    // Trigger dash effects (particles, screen shake, etc.)
    OnDashStart?.Invoke(dashDirection);
}

private void ProcessDash()
{
    dashTimer += Time.deltaTime;

    if (dashTimer >= dashDuration)
    {
        EndDash();
        return;
    }

    // Apply dash velocity with optional curve
    float speedMultiplier = dashSpeedCurve != null
        ? dashSpeedCurve.Evaluate(dashTimer / dashDuration)
        : 1f;

    velocity = dashDirection * dashSpeed * speedMultiplier;
}

private void EndDash()
{
    isDashing = false;
    dashCooldownTimer = dashCooldown;

    // Preserve some momentum after dash
    velocity *= 0.5f;

    OnDashEnd?.Invoke();
}

public event System.Action<Vector2> OnDashStart;
public event System.Action OnDashEnd;
```

### One-Way Platform Handler

```csharp
public class OneWayPlatform : MonoBehaviour
{
    [SerializeField] private float dropThroughTime = 0.3f;

    private Collider2D platformCollider;
    private HashSet<Collider2D> ignoredColliders = new HashSet<Collider2D>();

    private void Awake()
    {
        platformCollider = GetComponent<Collider2D>();
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        // Check if player is below platform or moving up
        PlatformerController player = collision.gameObject.GetComponent<PlatformerController>();
        if (player == null) return;

        ContactPoint2D contact = collision.GetContact(0);

        // If collision is from below (player moving up) or from side, ignore
        if (contact.normal.y <= 0)
        {
            Physics2D.IgnoreCollision(collision.collider, platformCollider, true);
            ignoredColliders.Add(collision.collider);
        }
    }

    private void OnCollisionStay2D(Collision2D collision)
    {
        // Re-enable collision when player is above and moving down
        if (ignoredColliders.Contains(collision.collider))
        {
            Rigidbody2D rb = collision.gameObject.GetComponent<Rigidbody2D>();
            if (rb != null && rb.velocity.y <= 0)
            {
                float playerBottom = collision.collider.bounds.min.y;
                float platformTop = platformCollider.bounds.max.y;

                if (playerBottom >= platformTop - 0.1f)
                {
                    Physics2D.IgnoreCollision(collision.collider, platformCollider, false);
                    ignoredColliders.Remove(collision.collider);
                }
            }
        }
    }

    public void DropThrough(Collider2D playerCollider)
    {
        StartCoroutine(DropThroughCoroutine(playerCollider));
    }

    private IEnumerator DropThroughCoroutine(Collider2D playerCollider)
    {
        Physics2D.IgnoreCollision(playerCollider, platformCollider, true);
        ignoredColliders.Add(playerCollider);

        yield return new WaitForSeconds(dropThroughTime);

        // Re-enable if player has passed through
        float playerBottom = playerCollider.bounds.min.y;
        float platformTop = platformCollider.bounds.max.y;

        if (playerBottom < platformTop)
        {
            // Player is still below, wait until they're above or far below
            yield return new WaitUntil(() =>
            {
                float bottom = playerCollider.bounds.min.y;
                float top = platformCollider.bounds.max.y;
                return bottom >= top || bottom < platformCollider.bounds.min.y - 1f;
            });
        }

        Physics2D.IgnoreCollision(playerCollider, platformCollider, false);
        ignoredColliders.Remove(playerCollider);
    }
}
```

### Moving Platform Support

```csharp
public class MovingPlatform : MonoBehaviour
{
    [SerializeField] private Vector2[] waypoints;
    [SerializeField] private float speed = 2f;
    [SerializeField] private float waitTime = 0.5f;
    [SerializeField] private bool loop = true;

    private int currentWaypointIndex = 0;
    private Vector3 lastPosition;
    private List<Transform> passengers = new List<Transform>();

    private void Start()
    {
        lastPosition = transform.position;
        if (waypoints.Length > 0)
        {
            transform.position = waypoints[0];
        }
    }

    private void FixedUpdate()
    {
        if (waypoints.Length < 2) return;

        // Store current position
        lastPosition = transform.position;

        // Move towards current waypoint
        Vector2 targetPosition = waypoints[currentWaypointIndex];
        transform.position = Vector2.MoveTowards(
            transform.position,
            targetPosition,
            speed * Time.fixedDeltaTime
        );

        // Check if reached waypoint
        if (Vector2.Distance(transform.position, targetPosition) < 0.01f)
        {
            StartCoroutine(WaitAndMoveToNext());
        }

        // Move passengers
        Vector3 deltaMovement = transform.position - lastPosition;
        MovePassengers(deltaMovement);
    }

    private IEnumerator WaitAndMoveToNext()
    {
        yield return new WaitForSeconds(waitTime);

        currentWaypointIndex++;
        if (currentWaypointIndex >= waypoints.Length)
        {
            if (loop)
            {
                currentWaypointIndex = 0;
            }
            else
            {
                System.Array.Reverse(waypoints);
                currentWaypointIndex = 1;
            }
        }
    }

    private void MovePassengers(Vector3 deltaMovement)
    {
        foreach (Transform passenger in passengers)
        {
            if (passenger != null)
            {
                // Move passenger with platform
                passenger.position += deltaMovement;
            }
        }
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        // Check if collision is from above
        ContactPoint2D contact = collision.GetContact(0);
        if (contact.normal.y < -0.5f)
        {
            passengers.Add(collision.transform);
        }
    }

    private void OnCollisionExit2D(Collision2D collision)
    {
        passengers.Remove(collision.transform);
    }

    private void OnDrawGizmos()
    {
        if (waypoints == null || waypoints.Length < 2) return;

        Gizmos.color = Color.cyan;
        for (int i = 0; i < waypoints.Length; i++)
        {
            Gizmos.DrawWireSphere(waypoints[i], 0.2f);
            if (i < waypoints.Length - 1)
            {
                Gizmos.DrawLine(waypoints[i], waypoints[i + 1]);
            }
            else if (loop)
            {
                Gizmos.DrawLine(waypoints[i], waypoints[0]);
            }
        }
    }
}
```

### Slope Handling

```csharp
// Add to collision detection
[Header("Slopes")]
[SerializeField] private float maxSlopeAngle = 55f;
[SerializeField] private float slopeCheckDistance = 0.5f;

private void ClimbSlope(ref Vector2 deltaMovement, float slopeAngle)
{
    float moveDistance = Mathf.Abs(deltaMovement.x);
    float climbVelocityY = Mathf.Sin(slopeAngle * Mathf.Deg2Rad) * moveDistance;

    if (deltaMovement.y <= climbVelocityY)
    {
        deltaMovement.y = climbVelocityY;
        deltaMovement.x = Mathf.Cos(slopeAngle * Mathf.Deg2Rad) * moveDistance * Mathf.Sign(deltaMovement.x);
        collisionInfo.below = true;
        collisionInfo.climbingSlope = true;
        collisionInfo.slopeAngle = slopeAngle;
    }
}

private void DescendSlope(ref Vector2 deltaMovement)
{
    float directionX = Mathf.Sign(deltaMovement.x);
    Vector2 rayOrigin = (directionX == -1) ? raycastOrigins.bottomRight : raycastOrigins.bottomLeft;

    RaycastHit2D hit = Physics2D.Raycast(rayOrigin, Vector2.down, Mathf.Infinity, groundLayer);

    if (hit)
    {
        float slopeAngle = Vector2.Angle(hit.normal, Vector2.up);

        if (slopeAngle != 0 && slopeAngle <= maxSlopeAngle)
        {
            // Check if descending (moving down the slope)
            if (Mathf.Sign(hit.normal.x) == directionX)
            {
                // Check if close enough to slope
                if (hit.distance - SkinWidth <= Mathf.Tan(slopeAngle * Mathf.Deg2Rad) * Mathf.Abs(deltaMovement.x))
                {
                    float moveDistance = Mathf.Abs(deltaMovement.x);
                    float descendVelocityY = Mathf.Sin(slopeAngle * Mathf.Deg2Rad) * moveDistance;

                    deltaMovement.x = Mathf.Cos(slopeAngle * Mathf.Deg2Rad) * moveDistance * Mathf.Sign(deltaMovement.x);
                    deltaMovement.y -= descendVelocityY;

                    collisionInfo.slopeAngle = slopeAngle;
                    collisionInfo.descendingSlope = true;
                    collisionInfo.below = true;
                }
            }
        }
    }
}

private void HandleSlopeCollisions(ref Vector2 deltaMovement)
{
    float directionX = Mathf.Sign(deltaMovement.x);
    float rayLength = Mathf.Abs(deltaMovement.x) + SkinWidth;
    Vector2 rayOrigin = (directionX == -1) ? raycastOrigins.bottomLeft : raycastOrigins.bottomRight;

    RaycastHit2D hit = Physics2D.Raycast(rayOrigin, Vector2.right * directionX, rayLength, groundLayer);

    if (hit)
    {
        float slopeAngle = Vector2.Angle(hit.normal, Vector2.up);

        if (slopeAngle <= maxSlopeAngle)
        {
            if (collisionInfo.descendingSlope && slopeAngle != collisionInfo.slopeAngleOld)
            {
                // New slope, reset
                deltaMovement.x = (hit.distance - SkinWidth) * directionX;
            }

            ClimbSlope(ref deltaMovement, slopeAngle);
        }
        else
        {
            // Too steep, treat as wall
            deltaMovement.x = (hit.distance - SkinWidth) * directionX;
        }
    }

    // Check for descending slope
    if (!collisionInfo.climbingSlope && deltaMovement.y <= 0)
    {
        DescendSlope(ref deltaMovement);
    }
}
```

## Best Practices

### 1. Parameter Organization

```csharp
[System.Serializable]
public class MovementSettings
{
    [Header("Ground Movement")]
    public float maxSpeed = 8f;
    public float acceleration = 50f;
    public float deceleration = 60f;

    [Header("Air Movement")]
    public float airMaxSpeed = 8f;
    public float airAcceleration = 30f;
    public float airDeceleration = 20f;

    [Header("Slopes")]
    public float maxClimbAngle = 50f;
    public float maxDescendAngle = 50f;
}

[System.Serializable]
public class JumpSettings
{
    [Header("Basic Jump")]
    public float height = 3f;
    public float timeToApex = 0.4f;

    [Header("Enhanced Feel")]
    public float fallMultiplier = 2f;
    public float lowJumpMultiplier = 2.5f;
    public float maxFallSpeed = 20f;

    [Header("Multi-Jump")]
    public int maxJumps = 1;
    public float doubleJumpHeightMultiplier = 0.8f;
}

[System.Serializable]
public class AssistSettings
{
    public float coyoteTime = 0.1f;
    public float jumpBuffer = 0.1f;
    public float cornerCorrection = 0.5f;
}
```

### 2. State Machine Architecture

```csharp
public abstract class PlayerState
{
    protected PlatformerController controller;

    public PlayerState(PlatformerController controller)
    {
        this.controller = controller;
    }

    public virtual void Enter() { }
    public virtual void Exit() { }
    public abstract void Update();
    public abstract void FixedUpdate();
    public abstract PlayerState CheckTransitions();
}

public class GroundedState : PlayerState
{
    public GroundedState(PlatformerController controller) : base(controller) { }

    public override void Update()
    {
        controller.HandleHorizontalInput();
    }

    public override void FixedUpdate()
    {
        controller.ApplyGroundMovement();
    }

    public override PlayerState CheckTransitions()
    {
        if (!controller.IsGrounded)
            return new AirborneState(controller);

        if (controller.JumpBuffered && controller.CanJump)
            return new JumpingState(controller);

        if (controller.DashPressed && controller.CanDash)
            return new DashingState(controller);

        return this;
    }
}
```

### 3. Debug Visualization

```csharp
#if UNITY_EDITOR
public class PlatformerDebug : MonoBehaviour
{
    [SerializeField] private PlatformerController controller;
    [SerializeField] private bool showVelocity = true;
    [SerializeField] private bool showGroundRays = true;
    [SerializeField] private bool showCollisionBox = true;

    private void OnDrawGizmos()
    {
        if (controller == null) return;

        if (showVelocity)
        {
            Gizmos.color = Color.yellow;
            Gizmos.DrawLine(
                transform.position,
                transform.position + (Vector3)controller.Velocity * 0.1f
            );
        }

        if (showCollisionBox)
        {
            var collider = controller.GetComponent<BoxCollider2D>();
            Gizmos.color = controller.IsGrounded ? Color.green : Color.red;
            Gizmos.DrawWireCube(collider.bounds.center, collider.bounds.size);
        }
    }

    private void OnGUI()
    {
        GUILayout.BeginArea(new Rect(10, 10, 200, 150));
        GUILayout.Label($"Velocity: {controller.Velocity}");
        GUILayout.Label($"Grounded: {controller.IsGrounded}");
        GUILayout.Label($"Jumps: {controller.JumpsRemaining}");
        GUILayout.Label($"State: {controller.CurrentState}");
        GUILayout.EndArea();
    }
}
#endif
```

### 4. Replay-Safe Input

```csharp
public struct InputFrame
{
    public float horizontal;
    public bool jumpPressed;
    public bool jumpHeld;
    public bool dashPressed;
    public int frameNumber;
}

public class InputRecorder : MonoBehaviour
{
    private List<InputFrame> recordedInputs = new List<InputFrame>();
    private int currentFrame = 0;
    private bool isReplaying = false;

    public InputFrame GetInput()
    {
        if (isReplaying && currentFrame < recordedInputs.Count)
        {
            return recordedInputs[currentFrame++];
        }

        InputFrame frame = new InputFrame
        {
            horizontal = Input.GetAxisRaw("Horizontal"),
            jumpPressed = Input.GetButtonDown("Jump"),
            jumpHeld = Input.GetButton("Jump"),
            dashPressed = Input.GetButtonDown("Dash"),
            frameNumber = currentFrame
        };

        recordedInputs.Add(frame);
        currentFrame++;

        return frame;
    }
}
```

## Common Pitfalls

### 1. Frame-Rate Dependent Physics

```csharp
// BAD: Movement depends on frame rate
void Update()
{
    transform.position += velocity;  // Faster at higher FPS!
}

// GOOD: Frame-rate independent
void FixedUpdate()
{
    transform.position += velocity * Time.fixedDeltaTime;
}
```

### 2. Tunneling Through Thin Platforms

```csharp
// BAD: Can pass through thin objects at high speed
void MovePlayer()
{
    transform.position += velocity * Time.deltaTime;
}

// GOOD: Use continuous collision detection or sweep tests
void MovePlayer()
{
    Vector2 movement = velocity * Time.deltaTime;
    RaycastHit2D hit = Physics2D.BoxCast(
        transform.position,
        colliderSize,
        0f,
        movement.normalized,
        movement.magnitude,
        groundLayer
    );

    if (hit)
    {
        transform.position += (Vector3)movement.normalized * (hit.distance - skinWidth);
    }
    else
    {
        transform.position += (Vector3)movement;
    }
}
```

### 3. Inconsistent Ground Detection

```csharp
// BAD: Single raycast misses edges
bool IsGrounded()
{
    return Physics2D.Raycast(transform.position, Vector2.down, 0.1f, groundLayer);
}

// GOOD: Multiple raycasts for edge coverage
bool IsGrounded()
{
    Bounds bounds = collider.bounds;
    float spacing = bounds.size.x / (rayCount - 1);

    for (int i = 0; i < rayCount; i++)
    {
        Vector2 origin = new Vector2(bounds.min.x + spacing * i, bounds.min.y);
        if (Physics2D.Raycast(origin, Vector2.down, groundCheckDistance, groundLayer))
        {
            return true;
        }
    }
    return false;
}
```

### 4. Snappy Slope Climbing

```csharp
// BAD: Player snaps to slope, looks jerky
void OnSlope(float angle)
{
    velocity.y = CalculateSlopeY(angle);
}

// GOOD: Smooth transition onto slopes
void OnSlope(float angle)
{
    float targetY = CalculateSlopeY(angle);
    velocity.y = Mathf.Lerp(velocity.y, targetY, slopeTransitionSpeed * Time.deltaTime);
}
```

### 5. Missing Edge Cases

```csharp
// Handle corner correction (helps player land on platforms they barely missed)
void CorrectCorner(ref Vector2 deltaMovement)
{
    if (!collisionInfo.above || deltaMovement.y >= 0) return;

    float correctionDistance = cornerCorrectionRange;

    // Check left
    Vector2 leftOrigin = raycastOrigins.topLeft + Vector2.up * Mathf.Abs(deltaMovement.y);
    RaycastHit2D leftHit = Physics2D.Raycast(leftOrigin, Vector2.left, correctionDistance, groundLayer);

    // Check right
    Vector2 rightOrigin = raycastOrigins.topRight + Vector2.up * Mathf.Abs(deltaMovement.y);
    RaycastHit2D rightHit = Physics2D.Raycast(rightOrigin, Vector2.right, correctionDistance, groundLayer);

    if (!leftHit && rightHit)
    {
        // Nudge left
        deltaMovement.x -= correctionDistance - rightHit.distance;
    }
    else if (leftHit && !rightHit)
    {
        // Nudge right
        deltaMovement.x += correctionDistance - leftHit.distance;
    }
}
```

## Performance Considerations

### 1. Raycast Optimization

```csharp
// Cache raycast results
private RaycastHit2D[] raycastHits = new RaycastHit2D[8];

void OptimizedCollisionCheck()
{
    // Use non-allocating raycast
    int hitCount = Physics2D.RaycastNonAlloc(
        origin,
        direction,
        raycastHits,
        distance,
        layerMask
    );

    for (int i = 0; i < hitCount; i++)
    {
        ProcessHit(raycastHits[i]);
    }
}
```

### 2. Layer-Based Collision Filtering

```csharp
// Set up collision matrix in Project Settings
// Use layer masks to minimize checks

[SerializeField] private LayerMask groundLayer;
[SerializeField] private LayerMask platformLayer;
[SerializeField] private LayerMask hazardLayer;

private LayerMask combinedGroundLayers;

void Start()
{
    combinedGroundLayers = groundLayer | platformLayer;
}
```

### 3. Spatial Partitioning for Many Objects

```csharp
// For games with many moving platforms/enemies
public class SpatialHash
{
    private Dictionary<int, List<Collider2D>> cells;
    private float cellSize;

    public List<Collider2D> GetNearby(Vector2 position, float radius)
    {
        List<Collider2D> nearby = new List<Collider2D>();

        int minX = Mathf.FloorToInt((position.x - radius) / cellSize);
        int maxX = Mathf.FloorToInt((position.x + radius) / cellSize);
        int minY = Mathf.FloorToInt((position.y - radius) / cellSize);
        int maxY = Mathf.FloorToInt((position.y + radius) / cellSize);

        for (int x = minX; x <= maxX; x++)
        {
            for (int y = minY; y <= maxY; y++)
            {
                int hash = HashCell(x, y);
                if (cells.TryGetValue(hash, out var cell))
                {
                    nearby.AddRange(cell);
                }
            }
        }

        return nearby;
    }
}
```

### 4. Object Pooling for Effects

```csharp
public class DustParticlePool : MonoBehaviour
{
    [SerializeField] private GameObject dustPrefab;
    [SerializeField] private int poolSize = 20;

    private Queue<ParticleSystem> pool;

    void Start()
    {
        pool = new Queue<ParticleSystem>();
        for (int i = 0; i < poolSize; i++)
        {
            var obj = Instantiate(dustPrefab, transform);
            obj.SetActive(false);
            pool.Enqueue(obj.GetComponent<ParticleSystem>());
        }
    }

    public void SpawnDust(Vector2 position)
    {
        if (pool.Count == 0) return;

        var particle = pool.Dequeue();
        particle.transform.position = position;
        particle.gameObject.SetActive(true);
        particle.Play();

        StartCoroutine(ReturnToPool(particle));
    }

    private IEnumerator ReturnToPool(ParticleSystem particle)
    {
        yield return new WaitForSeconds(particle.main.duration);
        particle.gameObject.SetActive(false);
        pool.Enqueue(particle);
    }
}
```

## Real-World Scenarios

### Scenario 1: Celeste-Style Movement

```csharp
public class CelesteController : PlatformerController
{
    [Header("Celeste Mechanics")]
    [SerializeField] private float climbSpeed = 3f;
    [SerializeField] private float climbStamina = 100f;
    [SerializeField] private float staminaDrainRate = 10f;
    [SerializeField] private float wallJumpHBoost = 8f;
    [SerializeField] private float superDashSpeed = 25f;

    private float currentStamina;
    private bool isClimbing;

    protected override void HandleWallInteraction()
    {
        if (IsOnWall && Input.GetButton("Grab") && currentStamina > 0)
        {
            EnterClimbState();
        }
    }

    private void EnterClimbState()
    {
        isClimbing = true;
        velocity = Vector2.zero;

        float climbInput = Input.GetAxisRaw("Vertical");

        if (climbInput > 0)
        {
            // Climbing up drains stamina faster
            velocity.y = climbSpeed;
            currentStamina -= staminaDrainRate * 2 * Time.deltaTime;
        }
        else if (climbInput < 0)
        {
            // Sliding down
            velocity.y = -climbSpeed * 2;
        }
        else
        {
            // Holding still
            currentStamina -= staminaDrainRate * Time.deltaTime;
        }

        if (currentStamina <= 0)
        {
            ExitClimbState();
        }
    }

    protected override void HandleDash()
    {
        base.HandleDash();

        // Wavedash: Dash into ground for speed boost
        if (isDashing && isGrounded && dashDirection.y < -0.5f)
        {
            EndDash();
            velocity.x = Mathf.Sign(dashDirection.x) * superDashSpeed;
        }
    }

    protected override void OnLand()
    {
        base.OnLand();
        currentStamina = climbStamina; // Restore stamina on landing
    }
}
```

### Scenario 2: Mega Man-Style Movement

```csharp
public class MegaManController : PlatformerController
{
    [Header("Mega Man Style")]
    [SerializeField] private float slideSpeed = 10f;
    [SerializeField] private float slideDuration = 0.5f;
    [SerializeField] private float slideColliderHeight = 0.5f;

    private bool isSliding;
    private float normalColliderHeight;
    private Vector2 normalColliderOffset;

    protected override void HandleSpecialMoves()
    {
        // Slide: down + jump while grounded
        if (isGrounded && Input.GetAxisRaw("Vertical") < -0.5f && Input.GetButtonDown("Jump"))
        {
            StartSlide();
        }
    }

    private void StartSlide()
    {
        isSliding = true;

        // Shrink collider
        normalColliderHeight = boxCollider.size.y;
        normalColliderOffset = boxCollider.offset;

        boxCollider.size = new Vector2(boxCollider.size.x, slideColliderHeight);
        boxCollider.offset = new Vector2(boxCollider.offset.x, slideColliderHeight / 2);

        StartCoroutine(SlideCoroutine());
    }

    private IEnumerator SlideCoroutine()
    {
        float slideTimer = 0;
        int slideDirection = FacingDirection;

        while (slideTimer < slideDuration && isSliding)
        {
            velocity.x = slideDirection * slideSpeed;
            slideTimer += Time.deltaTime;

            // Cancel slide if hit wall
            if ((slideDirection > 0 && collisionInfo.right) ||
                (slideDirection < 0 && collisionInfo.left))
            {
                break;
            }

            yield return null;
        }

        EndSlide();
    }

    private void EndSlide()
    {
        // Check if can stand up
        Vector2 checkOrigin = transform.position + Vector3.up * normalColliderHeight / 2;
        if (!Physics2D.BoxCast(checkOrigin,
            new Vector2(boxCollider.size.x * 0.9f, normalColliderHeight * 0.9f),
            0f, Vector2.up, 0.1f, groundLayer))
        {
            isSliding = false;
            boxCollider.size = new Vector2(boxCollider.size.x, normalColliderHeight);
            boxCollider.offset = normalColliderOffset;
        }
        // Else: stay crouched until space available
    }
}
```

### Scenario 3: Hollow Knight-Style Combat Movement

```csharp
public class HollowKnightController : PlatformerController
{
    [Header("Combat Movement")]
    [SerializeField] private float knockbackForce = 10f;
    [SerializeField] private float knockbackDuration = 0.2f;
    [SerializeField] private float pogoJumpForce = 12f;
    [SerializeField] private float focusSlowdown = 0.3f;

    private bool isInKnockback;
    private bool isFocusing;

    public void OnHitEnemy(Vector2 enemyPosition, bool enemyBelow)
    {
        if (enemyBelow && velocity.y < 0)
        {
            // Pogo bounce
            velocity.y = pogoJumpForce;
            ResetJumps();
        }
        else
        {
            // Recoil
            Vector2 recoilDirection = ((Vector2)transform.position - enemyPosition).normalized;
            ApplyKnockback(recoilDirection * knockbackForce * 0.5f);
        }
    }

    public void OnTakeDamage(Vector2 damageSource)
    {
        Vector2 knockbackDirection = ((Vector2)transform.position - damageSource).normalized;
        ApplyKnockback(knockbackDirection * knockbackForce);
    }

    private void ApplyKnockback(Vector2 force)
    {
        StartCoroutine(KnockbackCoroutine(force));
    }

    private IEnumerator KnockbackCoroutine(Vector2 force)
    {
        isInKnockback = true;
        velocity = force;

        float timer = 0;
        while (timer < knockbackDuration)
        {
            timer += Time.deltaTime;
            // Gradually regain control
            float controlFactor = timer / knockbackDuration;
            velocity = Vector2.Lerp(force, Vector2.zero, controlFactor);

            yield return null;
        }

        isInKnockback = false;
    }

    protected override void ApplyHorizontalMovement(float input)
    {
        if (isInKnockback) return;

        float speedMultiplier = isFocusing ? focusSlowdown : 1f;
        base.ApplyHorizontalMovement(input * speedMultiplier);
    }
}
```

## Interview Key Points

### Conceptual Questions

1. **Q: Why use kinematic bodies instead of dynamic rigidbodies for platformer characters?**

   A: Kinematic bodies provide deterministic, predictable movement essential for tight platformer controls. Dynamic bodies are affected by external forces, leading to unpredictable behavior. Kinematic bodies allow direct velocity control, making it easier to implement features like coyote time, variable jump height, and instant direction changes.

2. **Q: Explain coyote time and jump buffering.**

   A: Coyote time is a grace period (typically 50-150ms) after leaving a platform where the player can still jump. It compensates for human reaction time and makes the game feel more responsive. Jump buffering stores jump input for a short window, executing it when the player lands, preventing missed jumps from pressing slightly too early.

3. **Q: How do you handle slopes in a platformer?**

   A: Slopes require special handling: detect slope angle via raycasts, rotate velocity to match slope direction when climbing/descending, apply appropriate speed modifiers, snap to slope surface to prevent bouncing, and set a maximum climbable angle beyond which slopes become walls.

### Technical Questions

4. **Q: How would you implement variable jump height?**

   A: Track whether the jump button is held. When released during upward movement, reduce vertical velocity (multiply by 0.5 or similar). This creates the difference between taps (short hops) and holds (full jumps). The key is only cutting velocity during the ascent phase.

5. **Q: What causes tunneling and how do you prevent it?**

   A: Tunneling occurs when objects move fast enough to pass through thin colliders between frames. Solutions include: continuous collision detection (sweep tests), subdividing movement into smaller steps, capping maximum velocity, or using thicker colliders. Sweep tests are most accurate but computationally expensive.

6. **Q: How do you calculate jump parameters from desired height and time?**

   A: Using kinematic equations: gravity = (2 * height) / (time^2) and initialVelocity = gravity * time. This approach lets designers specify intuitive parameters (jump 3 units high, take 0.4 seconds to apex) rather than tweaking abstract physics values.

### Architecture Questions

7. **Q: How would you structure a platformer controller for extensibility?**

   A: Use a state machine pattern where each state (grounded, airborne, dashing, wall-sliding) encapsulates its own logic. Separate concerns: input handling, physics calculations, collision detection, and state transitions. Use composition over inheritance for mixing mechanics (wall jump module, dash module).

8. **Q: How do you ensure consistent physics across different frame rates?**

   A: Use fixed timestep updates (FixedUpdate in Unity) for physics. Store physics state separately from render state. Interpolate visual position between physics frames for smooth rendering. Never tie physics calculations directly to variable delta time.

## Further Reading

### Documentation and Tutorials

- [Unity 2D Physics Manual](https://docs.unity3d.com/Manual/Physics2DReference.html)
- [Godot CharacterBody2D Tutorial](https://docs.godotengine.org/en/stable/tutorials/physics/using_character_body_2d.html)
- [Game Programming Patterns - State](https://gameprogrammingpatterns.com/state.html)

### Technical Deep Dives

- "Math for Game Programmers: Building a Better Jump" - GDC Talk by Kyle Pittman
- "Platformer Toolkit" by Mark Brown - Interactive breakdown of platformer feel
- "Celeste & TowerFall Physics" by Matt Thorson - Source code study

### Academic References

- "Real-Time Collision Detection" by Christer Ericson
- "Game Physics Engine Development" by Ian Millington
- "Game Feel: A Game Designer's Guide to Virtual Sensation" by Steve Swink

### Open Source References

- [Celeste Source Code](https://github.com/NoelFB/Celeste) - Movement and physics reference
- [Sonic Physics Guide](https://info.sonicretro.org/Sonic_Physics_Guide) - Classic platformer physics analysis
- [Ultimate 2D Controller](https://github.com/prime31/CharacterController2D) - Unity implementation example
