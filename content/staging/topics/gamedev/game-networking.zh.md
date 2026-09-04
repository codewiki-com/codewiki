---
title: 网络游戏架构设计
description: 掌握多人游戏网络架构：客户端-服务器、P2P和专用服务器模式
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - 网络
  - 多人游戏
  - 架构
  - 服务器
status: imported
origin: old/src/content/docs/gamedev/game-networking.zh.md
divergence: 0.235
issues: []
legacy:
  category: GameDev
  subcategory: Networking
  order: 23
  lastUpdated: 2026-01-07
---

网络游戏架构是多人游戏开发中最具挑战性的技术领域之一。它需要在延迟、带宽、一致性和安全性之间做出精确的权衡。本文将深入探讨网络游戏的各种架构模式、协议选择、同步机制以及实战案例。

## 网络架构类型概述

在设计多人游戏网络架构时，主要有三种基本模式可供选择：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        网络游戏架构类型                                  │
├─────────────────────┬─────────────────────┬─────────────────────────────┤
│   客户端-服务器      │       P2P           │       专用服务器             │
│  (Client-Server)    │  (Peer-to-Peer)     │  (Dedicated Server)         │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│  ┌───┐              │  ┌───┐   ┌───┐      │  ┌─────────────────────┐    │
│  │ S │              │  │ P │───│ P │      │  │   专用服务器集群     │    │
│  └─┬─┘              │  └─┬─┘   └─┬─┘      │  └──────────┬──────────┘    │
│    │                │    │   ╲   │        │             │               │
│  ┌─┴─┬─┬─┐          │    │    ╲  │        │    ┌────────┼────────┐      │
│  │   │ │ │          │  ┌─┴─┐  ┌┴─┴┐      │    │        │        │      │
│  C   C C C          │  │ P │──│ P │      │    C        C        C      │
│                     │  └───┘  └───┘      │                             │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│ 适用：MMORPG、FPS   │ 适用：格斗、RTS     │ 适用：大型竞技游戏           │
│ 优点：权威性高      │ 优点：低成本        │ 优点：最佳性能               │
│ 缺点：服务器成本    │ 缺点：易作弊        │ 缺点：运维复杂               │
└─────────────────────┴─────────────────────┴─────────────────────────────┘
```

### 架构选择决策矩阵

| 特性 | 客户端-服务器 | P2P | 专用服务器 |
|-----|-------------|-----|-----------|
| 反作弊能力 | 高 | 低 | 最高 |
| 运营成本 | 中 | 低 | 高 |
| 延迟表现 | 中 | 最低 | 低 |
| 可扩展性 | 高 | 低 | 最高 |
| 实现复杂度 | 中 | 高 | 高 |
| 适合玩家数 | 中大型 | 小型 | 大型 |

## 客户端-服务器模型

客户端-服务器（Client-Server）模型是最常见的网络游戏架构，服务器作为权威方处理所有游戏逻辑。

### 基本架构

```typescript
// 服务器端 - 权威服务器实现
class AuthoritativeServer {
  private gameState: GameState;
  private clients: Map<string, ClientConnection>;
  private tickRate: number = 60; // 每秒60次更新
  private lastTickTime: number = 0;

  constructor() {
    this.gameState = new GameState();
    this.clients = new Map();
  }

  // 主循环
  public start(): void {
    setInterval(() => this.tick(), 1000 / this.tickRate);
  }

  private tick(): void {
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastTickTime) / 1000;
    this.lastTickTime = currentTime;

    // 1. 处理所有客户端输入
    this.processInputs();

    // 2. 更新游戏状态
    this.gameState.update(deltaTime);

    // 3. 检测碰撞和游戏逻辑
    this.gameState.resolveCollisions();

    // 4. 广播状态给所有客户端
    this.broadcastState();
  }

  private processInputs(): void {
    for (const [clientId, client] of this.clients) {
      const inputs = client.getAndClearInputs();

      for (const input of inputs) {
        // 验证输入合法性
        if (this.validateInput(clientId, input)) {
          // 应用输入到游戏状态
          this.gameState.applyInput(clientId, input);
        }
      }
    }
  }

  private validateInput(clientId: string, input: PlayerInput): boolean {
    const player = this.gameState.getPlayer(clientId);
    if (!player) return false;

    // 验证移动速度是否超出限制
    if (input.type === 'move') {
      const maxSpeed = player.stats.maxSpeed;
      const inputSpeed = Math.sqrt(
        input.velocity.x ** 2 + input.velocity.y ** 2
      );
      if (inputSpeed > maxSpeed * 1.1) { // 允许10%误差
        console.warn(`作弊检测: 玩家 ${clientId} 移动速度异常`);
        return false;
      }
    }

    // 验证技能冷却
    if (input.type === 'ability') {
      const ability = player.abilities.get(input.abilityId);
      if (ability && !ability.isReady()) {
        return false;
      }
    }

    return true;
  }

  private broadcastState(): void {
    const snapshot = this.gameState.createSnapshot();

    for (const [clientId, client] of this.clients) {
      // 为每个客户端定制状态（视野裁剪、兴趣区域）
      const filteredSnapshot = this.filterSnapshotForClient(
        snapshot,
        clientId
      );

      client.send({
        type: 'state_update',
        tick: this.gameState.currentTick,
        timestamp: Date.now(),
        state: filteredSnapshot
      });
    }
  }

  private filterSnapshotForClient(
    snapshot: GameSnapshot,
    clientId: string
  ): GameSnapshot {
    const player = this.gameState.getPlayer(clientId);
    if (!player) return snapshot;

    // 兴趣区域管理 - 只发送玩家视野范围内的实体
    const visibleEntities = snapshot.entities.filter(entity => {
      const distance = this.calculateDistance(player.position, entity.position);
      return distance <= player.viewDistance;
    });

    return {
      ...snapshot,
      entities: visibleEntities
    };
  }
}
```

### 客户端实现

```typescript
// 客户端 - 带预测和插值的实现
class GameClient {
  private socket: WebSocket;
  private localPlayer: LocalPlayer;
  private remoteEntities: Map<string, RemoteEntity>;

  // 客户端预测相关
  private pendingInputs: PlayerInput[] = [];
  private inputSequence: number = 0;

  // 插值相关
  private stateBuffer: StateSnapshot[] = [];
  private interpolationDelay: number = 100; // 100ms 插值延迟

  constructor(serverUrl: string) {
    this.socket = new WebSocket(serverUrl);
    this.remoteEntities = new Map();
    this.setupNetworking();
  }

  private setupNetworking(): void {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleServerMessage(message);
    };
  }

  // 处理玩家输入
  public handleInput(input: RawInput): void {
    const playerInput: PlayerInput = {
      sequence: this.inputSequence++,
      timestamp: Date.now(),
      ...input
    };

    // 1. 立即应用到本地（客户端预测）
    this.localPlayer.applyInput(playerInput);

    // 2. 保存待确认的输入
    this.pendingInputs.push(playerInput);

    // 3. 发送给服务器
    this.socket.send(JSON.stringify({
      type: 'input',
      input: playerInput
    }));
  }

  private handleServerMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'state_update':
        this.handleStateUpdate(message);
        break;
      case 'input_ack':
        this.handleInputAck(message);
        break;
    }
  }

  private handleStateUpdate(message: StateUpdateMessage): void {
    // 添加到状态缓冲区
    this.stateBuffer.push({
      timestamp: message.timestamp,
      state: message.state
    });

    // 保持缓冲区大小
    while (this.stateBuffer.length > 30) {
      this.stateBuffer.shift();
    }

    // 服务器和解（Server Reconciliation）
    this.reconcileWithServer(message);
  }

  private reconcileWithServer(message: StateUpdateMessage): void {
    const serverState = message.state;
    const myServerState = serverState.players.find(
      p => p.id === this.localPlayer.id
    );

    if (!myServerState) return;

    // 找到服务器确认的最后一个输入
    const lastProcessedInput = message.lastProcessedInput;

    // 移除已确认的输入
    this.pendingInputs = this.pendingInputs.filter(
      input => input.sequence > lastProcessedInput
    );

    // 重置到服务器状态
    this.localPlayer.setPosition(myServerState.position);
    this.localPlayer.setVelocity(myServerState.velocity);

    // 重新应用未确认的输入
    for (const input of this.pendingInputs) {
      this.localPlayer.applyInput(input);
    }
  }

  // 实体插值
  public updateRemoteEntities(): void {
    const renderTime = Date.now() - this.interpolationDelay;

    // 找到两个用于插值的状态
    let previousState: StateSnapshot | null = null;
    let nextState: StateSnapshot | null = null;

    for (let i = 0; i < this.stateBuffer.length - 1; i++) {
      if (this.stateBuffer[i].timestamp <= renderTime &&
          this.stateBuffer[i + 1].timestamp >= renderTime) {
        previousState = this.stateBuffer[i];
        nextState = this.stateBuffer[i + 1];
        break;
      }
    }

    if (previousState && nextState) {
      // 计算插值因子
      const t = (renderTime - previousState.timestamp) /
                (nextState.timestamp - previousState.timestamp);

      // 对每个远程实体进行插值
      for (const entity of nextState.state.entities) {
        const prevEntity = previousState.state.entities.find(
          e => e.id === entity.id
        );

        if (prevEntity) {
          const interpolatedPosition = this.lerp(
            prevEntity.position,
            entity.position,
            t
          );

          const remoteEntity = this.remoteEntities.get(entity.id);
          if (remoteEntity) {
            remoteEntity.setDisplayPosition(interpolatedPosition);
          }
        }
      }
    }
  }

  private lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    };
  }
}
```

### 网络同步技术对比

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        网络同步技术                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. 状态同步 (State Synchronization)                                    │
│     ┌────────┐    完整状态    ┌────────┐                               │
│     │ Server │ ────────────▶ │ Client │                               │
│     └────────┘               └────────┘                               │
│     优点: 简单直观、状态一致性高                                         │
│     缺点: 带宽消耗大、不适合大规模                                       │
│                                                                         │
│  2. 帧同步 (Lockstep)                                                   │
│     ┌────────┐    输入同步    ┌────────┐                               │
│     │Client A│ ◀────────────▶ │Client B│                               │
│     └────────┘               └────────┘                               │
│     优点: 带宽极低、确定性重放                                           │
│     缺点: 延迟敏感、需要确定性逻辑                                       │
│                                                                         │
│  3. 快照插值 (Snapshot Interpolation)                                   │
│     Server: [S1]──[S2]──[S3]──[S4]                                     │
│     Client:      ↓     ↓                                               │
│             渲染S1───S2 (插值)                                          │
│     优点: 平滑的视觉效果、隐藏网络抖动                                    │
│     缺点: 增加渲染延迟                                                   │
│                                                                         │
│  4. 客户端预测 (Client-Side Prediction)                                 │
│     Client: 输入 → 预测 → 渲染                                          │
│     Server:      → 验证 → 修正                                          │
│     优点: 响应即时、手感好                                               │
│     缺点: 实现复杂、可能回滚                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## P2P 网络架构

P2P（点对点）架构在某些游戏类型中仍有其独特优势，特别是格斗游戏和小规模竞技游戏。

### P2P 网络实现

```typescript
// P2P 网络管理器
class P2PNetworkManager {
  private peers: Map<string, RTCPeerConnection>;
  private dataChannels: Map<string, RTCDataChannel>;
  private localInputBuffer: InputFrame[] = [];
  private remoteInputBuffers: Map<string, InputFrame[]>;
  private currentFrame: number = 0;
  private inputDelay: number = 3; // 输入延迟帧数

  constructor() {
    this.peers = new Map();
    this.dataChannels = new Map();
    this.remoteInputBuffers = new Map();
  }

  // 创建对等连接
  public async connectToPeer(peerId: string, signalingServer: SignalingServer): Promise<void> {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:turn.example.com:3478',
          username: 'user',
          credential: 'pass'
        }
      ]
    });

    // 创建数据通道
    const dataChannel = pc.createDataChannel('game', {
      ordered: false, // 允许乱序，降低延迟
      maxRetransmits: 0 // 不重传，降低延迟
    });

    this.setupDataChannel(peerId, dataChannel);

    // ICE 候选处理
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingServer.send({
          type: 'ice-candidate',
          target: peerId,
          candidate: event.candidate
        });
      }
    };

    // 创建和发送 offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    signalingServer.send({
      type: 'offer',
      target: peerId,
      sdp: offer.sdp
    });

    this.peers.set(peerId, pc);
  }

  private setupDataChannel(peerId: string, channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log(`与 ${peerId} 的数据通道已建立`);
      this.dataChannels.set(peerId, channel);
    };

    channel.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handlePeerMessage(peerId, message);
    };

    channel.onclose = () => {
      console.log(`与 ${peerId} 的连接已断开`);
      this.dataChannels.delete(peerId);
    };
  }

  // 发送本地输入
  public sendInput(input: PlayerInput): void {
    const inputFrame: InputFrame = {
      frame: this.currentFrame + this.inputDelay,
      input: input,
      timestamp: Date.now()
    };

    // 本地缓存
    this.localInputBuffer.push(inputFrame);

    // 广播给所有对等端
    const message = JSON.stringify({
      type: 'input',
      data: inputFrame
    });

    for (const channel of this.dataChannels.values()) {
      if (channel.readyState === 'open') {
        channel.send(message);
      }
    }
  }

  private handlePeerMessage(peerId: string, message: P2PMessage): void {
    switch (message.type) {
      case 'input':
        this.handleRemoteInput(peerId, message.data);
        break;
      case 'sync_request':
        this.handleSyncRequest(peerId, message.data);
        break;
      case 'sync_response':
        this.handleSyncResponse(peerId, message.data);
        break;
    }
  }

  private handleRemoteInput(peerId: string, inputFrame: InputFrame): void {
    if (!this.remoteInputBuffers.has(peerId)) {
      this.remoteInputBuffers.set(peerId, []);
    }

    const buffer = this.remoteInputBuffers.get(peerId)!;

    // 按帧号排序插入
    const index = buffer.findIndex(f => f.frame > inputFrame.frame);
    if (index === -1) {
      buffer.push(inputFrame);
    } else {
      buffer.splice(index, 0, inputFrame);
    }
  }

  // 检查是否可以推进到下一帧
  public canAdvanceFrame(): boolean {
    // 检查所有远程玩家的输入是否已到达
    for (const [peerId, buffer] of this.remoteInputBuffers) {
      const hasInput = buffer.some(f => f.frame === this.currentFrame);
      if (!hasInput) {
        return false;
      }
    }
    return true;
  }

  // 获取当前帧的所有输入
  public getFrameInputs(): Map<string, PlayerInput> {
    const inputs = new Map<string, PlayerInput>();

    // 本地输入
    const localInput = this.localInputBuffer.find(
      f => f.frame === this.currentFrame
    );
    if (localInput) {
      inputs.set('local', localInput.input);
    }

    // 远程输入
    for (const [peerId, buffer] of this.remoteInputBuffers) {
      const remoteInput = buffer.find(f => f.frame === this.currentFrame);
      if (remoteInput) {
        inputs.set(peerId, remoteInput.input);
      }
    }

    return inputs;
  }

  public advanceFrame(): void {
    this.currentFrame++;

    // 清理旧输入
    this.localInputBuffer = this.localInputBuffer.filter(
      f => f.frame >= this.currentFrame - 10
    );

    for (const buffer of this.remoteInputBuffers.values()) {
      buffer.splice(0, buffer.findIndex(f => f.frame >= this.currentFrame - 10));
    }
  }
}
```

### 帧同步（Lockstep）实现

```typescript
// 帧同步游戏循环
class LockstepGame {
  private networkManager: P2PNetworkManager;
  private gameState: DeterministicGameState;
  private frameHistory: GameStateChecksum[] = [];
  private rollbackFrames: number = 0;

  constructor(networkManager: P2PNetworkManager) {
    this.networkManager = networkManager;
    this.gameState = new DeterministicGameState();
  }

  // 确定性游戏更新
  public update(): void {
    // 等待所有输入
    if (!this.networkManager.canAdvanceFrame()) {
      // 输入延迟处理 - 可以选择等待或使用预测
      this.handleInputDelay();
      return;
    }

    // 获取当前帧所有输入
    const inputs = this.networkManager.getFrameInputs();

    // 确定性更新游戏状态
    this.gameState.update(inputs);

    // 保存状态校验和（用于同步验证）
    const checksum = this.gameState.calculateChecksum();
    this.frameHistory.push({
      frame: this.gameState.currentFrame,
      checksum: checksum
    });

    // 验证状态同步
    this.verifySynchronization();

    // 推进帧
    this.networkManager.advanceFrame();
  }

  private handleInputDelay(): void {
    // 方案1: 等待（严格同步）
    // return;

    // 方案2: 输入预测
    const predictedInputs = this.predictMissingInputs();
    this.gameState.update(predictedInputs);
    this.rollbackFrames++;
  }

  private predictMissingInputs(): Map<string, PlayerInput> {
    const inputs = this.networkManager.getFrameInputs();

    // 对于缺失的输入，使用上一帧的输入作为预测
    // 这在格斗游戏中特别常见
    for (const playerId of this.getAllPlayerIds()) {
      if (!inputs.has(playerId)) {
        const lastInput = this.getLastKnownInput(playerId);
        if (lastInput) {
          inputs.set(playerId, lastInput);
        }
      }
    }

    return inputs;
  }

  // 回滚和重新模拟
  public rollback(targetFrame: number): void {
    // 恢复到目标帧的状态
    const savedState = this.getSavedState(targetFrame);
    if (savedState) {
      this.gameState.loadState(savedState);

      // 重新模拟到当前帧
      while (this.gameState.currentFrame < this.networkManager.currentFrame) {
        const inputs = this.getHistoricalInputs(this.gameState.currentFrame);
        this.gameState.update(inputs);
      }
    }
  }

  private verifySynchronization(): void {
    // 定期与其他玩家交换校验和
    if (this.gameState.currentFrame % 60 === 0) {
      this.requestSyncCheck();
    }
  }
}

// 确定性游戏状态
class DeterministicGameState {
  public currentFrame: number = 0;
  private entities: Map<string, Entity>;
  private randomSeed: number;
  private fixedDeltaTime: number = 1 / 60; // 固定时间步长

  constructor() {
    this.entities = new Map();
    this.randomSeed = 12345; // 固定随机种子
  }

  // 确定性随机数生成
  public random(): number {
    // 使用确定性伪随机数生成器
    this.randomSeed = (this.randomSeed * 1103515245 + 12345) & 0x7fffffff;
    return this.randomSeed / 0x7fffffff;
  }

  public update(inputs: Map<string, PlayerInput>): void {
    // 1. 按固定顺序处理输入（按玩家ID排序）
    const sortedInputs = Array.from(inputs.entries()).sort(
      ([a], [b]) => a.localeCompare(b)
    );

    for (const [playerId, input] of sortedInputs) {
      this.applyInput(playerId, input);
    }

    // 2. 使用固定时间步长更新物理
    this.updatePhysics(this.fixedDeltaTime);

    // 3. 按固定顺序处理碰撞
    this.resolveCollisions();

    this.currentFrame++;
  }

  private updatePhysics(deltaTime: number): void {
    // 使用固定点数学或确保浮点运算一致性
    for (const entity of this.entities.values()) {
      // 位置更新
      entity.position.x += entity.velocity.x * deltaTime;
      entity.position.y += entity.velocity.y * deltaTime;

      // 应用重力（使用固定值）
      entity.velocity.y += 980 * deltaTime; // 固定重力值
    }
  }

  public calculateChecksum(): number {
    // 计算游戏状态的校验和
    let checksum = 0;

    for (const [id, entity] of this.entities) {
      checksum ^= this.hashEntity(entity);
    }

    return checksum;
  }

  private hashEntity(entity: Entity): number {
    // 简单哈希实现
    let hash = 0;
    hash ^= Math.floor(entity.position.x * 1000);
    hash ^= Math.floor(entity.position.y * 1000) << 8;
    hash ^= Math.floor(entity.velocity.x * 1000) << 16;
    hash ^= Math.floor(entity.velocity.y * 1000) << 24;
    return hash;
  }
}
```

## 专用服务器架构

专用服务器（Dedicated Server）是大型竞技游戏的首选方案，提供最佳的反作弊能力和性能。

### 专用服务器实现

```typescript
// 专用服务器核心
class DedicatedGameServer {
  private gameLoop: GameLoop;
  private connectionManager: ConnectionManager;
  private matchManager: MatchManager;
  private anticheatSystem: AnticheatSystem;

  private config: ServerConfig = {
    tickRate: 128,        // 128tick 高性能服务器
    maxPlayers: 10,
    region: 'asia-east',
    mode: 'competitive'
  };

  constructor() {
    this.gameLoop = new GameLoop(this.config.tickRate);
    this.connectionManager = new ConnectionManager();
    this.matchManager = new MatchManager();
    this.anticheatSystem = new AnticheatSystem();
  }

  public async start(): Promise<void> {
    // 初始化网络
    await this.connectionManager.initialize({
      port: 27015,
      maxConnections: this.config.maxPlayers
    });

    // 启动游戏循环
    this.gameLoop.start((deltaTime) => this.tick(deltaTime));

    console.log(`专用服务器启动: ${this.config.region}, 模式: ${this.config.mode}`);
  }

  private tick(deltaTime: number): void {
    const tickStart = performance.now();

    // 1. 接收并处理客户端命令
    this.processClientCommands();

    // 2. 运行游戏逻辑
    this.updateGameState(deltaTime);

    // 3. 反作弊检测
    this.anticheatSystem.analyze(this.matchManager.currentMatch);

    // 4. 发送状态更新
    this.sendStateUpdates();

    // 性能监控
    const tickTime = performance.now() - tickStart;
    if (tickTime > 1000 / this.config.tickRate) {
      console.warn(`Tick 超时: ${tickTime.toFixed(2)}ms`);
    }
  }

  private processClientCommands(): void {
    const commands = this.connectionManager.getAndClearCommands();

    for (const command of commands) {
      // 验证命令时间戳
      if (!this.validateCommandTiming(command)) {
        continue;
      }

      // 应用命令
      this.matchManager.applyCommand(command);
    }
  }

  private validateCommandTiming(command: ClientCommand): boolean {
    const now = Date.now();
    const commandAge = now - command.timestamp;

    // 命令过旧（可能是重放攻击）
    if (commandAge > 1000) {
      return false;
    }

    // 命令来自未来（时间作弊）
    if (commandAge < -100) {
      this.anticheatSystem.flagPlayer(command.playerId, 'TIME_MANIPULATION');
      return false;
    }

    return true;
  }

  private sendStateUpdates(): void {
    const match = this.matchManager.currentMatch;
    if (!match) return;

    for (const player of match.players) {
      const connection = this.connectionManager.getConnection(player.id);
      if (!connection) continue;

      // 生成该玩家的定制快照
      const snapshot = this.createPlayerSnapshot(match, player);

      // 使用增量压缩
      const deltaSnapshot = this.createDeltaSnapshot(
        connection.lastAckedSnapshot,
        snapshot
      );

      connection.send({
        type: 'snapshot',
        tick: match.currentTick,
        data: deltaSnapshot
      });
    }
  }

  private createPlayerSnapshot(match: Match, player: Player): Snapshot {
    // 服务端视野剔除
    const visibleEntities = match.entities.filter(entity => {
      // 检查是否在玩家视野内
      if (this.isInFieldOfView(player, entity)) {
        return true;
      }

      // 检查是否发出可听见的声音
      if (entity.lastSoundTime > Date.now() - 1000) {
        const distance = this.calculateDistance(player.position, entity.position);
        if (distance < entity.soundRadius) {
          return true;
        }
      }

      return false;
    });

    return {
      tick: match.currentTick,
      timestamp: Date.now(),
      playerState: this.serializePlayer(player),
      entities: visibleEntities.map(e => this.serializeEntity(e))
    };
  }
}

// 高性能游戏循环
class GameLoop {
  private tickRate: number;
  private tickInterval: number;
  private running: boolean = false;
  private lastTickTime: number = 0;
  private accumulator: number = 0;

  constructor(tickRate: number) {
    this.tickRate = tickRate;
    this.tickInterval = 1000 / tickRate;
  }

  public start(tickCallback: (deltaTime: number) => void): void {
    this.running = true;
    this.lastTickTime = performance.now();

    const loop = () => {
      if (!this.running) return;

      const currentTime = performance.now();
      const frameTime = currentTime - this.lastTickTime;
      this.lastTickTime = currentTime;

      this.accumulator += frameTime;

      // 固定时间步长更新
      while (this.accumulator >= this.tickInterval) {
        tickCallback(this.tickInterval / 1000);
        this.accumulator -= this.tickInterval;
      }

      // 使用 setImmediate 获得更好的性能（Node.js）
      setImmediate(loop);
    };

    loop();
  }

  public stop(): void {
    this.running = false;
  }
}
```

### 反作弊系统

```typescript
// 服务端反作弊系统
class AnticheatSystem {
  private playerStats: Map<string, PlayerStatistics>;
  private detectionRules: DetectionRule[];
  private flaggedPlayers: Map<string, CheatFlag[]>;

  constructor() {
    this.playerStats = new Map();
    this.flaggedPlayers = new Map();
    this.detectionRules = this.initializeRules();
  }

  private initializeRules(): DetectionRule[] {
    return [
      // 移动速度检测
      {
        name: 'SPEED_HACK',
        check: (player, stats) => {
          const maxPossibleSpeed = player.baseSpeed * 1.5; // 包含增益
          return stats.maxObservedSpeed > maxPossibleSpeed;
        },
        severity: 'HIGH'
      },

      // 命中率异常检测
      {
        name: 'AIMBOT',
        check: (player, stats) => {
          if (stats.totalShots < 100) return false;
          const headShotRatio = stats.headShots / stats.hits;
          const hitRatio = stats.hits / stats.totalShots;

          // 统计学异常检测
          return hitRatio > 0.8 && headShotRatio > 0.7;
        },
        severity: 'HIGH'
      },

      // 反应时间检测
      {
        name: 'INHUMAN_REACTION',
        check: (player, stats) => {
          // 人类平均反应时间约150-300ms
          return stats.averageReactionTime < 80;
        },
        severity: 'MEDIUM'
      },

      // 透视检测
      {
        name: 'WALLHACK',
        check: (player, stats) => {
          // 检测玩家是否追踪不可见的敌人
          return stats.trackingInvisibleTargets > 5;
        },
        severity: 'HIGH'
      },

      // 数据包频率检测
      {
        name: 'PACKET_MANIPULATION',
        check: (player, stats) => {
          const expectedRate = 128; // 服务器tick率
          return Math.abs(stats.packetRate - expectedRate) > 20;
        },
        severity: 'MEDIUM'
      }
    ];
  }

  public analyze(match: Match): void {
    for (const player of match.players) {
      this.updatePlayerStats(player, match);
      this.runDetectionRules(player);
    }
  }

  private updatePlayerStats(player: Player, match: Match): void {
    let stats = this.playerStats.get(player.id);
    if (!stats) {
      stats = this.createInitialStats();
      this.playerStats.set(player.id, stats);
    }

    // 更新移动统计
    const currentSpeed = Math.sqrt(
      player.velocity.x ** 2 + player.velocity.y ** 2
    );
    stats.maxObservedSpeed = Math.max(stats.maxObservedSpeed, currentSpeed);

    // 更新射击统计
    if (player.lastShotResult) {
      stats.totalShots++;
      if (player.lastShotResult.hit) {
        stats.hits++;
        if (player.lastShotResult.headshot) {
          stats.headShots++;
        }
      }
    }

    // 计算反应时间
    if (player.lastEngagement) {
      const reactionTime = player.lastEngagement.shotTime -
                           player.lastEngagement.targetVisibleTime;
      stats.reactionTimes.push(reactionTime);
      stats.averageReactionTime = this.calculateAverage(stats.reactionTimes);
    }

    // 透视检测数据
    this.checkWallhackBehavior(player, match, stats);
  }

  private checkWallhackBehavior(
    player: Player,
    match: Match,
    stats: PlayerStatistics
  ): void {
    // 检查玩家视角是否追踪不可见的敌人
    const enemies = match.players.filter(p => p.team !== player.team);

    for (const enemy of enemies) {
      // 检查敌人是否在视野内
      const isVisible = this.isPlayerVisible(player, enemy, match);

      if (!isVisible) {
        // 检查玩家是否在"追踪"不可见的敌人
        const aimDirection = this.normalizeVector(player.aimDirection);
        const toEnemy = this.normalizeVector({
          x: enemy.position.x - player.position.x,
          y: enemy.position.y - player.position.y
        });

        const dotProduct = aimDirection.x * toEnemy.x +
                          aimDirection.y * toEnemy.y;

        // 如果持续瞄准不可见敌人
        if (dotProduct > 0.95) {
          stats.trackingInvisibleTargets++;
        }
      }
    }
  }

  private runDetectionRules(player: Player): void {
    const stats = this.playerStats.get(player.id);
    if (!stats) return;

    for (const rule of this.detectionRules) {
      if (rule.check(player, stats)) {
        this.flagPlayer(player.id, rule.name, rule.severity);
      }
    }
  }

  public flagPlayer(
    playerId: string,
    reason: string,
    severity: string = 'MEDIUM'
  ): void {
    if (!this.flaggedPlayers.has(playerId)) {
      this.flaggedPlayers.set(playerId, []);
    }

    const flags = this.flaggedPlayers.get(playerId)!;
    flags.push({
      reason,
      severity,
      timestamp: Date.now()
    });

    console.log(`[反作弊] 玩家 ${playerId} 被标记: ${reason} (${severity})`);

    // 高严重度标记立即处理
    if (severity === 'HIGH') {
      const highSeverityCount = flags.filter(f => f.severity === 'HIGH').length;
      if (highSeverityCount >= 3) {
        this.takeAction(playerId, 'BAN');
      }
    }
  }

  private takeAction(playerId: string, action: 'WARN' | 'KICK' | 'BAN'): void {
    console.log(`[反作弊] 对玩家 ${playerId} 执行操作: ${action}`);
    // 实际实现中会调用相应的处理函数
  }
}
```

## 网络协议选择

### TCP vs UDP 对比

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TCP vs UDP 对比                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   TCP (传输控制协议)                    UDP (用户数据报协议)              │
│   ┌─────────────────────┐              ┌─────────────────────┐          │
│   │ 可靠传输            │              │ 不可靠传输          │          │
│   │ 有序到达            │              │ 可能乱序/丢失       │          │
│   │ 流量控制            │              │ 无流量控制          │          │
│   │ 拥塞控制            │              │ 无拥塞控制          │          │
│   │ 连接导向            │              │ 无连接              │          │
│   └─────────────────────┘              └─────────────────────┘          │
│                                                                         │
│   适用场景:                            适用场景:                         │
│   - 登录认证                           - 实时位置更新                    │
│   - 聊天消息                           - 射击数据                        │
│   - 物品交易                           - 语音聊天                        │
│   - 重要事件                           - 视频流                          │
│                                                                         │
│   延迟: 较高 (需要确认)                延迟: 最低                        │
│   带宽: 较高 (协议开销)                带宽: 较低                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 可靠UDP实现

```typescript
// 可靠UDP协议层
class ReliableUDP {
  private socket: dgram.Socket;
  private sequenceNumber: number = 0;
  private pendingPackets: Map<number, PendingPacket>;
  private receivedSequences: Set<number>;
  private ackBuffer: number[] = [];

  private config = {
    maxRetries: 5,
    retryTimeout: 100, // ms
    ackInterval: 33    // ms
  };

  constructor() {
    this.pendingPackets = new Map();
    this.receivedSequences = new Set();
    this.startAckLoop();
  }

  // 发送可靠数据包
  public sendReliable(data: Buffer, address: string, port: number): void {
    const packet = this.createPacket(data, PacketType.RELIABLE);

    this.pendingPackets.set(packet.sequence, {
      packet,
      address,
      port,
      retries: 0,
      sentTime: Date.now()
    });

    this.sendPacket(packet, address, port);
  }

  // 发送不可靠数据包
  public sendUnreliable(data: Buffer, address: string, port: number): void {
    const packet = this.createPacket(data, PacketType.UNRELIABLE);
    this.sendPacket(packet, address, port);
  }

  // 发送带序列号的不可靠数据包（用于排序）
  public sendSequenced(data: Buffer, address: string, port: number): void {
    const packet = this.createPacket(data, PacketType.SEQUENCED);
    this.sendPacket(packet, address, port);
  }

  private createPacket(data: Buffer, type: PacketType): Packet {
    const sequence = this.sequenceNumber++;

    // 数据包头部格式:
    // [类型:1字节][序列号:4字节][ACK位图:4字节][数据:N字节]
    const header = Buffer.alloc(9);
    header.writeUInt8(type, 0);
    header.writeUInt32LE(sequence, 1);
    header.writeUInt32LE(this.createAckBitmap(), 5);

    return {
      type,
      sequence,
      data: Buffer.concat([header, data])
    };
  }

  private createAckBitmap(): number {
    // 创建最近接收的数据包确认位图
    let bitmap = 0;
    const acks = this.ackBuffer.slice(-32);

    for (let i = 0; i < acks.length; i++) {
      bitmap |= (1 << i);
    }

    return bitmap;
  }

  private sendPacket(packet: Packet, address: string, port: number): void {
    this.socket.send(packet.data, port, address);
  }

  public handleIncomingPacket(data: Buffer, rinfo: dgram.RemoteInfo): void {
    const type = data.readUInt8(0);
    const sequence = data.readUInt32LE(1);
    const ackBitmap = data.readUInt32LE(5);
    const payload = data.slice(9);

    // 处理ACK
    this.processAcks(ackBitmap);

    switch (type) {
      case PacketType.RELIABLE:
        this.handleReliablePacket(sequence, payload, rinfo);
        break;
      case PacketType.UNRELIABLE:
        this.handleUnreliablePacket(payload, rinfo);
        break;
      case PacketType.SEQUENCED:
        this.handleSequencedPacket(sequence, payload, rinfo);
        break;
    }
  }

  private handleReliablePacket(
    sequence: number,
    payload: Buffer,
    rinfo: dgram.RemoteInfo
  ): void {
    // 检查是否已接收
    if (this.receivedSequences.has(sequence)) {
      // 重复包，只发送ACK
      this.ackBuffer.push(sequence);
      return;
    }

    this.receivedSequences.add(sequence);
    this.ackBuffer.push(sequence);

    // 处理数据
    this.emit('message', payload, rinfo);
  }

  private processAcks(ackBitmap: number): void {
    // 根据ACK位图确认已发送的包
    for (const [sequence, pending] of this.pendingPackets) {
      if (ackBitmap & (1 << (sequence % 32))) {
        this.pendingPackets.delete(sequence);
      }
    }
  }

  // 重传检查循环
  private startRetransmitLoop(): void {
    setInterval(() => {
      const now = Date.now();

      for (const [sequence, pending] of this.pendingPackets) {
        if (now - pending.sentTime > this.config.retryTimeout) {
          if (pending.retries >= this.config.maxRetries) {
            // 超过最大重试次数
            this.pendingPackets.delete(sequence);
            this.emit('timeout', sequence);
          } else {
            // 重传
            pending.retries++;
            pending.sentTime = now;
            this.sendPacket(pending.packet, pending.address, pending.port);
          }
        }
      }
    }, 10);
  }

  private startAckLoop(): void {
    setInterval(() => {
      // 发送聚合ACK
      if (this.ackBuffer.length > 0) {
        // ACK会在下一个发送的包中携带
      }
    }, this.config.ackInterval);
  }
}

enum PacketType {
  UNRELIABLE = 0,
  RELIABLE = 1,
  SEQUENCED = 2,
  ACK = 3
}
```

### 混合协议策略

```typescript
// 网络通道管理器 - 混合使用TCP和UDP
class NetworkChannelManager {
  private tcpConnection: net.Socket;
  private udpSocket: dgram.Socket;
  private reliableUdp: ReliableUDP;

  // 不同类型数据的通道配置
  private channelConfig: ChannelConfig[] = [
    {
      name: 'critical',
      protocol: 'tcp',
      priority: 1,
      reliable: true,
      ordered: true
    },
    {
      name: 'state_update',
      protocol: 'udp',
      priority: 2,
      reliable: false,
      ordered: false
    },
    {
      name: 'player_input',
      protocol: 'udp_reliable',
      priority: 1,
      reliable: true,
      ordered: false
    },
    {
      name: 'voice',
      protocol: 'udp',
      priority: 3,
      reliable: false,
      ordered: false
    },
    {
      name: 'chat',
      protocol: 'tcp',
      priority: 3,
      reliable: true,
      ordered: true
    }
  ];

  public send(channelName: string, data: any): void {
    const config = this.channelConfig.find(c => c.name === channelName);
    if (!config) {
      throw new Error(`未知通道: ${channelName}`);
    }

    const packet = this.serialize(data);

    switch (config.protocol) {
      case 'tcp':
        this.sendTcp(packet);
        break;
      case 'udp':
        this.sendUdp(packet);
        break;
      case 'udp_reliable':
        this.reliableUdp.sendReliable(packet, this.serverAddress, this.udpPort);
        break;
    }
  }

  private sendTcp(data: Buffer): void {
    // 添加长度前缀
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(data.length);
    this.tcpConnection.write(Buffer.concat([lengthBuffer, data]));
  }

  private sendUdp(data: Buffer): void {
    this.udpSocket.send(data, this.udpPort, this.serverAddress);
  }
}

// 游戏消息路由
class GameMessageRouter {
  private channelManager: NetworkChannelManager;

  // 根据消息类型自动选择通道
  public sendMessage(message: GameMessage): void {
    const channel = this.getChannelForMessage(message);
    this.channelManager.send(channel, message);
  }

  private getChannelForMessage(message: GameMessage): string {
    switch (message.type) {
      // 关键消息 - TCP
      case 'login':
      case 'logout':
      case 'purchase':
      case 'match_result':
        return 'critical';

      // 状态更新 - UDP
      case 'position_update':
      case 'rotation_update':
      case 'animation_state':
        return 'state_update';

      // 玩家输入 - 可靠UDP
      case 'player_input':
      case 'ability_cast':
      case 'weapon_fire':
        return 'player_input';

      // 语音 - UDP
      case 'voice_data':
        return 'voice';

      // 聊天 - TCP
      case 'chat_message':
        return 'chat';

      default:
        return 'state_update';
    }
  }
}
```

## 网络拓扑设计

### 区域服务器架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        全球服务器拓扑                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                        ┌─────────────────┐                              │
│                        │   全局服务      │                              │
│                        │  (账号/匹配)    │                              │
│                        └────────┬────────┘                              │
│                                 │                                       │
│         ┌───────────────────────┼───────────────────────┐               │
│         │                       │                       │               │
│         ▼                       ▼                       ▼               │
│  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐        │
│  │   亚太区域    │       │   欧洲区域    │       │   美洲区域    │        │
│  │  Gateway     │       │  Gateway     │       │  Gateway     │        │
│  └──────┬───────┘       └──────┬───────┘       └──────┬───────┘        │
│         │                      │                      │                │
│    ┌────┴────┐            ┌────┴────┐            ┌────┴────┐           │
│    │         │            │         │            │         │           │
│    ▼         ▼            ▼         ▼            ▼         ▼           │
│ ┌─────┐  ┌─────┐      ┌─────┐  ┌─────┐      ┌─────┐  ┌─────┐          │
│ │东京  │  │新加坡│      │法兰克福│ │伦敦  │      │弗吉尼亚│ │俄勒冈│          │
│ │Game │  │Game │      │Game │  │Game │      │Game │  │Game │          │
│ └─────┘  └─────┘      └─────┘  └─────┘      └─────┘  └─────┘          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

```typescript
// 区域网关服务器
class RegionalGateway {
  private region: string;
  private gameServers: Map<string, GameServerInfo>;
  private playerConnections: Map<string, PlayerConnection>;
  private loadBalancer: LoadBalancer;

  constructor(region: string) {
    this.region = region;
    this.gameServers = new Map();
    this.playerConnections = new Map();
    this.loadBalancer = new LoadBalancer();
  }

  // 处理玩家连接
  public async handlePlayerConnect(
    playerId: string,
    socket: WebSocket
  ): Promise<void> {
    // 验证玩家身份
    const playerData = await this.authenticatePlayer(playerId);

    // 创建连接
    const connection = new PlayerConnection(playerId, socket, playerData);
    this.playerConnections.set(playerId, connection);

    // 发送服务器列表
    connection.send({
      type: 'server_list',
      servers: this.getAvailableServers()
    });
  }

  // 分配游戏服务器
  public async assignGameServer(
    playerId: string,
    matchId: string
  ): Promise<GameServerInfo> {
    const connection = this.playerConnections.get(playerId);
    if (!connection) {
      throw new Error('玩家未连接');
    }

    // 选择最优服务器
    const server = this.loadBalancer.selectServer(
      this.gameServers,
      connection.latencies
    );

    return server;
  }

  // 跨区域玩家路由
  public async routeToRegion(
    playerId: string,
    targetRegion: string
  ): Promise<void> {
    const connection = this.playerConnections.get(playerId);
    if (!connection) return;

    // 获取目标区域网关地址
    const targetGateway = await this.getRegionGateway(targetRegion);

    // 发送重定向
    connection.send({
      type: 'redirect',
      gateway: targetGateway.address,
      token: await this.generateTransferToken(playerId)
    });
  }
}

// 负载均衡器
class LoadBalancer {
  // 选择最优服务器
  public selectServer(
    servers: Map<string, GameServerInfo>,
    playerLatencies: Map<string, number>
  ): GameServerInfo {
    let bestServer: GameServerInfo | null = null;
    let bestScore = Infinity;

    for (const [serverId, server] of servers) {
      // 计算综合评分
      const score = this.calculateServerScore(server, playerLatencies);

      if (score < bestScore) {
        bestScore = score;
        bestServer = server;
      }
    }

    if (!bestServer) {
      throw new Error('没有可用服务器');
    }

    return bestServer;
  }

  private calculateServerScore(
    server: GameServerInfo,
    playerLatencies: Map<string, number>
  ): number {
    // 延迟权重
    const latency = playerLatencies.get(server.id) || 100;
    const latencyScore = latency * 2;

    // 负载权重
    const loadRatio = server.currentPlayers / server.maxPlayers;
    const loadScore = loadRatio * 100;

    // 性能权重
    const performanceScore = (1 - server.cpuUsage) * 50;

    return latencyScore + loadScore - performanceScore;
  }
}
```

## 房间和大厅系统

### 房间管理

```typescript
// 房间管理系统
class RoomManager {
  private rooms: Map<string, GameRoom>;
  private playerRooms: Map<string, string>; // playerId -> roomId
  private config: RoomConfig;

  constructor(config: RoomConfig) {
    this.rooms = new Map();
    this.playerRooms = new Map();
    this.config = config;
  }

  // 创建房间
  public createRoom(options: CreateRoomOptions): GameRoom {
    const roomId = this.generateRoomId();

    const room = new GameRoom({
      id: roomId,
      name: options.name,
      host: options.hostId,
      maxPlayers: options.maxPlayers || this.config.defaultMaxPlayers,
      gameMode: options.gameMode,
      isPrivate: options.isPrivate || false,
      password: options.password,
      settings: options.settings || {}
    });

    this.rooms.set(roomId, room);

    // 创建者自动加入房间
    this.joinRoom(options.hostId, roomId, options.password);

    return room;
  }

  // 加入房间
  public async joinRoom(
    playerId: string,
    roomId: string,
    password?: string
  ): Promise<JoinResult> {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, error: 'ROOM_NOT_FOUND' };
    }

    if (room.isFull()) {
      return { success: false, error: 'ROOM_FULL' };
    }

    if (room.isPrivate && room.password !== password) {
      return { success: false, error: 'INVALID_PASSWORD' };
    }

    if (room.isStarted) {
      return { success: false, error: 'GAME_IN_PROGRESS' };
    }

    // 检查玩家是否已在其他房间
    const currentRoomId = this.playerRooms.get(playerId);
    if (currentRoomId) {
      await this.leaveRoom(playerId);
    }

    // 加入房间
    room.addPlayer(playerId);
    this.playerRooms.set(playerId, roomId);

    // 广播给房间内其他玩家
    room.broadcast({
      type: 'player_joined',
      playerId: playerId,
      playerCount: room.players.length
    });

    return {
      success: true,
      room: room.getPublicInfo()
    };
  }

  // 离开房间
  public async leaveRoom(playerId: string): Promise<void> {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    room.removePlayer(playerId);
    this.playerRooms.delete(playerId);

    // 如果是房主离开，转移房主或关闭房间
    if (room.host === playerId) {
      if (room.players.length > 0) {
        room.transferHost(room.players[0]);
        room.broadcast({
          type: 'host_changed',
          newHost: room.host
        });
      } else {
        // 房间为空，删除房间
        this.rooms.delete(roomId);
        return;
      }
    }

    room.broadcast({
      type: 'player_left',
      playerId: playerId,
      playerCount: room.players.length
    });
  }

  // 获取房间列表
  public getRoomList(filter?: RoomFilter): RoomListItem[] {
    const rooms: RoomListItem[] = [];

    for (const room of this.rooms.values()) {
      if (room.isPrivate) continue;
      if (filter?.gameMode && room.gameMode !== filter.gameMode) continue;
      if (filter?.hasSpace && room.isFull()) continue;

      rooms.push(room.getPublicInfo());
    }

    // 排序：按玩家数量降序
    rooms.sort((a, b) => b.playerCount - a.playerCount);

    return rooms;
  }

  // 快速加入
  public async quickJoin(
    playerId: string,
    preferences: QuickJoinPreferences
  ): Promise<JoinResult> {
    // 查找符合条件的房间
    const availableRooms = this.findMatchingRooms(preferences);

    if (availableRooms.length === 0) {
      // 没有合适的房间，创建新房间
      const room = this.createRoom({
        name: `快速游戏 ${Date.now()}`,
        hostId: playerId,
        gameMode: preferences.gameMode,
        maxPlayers: preferences.maxPlayers
      });

      return {
        success: true,
        room: room.getPublicInfo(),
        created: true
      };
    }

    // 选择最优房间（玩家数量最接近满员）
    availableRooms.sort((a, b) => b.players.length - a.players.length);
    return this.joinRoom(playerId, availableRooms[0].id);
  }

  private findMatchingRooms(preferences: QuickJoinPreferences): GameRoom[] {
    const matching: GameRoom[] = [];

    for (const room of this.rooms.values()) {
      if (room.isPrivate) continue;
      if (room.isFull()) continue;
      if (room.isStarted) continue;
      if (preferences.gameMode && room.gameMode !== preferences.gameMode) continue;

      matching.push(room);
    }

    return matching;
  }
}

// 游戏房间
class GameRoom {
  public id: string;
  public name: string;
  public host: string;
  public players: string[] = [];
  public maxPlayers: number;
  public gameMode: string;
  public isPrivate: boolean;
  public password?: string;
  public settings: RoomSettings;
  public isStarted: boolean = false;

  private connections: Map<string, WebSocket>;
  private readyStatus: Map<string, boolean>;
  private teamAssignments: Map<string, number>;

  constructor(options: RoomOptions) {
    this.id = options.id;
    this.name = options.name;
    this.host = options.host;
    this.maxPlayers = options.maxPlayers;
    this.gameMode = options.gameMode;
    this.isPrivate = options.isPrivate;
    this.password = options.password;
    this.settings = options.settings;

    this.connections = new Map();
    this.readyStatus = new Map();
    this.teamAssignments = new Map();
  }

  public addPlayer(playerId: string): void {
    if (!this.players.includes(playerId)) {
      this.players.push(playerId);
      this.readyStatus.set(playerId, false);

      // 自动分配队伍
      this.autoAssignTeam(playerId);
    }
  }

  public removePlayer(playerId: string): void {
    const index = this.players.indexOf(playerId);
    if (index !== -1) {
      this.players.splice(index, 1);
      this.readyStatus.delete(playerId);
      this.teamAssignments.delete(playerId);
      this.connections.delete(playerId);
    }
  }

  public setReady(playerId: string, ready: boolean): void {
    if (this.players.includes(playerId)) {
      this.readyStatus.set(playerId, ready);

      this.broadcast({
        type: 'ready_status',
        playerId,
        ready
      });

      // 检查是否所有人都准备好
      this.checkAllReady();
    }
  }

  private checkAllReady(): void {
    if (this.players.length < 2) return;

    const allReady = this.players.every(
      p => this.readyStatus.get(p) === true
    );

    if (allReady) {
      this.broadcast({
        type: 'all_ready',
        countdown: 5
      });

      // 5秒后开始游戏
      setTimeout(() => this.startGame(), 5000);
    }
  }

  private autoAssignTeam(playerId: string): void {
    // 简单的队伍平衡分配
    const team1Count = [...this.teamAssignments.values()].filter(t => t === 1).length;
    const team2Count = [...this.teamAssignments.values()].filter(t => t === 2).length;

    const team = team1Count <= team2Count ? 1 : 2;
    this.teamAssignments.set(playerId, team);
  }

  public async startGame(): Promise<void> {
    this.isStarted = true;

    // 请求游戏服务器
    const gameServer = await this.requestGameServer();

    // 发送连接信息
    this.broadcast({
      type: 'game_starting',
      server: {
        address: gameServer.address,
        port: gameServer.port,
        token: gameServer.connectionToken
      },
      teams: Object.fromEntries(this.teamAssignments)
    });
  }

  public broadcast(message: any, excludePlayer?: string): void {
    for (const [playerId, socket] of this.connections) {
      if (playerId !== excludePlayer && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    }
  }

  public isFull(): boolean {
    return this.players.length >= this.maxPlayers;
  }

  public getPublicInfo(): RoomListItem {
    return {
      id: this.id,
      name: this.name,
      host: this.host,
      playerCount: this.players.length,
      maxPlayers: this.maxPlayers,
      gameMode: this.gameMode,
      isPrivate: this.isPrivate,
      isStarted: this.isStarted
    };
  }
}
```

## 匹配系统

### ELO 匹配算法

```typescript
// 匹配系统
class MatchmakingSystem {
  private queue: Map<string, QueueEntry>;
  private matchmaker: Matchmaker;
  private config: MatchmakingConfig;

  constructor(config: MatchmakingConfig) {
    this.queue = new Map();
    this.config = config;
    this.matchmaker = new Matchmaker(config);

    // 定期处理匹配
    setInterval(() => this.processQueue(), 1000);
  }

  // 加入匹配队列
  public joinQueue(playerId: string, options: QueueOptions): QueueResult {
    // 检查是否已在队列
    if (this.queue.has(playerId)) {
      return { success: false, error: 'ALREADY_IN_QUEUE' };
    }

    const entry: QueueEntry = {
      playerId,
      rating: options.rating,
      gameMode: options.gameMode,
      region: options.region,
      joinTime: Date.now(),
      searchRange: this.config.initialSearchRange,
      partyMembers: options.partyMembers || []
    };

    this.queue.set(playerId, entry);

    return {
      success: true,
      estimatedWait: this.estimateWaitTime(entry)
    };
  }

  // 离开队列
  public leaveQueue(playerId: string): void {
    this.queue.delete(playerId);
  }

  // 处理匹配队列
  private processQueue(): void {
    const entries = Array.from(this.queue.values());

    // 按等待时间排序，优先处理等待久的玩家
    entries.sort((a, b) => a.joinTime - b.joinTime);

    const matched: Set<string> = new Set();

    for (const entry of entries) {
      if (matched.has(entry.playerId)) continue;

      // 扩大搜索范围
      this.expandSearchRange(entry);

      // 查找匹配
      const match = this.matchmaker.findMatch(entry, entries, matched);

      if (match) {
        // 创建比赛
        this.createMatch(match);

        // 标记已匹配
        for (const player of match.players) {
          matched.add(player.playerId);
          this.queue.delete(player.playerId);
        }
      }
    }
  }

  private expandSearchRange(entry: QueueEntry): void {
    const waitTime = Date.now() - entry.joinTime;
    const expansionRate = this.config.searchRangeExpansion;

    // 每秒扩大搜索范围
    entry.searchRange = this.config.initialSearchRange +
                        (waitTime / 1000) * expansionRate;

    // 最大搜索范围限制
    entry.searchRange = Math.min(
      entry.searchRange,
      this.config.maxSearchRange
    );
  }

  private estimateWaitTime(entry: QueueEntry): number {
    // 根据历史数据估算等待时间
    const sameRatingCount = Array.from(this.queue.values()).filter(
      e => Math.abs(e.rating - entry.rating) < this.config.initialSearchRange
    ).length;

    // 简化估算
    if (sameRatingCount >= this.config.playersPerMatch - 1) {
      return 10; // 10秒
    }

    return 30 + (1000 - Math.min(sameRatingCount * 100, 900));
  }

  private createMatch(match: MatchResult): void {
    // 通知所有玩家
    for (const player of match.players) {
      this.notifyPlayer(player.playerId, {
        type: 'match_found',
        matchId: match.id,
        players: match.players.map(p => ({
          id: p.playerId,
          team: p.team
        })),
        averageRating: match.averageRating
      });
    }
  }
}

// 匹配器
class Matchmaker {
  private config: MatchmakingConfig;

  constructor(config: MatchmakingConfig) {
    this.config = config;
  }

  public findMatch(
    entry: QueueEntry,
    allEntries: QueueEntry[],
    excluded: Set<string>
  ): MatchResult | null {
    const candidates: QueueEntry[] = [];

    // 查找符合条件的候选人
    for (const candidate of allEntries) {
      if (excluded.has(candidate.playerId)) continue;
      if (candidate.playerId === entry.playerId) continue;
      if (candidate.gameMode !== entry.gameMode) continue;
      if (candidate.region !== entry.region) continue;

      // 检查评分差距
      const ratingDiff = Math.abs(candidate.rating - entry.rating);
      const maxDiff = Math.max(entry.searchRange, candidate.searchRange);

      if (ratingDiff <= maxDiff) {
        candidates.push(candidate);
      }
    }

    // 需要足够的候选人
    const neededPlayers = this.config.playersPerMatch - 1 - entry.partyMembers.length;
    if (candidates.length < neededPlayers) {
      return null;
    }

    // 选择最佳组合
    const selectedPlayers = this.selectBestCombination(entry, candidates, neededPlayers);

    if (selectedPlayers.length < neededPlayers) {
      return null;
    }

    // 创建匹配结果
    return this.createMatchResult(entry, selectedPlayers);
  }

  private selectBestCombination(
    entry: QueueEntry,
    candidates: QueueEntry[],
    count: number
  ): QueueEntry[] {
    // 按评分接近程度排序
    candidates.sort((a, b) =>
      Math.abs(a.rating - entry.rating) - Math.abs(b.rating - entry.rating)
    );

    return candidates.slice(0, count);
  }

  private createMatchResult(
    entry: QueueEntry,
    selectedPlayers: QueueEntry[]
  ): MatchResult {
    const allPlayers = [entry, ...selectedPlayers];

    // 分配队伍（尝试平衡评分）
    const teams = this.assignTeams(allPlayers);

    // 计算平均评分
    const totalRating = allPlayers.reduce((sum, p) => sum + p.rating, 0);
    const averageRating = totalRating / allPlayers.length;

    return {
      id: this.generateMatchId(),
      players: teams,
      averageRating,
      createdAt: Date.now()
    };
  }

  private assignTeams(players: QueueEntry[]): MatchPlayer[] {
    // 按评分排序
    const sorted = [...players].sort((a, b) => b.rating - a.rating);

    const team1: MatchPlayer[] = [];
    const team2: MatchPlayer[] = [];
    let team1Rating = 0;
    let team2Rating = 0;

    // 贪心分配，保持队伍评分平衡
    for (const player of sorted) {
      if (team1Rating <= team2Rating && team1.length < players.length / 2) {
        team1.push({ playerId: player.playerId, team: 1 });
        team1Rating += player.rating;
      } else {
        team2.push({ playerId: player.playerId, team: 2 });
        team2Rating += player.rating;
      }
    }

    return [...team1, ...team2];
  }
}

// ELO 评分系统
class EloRatingSystem {
  private kFactor: number;

  constructor(kFactor: number = 32) {
    this.kFactor = kFactor;
  }

  // 计算预期胜率
  public expectedScore(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }

  // 更新评分
  public updateRating(
    playerRating: number,
    opponentRating: number,
    actualScore: number // 1 = 胜, 0.5 = 平, 0 = 负
  ): number {
    const expected = this.expectedScore(playerRating, opponentRating);
    const newRating = playerRating + this.kFactor * (actualScore - expected);
    return Math.round(newRating);
  }

  // 批量更新（团队比赛）
  public updateTeamRatings(
    team1: PlayerRating[],
    team2: PlayerRating[],
    winner: 1 | 2 | 0 // 0 = 平局
  ): Map<string, number> {
    const updates = new Map<string, number>();

    // 计算队伍平均评分
    const team1Avg = team1.reduce((sum, p) => sum + p.rating, 0) / team1.length;
    const team2Avg = team2.reduce((sum, p) => sum + p.rating, 0) / team2.length;

    // 更新 Team 1
    const team1Score = winner === 1 ? 1 : winner === 0 ? 0.5 : 0;
    for (const player of team1) {
      const newRating = this.updateRating(player.rating, team2Avg, team1Score);
      updates.set(player.id, newRating);
    }

    // 更新 Team 2
    const team2Score = winner === 2 ? 1 : winner === 0 ? 0.5 : 0;
    for (const player of team2) {
      const newRating = this.updateRating(player.rating, team1Avg, team2Score);
      updates.set(player.id, newRating);
    }

    return updates;
  }
}
```

## 带宽优化

### 数据压缩与增量同步

```typescript
// 快照压缩系统
class SnapshotCompressor {
  private previousSnapshots: Map<string, Snapshot>;
  private compressionLevel: number;

  constructor(compressionLevel: number = 6) {
    this.previousSnapshots = new Map();
    this.compressionLevel = compressionLevel;
  }

  // 创建增量快照
  public createDeltaSnapshot(
    clientId: string,
    currentSnapshot: Snapshot
  ): DeltaSnapshot {
    const previous = this.previousSnapshots.get(clientId);

    if (!previous) {
      // 没有基线，发送完整快照
      this.previousSnapshots.set(clientId, currentSnapshot);
      return {
        type: 'full',
        tick: currentSnapshot.tick,
        data: this.compressSnapshot(currentSnapshot)
      };
    }

    // 计算差异
    const delta = this.calculateDelta(previous, currentSnapshot);

    // 更新基线
    this.previousSnapshots.set(clientId, currentSnapshot);

    // 如果差异太大，发送完整快照更高效
    if (delta.size > currentSnapshot.entities.length * 0.7) {
      return {
        type: 'full',
        tick: currentSnapshot.tick,
        data: this.compressSnapshot(currentSnapshot)
      };
    }

    return {
      type: 'delta',
      baseTick: previous.tick,
      tick: currentSnapshot.tick,
      data: this.compressDelta(delta)
    };
  }

  private calculateDelta(
    previous: Snapshot,
    current: Snapshot
  ): SnapshotDelta {
    const delta: SnapshotDelta = {
      added: [],
      removed: [],
      modified: []
    };

    const previousEntities = new Map(
      previous.entities.map(e => [e.id, e])
    );
    const currentEntities = new Map(
      current.entities.map(e => [e.id, e])
    );

    // 查找新增和修改的实体
    for (const [id, entity] of currentEntities) {
      const prevEntity = previousEntities.get(id);

      if (!prevEntity) {
        delta.added.push(entity);
      } else if (!this.entitiesEqual(prevEntity, entity)) {
        // 只发送变化的字段
        delta.modified.push({
          id,
          changes: this.getChangedFields(prevEntity, entity)
        });
      }
    }

    // 查找移除的实体
    for (const id of previousEntities.keys()) {
      if (!currentEntities.has(id)) {
        delta.removed.push(id);
      }
    }

    return delta;
  }

  private getChangedFields(prev: Entity, curr: Entity): Partial<Entity> {
    const changes: Partial<Entity> = {};

    // 位置变化
    if (prev.position.x !== curr.position.x ||
        prev.position.y !== curr.position.y) {
      changes.position = curr.position;
    }

    // 速度变化
    if (prev.velocity.x !== curr.velocity.x ||
        prev.velocity.y !== curr.velocity.y) {
      changes.velocity = curr.velocity;
    }

    // 生命值变化
    if (prev.health !== curr.health) {
      changes.health = curr.health;
    }

    // 状态变化
    if (prev.state !== curr.state) {
      changes.state = curr.state;
    }

    return changes;
  }

  private compressSnapshot(snapshot: Snapshot): Buffer {
    const json = JSON.stringify(snapshot);
    return zlib.deflateSync(json, { level: this.compressionLevel });
  }

  private compressDelta(delta: SnapshotDelta): Buffer {
    const json = JSON.stringify(delta);
    return zlib.deflateSync(json, { level: this.compressionLevel });
  }
}

// 量化压缩
class QuantizationCompressor {
  // 位置量化（将浮点数压缩为整数）
  public quantizePosition(position: Vector3, bounds: Bounds): QuantizedPosition {
    // 将位置归一化到 0-65535 范围
    return {
      x: Math.round(((position.x - bounds.minX) / (bounds.maxX - bounds.minX)) * 65535),
      y: Math.round(((position.y - bounds.minY) / (bounds.maxY - bounds.minY)) * 65535),
      z: Math.round(((position.z - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * 65535)
    };
  }

  // 解量化
  public dequantizePosition(quantized: QuantizedPosition, bounds: Bounds): Vector3 {
    return {
      x: bounds.minX + (quantized.x / 65535) * (bounds.maxX - bounds.minX),
      y: bounds.minY + (quantized.y / 65535) * (bounds.maxY - bounds.minY),
      z: bounds.minZ + (quantized.z / 65535) * (bounds.maxZ - bounds.minZ)
    };
  }

  // 旋转量化（使用四元数最小表示）
  public quantizeRotation(rotation: Quaternion): QuantizedRotation {
    // 找出最大分量
    const components = [rotation.x, rotation.y, rotation.z, rotation.w];
    let maxIndex = 0;
    let maxValue = Math.abs(components[0]);

    for (let i = 1; i < 4; i++) {
      if (Math.abs(components[i]) > maxValue) {
        maxValue = Math.abs(components[i]);
        maxIndex = i;
      }
    }

    // 确保最大分量为正（可以从其他三个推导）
    const sign = components[maxIndex] >= 0 ? 1 : -1;

    // 量化其他三个分量
    const quantized: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (i !== maxIndex) {
        // 量化到 10 位（-1 到 1 映射到 0-1023）
        const normalized = (components[i] * sign + 1) / 2;
        quantized.push(Math.round(normalized * 1023));
      }
    }

    return {
      maxIndex,
      a: quantized[0],
      b: quantized[1],
      c: quantized[2]
    };
  }

  // 速度量化
  public quantizeVelocity(velocity: Vector3, maxSpeed: number): QuantizedVelocity {
    // 假设速度范围是 -maxSpeed 到 maxSpeed
    return {
      x: Math.round(((velocity.x / maxSpeed + 1) / 2) * 255),
      y: Math.round(((velocity.y / maxSpeed + 1) / 2) * 255),
      z: Math.round(((velocity.z / maxSpeed + 1) / 2) * 255)
    };
  }

  // 打包实体状态到紧凑二进制格式
  public packEntity(entity: Entity, bounds: Bounds): Buffer {
    const buffer = Buffer.alloc(20); // 固定大小
    let offset = 0;

    // 实体ID (2 bytes)
    buffer.writeUInt16LE(entity.numericId, offset);
    offset += 2;

    // 位置 (6 bytes - 每轴2字节)
    const pos = this.quantizePosition(entity.position, bounds);
    buffer.writeUInt16LE(pos.x, offset);
    buffer.writeUInt16LE(pos.y, offset + 2);
    buffer.writeUInt16LE(pos.z, offset + 4);
    offset += 6;

    // 旋转 (4 bytes)
    const rot = this.quantizeRotation(entity.rotation);
    buffer.writeUInt8((rot.maxIndex << 6) | (rot.a >> 4), offset);
    buffer.writeUInt8(((rot.a & 0x0F) << 4) | (rot.b >> 6), offset + 1);
    buffer.writeUInt8(((rot.b & 0x3F) << 2) | (rot.c >> 8), offset + 2);
    buffer.writeUInt8(rot.c & 0xFF, offset + 3);
    offset += 4;

    // 速度 (3 bytes)
    const vel = this.quantizeVelocity(entity.velocity, 100);
    buffer.writeUInt8(vel.x, offset);
    buffer.writeUInt8(vel.y, offset + 1);
    buffer.writeUInt8(vel.z, offset + 2);
    offset += 3;

    // 状态标志 (1 byte)
    let flags = 0;
    if (entity.isGrounded) flags |= 0x01;
    if (entity.isCrouching) flags |= 0x02;
    if (entity.isShooting) flags |= 0x04;
    if (entity.isReloading) flags |= 0x08;
    buffer.writeUInt8(flags, offset);
    offset += 1;

    // 生命值 (1 byte, 0-255)
    buffer.writeUInt8(Math.round(entity.health * 2.55), offset);
    offset += 1;

    // 武器ID (1 byte)
    buffer.writeUInt8(entity.weaponId, offset);
    offset += 1;

    // 弹药 (1 byte)
    buffer.writeUInt8(entity.ammo, offset);

    return buffer;
  }
}
```

## 延迟补偿

### 服务端延迟补偿

```typescript
// 延迟补偿系统
class LagCompensation {
  private worldHistory: WorldSnapshot[] = [];
  private maxHistoryLength: number = 128; // 保存约1秒的历史
  private tickRate: number = 128;

  // 保存世界状态历史
  public saveWorldState(world: World): void {
    const snapshot: WorldSnapshot = {
      tick: world.currentTick,
      timestamp: Date.now(),
      entities: new Map()
    };

    // 保存所有实体的位置
    for (const entity of world.entities.values()) {
      snapshot.entities.set(entity.id, {
        position: { ...entity.position },
        rotation: { ...entity.rotation },
        hitbox: entity.hitbox.clone()
      });
    }

    this.worldHistory.push(snapshot);

    // 限制历史长度
    while (this.worldHistory.length > this.maxHistoryLength) {
      this.worldHistory.shift();
    }
  }

  // 处理带延迟补偿的射击
  public processShot(
    shooter: Player,
    shotData: ShotData,
    world: World
  ): HitResult {
    // 计算射击时的服务器时间
    const clientLatency = shooter.connection.latency;
    const interpolationDelay = 100; // 客户端插值延迟
    const totalDelay = clientLatency / 2 + interpolationDelay;

    // 回溯到射击发生时的世界状态
    const targetTick = shotData.clientTick;
    const pastSnapshot = this.findSnapshot(targetTick);

    if (!pastSnapshot) {
      // 历史不够，使用当前状态
      return this.performRaycast(shotData, world);
    }

    // 在历史状态中执行射线检测
    return this.performRaycastInPast(shotData, pastSnapshot, world);
  }

  private findSnapshot(targetTick: number): WorldSnapshot | null {
    // 二分查找最接近的快照
    let left = 0;
    let right = this.worldHistory.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const snapshot = this.worldHistory[mid];

      if (snapshot.tick === targetTick) {
        return snapshot;
      } else if (snapshot.tick < targetTick) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    // 找不到精确匹配，返回最接近的
    if (right >= 0 && right < this.worldHistory.length) {
      return this.worldHistory[right];
    }

    return null;
  }

  private performRaycastInPast(
    shotData: ShotData,
    snapshot: WorldSnapshot,
    currentWorld: World
  ): HitResult {
    const rayOrigin = shotData.position;
    const rayDirection = shotData.direction;
    const maxDistance = shotData.weapon.range;

    let closestHit: HitResult | null = null;
    let closestDistance = maxDistance;

    // 对所有实体进行射线检测
    for (const [entityId, historicalState] of snapshot.entities) {
      // 跳过射击者自己
      if (entityId === shotData.shooterId) continue;

      // 获取当前实体引用（用于伤害计算）
      const currentEntity = currentWorld.entities.get(entityId);
      if (!currentEntity) continue;

      // 使用历史位置的碰撞盒
      const hitbox = historicalState.hitbox.clone();
      hitbox.setPosition(historicalState.position);

      // 射线检测
      const hit = this.raycastHitbox(rayOrigin, rayDirection, hitbox);

      if (hit && hit.distance < closestDistance) {
        closestDistance = hit.distance;
        closestHit = {
          hit: true,
          entityId,
          entity: currentEntity,
          position: hit.position,
          distance: hit.distance,
          bodyPart: this.determineBodyPart(hit.position, hitbox),
          wasLagCompensated: true,
          compensationTicks: currentWorld.currentTick - snapshot.tick
        };
      }
    }

    return closestHit || { hit: false };
  }

  private raycastHitbox(
    origin: Vector3,
    direction: Vector3,
    hitbox: Hitbox
  ): { position: Vector3; distance: number } | null {
    // AABB 射线检测算法
    const invDir = {
      x: 1 / direction.x,
      y: 1 / direction.y,
      z: 1 / direction.z
    };

    const bounds = hitbox.getBounds();

    let tmin = (bounds.min.x - origin.x) * invDir.x;
    let tmax = (bounds.max.x - origin.x) * invDir.x;

    if (tmin > tmax) [tmin, tmax] = [tmax, tmin];

    let tymin = (bounds.min.y - origin.y) * invDir.y;
    let tymax = (bounds.max.y - origin.y) * invDir.y;

    if (tymin > tymax) [tymin, tymax] = [tymax, tymin];

    if (tmin > tymax || tymin > tmax) return null;

    if (tymin > tmin) tmin = tymin;
    if (tymax < tmax) tmax = tymax;

    let tzmin = (bounds.min.z - origin.z) * invDir.z;
    let tzmax = (bounds.max.z - origin.z) * invDir.z;

    if (tzmin > tzmax) [tzmin, tzmax] = [tzmax, tzmin];

    if (tmin > tzmax || tzmin > tmax) return null;

    if (tzmin > tmin) tmin = tzmin;

    if (tmin < 0) return null;

    return {
      position: {
        x: origin.x + direction.x * tmin,
        y: origin.y + direction.y * tmin,
        z: origin.z + direction.z * tmin
      },
      distance: tmin
    };
  }

  private determineBodyPart(hitPosition: Vector3, hitbox: Hitbox): string {
    // 根据击中位置确定身体部位
    const relativeY = hitPosition.y - hitbox.position.y;
    const height = hitbox.height;

    if (relativeY > height * 0.85) return 'head';
    if (relativeY > height * 0.5) return 'torso';
    if (relativeY > height * 0.25) return 'legs';
    return 'feet';
  }
}

// 客户端预测回滚
class ClientPrediction {
  private stateHistory: PredictedState[] = [];
  private maxHistoryLength: number = 64;

  // 保存预测状态
  public savePredictedState(state: PlayerState, inputSequence: number): void {
    this.stateHistory.push({
      inputSequence,
      timestamp: Date.now(),
      state: { ...state }
    });

    while (this.stateHistory.length > this.maxHistoryLength) {
      this.stateHistory.shift();
    }
  }

  // 服务器和解
  public reconcile(
    serverState: PlayerState,
    lastProcessedInput: number,
    player: LocalPlayer,
    pendingInputs: PlayerInput[]
  ): void {
    // 找到服务器确认的状态
    const confirmedIndex = this.stateHistory.findIndex(
      s => s.inputSequence === lastProcessedInput
    );

    if (confirmedIndex === -1) {
      // 状态过旧，直接应用服务器状态
      player.setState(serverState);
      return;
    }

    // 比较预测状态和服务器状态
    const predictedState = this.stateHistory[confirmedIndex].state;
    const error = this.calculateError(predictedState, serverState);

    if (error > 0.1) { // 误差阈值
      console.log(`预测误差: ${error.toFixed(3)}, 执行回滚`);

      // 回滚到服务器状态
      player.setState(serverState);

      // 清理已确认的历史
      this.stateHistory.splice(0, confirmedIndex + 1);

      // 重新应用未确认的输入
      for (const input of pendingInputs) {
        player.applyInput(input);
        this.savePredictedState(player.getState(), input.sequence);
      }
    } else {
      // 预测准确，只需清理历史
      this.stateHistory.splice(0, confirmedIndex + 1);
    }
  }

  private calculateError(predicted: PlayerState, actual: PlayerState): number {
    // 计算位置误差
    const dx = predicted.position.x - actual.position.x;
    const dy = predicted.position.y - actual.position.y;
    const dz = predicted.position.z - actual.position.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
```

## 性能监控与调试

```typescript
// 网络性能监控
class NetworkMonitor {
  private metrics: NetworkMetrics;
  private sampleWindow: number = 60; // 60秒采样窗口
  private samples: MetricSample[] = [];

  constructor() {
    this.metrics = this.createInitialMetrics();
  }

  // 记录往返时间
  public recordRTT(rtt: number): void {
    this.metrics.currentRTT = rtt;
    this.metrics.rttSamples.push(rtt);

    // 保持样本数量
    if (this.metrics.rttSamples.length > 100) {
      this.metrics.rttSamples.shift();
    }

    // 计算统计数据
    this.updateRTTStats();
  }

  // 记录数据包
  public recordPacket(type: 'sent' | 'received', size: number): void {
    const now = Date.now();

    if (type === 'sent') {
      this.metrics.packetsSent++;
      this.metrics.bytesSent += size;
    } else {
      this.metrics.packetsReceived++;
      this.metrics.bytesReceived += size;
    }

    // 记录样本
    this.samples.push({
      timestamp: now,
      type,
      size
    });

    // 清理旧样本
    const cutoff = now - this.sampleWindow * 1000;
    this.samples = this.samples.filter(s => s.timestamp > cutoff);
  }

  // 记录丢包
  public recordPacketLoss(): void {
    this.metrics.packetsLost++;
    this.updatePacketLossRate();
  }

  // 记录抖动
  public recordJitter(jitter: number): void {
    this.metrics.jitterSamples.push(jitter);

    if (this.metrics.jitterSamples.length > 100) {
      this.metrics.jitterSamples.shift();
    }

    this.metrics.currentJitter = jitter;
    this.metrics.averageJitter = this.calculateAverage(this.metrics.jitterSamples);
  }

  private updateRTTStats(): void {
    const samples = this.metrics.rttSamples;

    this.metrics.averageRTT = this.calculateAverage(samples);
    this.metrics.minRTT = Math.min(...samples);
    this.metrics.maxRTT = Math.max(...samples);

    // 计算标准差
    const variance = samples.reduce((sum, val) => {
      const diff = val - this.metrics.averageRTT;
      return sum + diff * diff;
    }, 0) / samples.length;

    this.metrics.rttStdDev = Math.sqrt(variance);
  }

  private updatePacketLossRate(): void {
    const totalPackets = this.metrics.packetsSent;
    if (totalPackets > 0) {
      this.metrics.packetLossRate = this.metrics.packetsLost / totalPackets;
    }
  }

  // 计算带宽
  public getBandwidth(): BandwidthStats {
    const now = Date.now();
    const windowStart = now - 1000; // 最近1秒

    const recentSamples = this.samples.filter(s => s.timestamp > windowStart);

    let sentBytes = 0;
    let receivedBytes = 0;

    for (const sample of recentSamples) {
      if (sample.type === 'sent') {
        sentBytes += sample.size;
      } else {
        receivedBytes += sample.size;
      }
    }

    return {
      uploadBps: sentBytes * 8,      // bits per second
      downloadBps: receivedBytes * 8,
      uploadKBps: sentBytes / 1024,   // KB per second
      downloadKBps: receivedBytes / 1024
    };
  }

  // 获取网络质量评分
  public getNetworkQuality(): NetworkQuality {
    const rtt = this.metrics.averageRTT;
    const jitter = this.metrics.averageJitter;
    const packetLoss = this.metrics.packetLossRate;

    // 计算综合评分 (0-100)
    let score = 100;

    // RTT 评分
    if (rtt > 150) score -= 30;
    else if (rtt > 100) score -= 20;
    else if (rtt > 50) score -= 10;

    // 抖动评分
    if (jitter > 50) score -= 20;
    else if (jitter > 30) score -= 10;
    else if (jitter > 10) score -= 5;

    // 丢包评分
    if (packetLoss > 0.05) score -= 30;
    else if (packetLoss > 0.02) score -= 20;
    else if (packetLoss > 0.01) score -= 10;

    // 确定质量等级
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 80) quality = 'excellent';
    else if (score >= 60) quality = 'good';
    else if (score >= 40) quality = 'fair';
    else quality = 'poor';

    return {
      score,
      quality,
      metrics: {
        rtt: this.metrics.averageRTT,
        jitter: this.metrics.averageJitter,
        packetLoss: this.metrics.packetLossRate
      }
    };
  }

  // 导出诊断报告
  public generateReport(): NetworkDiagnosticReport {
    const bandwidth = this.getBandwidth();
    const quality = this.getNetworkQuality();

    return {
      timestamp: new Date().toISOString(),
      connectionDuration: Date.now() - this.metrics.connectionStartTime,

      latency: {
        current: this.metrics.currentRTT,
        average: this.metrics.averageRTT,
        min: this.metrics.minRTT,
        max: this.metrics.maxRTT,
        stdDev: this.metrics.rttStdDev
      },

      jitter: {
        current: this.metrics.currentJitter,
        average: this.metrics.averageJitter
      },

      packetLoss: {
        rate: this.metrics.packetLossRate,
        total: this.metrics.packetsLost
      },

      bandwidth: {
        upload: bandwidth.uploadKBps,
        download: bandwidth.downloadKBps
      },

      packets: {
        sent: this.metrics.packetsSent,
        received: this.metrics.packetsReceived
      },

      bytes: {
        sent: this.metrics.bytesSent,
        received: this.metrics.bytesReceived
      },

      quality
    };
  }
}

// 网络调试工具
class NetworkDebugger {
  private monitor: NetworkMonitor;
  private enabled: boolean = false;
  private logLevel: 'verbose' | 'normal' | 'minimal' = 'normal';

  constructor(monitor: NetworkMonitor) {
    this.monitor = monitor;
  }

  public enable(): void {
    this.enabled = true;
    this.startDebugOverlay();
  }

  public disable(): void {
    this.enabled = false;
    this.stopDebugOverlay();
  }

  // 模拟网络条件
  public simulateNetworkConditions(conditions: NetworkConditions): void {
    console.log(`模拟网络条件: 延迟=${conditions.latency}ms, ` +
                `抖动=${conditions.jitter}ms, 丢包=${conditions.packetLoss * 100}%`);

    // 这里会应用到实际的网络层
  }

  // 预设的网络条件
  public static presets = {
    excellent: { latency: 20, jitter: 5, packetLoss: 0 },
    good: { latency: 50, jitter: 10, packetLoss: 0.01 },
    fair: { latency: 100, jitter: 30, packetLoss: 0.02 },
    poor: { latency: 200, jitter: 50, packetLoss: 0.05 },
    terrible: { latency: 500, jitter: 100, packetLoss: 0.1 }
  };

  private startDebugOverlay(): void {
    // 在游戏界面显示网络统计
    setInterval(() => {
      if (!this.enabled) return;

      const report = this.monitor.generateReport();
      this.renderOverlay(report);
    }, 100);
  }

  private renderOverlay(report: NetworkDiagnosticReport): void {
    // 实际实现会渲染到游戏画面上
    console.log(`
    ========== 网络状态 ==========
    延迟: ${report.latency.current}ms (平均: ${report.latency.average.toFixed(1)}ms)
    抖动: ${report.jitter.current.toFixed(1)}ms
    丢包: ${(report.packetLoss.rate * 100).toFixed(2)}%
    带宽: ↑${report.bandwidth.upload.toFixed(1)}KB/s ↓${report.bandwidth.download.toFixed(1)}KB/s
    质量: ${report.quality.quality} (${report.quality.score}/100)
    ==============================
    `);
  }
}
```

## 面试要点

### 常见面试问题

```typescript
/**
 * 1. 客户端预测和服务器和解是什么？为什么需要它们？
 *
 * 答案要点：
 * - 客户端预测：客户端不等待服务器确认，直接应用玩家输入
 * - 服务器和解：当服务器状态返回时，修正预测错误
 * - 需要原因：隐藏网络延迟，提供即时响应的游戏体验
 * - 实现方式：保存输入历史，回滚到服务器状态后重放
 */

/**
 * 2. 帧同步和状态同步的区别？各自适用场景？
 *
 * 答案要点：
 * - 帧同步：同步玩家输入，本地计算游戏状态
 *   优点：带宽低、支持回放、确定性
 *   缺点：需要确定性引擎、延迟敏感
 *   适用：RTS、格斗游戏
 *
 * - 状态同步：同步游戏状态
 *   优点：实现简单、容错性好
 *   缺点：带宽高
 *   适用：FPS、MMORPG
 */

/**
 * 3. 如何处理网络延迟补偿？
 *
 * 答案要点：
 * - 服务器保存世界状态历史
 * - 射击时回溯到玩家视角的时间点
 * - 在历史状态中进行碰撞检测
 * - 平衡高延迟玩家和低延迟玩家的体验
 */

/**
 * 4. TCP 和 UDP 在游戏中如何选择？
 *
 * 答案要点：
 * - UDP：实时数据（位置、输入）- 低延迟优先
 * - TCP：重要数据（登录、交易）- 可靠性优先
 * - 可靠UDP：介于两者之间，自定义重传策略
 * - 混合使用：根据数据类型选择协议
 */

/**
 * 5. 如何设计防作弊系统？
 *
 * 答案要点：
 * - 服务器权威：所有游戏逻辑在服务器执行
 * - 输入验证：检查输入是否合法（速度、冷却时间等）
 * - 统计检测：分析异常行为模式（命中率、反应时间）
 * - 视野裁剪：不发送玩家看不到的信息
 * - 加密通信：防止数据包篡改
 */

/**
 * 6. 匹配系统如何设计？
 *
 * 答案要点：
 * - ELO/MMR 评分系统
 * - 队列管理和搜索范围扩展
 * - 队伍平衡（评分差距最小化）
 * - 地区优先（延迟优化）
 * - 等待时间和匹配质量的权衡
 */
```

### 架构设计题

```typescript
/**
 * 设计一个支持100人同时在线的大逃杀游戏网络架构
 *
 * 解答思路：
 */

class BattleRoyaleArchitecture {
  /**
   * 1. 整体架构
   *
   * 大厅服务器集群
   *     ↓
   * 匹配服务
   *     ↓
   * 游戏服务器（每局一个实例）
   *     ↓
   * 数据库集群（玩家数据、战绩）
   */

  /**
   * 2. 关键技术选择
   *
   * - 协议：UDP（位置同步）+ TCP（重要事件）
   * - 同步：状态同步 + 兴趣区域管理
   * - 更新频率：20-30Hz（平衡带宽和流畅度）
   * - 服务器：专用服务器（反作弊）
   */

  /**
   * 3. 优化策略
   *
   * - 空间分区：划分地图区域，只同步附近玩家
   * - 优先级系统：近距离玩家高频更新，远距离低频
   * - 增量压缩：只发送变化的数据
   * - 预测补偿：客户端预测 + 延迟补偿
   */

  /**
   * 4. 带宽估算
   *
   * 每个玩家状态：~50 bytes
   * 100玩家 × 50bytes × 20Hz = 100KB/s 下行
   * 使用兴趣区域后：~20-30KB/s
   */

  /**
   * 5. 扩展性
   *
   * - 无状态大厅服务器，可水平扩展
   * - 游戏服务器按需启动
   * - 匹配服务使用消息队列解耦
   * - 数据库读写分离
   */
}
```

## 总结

网络游戏架构设计是一个需要在多个维度做出权衡的复杂领域：

1. **架构选择**：根据游戏类型选择客户端-服务器、P2P或专用服务器
2. **同步机制**：状态同步适合FPS/MMO，帧同步适合RTS/格斗
3. **协议选择**：UDP用于实时数据，TCP用于可靠数据，混合使用最佳
4. **延迟处理**：客户端预测、服务器和解、延迟补偿缺一不可
5. **反作弊**：服务器权威、输入验证、统计检测多管齐下
6. **带宽优化**：增量同步、量化压缩、兴趣区域管理
7. **匹配系统**：ELO评分、队伍平衡、等待时间优化

掌握这些知识，你就能设计出低延迟、高可靠、可扩展的网络游戏架构，为玩家提供流畅的多人游戏体验。
