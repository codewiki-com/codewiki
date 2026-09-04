---
title: 游戏音频系统设计
description: 构建完整的游戏音频系统：声音触发、3D空间化和音频管理
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - audio
  - sound effects
  - 3D audio
  - audio engine
status: imported
origin: old/src/content/docs/gamedev/game-audio.zh.md
divergence: 0.242
issues: []
legacy:
  category: GameDev
  subcategory: Audio
  order: 21
  lastUpdated: 2026-01-07
---

音频是游戏开发中的关键组件，对玩家沉浸感和体验有着重大影响。一个设计良好的音频系统需要处理声音触发、3D空间化、音量管理和性能优化。本指南涵盖从基础音频架构到与FMOD和Wwise等专业中间件集成的所有内容。

## 理解游戏音频架构

### 核心组件

游戏音频系统通常由几个相互连接的组件组成：

```
┌─────────────────────────────────────────────────────────────────┐
│                      游戏音频系统                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  音频管理器   │  │    声音池     │  │   混音器组    │       │
│  │   (单例)      │  │   (对象池)    │  │   (音量控制)  │       │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘       │
│          │                  │                  │               │
│          └──────────────────┼──────────────────┘               │
│                             │                                   │
│  ┌──────────────────────────┴──────────────────────────┐       │
│  │              音频源控制器                             │       │
│  │  (声音触发、3D定位、衰减)                            │       │
│  └──────────────────────────┬──────────────────────────┘       │
│                             │                                   │
│  ┌──────────────────────────┴──────────────────────────┐       │
│  │              平台音频后端                             │       │
│  │  (Web Audio API, Unity Audio, FMOD, Wwise)          │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 音频管理器单例

音频管理器作为所有音频操作的中心枢纽：

```typescript
// TypeScript 基础音频管理器实现
interface AudioConfig {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  spatialBlend: number;
  maxConcurrentSounds: number;
}

interface SoundEntry {
  id: string;
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
  isPlaying: boolean;
  loop: boolean;
  priority: number;
}

class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private musicGain: GainNode;
  private sfxGain: GainNode;
  private soundCache: Map<string, AudioBuffer>;
  private activeSounds: Map<string, SoundEntry>;
  private config: AudioConfig;

  private constructor() {
    this.audioContext = new AudioContext();
    this.soundCache = new Map();
    this.activeSounds = new Map();

    // 创建增益节点层级
    this.masterGain = this.audioContext.createGain();
    this.musicGain = this.audioContext.createGain();
    this.sfxGain = this.audioContext.createGain();

    // 连接增益节点
    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);

    this.config = {
      masterVolume: 1.0,
      musicVolume: 0.7,
      sfxVolume: 1.0,
      spatialBlend: 1.0,
      maxConcurrentSounds: 32
    };

    this.applyVolumes();
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private applyVolumes(): void {
    this.masterGain.gain.value = this.config.masterVolume;
    this.musicGain.gain.value = this.config.musicVolume;
    this.sfxGain.gain.value = this.config.sfxVolume;
  }

  public async loadSound(id: string, url: string): Promise<void> {
    if (this.soundCache.has(id)) {
      return; // 已加载
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.soundCache.set(id, audioBuffer);
    } catch (error) {
      console.error(`加载声音失败: ${id}`, error);
      throw error;
    }
  }

  public playSound(
    id: string,
    options: {
      loop?: boolean;
      volume?: number;
      isMusic?: boolean;
      priority?: number;
    } = {}
  ): string | null {
    const buffer = this.soundCache.get(id);
    if (!buffer) {
      console.warn(`声音未找到: ${id}`);
      return null;
    }

    // 检查并发声音限制
    if (this.activeSounds.size >= this.config.maxConcurrentSounds) {
      this.evictLowestPriority();
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop ?? false;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = options.volume ?? 1.0;

    source.connect(gainNode);
    gainNode.connect(options.isMusic ? this.musicGain : this.sfxGain);

    const instanceId = `${id}_${Date.now()}_${Math.random()}`;

    const entry: SoundEntry = {
      id: instanceId,
      source,
      gainNode,
      isPlaying: true,
      loop: options.loop ?? false,
      priority: options.priority ?? 0
    };

    this.activeSounds.set(instanceId, entry);

    source.onended = () => {
      entry.isPlaying = false;
      this.activeSounds.delete(instanceId);
    };

    source.start();
    return instanceId;
  }

  public stopSound(instanceId: string): void {
    const entry = this.activeSounds.get(instanceId);
    if (entry && entry.source) {
      entry.source.stop();
      this.activeSounds.delete(instanceId);
    }
  }

  public stopAllSounds(): void {
    for (const [id, entry] of this.activeSounds) {
      if (entry.source) {
        entry.source.stop();
      }
    }
    this.activeSounds.clear();
  }

  private evictLowestPriority(): void {
    let lowestPriority = Infinity;
    let lowestId: string | null = null;

    for (const [id, entry] of this.activeSounds) {
      if (entry.priority < lowestPriority) {
        lowestPriority = entry.priority;
        lowestId = id;
      }
    }

    if (lowestId) {
      this.stopSound(lowestId);
    }
  }

  public setMasterVolume(volume: number): void {
    this.config.masterVolume = Math.max(0, Math.min(1, volume));
    this.applyVolumes();
  }

  public setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    this.applyVolumes();
  }

  public setSFXVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
    this.applyVolumes();
  }

  public resumeContext(): void {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// 使用示例
const audioManager = AudioManager.getInstance();

async function initializeAudio() {
  await audioManager.loadSound('explosion', '/sounds/explosion.wav');
  await audioManager.loadSound('bgm', '/sounds/background_music.mp3');

  // 播放背景音乐
  audioManager.playSound('bgm', { loop: true, isMusic: true, volume: 0.5 });

  // 播放音效
  audioManager.playSound('explosion', { priority: 5 });
}
```

---

## 声音触发机制

### 基于事件的声音系统

现代游戏使用事件驱动的音频系统，将声音播放与游戏逻辑解耦：

```typescript
// 基于事件的音频系统
type SoundEventType =
  | 'player_jump'
  | 'player_land'
  | 'weapon_fire'
  | 'enemy_hit'
  | 'collectible_pickup'
  | 'ui_click'
  | 'ambient_loop';

interface SoundEvent {
  type: SoundEventType;
  position?: { x: number; y: number; z: number };
  volume?: number;
  pitch?: number;
  delay?: number;
}

interface SoundDefinition {
  sounds: string[];  // 用于变化的声音ID数组
  volumeRange: [number, number];
  pitchRange: [number, number];
  cooldown: number;  // 两次播放之间的最小时间
  maxInstances: number;
  priority: number;
  is3D: boolean;
}

class SoundEventSystem {
  private definitions: Map<SoundEventType, SoundDefinition>;
  private lastPlayTime: Map<SoundEventType, number>;
  private instanceCount: Map<SoundEventType, number>;
  private audioManager: AudioManager;

  constructor() {
    this.definitions = new Map();
    this.lastPlayTime = new Map();
    this.instanceCount = new Map();
    this.audioManager = AudioManager.getInstance();

    this.registerDefaultEvents();
  }

  private registerDefaultEvents(): void {
    // 注册声音定义
    this.registerEvent('player_jump', {
      sounds: ['jump_01', 'jump_02', 'jump_03'],
      volumeRange: [0.8, 1.0],
      pitchRange: [0.95, 1.05],
      cooldown: 100,
      maxInstances: 2,
      priority: 5,
      is3D: false
    });

    this.registerEvent('weapon_fire', {
      sounds: ['gunshot_01', 'gunshot_02'],
      volumeRange: [0.9, 1.0],
      pitchRange: [0.9, 1.1],
      cooldown: 50,
      maxInstances: 4,
      priority: 8,
      is3D: true
    });

    this.registerEvent('enemy_hit', {
      sounds: ['hit_01', 'hit_02', 'hit_03', 'hit_04'],
      volumeRange: [0.7, 1.0],
      pitchRange: [0.85, 1.15],
      cooldown: 30,
      maxInstances: 8,
      priority: 6,
      is3D: true
    });
  }

  public registerEvent(type: SoundEventType, definition: SoundDefinition): void {
    this.definitions.set(type, definition);
    this.lastPlayTime.set(type, 0);
    this.instanceCount.set(type, 0);
  }

  public trigger(event: SoundEvent): void {
    const definition = this.definitions.get(event.type);
    if (!definition) {
      console.warn(`未知声音事件: ${event.type}`);
      return;
    }

    const now = Date.now();
    const lastPlay = this.lastPlayTime.get(event.type) ?? 0;

    // 检查冷却
    if (now - lastPlay < definition.cooldown) {
      return;
    }

    // 检查最大实例数
    const currentInstances = this.instanceCount.get(event.type) ?? 0;
    if (currentInstances >= definition.maxInstances) {
      return;
    }

    // 选择随机声音变体
    const soundId = definition.sounds[
      Math.floor(Math.random() * definition.sounds.length)
    ];

    // 计算随机化的音量和音调
    const volume = this.randomInRange(definition.volumeRange) * (event.volume ?? 1.0);
    const pitch = this.randomInRange(definition.pitchRange) * (event.pitch ?? 1.0);

    // 更新跟踪
    this.lastPlayTime.set(event.type, now);
    this.instanceCount.set(event.type, currentInstances + 1);

    // 调度播放
    const playDelay = event.delay ?? 0;

    setTimeout(() => {
      this.playSound(soundId, {
        volume,
        pitch,
        position: event.position,
        is3D: definition.is3D,
        priority: definition.priority,
        onComplete: () => {
          const count = this.instanceCount.get(event.type) ?? 1;
          this.instanceCount.set(event.type, Math.max(0, count - 1));
        }
      });
    }, playDelay);
  }

  private randomInRange([min, max]: [number, number]): number {
    return min + Math.random() * (max - min);
  }

  private playSound(
    soundId: string,
    options: {
      volume: number;
      pitch: number;
      position?: { x: number; y: number; z: number };
      is3D: boolean;
      priority: number;
      onComplete: () => void;
    }
  ): void {
    // 实现取决于音频后端
    // 这将与AudioManager或3D音频系统集成
    console.log(`播放声音: ${soundId}`, options);
  }
}

// 在游戏代码中使用
const soundEvents = new SoundEventSystem();

// 在玩家控制器中
function onPlayerJump() {
  soundEvents.trigger({ type: 'player_jump' });
}

// 在武器系统中
function onWeaponFire(weaponPosition: { x: number; y: number; z: number }) {
  soundEvents.trigger({
    type: 'weapon_fire',
    position: weaponPosition
  });
}

// 在战斗系统中
function onEnemyHit(hitPosition: { x: number; y: number; z: number }, damage: number) {
  soundEvents.trigger({
    type: 'enemy_hit',
    position: hitPosition,
    volume: Math.min(1.0, damage / 100) // 根据伤害缩放音量
  });
}
```

### 动画同步音频

用于与动画精确同步：

```typescript
interface AnimationSoundMarker {
  frame: number;
  soundEvent: SoundEventType;
  offset?: number;  // 时间偏移（毫秒）
}

interface AnimationAudioTrack {
  animationName: string;
  markers: AnimationSoundMarker[];
  loops: boolean;
}

class AnimationAudioSync {
  private tracks: Map<string, AnimationAudioTrack>;
  private activeAnimations: Map<string, {
    track: AnimationAudioTrack;
    startTime: number;
    frameRate: number;
    triggeredMarkers: Set<number>;
  }>;
  private soundEvents: SoundEventSystem;

  constructor(soundEvents: SoundEventSystem) {
    this.tracks = new Map();
    this.activeAnimations = new Map();
    this.soundEvents = soundEvents;
  }

  public registerTrack(track: AnimationAudioTrack): void {
    this.tracks.set(track.animationName, track);
  }

  public startAnimation(
    entityId: string,
    animationName: string,
    frameRate: number
  ): void {
    const track = this.tracks.get(animationName);
    if (!track) return;

    this.activeAnimations.set(entityId, {
      track,
      startTime: Date.now(),
      frameRate,
      triggeredMarkers: new Set()
    });
  }

  public stopAnimation(entityId: string): void {
    this.activeAnimations.delete(entityId);
  }

  public update(): void {
    const now = Date.now();

    for (const [entityId, state] of this.activeAnimations) {
      const elapsedMs = now - state.startTime;
      const currentFrame = Math.floor(elapsedMs * state.frameRate / 1000);

      for (const marker of state.track.markers) {
        const markerKey = marker.frame;

        if (currentFrame >= marker.frame && !state.triggeredMarkers.has(markerKey)) {
          // 如果指定了偏移则应用
          const delay = marker.offset ?? 0;

          setTimeout(() => {
            this.soundEvents.trigger({ type: marker.soundEvent });
          }, Math.max(0, delay));

          state.triggeredMarkers.add(markerKey);
        }
      }

      // 处理循环动画
      if (state.track.loops) {
        const totalFrames = Math.max(...state.track.markers.map(m => m.frame)) + 1;
        if (currentFrame >= totalFrames) {
          state.startTime = now;
          state.triggeredMarkers.clear();
        }
      }
    }
  }
}

// 示例：为行走动画注册脚步声
const animSync = new AnimationAudioSync(soundEvents);

animSync.registerTrack({
  animationName: 'player_walk',
  loops: true,
  markers: [
    { frame: 5, soundEvent: 'player_land' },   // 左脚
    { frame: 15, soundEvent: 'player_land' },  // 右脚
  ]
});

animSync.registerTrack({
  animationName: 'sword_attack',
  loops: false,
  markers: [
    { frame: 8, soundEvent: 'weapon_fire', offset: -50 },  // 蓄力
    { frame: 12, soundEvent: 'enemy_hit' },                // 命中
  ]
});
```

---

## 3D空间音频

### Web Audio API 空间化

Web Audio API 通过 `PannerNode` 提供内置的3D音频支持：

```typescript
interface ListenerState {
  position: { x: number; y: number; z: number };
  forward: { x: number; y: number; z: number };
  up: { x: number; y: number; z: number };
}

interface SpatialSoundOptions {
  position: { x: number; y: number; z: number };
  refDistance: number;      // 音量为100%的距离
  maxDistance: number;      // 音量达到最小值的距离
  rolloffFactor: number;    // 音量随距离减小的速度
  coneInnerAngle: number;   // 全音量锥角
  coneOuterAngle: number;   // 降低音量锥角
  coneOuterGain: number;    // 外锥外的音量
}

class SpatialAudioSystem {
  private audioContext: AudioContext;
  private listener: AudioListener;
  private activeSources: Map<string, {
    source: AudioBufferSourceNode;
    panner: PannerNode;
    gainNode: GainNode;
  }>;

  constructor() {
    this.audioContext = new AudioContext();
    this.listener = this.audioContext.listener;
    this.activeSources = new Map();

    // 设置监听器默认值
    this.setListenerPosition({ x: 0, y: 0, z: 0 });
    this.setListenerOrientation(
      { x: 0, y: 0, z: -1 },  // 前向
      { x: 0, y: 1, z: 0 }    // 上向
    );
  }

  public setListenerPosition(position: { x: number; y: number; z: number }): void {
    if (this.listener.positionX) {
      // 现代API
      this.listener.positionX.setValueAtTime(position.x, this.audioContext.currentTime);
      this.listener.positionY.setValueAtTime(position.y, this.audioContext.currentTime);
      this.listener.positionZ.setValueAtTime(position.z, this.audioContext.currentTime);
    } else {
      // 旧版API
      this.listener.setPosition(position.x, position.y, position.z);
    }
  }

  public setListenerOrientation(
    forward: { x: number; y: number; z: number },
    up: { x: number; y: number; z: number }
  ): void {
    if (this.listener.forwardX) {
      // 现代API
      this.listener.forwardX.setValueAtTime(forward.x, this.audioContext.currentTime);
      this.listener.forwardY.setValueAtTime(forward.y, this.audioContext.currentTime);
      this.listener.forwardZ.setValueAtTime(forward.z, this.audioContext.currentTime);
      this.listener.upX.setValueAtTime(up.x, this.audioContext.currentTime);
      this.listener.upY.setValueAtTime(up.y, this.audioContext.currentTime);
      this.listener.upZ.setValueAtTime(up.z, this.audioContext.currentTime);
    } else {
      // 旧版API
      this.listener.setOrientation(
        forward.x, forward.y, forward.z,
        up.x, up.y, up.z
      );
    }
  }

  public playSpatialSound(
    buffer: AudioBuffer,
    options: SpatialSoundOptions,
    volume: number = 1.0
  ): string {
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const panner = this.audioContext.createPanner();
    this.configurePanner(panner, options);

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;

    // 连接：Source -> Gain -> Panner -> Destination
    source.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(this.audioContext.destination);

    const id = `spatial_${Date.now()}_${Math.random()}`;

    this.activeSources.set(id, { source, panner, gainNode });

    source.onended = () => {
      this.activeSources.delete(id);
    };

    source.start();
    return id;
  }

  private configurePanner(panner: PannerNode, options: SpatialSoundOptions): void {
    // 距离模型
    panner.distanceModel = 'inverse';
    panner.refDistance = options.refDistance;
    panner.maxDistance = options.maxDistance;
    panner.rolloffFactor = options.rolloffFactor;

    // 方向性（锥形）
    panner.coneInnerAngle = options.coneInnerAngle;
    panner.coneOuterAngle = options.coneOuterAngle;
    panner.coneOuterGain = options.coneOuterGain;

    // 平移模型（HRTF用于耳机，equalpower用于扬声器）
    panner.panningModel = 'HRTF';

    // 设置位置
    this.updateSoundPosition(panner, options.position);
  }

  private updateSoundPosition(
    panner: PannerNode,
    position: { x: number; y: number; z: number }
  ): void {
    if (panner.positionX) {
      panner.positionX.setValueAtTime(position.x, this.audioContext.currentTime);
      panner.positionY.setValueAtTime(position.y, this.audioContext.currentTime);
      panner.positionZ.setValueAtTime(position.z, this.audioContext.currentTime);
    } else {
      panner.setPosition(position.x, position.y, position.z);
    }
  }

  public updateSoundSourcePosition(
    id: string,
    position: { x: number; y: number; z: number }
  ): void {
    const source = this.activeSources.get(id);
    if (source) {
      this.updateSoundPosition(source.panner, position);
    }
  }

  public stopSound(id: string): void {
    const source = this.activeSources.get(id);
    if (source) {
      source.source.stop();
      this.activeSources.delete(id);
    }
  }
}

// 与游戏相机集成
class GameAudioListener {
  private spatialAudio: SpatialAudioSystem;

  constructor(spatialAudio: SpatialAudioSystem) {
    this.spatialAudio = spatialAudio;
  }

  public updateFromCamera(camera: {
    position: { x: number; y: number; z: number };
    rotation: { yaw: number; pitch: number };
  }): void {
    this.spatialAudio.setListenerPosition(camera.position);

    // 从旋转计算前向向量
    const forward = {
      x: Math.sin(camera.rotation.yaw) * Math.cos(camera.rotation.pitch),
      y: Math.sin(camera.rotation.pitch),
      z: -Math.cos(camera.rotation.yaw) * Math.cos(camera.rotation.pitch)
    };

    // 上向量（假设无横滚）
    const up = { x: 0, y: 1, z: 0 };

    this.spatialAudio.setListenerOrientation(forward, up);
  }
}
```

### 距离衰减模型

不同游戏场景的衰减模型：

```typescript
type DistanceModel = 'linear' | 'inverse' | 'exponential' | 'custom';

interface AttenuationConfig {
  model: DistanceModel;
  refDistance: number;
  maxDistance: number;
  rolloffFactor: number;
  customCurve?: (distance: number) => number;
}

class DistanceAttenuation {
  /**
   * 线性衰减：音量随距离线性减小
   * 适用于UI声音或简单环境
   */
  public static linear(
    distance: number,
    refDistance: number,
    maxDistance: number
  ): number {
    const clampedDistance = Math.max(refDistance, Math.min(distance, maxDistance));
    return 1 - (clampedDistance - refDistance) / (maxDistance - refDistance);
  }

  /**
   * 反比衰减：基于物理的真实衰减
   * 适用于室外环境
   */
  public static inverse(
    distance: number,
    refDistance: number,
    rolloffFactor: number
  ): number {
    return refDistance / (refDistance + rolloffFactor * (distance - refDistance));
  }

  /**
   * 指数衰减：快速衰减
   * 适用于有大量遮挡的室内环境
   */
  public static exponential(
    distance: number,
    refDistance: number,
    rolloffFactor: number
  ): number {
    return Math.pow(distance / refDistance, -rolloffFactor);
  }

  /**
   * 根据配置计算衰减
   */
  public static calculate(distance: number, config: AttenuationConfig): number {
    switch (config.model) {
      case 'linear':
        return this.linear(distance, config.refDistance, config.maxDistance);
      case 'inverse':
        return this.inverse(distance, config.refDistance, config.rolloffFactor);
      case 'exponential':
        return this.exponential(distance, config.refDistance, config.rolloffFactor);
      case 'custom':
        return config.customCurve?.(distance) ?? 1;
      default:
        return 1;
    }
  }
}

// 不同声音类型的衰减预设
const AttenuationPresets = {
  // 爆炸：远距离可听
  explosion: {
    model: 'inverse' as const,
    refDistance: 10,
    maxDistance: 500,
    rolloffFactor: 0.5
  },

  // 脚步声：短距离
  footsteps: {
    model: 'inverse' as const,
    refDistance: 1,
    maxDistance: 30,
    rolloffFactor: 2
  },

  // 对话：中等距离，急剧衰减
  dialogue: {
    model: 'exponential' as const,
    refDistance: 2,
    maxDistance: 20,
    rolloffFactor: 1.5
  },

  // 环境循环：非常缓慢的衰减
  ambient: {
    model: 'linear' as const,
    refDistance: 5,
    maxDistance: 100,
    rolloffFactor: 1
  }
};
```

---

## 音频对象池

### 高效的声音实例管理

对象池对于有大量音效的游戏性能至关重要：

```typescript
interface PooledAudioSource {
  id: string;
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode;
  pannerNode: PannerNode;
  isActive: boolean;
  buffer: AudioBuffer | null;
  startTime: number;
}

class AudioSourcePool {
  private audioContext: AudioContext;
  private destinationNode: AudioNode;
  private pool: PooledAudioSource[];
  private activeCount: number;
  private poolSize: number;

  constructor(
    audioContext: AudioContext,
    destination: AudioNode,
    poolSize: number = 32
  ) {
    this.audioContext = audioContext;
    this.destinationNode = destination;
    this.poolSize = poolSize;
    this.activeCount = 0;
    this.pool = [];

    this.initializePool();
  }

  private initializePool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      this.pool.push(this.createPooledSource(i));
    }
  }

  private createPooledSource(index: number): PooledAudioSource {
    const gainNode = this.audioContext.createGain();
    const pannerNode = this.audioContext.createPanner();

    // 设置连接链（暂时没有源）
    pannerNode.connect(gainNode);
    gainNode.connect(this.destinationNode);

    return {
      id: `pool_${index}`,
      sourceNode: null,
      gainNode,
      pannerNode,
      isActive: false,
      buffer: null,
      startTime: 0
    };
  }

  public acquire(): PooledAudioSource | null {
    // 查找非活动源
    const source = this.pool.find(s => !s.isActive);

    if (source) {
      source.isActive = true;
      this.activeCount++;
      return source;
    }

    // 池已耗尽 - 尝试抢占最旧的活动源
    return this.stealOldestSource();
  }

  private stealOldestSource(): PooledAudioSource | null {
    let oldest: PooledAudioSource | null = null;
    let oldestTime = Infinity;

    for (const source of this.pool) {
      if (source.isActive && source.startTime < oldestTime) {
        oldest = source;
        oldestTime = source.startTime;
      }
    }

    if (oldest) {
      this.release(oldest);
      oldest.isActive = true;
      this.activeCount++;
      return oldest;
    }

    return null;
  }

  public release(source: PooledAudioSource): void {
    if (!source.isActive) return;

    // 停止当前源节点（如果正在播放）
    if (source.sourceNode) {
      try {
        source.sourceNode.stop();
        source.sourceNode.disconnect();
      } catch (e) {
        // 源可能已经停止
      }
      source.sourceNode = null;
    }

    // 重置增益
    source.gainNode.gain.value = 1;

    // 重置平移器
    source.pannerNode.positionX?.setValueAtTime(0, this.audioContext.currentTime);
    source.pannerNode.positionY?.setValueAtTime(0, this.audioContext.currentTime);
    source.pannerNode.positionZ?.setValueAtTime(0, this.audioContext.currentTime);

    source.isActive = false;
    source.buffer = null;
    this.activeCount--;
  }

  public playSound(
    buffer: AudioBuffer,
    options: {
      volume?: number;
      loop?: boolean;
      position?: { x: number; y: number; z: number };
      onEnded?: () => void;
    } = {}
  ): PooledAudioSource | null {
    const source = this.acquire();
    if (!source) {
      console.warn('音频池已耗尽');
      return null;
    }

    // 创建新的源节点
    source.sourceNode = this.audioContext.createBufferSource();
    source.sourceNode.buffer = buffer;
    source.sourceNode.loop = options.loop ?? false;
    source.buffer = buffer;
    source.startTime = this.audioContext.currentTime;

    // 设置音量
    source.gainNode.gain.value = options.volume ?? 1;

    // 如果是3D则设置位置
    if (options.position) {
      const time = this.audioContext.currentTime;
      source.pannerNode.positionX?.setValueAtTime(options.position.x, time);
      source.pannerNode.positionY?.setValueAtTime(options.position.y, time);
      source.pannerNode.positionZ?.setValueAtTime(options.position.z, time);
    }

    // 连接并开始
    source.sourceNode.connect(source.pannerNode);

    source.sourceNode.onended = () => {
      this.release(source);
      options.onEnded?.();
    };

    source.sourceNode.start();
    return source;
  }

  public getStats(): { active: number; total: number; utilization: number } {
    return {
      active: this.activeCount,
      total: this.poolSize,
      utilization: this.activeCount / this.poolSize
    };
  }

  public releaseAll(): void {
    for (const source of this.pool) {
      if (source.isActive) {
        this.release(source);
      }
    }
  }
}
```

### 基于优先级的池管理

```typescript
enum SoundPriority {
  Low = 0,
  Normal = 1,
  High = 2,
  Critical = 3  // 永不抢占（UI声音、对话）
}

interface PrioritizedSound {
  source: PooledAudioSource;
  priority: SoundPriority;
  startTime: number;
  duration: number;
}

class PriorityAudioPool {
  private basePool: AudioSourcePool;
  private activeSounds: Map<string, PrioritizedSound>;

  constructor(audioContext: AudioContext, destination: AudioNode, poolSize: number) {
    this.basePool = new AudioSourcePool(audioContext, destination, poolSize);
    this.activeSounds = new Map();
  }

  public playSound(
    buffer: AudioBuffer,
    priority: SoundPriority,
    options: {
      volume?: number;
      loop?: boolean;
      position?: { x: number; y: number; z: number };
    } = {}
  ): string | null {
    // 尝试从池获取
    let source = this.basePool.acquire();

    // 如果池已耗尽，尝试抢占优先级较低的声音
    if (!source) {
      source = this.stealLowerPrioritySound(priority);
    }

    if (!source) {
      return null;
    }

    const playedSource = this.basePool.playSound(buffer, {
      ...options,
      onEnded: () => {
        this.activeSounds.delete(source!.id);
      }
    });

    if (playedSource) {
      this.activeSounds.set(playedSource.id, {
        source: playedSource,
        priority,
        startTime: Date.now(),
        duration: buffer.duration * 1000
      });
      return playedSource.id;
    }

    return null;
  }

  private stealLowerPrioritySound(requiredPriority: SoundPriority): PooledAudioSource | null {
    let lowestPriority = requiredPriority;
    let oldestTime = Infinity;
    let targetId: string | null = null;

    for (const [id, sound] of this.activeSounds) {
      // 永不抢占关键声音
      if (sound.priority === SoundPriority.Critical) continue;

      // 只抢占优先级较低或相等的声音
      if (sound.priority < lowestPriority ||
          (sound.priority === lowestPriority && sound.startTime < oldestTime)) {
        lowestPriority = sound.priority;
        oldestTime = sound.startTime;
        targetId = id;
      }
    }

    if (targetId) {
      const target = this.activeSounds.get(targetId);
      if (target) {
        this.basePool.release(target.source);
        this.activeSounds.delete(targetId);
        return this.basePool.acquire();
      }
    }

    return null;
  }
}
```

---

## 音频格式选择

### 格式对比

| 格式 | 大小 | 质量 | 浏览器支持 | 使用场景 |
|--------|------|---------|-----------------|----------|
| OGG Vorbis | 小 | 好 | 大多数（Safari除外）| 音乐、长循环 |
| MP3 | 中 | 好 | 通用 | 音乐备选 |
| WAV | 大 | 无损 | 通用 | 短音效 |
| AAC | 小 | 好 | 通用 | 音乐（Safari）|
| WebM (Opus) | 最小 | 优秀 | Chrome, Firefox | 语音、音乐 |

### 多格式加载策略

```typescript
interface AudioFormatInfo {
  extension: string;
  mimeType: string;
  priority: number;  // 越低越好
}

const AUDIO_FORMATS: AudioFormatInfo[] = [
  { extension: 'webm', mimeType: 'audio/webm; codecs=opus', priority: 1 },
  { extension: 'ogg', mimeType: 'audio/ogg; codecs=vorbis', priority: 2 },
  { extension: 'mp3', mimeType: 'audio/mpeg', priority: 3 },
  { extension: 'wav', mimeType: 'audio/wav', priority: 4 },
];

class AudioFormatDetector {
  private supportedFormats: Set<string>;
  private audioElement: HTMLAudioElement;

  constructor() {
    this.audioElement = document.createElement('audio');
    this.supportedFormats = new Set();
    this.detectSupport();
  }

  private detectSupport(): void {
    for (const format of AUDIO_FORMATS) {
      const canPlay = this.audioElement.canPlayType(format.mimeType);
      if (canPlay === 'probably' || canPlay === 'maybe') {
        this.supportedFormats.add(format.extension);
      }
    }
  }

  public getBestFormat(): string {
    // 返回按优先级排序的格式
    const sorted = AUDIO_FORMATS
      .filter(f => this.supportedFormats.has(f.extension))
      .sort((a, b) => a.priority - b.priority);

    return sorted[0]?.extension ?? 'mp3';
  }

  public isFormatSupported(extension: string): boolean {
    return this.supportedFormats.has(extension);
  }
}

class MultiFormatAudioLoader {
  private formatDetector: AudioFormatDetector;
  private audioContext: AudioContext;
  private cache: Map<string, AudioBuffer>;

  constructor(audioContext: AudioContext) {
    this.formatDetector = new AudioFormatDetector();
    this.audioContext = audioContext;
    this.cache = new Map();
  }

  /**
   * 使用自动格式选择加载音频
   * @param basePath 不带扩展名的路径（例如 '/sounds/explosion'）
   * @param formats 此声音可用的格式
   */
  public async load(
    basePath: string,
    formats: string[] = ['webm', 'ogg', 'mp3']
  ): Promise<AudioBuffer> {
    // 首先检查缓存
    if (this.cache.has(basePath)) {
      return this.cache.get(basePath)!;
    }

    // 查找最佳支持格式
    const sortedFormats = formats
      .map(ext => AUDIO_FORMATS.find(f => f.extension === ext))
      .filter((f): f is AudioFormatInfo => f !== undefined)
      .filter(f => this.formatDetector.isFormatSupported(f.extension))
      .sort((a, b) => a.priority - b.priority);

    if (sortedFormats.length === 0) {
      throw new Error(`未找到 ${basePath} 的支持音频格式`);
    }

    // 按优先级顺序尝试加载
    for (const format of sortedFormats) {
      try {
        const url = `${basePath}.${format.extension}`;
        const response = await fetch(url);

        if (!response.ok) continue;

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

        this.cache.set(basePath, audioBuffer);
        return audioBuffer;
      } catch (error) {
        console.warn(`加载 ${basePath}.${format.extension} 失败`, error);
        continue;
      }
    }

    throw new Error(`加载音频失败: ${basePath}`);
  }

  /**
   * 预加载多个声音
   */
  public async preloadAll(sounds: string[]): Promise<void> {
    const promises = sounds.map(sound => this.load(sound).catch(e => {
      console.error(`预加载失败: ${sound}`, e);
      return null;
    }));

    await Promise.all(promises);
  }
}

// 使用
const loader = new MultiFormatAudioLoader(new AudioContext());

// 将自动选择最佳格式
await loader.load('/sounds/explosion');  // 加载 .webm, .ogg 或 .mp3
```

---

## 音量控制和混音

### 音频混音总线架构

```typescript
interface MixBusConfig {
  name: string;
  parent?: string;
  defaultVolume: number;
  muted: boolean;
}

class AudioMixBus {
  public name: string;
  public gainNode: GainNode;
  public children: AudioMixBus[];
  public parent: AudioMixBus | null;
  private _volume: number;
  private _muted: boolean;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext, config: MixBusConfig) {
    this.audioContext = audioContext;
    this.name = config.name;
    this.gainNode = audioContext.createGain();
    this.children = [];
    this.parent = null;
    this._volume = config.defaultVolume;
    this._muted = config.muted;

    this.updateGain();
  }

  public get volume(): number {
    return this._volume;
  }

  public set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value));
    this.updateGain();
  }

  public get muted(): boolean {
    return this._muted;
  }

  public set muted(value: boolean) {
    this._muted = value;
    this.updateGain();
  }

  private updateGain(): void {
    const targetGain = this._muted ? 0 : this._volume;

    // 平滑过渡以避免咔嗒声
    this.gainNode.gain.linearRampToValueAtTime(
      targetGain,
      this.audioContext.currentTime + 0.05
    );
  }

  public addChild(child: AudioMixBus): void {
    child.parent = this;
    child.gainNode.connect(this.gainNode);
    this.children.push(child);
  }

  public connect(destination: AudioNode): void {
    this.gainNode.connect(destination);
  }

  public getEffectiveVolume(): number {
    let volume = this._muted ? 0 : this._volume;
    let current: AudioMixBus | null = this.parent;

    while (current) {
      if (current._muted) return 0;
      volume *= current._volume;
      current = current.parent;
    }

    return volume;
  }
}

class AudioMixer {
  private audioContext: AudioContext;
  private buses: Map<string, AudioMixBus>;
  private masterBus: AudioMixBus;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.buses = new Map();

    // 创建主总线
    this.masterBus = new AudioMixBus(audioContext, {
      name: 'master',
      defaultVolume: 1.0,
      muted: false
    });
    this.masterBus.connect(audioContext.destination);
    this.buses.set('master', this.masterBus);

    // 创建默认总线层级
    this.setupDefaultBuses();
  }

  private setupDefaultBuses(): void {
    // 音乐总线
    const musicBus = this.createBus({
      name: 'music',
      parent: 'master',
      defaultVolume: 0.7,
      muted: false
    });

    // 音效总线及子总线
    const sfxBus = this.createBus({
      name: 'sfx',
      parent: 'master',
      defaultVolume: 1.0,
      muted: false
    });

    this.createBus({
      name: 'sfx_weapons',
      parent: 'sfx',
      defaultVolume: 1.0,
      muted: false
    });

    this.createBus({
      name: 'sfx_footsteps',
      parent: 'sfx',
      defaultVolume: 0.8,
      muted: false
    });

    this.createBus({
      name: 'sfx_ui',
      parent: 'sfx',
      defaultVolume: 0.9,
      muted: false
    });

    // 环境总线
    this.createBus({
      name: 'ambient',
      parent: 'master',
      defaultVolume: 0.6,
      muted: false
    });

    // 语音总线
    this.createBus({
      name: 'voice',
      parent: 'master',
      defaultVolume: 1.0,
      muted: false
    });
  }

  public createBus(config: MixBusConfig): AudioMixBus {
    const bus = new AudioMixBus(this.audioContext, config);

    if (config.parent) {
      const parentBus = this.buses.get(config.parent);
      if (parentBus) {
        parentBus.addChild(bus);
      }
    }

    this.buses.set(config.name, bus);
    return bus;
  }

  public getBus(name: string): AudioMixBus | undefined {
    return this.buses.get(name);
  }

  public setVolume(busName: string, volume: number): void {
    const bus = this.buses.get(busName);
    if (bus) {
      bus.volume = volume;
    }
  }

  public setMuted(busName: string, muted: boolean): void {
    const bus = this.buses.get(busName);
    if (bus) {
      bus.muted = muted;
    }
  }

  public getMasterVolume(): number {
    return this.masterBus.volume;
  }

  public setMasterVolume(volume: number): void {
    this.masterBus.volume = volume;
  }

  // 获取特定总线的输出节点
  public getOutputNode(busName: string): GainNode | null {
    return this.buses.get(busName)?.gainNode ?? null;
  }

  // 快照当前混音器状态以供保存
  public getSnapshot(): Record<string, { volume: number; muted: boolean }> {
    const snapshot: Record<string, { volume: number; muted: boolean }> = {};

    for (const [name, bus] of this.buses) {
      snapshot[name] = {
        volume: bus.volume,
        muted: bus.muted
      };
    }

    return snapshot;
  }

  // 从快照恢复混音器状态
  public restoreSnapshot(snapshot: Record<string, { volume: number; muted: boolean }>): void {
    for (const [name, state] of Object.entries(snapshot)) {
      const bus = this.buses.get(name);
      if (bus) {
        bus.volume = state.volume;
        bus.muted = state.muted;
      }
    }
  }
}

// 使用示例
const audioContext = new AudioContext();
const mixer = new AudioMixer(audioContext);

// 设置音量
mixer.setVolume('music', 0.5);
mixer.setVolume('sfx_weapons', 0.8);

// 在过场动画期间静音脚步声
mixer.setMuted('sfx_footsteps', true);

// 将声音连接到特定总线
const musicBus = mixer.getBus('music');
if (musicBus) {
  const musicSource = audioContext.createBufferSource();
  // musicSource.buffer = ...
  musicSource.connect(musicBus.gainNode);
  musicSource.start();
}
```

### 动态音频闪避

```typescript
interface DuckingConfig {
  targetBus: string;
  duckAmount: number;      // 降低音量的程度（0-1）
  attackTime: number;      // 闪避时间（秒）
  releaseTime: number;     // 恢复时间（秒）
  threshold: number;       // 触发闪避的输入电平
}

class AudioDucker {
  private mixer: AudioMixer;
  private audioContext: AudioContext;
  private activeDucks: Map<string, {
    config: DuckingConfig;
    isActive: boolean;
    originalVolume: number;
  }>;

  constructor(mixer: AudioMixer, audioContext: AudioContext) {
    this.mixer = mixer;
    this.audioContext = audioContext;
    this.activeDucks = new Map();
  }

  public registerDuck(id: string, config: DuckingConfig): void {
    const targetBus = this.mixer.getBus(config.targetBus);
    if (!targetBus) {
      console.warn(`未找到总线: ${config.targetBus}`);
      return;
    }

    this.activeDucks.set(id, {
      config,
      isActive: false,
      originalVolume: targetBus.volume
    });
  }

  public triggerDuck(id: string): void {
    const duck = this.activeDucks.get(id);
    if (!duck || duck.isActive) return;

    const targetBus = this.mixer.getBus(duck.config.targetBus);
    if (!targetBus) return;

    duck.originalVolume = targetBus.volume;
    duck.isActive = true;

    // 使用平滑过渡应用闪避
    const targetVolume = duck.originalVolume * (1 - duck.config.duckAmount);

    targetBus.gainNode.gain.linearRampToValueAtTime(
      targetVolume,
      this.audioContext.currentTime + duck.config.attackTime
    );
  }

  public releaseDuck(id: string): void {
    const duck = this.activeDucks.get(id);
    if (!duck || !duck.isActive) return;

    const targetBus = this.mixer.getBus(duck.config.targetBus);
    if (!targetBus) return;

    duck.isActive = false;

    // 恢复原始音量
    targetBus.gainNode.gain.linearRampToValueAtTime(
      duck.originalVolume,
      this.audioContext.currentTime + duck.config.releaseTime
    );
  }
}

// 使用：对话播放时闪避音乐
const ducker = new AudioDucker(mixer, audioContext);

ducker.registerDuck('dialogue_duck', {
  targetBus: 'music',
  duckAmount: 0.7,      // 将音乐降至30%音量
  attackTime: 0.2,      // 200ms闪避
  releaseTime: 0.5,     // 500ms恢复
  threshold: 0
});

// 对话开始时
ducker.triggerDuck('dialogue_duck');

// 对话结束时
ducker.releaseDuck('dialogue_duck');
```

---

## FMOD集成

FMOD是广泛用于AAA游戏的专业音频中间件。

### FMOD Studio API封装

```typescript
// FMOD Studio API的TypeScript封装（与fmod.js配合使用）
declare namespace FMOD {
  interface System {
    createSound(name: string, mode: number, exInfo: any, callback: (result: number, sound: Sound) => void): number;
    playSound(sound: Sound, channelGroup: ChannelGroup | null, paused: boolean, callback: (result: number, channel: Channel) => void): number;
    update(): number;
    release(): number;
  }

  interface StudioSystem {
    initialize(maxChannels: number, studioFlags: number, coreFlags: number, extraDriverData: any): number;
    loadBankFile(filename: string, flags: number, callback: (result: number, bank: Bank) => void): number;
    getEvent(path: string, callback: (result: number, eventDescription: EventDescription) => void): number;
    update(): number;
    release(): number;
  }

  interface EventDescription {
    createInstance(callback: (result: number, instance: EventInstance) => void): number;
  }

  interface EventInstance {
    start(): number;
    stop(mode: number): number;
    release(): number;
    setParameterByName(name: string, value: number, ignoreSeekSpeed?: boolean): number;
    getParameterByName(name: string, callback: (result: number, value: number, finalValue: number) => void): number;
    set3DAttributes(attributes: _3D_ATTRIBUTES): number;
    setVolume(volume: number): number;
    setPaused(paused: boolean): number;
  }

  interface _3D_ATTRIBUTES {
    position: VECTOR;
    velocity: VECTOR;
    forward: VECTOR;
    up: VECTOR;
  }

  interface VECTOR {
    x: number;
    y: number;
    z: number;
  }
}

class FMODManager {
  private studioSystem: FMOD.StudioSystem | null = null;
  private loadedBanks: Map<string, any> = new Map();
  private eventDescriptions: Map<string, FMOD.EventDescription> = new Map();
  private activeInstances: Map<string, FMOD.EventInstance> = new Map();
  private initialized: boolean = false;

  public async initialize(): Promise<void> {
    // 注意：实际FMOD初始化取决于fmod.js加载
    // 这是一个概念性实现

    return new Promise((resolve, reject) => {
      // 初始化FMOD Studio
      this.studioSystem?.initialize(
        512,  // 最大通道数
        0x00000001,  // FMOD_STUDIO_INIT_NORMAL
        0x00000000,  // FMOD_INIT_NORMAL
        null
      );

      this.initialized = true;
      resolve();
    });
  }

  public async loadBank(bankPath: string, bankName: string): Promise<void> {
    if (!this.studioSystem) {
      throw new Error('FMOD未初始化');
    }

    return new Promise((resolve, reject) => {
      this.studioSystem!.loadBankFile(
        bankPath,
        0x00000000,  // FMOD_STUDIO_LOAD_BANK_NORMAL
        (result, bank) => {
          if (result === 0) {  // FMOD_OK
            this.loadedBanks.set(bankName, bank);
            resolve();
          } else {
            reject(new Error(`加载bank失败: ${bankPath}`));
          }
        }
      );
    });
  }

  public async getEventDescription(eventPath: string): Promise<FMOD.EventDescription> {
    // 首先检查缓存
    if (this.eventDescriptions.has(eventPath)) {
      return this.eventDescriptions.get(eventPath)!;
    }

    return new Promise((resolve, reject) => {
      this.studioSystem!.getEvent(eventPath, (result, eventDesc) => {
        if (result === 0) {
          this.eventDescriptions.set(eventPath, eventDesc);
          resolve(eventDesc);
        } else {
          reject(new Error(`未找到事件: ${eventPath}`));
        }
      });
    });
  }

  public async playEvent(
    eventPath: string,
    options: {
      position?: { x: number; y: number; z: number };
      parameters?: Record<string, number>;
      volume?: number;
    } = {}
  ): Promise<string> {
    const eventDesc = await this.getEventDescription(eventPath);

    return new Promise((resolve, reject) => {
      eventDesc.createInstance((result, instance) => {
        if (result !== 0) {
          reject(new Error('创建事件实例失败'));
          return;
        }

        // 设置3D位置
        if (options.position) {
          instance.set3DAttributes({
            position: options.position,
            velocity: { x: 0, y: 0, z: 0 },
            forward: { x: 0, y: 0, z: 1 },
            up: { x: 0, y: 1, z: 0 }
          });
        }

        // 设置参数
        if (options.parameters) {
          for (const [name, value] of Object.entries(options.parameters)) {
            instance.setParameterByName(name, value);
          }
        }

        // 设置音量
        if (options.volume !== undefined) {
          instance.setVolume(options.volume);
        }

        // 开始播放
        instance.start();

        // 存储引用
        const instanceId = `${eventPath}_${Date.now()}`;
        this.activeInstances.set(instanceId, instance);

        resolve(instanceId);
      });
    });
  }

  public setParameter(instanceId: string, parameterName: string, value: number): void {
    const instance = this.activeInstances.get(instanceId);
    if (instance) {
      instance.setParameterByName(parameterName, value);
    }
  }

  public stopEvent(instanceId: string, allowFadeout: boolean = true): void {
    const instance = this.activeInstances.get(instanceId);
    if (instance) {
      instance.stop(allowFadeout ? 0 : 1);  // FMOD_STUDIO_STOP_ALLOWFADEOUT 或 IMMEDIATE
      instance.release();
      this.activeInstances.delete(instanceId);
    }
  }

  public update(): void {
    this.studioSystem?.update();
  }

  public setListenerAttributes(
    position: { x: number; y: number; z: number },
    forward: { x: number; y: number; z: number },
    up: { x: number; y: number; z: number }
  ): void {
    // 设置3D监听器属性
    // 实现取决于FMOD API版本
  }

  public release(): void {
    // 停止所有活动实例
    for (const instance of this.activeInstances.values()) {
      instance.stop(1);
      instance.release();
    }
    this.activeInstances.clear();

    // 释放banks和系统
    this.studioSystem?.release();
    this.initialized = false;
  }
}

// 使用示例
const fmod = new FMODManager();

async function initFMOD() {
  await fmod.initialize();
  await fmod.loadBank('/audio/Master.bank', 'Master');
  await fmod.loadBank('/audio/Master.strings.bank', 'MasterStrings');
  await fmod.loadBank('/audio/SFX.bank', 'SFX');
}

// 使用参数播放武器开火事件
async function fireWeapon(position: { x: number; y: number; z: number }) {
  const instanceId = await fmod.playEvent('event:/Weapons/RifleFire', {
    position,
    parameters: {
      'Surface': 0.5,    // 表面类型影响声音
      'Distance': 10.0   // 衰减的距离参数
    }
  });

  return instanceId;
}

// 更新循环
function gameLoop() {
  fmod.update();  // 每帧必须调用
  requestAnimationFrame(gameLoop);
}
```

---

## Wwise集成

Wwise是另一个行业标准音频中间件，具有强大的互动音乐功能。

### Wwise SDK封装

```typescript
// Wwise SDK的TypeScript封装
declare namespace AK {
  function Init(initSettings: any): boolean;
  function Term(): void;
  function RenderAudio(): void;

  namespace SoundEngine {
    function PostEvent(eventName: string, gameObjectId: number): number;
    function StopAll(gameObjectId?: number): void;
    function SetRTPCValue(rtpcName: string, value: number, gameObjectId?: number): void;
    function SetState(stateGroup: string, state: string): void;
    function SetSwitch(switchGroup: string, switchState: string, gameObjectId: number): void;
    function RegisterGameObj(gameObjectId: number, name?: string): void;
    function UnregisterGameObj(gameObjectId: number): void;
    function SetPosition(gameObjectId: number, position: AkSoundPosition): void;
    function SetListenerPosition(position: AkListenerPosition): void;
  }

  namespace StreamMgr {
    function SetCurrentLanguage(language: string): void;
  }

  interface AkSoundPosition {
    Position: { X: number; Y: number; Z: number };
    Orientation: { X: number; Y: number; Z: number };
  }

  interface AkListenerPosition {
    Position: { X: number; Y: number; Z: number };
    OrientationFront: { X: number; Y: number; Z: number };
    OrientationTop: { X: number; Y: number; Z: number };
  }
}

class WwiseManager {
  private initialized: boolean = false;
  private gameObjects: Map<string, number> = new Map();
  private nextGameObjectId: number = 100;
  private activeEvents: Map<number, string> = new Map();

  public async initialize(basePath: string): Promise<void> {
    const initSettings = {
      basePath,
      language: 'English(US)',
      numSamplesPerFrame: 1024,
      bufferSize: 4096
    };

    const result = AK.Init(initSettings);
    if (!result) {
      throw new Error('初始化Wwise失败');
    }

    this.initialized = true;
  }

  public registerGameObject(name: string): number {
    const id = this.nextGameObjectId++;
    AK.SoundEngine.RegisterGameObj(id, name);
    this.gameObjects.set(name, id);
    return id;
  }

  public unregisterGameObject(name: string): void {
    const id = this.gameObjects.get(name);
    if (id !== undefined) {
      AK.SoundEngine.UnregisterGameObj(id);
      this.gameObjects.delete(name);
    }
  }

  public postEvent(eventName: string, gameObjectName: string): number {
    const gameObjectId = this.gameObjects.get(gameObjectName);
    if (gameObjectId === undefined) {
      console.warn(`未找到游戏对象: ${gameObjectName}`);
      return -1;
    }

    const playingId = AK.SoundEngine.PostEvent(eventName, gameObjectId);
    this.activeEvents.set(playingId, eventName);
    return playingId;
  }

  public setRTPC(rtpcName: string, value: number, gameObjectName?: string): void {
    const gameObjectId = gameObjectName
      ? this.gameObjects.get(gameObjectName)
      : undefined;

    AK.SoundEngine.SetRTPCValue(rtpcName, value, gameObjectId);
  }

  public setState(stateGroup: string, state: string): void {
    AK.SoundEngine.SetState(stateGroup, state);
  }

  public setSwitch(switchGroup: string, switchState: string, gameObjectName: string): void {
    const gameObjectId = this.gameObjects.get(gameObjectName);
    if (gameObjectId !== undefined) {
      AK.SoundEngine.SetSwitch(switchGroup, switchState, gameObjectId);
    }
  }

  public setPosition(
    gameObjectName: string,
    position: { x: number; y: number; z: number },
    forward: { x: number; y: number; z: number }
  ): void {
    const gameObjectId = this.gameObjects.get(gameObjectName);
    if (gameObjectId === undefined) return;

    AK.SoundEngine.SetPosition(gameObjectId, {
      Position: { X: position.x, Y: position.y, Z: position.z },
      Orientation: { X: forward.x, Y: forward.y, Z: forward.z }
    });
  }

  public setListenerPosition(
    position: { x: number; y: number; z: number },
    forward: { x: number; y: number; z: number },
    up: { x: number; y: number; z: number }
  ): void {
    AK.SoundEngine.SetListenerPosition({
      Position: { X: position.x, Y: position.y, Z: position.z },
      OrientationFront: { X: forward.x, Y: forward.y, Z: forward.z },
      OrientationTop: { X: up.x, Y: up.y, Z: up.z }
    });
  }

  public setLanguage(language: string): void {
    AK.StreamMgr.SetCurrentLanguage(language);
  }

  public stopAll(gameObjectName?: string): void {
    const gameObjectId = gameObjectName
      ? this.gameObjects.get(gameObjectName)
      : undefined;

    AK.SoundEngine.StopAll(gameObjectId);
  }

  public update(): void {
    if (this.initialized) {
      AK.RenderAudio();
    }
  }

  public terminate(): void {
    if (this.initialized) {
      // 注销所有游戏对象
      for (const [name, id] of this.gameObjects) {
        AK.SoundEngine.UnregisterGameObj(id);
      }
      this.gameObjects.clear();

      AK.Term();
      this.initialized = false;
    }
  }
}

// 使用示例
const wwise = new WwiseManager();

async function initWwise() {
  await wwise.initialize('/audio/wwise');

  // 注册游戏对象
  wwise.registerGameObject('Player');
  wwise.registerGameObject('Environment');
}

// 使用表面切换播放脚步声
function playFootstep(surface: 'concrete' | 'grass' | 'wood' | 'metal') {
  wwise.setSwitch('Surface', surface, 'Player');
  wwise.postEvent('Play_Footstep', 'Player');
}

// 设置血量RTPC用于音乐强度
function setHealth(health: number) {
  // 0-100血量映射到RTPC值
  wwise.setRTPC('PlayerHealth', health);
}

// 改变游戏状态用于音乐
function enterCombat() {
  wwise.setState('GameState', 'Combat');
}

function exitCombat() {
  wwise.setState('GameState', 'Exploration');
}

// 更新循环
function gameLoop() {
  wwise.update();
  requestAnimationFrame(gameLoop);
}
```

---

## 性能优化

### 音频性能分析

```typescript
interface AudioPerformanceMetrics {
  activeSoundCount: number;
  poolUtilization: number;
  cpuUsage: number;
  memoryUsage: number;
  averageLatency: number;
  droppedSounds: number;
}

class AudioProfiler {
  private metrics: AudioPerformanceMetrics;
  private sampleBuffer: number[] = [];
  private maxSamples: number = 60;
  private droppedCount: number = 0;
  private lastFrameTime: number = 0;

  constructor() {
    this.metrics = {
      activeSoundCount: 0,
      poolUtilization: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      averageLatency: 0,
      droppedSounds: 0
    };
  }

  public startFrame(): void {
    this.lastFrameTime = performance.now();
  }

  public endFrame(audioManager: {
    getActiveSoundCount(): number;
    getPoolStats(): { active: number; total: number };
  }): void {
    const frameTime = performance.now() - this.lastFrameTime;

    this.sampleBuffer.push(frameTime);
    if (this.sampleBuffer.length > this.maxSamples) {
      this.sampleBuffer.shift();
    }

    const poolStats = audioManager.getPoolStats();

    this.metrics = {
      activeSoundCount: audioManager.getActiveSoundCount(),
      poolUtilization: poolStats.active / poolStats.total,
      cpuUsage: this.calculateCPUUsage(),
      memoryUsage: this.estimateMemoryUsage(),
      averageLatency: this.calculateAverageLatency(),
      droppedSounds: this.droppedCount
    };
  }

  public recordDroppedSound(): void {
    this.droppedCount++;
  }

  private calculateCPUUsage(): number {
    if (this.sampleBuffer.length === 0) return 0;

    const avgFrameTime = this.sampleBuffer.reduce((a, b) => a + b, 0) / this.sampleBuffer.length;
    // 假设60fps目标，计算帧预算使用百分比
    const targetFrameTime = 16.67; // ~60fps
    return Math.min(100, (avgFrameTime / targetFrameTime) * 100);
  }

  private calculateAverageLatency(): number {
    if (this.sampleBuffer.length === 0) return 0;
    return this.sampleBuffer.reduce((a, b) => a + b, 0) / this.sampleBuffer.length;
  }

  private estimateMemoryUsage(): number {
    // 这是一个估计值 - 实际测量取决于平台
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  }

  public getMetrics(): AudioPerformanceMetrics {
    return { ...this.metrics };
  }

  public logMetrics(): void {
    console.log('=== 音频性能 ===');
    console.log(`活动声音: ${this.metrics.activeSoundCount}`);
    console.log(`池利用率: ${(this.metrics.poolUtilization * 100).toFixed(1)}%`);
    console.log(`CPU使用率: ${this.metrics.cpuUsage.toFixed(1)}%`);
    console.log(`平均延迟: ${this.metrics.averageLatency.toFixed(2)}ms`);
    console.log(`丢弃声音: ${this.metrics.droppedSounds}`);
  }
}
```

### 最佳实践总结

```typescript
/**
 * 音频系统最佳实践
 *
 * 1. 初始化
 *    - 在用户交互时初始化音频上下文（浏览器要求）
 *    - 在加载画面预加载关键声音
 *    - 为大量小声音使用音频精灵
 *
 * 2. 内存管理
 *    - 为频繁播放的声音使用对象池
 *    - 流式传输长音频文件（音乐、环境）
 *    - 切换关卡时卸载未使用的音频
 *    - 在分析器中监控内存使用
 *
 * 3. 性能
 *    - 限制并发声音（通常32-64个）
 *    - 使用优先级系统进行声音剔除
 *    - 实现基于距离的剔除
 *    - 每帧批量音频操作
 *    - 使用压缩格式（OGG, WebM）
 *
 * 4. 3D音频
 *    - 每帧更新监听器
 *    - 使用适当的衰减曲线
 *    - 室内场景考虑遮挡
 *    - 耳机用HRTF，扬声器用equal-power
 *
 * 5. 混音
 *    - 使用总线层级（Master > Music/SFX/Voice）
 *    - 为对话实现闪避
 *    - 提供每类别音量控制
 *    - 保存/加载音频设置
 *
 * 6. 跨平台
 *    - 提供多种音频格式
 *    - 在移动端测试（自动播放限制）
 *    - 处理音频焦点变化
 *    - 考虑低端设备的降级能力
 */

// 示例：完整音频系统初始化
async function initializeAudioSystem(): Promise<{
  audioManager: AudioManager;
  mixer: AudioMixer;
  spatialAudio: SpatialAudioSystem;
  soundEvents: SoundEventSystem;
}> {
  // 等待用户交互
  await waitForUserInteraction();

  // 初始化核心系统
  const audioContext = new AudioContext();

  // 恢复上下文（浏览器要求）
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  // 创建混音器
  const mixer = new AudioMixer(audioContext);

  // 创建空间音频系统
  const spatialAudio = new SpatialAudioSystem();

  // 创建音频管理器
  const audioManager = AudioManager.getInstance();

  // 创建事件系统
  const soundEvents = new SoundEventSystem();

  // 预加载基本声音
  const essentialSounds = [
    '/sounds/ui_click',
    '/sounds/ui_hover',
    '/sounds/player_hurt',
    '/sounds/menu_music'
  ];

  const loader = new MultiFormatAudioLoader(audioContext);
  await loader.preloadAll(essentialSounds);

  return {
    audioManager,
    mixer,
    spatialAudio,
    soundEvents
  };
}

function waitForUserInteraction(): Promise<void> {
  return new Promise(resolve => {
    const handler = () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
      document.removeEventListener('touchstart', handler);
      resolve();
    };

    document.addEventListener('click', handler);
    document.addEventListener('keydown', handler);
    document.addEventListener('touchstart', handler);
  });
}
```

---

## 常见面试问题

### Q1：如何在游戏中实现音频遮挡？

音频遮挡模拟声音被障碍物阻挡：

```typescript
class AudioOcclusion {
  private audioContext: AudioContext;

  public calculateOcclusion(
    listenerPos: { x: number; y: number; z: number },
    sourcePos: { x: number; y: number; z: number },
    obstacles: { raycast: (from: any, to: any) => { hit: boolean; distance: number }[] }
  ): { volumeMultiplier: number; lowPassFrequency: number } {
    // 从监听器到声源进行射线检测
    const hits = obstacles.raycast(listenerPos, sourcePos);

    if (hits.length === 0) {
      // 直接视线
      return { volumeMultiplier: 1.0, lowPassFrequency: 22000 };
    }

    // 根据障碍物数量和距离计算遮挡
    const occlusionFactor = Math.min(1, hits.length * 0.3);

    return {
      volumeMultiplier: 1 - occlusionFactor * 0.7,
      lowPassFrequency: 22000 - (occlusionFactor * 18000)  // 削减高频
    };
  }

  public applyOcclusion(
    sourceGain: GainNode,
    filter: BiquadFilterNode,
    occlusion: { volumeMultiplier: number; lowPassFrequency: number }
  ): void {
    const time = this.audioContext.currentTime;

    sourceGain.gain.linearRampToValueAtTime(occlusion.volumeMultiplier, time + 0.05);
    filter.frequency.linearRampToValueAtTime(occlusion.lowPassFrequency, time + 0.05);
  }
}
```

### Q2：Web Audio API和FMOD等中间件之间有什么权衡？

| 方面 | Web Audio API | FMOD/Wwise |
|--------|---------------|------------|
| 成本 | 免费 | 授权费用 |
| 复杂度 | 底层API | 高级工具 |
| 设计师工作流 | 仅代码 | 可视化编辑器 |
| 功能 | 基础 | 高级（自适应音乐等）|
| 平台支持 | 仅浏览器 | 跨平台 |
| 包大小 | 内置 | 额外库 |
| 学习曲线 | 中等 | 陡峭（完整功能）|

### Q3：如何在移动浏览器上处理音频？

```typescript
class MobileAudioHandler {
  private audioContext: AudioContext | null = null;
  private unlocked: boolean = false;

  public async initialize(): Promise<void> {
    // 创建上下文
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // 移动浏览器需要用户交互
    if (this.audioContext.state === 'suspended') {
      await this.unlockAudio();
    }
  }

  private async unlockAudio(): Promise<void> {
    const unlock = async () => {
      if (this.unlocked || !this.audioContext) return;

      // 创建并播放静音缓冲区
      const buffer = this.audioContext.createBuffer(1, 1, 22050);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start(0);

      // 恢复上下文
      await this.audioContext.resume();

      this.unlocked = true;

      // 清理监听器
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('touchend', unlock);
      document.removeEventListener('click', unlock);
    };

    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('touchend', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
  }

  // 处理应用可见性变化
  public setupVisibilityHandling(): void {
    document.addEventListener('visibilitychange', () => {
      if (!this.audioContext) return;

      if (document.hidden) {
        this.audioContext.suspend();
      } else {
        this.audioContext.resume();
      }
    });
  }
}
```

---

## 总结

构建一个健壮的游戏音频系统需要理解几个关键领域：

1. **架构**：使用适当的单例模式和基于总线的混音层级实现集中式音频管理器。

2. **声音触发**：使用基于事件的系统将音频与游戏逻辑解耦，支持变体、冷却和优先级。

3. **3D空间化**：利用Web Audio API的PannerNode或中间件实现真实的空间音频，配合适当的衰减曲线。

4. **对象池**：高效管理音频源实例，避免垃圾回收并保持一致的性能。

5. **格式选择**：根据平台支持和使用场景选择适当的格式（流式传输用压缩格式，短音效用无压缩格式）。

6. **混音**：使用分层总线系统实现音量控制、闪避和适当的增益分级。

7. **中间件集成**：对于需要自适应音乐、高级功能或设计师友好工作流的复杂项目，考虑FMOD或Wwise。

8. **性能**：分析音频性能，为长音频实现流式传输，通过谨慎的资源管理优化内存使用。

一个优秀音频系统的关键是在功能丰富性与性能限制之间取得平衡，同时为游戏开发者和声音设计师提供简洁的API。
