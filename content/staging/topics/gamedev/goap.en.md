---
title: Goal-Oriented Action Planning (GOAP)
description: Master GOAP for intelligent game AI that plans sequences of actions to achieve complex goals dynamically
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - GOAP
  - game AI
  - planning
  - decision making
  - action planning
status: imported
origin: old/src/content/docs/gamedev/goap.en.md
divergence: 0.217
issues: []
legacy:
  category: GameDev
  subcategory: AI
  order: 15
  lastUpdated: 2026-01-21
---

## Concept Explanation

**Goal-Oriented Action Planning (GOAP)** is an AI architecture that enables game agents to dynamically construct sequences of actions to achieve specified goals. Unlike Finite State Machines (FSM) or Behavior Trees where transitions are explicitly defined, GOAP agents reason about their available actions and automatically plan the best path to satisfy their current goal.

Originally developed by Jeff Orkin for the game F.E.A.R. (2005), GOAP has since been adopted in numerous AAA titles including Tomb Raider, Deus Ex: Human Revolution, and Shadow of Mordor.

### GOAP vs Traditional AI Systems

```
Traditional FSM:                    GOAP:
┌─────────────────────────┐        ┌─────────────────────────┐
│  State A ──▶ State B    │        │  Goal: Kill Enemy       │
│     │          │        │        │         │               │
│     ▼          ▼        │        │    ┌────┴────┐          │
│  State C ──▶ State D    │        │    │ Planner │          │
│                         │        │    └────┬────┘          │
│  Fixed transitions      │        │         │               │
│  Designer defines all   │        │  [GetWeapon]──▶[Aim]──▶[Shoot]
│  possible paths         │        │                         │
│                         │        │  Dynamic action chains  │
│                         │        │  Agent finds solutions  │
└─────────────────────────┘        └─────────────────────────┘
```

**Key Differences:**

| Aspect | FSM/Behavior Tree | GOAP |
|--------|-------------------|------|
| Planning | Pre-defined by designer | Runtime by agent |
| Flexibility | Limited to defined transitions | Emergent behavior |
| Scalability | Exponential complexity | Linear action addition |
| Debugging | Easy to trace | Requires plan visualization |
| Designer Control | Direct | Indirect (via costs/effects) |

---

## Core Principles

### The GOAP Architecture

GOAP systems consist of four fundamental components:

```
┌─────────────────────────────────────────────────────────────────┐
│                         GOAP Agent                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │    GOALS     │    │   ACTIONS    │    │ WORLD STATE  │      │
│  │              │    │              │    │              │      │
│  │ - Kill Enemy │    │ - GetWeapon  │    │ - hasWeapon  │      │
│  │ - Stay Alive │    │ - Reload     │    │ - hasAmmo    │      │
│  │ - Find Cover │    │ - Shoot      │    │ - enemyDead  │      │
│  │              │    │ - TakeCover  │    │ - inCover    │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│         └───────────────────┼───────────────────┘               │
│                             │                                   │
│                      ┌──────▼───────┐                           │
│                      │   PLANNER    │                           │
│                      │              │                           │
│                      │  A* Search   │                           │
│                      │  + Heuristic │                           │
│                      └──────┬───────┘                           │
│                             │                                   │
│                      ┌──────▼───────┐                           │
│                      │  ACTION PLAN │                           │
│                      │              │                           │
│                      │ [A]─▶[B]─▶[C]│                           │
│                      └──────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1. World State

The world state is a collection of boolean or numeric properties that describe the current situation:

```typescript
interface WorldState {
  [key: string]: boolean | number;
}

// Example world state
const worldState: WorldState = {
  hasWeapon: false,
  hasAmmo: true,
  weaponLoaded: false,
  enemyVisible: true,
  enemyDead: false,
  inCover: false,
  health: 75,
  nearWeaponCache: true
};
```

### 2. Goals

Goals define desired world states that the agent wants to achieve:

```typescript
interface Goal {
  name: string;
  priority: number;
  desiredState: Partial<WorldState>;
  isValid(currentState: WorldState): boolean;
}

// Example goal
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

### 3. Actions

Actions are the building blocks that transform world state. Each action has:
- **Preconditions**: World state requirements to perform the action
- **Effects**: How the action changes world state
- **Cost**: Resource expenditure for planning optimization

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

### 4. The Planner

The planner uses search algorithms (typically A*) to find the optimal sequence of actions that transforms the current world state into the goal state.

---

## Key Concepts

### Action Graph and Planning

GOAP planning works by treating actions as graph edges connecting world states:

```
Current State          Actions              Goal State
    │                                           │
    │  hasWeapon: false                         │  enemyDead: true
    │  hasAmmo: true     ┌──────────────┐       │
    │  enemyDead: false  │  GetWeapon   │       │
    │                    │  cost: 2     │       │
    └───────────────────▶│  pre: nearCache      │
                         │  eff: hasWeapon      │
                         └────────┬─────┘       │
                                  │             │
                         ┌────────▼─────┐       │
                         │  LoadWeapon  │       │
                         │  cost: 1     │       │
                         │  pre: hasWeapon,     │
                         │       hasAmmo │      │
                         │  eff: weaponLoaded   │
                         └────────┬─────┘       │
                                  │             │
                         ┌────────▼─────┐       │
                         │    Shoot     │       │
                         │  cost: 1     │───────▶
                         │  pre: weaponLoaded,  │
                         │       enemyVisible   │
                         │  eff: enemyDead      │
                         └──────────────┘

Total Plan Cost: 4
```

### Backward Planning (Regressive Search)

GOAP typically uses **backward planning** - starting from the goal and working back to find actions that can achieve the required preconditions:

```
Goal: enemyDead = true
  │
  │ What action produces this effect?
  ▼
Action: Shoot (effect: enemyDead)
  │ Preconditions: weaponLoaded, enemyVisible
  │
  │ enemyVisible = true (already satisfied)
  │ weaponLoaded = false (need to satisfy)
  ▼
Action: LoadWeapon (effect: weaponLoaded)
  │ Preconditions: hasWeapon, hasAmmo
  │
  │ hasAmmo = true (already satisfied)
  │ hasWeapon = false (need to satisfy)
  ▼
Action: GetWeapon (effect: hasWeapon)
  │ Preconditions: nearWeaponCache
  │
  │ nearWeaponCache = true (already satisfied)
  ▼
All preconditions satisfied!

Plan: [GetWeapon] → [LoadWeapon] → [Shoot]
```

### Cost-Based Optimization

Multiple valid plans may exist. GOAP uses costs to select the optimal one:

```
Plan A: GetWeapon → LoadWeapon → Shoot
        Cost: 2 + 1 + 1 = 4

Plan B: FindCover → GetWeapon → LoadWeapon → Shoot
        Cost: 3 + 2 + 1 + 1 = 7

Plan C: MeleeAttack (if close enough)
        Cost: 2

Planner selects: Plan C (lowest cost, if valid)
         or: Plan A (if melee not available)
```

---

## Code Examples

### Complete GOAP Implementation

```typescript
// World State representation
type WorldState = Map<string, boolean | number>;

// Action definition
interface GOAPAction {
  name: string;
  baseCost: number;
  preconditions: Map<string, boolean | number>;
  effects: Map<string, boolean | number>;

  // Runtime validation beyond preconditions
  isProcedurallyValid(agent: GOAPAgent, state: WorldState): boolean;

  // Dynamic cost calculation
  getCost(agent: GOAPAgent, state: WorldState): number;

  // Execution
  execute(agent: GOAPAgent): Promise<boolean>;

  // For long-running actions
  isComplete(agent: GOAPAgent): boolean;
  abort(agent: GOAPAgent): void;
}

// Goal definition
interface GOAPGoal {
  name: string;
  basePriority: number;
  targetState: Map<string, boolean | number>;

  // Dynamic priority calculation
  getPriority(agent: GOAPAgent, state: WorldState): number;

  // Check if goal should be considered
  isRelevant(agent: GOAPAgent, state: WorldState): boolean;

  // Check if goal is satisfied
  isSatisfied(state: WorldState): boolean;
}

// Planning node for A* search
class PlannerNode {
  state: WorldState;
  action: GOAPAction | null;
  parent: PlannerNode | null;
  gCost: number; // Cost from start
  hCost: number; // Heuristic to goal

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

// The GOAP Planner
class GOAPPlanner {
  private maxIterations: number = 1000;

  plan(
    agent: GOAPAgent,
    availableActions: GOAPAction[],
    currentState: WorldState,
    goal: GOAPGoal
  ): GOAPAction[] | null {

    // Filter to valid actions only
    const validActions = availableActions.filter(action =>
      action.isProcedurallyValid(agent, currentState)
    );

    // A* search setup
    const openList: PlannerNode[] = [];
    const closedList: Set<string> = new Set();

    // Start node
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

      // Get node with lowest fCost
      openList.sort((a, b) => a.fCost - b.fCost);
      const currentNode = openList.shift()!;

      // Check if goal reached
      if (this.stateMatchesGoal(currentNode.state, goal.targetState)) {
        return this.reconstructPlan(currentNode);
      }

      // Add to closed list
      const stateKey = this.stateToString(currentNode.state);
      if (closedList.has(stateKey)) continue;
      closedList.add(stateKey);

      // Explore actions
      for (const action of validActions) {
        if (!this.actionPreconditionsMet(action, currentNode.state)) {
          continue;
        }

        // Apply action effects to create new state
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

    // No plan found
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

// The GOAP Agent
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
    // Update world state from sensors
    this.updateWorldState();

    // Check if we need a new plan
    if (this.needsNewPlan()) {
      this.createNewPlan();
    }

    // Execute current plan
    await this.executePlan();
  }

  private updateWorldState(): void {
    // Override in subclass to update from game world
    // Example: this.worldState.set('enemyVisible', this.canSeeEnemy());
  }

  private needsNewPlan(): boolean {
    // No current plan
    if (this.currentPlan.length === 0) return true;

    // Plan completed
    if (this.currentActionIndex >= this.currentPlan.length) return true;

    // Current action no longer valid
    const currentAction = this.currentPlan[this.currentActionIndex];
    if (!currentAction.isProcedurallyValid(this, this.worldState)) {
      return true;
    }

    // Higher priority goal available
    const currentGoal = this.selectBestGoal();
    if (currentGoal && this.hasHigherPriorityGoal(currentGoal)) {
      return true;
    }

    return false;
  }

  private hasHigherPriorityGoal(newGoal: GOAPGoal): boolean {
    // Compare with goal that created current plan
    // Implementation depends on tracking current goal
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
      console.log(`New plan created for goal "${goal.name}":`,
        plan.map(a => a.name).join(' -> ')
      );
    } else {
      console.log(`Failed to create plan for goal "${goal.name}"`);
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

    // Check if action can still be performed
    if (!this.actionPreconditionsMet(action)) {
      // Replan needed
      this.currentPlan = [];
      return;
    }

    // Execute or continue action
    if (action.isComplete(this)) {
      // Move to next action
      this.currentActionIndex++;

      // Apply effects to world state
      for (const [key, value] of action.effects) {
        this.worldState.set(key, value);
      }
    } else {
      // Continue executing
      const success = await action.execute(this);

      if (!success) {
        // Action failed, need to replan
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

### Practical Example: Combat AI

```typescript
// Concrete action implementations
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
    // Check if there's actually a weapon nearby
    return this.findNearestWeapon(agent) !== null;
  }

  getCost(agent: GOAPAgent, state: WorldState): number {
    const weapon = this.findNearestWeapon(agent);
    if (!weapon) return Infinity;

    // Cost based on distance
    const distance = agent.position.distanceTo(weapon.position);
    return this.baseCost + (distance / 10);
  }

  async execute(agent: GOAPAgent): Promise<boolean> {
    if (!this.isRunning) {
      this.targetPosition = this.findNearestWeapon(agent)?.position ?? null;
      if (!this.targetPosition) return false;
      this.isRunning = true;
    }

    // Move towards weapon
    agent.moveTo(this.targetPosition!);
    return true;
  }

  isComplete(agent: GOAPAgent): boolean {
    if (!this.targetPosition) return false;

    const distance = agent.position.distanceTo(this.targetPosition);
    if (distance < 1.0) {
      // Pick up weapon
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
    // Find nearest weapon in game world
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

    // Lower cost for easy shots
    const distance = agent.position.distanceTo(enemy.position);
    const accuracyModifier = distance > 15 ? 2 : 1;

    return this.baseCost * accuracyModifier;
  }

  async execute(agent: GOAPAgent): Promise<boolean> {
    const enemy = agent.getCurrentTarget();
    if (!enemy) return false;

    // Aim and shoot
    agent.aimAt(enemy.position);
    agent.fireWeapon();
    this.shotsRemaining--;

    return true;
  }

  isComplete(agent: GOAPAgent): boolean {
    const enemy = agent.getCurrentTarget();

    // Complete if enemy is dead or we've fired all shots
    if (!enemy || enemy.isDead || this.shotsRemaining <= 0) {
      this.shotsRemaining = 3; // Reset for next use
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

// Goal implementations
class KillEnemyGoal implements GOAPGoal {
  name = "KillEnemy";
  basePriority = 50;
  targetState = new Map<string, boolean | number>([
    ["enemyDead", true]
  ]);

  getPriority(agent: GOAPAgent, state: WorldState): number {
    // Higher priority when health is good
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

    // Priority increases as health decreases
    if (health < 30) return 150;
    if (health < 50) return 80;
    return 0; // Not a priority when healthy
  }

  isRelevant(agent: GOAPAgent, state: WorldState): boolean {
    const health = state.get("health") as number || 100;
    return health < 50 && state.get("inCover") === false;
  }

  isSatisfied(state: WorldState): boolean {
    return state.get("inCover") === true;
  }
}

// Usage
const combatAgent = new GOAPAgent();

// Add actions
combatAgent.addAction(new GetWeaponAction());
combatAgent.addAction(new ShootEnemyAction());
combatAgent.addAction(new TakeCoverAction());
combatAgent.addAction(new ReloadWeaponAction());
combatAgent.addAction(new MeleeAttackAction());

// Add goals
combatAgent.addGoal(new KillEnemyGoal());
combatAgent.addGoal(new StayAliveGoal());

// Initial world state
combatAgent.setWorldState("hasWeapon", false);
combatAgent.setWorldState("hasAmmo", true);
combatAgent.setWorldState("weaponLoaded", false);
combatAgent.setWorldState("enemyVisible", true);
combatAgent.setWorldState("enemyDead", false);
combatAgent.setWorldState("inCover", false);
combatAgent.setWorldState("health", 100);
combatAgent.setWorldState("nearWeaponCache", true);

// Game loop
function gameLoop() {
  combatAgent.update();
  requestAnimationFrame(gameLoop);
}
```

### Unity C# Implementation

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

// World State as Dictionary
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

// Base Action class
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

    // Override for procedural checks
    public virtual bool IsProcedurallyValid(WorldState state) => true;

    // Override for dynamic costs
    public virtual float GetCost(WorldState state) => baseCost;

    // Action lifecycle
    public abstract bool Perform();
    public virtual void OnEnter() { isRunning = true; }
    public virtual void OnExit() { isRunning = false; }
    public virtual void OnAbort() { isRunning = false; }
    public virtual bool IsComplete() => !isRunning;
}

// Base Goal class
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

// Planner Node for A*
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

// The GOAP Planner
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

        return null; // No plan found
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

// The GOAP Agent
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
        // Initialize all actions and goals
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
        // Override to update from sensors/game world
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

        // Check for higher priority goals
        var bestGoal = SelectBestGoal();
        if (bestGoal != null && bestGoal != currentGoal)
        {
            var newPriority = bestGoal.GetPriority(worldState);
            var currentPriority = currentGoal?.GetPriority(worldState) ?? 0;

            if (newPriority > currentPriority * 1.2f) // 20% threshold
                return true;
        }

        return false;
    }

    private void CreateNewPlan()
    {
        // Abort current action
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
            Debug.Log($"[GOAP] New plan for {currentGoal.goalName}: " +
                string.Join(" -> ", currentPlan.Select(a => a.actionName)));
        }
        else
        {
            Debug.Log($"[GOAP] Failed to plan for {currentGoal.goalName}");
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

        // Check preconditions still met
        if (!worldState.Matches(action.GetPreconditions()))
        {
            action.OnAbort();
            currentPlan = new List<GOAPAction>();
            return;
        }

        // Execute action
        if (!action.isRunning)
            action.OnEnter();

        bool success = action.Perform();

        if (action.IsComplete())
        {
            action.OnExit();

            // Apply effects
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

## Best Practices

### 1. Design Actions Atomically

Each action should represent one clear, indivisible operation:

```typescript
// Good: Atomic actions
class ReloadWeaponAction { /* Single responsibility */ }
class AimAtEnemyAction { /* Single responsibility */ }
class FireWeaponAction { /* Single responsibility */ }

// Bad: Combined actions
class ReloadAimAndFireAction { /* Does too much */ }
```

### 2. Use Procedural Preconditions

Separate static preconditions from runtime checks:

```typescript
class ShootAction implements GOAPAction {
  // Static preconditions for planning
  preconditions = new Map([
    ["hasWeapon", true],
    ["weaponLoaded", true]
  ]);

  // Runtime checks
  isProcedurallyValid(agent: GOAPAgent, state: WorldState): boolean {
    // Check line of sight (can't be represented in world state easily)
    return agent.hasLineOfSightToEnemy();
  }
}
```

### 3. Balance Action Costs Carefully

Costs should reflect real-world trade-offs:

```typescript
getCost(agent: GOAPAgent, state: WorldState): number {
  let cost = this.baseCost;

  // Factor in distance
  const target = agent.getCurrentTarget();
  if (target) {
    cost += agent.position.distanceTo(target.position) / 10;
  }

  // Factor in danger
  if (state.get("isExposed")) {
    cost *= 1.5;
  }

  // Factor in resource scarcity
  const ammo = state.get("ammoCount") as number;
  if (ammo < 5) {
    cost *= 2;
  }

  return cost;
}
```

### 4. Implement Plan Caching

Cache and reuse valid plans:

```typescript
class CachingGOAPPlanner extends GOAPPlanner {
  private planCache: Map<string, GOAPAction[]> = new Map();
  private cacheTimeout = 1000; // ms

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

### 5. Provide Fallback Behaviors

Always have a fallback when planning fails:

```typescript
private createNewPlan(): void {
  const plan = this.planner.plan(/*...*/);

  if (plan) {
    this.currentPlan = plan;
  } else {
    // Fallback to idle or simple behavior
    this.executeFallbackBehavior();
  }
}

private executeFallbackBehavior(): void {
  // Simple reactive behavior when no plan exists
  if (this.worldState.get("enemyVisible")) {
    this.agent.lookAt(this.enemy.position);
  } else {
    this.agent.wander();
  }
}
```

---

## Common Pitfalls

### 1. Infinite Planning Loops

**Problem**: Actions create circular dependencies.

```typescript
// Bad: Circular dependency
ActionA: effects: {hasItem: true}, preconditions: {hasOtherItem: true}
ActionB: effects: {hasOtherItem: true}, preconditions: {hasItem: true}
```

**Solution**: Ensure at least one action can bootstrap the chain from initial state.

### 2. State Explosion

**Problem**: Too many world state variables cause exponential planning complexity.

```typescript
// Bad: Too granular
worldState = {
  enemy1Health: 50,
  enemy2Health: 75,
  enemy3Health: 100,
  // ... 50 more variables
};

// Good: Abstracted states
worldState = {
  nearestEnemyWeak: true,
  enemiesNearby: 3,
  threatLevel: 'medium'
};
```

### 3. Ignoring Action Interruption

**Problem**: Long-running actions not properly interruptible.

```typescript
// Bad: No interruption handling
async execute(agent: GOAPAgent): Promise<boolean> {
  await this.veryLongAnimation(); // Can't be interrupted
  return true;
}

// Good: Interruptible
async execute(agent: GOAPAgent): Promise<boolean> {
  if (this.shouldAbort) {
    return false;
  }

  // Process in small steps
  this.progress += this.deltaTime;
  return true;
}

abort(agent: GOAPAgent): void {
  this.shouldAbort = true;
  this.cancelAnimation();
}
```

### 4. Not Validating Plans

**Problem**: Plans become invalid but agent continues executing.

```typescript
// Bad: No validation during execution
private executePlan(): void {
  const action = this.currentPlan[this.currentActionIndex];
  action.execute(this); // Might fail silently
}

// Good: Continuous validation
private executePlan(): void {
  const action = this.currentPlan[this.currentActionIndex];

  // Validate preconditions still hold
  if (!this.actionPreconditionsMet(action)) {
    this.replan();
    return;
  }

  // Validate action is still possible
  if (!action.isProcedurallyValid(this, this.worldState)) {
    this.replan();
    return;
  }

  action.execute(this);
}
```

### 5. Overly Greedy Goal Selection

**Problem**: Agent constantly switches goals, never completing any.

```typescript
// Bad: Always chase highest priority
private selectGoal(): GOAPGoal {
  return this.goals.sort((a, b) =>
    b.getPriority(this.worldState) - a.getPriority(this.worldState)
  )[0];
}

// Good: Add hysteresis/commitment
private selectGoal(): GOAPGoal {
  const best = this.goals.filter(g => g.isRelevant(this.worldState))
    .sort((a, b) => b.getPriority(this.worldState) - a.getPriority(this.worldState))[0];

  if (this.currentGoal && this.currentGoal.isRelevant(this.worldState)) {
    const currentPriority = this.currentGoal.getPriority(this.worldState);
    const bestPriority = best.getPriority(this.worldState);

    // Only switch if significantly better (20% threshold)
    if (bestPriority <= currentPriority * 1.2) {
      return this.currentGoal;
    }
  }

  return best;
}
```

---

## Performance Considerations

### 1. Planning Budget

Limit planning time per frame:

```typescript
class BudgetedGOAPPlanner extends GOAPPlanner {
  private maxPlanTimeMs = 2; // 2ms per frame max
  private planStartTime: number;
  private partialPlan: PlannerNode[] = [];

  plan(/*...*/): GOAPAction[] | null {
    this.planStartTime = performance.now();

    while (this.openList.length > 0) {
      if (performance.now() - this.planStartTime > this.maxPlanTimeMs) {
        // Save state and continue next frame
        this.savePartialProgress();
        return null; // Signal incomplete
      }

      // Continue planning...
    }
  }
}
```

### 2. Hierarchical GOAP

Break complex goals into sub-goals:

```typescript
// High-level goal
class WinBattleGoal extends GOAPGoal {
  decompose(): GOAPGoal[] {
    return [
      new EliminateThreatsGoal(),
      new SecureObjectiveGoal(),
      new ExtractGoal()
    ];
  }
}

// The planner handles high-level goals first,
// then plans for sub-goals
```

### 3. Action Pooling

Pre-compute action validity:

```typescript
class OptimizedGOAPAgent {
  private validActionsCache: GOAPAction[] = [];
  private lastCacheUpdate = 0;
  private cacheInterval = 100; // ms

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

### 4. State Comparison Optimization

Use bitmasks for faster state comparison:

```typescript
class BitmaskedWorldState {
  private booleanState: number = 0;
  private numericState: Map<string, number> = new Map();

  // Predefined bit positions
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

## Real-World Scenarios

### Scenario 1: Stealth Game AI

```typescript
// Actions for stealth AI
const stealthActions = [
  new HideInShadowsAction(),
  new DistractGuardAction(),
  new PickLockAction(),
  new KnockOutGuardAction(),
  new StealItemAction(),
  new EscapeAction()
];

// Goals
const stealthGoals = [
  new StealTargetGoal(),      // Primary objective
  new RemainUndetectedGoal(), // High priority when detected
  new EscapeIfCaughtGoal()    // Emergency fallback
];

// World state includes:
// - isDetected, alertLevel, hasDisguise
// - guardsNearby, targetInSight, exitAccessible
// - hasTools, noiseMade
```

### Scenario 2: RTS Unit AI

```typescript
class RTSUnitAgent extends GOAPAgent {
  // Actions
  addAction(new GatherResourceAction());
  addAction(new BuildStructureAction());
  addAction(new AttackEnemyAction());
  addAction(new RepairBuildingAction());
  addAction(new ScoutAreaAction());

  // Goals with dynamic priorities based on game state
  addGoal(new GatherResourcesGoal());     // When resources low
  addGoal(new DefendBaseGoal());          // When under attack
  addGoal(new ExpandTerritoryGoal());     // When stable
  addGoal(new DestroyEnemyBaseGoal());    // When strong enough
}
```

### Scenario 3: RPG Companion AI

```typescript
class CompanionAgent extends GOAPAgent {
  // Actions
  addAction(new HealPlayerAction());
  addAction(new BuffPartyAction());
  addAction(new AttackEnemyAction());
  addAction(new ReviveAllyAction());
  addAction(new UseItemAction());
  addAction(new FollowPlayerAction());

  // Goals
  addGoal(new KeepPlayerAliveGoal());   // Highest priority
  addGoal(new SupportInCombatGoal());
  addGoal(new StayNearPlayerGoal());
  addGoal(new ConserveResourcesGoal()); // When out of combat
}
```

---

## Interview Key Points

### Conceptual Questions

**Q: What makes GOAP different from Behavior Trees?**

A: GOAP uses runtime planning to dynamically construct action sequences, while Behavior Trees use pre-defined hierarchical structures. GOAP agents "figure out" how to achieve goals; BT agents follow scripted decision trees.

**Q: When should you choose GOAP over FSM/BT?**

A: Choose GOAP when:
- Agents need flexible problem-solving
- Many possible actions with complex interactions
- Designers want to define "what" not "how"
- Emergent behavior is desirable

Avoid GOAP when:
- Behaviors are simple and predictable
- Designer control is paramount
- Performance is extremely constrained
- Debugging transparency is critical

**Q: How does GOAP handle plan failure?**

A: GOAP systems typically:
1. Detect when preconditions no longer hold
2. Abort current action cleanly
3. Replan from the new world state
4. Fall back to simple behaviors if planning fails

### Technical Questions

**Q: What search algorithm does GOAP typically use?**

A: GOAP uses A* search with:
- States as nodes
- Actions as edges
- Action costs as edge weights
- Unsatisfied goal conditions as heuristic

**Q: How do you prevent GOAP from being too expensive?**

A: Optimization strategies include:
- Planning budgets (time slicing)
- Plan caching and reuse
- Hierarchical planning (HTN-GOAP hybrid)
- Action validity pre-filtering
- Bitmask state comparisons

**Q: Explain procedural preconditions vs static preconditions.**

A:
- **Static preconditions**: World state conditions used by the planner (e.g., `hasWeapon: true`)
- **Procedural preconditions**: Runtime checks that can't be easily represented in world state (e.g., line of sight checks, pathfinding validity)

The planner uses static preconditions; procedural preconditions filter available actions before planning.

---

## Further Reading

### Books
- **"AI for Games" by Ian Millington** - Comprehensive coverage of game AI including GOAP
- **"Artificial Intelligence: A Modern Approach" by Russell & Norvig** - Planning fundamentals
- **"Programming Game AI by Example" by Mat Buckland** - Practical implementations

### Papers
- **"Applying Goal-Oriented Action Planning to Games" by Jeff Orkin** - Original GOAP paper
- **"Three States and a Plan: The A.I. of F.E.A.R."** - GDC presentation on F.E.A.R. AI

### Online Resources
- [GDC Vault: GOAP Presentations](https://www.gdcvault.com/search.php#&category=free&firstfocus=&keyword=goap)
- [AI Game Dev: GOAP Tutorials](https://www.gameaipro.com/)
- [Game AI Pro articles on planning systems](https://www.gameaipro.com/)

### Open Source Implementations
- **ReGoap** (Unity): [github.com/luxkun/ReGoap](https://github.com/luxkun/ReGoap)
- **GPGOAP** (C++): General purpose GOAP library
- **Fluid HTN** (Unity): Hybrid HTN/GOAP system
