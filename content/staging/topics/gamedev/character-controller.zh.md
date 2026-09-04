---
title: 游戏角色控制器设计
description: 实现流畅的角色控制：运动学vs动力学控制器、地面检测和斜坡处理
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - 角色控制
  - 运动
  - 物理
  - 游戏手感
status: imported
origin: old/src/content/docs/gamedev/character-controller.zh.md
divergence: 0.2
issues: []
legacy:
  category: GameDev
  subcategory: Physics
  order: 16
  lastUpdated: 2026-01-07
---

角色控制器是游戏开发中最核心的系统之一，它直接决定了玩家与游戏世界的交互体验。一个优秀的角色控制器不仅要实现基本的移动功能，还要考虑地形适应、物理响应以及各种边缘情况的处理。本文将深入探讨角色控制器的设计原理、实现技术以及优化手感的关键技巧。

## 概念解释：什么是角色控制器

角色控制器（Character Controller）是负责处理游戏角色移动、碰撞检测和物理响应的核心组件。与普通的刚体物理不同，角色控制器需要提供更加可预测和可控的移动行为，同时保持与游戏世界的物理交互。

### 为什么不直接使用刚体物理

你可能会问：为什么不直接给角色加一个刚体组件，让物理引擎处理一切？原因如下：

1. **可预测性差**：刚体受力后的运动轨迹难以精确控制，玩家输入与角色响应之间存在延迟
2. **不稳定性**：角色可能被微小的碰撞力推动，或者在斜坡上滑动
3. **旋转问题**：刚体会因碰撞而旋转，但游戏角色通常需要保持直立
4. **游戏手感**：纯物理模拟往往感觉"飘"或"滑"，缺乏即时响应感

### 角色控制器的核心职责

- **移动处理**：将玩家输入转换为角色位移
- **碰撞检测**：检测并响应与环境的碰撞
- **地面检测**：判断角色是否站在地面上
- **斜坡处理**：在倾斜表面上正确移动
- **台阶攀爬**：自动跨越小型障碍物

## 运动学 vs 动力学控制器

在实现角色控制器时，有两种主要的设计范式：运动学（Kinematic）和动力学（Dynamic）控制器。

### 运动学控制器

运动学控制器直接控制角色的位置，不受物理引擎的力学系统影响。

```csharp
// Unity - 运动学角色控制器
public class KinematicCharacterController : MonoBehaviour
{
    [Header("移动参数")]
    public float moveSpeed = 8f;
    public float acceleration = 50f;
    public float deceleration = 60f;

    [Header("碰撞参数")]
    public float skinWidth = 0.02f;
    public int maxBounces = 5;

    private CapsuleCollider capsule;
    private Vector3 velocity;

    void Start()
    {
        capsule = GetComponent<CapsuleCollider>();
    }

    void Update()
    {
        // 获取输入
        Vector2 input = new Vector2(Input.GetAxisRaw("Horizontal"),
                                     Input.GetAxisRaw("Vertical"));
        Vector3 wishDir = new Vector3(input.x, 0, input.y).normalized;

        // 计算目标速度
        Vector3 targetVelocity = wishDir * moveSpeed;

        // 应用加速/减速
        float accel = wishDir.magnitude > 0 ? acceleration : deceleration;
        velocity = Vector3.MoveTowards(velocity, targetVelocity, accel * Time.deltaTime);

        // 应用移动
        Move(velocity * Time.deltaTime);
    }

    void Move(Vector3 movement)
    {
        Vector3 position = transform.position;
        Vector3 remainingMovement = movement;

        for (int i = 0; i < maxBounces && remainingMovement.magnitude > 0.001f; i++)
        {
            // 执行扫掠测试
            if (CapsuleCast(position, remainingMovement, out RaycastHit hit))
            {
                // 移动到碰撞点（保留皮肤宽度）
                float distance = Mathf.Max(0, hit.distance - skinWidth);
                position += remainingMovement.normalized * distance;

                // 计算剩余移动（沿表面滑动）
                remainingMovement = Vector3.ProjectOnPlane(
                    remainingMovement - remainingMovement.normalized * distance,
                    hit.normal
                );
            }
            else
            {
                // 无碰撞，直接移动
                position += remainingMovement;
                break;
            }
        }

        transform.position = position;
    }

    bool CapsuleCast(Vector3 position, Vector3 direction, out RaycastHit hit)
    {
        float radius = capsule.radius - skinWidth;
        float height = capsule.height - 2 * skinWidth;

        Vector3 point1 = position + Vector3.up * (radius);
        Vector3 point2 = position + Vector3.up * (height - radius);

        return Physics.CapsuleCast(
            point1, point2, radius,
            direction.normalized, out hit,
            direction.magnitude + skinWidth,
            ~0, QueryTriggerInteraction.Ignore
        );
    }
}
```

**运动学控制器的优势：**
- 完全可控的移动行为
- 精确的碰撞响应
- 不会被外力意外推动
- 适合平台跳跃类游戏

**运动学控制器的劣势：**
- 需要手动实现所有碰撞逻辑
- 与动态物理对象交互需要额外处理
- 实现复杂度较高

### 动力学控制器

动力学控制器使用刚体物理，但通过特殊配置和脚本控制来实现可预测的行为。

```csharp
// Unity - 动力学角色控制器
public class DynamicCharacterController : MonoBehaviour
{
    [Header("移动参数")]
    public float moveSpeed = 8f;
    public float acceleration = 100f;
    public float airAcceleration = 20f;

    [Header("物理参数")]
    public float maxSlopeAngle = 45f;
    public float groundDrag = 6f;
    public float airDrag = 0.5f;

    private Rigidbody rb;
    private bool isGrounded;
    private Vector3 groundNormal;

    void Start()
    {
        rb = GetComponent<Rigidbody>();
        // 锁定旋转，防止角色翻倒
        rb.freezeRotation = true;
        // 使用连续碰撞检测
        rb.collisionDetectionMode = CollisionDetectionMode.Continuous;
    }

    void FixedUpdate()
    {
        CheckGround();
        ApplyMovement();
        ApplyDrag();
        LimitSpeed();
    }

    void CheckGround()
    {
        float rayLength = 0.2f;
        if (Physics.Raycast(transform.position, Vector3.down, out RaycastHit hit, rayLength))
        {
            float slopeAngle = Vector3.Angle(Vector3.up, hit.normal);
            isGrounded = slopeAngle <= maxSlopeAngle;
            groundNormal = hit.normal;
        }
        else
        {
            isGrounded = false;
            groundNormal = Vector3.up;
        }
    }

    void ApplyMovement()
    {
        Vector2 input = new Vector2(Input.GetAxisRaw("Horizontal"),
                                     Input.GetAxisRaw("Vertical"));
        Vector3 wishDir = new Vector3(input.x, 0, input.y).normalized;

        // 将移动方向投影到地面
        if (isGrounded)
        {
            wishDir = Vector3.ProjectOnPlane(wishDir, groundNormal).normalized;
        }

        // 计算加速度
        float accel = isGrounded ? acceleration : airAcceleration;

        // 应用力
        rb.AddForce(wishDir * accel, ForceMode.Acceleration);
    }

    void ApplyDrag()
    {
        rb.linearDamping = isGrounded ? groundDrag : airDrag;
    }

    void LimitSpeed()
    {
        Vector3 horizontalVelocity = new Vector3(rb.linearVelocity.x, 0, rb.linearVelocity.z);

        if (horizontalVelocity.magnitude > moveSpeed)
        {
            Vector3 limitedVelocity = horizontalVelocity.normalized * moveSpeed;
            rb.linearVelocity = new Vector3(limitedVelocity.x, rb.linearVelocity.y, limitedVelocity.z);
        }
    }
}
```

**动力学控制器的优势：**
- 自动处理物理交互
- 容易实现推箱子等物理玩法
- 代码量相对较少

**动力学控制器的劣势：**
- 行为可预测性较低
- 需要仔细调参
- 可能出现穿模或卡墙

### 混合方案

实际项目中，很多游戏采用混合方案：

```csharp
// 混合控制器示例
public class HybridCharacterController : MonoBehaviour
{
    private Rigidbody rb;
    private bool useKinematic = true;

    void FixedUpdate()
    {
        if (useKinematic)
        {
            // 运动学模式：直接设置速度
            rb.linearVelocity = CalculateTargetVelocity();
        }
        else
        {
            // 动力学模式：应用力
            rb.AddForce(CalculateForce(), ForceMode.Acceleration);
        }
    }

    // 当与动态物体交互时切换到动力学模式
    void OnCollisionEnter(Collision collision)
    {
        if (collision.rigidbody != null && !collision.rigidbody.isKinematic)
        {
            useKinematic = false;
        }
    }
}
```

## 地面检测

准确的地面检测是角色控制器的基础，它影响跳跃、移动速度、动画状态等多个方面。

### 射线检测法

最简单的方法是从角色脚底发射射线：

```csharp
public class GroundDetector : MonoBehaviour
{
    [Header("检测参数")]
    public float groundCheckDistance = 0.1f;
    public float groundCheckRadius = 0.3f;
    public LayerMask groundLayer;

    [Header("状态")]
    public bool IsGrounded { get; private set; }
    public Vector3 GroundNormal { get; private set; }
    public float GroundAngle { get; private set; }
    public Collider GroundCollider { get; private set; }

    void FixedUpdate()
    {
        CheckGround();
    }

    void CheckGround()
    {
        Vector3 origin = transform.position + Vector3.up * 0.1f;

        // 方法1：单射线（简单但不够稳定）
        // if (Physics.Raycast(origin, Vector3.down, out RaycastHit hit,
        //     groundCheckDistance + 0.1f, groundLayer))

        // 方法2：球形检测（更稳定）
        if (Physics.SphereCast(origin, groundCheckRadius, Vector3.down,
            out RaycastHit hit, groundCheckDistance, groundLayer))
        {
            IsGrounded = true;
            GroundNormal = hit.normal;
            GroundAngle = Vector3.Angle(Vector3.up, hit.normal);
            GroundCollider = hit.collider;
        }
        else
        {
            IsGrounded = false;
            GroundNormal = Vector3.up;
            GroundAngle = 0f;
            GroundCollider = null;
        }
    }

    // 可视化调试
    void OnDrawGizmos()
    {
        Vector3 origin = transform.position + Vector3.up * 0.1f;

        Gizmos.color = IsGrounded ? Color.green : Color.red;
        Gizmos.DrawWireSphere(origin - Vector3.up * groundCheckDistance, groundCheckRadius);
    }
}
```

### 多点检测法

为了处理边缘情况，可以使用多个检测点：

```csharp
public class MultiPointGroundDetector : MonoBehaviour
{
    public float checkRadius = 0.3f;
    public float checkDistance = 0.15f;
    public int checkPoints = 5;
    public LayerMask groundLayer;

    public bool IsGrounded { get; private set; }
    public Vector3 AverageNormal { get; private set; }

    void FixedUpdate()
    {
        CheckGroundMultiPoint();
    }

    void CheckGroundMultiPoint()
    {
        Vector3 center = transform.position + Vector3.up * 0.1f;
        Vector3 normalSum = Vector3.zero;
        int hitCount = 0;

        // 中心点检测
        if (CheckPoint(center, out Vector3 normal))
        {
            normalSum += normal;
            hitCount++;
        }

        // 周围点检测
        for (int i = 0; i < checkPoints; i++)
        {
            float angle = (360f / checkPoints) * i * Mathf.Deg2Rad;
            Vector3 offset = new Vector3(
                Mathf.Cos(angle) * checkRadius,
                0,
                Mathf.Sin(angle) * checkRadius
            );

            if (CheckPoint(center + offset, out normal))
            {
                normalSum += normal;
                hitCount++;
            }
        }

        IsGrounded = hitCount > 0;
        AverageNormal = hitCount > 0 ? (normalSum / hitCount).normalized : Vector3.up;
    }

    bool CheckPoint(Vector3 origin, out Vector3 normal)
    {
        if (Physics.Raycast(origin, Vector3.down, out RaycastHit hit,
            checkDistance + 0.1f, groundLayer))
        {
            normal = hit.normal;
            return true;
        }
        normal = Vector3.up;
        return false;
    }
}
```

### 地面状态机

复杂游戏需要区分多种地面状态：

```csharp
public enum GroundState
{
    Grounded,       // 站在地面
    Airborne,       // 空中
    Sliding,        // 在陡坡滑动
    OnPlatform,     // 在移动平台上
    InWater,        // 在水中
    OnLadder        // 在梯子上
}

public class GroundStateManager : MonoBehaviour
{
    public float maxWalkableAngle = 45f;
    public float slideAngle = 60f;

    public GroundState CurrentState { get; private set; }

    private GroundDetector groundDetector;

    void Start()
    {
        groundDetector = GetComponent<GroundDetector>();
    }

    void Update()
    {
        UpdateGroundState();
    }

    void UpdateGroundState()
    {
        if (!groundDetector.IsGrounded)
        {
            CurrentState = GroundState.Airborne;
            return;
        }

        float angle = groundDetector.GroundAngle;

        if (angle > slideAngle)
        {
            CurrentState = GroundState.Sliding;
        }
        else if (groundDetector.GroundCollider.CompareTag("Platform"))
        {
            CurrentState = GroundState.OnPlatform;
        }
        else
        {
            CurrentState = GroundState.Grounded;
        }
    }
}
```

## 斜坡处理

斜坡处理是角色控制器中最容易出问题的部分之一。

### 斜坡移动

在斜坡上移动时，需要将移动方向投影到斜坡表面：

```csharp
public class SlopeHandler : MonoBehaviour
{
    public float maxSlopeAngle = 45f;
    public float slideSpeed = 5f;
    public float slopeRayLength = 0.5f;

    private GroundDetector groundDetector;
    private Rigidbody rb;

    public Vector3 GetSlopeAdjustedDirection(Vector3 moveDirection)
    {
        if (!groundDetector.IsGrounded)
            return moveDirection;

        float angle = groundDetector.GroundAngle;

        if (angle > 0 && angle <= maxSlopeAngle)
        {
            // 将移动方向投影到斜坡表面
            return Vector3.ProjectOnPlane(moveDirection, groundDetector.GroundNormal).normalized
                   * moveDirection.magnitude;
        }

        return moveDirection;
    }

    public Vector3 GetSlideVelocity()
    {
        if (!groundDetector.IsGrounded || groundDetector.GroundAngle <= maxSlopeAngle)
            return Vector3.zero;

        // 计算沿斜坡向下的方向
        Vector3 slopeDirection = Vector3.ProjectOnPlane(Vector3.down, groundDetector.GroundNormal);

        // 根据角度计算滑动速度
        float slideMultiplier = (groundDetector.GroundAngle - maxSlopeAngle) / (90f - maxSlopeAngle);

        return slopeDirection.normalized * slideSpeed * slideMultiplier;
    }

    // 检测前方是否有斜坡
    public bool CheckSlopeAhead(Vector3 moveDirection, out float slopeAngle)
    {
        Vector3 rayOrigin = transform.position + Vector3.up * 0.1f + moveDirection.normalized * 0.5f;

        if (Physics.Raycast(rayOrigin, Vector3.down, out RaycastHit hit, slopeRayLength))
        {
            slopeAngle = Vector3.Angle(Vector3.up, hit.normal);
            return slopeAngle > 0;
        }

        slopeAngle = 0;
        return false;
    }
}
```

### 防止斜坡滑动

在静止状态下，角色不应该在可行走的斜坡上滑动：

```csharp
public class AntiSlide : MonoBehaviour
{
    public float maxSlopeAngle = 45f;

    private Rigidbody rb;
    private GroundDetector groundDetector;

    void FixedUpdate()
    {
        if (groundDetector.IsGrounded && groundDetector.GroundAngle <= maxSlopeAngle)
        {
            // 如果玩家没有输入且在斜坡上
            if (GetMoveInput().magnitude < 0.1f)
            {
                // 应用反向力抵消重力沿斜坡的分量
                Vector3 gravityOnSlope = Vector3.ProjectOnPlane(Physics.gravity, groundDetector.GroundNormal);
                rb.AddForce(-gravityOnSlope, ForceMode.Acceleration);
            }
        }
    }

    Vector2 GetMoveInput()
    {
        return new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical"));
    }
}
```

### 台阶自动攀爬

角色应该能够自动跨越小型障碍物：

```csharp
public class StepClimber : MonoBehaviour
{
    public float maxStepHeight = 0.4f;
    public float stepCheckDistance = 0.3f;
    public float stepSmooth = 10f;

    private CapsuleCollider capsule;

    void Update()
    {
        if (IsMoving())
        {
            TryClimbStep();
        }
    }

    void TryClimbStep()
    {
        Vector3 moveDir = GetMoveDirection();
        if (moveDir.magnitude < 0.1f) return;

        Vector3 lowerOrigin = transform.position + Vector3.up * 0.1f;
        Vector3 upperOrigin = transform.position + Vector3.up * maxStepHeight;

        // 检测低位是否有障碍
        if (Physics.Raycast(lowerOrigin, moveDir, stepCheckDistance))
        {
            // 检测高位是否通畅
            if (!Physics.Raycast(upperOrigin, moveDir, stepCheckDistance))
            {
                // 检测台阶顶部是否有落脚点
                Vector3 stepTop = upperOrigin + moveDir * stepCheckDistance;
                if (Physics.Raycast(stepTop, Vector3.down, out RaycastHit hit, maxStepHeight))
                {
                    // 平滑移动到台阶顶部
                    Vector3 targetPos = new Vector3(
                        transform.position.x,
                        hit.point.y,
                        transform.position.z
                    );
                    transform.position = Vector3.Lerp(transform.position, targetPos,
                        stepSmooth * Time.deltaTime);
                }
            }
        }
    }

    bool IsMoving()
    {
        return GetMoveDirection().magnitude > 0.1f;
    }

    Vector3 GetMoveDirection()
    {
        Vector2 input = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical"));
        return new Vector3(input.x, 0, input.y).normalized;
    }
}
```

## 跳跃实现

跳跃看似简单，但要做出优秀的手感需要考虑很多细节。

### 基础跳跃

```csharp
public class JumpController : MonoBehaviour
{
    [Header("跳跃参数")]
    public float jumpHeight = 2f;
    public float jumpDuration = 0.4f;
    public float fallMultiplier = 2.5f;
    public float lowJumpMultiplier = 2f;

    private Rigidbody rb;
    private GroundDetector groundDetector;
    private bool jumpPressed;
    private bool jumpHeld;

    // 根据高度和时间计算跳跃初速度
    float CalculateJumpVelocity()
    {
        // 使用运动学公式：v = sqrt(2 * g * h)
        // 但这里我们用自定义重力使跳跃曲线更可控
        float gravity = (2 * jumpHeight) / (jumpDuration * jumpDuration);
        return gravity * jumpDuration;
    }

    void Update()
    {
        jumpPressed = Input.GetButtonDown("Jump");
        jumpHeld = Input.GetButton("Jump");
    }

    void FixedUpdate()
    {
        if (jumpPressed && groundDetector.IsGrounded)
        {
            Jump();
        }

        ApplyBetterJumpGravity();
    }

    void Jump()
    {
        rb.linearVelocity = new Vector3(rb.linearVelocity.x, CalculateJumpVelocity(), rb.linearVelocity.z);
    }

    // 改进的跳跃重力 - 让下落更快，短按跳跃更低
    void ApplyBetterJumpGravity()
    {
        if (rb.linearVelocity.y < 0)
        {
            // 下落时增加重力
            rb.linearVelocity += Vector3.up * Physics.gravity.y * (fallMultiplier - 1) * Time.fixedDeltaTime;
        }
        else if (rb.linearVelocity.y > 0 && !jumpHeld)
        {
            // 上升时松开跳跃键，减少上升高度
            rb.linearVelocity += Vector3.up * Physics.gravity.y * (lowJumpMultiplier - 1) * Time.fixedDeltaTime;
        }
    }
}
```

### 可变高度跳跃

很多平台游戏支持根据按键时长控制跳跃高度：

```csharp
public class VariableJump : MonoBehaviour
{
    public float maxJumpHeight = 3f;
    public float minJumpHeight = 1f;
    public float timeToApex = 0.4f;

    private float gravity;
    private float maxJumpVelocity;
    private float minJumpVelocity;

    private Rigidbody rb;
    private bool isJumping;
    private bool jumpReleased;

    void Start()
    {
        rb = GetComponent<Rigidbody>();

        // 计算重力和跳跃速度
        gravity = -(2 * maxJumpHeight) / (timeToApex * timeToApex);
        maxJumpVelocity = Mathf.Abs(gravity) * timeToApex;
        minJumpVelocity = Mathf.Sqrt(2 * Mathf.Abs(gravity) * minJumpHeight);
    }

    void Update()
    {
        if (Input.GetButtonDown("Jump") && IsGrounded())
        {
            StartJump();
        }

        if (Input.GetButtonUp("Jump"))
        {
            jumpReleased = true;
        }
    }

    void FixedUpdate()
    {
        // 应用自定义重力
        rb.AddForce(Vector3.up * gravity, ForceMode.Acceleration);

        // 提前结束跳跃
        if (isJumping && jumpReleased && rb.linearVelocity.y > minJumpVelocity)
        {
            rb.linearVelocity = new Vector3(rb.linearVelocity.x, minJumpVelocity, rb.linearVelocity.z);
        }

        // 检测落地
        if (isJumping && rb.linearVelocity.y <= 0 && IsGrounded())
        {
            isJumping = false;
        }
    }

    void StartJump()
    {
        rb.linearVelocity = new Vector3(rb.linearVelocity.x, maxJumpVelocity, rb.linearVelocity.z);
        isJumping = true;
        jumpReleased = false;
    }

    bool IsGrounded()
    {
        return Physics.Raycast(transform.position, Vector3.down, 0.1f);
    }
}
```

## 空中控制

空中控制决定了角色在跳跃时的操控感。

### 空中移动

```csharp
public class AirControl : MonoBehaviour
{
    [Header("空中控制参数")]
    public float airAcceleration = 30f;
    public float airMaxSpeed = 6f;
    public float airDrag = 0.1f;

    [Header("空中转向")]
    public float airTurnSpeed = 10f;
    public bool allowAirReversal = true;

    private Rigidbody rb;
    private GroundDetector groundDetector;

    void FixedUpdate()
    {
        if (!groundDetector.IsGrounded)
        {
            ApplyAirControl();
        }
    }

    void ApplyAirControl()
    {
        Vector2 input = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical"));
        Vector3 wishDir = new Vector3(input.x, 0, input.y).normalized;

        // 获取当前水平速度
        Vector3 horizontalVelocity = new Vector3(rb.linearVelocity.x, 0, rb.linearVelocity.z);

        // 计算目标方向上的当前速度
        float currentSpeedInWishDir = Vector3.Dot(horizontalVelocity, wishDir);

        // 计算可增加的速度量
        float addSpeed = airMaxSpeed - currentSpeedInWishDir;

        if (addSpeed > 0)
        {
            // 限制加速度
            float accelSpeed = Mathf.Min(airAcceleration * Time.fixedDeltaTime, addSpeed);
            rb.linearVelocity += wishDir * accelSpeed;
        }

        // 应用空气阻力
        ApplyAirDrag();
    }

    void ApplyAirDrag()
    {
        Vector3 horizontalVelocity = new Vector3(rb.linearVelocity.x, 0, rb.linearVelocity.z);

        if (horizontalVelocity.magnitude > airMaxSpeed)
        {
            horizontalVelocity = Vector3.Lerp(horizontalVelocity,
                horizontalVelocity.normalized * airMaxSpeed,
                airDrag * Time.fixedDeltaTime);

            rb.linearVelocity = new Vector3(horizontalVelocity.x, rb.linearVelocity.y, horizontalVelocity.z);
        }
    }
}
```

### 空中冲刺/二段跳

```csharp
public class AirAbilities : MonoBehaviour
{
    [Header("二段跳")]
    public bool enableDoubleJump = true;
    public float doubleJumpForce = 8f;
    public int maxAirJumps = 1;

    [Header("空中冲刺")]
    public bool enableAirDash = true;
    public float dashSpeed = 15f;
    public float dashDuration = 0.2f;
    public float dashCooldown = 1f;

    private Rigidbody rb;
    private GroundDetector groundDetector;

    private int airJumpsRemaining;
    private bool canDash = true;
    private bool isDashing;
    private float dashTimer;
    private Vector3 dashDirection;

    void Update()
    {
        // 重置空中能力
        if (groundDetector.IsGrounded)
        {
            airJumpsRemaining = maxAirJumps;
            canDash = true;
        }

        // 二段跳
        if (Input.GetButtonDown("Jump") && !groundDetector.IsGrounded && airJumpsRemaining > 0)
        {
            DoubleJump();
        }

        // 空中冲刺
        if (Input.GetButtonDown("Dash") && !groundDetector.IsGrounded && canDash && !isDashing)
        {
            StartAirDash();
        }

        // 更新冲刺状态
        UpdateDash();
    }

    void DoubleJump()
    {
        rb.linearVelocity = new Vector3(rb.linearVelocity.x, doubleJumpForce, rb.linearVelocity.z);
        airJumpsRemaining--;
    }

    void StartAirDash()
    {
        // 获取冲刺方向
        Vector2 input = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical"));
        dashDirection = input.magnitude > 0.1f
            ? new Vector3(input.x, 0, input.y).normalized
            : transform.forward;

        isDashing = true;
        dashTimer = dashDuration;
        canDash = false;

        // 重置垂直速度
        rb.linearVelocity = new Vector3(rb.linearVelocity.x, 0, rb.linearVelocity.z);
        rb.useGravity = false;
    }

    void UpdateDash()
    {
        if (isDashing)
        {
            dashTimer -= Time.deltaTime;
            rb.linearVelocity = dashDirection * dashSpeed;

            if (dashTimer <= 0)
            {
                EndDash();
            }
        }
    }

    void EndDash()
    {
        isDashing = false;
        rb.useGravity = true;

        // 冲刺后保留部分速度
        rb.linearVelocity = dashDirection * (dashSpeed * 0.3f);

        // 开始冷却
        StartCoroutine(DashCooldown());
    }

    System.Collections.IEnumerator DashCooldown()
    {
        yield return new WaitForSeconds(dashCooldown);
        if (groundDetector.IsGrounded)
        {
            canDash = true;
        }
    }
}
```

## 碰撞响应

碰撞响应决定了角色与环境交互的方式。

### 碰撞解决

```csharp
public class CollisionResolver : MonoBehaviour
{
    public float skinWidth = 0.01f;
    public float pushOutForce = 5f;
    public int maxIterations = 3;

    private CapsuleCollider capsule;

    void Start()
    {
        capsule = GetComponent<CapsuleCollider>();
    }

    void FixedUpdate()
    {
        ResolveOverlaps();
    }

    void ResolveOverlaps()
    {
        for (int i = 0; i < maxIterations; i++)
        {
            Vector3 point1 = transform.position + Vector3.up * capsule.radius;
            Vector3 point2 = transform.position + Vector3.up * (capsule.height - capsule.radius);

            Collider[] overlaps = Physics.OverlapCapsule(
                point1, point2,
                capsule.radius - skinWidth,
                ~0, QueryTriggerInteraction.Ignore
            );

            bool resolved = true;

            foreach (Collider overlap in overlaps)
            {
                if (overlap == capsule) continue;

                if (Physics.ComputePenetration(
                    capsule, transform.position, transform.rotation,
                    overlap, overlap.transform.position, overlap.transform.rotation,
                    out Vector3 direction, out float distance))
                {
                    transform.position += direction * (distance + skinWidth);
                    resolved = false;
                }
            }

            if (resolved) break;
        }
    }
}
```

### 移动平台支持

```csharp
public class MovingPlatformHandler : MonoBehaviour
{
    private Transform currentPlatform;
    private Vector3 lastPlatformPosition;
    private Quaternion lastPlatformRotation;

    private GroundDetector groundDetector;

    void Start()
    {
        groundDetector = GetComponent<GroundDetector>();
    }

    void LateUpdate()
    {
        HandlePlatformMovement();
    }

    void HandlePlatformMovement()
    {
        if (groundDetector.IsGrounded && groundDetector.GroundCollider != null)
        {
            Transform newPlatform = groundDetector.GroundCollider.transform;

            if (newPlatform.CompareTag("MovingPlatform"))
            {
                if (currentPlatform == newPlatform)
                {
                    // 跟随平台移动
                    Vector3 platformDelta = newPlatform.position - lastPlatformPosition;
                    transform.position += platformDelta;

                    // 跟随平台旋转
                    Quaternion rotationDelta = newPlatform.rotation * Quaternion.Inverse(lastPlatformRotation);
                    Vector3 rotatedOffset = rotationDelta * (transform.position - newPlatform.position);
                    transform.position = newPlatform.position + rotatedOffset;
                    transform.rotation = rotationDelta * transform.rotation;
                }

                currentPlatform = newPlatform;
                lastPlatformPosition = newPlatform.position;
                lastPlatformRotation = newPlatform.rotation;
            }
            else
            {
                currentPlatform = null;
            }
        }
        else
        {
            currentPlatform = null;
        }
    }
}
```

## 土狼时间（Coyote Time）

土狼时间是一种宽容机制，允许玩家在离开平台边缘后的短暂时间内仍然可以跳跃，命名来源于卡通片中狼跑出悬崖后才开始下落的经典场景。

### 实现原理

```csharp
public class CoyoteTime : MonoBehaviour
{
    [Header("土狼时间设置")]
    public float coyoteTimeDuration = 0.15f;

    private GroundDetector groundDetector;
    private float coyoteTimeCounter;
    private bool wasGroundedLastFrame;
    private bool usedCoyoteTime;

    public bool CanJump => coyoteTimeCounter > 0 && !usedCoyoteTime;

    void Update()
    {
        // 检测是否刚离开地面
        if (wasGroundedLastFrame && !groundDetector.IsGrounded)
        {
            // 开始土狼时间
            coyoteTimeCounter = coyoteTimeDuration;
            usedCoyoteTime = false;
        }

        // 土狼时间倒计时
        if (coyoteTimeCounter > 0)
        {
            coyoteTimeCounter -= Time.deltaTime;
        }

        // 落地重置
        if (groundDetector.IsGrounded)
        {
            coyoteTimeCounter = 0;
            usedCoyoteTime = false;
        }

        wasGroundedLastFrame = groundDetector.IsGrounded;
    }

    public void ConsumeCoyoteTime()
    {
        usedCoyoteTime = true;
        coyoteTimeCounter = 0;
    }
}
```

### 完整跳跃系统整合

```csharp
public class AdvancedJumpController : MonoBehaviour
{
    [Header("基础跳跃")]
    public float jumpForce = 10f;

    [Header("土狼时间")]
    public float coyoteTime = 0.15f;

    [Header("跳跃缓冲")]
    public float jumpBufferTime = 0.1f;

    private Rigidbody rb;
    private GroundDetector groundDetector;

    private float coyoteTimeCounter;
    private float jumpBufferCounter;
    private bool wasGroundedLastFrame;
    private bool hasJumped;

    void Update()
    {
        UpdateCoyoteTime();
        UpdateJumpBuffer();
        TryJump();
    }

    void UpdateCoyoteTime()
    {
        if (groundDetector.IsGrounded)
        {
            coyoteTimeCounter = coyoteTime;
            hasJumped = false;
        }
        else
        {
            coyoteTimeCounter -= Time.deltaTime;
        }

        wasGroundedLastFrame = groundDetector.IsGrounded;
    }

    void UpdateJumpBuffer()
    {
        if (Input.GetButtonDown("Jump"))
        {
            jumpBufferCounter = jumpBufferTime;
        }
        else
        {
            jumpBufferCounter -= Time.deltaTime;
        }
    }

    void TryJump()
    {
        // 检查是否可以跳跃（地面上或在土狼时间内）
        bool canJump = (groundDetector.IsGrounded || coyoteTimeCounter > 0) && !hasJumped;

        // 检查是否有跳跃输入（直接按下或缓冲中）
        bool wantsToJump = jumpBufferCounter > 0;

        if (canJump && wantsToJump)
        {
            ExecuteJump();
        }
    }

    void ExecuteJump()
    {
        rb.linearVelocity = new Vector3(rb.linearVelocity.x, jumpForce, rb.linearVelocity.z);

        hasJumped = true;
        coyoteTimeCounter = 0;
        jumpBufferCounter = 0;
    }
}
```

## 输入缓冲

输入缓冲允许玩家在实际可以执行动作之前就按下按键，系统会在条件满足时自动执行该动作。

### 通用输入缓冲系统

```csharp
public class InputBuffer : MonoBehaviour
{
    [System.Serializable]
    public class BufferedInput
    {
        public string actionName;
        public float bufferTime;
        public float timestamp;
        public bool consumed;

        public bool IsValid => Time.time - timestamp <= bufferTime && !consumed;

        public void Buffer()
        {
            timestamp = Time.time;
            consumed = false;
        }

        public void Consume()
        {
            consumed = true;
        }
    }

    public float defaultBufferTime = 0.15f;

    private Dictionary<string, BufferedInput> buffers = new Dictionary<string, BufferedInput>();

    public void RegisterAction(string actionName, float bufferTime = -1)
    {
        if (bufferTime < 0) bufferTime = defaultBufferTime;

        buffers[actionName] = new BufferedInput
        {
            actionName = actionName,
            bufferTime = bufferTime,
            timestamp = -1000f,
            consumed = true
        };
    }

    public void BufferInput(string actionName)
    {
        if (buffers.TryGetValue(actionName, out BufferedInput input))
        {
            input.Buffer();
        }
    }

    public bool ConsumeBuffer(string actionName)
    {
        if (buffers.TryGetValue(actionName, out BufferedInput input) && input.IsValid)
        {
            input.Consume();
            return true;
        }
        return false;
    }

    public bool HasBufferedInput(string actionName)
    {
        return buffers.TryGetValue(actionName, out BufferedInput input) && input.IsValid;
    }
}

// 使用示例
public class PlayerController : MonoBehaviour
{
    private InputBuffer inputBuffer;
    private GroundDetector groundDetector;

    void Start()
    {
        inputBuffer = GetComponent<InputBuffer>();
        inputBuffer.RegisterAction("Jump", 0.15f);
        inputBuffer.RegisterAction("Attack", 0.2f);
        inputBuffer.RegisterAction("Dash", 0.1f);
    }

    void Update()
    {
        // 缓冲输入
        if (Input.GetButtonDown("Jump"))
            inputBuffer.BufferInput("Jump");
        if (Input.GetButtonDown("Fire1"))
            inputBuffer.BufferInput("Attack");
        if (Input.GetButtonDown("Dash"))
            inputBuffer.BufferInput("Dash");

        // 尝试消费缓冲
        if (groundDetector.IsGrounded && inputBuffer.ConsumeBuffer("Jump"))
        {
            Jump();
        }
    }

    void Jump() { /* 跳跃逻辑 */ }
}
```

### 组合技缓冲

```csharp
public class ComboBuffer : MonoBehaviour
{
    [System.Serializable]
    public class ComboStep
    {
        public string inputName;
        public float windowTime;
    }

    [System.Serializable]
    public class Combo
    {
        public string comboName;
        public ComboStep[] steps;
        public UnityEvent onComboComplete;
    }

    public Combo[] combos;

    private List<(string input, float time)> inputHistory = new List<(string, float)>();
    private float historyDuration = 1f;

    void Update()
    {
        CleanHistory();
        CheckCombos();
    }

    public void RecordInput(string inputName)
    {
        inputHistory.Add((inputName, Time.time));
    }

    void CleanHistory()
    {
        inputHistory.RemoveAll(i => Time.time - i.time > historyDuration);
    }

    void CheckCombos()
    {
        foreach (var combo in combos)
        {
            if (CheckCombo(combo))
            {
                combo.onComboComplete?.Invoke();
                inputHistory.Clear(); // 清空历史，防止重复触发
            }
        }
    }

    bool CheckCombo(Combo combo)
    {
        if (inputHistory.Count < combo.steps.Length)
            return false;

        int historyIndex = inputHistory.Count - 1;

        for (int i = combo.steps.Length - 1; i >= 0; i--)
        {
            var step = combo.steps[i];
            bool found = false;

            for (int j = historyIndex; j >= 0; j--)
            {
                if (inputHistory[j].input == step.inputName)
                {
                    // 检查时间窗口
                    if (i < combo.steps.Length - 1)
                    {
                        float timeSinceNextStep = inputHistory[historyIndex].time - inputHistory[j].time;
                        if (timeSinceNextStep > step.windowTime)
                            return false;
                    }

                    historyIndex = j - 1;
                    found = true;
                    break;
                }
            }

            if (!found) return false;
        }

        return true;
    }
}
```

## 完整角色控制器示例

将以上所有系统整合成一个完整的角色控制器：

```csharp
using UnityEngine;
using System;

[RequireComponent(typeof(Rigidbody))]
[RequireComponent(typeof(CapsuleCollider))]
public class CompleteCharacterController : MonoBehaviour
{
    #region 参数定义

    [Header("移动")]
    public float walkSpeed = 6f;
    public float runSpeed = 10f;
    public float acceleration = 80f;
    public float deceleration = 100f;
    public float turnSpeed = 15f;

    [Header("跳跃")]
    public float jumpHeight = 2f;
    public float timeToApex = 0.4f;
    public float fallMultiplier = 2.5f;
    public float lowJumpMultiplier = 2f;

    [Header("空中控制")]
    public float airAcceleration = 40f;
    public float airDeceleration = 20f;
    public float airMaxSpeed = 8f;

    [Header("地面检测")]
    public float groundCheckRadius = 0.3f;
    public float groundCheckDistance = 0.1f;
    public float maxSlopeAngle = 45f;
    public LayerMask groundLayer = ~0;

    [Header("宽容机制")]
    public float coyoteTime = 0.15f;
    public float jumpBufferTime = 0.15f;

    [Header("台阶")]
    public float maxStepHeight = 0.3f;
    public float stepSmooth = 15f;

    #endregion

    #region 私有变量

    private Rigidbody rb;
    private CapsuleCollider capsule;

    // 计算出的物理值
    private float gravity;
    private float jumpVelocity;

    // 状态
    private bool isGrounded;
    private bool wasGrounded;
    private Vector3 groundNormal;
    private float groundAngle;

    // 土狼时间
    private float coyoteTimeCounter;
    private bool usedCoyoteTime;

    // 跳跃缓冲
    private float jumpBufferCounter;

    // 输入
    private Vector2 moveInput;
    private bool jumpPressed;
    private bool jumpHeld;
    private bool runHeld;

    // 速度
    private Vector3 velocity;

    #endregion

    #region 公共属性

    public bool IsGrounded => isGrounded;
    public bool IsRunning => runHeld && moveInput.magnitude > 0.1f;
    public Vector3 Velocity => rb.linearVelocity;
    public float CurrentSpeed => new Vector3(rb.linearVelocity.x, 0, rb.linearVelocity.z).magnitude;

    // 事件
    public event Action OnJump;
    public event Action OnLand;

    #endregion

    void Awake()
    {
        rb = GetComponent<Rigidbody>();
        capsule = GetComponent<CapsuleCollider>();

        ConfigureRigidbody();
        CalculateJumpParameters();
    }

    void ConfigureRigidbody()
    {
        rb.freezeRotation = true;
        rb.collisionDetectionMode = CollisionDetectionMode.Continuous;
        rb.interpolation = RigidbodyInterpolation.Interpolate;
    }

    void CalculateJumpParameters()
    {
        // 根据跳跃高度和到达顶点的时间计算重力和初速度
        gravity = -(2 * jumpHeight) / (timeToApex * timeToApex);
        jumpVelocity = Mathf.Abs(gravity) * timeToApex;
    }

    void Update()
    {
        GatherInput();
        UpdateJumpBuffer();
    }

    void GatherInput()
    {
        moveInput = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical"));
        jumpPressed = Input.GetButtonDown("Jump");
        jumpHeld = Input.GetButton("Jump");
        runHeld = Input.GetKey(KeyCode.LeftShift);
    }

    void UpdateJumpBuffer()
    {
        if (jumpPressed)
        {
            jumpBufferCounter = jumpBufferTime;
        }
        else if (jumpBufferCounter > 0)
        {
            jumpBufferCounter -= Time.deltaTime;
        }
    }

    void FixedUpdate()
    {
        CheckGround();
        UpdateCoyoteTime();

        HandleMovement();
        HandleJump();
        ApplyGravity();

        TryStepUp();

        wasGrounded = isGrounded;
    }

    #region 地面检测

    void CheckGround()
    {
        Vector3 origin = transform.position + Vector3.up * (groundCheckRadius + 0.02f);

        if (Physics.SphereCast(origin, groundCheckRadius, Vector3.down,
            out RaycastHit hit, groundCheckDistance + 0.02f, groundLayer, QueryTriggerInteraction.Ignore))
        {
            groundNormal = hit.normal;
            groundAngle = Vector3.Angle(Vector3.up, groundNormal);
            isGrounded = groundAngle <= maxSlopeAngle;

            // 落地事件
            if (isGrounded && !wasGrounded)
            {
                OnLand?.Invoke();
            }
        }
        else
        {
            isGrounded = false;
            groundNormal = Vector3.up;
            groundAngle = 0f;
        }
    }

    #endregion

    #region 土狼时间

    void UpdateCoyoteTime()
    {
        if (isGrounded)
        {
            coyoteTimeCounter = coyoteTime;
            usedCoyoteTime = false;
        }
        else if (!usedCoyoteTime)
        {
            coyoteTimeCounter -= Time.fixedDeltaTime;
        }
    }

    bool CanUseCoyoteTime()
    {
        return !isGrounded && coyoteTimeCounter > 0 && !usedCoyoteTime;
    }

    #endregion

    #region 移动

    void HandleMovement()
    {
        Vector3 wishDir = new Vector3(moveInput.x, 0, moveInput.y).normalized;
        float targetSpeed = runHeld ? runSpeed : walkSpeed;

        if (isGrounded)
        {
            GroundMove(wishDir, targetSpeed);
        }
        else
        {
            AirMove(wishDir);
        }
    }

    void GroundMove(Vector3 wishDir, float targetSpeed)
    {
        // 将方向投影到地面
        if (groundAngle > 0)
        {
            wishDir = Vector3.ProjectOnPlane(wishDir, groundNormal).normalized;
        }

        Vector3 currentHorizontalVelocity = new Vector3(rb.linearVelocity.x, 0, rb.linearVelocity.z);
        Vector3 targetVelocity = wishDir * targetSpeed;

        float accel = wishDir.magnitude > 0.1f ? acceleration : deceleration;

        Vector3 newVelocity = Vector3.MoveTowards(
            currentHorizontalVelocity,
            targetVelocity,
            accel * Time.fixedDeltaTime
        );

        rb.linearVelocity = new Vector3(newVelocity.x, rb.linearVelocity.y, newVelocity.z);
    }

    void AirMove(Vector3 wishDir)
    {
        Vector3 horizontalVelocity = new Vector3(rb.linearVelocity.x, 0, rb.linearVelocity.z);

        float currentSpeedInWishDir = Vector3.Dot(horizontalVelocity, wishDir);
        float addSpeed = airMaxSpeed - currentSpeedInWishDir;

        if (addSpeed > 0)
        {
            float accelSpeed = Mathf.Min(airAcceleration * Time.fixedDeltaTime, addSpeed);
            Vector3 accelVelocity = wishDir * accelSpeed;
            rb.linearVelocity += accelVelocity;
        }

        // 空气阻力
        if (horizontalVelocity.magnitude > airMaxSpeed && wishDir.magnitude < 0.1f)
        {
            Vector3 drag = -horizontalVelocity.normalized * airDeceleration * Time.fixedDeltaTime;
            rb.linearVelocity += new Vector3(drag.x, 0, drag.z);
        }
    }

    #endregion

    #region 跳跃

    void HandleJump()
    {
        bool canJump = isGrounded || CanUseCoyoteTime();
        bool wantsToJump = jumpBufferCounter > 0;

        if (canJump && wantsToJump)
        {
            ExecuteJump();
        }
    }

    void ExecuteJump()
    {
        rb.linearVelocity = new Vector3(rb.linearVelocity.x, jumpVelocity, rb.linearVelocity.z);

        usedCoyoteTime = true;
        jumpBufferCounter = 0;

        OnJump?.Invoke();
    }

    void ApplyGravity()
    {
        if (isGrounded && rb.linearVelocity.y <= 0)
        {
            // 在地面时应用小的向下力以保持贴地
            rb.AddForce(Vector3.down * 10f, ForceMode.Acceleration);
            return;
        }

        float gravityMultiplier = 1f;

        if (rb.linearVelocity.y < 0)
        {
            // 下落时增加重力
            gravityMultiplier = fallMultiplier;
        }
        else if (rb.linearVelocity.y > 0 && !jumpHeld)
        {
            // 上升时松开跳跃键
            gravityMultiplier = lowJumpMultiplier;
        }

        rb.AddForce(Vector3.up * gravity * gravityMultiplier, ForceMode.Acceleration);
    }

    #endregion

    #region 台阶攀爬

    void TryStepUp()
    {
        if (!isGrounded || moveInput.magnitude < 0.1f)
            return;

        Vector3 moveDir = new Vector3(moveInput.x, 0, moveInput.y).normalized;
        Vector3 lowerOrigin = transform.position + Vector3.up * 0.1f;
        Vector3 upperOrigin = transform.position + Vector3.up * maxStepHeight;

        // 低位检测到障碍
        if (Physics.Raycast(lowerOrigin, moveDir, 0.5f, groundLayer))
        {
            // 高位没有障碍
            if (!Physics.Raycast(upperOrigin, moveDir, 0.5f, groundLayer))
            {
                // 检测台阶顶部
                Vector3 stepCheckOrigin = upperOrigin + moveDir * 0.5f;
                if (Physics.Raycast(stepCheckOrigin, Vector3.down, out RaycastHit hit, maxStepHeight))
                {
                    Vector3 targetPos = new Vector3(transform.position.x, hit.point.y + 0.02f, transform.position.z);
                    transform.position = Vector3.Lerp(transform.position, targetPos, stepSmooth * Time.fixedDeltaTime);
                }
            }
        }
    }

    #endregion

    #region 调试可视化

    void OnDrawGizmosSelected()
    {
        // 地面检测范围
        Vector3 origin = transform.position + Vector3.up * (groundCheckRadius + 0.02f);
        Gizmos.color = isGrounded ? Color.green : Color.red;
        Gizmos.DrawWireSphere(origin - Vector3.up * groundCheckDistance, groundCheckRadius);

        // 台阶检测
        Gizmos.color = Color.yellow;
        Vector3 stepLower = transform.position + Vector3.up * 0.1f;
        Vector3 stepUpper = transform.position + Vector3.up * maxStepHeight;
        Gizmos.DrawLine(stepLower, stepLower + transform.forward * 0.5f);
        Gizmos.DrawLine(stepUpper, stepUpper + transform.forward * 0.5f);
    }

    #endregion
}
```

## 调试与优化

### 性能优化

```csharp
public class OptimizedGroundCheck : MonoBehaviour
{
    // 使用 NonAlloc 版本避免 GC
    private RaycastHit[] hitBuffer = new RaycastHit[5];
    private Collider[] overlapBuffer = new Collider[10];

    public bool CheckGroundOptimized()
    {
        int hitCount = Physics.SphereCastNonAlloc(
            transform.position + Vector3.up * 0.5f,
            0.3f,
            Vector3.down,
            hitBuffer,
            0.3f
        );

        return hitCount > 0;
    }

    public bool CheckOverlapOptimized()
    {
        int overlapCount = Physics.OverlapSphereNonAlloc(
            transform.position,
            0.5f,
            overlapBuffer
        );

        return overlapCount > 1; // 排除自己
    }
}
```

### 调试工具

```csharp
public class CharacterDebugger : MonoBehaviour
{
    public CompleteCharacterController controller;
    public bool showDebugUI = true;

    void OnGUI()
    {
        if (!showDebugUI || controller == null) return;

        GUILayout.BeginArea(new Rect(10, 10, 300, 200));
        GUILayout.BeginVertical("box");

        GUILayout.Label($"速度: {controller.CurrentSpeed:F2} m/s");
        GUILayout.Label($"垂直速度: {controller.Velocity.y:F2} m/s");
        GUILayout.Label($"地面状态: {(controller.IsGrounded ? "站立" : "空中")}");
        GUILayout.Label($"奔跑状态: {(controller.IsRunning ? "是" : "否")}");

        GUILayout.EndVertical();
        GUILayout.EndArea();
    }
}
```

## 不同游戏类型的调参建议

### 平台跳跃游戏

```csharp
// 马里奥风格
public class PlatformerSettings
{
    public float walkSpeed = 8f;
    public float runSpeed = 14f;
    public float jumpHeight = 4f;
    public float coyoteTime = 0.1f;      // 较短的土狼时间
    public float jumpBuffer = 0.15f;
    public float airControl = 0.8f;       // 较高的空中控制
    public float fallMultiplier = 3f;     // 快速下落
}
```

### 第一人称射击游戏

```csharp
// CS/COD 风格
public class FPSSettings
{
    public float walkSpeed = 5f;
    public float runSpeed = 7f;
    public float jumpHeight = 1.2f;
    public float coyoteTime = 0.05f;      // 很短或没有
    public float airControl = 0.1f;       // 很低的空中控制
    public float acceleration = 100f;     // 快速响应
}
```

### 动作冒险游戏

```csharp
// 塞尔达/刺客信条风格
public class ActionAdventureSettings
{
    public float walkSpeed = 4f;
    public float runSpeed = 8f;
    public float jumpHeight = 2f;
    public float coyoteTime = 0.2f;       // 宽容的土狼时间
    public float jumpBuffer = 0.2f;
    public float airControl = 0.5f;       // 中等空中控制
}
```

## 面试要点

### 高频面试题

**1. 运动学和动力学控制器各有什么优缺点？**

- 运动学：可控性强，不受外力影响，但需要手动处理所有碰撞
- 动力学：自动处理物理交互，但可预测性较差

**2. 什么是土狼时间？为什么要实现它？**

土狼时间是一种宽容机制，允许玩家在离开平台边缘后短暂时间内仍可跳跃。它能显著提升游戏手感，减少玩家"明明按了却没跳"的挫败感。

**3. 如何处理斜坡上的角色移动？**

- 将移动方向投影到斜坡表面
- 检测斜坡角度，超过阈值时让角色滑动
- 使用反向力抵消重力沿斜坡分量，防止静止时滑动

**4. 输入缓冲的作用是什么？**

输入缓冲允许玩家提前输入指令，系统在条件满足时自动执行。这对于需要精确时机的操作（如落地瞬间跳跃）特别重要。

**5. 如何实现可变高度的跳跃？**

- 根据按键时长调整跳跃高度
- 松开跳跃键时增加重力，快速结束上升
- 设置最小和最大跳跃高度

## 延伸阅读

### 推荐资源

- **GDC 演讲**：《Celeste》的角色控制器设计
- **YouTube**：Mix and Jam 频道的角色控制器教程
- **论文**：《Quake 3》的物理和移动系统分析

### 参考游戏

- **《空洞骑士》**：优秀的 2D 平台动作游戏角色控制
- **《蔚蓝》**：极致的平台跳跃手感
- **《超级马里奥：奥德赛》**：丰富的 3D 移动机制

### 相关主题

- **动画系统**：根动作（Root Motion）vs 程序化移动
- **网络同步**：多人游戏中的角色移动预测和校正
- **寻路系统**：NPC 角色的导航和移动

## 总结

一个优秀的角色控制器需要在物理真实性和游戏性之间找到平衡。通过本文的学习，你应该能够：

1. 理解运动学和动力学控制器的区别和适用场景
2. 实现准确的地面检测和斜坡处理
3. 设计流畅的跳跃系统，包括可变高度跳跃
4. 应用土狼时间和输入缓冲等宽容机制
5. 根据游戏类型调整参数以获得最佳手感

记住，优秀的角色控制器不仅仅是技术实现，更是对玩家体验的深刻理解。多玩优秀的游戏，分析它们的控制器设计，不断迭代和调整，才能做出真正出色的角色控制系统。
