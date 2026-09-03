---
title: Finite State Machines and Behavior Trees
description: Master FSM and Behavior Trees for game AI state management and decision making
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - FSM
  - behavior tree
  - game AI
  - design patterns
status: imported
origin: old/src/content/docs/gamedev/fsm-behavior-tree.en.md
divergence: 0.352
issues:
  - divergent
legacy:
  category: GameDev
  subcategory: Architecture
  order: 3
  lastUpdated: 2026-01-07
---

## Introduction

Game AI is fundamentally about decision-making. Characters in games need to perceive their environment, evaluate options, and execute appropriate behaviors. Two of the most powerful and widely-used architectures for implementing game AI are **Finite State Machines (FSM)** and **Behavior Trees (BT)**.

We explore both systems in depth, covering their design principles, implementation patterns, and practical applications in game development.

### Why These Patterns Matter

1. **Predictable Behavior**: Both FSM and BT produce deterministic, debuggable AI behaviors
2. **Scalability**: They can handle simple to complex AI requirements
3. **Industry Standard**: Used in virtually every major game engine (Unity, Unreal, Godot)
4. **Designer-Friendly**: Both can be visualized and edited through graphical tools
5. **Performance**: Efficient execution suitable for real-time applications

---

## Part 1: Finite State Machines (FSM)

### What is a Finite State Machine?

A Finite State Machine is a computational model that can exist in exactly one of a finite number of states at any given time. The machine transitions between states in response to inputs or conditions, and each state defines specific behaviors.

```
                    ┌─────────────────────────────────────────┐
                    │                                          │
                    │    ┌──────────┐    see enemy    ┌──────────┐
                    │    │          │ ─────────────▶ │          │
        ┌───────────┼───▶│  PATROL  │                │  CHASE   │
        │           │    │          │ ◀───────────── │          │
        │           │    └──────────┘    lost enemy   └──────────┘
        │           │         │                            │
        │           │         │ health low                 │ in range
        │           │         ▼                            ▼
        │           │    ┌──────────┐    enemy dead   ┌──────────┐
        │           │    │          │ ◀───────────── │          │
        │           └────│   FLEE   │                │  ATTACK  │
        │                │          │                │          │
        │                └──────────┘                └──────────┘
        │                     │                            │
        │                     │ safe                       │ target dead
        └─────────────────────┴────────────────────────────┘
```

### Core FSM Principles

#### States

A state represents a distinct mode of behavior. Each state typically defines:

- **Entry actions**: What happens when entering the state
- **Update actions**: What happens while in the state (per frame)
- **Exit actions**: What happens when leaving the state

#### Transitions

Transitions define the conditions under which the machine moves from one state to another. A transition consists of:

- **Source state**: The current state
- **Target state**: The destination state
- **Condition**: The trigger that causes the transition
- **Actions**: Optional operations performed during the transition

#### Events

Events are signals that can trigger transitions. They can be:

- **External**: Player input, collision detection, timer expiration
- **Internal**: Health threshold reached, resource depleted

### Basic FSM Implementation

```typescript
// State interface definition
interface State {
  name: string;
  onEnter(): void;
  onUpdate(deltaTime: number): void;
  onExit(): void;
}

// Transition definition
interface Transition {
  targetState: string;
  condition: () => boolean;
  onTransition?: () => void;
}

// Core FSM class
class FiniteStateMachine {
  private states: Map<string, State> = new Map();
  private transitions: Map<string, Transition[]> = new Map();
  private currentState: State | null = null;
  private initialStateName: string = '';

  addState(state: State): this {
    this.states.set(state.name, state);
    if (!this.initialStateName) {
      this.initialStateName = state.name;
    }
    return this;
  }

  addTransition(
    fromState: string,
    toState: string,
    condition: () => boolean,
    onTransition?: () => void
  ): this {
    if (!this.transitions.has(fromState)) {
      this.transitions.set(fromState, []);
    }
    this.transitions.get(fromState)!.push({
      targetState: toState,
      condition,
      onTransition
    });
    return this;
  }

  setInitialState(stateName: string): this {
    this.initialStateName = stateName;
    return this;
  }

  start(): void {
    if (this.initialStateName) {
      this.transitionTo(this.initialStateName);
    }
  }

  update(deltaTime: number): void {
    if (!this.currentState) return;

    // Check for transitions
    const possibleTransitions = this.transitions.get(this.currentState.name);
    if (possibleTransitions) {
      for (const transition of possibleTransitions) {
        if (transition.condition()) {
          transition.onTransition?.();
          this.transitionTo(transition.targetState);
          return;
        }
      }
    }

    // Update current state
    this.currentState.onUpdate(deltaTime);
  }

  private transitionTo(stateName: string): void {
    const newState = this.states.get(stateName);
    if (!newState) {
      console.error(`State not found: ${stateName}`);
      return;
    }

    this.currentState?.onExit();
    this.currentState = newState;
    this.currentState.onEnter();
  }

  getCurrentStateName(): string {
    return this.currentState?.name ?? '';
  }
}
```

### Practical Example: Enemy AI

```typescript
// Game context shared between states
interface EnemyContext {
  enemy: Enemy;
  player: Player;
  patrolPoints: Vector2[];
  currentPatrolIndex: number;
  lastKnownPlayerPosition: Vector2 | null;
  alertTimer: number;
}

// Base state class with context access
abstract class EnemyState implements State {
  abstract name: string;
  protected context: EnemyContext;

  constructor(context: EnemyContext) {
    this.context = context;
  }

  abstract onEnter(): void;
  abstract onUpdate(deltaTime: number): void;
  abstract onExit(): void;
}

// Patrol State: Enemy moves between waypoints
class PatrolState extends EnemyState {
  name = 'patrol';
  private waitTimer: number = 0;
  private isWaiting: boolean = false;

  onEnter(): void {
    console.log('Entering patrol mode');
    this.context.enemy.setMoveSpeed(2.0);
    this.isWaiting = false;
  }

  onUpdate(deltaTime: number): void {
    const { enemy, patrolPoints, currentPatrolIndex } = this.context;

    if (this.isWaiting) {
      this.waitTimer -= deltaTime;
      if (this.waitTimer <= 0) {
        this.isWaiting = false;
        this.context.currentPatrolIndex =
          (currentPatrolIndex + 1) % patrolPoints.length;
      }
      return;
    }

    const targetPoint = patrolPoints[currentPatrolIndex];
    const distance = enemy.position.distanceTo(targetPoint);

    if (distance < 0.5) {
      // Reached patrol point, wait briefly
      this.isWaiting = true;
      this.waitTimer = 2.0;
      enemy.playAnimation('idle');
    } else {
      enemy.moveTo(targetPoint);
      enemy.playAnimation('walk');
    }
  }

  onExit(): void {
    console.log('Leaving patrol mode');
  }
}

// Alert State: Enemy heard something suspicious
class AlertState extends EnemyState {
  name = 'alert';
  private lookAroundTimer: number = 0;
  private lookDirection: number = 1;

  onEnter(): void {
    console.log('Alert! Investigating...');
    this.context.enemy.playAnimation('alert');
    this.context.alertTimer = 5.0;
    this.lookAroundTimer = 0;
  }

  onUpdate(deltaTime: number): void {
    const { enemy, lastKnownPlayerPosition } = this.context;

    this.context.alertTimer -= deltaTime;

    if (lastKnownPlayerPosition) {
      // Move toward last known position
      const distance = enemy.position.distanceTo(lastKnownPlayerPosition);
      if (distance > 1.0) {
        enemy.moveTo(lastKnownPlayerPosition);
      } else {
        // Look around when reaching the position
        this.lookAroundTimer += deltaTime;
        if (this.lookAroundTimer > 1.0) {
          this.lookDirection *= -1;
          enemy.rotate(90 * this.lookDirection);
          this.lookAroundTimer = 0;
        }
      }
    }
  }

  onExit(): void {
    this.context.lastKnownPlayerPosition = null;
    console.log('Nothing here... returning to patrol');
  }
}

// Chase State: Enemy actively pursuing the player
class ChaseState extends EnemyState {
  name = 'chase';

  onEnter(): void {
    console.log('Target spotted! Engaging!');
    this.context.enemy.setMoveSpeed(5.0);
    this.context.enemy.playAnimation('run');
  }

  onUpdate(deltaTime: number): void {
    const { enemy, player } = this.context;

    // Update last known position while we can see the player
    this.context.lastKnownPlayerPosition = player.position.clone();

    // Move toward player
    enemy.moveTo(player.position);

    // Face the player
    enemy.lookAt(player.position);
  }

  onExit(): void {
    console.log('Lost visual on target');
  }
}

// Attack State: Enemy is attacking the player
class AttackState extends EnemyState {
  name = 'attack';
  private attackCooldown: number = 0;
  private readonly attackInterval: number = 1.5;

  onEnter(): void {
    console.log('Attacking!');
    this.attackCooldown = 0;
  }

  onUpdate(deltaTime: number): void {
    const { enemy, player } = this.context;

    // Face the player
    enemy.lookAt(player.position);

    // Attack on cooldown
    this.attackCooldown -= deltaTime;
    if (this.attackCooldown <= 0) {
      enemy.playAnimation('attack');
      enemy.dealDamage(player, 10);
      this.attackCooldown = this.attackInterval;
    }
  }

  onExit(): void {
    console.log('Stopping attack');
  }
}

// Factory function to create a complete enemy AI
function createEnemyAI(
  enemy: Enemy,
  player: Player,
  patrolPoints: Vector2[]
): FiniteStateMachine {
  const context: EnemyContext = {
    enemy,
    player,
    patrolPoints,
    currentPatrolIndex: 0,
    lastKnownPlayerPosition: null,
    alertTimer: 0
  };

  const fsm = new FiniteStateMachine();

  // Add states
  fsm.addState(new PatrolState(context))
     .addState(new AlertState(context))
     .addState(new ChaseState(context))
     .addState(new AttackState(context));

  // Helper functions for conditions
  const canSeePlayer = () => enemy.canSee(player);
  const isInAttackRange = () =>
    enemy.position.distanceTo(player.position) < enemy.attackRange;
  const heardNoise = () => enemy.heardNoise && !canSeePlayer();
  const alertExpired = () => context.alertTimer <= 0;
  const lostPlayer = () => !canSeePlayer();
  const playerOutOfRange = () =>
    enemy.position.distanceTo(player.position) >= enemy.attackRange;

  // Define transitions
  fsm
    // From Patrol
    .addTransition('patrol', 'chase', canSeePlayer)
    .addTransition('patrol', 'alert', heardNoise)

    // From Alert
    .addTransition('alert', 'chase', canSeePlayer)
    .addTransition('alert', 'patrol', alertExpired)

    // From Chase
    .addTransition('chase', 'attack', isInAttackRange)
    .addTransition('chase', 'alert', lostPlayer)

    // From Attack
    .addTransition('attack', 'chase', playerOutOfRange)
    .addTransition('attack', 'alert', lostPlayer);

  fsm.setInitialState('patrol');

  return fsm;
}
```

### Hierarchical FSM (HFSM)

For complex AI, flat FSMs become unwieldy. Hierarchical FSMs solve this by allowing states to contain nested sub-state machines.

```typescript
// Hierarchical State that contains its own FSM
abstract class HierarchicalState implements State {
  abstract name: string;
  protected subFSM: FiniteStateMachine | null = null;

  onEnter(): void {
    this.subFSM?.start();
  }

  onUpdate(deltaTime: number): void {
    this.subFSM?.update(deltaTime);
  }

  onExit(): void {
    // Sub-FSM cleanup handled automatically
  }
}

// Combat state with sub-states for different attack types
class CombatState extends HierarchicalState {
  name = 'combat';
  private context: EnemyContext;

  constructor(context: EnemyContext) {
    super();
    this.context = context;
    this.setupSubFSM();
  }

  private setupSubFSM(): void {
    this.subFSM = new FiniteStateMachine();

    // Sub-states for combat
    this.subFSM.addState(new MeleeAttackState(this.context))
               .addState(new RangedAttackState(this.context))
               .addState(new BlockState(this.context))
               .addState(new DodgeState(this.context));

    const { enemy, player } = this.context;

    // Combat sub-state transitions
    this.subFSM
      .addTransition('melee', 'block', () => player.isAttacking())
      .addTransition('melee', 'ranged', () =>
        enemy.position.distanceTo(player.position) > 3)
      .addTransition('ranged', 'melee', () =>
        enemy.position.distanceTo(player.position) <= 3)
      .addTransition('block', 'dodge', () => player.isUsingHeavyAttack())
      .addTransition('block', 'melee', () => !player.isAttacking())
      .addTransition('dodge', 'melee', () => true); // Always return to melee after dodge

    this.subFSM.setInitialState('melee');
  }
}

// Complete HFSM structure
class HierarchicalFSM {
  private rootFSM: FiniteStateMachine;
  private stateHistory: string[] = [];
  private maxHistorySize: number = 10;

  constructor() {
    this.rootFSM = new FiniteStateMachine();
  }

  addState(state: State): this {
    this.rootFSM.addState(state);
    return this;
  }

  addTransition(
    from: string,
    to: string,
    condition: () => boolean
  ): this {
    this.rootFSM.addTransition(from, to, condition, () => {
      this.recordStateChange(to);
    });
    return this;
  }

  private recordStateChange(newState: string): void {
    this.stateHistory.push(newState);
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  getStateHistory(): string[] {
    return [...this.stateHistory];
  }

  start(): void {
    this.rootFSM.start();
  }

  update(deltaTime: number): void {
    this.rootFSM.update(deltaTime);
  }
}
```

### FSM Best Practices

1. **Keep states focused**: Each state should have a single, clear responsibility
2. **Minimize transitions**: Too many transitions make the FSM hard to understand
3. **Use guard conditions**: Validate that transitions make sense before executing
4. **Consider state history**: Sometimes you need to return to a previous state
5. **Implement debugging tools**: Log state changes, visualize the current state

### FSM Limitations

- **State explosion**: Complex behaviors require many states and transitions
- **Rigidity**: Difficult to add nuanced behaviors without adding more states
- **Code duplication**: Similar behaviors in different states lead to repeated code
- **Transition complexity**: Managing transitions between many states becomes unwieldy

These limitations led to the development of Behavior Trees.

---

## Part 2: Behavior Trees (BT)

### What is a Behavior Tree?

A Behavior Tree is a hierarchical node structure that models the decision-making process of an AI agent. Unlike FSMs where states are the primary concept, BTs are organized around **tasks** and the **control flow** that coordinates their execution.

```
                            [Root]
                              │
                         [Selector]
                    ┌─────────┼─────────┐
                    │         │         │
              [Sequence]  [Sequence]  [Patrol]
              ┌────┴────┐ ┌────┴────┐
              │         │ │         │
          [See      [Chase] [Low    [Flee]
          Enemy?]         Health?]
```

### Why Behavior Trees?

1. **Modularity**: Subtrees can be reused across different AI agents
2. **Readability**: Tree structure is intuitive and matches natural language descriptions
3. **Flexibility**: Easy to add, remove, or modify behaviors
4. **Maintainability**: Changes to one branch don't affect others
5. **Tool Support**: Visual editors make BTs accessible to designers

### Core Node Types

Behavior Trees consist of four fundamental node types:

#### Action Nodes (Leaf Nodes)

Action nodes perform actual game logic. They represent the "doing" part of AI.

```typescript
// Base status for all nodes
enum NodeStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  RUNNING = 'running'
}

// Base interface for all BT nodes
interface BTNode {
  tick(deltaTime: number): NodeStatus;
  reset(): void;
}

// Abstract action node
abstract class ActionNode implements BTNode {
  protected isRunning: boolean = false;

  abstract tick(deltaTime: number): NodeStatus;

  reset(): void {
    this.isRunning = false;
  }
}

// Concrete action: Move to target
class MoveToAction extends ActionNode {
  private agent: AIAgent;
  private target: Vector2;
  private acceptableDistance: number;

  constructor(
    agent: AIAgent,
    target: Vector2,
    acceptableDistance: number = 0.5
  ) {
    super();
    this.agent = agent;
    this.target = target;
    this.acceptableDistance = acceptableDistance;
  }

  tick(deltaTime: number): NodeStatus {
    const distance = this.agent.position.distanceTo(this.target);

    if (distance <= this.acceptableDistance) {
      return NodeStatus.SUCCESS;
    }

    this.agent.moveTo(this.target);
    return NodeStatus.RUNNING;
  }
}

// Concrete action: Attack target
class AttackAction extends ActionNode {
  private agent: AIAgent;
  private target: Entity;
  private attackDuration: number = 0.5;
  private elapsed: number = 0;

  constructor(agent: AIAgent, target: Entity) {
    super();
    this.agent = agent;
    this.target = target;
  }

  tick(deltaTime: number): NodeStatus {
    if (!this.isRunning) {
      this.isRunning = true;
      this.elapsed = 0;
      this.agent.playAnimation('attack');
    }

    this.elapsed += deltaTime;

    if (this.elapsed >= this.attackDuration) {
      this.agent.dealDamage(this.target, 10);
      return NodeStatus.SUCCESS;
    }

    return NodeStatus.RUNNING;
  }

  reset(): void {
    super.reset();
    this.elapsed = 0;
  }
}

// Concrete action: Wait for duration
class WaitAction extends ActionNode {
  private duration: number;
  private elapsed: number = 0;

  constructor(duration: number) {
    super();
    this.duration = duration;
  }

  tick(deltaTime: number): NodeStatus {
    this.elapsed += deltaTime;

    if (this.elapsed >= this.duration) {
      return NodeStatus.SUCCESS;
    }

    return NodeStatus.RUNNING;
  }

  reset(): void {
    super.reset();
    this.elapsed = 0;
  }
}
```

#### Condition Nodes (Leaf Nodes)

Condition nodes check game state without modifying it. They return SUCCESS or FAILURE immediately.

```typescript
// Abstract condition node
abstract class ConditionNode implements BTNode {
  abstract tick(deltaTime: number): NodeStatus;

  reset(): void {
    // Conditions typically don't need reset
  }
}

// Check if target is visible
class IsTargetVisibleCondition extends ConditionNode {
  private agent: AIAgent;
  private target: Entity;

  constructor(agent: AIAgent, target: Entity) {
    super();
    this.agent = agent;
    this.target = target;
  }

  tick(deltaTime: number): NodeStatus {
    const canSee = this.agent.hasLineOfSight(this.target) &&
                   this.agent.position.distanceTo(this.target.position) <
                   this.agent.sightRange;

    return canSee ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
  }
}

// Check if health is below threshold
class IsHealthLowCondition extends ConditionNode {
  private agent: AIAgent;
  private threshold: number;

  constructor(agent: AIAgent, threshold: number = 0.3) {
    super();
    this.agent = agent;
    this.threshold = threshold;
  }

  tick(deltaTime: number): NodeStatus {
    const healthPercent = this.agent.health / this.agent.maxHealth;
    return healthPercent < this.threshold
      ? NodeStatus.SUCCESS
      : NodeStatus.FAILURE;
  }
}

// Check if target is in range
class IsInRangeCondition extends ConditionNode {
  private agent: AIAgent;
  private target: Entity;
  private range: number;

  constructor(agent: AIAgent, target: Entity, range: number) {
    super();
    this.agent = agent;
    this.target = target;
    this.range = range;
  }

  tick(deltaTime: number): NodeStatus {
    const distance = this.agent.position.distanceTo(this.target.position);
    return distance <= this.range
      ? NodeStatus.SUCCESS
      : NodeStatus.FAILURE;
  }
}
```

#### Composite Nodes

Composite nodes have children and control their execution order.

##### Selector (Priority/Fallback)

Tries each child in order until one succeeds. Returns SUCCESS on first child success, FAILURE if all fail.

```typescript
class SelectorNode implements BTNode {
  private children: BTNode[];
  private currentChild: number = 0;

  constructor(children: BTNode[]) {
    this.children = children;
  }

  tick(deltaTime: number): NodeStatus {
    for (let i = this.currentChild; i < this.children.length; i++) {
      const status = this.children[i].tick(deltaTime);

      switch (status) {
        case NodeStatus.SUCCESS:
          this.currentChild = 0;
          return NodeStatus.SUCCESS;

        case NodeStatus.RUNNING:
          this.currentChild = i;
          return NodeStatus.RUNNING;

        case NodeStatus.FAILURE:
          // Try next child
          continue;
      }
    }

    // All children failed
    this.currentChild = 0;
    return NodeStatus.FAILURE;
  }

  reset(): void {
    this.currentChild = 0;
    this.children.forEach(child => child.reset());
  }
}
```

##### Sequence

Executes children in order. Returns FAILURE on first child failure, SUCCESS if all succeed.

```typescript
class SequenceNode implements BTNode {
  private children: BTNode[];
  private currentChild: number = 0;

  constructor(children: BTNode[]) {
    this.children = children;
  }

  tick(deltaTime: number): NodeStatus {
    for (let i = this.currentChild; i < this.children.length; i++) {
      const status = this.children[i].tick(deltaTime);

      switch (status) {
        case NodeStatus.FAILURE:
          this.currentChild = 0;
          return NodeStatus.FAILURE;

        case NodeStatus.RUNNING:
          this.currentChild = i;
          return NodeStatus.RUNNING;

        case NodeStatus.SUCCESS:
          // Continue to next child
          continue;
      }
    }

    // All children succeeded
    this.currentChild = 0;
    return NodeStatus.SUCCESS;
  }

  reset(): void {
    this.currentChild = 0;
    this.children.forEach(child => child.reset());
  }
}
```

##### Parallel

Executes all children simultaneously. Different policies determine success/failure.

```typescript
enum ParallelPolicy {
  REQUIRE_ONE,  // Success if any child succeeds
  REQUIRE_ALL   // Success only if all children succeed
}

class ParallelNode implements BTNode {
  private children: BTNode[];
  private successPolicy: ParallelPolicy;
  private failurePolicy: ParallelPolicy;

  constructor(
    children: BTNode[],
    successPolicy: ParallelPolicy = ParallelPolicy.REQUIRE_ALL,
    failurePolicy: ParallelPolicy = ParallelPolicy.REQUIRE_ONE
  ) {
    this.children = children;
    this.successPolicy = successPolicy;
    this.failurePolicy = failurePolicy;
  }

  tick(deltaTime: number): NodeStatus {
    let successCount = 0;
    let failureCount = 0;

    for (const child of this.children) {
      const status = child.tick(deltaTime);

      if (status === NodeStatus.SUCCESS) {
        successCount++;
      } else if (status === NodeStatus.FAILURE) {
        failureCount++;
      }
    }

    // Check failure condition
    if (this.failurePolicy === ParallelPolicy.REQUIRE_ONE && failureCount > 0) {
      return NodeStatus.FAILURE;
    }
    if (this.failurePolicy === ParallelPolicy.REQUIRE_ALL &&
        failureCount === this.children.length) {
      return NodeStatus.FAILURE;
    }

    // Check success condition
    if (this.successPolicy === ParallelPolicy.REQUIRE_ONE && successCount > 0) {
      return NodeStatus.SUCCESS;
    }
    if (this.successPolicy === ParallelPolicy.REQUIRE_ALL &&
        successCount === this.children.length) {
      return NodeStatus.SUCCESS;
    }

    return NodeStatus.RUNNING;
  }

  reset(): void {
    this.children.forEach(child => child.reset());
  }
}
```

#### Decorator Nodes

Decorators wrap a single child and modify its behavior or result.

```typescript
// Abstract decorator
abstract class DecoratorNode implements BTNode {
  protected child: BTNode;

  constructor(child: BTNode) {
    this.child = child;
  }

  abstract tick(deltaTime: number): NodeStatus;

  reset(): void {
    this.child.reset();
  }
}

// Inverter: Flips SUCCESS/FAILURE
class InverterDecorator extends DecoratorNode {
  tick(deltaTime: number): NodeStatus {
    const status = this.child.tick(deltaTime);

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

// Succeeder: Always returns SUCCESS
class SucceederDecorator extends DecoratorNode {
  tick(deltaTime: number): NodeStatus {
    this.child.tick(deltaTime);
    return NodeStatus.SUCCESS;
  }
}

// Repeater: Repeats child N times or until failure
class RepeaterDecorator extends DecoratorNode {
  private maxRepeats: number;
  private currentRepeat: number = 0;
  private repeatUntilFail: boolean;

  constructor(
    child: BTNode,
    maxRepeats: number = Infinity,
    repeatUntilFail: boolean = false
  ) {
    super(child);
    this.maxRepeats = maxRepeats;
    this.repeatUntilFail = repeatUntilFail;
  }

  tick(deltaTime: number): NodeStatus {
    while (this.currentRepeat < this.maxRepeats) {
      const status = this.child.tick(deltaTime);

      if (status === NodeStatus.RUNNING) {
        return NodeStatus.RUNNING;
      }

      if (status === NodeStatus.FAILURE && this.repeatUntilFail) {
        this.currentRepeat = 0;
        return NodeStatus.SUCCESS;
      }

      if (status === NodeStatus.FAILURE && !this.repeatUntilFail) {
        this.currentRepeat = 0;
        return NodeStatus.FAILURE;
      }

      this.currentRepeat++;
      this.child.reset();
    }

    this.currentRepeat = 0;
    return NodeStatus.SUCCESS;
  }

  reset(): void {
    super.reset();
    this.currentRepeat = 0;
  }
}

// Cooldown: Prevents execution until cooldown expires
class CooldownDecorator extends DecoratorNode {
  private cooldownTime: number;
  private lastExecutionTime: number = -Infinity;
  private getCurrentTime: () => number;

  constructor(
    child: BTNode,
    cooldownTime: number,
    getCurrentTime: () => number = () => Date.now() / 1000
  ) {
    super(child);
    this.cooldownTime = cooldownTime;
    this.getCurrentTime = getCurrentTime;
  }

  tick(deltaTime: number): NodeStatus {
    const currentTime = this.getCurrentTime();

    if (currentTime - this.lastExecutionTime < this.cooldownTime) {
      return NodeStatus.FAILURE;
    }

    const status = this.child.tick(deltaTime);

    if (status !== NodeStatus.RUNNING) {
      this.lastExecutionTime = currentTime;
    }

    return status;
  }
}

// Timeout: Fails if child takes too long
class TimeoutDecorator extends DecoratorNode {
  private maxTime: number;
  private elapsedTime: number = 0;
  private isRunning: boolean = false;

  constructor(child: BTNode, maxTime: number) {
    super(child);
    this.maxTime = maxTime;
  }

  tick(deltaTime: number): NodeStatus {
    if (!this.isRunning) {
      this.isRunning = true;
      this.elapsedTime = 0;
    }

    this.elapsedTime += deltaTime;

    if (this.elapsedTime > this.maxTime) {
      this.isRunning = false;
      return NodeStatus.FAILURE;
    }

    const status = this.child.tick(deltaTime);

    if (status !== NodeStatus.RUNNING) {
      this.isRunning = false;
    }

    return status;
  }

  reset(): void {
    super.reset();
    this.isRunning = false;
    this.elapsedTime = 0;
  }
}
```

### The Blackboard System

A Blackboard is a shared memory space that allows nodes in a behavior tree to communicate. It's essential for creating reactive, data-driven behaviors.

```typescript
// Blackboard key type safety
type BlackboardKey = string;

// Blackboard value types
type BlackboardValue =
  | number
  | string
  | boolean
  | Vector2
  | Entity
  | null
  | undefined;

// Observer for blackboard changes
type BlackboardObserver = (key: BlackboardKey, value: BlackboardValue) => void;

class Blackboard {
  private data: Map<BlackboardKey, BlackboardValue> = new Map();
  private observers: Map<BlackboardKey, Set<BlackboardObserver>> = new Map();

  // Set a value
  set(key: BlackboardKey, value: BlackboardValue): void {
    const oldValue = this.data.get(key);
    this.data.set(key, value);

    // Notify observers if value changed
    if (oldValue !== value) {
      this.notifyObservers(key, value);
    }
  }

  // Get a value with type assertion
  get<T extends BlackboardValue>(key: BlackboardKey): T | undefined {
    return this.data.get(key) as T | undefined;
  }

  // Get with default value
  getOrDefault<T extends BlackboardValue>(
    key: BlackboardKey,
    defaultValue: T
  ): T {
    const value = this.data.get(key);
    return (value !== undefined ? value : defaultValue) as T;
  }

  // Check if key exists
  has(key: BlackboardKey): boolean {
    return this.data.has(key);
  }

  // Remove a key
  remove(key: BlackboardKey): void {
    this.data.delete(key);
    this.notifyObservers(key, undefined);
  }

  // Clear all data
  clear(): void {
    this.data.clear();
  }

  // Subscribe to changes
  subscribe(key: BlackboardKey, observer: BlackboardObserver): () => void {
    if (!this.observers.has(key)) {
      this.observers.set(key, new Set());
    }
    this.observers.get(key)!.add(observer);

    // Return unsubscribe function
    return () => {
      this.observers.get(key)?.delete(observer);
    };
  }

  private notifyObservers(key: BlackboardKey, value: BlackboardValue): void {
    this.observers.get(key)?.forEach(observer => observer(key, value));
  }
}

// Blackboard-aware nodes
abstract class BlackboardNode implements BTNode {
  protected blackboard: Blackboard;

  constructor(blackboard: Blackboard) {
    this.blackboard = blackboard;
  }

  abstract tick(deltaTime: number): NodeStatus;
  abstract reset(): void;
}

// Set blackboard value action
class SetBlackboardAction extends BlackboardNode {
  private key: BlackboardKey;
  private valueProvider: () => BlackboardValue;

  constructor(
    blackboard: Blackboard,
    key: BlackboardKey,
    valueProvider: () => BlackboardValue
  ) {
    super(blackboard);
    this.key = key;
    this.valueProvider = valueProvider;
  }

  tick(deltaTime: number): NodeStatus {
    this.blackboard.set(this.key, this.valueProvider());
    return NodeStatus.SUCCESS;
  }

  reset(): void {}
}

// Check blackboard condition
class CheckBlackboardCondition extends BlackboardNode {
  private key: BlackboardKey;
  private predicate: (value: BlackboardValue) => boolean;

  constructor(
    blackboard: Blackboard,
    key: BlackboardKey,
    predicate: (value: BlackboardValue) => boolean
  ) {
    super(blackboard);
    this.key = key;
    this.predicate = predicate;
  }

  tick(deltaTime: number): NodeStatus {
    const value = this.blackboard.get(this.key);
    return this.predicate(value)
      ? NodeStatus.SUCCESS
      : NodeStatus.FAILURE;
  }

  reset(): void {}
}
```

### Complete Behavior Tree Example

Let's build a complete enemy AI using behavior trees:

```typescript
// Behavior Tree Builder for fluent API
class BehaviorTreeBuilder {
  private blackboard: Blackboard;
  private agent: AIAgent;

  constructor(agent: AIAgent) {
    this.agent = agent;
    this.blackboard = new Blackboard();
  }

  build(): BehaviorTree {
    const root = new SelectorNode([
      this.buildCombatBranch(),
      this.buildSurvivalBranch(),
      this.buildPatrolBranch()
    ]);

    return new BehaviorTree(root, this.blackboard);
  }

  private buildCombatBranch(): BTNode {
    // Combat: If we see an enemy, engage
    return new SequenceNode([
      // Check for visible enemies
      new FindNearestEnemyAction(this.agent, this.blackboard),

      // Main combat selector
      new SelectorNode([
        // If in range, attack
        new SequenceNode([
          new CheckBlackboardCondition(
            this.blackboard,
            'target',
            (target) => {
              if (!target) return false;
              const distance = this.agent.position.distanceTo(
                (target as Entity).position
              );
              return distance <= this.agent.attackRange;
            }
          ),
          new AttackTargetAction(this.agent, this.blackboard)
        ]),

        // Otherwise, chase
        new ChaseTargetAction(this.agent, this.blackboard)
      ])
    ]);
  }

  private buildSurvivalBranch(): BTNode {
    // Survival: If health is low, flee or heal
    return new SequenceNode([
      new IsHealthLowCondition(this.agent, 0.25),
      new SelectorNode([
        // Try to heal if we have items
        new SequenceNode([
          new HasHealingItemCondition(this.agent),
          new UseHealingItemAction(this.agent)
        ]),
        // Otherwise flee
        new FleeFromDangerAction(this.agent, this.blackboard)
      ])
    ]);
  }

  private buildPatrolBranch(): BTNode {
    // Patrol: Default behavior
    return new SequenceNode([
      new GetNextPatrolPointAction(this.agent, this.blackboard),
      new MoveToBlackboardTargetAction(
        this.agent,
        this.blackboard,
        'patrolTarget'
      ),
      new WaitAction(2.0)
    ]);
  }
}

// Custom action nodes
class FindNearestEnemyAction extends BlackboardNode {
  private agent: AIAgent;

  constructor(agent: AIAgent, blackboard: Blackboard) {
    super(blackboard);
    this.agent = agent;
  }

  tick(deltaTime: number): NodeStatus {
    const enemies = this.agent.getVisibleEnemies();

    if (enemies.length === 0) {
      this.blackboard.remove('target');
      return NodeStatus.FAILURE;
    }

    // Find closest enemy
    let closest = enemies[0];
    let closestDistance = this.agent.position.distanceTo(closest.position);

    for (const enemy of enemies) {
      const distance = this.agent.position.distanceTo(enemy.position);
      if (distance < closestDistance) {
        closest = enemy;
        closestDistance = distance;
      }
    }

    this.blackboard.set('target', closest);
    this.blackboard.set('targetLastPosition', closest.position.clone());
    return NodeStatus.SUCCESS;
  }

  reset(): void {}
}

class AttackTargetAction extends BlackboardNode {
  private agent: AIAgent;
  private attackDuration: number = 0.5;
  private elapsed: number = 0;
  private isAttacking: boolean = false;

  constructor(agent: AIAgent, blackboard: Blackboard) {
    super(blackboard);
    this.agent = agent;
  }

  tick(deltaTime: number): NodeStatus {
    const target = this.blackboard.get<Entity>('target');
    if (!target) return NodeStatus.FAILURE;

    if (!this.isAttacking) {
      this.isAttacking = true;
      this.elapsed = 0;
      this.agent.playAnimation('attack');
      this.agent.lookAt(target.position);
    }

    this.elapsed += deltaTime;

    if (this.elapsed >= this.attackDuration) {
      this.agent.dealDamage(target, this.agent.attackDamage);
      this.isAttacking = false;
      return NodeStatus.SUCCESS;
    }

    return NodeStatus.RUNNING;
  }

  reset(): void {
    this.isAttacking = false;
    this.elapsed = 0;
  }
}

class ChaseTargetAction extends BlackboardNode {
  private agent: AIAgent;

  constructor(agent: AIAgent, blackboard: Blackboard) {
    super(blackboard);
    this.agent = agent;
  }

  tick(deltaTime: number): NodeStatus {
    const target = this.blackboard.get<Entity>('target');
    if (!target) return NodeStatus.FAILURE;

    const distance = this.agent.position.distanceTo(target.position);

    if (distance <= this.agent.attackRange) {
      return NodeStatus.SUCCESS;
    }

    this.agent.moveTo(target.position);
    this.blackboard.set('targetLastPosition', target.position.clone());

    return NodeStatus.RUNNING;
  }

  reset(): void {}
}

class FleeFromDangerAction extends BlackboardNode {
  private agent: AIAgent;
  private fleeDistance: number = 15;

  constructor(agent: AIAgent, blackboard: Blackboard) {
    super(blackboard);
    this.agent = agent;
  }

  tick(deltaTime: number): NodeStatus {
    const target = this.blackboard.get<Entity>('target');

    if (!target) {
      // No known threat, flee complete
      return NodeStatus.SUCCESS;
    }

    const distance = this.agent.position.distanceTo(target.position);

    if (distance >= this.fleeDistance) {
      return NodeStatus.SUCCESS;
    }

    // Calculate flee direction (opposite of threat)
    const fleeDirection = this.agent.position
      .subtract(target.position)
      .normalize();

    const fleeTarget = this.agent.position.add(
      fleeDirection.multiply(this.fleeDistance)
    );

    this.agent.moveTo(fleeTarget);
    this.agent.playAnimation('run');

    return NodeStatus.RUNNING;
  }

  reset(): void {}
}

// The main Behavior Tree class
class BehaviorTree {
  private root: BTNode;
  private blackboard: Blackboard;
  private isRunning: boolean = false;

  constructor(root: BTNode, blackboard: Blackboard) {
    this.root = root;
    this.blackboard = blackboard;
  }

  tick(deltaTime: number): NodeStatus {
    const status = this.root.tick(deltaTime);

    if (status !== NodeStatus.RUNNING) {
      this.root.reset();
    }

    return status;
  }

  getBlackboard(): Blackboard {
    return this.blackboard;
  }

  reset(): void {
    this.root.reset();
  }
}

// Usage
const agent = new AIAgent();
const builder = new BehaviorTreeBuilder(agent);
const behaviorTree = builder.build();

// Game loop
function update(deltaTime: number): void {
  behaviorTree.tick(deltaTime);
}
```

### Advanced Behavior Tree Patterns

#### Utility-Based Selection

Combine behavior trees with utility theory for more dynamic decision-making:

```typescript
interface UtilityProvider {
  calculateUtility(): number;
}

class UtilitySelectorNode implements BTNode {
  private children: Array<{
    node: BTNode;
    utilityProvider: UtilityProvider;
  }>;
  private currentChild: BTNode | null = null;

  constructor(
    children: Array<{
      node: BTNode;
      utilityProvider: UtilityProvider;
    }>
  ) {
    this.children = children;
  }

  tick(deltaTime: number): NodeStatus {
    // If we have a running child, continue with it
    if (this.currentChild) {
      const status = this.currentChild.tick(deltaTime);
      if (status !== NodeStatus.RUNNING) {
        this.currentChild = null;
      }
      return status;
    }

    // Calculate utilities and select highest
    let bestChild: BTNode | null = null;
    let bestUtility = -Infinity;

    for (const { node, utilityProvider } of this.children) {
      const utility = utilityProvider.calculateUtility();
      if (utility > bestUtility) {
        bestUtility = utility;
        bestChild = node;
      }
    }

    if (!bestChild || bestUtility <= 0) {
      return NodeStatus.FAILURE;
    }

    const status = bestChild.tick(deltaTime);

    if (status === NodeStatus.RUNNING) {
      this.currentChild = bestChild;
    }

    return status;
  }

  reset(): void {
    this.currentChild = null;
    this.children.forEach(({ node }) => node.reset());
  }
}

// Example utility providers
class AttackUtility implements UtilityProvider {
  private agent: AIAgent;
  private blackboard: Blackboard;

  constructor(agent: AIAgent, blackboard: Blackboard) {
    this.agent = agent;
    this.blackboard = blackboard;
  }

  calculateUtility(): number {
    const target = this.blackboard.get<Entity>('target');
    if (!target) return 0;

    const distance = this.agent.position.distanceTo(target.position);
    const healthRatio = this.agent.health / this.agent.maxHealth;

    // Higher utility when close and healthy
    const distanceScore = Math.max(0, 1 - distance / 20);
    const healthScore = healthRatio;

    return distanceScore * 0.6 + healthScore * 0.4;
  }
}

class FleeUtility implements UtilityProvider {
  private agent: AIAgent;
  private blackboard: Blackboard;

  constructor(agent: AIAgent, blackboard: Blackboard) {
    this.agent = agent;
    this.blackboard = blackboard;
  }

  calculateUtility(): number {
    const target = this.blackboard.get<Entity>('target');
    const healthRatio = this.agent.health / this.agent.maxHealth;

    // Higher utility when low health
    let utility = 1 - healthRatio;

    // Increase if enemy is nearby
    if (target) {
      const distance = this.agent.position.distanceTo(target.position);
      if (distance < 5) {
        utility += 0.3;
      }
    }

    return Math.min(1, utility);
  }
}
```

#### Reactive Behavior Trees

Add event-driven interrupts for more responsive AI:

```typescript
class ReactiveSequenceNode implements BTNode {
  private children: BTNode[];
  private currentChild: number = 0;
  private conditions: BTNode[];  // Conditions to check each tick

  constructor(conditions: BTNode[], children: BTNode[]) {
    this.conditions = conditions;
    this.children = children;
  }

  tick(deltaTime: number): NodeStatus {
    // First, check all conditions (reactive check)
    for (const condition of this.conditions) {
      const conditionStatus = condition.tick(deltaTime);
      if (conditionStatus === NodeStatus.FAILURE) {
        this.reset();
        return NodeStatus.FAILURE;
      }
    }

    // Then proceed with children
    for (let i = this.currentChild; i < this.children.length; i++) {
      const status = this.children[i].tick(deltaTime);

      switch (status) {
        case NodeStatus.FAILURE:
          this.currentChild = 0;
          return NodeStatus.FAILURE;
        case NodeStatus.RUNNING:
          this.currentChild = i;
          return NodeStatus.RUNNING;
        case NodeStatus.SUCCESS:
          continue;
      }
    }

    this.currentChild = 0;
    return NodeStatus.SUCCESS;
  }

  reset(): void {
    this.currentChild = 0;
    this.conditions.forEach(c => c.reset());
    this.children.forEach(c => c.reset());
  }
}
```

### Behavior Tree vs FSM Comparison

| Aspect | FSM | Behavior Tree |
|--------|-----|---------------|
| Structure | Flat graph of states | Hierarchical tree |
| Primary concept | States and transitions | Tasks and control flow |
| Modularity | Low (states often coupled) | High (subtrees reusable) |
| Scalability | Poor for complex AI | Good for complex AI |
| Memory usage | Lower | Higher |
| Debugging | Easy (current state is clear) | Harder (execution path varies) |
| Designer-friendly | Moderate | High (with visual tools) |
| Best for | Simple, predictable AI | Complex, varied AI |

### When to Use Which

**Use FSM when:**
- AI behavior is simple (3-5 states)
- Behavior is predictable and well-defined
- Performance is critical
- You need easy debugging

**Use Behavior Trees when:**
- AI needs complex, varied behaviors
- You want reusable behavior modules
- Multiple AI types share similar subtrees
- Designers need to tweak behavior
- You need reactive/dynamic responses

**Use Both Together:**
- BT for high-level decisions
- FSM for low-level state management within actions

---

## Practical Applications

### NPC Companion AI

```typescript
// Companion that follows player, helps in combat, and avoids danger
function createCompanionAI(
  companion: AIAgent,
  player: Entity
): BehaviorTree {
  const blackboard = new Blackboard();
  blackboard.set('player', player);
  blackboard.set('followDistance', 3);

  const root = new SelectorNode([
    // Priority 1: Self-preservation
    new SequenceNode([
      new IsHealthLowCondition(companion, 0.2),
      new SelectorNode([
        new UseHealingItemAction(companion),
        new TakeCoverAction(companion, blackboard)
      ])
    ]),

    // Priority 2: Help player in combat
    new SequenceNode([
      new IsPlayerInCombatCondition(blackboard),
      new SelectorNode([
        // Support from range if we have ranged attacks
        new SequenceNode([
          new HasRangedWeaponCondition(companion),
          new FindCombatPositionAction(companion, blackboard),
          new RangedAttackAction(companion, blackboard)
        ]),
        // Otherwise melee support
        new SequenceNode([
          new FindFlankingPositionAction(companion, blackboard),
          new MeleeAttackAction(companion, blackboard)
        ])
      ])
    ]),

    // Priority 3: Follow player
    new SequenceNode([
      new IsTooFarFromPlayerCondition(companion, blackboard),
      new FollowPlayerAction(companion, blackboard)
    ]),

    // Priority 4: Idle behavior near player
    new IdleNearPlayerAction(companion, blackboard)
  ]);

  return new BehaviorTree(root, blackboard);
}
```

### Boss AI with Phases

```typescript
// Boss with multiple combat phases
class BossAI {
  private fsm: FiniteStateMachine;
  private phaseBehaviors: Map<string, BehaviorTree> = new Map();
  private currentPhaseBT: BehaviorTree | null = null;

  constructor(boss: BossEntity, player: Entity) {
    this.setupPhases(boss, player);
    this.setupFSM(boss);
  }

  private setupPhases(boss: BossEntity, player: Entity): void {
    // Phase 1: Aggressive melee
    this.phaseBehaviors.set('phase1', this.createPhase1BT(boss, player));

    // Phase 2: Ranged attacks with summons
    this.phaseBehaviors.set('phase2', this.createPhase2BT(boss, player));

    // Phase 3: Enraged - all abilities
    this.phaseBehaviors.set('phase3', this.createPhase3BT(boss, player));
  }

  private setupFSM(boss: BossEntity): void {
    this.fsm = new FiniteStateMachine();

    // Phase states
    this.fsm.addState({
      name: 'phase1',
      onEnter: () => {
        boss.playAnimation('roar');
        this.currentPhaseBT = this.phaseBehaviors.get('phase1')!;
      },
      onUpdate: (dt) => this.currentPhaseBT?.tick(dt),
      onExit: () => boss.playAnimation('power_up')
    });

    this.fsm.addState({
      name: 'phase2',
      onEnter: () => {
        boss.playAnimation('transform');
        this.currentPhaseBT = this.phaseBehaviors.get('phase2')!;
        boss.enableRangedAttacks();
      },
      onUpdate: (dt) => this.currentPhaseBT?.tick(dt),
      onExit: () => boss.playAnimation('rage')
    });

    this.fsm.addState({
      name: 'phase3',
      onEnter: () => {
        boss.playAnimation('final_form');
        this.currentPhaseBT = this.phaseBehaviors.get('phase3')!;
        boss.increaseSpeed(1.5);
        boss.increaseDamage(1.3);
      },
      onUpdate: (dt) => this.currentPhaseBT?.tick(dt),
      onExit: () => {}
    });

    // Phase transitions based on health
    this.fsm.addTransition(
      'phase1', 'phase2',
      () => boss.health / boss.maxHealth < 0.66
    );
    this.fsm.addTransition(
      'phase2', 'phase3',
      () => boss.health / boss.maxHealth < 0.33
    );

    this.fsm.setInitialState('phase1');
  }

  private createPhase1BT(boss: BossEntity, player: Entity): BehaviorTree {
    const blackboard = new Blackboard();
    blackboard.set('player', player);

    const root = new SelectorNode([
      // Special attack on cooldown
      new SequenceNode([
        new CooldownDecorator(
          new GroundSlamAction(boss, blackboard),
          8.0
        )
      ]),
      // Combo attack
      new SequenceNode([
        new IsInRangeCondition(boss, player, 3),
        new ComboAttackAction(boss, blackboard)
      ]),
      // Chase player
      new ChaseAction(boss, blackboard)
    ]);

    return new BehaviorTree(root, blackboard);
  }

  private createPhase2BT(boss: BossEntity, player: Entity): BehaviorTree {
    const blackboard = new Blackboard();
    blackboard.set('player', player);

    const root = new SelectorNode([
      // Summon minions periodically
      new SequenceNode([
        new CooldownDecorator(
          new SummonMinionsAction(boss, blackboard, 3),
          15.0
        )
      ]),
      // Ranged attacks when far
      new SequenceNode([
        new InverterDecorator(
          new IsInRangeCondition(boss, player, 5)
        ),
        new SelectorNode([
          new CooldownDecorator(
            new FireballBarrageAction(boss, blackboard),
            5.0
          ),
          new SingleFireballAction(boss, blackboard)
        ])
      ]),
      // Melee when close
      new SequenceNode([
        new IsInRangeCondition(boss, player, 5),
        new MeleeComboAction(boss, blackboard)
      ]),
      // Maintain distance
      new MaintainDistanceAction(boss, blackboard, 8)
    ]);

    return new BehaviorTree(root, blackboard);
  }

  private createPhase3BT(boss: BossEntity, player: Entity): BehaviorTree {
    const blackboard = new Blackboard();
    blackboard.set('player', player);

    // Phase 3: Aggressive combination of all abilities
    const root = new SelectorNode([
      // Ultimate attack when player health is low
      new SequenceNode([
        new CheckCondition(() => player.health / player.maxHealth < 0.3),
        new CooldownDecorator(
          new UltimateAttackAction(boss, blackboard),
          20.0
        )
      ]),
      // Random powerful attacks
      new ParallelNode([
        new RepeaterDecorator(
          new SummonMinionsAction(boss, blackboard, 1),
          Infinity,
          false
        ),
        new SelectorNode([
          new CooldownDecorator(
            new GroundSlamAction(boss, blackboard),
            4.0
          ),
          new CooldownDecorator(
            new FireballBarrageAction(boss, blackboard),
            3.0
          ),
          new AggressiveMeleeAction(boss, blackboard)
        ])
      ], ParallelPolicy.REQUIRE_ONE)
    ]);

    return new BehaviorTree(root, blackboard);
  }

  update(deltaTime: number): void {
    this.fsm.update(deltaTime);
  }
}
```

### Stealth Game Guard AI

```typescript
function createStealthGuardAI(
  guard: AIAgent,
  patrolRoute: Vector2[]
): { fsm: FiniteStateMachine; blackboard: Blackboard } {
  const blackboard = new Blackboard();
  blackboard.set('patrolRoute', patrolRoute);
  blackboard.set('patrolIndex', 0);
  blackboard.set('alertLevel', 0); // 0-100
  blackboard.set('suspicionPosition', null);

  const fsm = new FiniteStateMachine();

  // Patrol state
  fsm.addState({
    name: 'patrol',
    onEnter: () => {
      guard.setMoveSpeed(2);
      guard.playAnimation('walk');
      blackboard.set('alertLevel', 0);
    },
    onUpdate: (dt) => {
      const route = blackboard.get<Vector2[]>('patrolRoute')!;
      const index = blackboard.get<number>('patrolIndex')!;
      const target = route[index];

      if (guard.position.distanceTo(target) < 0.5) {
        blackboard.set('patrolIndex', (index + 1) % route.length);
      } else {
        guard.moveTo(target);
      }

      // Check for player detection
      const detectionResult = guard.checkForPlayer();
      if (detectionResult.detected) {
        if (detectionResult.certainty > 0.8) {
          blackboard.set('lastKnownPosition', detectionResult.position);
        } else {
          blackboard.set('suspicionPosition', detectionResult.position);
        }
      }
    },
    onExit: () => {}
  });

  // Suspicious state
  fsm.addState({
    name: 'suspicious',
    onEnter: () => {
      guard.playAnimation('alert');
      guard.say('Hm? What was that?');
    },
    onUpdate: (dt) => {
      const alertLevel = blackboard.get<number>('alertLevel')!;
      const suspicionPos = blackboard.get<Vector2>('suspicionPosition');

      if (suspicionPos) {
        guard.lookAt(suspicionPos);

        // Slowly approach
        if (guard.position.distanceTo(suspicionPos) > 2) {
          guard.setMoveSpeed(1.5);
          guard.moveTo(suspicionPos);
        }
      }

      // Alert level decays over time if nothing found
      blackboard.set('alertLevel', Math.max(0, alertLevel - 5 * dt));
    },
    onExit: () => {
      blackboard.set('suspicionPosition', null);
    }
  });

  // Searching state
  fsm.addState({
    name: 'searching',
    onEnter: () => {
      guard.playAnimation('search');
      guard.say('I know you are here!');
      guard.alertNearbyGuards();
    },
    onUpdate: (dt) => {
      const lastKnown = blackboard.get<Vector2>('lastKnownPosition');

      if (lastKnown) {
        // Search pattern around last known position
        guard.performSearchPattern(lastKnown);
      }

      // Check for player
      const detectionResult = guard.checkForPlayer();
      if (detectionResult.detected && detectionResult.certainty > 0.9) {
        blackboard.set('targetPlayer', detectionResult.player);
      }

      // Alert level decays
      const alertLevel = blackboard.get<number>('alertLevel')!;
      blackboard.set('alertLevel', Math.max(0, alertLevel - 2 * dt));
    },
    onExit: () => {
      guard.say('Must have been the wind...');
    }
  });

  // Combat state
  fsm.addState({
    name: 'combat',
    onEnter: () => {
      guard.playAnimation('combat_ready');
      guard.drawWeapon();
      guard.say('Stop right there!');
      guard.triggerAlarm();
    },
    onUpdate: (dt) => {
      const target = blackboard.get<Entity>('targetPlayer');

      if (target) {
        guard.lookAt(target.position);

        if (guard.position.distanceTo(target.position) > guard.attackRange) {
          guard.moveTo(target.position);
        } else {
          guard.attack(target);
        }
      }
    },
    onExit: () => {
      guard.holsterWeapon();
    }
  });

  // Transitions
  const alertLevel = () => blackboard.get<number>('alertLevel')!;
  const hasSuspicion = () => blackboard.has('suspicionPosition') &&
    blackboard.get('suspicionPosition') !== null;
  const hasLastKnown = () => blackboard.has('lastKnownPosition') &&
    blackboard.get('lastKnownPosition') !== null;
  const hasTarget = () => blackboard.has('targetPlayer') &&
    blackboard.get('targetPlayer') !== null;

  fsm
    .addTransition('patrol', 'suspicious', () => hasSuspicion())
    .addTransition('patrol', 'searching', () => hasLastKnown())
    .addTransition('patrol', 'combat', () => hasTarget())

    .addTransition('suspicious', 'patrol', () => alertLevel() <= 0)
    .addTransition('suspicious', 'searching', () => alertLevel() > 50)
    .addTransition('suspicious', 'combat', () => hasTarget())

    .addTransition('searching', 'suspicious', () => alertLevel() < 30 && !hasTarget())
    .addTransition('searching', 'combat', () => hasTarget())

    .addTransition('combat', 'searching', () => !hasTarget());

  fsm.setInitialState('patrol');

  return { fsm, blackboard };
}
```

---

## Performance Considerations

### FSM Optimization

```typescript
// Use object pooling for state data
class StatePool<T> {
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

  release(item: T): void {
    this.pool.push(item);
  }
}

// Cache transition conditions
class OptimizedFSM {
  private cachedConditions: Map<string, boolean> = new Map();
  private conditionCacheTime: number = 0;
  private cacheValidityDuration: number = 0.1; // 100ms

  updateConditionCache(currentTime: number): void {
    if (currentTime - this.conditionCacheTime > this.cacheValidityDuration) {
      this.cachedConditions.clear();
      this.conditionCacheTime = currentTime;
    }
  }
}
```

### Behavior Tree Optimization

```typescript
// Lazy evaluation with dirty flags
class OptimizedBlackboard extends Blackboard {
  private dirtyKeys: Set<BlackboardKey> = new Set();

  set(key: BlackboardKey, value: BlackboardValue): void {
    super.set(key, value);
    this.dirtyKeys.add(key);
  }

  isDirty(key: BlackboardKey): boolean {
    return this.dirtyKeys.has(key);
  }

  clearDirty(key?: BlackboardKey): void {
    if (key) {
      this.dirtyKeys.delete(key);
    } else {
      this.dirtyKeys.clear();
    }
  }
}

// Node execution budgeting
class BudgetedBehaviorTree extends BehaviorTree {
  private executionBudget: number; // Max nodes per tick
  private nodesExecuted: number = 0;

  constructor(
    root: BTNode,
    blackboard: Blackboard,
    executionBudget: number = 100
  ) {
    super(root, blackboard);
    this.executionBudget = executionBudget;
  }

  canExecuteMore(): boolean {
    return this.nodesExecuted < this.executionBudget;
  }

  recordExecution(): void {
    this.nodesExecuted++;
  }

  tick(deltaTime: number): NodeStatus {
    this.nodesExecuted = 0;
    return super.tick(deltaTime);
  }
}
```

---

## Debugging and Visualization

### FSM Debugger

```typescript
class FSMDebugger {
  private fsm: FiniteStateMachine;
  private stateHistory: Array<{
    state: string;
    timestamp: number;
    duration: number;
  }> = [];
  private transitionLog: Array<{
    from: string;
    to: string;
    timestamp: number;
    reason?: string;
  }> = [];

  constructor(fsm: FiniteStateMachine) {
    this.fsm = fsm;
  }

  logTransition(from: string, to: string, reason?: string): void {
    const timestamp = Date.now();

    // Update duration of previous state
    if (this.stateHistory.length > 0) {
      const lastEntry = this.stateHistory[this.stateHistory.length - 1];
      lastEntry.duration = timestamp - lastEntry.timestamp;
    }

    this.stateHistory.push({
      state: to,
      timestamp,
      duration: 0
    });

    this.transitionLog.push({
      from,
      to,
      timestamp,
      reason
    });

    console.log(`[FSM] ${from} -> ${to}${reason ? ` (${reason})` : ''}`);
  }

  getStateTimeBreakdown(): Map<string, number> {
    const breakdown = new Map<string, number>();

    for (const entry of this.stateHistory) {
      const current = breakdown.get(entry.state) || 0;
      breakdown.set(entry.state, current + entry.duration);
    }

    return breakdown;
  }

  generateReport(): string {
    const breakdown = this.getStateTimeBreakdown();
    let report = '=== FSM Debug Report ===\n';
    report += `Total transitions: ${this.transitionLog.length}\n`;
    report += '\nState time breakdown:\n';

    for (const [state, time] of breakdown) {
      report += `  ${state}: ${(time / 1000).toFixed(2)}s\n`;
    }

    report += '\nRecent transitions:\n';
    const recent = this.transitionLog.slice(-10);
    for (const t of recent) {
      report += `  ${t.from} -> ${t.to}\n`;
    }

    return report;
  }
}
```

### Behavior Tree Visualizer

```typescript
interface BTNodeDebugInfo {
  name: string;
  type: string;
  status: NodeStatus;
  executionCount: number;
  lastExecutionTime: number;
  children?: BTNodeDebugInfo[];
}

class BTDebugger {
  private nodeStats: Map<BTNode, {
    executionCount: number;
    successCount: number;
    failureCount: number;
    totalRunningTime: number;
  }> = new Map();

  wrapNode(node: BTNode, name: string): BTNode {
    const stats = {
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      totalRunningTime: 0
    };
    this.nodeStats.set(node, stats);

    const originalTick = node.tick.bind(node);
    let runningStartTime: number | null = null;

    node.tick = (deltaTime: number): NodeStatus => {
      stats.executionCount++;

      if (runningStartTime === null) {
        runningStartTime = performance.now();
      }

      const status = originalTick(deltaTime);

      if (status === NodeStatus.SUCCESS) {
        stats.successCount++;
        runningStartTime = null;
      } else if (status === NodeStatus.FAILURE) {
        stats.failureCount++;
        runningStartTime = null;
      } else if (status === NodeStatus.RUNNING && runningStartTime !== null) {
        stats.totalRunningTime += performance.now() - runningStartTime;
      }

      console.log(`[BT] ${name}: ${status}`);
      return status;
    };

    return node;
  }

  getNodeStats(node: BTNode): typeof this.nodeStats extends Map<any, infer V> ? V : never {
    return this.nodeStats.get(node)!;
  }

  generateVisualization(root: BTNode): string {
    // Generate ASCII tree visualization
    return this.visualizeNode(root, '', true);
  }

  private visualizeNode(
    node: BTNode,
    prefix: string,
    isLast: boolean
  ): string {
    const connector = isLast ? '\\-- ' : '+-- ';
    const stats = this.nodeStats.get(node);
    const statsStr = stats
      ? ` [${stats.executionCount}x, ${stats.successCount}S/${stats.failureCount}F]`
      : '';

    let result = prefix + connector + node.constructor.name + statsStr + '\n';

    // Handle composite nodes with children
    if ('children' in node && Array.isArray((node as any).children)) {
      const children = (node as any).children as BTNode[];
      const newPrefix = prefix + (isLast ? '    ' : '|   ');

      children.forEach((child, index) => {
        result += this.visualizeNode(
          child,
          newPrefix,
          index === children.length - 1
        );
      });
    }

    return result;
  }
}
```

---

## Summary

### Key Takeaways

1. **FSMs are best for simple, well-defined behaviors** with clear state transitions. They are easy to understand, debug, and implement but can become unwieldy with complex AI.

2. **Behavior Trees excel at complex, modular AI** where behaviors need to be composed, reused, and easily modified. The hierarchical structure maps well to how we think about AI decision-making.

3. **The Blackboard pattern is essential** for behavior trees, providing a clean way for nodes to share data without tight coupling.

4. **Combine both approaches** when appropriate: use FSMs for high-level state management and behavior trees for detailed decision-making within states.

5. **Performance matters**: Use object pooling, caching, and execution budgets to keep AI systems running efficiently in real-time games.

6. **Debugging tools are crucial**: Invest in visualization and logging to understand and tune AI behavior during development.

### Further Reading

- **Game Programming Patterns** by Robert Nystrom - Excellent coverage of state patterns
- **Artificial Intelligence for Games** by Ian Millington - Comprehensive AI techniques
- **Behavioral Mathematics for Game AI** by Dave Mark - Utility theory and decision-making
- **GDC Talks** on behavior trees from studios like Naughty Dog and CD Projekt Red

### Practice Projects

1. **Simple Enemy AI**: Create a patrol/chase/attack enemy using FSM
2. **Complex Boss**: Implement a multi-phase boss using combined FSM and BT
3. **Companion System**: Build an AI companion with context-aware behaviors
4. **Stealth AI**: Create guards with detection, investigation, and alert states
5. **RTS Unit AI**: Implement unit behaviors for a real-time strategy game
