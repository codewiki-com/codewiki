---
title: 游戏数学基础
description: 掌握游戏开发必备的数学知识：向量、矩阵、四元数和碰撞检测算法
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - 数学
  - 向量
  - 矩阵
  - 四元数
status: imported
origin: old/src/content/docs/gamedev/game-math.zh.md
divergence: 0.162
issues:
  - title-lang-en
  - title-language
legacy:
  category: GameDev
  subcategory: Fundamentals
  order: 4
  lastUpdated: 2026-01-07
---

数学是游戏开发的核心基石。从角色移动到物理模拟，从相机控制到碰撞检测，几乎所有游戏系统都依赖于数学计算。本文将系统介绍游戏开发中最常用的数学知识，包括向量运算、矩阵变换、四元数旋转、贝塞尔曲线和碰撞检测算法，帮助你建立扎实的游戏数学基础。

## 向量运算 (Vector Operations)

向量是游戏开发中最基础也是最重要的数学工具。它可以表示位置、方向、速度、力等各种物理量。

### 向量基础概念

向量是具有大小（模长）和方向的量。在游戏中，我们通常使用二维向量（2D）或三维向量（3D）。

```csharp
// Unity C# - 向量基础
using UnityEngine;

public class VectorBasics : MonoBehaviour
{
    void Start()
    {
        // 创建向量
        Vector3 position = new Vector3(1.0f, 2.0f, 3.0f);
        Vector3 direction = new Vector3(0.0f, 0.0f, 1.0f);

        // 向量分量访问
        float x = position.x;  // 1.0
        float y = position.y;  // 2.0
        float z = position.z;  // 3.0

        // 向量模长（长度）
        float magnitude = position.magnitude;  // sqrt(1^2 + 2^2 + 3^2) = 3.74

        // 单位向量（归一化）
        Vector3 normalized = position.normalized;  // 长度为1，方向不变

        // 常用预定义向量
        Vector3 up = Vector3.up;        // (0, 1, 0)
        Vector3 right = Vector3.right;  // (1, 0, 0)
        Vector3 forward = Vector3.forward; // (0, 0, 1)
        Vector3 zero = Vector3.zero;    // (0, 0, 0)
        Vector3 one = Vector3.one;      // (1, 1, 1)
    }
}
```

```cpp
// Unreal Engine C++ - 向量基础
#include "Math/Vector.h"

void AVectorExample::BeginPlay()
{
    Super::BeginPlay();

    // 创建向量
    FVector Position(1.0f, 2.0f, 3.0f);
    FVector Direction(0.0f, 0.0f, 1.0f);

    // 向量分量访问
    float X = Position.X;
    float Y = Position.Y;
    float Z = Position.Z;

    // 向量模长
    float Length = Position.Size();      // 欧几里得长度
    float LengthSq = Position.SizeSquared(); // 平方长度（更高效）

    // 单位向量
    FVector Normalized = Position.GetSafeNormal(); // 安全归一化，处理零向量

    // 常用预定义向量
    FVector Up = FVector::UpVector;       // (0, 0, 1) - 注意UE使用Z-up
    FVector Right = FVector::RightVector; // (0, 1, 0)
    FVector Forward = FVector::ForwardVector; // (1, 0, 0)
}
```

### 向量加法与减法

向量加法用于计算位移、合力等；向量减法常用于计算从一个点指向另一个点的方向。

```csharp
// Unity C# - 向量加减法
public class VectorAddSub : MonoBehaviour
{
    public Transform target;
    public float moveSpeed = 5.0f;

    void Update()
    {
        // 向量加法：位置 + 位移 = 新位置
        Vector3 velocity = Vector3.forward * moveSpeed * Time.deltaTime;
        transform.position = transform.position + velocity;

        // 向量减法：计算从自身指向目标的方向
        Vector3 directionToTarget = target.position - transform.position;

        // 获取单位方向向量
        Vector3 normalizedDirection = directionToTarget.normalized;

        // 计算距离
        float distance = directionToTarget.magnitude;

        // 朝向目标移动
        if (distance > 0.1f)
        {
            transform.position += normalizedDirection * moveSpeed * Time.deltaTime;
        }
    }
}
```

```cpp
// Unreal Engine C++ - 向量加减法
void ACharacterMovement::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    if (TargetActor)
    {
        // 计算指向目标的方向
        FVector DirectionToTarget = TargetActor->GetActorLocation() - GetActorLocation();
        float Distance = DirectionToTarget.Size();

        // 归一化方向
        FVector NormalizedDirection = DirectionToTarget.GetSafeNormal();

        // 移动
        if (Distance > 10.0f)
        {
            FVector NewLocation = GetActorLocation() + NormalizedDirection * MoveSpeed * DeltaTime;
            SetActorLocation(NewLocation);
        }
    }
}
```

### 向量数乘

向量与标量相乘，改变向量的长度但不改变方向（负数会反向）。

```csharp
// Unity C# - 向量数乘应用
public class VectorScaling : MonoBehaviour
{
    void Example()
    {
        Vector3 velocity = new Vector3(1, 0, 0);

        // 加速：向量乘以大于1的标量
        Vector3 accelerated = velocity * 2.0f;  // (2, 0, 0)

        // 减速：向量乘以小于1的标量
        Vector3 decelerated = velocity * 0.5f;  // (0.5, 0, 0)

        // 反向：向量乘以负数
        Vector3 reversed = velocity * -1.0f;    // (-1, 0, 0)

        // 应用时间缩放
        float deltaTime = Time.deltaTime;
        Vector3 movement = velocity * 5.0f * deltaTime;

        // 将任意向量缩放到指定长度
        Vector3 direction = new Vector3(3, 4, 0);  // 长度为5
        float desiredLength = 10.0f;
        Vector3 scaledVector = direction.normalized * desiredLength;
    }
}
```

### 点积 (Dot Product)

点积是向量运算中最重要的操作之一。它返回一个标量值，可用于计算夹角、判断方向关系、投影等。

$$\vec{a} \cdot \vec{b} = |\vec{a}||\vec{b}|\cos\theta = a_x b_x + a_y b_y + a_z b_z$$

**点积的几何意义**：
- 结果 > 0：两向量夹角小于90度（大致同向）
- 结果 = 0：两向量垂直
- 结果 < 0：两向量夹角大于90度（大致反向）

```csharp
// Unity C# - 点积应用
public class DotProductExamples : MonoBehaviour
{
    public Transform target;
    public float fieldOfViewAngle = 60.0f;

    void Update()
    {
        // 应用1：判断目标是否在前方
        Vector3 toTarget = (target.position - transform.position).normalized;
        Vector3 forward = transform.forward;

        float dot = Vector3.Dot(forward, toTarget);

        if (dot > 0)
        {
            Debug.Log("目标在前方");
        }
        else
        {
            Debug.Log("目标在后方");
        }

        // 应用2：视野检测（FOV Check）
        // 将角度转换为点积阈值
        float threshold = Mathf.Cos(fieldOfViewAngle * 0.5f * Mathf.Deg2Rad);

        if (dot > threshold)
        {
            Debug.Log("目标在视野内");
        }

        // 应用3：计算两向量夹角
        float angleRadians = Mathf.Acos(Mathf.Clamp(dot, -1f, 1f));
        float angleDegrees = angleRadians * Mathf.Rad2Deg;

        // Unity提供的便捷方法
        float angle = Vector3.Angle(forward, toTarget);

        // 应用4：向量投影
        // 将velocity投影到groundNormal定义的平面上
        Vector3 velocity = new Vector3(1, -1, 0);
        Vector3 groundNormal = Vector3.up;

        // 投影到法线方向的分量
        float normalComponent = Vector3.Dot(velocity, groundNormal);

        // 从速度中减去法线分量，得到平行于地面的速度
        Vector3 groundVelocity = velocity - groundNormal * normalComponent;
    }

    // 应用5：光照计算（Lambert漫反射）
    float CalculateDiffuseLight(Vector3 normal, Vector3 lightDirection)
    {
        // 光照方向指向光源
        float NdotL = Vector3.Dot(normal, -lightDirection);
        return Mathf.Max(0, NdotL);  // 限制在[0,1]范围
    }
}
```

```cpp
// Unreal Engine C++ - 点积应用
void AEnemyAI::CheckPlayerVisibility()
{
    APlayerController* PC = GetWorld()->GetFirstPlayerController();
    if (!PC) return;

    APawn* PlayerPawn = PC->GetPawn();
    if (!PlayerPawn) return;

    FVector ToPlayer = (PlayerPawn->GetActorLocation() - GetActorLocation()).GetSafeNormal();
    FVector Forward = GetActorForwardVector();

    // 点积计算
    float DotResult = FVector::DotProduct(Forward, ToPlayer);

    // 视野角度检测
    float FOVThreshold = FMath::Cos(FMath::DegreesToRadians(FieldOfView * 0.5f));

    if (DotResult > FOVThreshold)
    {
        // 玩家在视野内，进行射线检测确认可见性
        FHitResult HitResult;
        FCollisionQueryParams Params;
        Params.AddIgnoredActor(this);

        bool bHit = GetWorld()->LineTraceSingleByChannel(
            HitResult,
            GetActorLocation(),
            PlayerPawn->GetActorLocation(),
            ECC_Visibility,
            Params
        );

        if (!bHit || HitResult.GetActor() == PlayerPawn)
        {
            OnPlayerSpotted(PlayerPawn);
        }
    }
}
```

### 叉积 (Cross Product)

叉积返回一个垂直于两个输入向量的新向量（仅适用于3D向量）。它遵循右手定则。

$$\vec{a} \times \vec{b} = (a_y b_z - a_z b_y, a_z b_x - a_x b_z, a_x b_y - a_y b_x)$$

**叉积的几何意义**：
- 结果向量垂直于输入的两个向量
- 结果向量的模长等于两向量构成的平行四边形面积
- 方向遵循右手定则

```csharp
// Unity C# - 叉积应用
public class CrossProductExamples : MonoBehaviour
{
    public Transform target;

    void Update()
    {
        Vector3 toTarget = target.position - transform.position;
        Vector3 forward = transform.forward;

        // 应用1：判断目标在左侧还是右侧
        Vector3 cross = Vector3.Cross(forward, toTarget);

        if (cross.y > 0)
        {
            Debug.Log("目标在右侧");
        }
        else if (cross.y < 0)
        {
            Debug.Log("目标在左侧");
        }
        else
        {
            Debug.Log("目标在正前方或正后方");
        }

        // 应用2：计算法线（用于构建坐标系或计算面法线）
        Vector3 v1 = new Vector3(1, 0, 0);
        Vector3 v2 = new Vector3(0, 1, 0);
        Vector3 normal = Vector3.Cross(v1, v2).normalized;  // (0, 0, 1)

        // 应用3：计算三角形面积
        Vector3 a = new Vector3(0, 0, 0);
        Vector3 b = new Vector3(1, 0, 0);
        Vector3 c = new Vector3(0, 1, 0);

        Vector3 ab = b - a;
        Vector3 ac = c - a;
        float triangleArea = Vector3.Cross(ab, ac).magnitude * 0.5f;

        // 应用4：计算扭矩
        Vector3 forcePosition = new Vector3(1, 0, 0);  // 力的作用点
        Vector3 pivot = Vector3.zero;                   // 旋转中心
        Vector3 force = new Vector3(0, 10, 0);         // 力的方向和大小

        Vector3 leverArm = forcePosition - pivot;
        Vector3 torque = Vector3.Cross(leverArm, force);
    }

    // 应用5：平滑转向
    void SmoothTurn(Vector3 targetDirection, float turnSpeed)
    {
        Vector3 currentForward = transform.forward;
        Vector3 cross = Vector3.Cross(currentForward, targetDirection);
        float dot = Vector3.Dot(currentForward, targetDirection);

        // cross.y > 0 表示需要顺时针转，< 0 表示逆时针转
        float turnDirection = Mathf.Sign(cross.y);

        // 计算需要转的角度
        float angle = Mathf.Acos(Mathf.Clamp(dot, -1f, 1f)) * Mathf.Rad2Deg;

        // 限制每帧转动角度
        float turnAngle = Mathf.Min(angle, turnSpeed * Time.deltaTime);

        transform.Rotate(Vector3.up, turnAngle * turnDirection);
    }
}
```

```cpp
// Unreal Engine C++ - 叉积应用
void AGameCharacter::CalculateTurnDirection()
{
    if (!TargetActor) return;

    FVector ToTarget = (TargetActor->GetActorLocation() - GetActorLocation()).GetSafeNormal();
    FVector Forward = GetActorForwardVector();

    // 叉积判断左右
    FVector Cross = FVector::CrossProduct(Forward, ToTarget);

    // 在UE中，Z轴向上，所以检查Z分量
    if (Cross.Z > 0)
    {
        // 目标在右侧，顺时针转
        TurnDirection = 1.0f;
    }
    else if (Cross.Z < 0)
    {
        // 目标在左侧，逆时针转
        TurnDirection = -1.0f;
    }
    else
    {
        TurnDirection = 0.0f;
    }
}

// 构建局部坐标系
void AGameCharacter::BuildLocalCoordinateSystem()
{
    FVector WorldUp = FVector::UpVector;
    FVector Forward = GetActorForwardVector();

    // 确保Forward和Up不平行
    if (FMath::Abs(FVector::DotProduct(Forward, WorldUp)) > 0.99f)
    {
        WorldUp = FVector::ForwardVector;
    }

    // 构建正交坐标系
    FVector Right = FVector::CrossProduct(WorldUp, Forward).GetSafeNormal();
    FVector Up = FVector::CrossProduct(Forward, Right).GetSafeNormal();

    // 现在 Forward, Right, Up 构成一个正交坐标系
}
```

## 矩阵变换 (Matrix Transformations)

矩阵是表示和组合空间变换的标准数学工具。在3D游戏中，4x4矩阵可以同时表示平移、旋转和缩放变换。

### 变换矩阵基础

```csharp
// Unity C# - 矩阵基础
public class MatrixBasics : MonoBehaviour
{
    void Start()
    {
        // Unity使用Matrix4x4表示4x4变换矩阵
        Matrix4x4 identityMatrix = Matrix4x4.identity;

        // 从Transform获取变换矩阵
        Matrix4x4 localToWorld = transform.localToWorldMatrix;
        Matrix4x4 worldToLocal = transform.worldToLocalMatrix;

        // 使用矩阵变换点
        Vector3 localPoint = new Vector3(1, 0, 0);
        Vector3 worldPoint = localToWorld.MultiplyPoint3x4(localPoint);

        // 使用矩阵变换方向（不受平移影响）
        Vector3 localDirection = Vector3.forward;
        Vector3 worldDirection = localToWorld.MultiplyVector(localDirection);

        // 创建TRS矩阵（Translation-Rotation-Scale）
        Vector3 position = new Vector3(10, 5, 0);
        Quaternion rotation = Quaternion.Euler(0, 45, 0);
        Vector3 scale = new Vector3(2, 2, 2);

        Matrix4x4 trsMatrix = Matrix4x4.TRS(position, rotation, scale);
    }
}
```

### 平移矩阵 (Translation Matrix)

平移矩阵用于移动物体的位置。

$$T = \begin{bmatrix} 1 & 0 & 0 & t_x \\ 0 & 1 & 0 & t_y \\ 0 & 0 & 1 & t_z \\ 0 & 0 & 0 & 1 \end{bmatrix}$$

```csharp
// Unity C# - 平移矩阵
public class TranslationMatrix : MonoBehaviour
{
    void Example()
    {
        // 手动创建平移矩阵
        Vector3 translation = new Vector3(10, 5, 3);

        Matrix4x4 translationMatrix = Matrix4x4.identity;
        translationMatrix.m03 = translation.x;  // 第0行第3列
        translationMatrix.m13 = translation.y;  // 第1行第3列
        translationMatrix.m23 = translation.z;  // 第2行第3列

        // 或使用TRS方法
        translationMatrix = Matrix4x4.TRS(translation, Quaternion.identity, Vector3.one);

        // 应用平移
        Vector3 originalPoint = Vector3.zero;
        Vector3 translatedPoint = translationMatrix.MultiplyPoint3x4(originalPoint);
        // translatedPoint = (10, 5, 3)
    }
}
```

### 旋转矩阵 (Rotation Matrix)

旋转矩阵用于绕某个轴旋转物体。

**绕X轴旋转：**
$$R_x(\theta) = \begin{bmatrix} 1 & 0 & 0 & 0 \\ 0 & \cos\theta & -\sin\theta & 0 \\ 0 & \sin\theta & \cos\theta & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}$$

**绕Y轴旋转：**
$$R_y(\theta) = \begin{bmatrix} \cos\theta & 0 & \sin\theta & 0 \\ 0 & 1 & 0 & 0 \\ -\sin\theta & 0 & \cos\theta & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}$$

**绕Z轴旋转：**
$$R_z(\theta) = \begin{bmatrix} \cos\theta & -\sin\theta & 0 & 0 \\ \sin\theta & \cos\theta & 0 & 0 \\ 0 & 0 & 1 & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}$$

```csharp
// Unity C# - 旋转矩阵
public class RotationMatrix : MonoBehaviour
{
    void Example()
    {
        // 从欧拉角创建旋转矩阵
        Vector3 eulerAngles = new Vector3(30, 45, 60);
        Quaternion rotation = Quaternion.Euler(eulerAngles);
        Matrix4x4 rotationMatrix = Matrix4x4.Rotate(rotation);

        // 绕任意轴旋转
        Vector3 axis = Vector3.up;
        float angle = 90f;
        Quaternion axisRotation = Quaternion.AngleAxis(angle, axis);
        Matrix4x4 axisRotationMatrix = Matrix4x4.Rotate(axisRotation);

        // 手动创建绕Y轴旋转的矩阵
        float radians = 45f * Mathf.Deg2Rad;
        float cos = Mathf.Cos(radians);
        float sin = Mathf.Sin(radians);

        Matrix4x4 yRotation = Matrix4x4.identity;
        yRotation.m00 = cos;
        yRotation.m02 = sin;
        yRotation.m20 = -sin;
        yRotation.m22 = cos;

        // 应用旋转
        Vector3 originalPoint = new Vector3(1, 0, 0);
        Vector3 rotatedPoint = rotationMatrix.MultiplyPoint3x4(originalPoint);
    }
}
```

```cpp
// Unreal Engine C++ - 旋转矩阵
void AMatrixExample::RotationMatrixExample()
{
    // 从旋转器创建矩阵
    FRotator Rotation(0.0f, 45.0f, 0.0f);  // Pitch, Yaw, Roll
    FMatrix RotationMatrix = FRotationMatrix(Rotation);

    // 绕任意轴旋转
    FVector Axis = FVector::UpVector;
    float AngleDegrees = 90.0f;
    FMatrix AxisRotation = FRotationMatrix(FQuat(Axis, FMath::DegreesToRadians(AngleDegrees)));

    // 应用旋转
    FVector OriginalPoint(1.0f, 0.0f, 0.0f);
    FVector RotatedPoint = RotationMatrix.TransformPosition(OriginalPoint);

    // 变换方向向量（不受平移影响）
    FVector Direction(0.0f, 0.0f, 1.0f);
    FVector RotatedDirection = RotationMatrix.TransformVector(Direction);
}
```

### 缩放矩阵 (Scale Matrix)

缩放矩阵用于改变物体的大小。

$$S = \begin{bmatrix} s_x & 0 & 0 & 0 \\ 0 & s_y & 0 & 0 \\ 0 & 0 & s_z & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}$$

```csharp
// Unity C# - 缩放矩阵
public class ScaleMatrix : MonoBehaviour
{
    void Example()
    {
        // 创建缩放矩阵
        Vector3 scale = new Vector3(2, 1, 0.5f);
        Matrix4x4 scaleMatrix = Matrix4x4.Scale(scale);

        // 使用TRS创建
        scaleMatrix = Matrix4x4.TRS(Vector3.zero, Quaternion.identity, scale);

        // 手动创建
        Matrix4x4 manualScale = Matrix4x4.identity;
        manualScale.m00 = scale.x;
        manualScale.m11 = scale.y;
        manualScale.m22 = scale.z;

        // 应用缩放
        Vector3 originalPoint = new Vector3(1, 1, 1);
        Vector3 scaledPoint = scaleMatrix.MultiplyPoint3x4(originalPoint);
        // scaledPoint = (2, 1, 0.5)

        // 非均匀缩放对方向向量的影响
        // 注意：非均匀缩放会影响法线，需要使用逆转置矩阵
        Vector3 normal = new Vector3(0, 1, 0);
        Matrix4x4 inverseTranspose = scaleMatrix.inverse.transpose;
        Vector3 transformedNormal = inverseTranspose.MultiplyVector(normal).normalized;
    }
}
```

### 矩阵组合

矩阵的一个强大特性是可以通过乘法组合多个变换。注意：矩阵乘法不满足交换律，变换顺序很重要。

```csharp
// Unity C# - 矩阵组合
public class MatrixCombination : MonoBehaviour
{
    void Example()
    {
        // 标准变换顺序：先缩放，再旋转，最后平移
        Vector3 position = new Vector3(10, 0, 0);
        Quaternion rotation = Quaternion.Euler(0, 45, 0);
        Vector3 scale = new Vector3(2, 2, 2);

        // 方法1：使用TRS（推荐）
        Matrix4x4 modelMatrix = Matrix4x4.TRS(position, rotation, scale);

        // 方法2：手动组合矩阵
        Matrix4x4 T = Matrix4x4.Translate(position);
        Matrix4x4 R = Matrix4x4.Rotate(rotation);
        Matrix4x4 S = Matrix4x4.Scale(scale);

        // 注意：矩阵乘法从右向左应用
        // 最终变换 = T * R * S（先S，再R，最后T）
        Matrix4x4 combined = T * R * S;

        // 变换链示例：世界空间到屏幕空间
        Matrix4x4 worldMatrix = transform.localToWorldMatrix;
        Matrix4x4 viewMatrix = Camera.main.worldToCameraMatrix;
        Matrix4x4 projectionMatrix = Camera.main.projectionMatrix;

        // MVP矩阵
        Matrix4x4 mvpMatrix = projectionMatrix * viewMatrix * worldMatrix;

        // 将世界坐标点变换到裁剪空间
        Vector3 worldPoint = transform.position;
        Vector4 clipPoint = mvpMatrix * new Vector4(worldPoint.x, worldPoint.y, worldPoint.z, 1);
    }

    // 绕任意点旋转
    Matrix4x4 RotateAroundPoint(Vector3 point, Vector3 axis, float angle)
    {
        // 1. 平移到原点
        Matrix4x4 toOrigin = Matrix4x4.Translate(-point);

        // 2. 旋转
        Matrix4x4 rotation = Matrix4x4.Rotate(Quaternion.AngleAxis(angle, axis));

        // 3. 平移回原位置
        Matrix4x4 fromOrigin = Matrix4x4.Translate(point);

        // 组合：先平移到原点，再旋转，再平移回去
        return fromOrigin * rotation * toOrigin;
    }
}
```

```cpp
// Unreal Engine C++ - 矩阵组合
void AMatrixExample::MatrixCombinationExample()
{
    // 创建变换
    FVector Location(100.0f, 0.0f, 0.0f);
    FRotator Rotation(0.0f, 45.0f, 0.0f);
    FVector Scale(2.0f, 2.0f, 2.0f);

    // 使用FTransform（UE推荐方式）
    FTransform Transform(Rotation, Location, Scale);
    FMatrix TransformMatrix = Transform.ToMatrixWithScale();

    // 手动组合
    FMatrix TranslationMatrix = FTranslationMatrix(Location);
    FMatrix RotationMatrix = FRotationMatrix(Rotation);
    FMatrix ScaleMatrix = FScaleMatrix(Scale);

    // 组合顺序：Scale -> Rotate -> Translate
    FMatrix Combined = ScaleMatrix * RotationMatrix * TranslationMatrix;

    // 逆变换
    FMatrix InverseTransform = TransformMatrix.Inverse();

    // 应用变换
    FVector LocalPoint(1.0f, 0.0f, 0.0f);
    FVector WorldPoint = TransformMatrix.TransformPosition(LocalPoint);

    // 逆变换回局部坐标
    FVector BackToLocal = InverseTransform.TransformPosition(WorldPoint);
}
```

## 四元数旋转 (Quaternion Rotation)

四元数是表示3D旋转的数学工具，相比欧拉角具有避免万向锁、便于插值等优势。

### 四元数基础

四元数由一个实部和三个虚部组成：$q = w + xi + yj + zk$

也可以写作：$q = (w, \vec{v})$ 其中 $\vec{v} = (x, y, z)$

```csharp
// Unity C# - 四元数基础
public class QuaternionBasics : MonoBehaviour
{
    void Start()
    {
        // 单位四元数（无旋转）
        Quaternion identity = Quaternion.identity;  // (0, 0, 0, 1)

        // 从欧拉角创建
        Quaternion fromEuler = Quaternion.Euler(30, 45, 60);

        // 从轴角创建
        Vector3 axis = Vector3.up;
        float angle = 90f;
        Quaternion fromAxisAngle = Quaternion.AngleAxis(angle, axis);

        // 从方向创建（让物体朝向某个方向）
        Vector3 forward = new Vector3(1, 0, 1).normalized;
        Vector3 upward = Vector3.up;
        Quaternion lookRotation = Quaternion.LookRotation(forward, upward);

        // 从一个方向转到另一个方向
        Vector3 fromDirection = Vector3.forward;
        Vector3 toDirection = Vector3.right;
        Quaternion fromToRotation = Quaternion.FromToRotation(fromDirection, toDirection);

        // 四元数分量
        float x = fromEuler.x;
        float y = fromEuler.y;
        float z = fromEuler.z;
        float w = fromEuler.w;

        // 转换回欧拉角
        Vector3 euler = fromEuler.eulerAngles;
    }
}
```

### 四元数运算

```csharp
// Unity C# - 四元数运算
public class QuaternionOperations : MonoBehaviour
{
    void Example()
    {
        Quaternion q1 = Quaternion.Euler(0, 45, 0);
        Quaternion q2 = Quaternion.Euler(0, 30, 0);

        // 四元数乘法：组合旋转
        // 先应用q2，再应用q1
        Quaternion combined = q1 * q2;

        // 四元数逆：反向旋转
        Quaternion inverse = Quaternion.Inverse(q1);

        // 验证：q * q^(-1) = identity
        Quaternion shouldBeIdentity = q1 * inverse;

        // 旋转向量
        Vector3 point = new Vector3(1, 0, 0);
        Vector3 rotatedPoint = q1 * point;

        // 或使用矩阵方式
        Matrix4x4 rotMatrix = Matrix4x4.Rotate(q1);
        Vector3 rotatedPoint2 = rotMatrix.MultiplyPoint3x4(point);

        // 计算两个旋转之间的差异
        // 从q1到q2需要的旋转
        Quaternion difference = q2 * Quaternion.Inverse(q1);

        // 获取旋转的轴和角度
        difference.ToAngleAxis(out float angleOut, out Vector3 axisOut);

        // 计算两个四元数之间的角度差
        float angleBetween = Quaternion.Angle(q1, q2);
    }
}
```

### 四元数插值

四元数插值是实现平滑旋转的关键。

```csharp
// Unity C# - 四元数插值
public class QuaternionInterpolation : MonoBehaviour
{
    public Transform target;
    public float rotationSpeed = 2.0f;

    void Update()
    {
        if (target == null) return;

        // 计算朝向目标的旋转
        Vector3 direction = (target.position - transform.position).normalized;
        Quaternion targetRotation = Quaternion.LookRotation(direction);

        // Lerp：线性插值（快速但不完全准确）
        transform.rotation = Quaternion.Lerp(
            transform.rotation,
            targetRotation,
            rotationSpeed * Time.deltaTime
        );

        // Slerp：球面线性插值（更准确，恒定角速度）
        transform.rotation = Quaternion.Slerp(
            transform.rotation,
            targetRotation,
            rotationSpeed * Time.deltaTime
        );

        // RotateTowards：限制最大旋转角度
        float maxDegreesDelta = rotationSpeed * 60f * Time.deltaTime;
        transform.rotation = Quaternion.RotateTowards(
            transform.rotation,
            targetRotation,
            maxDegreesDelta
        );
    }

    // 平滑阻尼旋转
    private Quaternion currentVelocity;
    private float smoothTime = 0.3f;

    void SmoothDampRotation(Quaternion target)
    {
        transform.rotation = SmoothDamp(
            transform.rotation,
            target,
            ref currentVelocity,
            smoothTime
        );
    }

    // 自定义SmoothDamp实现
    Quaternion SmoothDamp(Quaternion current, Quaternion target,
        ref Quaternion velocity, float smoothTime)
    {
        float dot = Quaternion.Dot(current, target);
        float multi = dot > 0f ? 1f : -1f;
        target.x *= multi;
        target.y *= multi;
        target.z *= multi;
        target.w *= multi;

        Vector4 result = new Vector4(
            Mathf.SmoothDamp(current.x, target.x, ref velocity.x, smoothTime),
            Mathf.SmoothDamp(current.y, target.y, ref velocity.y, smoothTime),
            Mathf.SmoothDamp(current.z, target.z, ref velocity.z, smoothTime),
            Mathf.SmoothDamp(current.w, target.w, ref velocity.w, smoothTime)
        ).normalized;

        return new Quaternion(result.x, result.y, result.z, result.w);
    }
}
```

```cpp
// Unreal Engine C++ - 四元数操作
void ARotationExample::QuaternionExample()
{
    // 创建四元数
    FQuat Identity = FQuat::Identity;
    FQuat FromRotator = FRotator(0.0f, 45.0f, 0.0f).Quaternion();
    FQuat FromAxisAngle = FQuat(FVector::UpVector, FMath::DegreesToRadians(90.0f));

    // 四元数乘法
    FQuat Combined = FromRotator * FromAxisAngle;

    // 四元数逆
    FQuat Inverse = FromRotator.Inverse();

    // 旋转向量
    FVector Point(1.0f, 0.0f, 0.0f);
    FVector RotatedPoint = FromRotator.RotateVector(Point);

    // Slerp插值
    FQuat Start = FQuat::Identity;
    FQuat End = FRotator(0.0f, 90.0f, 0.0f).Quaternion();
    float Alpha = 0.5f;
    FQuat Interpolated = FQuat::Slerp(Start, End, Alpha);

    // 找到从一个方向到另一个方向的旋转
    FVector From = FVector::ForwardVector;
    FVector To = FVector::RightVector;
    FQuat FromTo = FQuat::FindBetweenVectors(From, To);
}

void ARotationExample::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    if (TargetActor)
    {
        // 计算目标旋转
        FVector Direction = (TargetActor->GetActorLocation() - GetActorLocation()).GetSafeNormal();
        FQuat TargetRotation = Direction.ToOrientationQuat();

        // 平滑旋转
        FQuat CurrentRotation = GetActorQuat();
        FQuat NewRotation = FMath::QInterpTo(CurrentRotation, TargetRotation, DeltaTime, RotationSpeed);

        SetActorRotation(NewRotation);
    }
}
```

### 万向锁问题

欧拉角的主要问题是万向锁（Gimbal Lock），当某个轴旋转90度时，会丢失一个自由度。

```csharp
// Unity C# - 万向锁演示与解决
public class GimbalLockDemo : MonoBehaviour
{
    // 使用欧拉角会遇到万向锁
    void EulerAngleProblem()
    {
        // 当Pitch（X轴）旋转到90度时
        Vector3 euler1 = new Vector3(90, 30, 0);
        Vector3 euler2 = new Vector3(90, 0, 30);

        // 这两个旋转实际上是相同的！
        // 因为在X=90度时，Y轴和Z轴的旋转效果相同

        Quaternion q1 = Quaternion.Euler(euler1);
        Quaternion q2 = Quaternion.Euler(euler2);

        // q1 和 q2 几乎相等
        float angle = Quaternion.Angle(q1, q2);
        Debug.Log($"角度差: {angle}");  // 接近0
    }

    // 使用四元数避免万向锁
    public float pitch, yaw, roll;
    private Quaternion currentRotation = Quaternion.identity;

    void Update()
    {
        // 不要这样做（会有万向锁）：
        // transform.eulerAngles = new Vector3(pitch, yaw, roll);

        // 使用四元数累积旋转
        float deltaYaw = Input.GetAxis("Mouse X") * 2f;
        float deltaPitch = -Input.GetAxis("Mouse Y") * 2f;

        // 创建增量旋转
        Quaternion yawRotation = Quaternion.AngleAxis(deltaYaw, Vector3.up);
        Quaternion pitchRotation = Quaternion.AngleAxis(deltaPitch, Vector3.right);

        // 累积旋转（注意顺序）
        // 先应用偏航（绕世界Y轴），再应用俯仰（绕局部X轴）
        currentRotation = yawRotation * currentRotation * pitchRotation;

        transform.rotation = currentRotation;
    }
}
```

## 贝塞尔曲线 (Bezier Curves)

贝塞尔曲线是游戏中实现平滑路径、动画缓动、UI曲线等的常用工具。

### 线性贝塞尔曲线（一阶）

两点之间的直线插值：

$$B(t) = P_0 + t(P_1 - P_0) = (1-t)P_0 + tP_1$$

```csharp
// Unity C# - 线性插值
public class LinearBezier : MonoBehaviour
{
    public Transform start;
    public Transform end;

    Vector3 LinearInterpolation(float t)
    {
        return Vector3.Lerp(start.position, end.position, t);
        // 等价于: start.position + t * (end.position - start.position)
    }
}
```

### 二次贝塞尔曲线（二阶）

三个控制点定义的曲线：

$$B(t) = (1-t)^2 P_0 + 2(1-t)t P_1 + t^2 P_2$$

```csharp
// Unity C# - 二次贝塞尔曲线
public class QuadraticBezier : MonoBehaviour
{
    public Transform p0;  // 起点
    public Transform p1;  // 控制点
    public Transform p2;  // 终点

    Vector3 QuadraticBezierPoint(float t)
    {
        float oneMinusT = 1f - t;
        return oneMinusT * oneMinusT * p0.position +
               2f * oneMinusT * t * p1.position +
               t * t * p2.position;
    }

    // 使用De Casteljau算法（更稳定）
    Vector3 QuadraticBezierDeCasteljau(float t)
    {
        Vector3 a = Vector3.Lerp(p0.position, p1.position, t);
        Vector3 b = Vector3.Lerp(p1.position, p2.position, t);
        return Vector3.Lerp(a, b, t);
    }

    // 计算切线方向
    Vector3 QuadraticBezierTangent(float t)
    {
        float oneMinusT = 1f - t;
        return 2f * oneMinusT * (p1.position - p0.position) +
               2f * t * (p2.position - p1.position);
    }

    void OnDrawGizmos()
    {
        if (p0 == null || p1 == null || p2 == null) return;

        // 绘制曲线
        Gizmos.color = Color.yellow;
        Vector3 prevPoint = p0.position;

        for (int i = 1; i <= 20; i++)
        {
            float t = i / 20f;
            Vector3 point = QuadraticBezierPoint(t);
            Gizmos.DrawLine(prevPoint, point);
            prevPoint = point;
        }

        // 绘制控制点连线
        Gizmos.color = Color.gray;
        Gizmos.DrawLine(p0.position, p1.position);
        Gizmos.DrawLine(p1.position, p2.position);
    }
}
```

### 三次贝塞尔曲线（三阶）

四个控制点定义的曲线，最常用的贝塞尔曲线类型：

$$B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t)t^2 P_2 + t^3 P_3$$

```csharp
// Unity C# - 三次贝塞尔曲线
public class CubicBezier : MonoBehaviour
{
    public Transform p0;  // 起点
    public Transform p1;  // 控制点1
    public Transform p2;  // 控制点2
    public Transform p3;  // 终点

    // 计算曲线上的点
    public static Vector3 CubicBezierPoint(Vector3 p0, Vector3 p1,
        Vector3 p2, Vector3 p3, float t)
    {
        float oneMinusT = 1f - t;
        float oneMinusT2 = oneMinusT * oneMinusT;
        float oneMinusT3 = oneMinusT2 * oneMinusT;
        float t2 = t * t;
        float t3 = t2 * t;

        return oneMinusT3 * p0 +
               3f * oneMinusT2 * t * p1 +
               3f * oneMinusT * t2 * p2 +
               t3 * p3;
    }

    // De Casteljau算法
    public static Vector3 CubicBezierDeCasteljau(Vector3 p0, Vector3 p1,
        Vector3 p2, Vector3 p3, float t)
    {
        Vector3 a = Vector3.Lerp(p0, p1, t);
        Vector3 b = Vector3.Lerp(p1, p2, t);
        Vector3 c = Vector3.Lerp(p2, p3, t);

        Vector3 d = Vector3.Lerp(a, b, t);
        Vector3 e = Vector3.Lerp(b, c, t);

        return Vector3.Lerp(d, e, t);
    }

    // 计算一阶导数（切线）
    public static Vector3 CubicBezierFirstDerivative(Vector3 p0, Vector3 p1,
        Vector3 p2, Vector3 p3, float t)
    {
        float oneMinusT = 1f - t;
        return 3f * oneMinusT * oneMinusT * (p1 - p0) +
               6f * oneMinusT * t * (p2 - p1) +
               3f * t * t * (p3 - p2);
    }

    // 估算曲线长度
    public float EstimateLength(int segments = 20)
    {
        float length = 0f;
        Vector3 prevPoint = p0.position;

        for (int i = 1; i <= segments; i++)
        {
            float t = i / (float)segments;
            Vector3 point = CubicBezierPoint(p0.position, p1.position,
                p2.position, p3.position, t);
            length += Vector3.Distance(prevPoint, point);
            prevPoint = point;
        }

        return length;
    }

    // 根据距离获取曲线上的点（近似匀速运动）
    public Vector3 GetPointAtDistance(float distance, int lutResolution = 100)
    {
        // 构建查找表
        float[] distances = new float[lutResolution + 1];
        distances[0] = 0f;

        Vector3 prevPoint = p0.position;
        for (int i = 1; i <= lutResolution; i++)
        {
            float t = i / (float)lutResolution;
            Vector3 point = CubicBezierPoint(p0.position, p1.position,
                p2.position, p3.position, t);
            distances[i] = distances[i - 1] + Vector3.Distance(prevPoint, point);
            prevPoint = point;
        }

        // 在查找表中找到对应的t值
        float totalLength = distances[lutResolution];
        distance = Mathf.Clamp(distance, 0f, totalLength);

        for (int i = 1; i <= lutResolution; i++)
        {
            if (distances[i] >= distance)
            {
                float segmentLength = distances[i] - distances[i - 1];
                float segmentT = (distance - distances[i - 1]) / segmentLength;
                float t = (i - 1 + segmentT) / lutResolution;

                return CubicBezierPoint(p0.position, p1.position,
                    p2.position, p3.position, t);
            }
        }

        return p3.position;
    }
}
```

### 贝塞尔曲线实际应用

```csharp
// Unity C# - 贝塞尔曲线应用实例
public class BezierApplications : MonoBehaviour
{
    // 应用1：弹道轨迹
    public class ProjectileArc : MonoBehaviour
    {
        public Transform target;
        public float height = 5f;
        public float duration = 2f;

        private Vector3 startPos;
        private Vector3 controlPoint;
        private float timer;

        void Start()
        {
            startPos = transform.position;

            // 计算控制点（弧线最高点）
            Vector3 midPoint = (startPos + target.position) / 2f;
            controlPoint = midPoint + Vector3.up * height;

            timer = 0f;
        }

        void Update()
        {
            timer += Time.deltaTime;
            float t = timer / duration;

            if (t <= 1f)
            {
                // 使用二次贝塞尔曲线计算位置
                transform.position = QuadraticBezier(startPos, controlPoint,
                    target.position, t);

                // 让物体朝向运动方向
                Vector3 tangent = QuadraticBezierTangent(startPos, controlPoint,
                    target.position, t);
                if (tangent != Vector3.zero)
                {
                    transform.rotation = Quaternion.LookRotation(tangent);
                }
            }
        }

        Vector3 QuadraticBezier(Vector3 p0, Vector3 p1, Vector3 p2, float t)
        {
            float oneMinusT = 1f - t;
            return oneMinusT * oneMinusT * p0 +
                   2f * oneMinusT * t * p1 +
                   t * t * p2;
        }

        Vector3 QuadraticBezierTangent(Vector3 p0, Vector3 p1, Vector3 p2, float t)
        {
            return 2f * (1f - t) * (p1 - p0) + 2f * t * (p2 - p1);
        }
    }

    // 应用2：相机路径
    public class CameraPath : MonoBehaviour
    {
        [System.Serializable]
        public class BezierSegment
        {
            public Transform start;
            public Transform control1;
            public Transform control2;
            public Transform end;
        }

        public BezierSegment[] segments;
        public float totalDuration = 10f;

        private float currentTime;
        private bool isPlaying;

        public void PlayPath()
        {
            currentTime = 0f;
            isPlaying = true;
        }

        void Update()
        {
            if (!isPlaying || segments.Length == 0) return;

            currentTime += Time.deltaTime;
            float normalizedTime = currentTime / totalDuration;

            if (normalizedTime >= 1f)
            {
                isPlaying = false;
                return;
            }

            // 确定当前在哪个段
            float segmentTime = normalizedTime * segments.Length;
            int segmentIndex = Mathf.Min((int)segmentTime, segments.Length - 1);
            float t = segmentTime - segmentIndex;

            BezierSegment segment = segments[segmentIndex];

            // 计算位置
            Vector3 position = CubicBezier.CubicBezierPoint(
                segment.start.position,
                segment.control1.position,
                segment.control2.position,
                segment.end.position,
                t
            );

            // 计算朝向
            Vector3 tangent = CubicBezier.CubicBezierFirstDerivative(
                segment.start.position,
                segment.control1.position,
                segment.control2.position,
                segment.end.position,
                t
            );

            transform.position = position;
            if (tangent != Vector3.zero)
            {
                transform.rotation = Quaternion.LookRotation(tangent);
            }
        }
    }

    // 应用3：UI动画缓动
    public static class EasingFunctions
    {
        // 使用三次贝塞尔曲线定义缓动函数
        // 控制点: (0,0), (x1,y1), (x2,y2), (1,1)

        public static float CubicBezierEase(float t, float x1, float y1,
            float x2, float y2)
        {
            // 简化版本：假设x均匀分布，只计算y值
            float oneMinusT = 1f - t;
            float oneMinusT2 = oneMinusT * oneMinusT;
            float oneMinusT3 = oneMinusT2 * oneMinusT;
            float t2 = t * t;
            float t3 = t2 * t;

            return 3f * oneMinusT2 * t * y1 +
                   3f * oneMinusT * t2 * y2 +
                   t3;
        }

        // 预定义缓动曲线（与CSS缓动函数相同）
        public static float EaseInOut(float t)
        {
            return CubicBezierEase(t, 0.42f, 0f, 0.58f, 1f);
        }

        public static float EaseIn(float t)
        {
            return CubicBezierEase(t, 0.42f, 0f, 1f, 1f);
        }

        public static float EaseOut(float t)
        {
            return CubicBezierEase(t, 0f, 0f, 0.58f, 1f);
        }
    }
}
```

```cpp
// Unreal Engine C++ - 贝塞尔曲线
class FBezierCurve
{
public:
    // 三次贝塞尔曲线
    static FVector CubicBezier(const FVector& P0, const FVector& P1,
        const FVector& P2, const FVector& P3, float T)
    {
        float OneMinusT = 1.0f - T;
        float OneMinusT2 = OneMinusT * OneMinusT;
        float OneMinusT3 = OneMinusT2 * OneMinusT;
        float T2 = T * T;
        float T3 = T2 * T;

        return OneMinusT3 * P0 +
               3.0f * OneMinusT2 * T * P1 +
               3.0f * OneMinusT * T2 * P2 +
               T3 * P3;
    }

    // 切线
    static FVector CubicBezierTangent(const FVector& P0, const FVector& P1,
        const FVector& P2, const FVector& P3, float T)
    {
        float OneMinusT = 1.0f - T;
        return 3.0f * OneMinusT * OneMinusT * (P1 - P0) +
               6.0f * OneMinusT * T * (P2 - P1) +
               3.0f * T * T * (P3 - P2);
    }
};

// 使用Spline组件（UE内置）
void ASplineFollower::FollowSpline(float DeltaTime)
{
    if (!SplineComponent) return;

    CurrentDistance += Speed * DeltaTime;
    float SplineLength = SplineComponent->GetSplineLength();

    if (bLoop)
    {
        CurrentDistance = FMath::Fmod(CurrentDistance, SplineLength);
    }
    else
    {
        CurrentDistance = FMath::Clamp(CurrentDistance, 0.0f, SplineLength);
    }

    // 获取位置和旋转
    FVector Location = SplineComponent->GetLocationAtDistanceAlongSpline(
        CurrentDistance, ESplineCoordinateSpace::World);
    FRotator Rotation = SplineComponent->GetRotationAtDistanceAlongSpline(
        CurrentDistance, ESplineCoordinateSpace::World);

    SetActorLocationAndRotation(Location, Rotation);
}
```

## 碰撞检测 (Collision Detection)

碰撞检测是游戏开发中的核心系统，用于判断物体之间是否发生接触或重叠。

### AABB碰撞检测 (Axis-Aligned Bounding Box)

AABB是最简单高效的碰撞检测方法，但只适用于轴对齐的矩形/立方体。

```csharp
// Unity C# - AABB碰撞检测
public class AABBCollision : MonoBehaviour
{
    // 2D AABB碰撞检测
    public static bool CheckAABB2D(Vector2 minA, Vector2 maxA,
        Vector2 minB, Vector2 maxB)
    {
        // 如果在任何一个轴上不重叠，则不碰撞
        if (maxA.x < minB.x || minA.x > maxB.x) return false;
        if (maxA.y < minB.y || minA.y > maxB.y) return false;

        return true;
    }

    // 3D AABB碰撞检测
    public static bool CheckAABB3D(Vector3 minA, Vector3 maxA,
        Vector3 minB, Vector3 maxB)
    {
        if (maxA.x < minB.x || minA.x > maxB.x) return false;
        if (maxA.y < minB.y || minA.y > maxB.y) return false;
        if (maxA.z < minB.z || minA.z > maxB.z) return false;

        return true;
    }

    // 使用Unity的Bounds类
    public static bool CheckAABBUnity(Bounds a, Bounds b)
    {
        return a.Intersects(b);
    }

    // AABB与点的碰撞
    public static bool PointInAABB(Vector3 point, Vector3 min, Vector3 max)
    {
        return point.x >= min.x && point.x <= max.x &&
               point.y >= min.y && point.y <= max.y &&
               point.z >= min.z && point.z <= max.z;
    }

    // 计算AABB的穿透深度和方向
    public static bool GetAABBPenetration(Bounds a, Bounds b,
        out Vector3 penetrationNormal, out float penetrationDepth)
    {
        penetrationNormal = Vector3.zero;
        penetrationDepth = 0f;

        if (!a.Intersects(b)) return false;

        // 计算各轴的重叠量
        float overlapX = Mathf.Min(a.max.x - b.min.x, b.max.x - a.min.x);
        float overlapY = Mathf.Min(a.max.y - b.min.y, b.max.y - a.min.y);
        float overlapZ = Mathf.Min(a.max.z - b.min.z, b.max.z - a.min.z);

        // 找到最小重叠轴
        if (overlapX < overlapY && overlapX < overlapZ)
        {
            penetrationDepth = overlapX;
            penetrationNormal = a.center.x < b.center.x ? Vector3.left : Vector3.right;
        }
        else if (overlapY < overlapZ)
        {
            penetrationDepth = overlapY;
            penetrationNormal = a.center.y < b.center.y ? Vector3.down : Vector3.up;
        }
        else
        {
            penetrationDepth = overlapZ;
            penetrationNormal = a.center.z < b.center.z ? Vector3.back : Vector3.forward;
        }

        return true;
    }
}
```

### 球体碰撞检测 (Sphere Collision)

球体碰撞检测简单高效，适合圆形物体或作为粗略筛选。

```csharp
// Unity C# - 球体碰撞检测
public class SphereCollision : MonoBehaviour
{
    // 球体与球体碰撞
    public static bool SphereSphere(Vector3 centerA, float radiusA,
        Vector3 centerB, float radiusB)
    {
        float distanceSquared = (centerA - centerB).sqrMagnitude;
        float radiusSum = radiusA + radiusB;
        return distanceSquared <= radiusSum * radiusSum;
    }

    // 获取碰撞信息
    public static bool SphereSphereWithInfo(Vector3 centerA, float radiusA,
        Vector3 centerB, float radiusB,
        out Vector3 contactPoint, out Vector3 contactNormal, out float penetration)
    {
        contactPoint = Vector3.zero;
        contactNormal = Vector3.zero;
        penetration = 0f;

        Vector3 delta = centerB - centerA;
        float distanceSquared = delta.sqrMagnitude;
        float radiusSum = radiusA + radiusB;

        if (distanceSquared > radiusSum * radiusSum)
            return false;

        float distance = Mathf.Sqrt(distanceSquared);

        if (distance > 0.0001f)
        {
            contactNormal = delta / distance;
        }
        else
        {
            // 球心重合，选择任意方向
            contactNormal = Vector3.up;
        }

        penetration = radiusSum - distance;
        contactPoint = centerA + contactNormal * radiusA;

        return true;
    }

    // 球体与点
    public static bool PointInSphere(Vector3 point, Vector3 center, float radius)
    {
        return (point - center).sqrMagnitude <= radius * radius;
    }

    // 球体与AABB
    public static bool SphereAABB(Vector3 sphereCenter, float sphereRadius,
        Vector3 aabbMin, Vector3 aabbMax)
    {
        // 找到AABB上距离球心最近的点
        Vector3 closestPoint = new Vector3(
            Mathf.Clamp(sphereCenter.x, aabbMin.x, aabbMax.x),
            Mathf.Clamp(sphereCenter.y, aabbMin.y, aabbMax.y),
            Mathf.Clamp(sphereCenter.z, aabbMin.z, aabbMax.z)
        );

        float distanceSquared = (closestPoint - sphereCenter).sqrMagnitude;
        return distanceSquared <= sphereRadius * sphereRadius;
    }
}
```

### 射线检测 (Ray Casting)

射线检测用于视线检测、子弹击中判定、鼠标拾取等。

```csharp
// Unity C# - 射线检测
public class RayCasting : MonoBehaviour
{
    // 射线与球体相交
    public static bool RaySphere(Vector3 rayOrigin, Vector3 rayDirection,
        Vector3 sphereCenter, float sphereRadius,
        out float t, out Vector3 hitPoint)
    {
        t = 0f;
        hitPoint = Vector3.zero;

        Vector3 oc = rayOrigin - sphereCenter;

        // 求解二次方程 at^2 + bt + c = 0
        float a = Vector3.Dot(rayDirection, rayDirection);
        float b = 2.0f * Vector3.Dot(oc, rayDirection);
        float c = Vector3.Dot(oc, oc) - sphereRadius * sphereRadius;

        float discriminant = b * b - 4 * a * c;

        if (discriminant < 0)
            return false;

        // 取较小的正根
        float sqrtDiscriminant = Mathf.Sqrt(discriminant);
        t = (-b - sqrtDiscriminant) / (2.0f * a);

        if (t < 0)
        {
            t = (-b + sqrtDiscriminant) / (2.0f * a);
            if (t < 0)
                return false;
        }

        hitPoint = rayOrigin + rayDirection * t;
        return true;
    }

    // 射线与平面相交
    public static bool RayPlane(Vector3 rayOrigin, Vector3 rayDirection,
        Vector3 planePoint, Vector3 planeNormal,
        out float t, out Vector3 hitPoint)
    {
        t = 0f;
        hitPoint = Vector3.zero;

        float denom = Vector3.Dot(planeNormal, rayDirection);

        // 射线平行于平面
        if (Mathf.Abs(denom) < 0.0001f)
            return false;

        t = Vector3.Dot(planePoint - rayOrigin, planeNormal) / denom;

        if (t < 0)
            return false;

        hitPoint = rayOrigin + rayDirection * t;
        return true;
    }

    // 射线与AABB相交
    public static bool RayAABB(Vector3 rayOrigin, Vector3 rayDirection,
        Vector3 aabbMin, Vector3 aabbMax,
        out float tMin, out float tMax)
    {
        tMin = float.NegativeInfinity;
        tMax = float.PositiveInfinity;

        for (int i = 0; i < 3; i++)
        {
            float origin = rayOrigin[i];
            float direction = rayDirection[i];
            float min = aabbMin[i];
            float max = aabbMax[i];

            if (Mathf.Abs(direction) < 0.0001f)
            {
                // 射线平行于这个轴
                if (origin < min || origin > max)
                    return false;
            }
            else
            {
                float t1 = (min - origin) / direction;
                float t2 = (max - origin) / direction;

                if (t1 > t2)
                {
                    float temp = t1;
                    t1 = t2;
                    t2 = temp;
                }

                tMin = Mathf.Max(tMin, t1);
                tMax = Mathf.Min(tMax, t2);

                if (tMin > tMax)
                    return false;
            }
        }

        return tMax >= 0;
    }

    // 射线与三角形相交 (Moller-Trumbore算法)
    public static bool RayTriangle(Vector3 rayOrigin, Vector3 rayDirection,
        Vector3 v0, Vector3 v1, Vector3 v2,
        out float t, out Vector3 hitPoint)
    {
        const float EPSILON = 0.0000001f;
        t = 0f;
        hitPoint = Vector3.zero;

        Vector3 edge1 = v1 - v0;
        Vector3 edge2 = v2 - v0;

        Vector3 h = Vector3.Cross(rayDirection, edge2);
        float a = Vector3.Dot(edge1, h);

        if (a > -EPSILON && a < EPSILON)
            return false;  // 射线平行于三角形

        float f = 1.0f / a;
        Vector3 s = rayOrigin - v0;
        float u = f * Vector3.Dot(s, h);

        if (u < 0.0f || u > 1.0f)
            return false;

        Vector3 q = Vector3.Cross(s, edge1);
        float v = f * Vector3.Dot(rayDirection, q);

        if (v < 0.0f || u + v > 1.0f)
            return false;

        t = f * Vector3.Dot(edge2, q);

        if (t > EPSILON)
        {
            hitPoint = rayOrigin + rayDirection * t;
            return true;
        }

        return false;
    }
}

// Unity射线检测API使用
public class UnityRayCastExample : MonoBehaviour
{
    void Update()
    {
        // 简单射线检测
        Ray ray = new Ray(transform.position, transform.forward);
        RaycastHit hit;

        if (Physics.Raycast(ray, out hit, 100f))
        {
            Debug.Log($"击中: {hit.collider.name}");
            Debug.Log($"击中点: {hit.point}");
            Debug.Log($"击中法线: {hit.normal}");
            Debug.Log($"距离: {hit.distance}");
        }

        // 带层遮罩的射线检测
        int layerMask = LayerMask.GetMask("Enemy", "Obstacle");
        if (Physics.Raycast(ray, out hit, 100f, layerMask))
        {
            // 只检测Enemy和Obstacle层
        }

        // 检测所有命中
        RaycastHit[] hits = Physics.RaycastAll(ray, 100f);
        foreach (var h in hits)
        {
            Debug.Log($"命中: {h.collider.name}");
        }

        // 球形检测
        Collider[] colliders = Physics.OverlapSphere(transform.position, 5f);
        foreach (var col in colliders)
        {
            Debug.Log($"范围内: {col.name}");
        }

        // 盒形检测
        Vector3 halfExtents = new Vector3(1f, 1f, 1f);
        colliders = Physics.OverlapBox(transform.position, halfExtents,
            transform.rotation);
    }
}
```

```cpp
// Unreal Engine C++ - 碰撞检测
void ACollisionExample::PerformLineTrace()
{
    FVector Start = GetActorLocation();
    FVector End = Start + GetActorForwardVector() * 1000.0f;

    FHitResult HitResult;
    FCollisionQueryParams Params;
    Params.AddIgnoredActor(this);

    // 简单线追踪
    bool bHit = GetWorld()->LineTraceSingleByChannel(
        HitResult,
        Start,
        End,
        ECC_Visibility,
        Params
    );

    if (bHit)
    {
        UE_LOG(LogTemp, Log, TEXT("Hit: %s"), *HitResult.GetActor()->GetName());
        UE_LOG(LogTemp, Log, TEXT("Hit Point: %s"), *HitResult.ImpactPoint.ToString());
        UE_LOG(LogTemp, Log, TEXT("Hit Normal: %s"), *HitResult.ImpactNormal.ToString());
    }

    // 多次命中
    TArray<FHitResult> HitResults;
    GetWorld()->LineTraceMultiByChannel(
        HitResults,
        Start,
        End,
        ECC_Visibility,
        Params
    );

    // 球形扫描
    FCollisionShape Shape = FCollisionShape::MakeSphere(100.0f);
    TArray<FOverlapResult> Overlaps;

    GetWorld()->OverlapMultiByChannel(
        Overlaps,
        GetActorLocation(),
        FQuat::Identity,
        ECC_Pawn,
        Shape
    );

    for (const FOverlapResult& Overlap : Overlaps)
    {
        if (AActor* Actor = Overlap.GetActor())
        {
            UE_LOG(LogTemp, Log, TEXT("Overlap: %s"), *Actor->GetName());
        }
    }
}
```

### 分离轴定理 (Separating Axis Theorem - SAT)

SAT是检测凸多边形碰撞的通用算法。如果存在一条轴，使得两个物体在该轴上的投影不重叠，则两物体不碰撞。

```csharp
// Unity C# - 分离轴定理 (2D凸多边形)
public class SATCollision : MonoBehaviour
{
    // 获取多边形的所有边的法线作为分离轴
    static Vector2[] GetAxes(Vector2[] polygon)
    {
        Vector2[] axes = new Vector2[polygon.Length];

        for (int i = 0; i < polygon.Length; i++)
        {
            Vector2 p1 = polygon[i];
            Vector2 p2 = polygon[(i + 1) % polygon.Length];

            Vector2 edge = p2 - p1;
            // 法线（垂直于边）
            axes[i] = new Vector2(-edge.y, edge.x).normalized;
        }

        return axes;
    }

    // 将多边形投影到轴上
    static void ProjectPolygon(Vector2[] polygon, Vector2 axis,
        out float min, out float max)
    {
        min = float.MaxValue;
        max = float.MinValue;

        foreach (Vector2 vertex in polygon)
        {
            float projection = Vector2.Dot(vertex, axis);
            min = Mathf.Min(min, projection);
            max = Mathf.Max(max, projection);
        }
    }

    // 检查两个投影是否重叠
    static bool Overlaps(float minA, float maxA, float minB, float maxB)
    {
        return maxA >= minB && maxB >= minA;
    }

    // 计算重叠量
    static float GetOverlap(float minA, float maxA, float minB, float maxB)
    {
        return Mathf.Min(maxA, maxB) - Mathf.Max(minA, minB);
    }

    // SAT碰撞检测
    public static bool CheckCollision(Vector2[] polygonA, Vector2[] polygonB)
    {
        // 检查A的所有轴
        Vector2[] axesA = GetAxes(polygonA);
        foreach (Vector2 axis in axesA)
        {
            ProjectPolygon(polygonA, axis, out float minA, out float maxA);
            ProjectPolygon(polygonB, axis, out float minB, out float maxB);

            if (!Overlaps(minA, maxA, minB, maxB))
                return false;  // 找到分离轴，不碰撞
        }

        // 检查B的所有轴
        Vector2[] axesB = GetAxes(polygonB);
        foreach (Vector2 axis in axesB)
        {
            ProjectPolygon(polygonA, axis, out float minA, out float maxA);
            ProjectPolygon(polygonB, axis, out float minB, out float maxB);

            if (!Overlaps(minA, maxA, minB, maxB))
                return false;
        }

        return true;  // 所有轴都重叠，发生碰撞
    }

    // 带穿透信息的SAT检测
    public static bool CheckCollisionWithPenetration(Vector2[] polygonA,
        Vector2[] polygonB, out Vector2 mtv)
    {
        mtv = Vector2.zero;
        float minOverlap = float.MaxValue;
        Vector2 smallestAxis = Vector2.zero;

        // 获取所有分离轴
        List<Vector2> axes = new List<Vector2>();
        axes.AddRange(GetAxes(polygonA));
        axes.AddRange(GetAxes(polygonB));

        foreach (Vector2 axis in axes)
        {
            ProjectPolygon(polygonA, axis, out float minA, out float maxA);
            ProjectPolygon(polygonB, axis, out float minB, out float maxB);

            if (!Overlaps(minA, maxA, minB, maxB))
                return false;

            float overlap = GetOverlap(minA, maxA, minB, maxB);
            if (overlap < minOverlap)
            {
                minOverlap = overlap;
                smallestAxis = axis;
            }
        }

        // 确定MTV方向
        Vector2 centerA = GetPolygonCenter(polygonA);
        Vector2 centerB = GetPolygonCenter(polygonB);
        Vector2 direction = centerB - centerA;

        if (Vector2.Dot(direction, smallestAxis) < 0)
        {
            smallestAxis = -smallestAxis;
        }

        mtv = smallestAxis * minOverlap;
        return true;
    }

    static Vector2 GetPolygonCenter(Vector2[] polygon)
    {
        Vector2 center = Vector2.zero;
        foreach (Vector2 vertex in polygon)
        {
            center += vertex;
        }
        return center / polygon.Length;
    }
}
```

### OBB碰撞检测 (Oriented Bounding Box)

OBB是可以任意旋转的边界盒，比AABB更精确但计算更复杂。

```csharp
// Unity C# - OBB碰撞检测
[System.Serializable]
public struct OBB
{
    public Vector3 center;      // 中心点
    public Vector3 halfExtents; // 半尺寸
    public Quaternion rotation; // 旋转

    // 获取OBB的三个局部轴
    public Vector3[] GetAxes()
    {
        return new Vector3[]
        {
            rotation * Vector3.right,
            rotation * Vector3.up,
            rotation * Vector3.forward
        };
    }

    // 获取OBB的8个顶点
    public Vector3[] GetVertices()
    {
        Vector3[] axes = GetAxes();
        Vector3[] vertices = new Vector3[8];

        for (int i = 0; i < 8; i++)
        {
            Vector3 vertex = center;
            vertex += ((i & 1) == 0 ? -1 : 1) * halfExtents.x * axes[0];
            vertex += ((i & 2) == 0 ? -1 : 1) * halfExtents.y * axes[1];
            vertex += ((i & 4) == 0 ? -1 : 1) * halfExtents.z * axes[2];
            vertices[i] = vertex;
        }

        return vertices;
    }
}

public class OBBCollision : MonoBehaviour
{
    // 将OBB投影到轴上
    static void ProjectOBB(OBB obb, Vector3 axis, out float min, out float max)
    {
        Vector3[] vertices = obb.GetVertices();
        min = float.MaxValue;
        max = float.MinValue;

        foreach (Vector3 vertex in vertices)
        {
            float projection = Vector3.Dot(vertex, axis);
            min = Mathf.Min(min, projection);
            max = Mathf.Max(max, projection);
        }
    }

    // OBB与OBB碰撞检测
    public static bool CheckOBBOBB(OBB a, OBB b)
    {
        Vector3[] axesA = a.GetAxes();
        Vector3[] axesB = b.GetAxes();

        // 需要测试15个轴
        List<Vector3> axes = new List<Vector3>();

        // A的3个面法线
        axes.AddRange(axesA);

        // B的3个面法线
        axes.AddRange(axesB);

        // A和B轴的叉积（9个）
        for (int i = 0; i < 3; i++)
        {
            for (int j = 0; j < 3; j++)
            {
                Vector3 cross = Vector3.Cross(axesA[i], axesB[j]);
                if (cross.sqrMagnitude > 0.0001f)
                {
                    axes.Add(cross.normalized);
                }
            }
        }

        // 测试所有轴
        foreach (Vector3 axis in axes)
        {
            ProjectOBB(a, axis, out float minA, out float maxA);
            ProjectOBB(b, axis, out float minB, out float maxB);

            if (maxA < minB || maxB < minA)
                return false;
        }

        return true;
    }

    // 点是否在OBB内
    public static bool PointInOBB(Vector3 point, OBB obb)
    {
        // 将点转换到OBB的局部坐标系
        Vector3 localPoint = Quaternion.Inverse(obb.rotation) * (point - obb.center);

        return Mathf.Abs(localPoint.x) <= obb.halfExtents.x &&
               Mathf.Abs(localPoint.y) <= obb.halfExtents.y &&
               Mathf.Abs(localPoint.z) <= obb.halfExtents.z;
    }

    // OBB上距离点最近的点
    public static Vector3 ClosestPointOnOBB(Vector3 point, OBB obb)
    {
        Vector3[] axes = obb.GetAxes();
        Vector3 d = point - obb.center;
        Vector3 closest = obb.center;

        for (int i = 0; i < 3; i++)
        {
            float dist = Vector3.Dot(d, axes[i]);
            float halfExtent = obb.halfExtents[i];

            dist = Mathf.Clamp(dist, -halfExtent, halfExtent);
            closest += dist * axes[i];
        }

        return closest;
    }
}
```

### 空间分割优化

对于大量物体的碰撞检测，需要使用空间分割结构来优化。

```csharp
// Unity C# - 四叉树 (2D空间分割)
public class QuadTree<T> where T : class
{
    private const int MAX_OBJECTS = 10;
    private const int MAX_LEVELS = 5;

    private int level;
    private List<(Rect bounds, T obj)> objects;
    private Rect bounds;
    private QuadTree<T>[] nodes;

    public QuadTree(int level, Rect bounds)
    {
        this.level = level;
        this.bounds = bounds;
        objects = new List<(Rect, T)>();
        nodes = null;
    }

    public void Clear()
    {
        objects.Clear();

        if (nodes != null)
        {
            for (int i = 0; i < 4; i++)
            {
                nodes[i].Clear();
            }
            nodes = null;
        }
    }

    private void Split()
    {
        float subWidth = bounds.width / 2f;
        float subHeight = bounds.height / 2f;
        float x = bounds.x;
        float y = bounds.y;

        nodes = new QuadTree<T>[4];
        nodes[0] = new QuadTree<T>(level + 1, new Rect(x + subWidth, y, subWidth, subHeight));
        nodes[1] = new QuadTree<T>(level + 1, new Rect(x, y, subWidth, subHeight));
        nodes[2] = new QuadTree<T>(level + 1, new Rect(x, y + subHeight, subWidth, subHeight));
        nodes[3] = new QuadTree<T>(level + 1, new Rect(x + subWidth, y + subHeight, subWidth, subHeight));
    }

    private int GetIndex(Rect rect)
    {
        int index = -1;
        float verticalMidpoint = bounds.x + bounds.width / 2f;
        float horizontalMidpoint = bounds.y + bounds.height / 2f;

        bool topQuadrant = rect.y > horizontalMidpoint;
        bool bottomQuadrant = rect.y + rect.height < horizontalMidpoint;

        if (rect.x + rect.width < verticalMidpoint)
        {
            if (topQuadrant) index = 2;
            else if (bottomQuadrant) index = 1;
        }
        else if (rect.x > verticalMidpoint)
        {
            if (topQuadrant) index = 3;
            else if (bottomQuadrant) index = 0;
        }

        return index;
    }

    public void Insert(Rect rect, T obj)
    {
        if (nodes != null)
        {
            int index = GetIndex(rect);
            if (index != -1)
            {
                nodes[index].Insert(rect, obj);
                return;
            }
        }

        objects.Add((rect, obj));

        if (objects.Count > MAX_OBJECTS && level < MAX_LEVELS)
        {
            if (nodes == null)
            {
                Split();
            }

            int i = 0;
            while (i < objects.Count)
            {
                int index = GetIndex(objects[i].bounds);
                if (index != -1)
                {
                    var item = objects[i];
                    objects.RemoveAt(i);
                    nodes[index].Insert(item.bounds, item.obj);
                }
                else
                {
                    i++;
                }
            }
        }
    }

    public List<T> Retrieve(Rect rect)
    {
        List<T> result = new List<T>();
        int index = GetIndex(rect);

        if (index != -1 && nodes != null)
        {
            result.AddRange(nodes[index].Retrieve(rect));
        }
        else if (nodes != null)
        {
            // 对象跨越多个象限
            for (int i = 0; i < 4; i++)
            {
                result.AddRange(nodes[i].Retrieve(rect));
            }
        }

        foreach (var item in objects)
        {
            result.Add(item.obj);
        }

        return result;
    }
}

// 使用四叉树优化碰撞检测
public class OptimizedCollisionSystem : MonoBehaviour
{
    private QuadTree<Collider2D> quadTree;
    private List<Collider2D> allColliders = new List<Collider2D>();

    void Start()
    {
        // 初始化四叉树，覆盖整个游戏区域
        quadTree = new QuadTree<Collider2D>(0, new Rect(-100, -100, 200, 200));
    }

    void Update()
    {
        // 每帧重建四叉树
        quadTree.Clear();

        foreach (var collider in allColliders)
        {
            Rect bounds = new Rect(
                collider.bounds.min.x,
                collider.bounds.min.y,
                collider.bounds.size.x,
                collider.bounds.size.y
            );
            quadTree.Insert(bounds, collider);
        }

        // 检测碰撞
        foreach (var collider in allColliders)
        {
            Rect bounds = new Rect(
                collider.bounds.min.x,
                collider.bounds.min.y,
                collider.bounds.size.x,
                collider.bounds.size.y
            );

            // 只检测附近的物体
            List<Collider2D> nearbyColliders = quadTree.Retrieve(bounds);

            foreach (var other in nearbyColliders)
            {
                if (collider != other)
                {
                    // 精确碰撞检测
                    if (collider.bounds.Intersects(other.bounds))
                    {
                        // 处理碰撞
                        HandleCollision(collider, other);
                    }
                }
            }
        }
    }

    void HandleCollision(Collider2D a, Collider2D b)
    {
        // 碰撞响应
    }
}
```

## 面试要点

### 核心概念题

**Q1: 解释点积和叉积的区别及应用场景**

```
点积（Dot Product）:
- 返回标量
- 公式: a·b = |a||b|cosθ
- 应用:
  - 计算两向量夹角
  - 判断物体是在前方还是后方
  - 视野检测（FOV）
  - Lambert光照计算
  - 向量投影

叉积（Cross Product）:
- 返回向量（垂直于输入向量）
- 公式: a×b = |a||b|sinθ (方向遵循右手定则)
- 应用:
  - 判断物体在左侧还是右侧
  - 计算法线
  - 计算三角形面积
  - 计算扭矩
```

**Q2: 为什么使用四元数而不是欧拉角表示旋转？**

```
欧拉角的问题:
1. 万向锁（Gimbal Lock）：当某轴旋转90度时丢失一个自由度
2. 插值困难：直接插值欧拉角会产生不自然的旋转路径
3. 组合顺序依赖：不同的旋转顺序产生不同结果

四元数的优势:
1. 避免万向锁
2. 可以进行平滑的球面插值（Slerp）
3. 计算效率高（组合旋转只需四元数乘法）
4. 数值稳定性好

四元数的缺点:
1. 不直观，难以手动设置
2. 需要保持单位四元数（归一化）
```

**Q3: 解释MVP矩阵变换流程**

```
MVP = Model * View * Projection

1. Model Matrix（模型矩阵）:
   - 将顶点从局部空间变换到世界空间
   - 包含平移、旋转、缩放

2. View Matrix（视图矩阵）:
   - 将顶点从世界空间变换到相机空间
   - 相当于将相机放在原点，看向-Z方向

3. Projection Matrix（投影矩阵）:
   - 将顶点从相机空间变换到裁剪空间
   - 透视投影：近大远小效果
   - 正交投影：保持平行线

变换顺序：局部空间 -> 世界空间 -> 相机空间 -> 裁剪空间 -> NDC -> 屏幕空间
```

### 算法实现题

**Q4: 如何判断一个点是否在三角形内？**

```csharp
// 方法1：重心坐标法
bool PointInTriangle_Barycentric(Vector3 p, Vector3 a, Vector3 b, Vector3 c)
{
    Vector3 v0 = c - a;
    Vector3 v1 = b - a;
    Vector3 v2 = p - a;

    float dot00 = Vector3.Dot(v0, v0);
    float dot01 = Vector3.Dot(v0, v1);
    float dot02 = Vector3.Dot(v0, v2);
    float dot11 = Vector3.Dot(v1, v1);
    float dot12 = Vector3.Dot(v1, v2);

    float invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
    float u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    float v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return (u >= 0) && (v >= 0) && (u + v <= 1);
}

// 方法2：叉积法（2D）
bool PointInTriangle_CrossProduct(Vector2 p, Vector2 a, Vector2 b, Vector2 c)
{
    float Sign(Vector2 p1, Vector2 p2, Vector2 p3)
    {
        return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
    }

    float d1 = Sign(p, a, b);
    float d2 = Sign(p, b, c);
    float d3 = Sign(p, c, a);

    bool hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
    bool hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);

    return !(hasNeg && hasPos);
}
```

**Q5: 实现平滑跟随相机**

```csharp
public class SmoothFollowCamera : MonoBehaviour
{
    public Transform target;
    public float distance = 10f;
    public float height = 5f;
    public float smoothTime = 0.3f;
    public float rotationSmoothTime = 0.1f;

    private Vector3 velocity;
    private float rotationVelocity;

    void LateUpdate()
    {
        if (target == null) return;

        // 计算期望位置
        Vector3 desiredPosition = target.position
            - target.forward * distance
            + Vector3.up * height;

        // 位置平滑跟随
        transform.position = Vector3.SmoothDamp(
            transform.position,
            desiredPosition,
            ref velocity,
            smoothTime
        );

        // 旋转平滑跟随
        float targetAngle = target.eulerAngles.y;
        float currentAngle = transform.eulerAngles.y;

        currentAngle = Mathf.SmoothDampAngle(
            currentAngle,
            targetAngle,
            ref rotationVelocity,
            rotationSmoothTime
        );

        transform.rotation = Quaternion.Euler(0, currentAngle, 0);

        // 看向目标
        transform.LookAt(target.position + Vector3.up * 1.5f);
    }
}
```

### 常见错误和注意事项

```csharp
// 错误1：不归一化方向向量
Vector3 direction = target.position - transform.position;
// 应该使用 direction.normalized

// 错误2：欧拉角直接相加
transform.eulerAngles += new Vector3(0, deltaYaw, 0);
// 可能导致万向锁，应使用四元数

// 错误3：忘记时间缩放
transform.position += velocity;
// 应该乘以 Time.deltaTime

// 错误4：比较浮点数相等
if (distance == 0) // 可能永远不为真
// 应该使用 Mathf.Approximately(distance, 0) 或阈值比较

// 错误5：使用sqrMagnitude后忘记开方
if (direction.sqrMagnitude < range) // 错误：比较的是平方
// 应该比较 range * range 或使用 magnitude

// 错误6：忽略除零
Vector3 normalized = direction / direction.magnitude;
// 应该检查magnitude是否为0，或使用 direction.normalized（会返回零向量）

// 错误7：矩阵乘法顺序错误
Matrix4x4 transform = translation * rotation * scale; // SRT顺序
// 应该是 TRS 顺序：translation * rotation * scale
// 但矩阵应用时是从右向左，所以实际效果是先缩放、再旋转、最后平移
```

## 实用工具类

```csharp
// Unity C# - 游戏数学工具类
public static class GameMathUtils
{
    // 将角度限制在 -180 到 180 之间
    public static float NormalizeAngle(float angle)
    {
        while (angle > 180f) angle -= 360f;
        while (angle < -180f) angle += 360f;
        return angle;
    }

    // 计算两个角度之间的最短差值
    public static float AngleDifference(float a, float b)
    {
        float diff = NormalizeAngle(b - a);
        return diff;
    }

    // 平滑阻尼角度
    public static float SmoothDampAngle(float current, float target,
        ref float velocity, float smoothTime, float maxSpeed = float.PositiveInfinity)
    {
        target = current + AngleDifference(current, target);
        return Mathf.SmoothDamp(current, target, ref velocity, smoothTime, maxSpeed);
    }

    // 将世界坐标转换为屏幕坐标
    public static Vector2 WorldToScreenPoint(Camera camera, Vector3 worldPoint)
    {
        Vector3 screenPoint = camera.WorldToScreenPoint(worldPoint);
        return new Vector2(screenPoint.x, screenPoint.y);
    }

    // 屏幕射线与平面的交点
    public static bool ScreenToWorldPlane(Camera camera, Vector2 screenPoint,
        Plane plane, out Vector3 worldPoint)
    {
        worldPoint = Vector3.zero;
        Ray ray = camera.ScreenPointToRay(screenPoint);

        if (plane.Raycast(ray, out float distance))
        {
            worldPoint = ray.GetPoint(distance);
            return true;
        }
        return false;
    }

    // 计算抛物线轨迹
    public static Vector3 CalculateParabolicTrajectory(Vector3 start,
        Vector3 initialVelocity, float gravity, float time)
    {
        return start + initialVelocity * time +
               0.5f * Vector3.down * gravity * time * time;
    }

    // 计算达到目标所需的初始速度
    public static Vector3 CalculateLaunchVelocity(Vector3 start, Vector3 target,
        float gravity, float angle)
    {
        Vector3 direction = target - start;
        float horizontalDistance = new Vector3(direction.x, 0, direction.z).magnitude;
        float verticalDistance = direction.y;

        float angleRad = angle * Mathf.Deg2Rad;
        float cos = Mathf.Cos(angleRad);
        float tan = Mathf.Tan(angleRad);

        // v^2 = g * x^2 / (2 * cos^2(θ) * (x * tan(θ) - y))
        float denominator = 2 * cos * cos * (horizontalDistance * tan - verticalDistance);

        if (denominator <= 0) return Vector3.zero;

        float speed = Mathf.Sqrt(gravity * horizontalDistance * horizontalDistance / denominator);

        Vector3 horizontalDir = new Vector3(direction.x, 0, direction.z).normalized;
        return horizontalDir * speed * cos + Vector3.up * speed * Mathf.Sin(angleRad);
    }

    // Remap值从一个范围到另一个范围
    public static float Remap(float value, float fromMin, float fromMax,
        float toMin, float toMax)
    {
        float normalized = (value - fromMin) / (fromMax - fromMin);
        return toMin + normalized * (toMax - toMin);
    }

    // 计算弹簧阻尼
    public static float SpringDamper(float current, float target, ref float velocity,
        float springConstant, float dampingConstant, float deltaTime)
    {
        float displacement = current - target;
        float springForce = -springConstant * displacement;
        float dampingForce = -dampingConstant * velocity;
        float acceleration = springForce + dampingForce;

        velocity += acceleration * deltaTime;
        return current + velocity * deltaTime;
    }
}
```

## 总结

游戏数学是游戏开发的基础。本文涵盖了游戏开发中最核心的数学知识：

1. **向量运算**：理解点积和叉积是游戏数学的关键，它们在方向判断、视野检测、光照计算等方面有广泛应用。

2. **矩阵变换**：掌握TRS（平移-旋转-缩放）变换和MVP矩阵是理解3D渲染管线的基础。

3. **四元数**：使用四元数进行旋转可以避免万向锁，实现平滑的旋转插值。

4. **贝塞尔曲线**：在路径规划、动画缓动、UI设计等场景中不可或缺。

5. **碰撞检测**：从简单的AABB、球体碰撞到复杂的SAT、OBB算法，配合空间分割优化，是构建可靠游戏物理的基础。

建议学习方法：
- 手动实现这些算法，加深理解
- 在实际项目中应用，体会数学与游戏系统的关联
- 使用调试可视化工具（如Gizmos）观察数学计算结果
- 阅读游戏引擎源码，学习工业级实现

掌握这些数学基础，你将能够更好地理解游戏引擎的工作原理，解决复杂的游戏开发问题，并优化游戏性能。
