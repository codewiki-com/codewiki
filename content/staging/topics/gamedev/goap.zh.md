---
title: 目标导向行为规划（GOAP）
description: 掌握 GOAP 以实现智能游戏 AI，能够动态规划动作序列来达成复杂目标
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - GOAP
  - 游戏AI
  - 规划
  - 决策
  - 行为规划
status: imported
origin: old/src/content/docs/gamedev/goap.zh.md
divergence: 0.217
issues: []
legacy:
  category: GameDev
  subcategory: AI
  order: 15
  lastUpdated: 2026-01-21
---

## 概念解释

**目标导向行为规划（Goal-Oriented Action Planning，GOAP）** 是一种 AI 架构，使游戏代理能够动态构建动作序列以实现指定目标。与有限状态机（FSM）或行为树（Behavior Tree）中显式定义转换不同，GOAP 代理会推理其可用动作并自动规划满足当前目标的最佳路径。

最初由 Jeff Orkin 为游戏《F.E.A.R.》（2005年）开发，GOAP 此后被众多 3A 大作采用，包括《古墓丽影》、《杀出重围：人类革命》和《中土世界：暗影魔多》等。

### GOAP 与传统 AI 系统的对比

```
传统有限状态机:                    GOAP:
┌─────────────────────────┐        ┌─────────────────────────┐
│  状态 A ──▶ 状态 B       │        │  目标: 消灭敌人          │
│     │          │        │        │         │               │
│     ▼          ▼        │        │    ┌────┴────┐          │
│  状态 C ──▶ 状态 D       │        │    │ 规划器  │          │
│                         │        │    └────┬────┘          │
│  固定转换               │        │         │               │
│  设计师定义所有         │        │  [获取武器]──▶[瞄准]──▶[射击]
│  可能路径               │        │                         │
│                         │        │  动态动作链             │
│                         │        │  代理自主寻找解决方案   │
└─────────────────────────┘        └─────────────────────────┘
```

**关键区别:**

| 方面 | FSM/行为树 | GOAP |
|--------|-------------------|------|
| 规划方式 | 设计师预先定义 | 代理运行时规划 |
| 灵活性 | 仅限于定义的转换 | 涌现行为 |
| 可扩展性 | 复杂度指数增长 | 线性增加动作 |
| 调试难度 | 易于追踪 | 需要计划可视化 |
| 设计师控制 | 直接控制 | 间接控制（通过成本/效果） |

---

## 核心原理

### GOAP 架构

GOAP 系统由四个基本组件组成：

```
┌─────────────────────────────────────────────────────────────────┐
│                         GOAP 代理                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │    目标      │    │    动作      │    │   世界状态   │      │
│  │              │    │              │    │              │      │
│  │ - 消灭敌人   │    │ - 获取武器   │    │ - hasWeapon  │      │
│  │ - 保持存活   │    │ - 装弹       │    │ - hasAmmo    │      │
│  │ - 寻找掩护   │    │ - 射击       │    │ - enemyDead  │      │
│  │              │    │ - 进入掩护   │    │ - inCover    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                   │
│                      ┌──────▼───────┐                           │
│                      │    规划器    │                           │
│                      │              │                           │
│                      │  A* 搜索     │                           │
│                      │  + 启发函数  │                           │
│                      └──────┬───────┘                           │
│                             │                                   │
│                      ┌──────▼───────┐                           │
│                      │   行动计划   │                           │
│                      │              │                           │
│                      │ [A]─▶[B]─▶[C]│                           │
│                      └──────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1. 世界状态（World State）

世界状态是描述当前情况的布尔值或数值属性集合：

```typescript
interface WorldState {
  [key: string]: boolean | number;
}

// 世界状态示例
const worldState: WorldState = {
  hasWeapon: false,      // 是否有武器
  hasAmmo: true,         // 是否有弹药
  weaponLoaded: false,   // 武器是否装弹
  enemyVisible: true,    // 敌人是否可见
  enemyDead: false,      // 敌人是否死亡
  inCover: false,        // 是否在掩护中
  health: 75,            // 生命值
  nearWeaponCache: true  // 是否靠近武器库
};
```

### 2. 目标（Goals）

目标定义了代理想要实现的期望世界状态：

```typescript
interface Goal {
  name: string;
  priority: number;
  desiredState: Partial<WorldState>;
  isValid(currentState: WorldState): boolean;
}

// 目标示例
const killEnemyGoal: Goal = {
  name: "KillEnemy",
  priority: 10,
  desiredState: {
    enemyDead: true
  },
  isValid(state) {
    return state.enemyVisible === true && state.enemyDead === false;
  }
};
```

### 3. 动作（Actions）

动作是转换世界状态的构建块。每个动作包含：
- **前置条件（Preconditions）**：执行动作所需的世界状态要求
- **效果（Effects）**：动作如何改变世界状态
- **成本（Cost）**：用于规划优化的资源消耗

```typescript
interface Action {
  name: string;
  cost: number;
  preconditions: Partial<WorldState>;
  effects: Partial<WorldState>;

  isValid(agent: Agent, state: WorldState): boolean;
  perform(agent: Agent): Promise<ActionResult>;
  getDynamicCost(agent: Agent, state: WorldState): number;
}
```

### 4. 规划器（Planner）

规划器使用搜索算法（通常是 A*）来找到将当前世界状态转换为目标状态的最优动作序列。

---

## 关键概念

### 动作图与规划

GOAP 规划通过将动作视为连接世界状态的图边来工作：

```
当前状态          动作              目标状态
    │                                   │
    │  hasWeapon: false                 │  enemyDead: true
    │  hasAmmo: true     ┌──────────────┐       │
    │  enemyDead: false  │  获取武器    │       │
    │                    │  成本: 2     │       │
    └───────────────────▶│  前置: nearCache     │
                         │  效果: hasWeapon     │
                         └────────┬─────┘       │
                                  │             │
                         ┌────────▼─────┐       │
                         │  装填武器    │       │
                         │  成本: 1     │       │
                         │  前置: hasWeapon,    │
                         │       hasAmmo │      │
                         │  效果: weaponLoaded  │
                         └────────┬─────┘       │
                                  │             │
                         ┌────────▼─────┐       │
                         │    射击      │       │
                         │  成本: 1     │───────▶
                         │  前置: weaponLoaded, │
                         │       enemyVisible   │
                         │  效果: enemyDead     │
                         └──────────────┘

总计划成本: 4
```

### 后向规划（回归搜索）

GOAP 通常使用**后向规划** - 从目标开始，向后寻找能够满足所需前置条件的动作：

```
目标: enemyDead = true
  │
  │ 哪个动作能产生这个效果？
  ▼
动作: Shoot（射击）（效果: enemyDead）
  │ 前置条件: weaponLoaded, enemyVisible
  │
  │ enemyVisible = true（已满足）
  │ weaponLoaded = false（需要满足）
  ▼
动作: LoadWeapon（装弹）（效果: weaponLoaded）
  │ 前置条件: hasWeapon, hasAmmo
  │
  │ hasAmmo = true（已满足）
  │ hasWeapon = false（需要满足）
  ▼
动作: GetWeapon（获取武器）（效果: hasWeapon）
  │ 前置条件: nearWeaponCache
  │
  │ nearWeaponCache = true（已满足）
  ▼
所有前置条件已满足！

计划: [GetWeapon] → [LoadWeapon] → [Shoot]
```

### 基于成本的优化

可能存在多个有效计划。GOAP 使用成本来选择最优计划：

```
计划 A: GetWeapon → LoadWeapon → Shoot
        成本: 2 + 1 + 1 = 4

计划 B: FindCover → GetWeapon → LoadWeapon → Shoot
        成本: 3 + 2 + 1 + 1 = 7

计划 C: MeleeAttack（近战攻击）（如果足够近）
        成本: 2

规划器选择: 计划 C（最低成本，如果有效）
    或者: 计划 A（如果近战不可用）
```

---

## 代码示例

### 完整的 GOAP 实现

```typescript
// 世界状态表示
type WorldState = Map<string, boolean | number>;

// 动作定义
interface GOAPAction {
  name: string;
  baseCost: number;
  preconditions: Map<string, boolean | number>;
  effects: Map<string, boolean | number>;

  // 超出前置条件的运行时验证
  isProcedurallyValid(agent: GOAPAgent, state: WorldState): boolean;

  // 动态成本计算
  getCost(agent: GOAPAgent, state: WorldState): number;

  // 执行
  execute(agent: GOAPAgent): Promise<boolean>;

  // 用于长时间运行的动作
  isComplete(agent: GOAPAgent): boolean;
  abort(agent: GOAPAgent): void;
}

// 目标定义
interface GOAPGoal {
  name: string;
  basePriority: number;
  targetState: Map<string, boolean | number>;

  // 动态优先级计算
  getPriority(agent: GOAPAgent, state: WorldState): number;

  // 检查目标是否应被考虑
  isRelevant(agent: GOAPAgent, state: WorldState): boolean;

  // 检查目标是否已满足
  isSatisfied(state: WorldState): boolean;
}

// A* 搜索的规划节点
class PlannerNode {
  state: WorldState;
  action: GOAPAction | null;
  parent: PlannerNode | null;
  gCost: number; // 从起点的成本
  hCost: number; // 到目标的启发式估计

  constructor(
    state: WorldState,
    action: GOAPAction | null,
    parent: PlannerNode | null,
    gCost: number,
    hCost: number
  ) {
    this.state = state;
    this.action = action;
    this.parent = parent;
    this.gCost = gCost;
    this.hCost = hCost;
  }

  get fCost(): number {
    return this.gCost + this.hCost;
  }
}

// GOAP 规划器
class GOAPPlanner {
  private maxIterations: number = 1000;

  plan(
    agent: GOAPAgent,
    availableActions: GOAPAction[],
    currentState: WorldState,
    goal: GOAPGoal
  ): GOAPAction[] | null {

    // 仅筛选有效动作
    const validActions = availableActions.filter(action =>
      action.isProcedurallyValid(agent, currentState)
    );

    // A* 搜索设置
    const openList: PlannerNode[] = [];
    const closedList: Set<string> = new Set();

    // 起始节点
    const startNode = new PlannerNode(
      new Map(currentState),
      null,
      null,
      0,
      this.calculateHeuristic(currentState, goal.targetState)
    );

    openList.push(startNode);
    let iterations = 0;

    while (openList.length > 0 && iterations < this.maxIterations) {
      iterations++;

      // 获取 fCost 最低的节点
      openList.sort((a, b) => a.fCost - b.fCost);
      const currentNode = openList.shift()!;

      // 检查是否达到目标
      if (this.stateMatchesGoal(currentNode.state, goal.targetState)) {
        return this.reconstructPlan(currentNode);
      }

      // 添加到已关闭列表
      const stateKey = this.stateToString(currentNode.state);
      if (closedList.has(stateKey)) continue;
      closedList.add(stateKey);

      // 探索动作
      for (const action of validActions) {
        if (!this.actionPreconditionsMet(action, currentNode.state)) {
          continue;
        }

        // 应用动作效果创建新状态
        const newState = this.applyActionEffects(currentNode.state, action);
        const newStateKey = this.stateToString(newState);

        if (closedList.has(newStateKey)) continue;

        const gCost = currentNode.gCost + action.getCost(agent, currentNode.state);
        const hCost = this.calculateHeuristic(newState, goal.targetState);

        const newNode = new PlannerNode(
          newState,
          action,
          currentNode,
          gCost,
          hCost
        );

        openList.push(newNode);
      }
    }

    // 未找到计划
    return null;
  }

  private calculateHeuristic(
    current: WorldState,
    target: Map<string, boolean | number>
  ): number {
    let unsatisfied = 0;

    for (const [key, value] of target) {
      if (current.get(key) !== value) {
        unsatisfied++;
      }
    }

    return unsatisfied;
  }

  private stateMatchesGoal(
    state: WorldState,
    target: Map<string, boolean | number>
  ): boolean {
    for (const [key, value] of target) {
      if (state.get(key) !== value) {
        return false;
      }
    }
    return true;
  }

  private actionPreconditionsMet(
    action: GOAPAction,
    state: WorldState
  ): boolean {
    for (const [key, value] of action.preconditions) {
      if (state.get(key) !== value) {
        return false;
      }
    }
    return true;
  }

  private applyActionEffects(
    state: WorldState,
    action: GOAPAction
  ): WorldState {
    const newState = new Map(state);

    for (const [key, value] of action.effects) {
      newState.set(key, value);
    }

    return newState;
  }

  private stateToString(state: WorldState): string {
    const entries = Array.from(state.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    return JSON.stringify(entries);
  }

  private reconstructPlan(node: PlannerNode): GOAPAction[] {
    const plan: GOAPAction[] = [];
    let current: PlannerNode | null = node;

    while (current !== null) {
      if (current.action !== null) {
        plan.unshift(current.action);
      }
      current = current.parent;
    }

    return plan;
  }
}

// GOAP 代理
class GOAPAgent {
  private planner: GOAPPlanner;
  private actions: GOAPAction[];
  private goals: GOAPGoal[];
  private currentPlan: GOAPAction[];
  private currentActionIndex: number;
  private worldState: WorldState;

  constructor() {
    this.planner = new GOAPPlanner();
    this.actions = [];
    this.goals = [];
    this.currentPlan = [];
    this.currentActionIndex = 0;
    this.worldState = new Map();
  }

  addAction(action: GOAPAction): void {
    this.actions.push(action);
  }

  addGoal(goal: GOAPGoal): void {
    this.goals.push(goal);
  }

  setWorldState(key: string, value: boolean | number): void {
    this.worldState.set(key, value);
  }

  async update(): Promise<void> {
    // 从传感器更新世界状态
    this.updateWorldState();

    // 检查是否需要新计划
    if (this.needsNewPlan()) {
      this.createNewPlan();
    }

    // 执行当前计划
    await this.executePlan();
  }

  private updateWorldState(): void {
    // 在子类中重写以从游戏世界更新
    // 示例: this.worldState.set('enemyVisible', this.canSeeEnemy());
  }

  private needsNewPlan(): boolean {
    // 没有当前计划
    if (this.currentPlan.length === 0) return true;

    // 计划已完成
    if (this.currentActionIndex >= this.currentPlan.length) return true;

    // 当前动作不再有效
    const currentAction = this.currentPlan[this.currentActionIndex];
    if (!currentAction.isProcedurallyValid(this, this.worldState)) {
      return true;
    }

    // 有更高优先级的目标可用
    const currentGoal = this.selectBestGoal();
    if (currentGoal && this.hasHigherPriorityGoal(currentGoal)) {
      return true;
    }

    return false;
  }

  private hasHigherPriorityGoal(newGoal: GOAPGoal): boolean {
    // 与创建当前计划的目标进行比较
    // 实现取决于跟踪当前目标
    return false;
  }

  private createNewPlan(): void {
    const goal = this.selectBestGoal();

    if (!goal) {
      this.currentPlan = [];
      return;
    }

    const plan = this.planner.plan(
      this,
      this.actions,
      this.worldState,
      goal
    );

    if (plan) {
      this.currentPlan = plan;
      this.currentActionIndex = 0;
      console.log(`为目标 "${goal.name}" 创建新计划:`,
        plan.map(a => a.name).join(' -> ')
      );
    } else {
      console.log(`无法为目标 "${goal.name}" 创建计划`);
      this.currentPlan = [];
    }
  }

  private selectBestGoal(): GOAPGoal | null {
    let bestGoal: GOAPGoal | null = null;
    let bestPriority = -Infinity;

    for (const goal of this.goals) {
      if (!goal.isRelevant(this, this.worldState)) continue;
      if (goal.isSatisfied(this.worldState)) continue;

      const priority = goal.getPriority(this, this.worldState);
      if (priority > bestPriority) {
        bestPriority = priority;
        bestGoal = goal;
      }
    }

    return bestGoal;
  }

  private async executePlan(): Promise<void> {
    if (this.currentActionIndex >= this.currentPlan.length) return;

    const action = this.currentPlan[this.currentActionIndex];

    // 检查动作是否仍可执行
    if (!this.actionPreconditionsMet(action)) {
      // 需要重新规划
      this.currentPlan = [];
      return;
    }

    // 执行或继续动作
    if (action.isComplete(this)) {
      // 移至下一个动作
      this.currentActionIndex++;

      // 将效果应用到世界状态
      for (const [key, value] of action.effects) {
        this.worldState.set(key, value);
      }
    } else {
      // 继续执行
      const success = await action.execute(this);

      if (!success) {
        // 动作失败，需要重新规划
        action.abort(this);
        this.currentPlan = [];
      }
    }
  }

  private actionPreconditionsMet(action: GOAPAction): boolean {
    for (const [key, value] of action.preconditions) {
      if (this.worldState.get(key) !== value) {
        return false;
      }
    }
    return true;
  }
}
```

### 实际示例：战斗 AI

```typescript
// 具体动作实现
class GetWeaponAction implements GOAPAction {
  name = "GetWeapon";
  baseCost = 2;
  preconditions = new Map<string, boolean | number>([
    ["nearWeaponCache", true],
    ["hasWeapon", false]
  ]);
  effects = new Map<string, boolean | number>([
    ["hasWeapon", true]
  ]);

  private isRunning = false;
  private targetPosition: Vector3 | null = null;

  isProcedurallyValid(agent: GOAPAgent, state: WorldState): boolean {
    // 检查附近是否确实有武器
    return this.findNearestWeapon(agent) !== null;
  }

  getCost(agent: GOAPAgent, state: WorldState): number {
    const weapon = this.findNearestWeapon(agent);
    if (!weapon) return Infinity;

    // 基于距离的成本
    const distance = agent.position.distanceTo(weapon.position);
    return this.baseCost + (distance / 10);
  }

  async execute(agent: GOAPAgent): Promise<boolean> {
    if (!this.isRunning) {
      this.targetPosition = this.findNearestWeapon(agent)?.position ?? null;
      if (!this.targetPosition) return false;
      this.isRunning = true;
    }

    // 向武器移动
    agent.moveTo(this.targetPosition!);
    return true;
  }

  isComplete(agent: GOAPAgent): boolean {
    if (!this.targetPosition) return false;

    const distance = agent.position.distanceTo(this.targetPosition);
    if (distance < 1.0) {
      // 拾取武器
      agent.pickUpWeapon();
      this.isRunning = false;
      return true;
    }
    return false;
  }

  abort(agent: GOAPAgent): void {
    this.isRunning = false;
    this.targetPosition = null;
    agent.stopMoving();
  }

  private findNearestWeapon(agent: GOAPAgent): Weapon | null {
    // 在游戏世界中查找最近的武器
    return agent.world.findNearestWeapon(agent.position, 20);
  }
}

class ShootEnemyAction implements GOAPAction {
  name = "ShootEnemy";
  baseCost = 1;
  preconditions = new Map<string, boolean | number>([
    ["hasWeapon", true],
    ["weaponLoaded", true],
    ["enemyVisible", true],
    ["enemyDead", false]
  ]);
  effects = new Map<string, boolean | number>([
    ["enemyDead", true]
  ]);

  private shotsRemaining = 3;

  isProcedurallyValid(agent: GOAPAgent, state: WorldState): boolean {
    return agent.hasLineOfSightToEnemy();
  }

  getCost(agent: GOAPAgent, state: WorldState): number {
    const enemy = agent.getCurrentTarget();
    if (!enemy) return Infinity;

    // 容易射击的目标成本更低
    const distance = agent.position.distanceTo(enemy.position);
    const accuracyModifier = distance > 15 ? 2 : 1;

    return this.baseCost * accuracyModifier;
  }

  async execute(agent: GOAPAgent): Promise<boolean> {
    const enemy = agent.getCurrentTarget();
    if (!enemy) return false;

    // 瞄准并射击
    agent.aimAt(enemy.position);
    agent.fireWeapon();
    this.shotsRemaining--;

    return true;
  }

  isComplete(agent: GOAPAgent): boolean {
    const enemy = agent.getCurrentTarget();

    // 如果敌人死亡或已发射所有子弹则完成
    if (!enemy || enemy.isDead || this.shotsRemaining <= 0) {
      this.shotsRemaining = 3; // 重置以供下次使用
      return true;
    }

    return false;
  }

  abort(agent: GOAPAgent): void {
    this.shotsRemaining = 3;
  }
}

class TakeCoverAction implements GOAPAction {
  name = "TakeCover";
  baseCost = 2;
  preconditions = new Map<string, boolean | number>([
    ["inCover", false]
  ]);
  effects = new Map<string, boolean | number>([
    ["inCover", true]
  ]);

  private coverPosition: Vector3 | null = null;

  isProcedurallyValid(agent: GOAPAgent, state: WorldState): boolean {
    return this.findCoverPosition(agent) !== null;
  }

  getCost(agent: GOAPAgent, state: WorldState): number {
    const cover = this.findCoverPosition(agent);
    if (!cover) return Infinity;

    return this.baseCost + (agent.position.distanceTo(cover) / 5);
  }

  async execute(agent: GOAPAgent): Promise<boolean> {
    if (!this.coverPosition) {
      this.coverPosition = this.findCoverPosition(agent);
      if (!this.coverPosition) return false;
    }

    agent.moveTo(this.coverPosition);
    return true;
  }

  isComplete(agent: GOAPAgent): boolean {
    if (!this.coverPosition) return false;

    const distance = agent.position.distanceTo(this.coverPosition);
    if (distance < 0.5) {
      agent.enterCover();
      this.coverPosition = null;
      return true;
    }
    return false;
  }

  abort(agent: GOAPAgent): void {
    this.coverPosition = null;
    agent.stopMoving();
  }

  private findCoverPosition(agent: GOAPAgent): Vector3 | null {
    return agent.world.findNearestCover(
      agent.position,
      agent.getCurrentTarget()?.position
    );
  }
}

// 目标实现
class KillEnemyGoal implements GOAPGoal {
  name = "KillEnemy";
  basePriority = 50;
  targetState = new Map<string, boolean | number>([
    ["enemyDead", true]
  ]);

  getPriority(agent: GOAPAgent, state: WorldState): number {
    // 生命值高时优先级更高
    const health = state.get("health") as number || 100;
    return this.basePriority * (health / 100);
  }

  isRelevant(agent: GOAPAgent, state: WorldState): boolean {
    return state.get("enemyVisible") === true;
  }

  isSatisfied(state: WorldState): boolean {
    return state.get("enemyDead") === true;
  }
}

class StayAliveGoal implements GOAPGoal {
  name = "StayAlive";
  basePriority = 100;
  targetState = new Map<string, boolean | number>([
    ["inCover", true]
  ]);

  getPriority(agent: GOAPAgent, state: WorldState): number {
    const health = state.get("health") as number || 100;

    // 生命值降低时优先级增加
    if (health < 30) return 150;
    if (health < 50) return 80;
    return 0; // 健康时不是优先事项
  }

  isRelevant(agent: GOAPAgent, state: WorldState): boolean {
    const health = state.get("health") as number || 100;
    return health < 50 && state.get("inCover") === false;
  }

  isSatisfied(state: WorldState): boolean {
    return state.get("inCover") === true;
  }
}

// 使用示例
const combatAgent = new GOAPAgent();

// 添加动作
combatAgent.addAction(new GetWeaponAction());
combatAgent.addAction(new ShootEnemyAction());
combatAgent.addAction(new TakeCoverAction());
combatAgent.addAction(new ReloadWeaponAction());
combatAgent.addAction(new MeleeAttackAction());

// 添加目标
combatAgent.addGoal(new KillEnemyGoal());
combatAgent.addGoal(new StayAliveGoal());

// 初始世界状态
combatAgent.setWorldState("hasWeapon", false);
combatAgent.setWorldState("hasAmmo", true);
combatAgent.setWorldState("weaponLoaded", false);
combatAgent.setWorldState("enemyVisible", true);
combatAgent.setWorldState("enemyDead", false);
combatAgent.setWorldState("inCover", false);
combatAgent.setWorldState("health", 100);
combatAgent.setWorldState("nearWeaponCache", true);

// 游戏循环
function gameLoop() {
  combatAgent.update();
  requestAnimationFrame(gameLoop);
}
```

### Unity C# 实现

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

// 世界状态作为字典
public class WorldState : Dictionary<string, object>
{
    public WorldState Clone()
    {
        var clone = new WorldState();
        foreach (var kvp in this)
            clone[kvp.Key] = kvp.Value;
        return clone;
    }

    public bool Matches(WorldState conditions)
    {
        foreach (var kvp in conditions)
        {
            if (!ContainsKey(kvp.Key) || !this[kvp.Key].Equals(kvp.Value))
                return false;
        }
        return true;
    }
}

// 基础动作类
public abstract class GOAPAction : MonoBehaviour
{
    public string actionName;
    public float baseCost = 1f;

    [SerializeField] protected WorldState preconditions = new WorldState();
    [SerializeField] protected WorldState effects = new WorldState();

    protected bool isRunning;
    protected GOAPAgent agent;

    public virtual void Initialize(GOAPAgent agent)
    {
        this.agent = agent;
    }

    public WorldState GetPreconditions() => preconditions;
    public WorldState GetEffects() => effects;

    // 重写以进行程序性检查
    public virtual bool IsProcedurallyValid(WorldState state) => true;

    // 重写以计算动态成本
    public virtual float GetCost(WorldState state) => baseCost;

    // 动作生命周期
    public abstract bool Perform();
    public virtual void OnEnter() { isRunning = true; }
    public virtual void OnExit() { isRunning = false; }
    public virtual void OnAbort() { isRunning = false; }
    public virtual bool IsComplete() => !isRunning;
}

// 基础目标类
public abstract class GOAPGoal : MonoBehaviour
{
    public string goalName;
    public float basePriority = 1f;

    [SerializeField] protected WorldState targetState = new WorldState();

    protected GOAPAgent agent;

    public virtual void Initialize(GOAPAgent agent)
    {
        this.agent = agent;
    }

    public WorldState GetTargetState() => targetState;

    public virtual float GetPriority(WorldState state) => basePriority;
    public virtual bool IsRelevant(WorldState state) => true;
    public virtual bool IsSatisfied(WorldState state) => state.Matches(targetState);
}

// A* 的规划器节点
public class PlannerNode : IComparable<PlannerNode>
{
    public WorldState State;
    public GOAPAction Action;
    public PlannerNode Parent;
    public float GCost;
    public float HCost;
    public float FCost => GCost + HCost;

    public int CompareTo(PlannerNode other)
    {
        return FCost.CompareTo(other.FCost);
    }
}

// GOAP 规划器
public class GOAPPlanner
{
    private const int MaxIterations = 1000;

    public List<GOAPAction> Plan(
        GOAPAgent agent,
        List<GOAPAction> availableActions,
        WorldState currentState,
        GOAPGoal goal)
    {
        var validActions = availableActions
            .Where(a => a.IsProcedurallyValid(currentState))
            .ToList();

        var openList = new List<PlannerNode>();
        var closedSet = new HashSet<string>();

        var startNode = new PlannerNode
        {
            State = currentState.Clone(),
            Action = null,
            Parent = null,
            GCost = 0,
            HCost = CalculateHeuristic(currentState, goal.GetTargetState())
        };

        openList.Add(startNode);
        int iterations = 0;

        while (openList.Count > 0 && iterations < MaxIterations)
        {
            iterations++;

            openList.Sort();
            var current = openList[0];
            openList.RemoveAt(0);

            if (current.State.Matches(goal.GetTargetState()))
                return ReconstructPlan(current);

            var stateKey = StateToString(current.State);
            if (closedSet.Contains(stateKey))
                continue;
            closedSet.Add(stateKey);

            foreach (var action in validActions)
            {
                if (!current.State.Matches(action.GetPreconditions()))
                    continue;

                var newState = ApplyEffects(current.State, action);
                var newKey = StateToString(newState);

                if (closedSet.Contains(newKey))
                    continue;

                var node = new PlannerNode
                {
                    State = newState,
                    Action = action,
                    Parent = current,
                    GCost = current.GCost + action.GetCost(current.State),
                    HCost = CalculateHeuristic(newState, goal.GetTargetState())
                };

                openList.Add(node);
            }
        }

        return null; // 未找到计划
    }

    private float CalculateHeuristic(WorldState current, WorldState target)
    {
        int unsatisfied = 0;
        foreach (var kvp in target)
        {
            if (!current.ContainsKey(kvp.Key) || !current[kvp.Key].Equals(kvp.Value))
                unsatisfied++;
        }
        return unsatisfied;
    }

    private WorldState ApplyEffects(WorldState state, GOAPAction action)
    {
        var newState = state.Clone();
        foreach (var kvp in action.GetEffects())
            newState[kvp.Key] = kvp.Value;
        return newState;
    }

    private string StateToString(WorldState state)
    {
        var sorted = state.OrderBy(x => x.Key);
        return string.Join(",", sorted.Select(x => $"{x.Key}:{x.Value}"));
    }

    private List<GOAPAction> ReconstructPlan(PlannerNode node)
    {
        var plan = new List<GOAPAction>();
        var current = node;

        while (current != null)
        {
            if (current.Action != null)
                plan.Insert(0, current.Action);
            current = current.Parent;
        }

        return plan;
    }
}

// GOAP 代理
public class GOAPAgent : MonoBehaviour
{
    [SerializeField] private List<GOAPAction> actions = new List<GOAPAction>();
    [SerializeField] private List<GOAPGoal> goals = new List<GOAPGoal>();

    private GOAPPlanner planner = new GOAPPlanner();
    private WorldState worldState = new WorldState();
    private List<GOAPAction> currentPlan = new List<GOAPAction>();
    private int currentActionIndex;
    private GOAPGoal currentGoal;

    private void Start()
    {
        // 初始化所有动作和目标
        foreach (var action in actions)
            action.Initialize(this);
        foreach (var goal in goals)
            goal.Initialize(this);
    }

    private void Update()
    {
        UpdateWorldState();

        if (NeedsNewPlan())
            CreateNewPlan();

        ExecutePlan();
    }

    protected virtual void UpdateWorldState()
    {
        // 重写以从传感器/游戏世界更新
    }

    public void SetState(string key, object value)
    {
        worldState[key] = value;
    }

    public T GetState<T>(string key, T defaultValue = default)
    {
        if (worldState.TryGetValue(key, out var value))
            return (T)value;
        return defaultValue;
    }

    private bool NeedsNewPlan()
    {
        if (currentPlan == null || currentPlan.Count == 0)
            return true;

        if (currentActionIndex >= currentPlan.Count)
            return true;

        var action = currentPlan[currentActionIndex];
        if (!action.IsProcedurallyValid(worldState))
            return true;

        // 检查更高优先级的目标
        var bestGoal = SelectBestGoal();
        if (bestGoal != null && bestGoal != currentGoal)
        {
            var newPriority = bestGoal.GetPriority(worldState);
            var currentPriority = currentGoal?.GetPriority(worldState) ?? 0;

            if (newPriority > currentPriority * 1.2f) // 20% 阈值
                return true;
        }

        return false;
    }

    private void CreateNewPlan()
    {
        // 中止当前动作
        if (currentPlan != null && currentActionIndex < currentPlan.Count)
            currentPlan[currentActionIndex].OnAbort();

        currentGoal = SelectBestGoal();
        if (currentGoal == null)
        {
            currentPlan = new List<GOAPAction>();
            return;
        }

        currentPlan = planner.Plan(this, actions, worldState, currentGoal);
        currentActionIndex = 0;

        if (currentPlan != null)
        {
            Debug.Log($"[GOAP] 为 {currentGoal.goalName} 创建新计划: " +
                string.Join(" -> ", currentPlan.Select(a => a.actionName)));
        }
        else
        {
            Debug.Log($"[GOAP] 无法为 {currentGoal.goalName} 创建计划");
            currentPlan = new List<GOAPAction>();
        }
    }

    private GOAPGoal SelectBestGoal()
    {
        GOAPGoal best = null;
        float bestPriority = float.MinValue;

        foreach (var goal in goals)
        {
            if (!goal.IsRelevant(worldState))
                continue;
            if (goal.IsSatisfied(worldState))
                continue;

            var priority = goal.GetPriority(worldState);
            if (priority > bestPriority)
            {
                bestPriority = priority;
                best = goal;
            }
        }

        return best;
    }

    private void ExecutePlan()
    {
        if (currentPlan == null || currentActionIndex >= currentPlan.Count)
            return;

        var action = currentPlan[currentActionIndex];

        // 检查前置条件是否仍然满足
        if (!worldState.Matches(action.GetPreconditions()))
        {
            action.OnAbort();
            currentPlan = new List<GOAPAction>();
            return;
        }

        // 执行动作
        if (!action.isRunning)
            action.OnEnter();

        bool success = action.Perform();

        if (action.IsComplete())
        {
            action.OnExit();

            // 应用效果
            foreach (var kvp in action.GetEffects())
                worldState[kvp.Key] = kvp.Value;

            currentActionIndex++;
        }
        else if (!success)
        {
            action.OnAbort();
            currentPlan = new List<GOAPAction>();
        }
    }
}
```

---

## 最佳实践

### 1. 原子化设计动作

每个动作应代表一个清晰、不可分割的操作：

```typescript
// 好的做法：原子动作
class ReloadWeaponAction { /* 单一职责 */ }
class AimAtEnemyAction { /* 单一职责 */ }
class FireWeaponAction { /* 单一职责 */ }

// 不好的做法：组合动作
class ReloadAimAndFireAction { /* 做了太多事情 */ }
```

### 2. 使用程序性前置条件

将静态前置条件与运行时检查分开：

```typescript
class ShootAction implements GOAPAction {
  // 用于规划的静态前置条件
  preconditions = new Map([
    ["hasWeapon", true],
    ["weaponLoaded", true]
  ]);

  // 运行时检查
  isProcedurallyValid(agent: GOAPAgent, state: WorldState): boolean {
    // 检查视线（不容易用世界状态表示）
    return agent.hasLineOfSightToEnemy();
  }
}
```

### 3. 仔细平衡动作成本

成本应反映现实世界的权衡：

```typescript
getCost(agent: GOAPAgent, state: WorldState): number {
  let cost = this.baseCost;

  // 考虑距离因素
  const target = agent.getCurrentTarget();
  if (target) {
    cost += agent.position.distanceTo(target.position) / 10;
  }

  // 考虑危险因素
  if (state.get("isExposed")) {
    cost *= 1.5;
  }

  // 考虑资源稀缺性
  const ammo = state.get("ammoCount") as number;
  if (ammo < 5) {
    cost *= 2;
  }

  return cost;
}
```

### 4. 实现计划缓存

缓存并重用有效计划：

```typescript
class CachingGOAPPlanner extends GOAPPlanner {
  private planCache: Map<string, GOAPAction[]> = new Map();
  private cacheTimeout = 1000; // 毫秒

  plan(agent: GOAPAgent, actions: GOAPAction[],
       state: WorldState, goal: GOAPGoal): GOAPAction[] | null {

    const cacheKey = this.createCacheKey(state, goal);
    const cached = this.planCache.get(cacheKey);

    if (cached && this.isPlanStillValid(cached, state)) {
      return cached;
    }

    const plan = super.plan(agent, actions, state, goal);

    if (plan) {
      this.planCache.set(cacheKey, plan);
    }

    return plan;
  }
}
```

### 5. 提供后备行为

规划失败时始终有后备方案：

```typescript
private createNewPlan(): void {
  const plan = this.planner.plan(/*...*/);

  if (plan) {
    this.currentPlan = plan;
  } else {
    // 回退到空闲或简单行为
    this.executeFallbackBehavior();
  }
}

private executeFallbackBehavior(): void {
  // 无计划时的简单反应行为
  if (this.worldState.get("enemyVisible")) {
    this.agent.lookAt(this.enemy.position);
  } else {
    this.agent.wander();
  }
}
```

---

## 常见陷阱

### 1. 无限规划循环

**问题**：动作创建循环依赖。

```typescript
// 错误：循环依赖
ActionA: effects: {hasItem: true}, preconditions: {hasOtherItem: true}
ActionB: effects: {hasOtherItem: true}, preconditions: {hasItem: true}
```

**解决方案**：确保至少有一个动作可以从初始状态启动链条。

### 2. 状态爆炸

**问题**：过多的世界状态变量导致规划复杂度指数增长。

```typescript
// 错误：过于细粒度
worldState = {
  enemy1Health: 50,
  enemy2Health: 75,
  enemy3Health: 100,
  // ... 还有50多个变量
};

// 正确：抽象状态
worldState = {
  nearestEnemyWeak: true,
  enemiesNearby: 3,
  threatLevel: 'medium'
};
```

### 3. 忽略动作中断

**问题**：长时间运行的动作无法正确中断。

```typescript
// 错误：无中断处理
async execute(agent: GOAPAgent): Promise<boolean> {
  await this.veryLongAnimation(); // 无法中断
  return true;
}

// 正确：可中断
async execute(agent: GOAPAgent): Promise<boolean> {
  if (this.shouldAbort) {
    return false;
  }

  // 分小步处理
  this.progress += this.deltaTime;
  return true;
}

abort(agent: GOAPAgent): void {
  this.shouldAbort = true;
  this.cancelAnimation();
}
```

### 4. 不验证计划

**问题**：计划已失效但代理仍继续执行。

```typescript
// 错误：执行期间无验证
private executePlan(): void {
  const action = this.currentPlan[this.currentActionIndex];
  action.execute(this); // 可能静默失败
}

// 正确：持续验证
private executePlan(): void {
  const action = this.currentPlan[this.currentActionIndex];

  // 验证前置条件是否仍然成立
  if (!this.actionPreconditionsMet(action)) {
    this.replan();
    return;
  }

  // 验证动作是否仍然可行
  if (!action.isProcedurallyValid(this, this.worldState)) {
    this.replan();
    return;
  }

  action.execute(this);
}
```

### 5. 过度贪婪的目标选择

**问题**：代理不断切换目标，从不完成任何目标。

```typescript
// 错误：总是追逐最高优先级
private selectGoal(): GOAPGoal {
  return this.goals.sort((a, b) =>
    b.getPriority(this.worldState) - a.getPriority(this.worldState)
  )[0];
}

// 正确：添加滞后/承诺
private selectGoal(): GOAPGoal {
  const best = this.goals.filter(g => g.isRelevant(this.worldState))
    .sort((a, b) => b.getPriority(this.worldState) - a.getPriority(this.worldState))[0];

  if (this.currentGoal && this.currentGoal.isRelevant(this.worldState)) {
    const currentPriority = this.currentGoal.getPriority(this.worldState);
    const bestPriority = best.getPriority(this.worldState);

    // 仅在显著更好时切换（20% 阈值）
    if (bestPriority <= currentPriority * 1.2) {
      return this.currentGoal;
    }
  }

  return best;
}
```

---

## 性能考虑

### 1. 规划预算

限制每帧的规划时间：

```typescript
class BudgetedGOAPPlanner extends GOAPPlanner {
  private maxPlanTimeMs = 2; // 每帧最多 2ms
  private planStartTime: number;
  private partialPlan: PlannerNode[] = [];

  plan(/*...*/): GOAPAction[] | null {
    this.planStartTime = performance.now();

    while (this.openList.length > 0) {
      if (performance.now() - this.planStartTime > this.maxPlanTimeMs) {
        // 保存状态并在下一帧继续
        this.savePartialProgress();
        return null; // 表示未完成
      }

      // 继续规划...
    }
  }
}
```

### 2. 层次化 GOAP

将复杂目标分解为子目标：

```typescript
// 高级目标
class WinBattleGoal extends GOAPGoal {
  decompose(): GOAPGoal[] {
    return [
      new EliminateThreatsGoal(),
      new SecureObjectiveGoal(),
      new ExtractGoal()
    ];
  }
}

// 规划器首先处理高级目标，
// 然后为子目标制定计划
```

### 3. 动作池化

预计算动作有效性：

```typescript
class OptimizedGOAPAgent {
  private validActionsCache: GOAPAction[] = [];
  private lastCacheUpdate = 0;
  private cacheInterval = 100; // 毫秒

  private getValidActions(): GOAPAction[] {
    const now = Date.now();

    if (now - this.lastCacheUpdate > this.cacheInterval) {
      this.validActionsCache = this.actions.filter(a =>
        a.isProcedurallyValid(this, this.worldState)
      );
      this.lastCacheUpdate = now;
    }

    return this.validActionsCache;
  }
}
```

### 4. 状态比较优化

使用位掩码进行更快的状态比较：

```typescript
class BitmaskedWorldState {
  private booleanState: number = 0;
  private numericState: Map<string, number> = new Map();

  // 预定义位位置
  static readonly HAS_WEAPON = 1 << 0;
  static readonly WEAPON_LOADED = 1 << 1;
  static readonly ENEMY_VISIBLE = 1 << 2;
  static readonly IN_COVER = 1 << 3;

  setBool(flag: number, value: boolean): void {
    if (value) {
      this.booleanState |= flag;
    } else {
      this.booleanState &= ~flag;
    }
  }

  matches(required: number): boolean {
    return (this.booleanState & required) === required;
  }
}
```

---

## 实际场景

### 场景 1：潜行游戏 AI

```typescript
// 潜行 AI 的动作
const stealthActions = [
  new HideInShadowsAction(),
  new DistractGuardAction(),
  new PickLockAction(),
  new KnockOutGuardAction(),
  new StealItemAction(),
  new EscapeAction()
];

// 目标
const stealthGoals = [
  new StealTargetGoal(),      // 主要目标
  new RemainUndetectedGoal(), // 被发现时高优先级
  new EscapeIfCaughtGoal()    // 紧急后备
];

// 世界状态包括：
// - isDetected, alertLevel, hasDisguise
// - guardsNearby, targetInSight, exitAccessible
// - hasTools, noiseMade
```

### 场景 2：RTS 单位 AI

```typescript
class RTSUnitAgent extends GOAPAgent {
  // 动作
  addAction(new GatherResourceAction());
  addAction(new BuildStructureAction());
  addAction(new AttackEnemyAction());
  addAction(new RepairBuildingAction());
  addAction(new ScoutAreaAction());

  // 根据游戏状态动态调整优先级的目标
  addGoal(new GatherResourcesGoal());     // 资源不足时
  addGoal(new DefendBaseGoal());          // 遭受攻击时
  addGoal(new ExpandTerritoryGoal());     // 稳定时
  addGoal(new DestroyEnemyBaseGoal());    // 足够强大时
}
```

### 场景 3：RPG 伙伴 AI

```typescript
class CompanionAgent extends GOAPAgent {
  // 动作
  addAction(new HealPlayerAction());
  addAction(new BuffPartyAction());
  addAction(new AttackEnemyAction());
  addAction(new ReviveAllyAction());
  addAction(new UseItemAction());
  addAction(new FollowPlayerAction());

  // 目标
  addGoal(new KeepPlayerAliveGoal());   // 最高优先级
  addGoal(new SupportInCombatGoal());
  addGoal(new StayNearPlayerGoal());
  addGoal(new ConserveResourcesGoal()); // 非战斗时
}
```

---

## 面试要点

### 概念性问题

**问：GOAP 与行为树有什么不同？**

答：GOAP 使用运行时规划来动态构建动作序列，而行为树使用预定义的层次结构。GOAP 代理"自己找出"如何实现目标；行为树代理遵循脚本化的决策树。

**问：何时应选择 GOAP 而非 FSM/BT？**

答：选择 GOAP 的情况：
- 代理需要灵活的问题解决能力
- 有许多可能的动作和复杂的交互
- 设计师想定义"做什么"而非"怎么做"
- 需要涌现行为

避免 GOAP 的情况：
- 行为简单且可预测
- 设计师控制至关重要
- 性能极度受限
- 调试透明度很关键

**问：GOAP 如何处理计划失败？**

答：GOAP 系统通常：
1. 检测前置条件不再成立
2. 干净地中止当前动作
3. 从新的世界状态重新规划
4. 如果规划失败则回退到简单行为

### 技术性问题

**问：GOAP 通常使用什么搜索算法？**

答：GOAP 使用 A* 搜索：
- 状态作为节点
- 动作作为边
- 动作成本作为边权重
- 未满足的目标条件作为启发式

**问：如何防止 GOAP 计算成本过高？**

答：优化策略包括：
- 规划预算（时间切片）
- 计划缓存和重用
- 层次化规划（HTN-GOAP 混合）
- 动作有效性预过滤
- 位掩码状态比较

**问：解释程序性前置条件与静态前置条件的区别。**

答：
- **静态前置条件**：规划器使用的世界状态条件（例如 `hasWeapon: true`）
- **程序性前置条件**：无法轻易用世界状态表示的运行时检查（例如视线检查、寻路有效性）

规划器使用静态前置条件；程序性前置条件在规划前过滤可用动作。

---

## 延伸阅读

### 书籍
- **《AI for Games》作者 Ian Millington** - 全面覆盖游戏 AI，包括 GOAP
- **《Artificial Intelligence: A Modern Approach》作者 Russell & Norvig** - 规划基础
- **《Programming Game AI by Example》作者 Mat Buckland** - 实际实现

### 论文
- **《Applying Goal-Oriented Action Planning to Games》作者 Jeff Orkin** - 原始 GOAP 论文
- **《Three States and a Plan: The A.I. of F.E.A.R.》** - 关于 F.E.A.R. AI 的 GDC 演讲

### 在线资源
- [GDC Vault: GOAP 演讲](https://www.gdcvault.com/search.php#&category=free&firstfocus=&keyword=goap)
- [AI Game Dev: GOAP 教程](https://www.gameaipro.com/)
- [Game AI Pro 规划系统文章](https://www.gameaipro.com/)

### 开源实现
- **ReGoap**（Unity）：[github.com/luxkun/ReGoap](https://github.com/luxkun/ReGoap)
- **GPGOAP**（C++）：通用 GOAP 库
- **Fluid HTN**（Unity）：混合 HTN/GOAP 系统
