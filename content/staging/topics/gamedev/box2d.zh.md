---
title: Box2D 物理引擎完全指南
description: 深入掌握Box2D 2D物理引擎：刚体、形状、夹具、关节、碰撞检测与游戏集成策略
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - Box2D
  - 物理
  - 2D
  - 碰撞
  - 刚体
  - 关节
status: imported
origin: old/src/content/docs/gamedev/box2d.zh.md
divergence: 0.237
issues: []
legacy:
  category: GameDev
  subcategory: 2D
  order: 52
  lastUpdated: 2026-01-22
---

Box2D是业界标准的2D刚体物理引擎，由Erin Catto创建。从《愤怒的小鸟》到《Limbo》，无数游戏都使用Box2D作为物理引擎。本指南详细介绍Box2D的架构、核心概念和游戏开发中的实践模式。

## Box2D 架构概述

### 核心组件

Box2D围绕几个关键概念构建，它们协同工作以创建真实的物理模拟。

```
World（世界）
├── Bodies（刚体）: Dynamic, Static, Kinematic
│   └── Fixtures（夹具）
│       ├── Shape（形状）: Circle, Polygon, Edge, Chain
│       └── Material Properties（材质属性）: density, friction, restitution
├── Joints（关节）: Revolute, Prismatic, Distance, 等
└── Contact Manager（接触管理器）
    ├── Broad Phase（宽相检测）: Dynamic AABB Tree
    └── Narrow Phase（窄相检测）: GJK/SAT
```

### 物理世界

世界是所有物理模拟的容器。

```typescript
// 使用Box2D风格的API（Planck.js语法）
import { World, Vec2, Settings } from 'planck-js';

class PhysicsWorld {
  private world: World;
  private readonly PIXELS_PER_METER = 30;

  // Box2D在0.1到10米大小的物体上工作最佳
  private readonly MIN_SIZE = 0.1;
  private readonly MAX_SIZE = 10;

  constructor(gravity: Vec2 = Vec2(0, -10)) {
    this.world = new World({
      gravity: gravity,
      allowSleep: true // 通过休眠不活动的刚体来提高性能
    });
  }

  // 单位转换：像素到米
  toMeters(pixels: number): number {
    return pixels / this.PIXELS_PER_METER;
  }

  // 单位转换：米到像素
  toPixels(meters: number): number {
    return meters * this.PIXELS_PER_METER;
  }

  // 步进模拟
  step(deltaTime: number): void {
    // 推荐固定时间步：1/60秒
    const timeStep = 1 / 60;

    // 速度迭代：速度约束求解的精度
    // 位置迭代：位置约束求解的精度
    const velocityIterations = 8;
    const positionIterations = 3;

    // 固定时间步的累加器
    this.accumulator += deltaTime;

    while (this.accumulator >= timeStep) {
      this.world.step(timeStep, velocityIterations, positionIterations);
      this.accumulator -= timeStep;
    }
  }

  getWorld(): World {
    return this.world;
  }
}
```

### 为什么固定时间步很重要

```typescript
class FixedTimestepSimulation {
  private accumulator: number = 0;
  private readonly FIXED_DELTA = 1 / 60;
  private readonly MAX_STEPS = 5; // 防止死亡螺旋

  update(deltaTime: number): void {
    // 限制大的deltaTime
    deltaTime = Math.min(deltaTime, this.FIXED_DELTA * this.MAX_STEPS);

    this.accumulator += deltaTime;

    while (this.accumulator >= this.FIXED_DELTA) {
      this.world.step(this.FIXED_DELTA, 8, 3);
      this.accumulator -= this.FIXED_DELTA;
    }

    // 用于插值的alpha值（视觉平滑）
    const alpha = this.accumulator / this.FIXED_DELTA;
    this.interpolateRenderPositions(alpha);
  }

  private interpolateRenderPositions(alpha: number): void {
    // 在上一个和当前物理位置之间插值
    for (const entity of this.entities) {
      entity.renderPosition = {
        x: entity.prevPosition.x * (1 - alpha) + entity.position.x * alpha,
        y: entity.prevPosition.y * (1 - alpha) + entity.position.y * alpha
      };
    }
  }
}
```

---

## 刚体类型

### 静态刚体（Static Bodies）

静态刚体永不移动，具有无限质量。用于地面、墙壁和固定障碍物。

```typescript
function createStaticPlatform(
  world: World,
  x: number,
  y: number,
  width: number,
  height: number
): Body {
  const body = world.createBody({
    type: 'static',
    position: Vec2(x, y)
  });

  body.createFixture({
    shape: Box(width / 2, height / 2),
    friction: 0.6,
    restitution: 0.0 // 无弹性
  });

  return body;
}

// 创建地面
const ground = createStaticPlatform(world, 0, -10, 100, 2);
```

### 动态刚体（Dynamic Bodies）

动态刚体具有质量、速度和力，完全参与物理模拟。

```typescript
interface DynamicBodyOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  density?: number;
  friction?: number;
  restitution?: number;
  linearDamping?: number;
  angularDamping?: number;
  fixedRotation?: boolean;
  bullet?: boolean; // 为快速物体启用CCD
}

function createDynamicBox(world: World, options: DynamicBodyOptions): Body {
  const {
    x, y, width, height,
    density = 1.0,
    friction = 0.3,
    restitution = 0.1,
    linearDamping = 0.0,
    angularDamping = 0.0,
    fixedRotation = false,
    bullet = false
  } = options;

  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y),
    linearDamping,
    angularDamping,
    fixedRotation,
    bullet // 防止快速移动物体的穿透
  });

  body.createFixture({
    shape: Box(width / 2, height / 2),
    density,
    friction,
    restitution
  });

  return body;
}

// 创建弹力球
const ball = world.createBody({
  type: 'dynamic',
  position: Vec2(0, 10),
  bullet: true
});

ball.createFixture({
  shape: Circle(0.5),
  density: 1.0,
  friction: 0.3,
  restitution: 0.8 // 非常有弹性
});
```

### 运动学刚体（Kinematic Bodies）

运动学刚体根据速度移动但不受力的影响。非常适合移动平台。

```typescript
class MovingPlatform {
  private body: Body;
  private startPos: Vec2;
  private endPos: Vec2;
  private speed: number;
  private progress: number = 0;
  private direction: number = 1;

  constructor(
    world: World,
    start: Vec2,
    end: Vec2,
    width: number,
    height: number,
    speed: number = 2
  ) {
    this.startPos = start;
    this.endPos = end;
    this.speed = speed;

    this.body = world.createBody({
      type: 'kinematic',
      position: start
    });

    this.body.createFixture({
      shape: Box(width / 2, height / 2),
      friction: 1.0 // 高摩擦使物体不会滑落
    });
  }

  update(deltaTime: number): void {
    // 计算路径上的进度
    this.progress += this.direction * this.speed * deltaTime;

    if (this.progress >= 1) {
      this.progress = 1;
      this.direction = -1;
    } else if (this.progress <= 0) {
      this.progress = 0;
      this.direction = 1;
    }

    // 计算目标位置
    const targetX = this.startPos.x + (this.endPos.x - this.startPos.x) * this.progress;
    const targetY = this.startPos.y + (this.endPos.y - this.startPos.y) * this.progress;

    // 设置速度以到达目标（运动学刚体通过速度移动）
    const currentPos = this.body.getPosition();
    this.body.setLinearVelocity(Vec2(
      (targetX - currentPos.x) / deltaTime,
      (targetY - currentPos.y) / deltaTime
    ));
  }
}
```

---

## 形状和夹具

### 圆形（Circle Shape）

最高效的碰撞形状。

```typescript
function createCircle(
  world: World,
  x: number,
  y: number,
  radius: number,
  options: FixtureOptions = {}
): Body {
  const body = world.createBody({
    type: options.isStatic ? 'static' : 'dynamic',
    position: Vec2(x, y)
  });

  body.createFixture({
    shape: Circle(radius),
    density: options.density ?? 1.0,
    friction: options.friction ?? 0.3,
    restitution: options.restitution ?? 0.1
  });

  return body;
}

// 带偏移中心的圆形（用于复合形状）
const circleWithOffset = Circle(Vec2(1, 0), 0.5); // 偏移(1, 0)
```

### 多边形（Polygon Shape）

最多8个顶点的凸多边形（Box2D限制）。

```typescript
// 盒子（矩形）- 最常见的多边形
function createBox(
  world: World,
  x: number,
  y: number,
  halfWidth: number,
  halfHeight: number
): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y)
  });

  body.createFixture({
    shape: Box(halfWidth, halfHeight),
    density: 1.0
  });

  return body;
}

// 自定义凸多边形
function createTriangle(world: World, x: number, y: number, size: number): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y)
  });

  const vertices = [
    Vec2(0, size),
    Vec2(-size, -size),
    Vec2(size, -size)
  ];

  body.createFixture({
    shape: Polygon(vertices),
    density: 1.0
  });

  return body;
}

// 正多边形生成器
function createRegularPolygon(
  world: World,
  x: number,
  y: number,
  radius: number,
  sides: number
): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y)
  });

  const vertices: Vec2[] = [];
  for (let i = 0; i < Math.min(sides, 8); i++) { // 最多8个顶点
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    vertices.push(Vec2(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius
    ));
  }

  body.createFixture({
    shape: Polygon(vertices),
    density: 1.0
  });

  return body;
}
```

### 边缘和链形状（Edge and Chain Shapes）

用于静态地形和关卡几何体。

```typescript
// 单个边缘（线段）
function createEdge(world: World, v1: Vec2, v2: Vec2): Body {
  const body = world.createBody({ type: 'static' });

  body.createFixture({
    shape: Edge(v1, v2),
    friction: 0.6
  });

  return body;
}

// 用于地形的链形状
function createTerrain(world: World, points: Vec2[]): Body {
  const body = world.createBody({ type: 'static' });

  body.createFixture({
    shape: Chain(points, false), // false = 开放链
    friction: 0.6
  });

  return body;
}

// 从高度图生成平滑地形
function createTerrainFromHeightmap(
  world: World,
  heightmap: number[],
  scale: number,
  yOffset: number
): Body {
  const points: Vec2[] = [];

  for (let i = 0; i < heightmap.length; i++) {
    points.push(Vec2(i * scale, heightmap[i] + yOffset));
  }

  return createTerrain(world, points);
}

// 闭合链（封闭形状，用于静态凹形状）
function createClosedChain(world: World, points: Vec2[]): Body {
  const body = world.createBody({ type: 'static' });

  body.createFixture({
    shape: Chain(points, true), // true = 闭合环
    friction: 0.6
  });

  return body;
}
```

### 复合形状

使用多个夹具创建复杂形状。

```typescript
// 带多个形状的汽车车身
function createCarBody(world: World, x: number, y: number): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y)
  });

  // 主底盘
  body.createFixture({
    shape: Box(2, 0.5),
    density: 1.0
  });

  // 引擎盖（前部）
  body.createFixture({
    shape: Polygon([
      Vec2(2, 0.5),
      Vec2(2.5, 0.5),
      Vec2(2.5, 0),
      Vec2(2, -0.5)
    ]),
    density: 0.5
  });

  // 后备箱（后部）
  body.createFixture({
    shape: Box(0.5, 0.25, Vec2(-1.75, 0.25), 0),
    density: 0.5
  });

  return body;
}

// 胶囊形状（常用于角色）
function createCapsule(
  world: World,
  x: number,
  y: number,
  width: number,
  height: number
): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y),
    fixedRotation: true // 角色通常不旋转
  });

  const radius = width / 2;
  const boxHeight = height - width;

  // 中间矩形
  if (boxHeight > 0) {
    body.createFixture({
      shape: Box(radius * 0.9, boxHeight / 2), // 略窄
      density: 1.0,
      friction: 0
    });
  }

  // 顶部圆形
  body.createFixture({
    shape: Circle(Vec2(0, boxHeight / 2), radius),
    density: 1.0,
    friction: 0
  });

  // 底部圆形
  body.createFixture({
    shape: Circle(Vec2(0, -boxHeight / 2), radius),
    density: 1.0,
    friction: 1.0 // 脚部高摩擦
  });

  return body;
}
```

---

## 关节

### 旋转关节（Revolute Joint / 铰链）

允许围绕单点旋转。

```typescript
// 简单的铰链门
function createDoor(world: World): { frame: Body; door: Body } {
  // 门框（静态）
  const frame = world.createBody({
    type: 'static',
    position: Vec2(0, 0)
  });
  frame.createFixture({ shape: Box(0.1, 2) });

  // 门板（动态）
  const door = world.createBody({
    type: 'dynamic',
    position: Vec2(1, 0)
  });
  door.createFixture({
    shape: Box(1, 2),
    density: 1.0
  });

  // 铰链关节
  world.createJoint(RevoluteJoint({
    bodyA: frame,
    bodyB: door,
    localAnchorA: Vec2(0.1, 0),
    localAnchorB: Vec2(-1, 0),
    enableLimit: true,
    lowerAngle: 0,
    upperAngle: Math.PI / 2, // 90度
    enableMotor: false
  }));

  return { frame, door };
}

// 电动轮
function createMotorizedWheel(
  world: World,
  chassis: Body,
  localAnchor: Vec2,
  wheelRadius: number
): { wheel: Body; joint: RevoluteJoint } {
  const worldAnchor = chassis.getWorldPoint(localAnchor);

  const wheel = world.createBody({
    type: 'dynamic',
    position: worldAnchor
  });

  wheel.createFixture({
    shape: Circle(wheelRadius),
    density: 1.0,
    friction: 0.9 // 高摩擦以获得抓地力
  });

  const joint = world.createJoint(RevoluteJoint({
    bodyA: chassis,
    bodyB: wheel,
    localAnchorA: localAnchor,
    localAnchorB: Vec2(0, 0),
    enableMotor: true,
    motorSpeed: 0,
    maxMotorTorque: 50
  }));

  return { wheel, joint };
}
```

### 距离关节（Distance Joint）

保持两点之间的距离。

```typescript
// 绳索/弹簧连接
function createRope(
  world: World,
  bodyA: Body,
  bodyB: Body,
  anchorA: Vec2,
  anchorB: Vec2,
  options: {
    stiffness?: number;
    damping?: number;
  } = {}
): DistanceJoint {
  const worldAnchorA = bodyA.getWorldPoint(anchorA);
  const worldAnchorB = bodyB.getWorldPoint(anchorB);
  const length = Vec2.distance(worldAnchorA, worldAnchorB);

  return world.createJoint(DistanceJoint({
    bodyA,
    bodyB,
    localAnchorA: anchorA,
    localAnchorB: anchorB,
    length,
    stiffness: options.stiffness ?? 0, // 0 = 刚性
    damping: options.damping ?? 0
  }));
}

// 软弹簧
const softSpring = world.createJoint(DistanceJoint({
  bodyA,
  bodyB,
  localAnchorA: Vec2(0, 0),
  localAnchorB: Vec2(0, 0),
  length: 2,
  stiffness: 4, // 弹簧频率（Hz）
  damping: 0.5 // 阻尼比
}));
```

### 平移关节（Prismatic Joint / 滑块）

允许沿轴平移。

```typescript
// 电梯平台
function createElevator(world: World): {
  platform: Body;
  joint: PrismaticJoint;
} {
  // 井道（静态锚点）
  const shaft = world.createBody({
    type: 'static',
    position: Vec2(0, 0)
  });

  // 平台（动态）
  const platform = world.createBody({
    type: 'dynamic',
    position: Vec2(0, 0)
  });
  platform.createFixture({
    shape: Box(2, 0.3),
    density: 1.0
  });

  const joint = world.createJoint(PrismaticJoint({
    bodyA: shaft,
    bodyB: platform,
    localAnchorA: Vec2(0, 0),
    localAnchorB: Vec2(0, 0),
    localAxisA: Vec2(0, 1), // 垂直轴
    enableLimit: true,
    lowerTranslation: -5,
    upperTranslation: 5,
    enableMotor: true,
    motorSpeed: 2,
    maxMotorForce: 100
  }));

  return { platform, joint };
}

// 活塞
function createPiston(world: World, anchor: Body, piston: Body): PrismaticJoint {
  return world.createJoint(PrismaticJoint({
    bodyA: anchor,
    bodyB: piston,
    localAnchorA: Vec2(0, 0),
    localAnchorB: Vec2(0, 0),
    localAxisA: Vec2(1, 0), // 水平
    enableLimit: true,
    lowerTranslation: 0,
    upperTranslation: 3,
    enableMotor: true,
    motorSpeed: 5,
    maxMotorForce: 200
  }));
}
```

### 轮子关节（Wheel Joint）

组合旋转和平移 - 非常适合车辆悬挂。

```typescript
function createVehicle(world: World, x: number, y: number): Vehicle {
  // 底盘
  const chassis = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y)
  });
  chassis.createFixture({
    shape: Box(3, 0.5),
    density: 1.0
  });

  // 创建带悬挂的轮子
  const wheelPositions = [
    Vec2(-2, -0.5),
    Vec2(2, -0.5)
  ];

  const wheels: Body[] = [];
  const joints: WheelJoint[] = [];

  for (const pos of wheelPositions) {
    const wheelPos = Vec2(x + pos.x, y + pos.y);

    const wheel = world.createBody({
      type: 'dynamic',
      position: wheelPos
    });
    wheel.createFixture({
      shape: Circle(0.5),
      density: 1.0,
      friction: 0.9
    });

    const joint = world.createJoint(WheelJoint({
      bodyA: chassis,
      bodyB: wheel,
      localAnchorA: pos,
      localAnchorB: Vec2(0, 0),
      localAxisA: Vec2(0, 1), // 悬挂方向
      enableMotor: true,
      motorSpeed: 0,
      maxMotorTorque: 20,
      stiffness: 4.0, // 悬挂刚度
      damping: 0.7 // 悬挂阻尼
    }));

    wheels.push(wheel);
    joints.push(joint);
  }

  return { chassis, wheels, joints };
}

interface Vehicle {
  chassis: Body;
  wheels: Body[];
  joints: WheelJoint[];
}
```

### 焊接关节（Weld Joint）

刚性连接两个刚体。

```typescript
// 可断裂的焊接关节
class BreakableJoint {
  private joint: WeldJoint | null;
  private breakForce: number;

  constructor(
    world: World,
    bodyA: Body,
    bodyB: Body,
    anchor: Vec2,
    breakForce: number
  ) {
    this.breakForce = breakForce;

    this.joint = world.createJoint(WeldJoint({
      bodyA,
      bodyB,
      localAnchorA: bodyA.getLocalPoint(anchor),
      localAnchorB: bodyB.getLocalPoint(anchor)
    }));
  }

  update(): void {
    if (!this.joint) return;

    const reactionForce = this.joint.getReactionForce(60); // 在60 Hz时
    const forceMagnitude = reactionForce.length();

    if (forceMagnitude > this.breakForce) {
      this.joint.getBodyA().getWorld().destroyJoint(this.joint);
      this.joint = null;
    }
  }

  isIntact(): boolean {
    return this.joint !== null;
  }
}
```

---

## 碰撞检测和回调

### 接触监听器

```typescript
class GameContactListener {
  private world: World;

  constructor(world: World) {
    this.world = world;
    this.setupListeners();
  }

  private setupListeners(): void {
    this.world.on('begin-contact', (contact) => {
      this.onBeginContact(contact);
    });

    this.world.on('end-contact', (contact) => {
      this.onEndContact(contact);
    });

    this.world.on('pre-solve', (contact, oldManifold) => {
      this.onPreSolve(contact, oldManifold);
    });

    this.world.on('post-solve', (contact, impulse) => {
      this.onPostSolve(contact, impulse);
    });
  }

  private onBeginContact(contact: Contact): void {
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();

    const userDataA = fixtureA.getBody().getUserData() as any;
    const userDataB = fixtureB.getBody().getUserData() as any;

    // 示例：玩家触碰金币
    if (this.isType(userDataA, 'player') && this.isType(userDataB, 'coin')) {
      this.collectCoin(userDataB);
    } else if (this.isType(userDataB, 'player') && this.isType(userDataA, 'coin')) {
      this.collectCoin(userDataA);
    }

    // 示例：玩家落地
    if (this.isType(userDataA, 'player') && this.isGroundSensor(fixtureA)) {
      userDataA.entity.onLand();
    }
  }

  private onEndContact(contact: Contact): void {
    // 处理接触结束（例如，玩家离开地面）
  }

  private onPreSolve(contact: Contact, oldManifold: Manifold): void {
    // 可以在物理求解前禁用接触
    // 示例：单向平台
    const fixtureA = contact.getFixtureA();
    const fixtureB = contact.getFixtureB();

    if (this.isOneWayPlatform(fixtureA) || this.isOneWayPlatform(fixtureB)) {
      const platform = this.isOneWayPlatform(fixtureA) ? fixtureA : fixtureB;
      const other = platform === fixtureA ? fixtureB : fixtureA;

      const platformBody = platform.getBody();
      const otherBody = other.getBody();

      // 如果物体在平台下方或向上移动则禁用
      const platformY = platformBody.getPosition().y;
      const otherY = otherBody.getPosition().y;
      const velocity = otherBody.getLinearVelocity();

      if (otherY < platformY - 0.5 || velocity.y > 0) {
        contact.setEnabled(false);
      }
    }
  }

  private onPostSolve(contact: Contact, impulse: ContactImpulse): void {
    // 获取碰撞强度用于声音/效果
    const normalImpulses = impulse.normalImpulses;
    const maxImpulse = Math.max(...normalImpulses);

    if (maxImpulse > 5) {
      // 强碰撞 - 播放声音，生成粒子
      const worldManifold = contact.getWorldManifold(null);
      if (worldManifold) {
        this.playCollisionEffect(worldManifold.points[0], maxImpulse);
      }
    }
  }

  private isType(userData: any, type: string): boolean {
    return userData && userData.type === type;
  }

  private isOneWayPlatform(fixture: Fixture): boolean {
    const userData = fixture.getUserData() as any;
    return userData && userData.oneWay === true;
  }

  private isGroundSensor(fixture: Fixture): boolean {
    const userData = fixture.getUserData() as any;
    return userData && userData.sensor === 'ground';
  }
}
```

### 碰撞过滤

```typescript
// 碰撞过滤的类别位
const Category = {
  PLAYER: 0x0001,
  ENEMY: 0x0002,
  GROUND: 0x0004,
  PROJECTILE: 0x0008,
  SENSOR: 0x0010,
  PICKUP: 0x0020,
  DEBRIS: 0x0040
};

// 每个类别与什么碰撞
const Mask = {
  PLAYER: Category.GROUND | Category.ENEMY | Category.PICKUP | Category.SENSOR,
  ENEMY: Category.GROUND | Category.PLAYER | Category.PROJECTILE,
  GROUND: Category.PLAYER | Category.ENEMY | Category.PROJECTILE | Category.DEBRIS,
  PROJECTILE: Category.GROUND | Category.ENEMY,
  PICKUP: Category.PLAYER,
  DEBRIS: Category.GROUND | Category.DEBRIS
};

function createPlayerBody(world: World, x: number, y: number): Body {
  const body = world.createBody({
    type: 'dynamic',
    position: Vec2(x, y),
    fixedRotation: true
  });

  body.createFixture({
    shape: Box(0.4, 0.9),
    density: 1.0,
    friction: 0.0,
    filterCategoryBits: Category.PLAYER,
    filterMaskBits: Mask.PLAYER,
    filterGroupIndex: 0 // 0 = 使用category/mask
  });

  return body;
}

// 特殊情况的组索引：
// 正数：总是与相同组碰撞
// 负数：永不与相同组碰撞
// 零：使用category/mask过滤

// 示例：不会相互碰撞的队友
function createTeamMember(world: World, teamId: number): Body {
  const body = world.createBody({ type: 'dynamic', position: Vec2(0, 0) });

  body.createFixture({
    shape: Circle(0.5),
    density: 1.0,
    filterGroupIndex: -teamId // 负数 = 队内无碰撞
  });

  return body;
}
```

### 射线投射和查询

```typescript
class PhysicsQueries {
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  // 射线投射：找到第一个命中
  raycastFirst(
    start: Vec2,
    end: Vec2,
    filterMask: number = 0xFFFF
  ): RaycastResult | null {
    let closestResult: RaycastResult | null = null;
    let closestFraction = 1;

    this.world.rayCast(start, end, (fixture, point, normal, fraction) => {
      // 检查过滤器
      if (!(fixture.getFilterCategoryBits() & filterMask)) {
        return -1; // 继续
      }

      if (fraction < closestFraction) {
        closestFraction = fraction;
        closestResult = {
          fixture,
          point: Vec2(point.x, point.y),
          normal: Vec2(normal.x, normal.y),
          fraction
        };
      }

      return fraction; // 将射线裁剪到此命中点
    });

    return closestResult;
  }

  // 射线投射：找到所有命中
  raycastAll(
    start: Vec2,
    end: Vec2,
    filterMask: number = 0xFFFF
  ): RaycastResult[] {
    const results: RaycastResult[] = [];

    this.world.rayCast(start, end, (fixture, point, normal, fraction) => {
      if (!(fixture.getFilterCategoryBits() & filterMask)) {
        return -1;
      }

      results.push({
        fixture,
        point: Vec2(point.x, point.y),
        normal: Vec2(normal.x, normal.y),
        fraction
      });

      return 1; // 继续射线
    });

    // 按距离排序
    results.sort((a, b) => a.fraction - b.fraction);
    return results;
  }

  // AABB查询：找到区域内的所有夹具
  queryAABB(min: Vec2, max: Vec2): Fixture[] {
    const results: Fixture[] = [];

    this.world.queryAABB(AABB(min, max), (fixture) => {
      results.push(fixture);
      return true; // 继续查询
    });

    return results;
  }

  // 点查询：找到点处的夹具
  queryPoint(point: Vec2): Fixture | null {
    let result: Fixture | null = null;

    this.world.queryAABB(
      AABB(
        Vec2(point.x - 0.001, point.y - 0.001),
        Vec2(point.x + 0.001, point.y + 0.001)
      ),
      (fixture) => {
        if (fixture.testPoint(point)) {
          result = fixture;
          return false; // 停止查询
        }
        return true;
      }
    );

    return result;
  }
}

interface RaycastResult {
  fixture: Fixture;
  point: Vec2;
  normal: Vec2;
  fraction: number;
}
```

---

## 力和冲量

```typescript
class PhysicsController {
  // 应用持续力（例如，推力、风）
  applyForce(body: Body, force: Vec2, worldPoint?: Vec2): void {
    if (worldPoint) {
      body.applyForce(force, worldPoint, true);
    } else {
      body.applyForceToCenter(force, true);
    }
  }

  // 应用瞬时冲量（例如，跳跃、爆炸）
  applyImpulse(body: Body, impulse: Vec2, worldPoint?: Vec2): void {
    if (worldPoint) {
      body.applyLinearImpulse(impulse, worldPoint, true);
    } else {
      body.applyLinearImpulse(impulse, body.getWorldCenter(), true);
    }
  }

  // 应用扭矩（旋转力）
  applyTorque(body: Body, torque: number): void {
    body.applyTorque(torque, true);
  }

  // 应用角冲量
  applyAngularImpulse(body: Body, impulse: number): void {
    body.applyAngularImpulse(impulse, true);
  }

  // 直接设置速度（谨慎使用）
  setVelocity(body: Body, velocity: Vec2): void {
    body.setLinearVelocity(velocity);
  }

  // 添加到速度
  addVelocity(body: Body, velocity: Vec2): void {
    const current = body.getLinearVelocity();
    body.setLinearVelocity(Vec2(
      current.x + velocity.x,
      current.y + velocity.y
    ));
  }
}

// 示例：角色移动
class CharacterPhysics {
  private body: Body;
  private moveForce: number = 50;
  private jumpImpulse: number = 10;
  private maxSpeed: number = 8;

  move(direction: number): void {
    const velocity = this.body.getLinearVelocity();

    // 只有在低于最大速度时才施加力
    if (Math.abs(velocity.x) < this.maxSpeed) {
      this.body.applyForceToCenter(
        Vec2(this.moveForce * direction, 0),
        true
      );
    }
  }

  jump(): void {
    const velocity = this.body.getLinearVelocity();
    this.body.setLinearVelocity(Vec2(velocity.x, this.jumpImpulse));
  }

  // 平滑停止
  stop(): void {
    const velocity = this.body.getLinearVelocity();
    this.body.setLinearVelocity(Vec2(velocity.x * 0.9, velocity.y));
  }
}
```

---

## 调试渲染

```typescript
class Box2DDebugDraw {
  private ctx: CanvasRenderingContext2D;
  private scale: number;
  private offset: Vec2;

  constructor(
    ctx: CanvasRenderingContext2D,
    scale: number = 30,
    offset: Vec2 = Vec2(400, 300)
  ) {
    this.ctx = ctx;
    this.scale = scale;
    this.offset = offset;
  }

  draw(world: World): void {
    // 绘制刚体
    for (let body = world.getBodyList(); body; body = body.getNext()) {
      this.drawBody(body);
    }

    // 绘制关节
    for (let joint = world.getJointList(); joint; joint = joint.getNext()) {
      this.drawJoint(joint);
    }

    // 绘制接触点
    for (let contact = world.getContactList(); contact; contact = contact.getNext()) {
      if (contact.isTouching()) {
        this.drawContact(contact);
      }
    }
  }

  private drawBody(body: Body): void {
    const pos = body.getPosition();
    const angle = body.getAngle();

    this.ctx.save();
    this.ctx.translate(
      this.offset.x + pos.x * this.scale,
      this.offset.y - pos.y * this.scale
    );
    this.ctx.rotate(-angle);

    // 根据刚体类型设置颜色
    if (body.isStatic()) {
      this.ctx.strokeStyle = '#00ff00';
      this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
    } else if (body.isKinematic()) {
      this.ctx.strokeStyle = '#0000ff';
      this.ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
    } else if (body.isAwake()) {
      this.ctx.strokeStyle = '#ff0000';
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    } else {
      this.ctx.strokeStyle = '#999999';
      this.ctx.fillStyle = 'rgba(150, 150, 150, 0.2)';
    }

    this.ctx.lineWidth = 2;

    for (let fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
      this.drawShape(fixture.getShape());
    }

    this.ctx.restore();
  }

  private drawShape(shape: Shape): void {
    const type = shape.getType();

    if (type === 'circle') {
      const circle = shape as CircleShape;
      const center = circle.getCenter();
      const radius = circle.getRadius() * this.scale;

      this.ctx.beginPath();
      this.ctx.arc(center.x * this.scale, -center.y * this.scale, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // 绘制半径线以显示旋转
      this.ctx.beginPath();
      this.ctx.moveTo(center.x * this.scale, -center.y * this.scale);
      this.ctx.lineTo(center.x * this.scale + radius, -center.y * this.scale);
      this.ctx.stroke();
    } else if (type === 'polygon') {
      const polygon = shape as PolygonShape;

      this.ctx.beginPath();
      for (let i = 0; i < polygon.m_count; i++) {
        const v = polygon.getVertex(i);
        if (i === 0) {
          this.ctx.moveTo(v.x * this.scale, -v.y * this.scale);
        } else {
          this.ctx.lineTo(v.x * this.scale, -v.y * this.scale);
        }
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
    } else if (type === 'edge') {
      const edge = shape as EdgeShape;
      this.ctx.beginPath();
      this.ctx.moveTo(edge.m_vertex1.x * this.scale, -edge.m_vertex1.y * this.scale);
      this.ctx.lineTo(edge.m_vertex2.x * this.scale, -edge.m_vertex2.y * this.scale);
      this.ctx.stroke();
    }
  }

  private drawJoint(joint: Joint): void {
    const anchorA = joint.getAnchorA();
    const anchorB = joint.getAnchorB();

    this.ctx.strokeStyle = '#ffff00';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);

    this.ctx.beginPath();
    this.ctx.moveTo(
      this.offset.x + anchorA.x * this.scale,
      this.offset.y - anchorA.y * this.scale
    );
    this.ctx.lineTo(
      this.offset.x + anchorB.x * this.scale,
      this.offset.y - anchorB.y * this.scale
    );
    this.ctx.stroke();

    this.ctx.setLineDash([]);
  }

  private drawContact(contact: Contact): void {
    const worldManifold = contact.getWorldManifold(null);
    if (!worldManifold) return;

    this.ctx.fillStyle = '#ff8800';

    for (const point of worldManifold.points) {
      this.ctx.beginPath();
      this.ctx.arc(
        this.offset.x + point.x * this.scale,
        this.offset.y - point.y * this.scale,
        3, 0, Math.PI * 2
      );
      this.ctx.fill();
    }
  }
}
```

---

## 最佳实践

### 性能提示

```typescript
// 1. 使用适当的刚体数量
// - 目标：< 200个动态刚体以保持稳定的60 FPS
// - 静态刚体成本更低

// 2. 简化碰撞形状
// - 圆形最快
// - 多边形应该 < 8个顶点
// - 静态地形使用链形状

// 3. 启用休眠
const world = new World({
  gravity: Vec2(0, -10),
  allowSleep: true
});

// 4. 触发器使用传感器
function createTriggerZone(world: World, x: number, y: number, width: number, height: number): Body {
  const body = world.createBody({
    type: 'static',
    position: Vec2(x, y)
  });

  body.createFixture({
    shape: Box(width / 2, height / 2),
    isSensor: true // 无物理响应，仅检测
  });

  return body;
}

// 5. 频繁创建/销毁的刚体使用对象池
class BodyPool {
  private pool: Body[] = [];
  private world: World;

  acquire(): Body {
    if (this.pool.length > 0) {
      const body = this.pool.pop()!;
      body.setActive(true);
      return body;
    }
    return this.createNewBody();
  }

  release(body: Body): void {
    body.setActive(false);
    body.setLinearVelocity(Vec2(0, 0));
    body.setAngularVelocity(0);
    this.pool.push(body);
  }
}
```

### 常见陷阱

```typescript
// 1. 穿透：快速物体穿过薄墙
// 解决方案：启用bullet标志
const bullet = world.createBody({
  type: 'dynamic',
  bullet: true // 启用CCD
});

// 2. 堆叠抖动
// 解决方案：增加位置迭代次数
world.step(1/60, 8, 6); // 更多位置迭代

// 3. 物体卡在瓦片边缘
// 解决方案：使用链形状或添加幽灵顶点
const chain = Chain(points, false);
chain.setPrevVertex(ghostPrevPoint);
chain.setNextVertex(ghostNextPoint);

// 4. 角色在斜坡上滑动
// 解决方案：使用脚部传感器并施加反向力
function handleSlope(body: Body, groundNormal: Vec2): void {
  const slopeAngle = Math.atan2(groundNormal.x, groundNormal.y);
  if (Math.abs(slopeAngle) > 0.1) {
    // 沿斜坡施加类似摩擦的力
    const velocity = body.getLinearVelocity();
    if (Math.abs(velocity.x) < 0.1) {
      body.setLinearVelocity(Vec2(0, velocity.y));
    }
  }
}
```

---

## 总结

Box2D是一个强大且成熟的物理引擎，是无数2D游戏的基础。关键要点：

- **世界设置**：使用固定时间步、适当的重力并启用休眠
- **刚体类型**：静态用于不可移动物体，动态用于模拟物体，运动学用于脚本控制的移动
- **形状**：选择最简单且合适的形状；圆形最快
- **关节**：连接刚体以创建复杂机制
- **碰撞过滤**：使用类别和掩码进行高效过滤
- **性能**：保持合理的刚体数量，触发器使用传感器

掌握这些基础知识，你可以创建从简单平台游戏到复杂物理解谜游戏的各种作品。

---

## 延伸阅读

- [Box2D官方手册](https://box2d.org/documentation/)
- [Planck.js文档](https://piqnt.com/planck.js/)
- [iforce2d Box2D教程](https://www.iforce2d.net/b2dtut/)
- [Ian Millington《游戏物理引擎开发》](https://www.amazon.com/Game-Physics-Engine-Development-Commercial-Grade/dp/0123819768)
