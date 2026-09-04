---
title: 2D 精灵系统详解
description: 掌握2D游戏核心技术：精灵表、动画系统和粒子效果
track: gamedev
section: gameplay-systems
difficulty: beginner
tags:
  - 精灵
  - 2D
  - 动画
  - 粒子系统
status: imported
origin: old/src/content/docs/gamedev/sprite-system.zh.md
divergence: 0.269
issues: []
legacy:
  category: GameDev
  subcategory: 2D
  order: 26
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是精灵（Sprite）？

精灵（Sprite）是 2D 游戏开发中最基础也是最重要的概念之一。它是一个可以在屏幕上独立移动、旋转和缩放的 2D 图像对象。从技术角度来说，精灵就是一张带有位置、旋转、缩放等变换属性的纹理图像。

精灵这个术语源于早期游戏硬件中的专用图形处理器，这些处理器可以独立于背景绘制多个可移动的图像。现代游戏引擎虽然不再依赖专用硬件，但精灵的概念依然是 2D 游戏开发的基石。

### 精灵的核心属性

一个完整的精灵通常包含以下属性：

| 属性 | 说明 |
|------|------|
| 纹理（Texture） | 精灵使用的图像资源 |
| 位置（Position） | 精灵在游戏世界中的 X、Y 坐标 |
| 旋转（Rotation） | 精灵的旋转角度 |
| 缩放（Scale） | 精灵的水平和垂直缩放比例 |
| 锚点（Anchor/Pivot） | 精灵的旋转和定位参考点 |
| 透明度（Alpha/Opacity） | 精灵的不透明度 |
| 层级（Z-Order/Layer） | 精灵的绘制顺序 |

### 为什么需要精灵系统？

1. **资源复用**：多个游戏对象可以共享同一张纹理
2. **性能优化**：通过精灵表和批量渲染减少 GPU 调用
3. **动画支持**：通过切换精灵帧实现流畅的动画效果
4. **灵活变换**：支持对图像进行各种几何变换

---

## 精灵基础

### 基本精灵类实现

```javascript
class Sprite {
  constructor(texture, x = 0, y = 0) {
    this.texture = texture;          // 纹理图像
    this.x = x;                       // X 坐标
    this.y = y;                       // Y 坐标
    this.width = texture.width;       // 宽度
    this.height = texture.height;     // 高度
    this.rotation = 0;                // 旋转角度（弧度）
    this.scaleX = 1;                  // 水平缩放
    this.scaleY = 1;                  // 垂直缩放
    this.anchorX = 0.5;               // 锚点 X（0-1）
    this.anchorY = 0.5;               // 锚点 Y（0-1）
    this.alpha = 1;                   // 透明度（0-1）
    this.visible = true;              // 是否可见
    this.zIndex = 0;                  // 绘制层级
  }

  // 获取精灵的边界框
  getBounds() {
    const w = this.width * this.scaleX;
    const h = this.height * this.scaleY;
    return {
      x: this.x - w * this.anchorX,
      y: this.y - h * this.anchorY,
      width: w,
      height: h
    };
  }

  // 检测点是否在精灵内
  containsPoint(px, py) {
    const bounds = this.getBounds();
    return px >= bounds.x &&
           px <= bounds.x + bounds.width &&
           py >= bounds.y &&
           py <= bounds.y + bounds.height;
  }

  // 渲染精灵
  render(ctx) {
    if (!this.visible || this.alpha <= 0) return;

    ctx.save();

    // 设置透明度
    ctx.globalAlpha = this.alpha;

    // 移动到精灵位置
    ctx.translate(this.x, this.y);

    // 应用旋转
    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }

    // 应用缩放
    if (this.scaleX !== 1 || this.scaleY !== 1) {
      ctx.scale(this.scaleX, this.scaleY);
    }

    // 绘制纹理（考虑锚点偏移）
    ctx.drawImage(
      this.texture,
      -this.width * this.anchorX,
      -this.height * this.anchorY,
      this.width,
      this.height
    );

    ctx.restore();
  }
}

// 使用示例
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const playerTexture = new Image();
playerTexture.src = 'player.png';
playerTexture.onload = () => {
  const player = new Sprite(playerTexture, 100, 100);
  player.rotation = Math.PI / 4;  // 旋转 45 度
  player.scaleX = 2;              // 水平放大 2 倍
  player.render(ctx);
};
```

### 纹理区域（Texture Region）

有时我们只需要使用纹理的一部分，这时就需要纹理区域的概念：

```javascript
class TextureRegion {
  constructor(texture, x, y, width, height) {
    this.texture = texture;   // 源纹理
    this.x = x;               // 区域起始 X
    this.y = y;               // 区域起始 Y
    this.width = width;       // 区域宽度
    this.height = height;     // 区域高度
  }
}

class RegionSprite extends Sprite {
  constructor(region, x = 0, y = 0) {
    super(region.texture, x, y);
    this.region = region;
    this.width = region.width;
    this.height = region.height;
  }

  render(ctx) {
    if (!this.visible || this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);

    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }

    if (this.scaleX !== 1 || this.scaleY !== 1) {
      ctx.scale(this.scaleX, this.scaleY);
    }

    // 绘制纹理区域
    ctx.drawImage(
      this.region.texture,
      this.region.x, this.region.y,         // 源区域位置
      this.region.width, this.region.height, // 源区域尺寸
      -this.width * this.anchorX,
      -this.height * this.anchorY,
      this.width, this.height               // 目标尺寸
    );

    ctx.restore();
  }
}
```

### 精灵容器

精灵容器用于组织和管理多个精灵，形成父子层级关系：

```javascript
class SpriteContainer {
  constructor() {
    this.children = [];
    this.x = 0;
    this.y = 0;
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.alpha = 1;
    this.visible = true;
  }

  addChild(sprite) {
    sprite.parent = this;
    this.children.push(sprite);
    this.sortChildren();
  }

  removeChild(sprite) {
    const index = this.children.indexOf(sprite);
    if (index !== -1) {
      sprite.parent = null;
      this.children.splice(index, 1);
    }
  }

  sortChildren() {
    this.children.sort((a, b) => a.zIndex - b.zIndex);
  }

  render(ctx) {
    if (!this.visible || this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha *= this.alpha;
    ctx.translate(this.x, this.y);

    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }

    if (this.scaleX !== 1 || this.scaleY !== 1) {
      ctx.scale(this.scaleX, this.scaleY);
    }

    // 渲染所有子元素
    for (const child of this.children) {
      child.render(ctx);
    }

    ctx.restore();
  }
}

// 使用示例：创建角色（包含身体和武器）
const character = new SpriteContainer();
character.x = 200;
character.y = 300;

const body = new Sprite(bodyTexture, 0, 0);
const weapon = new Sprite(weaponTexture, 20, -10);
weapon.rotation = -Math.PI / 6;

character.addChild(body);
character.addChild(weapon);

// 整体旋转角色
character.rotation = Math.PI / 4;
character.render(ctx);
```

---

## 精灵表（Sprite Sheet）

### 什么是精灵表？

精灵表是将多个小图像合并到一张大纹理中的技术。这样做的好处是：

1. **减少 HTTP 请求**：只需加载一张图片
2. **减少 GPU 状态切换**：使用同一纹理可以批量渲染
3. **减少内存碎片**：连续的纹理内存访问更高效
4. **支持纹理压缩**：大图更适合 GPU 纹理压缩格式

### 精灵表解析器

```javascript
class SpriteSheet {
  constructor(texture, frameWidth, frameHeight) {
    this.texture = texture;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.columns = Math.floor(texture.width / frameWidth);
    this.rows = Math.floor(texture.height / frameHeight);
    this.frames = [];

    this.parseFrames();
  }

  parseFrames() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        this.frames.push(new TextureRegion(
          this.texture,
          col * this.frameWidth,
          row * this.frameHeight,
          this.frameWidth,
          this.frameHeight
        ));
      }
    }
  }

  getFrame(index) {
    return this.frames[index];
  }

  getFrameByRowCol(row, col) {
    return this.frames[row * this.columns + col];
  }

  // 获取指定范围的帧（用于动画）
  getFrameRange(startIndex, count) {
    return this.frames.slice(startIndex, startIndex + count);
  }
}

// 使用示例
const characterSheet = new Image();
characterSheet.src = 'character-sheet.png';
characterSheet.onload = () => {
  const sheet = new SpriteSheet(characterSheet, 64, 64);

  // 获取第一帧
  const frame0 = sheet.getFrame(0);

  // 获取第 2 行第 3 列的帧
  const walkFrame = sheet.getFrameByRowCol(1, 2);

  // 获取行走动画帧（从索引 8 开始的 6 帧）
  const walkFrames = sheet.getFrameRange(8, 6);
};
```

### JSON 格式精灵表

更灵活的精灵表通常使用 JSON 描述文件：

```json
{
  "frames": {
    "player_idle_0": {
      "frame": { "x": 0, "y": 0, "w": 64, "h": 64 },
      "rotated": false,
      "trimmed": true,
      "spriteSourceSize": { "x": 2, "y": 1, "w": 60, "h": 62 },
      "sourceSize": { "w": 64, "h": 64 },
      "pivot": { "x": 0.5, "y": 0.5 }
    },
    "player_walk_0": {
      "frame": { "x": 64, "y": 0, "w": 64, "h": 64 },
      "rotated": false,
      "trimmed": false,
      "spriteSourceSize": { "x": 0, "y": 0, "w": 64, "h": 64 },
      "sourceSize": { "w": 64, "h": 64 },
      "pivot": { "x": 0.5, "y": 0.5 }
    }
  },
  "meta": {
    "image": "character.png",
    "size": { "w": 512, "h": 512 },
    "scale": "1"
  }
}
```

```javascript
class JSONSpriteSheet {
  constructor(texture, jsonData) {
    this.texture = texture;
    this.data = jsonData;
    this.frames = new Map();

    this.parseJSON();
  }

  parseJSON() {
    for (const [name, frameData] of Object.entries(this.data.frames)) {
      const f = frameData.frame;
      const region = new TextureRegion(
        this.texture,
        f.x, f.y, f.w, f.h
      );

      // 保存额外信息
      region.name = name;
      region.trimmed = frameData.trimmed;
      region.sourceSize = frameData.sourceSize;
      region.pivot = frameData.pivot;

      if (frameData.trimmed) {
        region.trimOffset = {
          x: frameData.spriteSourceSize.x,
          y: frameData.spriteSourceSize.y
        };
      }

      this.frames.set(name, region);
    }
  }

  getFrame(name) {
    return this.frames.get(name);
  }

  // 根据前缀获取动画帧
  getAnimationFrames(prefix) {
    const frames = [];
    for (const [name, region] of this.frames) {
      if (name.startsWith(prefix)) {
        frames.push(region);
      }
    }
    // 按名称排序
    frames.sort((a, b) => a.name.localeCompare(b.name));
    return frames;
  }
}

// 使用示例
async function loadSpriteSheet(imagePath, jsonPath) {
  const [texture, json] = await Promise.all([
    loadImage(imagePath),
    fetch(jsonPath).then(r => r.json())
  ]);

  return new JSONSpriteSheet(texture, json);
}

const sheet = await loadSpriteSheet('character.png', 'character.json');
const idleFrames = sheet.getAnimationFrames('player_idle_');
const walkFrames = sheet.getAnimationFrames('player_walk_');
```

---

## 纹理图集打包

### 图集打包算法

纹理图集打包是将多张小图高效地排列到一张大图中的过程。常用的算法有：

1. **MaxRects**：最大矩形算法，空间利用率高
2. **Shelf**：架子算法，实现简单但利用率较低
3. **Guillotine**：切割算法，适合规则尺寸图片

```javascript
// 简化版 MaxRects 打包算法
class MaxRectsPacker {
  constructor(width, height, padding = 1) {
    this.width = width;
    this.height = height;
    this.padding = padding;
    this.freeRects = [{ x: 0, y: 0, width, height }];
    this.usedRects = [];
  }

  // 插入一个矩形
  insert(rectWidth, rectHeight, id) {
    const w = rectWidth + this.padding * 2;
    const h = rectHeight + this.padding * 2;

    // 找到最佳位置
    let bestRect = null;
    let bestScore = Infinity;
    let bestIndex = -1;

    for (let i = 0; i < this.freeRects.length; i++) {
      const freeRect = this.freeRects[i];

      if (w <= freeRect.width && h <= freeRect.height) {
        // 使用 Best Short Side Fit 策略
        const leftoverH = Math.abs(freeRect.width - w);
        const leftoverV = Math.abs(freeRect.height - h);
        const score = Math.min(leftoverH, leftoverV);

        if (score < bestScore) {
          bestScore = score;
          bestRect = {
            x: freeRect.x + this.padding,
            y: freeRect.y + this.padding,
            width: rectWidth,
            height: rectHeight,
            id: id
          };
          bestIndex = i;
        }
      }
    }

    if (bestRect === null) {
      return null; // 无法放置
    }

    // 分割空闲矩形
    this.splitFreeRect(bestIndex, w, h);
    this.usedRects.push(bestRect);

    return bestRect;
  }

  splitFreeRect(index, usedWidth, usedHeight) {
    const freeRect = this.freeRects[index];
    const rightRect = {
      x: freeRect.x + usedWidth,
      y: freeRect.y,
      width: freeRect.width - usedWidth,
      height: usedHeight
    };
    const bottomRect = {
      x: freeRect.x,
      y: freeRect.y + usedHeight,
      width: freeRect.width,
      height: freeRect.height - usedHeight
    };

    // 移除原矩形
    this.freeRects.splice(index, 1);

    // 添加新的空闲矩形
    if (rightRect.width > 0 && rightRect.height > 0) {
      this.freeRects.push(rightRect);
    }
    if (bottomRect.width > 0 && bottomRect.height > 0) {
      this.freeRects.push(bottomRect);
    }

    // 合并重叠的空闲矩形
    this.mergeFreeRects();
  }

  mergeFreeRects() {
    // 简化实现：移除被包含的矩形
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

  // 获取空间利用率
  getOccupancy() {
    let usedArea = 0;
    for (const rect of this.usedRects) {
      usedArea += rect.width * rect.height;
    }
    return usedArea / (this.width * this.height);
  }
}

// 使用示例
function packSprites(sprites, atlasWidth, atlasHeight) {
  const packer = new MaxRectsPacker(atlasWidth, atlasHeight, 2);

  // 按面积从大到小排序
  const sorted = [...sprites].sort((a, b) =>
    (b.width * b.height) - (a.width * a.height)
  );

  const results = [];
  for (const sprite of sorted) {
    const result = packer.insert(sprite.width, sprite.height, sprite.id);
    if (result) {
      results.push(result);
    } else {
      console.warn(`无法放置精灵: ${sprite.id}`);
    }
  }

  console.log(`空间利用率: ${(packer.getOccupancy() * 100).toFixed(1)}%`);
  return results;
}
```

### 运行时图集生成

```javascript
class DynamicTextureAtlas {
  constructor(width = 2048, height = 2048) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    this.packer = new MaxRectsPacker(width, height, 1);
    this.regions = new Map();
  }

  // 添加图像到图集
  addImage(id, image) {
    const result = this.packer.insert(image.width, image.height, id);

    if (!result) {
      throw new Error(`图集空间不足，无法添加: ${id}`);
    }

    // 绘制到图集 canvas
    this.ctx.drawImage(image, result.x, result.y);

    // 保存区域信息
    const region = new TextureRegion(
      this.canvas,
      result.x,
      result.y,
      result.width,
      result.height
    );
    region.id = id;
    this.regions.set(id, region);

    return region;
  }

  // 批量添加图像
  async addImages(imageMap) {
    const entries = Object.entries(imageMap);

    // 按面积排序
    entries.sort((a, b) => {
      const areaA = a[1].width * a[1].height;
      const areaB = b[1].width * b[1].height;
      return areaB - areaA;
    });

    for (const [id, image] of entries) {
      this.addImage(id, image);
    }
  }

  getRegion(id) {
    return this.regions.get(id);
  }

  // 获取图集纹理
  getTexture() {
    return this.canvas;
  }

  // 生成调试视图
  drawDebug(ctx, x, y, scale = 0.5) {
    ctx.drawImage(
      this.canvas,
      x, y,
      this.canvas.width * scale,
      this.canvas.height * scale
    );

    // 绘制区域边框
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1;
    for (const region of this.regions.values()) {
      ctx.strokeRect(
        x + region.x * scale,
        y + region.y * scale,
        region.width * scale,
        region.height * scale
      );
    }
  }
}
```

---

## 精灵动画

### 帧动画基础

帧动画是最基本的精灵动画形式，通过快速切换不同的精灵帧来产生动画效果：

```javascript
class SpriteAnimation {
  constructor(frames, frameRate = 12) {
    this.frames = frames;           // TextureRegion 数组
    this.frameRate = frameRate;     // 每秒帧数
    this.frameDuration = 1 / frameRate;
    this.currentFrame = 0;
    this.elapsedTime = 0;
    this.loop = true;               // 是否循环
    this.playing = true;            // 是否播放中
    this.onComplete = null;         // 播放完成回调
  }

  update(deltaTime) {
    if (!this.playing || this.frames.length === 0) return;

    this.elapsedTime += deltaTime;

    while (this.elapsedTime >= this.frameDuration) {
      this.elapsedTime -= this.frameDuration;
      this.currentFrame++;

      if (this.currentFrame >= this.frames.length) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = this.frames.length - 1;
          this.playing = false;
          if (this.onComplete) {
            this.onComplete();
          }
        }
      }
    }
  }

  getCurrentFrame() {
    return this.frames[this.currentFrame];
  }

  play() {
    this.playing = true;
  }

  pause() {
    this.playing = false;
  }

  stop() {
    this.playing = false;
    this.currentFrame = 0;
    this.elapsedTime = 0;
  }

  reset() {
    this.currentFrame = 0;
    this.elapsedTime = 0;
  }

  // 设置到指定帧
  setFrame(index) {
    this.currentFrame = Math.max(0, Math.min(index, this.frames.length - 1));
    this.elapsedTime = 0;
  }

  // 获取动画总时长
  getDuration() {
    return this.frames.length * this.frameDuration;
  }

  // 获取当前播放进度（0-1）
  getProgress() {
    const totalFrames = this.frames.length;
    return (this.currentFrame + this.elapsedTime / this.frameDuration) / totalFrames;
  }
}

// 动画精灵
class AnimatedSprite extends Sprite {
  constructor(x = 0, y = 0) {
    super(null, x, y);
    this.animations = new Map();
    this.currentAnimation = null;
    this.currentAnimationName = '';
  }

  addAnimation(name, animation) {
    this.animations.set(name, animation);

    // 如果是第一个动画，自动设置为当前动画
    if (!this.currentAnimation) {
      this.playAnimation(name);
    }
  }

  playAnimation(name, restart = false) {
    if (this.currentAnimationName === name && !restart) {
      return;
    }

    const animation = this.animations.get(name);
    if (animation) {
      this.currentAnimation = animation;
      this.currentAnimationName = name;
      animation.reset();
      animation.play();

      // 更新精灵尺寸
      const frame = animation.getCurrentFrame();
      if (frame) {
        this.width = frame.width;
        this.height = frame.height;
      }
    }
  }

  update(deltaTime) {
    if (this.currentAnimation) {
      this.currentAnimation.update(deltaTime);
    }
  }

  render(ctx) {
    if (!this.visible || this.alpha <= 0 || !this.currentAnimation) return;

    const frame = this.currentAnimation.getCurrentFrame();
    if (!frame) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);

    if (this.rotation !== 0) {
      ctx.rotate(this.rotation);
    }

    if (this.scaleX !== 1 || this.scaleY !== 1) {
      ctx.scale(this.scaleX, this.scaleY);
    }

    ctx.drawImage(
      frame.texture,
      frame.x, frame.y,
      frame.width, frame.height,
      -frame.width * this.anchorX,
      -frame.height * this.anchorY,
      frame.width, frame.height
    );

    ctx.restore();
  }
}

// 使用示例
const player = new AnimatedSprite(100, 200);

// 添加动画
player.addAnimation('idle', new SpriteAnimation(idleFrames, 8));
player.addAnimation('walk', new SpriteAnimation(walkFrames, 12));
player.addAnimation('jump', new SpriteAnimation(jumpFrames, 10));

// 设置跳跃动画不循环
player.animations.get('jump').loop = false;
player.animations.get('jump').onComplete = () => {
  player.playAnimation('idle');
};

// 游戏循环
function gameLoop(deltaTime) {
  player.update(deltaTime);
  player.render(ctx);
}
```

### 动画混合与过渡

```javascript
class AnimationBlender {
  constructor() {
    this.currentAnimation = null;
    this.nextAnimation = null;
    this.blendTime = 0;
    this.blendDuration = 0.2;
    this.blending = false;
  }

  play(animation, blendDuration = 0.2) {
    if (this.currentAnimation === animation) return;

    if (this.currentAnimation && blendDuration > 0) {
      this.nextAnimation = animation;
      this.blendTime = 0;
      this.blendDuration = blendDuration;
      this.blending = true;
      animation.reset();
    } else {
      this.currentAnimation = animation;
      this.blending = false;
      animation.reset();
    }
  }

  update(deltaTime) {
    if (this.blending) {
      this.blendTime += deltaTime;

      if (this.blendTime >= this.blendDuration) {
        this.currentAnimation = this.nextAnimation;
        this.nextAnimation = null;
        this.blending = false;
      }
    }

    if (this.currentAnimation) {
      this.currentAnimation.update(deltaTime);
    }
    if (this.nextAnimation) {
      this.nextAnimation.update(deltaTime);
    }
  }

  // 获取混合后的帧（用于支持帧混合的系统）
  getBlendFactor() {
    if (!this.blending) return 1;
    return this.blendTime / this.blendDuration;
  }

  getCurrentFrame() {
    if (this.currentAnimation) {
      return this.currentAnimation.getCurrentFrame();
    }
    return null;
  }
}
```

---

## 动画状态机

### 有限状态机（FSM）

动画状态机是管理复杂角色动画的重要工具：

```javascript
class AnimationState {
  constructor(name, animation) {
    this.name = name;
    this.animation = animation;
    this.transitions = [];
    this.onEnter = null;
    this.onExit = null;
    this.onUpdate = null;
  }

  addTransition(targetState, condition, priority = 0) {
    this.transitions.push({
      target: targetState,
      condition: condition,
      priority: priority
    });
    // 按优先级排序
    this.transitions.sort((a, b) => b.priority - a.priority);
  }

  checkTransitions(context) {
    for (const transition of this.transitions) {
      if (transition.condition(context)) {
        return transition.target;
      }
    }
    return null;
  }
}

class AnimationStateMachine {
  constructor() {
    this.states = new Map();
    this.currentState = null;
    this.context = {};  // 共享上下文数据
    this.blender = new AnimationBlender();
  }

  addState(state) {
    this.states.set(state.name, state);

    // 第一个状态设为默认状态
    if (!this.currentState) {
      this.setState(state.name);
    }
  }

  setState(stateName, immediate = false) {
    const newState = this.states.get(stateName);
    if (!newState || newState === this.currentState) return;

    // 退出当前状态
    if (this.currentState && this.currentState.onExit) {
      this.currentState.onExit(this.context);
    }

    // 进入新状态
    this.currentState = newState;

    if (immediate) {
      this.blender.play(newState.animation, 0);
    } else {
      this.blender.play(newState.animation, 0.15);
    }

    if (newState.onEnter) {
      newState.onEnter(this.context);
    }
  }

  update(deltaTime) {
    if (!this.currentState) return;

    // 检查状态转换
    const nextState = this.currentState.checkTransitions(this.context);
    if (nextState) {
      this.setState(nextState);
    }

    // 更新当前状态
    if (this.currentState.onUpdate) {
      this.currentState.onUpdate(deltaTime, this.context);
    }

    // 更新动画
    this.blender.update(deltaTime);
  }

  getCurrentFrame() {
    return this.blender.getCurrentFrame();
  }

  // 设置上下文数据
  setContext(key, value) {
    this.context[key] = value;
  }

  getContext(key) {
    return this.context[key];
  }
}

// 使用示例：创建角色动画状态机
function createCharacterFSM(spriteSheet) {
  const fsm = new AnimationStateMachine();

  // 创建动画
  const idleAnim = new SpriteAnimation(spriteSheet.getAnimationFrames('idle_'), 8);
  const walkAnim = new SpriteAnimation(spriteSheet.getAnimationFrames('walk_'), 12);
  const runAnim = new SpriteAnimation(spriteSheet.getAnimationFrames('run_'), 15);
  const jumpAnim = new SpriteAnimation(spriteSheet.getAnimationFrames('jump_'), 10);
  const fallAnim = new SpriteAnimation(spriteSheet.getAnimationFrames('fall_'), 8);
  const attackAnim = new SpriteAnimation(spriteSheet.getAnimationFrames('attack_'), 15);

  jumpAnim.loop = false;
  attackAnim.loop = false;

  // 创建状态
  const idleState = new AnimationState('idle', idleAnim);
  const walkState = new AnimationState('walk', walkAnim);
  const runState = new AnimationState('run', runAnim);
  const jumpState = new AnimationState('jump', jumpAnim);
  const fallState = new AnimationState('fall', fallAnim);
  const attackState = new AnimationState('attack', attackAnim);

  // 定义转换条件
  // 从 idle 状态的转换
  idleState.addTransition('walk', ctx => ctx.isMoving && !ctx.isRunning, 1);
  idleState.addTransition('run', ctx => ctx.isMoving && ctx.isRunning, 1);
  idleState.addTransition('jump', ctx => ctx.isJumping, 2);
  idleState.addTransition('attack', ctx => ctx.isAttacking, 3);

  // 从 walk 状态的转换
  walkState.addTransition('idle', ctx => !ctx.isMoving);
  walkState.addTransition('run', ctx => ctx.isRunning);
  walkState.addTransition('jump', ctx => ctx.isJumping, 2);
  walkState.addTransition('attack', ctx => ctx.isAttacking, 3);

  // 从 run 状态的转换
  runState.addTransition('idle', ctx => !ctx.isMoving);
  runState.addTransition('walk', ctx => !ctx.isRunning);
  runState.addTransition('jump', ctx => ctx.isJumping, 2);
  runState.addTransition('attack', ctx => ctx.isAttacking, 3);

  // 从 jump 状态的转换
  jumpState.addTransition('fall', ctx => ctx.isFalling);
  jumpState.addTransition('idle', ctx => ctx.isGrounded && !ctx.isMoving);
  jumpState.addTransition('walk', ctx => ctx.isGrounded && ctx.isMoving);

  // 从 fall 状态的转换
  fallState.addTransition('idle', ctx => ctx.isGrounded && !ctx.isMoving);
  fallState.addTransition('walk', ctx => ctx.isGrounded && ctx.isMoving);

  // 从 attack 状态的转换
  attackState.addTransition('idle', ctx => !ctx.isAttacking && !ctx.isMoving);
  attackState.addTransition('walk', ctx => !ctx.isAttacking && ctx.isMoving);

  // 攻击动画完成时重置攻击状态
  attackAnim.onComplete = () => {
    fsm.setContext('isAttacking', false);
  };

  // 添加状态到状态机
  fsm.addState(idleState);
  fsm.addState(walkState);
  fsm.addState(runState);
  fsm.addState(jumpState);
  fsm.addState(fallState);
  fsm.addState(attackState);

  return fsm;
}

// 在游戏中使用
class Player {
  constructor(spriteSheet) {
    this.x = 100;
    this.y = 300;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isGrounded = true;

    this.fsm = createCharacterFSM(spriteSheet);
  }

  update(deltaTime, input) {
    // 根据输入更新上下文
    this.fsm.setContext('isMoving', input.left || input.right);
    this.fsm.setContext('isRunning', input.shift);
    this.fsm.setContext('isJumping', input.jump && this.isGrounded);
    this.fsm.setContext('isGrounded', this.isGrounded);
    this.fsm.setContext('isFalling', this.velocityY > 0);

    if (input.attack) {
      this.fsm.setContext('isAttacking', true);
    }

    // 更新状态机
    this.fsm.update(deltaTime);

    // 更新物理...
  }

  render(ctx) {
    const frame = this.fsm.getCurrentFrame();
    if (frame) {
      ctx.drawImage(
        frame.texture,
        frame.x, frame.y,
        frame.width, frame.height,
        this.x - frame.width / 2,
        this.y - frame.height,
        frame.width, frame.height
      );
    }
  }
}
```

### 层级状态机

对于更复杂的角色，可以使用层级状态机：

```javascript
class HierarchicalStateMachine {
  constructor() {
    this.layers = new Map();
  }

  addLayer(name, fsm) {
    this.layers.set(name, fsm);
  }

  update(deltaTime) {
    for (const fsm of this.layers.values()) {
      fsm.update(deltaTime);
    }
  }

  // 获取指定层的当前帧
  getLayerFrame(layerName) {
    const layer = this.layers.get(layerName);
    return layer ? layer.getCurrentFrame() : null;
  }

  setLayerContext(layerName, key, value) {
    const layer = this.layers.get(layerName);
    if (layer) {
      layer.setContext(key, value);
    }
  }
}

// 使用示例：身体动画 + 上半身动画分层
const hsm = new HierarchicalStateMachine();
hsm.addLayer('body', createBodyFSM(spriteSheet));
hsm.addLayer('upper', createUpperBodyFSM(spriteSheet));

// 上半身可以独立播放攻击动画，而下半身继续行走
hsm.setLayerContext('body', 'isMoving', true);
hsm.setLayerContext('upper', 'isAttacking', true);
```

---

## 粒子系统基础

### 粒子类

```javascript
class Particle {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.accelerationX = 0;
    this.accelerationY = 0;
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.scale = 1;
    this.scaleSpeed = 0;
    this.alpha = 1;
    this.alphaSpeed = 0;
    this.color = '#ffffff';
    this.life = 1;
    this.maxLife = 1;
    this.alive = false;
    this.texture = null;
  }

  init(config) {
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.velocityX = config.velocityX || 0;
    this.velocityY = config.velocityY || 0;
    this.accelerationX = config.accelerationX || 0;
    this.accelerationY = config.accelerationY || 0;
    this.rotation = config.rotation || 0;
    this.rotationSpeed = config.rotationSpeed || 0;
    this.scale = config.startScale || 1;
    this.scaleSpeed = config.scaleSpeed || 0;
    this.alpha = config.startAlpha || 1;
    this.alphaSpeed = config.alphaSpeed || 0;
    this.color = config.color || '#ffffff';
    this.life = config.life || 1;
    this.maxLife = config.life || 1;
    this.texture = config.texture || null;
    this.alive = true;
  }

  update(deltaTime) {
    if (!this.alive) return;

    // 更新生命值
    this.life -= deltaTime;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }

    // 更新速度
    this.velocityX += this.accelerationX * deltaTime;
    this.velocityY += this.accelerationY * deltaTime;

    // 更新位置
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;

    // 更新旋转
    this.rotation += this.rotationSpeed * deltaTime;

    // 更新缩放
    this.scale += this.scaleSpeed * deltaTime;
    if (this.scale < 0) this.scale = 0;

    // 更新透明度
    this.alpha += this.alphaSpeed * deltaTime;
    this.alpha = Math.max(0, Math.min(1, this.alpha));
  }

  render(ctx) {
    if (!this.alive || this.alpha <= 0 || this.scale <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.scale(this.scale, this.scale);

    if (this.texture) {
      ctx.drawImage(
        this.texture,
        -this.texture.width / 2,
        -this.texture.height / 2
      );
    } else {
      // 默认绘制圆形
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }

    ctx.restore();
  }

  // 获取生命值百分比
  getLifePercent() {
    return this.life / this.maxLife;
  }
}
```

### 粒子发射器

```javascript
class ParticleEmitter {
  constructor(config = {}) {
    // 发射器属性
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.active = true;
    this.duration = config.duration || -1;  // -1 表示无限
    this.elapsed = 0;

    // 发射配置
    this.emissionRate = config.emissionRate || 10;  // 每秒发射数量
    this.emissionAccumulator = 0;
    this.maxParticles = config.maxParticles || 500;
    this.burst = config.burst || 0;  // 一次性发射数量

    // 粒子配置范围
    this.config = {
      // 速度
      speedMin: config.speedMin || 50,
      speedMax: config.speedMax || 100,
      angleMin: config.angleMin || 0,
      angleMax: config.angleMax || Math.PI * 2,

      // 加速度
      accelerationX: config.accelerationX || 0,
      accelerationY: config.accelerationY || 0,  // 重力

      // 生命
      lifeMin: config.lifeMin || 1,
      lifeMax: config.lifeMax || 2,

      // 缩放
      startScaleMin: config.startScaleMin || 1,
      startScaleMax: config.startScaleMax || 1,
      endScaleMin: config.endScaleMin || 0,
      endScaleMax: config.endScaleMax || 0,

      // 透明度
      startAlpha: config.startAlpha || 1,
      endAlpha: config.endAlpha || 0,

      // 旋转
      rotationMin: config.rotationMin || 0,
      rotationMax: config.rotationMax || 0,
      rotationSpeedMin: config.rotationSpeedMin || 0,
      rotationSpeedMax: config.rotationSpeedMax || 0,

      // 颜色
      colors: config.colors || ['#ffffff'],

      // 纹理
      textures: config.textures || [],

      // 发射区域
      emitAreaWidth: config.emitAreaWidth || 0,
      emitAreaHeight: config.emitAreaHeight || 0
    };

    // 粒子池
    this.particles = [];
    this.pool = [];

    // 预创建粒子
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool.push(new Particle());
    }
  }

  // 随机数辅助函数
  random(min, max) {
    return min + Math.random() * (max - min);
  }

  // 从池中获取粒子
  getParticle() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return null;
  }

  // 归还粒子到池
  returnParticle(particle) {
    particle.alive = false;
    this.pool.push(particle);
  }

  // 发射单个粒子
  emit() {
    const particle = this.getParticle();
    if (!particle) return;

    const cfg = this.config;

    // 计算发射位置
    const emitX = this.x + this.random(-cfg.emitAreaWidth/2, cfg.emitAreaWidth/2);
    const emitY = this.y + this.random(-cfg.emitAreaHeight/2, cfg.emitAreaHeight/2);

    // 计算速度
    const speed = this.random(cfg.speedMin, cfg.speedMax);
    const angle = this.random(cfg.angleMin, cfg.angleMax);
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;

    // 计算生命值
    const life = this.random(cfg.lifeMin, cfg.lifeMax);

    // 计算缩放
    const startScale = this.random(cfg.startScaleMin, cfg.startScaleMax);
    const endScale = this.random(cfg.endScaleMin, cfg.endScaleMax);
    const scaleSpeed = (endScale - startScale) / life;

    // 计算透明度
    const alphaSpeed = (cfg.endAlpha - cfg.startAlpha) / life;

    // 选择颜色
    const color = cfg.colors[Math.floor(Math.random() * cfg.colors.length)];

    // 选择纹理
    const texture = cfg.textures.length > 0
      ? cfg.textures[Math.floor(Math.random() * cfg.textures.length)]
      : null;

    particle.init({
      x: emitX,
      y: emitY,
      velocityX: velocityX,
      velocityY: velocityY,
      accelerationX: cfg.accelerationX,
      accelerationY: cfg.accelerationY,
      rotation: this.random(cfg.rotationMin, cfg.rotationMax),
      rotationSpeed: this.random(cfg.rotationSpeedMin, cfg.rotationSpeedMax),
      startScale: startScale,
      scaleSpeed: scaleSpeed,
      startAlpha: cfg.startAlpha,
      alphaSpeed: alphaSpeed,
      color: color,
      life: life,
      texture: texture
    });

    this.particles.push(particle);
  }

  // 一次性发射多个粒子
  burst(count) {
    for (let i = 0; i < count; i++) {
      this.emit();
    }
  }

  update(deltaTime) {
    // 更新持续时间
    if (this.duration > 0) {
      this.elapsed += deltaTime;
      if (this.elapsed >= this.duration) {
        this.active = false;
      }
    }

    // 发射新粒子
    if (this.active && this.emissionRate > 0) {
      this.emissionAccumulator += deltaTime * this.emissionRate;

      while (this.emissionAccumulator >= 1) {
        this.emit();
        this.emissionAccumulator -= 1;
      }
    }

    // 更新现有粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update(deltaTime);

      if (!particle.alive) {
        this.particles.splice(i, 1);
        this.returnParticle(particle);
      }
    }
  }

  render(ctx) {
    for (const particle of this.particles) {
      particle.render(ctx);
    }
  }

  // 停止发射
  stop() {
    this.active = false;
  }

  // 清除所有粒子
  clear() {
    while (this.particles.length > 0) {
      this.returnParticle(this.particles.pop());
    }
  }

  // 获取活跃粒子数量
  getParticleCount() {
    return this.particles.length;
  }
}
```

### 常用粒子效果

```javascript
// 火焰效果
const fireEmitter = new ParticleEmitter({
  x: 200,
  y: 400,
  emissionRate: 50,
  speedMin: 30,
  speedMax: 80,
  angleMin: -Math.PI * 0.6,
  angleMax: -Math.PI * 0.4,
  accelerationY: -20,
  lifeMin: 0.5,
  lifeMax: 1.5,
  startScaleMin: 0.5,
  startScaleMax: 1,
  endScaleMin: 0,
  endScaleMax: 0.2,
  startAlpha: 1,
  endAlpha: 0,
  colors: ['#ff4500', '#ff6600', '#ff8c00', '#ffa500'],
  emitAreaWidth: 20
});

// 爆炸效果
function createExplosion(x, y) {
  const explosion = new ParticleEmitter({
    x: x,
    y: y,
    emissionRate: 0,  // 不持续发射
    speedMin: 100,
    speedMax: 300,
    angleMin: 0,
    angleMax: Math.PI * 2,
    accelerationY: 200,
    lifeMin: 0.3,
    lifeMax: 0.8,
    startScaleMin: 0.5,
    startScaleMax: 1.5,
    endScaleMin: 0,
    endScaleMax: 0,
    startAlpha: 1,
    endAlpha: 0,
    colors: ['#ffff00', '#ff8800', '#ff4400', '#ff0000']
  });

  // 一次性发射 50 个粒子
  explosion.burst(50);

  return explosion;
}

// 雪花效果
const snowEmitter = new ParticleEmitter({
  x: 400,
  y: -10,
  emissionRate: 30,
  emitAreaWidth: 800,
  speedMin: 20,
  speedMax: 60,
  angleMin: Math.PI * 0.4,
  angleMax: Math.PI * 0.6,
  lifeMin: 5,
  lifeMax: 10,
  startScaleMin: 0.3,
  startScaleMax: 0.8,
  endScaleMin: 0.3,
  endScaleMax: 0.8,
  rotationSpeedMin: -1,
  rotationSpeedMax: 1,
  colors: ['#ffffff', '#f0f0ff', '#e0e0ff']
});

// 烟雾效果
const smokeEmitter = new ParticleEmitter({
  x: 300,
  y: 500,
  emissionRate: 15,
  speedMin: 10,
  speedMax: 30,
  angleMin: -Math.PI * 0.7,
  angleMax: -Math.PI * 0.3,
  accelerationX: 10,  // 风力
  lifeMin: 2,
  lifeMax: 4,
  startScaleMin: 0.3,
  startScaleMax: 0.5,
  endScaleMin: 1.5,
  endScaleMax: 2.5,
  startAlpha: 0.6,
  endAlpha: 0,
  colors: ['#666666', '#888888', '#aaaaaa']
});

// 星星/闪光效果
const sparkleEmitter = new ParticleEmitter({
  x: 400,
  y: 300,
  emissionRate: 20,
  emitAreaWidth: 100,
  emitAreaHeight: 100,
  speedMin: 0,
  speedMax: 5,
  lifeMin: 0.3,
  lifeMax: 0.6,
  startScaleMin: 0,
  startScaleMax: 0,
  endScaleMin: 0,
  endScaleMax: 0,
  startAlpha: 0,
  endAlpha: 0,
  colors: ['#ffff00', '#ffffff']
});

// 自定义粒子更新（闪烁效果）
class SparkleParticle extends Particle {
  update(deltaTime) {
    super.update(deltaTime);

    // 闪烁效果
    const lifePercent = this.getLifePercent();
    if (lifePercent > 0.5) {
      // 前半生命：淡入并放大
      const t = (1 - lifePercent) * 2;
      this.alpha = t;
      this.scale = t * 0.5;
    } else {
      // 后半生命：淡出并缩小
      const t = lifePercent * 2;
      this.alpha = t;
      this.scale = t * 0.5;
    }
  }
}
```

---

## 批量渲染优化

### 精灵批处理器

批量渲染是提升 2D 渲染性能的关键技术，它将多个使用相同纹理的绘制调用合并为一次调用：

```javascript
class SpriteBatch {
  constructor(maxSprites = 1000) {
    this.maxSprites = maxSprites;
    this.sprites = [];
    this.currentTexture = null;
    this.drawing = false;
  }

  begin() {
    if (this.drawing) {
      throw new Error('SpriteBatch.end() must be called before begin()');
    }
    this.drawing = true;
    this.sprites = [];
    this.currentTexture = null;
  }

  draw(texture, x, y, width, height, srcX, srcY, srcWidth, srcHeight, options = {}) {
    if (!this.drawing) {
      throw new Error('SpriteBatch.begin() must be called before draw()');
    }

    // 如果纹理改变，先刷新之前的批次
    if (this.currentTexture !== texture) {
      if (this.currentTexture !== null) {
        this.flush();
      }
      this.currentTexture = texture;
    }

    // 如果超过最大数量，先刷新
    if (this.sprites.length >= this.maxSprites) {
      this.flush();
    }

    this.sprites.push({
      x, y, width, height,
      srcX, srcY, srcWidth, srcHeight,
      rotation: options.rotation || 0,
      scaleX: options.scaleX || 1,
      scaleY: options.scaleY || 1,
      anchorX: options.anchorX || 0,
      anchorY: options.anchorY || 0,
      alpha: options.alpha || 1,
      color: options.color || null
    });
  }

  flush() {
    if (this.sprites.length === 0) return;

    // 这里是实际渲染逻辑
    // 在 Canvas 2D 中，我们仍然需要逐个绘制
    // 但在 WebGL 中可以真正实现批量绘制

    this.sprites = [];
  }

  end(ctx) {
    if (!this.drawing) {
      throw new Error('SpriteBatch.begin() must be called before end()');
    }

    // 渲染所有精灵
    for (const sprite of this.sprites) {
      ctx.save();
      ctx.globalAlpha = sprite.alpha;
      ctx.translate(sprite.x, sprite.y);

      if (sprite.rotation !== 0) {
        ctx.rotate(sprite.rotation);
      }

      if (sprite.scaleX !== 1 || sprite.scaleY !== 1) {
        ctx.scale(sprite.scaleX, sprite.scaleY);
      }

      ctx.drawImage(
        this.currentTexture,
        sprite.srcX, sprite.srcY,
        sprite.srcWidth, sprite.srcHeight,
        -sprite.width * sprite.anchorX,
        -sprite.height * sprite.anchorY,
        sprite.width, sprite.height
      );

      ctx.restore();
    }

    this.sprites = [];
    this.currentTexture = null;
    this.drawing = false;
  }
}

// 使用示例
const batch = new SpriteBatch();

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  batch.begin();

  // 绘制所有使用同一纹理的精灵
  for (const sprite of gameSprites) {
    batch.draw(
      spriteSheet.texture,
      sprite.x, sprite.y,
      sprite.width, sprite.height,
      sprite.frame.x, sprite.frame.y,
      sprite.frame.width, sprite.frame.height,
      {
        rotation: sprite.rotation,
        alpha: sprite.alpha
      }
    );
  }

  batch.end(ctx);
}
```

### WebGL 批量渲染

对于更高性能需求，可以使用 WebGL 实现真正的批量渲染：

```javascript
class WebGLSpriteBatch {
  constructor(gl, maxSprites = 10000) {
    this.gl = gl;
    this.maxSprites = maxSprites;
    this.spriteCount = 0;

    // 每个精灵 4 个顶点，每个顶点 4 个属性（x, y, u, v）
    this.vertexData = new Float32Array(maxSprites * 4 * 4);
    // 每个精灵 6 个索引（2 个三角形）
    this.indexData = new Uint16Array(maxSprites * 6);

    this.initShaders();
    this.initBuffers();
    this.generateIndices();
  }

  initShaders() {
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;

      uniform mat4 u_projection;

      varying vec2 v_texCoord;

      void main() {
        gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;

      uniform sampler2D u_texture;

      varying vec2 v_texCoord;

      void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord);
      }
    `;

    // 编译和链接着色器（省略详细代码）
    this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);

    // 获取属性和统一变量位置
    this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.texCoordLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
    this.projectionLocation = this.gl.getUniformLocation(this.program, 'u_projection');
    this.textureLocation = this.gl.getUniformLocation(this.program, 'u_texture');
  }

  initBuffers() {
    const gl = this.gl;

    this.vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.DYNAMIC_DRAW);

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indexData, gl.STATIC_DRAW);
  }

  generateIndices() {
    for (let i = 0; i < this.maxSprites; i++) {
      const offset = i * 6;
      const vertex = i * 4;

      this.indexData[offset + 0] = vertex + 0;
      this.indexData[offset + 1] = vertex + 1;
      this.indexData[offset + 2] = vertex + 2;
      this.indexData[offset + 3] = vertex + 2;
      this.indexData[offset + 4] = vertex + 3;
      this.indexData[offset + 5] = vertex + 0;
    }
  }

  begin() {
    this.spriteCount = 0;
  }

  draw(x, y, width, height, u0, v0, u1, v1) {
    if (this.spriteCount >= this.maxSprites) {
      this.flush();
    }

    const offset = this.spriteCount * 16;  // 4 vertices * 4 floats

    // 左下
    this.vertexData[offset + 0] = x;
    this.vertexData[offset + 1] = y + height;
    this.vertexData[offset + 2] = u0;
    this.vertexData[offset + 3] = v1;

    // 右下
    this.vertexData[offset + 4] = x + width;
    this.vertexData[offset + 5] = y + height;
    this.vertexData[offset + 6] = u1;
    this.vertexData[offset + 7] = v1;

    // 右上
    this.vertexData[offset + 8] = x + width;
    this.vertexData[offset + 9] = y;
    this.vertexData[offset + 10] = u1;
    this.vertexData[offset + 11] = v0;

    // 左上
    this.vertexData[offset + 12] = x;
    this.vertexData[offset + 13] = y;
    this.vertexData[offset + 14] = u0;
    this.vertexData[offset + 15] = v0;

    this.spriteCount++;
  }

  flush() {
    if (this.spriteCount === 0) return;

    const gl = this.gl;

    // 上传顶点数据
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0,
      this.vertexData.subarray(0, this.spriteCount * 16));

    // 绘制
    gl.drawElements(
      gl.TRIANGLES,
      this.spriteCount * 6,
      gl.UNSIGNED_SHORT,
      0
    );

    this.spriteCount = 0;
  }

  end() {
    this.flush();
  }
}
```

### 脏矩形渲染

脏矩形（Dirty Rectangle）技术只重绘发生变化的区域：

```javascript
class DirtyRectRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dirtyRects = [];
    this.previousFrame = null;
  }

  // 标记脏区域
  markDirty(x, y, width, height) {
    this.dirtyRects.push({
      x: Math.floor(x),
      y: Math.floor(y),
      width: Math.ceil(width),
      height: Math.ceil(height)
    });
  }

  // 合并重叠的脏矩形
  mergeDirtyRects() {
    if (this.dirtyRects.length <= 1) return;

    // 简单的合并策略：计算包围盒
    // 更复杂的实现可以使用区域分割算法
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const rect of this.dirtyRects) {
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    }

    this.dirtyRects = [{
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }];
  }

  render(renderCallback) {
    if (this.dirtyRects.length === 0) return;

    this.mergeDirtyRects();

    for (const rect of this.dirtyRects) {
      // 保存状态
      this.ctx.save();

      // 设置裁剪区域
      this.ctx.beginPath();
      this.ctx.rect(rect.x, rect.y, rect.width, rect.height);
      this.ctx.clip();

      // 清除脏区域
      this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

      // 重绘脏区域内的内容
      renderCallback(this.ctx, rect);

      // 恢复状态
      this.ctx.restore();
    }

    // 清空脏矩形列表
    this.dirtyRects = [];
  }
}

// 使用示例
const dirtyRenderer = new DirtyRectRenderer(canvas);

class GameObject {
  constructor(x, y, width, height) {
    this._x = x;
    this._y = y;
    this.width = width;
    this.height = height;
  }

  get x() { return this._x; }
  set x(value) {
    if (this._x !== value) {
      // 标记旧位置为脏
      dirtyRenderer.markDirty(this._x, this._y, this.width, this.height);
      this._x = value;
      // 标记新位置为脏
      dirtyRenderer.markDirty(this._x, this._y, this.width, this.height);
    }
  }

  get y() { return this._y; }
  set y(value) {
    if (this._y !== value) {
      dirtyRenderer.markDirty(this._x, this._y, this.width, this.height);
      this._y = value;
      dirtyRenderer.markDirty(this._x, this._y, this.width, this.height);
    }
  }
}
```

---

## 九宫格切片（9-Slice/9-Patch）

### 什么是九宫格切片？

九宫格切片是一种让图像可以灵活缩放而不失真的技术。它将图像分成 9 个区域：

```
+---+-------+---+
| 1 |   2   | 3 |  <- 顶部（不垂直拉伸）
+---+-------+---+
|   |       |   |
| 4 |   5   | 6 |  <- 中部（可垂直拉伸）
|   |       |   |
+---+-------+---+
| 7 |   8   | 9 |  <- 底部（不垂直拉伸）
+---+-------+---+
  ^     ^     ^
  |     |     |
左侧  中间   右侧
(不水平拉伸)   (不水平拉伸)
```

- 四个角（1、3、7、9）：保持原尺寸，不拉伸
- 顶部和底部边缘（2、8）：只水平拉伸
- 左侧和右侧边缘（4、6）：只垂直拉伸
- 中心区域（5）：水平和垂直都拉伸

### 九宫格实现

```javascript
class NineSlice {
  constructor(texture, left, right, top, bottom) {
    this.texture = texture;
    this.left = left;      // 左边距
    this.right = right;    // 右边距
    this.top = top;        // 上边距
    this.bottom = bottom;  // 下边距

    // 计算源图像的中间区域尺寸
    this.centerWidth = texture.width - left - right;
    this.centerHeight = texture.height - top - bottom;
  }

  draw(ctx, x, y, width, height) {
    const tex = this.texture;
    const l = this.left;
    const r = this.right;
    const t = this.top;
    const b = this.bottom;

    // 目标中间区域尺寸
    const destCenterWidth = width - l - r;
    const destCenterHeight = height - t - b;

    // 绘制 9 个区域

    // 1. 左上角
    ctx.drawImage(tex,
      0, 0, l, t,
      x, y, l, t
    );

    // 2. 上边缘
    ctx.drawImage(tex,
      l, 0, this.centerWidth, t,
      x + l, y, destCenterWidth, t
    );

    // 3. 右上角
    ctx.drawImage(tex,
      tex.width - r, 0, r, t,
      x + width - r, y, r, t
    );

    // 4. 左边缘
    ctx.drawImage(tex,
      0, t, l, this.centerHeight,
      x, y + t, l, destCenterHeight
    );

    // 5. 中心
    ctx.drawImage(tex,
      l, t, this.centerWidth, this.centerHeight,
      x + l, y + t, destCenterWidth, destCenterHeight
    );

    // 6. 右边缘
    ctx.drawImage(tex,
      tex.width - r, t, r, this.centerHeight,
      x + width - r, y + t, r, destCenterHeight
    );

    // 7. 左下角
    ctx.drawImage(tex,
      0, tex.height - b, l, b,
      x, y + height - b, l, b
    );

    // 8. 下边缘
    ctx.drawImage(tex,
      l, tex.height - b, this.centerWidth, b,
      x + l, y + height - b, destCenterWidth, b
    );

    // 9. 右下角
    ctx.drawImage(tex,
      tex.width - r, tex.height - b, r, b,
      x + width - r, y + height - b, r, b
    );
  }
}

// 使用示例
const buttonTexture = await loadImage('button.png');
const buttonSlice = new NineSlice(buttonTexture, 10, 10, 10, 10);

// 绘制不同尺寸的按钮，边框不会变形
buttonSlice.draw(ctx, 50, 50, 100, 40);   // 小按钮
buttonSlice.draw(ctx, 50, 100, 200, 40);  // 中按钮
buttonSlice.draw(ctx, 50, 150, 300, 60);  // 大按钮
```

### 九宫格精灵类

```javascript
class NineSliceSprite {
  constructor(nineSlice, x = 0, y = 0, width = 100, height = 100) {
    this.nineSlice = nineSlice;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.alpha = 1;
    this.visible = true;
  }

  // 设置最小尺寸（不能小于边距之和）
  setSize(width, height) {
    const ns = this.nineSlice;
    this.width = Math.max(width, ns.left + ns.right);
    this.height = Math.max(height, ns.top + ns.bottom);
  }

  render(ctx) {
    if (!this.visible || this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    this.nineSlice.draw(ctx, this.x, this.y, this.width, this.height);
    ctx.restore();
  }
}

// 创建 UI 面板
class Panel extends NineSliceSprite {
  constructor(nineSlice, x, y, width, height) {
    super(nineSlice, x, y, width, height);
    this.padding = 10;
    this.children = [];
  }

  addChild(child) {
    this.children.push(child);
  }

  render(ctx) {
    super.render(ctx);

    // 渲染子元素
    ctx.save();
    ctx.translate(this.x + this.padding, this.y + this.padding);

    for (const child of this.children) {
      child.render(ctx);
    }

    ctx.restore();
  }
}

// 创建按钮
class Button extends NineSliceSprite {
  constructor(nineSlice, x, y, text) {
    super(nineSlice, x, y, 120, 40);
    this.text = text;
    this.textColor = '#ffffff';
    this.fontSize = 16;
    this.hovered = false;
    this.pressed = false;

    // 不同状态的透明度
    this.normalAlpha = 1;
    this.hoverAlpha = 0.8;
    this.pressedAlpha = 0.6;
  }

  update(mouseX, mouseY, mouseDown) {
    // 检测鼠标悬停
    this.hovered = mouseX >= this.x &&
                   mouseX <= this.x + this.width &&
                   mouseY >= this.y &&
                   mouseY <= this.y + this.height;

    this.pressed = this.hovered && mouseDown;

    // 更新透明度
    if (this.pressed) {
      this.alpha = this.pressedAlpha;
    } else if (this.hovered) {
      this.alpha = this.hoverAlpha;
    } else {
      this.alpha = this.normalAlpha;
    }
  }

  render(ctx) {
    super.render(ctx);

    // 绘制文本
    ctx.save();
    ctx.fillStyle = this.textColor;
    ctx.font = `${this.fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      this.text,
      this.x + this.width / 2,
      this.y + this.height / 2
    );
    ctx.restore();
  }
}
```

---

## 实战案例：完整的精灵系统

```javascript
// 完整的精灵系统示例
class SpriteSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sprites = [];
    this.particleEmitters = [];
    this.lastTime = 0;
    this.running = false;
  }

  // 加载精灵表
  async loadSpriteSheet(imagePath, jsonPath) {
    const [texture, json] = await Promise.all([
      this.loadImage(imagePath),
      fetch(jsonPath).then(r => r.json())
    ]);
    return new JSONSpriteSheet(texture, json);
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // 添加精灵
  addSprite(sprite) {
    this.sprites.push(sprite);
    this.sortSprites();
  }

  removeSprite(sprite) {
    const index = this.sprites.indexOf(sprite);
    if (index !== -1) {
      this.sprites.splice(index, 1);
    }
  }

  sortSprites() {
    this.sprites.sort((a, b) => a.zIndex - b.zIndex);
  }

  // 添加粒子发射器
  addParticleEmitter(emitter) {
    this.particleEmitters.push(emitter);
  }

  removeParticleEmitter(emitter) {
    const index = this.particleEmitters.indexOf(emitter);
    if (index !== -1) {
      this.particleEmitters.splice(index, 1);
    }
  }

  // 主循环
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
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(() => this.loop());
  }

  update(deltaTime) {
    // 更新精灵
    for (const sprite of this.sprites) {
      if (sprite.update) {
        sprite.update(deltaTime);
      }
    }

    // 更新粒子发射器
    for (let i = this.particleEmitters.length - 1; i >= 0; i--) {
      const emitter = this.particleEmitters[i];
      emitter.update(deltaTime);

      // 移除已完成的非循环发射器
      if (!emitter.active && emitter.getParticleCount() === 0) {
        this.particleEmitters.splice(i, 1);
      }
    }
  }

  render() {
    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 渲染精灵
    for (const sprite of this.sprites) {
      sprite.render(this.ctx);
    }

    // 渲染粒子（通常在最上层）
    for (const emitter of this.particleEmitters) {
      emitter.render(this.ctx);
    }
  }
}

// 使用示例
async function main() {
  const canvas = document.getElementById('game');
  canvas.width = 800;
  canvas.height = 600;

  const system = new SpriteSystem(canvas);

  // 加载资源
  const characterSheet = await system.loadSpriteSheet(
    'character.png',
    'character.json'
  );

  // 创建角色
  const player = new AnimatedSprite(400, 300);
  player.addAnimation('idle', new SpriteAnimation(
    characterSheet.getAnimationFrames('player_idle_'),
    8
  ));
  player.addAnimation('walk', new SpriteAnimation(
    characterSheet.getAnimationFrames('player_walk_'),
    12
  ));

  system.addSprite(player);

  // 创建粒子效果
  const dustEmitter = new ParticleEmitter({
    x: 400,
    y: 350,
    emissionRate: 5,
    speedMin: 10,
    speedMax: 30,
    angleMin: -Math.PI,
    angleMax: 0,
    lifeMin: 0.5,
    lifeMax: 1,
    startAlpha: 0.5,
    endAlpha: 0,
    colors: ['#8B4513', '#A0522D', '#D2691E']
  });

  system.addParticleEmitter(dustEmitter);

  // 键盘控制
  const keys = {};
  document.addEventListener('keydown', e => keys[e.key] = true);
  document.addEventListener('keyup', e => keys[e.key] = false);

  // 扩展更新逻辑
  const originalUpdate = system.update.bind(system);
  system.update = (deltaTime) => {
    // 处理输入
    if (keys['ArrowLeft'] || keys['ArrowRight']) {
      player.playAnimation('walk');
      dustEmitter.active = true;

      if (keys['ArrowLeft']) {
        player.x -= 200 * deltaTime;
        player.scaleX = -1;
        dustEmitter.x = player.x + 20;
      }
      if (keys['ArrowRight']) {
        player.x += 200 * deltaTime;
        player.scaleX = 1;
        dustEmitter.x = player.x - 20;
      }
      dustEmitter.y = player.y + 30;
    } else {
      player.playAnimation('idle');
      dustEmitter.active = false;
    }

    originalUpdate(deltaTime);
  };

  // 开始游戏循环
  system.start();
}

main().catch(console.error);
```

---

## 面试要点

### 常见面试题

**Q1: 什么是精灵表？为什么要使用精灵表？**

```
精灵表（Sprite Sheet）是将多个小图像合并到一张大纹理中的技术。

使用精灵表的好处：
1. 减少 HTTP 请求数量（只需加载一张图片）
2. 减少 GPU 纹理切换开销（相同纹理可批量渲染）
3. 提高内存利用效率（减少纹理边界的内存浪费）
4. 便于使用 GPU 纹理压缩格式
5. 便于资源管理和版本控制
```

**Q2: 如何实现精灵动画？**

```
精灵动画的基本原理是快速切换显示不同的精灵帧：

1. 准备动画帧序列（通常来自精灵表）
2. 设置帧率（每秒切换多少帧）
3. 在更新循环中累计时间
4. 当累计时间超过帧间隔时切换到下一帧
5. 处理循环、暂停、完成回调等逻辑

关键代码：
- elapsedTime += deltaTime
- 当 elapsedTime >= frameDuration 时 currentFrame++
- 使用 currentFrame 索引获取当前帧纹理区域
```

**Q3: 什么是动画状态机？为什么需要它？**

```
动画状态机（Animation State Machine）是管理角色动画转换的系统。

需要它的原因：
1. 角色通常有多种动画（站立、行走、跳跃、攻击等）
2. 动画之间的转换有规则（跳跃中不能行走）
3. 需要平滑的动画过渡效果
4. 便于扩展和维护动画逻辑

核心组件：
- 状态（State）：包含动画和转换规则
- 转换（Transition）：定义何时切换状态
- 上下文（Context）：共享的游戏数据
```

**Q4: 如何优化大量精灵的渲染性能？**

```
1. 批量渲染（Batching）
   - 合并使用相同纹理的绘制调用
   - 减少 GPU 状态切换

2. 纹理图集（Texture Atlas）
   - 将所有精灵合并到一张大纹理
   - 只需一次纹理绑定

3. 对象池（Object Pool）
   - 复用精灵对象避免频繁创建销毁
   - 减少 GC 压力

4. 视锥剔除（Frustum Culling）
   - 不渲染屏幕外的精灵

5. 脏矩形渲染（Dirty Rectangle）
   - 只重绘发生变化的区域

6. 层级渲染
   - 静态背景单独一层，减少重绘
```

**Q5: 九宫格切片的原理和应用场景？**

```
原理：
将图像分为 9 个区域（3x3 网格）
- 四角保持原尺寸不拉伸
- 顶部底部边缘只水平拉伸
- 左右边缘只垂直拉伸
- 中心区域双向拉伸

应用场景：
1. UI 面板和窗口
2. 按钮和输入框
3. 对话气泡
4. 进度条容器
5. 任何需要保持边框完整性的可缩放元素
```

### 高频考点总结

```
1. 精灵基础概念：纹理、位置、旋转、缩放、锚点、层级
2. 精灵表与纹理区域的关系
3. 帧动画的实现原理
4. 动画状态机的设计模式
5. 粒子系统的基本组成：发射器、粒子、对象池
6. 批量渲染的优化原理
7. 九宫格切片的分割方式和绘制方法
8. Canvas 2D vs WebGL 的精灵渲染差异
9. 脏矩形渲染的优化策略
10. 游戏循环与帧率控制
```

---

## 学习资源

### 开源游戏引擎参考

- **Phaser** - 流行的 HTML5 游戏框架，精灵系统设计优秀
- **PixiJS** - 高性能 2D 渲染引擎，专注于精灵渲染
- **Cocos2d-x** - 成熟的跨平台游戏引擎
- **Godot** - 开源游戏引擎，文档详细

### 推荐书籍

- 《游戏引擎架构》
- 《HTML5 Canvas 游戏开发实战》
- 《Game Programming Patterns》

### 在线工具

- **TexturePacker** - 精灵表打包工具
- **Aseprite** - 像素动画制作工具
- **Tiled** - 瓦片地图编辑器
- **ShoeBox** - 免费精灵表工具

### 学习建议

1. **从简单开始**：先实现基本的精灵渲染，再逐步添加动画和状态机
2. **理解底层原理**：了解 Canvas 2D 和 WebGL 的绘制机制
3. **关注性能**：从一开始就养成性能优化的习惯
4. **参考成熟引擎**：学习 Phaser、PixiJS 等框架的设计思路
5. **实践项目**：通过制作小游戏来巩固知识

---

## 总结

精灵系统是 2D 游戏开发的核心技术，掌握它对于游戏开发至关重要。本文涵盖了精灵系统的主要知识点：

1. **精灵基础**：理解精灵的核心属性和基本操作
2. **精灵表**：学会使用精灵表优化资源加载和渲染
3. **精灵动画**：实现流畅的帧动画效果
4. **动画状态机**：管理复杂的角色动画逻辑
5. **粒子系统**：创建丰富的视觉效果
6. **性能优化**：批量渲染、对象池、脏矩形等技术
7. **九宫格切片**：制作可缩放的 UI 元素

通过系统学习这些知识，你将能够构建高效、灵活的 2D 游戏精灵系统。记住，实践是最好的老师，建议在学习过程中多动手实现，通过实际项目来加深理解。
