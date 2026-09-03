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
origin: old/src/content/docs/gamedev/ecs-architecture.en.md
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

## What is ECS?

Entity Component System (ECS) is a software architecture pattern primarily used in game development and real-time simulation systems. By separating data from logic and organizing code in a data-oriented manner, it achieves high performance and highly scalable system design.

The core philosophy of ECS can be summarized in three key concepts:

- **Entity**: A unique identifier representing an object in the game world
- **Component**: Pure data containers that contain no logic
- **System**: Contains game logic, processes entities with specific component combinations

### Origins and Evolution of ECS

The concept of ECS can be traced back to 2002, when Scott Bilas introduced it at GDC (Game Developers Conference). Since then, this architectural pattern has been widely adopted and developed in the gaming industry:

- **2007**: The Diablo 3 development team adopted an ECS-like architecture
- **2014**: Unity began exploring ECS, which later evolved into DOTS (Data-Oriented Technology Stack)
- **2018**: The Rust game engine Bevy adopted a pure ECS architecture, becoming a model of modern ECS
- **2020**: Unity DOTS was officially released, bringing ECS into mainstream game development

---

## ECS vs OOP: Two Different Ways of Thinking

### Traditional Object-Oriented Programming (OOP) Approach

In traditional object-oriented programming, we typically build game objects through inheritance:

```typescript
// OOP approach: organizing code through inheritance
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
    // Update character logic
  }

  render(): void {
    // Render character
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
    // Handle player input
  }

  private updateInventory(): void {
    // Update inventory
  }

  render(): void {
    // Render player
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
    // AI find target
  }

  private attackTarget(): void {
    // Attack target
  }

  render(): void {
    // Render enemy
  }
}

// Problem: What if we need a flying enemy?
// What if we need a player-controllable enemy?
// The inheritance hierarchy becomes increasingly complex...

class FlyingEnemy extends Enemy {
  private altitude: number = 0;

  update(deltaTime: number): void {
    super.update(deltaTime);
    this.updateFlight();
  }

  private updateFlight(): void {
    // Flight logic
  }
}

// Diamond inheritance problem: flying controllable enemy?
// class FlyingControllableEnemy extends ???
```

### Problems with OOP

Traditional OOP faces several core issues in game development:

1. **Inheritance hierarchy explosion**: As features increase, the inheritance tree becomes deeper and wider
2. **Diamond inheritance problem**: Complexity and ambiguity caused by multiple inheritance
3. **Tight coupling**: Changes to parent classes affect all child classes
4. **Cache unfriendly**: Objects scattered in memory cause frequent cache misses
5. **Difficult to compose**: Unable to flexibly add or remove behaviors at runtime

```
OOP inheritance hierarchy problem illustration:

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
        ?  <- How to handle a flying Boss enemy?
```

### ECS Approach

ECS uses composition over inheritance, defining object characteristics through free combination of components:

```typescript
// ECS approach: defining behavior through composition

// === Component definitions (pure data) ===
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
  target: number | null;  // Target entity ID
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
  items: number[];  // Item entity ID list
  capacity: number;
}

// === Entity is just an ID ===
type Entity = number;

// === World manages all components ===
class World {
  private nextEntityId: number = 0;
  private entities: Set<Entity> = new Set();

  // Component storage (using Map to simulate, actual implementations use more efficient data structures)
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
    // Clean up all components
    this.positions.delete(entity);
    this.velocities.delete(entity);
    this.healths.delete(entity);
    this.playerInputs.delete(entity);
    this.aiControllers.delete(entity);
    this.flyings.delete(entity);
    this.renderables.delete(entity);
    this.inventories.delete(entity);
  }

  // Component operation methods
  addPosition(entity: Entity, position: Position): void {
    this.positions.set(entity, position);
  }

  getPosition(entity: Entity): Position | undefined {
    return this.positions.get(entity);
  }

  // ... other component operation methods

  // Query entities with specific component combinations
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
      // ... other components
      default: return false;
    }
  }
}

// === Creating various types of entities ===
const world = new World();

// Create player: position + velocity + health + player input + renderable + inventory
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

// Create regular enemy: position + velocity + health + AI controller + renderable
function createEnemy(world: World): Entity {
  const enemy = world.createEntity();
  world.addPosition(enemy, { x: 100, y: 100 });
  world.addVelocity(enemy, { vx: 0, vy: 0 });
  world.addHealth(enemy, { current: 50, max: 50 });
  world.addAIController(enemy, { target: null, aggroRange: 100, state: 'idle' });
  world.addRenderable(enemy, { sprite: 'enemy.png', layer: 1, visible: true });
  return enemy;
}

// Create flying enemy: regular enemy + flying component
function createFlyingEnemy(world: World): Entity {
  const enemy = createEnemy(world);
  world.addFlying(enemy, { altitude: 50, maxAltitude: 200, isFlying: true });
  return enemy;
}

// Create flying boss: flying enemy + more health + special abilities
function createFlyingBoss(world: World): Entity {
  const boss = createFlyingEnemy(world);
  // Modify health value
  world.addHealth(boss, { current: 500, max: 500 });
  // Can add more boss-specific components
  return boss;
}

// Create player-controllable enemy (charmed)
function createControllableEnemy(world: World): Entity {
  const enemy = createEnemy(world);
  // Remove AI controller, add player input
  world.removeAIController(enemy);
  world.addPlayerInput(enemy, { moveX: 0, moveY: 0, attack: false, jump: false });
  return enemy;
}
```

### Advantages of ECS

```
ECS composition approach illustration:

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

Any combination, no inheritance needed!
```

---

## Core Concepts Explained

### Entity

Entity is the simplest concept in ECS: it's just a unique identifier (usually an integer) used to associate components.

```typescript
// Various ways to implement entities

// Method 1: Simple integer ID
type Entity = number;

// Method 2: ID with version number (to avoid dangling references when reusing IDs)
interface Entity {
  id: number;      // Index
  generation: number;  // Version number
}

// Method 3: UUID string (suitable for distributed systems)
type Entity = string;

// Entity ID generator
class EntityGenerator {
  private nextId: number = 0;
  private freeList: number[] = [];
  private generations: number[] = [];

  create(): Entity {
    let id: number;

    if (this.freeList.length > 0) {
      // Reuse destroyed ID
      id = this.freeList.pop()!;
    } else {
      // Allocate new ID
      id = this.nextId++;
      this.generations.push(0);
    }

    return {
      id,
      generation: this.generations[id]
    };
  }

  destroy(entity: Entity): void {
    // Increment version number
    this.generations[entity.id]++;
    // Add ID to free list
    this.freeList.push(entity.id);
  }

  isAlive(entity: Entity): boolean {
    return this.generations[entity.id] === entity.generation;
  }
}
```

### Component

Components are pure data containers that only store state, containing no behavioral logic.

```typescript
// Component design principles:
// 1. Only contain data, no methods
// 2. Data should be flat, avoid nested references
// 3. Prefer value types over reference types
// 4. Keep components small and focused

// Good component design
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
  textureId: number;  // Use ID instead of reference
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

// Bad component design
interface BadComponent {
  // Problem 1: Contains behavior
  update(): void;  // Should not have methods

  // Problem 2: Nested objects
  nested: {
    deep: {
      value: number;
    };
  };

  // Problem 3: Reference types
  children: GameObject[];  // Avoid referencing other objects

  // Problem 4: Component too large, unclear responsibilities
  x: number;
  y: number;
  health: number;
  mana: number;
  inventory: Item[];
  // ... too much unrelated data
}

// Tag components: No data, only used for marking
interface Player {}  // Marks this as a player entity
interface Enemy {}   // Marks this as an enemy entity
interface Dead {}    // Marks as dead
interface Invincible {} // Marks invincibility state
```

### System

Systems contain all game logic. They query entities with specific component combinations and process them.

```typescript
// System interface
interface System {
  // Component types the system depends on
  readonly requiredComponents: string[];

  // Update each frame
  update(world: World, deltaTime: number): void;
}

// Movement system: processes all entities with position and velocity
class MovementSystem implements System {
  readonly requiredComponents = ['position', 'velocity'];

  update(world: World, deltaTime: number): void {
    // Query all entities with Position and Velocity components
    const entities = world.query('position', 'velocity');

    for (const entity of entities) {
      const position = world.getPosition(entity)!;
      const velocity = world.getVelocity(entity)!;

      // Update position
      position.x += velocity.x * deltaTime;
      position.y += velocity.y * deltaTime;
    }
  }
}

// Gravity system: applies gravity to entities with gravity component
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

// Collision detection system
class CollisionSystem implements System {
  readonly requiredComponents = ['position', 'collider'];

  update(world: World, deltaTime: number): void {
    const entities = world.query('position', 'collider');
    const count = entities.length;

    // Simple O(n^2) collision detection
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const entityA = entities[i];
        const entityB = entities[j];

        if (this.checkCollision(world, entityA, entityB)) {
          // Emit collision event
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

    // Check layer masks
    if ((colA.layer & colB.mask) === 0 && (colB.layer & colA.mask) === 0) {
      return false;
    }

    // AABB collision detection
    return !(
      posA.x + colA.width < posB.x ||
      posA.x > posB.x + colB.width ||
      posA.y + colA.height < posB.y ||
      posA.y > posB.y + colB.height
    );
  }
}

// Render system
class RenderSystem implements System {
  readonly requiredComponents = ['position', 'sprite'];

  constructor(private renderer: Renderer) {}

  update(world: World, deltaTime: number): void {
    const entities = world.query('position', 'sprite');

    // Sort by layer
    entities.sort((a, b) => {
      const spriteA = world.getSprite(a)!;
      const spriteB = world.getSprite(b)!;
      return spriteA.layer - spriteB.layer;
    });

    // Render
    for (const entity of entities) {
      const position = world.getPosition(entity)!;
      const sprite = world.getSprite(entity)!;

      this.renderer.draw(sprite.textureId, position.x, position.y);
    }
  }
}

// AI system
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
    // Search for targets within range
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

    // Calculate direction toward target
    const dx = targetPos.x - position.x;
    const dy = targetPos.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 20) {
      // Reached attack range
      velocity.x = 0;
      velocity.y = 0;
      ai.state = 'attack';
    } else {
      // Move toward target
      const speed = 50;
      velocity.x = (dx / distance) * speed;
      velocity.y = (dy / distance) * speed;
    }
  }

  private handleAttack(world: World, entity: Entity, ai: AIController): void {
    // Attack logic
  }

  private findTarget(world: World, entity: Entity, range: number): Entity | null {
    // Find player entity within range
    return null;
  }
}
```

### System Execution Order

The execution order of systems is very important and needs careful planning:

```typescript
class GameLoop {
  private systems: System[] = [];
  private world: World;

  constructor() {
    this.world = new World();

    // Add systems in order
    this.systems = [
      // 1. Input processing
      new InputSystem(),

      // 2. AI decision-making
      new AISystem(),

      // 3. Physics-related
      new GravitySystem(),
      new MovementSystem(),
      new CollisionSystem(),

      // 4. Game logic
      new CombatSystem(),
      new HealthSystem(),
      new PickupSystem(),

      // 5. Animation update
      new AnimationSystem(),

      // 6. Rendering (executed last)
      new RenderSystem(renderer),

      // 7. Cleanup
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

## Data Locality and Cache Optimization

One of the core advantages of ECS architecture is its CPU cache-friendly design. Understanding this requires knowledge of modern computer memory hierarchy.

### Memory Hierarchy

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

### OOP Cache Problems

In traditional OOP, objects are typically scattered across heap memory:

```typescript
// OOP memory layout problems

class GameObject {
  x: number;       // 8 bytes
  y: number;       // 8 bytes
  health: number;  // 8 bytes
  mana: number;    // 8 bytes
  name: string;    // pointer + string data
  sprite: Sprite;  // pointer + Sprite data
  children: GameObject[];  // pointer + array + more pointers
}

// Object layout in memory (illustration):
//
// Address 0x1000: GameObject1 { x, y, health, ... }
// Address 0x5000: GameObject2 { x, y, health, ... }  <- Non-contiguous!
// Address 0x8000: Sprite1 { ... }
// Address 0xA000: GameObject3 { x, y, health, ... }
// Address 0xF000: Sprite2 { ... }
//
// When iterating through all objects, CPU needs to jump around memory,
// causing numerous cache misses

function updateAllObjects(objects: GameObject[]): void {
  for (const obj of objects) {
    // Each access to obj.x may cause a cache miss
    // because objects are scattered throughout memory
    obj.x += obj.vx;
    obj.y += obj.vy;
  }
}
```

### ECS Cache-Friendly Design

ECS stores components of the same type in contiguous arrays:

```typescript
// ECS cache-friendly memory layout

// Components stored contiguously by type
class ComponentStorage<T> {
  // Contiguous memory array
  private data: T[] = [];
  // Entity ID to array index mapping
  private entityToIndex: Map<Entity, number> = new Map();
  // Index to entity ID mapping (for swap during deletion)
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

    // Use swap-remove strategy to keep array compact
    const lastIndex = this.data.length - 1;
    if (index !== lastIndex) {
      // Move last element to deleted position
      this.data[index] = this.data[lastIndex];
      const movedEntity = this.indexToEntity[lastIndex];
      this.entityToIndex.set(movedEntity, index);
      this.indexToEntity[index] = movedEntity;
    }

    this.data.pop();
    this.indexToEntity.pop();
    this.entityToIndex.delete(entity);
  }

  // Directly iterate data array
  *iterate(): IterableIterator<[Entity, T]> {
    for (let i = 0; i < this.data.length; i++) {
      yield [this.indexToEntity[i], this.data[i]];
    }
  }

  // Get raw array for batch processing
  getRawData(): T[] {
    return this.data;
  }
}

// Memory layout illustration:
//
// Position array: [pos1, pos2, pos3, pos4, pos5, ...]  <- Contiguous!
// Velocity array: [vel1, vel2, vel3, vel4, vel5, ...]  <- Contiguous!
// Health array:   [hp1,  hp2,  hp3,  ...]              <- Contiguous!
//
// When movement system iterates Position and Velocity,
// CPU can effectively utilize cache prefetching

class OptimizedMovementSystem {
  update(world: World, deltaTime: number): void {
    // Directly access raw arrays for maximum cache efficiency
    const positions = world.positionStorage.getRawData();
    const velocities = world.velocityStorage.getRawData();
    const count = positions.length;

    // Linear traversal of contiguous memory
    for (let i = 0; i < count; i++) {
      positions[i].x += velocities[i].x * deltaTime;
      positions[i].y += velocities[i].y * deltaTime;
    }

    // CPU prefetcher can efficiently preload upcoming data
  }
}
```

### Archetype Storage

More advanced ECS implementations use Archetypes to further optimize memory layout:

```typescript
// Archetype: Collection of entities with the same component combination

type ComponentType = string;

interface Archetype {
  // Component types this archetype contains
  componentTypes: Set<ComponentType>;

  // Storage for each component type
  storage: Map<ComponentType, any[]>;

  // Entity list
  entities: Entity[];
}

class ArchetypeStorage {
  private archetypes: Archetype[] = [];
  private entityArchetype: Map<Entity, Archetype> = new Map();

  // Get or create archetype based on component combination
  getOrCreateArchetype(types: ComponentType[]): Archetype {
    const typeSet = new Set(types);

    // Find existing archetype
    for (const archetype of this.archetypes) {
      if (this.setsEqual(archetype.componentTypes, typeSet)) {
        return archetype;
      }
    }

    // Create new archetype
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

  // Adding a component may require migrating to a new archetype
  addComponent(entity: Entity, type: ComponentType, data: any): void {
    const currentArchetype = this.entityArchetype.get(entity);

    if (currentArchetype) {
      // Get current component types
      const newTypes = new Set(currentArchetype.componentTypes);
      newTypes.add(type);

      // Migrate to new archetype
      const newArchetype = this.getOrCreateArchetype([...newTypes]);
      this.migrateEntity(entity, currentArchetype, newArchetype);

      // Add new component
      newArchetype.storage.get(type)!.push(data);
    } else {
      // New entity
      const archetype = this.getOrCreateArchetype([type]);
      archetype.entities.push(entity);
      archetype.storage.get(type)!.push(data);
      this.entityArchetype.set(entity, archetype);
    }
  }

  // Query matching archetypes
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

    // Copy existing components to new archetype
    for (const type of from.componentTypes) {
      const data = from.storage.get(type)![index];
      if (to.componentTypes.has(type)) {
        to.storage.get(type)!.push(data);
      }
    }

    // Remove from old archetype (using swap-remove)
    this.swapRemove(from, index);

    // Add to new archetype
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

// Archetype memory layout illustration:
//
// Archetype A (Position + Velocity):
// ┌───────────────────────────────────────┐
// │ Entities: [e1, e2, e3, e4]            │
// │ Position: [p1, p2, p3, p4]  <- Contiguous!  │
// │ Velocity: [v1, v2, v3, v4]  <- Contiguous!  │
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
// Querying (Position + Velocity) matches both A and B
// Data within each archetype is contiguous, extremely cache efficient
```

---

## Real-World Framework Implementations

### Unity DOTS

Unity DOTS (Data-Oriented Technology Stack) is Unity's official ECS implementation:

```csharp
// Unity DOTS example

using Unity.Entities;
using Unity.Mathematics;
using Unity.Transforms;
using Unity.Burst;
using Unity.Jobs;

// Component definitions
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
    // Tag component, no data
}

// System definition
[BurstCompile]  // Optimized using Burst compiler
public partial struct MovementSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        float deltaTime = SystemAPI.Time.DeltaTime;

        // Use Job system for parallel processing
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

    // Automatically matches all entities with LocalTransform and MoveSpeed
    public void Execute(ref LocalTransform transform, in MoveSpeed speed)
    {
        transform = transform.Translate(
            new float3(0, 0, speed.Value * DeltaTime)
        );
    }
}

// Rotation system
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

// Creating entities
public partial struct SpawnerSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        var ecb = new EntityCommandBuffer(Allocator.Temp);

        // Create enemy entity
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

// Querying and filtering
public partial struct TargetingSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        // Query all enemies
        foreach (var (transform, entity) in
                 SystemAPI.Query<RefRO<LocalTransform>>()
                          .WithAll<Enemy>()
                          .WithEntityAccess())
        {
            // Process enemies
            float3 position = transform.ValueRO.Position;
            // ...
        }

        // Exclude certain components
        foreach (var transform in
                 SystemAPI.Query<RefRW<LocalTransform>>()
                          .WithNone<Enemy>()  // Exclude enemies
                          .WithAll<MoveSpeed>())  // Must have move speed
        {
            // Process non-enemy movable entities
        }
    }
}
```

### Bevy ECS (Rust)

Bevy is the most popular game engine in the Rust language, adopting a pure ECS architecture:

```rust
// Bevy ECS example

use bevy::prelude::*;

// Component definitions
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
struct Player;  // Tag component

#[derive(Component)]
struct Enemy;

// Resources (global singleton data)
#[derive(Resource)]
struct GameState {
    score: u32,
    level: u32,
}

// Events
#[derive(Event)]
struct DamageEvent {
    target: Entity,
    amount: f32,
}

// System definitions
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

// Query with filtering
fn player_input_system(
    keyboard: Res<ButtonInput<KeyCode>>,
    mut query: Query<&mut Velocity, With<Player>>,  // Only query entities with Player tag
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

// Complex query: Enemy AI
fn enemy_ai_system(
    player_query: Query<&Position, With<Player>>,
    mut enemy_query: Query<(&Position, &mut Velocity), With<Enemy>>,
) {
    // Get player position
    let Ok(player_pos) = player_query.get_single() else {
        return;
    };

    // Make all enemies track the player
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

// Event handling
fn damage_system(
    mut events: EventReader<DamageEvent>,
    mut health_query: Query<&mut Health>,
    mut commands: Commands,
) {
    for event in events.read() {
        if let Ok(mut health) = health_query.get_mut(event.target) {
            health.current -= event.amount;

            if health.current <= 0.0 {
                // Destroy entity
                commands.entity(event.target).despawn();
            }
        }
    }
}

// Spawn enemies
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
            // Bevy's render components
            SpriteBundle {
                texture: asset_server.load("enemy.png"),
                ..default()
            },
        ));
    }
}

// Main function
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

// System scheduling and dependencies
fn main_with_ordering() {
    App::new()
        .add_plugins(DefaultPlugins)
        .add_systems(Update, (
            // Use chain() to define order
            (
                player_input_system,
                enemy_ai_system,
            ).chain(),

            // These can run in parallel
            movement_system,

            // Must run after movement
            collision_system.after(movement_system),

            // After all other systems
            damage_system.after(collision_system),
        ))
        .run();
}
```

### TypeScript ECS Implementation

A simple but complete TypeScript ECS implementation:

```typescript
// Complete TypeScript ECS framework

// ===== Core type definitions =====

type Entity = number;
type ComponentType = new (...args: any[]) => any;
type ComponentInstance = object;

// ===== Component storage =====

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

// ===== World class =====

class World {
  private nextEntityId: Entity = 0;
  private entities: Set<Entity> = new Set();
  private componentStores: Map<ComponentType, ComponentStore<any>> = new Map();
  private systems: System[] = [];
  private eventQueue: Array<{ type: string; data: any }> = [];
  private eventHandlers: Map<string, Array<(data: any) => void>> = new Map();

  // Entity management
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

  // Component management
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

  // Query
  query(...componentTypes: ComponentType[]): Entity[] {
    if (componentTypes.length === 0) {
      return Array.from(this.entities);
    }

    // Start filtering from the smallest storage
    const stores = componentTypes
      .map(type => this.componentStores.get(type))
      .filter((store): store is ComponentStore<any> => store !== undefined)
      .sort((a, b) => a.size - b.size);

    if (stores.length !== componentTypes.length) {
      return []; // Some component types don't exist
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

  // System management
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

    // Process event queue
    this.processEvents();
  }

  // Event system
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

// ===== System interface =====

interface System {
  update(world: World, deltaTime: number): void;
  onAdd?(world: World): void;
  onRemove?(world: World): void;
}

// ===== Component definitions =====

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

class Player {}  // Tag component
class Enemy {}

class AIController {
  constructor(
    public state: 'idle' | 'chase' | 'attack' = 'idle',
    public target: Entity | null = null,
    public aggroRange: number = 100
  ) {}
}

// ===== System implementations =====

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
    // Clear screen
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    // Render all entities with sprites
    const entities = world.query(Position, Sprite);

    for (const entity of entities) {
      const pos = world.getComponent(entity, Position)!;
      const sprite = world.getComponent(entity, Sprite)!;

      // Simplified rendering: draw rectangles
      this.ctx.fillStyle = world.hasComponent(entity, Player) ? 'blue' : 'red';
      this.ctx.fillRect(pos.x, pos.y, sprite.width, sprite.height);
    }
  }
}

// ===== Game example =====

class Game {
  private world: World;
  private lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.world = new World();

    // Add systems
    this.world
      .addSystem(new AISystem())
      .addSystem(new MovementSystem())
      .addSystem(new CollisionSystem())
      .addSystem(new RenderSystem(canvas));

    // Set up event handlers
    this.world.on('collision', this.handleCollision.bind(this));
    this.world.on('attack', this.handleAttack.bind(this));

    // Create entities
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

// Usage
const canvas = document.getElementById('game') as HTMLCanvasElement;
const game = new Game(canvas);
game.start();
```

---

## Performance Comparison and Advantages

### Benchmark Comparison

Here's a simple performance comparison example:

```typescript
// Performance test: OOP vs ECS

// OOP implementation
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

// ECS implementation (using SoA - Structure of Arrays)
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

// Performance test
function benchmark(): void {
  const entityCount = 100000;
  const iterations = 1000;
  const dt = 0.016;

  // OOP test
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

  // ECS test
  const ecsWorld = new ECSWorld(entityCount);

  console.time('ECS');
  for (let i = 0; i < iterations; i++) {
    ecsWorld.update(dt);
  }
  console.timeEnd('ECS');
}

benchmark();

// Typical results (actual results vary by environment):
// OOP: ~2000ms
// ECS: ~300ms
//
// ECS is about 6-7 times faster!
```

### Sources of Performance Advantages

1. **Cache Efficiency**
   - ECS's contiguous memory layout maximizes CPU cache utilization
   - Reduces cache misses, significantly improving data access speed

2. **Vectorization**
   - Modern CPUs support SIMD (Single Instruction Multiple Data) operations
   - ECS's array layout naturally suits SIMD optimization

3. **Parallel Processing**
   - Systems are typically independent of each other
   - Easy to implement multi-threaded parallel updates

4. **Less Indirection**
   - OOP frequently uses pointers/references
   - ECS uses indices to directly access arrays

### SIMD Optimization Example

```typescript
// Using WebAssembly SIMD to optimize ECS

// Assuming compilation to WASM using AssemblyScript

// Traditional scalar implementation
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

// SIMD implementation concept (pseudocode)
function updateMovementSIMD(
  x: Float32Array,
  y: Float32Array,
  vx: Float32Array,
  vy: Float32Array,
  dt: number,
  count: number
): void {
  // Process 4 floats at a time
  const dtVec = f32x4.splat(dt);  // [dt, dt, dt, dt]

  for (let i = 0; i < count; i += 4) {
    // Load 4 x values
    const xVec = f32x4.load(x, i);
    // Load 4 vx values
    const vxVec = f32x4.load(vx, i);
    // Calculate x + vx * dt
    const newX = f32x4.add(xVec, f32x4.mul(vxVec, dtVec));
    // Store result
    f32x4.store(x, i, newX);

    // Same for y
    const yVec = f32x4.load(y, i);
    const vyVec = f32x4.load(vy, i);
    const newY = f32x4.add(yVec, f32x4.mul(vyVec, dtVec));
    f32x4.store(y, i, newY);
  }
}

// SIMD can achieve an additional 2-4x performance improvement
```

---

## Advanced Patterns and Techniques

### Command Buffer

Modifying entity structure during iteration can cause problems. Command buffers defer the execution of these operations:

```typescript
// Command buffer implementation

type Command =
  | { type: 'createEntity' }
  | { type: 'destroyEntity'; entity: Entity }
  | { type: 'addComponent'; entity: Entity; componentType: ComponentType; data: any }
  | { type: 'removeComponent'; entity: Entity; componentType: ComponentType };

class CommandBuffer {
  private commands: Command[] = [];
  private createdEntities: Entity[] = [];

  createEntity(): Entity {
    // Return a temporary placeholder
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

    // Cleanup
    this.commands = [];
    this.createdEntities = [];
  }

  private resolveEntity(entity: Entity): Entity {
    if (entity < 0) {
      // This is a placeholder, resolve to actually created entity
      return this.createdEntities[-entity - 1];
    }
    return entity;
  }
}

// Usage example
class SpawnerSystem implements System {
  update(world: World, deltaTime: number): void {
    const buffer = new CommandBuffer();

    // Safely create new entities during query
    const spawners = world.query(Position, Spawner);

    for (const spawner of spawners) {
      const spawnData = world.getComponent(spawner, Spawner)!;

      if (spawnData.cooldown <= 0) {
        const pos = world.getComponent(spawner, Position)!;

        // Create new entity (deferred execution)
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

    // Execute all commands after iteration ends
    buffer.execute(world);
  }
}
```

### Relationship Components

Handling relationships between entities:

```typescript
// Relationship component pattern

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

// Hierarchy system
class HierarchySystem implements System {
  update(world: World, deltaTime: number): void {
    // Update positions of all child entities
    const entities = world.query(Position, Parent);

    for (const entity of entities) {
      const parent = world.getComponent(entity, Parent)!;

      if (!world.isAlive(parent.entity)) {
        // Parent entity destroyed, destroy child entity
        world.destroyEntity(entity);
        continue;
      }

      const parentPos = world.getComponent(parent.entity, Position);
      const childPos = world.getComponent(entity, Position)!;

      if (parentPos) {
        // Simple following (can be extended to more complex transforms)
        childPos.x = parentPos.x;
        childPos.y = parentPos.y;
      }
    }
  }
}

// Creating hierarchy
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

### State Machine Component

```typescript
// State machine in ECS

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

// Enemy state definitions
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
    // Detect player
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
    // Attack logic
    const ai = world.getComponent(entity, AIController)!;

    if (ai.target && world.isAlive(ai.target)) {
      world.emit('attack', { attacker: entity, target: ai.target, damage: 10 });
    }

    // Check if chasing is needed
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

// State machine system
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

// Create enemy using state machine
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

## Common Pitfalls and Best Practices

### Common Pitfalls

1. **Components Too Large**

```typescript
// Wrong: Component contains too much data
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
  // ... more
}

// Correct: Split into multiple small components
class Position { x: number; y: number; }
class Velocity { vx: number; vy: number; }
class Health { current: number; max: number; }
class Mana { current: number; max: number; }
class Experience { current: number; level: number; }
// ...
```

2. **Storing Logic in Components**

```typescript
// Wrong: Component contains behavior
class BadComponent {
  value: number;

  update(): void {  // Should not be in component
    this.value++;
  }
}

// Correct: Component is just data
class GoodComponent {
  value: number;
}

// Logic in system
class ValueUpdateSystem implements System {
  update(world: World, deltaTime: number): void {
    for (const entity of world.query(GoodComponent)) {
      const comp = world.getComponent(entity, GoodComponent)!;
      comp.value++;
    }
  }
}
```

3. **Frequent Component Add/Remove**

```typescript
// Wrong: Add/remove components every frame
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

// Correct: Use flag fields or state components
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

4. **Tight Coupling Between Systems**

```typescript
// Wrong: System directly calls other systems
class BadDamageSystem implements System {
  constructor(private healthSystem: HealthSystem) {}

  update(world: World, deltaTime: number): void {
    // Directly calling other system
    this.healthSystem.applyDamage(...);
  }
}

// Correct: Communicate through events or components
class GoodDamageSystem implements System {
  update(world: World, deltaTime: number): void {
    // Communicate through events
    world.emit('damage', { target, amount });
  }
}

class HealthSystem implements System {
  onAdd(world: World): void {
    world.on('damage', this.handleDamage.bind(this));
  }

  private handleDamage(data: { target: Entity; amount: number }): void {
    // Handle damage
  }
}
```

### Best Practices

1. **Keep components small and focused**
2. **Use tag components for filtering**
3. **Leverage query caching for performance optimization**
4. **Plan system execution order carefully**
5. **Use command buffers for structural changes**
6. **Decouple systems through event systems**
7. **Use archetype optimization when appropriate**

---

## Interview Key Points

### Frequently Asked Interview Questions

1. **What is ECS architecture? How does it differ from traditional OOP?**

   Core Answer:
   - ECS separates data (components) from logic (systems)
   - Uses composition over inheritance
   - Data-oriented design, cache-friendly

2. **How does ECS improve performance?**

   Key Points:
   - Contiguous memory layout
   - Reduces cache misses
   - Easy to optimize with SIMD
   - Easy to parallelize

3. **Explain the responsibilities of Entity, Component, and System**

   - Entity: Unique identifier
   - Component: Pure data container
   - System: Contains all game logic

4. **How do you implement relationships between entities in ECS?**

   - Use relationship components (Parent, Children)
   - Store entity references/IDs
   - Use queries to match related entities

5. **What are the disadvantages of ECS?**

   - Steeper learning curve
   - Relatively difficult to debug
   - Requires more upfront design
   - May be over-engineering for simple projects

6. **What scenarios are suitable/unsuitable for ECS?**

   Suitable:
   - Large numbers of similar entities
   - Performance-critical applications
   - Need for flexible behavior composition

   Unsuitable:
   - Simple applications
   - Small number of entities
   - Team unfamiliar with ECS

---

## Further Reading

### Recommended Resources

1. **Books**
   - "Game Programming Patterns" - Robert Nystrom
   - "Data-Oriented Design" - Richard Fabian

2. **Articles**
   - [Entity Systems Wiki](http://entity-systems.wikidot.com/)
   - [Bevy ECS Introduction](https://bevyengine.org/learn/book/getting-started/ecs/)
   - [Unity DOTS Documentation](https://docs.unity3d.com/Packages/com.unity.entities@latest)

3. **Videos**
   - GDC: "Overwatch Gameplay Architecture and Netcode"
   - "Data-Oriented Design and C++" by Mike Acton

4. **Open Source Projects**
   - [Bevy](https://github.com/bevyengine/bevy) - Rust
   - [Flecs](https://github.com/SanderMertens/flecs) - C/C++
   - [bitECS](https://github.com/NateTheGreatt/bitECS) - JavaScript

### Advanced Topics

- Network synchronization and ECS
- ECS integration with physics engines
- Multi-threaded ECS scheduling
- ECS serialization and save systems
- Hot reloading and ECS

---

## Summary

ECS architecture is a powerful design pattern in game development that achieves through data-oriented design:

1. **High Performance**: Cache-friendly memory layout
2. **High Flexibility**: Free combination of components
3. **Easy to Extend**: Adding new features doesn't affect existing code
4. **Easy to Parallelize**: Systems are naturally parallelizable

However, ECS is not a silver bullet. When choosing an architecture, you need to weigh trade-offs based on project scale, team experience, and specific requirements. For high-performance games that need to handle large numbers of similar entities, ECS is an excellent choice.

Mastering ECS helps you build more efficient game systems and deepens your understanding of data-oriented design, a way of thinking that's becoming increasingly important in modern high-performance computing.
