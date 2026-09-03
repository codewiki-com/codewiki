---
title: 群体行为与 Boids 算法
description: 实现自然的群体运动：分离、对齐、聚合和流场技术
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - Boids
  - 群体行为
  - 群体AI
  - 模拟
status: imported
origin: old/src/content/docs/gamedev/flocking-boids.zh.md
divergence: 0.23
issues: []
legacy:
  category: GameDev
  subcategory: AI
  order: 20
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 Boids

Boids（Bird-oid objects，类鸟对象）是由 Craig Reynolds 在 1986 年提出的人工生命程序，用于模拟鸟群、鱼群等自然界中的群体行为。这个算法的精妙之处在于：通过简单的局部规则，产生了复杂且自然的群体涌现行为（Emergent Behavior）。

> "简单规则产生复杂行为" —— 这正是 Boids 算法的核心哲学。

### 历史背景

Craig Reynolds 在 SIGGRAPH 1987 发表的论文《Flocks, Herds, and Schools: A Distributed Behavioral Model》中首次描述了这一算法。此后，Boids 被广泛应用于：

- **电影特效**：《蝙蝠侠归来》（1992）中的蝙蝠群和企鹅群
- **游戏开发**：大量 RTS 游戏中的单位移动
- **科学研究**：生物行为模拟、群体智能研究
- **艺术创作**：生成艺术、互动装置

### 核心三规则

Boids 算法的核心是三条简单规则：

| 规则 | 英文 | 描述 | 作用 |
|------|------|------|------|
| 分离 | Separation | 避免与邻近个体碰撞 | 防止聚集过密 |
| 对齐 | Alignment | 与邻近个体保持相同方向 | 形成统一运动 |
| 聚合 | Cohesion | 向邻近个体的中心移动 | 保持群体完整 |

```
        分离 (Separation)           对齐 (Alignment)           聚合 (Cohesion)

             ↑                         → → →                      * * *
           ← * →                       → * →                        ↘ ↓ ↙
             ↓                         → → →                          *

        远离邻居                    跟随邻居方向                 靠近群体中心
```

---

## 基础实现

### 向量数学基础

在实现 Boids 之前，我们需要一个基础的向量类：

```javascript
class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  // 向量加法
  add(v) {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  // 向量减法
  sub(v) {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  // 标量乘法
  mult(scalar) {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  // 标量除法
  div(scalar) {
    if (scalar === 0) return new Vector2(0, 0);
    return new Vector2(this.x / scalar, this.y / scalar);
  }

  // 向量长度
  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  // 向量长度的平方（避免开方运算，提高性能）
  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  // 归一化（单位向量）
  normalize() {
    const m = this.mag();
    if (m === 0) return new Vector2(0, 0);
    return this.div(m);
  }

  // 限制向量长度
  limit(max) {
    if (this.magSq() > max * max) {
      return this.normalize().mult(max);
    }
    return new Vector2(this.x, this.y);
  }

  // 设置向量长度
  setMag(mag) {
    return this.normalize().mult(mag);
  }

  // 两点间距离
  dist(v) {
    return this.sub(v).mag();
  }

  // 两点间距离的平方
  distSq(v) {
    return this.sub(v).magSq();
  }

  // 向量夹角（弧度）
  heading() {
    return Math.atan2(this.y, this.x);
  }

  // 从角度创建向量
  static fromAngle(angle, length = 1) {
    return new Vector2(Math.cos(angle) * length, Math.sin(angle) * length);
  }

  // 随机单位向量
  static random() {
    const angle = Math.random() * Math.PI * 2;
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }

  // 复制向量
  copy() {
    return new Vector2(this.x, this.y);
  }
}
```

### 基础 Boid 类

```javascript
class Boid {
  constructor(x, y) {
    this.position = new Vector2(x, y);
    this.velocity = Vector2.random().mult(2 + Math.random() * 2);
    this.acceleration = new Vector2(0, 0);

    // 物理参数
    this.maxSpeed = 4;      // 最大速度
    this.maxForce = 0.1;    // 最大转向力

    // 感知范围
    this.perceptionRadius = 50;  // 感知半径
    this.separationRadius = 25;  // 分离半径（通常小于感知半径）
  }

  // 应用力（牛顿第二定律 F = ma，假设质量为1）
  applyForce(force) {
    this.acceleration = this.acceleration.add(force);
  }

  // 更新位置和速度
  update() {
    this.velocity = this.velocity.add(this.acceleration);
    this.velocity = this.velocity.limit(this.maxSpeed);
    this.position = this.position.add(this.velocity);
    this.acceleration = new Vector2(0, 0); // 重置加速度
  }

  // 边界环绕（从一边出去从另一边进来）
  wrapEdges(width, height) {
    if (this.position.x < 0) this.position.x = width;
    if (this.position.x > width) this.position.x = 0;
    if (this.position.y < 0) this.position.y = height;
    if (this.position.y > height) this.position.y = 0;
  }

  // 渲染
  draw(ctx) {
    const angle = this.velocity.heading();
    const size = 10;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(angle);

    // 绘制三角形
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.5, -size * 0.4);
    ctx.lineTo(-size * 0.5, size * 0.4);
    ctx.closePath();

    ctx.fillStyle = '#3498db';
    ctx.fill();
    ctx.restore();
  }
}
```

### 三大核心规则实现

```javascript
class Boid {
  // ... 前面的代码 ...

  // 分离：避免与邻近个体碰撞
  separation(boids) {
    let steering = new Vector2(0, 0);
    let count = 0;

    for (const other of boids) {
      const d = this.position.dist(other.position);

      // 在分离半径内且不是自己
      if (other !== this && d < this.separationRadius && d > 0) {
        // 计算远离邻居的向量
        let diff = this.position.sub(other.position);
        diff = diff.normalize();
        diff = diff.div(d); // 距离越近，推力越大
        steering = steering.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steering = steering.div(count);
      steering = steering.setMag(this.maxSpeed);
      steering = steering.sub(this.velocity);
      steering = steering.limit(this.maxForce);
    }

    return steering;
  }

  // 对齐：与邻近个体保持相同方向
  alignment(boids) {
    let steering = new Vector2(0, 0);
    let count = 0;

    for (const other of boids) {
      const d = this.position.dist(other.position);

      // 在感知半径内且不是自己
      if (other !== this && d < this.perceptionRadius) {
        steering = steering.add(other.velocity);
        count++;
      }
    }

    if (count > 0) {
      steering = steering.div(count);          // 平均速度
      steering = steering.setMag(this.maxSpeed); // 设置为期望速度
      steering = steering.sub(this.velocity);    // Reynolds 转向公式
      steering = steering.limit(this.maxForce);
    }

    return steering;
  }

  // 聚合：向邻近个体的中心移动
  cohesion(boids) {
    let center = new Vector2(0, 0);
    let count = 0;

    for (const other of boids) {
      const d = this.position.dist(other.position);

      // 在感知半径内且不是自己
      if (other !== this && d < this.perceptionRadius) {
        center = center.add(other.position);
        count++;
      }
    }

    if (count > 0) {
      center = center.div(count); // 邻居的平均位置（质心）

      // 计算指向质心的转向力
      let steering = center.sub(this.position);
      steering = steering.setMag(this.maxSpeed);
      steering = steering.sub(this.velocity);
      steering = steering.limit(this.maxForce);

      return steering;
    }

    return new Vector2(0, 0);
  }

  // 应用群体行为（合并三个规则）
  flock(boids) {
    const separation = this.separation(boids);
    const alignment = this.alignment(boids);
    const cohesion = this.cohesion(boids);

    // 权重调整（非常重要！）
    const sepWeight = 1.5;  // 分离权重较高，防止碰撞
    const aliWeight = 1.0;  // 对齐权重
    const cohWeight = 1.0;  // 聚合权重

    this.applyForce(separation.mult(sepWeight));
    this.applyForce(alignment.mult(aliWeight));
    this.applyForce(cohesion.mult(cohWeight));
  }
}
```

### 群体管理器

```javascript
class FlockSimulation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.boids = [];

    // 初始化群体
    this.initBoids(100);
  }

  initBoids(count) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      this.boids.push(new Boid(x, y));
    }
  }

  update() {
    for (const boid of this.boids) {
      boid.flock(this.boids);
      boid.update();
      boid.wrapEdges(this.canvas.width, this.canvas.height);
    }
  }

  render() {
    // 清空画布
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制所有 Boid
    for (const boid of this.boids) {
      boid.draw(this.ctx);
    }
  }

  run() {
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    loop();
  }
}

// 使用
const canvas = document.getElementById('canvas');
canvas.width = 800;
canvas.height = 600;

const simulation = new FlockSimulation(canvas);
simulation.run();
```

---

## 避障行为

### 基础避障

除了基础的三规则，实际应用中还需要避障能力：

```javascript
class Boid {
  // ... 前面的代码 ...

  // 避开障碍物
  avoidObstacles(obstacles) {
    let steering = new Vector2(0, 0);

    for (const obstacle of obstacles) {
      const d = this.position.dist(obstacle.position);
      const avoidRadius = obstacle.radius + 30; // 安全距离

      if (d < avoidRadius) {
        let diff = this.position.sub(obstacle.position);
        diff = diff.normalize();

        // 距离越近，推力越大（指数级增长）
        const strength = Math.pow((avoidRadius - d) / avoidRadius, 2);
        diff = diff.mult(strength * this.maxSpeed);

        steering = steering.add(diff);
      }
    }

    if (steering.mag() > 0) {
      steering = steering.setMag(this.maxSpeed);
      steering = steering.sub(this.velocity);
      steering = steering.limit(this.maxForce * 2); // 避障力可以更大
    }

    return steering;
  }
}

// 障碍物类
class Obstacle {
  constructor(x, y, radius) {
    this.position = new Vector2(x, y);
    this.radius = radius;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
  }
}
```

### 预测性避障（Look-Ahead）

更高级的避障会考虑未来位置：

```javascript
class Boid {
  // 预测性避障
  predictiveAvoidance(obstacles, lookAheadTime = 1.0) {
    let steering = new Vector2(0, 0);

    // 预测未来位置
    const futurePosition = this.position.add(
      this.velocity.mult(lookAheadTime * this.maxSpeed)
    );

    for (const obstacle of obstacles) {
      // 计算到障碍物的最近点
      const toObstacle = obstacle.position.sub(this.position);
      const ahead = this.velocity.normalize();

      // 投影到速度方向上
      const projection = ahead.mult(
        Math.max(0, toObstacle.x * ahead.x + toObstacle.y * ahead.y)
      );
      const closestPoint = this.position.add(projection);

      // 检查最近点是否在前方且在碰撞范围内
      const distToClosest = closestPoint.dist(obstacle.position);
      const avoidRadius = obstacle.radius + 20;

      if (distToClosest < avoidRadius &&
          projection.mag() < lookAheadTime * this.maxSpeed) {

        // 计算避让方向（垂直于速度）
        let avoidDir = closestPoint.sub(obstacle.position).normalize();

        // 如果方向太小，选择一个垂直方向
        if (avoidDir.mag() < 0.1) {
          avoidDir = new Vector2(-ahead.y, ahead.x);
        }

        const urgency = 1 - (distToClosest / avoidRadius);
        steering = steering.add(avoidDir.mult(urgency * this.maxSpeed));
      }
    }

    if (steering.mag() > 0) {
      steering = steering.setMag(this.maxSpeed);
      steering = steering.sub(this.velocity);
      steering = steering.limit(this.maxForce * 2);
    }

    return steering;
  }
}
```

### 墙壁避让

```javascript
class Boid {
  // 避开边界墙壁
  avoidWalls(width, height, margin = 50) {
    let steering = new Vector2(0, 0);
    const pos = this.position;

    // 左边界
    if (pos.x < margin) {
      const d = pos.x;
      const strength = (margin - d) / margin;
      steering = steering.add(new Vector2(strength * this.maxSpeed, 0));
    }
    // 右边界
    if (pos.x > width - margin) {
      const d = width - pos.x;
      const strength = (margin - d) / margin;
      steering = steering.add(new Vector2(-strength * this.maxSpeed, 0));
    }
    // 上边界
    if (pos.y < margin) {
      const d = pos.y;
      const strength = (margin - d) / margin;
      steering = steering.add(new Vector2(0, strength * this.maxSpeed));
    }
    // 下边界
    if (pos.y > height - margin) {
      const d = height - pos.y;
      const strength = (margin - d) / margin;
      steering = steering.add(new Vector2(0, -strength * this.maxSpeed));
    }

    if (steering.mag() > 0) {
      steering = steering.setMag(this.maxSpeed);
      steering = steering.sub(this.velocity);
      steering = steering.limit(this.maxForce * 2);
    }

    return steering;
  }
}
```

---

## 领导者跟随

### 简单的领导者跟随

```javascript
class Leader extends Boid {
  constructor(x, y) {
    super(x, y);
    this.maxSpeed = 3;
    this.target = null;
  }

  // 领导者可以被鼠标控制
  seek(target) {
    let desired = target.sub(this.position);
    desired = desired.setMag(this.maxSpeed);

    let steering = desired.sub(this.velocity);
    steering = steering.limit(this.maxForce);

    return steering;
  }

  // 到达行为（接近目标时减速）
  arrive(target, slowRadius = 100) {
    let desired = target.sub(this.position);
    const d = desired.mag();

    if (d < slowRadius) {
      // 在减速区域内，速度与距离成正比
      const speed = (d / slowRadius) * this.maxSpeed;
      desired = desired.setMag(speed);
    } else {
      desired = desired.setMag(this.maxSpeed);
    }

    let steering = desired.sub(this.velocity);
    steering = steering.limit(this.maxForce);

    return steering;
  }

  draw(ctx) {
    const angle = this.velocity.heading();
    const size = 15;

    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.5, -size * 0.5);
    ctx.lineTo(-size * 0.5, size * 0.5);
    ctx.closePath();

    ctx.fillStyle = '#f39c12'; // 领导者用不同颜色
    ctx.fill();
    ctx.restore();
  }
}
```

### 跟随者行为

```javascript
class Follower extends Boid {
  constructor(x, y, leader) {
    super(x, y);
    this.leader = leader;
    this.followDistance = 80; // 跟随距离
  }

  // 跟随领导者
  followLeader() {
    // 计算领导者后方的跟随点
    const behind = this.leader.velocity.copy()
      .normalize()
      .mult(-this.followDistance);
    const target = this.leader.position.add(behind);

    // 寻找目标点
    return this.arrive(target, 50);
  }

  // 避开领导者前方区域
  avoidLeaderPath() {
    const ahead = this.leader.velocity.copy()
      .normalize()
      .mult(30);
    const leaderAhead = this.leader.position.add(ahead);

    const d = this.position.dist(leaderAhead);
    if (d < 40) {
      let flee = this.position.sub(leaderAhead);
      flee = flee.setMag(this.maxSpeed);
      return flee.sub(this.velocity).limit(this.maxForce);
    }

    return new Vector2(0, 0);
  }

  arrive(target, slowRadius = 100) {
    let desired = target.sub(this.position);
    const d = desired.mag();

    if (d < slowRadius) {
      const speed = (d / slowRadius) * this.maxSpeed;
      desired = desired.setMag(speed);
    } else {
      desired = desired.setMag(this.maxSpeed);
    }

    let steering = desired.sub(this.velocity);
    steering = steering.limit(this.maxForce);

    return steering;
  }

  flock(boids) {
    // 基础群体行为
    const separation = this.separation(boids).mult(1.5);
    const alignment = this.alignment(boids).mult(0.5);
    const cohesion = this.cohesion(boids).mult(0.5);

    // 领导者跟随
    const follow = this.followLeader().mult(2.0);
    const avoidPath = this.avoidLeaderPath().mult(1.0);

    this.applyForce(separation);
    this.applyForce(alignment);
    this.applyForce(cohesion);
    this.applyForce(follow);
    this.applyForce(avoidPath);
  }
}
```

### 队形系统

```javascript
class FormationManager {
  constructor(leader) {
    this.leader = leader;
    this.followers = [];
    this.formationType = 'v'; // 'v', 'line', 'circle', 'wedge'
  }

  addFollower(follower) {
    follower.formationIndex = this.followers.length;
    this.followers.push(follower);
  }

  // 计算队形中的目标位置
  getFormationPosition(index) {
    const leaderPos = this.leader.position;
    const leaderDir = this.leader.velocity.normalize();
    const perpDir = new Vector2(-leaderDir.y, leaderDir.x);

    const spacing = 40;

    switch (this.formationType) {
      case 'v': // V字队形
        const row = Math.floor((index + 1) / 2);
        const side = (index % 2 === 0) ? 1 : -1;
        return leaderPos
          .add(leaderDir.mult(-row * spacing))
          .add(perpDir.mult(side * row * spacing * 0.8));

      case 'line': // 直线队形
        return leaderPos.add(leaderDir.mult(-(index + 1) * spacing));

      case 'circle': // 圆形队形
        const angle = (index / this.followers.length) * Math.PI * 2;
        const radius = spacing * 2;
        return leaderPos.add(new Vector2(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius
        ));

      case 'wedge': // 楔形队形
        const wedgeRow = Math.floor((index + 1) / 2);
        const wedgeSide = (index % 2 === 0) ? 1 : -1;
        return leaderPos
          .add(leaderDir.mult(-wedgeRow * spacing))
          .add(perpDir.mult(wedgeSide * spacing * 0.5));

      default:
        return leaderPos;
    }
  }

  update() {
    for (let i = 0; i < this.followers.length; i++) {
      const follower = this.followers[i];
      const targetPos = this.getFormationPosition(i);
      follower.targetPosition = targetPos;
    }
  }
}

// 支持队形的跟随者
class FormationFollower extends Boid {
  constructor(x, y) {
    super(x, y);
    this.targetPosition = null;
    this.formationIndex = 0;
  }

  seekFormationPosition() {
    if (!this.targetPosition) return new Vector2(0, 0);
    return this.arrive(this.targetPosition, 30);
  }

  flock(boids) {
    const separation = this.separation(boids).mult(2.0);
    const formation = this.seekFormationPosition().mult(1.5);

    this.applyForce(separation);
    this.applyForce(formation);
  }
}
```

---

## 流场寻路

### 流场基础

流场（Flow Field）是一种高效的群体寻路技术，预计算整个地图的移动方向：

```javascript
class FlowField {
  constructor(width, height, cellSize) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);

    // 流场数据（每个格子存储一个方向向量）
    this.field = new Array(this.cols * this.rows);

    // 初始化为零向量
    for (let i = 0; i < this.field.length; i++) {
      this.field[i] = new Vector2(0, 0);
    }
  }

  // 获取格子索引
  getIndex(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return -1;
    }
    return row * this.cols + col;
  }

  // 世界坐标转格子坐标
  worldToGrid(x, y) {
    return {
      col: Math.floor(x / this.cellSize),
      row: Math.floor(y / this.cellSize)
    };
  }

  // 获取某位置的流场方向
  lookup(position) {
    const { col, row } = this.worldToGrid(position.x, position.y);
    const index = this.getIndex(col, row);

    if (index === -1) return new Vector2(0, 0);
    return this.field[index].copy();
  }

  // 设置某格子的方向
  setDirection(col, row, direction) {
    const index = this.getIndex(col, row);
    if (index !== -1) {
      this.field[index] = direction.normalize();
    }
  }

  // 使用 Perlin Noise 生成自然流场
  generatePerlinField(time = 0) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        // 使用简化的噪声（实际应用中使用真正的 Perlin Noise）
        const angle = this.simpleNoise(col * 0.1, row * 0.1, time) * Math.PI * 2;
        const direction = Vector2.fromAngle(angle);
        this.setDirection(col, row, direction);
      }
    }
  }

  // 简化的噪声函数
  simpleNoise(x, y, z = 0) {
    const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
    return n - Math.floor(n);
  }

  // 可视化流场
  draw(ctx) {
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = 1;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const index = this.getIndex(col, row);
        const dir = this.field[index];

        const x = col * this.cellSize + this.cellSize / 2;
        const y = row * this.cellSize + this.cellSize / 2;
        const len = this.cellSize * 0.4;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dir.x * len, y + dir.y * len);
        ctx.stroke();

        // 绘制箭头
        const arrowSize = 3;
        const angle = dir.heading();
        ctx.beginPath();
        ctx.moveTo(x + dir.x * len, y + dir.y * len);
        ctx.lineTo(
          x + dir.x * len - arrowSize * Math.cos(angle - 0.5),
          y + dir.y * len - arrowSize * Math.sin(angle - 0.5)
        );
        ctx.lineTo(
          x + dir.x * len - arrowSize * Math.cos(angle + 0.5),
          y + dir.y * len - arrowSize * Math.sin(angle + 0.5)
        );
        ctx.closePath();
        ctx.fill();
      }
    }
  }
}
```

### 基于目标的流场生成

```javascript
class PathFlowField extends FlowField {
  constructor(width, height, cellSize) {
    super(width, height, cellSize);
    this.costField = new Array(this.cols * this.rows).fill(Infinity);
    this.obstacles = new Set();
  }

  // 添加障碍物
  addObstacle(col, row) {
    const index = this.getIndex(col, row);
    if (index !== -1) {
      this.obstacles.add(index);
      this.costField[index] = Infinity;
    }
  }

  // 从目标点生成流场（使用 Dijkstra 算法）
  generateFromTarget(targetCol, targetRow) {
    // 重置代价场
    this.costField.fill(Infinity);

    const targetIndex = this.getIndex(targetCol, targetRow);
    if (targetIndex === -1) return;

    // 优先队列（简化实现）
    const queue = [{ col: targetCol, row: targetRow, cost: 0 }];
    this.costField[targetIndex] = 0;

    // 四方向邻居
    const directions = [
      { dc: 0, dr: -1 }, // 上
      { dc: 0, dr: 1 },  // 下
      { dc: -1, dr: 0 }, // 左
      { dc: 1, dr: 0 },  // 右
      { dc: -1, dr: -1 }, // 左上
      { dc: 1, dr: -1 },  // 右上
      { dc: -1, dr: 1 },  // 左下
      { dc: 1, dr: 1 }    // 右下
    ];

    // Dijkstra 遍历
    while (queue.length > 0) {
      // 取出代价最小的节点
      queue.sort((a, b) => a.cost - b.cost);
      const current = queue.shift();

      for (const dir of directions) {
        const newCol = current.col + dir.dc;
        const newRow = current.row + dir.dr;
        const newIndex = this.getIndex(newCol, newRow);

        if (newIndex === -1 || this.obstacles.has(newIndex)) continue;

        // 对角线移动代价更高
        const moveCost = (dir.dc !== 0 && dir.dr !== 0) ? 1.414 : 1;
        const newCost = current.cost + moveCost;

        if (newCost < this.costField[newIndex]) {
          this.costField[newIndex] = newCost;
          queue.push({ col: newCol, row: newRow, cost: newCost });
        }
      }
    }

    // 根据代价场生成方向场
    this.generateDirectionField();
  }

  // 根据代价场生成方向场
  generateDirectionField() {
    const directions = [
      { dc: 0, dr: -1 },
      { dc: 0, dr: 1 },
      { dc: -1, dr: 0 },
      { dc: 1, dr: 0 },
      { dc: -1, dr: -1 },
      { dc: 1, dr: -1 },
      { dc: -1, dr: 1 },
      { dc: 1, dr: 1 }
    ];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const index = this.getIndex(col, row);

        if (this.obstacles.has(index) || this.costField[index] === Infinity) {
          this.field[index] = new Vector2(0, 0);
          continue;
        }

        // 找到代价最低的邻居
        let minCost = this.costField[index];
        let bestDir = new Vector2(0, 0);

        for (const dir of directions) {
          const neighborCol = col + dir.dc;
          const neighborRow = row + dir.dr;
          const neighborIndex = this.getIndex(neighborCol, neighborRow);

          if (neighborIndex === -1) continue;

          if (this.costField[neighborIndex] < minCost) {
            minCost = this.costField[neighborIndex];
            bestDir = new Vector2(dir.dc, dir.dr);
          }
        }

        this.field[index] = bestDir.normalize();
      }
    }
  }
}
```

### Boid 跟随流场

```javascript
class FlowFieldBoid extends Boid {
  constructor(x, y, flowField) {
    super(x, y);
    this.flowField = flowField;
    this.flowWeight = 1.5; // 流场权重
  }

  // 跟随流场
  followFlowField() {
    const desired = this.flowField.lookup(this.position);

    if (desired.mag() === 0) return new Vector2(0, 0);

    desired.setMag(this.maxSpeed);
    let steering = desired.sub(this.velocity);
    steering = steering.limit(this.maxForce);

    return steering;
  }

  flock(boids) {
    const separation = this.separation(boids).mult(1.5);
    const alignment = this.alignment(boids).mult(0.8);
    const cohesion = this.cohesion(boids).mult(0.8);
    const flow = this.followFlowField().mult(this.flowWeight);

    this.applyForce(separation);
    this.applyForce(alignment);
    this.applyForce(cohesion);
    this.applyForce(flow);
  }
}
```

---

## 空间分区优化

### 性能问题分析

基础 Boids 实现的时间复杂度是 O(n^2)，因为每个 Boid 都要检查所有其他 Boid。当 n=1000 时，每帧需要进行 1,000,000 次距离计算，这是不可接受的。

### 网格空间分区

```javascript
class SpatialGrid {
  constructor(width, height, cellSize) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.cells = new Array(this.cols * this.rows);

    this.clear();
  }

  clear() {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = [];
    }
  }

  // 获取格子索引
  getCellIndex(x, y) {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return -1;
    }

    return row * this.cols + col;
  }

  // 插入对象
  insert(obj) {
    const index = this.getCellIndex(obj.position.x, obj.position.y);
    if (index !== -1) {
      this.cells[index].push(obj);
    }
  }

  // 查询范围内的所有对象
  query(x, y, radius) {
    const results = [];

    // 计算需要检查的格子范围
    const minCol = Math.max(0, Math.floor((x - radius) / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
    const minRow = Math.max(0, Math.floor((y - radius) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));

    const radiusSq = radius * radius;

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const cell = this.cells[row * this.cols + col];

        for (const obj of cell) {
          const dx = obj.position.x - x;
          const dy = obj.position.y - y;
          const distSq = dx * dx + dy * dy;

          if (distSq <= radiusSq) {
            results.push(obj);
          }
        }
      }
    }

    return results;
  }
}

// 优化后的群体模拟
class OptimizedFlockSimulation {
  constructor(canvas, boidCount = 500) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.boids = [];

    // 空间分区网格（格子大小应该接近感知半径）
    this.grid = new SpatialGrid(canvas.width, canvas.height, 60);

    this.initBoids(boidCount);
  }

  initBoids(count) {
    for (let i = 0; i < count; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      this.boids.push(new OptimizedBoid(x, y));
    }
  }

  update() {
    // 重建空间分区
    this.grid.clear();
    for (const boid of this.boids) {
      this.grid.insert(boid);
    }

    // 更新每个 Boid
    for (const boid of this.boids) {
      // 只查询附近的 Boid
      const neighbors = this.grid.query(
        boid.position.x,
        boid.position.y,
        boid.perceptionRadius
      );

      boid.flock(neighbors);
      boid.update();
      boid.wrapEdges(this.canvas.width, this.canvas.height);
    }
  }

  render() {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const boid of this.boids) {
      boid.draw(this.ctx);
    }
  }

  run() {
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    loop();
  }
}
```

### 四叉树空间分区

对于分布不均匀的情况，四叉树可能更高效：

```javascript
class QuadTree {
  constructor(boundary, capacity = 4) {
    this.boundary = boundary; // { x, y, w, h }
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
    this.northwest = null;
    this.northeast = null;
    this.southwest = null;
    this.southeast = null;
  }

  // 检查点是否在边界内
  contains(point) {
    return (
      point.position.x >= this.boundary.x - this.boundary.w &&
      point.position.x < this.boundary.x + this.boundary.w &&
      point.position.y >= this.boundary.y - this.boundary.h &&
      point.position.y < this.boundary.y + this.boundary.h
    );
  }

  // 检查范围是否与边界相交
  intersects(range) {
    return !(
      range.x - range.w > this.boundary.x + this.boundary.w ||
      range.x + range.w < this.boundary.x - this.boundary.w ||
      range.y - range.h > this.boundary.y + this.boundary.h ||
      range.y + range.h < this.boundary.y - this.boundary.h
    );
  }

  // 细分
  subdivide() {
    const x = this.boundary.x;
    const y = this.boundary.y;
    const w = this.boundary.w / 2;
    const h = this.boundary.h / 2;

    this.northwest = new QuadTree({ x: x - w, y: y - h, w, h }, this.capacity);
    this.northeast = new QuadTree({ x: x + w, y: y - h, w, h }, this.capacity);
    this.southwest = new QuadTree({ x: x - w, y: y + h, w, h }, this.capacity);
    this.southeast = new QuadTree({ x: x + w, y: y + h, w, h }, this.capacity);

    this.divided = true;
  }

  // 插入点
  insert(point) {
    if (!this.contains(point)) {
      return false;
    }

    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    return (
      this.northwest.insert(point) ||
      this.northeast.insert(point) ||
      this.southwest.insert(point) ||
      this.southeast.insert(point)
    );
  }

  // 查询范围内的点
  query(range, found = []) {
    if (!this.intersects(range)) {
      return found;
    }

    for (const point of this.points) {
      const dx = point.position.x - range.x;
      const dy = point.position.y - range.y;
      if (dx * dx + dy * dy <= range.w * range.w) {
        found.push(point);
      }
    }

    if (this.divided) {
      this.northwest.query(range, found);
      this.northeast.query(range, found);
      this.southwest.query(range, found);
      this.southeast.query(range, found);
    }

    return found;
  }

  // 清空
  clear() {
    this.points = [];
    this.divided = false;
    this.northwest = null;
    this.northeast = null;
    this.southwest = null;
    this.southeast = null;
  }
}
```

### 性能对比

| 方法 | 时间复杂度 | 空间复杂度 | 适用场景 |
|------|-----------|-----------|---------|
| 暴力遍历 | O(n^2) | O(1) | n < 100 |
| 网格分区 | O(n * k) | O(n + cells) | 均匀分布 |
| 四叉树 | O(n * log n) | O(n) | 不均匀分布 |
| KD树 | O(n * log n) | O(n) | 静态场景 |

*其中 k 是平均每个格子的对象数量*

---

## 大规模群体模拟

### 批量渲染优化

```javascript
class BatchRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 预渲染 Boid 图像
    this.boidImage = this.createBoidImage();
  }

  createBoidImage() {
    const size = 20;
    const offscreen = document.createElement('canvas');
    offscreen.width = size;
    offscreen.height = size;
    const ctx = offscreen.getContext('2d');

    ctx.translate(size / 2, size / 2);

    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-4, 4);
    ctx.closePath();

    ctx.fillStyle = '#3498db';
    ctx.fill();

    return offscreen;
  }

  render(boids) {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const boid of boids) {
      this.ctx.save();
      this.ctx.translate(boid.position.x, boid.position.y);
      this.ctx.rotate(boid.velocity.heading());
      this.ctx.drawImage(this.boidImage, -10, -10);
      this.ctx.restore();
    }
  }
}
```

### Web Worker 多线程

```javascript
// main.js
class WorkerFlockSimulation {
  constructor(canvas, boidCount = 2000) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.boidCount = boidCount;

    // 创建 Worker
    this.worker = new Worker('boid-worker.js');
    this.worker.onmessage = (e) => this.onWorkerMessage(e);

    // 初始化
    this.worker.postMessage({
      type: 'init',
      data: {
        count: boidCount,
        width: canvas.width,
        height: canvas.height
      }
    });

    this.boidsData = null;
  }

  onWorkerMessage(e) {
    if (e.data.type === 'update') {
      this.boidsData = e.data.data;
      this.render();
      this.requestUpdate();
    }
  }

  requestUpdate() {
    this.worker.postMessage({ type: 'update' });
  }

  render() {
    if (!this.boidsData) return;

    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#3498db';

    // 批量绘制（简化为点）
    for (let i = 0; i < this.boidsData.length; i += 4) {
      const x = this.boidsData[i];
      const y = this.boidsData[i + 1];

      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  start() {
    this.requestUpdate();
  }
}

// boid-worker.js
let boids = [];
let grid = null;
let width = 0;
let height = 0;

self.onmessage = function(e) {
  if (e.data.type === 'init') {
    init(e.data.data);
  } else if (e.data.type === 'update') {
    update();
  }
};

function init(config) {
  width = config.width;
  height = config.height;

  // 使用 TypedArray 存储数据以提高性能
  boids = [];
  for (let i = 0; i < config.count; i++) {
    boids.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4
    });
  }

  grid = new SimpleGrid(width, height, 60);
}

function update() {
  // 重建空间分区
  grid.clear();
  for (const boid of boids) {
    grid.insert(boid);
  }

  // 更新每个 Boid
  for (const boid of boids) {
    const neighbors = grid.query(boid.x, boid.y, 50);
    updateBoid(boid, neighbors);
  }

  // 发送位置数据
  const data = new Float32Array(boids.length * 4);
  for (let i = 0; i < boids.length; i++) {
    data[i * 4] = boids[i].x;
    data[i * 4 + 1] = boids[i].y;
    data[i * 4 + 2] = boids[i].vx;
    data[i * 4 + 3] = boids[i].vy;
  }

  self.postMessage({ type: 'update', data: data }, [data.buffer]);
}

function updateBoid(boid, neighbors) {
  // 简化的 Boid 逻辑
  let sepX = 0, sepY = 0, sepCount = 0;
  let aliX = 0, aliY = 0, aliCount = 0;
  let cohX = 0, cohY = 0, cohCount = 0;

  for (const other of neighbors) {
    if (other === boid) continue;

    const dx = boid.x - other.x;
    const dy = boid.y - other.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < 625) { // 分离半径 25^2
      const dist = Math.sqrt(distSq);
      sepX += dx / dist;
      sepY += dy / dist;
      sepCount++;
    }

    if (distSq < 2500) { // 感知半径 50^2
      aliX += other.vx;
      aliY += other.vy;
      aliCount++;

      cohX += other.x;
      cohY += other.y;
      cohCount++;
    }
  }

  let ax = 0, ay = 0;

  // 分离
  if (sepCount > 0) {
    ax += (sepX / sepCount) * 0.15;
    ay += (sepY / sepCount) * 0.15;
  }

  // 对齐
  if (aliCount > 0) {
    const avgVx = aliX / aliCount - boid.vx;
    const avgVy = aliY / aliCount - boid.vy;
    ax += avgVx * 0.1;
    ay += avgVy * 0.1;
  }

  // 聚合
  if (cohCount > 0) {
    const avgX = cohX / cohCount - boid.x;
    const avgY = cohY / cohCount - boid.y;
    ax += avgX * 0.01;
    ay += avgY * 0.01;
  }

  // 更新速度和位置
  boid.vx += ax;
  boid.vy += ay;

  // 限制速度
  const speed = Math.sqrt(boid.vx * boid.vx + boid.vy * boid.vy);
  if (speed > 4) {
    boid.vx = (boid.vx / speed) * 4;
    boid.vy = (boid.vy / speed) * 4;
  }

  boid.x += boid.vx;
  boid.y += boid.vy;

  // 边界环绕
  if (boid.x < 0) boid.x += width;
  if (boid.x > width) boid.x -= width;
  if (boid.y < 0) boid.y += height;
  if (boid.y > height) boid.y -= height;
}

// 简化的网格类
class SimpleGrid {
  constructor(width, height, cellSize) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.cells = new Array(this.cols * this.rows);
    this.clear();
  }

  clear() {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = [];
    }
  }

  insert(obj) {
    const col = Math.floor(obj.x / this.cellSize);
    const row = Math.floor(obj.y / this.cellSize);
    if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
      this.cells[row * this.cols + col].push(obj);
    }
  }

  query(x, y, radius) {
    const results = [];
    const minCol = Math.max(0, Math.floor((x - radius) / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
    const minRow = Math.max(0, Math.floor((y - radius) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        for (const obj of this.cells[row * this.cols + col]) {
          results.push(obj);
        }
      }
    }

    return results;
  }
}
```

### GPU 计算（WebGL/WebGPU）

对于超大规模模拟（10000+），可以使用 GPU 计算：

```javascript
// 使用 WebGL 计算着色器的概念示例
class GPUBoidSimulation {
  constructor(canvas, count = 10000) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2');
    this.count = count;

    if (!this.gl) {
      throw new Error('WebGL2 not supported');
    }

    this.initBuffers();
    this.initShaders();
  }

  initBuffers() {
    const gl = this.gl;

    // 初始化位置和速度数据
    const positions = new Float32Array(this.count * 2);
    const velocities = new Float32Array(this.count * 2);

    for (let i = 0; i < this.count; i++) {
      positions[i * 2] = Math.random() * this.canvas.width;
      positions[i * 2 + 1] = Math.random() * this.canvas.height;
      velocities[i * 2] = (Math.random() - 0.5) * 4;
      velocities[i * 2 + 1] = (Math.random() - 0.5) * 4;
    }

    // 创建纹理存储数据（用于 Transform Feedback）
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);

    this.velocityBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.velocityBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, velocities, gl.DYNAMIC_DRAW);
  }

  initShaders() {
    // Transform Feedback 着色器用于 GPU 计算
    // 这里是简化示例，实际实现需要更复杂的着色器
    const updateVertexShader = `#version 300 es
      in vec2 a_position;
      in vec2 a_velocity;

      uniform vec2 u_resolution;
      uniform float u_deltaTime;

      out vec2 v_position;
      out vec2 v_velocity;

      void main() {
        // 简化的更新逻辑
        v_velocity = a_velocity;
        v_position = a_position + v_velocity * u_deltaTime;

        // 边界环绕
        v_position = mod(v_position, u_resolution);

        gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
        gl_PointSize = 1.0;
      }
    `;

    // 编译和链接着色器...
  }

  update(deltaTime) {
    // 使用 Transform Feedback 进行 GPU 计算
    // 这需要双缓冲和 VAO 切换
  }

  render() {
    // 使用点精灵渲染
  }
}
```

---

## 实际应用场景

### 游戏中的敌人群体

```javascript
class EnemySwarm {
  constructor(scene) {
    this.enemies = [];
    this.player = null;
    this.attackRange = 100;
    this.fleeHealth = 20;
  }

  createEnemy(x, y) {
    const enemy = new SwarmEnemy(x, y);
    this.enemies.push(enemy);
    return enemy;
  }

  update(player) {
    this.player = player;

    // 重建空间分区
    this.updateSpatialPartition();

    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;

      const neighbors = this.getNeighbors(enemy);

      // 基础群体行为
      enemy.flock(neighbors);

      // 战术行为
      if (enemy.health < this.fleeHealth) {
        // 低血量逃跑
        enemy.applyForce(enemy.flee(player.position).mult(2.0));
      } else {
        const distToPlayer = enemy.position.dist(player.position);

        if (distToPlayer < this.attackRange) {
          // 攻击范围内，围绕玩家
          enemy.applyForce(enemy.orbit(player.position, 80).mult(1.5));
        } else {
          // 追击玩家
          enemy.applyForce(enemy.seek(player.position).mult(1.0));
        }
      }

      enemy.update();
    }
  }

  // 清理死亡敌人
  cleanup() {
    this.enemies = this.enemies.filter(e => !e.isDead);
  }
}

class SwarmEnemy extends Boid {
  constructor(x, y) {
    super(x, y);
    this.health = 100;
    this.damage = 10;
    this.isDead = false;
  }

  // 逃离行为
  flee(target) {
    let desired = this.position.sub(target);
    desired = desired.setMag(this.maxSpeed);

    let steering = desired.sub(this.velocity);
    steering = steering.limit(this.maxForce);

    return steering;
  }

  // 围绕目标旋转
  orbit(center, radius) {
    const toCenter = center.sub(this.position);
    const dist = toCenter.mag();

    if (dist < radius * 0.8) {
      // 太近，远离
      return this.flee(center);
    } else if (dist > radius * 1.2) {
      // 太远，靠近
      return this.seek(center);
    } else {
      // 切向运动
      const tangent = new Vector2(-toCenter.y, toCenter.x).normalize();
      let steering = tangent.mult(this.maxSpeed).sub(this.velocity);
      return steering.limit(this.maxForce);
    }
  }

  seek(target) {
    let desired = target.sub(this.position);
    desired = desired.setMag(this.maxSpeed);

    let steering = desired.sub(this.velocity);
    steering = steering.limit(this.maxForce);

    return steering;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.isDead = true;
    }
  }
}
```

### 粒子特效系统

```javascript
class BoidParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.attractors = [];
  }

  emit(x, y, count = 50) {
    for (let i = 0; i < count; i++) {
      const particle = new BoidParticle(
        x + (Math.random() - 0.5) * 20,
        y + (Math.random() - 0.5) * 20
      );
      this.particles.push(particle);
    }
  }

  addAttractor(x, y, strength = 1) {
    this.attractors.push({ x, y, strength });
  }

  update() {
    // 空间分区
    const grid = new SpatialGrid(this.canvas.width, this.canvas.height, 40);
    for (const p of this.particles) {
      grid.insert(p);
    }

    for (const particle of this.particles) {
      // 群体行为
      const neighbors = grid.query(
        particle.position.x,
        particle.position.y,
        particle.perceptionRadius
      );
      particle.flock(neighbors);

      // 吸引子
      for (const attractor of this.attractors) {
        particle.applyForce(
          particle.attract(attractor).mult(attractor.strength)
        );
      }

      particle.update();

      // 边界处理
      this.handleBounds(particle);
    }

    // 移除死亡粒子
    this.particles = this.particles.filter(p => p.life > 0);
  }

  handleBounds(particle) {
    particle.wrapEdges(this.canvas.width, this.canvas.height);
  }

  render() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const particle of this.particles) {
      particle.draw(this.ctx);
    }

    // 绘制吸引子
    this.ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
    for (const attractor of this.attractors) {
      this.ctx.beginPath();
      this.ctx.arc(attractor.x, attractor.y, 10, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}

class BoidParticle extends Boid {
  constructor(x, y) {
    super(x, y);
    this.life = 1.0;
    this.decay = 0.001 + Math.random() * 0.002;
    this.size = 2 + Math.random() * 3;
    this.hue = Math.random() * 60 + 180; // 蓝-青色系
  }

  attract(target) {
    let desired = new Vector2(target.x, target.y).sub(this.position);
    const d = desired.mag();

    if (d < 200) {
      desired = desired.setMag(this.maxSpeed * (1 - d / 200));
      let steering = desired.sub(this.velocity);
      return steering.limit(this.maxForce);
    }

    return new Vector2(0, 0);
  }

  update() {
    super.update();
    this.life -= this.decay;
  }

  draw(ctx) {
    const alpha = Math.min(1, this.life * 2);

    ctx.save();
    ctx.globalAlpha = alpha;

    // 发光效果
    const gradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, this.size * 2
    );
    gradient.addColorStop(0, `hsla(${this.hue}, 100%, 70%, 1)`);
    gradient.addColorStop(1, `hsla(${this.hue}, 100%, 50%, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size * 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
```

### 交通模拟

```javascript
class VehicleBoid extends Boid {
  constructor(x, y, road) {
    super(x, y);
    this.road = road;
    this.maxSpeed = 3 + Math.random() * 2;
    this.brakingForce = 0.3;
    this.targetLane = 0;
    this.width = 20;
    this.length = 40;
  }

  // 保持在道路上
  stayOnRoad() {
    const roadCenter = this.road.getCenterAt(this.position.x);
    const laneOffset = this.targetLane * this.road.laneWidth;

    const targetY = roadCenter + laneOffset;
    const diff = targetY - this.position.y;

    return new Vector2(0, diff * 0.1);
  }

  // 保持车距
  maintainDistance(vehicles) {
    let steering = new Vector2(0, 0);

    for (const other of vehicles) {
      if (other === this) continue;

      // 只考虑前方车辆
      const toOther = other.position.sub(this.position);
      const ahead = this.velocity.normalize();
      const dot = toOther.x * ahead.x + toOther.y * ahead.y;

      if (dot > 0 && dot < 100) {
        // 前方有车
        const lateralDist = Math.abs(toOther.y);

        if (lateralDist < this.road.laneWidth) {
          // 同车道，减速
          const urgency = 1 - (dot / 100);
          steering = steering.add(ahead.mult(-urgency * this.brakingForce));
        }
      }
    }

    return steering;
  }

  // 变道决策
  decideLaneChange(vehicles) {
    // 检查是否需要变道（前方堵塞）
    let blocked = false;

    for (const other of vehicles) {
      if (other === this) continue;

      const toOther = other.position.sub(this.position);
      if (toOther.x > 0 && toOther.x < 60 &&
          Math.abs(toOther.y) < this.road.laneWidth) {
        if (other.velocity.mag() < this.velocity.mag() * 0.8) {
          blocked = true;
          break;
        }
      }
    }

    if (blocked && Math.random() < 0.01) {
      // 尝试变道
      const newLane = this.targetLane + (Math.random() > 0.5 ? 1 : -1);
      if (newLane >= 0 && newLane < this.road.laneCount) {
        // 检查目标车道是否安全
        if (this.isLaneSafe(vehicles, newLane)) {
          this.targetLane = newLane;
        }
      }
    }
  }

  isLaneSafe(vehicles, lane) {
    const laneY = this.road.getCenterAt(this.position.x) +
                  lane * this.road.laneWidth;

    for (const other of vehicles) {
      if (other === this) continue;

      const dx = Math.abs(other.position.x - this.position.x);
      const dy = Math.abs(other.position.y - laneY);

      if (dx < 80 && dy < this.road.laneWidth * 0.8) {
        return false;
      }
    }

    return true;
  }

  update(vehicles) {
    const roadForce = this.stayOnRoad();
    const distanceForce = this.maintainDistance(vehicles);

    this.applyForce(roadForce.mult(1.0));
    this.applyForce(distanceForce.mult(2.0));

    // 前进力
    this.applyForce(new Vector2(0.1, 0));

    this.decideLaneChange(vehicles);

    super.update();
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.velocity.heading());

    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(-this.length / 2, -this.width / 2, this.length, this.width);

    // 车窗
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(this.length / 4, -this.width / 2 + 3, this.length / 5, this.width - 6);

    ctx.restore();
  }
}
```

---

## 参数调优指南

### 核心参数

| 参数 | 描述 | 典型范围 | 影响 |
|------|------|----------|------|
| maxSpeed | 最大速度 | 2-8 | 群体整体移动速度 |
| maxForce | 最大转向力 | 0.05-0.3 | 转向灵敏度 |
| perceptionRadius | 感知半径 | 30-100 | 群体紧密度 |
| separationRadius | 分离半径 | 15-50 | 个体间距 |
| separationWeight | 分离权重 | 1.0-2.5 | 防碰撞强度 |
| alignmentWeight | 对齐权重 | 0.5-1.5 | 方向一致性 |
| cohesionWeight | 聚合权重 | 0.5-1.5 | 群体凝聚力 |

### 不同效果的参数配置

```javascript
// 紧密鱼群
const tightSchool = {
  maxSpeed: 3,
  maxForce: 0.2,
  perceptionRadius: 40,
  separationRadius: 15,
  separationWeight: 2.0,
  alignmentWeight: 1.5,
  cohesionWeight: 1.5
};

// 松散鸟群
const looseFlock = {
  maxSpeed: 5,
  maxForce: 0.1,
  perceptionRadius: 80,
  separationRadius: 30,
  separationWeight: 1.2,
  alignmentWeight: 1.0,
  cohesionWeight: 0.8
};

// 蜂群（快速、混乱）
const swarm = {
  maxSpeed: 6,
  maxForce: 0.3,
  perceptionRadius: 30,
  separationRadius: 10,
  separationWeight: 1.5,
  alignmentWeight: 0.5,
  cohesionWeight: 0.3
};

// 迁徙队形
const migration = {
  maxSpeed: 4,
  maxForce: 0.05,
  perceptionRadius: 100,
  separationRadius: 40,
  separationWeight: 1.0,
  alignmentWeight: 2.0,
  cohesionWeight: 1.0
};
```

### 调参建议

1. **从分离开始**：首先确保分离规则工作正常，防止个体重叠
2. **逐步增加复杂性**：先调好单一规则，再组合
3. **使用可视化调试**：绘制感知范围、力向量等
4. **考虑帧率独立**：使用 deltaTime 乘以速度和力
5. **测试极端情况**：大量个体、边界情况、单个个体

```javascript
// 调试渲染
class DebugRenderer {
  static drawPerceptionRadius(ctx, boid) {
    ctx.strokeStyle = 'rgba(100, 200, 100, 0.2)';
    ctx.beginPath();
    ctx.arc(boid.position.x, boid.position.y, boid.perceptionRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  static drawSeparationRadius(ctx, boid) {
    ctx.strokeStyle = 'rgba(200, 100, 100, 0.3)';
    ctx.beginPath();
    ctx.arc(boid.position.x, boid.position.y, boid.separationRadius, 0, Math.PI * 2);
    ctx.stroke();
  }

  static drawVelocity(ctx, boid) {
    ctx.strokeStyle = '#3498db';
    ctx.beginPath();
    ctx.moveTo(boid.position.x, boid.position.y);
    ctx.lineTo(
      boid.position.x + boid.velocity.x * 10,
      boid.position.y + boid.velocity.y * 10
    );
    ctx.stroke();
  }

  static drawForce(ctx, boid, force, color = '#e74c3c') {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(boid.position.x, boid.position.y);
    ctx.lineTo(
      boid.position.x + force.x * 50,
      boid.position.y + force.y * 50
    );
    ctx.stroke();
  }
}
```

---

## 面试要点

### 常见面试问题

**Q1: 什么是 Boids 算法？它的核心规则是什么？**

Boids 是一种模拟群体行为的算法，由 Craig Reynolds 在 1986 年提出。核心三规则：
- **分离（Separation）**：避免与邻近个体碰撞
- **对齐（Alignment）**：与邻近个体保持相同方向
- **聚合（Cohesion）**：向邻近个体的中心移动

这三条简单规则组合产生了复杂的涌现行为。

**Q2: 如何优化 Boids 算法的性能？**

1. **空间分区**：使用网格或四叉树，将 O(n^2) 降为 O(n * k)
2. **距离平方比较**：避免开方运算
3. **批量渲染**：使用预渲染图像或实例化渲染
4. **Web Worker**：将计算移到后台线程
5. **GPU 计算**：使用 WebGL/WebGPU 进行并行计算
6. **视锥剔除**：只更新可见区域的个体

**Q3: 分离和聚合不会相互抵消吗？**

不会，因为：
- 分离在较近距离（separationRadius）生效
- 聚合在较远距离（perceptionRadius）生效
- 两者作用于不同的距离范围
- 权重可以调整优先级

**Q4: 如何实现避障功能？**

1. **简单避障**：检测到障碍物后施加反向力
2. **预测性避障**：基于当前速度预测未来位置
3. **流场避障**：预计算绕过障碍物的路径

**Q5: 流场和直接寻路的区别是什么？**

| 特性 | 流场 | 直接寻路（A*） |
|------|------|---------------|
| 计算时机 | 预计算 | 实时计算 |
| 适用场景 | 大量单位、相同目标 | 少量单位、不同目标 |
| 内存占用 | 较高（存储整个场） | 较低 |
| 路径质量 | 平滑自然 | 最优但可能生硬 |
| 动态障碍 | 需要重新计算 | 容易处理 |

### 代码实现要点

```javascript
// 面试中可能要求手写的核心代码

// 1. 向量操作
class Vector2 {
  add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
  mult(s) { return new Vector2(this.x * s, this.y * s); }
  mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  normalize() { const m = this.mag(); return m ? this.mult(1/m) : new Vector2(); }
  limit(max) {
    if (this.magSq() > max * max) return this.normalize().mult(max);
    return this;
  }
}

// 2. 转向力计算（Reynolds 公式）
function steer(desired, velocity, maxSpeed, maxForce) {
  desired = desired.setMag(maxSpeed);      // 期望速度
  let steering = desired.sub(velocity);     // 转向 = 期望 - 当前
  return steering.limit(maxForce);          // 限制力大小
}

// 3. 空间分区查询
function queryNeighbors(grid, position, radius) {
  const results = [];
  const minCol = Math.floor((position.x - radius) / cellSize);
  const maxCol = Math.floor((position.x + radius) / cellSize);
  // ... 遍历相关格子
  return results;
}
```

---

## 延伸阅读

### 推荐资源

- **原始论文**：Craig Reynolds - "Flocks, Herds, and Schools: A Distributed Behavioral Model" (1987)
- **在线演示**：[The Nature of Code - Autonomous Agents](https://natureofcode.com/book/chapter-6-autonomous-agents/)
- **开源实现**：
  - [p5.js Flocking](https://p5js.org/examples/simulate-flocking.html)
  - [Three.js Boids](https://threejs.org/examples/webgl_gpgpu_birds.html)

### 进阶主题

- **3D Boids**：扩展到三维空间
- **异构群体**：不同类型个体的交互
- **捕食者-猎物模型**：生态系统模拟
- **ORCA（Optimal Reciprocal Collision Avoidance）**：更精确的避碰算法
- **RVO（Reciprocal Velocity Obstacles）**：速度障碍物方法

---

## 总结

Boids 算法展示了复杂性科学的核心理念：简单规则产生复杂行为。通过分离、对齐、聚合三条基本规则，我们可以模拟出自然界中令人惊叹的群体运动。

在实际应用中，需要注意：

1. **性能优化是关键**：空间分区是必须的
2. **参数调优需要耐心**：不同效果需要不同配置
3. **扩展性很重要**：避障、领导者跟随等扩展行为
4. **考虑实际需求**：游戏 AI、粒子特效、交通模拟各有侧重

掌握 Boids 算法不仅能帮助你实现生动的群体效果，更重要的是理解了涌现行为和自组织系统的基本原理，这对于游戏 AI 开发和复杂系统设计都有重要价值。
