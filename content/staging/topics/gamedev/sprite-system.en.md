---
title: 2D Sprite System Deep Dive
description: "Master 2D game core techniques: sprite sheets, animation systems, and particle effects"
track: gamedev
section: gameplay-systems
difficulty: beginner
tags:
  - sprites
  - 2D
  - animation
  - particle system
status: imported
origin: old/src/content/docs/gamedev/sprite-system.en.md
divergence: 0.269
issues: []
legacy:
  category: GameDev
  subcategory: 2D
  order: 26
  lastUpdated: 2026-01-07
---

## Introduction

Sprites are the fundamental building blocks of 2D game graphics. A sprite is essentially a 2D image or animation that represents game objects such as characters, enemies, projectiles, and environmental elements. Understanding sprite systems is essential for anyone looking to develop 2D games, whether using game engines like Unity, Godot, or building custom solutions with Canvas or WebGL.

### Historical Context

The term "sprite" originated in the 1970s with dedicated graphics hardware that could display movable objects independently from the background. Classic consoles like the NES, SNES, and Sega Genesis had dedicated sprite hardware. Modern sprite systems are software-based but inherit many concepts from this era.

### What You Will Learn

| Topic | Description |
|-------|-------------|
| Sprite Basics | Core concepts and rendering fundamentals |
| Sprite Sheets | Efficient texture organization and management |
| Texture Atlas Packing | Algorithms and optimization strategies |
| Sprite Animation | Frame-based animation techniques |
| Animation State Machines | Managing complex animation transitions |
| Particle Systems | Creating visual effects with particles |
| Batch Rendering | Performance optimization techniques |
| 9-Slice Scaling | Scalable UI elements |

---

## Sprite Basics

### What is a Sprite?

A sprite is a 2D graphical object that can be positioned, rotated, scaled, and rendered on screen. At its core, a sprite consists of:

- **Texture**: The image data (pixel colors)
- **Position**: Where to draw on screen (x, y coordinates)
- **Origin/Pivot**: The reference point for transformations
- **Scale**: Size multiplier
- **Rotation**: Angle in radians or degrees
- **Color/Tint**: Color modulation
- **Alpha/Opacity**: Transparency level

### Basic Sprite Class Implementation

```javascript
class Sprite {
  constructor(texture, x = 0, y = 0) {
    // Texture reference
    this.texture = texture;

    // Transform properties
    this.x = x;
    this.y = y;
    this.scaleX = 1;
    this.scaleY = 1;
    this.rotation = 0;

    // Origin point (0-1 range, 0.5 = center)
    this.originX = 0.5;
    this.originY = 0.5;

    // Visual properties
    this.alpha = 1;
    this.tint = { r: 255, g: 255, b: 255 };
    this.visible = true;

    // Source rectangle (for sprite sheets)
    this.sourceX = 0;
    this.sourceY = 0;
    this.sourceWidth = texture.width;
    this.sourceHeight = texture.height;

    // Flip flags
    this.flipX = false;
    this.flipY = false;
  }

  // Get the width after scaling
  get width() {
    return this.sourceWidth * Math.abs(this.scaleX);
  }

  // Get the height after scaling
  get height() {
    return this.sourceHeight * Math.abs(this.scaleY);
  }

  // Set uniform scale
  setScale(scale) {
    this.scaleX = scale;
    this.scaleY = scale;
    return this;
  }

  // Set position
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  // Set origin/pivot point
  setOrigin(x, y) {
    this.originX = x;
    this.originY = y;
    return this;
  }

  // Center the origin
  centerOrigin() {
    this.originX = 0.5;
    this.originY = 0.5;
    return this;
  }
}
```

### Rendering Sprites with Canvas 2D

```javascript
class SpriteRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  clear(color = '#000000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render(sprite) {
    if (!sprite.visible || sprite.alpha <= 0) return;

    const ctx = this.ctx;

    // Calculate origin offset in pixels
    const originOffsetX = sprite.sourceWidth * sprite.originX;
    const originOffsetY = sprite.sourceHeight * sprite.originY;

    ctx.save();

    // Apply transformations
    ctx.globalAlpha = sprite.alpha;
    ctx.translate(sprite.x, sprite.y);
    ctx.rotate(sprite.rotation);
    ctx.scale(
      sprite.flipX ? -sprite.scaleX : sprite.scaleX,
      sprite.flipY ? -sprite.scaleY : sprite.scaleY
    );

    // Draw the sprite
    ctx.drawImage(
      sprite.texture,
      sprite.sourceX,          // Source X
      sprite.sourceY,          // Source Y
      sprite.sourceWidth,      // Source Width
      sprite.sourceHeight,     // Source Height
      -originOffsetX,          // Destination X
      -originOffsetY,          // Destination Y
      sprite.sourceWidth,      // Destination Width
      sprite.sourceHeight      // Destination Height
    );

    ctx.restore();
  }

  // Render with color tinting
  renderTinted(sprite) {
    if (!sprite.visible || sprite.alpha <= 0) return;

    const ctx = this.ctx;
    const { r, g, b } = sprite.tint;

    // Create offscreen canvas for tinting
    const tintCanvas = document.createElement('canvas');
    tintCanvas.width = sprite.sourceWidth;
    tintCanvas.height = sprite.sourceHeight;
    const tintCtx = tintCanvas.getContext('2d');

    // Draw original sprite
    tintCtx.drawImage(
      sprite.texture,
      sprite.sourceX, sprite.sourceY,
      sprite.sourceWidth, sprite.sourceHeight,
      0, 0,
      sprite.sourceWidth, sprite.sourceHeight
    );

    // Apply tint using composite operations
    tintCtx.globalCompositeOperation = 'multiply';
    tintCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    tintCtx.fillRect(0, 0, sprite.sourceWidth, sprite.sourceHeight);

    // Restore alpha from original
    tintCtx.globalCompositeOperation = 'destination-atop';
    tintCtx.drawImage(
      sprite.texture,
      sprite.sourceX, sprite.sourceY,
      sprite.sourceWidth, sprite.sourceHeight,
      0, 0,
      sprite.sourceWidth, sprite.sourceHeight
    );

    // Draw tinted result
    ctx.save();
    ctx.globalAlpha = sprite.alpha;
    ctx.translate(sprite.x, sprite.y);
    ctx.rotate(sprite.rotation);

    const originOffsetX = sprite.sourceWidth * sprite.originX;
    const originOffsetY = sprite.sourceHeight * sprite.originY;

    ctx.drawImage(
      tintCanvas,
      -originOffsetX * sprite.scaleX,
      -originOffsetY * sprite.scaleY,
      sprite.sourceWidth * sprite.scaleX,
      sprite.sourceHeight * sprite.scaleY
    );

    ctx.restore();
  }
}
```

### Loading Textures

```javascript
class TextureLoader {
  constructor() {
    this.cache = new Map();
    this.loading = new Map();
  }

  load(url) {
    // Return cached texture
    if (this.cache.has(url)) {
      return Promise.resolve(this.cache.get(url));
    }

    // Return existing loading promise
    if (this.loading.has(url)) {
      return this.loading.get(url);
    }

    // Start loading
    const promise = new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        this.cache.set(url, image);
        this.loading.delete(url);
        resolve(image);
      };

      image.onerror = () => {
        this.loading.delete(url);
        reject(new Error(`Failed to load texture: ${url}`));
      };

      image.src = url;
    });

    this.loading.set(url, promise);
    return promise;
  }

  // Load multiple textures
  async loadAll(urls) {
    return Promise.all(urls.map(url => this.load(url)));
  }

  // Get cached texture
  get(url) {
    return this.cache.get(url);
  }

  // Clear cache
  clear() {
    this.cache.clear();
  }
}
```

---

## Sprite Sheets

### What is a Sprite Sheet?

A sprite sheet (also called a texture atlas when containing multiple sprites) is a single image containing multiple sprite frames arranged in a grid or packed layout. Using sprite sheets offers several advantages:

1. **Reduced Draw Calls**: Multiple sprites from one texture
2. **Efficient Memory Usage**: Single texture allocation
3. **Faster Loading**: One file to download instead of many
4. **Better Texture Sampling**: Reduces texture switching overhead

### Grid-Based Sprite Sheet

```javascript
class GridSpriteSheet {
  constructor(texture, frameWidth, frameHeight, options = {}) {
    this.texture = texture;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;

    // Calculate grid dimensions
    this.columns = Math.floor(texture.width / frameWidth);
    this.rows = Math.floor(texture.height / frameHeight);
    this.totalFrames = options.frameCount || (this.columns * this.rows);

    // Optional margin and spacing
    this.marginX = options.marginX || 0;
    this.marginY = options.marginY || 0;
    this.spacingX = options.spacingX || 0;
    this.spacingY = options.spacingY || 0;

    // Pre-calculate frame rectangles
    this.frames = this.calculateFrames();
  }

  calculateFrames() {
    const frames = [];

    for (let i = 0; i < this.totalFrames; i++) {
      const col = i % this.columns;
      const row = Math.floor(i / this.columns);

      frames.push({
        x: this.marginX + col * (this.frameWidth + this.spacingX),
        y: this.marginY + row * (this.frameHeight + this.spacingY),
        width: this.frameWidth,
        height: this.frameHeight
      });
    }

    return frames;
  }

  // Get frame by index
  getFrame(index) {
    return this.frames[index % this.frames.length];
  }

  // Get frame by row and column
  getFrameAt(row, column) {
    const index = row * this.columns + column;
    return this.getFrame(index);
  }

  // Create a sprite from a specific frame
  createSprite(frameIndex) {
    const frame = this.getFrame(frameIndex);
    const sprite = new Sprite(this.texture);

    sprite.sourceX = frame.x;
    sprite.sourceY = frame.y;
    sprite.sourceWidth = frame.width;
    sprite.sourceHeight = frame.height;

    return sprite;
  }
}

// Usage example
const playerSheet = new GridSpriteSheet(texture, 64, 64, {
  frameCount: 16,
  marginX: 2,
  marginY: 2,
  spacingX: 4,
  spacingY: 4
});

const playerSprite = playerSheet.createSprite(0);
```

### JSON-Based Sprite Sheet

Many tools export sprite sheet data in JSON format. A parser for a common format:

```javascript
class JSONSpriteSheet {
  constructor(texture, jsonData) {
    this.texture = texture;
    this.frames = new Map();
    this.animations = new Map();

    this.parseJSON(jsonData);
  }

  parseJSON(data) {
    // Parse frames
    if (data.frames) {
      // Handle both array and object formats
      if (Array.isArray(data.frames)) {
        data.frames.forEach(frame => {
          this.frames.set(frame.filename, this.parseFrame(frame));
        });
      } else {
        Object.entries(data.frames).forEach(([name, frame]) => {
          this.frames.set(name, this.parseFrame(frame));
        });
      }
    }

    // Parse animation metadata if present
    if (data.meta && data.meta.frameTags) {
      data.meta.frameTags.forEach(tag => {
        this.animations.set(tag.name, {
          from: tag.from,
          to: tag.to,
          direction: tag.direction || 'forward'
        });
      });
    }
  }

  parseFrame(frameData) {
    const frame = frameData.frame;
    const spriteSourceSize = frameData.spriteSourceSize || { x: 0, y: 0 };
    const sourceSize = frameData.sourceSize || { w: frame.w, h: frame.h };

    return {
      x: frame.x,
      y: frame.y,
      width: frame.w,
      height: frame.h,
      // For trimmed sprites
      trimmed: frameData.trimmed || false,
      offsetX: spriteSourceSize.x,
      offsetY: spriteSourceSize.y,
      originalWidth: sourceSize.w,
      originalHeight: sourceSize.h,
      // Duration for animations
      duration: frameData.duration || 100
    };
  }

  getFrame(name) {
    return this.frames.get(name);
  }

  getFrameNames() {
    return Array.from(this.frames.keys());
  }

  getAnimation(name) {
    return this.animations.get(name);
  }

  createSprite(frameName) {
    const frame = this.getFrame(frameName);
    if (!frame) {
      throw new Error(`Frame not found: ${frameName}`);
    }

    const sprite = new Sprite(this.texture);
    sprite.sourceX = frame.x;
    sprite.sourceY = frame.y;
    sprite.sourceWidth = frame.width;
    sprite.sourceHeight = frame.height;

    // Handle trimmed sprites
    if (frame.trimmed) {
      sprite.trimOffsetX = frame.offsetX;
      sprite.trimOffsetY = frame.offsetY;
      sprite.originalWidth = frame.originalWidth;
      sprite.originalHeight = frame.originalHeight;
    }

    return sprite;
  }
}

// Example JSON format (Aseprite/TexturePacker style)
const jsonData = {
  frames: {
    "player_idle_0.png": {
      frame: { x: 0, y: 0, w: 64, h: 64 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
      sourceSize: { w: 64, h: 64 },
      duration: 100
    },
    "player_idle_1.png": {
      frame: { x: 64, y: 0, w: 64, h: 64 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
      sourceSize: { w: 64, h: 64 },
      duration: 100
    }
  },
  meta: {
    image: "player.png",
    size: { w: 512, h: 512 },
    frameTags: [
      { name: "idle", from: 0, to: 3, direction: "forward" },
      { name: "walk", from: 4, to: 11, direction: "forward" },
      { name: "jump", from: 12, to: 15, direction: "forward" }
    ]
  }
};
```

---

## Texture Atlas Packing

### Why Pack Textures?

Texture atlas packing is the process of combining multiple individual images into a single larger texture. This is crucial for:

- **GPU Efficiency**: Minimizing texture binds
- **Memory Optimization**: Reducing wasted space
- **Loading Performance**: Fewer HTTP requests

### Rectangle Packing Algorithms

#### Simple Row Packing

```javascript
class SimpleRowPacker {
  constructor(atlasWidth, atlasHeight) {
    this.width = atlasWidth;
    this.height = atlasHeight;
    this.currentX = 0;
    this.currentY = 0;
    this.rowHeight = 0;
    this.padding = 1;
  }

  pack(rectangles) {
    const results = [];

    // Sort by height (descending) for better packing
    const sorted = [...rectangles].sort((a, b) => b.height - a.height);

    for (const rect of sorted) {
      const position = this.findPosition(rect.width, rect.height);

      if (position) {
        results.push({
          ...rect,
          x: position.x,
          y: position.y
        });
      } else {
        console.warn(`Could not pack rectangle: ${rect.width}x${rect.height}`);
      }
    }

    return results;
  }

  findPosition(width, height) {
    const paddedWidth = width + this.padding * 2;
    const paddedHeight = height + this.padding * 2;

    // Check if it fits in current row
    if (this.currentX + paddedWidth <= this.width) {
      const position = {
        x: this.currentX + this.padding,
        y: this.currentY + this.padding
      };

      this.currentX += paddedWidth;
      this.rowHeight = Math.max(this.rowHeight, paddedHeight);

      return position;
    }

    // Move to next row
    this.currentX = 0;
    this.currentY += this.rowHeight;
    this.rowHeight = 0;

    // Check if it fits in new row
    if (this.currentY + paddedHeight <= this.height) {
      const position = {
        x: this.currentX + this.padding,
        y: this.currentY + this.padding
      };

      this.currentX = paddedWidth;
      this.rowHeight = paddedHeight;

      return position;
    }

    return null; // Does not fit
  }
}
```

#### MaxRects Bin Packing (Better Algorithm)

```javascript
class MaxRectsPacker {
  constructor(width, height, padding = 1) {
    this.binWidth = width;
    this.binHeight = height;
    this.padding = padding;
    this.freeRects = [{ x: 0, y: 0, width, height }];
  }

  pack(rectangles) {
    const results = [];

    // Sort by area (descending)
    const sorted = [...rectangles].sort((a, b) =>
      (b.width * b.height) - (a.width * a.height)
    );

    for (const rect of sorted) {
      const paddedWidth = rect.width + this.padding * 2;
      const paddedHeight = rect.height + this.padding * 2;

      const bestRect = this.findBestFreeRect(paddedWidth, paddedHeight);

      if (bestRect) {
        results.push({
          ...rect,
          x: bestRect.x + this.padding,
          y: bestRect.y + this.padding
        });

        this.splitFreeRect(bestRect, paddedWidth, paddedHeight);
        this.pruneFreeRects();
      }
    }

    return results;
  }

  findBestFreeRect(width, height) {
    let bestRect = null;
    let bestShortSide = Infinity;

    for (const rect of this.freeRects) {
      // Try to place without rotation
      if (width <= rect.width && height <= rect.height) {
        const shortSide = Math.min(rect.width - width, rect.height - height);

        if (shortSide < bestShortSide) {
          bestRect = rect;
          bestShortSide = shortSide;
        }
      }
    }

    return bestRect;
  }

  splitFreeRect(freeRect, width, height) {
    // Remove the used free rect
    const index = this.freeRects.indexOf(freeRect);
    this.freeRects.splice(index, 1);

    // Create new free rects from remaining space

    // Right side
    if (freeRect.width - width > 0) {
      this.freeRects.push({
        x: freeRect.x + width,
        y: freeRect.y,
        width: freeRect.width - width,
        height: height
      });
    }

    // Bottom side
    if (freeRect.height - height > 0) {
      this.freeRects.push({
        x: freeRect.x,
        y: freeRect.y + height,
        width: freeRect.width,
        height: freeRect.height - height
      });
    }
  }

  pruneFreeRects() {
    // Remove rectangles that are fully contained in others
    for (let i = 0; i < this.freeRects.length; i++) {
      for (let j = i + 1; j < this.freeRects.length; j++) {
        if (this.isContained(this.freeRects[i], this.freeRects[j])) {
          this.freeRects.splice(i, 1);
          i--;
          break;
        }
        if (this.isContained(this.freeRects[j], this.freeRects[i])) {
          this.freeRects.splice(j, 1);
          j--;
        }
      }
    }
  }

  isContained(a, b) {
    return a.x >= b.x && a.y >= b.y &&
           a.x + a.width <= b.x + b.width &&
           a.y + a.height <= b.y + b.height;
  }
}
```

### Building a Texture Atlas at Runtime

```javascript
class TextureAtlasBuilder {
  constructor(maxSize = 2048) {
    this.maxSize = maxSize;
    this.entries = [];
  }

  addImage(name, image) {
    this.entries.push({
      name,
      image,
      width: image.width,
      height: image.height
    });
    return this;
  }

  build() {
    // Start with a reasonable size and grow if needed
    let size = 256;
    let packed = null;

    while (size <= this.maxSize) {
      const packer = new MaxRectsPacker(size, size);
      packed = packer.pack(this.entries);

      if (packed.length === this.entries.length) {
        break;
      }

      size *= 2;
    }

    if (packed.length !== this.entries.length) {
      throw new Error('Could not fit all images in atlas');
    }

    // Create the atlas canvas
    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = size;
    atlasCanvas.height = size;
    const ctx = atlasCanvas.getContext('2d');

    // Draw all images and build frame data
    const frames = {};

    for (const entry of packed) {
      ctx.drawImage(entry.image, entry.x, entry.y);

      frames[entry.name] = {
        x: entry.x,
        y: entry.y,
        width: entry.width,
        height: entry.height
      };
    }

    return {
      texture: atlasCanvas,
      frames,
      width: size,
      height: size
    };
  }
}

// Usage
async function createAtlas() {
  const loader = new TextureLoader();
  const builder = new TextureAtlasBuilder(2048);

  const images = await loader.loadAll([
    'player.png',
    'enemy.png',
    'bullet.png',
    'explosion.png'
  ]);

  builder
    .addImage('player', images[0])
    .addImage('enemy', images[1])
    .addImage('bullet', images[2])
    .addImage('explosion', images[3]);

  const atlas = builder.build();
  return atlas;
}
```

---

## Sprite Animation

### Frame Animation Basics

```javascript
class AnimationFrame {
  constructor(frameIndex, duration) {
    this.frameIndex = frameIndex;
    this.duration = duration; // in milliseconds
  }
}

class SpriteAnimation {
  constructor(name, frames, options = {}) {
    this.name = name;
    this.frames = frames;
    this.loop = options.loop !== false;
    this.pingPong = options.pingPong || false;

    // Calculate total duration
    this.totalDuration = frames.reduce((sum, f) => sum + f.duration, 0);
  }

  // Get frame at specific time
  getFrameAtTime(time) {
    if (this.frames.length === 0) return null;

    // Handle looping
    let adjustedTime = time;

    if (this.loop) {
      if (this.pingPong) {
        // Ping-pong doubles the effective duration
        const fullCycle = this.totalDuration * 2;
        adjustedTime = time % fullCycle;

        if (adjustedTime > this.totalDuration) {
          // Going backwards
          adjustedTime = fullCycle - adjustedTime;
        }
      } else {
        adjustedTime = time % this.totalDuration;
      }
    } else {
      adjustedTime = Math.min(time, this.totalDuration);
    }

    // Find the frame
    let accumulated = 0;
    for (const frame of this.frames) {
      accumulated += frame.duration;
      if (adjustedTime < accumulated) {
        return frame;
      }
    }

    return this.frames[this.frames.length - 1];
  }

  // Check if animation has finished (for non-looping)
  isComplete(time) {
    if (this.loop) return false;
    return time >= this.totalDuration;
  }
}
```

### Animation Controller

```javascript
class AnimationController {
  constructor(spriteSheet) {
    this.spriteSheet = spriteSheet;
    this.animations = new Map();
    this.currentAnimation = null;
    this.currentTime = 0;
    this.speed = 1;
    this.paused = false;

    // Callbacks
    this.onAnimationComplete = null;
    this.onFrameChange = null;

    // State tracking
    this.lastFrameIndex = -1;
  }

  addAnimation(name, frameIndices, frameDuration, options = {}) {
    const frames = frameIndices.map(index =>
      new AnimationFrame(index, frameDuration)
    );

    this.animations.set(name, new SpriteAnimation(name, frames, options));
    return this;
  }

  addAnimationWithDurations(name, frameData, options = {}) {
    const frames = frameData.map(data =>
      new AnimationFrame(data.index, data.duration)
    );

    this.animations.set(name, new SpriteAnimation(name, frames, options));
    return this;
  }

  play(animationName, restart = false) {
    const animation = this.animations.get(animationName);

    if (!animation) {
      console.warn(`Animation not found: ${animationName}`);
      return this;
    }

    if (this.currentAnimation !== animation || restart) {
      this.currentAnimation = animation;
      this.currentTime = 0;
      this.lastFrameIndex = -1;
    }

    this.paused = false;
    return this;
  }

  stop() {
    this.paused = true;
    this.currentTime = 0;
    return this;
  }

  pause() {
    this.paused = true;
    return this;
  }

  resume() {
    this.paused = false;
    return this;
  }

  update(deltaTime) {
    if (this.paused || !this.currentAnimation) return;

    this.currentTime += deltaTime * this.speed;

    const frame = this.currentAnimation.getFrameAtTime(this.currentTime);

    if (frame && frame.frameIndex !== this.lastFrameIndex) {
      this.lastFrameIndex = frame.frameIndex;

      if (this.onFrameChange) {
        this.onFrameChange(frame.frameIndex);
      }
    }

    // Check for completion
    if (this.currentAnimation.isComplete(this.currentTime)) {
      if (this.onAnimationComplete) {
        this.onAnimationComplete(this.currentAnimation.name);
      }
    }
  }

  getCurrentFrame() {
    if (!this.currentAnimation) return null;
    return this.currentAnimation.getFrameAtTime(this.currentTime);
  }

  // Apply current frame to sprite
  applyToSprite(sprite) {
    const frame = this.getCurrentFrame();
    if (!frame) return;

    const sourceFrame = this.spriteSheet.getFrame(frame.frameIndex);

    sprite.sourceX = sourceFrame.x;
    sprite.sourceY = sourceFrame.y;
    sprite.sourceWidth = sourceFrame.width;
    sprite.sourceHeight = sourceFrame.height;
  }
}

// Usage example
const playerSheet = new GridSpriteSheet(texture, 64, 64);
const animator = new AnimationController(playerSheet);

animator
  .addAnimation('idle', [0, 1, 2, 3], 150, { loop: true })
  .addAnimation('walk', [4, 5, 6, 7, 8, 9, 10, 11], 100, { loop: true })
  .addAnimation('jump', [12, 13, 14, 15], 100, { loop: false })
  .addAnimation('attack', [16, 17, 18, 19, 20], 80, { loop: false });

animator.play('idle');

// In game loop
function update(deltaTime) {
  animator.update(deltaTime);
  animator.applyToSprite(playerSprite);
}
```

---

## Animation State Machines

### Why Use State Machines?

Animation state machines help manage complex animation logic:

- **Clear Transitions**: Define valid state changes
- **Condition-Based Switching**: Automatic transitions based on game state
- **Cleaner Code**: Separate animation logic from game logic
- **Easier Debugging**: Visual state flow

### Basic Animation State Machine

```javascript
class AnimationState {
  constructor(name, animation, options = {}) {
    this.name = name;
    this.animation = animation;
    this.transitions = [];

    // State callbacks
    this.onEnter = options.onEnter || null;
    this.onExit = options.onExit || null;
    this.onUpdate = options.onUpdate || null;
  }

  addTransition(targetState, condition, options = {}) {
    this.transitions.push({
      target: targetState,
      condition,
      priority: options.priority || 0,
      immediate: options.immediate || false
    });

    // Sort by priority (higher first)
    this.transitions.sort((a, b) => b.priority - a.priority);

    return this;
  }
}

class AnimationStateMachine {
  constructor(animationController) {
    this.controller = animationController;
    this.states = new Map();
    this.currentState = null;
    this.context = {}; // Shared context for conditions
  }

  addState(name, animationName, options = {}) {
    const animation = this.controller.animations.get(animationName);
    const state = new AnimationState(name, animation, options);
    this.states.set(name, state);
    return state;
  }

  setState(stateName) {
    const newState = this.states.get(stateName);

    if (!newState) {
      console.warn(`State not found: ${stateName}`);
      return;
    }

    // Exit current state
    if (this.currentState && this.currentState.onExit) {
      this.currentState.onExit(this.context);
    }

    // Enter new state
    this.currentState = newState;
    this.controller.play(newState.animation.name, true);

    if (newState.onEnter) {
      newState.onEnter(this.context);
    }
  }

  update(deltaTime) {
    if (!this.currentState) return;

    // Update animation
    this.controller.update(deltaTime);

    // Run state update callback
    if (this.currentState.onUpdate) {
      this.currentState.onUpdate(this.context, deltaTime);
    }

    // Check transitions
    for (const transition of this.currentState.transitions) {
      if (transition.condition(this.context)) {
        // Check if animation should complete first
        if (!transition.immediate && !this.controller.currentAnimation.loop) {
          if (!this.controller.currentAnimation.isComplete(this.controller.currentTime)) {
            continue;
          }
        }

        this.setState(transition.target);
        break;
      }
    }
  }

  setContext(key, value) {
    this.context[key] = value;
  }

  getContext(key) {
    return this.context[key];
  }
}
```

### Complete Character Controller Example

```javascript
class CharacterAnimator {
  constructor(spriteSheet) {
    this.controller = new AnimationController(spriteSheet);
    this.stateMachine = new AnimationStateMachine(this.controller);

    this.setupAnimations();
    this.setupStates();
  }

  setupAnimations() {
    this.controller
      .addAnimation('idle', [0, 1, 2, 3], 150, { loop: true })
      .addAnimation('walk', [4, 5, 6, 7, 8, 9], 100, { loop: true })
      .addAnimation('run', [10, 11, 12, 13, 14, 15], 80, { loop: true })
      .addAnimation('jump_start', [16, 17], 100, { loop: false })
      .addAnimation('jump_air', [18], 100, { loop: true })
      .addAnimation('jump_land', [19, 20], 80, { loop: false })
      .addAnimation('attack', [21, 22, 23, 24, 25], 60, { loop: false })
      .addAnimation('hurt', [26, 27], 100, { loop: false })
      .addAnimation('death', [28, 29, 30, 31], 150, { loop: false });
  }

  setupStates() {
    const sm = this.stateMachine;

    // Define states
    const idleState = sm.addState('idle', 'idle');
    const walkState = sm.addState('walk', 'walk');
    const runState = sm.addState('run', 'run');
    const jumpStartState = sm.addState('jump_start', 'jump_start');
    const jumpAirState = sm.addState('jump_air', 'jump_air');
    const jumpLandState = sm.addState('jump_land', 'jump_land');
    const attackState = sm.addState('attack', 'attack');
    const hurtState = sm.addState('hurt', 'hurt');
    const deathState = sm.addState('death', 'death');

    // Idle transitions
    idleState
      .addTransition('walk', ctx => ctx.isMoving && !ctx.isRunning)
      .addTransition('run', ctx => ctx.isMoving && ctx.isRunning)
      .addTransition('jump_start', ctx => ctx.isJumping, { priority: 1 })
      .addTransition('attack', ctx => ctx.isAttacking, { priority: 2 })
      .addTransition('hurt', ctx => ctx.isHurt, { priority: 3 })
      .addTransition('death', ctx => ctx.isDead, { priority: 4 });

    // Walk transitions
    walkState
      .addTransition('idle', ctx => !ctx.isMoving)
      .addTransition('run', ctx => ctx.isRunning)
      .addTransition('jump_start', ctx => ctx.isJumping, { priority: 1 })
      .addTransition('attack', ctx => ctx.isAttacking, { priority: 2 })
      .addTransition('hurt', ctx => ctx.isHurt, { priority: 3 });

    // Run transitions
    runState
      .addTransition('idle', ctx => !ctx.isMoving)
      .addTransition('walk', ctx => !ctx.isRunning)
      .addTransition('jump_start', ctx => ctx.isJumping, { priority: 1 })
      .addTransition('attack', ctx => ctx.isAttacking, { priority: 2 })
      .addTransition('hurt', ctx => ctx.isHurt, { priority: 3 });

    // Jump transitions
    jumpStartState
      .addTransition('jump_air', ctx => true); // Auto-transition after animation

    jumpAirState
      .addTransition('jump_land', ctx => ctx.isGrounded)
      .addTransition('hurt', ctx => ctx.isHurt, { priority: 1 });

    jumpLandState
      .addTransition('idle', ctx => !ctx.isMoving)
      .addTransition('walk', ctx => ctx.isMoving && !ctx.isRunning)
      .addTransition('run', ctx => ctx.isMoving && ctx.isRunning);

    // Attack transitions
    attackState
      .addTransition('idle', ctx => !ctx.isMoving)
      .addTransition('walk', ctx => ctx.isMoving)
      .addTransition('hurt', ctx => ctx.isHurt, { immediate: true, priority: 1 });

    // Hurt transitions
    hurtState
      .addTransition('idle', ctx => !ctx.isHurt && !ctx.isDead)
      .addTransition('death', ctx => ctx.isDead, { priority: 1 });

    // Death state has no transitions (terminal state)

    // Set initial state
    sm.setState('idle');
  }

  update(deltaTime, characterState) {
    // Update context from character state
    this.stateMachine.context = {
      isMoving: characterState.velocity.x !== 0,
      isRunning: characterState.isRunning,
      isJumping: characterState.justJumped,
      isGrounded: characterState.isGrounded,
      isAttacking: characterState.isAttacking,
      isHurt: characterState.isHurt,
      isDead: characterState.health <= 0
    };

    this.stateMachine.update(deltaTime);
  }

  applyToSprite(sprite) {
    this.controller.applyToSprite(sprite);
  }

  getCurrentState() {
    return this.stateMachine.currentState?.name;
  }
}

// Usage in game
class Player {
  constructor(spriteSheet) {
    this.sprite = new Sprite(spriteSheet.texture);
    this.animator = new CharacterAnimator(spriteSheet);

    this.position = { x: 100, y: 300 };
    this.velocity = { x: 0, y: 0 };
    this.isGrounded = true;
    this.isRunning = false;
    this.isAttacking = false;
    this.isHurt = false;
    this.justJumped = false;
    this.health = 100;
  }

  update(deltaTime) {
    // Update animator with current state
    this.animator.update(deltaTime, {
      velocity: this.velocity,
      isRunning: this.isRunning,
      isGrounded: this.isGrounded,
      isAttacking: this.isAttacking,
      isHurt: this.isHurt,
      justJumped: this.justJumped,
      health: this.health
    });

    // Apply animation to sprite
    this.animator.applyToSprite(this.sprite);

    // Update sprite position
    this.sprite.x = this.position.x;
    this.sprite.y = this.position.y;

    // Reset one-frame flags
    this.justJumped = false;
  }
}
```

---

## Particle System Basics

### What is a Particle System?

Particle systems create visual effects by simulating and rendering large numbers of small, simple graphics. Common uses include:

- Fire, smoke, and explosions
- Rain, snow, and weather effects
- Magic spells and power-ups
- Dust, debris, and impact effects
- UI effects like sparkles

### Basic Particle

```javascript
class Particle {
  constructor() {
    // Position
    this.x = 0;
    this.y = 0;

    // Velocity
    this.vx = 0;
    this.vy = 0;

    // Acceleration (for gravity, etc.)
    this.ax = 0;
    this.ay = 0;

    // Visual properties
    this.scale = 1;
    this.rotation = 0;
    this.alpha = 1;
    this.color = { r: 255, g: 255, b: 255 };

    // Lifecycle
    this.life = 1;        // Current life (0-1)
    this.maxLife = 1000;  // Maximum life in ms
    this.age = 0;         // Current age in ms

    // Animation rates
    this.rotationSpeed = 0;
    this.scaleSpeed = 0;
    this.alphaSpeed = 0;

    // State
    this.active = false;
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.scale = 1;
    this.rotation = 0;
    this.alpha = 1;
    this.life = 1;
    this.age = 0;
    this.active = false;
  }

  update(deltaTime) {
    if (!this.active) return;

    // Update age and life
    this.age += deltaTime;
    this.life = 1 - (this.age / this.maxLife);

    if (this.life <= 0) {
      this.active = false;
      return;
    }

    // Update velocity
    this.vx += this.ax * (deltaTime / 1000);
    this.vy += this.ay * (deltaTime / 1000);

    // Update position
    this.x += this.vx * (deltaTime / 1000);
    this.y += this.vy * (deltaTime / 1000);

    // Update visual properties
    this.rotation += this.rotationSpeed * (deltaTime / 1000);
    this.scale += this.scaleSpeed * (deltaTime / 1000);
    this.alpha += this.alphaSpeed * (deltaTime / 1000);

    // Clamp values
    this.alpha = Math.max(0, Math.min(1, this.alpha));
    this.scale = Math.max(0, this.scale);
  }
}
```

### Particle Emitter

```javascript
class ParticleEmitter {
  constructor(options = {}) {
    this.x = options.x || 0;
    this.y = options.y || 0;

    // Emission settings
    this.emissionRate = options.emissionRate || 10; // particles per second
    this.maxParticles = options.maxParticles || 100;
    this.emissionArea = options.emissionArea || { width: 0, height: 0 };

    // Particle lifetime
    this.particleLife = options.particleLife || { min: 500, max: 1000 };

    // Initial velocity
    this.speed = options.speed || { min: 50, max: 100 };
    this.angle = options.angle || { min: 0, max: Math.PI * 2 };

    // Acceleration (gravity)
    this.gravity = options.gravity || { x: 0, y: 0 };

    // Visual settings
    this.startScale = options.startScale || { min: 1, max: 1 };
    this.endScale = options.endScale || { min: 0, max: 0 };
    this.startAlpha = options.startAlpha || { min: 1, max: 1 };
    this.endAlpha = options.endAlpha || { min: 0, max: 0 };
    this.startColor = options.startColor || { r: 255, g: 255, b: 255 };
    this.endColor = options.endColor || null;

    // Rotation
    this.startRotation = options.startRotation || { min: 0, max: 0 };
    this.rotationSpeed = options.rotationSpeed || { min: 0, max: 0 };

    // Particle pool
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(new Particle());
    }

    // Emission state
    this.emitting = false;
    this.emissionAccumulator = 0;
  }

  start() {
    this.emitting = true;
    return this;
  }

  stop() {
    this.emitting = false;
    return this;
  }

  // Emit a burst of particles
  burst(count) {
    for (let i = 0; i < count; i++) {
      this.emitParticle();
    }
    return this;
  }

  emitParticle() {
    // Find inactive particle
    const particle = this.particles.find(p => !p.active);
    if (!particle) return null;

    // Initialize particle
    particle.reset();
    particle.active = true;

    // Position with emission area
    particle.x = this.x + this.random(-this.emissionArea.width / 2, this.emissionArea.width / 2);
    particle.y = this.y + this.random(-this.emissionArea.height / 2, this.emissionArea.height / 2);

    // Velocity
    const speed = this.random(this.speed.min, this.speed.max);
    const angle = this.random(this.angle.min, this.angle.max);
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed;

    // Acceleration
    particle.ax = this.gravity.x;
    particle.ay = this.gravity.y;

    // Lifetime
    particle.maxLife = this.random(this.particleLife.min, this.particleLife.max);

    // Visual properties
    const startScale = this.random(this.startScale.min, this.startScale.max);
    const endScale = this.random(this.endScale.min, this.endScale.max);
    particle.scale = startScale;
    particle.scaleSpeed = (endScale - startScale) / (particle.maxLife / 1000);

    const startAlpha = this.random(this.startAlpha.min, this.startAlpha.max);
    const endAlpha = this.random(this.endAlpha.min, this.endAlpha.max);
    particle.alpha = startAlpha;
    particle.alphaSpeed = (endAlpha - startAlpha) / (particle.maxLife / 1000);

    // Rotation
    particle.rotation = this.random(this.startRotation.min, this.startRotation.max);
    particle.rotationSpeed = this.random(this.rotationSpeed.min, this.rotationSpeed.max);

    // Color
    particle.color = { ...this.startColor };
    if (this.endColor) {
      particle.startColor = { ...this.startColor };
      particle.endColor = { ...this.endColor };
    }

    return particle;
  }

  update(deltaTime) {
    // Emit new particles
    if (this.emitting) {
      this.emissionAccumulator += deltaTime;
      const particlesToEmit = Math.floor(this.emissionAccumulator / (1000 / this.emissionRate));

      for (let i = 0; i < particlesToEmit; i++) {
        this.emitParticle();
      }

      this.emissionAccumulator %= (1000 / this.emissionRate);
    }

    // Update active particles
    for (const particle of this.particles) {
      if (!particle.active) continue;

      particle.update(deltaTime);

      // Color interpolation
      if (particle.startColor && particle.endColor) {
        const t = 1 - particle.life;
        particle.color.r = this.lerp(particle.startColor.r, particle.endColor.r, t);
        particle.color.g = this.lerp(particle.startColor.g, particle.endColor.g, t);
        particle.color.b = this.lerp(particle.startColor.b, particle.endColor.b, t);
      }
    }
  }

  getActiveParticles() {
    return this.particles.filter(p => p.active);
  }

  getActiveCount() {
    return this.particles.filter(p => p.active).length;
  }

  random(min, max) {
    return min + Math.random() * (max - min);
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }
}
```

### Particle Renderer

```javascript
class ParticleRenderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(emitter, particleTexture = null) {
    const particles = emitter.getActiveParticles();

    for (const particle of particles) {
      this.ctx.save();

      this.ctx.globalAlpha = particle.alpha;
      this.ctx.translate(particle.x, particle.y);
      this.ctx.rotate(particle.rotation);
      this.ctx.scale(particle.scale, particle.scale);

      if (particleTexture) {
        // Draw texture
        const halfWidth = particleTexture.width / 2;
        const halfHeight = particleTexture.height / 2;

        this.ctx.drawImage(
          particleTexture,
          -halfWidth,
          -halfHeight
        );
      } else {
        // Draw circle
        const { r, g, b } = particle.color;
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }
}

// Usage example: Fire effect
const fireEmitter = new ParticleEmitter({
  x: 400,
  y: 500,
  emissionRate: 50,
  maxParticles: 200,
  emissionArea: { width: 20, height: 5 },
  particleLife: { min: 500, max: 1500 },
  speed: { min: 80, max: 150 },
  angle: { min: -Math.PI * 0.6, max: -Math.PI * 0.4 }, // Upward cone
  gravity: { x: 0, y: -50 }, // Slight upward force
  startScale: { min: 1, max: 1.5 },
  endScale: { min: 0, max: 0 },
  startAlpha: { min: 0.8, max: 1 },
  endAlpha: { min: 0, max: 0 },
  startColor: { r: 255, g: 200, b: 50 },
  endColor: { r: 255, g: 50, b: 0 }
});

fireEmitter.start();
```

### Prebuilt Effect Presets

```javascript
class ParticleEffects {
  static explosion(x, y) {
    const emitter = new ParticleEmitter({
      x, y,
      maxParticles: 100,
      particleLife: { min: 200, max: 500 },
      speed: { min: 200, max: 500 },
      angle: { min: 0, max: Math.PI * 2 },
      gravity: { x: 0, y: 300 },
      startScale: { min: 1, max: 2 },
      endScale: { min: 0, max: 0 },
      startAlpha: { min: 1, max: 1 },
      endAlpha: { min: 0, max: 0 },
      startColor: { r: 255, g: 200, b: 100 },
      endColor: { r: 100, g: 50, b: 50 }
    });

    emitter.burst(50);
    return emitter;
  }

  static smoke(x, y) {
    return new ParticleEmitter({
      x, y,
      emissionRate: 20,
      maxParticles: 100,
      emissionArea: { width: 10, height: 10 },
      particleLife: { min: 1000, max: 2000 },
      speed: { min: 20, max: 50 },
      angle: { min: -Math.PI * 0.7, max: -Math.PI * 0.3 },
      gravity: { x: 0, y: -10 },
      startScale: { min: 0.5, max: 1 },
      endScale: { min: 2, max: 3 },
      startAlpha: { min: 0.5, max: 0.7 },
      endAlpha: { min: 0, max: 0 },
      startColor: { r: 100, g: 100, b: 100 },
      endColor: { r: 50, g: 50, b: 50 }
    });
  }

  static sparkle(x, y) {
    return new ParticleEmitter({
      x, y,
      emissionRate: 10,
      maxParticles: 30,
      emissionArea: { width: 50, height: 50 },
      particleLife: { min: 300, max: 600 },
      speed: { min: 10, max: 30 },
      angle: { min: 0, max: Math.PI * 2 },
      gravity: { x: 0, y: 20 },
      startScale: { min: 0.5, max: 1 },
      endScale: { min: 0, max: 0 },
      startAlpha: { min: 1, max: 1 },
      endAlpha: { min: 0, max: 0 },
      startColor: { r: 255, g: 255, b: 200 }
    });
  }

  static rain(canvasWidth) {
    return new ParticleEmitter({
      x: canvasWidth / 2,
      y: -10,
      emissionRate: 100,
      maxParticles: 500,
      emissionArea: { width: canvasWidth, height: 0 },
      particleLife: { min: 1000, max: 2000 },
      speed: { min: 400, max: 600 },
      angle: { min: Math.PI * 0.45, max: Math.PI * 0.55 },
      gravity: { x: 0, y: 100 },
      startScale: { min: 1, max: 1 },
      endScale: { min: 1, max: 1 },
      startAlpha: { min: 0.3, max: 0.6 },
      endAlpha: { min: 0.3, max: 0.6 },
      startColor: { r: 150, g: 180, b: 255 }
    });
  }
}
```

---

## Batch Rendering Optimization

### Why Batch Rendering?

Every draw call has overhead. Batch rendering combines multiple sprites into fewer draw calls:

- Reduces CPU to GPU communication
- Minimizes state changes
- Essential for rendering many sprites efficiently

### Sprite Batch for Canvas

```javascript
class SpriteBatch {
  constructor(ctx, maxBatchSize = 1000) {
    this.ctx = ctx;
    this.maxBatchSize = maxBatchSize;
    this.batches = new Map(); // Group by texture
    this.drawCalls = 0;
  }

  begin() {
    this.batches.clear();
    this.drawCalls = 0;
  }

  draw(sprite) {
    const texture = sprite.texture;

    if (!this.batches.has(texture)) {
      this.batches.set(texture, []);
    }

    const batch = this.batches.get(texture);
    batch.push(sprite);

    // Flush if batch is full
    if (batch.length >= this.maxBatchSize) {
      this.flushBatch(texture, batch);
      batch.length = 0;
    }
  }

  end() {
    // Flush all remaining batches
    for (const [texture, batch] of this.batches) {
      if (batch.length > 0) {
        this.flushBatch(texture, batch);
      }
    }
  }

  flushBatch(texture, sprites) {
    this.drawCalls++;

    // Sort by depth/z-order if needed
    sprites.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    for (const sprite of sprites) {
      if (!sprite.visible || sprite.alpha <= 0) continue;

      const ctx = this.ctx;
      const originOffsetX = sprite.sourceWidth * sprite.originX;
      const originOffsetY = sprite.sourceHeight * sprite.originY;

      ctx.save();
      ctx.globalAlpha = sprite.alpha;
      ctx.translate(sprite.x, sprite.y);
      ctx.rotate(sprite.rotation);
      ctx.scale(
        sprite.flipX ? -sprite.scaleX : sprite.scaleX,
        sprite.flipY ? -sprite.scaleY : sprite.scaleY
      );

      ctx.drawImage(
        texture,
        sprite.sourceX, sprite.sourceY,
        sprite.sourceWidth, sprite.sourceHeight,
        -originOffsetX, -originOffsetY,
        sprite.sourceWidth, sprite.sourceHeight
      );

      ctx.restore();
    }
  }

  getDrawCalls() {
    return this.drawCalls;
  }
}
```

### WebGL Sprite Batch

For best performance, use WebGL with proper batching:

```javascript
class WebGLSpriteBatch {
  constructor(gl, maxSprites = 10000) {
    this.gl = gl;
    this.maxSprites = maxSprites;
    this.spriteCount = 0;

    // 4 vertices per sprite, 4 floats per vertex (x, y, u, v)
    this.vertexData = new Float32Array(maxSprites * 4 * 4);
    // 6 indices per sprite (2 triangles)
    this.indexData = new Uint16Array(maxSprites * 6);

    this.setupBuffers();
    this.setupShader();
    this.generateIndices();

    this.currentTexture = null;
    this.drawCalls = 0;
  }

  setupBuffers() {
    const gl = this.gl;

    this.vertexBuffer = gl.createBuffer();
    this.indexBuffer = gl.createBuffer();

    // Upload index data (static)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indexData, gl.STATIC_DRAW);
  }

  generateIndices() {
    for (let i = 0; i < this.maxSprites; i++) {
      const vertexOffset = i * 4;
      const indexOffset = i * 6;

      this.indexData[indexOffset + 0] = vertexOffset + 0;
      this.indexData[indexOffset + 1] = vertexOffset + 1;
      this.indexData[indexOffset + 2] = vertexOffset + 2;
      this.indexData[indexOffset + 3] = vertexOffset + 2;
      this.indexData[indexOffset + 4] = vertexOffset + 3;
      this.indexData[indexOffset + 5] = vertexOffset + 0;
    }
  }

  setupShader() {
    const vertexShader = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;

      uniform mat4 u_projection;

      varying vec2 v_texCoord;

      void main() {
        gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;

      uniform sampler2D u_texture;

      varying vec2 v_texCoord;

      void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord);
      }
    `;

    // Compile and link shader (implementation omitted for brevity)
    this.program = this.createProgram(vertexShader, fragmentShader);
  }

  begin() {
    this.spriteCount = 0;
    this.currentTexture = null;
    this.drawCalls = 0;
  }

  draw(sprite) {
    // Flush if texture changes or batch is full
    if (this.currentTexture !== sprite.texture ||
        this.spriteCount >= this.maxSprites) {
      this.flush();
      this.currentTexture = sprite.texture;
    }

    // Calculate vertices
    const offset = this.spriteCount * 16; // 4 vertices * 4 floats

    const x1 = sprite.x - sprite.originX * sprite.sourceWidth * sprite.scaleX;
    const y1 = sprite.y - sprite.originY * sprite.sourceHeight * sprite.scaleY;
    const x2 = x1 + sprite.sourceWidth * sprite.scaleX;
    const y2 = y1 + sprite.sourceHeight * sprite.scaleY;

    const u1 = sprite.sourceX / sprite.texture.width;
    const v1 = sprite.sourceY / sprite.texture.height;
    const u2 = (sprite.sourceX + sprite.sourceWidth) / sprite.texture.width;
    const v2 = (sprite.sourceY + sprite.sourceHeight) / sprite.texture.height;

    // Top-left
    this.vertexData[offset + 0] = x1;
    this.vertexData[offset + 1] = y1;
    this.vertexData[offset + 2] = u1;
    this.vertexData[offset + 3] = v1;

    // Top-right
    this.vertexData[offset + 4] = x2;
    this.vertexData[offset + 5] = y1;
    this.vertexData[offset + 6] = u2;
    this.vertexData[offset + 7] = v1;

    // Bottom-right
    this.vertexData[offset + 8] = x2;
    this.vertexData[offset + 9] = y2;
    this.vertexData[offset + 10] = u2;
    this.vertexData[offset + 11] = v2;

    // Bottom-left
    this.vertexData[offset + 12] = x1;
    this.vertexData[offset + 13] = y2;
    this.vertexData[offset + 14] = u1;
    this.vertexData[offset + 15] = v2;

    this.spriteCount++;
  }

  flush() {
    if (this.spriteCount === 0) return;

    const gl = this.gl;

    // Upload vertex data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
      this.vertexData.subarray(0, this.spriteCount * 16),
      gl.DYNAMIC_DRAW
    );

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.currentTexture);

    // Draw
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.spriteCount * 6, gl.UNSIGNED_SHORT, 0);

    this.drawCalls++;
    this.spriteCount = 0;
  }

  end() {
    this.flush();
  }

  createProgram(vs, fs) {
    // Shader compilation implementation
    // Returns WebGLProgram
  }
}
```

---

## 9-Slice Scaling

### What is 9-Slice Scaling?

9-slice (or 9-patch) scaling divides an image into 9 regions that scale differently:

```
+---+-------+---+
| 1 |   2   | 3 |  <- Corners (1,3,7,9) don't scale
+---+-------+---+
|   |       |   |
| 4 |   5   | 6 |  <- Edges (2,8) scale horizontally
|   |       |   |     Edges (4,6) scale vertically
+---+-------+---+     Center (5) scales both ways
| 7 |   8   | 9 |
+---+-------+---+
```

This is essential for UI elements like buttons, panels, and windows that need to resize while maintaining crisp borders.

### 9-Slice Sprite Implementation

```javascript
class NineSliceSprite {
  constructor(texture, slices) {
    this.texture = texture;

    // Slice borders: { left, right, top, bottom }
    this.left = slices.left;
    this.right = slices.right;
    this.top = slices.top;
    this.bottom = slices.bottom;

    // Position and size
    this.x = 0;
    this.y = 0;
    this.width = texture.width;
    this.height = texture.height;

    // Calculate source regions
    this.updateSlices();
  }

  updateSlices() {
    const tw = this.texture.width;
    const th = this.texture.height;
    const { left, right, top, bottom } = this;

    // Middle dimensions
    const middleWidth = tw - left - right;
    const middleHeight = th - top - bottom;

    // 9 source regions [x, y, width, height]
    this.sliceRegions = {
      topLeft: [0, 0, left, top],
      topCenter: [left, 0, middleWidth, top],
      topRight: [tw - right, 0, right, top],

      middleLeft: [0, top, left, middleHeight],
      middleCenter: [left, top, middleWidth, middleHeight],
      middleRight: [tw - right, top, right, middleHeight],

      bottomLeft: [0, th - bottom, left, bottom],
      bottomCenter: [left, th - bottom, middleWidth, bottom],
      bottomRight: [tw - right, th - bottom, right, bottom]
    };
  }

  setSize(width, height) {
    this.width = Math.max(width, this.left + this.right);
    this.height = Math.max(height, this.top + this.bottom);
    return this;
  }

  render(ctx) {
    const { x, y, width, height, left, right, top, bottom } = this;
    const texture = this.texture;

    // Calculate destination middle dimensions
    const destMiddleWidth = width - left - right;
    const destMiddleHeight = height - top - bottom;

    // Draw all 9 slices
    const slices = this.sliceRegions;

    // Top row
    this.drawSlice(ctx, slices.topLeft, x, y, left, top);
    this.drawSlice(ctx, slices.topCenter, x + left, y, destMiddleWidth, top);
    this.drawSlice(ctx, slices.topRight, x + width - right, y, right, top);

    // Middle row
    this.drawSlice(ctx, slices.middleLeft, x, y + top, left, destMiddleHeight);
    this.drawSlice(ctx, slices.middleCenter, x + left, y + top, destMiddleWidth, destMiddleHeight);
    this.drawSlice(ctx, slices.middleRight, x + width - right, y + top, right, destMiddleHeight);

    // Bottom row
    this.drawSlice(ctx, slices.bottomLeft, x, y + height - bottom, left, bottom);
    this.drawSlice(ctx, slices.bottomCenter, x + left, y + height - bottom, destMiddleWidth, bottom);
    this.drawSlice(ctx, slices.bottomRight, x + width - right, y + height - bottom, right, bottom);
  }

  drawSlice(ctx, source, dx, dy, dw, dh) {
    if (dw <= 0 || dh <= 0) return;

    ctx.drawImage(
      this.texture,
      source[0], source[1], source[2], source[3],
      dx, dy, dw, dh
    );
  }
}

// Usage
const buttonTexture = await loadImage('button.png');
const button = new NineSliceSprite(buttonTexture, {
  left: 10,
  right: 10,
  top: 10,
  bottom: 10
});

button.x = 100;
button.y = 100;
button.setSize(200, 50);
button.render(ctx);
```

### UI Panel Component

```javascript
class UIPanel {
  constructor(texture, slices) {
    this.nineSlice = new NineSliceSprite(texture, slices);
    this.children = [];
    this.padding = { left: 10, right: 10, top: 10, bottom: 10 };

    // Content area
    this.contentX = 0;
    this.contentY = 0;
    this.contentWidth = 0;
    this.contentHeight = 0;
  }

  setPosition(x, y) {
    this.nineSlice.x = x;
    this.nineSlice.y = y;
    this.updateContentArea();
    return this;
  }

  setSize(width, height) {
    this.nineSlice.setSize(width, height);
    this.updateContentArea();
    return this;
  }

  setPadding(left, right, top, bottom) {
    this.padding = { left, right, top, bottom };
    this.updateContentArea();
    return this;
  }

  updateContentArea() {
    this.contentX = this.nineSlice.x + this.padding.left;
    this.contentY = this.nineSlice.y + this.padding.top;
    this.contentWidth = this.nineSlice.width - this.padding.left - this.padding.right;
    this.contentHeight = this.nineSlice.height - this.padding.top - this.padding.bottom;
  }

  addChild(child) {
    this.children.push(child);
    return this;
  }

  render(ctx) {
    // Draw panel background
    this.nineSlice.render(ctx);

    // Draw children (clipped to content area)
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.contentX, this.contentY, this.contentWidth, this.contentHeight);
    ctx.clip();

    for (const child of this.children) {
      if (child.render) {
        child.render(ctx);
      }
    }

    ctx.restore();
  }
}
```

---

## Complete Example: Game Scene

A complete example combining all the concepts:

```javascript
class GameScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sprites = [];
    this.emitters = [];
    this.lastTime = 0;

    this.init();
  }

  async init() {
    // Load textures
    const loader = new TextureLoader();

    this.playerSheet = await loader.load('player-sheet.png');
    this.backgroundTexture = await loader.load('background.png');
    this.particleTexture = await loader.load('particle.png');
    this.uiPanelTexture = await loader.load('panel.png');

    // Create sprite sheet
    this.playerSpriteSheet = new GridSpriteSheet(this.playerSheet, 64, 64);

    // Create player
    this.player = this.createPlayer();

    // Create UI
    this.statsPanel = new UIPanel(this.uiPanelTexture, {
      left: 15, right: 15, top: 15, bottom: 15
    });
    this.statsPanel.setPosition(10, 10).setSize(200, 100);

    // Create particle effects
    this.dustEmitter = ParticleEffects.smoke(400, 500);
    this.dustEmitter.start();
    this.emitters.push(this.dustEmitter);

    // Create renderers
    this.spriteBatch = new SpriteBatch(this.ctx);
    this.particleRenderer = new ParticleRenderer(this.ctx);

    // Start game loop
    this.gameLoop(0);
  }

  createPlayer() {
    const player = {
      sprite: this.playerSpriteSheet.createSprite(0),
      animator: new CharacterAnimator(this.playerSpriteSheet),
      position: { x: 400, y: 300 },
      velocity: { x: 0, y: 0 },
      isGrounded: true,
      isRunning: false,
      isAttacking: false,
      isHurt: false,
      justJumped: false,
      health: 100
    };

    player.sprite.setPosition(player.position.x, player.position.y);
    player.sprite.centerOrigin();

    return player;
  }

  gameLoop(currentTime) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(time => this.gameLoop(time));
  }

  update(deltaTime) {
    // Update player
    this.player.animator.update(deltaTime, {
      velocity: this.player.velocity,
      isRunning: this.player.isRunning,
      isGrounded: this.player.isGrounded,
      isAttacking: this.player.isAttacking,
      isHurt: this.player.isHurt,
      justJumped: this.player.justJumped,
      health: this.player.health
    });

    this.player.animator.applyToSprite(this.player.sprite);
    this.player.sprite.setPosition(
      this.player.position.x,
      this.player.position.y
    );

    // Update particle emitters
    for (const emitter of this.emitters) {
      emitter.update(deltaTime);
    }

    // Remove inactive emitters
    this.emitters = this.emitters.filter(
      e => e.emitting || e.getActiveCount() > 0
    );
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background
    this.ctx.drawImage(this.backgroundTexture, 0, 0);

    // Batch render sprites
    this.spriteBatch.begin();
    this.spriteBatch.draw(this.player.sprite);

    for (const sprite of this.sprites) {
      this.spriteBatch.draw(sprite);
    }

    this.spriteBatch.end();

    // Render particles
    for (const emitter of this.emitters) {
      this.particleRenderer.render(emitter, this.particleTexture);
    }

    // Render UI
    this.statsPanel.render(this.ctx);

    // Draw debug info
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '14px monospace';
    this.ctx.fillText(
      `Draw calls: ${this.spriteBatch.getDrawCalls()}`,
      this.canvas.width - 150,
      20
    );
    this.ctx.fillText(
      `Particles: ${this.emitters.reduce((s, e) => s + e.getActiveCount(), 0)}`,
      this.canvas.width - 150,
      40
    );
  }

  // Input handling
  handleKeyDown(key) {
    switch (key) {
      case 'ArrowLeft':
        this.player.velocity.x = -200;
        break;
      case 'ArrowRight':
        this.player.velocity.x = 200;
        break;
      case 'Space':
        if (this.player.isGrounded) {
          this.player.justJumped = true;
          this.player.isGrounded = false;
        }
        break;
      case 'Shift':
        this.player.isRunning = true;
        break;
    }
  }

  handleKeyUp(key) {
    switch (key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        this.player.velocity.x = 0;
        break;
      case 'Shift':
        this.player.isRunning = false;
        break;
    }
  }

  // Create explosion effect at position
  createExplosion(x, y) {
    const emitter = ParticleEffects.explosion(x, y);
    this.emitters.push(emitter);
  }
}

// Initialize game
const canvas = document.getElementById('gameCanvas');
canvas.width = 800;
canvas.height = 600;

const game = new GameScene(canvas);

// Setup input handlers
document.addEventListener('keydown', e => game.handleKeyDown(e.code));
document.addEventListener('keyup', e => game.handleKeyUp(e.code));
```

---

## Key Takeaways

### Performance Tips

1. **Use Texture Atlases**: Combine sprites into single textures to reduce draw calls
2. **Batch Rendering**: Group sprites by texture and render together
3. **Object Pooling**: Reuse particle and sprite objects instead of creating new ones
4. **Dirty Rectangles**: Only redraw areas that changed
5. **Spatial Partitioning**: Skip off-screen sprites

### Best Practices

1. **Separate Logic from Rendering**: Keep game logic and rendering code distinct
2. **Use State Machines**: Manage complex animation flows cleanly
3. **Plan Your Atlas Layout**: Consider animation groups and access patterns
4. **Profile Regularly**: Measure actual performance, don't assume

### Common Pitfalls

1. **Too Many Textures**: Each texture switch costs performance
2. **Creating Objects in Loops**: Pre-allocate and pool objects
3. **Overdrawing**: Minimize overlapping transparent sprites
4. **Large Sprites**: Use 9-slice scaling for UI elements

---

## Summary

The 2D sprite system is the foundation of 2D game graphics. From basic sprite rendering to complex animation state machines and particle effects, understanding these concepts enables you to build visually rich and performant games.

Key components covered:

- **Sprites**: The basic building block with position, rotation, scale, and texture
- **Sprite Sheets**: Efficient organization of multiple frames in a single texture
- **Texture Atlas Packing**: Algorithms to optimally pack images
- **Animation**: Frame-based animation with timing and looping
- **State Machines**: Managing complex animation transitions
- **Particle Systems**: Creating dynamic visual effects
- **Batch Rendering**: Optimizing draw calls for performance
- **9-Slice Scaling**: Resizable UI elements with preserved borders

With these tools, you can create everything from simple mobile games to complex action platformers. The techniques apply across frameworks and engines, making this knowledge transferable to Unity, Godot, or custom solutions.
