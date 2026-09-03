---
title: Canvas and WebGL Graphics Guide
description: Master web graphics from 2D Canvas to 3D WebGL
track: javascript
section: browser
difficulty: advanced
tags:
  - Canvas
  - WebGL
  - Graphics
  - Visualization
status: imported
origin: old/src/content/docs/frontend/canvas-webgl.en.md
divergence: 0.136
issues: []
legacy:
  category: Frontend
  subcategory: JavaScript
  order: 11
  lastUpdated: 2026-01-07
---

## Introduction

Canvas and WebGL are the two core technologies for modern web graphics programming. Canvas provides a simple 2D drawing API, ideal for charts, games, and image processing. WebGL, based on OpenGL ES, enables high-performance 2D/3D graphics rendering by leveraging the GPU.

### Historical Background

The Canvas element was first introduced by Apple in 2004 for the Safari browser and was later incorporated into the HTML5 specification. WebGL 1.0 was released in 2011, maintained by the Khronos Group, and is a JavaScript binding for OpenGL ES 2.0. WebGL 2.0 was released in 2017, based on OpenGL ES 3.0.

### Technology Comparison

| Feature | Canvas 2D | WebGL |
|---------|-----------|-------|
| Learning Curve | Low | High |
| Performance | Medium | High |
| Use Cases | 2D graphics, charts | 3D scenes, complex animations |
| GPU Acceleration | Partial | Full |
| Programming Model | Immediate mode | Retained mode |

---

## Canvas 2D Fundamentals

### Getting the Drawing Context

```html
<canvas id="canvas" width="800" height="600"></canvas>

<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// High DPI display adaptation
function setupHiDPI(canvas, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  ctx.scale(dpr, dpr);
  return { width: rect.width, height: rect.height };
}
</script>
```

### Basic Shape Drawing

```javascript
// Rectangles
ctx.fillStyle = '#3498db';
ctx.fillRect(10, 10, 100, 80);

ctx.strokeStyle = '#e74c3c';
ctx.lineWidth = 3;
ctx.strokeRect(130, 10, 100, 80);

// Clear a region
ctx.clearRect(50, 40, 40, 30);

// Circle
ctx.beginPath();
ctx.arc(300, 50, 40, 0, Math.PI * 2);
ctx.fillStyle = '#2ecc71';
ctx.fill();

// Ellipse
ctx.beginPath();
ctx.ellipse(420, 50, 60, 30, 0, 0, Math.PI * 2);
ctx.strokeStyle = '#9b59b6';
ctx.stroke();
```

### Path Drawing

```javascript
// Triangle
ctx.beginPath();
ctx.moveTo(50, 200);
ctx.lineTo(100, 120);
ctx.lineTo(150, 200);
ctx.closePath();
ctx.fillStyle = '#f39c12';
ctx.fill();

// Bezier curves
ctx.beginPath();
ctx.moveTo(200, 200);
ctx.quadraticCurveTo(250, 100, 300, 200); // Quadratic Bezier
ctx.strokeStyle = '#1abc9c';
ctx.lineWidth = 3;
ctx.stroke();

ctx.beginPath();
ctx.moveTo(350, 200);
ctx.bezierCurveTo(370, 100, 430, 100, 450, 200); // Cubic Bezier
ctx.strokeStyle = '#e91e63';
ctx.stroke();

// Complex path - Star shape
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);

  for (let i = 0; i < spikes; i++) {
    let x = cx + Math.cos(rot) * outerRadius;
    let y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }

  ctx.closePath();
  ctx.fillStyle = '#ffd700';
  ctx.fill();
  ctx.strokeStyle = '#ff8c00';
  ctx.stroke();
}

drawStar(ctx, 550, 150, 5, 50, 25);
```

### Gradients and Patterns

```javascript
// Linear gradient
const linearGradient = ctx.createLinearGradient(0, 0, 200, 0);
linearGradient.addColorStop(0, '#667eea');
linearGradient.addColorStop(1, '#764ba2');
ctx.fillStyle = linearGradient;
ctx.fillRect(10, 250, 200, 80);

// Radial gradient
const radialGradient = ctx.createRadialGradient(300, 290, 10, 300, 290, 60);
radialGradient.addColorStop(0, '#fff');
radialGradient.addColorStop(0.5, '#ff6b6b');
radialGradient.addColorStop(1, '#c0392b');
ctx.fillStyle = radialGradient;
ctx.beginPath();
ctx.arc(300, 290, 60, 0, Math.PI * 2);
ctx.fill();

// Pattern fill
const patternCanvas = document.createElement('canvas');
patternCanvas.width = 20;
patternCanvas.height = 20;
const pctx = patternCanvas.getContext('2d');
pctx.fillStyle = '#ecf0f1';
pctx.fillRect(0, 0, 20, 20);
pctx.fillStyle = '#bdc3c7';
pctx.fillRect(0, 0, 10, 10);
pctx.fillRect(10, 10, 10, 10);

const pattern = ctx.createPattern(patternCanvas, 'repeat');
ctx.fillStyle = pattern;
ctx.fillRect(400, 250, 150, 80);
```

### Text Rendering

```javascript
// Basic text
ctx.font = 'bold 36px Arial';
ctx.fillStyle = '#2c3e50';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Canvas 2D', 400, 400);

// Stroked text
ctx.font = '48px Georgia';
ctx.strokeStyle = '#3498db';
ctx.lineWidth = 2;
ctx.strokeText('Graphics Programming', 400, 460);

// Text measurement
const text = 'Hello Canvas!';
const metrics = ctx.measureText(text);
console.log('Text width:', metrics.width);
console.log('Actual bounds:', metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight);

// Text wrapping function
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
```

### Image Operations

```javascript
// Drawing images
const img = new Image();
img.onload = function() {
  // Basic drawing
  ctx.drawImage(img, 0, 0);

  // Scaled drawing
  ctx.drawImage(img, 200, 0, 100, 75);

  // Cropped drawing (source region -> destination region)
  ctx.drawImage(img,
    50, 50, 100, 100,  // Source: sx, sy, sWidth, sHeight
    350, 0, 80, 80     // Destination: dx, dy, dWidth, dHeight
  );
};
img.src = 'image.jpg';

// Pixel manipulation
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const data = imageData.data;

// Grayscale filter
for (let i = 0; i < data.length; i += 4) {
  const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
  data[i] = avg;     // R
  data[i + 1] = avg; // G
  data[i + 2] = avg; // B
  // data[i + 3] is Alpha, keep unchanged
}

ctx.putImageData(imageData, 0, 0);

// Invert colors filter
function invertColors(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  return imageData;
}
```

---

## Canvas Animation and Game Development

### Basic Animation Loop

```javascript
class AnimationLoop {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.lastTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsTime = 0;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.running = false;
  }

  loop() {
    if (!this.running) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // in seconds
    this.lastTime = currentTime;

    // Calculate FPS
    this.frameCount++;
    this.fpsTime += deltaTime;
    if (this.fpsTime >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTime = 0;
    }

    // Update and render
    this.update(deltaTime);
    this.render();

    requestAnimationFrame(() => this.loop());
  }

  update(deltaTime) {
    // Subclass implementation
  }

  render() {
    // Subclass implementation
  }
}
```

### Particle System

```javascript
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 10;
    this.vy = (Math.random() - 0.5) * 10;
    this.life = 1;
    this.decay = Math.random() * 0.02 + 0.01;
    this.size = Math.random() * 10 + 5;
    this.color = `hsl(${Math.random() * 60 + 10}, 100%, 50%)`;
  }

  update(deltaTime) {
    this.x += this.vx * deltaTime * 60;
    this.y += this.vy * deltaTime * 60;
    this.vy += 0.2; // Gravity
    this.life -= this.decay;
    this.size *= 0.99;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

class ParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.emitting = false;
    this.emitX = 0;
    this.emitY = 0;
  }

  emit(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y));
    }
  }

  update(deltaTime) {
    // Remove dead particles
    this.particles = this.particles.filter(p => !p.isDead());

    // Update living particles
    for (const particle of this.particles) {
      particle.update(deltaTime);
    }
  }

  render() {
    for (const particle of this.particles) {
      particle.draw(this.ctx);
    }
  }
}

// Usage example
const particleSystem = new ParticleSystem(canvas);

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  particleSystem.emit(
    e.clientX - rect.left,
    e.clientY - rect.top,
    5
  );
});

function animate() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  particleSystem.update(1/60);
  particleSystem.render();

  requestAnimationFrame(animate);
}
animate();
```

### Simple Game Example - Pong

```javascript
class Ball {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset();
  }

  reset() {
    this.x = this.canvas.width / 2;
    this.y = this.canvas.height / 2;
    this.radius = 15;
    this.speed = 5;
    this.dx = this.speed * (Math.random() > 0.5 ? 1 : -1);
    this.dy = this.speed * (Math.random() > 0.5 ? 1 : -1);
  }

  update() {
    this.x += this.dx;
    this.y += this.dy;

    // Boundary collision
    if (this.x - this.radius < 0 || this.x + this.radius > this.canvas.width) {
      this.dx = -this.dx;
    }
    if (this.y - this.radius < 0 || this.y + this.radius > this.canvas.height) {
      this.dy = -this.dy;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.closePath();
  }

  collidesWith(paddle) {
    return this.x > paddle.x &&
           this.x < paddle.x + paddle.width &&
           this.y + this.radius > paddle.y &&
           this.y - this.radius < paddle.y + paddle.height;
  }
}

class Paddle {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = 100;
    this.height = 15;
    this.x = (canvas.width - this.width) / 2;
    this.y = canvas.height - 30;
    this.speed = 8;
    this.dx = 0;
  }

  update() {
    this.x += this.dx;

    // Boundary limits
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > this.canvas.width) {
      this.x = this.canvas.width - this.width;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 5);
    ctx.fillStyle = '#3498db';
    ctx.fill();
    ctx.closePath();
  }

  moveLeft() { this.dx = -this.speed; }
  moveRight() { this.dx = this.speed; }
  stop() { this.dx = 0; }
}

class PongGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.ball = new Ball(this.canvas);
    this.paddle = new Paddle(this.canvas);
    this.score = 0;
    this.gameOver = false;

    this.setupControls();
  }

  setupControls() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.paddle.moveLeft();
      if (e.key === 'ArrowRight') this.paddle.moveRight();
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        this.paddle.stop();
      }
    });
  }

  update() {
    if (this.gameOver) return;

    this.ball.update();
    this.paddle.update();

    // Paddle collision
    if (this.ball.collidesWith(this.paddle)) {
      this.ball.dy = -Math.abs(this.ball.dy);
      this.score++;
    }

    // Game over detection
    if (this.ball.y > this.canvas.height) {
      this.gameOver = true;
    }
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw game objects
    this.ball.draw(this.ctx);
    this.paddle.draw(this.ctx);

    // Draw score
    this.ctx.font = '24px Arial';
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(`Score: ${this.score}`, 20, 40);

    // Game over screen
    if (this.gameOver) {
      this.ctx.font = '48px Arial';
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Game Over', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.font = '24px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
  }

  start() {
    const gameLoop = () => {
      this.update();
      this.render();
      requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }
}

// Start the game
const game = new PongGame('gameCanvas');
game.start();
```

---

## Canvas Performance Optimization

### Offscreen Canvas

```javascript
// For complex, rarely-changing graphics, use offscreen canvas caching
class OffscreenRenderer {
  constructor(width, height) {
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = width;
    this.offscreen.height = height;
    this.offCtx = this.offscreen.getContext('2d');
    this.dirty = true;
  }

  // Render complex graphics to offscreen canvas
  renderToOffscreen() {
    if (!this.dirty) return;

    const ctx = this.offCtx;
    ctx.clearRect(0, 0, this.offscreen.width, this.offscreen.height);

    // Draw complex background or static elements
    for (let i = 0; i < 1000; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * this.offscreen.width,
        Math.random() * this.offscreen.height,
        2,
        0, Math.PI * 2
      );
      ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 50%)`;
      ctx.fill();
    }

    this.dirty = false;
  }

  // Draw offscreen canvas to main canvas
  drawTo(mainCtx) {
    this.renderToOffscreen();
    mainCtx.drawImage(this.offscreen, 0, 0);
  }
}
```

### Layered Rendering

```javascript
class LayeredCanvas {
  constructor(container, width, height) {
    this.layers = new Map();
    this.container = container;
    this.width = width;
    this.height = height;
  }

  createLayer(name, zIndex) {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.zIndex = zIndex;

    this.container.appendChild(canvas);
    this.layers.set(name, {
      canvas,
      ctx: canvas.getContext('2d'),
      dirty: true
    });

    return this.layers.get(name);
  }

  getLayer(name) {
    return this.layers.get(name);
  }

  clearLayer(name) {
    const layer = this.layers.get(name);
    if (layer) {
      layer.ctx.clearRect(0, 0, this.width, this.height);
      layer.dirty = true;
    }
  }
}

// Usage example
const layered = new LayeredCanvas(document.body, 800, 600);
const bgLayer = layered.createLayer('background', 0);  // Static background
const gameLayer = layered.createLayer('game', 1);       // Game objects
const uiLayer = layered.createLayer('ui', 2);           // UI elements
```

### Object Pooling

```javascript
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.active = [];

    // Pre-create objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire(...args) {
    let obj = this.pool.pop();
    if (!obj) {
      obj = this.createFn();
    }
    this.resetFn(obj, ...args);
    this.active.push(obj);
    return obj;
  }

  release(obj) {
    const index = this.active.indexOf(obj);
    if (index !== -1) {
      this.active.splice(index, 1);
      this.pool.push(obj);
    }
  }

  releaseAll() {
    while (this.active.length > 0) {
      this.pool.push(this.active.pop());
    }
  }
}

// Particle object pool
const particlePool = new ObjectPool(
  () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 1 }),
  (p, x, y) => {
    p.x = x;
    p.y = y;
    p.vx = (Math.random() - 0.5) * 10;
    p.vy = (Math.random() - 0.5) * 10;
    p.life = 1;
  },
  500
);
```

### Performance Tips Summary

```javascript
// 1. Avoid floating-point coordinates (causes anti-aliasing calculations)
const x = Math.round(rawX);
const y = Math.round(rawY);

// 2. Batch draw shapes with the same style
ctx.fillStyle = '#ff0000';
ctx.beginPath();
for (const item of redItems) {
  ctx.moveTo(item.x + item.radius, item.y);
  ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
}
ctx.fill(); // Fill all at once

// 3. Use save/restore instead of manually restoring state
ctx.save();
ctx.translate(100, 100);
ctx.rotate(Math.PI / 4);
// Draw...
ctx.restore();

// 4. Reduce state changes
// Bad approach
items.forEach(item => {
  ctx.fillStyle = item.color; // Frequent color changes
  ctx.fillRect(item.x, item.y, item.w, item.h);
});

// Good approach: group by color
const groups = groupBy(items, 'color');
for (const [color, group] of Object.entries(groups)) {
  ctx.fillStyle = color;
  for (const item of group) {
    ctx.fillRect(item.x, item.y, item.w, item.h);
  }
}

// 5. Use willReadFrequently hint
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// 6. Use OffscreenCanvas (in Web Worker)
const offscreen = new OffscreenCanvas(800, 600);
const ctx = offscreen.getContext('2d');
// Perform complex calculations and drawing in Worker
```

---

## WebGL Core Concepts

### WebGL Rendering Pipeline

```
Vertex Data --> Vertex Shader --> Primitive Assembly --> Rasterization --> Fragment Shader --> Frame Buffer
```

### Basic Setup

```javascript
// Get WebGL context
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

if (!gl) {
  console.error('WebGL is not available');
}

// Basic configuration
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

// Enable depth testing
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);

// Enable backface culling
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);
```

### Buffer Operations

```javascript
// Create vertex buffer
function createBuffer(gl, data, type = gl.ARRAY_BUFFER) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(type, buffer);
  gl.bufferData(type, data, gl.STATIC_DRAW);
  return buffer;
}

// Triangle vertex data
const vertices = new Float32Array([
  // x, y, z
   0.0,  0.5, 0.0,
  -0.5, -0.5, 0.0,
   0.5, -0.5, 0.0
]);

const vertexBuffer = createBuffer(gl, vertices);

// Color data
const colors = new Float32Array([
  1.0, 0.0, 0.0, 1.0, // Red
  0.0, 1.0, 0.0, 1.0, // Green
  0.0, 0.0, 1.0, 1.0  // Blue
]);

const colorBuffer = createBuffer(gl, colors);

// Index buffer (for vertex reuse)
const indices = new Uint16Array([0, 1, 2]);
const indexBuffer = createBuffer(gl, indices, gl.ELEMENT_ARRAY_BUFFER);
```

---

## Shaders

### Vertex Shader

```glsl
// vertex-shader.glsl
#version 300 es

// Attributes (different per vertex)
in vec3 a_position;
in vec4 a_color;

// Uniforms (same for all vertices)
uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

// Output to fragment shader
out vec4 v_color;

void main() {
  // Calculate final position
  gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 1.0);

  // Pass color to fragment shader
  v_color = a_color;
}
```

### Fragment Shader

```glsl
// fragment-shader.glsl
#version 300 es
precision highp float;

// Received from vertex shader
in vec4 v_color;

// Uniforms
uniform float u_time;
uniform vec2 u_resolution;

// Output color
out vec4 fragColor;

void main() {
  // Basic color output
  fragColor = v_color;

  // Or create a gradient effect
  vec2 uv = gl_FragCoord.xy / u_resolution;
  fragColor = vec4(uv.x, uv.y, sin(u_time) * 0.5 + 0.5, 1.0);
}
```

### Shader Compilation and Linking

```javascript
// Shader utility class
class ShaderProgram {
  constructor(gl, vertexSource, fragmentSource) {
    this.gl = gl;
    this.program = this.createProgram(vertexSource, fragmentSource);
    this.uniforms = {};
    this.attributes = {};
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compilation error: ${info}`);
    }

    return shader;
  }

  createProgram(vertexSource, fragmentSource) {
    const gl = this.gl;
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      throw new Error(`Program linking error: ${info}`);
    }

    // Cleanup shaders (already linked to program)
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
  }

  use() {
    this.gl.useProgram(this.program);
  }

  getUniformLocation(name) {
    if (!this.uniforms[name]) {
      this.uniforms[name] = this.gl.getUniformLocation(this.program, name);
    }
    return this.uniforms[name];
  }

  getAttribLocation(name) {
    if (!this.attributes[name]) {
      this.attributes[name] = this.gl.getAttribLocation(this.program, name);
    }
    return this.attributes[name];
  }

  setUniform(name, value, type = 'float') {
    const location = this.getUniformLocation(name);
    const gl = this.gl;

    switch (type) {
      case 'float':
        gl.uniform1f(location, value);
        break;
      case 'vec2':
        gl.uniform2fv(location, value);
        break;
      case 'vec3':
        gl.uniform3fv(location, value);
        break;
      case 'vec4':
        gl.uniform4fv(location, value);
        break;
      case 'mat4':
        gl.uniformMatrix4fv(location, false, value);
        break;
      case 'int':
        gl.uniform1i(location, value);
        break;
    }
  }
}
```

---

## 3D Graphics Rendering Fundamentals

### Matrix Transformations

```javascript
// Simple matrix library
const Mat4 = {
  create() {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  },

  perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);

    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0
    ]);
  },

  lookAt(eye, center, up) {
    const z = Vec3.normalize(Vec3.subtract(eye, center));
    const x = Vec3.normalize(Vec3.cross(up, z));
    const y = Vec3.cross(z, x);

    return new Float32Array([
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -Vec3.dot(x, eye), -Vec3.dot(y, eye), -Vec3.dot(z, eye), 1
    ]);
  },

  translate(m, v) {
    const out = new Float32Array(m);
    out[12] = m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12];
    out[13] = m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13];
    out[14] = m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14];
    out[15] = m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15];
    return out;
  },

  rotateY(m, angle) {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const out = new Float32Array(m);

    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3];
    const a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11];

    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;

    return out;
  },

  multiply(a, b) {
    const out = new Float32Array(16);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        out[i * 4 + j] =
          a[i * 4 + 0] * b[0 * 4 + j] +
          a[i * 4 + 1] * b[1 * 4 + j] +
          a[i * 4 + 2] * b[2 * 4 + j] +
          a[i * 4 + 3] * b[3 * 4 + j];
      }
    }
    return out;
  }
};

const Vec3 = {
  subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  },

  cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  },

  dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  },

  normalize(v) {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / len, v[1] / len, v[2] / len];
  }
};
```

### Drawing a 3D Cube

```javascript
// Cube geometry data
function createCubeGeometry() {
  const positions = new Float32Array([
    // Front face
    -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,
    // Back face
    -1, -1, -1,  -1,  1, -1,   1,  1, -1,   1, -1, -1,
    // Top face
    -1,  1, -1,  -1,  1,  1,   1,  1,  1,   1,  1, -1,
    // Bottom face
    -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,
    // Right face
     1, -1, -1,   1,  1, -1,   1,  1,  1,   1, -1,  1,
    // Left face
    -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1
  ]);

  const normals = new Float32Array([
    // Front
    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    // Back
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    // Top
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
    // Bottom
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    // Right
    1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
    // Left
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
  ]);

  const indices = new Uint16Array([
    0,  1,  2,   0,  2,  3,   // Front
    4,  5,  6,   4,  6,  7,   // Back
    8,  9,  10,  8,  10, 11,  // Top
    12, 13, 14,  12, 14, 15,  // Bottom
    16, 17, 18,  16, 18, 19,  // Right
    20, 21, 22,  20, 22, 23   // Left
  ]);

  return { positions, normals, indices };
}

// Cube renderer
class CubeRenderer {
  constructor(gl) {
    this.gl = gl;
    this.setupShaders();
    this.setupBuffers();
    this.rotation = 0;
  }

  setupShaders() {
    const vertexShader = `#version 300 es
      in vec3 a_position;
      in vec3 a_normal;

      uniform mat4 u_modelViewProjection;
      uniform mat4 u_normalMatrix;

      out vec3 v_normal;

      void main() {
        gl_Position = u_modelViewProjection * vec4(a_position, 1.0);
        v_normal = mat3(u_normalMatrix) * a_normal;
      }
    `;

    const fragmentShader = `#version 300 es
      precision highp float;

      in vec3 v_normal;
      out vec4 fragColor;

      void main() {
        vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
        float light = max(dot(normalize(v_normal), lightDir), 0.0);
        vec3 color = vec3(0.2, 0.6, 1.0) * (0.3 + 0.7 * light);
        fragColor = vec4(color, 1.0);
      }
    `;

    this.shader = new ShaderProgram(this.gl, vertexShader, fragmentShader);
  }

  setupBuffers() {
    const gl = this.gl;
    const geometry = createCubeGeometry();

    this.positionBuffer = createBuffer(gl, geometry.positions);
    this.normalBuffer = createBuffer(gl, geometry.normals);
    this.indexBuffer = createBuffer(gl, geometry.indices, gl.ELEMENT_ARRAY_BUFFER);
    this.indexCount = geometry.indices.length;
  }

  render() {
    const gl = this.gl;

    // Clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Use shader program
    this.shader.use();

    // Set transformation matrices
    this.rotation += 0.01;
    let model = Mat4.create();
    model = Mat4.rotateY(model, this.rotation);

    const view = Mat4.lookAt([0, 0, 5], [0, 0, 0], [0, 1, 0]);
    const projection = Mat4.perspective(Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100);

    // Calculate MVP matrix
    const mvp = Mat4.multiply(projection, Mat4.multiply(view, model));

    this.shader.setUniform('u_modelViewProjection', mvp, 'mat4');
    this.shader.setUniform('u_normalMatrix', model, 'mat4');

    // Bind vertex attributes
    this.bindAttribute('a_position', this.positionBuffer, 3);
    this.bindAttribute('a_normal', this.normalBuffer, 3);

    // Draw
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }

  bindAttribute(name, buffer, size) {
    const gl = this.gl;
    const location = this.shader.getAttribLocation(name);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  }
}
```

---

## Introduction to Three.js

Three.js is the most popular WebGL library, greatly simplifying 3D development.

### Basic Setup

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class ThreeScene {
  constructor(container) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,                                      // FOV
      container.clientWidth / container.clientHeight, // Aspect ratio
      0.1,                                     // Near clipping plane
      1000                                     // Far clipping plane
    );
    this.camera.position.z = 5;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    // Lights
    this.setupLights();

    // Respond to window resize
    window.addEventListener('resize', () => this.onResize(container));
  }

  setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Point light
    const pointLight = new THREE.PointLight(0xff6600, 1, 100);
    pointLight.position.set(0, 3, 0);
    this.scene.add(pointLight);
  }

  onResize(container) {
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
```

### Creating Geometries and Materials

```javascript
class GeometryDemo extends ThreeScene {
  constructor(container) {
    super(container);
    this.createObjects();
    this.animate();
  }

  createObjects() {
    // Cube
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      roughness: 0.5,
      metalness: 0.5
    });
    this.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.cube.position.x = -2;
    this.scene.add(this.cube);

    // Sphere
    const sphereGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xe74c3c,
      roughness: 0.2,
      metalness: 0.8
    });
    this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.scene.add(this.sphere);

    // Torus
    const torusGeometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
    const torusMaterial = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      roughness: 0.3,
      metalness: 0.6
    });
    this.torus = new THREE.Mesh(torusGeometry, torusMaterial);
    this.torus.position.x = 2;
    this.scene.add(this.torus);

    // Ground plane
    const planeGeometry = new THREE.PlaneGeometry(10, 10);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x34495e,
      side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = Math.PI / 2;
    plane.position.y = -1;
    this.scene.add(plane);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Animation
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
    this.sphere.rotation.y += 0.02;
    this.torus.rotation.x += 0.02;
    this.torus.rotation.y += 0.01;

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
```

### Loading 3D Models

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

class ModelLoader {
  constructor(scene) {
    this.scene = scene;

    // DRACO decoder (for compressed models)
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');

    // GLTF loader
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(dracoLoader);
  }

  async load(url, options = {}) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene;

          // Apply options
          if (options.scale) {
            model.scale.setScalar(options.scale);
          }
          if (options.position) {
            model.position.copy(options.position);
          }

          // Enable shadows
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          this.scene.add(model);
          resolve({ model, animations: gltf.animations });
        },
        (progress) => {
          console.log(`Loading progress: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
        },
        reject
      );
    });
  }
}

// Usage example
const modelLoader = new ModelLoader(scene);
const { model, animations } = await modelLoader.load('/models/character.glb', {
  scale: 0.5,
  position: new THREE.Vector3(0, 0, 0)
});

// Animation mixer
const mixer = new THREE.AnimationMixer(model);
const action = mixer.clipAction(animations[0]);
action.play();

// Update in animation loop
function animate() {
  requestAnimationFrame(animate);
  mixer.update(deltaTime);
  renderer.render(scene, camera);
}
```

---

## Practical Examples

### Example 1: Starfield Particle Effect

```javascript
class StarField {
  constructor(container) {
    this.init(container);
    this.createStars();
    this.animate();
  }

  init(container) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 50;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    this.mouse = new THREE.Vector2();
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
  }

  createStars() {
    const starCount = 10000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

      // Color (blue-white tint)
      const color = new THREE.Color();
      color.setHSL(0.6 + Math.random() * 0.2, 0.5, 0.7 + Math.random() * 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // Size
      sizes[i] = Math.random() * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float u_time;

        void main() {
          vColor = color;
          vec3 pos = position;
          pos.z += sin(u_time + position.x * 0.1) * 2.0;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (100.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;

          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update time
    this.stars.material.uniforms.u_time.value = performance.now() * 0.001;

    // Rotate based on mouse
    this.stars.rotation.x += (this.mouse.y * 0.1 - this.stars.rotation.x) * 0.05;
    this.stars.rotation.y += (this.mouse.x * 0.1 - this.stars.rotation.y) * 0.05;

    this.renderer.render(this.scene, this.camera);
  }
}
```

### Example 2: 3D Product Viewer

```javascript
class ProductViewer {
  constructor(container) {
    this.init(container);
    this.setupEnvironment();
  }

  init(container) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 2, 5);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 10;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 1;
  }

  async setupEnvironment() {
    // Load HDR environment map
    const rgbeLoader = new RGBELoader();
    const texture = await rgbeLoader.loadAsync('/env/studio.hdr');
    texture.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.environment = texture;
    this.scene.background = texture;
  }

  async loadProduct(modelUrl) {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(modelUrl);

    this.product = gltf.scene;

    // Center the model
    const box = new THREE.Box3().setFromObject(this.product);
    const center = box.getCenter(new THREE.Vector3());
    this.product.position.sub(center);

    // Scale to appropriate size
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    this.product.scale.multiplyScalar(2 / maxDim);

    this.scene.add(this.product);
  }

  // Change material/color
  setMaterialColor(colorHex) {
    this.product.traverse((child) => {
      if (child.isMesh && child.material.name === 'body') {
        child.material.color.setHex(colorHex);
      }
    });
  }

  // Screenshot functionality
  takeScreenshot() {
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png');

    const link = document.createElement('a');
    link.download = 'product-screenshot.png';
    link.href = dataUrl;
    link.click();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
```

---

## Performance Optimization and Best Practices

### WebGL Performance Optimization

```javascript
// 1. Instanced rendering (for many identical objects)
class InstancedRenderer {
  createInstancedMesh(geometry, material, count) {
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      dummy.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
      );
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    return mesh;
  }
}

// 2. Level of Detail (LOD)
class LODManager {
  createLOD(meshes) {
    const lod = new THREE.LOD();

    // High detail model (close distance)
    lod.addLevel(meshes.high, 0);
    // Medium detail model
    lod.addLevel(meshes.medium, 10);
    // Low detail model (far distance)
    lod.addLevel(meshes.low, 20);

    return lod;
  }
}

// 3. Texture optimization
class TextureOptimizer {
  constructor(renderer) {
    this.renderer = renderer;
    this.maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  optimizeTexture(texture) {
    // Use anisotropic filtering
    texture.anisotropy = this.maxAnisotropy;

    // Use mipmaps
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;

    // Compressed texture formats
    // Use KTX2Loader for compressed textures
    return texture;
  }
}

// 4. Geometry merging
class GeometryMerger {
  mergeGeometries(meshes) {
    const geometries = meshes.map(mesh => {
      const geometry = mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrixWorld);
      return geometry;
    });

    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
    return new THREE.Mesh(mergedGeometry, meshes[0].material);
  }
}

// 5. Frustum culling optimization
class FrustumCuller {
  constructor(camera) {
    this.frustum = new THREE.Frustum();
    this.cameraViewProjectionMatrix = new THREE.Matrix4();
    this.camera = camera;
  }

  update() {
    this.camera.updateMatrixWorld();
    this.cameraViewProjectionMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraViewProjectionMatrix);
  }

  isVisible(object) {
    if (object.geometry.boundingSphere === null) {
      object.geometry.computeBoundingSphere();
    }
    const sphere = object.geometry.boundingSphere.clone();
    sphere.applyMatrix4(object.matrixWorld);
    return this.frustum.intersectsSphere(sphere);
  }
}
```

### Memory Management

```javascript
class ResourceManager {
  constructor() {
    this.textures = new Map();
    this.geometries = new Map();
    this.materials = new Map();
  }

  // Properly dispose resources
  dispose(object) {
    if (object.geometry) {
      object.geometry.dispose();
    }

    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(material => this.disposeMaterial(material));
      } else {
        this.disposeMaterial(object.material);
      }
    }

    if (object.children) {
      object.children.forEach(child => this.dispose(child));
    }
  }

  disposeMaterial(material) {
    // Dispose textures
    for (const key of Object.keys(material)) {
      const value = material[key];
      if (value && value.isTexture) {
        value.dispose();
      }
    }
    material.dispose();
  }

  // Monitor memory usage
  getMemoryInfo(renderer) {
    const info = renderer.info;
    return {
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      drawCalls: info.render.calls,
      triangles: info.render.triangles
    };
  }
}
```

### Performance Monitoring

```javascript
import Stats from 'three/addons/libs/stats.module.js';

class PerformanceMonitor {
  constructor(container) {
    // FPS monitor
    this.stats = new Stats();
    this.stats.showPanel(0);
    container.appendChild(this.stats.dom);

    // GPU performance monitoring
    this.gpuPanel = this.stats.addPanel(new Stats.Panel('GPU', '#ff0', '#220'));

    // Custom metrics
    this.metrics = {
      drawCalls: 0,
      triangles: 0,
      fps: 0,
      frameTime: 0
    };
  }

  begin() {
    this.stats.begin();
    this.frameStart = performance.now();
  }

  end(renderer) {
    this.stats.end();

    const info = renderer.info;
    this.metrics.drawCalls = info.render.calls;
    this.metrics.triangles = info.render.triangles;
    this.metrics.frameTime = performance.now() - this.frameStart;

    // Reset per-frame counters
    info.reset();
  }

  getReport() {
    return this.metrics;
  }
}
```

---

## Interview Key Points

### Canvas-Related Questions

**Q1: What is the difference between Canvas and SVG?**

```
Canvas:
- Pixel-based immediate mode rendering
- Best for complex animations and games
- Scaling causes pixelation
- Cannot directly manipulate individual graphic elements
- Performance scales with canvas size

SVG:
- Vector-based retained mode rendering
- Best for icons and data visualization
- Infinitely scalable without quality loss
- Supports DOM manipulation and event binding
- Performance scales with element count
```

**Q2: How do you implement high-DPI (Retina) display support for Canvas?**

```javascript
function setupHiDPI(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  // Set actual pixel size
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // Maintain CSS display size
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  // Scale drawing context
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
}
```

**Q3: What are the main Canvas performance optimization techniques?**

```
1. Offscreen Canvas caching for static content
2. Layered rendering (background, dynamic, UI layers)
3. Avoid floating-point coordinates (causes anti-aliasing)
4. Batch draw shapes with the same style
5. Reduce state changes (fillStyle, strokeStyle, etc.)
6. Use object pooling to reuse objects
7. Use requestAnimationFrame instead of setInterval
8. Only redraw changed areas (dirty rectangles)
```

### WebGL-Related Questions

**Q4: What is the WebGL rendering pipeline?**

```
1. Vertex data input
2. Vertex shader processing (position transforms, normal calculations)
3. Primitive assembly (assemble vertices into triangles)
4. Rasterization (convert geometric primitives to fragments)
5. Fragment shader processing (calculate pixel colors)
6. Depth test, stencil test, blending
7. Output to frame buffer
```

**Q5: What are shaders? What is the difference between Vertex Shader and Fragment Shader?**

```
Shaders are small programs that run on the GPU, written in GLSL.

Vertex Shader:
- Executes once per vertex
- Responsible for vertex position transformations
- Calculates vertex attributes to pass to fragment shader

Fragment Shader:
- Executes once per pixel/fragment
- Responsible for calculating final pixel color
- Handles texture sampling, lighting calculations
```

**Q6: How do you optimize rendering many objects in Three.js?**

```javascript
// 1. Use InstancedMesh
const mesh = new THREE.InstancedMesh(geometry, material, count);

// 2. Use LOD (Level of Detail)
const lod = new THREE.LOD();
lod.addLevel(highDetail, 0);
lod.addLevel(lowDetail, 50);

// 3. Merge geometries
const merged = BufferGeometryUtils.mergeGeometries(geometries);

// 4. Use GPU particle systems (Points)
const points = new THREE.Points(geometry, pointsMaterial);

// 5. Enable frustum culling
object.frustumCulled = true;

// 6. Use compressed textures (KTX2/Basis)
```

### High-Frequency Interview Topics Summary

```
1. Canvas drawing API: fillRect, strokeRect, arc, bezierCurveTo
2. Canvas state management: save(), restore()
3. Canvas pixel manipulation: getImageData, putImageData
4. WebGL coordinate system: right-handed, Y-axis up
5. MVP matrices: Model -> View -> Projection
6. Texture mapping: UV coordinates, texture filtering, mipmaps
7. Blending modes: gl.blendFunc, THREE.AdditiveBlending
8. Frame Buffer Objects (FBO): offscreen rendering, post-processing
9. Three.js core concepts: Scene, Camera, Renderer, Mesh
10. Performance optimization: batching, instancing, LOD, object pooling
```

---

## Learning Resources

### Official Documentation
- [MDN Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [Three.js Documentation](https://threejs.org/docs/)

### Recommended Books
- "WebGL Programming Guide"
- "Learning Three.js"
- "Real-Time Rendering"

### Learning Path Recommendations

1. **Progress gradually**: Master Canvas 2D first, then learn WebGL basics, finally use Three.js
2. **Hands-on practice**: Follow tutorials and write code, experiment with different parameters
3. **Understand the math**: Linear algebra (vectors, matrices) is the foundation of 3D graphics
4. **Read source code**: Study code organization and optimization techniques from quality open-source projects
5. **Performance awareness**: Build good performance optimization habits from the start

---

## Summary

Canvas and WebGL are the core technologies for web graphics programming. Canvas 2D is great for getting started with its simple API, suitable for charts, simple games, and other scenarios. WebGL is powerful but has a steep learning curve - libraries like Three.js can significantly lower the barrier to entry.

Mastering these technologies allows you to build rich visualization applications and provides deep understanding of browser rendering principles and GPU programming. This is an important direction for advancing your frontend development skills.

Key takeaways:

1. **Canvas 2D** is ideal for 2D graphics with its simple, immediate-mode API
2. **WebGL** provides full GPU access for complex 3D scenes and effects
3. **Three.js** abstracts WebGL complexity while maintaining performance
4. **Performance optimization** is critical - understand the rendering pipeline
5. **Practice is essential** - graphics programming requires hands-on experimentation
