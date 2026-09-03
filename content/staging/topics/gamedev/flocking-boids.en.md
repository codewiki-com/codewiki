---
title: Flocking Behavior and Boids Algorithm
description: "Implement natural group movement: separation, alignment, cohesion, and flow field techniques"
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - Boids
  - flocking
  - swarm AI
  - simulation
status: imported
origin: old/src/content/docs/gamedev/flocking-boids.en.md
divergence: 0.23
issues: []
legacy:
  category: GameDev
  subcategory: AI
  order: 20
  lastUpdated: 2026-01-07
---

Flocking behavior is one of the most visually compelling examples of emergent behavior in nature. From schools of fish darting through coral reefs to murmurations of starlings painting the evening sky, these collective movements arise from simple individual rules. We explore the Boids algorithm, a foundational technique for simulating realistic flocking behavior in games, simulations, and visual effects.

## Understanding Flocking Behavior

### What is Flocking?

Flocking refers to the collective motion of many self-propelled entities. In nature, we observe this phenomenon in:

- **Birds**: Starling murmurations, geese flying in V-formation
- **Fish**: Schools of sardines, herring balls
- **Insects**: Locust swarms, bee swarms
- **Mammals**: Herds of wildebeest, packs of wolves

The remarkable aspect of flocking is that no single entity controls the group. Instead, complex global patterns emerge from simple local interactions between neighboring individuals.

### The Boids Algorithm Origin

In 1986, Craig Reynolds introduced the "Boids" algorithm (a portmanteau of "bird-oid objects") at SIGGRAPH. This groundbreaking work demonstrated that realistic flocking behavior could be simulated using just three simple steering rules applied to each individual agent:

1. **Separation**: Steer to avoid crowding local flockmates
2. **Alignment**: Steer towards the average heading of local flockmates
3. **Cohesion**: Steer to move toward the average position of local flockmates

These rules, when combined, produce emergent flocking behavior that closely resembles natural phenomena.

## The Three Core Rules

### Separation (Collision Avoidance)

Separation ensures that boids maintain a comfortable distance from their neighbors to avoid collisions and overcrowding.

**How it works:**
- For each neighboring boid within a defined radius, calculate a vector pointing away from that neighbor
- Weight closer neighbors more heavily (inverse distance weighting)
- Sum all repulsion vectors to get the final separation steering force

```typescript
interface Vector2D {
  x: number;
  y: number;
}

interface Boid {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  maxSpeed: number;
  maxForce: number;
}

function separation(boid: Boid, neighbors: Boid[], desiredSeparation: number): Vector2D {
  const steering: Vector2D = { x: 0, y: 0 };
  let count = 0;

  for (const other of neighbors) {
    const distance = getDistance(boid.position, other.position);

    // Only consider neighbors within desired separation distance
    if (distance > 0 && distance < desiredSeparation) {
      // Calculate vector pointing away from neighbor
      const diff: Vector2D = {
        x: boid.position.x - other.position.x,
        y: boid.position.y - other.position.y
      };

      // Normalize and weight by distance (closer = stronger repulsion)
      const normalized = normalize(diff);
      steering.x += normalized.x / distance;
      steering.y += normalized.y / distance;
      count++;
    }
  }

  if (count > 0) {
    // Average the steering force
    steering.x /= count;
    steering.y /= count;

    // Implement Reynolds steering: desired velocity - current velocity
    if (magnitude(steering) > 0) {
      const desired = normalize(steering);
      desired.x *= boid.maxSpeed;
      desired.y *= boid.maxSpeed;

      steering.x = desired.x - boid.velocity.x;
      steering.y = desired.y - boid.velocity.y;

      return limit(steering, boid.maxForce);
    }
  }

  return steering;
}
```

### Alignment (Velocity Matching)

Alignment causes boids to steer towards the average direction of their local flockmates, creating coordinated movement.

**How it works:**
- Calculate the average velocity of all neighbors within perception radius
- Create a steering force that moves the boid's velocity toward this average

```typescript
function alignment(boid: Boid, neighbors: Boid[], perceptionRadius: number): Vector2D {
  const avgVelocity: Vector2D = { x: 0, y: 0 };
  let count = 0;

  for (const other of neighbors) {
    const distance = getDistance(boid.position, other.position);

    if (distance > 0 && distance < perceptionRadius) {
      avgVelocity.x += other.velocity.x;
      avgVelocity.y += other.velocity.y;
      count++;
    }
  }

  if (count > 0) {
    // Calculate average velocity
    avgVelocity.x /= count;
    avgVelocity.y /= count;

    // Scale to maximum speed
    const desired = normalize(avgVelocity);
    desired.x *= boid.maxSpeed;
    desired.y *= boid.maxSpeed;

    // Reynolds steering formula
    const steering: Vector2D = {
      x: desired.x - boid.velocity.x,
      y: desired.y - boid.velocity.y
    };

    return limit(steering, boid.maxForce);
  }

  return { x: 0, y: 0 };
}
```

### Cohesion (Flock Centering)

Cohesion steers boids toward the average position of their neighbors, keeping the flock together.

**How it works:**
- Calculate the centroid (average position) of all nearby boids
- Create a steering force that moves the boid toward this center of mass

```typescript
function cohesion(boid: Boid, neighbors: Boid[], perceptionRadius: number): Vector2D {
  const centerOfMass: Vector2D = { x: 0, y: 0 };
  let count = 0;

  for (const other of neighbors) {
    const distance = getDistance(boid.position, other.position);

    if (distance > 0 && distance < perceptionRadius) {
      centerOfMass.x += other.position.x;
      centerOfMass.y += other.position.y;
      count++;
    }
  }

  if (count > 0) {
    // Calculate centroid
    centerOfMass.x /= count;
    centerOfMass.y /= count;

    // Seek toward the center of mass
    return seek(boid, centerOfMass);
  }

  return { x: 0, y: 0 };
}

function seek(boid: Boid, target: Vector2D): Vector2D {
  // Calculate desired velocity toward target
  const desired: Vector2D = {
    x: target.x - boid.position.x,
    y: target.y - boid.position.y
  };

  // Scale to maximum speed
  const normalizedDesired = normalize(desired);
  normalizedDesired.x *= boid.maxSpeed;
  normalizedDesired.y *= boid.maxSpeed;

  // Steering = desired - current velocity
  const steering: Vector2D = {
    x: normalizedDesired.x - boid.velocity.x,
    y: normalizedDesired.y - boid.velocity.y
  };

  return limit(steering, boid.maxForce);
}
```

## Complete Boid Implementation

### The Boid Class

A complete TypeScript implementation of a Boid class with all three behaviors:

```typescript
class Vector2D {
  constructor(public x: number = 0, public y: number = 0) {}

  add(v: Vector2D): Vector2D {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  subtract(v: Vector2D): Vector2D {
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  multiply(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  divide(scalar: number): Vector2D {
    if (scalar === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / scalar, this.y / scalar);
  }

  magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vector2D {
    const mag = this.magnitude();
    if (mag === 0) return new Vector2D(0, 0);
    return this.divide(mag);
  }

  limit(max: number): Vector2D {
    if (this.magnitude() > max) {
      return this.normalize().multiply(max);
    }
    return new Vector2D(this.x, this.y);
  }

  distance(v: Vector2D): number {
    return this.subtract(v).magnitude();
  }

  static random(): Vector2D {
    const angle = Math.random() * Math.PI * 2;
    return new Vector2D(Math.cos(angle), Math.sin(angle));
  }
}

class Boid {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;

  // Boid properties
  maxSpeed: number = 4;
  maxForce: number = 0.1;

  // Perception radii
  separationRadius: number = 25;
  alignmentRadius: number = 50;
  cohesionRadius: number = 50;

  // Behavior weights
  separationWeight: number = 1.5;
  alignmentWeight: number = 1.0;
  cohesionWeight: number = 1.0;

  constructor(x: number, y: number) {
    this.position = new Vector2D(x, y);
    this.velocity = Vector2D.random().multiply(this.maxSpeed * 0.5);
    this.acceleration = new Vector2D(0, 0);
  }

  // Apply a force to the boid
  applyForce(force: Vector2D): void {
    this.acceleration = this.acceleration.add(force);
  }

  // Main flocking behavior
  flock(boids: Boid[]): void {
    const sep = this.separation(boids).multiply(this.separationWeight);
    const ali = this.alignment(boids).multiply(this.alignmentWeight);
    const coh = this.cohesion(boids).multiply(this.cohesionWeight);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
  }

  separation(boids: Boid[]): Vector2D {
    let steering = new Vector2D(0, 0);
    let count = 0;

    for (const other of boids) {
      const d = this.position.distance(other.position);
      if (other !== this && d < this.separationRadius) {
        const diff = this.position.subtract(other.position).normalize().divide(d);
        steering = steering.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steering = steering.divide(count);
      if (steering.magnitude() > 0) {
        steering = steering.normalize().multiply(this.maxSpeed).subtract(this.velocity);
        steering = steering.limit(this.maxForce);
      }
    }

    return steering;
  }

  alignment(boids: Boid[]): Vector2D {
    let sum = new Vector2D(0, 0);
    let count = 0;

    for (const other of boids) {
      const d = this.position.distance(other.position);
      if (other !== this && d < this.alignmentRadius) {
        sum = sum.add(other.velocity);
        count++;
      }
    }

    if (count > 0) {
      sum = sum.divide(count).normalize().multiply(this.maxSpeed);
      const steering = sum.subtract(this.velocity);
      return steering.limit(this.maxForce);
    }

    return new Vector2D(0, 0);
  }

  cohesion(boids: Boid[]): Vector2D {
    let sum = new Vector2D(0, 0);
    let count = 0;

    for (const other of boids) {
      const d = this.position.distance(other.position);
      if (other !== this && d < this.cohesionRadius) {
        sum = sum.add(other.position);
        count++;
      }
    }

    if (count > 0) {
      sum = sum.divide(count);
      return this.seek(sum);
    }

    return new Vector2D(0, 0);
  }

  seek(target: Vector2D): Vector2D {
    const desired = target.subtract(this.position).normalize().multiply(this.maxSpeed);
    const steering = desired.subtract(this.velocity);
    return steering.limit(this.maxForce);
  }

  // Update position
  update(): void {
    this.velocity = this.velocity.add(this.acceleration);
    this.velocity = this.velocity.limit(this.maxSpeed);
    this.position = this.position.add(this.velocity);
    this.acceleration = new Vector2D(0, 0);
  }

  // Wrap around screen edges
  edges(width: number, height: number): void {
    if (this.position.x > width) this.position.x = 0;
    if (this.position.x < 0) this.position.x = width;
    if (this.position.y > height) this.position.y = 0;
    if (this.position.y < 0) this.position.y = height;
  }
}
```

### Flock Manager

```typescript
class FlockManager {
  boids: Boid[] = [];
  width: number;
  height: number;

  constructor(width: number, height: number, boidCount: number = 100) {
    this.width = width;
    this.height = height;

    for (let i = 0; i < boidCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      this.boids.push(new Boid(x, y));
    }
  }

  update(): void {
    for (const boid of this.boids) {
      boid.flock(this.boids);
      boid.update();
      boid.edges(this.width, this.height);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, this.width, this.height);

    for (const boid of this.boids) {
      this.drawBoid(ctx, boid);
    }
  }

  private drawBoid(ctx: CanvasRenderingContext2D, boid: Boid): void {
    const angle = Math.atan2(boid.velocity.y, boid.velocity.x);
    const size = 8;

    ctx.save();
    ctx.translate(boid.position.x, boid.position.y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size, size / 2);
    ctx.lineTo(-size, -size / 2);
    ctx.closePath();

    ctx.fillStyle = '#4a90d9';
    ctx.fill();
    ctx.restore();
  }
}
```

## Obstacle Avoidance

Real-world flocking often involves navigating around obstacles. There are several approaches to implement obstacle avoidance:

### Simple Circle Obstacles

```typescript
interface Obstacle {
  position: Vector2D;
  radius: number;
}

function avoidObstacles(boid: Boid, obstacles: Obstacle[], avoidRadius: number): Vector2D {
  let steering = new Vector2D(0, 0);

  for (const obstacle of obstacles) {
    const toObstacle = obstacle.position.subtract(boid.position);
    const distance = toObstacle.magnitude();
    const combinedRadius = obstacle.radius + avoidRadius;

    if (distance < combinedRadius) {
      // Calculate avoidance force (flee from obstacle)
      const avoidance = boid.position.subtract(obstacle.position);
      const strength = (combinedRadius - distance) / combinedRadius;
      steering = steering.add(avoidance.normalize().multiply(strength));
    }
  }

  if (steering.magnitude() > 0) {
    steering = steering.normalize().multiply(boid.maxSpeed).subtract(boid.velocity);
    steering = steering.limit(boid.maxForce * 2); // Stronger force for obstacles
  }

  return steering;
}
```

### Ray-Based Obstacle Detection

For more sophisticated obstacle avoidance, cast rays in the direction of movement:

```typescript
interface Ray {
  origin: Vector2D;
  direction: Vector2D;
  length: number;
}

function rayObstacleAvoidance(boid: Boid, obstacles: Obstacle[]): Vector2D {
  const lookAhead = 50; // Distance to look ahead
  const numRays = 5;    // Number of whisker rays
  const spreadAngle = Math.PI / 3; // 60 degrees total spread

  let steering = new Vector2D(0, 0);
  const baseAngle = Math.atan2(boid.velocity.y, boid.velocity.x);

  for (let i = 0; i < numRays; i++) {
    // Calculate ray angle
    const t = i / (numRays - 1) - 0.5; // -0.5 to 0.5
    const rayAngle = baseAngle + t * spreadAngle;

    const rayDir = new Vector2D(Math.cos(rayAngle), Math.sin(rayAngle));
    const ray: Ray = {
      origin: boid.position,
      direction: rayDir,
      length: lookAhead * (1 - Math.abs(t) * 0.5) // Center ray is longest
    };

    // Check for intersections
    for (const obstacle of obstacles) {
      const intersection = rayCircleIntersection(ray, obstacle);
      if (intersection) {
        // Calculate avoidance steering
        const normal = boid.position.subtract(obstacle.position).normalize();
        const avoidStrength = 1 - (intersection / ray.length);
        steering = steering.add(normal.multiply(avoidStrength));
      }
    }
  }

  if (steering.magnitude() > 0) {
    steering = steering.normalize().multiply(boid.maxSpeed).subtract(boid.velocity);
    return steering.limit(boid.maxForce * 2);
  }

  return steering;
}

function rayCircleIntersection(ray: Ray, circle: Obstacle): number | null {
  const oc = ray.origin.subtract(circle.position);
  const a = ray.direction.x * ray.direction.x + ray.direction.y * ray.direction.y;
  const b = 2 * (oc.x * ray.direction.x + oc.y * ray.direction.y);
  const c = oc.x * oc.x + oc.y * oc.y - circle.radius * circle.radius;

  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) return null;

  const t = (-b - Math.sqrt(discriminant)) / (2 * a);

  if (t > 0 && t < ray.length) return t;
  return null;
}
```

## Leader Following

Many games require boids to follow a leader or target. This creates formations and purposeful movement.

### Basic Leader Following

```typescript
class LeaderFollowingBoid extends Boid {
  followWeight: number = 2.0;

  followLeader(leader: Boid | Vector2D, arrivalRadius: number = 100): Vector2D {
    const leaderPos = leader instanceof Boid ? leader.position : leader;

    // Calculate desired velocity toward leader
    const desired = leaderPos.subtract(this.position);
    const distance = desired.magnitude();

    // Implement arrival behavior (slow down when close)
    let speed = this.maxSpeed;
    if (distance < arrivalRadius) {
      speed = this.maxSpeed * (distance / arrivalRadius);
    }

    const desiredVelocity = desired.normalize().multiply(speed);
    const steering = desiredVelocity.subtract(this.velocity);

    return steering.limit(this.maxForce);
  }

  // Override flock to include leader following
  flockWithLeader(boids: Boid[], leader: Boid | Vector2D): void {
    const sep = this.separation(boids).multiply(this.separationWeight);
    const ali = this.alignment(boids).multiply(this.alignmentWeight);
    const coh = this.cohesion(boids).multiply(this.cohesionWeight);
    const follow = this.followLeader(leader).multiply(this.followWeight);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
    this.applyForce(follow);
  }
}
```

### Behind-Leader Following

More realistic leader following positions boids behind the leader:

```typescript
function followBehindLeader(
  boid: Boid,
  leader: Boid,
  followDistance: number = 50
): Vector2D {
  // Calculate position behind the leader
  const leaderVelocityNorm = leader.velocity.normalize();
  const behindPosition = leader.position.subtract(
    leaderVelocityNorm.multiply(followDistance)
  );

  // Add some lateral offset based on boid's index for formation
  return boid.seek(behindPosition);
}

// Evade if too close to leader's path
function evadeLeaderPath(boid: Boid, leader: Boid, safeDistance: number = 30): Vector2D {
  const leaderFuture = leader.position.add(leader.velocity.multiply(10));
  const distance = boid.position.distance(leaderFuture);

  if (distance < safeDistance) {
    // Flee from leader's projected position
    const flee = boid.position.subtract(leaderFuture);
    return flee.normalize().multiply(boid.maxSpeed).subtract(boid.velocity).limit(boid.maxForce);
  }

  return new Vector2D(0, 0);
}
```

## Flow Field Pathfinding

Flow fields (also called vector fields) provide an elegant way to guide large numbers of boids toward goals while naturally avoiding obstacles.

### What is a Flow Field?

A flow field is a grid where each cell contains a direction vector. Boids sample the field at their position and use the stored direction as their desired velocity.

**Advantages:**
- Efficient for large numbers of entities (O(1) lookup per boid)
- Smooth, organic movement
- Easily combined with other steering behaviors
- Can encode complex navigation requirements

### Generating a Flow Field

```typescript
class FlowField {
  grid: Vector2D[][];
  cellSize: number;
  cols: number;
  rows: number;

  constructor(width: number, height: number, cellSize: number = 20) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.grid = [];

    // Initialize with zero vectors
    for (let y = 0; y < this.rows; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.cols; x++) {
        this.grid[y][x] = new Vector2D(0, 0);
      }
    }
  }

  // Generate flow field pointing toward a target
  generateTowardTarget(target: Vector2D): void {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cellCenter = new Vector2D(
          x * this.cellSize + this.cellSize / 2,
          y * this.cellSize + this.cellSize / 2
        );

        // Vector pointing from cell to target
        const direction = target.subtract(cellCenter).normalize();
        this.grid[y][x] = direction;
      }
    }
  }

  // Generate using Perlin noise for organic patterns
  generateNoise(time: number = 0): void {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        // Using simplex noise (pseudo-implementation)
        const angle = noise(x * 0.1, y * 0.1, time * 0.01) * Math.PI * 2;
        this.grid[y][x] = new Vector2D(Math.cos(angle), Math.sin(angle));
      }
    }
  }

  // Sample the flow field at a position
  lookup(position: Vector2D): Vector2D {
    const col = Math.floor(position.x / this.cellSize);
    const row = Math.floor(position.y / this.cellSize);

    // Clamp to grid bounds
    const clampedCol = Math.max(0, Math.min(col, this.cols - 1));
    const clampedRow = Math.max(0, Math.min(row, this.rows - 1));

    return this.grid[clampedRow][clampedCol];
  }

  // Bilinear interpolation for smoother sampling
  lookupSmooth(position: Vector2D): Vector2D {
    const gx = position.x / this.cellSize;
    const gy = position.y / this.cellSize;

    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const x1 = Math.min(x0 + 1, this.cols - 1);
    const y1 = Math.min(y0 + 1, this.rows - 1);

    const tx = gx - x0;
    const ty = gy - y0;

    // Bilinear interpolation
    const v00 = this.grid[Math.max(0, y0)][Math.max(0, x0)];
    const v10 = this.grid[Math.max(0, y0)][x1];
    const v01 = this.grid[y1][Math.max(0, x0)];
    const v11 = this.grid[y1][x1];

    const top = this.lerpVector(v00, v10, tx);
    const bottom = this.lerpVector(v01, v11, tx);

    return this.lerpVector(top, bottom, ty);
  }

  private lerpVector(a: Vector2D, b: Vector2D, t: number): Vector2D {
    return new Vector2D(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t
    );
  }
}
```

### Boid with Flow Field Following

```typescript
class FlowFieldBoid extends Boid {
  flowWeight: number = 1.5;

  followFlowField(flowField: FlowField): Vector2D {
    const desired = flowField.lookupSmooth(this.position).multiply(this.maxSpeed);
    const steering = desired.subtract(this.velocity);
    return steering.limit(this.maxForce);
  }

  flockWithFlowField(boids: Boid[], flowField: FlowField): void {
    const sep = this.separation(boids).multiply(this.separationWeight);
    const ali = this.alignment(boids).multiply(this.alignmentWeight);
    const coh = this.cohesion(boids).multiply(this.cohesionWeight);
    const flow = this.followFlowField(flowField).multiply(this.flowWeight);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
    this.applyForce(flow);
  }
}
```

### Dijkstra-Based Flow Field for Pathfinding

For navigation around obstacles, generate flow fields using pathfinding:

```typescript
interface GridCell {
  x: number;
  y: number;
  cost: number;
  walkable: boolean;
}

class PathfindingFlowField extends FlowField {
  costField: number[][];
  walkable: boolean[][];

  constructor(width: number, height: number, cellSize: number = 20) {
    super(width, height, cellSize);

    this.costField = [];
    this.walkable = [];

    for (let y = 0; y < this.rows; y++) {
      this.costField[y] = [];
      this.walkable[y] = [];
      for (let x = 0; x < this.cols; x++) {
        this.costField[y][x] = Infinity;
        this.walkable[y][x] = true;
      }
    }
  }

  setObstacle(col: number, row: number): void {
    if (this.isValid(col, row)) {
      this.walkable[row][col] = false;
    }
  }

  generateFromTarget(targetCol: number, targetRow: number): void {
    // Reset cost field
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        this.costField[y][x] = Infinity;
      }
    }

    // Dijkstra's algorithm
    const openSet: GridCell[] = [];
    this.costField[targetRow][targetCol] = 0;
    openSet.push({ x: targetCol, y: targetRow, cost: 0, walkable: true });

    const directions = [
      { dx: 0, dy: -1, cost: 1 },    // Up
      { dx: 0, dy: 1, cost: 1 },     // Down
      { dx: -1, dy: 0, cost: 1 },    // Left
      { dx: 1, dy: 0, cost: 1 },     // Right
      { dx: -1, dy: -1, cost: 1.41 }, // Diagonals
      { dx: 1, dy: -1, cost: 1.41 },
      { dx: -1, dy: 1, cost: 1.41 },
      { dx: 1, dy: 1, cost: 1.41 }
    ];

    while (openSet.length > 0) {
      // Get cell with lowest cost
      openSet.sort((a, b) => a.cost - b.cost);
      const current = openSet.shift()!;

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;

        if (!this.isValid(nx, ny) || !this.walkable[ny][nx]) continue;

        const newCost = this.costField[current.y][current.x] + dir.cost;

        if (newCost < this.costField[ny][nx]) {
          this.costField[ny][nx] = newCost;
          openSet.push({ x: nx, y: ny, cost: newCost, walkable: true });
        }
      }
    }

    // Generate flow vectors from cost field
    this.generateVectorsFromCost();
  }

  private generateVectorsFromCost(): void {
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (!this.walkable[y][x] || this.costField[y][x] === Infinity) {
          this.grid[y][x] = new Vector2D(0, 0);
          continue;
        }

        // Find direction of steepest descent
        let bestDir = new Vector2D(0, 0);
        let lowestCost = this.costField[y][x];

        const neighbors = [
          { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
          { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
          { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
          { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];

        for (const n of neighbors) {
          const nx = x + n.dx;
          const ny = y + n.dy;

          if (this.isValid(nx, ny) && this.costField[ny][nx] < lowestCost) {
            lowestCost = this.costField[ny][nx];
            bestDir = new Vector2D(n.dx, n.dy).normalize();
          }
        }

        this.grid[y][x] = bestDir;
      }
    }
  }

  private isValid(x: number, y: number): boolean {
    return x >= 0 && x < this.cols && y >= 0 && y < this.rows;
  }
}
```

## Spatial Partitioning Optimization

The naive flocking algorithm is O(n^2) because each boid must check against all other boids. For large swarms, this becomes a performance bottleneck. Spatial partitioning dramatically improves performance.

### Grid-Based Spatial Hashing

```typescript
class SpatialHash {
  private cellSize: number;
  private grid: Map<string, Boid[]>;

  constructor(cellSize: number = 50) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  private getKey(x: number, y: number): string {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    return `${cx},${cy}`;
  }

  clear(): void {
    this.grid.clear();
  }

  insert(boid: Boid): void {
    const key = this.getKey(boid.position.x, boid.position.y);

    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }

    this.grid.get(key)!.push(boid);
  }

  query(position: Vector2D, radius: number): Boid[] {
    const results: Boid[] = [];

    // Calculate cell range to check
    const minCX = Math.floor((position.x - radius) / this.cellSize);
    const maxCX = Math.floor((position.x + radius) / this.cellSize);
    const minCY = Math.floor((position.y - radius) / this.cellSize);
    const maxCY = Math.floor((position.y + radius) / this.cellSize);

    for (let cy = minCY; cy <= maxCY; cy++) {
      for (let cx = minCX; cx <= maxCX; cx++) {
        const key = `${cx},${cy}`;
        const cell = this.grid.get(key);

        if (cell) {
          for (const boid of cell) {
            const dist = position.distance(boid.position);
            if (dist <= radius) {
              results.push(boid);
            }
          }
        }
      }
    }

    return results;
  }
}
```

### Quadtree Implementation

For non-uniform boid distributions, quadtrees offer better performance:

```typescript
interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

class Quadtree {
  private boundary: Rectangle;
  private capacity: number;
  private boids: Boid[] = [];
  private divided: boolean = false;

  private northwest?: Quadtree;
  private northeast?: Quadtree;
  private southwest?: Quadtree;
  private southeast?: Quadtree;

  constructor(boundary: Rectangle, capacity: number = 4) {
    this.boundary = boundary;
    this.capacity = capacity;
  }

  insert(boid: Boid): boolean {
    // Check if boid is within boundary
    if (!this.contains(boid.position)) {
      return false;
    }

    if (this.boids.length < this.capacity && !this.divided) {
      this.boids.push(boid);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    return (
      this.northwest!.insert(boid) ||
      this.northeast!.insert(boid) ||
      this.southwest!.insert(boid) ||
      this.southeast!.insert(boid)
    );
  }

  private subdivide(): void {
    const x = this.boundary.x;
    const y = this.boundary.y;
    const w = this.boundary.width / 2;
    const h = this.boundary.height / 2;

    this.northwest = new Quadtree({ x: x, y: y, width: w, height: h }, this.capacity);
    this.northeast = new Quadtree({ x: x + w, y: y, width: w, height: h }, this.capacity);
    this.southwest = new Quadtree({ x: x, y: y + h, width: w, height: h }, this.capacity);
    this.southeast = new Quadtree({ x: x + w, y: y + h, width: w, height: h }, this.capacity);

    this.divided = true;

    // Redistribute existing boids
    for (const boid of this.boids) {
      this.northwest.insert(boid) ||
      this.northeast.insert(boid) ||
      this.southwest.insert(boid) ||
      this.southeast.insert(boid);
    }
    this.boids = [];
  }

  query(range: { x: number; y: number; radius: number }): Boid[] {
    const found: Boid[] = [];

    if (!this.intersectsCircle(range)) {
      return found;
    }

    for (const boid of this.boids) {
      if (boid.position.distance(new Vector2D(range.x, range.y)) <= range.radius) {
        found.push(boid);
      }
    }

    if (this.divided) {
      found.push(...this.northwest!.query(range));
      found.push(...this.northeast!.query(range));
      found.push(...this.southwest!.query(range));
      found.push(...this.southeast!.query(range));
    }

    return found;
  }

  private contains(point: Vector2D): boolean {
    return (
      point.x >= this.boundary.x &&
      point.x < this.boundary.x + this.boundary.width &&
      point.y >= this.boundary.y &&
      point.y < this.boundary.y + this.boundary.height
    );
  }

  private intersectsCircle(circle: { x: number; y: number; radius: number }): boolean {
    const closestX = Math.max(this.boundary.x, Math.min(circle.x, this.boundary.x + this.boundary.width));
    const closestY = Math.max(this.boundary.y, Math.min(circle.y, this.boundary.y + this.boundary.height));

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    return (dx * dx + dy * dy) <= (circle.radius * circle.radius);
  }

  clear(): void {
    this.boids = [];
    this.divided = false;
    this.northwest = undefined;
    this.northeast = undefined;
    this.southwest = undefined;
    this.southeast = undefined;
  }
}
```

### Optimized Flock Manager

```typescript
class OptimizedFlockManager {
  boids: Boid[] = [];
  spatialHash: SpatialHash;
  quadtree?: Quadtree;
  width: number;
  height: number;
  useSpatialHash: boolean = true;

  constructor(width: number, height: number, boidCount: number = 1000) {
    this.width = width;
    this.height = height;
    this.spatialHash = new SpatialHash(50);

    for (let i = 0; i < boidCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      this.boids.push(new Boid(x, y));
    }
  }

  update(): void {
    // Rebuild spatial structure
    if (this.useSpatialHash) {
      this.spatialHash.clear();
      for (const boid of this.boids) {
        this.spatialHash.insert(boid);
      }
    } else {
      this.quadtree = new Quadtree({
        x: 0, y: 0,
        width: this.width,
        height: this.height
      });
      for (const boid of this.boids) {
        this.quadtree.insert(boid);
      }
    }

    // Update each boid
    for (const boid of this.boids) {
      // Query only nearby boids
      const maxRadius = Math.max(
        boid.separationRadius,
        boid.alignmentRadius,
        boid.cohesionRadius
      );

      let neighbors: Boid[];
      if (this.useSpatialHash) {
        neighbors = this.spatialHash.query(boid.position, maxRadius);
      } else {
        neighbors = this.quadtree!.query({
          x: boid.position.x,
          y: boid.position.y,
          radius: maxRadius
        });
      }

      boid.flock(neighbors);
      boid.update();
      boid.edges(this.width, this.height);
    }
  }
}
```

## Performance Comparison

| Method | Complexity | Best For | Memory |
|--------|------------|----------|--------|
| Naive (all vs all) | O(n^2) | < 100 boids | O(1) |
| Spatial Hash | O(n * k) | Uniform distribution | O(n) |
| Quadtree | O(n * log n) | Non-uniform, clustered | O(n) |
| Octree (3D) | O(n * log n) | 3D simulations | O(n) |

Where k is the average number of neighbors per cell.

## Large-Scale Swarm Simulation

For massive swarms (10,000+ entities), additional optimizations are necessary:

### Level of Detail (LOD)

```typescript
class LODBoid extends Boid {
  lodLevel: number = 0; // 0 = full detail, higher = less detail

  updateLOD(cameraPosition: Vector2D, lodDistances: number[]): void {
    const distance = this.position.distance(cameraPosition);

    this.lodLevel = 0;
    for (let i = 0; i < lodDistances.length; i++) {
      if (distance > lodDistances[i]) {
        this.lodLevel = i + 1;
      }
    }
  }

  // Skip certain calculations based on LOD
  flockLOD(boids: Boid[]): void {
    if (this.lodLevel >= 2) {
      // Very distant: only cohesion
      const coh = this.cohesion(boids).multiply(this.cohesionWeight);
      this.applyForce(coh);
    } else if (this.lodLevel >= 1) {
      // Medium distance: skip alignment
      const sep = this.separation(boids).multiply(this.separationWeight);
      const coh = this.cohesion(boids).multiply(this.cohesionWeight);
      this.applyForce(sep);
      this.applyForce(coh);
    } else {
      // Full detail
      this.flock(boids);
    }
  }
}
```

### Instanced Rendering (WebGL)

For GPU-accelerated rendering of thousands of boids:

```typescript
class InstancedBoidRenderer {
  private gl: WebGL2RenderingContext;
  private instanceBuffer: WebGLBuffer;
  private maxInstances: number;

  constructor(gl: WebGL2RenderingContext, maxInstances: number = 10000) {
    this.gl = gl;
    this.maxInstances = maxInstances;
    this.instanceBuffer = gl.createBuffer()!;
    this.setupShaders();
  }

  private setupShaders(): void {
    const vertexShader = `#version 300 es
      in vec2 a_position;
      in vec2 a_instancePosition;
      in float a_instanceRotation;

      uniform mat4 u_projection;

      void main() {
        float c = cos(a_instanceRotation);
        float s = sin(a_instanceRotation);
        mat2 rotation = mat2(c, -s, s, c);

        vec2 rotated = rotation * a_position;
        vec2 worldPos = rotated + a_instancePosition;

        gl_Position = u_projection * vec4(worldPos, 0.0, 1.0);
      }
    `;

    const fragmentShader = `#version 300 es
      precision mediump float;
      out vec4 fragColor;

      void main() {
        fragColor = vec4(0.3, 0.6, 0.9, 1.0);
      }
    `;

    // Compile and link shaders...
  }

  updateInstances(boids: Boid[]): void {
    const instanceData = new Float32Array(boids.length * 3);

    for (let i = 0; i < boids.length; i++) {
      const boid = boids[i];
      const offset = i * 3;

      instanceData[offset] = boid.position.x;
      instanceData[offset + 1] = boid.position.y;
      instanceData[offset + 2] = Math.atan2(boid.velocity.y, boid.velocity.x);
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.instanceBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, instanceData, this.gl.DYNAMIC_DRAW);
  }

  render(boidCount: number): void {
    // Draw all boids in a single draw call
    this.gl.drawArraysInstanced(this.gl.TRIANGLES, 0, 3, boidCount);
  }
}
```

### Web Workers for Parallel Processing

```typescript
// main.ts
class ParallelFlockManager {
  private workers: Worker[] = [];
  private boidData: Float32Array;
  private numWorkers: number;
  private boidsPerWorker: number;

  constructor(boidCount: number, numWorkers: number = 4) {
    this.numWorkers = numWorkers;
    this.boidsPerWorker = Math.ceil(boidCount / numWorkers);

    // Shared array buffer for boid data
    const buffer = new SharedArrayBuffer(boidCount * 6 * 4); // x,y,vx,vy,ax,ay
    this.boidData = new Float32Array(buffer);

    // Initialize workers
    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker('boid-worker.js');
      worker.postMessage({
        type: 'init',
        buffer: buffer,
        startIndex: i * this.boidsPerWorker,
        count: Math.min(this.boidsPerWorker, boidCount - i * this.boidsPerWorker),
        totalBoids: boidCount
      });
      this.workers.push(worker);
    }
  }

  async update(): Promise<void> {
    // Signal all workers to process
    const promises = this.workers.map((worker, i) => {
      return new Promise<void>(resolve => {
        worker.onmessage = () => resolve();
        worker.postMessage({ type: 'update' });
      });
    });

    await Promise.all(promises);
  }
}

// boid-worker.ts
let boidData: Float32Array;
let startIndex: number;
let count: number;
let totalBoids: number;

self.onmessage = (e: MessageEvent) => {
  if (e.data.type === 'init') {
    boidData = new Float32Array(e.data.buffer);
    startIndex = e.data.startIndex;
    count = e.data.count;
    totalBoids = e.data.totalBoids;
  } else if (e.data.type === 'update') {
    processFlocking();
    self.postMessage({ type: 'done' });
  }
};

function processFlocking(): void {
  for (let i = startIndex; i < startIndex + count; i++) {
    // Calculate flocking forces for boid i
    // Update acceleration in shared buffer
  }
}
```

## Practical Applications

### Game AI: Enemy Swarms

```typescript
class EnemySwarm {
  boids: Boid[] = [];
  player: { position: Vector2D };
  attackMode: boolean = false;

  constructor(count: number, spawnArea: Rectangle, player: { position: Vector2D }) {
    this.player = player;

    for (let i = 0; i < count; i++) {
      const x = spawnArea.x + Math.random() * spawnArea.width;
      const y = spawnArea.y + Math.random() * spawnArea.height;
      const boid = new Boid(x, y);

      // Customize for enemy behavior
      boid.maxSpeed = 3;
      boid.separationWeight = 2.0;
      boid.cohesionWeight = 0.8;

      this.boids.push(boid);
    }
  }

  update(): void {
    const spatialHash = new SpatialHash(50);
    for (const boid of this.boids) {
      spatialHash.insert(boid);
    }

    for (const boid of this.boids) {
      const neighbors = spatialHash.query(boid.position, 50);

      // Normal flocking
      boid.flock(neighbors);

      if (this.attackMode) {
        // Seek player
        const seekForce = boid.seek(this.player.position).multiply(1.5);
        boid.applyForce(seekForce);
      } else {
        // Patrol behavior
        const noise = this.getNoiseDirection(boid.position);
        boid.applyForce(noise);
      }

      boid.update();
    }
  }

  private getNoiseDirection(pos: Vector2D): Vector2D {
    const angle = noise(pos.x * 0.01, pos.y * 0.01) * Math.PI * 2;
    return new Vector2D(Math.cos(angle) * 0.1, Math.sin(angle) * 0.1);
  }

  setAttackMode(active: boolean): void {
    this.attackMode = active;
  }
}
```

### Particle Effects: Fire Embers

```typescript
class EmberParticleSystem {
  particles: Boid[] = [];
  emitterPosition: Vector2D;
  flowField: FlowField;

  constructor(x: number, y: number, width: number, height: number) {
    this.emitterPosition = new Vector2D(x, y);
    this.flowField = new FlowField(width, height, 30);
    this.generateTurbulentField();
  }

  private generateTurbulentField(): void {
    for (let y = 0; y < this.flowField.rows; y++) {
      for (let x = 0; x < this.flowField.cols; x++) {
        // Upward bias with turbulence
        const noiseVal = noise(x * 0.2, y * 0.2);
        const angle = -Math.PI / 2 + noiseVal * 0.8; // Mostly upward
        this.flowField.grid[y][x] = new Vector2D(
          Math.cos(angle),
          Math.sin(angle)
        );
      }
    }
  }

  emit(count: number = 5): void {
    for (let i = 0; i < count; i++) {
      const boid = new Boid(
        this.emitterPosition.x + (Math.random() - 0.5) * 20,
        this.emitterPosition.y
      );

      boid.velocity = new Vector2D(
        (Math.random() - 0.5) * 2,
        -Math.random() * 3 - 1
      );

      boid.maxSpeed = 2 + Math.random() * 2;
      boid.separationWeight = 0.5;
      boid.cohesionWeight = 0;
      boid.alignmentWeight = 0.3;

      // Add lifetime property
      (boid as any).lifetime = 60 + Math.random() * 60;
      (boid as any).age = 0;

      this.particles.push(boid);
    }
  }

  update(): void {
    // Remove dead particles
    this.particles = this.particles.filter(p => (p as any).age < (p as any).lifetime);

    for (const particle of this.particles) {
      // Weak flocking for organic movement
      particle.flock(this.particles);

      // Follow flow field
      const flowForce = this.flowField.lookup(particle.position).multiply(0.3);
      particle.applyForce(flowForce);

      // Add slight random acceleration
      particle.applyForce(new Vector2D(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      ));

      particle.update();
      (particle as any).age++;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.particles) {
      const age = (particle as any).age;
      const lifetime = (particle as any).lifetime;
      const progress = age / lifetime;

      // Fade out over lifetime
      const alpha = 1 - progress;
      const size = 3 + progress * 2;

      ctx.beginPath();
      ctx.arc(particle.position.x, particle.position.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, ${150 - progress * 100}, 50, ${alpha})`;
      ctx.fill();
    }
  }
}
```

### Crowd Simulation

```typescript
interface Goal {
  position: Vector2D;
  radius: number;
}

class CrowdAgent extends Boid {
  goal?: Goal;
  reachedGoal: boolean = false;
  personalSpace: number = 15;

  constructor(x: number, y: number) {
    super(x, y);
    this.maxSpeed = 2 + Math.random() * 1;
    this.separationWeight = 2.5;
    this.alignmentWeight = 0.3;
    this.cohesionWeight = 0.1;
    this.separationRadius = this.personalSpace;
  }

  setGoal(goal: Goal): void {
    this.goal = goal;
    this.reachedGoal = false;
  }

  updateCrowd(agents: CrowdAgent[], obstacles: Obstacle[]): void {
    if (this.reachedGoal) return;

    // Separation from other agents (strong)
    const sep = this.separation(agents).multiply(this.separationWeight);

    // Weak alignment for natural movement
    const ali = this.alignment(agents).multiply(this.alignmentWeight);

    // Avoid obstacles
    const avoid = avoidObstacles(this, obstacles, 30).multiply(3.0);

    // Move toward goal
    let goalForce = new Vector2D(0, 0);
    if (this.goal) {
      const distToGoal = this.position.distance(this.goal.position);

      if (distToGoal < this.goal.radius) {
        this.reachedGoal = true;
      } else {
        goalForce = this.seek(this.goal.position).multiply(1.5);
      }
    }

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(avoid);
    this.applyForce(goalForce);

    this.update();
  }
}

class CrowdSimulation {
  agents: CrowdAgent[] = [];
  goals: Goal[] = [];
  obstacles: Obstacle[] = [];
  spatialHash: SpatialHash;

  constructor(width: number, height: number) {
    this.spatialHash = new SpatialHash(30);

    // Define goals (exits)
    this.goals = [
      { position: new Vector2D(0, height / 2), radius: 30 },
      { position: new Vector2D(width, height / 2), radius: 30 }
    ];
  }

  spawnAgent(x: number, y: number): void {
    const agent = new CrowdAgent(x, y);

    // Assign nearest goal
    let nearestGoal = this.goals[0];
    let nearestDist = agent.position.distance(nearestGoal.position);

    for (const goal of this.goals) {
      const dist = agent.position.distance(goal.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestGoal = goal;
      }
    }

    agent.setGoal(nearestGoal);
    this.agents.push(agent);
  }

  update(): void {
    // Remove agents that reached their goals
    this.agents = this.agents.filter(a => !a.reachedGoal);

    // Rebuild spatial hash
    this.spatialHash.clear();
    for (const agent of this.agents) {
      this.spatialHash.insert(agent);
    }

    // Update each agent
    for (const agent of this.agents) {
      const neighbors = this.spatialHash.query(agent.position, 50) as CrowdAgent[];
      agent.updateCrowd(neighbors, this.obstacles);
    }
  }
}
```

## Tuning Parameters

Finding the right balance of parameters is crucial for achieving desired behaviors:

| Parameter | Low Value Effect | High Value Effect | Typical Range |
|-----------|------------------|-------------------|---------------|
| Separation Weight | Clumping, collisions | Scattered, no cohesion | 1.0 - 3.0 |
| Alignment Weight | Chaotic movement | Uniform direction | 0.5 - 2.0 |
| Cohesion Weight | Spreading apart | Tight clusters | 0.5 - 1.5 |
| Perception Radius | Small groups | Large group awareness | 30 - 100 |
| Max Speed | Sluggish movement | Fast, jittery motion | 2 - 8 |
| Max Force | Slow turns | Sharp, instant turns | 0.05 - 0.3 |

### Behavior Presets

```typescript
const behaviorPresets = {
  // Tight school of fish
  fishSchool: {
    separationWeight: 2.0,
    alignmentWeight: 1.5,
    cohesionWeight: 1.2,
    separationRadius: 20,
    alignmentRadius: 40,
    cohesionRadius: 60,
    maxSpeed: 4,
    maxForce: 0.15
  },

  // Loose bird flock
  birdFlock: {
    separationWeight: 1.5,
    alignmentWeight: 1.0,
    cohesionWeight: 0.8,
    separationRadius: 30,
    alignmentRadius: 80,
    cohesionRadius: 100,
    maxSpeed: 6,
    maxForce: 0.1
  },

  // Insect swarm
  insectSwarm: {
    separationWeight: 1.0,
    alignmentWeight: 0.5,
    cohesionWeight: 0.3,
    separationRadius: 15,
    alignmentRadius: 30,
    cohesionRadius: 50,
    maxSpeed: 5,
    maxForce: 0.2
  },

  // Crowd of people
  humanCrowd: {
    separationWeight: 3.0,
    alignmentWeight: 0.2,
    cohesionWeight: 0.1,
    separationRadius: 15,
    alignmentRadius: 30,
    cohesionRadius: 40,
    maxSpeed: 2,
    maxForce: 0.08
  }
};

function applyPreset(boid: Boid, preset: typeof behaviorPresets.fishSchool): void {
  boid.separationWeight = preset.separationWeight;
  boid.alignmentWeight = preset.alignmentWeight;
  boid.cohesionWeight = preset.cohesionWeight;
  boid.separationRadius = preset.separationRadius;
  boid.alignmentRadius = preset.alignmentRadius;
  boid.cohesionRadius = preset.cohesionRadius;
  boid.maxSpeed = preset.maxSpeed;
  boid.maxForce = preset.maxForce;
}
```

## Common Pitfalls and Solutions

### Boids Oscillating or Jittering

**Problem:** Boids shake in place or oscillate rapidly.

**Solutions:**
- Reduce `maxForce` to allow smoother steering
- Add velocity damping
- Implement a minimum speed threshold

```typescript
// Add velocity damping
boid.velocity = boid.velocity.multiply(0.99);

// Minimum speed threshold
if (boid.velocity.magnitude() < 0.5) {
  boid.velocity = boid.velocity.normalize().multiply(0.5);
}
```

### Boids Clumping into a Ball

**Problem:** All boids converge to a single point.

**Solutions:**
- Increase separation weight
- Decrease cohesion weight
- Reduce perception radius

### Flock Splitting Apart

**Problem:** The flock breaks into isolated groups.

**Solutions:**
- Increase cohesion weight
- Increase perception radius
- Add a global target or flow field

### Unnatural Sharp Turns

**Problem:** Boids make instant direction changes.

**Solutions:**
- Reduce `maxForce`
- Implement momentum-based steering
- Add steering velocity smoothing

```typescript
// Smooth steering over multiple frames
private steeringHistory: Vector2D[] = [];
private smoothingFrames: number = 3;

smoothSteering(newSteering: Vector2D): Vector2D {
  this.steeringHistory.push(newSteering);
  if (this.steeringHistory.length > this.smoothingFrames) {
    this.steeringHistory.shift();
  }

  let avgSteering = new Vector2D(0, 0);
  for (const s of this.steeringHistory) {
    avgSteering = avgSteering.add(s);
  }
  return avgSteering.divide(this.steeringHistory.length);
}
```

## Summary

The Boids algorithm demonstrates how complex emergent behavior can arise from simple rules. Key takeaways:

1. **Three Core Rules**: Separation, alignment, and cohesion form the foundation of flocking behavior
2. **Spatial Partitioning**: Essential for scaling to large numbers of boids (use spatial hashing or quadtrees)
3. **Flow Fields**: Provide efficient global guidance for navigation and pathfinding
4. **Parameter Tuning**: The balance of weights dramatically affects behavior - experiment to find the right feel
5. **Extensibility**: The basic algorithm easily extends with obstacle avoidance, leader following, and goal-seeking

Whether you are creating schools of fish in an underwater game, swarms of enemies in a shooter, or realistic crowd simulations, the Boids algorithm provides a powerful and flexible foundation for natural-looking group movement.

## Further Reading

### Original Research
- Reynolds, Craig. "Flocks, Herds, and Schools: A Distributed Behavioral Model." SIGGRAPH 1987

### Books
- "The Nature of Code" by Daniel Shiffman - Excellent practical guide with Processing/p5.js examples
- "AI for Games" by Ian Millington - Comprehensive coverage of steering behaviors

### Online Resources
- [Craig Reynolds' Boids Page](http://www.red3d.com/cwr/boids/)
- [Daniel Shiffman's Coding Train - Flocking Simulation](https://thecodingtrain.com/CodingChallenges/124-flocking-boids.html)
- [Sebastian Lague's Boids Tutorial](https://www.youtube.com/watch?v=bqtqltqcQhw)

### Related Topics
- Steering Behaviors (seek, flee, arrive, wander)
- A* Pathfinding
- NavMesh and Navigation Systems
- Particle Systems
- Agent-Based Modeling
