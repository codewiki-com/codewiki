---
title: Canvas API 完全指南
description: 深入理解 HTML5 Canvas API：2D 绑定上下文、图形绘制、路径操作、图像处理、动画与像素操作
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - Canvas
  - 图形
  - 动画
  - WebAPI
status: imported
origin: old/src/content/docs/javascript/canvas.zh.md
divergence: 0.189
issues:
  - title-lang-en
  - title-language
legacy:
  category: JavaScript
  subcategory: 浏览器API
  order: 20
  lastUpdated: 2026-01-07
---

Canvas 是 HTML5 引入的强大绑图技术，提供了一个通过 JavaScript 进行动态图形绘制的平台。它广泛应用于游戏开发、数据可视化、图像处理、动画效果等场景。本文将全面介绍 Canvas API 的核心概念与实践技巧。

## 概念解释

### 什么是 Canvas

Canvas（画布）是 HTML5 新增的 `<canvas>` 元素，它提供了一个可以使用脚本（通常是 JavaScript）绑制图形的区域。Canvas 本身只是一个容器，真正的绑图操作需要通过 JavaScript 的绑图 API 来完成。

```html
<!-- 基本的 Canvas 元素 -->
<canvas id="myCanvas" width="800" height="600">
  您的浏览器不支持 Canvas，请升级浏览器。
</canvas>
```

### Canvas vs SVG

| 特性 | Canvas | SVG |
|------|--------|-----|
| 绑图方式 | 基于像素的位图 | 基于矢量的图形 |
| DOM 元素 | 单一元素 | 每个图形都是 DOM 元素 |
| 事件处理 | 需要手动计算位置 | 可直接绑定事件 |
| 缩放质量 | 放大会失真 | 无损缩放 |
| 性能 | 大量图形时更优 | 少量复杂图形时更优 |
| 适用场景 | 游戏、图像处理、动画 | 图表、图标、交互式图形 |

### 历史背景

Canvas 最初由 Apple 在 2004 年为 Mac OS X WebKit 开发，用于支持 Dashboard 小部件和 Safari 浏览器。后来被 HTML5 标准采纳，现已成为 Web 图形绑制的核心技术之一。

## 核心原理

### 绑图上下文

Canvas 元素本身只是一个绘图表面，所有绑图操作都通过"绘图上下文"（Rendering Context）完成。最常用的是 2D 上下文，另外还有用于 3D 绑图的 WebGL 上下文。

```javascript
const canvas = document.getElementById('myCanvas');

// 获取 2D 绑图上下文
const ctx = canvas.getContext('2d');

// 获取 WebGL 上下文（3D 绑图）
const gl = canvas.getContext('webgl');
// 或
const gl2 = canvas.getContext('webgl2');
```

### 坐标系统

Canvas 使用左上角作为原点 (0, 0) 的坐标系统：

- **X 轴**：从左向右递增
- **Y 轴**：从上向下递增

```javascript
// Canvas 坐标系统示意
//
//  (0,0) ────────────→ X
//    │
//    │
//    │
//    ↓
//    Y
```

### 绘制流程

Canvas 的绘制遵循"状态机"模式：

1. **设置状态**：设置颜色、线条宽度、字体等
2. **创建路径**：定义要绘制的形状
3. **绘制**：执行填充（fill）或描边（stroke）操作

```javascript
const ctx = canvas.getContext('2d');

// 1. 设置状态
ctx.fillStyle = '#ff0000';
ctx.strokeStyle = '#0000ff';
ctx.lineWidth = 2;

// 2. 创建路径
ctx.beginPath();
ctx.rect(50, 50, 100, 80);

// 3. 绘制
ctx.fill();   // 填充
ctx.stroke(); // 描边
```

### 像素与设备像素比

现代高分辨率屏幕（如 Retina 显示屏）的设备像素比（devicePixelRatio）大于 1，直接使用 Canvas 会导致图像模糊：

```javascript
function setupHiDPICanvas(canvas, width, height) {
  const dpr = window.devicePixelRatio || 1;

  // 设置 Canvas 的实际像素尺寸
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  // 设置 CSS 显示尺寸
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  // 缩放上下文以匹配
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  return ctx;
}

// 使用示例
const canvas = document.getElementById('myCanvas');
const ctx = setupHiDPICanvas(canvas, 800, 600);
```

## 核心要点

### 2D 上下文属性

```javascript
const ctx = canvas.getContext('2d');

// 填充样式
ctx.fillStyle = 'red';           // 颜色名
ctx.fillStyle = '#ff0000';       // 十六进制
ctx.fillStyle = 'rgb(255,0,0)';  // RGB
ctx.fillStyle = 'rgba(255,0,0,0.5)'; // RGBA（带透明度）

// 描边样式
ctx.strokeStyle = 'blue';

// 线条属性
ctx.lineWidth = 5;                // 线条宽度
ctx.lineCap = 'round';            // 线帽：butt | round | square
ctx.lineJoin = 'round';           // 连接方式：miter | round | bevel
ctx.miterLimit = 10;              // 斜接限制
ctx.setLineDash([5, 10]);         // 虚线模式
ctx.lineDashOffset = 0;           // 虚线偏移

// 阴影
ctx.shadowColor = 'rgba(0,0,0,0.5)';
ctx.shadowBlur = 10;
ctx.shadowOffsetX = 5;
ctx.shadowOffsetY = 5;

// 透明度
ctx.globalAlpha = 0.5;

// 合成操作
ctx.globalCompositeOperation = 'source-over'; // 默认值
```

### 基本图形绘制

```javascript
// 矩形（唯一可以直接绘制的图形）
ctx.fillRect(x, y, width, height);    // 填充矩形
ctx.strokeRect(x, y, width, height);  // 描边矩形
ctx.clearRect(x, y, width, height);   // 清除矩形区域

// 绘制矩形示例
ctx.fillStyle = '#3498db';
ctx.fillRect(50, 50, 200, 100);

ctx.strokeStyle = '#e74c3c';
ctx.lineWidth = 3;
ctx.strokeRect(300, 50, 200, 100);
```

### 路径绑制

路径是 Canvas 绑图的核心，几乎所有复杂图形都通过路径来实现：

```javascript
// 路径的基本流程
ctx.beginPath();           // 开始新路径
ctx.moveTo(x, y);          // 移动到起点
ctx.lineTo(x, y);          // 画线到指定点
ctx.closePath();           // 闭合路径（可选）
ctx.stroke();              // 描边
ctx.fill();                // 填充

// 绘制三角形
ctx.beginPath();
ctx.moveTo(100, 50);       // 顶点
ctx.lineTo(50, 150);       // 左下角
ctx.lineTo(150, 150);      // 右下角
ctx.closePath();           // 自动连接回起点
ctx.fillStyle = '#2ecc71';
ctx.fill();
```

### 圆形与圆弧

```javascript
// arc(x, y, radius, startAngle, endAngle, counterclockwise)
// 角度使用弧度，counterclockwise 表示是否逆时针

// 完整圆形
ctx.beginPath();
ctx.arc(150, 150, 50, 0, Math.PI * 2);
ctx.fillStyle = '#9b59b6';
ctx.fill();

// 半圆
ctx.beginPath();
ctx.arc(300, 150, 50, 0, Math.PI);
ctx.stroke();

// 扇形
ctx.beginPath();
ctx.moveTo(450, 150);  // 移动到圆心
ctx.arc(450, 150, 50, 0, Math.PI / 2);
ctx.closePath();
ctx.fill();

// 绘制多个圆弧组成的图形
function drawPieChart(ctx, x, y, radius, data) {
  let startAngle = -Math.PI / 2;

  data.forEach(({ value, color }) => {
    const sliceAngle = (value / 100) * Math.PI * 2;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    startAngle += sliceAngle;
  });
}
```

### 贝塞尔曲线

```javascript
// 二次贝塞尔曲线
// quadraticCurveTo(cpx, cpy, x, y)
// cpx, cpy: 控制点坐标
// x, y: 终点坐标
ctx.beginPath();
ctx.moveTo(50, 200);
ctx.quadraticCurveTo(150, 50, 250, 200);
ctx.stroke();

// 三次贝塞尔曲线
// bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
ctx.beginPath();
ctx.moveTo(300, 200);
ctx.bezierCurveTo(350, 50, 450, 350, 500, 200);
ctx.stroke();

// 绘制心形
function drawHeart(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);

  // 左半部分
  ctx.bezierCurveTo(
    x, y,
    x - size / 2, y,
    x - size / 2, y + size / 4
  );
  ctx.bezierCurveTo(
    x - size / 2, y + size / 2,
    x, y + size * 3/4,
    x, y + size
  );

  // 右半部分
  ctx.bezierCurveTo(
    x, y + size * 3/4,
    x + size / 2, y + size / 2,
    x + size / 2, y + size / 4
  );
  ctx.bezierCurveTo(
    x + size / 2, y,
    x, y,
    x, y + size / 4
  );

  ctx.fillStyle = '#e74c3c';
  ctx.fill();
}
```

### 文本绑制

```javascript
// 设置字体
ctx.font = '24px Arial';
ctx.font = 'bold 32px "Microsoft YaHei"';
ctx.font = 'italic 20px sans-serif';

// 文本对齐
ctx.textAlign = 'center';      // left | center | right | start | end
ctx.textBaseline = 'middle';   // top | hanging | middle | alphabetic | ideographic | bottom

// 绘制文本
ctx.fillStyle = '#333';
ctx.fillText('Hello Canvas!', 400, 300);          // 填充文本
ctx.strokeText('Hello Canvas!', 400, 350);        // 描边文本
ctx.fillText('限制宽度', 400, 400, 100);          // 限制最大宽度

// 测量文本
const text = 'Hello World';
const metrics = ctx.measureText(text);
console.log('文本宽度:', metrics.width);
console.log('实际边界盒:', metrics.actualBoundingBoxLeft, metrics.actualBoundingBoxRight);
```

### 渐变与图案

```javascript
// 线性渐变
const linearGradient = ctx.createLinearGradient(0, 0, 200, 0);
linearGradient.addColorStop(0, '#ff0000');
linearGradient.addColorStop(0.5, '#00ff00');
linearGradient.addColorStop(1, '#0000ff');
ctx.fillStyle = linearGradient;
ctx.fillRect(50, 50, 200, 100);

// 径向渐变
const radialGradient = ctx.createRadialGradient(350, 100, 10, 350, 100, 80);
radialGradient.addColorStop(0, '#fff');
radialGradient.addColorStop(1, '#3498db');
ctx.fillStyle = radialGradient;
ctx.beginPath();
ctx.arc(350, 100, 80, 0, Math.PI * 2);
ctx.fill();

// 图案填充
const img = new Image();
img.onload = function() {
  const pattern = ctx.createPattern(img, 'repeat'); // repeat | repeat-x | repeat-y | no-repeat
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 200, 400, 200);
};
img.src = 'texture.png';
```

## 代码示例

### 绘制完整的图表

```javascript
// 绘制柱状图
function drawBarChart(ctx, data, options = {}) {
  const {
    x = 50,
    y = 50,
    width = 400,
    height = 300,
    barColor = '#3498db',
    labelColor = '#333',
    gridColor = '#eee'
  } = options;

  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = width / data.length * 0.6;
  const gap = width / data.length * 0.4;

  // 绘制网格线
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const lineY = y + height - (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(x, lineY);
    ctx.lineTo(x + width, lineY);
    ctx.stroke();
  }

  // 绘制柱形
  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * height;
    const barX = x + (barWidth + gap) * index + gap / 2;
    const barY = y + height - barHeight;

    // 绘制渐变柱形
    const gradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
    gradient.addColorStop(0, barColor);
    gradient.addColorStop(1, '#2980b9');

    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // 绘制标签
    ctx.fillStyle = labelColor;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(item.label, barX + barWidth / 2, y + height + 20);
    ctx.fillText(item.value, barX + barWidth / 2, barY - 5);
  });
}

// 使用示例
const chartData = [
  { label: '一月', value: 65 },
  { label: '二月', value: 45 },
  { label: '三月', value: 85 },
  { label: '四月', value: 55 },
  { label: '五月', value: 95 }
];

drawBarChart(ctx, chartData, {
  x: 50,
  y: 50,
  width: 500,
  height: 300
});
```

### 图像处理

```javascript
// 加载并绘制图像
const img = new Image();
img.onload = function() {
  // 基本绘制
  ctx.drawImage(img, 0, 0);

  // 指定尺寸绘制
  ctx.drawImage(img, 0, 0, 200, 150);

  // 裁剪并绘制
  // drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  ctx.drawImage(img,
    50, 50, 100, 100,  // 源图像裁剪区域
    0, 0, 200, 200     // 目标绑制区域
  );
};
img.src = 'photo.jpg';

// 图像缩放与旋转
function drawRotatedImage(ctx, img, x, y, width, height, angle) {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(angle * Math.PI / 180);
  ctx.drawImage(img, -width / 2, -height / 2, width, height);
  ctx.restore();
}
```

### 像素操作

```javascript
// 获取像素数据
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const data = imageData.data; // Uint8ClampedArray

// 像素数据格式：[R, G, B, A, R, G, B, A, ...]
// 每个像素占用 4 个字节

// 灰度化处理
for (let i = 0; i < data.length; i += 4) {
  const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
  data[i] = avg;     // R
  data[i + 1] = avg; // G
  data[i + 2] = avg; // B
  // data[i + 3] 是 Alpha 通道，保持不变
}

// 将处理后的数据写回
ctx.putImageData(imageData, 0, 0);

// 反色处理
function invertColors(ctx, x, y, width, height) {
  const imageData = ctx.getImageData(x, y, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];       // R
    data[i + 1] = 255 - data[i + 1]; // G
    data[i + 2] = 255 - data[i + 2]; // B
  }

  ctx.putImageData(imageData, x, y);
}

// 模糊效果（简单的盒式模糊）
function boxBlur(ctx, x, y, width, height, radius) {
  const imageData = ctx.getImageData(x, y, width, height);
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      let r = 0, g = 0, b = 0, count = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = px + dx;
          const ny = py + dy;

          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const i = (ny * width + nx) * 4;
            r += copy[i];
            g += copy[i + 1];
            b += copy[i + 2];
            count++;
          }
        }
      }

      const i = (py * width + px) * 4;
      data[i] = r / count;
      data[i + 1] = g / count;
      data[i + 2] = b / count;
    }
  }

  ctx.putImageData(imageData, x, y);
}
```

### 动画实现

```javascript
// 基础动画循环
let animationId;
let lastTime = 0;

function animate(currentTime) {
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  // 清除画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 更新和绘制
  update(deltaTime);
  draw();

  // 继续下一帧
  animationId = requestAnimationFrame(animate);
}

// 启动动画
animationId = requestAnimationFrame(animate);

// 停止动画
cancelAnimationFrame(animationId);

// 弹跳球动画示例
class Ball {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 10;
    this.vy = (Math.random() - 0.5) * 10;
    this.gravity = 0.5;
    this.friction = 0.99;
    this.bounce = 0.8;
  }

  update(width, height) {
    // 应用重力
    this.vy += this.gravity;

    // 应用摩擦力
    this.vx *= this.friction;
    this.vy *= this.friction;

    // 更新位置
    this.x += this.vx;
    this.y += this.vy;

    // 边界碰撞检测
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = -this.vx * this.bounce;
    }
    if (this.x + this.radius > width) {
      this.x = width - this.radius;
      this.vx = -this.vx * this.bounce;
    }
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy = -this.vy * this.bounce;
    }
    if (this.y + this.radius > height) {
      this.y = height - this.radius;
      this.vy = -this.vy * this.bounce;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

// 粒子系统示例
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 5 + 2;
    this.speedX = Math.random() * 3 - 1.5;
    this.speedY = Math.random() * 3 - 1.5;
    this.life = 1;
    this.decay = Math.random() * 0.02 + 0.01;
    this.color = `hsl(${Math.random() * 60 + 10}, 100%, 50%)`;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.globalAlpha = this.life;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y));
    }
  }

  update() {
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => p.update());
  }

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  }
}
```

### 变换操作

```javascript
// 平移
ctx.translate(100, 100);

// 旋转（弧度）
ctx.rotate(Math.PI / 4);

// 缩放
ctx.scale(2, 2);

// 变换矩阵
// transform(a, b, c, d, e, f)
// | a c e |
// | b d f |
// | 0 0 1 |
ctx.transform(1, 0, 0, 1, 100, 100); // 相当于 translate

// 重置变换
ctx.setTransform(1, 0, 0, 1, 0, 0);

// 保存和恢复状态
ctx.save();
ctx.translate(200, 200);
ctx.rotate(Math.PI / 4);
ctx.fillRect(-50, -50, 100, 100);
ctx.restore(); // 恢复之前的状态

// 绘制旋转的矩形
function drawRotatedRect(ctx, x, y, width, height, angle) {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(angle * Math.PI / 180);
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.restore();
}

// 绘制围绕某点旋转的图形
function drawOrbitingCircle(ctx, centerX, centerY, orbitRadius, circleRadius, angle) {
  const x = centerX + Math.cos(angle) * orbitRadius;
  const y = centerY + Math.sin(angle) * orbitRadius;

  ctx.beginPath();
  ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
  ctx.fill();
}
```

### 裁剪区域

```javascript
// 使用路径作为裁剪区域
ctx.beginPath();
ctx.arc(200, 200, 100, 0, Math.PI * 2);
ctx.clip();

// 之后的所有绑制都会被限制在圆形区域内
ctx.fillStyle = '#3498db';
ctx.fillRect(0, 0, 400, 400);

// 绘制图像在圆形区域内
ctx.save();
ctx.beginPath();
ctx.arc(200, 200, 100, 0, Math.PI * 2);
ctx.clip();
ctx.drawImage(img, 100, 100, 200, 200);
ctx.restore();

// 创建圆形头像
function drawCircularAvatar(ctx, img, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}
```

## 最佳实践

### 使用 requestAnimationFrame

```javascript
// 推荐：使用 requestAnimationFrame
function animate() {
  // 绑制逻辑
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// 不推荐：使用 setInterval/setTimeout
// setInterval(() => {
//   // 绘制逻辑
// }, 16);
```

### 批量操作路径

```javascript
// 推荐：批量绑制同类型图形
ctx.beginPath();
ctx.fillStyle = '#3498db';
for (let i = 0; i < 100; i++) {
  ctx.rect(i * 10, 0, 8, 50);
}
ctx.fill();

// 不推荐：每次单独绘制
// for (let i = 0; i < 100; i++) {
//   ctx.fillStyle = '#3498db';
//   ctx.fillRect(i * 10, 0, 8, 50);
// }
```

### 使用离屏 Canvas

```javascript
// 创建离屏 Canvas 缓存复杂图形
const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = 200;
offscreenCanvas.height = 200;
const offCtx = offscreenCanvas.getContext('2d');

// 在离屏 Canvas 上绘制复杂图形（只需绘制一次）
function renderComplexShape(ctx) {
  ctx.beginPath();
  // ... 复杂的绘制操作
  ctx.fill();
}
renderComplexShape(offCtx);

// 主 Canvas 上直接使用缓存的图像
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(offscreenCanvas, x, y);
  requestAnimationFrame(draw);
}
```

### 避免不必要的状态变化

```javascript
// 推荐：按状态分组绑制
const blueItems = items.filter(i => i.color === 'blue');
const redItems = items.filter(i => i.color === 'red');

ctx.fillStyle = 'blue';
blueItems.forEach(item => ctx.fillRect(item.x, item.y, 10, 10));

ctx.fillStyle = 'red';
redItems.forEach(item => ctx.fillRect(item.x, item.y, 10, 10));

// 不推荐：频繁切换状态
// items.forEach(item => {
//   ctx.fillStyle = item.color;
//   ctx.fillRect(item.x, item.y, 10, 10);
// });
```

### 正确处理设备像素比

```javascript
function createHiDPICanvas(width, height) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(dpr, dpr);

  return { canvas, ctx };
}
```

### 使用 save() 和 restore()

```javascript
// 推荐：使用 save/restore 隔离变换
function drawRotatedRect(ctx, x, y, w, h, angle) {
  ctx.save();
  ctx.translate(x + w/2, y + h/2);
  ctx.rotate(angle);
  ctx.fillRect(-w/2, -h/2, w, h);
  ctx.restore();
}

// 不推荐：手动恢复状态
// ctx.translate(x + w/2, y + h/2);
// ctx.rotate(angle);
// ctx.fillRect(-w/2, -h/2, w, h);
// ctx.rotate(-angle);
// ctx.translate(-(x + w/2), -(y + h/2));
```

## 常见陷阱

### Canvas 尺寸设置错误

```javascript
// 错误：使用 CSS 设置尺寸会导致拉伸变形
// canvas { width: 800px; height: 600px; }

// 正确：使用属性设置尺寸
canvas.width = 800;
canvas.height = 600;

// 或在 HTML 中设置
// <canvas width="800" height="600"></canvas>
```

### 路径未重置

```javascript
// 错误：路径累积
ctx.moveTo(0, 0);
ctx.lineTo(100, 100);
ctx.stroke();
ctx.moveTo(200, 0);
ctx.lineTo(300, 100);
ctx.stroke(); // 会绘制两条线

// 正确：每次新路径前调用 beginPath()
ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(100, 100);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(200, 0);
ctx.lineTo(300, 100);
ctx.stroke();
```

### 图像加载时机

```javascript
// 错误：图像未加载就绘制
const img = new Image();
img.src = 'image.png';
ctx.drawImage(img, 0, 0); // 可能什么都不显示

// 正确：等待图像加载完成
const img = new Image();
img.onload = function() {
  ctx.drawImage(img, 0, 0);
};
img.src = 'image.png';

// 或使用 Promise
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
```

### 半像素渲染模糊

```javascript
// 问题：在非整数坐标绘制会导致模糊
ctx.strokeRect(10.5, 10.5, 100, 100); // 模糊

// 解决：对于 1 像素线条，使用 0.5 偏移
ctx.strokeRect(10.5, 10.5, 100, 100); // 实际上这是正确的
// 或使用整数坐标 + translate
ctx.translate(0.5, 0.5);
ctx.strokeRect(10, 10, 100, 100);
```

### 跨域图像处理

```javascript
// 错误：跨域图像无法获取像素数据
const img = new Image();
img.src = 'https://other-domain.com/image.png';
// 调用 getImageData 会报错

// 正确：设置 crossOrigin 属性
const img = new Image();
img.crossOrigin = 'anonymous';
img.src = 'https://other-domain.com/image.png';
// 服务器也需要设置正确的 CORS 头
```

### 忘记清除画布

```javascript
// 错误：动画中不清除画布
function animate() {
  // 直接绘制，导致画面叠加
  ctx.fillRect(x++, 100, 50, 50);
  requestAnimationFrame(animate);
}

// 正确：每帧清除画布
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(x++, 100, 50, 50);
  requestAnimationFrame(animate);
}
```

## 性能考量

### 减少绘制区域

```javascript
// 只清除和重绘变化的区域
function optimizedDraw() {
  // 清除上一帧物体所在区域
  ctx.clearRect(prevX - 5, prevY - 5, width + 10, height + 10);

  // 绘制新位置
  ctx.fillRect(x, y, width, height);

  prevX = x;
  prevY = y;
}
```

### 使用多层 Canvas

```javascript
// 静态背景层
const bgCanvas = document.getElementById('background');
const bgCtx = bgCanvas.getContext('2d');
drawBackground(bgCtx); // 只绘制一次

// 动态前景层
const fgCanvas = document.getElementById('foreground');
const fgCtx = fgCanvas.getContext('2d');
function animate() {
  fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
  drawDynamicContent(fgCtx);
  requestAnimationFrame(animate);
}
```

### 使用 OffscreenCanvas（Web Worker）

```javascript
// 主线程
const canvas = document.getElementById('canvas');
const offscreen = canvas.transferControlToOffscreen();

const worker = new Worker('canvas-worker.js');
worker.postMessage({ canvas: offscreen }, [offscreen]);

// canvas-worker.js
self.onmessage = function(e) {
  const canvas = e.data.canvas;
  const ctx = canvas.getContext('2d');

  function draw() {
    // 绑制逻辑
    requestAnimationFrame(draw);
  }
  draw();
};
```

### 避免频繁的 getImageData

```javascript
// 不推荐：动画中频繁调用
function animate() {
  const imageData = ctx.getImageData(0, 0, width, height); // 慢
  // 处理
  ctx.putImageData(imageData, 0, 0);
  requestAnimationFrame(animate);
}

// 推荐：减少调用频率或使用 WebGL
```

### 使用整数坐标

```javascript
// 推荐：使用整数坐标提高性能
const x = Math.round(floatX);
const y = Math.round(floatY);
ctx.fillRect(x, y, 100, 100);
```

### 性能监控

```javascript
// 帧率监控
class FPSCounter {
  constructor() {
    this.fps = 0;
    this.frames = 0;
    this.lastTime = performance.now();
  }

  update() {
    this.frames++;
    const currentTime = performance.now();

    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frames;
      this.frames = 0;
      this.lastTime = currentTime;
    }

    return this.fps;
  }
}

const fpsCounter = new FPSCounter();

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制内容
  // ...

  // 显示帧率
  ctx.fillStyle = '#000';
  ctx.font = '16px Arial';
  ctx.fillText(`FPS: ${fpsCounter.update()}`, 10, 20);

  requestAnimationFrame(animate);
}
```

## 实战场景

### 签名画板

```javascript
class SignaturePad {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;

    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.bindEvents();
  }

  bindEvents() {
    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

    // 触摸支持
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startDrawing({ offsetX: touch.clientX - this.canvas.offsetLeft,
                          offsetY: touch.clientY - this.canvas.offsetTop });
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.draw({ offsetX: touch.clientX - this.canvas.offsetLeft,
                  offsetY: touch.clientY - this.canvas.offsetTop });
    });
    this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
  }

  startDrawing(e) {
    this.isDrawing = true;
    this.lastX = e.offsetX;
    this.lastY = e.offsetY;
  }

  draw(e) {
    if (!this.isDrawing) return;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(e.offsetX, e.offsetY);
    this.ctx.stroke();

    this.lastX = e.offsetX;
    this.lastY = e.offsetY;
  }

  stopDrawing() {
    this.isDrawing = false;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  toDataURL() {
    return this.canvas.toDataURL('image/png');
  }
}

// 使用
const pad = new SignaturePad(document.getElementById('signature'));
```

### 图片裁剪器

```javascript
class ImageCropper {
  constructor(canvas, image) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.image = image;

    this.cropArea = {
      x: 50,
      y: 50,
      width: 200,
      height: 200
    };

    this.isDragging = false;
    this.isResizing = false;
    this.dragStart = { x: 0, y: 0 };

    this.draw();
    this.bindEvents();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 绘制原图
    this.ctx.drawImage(this.image, 0, 0);

    // 绘制遮罩
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 清除裁剪区域的遮罩
    this.ctx.clearRect(
      this.cropArea.x,
      this.cropArea.y,
      this.cropArea.width,
      this.cropArea.height
    );

    // 重绘裁剪区域的图像
    this.ctx.drawImage(
      this.image,
      this.cropArea.x, this.cropArea.y, this.cropArea.width, this.cropArea.height,
      this.cropArea.x, this.cropArea.y, this.cropArea.width, this.cropArea.height
    );

    // 绘制裁剪框边框
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      this.cropArea.x,
      this.cropArea.y,
      this.cropArea.width,
      this.cropArea.height
    );

    // 绘制调整手柄
    this.drawHandles();
  }

  drawHandles() {
    const handles = this.getHandles();
    this.ctx.fillStyle = '#fff';

    Object.values(handles).forEach(handle => {
      this.ctx.fillRect(handle.x - 5, handle.y - 5, 10, 10);
    });
  }

  getHandles() {
    const { x, y, width, height } = this.cropArea;
    return {
      topLeft: { x, y },
      topRight: { x: x + width, y },
      bottomLeft: { x, y: y + height },
      bottomRight: { x: x + width, y: y + height }
    };
  }

  crop() {
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = this.cropArea.width;
    croppedCanvas.height = this.cropArea.height;

    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCtx.drawImage(
      this.image,
      this.cropArea.x, this.cropArea.y, this.cropArea.width, this.cropArea.height,
      0, 0, this.cropArea.width, this.cropArea.height
    );

    return croppedCanvas.toDataURL();
  }

  bindEvents() {
    // 实现拖拽和缩放逻辑
    // ...
  }
}
```

### 数据可视化仪表盘

```javascript
class GaugeChart {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.options = {
      min: 0,
      max: 100,
      value: 0,
      colors: ['#2ecc71', '#f1c40f', '#e74c3c'],
      thresholds: [33, 66, 100],
      ...options
    };

    this.animatedValue = 0;
  }

  draw() {
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height * 0.6;
    const radius = Math.min(width, height) * 0.4;

    this.ctx.clearRect(0, 0, width, height);

    // 绘制背景弧
    this.drawArc(centerX, centerY, radius, '#eee', Math.PI, 2 * Math.PI);

    // 绘制值弧
    const percentage = (this.animatedValue - this.options.min) /
                       (this.options.max - this.options.min);
    const endAngle = Math.PI + percentage * Math.PI;
    const color = this.getColor(percentage * 100);

    this.drawArc(centerX, centerY, radius, color, Math.PI, endAngle);

    // 绘制指针
    this.drawNeedle(centerX, centerY, radius * 0.8, endAngle);

    // 绘制中心圆
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius * 0.1, 0, Math.PI * 2);
    this.ctx.fillStyle = '#333';
    this.ctx.fill();

    // 绘制值文本
    this.ctx.font = `bold ${radius * 0.3}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = '#333';
    this.ctx.fillText(
      Math.round(this.animatedValue).toString(),
      centerX,
      centerY + radius * 0.2
    );
  }

  drawArc(x, y, radius, color, startAngle, endAngle) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, startAngle, endAngle);
    this.ctx.lineWidth = radius * 0.15;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = color;
    this.ctx.stroke();
  }

  drawNeedle(x, y, length, angle) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle - Math.PI / 2);

    this.ctx.beginPath();
    this.ctx.moveTo(0, -length);
    this.ctx.lineTo(-5, 0);
    this.ctx.lineTo(5, 0);
    this.ctx.closePath();
    this.ctx.fillStyle = '#333';
    this.ctx.fill();

    this.ctx.restore();
  }

  getColor(percentage) {
    for (let i = 0; i < this.options.thresholds.length; i++) {
      if (percentage <= this.options.thresholds[i]) {
        return this.options.colors[i];
      }
    }
    return this.options.colors[this.options.colors.length - 1];
  }

  setValue(value, animate = true) {
    if (animate) {
      const startValue = this.animatedValue;
      const endValue = Math.max(this.options.min, Math.min(this.options.max, value));
      const duration = 1000;
      const startTime = performance.now();

      const animateValue = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 缓动函数
        const easeOut = 1 - Math.pow(1 - progress, 3);
        this.animatedValue = startValue + (endValue - startValue) * easeOut;

        this.draw();

        if (progress < 1) {
          requestAnimationFrame(animateValue);
        }
      };

      requestAnimationFrame(animateValue);
    } else {
      this.animatedValue = value;
      this.draw();
    }
  }
}

// 使用
const gauge = new GaugeChart(document.getElementById('gauge'), {
  min: 0,
  max: 100,
  colors: ['#2ecc71', '#f1c40f', '#e74c3c'],
  thresholds: [40, 70, 100]
});
gauge.setValue(75);
```

### 简单游戏示例

```javascript
class FlappyBirdGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    this.bird = {
      x: 100,
      y: this.height / 2,
      velocity: 0,
      gravity: 0.5,
      jump: -10,
      size: 30
    };

    this.pipes = [];
    this.pipeWidth = 60;
    this.pipeGap = 150;
    this.pipeSpeed = 3;

    this.score = 0;
    this.gameOver = false;

    this.bindEvents();
    this.spawnPipe();
    this.gameLoop();
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        if (this.gameOver) {
          this.reset();
        } else {
          this.bird.velocity = this.bird.jump;
        }
      }
    });

    this.canvas.addEventListener('click', () => {
      if (this.gameOver) {
        this.reset();
      } else {
        this.bird.velocity = this.bird.jump;
      }
    });
  }

  spawnPipe() {
    const minHeight = 50;
    const maxHeight = this.height - this.pipeGap - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

    this.pipes.push({
      x: this.width,
      topHeight: topHeight,
      bottomY: topHeight + this.pipeGap,
      passed: false
    });
  }

  update() {
    if (this.gameOver) return;

    // 更新鸟的位置
    this.bird.velocity += this.bird.gravity;
    this.bird.y += this.bird.velocity;

    // 检查边界碰撞
    if (this.bird.y < 0 || this.bird.y + this.bird.size > this.height) {
      this.gameOver = true;
      return;
    }

    // 更新管道
    this.pipes.forEach(pipe => {
      pipe.x -= this.pipeSpeed;

      // 检查得分
      if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
        pipe.passed = true;
        this.score++;
      }

      // 检查碰撞
      if (this.checkCollision(pipe)) {
        this.gameOver = true;
      }
    });

    // 移除屏幕外的管道
    this.pipes = this.pipes.filter(pipe => pipe.x + this.pipeWidth > 0);

    // 生成新管道
    if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.width - 200) {
      this.spawnPipe();
    }
  }

  checkCollision(pipe) {
    const birdLeft = this.bird.x;
    const birdRight = this.bird.x + this.bird.size;
    const birdTop = this.bird.y;
    const birdBottom = this.bird.y + this.bird.size;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + this.pipeWidth;

    // 检查是否在管道 x 范围内
    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      // 检查是否碰到上管道或下管道
      if (birdTop < pipe.topHeight || birdBottom > pipe.bottomY) {
        return true;
      }
    }

    return false;
  }

  draw() {
    // 清除画布
    this.ctx.fillStyle = '#70c5ce';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 绘制管道
    this.ctx.fillStyle = '#73bf2e';
    this.pipes.forEach(pipe => {
      // 上管道
      this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
      // 下管道
      this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.height - pipe.bottomY);
    });

    // 绘制鸟
    this.ctx.fillStyle = '#f1c40f';
    this.ctx.beginPath();
    this.ctx.arc(
      this.bird.x + this.bird.size / 2,
      this.bird.y + this.bird.size / 2,
      this.bird.size / 2,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // 绘制分数
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.score, this.width / 2, 80);

    // 游戏结束画面
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('Game Over', this.width / 2, this.height / 2 - 30);
      this.ctx.font = '24px Arial';
      this.ctx.fillText('点击或按空格重新开始', this.width / 2, this.height / 2 + 30);
    }
  }

  gameLoop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.gameLoop());
  }

  reset() {
    this.bird.y = this.height / 2;
    this.bird.velocity = 0;
    this.pipes = [];
    this.score = 0;
    this.gameOver = false;
    this.spawnPipe();
  }
}

// 启动游戏
const game = new FlappyBirdGame(document.getElementById('gameCanvas'));
```

## 面试要点

### Canvas 和 SVG 的区别是什么？

**答案要点**：

- **Canvas** 是基于像素的位图绘制，适合大量图形、游戏、图像处理
- **SVG** 是基于矢量的图形，每个元素都是 DOM 节点，适合图表、图标
- Canvas 性能在大量简单图形时更优，SVG 在少量复杂图形时更优
- Canvas 不支持事件绑定到具体图形，需要手动计算位置
- SVG 可无损缩放，Canvas 放大会失真

### 如何优化 Canvas 动画性能？

**答案要点**：

```javascript
// 1. 使用 requestAnimationFrame
requestAnimationFrame(animate);

// 2. 使用离屏 Canvas 缓存
const offscreen = document.createElement('canvas');

// 3. 减少绘制区域
ctx.clearRect(dirtyX, dirtyY, dirtyWidth, dirtyHeight);

// 4. 使用分层 Canvas
// 静态层 + 动态层

// 5. 批量绘制同类型图形
ctx.beginPath();
for (...) { ctx.rect(...); }
ctx.fill();

// 6. 使用整数坐标
const x = Math.round(floatX);

// 7. 使用 OffscreenCanvas (Web Worker)
const offscreen = canvas.transferControlToOffscreen();
```

### getContext('2d') 返回什么？有哪些重要属性和方法？

**答案要点**：

返回 `CanvasRenderingContext2D` 对象：

```javascript
// 重要属性
ctx.fillStyle       // 填充样式
ctx.strokeStyle     // 描边样式
ctx.lineWidth       // 线条宽度
ctx.font            // 字体
ctx.globalAlpha     // 全局透明度
ctx.globalCompositeOperation // 合成操作

// 重要方法
ctx.fillRect()      // 填充矩形
ctx.strokeRect()    // 描边矩形
ctx.clearRect()     // 清除区域
ctx.beginPath()     // 开始路径
ctx.moveTo()        // 移动到
ctx.lineTo()        // 画线到
ctx.arc()           // 圆弧
ctx.fill()          // 填充
ctx.stroke()        // 描边
ctx.drawImage()     // 绘制图像
ctx.getImageData()  // 获取像素数据
ctx.putImageData()  // 写入像素数据
ctx.save()          // 保存状态
ctx.restore()       // 恢复状态
ctx.translate()     // 平移
ctx.rotate()        // 旋转
ctx.scale()         // 缩放
```

### 如何实现图像的灰度化处理？

```javascript
const imageData = ctx.getImageData(0, 0, width, height);
const data = imageData.data;

for (let i = 0; i < data.length; i += 4) {
  // 方法1：平均值
  const avg = (data[i] + data[i+1] + data[i+2]) / 3;

  // 方法2：加权平均（更符合人眼感知）
  const gray = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;

  data[i] = gray;     // R
  data[i+1] = gray;   // G
  data[i+2] = gray;   // B
  // data[i+3] 是 Alpha，保持不变
}

ctx.putImageData(imageData, 0, 0);
```

### Canvas 如何处理高 DPI 屏幕？

```javascript
function setupHiDPICanvas(canvas, width, height) {
  const dpr = window.devicePixelRatio || 1;

  // 设置实际像素尺寸
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  // 设置 CSS 显示尺寸
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  // 缩放上下文
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  return ctx;
}
```

### requestAnimationFrame 和 setInterval 的区别？

**答案要点**：

| 特性 | requestAnimationFrame | setInterval |
|------|----------------------|-------------|
| 刷新率 | 与显示器同步（通常 60fps） | 固定间隔 |
| 后台行为 | 暂停以节省资源 | 继续执行 |
| 性能 | 浏览器优化，更流畅 | 可能造成掉帧 |
| 精确度 | 高时间精度 | 受任务队列影响 |
| 用途 | 动画 | 定时任务 |

## 延伸阅读

### 官方文档

- [MDN Canvas API 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API)
- [HTML Living Standard - Canvas](https://html.spec.whatwg.org/multipage/canvas.html)
- [W3C Canvas 2D Context 规范](https://www.w3.org/TR/2dcontext/)

### 推荐书籍

- 《HTML5 Canvas 核心技术》- David Geary
- 《Foundation HTML5 Canvas: For Games and Entertainment》- Rob Hawkes
- 《HTML5 Canvas Cookbook》- Eric Rowell

### 优质教程

- [Canvas 教程 - MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial)
- [HTML5 Canvas 教程 - W3School](https://www.w3school.com.cn/html5/html5_canvas.asp)

### 相关库与框架

- **Fabric.js** - 强大的 Canvas 库，支持交互式对象
- **Konva.js** - 2D 绘图库，支持事件、动画、节点嵌套
- **PixiJS** - 高性能 2D 渲染引擎
- **Three.js** - 3D 图形库（使用 WebGL）
- **P5.js** - 创意编程库
- **Chart.js** - 基于 Canvas 的图表库
- **ECharts** - 可视化图表库
