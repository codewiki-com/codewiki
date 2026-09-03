---
title: 2D 物理引擎与平台游戏
description: 掌握2D游戏物理：Box2D原理、平台游戏物理和碰撞响应
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - 2D物理
  - Box2D
  - 平台游戏
  - 碰撞
status: imported
origin: old/src/content/docs/gamedev/2d-physics.zh.md
divergence: 0.187
issues: []
legacy:
  category: GameDev
  subcategory: 2D
  order: 27
  lastUpdated: 2026-01-07
---

2D 物理引擎是游戏开发中不可或缺的核心组件,它模拟现实世界的物理规律,让游戏对象具有真实的运动、碰撞和交互行为。本文将深入探讨 Box2D 物理引擎的原理、平台游戏物理实现以及碰撞响应系统的设计。

## 概念解释：为什么需要物理引擎

### 物理引擎的核心职责

物理引擎负责模拟以下物理现象：

1. **刚体动力学**：模拟物体的运动、旋转、加速度等
2. **碰撞检测**：判断物体之间是否发生接触
3. **碰撞响应**：计算碰撞后物体的反应（弹跳、停止等）
4. **约束系统**：关节、弹簧、马达等连接方式
5. **力与冲量**：重力、推力、摩擦力的应用

### 常见 2D 物理引擎

| 引擎 | 语言 | 特点 | 适用场景 |
|------|------|------|----------|
| Box2D | C++ | 最成熟、最广泛使用 | 各类 2D 游戏 |
| Matter.js | JavaScript | Web 友好、易上手 | Web 游戏、原型开发 |
| Chipmunk | C | 轻量高效 | 移动游戏 |
| Planck.js | JavaScript | Box2D 的 JS 移植 | Web 游戏 |
| Rapier | Rust | 现代化、高性能 | 性能敏感的游戏 |

---

## Box2D 架构解析

Box2D 是由 Erin Catto 开发的开源 2D 物理引擎,被广泛应用于《愤怒的小鸟》等知名游戏中。

### 核心组件

```
World (物理世界)
├── Body (刚体)
│   ├── Fixture (夹具)
│   │   ├── Shape (形状)
│   │   └── Material (材质属性)
│   └── Transform (位置和旋转)
├── Joint (关节)
└── Contact (碰撞接触)
```

### 创建物理世界

```javascript
// 使用 Planck.js (Box2D 的 JavaScript 版本)
import { World, Vec2 } from 'planck-js';

// 创建世界,设置重力
const world = new World({
  gravity: Vec2(0, -10) // 向下的重力,单位 m/s²
});

// 物理模拟配置
const TIME_STEP = 1 / 60;           // 固定时间步长
const VELOCITY_ITERATIONS = 8;      // 速度迭代次数
const POSITION_ITERATIONS = 3;      // 位置迭代次数

// 游戏循环中更新物理
function update() {
  world.step(TIME_STEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS);
}
```

### 坐标系统与单位

Box2D 使用米-千克-秒 (MKS) 单位制：

```javascript
// 像素与米的转换
const PIXELS_PER_METER = 32; // 32像素 = 1米

// 像素转米
function pixelsToMeters(pixels) {
  return pixels / PIXELS_PER_METER;
}

// 米转像素
function metersToPixels(meters) {
  return meters * PIXELS_PER_METER;
}

// Box2D 坐标转屏幕坐标
function worldToScreen(worldPos, canvasHeight) {
  return {
    x: metersToPixels(worldPos.x),
    y: canvasHeight - metersToPixels(worldPos.y) // Y轴翻转
  };
}
```

---

## 刚体类型详解

Box2D 定义了三种刚体类型,每种都有不同的物理行为。

### 静态刚体 (Static Body)

静态刚体不会移动,用于地面、墙壁等固定障碍物。

```javascript
import { World, Vec2, Box } from 'planck-js';

// 创建地面（静态刚体）
function createGround(world, x, y, width, height) {
  const ground = world.createBody({
    type: 'static',
    position: Vec2(x, y)
  });

  ground.createFixture({
    shape: Box(width / 2, height / 2), // 半宽和半高
    friction: 0.6,
    restitution: 0.0
  });

  return ground;
}

// 创建墙壁
function createWalls(world, worldWidth, worldHeight) {
  // 地面
  createGround(world, worldWidth / 2, 0.5, worldWidth, 1);
  // 左墙
  createGround(world, 0.5, worldHeight / 2, 1, worldHeight);
  // 右墙
  createGround(world, worldWidth - 0.5, worldHeight / 2, 1, worldHeight);
  // 天花板
  createGround(world, worldWidth / 2, worldHeight - 0.5, worldWidth, 1);
}
```

### 动态刚体 (Dynamic Body)

动态刚体受力和碰撞影响,会自由移动。

```javascript
// 创建玩家角色（动态刚体）
function createPlayer(world, x, y) {
  const player = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y),
    fixedRotation: true,    // 禁止旋转,平台游戏常用
    linearDamping: 0.0,     // 线性阻尼
    angularDamping: 0.0     // 角度阻尼
  });

  // 主要碰撞体
  player.createFixture({
    shape: Box(0.4, 0.9),   // 玩家尺寸
    density: 1.0,           // 密度,影响质量
    friction: 0.3,          // 摩擦系数
    restitution: 0.0        // 弹性系数
  });

  return player;
}

// 创建可拾取的物品
function createItem(world, x, y) {
  const item = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y),
    bullet: false,          // 是否为高速物体（子弹）
    allowSleep: true        // 允许休眠以提高性能
  });

  item.createFixture({
    shape: Circle(0.3),
    density: 0.5,
    friction: 0.5,
    restitution: 0.6        // 较高弹性
  });

  return item;
}
```

### 运动学刚体 (Kinematic Body)

运动学刚体按预设路径移动,不受力影响,但会与动态刚体碰撞。

```javascript
import { Vec2, Box } from 'planck-js';

// 创建移动平台
class MovingPlatform {
  constructor(world, startX, startY, endX, endY, width, height, speed) {
    this.body = world.createBody({
      type: 'kinematic',
      position: Vec2(startX, startY)
    });

    this.body.createFixture({
      shape: Box(width / 2, height / 2),
      friction: 0.8
    });

    this.startPos = Vec2(startX, startY);
    this.endPos = Vec2(endX, endY);
    this.speed = speed;
    this.direction = 1;
  }

  update(deltaTime) {
    const currentPos = this.body.getPosition();
    const targetPos = this.direction > 0 ? this.endPos : this.startPos;

    // 计算移动方向
    const diff = Vec2.sub(targetPos, currentPos);
    const distance = diff.length();

    if (distance < 0.1) {
      // 到达目标,反向
      this.direction *= -1;
    } else {
      // 设置速度
      diff.normalize();
      diff.mul(this.speed);
      this.body.setLinearVelocity(diff);
    }
  }
}

// 创建旋转平台
class RotatingPlatform {
  constructor(world, x, y, width, height, angularSpeed) {
    this.body = world.createBody({
      type: 'kinematic',
      position: Vec2(x, y)
    });

    this.body.createFixture({
      shape: Box(width / 2, height / 2),
      friction: 0.6
    });

    this.body.setAngularVelocity(angularSpeed);
  }
}
```

---

## 碰撞形状

Box2D 支持多种碰撞形状,每种都有其特定用途。

### 基本形状

```javascript
import { Box, Circle, Polygon, Edge, Chain } from 'planck-js';

// 矩形（最常用）
const boxShape = Box(1.0, 0.5); // 半宽1米,半高0.5米

// 圆形
const circleShape = Circle(0.5); // 半径0.5米
const offsetCircle = Circle(Vec2(0.5, 0), 0.3); // 带偏移的圆

// 多边形（最多8个顶点）
const triangleShape = Polygon([
  Vec2(0, 1),
  Vec2(-1, -1),
  Vec2(1, -1)
]);

// 凸多边形
const hexagonShape = Polygon([
  Vec2(0.5, 0),
  Vec2(0.25, 0.43),
  Vec2(-0.25, 0.43),
  Vec2(-0.5, 0),
  Vec2(-0.25, -0.43),
  Vec2(0.25, -0.43)
]);

// 边缘（用于地形）
const edgeShape = Edge(Vec2(-10, 0), Vec2(10, 0));

// 链形（连续的边缘,用于复杂地形）
const chainShape = Chain([
  Vec2(-5, 0),
  Vec2(-3, 1),
  Vec2(0, 0),
  Vec2(3, 2),
  Vec2(5, 0)
], false); // false表示开放链,true表示闭合
```

### 复合形状

对于复杂形状,可以使用多个夹具组合：

```javascript
// 创建L形状的刚体
function createLShape(world, x, y) {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y)
  });

  // 垂直部分
  body.createFixture({
    shape: Box(0.5, 1.5, Vec2(0, 0.75), 0),
    density: 1.0
  });

  // 水平部分
  body.createFixture({
    shape: Box(1.0, 0.5, Vec2(0.5, -0.75), 0),
    density: 1.0
  });

  return body;
}

// 创建胶囊形状（常用于角色）
function createCapsule(world, x, y, width, height) {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y),
    fixedRotation: true
  });

  const radius = width / 2;
  const rectHeight = height - width;

  // 中间矩形部分
  body.createFixture({
    shape: Box(radius, rectHeight / 2),
    density: 1.0,
    friction: 0.3
  });

  // 顶部圆形
  body.createFixture({
    shape: Circle(Vec2(0, rectHeight / 2), radius),
    density: 1.0,
    friction: 0.3
  });

  // 底部圆形
  body.createFixture({
    shape: Circle(Vec2(0, -rectHeight / 2), radius),
    density: 1.0,
    friction: 0.3
  });

  return body;
}
```

---

## 关节类型

关节用于连接两个刚体,创建复杂的物理交互。

### 距离关节 (Distance Joint)

保持两个刚体之间的固定距离：

```javascript
import { DistanceJoint, Vec2 } from 'planck-js';

function createRope(world, bodyA, bodyB, anchorA, anchorB) {
  const joint = world.createJoint(DistanceJoint({
    bodyA: bodyA,
    bodyB: bodyB,
    localAnchorA: anchorA,
    localAnchorB: anchorB,
    length: 3.0,          // 目标距离
    frequencyHz: 4.0,     // 弹簧频率（0表示刚性）
    dampingRatio: 0.5     // 阻尼比
  }));

  return joint;
}

// 创建绳桥
function createRopeBridge(world, startX, endX, y, segments) {
  const segmentWidth = (endX - startX) / segments;
  const bodies = [];

  // 创建锚点
  const leftAnchor = world.createBody({
    type: 'static',
    position: Vec2(startX, y)
  });

  const rightAnchor = world.createBody({
    type: 'static',
    position: Vec2(endX, y)
  });

  // 创建桥段
  for (let i = 0; i < segments; i++) {
    const body = world.createBody({
      type: 'dynamic',
      position: Vec2(startX + segmentWidth * (i + 0.5), y)
    });

    body.createFixture({
      shape: Box(segmentWidth / 2, 0.1),
      density: 1.0,
      friction: 0.6
    });

    bodies.push(body);
  }

  // 连接关节
  for (let i = 0; i < bodies.length; i++) {
    const prevBody = i === 0 ? leftAnchor : bodies[i - 1];
    const currBody = bodies[i];

    world.createJoint(DistanceJoint({
      bodyA: prevBody,
      bodyB: currBody,
      localAnchorA: Vec2(i === 0 ? 0 : segmentWidth / 2, 0),
      localAnchorB: Vec2(-segmentWidth / 2, 0),
      frequencyHz: 2.0,
      dampingRatio: 0.5
    }));
  }

  // 连接最后一段到右锚点
  world.createJoint(DistanceJoint({
    bodyA: bodies[bodies.length - 1],
    bodyB: rightAnchor,
    localAnchorA: Vec2(segmentWidth / 2, 0),
    localAnchorB: Vec2(0, 0),
    frequencyHz: 2.0,
    dampingRatio: 0.5
  }));

  return bodies;
}
```

### 旋转关节 (Revolute Joint)

允许两个刚体围绕一个点旋转：

```javascript
import { RevoluteJoint, Vec2 } from 'planck-js';

// 创建门
function createDoor(world, hingeX, hingeY, width, height) {
  // 门框（静态）
  const frame = world.createBody({
    type: 'static',
    position: Vec2(hingeX, hingeY)
  });

  // 门扇（动态）
  const door = world.createBody({
    type: 'dynamic',
    position: Vec2(hingeX + width / 2, hingeY)
  });

  door.createFixture({
    shape: Box(width / 2, height / 2),
    density: 2.0
  });

  // 旋转关节
  const joint = world.createJoint(RevoluteJoint({
    bodyA: frame,
    bodyB: door,
    localAnchorA: Vec2(0, 0),
    localAnchorB: Vec2(-width / 2, 0),
    lowerAngle: -Math.PI / 2,    // 最小角度
    upperAngle: Math.PI / 2,      // 最大角度
    enableLimit: true,            // 启用角度限制
    enableMotor: false,           // 是否启用马达
    motorSpeed: 0,
    maxMotorTorque: 0
  }));

  return { door, joint };
}

// 创建带马达的风车
function createWindmill(world, x, y, bladeLength) {
  const base = world.createBody({
    type: 'static',
    position: Vec2(x, y)
  });

  const blade = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y)
  });

  // 创建四个叶片
  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i;
    blade.createFixture({
      shape: Box(0.1, bladeLength / 2, Vec2(0, bladeLength / 2).rotate(angle), angle),
      density: 0.5
    });
  }

  world.createJoint(RevoluteJoint({
    bodyA: base,
    bodyB: blade,
    localAnchorA: Vec2(0, 0),
    localAnchorB: Vec2(0, 0),
    enableMotor: true,
    motorSpeed: 2.0,           // 目标角速度 rad/s
    maxMotorTorque: 100        // 最大扭矩
  }));

  return blade;
}
```

### 滑轮关节 (Pulley Joint)

模拟滑轮系统：

```javascript
import { PulleyJoint, Vec2 } from 'planck-js';

function createPulleySystem(world) {
  // 左侧重物
  const leftBlock = world.createBody({
    type: 'dynamic',
    position: Vec2(-2, 5)
  });
  leftBlock.createFixture({
    shape: Box(0.5, 0.5),
    density: 2.0
  });

  // 右侧重物
  const rightBlock = world.createBody({
    type: 'dynamic',
    position: Vec2(2, 5)
  });
  rightBlock.createFixture({
    shape: Box(0.5, 0.5),
    density: 1.0
  });

  // 创建滑轮关节
  world.createJoint(PulleyJoint({
    bodyA: leftBlock,
    bodyB: rightBlock,
    groundAnchorA: Vec2(-2, 10),   // 左滑轮位置
    groundAnchorB: Vec2(2, 10),    // 右滑轮位置
    localAnchorA: Vec2(0, 0.5),    // 左绳连接点
    localAnchorB: Vec2(0, 0.5),    // 右绳连接点
    lengthA: 5,                     // 左绳长度
    lengthB: 5,                     // 右绳长度
    ratio: 1.0                      // 传动比
  }));

  return { leftBlock, rightBlock };
}
```

### 焊接关节 (Weld Joint)

将两个刚体固定在一起：

```javascript
import { WeldJoint, Vec2 } from 'planck-js';

// 创建可破坏的连接
function createBreakableJoint(world, bodyA, bodyB, anchorPoint, breakForce) {
  const joint = world.createJoint(WeldJoint({
    bodyA: bodyA,
    bodyB: bodyB,
    localAnchorA: bodyA.getLocalPoint(anchorPoint),
    localAnchorB: bodyB.getLocalPoint(anchorPoint),
    referenceAngle: bodyB.getAngle() - bodyA.getAngle(),
    frequencyHz: 0,      // 刚性连接
    dampingRatio: 0
  }));

  joint.breakForce = breakForce;
  joint.userData = { type: 'breakable' };

  return joint;
}

// 在更新循环中检查断裂
function checkBreakableJoints(world) {
  for (let joint = world.getJointList(); joint; joint = joint.getNext()) {
    if (joint.userData && joint.userData.type === 'breakable') {
      const reactionForce = joint.getReactionForce(1 / 60);
      const forceMagnitude = reactionForce.length();

      if (forceMagnitude > joint.breakForce) {
        world.destroyJoint(joint);
        // 播放破碎效果
        createBreakParticles(joint.getAnchorA());
      }
    }
  }
}
```

---

## 平台游戏物理

平台游戏需要精确、响应灵敏的物理控制,通常需要自定义物理行为。

### 角色控制器

```javascript
class PlatformerController {
  constructor(world, x, y) {
    // 创建角色刚体
    this.body = world.createBody({
      type: 'dynamic',
      position: Vec2(x, y),
      fixedRotation: true,
      bullet: true  // 防止高速穿墙
    });

    // 主碰撞体
    this.body.createFixture({
      shape: Box(0.4, 0.9),
      density: 1.0,
      friction: 0.0,  // 使用自定义摩擦
      userData: { type: 'player' }
    });

    // 脚部传感器（用于地面检测）
    this.footSensor = this.body.createFixture({
      shape: Box(0.35, 0.1, Vec2(0, -0.95), 0),
      isSensor: true,
      userData: { type: 'footSensor' }
    });

    // 状态
    this.grounded = false;
    this.groundContacts = 0;
    this.canJump = true;
    this.jumpCooldown = 0;
    this.coyoteTime = 0;        // 土狼时间（离开平台后仍可跳跃的时间）
    this.jumpBufferTime = 0;     // 跳跃缓冲（提前按跳跃键）

    // 物理参数
    this.moveSpeed = 8;
    this.jumpForce = 12;
    this.airControl = 0.3;       // 空中控制力度
    this.maxFallSpeed = 20;
  }

  update(input, deltaTime) {
    const velocity = this.body.getLinearVelocity();

    // 更新计时器
    if (!this.grounded) {
      this.coyoteTime -= deltaTime;
    } else {
      this.coyoteTime = 0.1; // 100ms 土狼时间
    }

    if (this.jumpBufferTime > 0) {
      this.jumpBufferTime -= deltaTime;
    }

    // 水平移动
    this.handleHorizontalMovement(input, velocity);

    // 跳跃
    this.handleJump(input, velocity);

    // 限制下落速度
    if (velocity.y < -this.maxFallSpeed) {
      this.body.setLinearVelocity(Vec2(velocity.x, -this.maxFallSpeed));
    }

    // 可变跳跃高度（松开跳跃键时减速）
    if (!input.jump && velocity.y > 0) {
      this.body.setLinearVelocity(Vec2(velocity.x, velocity.y * 0.5));
    }
  }

  handleHorizontalMovement(input, velocity) {
    const targetSpeed = input.horizontal * this.moveSpeed;
    const speedDiff = targetSpeed - velocity.x;

    // 地面和空中使用不同的加速度
    const accel = this.grounded ? 1.0 : this.airControl;
    const force = speedDiff * accel * this.body.getMass();

    this.body.applyForce(Vec2(force, 0), this.body.getWorldCenter(), true);

    // 立即停止（当没有输入且在地面时）
    if (input.horizontal === 0 && this.grounded) {
      this.body.setLinearVelocity(Vec2(velocity.x * 0.8, velocity.y));
    }
  }

  handleJump(input) {
    // 记录跳跃输入
    if (input.jumpPressed) {
      this.jumpBufferTime = 0.1; // 100ms 跳跃缓冲
    }

    // 执行跳跃
    const canJump = this.grounded || this.coyoteTime > 0;
    const wantsJump = this.jumpBufferTime > 0;

    if (canJump && wantsJump && this.jumpCooldown <= 0) {
      this.body.setLinearVelocity(Vec2(
        this.body.getLinearVelocity().x,
        this.jumpForce
      ));

      this.coyoteTime = 0;
      this.jumpBufferTime = 0;
      this.jumpCooldown = 0.1;
      this.grounded = false;
    }
  }

  onBeginContact(contact, otherFixture) {
    if (contact.getFixtureA() === this.footSensor ||
        contact.getFixtureB() === this.footSensor) {
      this.groundContacts++;
      this.grounded = true;
    }
  }

  onEndContact(contact, otherFixture) {
    if (contact.getFixtureA() === this.footSensor ||
        contact.getFixtureB() === this.footSensor) {
      this.groundContacts--;
      if (this.groundContacts <= 0) {
        this.grounded = false;
        this.groundContacts = 0;
      }
    }
  }
}
```

### 单向平台

单向平台只在玩家从上方落下时产生碰撞：

```javascript
import { Contact, Vec2 } from 'planck-js';

class OneWayPlatform {
  constructor(world, x, y, width, height) {
    this.body = world.createBody({
      type: 'static',
      position: Vec2(x, y)
    });

    this.fixture = this.body.createFixture({
      shape: Box(width / 2, height / 2),
      friction: 0.6,
      userData: { type: 'oneWayPlatform' }
    });

    this.platformTop = y + height / 2;
  }
}

// 碰撞回调处理
function setupOneWayPlatformCollision(world) {
  world.on('pre-solve', (contact, oldManifold) => {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();

    // 检查是否涉及单向平台
    const userDataA = fixtureA.getUserData();
    const userDataB = fixtureB.getUserData();

    let platformFixture = null;
    let playerFixture = null;

    if (userDataA && userDataA.type === 'oneWayPlatform') {
      platformFixture = fixtureA;
      playerFixture = fixtureB;
    } else if (userDataB && userDataB.type === 'oneWayPlatform') {
      platformFixture = fixtureB;
      playerFixture = fixtureA;
    }

    if (!platformFixture || !playerFixture) return;

    const playerBody = playerFixture.getBody();
    const platformBody = platformFixture.getBody();

    // 获取玩家底部位置
    const playerPos = playerBody.getPosition();
    const playerVel = playerBody.getLinearVelocity();
    const playerBottom = playerPos.y - 0.9; // 根据玩家高度调整

    // 获取平台顶部位置
    const platformPos = platformBody.getPosition();
    const platformTop = platformPos.y + 0.1; // 根据平台高度调整

    // 如果玩家底部在平台顶部以下,或者玩家向上移动,禁用碰撞
    if (playerBottom < platformTop - 0.1 || playerVel.y > 0) {
      contact.setEnabled(false);
    }
  });
}

// 玩家主动穿过平台（按下+跳跃）
class PlatformController {
  constructor(world, player) {
    this.world = world;
    this.player = player;
    this.dropThroughTime = 0;
  }

  update(input, deltaTime) {
    if (this.dropThroughTime > 0) {
      this.dropThroughTime -= deltaTime;
    }

    // 按下+跳跃穿过平台
    if (input.down && input.jumpPressed && this.player.grounded) {
      this.dropThroughTime = 0.2; // 200ms内可穿过平台
    }
  }

  shouldIgnorePlatform() {
    return this.dropThroughTime > 0;
  }
}
```

### 斜坡处理

斜坡需要特殊处理以确保角色不会滑落：

```javascript
class SlopeHandler {
  constructor(player) {
    this.player = player;
    this.maxSlopeAngle = Math.PI / 4; // 45度
  }

  update() {
    if (!this.player.grounded) return;

    const velocity = this.player.body.getLinearVelocity();

    // 在斜坡上静止时施加反向力
    if (Math.abs(velocity.x) < 0.1) {
      const groundNormal = this.getGroundNormal();
      if (groundNormal) {
        const slopeAngle = Math.atan2(groundNormal.x, groundNormal.y);

        if (Math.abs(slopeAngle) > 0.01 && Math.abs(slopeAngle) < this.maxSlopeAngle) {
          // 施加抵抗滑落的力
          const antiSlideForce = this.player.body.getMass() * 10 * Math.sin(slopeAngle);
          this.player.body.applyForce(
            Vec2(-antiSlideForce, 0),
            this.player.body.getWorldCenter(),
            true
          );
        }
      }
    }
  }

  getGroundNormal() {
    // 通过射线检测获取地面法线
    const start = this.player.body.getPosition();
    const end = Vec2(start.x, start.y - 2);

    let normal = null;

    this.player.world.rayCast(start, end, (fixture, point, normalVec, fraction) => {
      normal = normalVec;
      return fraction; // 返回最近的碰撞
    });

    return normal;
  }
}
```

---

## 碰撞检测与响应

### 碰撞回调系统

```javascript
class CollisionHandler {
  constructor(world) {
    this.world = world;
    this.listeners = new Map();

    // 设置碰撞回调
    world.on('begin-contact', (contact) => this.onBeginContact(contact));
    world.on('end-contact', (contact) => this.onEndContact(contact));
    world.on('pre-solve', (contact, oldManifold) => this.onPreSolve(contact, oldManifold));
    world.on('post-solve', (contact, impulse) => this.onPostSolve(contact, impulse));
  }

  onBeginContact(contact) {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();
    const bodyA = fixtureA.getBody();
    const bodyB = fixtureB.getBody();

    const userDataA = bodyA.getUserData();
    const userDataB = bodyB.getUserData();

    // 通知双方
    if (userDataA && userDataA.onCollisionEnter) {
      userDataA.onCollisionEnter(bodyB, contact);
    }
    if (userDataB && userDataB.onCollisionEnter) {
      userDataB.onCollisionEnter(bodyA, contact);
    }

    // 触发全局事件
    this.emit('collision-enter', { bodyA, bodyB, contact });
  }

  onEndContact(contact) {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();
    const bodyA = fixtureA.getBody();
    const bodyB = fixtureB.getBody();

    const userDataA = bodyA.getUserData();
    const userDataB = bodyB.getUserData();

    if (userDataA && userDataA.onCollisionExit) {
      userDataA.onCollisionExit(bodyB, contact);
    }
    if (userDataB && userDataB.onCollisionExit) {
      userDataB.onCollisionExit(bodyA, contact);
    }

    this.emit('collision-exit', { bodyA, bodyB, contact });
  }

  onPreSolve(contact, oldManifold) {
    // 在此修改碰撞响应（例如单向平台）
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();

    const userDataA = fixtureA.getUserData();
    const userDataB = fixtureB.getUserData();

    // 检查是否需要禁用碰撞
    if (userDataA && userDataA.shouldIgnoreCollision) {
      if (userDataA.shouldIgnoreCollision(fixtureB)) {
        contact.setEnabled(false);
      }
    }
    if (userDataB && userDataB.shouldIgnoreCollision) {
      if (userDataB.shouldIgnoreCollision(fixtureA)) {
        contact.setEnabled(false);
      }
    }
  }

  onPostSolve(contact, impulse) {
    // 处理碰撞后的效果（伤害、音效等）
    const normalImpulse = impulse.normalImpulses[0];

    // 高冲量碰撞
    if (normalImpulse > 5) {
      this.emit('hard-impact', {
        contact,
        impulse: normalImpulse
      });
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
}
```

### 碰撞过滤

使用碰撞类别和掩码控制哪些物体可以碰撞：

```javascript
// 定义碰撞类别
const CollisionCategory = {
  PLAYER:     0x0001,
  ENEMY:      0x0002,
  PLATFORM:   0x0004,
  PROJECTILE: 0x0008,
  PICKUP:     0x0010,
  SENSOR:     0x0020
};

// 定义碰撞掩码（与哪些类别碰撞）
const CollisionMask = {
  PLAYER:     CollisionCategory.PLATFORM | CollisionCategory.ENEMY |
              CollisionCategory.PICKUP | CollisionCategory.PROJECTILE,
  ENEMY:      CollisionCategory.PLATFORM | CollisionCategory.PLAYER |
              CollisionCategory.PROJECTILE,
  PLATFORM:   CollisionCategory.PLAYER | CollisionCategory.ENEMY |
              CollisionCategory.PICKUP,
  PROJECTILE: CollisionCategory.PLAYER | CollisionCategory.ENEMY |
              CollisionCategory.PLATFORM,
  PICKUP:     CollisionCategory.PLAYER | CollisionCategory.PLATFORM
};

// 应用碰撞过滤
function createPlayerFixture(body) {
  body.createFixture({
    shape: Box(0.4, 0.9),
    density: 1.0,
    friction: 0.3,
    filterCategoryBits: CollisionCategory.PLAYER,
    filterMaskBits: CollisionMask.PLAYER,
    filterGroupIndex: 0 // 正数表示总是碰撞,负数表示永不碰撞
  });
}

// 动态修改碰撞过滤
function setPlayerInvincible(playerBody, invincible) {
  for (let fixture = playerBody.getFixtureList(); fixture; fixture = fixture.getNext()) {
    const filter = fixture.getFilterData();
    if (invincible) {
      filter.maskBits &= ~CollisionCategory.ENEMY;
    } else {
      filter.maskBits |= CollisionCategory.ENEMY;
    }
    fixture.setFilterData(filter);
  }
}
```

### 射线检测

射线检测用于视线检查、地面检测等：

```javascript
class RayCaster {
  constructor(world) {
    this.world = world;
  }

  // 单次射线检测,返回最近的碰撞
  castRay(start, end, filterCallback = null) {
    let result = null;
    let closestFraction = 1;

    this.world.rayCast(start, end, (fixture, point, normal, fraction) => {
      // 过滤
      if (filterCallback && !filterCallback(fixture)) {
        return -1; // 忽略此fixture,继续检测
      }

      if (fraction < closestFraction) {
        closestFraction = fraction;
        result = {
          fixture,
          point: point.clone(),
          normal: normal.clone(),
          fraction
        };
      }

      return fraction; // 继续检测更近的
    });

    return result;
  }

  // 检测所有碰撞
  castRayAll(start, end, filterCallback = null) {
    const results = [];

    this.world.rayCast(start, end, (fixture, point, normal, fraction) => {
      if (filterCallback && !filterCallback(fixture)) {
        return -1;
      }

      results.push({
        fixture,
        point: point.clone(),
        normal: normal.clone(),
        fraction
      });

      return 1; // 继续检测所有
    });

    return results.sort((a, b) => a.fraction - b.fraction);
  }

  // 地面检测
  checkGround(position, height = 1.0) {
    const start = position;
    const end = Vec2(position.x, position.y - height);

    return this.castRay(start, end, (fixture) => {
      return !fixture.isSensor();
    });
  }

  // 视线检测
  hasLineOfSight(from, to, ignoreBody = null) {
    const result = this.castRay(from, to, (fixture) => {
      if (fixture.isSensor()) return false;
      if (ignoreBody && fixture.getBody() === ignoreBody) return false;
      return true;
    });

    if (!result) return true; // 没有碰撞,有视线

    // 检查是否到达目标
    const distance = Vec2.sub(to, from).length();
    const hitDistance = result.fraction * distance;
    return hitDistance >= distance - 0.1;
  }
}
```

---

## 物理调试与可视化

### 调试渲染器

```javascript
class PhysicsDebugDraw {
  constructor(ctx, pixelsPerMeter, canvasHeight) {
    this.ctx = ctx;
    this.ppm = pixelsPerMeter;
    this.canvasHeight = canvasHeight;

    // 颜色配置
    this.colors = {
      staticBody: '#2ecc71',
      dynamicBody: '#3498db',
      kinematicBody: '#f39c12',
      sensor: 'rgba(155, 89, 182, 0.5)',
      joint: '#e74c3c',
      aabb: 'rgba(255, 255, 0, 0.3)',
      contactPoint: '#ff0000',
      contactNormal: '#00ff00'
    };

    this.showAABB = false;
    this.showContacts = true;
    this.showJoints = true;
    this.showVelocity = false;
  }

  // 坐标转换
  worldToScreen(worldPos) {
    return {
      x: worldPos.x * this.ppm,
      y: this.canvasHeight - worldPos.y * this.ppm
    };
  }

  draw(world) {
    this.ctx.save();

    // 绘制所有刚体
    for (let body = world.getBodyList(); body; body = body.getNext()) {
      this.drawBody(body);
    }

    // 绘制关节
    if (this.showJoints) {
      for (let joint = world.getJointList(); joint; joint = joint.getNext()) {
        this.drawJoint(joint);
      }
    }

    // 绘制接触点
    if (this.showContacts) {
      for (let contact = world.getContactList(); contact; contact = contact.getNext()) {
        if (contact.isTouching()) {
          this.drawContact(contact);
        }
      }
    }

    this.ctx.restore();
  }

  drawBody(body) {
    const bodyType = body.getType();
    let color;

    switch (bodyType) {
      case 'static':
        color = this.colors.staticBody;
        break;
      case 'dynamic':
        color = this.colors.dynamicBody;
        break;
      case 'kinematic':
        color = this.colors.kinematicBody;
        break;
    }

    // 绘制每个夹具
    for (let fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
      const isSensor = fixture.isSensor();
      this.drawFixture(fixture, isSensor ? this.colors.sensor : color);

      // 绘制 AABB
      if (this.showAABB) {
        this.drawAABB(fixture.getAABB(0));
      }
    }

    // 绘制速度向量
    if (this.showVelocity && bodyType === 'dynamic') {
      this.drawVelocity(body);
    }
  }

  drawFixture(fixture, color) {
    const shape = fixture.getShape();
    const body = fixture.getBody();
    const position = body.getPosition();
    const angle = body.getAngle();

    this.ctx.save();

    const screenPos = this.worldToScreen(position);
    this.ctx.translate(screenPos.x, screenPos.y);
    this.ctx.rotate(-angle);

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = color + '40'; // 半透明填充

    const shapeType = shape.getType();

    switch (shapeType) {
      case 'circle':
        this.drawCircleShape(shape);
        break;
      case 'polygon':
        this.drawPolygonShape(shape);
        break;
      case 'edge':
        this.drawEdgeShape(shape);
        break;
      case 'chain':
        this.drawChainShape(shape);
        break;
    }

    this.ctx.restore();
  }

  drawCircleShape(shape) {
    const center = shape.getCenter();
    const radius = shape.getRadius() * this.ppm;
    const screenCenter = {
      x: center.x * this.ppm,
      y: -center.y * this.ppm
    };

    this.ctx.beginPath();
    this.ctx.arc(screenCenter.x, screenCenter.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // 绘制方向指示线
    this.ctx.beginPath();
    this.ctx.moveTo(screenCenter.x, screenCenter.y);
    this.ctx.lineTo(screenCenter.x + radius, screenCenter.y);
    this.ctx.stroke();
  }

  drawPolygonShape(shape) {
    const vertices = [];
    for (let i = 0; i < shape.m_count; i++) {
      const v = shape.getVertex(i);
      vertices.push({
        x: v.x * this.ppm,
        y: -v.y * this.ppm
      });
    }

    this.ctx.beginPath();
    this.ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      this.ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  drawEdgeShape(shape) {
    const v1 = shape.m_vertex1;
    const v2 = shape.m_vertex2;

    this.ctx.beginPath();
    this.ctx.moveTo(v1.x * this.ppm, -v1.y * this.ppm);
    this.ctx.lineTo(v2.x * this.ppm, -v2.y * this.ppm);
    this.ctx.stroke();
  }

  drawChainShape(shape) {
    const vertices = shape.m_vertices;

    this.ctx.beginPath();
    this.ctx.moveTo(vertices[0].x * this.ppm, -vertices[0].y * this.ppm);
    for (let i = 1; i < vertices.length; i++) {
      this.ctx.lineTo(vertices[i].x * this.ppm, -vertices[i].y * this.ppm);
    }
    this.ctx.stroke();
  }

  drawJoint(joint) {
    const anchorA = joint.getAnchorA();
    const anchorB = joint.getAnchorB();

    const screenA = this.worldToScreen(anchorA);
    const screenB = this.worldToScreen(anchorB);

    this.ctx.strokeStyle = this.colors.joint;
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.moveTo(screenA.x, screenA.y);
    this.ctx.lineTo(screenB.x, screenB.y);
    this.ctx.stroke();

    // 绘制锚点
    this.ctx.fillStyle = this.colors.joint;
    this.ctx.beginPath();
    this.ctx.arc(screenA.x, screenA.y, 4, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(screenB.x, screenB.y, 4, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawContact(contact) {
    const worldManifold = contact.getWorldManifold(null);
    if (!worldManifold) return;

    const points = worldManifold.points;
    const normal = worldManifold.normal;

    this.ctx.fillStyle = this.colors.contactPoint;
    this.ctx.strokeStyle = this.colors.contactNormal;
    this.ctx.lineWidth = 1;

    for (const point of points) {
      const screenPoint = this.worldToScreen(point);

      // 绘制接触点
      this.ctx.beginPath();
      this.ctx.arc(screenPoint.x, screenPoint.y, 3, 0, Math.PI * 2);
      this.ctx.fill();

      // 绘制法线
      const normalEnd = Vec2.add(point, Vec2.mul(normal, 0.5));
      const screenNormalEnd = this.worldToScreen(normalEnd);

      this.ctx.beginPath();
      this.ctx.moveTo(screenPoint.x, screenPoint.y);
      this.ctx.lineTo(screenNormalEnd.x, screenNormalEnd.y);
      this.ctx.stroke();
    }
  }

  drawVelocity(body) {
    const position = body.getPosition();
    const velocity = body.getLinearVelocity();

    const screenPos = this.worldToScreen(position);
    const velocityEnd = Vec2.add(position, Vec2.mul(velocity, 0.1));
    const screenVelEnd = this.worldToScreen(velocityEnd);

    this.ctx.strokeStyle = '#ff00ff';
    this.ctx.lineWidth = 2;

    this.ctx.beginPath();
    this.ctx.moveTo(screenPos.x, screenPos.y);
    this.ctx.lineTo(screenVelEnd.x, screenVelEnd.y);
    this.ctx.stroke();
  }

  drawAABB(aabb) {
    const lowerBound = this.worldToScreen(aabb.lowerBound);
    const upperBound = this.worldToScreen(aabb.upperBound);

    const width = upperBound.x - lowerBound.x;
    const height = lowerBound.y - upperBound.y;

    this.ctx.fillStyle = this.colors.aabb;
    this.ctx.fillRect(lowerBound.x, upperBound.y, width, height);
  }
}
```

### 性能分析器

```javascript
class PhysicsProfiler {
  constructor() {
    this.samples = [];
    this.maxSamples = 60;
    this.currentFrame = {
      stepTime: 0,
      bodyCount: 0,
      contactCount: 0,
      jointCount: 0,
      proxyCount: 0
    };
  }

  beginFrame() {
    this.frameStartTime = performance.now();
  }

  endFrame(world) {
    const endTime = performance.now();

    this.currentFrame = {
      stepTime: endTime - this.frameStartTime,
      bodyCount: this.countBodies(world),
      contactCount: this.countContacts(world),
      jointCount: this.countJoints(world),
      proxyCount: world.getProxyCount()
    };

    this.samples.push({ ...this.currentFrame });

    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  countBodies(world) {
    let count = 0;
    for (let body = world.getBodyList(); body; body = body.getNext()) {
      count++;
    }
    return count;
  }

  countContacts(world) {
    let count = 0;
    for (let contact = world.getContactList(); contact; contact = contact.getNext()) {
      count++;
    }
    return count;
  }

  countJoints(world) {
    let count = 0;
    for (let joint = world.getJointList(); joint; joint = joint.getNext()) {
      count++;
    }
    return count;
  }

  getAverageStepTime() {
    if (this.samples.length === 0) return 0;
    const sum = this.samples.reduce((acc, s) => acc + s.stepTime, 0);
    return sum / this.samples.length;
  }

  getReport() {
    return {
      current: this.currentFrame,
      averageStepTime: this.getAverageStepTime(),
      samples: this.samples.length
    };
  }

  drawOverlay(ctx, x, y) {
    const report = this.getReport();

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x, y, 200, 120);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#fff';

    const lines = [
      `Step Time: ${report.averageStepTime.toFixed(2)}ms`,
      `Bodies: ${report.current.bodyCount}`,
      `Contacts: ${report.current.contactCount}`,
      `Joints: ${report.current.jointCount}`,
      `Proxies: ${report.current.proxyCount}`
    ];

    lines.forEach((line, i) => {
      ctx.fillText(line, x + 10, y + 20 + i * 20);
    });

    ctx.restore();
  }
}
```

---

## 完整示例：平台游戏

```javascript
import { World, Vec2, Box, Circle } from 'planck-js';

class PlatformGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 物理设置
    this.PPM = 32; // 像素/米
    this.world = new World({
      gravity: Vec2(0, -20)
    });

    // 调试绘制
    this.debugDraw = new PhysicsDebugDraw(this.ctx, this.PPM, canvas.height);
    this.showDebug = true;

    // 游戏对象
    this.player = null;
    this.platforms = [];
    this.enemies = [];
    this.pickups = [];

    // 输入状态
    this.input = {
      left: false,
      right: false,
      jump: false,
      jumpPressed: false,
      down: false
    };

    // 初始化
    this.setupLevel();
    this.setupInput();
    this.setupCollisionHandlers();

    // 开始游戏循环
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.fixedTimeStep = 1 / 60;

    requestAnimationFrame(() => this.gameLoop());
  }

  setupLevel() {
    const worldWidth = this.canvas.width / this.PPM;
    const worldHeight = this.canvas.height / this.PPM;

    // 创建边界
    this.createBoundary(worldWidth / 2, 0.5, worldWidth, 1);         // 地面
    this.createBoundary(0.5, worldHeight / 2, 1, worldHeight);       // 左墙
    this.createBoundary(worldWidth - 0.5, worldHeight / 2, 1, worldHeight); // 右墙

    // 创建平台
    this.createPlatform(5, 3, 4, 0.5);
    this.createPlatform(12, 5, 4, 0.5);
    this.createPlatform(8, 7, 3, 0.5);

    // 创建单向平台
    this.createOneWayPlatform(15, 3, 3, 0.3);

    // 创建移动平台
    this.movingPlatforms = [
      new MovingPlatform(this.world, 3, 5, 7, 5, 2, 0.3, 2)
    ];

    // 创建玩家
    this.player = new PlatformerController(this.world, 3, 5);
    this.player.body.setUserData({ type: 'player', controller: this.player });

    // 创建敌人
    this.createEnemy(10, 2);
    this.createEnemy(14, 6);

    // 创建收集品
    this.createPickup(5, 4);
    this.createPickup(12, 6);
    this.createPickup(8, 8);
  }

  createBoundary(x, y, width, height) {
    const body = this.world.createBody({
      type: 'static',
      position: Vec2(x, y)
    });

    body.createFixture({
      shape: Box(width / 2, height / 2),
      friction: 0.5,
      userData: { type: 'boundary' }
    });

    return body;
  }

  createPlatform(x, y, width, height) {
    const body = this.world.createBody({
      type: 'static',
      position: Vec2(x, y)
    });

    body.createFixture({
      shape: Box(width / 2, height / 2),
      friction: 0.6,
      userData: { type: 'platform' }
    });

    this.platforms.push(body);
    return body;
  }

  createOneWayPlatform(x, y, width, height) {
    const platform = new OneWayPlatform(this.world, x, y, width, height);
    this.platforms.push(platform.body);
    return platform;
  }

  createEnemy(x, y) {
    const body = this.world.createBody({
      type: 'dynamic',
      position: Vec2(x, y),
      fixedRotation: true
    });

    body.createFixture({
      shape: Box(0.4, 0.4),
      density: 1.0,
      friction: 0.3,
      filterCategoryBits: CollisionCategory.ENEMY,
      filterMaskBits: CollisionMask.ENEMY,
      userData: { type: 'enemy' }
    });

    body.setUserData({
      type: 'enemy',
      speed: 2,
      direction: 1,
      health: 1
    });

    this.enemies.push(body);
    return body;
  }

  createPickup(x, y) {
    const body = this.world.createBody({
      type: 'static',
      position: Vec2(x, y)
    });

    body.createFixture({
      shape: Circle(0.3),
      isSensor: true,
      filterCategoryBits: CollisionCategory.PICKUP,
      filterMaskBits: CollisionMask.PICKUP,
      userData: { type: 'pickup' }
    });

    body.setUserData({
      type: 'pickup',
      collected: false,
      value: 10
    });

    this.pickups.push(body);
    return body;
  }

  setupInput() {
    document.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.input.left = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.input.right = true;
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          if (!this.input.jump) {
            this.input.jumpPressed = true;
          }
          this.input.jump = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.input.down = true;
          break;
        case 'KeyP':
          this.showDebug = !this.showDebug;
          break;
      }
    });

    document.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.input.left = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.input.right = false;
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          this.input.jump = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.input.down = false;
          break;
      }
    });
  }

  setupCollisionHandlers() {
    this.world.on('begin-contact', (contact) => {
      const fixtureA = contact.getFixtureA();
      const fixtureB = contact.getFixtureB();
      const userDataA = fixtureA.getUserData();
      const userDataB = fixtureB.getUserData();

      // 玩家与收集品碰撞
      if (this.isPlayerPickupCollision(userDataA, userDataB)) {
        this.handlePickup(fixtureA, fixtureB, userDataA, userDataB);
      }

      // 玩家着地检测
      if (userDataA && userDataA.type === 'footSensor') {
        this.player.onBeginContact(contact, fixtureB);
      }
      if (userDataB && userDataB.type === 'footSensor') {
        this.player.onBeginContact(contact, fixtureA);
      }
    });

    this.world.on('end-contact', (contact) => {
      const fixtureA = contact.getFixtureA();
      const fixtureB = contact.getFixtureB();
      const userDataA = fixtureA.getUserData();
      const userDataB = fixtureB.getUserData();

      if (userDataA && userDataA.type === 'footSensor') {
        this.player.onEndContact(contact, fixtureB);
      }
      if (userDataB && userDataB.type === 'footSensor') {
        this.player.onEndContact(contact, fixtureA);
      }
    });

    // 单向平台处理
    setupOneWayPlatformCollision(this.world);
  }

  isPlayerPickupCollision(userDataA, userDataB) {
    return (userDataA && userDataA.type === 'player' && userDataB && userDataB.type === 'pickup') ||
           (userDataB && userDataB.type === 'player' && userDataA && userDataA.type === 'pickup');
  }

  handlePickup(fixtureA, fixtureB, userDataA, userDataB) {
    const pickupFixture = userDataA.type === 'pickup' ? fixtureA : fixtureB;
    const pickupBody = pickupFixture.getBody();
    const pickupData = pickupBody.getUserData();

    if (!pickupData.collected) {
      pickupData.collected = true;
      // 添加分数、播放音效等
      console.log(`收集了 ${pickupData.value} 分！`);

      // 延迟销毁
      setTimeout(() => {
        this.world.destroyBody(pickupBody);
        const index = this.pickups.indexOf(pickupBody);
        if (index > -1) {
          this.pickups.splice(index, 1);
        }
      }, 0);
    }
  }

  gameLoop() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // 固定时间步长更新物理
    this.accumulator += deltaTime;

    while (this.accumulator >= this.fixedTimeStep) {
      this.update(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }

    // 渲染
    this.render();

    // 重置单帧输入
    this.input.jumpPressed = false;

    requestAnimationFrame(() => this.gameLoop());
  }

  update(deltaTime) {
    // 处理玩家输入
    const playerInput = {
      horizontal: (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0),
      jump: this.input.jump,
      jumpPressed: this.input.jumpPressed,
      down: this.input.down
    };

    this.player.update(playerInput, deltaTime);

    // 更新移动平台
    this.movingPlatforms.forEach(platform => {
      platform.update(deltaTime);
    });

    // 更新敌人AI
    this.updateEnemies(deltaTime);

    // 物理步进
    this.world.step(deltaTime, 8, 3);
  }

  updateEnemies(deltaTime) {
    this.enemies.forEach(enemy => {
      const data = enemy.getUserData();
      const pos = enemy.getPosition();

      // 简单的巡逻AI
      enemy.setLinearVelocity(Vec2(data.speed * data.direction, enemy.getLinearVelocity().y));

      // 边缘检测（射线检测前方地面）
      const checkPos = Vec2(pos.x + data.direction * 0.5, pos.y);
      const groundCheck = Vec2(checkPos.x, checkPos.y - 1);

      let hasGround = false;
      this.world.rayCast(checkPos, groundCheck, (fixture, point, normal, fraction) => {
        if (!fixture.isSensor()) {
          hasGround = true;
        }
        return 0;
      });

      if (!hasGround) {
        data.direction *= -1;
      }
    });
  }

  render() {
    // 清空画布
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.showDebug) {
      // 调试渲染
      this.debugDraw.draw(this.world);
    } else {
      // 游戏渲染
      this.renderGame();
    }

    // 渲染UI
    this.renderUI();
  }

  renderGame() {
    // 渲染平台
    this.ctx.fillStyle = '#2ecc71';
    this.platforms.forEach(body => {
      this.renderBody(body);
    });

    // 渲染收集品
    this.ctx.fillStyle = '#f1c40f';
    this.pickups.forEach(body => {
      const data = body.getUserData();
      if (!data.collected) {
        this.renderCircle(body, 0.3);
      }
    });

    // 渲染敌人
    this.ctx.fillStyle = '#e74c3c';
    this.enemies.forEach(body => {
      this.renderBody(body);
    });

    // 渲染玩家
    this.ctx.fillStyle = '#3498db';
    this.renderBody(this.player.body);
  }

  renderBody(body) {
    const pos = body.getPosition();
    const screenPos = this.debugDraw.worldToScreen(pos);
    const angle = body.getAngle();

    this.ctx.save();
    this.ctx.translate(screenPos.x, screenPos.y);
    this.ctx.rotate(-angle);

    for (let fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
      if (fixture.isSensor()) continue;

      const shape = fixture.getShape();
      if (shape.getType() === 'polygon') {
        this.ctx.beginPath();
        for (let i = 0; i < shape.m_count; i++) {
          const v = shape.getVertex(i);
          const x = v.x * this.PPM;
          const y = -v.y * this.PPM;
          if (i === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
        }
        this.ctx.closePath();
        this.ctx.fill();
      }
    }

    this.ctx.restore();
  }

  renderCircle(body, radius) {
    const pos = body.getPosition();
    const screenPos = this.debugDraw.worldToScreen(pos);

    this.ctx.beginPath();
    this.ctx.arc(screenPos.x, screenPos.y, radius * this.PPM, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderUI() {
    this.ctx.font = '16px Arial';
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(`按 P 切换调试视图`, 10, 25);
    this.ctx.fillText(`方向键/WASD 移动，空格跳跃`, 10, 45);

    if (this.player.grounded) {
      this.ctx.fillStyle = '#2ecc71';
      this.ctx.fillText('着地', 10, 65);
    } else {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fillText('空中', 10, 65);
    }
  }
}

// 启动游戏
const canvas = document.getElementById('game');
canvas.width = 800;
canvas.height = 600;
const game = new PlatformGame(canvas);
```

---

## 性能优化技巧

### 物理世界优化

```javascript
// 1. 使用休眠减少不活跃物体的计算
body.setSleepingAllowed(true);

// 2. 合理设置迭代次数
world.step(timeStep, 6, 2); // 较低的迭代次数

// 3. 使用 bullet 标记高速物体
body.setBullet(true); // 只在需要时使用

// 4. 减少碰撞形状复杂度
// 使用简单形状代替复杂多边形

// 5. 使用空间分区查询
const aabb = {
  lowerBound: Vec2(x - range, y - range),
  upperBound: Vec2(x + range, y + range)
};

world.queryAABB(aabb, (fixture) => {
  // 处理范围内的fixture
  return true; // 继续查询
});

// 6. 批量创建和销毁
// 避免在游戏循环中频繁创建/销毁刚体
const objectPool = new PhysicsObjectPool(world);

// 7. 固定时间步长
const fixedTimeStep = 1 / 60;
let accumulator = 0;

function update(deltaTime) {
  accumulator += deltaTime;
  while (accumulator >= fixedTimeStep) {
    world.step(fixedTimeStep);
    accumulator -= fixedTimeStep;
  }
}
```

### 对象池模式

```javascript
class PhysicsObjectPool {
  constructor(world) {
    this.world = world;
    this.pools = new Map();
  }

  createPool(type, createFn, initialSize = 10) {
    const pool = [];
    for (let i = 0; i < initialSize; i++) {
      const obj = createFn(this.world);
      obj.setActive(false);
      pool.push(obj);
    }
    this.pools.set(type, { pool, createFn, activeObjects: [] });
  }

  acquire(type, x, y) {
    const poolData = this.pools.get(type);
    let obj;

    if (poolData.pool.length > 0) {
      obj = poolData.pool.pop();
    } else {
      obj = poolData.createFn(this.world);
    }

    obj.setPosition(Vec2(x, y));
    obj.setLinearVelocity(Vec2(0, 0));
    obj.setAngularVelocity(0);
    obj.setActive(true);
    obj.setAwake(true);

    poolData.activeObjects.push(obj);
    return obj;
  }

  release(type, obj) {
    const poolData = this.pools.get(type);
    const index = poolData.activeObjects.indexOf(obj);

    if (index > -1) {
      poolData.activeObjects.splice(index, 1);
      obj.setActive(false);
      poolData.pool.push(obj);
    }
  }
}
```

---

## 面试要点

### 高频面试题

**Q1: Box2D 中三种刚体类型的区别？**

```
Static（静态）:
- 不移动，无限质量
- 用于地面、墙壁等固定物体
- 只能与动态刚体碰撞

Dynamic（动态）:
- 受力和碰撞影响
- 有质量，遵循物理定律
- 可以与所有类型碰撞

Kinematic（运动学）:
- 按预设路径移动
- 不受力影响
- 可推动动态刚体
- 用于移动平台、电梯等
```

**Q2: 如何实现平台游戏的单向平台？**

```javascript
// 在 pre-solve 回调中判断:
// 1. 玩家是否从上方落下
// 2. 玩家底部是否在平台顶部以上
// 3. 如果条件不满足，禁用碰撞

world.on('pre-solve', (contact) => {
  // 检查玩家位置和速度
  if (playerBottom < platformTop || playerVelocity.y > 0) {
    contact.setEnabled(false);
  }
});
```

**Q3: 什么是土狼时间（Coyote Time）和跳跃缓冲？**

```
土狼时间：
- 离开平台后短暂时间内仍可跳跃
- 提升操作手感，容错性更高
- 通常设置为 100-150ms

跳跃缓冲：
- 落地前提前按跳跃键也能生效
- 防止因时机不精确而跳跃失败
- 通常设置为 100ms
```

**Q4: 物理引擎的固定时间步长有什么作用？**

```
1. 确保物理模拟的确定性和可重复性
2. 防止穿透（隧道效应）
3. 保持碰撞检测的准确性
4. 使游戏在不同帧率下表现一致

实现方式：使用累加器模式
while (accumulator >= fixedTimeStep) {
  world.step(fixedTimeStep);
  accumulator -= fixedTimeStep;
}
```

**Q5: 如何优化物理引擎性能？**

```
1. 减少刚体数量，合并静态物体
2. 简化碰撞形状
3. 合理使用休眠机制
4. 使用空间查询代替遍历
5. 实现对象池减少创建/销毁
6. 降低迭代次数（在精度允许范围内）
7. 只对可见区域进行模拟
```

### 关键概念总结

```
1. 刚体类型：Static、Dynamic、Kinematic
2. 碰撞形状：Box、Circle、Polygon、Edge、Chain
3. 夹具属性：密度、摩擦、弹性、传感器
4. 关节类型：距离、旋转、滑轮、焊接等
5. 碰撞回调：begin-contact、end-contact、pre-solve、post-solve
6. 碰撞过滤：类别位、掩码位、组索引
7. 射线检测：用于视线、地面检测等
8. 调试渲染：可视化物理形状和约束
```

---

## 学习资源

### 官方文档

- [Box2D 官方手册](https://box2d.org/documentation/)
- [Planck.js 文档](https://piqnt.com/planck.js/)
- [Matter.js 文档](https://brm.io/matter-js/docs/)

### 推荐书籍

- 《Game Physics Engine Development》by Ian Millington
- 《Real-Time Collision Detection》by Christer Ericson
- 《Physics for Game Developers》by David M. Bourg

### 相关教程

- [Box2D Tutorial](https://www.iforce2d.net/b2dtut/)
- [平台游戏物理](https://www.youtube.com/watch?v=hG9SzQxaCm8)
- [2D Game Physics](https://gamedevelopment.tutsplus.com/series/how-to-create-a-custom-2d-physics-engine--gamedev-12715)

### 开源项目参考

- [Celeste](https://github.com/NoelFB/Celeste) - 经典平台游戏物理实现
- [Super Mario Bros](https://github.com/justinmeister/Super-Mario-Bros-2) - 经典横版游戏物理
- [Phaser](https://github.com/photonstorm/phaser) - 内置物理引擎的游戏框架

---

## 总结

2D 物理引擎是游戏开发的核心技术之一。掌握 Box2D 的架构和原理,理解刚体、碰撞、关节等概念,能够帮助你实现各种复杂的物理效果。对于平台游戏,需要特别注意：

1. **角色控制器设计**：结合物理引擎和手动控制,实现精确响应的操作手感
2. **特殊机制实现**：单向平台、移动平台、斜坡处理等需要自定义碰撞逻辑
3. **用户体验优化**：土狼时间、跳跃缓冲等设计让游戏更易上手
4. **性能优化**：对象池、休眠机制、空间查询等保证游戏流畅运行

物理引擎不仅仅是技术工具,更是创造有趣游戏体验的基础。通过不断实践和调优,你将能够实现既真实又有趣的游戏物理效果。
