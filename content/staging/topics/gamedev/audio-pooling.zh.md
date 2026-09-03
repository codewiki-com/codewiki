---
title: 音频池与音频压缩技术
description: 通过对象池、流式传输、压缩格式和内存管理策略优化游戏音频性能
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - 音频
  - 优化
  - 对象池
  - 压缩
  - 流式传输
  - 内存管理
status: imported
origin: old/src/content/docs/gamedev/audio-pooling.zh.md
divergence: 0.264
issues: []
legacy:
  category: GameDev
  subcategory: Audio
  order: 53
  lastUpdated: 2026-01-22
---

## 简介

游戏中的音频系统通常需要同时播放数百个声音，同时保持低延迟和最小内存占用。本文涵盖基本优化技术，包括音频池化、流式传输、压缩和内存管理策略，确保在资源受限环境中音频性能流畅。

### 音频性能挑战

```
常见音频性能问题：
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  内存                     CPU                     延迟       │
│  ├─ 大型音频文件         ├─ 解码开销            ├─ 加载     │
│  ├─ 重复缓冲区           ├─ 混音成本            │   时间    │
│  ├─ 未压缩PCM            ├─ DSP效果             ├─ 缓冲区   │
│  └─ 无流式传输           └─ 声音管理            │   大小    │
│                                                              │
│  带宽                     存储                               │
│  ├─ 资源下载             ├─ 安装大小                        │
│  ├─ 流式传输比特率       ├─ 补丁大小                        │
│  └─ 网络音频             └─ 资源包                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 音频对象池化

### 为什么要池化音频对象？

创建和销毁音频对象（源、缓冲区、节点）的开销很大：

```
无池化：                          有池化：
┌─────────────────┐               ┌─────────────────┐
│ 播放声音        │               │ 播放声音        │
│      ↓          │               │      ↓          │
│ 创建源          │ ← 昂贵        │ 从池获取        │ ← 快速
│      ↓          │               │      ↓          │
│ 分配缓冲区      │ ← GC压力      │ 重置状态        │ ← 无分配
│      ↓          │               │      ↓          │
│ 连接节点        │               │ 配置            │
│      ↓          │               │      ↓          │
│ 播放            │               │ 播放            │
│      ↓          │               │      ↓          │
│ 销毁源          │ ← GC触发      │ 返回池          │ ← 重用
└─────────────────┘               └─────────────────┘
```

### 通用对象池实现

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

    // 预热池
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
      // 池已耗尽
      console.warn('对象池已耗尽');
      return null;
    }

    obj.reset();
    this.active.add(obj);
    return obj;
  }

  public release(obj: T): void {
    if (!this.active.has(obj)) {
      console.warn('尝试释放不属于此池的对象');
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

### 音频源池

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
    // 检查是否有可用的源
    let source: PooledAudioSource | undefined;

    if (this.sources.length > 0) {
      source = this.sources.pop();
    } else if (this.activeSources.size < this.config.maxSources) {
      source = new PooledAudioSource(this.audioContext);
    } else {
      // 尝试抢占最旧的源
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
    // 创建新的源节点
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = options.buffer;
    this.sourceNode.loop = options.loop ?? false;

    if (options.pitch !== undefined) {
      this.sourceNode.playbackRate.value = options.pitch;
    }

    if (options.volume !== undefined) {
      this.gainNode.gain.value = options.volume;
    }

    // 如果需要，设置空间音频
    if (options.position && options.spatialConfig) {
      this.pannerNode = this.audioContext.createPanner();
      this.configurePanner(options.position, options.spatialConfig);
      this.sourceNode.connect(this.pannerNode);
      this.pannerNode.connect(this.gainNode);
    } else {
      this.sourceNode.connect(this.gainNode);
    }

    // 处理结束事件
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
```

### 解码音频的缓冲池

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
    this.maxCacheSize = maxCacheSizeMB * 1024 * 1024; // 转换为字节
  }

  public async getBuffer(url: string): Promise<AudioBuffer> {
    // 首先检查缓存
    const cached = this.bufferCache.get(url);
    if (cached) {
      this.accessTimes.set(url, Date.now());
      return cached;
    }

    // 检查是否正在加载
    const loading = this.loadingPromises.get(url);
    if (loading) {
      return loading;
    }

    // 开始加载
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

    // 如果需要，驱逐旧缓冲区
    while (this.currentSize + bufferSize > this.maxCacheSize) {
      this.evictOldest();
    }

    this.bufferCache.set(url, buffer);
    this.accessTimes.set(url, Date.now());
    this.currentSize += bufferSize;
  }

  private getBufferSize(buffer: AudioBuffer): number {
    // 大小 = 采样数 * 通道数 * 每采样字节数（Float32 = 4 字节）
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

## 音频流式传输

### 何时流式传输 vs 加载

```
决策矩阵：
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  文件大小        播放模式              建议                  │
│  ─────────       ────────              ────                  │
│  < 1 MB          任意                  解码到内存            │
│  1-10 MB         重复播放              解码到内存            │
│  1-10 MB         单次播放              考虑流式传输          │
│  > 10 MB         任意                  从磁盘流式传输        │
│                                                              │
│  用例：                                                       │
│  • 短音效 (< 3s)：始终解码到内存                             │
│  • UI音效：解码到内存                                        │
│  • 语音：根据大小流式传输或解码                              │
│  • 音乐曲目：始终流式传输                                    │
│  • 环境循环：流式传输                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 流式音频实现

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
  private chunkSize: number = 64 * 1024; // 64KB 块

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.audioElement = new Audio();
    this.gainNode = audioContext.createGain();
  }

  public async stream(url: string): Promise<void> {
    if (this.isStreaming) {
      this.stop();
    }

    // 检查 MediaSource 支持
    if ('MediaSource' in window) {
      await this.streamWithMediaSource(url);
    } else {
      // 回退到简单的音频元素
      await this.streamWithAudioElement(url);
    }
  }

  private async streamWithMediaSource(url: string): Promise<void> {
    this.mediaSource = new MediaSource();
    this.audioElement.src = URL.createObjectURL(this.mediaSource);

    await new Promise<void>((resolve) => {
      this.mediaSource!.addEventListener('sourceopen', () => resolve(), { once: true });
    });

    // 确定编解码器
    const mimeType = this.getMimeType(url);
    this.sourceBuffer = this.mediaSource!.addSourceBuffer(mimeType);

    // 开始获取和流式传输块
    this.fetchAndStream(url);

    // 创建媒体元素源
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

      // 等待 sourceBuffer 准备好
      await this.appendBuffer(value.buffer);

      // 继续读取
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

        // 处理队列中的缓冲区
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

---

## 音频压缩

### 压缩格式比较

```
┌────────────────────────────────────────────────────────────────────┐
│                        音频格式比较                                 │
├────────────────────────────────────────────────────────────────────┤
│ 格式      │ 质量   │ 大小   │ CPU    │ 浏览器支持   │ 用例        │
├───────────┼────────┼────────┼────────┼──────────────┼─────────────┤
│ WAV/PCM   │ 最佳   │ 大     │ 无     │ 通用         │ 音效        │
│ MP3       │ 良好   │ 小     │ 低     │ 通用         │ 音乐        │
│ OGG       │ 优秀   │ 小     │ 中     │ 大多数       │ 通用        │
│ AAC       │ 优秀   │ 小     │ 低     │ 大多数       │ 音乐        │
│ Opus      │ 最佳   │ 小     │ 中     │ 现代         │ 语音        │
│ FLAC      │ 完美   │ 中     │ 高     │ 现代         │ 归档        │
└────────────────────────────────────────────────────────────────────┘
```

### 格式选择策略

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
    // 音效配置（优先考虑低延迟）
    this.formatConfigs.set('sfx', [
      { format: 'pcm', bitrate: 0, sampleRate: 44100, channels: 1, fileExtension: 'wav' },
      { format: 'opus', bitrate: 96, sampleRate: 48000, channels: 1, fileExtension: 'webm' },
      { format: 'mp3', bitrate: 128, sampleRate: 44100, channels: 1, fileExtension: 'mp3' }
    ]);

    // 音乐配置（优先考虑质量）
    this.formatConfigs.set('music', [
      { format: 'opus', bitrate: 160, sampleRate: 48000, channels: 2, fileExtension: 'webm' },
      { format: 'aac', bitrate: 192, sampleRate: 44100, channels: 2, fileExtension: 'm4a' },
      { format: 'mp3', bitrate: 192, sampleRate: 44100, channels: 2, fileExtension: 'mp3' },
      { format: 'ogg', bitrate: 192, sampleRate: 44100, channels: 2, fileExtension: 'ogg' }
    ]);

    // 语音配置（优先考虑清晰度）
    this.formatConfigs.set('voice', [
      { format: 'opus', bitrate: 48, sampleRate: 48000, channels: 1, fileExtension: 'webm' },
      { format: 'aac', bitrate: 64, sampleRate: 44100, channels: 1, fileExtension: 'm4a' },
      { format: 'mp3', bitrate: 64, sampleRate: 22050, channels: 1, fileExtension: 'mp3' }
    ]);

    // 环境音配置（较长文件，优先考虑大小）
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

    // 按浏览器/平台支持过滤
    const supported = configs.filter(config =>
      this.isFormatSupported(config.format, targetPlatform)
    );

    // 根据质量偏好选择
    if (qualityPreference === QualityLevel.Lossless) {
      return supported.find(c => c.format === 'pcm') || supported[0];
    }

    // 返回第一个支持的格式（已按偏好排序）
    return supported[0];
  }

  private isFormatSupported(format: string, platform: Platform): boolean {
    // 检查浏览器支持
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

    // 回退：假设常见格式受支持
    return ['mp3', 'wav', 'ogg'].includes(format);
  }
}
```

---

## 内存管理

### 音频内存预算系统

```typescript
interface MemoryBudget {
  sfx: number;      // 字节
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
    // 检查是否可以分配
    if (!this.canAllocate(category, size)) {
      // 尝试释放空间
      const freed = this.freeSpace(category, size);
      if (!freed) {
        return false;
      }
    }

    // 跟踪分配
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
    // 按优先级（低优先）然后按最后访问时间（最旧优先）排序
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

    // 实际释放项目（调用者应处理实际缓冲区删除）
    for (const id of toRemove) {
      this.deallocate(id, category);
      this.onItemEvicted?.(id);
    }

    return true;
  }

  private getCategoryForId(id: string): string {
    // 从 ID 提取类别（假设格式：category_name）
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

## 性能监控

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
    // 测量延迟
    this.metrics.latency = this.audioContext.baseLatency +
      (this.audioContext.outputLatency || 0);

    // 更新峰值声音数
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
音频性能报告：
- 活动声音数：${m.activeVoices}
- 峰值声音数：${m.peakVoices}
- 缓冲区欠载：${m.bufferUnderruns}
- 延迟：${(m.latency * 1000).toFixed(2)}ms
- 使用内存：${(m.memoryUsed / (1024 * 1024)).toFixed(2)}MB
    `.trim();
  }

  public reset(): void {
    this.metrics.peakVoices = this.metrics.activeVoices;
    this.metrics.bufferUnderruns = 0;
  }
}
```

---

## 总结

优化游戏音频需要多方面的方法：

1. **对象池化**：重用音频源和缓冲区以避免 GC 压力
2. **流式传输**：流式传输大型文件以减少内存使用
3. **压缩**：为不同音频类型选择适当的格式
4. **内存管理**：实现预算系统和 LRU 缓存
5. **性能监控**：跟踪指标以识别瓶颈

关键建议：
- 池化所有频繁创建/销毁的对象
- 流式传输音乐和长环境音轨
- 在现代浏览器上使用 Opus/WebM 以获得最佳质量/大小比
- 实现基于优先级的声音抢占
- 按类别监控和预算内存使用

---

## 延伸阅读

- Web Audio API 规范
- "Game Audio Programming" 系列书籍 - Guy Somberg
- FMOD 和 Wwise 优化指南
- 浏览器音频实现详情
