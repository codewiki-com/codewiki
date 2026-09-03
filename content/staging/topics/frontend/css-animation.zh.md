---
title: CSS 动画完全指南
description: 掌握CSS过渡和动画，创建流畅的用户界面交互效果
track: frontend
section: html-css
difficulty: intermediate
tags:
  - CSS
  - 动画
  - 过渡
  - 交互
status: imported
origin: old/src/content/docs/frontend/css-animation.zh.md
divergence: 0.208
issues: []
legacy:
  category: Frontend
  subcategory: CSS
  order: 4
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 CSS 动画？

CSS 动画是一种无需 JavaScript 即可在网页上创建动态效果的技术。它主要包含两个核心概念：

- **CSS Transition（过渡）**：在两个状态之间创建平滑的过渡效果
- **CSS Animation（动画）**：通过关键帧定义更复杂的多阶段动画

与 JavaScript 动画相比，CSS 动画具有以下优势：

1. **性能更好**：浏览器可以对 CSS 动画进行优化，使用 GPU 加速
2. **代码更简洁**：声明式语法，易于维护
3. **不阻塞主线程**：动画在合成线程运行，不影响页面交互

### 为什么需要 CSS 动画？

动画在用户界面中扮演着重要角色：

- **提供视觉反馈**：让用户知道他们的操作已被识别
- **引导用户注意**：突出显示重要信息或变化
- **增强用户体验**：使界面感觉更加流畅和自然
- **建立空间关系**：帮助用户理解元素之间的层级关系

## CSS Transition 详解

### 基本语法

Transition 是最简单的 CSS 动画形式，它定义了属性从一个值变化到另一个值的过渡效果。

```css
.element {
  /* 简写语法 */
  transition: property duration timing-function delay;

  /* 分开写 */
  transition-property: transform;
  transition-duration: 0.3s;
  transition-timing-function: ease;
  transition-delay: 0s;
}
```

### transition-property

指定哪些 CSS 属性应该应用过渡效果。

```css
.box {
  /* 指定单个属性 */
  transition-property: opacity;

  /* 指定多个属性 */
  transition-property: opacity, transform, background-color;

  /* 所有可过渡属性（谨慎使用，可能影响性能） */
  transition-property: all;

  /* 禁用过渡 */
  transition-property: none;
}
```

**可过渡的属性类型：**

| 类型 | 示例 |
|------|------|
| 颜色 | color, background-color, border-color |
| 长度 | width, height, padding, margin, font-size |
| 变换 | transform |
| 透明度 | opacity |
| 阴影 | box-shadow, text-shadow |

**不可过渡的属性：**
- display
- font-family
- position
- visibility（可以但效果不理想）

### transition-duration

定义过渡效果持续的时间，单位可以是秒（s）或毫秒（ms）。

```css
.button {
  /* 推荐的交互反馈时长 */
  transition-duration: 0.2s;  /* 200毫秒，快速反馈 */
}

.modal {
  /* 页面级别的过渡 */
  transition-duration: 0.4s;  /* 400毫秒，更明显的过渡 */
}

.menu {
  /* 多个属性不同时长 */
  transition-property: transform, opacity;
  transition-duration: 0.3s, 0.2s;
}
```

**时长建议：**
- **微交互**（按钮悬停）：100-200ms
- **组件动画**（下拉菜单）：200-300ms
- **页面过渡**：300-500ms
- **复杂动画**：500ms+

### transition-timing-function

定义过渡效果的速度曲线（缓动函数）。

```css
.element {
  /* 预设值 */
  transition-timing-function: ease;        /* 默认，慢-快-慢 */
  transition-timing-function: ease-in;     /* 慢速开始 */
  transition-timing-function: ease-out;    /* 慢速结束 */
  transition-timing-function: ease-in-out; /* 两端慢，中间快 */
  transition-timing-function: linear;      /* 匀速 */

  /* 阶跃函数 */
  transition-timing-function: steps(4);    /* 分4步完成 */
  transition-timing-function: steps(4, start);
  transition-timing-function: steps(4, end);

  /* 自定义贝塞尔曲线 */
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### transition-delay

定义过渡效果开始前的延迟时间。

```css
.nav-item {
  transition: transform 0.3s ease;
}

/* 创建错开的动画效果 */
.nav-item:nth-child(1) { transition-delay: 0s; }
.nav-item:nth-child(2) { transition-delay: 0.1s; }
.nav-item:nth-child(3) { transition-delay: 0.2s; }
.nav-item:nth-child(4) { transition-delay: 0.3s; }
```

### 完整的 Transition 示例

```css
/* 按钮悬停效果 */
.button {
  background-color: #3b82f6;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  transform: translateY(0);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  /* 多属性过渡 */
  transition:
    transform 0.2s ease-out,
    box-shadow 0.2s ease-out,
    background-color 0.2s ease;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
  background-color: #2563eb;
}

.button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

## CSS Animation 与 @keyframes

### 基本语法

Animation 比 Transition 更强大，可以定义多个关键帧，创建复杂的动画序列。

```css
/* 定义关键帧 */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 使用动画 */
.element {
  animation: slideIn 0.5s ease-out forwards;
}
```

### @keyframes 详解

关键帧定义了动画在不同时间点的状态。

```css
/* 使用百分比定义多个关键帧 */
@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-20px);
  }
  50% {
    transform: translateY(0);
  }
  75% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0);
  }
}

/* 同一关键帧位置的合并写法 */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}
```

### Animation 属性详解

```css
.element {
  /* 简写 */
  animation: name duration timing-function delay iteration-count direction fill-mode play-state;

  /* 分开写 */
  animation-name: slideIn;           /* 关键帧名称 */
  animation-duration: 0.5s;          /* 持续时间 */
  animation-timing-function: ease;   /* 缓动函数 */
  animation-delay: 0s;               /* 延迟时间 */
  animation-iteration-count: 1;      /* 播放次数 */
  animation-direction: normal;       /* 播放方向 */
  animation-fill-mode: none;         /* 填充模式 */
  animation-play-state: running;     /* 播放状态 */
}
```

#### animation-iteration-count

```css
.element {
  animation-iteration-count: 1;        /* 播放一次 */
  animation-iteration-count: 3;        /* 播放三次 */
  animation-iteration-count: infinite; /* 无限循环 */
  animation-iteration-count: 2.5;      /* 播放2.5次 */
}
```

#### animation-direction

```css
.element {
  animation-direction: normal;            /* 正向播放 */
  animation-direction: reverse;           /* 反向播放 */
  animation-direction: alternate;         /* 交替播放（奇数次正向，偶数次反向） */
  animation-direction: alternate-reverse; /* 交替反向播放 */
}
```

#### animation-fill-mode

控制动画执行前后元素的样式。

```css
.element {
  animation-fill-mode: none;      /* 默认，动画前后不改变样式 */
  animation-fill-mode: forwards;  /* 动画结束后保持最后一帧的样式 */
  animation-fill-mode: backwards; /* 动画开始前应用第一帧的样式 */
  animation-fill-mode: both;      /* 同时应用 forwards 和 backwards */
}
```

```css
/* 示例：淡入效果 */
.fade-in {
  opacity: 0; /* 初始状态 */
  animation: fadeIn 0.5s ease forwards; /* forwards 保持最终的 opacity: 1 */
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}
```

#### animation-play-state

```css
.element {
  animation-play-state: running; /* 正在播放 */
  animation-play-state: paused;  /* 暂停 */
}

/* 悬停时暂停动画 */
.animated:hover {
  animation-play-state: paused;
}
```

### 多动画组合

```css
.element {
  /* 同时应用多个动画 */
  animation:
    fadeIn 0.5s ease forwards,
    slideUp 0.5s ease forwards,
    pulse 2s ease-in-out 0.5s infinite;
}
```

## 动画性能优化

### 浏览器渲染流程

理解浏览器渲染流程对于优化动画性能至关重要：

```
JavaScript → Style → Layout → Paint → Composite
    ↓          ↓        ↓        ↓         ↓
  执行JS    计算样式   计算布局   绘制像素   合成图层
```

不同的 CSS 属性修改会触发不同的渲染阶段：

| 触发阶段 | CSS 属性 | 性能影响 |
|----------|----------|----------|
| Layout | width, height, padding, margin, top, left | 最慢 |
| Paint | background, color, border, box-shadow | 较慢 |
| Composite | transform, opacity | 最快 |

### 高性能属性

**只使用 transform 和 opacity 进行动画：**

```css
/* 不推荐：触发 Layout */
.bad {
  transition: left 0.3s, top 0.3s;
}
.bad:hover {
  left: 100px;
  top: 50px;
}

/* 推荐：只触发 Composite */
.good {
  transition: transform 0.3s;
}
.good:hover {
  transform: translate(100px, 50px);
}
```

```css
/* 不推荐：修改 width/height */
.scale-bad {
  transition: width 0.3s, height 0.3s;
}
.scale-bad:hover {
  width: 200px;
  height: 200px;
}

/* 推荐：使用 transform: scale() */
.scale-good {
  transition: transform 0.3s;
}
.scale-good:hover {
  transform: scale(1.5);
}
```

### will-change 属性

`will-change` 提前告知浏览器元素将要发生的变化，让浏览器提前做好优化准备。

```css
/* 正确使用 */
.element {
  will-change: transform;
}

/* 悬停前准备，悬停后清除 */
.container:hover .element {
  will-change: transform;
}
.container .element {
  transition: transform 0.3s;
}

/* 动画结束后使用 JavaScript 移除 */
```

**will-change 使用注意事项：**

```css
/* 错误：过度使用 */
* {
  will-change: transform, opacity; /* 会消耗大量内存 */
}

/* 错误：永久设置在静态元素上 */
.static-element {
  will-change: transform; /* 浪费资源 */
}

/* 正确：只在需要时使用 */
.will-animate {
  will-change: transform;
}

.will-animate.done {
  will-change: auto; /* 动画结束后重置 */
}
```

### 减少重绘和回流

```css
/* 使用 transform 代替位置属性 */
.move {
  /* 避免 */
  /* position: absolute; top: 0; left: 0; */

  /* 推荐 */
  transform: translate(0, 0);
}

/* 使用 opacity 代替 visibility/display */
.fade {
  /* 避免 */
  /* visibility: hidden; */

  /* 推荐 */
  opacity: 0;
  pointer-events: none; /* 确保不可点击 */
}
```

### 启用 GPU 加速

```css
/* 强制创建新的合成层 */
.gpu-accelerated {
  transform: translateZ(0);
  /* 或 */
  transform: translate3d(0, 0, 0);
  /* 或 */
  will-change: transform;
}
```

## 常用缓动函数

### 预设缓动函数

```css
/* 线性 - 匀速运动 */
.linear {
  transition-timing-function: linear;
  /* cubic-bezier(0, 0, 1, 1) */
}

/* ease - 默认值，慢快慢 */
.ease {
  transition-timing-function: ease;
  /* cubic-bezier(0.25, 0.1, 0.25, 1) */
}

/* ease-in - 慢速开始 */
.ease-in {
  transition-timing-function: ease-in;
  /* cubic-bezier(0.42, 0, 1, 1) */
}

/* ease-out - 慢速结束（推荐用于进入动画） */
.ease-out {
  transition-timing-function: ease-out;
  /* cubic-bezier(0, 0, 0.58, 1) */
}

/* ease-in-out - 两端慢 */
.ease-in-out {
  transition-timing-function: ease-in-out;
  /* cubic-bezier(0.42, 0, 0.58, 1) */
}
```

### cubic-bezier 自定义曲线

贝塞尔曲线由四个点定义：P0(0,0)、P1(x1,y1)、P2(x2,y2)、P3(1,1)。

```css
/* 自定义缓动函数 */
.custom {
  /* cubic-bezier(x1, y1, x2, y2) */
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

**常用的自定义缓动：**

```css
/* 弹性效果 - 超出后回弹 */
.bounce-out {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 快速启动，缓慢结束 */
.smooth-out {
  transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* Material Design 标准缓动 */
.material-standard {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Material Design 减速 */
.material-decelerate {
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}

/* Material Design 加速 */
.material-accelerate {
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
}
```

### steps() 阶跃函数

```css
/* 打字机效果 */
.typewriter {
  width: 0;
  overflow: hidden;
  white-space: nowrap;
  animation: typing 3s steps(20) forwards;
}

@keyframes typing {
  to {
    width: 100%;
  }
}

/* 精灵图动画 */
.sprite {
  width: 64px;
  height: 64px;
  background: url('sprite.png') 0 0;
  animation: walk 0.8s steps(8) infinite;
}

@keyframes walk {
  to {
    background-position: -512px 0; /* 8帧 x 64px */
  }
}
```

## 动画组合与序列

### 使用 animation-delay 创建序列

```css
/* 错开的列表项动画 */
.list-item {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.5s ease forwards;
}

.list-item:nth-child(1) { animation-delay: 0.1s; }
.list-item:nth-child(2) { animation-delay: 0.2s; }
.list-item:nth-child(3) { animation-delay: 0.3s; }
.list-item:nth-child(4) { animation-delay: 0.4s; }
.list-item:nth-child(5) { animation-delay: 0.5s; }

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 使用 CSS 变量动态控制

```css
.list-item {
  --delay: 0;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.5s ease forwards;
  animation-delay: calc(var(--delay) * 0.1s);
}

/* 在 HTML 中设置 */
/* <div class="list-item" style="--delay: 1">Item 1</div> */
/* <div class="list-item" style="--delay: 2">Item 2</div> */
```

### 组合多个动画

```css
/* 复杂的入场动画 */
.card {
  animation:
    fadeIn 0.3s ease forwards,
    slideUp 0.4s ease forwards,
    scaleIn 0.3s ease 0.1s forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(30px); }
  to { transform: translateY(0); }
}

@keyframes scaleIn {
  from { transform: scale(0.95); }
  to { transform: scale(1); }
}
```

### 使用动画事件（JavaScript 配合）

```javascript
const element = document.querySelector('.animated');

// 动画开始
element.addEventListener('animationstart', (e) => {
  console.log('动画开始:', e.animationName);
});

// 动画迭代（每次循环）
element.addEventListener('animationiteration', (e) => {
  console.log('动画迭代:', e.animationName);
});

// 动画结束
element.addEventListener('animationend', (e) => {
  console.log('动画结束:', e.animationName);
  // 可以在这里触发下一个动画
  element.classList.add('next-animation');
});
```

## 实战案例

### 加载动画（Loading Spinner）

```css
/* 旋转加载器 */
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 脉冲加载器 */
.pulse-loader {
  width: 20px;
  height: 20px;
  background-color: #3b82f6;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
}

/* 三点加载器 */
.dots-loader {
  display: flex;
  gap: 8px;
}

.dots-loader span {
  width: 12px;
  height: 12px;
  background-color: #3b82f6;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.dots-loader span:nth-child(1) { animation-delay: 0s; }
.dots-loader span:nth-child(2) { animation-delay: 0.2s; }
.dots-loader span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

/* 骨架屏加载效果 */
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

### 悬停效果（Hover Effects）

```css
/* 按钮悬停 - 渐变背景 */
.btn-gradient {
  position: relative;
  padding: 12px 24px;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.btn-gradient::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
}

.btn-gradient:hover::before {
  opacity: 1;
}

/* 卡片悬停 - 浮起效果 */
.card-hover {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease;
}

.card-hover:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

/* 图片悬停 - 缩放 + 遮罩 */
.image-hover {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.image-hover img {
  width: 100%;
  transition: transform 0.5s ease;
}

.image-hover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.7) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-hover:hover img {
  transform: scale(1.1);
}

.image-hover:hover::after {
  opacity: 1;
}

/* 链接下划线动画 */
.link-underline {
  position: relative;
  color: #3b82f6;
  text-decoration: none;
}

.link-underline::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: currentColor;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.3s ease;
}

.link-underline:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}
```

### 页面过渡效果

```css
/* 淡入淡出 */
.page-fade-enter {
  opacity: 0;
}

.page-fade-enter-active {
  opacity: 1;
  transition: opacity 0.3s ease;
}

.page-fade-exit {
  opacity: 1;
}

.page-fade-exit-active {
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* 滑动过渡 */
.page-slide-enter {
  transform: translateX(100%);
}

.page-slide-enter-active {
  transform: translateX(0);
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.page-slide-exit {
  transform: translateX(0);
}

.page-slide-exit-active {
  transform: translateX(-100%);
  transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 模态框动画 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  pointer-events: none;
}

.modal-overlay.active {
  background-color: rgba(0, 0, 0, 0.5);
  pointer-events: auto;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  transform: scale(0.9) translateY(20px);
  opacity: 0;
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.3s ease;
}

.modal-overlay.active .modal-content {
  transform: scale(1) translateY(0);
  opacity: 1;
}

/* 汉堡菜单动画 */
.hamburger {
  width: 30px;
  height: 20px;
  position: relative;
  cursor: pointer;
}

.hamburger span {
  position: absolute;
  width: 100%;
  height: 2px;
  background-color: #333;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.hamburger span:nth-child(1) { top: 0; }
.hamburger span:nth-child(2) { top: 50%; transform: translateY(-50%); }
.hamburger span:nth-child(3) { bottom: 0; }

.hamburger.active span:nth-child(1) {
  transform: translateY(9px) rotate(45deg);
}

.hamburger.active span:nth-child(2) {
  opacity: 0;
}

.hamburger.active span:nth-child(3) {
  transform: translateY(-9px) rotate(-45deg);
}
```

### 高级动画效果

```css
/* 打字机效果 */
.typewriter {
  overflow: hidden;
  white-space: nowrap;
  border-right: 2px solid #333;
  width: 0;
  animation:
    typing 3s steps(30) forwards,
    blink 0.75s step-end infinite;
}

@keyframes typing {
  to { width: 100%; }
}

@keyframes blink {
  50% { border-color: transparent; }
}

/* 波浪效果 */
.wave-text span {
  display: inline-block;
  animation: wave 1s ease-in-out infinite;
}

.wave-text span:nth-child(1) { animation-delay: 0s; }
.wave-text span:nth-child(2) { animation-delay: 0.1s; }
.wave-text span:nth-child(3) { animation-delay: 0.2s; }
.wave-text span:nth-child(4) { animation-delay: 0.3s; }
.wave-text span:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 闪烁高亮效果 */
.highlight {
  animation: highlight 2s ease-in-out;
}

@keyframes highlight {
  0%, 100% {
    background-color: transparent;
  }
  25%, 75% {
    background-color: rgba(255, 255, 0, 0.3);
  }
}
```

## CSS 动画 vs JavaScript 动画

### 何时使用 CSS 动画

| 场景 | 推荐 |
|------|------|
| 简单的状态过渡（悬停、焦点） | CSS Transition |
| 循环动画（加载指示器） | CSS Animation |
| 声明式动画（预定义的效果） | CSS |
| 需要最佳性能的动画 | CSS（使用 transform/opacity） |

### 何时使用 JavaScript 动画

| 场景 | 推荐 |
|------|------|
| 需要精确控制（暂停、反转、跳转） | JavaScript |
| 基于用户输入的动画（拖拽、滚动） | JavaScript |
| 复杂的序列动画 | JavaScript |
| 需要物理效果（弹簧、惯性） | JavaScript |
| 动态计算的动画值 | JavaScript |

### 性能对比

```javascript
// JavaScript 动画（使用 requestAnimationFrame）
function animateWithJS(element) {
  let start = null;
  const duration = 1000;

  function step(timestamp) {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);

    element.style.transform = `translateX(${progress * 200}px)`;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

// CSS 动画（更简洁，性能通常更好）
// .animate { transition: transform 1s ease; }
// .animate.active { transform: translateX(200px); }
```

### Web Animations API

现代浏览器提供了 Web Animations API，结合了两者的优点：

```javascript
// 使用 Web Animations API
const element = document.querySelector('.box');

const animation = element.animate([
  { transform: 'translateX(0)', opacity: 1 },
  { transform: 'translateX(200px)', opacity: 0.5 }
], {
  duration: 1000,
  easing: 'ease-out',
  fill: 'forwards'
});

// 精确控制
animation.pause();
animation.play();
animation.reverse();
animation.currentTime = 500; // 跳转到 500ms
animation.playbackRate = 2;  // 2倍速播放

// 事件监听
animation.onfinish = () => console.log('动画完成');
```

## 面试要点

### 常见面试题

**1. transition 和 animation 的区别是什么？**

```
transition:
- 需要触发条件（hover、class 变化等）
- 只能定义起始和结束两个状态
- 不能自动重复播放
- 语法更简单

animation:
- 可以自动播放，不需要触发
- 可以定义多个关键帧（@keyframes）
- 可以无限循环播放
- 控制更精细（方向、暂停等）
```

**2. 如何优化 CSS 动画性能？**

```
1. 只对 transform 和 opacity 做动画（只触发合成）
2. 使用 will-change 提示浏览器（谨慎使用）
3. 避免同时动画大量元素
4. 使用 GPU 加速：transform: translateZ(0)
5. 减少动画元素的复杂度（层级、阴影等）
6. 使用 requestAnimationFrame 替代 setTimeout/setInterval
```

**3. 什么是重排（reflow）和重绘（repaint）？**

```
重排（Reflow/Layout）：
- 元素的几何属性变化导致的重新计算布局
- 触发属性：width、height、padding、margin、position 等
- 性能影响最大

重绘（Repaint）：
- 元素外观变化但不影响布局
- 触发属性：color、background、border-color、visibility 等
- 性能影响较小

最优：只触发合成（Composite）
- 只有 transform 和 opacity 不触发重排重绘
```

**4. CSS 动画卡顿的原因和解决方案？**

```
原因：
1. 使用了会触发重排的属性（width、height、top、left）
2. 动画元素过多
3. 动画计算在主线程进行
4. 层级过于复杂
5. 内存不足导致频繁 GC

解决方案：
1. 使用 transform 代替位置/尺寸属性
2. 使用 opacity 代替 visibility
3. 减少动画元素数量
4. 使用 will-change 创建新图层
5. 简化 DOM 结构
```

**5. 解释 cubic-bezier 缓动函数**

```
cubic-bezier(x1, y1, x2, y2) 定义了一条贝塞尔曲线

- 起点固定为 (0, 0)，终点固定为 (1, 1)
- (x1, y1) 是第一个控制点
- (x2, y2) 是第二个控制点
- x 轴代表时间（0-1），y 轴代表进度（可以超出 0-1）

常用值：
- ease: cubic-bezier(0.25, 0.1, 0.25, 1)
- ease-in: cubic-bezier(0.42, 0, 1, 1)
- ease-out: cubic-bezier(0, 0, 0.58, 1)
- 弹性: cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

**6. animation-fill-mode 各值的作用？**

```css
none:     动画前后都不改变元素样式
forwards: 动画结束后保持最后一帧的样式
backwards: 动画开始前（delay 期间）应用第一帧样式
both:     同时应用 forwards 和 backwards

常见坑：
- 默认是 none，所以动画结束后元素会"跳回"原状态
- 要保持动画结果，必须设置 forwards 或 both
```

### 代码题

**实现一个按钮点击后的涟漪效果（Material Design Ripple）：**

```css
.ripple-btn {
  position: relative;
  overflow: hidden;
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.ripple-btn::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 10%, transparent 10%);
  background-size: 1000% 1000%;
  background-position: center;
  opacity: 0;
  transition: background-size 0.5s ease, opacity 0.5s ease;
}

.ripple-btn:active::after {
  background-size: 0% 0%;
  opacity: 1;
  transition: 0s;
}
```

## 延伸阅读

### 官方文档

- [MDN - CSS Transitions](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Transitions)
- [MDN - CSS Animations](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Animations)
- [MDN - Web Animations API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Animations_API)

### 工具推荐

- [cubic-bezier.com](https://cubic-bezier.com/) - 可视化贝塞尔曲线编辑器
- [Easings.net](https://easings.net/zh-cn) - 缓动函数速查表
- [Animista](https://animista.net/) - CSS 动画代码生成器
- [CSS Triggers](https://csstriggers.com/) - 查看 CSS 属性触发的渲染阶段

### 动画库推荐

- **Animate.css** - 预设 CSS 动画类库
- **Framer Motion** - React 动画库
- **GSAP** - 专业级 JavaScript 动画库
- **Lottie** - After Effects 动画导出播放

### 进阶主题

- CSS Houdini - 底层 CSS API
- View Transitions API - 页面过渡新标准
- Scroll-driven Animations - 滚动驱动动画
- CSS Motion Path - 路径动画

### 设计规范参考

- [Material Design Motion](https://m3.material.io/styles/motion/overview)
- [Apple Human Interface Guidelines - Animation](https://developer.apple.com/design/human-interface-guidelines/animation)

## 总结

CSS 动画是现代 Web 开发中不可或缺的技能。掌握 Transition 和 Animation 的使用，理解性能优化原则，能够帮助你创建流畅、自然的用户界面交互效果。

核心要点回顾：

1. **Transition** 适合简单的状态过渡，**Animation** 适合复杂的多阶段动画
2. **性能优化**的核心是只对 `transform` 和 `opacity` 做动画
3. **缓动函数**决定了动画的节奏感，选择合适的缓动能让动画更自然
4. 根据场景选择 **CSS 动画**或 **JavaScript 动画**
5. 动画应该服务于用户体验，而不是炫技

通过不断练习和实践，你将能够熟练运用 CSS 动画为用户创造出色的交互体验。
