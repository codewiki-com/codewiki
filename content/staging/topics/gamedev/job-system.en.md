---
title: Multi-threaded Job System
description: Master multi-threaded job systems for parallel game processing, including work stealing, dependencies, and data-oriented design
track: gamedev
section: performance
difficulty: advanced
tags:
  - job system
  - multithreading
  - parallel processing
  - work stealing
  - optimization
  - ECS
status: imported
origin: old/src/content/docs/gamedev/job-system.en.md
divergence: 0.276
issues:
  - h1-in-body
legacy:
  category: GameDev
  subcategory: Optimization
  order: 58
  lastUpdated: 2026-01-22
---

Modern games require efficient use of multiple CPU cores. A job system enables parallel processing of game logic, physics, AI, and rendering preparation while avoiding the pitfalls of traditional threading.

## Job System Fundamentals

### Why Job Systems?

Traditional threading creates problems: manual thread management, complex synchronization, and poor load balancing. Job systems solve these by:

1. **Automatic distribution**: Jobs are assigned to available threads
2. **Dependency management**: Jobs declare dependencies, executed in correct order
3. **Work stealing**: Idle threads take work from busy ones
4. **Cache efficiency**: Data-oriented design improves memory access patterns

### Basic Job Interface

```typescript
interface Job {
  execute(): void;
  dependencies?: Job[];
  priority?: number;
}

interface JobHandle {
  isComplete(): boolean;
  complete(): void;  // Block until done
}

interface JobScheduler {
  schedule(job: Job): JobHandle;
  scheduleParallel(jobs: Job[]): JobHandle;
  scheduleBatch<T>(
    data: T[],
    batchSize: number,
    processor: (items: T[], startIndex: number) => void
  ): JobHandle;
}
```

## Core Implementation

### Worker Thread Pool

```typescript
class WorkerThread {
  private thread: Worker;
  private busy: boolean = false;
  private currentJob: Job | null = null;

  constructor(private scheduler: JobScheduler, private id: number) {
    this.thread = new Worker('job-worker.js');
    this.thread.onmessage = this.onJobComplete.bind(this);
  }

  assign(job: Job): void {
    this.busy = true;
    this.currentJob = job;
    this.thread.postMessage({ type: 'execute', job: this.serializeJob(job) });
  }

  private onJobComplete(event: MessageEvent): void {
    this.busy = false;
    this.currentJob = null;
    this.scheduler.onJobComplete(this);
  }

  isBusy(): boolean {
    return this.busy;
  }

  private serializeJob(job: Job): any {
    // Serialize job for worker
    return { id: job.id, data: job.data };
  }
}

class ThreadPool {
  private workers: WorkerThread[] = [];
  private jobQueue: Job[] = [];

  constructor(threadCount: number = navigator.hardwareConcurrency - 1) {
    for (let i = 0; i < threadCount; i++) {
      this.workers.push(new WorkerThread(this, i));
    }
  }

  submit(job: Job): void {
    const availableWorker = this.workers.find(w => !w.isBusy());
    if (availableWorker) {
      availableWorker.assign(job);
    } else {
      this.jobQueue.push(job);
    }
  }

  onJobComplete(worker: WorkerThread): void {
    if (this.jobQueue.length > 0) {
      const nextJob = this.jobQueue.shift()!;
      worker.assign(nextJob);
    }
  }
}
```

### Job Scheduler with Dependencies

```typescript
class JobSchedulerImpl implements JobScheduler {
  private threadPool: ThreadPool;
  private pendingJobs: Map<number, JobContext> = new Map();
  private completedJobs: Set<number> = new Set();
  private nextJobId: number = 0;

  constructor(threadCount?: number) {
    this.threadPool = new ThreadPool(threadCount);
  }

  schedule(job: Job): JobHandle {
    const jobId = this.nextJobId++;
    const context: JobContext = {
      job,
      id: jobId,
      dependencyCount: job.dependencies?.length ?? 0,
      dependents: [],
      handle: new JobHandleImpl(jobId, this)
    };

    this.pendingJobs.set(jobId, context);

    // Register as dependent of dependencies
    if (job.dependencies) {
      for (const dep of job.dependencies) {
        const depContext = this.pendingJobs.get(dep.id);
        if (depContext) {
          depContext.dependents.push(context);
        } else if (this.completedJobs.has(dep.id)) {
          context.dependencyCount--;
        }
      }
    }

    // Schedule if no dependencies
    if (context.dependencyCount === 0) {
      this.submitJob(context);
    }

    return context.handle;
  }

  scheduleParallel(jobs: Job[]): JobHandle {
    const handles = jobs.map(job => this.schedule(job));
    return new CompositeJobHandle(handles);
  }

  scheduleBatch<T>(
    data: T[],
    batchSize: number,
    processor: (items: T[], startIndex: number) => void
  ): JobHandle {
    const jobs: Job[] = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const startIndex = i;

      jobs.push({
        execute: () => processor(batch, startIndex)
      });
    }

    return this.scheduleParallel(jobs);
  }

  private submitJob(context: JobContext): void {
    this.threadPool.submit({
      ...context.job,
      onComplete: () => this.onJobComplete(context)
    });
  }

  onJobComplete(context: JobContext): void {
    this.completedJobs.add(context.id);
    this.pendingJobs.delete(context.id);
    context.handle.markComplete();

    // Notify dependents
    for (const dependent of context.dependents) {
      dependent.dependencyCount--;
      if (dependent.dependencyCount === 0) {
        this.submitJob(dependent);
      }
    }
  }
}

interface JobContext {
  job: Job;
  id: number;
  dependencyCount: number;
  dependents: JobContext[];
  handle: JobHandleImpl;
}

class JobHandleImpl implements JobHandle {
  private completed: boolean = false;
  private waiters: (() => void)[] = [];

  constructor(
    private id: number,
    private scheduler: JobSchedulerImpl
  ) {}

  isComplete(): boolean {
    return this.completed;
  }

  complete(): void {
    if (this.completed) return;

    // Spin-wait or yield until complete
    while (!this.completed) {
      // In real implementation, would yield to other work
    }
  }

  markComplete(): void {
    this.completed = true;
    for (const waiter of this.waiters) {
      waiter();
    }
  }
}

class CompositeJobHandle implements JobHandle {
  constructor(private handles: JobHandle[]) {}

  isComplete(): boolean {
    return this.handles.every(h => h.isComplete());
  }

  complete(): void {
    for (const handle of this.handles) {
      handle.complete();
    }
  }
}
```

## Work Stealing Queue

Work stealing improves load balancing by allowing idle threads to "steal" jobs from busy threads.

```typescript
class WorkStealingDeque<T> {
  private items: T[] = [];
  private head: number = 0;
  private tail: number = 0;

  // Owner thread pushes/pops from tail (LIFO for cache locality)
  push(item: T): void {
    this.items[this.tail] = item;
    this.tail++;
  }

  pop(): T | null {
    if (this.tail === this.head) return null;

    this.tail--;
    const item = this.items[this.tail];

    if (this.tail < this.head) {
      this.tail = this.head;
      return null;
    }

    return item;
  }

  // Other threads steal from head (FIFO)
  steal(): T | null {
    const h = this.head;
    const t = this.tail;

    if (h >= t) return null;

    const item = this.items[h];

    // CAS operation in real implementation
    this.head = h + 1;

    return item;
  }

  isEmpty(): boolean {
    return this.head >= this.tail;
  }

  size(): number {
    return Math.max(0, this.tail - this.head);
  }
}

class WorkStealingScheduler {
  private workers: WorkerContext[] = [];
  private globalQueue: Job[] = [];

  constructor(threadCount: number) {
    for (let i = 0; i < threadCount; i++) {
      this.workers.push({
        id: i,
        localQueue: new WorkStealingDeque<Job>(),
        busy: false
      });
    }
  }

  schedule(job: Job): void {
    // Add to current worker's local queue or global queue
    const currentWorker = this.getCurrentWorker();
    if (currentWorker) {
      currentWorker.localQueue.push(job);
    } else {
      this.globalQueue.push(job);
    }
  }

  getNextJob(workerId: number): Job | null {
    const worker = this.workers[workerId];

    // 1. Try local queue first (cache friendly)
    let job = worker.localQueue.pop();
    if (job) return job;

    // 2. Try global queue
    if (this.globalQueue.length > 0) {
      return this.globalQueue.shift()!;
    }

    // 3. Try stealing from other workers
    for (const other of this.workers) {
      if (other.id !== workerId) {
        job = other.localQueue.steal();
        if (job) return job;
      }
    }

    return null;
  }

  private getCurrentWorker(): WorkerContext | null {
    // In real implementation, use thread-local storage
    return null;
  }
}

interface WorkerContext {
  id: number;
  localQueue: WorkStealingDeque<Job>;
  busy: boolean;
}
```

## Parallel Patterns

### Parallel For

```typescript
class ParallelFor {
  private scheduler: JobScheduler;

  constructor(scheduler: JobScheduler) {
    this.scheduler = scheduler;
  }

  execute<T>(
    items: T[],
    processor: (item: T, index: number) => void,
    options: ParallelOptions = {}
  ): JobHandle {
    const batchSize = options.batchSize ?? Math.ceil(items.length / navigator.hardwareConcurrency);

    return this.scheduler.scheduleBatch(
      items.map((item, index) => ({ item, index })),
      batchSize,
      (batch) => {
        for (const { item, index } of batch) {
          processor(item, index);
        }
      }
    );
  }

  // Parallel for with index range
  range(
    start: number,
    end: number,
    processor: (index: number) => void,
    options: ParallelOptions = {}
  ): JobHandle {
    const count = end - start;
    const batchSize = options.batchSize ?? Math.ceil(count / navigator.hardwareConcurrency);
    const jobs: Job[] = [];

    for (let i = start; i < end; i += batchSize) {
      const batchStart = i;
      const batchEnd = Math.min(i + batchSize, end);

      jobs.push({
        execute: () => {
          for (let j = batchStart; j < batchEnd; j++) {
            processor(j);
          }
        }
      });
    }

    return this.scheduler.scheduleParallel(jobs);
  }
}

interface ParallelOptions {
  batchSize?: number;
  priority?: number;
}
```

### Map-Reduce

```typescript
class ParallelMapReduce<TInput, TMapped, TResult> {
  private scheduler: JobScheduler;

  constructor(scheduler: JobScheduler) {
    this.scheduler = scheduler;
  }

  execute(
    data: TInput[],
    mapper: (item: TInput) => TMapped,
    reducer: (a: TMapped, b: TMapped) => TMapped,
    options: { batchSize?: number } = {}
  ): Promise<TMapped> {
    const batchSize = options.batchSize ?? 64;

    return new Promise((resolve) => {
      // Map phase
      const mappedBatches: TMapped[][] = [];

      const mapJobs = this.createMapJobs(data, mapper, batchSize, mappedBatches);
      const mapHandle = this.scheduler.scheduleParallel(mapJobs);

      // Create reduce chain
      this.scheduleReducePhase(mapHandle, mappedBatches, reducer, resolve);
    });
  }

  private createMapJobs(
    data: TInput[],
    mapper: (item: TInput) => TMapped,
    batchSize: number,
    results: TMapped[][]
  ): Job[] {
    const jobs: Job[] = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batchIndex = Math.floor(i / batchSize);
      const batch = data.slice(i, i + batchSize);

      jobs.push({
        execute: () => {
          results[batchIndex] = batch.map(mapper);
        }
      });
    }

    return jobs;
  }

  private scheduleReducePhase(
    mapHandle: JobHandle,
    mappedBatches: TMapped[][],
    reducer: (a: TMapped, b: TMapped) => TMapped,
    resolve: (result: TMapped) => void
  ): void {
    // After map completes, reduce in parallel tree fashion
    const reduceJob: Job = {
      dependencies: [mapHandle as any],
      execute: () => {
        let results = mappedBatches.map(batch =>
          batch.reduce(reducer)
        );

        while (results.length > 1) {
          const newResults: TMapped[] = [];
          for (let i = 0; i < results.length; i += 2) {
            if (i + 1 < results.length) {
              newResults.push(reducer(results[i], results[i + 1]));
            } else {
              newResults.push(results[i]);
            }
          }
          results = newResults;
        }

        resolve(results[0]);
      }
    };

    this.scheduler.schedule(reduceJob);
  }
}
```

## Game-Specific Job Patterns

### Transform Update Jobs

```typescript
interface Transform {
  position: Float32Array;  // [x, y, z]
  rotation: Float32Array;  // [x, y, z, w] quaternion
  scale: Float32Array;     // [x, y, z]
  localMatrix: Float32Array;  // 4x4 matrix
  worldMatrix: Float32Array;  // 4x4 matrix
  parent: number;  // Parent index or -1
  dirty: boolean;
}

class TransformSystem {
  private transforms: Transform[] = [];
  private scheduler: JobScheduler;
  private parallelFor: ParallelFor;

  constructor(scheduler: JobScheduler) {
    this.scheduler = scheduler;
    this.parallelFor = new ParallelFor(scheduler);
  }

  updateTransforms(): JobHandle {
    // Phase 1: Update local matrices (fully parallel)
    const localJob = this.parallelFor.range(
      0,
      this.transforms.length,
      (i) => {
        const t = this.transforms[i];
        if (t.dirty) {
          this.updateLocalMatrix(t);
        }
      }
    );

    // Phase 2: Update world matrices (hierarchical, parallel per level)
    const worldJob: Job = {
      dependencies: [localJob as any],
      execute: () => {
        // Sort by hierarchy depth for parallel processing
        const levels = this.groupByHierarchyLevel();

        for (const level of levels) {
          // Each level can be processed in parallel
          for (const index of level) {
            this.updateWorldMatrix(index);
          }
        }
      }
    };

    return this.scheduler.schedule(worldJob);
  }

  private updateLocalMatrix(transform: Transform): void {
    // Compose TRS matrix
    const m = transform.localMatrix;
    // ... matrix composition from position, rotation, scale
  }

  private updateWorldMatrix(index: number): void {
    const transform = this.transforms[index];
    if (transform.parent >= 0) {
      const parent = this.transforms[transform.parent];
      // worldMatrix = parent.worldMatrix * localMatrix
      this.multiplyMatrices(
        transform.worldMatrix,
        parent.worldMatrix,
        transform.localMatrix
      );
    } else {
      // Copy local to world
      transform.worldMatrix.set(transform.localMatrix);
    }
  }

  private groupByHierarchyLevel(): number[][] {
    const levels: number[][] = [];
    const depths: number[] = new Array(this.transforms.length).fill(-1);

    const getDepth = (index: number): number => {
      if (depths[index] >= 0) return depths[index];

      const t = this.transforms[index];
      if (t.parent < 0) {
        depths[index] = 0;
      } else {
        depths[index] = getDepth(t.parent) + 1;
      }

      return depths[index];
    };

    for (let i = 0; i < this.transforms.length; i++) {
      const depth = getDepth(i);
      if (!levels[depth]) levels[depth] = [];
      levels[depth].push(i);
    }

    return levels;
  }

  private multiplyMatrices(out: Float32Array, a: Float32Array, b: Float32Array): void {
    // 4x4 matrix multiplication
  }
}
```

### Physics Update Jobs

```typescript
class PhysicsJobSystem {
  private bodies: RigidBody[] = [];
  private broadphase: SpatialHash<RigidBody>;
  private scheduler: JobScheduler;

  constructor(scheduler: JobScheduler) {
    this.scheduler = scheduler;
    this.broadphase = new SpatialHash(10);
  }

  step(deltaTime: number): JobHandle {
    // Phase 1: Integrate velocities (parallel)
    const integrateJob = this.scheduler.scheduleBatch(
      this.bodies,
      64,
      (batch) => {
        for (const body of batch) {
          this.integrateVelocity(body, deltaTime);
        }
      }
    );

    // Phase 2: Broadphase collision detection (parallel)
    const broadphaseJob: Job = {
      dependencies: [integrateJob as any],
      execute: () => {
        this.broadphase.clear();
        for (const body of this.bodies) {
          this.broadphase.insert(body, body.bounds);
        }
      }
    };

    // Phase 3: Narrowphase collision detection (parallel)
    const pairs: CollisionPair[] = [];
    const narrowphaseJob: Job = {
      dependencies: [this.scheduler.schedule(broadphaseJob) as any],
      execute: () => {
        // Collect potential collision pairs
        for (const body of this.bodies) {
          const nearby = this.broadphase.query(body.bounds);
          for (const other of nearby) {
            if (body.id < other.id) {
              pairs.push({ a: body, b: other });
            }
          }
        }
      }
    };

    // Phase 4: Collision resolution (sequential for stability)
    const resolveJob: Job = {
      dependencies: [this.scheduler.schedule(narrowphaseJob) as any],
      execute: () => {
        for (const pair of pairs) {
          this.resolveCollision(pair.a, pair.b);
        }
      }
    };

    // Phase 5: Integrate positions (parallel)
    const finalIntegrateJob: Job = {
      dependencies: [this.scheduler.schedule(resolveJob) as any],
      execute: () => {
        this.scheduler.scheduleBatch(
          this.bodies,
          64,
          (batch) => {
            for (const body of batch) {
              this.integratePosition(body, deltaTime);
            }
          }
        );
      }
    };

    return this.scheduler.schedule(finalIntegrateJob);
  }

  private integrateVelocity(body: RigidBody, dt: number): void {
    // Apply gravity and forces
    body.velocity.y += -9.8 * dt;
  }

  private integratePosition(body: RigidBody, dt: number): void {
    body.position.x += body.velocity.x * dt;
    body.position.y += body.velocity.y * dt;
    body.position.z += body.velocity.z * dt;
  }

  private resolveCollision(a: RigidBody, b: RigidBody): void {
    // Collision response
  }
}

interface RigidBody {
  id: number;
  position: Vector3;
  velocity: Vector3;
  bounds: AABB;
}

interface CollisionPair {
  a: RigidBody;
  b: RigidBody;
}
```

### AI Update Jobs

```typescript
class AIJobSystem {
  private agents: AIAgent[] = [];
  private scheduler: JobScheduler;
  private parallelFor: ParallelFor;

  constructor(scheduler: JobScheduler) {
    this.scheduler = scheduler;
    this.parallelFor = new ParallelFor(scheduler);
  }

  update(deltaTime: number, world: World): JobHandle {
    // Perception can run fully parallel
    const perceptionJob = this.parallelFor.execute(
      this.agents,
      (agent) => {
        this.updatePerception(agent, world);
      },
      { batchSize: 16 }
    );

    // Decision making (parallel, but may have shared state)
    const decisionJob: Job = {
      dependencies: [perceptionJob as any],
      execute: () => {
        this.parallelFor.execute(
          this.agents,
          (agent) => {
            this.updateDecision(agent);
          },
          { batchSize: 32 }
        );
      }
    };

    // Action execution (may need serialization for some actions)
    const actionJob: Job = {
      dependencies: [this.scheduler.schedule(decisionJob) as any],
      execute: () => {
        for (const agent of this.agents) {
          this.executeAction(agent, deltaTime);
        }
      }
    };

    return this.scheduler.schedule(actionJob);
  }

  private updatePerception(agent: AIAgent, world: World): void {
    // Gather information about nearby entities
    agent.nearbyEnemies = world.queryRadius(agent.position, agent.sightRange);
    agent.nearbyAllies = world.queryAllies(agent.position, agent.sightRange);
  }

  private updateDecision(agent: AIAgent): void {
    // Run behavior tree or state machine
    agent.currentAction = agent.behaviorTree.evaluate();
  }

  private executeAction(agent: AIAgent, deltaTime: number): void {
    // Execute the chosen action
    if (agent.currentAction) {
      agent.currentAction.execute(agent, deltaTime);
    }
  }
}

interface AIAgent {
  position: Vector3;
  sightRange: number;
  nearbyEnemies: Entity[];
  nearbyAllies: Entity[];
  behaviorTree: BehaviorTree;
  currentAction: Action | null;
}
```

## Frame Synchronization

```typescript
class FrameJobGraph {
  private scheduler: JobScheduler;

  constructor(scheduler: JobScheduler) {
    this.scheduler = scheduler;
  }

  buildFrameGraph(
    systems: {
      transform: TransformSystem;
      physics: PhysicsJobSystem;
      ai: AIJobSystem;
      rendering: RenderingSystem;
    },
    deltaTime: number
  ): JobHandle {
    // Input is processed on main thread before jobs

    // These can run in parallel
    const physicsHandle = systems.physics.step(deltaTime);
    const aiHandle = systems.ai.update(deltaTime, world);

    // Transform depends on physics
    const transformJob: Job = {
      dependencies: [physicsHandle as any],
      execute: () => {
        systems.transform.updateTransforms();
      }
    };
    const transformHandle = this.scheduler.schedule(transformJob);

    // Rendering prep depends on transforms and AI
    const renderPrepJob: Job = {
      dependencies: [transformHandle as any, aiHandle as any],
      execute: () => {
        systems.rendering.prepareFrame();
      }
    };

    return this.scheduler.schedule(renderPrepJob);
  }
}
```

## Best Practices

### 1. Data-Oriented Design

```typescript
// Bad: Object-oriented approach
class Entity {
  position: Vector3;
  velocity: Vector3;
  health: number;

  update(dt: number) {
    this.position.add(this.velocity.scale(dt));
  }
}

// Good: Data-oriented approach
class EntitySystem {
  // Contiguous arrays for cache efficiency
  positions: Float32Array;
  velocities: Float32Array;
  health: Float32Array;
  count: number;

  updatePositions(dt: number): void {
    // Process in batches for SIMD-friendly code
    for (let i = 0; i < this.count * 3; i += 3) {
      this.positions[i] += this.velocities[i] * dt;
      this.positions[i + 1] += this.velocities[i + 1] * dt;
      this.positions[i + 2] += this.velocities[i + 2] * dt;
    }
  }
}
```

### 2. Avoid Contention

```typescript
// Bad: Shared state with locks
class BadCounter {
  private count: number = 0;
  private lock: Mutex;

  increment(): void {
    this.lock.acquire();
    this.count++;
    this.lock.release();
  }
}

// Good: Per-thread accumulation, then merge
class GoodCounter {
  private perThreadCounts: number[];

  increment(threadId: number): void {
    this.perThreadCounts[threadId]++;
  }

  getTotal(): number {
    return this.perThreadCounts.reduce((a, b) => a + b, 0);
  }
}
```

### 3. Job Granularity

```typescript
// Too fine: overhead dominates
for (const entity of entities) {
  scheduler.schedule({ execute: () => entity.update() });
}

// Too coarse: poor load balancing
scheduler.schedule({
  execute: () => {
    for (const entity of entities) {
      entity.update();
    }
  }
});

// Good: batch processing
const BATCH_SIZE = 64;
for (let i = 0; i < entities.length; i += BATCH_SIZE) {
  const batch = entities.slice(i, i + BATCH_SIZE);
  scheduler.schedule({
    execute: () => {
      for (const entity of batch) {
        entity.update();
      }
    }
  });
}
```

## Summary

A well-designed job system enables:

- **Parallel execution** of game logic across all CPU cores
- **Automatic load balancing** through work stealing
- **Clean dependency management** for complex update orders
- **Cache-efficient** data processing with batching

Key considerations:
- Use data-oriented design for cache efficiency
- Choose appropriate job granularity
- Minimize shared state and synchronization
- Profile to identify bottlenecks

## Further Reading

- "Game Engine Architecture" by Jason Gregory - Threading chapter
- GDC talks on Unity DOTS and Unreal's task system
- Intel Threading Building Blocks documentation
- "C++ Concurrency in Action" by Anthony Williams
