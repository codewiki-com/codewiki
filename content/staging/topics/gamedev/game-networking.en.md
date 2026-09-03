---
title: Game Networking Architecture Design
description: "Master multiplayer game networking: client-server, P2P, and dedicated server architectures"
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - networking
  - multiplayer
  - architecture
  - servers
status: imported
origin: old/src/content/docs/gamedev/game-networking.en.md
divergence: 0.235
issues: []
legacy:
  category: GameDev
  subcategory: Networking
  order: 23
  lastUpdated: 2026-01-07
---

Game networking architecture is one of the most challenging technical areas in multiplayer game development. It requires making precise trade-offs between latency, bandwidth, consistency, and security. This article will dive deep into various game networking architecture patterns, protocol selection, synchronization mechanisms, and practical case studies.

## Network Architecture Types Overview

When designing multiplayer game networking architecture, there are three basic patterns to choose from:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Game Network Architecture Types                      │
├─────────────────────┬─────────────────────┬─────────────────────────────┤
│   Client-Server     │       P2P           │     Dedicated Server        │
│                     │  (Peer-to-Peer)     │                             │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│  ┌───┐              │  ┌───┐   ┌───┐      │  ┌─────────────────────┐    │
│  │ S │              │  │ P │───│ P │      │  │  Dedicated Server   │    │
│  └─┬─┘              │  └─┬─┘   └─┬─┘      │  │      Cluster        │    │
│    │                │    │   ╲   │        │  └──────────┬──────────┘    │
│  ┌─┴─┬─┬─┐          │    │    ╲  │        │             │               │
│  │   │ │ │          │  ┌─┴─┐  ┌┴─┴┐      │    ┌────────┼────────┐      │
│  C   C C C          │  │ P │──│ P │      │    │        │        │      │
│                     │  └───┘  └───┘      │    C        C        C      │
├─────────────────────┼─────────────────────┼─────────────────────────────┤
│ Use: MMORPG, FPS    │ Use: Fighting, RTS  │ Use: Large competitive      │
│ Pro: High authority │ Pro: Low cost       │ Pro: Best performance       │
│ Con: Server cost    │ Con: Easy to cheat  │ Con: Complex operations     │
└─────────────────────┴─────────────────────┴─────────────────────────────┘
```

### Architecture Selection Decision Matrix

| Feature | Client-Server | P2P | Dedicated Server |
|---------|--------------|-----|------------------|
| Anti-cheat capability | High | Low | Highest |
| Operating cost | Medium | Low | High |
| Latency performance | Medium | Lowest | Low |
| Scalability | High | Low | Highest |
| Implementation complexity | Medium | High | High |
| Suitable player count | Medium-Large | Small | Large |

## Client-Server Model

The Client-Server model is the most common network game architecture, where the server acts as the authority handling all game logic.

### Basic Architecture

```typescript
// Server-side - Authoritative server implementation
class AuthoritativeServer {
  private gameState: GameState;
  private clients: Map<string, ClientConnection>;
  private tickRate: number = 60; // 60 updates per second
  private lastTickTime: number = 0;

  constructor() {
    this.gameState = new GameState();
    this.clients = new Map();
  }

  // Main loop
  public start(): void {
    setInterval(() => this.tick(), 1000 / this.tickRate);
  }

  private tick(): void {
    const currentTime = Date.now();
    const deltaTime = (currentTime - this.lastTickTime) / 1000;
    this.lastTickTime = currentTime;

    // 1. Process all client inputs
    this.processInputs();

    // 2. Update game state
    this.gameState.update(deltaTime);

    // 3. Detect collisions and game logic
    this.gameState.resolveCollisions();

    // 4. Broadcast state to all clients
    this.broadcastState();
  }

  private processInputs(): void {
    for (const [clientId, client] of this.clients) {
      const inputs = client.getAndClearInputs();

      for (const input of inputs) {
        // Validate input legitimacy
        if (this.validateInput(clientId, input)) {
          // Apply input to game state
          this.gameState.applyInput(clientId, input);
        }
      }
    }
  }

  private validateInput(clientId: string, input: PlayerInput): boolean {
    const player = this.gameState.getPlayer(clientId);
    if (!player) return false;

    // Validate if movement speed exceeds limit
    if (input.type === 'move') {
      const maxSpeed = player.stats.maxSpeed;
      const inputSpeed = Math.sqrt(
        input.velocity.x ** 2 + input.velocity.y ** 2
      );
      if (inputSpeed > maxSpeed * 1.1) { // Allow 10% tolerance
        console.warn(`Cheat detection: Player ${clientId} abnormal movement speed`);
        return false;
      }
    }

    // Validate ability cooldown
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
      // Customize state for each client (view culling, area of interest)
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

    // Area of interest management - only send entities within player's view range
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

### Client Implementation

```typescript
// Client - Implementation with prediction and interpolation
class GameClient {
  private socket: WebSocket;
  private localPlayer: LocalPlayer;
  private remoteEntities: Map<string, RemoteEntity>;

  // Client prediction related
  private pendingInputs: PlayerInput[] = [];
  private inputSequence: number = 0;

  // Interpolation related
  private stateBuffer: StateSnapshot[] = [];
  private interpolationDelay: number = 100; // 100ms interpolation delay

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

  // Handle player input
  public handleInput(input: RawInput): void {
    const playerInput: PlayerInput = {
      sequence: this.inputSequence++,
      timestamp: Date.now(),
      ...input
    };

    // 1. Apply immediately to local (client prediction)
    this.localPlayer.applyInput(playerInput);

    // 2. Save pending inputs
    this.pendingInputs.push(playerInput);

    // 3. Send to server
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
    // Add to state buffer
    this.stateBuffer.push({
      timestamp: message.timestamp,
      state: message.state
    });

    // Maintain buffer size
    while (this.stateBuffer.length > 30) {
      this.stateBuffer.shift();
    }

    // Server Reconciliation
    this.reconcileWithServer(message);
  }

  private reconcileWithServer(message: StateUpdateMessage): void {
    const serverState = message.state;
    const myServerState = serverState.players.find(
      p => p.id === this.localPlayer.id
    );

    if (!myServerState) return;

    // Find the last input confirmed by server
    const lastProcessedInput = message.lastProcessedInput;

    // Remove confirmed inputs
    this.pendingInputs = this.pendingInputs.filter(
      input => input.sequence > lastProcessedInput
    );

    // Reset to server state
    this.localPlayer.setPosition(myServerState.position);
    this.localPlayer.setVelocity(myServerState.velocity);

    // Re-apply unconfirmed inputs
    for (const input of this.pendingInputs) {
      this.localPlayer.applyInput(input);
    }
  }

  // Entity interpolation
  public updateRemoteEntities(): void {
    const renderTime = Date.now() - this.interpolationDelay;

    // Find two states for interpolation
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
      // Calculate interpolation factor
      const t = (renderTime - previousState.timestamp) /
                (nextState.timestamp - previousState.timestamp);

      // Interpolate for each remote entity
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

### Network Synchronization Techniques Comparison

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Network Synchronization Techniques                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. State Synchronization                                               │
│     ┌────────┐    Full State    ┌────────┐                             │
│     │ Server │ ────────────▶ │ Client │                                │
│     └────────┘               └────────┘                                │
│     Pros: Simple and intuitive, high state consistency                  │
│     Cons: High bandwidth consumption, not suitable for large scale      │
│                                                                         │
│  2. Lockstep                                                            │
│     ┌────────┐    Input Sync    ┌────────┐                             │
│     │Client A│ ◀────────────▶ │Client B│                               │
│     └────────┘               └────────┘                                │
│     Pros: Extremely low bandwidth, deterministic replay                 │
│     Cons: Latency sensitive, requires deterministic logic               │
│                                                                         │
│  3. Snapshot Interpolation                                              │
│     Server: [S1]──[S2]──[S3]──[S4]                                     │
│     Client:      ↓     ↓                                               │
│             Render S1───S2 (interpolate)                                │
│     Pros: Smooth visual effects, hides network jitter                   │
│     Cons: Adds render delay                                             │
│                                                                         │
│  4. Client-Side Prediction                                              │
│     Client: Input → Predict → Render                                    │
│     Server:      → Validate → Correct                                   │
│     Pros: Instant response, good feel                                   │
│     Cons: Complex implementation, possible rollback                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## P2P Network Architecture

P2P (Peer-to-Peer) architecture still has unique advantages in certain game types, especially fighting games and small-scale competitive games.

### P2P Network Implementation

```typescript
// P2P Network Manager
class P2PNetworkManager {
  private peers: Map<string, RTCPeerConnection>;
  private dataChannels: Map<string, RTCDataChannel>;
  private localInputBuffer: InputFrame[] = [];
  private remoteInputBuffers: Map<string, InputFrame[]>;
  private currentFrame: number = 0;
  private inputDelay: number = 3; // Input delay frames

  constructor() {
    this.peers = new Map();
    this.dataChannels = new Map();
    this.remoteInputBuffers = new Map();
  }

  // Create peer connection
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

    // Create data channel
    const dataChannel = pc.createDataChannel('game', {
      ordered: false, // Allow unordered delivery to reduce latency
      maxRetransmits: 0 // No retransmission to reduce latency
    });

    this.setupDataChannel(peerId, dataChannel);

    // ICE candidate handling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        signalingServer.send({
          type: 'ice-candidate',
          target: peerId,
          candidate: event.candidate
        });
      }
    };

    // Create and send offer
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
      console.log(`Data channel established with ${peerId}`);
      this.dataChannels.set(peerId, channel);
    };

    channel.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handlePeerMessage(peerId, message);
    };

    channel.onclose = () => {
      console.log(`Connection closed with ${peerId}`);
      this.dataChannels.delete(peerId);
    };
  }

  // Send local input
  public sendInput(input: PlayerInput): void {
    const inputFrame: InputFrame = {
      frame: this.currentFrame + this.inputDelay,
      input: input,
      timestamp: Date.now()
    };

    // Local cache
    this.localInputBuffer.push(inputFrame);

    // Broadcast to all peers
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

    // Insert sorted by frame number
    const index = buffer.findIndex(f => f.frame > inputFrame.frame);
    if (index === -1) {
      buffer.push(inputFrame);
    } else {
      buffer.splice(index, 0, inputFrame);
    }
  }

  // Check if can advance to next frame
  public canAdvanceFrame(): boolean {
    // Check if inputs from all remote players have arrived
    for (const [peerId, buffer] of this.remoteInputBuffers) {
      const hasInput = buffer.some(f => f.frame === this.currentFrame);
      if (!hasInput) {
        return false;
      }
    }
    return true;
  }

  // Get all inputs for current frame
  public getFrameInputs(): Map<string, PlayerInput> {
    const inputs = new Map<string, PlayerInput>();

    // Local input
    const localInput = this.localInputBuffer.find(
      f => f.frame === this.currentFrame
    );
    if (localInput) {
      inputs.set('local', localInput.input);
    }

    // Remote inputs
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

    // Clean up old inputs
    this.localInputBuffer = this.localInputBuffer.filter(
      f => f.frame >= this.currentFrame - 10
    );

    for (const buffer of this.remoteInputBuffers.values()) {
      buffer.splice(0, buffer.findIndex(f => f.frame >= this.currentFrame - 10));
    }
  }
}
```

### Lockstep Implementation

```typescript
// Lockstep game loop
class LockstepGame {
  private networkManager: P2PNetworkManager;
  private gameState: DeterministicGameState;
  private frameHistory: GameStateChecksum[] = [];
  private rollbackFrames: number = 0;

  constructor(networkManager: P2PNetworkManager) {
    this.networkManager = networkManager;
    this.gameState = new DeterministicGameState();
  }

  // Deterministic game update
  public update(): void {
    // Wait for all inputs
    if (!this.networkManager.canAdvanceFrame()) {
      // Input delay handling - can choose to wait or use prediction
      this.handleInputDelay();
      return;
    }

    // Get all inputs for current frame
    const inputs = this.networkManager.getFrameInputs();

    // Deterministically update game state
    this.gameState.update(inputs);

    // Save state checksum (for sync verification)
    const checksum = this.gameState.calculateChecksum();
    this.frameHistory.push({
      frame: this.gameState.currentFrame,
      checksum: checksum
    });

    // Verify state synchronization
    this.verifySynchronization();

    // Advance frame
    this.networkManager.advanceFrame();
  }

  private handleInputDelay(): void {
    // Option 1: Wait (strict sync)
    // return;

    // Option 2: Input prediction
    const predictedInputs = this.predictMissingInputs();
    this.gameState.update(predictedInputs);
    this.rollbackFrames++;
  }

  private predictMissingInputs(): Map<string, PlayerInput> {
    const inputs = this.networkManager.getFrameInputs();

    // For missing inputs, use last frame's input as prediction
    // This is particularly common in fighting games
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

  // Rollback and re-simulate
  public rollback(targetFrame: number): void {
    // Restore to target frame state
    const savedState = this.getSavedState(targetFrame);
    if (savedState) {
      this.gameState.loadState(savedState);

      // Re-simulate to current frame
      while (this.gameState.currentFrame < this.networkManager.currentFrame) {
        const inputs = this.getHistoricalInputs(this.gameState.currentFrame);
        this.gameState.update(inputs);
      }
    }
  }

  private verifySynchronization(): void {
    // Periodically exchange checksums with other players
    if (this.gameState.currentFrame % 60 === 0) {
      this.requestSyncCheck();
    }
  }
}

// Deterministic game state
class DeterministicGameState {
  public currentFrame: number = 0;
  private entities: Map<string, Entity>;
  private randomSeed: number;
  private fixedDeltaTime: number = 1 / 60; // Fixed time step

  constructor() {
    this.entities = new Map();
    this.randomSeed = 12345; // Fixed random seed
  }

  // Deterministic random number generation
  public random(): number {
    // Use deterministic pseudo-random number generator
    this.randomSeed = (this.randomSeed * 1103515245 + 12345) & 0x7fffffff;
    return this.randomSeed / 0x7fffffff;
  }

  public update(inputs: Map<string, PlayerInput>): void {
    // 1. Process inputs in fixed order (sorted by player ID)
    const sortedInputs = Array.from(inputs.entries()).sort(
      ([a], [b]) => a.localeCompare(b)
    );

    for (const [playerId, input] of sortedInputs) {
      this.applyInput(playerId, input);
    }

    // 2. Update physics with fixed time step
    this.updatePhysics(this.fixedDeltaTime);

    // 3. Process collisions in fixed order
    this.resolveCollisions();

    this.currentFrame++;
  }

  private updatePhysics(deltaTime: number): void {
    // Use fixed point math or ensure floating point consistency
    for (const entity of this.entities.values()) {
      // Position update
      entity.position.x += entity.velocity.x * deltaTime;
      entity.position.y += entity.velocity.y * deltaTime;

      // Apply gravity (using fixed value)
      entity.velocity.y += 980 * deltaTime; // Fixed gravity value
    }
  }

  public calculateChecksum(): number {
    // Calculate game state checksum
    let checksum = 0;

    for (const [id, entity] of this.entities) {
      checksum ^= this.hashEntity(entity);
    }

    return checksum;
  }

  private hashEntity(entity: Entity): number {
    // Simple hash implementation
    let hash = 0;
    hash ^= Math.floor(entity.position.x * 1000);
    hash ^= Math.floor(entity.position.y * 1000) << 8;
    hash ^= Math.floor(entity.velocity.x * 1000) << 16;
    hash ^= Math.floor(entity.velocity.y * 1000) << 24;
    return hash;
  }
}
```

## Dedicated Server Architecture

Dedicated Server is the preferred solution for large competitive games, providing the best anti-cheat capabilities and performance.

### Dedicated Server Implementation

```typescript
// Dedicated server core
class DedicatedGameServer {
  private gameLoop: GameLoop;
  private connectionManager: ConnectionManager;
  private matchManager: MatchManager;
  private anticheatSystem: AnticheatSystem;

  private config: ServerConfig = {
    tickRate: 128,        // 128tick high-performance server
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
    // Initialize network
    await this.connectionManager.initialize({
      port: 27015,
      maxConnections: this.config.maxPlayers
    });

    // Start game loop
    this.gameLoop.start((deltaTime) => this.tick(deltaTime));

    console.log(`Dedicated server started: ${this.config.region}, mode: ${this.config.mode}`);
  }

  private tick(deltaTime: number): void {
    const tickStart = performance.now();

    // 1. Receive and process client commands
    this.processClientCommands();

    // 2. Run game logic
    this.updateGameState(deltaTime);

    // 3. Anti-cheat detection
    this.anticheatSystem.analyze(this.matchManager.currentMatch);

    // 4. Send state updates
    this.sendStateUpdates();

    // Performance monitoring
    const tickTime = performance.now() - tickStart;
    if (tickTime > 1000 / this.config.tickRate) {
      console.warn(`Tick timeout: ${tickTime.toFixed(2)}ms`);
    }
  }

  private processClientCommands(): void {
    const commands = this.connectionManager.getAndClearCommands();

    for (const command of commands) {
      // Validate command timestamp
      if (!this.validateCommandTiming(command)) {
        continue;
      }

      // Apply command
      this.matchManager.applyCommand(command);
    }
  }

  private validateCommandTiming(command: ClientCommand): boolean {
    const now = Date.now();
    const commandAge = now - command.timestamp;

    // Command too old (possible replay attack)
    if (commandAge > 1000) {
      return false;
    }

    // Command from the future (time cheat)
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

      // Generate customized snapshot for this player
      const snapshot = this.createPlayerSnapshot(match, player);

      // Use delta compression
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
    // Server-side visibility culling
    const visibleEntities = match.entities.filter(entity => {
      // Check if in player's field of view
      if (this.isInFieldOfView(player, entity)) {
        return true;
      }

      // Check if entity made audible sound
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

// High-performance game loop
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

      // Fixed time step update
      while (this.accumulator >= this.tickInterval) {
        tickCallback(this.tickInterval / 1000);
        this.accumulator -= this.tickInterval;
      }

      // Use setImmediate for better performance (Node.js)
      setImmediate(loop);
    };

    loop();
  }

  public stop(): void {
    this.running = false;
  }
}
```

### Anti-Cheat System

```typescript
// Server-side anti-cheat system
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
      // Movement speed detection
      {
        name: 'SPEED_HACK',
        check: (player, stats) => {
          const maxPossibleSpeed = player.baseSpeed * 1.5; // Including buffs
          return stats.maxObservedSpeed > maxPossibleSpeed;
        },
        severity: 'HIGH'
      },

      // Hit rate anomaly detection
      {
        name: 'AIMBOT',
        check: (player, stats) => {
          if (stats.totalShots < 100) return false;
          const headShotRatio = stats.headShots / stats.hits;
          const hitRatio = stats.hits / stats.totalShots;

          // Statistical anomaly detection
          return hitRatio > 0.8 && headShotRatio > 0.7;
        },
        severity: 'HIGH'
      },

      // Reaction time detection
      {
        name: 'INHUMAN_REACTION',
        check: (player, stats) => {
          // Human average reaction time is about 150-300ms
          return stats.averageReactionTime < 80;
        },
        severity: 'MEDIUM'
      },

      // Wallhack detection
      {
        name: 'WALLHACK',
        check: (player, stats) => {
          // Detect if player is tracking invisible enemies
          return stats.trackingInvisibleTargets > 5;
        },
        severity: 'HIGH'
      },

      // Packet rate detection
      {
        name: 'PACKET_MANIPULATION',
        check: (player, stats) => {
          const expectedRate = 128; // Server tick rate
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

    // Update movement statistics
    const currentSpeed = Math.sqrt(
      player.velocity.x ** 2 + player.velocity.y ** 2
    );
    stats.maxObservedSpeed = Math.max(stats.maxObservedSpeed, currentSpeed);

    // Update shooting statistics
    if (player.lastShotResult) {
      stats.totalShots++;
      if (player.lastShotResult.hit) {
        stats.hits++;
        if (player.lastShotResult.headshot) {
          stats.headShots++;
        }
      }
    }

    // Calculate reaction time
    if (player.lastEngagement) {
      const reactionTime = player.lastEngagement.shotTime -
                           player.lastEngagement.targetVisibleTime;
      stats.reactionTimes.push(reactionTime);
      stats.averageReactionTime = this.calculateAverage(stats.reactionTimes);
    }

    // Wallhack detection data
    this.checkWallhackBehavior(player, match, stats);
  }

  private checkWallhackBehavior(
    player: Player,
    match: Match,
    stats: PlayerStatistics
  ): void {
    // Check if player's view is tracking invisible enemies
    const enemies = match.players.filter(p => p.team !== player.team);

    for (const enemy of enemies) {
      // Check if enemy is in line of sight
      const isVisible = this.isPlayerVisible(player, enemy, match);

      if (!isVisible) {
        // Check if player is "tracking" invisible enemy
        const aimDirection = this.normalizeVector(player.aimDirection);
        const toEnemy = this.normalizeVector({
          x: enemy.position.x - player.position.x,
          y: enemy.position.y - player.position.y
        });

        const dotProduct = aimDirection.x * toEnemy.x +
                          aimDirection.y * toEnemy.y;

        // If continuously aiming at invisible enemy
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

    console.log(`[Anti-cheat] Player ${playerId} flagged: ${reason} (${severity})`);

    // High severity flags processed immediately
    if (severity === 'HIGH') {
      const highSeverityCount = flags.filter(f => f.severity === 'HIGH').length;
      if (highSeverityCount >= 3) {
        this.takeAction(playerId, 'BAN');
      }
    }
  }

  private takeAction(playerId: string, action: 'WARN' | 'KICK' | 'BAN'): void {
    console.log(`[Anti-cheat] Taking action on player ${playerId}: ${action}`);
    // Actual implementation would call appropriate handler functions
  }
}
```

## Network Protocol Selection

### TCP vs UDP Comparison

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TCP vs UDP Comparison                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   TCP (Transmission Control Protocol)   UDP (User Datagram Protocol)   │
│   ┌─────────────────────┐              ┌─────────────────────┐          │
│   │ Reliable delivery   │              │ Unreliable delivery │          │
│   │ Ordered arrival     │              │ May be out-of-order │          │
│   │ Flow control        │              │ No flow control     │          │
│   │ Congestion control  │              │ No congestion ctrl  │          │
│   │ Connection-oriented │              │ Connectionless      │          │
│   └─────────────────────┘              └─────────────────────┘          │
│                                                                         │
│   Use cases:                           Use cases:                       │
│   - Login authentication               - Real-time position updates    │
│   - Chat messages                      - Shooting data                  │
│   - Item transactions                  - Voice chat                     │
│   - Important events                   - Video streaming                │
│                                                                         │
│   Latency: Higher (needs ACK)          Latency: Lowest                  │
│   Bandwidth: Higher (protocol overhead) Bandwidth: Lower                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Reliable UDP Implementation

```typescript
// Reliable UDP protocol layer
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

  // Send reliable packet
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

  // Send unreliable packet
  public sendUnreliable(data: Buffer, address: string, port: number): void {
    const packet = this.createPacket(data, PacketType.UNRELIABLE);
    this.sendPacket(packet, address, port);
  }

  // Send sequenced unreliable packet (for ordering)
  public sendSequenced(data: Buffer, address: string, port: number): void {
    const packet = this.createPacket(data, PacketType.SEQUENCED);
    this.sendPacket(packet, address, port);
  }

  private createPacket(data: Buffer, type: PacketType): Packet {
    const sequence = this.sequenceNumber++;

    // Packet header format:
    // [Type:1byte][Sequence:4bytes][ACK bitmap:4bytes][Data:Nbytes]
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
    // Create ACK bitmap for recently received packets
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

    // Process ACKs
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
    // Check if already received
    if (this.receivedSequences.has(sequence)) {
      // Duplicate packet, just send ACK
      this.ackBuffer.push(sequence);
      return;
    }

    this.receivedSequences.add(sequence);
    this.ackBuffer.push(sequence);

    // Process data
    this.emit('message', payload, rinfo);
  }

  private processAcks(ackBitmap: number): void {
    // Confirm sent packets based on ACK bitmap
    for (const [sequence, pending] of this.pendingPackets) {
      if (ackBitmap & (1 << (sequence % 32))) {
        this.pendingPackets.delete(sequence);
      }
    }
  }

  // Retransmission check loop
  private startRetransmitLoop(): void {
    setInterval(() => {
      const now = Date.now();

      for (const [sequence, pending] of this.pendingPackets) {
        if (now - pending.sentTime > this.config.retryTimeout) {
          if (pending.retries >= this.config.maxRetries) {
            // Exceeded max retries
            this.pendingPackets.delete(sequence);
            this.emit('timeout', sequence);
          } else {
            // Retransmit
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
      // Send aggregated ACKs
      if (this.ackBuffer.length > 0) {
        // ACKs will be piggybacked on next sent packet
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

### Hybrid Protocol Strategy

```typescript
// Network channel manager - mixed use of TCP and UDP
class NetworkChannelManager {
  private tcpConnection: net.Socket;
  private udpSocket: dgram.Socket;
  private reliableUdp: ReliableUDP;

  // Channel configuration for different data types
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
      throw new Error(`Unknown channel: ${channelName}`);
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
    // Add length prefix
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(data.length);
    this.tcpConnection.write(Buffer.concat([lengthBuffer, data]));
  }

  private sendUdp(data: Buffer): void {
    this.udpSocket.send(data, this.udpPort, this.serverAddress);
  }
}

// Game message router
class GameMessageRouter {
  private channelManager: NetworkChannelManager;

  // Automatically select channel based on message type
  public sendMessage(message: GameMessage): void {
    const channel = this.getChannelForMessage(message);
    this.channelManager.send(channel, message);
  }

  private getChannelForMessage(message: GameMessage): string {
    switch (message.type) {
      // Critical messages - TCP
      case 'login':
      case 'logout':
      case 'purchase':
      case 'match_result':
        return 'critical';

      // State updates - UDP
      case 'position_update':
      case 'rotation_update':
      case 'animation_state':
        return 'state_update';

      // Player inputs - Reliable UDP
      case 'player_input':
      case 'ability_cast':
      case 'weapon_fire':
        return 'player_input';

      // Voice - UDP
      case 'voice_data':
        return 'voice';

      // Chat - TCP
      case 'chat_message':
        return 'chat';

      default:
        return 'state_update';
    }
  }
}
```

## Network Topology Design

### Regional Server Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Global Server Topology                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                        ┌─────────────────┐                              │
│                        │  Global Services │                              │
│                        │ (Account/Match) │                              │
│                        └────────┬────────┘                              │
│                                 │                                       │
│         ┌───────────────────────┼───────────────────────┐               │
│         │                       │                       │               │
│         ▼                       ▼                       ▼               │
│  ┌──────────────┐       ┌──────────────┐       ┌──────────────┐        │
│  │ Asia-Pacific │       │    Europe    │       │   Americas   │        │
│  │   Gateway    │       │   Gateway    │       │   Gateway    │        │
│  └──────┬───────┘       └──────┬───────┘       └──────┬───────┘        │
│         │                      │                      │                │
│    ┌────┴────┐            ┌────┴────┐            ┌────┴────┐           │
│    │         │            │         │            │         │           │
│    ▼         ▼            ▼         ▼            ▼         ▼           │
│ ┌─────┐  ┌─────┐      ┌─────┐  ┌─────┐      ┌─────┐  ┌─────┐          │
│ │Tokyo│  │Sing-│      │Frank-│ │London│     │Virgin-│ │Oregon│         │
│ │Game │  │apore│      │ furt │ │Game │      │  ia  │ │ Game │         │
│ │     │  │Game │      │Game │  │     │      │ Game │ │      │         │
│ └─────┘  └─────┘      └─────┘  └─────┘      └─────┘  └─────┘          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

```typescript
// Regional gateway server
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

  // Handle player connection
  public async handlePlayerConnect(
    playerId: string,
    socket: WebSocket
  ): Promise<void> {
    // Authenticate player
    const playerData = await this.authenticatePlayer(playerId);

    // Create connection
    const connection = new PlayerConnection(playerId, socket, playerData);
    this.playerConnections.set(playerId, connection);

    // Send server list
    connection.send({
      type: 'server_list',
      servers: this.getAvailableServers()
    });
  }

  // Assign game server
  public async assignGameServer(
    playerId: string,
    matchId: string
  ): Promise<GameServerInfo> {
    const connection = this.playerConnections.get(playerId);
    if (!connection) {
      throw new Error('Player not connected');
    }

    // Select optimal server
    const server = this.loadBalancer.selectServer(
      this.gameServers,
      connection.latencies
    );

    return server;
  }

  // Cross-region player routing
  public async routeToRegion(
    playerId: string,
    targetRegion: string
  ): Promise<void> {
    const connection = this.playerConnections.get(playerId);
    if (!connection) return;

    // Get target region gateway address
    const targetGateway = await this.getRegionGateway(targetRegion);

    // Send redirect
    connection.send({
      type: 'redirect',
      gateway: targetGateway.address,
      token: await this.generateTransferToken(playerId)
    });
  }
}

// Load balancer
class LoadBalancer {
  // Select optimal server
  public selectServer(
    servers: Map<string, GameServerInfo>,
    playerLatencies: Map<string, number>
  ): GameServerInfo {
    let bestServer: GameServerInfo | null = null;
    let bestScore = Infinity;

    for (const [serverId, server] of servers) {
      // Calculate composite score
      const score = this.calculateServerScore(server, playerLatencies);

      if (score < bestScore) {
        bestScore = score;
        bestServer = server;
      }
    }

    if (!bestServer) {
      throw new Error('No available servers');
    }

    return bestServer;
  }

  private calculateServerScore(
    server: GameServerInfo,
    playerLatencies: Map<string, number>
  ): number {
    // Latency weight
    const latency = playerLatencies.get(server.id) || 100;
    const latencyScore = latency * 2;

    // Load weight
    const loadRatio = server.currentPlayers / server.maxPlayers;
    const loadScore = loadRatio * 100;

    // Performance weight
    const performanceScore = (1 - server.cpuUsage) * 50;

    return latencyScore + loadScore - performanceScore;
  }
}
```

## Room and Lobby System

### Room Management

```typescript
// Room management system
class RoomManager {
  private rooms: Map<string, GameRoom>;
  private playerRooms: Map<string, string>; // playerId -> roomId
  private config: RoomConfig;

  constructor(config: RoomConfig) {
    this.rooms = new Map();
    this.playerRooms = new Map();
    this.config = config;
  }

  // Create room
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

    // Creator automatically joins the room
    this.joinRoom(options.hostId, roomId, options.password);

    return room;
  }

  // Join room
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

    // Check if player is already in another room
    const currentRoomId = this.playerRooms.get(playerId);
    if (currentRoomId) {
      await this.leaveRoom(playerId);
    }

    // Join room
    room.addPlayer(playerId);
    this.playerRooms.set(playerId, roomId);

    // Broadcast to other players in room
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

  // Leave room
  public async leaveRoom(playerId: string): Promise<void> {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    room.removePlayer(playerId);
    this.playerRooms.delete(playerId);

    // If host leaves, transfer host or close room
    if (room.host === playerId) {
      if (room.players.length > 0) {
        room.transferHost(room.players[0]);
        room.broadcast({
          type: 'host_changed',
          newHost: room.host
        });
      } else {
        // Room is empty, delete room
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

  // Get room list
  public getRoomList(filter?: RoomFilter): RoomListItem[] {
    const rooms: RoomListItem[] = [];

    for (const room of this.rooms.values()) {
      if (room.isPrivate) continue;
      if (filter?.gameMode && room.gameMode !== filter.gameMode) continue;
      if (filter?.hasSpace && room.isFull()) continue;

      rooms.push(room.getPublicInfo());
    }

    // Sort: by player count descending
    rooms.sort((a, b) => b.playerCount - a.playerCount);

    return rooms;
  }

  // Quick join
  public async quickJoin(
    playerId: string,
    preferences: QuickJoinPreferences
  ): Promise<JoinResult> {
    // Find matching rooms
    const availableRooms = this.findMatchingRooms(preferences);

    if (availableRooms.length === 0) {
      // No suitable room, create new room
      const room = this.createRoom({
        name: `Quick Game ${Date.now()}`,
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

    // Select optimal room (closest to full)
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

// Game room
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

      // Auto-assign team
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

      // Check if everyone is ready
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

      // Start game after 5 seconds
      setTimeout(() => this.startGame(), 5000);
    }
  }

  private autoAssignTeam(playerId: string): void {
    // Simple team balance assignment
    const team1Count = [...this.teamAssignments.values()].filter(t => t === 1).length;
    const team2Count = [...this.teamAssignments.values()].filter(t => t === 2).length;

    const team = team1Count <= team2Count ? 1 : 2;
    this.teamAssignments.set(playerId, team);
  }

  public async startGame(): Promise<void> {
    this.isStarted = true;

    // Request game server
    const gameServer = await this.requestGameServer();

    // Send connection info
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

## Matchmaking System

### ELO Matching Algorithm

```typescript
// Matchmaking system
class MatchmakingSystem {
  private queue: Map<string, QueueEntry>;
  private matchmaker: Matchmaker;
  private config: MatchmakingConfig;

  constructor(config: MatchmakingConfig) {
    this.queue = new Map();
    this.config = config;
    this.matchmaker = new Matchmaker(config);

    // Process matching periodically
    setInterval(() => this.processQueue(), 1000);
  }

  // Join matchmaking queue
  public joinQueue(playerId: string, options: QueueOptions): QueueResult {
    // Check if already in queue
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

  // Leave queue
  public leaveQueue(playerId: string): void {
    this.queue.delete(playerId);
  }

  // Process matchmaking queue
  private processQueue(): void {
    const entries = Array.from(this.queue.values());

    // Sort by wait time, prioritize players waiting longer
    entries.sort((a, b) => a.joinTime - b.joinTime);

    const matched: Set<string> = new Set();

    for (const entry of entries) {
      if (matched.has(entry.playerId)) continue;

      // Expand search range
      this.expandSearchRange(entry);

      // Find match
      const match = this.matchmaker.findMatch(entry, entries, matched);

      if (match) {
        // Create match
        this.createMatch(match);

        // Mark as matched
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

    // Expand search range per second
    entry.searchRange = this.config.initialSearchRange +
                        (waitTime / 1000) * expansionRate;

    // Maximum search range limit
    entry.searchRange = Math.min(
      entry.searchRange,
      this.config.maxSearchRange
    );
  }

  private estimateWaitTime(entry: QueueEntry): number {
    // Estimate wait time based on historical data
    const sameRatingCount = Array.from(this.queue.values()).filter(
      e => Math.abs(e.rating - entry.rating) < this.config.initialSearchRange
    ).length;

    // Simplified estimation
    if (sameRatingCount >= this.config.playersPerMatch - 1) {
      return 10; // 10 seconds
    }

    return 30 + (1000 - Math.min(sameRatingCount * 100, 900));
  }

  private createMatch(match: MatchResult): void {
    // Notify all players
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

// Matchmaker
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

    // Find eligible candidates
    for (const candidate of allEntries) {
      if (excluded.has(candidate.playerId)) continue;
      if (candidate.playerId === entry.playerId) continue;
      if (candidate.gameMode !== entry.gameMode) continue;
      if (candidate.region !== entry.region) continue;

      // Check rating difference
      const ratingDiff = Math.abs(candidate.rating - entry.rating);
      const maxDiff = Math.max(entry.searchRange, candidate.searchRange);

      if (ratingDiff <= maxDiff) {
        candidates.push(candidate);
      }
    }

    // Need enough candidates
    const neededPlayers = this.config.playersPerMatch - 1 - entry.partyMembers.length;
    if (candidates.length < neededPlayers) {
      return null;
    }

    // Select best combination
    const selectedPlayers = this.selectBestCombination(entry, candidates, neededPlayers);

    if (selectedPlayers.length < neededPlayers) {
      return null;
    }

    // Create match result
    return this.createMatchResult(entry, selectedPlayers);
  }

  private selectBestCombination(
    entry: QueueEntry,
    candidates: QueueEntry[],
    count: number
  ): QueueEntry[] {
    // Sort by rating proximity
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

    // Assign teams (try to balance ratings)
    const teams = this.assignTeams(allPlayers);

    // Calculate average rating
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
    // Sort by rating
    const sorted = [...players].sort((a, b) => b.rating - a.rating);

    const team1: MatchPlayer[] = [];
    const team2: MatchPlayer[] = [];
    let team1Rating = 0;
    let team2Rating = 0;

    // Greedy assignment to maintain team rating balance
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

// ELO rating system
class EloRatingSystem {
  private kFactor: number;

  constructor(kFactor: number = 32) {
    this.kFactor = kFactor;
  }

  // Calculate expected win probability
  public expectedScore(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  }

  // Update rating
  public updateRating(
    playerRating: number,
    opponentRating: number,
    actualScore: number // 1 = win, 0.5 = draw, 0 = loss
  ): number {
    const expected = this.expectedScore(playerRating, opponentRating);
    const newRating = playerRating + this.kFactor * (actualScore - expected);
    return Math.round(newRating);
  }

  // Batch update (team matches)
  public updateTeamRatings(
    team1: PlayerRating[],
    team2: PlayerRating[],
    winner: 1 | 2 | 0 // 0 = draw
  ): Map<string, number> {
    const updates = new Map<string, number>();

    // Calculate team average ratings
    const team1Avg = team1.reduce((sum, p) => sum + p.rating, 0) / team1.length;
    const team2Avg = team2.reduce((sum, p) => sum + p.rating, 0) / team2.length;

    // Update Team 1
    const team1Score = winner === 1 ? 1 : winner === 0 ? 0.5 : 0;
    for (const player of team1) {
      const newRating = this.updateRating(player.rating, team2Avg, team1Score);
      updates.set(player.id, newRating);
    }

    // Update Team 2
    const team2Score = winner === 2 ? 1 : winner === 0 ? 0.5 : 0;
    for (const player of team2) {
      const newRating = this.updateRating(player.rating, team1Avg, team2Score);
      updates.set(player.id, newRating);
    }

    return updates;
  }
}
```

## Bandwidth Optimization

### Data Compression and Delta Synchronization

```typescript
// Snapshot compression system
class SnapshotCompressor {
  private previousSnapshots: Map<string, Snapshot>;
  private compressionLevel: number;

  constructor(compressionLevel: number = 6) {
    this.previousSnapshots = new Map();
    this.compressionLevel = compressionLevel;
  }

  // Create delta snapshot
  public createDeltaSnapshot(
    clientId: string,
    currentSnapshot: Snapshot
  ): DeltaSnapshot {
    const previous = this.previousSnapshots.get(clientId);

    if (!previous) {
      // No baseline, send full snapshot
      this.previousSnapshots.set(clientId, currentSnapshot);
      return {
        type: 'full',
        tick: currentSnapshot.tick,
        data: this.compressSnapshot(currentSnapshot)
      };
    }

    // Calculate delta
    const delta = this.calculateDelta(previous, currentSnapshot);

    // Update baseline
    this.previousSnapshots.set(clientId, currentSnapshot);

    // If delta is too large, sending full snapshot is more efficient
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

    // Find added and modified entities
    for (const [id, entity] of currentEntities) {
      const prevEntity = previousEntities.get(id);

      if (!prevEntity) {
        delta.added.push(entity);
      } else if (!this.entitiesEqual(prevEntity, entity)) {
        // Only send changed fields
        delta.modified.push({
          id,
          changes: this.getChangedFields(prevEntity, entity)
        });
      }
    }

    // Find removed entities
    for (const id of previousEntities.keys()) {
      if (!currentEntities.has(id)) {
        delta.removed.push(id);
      }
    }

    return delta;
  }

  private getChangedFields(prev: Entity, curr: Entity): Partial<Entity> {
    const changes: Partial<Entity> = {};

    // Position change
    if (prev.position.x !== curr.position.x ||
        prev.position.y !== curr.position.y) {
      changes.position = curr.position;
    }

    // Velocity change
    if (prev.velocity.x !== curr.velocity.x ||
        prev.velocity.y !== curr.velocity.y) {
      changes.velocity = curr.velocity;
    }

    // Health change
    if (prev.health !== curr.health) {
      changes.health = curr.health;
    }

    // State change
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

// Quantization compression
class QuantizationCompressor {
  // Position quantization (compress floats to integers)
  public quantizePosition(position: Vector3, bounds: Bounds): QuantizedPosition {
    // Normalize position to 0-65535 range
    return {
      x: Math.round(((position.x - bounds.minX) / (bounds.maxX - bounds.minX)) * 65535),
      y: Math.round(((position.y - bounds.minY) / (bounds.maxY - bounds.minY)) * 65535),
      z: Math.round(((position.z - bounds.minZ) / (bounds.maxZ - bounds.minZ)) * 65535)
    };
  }

  // Dequantize
  public dequantizePosition(quantized: QuantizedPosition, bounds: Bounds): Vector3 {
    return {
      x: bounds.minX + (quantized.x / 65535) * (bounds.maxX - bounds.minX),
      y: bounds.minY + (quantized.y / 65535) * (bounds.maxY - bounds.minY),
      z: bounds.minZ + (quantized.z / 65535) * (bounds.maxZ - bounds.minZ)
    };
  }

  // Rotation quantization (using smallest quaternion representation)
  public quantizeRotation(rotation: Quaternion): QuantizedRotation {
    // Find the largest component
    const components = [rotation.x, rotation.y, rotation.z, rotation.w];
    let maxIndex = 0;
    let maxValue = Math.abs(components[0]);

    for (let i = 1; i < 4; i++) {
      if (Math.abs(components[i]) > maxValue) {
        maxValue = Math.abs(components[i]);
        maxIndex = i;
      }
    }

    // Ensure largest component is positive (can be derived from other three)
    const sign = components[maxIndex] >= 0 ? 1 : -1;

    // Quantize the other three components
    const quantized: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (i !== maxIndex) {
        // Quantize to 10 bits (-1 to 1 mapped to 0-1023)
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

  // Velocity quantization
  public quantizeVelocity(velocity: Vector3, maxSpeed: number): QuantizedVelocity {
    // Assuming velocity range is -maxSpeed to maxSpeed
    return {
      x: Math.round(((velocity.x / maxSpeed + 1) / 2) * 255),
      y: Math.round(((velocity.y / maxSpeed + 1) / 2) * 255),
      z: Math.round(((velocity.z / maxSpeed + 1) / 2) * 255)
    };
  }

  // Pack entity state into compact binary format
  public packEntity(entity: Entity, bounds: Bounds): Buffer {
    const buffer = Buffer.alloc(20); // Fixed size
    let offset = 0;

    // Entity ID (2 bytes)
    buffer.writeUInt16LE(entity.numericId, offset);
    offset += 2;

    // Position (6 bytes - 2 bytes per axis)
    const pos = this.quantizePosition(entity.position, bounds);
    buffer.writeUInt16LE(pos.x, offset);
    buffer.writeUInt16LE(pos.y, offset + 2);
    buffer.writeUInt16LE(pos.z, offset + 4);
    offset += 6;

    // Rotation (4 bytes)
    const rot = this.quantizeRotation(entity.rotation);
    buffer.writeUInt8((rot.maxIndex << 6) | (rot.a >> 4), offset);
    buffer.writeUInt8(((rot.a & 0x0F) << 4) | (rot.b >> 6), offset + 1);
    buffer.writeUInt8(((rot.b & 0x3F) << 2) | (rot.c >> 8), offset + 2);
    buffer.writeUInt8(rot.c & 0xFF, offset + 3);
    offset += 4;

    // Velocity (3 bytes)
    const vel = this.quantizeVelocity(entity.velocity, 100);
    buffer.writeUInt8(vel.x, offset);
    buffer.writeUInt8(vel.y, offset + 1);
    buffer.writeUInt8(vel.z, offset + 2);
    offset += 3;

    // State flags (1 byte)
    let flags = 0;
    if (entity.isGrounded) flags |= 0x01;
    if (entity.isCrouching) flags |= 0x02;
    if (entity.isShooting) flags |= 0x04;
    if (entity.isReloading) flags |= 0x08;
    buffer.writeUInt8(flags, offset);
    offset += 1;

    // Health (1 byte, 0-255)
    buffer.writeUInt8(Math.round(entity.health * 2.55), offset);
    offset += 1;

    // Weapon ID (1 byte)
    buffer.writeUInt8(entity.weaponId, offset);
    offset += 1;

    // Ammo (1 byte)
    buffer.writeUInt8(entity.ammo, offset);

    return buffer;
  }
}
```

## Lag Compensation

### Server-Side Lag Compensation

```typescript
// Lag compensation system
class LagCompensation {
  private worldHistory: WorldSnapshot[] = [];
  private maxHistoryLength: number = 128; // Save about 1 second of history
  private tickRate: number = 128;

  // Save world state history
  public saveWorldState(world: World): void {
    const snapshot: WorldSnapshot = {
      tick: world.currentTick,
      timestamp: Date.now(),
      entities: new Map()
    };

    // Save all entity positions
    for (const entity of world.entities.values()) {
      snapshot.entities.set(entity.id, {
        position: { ...entity.position },
        rotation: { ...entity.rotation },
        hitbox: entity.hitbox.clone()
      });
    }

    this.worldHistory.push(snapshot);

    // Limit history length
    while (this.worldHistory.length > this.maxHistoryLength) {
      this.worldHistory.shift();
    }
  }

  // Process shot with lag compensation
  public processShot(
    shooter: Player,
    shotData: ShotData,
    world: World
  ): HitResult {
    // Calculate server time when shot occurred
    const clientLatency = shooter.connection.latency;
    const interpolationDelay = 100; // Client interpolation delay
    const totalDelay = clientLatency / 2 + interpolationDelay;

    // Rewind to world state when shot happened
    const targetTick = shotData.clientTick;
    const pastSnapshot = this.findSnapshot(targetTick);

    if (!pastSnapshot) {
      // Not enough history, use current state
      return this.performRaycast(shotData, world);
    }

    // Perform raycast in historical state
    return this.performRaycastInPast(shotData, pastSnapshot, world);
  }

  private findSnapshot(targetTick: number): WorldSnapshot | null {
    // Binary search for closest snapshot
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

    // No exact match found, return closest
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

    // Raycast against all entities
    for (const [entityId, historicalState] of snapshot.entities) {
      // Skip shooter
      if (entityId === shotData.shooterId) continue;

      // Get current entity reference (for damage calculation)
      const currentEntity = currentWorld.entities.get(entityId);
      if (!currentEntity) continue;

      // Use historical position's hitbox
      const hitbox = historicalState.hitbox.clone();
      hitbox.setPosition(historicalState.position);

      // Raycast
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
    // AABB ray intersection algorithm
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
    // Determine body part based on hit position
    const relativeY = hitPosition.y - hitbox.position.y;
    const height = hitbox.height;

    if (relativeY > height * 0.85) return 'head';
    if (relativeY > height * 0.5) return 'torso';
    if (relativeY > height * 0.25) return 'legs';
    return 'feet';
  }
}

// Client prediction rollback
class ClientPrediction {
  private stateHistory: PredictedState[] = [];
  private maxHistoryLength: number = 64;

  // Save predicted state
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

  // Server reconciliation
  public reconcile(
    serverState: PlayerState,
    lastProcessedInput: number,
    player: LocalPlayer,
    pendingInputs: PlayerInput[]
  ): void {
    // Find the state confirmed by server
    const confirmedIndex = this.stateHistory.findIndex(
      s => s.inputSequence === lastProcessedInput
    );

    if (confirmedIndex === -1) {
      // State too old, directly apply server state
      player.setState(serverState);
      return;
    }

    // Compare predicted state with server state
    const predictedState = this.stateHistory[confirmedIndex].state;
    const error = this.calculateError(predictedState, serverState);

    if (error > 0.1) { // Error threshold
      console.log(`Prediction error: ${error.toFixed(3)}, executing rollback`);

      // Rollback to server state
      player.setState(serverState);

      // Clear confirmed history
      this.stateHistory.splice(0, confirmedIndex + 1);

      // Re-apply unconfirmed inputs
      for (const input of pendingInputs) {
        player.applyInput(input);
        this.savePredictedState(player.getState(), input.sequence);
      }
    } else {
      // Prediction accurate, just clean up history
      this.stateHistory.splice(0, confirmedIndex + 1);
    }
  }

  private calculateError(predicted: PlayerState, actual: PlayerState): number {
    // Calculate position error
    const dx = predicted.position.x - actual.position.x;
    const dy = predicted.position.y - actual.position.y;
    const dz = predicted.position.z - actual.position.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
```

## Performance Monitoring and Debugging

```typescript
// Network performance monitoring
class NetworkMonitor {
  private metrics: NetworkMetrics;
  private sampleWindow: number = 60; // 60 second sample window
  private samples: MetricSample[] = [];

  constructor() {
    this.metrics = this.createInitialMetrics();
  }

  // Record round-trip time
  public recordRTT(rtt: number): void {
    this.metrics.currentRTT = rtt;
    this.metrics.rttSamples.push(rtt);

    // Maintain sample count
    if (this.metrics.rttSamples.length > 100) {
      this.metrics.rttSamples.shift();
    }

    // Calculate statistics
    this.updateRTTStats();
  }

  // Record packet
  public recordPacket(type: 'sent' | 'received', size: number): void {
    const now = Date.now();

    if (type === 'sent') {
      this.metrics.packetsSent++;
      this.metrics.bytesSent += size;
    } else {
      this.metrics.packetsReceived++;
      this.metrics.bytesReceived += size;
    }

    // Record sample
    this.samples.push({
      timestamp: now,
      type,
      size
    });

    // Clean old samples
    const cutoff = now - this.sampleWindow * 1000;
    this.samples = this.samples.filter(s => s.timestamp > cutoff);
  }

  // Record packet loss
  public recordPacketLoss(): void {
    this.metrics.packetsLost++;
    this.updatePacketLossRate();
  }

  // Record jitter
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

    // Calculate standard deviation
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

  // Calculate bandwidth
  public getBandwidth(): BandwidthStats {
    const now = Date.now();
    const windowStart = now - 1000; // Last 1 second

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

  // Get network quality score
  public getNetworkQuality(): NetworkQuality {
    const rtt = this.metrics.averageRTT;
    const jitter = this.metrics.averageJitter;
    const packetLoss = this.metrics.packetLossRate;

    // Calculate composite score (0-100)
    let score = 100;

    // RTT score
    if (rtt > 150) score -= 30;
    else if (rtt > 100) score -= 20;
    else if (rtt > 50) score -= 10;

    // Jitter score
    if (jitter > 50) score -= 20;
    else if (jitter > 30) score -= 10;
    else if (jitter > 10) score -= 5;

    // Packet loss score
    if (packetLoss > 0.05) score -= 30;
    else if (packetLoss > 0.02) score -= 20;
    else if (packetLoss > 0.01) score -= 10;

    // Determine quality level
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

  // Export diagnostic report
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

// Network debugging tool
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

  // Simulate network conditions
  public simulateNetworkConditions(conditions: NetworkConditions): void {
    console.log(`Simulating network conditions: latency=${conditions.latency}ms, ` +
                `jitter=${conditions.jitter}ms, packet loss=${conditions.packetLoss * 100}%`);

    // This would apply to actual network layer
  }

  // Preset network conditions
  public static presets = {
    excellent: { latency: 20, jitter: 5, packetLoss: 0 },
    good: { latency: 50, jitter: 10, packetLoss: 0.01 },
    fair: { latency: 100, jitter: 30, packetLoss: 0.02 },
    poor: { latency: 200, jitter: 50, packetLoss: 0.05 },
    terrible: { latency: 500, jitter: 100, packetLoss: 0.1 }
  };

  private startDebugOverlay(): void {
    // Display network stats on game interface
    setInterval(() => {
      if (!this.enabled) return;

      const report = this.monitor.generateReport();
      this.renderOverlay(report);
    }, 100);
  }

  private renderOverlay(report: NetworkDiagnosticReport): void {
    // Actual implementation would render to game screen
    console.log(`
    ========== Network Status ==========
    Latency: ${report.latency.current}ms (avg: ${report.latency.average.toFixed(1)}ms)
    Jitter: ${report.jitter.current.toFixed(1)}ms
    Packet Loss: ${(report.packetLoss.rate * 100).toFixed(2)}%
    Bandwidth: ↑${report.bandwidth.upload.toFixed(1)}KB/s ↓${report.bandwidth.download.toFixed(1)}KB/s
    Quality: ${report.quality.quality} (${report.quality.score}/100)
    ====================================
    `);
  }
}
```

## Interview Key Points

### Common Interview Questions

```typescript
/**
 * 1. What are client prediction and server reconciliation? Why do we need them?
 *
 * Key points:
 * - Client prediction: Client applies player input immediately without waiting for server confirmation
 * - Server reconciliation: Correct prediction errors when server state returns
 * - Why needed: Hide network latency, provide instant-response gameplay experience
 * - Implementation: Save input history, replay after rolling back to server state
 */

/**
 * 2. What's the difference between lockstep and state synchronization? Use cases?
 *
 * Key points:
 * - Lockstep: Synchronize player inputs, calculate game state locally
 *   Pros: Low bandwidth, supports replay, deterministic
 *   Cons: Requires deterministic engine, latency sensitive
 *   Use cases: RTS, fighting games
 *
 * - State synchronization: Synchronize game state
 *   Pros: Simple implementation, good fault tolerance
 *   Cons: High bandwidth
 *   Use cases: FPS, MMORPG
 */

/**
 * 3. How to handle network lag compensation?
 *
 * Key points:
 * - Server saves world state history
 * - Rewind to player's view time point when shooting
 * - Perform collision detection in historical state
 * - Balance experience between high and low latency players
 */

/**
 * 4. How to choose between TCP and UDP in games?
 *
 * Key points:
 * - UDP: Real-time data (position, input) - prioritize low latency
 * - TCP: Important data (login, transactions) - prioritize reliability
 * - Reliable UDP: In between, custom retransmission strategy
 * - Hybrid approach: Choose protocol based on data type
 */

/**
 * 5. How to design an anti-cheat system?
 *
 * Key points:
 * - Server authority: All game logic executes on server
 * - Input validation: Check if inputs are legal (speed, cooldowns, etc.)
 * - Statistical detection: Analyze abnormal behavior patterns (hit rate, reaction time)
 * - View culling: Don't send information player can't see
 * - Encrypted communication: Prevent packet tampering
 */

/**
 * 6. How to design a matchmaking system?
 *
 * Key points:
 * - ELO/MMR rating system
 * - Queue management and search range expansion
 * - Team balance (minimize rating difference)
 * - Region priority (latency optimization)
 * - Trade-off between wait time and match quality
 */
```

### Architecture Design Questions

```typescript
/**
 * Design a network architecture for a 100-player battle royale game
 *
 * Solution approach:
 */

class BattleRoyaleArchitecture {
  /**
   * 1. Overall Architecture
   *
   * Lobby Server Cluster
   *     ↓
   * Matchmaking Service
   *     ↓
   * Game Server (one instance per match)
   *     ↓
   * Database Cluster (player data, stats)
   */

  /**
   * 2. Key Technical Choices
   *
   * - Protocol: UDP (position sync) + TCP (important events)
   * - Synchronization: State sync + Area of Interest management
   * - Update rate: 20-30Hz (balance bandwidth and smoothness)
   * - Server: Dedicated server (anti-cheat)
   */

  /**
   * 3. Optimization Strategies
   *
   * - Spatial partitioning: Divide map regions, only sync nearby players
   * - Priority system: High frequency updates for nearby players, low frequency for distant
   * - Delta compression: Only send changed data
   * - Prediction compensation: Client prediction + lag compensation
   */

  /**
   * 4. Bandwidth Estimation
   *
   * Per player state: ~50 bytes
   * 100 players × 50 bytes × 20Hz = 100KB/s downstream
   * With area of interest: ~20-30KB/s
   */

  /**
   * 5. Scalability
   *
   * - Stateless lobby servers, horizontally scalable
   * - Game servers started on demand
   * - Matchmaking service decoupled with message queue
   * - Database read-write separation
   */
}
```

## Summary

Game networking architecture design is a complex field requiring trade-offs across multiple dimensions:

1. **Architecture selection**: Choose client-server, P2P, or dedicated server based on game type
2. **Synchronization mechanism**: State sync for FPS/MMO, lockstep for RTS/fighting games
3. **Protocol selection**: UDP for real-time data, TCP for reliable data, hybrid approach is optimal
4. **Latency handling**: Client prediction, server reconciliation, and lag compensation are all essential
5. **Anti-cheat**: Server authority, input validation, statistical detection - multi-pronged approach
6. **Bandwidth optimization**: Delta sync, quantization compression, area of interest management
7. **Matchmaking system**: ELO rating, team balance, wait time optimization

Mastering this knowledge enables you to design low-latency, highly reliable, and scalable game networking architectures, providing players with smooth multiplayer gaming experiences.
