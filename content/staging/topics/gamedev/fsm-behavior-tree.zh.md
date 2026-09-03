---
title: 有限状态机与行为树
description: 掌握游戏AI中最常用的状态管理模式：FSM和行为树的设计与实现
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - 状态机
  - 行为树
  - 游戏AI
  - 设计模式
status: imported
origin: old/src/content/docs/gamedev/fsm-behavior-tree.zh.md
divergence: 0.352
issues:
  - divergent
legacy:
  category: GameDev
  subcategory: Architecture
  order: 3
  lastUpdated: 2026-01-07
---

## 概述

在游戏开发中，AI（人工智能）系统是赋予游戏角色"生命"的关键技术。无论是敌人的巡逻与追击、NPC的日常行为，还是Boss的复杂战斗模式，都需要一套可靠的行为控制系统。

**有限状态机（Finite State Machine, FSM）** 和 **行为树（Behavior Tree, BT）** 是游戏AI领域最常用的两种架构模式。它们各有优缺点，适用于不同的场景：

| 特性 | 有限状态机 | 行为树 |
|------|-----------|--------|
| 学习曲线 | 简单直观 | 中等 |
| 可扩展性 | 状态增多时变复杂 | 优秀 |
| 可视化 | 状态图 | 树形结构 |
| 适用场景 | 简单到中等复杂度 | 中等到高复杂度 |
| 代码复用 | 较差 | 优秀 |
| 调试难度 | 简单 | 中等 |

---

## 第一部分：有限状态机（FSM）

### FSM 基本原理

有限状态机是一种数学计算模型，由以下元素组成：

- **状态（States）**：系统在任意时刻只能处于有限个状态中的一个
- **转换（Transitions）**：从一个状态到另一个状态的规则
- **事件（Events）**：触发状态转换的条件
- **动作（Actions）**：进入、退出状态或转换时执行的操作

```
                    ┌─────────────────────────────────────┐
                    │          有限状态机结构              │
                    └─────────────────────────────────────┘

        ┌──────────┐    看到敌人     ┌──────────┐    敌人逃跑
        │   巡逻   │ ──────────────► │   追击   │ ──────────────┐
        │  Patrol  │                 │  Chase   │               │
        └──────────┘                 └──────────┘               │
             ▲                            │                     │
             │                            │ 接近敌人             │
             │ 丢失目标                    ▼                     │
             │                      ┌──────────┐               │
             └───────────────────── │   攻击   │ ◄─────────────┘
                                   │  Attack  │
                                   └──────────┘
```

### 基础状态机实现

#### 状态接口定义

```typescript
// 状态接口
interface IState {
  name: string;

  // 生命周期方法
  onEnter(): void;    // 进入状态时调用
  onUpdate(deltaTime: number): void;  // 每帧更新
  onExit(): void;     // 退出状态时调用
}

// 状态机接口
interface IStateMachine {
  currentState: IState | null;
  changeState(newState: IState): void;
  update(deltaTime: number): void;
}
```

#### 简单状态机实现

```typescript
// 基础状态机类
class StateMachine implements IStateMachine {
  currentState: IState | null = null;
  private states: Map<string, IState> = new Map();

  // 注册状态
  addState(state: IState): void {
    this.states.set(state.name, state);
  }

  // 获取状态
  getState(name: string): IState | undefined {
    return this.states.get(name);
  }

  // 切换状态
  changeState(newState: IState): void {
    // 退出当前状态
    if (this.currentState) {
      console.log(`[FSM] 退出状态: ${this.currentState.name}`);
      this.currentState.onExit();
    }

    // 进入新状态
    this.currentState = newState;
    console.log(`[FSM] 进入状态: ${newState.name}`);
    this.currentState.onEnter();
  }

  // 通过名称切换状态
  changeStateTo(stateName: string): void {
    const state = this.states.get(stateName);
    if (state) {
      this.changeState(state);
    } else {
      console.error(`[FSM] 状态不存在: ${stateName}`);
    }
  }

  // 每帧更新
  update(deltaTime: number): void {
    if (this.currentState) {
      this.currentState.onUpdate(deltaTime);
    }
  }
}
```

#### 具体状态实现示例

```typescript
// 游戏实体接口
interface IEnemy {
  position: { x: number; y: number };
  target: { x: number; y: number } | null;
  health: number;
  attackRange: number;
  detectRange: number;
  speed: number;
  stateMachine: StateMachine;
}

// 巡逻状态
class PatrolState implements IState {
  name = 'patrol';
  private enemy: IEnemy;
  private patrolPoints: Array<{ x: number; y: number }>;
  private currentPointIndex: number = 0;

  constructor(enemy: IEnemy, patrolPoints: Array<{ x: number; y: number }>) {
    this.enemy = enemy;
    this.patrolPoints = patrolPoints;
  }

  onEnter(): void {
    console.log('开始巡逻...');
  }

  onUpdate(deltaTime: number): void {
    // 检测敌人
    if (this.detectPlayer()) {
      this.enemy.stateMachine.changeStateTo('chase');
      return;
    }

    // 移动到巡逻点
    const targetPoint = this.patrolPoints[this.currentPointIndex];
    this.moveTowards(targetPoint, deltaTime);

    // 到达巡逻点后切换到下一个
    if (this.reachedPoint(targetPoint)) {
      this.currentPointIndex = (this.currentPointIndex + 1) % this.patrolPoints.length;
    }
  }

  onExit(): void {
    console.log('停止巡逻');
  }

  private detectPlayer(): boolean {
    if (!this.enemy.target) return false;
    const distance = this.getDistance(this.enemy.position, this.enemy.target);
    return distance <= this.enemy.detectRange;
  }

  private moveTowards(point: { x: number; y: number }, deltaTime: number): void {
    const dx = point.x - this.enemy.position.x;
    const dy = point.y - this.enemy.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const moveDistance = this.enemy.speed * deltaTime;
      this.enemy.position.x += (dx / distance) * moveDistance;
      this.enemy.position.y += (dy / distance) * moveDistance;
    }
  }

  private reachedPoint(point: { x: number; y: number }): boolean {
    return this.getDistance(this.enemy.position, point) < 5;
  }

  private getDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}

// 追击状态
class ChaseState implements IState {
  name = 'chase';
  private enemy: IEnemy;

  constructor(enemy: IEnemy) {
    this.enemy = enemy;
  }

  onEnter(): void {
    console.log('发现目标，开始追击！');
  }

  onUpdate(deltaTime: number): void {
    if (!this.enemy.target) {
      this.enemy.stateMachine.changeStateTo('patrol');
      return;
    }

    const distance = this.getDistance(this.enemy.position, this.enemy.target);

    // 进入攻击范围
    if (distance <= this.enemy.attackRange) {
      this.enemy.stateMachine.changeStateTo('attack');
      return;
    }

    // 目标逃离检测范围
    if (distance > this.enemy.detectRange * 1.5) {
      this.enemy.stateMachine.changeStateTo('patrol');
      return;
    }

    // 追击目标
    this.moveTowardsTarget(deltaTime);
  }

  onExit(): void {
    console.log('停止追击');
  }

  private moveTowardsTarget(deltaTime: number): void {
    if (!this.enemy.target) return;

    const dx = this.enemy.target.x - this.enemy.position.x;
    const dy = this.enemy.target.y - this.enemy.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // 追击时速度提升
      const chaseSpeed = this.enemy.speed * 1.5;
      const moveDistance = chaseSpeed * deltaTime;
      this.enemy.position.x += (dx / distance) * moveDistance;
      this.enemy.position.y += (dy / distance) * moveDistance;
    }
  }

  private getDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}

// 攻击状态
class AttackState implements IState {
  name = 'attack';
  private enemy: IEnemy;
  private attackCooldown: number = 0;
  private readonly ATTACK_INTERVAL: number = 1.0; // 攻击间隔（秒）

  constructor(enemy: IEnemy) {
    this.enemy = enemy;
  }

  onEnter(): void {
    console.log('进入攻击状态！');
    this.attackCooldown = 0;
  }

  onUpdate(deltaTime: number): void {
    if (!this.enemy.target) {
      this.enemy.stateMachine.changeStateTo('patrol');
      return;
    }

    const distance = this.getDistance(this.enemy.position, this.enemy.target);

    // 目标离开攻击范围，转为追击
    if (distance > this.enemy.attackRange) {
      this.enemy.stateMachine.changeStateTo('chase');
      return;
    }

    // 执行攻击
    this.attackCooldown -= deltaTime;
    if (this.attackCooldown <= 0) {
      this.performAttack();
      this.attackCooldown = this.ATTACK_INTERVAL;
    }
  }

  onExit(): void {
    console.log('退出攻击状态');
  }

  private performAttack(): void {
    console.log('执行攻击！造成伤害！');
    // 实际游戏中这里会调用伤害计算系统
  }

  private getDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}
```

#### 使用示例

```typescript
// 创建敌人实例
const enemy: IEnemy = {
  position: { x: 0, y: 0 },
  target: null,
  health: 100,
  attackRange: 50,
  detectRange: 200,
  speed: 100,
  stateMachine: new StateMachine()
};

// 定义巡逻点
const patrolPoints = [
  { x: 100, y: 100 },
  { x: 200, y: 100 },
  { x: 200, y: 200 },
  { x: 100, y: 200 }
];

// 创建并注册状态
const patrolState = new PatrolState(enemy, patrolPoints);
const chaseState = new ChaseState(enemy);
const attackState = new AttackState(enemy);

enemy.stateMachine.addState(patrolState);
enemy.stateMachine.addState(chaseState);
enemy.stateMachine.addState(attackState);

// 设置初始状态
enemy.stateMachine.changeState(patrolState);

// 游戏主循环
function gameLoop(deltaTime: number): void {
  enemy.stateMachine.update(deltaTime);
}
```

### 层次状态机（HFSM）

当游戏AI变得复杂时，简单的FSM会出现"状态爆炸"问题。层次状态机（Hierarchical FSM）通过状态嵌套来解决这个问题。

```
                    ┌─────────────────────────────────────┐
                    │            层次状态机示例            │
                    └─────────────────────────────────────┘

                         ┌─────────────────────┐
                         │      战斗状态        │
                         │    (父状态)         │
                         └─────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
       ┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
       │    近战     │      │    远程     │      │    防御     │
       │  子状态     │      │  子状态     │      │  子状态     │
       └─────────────┘      └─────────────┘      └─────────────┘
```

#### 层次状态机实现

```typescript
// 层次状态接口
interface IHierarchicalState extends IState {
  parent: IHierarchicalState | null;
  subStates: Map<string, IHierarchicalState>;
  currentSubState: IHierarchicalState | null;

  addSubState(state: IHierarchicalState): void;
  changeSubState(stateName: string): void;
}

// 层次状态基类
abstract class HierarchicalState implements IHierarchicalState {
  abstract name: string;
  parent: IHierarchicalState | null = null;
  subStates: Map<string, IHierarchicalState> = new Map();
  currentSubState: IHierarchicalState | null = null;

  addSubState(state: IHierarchicalState): void {
    state.parent = this;
    this.subStates.set(state.name, state);
  }

  changeSubState(stateName: string): void {
    const newState = this.subStates.get(stateName);
    if (!newState) {
      console.error(`子状态不存在: ${stateName}`);
      return;
    }

    if (this.currentSubState) {
      this.currentSubState.onExit();
    }

    this.currentSubState = newState;
    this.currentSubState.onEnter();
  }

  onEnter(): void {
    // 进入父状态时的默认行为
  }

  onUpdate(deltaTime: number): void {
    // 更新当前子状态
    if (this.currentSubState) {
      this.currentSubState.onUpdate(deltaTime);
    }
  }

  onExit(): void {
    // 退出时也要退出子状态
    if (this.currentSubState) {
      this.currentSubState.onExit();
      this.currentSubState = null;
    }
  }
}

// 战斗父状态
class CombatState extends HierarchicalState {
  name = 'combat';
  private entity: IEnemy;

  constructor(entity: IEnemy) {
    super();
    this.entity = entity;

    // 添加子状态
    this.addSubState(new MeleeAttackSubState(entity, this));
    this.addSubState(new RangedAttackSubState(entity, this));
    this.addSubState(new DefendSubState(entity, this));
  }

  onEnter(): void {
    console.log('进入战斗模式');
    // 默认进入近战子状态
    this.changeSubState('melee');
  }

  onUpdate(deltaTime: number): void {
    // 检查是否应该退出战斗
    if (!this.entity.target || this.entity.health <= 0) {
      // 通知父状态机切换状态
      return;
    }

    // 更新子状态
    super.onUpdate(deltaTime);
  }
}

// 近战攻击子状态
class MeleeAttackSubState extends HierarchicalState {
  name = 'melee';
  private entity: IEnemy;
  private parentState: CombatState;

  constructor(entity: IEnemy, parent: CombatState) {
    super();
    this.entity = entity;
    this.parentState = parent;
  }

  onEnter(): void {
    console.log('切换到近战攻击');
  }

  onUpdate(deltaTime: number): void {
    const distance = this.getDistanceToTarget();

    // 距离太远，切换到远程
    if (distance > 100) {
      this.parentState.changeSubState('ranged');
      return;
    }

    // 血量低，切换到防御
    if (this.entity.health < 30) {
      this.parentState.changeSubState('defend');
      return;
    }

    // 执行近战攻击逻辑
    this.performMeleeAttack();
  }

  onExit(): void {
    console.log('退出近战攻击');
  }

  private getDistanceToTarget(): number {
    if (!this.entity.target) return Infinity;
    const dx = this.entity.target.x - this.entity.position.x;
    const dy = this.entity.target.y - this.entity.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private performMeleeAttack(): void {
    console.log('近战攻击！');
  }
}

// 远程攻击子状态
class RangedAttackSubState extends HierarchicalState {
  name = 'ranged';
  private entity: IEnemy;
  private parentState: CombatState;

  constructor(entity: IEnemy, parent: CombatState) {
    super();
    this.entity = entity;
    this.parentState = parent;
  }

  onEnter(): void {
    console.log('切换到远程攻击');
  }

  onUpdate(deltaTime: number): void {
    const distance = this.getDistanceToTarget();

    // 距离近了，切换到近战
    if (distance < 50) {
      this.parentState.changeSubState('melee');
      return;
    }

    // 执行远程攻击
    this.performRangedAttack();
  }

  onExit(): void {
    console.log('退出远程攻击');
  }

  private getDistanceToTarget(): number {
    if (!this.entity.target) return Infinity;
    const dx = this.entity.target.x - this.entity.position.x;
    const dy = this.entity.target.y - this.entity.position.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private performRangedAttack(): void {
    console.log('远程攻击！');
  }
}

// 防御子状态
class DefendSubState extends HierarchicalState {
  name = 'defend';
  private entity: IEnemy;
  private parentState: CombatState;
  private defendTimer: number = 0;

  constructor(entity: IEnemy, parent: CombatState) {
    super();
    this.entity = entity;
    this.parentState = parent;
  }

  onEnter(): void {
    console.log('进入防御姿态');
    this.defendTimer = 3.0; // 防御3秒
  }

  onUpdate(deltaTime: number): void {
    this.defendTimer -= deltaTime;

    // 防御时间结束或血量恢复
    if (this.defendTimer <= 0 || this.entity.health > 50) {
      this.parentState.changeSubState('melee');
      return;
    }

    // 防御中...
    console.log('防御中...');
  }

  onExit(): void {
    console.log('解除防御');
  }
}
```

### FSM 的优缺点

#### 优点

1. **简单直观**：状态和转换关系清晰，易于理解
2. **调试方便**：当前状态一目了然，便于追踪问题
3. **实现简单**：代码量少，快速上手
4. **确定性强**：给定输入，输出可预测

#### 缺点

1. **状态爆炸**：复杂系统中状态数量呈指数增长
2. **难以复用**：状态间耦合度高，复用困难
3. **扩展困难**：添加新状态需要修改大量转换逻辑
4. **并行处理差**：难以表达同时执行多个行为

---

## 第二部分：行为树（Behavior Tree）

### 行为树基本原理

行为树是一种树形结构的行为控制模型，最早由游戏《Halo 2》团队提出并广泛应用于游戏AI领域。

行为树的核心思想是将AI行为分解为独立的、可复用的节点，通过组合这些节点形成复杂的行为逻辑。

```
                    ┌─────────────────────────────────────┐
                    │           行为树基本结构             │
                    └─────────────────────────────────────┘

                              ┌─────────┐
                              │  Root   │ ◄── 根节点
                              │ (根)    │
                              └────┬────┘
                                   │
                              ┌────▼────┐
                              │Selector │ ◄── 选择节点
                              │  (?)    │
                              └────┬────┘
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
              │ Sequence  │  │ Sequence  │  │  Action   │
              │   (→)     │  │   (→)     │  │  巡逻     │
              └─────┬─────┘  └─────┬─────┘  └───────────┘
                    │              │
              ┌─────┴─────┐  ┌─────┴─────┐
              │           │  │           │
          ┌───▼───┐ ┌─────▼──┐ ┌───▼───┐ ┌───▼───┐
          │ 条件  │ │ 动作   │ │ 条件  │ │ 动作  │
          │ 有敌人│ │ 攻击   │ │ 血量低│ │ 逃跑  │
          └───────┘ └────────┘ └───────┘ └───────┘
```

### 节点类型详解

行为树由四种基本节点类型组成：

#### 节点状态枚举

```typescript
// 节点执行状态
enum NodeStatus {
  SUCCESS = 'success',   // 成功
  FAILURE = 'failure',   // 失败
  RUNNING = 'running'    // 运行中
}

// 节点基类
abstract class BehaviorNode {
  protected children: BehaviorNode[] = [];
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  abstract tick(context: BehaviorContext): NodeStatus;

  addChild(child: BehaviorNode): this {
    this.children.push(child);
    return this;
  }
}

// 行为树上下文（黑板数据）
interface BehaviorContext {
  entity: any;
  blackboard: Map<string, any>;
  deltaTime: number;
}
```

#### 动作节点（Action/Leaf Node）

动作节点是行为树的叶子节点，执行具体的行为逻辑。

```typescript
// 动作节点基类
abstract class ActionNode extends BehaviorNode {
  abstract tick(context: BehaviorContext): NodeStatus;
}

// 移动到目标动作
class MoveToTargetAction extends ActionNode {
  constructor() {
    super('MoveToTarget');
  }

  tick(context: BehaviorContext): NodeStatus {
    const target = context.blackboard.get('target');
    const entity = context.entity;

    if (!target) {
      return NodeStatus.FAILURE;
    }

    const dx = target.x - entity.position.x;
    const dy = target.y - entity.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 已到达目标
    if (distance < 5) {
      return NodeStatus.SUCCESS;
    }

    // 移动中
    const moveSpeed = entity.speed * context.deltaTime;
    entity.position.x += (dx / distance) * moveSpeed;
    entity.position.y += (dy / distance) * moveSpeed;

    return NodeStatus.RUNNING;
  }
}

// 攻击动作
class AttackAction extends ActionNode {
  private attackCooldown: number = 0;

  constructor() {
    super('Attack');
  }

  tick(context: BehaviorContext): NodeStatus {
    const target = context.blackboard.get('target');

    if (!target) {
      return NodeStatus.FAILURE;
    }

    this.attackCooldown -= context.deltaTime;

    if (this.attackCooldown <= 0) {
      console.log('执行攻击！');
      this.attackCooldown = 1.0;
      return NodeStatus.SUCCESS;
    }

    return NodeStatus.RUNNING;
  }
}

// 等待动作
class WaitAction extends ActionNode {
  private duration: number;
  private elapsedTime: number = 0;

  constructor(duration: number) {
    super(`Wait(${duration}s)`);
    this.duration = duration;
  }

  tick(context: BehaviorContext): NodeStatus {
    this.elapsedTime += context.deltaTime;

    if (this.elapsedTime >= this.duration) {
      this.elapsedTime = 0;
      return NodeStatus.SUCCESS;
    }

    return NodeStatus.RUNNING;
  }
}

// 播放动画动作
class PlayAnimationAction extends ActionNode {
  private animationName: string;

  constructor(animationName: string) {
    super(`PlayAnimation(${animationName})`);
    this.animationName = animationName;
  }

  tick(context: BehaviorContext): NodeStatus {
    console.log(`播放动画: ${this.animationName}`);
    // 实际实现中会检查动画是否播放完毕
    return NodeStatus.SUCCESS;
  }
}
```

#### 条件节点（Condition Node）

条件节点用于检测某个条件是否满足。

```typescript
// 条件节点基类
abstract class ConditionNode extends BehaviorNode {
  abstract tick(context: BehaviorContext): NodeStatus;
}

// 检测是否有敌人在范围内
class HasEnemyInRangeCondition extends ConditionNode {
  private range: number;

  constructor(range: number) {
    super(`HasEnemyInRange(${range})`);
    this.range = range;
  }

  tick(context: BehaviorContext): NodeStatus {
    const entity = context.entity;
    const enemies = context.blackboard.get('enemies') as Array<{ position: { x: number; y: number } }>;

    if (!enemies) {
      return NodeStatus.FAILURE;
    }

    for (const enemy of enemies) {
      const distance = this.getDistance(entity.position, enemy.position);
      if (distance <= this.range) {
        context.blackboard.set('target', enemy);
        return NodeStatus.SUCCESS;
      }
    }

    return NodeStatus.FAILURE;
  }

  private getDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}

// 检测血量条件
class HealthCheckCondition extends ConditionNode {
  private threshold: number;
  private checkType: 'above' | 'below';

  constructor(threshold: number, checkType: 'above' | 'below') {
    super(`HealthCheck(${checkType} ${threshold})`);
    this.threshold = threshold;
    this.checkType = checkType;
  }

  tick(context: BehaviorContext): NodeStatus {
    const health = context.entity.health;

    if (this.checkType === 'above') {
      return health > this.threshold ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
    } else {
      return health < this.threshold ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
    }
  }
}

// 检测是否在攻击范围内
class IsInAttackRangeCondition extends ConditionNode {
  constructor() {
    super('IsInAttackRange');
  }

  tick(context: BehaviorContext): NodeStatus {
    const entity = context.entity;
    const target = context.blackboard.get('target');

    if (!target) {
      return NodeStatus.FAILURE;
    }

    const distance = this.getDistance(entity.position, target.position);
    return distance <= entity.attackRange ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }

  private getDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}
```

#### 组合节点（Composite Node）

组合节点用于控制子节点的执行顺序和逻辑。

##### Selector（选择节点）

选择节点会依次执行子节点，直到某个子节点返回 SUCCESS 或 RUNNING。类似于逻辑 OR。

```typescript
// 选择节点：依次尝试子节点，直到成功
class SelectorNode extends BehaviorNode {
  private currentChildIndex: number = 0;

  constructor(name: string = 'Selector') {
    super(name);
  }

  tick(context: BehaviorContext): NodeStatus {
    while (this.currentChildIndex < this.children.length) {
      const child = this.children[this.currentChildIndex];
      const status = child.tick(context);

      switch (status) {
        case NodeStatus.SUCCESS:
          this.currentChildIndex = 0; // 重置
          return NodeStatus.SUCCESS;

        case NodeStatus.RUNNING:
          return NodeStatus.RUNNING;

        case NodeStatus.FAILURE:
          this.currentChildIndex++;
          break;
      }
    }

    // 所有子节点都失败
    this.currentChildIndex = 0;
    return NodeStatus.FAILURE;
  }
}
```

##### Sequence（序列节点）

序列节点会依次执行子节点，所有子节点都成功才返回 SUCCESS。类似于逻辑 AND。

```typescript
// 序列节点：依次执行子节点，全部成功才成功
class SequenceNode extends BehaviorNode {
  private currentChildIndex: number = 0;

  constructor(name: string = 'Sequence') {
    super(name);
  }

  tick(context: BehaviorContext): NodeStatus {
    while (this.currentChildIndex < this.children.length) {
      const child = this.children[this.currentChildIndex];
      const status = child.tick(context);

      switch (status) {
        case NodeStatus.SUCCESS:
          this.currentChildIndex++;
          break;

        case NodeStatus.RUNNING:
          return NodeStatus.RUNNING;

        case NodeStatus.FAILURE:
          this.currentChildIndex = 0; // 重置
          return NodeStatus.FAILURE;
      }
    }

    // 所有子节点都成功
    this.currentChildIndex = 0;
    return NodeStatus.SUCCESS;
  }
}
```

##### Parallel（并行节点）

并行节点同时执行所有子节点。

```typescript
// 并行策略
enum ParallelPolicy {
  REQUIRE_ONE,  // 一个成功即成功
  REQUIRE_ALL   // 全部成功才成功
}

// 并行节点：同时执行所有子节点
class ParallelNode extends BehaviorNode {
  private successPolicy: ParallelPolicy;
  private failurePolicy: ParallelPolicy;

  constructor(
    name: string = 'Parallel',
    successPolicy: ParallelPolicy = ParallelPolicy.REQUIRE_ALL,
    failurePolicy: ParallelPolicy = ParallelPolicy.REQUIRE_ONE
  ) {
    super(name);
    this.successPolicy = successPolicy;
    this.failurePolicy = failurePolicy;
  }

  tick(context: BehaviorContext): NodeStatus {
    let successCount = 0;
    let failureCount = 0;
    let runningCount = 0;

    for (const child of this.children) {
      const status = child.tick(context);

      switch (status) {
        case NodeStatus.SUCCESS:
          successCount++;
          break;
        case NodeStatus.FAILURE:
          failureCount++;
          break;
        case NodeStatus.RUNNING:
          runningCount++;
          break;
      }
    }

    // 检查失败策略
    if (this.failurePolicy === ParallelPolicy.REQUIRE_ONE && failureCount > 0) {
      return NodeStatus.FAILURE;
    }
    if (this.failurePolicy === ParallelPolicy.REQUIRE_ALL &&
        failureCount === this.children.length) {
      return NodeStatus.FAILURE;
    }

    // 检查成功策略
    if (this.successPolicy === ParallelPolicy.REQUIRE_ONE && successCount > 0) {
      return NodeStatus.SUCCESS;
    }
    if (this.successPolicy === ParallelPolicy.REQUIRE_ALL &&
        successCount === this.children.length) {
      return NodeStatus.SUCCESS;
    }

    return NodeStatus.RUNNING;
  }
}
```

##### Random Selector（随机选择节点）

随机选择一个子节点执行，增加AI行为的不可预测性。

```typescript
// 随机选择节点
class RandomSelectorNode extends BehaviorNode {
  private selectedIndex: number = -1;

  constructor(name: string = 'RandomSelector') {
    super(name);
  }

  tick(context: BehaviorContext): NodeStatus {
    if (this.children.length === 0) {
      return NodeStatus.FAILURE;
    }

    // 首次执行时随机选择
    if (this.selectedIndex === -1) {
      this.selectedIndex = Math.floor(Math.random() * this.children.length);
    }

    const child = this.children[this.selectedIndex];
    const status = child.tick(context);

    if (status !== NodeStatus.RUNNING) {
      this.selectedIndex = -1; // 重置，下次重新选择
    }

    return status;
  }
}
```

#### 装饰节点（Decorator Node）

装饰节点修改子节点的行为或返回值。

```typescript
// 装饰节点基类
abstract class DecoratorNode extends BehaviorNode {
  protected child: BehaviorNode | null = null;

  setChild(child: BehaviorNode): this {
    this.child = child;
    return this;
  }
}

// 取反装饰器
class InverterDecorator extends DecoratorNode {
  constructor() {
    super('Inverter');
  }

  tick(context: BehaviorContext): NodeStatus {
    if (!this.child) {
      return NodeStatus.FAILURE;
    }

    const status = this.child.tick(context);

    switch (status) {
      case NodeStatus.SUCCESS:
        return NodeStatus.FAILURE;
      case NodeStatus.FAILURE:
        return NodeStatus.SUCCESS;
      default:
        return status;
    }
  }
}

// 重复装饰器
class RepeatDecorator extends DecoratorNode {
  private repeatCount: number;
  private currentCount: number = 0;

  constructor(repeatCount: number = -1) { // -1 表示无限重复
    super(`Repeat(${repeatCount})`);
    this.repeatCount = repeatCount;
  }

  tick(context: BehaviorContext): NodeStatus {
    if (!this.child) {
      return NodeStatus.FAILURE;
    }

    const status = this.child.tick(context);

    if (status === NodeStatus.RUNNING) {
      return NodeStatus.RUNNING;
    }

    // 无限重复
    if (this.repeatCount === -1) {
      return NodeStatus.RUNNING;
    }

    this.currentCount++;

    if (this.currentCount >= this.repeatCount) {
      this.currentCount = 0;
      return NodeStatus.SUCCESS;
    }

    return NodeStatus.RUNNING;
  }
}

// 重复直到失败装饰器
class RepeatUntilFailDecorator extends DecoratorNode {
  constructor() {
    super('RepeatUntilFail');
  }

  tick(context: BehaviorContext): NodeStatus {
    if (!this.child) {
      return NodeStatus.FAILURE;
    }

    const status = this.child.tick(context);

    if (status === NodeStatus.FAILURE) {
      return NodeStatus.SUCCESS; // 子节点失败时返回成功
    }

    return NodeStatus.RUNNING;
  }
}

// 成功装饰器（总是返回成功）
class SucceederDecorator extends DecoratorNode {
  constructor() {
    super('Succeeder');
  }

  tick(context: BehaviorContext): NodeStatus {
    if (!this.child) {
      return NodeStatus.SUCCESS;
    }

    const status = this.child.tick(context);

    if (status === NodeStatus.RUNNING) {
      return NodeStatus.RUNNING;
    }

    return NodeStatus.SUCCESS;
  }
}

// 冷却装饰器
class CooldownDecorator extends DecoratorNode {
  private cooldownTime: number;
  private lastExecuteTime: number = 0;

  constructor(cooldownTime: number) {
    super(`Cooldown(${cooldownTime}s)`);
    this.cooldownTime = cooldownTime;
  }

  tick(context: BehaviorContext): NodeStatus {
    const currentTime = Date.now() / 1000;

    if (currentTime - this.lastExecuteTime < this.cooldownTime) {
      return NodeStatus.FAILURE;
    }

    if (!this.child) {
      return NodeStatus.FAILURE;
    }

    const status = this.child.tick(context);

    if (status !== NodeStatus.RUNNING) {
      this.lastExecuteTime = currentTime;
    }

    return status;
  }
}

// 条件守卫装饰器
class GuardDecorator extends DecoratorNode {
  private condition: ConditionNode;

  constructor(condition: ConditionNode) {
    super('Guard');
    this.condition = condition;
  }

  tick(context: BehaviorContext): NodeStatus {
    // 先检查条件
    const conditionStatus = this.condition.tick(context);

    if (conditionStatus !== NodeStatus.SUCCESS) {
      return NodeStatus.FAILURE;
    }

    if (!this.child) {
      return NodeStatus.SUCCESS;
    }

    return this.child.tick(context);
  }
}
```

### 黑板系统（Blackboard System）

黑板是行为树中节点之间共享数据的机制，类似于一个全局可访问的键值存储。

```typescript
// 黑板系统
class Blackboard {
  private data: Map<string, any> = new Map();
  private listeners: Map<string, Set<(value: any) => void>> = new Map();

  // 设置数据
  set<T>(key: string, value: T): void {
    const oldValue = this.data.get(key);
    this.data.set(key, value);

    // 通知监听器
    if (oldValue !== value) {
      this.notifyListeners(key, value);
    }
  }

  // 获取数据
  get<T>(key: string): T | undefined {
    return this.data.get(key) as T | undefined;
  }

  // 获取数据，如果不存在则返回默认值
  getOrDefault<T>(key: string, defaultValue: T): T {
    const value = this.data.get(key);
    return value !== undefined ? value as T : defaultValue;
  }

  // 检查是否存在
  has(key: string): boolean {
    return this.data.has(key);
  }

  // 删除数据
  delete(key: string): boolean {
    const result = this.data.delete(key);
    if (result) {
      this.notifyListeners(key, undefined);
    }
    return result;
  }

  // 清空所有数据
  clear(): void {
    this.data.clear();
  }

  // 添加监听器
  addListener(key: string, callback: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // 返回取消监听的函数
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  private notifyListeners(key: string, value: any): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(callback => callback(value));
    }
  }

  // 调试用：获取所有数据
  debug(): Record<string, any> {
    const result: Record<string, any> = {};
    this.data.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}

// 带类型安全的黑板键定义
class BlackboardKeys {
  static readonly TARGET = 'target';
  static readonly ENEMIES = 'enemies';
  static readonly LAST_KNOWN_POSITION = 'lastKnownPosition';
  static readonly ALERT_LEVEL = 'alertLevel';
  static readonly PATROL_POINTS = 'patrolPoints';
  static readonly CURRENT_HEALTH = 'currentHealth';
  static readonly IS_IN_COMBAT = 'isInCombat';
}

// 使用示例
const blackboard = new Blackboard();

// 设置目标
blackboard.set(BlackboardKeys.TARGET, { position: { x: 100, y: 100 } });

// 添加监听器
const unsubscribe = blackboard.addListener(BlackboardKeys.ALERT_LEVEL, (level) => {
  console.log(`警戒等级变化: ${level}`);
});

// 设置警戒等级
blackboard.set(BlackboardKeys.ALERT_LEVEL, 2);
```

### 完整行为树实现

```typescript
// 行为树类
class BehaviorTree {
  private root: BehaviorNode | null = null;
  private blackboard: Blackboard;
  private entity: any;

  constructor(entity: any) {
    this.entity = entity;
    this.blackboard = new Blackboard();
  }

  setRoot(node: BehaviorNode): void {
    this.root = node;
  }

  getBlackboard(): Blackboard {
    return this.blackboard;
  }

  tick(deltaTime: number): NodeStatus {
    if (!this.root) {
      return NodeStatus.FAILURE;
    }

    const context: BehaviorContext = {
      entity: this.entity,
      blackboard: this.blackboard,
      deltaTime
    };

    return this.root.tick(context);
  }
}

// 行为树构建器（Builder模式）
class BehaviorTreeBuilder {
  private nodeStack: BehaviorNode[] = [];
  private root: BehaviorNode | null = null;

  selector(name?: string): this {
    const node = new SelectorNode(name);
    this.pushNode(node);
    return this;
  }

  sequence(name?: string): this {
    const node = new SequenceNode(name);
    this.pushNode(node);
    return this;
  }

  parallel(
    name?: string,
    successPolicy?: ParallelPolicy,
    failurePolicy?: ParallelPolicy
  ): this {
    const node = new ParallelNode(name, successPolicy, failurePolicy);
    this.pushNode(node);
    return this;
  }

  action(action: ActionNode): this {
    this.addChild(action);
    return this;
  }

  condition(condition: ConditionNode): this {
    this.addChild(condition);
    return this;
  }

  decorator(decorator: DecoratorNode): this {
    this.pushNode(decorator);
    return this;
  }

  end(): this {
    this.nodeStack.pop();
    return this;
  }

  build(): BehaviorNode {
    if (!this.root) {
      throw new Error('行为树为空');
    }
    return this.root;
  }

  private pushNode(node: BehaviorNode): void {
    if (this.nodeStack.length > 0) {
      const parent = this.nodeStack[this.nodeStack.length - 1];
      if (parent instanceof DecoratorNode) {
        parent.setChild(node);
      } else {
        parent.addChild(node);
      }
    } else {
      this.root = node;
    }
    this.nodeStack.push(node);
  }

  private addChild(node: BehaviorNode): void {
    if (this.nodeStack.length > 0) {
      const parent = this.nodeStack[this.nodeStack.length - 1];
      if (parent instanceof DecoratorNode) {
        parent.setChild(node);
        this.nodeStack.pop();
      } else {
        parent.addChild(node);
      }
    } else {
      this.root = node;
    }
  }
}
```

### 实际应用示例

#### 构建敌人AI行为树

```typescript
// 创建一个完整的敌人AI行为树
function createEnemyBehaviorTree(enemy: any): BehaviorTree {
  const bt = new BehaviorTree(enemy);

  // 使用Builder构建行为树
  const root = new BehaviorTreeBuilder()
    .selector('Root')
      // 分支1：战斗行为
      .sequence('Combat')
        .condition(new HasEnemyInRangeCondition(200))
        .selector('CombatActions')
          // 低血量时逃跑
          .sequence('FleeWhenLowHealth')
            .condition(new HealthCheckCondition(30, 'below'))
            .action(new PlayAnimationAction('flee'))
            .action(new FleeAction())
          .end()
          // 在攻击范围内则攻击
          .sequence('AttackSequence')
            .condition(new IsInAttackRangeCondition())
            .action(new AttackAction())
          .end()
          // 否则追击
          .action(new MoveToTargetAction())
        .end()
      .end()
      // 分支2：巡逻行为
      .sequence('Patrol')
        .action(new PatrolAction())
        .action(new WaitAction(2))
      .end()
    .end()
    .build();

  bt.setRoot(root);

  return bt;
}

// 逃跑动作
class FleeAction extends ActionNode {
  constructor() {
    super('Flee');
  }

  tick(context: BehaviorContext): NodeStatus {
    const entity = context.entity;
    const target = context.blackboard.get('target');

    if (!target) {
      return NodeStatus.FAILURE;
    }

    // 计算逃跑方向（与目标相反）
    const dx = entity.position.x - target.position.x;
    const dy = entity.position.y - target.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 逃到安全距离
    if (distance > 300) {
      return NodeStatus.SUCCESS;
    }

    // 快速逃跑
    const fleeSpeed = entity.speed * 2 * context.deltaTime;
    entity.position.x += (dx / distance) * fleeSpeed;
    entity.position.y += (dy / distance) * fleeSpeed;

    return NodeStatus.RUNNING;
  }
}

// 巡逻动作
class PatrolAction extends ActionNode {
  private patrolPoints: Array<{ x: number; y: number }> = [];
  private currentIndex: number = 0;

  constructor() {
    super('Patrol');
  }

  tick(context: BehaviorContext): NodeStatus {
    // 获取巡逻点
    if (this.patrolPoints.length === 0) {
      this.patrolPoints = context.blackboard.get(BlackboardKeys.PATROL_POINTS) || [];
      if (this.patrolPoints.length === 0) {
        return NodeStatus.FAILURE;
      }
    }

    const entity = context.entity;
    const targetPoint = this.patrolPoints[this.currentIndex];

    const dx = targetPoint.x - entity.position.x;
    const dy = targetPoint.y - entity.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 到达巡逻点
    if (distance < 5) {
      this.currentIndex = (this.currentIndex + 1) % this.patrolPoints.length;
      return NodeStatus.SUCCESS;
    }

    // 移动到巡逻点
    const moveSpeed = entity.speed * context.deltaTime;
    entity.position.x += (dx / distance) * moveSpeed;
    entity.position.y += (dy / distance) * moveSpeed;

    return NodeStatus.RUNNING;
  }
}
```

#### 复杂Boss AI示例

```typescript
// 创建Boss行为树
function createBossBehaviorTree(boss: any): BehaviorTree {
  const bt = new BehaviorTree(boss);

  const root = new BehaviorTreeBuilder()
    .selector('BossAI')
      // 阶段1：低血量狂暴模式
      .sequence('EnragePhase')
        .condition(new HealthCheckCondition(30, 'below'))
        .decorator(new RepeatDecorator(-1))
          .selector('EnrageActions')
            .sequence('AreaAttack')
              .decorator(new CooldownDecorator(5))
                .action(new AreaAttackAction())
              .end()
            .end()
            .action(new EnragedMeleeAction())
          .end()
        .end()
      .end()

      // 阶段2：中血量混合攻击
      .sequence('MixedPhase')
        .condition(new HealthCheckCondition(60, 'below'))
        .selector('MixedActions')
          .sequence('SummonMinions')
            .condition(new CanSummonCondition())
            .decorator(new CooldownDecorator(15))
              .action(new SummonMinionsAction())
            .end()
          .end()
          .sequence('RangedAttack')
            .condition(new IsTargetFarCondition(100))
            .action(new RangedAttackAction())
          .end()
          .action(new MeleeComboAction())
        .end()
      .end()

      // 阶段3：高血量常规攻击
      .selector('NormalPhase')
        .sequence('RangedWhenFar')
          .condition(new IsTargetFarCondition(150))
          .action(new RangedAttackAction())
        .end()
        .sequence('MeleeWhenClose')
          .action(new MoveToTargetAction())
          .action(new MeleeComboAction())
        .end()
      .end()
    .end()
    .build();

  bt.setRoot(root);

  return bt;
}

// Boss专用动作节点
class AreaAttackAction extends ActionNode {
  private chargeTime: number = 0;
  private readonly CHARGE_DURATION: number = 2.0;

  constructor() {
    super('AreaAttack');
  }

  tick(context: BehaviorContext): NodeStatus {
    this.chargeTime += context.deltaTime;

    if (this.chargeTime < this.CHARGE_DURATION) {
      console.log('蓄力中...');
      return NodeStatus.RUNNING;
    }

    console.log('释放范围攻击！');
    this.chargeTime = 0;
    return NodeStatus.SUCCESS;
  }
}

class SummonMinionsAction extends ActionNode {
  constructor() {
    super('SummonMinions');
  }

  tick(context: BehaviorContext): NodeStatus {
    console.log('召唤小怪！');
    // 实际实现中会生成敌人实例
    context.blackboard.set('lastSummonTime', Date.now());
    return NodeStatus.SUCCESS;
  }
}

class MeleeComboAction extends ActionNode {
  private comboIndex: number = 0;
  private comboTimer: number = 0;
  private readonly COMBO_ATTACKS = ['轻击', '重击', '上挑'];

  constructor() {
    super('MeleeCombo');
  }

  tick(context: BehaviorContext): NodeStatus {
    this.comboTimer += context.deltaTime;

    if (this.comboTimer >= 0.5) {
      console.log(`连招 ${this.comboIndex + 1}: ${this.COMBO_ATTACKS[this.comboIndex]}`);
      this.comboTimer = 0;
      this.comboIndex++;

      if (this.comboIndex >= this.COMBO_ATTACKS.length) {
        this.comboIndex = 0;
        return NodeStatus.SUCCESS;
      }
    }

    return NodeStatus.RUNNING;
  }
}

// 条件节点
class CanSummonCondition extends ConditionNode {
  constructor() {
    super('CanSummon');
  }

  tick(context: BehaviorContext): NodeStatus {
    const lastSummonTime = context.blackboard.get<number>('lastSummonTime') || 0;
    const currentMinions = context.blackboard.get<number>('currentMinions') || 0;

    // 检查冷却和数量限制
    if (Date.now() - lastSummonTime > 15000 && currentMinions < 3) {
      return NodeStatus.SUCCESS;
    }

    return NodeStatus.FAILURE;
  }
}

class IsTargetFarCondition extends ConditionNode {
  private distance: number;

  constructor(distance: number) {
    super(`IsTargetFar(${distance})`);
    this.distance = distance;
  }

  tick(context: BehaviorContext): NodeStatus {
    const entity = context.entity;
    const target = context.blackboard.get('target');

    if (!target) {
      return NodeStatus.FAILURE;
    }

    const dx = target.position.x - entity.position.x;
    const dy = target.position.y - entity.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return dist > this.distance ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}
```

---

## 第三部分：FSM vs 行为树对比与选择

### 详细对比

| 维度 | FSM | 行为树 |
|------|-----|--------|
| **结构** | 图结构（状态+转换） | 树结构（节点层次） |
| **状态管理** | 显式状态定义 | 隐式（由节点执行结果决定） |
| **转换逻辑** | 在状态中定义 | 由组合节点控制 |
| **代码复用** | 较难 | 容易（节点可复用） |
| **可视化** | 状态图 | 树形图 |
| **调试** | 简单（看当前状态） | 需要追踪执行路径 |
| **扩展性** | 差（状态爆炸） | 好（添加子树） |
| **并发行为** | 困难 | 支持（Parallel节点） |
| **学习成本** | 低 | 中等 |

### 选择指南

#### 选择 FSM 的场景

1. **简单AI行为**：如门的开关、电梯的上下
2. **状态数量有限**：不超过5-7个状态
3. **快速原型**：需要快速实现功能
4. **UI状态管理**：页面流程、表单状态

```typescript
// 适合用FSM的例子：简单的门控制
class DoorFSM {
  private state: 'closed' | 'opening' | 'open' | 'closing' = 'closed';

  interact(): void {
    switch (this.state) {
      case 'closed':
        this.state = 'opening';
        break;
      case 'open':
        this.state = 'closing';
        break;
    }
  }

  update(deltaTime: number): void {
    // 简单的状态转换逻辑
    if (this.state === 'opening') {
      // 播放开门动画...
      this.state = 'open';
    } else if (this.state === 'closing') {
      // 播放关门动画...
      this.state = 'closed';
    }
  }
}
```

#### 选择行为树的场景

1. **复杂AI行为**：如RPG敌人、RTS单位
2. **需要行为组合**：多种行为灵活组合
3. **行为需要复用**：相似角色共享行为逻辑
4. **团队协作**：策划可以通过可视化工具调整

```typescript
// 适合用行为树的例子：复杂NPC日程
const npcDailyBehavior = new BehaviorTreeBuilder()
  .selector('DailyRoutine')
    // 早上
    .sequence('Morning')
      .condition(new TimeCondition(6, 12))
      .selector('MorningActivities')
        .sequence('Breakfast')
          .action(new GoToAction('kitchen'))
          .action(new EatAction())
        .end()
        .action(new WorkAction())
      .end()
    .end()
    // 下午
    .sequence('Afternoon')
      .condition(new TimeCondition(12, 18))
      .selector('AfternoonActivities')
        .sequence('Lunch')
          .action(new GoToAction('restaurant'))
          .action(new EatAction())
        .end()
        .action(new SocializeAction())
        .action(new WorkAction())
      .end()
    .end()
    // 晚上
    .sequence('Evening')
      .condition(new TimeCondition(18, 22))
      .action(new GoToAction('home'))
      .action(new RelaxAction())
    .end()
    // 睡觉
    .sequence('Sleep')
      .action(new GoToAction('bedroom'))
      .action(new SleepAction())
    .end()
  .end()
  .build();
```

### 混合使用

在实际项目中，FSM和行为树可以混合使用，发挥各自的优势：

```typescript
// 混合架构示例：用FSM管理高级状态，行为树处理具体行为
class HybridAI {
  private fsm: StateMachine;
  private behaviorTrees: Map<string, BehaviorTree>;

  constructor(entity: any) {
    this.fsm = new StateMachine();
    this.behaviorTrees = new Map();

    // FSM管理大的行为模式
    this.fsm.addState(new IdleState(this));
    this.fsm.addState(new CombatState(this));
    this.fsm.addState(new FleeState(this));

    // 每个状态有自己的行为树
    this.behaviorTrees.set('idle', this.createIdleBT(entity));
    this.behaviorTrees.set('combat', this.createCombatBT(entity));
    this.behaviorTrees.set('flee', this.createFleeBT(entity));
  }

  update(deltaTime: number): void {
    // FSM决定当前模式
    this.fsm.update(deltaTime);

    // 获取当前状态对应的行为树
    const currentStateName = this.fsm.currentState?.name;
    if (currentStateName) {
      const bt = this.behaviorTrees.get(currentStateName);
      bt?.tick(deltaTime);
    }
  }

  private createIdleBT(entity: any): BehaviorTree {
    // 空闲行为树：闲逛、休息、随机动作
    const bt = new BehaviorTree(entity);
    // ... 构建行为树
    return bt;
  }

  private createCombatBT(entity: any): BehaviorTree {
    // 战斗行为树：攻击、躲避、使用技能
    const bt = new BehaviorTree(entity);
    // ... 构建行为树
    return bt;
  }

  private createFleeBT(entity: any): BehaviorTree {
    // 逃跑行为树：寻找掩体、呼救、快速移动
    const bt = new BehaviorTree(entity);
    // ... 构建行为树
    return bt;
  }
}
```

---

## 第四部分：优化与最佳实践

### 性能优化

#### 节点缓存

```typescript
// 使用节点池减少GC压力
class NodePool<T extends BehaviorNode> {
  private pool: T[] = [];
  private factory: () => T;

  constructor(factory: () => T, initialSize: number = 10) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    return this.pool.pop() || this.factory();
  }

  release(node: T): void {
    this.pool.push(node);
  }
}
```

#### 分帧执行

```typescript
// 分帧执行行为树，避免单帧计算量过大
class ThrottledBehaviorTree extends BehaviorTree {
  private tickInterval: number;
  private lastTickTime: number = 0;

  constructor(entity: any, tickInterval: number = 0.1) {
    super(entity);
    this.tickInterval = tickInterval;
  }

  tick(deltaTime: number): NodeStatus {
    this.lastTickTime += deltaTime;

    if (this.lastTickTime >= this.tickInterval) {
      this.lastTickTime = 0;
      return super.tick(deltaTime);
    }

    return NodeStatus.RUNNING;
  }
}
```

#### 条件缓存

```typescript
// 缓存条件检查结果
class CachedCondition extends ConditionNode {
  private innerCondition: ConditionNode;
  private cacheDuration: number;
  private cachedResult: NodeStatus | null = null;
  private lastCheckTime: number = 0;

  constructor(condition: ConditionNode, cacheDuration: number = 0.5) {
    super(`Cached(${condition.name})`);
    this.innerCondition = condition;
    this.cacheDuration = cacheDuration;
  }

  tick(context: BehaviorContext): NodeStatus {
    const currentTime = Date.now() / 1000;

    if (this.cachedResult === null ||
        currentTime - this.lastCheckTime > this.cacheDuration) {
      this.cachedResult = this.innerCondition.tick(context);
      this.lastCheckTime = currentTime;
    }

    return this.cachedResult;
  }
}
```

### 调试与可视化

```typescript
// 行为树调试器
class BehaviorTreeDebugger {
  private tree: BehaviorTree;
  private executionHistory: Array<{
    nodeName: string;
    status: NodeStatus;
    timestamp: number;
  }> = [];

  constructor(tree: BehaviorTree) {
    this.tree = tree;
  }

  logExecution(nodeName: string, status: NodeStatus): void {
    this.executionHistory.push({
      nodeName,
      status,
      timestamp: Date.now()
    });

    // 保留最近1000条记录
    if (this.executionHistory.length > 1000) {
      this.executionHistory.shift();
    }

    // 输出调试信息
    const statusSymbol = this.getStatusSymbol(status);
    console.log(`[BT] ${statusSymbol} ${nodeName}`);
  }

  private getStatusSymbol(status: NodeStatus): string {
    switch (status) {
      case NodeStatus.SUCCESS: return '[SUCCESS]';
      case NodeStatus.FAILURE: return '[FAILURE]';
      case NodeStatus.RUNNING: return '[RUNNING]';
    }
  }

  getLastExecutionPath(): string[] {
    return this.executionHistory
      .slice(-20)
      .map(e => `${e.nodeName}: ${e.status}`);
  }

  visualize(): string {
    // 生成行为树的可视化表示
    return this.generateTreeVisualization(this.tree);
  }

  private generateTreeVisualization(tree: BehaviorTree): string {
    // 实际实现中可以生成DOT格式或其他可视化格式
    return 'Tree visualization...';
  }
}
```

### 常见陷阱与解决方案

#### 陷阱1：忘记重置节点状态

```typescript
// 问题：Sequence节点没有重置子节点索引
class BrokenSequenceNode extends BehaviorNode {
  private currentChildIndex: number = 0;

  tick(context: BehaviorContext): NodeStatus {
    while (this.currentChildIndex < this.children.length) {
      const status = this.children[this.currentChildIndex].tick(context);

      if (status === NodeStatus.FAILURE) {
        // BUG：失败时没有重置索引
        return NodeStatus.FAILURE;
      }

      if (status === NodeStatus.RUNNING) {
        return NodeStatus.RUNNING;
      }

      this.currentChildIndex++;
    }

    // BUG：成功时也没有重置索引
    return NodeStatus.SUCCESS;
  }
}

// 解决方案：在返回前重置状态
class FixedSequenceNode extends BehaviorNode {
  private currentChildIndex: number = 0;

  tick(context: BehaviorContext): NodeStatus {
    while (this.currentChildIndex < this.children.length) {
      const status = this.children[this.currentChildIndex].tick(context);

      if (status === NodeStatus.FAILURE) {
        this.currentChildIndex = 0; // 重置
        return NodeStatus.FAILURE;
      }

      if (status === NodeStatus.RUNNING) {
        return NodeStatus.RUNNING;
      }

      this.currentChildIndex++;
    }

    this.currentChildIndex = 0; // 重置
    return NodeStatus.SUCCESS;
  }
}
```

#### 陷阱2：无限循环

```typescript
// 问题：两个状态互相切换导致无限循环
class StateA implements IState {
  name = 'stateA';
  onEnter(): void {}
  onUpdate(deltaTime: number): void {
    // 总是切换到B
    this.entity.stateMachine.changeStateTo('stateB');
  }
  onExit(): void {}
}

class StateB implements IState {
  name = 'stateB';
  onEnter(): void {}
  onUpdate(deltaTime: number): void {
    // 总是切换到A
    this.entity.stateMachine.changeStateTo('stateA');
  }
  onExit(): void {}
}

// 解决方案：添加切换冷却或条件判断
class SafeStateMachine extends StateMachine {
  private lastChangeTime: number = 0;
  private minChangeCooldown: number = 0.1;

  changeState(newState: IState): void {
    const currentTime = Date.now() / 1000;

    if (currentTime - this.lastChangeTime < this.minChangeCooldown) {
      console.warn('状态切换过于频繁，已阻止');
      return;
    }

    this.lastChangeTime = currentTime;
    super.changeState(newState);
  }
}
```

#### 陷阱3：黑板数据竞争

```typescript
// 问题：多个节点同时修改黑板数据
class UnsafeBlackboardUsage extends ActionNode {
  tick(context: BehaviorContext): NodeStatus {
    const target = context.blackboard.get('target');
    // 其他节点可能同时修改target
    if (target) {
      // 使用target...
    }
    return NodeStatus.SUCCESS;
  }
}

// 解决方案：使用事务或锁机制
class TransactionalBlackboard extends Blackboard {
  private locks: Set<string> = new Set();

  acquireLock(key: string): boolean {
    if (this.locks.has(key)) {
      return false;
    }
    this.locks.add(key);
    return true;
  }

  releaseLock(key: string): void {
    this.locks.delete(key);
  }

  transaction<T>(keys: string[], operation: () => T): T | null {
    // 尝试获取所有锁
    const acquiredLocks: string[] = [];

    for (const key of keys) {
      if (this.acquireLock(key)) {
        acquiredLocks.push(key);
      } else {
        // 释放已获取的锁
        acquiredLocks.forEach(k => this.releaseLock(k));
        return null;
      }
    }

    try {
      return operation();
    } finally {
      acquiredLocks.forEach(k => this.releaseLock(k));
    }
  }
}
```

---

## 第五部分：实战案例

### 塔防游戏敌人AI

```typescript
// 塔防敌人：沿路径移动，遇到障碍物绕行
interface TowerDefenseEnemy {
  position: { x: number; y: number };
  speed: number;
  health: number;
  path: Array<{ x: number; y: number }>;
  currentWaypointIndex: number;
}

function createTowerDefenseEnemyBT(enemy: TowerDefenseEnemy): BehaviorTree {
  const bt = new BehaviorTree(enemy);

  const root = new BehaviorTreeBuilder()
    .selector('TowerDefenseAI')
      // 死亡检查
      .sequence('DeathCheck')
        .condition(new HealthCheckCondition(0, 'below'))
        .action(new DieAction())
      .end()
      // 主要行为：沿路径移动
      .sequence('FollowPath')
        .action(new MoveAlongPathAction())
      .end()
    .end()
    .build();

  bt.setRoot(root);
  return bt;
}

class MoveAlongPathAction extends ActionNode {
  constructor() {
    super('MoveAlongPath');
  }

  tick(context: BehaviorContext): NodeStatus {
    const enemy = context.entity as TowerDefenseEnemy;

    if (enemy.currentWaypointIndex >= enemy.path.length) {
      // 到达终点
      return NodeStatus.SUCCESS;
    }

    const targetWaypoint = enemy.path[enemy.currentWaypointIndex];
    const dx = targetWaypoint.x - enemy.position.x;
    const dy = targetWaypoint.y - enemy.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      enemy.currentWaypointIndex++;
      return NodeStatus.RUNNING;
    }

    const moveSpeed = enemy.speed * context.deltaTime;
    enemy.position.x += (dx / distance) * moveSpeed;
    enemy.position.y += (dy / distance) * moveSpeed;

    return NodeStatus.RUNNING;
  }
}
```

### ARPG 敌人AI

```typescript
// ARPG敌人：巡逻、追击、攻击、躲避
function createARPGEnemyBT(enemy: any): BehaviorTree {
  const bt = new BehaviorTree(enemy);

  const root = new BehaviorTreeBuilder()
    .selector('ARPG_EnemyAI')
      // 死亡
      .sequence('HandleDeath')
        .condition(new HealthCheckCondition(0, 'below'))
        .action(new PlayAnimationAction('death'))
        .action(new DropLootAction())
        .action(new DestroyAction())
      .end()

      // 被击中反应
      .sequence('HitReaction')
        .condition(new WasHitCondition())
        .action(new PlayAnimationAction('hit'))
        .action(new ClearHitFlagAction())
      .end()

      // 战斗状态
      .sequence('Combat')
        .condition(new HasEnemyInRangeCondition(300))
        .selector('CombatDecision')
          // 技能攻击（冷却中）
          .sequence('UseSkill')
            .condition(new CanUseSkillCondition())
            .action(new UseSkillAction())
          .end()

          // 躲避攻击
          .sequence('Dodge')
            .condition(new ShouldDodgeCondition())
            .action(new DodgeAction())
          .end()

          // 近战攻击
          .sequence('MeleeAttack')
            .condition(new IsInAttackRangeCondition())
            .action(new MeleeAttackAction())
          .end()

          // 追击
          .action(new ChaseTargetAction())
        .end()
      .end()

      // 警戒状态：发现蛛丝马迹
      .sequence('Alert')
        .condition(new HeardNoiseCondition())
        .action(new InvestigateAction())
      .end()

      // 巡逻状态
      .action(new PatrolAction())
    .end()
    .build();

  bt.setRoot(root);
  return bt;
}

// 技能使用
class UseSkillAction extends ActionNode {
  private skills: Array<{ name: string; cooldown: number; damage: number }>;
  private currentSkillIndex: number = 0;

  constructor() {
    super('UseSkill');
    this.skills = [
      { name: '旋风斩', cooldown: 5, damage: 50 },
      { name: '冲锋', cooldown: 8, damage: 30 },
      { name: '战吼', cooldown: 15, damage: 0 }
    ];
  }

  tick(context: BehaviorContext): NodeStatus {
    const availableSkill = this.getAvailableSkill(context);

    if (!availableSkill) {
      return NodeStatus.FAILURE;
    }

    console.log(`使用技能: ${availableSkill.name}`);
    context.blackboard.set(`skill_${availableSkill.name}_lastUse`, Date.now());

    return NodeStatus.SUCCESS;
  }

  private getAvailableSkill(context: BehaviorContext): any {
    const now = Date.now();

    for (const skill of this.skills) {
      const lastUse = context.blackboard.get<number>(`skill_${skill.name}_lastUse`) || 0;
      if (now - lastUse > skill.cooldown * 1000) {
        return skill;
      }
    }

    return null;
  }
}

// 躲避判断
class ShouldDodgeCondition extends ConditionNode {
  constructor() {
    super('ShouldDodge');
  }

  tick(context: BehaviorContext): NodeStatus {
    const incomingAttacks = context.blackboard.get<any[]>('incomingAttacks') || [];

    // 检查是否有即将命中的攻击
    for (const attack of incomingAttacks) {
      if (attack.timeToHit < 0.5) {
        context.blackboard.set('dodgeDirection', this.calculateDodgeDirection(attack));
        return NodeStatus.SUCCESS;
      }
    }

    return NodeStatus.FAILURE;
  }

  private calculateDodgeDirection(attack: any): { x: number; y: number } {
    // 计算躲避方向：垂直于攻击方向
    return { x: -attack.direction.y, y: attack.direction.x };
  }
}
```

### RTS 单位AI

```typescript
// RTS单位：采集资源、建造、战斗
function createRTSWorkerBT(worker: any): BehaviorTree {
  const bt = new BehaviorTree(worker);

  const root = new BehaviorTreeBuilder()
    .selector('RTSWorkerAI')
      // 响应玩家命令
      .sequence('ExecuteCommand')
        .condition(new HasCommandCondition())
        .selector('CommandType')
          .sequence('MoveCommand')
            .condition(new IsMoveCommandCondition())
            .action(new MoveToPositionAction())
          .end()
          .sequence('GatherCommand')
            .condition(new IsGatherCommandCondition())
            .action(new GatherResourceAction())
          .end()
          .sequence('BuildCommand')
            .condition(new IsBuildCommandCondition())
            .action(new BuildStructureAction())
          .end()
        .end()
      .end()

      // 自动行为：受到攻击时逃跑
      .sequence('FleeFromDanger')
        .condition(new IsUnderAttackCondition())
        .action(new FleeToSafetyAction())
      .end()

      // 空闲：寻找最近的资源采集
      .sequence('AutoGather')
        .condition(new IsIdleCondition())
        .action(new FindNearestResourceAction())
        .action(new GatherResourceAction())
      .end()
    .end()
    .build();

  bt.setRoot(root);
  return bt;
}

// RTS战斗单位
function createRTSCombatUnitBT(unit: any): BehaviorTree {
  const bt = new BehaviorTree(unit);

  const root = new BehaviorTreeBuilder()
    .selector('RTSCombatUnitAI')
      // 响应玩家命令
      .sequence('ExecuteCommand')
        .condition(new HasCommandCondition())
        .selector('CommandType')
          .sequence('MoveCommand')
            .condition(new IsMoveCommandCondition())
            .action(new MoveToPositionAction())
          .end()
          .sequence('AttackCommand')
            .condition(new IsAttackCommandCondition())
            .action(new AttackTargetAction())
          .end()
          .sequence('PatrolCommand')
            .condition(new IsPatrolCommandCondition())
            .action(new PatrolAreaAction())
          .end()
        .end()
      .end()

      // 自动攻击附近敌人
      .sequence('AutoAttack')
        .condition(new HasEnemyInRangeCondition(unit.attackRange))
        .action(new AttackNearestEnemyAction())
      .end()

      // 编队行为
      .sequence('FormationBehavior')
        .condition(new IsInFormationCondition())
        .action(new MaintainFormationAction())
      .end()

      // 空闲
      .action(new IdleAction())
    .end()
    .build();

  bt.setRoot(root);
  return bt;
}

// 采集资源动作
class GatherResourceAction extends ActionNode {
  private gatherTimer: number = 0;
  private readonly GATHER_TIME: number = 2.0;

  constructor() {
    super('GatherResource');
  }

  tick(context: BehaviorContext): NodeStatus {
    const resource = context.blackboard.get('targetResource');
    const worker = context.entity;

    if (!resource) {
      return NodeStatus.FAILURE;
    }

    // 检查是否到达资源位置
    const distance = this.getDistance(worker.position, resource.position);
    if (distance > 10) {
      // 需要先移动到资源位置
      context.blackboard.set('moveTarget', resource.position);
      return NodeStatus.FAILURE;
    }

    // 采集中
    this.gatherTimer += context.deltaTime;

    if (this.gatherTimer >= this.GATHER_TIME) {
      this.gatherTimer = 0;
      worker.carryingResource = resource.type;
      worker.carryingAmount = Math.min(resource.amount, worker.carryCapacity);
      resource.amount -= worker.carryingAmount;

      console.log(`采集了 ${worker.carryingAmount} 单位 ${resource.type}`);

      // 采集完成，需要送回基地
      context.blackboard.set('needToDeposit', true);
      return NodeStatus.SUCCESS;
    }

    return NodeStatus.RUNNING;
  }

  private getDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}
```

---

## 总结

### 核心要点

1. **FSM** 适合简单、状态明确的场景，实现简单但扩展性差
2. **行为树** 适合复杂AI，节点可复用，扩展性好
3. **可以混合使用**：FSM管理高级状态，行为树处理具体行为
4. **黑板系统** 是行为树中节点通信的关键机制
5. **性能优化** 要注意节点缓存、分帧执行和条件缓存

### 选择建议

- 状态少于5个，选 FSM
- 行为复杂、需要复用，选行为树
- 超复杂系统，考虑混合架构
- 需要策划配置，优先行为树（可视化工具友好）

### 进阶学习

1. **GOAP（目标导向行动规划）**：基于目标自动规划行为序列
2. **Utility AI**：基于效用值选择行为
3. **机器学习AI**：神经网络驱动的游戏AI
4. **群体AI**：Flocking、群体寻路

---

## 参考资源

### 书籍

- 《Game AI Pro》系列
- 《Artificial Intelligence for Games》- Ian Millington
- 《游戏人工智能编程案例精粹》

### 在线资源

- [Behavior Tree Starter Kit](https://www.behaviortree.dev/)
- [Game Programming Patterns - State](https://gameprogrammingpatterns.com/state.html)
- [Understanding Behavior Trees](https://www.gamedeveloper.com/programming/behavior-trees-for-ai-how-they-work)

### 开源项目

- [behavior3js](https://github.com/behavior3/behavior3js) - JavaScript行为树库
- [BehaviorTree.CPP](https://github.com/BehaviorTree/BehaviorTree.CPP) - C++行为树库
- [fluid-behavior-tree](https://github.com/CleverCrow/Fluid-Behavior-Tree) - Unity行为树

---

## 面试要点

### 常见面试问题

1. **什么是有限状态机？它有哪些组成部分？**
   - 状态、转换、事件、动作
   - 任意时刻只能处于一个状态
   - 转换由事件触发

2. **FSM的优缺点是什么？**
   - 优点：简单直观、易调试、实现快速
   - 缺点：状态爆炸、难复用、扩展困难

3. **行为树有哪些节点类型？**
   - 组合节点：Selector、Sequence、Parallel
   - 装饰节点：Inverter、Repeat、Guard
   - 叶子节点：Action、Condition

4. **Selector和Sequence的区别？**
   - Selector：或逻辑，一个成功即成功
   - Sequence：与逻辑，全部成功才成功

5. **什么是黑板系统？它的作用是什么？**
   - 共享数据的键值存储
   - 节点间通信的机制
   - 可以添加监听器响应数据变化

6. **如何选择FSM还是行为树？**
   - 简单场景用FSM
   - 复杂场景用行为树
   - 可以混合使用

7. **行为树的性能优化方法？**
   - 节点缓存/对象池
   - 分帧执行
   - 条件结果缓存
   - 减少不必要的节点遍历
