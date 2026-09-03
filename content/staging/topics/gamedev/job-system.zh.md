---
title: 多线程 Job 系统
description: 掌握用于并行游戏处理的多线程 Job 系统，包括工作窃取、依赖关系和面向数据的设计
track: gamedev
section: performance
difficulty: advanced
tags:
  - job 系统
  - 多线程
  - 并行处理
  - 工作窃取
  - 优化
  - ECS
status: imported
origin: old/src/content/docs/gamedev/job-system.zh.md
divergence: 0.276
issues:
  - h1-in-body
legacy:
  category: GameDev
  subcategory: Optimization
  order: 58
  lastUpdated: 2026-01-22
---

现代游戏需要高效利用多个 CPU 核心。Job 系统能够并行处理游戏逻辑、物理、AI 和渲染准备，同时避免传统线程的陷阱。

## Job 系统基础

### 为什么需要 Job 系统？

传统线程会产生问题：手动线程管理、复杂的同步和负载不均衡。Job 系统通过以下方式解决这些问题：

1. **自动分配**：Job 被分配给可用线程
2. **依赖管理**：Job 声明依赖关系，按正确顺序执行
3. **工作窃取**：空闲线程从繁忙线程获取工作
4. **缓存效率**：面向数据的设计改善内存访问模式

### 基本 Job 接口

```typescript
interface Job {
  execute(): void;
  dependencies?: Job[];
  priority?: number;
}

interface JobHandle {
  isComplete(): boolean;
  complete(): void;  // 阻塞直到完成
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

## 核心实现

### 工作线程池

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

### 带依赖的 Job 调度器

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

    // 注册为依赖项的依赖者
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

    // 如果没有依赖则调度
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

    // 通知依赖者
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
    while (!this.completed) {
      // 在实际实现中，会让出给其他工作
    }
  }

  markComplete(): void {
    this.completed = true;
    for (const waiter of this.waiters) {
      waiter();
    }
  }
}
```

## 工作窃取队列

工作窃取通过允许空闲线程从繁忙线程"窃取"任务来改善负载均衡。

```typescript
class WorkStealingDeque<T> {
  private items: T[] = [];
  private head: number = 0;
  private tail: number = 0;

  // 所有者线程从尾部推入/弹出（LIFO 以利于缓存局部性）
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

  // 其他线程从头部窃取（FIFO）
  steal(): T | null {
    const h = this.head;
    const t = this.tail;

    if (h >= t) return null;

    const item = this.items[h];
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
    const currentWorker = this.getCurrentWorker();
    if (currentWorker) {
      currentWorker.localQueue.push(job);
    } else {
      this.globalQueue.push(job);
    }
  }

  getNextJob(workerId: number): Job | null {
    const worker = this.workers[workerId];

    // 1. 首先尝试本地队列（缓存友好）
    let job = worker.localQueue.pop();
    if (job) return job;

    // 2. 尝试全局队列
    if (this.globalQueue.length > 0) {
      return this.globalQueue.shift()!;
    }

    // 3. 尝试从其他工作者窃取
    for (const other of this.workers) {
      if (other.id !== workerId) {
        job = other.localQueue.steal();
        if (job) return job;
      }
    }

    return null;
  }

  private getCurrentWorker(): WorkerContext | null {
    return null;
  }
}

interface WorkerContext {
  id: number;
  localQueue: WorkStealingDeque<Job>;
  busy: boolean;
}
```

## 并行模式

### 并行 For

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
      const mappedBatches: TMapped[][] = [];

      const mapJobs = this.createMapJobs(data, mapper, batchSize, mappedBatches);
      const mapHandle = this.scheduler.scheduleParallel(mapJobs);

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

## 游戏特定的 Job 模式

### 变换更新 Job

```typescript
interface Transform {
  position: Float32Array;
  rotation: Float32Array;
  scale: Float32Array;
  localMatrix: Float32Array;
  worldMatrix: Float32Array;
  parent: number;
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
    // 阶段 1：更新局部矩阵（完全并行）
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

    // 阶段 2：更新世界矩阵（分层，每层并行）
    const worldJob: Job = {
      dependencies: [localJob as any],
      execute: () => {
        const levels = this.groupByHierarchyLevel();

        for (const level of levels) {
          for (const index of level) {
            this.updateWorldMatrix(index);
          }
        }
      }
    };

    return this.scheduler.schedule(worldJob);
  }

  private updateLocalMatrix(transform: Transform): void {
    // 从位置、旋转、缩放组合 TRS 矩阵
  }

  private updateWorldMatrix(index: number): void {
    const transform = this.transforms[index];
    if (transform.parent >= 0) {
      const parent = this.transforms[transform.parent];
      this.multiplyMatrices(
        transform.worldMatrix,
        parent.worldMatrix,
        transform.localMatrix
      );
    } else {
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
    // 4x4 矩阵乘法
  }
}
```

### 物理更新 Job

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
    // 阶段 1：积分速度（并行）
    const integrateJob = this.scheduler.scheduleBatch(
      this.bodies,
      64,
      (batch) => {
        for (const body of batch) {
          this.integrateVelocity(body, deltaTime);
        }
      }
    );

    // 阶段 2：宽相碰撞检测（并行）
    const broadphaseJob: Job = {
      dependencies: [integrateJob as any],
      execute: () => {
        this.broadphase.clear();
        for (const body of this.bodies) {
          this.broadphase.insert(body, body.bounds);
        }
      }
    };

    // 阶段 3：窄相碰撞检测（并行）
    const pairs: CollisionPair[] = [];
    const narrowphaseJob: Job = {
      dependencies: [this.scheduler.schedule(broadphaseJob) as any],
      execute: () => {
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

    // 阶段 4：碰撞解决（为了稳定性顺序执行）
    const resolveJob: Job = {
      dependencies: [this.scheduler.schedule(narrowphaseJob) as any],
      execute: () => {
        for (const pair of pairs) {
          this.resolveCollision(pair.a, pair.b);
        }
      }
    };

    // 阶段 5：积分位置（并行）
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
    body.velocity.y += -9.8 * dt;
  }

  private integratePosition(body: RigidBody, dt: number): void {
    body.position.x += body.velocity.x * dt;
    body.position.y += body.velocity.y * dt;
    body.position.z += body.velocity.z * dt;
  }

  private resolveCollision(a: RigidBody, b: RigidBody): void {
    // 碰撞响应
  }
}
```

## 最佳实践

### 1. 面向数据的设计

```typescript
// 不好：面向对象方法
class Entity {
  position: Vector3;
  velocity: Vector3;
  health: number;

  update(dt: number) {
    this.position.add(this.velocity.scale(dt));
  }
}

// 好：面向数据方法
class EntitySystem {
  // 连续数组以提高缓存效率
  positions: Float32Array;
  velocities: Float32Array;
  health: Float32Array;
  count: number;

  updatePositions(dt: number): void {
    // 批量处理以获得 SIMD 友好的代码
    for (let i = 0; i < this.count * 3; i += 3) {
      this.positions[i] += this.velocities[i] * dt;
      this.positions[i + 1] += this.velocities[i + 1] * dt;
      this.positions[i + 2] += this.velocities[i + 2] * dt;
    }
  }
}
```

### 2. 避免竞争

```typescript
// 不好：带锁的共享状态
class BadCounter {
  private count: number = 0;
  private lock: Mutex;

  increment(): void {
    this.lock.acquire();
    this.count++;
    this.lock.release();
  }
}

// 好：每线程累积，然后合并
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

### 3. Job 粒度

```typescript
// 太细：开销主导
for (const entity of entities) {
  scheduler.schedule({ execute: () => entity.update() });
}

// 太粗：负载不均衡
scheduler.schedule({
  execute: () => {
    for (const entity of entities) {
      entity.update();
    }
  }
});

// 好：批处理
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

## 总结

精心设计的 Job 系统能够实现：

- **并行执行**：跨所有 CPU 核心的游戏逻辑
- **自动负载均衡**：通过工作窃取
- **清晰的依赖管理**：处理复杂的更新顺序
- **缓存高效**：通过批处理进行数据处理

关键考虑因素：
- 使用面向数据的设计以提高缓存效率
- 选择适当的 Job 粒度
- 最小化共享状态和同步
- 进行性能分析以识别瓶颈

## 延伸阅读

- Jason Gregory 的《Game Engine Architecture》 - 线程章节
- GDC 关于 Unity DOTS 和 Unreal 任务系统的演讲
- Intel Threading Building Blocks 文档
- Anthony Williams 的《C++ Concurrency in Action》
