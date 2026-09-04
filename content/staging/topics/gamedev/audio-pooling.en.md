---
title: Audio Pooling and Compression Techniques
description: Optimize game audio performance with object pooling, streaming, compression formats, and memory management strategies
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - audio
  - optimization
  - pooling
  - compression
  - streaming
  - memory management
status: imported
origin: old/src/content/docs/gamedev/audio-pooling.en.md
divergence: 0.264
issues: []
legacy:
  category: GameDev
  subcategory: Audio
  order: 53
  lastUpdated: 2026-01-22
---

## Introduction

Audio systems in games often need to play hundreds of sounds simultaneously while maintaining low latency and minimal memory footprint. This article covers essential optimization techniques including audio pooling, streaming, compression, and memory management strategies that ensure smooth audio performance in resource-constrained environments.

### Audio Performance Challenges

```
Common Audio Performance Issues:
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Memory                    CPU                    Latency    │
│  ├─ Large audio files     ├─ Decoding overhead   ├─ Load    │
│  ├─ Duplicate buffers     ├─ Mixing costs        │   time   │
│  ├─ Uncompressed PCM      ├─ DSP effects         ├─ Buffer  │
│  └─ No streaming          └─ Voice management    │   size   │
│                                                              │
│  Bandwidth                 Storage                           │
│  ├─ Asset downloads       ├─ Install size                   │
│  ├─ Streaming bitrate     ├─ Patch size                     │
│  └─ Network audio         └─ Asset bundles                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Audio Object Pooling

### Why Pool Audio Objects?

Creating and destroying audio objects (sources, buffers, nodes) is expensive:

```
Without Pooling:                   With Pooling:
┌─────────────────┐               ┌─────────────────┐
│ Play sound      │               │ Play sound      │
│      ↓          │               │      ↓          │
│ Create source   │ ← Expensive   │ Get from pool   │ ← Fast
│      ↓          │               │      ↓          │
│ Allocate buffer │ ← GC pressure │ Reset state     │ ← No alloc
│      ↓          │               │      ↓          │
│ Connect nodes   │               │ Configure       │
│      ↓          │               │      ↓          │
│ Play            │               │ Play            │
│      ↓          │               │      ↓          │
│ Destroy source  │ ← GC trigger  │ Return to pool  │ ← Reuse
└─────────────────┘               └─────────────────┘
```

### Generic Object Pool Implementation

```typescript
interface Poolable {
  reset(): void;
  isActive(): boolean;
}

class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private active: Set<T> = new Set();
  private factory: () => T;
  private maxSize: number;
  private warmupSize: number;

  constructor(
    factory: () => T,
    options: {
      maxSize?: number;
      warmupSize?: number;
    } = {}
  ) {
    this.factory = factory;
    this.maxSize = options.maxSize ?? 100;
    this.warmupSize = options.warmupSize ?? 10;

    // Pre-warm the pool
    this.warmup();
  }

  private warmup(): void {
    for (let i = 0; i < this.warmupSize; i++) {
      const obj = this.factory();
      this.pool.push(obj);
    }
  }

  public acquire(): T | null {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else if (this.active.size < this.maxSize) {
      obj = this.factory();
    } else {
      // Pool exhausted
      console.warn('Object pool exhausted');
      return null;
    }

    obj.reset();
    this.active.add(obj);
    return obj;
  }

  public release(obj: T): void {
    if (!this.active.has(obj)) {
      console.warn('Attempting to release object not from this pool');
      return;
    }

    this.active.delete(obj);
    this.pool.push(obj);
  }

  public getActiveCount(): number {
    return this.active.size;
  }

  public getAvailableCount(): number {
    return this.pool.length;
  }

  public clear(): void {
    this.pool = [];
    this.active.clear();
  }
}
```

### Audio Source Pool

```typescript
interface AudioSourceConfig {
  maxSources: number;
  warmupCount: number;
}

class AudioSourcePool {
  private audioContext: AudioContext;
  private sources: PooledAudioSource[] = [];
  private activeSources: Map<string, PooledAudioSource> = new Map();
  private config: AudioSourceConfig;

  constructor(audioContext: AudioContext, config: AudioSourceConfig) {
    this.audioContext = audioContext;
    this.config = config;
    this.warmup();
  }

  private warmup(): void {
    for (let i = 0; i < this.config.warmupCount; i++) {
      const source = new PooledAudioSource(this.audioContext);
      this.sources.push(source);
    }
  }

  public acquire(id: string): PooledAudioSource | null {
    // Check if we have an available source
    let source: PooledAudioSource | undefined;

    if (this.sources.length > 0) {
      source = this.sources.pop();
    } else if (this.activeSources.size < this.config.maxSources) {
      source = new PooledAudioSource(this.audioContext);
    } else {
      // Try to steal the oldest source
      source = this.stealOldestSource();
    }

    if (!source) {
      return null;
    }

    source.reset();
    source.id = id;
    this.activeSources.set(id, source);
    return source;
  }

  public release(id: string): void {
    const source = this.activeSources.get(id);
    if (!source) return;

    source.stop();
    source.reset();
    this.activeSources.delete(id);
    this.sources.push(source);
  }

  public releaseAll(): void {
    for (const [id, source] of this.activeSources) {
      source.stop();
      source.reset();
      this.sources.push(source);
    }
    this.activeSources.clear();
  }

  private stealOldestSource(): PooledAudioSource | undefined {
    let oldest: PooledAudioSource | undefined;
    let oldestTime = Infinity;

    for (const source of this.activeSources.values()) {
      if (source.startTime < oldestTime) {
        oldestTime = source.startTime;
        oldest = source;
      }
    }

    if (oldest) {
      this.activeSources.delete(oldest.id);
      return oldest;
    }

    return undefined;
  }

  public getStats(): { active: number; available: number; total: number } {
    return {
      active: this.activeSources.size,
      available: this.sources.length,
      total: this.activeSources.size + this.sources.length
    };
  }
}

class PooledAudioSource implements Poolable {
  public id: string = '';
  public startTime: number = 0;

  private audioContext: AudioContext;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private pannerNode: PannerNode | null = null;
  private isPlaying: boolean = false;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.gainNode = audioContext.createGain();
  }

  public reset(): void {
    this.id = '';
    this.startTime = 0;
    this.isPlaying = false;

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {}
      this.sourceNode = null;
    }

    if (this.pannerNode) {
      this.pannerNode.disconnect();
      this.pannerNode = null;
    }

    this.gainNode.disconnect();
    this.gainNode.gain.value = 1;
  }

  public isActive(): boolean {
    return this.isPlaying;
  }

  public configure(options: {
    buffer: AudioBuffer;
    volume?: number;
    pitch?: number;
    loop?: boolean;
    position?: Vector3;
    spatialConfig?: SpatialConfig;
  }): void {
    // Create new source node
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = options.buffer;
    this.sourceNode.loop = options.loop ?? false;

    if (options.pitch !== undefined) {
      this.sourceNode.playbackRate.value = options.pitch;
    }

    if (options.volume !== undefined) {
      this.gainNode.gain.value = options.volume;
    }

    // Set up spatial audio if needed
    if (options.position && options.spatialConfig) {
      this.pannerNode = this.audioContext.createPanner();
      this.configurePanner(options.position, options.spatialConfig);
      this.sourceNode.connect(this.pannerNode);
      this.pannerNode.connect(this.gainNode);
    } else {
      this.sourceNode.connect(this.gainNode);
    }

    // Handle end event
    this.sourceNode.onended = () => {
      this.isPlaying = false;
    };
  }

  private configurePanner(position: Vector3, config: SpatialConfig): void {
    if (!this.pannerNode) return;

    this.pannerNode.panningModel = 'HRTF';
    this.pannerNode.distanceModel = config.rolloff;
    this.pannerNode.refDistance = config.minDistance;
    this.pannerNode.maxDistance = config.maxDistance;
    this.pannerNode.rolloffFactor = config.rolloffFactor;

    this.pannerNode.positionX.value = position.x;
    this.pannerNode.positionY.value = position.y;
    this.pannerNode.positionZ.value = position.z;
  }

  public connect(destination: AudioNode): void {
    this.gainNode.connect(destination);
  }

  public play(delay: number = 0): void {
    if (!this.sourceNode) return;

    const startTime = this.audioContext.currentTime + delay;
    this.sourceNode.start(startTime);
    this.isPlaying = true;
    this.startTime = startTime;
  }

  public stop(fadeTime: number = 0): void {
    if (!this.sourceNode || !this.isPlaying) return;

    if (fadeTime > 0) {
      const endTime = this.audioContext.currentTime + fadeTime;
      this.gainNode.gain.linearRampToValueAtTime(0, endTime);
      this.sourceNode.stop(endTime);
    } else {
      this.sourceNode.stop();
    }

    this.isPlaying = false;
  }

  public setVolume(volume: number, rampTime: number = 0): void {
    if (rampTime > 0) {
      this.gainNode.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + rampTime
      );
    } else {
      this.gainNode.gain.value = volume;
    }
  }

  public updatePosition(position: Vector3): void {
    if (!this.pannerNode) return;

    this.pannerNode.positionX.linearRampToValueAtTime(
      position.x,
      this.audioContext.currentTime + 0.02
    );
    this.pannerNode.positionY.linearRampToValueAtTime(
      position.y,
      this.audioContext.currentTime + 0.02
    );
    this.pannerNode.positionZ.linearRampToValueAtTime(
      position.z,
      this.audioContext.currentTime + 0.02
    );
  }
}

interface SpatialConfig {
  rolloff: 'linear' | 'inverse' | 'exponential';
  minDistance: number;
  maxDistance: number;
  rolloffFactor: number;
}
```

### Buffer Pool for Decoded Audio

```typescript
class AudioBufferPool {
  private audioContext: AudioContext;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private loadingPromises: Map<string, Promise<AudioBuffer>> = new Map();
  private accessTimes: Map<string, number> = new Map();
  private maxCacheSize: number;
  private currentSize: number = 0;

  constructor(audioContext: AudioContext, maxCacheSizeMB: number = 100) {
    this.audioContext = audioContext;
    this.maxCacheSize = maxCacheSizeMB * 1024 * 1024; // Convert to bytes
  }

  public async getBuffer(url: string): Promise<AudioBuffer> {
    // Check cache first
    const cached = this.bufferCache.get(url);
    if (cached) {
      this.accessTimes.set(url, Date.now());
      return cached;
    }

    // Check if already loading
    const loading = this.loadingPromises.get(url);
    if (loading) {
      return loading;
    }

    // Start loading
    const loadPromise = this.loadBuffer(url);
    this.loadingPromises.set(url, loadPromise);

    try {
      const buffer = await loadPromise;
      this.cacheBuffer(url, buffer);
      return buffer;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  private async loadBuffer(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return this.audioContext.decodeAudioData(arrayBuffer);
  }

  private cacheBuffer(url: string, buffer: AudioBuffer): void {
    const bufferSize = this.getBufferSize(buffer);

    // Evict old buffers if needed
    while (this.currentSize + bufferSize > this.maxCacheSize) {
      this.evictOldest();
    }

    this.bufferCache.set(url, buffer);
    this.accessTimes.set(url, Date.now());
    this.currentSize += bufferSize;
  }

  private getBufferSize(buffer: AudioBuffer): number {
    // Size = samples * channels * bytes per sample (Float32 = 4 bytes)
    return buffer.length * buffer.numberOfChannels * 4;
  }

  private evictOldest(): void {
    let oldestUrl: string | null = null;
    let oldestTime = Infinity;

    for (const [url, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestUrl = url;
      }
    }

    if (oldestUrl) {
      const buffer = this.bufferCache.get(oldestUrl);
      if (buffer) {
        this.currentSize -= this.getBufferSize(buffer);
        this.bufferCache.delete(oldestUrl);
        this.accessTimes.delete(oldestUrl);
      }
    }
  }

  public preload(urls: string[]): Promise<void[]> {
    return Promise.all(urls.map(url => this.getBuffer(url).then(() => {})));
  }

  public clearCache(): void {
    this.bufferCache.clear();
    this.accessTimes.clear();
    this.currentSize = 0;
  }

  public getStats(): {
    cachedCount: number;
    currentSizeMB: number;
    maxSizeMB: number;
  } {
    return {
      cachedCount: this.bufferCache.size,
      currentSizeMB: this.currentSize / (1024 * 1024),
      maxSizeMB: this.maxCacheSize / (1024 * 1024)
    };
  }
}
```

---

## Audio Streaming

### When to Stream vs. Load

```
Decision Matrix:
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  File Size        Playback Pattern      Recommendation       │
│  ─────────        ────────────────      ──────────────       │
│  < 1 MB           Any                   Decode to memory     │
│  1-10 MB          Repeated              Decode to memory     │
│  1-10 MB          Single play           Consider streaming   │
│  > 10 MB          Any                   Stream from disk     │
│                                                              │
│  Use Cases:                                                  │
│  • Short SFX (< 3s): Always decode to memory                │
│  • UI sounds: Decode to memory                               │
│  • Voice lines: Stream or decode based on size              │
│  • Music tracks: Always stream                               │
│  • Ambience loops: Stream                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Streaming Audio Implementation

```typescript
class AudioStreamer {
  private audioContext: AudioContext;
  private mediaSource: MediaSource | null = null;
  private sourceBuffer: SourceBuffer | null = null;
  private audioElement: HTMLAudioElement;
  private mediaNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode;
  private isStreaming: boolean = false;
  private bufferQueue: ArrayBuffer[] = [];
  private chunkSize: number = 64 * 1024; // 64KB chunks

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.audioElement = new Audio();
    this.gainNode = audioContext.createGain();
  }

  public async stream(url: string): Promise<void> {
    if (this.isStreaming) {
      this.stop();
    }

    // Check for MediaSource support
    if ('MediaSource' in window) {
      await this.streamWithMediaSource(url);
    } else {
      // Fallback to simple audio element
      await this.streamWithAudioElement(url);
    }
  }

  private async streamWithMediaSource(url: string): Promise<void> {
    this.mediaSource = new MediaSource();
    this.audioElement.src = URL.createObjectURL(this.mediaSource);

    await new Promise<void>((resolve) => {
      this.mediaSource!.addEventListener('sourceopen', () => resolve(), { once: true });
    });

    // Determine codec
    const mimeType = this.getMimeType(url);
    this.sourceBuffer = this.mediaSource!.addSourceBuffer(mimeType);

    // Start fetching and appending chunks
    this.fetchAndStream(url);

    // Create media element source
    this.mediaNode = this.audioContext.createMediaElementSource(this.audioElement);
    this.mediaNode.connect(this.gainNode);

    this.isStreaming = true;
  }

  private async streamWithAudioElement(url: string): Promise<void> {
    this.audioElement.src = url;

    this.mediaNode = this.audioContext.createMediaElementSource(this.audioElement);
    this.mediaNode.connect(this.gainNode);

    this.isStreaming = true;
  }

  private async fetchAndStream(url: string): Promise<void> {
    const response = await fetch(url);
    const reader = response.body!.getReader();

    const processChunk = async (): Promise<void> => {
      const { done, value } = await reader.read();

      if (done) {
        if (this.mediaSource && this.mediaSource.readyState === 'open') {
          this.mediaSource.endOfStream();
        }
        return;
      }

      // Wait for sourceBuffer to be ready
      await this.appendBuffer(value.buffer);

      // Continue reading
      processChunk();
    };

    processChunk();
  }

  private appendBuffer(buffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve) => {
      if (!this.sourceBuffer) {
        resolve();
        return;
      }

      if (this.sourceBuffer.updating) {
        this.bufferQueue.push(buffer);
        resolve();
        return;
      }

      const onUpdateEnd = () => {
        this.sourceBuffer!.removeEventListener('updateend', onUpdateEnd);

        // Process queued buffers
        if (this.bufferQueue.length > 0) {
          const next = this.bufferQueue.shift()!;
          this.appendBuffer(next);
        }

        resolve();
      };

      this.sourceBuffer.addEventListener('updateend', onUpdateEnd);
      this.sourceBuffer.appendBuffer(buffer);
    });
  }

  private getMimeType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'ogg': 'audio/ogg; codecs="vorbis"',
      'webm': 'audio/webm; codecs="opus"',
      'aac': 'audio/aac',
      'm4a': 'audio/mp4; codecs="mp4a.40.2"'
    };

    return mimeTypes[extension || 'mp3'] || 'audio/mpeg';
  }

  public connect(destination: AudioNode): void {
    this.gainNode.connect(destination);
  }

  public play(): void {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    this.audioElement.play();
  }

  public pause(): void {
    this.audioElement.pause();
  }

  public stop(): void {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    this.isStreaming = false;

    if (this.mediaSource && this.mediaSource.readyState === 'open') {
      this.mediaSource.endOfStream();
    }
  }

  public setVolume(volume: number): void {
    this.gainNode.gain.value = volume;
  }

  public seek(time: number): void {
    this.audioElement.currentTime = time;
  }

  public get currentTime(): number {
    return this.audioElement.currentTime;
  }

  public get duration(): number {
    return this.audioElement.duration;
  }
}
```

### Chunk-Based Audio Streaming

For more control over streaming:

```typescript
interface StreamChunk {
  index: number;
  data: ArrayBuffer;
  decoded: AudioBuffer | null;
}

class ChunkedAudioStreamer {
  private audioContext: AudioContext;
  private chunks: Map<number, StreamChunk> = new Map();
  private currentChunkIndex: number = 0;
  private chunkDuration: number = 5; // seconds per chunk
  private preloadAhead: number = 2; // chunks to preload
  private baseUrl: string = '';

  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private isPlaying: boolean = false;
  private startOffset: number = 0;
  private startTime: number = 0;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.gainNode = audioContext.createGain();
  }

  public async load(baseUrl: string, totalDuration: number): Promise<void> {
    this.baseUrl = baseUrl;
    const totalChunks = Math.ceil(totalDuration / this.chunkDuration);

    // Initialize chunk metadata
    for (let i = 0; i < totalChunks; i++) {
      this.chunks.set(i, {
        index: i,
        data: null as any,
        decoded: null
      });
    }

    // Preload first few chunks
    await this.preloadChunks(0);
  }

  private async preloadChunks(startIndex: number): Promise<void> {
    const promises: Promise<void>[] = [];

    for (let i = startIndex; i < startIndex + this.preloadAhead; i++) {
      const chunk = this.chunks.get(i);
      if (chunk && !chunk.decoded) {
        promises.push(this.loadChunk(i));
      }
    }

    await Promise.all(promises);
  }

  private async loadChunk(index: number): Promise<void> {
    const chunk = this.chunks.get(index);
    if (!chunk) return;

    // Fetch chunk data
    const url = `${this.baseUrl}_chunk${index}.webm`;
    const response = await fetch(url);
    chunk.data = await response.arrayBuffer();

    // Decode audio data
    chunk.decoded = await this.audioContext.decodeAudioData(chunk.data.slice(0));
  }

  public connect(destination: AudioNode): void {
    this.gainNode.connect(destination);
  }

  public play(offset: number = 0): void {
    if (this.isPlaying) return;

    this.startOffset = offset;
    this.currentChunkIndex = Math.floor(offset / this.chunkDuration);

    this.playCurrentChunk();
  }

  private playCurrentChunk(): void {
    const chunk = this.chunks.get(this.currentChunkIndex);
    if (!chunk || !chunk.decoded) {
      console.error('Chunk not ready:', this.currentChunkIndex);
      return;
    }

    // Create source for this chunk
    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = chunk.decoded;
    this.currentSource.connect(this.gainNode);

    // Calculate offset within chunk
    const chunkStartTime = this.currentChunkIndex * this.chunkDuration;
    const offsetInChunk = Math.max(0, this.startOffset - chunkStartTime);

    // Handle chunk end
    this.currentSource.onended = () => {
      this.onChunkEnded();
    };

    // Start playback
    this.startTime = this.audioContext.currentTime;
    this.currentSource.start(0, offsetInChunk);
    this.isPlaying = true;

    // Preload next chunks
    this.preloadChunks(this.currentChunkIndex + 1);
  }

  private onChunkEnded(): void {
    if (!this.isPlaying) return;

    this.currentChunkIndex++;
    this.startOffset = this.currentChunkIndex * this.chunkDuration;

    if (this.chunks.has(this.currentChunkIndex)) {
      this.playCurrentChunk();
    } else {
      // End of stream
      this.isPlaying = false;
    }
  }

  public stop(): void {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    this.isPlaying = false;
  }

  public pause(): void {
    if (!this.isPlaying) return;

    const elapsed = this.audioContext.currentTime - this.startTime;
    this.startOffset += elapsed;

    this.stop();
  }

  public resume(): void {
    if (this.isPlaying) return;
    this.play(this.startOffset);
  }

  public setVolume(volume: number): void {
    this.gainNode.gain.value = volume;
  }
}
```

---

## Audio Compression

### Compression Formats Comparison

```
┌────────────────────────────────────────────────────────────────────┐
│                    Audio Format Comparison                          │
├────────────────────────────────────────────────────────────────────┤
│ Format    │ Quality │ Size   │ CPU    │ Browser Support │ Use Case │
├───────────┼─────────┼────────┼────────┼─────────────────┼──────────┤
│ WAV/PCM   │ Best    │ Large  │ None   │ Universal       │ SFX      │
│ MP3       │ Good    │ Small  │ Low    │ Universal       │ Music    │
│ OGG       │ Great   │ Small  │ Medium │ Most            │ General  │
│ AAC       │ Great   │ Small  │ Low    │ Most            │ Music    │
│ Opus      │ Best    │ Small  │ Medium │ Modern          │ Voice    │
│ FLAC      │ Perfect │ Medium │ High   │ Modern          │ Archive  │
└────────────────────────────────────────────────────────────────────┘
```

### Format Selection Strategy

```typescript
interface AudioFormatStrategy {
  getOptimalFormat(
    audioType: AudioType,
    targetPlatform: Platform,
    qualityPreference: QualityLevel
  ): AudioFormatConfig;
}

enum AudioType {
  SFX = 'sfx',
  Music = 'music',
  Voice = 'voice',
  Ambience = 'ambience'
}

enum Platform {
  Web = 'web',
  Mobile = 'mobile',
  Desktop = 'desktop',
  Console = 'console'
}

enum QualityLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Lossless = 'lossless'
}

interface AudioFormatConfig {
  format: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
  fileExtension: string;
}

class AudioFormatSelector implements AudioFormatStrategy {
  private formatConfigs: Map<string, AudioFormatConfig[]> = new Map();

  constructor() {
    this.initializeConfigs();
  }

  private initializeConfigs(): void {
    // SFX configurations (prioritize low latency)
    this.formatConfigs.set('sfx', [
      { format: 'pcm', bitrate: 0, sampleRate: 44100, channels: 1, fileExtension: 'wav' },
      { format: 'opus', bitrate: 96, sampleRate: 48000, channels: 1, fileExtension: 'webm' },
      { format: 'mp3', bitrate: 128, sampleRate: 44100, channels: 1, fileExtension: 'mp3' }
    ]);

    // Music configurations (prioritize quality)
    this.formatConfigs.set('music', [
      { format: 'opus', bitrate: 160, sampleRate: 48000, channels: 2, fileExtension: 'webm' },
      { format: 'aac', bitrate: 192, sampleRate: 44100, channels: 2, fileExtension: 'm4a' },
      { format: 'mp3', bitrate: 192, sampleRate: 44100, channels: 2, fileExtension: 'mp3' },
      { format: 'ogg', bitrate: 192, sampleRate: 44100, channels: 2, fileExtension: 'ogg' }
    ]);

    // Voice configurations (prioritize clarity)
    this.formatConfigs.set('voice', [
      { format: 'opus', bitrate: 48, sampleRate: 48000, channels: 1, fileExtension: 'webm' },
      { format: 'aac', bitrate: 64, sampleRate: 44100, channels: 1, fileExtension: 'm4a' },
      { format: 'mp3', bitrate: 64, sampleRate: 22050, channels: 1, fileExtension: 'mp3' }
    ]);

    // Ambience configurations (longer files, prioritize size)
    this.formatConfigs.set('ambience', [
      { format: 'opus', bitrate: 96, sampleRate: 48000, channels: 2, fileExtension: 'webm' },
      { format: 'ogg', bitrate: 128, sampleRate: 44100, channels: 2, fileExtension: 'ogg' },
      { format: 'aac', bitrate: 128, sampleRate: 44100, channels: 2, fileExtension: 'm4a' }
    ]);
  }

  public getOptimalFormat(
    audioType: AudioType,
    targetPlatform: Platform,
    qualityPreference: QualityLevel
  ): AudioFormatConfig {
    const configs = this.formatConfigs.get(audioType) || this.formatConfigs.get('sfx')!;

    // Filter by browser/platform support
    const supported = configs.filter(config =>
      this.isFormatSupported(config.format, targetPlatform)
    );

    // Select based on quality preference
    if (qualityPreference === QualityLevel.Lossless) {
      return supported.find(c => c.format === 'pcm') || supported[0];
    }

    // Return first supported format (already ordered by preference)
    return supported[0];
  }

  private isFormatSupported(format: string, platform: Platform): boolean {
    // Check browser support
    if (typeof window !== 'undefined' && 'MediaSource' in window) {
      const mimeTypes: Record<string, string> = {
        'opus': 'audio/webm; codecs="opus"',
        'aac': 'audio/mp4; codecs="mp4a.40.2"',
        'mp3': 'audio/mpeg',
        'ogg': 'audio/ogg; codecs="vorbis"',
        'pcm': 'audio/wav'
      };

      const mimeType = mimeTypes[format];
      if (mimeType) {
        return MediaSource.isTypeSupported(mimeType);
      }
    }

    // Fallback: assume common formats are supported
    return ['mp3', 'wav', 'ogg'].includes(format);
  }

  public getSupportedFormats(): string[] {
    const formats = ['pcm', 'mp3', 'ogg', 'opus', 'aac'];
    return formats.filter(f => this.isFormatSupported(f, Platform.Web));
  }
}
```

### Runtime Audio Compression

For dynamic audio (recordings, generated sounds):

```typescript
class AudioCompressor {
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  // Compress AudioBuffer to WAV
  public async compressToWav(buffer: AudioBuffer): Promise<Blob> {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    // WAV header
    this.writeWavHeader(view, buffer);

    // Audio data
    const offset = 44;
    const channelData: Float32Array[] = [];

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channelData.push(buffer.getChannelData(i));
    }

    // Interleave channels and convert to 16-bit
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset + (i * buffer.numberOfChannels + channel) * 2, int16, true);
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private writeWavHeader(view: DataView, buffer: AudioBuffer): void {
    const sampleRate = buffer.sampleRate;
    const channels = buffer.numberOfChannels;
    const bitsPerSample = 16;
    const byteRate = sampleRate * channels * bitsPerSample / 8;
    const blockAlign = channels * bitsPerSample / 8;
    const dataSize = buffer.length * channels * bitsPerSample / 8;

    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');

    // fmt chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // Downsample for reduced file size
  public downsample(
    buffer: AudioBuffer,
    targetSampleRate: number
  ): AudioBuffer {
    if (buffer.sampleRate <= targetSampleRate) {
      return buffer;
    }

    const ratio = buffer.sampleRate / targetSampleRate;
    const newLength = Math.floor(buffer.length / ratio);

    const newBuffer = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      newLength,
      targetSampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const inputData = buffer.getChannelData(channel);
      const outputData = newBuffer.getChannelData(channel);

      for (let i = 0; i < newLength; i++) {
        // Simple linear interpolation
        const srcIndex = i * ratio;
        const srcIndexFloor = Math.floor(srcIndex);
        const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
        const t = srcIndex - srcIndexFloor;

        outputData[i] = inputData[srcIndexFloor] * (1 - t) + inputData[srcIndexCeil] * t;
      }
    }

    return newBuffer;
  }

  // Convert stereo to mono
  public toMono(buffer: AudioBuffer): AudioBuffer {
    if (buffer.numberOfChannels === 1) {
      return buffer;
    }

    const monoBuffer = this.audioContext.createBuffer(
      1,
      buffer.length,
      buffer.sampleRate
    );

    const outputData = monoBuffer.getChannelData(0);
    const channels: Float32Array[] = [];

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    for (let i = 0; i < buffer.length; i++) {
      let sum = 0;
      for (const channel of channels) {
        sum += channel[i];
      }
      outputData[i] = sum / buffer.numberOfChannels;
    }

    return monoBuffer;
  }
}
```

---

## Memory Management

### Audio Memory Budget System

```typescript
interface MemoryBudget {
  sfx: number;      // bytes
  music: number;
  voice: number;
  ambience: number;
  total: number;
}

class AudioMemoryManager {
  private budget: MemoryBudget;
  private usage: Map<string, number> = new Map();
  private categoryUsage: Map<string, number> = new Map();
  private priorityQueue: { id: string; priority: number; size: number; lastAccess: number }[] = [];

  constructor(budgetMB: number = 100) {
    const totalBytes = budgetMB * 1024 * 1024;

    this.budget = {
      sfx: totalBytes * 0.3,      // 30%
      music: totalBytes * 0.4,     // 40%
      voice: totalBytes * 0.15,    // 15%
      ambience: totalBytes * 0.15, // 15%
      total: totalBytes
    };

    for (const category of ['sfx', 'music', 'voice', 'ambience']) {
      this.categoryUsage.set(category, 0);
    }
  }

  public canAllocate(category: string, size: number): boolean {
    const categoryBudget = this.budget[category as keyof MemoryBudget] || 0;
    const currentUsage = this.categoryUsage.get(category) || 0;

    return currentUsage + size <= categoryBudget;
  }

  public allocate(
    id: string,
    category: string,
    size: number,
    priority: number
  ): boolean {
    // Check if allocation is possible
    if (!this.canAllocate(category, size)) {
      // Try to free up space
      const freed = this.freeSpace(category, size);
      if (!freed) {
        return false;
      }
    }

    // Track allocation
    this.usage.set(id, size);
    this.categoryUsage.set(
      category,
      (this.categoryUsage.get(category) || 0) + size
    );

    this.priorityQueue.push({
      id,
      priority,
      size,
      lastAccess: Date.now()
    });

    return true;
  }

  public deallocate(id: string, category: string): void {
    const size = this.usage.get(id);
    if (size === undefined) return;

    this.usage.delete(id);
    this.categoryUsage.set(
      category,
      (this.categoryUsage.get(category) || 0) - size
    );

    const index = this.priorityQueue.findIndex(item => item.id === id);
    if (index >= 0) {
      this.priorityQueue.splice(index, 1);
    }
  }

  public touch(id: string): void {
    const item = this.priorityQueue.find(i => i.id === id);
    if (item) {
      item.lastAccess = Date.now();
    }
  }

  private freeSpace(category: string, requiredSize: number): boolean {
    // Sort by priority (low first) and then by last access (oldest first)
    const candidates = this.priorityQueue
      .filter(item => this.getCategoryForId(item.id) === category)
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.lastAccess - b.lastAccess;
      });

    let freedSize = 0;
    const toRemove: string[] = [];

    for (const candidate of candidates) {
      toRemove.push(candidate.id);
      freedSize += candidate.size;

      if (freedSize >= requiredSize) {
        break;
      }
    }

    if (freedSize < requiredSize) {
      return false;
    }

    // Actually free the items (caller should handle actual buffer deletion)
    for (const id of toRemove) {
      this.deallocate(id, category);
      this.onItemEvicted?.(id);
    }

    return true;
  }

  private getCategoryForId(id: string): string {
    // Extract category from ID (assuming format: "category_name")
    return id.split('_')[0] || 'sfx';
  }

  public onItemEvicted: ((id: string) => void) | null = null;

  public getStats(): {
    total: { used: number; budget: number };
    categories: { [key: string]: { used: number; budget: number } };
  } {
    let totalUsed = 0;
    const categories: { [key: string]: { used: number; budget: number } } = {};

    for (const [category, used] of this.categoryUsage) {
      totalUsed += used;
      categories[category] = {
        used,
        budget: this.budget[category as keyof MemoryBudget] || 0
      };
    }

    return {
      total: { used: totalUsed, budget: this.budget.total },
      categories
    };
  }
}
```

---

## Performance Monitoring

```typescript
class AudioPerformanceMonitor {
  private metrics: {
    activeVoices: number;
    peakVoices: number;
    bufferUnderruns: number;
    latency: number;
    cpuUsage: number;
    memoryUsed: number;
  } = {
    activeVoices: 0,
    peakVoices: 0,
    bufferUnderruns: 0,
    latency: 0,
    cpuUsage: 0,
    memoryUsed: 0
  };

  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private measurementInterval: number | null = null;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.analyser = audioContext.createAnalyser();
  }

  public startMonitoring(intervalMs: number = 100): void {
    this.measurementInterval = window.setInterval(() => {
      this.measure();
    }, intervalMs);
  }

  public stopMonitoring(): void {
    if (this.measurementInterval !== null) {
      clearInterval(this.measurementInterval);
      this.measurementInterval = null;
    }
  }

  private measure(): void {
    // Measure latency
    this.metrics.latency = this.audioContext.baseLatency +
      (this.audioContext.outputLatency || 0);

    // Update peak voices
    if (this.metrics.activeVoices > this.metrics.peakVoices) {
      this.metrics.peakVoices = this.metrics.activeVoices;
    }
  }

  public setActiveVoices(count: number): void {
    this.metrics.activeVoices = count;
  }

  public reportUnderrun(): void {
    this.metrics.bufferUnderruns++;
  }

  public setMemoryUsed(bytes: number): void {
    this.metrics.memoryUsed = bytes;
  }

  public getMetrics(): typeof this.metrics {
    return { ...this.metrics };
  }

  public getReport(): string {
    const m = this.metrics;
    return `
Audio Performance Report:
- Active Voices: ${m.activeVoices}
- Peak Voices: ${m.peakVoices}
- Buffer Underruns: ${m.bufferUnderruns}
- Latency: ${(m.latency * 1000).toFixed(2)}ms
- Memory Used: ${(m.memoryUsed / (1024 * 1024)).toFixed(2)}MB
    `.trim();
  }

  public reset(): void {
    this.metrics.peakVoices = this.metrics.activeVoices;
    this.metrics.bufferUnderruns = 0;
  }
}
```

---

## Summary

Optimizing game audio requires a multi-faceted approach:

1. **Object Pooling**: Reuse audio sources and buffers to avoid GC pressure
2. **Streaming**: Stream large files to reduce memory usage
3. **Compression**: Choose appropriate formats for different audio types
4. **Memory Management**: Implement budget systems and LRU caching
5. **Performance Monitoring**: Track metrics to identify bottlenecks

Key recommendations:
- Pool everything that gets created/destroyed frequently
- Stream music and long ambience tracks
- Use Opus/WebM for best quality-to-size ratio on modern browsers
- Implement priority-based voice stealing
- Monitor and budget memory usage by category

---

## Further Reading

- Web Audio API specification
- "Game Audio Programming" series by Guy Somberg
- FMOD and Wwise optimization guides
- Browser audio implementation details
