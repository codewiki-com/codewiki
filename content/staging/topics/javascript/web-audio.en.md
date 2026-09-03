---
title: JavaScript Web Audio API In-Depth Guide
description: "Deep dive into Web Audio API: AudioContext, audio nodes, audio visualization, and real-time audio processing"
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - Web Audio
  - audio-processing
  - visualization
  - AudioContext
status: imported
origin: old/src/content/docs/javascript/web-audio.en.md
divergence: 0.203
issues: []
legacy:
  category: JavaScript
  subcategory: Web API
  order: 50
  lastUpdated: 2026-01-07
---

## Concept Explanation

The Web Audio API is a powerful set of JavaScript APIs for processing and synthesizing audio in web pages. It provides a modular audio routing system that allows developers to create complex audio applications, including music players, game sound effects, real-time audio processing, and audio visualization.

### Historical Background

Before the Web Audio API, web audio processing mainly relied on the `<audio>` element, which had very limited functionality. In 2011, Google Chrome was the first to implement the Web Audio API, and other browsers followed suit. The API was standardized by the W3C and is now supported by all major browsers.

### Problems It Solves

- **Precise Timing Control**: Provides sub-millisecond audio scheduling precision
- **Audio Synthesis**: Supports generating sound waveforms from scratch
- **Real-time Processing**: Allows real-time effects processing on audio streams
- **Spatial Audio**: Supports 3D audio positioning and surround sound
- **Audio Analysis**: Provides frequency spectrum and time-domain analysis capabilities

## Core Principles

### Audio Graph Model

The Web Audio API is based on an audio graph model where audio data flows from source nodes to destination nodes, passing through any number of processing nodes in between.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Source    │───▶│  Processing │───▶│  Processing │───▶│ Destination │
│   (Source)  │    │   (Effects) │    │  (Analyzer) │    │(Destination)│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### AudioContext Lifecycle

AudioContext is the core of the Web Audio API, managing the lifecycle of the entire audio graph.

```javascript
// Create AudioContext
const audioContext = new AudioContext();

// State check
console.log(audioContext.state); // 'suspended', 'running', or 'closed'

// Due to browser autoplay policies, usually need to resume after user interaction
document.addEventListener('click', async () => {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
    console.log('AudioContext resumed');
  }
});

// Close AudioContext
// audioContext.close();
```

### Time Model

The Web Audio API uses a high-precision time system. `audioContext.currentTime` provides precise time (in seconds) since the AudioContext was created.

```javascript
const audioContext = new AudioContext();

// Get current audio context time
console.log(audioContext.currentTime); // e.g., 0.023

// Schedule future audio events
const oscillator = audioContext.createOscillator();
oscillator.connect(audioContext.destination);

// Start playing 1 second later
oscillator.start(audioContext.currentTime + 1);
// Stop playing 3 seconds later
oscillator.stop(audioContext.currentTime + 3);
```

## Core Concepts

### Audio Node Types

The Web Audio API provides various types of audio nodes:

| Node Type | Description | Creation Method |
|-----------|-------------|-----------------|
| OscillatorNode | Generates periodic waveforms | `createOscillator()` |
| AudioBufferSourceNode | Plays audio data from memory | `createBufferSource()` |
| MediaElementAudioSourceNode | Gets audio from `<audio>` or `<video>` | `createMediaElementSource()` |
| MediaStreamAudioSourceNode | Gets audio stream from microphone, etc. | `createMediaStreamSource()` |
| GainNode | Controls volume | `createGain()` |
| BiquadFilterNode | Various filter effects | `createBiquadFilter()` |
| DelayNode | Delay effect | `createDelay()` |
| ConvolverNode | Convolution reverb effect | `createConvolver()` |
| DynamicsCompressorNode | Dynamic compression | `createDynamicsCompressor()` |
| AnalyserNode | Audio analysis (visualization) | `createAnalyser()` |
| PannerNode | 3D spatial positioning | `createPanner()` |
| StereoPannerNode | Stereo panning | `createStereoPanner()` |

### Connecting and Disconnecting

```javascript
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();

// Connect nodes
oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);

// Disconnect
// oscillator.disconnect();
// oscillator.disconnect(gainNode); // Disconnect specific connection
```

### Parameter Automation

AudioParam supports precise parameter scheduling:

```javascript
const gainNode = audioContext.createGain();

// Set immediate value
gainNode.gain.value = 0.5;

// Set value at specified time
gainNode.gain.setValueAtTime(1, audioContext.currentTime + 1);

// Linear ramp to target value
gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 2);

// Exponential ramp to target value
gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);

// Exponential decay to target value
gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.5); // timeConstant = 0.5

// Set value curve
const curve = new Float32Array([0, 0.5, 1, 0.8, 0]);
gainNode.gain.setValueCurveAtTime(curve, audioContext.currentTime, 2);
```

## Code Examples

### Basic Example: Creating a Simple Tone

```javascript
// Create AudioContext
const audioContext = new AudioContext();

// Create oscillator (sound source)
const oscillator = audioContext.createOscillator();
oscillator.type = 'sine'; // Waveform type: sine, square, sawtooth, triangle
oscillator.frequency.value = 440; // Frequency 440Hz (A4 note)

// Create volume control node
const gainNode = audioContext.createGain();
gainNode.gain.value = 0.3; // Volume 30%

// Connect nodes: oscillator -> gain -> speakers
oscillator.connect(gainNode);
gainNode.connect(audioContext.destination);

// Start playing
oscillator.start();

// Stop after 2 seconds
oscillator.stop(audioContext.currentTime + 2);
```

### Loading and Playing Audio Files

```javascript
class AudioPlayer {
  constructor() {
    this.audioContext = new AudioContext();
    this.audioBuffer = null;
    this.sourceNode = null;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  // Load audio file
  async loadAudio(url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log('Audio loaded successfully');
      console.log('Duration:', this.audioBuffer.duration, 'seconds');
      console.log('Sample rate:', this.audioBuffer.sampleRate, 'Hz');
      console.log('Number of channels:', this.audioBuffer.numberOfChannels);
    } catch (error) {
      console.error('Audio loading failed:', error);
    }
  }

  // Play audio
  play(startTime = 0) {
    if (!this.audioBuffer) {
      console.error('Please load audio first');
      return;
    }

    // Ensure AudioContext is running
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Create new BufferSourceNode (single-use)
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode);

    // Start playback from specified position
    this.sourceNode.start(0, startTime);

    // Playback ended event
    this.sourceNode.onended = () => {
      console.log('Playback ended');
    };
  }

  // Stop playback
  stop() {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode = null;
    }
  }

  // Set volume
  setVolume(value) {
    this.gainNode.gain.value = Math.max(0, Math.min(1, value));
  }

  // Fade in effect
  fadeIn(duration = 1) {
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(
      1,
      this.audioContext.currentTime + duration
    );
  }

  // Fade out effect
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

// Usage example
const player = new AudioPlayer();
await player.loadAudio('/audio/music.mp3');
player.fadeIn(0.5);
player.play();
```

### Audio Visualization

```javascript
class AudioVisualizer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();

    // Configure analyser
    this.analyser.fftSize = 2048; // FFT size, must be power of 2
    this.analyser.smoothingTimeConstant = 0.8; // Smoothing coefficient

    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    this.isRunning = false;
  }

  // Connect audio source
  connectSource(sourceNode) {
    sourceNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  // Get audio from microphone
  async connectMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(stream);
      source.connect(this.analyser);
      // Note: microphone usually not connected to destination to avoid echo
      console.log('Microphone connected');
    } catch (error) {
      console.error('Cannot access microphone:', error);
    }
  }

  // Get audio from audio element
  connectAudioElement(audioElement) {
    const source = this.audioContext.createMediaElementSource(audioElement);
    this.connectSource(source);
  }

  // Draw waveform
  drawWaveform() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.drawWaveform());

    // Get time-domain data
    this.analyser.getByteTimeDomainData(this.dataArray);

    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw waveform
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

  // Draw frequency spectrum bars
  drawFrequencyBars() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.drawFrequencyBars());

    // Get frequency-domain data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const barCount = 64; // Number of frequency bars to display
    const barWidth = this.canvas.width / barCount;
    const step = Math.floor(this.bufferLength / barCount);

    for (let i = 0; i < barCount; i++) {
      const value = this.dataArray[i * step];
      const percent = value / 255;
      const barHeight = this.canvas.height * percent;

      // Set color based on height
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

  // Draw circular spectrum
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

// Usage example
const canvas = document.getElementById('visualizer');
const visualizer = new AudioVisualizer(canvas);

// Connect audio element
const audio = document.getElementById('audio');
visualizer.connectAudioElement(audio);
visualizer.start('bars');
audio.play();
```

### Creating Sound Effects

```javascript
class SoundEffects {
  constructor() {
    this.audioContext = new AudioContext();
  }

  // Play simple beep
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

  // Game jump sound effect
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

  // Coin collect sound effect
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

  // Explosion sound effect
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

  // Create white noise buffer
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

  // Laser sound effect
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

  // Play musical note
  playNote(note, duration = 0.5) {
    const frequencies = {
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
      G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25
    };

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequencies[note] || 440;

    // ADSR envelope
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

// Usage example
const sfx = new SoundEffects();

// Bind buttons
document.getElementById('beep').addEventListener('click', () => sfx.playBeep());
document.getElementById('jump').addEventListener('click', () => sfx.playJump());
document.getElementById('coin').addEventListener('click', () => sfx.playCoinCollect());
document.getElementById('explosion').addEventListener('click', () => sfx.playExplosion());
document.getElementById('laser').addEventListener('click', () => sfx.playLaser());
```

### Audio Filter Effects

```javascript
class AudioEffectsProcessor {
  constructor() {
    this.audioContext = new AudioContext();
    this.source = null;
    this.effectsChain = [];
  }

  // Create lowpass filter
  createLowpassFilter(frequency = 1000, Q = 1) {
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    return filter;
  }

  // Create highpass filter
  createHighpassFilter(frequency = 500, Q = 1) {
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    return filter;
  }

  // Create delay effect
  createDelay(delayTime = 0.5, feedback = 0.5) {
    const delay = this.audioContext.createDelay(5);
    const feedbackGain = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();

    delay.delayTime.value = delayTime;
    feedbackGain.gain.value = feedback;
    wetGain.gain.value = 0.5;
    dryGain.gain.value = 0.5;

    // Connect feedback loop
    delay.connect(feedbackGain);
    feedbackGain.connect(delay);

    return { delay, feedbackGain, wetGain, dryGain };
  }

  // Create reverb effect (using convolution)
  async createReverb(impulseResponseUrl) {
    const convolver = this.audioContext.createConvolver();

    try {
      const response = await fetch(impulseResponseUrl);
      const arrayBuffer = await response.arrayBuffer();
      convolver.buffer = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('Failed to load impulse response:', error);
      // Create simple synthetic reverb as fallback
      convolver.buffer = this.createSyntheticImpulseResponse(2);
    }

    return convolver;
  }

  // Create synthetic impulse response
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

  // Create distortion effect
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

  // Create compressor
  createCompressor() {
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    return compressor;
  }

  // Create stereo widener
  createStereoWidener(width = 1.5) {
    const splitter = this.audioContext.createChannelSplitter(2);
    const merger = this.audioContext.createChannelMerger(2);
    const leftGain = this.audioContext.createGain();
    const rightGain = this.audioContext.createGain();
    const leftInvert = this.audioContext.createGain();
    const rightInvert = this.audioContext.createGain();

    // Set gain values to expand stereo field
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

// Usage example
const processor = new AudioEffectsProcessor();

// Create effects chain
async function setupEffectsChain(audioElement) {
  const ctx = processor.audioContext;
  const source = ctx.createMediaElementSource(audioElement);

  // Create various effects
  const lowpass = processor.createLowpassFilter(2000);
  const delay = processor.createDelay(0.3, 0.4);
  const reverb = await processor.createReverb('/audio/impulse.wav');
  const compressor = processor.createCompressor();

  // Connect effects chain
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

### 3D Spatial Audio

```javascript
class SpatialAudio {
  constructor() {
    this.audioContext = new AudioContext();
    this.listener = this.audioContext.listener;

    // Set listener position (usually player/camera position)
    this.setListenerPosition(0, 0, 0);
    this.setListenerOrientation(0, 0, -1, 0, 1, 0);
  }

  // Set listener position
  setListenerPosition(x, y, z) {
    if (this.listener.positionX) {
      this.listener.positionX.value = x;
      this.listener.positionY.value = y;
      this.listener.positionZ.value = z;
    } else {
      // Legacy API
      this.listener.setPosition(x, y, z);
    }
  }

  // Set listener orientation
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

  // Create spatial audio source
  createSpatialSource(audioBuffer, options = {}) {
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = options.loop || false;

    const panner = this.audioContext.createPanner();

    // Configure panner
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

  // Set source position
  setSourcePosition(panner, x, y, z) {
    if (panner.positionX) {
      panner.positionX.value = x;
      panner.positionY.value = y;
      panner.positionZ.value = z;
    } else {
      panner.setPosition(x, y, z);
    }
  }

  // Create ambient surround sound
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

  // Animate moving sound source
  animateSourcePosition(panner, path, duration) {
    const startTime = this.audioContext.currentTime;

    const animate = () => {
      const elapsed = this.audioContext.currentTime - startTime;
      const progress = (elapsed % duration) / duration;
      const index = Math.floor(progress * path.length);
      const nextIndex = (index + 1) % path.length;
      const t = (progress * path.length) % 1;

      // Linear interpolation
      const x = path[index].x + (path[nextIndex].x - path[index].x) * t;
      const y = path[index].y + (path[nextIndex].y - path[index].y) * t;
      const z = path[index].z + (path[nextIndex].z - path[index].z) * t;

      this.setSourcePosition(panner, x, y, z);
      requestAnimationFrame(animate);
    };

    animate();
  }
}

// Usage example
const spatial = new SpatialAudio();

// Load audio
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

  // Set initial position
  spatial.setSourcePosition(panner, 10, 0, 0);

  // Start playback
  source.start();

  // Animation path - moving in circle
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

## Best Practices

### Delay AudioContext Creation

```javascript
// Don't create immediately on page load
// const audioContext = new AudioContext(); // Avoid

// Recommended: Create or resume on user interaction
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
  // Use ctx to play audio
});
```

### Reuse Nodes and Buffers

```javascript
class AudioManager {
  constructor() {
    this.audioContext = null;
    this.bufferCache = new Map();
    this.nodePool = [];
  }

  // Cache audio buffers
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

  // Get reusable GainNode
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

  // Release node
  releaseNode(node) {
    const poolItem = this.nodePool.find(n => n.node === node);
    if (poolItem) {
      poolItem.inUse = false;
      node.disconnect();
    }
  }
}
```

### Properly Handle AudioContext State

```javascript
class SafeAudioPlayer {
  constructor() {
    this.audioContext = new AudioContext();
    this.setupStateHandling();
  }

  setupStateHandling() {
    // Monitor state changes
    this.audioContext.onstatechange = () => {
      console.log('AudioContext state:', this.audioContext.state);
    };

    // Handle page visibility changes
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

### Preload Critical Audio

```javascript
class AudioPreloader {
  constructor() {
    this.audioContext = new AudioContext();
    this.loadedSounds = new Map();
    this.loadingPromises = new Map();
  }

  // Preload multiple audio files
  async preloadAll(soundList) {
    const promises = soundList.map(({ name, url }) =>
      this.preload(name, url)
    );
    await Promise.all(promises);
    console.log('All audio preloaded');
  }

  // Preload single audio (with deduplication)
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

  // Get loaded audio
  getSound(name) {
    return this.loadedSounds.get(name);
  }
}

// Usage example
const preloader = new AudioPreloader();

// Preload before game starts
await preloader.preloadAll([
  { name: 'jump', url: '/sounds/jump.mp3' },
  { name: 'coin', url: '/sounds/coin.mp3' },
  { name: 'bgm', url: '/sounds/bgm.mp3' }
]);
```

## Common Pitfalls

### Browser Autoplay Policy

```javascript
// Wrong: Play audio directly
const ctx = new AudioContext();
const osc = ctx.createOscillator();
osc.connect(ctx.destination);
osc.start(); // May be blocked by browser

// Correct: Wait for user interaction
document.addEventListener('click', async () => {
  const ctx = new AudioContext();

  // Check and resume state
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const osc = ctx.createOscillator();
  osc.connect(ctx.destination);
  osc.start();
}, { once: true });
```

### BufferSourceNode is Single-Use

```javascript
// Wrong: Attempting to reuse BufferSourceNode
const source = ctx.createBufferSource();
source.buffer = audioBuffer;
source.connect(ctx.destination);
source.start();
// source.start(); // Error! Already started

// Correct: Create new source for each playback
function playSound(buffer) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
  return source;
}

playSound(audioBuffer); // First playback
playSound(audioBuffer); // Second playback
```

### Exponential Ramp to Zero Problem

```javascript
// Wrong: Exponential ramp to 0
gainNode.gain.exponentialRampToValueAtTime(0, ctx.currentTime + 1);
// Will throw error because exponential function cannot reach 0

// Correct: Use a very small value instead
gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);

// Or use linear ramp
gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
```

### Forgetting to Disconnect Nodes

```javascript
// Potential memory leak
function playSound() {
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  // Nodes still exist after playback ends
}

// Correct: Clean up after playback
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

### Time Scheduling Errors

```javascript
// Wrong: Using Date.now() or performance.now()
oscillator.start(performance.now() + 1000); // Wrong!

// Correct: Use audioContext.currentTime
oscillator.start(ctx.currentTime + 1); // Start 1 second later

// Note: currentTime is seconds since AudioContext was created
console.log(ctx.currentTime); // e.g., 2.345
```

### Audio Decode Error Handling

```javascript
// Unsafe: Not handling decode errors
const buffer = await ctx.decodeAudioData(arrayBuffer);

// Safe: Handle possible errors
try {
  const buffer = await ctx.decodeAudioData(arrayBuffer);
  return buffer;
} catch (error) {
  console.error('Audio decode failed:', error);
  // Return silent buffer as fallback
  return ctx.createBuffer(2, ctx.sampleRate, ctx.sampleRate);
}
```

## Performance Considerations

### Using AudioWorklet for Complex Audio Processing

```javascript
// audio-processor.js - AudioWorklet processor
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

    return true; // Keep processor active
  }
}

registerProcessor('gain-processor', GainProcessor);

// Main thread usage
async function setupWorklet() {
  await ctx.audioWorklet.addModule('audio-processor.js');
  const workletNode = new AudioWorkletNode(ctx, 'gain-processor');

  // Send message to processor
  workletNode.port.postMessage({ gain: 0.5 });

  source.connect(workletNode);
  workletNode.connect(ctx.destination);
}
```

### Offline Audio Processing

```javascript
// Use OfflineAudioContext for preprocessing
async function processAudioOffline(buffer, effects) {
  const offline = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  const source = offline.createBufferSource();
  source.buffer = buffer;

  // Apply effects
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

// Usage example
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

### Reduce Garbage Collection Pressure

```javascript
class OptimizedVisualizer {
  constructor(analyser) {
    this.analyser = analyser;
    // Pre-allocate arrays to avoid creating new arrays each frame
    this.dataArray = new Uint8Array(analyser.frequencyBinCount);
    this.smoothedData = new Float32Array(analyser.frequencyBinCount);
  }

  update() {
    this.analyser.getByteFrequencyData(this.dataArray);

    // In-place smoothing
    const smoothing = 0.8;
    for (let i = 0; i < this.dataArray.length; i++) {
      this.smoothedData[i] = this.smoothedData[i] * smoothing +
                            this.dataArray[i] * (1 - smoothing);
    }
  }
}
```

### Set FFT Size Appropriately

```javascript
// FFT size affects frequency resolution and performance
// Smaller FFT = better time resolution, worse frequency resolution
// Larger FFT = better frequency resolution, worse time resolution

// For fast-paced visualization (like games)
analyser.fftSize = 256; // frequencyBinCount = 128

// For music spectrum analysis
analyser.fftSize = 2048; // frequencyBinCount = 1024

// For precise frequency detection
analyser.fftSize = 8192; // frequencyBinCount = 4096
```

### Batch Schedule Audio Events

```javascript
// Inefficient: Frequent calls
for (let i = 0; i < 100; i++) {
  gainNode.gain.setValueAtTime(
    values[i],
    ctx.currentTime + i * 0.01
  );
}

// Efficient: Use setValueCurveAtTime
const curve = new Float32Array(values);
gainNode.gain.setValueCurveAtTime(curve, ctx.currentTime, 1);
```

## Real-World Scenarios

### Scenario 1: Music Player Equalizer

```javascript
class AudioEqualizer {
  constructor(audioElement) {
    this.audioContext = new AudioContext();
    this.source = this.audioContext.createMediaElementSource(audioElement);

    // Define frequency bands
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

  // Set band gain (-12 to 12 dB)
  setBandGain(index, gain) {
    if (index >= 0 && index < this.filters.length) {
      this.filters[index].gain.value = Math.max(-12, Math.min(12, gain));
    }
  }

  // Preset: Pop music
  presetPop() {
    const gains = [-2, 4, 6, 4, -2, -4];
    gains.forEach((gain, i) => this.setBandGain(i, gain));
  }

  // Preset: Rock
  presetRock() {
    const gains = [4, 2, -2, 2, 4, 4];
    gains.forEach((gain, i) => this.setBandGain(i, gain));
  }

  // Preset: Classical
  presetClassical() {
    const gains = [0, 0, 0, 0, -4, -6];
    gains.forEach((gain, i) => this.setBandGain(i, gain));
  }

  // Reset to flat response
  reset() {
    this.filters.forEach(filter => {
      filter.gain.value = 0;
    });
  }
}

// Usage example
const audio = document.getElementById('audio');
const eq = new AudioEqualizer(audio);

// Apply presets
document.getElementById('pop').addEventListener('click', () => eq.presetPop());
document.getElementById('rock').addEventListener('click', () => eq.presetRock());
document.getElementById('reset').addEventListener('click', () => eq.reset());

// Manual adjustment
document.querySelectorAll('.eq-slider').forEach((slider, index) => {
  slider.addEventListener('input', (e) => {
    eq.setBandGain(index, parseFloat(e.target.value));
  });
});
```

### Scenario 2: Game Audio System

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

  // Preload sound
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

  // Batch preload
  async preloadSounds(soundList) {
    await Promise.all(
      soundList.map(sound => this.loadSound(sound.name, sound.url, sound.options))
    );
  }

  // Play sound effect
  playSfx(name, options = {}) {
    const sound = this.sounds.get(name);
    if (!sound || sound.isMusic) return null;

    const source = this.audioContext.createBufferSource();
    source.buffer = sound.buffer;

    const gain = this.audioContext.createGain();
    gain.gain.value = (options.volume || 1) * sound.volume;

    source.connect(gain);
    gain.connect(this.sfxGain);

    // Pitch shift
    if (options.pitch) {
      source.playbackRate.value = options.pitch;
    }

    // Random pitch (for variety)
    if (options.randomPitch) {
      const variation = options.randomPitch;
      source.playbackRate.value = 1 + (Math.random() - 0.5) * variation;
    }

    source.start(options.delay ? this.audioContext.currentTime + options.delay : 0);

    return source;
  }

  // Play background music
  playMusic(name, options = {}) {
    const sound = this.sounds.get(name);
    if (!sound || !sound.isMusic) return;

    // Stop current music
    if (this.currentMusic) {
      this.stopMusic(options.crossfade || 0);
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = sound.buffer;
    source.loop = options.loop !== false;

    const gain = this.audioContext.createGain();

    // Fade in
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

  // Stop music
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

  // Set master volume
  setMasterVolume(value) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, value));
  }

  // Set music volume
  setMusicVolume(value) {
    this.musicGain.gain.value = Math.max(0, Math.min(1, value));
  }

  // Set SFX volume
  setSfxVolume(value) {
    this.sfxGain.gain.value = Math.max(0, Math.min(1, value));
  }

  // Pause all audio
  suspend() {
    this.audioContext.suspend();
  }

  // Resume audio
  resume() {
    this.audioContext.resume();
  }
}

// Usage example
const gameAudio = new GameAudioSystem();

// Preload
await gameAudio.preloadSounds([
  { name: 'jump', url: '/sounds/jump.wav', options: { volume: 0.8 } },
  { name: 'coin', url: '/sounds/coin.wav', options: { volume: 0.6 } },
  { name: 'explosion', url: '/sounds/explosion.wav', options: { volume: 1 } },
  { name: 'bgm', url: '/sounds/bgm.mp3', options: { isMusic: true, volume: 0.5 } }
]);

// Play background music
gameAudio.playMusic('bgm', { crossfade: 2 });

// Play sound effects
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    gameAudio.playSfx('jump', { randomPitch: 0.1 });
  }
});
```

### Scenario 3: Voice Chat Audio Processing

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

      console.log('Voice capture started');
    } catch (error) {
      console.error('Cannot access microphone:', error);
      throw error;
    }
  }

  setupProcessingChain() {
    // Highpass filter - remove low frequency noise
    const highpass = this.audioContext.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 80;

    // Lowpass filter - remove high frequency noise
    const lowpass = this.audioContext.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 12000;

    // Compressor - balance volume
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Gain control
    const gain = this.audioContext.createGain();
    gain.gain.value = 1;

    // Analyser - for volume display
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 256;

    // Connect processing chain
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

  // Get processed audio stream
  getProcessedStream() {
    const destination = this.audioContext.createMediaStreamDestination();
    this.processingChain.gain.connect(destination);
    return destination.stream;
  }

  // Get current volume level
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

  // Set gain
  setGain(value) {
    this.processingChain.gain.gain.value = value;
  }

  // Mute/unmute
  setMuted(muted) {
    this.processingChain.gain.gain.value = muted ? 0 : 1;
  }

  // Stop
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
  }
}

// Usage example
const voiceChat = new VoiceChatProcessor();
await voiceChat.start();

// Get processed stream for WebRTC
const processedStream = voiceChat.getProcessedStream();

// Volume indicator update
setInterval(() => {
  const level = voiceChat.getVolumeLevel();
  document.getElementById('volume-meter').style.width = `${level * 100}%`;
}, 50);

// Mute button
document.getElementById('mute').addEventListener('click', () => {
  voiceChat.setMuted(true);
});
```

## Interview Key Points

### What is the basic architecture of Web Audio API?

**Answer**: The Web Audio API is based on the Audio Graph model, consisting of the following core components:
- **AudioContext**: Audio context that manages the entire audio system
- **AudioNode**: Includes source nodes, processing nodes, and destination nodes
- **AudioParam**: Used for controlling node parameters, supports automated scheduling
- **AudioBuffer**: Stores decoded audio data

Audio data flows from source nodes to destination nodes, passing through any number of processing nodes in between.

### How to handle browser autoplay policies?

**Answer**: Modern browsers require user interaction before audio can play. Solutions:
```javascript
// Resume AudioContext on user interaction
document.addEventListener('click', async () => {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
});

// Or delay AudioContext creation until user interaction
```

### Why is BufferSourceNode single-use?

**Answer**: This is a design decision in Web Audio API. BufferSourceNode is single-use because:
- Keeps the API simple
- Avoids state management complexity
- Allows browsers to optimize memory usage

The solution is to create a new BufferSourceNode for each playback while reusing the AudioBuffer.

### What are the AudioParam scheduling methods? What are their differences?

**Answer**:
- `setValueAtTime(value, time)`: Set exact value at specified time
- `linearRampToValueAtTime(value, time)`: Linear transition to target value
- `exponentialRampToValueAtTime(value, time)`: Exponential transition (cannot reach 0)
- `setTargetAtTime(target, startTime, timeConstant)`: Exponential decay
- `setValueCurveAtTime(values, startTime, duration)`: Follow a curve

### How to implement audio visualization?

**Answer**: Use AnalyserNode:
```javascript
const analyser = ctx.createAnalyser();
analyser.fftSize = 2048;

// Get frequency data
const dataArray = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(dataArray);

// Get time-domain data
analyser.getByteTimeDomainData(dataArray);

// Draw on Canvas
```

### What is AudioWorklet? How does it differ from ScriptProcessorNode?

**Answer**: AudioWorklet is the modern way to process custom audio:
- Runs in a separate audio rendering thread
- Doesn't block the main thread
- Lower latency and better performance
- ScriptProcessorNode is deprecated because it runs on the main thread and can cause audio glitches

### How to implement 3D spatial audio?

**Answer**: Use PannerNode and AudioListener:
```javascript
// Set listener position and orientation
ctx.listener.setPosition(x, y, z);
ctx.listener.setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ);

// Create 3D sound source
const panner = ctx.createPanner();
panner.panningModel = 'HRTF'; // Head-related transfer function
panner.setPosition(sourceX, sourceY, sourceZ);
```

## Further Reading

### Official Documentation
- [MDN Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [W3C Web Audio API Specification](https://www.w3.org/TR/webaudio/)

### Tutorials and Guides
- [Web Audio API Getting Started Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API)
- [Advanced Techniques: Creating and Sequencing Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques)

### Tools and Libraries
- [Tone.js](https://tonejs.github.io/) - Feature-rich Web Audio framework
- [Howler.js](https://howlerjs.com/) - Simplified audio library
- [Pizzicato.js](https://alemangui.github.io/pizzicato/) - Simple sound effects and synthesis

### Related Projects
- [Chrome Music Lab](https://musiclab.chromeexperiments.com/) - Google's music experiment project
- [Wavesurfer.js](https://wavesurfer-js.org/) - Audio waveform visualization
- [p5.sound](https://p5js.org/reference/#/libraries/p5.sound) - p5.js audio library
