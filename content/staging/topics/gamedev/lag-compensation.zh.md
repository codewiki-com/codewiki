---
title: 游戏网络延迟补偿技术详解
description: 深入掌握多人游戏延迟补偿技术：客户端预测、服务器和解、实体插值、命中检测与延迟隐藏策略
track: gamedev
section: gameplay-systems
difficulty: advanced
tags:
  - 延迟补偿
  - 网络代码
  - 预测
  - 插值
  - 多人游戏
  - 命中检测
status: imported
origin: old/src/content/docs/gamedev/lag-compensation.zh.md
divergence: 0.237
issues: []
legacy:
  category: GameDev
  subcategory: Networking
  order: 51
  lastUpdated: 2026-01-22
---

网络延迟是多人游戏中不可避免的现实。位于世界两端的玩家可能经历200毫秒或更长的往返延迟。如果没有适当的补偿技术，这种延迟会让游戏感觉迟钝、响应差且不公平。本指南涵盖了在实时多人游戏中隐藏和补偿网络延迟的核心技术。

## 理解网络延迟

### 延迟类型

```typescript
interface LatencyMetrics {
  // 往返时间 - 数据到达服务器并返回的时间
  rtt: number;

  // 单向延迟（约为RTT / 2）
  oneWay: number;

  // 抖动 - 延迟的变化
  jitter: number;

  // 丢包率
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

    // 计算抖动（标准差）
    const variance = this.pingHistory.reduce((sum, ping) =>
      sum + Math.pow(ping - avg, 2), 0) / this.pingHistory.length;
    const jitter = Math.sqrt(variance);

    // 从待处理ping中估算丢包率
    const now = performance.now();
    let lostPings = 0;
    for (const [seq, time] of this.pendingPings) {
      if (now - time > 5000) { // 5秒后认为丢失
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

  // 平滑RTT用于更稳定的预测
  getSmoothedRTT(): number {
    if (this.pingHistory.length === 0) return 0;

    // 指数加权移动平均
    let smoothed = this.pingHistory[0];
    const alpha = 0.125;

    for (let i = 1; i < this.pingHistory.length; i++) {
      smoothed = alpha * this.pingHistory[i] + (1 - alpha) * smoothed;
    }

    return smoothed;
  }
}
```

### 对游戏体验的影响

```
无延迟补偿（200ms RTT）：

帧0：玩家按下"向右移动"
     |
     +-- 输入发送到服务器（100ms）
     |
帧6：服务器收到输入
     服务器移动玩家
     |
     +-- 状态发送给客户端（100ms）
     |
帧12：客户端看到移动

结果：输入和视觉反馈之间200ms延迟
      - 感觉响应迟钝
      - 瞄准移动目标几乎不可能
      - 高延迟地区的玩家处于严重劣势
```

---

## 客户端预测

### 核心技术

客户端预测允许本地玩家在等待服务器确认之前立即看到其操作的结果。

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

  // 配置
  private readonly MAX_PREDICTION_ERROR = 0.5; // 单位
  private readonly CORRECTION_SMOOTHING = 0.2;

  constructor(initialState: PlayerState) {
    this.localState = { ...initialState };
  }

  // 每帧调用
  processInput(rawInput: RawInput, deltaTime: number): void {
    // 创建输入包
    const input: PlayerInput = {
      sequenceNumber: this.inputSequence++,
      timestamp: Date.now(),
      moveDirection: rawInput.moveDirection,
      rotation: rawInput.rotation,
      actions: rawInput.actions,
      deltaTime
    };

    // 本地应用输入（预测）
    this.applyInput(this.localState, input);

    // 存储用于和解
    this.pendingInputs.push(input);

    // 发送到服务器
    this.sendInput(input);

    // 清理旧输入（保留最近2秒）
    const cutoffTime = Date.now() - 2000;
    this.pendingInputs = this.pendingInputs.filter(i => i.timestamp > cutoffTime);
  }

  // 收到服务器状态时调用
  onServerUpdate(serverState: ServerStateUpdate): void {
    this.serverState = serverState.state;
    this.lastServerSequence = serverState.lastProcessedInput;

    // 移除已确认的输入
    this.pendingInputs = this.pendingInputs.filter(
      input => input.sequenceNumber > serverState.lastProcessedInput
    );

    // 和解
    this.reconcile();
  }

  private reconcile(): void {
    if (!this.serverState) return;

    // 从服务器状态开始
    const reconciledState: PlayerState = { ...this.serverState };

    // 重新应用未确认的输入
    for (const input of this.pendingInputs) {
      this.applyInput(reconciledState, input);
    }

    // 计算误差
    const error = this.calculatePositionError(
      this.localState.position,
      reconciledState.position
    );

    if (error > this.MAX_PREDICTION_ERROR) {
      // 大误差 - 直接跳转到正确位置
      console.warn(`大预测误差：${error.toFixed(2)}单位`);
      this.localState = reconciledState;
    } else if (error > 0.01) {
      // 小误差 - 平滑修正
      this.smoothCorrect(reconciledState);
    }
  }

  private smoothCorrect(targetState: PlayerState): void {
    // 向正确位置插值
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
    const speed = 10; // 每秒单位

    // 应用移动
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

    // 应用旋转
    state.rotation = input.rotation;

    // 处理动作
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

### 处理预测失败

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

    // 检测系统性预测问题
    if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS) {
      this.handleSystematicError();
    }
  }

  private handleSystematicError(): void {
    console.error('检测到系统性预测错误！');

    // 可能的原因：
    // 1. 客户端和服务器有不同的物理参数
    // 2. 输入处理顺序不同
    // 3. 浮点数差异
    // 4. 缺失或损坏的输入

    // 响应选项：
    // 1. 请求完整状态重新同步
    // 2. 增加和解频率
    // 3. 记录详细调试信息供分析
  }

  getAverageError(): number {
    if (this.errorHistory.length === 0) return 0;
    return this.errorHistory.reduce((a, b) => a + b, 0) / this.errorHistory.length;
  }
}
```

---

## 实体插值

### 远程实体的平滑显示

由于网络条件，远程实体以不规则间隔到达。插值确保平滑的视觉呈现。

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
  private readonly BUFFER_TIME_MS = 100; // 插值延迟
  private readonly MAX_SNAPSHOTS = 20;
  private readonly MAX_EXTRAPOLATE_MS = 250;

  addSnapshot(snapshot: EntitySnapshot): void {
    // 按时间顺序插入
    let insertIndex = this.snapshots.length;
    for (let i = this.snapshots.length - 1; i >= 0; i--) {
      if (this.snapshots[i].timestamp < snapshot.timestamp) {
        insertIndex = i + 1;
        break;
      }
      if (i === 0) insertIndex = 0;
    }
    this.snapshots.splice(insertIndex, 0, snapshot);

    // 清理旧快照
    while (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots.shift();
    }
  }

  getInterpolatedState(currentTime: number): EntitySnapshot | null {
    if (this.snapshots.length === 0) return null;

    // 计算渲染时间（在过去）
    const renderTime = currentTime - this.BUFFER_TIME_MS;

    // 找到包围的快照
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

    // 处理边界情况
    if (!before && !after) return null;
    if (!before) return after;
    if (!after) {
      // 需要外推
      return this.extrapolate(before, renderTime);
    }

    // 在快照之间插值
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

    // 限制外推时间
    const clampedDelta = Math.min(deltaTime, this.MAX_EXTRAPOLATE_MS / 1000);

    // 航位推算：位置 = 最后位置 + 速度 * 时间
    return {
      timestamp: targetTime,
      position: {
        x: lastKnown.position.x + lastKnown.velocity.x * clampedDelta,
        y: lastKnown.position.y + lastKnown.velocity.y * clampedDelta,
        z: lastKnown.position.z + lastKnown.velocity.z * clampedDelta
      },
      rotation: lastKnown.rotation, // 不外推旋转
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
    // 球面线性插值
    let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;

    // 处理负点积（取更短路径）
    let bx = b.x, by = b.y, bz = b.z, bw = b.w;
    if (dot < 0) {
      bx = -bx; by = -by; bz = -bz; bw = -bw;
      dot = -dot;
    }

    // 非常接近时使用线性插值
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

### 自适应插值延迟

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

    // 计算抖动的95百分位
    const sorted = [...this.jitterHistory].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const jitter95 = sorted[p95Index];

    // 最佳延迟 = 基础 + 抖动缓冲
    const optimalDelay = this.baseDelay + jitter95 * this.JITTER_MULTIPLIER;

    // 平滑过渡到新延迟
    this.currentDelay = this.currentDelay * 0.9 + optimalDelay * 0.1;

    // 限制在边界内
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

## 服务端延迟补偿

### 回溯时间进行命中检测

在FPS游戏中，服务器必须验证命中。但由于延迟，当玩家射击时，目标可能已经移动了。服务端延迟补偿将世界"回溯"到射手开火时目标所在的位置。

```typescript
interface HistoricalState {
  timestamp: number;
  positions: Map<PlayerId, Vector3>;
  hitboxes: Map<PlayerId, Hitbox[]>;
}

class ServerLagCompensation {
  private stateHistory: HistoricalState[] = [];
  private readonly HISTORY_DURATION_MS = 1000; // 保留1秒历史
  private readonly TICK_RATE = 60;

  // 每个服务器tick调用
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

    // 清理旧状态
    const cutoff = Date.now() - this.HISTORY_DURATION_MS;
    while (this.stateHistory.length > 0 && this.stateHistory[0].timestamp < cutoff) {
      this.stateHistory.shift();
    }
  }

  // 带延迟补偿验证射击
  validateShot(
    shooterId: PlayerId,
    targetId: PlayerId,
    shotTimestamp: number,
    shotOrigin: Vector3,
    shotDirection: Vector3,
    clientRTT: number
  ): HitResult {
    // 计算实际开火时间（考虑延迟）
    const estimatedFireTime = shotTimestamp - clientRTT / 2;

    // 限制在合理范围内（防止利用）
    const maxCompensation = Math.min(clientRTT + 100, 500); // 最大500ms
    const compensatedTime = Math.max(
      Date.now() - maxCompensation,
      estimatedFireTime
    );

    // 获取开火时的历史状态
    const historicalState = this.getStateAtTime(compensatedTime);
    if (!historicalState) {
      console.warn('没有可用的历史状态进行延迟补偿');
      return { hit: false, reason: 'no_history' };
    }

    // 获取开火时目标的位置/碰撞盒
    const targetPosition = historicalState.positions.get(targetId);
    const targetHitboxes = historicalState.hitboxes.get(targetId);

    if (!targetPosition || !targetHitboxes) {
      return { hit: false, reason: 'target_not_found' };
    }

    // 执行射线-碰撞盒相交检测
    const hitResult = this.raycastHitboxes(
      shotOrigin,
      shotDirection,
      targetHitboxes,
      targetPosition
    );

    if (hitResult.hit) {
      // 额外验证
      if (!this.validateHitPlausibility(shooterId, targetId, shotOrigin, compensatedTime)) {
        return { hit: false, reason: 'implausible' };
      }
    }

    return hitResult;
  }

  private getStateAtTime(timestamp: number): HistoricalState | null {
    if (this.stateHistory.length === 0) return null;

    // 找到包围的状态
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

    // 使用最近的状态（或插值以提高精度）
    if (!before) return after;
    if (!after) return before;

    // 在状态之间插值
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

    // 插值位置
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

    // 对于碰撞盒，如果t > 0.5使用"after"状态，否则使用"before"
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
      // 将碰撞盒转换到世界空间
      const worldHitbox = this.transformHitbox(hitbox, entityPosition);

      // 射线-AABB相交检测
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
    // 反作弊验证：

    // 1. 检查射手是否能看到目标（视线）
    // 2. 检查射击原点是否在射手实际位置附近
    // 3. 检查不可能的角度或距离
    // 4. 检查射速限制
    // 5. 检查武器射程

    return true; // 根据游戏规则实现
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

### 偏向射手 vs 偏向目标

```typescript
enum HitValidationMode {
  FAVOR_SHOOTER, // 如果从射手角度有效则接受命中
  FAVOR_TARGET,  // 只有目标无法躲避时才接受
  BALANCED       // 两者折中
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
    // 基于射手延迟的完全延迟补偿
    // 优点：射手看到命中按预期生效
    // 缺点：目标可能从他们的角度"在掩体后"死亡
    const compensation = Math.min(shooterRTT, this.maxLagCompensation);
    return this.checkHitAtTime(shotData, Date.now() - compensation);
  }

  private favorTargetValidation(shotData: ShotData, targetRTT: number): boolean {
    // 最小延迟补偿
    // 优点：目标的躲避更可能生效
    // 缺点：射手看到的"命中"实际"未命中"
    const compensation = Math.min(targetRTT / 2, 50);
    return this.checkHitAtTime(shotData, Date.now() - compensation);
  }

  private balancedValidation(
    shotData: ShotData,
    shooterRTT: number,
    targetRTT: number
  ): boolean {
    // 平均双方视角
    const avgRTT = (shooterRTT + targetRTT) / 2;
    const compensation = Math.min(avgRTT * 0.75, this.maxLagCompensation);
    return this.checkHitAtTime(shotData, Date.now() - compensation);
  }

  private checkHitAtTime(shotData: ShotData, timestamp: number): boolean {
    // 在给定时间戳执行实际命中检测
    return true; // 实现取决于游戏
  }
}
```

---

## 输入缓冲与时序

### 客户端输入缓冲

```typescript
class InputBuffer {
  private buffer: PlayerInput[] = [];
  private readonly BUFFER_SIZE = 3; // 帧输入缓冲
  private sendRate: number = 60; // 每秒输入数
  private lastSendTime: number = 0;

  addInput(input: PlayerInput): void {
    this.buffer.push(input);

    // 如果发送频率低于输入频率则打包多个输入
    const now = performance.now();
    const sendInterval = 1000 / this.sendRate;

    if (now - this.lastSendTime >= sendInterval) {
      this.flush();
      this.lastSendTime = now;
    }
  }

  private flush(): void {
    if (this.buffer.length === 0) return;

    // 一起发送所有缓冲的输入
    this.network.send({
      type: 'input_batch',
      inputs: this.buffer
    });

    this.buffer = [];
  }

  // 根据网络条件调整发送频率
  adaptToNetwork(rtt: number, packetLoss: number): void {
    // 更高丢包率 = 更频繁发送（冗余）
    // 更高RTT = 可以打包更多

    if (packetLoss > 0.05) {
      this.sendRate = 120; // 发送频率翻倍
    } else if (rtt > 150) {
      this.sendRate = 30; // 打包更多
    } else {
      this.sendRate = 60; // 默认
    }
  }
}
```

### 服务器输入处理

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
      // 忽略旧输入
      if (input.sequenceNumber <= lastProcessed) continue;

      // 忽略重复
      if (queue.some(i => i.sequenceNumber === input.sequenceNumber)) continue;

      // 按顺序插入
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

    // 防止队列过大
    while (queue.length > this.MAX_QUEUE_SIZE) {
      queue.shift();
    }
  }

  // 在服务器tick期间处理玩家输入
  processInputs(playerId: PlayerId, player: Player, deltaTime: number): void {
    const queue = this.inputQueues.get(playerId);
    if (!queue || queue.length === 0) {
      // 没有输入 - 使用最后已知或默认
      this.processDefaultInput(player, deltaTime);
      return;
    }

    // 按顺序处理下一个输入
    const input = queue.shift()!;
    this.applyInput(player, input);
    this.processedSequences.set(playerId, input.sequenceNumber);
  }

  private processDefaultInput(player: Player, deltaTime: number): void {
    // 没有输入时应用摩擦/减速
    player.velocity.x *= 0.9;
    player.velocity.z *= 0.9;

    // 仍然更新位置
    player.position.x += player.velocity.x * deltaTime;
    player.position.z += player.velocity.z * deltaTime;
  }

  getLastProcessedSequence(playerId: PlayerId): number {
    return this.processedSequences.get(playerId) || -1;
  }
}
```

---

## 延迟隐藏技术

### 视觉效果和反馈

```typescript
class LatencyHidingEffects {
  // 即时视觉反馈
  playShootEffect(weapon: Weapon, origin: Vector3, direction: Vector3): void {
    // 枪口闪光 - 即时
    this.particles.spawn('muzzle_flash', origin);

    // 曳光弹/子弹轨迹 - 即时
    this.spawnTracer(origin, direction, weapon.range);

    // 声音 - 即时
    this.audio.play(weapon.fireSound, origin);

    // 弹壳弹出 - 即时
    this.spawnShellCasing(origin, weapon.shellType);

    // 注意：命中确认稍后从服务器获得
  }

  // 乐观命中效果（客户端预测命中）
  playPredictedHitEffect(hitPoint: Vector3, surfaceType: string): void {
    // 生成临时命中效果
    const effect = this.particles.spawn('hit_' + surfaceType, hitPoint);

    // 如果服务器说没命中，这个效果可能需要取消
    return effect.id;
  }

  cancelHitEffect(effectId: string): void {
    this.particles.cancel(effectId);
  }

  // 确认命中效果
  playConfirmedHitEffect(hitData: HitConfirmation): void {
    // 血液/火花效果
    this.particles.spawn('confirmed_hit', hitData.point);

    // 命中声音
    this.audio.play('hit_confirm', hitData.point);

    // 准星命中标记UI
    this.ui.showHitmarker(hitData.damage, hitData.isHeadshot);

    // 伤害数字
    if (this.settings.showDamageNumbers) {
      this.ui.showDamageNumber(hitData.point, hitData.damage);
    }
  }
}
```

### 动画混合

```typescript
class NetworkedAnimation {
  private currentAnimation: string = 'idle';
  private targetAnimation: string = 'idle';
  private blendTime: number = 0.15; // 秒
  private blendProgress: number = 1;

  // 立即开始预测动画
  playPredictedAnimation(animation: string): void {
    if (animation !== this.targetAnimation) {
      this.currentAnimation = this.targetAnimation;
      this.targetAnimation = animation;
      this.blendProgress = 0;
    }
  }

  // 服务器确认动画 - 可能需要修正
  onServerAnimation(animation: string): void {
    if (animation !== this.targetAnimation) {
      // 服务器不同意 - 混合到服务器的动画
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

### 预测性生成

```typescript
class PredictiveSpawning {
  private predictedEntities: Map<string, PredictedEntity> = new Map();
  private predictionId: number = 0;

  // 在服务器确认前预测生成
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

    // 创建视觉表示
    this.spawnVisual(entity);

    return id;
  }

  // 服务器确认生成
  confirmSpawn(predictionId: string, serverId: string): void {
    const predicted = this.predictedEntities.get(predictionId);
    if (predicted) {
      predicted.confirmed = true;
      predicted.serverId = serverId;

      // 将视觉转移到真实实体
      this.transferToServerEntity(predicted, serverId);
      this.predictedEntities.delete(predictionId);
    }
  }

  // 服务器拒绝生成
  rejectSpawn(predictionId: string): void {
    const predicted = this.predictedEntities.get(predictionId);
    if (predicted) {
      // 移除预测视觉
      this.removeVisual(predicted.id);
      this.predictedEntities.delete(predictionId);
    }
  }

  // 清理过期预测
  update(): void {
    const now = Date.now();
    const maxAge = 2000; // 2秒

    for (const [id, entity] of this.predictedEntities) {
      if (!entity.confirmed && now - entity.createdAt > maxAge) {
        // 预测超时 - 移除
        this.removeVisual(id);
        this.predictedEntities.delete(id);
      }
    }
  }
}
```

---

## 最佳实践

### 用于测试的网络模拟

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

  // 常见条件预设
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

    // 模拟丢包
    if (Math.random() < this.packetLoss) {
      return; // 包丢失
    }

    // 计算交付时间
    const jitterAmount = (Math.random() - 0.5) * 2 * this.jitter;
    const delay = this.latency + jitterAmount;
    const deliverTime = performance.now() + delay;

    // 将消息入队
    this.messageQueue.push({ message, deliverTime });

    // 模拟包重复
    if (Math.random() < this.packetDuplication) {
      const dupDelay = delay + Math.random() * 50;
      this.messageQueue.push({
        message,
        deliverTime: performance.now() + dupDelay
      });
    }

    // 模拟乱序交付
    if (Math.random() < this.outOfOrder && this.messageQueue.length > 1) {
      // 与前一条消息交换
      const len = this.messageQueue.length;
      [this.messageQueue[len - 1], this.messageQueue[len - 2]] =
        [this.messageQueue[len - 2], this.messageQueue[len - 1]];
    }

    // 按交付时间排序
    this.messageQueue.sort((a, b) => a.deliverTime - b.deliverTime);
  }

  // 每帧调用以交付就绪的消息
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
    // 不模拟直接交付
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

### 调试工具

```typescript
class LagCompensationDebugger {
  private enabled: boolean = false;
  private historyVisualization: boolean = false;
  private hitboxVisualization: boolean = false;

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.enabled) return;

    // 显示本地玩家位置
    this.renderLocalPlayer(ctx);

    // 显示预测位置
    this.renderPrediction(ctx);

    // 显示服务器确认位置
    this.renderServerPosition(ctx);

    // 显示插值缓冲状态
    if (this.historyVisualization) {
      this.renderInterpolationHistory(ctx);
    }

    // 显示不同时间的碰撞盒
    if (this.hitboxVisualization) {
      this.renderHitboxHistory(ctx);
    }

    // 显示网络统计
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
      `抖动: ${stats.jitter.toFixed(1)}ms`,
      `丢包率: ${(stats.packetLoss * 100).toFixed(1)}%`,
      `插值延迟: ${stats.interpolationDelay.toFixed(1)}ms`,
      `预测误差: ${stats.predictionError.toFixed(3)}`,
      `待处理输入: ${stats.pendingInputs}`
    ];

    lines.forEach((line, i) => {
      ctx.fillText(line, 20, 30 + i * 18);
    });
  }

  private renderHitboxHistory(ctx: CanvasRenderingContext2D): void {
    // 显示不同时间点的碰撞盒
    const times = [-200, -150, -100, -50, 0]; // 从当前时间的毫秒偏移

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

## 总结

延迟补偿对于创建响应迅速、公平的多人游戏至关重要。关键技术包括：

**客户端预测**
- 在服务器确认前本地应用输入
- 存储输入用于和解
- 平滑修正预测误差

**实体插值**
- 缓冲远程实体状态
- 在略微过去的时间渲染实体
- 数据延迟时进行外推

**服务端延迟补偿**
- 回溯世界状态进行命中检测
- 平衡射手与目标的公平性
- 实现反作弊验证

**延迟隐藏**
- 即时视觉/音频反馈
- 预测性生成
- 平滑动画混合

目标是让玩家感觉他们的操作有即时影响，同时在不同网络条件下保持服务器权威性和公平性。

---

## 延伸阅读

- [Valve的延迟补偿方法](https://developer.valvesoftware.com/wiki/Latency_Compensating_Methods_in_Client/Server_In-game_Protocol_Design_and_Optimization)
- [Gaffer On Games：网络物理](https://gafferongames.com/post/networked_physics_2004/)
- [守望先锋网络代码](https://www.youtube.com/watch?v=vTH2ZPgYujQ)
- [火箭联盟网络](https://www.youtube.com/watch?v=ueEmiDM94IE)
- [光环网络架构](https://www.gdcvault.com/play/1014345/I-Shot-You-First-Networking)
