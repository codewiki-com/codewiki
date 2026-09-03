---
title: 刚体动力学与物理模拟
description: 理解游戏物理引擎核心：力、力矩、约束求解和关节
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - rigid body
  - physics simulation
  - constraints
  - joints
status: imported
origin: old/src/content/docs/gamedev/rigid-body-dynamics.zh.md
divergence: 0.2
issues: []
legacy:
  category: GameDev
  subcategory: Physics
  order: 15
  lastUpdated: 2026-01-07
---

## 概念概述

刚体动力学是游戏、模拟和虚拟环境中物理模拟的基础。**刚体**是一种固体对象的理想化，它在力的作用下不会变形——无论施加什么外力，物体上任意两点之间的距离始终保持不变。

### 为什么使用刚体物理？

在游戏开发中，真实的物理模拟创造沉浸式体验：

1. **可信的交互**：物体自然地下落、碰撞和堆叠
2. **涌现式玩法**：基于物理的谜题和机制
3. **视觉真实感**：布娃娃效果、车辆动力学、破坏
4. **减少动画工作**：让物理处理次要运动

### 历史背景

物理引擎从简单的街机物理（Pong，1972）发展到复杂的模拟：

- **1990 年代**：早期游戏物理，具有基本的碰撞检测
- **2000 年代**：Havok、PhysX 革新了实时物理
- **2010 年代**：Box2D、Bullet 成为行业标准
- **现在**：GPU 加速物理、机器学习集成

---

## 核心概念

### 刚体状态

刚体在任何时刻的状态由以下定义：

```
位置与朝向：
- 位置向量：x = (x, y, z)
- 朝向：四元数 q 或旋转矩阵 R

线性与角运动：
- 线速度：v = dx/dt
- 角速度：omega (w)

质量属性：
- 质量：m（标量）
- 惯性张量：I（3x3 矩阵）
```

### 刚体状态结构

```cpp
struct RigidBody {
    // 位置和朝向
    Vector3 position;
    Quaternion orientation;

    // 线性动力学
    Vector3 linearVelocity;
    Vector3 force;          // 累积的力
    float mass;
    float inverseMass;      // 1/mass（静态物体为 0）

    // 角动力学
    Vector3 angularVelocity;
    Vector3 torque;         // 累积的力矩
    Matrix3 inertia;        // 局部空间的惯性张量
    Matrix3 inverseInertia; // 逆惯性张量

    // 材质属性
    float restitution;      // 弹性（0-1）
    float friction;         // 表面摩擦

    // 碰撞形状
    CollisionShape* shape;

    // 标志
    bool isStatic;
    bool isAwake;
};
```

---

## 运动方程

### 牛顿第二定律

控制刚体运动的基本方程：

**线性运动：**
```
F = m * a
a = F / m

其中：
- F = 总力
- m = 质量
- a = 线性加速度
```

**角运动：**
```
T = I * alpha
alpha = I^(-1) * T

其中：
- T = 总力矩
- I = 惯性张量
- alpha = 角加速度
```

### 惯性张量

惯性张量描述质量在刚体中的分布方式，影响其对旋转的阻力：

```cpp
// 基本形状的常见惯性张量

// 实心球体（半径 r，质量 m）
Matrix3 sphereInertia(float mass, float radius) {
    float I = (2.0f / 5.0f) * mass * radius * radius;
    return Matrix3(
        I, 0, 0,
        0, I, 0,
        0, 0, I
    );
}

// 实心盒子（宽度 w，高度 h，深度 d，质量 m）
Matrix3 boxInertia(float mass, float w, float h, float d) {
    float Ix = (1.0f / 12.0f) * mass * (h*h + d*d);
    float Iy = (1.0f / 12.0f) * mass * (w*w + d*d);
    float Iz = (1.0f / 12.0f) * mass * (w*w + h*h);
    return Matrix3(
        Ix, 0,  0,
        0,  Iy, 0,
        0,  0,  Iz
    );
}

// 实心圆柱体（半径 r，高度 h，质量 m）- 沿 Y 轴对齐
Matrix3 cylinderInertia(float mass, float radius, float height) {
    float Ixx = (1.0f / 12.0f) * mass * (3*radius*radius + height*height);
    float Iyy = (1.0f / 2.0f) * mass * radius * radius;
    return Matrix3(
        Ixx, 0,   0,
        0,   Iyy, 0,
        0,   0,   Ixx
    );
}
```

### 世界空间惯性

惯性张量必须每帧变换到世界空间：

```cpp
Matrix3 computeWorldInertia(const RigidBody& body) {
    Matrix3 R = body.orientation.toRotationMatrix();
    // I_world = R * I_local * R^T
    return R * body.inertia * R.transpose();
}

Matrix3 computeWorldInverseInertia(const RigidBody& body) {
    Matrix3 R = body.orientation.toRotationMatrix();
    return R * body.inverseInertia * R.transpose();
}
```

---

## 力和力矩

### 施加力

力可以施加在刚体的不同点上：

```cpp
class RigidBody {
public:
    // 在质心施加力（不产生力矩）
    void applyForce(const Vector3& force) {
        this->force += force;
    }

    // 在世界点施加力（产生力矩）
    void applyForceAtPoint(const Vector3& force, const Vector3& worldPoint) {
        this->force += force;

        // 力矩 = r x F（叉积）
        Vector3 r = worldPoint - position;
        this->torque += r.cross(force);
    }

    // 在局部点施加力
    void applyForceAtLocalPoint(const Vector3& force, const Vector3& localPoint) {
        Vector3 worldPoint = transformLocalToWorld(localPoint);
        applyForceAtPoint(force, worldPoint);
    }

    // 直接施加力矩
    void applyTorque(const Vector3& torque) {
        this->torque += torque;
    }

    // 施加冲量（瞬时力）
    void applyImpulse(const Vector3& impulse) {
        linearVelocity += impulse * inverseMass;
    }

    // 在某点施加冲量
    void applyImpulseAtPoint(const Vector3& impulse, const Vector3& worldPoint) {
        linearVelocity += impulse * inverseMass;

        Vector3 r = worldPoint - position;
        Vector3 angularImpulse = r.cross(impulse);
        angularVelocity += worldInverseInertia * angularImpulse;
    }

private:
    Vector3 transformLocalToWorld(const Vector3& localPoint) {
        return position + orientation.rotate(localPoint);
    }
};
```

### 常见的力

```cpp
class ForceGenerator {
public:
    virtual void updateForce(RigidBody* body, float dt) = 0;
};

// 重力
class GravityForce : public ForceGenerator {
    Vector3 gravity;
public:
    GravityForce(const Vector3& g = Vector3(0, -9.81f, 0)) : gravity(g) {}

    void updateForce(RigidBody* body, float dt) override {
        if (body->inverseMass == 0) return; // 跳过静态物体
        body->applyForce(gravity * body->mass);
    }
};

// 弹簧力（胡克定律）
class SpringForce : public ForceGenerator {
    RigidBody* other;
    Vector3 localAnchor;      // 此物体上的附着点
    Vector3 otherLocalAnchor; // 另一物体上的附着点
    float stiffness;          // 弹簧常数 (k)
    float restLength;         // 自然长度
    float damping;            // 阻尼系数

public:
    void updateForce(RigidBody* body, float dt) override {
        // 获取附着点的世界位置
        Vector3 worldAnchor = body->transformLocalToWorld(localAnchor);
        Vector3 otherWorldAnchor = other->transformLocalToWorld(otherLocalAnchor);

        // 计算弹簧向量
        Vector3 springVector = worldAnchor - otherWorldAnchor;
        float length = springVector.magnitude();

        if (length == 0) return;

        Vector3 direction = springVector / length;

        // 胡克定律：F = -k * (x - x0)
        float displacement = length - restLength;
        float forceMagnitude = -stiffness * displacement;

        // 添加阻尼
        Vector3 relativeVelocity = body->getVelocityAtPoint(worldAnchor) -
                                   other->getVelocityAtPoint(otherWorldAnchor);
        float dampingForce = -damping * relativeVelocity.dot(direction);

        Vector3 force = direction * (forceMagnitude + dampingForce);
        body->applyForceAtPoint(force, worldAnchor);
    }
};

// 阻力（空气阻力）
class DragForce : public ForceGenerator {
    float linearDrag;
    float angularDrag;

public:
    DragForce(float linear = 0.01f, float angular = 0.01f)
        : linearDrag(linear), angularDrag(angular) {}

    void updateForce(RigidBody* body, float dt) override {
        // 线性阻力：F = -k * v
        Vector3 linearDragForce = -body->linearVelocity * linearDrag;
        body->applyForce(linearDragForce);

        // 角阻力：T = -k * omega
        Vector3 angularDragTorque = -body->angularVelocity * angularDrag;
        body->applyTorque(angularDragTorque);
    }
};
```

---

## 数值积分

### 积分问题

物理模拟在离散时间步长上推进状态：

```
给定：当前状态（位置、速度）
求：时间 t + dt 的状态
```

### 显式欧拉积分

最简单但最不稳定的方法：

```cpp
void integrateEuler(RigidBody& body, float dt) {
    // 跳过静态物体
    if (body.inverseMass == 0) return;

    // 线性积分
    Vector3 linearAcceleration = body.force * body.inverseMass;
    body.linearVelocity += linearAcceleration * dt;
    body.position += body.linearVelocity * dt;

    // 角积分
    Matrix3 worldInverseInertia = computeWorldInverseInertia(body);
    Vector3 angularAcceleration = worldInverseInertia * body.torque;
    body.angularVelocity += angularAcceleration * dt;

    // 四元数积分
    Quaternion spin(0,
        body.angularVelocity.x,
        body.angularVelocity.y,
        body.angularVelocity.z
    );
    body.orientation += spin * body.orientation * 0.5f * dt;
    body.orientation.normalize();

    // 清除累加器
    body.force = Vector3(0, 0, 0);
    body.torque = Vector3(0, 0, 0);

    // 应用阻尼
    body.linearVelocity *= pow(0.99f, dt);
    body.angularVelocity *= pow(0.99f, dt);
}
```

### 半隐式欧拉（辛欧拉）

比显式欧拉更稳定——先更新速度，再更新位置：

```cpp
void integrateSemiImplicitEuler(RigidBody& body, float dt) {
    if (body.inverseMass == 0) return;

    // 先更新速度
    Vector3 linearAcceleration = body.force * body.inverseMass;
    body.linearVelocity += linearAcceleration * dt;

    Matrix3 worldInverseInertia = computeWorldInverseInertia(body);
    Vector3 angularAcceleration = worldInverseInertia * body.torque;
    body.angularVelocity += angularAcceleration * dt;

    // 然后使用新速度更新位置
    body.position += body.linearVelocity * dt;

    Quaternion spin(0,
        body.angularVelocity.x,
        body.angularVelocity.y,
        body.angularVelocity.z
    );
    body.orientation += spin * body.orientation * 0.5f * dt;
    body.orientation.normalize();

    // 清除累加器
    body.force = Vector3(0, 0, 0);
    body.torque = Vector3(0, 0, 0);
}
```

### Verlet 积分

非常适合基于位置的约束：

```cpp
struct VerletBody {
    Vector3 position;
    Vector3 previousPosition;
    Vector3 acceleration;
};

void integrateVerlet(VerletBody& body, float dt) {
    Vector3 temp = body.position;

    // x(t+dt) = 2*x(t) - x(t-dt) + a*dt^2
    body.position = 2.0f * body.position - body.previousPosition +
                    body.acceleration * dt * dt;

    body.previousPosition = temp;
}

// 需要时可以推导速度：
Vector3 getVerletVelocity(const VerletBody& body, float dt) {
    return (body.position - body.previousPosition) / dt;
}
```

### 四阶龙格-库塔（RK4）

最精确但计算开销大：

```cpp
struct State {
    Vector3 position;
    Vector3 velocity;
};

struct Derivative {
    Vector3 velocity;
    Vector3 acceleration;
};

Derivative evaluate(const State& initial, float t, float dt,
                    const Derivative& d, const Vector3& force, float mass) {
    State state;
    state.position = initial.position + d.velocity * dt;
    state.velocity = initial.velocity + d.acceleration * dt;

    Derivative output;
    output.velocity = state.velocity;
    output.acceleration = force / mass;
    return output;
}

void integrateRK4(RigidBody& body, float dt) {
    State state = { body.position, body.linearVelocity };
    Vector3 force = body.force;
    float mass = body.mass;

    Derivative a = evaluate(state, 0, 0, Derivative(), force, mass);
    Derivative b = evaluate(state, 0, dt*0.5f, a, force, mass);
    Derivative c = evaluate(state, 0, dt*0.5f, b, force, mass);
    Derivative d = evaluate(state, 0, dt, c, force, mass);

    // 导数的加权平均
    Vector3 dxdt = (a.velocity + 2.0f*(b.velocity + c.velocity) + d.velocity) / 6.0f;
    Vector3 dvdt = (a.acceleration + 2.0f*(b.acceleration + c.acceleration) +
                    d.acceleration) / 6.0f;

    body.position += dxdt * dt;
    body.linearVelocity += dvdt * dt;

    body.force = Vector3(0, 0, 0);
}
```

### 积分方法比较

| 方法 | 精度 | 稳定性 | 性能 | 使用场景 |
|------|------|--------|------|----------|
| 显式欧拉 | O(dt) | 差 | 最快 | 简单演示 |
| 半隐式欧拉 | O(dt) | 好 | 快 | 游戏（最常见） |
| Verlet | O(dt^2) | 优秀 | 快 | 布料、粒子 |
| RK4 | O(dt^4) | 好 | 慢 | 科学模拟 |

---

## 碰撞检测与响应

### 碰撞检测流水线

```
粗略阶段 -> 精确阶段 -> 接触生成 -> 响应
```

### 粗略阶段

快速排除不可能碰撞的对：

```cpp
// 轴对齐包围盒（AABB）
struct AABB {
    Vector3 min;
    Vector3 max;

    bool intersects(const AABB& other) const {
        return (min.x <= other.max.x && max.x >= other.min.x) &&
               (min.y <= other.max.y && max.y >= other.min.y) &&
               (min.z <= other.max.z && max.z >= other.min.z);
    }

    void expand(const Vector3& point) {
        min = Vector3::min(min, point);
        max = Vector3::max(max, point);
    }
};

// 空间哈希用于粗略阶段
class SpatialHash {
    float cellSize;
    std::unordered_map<uint64_t, std::vector<RigidBody*>> grid;

public:
    SpatialHash(float cellSize) : cellSize(cellSize) {}

    uint64_t hashPosition(const Vector3& pos) const {
        int x = (int)floor(pos.x / cellSize);
        int y = (int)floor(pos.y / cellSize);
        int z = (int)floor(pos.z / cellSize);

        // 组合成单个哈希
        return ((uint64_t)x * 73856093) ^
               ((uint64_t)y * 19349663) ^
               ((uint64_t)z * 83492791);
    }

    void insert(RigidBody* body) {
        AABB bounds = body->shape->getWorldBounds(body);

        // 插入所有重叠的单元格
        for (float x = bounds.min.x; x <= bounds.max.x; x += cellSize) {
            for (float y = bounds.min.y; y <= bounds.max.y; y += cellSize) {
                for (float z = bounds.min.z; z <= bounds.max.z; z += cellSize) {
                    uint64_t hash = hashPosition(Vector3(x, y, z));
                    grid[hash].push_back(body);
                }
            }
        }
    }

    std::vector<std::pair<RigidBody*, RigidBody*>> getPotentialPairs() {
        std::vector<std::pair<RigidBody*, RigidBody*>> pairs;
        std::set<std::pair<RigidBody*, RigidBody*>> seen;

        for (auto& [hash, bodies] : grid) {
            for (size_t i = 0; i < bodies.size(); ++i) {
                for (size_t j = i + 1; j < bodies.size(); ++j) {
                    auto pair = std::minmax(bodies[i], bodies[j]);
                    if (seen.find(pair) == seen.end()) {
                        seen.insert(pair);
                        pairs.push_back(pair);
                    }
                }
            }
        }
        return pairs;
    }

    void clear() {
        grid.clear();
    }
};
```

### 精确阶段 - GJK 算法

Gilbert-Johnson-Keerthi 算法用于凸形状相交：

```cpp
// 闵可夫斯基差支撑函数
Vector3 support(const ConvexShape& a, const ConvexShape& b,
                const Vector3& direction) {
    return a.getFarthestPoint(direction) - b.getFarthestPoint(-direction);
}

// 简化的 GJK
bool gjkIntersection(const ConvexShape& a, const ConvexShape& b) {
    Vector3 direction(1, 0, 0);
    std::vector<Vector3> simplex;

    // 初始点
    simplex.push_back(support(a, b, direction));
    direction = -simplex[0];

    const int maxIterations = 32;
    for (int i = 0; i < maxIterations; ++i) {
        Vector3 newPoint = support(a, b, direction);

        // 如果新点没有越过原点，则无相交
        if (newPoint.dot(direction) < 0) {
            return false;
        }

        simplex.push_back(newPoint);

        if (processSimplex(simplex, direction)) {
            return true; // 原点在单纯形内
        }
    }

    return false;
}

// 处理单纯形并更新搜索方向
bool processSimplex(std::vector<Vector3>& simplex, Vector3& direction) {
    switch (simplex.size()) {
        case 2: return processLine(simplex, direction);
        case 3: return processTriangle(simplex, direction);
        case 4: return processTetrahedron(simplex, direction);
    }
    return false;
}
```

### 接触信息

```cpp
struct Contact {
    RigidBody* bodyA;
    RigidBody* bodyB;
    Vector3 pointOnA;        // 物体 A 上的接触点（世界空间）
    Vector3 pointOnB;        // 物体 B 上的接触点（世界空间）
    Vector3 normal;          // 从 A 指向 B
    float penetrationDepth;  // 物体重叠程度

    // 求解器缓存值
    float normalMass;
    float tangentMass1;
    float tangentMass2;
    float restitution;
    float friction;

    // 冲量累加器（用于热启动）
    float normalImpulse;
    float tangentImpulse1;
    float tangentImpulse2;
};
```

### 碰撞响应 - 冲量方法

```cpp
void resolveCollision(Contact& contact) {
    RigidBody* a = contact.bodyA;
    RigidBody* b = contact.bodyB;

    // 计算接触点的相对速度
    Vector3 rA = contact.pointOnA - a->position;
    Vector3 rB = contact.pointOnB - b->position;

    Vector3 velA = a->linearVelocity + a->angularVelocity.cross(rA);
    Vector3 velB = b->linearVelocity + b->angularVelocity.cross(rB);
    Vector3 relativeVelocity = velB - velA;

    // 沿法线方向的相对速度
    float velAlongNormal = relativeVelocity.dot(contact.normal);

    // 如果物体正在分离，不解决
    if (velAlongNormal > 0) return;

    // 计算恢复系数（弹性）
    float e = std::min(a->restitution, b->restitution);

    // 计算冲量标量
    float rACrossN = rA.cross(contact.normal).dot(
        a->worldInverseInertia * rA.cross(contact.normal));
    float rBCrossN = rB.cross(contact.normal).dot(
        b->worldInverseInertia * rB.cross(contact.normal));

    float invMassSum = a->inverseMass + b->inverseMass + rACrossN + rBCrossN;

    float j = -(1.0f + e) * velAlongNormal / invMassSum;

    // 应用冲量
    Vector3 impulse = contact.normal * j;

    a->linearVelocity -= impulse * a->inverseMass;
    b->linearVelocity += impulse * b->inverseMass;

    a->angularVelocity -= a->worldInverseInertia * rA.cross(impulse);
    b->angularVelocity += b->worldInverseInertia * rB.cross(impulse);

    // 摩擦冲量
    applyFrictionImpulse(contact, relativeVelocity, j);
}

void applyFrictionImpulse(Contact& contact, const Vector3& relVel, float normalImpulse) {
    RigidBody* a = contact.bodyA;
    RigidBody* b = contact.bodyB;

    // 计算切线（摩擦）方向
    Vector3 tangent = relVel - contact.normal * relVel.dot(contact.normal);

    if (tangent.magnitudeSquared() < 0.0001f) return;
    tangent.normalize();

    // 计算摩擦冲量大小
    float frictionCoeff = sqrt(a->friction * b->friction);
    float maxFriction = frictionCoeff * abs(normalImpulse);

    // 类似法向冲量的计算
    Vector3 rA = contact.pointOnA - a->position;
    Vector3 rB = contact.pointOnB - b->position;

    float rACrossT = rA.cross(tangent).dot(
        a->worldInverseInertia * rA.cross(tangent));
    float rBCrossT = rB.cross(tangent).dot(
        b->worldInverseInertia * rB.cross(tangent));

    float invMassSum = a->inverseMass + b->inverseMass + rACrossT + rBCrossT;

    float tangentVel = relVel.dot(tangent);
    float jt = -tangentVel / invMassSum;

    // 钳制到库仑摩擦锥
    jt = std::clamp(jt, -maxFriction, maxFriction);

    // 应用摩擦冲量
    Vector3 frictionImpulse = tangent * jt;

    a->linearVelocity -= frictionImpulse * a->inverseMass;
    b->linearVelocity += frictionImpulse * b->inverseMass;

    a->angularVelocity -= a->worldInverseInertia * rA.cross(frictionImpulse);
    b->angularVelocity += b->worldInverseInertia * rB.cross(frictionImpulse);
}
```

### 位置校正（穿透解决）

```cpp
void correctPositions(Contact& contact) {
    const float slop = 0.01f;        // 允许的穿透量
    const float percent = 0.2f;       // 校正百分比

    float penetration = contact.penetrationDepth - slop;
    if (penetration <= 0) return;

    RigidBody* a = contact.bodyA;
    RigidBody* b = contact.bodyB;

    float totalInvMass = a->inverseMass + b->inverseMass;
    if (totalInvMass == 0) return;

    Vector3 correction = contact.normal * (penetration / totalInvMass) * percent;

    a->position -= correction * a->inverseMass;
    b->position += correction * b->inverseMass;
}
```

---

## 约束求解

### 什么是约束？

约束限制物体之间的相对运动。它们是关节和接触处理的基础。

### 约束公式

约束表示为：
```
C(x) = 0           （位置约束）
dC/dt = Jv = 0     （速度约束）

其中：
- C = 约束函数
- J = 雅可比矩阵
- v = 速度向量
```

### 顺序冲量求解器

游戏物理中最常见的方法：

```cpp
class ConstraintSolver {
    std::vector<Contact> contacts;
    std::vector<Joint*> joints;
    int iterations;

public:
    ConstraintSolver(int iterations = 10) : iterations(iterations) {}

    void solve(float dt) {
        // 准备约束
        for (auto& contact : contacts) {
            prepareContact(contact, dt);
        }
        for (auto* joint : joints) {
            joint->prepare(dt);
        }

        // 迭代求解
        for (int i = 0; i < iterations; ++i) {
            // 先解决关节
            for (auto* joint : joints) {
                joint->solve();
            }

            // 然后解决接触
            for (auto& contact : contacts) {
                solveContact(contact);
            }
        }
    }

private:
    void prepareContact(Contact& c, float dt) {
        RigidBody* a = c.bodyA;
        RigidBody* b = c.bodyB;

        Vector3 rA = c.pointOnA - a->position;
        Vector3 rB = c.pointOnB - b->position;

        // 计算有效质量
        Vector3 rACrossN = rA.cross(c.normal);
        Vector3 rBCrossN = rB.cross(c.normal);

        float kNormal = a->inverseMass + b->inverseMass +
            rACrossN.dot(a->worldInverseInertia * rACrossN) +
            rBCrossN.dot(b->worldInverseInertia * rBCrossN);

        c.normalMass = 1.0f / kNormal;

        // 恢复偏置
        Vector3 velA = a->linearVelocity + a->angularVelocity.cross(rA);
        Vector3 velB = b->linearVelocity + b->angularVelocity.cross(rB);
        float relVelN = (velB - velA).dot(c.normal);

        c.restitution = 0;
        if (relVelN < -1.0f) {
            c.restitution = std::min(a->restitution, b->restitution) * -relVelN;
        }
    }

    void solveContact(Contact& c) {
        RigidBody* a = c.bodyA;
        RigidBody* b = c.bodyB;

        Vector3 rA = c.pointOnA - a->position;
        Vector3 rB = c.pointOnB - b->position;

        // 接触处的相对速度
        Vector3 velA = a->linearVelocity + a->angularVelocity.cross(rA);
        Vector3 velB = b->linearVelocity + b->angularVelocity.cross(rB);
        float vn = (velB - velA).dot(c.normal);

        // 法向冲量
        float dPn = c.normalMass * (-vn + c.restitution);

        // 钳制累积冲量
        float oldImpulse = c.normalImpulse;
        c.normalImpulse = std::max(oldImpulse + dPn, 0.0f);
        dPn = c.normalImpulse - oldImpulse;

        // 应用法向冲量
        Vector3 Pn = c.normal * dPn;

        a->linearVelocity -= Pn * a->inverseMass;
        b->linearVelocity += Pn * b->inverseMass;
        a->angularVelocity -= a->worldInverseInertia * rA.cross(Pn);
        b->angularVelocity += b->worldInverseInertia * rB.cross(Pn);

        // 摩擦冲量（类似过程）
        solveFriction(c, rA, rB);
    }
};
```

### 热启动

重用上一帧的冲量以加快收敛：

```cpp
void warmStart(Contact& c) {
    if (c.normalImpulse == 0 && c.tangentImpulse1 == 0 && c.tangentImpulse2 == 0) {
        return;
    }

    RigidBody* a = c.bodyA;
    RigidBody* b = c.bodyB;

    Vector3 rA = c.pointOnA - a->position;
    Vector3 rB = c.pointOnB - b->position;

    // 应用缓存的冲量
    Vector3 P = c.normal * c.normalImpulse +
                c.tangent1 * c.tangentImpulse1 +
                c.tangent2 * c.tangentImpulse2;

    a->linearVelocity -= P * a->inverseMass;
    b->linearVelocity += P * b->inverseMass;
    a->angularVelocity -= a->worldInverseInertia * rA.cross(P);
    b->angularVelocity += b->worldInverseInertia * rB.cross(P);
}
```

---

## 关节系统

### 关节基类

```cpp
class Joint {
protected:
    RigidBody* bodyA;
    RigidBody* bodyB;
    Vector3 localAnchorA;
    Vector3 localAnchorB;

public:
    Joint(RigidBody* a, RigidBody* b,
          const Vector3& anchorA, const Vector3& anchorB)
        : bodyA(a), bodyB(b), localAnchorA(anchorA), localAnchorB(anchorB) {}

    virtual ~Joint() = default;
    virtual void prepare(float dt) = 0;
    virtual void solve() = 0;

protected:
    Vector3 getWorldAnchorA() const {
        return bodyA->transformLocalToWorld(localAnchorA);
    }

    Vector3 getWorldAnchorB() const {
        return bodyB->transformLocalToWorld(localAnchorB);
    }
};
```

### 距离关节

保持两点之间的固定距离：

```cpp
class DistanceJoint : public Joint {
    float restLength;
    float stiffness;
    float damping;

    // 求解器数据
    Vector3 normal;
    float effectiveMass;
    float bias;
    float impulse;

public:
    DistanceJoint(RigidBody* a, RigidBody* b,
                  const Vector3& anchorA, const Vector3& anchorB,
                  float stiffness = 1.0f, float damping = 0.1f)
        : Joint(a, b, anchorA, anchorB)
        , stiffness(stiffness), damping(damping), impulse(0) {

        restLength = (getWorldAnchorA() - getWorldAnchorB()).magnitude();
    }

    void prepare(float dt) override {
        Vector3 worldAnchorA = getWorldAnchorA();
        Vector3 worldAnchorB = getWorldAnchorB();

        Vector3 delta = worldAnchorB - worldAnchorA;
        float length = delta.magnitude();

        if (length < 0.0001f) {
            normal = Vector3(1, 0, 0);
        } else {
            normal = delta / length;
        }

        Vector3 rA = worldAnchorA - bodyA->position;
        Vector3 rB = worldAnchorB - bodyB->position;

        // 计算有效质量
        float rAn = rA.cross(normal).dot(bodyA->worldInverseInertia * rA.cross(normal));
        float rBn = rB.cross(normal).dot(bodyB->worldInverseInertia * rB.cross(normal));

        float invMass = bodyA->inverseMass + bodyB->inverseMass + rAn + rBn;
        effectiveMass = invMass > 0 ? 1.0f / invMass : 0;

        // 软约束（弹簧-阻尼器）
        float C = length - restLength;
        float omega = 2.0f * PI * stiffness;
        float d = 2.0f * effectiveMass * damping * omega;
        float k = effectiveMass * omega * omega;

        float gamma = 1.0f / (dt * (d + dt * k));
        bias = C * dt * k * gamma;
        effectiveMass = 1.0f / (invMass + gamma);

        // 热启动
        Vector3 P = normal * impulse;
        bodyA->linearVelocity -= P * bodyA->inverseMass;
        bodyB->linearVelocity += P * bodyB->inverseMass;
        bodyA->angularVelocity -= bodyA->worldInverseInertia * rA.cross(P);
        bodyB->angularVelocity += bodyB->worldInverseInertia * rB.cross(P);
    }

    void solve() override {
        Vector3 worldAnchorA = getWorldAnchorA();
        Vector3 worldAnchorB = getWorldAnchorB();

        Vector3 rA = worldAnchorA - bodyA->position;
        Vector3 rB = worldAnchorB - bodyB->position;

        Vector3 velA = bodyA->linearVelocity + bodyA->angularVelocity.cross(rA);
        Vector3 velB = bodyB->linearVelocity + bodyB->angularVelocity.cross(rB);

        float Cdot = (velB - velA).dot(normal);
        float lambda = -effectiveMass * (Cdot + bias);
        impulse += lambda;

        Vector3 P = normal * lambda;

        bodyA->linearVelocity -= P * bodyA->inverseMass;
        bodyB->linearVelocity += P * bodyB->inverseMass;
        bodyA->angularVelocity -= bodyA->worldInverseInertia * rA.cross(P);
        bodyB->angularVelocity += bodyB->worldInverseInertia * rB.cross(P);
    }
};
```

### 旋转关节（铰链）

允许绕单轴旋转：

```cpp
class RevoluteJoint : public Joint {
    Vector3 localAxisA;
    Vector3 localAxisB;

    // 电机
    bool enableMotor;
    float motorSpeed;
    float maxMotorTorque;

    // 限制
    bool enableLimits;
    float lowerAngle;
    float upperAngle;

    // 求解器数据
    Matrix3 effectiveMass;
    Vector3 impulse;
    float motorImpulse;
    float limitImpulse;

public:
    RevoluteJoint(RigidBody* a, RigidBody* b,
                  const Vector3& anchor, const Vector3& axis)
        : Joint(a, b, anchor, anchor)
        , enableMotor(false), enableLimits(false)
        , motorSpeed(0), maxMotorTorque(0)
        , lowerAngle(-PI), upperAngle(PI)
        , impulse(0, 0, 0), motorImpulse(0), limitImpulse(0) {

        // 将轴转换到局部空间
        localAxisA = bodyA->orientation.inverse().rotate(axis);
        localAxisB = bodyB->orientation.inverse().rotate(axis);
    }

    void setMotor(float speed, float maxTorque) {
        enableMotor = true;
        motorSpeed = speed;
        maxMotorTorque = maxTorque;
    }

    void setLimits(float lower, float upper) {
        enableLimits = true;
        lowerAngle = lower;
        upperAngle = upper;
    }

    void prepare(float dt) override {
        Vector3 worldAnchorA = getWorldAnchorA();
        Vector3 worldAnchorB = getWorldAnchorB();

        Vector3 rA = worldAnchorA - bodyA->position;
        Vector3 rB = worldAnchorB - bodyB->position;

        // 计算点约束的 3x3 有效质量
        Matrix3 K = Matrix3::zero();
        K += Matrix3::identity() * (bodyA->inverseMass + bodyB->inverseMass);
        K -= skewSymmetric(rA) * bodyA->worldInverseInertia * skewSymmetric(rA);
        K -= skewSymmetric(rB) * bodyB->worldInverseInertia * skewSymmetric(rB);

        effectiveMass = K.inverse();

        // 热启动
        bodyA->linearVelocity -= impulse * bodyA->inverseMass;
        bodyB->linearVelocity += impulse * bodyB->inverseMass;
        bodyA->angularVelocity -= bodyA->worldInverseInertia * rA.cross(impulse);
        bodyB->angularVelocity += bodyB->worldInverseInertia * rB.cross(impulse);
    }

    void solve() override {
        Vector3 worldAnchorA = getWorldAnchorA();
        Vector3 worldAnchorB = getWorldAnchorB();

        Vector3 rA = worldAnchorA - bodyA->position;
        Vector3 rB = worldAnchorB - bodyB->position;

        // 解决点约束
        Vector3 velA = bodyA->linearVelocity + bodyA->angularVelocity.cross(rA);
        Vector3 velB = bodyB->linearVelocity + bodyB->angularVelocity.cross(rB);

        Vector3 Cdot = velB - velA;
        Vector3 lambda = effectiveMass * (-Cdot);
        impulse += lambda;

        bodyA->linearVelocity -= lambda * bodyA->inverseMass;
        bodyB->linearVelocity += lambda * bodyB->inverseMass;
        bodyA->angularVelocity -= bodyA->worldInverseInertia * rA.cross(lambda);
        bodyB->angularVelocity += bodyB->worldInverseInertia * rB.cross(lambda);

        // 电机
        if (enableMotor) {
            solveMotor();
        }

        // 限制
        if (enableLimits) {
            solveLimits();
        }
    }

private:
    void solveMotor() {
        Vector3 worldAxisA = bodyA->orientation.rotate(localAxisA);

        float Cdot = (bodyB->angularVelocity - bodyA->angularVelocity).dot(worldAxisA);
        float error = Cdot - motorSpeed;

        float invI = worldAxisA.dot(bodyA->worldInverseInertia * worldAxisA) +
                     worldAxisA.dot(bodyB->worldInverseInertia * worldAxisA);
        float motorMass = invI > 0 ? 1.0f / invI : 0;

        float impulse = motorMass * (-error);

        // 钳制电机冲量
        float oldMotorImpulse = motorImpulse;
        motorImpulse = std::clamp(motorImpulse + impulse,
                                  -maxMotorTorque, maxMotorTorque);
        impulse = motorImpulse - oldMotorImpulse;

        Vector3 P = worldAxisA * impulse;
        bodyA->angularVelocity -= bodyA->worldInverseInertia * P;
        bodyB->angularVelocity += bodyB->worldInverseInertia * P;
    }
};
```

### 球窝关节

允许所有方向的旋转：

```cpp
class BallSocketJoint : public Joint {
    Matrix3 effectiveMass;
    Vector3 impulse;

public:
    BallSocketJoint(RigidBody* a, RigidBody* b, const Vector3& anchor)
        : Joint(a, b, anchor, anchor), impulse(0, 0, 0) {}

    void prepare(float dt) override {
        Vector3 rA = getWorldAnchorA() - bodyA->position;
        Vector3 rB = getWorldAnchorB() - bodyB->position;

        Matrix3 K = Matrix3::identity() * (bodyA->inverseMass + bodyB->inverseMass);
        K -= skewSymmetric(rA) * bodyA->worldInverseInertia * skewSymmetric(rA);
        K -= skewSymmetric(rB) * bodyB->worldInverseInertia * skewSymmetric(rB);

        effectiveMass = K.inverse();

        // 热启动
        bodyA->linearVelocity -= impulse * bodyA->inverseMass;
        bodyB->linearVelocity += impulse * bodyB->inverseMass;
        bodyA->angularVelocity -= bodyA->worldInverseInertia * rA.cross(impulse);
        bodyB->angularVelocity += bodyB->worldInverseInertia * rB.cross(impulse);
    }

    void solve() override {
        Vector3 rA = getWorldAnchorA() - bodyA->position;
        Vector3 rB = getWorldAnchorB() - bodyB->position;

        Vector3 velA = bodyA->linearVelocity + bodyA->angularVelocity.cross(rA);
        Vector3 velB = bodyB->linearVelocity + bodyB->angularVelocity.cross(rB);

        Vector3 Cdot = velB - velA;
        Vector3 lambda = effectiveMass * (-Cdot);
        impulse += lambda;

        bodyA->linearVelocity -= lambda * bodyA->inverseMass;
        bodyB->linearVelocity += lambda * bodyB->inverseMass;
        bodyA->angularVelocity -= bodyA->worldInverseInertia * rA.cross(lambda);
        bodyB->angularVelocity += bodyB->worldInverseInertia * rB.cross(lambda);
    }
};
```

---

## 物理引擎架构

### 主循环结构

```cpp
class PhysicsWorld {
    std::vector<RigidBody*> bodies;
    std::vector<Joint*> joints;
    std::vector<ForceGenerator*> forceGenerators;

    BroadPhase* broadPhase;
    NarrowPhase* narrowPhase;
    ConstraintSolver* solver;

    Vector3 gravity;
    float fixedTimestep;
    float accumulator;

public:
    PhysicsWorld(const Vector3& gravity = Vector3(0, -9.81f, 0))
        : gravity(gravity)
        , fixedTimestep(1.0f / 60.0f)
        , accumulator(0)
    {
        broadPhase = new SpatialHashBroadPhase(2.0f);
        narrowPhase = new GJKNarrowPhase();
        solver = new SequentialImpulseSolver(10);
    }

    void step(float deltaTime) {
        // 带累加器的固定时间步长
        accumulator += deltaTime;

        while (accumulator >= fixedTimestep) {
            fixedUpdate(fixedTimestep);
            accumulator -= fixedTimestep;
        }

        // 渲染的插值因子
        float alpha = accumulator / fixedTimestep;
        interpolateStates(alpha);
    }

private:
    void fixedUpdate(float dt) {
        // 1. 应用力
        applyForces(dt);

        // 2. 积分速度
        integrateVelocities(dt);

        // 3. 粗略阶段碰撞检测
        auto potentialPairs = broadPhase->findPairs(bodies);

        // 4. 精确阶段碰撞检测
        std::vector<Contact> contacts;
        for (auto& [a, b] : potentialPairs) {
            Contact contact;
            if (narrowPhase->testCollision(a, b, contact)) {
                contacts.push_back(contact);
            }
        }

        // 5. 求解约束（关节 + 接触）
        solver->solve(joints, contacts, dt);

        // 6. 积分位置
        integratePositions(dt);

        // 7. 位置校正
        for (auto& contact : contacts) {
            correctPositions(contact);
        }

        // 8. 更新休眠
        updateSleeping(dt);
    }

    void applyForces(float dt) {
        for (auto* body : bodies) {
            if (body->isStatic) continue;

            // 重力
            body->applyForce(gravity * body->mass);

            // 自定义力生成器
            for (auto* generator : forceGenerators) {
                generator->updateForce(body, dt);
            }
        }
    }

    void integrateVelocities(float dt) {
        for (auto* body : bodies) {
            if (body->isStatic) continue;

            // 线速度
            Vector3 linearAccel = body->force * body->inverseMass;
            body->linearVelocity += linearAccel * dt;

            // 角速度
            Matrix3 worldInvI = body->getWorldInverseInertia();
            Vector3 angularAccel = worldInvI * body->torque;
            body->angularVelocity += angularAccel * dt;

            // 清除累加器
            body->force = Vector3::zero();
            body->torque = Vector3::zero();
        }
    }

    void integratePositions(float dt) {
        for (auto* body : bodies) {
            if (body->isStatic) continue;

            // 线性位置
            body->position += body->linearVelocity * dt;

            // 角位置（四元数积分）
            Quaternion spin(0,
                body->angularVelocity.x,
                body->angularVelocity.y,
                body->angularVelocity.z);
            body->orientation += spin * body->orientation * 0.5f * dt;
            body->orientation.normalize();
        }
    }

    void updateSleeping(float dt) {
        const float sleepThreshold = 0.01f;
        const float sleepTime = 0.5f;

        for (auto* body : bodies) {
            if (body->isStatic) continue;

            float motion = body->linearVelocity.magnitudeSquared() +
                          body->angularVelocity.magnitudeSquared();

            if (motion < sleepThreshold) {
                body->sleepTimer += dt;
                if (body->sleepTimer > sleepTime) {
                    body->isAwake = false;
                    body->linearVelocity = Vector3::zero();
                    body->angularVelocity = Vector3::zero();
                }
            } else {
                body->sleepTimer = 0;
                body->isAwake = true;
            }
        }
    }
};
```

### 岛屿系统

将连接的物体分组以更高效地求解：

```cpp
class IslandManager {
public:
    struct Island {
        std::vector<RigidBody*> bodies;
        std::vector<Contact*> contacts;
        std::vector<Joint*> joints;
        bool canSleep;
    };

    std::vector<Island> buildIslands(
        std::vector<RigidBody*>& bodies,
        std::vector<Contact>& contacts,
        std::vector<Joint*>& joints)
    {
        std::vector<Island> islands;
        std::set<RigidBody*> visited;

        for (auto* body : bodies) {
            if (visited.count(body) || body->isStatic) continue;

            Island island;
            std::queue<RigidBody*> queue;
            queue.push(body);

            while (!queue.empty()) {
                RigidBody* current = queue.front();
                queue.pop();

                if (visited.count(current)) continue;
                visited.insert(current);

                if (!current->isStatic) {
                    island.bodies.push_back(current);
                }

                // 通过接触添加连接的物体
                for (auto& contact : contacts) {
                    if (contact.bodyA == current && !visited.count(contact.bodyB)) {
                        queue.push(contact.bodyB);
                        island.contacts.push_back(&contact);
                    } else if (contact.bodyB == current && !visited.count(contact.bodyA)) {
                        queue.push(contact.bodyA);
                        island.contacts.push_back(&contact);
                    }
                }

                // 通过关节添加连接的物体
                for (auto* joint : joints) {
                    if (joint->bodyA == current && !visited.count(joint->bodyB)) {
                        queue.push(joint->bodyB);
                        island.joints.push_back(joint);
                    } else if (joint->bodyB == current && !visited.count(joint->bodyA)) {
                        queue.push(joint->bodyA);
                        island.joints.push_back(joint);
                    }
                }
            }

            if (!island.bodies.empty()) {
                islands.push_back(island);
            }
        }

        return islands;
    }
};
```

---

## Box2D 集成示例

Box2D 是最流行的 2D 物理引擎。以下是如何使用它：

```cpp
#include <box2d/box2d.h>

class Box2DWorld {
    b2World* world;
    std::vector<b2Body*> bodies;

public:
    Box2DWorld() {
        b2Vec2 gravity(0.0f, -10.0f);
        world = new b2World(gravity);
    }

    ~Box2DWorld() {
        delete world;
    }

    // 创建动态盒子
    b2Body* createBox(float x, float y, float width, float height,
                      float density = 1.0f) {
        // 物体定义
        b2BodyDef bodyDef;
        bodyDef.type = b2_dynamicBody;
        bodyDef.position.Set(x, y);

        b2Body* body = world->CreateBody(&bodyDef);

        // 形状
        b2PolygonShape shape;
        shape.SetAsBox(width / 2.0f, height / 2.0f);

        // 夹具
        b2FixtureDef fixtureDef;
        fixtureDef.shape = &shape;
        fixtureDef.density = density;
        fixtureDef.friction = 0.3f;
        fixtureDef.restitution = 0.5f;

        body->CreateFixture(&fixtureDef);
        bodies.push_back(body);

        return body;
    }

    // 创建静态地面
    b2Body* createGround(float x, float y, float width, float height) {
        b2BodyDef bodyDef;
        bodyDef.position.Set(x, y);

        b2Body* body = world->CreateBody(&bodyDef);

        b2PolygonShape shape;
        shape.SetAsBox(width / 2.0f, height / 2.0f);

        body->CreateFixture(&shape, 0.0f);

        return body;
    }

    // 创建圆形
    b2Body* createCircle(float x, float y, float radius, float density = 1.0f) {
        b2BodyDef bodyDef;
        bodyDef.type = b2_dynamicBody;
        bodyDef.position.Set(x, y);

        b2Body* body = world->CreateBody(&bodyDef);

        b2CircleShape shape;
        shape.m_radius = radius;

        b2FixtureDef fixtureDef;
        fixtureDef.shape = &shape;
        fixtureDef.density = density;
        fixtureDef.friction = 0.3f;
        fixtureDef.restitution = 0.6f;

        body->CreateFixture(&fixtureDef);
        bodies.push_back(body);

        return body;
    }

    // 创建旋转关节
    b2Joint* createRevoluteJoint(b2Body* bodyA, b2Body* bodyB,
                                  const b2Vec2& anchor) {
        b2RevoluteJointDef jointDef;
        jointDef.Initialize(bodyA, bodyB, anchor);
        jointDef.enableMotor = false;
        jointDef.enableLimit = false;

        return world->CreateJoint(&jointDef);
    }

    // 创建距离关节
    b2Joint* createDistanceJoint(b2Body* bodyA, b2Body* bodyB,
                                  const b2Vec2& anchorA, const b2Vec2& anchorB) {
        b2DistanceJointDef jointDef;
        jointDef.Initialize(bodyA, bodyB, anchorA, anchorB);
        jointDef.stiffness = 30.0f;
        jointDef.damping = 5.0f;

        return world->CreateJoint(&jointDef);
    }

    // 步进模拟
    void step(float dt) {
        int velocityIterations = 8;
        int positionIterations = 3;
        world->Step(dt, velocityIterations, positionIterations);
    }

    // 对物体施加力
    void applyForce(b2Body* body, float fx, float fy) {
        body->ApplyForceToCenter(b2Vec2(fx, fy), true);
    }

    // 施加冲量
    void applyImpulse(b2Body* body, float ix, float iy) {
        body->ApplyLinearImpulseToCenter(b2Vec2(ix, iy), true);
    }
};
```

### Box2D 与 JavaScript（matter.js 风格）

```javascript
// 使用 planck.js（Box2D 移植到 JavaScript）
import { World, Vec2, Box, Circle, RevoluteJoint } from 'planck';

class PhysicsGame {
    constructor() {
        // 创建带重力的世界
        this.world = new World({
            gravity: Vec2(0, -10)
        });

        this.bodies = [];
        this.setupScene();
    }

    setupScene() {
        // 地面
        const ground = this.world.createBody();
        ground.createFixture({
            shape: Box(20, 0.5),
            friction: 0.5
        });

        // 动态盒子
        for (let i = 0; i < 10; i++) {
            this.createBox(
                Math.random() * 10 - 5,
                5 + i * 2,
                1, 1
            );
        }

        // 钟摆
        this.createPendulum(0, 10, 5);
    }

    createBox(x, y, width, height) {
        const body = this.world.createDynamicBody({
            position: Vec2(x, y)
        });

        body.createFixture({
            shape: Box(width / 2, height / 2),
            density: 1.0,
            friction: 0.3,
            restitution: 0.5
        });

        this.bodies.push(body);
        return body;
    }

    createCircle(x, y, radius) {
        const body = this.world.createDynamicBody({
            position: Vec2(x, y)
        });

        body.createFixture({
            shape: Circle(radius),
            density: 1.0,
            friction: 0.3,
            restitution: 0.8
        });

        this.bodies.push(body);
        return body;
    }

    createPendulum(x, y, length) {
        // 锚点（静态）
        const anchor = this.world.createBody({
            position: Vec2(x, y)
        });

        // 摆锤（动态）
        const bob = this.createCircle(x, y - length, 0.5);

        // 关节
        this.world.createJoint(RevoluteJoint({}, anchor, bob, Vec2(x, y)));

        return { anchor, bob };
    }

    update(dt) {
        // 固定时间步长
        this.world.step(1 / 60, 8, 3);
    }

    render(ctx) {
        for (const body of this.world.getBodyList()) {
            const pos = body.getPosition();
            const angle = body.getAngle();

            ctx.save();
            ctx.translate(pos.x * 50, pos.y * -50 + 400);
            ctx.rotate(-angle);

            for (let fixture = body.getFixtureList(); fixture;
                 fixture = fixture.getNext()) {
                const shape = fixture.getShape();

                ctx.fillStyle = body.isDynamic() ? '#3498db' : '#2c3e50';

                if (shape.getType() === 'polygon') {
                    ctx.beginPath();
                    const vertices = shape.m_vertices;
                    ctx.moveTo(vertices[0].x * 50, vertices[0].y * -50);
                    for (let i = 1; i < vertices.length; i++) {
                        ctx.lineTo(vertices[i].x * 50, vertices[i].y * -50);
                    }
                    ctx.closePath();
                    ctx.fill();
                } else if (shape.getType() === 'circle') {
                    ctx.beginPath();
                    ctx.arc(0, 0, shape.getRadius() * 50, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        }
    }
}
```

---

## NVIDIA PhysX 集成

PhysX 是许多 AAA 游戏使用的专业 3D 物理引擎：

```cpp
#include <PxPhysicsAPI.h>

using namespace physx;

class PhysXWorld {
    PxDefaultAllocator allocator;
    PxDefaultErrorCallback errorCallback;
    PxFoundation* foundation;
    PxPhysics* physics;
    PxScene* scene;
    PxMaterial* defaultMaterial;
    PxPvd* pvd;

public:
    PhysXWorld() {
        // 初始化基础
        foundation = PxCreateFoundation(PX_PHYSICS_VERSION, allocator, errorCallback);

        // 可视调试器（可选）
        pvd = PxCreatePvd(*foundation);
        PxPvdTransport* transport = PxDefaultPvdSocketTransportCreate("127.0.0.1", 5425, 10);
        pvd->connect(*transport, PxPvdInstrumentationFlag::eALL);

        // 创建物理
        physics = PxCreatePhysics(PX_PHYSICS_VERSION, *foundation, PxTolerancesScale(), true, pvd);

        // 创建场景
        PxSceneDesc sceneDesc(physics->getTolerancesScale());
        sceneDesc.gravity = PxVec3(0.0f, -9.81f, 0.0f);
        sceneDesc.cpuDispatcher = PxDefaultCpuDispatcherCreate(2);
        sceneDesc.filterShader = PxDefaultSimulationFilterShader;
        scene = physics->createScene(sceneDesc);

        // 默认材质
        defaultMaterial = physics->createMaterial(0.5f, 0.5f, 0.6f);
    }

    ~PhysXWorld() {
        scene->release();
        physics->release();
        if (pvd) {
            PxPvdTransport* transport = pvd->getTransport();
            pvd->release();
            transport->release();
        }
        foundation->release();
    }

    // 创建动态刚体
    PxRigidDynamic* createDynamicBox(const PxVec3& position,
                                      const PxVec3& halfExtents,
                                      float density = 10.0f) {
        PxTransform transform(position);
        PxRigidDynamic* body = physics->createRigidDynamic(transform);

        PxShape* shape = physics->createShape(
            PxBoxGeometry(halfExtents), *defaultMaterial);
        body->attachShape(*shape);
        shape->release();

        PxRigidBodyExt::updateMassAndInertia(*body, density);
        scene->addActor(*body);

        return body;
    }

    // 创建静态刚体
    PxRigidStatic* createStaticBox(const PxVec3& position,
                                    const PxVec3& halfExtents) {
        PxTransform transform(position);
        PxRigidStatic* body = physics->createRigidStatic(transform);

        PxShape* shape = physics->createShape(
            PxBoxGeometry(halfExtents), *defaultMaterial);
        body->attachShape(*shape);
        shape->release();

        scene->addActor(*body);

        return body;
    }

    // 创建球体
    PxRigidDynamic* createDynamicSphere(const PxVec3& position,
                                         float radius,
                                         float density = 10.0f) {
        PxTransform transform(position);
        PxRigidDynamic* body = physics->createRigidDynamic(transform);

        PxShape* shape = physics->createShape(
            PxSphereGeometry(radius), *defaultMaterial);
        body->attachShape(*shape);
        shape->release();

        PxRigidBodyExt::updateMassAndInertia(*body, density);
        scene->addActor(*body);

        return body;
    }

    // 步进模拟
    void step(float dt) {
        scene->simulate(dt);
        scene->fetchResults(true);
    }

    // 射线检测
    bool raycast(const PxVec3& origin, const PxVec3& direction,
                 float maxDistance, PxRaycastBuffer& hit) {
        return scene->raycast(origin, direction, maxDistance, hit);
    }
};
```

---

## 性能优化

### 休眠物体

静止的物体应停止模拟：

```cpp
void updateSleepState(RigidBody& body, float dt) {
    const float linearSleepThreshold = 0.01f;
    const float angularSleepThreshold = 0.01f;
    const float sleepTimeThreshold = 0.5f;

    float linearMotion = body.linearVelocity.magnitudeSquared();
    float angularMotion = body.angularVelocity.magnitudeSquared();

    if (linearMotion < linearSleepThreshold &&
        angularMotion < angularSleepThreshold) {
        body.sleepTime += dt;

        if (body.sleepTime > sleepTimeThreshold) {
            body.isSleeping = true;
            body.linearVelocity = Vector3::zero();
            body.angularVelocity = Vector3::zero();
        }
    } else {
        body.sleepTime = 0;
        body.isSleeping = false;
    }
}
```

### 连续碰撞检测（CCD）

防止快速移动的物体穿透薄物体：

```cpp
bool sweepTest(const RigidBody& body, const Vector3& displacement,
               float& toi, Contact& contact) {
    // 保守推进
    const int maxIterations = 10;
    float t = 0;

    for (int i = 0; i < maxIterations; i++) {
        // 将物体移动到插值位置
        Vector3 pos = body.position + displacement * t;

        // 检查碰撞
        float distance = computeClosestDistance(body.shape, pos, otherBodies);

        if (distance < 0.001f) {
            toi = t;
            // 生成接触信息
            return true;
        }

        // 按安全距离推进
        float step = distance / displacement.magnitude();
        t += step;

        if (t >= 1.0f) break;
    }

    return false;
}
```

### 多线程

并行粗略阶段和岛屿求解：

```cpp
class ParallelPhysics {
    ThreadPool pool;

public:
    void solveIslandsParallel(std::vector<Island>& islands, float dt) {
        std::vector<std::future<void>> futures;

        for (auto& island : islands) {
            futures.push_back(pool.enqueue([&island, dt]() {
                solveIsland(island, dt);
            }));
        }

        // 等待所有岛屿
        for (auto& future : futures) {
            future.wait();
        }
    }

    void broadPhaseParallel(std::vector<RigidBody*>& bodies) {
        // 并行 AABB 更新
        pool.parallelFor(0, bodies.size(), [&](size_t i) {
            bodies[i]->updateAABB();
        });

        // 并行构建空间哈希
        // ...
    }
};
```

---

## 常见陷阱和解决方案

### 不稳定的堆叠

**问题**：堆叠的物体抖动或坍塌。

**解决方案**：
```cpp
// 1. 增加求解器迭代次数
solver.setIterations(20); // 默认通常是 10

// 2. 使用接触缓存和热启动
contact.warmStart();

// 3. 添加位置稳定
const float stabilization = 0.2f;
body.position += error * stabilization;

// 4. 使用适当的质量比（避免 > 10:1）
```

### 穿透

**问题**：快速物体穿过薄物体。

**解决方案**：
```cpp
// 1. 启用 CCD
body.ccdEnabled = true;
body.ccdRadius = 0.1f;

// 2. 使用扫掠碰撞
if (body.linearVelocity.magnitude() * dt > body.shape.minExtent()) {
    performSweptCollision(body);
}

// 3. 限制最大速度
body.linearVelocity = clamp(body.linearVelocity, -maxVel, maxVel);
```

### 抖动的接触

**问题**：物体在表面上静止时抖动。

**解决方案**：
```cpp
// 1. 实现休眠
if (body.motion < threshold && body.sleepTimer > 0.5f) {
    body.sleep();
}

// 2. 添加接触容差
const float slop = 0.01f;
if (penetration < slop) return; // 忽略小穿透

// 3. 使用速度阈值用于恢复
if (relativeVelocity < 1.0f) {
    restitution = 0; // 慢速碰撞不弹跳
}
```

---

## 面试问题

### 基础

**Q1：冲量和力的区别是什么？**

```
力：持续施加一段时间
- F = m * a
- 产生加速度
- 积分：a -> v -> x 经过 dt

冲量：瞬时施加
- J = F * dt = m * delta_v
- 产生即时速度变化
- 用于碰撞响应
```

**Q2：解释惯性张量。**

```
惯性张量是描述质量在刚体中如何分布的 3x3 矩阵。
- 对角元素：关于主轴的转动惯量
- 非对角元素：惯性积（轴间耦合）
- 必须变换到世界空间：I_world = R * I_local * R^T
- 影响绕不同轴旋转的阻力
```

**Q3：为什么使用四元数而不是欧拉角？**

```
四元数：
+ 没有万向节锁
+ 平滑插值（SLERP）
+ 旋转组合高效
+ 数值积分稳定
- 不太直观

欧拉角：
+ 人类可读
- 万向节锁问题
- 顺序依赖
- 插值问题
```

### 实现

**Q4：解释顺序冲量求解器。**

```
1. 将约束转换为速度形式：J * v = b
2. 对于每个约束，计算冲量：lambda = -K * (J*v - b)
3. 钳制冲量（例如，法向 >= 0，摩擦在锥内）
4. 将冲量应用到物体
5. 重复 N 次迭代

优点：
- 实现简单
- 自然处理不等式约束
- 热启动改善收敛
```

**Q5：什么是热启动？**

```
重用上一帧的约束冲量作为初始猜测。

优点：
- 更快收敛（通常减少 2-3 倍迭代）
- 更稳定的堆叠行为
- 更平滑的接触处理

实现：
- 缓存每个接触对的冲量
- 识别帧间持久接触
- 在迭代求解前应用缓存的冲量
```

### 优化

**Q6：如何优化多物体的物理引擎？**

```
1. 空间分区用于粗略阶段（网格、八叉树、BVH）
2. 岛屿系统 - 分别求解断开的组
3. 休眠 - 停用静止物体
4. 细节层次 - 远处物体使用简化碰撞
5. 并行求解独立岛屿
6. SIMD 用于数学运算
7. 持久接触缓存
8. 固定时间步长与渲染插值
```

---

## 延伸阅读

### 书籍

- "Game Physics Engine Development" - Ian Millington
- "Real-Time Collision Detection" - Christer Ericson
- "Physics for Game Developers" - David M. Bourg

### 论文

- "Iterative Dynamics with Temporal Coherence" - Erin Catto（Box2D 作者）
- "A Unified Framework for Rigid Body Dynamics" - Baraff
- "Real-Time Rigid Body Simulation on GPUs" - NVIDIA

### 开源引擎

- **Box2D**：2D 物理，广泛用于游戏
- **Bullet**：3D 物理，开源
- **PhysX**：NVIDIA 的专业引擎（免费）
- **Jolt Physics**：现代 C++ 物理库
- **Rapier**：Rust 物理引擎，带 JS 绑定

### 在线资源

- [Box2D 文档](https://box2d.org/documentation/)
- [Bullet Physics 手册](https://pybullet.org/Bullet/BulletFull/index.html)
- [游戏物理教程系列](https://gafferongames.com/categories/game-physics/)
- [Allen Chou 的物理博客](https://allenchou.net/category/physics/)

---

## 总结

刚体动力学构成游戏物理模拟的基础。关键要点：

1. **状态表示**：位置、朝向、速度和质量属性
2. **运动方程**：线性和角运动的牛顿定律
3. **积分**：半隐式欧拉是游戏中最常见的选择
4. **碰撞检测**：粗略阶段过滤后进行精确阶段测试
5. **碰撞响应**：带摩擦处理的基于冲量的方法
6. **约束**：带热启动的顺序冲量求解器
7. **关节**：不同机械连接的各种约束类型
8. **优化**：休眠、岛屿、CCD 和并行化

理解这些基础使你能够有效地使用 Box2D 和 PhysX 等物理引擎，甚至为特殊需求实现自己的物理系统。
