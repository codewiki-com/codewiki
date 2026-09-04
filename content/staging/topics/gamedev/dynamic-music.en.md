---
title: Dynamic Music System Design
description: "Implement adaptive game music: layering, transitions, and context-aware music"
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - dynamic music
  - adaptive music
  - audio
  - game music
status: imported
origin: old/src/content/docs/gamedev/dynamic-music.en.md
divergence: 0.441
issues:
  - divergent
legacy:
  category: GameDev
  subcategory: Audio
  order: 22
  lastUpdated: 2026-01-07
---

Dynamic music systems represent one of the most powerful tools in a game audio designer's arsenal. Unlike static soundtracks that play linearly regardless of gameplay, dynamic music responds to the player's actions, emotional state, and game context in real-time. This creates deeply immersive experiences where the music feels alive and reactive.

We cover the fundamental concepts, implementation techniques, and practical examples for building professional-grade dynamic music systems using industry-standard middleware and custom solutions.

## Understanding Dynamic Music

### What is Dynamic Music?

Dynamic music (also called adaptive music or interactive music) is a scoring technique where the musical content changes based on gameplay parameters. The music system monitors game state and adjusts the composition accordingly, creating a seamless audio experience that enhances player immersion.

Consider a stealth game: as the player sneaks through enemy territory, subtle ambient music plays. When spotted, the music immediately shifts to intense combat themes. After escaping, it gradually returns to the ambient state. This continuous musical narrative would be impossible with traditional linear soundtracks.

### Key Concepts

```
Dynamic Music System Architecture:

┌─────────────────────────────────────────────────────────────────┐
│                       Game Engine                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Game State   │  │ Player       │  │ Environment          │  │
│  │ Manager      │  │ Controller   │  │ Manager              │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └────────────────┬┴──────────────────────┘              │
│                          │                                      │
│                          ▼                                      │
│            ┌─────────────────────────────┐                     │
│            │   Music State Machine       │                     │
│            │   ┌───────────────────────┐ │                     │
│            │   │ Current State: Combat │ │                     │
│            │   │ Intensity: 0.75       │ │                     │
│            │   │ Threat Level: High    │ │                     │
│            │   └───────────────────────┘ │                     │
│            └─────────────┬───────────────┘                     │
│                          │                                      │
│                          ▼                                      │
│            ┌─────────────────────────────┐                     │
│            │   Audio Middleware          │                     │
│            │   (Wwise/FMOD/Custom)       │                     │
│            └─────────────┬───────────────┘                     │
│                          │                                      │
│                          ▼                                      │
│            ┌─────────────────────────────┐                     │
│            │   Audio Output              │                     │
│            │   Mixed & Synchronized      │                     │
│            └─────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

**Core Terminology:**

| Term | Definition |
|------|------------|
| Horizontal Re-sequencing | Changing which musical sections play in sequence |
| Vertical Layering | Adding or removing simultaneous instrument layers |
| Stems | Individual audio tracks (drums, bass, melody, etc.) |
| Stinger | Short musical cue triggered by events |
| Transition | Crossfade or switch between musical states |
| Beat Sync | Aligning musical changes to tempo grid |
| Game Parameter | Value from game that influences music |

### Horizontal vs Vertical Approaches

Dynamic music systems typically use two complementary approaches:

**Horizontal Re-sequencing (Time-based):**
- Changes WHAT plays over time
- Sequences different musical segments
- Controls musical structure and progression

**Vertical Layering (Simultaneous):**
- Changes HOW much plays at once
- Adds/removes instrument layers
- Controls intensity and density

```
Horizontal Re-sequencing:
Time →
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Intro   │→│ Build   │→│ Combat  │→│ Resolve │
└─────────┘ └─────────┘ └─────────┘ └─────────┘

Vertical Layering:
Intensity →
        High   │ ████████ Full Orchestra
               │ ████████ Strings + Brass
               │ ████████ Percussion
               │ ████████ Bass + Drums
        Low    │ ████████ Ambient Pad
               └──────────────────────────
```

---

## Horizontal Layering (Re-sequencing)

Horizontal re-sequencing involves arranging musical segments in different orders based on game events. This approach works well for narrative-driven games where music needs to follow story beats.

### Segment-Based Structure

```typescript
// Musical segment definition
interface MusicSegment {
  id: string;
  name: string;
  audioFile: string;
  duration: number;        // in seconds
  bpm: number;
  beatsPerBar: number;
  totalBars: number;
  transitionPoints: number[];  // valid transition bar numbers
  nextSegments: string[];      // valid following segments
  tags: string[];              // for intelligent selection
}

// Segment collection for a game area
const dungeonMusic: MusicSegment[] = [
  {
    id: "dungeon_intro",
    name: "Dungeon Intro",
    audioFile: "audio/music/dungeon_intro.ogg",
    duration: 16,
    bpm: 90,
    beatsPerBar: 4,
    totalBars: 8,
    transitionPoints: [4, 8],
    nextSegments: ["dungeon_explore_a", "dungeon_explore_b"],
    tags: ["intro", "ambient", "low_intensity"]
  },
  {
    id: "dungeon_explore_a",
    name: "Exploration A",
    audioFile: "audio/music/dungeon_explore_a.ogg",
    duration: 32,
    bpm: 90,
    beatsPerBar: 4,
    totalBars: 16,
    transitionPoints: [4, 8, 12, 16],
    nextSegments: ["dungeon_explore_b", "dungeon_tension", "dungeon_combat_intro"],
    tags: ["exploration", "ambient", "medium_intensity"]
  },
  {
    id: "dungeon_combat_intro",
    name: "Combat Intro",
    audioFile: "audio/music/dungeon_combat_intro.ogg",
    duration: 8,
    bpm: 120,
    beatsPerBar: 4,
    totalBars: 4,
    transitionPoints: [4],
    nextSegments: ["dungeon_combat_loop"],
    tags: ["combat", "transition", "high_intensity"]
  },
  {
    id: "dungeon_combat_loop",
    name: "Combat Loop",
    audioFile: "audio/music/dungeon_combat_loop.ogg",
    duration: 16,
    bpm: 120,
    beatsPerBar: 4,
    totalBars: 8,
    transitionPoints: [4, 8],
    nextSegments: ["dungeon_combat_loop", "dungeon_combat_outro"],
    tags: ["combat", "loop", "high_intensity"]
  }
];
```

### Segment Sequencer Implementation

```typescript
class MusicSequencer {
  private segments: Map<string, MusicSegment> = new Map();
  private currentSegment: MusicSegment | null = null;
  private audioContext: AudioContext;
  private currentSource: AudioBufferSourceNode | null = null;
  private nextSource: AudioBufferSourceNode | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();

  private currentBar: number = 0;
  private isPlaying: boolean = false;
  private scheduledTransition: string | null = null;

  constructor(segments: MusicSegment[]) {
    this.audioContext = new AudioContext();
    segments.forEach(seg => this.segments.set(seg.id, seg));
  }

  async loadSegment(segmentId: string): Promise<void> {
    if (this.audioBuffers.has(segmentId)) return;

    const segment = this.segments.get(segmentId);
    if (!segment) throw new Error(`Segment not found: ${segmentId}`);

    const response = await fetch(segment.audioFile);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.audioBuffers.set(segmentId, audioBuffer);
  }

  async preloadSegments(segmentIds: string[]): Promise<void> {
    await Promise.all(segmentIds.map(id => this.loadSegment(id)));
  }

  async play(startSegmentId: string): Promise<void> {
    await this.loadSegment(startSegmentId);

    const segment = this.segments.get(startSegmentId)!;
    this.currentSegment = segment;
    this.isPlaying = true;
    this.currentBar = 0;

    this.playSegment(segment);
    this.startBarTracker();

    // Preload possible next segments
    this.preloadNextSegments(segment);
  }

  private playSegment(segment: MusicSegment): void {
    const buffer = this.audioBuffers.get(segment.id)!;

    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = buffer;
    this.currentSource.connect(this.audioContext.destination);
    this.currentSource.start();

    // Handle segment end
    this.currentSource.onended = () => {
      if (this.isPlaying) {
        this.onSegmentEnd();
      }
    };
  }

  private startBarTracker(): void {
    if (!this.currentSegment) return;

    const barDuration = (60 / this.currentSegment.bpm) * this.currentSegment.beatsPerBar;

    const trackBars = () => {
      if (!this.isPlaying || !this.currentSegment) return;

      this.currentBar++;

      // Check for scheduled transition at valid transition point
      if (this.scheduledTransition &&
          this.currentSegment.transitionPoints.includes(this.currentBar)) {
        this.executeTransition(this.scheduledTransition);
        this.scheduledTransition = null;
      }

      // Continue tracking if not at end of segment
      if (this.currentBar < this.currentSegment.totalBars) {
        setTimeout(trackBars, barDuration * 1000);
      }
    };

    setTimeout(trackBars, barDuration * 1000);
  }

  scheduleTransition(targetSegmentId: string): boolean {
    if (!this.currentSegment) return false;

    // Validate transition is allowed
    if (!this.currentSegment.nextSegments.includes(targetSegmentId)) {
      console.warn(`Invalid transition from ${this.currentSegment.id} to ${targetSegmentId}`);
      return false;
    }

    this.scheduledTransition = targetSegmentId;
    this.loadSegment(targetSegmentId);
    return true;
  }

  private async executeTransition(targetSegmentId: string): Promise<void> {
    const targetSegment = this.segments.get(targetSegmentId)!;

    // Stop current segment
    if (this.currentSource) {
      this.currentSource.stop();
    }

    // Start new segment
    this.currentSegment = targetSegment;
    this.currentBar = 0;
    this.playSegment(targetSegment);
    this.startBarTracker();
    this.preloadNextSegments(targetSegment);
  }

  private onSegmentEnd(): void {
    if (!this.currentSegment) return;

    // Auto-select next segment if none scheduled
    const nextSegmentId = this.scheduledTransition ||
      this.selectNextSegment(this.currentSegment);

    if (nextSegmentId) {
      this.executeTransition(nextSegmentId);
    }
    this.scheduledTransition = null;
  }

  private selectNextSegment(current: MusicSegment): string | null {
    if (current.nextSegments.length === 0) return null;

    // Simple random selection - can be enhanced with context awareness
    const index = Math.floor(Math.random() * current.nextSegments.length);
    return current.nextSegments[index];
  }

  private async preloadNextSegments(segment: MusicSegment): Promise<void> {
    await this.preloadSegments(segment.nextSegments);
  }

  stop(): void {
    this.isPlaying = false;
    if (this.currentSource) {
      this.currentSource.stop();
    }
    this.currentSegment = null;
    this.currentBar = 0;
  }
}
```

### Transition Bridges

For smoother transitions between segments with different tempos or keys, use transition bridges:

```typescript
interface TransitionBridge {
  fromSegment: string;
  toSegment: string;
  bridgeFile: string;
  duration: number;
}

class MusicSequencerWithBridges extends MusicSequencer {
  private bridges: Map<string, TransitionBridge> = new Map();

  registerBridge(bridge: TransitionBridge): void {
    const key = `${bridge.fromSegment}->${bridge.toSegment}`;
    this.bridges.set(key, bridge);
  }

  protected async executeTransitionWithBridge(
    fromId: string,
    toId: string
  ): Promise<void> {
    const bridgeKey = `${fromId}->${toId}`;
    const bridge = this.bridges.get(bridgeKey);

    if (bridge) {
      // Play bridge first, then target
      await this.playBridge(bridge);
    }

    await this.executeTransition(toId);
  }

  private async playBridge(bridge: TransitionBridge): Promise<void> {
    // Load and play bridge audio
    const response = await fetch(bridge.bridgeFile);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await this.audioContext.decodeAudioData(arrayBuffer);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start();

    // Wait for bridge to complete
    await new Promise(resolve => setTimeout(resolve, bridge.duration * 1000));
  }
}
```

---

## Vertical Layering

Vertical layering involves playing multiple audio stems simultaneously and adjusting their volumes based on game parameters. This creates smooth intensity transitions without interrupting the musical flow.

### Layer Architecture

```typescript
interface MusicLayer {
  id: string;
  name: string;
  audioFile: string;
  baseVolume: number;         // 0.0 to 1.0
  intensityThreshold: number; // minimum intensity to play
  fadeInTime: number;         // seconds
  fadeOutTime: number;        // seconds
  tags: string[];
}

interface VerticalMusicTrack {
  id: string;
  name: string;
  layers: MusicLayer[];
  duration: number;
  bpm: number;
  loopPoints: {
    start: number;  // in seconds
    end: number;
  };
}

const combatTrack: VerticalMusicTrack = {
  id: "combat_main",
  name: "Main Combat Theme",
  duration: 64,
  bpm: 120,
  loopPoints: { start: 0, end: 64 },
  layers: [
    {
      id: "ambient_pad",
      name: "Ambient Pad",
      audioFile: "audio/music/combat/ambient_pad.ogg",
      baseVolume: 0.4,
      intensityThreshold: 0.0,
      fadeInTime: 2.0,
      fadeOutTime: 2.0,
      tags: ["ambient", "always_on"]
    },
    {
      id: "bass_drums",
      name: "Bass & Drums",
      audioFile: "audio/music/combat/bass_drums.ogg",
      baseVolume: 0.7,
      intensityThreshold: 0.2,
      fadeInTime: 0.5,
      fadeOutTime: 1.0,
      tags: ["rhythm", "percussion"]
    },
    {
      id: "strings",
      name: "String Section",
      audioFile: "audio/music/combat/strings.ogg",
      baseVolume: 0.6,
      intensityThreshold: 0.4,
      fadeInTime: 1.5,
      fadeOutTime: 2.0,
      tags: ["melody", "strings"]
    },
    {
      id: "brass",
      name: "Brass Section",
      audioFile: "audio/music/combat/brass.ogg",
      baseVolume: 0.8,
      intensityThreshold: 0.6,
      fadeInTime: 1.0,
      fadeOutTime: 1.5,
      tags: ["melody", "brass", "intense"]
    },
    {
      id: "full_orchestra",
      name: "Full Orchestra Hit",
      audioFile: "audio/music/combat/full_orchestra.ogg",
      baseVolume: 1.0,
      intensityThreshold: 0.85,
      fadeInTime: 0.3,
      fadeOutTime: 0.5,
      tags: ["climax", "full"]
    }
  ]
};
```

### Vertical Layer Manager

```typescript
class VerticalLayerManager {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private layers: Map<string, {
    source: AudioBufferSourceNode;
    gainNode: GainNode;
    config: MusicLayer;
    isActive: boolean;
  }> = new Map();

  private currentIntensity: number = 0;
  private targetIntensity: number = 0;
  private track: VerticalMusicTrack | null = null;
  private isPlaying: boolean = false;

  constructor() {
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
  }

  async loadTrack(track: VerticalMusicTrack): Promise<void> {
    this.track = track;

    // Load all layers in parallel
    await Promise.all(track.layers.map(async (layer) => {
      const response = await fetch(layer.audioFile);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Create audio nodes
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = track.loopPoints.start;
      source.loopEnd = track.loopPoints.end;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0; // Start silent

      source.connect(gainNode);
      gainNode.connect(this.masterGain);

      this.layers.set(layer.id, {
        source,
        gainNode,
        config: layer,
        isActive: false
      });
    }));
  }

  play(): void {
    if (this.isPlaying) return;

    this.isPlaying = true;
    const startTime = this.audioContext.currentTime;

    // Start all layers at the same time for sync
    this.layers.forEach(layer => {
      layer.source.start(startTime);
    });

    // Update layers based on initial intensity
    this.updateLayers();

    // Start intensity interpolation loop
    this.startIntensityLoop();
  }

  setIntensity(value: number): void {
    this.targetIntensity = Math.max(0, Math.min(1, value));
  }

  private startIntensityLoop(): void {
    const update = () => {
      if (!this.isPlaying) return;

      // Smooth interpolation towards target
      const delta = this.targetIntensity - this.currentIntensity;
      if (Math.abs(delta) > 0.001) {
        this.currentIntensity += delta * 0.05; // Smoothing factor
        this.updateLayers();
      }

      requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  }

  private updateLayers(): void {
    const currentTime = this.audioContext.currentTime;

    this.layers.forEach(layer => {
      const shouldBeActive = this.currentIntensity >= layer.config.intensityThreshold;
      const targetVolume = shouldBeActive ? layer.config.baseVolume : 0;

      if (shouldBeActive !== layer.isActive) {
        layer.isActive = shouldBeActive;

        // Schedule fade
        const fadeTime = shouldBeActive ?
          layer.config.fadeInTime :
          layer.config.fadeOutTime;

        layer.gainNode.gain.cancelScheduledValues(currentTime);
        layer.gainNode.gain.setValueAtTime(
          layer.gainNode.gain.value,
          currentTime
        );
        layer.gainNode.gain.linearRampToValueAtTime(
          targetVolume,
          currentTime + fadeTime
        );
      }
    });
  }

  stop(): void {
    this.isPlaying = false;

    const currentTime = this.audioContext.currentTime;

    // Fade out all layers
    this.layers.forEach(layer => {
      layer.gainNode.gain.cancelScheduledValues(currentTime);
      layer.gainNode.gain.linearRampToValueAtTime(0, currentTime + 1);

      // Stop source after fade
      setTimeout(() => layer.source.stop(), 1100);
    });

    this.layers.clear();
  }

  // Get current state for debugging
  getLayerStates(): { id: string; active: boolean; volume: number }[] {
    return Array.from(this.layers.entries()).map(([id, layer]) => ({
      id,
      active: layer.isActive,
      volume: layer.gainNode.gain.value
    }));
  }
}
```

### Intensity Calculation Example

```typescript
interface CombatContext {
  enemyCount: number;
  playerHealthPercent: number;
  nearbyEnemyDistance: number;
  bossPresent: boolean;
  inCombat: boolean;
}

class CombatIntensityCalculator {
  // Weights for different factors
  private readonly weights = {
    enemyCount: 0.3,
    playerHealth: 0.25,
    proximity: 0.25,
    boss: 0.2
  };

  calculate(context: CombatContext): number {
    if (!context.inCombat) {
      return 0.1; // Ambient exploration level
    }

    // Enemy count contribution (more enemies = higher intensity)
    const enemyFactor = Math.min(context.enemyCount / 5, 1);

    // Player health contribution (lower health = higher intensity)
    const healthFactor = 1 - context.playerHealthPercent;

    // Proximity contribution (closer enemies = higher intensity)
    const proximityFactor = Math.max(0, 1 - (context.nearbyEnemyDistance / 20));

    // Boss presence is a significant intensity boost
    const bossFactor = context.bossPresent ? 1 : 0;

    // Calculate weighted sum
    let intensity =
      enemyFactor * this.weights.enemyCount +
      healthFactor * this.weights.playerHealth +
      proximityFactor * this.weights.proximity +
      bossFactor * this.weights.boss;

    // Ensure minimum combat intensity
    intensity = Math.max(0.3, intensity);

    return Math.min(1, intensity);
  }
}

// Usage in game loop
class GameMusicController {
  private layerManager: VerticalLayerManager;
  private intensityCalc: CombatIntensityCalculator;

  update(context: CombatContext): void {
    const intensity = this.intensityCalc.calculate(context);
    this.layerManager.setIntensity(intensity);
  }
}
```

---

## Music Transition Techniques

Smooth transitions between musical states are crucial for maintaining immersion. The primary transition techniques:

### Crossfade Transitions

The simplest and most common transition type:

```typescript
class CrossfadeTransition {
  private audioContext: AudioContext;

  async execute(
    fromSource: AudioBufferSourceNode,
    fromGain: GainNode,
    toSource: AudioBufferSourceNode,
    toGain: GainNode,
    duration: number
  ): Promise<void> {
    const currentTime = this.audioContext.currentTime;

    // Initialize gain values
    fromGain.gain.setValueAtTime(1, currentTime);
    toGain.gain.setValueAtTime(0, currentTime);

    // Start the new source
    toSource.start(currentTime);

    // Equal-power crossfade for perceptually smooth transition
    const steps = 100;
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const time = currentTime + (i * stepDuration);

      // Equal-power crossfade curves
      const fadeOut = Math.cos(t * Math.PI / 2);
      const fadeIn = Math.sin(t * Math.PI / 2);

      fromGain.gain.setValueAtTime(fadeOut, time);
      toGain.gain.setValueAtTime(fadeIn, time);
    }

    // Stop old source after crossfade completes
    fromSource.stop(currentTime + duration + 0.1);
  }
}
```

### Beat-Synchronized Transitions

Transitions that align with the musical beat feel more natural:

```typescript
class BeatSyncTransition {
  private audioContext: AudioContext;
  private bpm: number;
  private startTime: number;

  constructor(audioContext: AudioContext, bpm: number) {
    this.audioContext = audioContext;
    this.bpm = bpm;
    this.startTime = audioContext.currentTime;
  }

  // Get time until next beat
  getTimeToNextBeat(): number {
    const beatDuration = 60 / this.bpm;
    const elapsed = this.audioContext.currentTime - this.startTime;
    const beatPosition = elapsed % beatDuration;
    return beatDuration - beatPosition;
  }

  // Get time until next bar (assuming 4/4 time)
  getTimeToNextBar(): number {
    const barDuration = (60 / this.bpm) * 4;
    const elapsed = this.audioContext.currentTime - this.startTime;
    const barPosition = elapsed % barDuration;
    return barDuration - barPosition;
  }

  // Schedule transition on next beat
  scheduleOnNextBeat(callback: () => void): void {
    const delay = this.getTimeToNextBeat();
    setTimeout(callback, delay * 1000);
  }

  // Schedule transition on next bar
  scheduleOnNextBar(callback: () => void): void {
    const delay = this.getTimeToNextBar();
    setTimeout(callback, delay * 1000);
  }

  // Schedule transition on specific beat within bar
  scheduleOnBeat(beatNumber: number, callback: () => void): void {
    const barDuration = (60 / this.bpm) * 4;
    const beatDuration = 60 / this.bpm;
    const elapsed = this.audioContext.currentTime - this.startTime;
    const barPosition = elapsed % barDuration;

    let targetPosition = (beatNumber - 1) * beatDuration;
    if (targetPosition <= barPosition) {
      targetPosition += barDuration; // Wait for next bar
    }

    const delay = targetPosition - barPosition;
    setTimeout(callback, delay * 1000);
  }
}
```

### Stinger Transitions

Musical stingers are short cues that bridge between states:

```typescript
interface Stinger {
  id: string;
  audioFile: string;
  duration: number;
  tailDuration: number;  // Time before next track can start
  volume: number;
  tags: string[];
}

class StingerManager {
  private audioContext: AudioContext;
  private stingers: Map<string, AudioBuffer> = new Map();
  private stingerGain: GainNode;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.stingerGain = audioContext.createGain();
    this.stingerGain.connect(audioContext.destination);
  }

  async loadStinger(stinger: Stinger): Promise<void> {
    const response = await fetch(stinger.audioFile);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.stingers.set(stinger.id, buffer);
  }

  playStinger(
    stingerId: string,
    volume: number = 1.0
  ): Promise<void> {
    return new Promise((resolve) => {
      const buffer = this.stingers.get(stingerId);
      if (!buffer) {
        console.warn(`Stinger not found: ${stingerId}`);
        resolve();
        return;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this.stingerGain);

      source.onended = () => resolve();
      source.start();
    });
  }

  // Play stinger and transition music simultaneously
  async playStingerWithTransition(
    stingerId: string,
    musicTransition: () => Promise<void>,
    stingerConfig: Stinger
  ): Promise<void> {
    // Start stinger
    const stingerPromise = this.playStinger(stingerId);

    // Wait for tail duration before starting music transition
    await new Promise(resolve =>
      setTimeout(resolve, stingerConfig.tailDuration * 1000)
    );

    // Execute music transition
    await musicTransition();

    // Wait for stinger to complete
    await stingerPromise;
  }
}
```

### Phrase-Aware Transitions

Advanced transitions that wait for musical phrases to complete:

```typescript
interface MusicPhrase {
  startBar: number;
  endBar: number;
  canExitEarly: boolean;
  exitPoints: number[];  // Bar numbers where early exit is allowed
}

class PhraseAwareTransitionManager {
  private currentPhrase: MusicPhrase | null = null;
  private phrases: MusicPhrase[];
  private currentBar: number = 0;
  private pendingTransition: (() => void) | null = null;

  constructor(phrases: MusicPhrase[]) {
    this.phrases = phrases;
  }

  updateBar(barNumber: number): void {
    this.currentBar = barNumber;

    // Update current phrase
    this.currentPhrase = this.phrases.find(
      p => barNumber >= p.startBar && barNumber <= p.endBar
    ) || null;

    // Check if we can execute pending transition
    if (this.pendingTransition && this.canTransitionNow()) {
      this.pendingTransition();
      this.pendingTransition = null;
    }
  }

  private canTransitionNow(): boolean {
    if (!this.currentPhrase) return true;

    // Check if at phrase end
    if (this.currentBar === this.currentPhrase.endBar) return true;

    // Check if at valid exit point
    if (this.currentPhrase.canExitEarly &&
        this.currentPhrase.exitPoints.includes(this.currentBar)) {
      return true;
    }

    return false;
  }

  requestTransition(callback: () => void): void {
    if (this.canTransitionNow()) {
      callback();
    } else {
      this.pendingTransition = callback;
    }
  }

  // Get estimated time until transition can occur
  getEstimatedTransitionDelay(bpm: number): number {
    if (!this.currentPhrase || this.canTransitionNow()) return 0;

    const barDuration = (60 / bpm) * 4;

    // Find next valid exit point
    const nextExit = this.currentPhrase.canExitEarly ?
      this.currentPhrase.exitPoints.find(b => b > this.currentBar) :
      this.currentPhrase.endBar;

    const barsToWait = (nextExit || this.currentPhrase.endBar) - this.currentBar;
    return barsToWait * barDuration;
  }
}
```

---

## State Machines and Triggers

A robust music system needs a state machine to manage the overall musical state and respond to game events.

### Music State Machine

```typescript
enum MusicState {
  SILENCE = "silence",
  AMBIENT = "ambient",
  EXPLORATION = "exploration",
  TENSION = "tension",
  COMBAT = "combat",
  BOSS = "boss",
  VICTORY = "victory",
  DEFEAT = "defeat",
  CUTSCENE = "cutscene"
}

interface MusicStateConfig {
  state: MusicState;
  trackId: string;
  baseIntensity: number;
  allowedTransitions: MusicState[];
  transitionPriority: number;  // Higher = more important
  minDuration: number;         // Minimum time in state (seconds)
}

interface StateTransition {
  from: MusicState;
  to: MusicState;
  transitionType: "crossfade" | "stinger" | "immediate" | "beat_sync";
  duration: number;
  stingerId?: string;
}

class MusicStateMachine {
  private currentState: MusicState = MusicState.SILENCE;
  private stateConfigs: Map<MusicState, MusicStateConfig> = new Map();
  private transitions: Map<string, StateTransition> = new Map();
  private stateStartTime: number = 0;
  private pendingState: MusicState | null = null;

  private onStateChange: ((from: MusicState, to: MusicState) => void) | null = null;

  registerState(config: MusicStateConfig): void {
    this.stateConfigs.set(config.state, config);
  }

  registerTransition(transition: StateTransition): void {
    const key = `${transition.from}->${transition.to}`;
    this.transitions.set(key, transition);
  }

  setStateChangeCallback(
    callback: (from: MusicState, to: MusicState) => void
  ): void {
    this.onStateChange = callback;
  }

  getCurrentState(): MusicState {
    return this.currentState;
  }

  requestStateChange(newState: MusicState): boolean {
    const currentConfig = this.stateConfigs.get(this.currentState);
    const newConfig = this.stateConfigs.get(newState);

    if (!currentConfig || !newConfig) {
      console.warn(`Unknown state: ${newState}`);
      return false;
    }

    // Check if transition is allowed
    if (!currentConfig.allowedTransitions.includes(newState)) {
      console.warn(`Transition from ${this.currentState} to ${newState} not allowed`);
      return false;
    }

    // Check minimum duration
    const timeInState = Date.now() / 1000 - this.stateStartTime;
    if (timeInState < currentConfig.minDuration) {
      // Queue state change
      this.pendingState = newState;
      const remainingTime = currentConfig.minDuration - timeInState;
      setTimeout(() => this.processPendingState(), remainingTime * 1000);
      return true;
    }

    // Check priority - can interrupt if new state has higher priority
    if (this.pendingState) {
      const pendingConfig = this.stateConfigs.get(this.pendingState);
      if (pendingConfig && pendingConfig.transitionPriority > newConfig.transitionPriority) {
        return false; // Don't override higher priority pending state
      }
    }

    return this.executeStateChange(newState);
  }

  private processPendingState(): void {
    if (this.pendingState) {
      const state = this.pendingState;
      this.pendingState = null;
      this.executeStateChange(state);
    }
  }

  private executeStateChange(newState: MusicState): boolean {
    const previousState = this.currentState;
    this.currentState = newState;
    this.stateStartTime = Date.now() / 1000;

    if (this.onStateChange) {
      this.onStateChange(previousState, newState);
    }

    return true;
  }

  getTransitionConfig(from: MusicState, to: MusicState): StateTransition | null {
    const key = `${from}->${to}`;
    return this.transitions.get(key) || null;
  }
}
```

### Game Event Triggers

```typescript
enum GameEvent {
  ENEMY_SPOTTED = "enemy_spotted",
  COMBAT_START = "combat_start",
  COMBAT_END = "combat_end",
  BOSS_APPEAR = "boss_appear",
  BOSS_DEFEATED = "boss_defeated",
  PLAYER_DEATH = "player_death",
  AREA_ENTER = "area_enter",
  CUTSCENE_START = "cutscene_start",
  CUTSCENE_END = "cutscene_end",
  DANGER_NEAR = "danger_near",
  SAFE_ZONE_ENTER = "safe_zone_enter"
}

interface EventTrigger {
  event: GameEvent;
  targetState: MusicState;
  priority: number;
  conditions?: (context: GameContext) => boolean;
  stingerId?: string;
}

interface GameContext {
  playerHealth: number;
  enemyCount: number;
  inCombat: boolean;
  currentArea: string;
  bossActive: boolean;
}

class MusicEventSystem {
  private stateMachine: MusicStateMachine;
  private triggers: EventTrigger[] = [];
  private stingerManager: StingerManager;
  private currentContext: GameContext;

  constructor(
    stateMachine: MusicStateMachine,
    stingerManager: StingerManager
  ) {
    this.stateMachine = stateMachine;
    this.stingerManager = stingerManager;
    this.currentContext = {
      playerHealth: 100,
      enemyCount: 0,
      inCombat: false,
      currentArea: "",
      bossActive: false
    };
  }

  registerTrigger(trigger: EventTrigger): void {
    this.triggers.push(trigger);
    // Sort by priority (highest first)
    this.triggers.sort((a, b) => b.priority - a.priority);
  }

  updateContext(context: Partial<GameContext>): void {
    this.currentContext = { ...this.currentContext, ...context };
  }

  fireEvent(event: GameEvent): void {
    // Find matching trigger with highest priority
    const trigger = this.triggers.find(t => {
      if (t.event !== event) return false;
      if (t.conditions && !t.conditions(this.currentContext)) return false;
      return true;
    });

    if (!trigger) {
      console.log(`No trigger found for event: ${event}`);
      return;
    }

    // Play stinger if configured
    if (trigger.stingerId) {
      this.stingerManager.playStinger(trigger.stingerId);
    }

    // Request state change
    this.stateMachine.requestStateChange(trigger.targetState);
  }

  // Convenience methods for common events
  onEnemySpotted(): void {
    this.fireEvent(GameEvent.ENEMY_SPOTTED);
  }

  onCombatStart(): void {
    this.updateContext({ inCombat: true });
    this.fireEvent(GameEvent.COMBAT_START);
  }

  onCombatEnd(): void {
    this.updateContext({ inCombat: false, enemyCount: 0 });
    this.fireEvent(GameEvent.COMBAT_END);
  }

  onBossAppear(): void {
    this.updateContext({ bossActive: true });
    this.fireEvent(GameEvent.BOSS_APPEAR);
  }

  onPlayerDeath(): void {
    this.fireEvent(GameEvent.PLAYER_DEATH);
  }
}
```

### Complete Integration Example

```typescript
// Setup the complete music system
class GameMusicSystem {
  private stateMachine: MusicStateMachine;
  private eventSystem: MusicEventSystem;
  private layerManager: VerticalLayerManager;
  private sequencer: MusicSequencer;
  private stingerManager: StingerManager;
  private intensityCalculator: CombatIntensityCalculator;

  private tracks: Map<MusicState, VerticalMusicTrack> = new Map();

  async initialize(): Promise<void> {
    // Initialize components
    this.stateMachine = new MusicStateMachine();
    this.layerManager = new VerticalLayerManager();
    this.stingerManager = new StingerManager(this.layerManager.audioContext);
    this.intensityCalculator = new CombatIntensityCalculator();
    this.eventSystem = new MusicEventSystem(
      this.stateMachine,
      this.stingerManager
    );

    // Register states
    this.registerStates();

    // Register transitions
    this.registerTransitions();

    // Register event triggers
    this.registerTriggers();

    // Setup state change handler
    this.stateMachine.setStateChangeCallback(
      (from, to) => this.handleStateChange(from, to)
    );

    // Load audio assets
    await this.loadAssets();
  }

  private registerStates(): void {
    this.stateMachine.registerState({
      state: MusicState.AMBIENT,
      trackId: "ambient_main",
      baseIntensity: 0.2,
      allowedTransitions: [
        MusicState.EXPLORATION,
        MusicState.TENSION,
        MusicState.CUTSCENE
      ],
      transitionPriority: 1,
      minDuration: 5
    });

    this.stateMachine.registerState({
      state: MusicState.EXPLORATION,
      trackId: "exploration_main",
      baseIntensity: 0.4,
      allowedTransitions: [
        MusicState.AMBIENT,
        MusicState.TENSION,
        MusicState.COMBAT,
        MusicState.CUTSCENE
      ],
      transitionPriority: 2,
      minDuration: 8
    });

    this.stateMachine.registerState({
      state: MusicState.COMBAT,
      trackId: "combat_main",
      baseIntensity: 0.7,
      allowedTransitions: [
        MusicState.BOSS,
        MusicState.VICTORY,
        MusicState.DEFEAT,
        MusicState.EXPLORATION
      ],
      transitionPriority: 5,
      minDuration: 4
    });

    this.stateMachine.registerState({
      state: MusicState.BOSS,
      trackId: "boss_main",
      baseIntensity: 1.0,
      allowedTransitions: [
        MusicState.VICTORY,
        MusicState.DEFEAT
      ],
      transitionPriority: 8,
      minDuration: 10
    });
  }

  private registerTransitions(): void {
    this.stateMachine.registerTransition({
      from: MusicState.EXPLORATION,
      to: MusicState.COMBAT,
      transitionType: "stinger",
      duration: 1.5,
      stingerId: "combat_stinger"
    });

    this.stateMachine.registerTransition({
      from: MusicState.COMBAT,
      to: MusicState.EXPLORATION,
      transitionType: "crossfade",
      duration: 3.0
    });

    this.stateMachine.registerTransition({
      from: MusicState.COMBAT,
      to: MusicState.BOSS,
      transitionType: "stinger",
      duration: 2.0,
      stingerId: "boss_stinger"
    });
  }

  private registerTriggers(): void {
    this.eventSystem.registerTrigger({
      event: GameEvent.COMBAT_START,
      targetState: MusicState.COMBAT,
      priority: 5,
      stingerId: "combat_stinger"
    });

    this.eventSystem.registerTrigger({
      event: GameEvent.BOSS_APPEAR,
      targetState: MusicState.BOSS,
      priority: 8,
      stingerId: "boss_stinger"
    });

    this.eventSystem.registerTrigger({
      event: GameEvent.COMBAT_END,
      targetState: MusicState.EXPLORATION,
      priority: 3,
      conditions: (ctx) => !ctx.bossActive
    });

    this.eventSystem.registerTrigger({
      event: GameEvent.PLAYER_DEATH,
      targetState: MusicState.DEFEAT,
      priority: 10,
      stingerId: "death_stinger"
    });
  }

  private async handleStateChange(
    from: MusicState,
    to: MusicState
  ): Promise<void> {
    const transitionConfig = this.stateMachine.getTransitionConfig(from, to);
    const newTrack = this.tracks.get(to);

    if (!newTrack) {
      console.warn(`No track configured for state: ${to}`);
      return;
    }

    // Execute transition based on type
    if (transitionConfig) {
      switch (transitionConfig.transitionType) {
        case "crossfade":
          await this.executeCrossfade(newTrack, transitionConfig.duration);
          break;
        case "stinger":
          if (transitionConfig.stingerId) {
            await this.stingerManager.playStinger(transitionConfig.stingerId);
          }
          await this.executeCrossfade(newTrack, 0.5);
          break;
        case "immediate":
          this.layerManager.stop();
          await this.layerManager.loadTrack(newTrack);
          this.layerManager.play();
          break;
        case "beat_sync":
          // Wait for next bar, then crossfade
          await this.executeBeatSyncTransition(newTrack, transitionConfig.duration);
          break;
      }
    }

    // Set base intensity for new state
    const stateConfig = this.stateConfigs.get(to);
    if (stateConfig) {
      this.layerManager.setIntensity(stateConfig.baseIntensity);
    }
  }

  // Update called every frame
  update(gameContext: GameContext): void {
    // Update event system context
    this.eventSystem.updateContext(gameContext);

    // Update music intensity based on combat context
    if (this.stateMachine.getCurrentState() === MusicState.COMBAT ||
        this.stateMachine.getCurrentState() === MusicState.BOSS) {
      const intensity = this.intensityCalculator.calculate({
        enemyCount: gameContext.enemyCount,
        playerHealthPercent: gameContext.playerHealth / 100,
        nearbyEnemyDistance: 10, // Would come from actual game data
        bossPresent: gameContext.bossActive,
        inCombat: gameContext.inCombat
      });

      this.layerManager.setIntensity(intensity);
    }
  }
}
```

---

## Beat Synchronization

Precise beat synchronization ensures musical changes feel natural and intentional rather than jarring.

### Beat Clock Implementation

```typescript
class BeatClock {
  private audioContext: AudioContext;
  private bpm: number;
  private beatsPerBar: number;
  private startTime: number;
  private isRunning: boolean = false;

  private beatCallbacks: ((beat: number, bar: number) => void)[] = [];
  private barCallbacks: ((bar: number) => void)[] = [];

  constructor(audioContext: AudioContext, bpm: number, beatsPerBar: number = 4) {
    this.audioContext = audioContext;
    this.bpm = bpm;
    this.beatsPerBar = beatsPerBar;
    this.startTime = 0;
  }

  start(): void {
    this.startTime = this.audioContext.currentTime;
    this.isRunning = true;
    this.scheduleNextBeat();
  }

  stop(): void {
    this.isRunning = false;
  }

  setBpm(bpm: number): void {
    // Adjust start time to maintain current position
    const currentPosition = this.getCurrentPosition();
    this.bpm = bpm;
    this.startTime = this.audioContext.currentTime -
      (currentPosition.totalBeats * this.getBeatDuration());
  }

  getBeatDuration(): number {
    return 60 / this.bpm;
  }

  getBarDuration(): number {
    return this.getBeatDuration() * this.beatsPerBar;
  }

  getCurrentPosition(): { bar: number; beat: number; totalBeats: number } {
    const elapsed = this.audioContext.currentTime - this.startTime;
    const totalBeats = elapsed / this.getBeatDuration();
    const bar = Math.floor(totalBeats / this.beatsPerBar);
    const beat = Math.floor(totalBeats % this.beatsPerBar);

    return { bar, beat, totalBeats };
  }

  getTimeToNextBeat(): number {
    const elapsed = this.audioContext.currentTime - this.startTime;
    const beatDuration = this.getBeatDuration();
    const beatPosition = elapsed % beatDuration;
    return beatDuration - beatPosition;
  }

  getTimeToNextBar(): number {
    const elapsed = this.audioContext.currentTime - this.startTime;
    const barDuration = this.getBarDuration();
    const barPosition = elapsed % barDuration;
    return barDuration - barPosition;
  }

  getTimeToNextBeatMultiple(multiple: number): number {
    const elapsed = this.audioContext.currentTime - this.startTime;
    const multipleDuration = this.getBeatDuration() * multiple;
    const position = elapsed % multipleDuration;
    return multipleDuration - position;
  }

  onBeat(callback: (beat: number, bar: number) => void): void {
    this.beatCallbacks.push(callback);
  }

  onBar(callback: (bar: number) => void): void {
    this.barCallbacks.push(callback);
  }

  private scheduleNextBeat(): void {
    if (!this.isRunning) return;

    const timeToNext = this.getTimeToNextBeat();

    setTimeout(() => {
      if (!this.isRunning) return;

      const position = this.getCurrentPosition();

      // Fire beat callbacks
      this.beatCallbacks.forEach(cb => cb(position.beat, position.bar));

      // Fire bar callbacks on beat 0
      if (position.beat === 0) {
        this.barCallbacks.forEach(cb => cb(position.bar));
      }

      // Schedule next beat
      this.scheduleNextBeat();
    }, timeToNext * 1000);
  }

  // Schedule an action on a specific beat
  scheduleOnBeat(
    targetBeat: number,
    callback: () => void,
    lookahead: number = 0.1
  ): void {
    const position = this.getCurrentPosition();
    const currentBeat = position.beat;

    let beatsToWait = targetBeat - currentBeat;
    if (beatsToWait <= 0) {
      beatsToWait += this.beatsPerBar;
    }

    const delay = (beatsToWait * this.getBeatDuration()) - lookahead;

    setTimeout(callback, Math.max(0, delay * 1000));
  }

  // Schedule an action on a specific bar
  scheduleOnBar(targetBar: number, callback: () => void): void {
    const position = this.getCurrentPosition();
    const barsToWait = targetBar - position.bar;

    if (barsToWait <= 0) {
      console.warn("Target bar has already passed");
      return;
    }

    const delay = barsToWait * this.getBarDuration();
    setTimeout(callback, delay * 1000);
  }
}
```

### Quantized Event Scheduling

```typescript
enum Quantization {
  NONE = 0,
  BEAT = 1,
  HALF_BAR = 2,
  BAR = 4,
  TWO_BARS = 8,
  FOUR_BARS = 16
}

class QuantizedEventScheduler {
  private beatClock: BeatClock;
  private pendingEvents: Map<string, {
    callback: () => void;
    quantization: Quantization;
    scheduled: boolean;
  }> = new Map();

  constructor(beatClock: BeatClock) {
    this.beatClock = beatClock;

    // Listen for beat events
    this.beatClock.onBeat((beat, bar) => {
      this.processPendingEvents(beat, bar);
    });
  }

  scheduleEvent(
    id: string,
    callback: () => void,
    quantization: Quantization
  ): void {
    // Cancel any existing event with same id
    this.cancelEvent(id);

    if (quantization === Quantization.NONE) {
      callback();
      return;
    }

    this.pendingEvents.set(id, {
      callback,
      quantization,
      scheduled: false
    });
  }

  cancelEvent(id: string): void {
    this.pendingEvents.delete(id);
  }

  private processPendingEvents(beat: number, bar: number): void {
    const totalBeats = (bar * 4) + beat; // Assuming 4/4 time

    this.pendingEvents.forEach((event, id) => {
      if (event.scheduled) return;

      const shouldFire = totalBeats % event.quantization === 0;

      if (shouldFire) {
        event.callback();
        this.pendingEvents.delete(id);
      }
    });
  }

  // Get time until next quantization point
  getTimeToNextQuantization(quantization: Quantization): number {
    if (quantization === Quantization.NONE) return 0;

    return this.beatClock.getTimeToNextBeatMultiple(quantization);
  }
}
```

---

## Context-Aware Music

Context-aware music systems analyze multiple game parameters to make intelligent musical decisions.

### Context Analysis System

```typescript
interface MusicContext {
  // Location
  areaType: "dungeon" | "overworld" | "town" | "boss_arena" | "cutscene";
  areaName: string;
  indoors: boolean;

  // Combat
  inCombat: boolean;
  enemyCount: number;
  enemyTypes: string[];
  threatLevel: number;  // 0-1

  // Player state
  playerHealth: number;
  playerStamina: number;
  playerBuffs: string[];
  playerDebuffs: string[];

  // Time
  timeOfDay: "dawn" | "day" | "dusk" | "night";
  weather: "clear" | "rain" | "storm" | "snow";

  // Story
  questActive: string | null;
  storyProgress: number;
  recentEvents: string[];

  // Gameplay
  stealthMode: boolean;
  explorationScore: number;  // How much player is exploring
  idleTime: number;          // Seconds since last input
}

class ContextAnalyzer {
  private context: MusicContext;
  private contextHistory: MusicContext[] = [];
  private readonly historyLength = 10;

  constructor() {
    this.context = this.getDefaultContext();
  }

  private getDefaultContext(): MusicContext {
    return {
      areaType: "overworld",
      areaName: "",
      indoors: false,
      inCombat: false,
      enemyCount: 0,
      enemyTypes: [],
      threatLevel: 0,
      playerHealth: 100,
      playerStamina: 100,
      playerBuffs: [],
      playerDebuffs: [],
      timeOfDay: "day",
      weather: "clear",
      questActive: null,
      storyProgress: 0,
      recentEvents: [],
      stealthMode: false,
      explorationScore: 0,
      idleTime: 0
    };
  }

  updateContext(partial: Partial<MusicContext>): void {
    // Save to history
    this.contextHistory.push({ ...this.context });
    if (this.contextHistory.length > this.historyLength) {
      this.contextHistory.shift();
    }

    // Update current context
    this.context = { ...this.context, ...partial };
  }

  getContext(): MusicContext {
    return { ...this.context };
  }

  // Calculate overall mood from context
  calculateMood(): {
    tension: number;
    energy: number;
    mystery: number;
    triumph: number;
    sorrow: number;
  } {
    let tension = 0;
    let energy = 0;
    let mystery = 0;
    let triumph = 0;
    let sorrow = 0;

    // Combat affects tension and energy
    if (this.context.inCombat) {
      tension += 0.4 + (this.context.threatLevel * 0.4);
      energy += 0.5 + (this.context.enemyCount * 0.1);
    }

    // Low health increases tension
    if (this.context.playerHealth < 30) {
      tension += 0.3;
      sorrow += 0.1;
    }

    // Area type affects base mood
    switch (this.context.areaType) {
      case "dungeon":
        mystery += 0.4;
        tension += 0.2;
        break;
      case "boss_arena":
        tension += 0.5;
        energy += 0.4;
        break;
      case "town":
        energy -= 0.2;
        triumph += 0.1;
        break;
      case "overworld":
        mystery += 0.2;
        break;
    }

    // Time of day affects mood
    switch (this.context.timeOfDay) {
      case "night":
        mystery += 0.2;
        tension += 0.1;
        break;
      case "dawn":
        triumph += 0.1;
        break;
      case "dusk":
        sorrow += 0.1;
        mystery += 0.1;
        break;
    }

    // Weather affects mood
    switch (this.context.weather) {
      case "storm":
        tension += 0.2;
        energy += 0.2;
        break;
      case "rain":
        sorrow += 0.15;
        mystery += 0.1;
        break;
    }

    // Stealth mode
    if (this.context.stealthMode) {
      tension += 0.3;
      energy -= 0.2;
      mystery += 0.2;
    }

    // Idle time reduces energy
    if (this.context.idleTime > 30) {
      energy -= 0.3;
    }

    // Normalize values
    return {
      tension: Math.max(0, Math.min(1, tension)),
      energy: Math.max(0, Math.min(1, energy)),
      mystery: Math.max(0, Math.min(1, mystery)),
      triumph: Math.max(0, Math.min(1, triumph)),
      sorrow: Math.max(0, Math.min(1, sorrow))
    };
  }

  // Detect significant context changes
  detectSignificantChange(): string[] {
    if (this.contextHistory.length === 0) return [];

    const previous = this.contextHistory[this.contextHistory.length - 1];
    const changes: string[] = [];

    // Combat state change
    if (previous.inCombat !== this.context.inCombat) {
      changes.push(this.context.inCombat ? "combat_start" : "combat_end");
    }

    // Area change
    if (previous.areaName !== this.context.areaName) {
      changes.push("area_change");
    }

    // Threat level spike
    if (this.context.threatLevel - previous.threatLevel > 0.3) {
      changes.push("threat_spike");
    }

    // Near death
    if (this.context.playerHealth < 20 && previous.playerHealth >= 20) {
      changes.push("near_death");
    }

    // Time of day change
    if (previous.timeOfDay !== this.context.timeOfDay) {
      changes.push("time_change");
    }

    return changes;
  }
}
```

### Intelligent Music Selection

```typescript
interface MusicTrackMetadata {
  trackId: string;
  moods: {
    tension: number;
    energy: number;
    mystery: number;
    triumph: number;
    sorrow: number;
  };
  suitableAreas: string[];
  suitableTimeOfDay: string[];
  suitableWeather: string[];
  combatSuitable: boolean;
  stealthSuitable: boolean;
  minIntensity: number;
  maxIntensity: number;
}

class IntelligentMusicSelector {
  private tracks: MusicTrackMetadata[] = [];
  private contextAnalyzer: ContextAnalyzer;
  private recentlyPlayed: string[] = [];
  private readonly maxRecentTracks = 5;

  constructor(contextAnalyzer: ContextAnalyzer) {
    this.contextAnalyzer = contextAnalyzer;
  }

  registerTrack(metadata: MusicTrackMetadata): void {
    this.tracks.push(metadata);
  }

  selectBestTrack(): MusicTrackMetadata | null {
    const context = this.contextAnalyzer.getContext();
    const mood = this.contextAnalyzer.calculateMood();

    // Score each track
    const scoredTracks = this.tracks
      .filter(track => this.isTrackSuitable(track, context))
      .map(track => ({
        track,
        score: this.calculateTrackScore(track, context, mood)
      }))
      .sort((a, b) => b.score - a.score);

    if (scoredTracks.length === 0) {
      console.warn("No suitable tracks found for current context");
      return null;
    }

    // Select from top tracks with some randomization
    const topTracks = scoredTracks.slice(0, 3);
    const selected = this.weightedRandomSelect(topTracks);

    // Update recently played
    this.recentlyPlayed.push(selected.trackId);
    if (this.recentlyPlayed.length > this.maxRecentTracks) {
      this.recentlyPlayed.shift();
    }

    return selected;
  }

  private isTrackSuitable(
    track: MusicTrackMetadata,
    context: MusicContext
  ): boolean {
    // Check combat suitability
    if (context.inCombat && !track.combatSuitable) return false;

    // Check stealth suitability
    if (context.stealthMode && !track.stealthSuitable) return false;

    // Check area suitability
    if (track.suitableAreas.length > 0 &&
        !track.suitableAreas.includes(context.areaType)) {
      return false;
    }

    // Avoid recently played tracks
    if (this.recentlyPlayed.includes(track.trackId)) return false;

    return true;
  }

  private calculateTrackScore(
    track: MusicTrackMetadata,
    context: MusicContext,
    mood: ReturnType<ContextAnalyzer["calculateMood"]>
  ): number {
    let score = 0;

    // Mood matching (weighted)
    score += (1 - Math.abs(track.moods.tension - mood.tension)) * 25;
    score += (1 - Math.abs(track.moods.energy - mood.energy)) * 25;
    score += (1 - Math.abs(track.moods.mystery - mood.mystery)) * 15;
    score += (1 - Math.abs(track.moods.triumph - mood.triumph)) * 15;
    score += (1 - Math.abs(track.moods.sorrow - mood.sorrow)) * 10;

    // Time of day bonus
    if (track.suitableTimeOfDay.includes(context.timeOfDay)) {
      score += 10;
    }

    // Weather bonus
    if (track.suitableWeather.includes(context.weather)) {
      score += 5;
    }

    // Intensity range matching
    const currentIntensity = mood.tension * 0.5 + mood.energy * 0.5;
    if (currentIntensity >= track.minIntensity &&
        currentIntensity <= track.maxIntensity) {
      score += 15;
    }

    return score;
  }

  private weightedRandomSelect(
    scoredTracks: { track: MusicTrackMetadata; score: number }[]
  ): MusicTrackMetadata {
    const totalScore = scoredTracks.reduce((sum, t) => sum + t.score, 0);
    let random = Math.random() * totalScore;

    for (const { track, score } of scoredTracks) {
      random -= score;
      if (random <= 0) return track;
    }

    return scoredTracks[0].track;
  }
}
```

---

## Implementation with Wwise

Wwise is an industry-standard audio middleware that provides powerful tools for dynamic music systems.

### Wwise Music Structure

```
Wwise Project Structure for Dynamic Music:

Interactive Music Hierarchy
├── Music Switch Container: "GameMusic"
│   ├── Music Playlist Container: "Exploration"
│   │   ├── Music Segment: "Exploration_Intro"
│   │   ├── Music Segment: "Exploration_LoopA"
│   │   ├── Music Segment: "Exploration_LoopB"
│   │   └── Music Segment: "Exploration_Outro"
│   │
│   ├── Music Playlist Container: "Combat"
│   │   ├── Music Segment: "Combat_Intro"
│   │   ├── Music Segment: "Combat_Loop"
│   │   │   └── Music Tracks (Vertical Layers)
│   │   │       ├── Track: "Combat_Bass"
│   │   │       ├── Track: "Combat_Drums"
│   │   │       ├── Track: "Combat_Strings"
│   │   │       └── Track: "Combat_Brass"
│   │   └── Music Segment: "Combat_Outro"
│   │
│   └── Music Playlist Container: "Boss"
│       ├── Music Segment: "Boss_Intro"
│       ├── Music Segment: "Boss_Phase1"
│       ├── Music Segment: "Boss_Phase2"
│       └── Music Segment: "Boss_Victory"

Switches/States:
├── Switch Group: "MusicState"
│   ├── Switch: "Exploration"
│   ├── Switch: "Combat"
│   └── Switch: "Boss"
│
└── State Group: "CombatIntensity"
    ├── State: "Low"
    ├── State: "Medium"
    └── State: "High"

Game Parameters (RTPCs):
├── "MusicIntensity" (0-100)
├── "PlayerHealth" (0-100)
└── "ThreatLevel" (0-100)
```

### Wwise Integration Code (Unity C#)

```csharp
using UnityEngine;
using System.Collections;

public class WwiseMusicManager : MonoBehaviour
{
    // Wwise Event references
    [Header("Music Events")]
    public AK.Wwise.Event playMusicEvent;
    public AK.Wwise.Event stopMusicEvent;

    // Switch groups
    [Header("Switches")]
    public AK.Wwise.Switch explorationSwitch;
    public AK.Wwise.Switch combatSwitch;
    public AK.Wwise.Switch bossSwitch;

    // State groups
    [Header("States")]
    public AK.Wwise.State lowIntensityState;
    public AK.Wwise.State mediumIntensityState;
    public AK.Wwise.State highIntensityState;

    // RTPCs
    [Header("Game Parameters")]
    public AK.Wwise.RTPC musicIntensityRTPC;
    public AK.Wwise.RTPC playerHealthRTPC;
    public AK.Wwise.RTPC threatLevelRTPC;

    // Stingers
    [Header("Stingers")]
    public AK.Wwise.Event combatStinger;
    public AK.Wwise.Event bossStinger;
    public AK.Wwise.Event victoryStinger;
    public AK.Wwise.Event deathStinger;

    private MusicState currentState = MusicState.None;
    private float currentIntensity = 0f;
    private GameObject musicGameObject;

    public enum MusicState
    {
        None,
        Exploration,
        Combat,
        Boss
    }

    void Awake()
    {
        musicGameObject = gameObject;
    }

    public void StartMusic()
    {
        playMusicEvent.Post(musicGameObject);
        SetMusicState(MusicState.Exploration);
    }

    public void StopMusic()
    {
        stopMusicEvent.Post(musicGameObject);
        currentState = MusicState.None;
    }

    public void SetMusicState(MusicState newState)
    {
        if (newState == currentState) return;

        // Play transition stinger if needed
        PlayTransitionStinger(currentState, newState);

        // Set the appropriate switch
        switch (newState)
        {
            case MusicState.Exploration:
                explorationSwitch.SetValue(musicGameObject);
                break;
            case MusicState.Combat:
                combatSwitch.SetValue(musicGameObject);
                break;
            case MusicState.Boss:
                bossSwitch.SetValue(musicGameObject);
                break;
        }

        currentState = newState;
    }

    private void PlayTransitionStinger(MusicState from, MusicState to)
    {
        if (from == MusicState.Exploration && to == MusicState.Combat)
        {
            combatStinger.Post(musicGameObject);
        }
        else if (to == MusicState.Boss)
        {
            bossStinger.Post(musicGameObject);
        }
    }

    public void SetIntensity(float intensity)
    {
        intensity = Mathf.Clamp01(intensity);
        currentIntensity = intensity;

        // Set RTPC value (Wwise uses 0-100 range)
        musicIntensityRTPC.SetGlobalValue(intensity * 100f);

        // Set state based on intensity thresholds
        if (intensity < 0.33f)
        {
            lowIntensityState.SetValue();
        }
        else if (intensity < 0.66f)
        {
            mediumIntensityState.SetValue();
        }
        else
        {
            highIntensityState.SetValue();
        }
    }

    public void UpdatePlayerHealth(float healthPercent)
    {
        playerHealthRTPC.SetGlobalValue(healthPercent * 100f);
    }

    public void UpdateThreatLevel(float threatLevel)
    {
        threatLevelRTPC.SetGlobalValue(threatLevel * 100f);
    }

    public void TriggerVictory()
    {
        victoryStinger.Post(musicGameObject);
        StartCoroutine(DelayedStateChange(MusicState.Exploration, 2f));
    }

    public void TriggerDeath()
    {
        deathStinger.Post(musicGameObject);
    }

    private IEnumerator DelayedStateChange(MusicState state, float delay)
    {
        yield return new WaitForSeconds(delay);
        SetMusicState(state);
    }
}

// Game integration example
public class GameMusicController : MonoBehaviour
{
    public WwiseMusicManager musicManager;
    private CombatManager combatManager;
    private PlayerController player;

    void Start()
    {
        musicManager.StartMusic();

        // Subscribe to game events
        combatManager = FindObjectOfType<CombatManager>();
        combatManager.OnCombatStart += HandleCombatStart;
        combatManager.OnCombatEnd += HandleCombatEnd;
        combatManager.OnBossEncounter += HandleBossEncounter;

        player = FindObjectOfType<PlayerController>();
        player.OnDeath += HandlePlayerDeath;
    }

    void Update()
    {
        // Update music parameters
        if (combatManager.IsInCombat)
        {
            float intensity = CalculateCombatIntensity();
            musicManager.SetIntensity(intensity);
        }

        musicManager.UpdatePlayerHealth(player.HealthPercent);
        musicManager.UpdateThreatLevel(combatManager.ThreatLevel);
    }

    float CalculateCombatIntensity()
    {
        float enemyFactor = Mathf.Clamp01(combatManager.EnemyCount / 5f);
        float healthFactor = 1f - player.HealthPercent;
        float threatFactor = combatManager.ThreatLevel;

        return (enemyFactor * 0.4f) + (healthFactor * 0.3f) + (threatFactor * 0.3f);
    }

    void HandleCombatStart()
    {
        musicManager.SetMusicState(WwiseMusicManager.MusicState.Combat);
    }

    void HandleCombatEnd()
    {
        musicManager.SetMusicState(WwiseMusicManager.MusicState.Exploration);
    }

    void HandleBossEncounter()
    {
        musicManager.SetMusicState(WwiseMusicManager.MusicState.Boss);
    }

    void HandlePlayerDeath()
    {
        musicManager.TriggerDeath();
    }
}
```

---

## Implementation with FMOD

FMOD Studio is another popular audio middleware with excellent music tools.

### FMOD Event Structure

```
FMOD Studio Project Structure:

Events/Music/
├── Exploration/
│   └── Event: "Music_Exploration"
│       ├── Parameter: "Intensity" (0-1)
│       ├── Track: "Ambient Pad" (always active)
│       ├── Track: "Light Percussion" (intensity > 0.2)
│       ├── Track: "Melody" (intensity > 0.4)
│       └── Multi Instrument: "Exploration Variations"
│           ├── Region: "Variation A"
│           ├── Region: "Variation B"
│           └── Region: "Variation C"
│
├── Combat/
│   └── Event: "Music_Combat"
│       ├── Parameter: "Intensity" (0-1)
│       ├── Parameter: "BossPhase" (0-3)
│       ├── Track: "Drums"
│       ├── Track: "Bass"
│       ├── Track: "Strings"
│       ├── Track: "Brass"
│       ├── Track: "Choir" (intensity > 0.8)
│       └── Transition Region
│           ├── Marker: "ToPhase2"
│           └── Marker: "ToVictory"
│
└── Stingers/
    ├── Event: "Stinger_CombatStart"
    ├── Event: "Stinger_Boss"
    ├── Event: "Stinger_Victory"
    └── Event: "Stinger_Death"
```

### FMOD Integration Code (Unity C#)

```csharp
using UnityEngine;
using FMODUnity;
using FMOD.Studio;

public class FMODMusicManager : MonoBehaviour
{
    // Event references
    [Header("Music Events")]
    [EventRef] public string explorationEvent;
    [EventRef] public string combatEvent;

    [Header("Stinger Events")]
    [EventRef] public string combatStingerEvent;
    [EventRef] public string bossStingerEvent;
    [EventRef] public string victoryStingerEvent;
    [EventRef] public string deathStingerEvent;

    // Current instances
    private EventInstance currentMusicInstance;
    private MusicState currentState = MusicState.None;

    // Parameter references
    private PARAMETER_ID intensityParamId;
    private PARAMETER_ID bossPhaseParamId;

    public enum MusicState
    {
        None,
        Exploration,
        Combat
    }

    void Start()
    {
        // Cache parameter IDs for performance
        CacheParameterIds();
    }

    void CacheParameterIds()
    {
        EventDescription explorationDesc = RuntimeManager.GetEventDescription(explorationEvent);
        explorationDesc.getParameterDescriptionByName("Intensity", out PARAMETER_DESCRIPTION intensityDesc);
        intensityParamId = intensityDesc.id;

        EventDescription combatDesc = RuntimeManager.GetEventDescription(combatEvent);
        combatDesc.getParameterDescriptionByName("BossPhase", out PARAMETER_DESCRIPTION bossPhaseDesc);
        bossPhaseParamId = bossPhaseDesc.id;
    }

    public void StartMusic()
    {
        SetMusicState(MusicState.Exploration);
    }

    public void StopMusic()
    {
        if (currentMusicInstance.isValid())
        {
            currentMusicInstance.stop(FMOD.Studio.STOP_MODE.ALLOWFADEOUT);
            currentMusicInstance.release();
        }
        currentState = MusicState.None;
    }

    public void SetMusicState(MusicState newState)
    {
        if (newState == currentState) return;

        // Fade out current music
        if (currentMusicInstance.isValid())
        {
            currentMusicInstance.stop(FMOD.Studio.STOP_MODE.ALLOWFADEOUT);
            currentMusicInstance.release();
        }

        // Play transition stinger
        PlayTransitionStinger(currentState, newState);

        // Start new music
        string eventPath = newState == MusicState.Exploration ?
            explorationEvent : combatEvent;

        currentMusicInstance = RuntimeManager.CreateInstance(eventPath);
        currentMusicInstance.start();

        currentState = newState;
    }

    private void PlayTransitionStinger(MusicState from, MusicState to)
    {
        if (from == MusicState.Exploration && to == MusicState.Combat)
        {
            RuntimeManager.PlayOneShot(combatStingerEvent);
        }
    }

    public void SetIntensity(float intensity)
    {
        if (!currentMusicInstance.isValid()) return;

        intensity = Mathf.Clamp01(intensity);
        currentMusicInstance.setParameterByID(intensityParamId, intensity);
    }

    public void SetBossPhase(int phase)
    {
        if (!currentMusicInstance.isValid()) return;

        currentMusicInstance.setParameterByID(bossPhaseParamId, phase);
    }

    public void TriggerBossEntrance()
    {
        RuntimeManager.PlayOneShot(bossStingerEvent);
    }

    public void TriggerVictory()
    {
        RuntimeManager.PlayOneShot(victoryStingerEvent);

        // Trigger transition marker in music
        if (currentMusicInstance.isValid())
        {
            currentMusicInstance.triggerCue();
        }
    }

    public void TriggerDeath()
    {
        RuntimeManager.PlayOneShot(deathStingerEvent);

        // Fade out music
        if (currentMusicInstance.isValid())
        {
            currentMusicInstance.stop(FMOD.Studio.STOP_MODE.ALLOWFADEOUT);
        }
    }

    void OnDestroy()
    {
        StopMusic();
    }
}

// Advanced FMOD features: Timeline markers and callbacks
public class FMODMusicTimeline : MonoBehaviour
{
    private EventInstance musicInstance;
    private EVENT_CALLBACK beatCallback;

    // Timeline info
    private int currentBar = 0;
    private int currentBeat = 0;
    private float currentTempo = 0;

    void Start()
    {
        beatCallback = new EVENT_CALLBACK(BeatEventCallback);
    }

    public void StartMusicWithCallbacks(string eventPath)
    {
        musicInstance = RuntimeManager.CreateInstance(eventPath);

        // Set up callback for timeline markers
        musicInstance.setCallback(beatCallback,
            EVENT_CALLBACK_TYPE.TIMELINE_MARKER |
            EVENT_CALLBACK_TYPE.TIMELINE_BEAT);

        musicInstance.start();
    }

    [AOT.MonoPInvokeCallback(typeof(EVENT_CALLBACK))]
    static FMOD.RESULT BeatEventCallback(
        EVENT_CALLBACK_TYPE type,
        System.IntPtr instancePtr,
        System.IntPtr parameterPtr)
    {
        // Handle on main thread to avoid issues
        if (type == EVENT_CALLBACK_TYPE.TIMELINE_BEAT)
        {
            var parameter = (TIMELINE_BEAT_PROPERTIES)
                System.Runtime.InteropServices.Marshal.PtrToStructure(
                    parameterPtr, typeof(TIMELINE_BEAT_PROPERTIES));

            Debug.Log($"Beat: Bar {parameter.bar}, Beat {parameter.beat}, " +
                     $"Tempo: {parameter.tempo}");
        }
        else if (type == EVENT_CALLBACK_TYPE.TIMELINE_MARKER)
        {
            var parameter = (TIMELINE_MARKER_PROPERTIES)
                System.Runtime.InteropServices.Marshal.PtrToStructure(
                    parameterPtr, typeof(TIMELINE_MARKER_PROPERTIES));

            Debug.Log($"Marker: {parameter.name}");
        }

        return FMOD.RESULT.OK;
    }
}
```

---

## Best Practices and Optimization

### Audio Asset Guidelines

```typescript
// Asset specification guidelines
interface AudioAssetSpec {
  // Format recommendations
  format: {
    compressed: "ogg" | "mp3";      // For streaming
    uncompressed: "wav";            // For stingers/short cues
    sampleRate: 44100 | 48000;
    bitDepth: 16 | 24;
    channels: 2;                    // Stereo for music
  };

  // Loop point requirements
  looping: {
    seamlessLoop: boolean;          // No click at loop point
    loopPointAtZeroCrossing: boolean;
    fadeInMs: number;               // If not seamless
    fadeOutMs: number;
  };

  // Stem specifications
  stems: {
    syncedToSameBPM: boolean;
    sameLength: boolean;
    headroomDb: -6;                 // Leave headroom for mixing
    peakNormalized: boolean;
  };
}

// Example asset checklist
const assetChecklist = {
  allStemsExactlySameLength: true,
  allStemsSameTempo: true,
  loopPointsVerified: true,
  noClippingWhenLayered: true,
  transitionPointsMusicallyValid: true,
  metadataIncludesBPM: true,
  namingConventionFollowed: true
};
```

### Memory Management

```typescript
class MusicMemoryManager {
  private audioContext: AudioContext;
  private loadedBuffers: Map<string, {
    buffer: AudioBuffer;
    lastAccessed: number;
    priority: "high" | "medium" | "low";
    size: number;
  }> = new Map();

  private readonly maxMemoryMB = 100;
  private currentMemoryMB = 0;

  async loadWithPriority(
    id: string,
    url: string,
    priority: "high" | "medium" | "low"
  ): Promise<AudioBuffer> {
    // Check if already loaded
    if (this.loadedBuffers.has(id)) {
      const entry = this.loadedBuffers.get(id)!;
      entry.lastAccessed = Date.now();
      return entry.buffer;
    }

    // Load the buffer
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    const sizeMB = this.calculateBufferSize(audioBuffer);

    // Check if we need to free memory
    while (this.currentMemoryMB + sizeMB > this.maxMemoryMB) {
      this.evictLowestPriority();
    }

    // Store buffer
    this.loadedBuffers.set(id, {
      buffer: audioBuffer,
      lastAccessed: Date.now(),
      priority,
      size: sizeMB
    });

    this.currentMemoryMB += sizeMB;

    return audioBuffer;
  }

  private calculateBufferSize(buffer: AudioBuffer): number {
    // Size in MB: channels * samples * bytes per sample / (1024 * 1024)
    return (buffer.numberOfChannels * buffer.length * 4) / (1024 * 1024);
  }

  private evictLowestPriority(): void {
    // Find lowest priority, oldest entry
    let evictId: string | null = null;
    let lowestScore = Infinity;

    const priorityValues = { low: 0, medium: 1, high: 2 };
    const now = Date.now();

    this.loadedBuffers.forEach((entry, id) => {
      const age = (now - entry.lastAccessed) / 1000; // seconds
      const score = priorityValues[entry.priority] * 1000 - age;

      if (score < lowestScore) {
        lowestScore = score;
        evictId = id;
      }
    });

    if (evictId) {
      const entry = this.loadedBuffers.get(evictId)!;
      this.currentMemoryMB -= entry.size;
      this.loadedBuffers.delete(evictId);
      console.log(`Evicted audio buffer: ${evictId}`);
    }
  }

  preloadForArea(areaId: string, trackIds: string[]): Promise<void[]> {
    // Preload tracks needed for upcoming area
    return Promise.all(
      trackIds.map(id => this.loadWithPriority(id, `/audio/${id}.ogg`, "high"))
    );
  }

  getMemoryUsage(): { used: number; max: number; percent: number } {
    return {
      used: this.currentMemoryMB,
      max: this.maxMemoryMB,
      percent: (this.currentMemoryMB / this.maxMemoryMB) * 100
    };
  }
}
```

### Performance Optimization

```typescript
class OptimizedMusicSystem {
  private updateInterval: number = 50; // ms
  private lastUpdate: number = 0;
  private pendingIntensity: number | null = null;

  // Throttled intensity updates
  setIntensity(value: number): void {
    this.pendingIntensity = value;

    const now = performance.now();
    if (now - this.lastUpdate >= this.updateInterval) {
      this.applyPendingIntensity();
    }
  }

  private applyPendingIntensity(): void {
    if (this.pendingIntensity === null) return;

    // Apply the intensity update
    this.layerManager.setIntensity(this.pendingIntensity);

    this.pendingIntensity = null;
    this.lastUpdate = performance.now();
  }

  // Efficient fade implementation using Web Audio
  private createOptimizedFade(
    gainNode: GainNode,
    targetValue: number,
    duration: number
  ): void {
    const currentTime = this.audioContext.currentTime;

    // Cancel any scheduled changes
    gainNode.gain.cancelScheduledValues(currentTime);

    // Use exponential ramp for more natural sounding fades
    // Note: exponentialRampToValueAtTime can't target 0
    const safeTarget = Math.max(0.0001, targetValue);

    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      safeTarget,
      currentTime + duration
    );

    // If targeting 0, set to 0 after the ramp completes
    if (targetValue === 0) {
      gainNode.gain.setValueAtTime(0, currentTime + duration);
    }
  }

  // Object pooling for audio nodes
  private nodePool: {
    sources: AudioBufferSourceNode[];
    gains: GainNode[];
  } = { sources: [], gains: [] };

  private getSourceNode(): AudioBufferSourceNode {
    if (this.nodePool.sources.length > 0) {
      return this.nodePool.sources.pop()!;
    }
    return this.audioContext.createBufferSource();
  }

  private getGainNode(): GainNode {
    if (this.nodePool.gains.length > 0) {
      const node = this.nodePool.gains.pop()!;
      node.gain.value = 1; // Reset
      return node;
    }
    return this.audioContext.createGain();
  }

  private returnSourceNode(node: AudioBufferSourceNode): void {
    // Sources can't be reused after stop(), so don't pool them
    // This is just for illustration - in practice, always create new sources
  }

  private returnGainNode(node: GainNode): void {
    if (this.nodePool.gains.length < 20) {
      node.disconnect();
      this.nodePool.gains.push(node);
    }
  }
}
```

### Common Pitfalls and Solutions

```typescript
// Pitfall 1: Click/pop on transitions
// Solution: Always use crossfades, even short ones
function safeFadeOut(gainNode: GainNode, duration: number = 0.05): void {
  const currentTime = audioContext.currentTime;
  gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
  gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);
}

// Pitfall 2: Stems drifting out of sync
// Solution: Start all stems at exactly the same time
function startSynchronizedStems(
  stems: AudioBufferSourceNode[],
  startTime?: number
): void {
  const syncedStartTime = startTime ?? audioContext.currentTime + 0.1;
  stems.forEach(stem => stem.start(syncedStartTime));
}

// Pitfall 3: Memory leaks from event listeners
class CleanupAwareMusicSystem {
  private cleanupCallbacks: (() => void)[] = [];

  addEventListenerWithCleanup(
    target: EventTarget,
    event: string,
    handler: EventListener
  ): void {
    target.addEventListener(event, handler);
    this.cleanupCallbacks.push(() =>
      target.removeEventListener(event, handler)
    );
  }

  destroy(): void {
    this.cleanupCallbacks.forEach(cleanup => cleanup());
    this.cleanupCallbacks = [];
  }
}

// Pitfall 4: Blocking the main thread during load
// Solution: Use streaming for large files
async function streamLargeAudioFile(url: string): Promise<void> {
  const response = await fetch(url);
  const reader = response.body?.getReader();

  if (!reader) throw new Error("Streaming not supported");

  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);

    // Yield to main thread periodically
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  // Combine chunks and decode
  const combined = new Uint8Array(
    chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  );
  let offset = 0;
  chunks.forEach(chunk => {
    combined.set(chunk, offset);
    offset += chunk.length;
  });

  return audioContext.decodeAudioData(combined.buffer);
}
```

---

## Summary

Dynamic music systems transform static soundtracks into living, breathing musical experiences that respond to gameplay. The key concepts covered in this guide include:

### Core Techniques

| Technique | Use Case | Complexity |
|-----------|----------|------------|
| Horizontal Re-sequencing | Narrative progression, area transitions | Medium |
| Vertical Layering | Intensity changes, combat scaling | Medium |
| Beat Synchronization | Musical transitions, stingers | High |
| State Machines | Game state management | Medium |
| Context-Aware Selection | Intelligent music choices | High |

### Implementation Approaches

1. **Custom Solutions**: Full control but requires significant development
2. **Wwise**: Industry-standard with comprehensive music tools
3. **FMOD**: Excellent integration and timeline features
4. **Hybrid**: Game engine for logic, middleware for audio

### Key Takeaways

- Design music assets with adaptability in mind from the start
- Use quantized transitions for musical coherence
- Layer complexity: start simple, add features incrementally
- Test extensively with actual gameplay scenarios
- Monitor memory and performance, especially on mobile
- Collaborate closely between audio designers and programmers

A well-implemented dynamic music system can dramatically enhance player immersion and emotional engagement. While the technical implementation requires careful attention to timing, synchronization, and resource management, the artistic result is worth the investment.

### Further Reading

- "A Composer's Guide to Game Music" by Winifred Phillips
- "Game Audio Implementation" by Richard Stevens and Dave Raybould
- Wwise Interactive Music documentation
- FMOD Studio documentation
- GDC talks on adaptive music systems
