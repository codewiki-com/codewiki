---
title: Game Sound Design and Trigger Systems
description: "Master game audio design: sound event systems, spatial audio, adaptive music, and implementing audio triggers in game engines"
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - audio
  - sound design
  - game audio
  - spatial audio
  - FMOD
  - Wwise
status: imported
origin: old/src/content/docs/gamedev/game-sound-design.en.md
divergence: 0.235
issues: []
legacy:
  category: GameDev
  subcategory: Audio
  order: 52
  lastUpdated: 2026-01-22
---

## Introduction to Game Audio

Sound design is a crucial yet often underappreciated aspect of game development. Great audio enhances immersion, provides feedback, guides players, and creates emotional impact. This article covers the fundamentals of game sound design, audio trigger systems, and implementation strategies for modern games.

### The Role of Audio in Games

```
Game Audio Functions:
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Feedback              Immersion           Guidance          │
│  ├─ UI sounds          ├─ Ambience         ├─ Audio cues    │
│  ├─ Action feedback    ├─ Footsteps        ├─ Dialogue      │
│  ├─ Damage sounds      ├─ Environmental    ├─ Alerts        │
│  └─ Collection         └─ Weather          └─ Tutorials     │
│                                                              │
│  Emotion               Communication       Gameplay          │
│  ├─ Music              ├─ Voice acting     ├─ Enemy sounds  │
│  ├─ Stingers           ├─ Narration        ├─ Stealth cues  │
│  └─ Ambience           └─ Radio chatter    └─ Proximity     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Sound Event System Architecture

### Event-Based Audio Design

Modern game audio uses event-driven systems rather than direct sound playback:

```typescript
// Sound Event System
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
  weight: number; // For weighted random selection
  pitchVariation: { min: number; max: number };
  volumeVariation: { min: number; max: number };
}

interface EventParameter {
  name: string;
  defaultValue: number;
  range: { min: number; max: number };
  mapping: ParameterMapping; // How parameter affects playback
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

### Audio Manager Implementation

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

    // Create category submixes
    for (const category of Object.values(AudioCategory)) {
      const gain = this.audioContext.createGain();
      gain.connect(this.masterGain);
      this.categoryGains.set(category as AudioCategory, gain);
    }
  }

  // Register sound event
  public registerEvent(event: SoundEvent): void {
    this.eventLibrary.set(event.id, event);
  }

  // Play sound event
  public playEvent(
    eventId: string,
    position?: Vector3,
    parameters?: Record<string, number>
  ): SoundInstance | null {
    const event = this.eventLibrary.get(eventId);
    if (!event) {
      console.warn(`Sound event not found: ${eventId}`);
      return null;
    }

    // Check instance limits
    const instances = this.activeInstances.get(eventId) || [];
    if (instances.length >= event.playbackSettings.maxInstances) {
      const stolen = this.stealInstance(event, instances);
      if (!stolen) return null;
    }

    // Select sound variation
    const variation = this.selectVariation(event.sounds);
    if (!variation) return null;

    // Create instance
    const instance = new SoundInstance(
      this.audioContext,
      variation,
      event,
      position
    );

    // Apply parameters
    if (parameters) {
      for (const [name, value] of Object.entries(parameters)) {
        instance.setParameter(name, value);
      }
    }

    // Connect to category bus
    const categoryGain = this.categoryGains.get(event.category);
    if (categoryGain) {
      instance.connect(categoryGain);
    }

    // Track instance
    if (!this.activeInstances.has(eventId)) {
      this.activeInstances.set(eventId, []);
    }
    this.activeInstances.get(eventId)!.push(instance);

    // Start playback
    instance.play();

    // Handle cleanup when finished
    instance.onEnded = () => {
      const arr = this.activeInstances.get(eventId);
      if (arr) {
        const index = arr.indexOf(instance);
        if (index >= 0) arr.splice(index, 1);
      }
    };

    return instance;
  }

  // Stop sound event
  public stopEvent(eventId: string, fadeTime?: number): void {
    const instances = this.activeInstances.get(eventId);
    if (!instances) return;

    for (const instance of instances) {
      instance.stop(fadeTime);
    }
  }

  // Select variation based on weights
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

  // Instance stealing for max instance limits
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

  // Update listener position for 3D audio
  public updateListener(position: Vector3, forward: Vector3, up: Vector3): void {
    this.listenerPosition = position;
    this.listenerForward = forward;
    this.listenerUp = up;

    // Update Web Audio API listener
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

  // Volume controls
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

### Sound Instance Class

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

    // Create gain node
    this.gainNode = audioContext.createGain();

    // Create panner for 3D sounds
    if (event.spatialSettings.is3D && position) {
      this.pannerNode = audioContext.createPanner();
      this.configurePanner();
      this.pannerNode.connect(this.gainNode);
    }

    // Initialize default parameters
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
    // Load audio buffer
    const buffer = await this.loadAudioBuffer(this.variation.audioClip);
    if (!buffer) return;

    // Create source
    this.source = this.audioContext.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = this.event.playbackSettings.loop;

    // Apply pitch variation
    const pitchVar = this.variation.pitchVariation;
    const pitch = pitchVar.min + Math.random() * (pitchVar.max - pitchVar.min);
    this.source.playbackRate.value = pitch;

    // Apply volume variation
    const volVar = this.variation.volumeVariation;
    const volume = volVar.min + Math.random() * (volVar.max - volVar.min);
    this.gainNode.gain.value = volume;

    // Connect nodes
    if (this.pannerNode) {
      this.source.connect(this.pannerNode);
    } else {
      this.source.connect(this.gainNode);
    }

    // Handle fade in
    if (this.event.playbackSettings.fadeIn > 0) {
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + this.event.playbackSettings.fadeIn
      );
    }

    // Handle ended
    this.source.onended = () => {
      this.isPlaying = false;
      if (this.onEnded) this.onEnded();
    };

    // Start playback
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

    // Clamp value to range
    value = Math.max(param.range.min, Math.min(param.range.max, value));
    this.parameters.set(name, value);

    // Apply parameter mapping
    this.applyParameterMapping(param, value);
  }

  private applyParameterMapping(param: EventParameter, value: number): void {
    // Parameter mappings define how parameters affect playback
    // This would be implemented based on your specific mapping system
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
      console.error(`Failed to load audio: ${url}`, error);
      return null;
    }
  }
}
```

---

## Audio Trigger System

### Trigger Types

```typescript
// Audio Trigger Types
enum TriggerType {
  Enter = 'enter',        // Player enters trigger zone
  Exit = 'exit',          // Player exits trigger zone
  Stay = 'stay',          // While player is in zone
  Event = 'event',        // Custom game event
  Animation = 'animation', // Animation event
  Collision = 'collision', // Physics collision
  Proximity = 'proximity', // Distance-based
  Random = 'random',       // Random interval
  State = 'state'          // State machine transition
}

interface AudioTrigger {
  id: string;
  type: TriggerType;
  eventId: string;         // Sound event to play
  conditions: TriggerCondition[];
  parameters?: Record<string, number | ParameterBinding>;
  cooldown: number;
  probability: number;     // 0-1, chance to trigger
}

interface TriggerCondition {
  type: 'tag' | 'layer' | 'component' | 'state' | 'custom';
  value: any;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
}

interface ParameterBinding {
  source: 'velocity' | 'distance' | 'health' | 'custom';
  customSource?: string;
  curve?: AnimationCurve;  // Remap value
}
```

### Audio Trigger Zone

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
    // Update cooldowns
    for (const [id, time] of this.cooldowns) {
      const newTime = time - deltaTime;
      if (newTime <= 0) {
        this.cooldowns.delete(id);
      } else {
        this.cooldowns.set(id, newTime);
      }
    }

    // Check entities
    for (const entity of entities) {
      const wasInZone = this.entitiesInZone.has(entity.id);
      const isInZone = this.isInBounds(entity.position);

      if (isInZone && !wasInZone) {
        // Entity entered
        this.entitiesInZone.add(entity.id);
        this.handleTrigger(TriggerType.Enter, entity);
      } else if (!isInZone && wasInZone) {
        // Entity exited
        this.entitiesInZone.delete(entity.id);
        this.handleTrigger(TriggerType.Exit, entity);
      } else if (isInZone) {
        // Entity staying
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

      // Check cooldown
      if (this.cooldowns.has(trigger.id)) continue;

      // Check conditions
      if (!this.checkConditions(trigger.conditions, entity)) continue;

      // Check probability
      if (Math.random() > trigger.probability) continue;

      // Resolve parameters
      const params = this.resolveParameters(trigger.parameters, entity);

      // Play sound
      const instance = this.audioManager.playEvent(
        trigger.eventId,
        entity.position,
        params
      );

      if (instance) {
        this.activeInstances.set(trigger.id, instance);
      }

      // Set cooldown
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

    // Apply curve if defined
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

### Animation Event Audio

```typescript
class AnimationAudioHandler {
  private audioManager: AudioManager;
  private eventMappings: Map<string, string> = new Map(); // animEvent -> soundEvent

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

    // Get position from bone if available
    let position = entity.position;
    if (animationData?.boneName) {
      const bonePos = entity.getBoneWorldPosition?.(animationData.boneName);
      if (bonePos) position = bonePos;
    }

    // Extract parameters from animation data
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
    // Map surface types to numeric values for parameter control
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

// Footstep system example
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
    // Detect surface type
    const surface = this.surfaceDetector.getSurfaceAt(footPosition);
    const eventId = this.footstepEvents.get(surface) || 'footstep_default';

    // Calculate intensity from velocity
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

## Spatial Audio

### 3D Audio Implementation

```typescript
class SpatialAudioSystem {
  private audioContext: AudioContext;
  private listener: AudioListener;
  private sources: Map<string, SpatialAudioSource> = new Map();

  // Occlusion/obstruction
  private occlusionRaycaster: Raycaster;
  private occlusionLayers: number;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.listener = audioContext.listener;
    this.occlusionRaycaster = new Raycaster();
    this.occlusionLayers = 1; // Default collision layer
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
    // Extract forward and up vectors from rotation
    const forward = this.rotateVector({ x: 0, y: 0, z: -1 }, rotation);
    const up = this.rotateVector({ x: 0, y: 1, z: 0 }, rotation);

    // Update Web Audio listener
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

    // Update occlusion for all sources
    this.updateOcclusion(position);
  }

  private updateOcclusion(listenerPosition: Vector3): void {
    for (const [id, source] of this.sources) {
      const sourcePos = source.getPosition();

      // Raycast from listener to source
      const direction = {
        x: sourcePos.x - listenerPosition.x,
        y: sourcePos.y - listenerPosition.y,
        z: sourcePos.z - listenerPosition.z
      };
      const distance = Math.sqrt(
        direction.x ** 2 + direction.y ** 2 + direction.z ** 2
      );

      // Normalize direction
      direction.x /= distance;
      direction.y /= distance;
      direction.z /= distance;

      // Check for obstacles
      const hits = this.occlusionRaycaster.cast(
        listenerPosition,
        direction,
        distance,
        this.occlusionLayers
      );

      // Calculate occlusion factor
      let occlusion = 0;
      for (const hit of hits) {
        occlusion += hit.material?.occlusionFactor ?? 0.5;
      }
      occlusion = Math.min(occlusion, 1);

      source.setOcclusion(occlusion);
    }
  }

  private rotateVector(v: Vector3, q: Quaternion): Vector3 {
    // Quaternion rotation
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

interface SpatialSourceOptions {
  minDistance: number;
  maxDistance: number;
  rolloff: 'linear' | 'exponential' | 'custom';
  customRolloffCurve?: number[];
  cone?: {
    innerAngle: number;
    outerAngle: number;
    outerGain: number;
  };
}

class SpatialAudioSource {
  private audioContext: AudioContext;
  private panner: PannerNode;
  private gainNode: GainNode;
  private lowpassFilter: BiquadFilterNode;
  private position: Vector3;

  constructor(
    audioContext: AudioContext,
    position: Vector3,
    options: SpatialSourceOptions
  ) {
    this.audioContext = audioContext;
    this.position = position;

    // Create panner
    this.panner = audioContext.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = options.rolloff === 'linear' ? 'linear' : 'exponential';
    this.panner.refDistance = options.minDistance;
    this.panner.maxDistance = options.maxDistance;
    this.panner.rolloffFactor = 1;

    // Set position
    this.panner.positionX.setValueAtTime(position.x, audioContext.currentTime);
    this.panner.positionY.setValueAtTime(position.y, audioContext.currentTime);
    this.panner.positionZ.setValueAtTime(position.z, audioContext.currentTime);

    // Cone settings
    if (options.cone) {
      this.panner.coneInnerAngle = options.cone.innerAngle;
      this.panner.coneOuterAngle = options.cone.outerAngle;
      this.panner.coneOuterGain = options.cone.outerGain;
    }

    // Create gain for occlusion
    this.gainNode = audioContext.createGain();

    // Create lowpass for occlusion effect
    this.lowpassFilter = audioContext.createBiquadFilter();
    this.lowpassFilter.type = 'lowpass';
    this.lowpassFilter.frequency.value = 22000;

    // Connect: source -> panner -> lowpass -> gain -> destination
    this.panner.connect(this.lowpassFilter);
    this.lowpassFilter.connect(this.gainNode);
  }

  public getPosition(): Vector3 {
    return this.position;
  }

  public setPosition(position: Vector3): void {
    this.position = position;
    const time = this.audioContext.currentTime;
    this.panner.positionX.linearRampToValueAtTime(position.x, time + 0.02);
    this.panner.positionY.linearRampToValueAtTime(position.y, time + 0.02);
    this.panner.positionZ.linearRampToValueAtTime(position.z, time + 0.02);
  }

  public setOcclusion(occlusion: number): void {
    const time = this.audioContext.currentTime;

    // Reduce volume
    const gainValue = 1 - occlusion * 0.8;
    this.gainNode.gain.linearRampToValueAtTime(gainValue, time + 0.05);

    // Apply lowpass filtering (muffle effect)
    const filterFreq = 22000 - occlusion * 18000;
    this.lowpassFilter.frequency.linearRampToValueAtTime(filterFreq, time + 0.05);
  }

  public getOutput(): AudioNode {
    return this.gainNode;
  }
}
```

---

## Adaptive Music System

### Music Layer System

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
        // Fade in on next beat
        player.fadeIn(this.nextBeatTime, 1.0);
      } else if (!shouldPlay && player.isPlaying()) {
        // Fade out
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
    // Start all layers (they'll control their own volume)
    this.nextBeatTime = this.audioContext.currentTime;

    for (const player of this.layers.values()) {
      player.start(this.nextBeatTime);
    }

    // Start beat tracking
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
    // Fade out current layers
    for (const player of this.layers.values()) {
      player.fadeOut(this.audioContext.currentTime, duration);
    }

    // Load and fade in new layers
    setTimeout(() => {
      this.layers.clear();
      this.loadMusicTrack(newLayers);
      this.start();
    }, duration * 1000);
  }

  private beatSyncTransition(newLayers: MusicLayer[]): void {
    // Wait for next bar (assuming 4/4 time)
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

class MusicLayerPlayer {
  private audioContext: AudioContext;
  private layer: MusicLayer;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private playing: boolean = false;
  private buffer: AudioBuffer | null = null;

  constructor(
    audioContext: AudioContext,
    layer: MusicLayer,
    destination: AudioNode
  ) {
    this.audioContext = audioContext;
    this.layer = layer;
    this.gainNode = audioContext.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(destination);

    // Load audio
    this.loadAudio();
  }

  private async loadAudio(): Promise<void> {
    const response = await fetch(this.layer.audioClip);
    const arrayBuffer = await response.arrayBuffer();
    this.buffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  public getLayer(): MusicLayer {
    return this.layer;
  }

  public isPlaying(): boolean {
    return this.playing && this.gainNode.gain.value > 0.01;
  }

  public start(time: number): void {
    if (!this.buffer) return;

    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.loop = true;
    this.source.connect(this.gainNode);
    this.source.start(time);
    this.playing = true;
  }

  public stop(): void {
    if (this.source) {
      this.source.stop();
      this.source = null;
    }
    this.playing = false;
  }

  public fadeIn(startTime: number, duration: number): void {
    this.gainNode.gain.setValueAtTime(
      this.gainNode.gain.value,
      startTime
    );
    this.gainNode.gain.linearRampToValueAtTime(
      this.layer.volume,
      startTime + duration
    );
  }

  public fadeOut(startTime: number, duration: number): void {
    this.gainNode.gain.setValueAtTime(
      this.gainNode.gain.value,
      startTime
    );
    this.gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
  }
}
```

---

## Best Practices

### Audio Design Guidelines

```typescript
/**
 * Audio Design Checklist:
 *
 * 1. Variation
 *    - Use multiple sound variations (3-5 minimum)
 *    - Add pitch and volume randomization
 *    - Avoid machine-gun effect with cooldowns
 *
 * 2. Priority System
 *    - Player actions: Highest priority
 *    - Combat sounds: High priority
 *    - Environmental: Medium priority
 *    - Ambience: Low priority
 *
 * 3. Performance
 *    - Limit simultaneous voices (32-64 typical)
 *    - Use voice stealing intelligently
 *    - Stream large files, decode small ones
 *
 * 4. Spatial Audio
 *    - Match rolloff to environment size
 *    - Use occlusion for walls
 *    - Consider reverb zones
 *
 * 5. Feedback
 *    - Immediate response (<50ms)
 *    - Clear cause-effect relationship
 *    - Consistent volume levels
 */

// Example: Well-designed footstep system
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

## Summary

Game sound design is a multifaceted discipline that combines technical implementation with creative artistry. Key takeaways:

1. **Event-Based Architecture**: Use sound events rather than direct playback for flexibility
2. **Trigger Systems**: Implement robust trigger systems for gameplay integration
3. **Spatial Audio**: Leverage 3D positioning, occlusion, and distance attenuation
4. **Adaptive Music**: Create dynamic music systems that respond to gameplay
5. **Optimization**: Manage voice counts, use pooling, and prioritize sounds

Well-designed audio significantly enhances player immersion and game feel, making it a critical aspect of game development.

---

## Further Reading

- "A Composer's Guide to Game Music" - Winifred Phillips
- FMOD and Wwise documentation
- Game Audio Programming books by Guy Somberg
- GDC Audio Track presentations
