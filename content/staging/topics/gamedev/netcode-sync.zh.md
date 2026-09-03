---
title: 网络同步技术详解
description: 掌握多人游戏同步核心技术：状态同步、帧同步、预测和延迟补偿
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - 同步
  - 网络代码
  - 延迟补偿
  - 预测
status: imported
origin: old/src/content/docs/gamedev/netcode-sync.zh.md
divergence: 0.227
issues: []
legacy:
  category: GameDev
  subcategory: Networking
  order: 24
  lastUpdated: 2026-01-07
---

网络同步是多人游戏开发中最具挑战性的技术领域之一。在网络环境中，延迟、丢包和带宽限制都会影响玩家体验。本文将深入探讨多人游戏中的核心同步技术，包括状态同步、帧同步、客户端预测、服务器协调以及延迟补偿等关键概念。

## 什么是网络同步

网络同步是指在多人游戏中，确保所有玩家看到一致的游戏世界状态的技术。由于网络延迟的存在，不同玩家的客户端在同一时刻可能处于不同的游戏状态，网络同步的目标就是尽可能缩小这种差异，提供流畅一致的游戏体验。

### 核心挑战

网络同步面临的主要挑战包括：

- **网络延迟（Latency）**：数据包从发送到接收需要时间，通常为 20-200ms
- **延迟抖动（Jitter）**：延迟不稳定，时高时低
- **丢包（Packet Loss）**：部分数据包在传输中丢失
- **带宽限制**：可用带宽有限，不能无限制发送数据
- **作弊防护**：需要防止客户端篡改数据

```
网络延迟示意图：

客户端 A                    服务器                    客户端 B
    │                         │                         │
    │──── 发送输入 (50ms) ────▶│                         │
    │                         │──── 广播状态 (50ms) ────▶│
    │                         │                         │
    │◀──── 接收状态 (50ms) ────│                         │
    │                         │                         │

    总延迟：100-150ms（从 A 操作到 B 看到结果）
```

## 状态同步 vs 帧同步

多人游戏同步主要有两种架构：状态同步和帧同步。它们各有优缺点，适用于不同类型的游戏。

### 状态同步（State Synchronization）

状态同步是指服务器定期将游戏状态（位置、生命值、得分等）发送给所有客户端。客户端接收状态后直接更新本地显示。

```typescript
// 状态同步：服务器端游戏状态
interface GameState {
  timestamp: number;
  players: Map<string, PlayerState>;
  entities: Map<string, EntityState>;
  gameTime: number;
}

interface PlayerState {
  id: string;
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
  health: number;
  animation: string;
  lastProcessedInput: number;
}

// 服务器：广播游戏状态
class GameServer {
  private state: GameState;
  private clients: Map<string, WebSocket>;
  private tickRate: number = 20; // 每秒20次更新

  constructor() {
    this.state = {
      timestamp: Date.now(),
      players: new Map(),
      entities: new Map(),
      gameTime: 0
    };

    // 启动游戏循环
    setInterval(() => this.tick(), 1000 / this.tickRate);
  }

  private tick(): void {
    // 1. 处理所有客户端输入
    this.processInputs();

    // 2. 更新游戏逻辑
    this.updateGameLogic();

    // 3. 广播状态给所有客户端
    this.broadcastState();
  }

  private processInputs(): void {
    // 处理输入队列中的所有输入
    for (const [clientId, inputs] of this.inputQueue) {
      const player = this.state.players.get(clientId);
      if (!player) continue;

      for (const input of inputs) {
        this.applyInput(player, input);
        player.lastProcessedInput = input.sequenceNumber;
      }
    }
    this.inputQueue.clear();
  }

  private broadcastState(): void {
    // 创建状态快照
    const snapshot = this.createSnapshot();

    // 序列化并发送给所有客户端
    const data = this.serializeSnapshot(snapshot);

    for (const [clientId, socket] of this.clients) {
      // 可以针对每个客户端进行定制（如视野裁剪）
      socket.send(data);
    }
  }

  private createSnapshot(): GameState {
    return {
      timestamp: Date.now(),
      players: new Map(this.state.players),
      entities: new Map(this.state.entities),
      gameTime: this.state.gameTime
    };
  }
}
```

**状态同步的优点**：
- 实现相对简单
- 服务器权威性强，易于防作弊
- 适合玩家数量较少的游戏
- 状态可以进行增量更新

**状态同步的缺点**：
- 带宽消耗较大
- 延迟感知明显
- 不适合需要精确同步的游戏（如格斗游戏）

### 帧同步（Lockstep）

帧同步是指所有客户端执行相同的游戏逻辑，服务器只同步玩家输入。由于使用确定性模拟，相同的输入会产生相同的结果。

```typescript
// 帧同步：只同步输入
interface PlayerInput {
  playerId: string;
  frame: number;
  actions: InputAction[];
  checksum?: number; // 用于验证同步
}

interface InputAction {
  type: 'move' | 'attack' | 'skill' | 'item';
  data: any;
}

// 帧同步客户端
class LockstepClient {
  private currentFrame: number = 0;
  private confirmedFrame: number = 0;
  private inputBuffer: Map<number, Map<string, PlayerInput>> = new Map();
  private localInputHistory: PlayerInput[] = [];
  private simulationSpeed: number = 60; // 60 FPS

  // 游戏主循环
  public update(deltaTime: number): void {
    // 1. 收集本地输入
    const localInput = this.collectLocalInput();
    this.localInputHistory.push(localInput);

    // 2. 发送输入到服务器
    this.sendInput(localInput);

    // 3. 等待所有玩家的输入
    if (this.hasAllInputsForFrame(this.currentFrame)) {
      // 4. 执行一帧模拟
      this.simulateFrame(this.currentFrame);
      this.currentFrame++;

      // 5. 验证同步状态
      this.validateSync();
    }
  }

  private collectLocalInput(): PlayerInput {
    const actions: InputAction[] = [];

    // 收集键盘输入
    if (Input.isKeyDown('W')) {
      actions.push({ type: 'move', data: { direction: 'forward' } });
    }
    if (Input.isKeyDown('Space')) {
      actions.push({ type: 'attack', data: { attackType: 'basic' } });
    }

    return {
      playerId: this.localPlayerId,
      frame: this.currentFrame,
      actions
    };
  }

  private hasAllInputsForFrame(frame: number): boolean {
    const frameInputs = this.inputBuffer.get(frame);
    if (!frameInputs) return false;

    // 检查是否收到所有玩家的输入
    return frameInputs.size === this.playerCount;
  }

  private simulateFrame(frame: number): void {
    const inputs = this.inputBuffer.get(frame)!;

    // 按照固定顺序处理所有玩家的输入
    const sortedInputs = Array.from(inputs.values())
      .sort((a, b) => a.playerId.localeCompare(b.playerId));

    for (const input of sortedInputs) {
      this.applyInput(input);
    }

    // 更新游戏逻辑（使用确定性物理）
    this.gameWorld.update(1 / this.simulationSpeed);

    // 计算状态校验和
    const checksum = this.calculateChecksum();
    this.frameChecksums.set(frame, checksum);
  }

  // 确定性随机数生成器
  private deterministicRandom(): number {
    // 使用确定性种子的伪随机数
    this.randomSeed = (this.randomSeed * 1103515245 + 12345) & 0x7fffffff;
    return this.randomSeed / 0x7fffffff;
  }

  private calculateChecksum(): number {
    // 计算游戏状态的哈希值用于同步验证
    let hash = 0;

    for (const player of this.gameWorld.players) {
      hash ^= this.hashPosition(player.position);
      hash ^= player.health;
    }

    return hash;
  }

  private validateSync(): void {
    // 定期验证所有客户端的状态是否一致
    if (this.currentFrame % 60 === 0) {
      this.sendSyncCheck(this.currentFrame, this.frameChecksums.get(this.currentFrame)!);
    }
  }
}
```

**帧同步的优点**：
- 带宽消耗极低（只传输输入）
- 精确同步，适合格斗、RTS 游戏
- 支持完美回放功能
- 适合局域网对战

**帧同步的缺点**：
- 要求确定性模拟（浮点数、随机数都要确定）
- 一个玩家卡顿会影响所有玩家
- 延迟等于最慢玩家的延迟
- 不适合大量玩家的游戏

### 对比总结

| 特性 | 状态同步 | 帧同步 |
|-----|---------|--------|
| 带宽消耗 | 高 | 低 |
| 延迟敏感度 | 可用预测缓解 | 等待最慢玩家 |
| 实现复杂度 | 较低 | 较高（需确定性） |
| 适合人数 | 几十人 | 几人到十几人 |
| 适合游戏类型 | FPS、MMO | RTS、格斗、MOBA |
| 回放支持 | 需存储状态 | 只需存储输入 |
| 防作弊 | 服务器权威 | 需要额外验证 |

## 客户端预测（Client-Side Prediction）

客户端预测是解决网络延迟问题的核心技术。它允许客户端在等待服务器确认之前，立即响应玩家输入，从而提供流畅的游戏体验。

### 基本原理

```
没有预测时：
    输入 ────▶ 等待服务器响应 ────▶ 显示结果
    │◄─────────── 100ms+ ──────────▶│

使用预测时：
    输入 ────▶ 立即本地模拟 ────▶ 显示预测结果
                                      │
    输入 ────▶ 发送到服务器 ────▶ 收到确认 ────▶ 如有差异则修正
```

### 实现客户端预测

```typescript
// 客户端预测系统
class ClientPrediction {
  private localPlayer: Player;
  private pendingInputs: PlayerInput[] = [];  // 未确认的输入
  private inputSequenceNumber: number = 0;
  private serverState: PlayerState | null = null;

  // 处理本地输入
  public processLocalInput(input: RawInput): void {
    // 1. 创建输入包
    const playerInput: PlayerInput = {
      sequenceNumber: this.inputSequenceNumber++,
      timestamp: Date.now(),
      moveDirection: input.moveDirection,
      actions: input.actions
    };

    // 2. 立即在本地应用输入（预测）
    this.applyInput(this.localPlayer, playerInput);

    // 3. 保存输入用于后续协调
    this.pendingInputs.push(playerInput);

    // 4. 发送输入到服务器
    this.sendToServer({
      type: 'input',
      data: playerInput
    });
  }

  // 应用输入到玩家状态
  private applyInput(player: Player, input: PlayerInput): void {
    const speed = player.moveSpeed;
    const deltaTime = 1 / 60; // 假设 60 FPS

    // 应用移动
    if (input.moveDirection) {
      player.position.x += input.moveDirection.x * speed * deltaTime;
      player.position.y += input.moveDirection.y * speed * deltaTime;
      player.position.z += input.moveDirection.z * speed * deltaTime;
    }

    // 应用动作
    for (const action of input.actions) {
      this.processAction(player, action);
    }
  }

  // 处理服务器状态更新
  public onServerUpdate(serverState: ServerStateUpdate): void {
    // 1. 更新服务器权威状态
    this.serverState = serverState.playerState;

    // 2. 丢弃已被服务器确认的输入
    this.pendingInputs = this.pendingInputs.filter(
      input => input.sequenceNumber > serverState.lastProcessedInput
    );

    // 3. 服务器协调：基于服务器状态重新应用未确认的输入
    this.reconcile();
  }

  // 服务器协调
  private reconcile(): void {
    if (!this.serverState) return;

    // 将玩家状态重置为服务器状态
    this.localPlayer.position = { ...this.serverState.position };
    this.localPlayer.velocity = { ...this.serverState.velocity };

    // 重新应用所有未确认的输入
    for (const input of this.pendingInputs) {
      this.applyInput(this.localPlayer, input);
    }
  }
}

// 完整的客户端游戏循环
class GameClient {
  private prediction: ClientPrediction;
  private interpolation: EntityInterpolation;
  private lastUpdateTime: number = 0;

  public update(currentTime: number): void {
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    // 1. 收集并处理本地输入
    const input = this.inputManager.getInput();
    if (input) {
      this.prediction.processLocalInput(input);
    }

    // 2. 更新本地预测
    this.prediction.update(deltaTime);

    // 3. 插值远程实体
    this.interpolation.update(currentTime);

    // 4. 渲染
    this.render();
  }

  // 接收服务器消息
  public onServerMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'state_update':
        // 处理状态更新
        this.prediction.onServerUpdate(message.data);
        this.interpolation.addSnapshot(message.data);
        break;

      case 'event':
        // 处理游戏事件
        this.handleGameEvent(message.data);
        break;
    }
  }
}
```

### 预测误差处理

当预测结果与服务器结果不一致时，需要平滑地修正：

```typescript
// 平滑误差修正
class SmoothCorrection {
  private correctionBlend: number = 0.1; // 混合系数
  private positionError: Vector3 = { x: 0, y: 0, z: 0 };
  private maxCorrectionSpeed: number = 10; // 每秒最大修正距离

  // 接收服务器修正
  public applyCorrection(
    currentPosition: Vector3,
    serverPosition: Vector3
  ): Vector3 {
    // 计算误差
    this.positionError = {
      x: serverPosition.x - currentPosition.x,
      y: serverPosition.y - currentPosition.y,
      z: serverPosition.z - currentPosition.z
    };

    const errorMagnitude = this.magnitude(this.positionError);

    // 如果误差很大，立即修正（可能是传送等情况）
    if (errorMagnitude > 5.0) {
      return serverPosition;
    }

    // 否则平滑修正
    return {
      x: currentPosition.x + this.positionError.x * this.correctionBlend,
      y: currentPosition.y + this.positionError.y * this.correctionBlend,
      z: currentPosition.z + this.positionError.z * this.correctionBlend
    };
  }

  // 持续修正（每帧调用）
  public updateCorrection(deltaTime: number): Vector3 {
    const maxCorrection = this.maxCorrectionSpeed * deltaTime;
    const errorMagnitude = this.magnitude(this.positionError);

    if (errorMagnitude <= maxCorrection) {
      // 误差很小，直接消除
      const correction = { ...this.positionError };
      this.positionError = { x: 0, y: 0, z: 0 };
      return correction;
    }

    // 按最大速度修正
    const correction = {
      x: (this.positionError.x / errorMagnitude) * maxCorrection,
      y: (this.positionError.y / errorMagnitude) * maxCorrection,
      z: (this.positionError.z / errorMagnitude) * maxCorrection
    };

    this.positionError.x -= correction.x;
    this.positionError.y -= correction.y;
    this.positionError.z -= correction.z;

    return correction;
  }

  private magnitude(v: Vector3): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }
}
```

## 服务器协调（Server Reconciliation）

服务器协调是客户端预测的配套技术，用于处理预测误差并确保客户端状态与服务器权威状态一致。

### 协调流程

```
时间线：
t0: 客户端发送输入 #1，本地预测位置 P1
t1: 客户端发送输入 #2，本地预测位置 P2
t2: 客户端发送输入 #3，本地预测位置 P3
t3: 服务器响应到达，确认输入 #1，服务器位置 S1

协调过程：
1. 发现 S1 != P1（预测误差）
2. 将位置重置为 S1
3. 重新应用输入 #2 和 #3
4. 得到新的预测位置 P3'
```

```typescript
// 服务器端：处理客户端输入
class GameServer {
  private players: Map<string, ServerPlayer> = new Map();
  private inputQueues: Map<string, PlayerInput[]> = new Map();
  private tickRate: number = 60;

  // 接收客户端输入
  public onClientInput(clientId: string, input: PlayerInput): void {
    // 验证输入的有效性
    if (!this.validateInput(clientId, input)) {
      console.warn(`Invalid input from ${clientId}`);
      return;
    }

    // 将输入加入处理队列
    const queue = this.inputQueues.get(clientId) || [];
    queue.push(input);
    this.inputQueues.set(clientId, queue);
  }

  // 验证输入
  private validateInput(clientId: string, input: PlayerInput): boolean {
    const player = this.players.get(clientId);
    if (!player) return false;

    // 检查序列号是否递增
    if (input.sequenceNumber <= player.lastProcessedInput) {
      return false;
    }

    // 检查移动速度是否合理（防作弊）
    if (input.moveDirection) {
      const speed = this.magnitude(input.moveDirection);
      if (speed > player.maxMoveSpeed * 1.1) { // 允许 10% 误差
        return false;
      }
    }

    // 检查时间戳是否合理
    const timeDiff = Date.now() - input.timestamp;
    if (timeDiff < -1000 || timeDiff > 5000) { // 允许 1 秒提前，5 秒延迟
      return false;
    }

    return true;
  }

  // 游戏 Tick
  private tick(): void {
    const deltaTime = 1 / this.tickRate;

    // 处理所有玩家的输入
    for (const [clientId, player] of this.players) {
      const inputs = this.inputQueues.get(clientId) || [];

      for (const input of inputs) {
        // 应用输入
        this.applyInput(player, input, deltaTime);
        player.lastProcessedInput = input.sequenceNumber;
      }

      this.inputQueues.set(clientId, []);
    }

    // 更新游戏物理
    this.updatePhysics(deltaTime);

    // 检测碰撞
    this.detectCollisions();

    // 发送状态更新
    this.sendStateUpdates();
  }

  // 发送状态更新给所有客户端
  private sendStateUpdates(): void {
    for (const [clientId, player] of this.players) {
      const update: ServerStateUpdate = {
        timestamp: Date.now(),
        playerState: {
          position: player.position,
          velocity: player.velocity,
          health: player.health
        },
        lastProcessedInput: player.lastProcessedInput,
        // 发送该玩家视野内的其他实体
        nearbyEntities: this.getEntitiesInView(player)
      };

      this.sendToClient(clientId, {
        type: 'state_update',
        data: update
      });
    }
  }
}
```

## 插值和外插（Interpolation & Extrapolation）

对于非本地玩家控制的实体，客户端需要使用插值或外插来平滑显示它们的运动。

### 实体插值（Entity Interpolation）

插值是在已知的两个状态之间进行平滑过渡：

```typescript
// 实体插值系统
class EntityInterpolation {
  private entitySnapshots: Map<string, Snapshot[]> = new Map();
  private interpolationDelay: number = 100; // 100ms 的插值延迟

  // 添加新的快照
  public addSnapshot(entityId: string, snapshot: Snapshot): void {
    const snapshots = this.entitySnapshots.get(entityId) || [];
    snapshots.push(snapshot);

    // 保留最近的快照（约 1 秒）
    while (snapshots.length > 20) {
      snapshots.shift();
    }

    this.entitySnapshots.set(entityId, snapshots);
  }

  // 获取插值后的状态
  public getInterpolatedState(entityId: string, currentTime: number): EntityState | null {
    const snapshots = this.entitySnapshots.get(entityId);
    if (!snapshots || snapshots.length < 2) {
      return null;
    }

    // 计算渲染时间（当前时间 - 插值延迟）
    const renderTime = currentTime - this.interpolationDelay;

    // 找到两个用于插值的快照
    let before: Snapshot | null = null;
    let after: Snapshot | null = null;

    for (let i = 0; i < snapshots.length - 1; i++) {
      if (snapshots[i].timestamp <= renderTime &&
          snapshots[i + 1].timestamp >= renderTime) {
        before = snapshots[i];
        after = snapshots[i + 1];
        break;
      }
    }

    if (!before || !after) {
      // 没有合适的快照，使用外插或最新状态
      return this.extrapolate(entityId, snapshots, renderTime);
    }

    // 计算插值因子
    const t = (renderTime - before.timestamp) /
              (after.timestamp - before.timestamp);

    // 进行插值
    return this.interpolate(before.state, after.state, t);
  }

  // 线性插值
  private interpolate(a: EntityState, b: EntityState, t: number): EntityState {
    return {
      position: {
        x: a.position.x + (b.position.x - a.position.x) * t,
        y: a.position.y + (b.position.y - a.position.y) * t,
        z: a.position.z + (b.position.z - a.position.z) * t
      },
      // 旋转使用球面线性插值（slerp）
      rotation: this.slerp(a.rotation, b.rotation, t),
      // 其他属性可以直接使用最新值或插值
      animation: t < 0.5 ? a.animation : b.animation
    };
  }

  // 球面线性插值（用于旋转）
  private slerp(a: Quaternion, b: Quaternion, t: number): Quaternion {
    let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;

    // 处理负点积（选择最短路径）
    if (dot < 0) {
      b = { x: -b.x, y: -b.y, z: -b.z, w: -b.w };
      dot = -dot;
    }

    // 如果接近，使用线性插值
    if (dot > 0.9995) {
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t,
        w: a.w + (b.w - a.w) * t
      };
    }

    // 标准 slerp
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
}
```

### 外插（Extrapolation）

当没有足够的数据进行插值时，可以使用外插来预测实体位置：

```typescript
// 外插系统
class EntityExtrapolation {
  // 基于速度的外插
  public extrapolate(
    lastKnownState: EntityState,
    timeSinceLastUpdate: number
  ): EntityState {
    return {
      position: {
        x: lastKnownState.position.x +
           lastKnownState.velocity.x * timeSinceLastUpdate,
        y: lastKnownState.position.y +
           lastKnownState.velocity.y * timeSinceLastUpdate,
        z: lastKnownState.position.z +
           lastKnownState.velocity.z * timeSinceLastUpdate
      },
      velocity: lastKnownState.velocity,
      rotation: lastKnownState.rotation,
      animation: lastKnownState.animation
    };
  }

  // 基于加速度的外插（更精确）
  public extrapolateWithAcceleration(
    lastKnownState: EntityState,
    timeSinceLastUpdate: number
  ): EntityState {
    const t = timeSinceLastUpdate;
    const t2 = t * t * 0.5;

    return {
      position: {
        x: lastKnownState.position.x +
           lastKnownState.velocity.x * t +
           lastKnownState.acceleration.x * t2,
        y: lastKnownState.position.y +
           lastKnownState.velocity.y * t +
           lastKnownState.acceleration.y * t2,
        z: lastKnownState.position.z +
           lastKnownState.velocity.z * t +
           lastKnownState.acceleration.z * t2
      },
      velocity: {
        x: lastKnownState.velocity.x + lastKnownState.acceleration.x * t,
        y: lastKnownState.velocity.y + lastKnownState.acceleration.y * t,
        z: lastKnownState.velocity.z + lastKnownState.acceleration.z * t
      },
      rotation: lastKnownState.rotation,
      animation: lastKnownState.animation
    };
  }

  // 外插限制：防止外插太远导致明显错误
  public extrapolateWithLimit(
    lastKnownState: EntityState,
    timeSinceLastUpdate: number,
    maxExtrapolationTime: number = 250 // 最多外插 250ms
  ): EntityState {
    const clampedTime = Math.min(timeSinceLastUpdate, maxExtrapolationTime);
    return this.extrapolate(lastKnownState, clampedTime);
  }
}
```

## 延迟补偿（Lag Compensation）

延迟补偿主要用于射击等需要精确命中判定的游戏。服务器需要"回到过去"来验证玩家的射击是否命中。

### 基本原理

```
客户端看到的画面（t - RTT/2）：
    目标在位置 A
    玩家开枪射击位置 A

服务器收到射击请求时（t）：
    目标已经移动到位置 B
    如果直接判定，玩家永远打不中移动目标

延迟补偿：
    服务器回溯到（t - RTT/2）的状态
    在那个时刻判定射击是否命中
```

### 实现延迟补偿

```typescript
// 延迟补偿系统
class LagCompensation {
  private worldHistory: WorldState[] = [];
  private maxHistoryLength: number = 1000; // 保存 1 秒的历史
  private tickRate: number = 60;

  // 每个 Tick 保存世界状态
  public saveWorldState(): void {
    const state: WorldState = {
      timestamp: Date.now(),
      entities: new Map()
    };

    // 保存所有可命中实体的状态
    for (const entity of this.world.getHittableEntities()) {
      state.entities.set(entity.id, {
        position: { ...entity.position },
        hitbox: entity.getHitbox()
      });
    }

    this.worldHistory.push(state);

    // 清理过期历史
    while (this.worldHistory.length > this.maxHistoryLength / (1000 / this.tickRate)) {
      this.worldHistory.shift();
    }
  }

  // 处理射击请求
  public processShot(
    shooterId: string,
    shotData: ShotData
  ): HitResult {
    const shooter = this.world.getPlayer(shooterId);
    if (!shooter) {
      return { hit: false, reason: 'shooter_not_found' };
    }

    // 计算射击时的估计时间（当前时间 - 客户端延迟）
    const clientLatency = shooter.getLatency();
    const shotTime = Date.now() - clientLatency;

    // 获取射击时刻的世界状态
    const historicalState = this.getStateAtTime(shotTime);
    if (!historicalState) {
      // 历史状态不存在，使用当前状态
      return this.checkHitCurrent(shotData);
    }

    // 在历史状态中进行命中判定
    return this.checkHitHistorical(shotData, historicalState);
  }

  // 获取指定时间的世界状态
  private getStateAtTime(targetTime: number): WorldState | null {
    if (this.worldHistory.length < 2) {
      return null;
    }

    // 找到目标时间前后的两个状态
    let before: WorldState | null = null;
    let after: WorldState | null = null;

    for (let i = this.worldHistory.length - 1; i >= 0; i--) {
      if (this.worldHistory[i].timestamp <= targetTime) {
        before = this.worldHistory[i];
        if (i < this.worldHistory.length - 1) {
          after = this.worldHistory[i + 1];
        }
        break;
      }
    }

    if (!before) {
      return null;
    }

    // 如果没有 after，使用 before
    if (!after) {
      return before;
    }

    // 在两个状态之间插值
    return this.interpolateWorldState(before, after, targetTime);
  }

  // 插值世界状态
  private interpolateWorldState(
    before: WorldState,
    after: WorldState,
    targetTime: number
  ): WorldState {
    const t = (targetTime - before.timestamp) /
              (after.timestamp - before.timestamp);

    const interpolated: WorldState = {
      timestamp: targetTime,
      entities: new Map()
    };

    // 插值每个实体的状态
    for (const [entityId, beforeState] of before.entities) {
      const afterState = after.entities.get(entityId);
      if (!afterState) {
        // 实体在 after 中不存在，使用 before 状态
        interpolated.entities.set(entityId, beforeState);
        continue;
      }

      interpolated.entities.set(entityId, {
        position: {
          x: beforeState.position.x +
             (afterState.position.x - beforeState.position.x) * t,
          y: beforeState.position.y +
             (afterState.position.y - beforeState.position.y) * t,
          z: beforeState.position.z +
             (afterState.position.z - beforeState.position.z) * t
        },
        hitbox: beforeState.hitbox // 碰撞体通常不插值
      });
    }

    return interpolated;
  }

  // 在历史状态中检查命中
  private checkHitHistorical(
    shotData: ShotData,
    worldState: WorldState
  ): HitResult {
    // 射线检测
    const ray = {
      origin: shotData.origin,
      direction: shotData.direction
    };

    let closestHit: HitResult | null = null;
    let closestDistance = Infinity;

    for (const [entityId, entityState] of worldState.entities) {
      if (entityId === shotData.shooterId) continue; // 不能打自己

      const hitResult = this.raycastHitbox(ray, entityState.hitbox, entityState.position);

      if (hitResult.hit && hitResult.distance < closestDistance) {
        closestDistance = hitResult.distance;
        closestHit = {
          hit: true,
          entityId,
          hitPoint: hitResult.point,
          hitPart: hitResult.part, // 头部/身体/四肢等
          distance: hitResult.distance
        };
      }
    }

    return closestHit || { hit: false };
  }

  // 射线与碰撞体检测
  private raycastHitbox(
    ray: Ray,
    hitbox: Hitbox,
    position: Vector3
  ): RaycastResult {
    // 实现射线与各种形状（胶囊体、盒体等）的相交检测
    // 这里简化为球体检测

    for (const part of hitbox.parts) {
      const worldPartPosition = {
        x: position.x + part.offset.x,
        y: position.y + part.offset.y,
        z: position.z + part.offset.z
      };

      const result = this.raySpheresIntersection(
        ray.origin,
        ray.direction,
        worldPartPosition,
        part.radius
      );

      if (result.hit) {
        return {
          hit: true,
          distance: result.distance,
          point: result.point,
          part: part.name
        };
      }
    }

    return { hit: false, distance: Infinity, point: null, part: null };
  }
}
```

### 延迟补偿的限制

```typescript
// 延迟补偿配置
const LAG_COMPENSATION_CONFIG = {
  // 最大补偿时间（ms）
  // 超过这个延迟的玩家将得不到完全补偿
  maxCompensation: 200,

  // 最大回溯时间（ms）
  // 服务器历史记录的长度
  maxRewindTime: 1000,

  // 补偿衰减
  // 延迟越高，补偿越少
  compensationDecay: {
    threshold: 100,  // 100ms 以下完全补偿
    decayRate: 0.5   // 超过阈值后每 100ms 补偿减少 50%
  }
};

function getEffectiveCompensation(clientLatency: number): number {
  const config = LAG_COMPENSATION_CONFIG;

  if (clientLatency <= config.compensationDecay.threshold) {
    return clientLatency;
  }

  const excess = clientLatency - config.compensationDecay.threshold;
  const decay = Math.pow(config.compensationDecay.decayRate,
                         excess / 100);

  return config.compensationDecay.threshold + excess * decay;
}
```

## 回滚网络代码（Rollback Netcode）

回滚网络代码是一种结合了预测和回滚修正的高级同步技术，在格斗游戏中广泛使用。

### 核心原理

```
帧 1: 本地输入 A，远程输入预测为 None
帧 2: 本地输入 B，远程输入预测为 None
帧 3: 收到远程玩家在帧 1 的真实输入 X
      发现预测错误！
      回滚到帧 0
      使用正确输入（A, X）重新模拟帧 1
      使用（B, 预测）重新模拟帧 2
      继续当前帧
```

### 实现回滚系统

```typescript
// 回滚网络代码系统
class RollbackNetcode {
  private currentFrame: number = 0;
  private localPlayerIndex: number;
  private playerCount: number;

  // 游戏状态历史
  private stateHistory: GameState[] = [];
  private maxRollbackFrames: number = 7; // 最大回滚帧数

  // 输入历史
  private confirmedInputs: Map<number, PlayerInput[]> = new Map(); // 已确认
  private predictedInputs: Map<number, PlayerInput[]> = new Map(); // 预测的
  private localInputHistory: PlayerInput[] = [];

  // 游戏模拟器（必须是确定性的）
  private simulator: DeterministicSimulator;

  constructor(localPlayerIndex: number, playerCount: number) {
    this.localPlayerIndex = localPlayerIndex;
    this.playerCount = playerCount;
    this.simulator = new DeterministicSimulator();
  }

  // 主更新循环
  public update(): void {
    // 1. 处理网络消息
    this.processNetworkMessages();

    // 2. 收集本地输入
    const localInput = this.collectLocalInput();
    this.localInputHistory[this.currentFrame] = localInput;

    // 3. 发送本地输入
    this.sendInput(localInput);

    // 4. 检查是否需要回滚
    const rollbackFrame = this.checkRollback();
    if (rollbackFrame >= 0) {
      this.rollback(rollbackFrame);
    }

    // 5. 模拟当前帧
    this.simulateFrame();

    // 6. 保存状态用于可能的回滚
    this.saveState();

    this.currentFrame++;
  }

  // 检查是否需要回滚
  private checkRollback(): number {
    // 检查是否有新确认的输入与之前的预测不同
    for (let frame = this.currentFrame - this.maxRollbackFrames;
         frame < this.currentFrame; frame++) {

      if (frame < 0) continue;

      const confirmed = this.confirmedInputs.get(frame);
      const predicted = this.predictedInputs.get(frame);

      if (confirmed && predicted) {
        // 比较每个远程玩家的输入
        for (let p = 0; p < this.playerCount; p++) {
          if (p === this.localPlayerIndex) continue;

          if (!this.inputsEqual(confirmed[p], predicted[p])) {
            return frame; // 需要从这一帧开始回滚
          }
        }
      }
    }

    return -1; // 不需要回滚
  }

  // 执行回滚
  private rollback(targetFrame: number): void {
    console.log(`Rolling back from frame ${this.currentFrame} to ${targetFrame}`);

    // 1. 恢复到目标帧的状态
    const savedState = this.stateHistory[targetFrame % this.maxRollbackFrames];
    if (!savedState) {
      console.error('Cannot rollback: state not found');
      return;
    }

    this.simulator.loadState(savedState);

    // 2. 使用正确的输入重新模拟每一帧
    for (let frame = targetFrame; frame < this.currentFrame; frame++) {
      const inputs = this.getInputsForFrame(frame);
      this.simulator.simulateFrame(inputs);
    }

    // 3. 更新预测输入历史
    for (let frame = targetFrame; frame < this.currentFrame; frame++) {
      const confirmed = this.confirmedInputs.get(frame);
      if (confirmed) {
        this.predictedInputs.set(frame, confirmed);
      }
    }
  }

  // 获取某一帧的所有玩家输入
  private getInputsForFrame(frame: number): PlayerInput[] {
    const inputs: PlayerInput[] = [];

    for (let p = 0; p < this.playerCount; p++) {
      if (p === this.localPlayerIndex) {
        // 本地玩家：使用实际输入
        inputs.push(this.localInputHistory[frame]);
      } else {
        // 远程玩家：优先使用确认输入，否则使用预测
        const confirmed = this.confirmedInputs.get(frame);
        if (confirmed && confirmed[p]) {
          inputs.push(confirmed[p]);
        } else {
          inputs.push(this.predictRemoteInput(p, frame));
        }
      }
    }

    return inputs;
  }

  // 预测远程玩家输入
  private predictRemoteInput(playerIndex: number, frame: number): PlayerInput {
    // 策略1：使用上一帧的输入
    const lastConfirmedFrame = this.getLastConfirmedFrame(playerIndex);
    if (lastConfirmedFrame >= 0) {
      const lastInput = this.confirmedInputs.get(lastConfirmedFrame)?.[playerIndex];
      if (lastInput) {
        return { ...lastInput };
      }
    }

    // 策略2：使用空输入
    return this.createEmptyInput(playerIndex);
  }

  // 保存当前状态
  private saveState(): void {
    const state = this.simulator.saveState();
    this.stateHistory[this.currentFrame % this.maxRollbackFrames] = state;
  }

  // 模拟当前帧
  private simulateFrame(): void {
    const inputs = this.getInputsForFrame(this.currentFrame);

    // 保存预测输入
    this.predictedInputs.set(this.currentFrame, inputs);

    // 执行模拟
    this.simulator.simulateFrame(inputs);
  }

  // 处理收到的远程输入
  public onRemoteInput(playerIndex: number, frame: number, input: PlayerInput): void {
    // 存储确认的输入
    let frameInputs = this.confirmedInputs.get(frame);
    if (!frameInputs) {
      frameInputs = new Array(this.playerCount);
      this.confirmedInputs.set(frame, frameInputs);
    }
    frameInputs[playerIndex] = input;
  }

  private inputsEqual(a: PlayerInput | undefined, b: PlayerInput | undefined): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;

    return a.horizontal === b.horizontal &&
           a.vertical === b.vertical &&
           a.buttons === b.buttons;
  }
}

// 确定性模拟器
class DeterministicSimulator {
  private state: GameState;
  private randomSeed: number;

  constructor() {
    this.state = this.createInitialState();
    this.randomSeed = 12345; // 固定种子
  }

  public simulateFrame(inputs: PlayerInput[]): void {
    // 处理输入
    for (let i = 0; i < inputs.length; i++) {
      this.processPlayerInput(i, inputs[i]);
    }

    // 更新物理（使用定点数或确定性浮点数）
    this.updatePhysics();

    // 处理碰撞
    this.handleCollisions();

    // 更新游戏逻辑
    this.updateGameLogic();
  }

  public saveState(): GameState {
    // 深拷贝状态
    return JSON.parse(JSON.stringify(this.state));
  }

  public loadState(state: GameState): void {
    this.state = JSON.parse(JSON.stringify(state));
  }

  // 确定性随机数
  private random(): number {
    this.randomSeed = (this.randomSeed * 1103515245 + 12345) & 0x7fffffff;
    return this.randomSeed / 0x7fffffff;
  }

  // 使用定点数进行物理计算
  private updatePhysics(): void {
    for (const entity of this.state.entities) {
      // 使用整数运算模拟浮点数（定点数）
      // 例如：position 存储为 position * 1000
      entity.positionFixed.x += entity.velocityFixed.x;
      entity.positionFixed.y += entity.velocityFixed.y;

      // 重力（定点数形式）
      entity.velocityFixed.y += GRAVITY_FIXED;
    }
  }
}
```

## 快照系统（Snapshot System）

快照系统用于状态同步架构中，服务器定期将完整的游戏状态快照发送给客户端。

### 快照结构设计

```typescript
// 快照数据结构
interface Snapshot {
  // 元数据
  sequence: number;        // 快照序列号
  timestamp: number;       // 服务器时间
  serverTick: number;      // 服务器 Tick

  // 游戏状态
  players: PlayerSnapshot[];
  entities: EntitySnapshot[];
  projectiles: ProjectileSnapshot[];

  // 增量更新信息
  baseSnapshot?: number;   // 基于哪个快照的增量
  deltaFlags?: number;     // 哪些部分有变化
}

interface PlayerSnapshot {
  id: string;
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
  health: number;
  armor: number;
  weapon: number;
  animation: AnimationState;
  lastProcessedInput: number;
}

interface EntitySnapshot {
  id: string;
  type: number;
  position: Vector3;
  rotation: Quaternion;
  state: number;
  customData?: any;
}

// 快照管理器（服务器端）
class SnapshotManager {
  private snapshots: Map<number, Snapshot> = new Map();
  private currentSequence: number = 0;
  private maxSnapshots: number = 32;
  private snapshotRate: number = 20; // 每秒 20 个快照

  // 创建新快照
  public createSnapshot(world: GameWorld): Snapshot {
    const snapshot: Snapshot = {
      sequence: this.currentSequence++,
      timestamp: Date.now(),
      serverTick: world.tick,
      players: this.snapshotPlayers(world.players),
      entities: this.snapshotEntities(world.entities),
      projectiles: this.snapshotProjectiles(world.projectiles)
    };

    // 存储快照
    this.snapshots.set(snapshot.sequence, snapshot);

    // 清理旧快照
    if (this.snapshots.size > this.maxSnapshots) {
      const oldestSequence = snapshot.sequence - this.maxSnapshots;
      this.snapshots.delete(oldestSequence);
    }

    return snapshot;
  }

  // 创建增量快照
  public createDeltaSnapshot(
    world: GameWorld,
    clientAckedSequence: number
  ): DeltaSnapshot {
    const fullSnapshot = this.createSnapshot(world);
    const baseSnapshot = this.snapshots.get(clientAckedSequence);

    if (!baseSnapshot) {
      // 客户端太落后，发送完整快照
      return { type: 'full', snapshot: fullSnapshot };
    }

    // 计算差异
    const delta = this.calculateDelta(baseSnapshot, fullSnapshot);

    return {
      type: 'delta',
      baseSequence: clientAckedSequence,
      sequence: fullSnapshot.sequence,
      timestamp: fullSnapshot.timestamp,
      delta
    };
  }

  // 计算快照差异
  private calculateDelta(base: Snapshot, current: Snapshot): SnapshotDelta {
    const delta: SnapshotDelta = {
      addedPlayers: [],
      removedPlayers: [],
      changedPlayers: [],
      addedEntities: [],
      removedEntities: [],
      changedEntities: []
    };

    // 比较玩家状态
    const basePlayers = new Map(base.players.map(p => [p.id, p]));
    const currentPlayers = new Map(current.players.map(p => [p.id, p]));

    for (const [id, player] of currentPlayers) {
      const basePlayer = basePlayers.get(id);
      if (!basePlayer) {
        delta.addedPlayers.push(player);
      } else if (!this.playersEqual(basePlayer, player)) {
        delta.changedPlayers.push(this.createPlayerDelta(basePlayer, player));
      }
    }

    for (const id of basePlayers.keys()) {
      if (!currentPlayers.has(id)) {
        delta.removedPlayers.push(id);
      }
    }

    // 类似处理实体...

    return delta;
  }

  // 比较玩家状态
  private playersEqual(a: PlayerSnapshot, b: PlayerSnapshot): boolean {
    return (
      a.position.x === b.position.x &&
      a.position.y === b.position.y &&
      a.position.z === b.position.z &&
      a.health === b.health &&
      a.weapon === b.weapon
      // ... 其他字段比较
    );
  }
}
```

### 快照压缩

```typescript
// 快照压缩系统
class SnapshotCompression {
  // 量化位置（减少精度换取更小的数据）
  public quantizePosition(position: Vector3): QuantizedVector3 {
    // 将浮点数转换为整数（保留 2 位小数精度）
    return {
      x: Math.round(position.x * 100),
      y: Math.round(position.y * 100),
      z: Math.round(position.z * 100)
    };
  }

  // 量化旋转（使用最小三分量法）
  public quantizeRotation(rotation: Quaternion): QuantizedRotation {
    // 找到最大分量
    const abs = [
      Math.abs(rotation.x),
      Math.abs(rotation.y),
      Math.abs(rotation.z),
      Math.abs(rotation.w)
    ];

    const maxIndex = abs.indexOf(Math.max(...abs));

    // 存储最大分量的索引和其他三个分量
    const values: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (i !== maxIndex) {
        // 将 [-1, 1] 映射到 [0, 65535]
        const normalized = (rotation[['x', 'y', 'z', 'w'][i] as keyof Quaternion] + 1) * 0.5;
        values.push(Math.round(normalized * 65535));
      }
    }

    return {
      maxComponentIndex: maxIndex,
      a: values[0],
      b: values[1],
      c: values[2]
    };
  }

  // 位打包
  public packPlayerState(player: PlayerSnapshot): Uint8Array {
    const buffer = new ArrayBuffer(32);
    const view = new DataView(buffer);
    let offset = 0;

    // 位置（每个分量 2 字节，共 6 字节）
    const pos = this.quantizePosition(player.position);
    view.setInt16(offset, pos.x, true); offset += 2;
    view.setInt16(offset, pos.y, true); offset += 2;
    view.setInt16(offset, pos.z, true); offset += 2;

    // 旋转（7 字节：1 字节索引 + 3 个 2 字节分量）
    const rot = this.quantizeRotation(player.rotation);
    view.setUint8(offset, rot.maxComponentIndex); offset += 1;
    view.setUint16(offset, rot.a, true); offset += 2;
    view.setUint16(offset, rot.b, true); offset += 2;
    view.setUint16(offset, rot.c, true); offset += 2;

    // 生命值（2 字节）
    view.setUint16(offset, player.health, true); offset += 2;

    // 武器和动画状态（各 1 字节）
    view.setUint8(offset, player.weapon); offset += 1;
    view.setUint8(offset, player.animation.state); offset += 1;

    // 最后处理的输入序号（4 字节）
    view.setUint32(offset, player.lastProcessedInput, true); offset += 4;

    return new Uint8Array(buffer, 0, offset);
  }

  // 使用字典编码压缩字符串 ID
  private idDictionary: Map<string, number> = new Map();

  public encodeId(id: string): number {
    let encoded = this.idDictionary.get(id);
    if (encoded === undefined) {
      encoded = this.idDictionary.size;
      this.idDictionary.set(id, encoded);
    }
    return encoded;
  }
}
```

## 带宽优化

在网络同步中，带宽是宝贵的资源，需要通过各种技术来优化。

### 视野裁剪（Interest Management）

只发送玩家视野内或附近的实体状态：

```typescript
// 视野管理系统
class InterestManagement {
  private gridSize: number = 100; // 网格大小
  private grid: Map<string, Set<string>> = new Map(); // 空间划分网格
  private playerInterestAreas: Map<string, InterestArea> = new Map();

  // 更新玩家的关注区域
  public updatePlayerInterest(playerId: string, position: Vector3): void {
    const area: InterestArea = {
      center: position,
      radius: 500, // 关注半径
      priority: [] // 优先级实体列表
    };

    // 使用空间划分加速查询
    const cellX = Math.floor(position.x / this.gridSize);
    const cellZ = Math.floor(position.z / this.gridSize);

    const nearbyEntities: EntityWithPriority[] = [];

    // 检查周围的网格
    for (let dx = -5; dx <= 5; dx++) {
      for (let dz = -5; dz <= 5; dz++) {
        const cellKey = `${cellX + dx},${cellZ + dz}`;
        const cellEntities = this.grid.get(cellKey);

        if (cellEntities) {
          for (const entityId of cellEntities) {
            const entity = this.world.getEntity(entityId);
            if (!entity) continue;

            const distance = this.distance(position, entity.position);

            if (distance <= area.radius) {
              nearbyEntities.push({
                id: entityId,
                distance,
                priority: this.calculatePriority(playerId, entity, distance)
              });
            }
          }
        }
      }
    }

    // 按优先级排序
    nearbyEntities.sort((a, b) => b.priority - a.priority);

    // 限制实体数量
    area.priority = nearbyEntities.slice(0, 64).map(e => e.id);

    this.playerInterestAreas.set(playerId, area);
  }

  // 计算实体优先级
  private calculatePriority(
    playerId: string,
    entity: Entity,
    distance: number
  ): number {
    let priority = 0;

    // 距离越近优先级越高
    priority += (1 - distance / 500) * 100;

    // 玩家实体优先级更高
    if (entity.type === 'player') {
      priority += 200;
    }

    // 正在交互的实体优先级更高
    if (entity.interactingWith === playerId) {
      priority += 300;
    }

    // 威胁实体优先级更高
    if (entity.type === 'enemy' && entity.target === playerId) {
      priority += 250;
    }

    return priority;
  }

  // 获取应该发送给玩家的实体列表
  public getEntitiesForPlayer(playerId: string): string[] {
    const area = this.playerInterestAreas.get(playerId);
    return area ? area.priority : [];
  }
}
```

### 优先级更新

根据实体重要性分配不同的更新频率：

```typescript
// 优先级更新系统
class PriorityUpdateSystem {
  private updateBudget: number = 4096; // 每次更新的字节预算
  private entityUpdateCounters: Map<string, number> = new Map();

  // 计算每个实体的更新优先级
  public calculateUpdatePriorities(
    playerId: string,
    entities: Entity[]
  ): EntityUpdatePriority[] {
    const priorities: EntityUpdatePriority[] = [];
    const playerPosition = this.world.getPlayer(playerId)?.position;

    if (!playerPosition) return priorities;

    for (const entity of entities) {
      const distance = this.distance(playerPosition, entity.position);
      const timeSinceLastUpdate = this.getTimeSinceLastUpdate(entity.id);

      let priority = 0;

      // 基础优先级（基于距离）
      priority += Math.max(0, 100 - distance / 10);

      // 时间因素（越久没更新优先级越高）
      priority += timeSinceLastUpdate * 0.1;

      // 变化程度（变化越大优先级越高）
      priority += entity.changeVelocity * 50;

      // 重要性标志
      if (entity.isImportant) {
        priority *= 2;
      }

      priorities.push({
        entityId: entity.id,
        priority,
        dataSize: this.estimateDataSize(entity)
      });
    }

    // 按优先级排序
    priorities.sort((a, b) => b.priority - a.priority);

    return priorities;
  }

  // 选择本次更新的实体
  public selectEntitiesForUpdate(
    priorities: EntityUpdatePriority[]
  ): string[] {
    const selected: string[] = [];
    let remainingBudget = this.updateBudget;

    for (const item of priorities) {
      if (item.dataSize <= remainingBudget) {
        selected.push(item.entityId);
        remainingBudget -= item.dataSize;
      }

      if (remainingBudget <= 0) break;
    }

    return selected;
  }
}
```

### 数据压缩策略

```typescript
// 数据压缩配置
interface CompressionConfig {
  // 位置精度（小数位数）
  positionPrecision: number;

  // 旋转精度（角度精度）
  rotationPrecision: number;

  // 是否使用增量压缩
  useDeltaCompression: boolean;

  // 是否使用霍夫曼编码
  useHuffmanCoding: boolean;

  // 最小变化阈值（低于此值不发送）
  minChangeThreshold: number;
}

// 增量压缩
class DeltaCompression {
  private lastSentStates: Map<string, EntityState> = new Map();

  public compressState(
    entityId: string,
    currentState: EntityState
  ): CompressedState | null {
    const lastState = this.lastSentStates.get(entityId);

    if (!lastState) {
      // 首次发送，发送完整状态
      this.lastSentStates.set(entityId, currentState);
      return { type: 'full', state: currentState };
    }

    // 计算差异
    const delta: Partial<EntityState> = {};
    let hasChanges = false;

    // 只包含变化的字段
    if (!this.vectorsEqual(lastState.position, currentState.position)) {
      delta.position = {
        x: currentState.position.x - lastState.position.x,
        y: currentState.position.y - lastState.position.y,
        z: currentState.position.z - lastState.position.z
      };
      hasChanges = true;
    }

    if (!this.quaternionsEqual(lastState.rotation, currentState.rotation)) {
      delta.rotation = currentState.rotation;
      hasChanges = true;
    }

    if (lastState.health !== currentState.health) {
      delta.health = currentState.health;
      hasChanges = true;
    }

    if (!hasChanges) {
      return null; // 无变化，不发送
    }

    // 更新缓存
    this.lastSentStates.set(entityId, currentState);

    return { type: 'delta', delta };
  }

  private vectorsEqual(a: Vector3, b: Vector3, threshold: number = 0.01): boolean {
    return (
      Math.abs(a.x - b.x) < threshold &&
      Math.abs(a.y - b.y) < threshold &&
      Math.abs(a.z - b.z) < threshold
    );
  }
}
```

## 网络代码最佳实践

### 网络架构设计原则

```typescript
// 1. 服务器权威原则
// 所有关键游戏逻辑都在服务器执行
class AuthoritativeServer {
  // 服务器验证所有客户端操作
  public processPlayerAction(playerId: string, action: PlayerAction): ActionResult {
    // 验证操作有效性
    if (!this.validateAction(playerId, action)) {
      return { success: false, reason: 'invalid_action' };
    }

    // 在服务器执行操作
    const result = this.executeAction(playerId, action);

    // 广播结果给所有客户端
    this.broadcastResult(result);

    return result;
  }

  private validateAction(playerId: string, action: PlayerAction): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;

    switch (action.type) {
      case 'move':
        // 验证移动速度是否合理
        return action.speed <= player.maxSpeed;

      case 'attack':
        // 验证攻击冷却是否已过
        return player.canAttack();

      case 'use_item':
        // 验证玩家是否拥有该物品
        return player.hasItem(action.itemId);

      default:
        return false;
    }
  }
}

// 2. 输入缓冲
// 缓冲一定量的输入以应对网络抖动
class InputBuffer {
  private buffer: PlayerInput[] = [];
  private bufferSize: number = 3; // 缓冲 3 帧的输入

  public addInput(input: PlayerInput): void {
    this.buffer.push(input);
  }

  public getInput(): PlayerInput | null {
    if (this.buffer.length > this.bufferSize) {
      return this.buffer.shift()!;
    }
    return null;
  }

  // 缓冲健康度检查
  public getBufferHealth(): number {
    return this.buffer.length / this.bufferSize;
  }
}

// 3. 网络状态监控
class NetworkMonitor {
  private latencySamples: number[] = [];
  private jitterSamples: number[] = [];
  private packetLossCounter: number = 0;
  private totalPackets: number = 0;

  // 记录延迟样本
  public recordLatency(latency: number): void {
    this.latencySamples.push(latency);
    if (this.latencySamples.length > 100) {
      this.latencySamples.shift();
    }

    // 计算抖动
    if (this.latencySamples.length > 1) {
      const jitter = Math.abs(
        latency - this.latencySamples[this.latencySamples.length - 2]
      );
      this.jitterSamples.push(jitter);
      if (this.jitterSamples.length > 100) {
        this.jitterSamples.shift();
      }
    }
  }

  // 获取网络质量指标
  public getNetworkQuality(): NetworkQuality {
    const avgLatency = this.average(this.latencySamples);
    const avgJitter = this.average(this.jitterSamples);
    const packetLoss = this.totalPackets > 0
      ? this.packetLossCounter / this.totalPackets
      : 0;

    return {
      latency: avgLatency,
      jitter: avgJitter,
      packetLoss,
      quality: this.calculateQualityScore(avgLatency, avgJitter, packetLoss)
    };
  }

  private calculateQualityScore(
    latency: number,
    jitter: number,
    packetLoss: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    if (latency < 50 && jitter < 10 && packetLoss < 0.01) {
      return 'excellent';
    } else if (latency < 100 && jitter < 30 && packetLoss < 0.05) {
      return 'good';
    } else if (latency < 200 && jitter < 50 && packetLoss < 0.1) {
      return 'fair';
    }
    return 'poor';
  }
}
```

### 常见问题处理

```typescript
// 处理丢包
class PacketLossHandler {
  private pendingAcks: Map<number, PendingPacket> = new Map();
  private retryTimeout: number = 100; // 100ms 后重试
  private maxRetries: number = 3;

  // 发送需要确认的包
  public sendReliable(packet: GamePacket): void {
    const sequenceNumber = this.nextSequence++;

    const pending: PendingPacket = {
      packet,
      sequenceNumber,
      sendTime: Date.now(),
      retries: 0
    };

    this.pendingAcks.set(sequenceNumber, pending);
    this.send({ ...packet, seq: sequenceNumber, reliable: true });
  }

  // 处理确认
  public onAck(sequenceNumber: number): void {
    this.pendingAcks.delete(sequenceNumber);
  }

  // 检查并重发超时的包
  public update(): void {
    const now = Date.now();

    for (const [seq, pending] of this.pendingAcks) {
      if (now - pending.sendTime > this.retryTimeout) {
        if (pending.retries >= this.maxRetries) {
          // 超过最大重试次数，认为连接有问题
          console.warn(`Packet ${seq} lost after ${this.maxRetries} retries`);
          this.pendingAcks.delete(seq);
          continue;
        }

        // 重发
        pending.sendTime = now;
        pending.retries++;
        this.send({ ...pending.packet, seq, reliable: true, retry: pending.retries });
      }
    }
  }
}

// 处理时钟同步
class ClockSynchronization {
  private serverTimeOffset: number = 0;
  private syncSamples: number[] = [];
  private syncInterval: number = 5000; // 每 5 秒同步一次

  // 发送同步请求
  public sendSyncRequest(): void {
    const clientTime = Date.now();
    this.send({ type: 'sync_request', clientTime });
  }

  // 处理同步响应
  public onSyncResponse(response: SyncResponse): void {
    const now = Date.now();
    const roundTripTime = now - response.clientTime;
    const oneWayLatency = roundTripTime / 2;

    // 估算服务器当前时间
    const estimatedServerTime = response.serverTime + oneWayLatency;
    const offset = estimatedServerTime - now;

    this.syncSamples.push(offset);
    if (this.syncSamples.length > 10) {
      this.syncSamples.shift();
    }

    // 使用中位数作为偏移量（抵抗异常值）
    this.serverTimeOffset = this.median(this.syncSamples);
  }

  // 获取服务器时间
  public getServerTime(): number {
    return Date.now() + this.serverTimeOffset;
  }

  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }
}
```

## 面试要点

### 常见面试问题

```typescript
/**
 * 1. 状态同步和帧同步的区别是什么？各适合什么类型的游戏？
 *
 * 答案要点：
 * - 状态同步：服务器同步完整状态，适合 FPS、MMO
 *   优点：服务器权威、易于防作弊
 *   缺点：带宽消耗大、延迟感知明显
 *
 * - 帧同步：只同步输入，客户端确定性模拟
 *   优点：带宽低、精确同步
 *   缺点：需要确定性、一人卡全卡
 */

/**
 * 2. 什么是客户端预测？如何处理预测错误？
 *
 * 答案要点：
 * - 客户端不等待服务器响应，立即根据输入更新本地状态
 * - 保存未确认的输入历史
 * - 收到服务器状态后，与预测比较
 * - 如有差异，回滚到服务器状态，重新应用未确认输入
 * - 使用平滑修正避免画面跳变
 */

/**
 * 3. 如何实现延迟补偿？
 *
 * 答案要点：
 * - 服务器保存世界状态历史
 * - 客户端射击时发送时间戳
 * - 服务器根据时间戳回溯到对应的历史状态
 * - 在历史状态中进行命中判定
 * - 需要限制最大补偿时间防止作弊
 */

/**
 * 4. 如何优化网络带宽？
 *
 * 答案要点：
 * - 视野裁剪：只发送玩家能看到的实体
 * - 优先级更新：重要实体更新频率更高
 * - 增量压缩：只发送变化的部分
 * - 量化压缩：降低数值精度
 * - 位打包：紧凑的二进制格式
 */

/**
 * 5. 回滚网络代码的工作原理是什么？
 *
 * 答案要点：
 * - 预测远程玩家输入
 * - 发现预测错误时回滚到正确状态
 * - 使用正确输入重新模拟
 * - 要求游戏逻辑完全确定性
 * - 适合格斗、MOBA 等游戏
 */
```

### 设计题示例

```typescript
/**
 * 面试题：设计一个多人射击游戏的网络同步系统
 *
 * 要求：
 * 1. 支持 16 名玩家
 * 2. 延迟 < 200ms 时体验良好
 * 3. 射击判定公平
 */

class FPSNetworkSystem {
  // 服务器配置
  private readonly TICK_RATE = 60;          // 60 Hz 服务器 Tick
  private readonly SNAPSHOT_RATE = 20;       // 20 Hz 快照发送
  private readonly MAX_PLAYERS = 16;
  private readonly LAG_COMPENSATION_MAX = 200; // 最大 200ms 延迟补偿

  // 核心组件
  private lagCompensation: LagCompensation;
  private snapshotManager: SnapshotManager;
  private inputBuffer: Map<string, InputBuffer>;
  private interestManagement: InterestManagement;

  constructor() {
    this.lagCompensation = new LagCompensation(this.LAG_COMPENSATION_MAX);
    this.snapshotManager = new SnapshotManager(this.SNAPSHOT_RATE);
    this.inputBuffer = new Map();
    this.interestManagement = new InterestManagement();
  }

  // 服务器主循环
  private serverTick(): void {
    // 1. 处理所有客户端输入
    this.processAllInputs();

    // 2. 更新游戏状态
    this.updateGameState();

    // 3. 保存历史状态用于延迟补偿
    this.lagCompensation.saveWorldState(this.world);

    // 4. 发送快照（降频）
    if (this.tickCount % (this.TICK_RATE / this.SNAPSHOT_RATE) === 0) {
      this.sendSnapshots();
    }

    this.tickCount++;
  }

  // 处理射击
  private processShot(playerId: string, shot: ShotData): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // 使用延迟补偿进行命中判定
    const hitResult = this.lagCompensation.processShot(
      playerId,
      shot,
      player.latency
    );

    if (hitResult.hit) {
      // 应用伤害
      this.applyDamage(hitResult.targetId, shot.damage);

      // 广播命中效果
      this.broadcast({
        type: 'hit_effect',
        position: hitResult.hitPoint,
        target: hitResult.targetId
      });
    }
  }

  // 发送快照
  private sendSnapshots(): void {
    for (const [playerId, player] of this.players) {
      // 获取该玩家应该看到的实体
      const visibleEntities = this.interestManagement
        .getEntitiesForPlayer(playerId);

      // 创建增量快照
      const snapshot = this.snapshotManager.createDeltaSnapshot(
        visibleEntities,
        player.lastAckedSnapshot
      );

      // 发送
      this.sendToPlayer(playerId, {
        type: 'snapshot',
        data: snapshot
      });
    }
  }
}

// 客户端实现要点
class FPSClient {
  private prediction: ClientPrediction;
  private interpolation: EntityInterpolation;
  private lagCompensationDisplay: LagCompensationDisplay;

  // 客户端预测本地玩家
  // 插值显示远程玩家
  // 显示延迟补偿效果（如命中确认）

  public update(deltaTime: number): void {
    // 本地玩家：预测 + 协调
    this.prediction.update(this.localInput);

    // 远程玩家：插值
    for (const remotePlayer of this.remotePlayers) {
      const state = this.interpolation.getInterpolatedState(
        remotePlayer.id,
        Date.now()
      );
      remotePlayer.displayState = state;
    }

    // 渲染
    this.render();
  }
}
```

## 总结

网络同步是多人游戏开发的核心技术，本文介绍了：

1. **同步架构**：状态同步 vs 帧同步的选择
2. **客户端预测**：提供流畅的本地响应体验
3. **服务器协调**：处理预测误差，确保一致性
4. **插值和外插**：平滑显示远程实体
5. **延迟补偿**：公平的射击判定
6. **回滚网络代码**：格斗游戏的精确同步方案
7. **快照系统**：高效的状态传输
8. **带宽优化**：视野裁剪、优先级更新、数据压缩

在实际开发中，需要根据游戏类型和目标平台选择合适的同步方案，并通过持续测试和优化来提供最佳的玩家体验。网络同步没有银弹，只有深入理解各种技术的优缺点，才能做出正确的架构决策。
