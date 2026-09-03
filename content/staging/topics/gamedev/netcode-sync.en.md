---
title: Network Synchronization Techniques Explained
description: "Master core multiplayer game synchronization technologies: state synchronization, lockstep, prediction, and lag compensation"
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - synchronization
  - netcode
  - lag compensation
  - prediction
status: imported
origin: old/src/content/docs/gamedev/netcode-sync.en.md
divergence: 0.227
issues: []
legacy:
  category: GameDev
  subcategory: Networking
  order: 24
  lastUpdated: 2026-01-07
---

Network synchronization is one of the most challenging technical areas in multiplayer game development. In networked environments, latency, packet loss, and bandwidth limitations all affect player experience. We explore core synchronization techniques in multiplayer games, including state synchronization, lockstep, client-side prediction, server reconciliation, and lag compensation.

## What is Network Synchronization

Network synchronization refers to the techniques used in multiplayer games to ensure all players see a consistent game world state. Due to network latency, different players' clients may be in different game states at the same moment. The goal of network synchronization is to minimize these differences and provide a smooth, consistent gaming experience.

### Core Challenges

The main challenges of network synchronization include:

- **Latency**: Packets take time to travel from sender to receiver, typically 20-200ms
- **Jitter**: Latency fluctuates, sometimes high, sometimes low
- **Packet Loss**: Some packets are lost during transmission
- **Bandwidth Limitations**: Available bandwidth is limited; data cannot be sent without restrictions
- **Anti-Cheat**: Need to prevent clients from tampering with data

```
Network Latency Diagram:

Client A                      Server                      Client B
    |                           |                           |
    |---- Send Input (50ms) --->|                           |
    |                           |---- Broadcast State (50ms) -->|
    |                           |                           |
    |<--- Receive State (50ms) -|                           |
    |                           |                           |

    Total Latency: 100-150ms (from A's action to B seeing the result)
```

## State Synchronization vs Lockstep

Multiplayer game synchronization mainly has two architectures: state synchronization and lockstep. Each has its pros and cons and is suitable for different types of games.

### State Synchronization

State synchronization means the server periodically sends game state (position, health, score, etc.) to all clients. Clients receive the state and directly update their local display.

```typescript
// State Synchronization: Server-side game state
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

// Server: Broadcast game state
class GameServer {
  private state: GameState;
  private clients: Map<string, WebSocket>;
  private tickRate: number = 20; // 20 updates per second

  constructor() {
    this.state = {
      timestamp: Date.now(),
      players: new Map(),
      entities: new Map(),
      gameTime: 0
    };

    // Start game loop
    setInterval(() => this.tick(), 1000 / this.tickRate);
  }

  private tick(): void {
    // 1. Process all client inputs
    this.processInputs();

    // 2. Update game logic
    this.updateGameLogic();

    // 3. Broadcast state to all clients
    this.broadcastState();
  }

  private processInputs(): void {
    // Process all inputs in the input queue
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
    // Create state snapshot
    const snapshot = this.createSnapshot();

    // Serialize and send to all clients
    const data = this.serializeSnapshot(snapshot);

    for (const [clientId, socket] of this.clients) {
      // Can customize for each client (e.g., view culling)
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

**Advantages of State Synchronization**:
- Relatively simple to implement
- Strong server authority, easy to prevent cheating
- Suitable for games with fewer players
- State can be incrementally updated

**Disadvantages of State Synchronization**:
- High bandwidth consumption
- Noticeable latency perception
- Not suitable for games requiring precise synchronization (like fighting games)

### Lockstep

Lockstep means all clients execute the same game logic, and the server only synchronizes player inputs. Since deterministic simulation is used, the same inputs will produce the same results.

```typescript
// Lockstep: Only synchronize inputs
interface PlayerInput {
  playerId: string;
  frame: number;
  actions: InputAction[];
  checksum?: number; // For sync verification
}

interface InputAction {
  type: 'move' | 'attack' | 'skill' | 'item';
  data: any;
}

// Lockstep client
class LockstepClient {
  private currentFrame: number = 0;
  private confirmedFrame: number = 0;
  private inputBuffer: Map<number, Map<string, PlayerInput>> = new Map();
  private localInputHistory: PlayerInput[] = [];
  private simulationSpeed: number = 60; // 60 FPS

  // Main game loop
  public update(deltaTime: number): void {
    // 1. Collect local input
    const localInput = this.collectLocalInput();
    this.localInputHistory.push(localInput);

    // 2. Send input to server
    this.sendInput(localInput);

    // 3. Wait for all players' inputs
    if (this.hasAllInputsForFrame(this.currentFrame)) {
      // 4. Execute one frame of simulation
      this.simulateFrame(this.currentFrame);
      this.currentFrame++;

      // 5. Validate sync state
      this.validateSync();
    }
  }

  private collectLocalInput(): PlayerInput {
    const actions: InputAction[] = [];

    // Collect keyboard input
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

    // Check if inputs from all players are received
    return frameInputs.size === this.playerCount;
  }

  private simulateFrame(frame: number): void {
    const inputs = this.inputBuffer.get(frame)!;

    // Process all players' inputs in fixed order
    const sortedInputs = Array.from(inputs.values())
      .sort((a, b) => a.playerId.localeCompare(b.playerId));

    for (const input of sortedInputs) {
      this.applyInput(input);
    }

    // Update game logic (using deterministic physics)
    this.gameWorld.update(1 / this.simulationSpeed);

    // Calculate state checksum
    const checksum = this.calculateChecksum();
    this.frameChecksums.set(frame, checksum);
  }

  // Deterministic random number generator
  private deterministicRandom(): number {
    // Pseudo-random number with deterministic seed
    this.randomSeed = (this.randomSeed * 1103515245 + 12345) & 0x7fffffff;
    return this.randomSeed / 0x7fffffff;
  }

  private calculateChecksum(): number {
    // Calculate hash of game state for sync verification
    let hash = 0;

    for (const player of this.gameWorld.players) {
      hash ^= this.hashPosition(player.position);
      hash ^= player.health;
    }

    return hash;
  }

  private validateSync(): void {
    // Periodically validate that all clients' states are consistent
    if (this.currentFrame % 60 === 0) {
      this.sendSyncCheck(this.currentFrame, this.frameChecksums.get(this.currentFrame)!);
    }
  }
}
```

**Advantages of Lockstep**:
- Extremely low bandwidth consumption (only transmits inputs)
- Precise synchronization, suitable for fighting games and RTS
- Supports perfect replay functionality
- Suitable for LAN matches

**Disadvantages of Lockstep**:
- Requires deterministic simulation (floating point, random numbers must be deterministic)
- One player lagging affects all players
- Latency equals the slowest player's latency
- Not suitable for games with many players

### Comparison Summary

| Feature | State Synchronization | Lockstep |
|---------|----------------------|----------|
| Bandwidth Consumption | High | Low |
| Latency Sensitivity | Can be mitigated with prediction | Waits for slowest player |
| Implementation Complexity | Lower | Higher (requires determinism) |
| Suitable Player Count | Dozens | A few to a dozen |
| Suitable Game Types | FPS, MMO | RTS, Fighting, MOBA |
| Replay Support | Requires storing states | Only needs to store inputs |
| Anti-Cheat | Server authoritative | Requires additional verification |

## Client-Side Prediction

Client-side prediction is the core technique for solving network latency issues. It allows clients to respond immediately to player input before waiting for server confirmation, providing a smooth gaming experience.

### Basic Principle

```
Without prediction:
    Input ----> Wait for server response ----> Display result
    |<------------ 100ms+ ---------------->|

With prediction:
    Input ----> Immediate local simulation ----> Display predicted result
                                                    |
    Input ----> Send to server ----> Receive confirmation ----> Correct if different
```

### Implementing Client-Side Prediction

```typescript
// Client prediction system
class ClientPrediction {
  private localPlayer: Player;
  private pendingInputs: PlayerInput[] = [];  // Unconfirmed inputs
  private inputSequenceNumber: number = 0;
  private serverState: PlayerState | null = null;

  // Process local input
  public processLocalInput(input: RawInput): void {
    // 1. Create input packet
    const playerInput: PlayerInput = {
      sequenceNumber: this.inputSequenceNumber++,
      timestamp: Date.now(),
      moveDirection: input.moveDirection,
      actions: input.actions
    };

    // 2. Immediately apply input locally (prediction)
    this.applyInput(this.localPlayer, playerInput);

    // 3. Save input for later reconciliation
    this.pendingInputs.push(playerInput);

    // 4. Send input to server
    this.sendToServer({
      type: 'input',
      data: playerInput
    });
  }

  // Apply input to player state
  private applyInput(player: Player, input: PlayerInput): void {
    const speed = player.moveSpeed;
    const deltaTime = 1 / 60; // Assuming 60 FPS

    // Apply movement
    if (input.moveDirection) {
      player.position.x += input.moveDirection.x * speed * deltaTime;
      player.position.y += input.moveDirection.y * speed * deltaTime;
      player.position.z += input.moveDirection.z * speed * deltaTime;
    }

    // Apply actions
    for (const action of input.actions) {
      this.processAction(player, action);
    }
  }

  // Handle server state update
  public onServerUpdate(serverState: ServerStateUpdate): void {
    // 1. Update server authoritative state
    this.serverState = serverState.playerState;

    // 2. Discard inputs already confirmed by server
    this.pendingInputs = this.pendingInputs.filter(
      input => input.sequenceNumber > serverState.lastProcessedInput
    );

    // 3. Server reconciliation: re-apply unconfirmed inputs based on server state
    this.reconcile();
  }

  // Server reconciliation
  private reconcile(): void {
    if (!this.serverState) return;

    // Reset player state to server state
    this.localPlayer.position = { ...this.serverState.position };
    this.localPlayer.velocity = { ...this.serverState.velocity };

    // Re-apply all unconfirmed inputs
    for (const input of this.pendingInputs) {
      this.applyInput(this.localPlayer, input);
    }
  }
}

// Complete client game loop
class GameClient {
  private prediction: ClientPrediction;
  private interpolation: EntityInterpolation;
  private lastUpdateTime: number = 0;

  public update(currentTime: number): void {
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    // 1. Collect and process local input
    const input = this.inputManager.getInput();
    if (input) {
      this.prediction.processLocalInput(input);
    }

    // 2. Update local prediction
    this.prediction.update(deltaTime);

    // 3. Interpolate remote entities
    this.interpolation.update(currentTime);

    // 4. Render
    this.render();
  }

  // Receive server messages
  public onServerMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'state_update':
        // Handle state update
        this.prediction.onServerUpdate(message.data);
        this.interpolation.addSnapshot(message.data);
        break;

      case 'event':
        // Handle game events
        this.handleGameEvent(message.data);
        break;
    }
  }
}
```

### Prediction Error Handling

When predicted results don't match server results, smooth correction is needed:

```typescript
// Smooth error correction
class SmoothCorrection {
  private correctionBlend: number = 0.1; // Blend coefficient
  private positionError: Vector3 = { x: 0, y: 0, z: 0 };
  private maxCorrectionSpeed: number = 10; // Max correction distance per second

  // Receive server correction
  public applyCorrection(
    currentPosition: Vector3,
    serverPosition: Vector3
  ): Vector3 {
    // Calculate error
    this.positionError = {
      x: serverPosition.x - currentPosition.x,
      y: serverPosition.y - currentPosition.y,
      z: serverPosition.z - currentPosition.z
    };

    const errorMagnitude = this.magnitude(this.positionError);

    // If error is large, correct immediately (might be teleportation)
    if (errorMagnitude > 5.0) {
      return serverPosition;
    }

    // Otherwise smooth correction
    return {
      x: currentPosition.x + this.positionError.x * this.correctionBlend,
      y: currentPosition.y + this.positionError.y * this.correctionBlend,
      z: currentPosition.z + this.positionError.z * this.correctionBlend
    };
  }

  // Continuous correction (called every frame)
  public updateCorrection(deltaTime: number): Vector3 {
    const maxCorrection = this.maxCorrectionSpeed * deltaTime;
    const errorMagnitude = this.magnitude(this.positionError);

    if (errorMagnitude <= maxCorrection) {
      // Error is small, eliminate directly
      const correction = { ...this.positionError };
      this.positionError = { x: 0, y: 0, z: 0 };
      return correction;
    }

    // Correct at maximum speed
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

## Server Reconciliation

Server reconciliation is the companion technique to client-side prediction, used to handle prediction errors and ensure client state matches the server's authoritative state.

### Reconciliation Process

```
Timeline:
t0: Client sends input #1, locally predicts position P1
t1: Client sends input #2, locally predicts position P2
t2: Client sends input #3, locally predicts position P3
t3: Server response arrives, confirms input #1, server position S1

Reconciliation process:
1. Discover S1 != P1 (prediction error)
2. Reset position to S1
3. Re-apply inputs #2 and #3
4. Get new predicted position P3'
```

```typescript
// Server-side: Handle client input
class GameServer {
  private players: Map<string, ServerPlayer> = new Map();
  private inputQueues: Map<string, PlayerInput[]> = new Map();
  private tickRate: number = 60;

  // Receive client input
  public onClientInput(clientId: string, input: PlayerInput): void {
    // Validate input validity
    if (!this.validateInput(clientId, input)) {
      console.warn(`Invalid input from ${clientId}`);
      return;
    }

    // Add input to processing queue
    const queue = this.inputQueues.get(clientId) || [];
    queue.push(input);
    this.inputQueues.set(clientId, queue);
  }

  // Validate input
  private validateInput(clientId: string, input: PlayerInput): boolean {
    const player = this.players.get(clientId);
    if (!player) return false;

    // Check if sequence number is incrementing
    if (input.sequenceNumber <= player.lastProcessedInput) {
      return false;
    }

    // Check if movement speed is reasonable (anti-cheat)
    if (input.moveDirection) {
      const speed = this.magnitude(input.moveDirection);
      if (speed > player.maxMoveSpeed * 1.1) { // Allow 10% margin
        return false;
      }
    }

    // Check if timestamp is reasonable
    const timeDiff = Date.now() - input.timestamp;
    if (timeDiff < -1000 || timeDiff > 5000) { // Allow 1 second early, 5 seconds late
      return false;
    }

    return true;
  }

  // Game tick
  private tick(): void {
    const deltaTime = 1 / this.tickRate;

    // Process all players' inputs
    for (const [clientId, player] of this.players) {
      const inputs = this.inputQueues.get(clientId) || [];

      for (const input of inputs) {
        // Apply input
        this.applyInput(player, input, deltaTime);
        player.lastProcessedInput = input.sequenceNumber;
      }

      this.inputQueues.set(clientId, []);
    }

    // Update game physics
    this.updatePhysics(deltaTime);

    // Detect collisions
    this.detectCollisions();

    // Send state updates
    this.sendStateUpdates();
  }

  // Send state updates to all clients
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
        // Send other entities in the player's view
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

## Interpolation and Extrapolation

For entities not controlled by the local player, clients need to use interpolation or extrapolation to smoothly display their movement.

### Entity Interpolation

Interpolation is a smooth transition between two known states:

```typescript
// Entity interpolation system
class EntityInterpolation {
  private entitySnapshots: Map<string, Snapshot[]> = new Map();
  private interpolationDelay: number = 100; // 100ms interpolation delay

  // Add new snapshot
  public addSnapshot(entityId: string, snapshot: Snapshot): void {
    const snapshots = this.entitySnapshots.get(entityId) || [];
    snapshots.push(snapshot);

    // Keep recent snapshots (about 1 second)
    while (snapshots.length > 20) {
      snapshots.shift();
    }

    this.entitySnapshots.set(entityId, snapshots);
  }

  // Get interpolated state
  public getInterpolatedState(entityId: string, currentTime: number): EntityState | null {
    const snapshots = this.entitySnapshots.get(entityId);
    if (!snapshots || snapshots.length < 2) {
      return null;
    }

    // Calculate render time (current time - interpolation delay)
    const renderTime = currentTime - this.interpolationDelay;

    // Find two snapshots for interpolation
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
      // No suitable snapshots, use extrapolation or latest state
      return this.extrapolate(entityId, snapshots, renderTime);
    }

    // Calculate interpolation factor
    const t = (renderTime - before.timestamp) /
              (after.timestamp - before.timestamp);

    // Perform interpolation
    return this.interpolate(before.state, after.state, t);
  }

  // Linear interpolation
  private interpolate(a: EntityState, b: EntityState, t: number): EntityState {
    return {
      position: {
        x: a.position.x + (b.position.x - a.position.x) * t,
        y: a.position.y + (b.position.y - a.position.y) * t,
        z: a.position.z + (b.position.z - a.position.z) * t
      },
      // Use spherical linear interpolation (slerp) for rotation
      rotation: this.slerp(a.rotation, b.rotation, t),
      // Other properties can use latest value or interpolate
      animation: t < 0.5 ? a.animation : b.animation
    };
  }

  // Spherical linear interpolation (for rotation)
  private slerp(a: Quaternion, b: Quaternion, t: number): Quaternion {
    let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;

    // Handle negative dot product (choose shortest path)
    if (dot < 0) {
      b = { x: -b.x, y: -b.y, z: -b.z, w: -b.w };
      dot = -dot;
    }

    // If close, use linear interpolation
    if (dot > 0.9995) {
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t,
        w: a.w + (b.w - a.w) * t
      };
    }

    // Standard slerp
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

### Extrapolation

When there's not enough data for interpolation, extrapolation can be used to predict entity position:

```typescript
// Extrapolation system
class EntityExtrapolation {
  // Velocity-based extrapolation
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

  // Acceleration-based extrapolation (more accurate)
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

  // Extrapolation limit: prevent extrapolating too far causing obvious errors
  public extrapolateWithLimit(
    lastKnownState: EntityState,
    timeSinceLastUpdate: number,
    maxExtrapolationTime: number = 250 // Max extrapolation 250ms
  ): EntityState {
    const clampedTime = Math.min(timeSinceLastUpdate, maxExtrapolationTime);
    return this.extrapolate(lastKnownState, clampedTime);
  }
}
```

## Lag Compensation

Lag compensation is mainly used for games requiring precise hit detection like shooters. The server needs to "go back in time" to verify whether a player's shot hit.

### Basic Principle

```
What the client sees (t - RTT/2):
    Target is at position A
    Player shoots at position A

When server receives shot request (t):
    Target has moved to position B
    If judged directly, player can never hit moving targets

Lag compensation:
    Server rewinds to (t - RTT/2) state
    Determines hit at that moment
```

### Implementing Lag Compensation

```typescript
// Lag compensation system
class LagCompensation {
  private worldHistory: WorldState[] = [];
  private maxHistoryLength: number = 1000; // Save 1 second of history
  private tickRate: number = 60;

  // Save world state every tick
  public saveWorldState(): void {
    const state: WorldState = {
      timestamp: Date.now(),
      entities: new Map()
    };

    // Save state of all hittable entities
    for (const entity of this.world.getHittableEntities()) {
      state.entities.set(entity.id, {
        position: { ...entity.position },
        hitbox: entity.getHitbox()
      });
    }

    this.worldHistory.push(state);

    // Clean up expired history
    while (this.worldHistory.length > this.maxHistoryLength / (1000 / this.tickRate)) {
      this.worldHistory.shift();
    }
  }

  // Process shot request
  public processShot(
    shooterId: string,
    shotData: ShotData
  ): HitResult {
    const shooter = this.world.getPlayer(shooterId);
    if (!shooter) {
      return { hit: false, reason: 'shooter_not_found' };
    }

    // Calculate estimated time of shot (current time - client latency)
    const clientLatency = shooter.getLatency();
    const shotTime = Date.now() - clientLatency;

    // Get world state at time of shot
    const historicalState = this.getStateAtTime(shotTime);
    if (!historicalState) {
      // Historical state doesn't exist, use current state
      return this.checkHitCurrent(shotData);
    }

    // Perform hit detection in historical state
    return this.checkHitHistorical(shotData, historicalState);
  }

  // Get world state at specified time
  private getStateAtTime(targetTime: number): WorldState | null {
    if (this.worldHistory.length < 2) {
      return null;
    }

    // Find two states before and after target time
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

    // If no after, use before
    if (!after) {
      return before;
    }

    // Interpolate between two states
    return this.interpolateWorldState(before, after, targetTime);
  }

  // Interpolate world state
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

    // Interpolate each entity's state
    for (const [entityId, beforeState] of before.entities) {
      const afterState = after.entities.get(entityId);
      if (!afterState) {
        // Entity doesn't exist in after, use before state
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
        hitbox: beforeState.hitbox // Hitboxes typically don't interpolate
      });
    }

    return interpolated;
  }

  // Check hit in historical state
  private checkHitHistorical(
    shotData: ShotData,
    worldState: WorldState
  ): HitResult {
    // Ray detection
    const ray = {
      origin: shotData.origin,
      direction: shotData.direction
    };

    let closestHit: HitResult | null = null;
    let closestDistance = Infinity;

    for (const [entityId, entityState] of worldState.entities) {
      if (entityId === shotData.shooterId) continue; // Can't hit yourself

      const hitResult = this.raycastHitbox(ray, entityState.hitbox, entityState.position);

      if (hitResult.hit && hitResult.distance < closestDistance) {
        closestDistance = hitResult.distance;
        closestHit = {
          hit: true,
          entityId,
          hitPoint: hitResult.point,
          hitPart: hitResult.part, // Head/body/limbs etc.
          distance: hitResult.distance
        };
      }
    }

    return closestHit || { hit: false };
  }

  // Ray vs hitbox detection
  private raycastHitbox(
    ray: Ray,
    hitbox: Hitbox,
    position: Vector3
  ): RaycastResult {
    // Implement ray intersection with various shapes (capsule, box, etc.)
    // Simplified here as sphere detection

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

### Lag Compensation Limits

```typescript
// Lag compensation configuration
const LAG_COMPENSATION_CONFIG = {
  // Max compensation time (ms)
  // Players exceeding this latency won't get full compensation
  maxCompensation: 200,

  // Max rewind time (ms)
  // Length of server history records
  maxRewindTime: 1000,

  // Compensation decay
  // Higher latency, less compensation
  compensationDecay: {
    threshold: 100,  // Full compensation below 100ms
    decayRate: 0.5   // Compensation reduces by 50% per 100ms above threshold
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

## Rollback Netcode

Rollback netcode is an advanced synchronization technique that combines prediction and rollback correction, widely used in fighting games.

### Core Principle

```
Frame 1: Local input A, remote input predicted as None
Frame 2: Local input B, remote input predicted as None
Frame 3: Received remote player's actual input X for frame 1
         Prediction error discovered!
         Rollback to frame 0
         Re-simulate frame 1 with correct inputs (A, X)
         Re-simulate frame 2 with (B, prediction)
         Continue to current frame
```

### Implementing Rollback System

```typescript
// Rollback netcode system
class RollbackNetcode {
  private currentFrame: number = 0;
  private localPlayerIndex: number;
  private playerCount: number;

  // Game state history
  private stateHistory: GameState[] = [];
  private maxRollbackFrames: number = 7; // Maximum rollback frames

  // Input history
  private confirmedInputs: Map<number, PlayerInput[]> = new Map(); // Confirmed
  private predictedInputs: Map<number, PlayerInput[]> = new Map(); // Predicted
  private localInputHistory: PlayerInput[] = [];

  // Game simulator (must be deterministic)
  private simulator: DeterministicSimulator;

  constructor(localPlayerIndex: number, playerCount: number) {
    this.localPlayerIndex = localPlayerIndex;
    this.playerCount = playerCount;
    this.simulator = new DeterministicSimulator();
  }

  // Main update loop
  public update(): void {
    // 1. Process network messages
    this.processNetworkMessages();

    // 2. Collect local input
    const localInput = this.collectLocalInput();
    this.localInputHistory[this.currentFrame] = localInput;

    // 3. Send local input
    this.sendInput(localInput);

    // 4. Check if rollback is needed
    const rollbackFrame = this.checkRollback();
    if (rollbackFrame >= 0) {
      this.rollback(rollbackFrame);
    }

    // 5. Simulate current frame
    this.simulateFrame();

    // 6. Save state for possible rollback
    this.saveState();

    this.currentFrame++;
  }

  // Check if rollback is needed
  private checkRollback(): number {
    // Check if any newly confirmed inputs differ from previous predictions
    for (let frame = this.currentFrame - this.maxRollbackFrames;
         frame < this.currentFrame; frame++) {

      if (frame < 0) continue;

      const confirmed = this.confirmedInputs.get(frame);
      const predicted = this.predictedInputs.get(frame);

      if (confirmed && predicted) {
        // Compare each remote player's input
        for (let p = 0; p < this.playerCount; p++) {
          if (p === this.localPlayerIndex) continue;

          if (!this.inputsEqual(confirmed[p], predicted[p])) {
            return frame; // Need to rollback from this frame
          }
        }
      }
    }

    return -1; // No rollback needed
  }

  // Execute rollback
  private rollback(targetFrame: number): void {
    console.log(`Rolling back from frame ${this.currentFrame} to ${targetFrame}`);

    // 1. Restore to target frame state
    const savedState = this.stateHistory[targetFrame % this.maxRollbackFrames];
    if (!savedState) {
      console.error('Cannot rollback: state not found');
      return;
    }

    this.simulator.loadState(savedState);

    // 2. Re-simulate each frame with correct inputs
    for (let frame = targetFrame; frame < this.currentFrame; frame++) {
      const inputs = this.getInputsForFrame(frame);
      this.simulator.simulateFrame(inputs);
    }

    // 3. Update predicted input history
    for (let frame = targetFrame; frame < this.currentFrame; frame++) {
      const confirmed = this.confirmedInputs.get(frame);
      if (confirmed) {
        this.predictedInputs.set(frame, confirmed);
      }
    }
  }

  // Get all player inputs for a frame
  private getInputsForFrame(frame: number): PlayerInput[] {
    const inputs: PlayerInput[] = [];

    for (let p = 0; p < this.playerCount; p++) {
      if (p === this.localPlayerIndex) {
        // Local player: use actual input
        inputs.push(this.localInputHistory[frame]);
      } else {
        // Remote player: prefer confirmed input, otherwise use prediction
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

  // Predict remote player input
  private predictRemoteInput(playerIndex: number, frame: number): PlayerInput {
    // Strategy 1: Use last frame's input
    const lastConfirmedFrame = this.getLastConfirmedFrame(playerIndex);
    if (lastConfirmedFrame >= 0) {
      const lastInput = this.confirmedInputs.get(lastConfirmedFrame)?.[playerIndex];
      if (lastInput) {
        return { ...lastInput };
      }
    }

    // Strategy 2: Use empty input
    return this.createEmptyInput(playerIndex);
  }

  // Save current state
  private saveState(): void {
    const state = this.simulator.saveState();
    this.stateHistory[this.currentFrame % this.maxRollbackFrames] = state;
  }

  // Simulate current frame
  private simulateFrame(): void {
    const inputs = this.getInputsForFrame(this.currentFrame);

    // Save predicted inputs
    this.predictedInputs.set(this.currentFrame, inputs);

    // Execute simulation
    this.simulator.simulateFrame(inputs);
  }

  // Handle received remote input
  public onRemoteInput(playerIndex: number, frame: number, input: PlayerInput): void {
    // Store confirmed input
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

// Deterministic simulator
class DeterministicSimulator {
  private state: GameState;
  private randomSeed: number;

  constructor() {
    this.state = this.createInitialState();
    this.randomSeed = 12345; // Fixed seed
  }

  public simulateFrame(inputs: PlayerInput[]): void {
    // Process inputs
    for (let i = 0; i < inputs.length; i++) {
      this.processPlayerInput(i, inputs[i]);
    }

    // Update physics (using fixed-point or deterministic floating point)
    this.updatePhysics();

    // Handle collisions
    this.handleCollisions();

    // Update game logic
    this.updateGameLogic();
  }

  public saveState(): GameState {
    // Deep copy state
    return JSON.parse(JSON.stringify(this.state));
  }

  public loadState(state: GameState): void {
    this.state = JSON.parse(JSON.stringify(state));
  }

  // Deterministic random number
  private random(): number {
    this.randomSeed = (this.randomSeed * 1103515245 + 12345) & 0x7fffffff;
    return this.randomSeed / 0x7fffffff;
  }

  // Use fixed-point numbers for physics calculations
  private updatePhysics(): void {
    for (const entity of this.state.entities) {
      // Use integer arithmetic to simulate floating point (fixed-point)
      // For example: position stored as position * 1000
      entity.positionFixed.x += entity.velocityFixed.x;
      entity.positionFixed.y += entity.velocityFixed.y;

      // Gravity (in fixed-point form)
      entity.velocityFixed.y += GRAVITY_FIXED;
    }
  }
}
```

## Snapshot System

The snapshot system is used in state synchronization architecture where the server periodically sends complete game state snapshots to clients.

### Snapshot Structure Design

```typescript
// Snapshot data structure
interface Snapshot {
  // Metadata
  sequence: number;        // Snapshot sequence number
  timestamp: number;       // Server time
  serverTick: number;      // Server tick

  // Game state
  players: PlayerSnapshot[];
  entities: EntitySnapshot[];
  projectiles: ProjectileSnapshot[];

  // Delta update info
  baseSnapshot?: number;   // Base snapshot for delta
  deltaFlags?: number;     // Which parts have changed
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

// Snapshot manager (server-side)
class SnapshotManager {
  private snapshots: Map<number, Snapshot> = new Map();
  private currentSequence: number = 0;
  private maxSnapshots: number = 32;
  private snapshotRate: number = 20; // 20 snapshots per second

  // Create new snapshot
  public createSnapshot(world: GameWorld): Snapshot {
    const snapshot: Snapshot = {
      sequence: this.currentSequence++,
      timestamp: Date.now(),
      serverTick: world.tick,
      players: this.snapshotPlayers(world.players),
      entities: this.snapshotEntities(world.entities),
      projectiles: this.snapshotProjectiles(world.projectiles)
    };

    // Store snapshot
    this.snapshots.set(snapshot.sequence, snapshot);

    // Clean up old snapshots
    if (this.snapshots.size > this.maxSnapshots) {
      const oldestSequence = snapshot.sequence - this.maxSnapshots;
      this.snapshots.delete(oldestSequence);
    }

    return snapshot;
  }

  // Create delta snapshot
  public createDeltaSnapshot(
    world: GameWorld,
    clientAckedSequence: number
  ): DeltaSnapshot {
    const fullSnapshot = this.createSnapshot(world);
    const baseSnapshot = this.snapshots.get(clientAckedSequence);

    if (!baseSnapshot) {
      // Client too far behind, send full snapshot
      return { type: 'full', snapshot: fullSnapshot };
    }

    // Calculate difference
    const delta = this.calculateDelta(baseSnapshot, fullSnapshot);

    return {
      type: 'delta',
      baseSequence: clientAckedSequence,
      sequence: fullSnapshot.sequence,
      timestamp: fullSnapshot.timestamp,
      delta
    };
  }

  // Calculate snapshot difference
  private calculateDelta(base: Snapshot, current: Snapshot): SnapshotDelta {
    const delta: SnapshotDelta = {
      addedPlayers: [],
      removedPlayers: [],
      changedPlayers: [],
      addedEntities: [],
      removedEntities: [],
      changedEntities: []
    };

    // Compare player states
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

    // Similarly handle entities...

    return delta;
  }

  // Compare player states
  private playersEqual(a: PlayerSnapshot, b: PlayerSnapshot): boolean {
    return (
      a.position.x === b.position.x &&
      a.position.y === b.position.y &&
      a.position.z === b.position.z &&
      a.health === b.health &&
      a.weapon === b.weapon
      // ... compare other fields
    );
  }
}
```

### Snapshot Compression

```typescript
// Snapshot compression system
class SnapshotCompression {
  // Quantize position (reduce precision for smaller data)
  public quantizePosition(position: Vector3): QuantizedVector3 {
    // Convert floating point to integer (preserve 2 decimal places)
    return {
      x: Math.round(position.x * 100),
      y: Math.round(position.y * 100),
      z: Math.round(position.z * 100)
    };
  }

  // Quantize rotation (using smallest three method)
  public quantizeRotation(rotation: Quaternion): QuantizedRotation {
    // Find largest component
    const abs = [
      Math.abs(rotation.x),
      Math.abs(rotation.y),
      Math.abs(rotation.z),
      Math.abs(rotation.w)
    ];

    const maxIndex = abs.indexOf(Math.max(...abs));

    // Store index of largest component and other three components
    const values: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (i !== maxIndex) {
        // Map [-1, 1] to [0, 65535]
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

  // Bit packing
  public packPlayerState(player: PlayerSnapshot): Uint8Array {
    const buffer = new ArrayBuffer(32);
    const view = new DataView(buffer);
    let offset = 0;

    // Position (2 bytes per component, 6 bytes total)
    const pos = this.quantizePosition(player.position);
    view.setInt16(offset, pos.x, true); offset += 2;
    view.setInt16(offset, pos.y, true); offset += 2;
    view.setInt16(offset, pos.z, true); offset += 2;

    // Rotation (7 bytes: 1 byte index + 3 x 2 byte components)
    const rot = this.quantizeRotation(player.rotation);
    view.setUint8(offset, rot.maxComponentIndex); offset += 1;
    view.setUint16(offset, rot.a, true); offset += 2;
    view.setUint16(offset, rot.b, true); offset += 2;
    view.setUint16(offset, rot.c, true); offset += 2;

    // Health (2 bytes)
    view.setUint16(offset, player.health, true); offset += 2;

    // Weapon and animation state (1 byte each)
    view.setUint8(offset, player.weapon); offset += 1;
    view.setUint8(offset, player.animation.state); offset += 1;

    // Last processed input sequence number (4 bytes)
    view.setUint32(offset, player.lastProcessedInput, true); offset += 4;

    return new Uint8Array(buffer, 0, offset);
  }

  // Use dictionary encoding to compress string IDs
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

## Bandwidth Optimization

In network synchronization, bandwidth is a precious resource that needs optimization through various techniques.

### Interest Management (View Culling)

Only send entity states within or near the player's view:

```typescript
// Interest management system
class InterestManagement {
  private gridSize: number = 100; // Grid size
  private grid: Map<string, Set<string>> = new Map(); // Spatial partitioning grid
  private playerInterestAreas: Map<string, InterestArea> = new Map();

  // Update player's area of interest
  public updatePlayerInterest(playerId: string, position: Vector3): void {
    const area: InterestArea = {
      center: position,
      radius: 500, // Interest radius
      priority: [] // Priority entity list
    };

    // Use spatial partitioning to accelerate queries
    const cellX = Math.floor(position.x / this.gridSize);
    const cellZ = Math.floor(position.z / this.gridSize);

    const nearbyEntities: EntityWithPriority[] = [];

    // Check surrounding grid cells
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

    // Sort by priority
    nearbyEntities.sort((a, b) => b.priority - a.priority);

    // Limit entity count
    area.priority = nearbyEntities.slice(0, 64).map(e => e.id);

    this.playerInterestAreas.set(playerId, area);
  }

  // Calculate entity priority
  private calculatePriority(
    playerId: string,
    entity: Entity,
    distance: number
  ): number {
    let priority = 0;

    // Closer distance = higher priority
    priority += (1 - distance / 500) * 100;

    // Player entities have higher priority
    if (entity.type === 'player') {
      priority += 200;
    }

    // Interacting entities have higher priority
    if (entity.interactingWith === playerId) {
      priority += 300;
    }

    // Threat entities have higher priority
    if (entity.type === 'enemy' && entity.target === playerId) {
      priority += 250;
    }

    return priority;
  }

  // Get list of entities to send to player
  public getEntitiesForPlayer(playerId: string): string[] {
    const area = this.playerInterestAreas.get(playerId);
    return area ? area.priority : [];
  }
}
```

### Priority Updates

Assign different update frequencies based on entity importance:

```typescript
// Priority update system
class PriorityUpdateSystem {
  private updateBudget: number = 4096; // Byte budget per update
  private entityUpdateCounters: Map<string, number> = new Map();

  // Calculate update priority for each entity
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

      // Base priority (distance-based)
      priority += Math.max(0, 100 - distance / 10);

      // Time factor (longer since last update = higher priority)
      priority += timeSinceLastUpdate * 0.1;

      // Change magnitude (more change = higher priority)
      priority += entity.changeVelocity * 50;

      // Importance flag
      if (entity.isImportant) {
        priority *= 2;
      }

      priorities.push({
        entityId: entity.id,
        priority,
        dataSize: this.estimateDataSize(entity)
      });
    }

    // Sort by priority
    priorities.sort((a, b) => b.priority - a.priority);

    return priorities;
  }

  // Select entities for this update
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

### Data Compression Strategies

```typescript
// Data compression configuration
interface CompressionConfig {
  // Position precision (decimal places)
  positionPrecision: number;

  // Rotation precision (angle precision)
  rotationPrecision: number;

  // Whether to use delta compression
  useDeltaCompression: boolean;

  // Whether to use Huffman coding
  useHuffmanCoding: boolean;

  // Minimum change threshold (don't send if below)
  minChangeThreshold: number;
}

// Delta compression
class DeltaCompression {
  private lastSentStates: Map<string, EntityState> = new Map();

  public compressState(
    entityId: string,
    currentState: EntityState
  ): CompressedState | null {
    const lastState = this.lastSentStates.get(entityId);

    if (!lastState) {
      // First send, send full state
      this.lastSentStates.set(entityId, currentState);
      return { type: 'full', state: currentState };
    }

    // Calculate difference
    const delta: Partial<EntityState> = {};
    let hasChanges = false;

    // Only include changed fields
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
      return null; // No changes, don't send
    }

    // Update cache
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

## Netcode Best Practices

### Network Architecture Design Principles

```typescript
// 1. Server Authority Principle
// All critical game logic executes on the server
class AuthoritativeServer {
  // Server validates all client actions
  public processPlayerAction(playerId: string, action: PlayerAction): ActionResult {
    // Validate action validity
    if (!this.validateAction(playerId, action)) {
      return { success: false, reason: 'invalid_action' };
    }

    // Execute action on server
    const result = this.executeAction(playerId, action);

    // Broadcast result to all clients
    this.broadcastResult(result);

    return result;
  }

  private validateAction(playerId: string, action: PlayerAction): boolean {
    const player = this.players.get(playerId);
    if (!player) return false;

    switch (action.type) {
      case 'move':
        // Validate movement speed is reasonable
        return action.speed <= player.maxSpeed;

      case 'attack':
        // Validate attack cooldown has passed
        return player.canAttack();

      case 'use_item':
        // Validate player owns the item
        return player.hasItem(action.itemId);

      default:
        return false;
    }
  }
}

// 2. Input Buffering
// Buffer a certain amount of inputs to handle network jitter
class InputBuffer {
  private buffer: PlayerInput[] = [];
  private bufferSize: number = 3; // Buffer 3 frames of input

  public addInput(input: PlayerInput): void {
    this.buffer.push(input);
  }

  public getInput(): PlayerInput | null {
    if (this.buffer.length > this.bufferSize) {
      return this.buffer.shift()!;
    }
    return null;
  }

  // Buffer health check
  public getBufferHealth(): number {
    return this.buffer.length / this.bufferSize;
  }
}

// 3. Network Status Monitoring
class NetworkMonitor {
  private latencySamples: number[] = [];
  private jitterSamples: number[] = [];
  private packetLossCounter: number = 0;
  private totalPackets: number = 0;

  // Record latency sample
  public recordLatency(latency: number): void {
    this.latencySamples.push(latency);
    if (this.latencySamples.length > 100) {
      this.latencySamples.shift();
    }

    // Calculate jitter
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

  // Get network quality metrics
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

### Common Problem Handling

```typescript
// Handle packet loss
class PacketLossHandler {
  private pendingAcks: Map<number, PendingPacket> = new Map();
  private retryTimeout: number = 100; // Retry after 100ms
  private maxRetries: number = 3;

  // Send packet requiring acknowledgment
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

  // Handle acknowledgment
  public onAck(sequenceNumber: number): void {
    this.pendingAcks.delete(sequenceNumber);
  }

  // Check and resend timed out packets
  public update(): void {
    const now = Date.now();

    for (const [seq, pending] of this.pendingAcks) {
      if (now - pending.sendTime > this.retryTimeout) {
        if (pending.retries >= this.maxRetries) {
          // Exceeded max retries, connection likely has issues
          console.warn(`Packet ${seq} lost after ${this.maxRetries} retries`);
          this.pendingAcks.delete(seq);
          continue;
        }

        // Resend
        pending.sendTime = now;
        pending.retries++;
        this.send({ ...pending.packet, seq, reliable: true, retry: pending.retries });
      }
    }
  }
}

// Handle clock synchronization
class ClockSynchronization {
  private serverTimeOffset: number = 0;
  private syncSamples: number[] = [];
  private syncInterval: number = 5000; // Sync every 5 seconds

  // Send sync request
  public sendSyncRequest(): void {
    const clientTime = Date.now();
    this.send({ type: 'sync_request', clientTime });
  }

  // Handle sync response
  public onSyncResponse(response: SyncResponse): void {
    const now = Date.now();
    const roundTripTime = now - response.clientTime;
    const oneWayLatency = roundTripTime / 2;

    // Estimate current server time
    const estimatedServerTime = response.serverTime + oneWayLatency;
    const offset = estimatedServerTime - now;

    this.syncSamples.push(offset);
    if (this.syncSamples.length > 10) {
      this.syncSamples.shift();
    }

    // Use median as offset (resistant to outliers)
    this.serverTimeOffset = this.median(this.syncSamples);
  }

  // Get server time
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

## Interview Key Points

### Common Interview Questions

```typescript
/**
 * 1. What's the difference between state synchronization and lockstep?
 *    What types of games are they suitable for?
 *
 * Key points:
 * - State sync: Server syncs complete state, suitable for FPS, MMO
 *   Pros: Server authoritative, easy anti-cheat
 *   Cons: High bandwidth, noticeable latency
 *
 * - Lockstep: Only syncs inputs, clients do deterministic simulation
 *   Pros: Low bandwidth, precise sync
 *   Cons: Requires determinism, one lags all lag
 */

/**
 * 2. What is client-side prediction? How to handle prediction errors?
 *
 * Key points:
 * - Client doesn't wait for server response, immediately updates local state based on input
 * - Save history of unconfirmed inputs
 * - When server state arrives, compare with prediction
 * - If different, rollback to server state, re-apply unconfirmed inputs
 * - Use smooth correction to avoid visual snapping
 */

/**
 * 3. How to implement lag compensation?
 *
 * Key points:
 * - Server saves world state history
 * - Client sends timestamp when shooting
 * - Server rewinds to corresponding historical state based on timestamp
 * - Performs hit detection in historical state
 * - Need to limit max compensation time to prevent cheating
 */

/**
 * 4. How to optimize network bandwidth?
 *
 * Key points:
 * - Interest management: Only send entities player can see
 * - Priority updates: Important entities update more frequently
 * - Delta compression: Only send changed parts
 * - Quantization: Reduce numerical precision
 * - Bit packing: Compact binary format
 */

/**
 * 5. How does rollback netcode work?
 *
 * Key points:
 * - Predict remote player inputs
 * - Rollback to correct state when prediction error discovered
 * - Re-simulate with correct inputs
 * - Requires completely deterministic game logic
 * - Suitable for fighting games, MOBA, etc.
 */
```

### Design Question Example

```typescript
/**
 * Interview question: Design a network synchronization system for a multiplayer shooter
 *
 * Requirements:
 * 1. Support 16 players
 * 2. Good experience with latency < 200ms
 * 3. Fair shooting hit detection
 */

class FPSNetworkSystem {
  // Server configuration
  private readonly TICK_RATE = 60;          // 60 Hz server tick
  private readonly SNAPSHOT_RATE = 20;       // 20 Hz snapshot sending
  private readonly MAX_PLAYERS = 16;
  private readonly LAG_COMPENSATION_MAX = 200; // Max 200ms lag compensation

  // Core components
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

  // Server main loop
  private serverTick(): void {
    // 1. Process all client inputs
    this.processAllInputs();

    // 2. Update game state
    this.updateGameState();

    // 3. Save historical state for lag compensation
    this.lagCompensation.saveWorldState(this.world);

    // 4. Send snapshots (reduced frequency)
    if (this.tickCount % (this.TICK_RATE / this.SNAPSHOT_RATE) === 0) {
      this.sendSnapshots();
    }

    this.tickCount++;
  }

  // Process shot
  private processShot(playerId: string, shot: ShotData): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // Use lag compensation for hit detection
    const hitResult = this.lagCompensation.processShot(
      playerId,
      shot,
      player.latency
    );

    if (hitResult.hit) {
      // Apply damage
      this.applyDamage(hitResult.targetId, shot.damage);

      // Broadcast hit effect
      this.broadcast({
        type: 'hit_effect',
        position: hitResult.hitPoint,
        target: hitResult.targetId
      });
    }
  }

  // Send snapshots
  private sendSnapshots(): void {
    for (const [playerId, player] of this.players) {
      // Get entities the player should see
      const visibleEntities = this.interestManagement
        .getEntitiesForPlayer(playerId);

      // Create delta snapshot
      const snapshot = this.snapshotManager.createDeltaSnapshot(
        visibleEntities,
        player.lastAckedSnapshot
      );

      // Send
      this.sendToPlayer(playerId, {
        type: 'snapshot',
        data: snapshot
      });
    }
  }
}

// Client implementation key points
class FPSClient {
  private prediction: ClientPrediction;
  private interpolation: EntityInterpolation;
  private lagCompensationDisplay: LagCompensationDisplay;

  // Client predicts local player
  // Interpolates remote players
  // Displays lag compensation effects (like hit confirmation)

  public update(deltaTime: number): void {
    // Local player: prediction + reconciliation
    this.prediction.update(this.localInput);

    // Remote players: interpolation
    for (const remotePlayer of this.remotePlayers) {
      const state = this.interpolation.getInterpolatedState(
        remotePlayer.id,
        Date.now()
      );
      remotePlayer.displayState = state;
    }

    // Render
    this.render();
  }
}
```

## Summary

Network synchronization is a core technology in multiplayer game development. This article covered:

1. **Synchronization Architectures**: Choosing between state synchronization and lockstep
2. **Client-Side Prediction**: Providing smooth local response experience
3. **Server Reconciliation**: Handling prediction errors, ensuring consistency
4. **Interpolation and Extrapolation**: Smoothly displaying remote entities
5. **Lag Compensation**: Fair hit detection for shooting
6. **Rollback Netcode**: Precise synchronization for fighting games
7. **Snapshot System**: Efficient state transmission
8. **Bandwidth Optimization**: Interest management, priority updates, data compression

In practice, choose the appropriate synchronization approach based on game type and target platform, and continuously test and optimize to provide the best player experience. There's no silver bullet for network synchronization - only by fully understanding the pros and cons of various techniques can you make the right architectural decisions.
