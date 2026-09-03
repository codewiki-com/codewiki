---
title: Network Lag Compensation Techniques for Games
description: "Master lag compensation in multiplayer games: client-side prediction, server reconciliation, entity interpolation, hit detection, and latency hiding strategies"
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - lag compensation
  - netcode
  - prediction
  - interpolation
  - multiplayer
  - hit detection
status: imported
origin: old/src/content/docs/gamedev/lag-compensation.en.md
divergence: 0.237
issues: []
legacy:
  category: GameDev
  subcategory: Networking
  order: 51
  lastUpdated: 2026-01-22
---

Network latency is an unavoidable reality in multiplayer games. Players on opposite sides of the world may experience 200ms or more of round-trip delay. Without proper compensation techniques, this latency would make games feel sluggish, unresponsive, and unfair. This guide covers the essential techniques for hiding and compensating for network latency in real-time multiplayer games.

## Understanding Network Latency

### Types of Latency

```typescript
interface LatencyMetrics {
  // Round-trip time - time for data to go to server and back
  rtt: number;

  // One-way latency (approximately RTT / 2)
  oneWay: number;

  // Jitter - variation in latency
  jitter: number;

  // Packet loss percentage
  packetLoss: number;
}

class LatencyMonitor {
  private pingHistory: number[] = [];
  private readonly HISTORY_SIZE = 100;
  private lastPingTime: number = 0;
  private pingSequence: number = 0;
  private pendingPings: Map<number, number> = new Map();

  sendPing(): void {
    const sequence = this.pingSequence++;
    this.pendingPings.set(sequence, performance.now());
    this.network.send({ type: 'ping', sequence });
  }

  onPong(sequence: number): void {
    const sendTime = this.pendingPings.get(sequence);
    if (sendTime === undefined) return;

    const rtt = performance.now() - sendTime;
    this.pingHistory.push(rtt);

    if (this.pingHistory.length > this.HISTORY_SIZE) {
      this.pingHistory.shift();
    }

    this.pendingPings.delete(sequence);
  }

  getMetrics(): LatencyMetrics {
    if (this.pingHistory.length === 0) {
      return { rtt: 0, oneWay: 0, jitter: 0, packetLoss: 0 };
    }

    const avg = this.pingHistory.reduce((a, b) => a + b, 0) / this.pingHistory.length;

    // Calculate jitter (standard deviation)
    const variance = this.pingHistory.reduce((sum, ping) =>
      sum + Math.pow(ping - avg, 2), 0) / this.pingHistory.length;
    const jitter = Math.sqrt(variance);

    // Estimate packet loss from pending pings
    const now = performance.now();
    let lostPings = 0;
    for (const [seq, time] of this.pendingPings) {
      if (now - time > 5000) { // Consider lost after 5 seconds
        lostPings++;
        this.pendingPings.delete(seq);
      }
    }

    return {
      rtt: avg,
      oneWay: avg / 2,
      jitter,
      packetLoss: lostPings / this.HISTORY_SIZE
    };
  }

  // Smoothed RTT for more stable predictions
  getSmoothedRTT(): number {
    if (this.pingHistory.length === 0) return 0;

    // Exponentially weighted moving average
    let smoothed = this.pingHistory[0];
    const alpha = 0.125;

    for (let i = 1; i < this.pingHistory.length; i++) {
      smoothed = alpha * this.pingHistory[i] + (1 - alpha) * smoothed;
    }

    return smoothed;
  }
}
```

### Impact on Gameplay

```
Without Lag Compensation (200ms RTT):

Frame 0: Player presses "move right"
         |
         +-- Input sent to server (100ms)
         |
Frame 6: Server receives input
         Server moves player
         |
         +-- State sent to client (100ms)
         |
Frame 12: Client sees movement

Result: 200ms delay between input and visual feedback
        - Feels unresponsive
        - Aiming at moving targets is nearly impossible
        - Players in high-latency regions are at severe disadvantage
```

---

## Client-Side Prediction

### The Core Technique

Client-side prediction allows the local player to see immediate results of their actions without waiting for server confirmation.

```typescript
interface PlayerState {
  position: Vector3;
  velocity: Vector3;
  rotation: number;
  health: number;
  animation: string;
}

interface PlayerInput {
  sequenceNumber: number;
  timestamp: number;
  moveDirection: Vector2;
  rotation: number;
  actions: string[];
  deltaTime: number;
}

class ClientSidePrediction {
  private localState: PlayerState;
  private pendingInputs: PlayerInput[] = [];
  private inputSequence: number = 0;
  private serverState: PlayerState | null = null;
  private lastServerSequence: number = -1;

  // Configuration
  private readonly MAX_PREDICTION_ERROR = 0.5; // Units
  private readonly CORRECTION_SMOOTHING = 0.2;

  constructor(initialState: PlayerState) {
    this.localState = { ...initialState };
  }

  // Called every frame
  processInput(rawInput: RawInput, deltaTime: number): void {
    // Create input packet
    const input: PlayerInput = {
      sequenceNumber: this.inputSequence++,
      timestamp: Date.now(),
      moveDirection: rawInput.moveDirection,
      rotation: rawInput.rotation,
      actions: rawInput.actions,
      deltaTime
    };

    // Apply input locally (prediction)
    this.applyInput(this.localState, input);

    // Store for reconciliation
    this.pendingInputs.push(input);

    // Send to server
    this.sendInput(input);

    // Cleanup old inputs (keep last 2 seconds worth)
    const cutoffTime = Date.now() - 2000;
    this.pendingInputs = this.pendingInputs.filter(i => i.timestamp > cutoffTime);
  }

  // Called when server state arrives
  onServerUpdate(serverState: ServerStateUpdate): void {
    this.serverState = serverState.state;
    this.lastServerSequence = serverState.lastProcessedInput;

    // Remove acknowledged inputs
    this.pendingInputs = this.pendingInputs.filter(
      input => input.sequenceNumber > serverState.lastProcessedInput
    );

    // Reconcile
    this.reconcile();
  }

  private reconcile(): void {
    if (!this.serverState) return;

    // Start from server state
    const reconciledState: PlayerState = { ...this.serverState };

    // Re-apply unacknowledged inputs
    for (const input of this.pendingInputs) {
      this.applyInput(reconciledState, input);
    }

    // Calculate error
    const error = this.calculatePositionError(
      this.localState.position,
      reconciledState.position
    );

    if (error > this.MAX_PREDICTION_ERROR) {
      // Large error - snap to correct position
      console.warn(`Large prediction error: ${error.toFixed(2)} units`);
      this.localState = reconciledState;
    } else if (error > 0.01) {
      // Small error - smooth correction
      this.smoothCorrect(reconciledState);
    }
  }

  private smoothCorrect(targetState: PlayerState): void {
    // Interpolate towards correct position
    this.localState.position.x = this.lerp(
      this.localState.position.x,
      targetState.position.x,
      this.CORRECTION_SMOOTHING
    );
    this.localState.position.y = this.lerp(
      this.localState.position.y,
      targetState.position.y,
      this.CORRECTION_SMOOTHING
    );
    this.localState.position.z = this.lerp(
      this.localState.position.z,
      targetState.position.z,
      this.CORRECTION_SMOOTHING
    );
  }

  private applyInput(state: PlayerState, input: PlayerInput): void {
    const speed = 10; // Units per second

    // Apply movement
    if (input.moveDirection) {
      const movement = this.normalizeVector(input.moveDirection);
      state.velocity.x = movement.x * speed;
      state.velocity.z = movement.y * speed;

      state.position.x += state.velocity.x * input.deltaTime;
      state.position.z += state.velocity.z * input.deltaTime;
    } else {
      state.velocity.x = 0;
      state.velocity.z = 0;
    }

    // Apply rotation
    state.rotation = input.rotation;

    // Handle actions
    for (const action of input.actions) {
      this.processAction(state, action);
    }
  }

  private calculatePositionError(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  getState(): PlayerState {
    return this.localState;
  }
}
```

### Handling Prediction Failures

```typescript
class PredictionErrorHandler {
  private errorHistory: number[] = [];
  private consecutiveErrors: number = 0;
  private readonly ERROR_THRESHOLD = 1.0;
  private readonly MAX_CONSECUTIVE_ERRORS = 5;

  recordError(error: number): void {
    this.errorHistory.push(error);
    if (this.errorHistory.length > 100) {
      this.errorHistory.shift();
    }

    if (error > this.ERROR_THRESHOLD) {
      this.consecutiveErrors++;
    } else {
      this.consecutiveErrors = 0;
    }

    // Detect systematic prediction issues
    if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
      this.handleSystematicError();
    }
  }

  private handleSystematicError(): void {
    console.error('Systematic prediction error detected!');

    // Possible causes:
    // 1. Client and server have different physics parameters
    // 2. Input processing order differs
    // 3. Floating point differences
    // 4. Missing or corrupted inputs

    // Response options:
    // 1. Request full state resync
    // 2. Increase reconciliation frequency
    // 3. Log detailed debug info for analysis
  }

  getAverageError(): number {
    if (this.errorHistory.length === 0) return 0;
    return this.errorHistory.reduce((a, b) => a + b, 0) / this.errorHistory.length;
  }
}
```

---

## Entity Interpolation

### Smooth Display of Remote Entities

Remote entities arrive at irregular intervals due to network conditions. Interpolation ensures smooth visual presentation.

```typescript
interface EntitySnapshot {
  timestamp: number;
  position: Vector3;
  rotation: Quaternion;
  velocity: Vector3;
  animation: AnimationState;
}

class EntityInterpolation {
  private snapshots: EntitySnapshot[] = [];
  private readonly BUFFER_TIME_MS = 100; // Interpolation delay
  private readonly MAX_SNAPSHOTS = 20;
  private readonly MAX_EXTRAPOLATE_MS = 250;

  addSnapshot(snapshot: EntitySnapshot): void {
    // Insert in chronological order
    let insertIndex = this.snapshots.length;
    for (let i = this.snapshots.length - 1; i >= 0; i--) {
      if (this.snapshots[i].timestamp < snapshot.timestamp) {
        insertIndex = i + 1;
        break;
      }
      if (i === 0) insertIndex = 0;
    }
    this.snapshots.splice(insertIndex, 0, snapshot);

    // Cleanup old snapshots
    while (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots.shift();
    }
  }

  getInterpolatedState(currentTime: number): EntitySnapshot | null {
    if (this.snapshots.length === 0) return null;

    // Calculate render time (in the past)
    const renderTime = currentTime - this.BUFFER_TIME_MS;

    // Find bracketing snapshots
    let before: EntitySnapshot | null = null;
    let after: EntitySnapshot | null = null;

    for (let i = 0; i < this.snapshots.length; i++) {
      if (this.snapshots[i].timestamp <= renderTime) {
        before = this.snapshots[i];
      } else {
        after = this.snapshots[i];
        break;
      }
    }

    // Handle edge cases
    if (!before && !after) return null;
    if (!before) return after;
    if (!after) {
      // Need to extrapolate
      return this.extrapolate(before, renderTime);
    }

    // Interpolate between snapshots
    const t = (renderTime - before.timestamp) / (after.timestamp - before.timestamp);
    return this.interpolate(before, after, Math.max(0, Math.min(1, t)));
  }

  private interpolate(
    before: EntitySnapshot,
    after: EntitySnapshot,
    t: number
  ): EntitySnapshot {
    return {
      timestamp: before.timestamp + (after.timestamp - before.timestamp) * t,
      position: this.lerpVector3(before.position, after.position, t),
      rotation: this.slerpQuaternion(before.rotation, after.rotation, t),
      velocity: this.lerpVector3(before.velocity, after.velocity, t),
      animation: t < 0.5 ? before.animation : after.animation
    };
  }

  private extrapolate(lastKnown: EntitySnapshot, targetTime: number): EntitySnapshot {
    const deltaTime = (targetTime - lastKnown.timestamp) / 1000;

    // Clamp extrapolation time
    const clampedDelta = Math.min(deltaTime, this.MAX_EXTRAPOLATE_MS / 1000);

    // Dead reckoning: position = lastPosition + velocity * time
    return {
      timestamp: targetTime,
      position: {
        x: lastKnown.position.x + lastKnown.velocity.x * clampedDelta,
        y: lastKnown.position.y + lastKnown.velocity.y * clampedDelta,
        z: lastKnown.position.z + lastKnown.velocity.z * clampedDelta
      },
      rotation: lastKnown.rotation, // Don't extrapolate rotation
      velocity: lastKnown.velocity,
      animation: lastKnown.animation
    };
  }

  private lerpVector3(a: Vector3, b: Vector3, t: number): Vector3 {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t
    };
  }

  private slerpQuaternion(a: Quaternion, b: Quaternion, t: number): Quaternion {
    // Spherical linear interpolation
    let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;

    // Handle negative dot (take shorter path)
    let bx = b.x, by = b.y, bz = b.z, bw = b.w;
    if (dot < 0) {
      bx = -bx; by = -by; bz = -bz; bw = -bw;
      dot = -dot;
    }

    // Use linear interpolation if very close
    if (dot > 0.9995) {
      return this.normalizeQuaternion({
        x: a.x + (bx - a.x) * t,
        y: a.y + (by - a.y) * t,
        z: a.z + (bz - a.z) * t,
        w: a.w + (bw - a.w) * t
      });
    }

    const theta0 = Math.acos(dot);
    const theta = theta0 * t;
    const sinTheta = Math.sin(theta);
    const sinTheta0 = Math.sin(theta0);

    const s0 = Math.cos(theta) - dot * sinTheta / sinTheta0;
    const s1 = sinTheta / sinTheta0;

    return {
      x: a.x * s0 + bx * s1,
      y: a.y * s0 + by * s1,
      z: a.z * s0 + bz * s1,
      w: a.w * s0 + bw * s1
    };
  }

  private normalizeQuaternion(q: Quaternion): Quaternion {
    const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
    return { x: q.x / len, y: q.y / len, z: q.z / len, w: q.w / len };
  }
}
```

### Adaptive Interpolation Delay

```typescript
class AdaptiveInterpolation {
  private baseDelay: number = 100;
  private currentDelay: number = 100;
  private jitterHistory: number[] = [];
  private readonly MIN_DELAY = 50;
  private readonly MAX_DELAY = 300;
  private readonly JITTER_MULTIPLIER = 2;

  updateJitter(jitter: number): void {
    this.jitterHistory.push(jitter);
    if (this.jitterHistory.length > 30) {
      this.jitterHistory.shift();
    }

    this.calculateOptimalDelay();
  }

  private calculateOptimalDelay(): void {
    if (this.jitterHistory.length === 0) return;

    // Calculate 95th percentile of jitter
    const sorted = [...this.jitterHistory].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const jitter95 = sorted[p95Index];

    // Optimal delay = base + jitter buffer
    const optimalDelay = this.baseDelay + jitter95 * this.JITTER_MULTIPLIER;

    // Smooth transition to new delay
    this.currentDelay = this.currentDelay * 0.9 + optimalDelay * 0.1;

    // Clamp to bounds
    this.currentDelay = Math.max(
      this.MIN_DELAY,
      Math.min(this.MAX_DELAY, this.currentDelay)
    );
  }

  getDelay(): number {
    return this.currentDelay;
  }
}
```

---

## Server-Side Lag Compensation

### Rewinding Time for Hit Detection

In FPS games, the server must validate hits. But due to latency, when a player shoots, the target may have moved. Server-side lag compensation "rewinds" the world to where the target was when the shooter fired.

```typescript
interface HistoricalState {
  timestamp: number;
  positions: Map<PlayerId, Vector3>;
  hitboxes: Map<PlayerId, Hitbox[]>;
}

class ServerLagCompensation {
  private stateHistory: HistoricalState[] = [];
  private readonly HISTORY_DURATION_MS = 1000; // Keep 1 second of history
  private readonly TICK_RATE = 60;

  // Called every server tick
  recordState(currentState: GameState): void {
    const historicalState: HistoricalState = {
      timestamp: Date.now(),
      positions: new Map(),
      hitboxes: new Map()
    };

    for (const [playerId, player] of currentState.players) {
      historicalState.positions.set(playerId, { ...player.position });
      historicalState.hitboxes.set(playerId, player.hitboxes.map(h => ({ ...h })));
    }

    this.stateHistory.push(historicalState);

    // Cleanup old states
    const cutoff = Date.now() - this.HISTORY_DURATION_MS;
    while (this.stateHistory.length > 0 && this.stateHistory[0].timestamp < cutoff) {
      this.stateHistory.shift();
    }
  }

  // Validate a shot with lag compensation
  validateShot(
    shooterId: PlayerId,
    targetId: PlayerId,
    shotTimestamp: number,
    shotOrigin: Vector3,
    shotDirection: Vector3,
    clientRTT: number
  ): HitResult {
    // Calculate when the shot was actually fired (accounting for latency)
    const estimatedFireTime = shotTimestamp - clientRTT / 2;

    // Clamp to reasonable bounds (prevent exploits)
    const maxCompensation = Math.min(clientRTT + 100, 500); // Max 500ms
    const compensatedTime = Math.max(
      Date.now() - maxCompensation,
      estimatedFireTime
    );

    // Get historical state at fire time
    const historicalState = this.getStateAtTime(compensatedTime);
    if (!historicalState) {
      console.warn('No historical state available for lag compensation');
      return { hit: false, reason: 'no_history' };
    }

    // Get target's position/hitbox at fire time
    const targetPosition = historicalState.positions.get(targetId);
    const targetHitboxes = historicalState.hitboxes.get(targetId);

    if (!targetPosition || !targetHitboxes) {
      return { hit: false, reason: 'target_not_found' };
    }

    // Perform ray-hitbox intersection
    const hitResult = this.raycastHitboxes(
      shotOrigin,
      shotDirection,
      targetHitboxes,
      targetPosition
    );

    if (hitResult.hit) {
      // Additional validation
      if (!this.validateHitPlausibility(shooterId, targetId, shotOrigin, compensatedTime)) {
        return { hit: false, reason: 'implausible' };
      }
    }

    return hitResult;
  }

  private getStateAtTime(timestamp: number): HistoricalState | null {
    if (this.stateHistory.length === 0) return null;

    // Find bracketing states
    let before: HistoricalState | null = null;
    let after: HistoricalState | null = null;

    for (const state of this.stateHistory) {
      if (state.timestamp <= timestamp) {
        before = state;
      } else {
        after = state;
        break;
      }
    }

    // Use closest state (or interpolate for accuracy)
    if (!before) return after;
    if (!after) return before;

    // Interpolate between states
    const t = (timestamp - before.timestamp) / (after.timestamp - before.timestamp);
    return this.interpolateStates(before, after, t);
  }

  private interpolateStates(
    before: HistoricalState,
    after: HistoricalState,
    t: number
  ): HistoricalState {
    const interpolated: HistoricalState = {
      timestamp: before.timestamp + (after.timestamp - before.timestamp) * t,
      positions: new Map(),
      hitboxes: new Map()
    };

    // Interpolate positions
    for (const [playerId, beforePos] of before.positions) {
      const afterPos = after.positions.get(playerId);
      if (afterPos) {
        interpolated.positions.set(playerId, {
          x: beforePos.x + (afterPos.x - beforePos.x) * t,
          y: beforePos.y + (afterPos.y - beforePos.y) * t,
          z: beforePos.z + (afterPos.z - beforePos.z) * t
        });
      }
    }

    // For hitboxes, use "after" state if t > 0.5, otherwise "before"
    interpolated.hitboxes = t > 0.5 ? after.hitboxes : before.hitboxes;

    return interpolated;
  }

  private raycastHitboxes(
    origin: Vector3,
    direction: Vector3,
    hitboxes: Hitbox[],
    entityPosition: Vector3
  ): HitResult {
    let closestHit: HitResult = { hit: false };
    let closestDistance = Infinity;

    for (const hitbox of hitboxes) {
      // Transform hitbox to world space
      const worldHitbox = this.transformHitbox(hitbox, entityPosition);

      // Ray-AABB intersection
      const result = this.rayAABBIntersection(origin, direction, worldHitbox);

      if (result.hit && result.distance! < closestDistance) {
        closestDistance = result.distance!;
        closestHit = {
          hit: true,
          hitbox: hitbox.name,
          distance: result.distance,
          point: result.point
        };
      }
    }

    return closestHit;
  }

  private rayAABBIntersection(
    origin: Vector3,
    direction: Vector3,
    box: AABB
  ): { hit: boolean; distance?: number; point?: Vector3 } {
    const invDir = {
      x: 1 / direction.x,
      y: 1 / direction.y,
      z: 1 / direction.z
    };

    const t1 = (box.min.x - origin.x) * invDir.x;
    const t2 = (box.max.x - origin.x) * invDir.x;
    const t3 = (box.min.y - origin.y) * invDir.y;
    const t4 = (box.max.y - origin.y) * invDir.y;
    const t5 = (box.min.z - origin.z) * invDir.z;
    const t6 = (box.max.z - origin.z) * invDir.z;

    const tmin = Math.max(
      Math.max(Math.min(t1, t2), Math.min(t3, t4)),
      Math.min(t5, t6)
    );
    const tmax = Math.min(
      Math.min(Math.max(t1, t2), Math.max(t3, t4)),
      Math.max(t5, t6)
    );

    if (tmax < 0 || tmin > tmax) {
      return { hit: false };
    }

    const distance = tmin < 0 ? tmax : tmin;
    return {
      hit: true,
      distance,
      point: {
        x: origin.x + direction.x * distance,
        y: origin.y + direction.y * distance,
        z: origin.z + direction.z * distance
      }
    };
  }

  private validateHitPlausibility(
    shooterId: PlayerId,
    targetId: PlayerId,
    shotOrigin: Vector3,
    timestamp: number
  ): boolean {
    // Anti-cheat validations:

    // 1. Check if shooter could see target (line of sight)
    // 2. Check if shot origin is near shooter's actual position
    // 3. Check for impossible angles or distances
    // 4. Check fire rate limits
    // 5. Check weapon range

    return true; // Implement based on game rules
  }
}

interface HitResult {
  hit: boolean;
  reason?: string;
  hitbox?: string;
  distance?: number;
  point?: Vector3;
}

interface Hitbox {
  name: string;
  offset: Vector3;
  size: Vector3;
  damageMultiplier: number;
}
```

### Favor the Shooter vs Favor the Target

```typescript
enum HitValidationMode {
  FAVOR_SHOOTER, // Accept hit if valid from shooter's perspective
  FAVOR_TARGET,  // Only accept if target couldn't have dodged
  BALANCED       // Compromise between both
}

class HitValidationPolicy {
  private mode: HitValidationMode = HitValidationMode.BALANCED;
  private maxLagCompensation: number = 200; // ms

  validateHit(
    shotData: ShotData,
    shooterRTT: number,
    targetRTT: number
  ): boolean {
    switch (this.mode) {
      case HitValidationMode.FAVOR_SHOOTER:
        return this.favorShooterValidation(shotData, shooterRTT);

      case HitValidationMode.FAVOR_TARGET:
        return this.favorTargetValidation(shotData, targetRTT);

      case HitValidationMode.BALANCED:
        return this.balancedValidation(shotData, shooterRTT, targetRTT);
    }
  }

  private favorShooterValidation(shotData: ShotData, shooterRTT: number): boolean {
    // Full lag compensation based on shooter's latency
    // Pros: Shooter sees hits register as expected
    // Cons: Target can die "behind cover" from their perspective
    const compensation = Math.min(shooterRTT, this.maxLagCompensation);
    return this.checkHitAtTime(shotData, Date.now() - compensation);
  }

  private favorTargetValidation(shotData: ShotData, targetRTT: number): boolean {
    // Minimal lag compensation
    // Pros: Target's dodges are more likely to count
    // Cons: Shooter sees shots "miss" that looked like hits
    const compensation = Math.min(targetRTT / 2, 50);
    return this.checkHitAtTime(shotData, Date.now() - compensation);
  }

  private balancedValidation(
    shotData: ShotData,
    shooterRTT: number,
    targetRTT: number
  ): boolean {
    // Average the perspectives
    const avgRTT = (shooterRTT + targetRTT) / 2;
    const compensation = Math.min(avgRTT * 0.75, this.maxLagCompensation);
    return this.checkHitAtTime(shotData, Date.now() - compensation);
  }

  private checkHitAtTime(shotData: ShotData, timestamp: number): boolean {
    // Perform actual hit detection at given timestamp
    return true; // Implementation depends on game
  }
}
```

---

## Input Buffering and Timing

### Client Input Buffer

```typescript
class InputBuffer {
  private buffer: PlayerInput[] = [];
  private readonly BUFFER_SIZE = 3; // Frames of input buffer
  private sendRate: number = 60; // Inputs per second
  private lastSendTime: number = 0;

  addInput(input: PlayerInput): void {
    this.buffer.push(input);

    // Bundle multiple inputs if sending less frequently than input rate
    const now = performance.now();
    const sendInterval = 1000 / this.sendRate;

    if (now - this.lastSendTime >= sendInterval) {
      this.flush();
      this.lastSendTime = now;
    }
  }

  private flush(): void {
    if (this.buffer.length === 0) return;

    // Send all buffered inputs together
    this.network.send({
      type: 'input_batch',
      inputs: this.buffer
    });

    this.buffer = [];
  }

  // Adjust send rate based on network conditions
  adaptToNetwork(rtt: number, packetLoss: number): void {
    // Higher packet loss = send more frequently (redundancy)
    // Higher RTT = can afford to batch more

    if (packetLoss > 0.05) {
      this.sendRate = 120; // Send twice as often
    } else if (rtt > 150) {
      this.sendRate = 30; // Batch more
    } else {
      this.sendRate = 60; // Default
    }
  }
}
```

### Server Input Processing

```typescript
class ServerInputProcessor {
  private inputQueues: Map<PlayerId, PlayerInput[]> = new Map();
  private processedSequences: Map<PlayerId, number> = new Map();
  private readonly MAX_QUEUE_SIZE = 60;

  receiveInput(playerId: PlayerId, inputs: PlayerInput[]): void {
    let queue = this.inputQueues.get(playerId);
    if (!queue) {
      queue = [];
      this.inputQueues.set(playerId, queue);
    }

    const lastProcessed = this.processedSequences.get(playerId) || -1;

    for (const input of inputs) {
      // Ignore old inputs
      if (input.sequenceNumber <= lastProcessed) continue;

      // Ignore duplicates
      if (queue.some(i => i.sequenceNumber === input.sequenceNumber)) continue;

      // Insert in order
      let insertIndex = queue.length;
      for (let i = queue.length - 1; i >= 0; i--) {
        if (queue[i].sequenceNumber < input.sequenceNumber) {
          insertIndex = i + 1;
          break;
        }
        if (i === 0) insertIndex = 0;
      }
      queue.splice(insertIndex, 0, input);
    }

    // Prevent queue from growing too large
    while (queue.length > this.MAX_QUEUE_SIZE) {
      queue.shift();
    }
  }

  // Process inputs for a player during server tick
  processInputs(playerId: PlayerId, player: Player, deltaTime: number): void {
    const queue = this.inputQueues.get(playerId);
    if (!queue || queue.length === 0) {
      // No input - use last known or default
      this.processDefaultInput(player, deltaTime);
      return;
    }

    // Process next input in sequence
    const input = queue.shift()!;
    this.applyInput(player, input);
    this.processedSequences.set(playerId, input.sequenceNumber);
  }

  private processDefaultInput(player: Player, deltaTime: number): void {
    // Apply friction/deceleration when no input
    player.velocity.x *= 0.9;
    player.velocity.z *= 0.9;

    // Still update position
    player.position.x += player.velocity.x * deltaTime;
    player.position.z += player.velocity.z * deltaTime;
  }

  getLastProcessedSequence(playerId: PlayerId): number {
    return this.processedSequences.get(playerId) || -1;
  }
}
```

---

## Latency Hiding Techniques

### Visual Effects and Feedback

```typescript
class LatencyHidingEffects {
  // Instant visual feedback for actions
  playShootEffect(weapon: Weapon, origin: Vector3, direction: Vector3): void {
    // Muzzle flash - instant
    this.particles.spawn('muzzle_flash', origin);

    // Tracer/bullet trail - instant
    this.spawnTracer(origin, direction, weapon.range);

    // Sound - instant
    this.audio.play(weapon.fireSound, origin);

    // Shell ejection - instant
    this.spawnShellCasing(origin, weapon.shellType);

    // Note: Hit confirmation comes later from server
  }

  // Optimistic hit effects (client-side prediction of hits)
  playPredictedHitEffect(hitPoint: Vector3, surfaceType: string): void {
    // Spawn temporary hit effect
    const effect = this.particles.spawn('hit_' + surfaceType, hitPoint);

    // This effect may need to be canceled if server says no hit
    return effect.id;
  }

  cancelHitEffect(effectId: string): void {
    this.particles.cancel(effectId);
  }

  // Confirmed hit effects
  playConfirmedHitEffect(hitData: HitConfirmation): void {
    // Blood/spark effects
    this.particles.spawn('confirmed_hit', hitData.point);

    // Hit sound
    this.audio.play('hit_confirm', hitData.point);

    // Hitmarker UI
    this.ui.showHitmarker(hitData.damage, hitData.isHeadshot);

    // Damage numbers
    if (this.settings.showDamageNumbers) {
      this.ui.showDamageNumber(hitData.point, hitData.damage);
    }
  }
}
```

### Animation Blending

```typescript
class NetworkedAnimation {
  private currentAnimation: string = 'idle';
  private targetAnimation: string = 'idle';
  private blendTime: number = 0.15; // seconds
  private blendProgress: number = 1;

  // Immediately start predicted animation
  playPredictedAnimation(animation: string): void {
    if (animation !== this.targetAnimation) {
      this.currentAnimation = this.targetAnimation;
      this.targetAnimation = animation;
      this.blendProgress = 0;
    }
  }

  // Server confirmed animation - may need to correct
  onServerAnimation(animation: string): void {
    if (animation !== this.targetAnimation) {
      // Server disagrees - blend to server's animation
      this.currentAnimation = this.targetAnimation;
      this.targetAnimation = animation;
      this.blendProgress = 0;
    }
  }

  update(deltaTime: number): void {
    if (this.blendProgress < 1) {
      this.blendProgress = Math.min(1, this.blendProgress + deltaTime / this.blendTime);
    }
  }

  getCurrentBlend(): { from: string; to: string; weight: number } {
    return {
      from: this.currentAnimation,
      to: this.targetAnimation,
      weight: this.smoothstep(this.blendProgress)
    };
  }

  private smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }
}
```

### Predictive Spawning

```typescript
class PredictiveSpawning {
  private predictedEntities: Map<string, PredictedEntity> = new Map();
  private predictionId: number = 0;

  // Predict spawn before server confirms
  predictSpawn(entityType: string, position: Vector3, data: any): string {
    const id = `predicted_${this.predictionId++}`;

    const entity: PredictedEntity = {
      id,
      type: entityType,
      position,
      data,
      createdAt: Date.now(),
      confirmed: false
    };

    this.predictedEntities.set(id, entity);

    // Create visual representation
    this.spawnVisual(entity);

    return id;
  }

  // Server confirms spawn
  confirmSpawn(predictionId: string, serverId: string): void {
    const predicted = this.predictedEntities.get(predictionId);
    if (predicted) {
      predicted.confirmed = true;
      predicted.serverId = serverId;

      // Transfer visual to real entity
      this.transferToServerEntity(predicted, serverId);
      this.predictedEntities.delete(predictionId);
    }
  }

  // Server rejects spawn
  rejectSpawn(predictionId: string): void {
    const predicted = this.predictedEntities.get(predictionId);
    if (predicted) {
      // Remove predicted visual
      this.removeVisual(predicted.id);
      this.predictedEntities.delete(predictionId);
    }
  }

  // Cleanup stale predictions
  update(): void {
    const now = Date.now();
    const maxAge = 2000; // 2 seconds

    for (const [id, entity] of this.predictedEntities) {
      if (!entity.confirmed && now - entity.createdAt > maxAge) {
        // Prediction timed out - remove
        this.removeVisual(id);
        this.predictedEntities.delete(id);
      }
    }
  }
}
```

---

## Best Practices

### Network Simulation for Testing

```typescript
class NetworkConditionSimulator {
  private enabled: boolean = false;
  private latency: number = 0;
  private jitter: number = 0;
  private packetLoss: number = 0;
  private packetDuplication: number = 0;
  private outOfOrder: number = 0;

  private messageQueue: Array<{
    message: any;
    deliverTime: number;
  }> = [];

  setConditions(config: NetworkConditions): void {
    this.latency = config.latency || 0;
    this.jitter = config.jitter || 0;
    this.packetLoss = config.packetLoss || 0;
    this.packetDuplication = config.packetDuplication || 0;
    this.outOfOrder = config.outOfOrder || 0;
    this.enabled = true;
  }

  // Presets for common conditions
  static presets = {
    perfect: { latency: 0, jitter: 0, packetLoss: 0 },
    lan: { latency: 5, jitter: 2, packetLoss: 0 },
    broadband: { latency: 30, jitter: 10, packetLoss: 0.01 },
    dsl: { latency: 50, jitter: 20, packetLoss: 0.02 },
    mobile3g: { latency: 100, jitter: 50, packetLoss: 0.05 },
    mobile4g: { latency: 50, jitter: 30, packetLoss: 0.02 },
    intercontinental: { latency: 150, jitter: 30, packetLoss: 0.01 },
    terrible: { latency: 300, jitter: 100, packetLoss: 0.1 }
  };

  send(message: any): void {
    if (!this.enabled) {
      this.deliver(message);
      return;
    }

    // Simulate packet loss
    if (Math.random() < this.packetLoss) {
      return; // Packet lost
    }

    // Calculate delivery time
    const jitterAmount = (Math.random() - 0.5) * 2 * this.jitter;
    const delay = this.latency + jitterAmount;
    const deliverTime = performance.now() + delay;

    // Queue message
    this.messageQueue.push({ message, deliverTime });

    // Simulate packet duplication
    if (Math.random() < this.packetDuplication) {
      const dupDelay = delay + Math.random() * 50;
      this.messageQueue.push({
        message,
        deliverTime: performance.now() + dupDelay
      });
    }

    // Simulate out-of-order delivery
    if (Math.random() < this.outOfOrder && this.messageQueue.length > 1) {
      // Swap with previous message
      const len = this.messageQueue.length;
      [this.messageQueue[len - 1], this.messageQueue[len - 2]] =
        [this.messageQueue[len - 2], this.messageQueue[len - 1]];
    }

    // Sort by delivery time
    this.messageQueue.sort((a, b) => a.deliverTime - b.deliverTime);
  }

  // Call each frame to deliver ready messages
  update(): any[] {
    const now = performance.now();
    const ready: any[] = [];

    while (this.messageQueue.length > 0 &&
           this.messageQueue[0].deliverTime <= now) {
      ready.push(this.messageQueue.shift()!.message);
    }

    return ready;
  }

  private deliver(message: any): void {
    // Direct delivery without simulation
  }
}

interface NetworkConditions {
  latency?: number;
  jitter?: number;
  packetLoss?: number;
  packetDuplication?: number;
  outOfOrder?: number;
}
```

### Debugging Tools

```typescript
class LagCompensationDebugger {
  private enabled: boolean = false;
  private historyVisualization: boolean = false;
  private hitboxVisualization: boolean = false;

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.enabled) return;

    // Show local player position
    this.renderLocalPlayer(ctx);

    // Show predicted position
    this.renderPrediction(ctx);

    // Show server-confirmed position
    this.renderServerPosition(ctx);

    // Show interpolation buffer states
    if (this.historyVisualization) {
      this.renderInterpolationHistory(ctx);
    }

    // Show hitboxes at different times
    if (this.hitboxVisualization) {
      this.renderHitboxHistory(ctx);
    }

    // Show network stats
    this.renderNetworkStats(ctx);
  }

  private renderNetworkStats(ctx: CanvasRenderingContext2D): void {
    const stats = this.network.getStats();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 120);

    ctx.fillStyle = 'white';
    ctx.font = '12px monospace';

    const lines = [
      `RTT: ${stats.rtt.toFixed(1)}ms`,
      `Jitter: ${stats.jitter.toFixed(1)}ms`,
      `Packet Loss: ${(stats.packetLoss * 100).toFixed(1)}%`,
      `Interp Delay: ${stats.interpolationDelay.toFixed(1)}ms`,
      `Prediction Error: ${stats.predictionError.toFixed(3)}`,
      `Pending Inputs: ${stats.pendingInputs}`
    ];

    lines.forEach((line, i) => {
      ctx.fillText(line, 20, 30 + i * 18);
    });
  }

  private renderHitboxHistory(ctx: CanvasRenderingContext2D): void {
    // Show hitboxes at different points in time
    const times = [-200, -150, -100, -50, 0]; // ms from current

    times.forEach((offset, index) => {
      const alpha = 0.2 + (index / times.length) * 0.6;
      ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;

      const state = this.lagCompensation.getStateAtTime(Date.now() + offset);
      if (state) {
        for (const [playerId, hitboxes] of state.hitboxes) {
          for (const hitbox of hitboxes) {
            this.renderHitbox(ctx, hitbox, state.positions.get(playerId)!);
          }
        }
      }
    });
  }
}
```

---

## Summary

Lag compensation is essential for creating responsive, fair multiplayer games. The key techniques are:

**Client-Side Prediction**
- Apply inputs locally before server confirmation
- Store inputs for reconciliation
- Smoothly correct prediction errors

**Entity Interpolation**
- Buffer remote entity states
- Render entities slightly in the past
- Extrapolate when data is late

**Server-Side Lag Compensation**
- Rewind world state for hit detection
- Balance shooter vs target fairness
- Implement anti-cheat validation

**Latency Hiding**
- Instant visual/audio feedback
- Predictive spawning
- Smooth animation blending

The goal is to make players feel like their actions have immediate impact while maintaining server authority and fairness across different network conditions.

---

## Further Reading

- [Valve's Latency Compensating Methods](https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization)
- [Gaffer On Games: Networked Physics](https://gafferongames.com/post/networked_physics_2004/)
- [Overwatch Netcode](https://www.youtube.com/watch?v=vTH2ZPgYujQ)
- [Rocket League Networking](https://www.youtube.com/watch?v=ueEmiDM94IE)
- [Halo's Network Architecture](https://www.gdcvault.com/play/1014345/I-Shot-You-First-Networking)
