---
title: Canvas 与 WebGL 图形编程
description: 掌握Web图形绑制技术，从2D Canvas到3D WebGL
track: javascript
section: browser
difficulty: advanced
tags:
  - Canvas
  - WebGL
  - 图形
  - 可视化
status: imported
origin: old/src/content/docs/frontend/canvas-webgl.zh.md
divergence: 0.136
issues: []
legacy:
  category: Frontend
  subcategory: JavaScript
  order: 11
  lastUpdated: 2026-01-07
---

## 概念解释

Canvas 和 WebGL 是现代 Web 图形编程的两大核心技术。Canvas 提供了简洁的 2D 绑制 API,适合图表、游戏和图像处理;WebGL 则基于 OpenGL ES,能够利用 GPU 实现高性能的 2D/3D 图形渲染。

### 历史背景

Canvas 元素最早由 Apple 在 2004 年为 Safari 浏览器引入,后被纳入 HTML5 规范。WebGL 1.0 于 2011 年发布,由 Khronos Group 维护,是 OpenGL ES 2.0 的 JavaScript 绑定。WebGL 2.0 于 2017 年发布,基于 OpenGL ES 3.0。

### 技术对比

| 特性 | Canvas 2D | WebGL |
|------|-----------|-------|
| 学习曲线 | 低 | 高 |
| 性能 | 中等 | 高 |
| 适用场景 | 2D 图形、图表 | 3D 场景、复杂动画 |
| GPU 加速 | 部分 | 完全 |
| 编程模式 | 即时模式 | 保留模式 |

---

## Canvas 2D 基础

### 获取绑制上下文

```html
<canvas id="canvas" width="800" height="600"></canvas>

<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 设置高 DPI 适配
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

### 基本形状绘制

```javascript
// 矩形
ctx.fillStyle = '#3498db';
ctx.fillRect(10, 10, 100, 80);

ctx.strokeStyle = '#e74c3c';
ctx.lineWidth = 3;
ctx.strokeRect(130, 10, 100, 80);

// 清除区域
ctx.clearRect(50, 40, 40, 30);

// 圆形
ctx.beginPath();
ctx.arc(300, 50, 40, 0, Math.PI * 2);
ctx.fillStyle = '#2ecc71';
ctx.fill();

// 椭圆
ctx.beginPath();
ctx.ellipse(420, 50, 60, 30, 0, 0, Math.PI * 2);
ctx.strokeStyle = '#9b59b6';
ctx.stroke();
```

### 路径绑制

```javascript
// 三角形
ctx.beginPath();
ctx.moveTo(50, 200);
ctx.lineTo(100, 120);
ctx.lineTo(150, 200);
ctx.closePath();
ctx.fillStyle = '#f39c12';
ctx.fill();

// 贝塞尔曲线
ctx.beginPath();
ctx.moveTo(200, 200);
ctx.quadraticCurveTo(250, 100, 300, 200); // 二次贝塞尔
ctx.strokeStyle = '#1abc9c';
ctx.lineWidth = 3;
ctx.stroke();

ctx.beginPath();
ctx.moveTo(350, 200);
ctx.bezierCurveTo(370, 100, 430, 100, 450, 200); // 三次贝塞尔
ctx.strokeStyle = '#e91e63';
ctx.stroke();

// 复杂路径 - 星形
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

### 渐变与图案

```javascript
// 线性渐变
const linearGradient = ctx.createLinearGradient(0, 0, 200, 0);
linearGradient.addColorStop(0, '#667eea');
linearGradient.addColorStop(1, '#764ba2');
ctx.fillStyle = linearGradient;
ctx.fillRect(10, 250, 200, 80);

// 径向渐变
const radialGradient = ctx.createRadialGradient(300, 290, 10, 300, 290, 60);
radialGradient.addColorStop(0, '#fff');
radialGradient.addColorStop(0.5, '#ff6b6b');
radialGradient.addColorStop(1, '#c0392b');
ctx.fillStyle = radialGradient;
ctx.beginPath();
ctx.arc(300, 290, 60, 0, Math.PI * 2);
ctx.fill();

// 图案填充
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

### 文本绑制

```javascript
// 基本文本
ctx.font = 'bold 36px Arial';
ctx.fillStyle = '#2c3e50';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('Canvas 2D', 400, 400);

// 描边文本
ctx.font = '48px Georgia';
ctx.strokeStyle = '#3498db';
ctx.lineWidth = 2;
ctx.strokeText('图形编程', 400, 460);

// 文本测量
const text = 'Hello Canvas!';
const metrics = ctx.measureText(text);
console.log('文本宽度:', metrics.width);
console.log('实际边界:', metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight);

// 自动换行文本
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split('');
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n];
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
```

### 图像操作

```javascript
// 绘制图像
const img = new Image();
img.onload = function() {
  // 基本绘制
  ctx.drawImage(img, 0, 0);

  // 缩放绘制
  ctx.drawImage(img, 200, 0, 100, 75);

  // 裁剪绘制 (源图像裁剪区域 -> 目标区域)
  ctx.drawImage(img,
    50, 50, 100, 100,  // 源: sx, sy, sWidth, sHeight
    350, 0, 80, 80     // 目标: dx, dy, dWidth, dHeight
  );
};
img.src = 'image.jpg';

// 像素操作
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const data = imageData.data;

// 灰度滤镜
for (let i = 0; i < data.length; i += 4) {
  const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
  data[i] = avg;     // R
  data[i + 1] = avg; // G
  data[i + 2] = avg; // B
  // data[i + 3] 是 Alpha,保持不变
}

ctx.putImageData(imageData, 0, 0);

// 反色滤镜
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

## Canvas 动画与游戏开发

### 基础动画循环

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
    const deltaTime = (currentTime - this.lastTime) / 1000; // 秒
    this.lastTime = currentTime;

    // 计算 FPS
    this.frameCount++;
    this.fpsTime += deltaTime;
    if (this.fpsTime >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTime = 0;
    }

    // 更新和渲染
    this.update(deltaTime);
    this.render();

    requestAnimationFrame(() => this.loop());
  }

  update(deltaTime) {
    // 子类实现
  }

  render() {
    // 子类实现
  }
}
```

### 粒子系统

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
    this.vy += 0.2; // 重力
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
    // 移除死亡粒子
    this.particles = this.particles.filter(p => !p.isDead());

    // 更新存活粒子
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

// 使用示例
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

### 简单游戏示例 - 弹球

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

    // 边界碰撞
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

    // 边界限制
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

    // 球拍碰撞
    if (this.ball.collidesWith(this.paddle)) {
      this.ball.dy = -Math.abs(this.ball.dy);
      this.score++;
    }

    // 游戏结束检测
    if (this.ball.y > this.canvas.height) {
      this.gameOver = true;
    }
  }

  render() {
    // 清空画布
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制游戏对象
    this.ball.draw(this.ctx);
    this.paddle.draw(this.ctx);

    // 绘制分数
    this.ctx.font = '24px Arial';
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(`得分: ${this.score}`, 20, 40);

    // 游戏结束画面
    if (this.gameOver) {
      this.ctx.font = '48px Arial';
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.font = '24px Arial';
      this.ctx.fillText(`最终得分: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
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

// 启动游戏
const game = new PongGame('gameCanvas');
game.start();
```

---

## Canvas 性能优化

### 离屏 Canvas

```javascript
// 对于复杂的、不经常变化的图形,使用离屏 Canvas 缓存
class OffscreenRenderer {
  constructor(width, height) {
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = width;
    this.offscreen.height = height;
    this.offCtx = this.offscreen.getContext('2d');
    this.dirty = true;
  }

  // 绘制复杂图形到离屏 Canvas
  renderToOffscreen() {
    if (!this.dirty) return;

    const ctx = this.offCtx;
    ctx.clearRect(0, 0, this.offscreen.width, this.offscreen.height);

    // 绘制复杂背景或不变的元素
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

  // 将离屏 Canvas 绘制到主 Canvas
  drawTo(mainCtx) {
    this.renderToOffscreen();
    mainCtx.drawImage(this.offscreen, 0, 0);
  }
}
```

### 分层渲染

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

// 使用示例
const layered = new LayeredCanvas(document.body, 800, 600);
const bgLayer = layered.createLayer('background', 0);  // 静态背景
const gameLayer = layered.createLayer('game', 1);       // 游戏对象
const uiLayer = layered.createLayer('ui', 2);           // UI 元素
```

### 对象池

```javascript
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.active = [];

    // 预创建对象
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

// 粒子对象池
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

### 性能优化技巧汇总

```javascript
// 1. 避免浮点数坐标(会导致抗锯齿计算)
const x = Math.round(rawX);
const y = Math.round(rawY);

// 2. 批量绑制相同样式的图形
ctx.fillStyle = '#ff0000';
ctx.beginPath();
for (const item of redItems) {
  ctx.moveTo(item.x + item.radius, item.y);
  ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
}
ctx.fill(); // 一次性填充所有

// 3. 使用 save/restore 代替手动恢复状态
ctx.save();
ctx.translate(100, 100);
ctx.rotate(Math.PI / 4);
// 绑制...
ctx.restore();

// 4. 减少状态切换
// 不好的做法
items.forEach(item => {
  ctx.fillStyle = item.color; // 频繁切换颜色
  ctx.fillRect(item.x, item.y, item.w, item.h);
});

// 好的做法:按颜色分组
const groups = groupBy(items, 'color');
for (const [color, group] of Object.entries(groups)) {
  ctx.fillStyle = color;
  for (const item of group) {
    ctx.fillRect(item.x, item.y, item.w, item.h);
  }
}

// 5. 使用 willReadFrequently 提示
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// 6. 使用 OffscreenCanvas (Web Worker 中)
const offscreen = new OffscreenCanvas(800, 600);
const ctx = offscreen.getContext('2d');
// 在 Worker 中进行复杂计算和绑制
```

---

## WebGL 基础概念

### WebGL 渲染管线

```
顶点数据 --> 顶点着色器 --> 图元装配 --> 光栅化 --> 片元着色器 --> 帧缓冲
```

### 基本设置

```javascript
// 获取 WebGL 上下文
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

if (!gl) {
  console.error('WebGL 不可用');
}

// 基本设置
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

// 启用深度测试
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);

// 启用背面剔除
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);
```

### 缓冲区操作

```javascript
// 创建顶点缓冲区
function createBuffer(gl, data, type = gl.ARRAY_BUFFER) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(type, buffer);
  gl.bufferData(type, data, gl.STATIC_DRAW);
  return buffer;
}

// 三角形顶点数据
const vertices = new Float32Array([
  // x, y, z
   0.0,  0.5, 0.0,
  -0.5, -0.5, 0.0,
   0.5, -0.5, 0.0
]);

const vertexBuffer = createBuffer(gl, vertices);

// 颜色数据
const colors = new Float32Array([
  1.0, 0.0, 0.0, 1.0, // 红
  0.0, 1.0, 0.0, 1.0, // 绿
  0.0, 0.0, 1.0, 1.0  // 蓝
]);

const colorBuffer = createBuffer(gl, colors);

// 索引缓冲区(用于复用顶点)
const indices = new Uint16Array([0, 1, 2]);
const indexBuffer = createBuffer(gl, indices, gl.ELEMENT_ARRAY_BUFFER);
```

---

## 着色器(Shader)

### 顶点着色器(Vertex Shader)

```glsl
// vertex-shader.glsl
#version 300 es

// 属性(每个顶点不同)
in vec3 a_position;
in vec4 a_color;

// 统一变量(所有顶点相同)
uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

// 输出到片元着色器
out vec4 v_color;

void main() {
  // 计算最终位置
  gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_position, 1.0);

  // 传递颜色到片元着色器
  v_color = a_color;
}
```

### 片元着色器(Fragment Shader)

```glsl
// fragment-shader.glsl
#version 300 es
precision highp float;

// 从顶点着色器接收
in vec4 v_color;

// 统一变量
uniform float u_time;
uniform vec2 u_resolution;

// 输出颜色
out vec4 fragColor;

void main() {
  // 基本颜色输出
  fragColor = v_color;

  // 或者创建渐变效果
  vec2 uv = gl_FragCoord.xy / u_resolution;
  fragColor = vec4(uv.x, uv.y, sin(u_time) * 0.5 + 0.5, 1.0);
}
```

### 着色器编译与链接

```javascript
// 着色器工具类
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
      throw new Error(`着色器编译错误: ${info}`);
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
      throw new Error(`程序链接错误: ${info}`);
    }

    // 清理着色器(已链接到程序,不再需要)
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

## 3D 图形渲染基础

### 矩阵变换

```javascript
// 简单的矩阵库
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

### 绘制 3D 立方体

```javascript
// 立方体顶点数据
function createCubeGeometry() {
  const positions = new Float32Array([
    // 前面
    -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,
    // 后面
    -1, -1, -1,  -1,  1, -1,   1,  1, -1,   1, -1, -1,
    // 上面
    -1,  1, -1,  -1,  1,  1,   1,  1,  1,   1,  1, -1,
    // 下面
    -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,
    // 右面
     1, -1, -1,   1,  1, -1,   1,  1,  1,   1, -1,  1,
    // 左面
    -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1
  ]);

  const normals = new Float32Array([
    // 前面
    0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,
    // 后面
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    // 上面
    0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
    // 下面
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    // 右面
    1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
    // 左面
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0
  ]);

  const indices = new Uint16Array([
    0,  1,  2,   0,  2,  3,   // 前
    4,  5,  6,   4,  6,  7,   // 后
    8,  9,  10,  8,  10, 11,  // 上
    12, 13, 14,  12, 14, 15,  // 下
    16, 17, 18,  16, 18, 19,  // 右
    20, 21, 22,  20, 22, 23   // 左
  ]);

  return { positions, normals, indices };
}

// 渲染立方体
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

    // 清除画布
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 使用着色器程序
    this.shader.use();

    // 设置变换矩阵
    this.rotation += 0.01;
    let model = Mat4.create();
    model = Mat4.rotateY(model, this.rotation);

    const view = Mat4.lookAt([0, 0, 5], [0, 0, 0], [0, 1, 0]);
    const projection = Mat4.perspective(Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100);

    // 计算 MVP 矩阵
    const mvp = Mat4.multiply(projection, Mat4.multiply(view, model));

    this.shader.setUniform('u_modelViewProjection', mvp, 'mat4');
    this.shader.setUniform('u_normalMatrix', model, 'mat4');

    // 绑定顶点属性
    this.bindAttribute('a_position', this.positionBuffer, 3);
    this.bindAttribute('a_normal', this.normalBuffer, 3);

    // 绘制
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

## Three.js 入门

Three.js 是最流行的 WebGL 库,大大简化了 3D 开发。

### 基本设置

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class ThreeScene {
  constructor(container) {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // 相机
    this.camera = new THREE.PerspectiveCamera(
      75,                                      // FOV
      container.clientWidth / container.clientHeight, // 宽高比
      0.1,                                     // 近裁剪面
      1000                                     // 远裁剪面
    );
    this.camera.position.z = 5;

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    // 灯光
    this.setupLights();

    // 响应窗口大小变化
    window.addEventListener('resize', () => this.onResize(container));
  }

  setupLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // 平行光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // 点光源
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

### 创建几何体和材质

```javascript
class GeometryDemo extends ThreeScene {
  constructor(container) {
    super(container);
    this.createObjects();
    this.animate();
  }

  createObjects() {
    // 立方体
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      roughness: 0.5,
      metalness: 0.5
    });
    this.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.cube.position.x = -2;
    this.scene.add(this.cube);

    // 球体
    const sphereGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xe74c3c,
      roughness: 0.2,
      metalness: 0.8
    });
    this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.scene.add(this.sphere);

    // 圆环
    const torusGeometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
    const torusMaterial = new THREE.MeshStandardMaterial({
      color: 0x2ecc71,
      roughness: 0.3,
      metalness: 0.6
    });
    this.torus = new THREE.Mesh(torusGeometry, torusMaterial);
    this.torus.position.x = 2;
    this.scene.add(this.torus);

    // 地面
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

    // 动画
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

### 加载 3D 模型

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

class ModelLoader {
  constructor(scene) {
    this.scene = scene;

    // DRACO 解压器(用于压缩模型)
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');

    // GLTF 加载器
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(dracoLoader);
  }

  async load(url, options = {}) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene;

          // 应用选项
          if (options.scale) {
            model.scale.setScalar(options.scale);
          }
          if (options.position) {
            model.position.copy(options.position);
          }

          // 启用阴影
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
          console.log(`加载进度: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
        },
        reject
      );
    });
  }
}

// 使用示例
const modelLoader = new ModelLoader(scene);
const { model, animations } = await modelLoader.load('/models/character.glb', {
  scale: 0.5,
  position: new THREE.Vector3(0, 0, 0)
});

// 动画混合器
const mixer = new THREE.AnimationMixer(model);
const action = mixer.clipAction(animations[0]);
action.play();

// 在动画循环中更新
function animate() {
  requestAnimationFrame(animate);
  mixer.update(deltaTime);
  renderer.render(scene, camera);
}
```

---

## 实战案例

### 案例一:星空粒子效果

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
      // 位置
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

      // 颜色(偏蓝白色)
      const color = new THREE.Color();
      color.setHSL(0.6 + Math.random() * 0.2, 0.5, 0.7 + Math.random() * 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // 大小
      sizes[i] = Math.random() * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 自定义着色器材质
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

    // 更新时间
    this.stars.material.uniforms.u_time.value = performance.now() * 0.001;

    // 根据鼠标旋转
    this.stars.rotation.x += (this.mouse.y * 0.1 - this.stars.rotation.x) * 0.05;
    this.stars.rotation.y += (this.mouse.x * 0.1 - this.stars.rotation.y) * 0.05;

    this.renderer.render(this.scene, this.camera);
  }
}
```

### 案例二:3D 产品展示

```javascript
class ProductViewer {
  constructor(container) {
    this.init(container);
    this.setupEnvironment();
    this.setupPostProcessing();
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
    // 加载 HDR 环境贴图
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

    // 居中模型
    const box = new THREE.Box3().setFromObject(this.product);
    const center = box.getCenter(new THREE.Vector3());
    this.product.position.sub(center);

    // 缩放到合适大小
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    this.product.scale.multiplyScalar(2 / maxDim);

    this.scene.add(this.product);
  }

  // 更换材质/颜色
  setMaterialColor(colorHex) {
    this.product.traverse((child) => {
      if (child.isMesh && child.material.name === 'body') {
        child.material.color.setHex(colorHex);
      }
    });
  }

  // 截图功能
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

## 性能优化与最佳实践

### WebGL 性能优化

```javascript
// 1. 实例化渲染(大量相同物体)
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

// 2. LOD(细节层次)
class LODManager {
  createLOD(meshes) {
    const lod = new THREE.LOD();

    // 高精度模型(近距离)
    lod.addLevel(meshes.high, 0);
    // 中精度模型
    lod.addLevel(meshes.medium, 10);
    // 低精度模型(远距离)
    lod.addLevel(meshes.low, 20);

    return lod;
  }
}

// 3. 纹理优化
class TextureOptimizer {
  constructor(renderer) {
    this.renderer = renderer;
    this.maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  optimizeTexture(texture) {
    // 使用各向异性过滤
    texture.anisotropy = this.maxAnisotropy;

    // 使用 mipmap
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;

    // 压缩纹理格式
    // 使用 KTX2Loader 加载压缩纹理
    return texture;
  }
}

// 4. 几何体合并
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

// 5. 视锥体剔除优化
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

### 内存管理

```javascript
class ResourceManager {
  constructor() {
    this.textures = new Map();
    this.geometries = new Map();
    this.materials = new Map();
  }

  // 正确释放资源
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
    // 释放纹理
    for (const key of Object.keys(material)) {
      const value = material[key];
      if (value && value.isTexture) {
        value.dispose();
      }
    }
    material.dispose();
  }

  // 监控内存使用
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

### 性能监控

```javascript
import Stats from 'three/addons/libs/stats.module.js';

class PerformanceMonitor {
  constructor(container) {
    // FPS 监控
    this.stats = new Stats();
    this.stats.showPanel(0);
    container.appendChild(this.stats.dom);

    // GPU 性能监控
    this.gpuPanel = this.stats.addPanel(new Stats.Panel('GPU', '#ff0', '#220'));

    // 自定义指标
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

    // 重置每帧计数
    info.reset();
  }

  getReport() {
    return this.metrics;
  }
}
```

---

## 面试要点

### Canvas 相关问题

**Q1: Canvas 和 SVG 的区别是什么?**

```
Canvas:
- 基于像素的即时模式渲染
- 适合复杂动画和游戏
- 缩放会失真
- 无法直接操作单个图形元素
- 性能随画布尺寸变化

SVG:
- 基于矢量的保留模式渲染
- 适合图标和数据可视化
- 无限缩放不失真
- 支持 DOM 操作和事件绑定
- 性能随元素数量变化
```

**Q2: 如何实现 Canvas 高清屏适配?**

```javascript
function setupHiDPI(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  // 设置实际像素尺寸
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  // 保持 CSS 显示尺寸
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  // 缩放绑制上下文
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
}
```

**Q3: Canvas 性能优化有哪些方法?**

```
1. 离屏 Canvas 缓存静态内容
2. 分层渲染(背景层、动态层、UI 层)
3. 避免浮点坐标导致的抗锯齿
4. 批量绑制相同样式的图形
5. 减少状态切换(fillStyle, strokeStyle等)
6. 使用对象池复用对象
7. 使用 requestAnimationFrame 代替 setInterval
8. 只重绘变化的区域(脏矩形)
```

### WebGL 相关问题

**Q4: WebGL 渲染管线是怎样的?**

```
1. 顶点数据输入
2. 顶点着色器处理(位置变换、法线计算)
3. 图元装配(将顶点组装成三角形)
4. 光栅化(将几何图元转换为片元)
5. 片元着色器处理(计算每个像素颜色)
6. 深度测试、模板测试、混合
7. 输出到帧缓冲
```

**Q5: 什么是着色器?Vertex Shader 和 Fragment Shader 的区别?**

```
着色器是运行在 GPU 上的小程序,用 GLSL 编写。

Vertex Shader(顶点着色器):
- 每个顶点执行一次
- 负责顶点位置变换
- 计算顶点属性传递给片元着色器

Fragment Shader(片元着色器):
- 每个像素执行一次
- 负责计算最终像素颜色
- 处理纹理采样、光照计算
```

**Q6: Three.js 中如何优化大量物体的渲染?**

```javascript
// 1. 使用 InstancedMesh
const mesh = new THREE.InstancedMesh(geometry, material, count);

// 2. 使用 LOD
const lod = new THREE.LOD();
lod.addLevel(highDetail, 0);
lod.addLevel(lowDetail, 50);

// 3. 合并几何体
const merged = BufferGeometryUtils.mergeGeometries(geometries);

// 4. 使用 GPU 粒子系统(Points)
const points = new THREE.Points(geometry, pointsMaterial);

// 5. 视锥体剔除
object.frustumCulled = true;

// 6. 使用压缩纹理(KTX2/Basis)
```

### 高频考点总结

```
1. Canvas 绘制 API:fillRect, strokeRect, arc, bezierCurveTo
2. Canvas 状态保存:save(), restore()
3. Canvas 像素操作:getImageData, putImageData
4. WebGL 坐标系:右手坐标系,Y 轴向上
5. MVP 矩阵:Model -> View -> Projection
6. 纹理映射:UV 坐标、纹理过滤、mipmap
7. 混合模式:gl.blendFunc, THREE.AdditiveBlending
8. 帧缓冲对象(FBO):离屏渲染、后处理效果
9. Three.js 核心概念:Scene, Camera, Renderer, Mesh
10. 性能优化:批处理、实例化、LOD、对象池
```

---

## 学习资源

### 官方文档
- [MDN Canvas 教程](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API)
- [WebGL 基础](https://webglfundamentals.org/)
- [Three.js 文档](https://threejs.org/docs/)

### 推荐书籍
- 《WebGL 编程指南》
- 《Three.js 开发指南》
- 《实时渲染》(Real-Time Rendering)

### 学习建议

1. **循序渐进**:先掌握 Canvas 2D,再学习 WebGL 基础,最后使用 Three.js
2. **动手实践**:跟着教程写代码,尝试修改参数观察效果
3. **理解数学**:线性代数(向量、矩阵)是 3D 图形的基础
4. **阅读源码**:学习优秀开源项目的代码组织和优化技巧
5. **性能意识**:从一开始就养成性能优化的习惯

---

## 总结

Canvas 和 WebGL 是 Web 图形编程的核心技术。Canvas 2D 适合入门,API 简洁,适用于图表、简单游戏等场景。WebGL 功能强大但学习曲线陡峭,Three.js 等库可以大大降低使用门槛。

掌握这些技术不仅能让你构建丰富的可视化应用,还能深入理解浏览器渲染原理和 GPU 编程,是前端进阶的重要方向。
