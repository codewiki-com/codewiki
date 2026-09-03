---
title: Game Audio System Design
description: "Build complete game audio systems: sound triggering, 3D spatialization, and audio management"
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - audio
  - sound effects
  - 3D audio
  - audio engine
status: imported
origin: old/src/content/docs/gamedev/game-audio.en.md
divergence: 0.242
issues: []
legacy:
  category: GameDev
  subcategory: Audio
  order: 21
  lastUpdated: 2026-01-07
---

Audio is a critical component of game development that significantly impacts player immersion and experience. A well-designed audio system handles sound triggering, 3D spatialization, volume management, and performance optimization. We cover everything from basic audio architecture to advanced integration with professional middleware like FMOD and Wwise.

## Understanding Game Audio Architecture

### Core Components

A game audio system typically consists of several interconnected components:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Game Audio System                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ Audio Manager │  │  Sound Pool   │  │ Mixer Groups  │       │
│  │   (Singleton) │  │   (Object     │  │  (Volume      │       │
│  │               │  │    Pooling)   │  │   Control)    │       │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘       │
│          │                  │                  │               │
│          └──────────────────┼──────────────────┘               │
│                             │                                   │
│  ┌──────────────────────────┴──────────────────────────┐       │
│  │              Audio Source Controller                 │       │
│  │  (Sound triggering, 3D positioning, attenuation)    │       │
│  └──────────────────────────┬──────────────────────────┘       │
│                             │                                   │
│  ┌──────────────────────────┴──────────────────────────┐       │
│  │              Platform Audio Backend                  │       │
│  │  (Web Audio API, Unity Audio, FMOD, Wwise)          │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Audio Manager Singleton

The Audio Manager serves as the central hub for all audio operations:

```typescript
// TypeScript implementation of a basic Audio Manager
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

    // Create gain node hierarchy
    this.masterGain = this.audioContext.createGain();
    this.musicGain = this.audioContext.createGain();
    this.sfxGain = this.audioContext.createGain();

    // Connect gain nodes
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
      return; // Already loaded
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.soundCache.set(id, audioBuffer);
    } catch (error) {
      console.error(`Failed to load sound: ${id}`, error);
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
      console.warn(`Sound not found: ${id}`);
      return null;
    }

    // Check concurrent sound limit
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

// Usage example
const audioManager = AudioManager.getInstance();

async function initializeAudio() {
  await audioManager.loadSound('explosion', '/sounds/explosion.wav');
  await audioManager.loadSound('bgm', '/sounds/background_music.mp3');

  // Play background music
  audioManager.playSound('bgm', { loop: true, isMusic: true, volume: 0.5 });

  // Play sound effect
  audioManager.playSound('explosion', { priority: 5 });
}
```

---

## Sound Triggering Mechanisms

### Event-Based Sound System

Modern games use event-driven audio systems that decouple sound playback from game logic:

```typescript
// Event-based audio system
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
  sounds: string[];  // Array of sound IDs for variation
  volumeRange: [number, number];
  pitchRange: [number, number];
  cooldown: number;  // Minimum time between plays
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
    // Register sound definitions
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
      console.warn(`Unknown sound event: ${event.type}`);
      return;
    }

    const now = Date.now();
    const lastPlay = this.lastPlayTime.get(event.type) ?? 0;

    // Check cooldown
    if (now - lastPlay < definition.cooldown) {
      return;
    }

    // Check max instances
    const currentInstances = this.instanceCount.get(event.type) ?? 0;
    if (currentInstances >= definition.maxInstances) {
      return;
    }

    // Select random sound variation
    const soundId = definition.sounds[
      Math.floor(Math.random() * definition.sounds.length)
    ];

    // Calculate randomized volume and pitch
    const volume = this.randomInRange(definition.volumeRange) * (event.volume ?? 1.0);
    const pitch = this.randomInRange(definition.pitchRange) * (event.pitch ?? 1.0);

    // Update tracking
    this.lastPlayTime.set(event.type, now);
    this.instanceCount.set(event.type, currentInstances + 1);

    // Schedule playback
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
    // Implementation depends on audio backend
    // This would integrate with the AudioManager or 3D audio system
    console.log(`Playing sound: ${soundId}`, options);
  }
}

// Usage in game code
const soundEvents = new SoundEventSystem();

// In player controller
function onPlayerJump() {
  soundEvents.trigger({ type: 'player_jump' });
}

// In weapon system
function onWeaponFire(weaponPosition: { x: number; y: number; z: number }) {
  soundEvents.trigger({
    type: 'weapon_fire',
    position: weaponPosition
  });
}

// In combat system
function onEnemyHit(hitPosition: { x: number; y: number; z: number }, damage: number) {
  soundEvents.trigger({
    type: 'enemy_hit',
    position: hitPosition,
    volume: Math.min(1.0, damage / 100) // Scale volume with damage
  });
}
```

### Animation-Synchronized Audio

For precise timing with animations:

```typescript
interface AnimationSoundMarker {
  frame: number;
  soundEvent: SoundEventType;
  offset?: number;  // Time offset in milliseconds
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
          // Apply offset if specified
          const delay = marker.offset ?? 0;

          setTimeout(() => {
            this.soundEvents.trigger({ type: marker.soundEvent });
          }, Math.max(0, delay));

          state.triggeredMarkers.add(markerKey);
        }
      }

      // Handle looping animations
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

// Example: Register footstep sounds for walk animation
const animSync = new AnimationAudioSync(soundEvents);

animSync.registerTrack({
  animationName: 'player_walk',
  loops: true,
  markers: [
    { frame: 5, soundEvent: 'player_land' },   // Left foot
    { frame: 15, soundEvent: 'player_land' },  // Right foot
  ]
});

animSync.registerTrack({
  animationName: 'sword_attack',
  loops: false,
  markers: [
    { frame: 8, soundEvent: 'weapon_fire', offset: -50 },  // Wind up
    { frame: 12, soundEvent: 'enemy_hit' },                // Impact
  ]
});
```

---

## 3D Spatial Audio

### Web Audio API Spatialization

The Web Audio API provides built-in support for 3D audio through the `PannerNode`:

```typescript
interface ListenerState {
  position: { x: number; y: number; z: number };
  forward: { x: number; y: number; z: number };
  up: { x: number; y: number; z: number };
}

interface SpatialSoundOptions {
  position: { x: number; y: number; z: number };
  refDistance: number;      // Distance at which volume is 100%
  maxDistance: number;      // Distance at which volume reaches minimum
  rolloffFactor: number;    // How quickly volume decreases with distance
  coneInnerAngle: number;   // Full volume cone angle
  coneOuterAngle: number;   // Reduced volume cone angle
  coneOuterGain: number;    // Volume outside outer cone
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

    // Set up listener defaults
    this.setListenerPosition({ x: 0, y: 0, z: 0 });
    this.setListenerOrientation(
      { x: 0, y: 0, z: -1 },  // Forward
      { x: 0, y: 1, z: 0 }    // Up
    );
  }

  public setListenerPosition(position: { x: number; y: number; z: number }): void {
    if (this.listener.positionX) {
      // Modern API
      this.listener.positionX.setValueAtTime(position.x, this.audioContext.currentTime);
      this.listener.positionY.setValueAtTime(position.y, this.audioContext.currentTime);
      this.listener.positionZ.setValueAtTime(position.z, this.audioContext.currentTime);
    } else {
      // Legacy API
      this.listener.setPosition(position.x, position.y, position.z);
    }
  }

  public setListenerOrientation(
    forward: { x: number; y: number; z: number },
    up: { x: number; y: number; z: number }
  ): void {
    if (this.listener.forwardX) {
      // Modern API
      this.listener.forwardX.setValueAtTime(forward.x, this.audioContext.currentTime);
      this.listener.forwardY.setValueAtTime(forward.y, this.audioContext.currentTime);
      this.listener.forwardZ.setValueAtTime(forward.z, this.audioContext.currentTime);
      this.listener.upX.setValueAtTime(up.x, this.audioContext.currentTime);
      this.listener.upY.setValueAtTime(up.y, this.audioContext.currentTime);
      this.listener.upZ.setValueAtTime(up.z, this.audioContext.currentTime);
    } else {
      // Legacy API
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

    // Connect: Source -> Gain -> Panner -> Destination
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
    // Distance model
    panner.distanceModel = 'inverse';
    panner.refDistance = options.refDistance;
    panner.maxDistance = options.maxDistance;
    panner.rolloffFactor = options.rolloffFactor;

    // Directionality (cone)
    panner.coneInnerAngle = options.coneInnerAngle;
    panner.coneOuterAngle = options.coneOuterAngle;
    panner.coneOuterGain = options.coneOuterGain;

    // Panning model (HRTF for headphones, equalpower for speakers)
    panner.panningModel = 'HRTF';

    // Set position
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

// Integration with game camera
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

    // Calculate forward vector from rotation
    const forward = {
      x: Math.sin(camera.rotation.yaw) * Math.cos(camera.rotation.pitch),
      y: Math.sin(camera.rotation.pitch),
      z: -Math.cos(camera.rotation.yaw) * Math.cos(camera.rotation.pitch)
    };

    // Up vector (assuming no roll)
    const up = { x: 0, y: 1, z: 0 };

    this.spatialAudio.setListenerOrientation(forward, up);
  }
}
```

### Distance Attenuation Models

Different attenuation models for various game scenarios:

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
   * Linear attenuation: Volume decreases linearly with distance
   * Good for UI sounds or simple environments
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
   * Inverse attenuation: Realistic falloff based on physics
   * Good for outdoor environments
   */
  public static inverse(
    distance: number,
    refDistance: number,
    rolloffFactor: number
  ): number {
    return refDistance / (refDistance + rolloffFactor * (distance - refDistance));
  }

  /**
   * Exponential attenuation: Rapid falloff
   * Good for indoor environments with lots of occlusion
   */
  public static exponential(
    distance: number,
    refDistance: number,
    rolloffFactor: number
  ): number {
    return Math.pow(distance / refDistance, -rolloffFactor);
  }

  /**
   * Calculate attenuation based on configuration
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

// Attenuation presets for different sound types
const AttenuationPresets = {
  // Explosions: Heard from far away
  explosion: {
    model: 'inverse' as const,
    refDistance: 10,
    maxDistance: 500,
    rolloffFactor: 0.5
  },

  // Footsteps: Short range
  footsteps: {
    model: 'inverse' as const,
    refDistance: 1,
    maxDistance: 30,
    rolloffFactor: 2
  },

  // Dialogue: Medium range, sharp falloff
  dialogue: {
    model: 'exponential' as const,
    refDistance: 2,
    maxDistance: 20,
    rolloffFactor: 1.5
  },

  // Ambient loops: Very gradual falloff
  ambient: {
    model: 'linear' as const,
    refDistance: 5,
    maxDistance: 100,
    rolloffFactor: 1
  }
};
```

---

## Audio Object Pooling

### Efficient Sound Instance Management

Object pooling is crucial for performance in games with many sound effects:

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

    // Set up the connection chain (without source for now)
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
    // Find an inactive source
    const source = this.pool.find(s => !s.isActive);

    if (source) {
      source.isActive = true;
      this.activeCount++;
      return source;
    }

    // Pool exhausted - try to steal the oldest active source
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

    // Stop the current source node if playing
    if (source.sourceNode) {
      try {
        source.sourceNode.stop();
        source.sourceNode.disconnect();
      } catch (e) {
        // Source may have already stopped
      }
      source.sourceNode = null;
    }

    // Reset gain
    source.gainNode.gain.value = 1;

    // Reset panner
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
      console.warn('Audio pool exhausted');
      return null;
    }

    // Create new source node
    source.sourceNode = this.audioContext.createBufferSource();
    source.sourceNode.buffer = buffer;
    source.sourceNode.loop = options.loop ?? false;
    source.buffer = buffer;
    source.startTime = this.audioContext.currentTime;

    // Set volume
    source.gainNode.gain.value = options.volume ?? 1;

    // Set position if 3D
    if (options.position) {
      const time = this.audioContext.currentTime;
      source.pannerNode.positionX?.setValueAtTime(options.position.x, time);
      source.pannerNode.positionY?.setValueAtTime(options.position.y, time);
      source.pannerNode.positionZ?.setValueAtTime(options.position.z, time);
    }

    // Connect and start
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

### Priority-Based Pool Management

```typescript
enum SoundPriority {
  Low = 0,
  Normal = 1,
  High = 2,
  Critical = 3  // Never stolen (UI sounds, dialogue)
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
    // Try to acquire from pool
    let source = this.basePool.acquire();

    // If pool exhausted, try to steal lower priority sound
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
      // Never steal critical sounds
      if (sound.priority === SoundPriority.Critical) continue;

      // Only steal sounds with lower or equal priority
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

## Audio Format Selection

### Format Comparison

| Format | Size | Quality | Browser Support | Use Case |
|--------|------|---------|-----------------|----------|
| OGG Vorbis | Small | Good | Most (not Safari) | Music, long loops |
| MP3 | Medium | Good | Universal | Music fallback |
| WAV | Large | Lossless | Universal | Short SFX |
| AAC | Small | Good | Universal | Music (Safari) |
| WebM (Opus) | Smallest | Excellent | Chrome, Firefox | Voice, music |

### Multi-Format Loading Strategy

```typescript
interface AudioFormatInfo {
  extension: string;
  mimeType: string;
  priority: number;  // Lower is better
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
    // Return formats sorted by priority
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
   * Load audio with automatic format selection
   * @param basePath Path without extension (e.g., '/sounds/explosion')
   * @param formats Available formats for this sound
   */
  public async load(
    basePath: string,
    formats: string[] = ['webm', 'ogg', 'mp3']
  ): Promise<AudioBuffer> {
    // Check cache first
    if (this.cache.has(basePath)) {
      return this.cache.get(basePath)!;
    }

    // Find best supported format
    const sortedFormats = formats
      .map(ext => AUDIO_FORMATS.find(f => f.extension === ext))
      .filter((f): f is AudioFormatInfo => f !== undefined)
      .filter(f => this.formatDetector.isFormatSupported(f.extension))
      .sort((a, b) => a.priority - b.priority);

    if (sortedFormats.length === 0) {
      throw new Error(`No supported audio format found for ${basePath}`);
    }

    // Try loading in priority order
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
        console.warn(`Failed to load ${basePath}.${format.extension}`, error);
        continue;
      }
    }

    throw new Error(`Failed to load audio: ${basePath}`);
  }

  /**
   * Preload multiple sounds
   */
  public async preloadAll(sounds: string[]): Promise<void> {
    const promises = sounds.map(sound => this.load(sound).catch(e => {
      console.error(`Failed to preload: ${sound}`, e);
      return null;
    }));

    await Promise.all(promises);
  }
}

// Usage
const loader = new MultiFormatAudioLoader(new AudioContext());

// Will automatically select best format
await loader.load('/sounds/explosion');  // Loads .webm, .ogg, or .mp3
```

---

## Volume Control and Mixing

### Audio Mix Bus Architecture

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

    // Smooth transition to avoid clicks
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

    // Create master bus
    this.masterBus = new AudioMixBus(audioContext, {
      name: 'master',
      defaultVolume: 1.0,
      muted: false
    });
    this.masterBus.connect(audioContext.destination);
    this.buses.set('master', this.masterBus);

    // Create default bus hierarchy
    this.setupDefaultBuses();
  }

  private setupDefaultBuses(): void {
    // Music bus
    const musicBus = this.createBus({
      name: 'music',
      parent: 'master',
      defaultVolume: 0.7,
      muted: false
    });

    // SFX bus with sub-buses
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

    // Ambient bus
    this.createBus({
      name: 'ambient',
      parent: 'master',
      defaultVolume: 0.6,
      muted: false
    });

    // Voice bus
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

  // Get the output node for a specific bus
  public getOutputNode(busName: string): GainNode | null {
    return this.buses.get(busName)?.gainNode ?? null;
  }

  // Snapshot current mixer state for saving
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

  // Restore mixer state from snapshot
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

// Usage example
const audioContext = new AudioContext();
const mixer = new AudioMixer(audioContext);

// Set volumes
mixer.setVolume('music', 0.5);
mixer.setVolume('sfx_weapons', 0.8);

// Mute footsteps during cutscene
mixer.setMuted('sfx_footsteps', true);

// Connect a sound to specific bus
const musicBus = mixer.getBus('music');
if (musicBus) {
  const musicSource = audioContext.createBufferSource();
  // musicSource.buffer = ...
  musicSource.connect(musicBus.gainNode);
  musicSource.start();
}
```

### Dynamic Audio Ducking

```typescript
interface DuckingConfig {
  targetBus: string;
  duckAmount: number;      // How much to reduce volume (0-1)
  attackTime: number;      // Time to duck (seconds)
  releaseTime: number;     // Time to recover (seconds)
  threshold: number;       // Input level to trigger ducking
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
      console.warn(`Bus not found: ${config.targetBus}`);
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

    // Apply ducking with smooth transition
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

    // Restore original volume
    targetBus.gainNode.gain.linearRampToValueAtTime(
      duck.originalVolume,
      this.audioContext.currentTime + duck.config.releaseTime
    );
  }
}

// Usage: Duck music when dialogue plays
const ducker = new AudioDucker(mixer, audioContext);

ducker.registerDuck('dialogue_duck', {
  targetBus: 'music',
  duckAmount: 0.7,      // Reduce music to 30% volume
  attackTime: 0.2,      // 200ms to duck
  releaseTime: 0.5,     // 500ms to recover
  threshold: 0
});

// When dialogue starts
ducker.triggerDuck('dialogue_duck');

// When dialogue ends
ducker.releaseDuck('dialogue_duck');
```

---

## FMOD Integration

FMOD is a professional audio middleware widely used in AAA games.

### FMOD Studio API Wrapper

```typescript
// TypeScript wrapper for FMOD Studio API (used with fmod.js)
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
    // Note: Actual FMOD initialization depends on fmod.js loading
    // This is a conceptual implementation

    return new Promise((resolve, reject) => {
      // Initialize FMOD Studio
      this.studioSystem?.initialize(
        512,  // Max channels
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
      throw new Error('FMOD not initialized');
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
            reject(new Error(`Failed to load bank: ${bankPath}`));
          }
        }
      );
    });
  }

  public async getEventDescription(eventPath: string): Promise<FMOD.EventDescription> {
    // Check cache first
    if (this.eventDescriptions.has(eventPath)) {
      return this.eventDescriptions.get(eventPath)!;
    }

    return new Promise((resolve, reject) => {
      this.studioSystem!.getEvent(eventPath, (result, eventDesc) => {
        if (result === 0) {
          this.eventDescriptions.set(eventPath, eventDesc);
          resolve(eventDesc);
        } else {
          reject(new Error(`Event not found: ${eventPath}`));
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
          reject(new Error('Failed to create event instance'));
          return;
        }

        // Set 3D position
        if (options.position) {
          instance.set3DAttributes({
            position: options.position,
            velocity: { x: 0, y: 0, z: 0 },
            forward: { x: 0, y: 0, z: 1 },
            up: { x: 0, y: 1, z: 0 }
          });
        }

        // Set parameters
        if (options.parameters) {
          for (const [name, value] of Object.entries(options.parameters)) {
            instance.setParameterByName(name, value);
          }
        }

        // Set volume
        if (options.volume !== undefined) {
          instance.setVolume(options.volume);
        }

        // Start playback
        instance.start();

        // Store reference
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
      instance.stop(allowFadeout ? 0 : 1);  // FMOD_STUDIO_STOP_ALLOWFADEOUT or IMMEDIATE
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
    // Set 3D listener attributes
    // Implementation depends on FMOD API version
  }

  public release(): void {
    // Stop all active instances
    for (const instance of this.activeInstances.values()) {
      instance.stop(1);
      instance.release();
    }
    this.activeInstances.clear();

    // Release banks and system
    this.studioSystem?.release();
    this.initialized = false;
  }
}

// Usage example
const fmod = new FMODManager();

async function initFMOD() {
  await fmod.initialize();
  await fmod.loadBank('/audio/Master.bank', 'Master');
  await fmod.loadBank('/audio/Master.strings.bank', 'MasterStrings');
  await fmod.loadBank('/audio/SFX.bank', 'SFX');
}

// Play a weapon fire event with parameters
async function fireWeapon(position: { x: number; y: number; z: number }) {
  const instanceId = await fmod.playEvent('event:/Weapons/RifleFire', {
    position,
    parameters: {
      'Surface': 0.5,    // Surface type affects sound
      'Distance': 10.0   // Distance parameter for attenuation
    }
  });

  return instanceId;
}

// Update loop
function gameLoop() {
  fmod.update();  // Must be called every frame
  requestAnimationFrame(gameLoop);
}
```

---

## Wwise Integration

Wwise is another industry-standard audio middleware with powerful interactive music features.

### Wwise SDK Wrapper

```typescript
// TypeScript wrapper for Wwise SDK
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
      throw new Error('Failed to initialize Wwise');
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
      console.warn(`Game object not found: ${gameObjectName}`);
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
      // Unregister all game objects
      for (const [name, id] of this.gameObjects) {
        AK.SoundEngine.UnregisterGameObj(id);
      }
      this.gameObjects.clear();

      AK.Term();
      this.initialized = false;
    }
  }
}

// Usage example
const wwise = new WwiseManager();

async function initWwise() {
  await wwise.initialize('/audio/wwise');

  // Register game objects
  wwise.registerGameObject('Player');
  wwise.registerGameObject('Environment');
}

// Play footstep with surface switch
function playFootstep(surface: 'concrete' | 'grass' | 'wood' | 'metal') {
  wwise.setSwitch('Surface', surface, 'Player');
  wwise.postEvent('Play_Footstep', 'Player');
}

// Set health RTPC for music intensity
function setHealth(health: number) {
  // 0-100 health maps to RTPC value
  wwise.setRTPC('PlayerHealth', health);
}

// Change game state for music
function enterCombat() {
  wwise.setState('GameState', 'Combat');
}

function exitCombat() {
  wwise.setState('GameState', 'Exploration');
}

// Update loop
function gameLoop() {
  wwise.update();
  requestAnimationFrame(gameLoop);
}
```

---

## Performance Optimization

### Audio Performance Profiling

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
    // Assuming 60fps target, calculate percentage of frame budget used
    const targetFrameTime = 16.67; // ~60fps
    return Math.min(100, (avgFrameTime / targetFrameTime) * 100);
  }

  private calculateAverageLatency(): number {
    if (this.sampleBuffer.length === 0) return 0;
    return this.sampleBuffer.reduce((a, b) => a + b, 0) / this.sampleBuffer.length;
  }

  private estimateMemoryUsage(): number {
    // This is an estimate - actual measurement depends on platform
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
    console.log('=== Audio Performance ===');
    console.log(`Active Sounds: ${this.metrics.activeSoundCount}`);
    console.log(`Pool Utilization: ${(this.metrics.poolUtilization * 100).toFixed(1)}%`);
    console.log(`CPU Usage: ${this.metrics.cpuUsage.toFixed(1)}%`);
    console.log(`Avg Latency: ${this.metrics.averageLatency.toFixed(2)}ms`);
    console.log(`Dropped Sounds: ${this.metrics.droppedSounds}`);
  }
}
```

### Streaming and Memory Management

```typescript
interface StreamingAudioConfig {
  chunkSize: number;        // Bytes per chunk
  preloadChunks: number;    // Number of chunks to preload
  maxStreamingBuffers: number;
}

class StreamingAudioPlayer {
  private audioContext: AudioContext;
  private config: StreamingAudioConfig;
  private activeStreams: Map<string, {
    reader: ReadableStreamDefaultReader<Uint8Array>;
    source: AudioBufferSourceNode | null;
    gainNode: GainNode;
    chunks: AudioBuffer[];
    isPlaying: boolean;
    currentChunkIndex: number;
  }>;

  constructor(audioContext: AudioContext, config?: Partial<StreamingAudioConfig>) {
    this.audioContext = audioContext;
    this.config = {
      chunkSize: 64 * 1024,  // 64KB chunks
      preloadChunks: 3,
      maxStreamingBuffers: 4,
      ...config
    };
    this.activeStreams = new Map();
  }

  public async playStream(url: string, volume: number = 1.0): Promise<string> {
    const response = await fetch(url);
    if (!response.body) {
      throw new Error('Streaming not supported for this response');
    }

    const reader = response.body.getReader();
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(this.audioContext.destination);

    const streamId = `stream_${Date.now()}`;

    this.activeStreams.set(streamId, {
      reader,
      source: null,
      gainNode,
      chunks: [],
      isPlaying: false,
      currentChunkIndex: 0
    });

    // Start preloading
    await this.preloadChunks(streamId);

    // Start playback
    this.startPlayback(streamId);

    return streamId;
  }

  private async preloadChunks(streamId: string): Promise<void> {
    const stream = this.activeStreams.get(streamId);
    if (!stream) return;

    const chunks: Uint8Array[] = [];
    let totalSize = 0;

    while (chunks.length < this.config.preloadChunks) {
      const { done, value } = await stream.reader.read();
      if (done) break;

      chunks.push(value);
      totalSize += value.length;
    }

    // Combine chunks and decode
    const combined = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(combined.buffer);
      stream.chunks.push(audioBuffer);
    } catch (error) {
      console.error('Failed to decode audio chunk', error);
    }
  }

  private startPlayback(streamId: string): void {
    const stream = this.activeStreams.get(streamId);
    if (!stream || stream.chunks.length === 0) return;

    stream.isPlaying = true;
    this.playNextChunk(streamId);
  }

  private playNextChunk(streamId: string): void {
    const stream = this.activeStreams.get(streamId);
    if (!stream || !stream.isPlaying) return;

    if (stream.currentChunkIndex >= stream.chunks.length) {
      // Load more chunks
      this.preloadChunks(streamId).then(() => {
        if (stream.currentChunkIndex < stream.chunks.length) {
          this.playNextChunk(streamId);
        } else {
          // Stream ended
          stream.isPlaying = false;
        }
      });
      return;
    }

    const buffer = stream.chunks[stream.currentChunkIndex];
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(stream.gainNode);

    source.onended = () => {
      stream.currentChunkIndex++;
      this.playNextChunk(streamId);
    };

    stream.source = source;
    source.start();
  }

  public stopStream(streamId: string): void {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      stream.isPlaying = false;
      stream.source?.stop();
      stream.reader.cancel();
      this.activeStreams.delete(streamId);
    }
  }

  public setVolume(streamId: string, volume: number): void {
    const stream = this.activeStreams.get(streamId);
    if (stream) {
      stream.gainNode.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + 0.1
      );
    }
  }
}
```

### Best Practices Summary

```typescript
/**
 * Audio System Best Practices
 *
 * 1. INITIALIZATION
 *    - Initialize audio context on user interaction (browser requirement)
 *    - Preload critical sounds during loading screen
 *    - Use audio sprites for many small sounds
 *
 * 2. MEMORY MANAGEMENT
 *    - Use object pooling for frequently played sounds
 *    - Stream long audio files (music, ambient)
 *    - Unload unused audio when changing levels
 *    - Monitor memory usage in profiler
 *
 * 3. PERFORMANCE
 *    - Limit concurrent sounds (32-64 typical)
 *    - Use priority system for sound culling
 *    - Implement distance-based culling
 *    - Batch audio operations per frame
 *    - Use compressed formats (OGG, WebM)
 *
 * 4. 3D AUDIO
 *    - Update listener every frame
 *    - Use appropriate attenuation curves
 *    - Consider occlusion for indoor scenes
 *    - HRTF for headphones, equal-power for speakers
 *
 * 5. MIXING
 *    - Use bus hierarchy (Master > Music/SFX/Voice)
 *    - Implement ducking for dialogue
 *    - Provide per-category volume controls
 *    - Save/load audio settings
 *
 * 6. CROSS-PLATFORM
 *    - Provide multiple audio formats
 *    - Test on mobile (autoplay restrictions)
 *    - Handle audio focus changes
 *    - Consider reduced capabilities on low-end devices
 */

// Example: Complete audio system initialization
async function initializeAudioSystem(): Promise<{
  audioManager: AudioManager;
  mixer: AudioMixer;
  spatialAudio: SpatialAudioSystem;
  soundEvents: SoundEventSystem;
}> {
  // Wait for user interaction
  await waitForUserInteraction();

  // Initialize core systems
  const audioContext = new AudioContext();

  // Resume context (required by browsers)
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  // Create mixer
  const mixer = new AudioMixer(audioContext);

  // Create spatial audio system
  const spatialAudio = new SpatialAudioSystem();

  // Create audio manager
  const audioManager = AudioManager.getInstance();

  // Create event system
  const soundEvents = new SoundEventSystem();

  // Preload essential sounds
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

## Common Interview Questions

### Q1: How would you implement audio occlusion in a game?

Audio occlusion simulates sounds being blocked by obstacles:

```typescript
class AudioOcclusion {
  private audioContext: AudioContext;

  public calculateOcclusion(
    listenerPos: { x: number; y: number; z: number },
    sourcePos: { x: number; y: number; z: number },
    obstacles: { raycast: (from: any, to: any) => { hit: boolean; distance: number }[] }
  ): { volumeMultiplier: number; lowPassFrequency: number } {
    // Raycast from listener to source
    const hits = obstacles.raycast(listenerPos, sourcePos);

    if (hits.length === 0) {
      // Direct line of sight
      return { volumeMultiplier: 1.0, lowPassFrequency: 22000 };
    }

    // Calculate occlusion based on number and distance of obstacles
    const occlusionFactor = Math.min(1, hits.length * 0.3);

    return {
      volumeMultiplier: 1 - occlusionFactor * 0.7,
      lowPassFrequency: 22000 - (occlusionFactor * 18000)  // Cut high frequencies
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

### Q2: What are the trade-offs between Web Audio API and middleware like FMOD?

| Aspect | Web Audio API | FMOD/Wwise |
|--------|---------------|------------|
| Cost | Free | License fees |
| Complexity | Lower-level API | High-level tools |
| Designer workflow | Code-only | Visual editors |
| Features | Basic | Advanced (adaptive music, etc.) |
| Platform support | Browsers only | Cross-platform |
| Bundle size | Built-in | Additional library |
| Learning curve | Moderate | Steep (for full features) |

### Q3: How do you handle audio on mobile browsers?

```typescript
class MobileAudioHandler {
  private audioContext: AudioContext | null = null;
  private unlocked: boolean = false;

  public async initialize(): Promise<void> {
    // Create context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Mobile browsers require user interaction
    if (this.audioContext.state === 'suspended') {
      await this.unlockAudio();
    }
  }

  private async unlockAudio(): Promise<void> {
    const unlock = async () => {
      if (this.unlocked || !this.audioContext) return;

      // Create and play silent buffer
      const buffer = this.audioContext.createBuffer(1, 1, 22050);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start(0);

      // Resume context
      await this.audioContext.resume();

      this.unlocked = true;

      // Clean up listeners
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('touchend', unlock);
      document.removeEventListener('click', unlock);
    };

    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('touchend', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
  }

  // Handle app visibility changes
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

## Summary

Building a robust game audio system requires understanding several key areas:

1. **Architecture**: Implement a centralized Audio Manager with proper singleton pattern and bus-based mixing hierarchy.

2. **Sound Triggering**: Use event-based systems to decouple audio from game logic, with support for variations, cooldowns, and priorities.

3. **3D Spatialization**: Leverage Web Audio API's PannerNode or middleware for realistic spatial audio, with proper attenuation curves.

4. **Object Pooling**: Manage audio source instances efficiently to avoid garbage collection and maintain consistent performance.

5. **Format Selection**: Choose appropriate formats based on platform support and use case (compressed for streaming, uncompressed for short SFX).

6. **Mixing**: Implement hierarchical bus systems with volume controls, ducking, and proper gain staging.

7. **Middleware Integration**: Consider FMOD or Wwise for complex projects requiring adaptive music, advanced features, or designer-friendly workflows.

8. **Performance**: Profile audio performance, implement streaming for long audio, and optimize memory usage through careful resource management.

The key to a great audio system is balancing feature richness with performance constraints while providing a clean API for game developers and sound designers to work with.
