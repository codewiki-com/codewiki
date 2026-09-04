---
title: Game Anti-Cheat Techniques
description: "Protect multiplayer games: server authority, input validation, and anti-cheat strategies"
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - anti-cheat
  - security
  - validation
  - multiplayer
status: imported
origin: old/src/content/docs/gamedev/anti-cheat.en.md
divergence: 0.388
issues:
  - divergent
legacy:
  category: GameDev
  subcategory: Networking
  order: 25
  lastUpdated: 2026-01-07
---

Cheating in online games undermines fair competition, damages player experience, and can significantly impact a game's revenue and reputation. We cover anti-cheat techniques, from fundamental server architecture to advanced detection systems, helping developers build secure multiplayer games.

## Understanding Game Cheats

### Why Players Cheat

Before designing anti-cheat systems, it's essential to understand the motivations behind cheating:

- **Competitive advantage**: Winning at all costs
- **Frustration**: Overcoming perceived unfair game mechanics
- **Financial gain**: Real-money trading (RMT) of in-game items
- **Curiosity**: Exploring game boundaries and exploits
- **Social status**: Achieving high rankings or rare items

### Common Cheat Types

```
+------------------+----------------------------------+-------------------+
|   Cheat Type     |          Description             |     Examples      |
+------------------+----------------------------------+-------------------+
| Aimbots          | Auto-aim assistance              | FPS games         |
| Wallhacks        | See through walls/terrain        | Tactical shooters |
| Speed hacks      | Move faster than intended        | MMORPGs           |
| Teleportation    | Instant position changes         | Open world games  |
| ESP              | Extra sensory perception         | Battle royales    |
| Damage hacks     | Increased damage output          | RPGs, shooters    |
| God mode         | Invincibility                    | Any game          |
| Duplication      | Item/currency multiplication     | MMORPGs           |
| Bots             | Automated gameplay               | Farming games     |
| Packet editing   | Modify network traffic           | Any online game   |
+------------------+----------------------------------+-------------------+
```

### Cheat Implementation Methods

Cheaters employ various technical approaches:

```javascript
// How cheats typically work (for educational purposes)

// 1. Memory manipulation - Reading/writing game memory
// Cheaters use tools to find and modify values in RAM
// Example: Health value at memory address 0x12345678

// 2. DLL injection - Inserting malicious code into game process
// Hooks game functions to modify behavior

// 3. Packet manipulation - Intercepting and modifying network traffic
// Example: Changing position data before sending to server

// 4. Graphics driver hooks - Rendering additional information
// Example: Wallhacks by modifying depth buffer

// 5. Input simulation - Automated input for bots/aimbots
// Example: Programmatically moving mouse to target heads
```

## Server Authority Design

The most fundamental anti-cheat principle is **never trust the client**. The server should be the authoritative source of truth for all game state.

### Core Principles

```
Client-Server Trust Model:

+-------------+                    +-------------+
|   Client    |  ---[Input]--->   |   Server    |
|  (Untrusted)|                    | (Authority) |
|             |  <--[State]---     |             |
+-------------+                    +-------------+

Key Rules:
1. Client sends INPUTS, not state
2. Server validates ALL inputs
3. Server calculates ALL outcomes
4. Client only renders server state
5. Never expose sensitive logic to client
```

### Server-Authoritative Architecture

```javascript
// Server-side game state management

class GameServer {
  constructor() {
    this.players = new Map();
    this.gameState = {
      entities: [],
      items: [],
      projectiles: []
    };
    this.tickRate = 60; // 60 updates per second
  }

  // Process player input - NEVER trust client position
  processInput(playerId, input) {
    const player = this.players.get(playerId);
    if (!player) return;

    // Validate input structure
    if (!this.isValidInput(input)) {
      this.flagSuspiciousActivity(playerId, 'INVALID_INPUT');
      return;
    }

    // Server calculates new position based on input
    const newPosition = this.calculateMovement(player, input);

    // Validate the calculated position
    if (this.isValidPosition(newPosition)) {
      player.position = newPosition;
      player.lastInputTime = Date.now();
      player.lastInputSequence = input.sequence;
    } else {
      // Position would be invalid - reject and correct
      this.sendPositionCorrection(playerId, player.position);
    }
  }

  calculateMovement(player, input) {
    const deltaTime = 1 / this.tickRate;
    const maxSpeed = player.getMaxSpeed(); // Server-side value

    // Normalize input direction
    const direction = this.normalizeVector(input.direction);

    // Calculate velocity with server-side speed cap
    const velocity = {
      x: direction.x * maxSpeed * deltaTime,
      y: direction.y * maxSpeed * deltaTime,
      z: direction.z * maxSpeed * deltaTime
    };

    // Apply physics and collision detection server-side
    const newPosition = this.applyPhysics(player.position, velocity);

    return newPosition;
  }

  isValidInput(input) {
    // Check input structure
    if (typeof input !== 'object') return false;
    if (!input.hasOwnProperty('sequence')) return false;
    if (!input.hasOwnProperty('direction')) return false;

    // Check direction vector bounds
    const { x, y, z } = input.direction;
    if (Math.abs(x) > 1 || Math.abs(y) > 1 || Math.abs(z) > 1) {
      return false;
    }

    // Check for NaN or Infinity
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      return false;
    }

    return true;
  }

  isValidPosition(position) {
    // Check world bounds
    if (!this.isWithinWorldBounds(position)) return false;

    // Check collision with terrain and objects
    if (this.collidesWithGeometry(position)) return false;

    // Check for valid walkable area
    if (!this.isWalkable(position)) return false;

    return true;
  }
}
```

### Handling Client Prediction

Modern games use client-side prediction for responsiveness while maintaining server authority:

```javascript
// Client-side prediction with server reconciliation

class ClientPrediction {
  constructor() {
    this.pendingInputs = []; // Inputs waiting for server confirmation
    this.serverState = null;
    this.predictedState = null;
    this.sequenceNumber = 0;
  }

  // Apply input locally for immediate feedback
  applyInput(input) {
    input.sequence = ++this.sequenceNumber;
    input.timestamp = Date.now();

    // Store for later reconciliation
    this.pendingInputs.push(input);

    // Apply prediction locally
    this.predictedState = this.calculatePredictedState(
      this.predictedState || this.serverState,
      input
    );

    // Send to server
    this.sendToServer(input);
  }

  // Handle server state update
  onServerUpdate(serverState) {
    this.serverState = serverState;

    // Remove inputs that server has processed
    this.pendingInputs = this.pendingInputs.filter(
      input => input.sequence > serverState.lastProcessedInput
    );

    // Re-apply pending inputs on top of server state
    this.predictedState = this.pendingInputs.reduce(
      (state, input) => this.calculatePredictedState(state, input),
      { ...this.serverState }
    );

    // Check for significant desync (potential cheat detection)
    if (this.detectDesync()) {
      this.snapToServerState();
    }
  }

  detectDesync() {
    const threshold = 5.0; // Maximum allowed prediction error
    const distance = this.calculateDistance(
      this.predictedState.position,
      this.serverState.position
    );

    return distance > threshold;
  }

  snapToServerState() {
    // Force client to match server state
    this.predictedState = { ...this.serverState };
    this.pendingInputs = [];

    // Visual smoothing to hide the correction
    this.interpolateToPosition(this.serverState.position);
  }
}
```

## Input Validation

### Movement Validation

```javascript
class MovementValidator {
  constructor() {
    this.maxSpeed = 10.0; // Units per second
    this.maxAcceleration = 50.0;
    this.maxJumpHeight = 3.0;
    this.gravity = 9.81;
  }

  validateMovement(player, newPosition, deltaTime) {
    const results = {
      valid: true,
      violations: []
    };

    // 1. Speed check
    const speed = this.calculateSpeed(
      player.position,
      newPosition,
      deltaTime
    );

    if (speed > this.maxSpeed * 1.1) { // 10% tolerance for network jitter
      results.valid = false;
      results.violations.push({
        type: 'SPEED_HACK',
        expected: this.maxSpeed,
        actual: speed,
        severity: this.calculateSeverity(speed, this.maxSpeed)
      });
    }

    // 2. Teleportation check
    const distance = this.calculateDistance(player.position, newPosition);
    const maxPossibleDistance = this.maxSpeed * deltaTime * 1.5;

    if (distance > maxPossibleDistance) {
      results.valid = false;
      results.violations.push({
        type: 'TELEPORT',
        distance: distance,
        maxAllowed: maxPossibleDistance,
        severity: 'HIGH'
      });
    }

    // 3. Wall clipping check
    if (this.raycastCollision(player.position, newPosition)) {
      results.valid = false;
      results.violations.push({
        type: 'WALL_CLIP',
        from: player.position,
        to: newPosition,
        severity: 'MEDIUM'
      });
    }

    // 4. Vertical movement check (fly hack)
    if (!player.isFlying && !player.isJumping) {
      const verticalSpeed = Math.abs(
        newPosition.y - player.position.y
      ) / deltaTime;

      const maxVerticalSpeed = Math.sqrt(
        2 * this.gravity * this.maxJumpHeight
      );

      if (verticalSpeed > maxVerticalSpeed * 1.2) {
        results.valid = false;
        results.violations.push({
          type: 'FLY_HACK',
          verticalSpeed: verticalSpeed,
          maxAllowed: maxVerticalSpeed,
          severity: 'HIGH'
        });
      }
    }

    // 5. Ground check
    if (newPosition.y < this.getGroundHeight(newPosition.x, newPosition.z) - 0.1) {
      results.valid = false;
      results.violations.push({
        type: 'UNDERGROUND',
        severity: 'HIGH'
      });
    }

    return results;
  }

  calculateSpeed(pos1, pos2, deltaTime) {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return distance / deltaTime;
  }

  calculateSeverity(actual, expected) {
    const ratio = actual / expected;
    if (ratio > 5) return 'CRITICAL';
    if (ratio > 2) return 'HIGH';
    if (ratio > 1.5) return 'MEDIUM';
    return 'LOW';
  }
}
```

### Combat Validation

```javascript
class CombatValidator {
  constructor(gameConfig) {
    this.config = gameConfig;
    this.recentActions = new Map(); // Track recent actions per player
  }

  validateAttack(attacker, target, attackData) {
    const results = {
      valid: true,
      violations: [],
      adjustedDamage: attackData.damage
    };

    // 1. Range check
    const distance = this.calculateDistance(
      attacker.position,
      target.position
    );
    const weapon = this.getWeapon(attacker, attackData.weaponId);

    if (!weapon) {
      results.valid = false;
      results.violations.push({ type: 'INVALID_WEAPON' });
      return results;
    }

    if (distance > weapon.range * 1.1) {
      results.valid = false;
      results.violations.push({
        type: 'RANGE_HACK',
        distance: distance,
        weaponRange: weapon.range
      });
    }

    // 2. Fire rate check
    const lastAttackTime = this.getLastAttackTime(attacker.id, weapon.id);
    const timeSinceLastAttack = Date.now() - lastAttackTime;

    if (timeSinceLastAttack < weapon.fireRate * 0.9) { // 10% tolerance
      results.valid = false;
      results.violations.push({
        type: 'FIRE_RATE_HACK',
        timeBetween: timeSinceLastAttack,
        minRequired: weapon.fireRate
      });
    }

    // 3. Ammo check (server tracks ammo)
    if (weapon.requiresAmmo && attacker.ammo[weapon.ammoType] <= 0) {
      results.valid = false;
      results.violations.push({ type: 'NO_AMMO' });
    }

    // 4. Line of sight check
    if (!this.hasLineOfSight(attacker.position, target.position)) {
      results.valid = false;
      results.violations.push({ type: 'NO_LINE_OF_SIGHT' });
    }

    // 5. Damage validation (ensure server calculates damage)
    // Never trust client-reported damage
    results.adjustedDamage = this.calculateServerDamage(
      attacker,
      target,
      weapon,
      attackData
    );

    // 6. Headshot validation (for FPS games)
    if (attackData.isHeadshot) {
      if (!this.validateHeadshot(attacker, target, attackData)) {
        // Downgrade to body shot
        results.adjustedDamage = weapon.baseDamage;
        results.violations.push({
          type: 'INVALID_HEADSHOT',
          severity: 'LOW'
        });
      }
    }

    // Update attack timestamp
    this.recordAttack(attacker.id, weapon.id);

    return results;
  }

  calculateServerDamage(attacker, target, weapon, attackData) {
    let damage = weapon.baseDamage;

    // Apply attacker modifiers (from server-side stats)
    damage *= attacker.damageMultiplier || 1.0;

    // Apply target defense (server-side)
    damage *= (1 - target.damageReduction || 0);

    // Apply distance falloff
    const distance = this.calculateDistance(
      attacker.position,
      target.position
    );

    if (weapon.falloffStart && distance > weapon.falloffStart) {
      const falloffFactor = Math.max(
        0.5,
        1 - (distance - weapon.falloffStart) / weapon.falloffEnd
      );
      damage *= falloffFactor;
    }

    // Critical hit (server-side RNG)
    if (this.serverRandom() < attacker.critChance) {
      damage *= attacker.critMultiplier;
    }

    return Math.round(damage);
  }

  validateHeadshot(attacker, target, attackData) {
    // Server-side hitbox validation
    const headHitbox = this.getHeadHitbox(target);
    const shotRay = this.createRay(
      attacker.position,
      attackData.aimDirection
    );

    return this.rayIntersectsBox(shotRay, headHitbox);
  }
}
```

### Action Rate Limiting

```javascript
class ActionRateLimiter {
  constructor() {
    this.actionHistory = new Map();
    this.limits = {
      attack: { maxPerSecond: 10, windowMs: 1000 },
      jump: { maxPerSecond: 3, windowMs: 1000 },
      interact: { maxPerSecond: 5, windowMs: 1000 },
      chat: { maxPerSecond: 2, windowMs: 1000 },
      trade: { maxPerMinute: 10, windowMs: 60000 }
    };
  }

  checkRateLimit(playerId, actionType) {
    const limit = this.limits[actionType];
    if (!limit) return { allowed: true };

    const key = `${playerId}:${actionType}`;
    const now = Date.now();

    if (!this.actionHistory.has(key)) {
      this.actionHistory.set(key, []);
    }

    const history = this.actionHistory.get(key);

    // Remove old entries outside the window
    const windowStart = now - limit.windowMs;
    while (history.length > 0 && history[0] < windowStart) {
      history.shift();
    }

    // Calculate rate
    const maxActions = limit.maxPerSecond
      ? limit.maxPerSecond * (limit.windowMs / 1000)
      : limit.maxPerMinute;

    if (history.length >= maxActions) {
      return {
        allowed: false,
        retryAfter: history[0] + limit.windowMs - now,
        violation: {
          type: 'RATE_LIMIT_EXCEEDED',
          actionType: actionType,
          count: history.length,
          limit: maxActions,
          window: limit.windowMs
        }
      };
    }

    // Record this action
    history.push(now);

    return { allowed: true };
  }

  // Detect rapid action patterns (potential macro/bot)
  detectAutomatedPattern(playerId, actionType) {
    const key = `${playerId}:${actionType}`;
    const history = this.actionHistory.get(key);

    if (!history || history.length < 10) return false;

    // Calculate time intervals between actions
    const intervals = [];
    for (let i = 1; i < history.length; i++) {
      intervals.push(history[i] - history[i - 1]);
    }

    // Calculate standard deviation
    const mean = intervals.reduce((a, b) => a + b) / intervals.length;
    const variance = intervals.reduce(
      (sum, val) => sum + Math.pow(val - mean, 2),
      0
    ) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Too consistent timing suggests automation
    // Human input has natural variance
    const coefficientOfVariation = stdDev / mean;

    return coefficientOfVariation < 0.1; // Very low variance is suspicious
  }
}
```

## Speed and Position Checks

### Comprehensive Position Tracking

```javascript
class PositionTracker {
  constructor() {
    this.positionHistory = new Map();
    this.maxHistoryLength = 100;
    this.samplesPerSecond = 20;
  }

  recordPosition(playerId, position, timestamp) {
    if (!this.positionHistory.has(playerId)) {
      this.positionHistory.set(playerId, []);
    }

    const history = this.positionHistory.get(playerId);
    history.push({
      position: { ...position },
      timestamp: timestamp
    });

    // Trim old entries
    while (history.length > this.maxHistoryLength) {
      history.shift();
    }
  }

  analyzeMovement(playerId) {
    const history = this.positionHistory.get(playerId);
    if (!history || history.length < 2) return null;

    const analysis = {
      averageSpeed: 0,
      maxSpeed: 0,
      totalDistance: 0,
      anomalies: [],
      patterns: []
    };

    let totalSpeed = 0;
    let speedSamples = [];

    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];

      const deltaTime = (curr.timestamp - prev.timestamp) / 1000;
      if (deltaTime <= 0) continue;

      const distance = this.calculateDistance(prev.position, curr.position);
      const speed = distance / deltaTime;

      analysis.totalDistance += distance;
      totalSpeed += speed;
      speedSamples.push(speed);

      if (speed > analysis.maxSpeed) {
        analysis.maxSpeed = speed;
      }

      // Check for instant position changes (teleport)
      if (distance > 50 && deltaTime < 0.1) {
        analysis.anomalies.push({
          type: 'TELEPORT',
          timestamp: curr.timestamp,
          distance: distance,
          from: prev.position,
          to: curr.position
        });
      }
    }

    analysis.averageSpeed = totalSpeed / (history.length - 1);

    // Detect speed hack patterns
    const consistentHighSpeed = speedSamples.filter(
      s => s > this.maxAllowedSpeed * 0.9
    ).length / speedSamples.length;

    if (consistentHighSpeed > 0.8) {
      analysis.patterns.push({
        type: 'CONSISTENT_HIGH_SPEED',
        percentage: consistentHighSpeed,
        severity: 'HIGH'
      });
    }

    // Detect impossible direction changes
    this.detectImpossibleDirectionChanges(history, analysis);

    return analysis;
  }

  detectImpossibleDirectionChanges(history, analysis) {
    for (let i = 2; i < history.length; i++) {
      const p1 = history[i - 2].position;
      const p2 = history[i - 1].position;
      const p3 = history[i].position;

      const dir1 = this.normalizeVector({
        x: p2.x - p1.x,
        y: p2.y - p1.y,
        z: p2.z - p1.z
      });

      const dir2 = this.normalizeVector({
        x: p3.x - p2.x,
        y: p3.y - p2.y,
        z: p3.z - p2.z
      });

      // Calculate angle between directions
      const dot = dir1.x * dir2.x + dir1.y * dir2.y + dir1.z * dir2.z;
      const angle = Math.acos(Math.min(1, Math.max(-1, dot)));

      const deltaTime = (history[i].timestamp - history[i - 1].timestamp) / 1000;
      const speed1 = this.calculateDistance(p1, p2) / deltaTime;

      // High speed + sharp turn = suspicious
      if (angle > Math.PI * 0.75 && speed1 > this.maxAllowedSpeed * 0.8) {
        analysis.anomalies.push({
          type: 'IMPOSSIBLE_DIRECTION_CHANGE',
          timestamp: history[i].timestamp,
          angle: angle * (180 / Math.PI),
          speed: speed1
        });
      }
    }
  }

  calculateDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  normalizeVector(v) {
    const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (length === 0) return { x: 0, y: 0, z: 0 };
    return {
      x: v.x / length,
      y: v.y / length,
      z: v.z / length
    };
  }
}
```

### Physics Validation

```javascript
class PhysicsValidator {
  constructor(worldConfig) {
    this.gravity = worldConfig.gravity || 9.81;
    this.terminalVelocity = worldConfig.terminalVelocity || 50;
    this.maxJumpVelocity = worldConfig.maxJumpVelocity || 10;
  }

  validatePhysics(player, previousState, currentState, deltaTime) {
    const violations = [];

    // Validate vertical movement adheres to physics
    const expectedYVelocity = this.calculateExpectedYVelocity(
      previousState,
      deltaTime
    );

    const actualYVelocity = (currentState.position.y - previousState.position.y) / deltaTime;
    const velocityDifference = Math.abs(actualYVelocity - expectedYVelocity);

    // Allow some tolerance for network issues
    if (velocityDifference > 5 && !currentState.isOnGround) {
      violations.push({
        type: 'PHYSICS_VIOLATION',
        subtype: 'VERTICAL_VELOCITY',
        expected: expectedYVelocity,
        actual: actualYVelocity,
        difference: velocityDifference
      });
    }

    // Check for floating (not on ground but not falling)
    if (!currentState.isOnGround &&
        Math.abs(actualYVelocity) < 0.1 &&
        !player.hasAbility('fly') &&
        !player.hasAbility('hover')) {
      violations.push({
        type: 'PHYSICS_VIOLATION',
        subtype: 'FLOATING',
        position: currentState.position
      });
    }

    // Validate acceleration
    const prevVelocity = previousState.velocity || { x: 0, y: 0, z: 0 };
    const currVelocity = this.calculateVelocity(previousState, currentState, deltaTime);

    const acceleration = {
      x: (currVelocity.x - prevVelocity.x) / deltaTime,
      y: (currVelocity.y - prevVelocity.y) / deltaTime,
      z: (currVelocity.z - prevVelocity.z) / deltaTime
    };

    const horizontalAccel = Math.sqrt(
      acceleration.x * acceleration.x +
      acceleration.z * acceleration.z
    );

    if (horizontalAccel > player.maxAcceleration * 2) {
      violations.push({
        type: 'PHYSICS_VIOLATION',
        subtype: 'EXCESSIVE_ACCELERATION',
        acceleration: horizontalAccel,
        max: player.maxAcceleration
      });
    }

    return violations;
  }

  calculateExpectedYVelocity(previousState, deltaTime) {
    let velocity = previousState.velocity?.y || 0;

    if (!previousState.isOnGround) {
      // Apply gravity
      velocity -= this.gravity * deltaTime;

      // Cap at terminal velocity
      velocity = Math.max(velocity, -this.terminalVelocity);
    }

    return velocity;
  }

  calculateVelocity(prev, curr, deltaTime) {
    return {
      x: (curr.position.x - prev.position.x) / deltaTime,
      y: (curr.position.y - prev.position.y) / deltaTime,
      z: (curr.position.z - prev.position.z) / deltaTime
    };
  }
}
```

## Data Encryption and Integrity

### Secure Network Protocol

```javascript
class SecureGameProtocol {
  constructor() {
    this.encryptionKey = null;
    this.sequenceNumber = 0;
    this.sessionKey = null;
  }

  // Initialize secure session with key exchange
  async initializeSession(serverPublicKey) {
    // Generate client key pair
    const clientKeyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey']
    );

    // Derive shared secret
    this.sessionKey = await crypto.subtle.deriveKey(
      { name: 'ECDH', public: serverPublicKey },
      clientKeyPair.privateKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return clientKeyPair.publicKey;
  }

  // Encrypt game packet
  async encryptPacket(data) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const sequence = ++this.sequenceNumber;

    const payload = {
      sequence: sequence,
      timestamp: Date.now(),
      data: data
    };

    const encoded = new TextEncoder().encode(JSON.stringify(payload));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      this.sessionKey,
      encoded
    );

    // Combine IV and ciphertext
    const packet = new Uint8Array(iv.length + ciphertext.byteLength);
    packet.set(iv);
    packet.set(new Uint8Array(ciphertext), iv.length);

    return packet;
  }

  // Decrypt and validate game packet
  async decryptPacket(packet) {
    const iv = packet.slice(0, 12);
    const ciphertext = packet.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      this.sessionKey,
      ciphertext
    );

    const payload = JSON.parse(new TextDecoder().decode(decrypted));

    // Validate sequence number (prevent replay attacks)
    if (payload.sequence <= this.lastReceivedSequence) {
      throw new Error('Replay attack detected');
    }
    this.lastReceivedSequence = payload.sequence;

    // Validate timestamp (prevent delayed packets)
    const age = Date.now() - payload.timestamp;
    if (age > 5000) { // 5 second max age
      throw new Error('Packet too old');
    }

    return payload.data;
  }
}
```

### Packet Validation

```javascript
class PacketValidator {
  constructor() {
    this.expectedSequences = new Map();
    this.packetSignatures = new Map();
  }

  validatePacket(playerId, packet) {
    const errors = [];

    // 1. Check packet structure
    if (!this.isValidStructure(packet)) {
      errors.push({ type: 'INVALID_STRUCTURE' });
      return { valid: false, errors };
    }

    // 2. Check sequence number
    const expectedSeq = this.expectedSequences.get(playerId) || 0;
    if (packet.sequence < expectedSeq) {
      errors.push({
        type: 'REPLAY_ATTACK',
        expected: expectedSeq,
        received: packet.sequence
      });
    }
    this.expectedSequences.set(playerId, packet.sequence + 1);

    // 3. Verify checksum
    const calculatedChecksum = this.calculateChecksum(packet.data);
    if (calculatedChecksum !== packet.checksum) {
      errors.push({ type: 'CHECKSUM_MISMATCH' });
    }

    // 4. Check for known exploit patterns
    if (this.containsExploitPattern(packet.data)) {
      errors.push({ type: 'EXPLOIT_PATTERN_DETECTED' });
    }

    // 5. Validate packet size
    const packetSize = JSON.stringify(packet).length;
    if (packetSize > this.maxPacketSize) {
      errors.push({
        type: 'PACKET_TOO_LARGE',
        size: packetSize,
        max: this.maxPacketSize
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  calculateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  containsExploitPattern(data) {
    const exploitPatterns = [
      /\x00{10,}/,  // Null byte injection
      /\beval\s*\(/i,  // Code injection attempt
      /\b__proto__\b/,  // Prototype pollution
      /[\x80-\xFF]{50,}/  // Binary data injection
    ];

    const dataStr = JSON.stringify(data);
    return exploitPatterns.some(pattern => pattern.test(dataStr));
  }
}
```

### Sensitive Data Protection

```javascript
class SensitiveDataProtection {
  constructor() {
    // Never send these to client
    this.serverOnlyFields = [
      'secretSeed',
      'lootTableWeights',
      'damageFormulas',
      'aiDecisionWeights',
      'anticheatThresholds'
    ];
  }

  // Strip sensitive data before sending to client
  sanitizeForClient(gameState) {
    const sanitized = JSON.parse(JSON.stringify(gameState));

    // Remove server-only fields
    this.removeFields(sanitized, this.serverOnlyFields);

    // Remove other players' sensitive data
    if (sanitized.players) {
      for (const player of sanitized.players) {
        if (player.id !== sanitized.currentPlayerId) {
          delete player.inventory;
          delete player.questProgress;
          delete player.privateStats;
        }
      }
    }

    // Remove hidden entities
    if (sanitized.entities) {
      sanitized.entities = sanitized.entities.filter(
        entity => entity.isVisible !== false
      );
    }

    return sanitized;
  }

  removeFields(obj, fields) {
    if (typeof obj !== 'object' || obj === null) return;

    for (const field of fields) {
      delete obj[field];
    }

    for (const key in obj) {
      this.removeFields(obj[key], fields);
    }
  }

  // Validate that client isn't requesting restricted data
  validateDataRequest(playerId, request) {
    const restrictedPaths = [
      /^admin\./,
      /^players\.(?!self)\w+\.inventory/,
      /^serverConfig\./,
      /^anticheat\./
    ];

    for (const path of request.paths || []) {
      for (const pattern of restrictedPaths) {
        if (pattern.test(path)) {
          return {
            valid: false,
            error: `Access denied to path: ${path}`
          };
        }
      }
    }

    return { valid: true };
  }
}
```

## Anomaly Detection

### Statistical Anomaly Detection

```javascript
class StatisticalAnomalyDetector {
  constructor() {
    this.playerStats = new Map();
    this.globalBaselines = {
      killDeathRatio: { mean: 1.0, stdDev: 0.5 },
      headshotPercentage: { mean: 0.15, stdDev: 0.1 },
      accuracyPercentage: { mean: 0.25, stdDev: 0.15 },
      averageKillDistance: { mean: 20, stdDev: 10 },
      reactTime: { mean: 250, stdDev: 50 } // milliseconds
    };
  }

  analyzePlayer(playerId, sessionData) {
    const anomalies = [];

    // Calculate Z-scores for each metric
    for (const [metric, baseline] of Object.entries(this.globalBaselines)) {
      if (sessionData[metric] !== undefined) {
        const zScore = this.calculateZScore(
          sessionData[metric],
          baseline.mean,
          baseline.stdDev
        );

        if (Math.abs(zScore) > 3) { // 3 standard deviations
          anomalies.push({
            metric: metric,
            value: sessionData[metric],
            zScore: zScore,
            severity: this.getSeverity(zScore)
          });
        }
      }
    }

    // Check for impossible statistics
    if (sessionData.headshotPercentage > 0.8 && sessionData.kills > 20) {
      anomalies.push({
        type: 'IMPOSSIBLE_STAT',
        metric: 'headshotPercentage',
        value: sessionData.headshotPercentage,
        context: `${sessionData.kills} kills`,
        severity: 'CRITICAL'
      });
    }

    // Check for inhuman reaction times
    if (sessionData.reactTime < 100) { // < 100ms is humanly impossible
      anomalies.push({
        type: 'INHUMAN_REACTION',
        value: sessionData.reactTime,
        severity: 'CRITICAL'
      });
    }

    return anomalies;
  }

  calculateZScore(value, mean, stdDev) {
    return (value - mean) / stdDev;
  }

  getSeverity(zScore) {
    const absZ = Math.abs(zScore);
    if (absZ > 5) return 'CRITICAL';
    if (absZ > 4) return 'HIGH';
    if (absZ > 3) return 'MEDIUM';
    return 'LOW';
  }

  // Detect patterns over time
  detectTrendAnomalies(playerId, historicalSessions) {
    if (historicalSessions.length < 10) return [];

    const anomalies = [];

    // Sudden skill improvement detection
    const recentSessions = historicalSessions.slice(-5);
    const olderSessions = historicalSessions.slice(-20, -5);

    const metrics = ['killDeathRatio', 'headshotPercentage', 'accuracyPercentage'];

    for (const metric of metrics) {
      const recentAvg = this.average(recentSessions.map(s => s[metric]));
      const olderAvg = this.average(olderSessions.map(s => s[metric]));
      const olderStdDev = this.stdDev(olderSessions.map(s => s[metric]));

      // Sudden improvement of more than 3 standard deviations
      if ((recentAvg - olderAvg) > olderStdDev * 3) {
        anomalies.push({
          type: 'SUDDEN_SKILL_IMPROVEMENT',
          metric: metric,
          previousAverage: olderAvg,
          recentAverage: recentAvg,
          improvement: ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1) + '%'
        });
      }
    }

    return anomalies;
  }

  average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  stdDev(arr) {
    const avg = this.average(arr);
    const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.average(squareDiffs));
  }
}
```

### Behavioral Analysis

```javascript
class BehavioralAnalyzer {
  constructor() {
    this.inputPatterns = new Map();
    this.suspiciousPatterns = [];
  }

  analyzeInputPattern(playerId, inputs) {
    if (!this.inputPatterns.has(playerId)) {
      this.inputPatterns.set(playerId, []);
    }

    const patterns = this.inputPatterns.get(playerId);
    patterns.push(...inputs);

    // Keep last 1000 inputs
    while (patterns.length > 1000) {
      patterns.shift();
    }

    return this.detectAnomalousPatterns(patterns);
  }

  detectAnomalousPatterns(patterns) {
    const anomalies = [];

    // 1. Perfect input timing (inhuman consistency)
    const timingVariance = this.calculateTimingVariance(patterns);
    if (timingVariance < 1) { // Millisecond precision suggests automation
      anomalies.push({
        type: 'AUTOMATED_INPUT',
        subtype: 'PERFECT_TIMING',
        variance: timingVariance,
        severity: 'HIGH'
      });
    }

    // 2. Impossible input combinations
    const impossibleCombos = this.findImpossibleCombinations(patterns);
    anomalies.push(...impossibleCombos);

    // 3. Inhuman aiming patterns
    const aimAnalysis = this.analyzeAimPattern(patterns);
    if (aimAnalysis.suspicious) {
      anomalies.push(aimAnalysis);
    }

    // 4. Perfect tracking detection (aimbot signature)
    const trackingAnalysis = this.analyzeTracking(patterns);
    if (trackingAnalysis.isBot) {
      anomalies.push({
        type: 'AIMBOT_DETECTED',
        confidence: trackingAnalysis.confidence,
        evidence: trackingAnalysis.evidence
      });
    }

    return anomalies;
  }

  calculateTimingVariance(patterns) {
    const intervals = [];
    for (let i = 1; i < patterns.length; i++) {
      intervals.push(patterns[i].timestamp - patterns[i-1].timestamp);
    }

    if (intervals.length < 10) return Infinity;

    const mean = intervals.reduce((a, b) => a + b) / intervals.length;
    const variance = intervals.reduce(
      (sum, val) => sum + Math.pow(val - mean, 2),
      0
    ) / intervals.length;

    return variance;
  }

  findImpossibleCombinations(patterns) {
    const anomalies = [];

    for (let i = 0; i < patterns.length; i++) {
      const input = patterns[i];

      // Moving in opposite directions simultaneously
      if (input.moveForward && input.moveBackward) {
        anomalies.push({
          type: 'IMPOSSIBLE_INPUT',
          subtype: 'CONFLICTING_MOVEMENT',
          input: input
        });
      }

      // Instant 180-degree turns
      if (i > 0) {
        const prevAim = patterns[i-1].aimDirection;
        const currAim = input.aimDirection;
        const deltaTime = input.timestamp - patterns[i-1].timestamp;

        if (deltaTime < 16) { // Less than one frame at 60fps
          const angleDiff = this.calculateAngleDifference(prevAim, currAim);
          if (angleDiff > 170) { // Near 180-degree turn
            anomalies.push({
              type: 'IMPOSSIBLE_INPUT',
              subtype: 'INSTANT_TURN',
              angle: angleDiff,
              timeMs: deltaTime
            });
          }
        }
      }
    }

    return anomalies;
  }

  analyzeAimPattern(patterns) {
    const aimInputs = patterns.filter(p => p.aimDelta);
    if (aimInputs.length < 50) {
      return { suspicious: false };
    }

    // Analyze aim smoothness
    const smoothnessScores = [];
    for (let i = 2; i < aimInputs.length; i++) {
      const a1 = aimInputs[i-2].aimDelta;
      const a2 = aimInputs[i-1].aimDelta;
      const a3 = aimInputs[i].aimDelta;

      // Check for unnatural linear interpolation
      const predicted = {
        x: a1.x + (a2.x - a1.x),
        y: a1.y + (a2.y - a1.y)
      };

      const error = Math.sqrt(
        Math.pow(a3.x - predicted.x, 2) +
        Math.pow(a3.y - predicted.y, 2)
      );

      smoothnessScores.push(error);
    }

    const avgSmoothness = smoothnessScores.reduce((a, b) => a + b) / smoothnessScores.length;

    // Too smooth = likely aimbot
    if (avgSmoothness < 0.5) {
      return {
        suspicious: true,
        type: 'INHUMAN_AIM',
        subtype: 'TOO_SMOOTH',
        smoothnessScore: avgSmoothness,
        severity: 'HIGH'
      };
    }

    return { suspicious: false };
  }

  analyzeTracking(patterns) {
    // Find aim snap events (instant lock-on to targets)
    const snapEvents = [];

    for (let i = 1; i < patterns.length; i++) {
      const curr = patterns[i];
      const prev = patterns[i-1];

      if (curr.aimTarget && prev.aimTarget &&
          curr.aimTarget.id === prev.aimTarget.id) {

        const perfectTracking = this.isPerfectTracking(prev, curr);
        if (perfectTracking) {
          snapEvents.push({
            timestamp: curr.timestamp,
            targetId: curr.aimTarget.id
          });
        }
      }
    }

    const snapFrequency = snapEvents.length / patterns.length;

    return {
      isBot: snapFrequency > 0.3,
      confidence: Math.min(snapFrequency * 2, 1),
      evidence: snapEvents.slice(0, 10)
    };
  }

  isPerfectTracking(prev, curr) {
    // Check if aim moved exactly to target position
    const targetDelta = {
      x: curr.aimTarget.screenPos.x - prev.aimTarget.screenPos.x,
      y: curr.aimTarget.screenPos.y - prev.aimTarget.screenPos.y
    };

    const aimDelta = curr.aimDelta;

    const errorX = Math.abs(aimDelta.x - targetDelta.x);
    const errorY = Math.abs(aimDelta.y - targetDelta.y);

    return errorX < 1 && errorY < 1; // Pixel-perfect tracking
  }

  calculateAngleDifference(dir1, dir2) {
    const dot = dir1.x * dir2.x + dir1.y * dir2.y + dir1.z * dir2.z;
    return Math.acos(Math.min(1, Math.max(-1, dot))) * (180 / Math.PI);
  }
}
```

### Machine Learning Detection

```javascript
class MLAntiCheat {
  constructor() {
    this.model = null;
    this.featureExtractor = new FeatureExtractor();
  }

  async initialize() {
    // Load pre-trained model
    // In production, this would be a TensorFlow.js or ONNX model
    this.model = await this.loadModel('anticheat-model.json');
  }

  async analyzeSession(playerId, sessionData) {
    // Extract features from session data
    const features = this.featureExtractor.extract(sessionData);

    // Run inference
    const prediction = await this.model.predict(features);

    return {
      isCheating: prediction.probability > 0.8,
      probability: prediction.probability,
      confidence: prediction.confidence,
      suspectedCheatType: prediction.cheatType,
      contributingFactors: this.getContributingFactors(features, prediction)
    };
  }

  getContributingFactors(features, prediction) {
    // Analyze which features contributed most to detection
    const factors = [];

    if (features.headshotRatio > 0.5) {
      factors.push({
        feature: 'headshotRatio',
        value: features.headshotRatio,
        contribution: 'HIGH'
      });
    }

    if (features.aimSnapFrequency > 0.3) {
      factors.push({
        feature: 'aimSnapFrequency',
        value: features.aimSnapFrequency,
        contribution: 'HIGH'
      });
    }

    if (features.inputRegularity < 0.1) {
      factors.push({
        feature: 'inputRegularity',
        value: features.inputRegularity,
        contribution: 'MEDIUM'
      });
    }

    return factors;
  }
}

class FeatureExtractor {
  extract(sessionData) {
    return {
      // Combat features
      killDeathRatio: this.calculateKDR(sessionData),
      headshotRatio: this.calculateHeadshotRatio(sessionData),
      averageTimeToKill: this.calculateTTK(sessionData),
      damageAccuracy: this.calculateDamageAccuracy(sessionData),

      // Aim features
      aimSnapFrequency: this.calculateAimSnaps(sessionData),
      aimSmoothness: this.calculateAimSmoothness(sessionData),
      trackingAccuracy: this.calculateTracking(sessionData),
      reactionTime: this.calculateReactionTime(sessionData),

      // Movement features
      averageSpeed: this.calculateAverageSpeed(sessionData),
      speedVariance: this.calculateSpeedVariance(sessionData),
      pathEfficiency: this.calculatePathEfficiency(sessionData),

      // Input features
      inputFrequency: this.calculateInputFrequency(sessionData),
      inputRegularity: this.calculateInputRegularity(sessionData),
      inputComplexity: this.calculateInputComplexity(sessionData),

      // Temporal features
      sessionLength: sessionData.duration,
      peakPerformanceTime: this.findPeakPerformance(sessionData),
      consistencyOverTime: this.calculateConsistency(sessionData)
    };
  }

  calculateKDR(data) {
    return data.deaths > 0 ? data.kills / data.deaths : data.kills;
  }

  calculateHeadshotRatio(data) {
    return data.totalShots > 0 ? data.headshots / data.totalShots : 0;
  }

  calculateAimSnaps(data) {
    // Count sudden aim direction changes that result in kills
    let snaps = 0;
    const aimHistory = data.aimHistory || [];

    for (let i = 1; i < aimHistory.length; i++) {
      const prev = aimHistory[i-1];
      const curr = aimHistory[i];

      const deltaTime = curr.timestamp - prev.timestamp;
      const angleDelta = this.calculateAngle(prev.direction, curr.direction);

      // Snap: large angle change in short time followed by kill
      if (deltaTime < 50 && angleDelta > 45 && curr.hitEnemy) {
        snaps++;
      }
    }

    return snaps / Math.max(aimHistory.length, 1);
  }

  calculateInputRegularity(data) {
    const intervals = [];
    const inputs = data.inputs || [];

    for (let i = 1; i < inputs.length; i++) {
      intervals.push(inputs[i].timestamp - inputs[i-1].timestamp);
    }

    if (intervals.length < 10) return 1;

    const mean = intervals.reduce((a, b) => a + b) / intervals.length;
    const variance = intervals.reduce(
      (sum, val) => sum + Math.pow(val - mean, 2),
      0
    ) / intervals.length;

    // Normalize: low variance = high regularity (suspicious)
    return 1 / (1 + variance / 100);
  }

  calculateAngle(dir1, dir2) {
    const dot = dir1.x * dir2.x + dir1.y * dir2.y + (dir1.z || 0) * (dir2.z || 0);
    return Math.acos(Math.min(1, Math.max(-1, dot))) * (180 / Math.PI);
  }
}
```

## Reporting Systems

### Player Report System

```javascript
class ReportSystem {
  constructor(database) {
    this.db = database;
    this.reportThresholds = {
      reviewQueue: 3,    // Reports needed for manual review
      autoSuspend: 10,   // Reports for automatic temporary suspension
      priorityReview: 5  // Reports from trusted reporters
    };
  }

  async submitReport(reporterId, reportedPlayerId, details) {
    // Validate report
    const validation = await this.validateReport(reporterId, reportedPlayerId, details);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Calculate reporter trust score
    const reporterTrust = await this.getReporterTrustScore(reporterId);

    // Create report record
    const report = {
      id: this.generateReportId(),
      reporterId: reporterId,
      reportedPlayerId: reportedPlayerId,
      timestamp: Date.now(),
      cheatType: details.cheatType,
      description: details.description,
      matchId: details.matchId,
      evidence: details.evidence || [],
      reporterTrustScore: reporterTrust,
      status: 'PENDING',
      priority: this.calculatePriority(reporterTrust, details)
    };

    await this.db.reports.insert(report);

    // Check if threshold reached
    await this.checkThresholds(reportedPlayerId);

    // Attach relevant game data automatically
    await this.attachGameData(report);

    return {
      success: true,
      reportId: report.id,
      message: 'Report submitted successfully'
    };
  }

  async validateReport(reporterId, reportedPlayerId, details) {
    // Check if reporter is not reporting themselves
    if (reporterId === reportedPlayerId) {
      return { valid: false, error: 'Cannot report yourself' };
    }

    // Check for recent duplicate reports
    const recentReports = await this.db.reports.find({
      reporterId: reporterId,
      reportedPlayerId: reportedPlayerId,
      timestamp: { $gt: Date.now() - 24 * 60 * 60 * 1000 }
    });

    if (recentReports.length > 0) {
      return { valid: false, error: 'Already reported this player recently' };
    }

    // Check if reporter has report spam history
    const reporterStats = await this.getReporterStats(reporterId);
    if (reporterStats.falseReportRate > 0.8) {
      return { valid: false, error: 'Reporting privileges suspended' };
    }

    // Verify players were in same match
    if (details.matchId) {
      const match = await this.db.matches.findById(details.matchId);
      if (!match.players.includes(reporterId) ||
          !match.players.includes(reportedPlayerId)) {
        return { valid: false, error: 'Players not in same match' };
      }
    }

    return { valid: true };
  }

  async getReporterTrustScore(reporterId) {
    const stats = await this.getReporterStats(reporterId);

    // Base score
    let score = 50;

    // Adjust based on historical accuracy
    score += stats.confirmedReports * 5;
    score -= stats.falseReports * 10;

    // Account age bonus
    const accountAge = Date.now() - stats.accountCreated;
    const monthsOld = accountAge / (30 * 24 * 60 * 60 * 1000);
    score += Math.min(monthsOld * 2, 20);

    // Cap score
    return Math.max(0, Math.min(100, score));
  }

  calculatePriority(trustScore, details) {
    let priority = 0;

    // Higher trust = higher priority
    priority += trustScore / 10;

    // Evidence increases priority
    if (details.evidence?.length > 0) {
      priority += 20;
    }

    // Severe cheat types get higher priority
    const severityMap = {
      'aimbot': 30,
      'wallhack': 25,
      'speedhack': 25,
      'damage_hack': 30,
      'exploiting': 20,
      'griefing': 10
    };
    priority += severityMap[details.cheatType] || 10;

    return priority;
  }

  async checkThresholds(playerId) {
    const recentReports = await this.db.reports.find({
      reportedPlayerId: playerId,
      timestamp: { $gt: Date.now() - 7 * 24 * 60 * 60 * 1000 }, // Last 7 days
      status: 'PENDING'
    });

    const reportCount = recentReports.length;
    const trustedReports = recentReports.filter(r => r.reporterTrustScore > 70).length;

    // Auto-suspend for many reports
    if (reportCount >= this.reportThresholds.autoSuspend) {
      await this.temporarySuspend(playerId, 'Multiple reports received');
    }
    // Priority review for trusted reporters
    else if (trustedReports >= this.reportThresholds.priorityReview) {
      await this.escalateToPriorityReview(playerId);
    }
    // Regular review queue
    else if (reportCount >= this.reportThresholds.reviewQueue) {
      await this.addToReviewQueue(playerId);
    }
  }

  async attachGameData(report) {
    // Automatically collect evidence from the match
    const matchData = await this.db.matches.findById(report.matchId);
    if (!matchData) return;

    const playerStats = matchData.playerStats[report.reportedPlayerId];

    report.autoEvidence = {
      killDeathRatio: playerStats.kdr,
      headshotPercentage: playerStats.headshotRate,
      averageAccuracy: playerStats.accuracy,
      suspiciousEvents: await this.getSuspiciousEvents(
        report.reportedPlayerId,
        report.matchId
      ),
      movementAnomalies: await this.getMovementAnomalies(
        report.reportedPlayerId,
        report.matchId
      )
    };

    await this.db.reports.update(report.id, report);
  }
}
```

### Automated Evidence Collection

```javascript
class EvidenceCollector {
  constructor(gameServer) {
    this.server = gameServer;
    this.recordingBuffer = new Map(); // playerId -> circular buffer
    this.bufferDuration = 60000; // 60 seconds
  }

  // Continuously record player actions
  recordAction(playerId, action) {
    if (!this.recordingBuffer.has(playerId)) {
      this.recordingBuffer.set(playerId, new CircularBuffer(1000));
    }

    const buffer = this.recordingBuffer.get(playerId);
    buffer.push({
      timestamp: Date.now(),
      type: action.type,
      data: action.data,
      position: action.position,
      target: action.target
    });
  }

  // Extract evidence when suspicious activity detected
  async collectEvidence(playerId, triggerEvent) {
    const buffer = this.recordingBuffer.get(playerId);
    if (!buffer) return null;

    const evidence = {
      playerId: playerId,
      timestamp: Date.now(),
      trigger: triggerEvent,
      actions: buffer.getRecent(this.bufferDuration),
      statistics: await this.calculateStatistics(playerId),
      replay: await this.generateReplayData(playerId, triggerEvent.timestamp)
    };

    // Add screen recording if available (client-side capture)
    if (this.server.hasScreenCapture(playerId)) {
      evidence.screenCapture = await this.server.getScreenCapture(
        playerId,
        triggerEvent.timestamp - 10000,
        triggerEvent.timestamp + 5000
      );
    }

    return evidence;
  }

  async calculateStatistics(playerId) {
    const buffer = this.recordingBuffer.get(playerId);
    const actions = buffer.getAll();

    const stats = {
      totalActions: actions.length,
      actionBreakdown: {},
      averageActionsPerSecond: 0,
      peakActionsPerSecond: 0,
      suspiciousPatterns: []
    };

    // Count action types
    for (const action of actions) {
      stats.actionBreakdown[action.type] =
        (stats.actionBreakdown[action.type] || 0) + 1;
    }

    // Calculate actions per second
    const timeGroups = this.groupBySecond(actions);
    const apsValues = Object.values(timeGroups).map(g => g.length);
    stats.averageActionsPerSecond = apsValues.reduce((a, b) => a + b, 0) / apsValues.length;
    stats.peakActionsPerSecond = Math.max(...apsValues);

    // Find suspicious patterns
    stats.suspiciousPatterns = this.findSuspiciousPatterns(actions);

    return stats;
  }

  findSuspiciousPatterns(actions) {
    const patterns = [];

    // Check for impossibly fast actions
    for (let i = 1; i < actions.length; i++) {
      const timeDiff = actions[i].timestamp - actions[i-1].timestamp;

      if (timeDiff < 10 && actions[i].type === 'SHOOT') {
        patterns.push({
          type: 'RAPID_FIRE',
          timestamp: actions[i].timestamp,
          interval: timeDiff
        });
      }
    }

    // Check for perfect accuracy streaks
    const shootActions = actions.filter(a => a.type === 'SHOOT');
    let hitStreak = 0;
    for (const shoot of shootActions) {
      if (shoot.data.hit) {
        hitStreak++;
        if (hitStreak > 20) {
          patterns.push({
            type: 'PERFECT_ACCURACY_STREAK',
            length: hitStreak
          });
        }
      } else {
        hitStreak = 0;
      }
    }

    return patterns;
  }

  async generateReplayData(playerId, centerTimestamp) {
    const startTime = centerTimestamp - 15000;
    const endTime = centerTimestamp + 5000;

    // Get all relevant game state snapshots
    const snapshots = await this.server.getStateSnapshots(startTime, endTime);

    // Filter to relevant data
    return {
      duration: endTime - startTime,
      tickRate: this.server.tickRate,
      frames: snapshots.map(s => ({
        timestamp: s.timestamp,
        playerPosition: s.players[playerId]?.position,
        playerAim: s.players[playerId]?.aimDirection,
        playerActions: s.players[playerId]?.actions,
        nearbyPlayers: this.getNearbyPlayers(s, playerId),
        gameEvents: s.events.filter(e =>
          e.involves?.includes(playerId)
        )
      }))
    };
  }

  groupBySecond(actions) {
    const groups = {};
    for (const action of actions) {
      const second = Math.floor(action.timestamp / 1000);
      if (!groups[second]) groups[second] = [];
      groups[second].push(action);
    }
    return groups;
  }
}

class CircularBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.buffer = [];
    this.index = 0;
  }

  push(item) {
    if (this.buffer.length < this.capacity) {
      this.buffer.push(item);
    } else {
      this.buffer[this.index] = item;
    }
    this.index = (this.index + 1) % this.capacity;
  }

  getAll() {
    return [...this.buffer];
  }

  getRecent(durationMs) {
    const cutoff = Date.now() - durationMs;
    return this.buffer.filter(item => item.timestamp >= cutoff);
  }
}
```

## Commercial Anti-Cheat Solutions

### Overview of Popular Solutions

| Solution | Type | Platform | Key Features |
|----------|------|----------|--------------|
| EasyAntiCheat (EAC) | Kernel-level | PC | Fortnite, Apex Legends, Rust |
| BattlEye | Kernel-level | PC | PUBG, Rainbow Six Siege, DayZ |
| Vanguard | Kernel-level | PC | Valorant (runs at boot) |
| PunkBuster | User-level | PC | Battlefield series, older games |
| VAC | User-level | PC | Steam games, delayed bans |
| GameGuard | Kernel-level | PC | Korean MMOs |

### Integration Considerations

```javascript
// Example: Server-side integration with anti-cheat service

class AntiCheatIntegration {
  constructor(config) {
    this.provider = config.provider; // 'eac', 'battleye', etc.
    this.apiKey = config.apiKey;
    this.webhookUrl = config.webhookUrl;
  }

  // Verify client integrity before allowing connection
  async verifyClient(playerId, clientToken) {
    try {
      const response = await fetch(`${this.getApiUrl()}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playerId: playerId,
          token: clientToken,
          gameVersion: this.gameVersion
        })
      });

      const result = await response.json();

      return {
        verified: result.status === 'clean',
        trustLevel: result.trustLevel,
        flags: result.flags || []
      };
    } catch (error) {
      console.error('Anti-cheat verification failed:', error);
      // Fail open or closed depending on policy
      return { verified: false, error: 'Verification service unavailable' };
    }
  }

  // Report suspicious activity to anti-cheat service
  async reportSuspiciousActivity(playerId, activityData) {
    await fetch(`${this.getApiUrl()}/report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        playerId: playerId,
        timestamp: Date.now(),
        type: activityData.type,
        severity: activityData.severity,
        evidence: activityData.evidence
      })
    });
  }

  // Handle ban notifications from anti-cheat service
  async handleBanWebhook(webhookData) {
    const { playerId, banType, reason, duration } = webhookData;

    // Verify webhook authenticity
    if (!this.verifyWebhookSignature(webhookData)) {
      throw new Error('Invalid webhook signature');
    }

    // Apply ban in your system
    await this.banPlayer(playerId, {
      type: banType,
      reason: reason,
      duration: duration,
      source: 'ANTICHEAT_SERVICE'
    });

    // Disconnect player if online
    this.gameServer.disconnectPlayer(playerId, reason);
  }

  getApiUrl() {
    const urls = {
      'eac': 'https://api.easy.ac/v1',
      'battleye': 'https://api.battleye.com/v1',
      // etc.
    };
    return urls[this.provider];
  }
}
```

### Hybrid Approach

```javascript
// Combining multiple anti-cheat layers

class HybridAntiCheat {
  constructor() {
    this.layers = [
      new ServerAuthorityLayer(),
      new StatisticalDetectionLayer(),
      new BehavioralAnalysisLayer(),
      new ClientIntegrityLayer(),
      new ExternalServiceLayer()
    ];
  }

  async analyzePlayer(playerId, sessionData) {
    const results = [];

    // Run all layers in parallel
    const layerResults = await Promise.all(
      this.layers.map(layer => layer.analyze(playerId, sessionData))
    );

    // Combine results
    let totalConfidence = 0;
    let maxSeverity = 'LOW';
    const allFlags = [];

    for (const result of layerResults) {
      if (result.suspicious) {
        totalConfidence += result.confidence * result.weight;
        allFlags.push(...result.flags);

        if (this.severityRank(result.severity) > this.severityRank(maxSeverity)) {
          maxSeverity = result.severity;
        }
      }
    }

    // Normalize confidence
    const totalWeight = this.layers.reduce((sum, l) => sum + l.weight, 0);
    const normalizedConfidence = totalConfidence / totalWeight;

    return {
      isCheating: normalizedConfidence > 0.7,
      confidence: normalizedConfidence,
      severity: maxSeverity,
      flags: allFlags,
      recommendation: this.getRecommendation(normalizedConfidence, maxSeverity)
    };
  }

  severityRank(severity) {
    const ranks = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
    return ranks[severity] || 0;
  }

  getRecommendation(confidence, severity) {
    if (confidence > 0.95 && severity === 'CRITICAL') {
      return 'IMMEDIATE_BAN';
    }
    if (confidence > 0.8) {
      return 'TEMPORARY_SUSPENSION';
    }
    if (confidence > 0.6) {
      return 'MANUAL_REVIEW';
    }
    if (confidence > 0.4) {
      return 'INCREASED_MONITORING';
    }
    return 'NO_ACTION';
  }
}
```

## Best Practices Summary

### Defense in Depth

```
Anti-Cheat Defense Layers:

Layer 1: Server Authority
   - Never trust client
   - Server validates all actions
   - Server calculates outcomes

Layer 2: Input Validation
   - Rate limiting
   - Range checks
   - Physics validation

Layer 3: Statistical Detection
   - Track player metrics
   - Identify outliers
   - Pattern recognition

Layer 4: Behavioral Analysis
   - Timing patterns
   - Input consistency
   - Skill progression

Layer 5: Client Integrity
   - Memory protection
   - Anti-tampering
   - Signature verification

Layer 6: Community Reports
   - Player reporting
   - Trusted reporter system
   - Evidence collection

Layer 7: External Services
   - Commercial anti-cheat
   - Hardware bans
   - Shared ban lists
```

### Implementation Checklist

```javascript
const antiCheatChecklist = {
  serverSide: {
    'Server-authoritative game state': true,
    'Input validation': true,
    'Rate limiting': true,
    'Physics simulation on server': true,
    'Damage calculation on server': true,
    'Secure random number generation': true,
    'Encrypted network protocol': true,
    'Packet validation': true
  },

  detection: {
    'Statistical anomaly detection': true,
    'Behavioral analysis': true,
    'Speed/position tracking': true,
    'Aim pattern analysis': true,
    'Machine learning models': true,
    'Real-time monitoring': true
  },

  response: {
    'Graduated penalty system': true,
    'Evidence collection': true,
    'Player reporting system': true,
    'Manual review process': true,
    'Appeal system': true,
    'Hardware bans for repeat offenders': true
  },

  operations: {
    'Regular security audits': true,
    'Cheat community monitoring': true,
    'Rapid response team': true,
    'Ban wave strategy': true,
    'Metrics and analytics': true
  }
};
```

### Common Pitfalls to Avoid

1. **Trusting client data** - Never use client-reported position, health, or damage
2. **Insufficient validation** - Validate every input, not just obvious cheats
3. **Predictable detection** - Vary detection methods to prevent adaptation
4. **Instant bans** - Immediate bans reveal detection methods; use delayed/wave bans
5. **Ignoring false positives** - Always have appeal process; wrongful bans damage reputation
6. **Single point of failure** - Use multiple detection layers
7. **Static thresholds** - Adjust thresholds based on game updates and meta changes

## Interview Points

### Common Interview Questions

**Q1: How would you design an anti-cheat system for an FPS game?**

A: Key components would include:
1. Server-authoritative hit detection with server-side hitboxes
2. Input validation including fire rate limits and recoil pattern verification
3. Statistical analysis of accuracy, headshot ratio, and reaction times
4. Behavioral analysis to detect aimbot signatures (snap aiming, perfect tracking)
5. Integration with kernel-level anti-cheat for client integrity
6. Replay system for manual review of flagged players

**Q2: How do you balance false positives vs detection rate?**

A: Use a graduated response system:
- Low confidence: Increase monitoring
- Medium confidence: Manual review queue
- High confidence: Temporary restriction
- Very high confidence: Automated action

Also implement appeal processes and use ban waves rather than instant bans to avoid revealing detection methods.

**Q3: How do you prevent speed hacks?**

A: Multiple layers:
1. Server calculates all movement (never trust client position)
2. Validate velocity doesn't exceed max speed
3. Track position history to detect teleportation
4. Use physics simulation to validate movement paths
5. Check for wall clipping with server-side collision detection

**Q4: What's the difference between kernel-level and user-level anti-cheat?**

A:
- **Kernel-level**: Runs with system privileges, can detect deep hooks and memory manipulation, more invasive but more effective
- **User-level**: Runs in user space, easier to bypass but less privacy concerns

Most modern competitive games use kernel-level (EAC, BattlEye, Vanguard) for better protection.

## Further Reading

### Resources

- [Valve Anti-Cheat (VAC) Documentation](https://partner.steamgames.com/doc/features/anticheat)
- [EasyAntiCheat Developer Portal](https://www.easy.ac/en-us/)
- [BattlEye Developer Resources](https://www.battleye.com/)
- [Game Security Best Practices](https://www.gamedeveloper.com/programming/game-security)

### Academic Papers

- "Detecting Cheating in Online Games" - IEEE
- "Machine Learning Approaches to Anti-Cheat Systems"
- "Statistical Methods for Anomaly Detection in Multiplayer Games"

### Related Topics

- Network security and encryption
- Game server architecture
- Machine learning for fraud detection
- Digital forensics
- Behavioral biometrics

## Summary

Effective anti-cheat requires a multi-layered approach:

1. **Foundation**: Server-authoritative architecture where clients are never trusted
2. **Validation**: Comprehensive input validation including rate limiting, physics checks, and range verification
3. **Detection**: Statistical analysis, behavioral patterns, and machine learning
4. **Response**: Graduated penalty systems with evidence collection and appeal processes
5. **Operations**: Continuous monitoring, community engagement, and regular updates

Remember that anti-cheat is an ongoing battle. Cheat developers constantly adapt, so your systems must evolve too. The goal isn't to eliminate all cheating (impossible), but to make cheating difficult enough that most players choose to play fairly.
