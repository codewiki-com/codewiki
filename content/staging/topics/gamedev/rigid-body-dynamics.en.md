---
title: Rigid Body Dynamics and Physics Simulation
description: "Understanding game physics engine core: forces, torques, constraint solving, and joints"
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - rigid body
  - physics simulation
  - constraints
  - joints
status: imported
origin: old/src/content/docs/gamedev/rigid-body-dynamics.en.md
divergence: 0.2
issues: []
legacy:
  category: GameDev
  subcategory: Physics
  order: 15
  lastUpdated: 2026-01-07
---

## Concept Overview

Rigid body dynamics is the foundation of physics simulation in games, simulations, and virtual environments. A **rigid body** is an idealization of a solid object that does not deform under the application of force - the distance between any two points on the body remains constant regardless of external forces.

### Why Rigid Body Physics?

In game development, realistic physics simulation creates immersive experiences:

1. **Believable Interactions**: Objects fall, collide, and stack naturally
2. **Emergent Gameplay**: Physics-based puzzles and mechanics
3. **Visual Realism**: Ragdoll effects, vehicle dynamics, destruction
4. **Reduced Animation Work**: Let physics handle secondary motion

### Historical Context

Physics engines evolved from simple arcade physics (Pong, 1972) to sophisticated simulations:

- **1990s**: Early game physics with basic collision detection
- **2000s**: Havok, PhysX revolutionized real-time physics
- **2010s**: Box2D, Bullet became industry standards
- **Present**: GPU-accelerated physics, machine learning integration

---

## Core Concepts

### State of a Rigid Body

A rigid body's state at any time is defined by:

```
Position & Orientation:
- Position vector: x = (x, y, z)
- Orientation: quaternion q or rotation matrix R

Linear & Angular Motion:
- Linear velocity: v = dx/dt
- Angular velocity: omega (w)

Mass Properties:
- Mass: m (scalar)
- Inertia tensor: I (3x3 matrix)
```

### The Rigid Body State Structure

```cpp
struct RigidBody {
    // Position and orientation
    Vector3 position;
    Quaternion orientation;

    // Linear dynamics
    Vector3 linearVelocity;
    Vector3 force;          // Accumulated forces
    float mass;
    float inverseMass;      // 1/mass (0 for static objects)

    // Angular dynamics
    Vector3 angularVelocity;
    Vector3 torque;         // Accumulated torques
    Matrix3 inertia;        // Inertia tensor in local space
    Matrix3 inverseInertia; // Inverse inertia tensor

    // Material properties
    float restitution;      // Bounciness (0-1)
    float friction;         // Surface friction

    // Collision shape
    CollisionShape* shape;

    // Flags
    bool isStatic;
    bool isAwake;
};
```

---

## Equations of Motion

### Newton's Second Law

The fundamental equations governing rigid body motion:

**Linear Motion:**
```
F = m * a
a = F / m

Where:
- F = total force
- m = mass
- a = linear acceleration
```

**Angular Motion:**
```
T = I * alpha
alpha = I^(-1) * T

Where:
- T = total torque
- I = inertia tensor
- alpha = angular acceleration
```

### Inertia Tensor

The inertia tensor describes how mass is distributed in a rigid body and affects its resistance to rotation:

```cpp
// Common inertia tensors for primitive shapes

// Solid sphere (radius r, mass m)
Matrix3 sphereInertia(float mass, float radius) {
    float I = (2.0f / 5.0f) * mass * radius * radius;
    return Matrix3(
        I, 0, 0,
        0, I, 0,
        0, 0, I
    );
}

// Solid box (width w, height h, depth d, mass m)
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

// Solid cylinder (radius r, height h, mass m) - aligned with Y axis
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

### World Space Inertia

The inertia tensor must be transformed to world space each frame:

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

## Forces and Torques

### Applying Forces

Forces can be applied at different points on a rigid body:

```cpp
class RigidBody {
public:
    // Apply force at center of mass (no torque)
    void applyForce(const Vector3& force) {
        this->force += force;
    }

    // Apply force at a world point (generates torque)
    void applyForceAtPoint(const Vector3& force, const Vector3& worldPoint) {
        this->force += force;

        // Torque = r x F (cross product)
        Vector3 r = worldPoint - position;
        this->torque += r.cross(force);
    }

    // Apply force at a local point
    void applyForceAtLocalPoint(const Vector3& force, const Vector3& localPoint) {
        Vector3 worldPoint = transformLocalToWorld(localPoint);
        applyForceAtPoint(force, worldPoint);
    }

    // Apply torque directly
    void applyTorque(const Vector3& torque) {
        this->torque += torque;
    }

    // Apply impulse (instantaneous force)
    void applyImpulse(const Vector3& impulse) {
        linearVelocity += impulse * inverseMass;
    }

    // Apply impulse at a point
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

### Common Forces

```cpp
class ForceGenerator {
public:
    virtual void updateForce(RigidBody* body, float dt) = 0;
};

// Gravity force
class GravityForce : public ForceGenerator {
    Vector3 gravity;
public:
    GravityForce(const Vector3& g = Vector3(0, -9.81f, 0)) : gravity(g) {}

    void updateForce(RigidBody* body, float dt) override {
        if (body->inverseMass == 0) return; // Skip static objects
        body->applyForce(gravity * body->mass);
    }
};

// Spring force (Hooke's Law)
class SpringForce : public ForceGenerator {
    RigidBody* other;
    Vector3 localAnchor;      // Attachment point on this body
    Vector3 otherLocalAnchor; // Attachment point on other body
    float stiffness;          // Spring constant (k)
    float restLength;         // Natural length
    float damping;            // Damping coefficient

public:
    void updateForce(RigidBody* body, float dt) override {
        // Get world positions of attachment points
        Vector3 worldAnchor = body->transformLocalToWorld(localAnchor);
        Vector3 otherWorldAnchor = other->transformLocalToWorld(otherLocalAnchor);

        // Calculate spring vector
        Vector3 springVector = worldAnchor - otherWorldAnchor;
        float length = springVector.magnitude();

        if (length == 0) return;

        Vector3 direction = springVector / length;

        // Hooke's Law: F = -k * (x - x0)
        float displacement = length - restLength;
        float forceMagnitude = -stiffness * displacement;

        // Add damping
        Vector3 relativeVelocity = body->getVelocityAtPoint(worldAnchor) -
                                   other->getVelocityAtPoint(otherWorldAnchor);
        float dampingForce = -damping * relativeVelocity.dot(direction);

        Vector3 force = direction * (forceMagnitude + dampingForce);
        body->applyForceAtPoint(force, worldAnchor);
    }
};

// Drag force (air resistance)
class DragForce : public ForceGenerator {
    float linearDrag;
    float angularDrag;

public:
    DragForce(float linear = 0.01f, float angular = 0.01f)
        : linearDrag(linear), angularDrag(angular) {}

    void updateForce(RigidBody* body, float dt) override {
        // Linear drag: F = -k * v
        Vector3 linearDragForce = -body->linearVelocity * linearDrag;
        body->applyForce(linearDragForce);

        // Angular drag: T = -k * omega
        Vector3 angularDragTorque = -body->angularVelocity * angularDrag;
        body->applyTorque(angularDragTorque);
    }
};
```

---

## Numerical Integration

### The Integration Problem

Physics simulation advances state over discrete time steps:

```
Given: Current state (position, velocity)
Find: State at time t + dt
```

### Explicit Euler Integration

The simplest but least stable method:

```cpp
void integrateEuler(RigidBody& body, float dt) {
    // Skip static objects
    if (body.inverseMass == 0) return;

    // Linear integration
    Vector3 linearAcceleration = body.force * body.inverseMass;
    body.linearVelocity += linearAcceleration * dt;
    body.position += body.linearVelocity * dt;

    // Angular integration
    Matrix3 worldInverseInertia = computeWorldInverseInertia(body);
    Vector3 angularAcceleration = worldInverseInertia * body.torque;
    body.angularVelocity += angularAcceleration * dt;

    // Quaternion integration
    Quaternion spin(0,
        body.angularVelocity.x,
        body.angularVelocity.y,
        body.angularVelocity.z
    );
    body.orientation += spin * body.orientation * 0.5f * dt;
    body.orientation.normalize();

    // Clear accumulators
    body.force = Vector3(0, 0, 0);
    body.torque = Vector3(0, 0, 0);

    // Apply damping
    body.linearVelocity *= pow(0.99f, dt);
    body.angularVelocity *= pow(0.99f, dt);
}
```

### Semi-Implicit Euler (Symplectic Euler)

More stable than explicit Euler - updates velocity first, then position:

```cpp
void integrateSemiImplicitEuler(RigidBody& body, float dt) {
    if (body.inverseMass == 0) return;

    // Update velocities first
    Vector3 linearAcceleration = body.force * body.inverseMass;
    body.linearVelocity += linearAcceleration * dt;

    Matrix3 worldInverseInertia = computeWorldInverseInertia(body);
    Vector3 angularAcceleration = worldInverseInertia * body.torque;
    body.angularVelocity += angularAcceleration * dt;

    // Then update positions using new velocities
    body.position += body.linearVelocity * dt;

    Quaternion spin(0,
        body.angularVelocity.x,
        body.angularVelocity.y,
        body.angularVelocity.z
    );
    body.orientation += spin * body.orientation * 0.5f * dt;
    body.orientation.normalize();

    // Clear accumulators
    body.force = Vector3(0, 0, 0);
    body.torque = Vector3(0, 0, 0);
}
```

### Verlet Integration

Excellent for position-based constraints:

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

// Velocity can be derived when needed:
Vector3 getVerletVelocity(const VerletBody& body, float dt) {
    return (body.position - body.previousPosition) / dt;
}
```

### Runge-Kutta 4 (RK4)

Most accurate but computationally expensive:

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

    // Weighted average of derivatives
    Vector3 dxdt = (a.velocity + 2.0f*(b.velocity + c.velocity) + d.velocity) / 6.0f;
    Vector3 dvdt = (a.acceleration + 2.0f*(b.acceleration + c.acceleration) +
                    d.acceleration) / 6.0f;

    body.position += dxdt * dt;
    body.linearVelocity += dvdt * dt;

    body.force = Vector3(0, 0, 0);
}
```

### Integration Method Comparison

| Method | Accuracy | Stability | Performance | Use Case |
|--------|----------|-----------|-------------|----------|
| Explicit Euler | O(dt) | Poor | Fastest | Simple demos |
| Semi-Implicit Euler | O(dt) | Good | Fast | Games (most common) |
| Verlet | O(dt^2) | Excellent | Fast | Cloth, particles |
| RK4 | O(dt^4) | Good | Slow | Scientific simulation |

---

## Collision Detection and Response

### Collision Detection Pipeline

```
Broad Phase -> Narrow Phase -> Contact Generation -> Response
```

### Broad Phase

Quickly eliminates pairs that cannot possibly collide:

```cpp
// Axis-Aligned Bounding Box (AABB)
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

// Spatial Hashing for broad phase
class SpatialHash {
    float cellSize;
    std::unordered_map<uint64_t, std::vector<RigidBody*>> grid;

public:
    SpatialHash(float cellSize) : cellSize(cellSize) {}

    uint64_t hashPosition(const Vector3& pos) const {
        int x = (int)floor(pos.x / cellSize);
        int y = (int)floor(pos.y / cellSize);
        int z = (int)floor(pos.z / cellSize);

        // Combine into single hash
        return ((uint64_t)x * 73856093) ^
               ((uint64_t)y * 19349663) ^
               ((uint64_t)z * 83492791);
    }

    void insert(RigidBody* body) {
        AABB bounds = body->shape->getWorldBounds(body);

        // Insert into all overlapping cells
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

### Narrow Phase - GJK Algorithm

Gilbert-Johnson-Keerthi algorithm for convex shape intersection:

```cpp
// Minkowski difference support function
Vector3 support(const ConvexShape& a, const ConvexShape& b,
                const Vector3& direction) {
    return a.getFarthestPoint(direction) - b.getFarthestPoint(-direction);
}

// Simplified GJK
bool gjkIntersection(const ConvexShape& a, const ConvexShape& b) {
    Vector3 direction(1, 0, 0);
    std::vector<Vector3> simplex;

    // Initial point
    simplex.push_back(support(a, b, direction));
    direction = -simplex[0];

    const int maxIterations = 32;
    for (int i = 0; i < maxIterations; ++i) {
        Vector3 newPoint = support(a, b, direction);

        // If new point didn't pass origin, no intersection
        if (newPoint.dot(direction) < 0) {
            return false;
        }

        simplex.push_back(newPoint);

        if (processSimplex(simplex, direction)) {
            return true; // Origin is inside simplex
        }
    }

    return false;
}

// Process simplex and update search direction
bool processSimplex(std::vector<Vector3>& simplex, Vector3& direction) {
    switch (simplex.size()) {
        case 2: return processLine(simplex, direction);
        case 3: return processTriangle(simplex, direction);
        case 4: return processTetrahedron(simplex, direction);
    }
    return false;
}
```

### Contact Information

```cpp
struct Contact {
    RigidBody* bodyA;
    RigidBody* bodyB;
    Vector3 pointOnA;        // Contact point on body A (world space)
    Vector3 pointOnB;        // Contact point on body B (world space)
    Vector3 normal;          // From A to B
    float penetrationDepth;  // How much objects overlap

    // Cached values for solver
    float normalMass;
    float tangentMass1;
    float tangentMass2;
    float restitution;
    float friction;

    // Impulse accumulators (for warm starting)
    float normalImpulse;
    float tangentImpulse1;
    float tangentImpulse2;
};
```

### Collision Response - Impulse Method

```cpp
void resolveCollision(Contact& contact) {
    RigidBody* a = contact.bodyA;
    RigidBody* b = contact.bodyB;

    // Calculate relative velocity at contact point
    Vector3 rA = contact.pointOnA - a->position;
    Vector3 rB = contact.pointOnB - b->position;

    Vector3 velA = a->linearVelocity + a->angularVelocity.cross(rA);
    Vector3 velB = b->linearVelocity + b->angularVelocity.cross(rB);
    Vector3 relativeVelocity = velB - velA;

    // Relative velocity along normal
    float velAlongNormal = relativeVelocity.dot(contact.normal);

    // Don't resolve if objects are separating
    if (velAlongNormal > 0) return;

    // Calculate restitution (bounciness)
    float e = std::min(a->restitution, b->restitution);

    // Calculate impulse scalar
    float rACrossN = rA.cross(contact.normal).dot(
        a->worldInverseInertia * rA.cross(contact.normal));
    float rBCrossN = rB.cross(contact.normal).dot(
        b->worldInverseInertia * rB.cross(contact.normal));

    float invMassSum = a->inverseMass + b->inverseMass + rACrossN + rBCrossN;

    float j = -(1.0f + e) * velAlongNormal / invMassSum;

    // Apply impulse
    Vector3 impulse = contact.normal * j;

    a->linearVelocity -= impulse * a->inverseMass;
    b->linearVelocity += impulse * b->inverseMass;

    a->angularVelocity -= a->worldInverseInertia * rA.cross(impulse);
    b->angularVelocity += b->worldInverseInertia * rB.cross(impulse);

    // Friction impulse
    applyFrictionImpulse(contact, relativeVelocity, j);
}

void applyFrictionImpulse(Contact& contact, const Vector3& relVel, float normalImpulse) {
    RigidBody* a = contact.bodyA;
    RigidBody* b = contact.bodyB;

    // Calculate tangent (friction) direction
    Vector3 tangent = relVel - contact.normal * relVel.dot(contact.normal);

    if (tangent.magnitudeSquared() < 0.0001f) return;
    tangent.normalize();

    // Calculate friction impulse magnitude
    float frictionCoeff = sqrt(a->friction * b->friction);
    float maxFriction = frictionCoeff * abs(normalImpulse);

    // Similar calculation as normal impulse
    Vector3 rA = contact.pointOnA - a->position;
    Vector3 rB = contact.pointOnB - b->position;

    float rACrossT = rA.cross(tangent).dot(
        a->worldInverseInertia * rA.cross(tangent));
    float rBCrossT = rB.cross(tangent).dot(
        b->worldInverseInertia * rB.cross(tangent));

    float invMassSum = a->inverseMass + b->inverseMass + rACrossT + rBCrossT;

    float tangentVel = relVel.dot(tangent);
    float jt = -tangentVel / invMassSum;

    // Clamp to Coulomb friction cone
    jt = std::clamp(jt, -maxFriction, maxFriction);

    // Apply friction impulse
    Vector3 frictionImpulse = tangent * jt;

    a->linearVelocity -= frictionImpulse * a->inverseMass;
    b->linearVelocity += frictionImpulse * b->inverseMass;

    a->angularVelocity -= a->worldInverseInertia * rA.cross(frictionImpulse);
    b->angularVelocity += b->worldInverseInertia * rB.cross(frictionImpulse);
}
```

### Position Correction (Penetration Resolution)

```cpp
void correctPositions(Contact& contact) {
    const float slop = 0.01f;        // Allowed penetration
    const float percent = 0.2f;       // Correction percentage

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

## Constraint Solving

### What are Constraints?

Constraints restrict the relative motion between bodies. They form the basis of joints and contact handling.

### Constraint Formulation

A constraint is expressed as:
```
C(x) = 0           (Position constraint)
dC/dt = Jv = 0     (Velocity constraint)

Where:
- C = constraint function
- J = Jacobian matrix
- v = velocity vector
```

### Sequential Impulse Solver

The most common approach in game physics:

```cpp
class ConstraintSolver {
    std::vector<Contact> contacts;
    std::vector<Joint*> joints;
    int iterations;

public:
    ConstraintSolver(int iterations = 10) : iterations(iterations) {}

    void solve(float dt) {
        // Prepare constraints
        for (auto& contact : contacts) {
            prepareContact(contact, dt);
        }
        for (auto* joint : joints) {
            joint->prepare(dt);
        }

        // Iterative solving
        for (int i = 0; i < iterations; ++i) {
            // Solve joints first
            for (auto* joint : joints) {
                joint->solve();
            }

            // Then contacts
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

        // Calculate effective mass
        Vector3 rACrossN = rA.cross(c.normal);
        Vector3 rBCrossN = rB.cross(c.normal);

        float kNormal = a->inverseMass + b->inverseMass +
            rACrossN.dot(a->worldInverseInertia * rACrossN) +
            rBCrossN.dot(b->worldInverseInertia * rBCrossN);

        c.normalMass = 1.0f / kNormal;

        // Restitution bias
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

        // Relative velocity at contact
        Vector3 velA = a->linearVelocity + a->angularVelocity.cross(rA);
        Vector3 velB = b->linearVelocity + b->angularVelocity.cross(rB);
        float vn = (velB - velA).dot(c.normal);

        // Normal impulse
        float dPn = c.normalMass * (-vn + c.restitution);

        // Clamp accumulated impulse
        float oldImpulse = c.normalImpulse;
        c.normalImpulse = std::max(oldImpulse + dPn, 0.0f);
        dPn = c.normalImpulse - oldImpulse;

        // Apply normal impulse
        Vector3 Pn = c.normal * dPn;

        a->linearVelocity -= Pn * a->inverseMass;
        b->linearVelocity += Pn * b->inverseMass;
        a->angularVelocity -= a->worldInverseInertia * rA.cross(Pn);
        b->angularVelocity += b->worldInverseInertia * rB.cross(Pn);

        // Friction impulse (similar process)
        solveFriction(c, rA, rB);
    }
};
```

### Warm Starting

Reuse impulses from previous frame for faster convergence:

```cpp
void warmStart(Contact& c) {
    if (c.normalImpulse == 0 && c.tangentImpulse1 == 0 && c.tangentImpulse2 == 0) {
        return;
    }

    RigidBody* a = c.bodyA;
    RigidBody* b = c.bodyB;

    Vector3 rA = c.pointOnA - a->position;
    Vector3 rB = c.pointOnB - b->position;

    // Apply cached impulses
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

## Joint Systems

### Joint Base Class

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

### Distance Joint

Maintains fixed distance between two points:

```cpp
class DistanceJoint : public Joint {
    float restLength;
    float stiffness;
    float damping;

    // Solver data
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

        // Calculate effective mass
        float rAn = rA.cross(normal).dot(bodyA->worldInverseInertia * rA.cross(normal));
        float rBn = rB.cross(normal).dot(bodyB->worldInverseInertia * rB.cross(normal));

        float invMass = bodyA->inverseMass + bodyB->inverseMass + rAn + rBn;
        effectiveMass = invMass > 0 ? 1.0f / invMass : 0;

        // Soft constraint (spring-damper)
        float C = length - restLength;
        float omega = 2.0f * PI * stiffness;
        float d = 2.0f * effectiveMass * damping * omega;
        float k = effectiveMass * omega * omega;

        float gamma = 1.0f / (dt * (d + dt * k));
        bias = C * dt * k * gamma;
        effectiveMass = 1.0f / (invMass + gamma);

        // Warm start
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

### Revolute Joint (Hinge)

Allows rotation around a single axis:

```cpp
class RevoluteJoint : public Joint {
    Vector3 localAxisA;
    Vector3 localAxisB;

    // Motor
    bool enableMotor;
    float motorSpeed;
    float maxMotorTorque;

    // Limits
    bool enableLimits;
    float lowerAngle;
    float upperAngle;

    // Solver data
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

        // Convert axis to local space
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

        // Calculate 3x3 effective mass for point constraint
        Matrix3 K = Matrix3::zero();
        K += Matrix3::identity() * (bodyA->inverseMass + bodyB->inverseMass);
        K -= skewSymmetric(rA) * bodyA->worldInverseInertia * skewSymmetric(rA);
        K -= skewSymmetric(rB) * bodyB->worldInverseInertia * skewSymmetric(rB);

        effectiveMass = K.inverse();

        // Warm start
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

        // Solve point constraint
        Vector3 velA = bodyA->linearVelocity + bodyA->angularVelocity.cross(rA);
        Vector3 velB = bodyB->linearVelocity + bodyB->angularVelocity.cross(rB);

        Vector3 Cdot = velB - velA;
        Vector3 lambda = effectiveMass * (-Cdot);
        impulse += lambda;

        bodyA->linearVelocity -= lambda * bodyA->inverseMass;
        bodyB->linearVelocity += lambda * bodyB->inverseMass;
        bodyA->angularVelocity -= bodyA->worldInverseInertia * rA.cross(lambda);
        bodyB->angularVelocity += bodyB->worldInverseInertia * rB.cross(lambda);

        // Motor
        if (enableMotor) {
            solveMotor();
        }

        // Limits
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

        // Clamp motor impulse
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

### Ball Socket Joint

Allows rotation in all directions:

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

        // Warm start
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

## Physics Engine Architecture

### Main Loop Structure

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
        // Fixed timestep with accumulator
        accumulator += deltaTime;

        while (accumulator >= fixedTimestep) {
            fixedUpdate(fixedTimestep);
            accumulator -= fixedTimestep;
        }

        // Interpolation factor for rendering
        float alpha = accumulator / fixedTimestep;
        interpolateStates(alpha);
    }

private:
    void fixedUpdate(float dt) {
        // 1. Apply forces
        applyForces(dt);

        // 2. Integrate velocities
        integrateVelocities(dt);

        // 3. Broad phase collision detection
        auto potentialPairs = broadPhase->findPairs(bodies);

        // 4. Narrow phase collision detection
        std::vector<Contact> contacts;
        for (auto& [a, b] : potentialPairs) {
            Contact contact;
            if (narrowPhase->testCollision(a, b, contact)) {
                contacts.push_back(contact);
            }
        }

        // 5. Solve constraints (joints + contacts)
        solver->solve(joints, contacts, dt);

        // 6. Integrate positions
        integratePositions(dt);

        // 7. Position correction
        for (auto& contact : contacts) {
            correctPositions(contact);
        }

        // 8. Update sleeping
        updateSleeping(dt);
    }

    void applyForces(float dt) {
        for (auto* body : bodies) {
            if (body->isStatic) continue;

            // Gravity
            body->applyForce(gravity * body->mass);

            // Custom force generators
            for (auto* generator : forceGenerators) {
                generator->updateForce(body, dt);
            }
        }
    }

    void integrateVelocities(float dt) {
        for (auto* body : bodies) {
            if (body->isStatic) continue;

            // Linear velocity
            Vector3 linearAccel = body->force * body->inverseMass;
            body->linearVelocity += linearAccel * dt;

            // Angular velocity
            Matrix3 worldInvI = body->getWorldInverseInertia();
            Vector3 angularAccel = worldInvI * body->torque;
            body->angularVelocity += angularAccel * dt;

            // Clear accumulators
            body->force = Vector3::zero();
            body->torque = Vector3::zero();
        }
    }

    void integratePositions(float dt) {
        for (auto* body : bodies) {
            if (body->isStatic) continue;

            // Linear position
            body->position += body->linearVelocity * dt;

            // Angular position (quaternion integration)
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

### Island System

Groups connected bodies for more efficient solving:

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

                // Add connected bodies through contacts
                for (auto& contact : contacts) {
                    if (contact.bodyA == current && !visited.count(contact.bodyB)) {
                        queue.push(contact.bodyB);
                        island.contacts.push_back(&contact);
                    } else if (contact.bodyB == current && !visited.count(contact.bodyA)) {
                        queue.push(contact.bodyA);
                        island.contacts.push_back(&contact);
                    }
                }

                // Add connected bodies through joints
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

## Box2D Integration Example

Box2D is the most popular 2D physics engine. Here's how to use it:

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

    // Create a dynamic box
    b2Body* createBox(float x, float y, float width, float height,
                      float density = 1.0f) {
        // Body definition
        b2BodyDef bodyDef;
        bodyDef.type = b2_dynamicBody;
        bodyDef.position.Set(x, y);

        b2Body* body = world->CreateBody(&bodyDef);

        // Shape
        b2PolygonShape shape;
        shape.SetAsBox(width / 2.0f, height / 2.0f);

        // Fixture
        b2FixtureDef fixtureDef;
        fixtureDef.shape = &shape;
        fixtureDef.density = density;
        fixtureDef.friction = 0.3f;
        fixtureDef.restitution = 0.5f;

        body->CreateFixture(&fixtureDef);
        bodies.push_back(body);

        return body;
    }

    // Create a static ground
    b2Body* createGround(float x, float y, float width, float height) {
        b2BodyDef bodyDef;
        bodyDef.position.Set(x, y);

        b2Body* body = world->CreateBody(&bodyDef);

        b2PolygonShape shape;
        shape.SetAsBox(width / 2.0f, height / 2.0f);

        body->CreateFixture(&shape, 0.0f);

        return body;
    }

    // Create a circle
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

    // Create revolute joint
    b2Joint* createRevoluteJoint(b2Body* bodyA, b2Body* bodyB,
                                  const b2Vec2& anchor) {
        b2RevoluteJointDef jointDef;
        jointDef.Initialize(bodyA, bodyB, anchor);
        jointDef.enableMotor = false;
        jointDef.enableLimit = false;

        return world->CreateJoint(&jointDef);
    }

    // Create distance joint
    b2Joint* createDistanceJoint(b2Body* bodyA, b2Body* bodyB,
                                  const b2Vec2& anchorA, const b2Vec2& anchorB) {
        b2DistanceJointDef jointDef;
        jointDef.Initialize(bodyA, bodyB, anchorA, anchorB);
        jointDef.stiffness = 30.0f;
        jointDef.damping = 5.0f;

        return world->CreateJoint(&jointDef);
    }

    // Step simulation
    void step(float dt) {
        int velocityIterations = 8;
        int positionIterations = 3;
        world->Step(dt, velocityIterations, positionIterations);
    }

    // Apply force to body
    void applyForce(b2Body* body, float fx, float fy) {
        body->ApplyForceToCenter(b2Vec2(fx, fy), true);
    }

    // Apply impulse
    void applyImpulse(b2Body* body, float ix, float iy) {
        body->ApplyLinearImpulseToCenter(b2Vec2(ix, iy), true);
    }
};
```

### Box2D with JavaScript (matter.js style)

```javascript
// Using planck.js (Box2D port to JavaScript)
import { World, Vec2, Box, Circle, RevoluteJoint } from 'planck';

class PhysicsGame {
    constructor() {
        // Create world with gravity
        this.world = new World({
            gravity: Vec2(0, -10)
        });

        this.bodies = [];
        this.setupScene();
    }

    setupScene() {
        // Ground
        const ground = this.world.createBody();
        ground.createFixture({
            shape: Box(20, 0.5),
            friction: 0.5
        });

        // Dynamic boxes
        for (let i = 0; i < 10; i++) {
            this.createBox(
                Math.random() * 10 - 5,
                5 + i * 2,
                1, 1
            );
        }

        // Pendulum
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
        // Anchor (static)
        const anchor = this.world.createBody({
            position: Vec2(x, y)
        });

        // Bob (dynamic)
        const bob = this.createCircle(x, y - length, 0.5);

        // Joint
        this.world.createJoint(RevoluteJoint({}, anchor, bob, Vec2(x, y)));

        return { anchor, bob };
    }

    update(dt) {
        // Fixed timestep
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

## NVIDIA PhysX Integration

PhysX is a professional 3D physics engine used in many AAA games:

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
        // Initialize foundation
        foundation = PxCreateFoundation(PX_PHYSICS_VERSION, allocator, errorCallback);

        // Visual debugger (optional)
        pvd = PxCreatePvd(*foundation);
        PxPvdTransport* transport = PxDefaultPvdSocketTransportCreate("127.0.0.1", 5425, 10);
        pvd->connect(*transport, PxPvdInstrumentationFlag::eALL);

        // Create physics
        physics = PxCreatePhysics(PX_PHYSICS_VERSION, *foundation, PxTolerancesScale(), true, pvd);

        // Create scene
        PxSceneDesc sceneDesc(physics->getTolerancesScale());
        sceneDesc.gravity = PxVec3(0.0f, -9.81f, 0.0f);
        sceneDesc.cpuDispatcher = PxDefaultCpuDispatcherCreate(2);
        sceneDesc.filterShader = PxDefaultSimulationFilterShader;
        scene = physics->createScene(sceneDesc);

        // Default material
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

    // Create dynamic rigid body
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

    // Create static rigid body
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

    // Create sphere
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

    // Create D6 joint (configurable 6-DOF joint)
    PxD6Joint* createD6Joint(PxRigidActor* actor0, const PxTransform& localFrame0,
                              PxRigidActor* actor1, const PxTransform& localFrame1) {
        PxD6Joint* joint = PxD6JointCreate(*physics, actor0, localFrame0,
                                            actor1, localFrame1);

        // Lock all linear axes (ball socket)
        joint->setMotion(PxD6Axis::eX, PxD6Motion::eLOCKED);
        joint->setMotion(PxD6Axis::eY, PxD6Motion::eLOCKED);
        joint->setMotion(PxD6Axis::eZ, PxD6Motion::eLOCKED);

        // Free rotation
        joint->setMotion(PxD6Axis::eTWIST, PxD6Motion::eFREE);
        joint->setMotion(PxD6Axis::eSWING1, PxD6Motion::eFREE);
        joint->setMotion(PxD6Axis::eSWING2, PxD6Motion::eFREE);

        return joint;
    }

    // Step simulation
    void step(float dt) {
        scene->simulate(dt);
        scene->fetchResults(true);
    }

    // Raycast
    bool raycast(const PxVec3& origin, const PxVec3& direction,
                 float maxDistance, PxRaycastBuffer& hit) {
        return scene->raycast(origin, direction, maxDistance, hit);
    }
};
```

---

## Performance Optimization

### Sleeping Bodies

Bodies at rest should stop being simulated:

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

### Continuous Collision Detection (CCD)

Prevent fast-moving objects from tunneling through thin objects:

```cpp
bool sweepTest(const RigidBody& body, const Vector3& displacement,
               float& toi, Contact& contact) {
    // Conservative advancement
    const int maxIterations = 10;
    float t = 0;

    for (int i = 0; i < maxIterations; i++) {
        // Move body to interpolated position
        Vector3 pos = body.position + displacement * t;

        // Check for collision
        float distance = computeClosestDistance(body.shape, pos, otherBodies);

        if (distance < 0.001f) {
            toi = t;
            // Generate contact info
            return true;
        }

        // Advance by safe distance
        float step = distance / displacement.magnitude();
        t += step;

        if (t >= 1.0f) break;
    }

    return false;
}
```

### Multithreading

Parallel broadphase and island solving:

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

        // Wait for all islands
        for (auto& future : futures) {
            future.wait();
        }
    }

    void broadPhaseParallel(std::vector<RigidBody*>& bodies) {
        // Parallel AABB updates
        pool.parallelFor(0, bodies.size(), [&](size_t i) {
            bodies[i]->updateAABB();
        });

        // Build spatial hash in parallel
        // ...
    }
};
```

---

## Common Pitfalls and Solutions

### Unstable Stacking

**Problem**: Stacked objects jitter or collapse.

**Solutions**:
```cpp
// 1. Increase solver iterations
solver.setIterations(20); // Default is often 10

// 2. Use contact caching and warm starting
contact.warmStart();

// 3. Add position stabilization
const float stabilization = 0.2f;
body.position += error * stabilization;

// 4. Use appropriate mass ratios (avoid > 10:1)
```

### Tunneling

**Problem**: Fast objects pass through thin objects.

**Solutions**:
```cpp
// 1. Enable CCD
body.ccdEnabled = true;
body.ccdRadius = 0.1f;

// 2. Use swept collision
if (body.linearVelocity.magnitude() * dt > body.shape.minExtent()) {
    performSweptCollision(body);
}

// 3. Limit maximum velocity
body.linearVelocity = clamp(body.linearVelocity, -maxVel, maxVel);
```

### Jittering Contacts

**Problem**: Objects shake when resting on surfaces.

**Solutions**:
```cpp
// 1. Implement sleeping
if (body.motion < threshold && body.sleepTimer > 0.5f) {
    body.sleep();
}

// 2. Add contact slop
const float slop = 0.01f;
if (penetration < slop) return; // Ignore small penetrations

// 3. Use velocity threshold for restitution
if (relativeVelocity < 1.0f) {
    restitution = 0; // No bounce for slow impacts
}
```

---

## Interview Questions

### Fundamentals

**Q1: What is the difference between impulse and force?**

```
Force: Applied continuously over time
- F = m * a
- Results in acceleration
- Integration: a -> v -> x over dt

Impulse: Applied instantaneously
- J = F * dt = m * delta_v
- Results in immediate velocity change
- Used for collision response
```

**Q2: Explain the inertia tensor.**

```
The inertia tensor is a 3x3 matrix describing how mass is distributed in a rigid body.
- Diagonal elements: moments of inertia about principal axes
- Off-diagonal elements: products of inertia (coupling between axes)
- Must be transformed to world space: I_world = R * I_local * R^T
- Affects resistance to rotation about different axes
```

**Q3: Why use quaternions instead of Euler angles?**

```
Quaternions:
+ No gimbal lock
+ Smooth interpolation (SLERP)
+ Efficient composition of rotations
+ Stable numerical integration
- Less intuitive

Euler angles:
+ Human-readable
- Gimbal lock problem
- Order-dependent
- Interpolation issues
```

### Implementation

**Q4: Explain the Sequential Impulse solver.**

```
1. Convert constraints to velocity form: J * v = b
2. For each constraint, compute impulse: lambda = -K * (J*v - b)
3. Clamp impulse (e.g., normal >= 0, friction within cone)
4. Apply impulse to bodies
5. Repeat for N iterations

Benefits:
- Simple implementation
- Handles inequality constraints naturally
- Warm starting improves convergence
```

**Q5: What is warm starting?**

```
Reusing constraint impulses from the previous frame as initial guesses.

Benefits:
- Faster convergence (often 2-3x fewer iterations)
- More stable stacking behavior
- Smoother contact handling

Implementation:
- Cache impulses per contact pair
- Identify persistent contacts between frames
- Apply cached impulses before iterative solving
```

### Optimization

**Q6: How would you optimize a physics engine for many bodies?**

```
1. Spatial partitioning for broad phase (grid, octree, BVH)
2. Island system - solve disconnected groups separately
3. Sleeping - deactivate stationary bodies
4. Level of detail - simplified collision for distant objects
5. Parallel solving of independent islands
6. SIMD for math operations
7. Persistent contact caching
8. Fixed timestep with interpolation for rendering
```

---

## Further Reading

### Books

- "Game Physics Engine Development" - Ian Millington
- "Real-Time Collision Detection" - Christer Ericson
- "Physics for Game Developers" - David M. Bourg

### Papers

- "Iterative Dynamics with Temporal Coherence" - Erin Catto (Box2D author)
- "A Unified Framework for Rigid Body Dynamics" - Baraff
- "Real-Time Rigid Body Simulation on GPUs" - NVIDIA

### Open Source Engines

- **Box2D**: 2D physics, widely used in games
- **Bullet**: 3D physics, open source
- **PhysX**: NVIDIA's professional engine (free)
- **Jolt Physics**: Modern C++ physics library
- **Rapier**: Rust physics engine with JS bindings

### Online Resources

- [Box2D Documentation](https://box2d.org/documentation/)
- [Bullet Physics Manual](https://pybullet.org/Bullet/BulletFull/index.html)
- [Game Physics Tutorial Series](https://gafferongames.com/categories/game-physics/)
- [Allen Chou's Physics Blog](https://allenchou.net/category/physics/)

---

## Summary

Rigid body dynamics forms the backbone of game physics simulation. Key takeaways:

1. **State Representation**: Position, orientation, velocities, and mass properties
2. **Equations of Motion**: Newton's laws for linear and angular motion
3. **Integration**: Semi-implicit Euler is the most common choice for games
4. **Collision Detection**: Broad phase filtering followed by narrow phase testing
5. **Collision Response**: Impulse-based method with friction handling
6. **Constraints**: Sequential impulse solver with warm starting
7. **Joints**: Various constraint types for different mechanical connections
8. **Optimization**: Sleeping, islands, CCD, and parallelization

Understanding these fundamentals enables you to work effectively with physics engines like Box2D and PhysX, or even implement your own physics system for specialized needs.
