---
title: JavaScript Web Audio API 详解
description: 深入理解 Web Audio API：AudioContext、音频节点、音频可视化与实时音频处理
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - Web Audio
  - 音频处理
  - 可视化
  - AudioContext
status: imported
origin: old/src/content/docs/javascript/web-audio.zh.md
divergence: 0.203
issues: []
legacy:
  category: JavaScript
  subcategory: Web API
  order: 50
  lastUpdated: 2026-01-07
---

## 概念解释

Web Audio API 是一套功能强大的 JavaScript API，用于在网页中处理和合成音频。它提供了一个模块化的音频路由系统，允许开发者创建复杂的音频应用，包括音乐播放器、游戏音效、实时音频处理、音频可视化等。

### 历史背景

在 Web Audio API 出现之前，网页音频处理主要依赖 `<audio>` 元素，功能非常有限。2011 年，Google Chrome 率先实现了 Web Audio API，随后其他浏览器陆续跟进。该 API 由 W3C 标准化，目前已得到所有主流浏览器的支持。

### 解决的问题

- **精确时间控制**：提供亚毫秒级的音频调度精度
- **音频合成**：支持从零开始生成声音波形
- **实时处理**：允许对音频流进行实时效果处理
- **空间音效**：支持 3D 音频定位和环绕声
- **音频分析**：提供频谱分析和时域分析能力

## 核心原理

### 音频图（Audio Graph）模型

Web Audio API 基于音频图模型，音频数据从源节点流向目标节点，中间可经过任意数量的处理节点。

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  音频源     │───▶│  处理节点   │───▶│  处理节点   │───▶│  目标节点   │
│  (Source)   │    │  (Effects)  │    │  (Analyzer) │    │(Destination)│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### AudioContext 生命周期

AudioContext 是 Web Audio API 的核心，管理着整个音频图的生命周期。

```javascript
// 创建 AudioContext
const audioContext = new AudioContext();

// 状态检查
console.log(audioContext.state); // 'suspended', 'running', 或 'closed'

// 由于浏览器自动播放策略，通常需要用户交互后恢复
document.addEventListener('click', async () => {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
    console.log('AudioContext 已恢复运行');
  }
});

// 关闭 AudioContext
// audioContext.close();
```

### 时间模型

Web Audio API 使用高精度的时间系统，`audioContext.currentTime` 提供了从创建 AudioContext 开始的精确时间（以秒为单位）。

```javascript
const audioContext = new AudioContext();

// 获取当前音频上下文时间
console.log(audioContext.currentTime); // 例如：0.023

// 调度将来的音频事件
const oscillator = audioContext.createOscillator();
oscillator.connect(audioContext.destination);

// 在 1 秒后开始播放
oscillator.start(audioContext.currentTime + 1);
// 在 3 秒后停止播放
oscillator.stop(audioContext.currentTime + 3);
```

## 核心要点

### 音频节点类型

Web Audio API 提供了多种音频节点类型：

| 节点类型 | 说明 | 创建方法 |
|---------|------|---------|
| OscillatorNode | 生成周期性波形 | `createOscillator()` |
| AudioBufferSourceNode | 播放内存中的音频数据 | `createBufferSource()` |
| MediaElementAudioSourceNode | 从 `<audio>` 或 `<video>` 获取音频 | `createMediaElementSource()` |
| MediaStreamAudioSourceNode | 从麦克风等获取音频流 | `createMediaStreamSource()` |
| GainNode | 控制音量 | `createGain()` |
| BiquadFilterNode | 各种滤波器效果 | `createBiquadFilter()` |
| DelayNode | 延迟效果 | `createDelay()` |
| ConvolverNode | 卷积混响效果 | `createConvolver()` |
| DynamicsCompressorNode | 动态压缩 | `createDynamicsCompressor()` |
| AnalyserNode | 音频分析（可视化） | `createAnalyser()` |
| PannerNode | 3D 空间定位 | `createPanner()` |
| StereoPannerNode | 立体声平移 | `createStereoPanner()` |

### 连接与断开

```javascript
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();

// 连接节点
oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);

// 断开连接
// oscillator.disconnect();
// oscillator.disconnect(gainNode); // 断开特定连接
```

### 参数自动化

AudioParam 支持精确的参数调度：

```javascript
const gainNode = audioContext.createGain();

// 设置立即值
gainNode.gain.value = 0.5;

// 在指定时间设置值
gainNode.gain.setValueAtTime(1, audioContext.currentTime + 1);

// 线性渐变到目标值
gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2);

// 指数渐变到目标值
gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);

// 指数衰减到目标值
gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.5); // timeConstant = 0.5

// 设置值曲线
const curve = new Float32Array([0, 0.5, 1, 0.8, 0]);
gainNode.gain.setValueCurveAtTime(curve, audioContext.currentTime, 2);
```

## 代码示例

### 基础示例：创建简单音调

```javascript
// 创建 AudioContext
const audioContext = new AudioContext();

// 创建振荡器（声音源）
const oscillator = audioContext.createOscillator();
oscillator.type = 'sine'; // 波形类型: sine, square, sawtooth, triangle
oscillator.frequency.value = 440; // 频率 440Hz (A4 音符)

// 创建音量控制节点
const gainNode = audioContext.createGain();
gainNode.gain.value = 0.3; // 音量 30%

// 连接节点: 振荡器 -> 音量 -> 扬声器
oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);

// 开始播放
oscillator.start();

// 2 秒后停止
oscillator.stop(audioContext.currentTime + 2);
```

### 加载并播放音频文件

```javascript
class AudioPlayer {
  constructor() {
    this.audioContext = new AudioContext();
    this.audioBuffer = null;
    this.sourceNode = null;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  // 加载音频文件
  async loadAudio(url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log('音频加载成功');
      console.log('时长:', this.audioBuffer.duration, '秒');
      console.log('采样率:', this.audioBuffer.sampleRate, 'Hz');
      console.log('声道数:', this.audioBuffer.numberOfChannels);
    } catch (error) {
      console.error('音频加载失败:', error);
    }
  }

  // 播放音频
  play(startTime = 0) {
    if (!this.audioBuffer) {
      console.error('请先加载音频');
      return;
    }

    // 确保 AudioContext 处于运行状态
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // 创建新的 BufferSourceNode（一次性使用）
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode);

    // 从指定位置开始播放
    this.sourceNode.start(0, startTime);

    // 播放结束事件
    this.sourceNode.onended = () => {
      console.log('播放结束');
    };
  }

  // 停止播放
  stop() {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
    }
  }

  // 设置音量
  setVolume(value) {
    this.gainNode.gain.value = Math.max(0, Math.min(1, value));
  }

  // 淡入效果
  fadeIn(duration = 1) {
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(
      1,
      this.audioContext.currentTime + duration
    );
  }

  // 淡出效果
  fadeOut(duration = 1) {
    this.gainNode.gain.setValueAtTime(
      this.gainNode.gain.value,
      this.audioContext.currentTime
    );
    this.gainNode.gain.linearRampToValueAtTime(
      0,
      this.audioContext.currentTime + duration
    );
  }
}

// 使用示例
const player = new AudioPlayer();
await player.loadAudio('/audio/music.mp3');
player.fadeIn(0.5);
player.play();
```

### 音频可视化

```javascript
class AudioVisualizer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();

    // 配置分析器
    this.analyser.fftSize = 2048; // FFT 大小，必须是 2 的幂
    this.analyser.smoothingTimeConstant = 0.8; // 平滑系数

    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    this.isRunning = false;
  }

  // 连接音频源
  connectSource(sourceNode) {
    sourceNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  // 从麦克风获取音频
  async connectMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);
      // 注意：麦克风通常不连接到 destination，避免回声
      console.log('麦克风已连接');
    } catch (error) {
      console.error('无法访问麦克风:', error);
    }
  }

  // 从 audio 元素获取音频
  connectAudioElement(audioElement) {
    const source = this.audioContext.createMediaElementSource(audioElement);
    this.connectSource(source);
  }

  // 绘制波形图
  drawWaveform() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.drawWaveform());

    // 获取时域数据
    this.analyser.getByteTimeDomainData(this.dataArray);

    // 清空画布
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制波形
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#00ff00';
    this.ctx.beginPath();

    const sliceWidth = this.canvas.width / this.bufferLength;
    let x = 0;

    for (let i = 0; i < this.bufferLength; i++) {
      const v = this.dataArray[i] / 128.0;
      const y = (v * this.canvas.height) / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
    this.ctx.stroke();
  }

  // 绘制频谱图
  drawFrequencyBars() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.drawFrequencyBars());

    // 获取频域数据
    this.analyser.getByteFrequencyData(this.dataArray);

    // 清空画布
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const barCount = 64; // 显示的频率条数量
    const barWidth = this.canvas.width / barCount;
    const step = Math.floor(this.bufferLength / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = this.dataArray[i * step];
      const percent = value / 255;
      const barHeight = this.canvas.height * percent;

      // 根据高度设置颜色
      const hue = (i / barCount) * 360;
      this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

      this.ctx.fillRect(
        i * barWidth,
        this.canvas.height - barHeight,
        barWidth - 1,
        barHeight
      );
    }
  }

  // 绘制圆形频谱
  drawCircularSpectrum() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.drawCircularSpectrum());

    this.analyser.getByteFrequencyData(this.dataArray);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.5;
    const barCount = 180;
    const step = Math.floor(this.bufferLength / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = this.dataArray[i * step];
      const percent = value / 255;
      const barHeight = radius * percent;

      const angle = (i / barCount) * Math.PI * 2;
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      const hue = (i / barCount) * 360;
      this.ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.stroke();
    }
  }

  start(type = 'bars') {
    this.isRunning = true;
    switch (type) {
      case 'waveform':
        this.drawWaveform();
        break;
      case 'bars':
        this.drawFrequencyBars();
        break;
      case 'circular':
        this.drawCircularSpectrum();
        break;
    }
  }

  stop() {
    this.isRunning = false;
  }
}

// 使用示例
const canvas = document.getElementById('visualizer');
const visualizer = new AudioVisualizer(canvas);

// 连接 audio 元素
const audio = document.getElementById('audio');
visualizer.connectAudioElement(audio);
visualizer.start('bars');
audio.play();
```

### 创建音效

```javascript
class SoundEffects {
  constructor() {
    this.audioContext = new AudioContext();
  }

  // 播放简单的哔哔声
  playBeep(frequency = 440, duration = 0.2, type = 'sine') {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration
    );

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 游戏跳跃音效
  playJump() {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      400,
      this.audioContext.currentTime + 0.1
    );

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.2
    );

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  // 硬币收集音效
  playCoinCollect() {
    const oscillator1 = this.audioContext.createOscillator();
    const oscillator2 = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator1.type = 'square';
    oscillator2.type = 'square';

    oscillator1.frequency.value = 987.77; // B5
    oscillator2.frequency.value = 1318.51; // E6

    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.3
    );

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator1.start();
    oscillator2.start(this.audioContext.currentTime + 0.1);
    oscillator1.stop(this.audioContext.currentTime + 0.1);
    oscillator2.stop(this.audioContext.currentTime + 0.3);
  }

  // 爆炸音效
  playExplosion() {
    const noise = this.createNoiseBuffer(0.5);
    const source = this.audioContext.createBufferSource();
    source.buffer = noise;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(
      20,
      this.audioContext.currentTime + 0.5
    );

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.5
    );

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start();
  }

  // 创建白噪声缓冲区
  createNoiseBuffer(duration) {
    const sampleRate = this.audioContext.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  // 激光音效
  playLaser() {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(1500, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      100,
      this.audioContext.currentTime + 0.15
    );

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.15
    );

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  // 播放音符
  playNote(note, duration = 0.5) {
    const frequencies = {
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
      G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25
    };

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequencies[note] || 440;

    // ADSR 包络
    const now = this.audioContext.currentTime;
    const attack = 0.02;
    const decay = 0.1;
    const sustain = 0.7;
    const release = 0.3;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.5, now + attack);
    gainNode.gain.linearRampToValueAtTime(0.5 * sustain, now + attack + decay);
    gainNode.gain.setValueAtTime(0.5 * sustain, now + duration - release);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }
}

// 使用示例
const sfx = new SoundEffects();

// 绑定按钮
document.getElementById('beep').addEventListener('click', () => sfx.playBeep());
document.getElementById('jump').addEventListener('click', () => sfx.playJump());
document.getElementById('coin').addEventListener('click', () => sfx.playCoinCollect());
document.getElementById('explosion').addEventListener('click', () => sfx.playExplosion());
document.getElementById('laser').addEventListener('click', () => sfx.playLaser());
```

### 音频滤波器效果

```javascript
class AudioEffectsProcessor {
  constructor() {
    this.audioContext = new AudioContext();
    this.source = null;
    this.effectsChain = [];
  }

  // 创建低通滤波器
  createLowpassFilter(frequency = 1000, Q = 1) {
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    return filter;
  }

  // 创建高通滤波器
  createHighpassFilter(frequency = 500, Q = 1) {
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    return filter;
  }

  // 创建延迟效果
  createDelay(delayTime = 0.5, feedback = 0.5) {
    const delay = this.audioContext.createDelay(5);
    const feedbackGain = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();

    delay.delayTime.value = delayTime;
    feedbackGain.gain.value = feedback;
    wetGain.gain.value = 0.5;
    dryGain.gain.value = 0.5;

    // 连接反馈回路
    delay.connect(feedbackGain);
    feedbackGain.connect(delay);

    return { delay, feedbackGain, wetGain, dryGain };
  }

  // 创建混响效果（使用卷积）
  async createReverb(impulseResponseUrl) {
    const convolver = this.audioContext.createConvolver();

    try {
      const response = await fetch(impulseResponseUrl);
      const arrayBuffer = await response.arrayBuffer();
      convolver.buffer = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('加载脉冲响应失败:', error);
      // 创建简单的合成混响作为备选
      convolver.buffer = this.createSyntheticImpulseResponse(2);
    }

    return convolver;
  }

  // 创建合成脉冲响应
  createSyntheticImpulseResponse(duration) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.exp(-3 * i / length);
      }
    }

    return impulse;
  }

  // 创建失真效果
  createDistortion(amount = 50) {
    const distortion = this.audioContext.createWaveShaper();
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }

    distortion.curve = curve;
    distortion.oversample = '4x';
    return distortion;
  }

  // 创建压缩器
  createCompressor() {
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    return compressor;
  }

  // 创建立体声增强
  createStereoWidener(width = 1.5) {
    const splitter = this.audioContext.createChannelSplitter(2);
    const merger = this.audioContext.createChannelMerger(2);
    const leftGain = this.audioContext.createGain();
    const rightGain = this.audioContext.createGain();
    const leftInvert = this.audioContext.createGain();
    const rightInvert = this.audioContext.createGain();

    // 设置增益值来扩展立体声场
    const mono = 1 - width;
    leftGain.gain.value = 1;
    rightGain.gain.value = 1;
    leftInvert.gain.value = mono;
    rightInvert.gain.value = mono;

    splitter.connect(leftGain, 0);
    splitter.connect(rightGain, 1);
    splitter.connect(rightInvert, 1);
    splitter.connect(leftInvert, 0);

    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 1);
    leftInvert.connect(merger, 0, 1);
    rightInvert.connect(merger, 0, 0);

    return { input: splitter, output: merger };
  }
}

// 使用示例
const processor = new AudioEffectsProcessor();

// 创建效果链
async function setupEffectsChain(audioElement) {
  const ctx = processor.audioContext;
  const source = ctx.createMediaElementSource(audioElement);

  // 创建各种效果
  const lowpass = processor.createLowpassFilter(2000);
  const delay = processor.createDelay(0.3, 0.4);
  const reverb = await processor.createReverb('/audio/impulse.wav');
  const compressor = processor.createCompressor();

  // 连接效果链
  source.connect(lowpass);
  lowpass.connect(delay.delay);
  lowpass.connect(delay.dryGain);
  delay.delay.connect(delay.wetGain);
  delay.dryGain.connect(reverb);
  delay.wetGain.connect(reverb);
  reverb.connect(compressor);
  compressor.connect(ctx.destination);
}
```

### 3D 空间音效

```javascript
class SpatialAudio {
  constructor() {
    this.audioContext = new AudioContext();
    this.listener = this.audioContext.listener;

    // 设置听者位置（通常是玩家/相机位置）
    this.setListenerPosition(0, 0, 0);
    this.setListenerOrientation(0, 0, -1, 0, 1, 0);
  }

  // 设置听者位置
  setListenerPosition(x, y, z) {
    if (this.listener.positionX) {
      this.listener.positionX.value = x;
      this.listener.positionY.value = y;
      this.listener.positionZ.value = z;
    } else {
      // 旧版 API
      this.listener.setPosition(x, y, z);
    }
  }

  // 设置听者朝向
  setListenerOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ) {
    if (this.listener.forwardX) {
      this.listener.forwardX.value = forwardX;
      this.listener.forwardY.value = forwardY;
      this.listener.forwardZ.value = forwardZ;
      this.listener.upX.value = upX;
      this.listener.upY.value = upY;
      this.listener.upZ.value = upZ;
    } else {
      this.listener.setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ);
    }
  }

  // 创建空间音源
  createSpatialSource(audioBuffer, options = {}) {
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = options.loop || false;

    const panner = this.audioContext.createPanner();

    // 配置 panner
    panner.panningModel = options.panningModel || 'HRTF';
    panner.distanceModel = options.distanceModel || 'inverse';
    panner.refDistance = options.refDistance || 1;
    panner.maxDistance = options.maxDistance || 10000;
    panner.rolloffFactor = options.rolloffFactor || 1;
    panner.coneInnerAngle = options.coneInnerAngle || 360;
    panner.coneOuterAngle = options.coneOuterAngle || 360;
    panner.coneOuterGain = options.coneOuterGain || 0;

    source.connect(panner);
    panner.connect(this.audioContext.destination);

    return { source, panner };
  }

  // 设置音源位置
  setSourcePosition(panner, x, y, z) {
    if (panner.positionX) {
      panner.positionX.value = x;
      panner.positionY.value = y;
      panner.positionZ.value = z;
    } else {
      panner.setPosition(x, y, z);
    }
  }

  // 创建环绕声音源
  createAmbientSound(audioBuffer, radius = 10) {
    const sounds = [];
    const positions = [
      { x: radius, y: 0, z: 0 },
      { x: -radius, y: 0, z: 0 },
      { x: 0, y: 0, z: radius },
      { x: 0, y: 0, z: -radius }
    ];

    positions.forEach(pos => {
      const { source, panner } = this.createSpatialSource(audioBuffer, { loop: true });
      this.setSourcePosition(panner, pos.x, pos.y, pos.z);
      sounds.push({ source, panner, position: pos });
    });

    return {
      play: () => sounds.forEach(s => s.source.start()),
      stop: () => sounds.forEach(s => s.source.stop()),
      sounds
    };
  }

  // 模拟移动的音源
  animateSourcePosition(panner, path, duration) {
    const startTime = this.audioContext.currentTime;

    const animate = () => {
      const elapsed = this.audioContext.currentTime - startTime;
      const progress = (elapsed % duration) / duration;
      const index = Math.floor(progress * path.length);
      const nextIndex = (index + 1) % path.length;
      const t = (progress * path.length) % 1;

      // 线性插值
      const x = path[index].x + (path[nextIndex].x - path[index].x) * t;
      const y = path[index].y + (path[nextIndex].y - path[index].y) * t;
      const z = path[index].z + (path[nextIndex].z - path[index].z) * t;

      this.setSourcePosition(panner, x, y, z);
      requestAnimationFrame(animate);
    };

    animate();
  }
}

// 使用示例
const spatial = new SpatialAudio();

// 加载音频
async function setupSpatialDemo() {
  const response = await fetch('/audio/helicopter.mp3');
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await spatial.audioContext.decodeAudioData(arrayBuffer);

  const { source, panner } = spatial.createSpatialSource(audioBuffer, {
    loop: true,
    distanceModel: 'exponential',
    refDistance: 1,
    maxDistance: 100,
    rolloffFactor: 2
  });

  // 设置初始位置
  spatial.setSourcePosition(panner, 10, 0, 0);

  // 开始播放
  source.start();

  // 动画路径 - 绕圆圈移动
  const path = [];
  for (let i = 0; i < 360; i += 10) {
    const angle = (i * Math.PI) / 180;
    path.push({
      x: Math.cos(angle) * 10,
      y: 2,
      z: Math.sin(angle) * 10
    });
  }

  spatial.animateSourcePosition(panner, path, 10);
}
```

## 最佳实践

### 延迟创建 AudioContext

```javascript
// 不要在页面加载时立即创建
// const audioContext = new AudioContext(); // 避免

// 推荐：在用户交互时创建或恢复
let audioContext;

function initAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
  } else if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

document.getElementById('playButton').addEventListener('click', () => {
  const ctx = initAudio();
  // 使用 ctx 播放音频
});
```

### 复用节点和缓冲区

```javascript
class AudioManager {
  constructor() {
    this.audioContext = null;
    this.bufferCache = new Map();
    this.nodePool = [];
  }

  // 缓存音频缓冲区
  async loadAndCache(name, url) {
    if (this.bufferCache.has(name)) {
      return this.bufferCache.get(name);
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.bufferCache.set(name, audioBuffer);
    return audioBuffer;
  }

  // 获取可复用的 GainNode
  getGainNode() {
    const available = this.nodePool.find(n => !n.inUse && n.type === 'gain');
    if (available) {
      available.inUse = true;
      return available.node;
    }

    const node = this.audioContext.createGain();
    this.nodePool.push({ node, type: 'gain', inUse: true });
    return node;
  }

  // 释放节点
  releaseNode(node) {
    const poolItem = this.nodePool.find(n => n.node === node);
    if (poolItem) {
      poolItem.inUse = false;
      node.disconnect();
    }
  }
}
```

### 正确处理音频上下文状态

```javascript
class SafeAudioPlayer {
  constructor() {
    this.audioContext = new AudioContext();
    this.setupStateHandling();
  }

  setupStateHandling() {
    // 监听状态变化
    this.audioContext.onstatechange = () => {
      console.log('AudioContext 状态:', this.audioContext.state);
    };

    // 处理页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.audioContext.suspend();
      } else {
        this.audioContext.resume();
      }
    });
  }

  async ensureRunning() {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async play(buffer) {
    await this.ensureRunning();
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start();
  }
}
```

### 预加载关键音频

```javascript
class AudioPreloader {
  constructor() {
    this.audioContext = new AudioContext();
    this.loadedSounds = new Map();
    this.loadingPromises = new Map();
  }

  // 预加载多个音频
  async preloadAll(soundList) {
    const promises = soundList.map(({ name, url }) =>
      this.preload(name, url)
    );
    await Promise.all(promises);
    console.log('所有音频预加载完成');
  }

  // 预加载单个音频（带去重）
  async preload(name, url) {
    if (this.loadedSounds.has(name)) {
      return this.loadedSounds.get(name);
    }

    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }

    const promise = this.loadAudio(url).then(buffer => {
      this.loadedSounds.set(name, buffer);
      this.loadingPromises.delete(name);
      return buffer;
    });

    this.loadingPromises.set(name, promise);
    return promise;
  }

  async loadAudio(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return this.audioContext.decodeAudioData(arrayBuffer);
  }

  // 获取已加载的音频
  getSound(name) {
    return this.loadedSounds.get(name);
  }
}

// 使用示例
const preloader = new AudioPreloader();

// 游戏开始前预加载
await preloader.preloadAll([
  { name: 'jump', url: '/sounds/jump.mp3' },
  { name: 'coin', url: '/sounds/coin.mp3' },
  { name: 'bgm', url: '/sounds/bgm.mp3' }
]);
```

## 常见陷阱

### 浏览器自动播放策略

```javascript
// 错误：直接播放音频
const ctx = new AudioContext();
const osc = ctx.createOscillator();
osc.connect(ctx.destination);
osc.start(); // 可能被浏览器阻止

// 正确：等待用户交互
document.addEventListener('click', async () => {
  const ctx = new AudioContext();

  // 检查并恢复状态
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const osc = ctx.createOscillator();
  osc.connect(ctx.destination);
  osc.start();
}, { once: true });
```

### BufferSourceNode 一次性使用

```javascript
// 错误：尝试重复使用 BufferSourceNode
const source = ctx.createBufferSource();
source.buffer = audioBuffer;
source.connect(ctx.destination);
source.start();
// source.start(); // 错误！已经开始过了

// 正确：每次播放创建新的 source
function playSound(buffer) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
  return source;
}

playSound(audioBuffer); // 第一次播放
playSound(audioBuffer); // 第二次播放
```

### 指数渐变到零的问题

```javascript
// 错误：指数渐变到 0
gainNode.gain.exponentialRampToValueAtTime(0, ctx.currentTime + 1);
// 会抛出错误，因为指数函数无法到达 0

// 正确：使用一个非常小的值代替
gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);

// 或者使用线性渐变
gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
```

### 忘记断开节点连接

```javascript
// 潜在内存泄漏
function playSound() {
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  // 播放结束后节点仍然存在
}

// 正确：播放结束后清理
function playSoundProperly() {
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.connect(gain);
  gain.connect(ctx.destination);

  source.onended = () => {
    source.disconnect();
    gain.disconnect();
  };

  source.start();
}
```

### 时间调度错误

```javascript
// 错误：使用 Date.now() 或 performance.now()
oscillator.start(performance.now() + 1000); // 错误！

// 正确：使用 audioContext.currentTime
oscillator.start(ctx.currentTime + 1); // 1 秒后开始

// 注意：currentTime 是从 AudioContext 创建时开始计算的秒数
console.log(ctx.currentTime); // 例如：2.345
```

### 音频解码失败处理

```javascript
// 不安全：未处理解码错误
const buffer = await ctx.decodeAudioData(arrayBuffer);

// 安全：处理可能的错误
try {
  const buffer = await ctx.decodeAudioData(arrayBuffer);
  return buffer;
} catch (error) {
  console.error('音频解码失败:', error);
  // 返回静音缓冲区作为备选
  return ctx.createBuffer(2, ctx.sampleRate, ctx.sampleRate);
}
```

## 性能考量

### 使用 AudioWorklet 处理复杂音频

```javascript
// audio-processor.js - AudioWorklet 处理器
class GainProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.gain = 1;

    this.port.onmessage = (event) => {
      if (event.data.gain !== undefined) {
        this.gain = event.data.gain;
      }
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    for (let channel = 0; channel < output.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      for (let i = 0; i < outputChannel.length; i++) {
        outputChannel[i] = inputChannel[i] * this.gain;
      }
    }

    return true; // 保持处理器活动
  }
}

registerProcessor('gain-processor', GainProcessor);

// 主线程使用
async function setupWorklet() {
  await ctx.audioWorklet.addModule('audio-processor.js');
  const workletNode = new AudioWorkletNode(ctx, 'gain-processor');

  // 发送消息到处理器
  workletNode.port.postMessage({ gain: 0.5 });

  source.connect(workletNode);
  workletNode.connect(ctx.destination);
}
```

### 离屏音频处理

```javascript
// 使用 OfflineAudioContext 进行预处理
async function processAudioOffline(buffer, effects) {
  const offline = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  const source = offline.createBufferSource();
  source.buffer = buffer;

  // 应用效果
  let currentNode = source;
  for (const effect of effects) {
    const effectNode = effect(offline);
    currentNode.connect(effectNode);
    currentNode = effectNode;
  }
  currentNode.connect(offline.destination);

  source.start();
  const renderedBuffer = await offline.startRendering();
  return renderedBuffer;
}

// 使用示例
const processedBuffer = await processAudioOffline(originalBuffer, [
  (ctx) => {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    return filter;
  },
  (ctx) => {
    const compressor = ctx.createDynamicsCompressor();
    return compressor;
  }
]);
```

### 减少垃圾回收压力

```javascript
class OptimizedVisualizer {
  constructor(analyser) {
    this.analyser = analyser;
    // 预分配数组，避免每帧创建新数组
    this.dataArray = new Uint8Array(analyser.frequencyBinCount);
    this.smoothedData = new Float32Array(analyser.frequencyBinCount);
  }

  update() {
    this.analyser.getByteFrequencyData(this.dataArray);

    // 就地平滑处理
    const smoothing = 0.8;
    for (let i = 0; i < this.dataArray.length; i++) {
      this.smoothedData[i] = this.smoothedData[i] * smoothing +
                            this.dataArray[i] * (1 - smoothing);
    }
  }
}
```

### 合理设置 FFT 大小

```javascript
// FFT 大小影响频率分辨率和性能
// 较小的 FFT = 更好的时间分辨率，更差的频率分辨率
// 较大的 FFT = 更好的频率分辨率，更差的时间分辨率

// 用于快节奏可视化（如游戏）
analyser.fftSize = 256; // frequencyBinCount = 128

// 用于音乐频谱分析
analyser.fftSize = 2048; // frequencyBinCount = 1024

// 用于精确频率检测
analyser.fftSize = 8192; // frequencyBinCount = 4096
```

### 批量调度音频事件

```javascript
// 低效：频繁调用
for (let i = 0; i < 100; i++) {
  gainNode.gain.setValueAtTime(
    values[i],
    ctx.currentTime + i * 0.01
  );
}

// 高效：使用 setValueCurveAtTime
const curve = new Float32Array(values);
gainNode.gain.setValueCurveAtTime(curve, ctx.currentTime, 1);
```

## 实战场景

### 场景一：音乐播放器均衡器

```javascript
class AudioEqualizer {
  constructor(audioElement) {
    this.audioContext = new AudioContext();
    this.source = this.audioContext.createMediaElementSource(audioElement);

    // 定义频段
    this.bands = [
      { frequency: 60, type: 'lowshelf' },
      { frequency: 170, type: 'peaking' },
      { frequency: 350, type: 'peaking' },
      { frequency: 1000, type: 'peaking' },
      { frequency: 3500, type: 'peaking' },
      { frequency: 10000, type: 'highshelf' }
    ];

    this.filters = this.createFilters();
    this.connectFilters();
  }

  createFilters() {
    return this.bands.map(band => {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.frequency;
      filter.Q.value = 1;
      filter.gain.value = 0;
      return filter;
    });
  }

  connectFilters() {
    let currentNode = this.source;
    this.filters.forEach(filter => {
      currentNode.connect(filter);
      currentNode = filter;
    });
    currentNode.connect(this.audioContext.destination);
  }

  // 设置某个频段的增益（-12 到 12 dB）
  setBandGain(index, gain) {
    if (index >= 0 && index < this.filters.length) {
      this.filters[index].gain.value = Math.max(-12, Math.min(12, gain));
    }
  }

  // 预设：流行音乐
  presetPop() {
    const gains = [-2, 4, 6, 4, -2, -4];
    gains.forEach((gain, i) => this.setBandGain(i, gain));
  }

  // 预设：摇滚
  presetRock() {
    const gains = [4, 2, -2, 2, 4, 4];
    gains.forEach((gain, i) => this.setBandGain(i, gain));
  }

  // 预设：古典
  presetClassical() {
    const gains = [0, 0, 0, 0, -4, -6];
    gains.forEach((gain, i) => this.setBandGain(i, gain));
  }

  // 重置为平坦响应
  reset() {
    this.filters.forEach(filter => {
      filter.gain.value = 0;
    });
  }
}

// 使用示例
const audio = document.getElementById('audio');
const eq = new AudioEqualizer(audio);

// 应用预设
document.getElementById('pop').addEventListener('click', () => eq.presetPop());
document.getElementById('rock').addEventListener('click', () => eq.presetRock());
document.getElementById('reset').addEventListener('click', () => eq.reset());

// 手动调节
document.querySelectorAll('.eq-slider').forEach((slider, index) => {
  slider.addEventListener('input', (e) => {
    eq.setBandGain(index, parseFloat(e.target.value));
  });
});
```

### 场景二：游戏音频系统

```javascript
class GameAudioSystem {
  constructor() {
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.musicGain = this.audioContext.createGain();
    this.sfxGain = this.audioContext.createGain();

    this.masterGain.connect(this.audioContext.destination);
    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);

    this.sounds = new Map();
    this.currentMusic = null;
  }

  // 预加载音效
  async loadSound(name, url, options = {}) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.sounds.set(name, {
      buffer: audioBuffer,
      isMusic: options.isMusic || false,
      volume: options.volume || 1
    });
  }

  // 批量预加载
  async preloadSounds(soundList) {
    await Promise.all(
      soundList.map(sound => this.loadSound(sound.name, sound.url, sound.options))
    );
  }

  // 播放音效
  playSfx(name, options = {}) {
    const sound = this.sounds.get(name);
    if (!sound || sound.isMusic) return null;

    const source = this.audioContext.createBufferSource();
    source.buffer = sound.buffer;

    const gain = this.audioContext.createGain();
    gain.gain.value = (options.volume || 1) * sound.volume;

    source.connect(gain);
    gain.connect(this.sfxGain);

    // 变调
    if (options.pitch) {
      source.playbackRate.value = options.pitch;
    }

    // 随机变调（用于多样性）
    if (options.randomPitch) {
      const variation = options.randomPitch;
      source.playbackRate.value = 1 + (Math.random() - 0.5) * variation;
    }

    source.start(options.delay ? this.audioContext.currentTime + options.delay : 0);

    return source;
  }

  // 播放背景音乐
  playMusic(name, options = {}) {
    const sound = this.sounds.get(name);
    if (!sound || !sound.isMusic) return;

    // 停止当前音乐
    if (this.currentMusic) {
      this.stopMusic(options.crossfade || 0);
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = sound.buffer;
    source.loop = options.loop !== false;

    const gain = this.audioContext.createGain();

    // 淡入
    if (options.crossfade) {
      gain.gain.setValueAtTime(0, this.audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(
        sound.volume,
        this.audioContext.currentTime + options.crossfade
      );
    } else {
      gain.gain.value = sound.volume;
    }

    source.connect(gain);
    gain.connect(this.musicGain);
    source.start();

    this.currentMusic = { source, gain };
  }

  // 停止音乐
  stopMusic(fadeOut = 0) {
    if (!this.currentMusic) return;

    const { source, gain } = this.currentMusic;

    if (fadeOut > 0) {
      gain.gain.linearRampToValueAtTime(
        0,
        this.audioContext.currentTime + fadeOut
      );
      source.stop(this.audioContext.currentTime + fadeOut);
    } else {
      source.stop();
    }

    this.currentMusic = null;
  }

  // 设置主音量
  setMasterVolume(value) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, value));
  }

  // 设置音乐音量
  setMusicVolume(value) {
    this.musicGain.gain.value = Math.max(0, Math.min(1, value));
  }

  // 设置音效音量
  setSfxVolume(value) {
    this.sfxGain.gain.value = Math.max(0, Math.min(1, value));
  }

  // 暂停所有音频
  suspend() {
    this.audioContext.suspend();
  }

  // 恢复音频
  resume() {
    this.audioContext.resume();
  }
}

// 使用示例
const gameAudio = new GameAudioSystem();

// 预加载
await gameAudio.preloadSounds([
  { name: 'jump', url: '/sounds/jump.wav', options: { volume: 0.8 } },
  { name: 'coin', url: '/sounds/coin.wav', options: { volume: 0.6 } },
  { name: 'explosion', url: '/sounds/explosion.wav', options: { volume: 1 } },
  { name: 'bgm', url: '/sounds/bgm.mp3', options: { isMusic: true, volume: 0.5 } }
]);

// 播放背景音乐
gameAudio.playMusic('bgm', { crossfade: 2 });

// 播放音效
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    gameAudio.playSfx('jump', { randomPitch: 0.1 });
  }
});
```

### 场景三：语音聊天音频处理

```javascript
class VoiceChatProcessor {
  constructor() {
    this.audioContext = new AudioContext();
    this.stream = null;
    this.sourceNode = null;
    this.processingChain = null;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
      this.setupProcessingChain();

      console.log('语音捕获已启动');
    } catch (error) {
      console.error('无法访问麦克风:', error);
      throw error;
    }
  }

  setupProcessingChain() {
    // 高通滤波器 - 去除低频噪音
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 80;

    // 低通滤波器 - 去除高频噪音
    const lowpass = this.audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 12000;

    // 压缩器 - 平衡音量
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // 增益控制
    const gain = this.audioContext.createGain();
    gain.gain.value = 1;

    // 分析器 - 用于音量显示
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 256;

    // 连接处理链
    this.sourceNode.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(compressor);
    compressor.connect(gain);
    gain.connect(analyser);

    this.processingChain = {
      highpass,
      lowpass,
      compressor,
      gain,
      analyser
    };
  }

  // 获取处理后的音频流
  getProcessedStream() {
    const destination = this.audioContext.createMediaStreamDestination();
    this.processingChain.gain.connect(destination);
    return destination.stream;
  }

  // 获取当前音量级别
  getVolumeLevel() {
    const analyser = this.processingChain.analyser;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length / 255;
  }

  // 设置增益
  setGain(value) {
    this.processingChain.gain.gain.value = value;
  }

  // 静音/取消静音
  setMuted(muted) {
    this.processingChain.gain.gain.value = muted ? 0 : 1;
  }

  // 停止
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
  }
}

// 使用示例
const voiceChat = new VoiceChatProcessor();
await voiceChat.start();

// 获取处理后的流用于 WebRTC
const processedStream = voiceChat.getProcessedStream();

// 音量指示器更新
setInterval(() => {
  const level = voiceChat.getVolumeLevel();
  document.getElementById('volume-meter').style.width = `${level * 100}%`;
}, 50);

// 静音按钮
document.getElementById('mute').addEventListener('click', () => {
  voiceChat.setMuted(true);
});
```

## 面试要点

### Web Audio API 的基本架构是什么？

**答**：Web Audio API 基于音频图（Audio Graph）模型，由以下核心组件构成：
- **AudioContext**：音频上下文，管理整个音频系统
- **音频节点（AudioNode）**：包括源节点、处理节点和目标节点
- **AudioParam**：用于控制节点参数，支持自动化调度
- **AudioBuffer**：存储解码后的音频数据

音频数据从源节点流向目标节点，中间可以经过任意数量的处理节点。

### 如何处理浏览器的自动播放策略？

**答**：现代浏览器要求用户交互后才能播放音频。解决方案：
```javascript
// 在用户交互时恢复 AudioContext
document.addEventListener('click', async () => {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
});

// 或者延迟创建 AudioContext 到用户交互时
```

### BufferSourceNode 为什么只能使用一次？

**答**：这是 Web Audio API 的设计决策。BufferSourceNode 是一次性使用的，因为：
- 保持 API 的简单性
- 避免状态管理的复杂性
- 允许浏览器优化内存使用

解决方案是每次播放时创建新的 BufferSourceNode，但复用 AudioBuffer。

### AudioParam 的调度方法有哪些？它们的区别是什么？

**答**：
- `setValueAtTime(value, time)`：在指定时间设置精确值
- `linearRampToValueAtTime(value, time)`：线性过渡到目标值
- `exponentialRampToValueAtTime(value, time)`：指数过渡（不能到 0）
- `setTargetAtTime(target, startTime, timeConstant)`：指数衰减
- `setValueCurveAtTime(values, startTime, duration)`：按曲线变化

### 如何实现音频可视化？

**答**：使用 AnalyserNode：
```javascript
const analyser = ctx.createAnalyser();
analyser.fftSize = 2048;

// 获取频域数据
const dataArray = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(dataArray);

// 获取时域数据
analyser.getByteTimeDomainData(dataArray);

// 在 Canvas 上绑制
```

### 什么是 AudioWorklet？它与 ScriptProcessorNode 有什么区别？

**答**：AudioWorklet 是处理自定义音频的现代方式：
- 运行在独立的音频渲染线程
- 不会阻塞主线程
- 更低的延迟和更好的性能
- ScriptProcessorNode 已被废弃，因为它在主线程运行，可能导致音频故障

### 如何实现 3D 空间音效？

**答**：使用 PannerNode 和 AudioListener：
```javascript
// 设置听者位置和朝向
ctx.listener.setPosition(x, y, z);
ctx.listener.setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ);

// 创建 3D 音源
const panner = ctx.createPanner();
panner.panningModel = 'HRTF'; // 头部相关传输函数
panner.setPosition(sourceX, sourceY, sourceZ);
```

## 延伸阅读

### 官方文档
- [MDN Web Audio API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Audio_API)
- [W3C Web Audio API 规范](https://www.w3.org/TR/webaudio/)

### 教程与指南
- [Web Audio API 入门指南](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Audio_API/Using_Web_Audio_API)
- [高级技术：创建和序列化音频](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques)

### 工具与库
- [Tone.js](https://tonejs.github.io/) - 功能丰富的 Web Audio 框架
- [Howler.js](https://howlerjs.com/) - 简化的音频库
- [Pizzicato.js](https://alemangui.github.io/pizzicato/) - 简单的音效和声音合成

### 相关项目
- [Chrome Music Lab](https://musiclab.chromeexperiments.com/) - Google 的音乐实验项目
- [Wavesurfer.js](https://wavesurfer-js.org/) - 音频波形可视化
- [p5.sound](https://p5js.org/reference/#/libraries/p5.sound) - p5.js 的音频库
