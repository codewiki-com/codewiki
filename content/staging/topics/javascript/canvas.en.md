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
origin: old/src/content/docs/javascript/canvas.en.md
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

Canvas is a powerful drawing technology introduced in HTML5, providing a platform for dynamic graphics rendering through JavaScript. It is widely used in game development, data visualization, image processing, animation effects, and more. This article comprehensively covers the core concepts and practical techniques of the Canvas API.

## Concept Explanation

### What is Canvas

Canvas is the `<canvas>` element added in HTML5, which provides an area for drawing graphics using scripts (usually JavaScript). Canvas itself is just a container; the actual drawing operations are performed through JavaScript's drawing API.

```html
<!-- Basic Canvas Element -->
<canvas id="myCanvas" width="800" height="600">
  Your browser does not support Canvas. Please upgrade your browser.
</canvas>
```

### Canvas vs SVG

| Feature | Canvas | SVG |
|---------|--------|-----|
| Drawing Method | Pixel-based bitmap | Vector-based graphics |
| DOM Elements | Single element | Each shape is a DOM element |
| Event Handling | Requires manual position calculation | Events can be bound directly |
| Scaling Quality | Loses quality when scaled up | Lossless scaling |
| Performance | Better for large numbers of graphics | Better for fewer complex graphics |
| Use Cases | Games, image processing, animation | Charts, icons, interactive graphics |

### Historical Background

Canvas was originally developed by Apple in 2004 for Mac OS X WebKit to support Dashboard widgets and the Safari browser. It was later adopted by the HTML5 standard and has become one of the core technologies for web graphics rendering.

## Core Principles

### Rendering Context

The Canvas element itself is just a drawing surface; all drawing operations are performed through the "rendering context." The most commonly used is the 2D context, and there is also the WebGL context for 3D rendering.

```javascript
const canvas = document.getElementById('myCanvas');

// Get 2D rendering context
const ctx = canvas.getContext('2d');

// Get WebGL context (3D rendering)
const gl = canvas.getContext('webgl');
// or
const gl2 = canvas.getContext('webgl2');
```

### Coordinate System

Canvas uses a coordinate system with the origin (0, 0) at the top-left corner:

- **X-axis**: Increases from left to right
- **Y-axis**: Increases from top to bottom

```javascript
// Canvas coordinate system diagram
//
//  (0,0) ────────────→ X
//    │
//    │
//    │
//    ↓
//    Y
```

### Drawing Flow

Canvas drawing follows a "state machine" pattern:

1. **Set State**: Configure colors, line width, font, etc.
2. **Create Path**: Define the shapes to draw
3. **Draw**: Execute fill or stroke operations

```javascript
const ctx = canvas.getContext('2d');

// 1. Set state
ctx.fillStyle = '#ff0000';
ctx.strokeStyle = '#0000ff';
ctx.lineWidth = 2;

// 2. Create path
ctx.beginPath();
ctx.rect(50, 50, 100, 80);

// 3. Draw
ctx.fill();   // Fill
ctx.stroke(); // Stroke
```

### Pixels and Device Pixel Ratio

Modern high-resolution screens (like Retina displays) have a device pixel ratio (devicePixelRatio) greater than 1. Using Canvas directly can result in blurry images:

```javascript
function setupHiDPICanvas(canvas, width, height) {
  const dpr = window.devicePixelRatio || 1;

  // Set the actual pixel dimensions of the Canvas
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  // Set CSS display dimensions
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  // Scale the context to match
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  return ctx;
}

// Usage example
const canvas = document.getElementById('myCanvas');
const ctx = setupHiDPICanvas(canvas, 800, 600);
```

## Core Concepts

### 2D Context Properties

```javascript
const ctx = canvas.getContext('2d');

// Fill style
ctx.fillStyle = 'red';           // Color name
ctx.fillStyle = '#ff0000';       // Hexadecimal
ctx.fillStyle = 'rgb(255,0,0)';  // RGB
ctx.fillStyle = 'rgba(255,0,0,0.5)'; // RGBA (with transparency)

// Stroke style
ctx.strokeStyle = 'blue';

// Line properties
ctx.lineWidth = 5;                // Line width
ctx.lineCap = 'round';            // Line cap: butt | round | square
ctx.lineJoin = 'round';           // Line join: miter | round | bevel
ctx.miterLimit = 10;              // Miter limit
ctx.setLineDash([5, 10]);         // Dash pattern
ctx.lineDashOffset = 0;           // Dash offset

// Shadow
ctx.shadowColor = 'rgba(0,0,0,0.5)';
ctx.shadowBlur = 10;
ctx.shadowOffsetX = 5;
ctx.shadowOffsetY = 5;

// Transparency
ctx.globalAlpha = 0.5;

// Compositing operation
ctx.globalCompositeOperation = 'source-over'; // Default value
```

### Basic Shape Drawing

```javascript
// Rectangle (the only shape that can be drawn directly)
ctx.fillRect(x, y, width, height);    // Fill rectangle
ctx.strokeRect(x, y, width, height);  // Stroke rectangle
ctx.clearRect(x, y, width, height);   // Clear rectangular area

// Rectangle drawing example
ctx.fillStyle = '#3498db';
ctx.fillRect(50, 50, 200, 100);

ctx.strokeStyle = '#e74c3c';
ctx.lineWidth = 3;
ctx.strokeRect(300, 50, 200, 100);
```

### Path Drawing

Paths are the core of Canvas drawing; almost all complex shapes are implemented through paths:

```javascript
// Basic path flow
ctx.beginPath();           // Start new path
ctx.moveTo(x, y);          // Move to starting point
ctx.lineTo(x, y);          // Draw line to specified point
ctx.closePath();           // Close path (optional)
ctx.stroke();              // Stroke
ctx.fill();                // Fill

// Drawing a triangle
ctx.beginPath();
ctx.moveTo(100, 50);       // Top vertex
ctx.lineTo(50, 150);       // Bottom left corner
ctx.lineTo(150, 150);      // Bottom right corner
ctx.closePath();           // Auto-connect back to start
ctx.fillStyle = '#2ecc71';
ctx.fill();
```

### Circles and Arcs

```javascript
// arc(x, y, radius, startAngle, endAngle, counterclockwise)
// Angles are in radians, counterclockwise indicates direction

// Complete circle
ctx.beginPath();
ctx.arc(150, 150, 50, 0, Math.PI * 2);
ctx.fillStyle = '#9b59b6';
ctx.fill();

// Semicircle
ctx.beginPath();
ctx.arc(300, 150, 50, 0, Math.PI);
ctx.stroke();

// Sector
ctx.beginPath();
ctx.moveTo(450, 150);  // Move to center
ctx.arc(450, 150, 50, 0, Math.PI / 2);
ctx.closePath();
ctx.fill();

// Drawing multiple arcs to form a shape
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

### Bezier Curves

```javascript
// Quadratic Bezier curve
// quadraticCurveTo(cpx, cpy, x, y)
// cpx, cpy: control point coordinates
// x, y: end point coordinates
ctx.beginPath();
ctx.moveTo(50, 200);
ctx.quadraticCurveTo(150, 50, 250, 200);
ctx.stroke();

// Cubic Bezier curve
// bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
ctx.beginPath();
ctx.moveTo(300, 200);
ctx.bezierCurveTo(350, 50, 450, 350, 500, 200);
ctx.stroke();

// Drawing a heart shape
function drawHeart(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size / 4);

  // Left half
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

  // Right half
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

### Text Drawing

```javascript
// Set font
ctx.font = '24px Arial';
ctx.font = 'bold 32px "Microsoft YaHei"';
ctx.font = 'italic 20px sans-serif';

// Text alignment
ctx.textAlign = 'center';      // left | center | right | start | end
ctx.textBaseline = 'middle';   // top | hanging | middle | alphabetic | ideographic | bottom

// Draw text
ctx.fillStyle = '#333';
ctx.fillText('Hello Canvas!', 400, 300);          // Fill text
ctx.strokeText('Hello Canvas!', 400, 350);        // Stroke text
ctx.fillText('Limited width', 400, 400, 100);     // Limit maximum width

// Measure text
const text = 'Hello World';
const metrics = ctx.measureText(text);
console.log('Text width:', metrics.width);
console.log('Actual bounding box:', metrics.actualBoundingBoxLeft, metrics.actualBoundingBoxRight);
```

### Gradients and Patterns

```javascript
// Linear gradient
const linearGradient = ctx.createLinearGradient(0, 0, 200, 0);
linearGradient.addColorStop(0, '#ff0000');
linearGradient.addColorStop(0.5, '#00ff00');
linearGradient.addColorStop(1, '#0000ff');
ctx.fillStyle = linearGradient;
ctx.fillRect(50, 50, 200, 100);

// Radial gradient
const radialGradient = ctx.createRadialGradient(350, 100, 10, 350, 100, 80);
radialGradient.addColorStop(0, '#fff');
radialGradient.addColorStop(1, '#3498db');
ctx.fillStyle = radialGradient;
ctx.beginPath();
ctx.arc(350, 100, 80, 0, Math.PI * 2);
ctx.fill();

// Pattern fill
const img = new Image();
img.onload = function() {
  const pattern = ctx.createPattern(img, 'repeat'); // repeat | repeat-x | repeat-y | no-repeat
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 200, 400, 200);
};
img.src = 'texture.png';
```

## Code Examples

### Drawing a Complete Chart

```javascript
// Drawing a bar chart
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

  // Draw grid lines
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const lineY = y + height - (height / 5) * i;
    ctx.beginPath();
    ctx.moveTo(x, lineY);
    ctx.lineTo(x + width, lineY);
    ctx.stroke();
  }

  // Draw bars
  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * height;
    const barX = x + (barWidth + gap) * index + gap / 2;
    const barY = y + height - barHeight;

    // Draw gradient bar
    const gradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
    gradient.addColorStop(0, barColor);
    gradient.addColorStop(1, '#2980b9');

    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Draw labels
    ctx.fillStyle = labelColor;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(item.label, barX + barWidth / 2, y + height + 20);
    ctx.fillText(item.value, barX + barWidth / 2, barY - 5);
  });
}

// Usage example
const chartData = [
  { label: 'January', value: 65 },
  { label: 'February', value: 45 },
  { label: 'March', value: 85 },
  { label: 'April', value: 55 },
  { label: 'May', value: 95 }
];

drawBarChart(ctx, chartData, {
  x: 50,
  y: 50,
  width: 500,
  height: 300
});
```

### Image Processing

```javascript
// Load and draw image
const img = new Image();
img.onload = function() {
  // Basic drawing
  ctx.drawImage(img, 0, 0);

  // Draw with specified dimensions
  ctx.drawImage(img, 0, 0, 200, 150);

  // Crop and draw
  // drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  ctx.drawImage(img,
    50, 50, 100, 100,  // Source image crop area
    0, 0, 200, 200     // Destination draw area
  );
};
img.src = 'photo.jpg';

// Image scaling and rotation
function drawRotatedImage(ctx, img, x, y, width, height, angle) {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(angle * Math.PI / 180);
  ctx.drawImage(img, -width / 2, -height / 2, width, height);
  ctx.restore();
}
```

### Pixel Manipulation

```javascript
// Get pixel data
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const data = imageData.data; // Uint8ClampedArray

// Pixel data format: [R, G, B, A, R, G, B, A, ...]
// Each pixel occupies 4 bytes

// Grayscale processing
for (let i = 0; i < data.length; i += 4) {
  const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
  data[i] = avg;     // R
  data[i + 1] = avg; // G
  data[i + 2] = avg; // B
  // data[i + 3] is Alpha channel, keep unchanged
}

// Write processed data back
ctx.putImageData(imageData, 0, 0);

// Invert colors
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

// Blur effect (simple box blur)
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

### Animation Implementation

```javascript
// Basic animation loop
let animationId;
let lastTime = 0;

function animate(currentTime) {
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update and draw
  update(deltaTime);
  draw();

  // Continue to next frame
  animationId = requestAnimationFrame(animate);
}

// Start animation
animationId = requestAnimationFrame(animate);

// Stop animation
cancelAnimationFrame(animationId);

// Bouncing ball animation example
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
    // Apply gravity
    this.vy += this.gravity;

    // Apply friction
    this.vx *= this.friction;
    this.vy *= this.friction;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Boundary collision detection
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

// Particle system example
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

### Transform Operations

```javascript
// Translate
ctx.translate(100, 100);

// Rotate (radians)
ctx.rotate(Math.PI / 4);

// Scale
ctx.scale(2, 2);

// Transform matrix
// transform(a, b, c, d, e, f)
// | a c e |
// | b d f |
// | 0 0 1 |
ctx.transform(1, 0, 0, 1, 100, 100); // Equivalent to translate

// Reset transform
ctx.setTransform(1, 0, 0, 1, 0, 0);

// Save and restore state
ctx.save();
ctx.translate(200, 200);
ctx.rotate(Math.PI / 4);
ctx.fillRect(-50, -50, 100, 100);
ctx.restore(); // Restore previous state

// Draw rotated rectangle
function drawRotatedRect(ctx, x, y, width, height, angle) {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(angle * Math.PI / 180);
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.restore();
}

// Draw shape orbiting around a point
function drawOrbitingCircle(ctx, centerX, centerY, orbitRadius, circleRadius, angle) {
  const x = centerX + Math.cos(angle) * orbitRadius;
  const y = centerY + Math.sin(angle) * orbitRadius;

  ctx.beginPath();
  ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
  ctx.fill();
}
```

### Clipping Regions

```javascript
// Use path as clipping region
ctx.beginPath();
ctx.arc(200, 200, 100, 0, Math.PI * 2);
ctx.clip();

// All subsequent drawing will be confined to the circular region
ctx.fillStyle = '#3498db';
ctx.fillRect(0, 0, 400, 400);

// Draw image within circular region
ctx.save();
ctx.beginPath();
ctx.arc(200, 200, 100, 0, Math.PI * 2);
ctx.clip();
ctx.drawImage(img, 100, 100, 200, 200);
ctx.restore();

// Create circular avatar
function drawCircularAvatar(ctx, img, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
}
```

## Best Practices

### Use requestAnimationFrame

```javascript
// Recommended: Use requestAnimationFrame
function animate() {
  // Drawing logic
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Not recommended: Using setInterval/setTimeout
// setInterval(() => {
//   // Drawing logic
// }, 16);
```

### Batch Path Operations

```javascript
// Recommended: Batch draw same type of shapes
ctx.beginPath();
ctx.fillStyle = '#3498db';
for (let i = 0; i < 100; i++) {
  ctx.rect(i * 10, 0, 8, 50);
}
ctx.fill();

// Not recommended: Draw individually each time
// for (let i = 0; i < 100; i++) {
//   ctx.fillStyle = '#3498db';
//   ctx.fillRect(i * 10, 0, 8, 50);
// }
```

### Use Offscreen Canvas

```javascript
// Create offscreen Canvas to cache complex shapes
const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = 200;
offscreenCanvas.height = 200;
const offCtx = offscreenCanvas.getContext('2d');

// Draw complex shape on offscreen Canvas (only needs to be done once)
function renderComplexShape(ctx) {
  ctx.beginPath();
  // ... complex drawing operations
  ctx.fill();
}
renderComplexShape(offCtx);

// Use cached image directly on main Canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(offscreenCanvas, x, y);
  requestAnimationFrame(draw);
}
```

### Avoid Unnecessary State Changes

```javascript
// Recommended: Group drawing by state
const blueItems = items.filter(i => i.color === 'blue');
const redItems = items.filter(i => i.color === 'red');

ctx.fillStyle = 'blue';
blueItems.forEach(item => ctx.fillRect(item.x, item.y, 10, 10));

ctx.fillStyle = 'red';
redItems.forEach(item => ctx.fillRect(item.x, item.y, 10, 10));

// Not recommended: Frequently switching states
// items.forEach(item => {
//   ctx.fillStyle = item.color;
//   ctx.fillRect(item.x, item.y, 10, 10);
// });
```

### Properly Handle Device Pixel Ratio

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

### Use save() and restore()

```javascript
// Recommended: Use save/restore to isolate transforms
function drawRotatedRect(ctx, x, y, w, h, angle) {
  ctx.save();
  ctx.translate(x + w/2, y + h/2);
  ctx.rotate(angle);
  ctx.fillRect(-w/2, -h/2, w, h);
  ctx.restore();
}

// Not recommended: Manually restore state
// ctx.translate(x + w/2, y + h/2);
// ctx.rotate(angle);
// ctx.fillRect(-w/2, -h/2, w, h);
// ctx.rotate(-angle);
// ctx.translate(-(x + w/2), -(y + h/2));
```

## Common Pitfalls

### Incorrect Canvas Size Setting

```javascript
// Wrong: Using CSS to set dimensions causes stretching
// canvas { width: 800px; height: 600px; }

// Correct: Use attributes to set dimensions
canvas.width = 800;
canvas.height = 600;

// Or set in HTML
// <canvas width="800" height="600"></canvas>
```

### Path Not Reset

```javascript
// Wrong: Path accumulation
ctx.moveTo(0, 0);
ctx.lineTo(100, 100);
ctx.stroke();
ctx.moveTo(200, 0);
ctx.lineTo(300, 100);
ctx.stroke(); // Will draw two lines

// Correct: Call beginPath() before each new path
ctx.beginPath();
ctx.moveTo(0, 0);
ctx.lineTo(100, 100);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(200, 0);
ctx.lineTo(300, 100);
ctx.stroke();
```

### Image Loading Timing

```javascript
// Wrong: Drawing before image is loaded
const img = new Image();
img.src = 'image.png';
ctx.drawImage(img, 0, 0); // Might not display anything

// Correct: Wait for image to load
const img = new Image();
img.onload = function() {
  ctx.drawImage(img, 0, 0);
};
img.src = 'image.png';

// Or use Promise
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
```

### Half-Pixel Rendering Blur

```javascript
// Issue: Drawing at non-integer coordinates causes blur
ctx.strokeRect(10.5, 10.5, 100, 100); // Blurry

// Solution: For 1-pixel lines, use 0.5 offset
ctx.strokeRect(10.5, 10.5, 100, 100); // Actually this is correct
// Or use integer coordinates + translate
ctx.translate(0.5, 0.5);
ctx.strokeRect(10, 10, 100, 100);
```

### Cross-Origin Image Processing

```javascript
// Wrong: Cross-origin images cannot get pixel data
const img = new Image();
img.src = 'https://other-domain.com/image.png';
// Calling getImageData will throw an error

// Correct: Set crossOrigin attribute
const img = new Image();
img.crossOrigin = 'anonymous';
img.src = 'https://other-domain.com/image.png';
// Server also needs to set correct CORS headers
```

### Forgetting to Clear Canvas

```javascript
// Wrong: Not clearing canvas in animation
function animate() {
  // Direct drawing causes overlay
  ctx.fillRect(x++, 100, 50, 50);
  requestAnimationFrame(animate);
}

// Correct: Clear canvas each frame
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillRect(x++, 100, 50, 50);
  requestAnimationFrame(animate);
}
```

## Performance Considerations

### Reduce Drawing Area

```javascript
// Only clear and redraw changed areas
function optimizedDraw() {
  // Clear area where previous frame object was located
  ctx.clearRect(prevX - 5, prevY - 5, width + 10, height + 10);

  // Draw at new position
  ctx.fillRect(x, y, width, height);

  prevX = x;
  prevY = y;
}
```

### Use Multi-Layer Canvas

```javascript
// Static background layer
const bgCanvas = document.getElementById('background');
const bgCtx = bgCanvas.getContext('2d');
drawBackground(bgCtx); // Draw only once

// Dynamic foreground layer
const fgCanvas = document.getElementById('foreground');
const fgCtx = fgCanvas.getContext('2d');
function animate() {
  fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);
  drawDynamicContent(fgCtx);
  requestAnimationFrame(animate);
}
```

### Use OffscreenCanvas (Web Worker)

```javascript
// Main thread
const canvas = document.getElementById('canvas');
const offscreen = canvas.transferControlToOffscreen();

const worker = new Worker('canvas-worker.js');
worker.postMessage({ canvas: offscreen }, [offscreen]);

// canvas-worker.js
self.onmessage = function(e) {
  const canvas = e.data.canvas;
  const ctx = canvas.getContext('2d');

  function draw() {
    // Drawing logic
    requestAnimationFrame(draw);
  }
  draw();
};
```

### Avoid Frequent getImageData

```javascript
// Not recommended: Frequent calls in animation
function animate() {
  const imageData = ctx.getImageData(0, 0, width, height); // Slow
  // Process
  ctx.putImageData(imageData, 0, 0);
  requestAnimationFrame(animate);
}

// Recommended: Reduce call frequency or use WebGL
```

### Use Integer Coordinates

```javascript
// Recommended: Use integer coordinates for better performance
const x = Math.round(floatX);
const y = Math.round(floatY);
ctx.fillRect(x, y, 100, 100);
```

### Performance Monitoring

```javascript
// Frame rate monitoring
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

  // Draw content
  // ...

  // Display frame rate
  ctx.fillStyle = '#000';
  ctx.font = '16px Arial';
  ctx.fillText(`FPS: ${fpsCounter.update()}`, 10, 20);

  requestAnimationFrame(animate);
}
```

## Practical Scenarios

### Signature Pad

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

    // Touch support
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

// Usage
const pad = new SignaturePad(document.getElementById('signature'));
```

### Image Cropper

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

    // Draw original image
    this.ctx.drawImage(this.image, 0, 0);

    // Draw overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Clear overlay from crop area
    this.ctx.clearRect(
      this.cropArea.x,
      this.cropArea.y,
      this.cropArea.width,
      this.cropArea.height
    );

    // Redraw image in crop area
    this.ctx.drawImage(
      this.image,
      this.cropArea.x, this.cropArea.y, this.cropArea.width, this.cropArea.height,
      this.cropArea.x, this.cropArea.y, this.cropArea.width, this.cropArea.height
    );

    // Draw crop box border
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(
      this.cropArea.x,
      this.cropArea.y,
      this.cropArea.width,
      this.cropArea.height
    );

    // Draw resize handles
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
    // Implement drag and resize logic
    // ...
  }
}
```

### Data Visualization Dashboard

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

    // Draw background arc
    this.drawArc(centerX, centerY, radius, '#eee', Math.PI, 2 * Math.PI);

    // Draw value arc
    const percentage = (this.animatedValue - this.options.min) /
                       (this.options.max - this.options.min);
    const endAngle = Math.PI + percentage * Math.PI;
    const color = this.getColor(percentage * 100);

    this.drawArc(centerX, centerY, radius, color, Math.PI, endAngle);

    // Draw needle
    this.drawNeedle(centerX, centerY, radius * 0.8, endAngle);

    // Draw center circle
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius * 0.1, 0, Math.PI * 2);
    this.ctx.fillStyle = '#333';
    this.ctx.fill();

    // Draw value text
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

        // Easing function
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

// Usage
const gauge = new GaugeChart(document.getElementById('gauge'), {
  min: 0,
  max: 100,
  colors: ['#2ecc71', '#f1c40f', '#e74c3c'],
  thresholds: [40, 70, 100]
});
gauge.setValue(75);
```

### Simple Game Example

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

    // Update bird position
    this.bird.velocity += this.bird.gravity;
    this.bird.y += this.bird.velocity;

    // Check boundary collision
    if (this.bird.y < 0 || this.bird.y + this.bird.size > this.height) {
      this.gameOver = true;
      return;
    }

    // Update pipes
    this.pipes.forEach(pipe => {
      pipe.x -= this.pipeSpeed;

      // Check score
      if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
        pipe.passed = true;
        this.score++;
      }

      // Check collision
      if (this.checkCollision(pipe)) {
        this.gameOver = true;
      }
    });

    // Remove pipes that are off screen
    this.pipes = this.pipes.filter(pipe => pipe.x + this.pipeWidth > 0);

    // Spawn new pipes
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

    // Check if within pipe x range
    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      // Check if hitting top or bottom pipe
      if (birdTop < pipe.topHeight || birdBottom > pipe.bottomY) {
        return true;
      }
    }

    return false;
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#70c5ce';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw pipes
    this.ctx.fillStyle = '#73bf2e';
    this.pipes.forEach(pipe => {
      // Top pipe
      this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
      // Bottom pipe
      this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.height - pipe.bottomY);
    });

    // Draw bird
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

    // Draw score
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.score, this.width / 2, 80);

    // Game over screen
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.fillText('Game Over', this.width / 2, this.height / 2 - 30);
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Click or press Space to restart', this.width / 2, this.height / 2 + 30);
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

// Start game
const game = new FlappyBirdGame(document.getElementById('gameCanvas'));
```

## Interview Key Points

### What are the differences between Canvas and SVG?

**Key Points**:

- **Canvas** is pixel-based bitmap rendering, suitable for large numbers of graphics, games, image processing
- **SVG** is vector-based graphics, each element is a DOM node, suitable for charts and icons
- Canvas performs better with many simple graphics, SVG performs better with fewer complex graphics
- Canvas doesn't support binding events to specific shapes, requires manual position calculation
- SVG can scale losslessly, Canvas loses quality when scaled up

### How to optimize Canvas animation performance?

**Key Points**:

```javascript
// 1. Use requestAnimationFrame
requestAnimationFrame(animate);

// 2. Use offscreen Canvas caching
const offscreen = document.createElement('canvas');

// 3. Reduce drawing area
ctx.clearRect(dirtyX, dirtyY, dirtyWidth, dirtyHeight);

// 4. Use layered Canvas
// Static layer + Dynamic layer

// 5. Batch draw same type of shapes
ctx.beginPath();
for (...) { ctx.rect(...); }
ctx.fill();

// 6. Use integer coordinates
const x = Math.round(floatX);

// 7. Use OffscreenCanvas (Web Worker)
const offscreen = canvas.transferControlToOffscreen();
```

### What does getContext('2d') return? What are its important properties and methods?

**Key Points**:

Returns a `CanvasRenderingContext2D` object:

```javascript
// Important properties
ctx.fillStyle       // Fill style
ctx.strokeStyle     // Stroke style
ctx.lineWidth       // Line width
ctx.font            // Font
ctx.globalAlpha     // Global transparency
ctx.globalCompositeOperation // Compositing operation

// Important methods
ctx.fillRect()      // Fill rectangle
ctx.strokeRect()    // Stroke rectangle
ctx.clearRect()     // Clear area
ctx.beginPath()     // Start path
ctx.moveTo()        // Move to
ctx.lineTo()        // Draw line to
ctx.arc()           // Arc
ctx.fill()          // Fill
ctx.stroke()        // Stroke
ctx.drawImage()     // Draw image
ctx.getImageData()  // Get pixel data
ctx.putImageData()  // Write pixel data
ctx.save()          // Save state
ctx.restore()       // Restore state
ctx.translate()     // Translate
ctx.rotate()        // Rotate
ctx.scale()         // Scale
```

### How to implement image grayscale processing?

```javascript
const imageData = ctx.getImageData(0, 0, width, height);
const data = imageData.data;

for (let i = 0; i < data.length; i += 4) {
  // Method 1: Average
  const avg = (data[i] + data[i+1] + data[i+2]) / 3;

  // Method 2: Weighted average (more aligned with human perception)
  const gray = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;

  data[i] = gray;     // R
  data[i+1] = gray;   // G
  data[i+2] = gray;   // B
  // data[i+3] is Alpha, keep unchanged
}

ctx.putImageData(imageData, 0, 0);
```

### How does Canvas handle high DPI screens?

```javascript
function setupHiDPICanvas(canvas, width, height) {
  const dpr = window.devicePixelRatio || 1;

  // Set actual pixel dimensions
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  // Set CSS display dimensions
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  // Scale context
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  return ctx;
}
```

### What are the differences between requestAnimationFrame and setInterval?

**Key Points**:

| Feature | requestAnimationFrame | setInterval |
|---------|----------------------|-------------|
| Refresh Rate | Synced with display (usually 60fps) | Fixed interval |
| Background Behavior | Pauses to save resources | Continues execution |
| Performance | Browser optimized, smoother | May cause frame drops |
| Precision | High time precision | Affected by task queue |
| Use Case | Animation | Scheduled tasks |

## Further Reading

### Official Documentation

- [MDN Canvas API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [HTML Living Standard - Canvas](https://html.spec.whatwg.org/multipage/canvas.html)
- [W3C Canvas 2D Context Specification](https://www.w3.org/TR/2dcontext/)

### Recommended Books

- "Core HTML5 Canvas: Graphics, Animation, and Game Development" - David Geary
- "Foundation HTML5 Canvas: For Games and Entertainment" - Rob Hawkes
- "HTML5 Canvas Cookbook" - Eric Rowell

### Quality Tutorials

- [Canvas Tutorial - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [HTML5 Canvas Tutorial - W3Schools](https://www.w3schools.com/html/html5_canvas.asp)

### Related Libraries and Frameworks

- **Fabric.js** - Powerful Canvas library with interactive object support
- **Konva.js** - 2D drawing library with events, animation, and node nesting support
- **PixiJS** - High-performance 2D rendering engine
- **Three.js** - 3D graphics library (using WebGL)
- **P5.js** - Creative coding library
- **Chart.js** - Canvas-based charting library
- **ECharts** - Visualization chart library
