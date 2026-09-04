---
title: 帧同步 vs 状态同步：多人游戏同步架构完全指南
description: 深入掌握多人游戏同步架构：帧同步锁步机制与状态同步的实现策略、技术细节与选型指南
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - 帧同步
  - 状态同步
  - 锁步
  - 多人游戏
  - 网络代码
  - 同步
status: imported
origin: old/src/content/docs/gamedev/frame-state-sync.zh.md
divergence: 0.231
issues: []
legacy:
  category: GameDev
  subcategory: Networking
  order: 50
  lastUpdated: 2026-01-22
---

多人游戏同步是游戏开发中最具挑战性的领域之一。帧同步（锁步）与状态同步的选择从根本上决定了游戏的架构设计、玩家体验和技术限制。本指南深入探讨这两种方案的实现细节，帮助你为游戏选择最合适的同步策略。

## 同步基础原理

### 核心问题

在多人游戏中，多个玩家从不同物理位置与共享的游戏世界进行交互。网络延迟意味着信息在客户端和服务器之间传输需要时间。根本挑战在于：**如何在网络延迟存在的情况下，确保所有玩家看到一致的游戏状态？**

```
同步问题示意图：

玩家A（东京）            服务器（纽约）           玩家B（伦敦）
     |                          |                          |
     |--- 输入（100ms）-------->|                          |
     |                          |--- 广播（80ms）--------->|
     |                          |                          |
     |<-- 状态（100ms）---------|                          |
     |                          |                          |

总延迟：A的操作需要180-280ms才能被B看到
```

### 两种基本方案

**帧同步（锁步）**：所有客户端运行相同的确定性模拟，只同步玩家输入。相同的输入必然产生相同的结果。

**状态同步**：服务器维护权威游戏状态，客户端发送输入，服务器验证后广播状态变化。

---

## 帧同步（锁步）

### 核心概念

锁步同步基于一个简单原则：如果所有客户端从相同的初始状态开始，并以相同的顺序处理相同的输入，那么它们都将达到相同的最终状态。

```typescript
// 锁步架构概览
interface LockstepFrame {
  frameNumber: number;
  inputs: Map<PlayerId, PlayerInput>;
  checksum: number; // 用于不同步检测
}

class LockstepSimulation {
  private currentFrame: number = 0;
  private confirmedFrame: number = 0;
  private frameInputs: Map<number, LockstepFrame> = new Map();
  private localInputHistory: PlayerInput[] = [];
  private deterministicRng: DeterministicRandom;

  constructor(seed: number) {
    this.deterministicRng = new DeterministicRandom(seed);
  }

  // 主更新循环
  update(): void {
    // 收集本地输入
    const localInput = this.collectInput();
    this.localInputHistory.push(localInput);

    // 发送到中继服务器
    this.sendInput(localInput, this.currentFrame);

    // 只有当收到当前帧所有输入时才推进
    if (this.hasAllInputsForFrame(this.currentFrame)) {
      this.simulateFrame(this.currentFrame);
      this.currentFrame++;
    }
  }

  private simulateFrame(frameNumber: number): void {
    const frame = this.frameInputs.get(frameNumber)!;

    // 按确定性顺序处理输入（按玩家ID排序）
    const sortedInputs = this.getSortedInputs(frame.inputs);

    for (const [playerId, input] of sortedInputs) {
      this.applyPlayerInput(playerId, input);
    }

    // 使用固定时间步更新游戏逻辑
    this.gameWorld.fixedUpdate(this.FIXED_DELTA_TIME);

    // 计算并验证校验和
    const checksum = this.calculateChecksum();
    if (frame.checksum && frame.checksum !== checksum) {
      this.handleDesync(frameNumber, checksum, frame.checksum);
    }
  }
}
```

### 确定性模拟要求

锁步要正常工作，模拟必须是**完全确定性的**。相同的输入必须始终产生完全相同的输出。

#### 浮点数确定性

浮点运算在不同CPU和编译器上可能产生不同结果。

```typescript
// 问题：浮点数非确定性
// 这在不同机器上可能得到略微不同的结果：
const result = Math.sin(angle) * velocity;

// 解决方案1：定点数运算
class FixedPoint {
  private static readonly SCALE = 1000; // 3位小数精度

  value: number; // 整数表示

  constructor(floatValue: number) {
    this.value = Math.round(floatValue * FixedPoint.SCALE);
  }

  static add(a: FixedPoint, b: FixedPoint): FixedPoint {
    const result = new FixedPoint(0);
    result.value = a.value + b.value;
    return result;
  }

  static multiply(a: FixedPoint, b: FixedPoint): FixedPoint {
    const result = new FixedPoint(0);
    // 注意溢出 - 中间值使用bigint
    result.value = Math.floor((a.value * b.value) / FixedPoint.SCALE);
    return result;
  }

  static divide(a: FixedPoint, b: FixedPoint): FixedPoint {
    const result = new FixedPoint(0);
    result.value = Math.floor((a.value * FixedPoint.SCALE) / b.value);
    return result;
  }

  toFloat(): number {
    return this.value / FixedPoint.SCALE;
  }
}

// 解决方案2：三角函数查表
class DeterministicMath {
  private static sinTable: number[] = [];
  private static readonly TABLE_SIZE = 4096;

  static initialize(): void {
    for (let i = 0; i < this.TABLE_SIZE; i++) {
      const angle = (i / this.TABLE_SIZE) * Math.PI * 2;
      // 预计算并四舍五入到固定精度
      this.sinTable[i] = Math.round(Math.sin(angle) * 10000) / 10000;
    }
  }

  static sin(angle: number): number {
    // 将角度规范化到[0, 2PI]
    angle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const index = Math.floor((angle / (Math.PI * 2)) * this.TABLE_SIZE);
    return this.sinTable[index % this.TABLE_SIZE];
  }

  static cos(angle: number): number {
    return this.sin(angle + Math.PI / 2);
  }
}
```

#### 确定性随机数生成

```typescript
// 种子随机数生成器 - 相同种子始终产生相同序列
class DeterministicRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // 线性同余生成器
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // 保存和恢复状态用于回滚
  getState(): number {
    return this.seed;
  }

  setState(state: number): void {
    this.seed = state;
  }
}

// 在游戏逻辑中使用
class GameWorld {
  private rng: DeterministicRandom;

  spawnEnemy(): void {
    // 始终使用游戏的RNG，绝不使用Math.random()
    const x = this.rng.nextInt(0, this.width);
    const y = this.rng.nextInt(0, this.height);
    const enemyType = this.rng.nextInt(0, this.enemyTypes.length - 1);

    this.createEnemy(x, y, this.enemyTypes[enemyType]);
  }
}
```

#### 确定性物理

```typescript
class DeterministicPhysics {
  private readonly FIXED_DELTA: FixedPoint;
  private readonly GRAVITY: FixedPoint;

  constructor() {
    this.FIXED_DELTA = new FixedPoint(1 / 60); // 60 FPS
    this.GRAVITY = new FixedPoint(-9.81);
  }

  updateBody(body: PhysicsBody): void {
    // 应用重力
    body.velocityY = FixedPoint.add(
      body.velocityY,
      FixedPoint.multiply(this.GRAVITY, this.FIXED_DELTA)
    );

    // 更新位置
    body.x = FixedPoint.add(
      body.x,
      FixedPoint.multiply(body.velocityX, this.FIXED_DELTA)
    );
    body.y = FixedPoint.add(
      body.y,
      FixedPoint.multiply(body.velocityY, this.FIXED_DELTA)
    );
  }

  // 使用定点数进行碰撞检测
  checkCollision(a: AABB, b: AABB): boolean {
    return a.minX.value < b.maxX.value &&
           a.maxX.value > b.minX.value &&
           a.minY.value < b.maxY.value &&
           a.maxY.value > b.minY.value;
  }
}
```

### 输入延迟与缓冲

锁步需要在推进帧之前收到所有输入，这产生了固有的输入延迟。

```typescript
class LockstepInputBuffer {
  private inputBuffer: Map<number, Map<PlayerId, PlayerInput>> = new Map();
  private inputDelay: number = 2; // 帧输入延迟
  private players: Set<PlayerId>;

  constructor(players: PlayerId[], inputDelay: number = 2) {
    this.players = new Set(players);
    this.inputDelay = inputDelay;
  }

  // 提交本地输入（针对未来帧）
  submitLocalInput(input: PlayerInput, currentFrame: number): void {
    const targetFrame = currentFrame + this.inputDelay;

    if (!this.inputBuffer.has(targetFrame)) {
      this.inputBuffer.set(targetFrame, new Map());
    }
    this.inputBuffer.get(targetFrame)!.set(input.playerId, input);

    // 发送给其他客户端
    this.broadcast({
      type: 'input',
      frame: targetFrame,
      input: input
    });
  }

  // 接收远程输入
  receiveInput(frame: number, playerId: PlayerId, input: PlayerInput): void {
    if (!this.inputBuffer.has(frame)) {
      this.inputBuffer.set(frame, new Map());
    }
    this.inputBuffer.get(frame)!.set(playerId, input);
  }

  // 检查是否可以推进到某帧
  canAdvanceToFrame(frame: number): boolean {
    const frameInputs = this.inputBuffer.get(frame);
    if (!frameInputs) return false;

    // 检查是否收到所有玩家的输入
    for (const playerId of this.players) {
      if (!frameInputs.has(playerId)) {
        return false;
      }
    }
    return true;
  }

  // 获取某帧的输入
  getFrameInputs(frame: number): Map<PlayerId, PlayerInput> | null {
    if (!this.canAdvanceToFrame(frame)) {
      return null;
    }
    return this.inputBuffer.get(frame)!;
  }

  // 清理旧帧
  cleanup(confirmedFrame: number): void {
    for (const frame of this.inputBuffer.keys()) {
      if (frame < confirmedFrame - 60) { // 保留1秒历史
        this.inputBuffer.delete(frame);
      }
    }
  }
}
```

### 不同步检测与恢复

```typescript
interface GameStateChecksum {
  frameNumber: number;
  checksum: number;
  entityChecksums: Map<EntityId, number>;
}

class DesyncDetector {
  private checksumHistory: Map<number, number> = new Map();
  private readonly CHECKSUM_INTERVAL = 10; // 每10帧检查一次

  calculateChecksum(gameState: GameState): number {
    let hash = 0;

    // 按确定性顺序对所有游戏实体进行哈希
    const sortedEntities = [...gameState.entities.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]));

    for (const [id, entity] of sortedEntities) {
      hash = this.hashCombine(hash, this.hashEntity(entity));
    }

    // 哈希全局状态
    hash = this.hashCombine(hash, gameState.frameNumber);
    hash = this.hashCombine(hash, gameState.rngState);

    return hash;
  }

  private hashEntity(entity: Entity): number {
    let hash = 0;

    // 位置（使用定点数值）
    hash = this.hashCombine(hash, entity.x.value);
    hash = this.hashCombine(hash, entity.y.value);

    // 速度
    hash = this.hashCombine(hash, entity.velocityX.value);
    hash = this.hashCombine(hash, entity.velocityY.value);

    // 状态
    hash = this.hashCombine(hash, entity.health);
    hash = this.hashCombine(hash, entity.state);

    return hash;
  }

  private hashCombine(a: number, b: number): number {
    // FNV-1a哈希组合
    return ((a ^ b) * 0x01000193) >>> 0;
  }

  verifySync(frame: number, localChecksum: number, remoteChecksum: number): boolean {
    if (localChecksum !== remoteChecksum) {
      console.error(`在帧${frame}检测到不同步！`);
      console.error(`本地：${localChecksum}，远程：${remoteChecksum}`);
      return false;
    }
    return true;
  }
}

// 从不同步恢复
class DesyncRecovery {
  private snapshots: Map<number, GameState> = new Map();
  private readonly SNAPSHOT_INTERVAL = 60; // 每秒

  saveSnapshot(frame: number, state: GameState): void {
    if (frame % this.SNAPSHOT_INTERVAL === 0) {
      this.snapshots.set(frame, this.cloneState(state));

      // 清理旧快照
      for (const f of this.snapshots.keys()) {
        if (f < frame - 600) { // 保留10秒
          this.snapshots.delete(f);
        }
      }
    }
  }

  recoverFromDesync(
    currentFrame: number,
    desyncFrame: number,
    authoritativeState: GameState,
    inputHistory: Map<number, Map<PlayerId, PlayerInput>>
  ): GameState {
    // 找到不同步前的最后一个好快照
    let recoveryFrame = 0;
    for (const frame of this.snapshots.keys()) {
      if (frame <= desyncFrame && frame > recoveryFrame) {
        recoveryFrame = frame;
      }
    }

    // 从权威状态或最后快照开始
    let state = authoritativeState || this.snapshots.get(recoveryFrame)!;

    // 从恢复点重放所有输入到当前帧
    for (let frame = recoveryFrame + 1; frame <= currentFrame; frame++) {
      const inputs = inputHistory.get(frame);
      if (inputs) {
        state = this.simulateFrame(state, inputs);
      }
    }

    return state;
  }

  private cloneState(state: GameState): GameState {
    return JSON.parse(JSON.stringify(state));
  }

  private simulateFrame(
    state: GameState,
    inputs: Map<PlayerId, PlayerInput>
  ): GameState {
    // 重新模拟帧
    // 实现取决于游戏逻辑
    return state;
  }
}
```

### 回滚网络代码

回滚是一种高级锁步技术，通过预测性模拟提供响应式游戏体验。

```typescript
class RollbackNetcode {
  private gameStates: GameState[] = [];
  private inputHistory: Map<number, Map<PlayerId, PlayerInput>> = new Map();
  private localPlayerId: PlayerId;
  private confirmedFrame: number = 0;
  private currentFrame: number = 0;
  private maxRollbackFrames: number = 7;

  update(): void {
    // 1. 获取本地输入并预测远程输入
    const localInput = this.getLocalInput();
    this.setInput(this.currentFrame, this.localPlayerId, localInput);
    this.predictRemoteInputs(this.currentFrame);

    // 2. 发送本地输入给远程玩家
    this.sendInput(localInput, this.currentFrame);

    // 3. 模拟当前帧
    this.saveState(this.currentFrame);
    this.simulateFrame(this.currentFrame);
    this.currentFrame++;

    // 4. 处理确认的远程输入（可能触发回滚）
    while (this.hasUnprocessedRemoteInputs()) {
      const remoteInput = this.getNextRemoteInput();
      if (this.needsRollback(remoteInput)) {
        this.rollback(remoteInput.frame);
      }
    }
  }

  private predictRemoteInputs(frame: number): void {
    // 使用最后已知的输入作为预测
    for (const playerId of this.remotePlayers) {
      const lastInput = this.getLastKnownInput(playerId);
      this.setInput(frame, playerId, lastInput || this.createDefaultInput());
    }
  }

  private needsRollback(remoteInput: { frame: number; playerId: PlayerId; input: PlayerInput }): boolean {
    // 检查预测输入是否与实际不同
    const predicted = this.inputHistory.get(remoteInput.frame)?.get(remoteInput.playerId);

    if (!predicted) return true;
    return !this.inputsEqual(predicted, remoteInput.input);
  }

  private rollback(toFrame: number): void {
    // 不要回滚太远
    if (this.currentFrame - toFrame > this.maxRollbackFrames) {
      console.warn('回滚太远，进行限制');
      toFrame = this.currentFrame - this.maxRollbackFrames;
    }

    // 恢复旧状态
    const savedState = this.gameStates[toFrame];
    if (!savedState) {
      console.error('没有保存的状态用于回滚！');
      return;
    }

    this.loadState(savedState);

    // 从回滚点重新模拟到当前帧
    for (let frame = toFrame; frame < this.currentFrame; frame++) {
      this.simulateFrame(frame);
      this.saveState(frame);
    }
  }

  private saveState(frame: number): void {
    this.gameStates[frame % (this.maxRollbackFrames + 1)] = this.cloneGameState();
  }

  private loadState(state: GameState): void {
    // 恢复游戏状态
    // 这需要是深拷贝操作
  }

  // 输入压缩以提高网络效率
  serializeInput(input: PlayerInput): ArrayBuffer {
    // 将输入打包成最小字节
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);

    let flags = 0;
    if (input.up) flags |= 0x01;
    if (input.down) flags |= 0x02;
    if (input.left) flags |= 0x04;
    if (input.right) flags |= 0x08;
    if (input.attack) flags |= 0x10;
    if (input.jump) flags |= 0x20;
    if (input.special) flags |= 0x40;

    view.setUint8(0, flags);
    view.setUint8(1, input.aimAngle); // 量化到0-255
    view.setUint16(2, input.frame);

    return buffer;
  }
}
```

---

## 状态同步

### 核心概念

状态同步使用服务器权威模型，服务器维护真实游戏状态并广播给客户端。

```typescript
// 服务器权威状态同步
interface ServerGameState {
  tick: number;
  timestamp: number;
  players: Map<PlayerId, PlayerState>;
  projectiles: Projectile[];
  entities: Entity[];
}

interface PlayerState {
  id: PlayerId;
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
  health: number;
  animation: AnimationState;
  lastProcessedInput: number;
}

class AuthoritativeServer {
  private state: ServerGameState;
  private clients: Map<PlayerId, ClientConnection>;
  private tickRate: number = 60; // 服务器模拟频率
  private sendRate: number = 20; // 网络更新频率

  constructor() {
    this.state = {
      tick: 0,
      timestamp: Date.now(),
      players: new Map(),
      projectiles: [],
      entities: []
    };

    // 启动游戏循环
    setInterval(() => this.tick(), 1000 / this.tickRate);
    setInterval(() => this.sendState(), 1000 / this.sendRate);
  }

  private tick(): void {
    // 1. 处理客户端输入
    this.processInputs();

    // 2. 更新游戏模拟
    this.updateSimulation();

    // 3. 解决碰撞
    this.resolveCollisions();

    // 4. 更新游戏规则
    this.updateGameRules();

    this.state.tick++;
  }

  private processInputs(): void {
    for (const [playerId, client] of this.clients) {
      while (client.hasInput()) {
        const input = client.popInput();
        this.applyPlayerInput(playerId, input);
      }
    }
  }

  private applyPlayerInput(playerId: PlayerId, input: PlayerInput): void {
    const player = this.state.players.get(playerId);
    if (!player) return;

    // 验证输入
    if (!this.validateInput(player, input)) {
      this.logSuspiciousActivity(playerId, input);
      return;
    }

    // 应用移动
    const moveSpeed = player.moveSpeed;
    const deltaTime = 1 / this.tickRate;

    if (input.movement) {
      const movement = this.normalizeVector(input.movement);
      player.velocity.x = movement.x * moveSpeed;
      player.velocity.z = movement.z * moveSpeed;
    } else {
      player.velocity.x = 0;
      player.velocity.z = 0;
    }

    // 应用旋转
    if (input.rotation !== undefined) {
      player.rotation.y = input.rotation;
    }

    // 处理动作
    if (input.attack) {
      this.handleAttack(player, input);
    }

    player.lastProcessedInput = input.sequenceNumber;
  }

  private validateInput(player: PlayerState, input: PlayerInput): boolean {
    // 检查不可能的移动速度
    if (input.movement) {
      const magnitude = this.vectorMagnitude(input.movement);
      if (magnitude > 1.5) return false; // 允许一些容差
    }

    // 检查输入时间戳
    const inputAge = Date.now() - input.timestamp;
    if (inputAge > 5000) return false; // 拒绝超过5秒的输入

    return true;
  }

  private sendState(): void {
    const snapshot = this.createSnapshot();

    for (const [playerId, client] of this.clients) {
      // 为每个客户端定制快照（兴趣管理）
      const clientSnapshot = this.filterForClient(snapshot, playerId);
      client.send({
        type: 'state',
        data: this.compressSnapshot(clientSnapshot)
      });
    }
  }

  private createSnapshot(): ServerGameState {
    return {
      tick: this.state.tick,
      timestamp: Date.now(),
      players: new Map(this.state.players),
      projectiles: [...this.state.projectiles],
      entities: [...this.state.entities]
    };
  }
}
```

### 客户端预测

预测允许客户端在等待服务器确认的同时立即响应输入。

```typescript
class ClientPrediction {
  private pendingInputs: PlayerInput[] = [];
  private localPlayer: PlayerState;
  private serverState: PlayerState | null = null;
  private reconciliationThreshold: number = 0.1;

  processInput(rawInput: RawInput): void {
    // 1. 创建输入包
    const input: PlayerInput = {
      sequenceNumber: this.nextSequenceNumber++,
      timestamp: Date.now(),
      movement: rawInput.movement,
      rotation: rawInput.rotation,
      attack: rawInput.attack
    };

    // 2. 本地应用预测
    this.applyInput(this.localPlayer, input);

    // 3. 存储用于和解
    this.pendingInputs.push(input);

    // 4. 发送到服务器
    this.network.send({
      type: 'input',
      data: input
    });
  }

  onServerState(serverState: ServerStateUpdate): void {
    // 更新服务器状态引用
    this.serverState = serverState.playerState;

    // 移除已确认的输入
    this.pendingInputs = this.pendingInputs.filter(
      input => input.sequenceNumber > serverState.lastProcessedInput
    );

    // 如果需要则和解
    this.reconcile();
  }

  private reconcile(): void {
    if (!this.serverState) return;

    // 从服务器状态开始
    const reconciledState = { ...this.serverState };

    // 重新应用所有未确认的输入
    for (const input of this.pendingInputs) {
      this.applyInput(reconciledState, input);
    }

    // 检查本地状态是否需要修正
    const error = this.calculatePositionError(
      this.localPlayer.position,
      reconciledState.position
    );

    if (error > this.reconciliationThreshold) {
      // 快速切换或插值到正确位置
      this.smoothCorrection(reconciledState);
    }
  }

  private smoothCorrection(targetState: PlayerState): void {
    // 不是直接切换，而是平滑插值
    const blendFactor = 0.3;

    this.localPlayer.position.x = this.lerp(
      this.localPlayer.position.x,
      targetState.position.x,
      blendFactor
    );
    this.localPlayer.position.y = this.lerp(
      this.localPlayer.position.y,
      targetState.position.y,
      blendFactor
    );
    this.localPlayer.position.z = this.lerp(
      this.localPlayer.position.z,
      targetState.position.z,
      blendFactor
    );
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
}
```

### 实体插值

为了平滑显示远程实体，插值是必不可少的。

```typescript
interface StateSnapshot {
  timestamp: number;
  tick: number;
  entities: Map<EntityId, EntityState>;
}

class EntityInterpolation {
  private snapshots: StateSnapshot[] = [];
  private interpolationDelay: number = 100; // 落后服务器毫秒数
  private maxSnapshots: number = 30;

  addSnapshot(snapshot: StateSnapshot): void {
    this.snapshots.push(snapshot);

    // 保持缓冲区有限
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  getInterpolatedState(entityId: EntityId, currentTime: number): EntityState | null {
    // 计算渲染时间戳（在过去）
    const renderTime = currentTime - this.interpolationDelay;

    // 找到周围的快照
    let before: StateSnapshot | null = null;
    let after: StateSnapshot | null = null;

    for (let i = 0; i < this.snapshots.length - 1; i++) {
      if (this.snapshots[i].timestamp <= renderTime &&
          this.snapshots[i + 1].timestamp >= renderTime) {
        before = this.snapshots[i];
        after = this.snapshots[i + 1];
        break;
      }
    }

    if (!before || !after) {
      // 如果没有数据则外推
      return this.extrapolate(entityId, renderTime);
    }

    const beforeState = before.entities.get(entityId);
    const afterState = after.entities.get(entityId);

    if (!beforeState || !afterState) {
      return beforeState || afterState || null;
    }

    // 计算插值因子
    const t = (renderTime - before.timestamp) / (after.timestamp - before.timestamp);

    return this.interpolateStates(beforeState, afterState, t);
  }

  private interpolateStates(
    before: EntityState,
    after: EntityState,
    t: number
  ): EntityState {
    return {
      id: after.id,
      position: {
        x: this.lerp(before.position.x, after.position.x, t),
        y: this.lerp(before.position.y, after.position.y, t),
        z: this.lerp(before.position.z, after.position.z, t)
      },
      rotation: this.slerpQuaternion(before.rotation, after.rotation, t),
      velocity: after.velocity, // 使用最新速度
      animation: after.animation
    };
  }

  private extrapolate(entityId: EntityId, renderTime: number): EntityState | null {
    // 使用最后已知的状态和速度来预测位置
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    if (!lastSnapshot) return null;

    const lastState = lastSnapshot.entities.get(entityId);
    if (!lastState) return null;

    const timeDelta = (renderTime - lastSnapshot.timestamp) / 1000;

    // 限制外推以防止疯狂预测
    const maxExtrapolation = 0.25; // 250ms
    const clampedDelta = Math.min(timeDelta, maxExtrapolation);

    return {
      ...lastState,
      position: {
        x: lastState.position.x + lastState.velocity.x * clampedDelta,
        y: lastState.position.y + lastState.velocity.y * clampedDelta,
        z: lastState.position.z + lastState.velocity.z * clampedDelta
      }
    };
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private slerpQuaternion(a: Quaternion, b: Quaternion, t: number): Quaternion {
    // 旋转的球面线性插值
    let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;

    // 处理负点积（最短路径）
    if (dot < 0) {
      b = { x: -b.x, y: -b.y, z: -b.z, w: -b.w };
      dot = -dot;
    }

    // 对非常接近的四元数使用线性插值
    if (dot > 0.9995) {
      return this.normalizeQuaternion({
        x: this.lerp(a.x, b.x, t),
        y: this.lerp(a.y, b.y, t),
        z: this.lerp(a.z, b.z, t),
        w: this.lerp(a.w, b.w, t)
      });
    }

    const theta0 = Math.acos(dot);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);

    const s0 = Math.cos(theta) - dot * sinTheta / sinTheta0;
    const s1 = sinTheta / sinTheta0;

    return {
      x: a.x * s0 + b.x * s1,
      y: a.y * s0 + b.y * s1,
      z: a.z * s0 + b.z * s1,
      w: a.w * s0 + b.w * s1
    };
  }

  private normalizeQuaternion(q: Quaternion): Quaternion {
    const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
    return {
      x: q.x / len,
      y: q.y / len,
      z: q.z / len,
      w: q.w / len
    };
  }
}
```

### 增量压缩

通过只发送变化来减少带宽。

```typescript
interface DeltaSnapshot {
  baseTick: number; // 参考tick
  currentTick: number;
  changes: EntityChange[];
}

interface EntityChange {
  entityId: EntityId;
  changeType: 'create' | 'update' | 'destroy';
  data?: Partial<EntityState>;
}

class DeltaCompression {
  private lastAckedSnapshot: Map<PlayerId, number> = new Map();
  private snapshotHistory: Map<number, ServerGameState> = new Map();

  createDelta(
    playerId: PlayerId,
    currentState: ServerGameState
  ): DeltaSnapshot {
    const baseTick = this.lastAckedSnapshot.get(playerId) || 0;
    const baseState = this.snapshotHistory.get(baseTick);

    const changes: EntityChange[] = [];

    // 比较实体
    for (const [entityId, entity] of currentState.entities) {
      const baseEntity = baseState?.entities.get(entityId);

      if (!baseEntity) {
        // 新实体
        changes.push({
          entityId,
          changeType: 'create',
          data: entity
        });
      } else if (this.entityChanged(baseEntity, entity)) {
        // 变化的实体 - 只发送变化的字段
        changes.push({
          entityId,
          changeType: 'update',
          data: this.getChangedFields(baseEntity, entity)
        });
      }
    }

    // 找到被销毁的实体
    if (baseState) {
      for (const entityId of baseState.entities.keys()) {
        if (!currentState.entities.has(entityId)) {
          changes.push({
            entityId,
            changeType: 'destroy'
          });
        }
      }
    }

    return {
      baseTick,
      currentTick: currentState.tick,
      changes
    };
  }

  private getChangedFields(
    base: EntityState,
    current: EntityState
  ): Partial<EntityState> {
    const changes: Partial<EntityState> = {};

    // 检查每个字段
    if (!this.vectorEquals(base.position, current.position)) {
      changes.position = current.position;
    }
    if (!this.quaternionEquals(base.rotation, current.rotation)) {
      changes.rotation = current.rotation;
    }
    if (!this.vectorEquals(base.velocity, current.velocity)) {
      changes.velocity = current.velocity;
    }
    if (base.health !== current.health) {
      changes.health = current.health;
    }

    return changes;
  }

  acknowledgeSnapshot(playerId: PlayerId, tick: number): void {
    this.lastAckedSnapshot.set(playerId, tick);
  }

  // 量化以进一步压缩
  quantizePosition(position: Vector3): QuantizedPosition {
    // 量化到1厘米精度
    return {
      x: Math.round(position.x * 100),
      y: Math.round(position.y * 100),
      z: Math.round(position.z * 100)
    };
  }

  quantizeRotation(rotation: Quaternion): number {
    // 四元数的最小三编码
    // 找到最大分量
    const abs = [
      Math.abs(rotation.x),
      Math.abs(rotation.y),
      Math.abs(rotation.z),
      Math.abs(rotation.w)
    ];
    const maxIndex = abs.indexOf(Math.max(...abs));

    // 编码三个较小的分量
    const components = [rotation.x, rotation.y, rotation.z, rotation.w];
    components.splice(maxIndex, 1);

    // 打包成32位（2位用于索引，每个分量10位）
    let packed = maxIndex;
    for (let i = 0; i < 3; i++) {
      const quantized = Math.round((components[i] + 1) * 511); // 0-1022
      packed = (packed << 10) | (quantized & 0x3FF);
    }

    return packed;
  }
}
```

---

## 对比与选型指南

### 功能对比

| 方面 | 帧同步（锁步） | 状态同步 |
|------|---------------|----------|
| **带宽** | 非常低 | 高 |
| **延迟感受** | 输入延迟（所有玩家） | 预测隐藏延迟 |
| **复杂度** | 高（确定性要求） | 中等 |
| **可扩展性** | 2-8玩家 | 数百玩家 |
| **作弊风险** | 客户端可作弊 | 服务器权威 |
| **回放支持** | 简单（只需输入） | 复杂（完整状态） |
| **最适合** | RTS、格斗、MOBA | FPS、MMO、大逃杀 |

### 决策矩阵

```typescript
// 决策辅助
function recommendSyncMethod(gameRequirements: GameRequirements): SyncMethod {
  // RTS游戏 - 大量单位，需要精确同步
  if (gameRequirements.genre === 'RTS') {
    return 'lockstep';
  }

  // 格斗游戏 - 帧精确输入很重要
  if (gameRequirements.genre === 'fighting' && gameRequirements.maxPlayers <= 4) {
    return 'rollback'; // 增强型锁步
  }

  // 大量玩家
  if (gameRequirements.maxPlayers > 8) {
    return 'state-sync';
  }

  // FPS游戏 - 快速动作，预测很重要
  if (gameRequirements.genre === 'FPS') {
    return 'state-sync';
  }

  // MOBA - 混合方案
  if (gameRequirements.genre === 'MOBA') {
    if (gameRequirements.targetLatency < 50) {
      return 'lockstep';
    }
    return 'state-sync';
  }

  // 大多数游戏默认状态同步
  return 'state-sync';
}

interface GameRequirements {
  genre: 'FPS' | 'RTS' | 'MOBA' | 'fighting' | 'MMO' | 'puzzle' | 'racing';
  maxPlayers: number;
  targetLatency: number; // 毫秒
  requiresDeterminism: boolean;
  replaySupport: boolean;
}
```

### 混合方案

一些游戏结合两种方法。

```typescript
// 混合同步：关键动作使用锁步，移动使用状态同步
class HybridSynchronization {
  private lockstepSystem: LockstepSimulation;
  private stateSyncSystem: StateSync;

  processInput(input: PlayerInput): void {
    // 关键动作（攻击、技能）通过锁步
    if (input.attack || input.ability) {
      this.lockstepSystem.queueInput({
        type: 'action',
        action: input.attack || input.ability,
        frame: this.lockstepSystem.currentFrame
      });
    }

    // 移动通过状态同步以获得响应性
    if (input.movement) {
      this.stateSyncSystem.processMovement(input.movement);
    }
  }

  update(deltaTime: number): void {
    // 更新锁步用于关键游戏逻辑
    this.lockstepSystem.update();

    // 更新状态同步用于移动
    this.stateSyncSystem.update(deltaTime);

    // 合并结果
    this.reconcileStates();
  }

  private reconcileStates(): void {
    // 锁步状态对关键数据具有权威性
    // 状态同步处理带预测的位置
  }
}
```

---

## 最佳实践

### 网络协议设计

```typescript
// 高效的数据包结构
enum PacketType {
  INPUT = 1,
  STATE = 2,
  ACK = 3,
  SYNC_CHECK = 4,
  PING = 5,
  PONG = 6
}

class NetworkProtocol {
  // 使用二进制格式以提高效率
  encodePacket(packet: Packet): ArrayBuffer {
    const encoder = new BinaryEncoder();

    encoder.writeUint8(packet.type);
    encoder.writeUint32(packet.timestamp);

    switch (packet.type) {
      case PacketType.INPUT:
        this.encodeInput(encoder, packet.data);
        break;
      case PacketType.STATE:
        this.encodeState(encoder, packet.data);
        break;
      // ...
    }

    return encoder.getBuffer();
  }

  private encodeInput(encoder: BinaryEncoder, input: PlayerInput): void {
    encoder.writeUint32(input.sequenceNumber);
    encoder.writeUint8(this.packInputFlags(input));

    if (input.movement) {
      // 将方向量化到8位（256个方向）
      const angle = Math.atan2(input.movement.y, input.movement.x);
      encoder.writeUint8(Math.round((angle + Math.PI) / (Math.PI * 2) * 255));
    }

    if (input.aimAngle !== undefined) {
      encoder.writeUint16(Math.round(input.aimAngle * 10000)); // 0.0001精度
    }
  }

  private packInputFlags(input: PlayerInput): number {
    let flags = 0;
    if (input.movement) flags |= 0x01;
    if (input.attack) flags |= 0x02;
    if (input.jump) flags |= 0x04;
    if (input.crouch) flags |= 0x08;
    if (input.reload) flags |= 0x10;
    if (input.interact) flags |= 0x20;
    if (input.aimAngle !== undefined) flags |= 0x40;
    return flags;
  }
}

class BinaryEncoder {
  private buffer: ArrayBuffer;
  private view: DataView;
  private offset: number = 0;

  constructor(initialSize: number = 256) {
    this.buffer = new ArrayBuffer(initialSize);
    this.view = new DataView(this.buffer);
  }

  writeUint8(value: number): void {
    this.ensureCapacity(1);
    this.view.setUint8(this.offset++, value);
  }

  writeUint16(value: number): void {
    this.ensureCapacity(2);
    this.view.setUint16(this.offset, value);
    this.offset += 2;
  }

  writeUint32(value: number): void {
    this.ensureCapacity(4);
    this.view.setUint32(this.offset, value);
    this.offset += 4;
  }

  writeFloat32(value: number): void {
    this.ensureCapacity(4);
    this.view.setFloat32(this.offset, value);
    this.offset += 4;
  }

  private ensureCapacity(bytes: number): void {
    if (this.offset + bytes > this.buffer.byteLength) {
      const newBuffer = new ArrayBuffer(this.buffer.byteLength * 2);
      new Uint8Array(newBuffer).set(new Uint8Array(this.buffer));
      this.buffer = newBuffer;
      this.view = new DataView(this.buffer);
    }
  }

  getBuffer(): ArrayBuffer {
    return this.buffer.slice(0, this.offset);
  }
}
```

### 测试与调试

```typescript
class NetworkSimulator {
  private latency: number = 50;
  private jitter: number = 20;
  private packetLoss: number = 0.02;
  private messageQueue: Array<{ message: any; deliverTime: number }> = [];

  setConditions(latency: number, jitter: number, packetLoss: number): void {
    this.latency = latency;
    this.jitter = jitter;
    this.packetLoss = packetLoss;
  }

  send(message: any): void {
    // 模拟丢包
    if (Math.random() < this.packetLoss) {
      return;
    }

    // 计算带延迟和抖动的交付时间
    const delay = this.latency + (Math.random() - 0.5) * this.jitter * 2;
    const deliverTime = Date.now() + delay;

    this.messageQueue.push({ message, deliverTime });

    // 按交付时间排序（模拟乱序包）
    this.messageQueue.sort((a, b) => a.deliverTime - b.deliverTime);
  }

  receive(): any[] {
    const now = Date.now();
    const ready: any[] = [];

    while (this.messageQueue.length > 0 && this.messageQueue[0].deliverTime <= now) {
      ready.push(this.messageQueue.shift()!.message);
    }

    return ready;
  }
}

// 自动化同步测试
class SyncTester {
  async runTest(
    clients: GameClient[],
    actions: TestAction[],
    duration: number
  ): Promise<TestResult> {
    const startTime = Date.now();
    let actionIndex = 0;

    while (Date.now() - startTime < duration) {
      // 执行预定动作
      while (actionIndex < actions.length &&
             actions[actionIndex].time <= Date.now() - startTime) {
        const action = actions[actionIndex];
        clients[action.clientIndex].executeAction(action);
        actionIndex++;
      }

      // 更新所有客户端
      for (const client of clients) {
        client.update();
      }

      await this.sleep(16); // ~60 FPS
    }

    // 验证所有客户端状态匹配
    return this.verifySync(clients);
  }

  private verifySync(clients: GameClient[]): TestResult {
    const checksums = clients.map(c => c.calculateChecksum());
    const allMatch = checksums.every(cs => cs === checksums[0]);

    return {
      passed: allMatch,
      checksums,
      divergenceFrame: allMatch ? -1 : this.findDivergence(clients)
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 总结

帧同步和状态同步代表了多人游戏网络的两种根本不同的方法：

**帧同步（锁步）**：
- 同步输入，而非状态
- 需要确定性模拟
- 低带宽，高实现复杂度
- 最适合RTS、格斗游戏和少量玩家的MOBA
- 回滚变体提供响应式游戏体验

**状态同步**：
- 服务器维护权威状态
- 客户端预测和和解
- 较高带宽，更容易实现
- 最适合FPS、MMO和大规模游戏
- 可扩展到大量玩家

选择取决于你游戏的需求：
- 玩家数量
- 游戏类型和节奏
- 延迟容忍度
- 带宽限制
- 反作弊要求

许多现代游戏使用混合方法，结合两种方法的优势以获得最佳玩家体验。

---

## 延伸阅读

- [Gaffer On Games：网络物理](https://gafferongames.com/post/networked_physics_2004/)
- [Valve的Source多人网络](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking)
- [GGPO：Good Game Peace Out](https://www.ggpo.net/)
- [Gabriel Gambetta：快节奏多人游戏](https://www.gabrielgambetta.com/client-server-game-architecture.html)
- [守望先锋游戏架构和网络代码](https://www.youtube.com/watch?v=W3aieHjyNvw)
