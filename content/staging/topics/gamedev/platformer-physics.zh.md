---
title: 平台游戏物理实现
description: 掌握实现紧凑、响应灵敏的平台游戏物理的艺术，包括正确的碰撞检测、角色控制器和移动机制
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - 平台游戏
  - 物理
  - 碰撞检测
  - 角色控制器
  - 游戏机制
  - unity
  - godot
status: imported
origin: old/src/content/docs/gamedev/platformer-physics.zh.md
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

## 概念解释

### 什么是平台游戏物理？

平台游戏物理是指创造 2D 横版卷轴游戏"手感"的专门移动和碰撞系统。与真实物理模拟不同，平台游戏物理优先考虑玩家控制、响应性和游戏手感，而非物理准确性。

像《超级马里奥兄弟》、《蔚蓝》和《空洞骑士》这样优秀的平台游戏通过精心调整的物理参数实现了它们独特的手感。跳跃弧线、奔跑加速度、空中控制和碰撞响应都共同构成了玩家体验的"紧凑"或"飘浮"控制感。

### 为什么需要自定义物理？

虽然游戏引擎提供了内置物理，但平台游戏通常需要自定义解决方案，因为：

1. **可预测性**：玩家需要一致、可重复的移动
2. **控制力**：对游戏手感进行细粒度参数调整
3. **特殊情况**：土狼时间、跳跃缓冲、单向平台
4. **性能**：针对 2D 移动的简化计算
5. **设计自由**：违反真实物理的机制（二段跳、墙壁滑行）

### 核心组件

一个完整的平台游戏物理系统包括：

- **角色控制器**：管理移动状态和输入处理
- **碰撞检测**：确定碰撞发生的时间和位置
- **碰撞解决**：对碰撞做出适当响应
- **地面检测**：确定玩家是否在地面上
- **移动机制**：跳跃、奔跑、蹲下、冲刺等

## 核心原理

### 1. 运动学刚体 vs 动力学刚体

```
┌─────────────────────────────────────────────────────────────┐
│                    物理刚体类型                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  动力学刚体 (Rigidbody)          运动学刚体                  │
│  ┌─────────────────────┐           ┌─────────────────────┐  │
│  │ • 物理驱动          │           │ • 代码驱动          │  │
│  │ • 力与冲量          │           │ • 直接控制速度      │  │
│  │ • 真实但            │           │ • 完全控制          │  │
│  │   不可预测          │           │ • 可预测            │  │
│  │ • 受外力            │           │ • 忽略外力          │  │
│  │   影响              │           │                     │  │
│  └─────────────────────┘           └─────────────────────┘  │
│                                                             │
│  用于：移动平台、                  用于：玩家                │
│        物理对象                    角色、敌人               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. 物理循环

```
┌─────────────────────────────────────────────────────────────┐
│                      帧更新循环                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐                                          │
│   │   处理输入   │ ◄── 读取水平方向、跳跃等                 │
│   └──────┬───────┘                                          │
│          ▼                                                  │
│   ┌──────────────┐                                          │
│   │   应用重力   │ ◄── velocity.y += gravity * dt          │
│   └──────┬───────┘                                          │
│          ▼                                                  │
│   ┌──────────────┐                                          │
│   │   应用力    │ ◄── 加速度、摩擦力、阻力                  │
│   └──────┬───────┘                                          │
│          ▼                                                  │
│   ┌──────────────┐                                          │
│   │ 移动与碰撞  │ ◄── 检测碰撞、解决碰撞                    │
│   └──────┬───────┘                                          │
│          ▼                                                  │
│   ┌──────────────┐                                          │
│   │  更新状态   │ ◄── 着地、墙壁滑行等                      │
│   └──────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. 固定时间步长 vs 可变时间步长

```csharp
// 可变时间步长 - 依赖帧率（不好）
void Update() {
    velocity.y += gravity * Time.deltaTime;  // 不同帧率下不一致！
}

// 固定时间步长 - 一致的物理（好）
void FixedUpdate() {
    velocity.y += gravity * Time.fixedDeltaTime;  // 始终相同的速率
}
```

### 4. 碰撞检测方法

```
┌─────────────────────────────────────────────────────────────┐
│                    碰撞检测方法                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  离散检测                       连续检测                     │
│  ┌─────────────────┐         ┌─────────────────────────┐   │
│  │    ●───────●    │         │    ●─────────────●      │   │
│  │    t0     t1    │         │    t0    ████   t1      │   │
│  │         ████    │         │          ▲             │   │
│  │    穿透了！     │         │    扫描测试捕获         │   │
│  └─────────────────┘         └─────────────────────────┘   │
│                                                             │
│  • 快速但会错过             • 捕获所有碰撞                   │
│    薄物体                   • 更耗费性能                     │
│  • 用于慢速物体             • 用于快速物体                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 核心要点

### 1. AABB 碰撞检测

轴对齐包围盒提供快速、简单的碰撞检测：

```
┌─────────────────────────────────────────────────────────────┐
│                    AABB 重叠测试                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     盒子 A                  盒子 B                           │
│   ┌───────┐              ┌───────┐                          │
│   │(x1,y1)│              │(x1,y1)│                          │
│   │   ┌───┼──────────────┼───┐   │                          │
│   │   │   │    重叠      │   │   │                          │
│   └───┼───┘              └───┼───┘                          │
│       │(x2,y2)    (x2,y2)    │                              │
│       └──────────────────────┘                              │
│                                                             │
│   当所有条件都为真时存在重叠：                               │
│   • A.x1 < B.x2  且  A.x2 > B.x1                            │
│   • A.y1 < B.y2  且  A.y2 > B.y1                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. 射线检测用于地面检测

```
┌─────────────────────────────────────────────────────────────┐
│                    地面检测射线                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           ┌─────────┐                                       │
│           │  玩家   │                                       │
│           │  ┌───┐  │                                       │
│           │  │   │  │                                       │
│           └──┼───┼──┘                                       │
│              │   │                                          │
│        ▼     ▼   ▼     ▼    ◄── 多条射线                   │
│     ═══════════════════════     用于边缘检测                │
│                                                             │
│   单条射线：会错过边缘                                       │
│   多条射线：更好的覆盖                                       │
│   盒体投射：最精确但开销大                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. 土狼时间和跳跃缓冲

这些机制通过宽容性改善游戏手感：

```
┌─────────────────────────────────────────────────────────────┐
│                土狼时间（宽限期）                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   玩家跑出边缘：                                             │
│                                                             │
│   ┌─────┐                    ┌─────┐                        │
│   │  P  │══════              │     │══════                  │
│   │     │                    │     │                        │
│   └─────┘                    └─────┘ ← P（仍然可以跳！）     │
│          ║                          ║                       │
│          ║     t=0        t=0.1s    ║                       │
│          ║     离开       土狼      ║                       │
│          ║     地面       窗口      ║                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     跳跃缓冲                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   玩家在落地前稍早按下跳跃：                                 │
│                                                             │
│          ↓ 按下跳跃                                         │
│      ┌─────┐                                                │
│      │  P  │                 当玩家在缓冲                    │
│      │     │                 窗口内落地时                    │
│      └─────┘                 执行跳跃                        │
│   ═══════════════                                           │
│                                                             │
│   没有缓冲：跳跃失败，玩家沮丧                               │
│   有缓冲：跳跃执行，流畅游戏                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4. 单向平台

```
┌─────────────────────────────────────────────────────────────┐
│                    单向平台逻辑                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   仅在以下情况允许碰撞：                                     │
│   1. 玩家在平台上方                                         │
│   2. 玩家正在向下移动                                       │
│                                                             │
│      ┌───┐                    ┌───┐                         │
│      │ P │ ▼ 向下移动         │ P │ ▲ 向上移动              │
│      └───┘                    └───┘                         │
│   ═══════════                ─────────                      │
│     碰撞！                  穿透通过                         │
│                                                             │
│        ┌───┐                                                │
│   ═════│ P │═════                                           │
│        └───┘                                                │
│     穿透通过（在平台内部）                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5. 跳跃曲线和重力

```
┌─────────────────────────────────────────────────────────────┐
│                      跳跃弧线设计                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   高度                                                      │
│      ▲                                                      │
│      │         ╭───╮                                        │
│      │       ╱       ╲                                      │
│      │     ╱           ╲ ← 可变重力                         │
│      │   ╱               ╲   使下落更干脆                   │
│      │ ╱                   ╲                                │
│      └──────────────────────────► 时间                      │
│                                                             │
│   物理方程：                                                 │
│   • 跳跃速度 = √(2 × 重力 × 跳跃高度)                       │
│   • 到达顶点时间 = 跳跃速度 / 重力                          │
│   • 下落重力 = 跳跃重力 × 下落倍数                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 代码示例

### 基础角色控制器（Unity C#）

```csharp
using UnityEngine;

[RequireComponent(typeof(BoxCollider2D))]
public class PlatformerController : MonoBehaviour
{
    [Header("移动")]
    [SerializeField] private float moveSpeed = 8f;
    [SerializeField] private float acceleration = 50f;
    [SerializeField] private float deceleration = 50f;
    [SerializeField] private float airAcceleration = 30f;

    [Header("跳跃")]
    [SerializeField] private float jumpHeight = 3f;
    [SerializeField] private float jumpTimeToApex = 0.4f;
    [SerializeField] private float fallGravityMultiplier = 2f;
    [SerializeField] private float maxFallSpeed = 20f;

    [Header("辅助")]
    [SerializeField] private float coyoteTime = 0.1f;
    [SerializeField] private float jumpBufferTime = 0.1f;

    [Header("碰撞")]
    [SerializeField] private LayerMask groundLayer;
    [SerializeField] private float groundCheckDistance = 0.05f;
    [SerializeField] private int horizontalRayCount = 4;
    [SerializeField] private int verticalRayCount = 3;

    // 计算得出的物理值
    private float gravity;
    private float jumpVelocity;

    // 状态
    private Vector2 velocity;
    private bool isGrounded;
    private bool wasGrounded;
    private float lastGroundedTime;
    private float lastJumpPressedTime;
    private bool jumpHeld;

    // 组件
    private BoxCollider2D boxCollider;
    private RaycastOrigins raycastOrigins;
    private CollisionInfo collisionInfo;

    // 皮肤宽度防止卡在几何体中
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
        // 从期望的跳跃高度和时间计算重力和跳跃速度
        // 使用运动学方程：h = v*t - 0.5*g*t^2 和 v = g*t
        gravity = (2 * jumpHeight) / (jumpTimeToApex * jumpTimeToApex);
        jumpVelocity = gravity * jumpTimeToApex;
    }

    private void Update()
    {
        // 处理输入
        float horizontalInput = Input.GetAxisRaw("Horizontal");
        bool jumpPressed = Input.GetButtonDown("Jump");
        jumpHeld = Input.GetButton("Jump");

        if (jumpPressed)
        {
            lastJumpPressedTime = Time.time;
        }

        // 应用水平移动
        ApplyHorizontalMovement(horizontalInput);

        // 处理跳跃
        HandleJump();

        // 应用重力
        ApplyGravity();
    }

    private void FixedUpdate()
    {
        // 存储之前的着地状态
        wasGrounded = isGrounded;

        // 根据当前位置更新射线起点
        UpdateRaycastOrigins();

        // 重置碰撞信息
        collisionInfo.Reset();

        // 带碰撞检测的移动
        Vector2 deltaMovement = velocity * Time.fixedDeltaTime;

        if (deltaMovement.x != 0)
        {
            HorizontalCollisions(ref deltaMovement);
        }

        if (deltaMovement.y != 0)
        {
            VerticalCollisions(ref deltaMovement);
        }

        // 应用移动
        transform.Translate(deltaMovement);

        // 更新着地状态
        isGrounded = collisionInfo.below;

        if (isGrounded)
        {
            lastGroundedTime = Time.time;
        }

        // 碰撞时将速度归零
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
            // 向目标速度加速
            velocity.x = Mathf.MoveTowards(velocity.x, targetSpeed, accel * Time.deltaTime);
        }
        else
        {
            // 无输入时减速
            velocity.x = Mathf.MoveTowards(velocity.x, 0, deceleration * Time.deltaTime);
        }
    }

    private void HandleJump()
    {
        // 检查土狼时间和跳跃缓冲
        bool canCoyoteJump = (Time.time - lastGroundedTime) <= coyoteTime;
        bool hasBufferedJump = (Time.time - lastJumpPressedTime) <= jumpBufferTime;

        if (hasBufferedJump && (isGrounded || canCoyoteJump))
        {
            // 执行跳跃
            velocity.y = jumpVelocity;
            lastJumpPressedTime = 0; // 消耗缓冲
            lastGroundedTime = 0;    // 消耗土狼时间
        }

        // 可变跳跃高度 - 松开按钮时截断跳跃
        if (!jumpHeld && velocity.y > 0)
        {
            velocity.y *= 0.5f;
        }
    }

    private void ApplyGravity()
    {
        // 下落时应用更强的重力以获得更干脆的手感
        float currentGravity = gravity;
        if (velocity.y < 0)
        {
            currentGravity *= fallGravityMultiplier;
        }

        velocity.y -= currentGravity * Time.deltaTime;

        // 限制下落速度
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

### 平台游戏控制器（Godot GDScript）

```gdscript
extends CharacterBody2D
class_name PlatformerController

# 移动参数
@export_group("移动")
@export var move_speed: float = 300.0
@export var acceleration: float = 2000.0
@export var deceleration: float = 2000.0
@export var air_acceleration: float = 1200.0

# 跳跃参数
@export_group("跳跃")
@export var jump_height: float = 64.0
@export var jump_time_to_apex: float = 0.4
@export var fall_gravity_multiplier: float = 2.0
@export var max_fall_speed: float = 600.0
@export var max_jumps: int = 1

# 辅助参数
@export_group("辅助")
@export var coyote_time: float = 0.1
@export var jump_buffer_time: float = 0.1

# 墙壁机制
@export_group("墙壁机制")
@export var wall_slide_enabled: bool = true
@export var wall_slide_speed: float = 100.0
@export var wall_jump_enabled: bool = true
@export var wall_jump_velocity: Vector2 = Vector2(400, -300)

# 计算值
var gravity: float
var jump_velocity: float

# 状态跟踪
var jumps_remaining: int
var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0
var is_wall_sliding: bool = false
var wall_direction: int = 0

func _ready() -> void:
    calculate_physics_values()

func calculate_physics_values() -> void:
    # h = v*t - 0.5*g*t^2，在顶点 v = g*t
    # 所以：h = g*t*t - 0.5*g*t^2 = 0.5*g*t^2
    # 因此：g = 2*h / t^2
    gravity = (2.0 * jump_height) / (jump_time_to_apex * jump_time_to_apex)
    jump_velocity = gravity * jump_time_to_apex

func _physics_process(delta: float) -> void:
    var was_on_floor = is_on_floor()

    # 更新计时器
    update_timers(delta, was_on_floor)

    # 获取输入
    var input_direction = Input.get_axis("move_left", "move_right")
    var jump_pressed = Input.is_action_just_pressed("jump")
    var jump_held = Input.is_action_pressed("jump")

    # 缓冲跳跃输入
    if jump_pressed:
        jump_buffer_timer = jump_buffer_time

    # 应用水平移动
    apply_horizontal_movement(input_direction, delta)

    # 检查墙壁滑行
    check_wall_slide(input_direction)

    # 处理跳跃
    handle_jump(jump_held)

    # 应用重力
    apply_gravity(delta)

    # 移动和滑动
    move_and_slide()

    # 移动后更新
    if is_on_floor():
        jumps_remaining = max_jumps

func update_timers(delta: float, was_on_floor: bool) -> void:
    # 土狼时间 - 离开地面后的宽限期
    if was_on_floor and not is_on_floor():
        coyote_timer = coyote_time
    elif coyote_timer > 0:
        coyote_timer -= delta

    # 跳跃缓冲倒计时
    if jump_buffer_timer > 0:
        jump_buffer_timer -= delta

func apply_horizontal_movement(input_direction: float, delta: float) -> void:
    var target_speed = input_direction * move_speed
    var current_acceleration = acceleration if is_on_floor() else air_acceleration

    if abs(input_direction) > 0.1:
        # 向目标加速
        velocity.x = move_toward(velocity.x, target_speed, current_acceleration * delta)
    else:
        # 无输入时减速
        velocity.x = move_toward(velocity.x, 0, deceleration * delta)

func check_wall_slide(input_direction: float) -> void:
    if not wall_slide_enabled:
        is_wall_sliding = false
        return

    wall_direction = 0
    if is_on_wall():
        # 确定墙壁方向
        var collision = get_last_slide_collision()
        if collision:
            wall_direction = -1 if collision.get_normal().x > 0 else 1

    # 墙壁滑行条件
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

    # 墙跳
    if has_buffered_jump and wall_jump_enabled and is_wall_sliding:
        velocity.y = wall_jump_velocity.y
        velocity.x = -wall_direction * wall_jump_velocity.x
        jump_buffer_timer = 0
        coyote_timer = 0
        is_wall_sliding = false
        return

    # 普通跳跃或土狼跳跃
    if has_buffered_jump and can_regular_jump:
        velocity.y = -jump_velocity
        jump_buffer_timer = 0
        coyote_timer = 0
        jumps_remaining = max_jumps - 1
        return

    # 空中跳跃（二段跳）
    if has_buffered_jump and can_air_jump:
        velocity.y = -jump_velocity
        jump_buffer_timer = 0
        jumps_remaining -= 1
        return

    # 可变跳跃高度 - 松开按钮时截断跳跃
    if not jump_held and velocity.y < 0:
        velocity.y *= 0.5

func apply_gravity(delta: float) -> void:
    if is_wall_sliding:
        # 墙壁滑行时下落更慢
        velocity.y = min(velocity.y + gravity * delta * 0.1, wall_slide_speed)
    else:
        # 正常或增强重力
        var current_gravity = gravity
        if velocity.y > 0:
            current_gravity *= fall_gravity_multiplier

        velocity.y += current_gravity * delta
        velocity.y = min(velocity.y, max_fall_speed)
```

### 高级移动：冲刺机制

```csharp
// 添加到 PlatformerController 类
[Header("冲刺")]
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
    // 冷却计时器
    if (dashCooldownTimer > 0)
    {
        dashCooldownTimer -= Time.deltaTime;
    }

    // 着地时重置冲刺
    if (dashResetOnGround && isGrounded && !canDash && dashCooldownTimer <= 0)
    {
        canDash = true;
    }

    // 开始冲刺
    if (Input.GetButtonDown("Dash") && canDash && !isDashing)
    {
        StartDash();
    }

    // 处理进行中的冲刺
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

    // 确定冲刺方向
    float inputX = Input.GetAxisRaw("Horizontal");
    float inputY = Input.GetAxisRaw("Vertical");

    if (Mathf.Abs(inputX) > 0.1f || Mathf.Abs(inputY) > 0.1f)
    {
        dashDirection = new Vector2(inputX, inputY).normalized;
    }
    else
    {
        // 无输入时向面朝方向冲刺
        dashDirection = new Vector2(transform.localScale.x > 0 ? 1 : -1, 0);
    }

    // 取消垂直动量
    velocity.y = 0;

    // 触发冲刺效果（粒子、屏幕震动等）
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

    // 应用带可选曲线的冲刺速度
    float speedMultiplier = dashSpeedCurve != null
        ? dashSpeedCurve.Evaluate(dashTimer / dashDuration)
        : 1f;

    velocity = dashDirection * dashSpeed * speedMultiplier;
}

private void EndDash()
{
    isDashing = false;
    dashCooldownTimer = dashCooldown;

    // 冲刺后保留部分动量
    velocity *= 0.5f;

    OnDashEnd?.Invoke();
}

public event System.Action<Vector2> OnDashStart;
public event System.Action OnDashEnd;
```

### 单向平台处理器

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
        // 检查玩家是否在平台下方或向上移动
        PlatformerController player = collision.gameObject.GetComponent<PlatformerController>();
        if (player == null) return;

        ContactPoint2D contact = collision.GetContact(0);

        // 如果碰撞来自下方（玩家向上移动）或来自侧面，忽略
        if (contact.normal.y <= 0)
        {
            Physics2D.IgnoreCollision(collision.collider, platformCollider, true);
            ignoredColliders.Add(collision.collider);
        }
    }

    private void OnCollisionStay2D(Collision2D collision)
    {
        // 当玩家在上方且向下移动时重新启用碰撞
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

        // 如果玩家已穿过则重新启用
        float playerBottom = playerCollider.bounds.min.y;
        float platformTop = platformCollider.bounds.max.y;

        if (playerBottom < platformTop)
        {
            // 玩家仍在下方，等待直到在上方或远在下方
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

### 移动平台支持

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

        // 存储当前位置
        lastPosition = transform.position;

        // 向当前路点移动
        Vector2 targetPosition = waypoints[currentWaypointIndex];
        transform.position = Vector2.MoveTowards(
            transform.position,
            targetPosition,
            speed * Time.fixedDeltaTime
        );

        // 检查是否到达路点
        if (Vector2.Distance(transform.position, targetPosition) < 0.01f)
        {
            StartCoroutine(WaitAndMoveToNext());
        }

        // 移动乘客
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
                // 随平台移动乘客
                passenger.position += deltaMovement;
            }
        }
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        // 检查碰撞是否来自上方
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

### 斜坡处理

```csharp
// 添加到碰撞检测
[Header("斜坡")]
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
            // 检查是否在下坡（沿斜坡向下移动）
            if (Mathf.Sign(hit.normal.x) == directionX)
            {
                // 检查是否足够接近斜坡
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
                // 新斜坡，重置
                deltaMovement.x = (hit.distance - SkinWidth) * directionX;
            }

            ClimbSlope(ref deltaMovement, slopeAngle);
        }
        else
        {
            // 太陡，视为墙壁
            deltaMovement.x = (hit.distance - SkinWidth) * directionX;
        }
    }

    // 检查下坡
    if (!collisionInfo.climbingSlope && deltaMovement.y <= 0)
    {
        DescendSlope(ref deltaMovement);
    }
}
```

## 最佳实践

### 1. 参数组织

```csharp
[System.Serializable]
public class MovementSettings
{
    [Header("地面移动")]
    public float maxSpeed = 8f;
    public float acceleration = 50f;
    public float deceleration = 60f;

    [Header("空中移动")]
    public float airMaxSpeed = 8f;
    public float airAcceleration = 30f;
    public float airDeceleration = 20f;

    [Header("斜坡")]
    public float maxClimbAngle = 50f;
    public float maxDescendAngle = 50f;
}

[System.Serializable]
public class JumpSettings
{
    [Header("基础跳跃")]
    public float height = 3f;
    public float timeToApex = 0.4f;

    [Header("增强手感")]
    public float fallMultiplier = 2f;
    public float lowJumpMultiplier = 2.5f;
    public float maxFallSpeed = 20f;

    [Header("多段跳")]
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

### 2. 状态机架构

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

### 3. 调试可视化

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
        GUILayout.Label($"速度: {controller.Velocity}");
        GUILayout.Label($"着地: {controller.IsGrounded}");
        GUILayout.Label($"跳跃次数: {controller.JumpsRemaining}");
        GUILayout.Label($"状态: {controller.CurrentState}");
        GUILayout.EndArea();
    }
}
#endif
```

### 4. 可重放的输入

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

## 常见陷阱

### 1. 帧率依赖的物理

```csharp
// 不好：移动依赖帧率
void Update()
{
    transform.position += velocity;  // 高帧率时更快！
}

// 好：帧率无关
void FixedUpdate()
{
    transform.position += velocity * Time.fixedDeltaTime;
}
```

### 2. 穿透薄平台

```csharp
// 不好：高速时可能穿过薄物体
void MovePlayer()
{
    transform.position += velocity * Time.deltaTime;
}

// 好：使用连续碰撞检测或扫描测试
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

### 3. 不一致的地面检测

```csharp
// 不好：单条射线会错过边缘
bool IsGrounded()
{
    return Physics2D.Raycast(transform.position, Vector2.down, 0.1f, groundLayer);
}

// 好：多条射线覆盖边缘
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

### 4. 突兀的斜坡攀爬

```csharp
// 不好：玩家突然吸附到斜坡，看起来很生硬
void OnSlope(float angle)
{
    velocity.y = CalculateSlopeY(angle);
}

// 好：平滑过渡到斜坡
void OnSlope(float angle)
{
    float targetY = CalculateSlopeY(angle);
    velocity.y = Mathf.Lerp(velocity.y, targetY, slopeTransitionSpeed * Time.deltaTime);
}
```

### 5. 遗漏的边缘情况

```csharp
// 处理角落修正（帮助玩家落在差点错过的平台上）
void CorrectCorner(ref Vector2 deltaMovement)
{
    if (!collisionInfo.above || deltaMovement.y >= 0) return;

    float correctionDistance = cornerCorrectionRange;

    // 检查左边
    Vector2 leftOrigin = raycastOrigins.topLeft + Vector2.up * Mathf.Abs(deltaMovement.y);
    RaycastHit2D leftHit = Physics2D.Raycast(leftOrigin, Vector2.left, correctionDistance, groundLayer);

    // 检查右边
    Vector2 rightOrigin = raycastOrigins.topRight + Vector2.up * Mathf.Abs(deltaMovement.y);
    RaycastHit2D rightHit = Physics2D.Raycast(rightOrigin, Vector2.right, correctionDistance, groundLayer);

    if (!leftHit && rightHit)
    {
        // 向左微调
        deltaMovement.x -= correctionDistance - rightHit.distance;
    }
    else if (leftHit && !rightHit)
    {
        // 向右微调
        deltaMovement.x += correctionDistance - leftHit.distance;
    }
}
```

## 性能考量

### 1. 射线检测优化

```csharp
// 缓存射线检测结果
private RaycastHit2D[] raycastHits = new RaycastHit2D[8];

void OptimizedCollisionCheck()
{
    // 使用非分配射线检测
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

### 2. 基于层的碰撞过滤

```csharp
// 在项目设置中设置碰撞矩阵
// 使用层遮罩最小化检查

[SerializeField] private LayerMask groundLayer;
[SerializeField] private LayerMask platformLayer;
[SerializeField] private LayerMask hazardLayer;

private LayerMask combinedGroundLayers;

void Start()
{
    combinedGroundLayers = groundLayer | platformLayer;
}
```

### 3. 多对象的空间分区

```csharp
// 用于有很多移动平台/敌人的游戏
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

### 4. 效果的对象池

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

## 实战场景

### 场景 1：蔚蓝风格移动

```csharp
public class CelesteController : PlatformerController
{
    [Header("蔚蓝机制")]
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
            // 向上攀爬消耗更多体力
            velocity.y = climbSpeed;
            currentStamina -= staminaDrainRate * 2 * Time.deltaTime;
        }
        else if (climbInput < 0)
        {
            // 向下滑动
            velocity.y = -climbSpeed * 2;
        }
        else
        {
            // 静止
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

        // 波浪冲刺：冲向地面获得速度提升
        if (isDashing && isGrounded && dashDirection.y < -0.5f)
        {
            EndDash();
            velocity.x = Mathf.Sign(dashDirection.x) * superDashSpeed;
        }
    }

    protected override void OnLand()
    {
        base.OnLand();
        currentStamina = climbStamina; // 落地时恢复体力
    }
}
```

### 场景 2：洛克人风格移动

```csharp
public class MegaManController : PlatformerController
{
    [Header("洛克人风格")]
    [SerializeField] private float slideSpeed = 10f;
    [SerializeField] private float slideDuration = 0.5f;
    [SerializeField] private float slideColliderHeight = 0.5f;

    private bool isSliding;
    private float normalColliderHeight;
    private Vector2 normalColliderOffset;

    protected override void HandleSpecialMoves()
    {
        // 滑铲：在地面按下 + 跳跃
        if (isGrounded && Input.GetAxisRaw("Vertical") < -0.5f && Input.GetButtonDown("Jump"))
        {
            StartSlide();
        }
    }

    private void StartSlide()
    {
        isSliding = true;

        // 缩小碰撞体
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

            // 撞墙取消滑铲
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
        // 检查是否可以站起
        Vector2 checkOrigin = transform.position + Vector3.up * normalColliderHeight / 2;
        if (!Physics2D.BoxCast(checkOrigin,
            new Vector2(boxCollider.size.x * 0.9f, normalColliderHeight * 0.9f),
            0f, Vector2.up, 0.1f, groundLayer))
        {
            isSliding = false;
            boxCollider.size = new Vector2(boxCollider.size.x, normalColliderHeight);
            boxCollider.offset = normalColliderOffset;
        }
        // 否则：保持蹲伏直到有空间
    }
}
```

### 场景 3：空洞骑士风格战斗移动

```csharp
public class HollowKnightController : PlatformerController
{
    [Header("战斗移动")]
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
            // 下砸弹跳
            velocity.y = pogoJumpForce;
            ResetJumps();
        }
        else
        {
            // 后座力
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
            // 逐渐恢复控制
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

## 面试要点

### 概念问题

1. **问：为什么平台游戏角色使用运动学刚体而不是动力学刚体？**

   答：运动学刚体提供确定性的、可预测的移动，这对紧凑的平台游戏控制至关重要。动力学刚体受外力影响，导致不可预测的行为。运动学刚体允许直接控制速度，更容易实现土狼时间、可变跳跃高度和即时方向改变等功能。

2. **问：解释土狼时间和跳跃缓冲。**

   答：土狼时间是离开平台后的一个宽限期（通常 50-150 毫秒），玩家仍然可以跳跃。它补偿了人类反应时间，使游戏感觉更响应。跳跃缓冲在短暂窗口内存储跳跃输入，在玩家落地时执行，防止因按早了一点而错过跳跃。

3. **问：平台游戏中如何处理斜坡？**

   答：斜坡需要特殊处理：通过射线检测检测斜坡角度，在攀爬/下坡时旋转速度以匹配斜坡方向，应用适当的速度修正，吸附到斜坡表面防止弹跳，并设置最大可攀爬角度，超过该角度斜坡变成墙壁。

### 技术问题

4. **问：如何实现可变跳跃高度？**

   答：跟踪跳跃按钮是否被按住。当在上升过程中松开时，减少垂直速度（乘以 0.5 或类似值）。这创造了点按（短跳）和长按（完整跳跃）之间的差异。关键是只在上升阶段截断速度。

5. **问：什么导致穿透，如何防止？**

   答：当物体移动速度快到在帧之间穿过薄碰撞体时发生穿透。解决方案包括：连续碰撞检测（扫描测试）、将移动细分为更小的步骤、限制最大速度，或使用更厚的碰撞体。扫描测试最准确但计算开销大。

6. **问：如何从期望的高度和时间计算跳跃参数？**

   答：使用运动学方程：重力 = (2 * 高度) / (时间^2)，初始速度 = 重力 * 时间。这种方法让设计师指定直观的参数（跳 3 个单位高，用 0.4 秒到达顶点）而不是调整抽象的物理值。

### 架构问题

7. **问：如何构建可扩展的平台游戏控制器？**

   答：使用状态机模式，每个状态（着地、空中、冲刺、墙壁滑行）封装自己的逻辑。分离关注点：输入处理、物理计算、碰撞检测和状态转换。使用组合而非继承来混合机制（墙跳模块、冲刺模块）。

8. **问：如何确保不同帧率下物理一致？**

   答：使用固定时间步长更新（Unity 中的 FixedUpdate）进行物理计算。将物理状态与渲染状态分开存储。在物理帧之间插值视觉位置以获得平滑渲染。永远不要将物理计算直接绑定到可变的 delta time。

## 延伸阅读

### 文档和教程

- [Unity 2D 物理手册](https://docs.unity3d.com/Manual/Physics2DReference.html)
- [Godot CharacterBody2D 教程](https://docs.godotengine.org/en/stable/tutorials/physics/using_character_body_2d.html)
- [游戏编程模式 - 状态](https://gameprogrammingpatterns.com/state.html)

### 技术深入

- "Math for Game Programmers: Building a Better Jump" - Kyle Pittman 的 GDC 演讲
- "Platformer Toolkit" - Mark Brown - 平台游戏手感的交互式分解
- "Celeste & TowerFall Physics" - Matt Thorson - 源代码研究

### 学术参考

- "Real-Time Collision Detection" - Christer Ericson
- "Game Physics Engine Development" - Ian Millington
- "Game Feel: A Game Designer's Guide to Virtual Sensation" - Steve Swink

### 开源参考

- [Celeste 源代码](https://github.com/NoelFB/Celeste) - 移动和物理参考
- [Sonic 物理指南](https://info.sonicretro.org/Sonic_Physics_Guide) - 经典平台游戏物理分析
- [Ultimate 2D Controller](https://github.com/prime31/CharacterController2D) - Unity 实现示例
