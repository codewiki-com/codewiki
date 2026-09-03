---
title: "Frame Sync vs State Sync: Complete Guide to Multiplayer Synchronization"
description: "Master multiplayer game synchronization architectures: lockstep frame synchronization vs state synchronization, implementation strategies, and choosing the right approach"
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - frame sync
  - state sync
  - lockstep
  - multiplayer
  - netcode
  - synchronization
status: imported
origin: old/src/content/docs/gamedev/frame-state-sync.en.md
divergence: 0.231
issues: []
legacy:
  category: GameDev
  subcategory: Networking
  order: 50
  lastUpdated: 2026-01-22
---

Multiplayer game synchronization is one of the most challenging aspects of game development. The choice between frame synchronization (lockstep) and state synchronization fundamentally shapes your game's architecture, player experience, and technical limitations. This guide provides a deep dive into both approaches, their implementations, and guidance on choosing the right solution for your game.

## Understanding Synchronization Fundamentals

### The Core Problem

In a multiplayer game, multiple players interact with a shared game world from different physical locations. Network latency means that information takes time to travel between clients and servers. The fundamental challenge is: **how do we ensure all players see the same game state despite network delays?**

```
The Synchronization Problem:

Player A (Tokyo)          Server (New York)         Player B (London)
     |                          |                          |
     |--- Input (100ms) ------->|                          |
     |                          |--- Broadcast (80ms) ---->|
     |                          |                          |
     |<-- State (100ms) --------|                          |
     |                          |                          |

Total latency: A's action takes 180-280ms to reach B
```

### Two Fundamental Approaches

**Frame Synchronization (Lockstep)**: All clients run the same deterministic simulation. Only player inputs are synchronized. Given identical inputs, all clients compute identical results.

**State Synchronization**: The server maintains authoritative game state. Clients send inputs; server validates and broadcasts resulting state changes.

---

## Frame Synchronization (Lockstep)

### Core Concept

Lockstep synchronization operates on a simple principle: if all clients start with the same initial state and process the same inputs in the same order, they will all reach the same final state.

```typescript
// Lockstep Architecture Overview
interface LockstepFrame {
  frameNumber: number;
  inputs: Map<PlayerId, PlayerInput>;
  checksum: number; // For desync detection
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

  // Main update loop
  update(): void {
    // Collect local input
    const localInput = this.collectInput();
    this.localInputHistory.push(localInput);

    // Send to relay server
    this.sendInput(localInput, this.currentFrame);

    // Only advance if we have all inputs for this frame
    if (this.hasAllInputsForFrame(this.currentFrame)) {
      this.simulateFrame(this.currentFrame);
      this.currentFrame++;
    }
  }

  private simulateFrame(frameNumber: number): void {
    const frame = this.frameInputs.get(frameNumber)!;

    // Process inputs in deterministic order (sorted by player ID)
    const sortedInputs = this.getSortedInputs(frame.inputs);

    for (const [playerId, input] of sortedInputs) {
      this.applyPlayerInput(playerId, input);
    }

    // Update game logic with fixed timestep
    this.gameWorld.fixedUpdate(this.FIXED_DELTA_TIME);

    // Calculate and verify checksum
    const checksum = this.calculateChecksum();
    if (frame.checksum && frame.checksum !== checksum) {
      this.handleDesync(frameNumber, checksum, frame.checksum);
    }
  }
}
```

### Deterministic Simulation Requirements

For lockstep to work, the simulation must be **perfectly deterministic**. The same inputs must always produce the exact same outputs.

#### Floating Point Determinism

Floating point operations can produce different results on different CPUs and compilers.

```typescript
// Problem: Floating point non-determinism
// This can give slightly different results on different machines:
const result = Math.sin(angle) * velocity;

// Solution 1: Fixed-point arithmetic
class FixedPoint {
  private static readonly SCALE = 1000; // 3 decimal places

  value: number; // Integer representation

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
    // Careful with overflow - use bigint for intermediate
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

// Solution 2: Lookup tables for trigonometry
class DeterministicMath {
  private static sinTable: number[] = [];
  private static readonly TABLE_SIZE = 4096;

  static initialize(): void {
    for (let i = 0; i < this.TABLE_SIZE; i++) {
      const angle = (i / this.TABLE_SIZE) * Math.PI * 2;
      // Pre-compute and round to fixed precision
      this.sinTable[i] = Math.round(Math.sin(angle) * 10000) / 10000;
    }
  }

  static sin(angle: number): number {
    // Normalize angle to [0, 2PI]
    angle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const index = Math.floor((angle / (Math.PI * 2)) * this.TABLE_SIZE);
    return this.sinTable[index % this.TABLE_SIZE];
  }

  static cos(angle: number): number {
    return this.sin(angle + Math.PI / 2);
  }
}
```

#### Deterministic Random Number Generation

```typescript
// Seeded random number generator - same seed always produces same sequence
class DeterministicRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Linear Congruential Generator
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Save and restore state for rollback
  getState(): number {
    return this.seed;
  }

  setState(state: number): void {
    this.seed = state;
  }
}

// Usage in game logic
class GameWorld {
  private rng: DeterministicRandom;

  spawnEnemy(): void {
    // Always use the game's RNG, never Math.random()
    const x = this.rng.nextInt(0, this.width);
    const y = this.rng.nextInt(0, this.height);
    const enemyType = this.rng.nextInt(0, this.enemyTypes.length - 1);

    this.createEnemy(x, y, this.enemyTypes[enemyType]);
  }
}
```

#### Deterministic Physics

```typescript
class DeterministicPhysics {
  private readonly FIXED_DELTA: FixedPoint;
  private readonly GRAVITY: FixedPoint;

  constructor() {
    this.FIXED_DELTA = new FixedPoint(1 / 60); // 60 FPS
    this.GRAVITY = new FixedPoint(-9.81);
  }

  updateBody(body: PhysicsBody): void {
    // Apply gravity
    body.velocityY = FixedPoint.add(
      body.velocityY,
      FixedPoint.multiply(this.GRAVITY, this.FIXED_DELTA)
    );

    // Update position
    body.x = FixedPoint.add(
      body.x,
      FixedPoint.multiply(body.velocityX, this.FIXED_DELTA)
    );
    body.y = FixedPoint.add(
      body.y,
      FixedPoint.multiply(body.velocityY, this.FIXED_DELTA)
    );
  }

  // Collision detection with fixed-point math
  checkCollision(a: AABB, b: AABB): boolean {
    return a.minX.value < b.maxX.value &&
           a.maxX.value > b.minX.value &&
           a.minY.value < b.maxY.value &&
           a.maxY.value > b.minY.value;
  }
}
```

### Input Delay and Buffer

Lockstep requires all inputs before advancing a frame. This creates inherent input delay.

```typescript
class LockstepInputBuffer {
  private inputBuffer: Map<number, Map<PlayerId, PlayerInput>> = new Map();
  private inputDelay: number = 2; // Frames of input delay
  private players: Set<PlayerId>;

  constructor(players: PlayerId[], inputDelay: number = 2) {
    this.players = new Set(players);
    this.inputDelay = inputDelay;
  }

  // Submit local input (for a future frame)
  submitLocalInput(input: PlayerInput, currentFrame: number): void {
    const targetFrame = currentFrame + this.inputDelay;

    if (!this.inputBuffer.has(targetFrame)) {
      this.inputBuffer.set(targetFrame, new Map());
    }
    this.inputBuffer.get(targetFrame)!.set(input.playerId, input);

    // Send to other clients
    this.broadcast({
      type: 'input',
      frame: targetFrame,
      input: input
    });
  }

  // Receive remote input
  receiveInput(frame: number, playerId: PlayerId, input: PlayerInput): void {
    if (!this.inputBuffer.has(frame)) {
      this.inputBuffer.set(frame, new Map());
    }
    this.inputBuffer.get(frame)!.set(playerId, input);
  }

  // Check if we can advance to a frame
  canAdvanceToFrame(frame: number): boolean {
    const frameInputs = this.inputBuffer.get(frame);
    if (!frameInputs) return false;

    // Check if we have inputs from all players
    for (const playerId of this.players) {
      if (!frameInputs.has(playerId)) {
        return false;
      }
    }
    return true;
  }

  // Get inputs for a frame
  getFrameInputs(frame: number): Map<PlayerId, PlayerInput> | null {
    if (!this.canAdvanceToFrame(frame)) {
      return null;
    }
    return this.inputBuffer.get(frame)!;
  }

  // Cleanup old frames
  cleanup(confirmedFrame: number): void {
    for (const frame of this.inputBuffer.keys()) {
      if (frame < confirmedFrame - 60) { // Keep 1 second of history
        this.inputBuffer.delete(frame);
      }
    }
  }
}
```

### Desynchronization Detection and Recovery

```typescript
interface GameStateChecksum {
  frameNumber: number;
  checksum: number;
  entityChecksums: Map<EntityId, number>;
}

class DesyncDetector {
  private checksumHistory: Map<number, number> = new Map();
  private readonly CHECKSUM_INTERVAL = 10; // Check every 10 frames

  calculateChecksum(gameState: GameState): number {
    let hash = 0;

    // Hash all game entities in deterministic order
    const sortedEntities = [...gameState.entities.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]));

    for (const [id, entity] of sortedEntities) {
      hash = this.hashCombine(hash, this.hashEntity(entity));
    }

    // Hash global state
    hash = this.hashCombine(hash, gameState.frameNumber);
    hash = this.hashCombine(hash, gameState.rngState);

    return hash;
  }

  private hashEntity(entity: Entity): number {
    let hash = 0;

    // Position (using fixed-point values)
    hash = this.hashCombine(hash, entity.x.value);
    hash = this.hashCombine(hash, entity.y.value);

    // Velocity
    hash = this.hashCombine(hash, entity.velocityX.value);
    hash = this.hashCombine(hash, entity.velocityY.value);

    // State
    hash = this.hashCombine(hash, entity.health);
    hash = this.hashCombine(hash, entity.state);

    return hash;
  }

  private hashCombine(a: number, b: number): number {
    // FNV-1a hash combination
    return ((a ^ b) * 0x01000193) >>> 0;
  }

  verifySync(frame: number, localChecksum: number, remoteChecksum: number): boolean {
    if (localChecksum !== remoteChecksum) {
      console.error(`Desync detected at frame ${frame}!`);
      console.error(`Local: ${localChecksum}, Remote: ${remoteChecksum}`);
      return false;
    }
    return true;
  }
}

// Recovery from desync
class DesyncRecovery {
  private snapshots: Map<number, GameState> = new Map();
  private readonly SNAPSHOT_INTERVAL = 60; // Every second

  saveSnapshot(frame: number, state: GameState): void {
    if (frame % this.SNAPSHOT_INTERVAL === 0) {
      this.snapshots.set(frame, this.cloneState(state));

      // Cleanup old snapshots
      for (const f of this.snapshots.keys()) {
        if (f < frame - 600) { // Keep 10 seconds
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
    // Find the last good snapshot before desync
    let recoveryFrame = 0;
    for (const frame of this.snapshots.keys()) {
      if (frame <= desyncFrame && frame > recoveryFrame) {
        recoveryFrame = frame;
      }
    }

    // Start from authoritative state or last snapshot
    let state = authoritativeState || this.snapshots.get(recoveryFrame)!;

    // Replay all inputs from recovery point to current frame
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
    // Re-simulate the frame
    // Implementation depends on game logic
    return state;
  }
}
```

### Rollback Netcode

Rollback is an advanced lockstep technique that provides responsive gameplay by speculatively simulating ahead.

```typescript
class RollbackNetcode {
  private gameStates: GameState[] = [];
  private inputHistory: Map<number, Map<PlayerId, PlayerInput>> = new Map();
  private localPlayerId: PlayerId;
  private confirmedFrame: number = 0;
  private currentFrame: number = 0;
  private maxRollbackFrames: number = 7;

  update(): void {
    // 1. Get local input and predict remote inputs
    const localInput = this.getLocalInput();
    this.setInput(this.currentFrame, this.localPlayerId, localInput);
    this.predictRemoteInputs(this.currentFrame);

    // 2. Send local input to remote players
    this.sendInput(localInput, this.currentFrame);

    // 3. Simulate current frame
    this.saveState(this.currentFrame);
    this.simulateFrame(this.currentFrame);
    this.currentFrame++;

    // 4. Handle confirmed remote inputs (may trigger rollback)
    while (this.hasUnprocessedRemoteInputs()) {
      const remoteInput = this.getNextRemoteInput();
      if (this.needsRollback(remoteInput)) {
        this.rollback(remoteInput.frame);
      }
    }
  }

  private predictRemoteInputs(frame: number): void {
    // Use last known input as prediction
    for (const playerId of this.remotePlayers) {
      const lastInput = this.getLastKnownInput(playerId);
      this.setInput(frame, playerId, lastInput || this.createDefaultInput());
    }
  }

  private needsRollback(remoteInput: { frame: number; playerId: PlayerId; input: PlayerInput }): boolean {
    // Check if predicted input differs from actual
    const predicted = this.inputHistory.get(remoteInput.frame)?.get(remoteInput.playerId);

    if (!predicted) return true;
    return !this.inputsEqual(predicted, remoteInput.input);
  }

  private rollback(toFrame: number): void {
    // Don't rollback too far
    if (this.currentFrame - toFrame > this.maxRollbackFrames) {
      console.warn('Rollback too far, clamping');
      toFrame = this.currentFrame - this.maxRollbackFrames;
    }

    // Restore old state
    const savedState = this.gameStates[toFrame];
    if (!savedState) {
      console.error('No saved state for rollback!');
      return;
    }

    this.loadState(savedState);

    // Re-simulate from rollback point to current frame
    for (let frame = toFrame; frame < this.currentFrame; frame++) {
      this.simulateFrame(frame);
      this.saveState(frame);
    }
  }

  private saveState(frame: number): void {
    this.gameStates[frame % (this.maxRollbackFrames + 1)] = this.cloneGameState();
  }

  private loadState(state: GameState): void {
    // Restore game state
    // This needs to be a deep copy operation
  }

  // Input compression for network efficiency
  serializeInput(input: PlayerInput): ArrayBuffer {
    // Pack input into minimal bytes
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
    view.setUint8(1, input.aimAngle); // Quantized to 0-255
    view.setUint16(2, input.frame);

    return buffer;
  }
}
```

---

## State Synchronization

### Core Concept

State synchronization uses a server-authoritative model where the server maintains the true game state and broadcasts it to clients.

```typescript
// Server-authoritative state synchronization
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
  private tickRate: number = 60; // Server simulation rate
  private sendRate: number = 20; // Network update rate

  constructor() {
    this.state = {
      tick: 0,
      timestamp: Date.now(),
      players: new Map(),
      projectiles: [],
      entities: []
    };

    // Start game loop
    setInterval(() => this.tick(), 1000 / this.tickRate);
    setInterval(() => this.sendState(), 1000 / this.sendRate);
  }

  private tick(): void {
    // 1. Process client inputs
    this.processInputs();

    // 2. Update game simulation
    this.updateSimulation();

    // 3. Resolve collisions
    this.resolveCollisions();

    // 4. Update game rules
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

    // Validate input
    if (!this.validateInput(player, input)) {
      this.logSuspiciousActivity(playerId, input);
      return;
    }

    // Apply movement
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

    // Apply rotation
    if (input.rotation !== undefined) {
      player.rotation.y = input.rotation;
    }

    // Handle actions
    if (input.attack) {
      this.handleAttack(player, input);
    }

    player.lastProcessedInput = input.sequenceNumber;
  }

  private validateInput(player: PlayerState, input: PlayerInput): boolean {
    // Check for impossible movement speed
    if (input.movement) {
      const magnitude = this.vectorMagnitude(input.movement);
      if (magnitude > 1.5) return false; // Allow some tolerance
    }

    // Check input timestamp
    const inputAge = Date.now() - input.timestamp;
    if (inputAge > 5000) return false; // Reject inputs older than 5 seconds

    return true;
  }

  private sendState(): void {
    const snapshot = this.createSnapshot();

    for (const [playerId, client] of this.clients) {
      // Customize snapshot per client (interest management)
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

### Client-Side Prediction

Prediction allows clients to respond immediately to input while waiting for server confirmation.

```typescript
class ClientPrediction {
  private pendingInputs: PlayerInput[] = [];
  private localPlayer: PlayerState;
  private serverState: PlayerState | null = null;
  private reconciliationThreshold: number = 0.1;

  processInput(rawInput: RawInput): void {
    // 1. Create input packet
    const input: PlayerInput = {
      sequenceNumber: this.nextSequenceNumber++,
      timestamp: Date.now(),
      movement: rawInput.movement,
      rotation: rawInput.rotation,
      attack: rawInput.attack
    };

    // 2. Apply prediction locally
    this.applyInput(this.localPlayer, input);

    // 3. Store for reconciliation
    this.pendingInputs.push(input);

    // 4. Send to server
    this.network.send({
      type: 'input',
      data: input
    });
  }

  onServerState(serverState: ServerStateUpdate): void {
    // Update server state reference
    this.serverState = serverState.playerState;

    // Remove acknowledged inputs
    this.pendingInputs = this.pendingInputs.filter(
      input => input.sequenceNumber > serverState.lastProcessedInput
    );

    // Reconcile if needed
    this.reconcile();
  }

  private reconcile(): void {
    if (!this.serverState) return;

    // Start from server state
    const reconciledState = { ...this.serverState };

    // Re-apply all unacknowledged inputs
    for (const input of this.pendingInputs) {
      this.applyInput(reconciledState, input);
    }

    // Check if local state needs correction
    const error = this.calculatePositionError(
      this.localPlayer.position,
      reconciledState.position
    );

    if (error > this.reconciliationThreshold) {
      // Snap or interpolate to correct position
      this.smoothCorrection(reconciledState);
    }
  }

  private smoothCorrection(targetState: PlayerState): void {
    // Instead of snapping, smoothly interpolate
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

### Entity Interpolation

For smooth display of remote entities, interpolation is essential.

```typescript
interface StateSnapshot {
  timestamp: number;
  tick: number;
  entities: Map<EntityId, EntityState>;
}

class EntityInterpolation {
  private snapshots: StateSnapshot[] = [];
  private interpolationDelay: number = 100; // ms behind server
  private maxSnapshots: number = 30;

  addSnapshot(snapshot: StateSnapshot): void {
    this.snapshots.push(snapshot);

    // Keep buffer limited
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  getInterpolatedState(entityId: EntityId, currentTime: number): EntityState | null {
    // Calculate render timestamp (in the past)
    const renderTime = currentTime - this.interpolationDelay;

    // Find surrounding snapshots
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
      // Extrapolate if we don't have data
      return this.extrapolate(entityId, renderTime);
    }

    const beforeState = before.entities.get(entityId);
    const afterState = after.entities.get(entityId);

    if (!beforeState || !afterState) {
      return beforeState || afterState || null;
    }

    // Calculate interpolation factor
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
      velocity: after.velocity, // Use latest velocity
      animation: after.animation
    };
  }

  private extrapolate(entityId: EntityId, renderTime: number): EntityState | null {
    // Use last known state and velocity to predict position
    const lastSnapshot = this.snapshots[this.snapshots.length - 1];
    if (!lastSnapshot) return null;

    const lastState = lastSnapshot.entities.get(entityId);
    if (!lastState) return null;

    const timeDelta = (renderTime - lastSnapshot.timestamp) / 1000;

    // Limit extrapolation to prevent wild predictions
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
    // Spherical linear interpolation for rotations
    let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;

    // Handle negative dot (shortest path)
    if (dot < 0) {
      b = { x: -b.x, y: -b.y, z: -b.z, w: -b.w };
      dot = -dot;
    }

    // Use linear interpolation for very close quaternions
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

### Delta Compression

Reduce bandwidth by only sending changes.

```typescript
interface DeltaSnapshot {
  baseTick: number; // Reference tick
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

    // Compare entities
    for (const [entityId, entity] of currentState.entities) {
      const baseEntity = baseState?.entities.get(entityId);

      if (!baseEntity) {
        // New entity
        changes.push({
          entityId,
          changeType: 'create',
          data: entity
        });
      } else if (this.entityChanged(baseEntity, entity)) {
        // Changed entity - only send changed fields
        changes.push({
          entityId,
          changeType: 'update',
          data: this.getChangedFields(baseEntity, entity)
        });
      }
    }

    // Find destroyed entities
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

    // Check each field
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

  // Quantization for additional compression
  quantizePosition(position: Vector3): QuantizedPosition {
    // Quantize to 1cm precision
    return {
      x: Math.round(position.x * 100),
      y: Math.round(position.y * 100),
      z: Math.round(position.z * 100)
    };
  }

  quantizeRotation(rotation: Quaternion): number {
    // Smallest-three encoding for quaternion
    // Find the largest component
    const abs = [
      Math.abs(rotation.x),
      Math.abs(rotation.y),
      Math.abs(rotation.z),
      Math.abs(rotation.w)
    ];
    const maxIndex = abs.indexOf(Math.max(...abs));

    // Encode the three smaller components
    const components = [rotation.x, rotation.y, rotation.z, rotation.w];
    components.splice(maxIndex, 1);

    // Pack into 32 bits (2 bits for index, 10 bits each for 3 components)
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

## Comparison and Selection Guide

### Feature Comparison

| Aspect | Frame Sync (Lockstep) | State Sync |
|--------|----------------------|------------|
| **Bandwidth** | Very Low | High |
| **Latency Feel** | Input delay (all players) | Prediction hides latency |
| **Complexity** | High (determinism) | Medium |
| **Scalability** | 2-8 players | Hundreds of players |
| **Cheating Risk** | Client can cheat | Server authoritative |
| **Replay Support** | Easy (just inputs) | Complex (full states) |
| **Best For** | RTS, Fighting, MOBA | FPS, MMO, Battle Royale |

### Decision Matrix

```typescript
// Decision helper
function recommendSyncMethod(gameRequirements: GameRequirements): SyncMethod {
  // RTS games - large unit counts, precise sync needed
  if (gameRequirements.genre === 'RTS') {
    return 'lockstep';
  }

  // Fighting games - frame-perfect inputs matter
  if (gameRequirements.genre === 'fighting' && gameRequirements.maxPlayers <= 4) {
    return 'rollback'; // Enhanced lockstep
  }

  // Large player counts
  if (gameRequirements.maxPlayers > 8) {
    return 'state-sync';
  }

  // FPS games - fast action, prediction important
  if (gameRequirements.genre === 'FPS') {
    return 'state-sync';
  }

  // MOBA - hybrid approach
  if (gameRequirements.genre === 'MOBA') {
    if (gameRequirements.targetLatency < 50) {
      return 'lockstep';
    }
    return 'state-sync';
  }

  // Default to state sync for most games
  return 'state-sync';
}

interface GameRequirements {
  genre: 'FPS' | 'RTS' | 'MOBA' | 'fighting' | 'MMO' | 'puzzle' | 'racing';
  maxPlayers: number;
  targetLatency: number; // ms
  requiresDeterminism: boolean;
  replaySupport: boolean;
}
```

### Hybrid Approaches

Some games combine both methods.

```typescript
// Hybrid sync: Critical actions use lockstep, movement uses state sync
class HybridSynchronization {
  private lockstepSystem: LockstepSimulation;
  private stateSyncSystem: StateSync;

  processInput(input: PlayerInput): void {
    // Critical actions (attacks, abilities) go through lockstep
    if (input.attack || input.ability) {
      this.lockstepSystem.queueInput({
        type: 'action',
        action: input.attack || input.ability,
        frame: this.lockstepSystem.currentFrame
      });
    }

    // Movement goes through state sync for responsiveness
    if (input.movement) {
      this.stateSyncSystem.processMovement(input.movement);
    }
  }

  update(deltaTime: number): void {
    // Update lockstep for critical game logic
    this.lockstepSystem.update();

    // Update state sync for movement
    this.stateSyncSystem.update(deltaTime);

    // Merge results
    this.reconcileStates();
  }

  private reconcileStates(): void {
    // Lockstep state is authoritative for critical data
    // State sync handles position with prediction
  }
}
```

---

## Best Practices

### Network Protocol Design

```typescript
// Efficient packet structure
enum PacketType {
  INPUT = 1,
  STATE = 2,
  ACK = 3,
  SYNC_CHECK = 4,
  PING = 5,
  PONG = 6
}

class NetworkProtocol {
  // Use binary format for efficiency
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
      // Quantize direction to 8 bits (256 directions)
      const angle = Math.atan2(input.movement.y, input.movement.x);
      encoder.writeUint8(Math.round((angle + Math.PI) / (Math.PI * 2) * 255));
    }

    if (input.aimAngle !== undefined) {
      encoder.writeUint16(Math.round(input.aimAngle * 10000)); // 0.0001 precision
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

### Testing and Debugging

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
    // Simulate packet loss
    if (Math.random() < this.packetLoss) {
      return;
    }

    // Calculate delivery time with latency and jitter
    const delay = this.latency + (Math.random() - 0.5) * this.jitter * 2;
    const deliverTime = Date.now() + delay;

    this.messageQueue.push({ message, deliverTime });

    // Sort by delivery time (simulate out-of-order packets)
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

// Automated sync testing
class SyncTester {
  async runTest(
    clients: GameClient[],
    actions: TestAction[],
    duration: number
  ): Promise<TestResult> {
    const startTime = Date.now();
    let actionIndex = 0;

    while (Date.now() - startTime < duration) {
      // Execute scheduled actions
      while (actionIndex < actions.length &&
             actions[actionIndex].time <= Date.now() - startTime) {
        const action = actions[actionIndex];
        clients[action.clientIndex].executeAction(action);
        actionIndex++;
      }

      // Update all clients
      for (const client of clients) {
        client.update();
      }

      await this.sleep(16); // ~60 FPS
    }

    // Verify all clients have matching state
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

## Summary

Frame synchronization and state synchronization represent two fundamentally different approaches to multiplayer game networking:

**Frame Synchronization (Lockstep)**:
- Synchronizes inputs, not states
- Requires deterministic simulation
- Low bandwidth, high implementation complexity
- Best for RTS, fighting games, and MOBAs with few players
- Rollback variant provides responsive gameplay

**State Synchronization**:
- Server maintains authoritative state
- Clients predict and reconcile
- Higher bandwidth, easier implementation
- Best for FPS, MMO, and large-scale games
- Scales to many players

The choice between them depends on your game's requirements:
- Player count
- Game genre and pacing
- Latency tolerance
- Bandwidth constraints
- Anti-cheat requirements

Many modern games use hybrid approaches, combining the strengths of both methods for optimal player experience.

---

## Further Reading

- [Gaffer On Games: Networked Physics](https://gafferongames.com/post/networked_physics_2004/)
- [Valve's Source Multiplayer Networking](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking)
- [GGPO: Good Game Peace Out](https://www.ggpo.net/)
- [Gabriel Gambetta: Fast-Paced Multiplayer](https://www.gabrielgambetta.com/client-server-game-architecture.html)
- [Overwatch Gameplay Architecture and Netcode](https://www.youtube.com/watch?v=W3aieHjyNvw)
