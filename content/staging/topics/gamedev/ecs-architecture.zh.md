---
title: 实体组件系统 (ECS) 架构
description: 深入理解ECS架构模式，掌握数据导向设计和高性能游戏开发
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - ECS
  - 架构
  - 数据导向
  - 性能
status: imported
origin: old/src/content/docs/gamedev/ecs-architecture.zh.md
divergence: 0.209
issues:
  - title-lang-en
  - title-language
legacy:
  category: GameDev
  subcategory: Architecture
  order: 2
  lastUpdated: 2026-01-07
---

## 什么是 ECS？

实体组件系统（Entity Component System，简称 ECS）是一种软件架构模式，主要应用于游戏开发和实时模拟系统中。它通过将数据与逻辑分离，以数据导向的方式组织代码，从而实现高性能和高度可扩展的系统设计。

ECS 的核心理念可以用三个关键词概括：

- **Entity（实体）**：一个唯一标识符，代表游戏世界中的一个对象
- **Component（组件）**：纯数据容器，不包含任何逻辑
- **System（系统）**：包含游戏逻辑，处理具有特定组件组合的实体

### ECS 的起源与发展

ECS 的概念最早可以追溯到 2002 年，由 Scott Bilas 在 GDC（Game Developers Conference）上提出。随后，这一架构模式在游戏行业得到了广泛应用和发展：

- **2007年**：《暗黑破坏神3》的开发团队采用了类似 ECS 的架构
- **2014年**：Unity 开始探索 ECS，后来发展为 DOTS（Data-Oriented Technology Stack）
- **2018年**：Rust 游戏引擎 Bevy 采用纯正的 ECS 架构，成为现代 ECS 的典范
- **2020年**：Unity DOTS 正式发布，ECS 进入主流游戏开发

---

## ECS vs OOP：两种不同的思维方式

### 传统面向对象（OOP）方法

在传统的面向对象编程中，我们通常通过继承来构建游戏对象：

```typescript
// OOP 方式：通过继承组织代码
abstract class GameObject {
  protected x: number = 0;
  protected y: number = 0;

  abstract update(deltaTime: number): void;
  abstract render(): void;
}

class Character extends GameObject {
  protected health: number = 100;
  protected speed: number = 5;

  update(deltaTime: number): void {
    // 更新角色逻辑
  }

  render(): void {
    // 渲染角色
  }
}

class Player extends Character {
  private inventory: Item[] = [];
  private experience: number = 0;

  update(deltaTime: number): void {
    super.update(deltaTime);
    this.handleInput();
    this.updateInventory();
  }

  private handleInput(): void {
    // 处理玩家输入
  }

  private updateInventory(): void {
    // 更新背包
  }

  render(): void {
    // 渲染玩家
  }
}

class Enemy extends Character {
  private target: Character | null = null;
  private aggroRange: number = 100;

  update(deltaTime: number): void {
    super.update(deltaTime);
    this.findTarget();
    this.attackTarget();
  }

  private findTarget(): void {
    // AI 寻找目标
  }

  private attackTarget(): void {
    // 攻击目标
  }

  render(): void {
    // 渲染敌人
  }
}

// 问题：如果需要一个会飞的敌人怎么办？
// 如果需要一个可以被玩家控制的敌人怎么办？
// 继承层次会变得越来越复杂...

class FlyingEnemy extends Enemy {
  private altitude: number = 0;

  update(deltaTime: number): void {
    super.update(deltaTime);
    this.updateFlight();
  }

  private updateFlight(): void {
    // 飞行逻辑
  }
}

// 钻石继承问题：飞行的可控制的敌人？
// class FlyingControllableEnemy extends ???
```

### OOP 的问题

传统 OOP 在游戏开发中面临几个核心问题：

1. **继承层次膨胀**：随着功能增加，继承树变得越来越深和宽
2. **菱形继承问题**：多重继承导致的复杂性和歧义
3. **紧耦合**：父类的改动会影响所有子类
4. **缓存不友好**：对象分散在内存中，导致频繁的缓存未命中
5. **难以组合**：无法灵活地在运行时添加或移除行为

```
OOP 继承层次问题示意：

                    GameObject
                        │
                ┌───────┴───────┐
                │               │
            Character       Vehicle
                │               │
        ┌───────┼───────┐       │
        │       │       │       │
     Player   Enemy   NPC     Car
        │       │
    ┌───┴───┐   │
    │       │   │
 Warrior  Mage  │
                │
        ┌───────┴───────┐
        │               │
   FlyingEnemy    BossEnemy
        │
        ?  ← 飞行的Boss敌人如何处理？
```

### ECS 方法

ECS 采用组合而非继承的方式，通过组件的自由组合来定义对象的特性：

```typescript
// ECS 方式：通过组合定义行为

// === 组件定义（纯数据） ===
interface Position {
  x: number;
  y: number;
}

interface Velocity {
  vx: number;
  vy: number;
}

interface Health {
  current: number;
  max: number;
}

interface PlayerInput {
  moveX: number;
  moveY: number;
  attack: boolean;
  jump: boolean;
}

interface AIController {
  target: number | null;  // 目标实体ID
  aggroRange: number;
  state: 'idle' | 'chase' | 'attack';
}

interface Flying {
  altitude: number;
  maxAltitude: number;
  isFlying: boolean;
}

interface Renderable {
  sprite: string;
  layer: number;
  visible: boolean;
}

interface Inventory {
  items: number[];  // 物品实体ID列表
  capacity: number;
}

// === 实体只是一个ID ===
type Entity = number;

// === 世界管理所有组件 ===
class World {
  private nextEntityId: number = 0;
  private entities: Set<Entity> = new Set();

  // 组件存储（使用 Map 模拟，实际实现会用更高效的数据结构）
  private positions: Map<Entity, Position> = new Map();
  private velocities: Map<Entity, Velocity> = new Map();
  private healths: Map<Entity, Health> = new Map();
  private playerInputs: Map<Entity, PlayerInput> = new Map();
  private aiControllers: Map<Entity, AIController> = new Map();
  private flyings: Map<Entity, Flying> = new Map();
  private renderables: Map<Entity, Renderable> = new Map();
  private inventories: Map<Entity, Inventory> = new Map();

  createEntity(): Entity {
    const entity = this.nextEntityId++;
    this.entities.add(entity);
    return entity;
  }

  destroyEntity(entity: Entity): void {
    this.entities.delete(entity);
    // 清理所有组件
    this.positions.delete(entity);
    this.velocities.delete(entity);
    this.healths.delete(entity);
    this.playerInputs.delete(entity);
    this.aiControllers.delete(entity);
    this.flyings.delete(entity);
    this.renderables.delete(entity);
    this.inventories.delete(entity);
  }

  // 组件操作方法
  addPosition(entity: Entity, position: Position): void {
    this.positions.set(entity, position);
  }

  getPosition(entity: Entity): Position | undefined {
    return this.positions.get(entity);
  }

  // ... 其他组件的操作方法

  // 查询具有特定组件组合的实体
  query<T extends keyof ComponentMap>(
    ...componentTypes: T[]
  ): Entity[] {
    return Array.from(this.entities).filter(entity =>
      componentTypes.every(type => this.hasComponent(entity, type))
    );
  }

  private hasComponent(entity: Entity, type: string): boolean {
    switch(type) {
      case 'position': return this.positions.has(entity);
      case 'velocity': return this.velocities.has(entity);
      case 'health': return this.healths.has(entity);
      // ... 其他组件
      default: return false;
    }
  }
}

// === 创建各种类型的实体 ===
const world = new World();

// 创建玩家：位置 + 速度 + 生命 + 玩家输入 + 渲染 + 背包
function createPlayer(world: World): Entity {
  const player = world.createEntity();
  world.addPosition(player, { x: 0, y: 0 });
  world.addVelocity(player, { vx: 0, vy: 0 });
  world.addHealth(player, { current: 100, max: 100 });
  world.addPlayerInput(player, { moveX: 0, moveY: 0, attack: false, jump: false });
  world.addRenderable(player, { sprite: 'player.png', layer: 1, visible: true });
  world.addInventory(player, { items: [], capacity: 20 });
  return player;
}

// 创建普通敌人：位置 + 速度 + 生命 + AI控制 + 渲染
function createEnemy(world: World): Entity {
  const enemy = world.createEntity();
  world.addPosition(enemy, { x: 100, y: 100 });
  world.addVelocity(enemy, { vx: 0, vy: 0 });
  world.addHealth(enemy, { current: 50, max: 50 });
  world.addAIController(enemy, { target: null, aggroRange: 100, state: 'idle' });
  world.addRenderable(enemy, { sprite: 'enemy.png', layer: 1, visible: true });
  return enemy;
}

// 创建飞行敌人：在普通敌人基础上 + 飞行组件
function createFlyingEnemy(world: World): Entity {
  const enemy = createEnemy(world);
  world.addFlying(enemy, { altitude: 50, maxAltitude: 200, isFlying: true });
  return enemy;
}

// 创建飞行Boss：飞行敌人 + 更多生命 + 特殊能力
function createFlyingBoss(world: World): Entity {
  const boss = createFlyingEnemy(world);
  // 修改生命值
  world.addHealth(boss, { current: 500, max: 500 });
  // 可以添加更多Boss特有的组件
  return boss;
}

// 创建可被玩家控制的敌人（被魅惑）
function createControllableEnemy(world: World): Entity {
  const enemy = createEnemy(world);
  // 移除AI控制，添加玩家输入
  world.removeAIController(enemy);
  world.addPlayerInput(enemy, { moveX: 0, moveY: 0, attack: false, jump: false });
  return enemy;
}
```

### ECS 的优势

```
ECS 组合方式示意：

┌─────────────────────────────────────────────────────────────┐
│                      Component Pool                          │
├──────────┬──────────┬──────────┬──────────┬────────────────┤
│ Position │ Velocity │  Health  │ AI Ctrl  │    Flying      │
├──────────┼──────────┼──────────┼──────────┼────────────────┤
│   [P]    │   [V]    │   [H]    │   [A]    │      [F]       │
└──────────┴──────────┴──────────┴──────────┴────────────────┘

Entity 1 (Player):      [P] + [V] + [H] + [PlayerInput] + [Inventory]
Entity 2 (Enemy):       [P] + [V] + [H] + [A]
Entity 3 (FlyingEnemy): [P] + [V] + [H] + [A] + [F]
Entity 4 (FlyingBoss):  [P] + [V] + [H] + [A] + [F] + [BossAbility]
Entity 5 (Bullet):      [P] + [V] + [Damage]
Entity 6 (Pickup):      [P] + [Collectable]

任意组合，无需继承！
```

---

## 核心概念详解

### Entity（实体）

实体是 ECS 中最简单的概念：它只是一个唯一标识符（通常是整数），用于关联组件。

```typescript
// 实体的多种实现方式

// 方式1：简单整数ID
type Entity = number;

// 方式2：带版本号的ID（用于复用ID时避免悬空引用）
interface Entity {
  id: number;      // 索引
  generation: number;  // 版本号
}

// 方式3：UUID字符串（适合分布式系统）
type Entity = string;

// 实体ID生成器
class EntityGenerator {
  private nextId: number = 0;
  private freeList: number[] = [];
  private generations: number[] = [];

  create(): Entity {
    let id: number;

    if (this.freeList.length > 0) {
      // 复用已销毁的ID
      id = this.freeList.pop()!;
    } else {
      // 分配新ID
      id = this.nextId++;
      this.generations.push(0);
    }

    return {
      id,
      generation: this.generations[id]
    };
  }

  destroy(entity: Entity): void {
    // 增加版本号
    this.generations[entity.id]++;
    // 将ID加入空闲列表
    this.freeList.push(entity.id);
  }

  isAlive(entity: Entity): boolean {
    return this.generations[entity.id] === entity.generation;
  }
}
```

### Component（组件）

组件是纯数据容器，只存储状态，不包含任何行为逻辑。

```typescript
// 组件设计原则：
// 1. 只包含数据，不包含方法
// 2. 数据应该是扁平的，避免嵌套引用
// 3. 优先使用值类型而非引用类型
// 4. 保持组件小而专注

// 好的组件设计
interface Transform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

interface Velocity {
  x: number;
  y: number;
}

interface Sprite {
  textureId: number;  // 使用ID而非引用
  width: number;
  height: number;
  frameIndex: number;
}

interface Collider {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  layer: number;
  mask: number;
}

interface Animation {
  currentAnimation: string;
  frameTime: number;
  elapsedTime: number;
  isPlaying: boolean;
  loop: boolean;
}

// 不好的组件设计
interface BadComponent {
  // 问题1：包含行为
  update(): void;  // 不应该有方法

  // 问题2：嵌套对象
  nested: {
    deep: {
      value: number;
    };
  };

  // 问题3：引用类型
  children: GameObject[];  // 避免引用其他对象

  // 问题4：组件过大，职责不清
  x: number;
  y: number;
  health: number;
  mana: number;
  inventory: Item[];
  // ... 太多不相关的数据
}

// 标记组件（Tag Component）：没有数据，只用于标记
interface Player {}  // 标记这是玩家实体
interface Enemy {}   // 标记这是敌人实体
interface Dead {}    // 标记已死亡
interface Invincible {} // 标记无敌状态
```

### System（系统）

系统包含所有的游戏逻辑，它们查询具有特定组件组合的实体，并对这些实体进行处理。

```typescript
// 系统接口
interface System {
  // 系统依赖的组件类型
  readonly requiredComponents: string[];

  // 每帧更新
  update(world: World, deltaTime: number): void;
}

// 移动系统：处理所有有位置和速度的实体
class MovementSystem implements System {
  readonly requiredComponents = ['position', 'velocity'];

  update(world: World, deltaTime: number): void {
    // 查询所有有 Position 和 Velocity 组件的实体
    const entities = world.query('position', 'velocity');

    for (const entity of entities) {
      const position = world.getPosition(entity)!;
      const velocity = world.getVelocity(entity)!;

      // 更新位置
      position.x += velocity.x * deltaTime;
      position.y += velocity.y * deltaTime;
    }
  }
}

// 重力系统：为有重力组件的实体施加重力
class GravitySystem implements System {
  readonly requiredComponents = ['velocity', 'gravity'];
  private readonly GRAVITY = 9.8;

  update(world: World, deltaTime: number): void {
    const entities = world.query('velocity', 'gravity');

    for (const entity of entities) {
      const velocity = world.getVelocity(entity)!;
      const gravity = world.getGravity(entity)!;

      if (!gravity.grounded) {
        velocity.y += this.GRAVITY * gravity.multiplier * deltaTime;
      }
    }
  }
}

// 碰撞检测系统
class CollisionSystem implements System {
  readonly requiredComponents = ['position', 'collider'];

  update(world: World, deltaTime: number): void {
    const entities = world.query('position', 'collider');
    const count = entities.length;

    // 简单的 O(n^2) 碰撞检测
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const entityA = entities[i];
        const entityB = entities[j];

        if (this.checkCollision(world, entityA, entityB)) {
          // 发送碰撞事件
          world.emit('collision', { entityA, entityB });
        }
      }
    }
  }

  private checkCollision(world: World, a: Entity, b: Entity): boolean {
    const posA = world.getPosition(a)!;
    const posB = world.getPosition(b)!;
    const colA = world.getCollider(a)!;
    const colB = world.getCollider(b)!;

    // 检查层级掩码
    if ((colA.layer & colB.mask) === 0 && (colB.layer & colA.mask) === 0) {
      return false;
    }

    // AABB 碰撞检测
    return !(
      posA.x + colA.width < posB.x ||
      posA.x > posB.x + colB.width ||
      posA.y + colA.height < posB.y ||
      posA.y > posB.y + colB.height
    );
  }
}

// 渲染系统
class RenderSystem implements System {
  readonly requiredComponents = ['position', 'sprite'];

  constructor(private renderer: Renderer) {}

  update(world: World, deltaTime: number): void {
    const entities = world.query('position', 'sprite');

    // 按层级排序
    entities.sort((a, b) => {
      const spriteA = world.getSprite(a)!;
      const spriteB = world.getSprite(b)!;
      return spriteA.layer - spriteB.layer;
    });

    // 渲染
    for (const entity of entities) {
      const position = world.getPosition(entity)!;
      const sprite = world.getSprite(entity)!;

      this.renderer.draw(sprite.textureId, position.x, position.y);
    }
  }
}

// AI 系统
class AISystem implements System {
  readonly requiredComponents = ['position', 'velocity', 'aiController'];

  update(world: World, deltaTime: number): void {
    const entities = world.query('position', 'velocity', 'aiController');

    for (const entity of entities) {
      const position = world.getPosition(entity)!;
      const velocity = world.getVelocity(entity)!;
      const ai = world.getAIController(entity)!;

      switch (ai.state) {
        case 'idle':
          this.handleIdle(world, entity, ai);
          break;
        case 'chase':
          this.handleChase(world, entity, position, velocity, ai);
          break;
        case 'attack':
          this.handleAttack(world, entity, ai);
          break;
      }
    }
  }

  private handleIdle(world: World, entity: Entity, ai: AIController): void {
    // 搜索范围内的目标
    const target = this.findTarget(world, entity, ai.aggroRange);
    if (target !== null) {
      ai.target = target;
      ai.state = 'chase';
    }
  }

  private handleChase(
    world: World,
    entity: Entity,
    position: Position,
    velocity: Velocity,
    ai: AIController
  ): void {
    if (ai.target === null) {
      ai.state = 'idle';
      return;
    }

    const targetPos = world.getPosition(ai.target);
    if (!targetPos) {
      ai.target = null;
      ai.state = 'idle';
      return;
    }

    // 计算朝向目标的方向
    const dx = targetPos.x - position.x;
    const dy = targetPos.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 20) {
      // 到达攻击范围
      velocity.x = 0;
      velocity.y = 0;
      ai.state = 'attack';
    } else {
      // 移动向目标
      const speed = 50;
      velocity.x = (dx / distance) * speed;
      velocity.y = (dy / distance) * speed;
    }
  }

  private handleAttack(world: World, entity: Entity, ai: AIController): void {
    // 攻击逻辑
  }

  private findTarget(world: World, entity: Entity, range: number): Entity | null {
    // 查找范围内的玩家实体
    return null;
  }
}
```

### 系统执行顺序

系统的执行顺序非常重要，需要仔细规划：

```typescript
class GameLoop {
  private systems: System[] = [];
  private world: World;

  constructor() {
    this.world = new World();

    // 按顺序添加系统
    this.systems = [
      // 1. 输入处理
      new InputSystem(),

      // 2. AI 决策
      new AISystem(),

      // 3. 物理相关
      new GravitySystem(),
      new MovementSystem(),
      new CollisionSystem(),

      // 4. 游戏逻辑
      new CombatSystem(),
      new HealthSystem(),
      new PickupSystem(),

      // 5. 动画更新
      new AnimationSystem(),

      // 6. 渲染（最后执行）
      new RenderSystem(renderer),

      // 7. 清理
      new CleanupSystem(),
    ];
  }

  update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update(this.world, deltaTime);
    }
  }
}
```

---

## 数据局部性与缓存优化

ECS 架构的一个核心优势是对 CPU 缓存的友好设计。理解这一点需要了解现代计算机的内存层次结构。

### 内存层次结构

```
┌─────────────────────────────────────────────────────────────┐
│                     CPU Core                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  Registers                          │    │
│  │                   (~1 ns)                           │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               L1 Cache (32KB)                       │    │
│  │                  (~1-2 ns)                          │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               L2 Cache (256KB)                      │    │
│  │                  (~3-5 ns)                          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                 L3 Cache (8MB)                               │
│                    (~10-20 ns)                               │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Main Memory                                │
│                    (~50-100 ns)                              │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      SSD/HDD                                 │
│               (~10,000-10,000,000 ns)                        │
└─────────────────────────────────────────────────────────────┘
```

### OOP 的缓存问题

传统 OOP 中，对象通常分散存储在堆内存中：

```typescript
// OOP 内存布局问题

class GameObject {
  x: number;       // 8 bytes
  y: number;       // 8 bytes
  health: number;  // 8 bytes
  mana: number;    // 8 bytes
  name: string;    // 指针 + 字符串数据
  sprite: Sprite;  // 指针 + Sprite 数据
  children: GameObject[];  // 指针 + 数组 + 更多指针
}

// 对象在内存中的布局（示意）：
//
// 地址 0x1000: GameObject1 { x, y, health, ... }
// 地址 0x5000: GameObject2 { x, y, health, ... }  ← 不连续！
// 地址 0x8000: Sprite1 { ... }
// 地址 0xA000: GameObject3 { x, y, health, ... }
// 地址 0xF000: Sprite2 { ... }
//
// 遍历所有对象时，CPU 需要跳跃访问内存，
// 导致大量缓存未命中（Cache Miss）

function updateAllObjects(objects: GameObject[]): void {
  for (const obj of objects) {
    // 每次访问 obj.x 可能导致缓存未命中
    // 因为对象分散在内存各处
    obj.x += obj.vx;
    obj.y += obj.vy;
  }
}
```

### ECS 的缓存友好设计

ECS 将相同类型的组件存储在连续的数组中：

```typescript
// ECS 缓存友好的内存布局

// 组件按类型连续存储
class ComponentStorage<T> {
  // 连续的内存数组
  private data: T[] = [];
  // 实体ID到数组索引的映射
  private entityToIndex: Map<Entity, number> = new Map();
  // 索引到实体ID的映射（用于删除时的交换）
  private indexToEntity: Entity[] = [];

  add(entity: Entity, component: T): void {
    const index = this.data.length;
    this.data.push(component);
    this.entityToIndex.set(entity, index);
    this.indexToEntity.push(entity);
  }

  get(entity: Entity): T | undefined {
    const index = this.entityToIndex.get(entity);
    return index !== undefined ? this.data[index] : undefined;
  }

  remove(entity: Entity): void {
    const index = this.entityToIndex.get(entity);
    if (index === undefined) return;

    // 使用 swap-remove 策略保持数组紧凑
    const lastIndex = this.data.length - 1;
    if (index !== lastIndex) {
      // 将最后一个元素移到被删除的位置
      this.data[index] = this.data[lastIndex];
      const movedEntity = this.indexToEntity[lastIndex];
      this.entityToIndex.set(movedEntity, index);
      this.indexToEntity[index] = movedEntity;
    }

    this.data.pop();
    this.indexToEntity.pop();
    this.entityToIndex.delete(entity);
  }

  // 直接迭代数据数组
  *iterate(): IterableIterator<[Entity, T]> {
    for (let i = 0; i < this.data.length; i++) {
      yield [this.indexToEntity[i], this.data[i]];
    }
  }

  // 获取原始数组用于批量处理
  getRawData(): T[] {
    return this.data;
  }
}

// 内存布局示意：
//
// Position 数组: [pos1, pos2, pos3, pos4, pos5, ...]  ← 连续！
// Velocity 数组: [vel1, vel2, vel3, vel4, vel5, ...]  ← 连续！
// Health 数组:   [hp1,  hp2,  hp3,  ...]              ← 连续！
//
// 当移动系统遍历 Position 和 Velocity 时，
// CPU 可以有效利用缓存预取

class OptimizedMovementSystem {
  update(world: World, deltaTime: number): void {
    // 直接访问原始数组，最大化缓存效率
    const positions = world.positionStorage.getRawData();
    const velocities = world.velocityStorage.getRawData();
    const count = positions.length;

    // 线性遍历连续内存
    for (let i = 0; i < count; i++) {
      positions[i].x += velocities[i].x * deltaTime;
      positions[i].y += velocities[i].y * deltaTime;
    }

    // CPU 预取器可以高效地预加载接下来的数据
  }
}
```

### Archetype（原型）存储

更高级的 ECS 实现使用 Archetype 来进一步优化内存布局：

```typescript
// Archetype：具有相同组件组合的实体集合

type ComponentType = string;

interface Archetype {
  // 这个原型包含的组件类型
  componentTypes: Set<ComponentType>;

  // 每种组件的存储
  storage: Map<ComponentType, any[]>;

  // 实体列表
  entities: Entity[];
}

class ArchetypeStorage {
  private archetypes: Archetype[] = [];
  private entityArchetype: Map<Entity, Archetype> = new Map();

  // 根据组件组合获取或创建原型
  getOrCreateArchetype(types: ComponentType[]): Archetype {
    const typeSet = new Set(types);

    // 查找现有原型
    for (const archetype of this.archetypes) {
      if (this.setsEqual(archetype.componentTypes, typeSet)) {
        return archetype;
      }
    }

    // 创建新原型
    const archetype: Archetype = {
      componentTypes: typeSet,
      storage: new Map(),
      entities: []
    };

    for (const type of types) {
      archetype.storage.set(type, []);
    }

    this.archetypes.push(archetype);
    return archetype;
  }

  // 添加组件时可能需要迁移到新原型
  addComponent(entity: Entity, type: ComponentType, data: any): void {
    const currentArchetype = this.entityArchetype.get(entity);

    if (currentArchetype) {
      // 获取当前所有组件类型
      const newTypes = new Set(currentArchetype.componentTypes);
      newTypes.add(type);

      // 迁移到新原型
      const newArchetype = this.getOrCreateArchetype([...newTypes]);
      this.migrateEntity(entity, currentArchetype, newArchetype);

      // 添加新组件
      newArchetype.storage.get(type)!.push(data);
    } else {
      // 新实体
      const archetype = this.getOrCreateArchetype([type]);
      archetype.entities.push(entity);
      archetype.storage.get(type)!.push(data);
      this.entityArchetype.set(entity, archetype);
    }
  }

  // 查询匹配的原型
  queryArchetypes(...types: ComponentType[]): Archetype[] {
    return this.archetypes.filter(archetype =>
      types.every(type => archetype.componentTypes.has(type))
    );
  }

  private migrateEntity(
    entity: Entity,
    from: Archetype,
    to: Archetype
  ): void {
    const index = from.entities.indexOf(entity);

    // 复制现有组件到新原型
    for (const type of from.componentTypes) {
      const data = from.storage.get(type)![index];
      if (to.componentTypes.has(type)) {
        to.storage.get(type)!.push(data);
      }
    }

    // 从旧原型移除（使用 swap-remove）
    this.swapRemove(from, index);

    // 添加到新原型
    to.entities.push(entity);
    this.entityArchetype.set(entity, to);
  }

  private swapRemove(archetype: Archetype, index: number): void {
    const lastIndex = archetype.entities.length - 1;

    if (index !== lastIndex) {
      archetype.entities[index] = archetype.entities[lastIndex];
      for (const storage of archetype.storage.values()) {
        storage[index] = storage[lastIndex];
      }
    }

    archetype.entities.pop();
    for (const storage of archetype.storage.values()) {
      storage.pop();
    }
  }

  private setsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }
}

// Archetype 内存布局示意：
//
// Archetype A (Position + Velocity):
// ┌───────────────────────────────────────┐
// │ Entities: [e1, e2, e3, e4]            │
// │ Position: [p1, p2, p3, p4]  ← 连续！  │
// │ Velocity: [v1, v2, v3, v4]  ← 连续！  │
// └───────────────────────────────────────┘
//
// Archetype B (Position + Velocity + Health):
// ┌───────────────────────────────────────┐
// │ Entities: [e5, e6]                    │
// │ Position: [p5, p6]                    │
// │ Velocity: [v5, v6]                    │
// │ Health:   [h5, h6]                    │
// └───────────────────────────────────────┘
//
// 查询 (Position + Velocity) 时，会匹配到 A 和 B
// 每个原型内的数据都是连续的，缓存效率极高
```

---

## 实际框架实现

### Unity DOTS

Unity DOTS (Data-Oriented Technology Stack) 是 Unity 官方的 ECS 实现：

```csharp
// Unity DOTS 示例

using Unity.Entities;
using Unity.Mathematics;
using Unity.Transforms;
using Unity.Burst;
using Unity.Jobs;

// 组件定义
public struct MoveSpeed : IComponentData
{
    public float Value;
}

public struct RotationSpeed : IComponentData
{
    public float RadiansPerSecond;
}

public struct Enemy : IComponentData
{
    // 标记组件，无数据
}

// 系统定义
[BurstCompile]  // 使用 Burst 编译器优化
public partial struct MovementSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        float deltaTime = SystemAPI.Time.DeltaTime;

        // 使用 Job 系统并行处理
        new MoveJob
        {
            DeltaTime = deltaTime
        }.ScheduleParallel();
    }
}

[BurstCompile]
public partial struct MoveJob : IJobEntity
{
    public float DeltaTime;

    // 自动匹配所有有 LocalTransform 和 MoveSpeed 的实体
    public void Execute(ref LocalTransform transform, in MoveSpeed speed)
    {
        transform = transform.Translate(
            new float3(0, 0, speed.Value * DeltaTime)
        );
    }
}

// 旋转系统
[BurstCompile]
public partial struct RotationSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        float deltaTime = SystemAPI.Time.DeltaTime;

        foreach (var (transform, speed) in
                 SystemAPI.Query<RefRW<LocalTransform>, RefRO<RotationSpeed>>())
        {
            transform.ValueRW = transform.ValueRO.RotateY(
                speed.ValueRO.RadiansPerSecond * deltaTime
            );
        }
    }
}

// 创建实体
public partial struct SpawnerSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        var ecb = new EntityCommandBuffer(Allocator.Temp);

        // 创建敌人实体
        var entity = ecb.CreateEntity();
        ecb.AddComponent(entity, new LocalTransform
        {
            Position = new float3(0, 0, 0),
            Rotation = quaternion.identity,
            Scale = 1
        });
        ecb.AddComponent(entity, new MoveSpeed { Value = 5.0f });
        ecb.AddComponent(entity, new RotationSpeed { RadiansPerSecond = 1.0f });
        ecb.AddComponent(entity, new Enemy());

        ecb.Playback(state.EntityManager);
        ecb.Dispose();
    }
}

// 查询与过滤
public partial struct TargetingSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        // 查询所有敌人
        foreach (var (transform, entity) in
                 SystemAPI.Query<RefRO<LocalTransform>>()
                          .WithAll<Enemy>()
                          .WithEntityAccess())
        {
            // 处理敌人
            float3 position = transform.ValueRO.Position;
            // ...
        }

        // 排除某些组件
        foreach (var transform in
                 SystemAPI.Query<RefRW<LocalTransform>>()
                          .WithNone<Enemy>()  // 排除敌人
                          .WithAll<MoveSpeed>())  // 必须有移动速度
        {
            // 处理非敌人的可移动实体
        }
    }
}
```

### Bevy ECS (Rust)

Bevy 是 Rust 语言中最流行的游戏引擎，采用纯正的 ECS 架构：

```rust
// Bevy ECS 示例

use bevy::prelude::*;

// 组件定义
#[derive(Component)]
struct Position {
    x: f32,
    y: f32,
}

#[derive(Component)]
struct Velocity {
    x: f32,
    y: f32,
}

#[derive(Component)]
struct Health {
    current: f32,
    max: f32,
}

#[derive(Component)]
struct Player;  // 标记组件

#[derive(Component)]
struct Enemy;

// 资源（全局单例数据）
#[derive(Resource)]
struct GameState {
    score: u32,
    level: u32,
}

// 事件
#[derive(Event)]
struct DamageEvent {
    target: Entity,
    amount: f32,
}

// 系统定义
fn movement_system(
    time: Res<Time>,
    mut query: Query<(&mut Position, &Velocity)>,
) {
    let delta = time.delta_seconds();

    for (mut pos, vel) in query.iter_mut() {
        pos.x += vel.x * delta;
        pos.y += vel.y * delta;
    }
}

// 带过滤的查询
fn player_input_system(
    keyboard: Res<ButtonInput<KeyCode>>,
    mut query: Query<&mut Velocity, With<Player>>,  // 只查询有 Player 标记的
) {
    for mut velocity in query.iter_mut() {
        velocity.x = 0.0;
        velocity.y = 0.0;

        if keyboard.pressed(KeyCode::KeyW) {
            velocity.y += 100.0;
        }
        if keyboard.pressed(KeyCode::KeyS) {
            velocity.y -= 100.0;
        }
        if keyboard.pressed(KeyCode::KeyA) {
            velocity.x -= 100.0;
        }
        if keyboard.pressed(KeyCode::KeyD) {
            velocity.x += 100.0;
        }
    }
}

// 复杂查询：敌人AI
fn enemy_ai_system(
    player_query: Query<&Position, With<Player>>,
    mut enemy_query: Query<(&Position, &mut Velocity), With<Enemy>>,
) {
    // 获取玩家位置
    let Ok(player_pos) = player_query.get_single() else {
        return;
    };

    // 让所有敌人追踪玩家
    for (enemy_pos, mut velocity) in enemy_query.iter_mut() {
        let dx = player_pos.x - enemy_pos.x;
        let dy = player_pos.y - enemy_pos.y;
        let distance = (dx * dx + dy * dy).sqrt();

        if distance > 0.0 {
            let speed = 50.0;
            velocity.x = (dx / distance) * speed;
            velocity.y = (dy / distance) * speed;
        }
    }
}

// 处理事件
fn damage_system(
    mut events: EventReader<DamageEvent>,
    mut health_query: Query<&mut Health>,
    mut commands: Commands,
) {
    for event in events.read() {
        if let Ok(mut health) = health_query.get_mut(event.target) {
            health.current -= event.amount;

            if health.current <= 0.0 {
                // 销毁实体
                commands.entity(event.target).despawn();
            }
        }
    }
}

// 生成敌人
fn spawn_enemies(
    mut commands: Commands,
    asset_server: Res<AssetServer>,
) {
    for i in 0..10 {
        commands.spawn((
            Position { x: i as f32 * 50.0, y: 100.0 },
            Velocity { x: 0.0, y: 0.0 },
            Health { current: 100.0, max: 100.0 },
            Enemy,
            // Bevy 的渲染组件
            SpriteBundle {
                texture: asset_server.load("enemy.png"),
                ..default()
            },
        ));
    }
}

// 主函数
fn main() {
    App::new()
        .add_plugins(DefaultPlugins)
        .insert_resource(GameState { score: 0, level: 1 })
        .add_event::<DamageEvent>()
        .add_systems(Startup, spawn_enemies)
        .add_systems(Update, (
            player_input_system,
            enemy_ai_system,
            movement_system,
            damage_system,
        ))
        .run();
}

// 系统调度与依赖
fn main_with_ordering() {
    App::new()
        .add_plugins(DefaultPlugins)
        .add_systems(Update, (
            // 使用 chain() 定义顺序
            (
                player_input_system,
                enemy_ai_system,
            ).chain(),

            // 这些可以并行执行
            movement_system,

            // 必须在移动之后执行
            collision_system.after(movement_system),

            // 在所有其他系统之后
            damage_system.after(collision_system),
        ))
        .run();
}
```

### TypeScript ECS 实现

一个简单但完整的 TypeScript ECS 实现：

```typescript
// 完整的 TypeScript ECS 框架

// ===== 核心类型定义 =====

type Entity = number;
type ComponentType = new (...args: any[]) => any;
type ComponentInstance = object;

// ===== 组件存储 =====

class ComponentStore<T extends ComponentInstance> {
  private data: T[] = [];
  private entityToIndex: Map<Entity, number> = new Map();
  private indexToEntity: Entity[] = [];

  add(entity: Entity, component: T): void {
    if (this.entityToIndex.has(entity)) {
      throw new Error(`Entity ${entity} already has this component`);
    }

    const index = this.data.length;
    this.data.push(component);
    this.entityToIndex.set(entity, index);
    this.indexToEntity.push(entity);
  }

  get(entity: Entity): T | undefined {
    const index = this.entityToIndex.get(entity);
    return index !== undefined ? this.data[index] : undefined;
  }

  has(entity: Entity): boolean {
    return this.entityToIndex.has(entity);
  }

  remove(entity: Entity): T | undefined {
    const index = this.entityToIndex.get(entity);
    if (index === undefined) return undefined;

    const removed = this.data[index];
    const lastIndex = this.data.length - 1;

    if (index !== lastIndex) {
      this.data[index] = this.data[lastIndex];
      const movedEntity = this.indexToEntity[lastIndex];
      this.entityToIndex.set(movedEntity, index);
      this.indexToEntity[index] = movedEntity;
    }

    this.data.pop();
    this.indexToEntity.pop();
    this.entityToIndex.delete(entity);

    return removed;
  }

  *entries(): IterableIterator<[Entity, T]> {
    for (let i = 0; i < this.data.length; i++) {
      yield [this.indexToEntity[i], this.data[i]];
    }
  }

  get size(): number {
    return this.data.length;
  }
}

// ===== 世界类 =====

class World {
  private nextEntityId: Entity = 0;
  private entities: Set<Entity> = new Set();
  private componentStores: Map<ComponentType, ComponentStore<any>> = new Map();
  private systems: System[] = [];
  private eventQueue: Array<{ type: string; data: any }> = [];
  private eventHandlers: Map<string, Array<(data: any) => void>> = new Map();

  // 实体管理
  createEntity(): Entity {
    const entity = this.nextEntityId++;
    this.entities.add(entity);
    return entity;
  }

  destroyEntity(entity: Entity): void {
    for (const store of this.componentStores.values()) {
      store.remove(entity);
    }
    this.entities.delete(entity);
  }

  isAlive(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  // 组件管理
  addComponent<T extends ComponentInstance>(
    entity: Entity,
    componentType: ComponentType,
    component: T
  ): this {
    let store = this.componentStores.get(componentType);
    if (!store) {
      store = new ComponentStore<T>();
      this.componentStores.set(componentType, store);
    }
    store.add(entity, component);
    return this;
  }

  getComponent<T extends ComponentInstance>(
    entity: Entity,
    componentType: new (...args: any[]) => T
  ): T | undefined {
    return this.componentStores.get(componentType)?.get(entity);
  }

  hasComponent(entity: Entity, componentType: ComponentType): boolean {
    return this.componentStores.get(componentType)?.has(entity) ?? false;
  }

  removeComponent(entity: Entity, componentType: ComponentType): void {
    this.componentStores.get(componentType)?.remove(entity);
  }

  // 查询
  query(...componentTypes: ComponentType[]): Entity[] {
    if (componentTypes.length === 0) {
      return Array.from(this.entities);
    }

    // 从最小的存储开始过滤
    const stores = componentTypes
      .map(type => this.componentStores.get(type))
      .filter((store): store is ComponentStore<any> => store !== undefined)
      .sort((a, b) => a.size - b.size);

    if (stores.length !== componentTypes.length) {
      return []; // 某些组件类型不存在
    }

    const result: Entity[] = [];
    const [smallest, ...rest] = stores;

    for (const [entity] of smallest.entries()) {
      if (rest.every(store => store.has(entity))) {
        result.push(entity);
      }
    }

    return result;
  }

  // 系统管理
  addSystem(system: System): this {
    this.systems.push(system);
    if (system.onAdd) {
      system.onAdd(this);
    }
    return this;
  }

  removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      if (system.onRemove) {
        system.onRemove(this);
      }
      this.systems.splice(index, 1);
    }
  }

  update(deltaTime: number): void {
    for (const system of this.systems) {
      system.update(this, deltaTime);
    }

    // 处理事件队列
    this.processEvents();
  }

  // 事件系统
  emit(type: string, data: any): void {
    this.eventQueue.push({ type, data });
  }

  on(type: string, handler: (data: any) => void): () => void {
    let handlers = this.eventHandlers.get(type);
    if (!handlers) {
      handlers = [];
      this.eventHandlers.set(type, handlers);
    }
    handlers.push(handler);

    return () => {
      const idx = handlers!.indexOf(handler);
      if (idx !== -1) handlers!.splice(idx, 1);
    };
  }

  private processEvents(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      const handlers = this.eventHandlers.get(event.type);
      if (handlers) {
        for (const handler of handlers) {
          handler(event.data);
        }
      }
    }
  }
}

// ===== 系统接口 =====

interface System {
  update(world: World, deltaTime: number): void;
  onAdd?(world: World): void;
  onRemove?(world: World): void;
}

// ===== 组件定义 =====

class Position {
  constructor(public x: number = 0, public y: number = 0) {}
}

class Velocity {
  constructor(public x: number = 0, public y: number = 0) {}
}

class Sprite {
  constructor(
    public image: string,
    public width: number = 32,
    public height: number = 32
  ) {}
}

class Health {
  constructor(public current: number, public max: number = current) {}
}

class Player {}  // 标记组件
class Enemy {}

class AIController {
  constructor(
    public state: 'idle' | 'chase' | 'attack' = 'idle',
    public target: Entity | null = null,
    public aggroRange: number = 100
  ) {}
}

// ===== 系统实现 =====

class MovementSystem implements System {
  update(world: World, deltaTime: number): void {
    const entities = world.query(Position, Velocity);

    for (const entity of entities) {
      const position = world.getComponent(entity, Position)!;
      const velocity = world.getComponent(entity, Velocity)!;

      position.x += velocity.x * deltaTime;
      position.y += velocity.y * deltaTime;
    }
  }
}

class AISystem implements System {
  update(world: World, deltaTime: number): void {
    const enemies = world.query(Position, Velocity, AIController, Enemy);
    const players = world.query(Position, Player);

    if (players.length === 0) return;

    const playerEntity = players[0];
    const playerPos = world.getComponent(playerEntity, Position)!;

    for (const enemy of enemies) {
      const pos = world.getComponent(enemy, Position)!;
      const vel = world.getComponent(enemy, Velocity)!;
      const ai = world.getComponent(enemy, AIController)!;

      const dx = playerPos.x - pos.x;
      const dy = playerPos.y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      switch (ai.state) {
        case 'idle':
          if (distance < ai.aggroRange) {
            ai.state = 'chase';
            ai.target = playerEntity;
          }
          break;

        case 'chase':
          if (distance > ai.aggroRange * 1.5) {
            ai.state = 'idle';
            ai.target = null;
            vel.x = 0;
            vel.y = 0;
          } else if (distance < 20) {
            ai.state = 'attack';
          } else {
            const speed = 50;
            vel.x = (dx / distance) * speed;
            vel.y = (dy / distance) * speed;
          }
          break;

        case 'attack':
          if (distance > 30) {
            ai.state = 'chase';
          } else {
            world.emit('attack', { attacker: enemy, target: playerEntity });
          }
          break;
      }
    }
  }
}

class CollisionSystem implements System {
  update(world: World, deltaTime: number): void {
    const entities = world.query(Position, Sprite);
    const count = entities.length;

    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const a = entities[i];
        const b = entities[j];

        if (this.checkCollision(world, a, b)) {
          world.emit('collision', { entityA: a, entityB: b });
        }
      }
    }
  }

  private checkCollision(world: World, a: Entity, b: Entity): boolean {
    const posA = world.getComponent(a, Position)!;
    const posB = world.getComponent(b, Position)!;
    const spriteA = world.getComponent(a, Sprite)!;
    const spriteB = world.getComponent(b, Sprite)!;

    return !(
      posA.x + spriteA.width < posB.x ||
      posA.x > posB.x + spriteB.width ||
      posA.y + spriteA.height < posB.y ||
      posA.y > posB.y + spriteB.height
    );
  }
}

class RenderSystem implements System {
  private ctx: CanvasRenderingContext2D;
  private images: Map<string, HTMLImageElement> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  update(world: World, deltaTime: number): void {
    // 清屏
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // 渲染所有有精灵的实体
    const entities = world.query(Position, Sprite);

    for (const entity of entities) {
      const pos = world.getComponent(entity, Position)!;
      const sprite = world.getComponent(entity, Sprite)!;

      // 简化渲染：绘制矩形
      this.ctx.fillStyle = world.hasComponent(entity, Player) ? 'blue' : 'red';
      this.ctx.fillRect(pos.x, pos.y, sprite.width, sprite.height);
    }
  }
}

// ===== 游戏示例 =====

class Game {
  private world: World;
  private lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.world = new World();

    // 添加系统
    this.world
      .addSystem(new AISystem())
      .addSystem(new MovementSystem())
      .addSystem(new CollisionSystem())
      .addSystem(new RenderSystem(canvas));

    // 设置事件处理
    this.world.on('collision', this.handleCollision.bind(this));
    this.world.on('attack', this.handleAttack.bind(this));

    // 创建实体
    this.spawnPlayer();
    this.spawnEnemies(5);
  }

  private spawnPlayer(): Entity {
    const player = this.world.createEntity();
    this.world
      .addComponent(player, Position, new Position(400, 300))
      .addComponent(player, Velocity, new Velocity(0, 0))
      .addComponent(player, Sprite, new Sprite('player.png', 32, 32))
      .addComponent(player, Health, new Health(100))
      .addComponent(player, Player, new Player());
    return player;
  }

  private spawnEnemies(count: number): void {
    for (let i = 0; i < count; i++) {
      const enemy = this.world.createEntity();
      this.world
        .addComponent(enemy, Position, new Position(
          Math.random() * 800,
          Math.random() * 600
        ))
        .addComponent(enemy, Velocity, new Velocity(0, 0))
        .addComponent(enemy, Sprite, new Sprite('enemy.png', 24, 24))
        .addComponent(enemy, Health, new Health(50))
        .addComponent(enemy, AIController, new AIController())
        .addComponent(enemy, Enemy, new Enemy());
    }
  }

  private handleCollision(data: { entityA: Entity; entityB: Entity }): void {
    console.log(`Collision between ${data.entityA} and ${data.entityB}`);
  }

  private handleAttack(data: { attacker: Entity; target: Entity }): void {
    const targetHealth = this.world.getComponent(data.target, Health);
    if (targetHealth) {
      targetHealth.current -= 10;
      if (targetHealth.current <= 0) {
        this.world.destroyEntity(data.target);
      }
    }
  }

  start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  private loop(time: number): void {
    const deltaTime = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.world.update(deltaTime);

    requestAnimationFrame(this.loop.bind(this));
  }
}

// 使用
const canvas = document.getElementById('game') as HTMLCanvasElement;
const game = new Game(canvas);
game.start();
```

---

## 性能对比与优势

### 基准测试对比

以下是一个简单的性能对比示例：

```typescript
// 性能测试：OOP vs ECS

// OOP 实现
class OOPEntity {
  x: number = 0;
  y: number = 0;
  vx: number = Math.random() * 10 - 5;
  vy: number = Math.random() * 10 - 5;

  update(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}

// ECS 实现（使用 SoA - Structure of Arrays）
class ECSWorld {
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  count: number;

  constructor(count: number) {
    this.count = count;
    this.x = new Float32Array(count);
    this.y = new Float32Array(count);
    this.vx = new Float32Array(count);
    this.vy = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this.vx[i] = Math.random() * 10 - 5;
      this.vy[i] = Math.random() * 10 - 5;
    }
  }

  update(dt: number): void {
    const { x, y, vx, vy, count } = this;

    for (let i = 0; i < count; i++) {
      x[i] += vx[i] * dt;
      y[i] += vy[i] * dt;
    }
  }
}

// 性能测试
function benchmark(): void {
  const entityCount = 100000;
  const iterations = 1000;
  const dt = 0.016;

  // OOP 测试
  const oopEntities = Array.from(
    { length: entityCount },
    () => new OOPEntity()
  );

  console.time('OOP');
  for (let i = 0; i < iterations; i++) {
    for (const entity of oopEntities) {
      entity.update(dt);
    }
  }
  console.timeEnd('OOP');

  // ECS 测试
  const ecsWorld = new ECSWorld(entityCount);

  console.time('ECS');
  for (let i = 0; i < iterations; i++) {
    ecsWorld.update(dt);
  }
  console.timeEnd('ECS');
}

benchmark();

// 典型结果（实际结果因环境而异）：
// OOP: ~2000ms
// ECS: ~300ms
//
// ECS 快约 6-7 倍！
```

### 性能优势来源

1. **缓存效率**
   - ECS 的连续内存布局最大化了 CPU 缓存利用率
   - 减少缓存未命中，显著提升数据访问速度

2. **向量化**
   - 现代 CPU 支持 SIMD（单指令多数据）操作
   - ECS 的数组布局天然适合 SIMD 优化

3. **并行处理**
   - 系统之间通常相互独立
   - 可以轻松实现多线程并行更新

4. **更少的间接寻址**
   - OOP 中频繁使用指针/引用
   - ECS 使用索引直接访问数组

### SIMD 优化示例

```typescript
// 使用 WebAssembly SIMD 优化 ECS

// 假设使用 AssemblyScript 编译到 WASM

// 传统标量实现
function updateMovementScalar(
  x: Float32Array,
  y: Float32Array,
  vx: Float32Array,
  vy: Float32Array,
  dt: number,
  count: number
): void {
  for (let i = 0; i < count; i++) {
    x[i] += vx[i] * dt;
    y[i] += vy[i] * dt;
  }
}

// SIMD 实现概念（伪代码）
function updateMovementSIMD(
  x: Float32Array,
  y: Float32Array,
  vx: Float32Array,
  vy: Float32Array,
  dt: number,
  count: number
): void {
  // 一次处理 4 个浮点数
  const dtVec = f32x4.splat(dt);  // [dt, dt, dt, dt]

  for (let i = 0; i < count; i += 4) {
    // 加载 4 个 x 值
    const xVec = f32x4.load(x, i);
    // 加载 4 个 vx 值
    const vxVec = f32x4.load(vx, i);
    // 计算 x + vx * dt
    const newX = f32x4.add(xVec, f32x4.mul(vxVec, dtVec));
    // 存储结果
    f32x4.store(x, i, newX);

    // 同样处理 y
    const yVec = f32x4.load(y, i);
    const vyVec = f32x4.load(vy, i);
    const newY = f32x4.add(yVec, f32x4.mul(vyVec, dtVec));
    f32x4.store(y, i, newY);
  }
}

// SIMD 可以获得 2-4 倍的额外性能提升
```

---

## 高级模式与技巧

### 命令缓冲（Command Buffer）

在迭代过程中修改实体结构可能导致问题。命令缓冲延迟执行这些操作：

```typescript
// 命令缓冲实现

type Command =
  | { type: 'createEntity' }
  | { type: 'destroyEntity'; entity: Entity }
  | { type: 'addComponent'; entity: Entity; componentType: ComponentType; data: any }
  | { type: 'removeComponent'; entity: Entity; componentType: ComponentType };

class CommandBuffer {
  private commands: Command[] = [];
  private createdEntities: Entity[] = [];

  createEntity(): Entity {
    // 返回一个临时占位符
    const placeholder = -this.createdEntities.length - 1;
    this.commands.push({ type: 'createEntity' });
    return placeholder as Entity;
  }

  destroyEntity(entity: Entity): void {
    this.commands.push({ type: 'destroyEntity', entity });
  }

  addComponent<T>(entity: Entity, componentType: ComponentType, data: T): void {
    this.commands.push({ type: 'addComponent', entity, componentType, data });
  }

  removeComponent(entity: Entity, componentType: ComponentType): void {
    this.commands.push({ type: 'removeComponent', entity, componentType });
  }

  execute(world: World): void {
    let createdIndex = 0;

    for (const command of this.commands) {
      switch (command.type) {
        case 'createEntity':
          this.createdEntities[createdIndex++] = world.createEntity();
          break;

        case 'destroyEntity': {
          const entity = this.resolveEntity(command.entity);
          world.destroyEntity(entity);
          break;
        }

        case 'addComponent': {
          const entity = this.resolveEntity(command.entity);
          world.addComponent(entity, command.componentType, command.data);
          break;
        }

        case 'removeComponent': {
          const entity = this.resolveEntity(command.entity);
          world.removeComponent(entity, command.componentType);
          break;
        }
      }
    }

    // 清理
    this.commands = [];
    this.createdEntities = [];
  }

  private resolveEntity(entity: Entity): Entity {
    if (entity < 0) {
      // 这是一个占位符，解析为实际创建的实体
      return this.createdEntities[-entity - 1];
    }
    return entity;
  }
}

// 使用示例
class SpawnerSystem implements System {
  update(world: World, deltaTime: number): void {
    const buffer = new CommandBuffer();

    // 在查询过程中安全地创建新实体
    const spawners = world.query(Position, Spawner);

    for (const spawner of spawners) {
      const spawnData = world.getComponent(spawner, Spawner)!;

      if (spawnData.cooldown <= 0) {
        const pos = world.getComponent(spawner, Position)!;

        // 创建新实体（延迟执行）
        const newEntity = buffer.createEntity();
        buffer.addComponent(newEntity, Position, new Position(pos.x, pos.y));
        buffer.addComponent(newEntity, Velocity, new Velocity(
          Math.random() * 100 - 50,
          Math.random() * 100 - 50
        ));
        buffer.addComponent(newEntity, Enemy, new Enemy());

        spawnData.cooldown = spawnData.interval;
      }

      spawnData.cooldown -= deltaTime;
    }

    // 在迭代结束后执行所有命令
    buffer.execute(world);
  }
}
```

### 关系组件（Relationships）

处理实体之间的关系：

```typescript
// 关系组件模式

class Parent {
  constructor(public entity: Entity) {}
}

class Children {
  entities: Entity[] = [];

  add(entity: Entity): void {
    this.entities.push(entity);
  }

  remove(entity: Entity): void {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
    }
  }
}

class Following {
  constructor(
    public target: Entity,
    public offset: { x: number; y: number } = { x: 0, y: 0 }
  ) {}
}

// 层次结构系统
class HierarchySystem implements System {
  update(world: World, deltaTime: number): void {
    // 更新所有子实体的位置
    const entities = world.query(Position, Parent);

    for (const entity of entities) {
      const parent = world.getComponent(entity, Parent)!;

      if (!world.isAlive(parent.entity)) {
        // 父实体已销毁，销毁子实体
        world.destroyEntity(entity);
        continue;
      }

      const parentPos = world.getComponent(parent.entity, Position);
      const childPos = world.getComponent(entity, Position)!;

      if (parentPos) {
        // 简单跟随（可以扩展为更复杂的变换）
        childPos.x = parentPos.x;
        childPos.y = parentPos.y;
      }
    }
  }
}

// 创建层次结构
function createHierarchy(world: World): Entity {
  const parent = world.createEntity();
  world.addComponent(parent, Position, new Position(100, 100));
  world.addComponent(parent, Children, new Children());

  const children = world.getComponent(parent, Children)!;

  for (let i = 0; i < 3; i++) {
    const child = world.createEntity();
    world.addComponent(child, Position, new Position(0, 0));
    world.addComponent(child, Parent, new Parent(parent));
    children.add(child);
  }

  return parent;
}
```

### 状态机组件

```typescript
// ECS 中的状态机

interface State {
  name: string;
  onEnter?(world: World, entity: Entity): void;
  onUpdate?(world: World, entity: Entity, deltaTime: number): void;
  onExit?(world: World, entity: Entity): void;
}

class StateMachine {
  states: Map<string, State> = new Map();
  currentState: string | null = null;

  addState(state: State): void {
    this.states.set(state.name, state);
  }

  transition(world: World, entity: Entity, newState: string): void {
    if (this.currentState) {
      const current = this.states.get(this.currentState);
      current?.onExit?.(world, entity);
    }

    this.currentState = newState;
    const next = this.states.get(newState);
    next?.onEnter?.(world, entity);
  }
}

// 敌人状态定义
const IdleState: State = {
  name: 'idle',
  onEnter(world, entity) {
    const vel = world.getComponent(entity, Velocity);
    if (vel) {
      vel.x = 0;
      vel.y = 0;
    }
  },
  onUpdate(world, entity, deltaTime) {
    // 检测玩家
    const ai = world.getComponent(entity, AIController)!;
    const pos = world.getComponent(entity, Position)!;
    const players = world.query(Position, Player);

    for (const player of players) {
      const playerPos = world.getComponent(player, Position)!;
      const dx = playerPos.x - pos.x;
      const dy = playerPos.y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < ai.aggroRange) {
        const sm = world.getComponent(entity, StateMachine)!;
        ai.target = player;
        sm.transition(world, entity, 'chase');
        return;
      }
    }
  }
};

const ChaseState: State = {
  name: 'chase',
  onUpdate(world, entity, deltaTime) {
    const ai = world.getComponent(entity, AIController)!;
    const pos = world.getComponent(entity, Position)!;
    const vel = world.getComponent(entity, Velocity)!;

    if (!ai.target || !world.isAlive(ai.target)) {
      const sm = world.getComponent(entity, StateMachine)!;
      ai.target = null;
      sm.transition(world, entity, 'idle');
      return;
    }

    const targetPos = world.getComponent(ai.target, Position)!;
    const dx = targetPos.x - pos.x;
    const dy = targetPos.y - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 20) {
      const sm = world.getComponent(entity, StateMachine)!;
      sm.transition(world, entity, 'attack');
    } else {
      const speed = 50;
      vel.x = (dx / distance) * speed;
      vel.y = (dy / distance) * speed;
    }
  }
};

const AttackState: State = {
  name: 'attack',
  onEnter(world, entity) {
    const vel = world.getComponent(entity, Velocity);
    if (vel) {
      vel.x = 0;
      vel.y = 0;
    }
  },
  onUpdate(world, entity, deltaTime) {
    // 攻击逻辑
    const ai = world.getComponent(entity, AIController)!;

    if (ai.target && world.isAlive(ai.target)) {
      world.emit('attack', { attacker: entity, target: ai.target, damage: 10 });
    }

    // 检查是否需要追逐
    const pos = world.getComponent(entity, Position)!;
    if (ai.target) {
      const targetPos = world.getComponent(ai.target, Position);
      if (targetPos) {
        const dx = targetPos.x - pos.x;
        const dy = targetPos.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 30) {
          const sm = world.getComponent(entity, StateMachine)!;
          sm.transition(world, entity, 'chase');
        }
      }
    }
  }
};

// 状态机系统
class StateMachineSystem implements System {
  update(world: World, deltaTime: number): void {
    const entities = world.query(StateMachine);

    for (const entity of entities) {
      const sm = world.getComponent(entity, StateMachine)!;

      if (sm.currentState) {
        const state = sm.states.get(sm.currentState);
        state?.onUpdate?.(world, entity, deltaTime);
      }
    }
  }
}

// 创建使用状态机的敌人
function createStatefulEnemy(world: World): Entity {
  const enemy = world.createEntity();

  const sm = new StateMachine();
  sm.addState(IdleState);
  sm.addState(ChaseState);
  sm.addState(AttackState);
  sm.currentState = 'idle';

  world
    .addComponent(enemy, Position, new Position(200, 200))
    .addComponent(enemy, Velocity, new Velocity(0, 0))
    .addComponent(enemy, Health, new Health(100))
    .addComponent(enemy, AIController, new AIController())
    .addComponent(enemy, StateMachine, sm)
    .addComponent(enemy, Enemy, new Enemy());

  return enemy;
}
```

---

## 常见陷阱与最佳实践

### 常见陷阱

1. **组件过大**

```typescript
// 错误：组件包含太多数据
class BadPlayerComponent {
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  mana: number;
  stamina: number;
  experience: number;
  level: number;
  inventory: Item[];
  skills: Skill[];
  quests: Quest[];
  // ... 更多
}

// 正确：拆分为多个小组件
class Position { x: number; y: number; }
class Velocity { vx: number; vy: number; }
class Health { current: number; max: number; }
class Mana { current: number; max: number; }
class Experience { current: number; level: number; }
// ...
```

2. **在组件中存储逻辑**

```typescript
// 错误：组件包含行为
class BadComponent {
  value: number;

  update(): void {  // 不应该在组件中
    this.value++;
  }
}

// 正确：组件只是数据
class GoodComponent {
  value: number;
}

// 逻辑在系统中
class ValueUpdateSystem implements System {
  update(world: World, deltaTime: number): void {
    for (const entity of world.query(GoodComponent)) {
      const comp = world.getComponent(entity, GoodComponent)!;
      comp.value++;
    }
  }
}
```

3. **频繁添加/删除组件**

```typescript
// 错误：每帧添加/删除组件
class BadSystem implements System {
  update(world: World, deltaTime: number): void {
    for (const entity of world.query(Position)) {
      if (someCondition) {
        world.addComponent(entity, Highlighted, new Highlighted());
      } else {
        world.removeComponent(entity, Highlighted);
      }
    }
  }
}

// 正确：使用标志字段或状态组件
class Highlightable {
  isHighlighted: boolean = false;
}

class GoodSystem implements System {
  update(world: World, deltaTime: number): void {
    for (const entity of world.query(Position, Highlightable)) {
      const h = world.getComponent(entity, Highlightable)!;
      h.isHighlighted = someCondition;
    }
  }
}
```

4. **系统之间的紧耦合**

```typescript
// 错误：系统直接调用其他系统
class BadDamageSystem implements System {
  constructor(private healthSystem: HealthSystem) {}

  update(world: World, deltaTime: number): void {
    // 直接调用其他系统
    this.healthSystem.applyDamage(...);
  }
}

// 正确：通过事件或组件通信
class GoodDamageSystem implements System {
  update(world: World, deltaTime: number): void {
    // 通过事件通信
    world.emit('damage', { target, amount });
  }
}

class HealthSystem implements System {
  onAdd(world: World): void {
    world.on('damage', this.handleDamage.bind(this));
  }

  private handleDamage(data: { target: Entity; amount: number }): void {
    // 处理伤害
  }
}
```

### 最佳实践

1. **保持组件小而专注**
2. **使用标记组件进行过滤**
3. **利用查询缓存优化性能**
4. **合理规划系统执行顺序**
5. **使用命令缓冲处理结构变化**
6. **通过事件系统解耦系统**
7. **适时使用原型/archetype 优化**

---

## 面试要点

### 高频面试题

1. **什么是 ECS 架构？它与传统 OOP 有什么区别？**

   核心答案：
   - ECS 将数据（组件）与逻辑（系统）分离
   - 使用组合而非继承
   - 数据导向设计，缓存友好

2. **ECS 如何提升性能？**

   要点：
   - 连续内存布局
   - 减少缓存未命中
   - 便于 SIMD 优化
   - 易于并行处理

3. **请解释 Entity、Component、System 各自的职责**

   - Entity：唯一标识符
   - Component：纯数据容器
   - System：包含所有游戏逻辑

4. **如何在 ECS 中实现实体之间的关系？**

   - 使用关系组件（Parent、Children）
   - 存储实体引用/ID
   - 使用查询匹配相关实体

5. **ECS 的缺点是什么？**

   - 学习曲线较陡
   - 调试相对困难
   - 需要更多前期设计
   - 可能过度工程化简单项目

6. **什么场景适合/不适合使用 ECS？**

   适合：
   - 大量相似实体
   - 性能关键型应用
   - 需要灵活组合行为

   不适合：
   - 简单应用
   - 实体数量少
   - 团队不熟悉 ECS

---

## 延伸阅读

### 推荐资源

1. **书籍**
   - 《Game Programming Patterns》 - Robert Nystrom
   - 《Data-Oriented Design》 - Richard Fabian

2. **文章**
   - [Entity Systems Wiki](http://entity-systems.wikidot.com/)
   - [Bevy ECS 介绍](https://bevyengine.org/learn/book/getting-started/ecs/)
   - [Unity DOTS 文档](https://docs.unity3d.com/Packages/com.unity.entities@latest)

3. **视频**
   - GDC: "Overwatch Gameplay Architecture and Netcode"
   - "Data-Oriented Design and C++" by Mike Acton

4. **开源项目**
   - [Bevy](https://github.com/bevyengine/bevy) - Rust
   - [Flecs](https://github.com/SanderMertens/flecs) - C/C++
   - [bitECS](https://github.com/NateTheGreatt/bitECS) - JavaScript

### 进阶方向

- 网络同步与 ECS
- ECS 与物理引擎集成
- 多线程 ECS 调度
- ECS 序列化与存档
- 热重载与 ECS

---

## 总结

ECS 架构是游戏开发中一种强大的设计模式，通过数据导向的方式实现了：

1. **高性能**：缓存友好的内存布局
2. **高灵活性**：组件自由组合
3. **易于扩展**：添加新功能不影响现有代码
4. **便于并行**：系统天然可并行化

然而，ECS 并非银弹。在选择架构时，需要根据项目规模、团队经验和具体需求做出权衡。对于需要处理大量相似实体的高性能游戏，ECS 是一个出色的选择。

掌握 ECS 不仅能帮助你构建更高效的游戏系统，也能加深你对数据导向设计的理解，这种思维方式在现代高性能计算中越来越重要。
