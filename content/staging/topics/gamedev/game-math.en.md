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
origin: old/src/content/docs/gamedev/game-math.en.md
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

Mathematics is the core foundation of game development. From character movement to physics simulation, from camera control to collision detection, almost all game systems rely on mathematical calculations. This article walks through the most commonly used mathematical concepts in game development, including vector operations, matrix transformations, quaternion rotations, Bezier curves, and collision detection algorithms, to help you build a solid foundation in game mathematics.

## Vector Operations

Vectors are the most fundamental and important mathematical tools in game development. They can represent positions, directions, velocities, forces, and various other physical quantities.

### Basic Vector Concepts

A vector is a quantity that has both magnitude (length) and direction. In games, we typically use two-dimensional vectors (2D) or three-dimensional vectors (3D).

```csharp
// Unity C# - Vector Basics
using UnityEngine;

public class VectorBasics : MonoBehaviour
{
    void Start()
    {
        // Creating vectors
        Vector3 position = new Vector3(1.0f, 2.0f, 3.0f);
        Vector3 direction = new Vector3(0.0f, 0.0f, 1.0f);

        // Accessing vector components
        float x = position.x;  // 1.0
        float y = position.y;  // 2.0
        float z = position.z;  // 3.0

        // Vector magnitude (length)
        float magnitude = position.magnitude;  // sqrt(1^2 + 2^2 + 3^2) = 3.74

        // Unit vector (normalization)
        Vector3 normalized = position.normalized;  // Length is 1, direction unchanged

        // Commonly used predefined vectors
        Vector3 up = Vector3.up;        // (0, 1, 0)
        Vector3 right = Vector3.right;  // (1, 0, 0)
        Vector3 forward = Vector3.forward; // (0, 0, 1)
        Vector3 zero = Vector3.zero;    // (0, 0, 0)
        Vector3 one = Vector3.one;      // (1, 1, 1)
    }
}
```

```cpp
// Unreal Engine C++ - Vector Basics
#include "Math/Vector.h"

void AVectorExample::BeginPlay()
{
    Super::BeginPlay();

    // Creating vectors
    FVector Position(1.0f, 2.0f, 3.0f);
    FVector Direction(0.0f, 0.0f, 1.0f);

    // Accessing vector components
    float X = Position.X;
    float Y = Position.Y;
    float Z = Position.Z;

    // Vector magnitude
    float Length = Position.Size();      // Euclidean length
    float LengthSq = Position.SizeSquared(); // Squared length (more efficient)

    // Unit vector
    FVector Normalized = Position.GetSafeNormal(); // Safe normalization, handles zero vector

    // Commonly used predefined vectors
    FVector Up = FVector::UpVector;       // (0, 0, 1) - Note UE uses Z-up
    FVector Right = FVector::RightVector; // (0, 1, 0)
    FVector Forward = FVector::ForwardVector; // (1, 0, 0)
}
```

### Vector Addition and Subtraction

Vector addition is used to calculate displacement, resultant forces, etc.; vector subtraction is commonly used to calculate the direction from one point to another.

```csharp
// Unity C# - Vector Addition and Subtraction
public class VectorAddSub : MonoBehaviour
{
    public Transform target;
    public float moveSpeed = 5.0f;

    void Update()
    {
        // Vector addition: position + displacement = new position
        Vector3 velocity = Vector3.forward * moveSpeed * Time.deltaTime;
        transform.position = transform.position + velocity;

        // Vector subtraction: calculate direction from self to target
        Vector3 directionToTarget = target.position - transform.position;

        // Get unit direction vector
        Vector3 normalizedDirection = directionToTarget.normalized;

        // Calculate distance
        float distance = directionToTarget.magnitude;

        // Move towards target
        if (distance > 0.1f)
        {
            transform.position += normalizedDirection * moveSpeed * Time.deltaTime;
        }
    }
}
```

```cpp
// Unreal Engine C++ - Vector Addition and Subtraction
void ACharacterMovement::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    if (TargetActor)
    {
        // Calculate direction towards target
        FVector DirectionToTarget = TargetActor->GetActorLocation() - GetActorLocation();
        float Distance = DirectionToTarget.Size();

        // Normalize direction
        FVector NormalizedDirection = DirectionToTarget.GetSafeNormal();

        // Movement
        if (Distance > 10.0f)
        {
            FVector NewLocation = GetActorLocation() + NormalizedDirection * MoveSpeed * DeltaTime;
            SetActorLocation(NewLocation);
        }
    }
}
```

### Scalar Multiplication

Multiplying a vector by a scalar changes the vector's length without changing its direction (negative values will reverse it).

```csharp
// Unity C# - Vector Scalar Multiplication Applications
public class VectorScaling : MonoBehaviour
{
    void Example()
    {
        Vector3 velocity = new Vector3(1, 0, 0);

        // Acceleration: multiply vector by scalar greater than 1
        Vector3 accelerated = velocity * 2.0f;  // (2, 0, 0)

        // Deceleration: multiply vector by scalar less than 1
        Vector3 decelerated = velocity * 0.5f;  // (0.5, 0, 0)

        // Reversal: multiply vector by negative number
        Vector3 reversed = velocity * -1.0f;    // (-1, 0, 0)

        // Apply time scaling
        float deltaTime = Time.deltaTime;
        Vector3 movement = velocity * 5.0f * deltaTime;

        // Scale any vector to a specified length
        Vector3 direction = new Vector3(3, 4, 0);  // Length is 5
        float desiredLength = 10.0f;
        Vector3 scaledVector = direction.normalized * desiredLength;
    }
}
```

### Dot Product

The dot product is one of the most important vector operations. It returns a scalar value that can be used to calculate angles, determine directional relationships, projections, and more.

$$\vec{a} \cdot \vec{b} = |\vec{a}||\vec{b}|\cos\theta = a_x b_x + a_y b_y + a_z b_z$$

**Geometric meaning of dot product**:
- Result > 0: Angle between vectors is less than 90 degrees (roughly same direction)
- Result = 0: Vectors are perpendicular
- Result < 0: Angle between vectors is greater than 90 degrees (roughly opposite direction)

```csharp
// Unity C# - Dot Product Applications
public class DotProductExamples : MonoBehaviour
{
    public Transform target;
    public float fieldOfViewAngle = 60.0f;

    void Update()
    {
        // Application 1: Determine if target is in front
        Vector3 toTarget = (target.position - transform.position).normalized;
        Vector3 forward = transform.forward;

        float dot = Vector3.Dot(forward, toTarget);

        if (dot > 0)
        {
            Debug.Log("Target is in front");
        }
        else
        {
            Debug.Log("Target is behind");
        }

        // Application 2: Field of View Check (FOV Check)
        // Convert angle to dot product threshold
        float threshold = Mathf.Cos(fieldOfViewAngle * 0.5f * Mathf.Deg2Rad);

        if (dot > threshold)
        {
            Debug.Log("Target is within field of view");
        }

        // Application 3: Calculate angle between two vectors
        float angleRadians = Mathf.Acos(Mathf.Clamp(dot, -1f, 1f));
        float angleDegrees = angleRadians * Mathf.Rad2Deg;

        // Unity's convenient method
        float angle = Vector3.Angle(forward, toTarget);

        // Application 4: Vector projection
        // Project velocity onto the plane defined by groundNormal
        Vector3 velocity = new Vector3(1, -1, 0);
        Vector3 groundNormal = Vector3.up;

        // Component projected onto normal direction
        float normalComponent = Vector3.Dot(velocity, groundNormal);

        // Subtract normal component from velocity to get velocity parallel to ground
        Vector3 groundVelocity = velocity - groundNormal * normalComponent;
    }

    // Application 5: Lighting calculation (Lambert diffuse)
    float CalculateDiffuseLight(Vector3 normal, Vector3 lightDirection)
    {
        // Light direction points towards light source
        float NdotL = Vector3.Dot(normal, -lightDirection);
        return Mathf.Max(0, NdotL);  // Clamp to [0,1] range
    }
}
```

```cpp
// Unreal Engine C++ - Dot Product Applications
void AEnemyAI::CheckPlayerVisibility()
{
    APlayerController* PC = GetWorld()->GetFirstPlayerController();
    if (!PC) return;

    APawn* PlayerPawn = PC->GetPawn();
    if (!PlayerPawn) return;

    FVector ToPlayer = (PlayerPawn->GetActorLocation() - GetActorLocation()).GetSafeNormal();
    FVector Forward = GetActorForwardVector();

    // Dot product calculation
    float DotResult = FVector::DotProduct(Forward, ToPlayer);

    // Field of view angle detection
    float FOVThreshold = FMath::Cos(FMath::DegreesToRadians(FieldOfView * 0.5f));

    if (DotResult > FOVThreshold)
    {
        // Player is within field of view, perform raycast to confirm visibility
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

### Cross Product

The cross product returns a new vector perpendicular to both input vectors (only applicable to 3D vectors). It follows the right-hand rule.

$$\vec{a} \times \vec{b} = (a_y b_z - a_z b_y, a_z b_x - a_x b_z, a_x b_y - a_y b_x)$$

**Geometric meaning of cross product**:
- The resulting vector is perpendicular to both input vectors
- The magnitude of the result equals the area of the parallelogram formed by the two vectors
- Direction follows the right-hand rule

```csharp
// Unity C# - Cross Product Applications
public class CrossProductExamples : MonoBehaviour
{
    public Transform target;

    void Update()
    {
        Vector3 toTarget = target.position - transform.position;
        Vector3 forward = transform.forward;

        // Application 1: Determine if target is on left or right side
        Vector3 cross = Vector3.Cross(forward, toTarget);

        if (cross.y > 0)
        {
            Debug.Log("Target is on the right");
        }
        else if (cross.y < 0)
        {
            Debug.Log("Target is on the left");
        }
        else
        {
            Debug.Log("Target is directly in front or behind");
        }

        // Application 2: Calculate normal (for building coordinate systems or surface normals)
        Vector3 v1 = new Vector3(1, 0, 0);
        Vector3 v2 = new Vector3(0, 1, 0);
        Vector3 normal = Vector3.Cross(v1, v2).normalized;  // (0, 0, 1)

        // Application 3: Calculate triangle area
        Vector3 a = new Vector3(0, 0, 0);
        Vector3 b = new Vector3(1, 0, 0);
        Vector3 c = new Vector3(0, 1, 0);

        Vector3 ab = b - a;
        Vector3 ac = c - a;
        float triangleArea = Vector3.Cross(ab, ac).magnitude * 0.5f;

        // Application 4: Calculate torque
        Vector3 forcePosition = new Vector3(1, 0, 0);  // Point of force application
        Vector3 pivot = Vector3.zero;                   // Rotation center
        Vector3 force = new Vector3(0, 10, 0);         // Force direction and magnitude

        Vector3 leverArm = forcePosition - pivot;
        Vector3 torque = Vector3.Cross(leverArm, force);
    }

    // Application 5: Smooth turning
    void SmoothTurn(Vector3 targetDirection, float turnSpeed)
    {
        Vector3 currentForward = transform.forward;
        Vector3 cross = Vector3.Cross(currentForward, targetDirection);
        float dot = Vector3.Dot(currentForward, targetDirection);

        // cross.y > 0 means turn clockwise, < 0 means counterclockwise
        float turnDirection = Mathf.Sign(cross.y);

        // Calculate angle to turn
        float angle = Mathf.Acos(Mathf.Clamp(dot, -1f, 1f)) * Mathf.Rad2Deg;

        // Limit rotation per frame
        float turnAngle = Mathf.Min(angle, turnSpeed * Time.deltaTime);

        transform.Rotate(Vector3.up, turnAngle * turnDirection);
    }
}
```

```cpp
// Unreal Engine C++ - Cross Product Applications
void AGameCharacter::CalculateTurnDirection()
{
    if (!TargetActor) return;

    FVector ToTarget = (TargetActor->GetActorLocation() - GetActorLocation()).GetSafeNormal();
    FVector Forward = GetActorForwardVector();

    // Cross product to determine left/right
    FVector Cross = FVector::CrossProduct(Forward, ToTarget);

    // In UE, Z axis points up, so check Z component
    if (Cross.Z > 0)
    {
        // Target is on the right, turn clockwise
        TurnDirection = 1.0f;
    }
    else if (Cross.Z < 0)
    {
        // Target is on the left, turn counterclockwise
        TurnDirection = -1.0f;
    }
    else
    {
        TurnDirection = 0.0f;
    }
}

// Build local coordinate system
void AGameCharacter::BuildLocalCoordinateSystem()
{
    FVector WorldUp = FVector::UpVector;
    FVector Forward = GetActorForwardVector();

    // Ensure Forward and Up are not parallel
    if (FMath::Abs(FVector::DotProduct(Forward, WorldUp)) > 0.99f)
    {
        WorldUp = FVector::ForwardVector;
    }

    // Build orthogonal coordinate system
    FVector Right = FVector::CrossProduct(WorldUp, Forward).GetSafeNormal();
    FVector Up = FVector::CrossProduct(Forward, Right).GetSafeNormal();

    // Now Forward, Right, Up form an orthogonal coordinate system
}
```

## Matrix Transformations

Matrices are the standard mathematical tool for representing and combining spatial transformations. In 3D games, 4x4 matrices can simultaneously represent translation, rotation, and scale transformations.

### Transformation Matrix Basics

```csharp
// Unity C# - Matrix Basics
public class MatrixBasics : MonoBehaviour
{
    void Start()
    {
        // Unity uses Matrix4x4 to represent 4x4 transformation matrices
        Matrix4x4 identityMatrix = Matrix4x4.identity;

        // Get transformation matrix from Transform
        Matrix4x4 localToWorld = transform.localToWorldMatrix;
        Matrix4x4 worldToLocal = transform.worldToLocalMatrix;

        // Use matrix to transform a point
        Vector3 localPoint = new Vector3(1, 0, 0);
        Vector3 worldPoint = localToWorld.MultiplyPoint3x4(localPoint);

        // Use matrix to transform a direction (not affected by translation)
        Vector3 localDirection = Vector3.forward;
        Vector3 worldDirection = localToWorld.MultiplyVector(localDirection);

        // Create TRS matrix (Translation-Rotation-Scale)
        Vector3 position = new Vector3(10, 5, 0);
        Quaternion rotation = Quaternion.Euler(0, 45, 0);
        Vector3 scale = new Vector3(2, 2, 2);

        Matrix4x4 trsMatrix = Matrix4x4.TRS(position, rotation, scale);
    }
}
```

### Translation Matrix

The translation matrix is used to move an object's position.

$$T = \begin{bmatrix} 1 & 0 & 0 & t_x \\ 0 & 1 & 0 & t_y \\ 0 & 0 & 1 & t_z \\ 0 & 0 & 0 & 1 \end{bmatrix}$$

```csharp
// Unity C# - Translation Matrix
public class TranslationMatrix : MonoBehaviour
{
    void Example()
    {
        // Manually create translation matrix
        Vector3 translation = new Vector3(10, 5, 3);

        Matrix4x4 translationMatrix = Matrix4x4.identity;
        translationMatrix.m03 = translation.x;  // Row 0, Column 3
        translationMatrix.m13 = translation.y;  // Row 1, Column 3
        translationMatrix.m23 = translation.z;  // Row 2, Column 3

        // Or use TRS method
        translationMatrix = Matrix4x4.TRS(translation, Quaternion.identity, Vector3.one);

        // Apply translation
        Vector3 originalPoint = Vector3.zero;
        Vector3 translatedPoint = translationMatrix.MultiplyPoint3x4(originalPoint);
        // translatedPoint = (10, 5, 3)
    }
}
```

### Rotation Matrix

The rotation matrix is used to rotate an object around an axis.

**Rotation around X axis:**
$$R_x(\theta) = \begin{bmatrix} 1 & 0 & 0 & 0 \\ 0 & \cos\theta & -\sin\theta & 0 \\ 0 & \sin\theta & \cos\theta & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}$$

**Rotation around Y axis:**
$$R_y(\theta) = \begin{bmatrix} \cos\theta & 0 & \sin\theta & 0 \\ 0 & 1 & 0 & 0 \\ -\sin\theta & 0 & \cos\theta & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}$$

**Rotation around Z axis:**
$$R_z(\theta) = \begin{bmatrix} \cos\theta & -\sin\theta & 0 & 0 \\ \sin\theta & \cos\theta & 0 & 0 \\ 0 & 0 & 1 & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}$$

```csharp
// Unity C# - Rotation Matrix
public class RotationMatrix : MonoBehaviour
{
    void Example()
    {
        // Create rotation matrix from Euler angles
        Vector3 eulerAngles = new Vector3(30, 45, 60);
        Quaternion rotation = Quaternion.Euler(eulerAngles);
        Matrix4x4 rotationMatrix = Matrix4x4.Rotate(rotation);

        // Rotate around arbitrary axis
        Vector3 axis = Vector3.up;
        float angle = 90f;
        Quaternion axisRotation = Quaternion.AngleAxis(angle, axis);
        Matrix4x4 axisRotationMatrix = Matrix4x4.Rotate(axisRotation);

        // Manually create rotation matrix around Y axis
        float radians = 45f * Mathf.Deg2Rad;
        float cos = Mathf.Cos(radians);
        float sin = Mathf.Sin(radians);

        Matrix4x4 yRotation = Matrix4x4.identity;
        yRotation.m00 = cos;
        yRotation.m02 = sin;
        yRotation.m20 = -sin;
        yRotation.m22 = cos;

        // Apply rotation
        Vector3 originalPoint = new Vector3(1, 0, 0);
        Vector3 rotatedPoint = rotationMatrix.MultiplyPoint3x4(originalPoint);
    }
}
```

```cpp
// Unreal Engine C++ - Rotation Matrix
void AMatrixExample::RotationMatrixExample()
{
    // Create matrix from rotator
    FRotator Rotation(0.0f, 45.0f, 0.0f);  // Pitch, Yaw, Roll
    FMatrix RotationMatrix = FRotationMatrix(Rotation);

    // Rotate around arbitrary axis
    FVector Axis = FVector::UpVector;
    float AngleDegrees = 90.0f;
    FMatrix AxisRotation = FRotationMatrix(FQuat(Axis, FMath::DegreesToRadians(AngleDegrees)));

    // Apply rotation
    FVector OriginalPoint(1.0f, 0.0f, 0.0f);
    FVector RotatedPoint = RotationMatrix.TransformPosition(OriginalPoint);

    // Transform direction vector (not affected by translation)
    FVector Direction(0.0f, 0.0f, 1.0f);
    FVector RotatedDirection = RotationMatrix.TransformVector(Direction);
}
```

### Scale Matrix

The scale matrix is used to change an object's size.

$$S = \begin{bmatrix} s_x & 0 & 0 & 0 \\ 0 & s_y & 0 & 0 \\ 0 & 0 & s_z & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix}$$

```csharp
// Unity C# - Scale Matrix
public class ScaleMatrix : MonoBehaviour
{
    void Example()
    {
        // Create scale matrix
        Vector3 scale = new Vector3(2, 1, 0.5f);
        Matrix4x4 scaleMatrix = Matrix4x4.Scale(scale);

        // Create using TRS
        scaleMatrix = Matrix4x4.TRS(Vector3.zero, Quaternion.identity, scale);

        // Manual creation
        Matrix4x4 manualScale = Matrix4x4.identity;
        manualScale.m00 = scale.x;
        manualScale.m11 = scale.y;
        manualScale.m22 = scale.z;

        // Apply scale
        Vector3 originalPoint = new Vector3(1, 1, 1);
        Vector3 scaledPoint = scaleMatrix.MultiplyPoint3x4(originalPoint);
        // scaledPoint = (2, 1, 0.5)

        // Effect of non-uniform scaling on direction vectors
        // Note: Non-uniform scaling affects normals, need to use inverse transpose matrix
        Vector3 normal = new Vector3(0, 1, 0);
        Matrix4x4 inverseTranspose = scaleMatrix.inverse.transpose;
        Vector3 transformedNormal = inverseTranspose.MultiplyVector(normal).normalized;
    }
}
```

### Matrix Composition

One powerful feature of matrices is that multiple transformations can be combined through multiplication. Note: Matrix multiplication is not commutative, the order of transformations matters.

```csharp
// Unity C# - Matrix Composition
public class MatrixCombination : MonoBehaviour
{
    void Example()
    {
        // Standard transformation order: scale first, then rotate, finally translate
        Vector3 position = new Vector3(10, 0, 0);
        Quaternion rotation = Quaternion.Euler(0, 45, 0);
        Vector3 scale = new Vector3(2, 2, 2);

        // Method 1: Use TRS (recommended)
        Matrix4x4 modelMatrix = Matrix4x4.TRS(position, rotation, scale);

        // Method 2: Manually compose matrices
        Matrix4x4 T = Matrix4x4.Translate(position);
        Matrix4x4 R = Matrix4x4.Rotate(rotation);
        Matrix4x4 S = Matrix4x4.Scale(scale);

        // Note: Matrix multiplication is applied right to left
        // Final transformation = T * R * S (S first, then R, finally T)
        Matrix4x4 combined = T * R * S;

        // Transformation chain example: world space to screen space
        Matrix4x4 worldMatrix = transform.localToWorldMatrix;
        Matrix4x4 viewMatrix = Camera.main.worldToCameraMatrix;
        Matrix4x4 projectionMatrix = Camera.main.projectionMatrix;

        // MVP matrix
        Matrix4x4 mvpMatrix = projectionMatrix * viewMatrix * worldMatrix;

        // Transform world coordinate point to clip space
        Vector3 worldPoint = transform.position;
        Vector4 clipPoint = mvpMatrix * new Vector4(worldPoint.x, worldPoint.y, worldPoint.z, 1);
    }

    // Rotate around an arbitrary point
    Matrix4x4 RotateAroundPoint(Vector3 point, Vector3 axis, float angle)
    {
        // 1. Translate to origin
        Matrix4x4 toOrigin = Matrix4x4.Translate(-point);

        // 2. Rotate
        Matrix4x4 rotation = Matrix4x4.Rotate(Quaternion.AngleAxis(angle, axis));

        // 3. Translate back to original position
        Matrix4x4 fromOrigin = Matrix4x4.Translate(point);

        // Compose: translate to origin first, then rotate, then translate back
        return fromOrigin * rotation * toOrigin;
    }
}
```

```cpp
// Unreal Engine C++ - Matrix Composition
void AMatrixExample::MatrixCombinationExample()
{
    // Create transformations
    FVector Location(100.0f, 0.0f, 0.0f);
    FRotator Rotation(0.0f, 45.0f, 0.0f);
    FVector Scale(2.0f, 2.0f, 2.0f);

    // Use FTransform (UE recommended approach)
    FTransform Transform(Rotation, Location, Scale);
    FMatrix TransformMatrix = Transform.ToMatrixWithScale();

    // Manual composition
    FMatrix TranslationMatrix = FTranslationMatrix(Location);
    FMatrix RotationMatrix = FRotationMatrix(Rotation);
    FMatrix ScaleMatrix = FScaleMatrix(Scale);

    // Composition order: Scale -> Rotate -> Translate
    FMatrix Combined = ScaleMatrix * RotationMatrix * TranslationMatrix;

    // Inverse transformation
    FMatrix InverseTransform = TransformMatrix.Inverse();

    // Apply transformation
    FVector LocalPoint(1.0f, 0.0f, 0.0f);
    FVector WorldPoint = TransformMatrix.TransformPosition(LocalPoint);

    // Inverse transform back to local coordinates
    FVector BackToLocal = InverseTransform.TransformPosition(WorldPoint);
}
```

## Quaternion Rotation

Quaternions are a mathematical tool for representing 3D rotations. Compared to Euler angles, they have advantages such as avoiding gimbal lock and easy interpolation.

### Quaternion Basics

A quaternion consists of one real part and three imaginary parts: $q = w + xi + yj + zk$

It can also be written as: $q = (w, \vec{v})$ where $\vec{v} = (x, y, z)$

```csharp
// Unity C# - Quaternion Basics
public class QuaternionBasics : MonoBehaviour
{
    void Start()
    {
        // Identity quaternion (no rotation)
        Quaternion identity = Quaternion.identity;  // (0, 0, 0, 1)

        // Create from Euler angles
        Quaternion fromEuler = Quaternion.Euler(30, 45, 60);

        // Create from axis-angle
        Vector3 axis = Vector3.up;
        float angle = 90f;
        Quaternion fromAxisAngle = Quaternion.AngleAxis(angle, axis);

        // Create from direction (make object face a direction)
        Vector3 forward = new Vector3(1, 0, 1).normalized;
        Vector3 upward = Vector3.up;
        Quaternion lookRotation = Quaternion.LookRotation(forward, upward);

        // Rotation from one direction to another
        Vector3 fromDirection = Vector3.forward;
        Vector3 toDirection = Vector3.right;
        Quaternion fromToRotation = Quaternion.FromToRotation(fromDirection, toDirection);

        // Quaternion components
        float x = fromEuler.x;
        float y = fromEuler.y;
        float z = fromEuler.z;
        float w = fromEuler.w;

        // Convert back to Euler angles
        Vector3 euler = fromEuler.eulerAngles;
    }
}
```

### Quaternion Operations

```csharp
// Unity C# - Quaternion Operations
public class QuaternionOperations : MonoBehaviour
{
    void Example()
    {
        Quaternion q1 = Quaternion.Euler(0, 45, 0);
        Quaternion q2 = Quaternion.Euler(0, 30, 0);

        // Quaternion multiplication: combine rotations
        // Apply q2 first, then q1
        Quaternion combined = q1 * q2;

        // Quaternion inverse: reverse rotation
        Quaternion inverse = Quaternion.Inverse(q1);

        // Verify: q * q^(-1) = identity
        Quaternion shouldBeIdentity = q1 * inverse;

        // Rotate a vector
        Vector3 point = new Vector3(1, 0, 0);
        Vector3 rotatedPoint = q1 * point;

        // Or use matrix approach
        Matrix4x4 rotMatrix = Matrix4x4.Rotate(q1);
        Vector3 rotatedPoint2 = rotMatrix.MultiplyPoint3x4(point);

        // Calculate difference between two rotations
        // Rotation needed to go from q1 to q2
        Quaternion difference = q2 * Quaternion.Inverse(q1);

        // Get rotation axis and angle
        difference.ToAngleAxis(out float angleOut, out Vector3 axisOut);

        // Calculate angle difference between two quaternions
        float angleBetween = Quaternion.Angle(q1, q2);
    }
}
```

### Quaternion Interpolation

Quaternion interpolation is key to achieving smooth rotations.

```csharp
// Unity C# - Quaternion Interpolation
public class QuaternionInterpolation : MonoBehaviour
{
    public Transform target;
    public float rotationSpeed = 2.0f;

    void Update()
    {
        if (target == null) return;

        // Calculate rotation towards target
        Vector3 direction = (target.position - transform.position).normalized;
        Quaternion targetRotation = Quaternion.LookRotation(direction);

        // Lerp: Linear interpolation (fast but not perfectly accurate)
        transform.rotation = Quaternion.Lerp(
            transform.rotation,
            targetRotation,
            rotationSpeed * Time.deltaTime
        );

        // Slerp: Spherical linear interpolation (more accurate, constant angular velocity)
        transform.rotation = Quaternion.Slerp(
            transform.rotation,
            targetRotation,
            rotationSpeed * Time.deltaTime
        );

        // RotateTowards: Limit maximum rotation angle
        float maxDegreesDelta = rotationSpeed * 60f * Time.deltaTime;
        transform.rotation = Quaternion.RotateTowards(
            transform.rotation,
            targetRotation,
            maxDegreesDelta
        );
    }

    // Smooth damp rotation
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

    // Custom SmoothDamp implementation
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
// Unreal Engine C++ - Quaternion Operations
void ARotationExample::QuaternionExample()
{
    // Create quaternions
    FQuat Identity = FQuat::Identity;
    FQuat FromRotator = FRotator(0.0f, 45.0f, 0.0f).Quaternion();
    FQuat FromAxisAngle = FQuat(FVector::UpVector, FMath::DegreesToRadians(90.0f));

    // Quaternion multiplication
    FQuat Combined = FromRotator * FromAxisAngle;

    // Quaternion inverse
    FQuat Inverse = FromRotator.Inverse();

    // Rotate vector
    FVector Point(1.0f, 0.0f, 0.0f);
    FVector RotatedPoint = FromRotator.RotateVector(Point);

    // Slerp interpolation
    FQuat Start = FQuat::Identity;
    FQuat End = FRotator(0.0f, 90.0f, 0.0f).Quaternion();
    float Alpha = 0.5f;
    FQuat Interpolated = FQuat::Slerp(Start, End, Alpha);

    // Find rotation from one direction to another
    FVector From = FVector::ForwardVector;
    FVector To = FVector::RightVector;
    FQuat FromTo = FQuat::FindBetweenVectors(From, To);
}

void ARotationExample::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    if (TargetActor)
    {
        // Calculate target rotation
        FVector Direction = (TargetActor->GetActorLocation() - GetActorLocation()).GetSafeNormal();
        FQuat TargetRotation = Direction.ToOrientationQuat();

        // Smooth rotation
        FQuat CurrentRotation = GetActorQuat();
        FQuat NewRotation = FMath::QInterpTo(CurrentRotation, TargetRotation, DeltaTime, RotationSpeed);

        SetActorRotation(NewRotation);
    }
}
```

### Gimbal Lock Problem

The main problem with Euler angles is gimbal lock, where rotating one axis by 90 degrees causes a loss of one degree of freedom.

```csharp
// Unity C# - Gimbal Lock Demonstration and Solution
public class GimbalLockDemo : MonoBehaviour
{
    // Using Euler angles encounters gimbal lock
    void EulerAngleProblem()
    {
        // When Pitch (X axis) rotates to 90 degrees
        Vector3 euler1 = new Vector3(90, 30, 0);
        Vector3 euler2 = new Vector3(90, 0, 30);

        // These two rotations are actually the same!
        // Because at X=90 degrees, Y and Z axis rotations have the same effect

        Quaternion q1 = Quaternion.Euler(euler1);
        Quaternion q2 = Quaternion.Euler(euler2);

        // q1 and q2 are nearly equal
        float angle = Quaternion.Angle(q1, q2);
        Debug.Log($"Angle difference: {angle}");  // Close to 0
    }

    // Use quaternions to avoid gimbal lock
    public float pitch, yaw, roll;
    private Quaternion currentRotation = Quaternion.identity;

    void Update()
    {
        // Don't do this (will have gimbal lock):
        // transform.eulerAngles = new Vector3(pitch, yaw, roll);

        // Use quaternions to accumulate rotation
        float deltaYaw = Input.GetAxis("Mouse X") * 2f;
        float deltaPitch = -Input.GetAxis("Mouse Y") * 2f;

        // Create incremental rotations
        Quaternion yawRotation = Quaternion.AngleAxis(deltaYaw, Vector3.up);
        Quaternion pitchRotation = Quaternion.AngleAxis(deltaPitch, Vector3.right);

        // Accumulate rotation (note the order)
        // Apply yaw first (around world Y axis), then pitch (around local X axis)
        currentRotation = yawRotation * currentRotation * pitchRotation;

        transform.rotation = currentRotation;
    }
}
```

## Bezier Curves

Bezier curves are commonly used tools in games for implementing smooth paths, animation easing, UI curves, and more.

### Linear Bezier Curve (First Order)

Linear interpolation between two points:

$$B(t) = P_0 + t(P_1 - P_0) = (1-t)P_0 + tP_1$$

```csharp
// Unity C# - Linear Interpolation
public class LinearBezier : MonoBehaviour
{
    public Transform start;
    public Transform end;

    Vector3 LinearInterpolation(float t)
    {
        return Vector3.Lerp(start.position, end.position, t);
        // Equivalent to: start.position + t * (end.position - start.position)
    }
}
```

### Quadratic Bezier Curve (Second Order)

A curve defined by three control points:

$$B(t) = (1-t)^2 P_0 + 2(1-t)t P_1 + t^2 P_2$$

```csharp
// Unity C# - Quadratic Bezier Curve
public class QuadraticBezier : MonoBehaviour
{
    public Transform p0;  // Start point
    public Transform p1;  // Control point
    public Transform p2;  // End point

    Vector3 QuadraticBezierPoint(float t)
    {
        float oneMinusT = 1f - t;
        return oneMinusT * oneMinusT * p0.position +
               2f * oneMinusT * t * p1.position +
               t * t * p2.position;
    }

    // Using De Casteljau algorithm (more stable)
    Vector3 QuadraticBezierDeCasteljau(float t)
    {
        Vector3 a = Vector3.Lerp(p0.position, p1.position, t);
        Vector3 b = Vector3.Lerp(p1.position, p2.position, t);
        return Vector3.Lerp(a, b, t);
    }

    // Calculate tangent direction
    Vector3 QuadraticBezierTangent(float t)
    {
        float oneMinusT = 1f - t;
        return 2f * oneMinusT * (p1.position - p0.position) +
               2f * t * (p2.position - p1.position);
    }

    void OnDrawGizmos()
    {
        if (p0 == null || p1 == null || p2 == null) return;

        // Draw curve
        Gizmos.color = Color.yellow;
        Vector3 prevPoint = p0.position;

        for (int i = 1; i <= 20; i++)
        {
            float t = i / 20f;
            Vector3 point = QuadraticBezierPoint(t);
            Gizmos.DrawLine(prevPoint, point);
            prevPoint = point;
        }

        // Draw control point connections
        Gizmos.color = Color.gray;
        Gizmos.DrawLine(p0.position, p1.position);
        Gizmos.DrawLine(p1.position, p2.position);
    }
}
```

### Cubic Bezier Curve (Third Order)

A curve defined by four control points, the most commonly used Bezier curve type:

$$B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t)t^2 P_2 + t^3 P_3$$

```csharp
// Unity C# - Cubic Bezier Curve
public class CubicBezier : MonoBehaviour
{
    public Transform p0;  // Start point
    public Transform p1;  // Control point 1
    public Transform p2;  // Control point 2
    public Transform p3;  // End point

    // Calculate point on curve
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

    // De Casteljau algorithm
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

    // Calculate first derivative (tangent)
    public static Vector3 CubicBezierFirstDerivative(Vector3 p0, Vector3 p1,
        Vector3 p2, Vector3 p3, float t)
    {
        float oneMinusT = 1f - t;
        return 3f * oneMinusT * oneMinusT * (p1 - p0) +
               6f * oneMinusT * t * (p2 - p1) +
               3f * t * t * (p3 - p2);
    }

    // Estimate curve length
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

    // Get point on curve at distance (approximate uniform speed motion)
    public Vector3 GetPointAtDistance(float distance, int lutResolution = 100)
    {
        // Build lookup table
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

        // Find corresponding t value in lookup table
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

### Practical Bezier Curve Applications

```csharp
// Unity C# - Bezier Curve Application Examples
public class BezierApplications : MonoBehaviour
{
    // Application 1: Projectile Trajectory
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

            // Calculate control point (highest point of arc)
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
                // Use quadratic Bezier curve to calculate position
                transform.position = QuadraticBezier(startPos, controlPoint,
                    target.position, t);

                // Make object face movement direction
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

    // Application 2: Camera Path
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

            // Determine current segment
            float segmentTime = normalizedTime * segments.Length;
            int segmentIndex = Mathf.Min((int)segmentTime, segments.Length - 1);
            float t = segmentTime - segmentIndex;

            BezierSegment segment = segments[segmentIndex];

            // Calculate position
            Vector3 position = CubicBezier.CubicBezierPoint(
                segment.start.position,
                segment.control1.position,
                segment.control2.position,
                segment.end.position,
                t
            );

            // Calculate orientation
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

    // Application 3: UI Animation Easing
    public static class EasingFunctions
    {
        // Define easing functions using cubic Bezier curves
        // Control points: (0,0), (x1,y1), (x2,y2), (1,1)

        public static float CubicBezierEase(float t, float x1, float y1,
            float x2, float y2)
        {
            // Simplified version: assume x is uniformly distributed, only calculate y value
            float oneMinusT = 1f - t;
            float oneMinusT2 = oneMinusT * oneMinusT;
            float oneMinusT3 = oneMinusT2 * oneMinusT;
            float t2 = t * t;
            float t3 = t2 * t;

            return 3f * oneMinusT2 * t * y1 +
                   3f * oneMinusT * t2 * y2 +
                   t3;
        }

        // Predefined easing curves (same as CSS easing functions)
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
// Unreal Engine C++ - Bezier Curves
class FBezierCurve
{
public:
    // Cubic Bezier curve
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

    // Tangent
    static FVector CubicBezierTangent(const FVector& P0, const FVector& P1,
        const FVector& P2, const FVector& P3, float T)
    {
        float OneMinusT = 1.0f - T;
        return 3.0f * OneMinusT * OneMinusT * (P1 - P0) +
               6.0f * OneMinusT * T * (P2 - P1) +
               3.0f * T * T * (P3 - P2);
    }
};

// Using Spline component (UE built-in)
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

    // Get position and rotation
    FVector Location = SplineComponent->GetLocationAtDistanceAlongSpline(
        CurrentDistance, ESplineCoordinateSpace::World);
    FRotator Rotation = SplineComponent->GetRotationAtDistanceAlongSpline(
        CurrentDistance, ESplineCoordinateSpace::World);

    SetActorLocationAndRotation(Location, Rotation);
}
```

## Collision Detection

Collision detection is a core system in game development, used to determine whether objects are touching or overlapping.

### AABB Collision Detection (Axis-Aligned Bounding Box)

AABB is the simplest and most efficient collision detection method, but only suitable for axis-aligned rectangles/cubes.

```csharp
// Unity C# - AABB Collision Detection
public class AABBCollision : MonoBehaviour
{
    // 2D AABB collision detection
    public static bool CheckAABB2D(Vector2 minA, Vector2 maxA,
        Vector2 minB, Vector2 maxB)
    {
        // If not overlapping on any axis, no collision
        if (maxA.x < minB.x || minA.x > maxB.x) return false;
        if (maxA.y < minB.y || minA.y > maxB.y) return false;

        return true;
    }

    // 3D AABB collision detection
    public static bool CheckAABB3D(Vector3 minA, Vector3 maxA,
        Vector3 minB, Vector3 maxB)
    {
        if (maxA.x < minB.x || minA.x > maxB.x) return false;
        if (maxA.y < minB.y || minA.y > maxB.y) return false;
        if (maxA.z < minB.z || minA.z > maxB.z) return false;

        return true;
    }

    // Using Unity's Bounds class
    public static bool CheckAABBUnity(Bounds a, Bounds b)
    {
        return a.Intersects(b);
    }

    // AABB vs Point collision
    public static bool PointInAABB(Vector3 point, Vector3 min, Vector3 max)
    {
        return point.x >= min.x && point.x <= max.x &&
               point.y >= min.y && point.y <= max.y &&
               point.z >= min.z && point.z <= max.z;
    }

    // Calculate AABB penetration depth and direction
    public static bool GetAABBPenetration(Bounds a, Bounds b,
        out Vector3 penetrationNormal, out float penetrationDepth)
    {
        penetrationNormal = Vector3.zero;
        penetrationDepth = 0f;

        if (!a.Intersects(b)) return false;

        // Calculate overlap on each axis
        float overlapX = Mathf.Min(a.max.x - b.min.x, b.max.x - a.min.x);
        float overlapY = Mathf.Min(a.max.y - b.min.y, b.max.y - a.min.y);
        float overlapZ = Mathf.Min(a.max.z - b.min.z, b.max.z - a.min.z);

        // Find minimum overlap axis
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

### Sphere Collision Detection

Sphere collision detection is simple and efficient, suitable for circular objects or as rough filtering.

```csharp
// Unity C# - Sphere Collision Detection
public class SphereCollision : MonoBehaviour
{
    // Sphere vs Sphere collision
    public static bool SphereSphere(Vector3 centerA, float radiusA,
        Vector3 centerB, float radiusB)
    {
        float distanceSquared = (centerA - centerB).sqrMagnitude;
        float radiusSum = radiusA + radiusB;
        return distanceSquared <= radiusSum * radiusSum;
    }

    // Get collision info
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
            // Centers coincide, choose arbitrary direction
            contactNormal = Vector3.up;
        }

        penetration = radiusSum - distance;
        contactPoint = centerA + contactNormal * radiusA;

        return true;
    }

    // Sphere vs Point
    public static bool PointInSphere(Vector3 point, Vector3 center, float radius)
    {
        return (point - center).sqrMagnitude <= radius * radius;
    }

    // Sphere vs AABB
    public static bool SphereAABB(Vector3 sphereCenter, float sphereRadius,
        Vector3 aabbMin, Vector3 aabbMax)
    {
        // Find closest point on AABB to sphere center
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

### Ray Casting

Ray casting is used for line-of-sight detection, bullet hit determination, mouse picking, etc.

```csharp
// Unity C# - Ray Casting
public class RayCasting : MonoBehaviour
{
    // Ray vs Sphere intersection
    public static bool RaySphere(Vector3 rayOrigin, Vector3 rayDirection,
        Vector3 sphereCenter, float sphereRadius,
        out float t, out Vector3 hitPoint)
    {
        t = 0f;
        hitPoint = Vector3.zero;

        Vector3 oc = rayOrigin - sphereCenter;

        // Solve quadratic equation at^2 + bt + c = 0
        float a = Vector3.Dot(rayDirection, rayDirection);
        float b = 2.0f * Vector3.Dot(oc, rayDirection);
        float c = Vector3.Dot(oc, oc) - sphereRadius * sphereRadius;

        float discriminant = b * b - 4 * a * c;

        if (discriminant < 0)
            return false;

        // Take smaller positive root
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

    // Ray vs Plane intersection
    public static bool RayPlane(Vector3 rayOrigin, Vector3 rayDirection,
        Vector3 planePoint, Vector3 planeNormal,
        out float t, out Vector3 hitPoint)
    {
        t = 0f;
        hitPoint = Vector3.zero;

        float denom = Vector3.Dot(planeNormal, rayDirection);

        // Ray parallel to plane
        if (Mathf.Abs(denom) < 0.0001f)
            return false;

        t = Vector3.Dot(planePoint - rayOrigin, planeNormal) / denom;

        if (t < 0)
            return false;

        hitPoint = rayOrigin + rayDirection * t;
        return true;
    }

    // Ray vs AABB intersection
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
                // Ray parallel to this axis
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

    // Ray vs Triangle intersection (Moller-Trumbore algorithm)
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
            return false;  // Ray parallel to triangle

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

// Unity raycast API usage
public class UnityRayCastExample : MonoBehaviour
{
    void Update()
    {
        // Simple raycast
        Ray ray = new Ray(transform.position, transform.forward);
        RaycastHit hit;

        if (Physics.Raycast(ray, out hit, 100f))
        {
            Debug.Log($"Hit: {hit.collider.name}");
            Debug.Log($"Hit point: {hit.point}");
            Debug.Log($"Hit normal: {hit.normal}");
            Debug.Log($"Distance: {hit.distance}");
        }

        // Raycast with layer mask
        int layerMask = LayerMask.GetMask("Enemy", "Obstacle");
        if (Physics.Raycast(ray, out hit, 100f, layerMask))
        {
            // Only detects Enemy and Obstacle layers
        }

        // Detect all hits
        RaycastHit[] hits = Physics.RaycastAll(ray, 100f);
        foreach (var h in hits)
        {
            Debug.Log($"Hit: {h.collider.name}");
        }

        // Sphere overlap
        Collider[] colliders = Physics.OverlapSphere(transform.position, 5f);
        foreach (var col in colliders)
        {
            Debug.Log($"In range: {col.name}");
        }

        // Box overlap
        Vector3 halfExtents = new Vector3(1f, 1f, 1f);
        colliders = Physics.OverlapBox(transform.position, halfExtents,
            transform.rotation);
    }
}
```

```cpp
// Unreal Engine C++ - Collision Detection
void ACollisionExample::PerformLineTrace()
{
    FVector Start = GetActorLocation();
    FVector End = Start + GetActorForwardVector() * 1000.0f;

    FHitResult HitResult;
    FCollisionQueryParams Params;
    Params.AddIgnoredActor(this);

    // Simple line trace
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

    // Multiple hits
    TArray<FHitResult> HitResults;
    GetWorld()->LineTraceMultiByChannel(
        HitResults,
        Start,
        End,
        ECC_Visibility,
        Params
    );

    // Sphere sweep
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

### Separating Axis Theorem (SAT)

SAT is a general algorithm for detecting convex polygon collisions. If there exists an axis where the projections of two objects do not overlap, then the objects are not colliding.

```csharp
// Unity C# - Separating Axis Theorem (2D Convex Polygons)
public class SATCollision : MonoBehaviour
{
    // Get all edge normals as separating axes
    static Vector2[] GetAxes(Vector2[] polygon)
    {
        Vector2[] axes = new Vector2[polygon.Length];

        for (int i = 0; i < polygon.Length; i++)
        {
            Vector2 p1 = polygon[i];
            Vector2 p2 = polygon[(i + 1) % polygon.Length];

            Vector2 edge = p2 - p1;
            // Normal (perpendicular to edge)
            axes[i] = new Vector2(-edge.y, edge.x).normalized;
        }

        return axes;
    }

    // Project polygon onto axis
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

    // Check if two projections overlap
    static bool Overlaps(float minA, float maxA, float minB, float maxB)
    {
        return maxA >= minB && maxB >= minA;
    }

    // Calculate overlap amount
    static float GetOverlap(float minA, float maxA, float minB, float maxB)
    {
        return Mathf.Min(maxA, maxB) - Mathf.Max(minA, minB);
    }

    // SAT collision detection
    public static bool CheckCollision(Vector2[] polygonA, Vector2[] polygonB)
    {
        // Check all axes from A
        Vector2[] axesA = GetAxes(polygonA);
        foreach (Vector2 axis in axesA)
        {
            ProjectPolygon(polygonA, axis, out float minA, out float maxA);
            ProjectPolygon(polygonB, axis, out float minB, out float maxB);

            if (!Overlaps(minA, maxA, minB, maxB))
                return false;  // Found separating axis, no collision
        }

        // Check all axes from B
        Vector2[] axesB = GetAxes(polygonB);
        foreach (Vector2 axis in axesB)
        {
            ProjectPolygon(polygonA, axis, out float minA, out float maxA);
            ProjectPolygon(polygonB, axis, out float minB, out float maxB);

            if (!Overlaps(minA, maxA, minB, maxB))
                return false;
        }

        return true;  // All axes overlap, collision occurred
    }

    // SAT detection with penetration info
    public static bool CheckCollisionWithPenetration(Vector2[] polygonA,
        Vector2[] polygonB, out Vector2 mtv)
    {
        mtv = Vector2.zero;
        float minOverlap = float.MaxValue;
        Vector2 smallestAxis = Vector2.zero;

        // Get all separating axes
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

        // Determine MTV direction
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

### OBB Collision Detection (Oriented Bounding Box)

OBB is a bounding box that can rotate arbitrarily, more precise than AABB but more computationally expensive.

```csharp
// Unity C# - OBB Collision Detection
[System.Serializable]
public struct OBB
{
    public Vector3 center;      // Center point
    public Vector3 halfExtents; // Half size
    public Quaternion rotation; // Rotation

    // Get OBB's three local axes
    public Vector3[] GetAxes()
    {
        return new Vector3[]
        {
            rotation * Vector3.right,
            rotation * Vector3.up,
            rotation * Vector3.forward
        };
    }

    // Get OBB's 8 vertices
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
    // Project OBB onto axis
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

    // OBB vs OBB collision detection
    public static bool CheckOBBOBB(OBB a, OBB b)
    {
        Vector3[] axesA = a.GetAxes();
        Vector3[] axesB = b.GetAxes();

        // Need to test 15 axes
        List<Vector3> axes = new List<Vector3>();

        // A's 3 face normals
        axes.AddRange(axesA);

        // B's 3 face normals
        axes.AddRange(axesB);

        // Cross products of A and B axes (9)
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

        // Test all axes
        foreach (Vector3 axis in axes)
        {
            ProjectOBB(a, axis, out float minA, out float maxA);
            ProjectOBB(b, axis, out float minB, out float maxB);

            if (maxA < minB || maxB < minA)
                return false;
        }

        return true;
    }

    // Point in OBB test
    public static bool PointInOBB(Vector3 point, OBB obb)
    {
        // Transform point to OBB's local coordinate system
        Vector3 localPoint = Quaternion.Inverse(obb.rotation) * (point - obb.center);

        return Mathf.Abs(localPoint.x) <= obb.halfExtents.x &&
               Mathf.Abs(localPoint.y) <= obb.halfExtents.y &&
               Mathf.Abs(localPoint.z) <= obb.halfExtents.z;
    }

    // Closest point on OBB to a point
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

### Spatial Partitioning Optimization

For collision detection with many objects, spatial partitioning structures are needed for optimization.

```csharp
// Unity C# - Quadtree (2D Spatial Partitioning)
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
            // Object spans multiple quadrants
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

// Using quadtree to optimize collision detection
public class OptimizedCollisionSystem : MonoBehaviour
{
    private QuadTree<Collider2D> quadTree;
    private List<Collider2D> allColliders = new List<Collider2D>();

    void Start()
    {
        // Initialize quadtree covering entire game area
        quadTree = new QuadTree<Collider2D>(0, new Rect(-100, -100, 200, 200));
    }

    void Update()
    {
        // Rebuild quadtree every frame
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

        // Detect collisions
        foreach (var collider in allColliders)
        {
            Rect bounds = new Rect(
                collider.bounds.min.x,
                collider.bounds.min.y,
                collider.bounds.size.x,
                collider.bounds.size.y
            );

            // Only check nearby objects
            List<Collider2D> nearbyColliders = quadTree.Retrieve(bounds);

            foreach (var other in nearbyColliders)
            {
                if (collider != other)
                {
                    // Precise collision detection
                    if (collider.bounds.Intersects(other.bounds))
                    {
                        // Handle collision
                        HandleCollision(collider, other);
                    }
                }
            }
        }
    }

    void HandleCollision(Collider2D a, Collider2D b)
    {
        // Collision response
    }
}
```

## Interview Key Points

### Core Concept Questions

**Q1: Explain the differences between dot product and cross product and their application scenarios**

```
Dot Product:
- Returns a scalar
- Formula: a dot b = |a||b|cos(theta)
- Applications:
  - Calculate angle between two vectors
  - Determine if object is in front or behind
  - Field of view detection (FOV)
  - Lambert lighting calculation
  - Vector projection

Cross Product:
- Returns a vector (perpendicular to input vectors)
- Formula: a cross b = |a||b|sin(theta) (direction follows right-hand rule)
- Applications:
  - Determine if object is on left or right side
  - Calculate normals
  - Calculate triangle area
  - Calculate torque
```

**Q2: Why use quaternions instead of Euler angles to represent rotation?**

```
Euler Angle Problems:
1. Gimbal Lock: Lose one degree of freedom when one axis rotates 90 degrees
2. Difficult interpolation: Direct Euler angle interpolation produces unnatural rotation paths
3. Order-dependent: Different rotation orders produce different results

Quaternion Advantages:
1. Avoids gimbal lock
2. Can perform smooth spherical interpolation (Slerp)
3. Computationally efficient (combining rotations only requires quaternion multiplication)
4. Good numerical stability

Quaternion Disadvantages:
1. Not intuitive, difficult to set manually
2. Need to maintain unit quaternion (normalization)
```

**Q3: Explain the MVP matrix transformation pipeline**

```
MVP = Model * View * Projection

1. Model Matrix:
   - Transforms vertices from local space to world space
   - Contains translation, rotation, scale

2. View Matrix:
   - Transforms vertices from world space to camera space
   - Equivalent to placing camera at origin, looking toward -Z

3. Projection Matrix:
   - Transforms vertices from camera space to clip space
   - Perspective projection: near objects appear larger, far objects smaller
   - Orthographic projection: preserves parallel lines

Transformation order: Local Space -> World Space -> Camera Space -> Clip Space -> NDC -> Screen Space
```

### Algorithm Implementation Questions

**Q4: How to determine if a point is inside a triangle?**

```csharp
// Method 1: Barycentric Coordinates
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

// Method 2: Cross Product Method (2D)
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

**Q5: Implement a smooth follow camera**

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

        // Calculate desired position
        Vector3 desiredPosition = target.position
            - target.forward * distance
            + Vector3.up * height;

        // Smooth position follow
        transform.position = Vector3.SmoothDamp(
            transform.position,
            desiredPosition,
            ref velocity,
            smoothTime
        );

        // Smooth rotation follow
        float targetAngle = target.eulerAngles.y;
        float currentAngle = transform.eulerAngles.y;

        currentAngle = Mathf.SmoothDampAngle(
            currentAngle,
            targetAngle,
            ref rotationVelocity,
            rotationSmoothTime
        );

        transform.rotation = Quaternion.Euler(0, currentAngle, 0);

        // Look at target
        transform.LookAt(target.position + Vector3.up * 1.5f);
    }
}
```

### Common Errors and Considerations

```csharp
// Error 1: Not normalizing direction vectors
Vector3 direction = target.position - transform.position;
// Should use direction.normalized

// Error 2: Directly adding Euler angles
transform.eulerAngles += new Vector3(0, deltaYaw, 0);
// May cause gimbal lock, should use quaternions

// Error 3: Forgetting time scaling
transform.position += velocity;
// Should multiply by Time.deltaTime

// Error 4: Comparing floating point equality
if (distance == 0) // May never be true
// Should use Mathf.Approximately(distance, 0) or threshold comparison

// Error 5: Using sqrMagnitude but forgetting to square the comparison
if (direction.sqrMagnitude < range) // Wrong: comparing against squared value
// Should compare against range * range or use magnitude

// Error 6: Ignoring division by zero
Vector3 normalized = direction / direction.magnitude;
// Should check if magnitude is 0, or use direction.normalized (returns zero vector)

// Error 7: Wrong matrix multiplication order
Matrix4x4 transform = translation * rotation * scale; // SRT order
// Should be TRS order: translation * rotation * scale
// But matrices are applied right to left, so actual effect is scale first, then rotate, finally translate
```

## Utility Classes

```csharp
// Unity C# - Game Math Utility Class
public static class GameMathUtils
{
    // Normalize angle to -180 to 180 range
    public static float NormalizeAngle(float angle)
    {
        while (angle > 180f) angle -= 360f;
        while (angle < -180f) angle += 360f;
        return angle;
    }

    // Calculate shortest difference between two angles
    public static float AngleDifference(float a, float b)
    {
        float diff = NormalizeAngle(b - a);
        return diff;
    }

    // Smooth damp angle
    public static float SmoothDampAngle(float current, float target,
        ref float velocity, float smoothTime, float maxSpeed = float.PositiveInfinity)
    {
        target = current + AngleDifference(current, target);
        return Mathf.SmoothDamp(current, target, ref velocity, smoothTime, maxSpeed);
    }

    // Convert world coordinates to screen coordinates
    public static Vector2 WorldToScreenPoint(Camera camera, Vector3 worldPoint)
    {
        Vector3 screenPoint = camera.WorldToScreenPoint(worldPoint);
        return new Vector2(screenPoint.x, screenPoint.y);
    }

    // Screen ray intersection with plane
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

    // Calculate parabolic trajectory
    public static Vector3 CalculateParabolicTrajectory(Vector3 start,
        Vector3 initialVelocity, float gravity, float time)
    {
        return start + initialVelocity * time +
               0.5f * Vector3.down * gravity * time * time;
    }

    // Calculate initial velocity needed to reach target
    public static Vector3 CalculateLaunchVelocity(Vector3 start, Vector3 target,
        float gravity, float angle)
    {
        Vector3 direction = target - start;
        float horizontalDistance = new Vector3(direction.x, 0, direction.z).magnitude;
        float verticalDistance = direction.y;

        float angleRad = angle * Mathf.Deg2Rad;
        float cos = Mathf.Cos(angleRad);
        float tan = Mathf.Tan(angleRad);

        // v^2 = g * x^2 / (2 * cos^2(theta) * (x * tan(theta) - y))
        float denominator = 2 * cos * cos * (horizontalDistance * tan - verticalDistance);

        if (denominator <= 0) return Vector3.zero;

        float speed = Mathf.Sqrt(gravity * horizontalDistance * horizontalDistance / denominator);

        Vector3 horizontalDir = new Vector3(direction.x, 0, direction.z).normalized;
        return horizontalDir * speed * cos + Vector3.up * speed * Mathf.Sin(angleRad);
    }

    // Remap value from one range to another
    public static float Remap(float value, float fromMin, float fromMax,
        float toMin, float toMax)
    {
        float normalized = (value - fromMin) / (fromMax - fromMin);
        return toMin + normalized * (toMax - toMin);
    }

    // Calculate spring damping
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

## Summary

Game mathematics is the foundation of game development. We covered the core mathematical knowledge for game development:

1. **Vector Operations**: Understanding dot product and cross product is key to game mathematics, with wide applications in direction determination, field of view detection, lighting calculations, and more.

2. **Matrix Transformations**: Mastering TRS (Translation-Rotation-Scale) transformations and MVP matrices is fundamental to understanding the 3D rendering pipeline.

3. **Quaternions**: Using quaternions for rotation avoids gimbal lock and achieves smooth rotation interpolation.

4. **Bezier Curves**: Essential for path planning, animation easing, UI design, and other scenarios.

5. **Collision Detection**: From simple AABB and sphere collision to complex SAT and OBB algorithms, combined with spatial partitioning optimization, forms the foundation for building reliable game physics.

Recommended learning approach:
- Implement these algorithms manually to deepen understanding
- Apply them in actual projects to experience the connection between mathematics and game systems
- Use debug visualization tools (like Gizmos) to observe mathematical calculation results
- Read game engine source code to learn industrial-grade implementations

With these mathematical fundamentals, you can understand better how game engines work, solve complex game development problems, and optimize game performance.
