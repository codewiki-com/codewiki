---
title: 游戏音效设计与触发系统
description: 掌握游戏音频设计：声音事件系统、空间音频、自适应音乐以及在游戏引擎中实现音频触发器
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - 音频
  - 音效设计
  - 游戏音频
  - 空间音频
  - FMOD
  - Wwise
status: imported
origin: old/src/content/docs/gamedev/game-sound-design.zh.md
divergence: 0.235
issues: []
legacy:
  category: GameDev
  subcategory: Audio
  order: 52
  lastUpdated: 2026-01-22
---

## 游戏音频简介

音效设计是游戏开发中至关重要但常被低估的方面。出色的音频可以增强沉浸感、提供反馈、引导玩家并创造情感冲击。本文涵盖游戏音效设计的基础知识、音频触发系统以及现代游戏的实现策略。

### 音频在游戏中的作用

```
游戏音频功能：
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  反馈                沉浸感              引导                │
│  ├─ UI 音效         ├─ 环境音           ├─ 音频提示         │
│  ├─ 动作反馈        ├─ 脚步声           ├─ 对话             │
│  ├─ 伤害音效        ├─ 环境效果         ├─ 警报             │
│  └─ 收集音效        └─ 天气             └─ 教程             │
│                                                              │
│  情感                交流                游戏性              │
│  ├─ 音乐            ├─ 配音             ├─ 敌人音效         │
│  ├─ 音效刺激        ├─ 旁白             ├─ 潜行提示         │
│  └─ 氛围            └─ 无线电通讯       └─ 距离感知         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 音频事件系统架构

### 基于事件的音频设计

现代游戏音频使用事件驱动系统而非直接播放声音：

```typescript
// 音频事件系统
interface SoundEvent {
  id: string;
  category: AudioCategory;
  sounds: SoundVariation[];
  parameters: EventParameter[];
  spatialSettings: SpatialSettings;
  playbackSettings: PlaybackSettings;
}

enum AudioCategory {
  SFX = 'sfx',
  Music = 'music',
  Voice = 'voice',
  Ambience = 'ambience',
  UI = 'ui'
}

interface SoundVariation {
  audioClip: string;
  weight: number; // 用于加权随机选择
  pitchVariation: { min: number; max: number };
  volumeVariation: { min: number; max: number };
}

interface EventParameter {
  name: string;
  defaultValue: number;
  range: { min: number; max: number };
  mapping: ParameterMapping; // 参数如何影响播放
}

interface SpatialSettings {
  is3D: boolean;
  minDistance: number;
  maxDistance: number;
  rolloffMode: 'linear' | 'logarithmic' | 'custom';
  dopplerLevel: number;
  spreadAngle: number;
}

interface PlaybackSettings {
  priority: number;
  maxInstances: number;
  stealingBehavior: 'oldest' | 'quietest' | 'furthest' | 'none';
  cooldown: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
}
```

### 音频管理器实现

```typescript
class AudioManager {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private categoryGains: Map<AudioCategory, GainNode> = new Map();
  private activeInstances: Map<string, SoundInstance[]> = new Map();
  private eventLibrary: Map<string, SoundEvent> = new Map();
  private listenerPosition: Vector3 = { x: 0, y: 0, z: 0 };
  private listenerForward: Vector3 = { x: 0, y: 0, z: -1 };
  private listenerUp: Vector3 = { x: 0, y: 1, z: 0 };

  constructor() {
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);

    // 创建类别子混音
    for (const category of Object.values(AudioCategory)) {
      const gain = this.audioContext.createGain();
      gain.connect(this.masterGain);
      this.categoryGains.set(category as AudioCategory, gain);
    }
  }

  // 注册音频事件
  public registerEvent(event: SoundEvent): void {
    this.eventLibrary.set(event.id, event);
  }

  // 播放音频事件
  public playEvent(
    eventId: string,
    position?: Vector3,
    parameters?: Record<string, number>
  ): SoundInstance | null {
    const event = this.eventLibrary.get(eventId);
    if (!event) {
      console.warn(`未找到音频事件: ${eventId}`);
      return null;
    }

    // 检查实例限制
    const instances = this.activeInstances.get(eventId) || [];
    if (instances.length >= event.playbackSettings.maxInstances) {
      const stolen = this.stealInstance(event, instances);
      if (!stolen) return null;
    }

    // 选择声音变体
    const variation = this.selectVariation(event.sounds);
    if (!variation) return null;

    // 创建实例
    const instance = new SoundInstance(
      this.audioContext,
      variation,
      event,
      position
    );

    // 应用参数
    if (parameters) {
      for (const [name, value] of Object.entries(parameters)) {
        instance.setParameter(name, value);
      }
    }

    // 连接到类别总线
    const categoryGain = this.categoryGains.get(event.category);
    if (categoryGain) {
      instance.connect(categoryGain);
    }

    // 跟踪实例
    if (!this.activeInstances.has(eventId)) {
      this.activeInstances.set(eventId, []);
    }
    this.activeInstances.get(eventId)!.push(instance);

    // 开始播放
    instance.play();

    // 处理完成时的清理
    instance.onEnded = () => {
      const arr = this.activeInstances.get(eventId);
      if (arr) {
        const index = arr.indexOf(instance);
        if (index >= 0) arr.splice(index, 1);
      }
    };

    return instance;
  }

  // 停止音频事件
  public stopEvent(eventId: string, fadeTime?: number): void {
    const instances = this.activeInstances.get(eventId);
    if (!instances) return;

    for (const instance of instances) {
      instance.stop(fadeTime);
    }
  }

  // 根据权重选择变体
  private selectVariation(sounds: SoundVariation[]): SoundVariation | null {
    if (sounds.length === 0) return null;

    const totalWeight = sounds.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const sound of sounds) {
      random -= sound.weight;
      if (random <= 0) return sound;
    }

    return sounds[sounds.length - 1];
  }

  // 实例抢占用于最大实例限制
  private stealInstance(event: SoundEvent, instances: SoundInstance[]): boolean {
    const behavior = event.playbackSettings.stealingBehavior;

    if (behavior === 'none') return false;

    let toSteal: SoundInstance | null = null;

    switch (behavior) {
      case 'oldest':
        toSteal = instances[0];
        break;

      case 'quietest':
        toSteal = instances.reduce((min, inst) =>
          inst.getCurrentVolume() < min.getCurrentVolume() ? inst : min
        );
        break;

      case 'furthest':
        if (this.listenerPosition) {
          toSteal = instances.reduce((max, inst) => {
            const distA = this.getDistance(inst.position, this.listenerPosition);
            const distB = this.getDistance(max.position, this.listenerPosition);
            return distA > distB ? inst : max;
          });
        }
        break;
    }

    if (toSteal) {
      toSteal.stop(0.1);
      return true;
    }

    return false;
  }

  private getDistance(a: Vector3 | undefined, b: Vector3): number {
    if (!a) return 0;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // 更新监听器位置用于 3D 音频
  public updateListener(position: Vector3, forward: Vector3, up: Vector3): void {
    this.listenerPosition = position;
    this.listenerForward = forward;
    this.listenerUp = up;

    // 更新 Web Audio API 监听器
    const listener = this.audioContext.listener;

    if (listener.positionX) {
      listener.positionX.setValueAtTime(position.x, this.audioContext.currentTime);
      listener.positionY.setValueAtTime(position.y, this.audioContext.currentTime);
      listener.positionZ.setValueAtTime(position.z, this.audioContext.currentTime);
      listener.forwardX.setValueAtTime(forward.x, this.audioContext.currentTime);
      listener.forwardY.setValueAtTime(forward.y, this.audioContext.currentTime);
      listener.forwardZ.setValueAtTime(forward.z, this.audioContext.currentTime);
      listener.upX.setValueAtTime(up.x, this.audioContext.currentTime);
      listener.upY.setValueAtTime(up.y, this.audioContext.currentTime);
      listener.upZ.setValueAtTime(up.z, this.audioContext.currentTime);
    }
  }

  // 音量控制
  public setMasterVolume(volume: number): void {
    this.masterGain.gain.setValueAtTime(
      Math.max(0, Math.min(1, volume)),
      this.audioContext.currentTime
    );
  }

  public setCategoryVolume(category: AudioCategory, volume: number): void {
    const gain = this.categoryGains.get(category);
    if (gain) {
      gain.gain.setValueAtTime(
        Math.max(0, Math.min(1, volume)),
        this.audioContext.currentTime
      );
    }
  }
}
```

### 声音实例类

```typescript
class SoundInstance {
  private audioContext: AudioContext;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private pannerNode: PannerNode | null = null;
  private variation: SoundVariation;
  private event: SoundEvent;
  public position: Vector3 | undefined;
  public onEnded: (() => void) | null = null;

  private parameters: Map<string, number> = new Map();
  private isPlaying: boolean = false;
  private startTime: number = 0;

  constructor(
    audioContext: AudioContext,
    variation: SoundVariation,
    event: SoundEvent,
    position?: Vector3
  ) {
    this.audioContext = audioContext;
    this.variation = variation;
    this.event = event;
    this.position = position;

    // 创建增益节点
    this.gainNode = audioContext.createGain();

    // 为 3D 声音创建声像器
    if (event.spatialSettings.is3D && position) {
      this.pannerNode = audioContext.createPanner();
      this.configurePanner();
      this.pannerNode.connect(this.gainNode);
    }

    // 初始化默认参数
    for (const param of event.parameters) {
      this.parameters.set(param.name, param.defaultValue);
    }
  }

  private configurePanner(): void {
    if (!this.pannerNode || !this.position) return;

    const spatial = this.event.spatialSettings;

    this.pannerNode.panningModel = 'HRTF';
    this.pannerNode.distanceModel = spatial.rolloffMode === 'linear'
      ? 'linear'
      : 'exponential';
    this.pannerNode.refDistance = spatial.minDistance;
    this.pannerNode.maxDistance = spatial.maxDistance;
    this.pannerNode.rolloffFactor = 1;

    this.pannerNode.positionX.setValueAtTime(
      this.position.x,
      this.audioContext.currentTime
    );
    this.pannerNode.positionY.setValueAtTime(
      this.position.y,
      this.audioContext.currentTime
    );
    this.pannerNode.positionZ.setValueAtTime(
      this.position.z,
      this.audioContext.currentTime
    );
  }

  public connect(destination: AudioNode): void {
    this.gainNode.connect(destination);
  }

  public async play(): Promise<void> {
    // 加载音频缓冲区
    const buffer = await this.loadAudioBuffer(this.variation.audioClip);
    if (!buffer) return;

    // 创建源
    this.source = this.audioContext.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = this.event.playbackSettings.loop;

    // 应用音高变化
    const pitchVar = this.variation.pitchVariation;
    const pitch = pitchVar.min + Math.random() * (pitchVar.max - pitchVar.min);
    this.source.playbackRate.value = pitch;

    // 应用音量变化
    const volVar = this.variation.volumeVariation;
    const volume = volVar.min + Math.random() * (volVar.max - volVar.min);
    this.gainNode.gain.value = volume;

    // 连接节点
    if (this.pannerNode) {
      this.source.connect(this.pannerNode);
    } else {
      this.source.connect(this.gainNode);
    }

    // 处理淡入
    if (this.event.playbackSettings.fadeIn > 0) {
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + this.event.playbackSettings.fadeIn
      );
    }

    // 处理结束
    this.source.onended = () => {
      this.isPlaying = false;
      if (this.onEnded) this.onEnded();
    };

    // 开始播放
    this.source.start();
    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime;
  }

  public stop(fadeTime: number = 0): void {
    if (!this.source || !this.isPlaying) return;

    if (fadeTime > 0) {
      this.gainNode.gain.linearRampToValueAtTime(
        0,
        this.audioContext.currentTime + fadeTime
      );
      setTimeout(() => {
        this.source?.stop();
      }, fadeTime * 1000);
    } else {
      this.source.stop();
    }
  }

  public setParameter(name: string, value: number): void {
    const param = this.event.parameters.find(p => p.name === name);
    if (!param) return;

    // 钳制值到范围内
    value = Math.max(param.range.min, Math.min(param.range.max, value));
    this.parameters.set(name, value);

    // 应用参数映射
    this.applyParameterMapping(param, value);
  }

  private applyParameterMapping(param: EventParameter, value: number): void {
    // 参数映射定义参数如何影响播放
    // 这将根据您的具体映射系统实现
  }

  public updatePosition(position: Vector3): void {
    this.position = position;
    if (this.pannerNode) {
      this.pannerNode.positionX.linearRampToValueAtTime(
        position.x,
        this.audioContext.currentTime + 0.05
      );
      this.pannerNode.positionY.linearRampToValueAtTime(
        position.y,
        this.audioContext.currentTime + 0.05
      );
      this.pannerNode.positionZ.linearRampToValueAtTime(
        position.z,
        this.audioContext.currentTime + 0.05
      );
    }
  }

  public getCurrentVolume(): number {
    return this.gainNode.gain.value;
  }

  private async loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error(`加载音频失败: ${url}`, error);
      return null;
    }
  }
}
```

---

## 音频触发系统

### 触发器类型

```typescript
// 音频触发器类型
enum TriggerType {
  Enter = 'enter',        // 玩家进入触发区域
  Exit = 'exit',          // 玩家离开触发区域
  Stay = 'stay',          // 玩家在区域内
  Event = 'event',        // 自定义游戏事件
  Animation = 'animation', // 动画事件
  Collision = 'collision', // 物理碰撞
  Proximity = 'proximity', // 基于距离
  Random = 'random',       // 随机间隔
  State = 'state'          // 状态机转换
}

interface AudioTrigger {
  id: string;
  type: TriggerType;
  eventId: string;         // 要播放的音频事件
  conditions: TriggerCondition[];
  parameters?: Record<string, number | ParameterBinding>;
  cooldown: number;
  probability: number;     // 0-1，触发概率
}

interface TriggerCondition {
  type: 'tag' | 'layer' | 'component' | 'state' | 'custom';
  value: any;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
}

interface ParameterBinding {
  source: 'velocity' | 'distance' | 'health' | 'custom';
  customSource?: string;
  curve?: AnimationCurve;  // 重映射值
}
```

### 音频触发区域

```typescript
class AudioTriggerZone {
  public id: string;
  public bounds: BoundingBox;
  public triggers: AudioTrigger[] = [];

  private audioManager: AudioManager;
  private entitiesInZone: Set<string> = new Set();
  private cooldowns: Map<string, number> = new Map();
  private activeInstances: Map<string, SoundInstance> = new Map();

  constructor(id: string, bounds: BoundingBox, audioManager: AudioManager) {
    this.id = id;
    this.bounds = bounds;
    this.audioManager = audioManager;
  }

  public addTrigger(trigger: AudioTrigger): void {
    this.triggers.push(trigger);
  }

  public update(entities: Entity[], deltaTime: number): void {
    // 更新冷却时间
    for (const [id, time] of this.cooldowns) {
      const newTime = time - deltaTime;
      if (newTime <= 0) {
        this.cooldowns.delete(id);
      } else {
        this.cooldowns.set(id, newTime);
      }
    }

    // 检查实体
    for (const entity of entities) {
      const wasInZone = this.entitiesInZone.has(entity.id);
      const isInZone = this.isInBounds(entity.position);

      if (isInZone && !wasInZone) {
        // 实体进入
        this.entitiesInZone.add(entity.id);
        this.handleTrigger(TriggerType.Enter, entity);
      } else if (!isInZone && wasInZone) {
        // 实体离开
        this.entitiesInZone.delete(entity.id);
        this.handleTrigger(TriggerType.Exit, entity);
      } else if (isInZone) {
        // 实体停留
        this.handleTrigger(TriggerType.Stay, entity);
      }
    }
  }

  private isInBounds(position: Vector3): boolean {
    return (
      position.x >= this.bounds.min.x && position.x <= this.bounds.max.x &&
      position.y >= this.bounds.min.y && position.y <= this.bounds.max.y &&
      position.z >= this.bounds.min.z && position.z <= this.bounds.max.z
    );
  }

  private handleTrigger(type: TriggerType, entity: Entity): void {
    for (const trigger of this.triggers) {
      if (trigger.type !== type) continue;

      // 检查冷却
      if (this.cooldowns.has(trigger.id)) continue;

      // 检查条件
      if (!this.checkConditions(trigger.conditions, entity)) continue;

      // 检查概率
      if (Math.random() > trigger.probability) continue;

      // 解析参数
      const params = this.resolveParameters(trigger.parameters, entity);

      // 播放声音
      const instance = this.audioManager.playEvent(
        trigger.eventId,
        entity.position,
        params
      );

      if (instance) {
        this.activeInstances.set(trigger.id, instance);
      }

      // 设置冷却
      if (trigger.cooldown > 0) {
        this.cooldowns.set(trigger.id, trigger.cooldown);
      }
    }
  }

  private checkConditions(
    conditions: TriggerCondition[],
    entity: Entity
  ): boolean {
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, entity)) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(
    condition: TriggerCondition,
    entity: Entity
  ): boolean {
    let actualValue: any;

    switch (condition.type) {
      case 'tag':
        actualValue = entity.tags;
        break;
      case 'layer':
        actualValue = entity.layer;
        break;
      case 'component':
        actualValue = entity.hasComponent(condition.value);
        return actualValue;
      case 'state':
        actualValue = entity.currentState;
        break;
      default:
        return true;
    }

    switch (condition.operator) {
      case 'equals':
        return actualValue === condition.value;
      case 'notEquals':
        return actualValue !== condition.value;
      case 'contains':
        return Array.isArray(actualValue) && actualValue.includes(condition.value);
      case 'greaterThan':
        return actualValue > condition.value;
      case 'lessThan':
        return actualValue < condition.value;
      default:
        return false;
    }
  }

  private resolveParameters(
    params: Record<string, number | ParameterBinding> | undefined,
    entity: Entity
  ): Record<string, number> {
    const result: Record<string, number> = {};
    if (!params) return result;

    for (const [name, value] of Object.entries(params)) {
      if (typeof value === 'number') {
        result[name] = value;
      } else {
        result[name] = this.resolveBinding(value, entity);
      }
    }

    return result;
  }

  private resolveBinding(binding: ParameterBinding, entity: Entity): number {
    let value: number;

    switch (binding.source) {
      case 'velocity':
        value = entity.velocity ?
          Math.sqrt(entity.velocity.x ** 2 + entity.velocity.y ** 2 + entity.velocity.z ** 2) :
          0;
        break;
      case 'distance':
        value = this.getDistanceFromCenter(entity.position);
        break;
      case 'health':
        value = entity.health ?? 1;
        break;
      case 'custom':
        value = entity.getCustomValue?.(binding.customSource!) ?? 0;
        break;
      default:
        value = 0;
    }

    // 如果定义了曲线则应用
    if (binding.curve) {
      value = binding.curve.evaluate(value);
    }

    return value;
  }

  private getDistanceFromCenter(position: Vector3): number {
    const center = {
      x: (this.bounds.min.x + this.bounds.max.x) / 2,
      y: (this.bounds.min.y + this.bounds.max.y) / 2,
      z: (this.bounds.min.z + this.bounds.max.z) / 2
    };
    const dx = position.x - center.x;
    const dy = position.y - center.y;
    const dz = position.z - center.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
```

### 动画事件音频

```typescript
class AnimationAudioHandler {
  private audioManager: AudioManager;
  private eventMappings: Map<string, string> = new Map(); // 动画事件 -> 音频事件

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
  }

  public registerAnimationEvent(
    animationEventName: string,
    soundEventId: string
  ): void {
    this.eventMappings.set(animationEventName, soundEventId);
  }

  public onAnimationEvent(
    eventName: string,
    entity: Entity,
    animationData?: any
  ): void {
    const soundEventId = this.eventMappings.get(eventName);
    if (!soundEventId) return;

    // 如果可用，从骨骼获取位置
    let position = entity.position;
    if (animationData?.boneName) {
      const bonePos = entity.getBoneWorldPosition?.(animationData.boneName);
      if (bonePos) position = bonePos;
    }

    // 从动画数据提取参数
    const params: Record<string, number> = {};
    if (animationData?.intensity) {
      params.intensity = animationData.intensity;
    }
    if (animationData?.surface) {
      params.surface = this.surfaceToNumber(animationData.surface);
    }

    this.audioManager.playEvent(soundEventId, position, params);
  }

  private surfaceToNumber(surface: string): number {
    // 将表面类型映射到数值用于参数控制
    const surfaceMap: Record<string, number> = {
      'concrete': 0,
      'wood': 1,
      'metal': 2,
      'grass': 3,
      'water': 4,
      'gravel': 5
    };
    return surfaceMap[surface] ?? 0;
  }
}

// 脚步系统示例
class FootstepSystem {
  private audioManager: AudioManager;
  private surfaceDetector: SurfaceDetector;

  private footstepEvents: Map<string, string> = new Map([
    ['concrete', 'footstep_concrete'],
    ['wood', 'footstep_wood'],
    ['metal', 'footstep_metal'],
    ['grass', 'footstep_grass'],
    ['water', 'footstep_water'],
    ['gravel', 'footstep_gravel']
  ]);

  constructor(audioManager: AudioManager, surfaceDetector: SurfaceDetector) {
    this.audioManager = audioManager;
    this.surfaceDetector = surfaceDetector;
  }

  public playFootstep(entity: Entity, footPosition: Vector3): void {
    // 检测表面类型
    const surface = this.surfaceDetector.getSurfaceAt(footPosition);
    const eventId = this.footstepEvents.get(surface) || 'footstep_default';

    // 从速度计算强度
    const speed = entity.velocity ?
      Math.sqrt(entity.velocity.x ** 2 + entity.velocity.z ** 2) :
      1;

    const params = {
      intensity: Math.min(speed / 10, 1),
      weight: entity.mass || 1
    };

    this.audioManager.playEvent(eventId, footPosition, params);
  }
}
```

---

## 空间音频

### 3D 音频实现

```typescript
class SpatialAudioSystem {
  private audioContext: AudioContext;
  private listener: AudioListener;
  private sources: Map<string, SpatialAudioSource> = new Map();

  // 遮挡/阻挡
  private occlusionRaycaster: Raycaster;
  private occlusionLayers: number;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.listener = audioContext.listener;
    this.occlusionRaycaster = new Raycaster();
    this.occlusionLayers = 1; // 默认碰撞层
  }

  public createSpatialSource(
    id: string,
    position: Vector3,
    options: SpatialSourceOptions
  ): SpatialAudioSource {
    const source = new SpatialAudioSource(
      this.audioContext,
      position,
      options
    );
    this.sources.set(id, source);
    return source;
  }

  public updateListener(
    position: Vector3,
    rotation: Quaternion
  ): void {
    // 从旋转提取前向和上向量
    const forward = this.rotateVector({ x: 0, y: 0, z: -1 }, rotation);
    const up = this.rotateVector({ x: 0, y: 1, z: 0 }, rotation);

    // 更新 Web Audio 监听器
    const listener = this.listener;
    const time = this.audioContext.currentTime;

    if (listener.positionX) {
      listener.positionX.setValueAtTime(position.x, time);
      listener.positionY.setValueAtTime(position.y, time);
      listener.positionZ.setValueAtTime(position.z, time);
      listener.forwardX.setValueAtTime(forward.x, time);
      listener.forwardY.setValueAtTime(forward.y, time);
      listener.forwardZ.setValueAtTime(forward.z, time);
      listener.upX.setValueAtTime(up.x, time);
      listener.upY.setValueAtTime(up.y, time);
      listener.upZ.setValueAtTime(up.z, time);
    }

    // 更新所有声源的遮挡
    this.updateOcclusion(position);
  }

  private updateOcclusion(listenerPosition: Vector3): void {
    for (const [id, source] of this.sources) {
      const sourcePos = source.getPosition();

      // 从监听器到声源的射线检测
      const direction = {
        x: sourcePos.x - listenerPosition.x,
        y: sourcePos.y - listenerPosition.y,
        z: sourcePos.z - listenerPosition.z
      };
      const distance = Math.sqrt(
        direction.x ** 2 + direction.y ** 2 + direction.z ** 2
      );

      // 归一化方向
      direction.x /= distance;
      direction.y /= distance;
      direction.z /= distance;

      // 检查障碍物
      const hits = this.occlusionRaycaster.cast(
        listenerPosition,
        direction,
        distance,
        this.occlusionLayers
      );

      // 计算遮挡因子
      let occlusion = 0;
      for (const hit of hits) {
        occlusion += hit.material?.occlusionFactor ?? 0.5;
      }
      occlusion = Math.min(occlusion, 1);

      source.setOcclusion(occlusion);
    }
  }

  private rotateVector(v: Vector3, q: Quaternion): Vector3 {
    // 四元数旋转
    const qx = q.x, qy = q.y, qz = q.z, qw = q.w;
    const vx = v.x, vy = v.y, vz = v.z;

    const ix = qw * vx + qy * vz - qz * vy;
    const iy = qw * vy + qz * vx - qx * vz;
    const iz = qw * vz + qx * vy - qy * vx;
    const iw = -qx * vx - qy * vy - qz * vz;

    return {
      x: ix * qw + iw * -qx + iy * -qz - iz * -qy,
      y: iy * qw + iw * -qy + iz * -qx - ix * -qz,
      z: iz * qw + iw * -qz + ix * -qy - iy * -qx
    };
  }
}
```

---

## 自适应音乐系统

### 音乐层系统

```typescript
interface MusicLayer {
  id: string;
  audioClip: string;
  volume: number;
  conditions: MusicCondition[];
}

interface MusicCondition {
  parameter: string;
  operator: 'equals' | 'greaterThan' | 'lessThan' | 'between';
  value: number | [number, number];
}

class AdaptiveMusicSystem {
  private audioContext: AudioContext;
  private layers: Map<string, MusicLayerPlayer> = new Map();
  private parameters: Map<string, number> = new Map();
  private masterGain: GainNode;
  private currentTempo: number = 120;
  private nextBeatTime: number = 0;
  private beatInterval: number;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.masterGain = audioContext.createGain();
    this.masterGain.connect(audioContext.destination);
    this.beatInterval = 60 / this.currentTempo;
  }

  public loadMusicTrack(layers: MusicLayer[]): void {
    for (const layer of layers) {
      const player = new MusicLayerPlayer(
        this.audioContext,
        layer,
        this.masterGain
      );
      this.layers.set(layer.id, player);
    }
  }

  public setParameter(name: string, value: number): void {
    this.parameters.set(name, value);
    this.updateLayers();
  }

  private updateLayers(): void {
    for (const [id, player] of this.layers) {
      const layer = player.getLayer();
      const shouldPlay = this.evaluateConditions(layer.conditions);

      if (shouldPlay && !player.isPlaying()) {
        // 在下一拍淡入
        player.fadeIn(this.nextBeatTime, 1.0);
      } else if (!shouldPlay && player.isPlaying()) {
        // 淡出
        player.fadeOut(this.nextBeatTime, 1.0);
      }
    }
  }

  private evaluateConditions(conditions: MusicCondition[]): boolean {
    for (const condition of conditions) {
      const value = this.parameters.get(condition.parameter) ?? 0;

      switch (condition.operator) {
        case 'equals':
          if (value !== condition.value) return false;
          break;
        case 'greaterThan':
          if (value <= (condition.value as number)) return false;
          break;
        case 'lessThan':
          if (value >= (condition.value as number)) return false;
          break;
        case 'between':
          const [min, max] = condition.value as [number, number];
          if (value < min || value > max) return false;
          break;
      }
    }
    return true;
  }

  public start(): void {
    // 启动所有层（它们将控制自己的音量）
    this.nextBeatTime = this.audioContext.currentTime;

    for (const player of this.layers.values()) {
      player.start(this.nextBeatTime);
    }

    // 开始节拍跟踪
    this.scheduleBeatTracking();
  }

  private scheduleBeatTracking(): void {
    const scheduleAhead = 0.1;

    const tick = () => {
      while (this.nextBeatTime < this.audioContext.currentTime + scheduleAhead) {
        this.nextBeatTime += this.beatInterval;
      }
      requestAnimationFrame(tick);
    };

    tick();
  }

  public transitionTo(
    newTrackLayers: MusicLayer[],
    transitionType: 'crossfade' | 'beatSync' | 'immediate'
  ): void {
    switch (transitionType) {
      case 'crossfade':
        this.crossfadeTransition(newTrackLayers, 2.0);
        break;
      case 'beatSync':
        this.beatSyncTransition(newTrackLayers);
        break;
      case 'immediate':
        this.immediateTransition(newTrackLayers);
        break;
    }
  }

  private crossfadeTransition(newLayers: MusicLayer[], duration: number): void {
    // 淡出当前层
    for (const player of this.layers.values()) {
      player.fadeOut(this.audioContext.currentTime, duration);
    }

    // 加载并淡入新层
    setTimeout(() => {
      this.layers.clear();
      this.loadMusicTrack(newLayers);
      this.start();
    }, duration * 1000);
  }

  private beatSyncTransition(newLayers: MusicLayer[]): void {
    // 等待下一小节（假设 4/4 拍）
    const beatsUntilBar = 4 - (Math.floor((this.audioContext.currentTime - this.nextBeatTime) / this.beatInterval) % 4);
    const transitionTime = this.nextBeatTime + beatsUntilBar * this.beatInterval;

    for (const player of this.layers.values()) {
      player.fadeOut(transitionTime, 0.5);
    }

    setTimeout(() => {
      this.layers.clear();
      this.loadMusicTrack(newLayers);
      this.start();
    }, (transitionTime - this.audioContext.currentTime) * 1000);
  }

  private immediateTransition(newLayers: MusicLayer[]): void {
    for (const player of this.layers.values()) {
      player.stop();
    }
    this.layers.clear();
    this.loadMusicTrack(newLayers);
    this.start();
  }
}
```

---

## 最佳实践

### 音频设计指南

```typescript
/**
 * 音频设计检查清单：
 *
 * 1. 变化性
 *    - 使用多个声音变体（最少 3-5 个）
 *    - 添加音高和音量随机化
 *    - 使用冷却时间避免机关枪效应
 *
 * 2. 优先级系统
 *    - 玩家动作：最高优先级
 *    - 战斗音效：高优先级
 *    - 环境音效：中优先级
 *    - 氛围音效：低优先级
 *
 * 3. 性能
 *    - 限制同时播放的声音数（通常 32-64）
 *    - 智能使用声音抢占
 *    - 流式传输大文件，解码小文件
 *
 * 4. 空间音频
 *    - 根据环境大小匹配衰减
 *    - 对墙壁使用遮挡
 *    - 考虑混响区域
 *
 * 5. 反馈
 *    - 即时响应（<50ms）
 *    - 清晰的因果关系
 *    - 一致的音量级别
 */

// 示例：设计良好的脚步系统
const footstepConfig: SoundEvent = {
  id: 'player_footstep',
  category: AudioCategory.SFX,
  sounds: [
    { audioClip: 'step_01.wav', weight: 1, pitchVariation: { min: 0.95, max: 1.05 }, volumeVariation: { min: 0.9, max: 1.0 } },
    { audioClip: 'step_02.wav', weight: 1, pitchVariation: { min: 0.95, max: 1.05 }, volumeVariation: { min: 0.9, max: 1.0 } },
    { audioClip: 'step_03.wav', weight: 1, pitchVariation: { min: 0.95, max: 1.05 }, volumeVariation: { min: 0.9, max: 1.0 } },
    { audioClip: 'step_04.wav', weight: 1, pitchVariation: { min: 0.95, max: 1.05 }, volumeVariation: { min: 0.9, max: 1.0 } }
  ],
  parameters: [
    { name: 'surface', defaultValue: 0, range: { min: 0, max: 5 }, mapping: null as any },
    { name: 'speed', defaultValue: 1, range: { min: 0, max: 2 }, mapping: null as any }
  ],
  spatialSettings: {
    is3D: true,
    minDistance: 1,
    maxDistance: 20,
    rolloffMode: 'logarithmic',
    dopplerLevel: 0,
    spreadAngle: 0
  },
  playbackSettings: {
    priority: 5,
    maxInstances: 4,
    stealingBehavior: 'oldest',
    cooldown: 0.1,
    fadeIn: 0,
    fadeOut: 0,
    loop: false
  }
};
```

---

## 总结

游戏音效设计是一门结合技术实现与创意艺术的多面学科。关键要点：

1. **基于事件的架构**：使用音频事件而非直接播放以获得灵活性
2. **触发系统**：实现健壮的触发系统用于游戏玩法集成
3. **空间音频**：利用 3D 定位、遮挡和距离衰减
4. **自适应音乐**：创建响应游戏玩法的动态音乐系统
5. **优化**：管理声音数量、使用池化、优先排序声音

设计良好的音频可以显著增强玩家沉浸感和游戏手感，使其成为游戏开发的关键方面。

---

## 延伸阅读

- "A Composer's Guide to Game Music" - Winifred Phillips
- FMOD 和 Wwise 文档
- Game Audio Programming 系列书籍 - Guy Somberg
- GDC 音频专题演讲
