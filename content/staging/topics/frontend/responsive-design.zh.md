---
title: 响应式设计完全指南
description: 掌握响应式Web设计的核心技术，构建适配多端的现代网页
track: frontend
section: html-css
difficulty: intermediate
tags:
  - 响应式
  - 移动优先
  - 媒体查询
  - CSS
status: imported
origin: old/src/content/docs/frontend/responsive-design.zh.md
divergence: 0.208
issues: []
legacy:
  category: Frontend
  subcategory: CSS
  order: 5
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是响应式设计？

响应式网页设计（Responsive Web Design，简称 RWD）是一种让网页能够**自动适应不同设备屏幕尺寸**的设计方法。无论用户使用手机、平板还是桌面电脑访问网站，页面都能提供最佳的浏览体验。

这个概念由 Ethan Marcotte 在 2010 年首次提出，现已成为现代 Web 开发的标准实践。

### 为什么需要响应式设计？

在移动互联网时代，用户通过各种设备访问网站：

- **手机**：320px - 480px
- **平板**：768px - 1024px
- **笔记本**：1024px - 1440px
- **桌面显示器**：1440px - 1920px+
- **超宽屏**：2560px+

如果不采用响应式设计，你需要为每种设备单独开发和维护一套代码，这不仅成本高昂，而且难以维护。

### 响应式设计的三大支柱

```
响应式设计 = 流式布局 + 弹性媒体 + 媒体查询
```

1. **流式布局（Fluid Layouts）**：使用相对单位（%、vw、vh）代替固定像素
2. **弹性媒体（Flexible Media）**：让图片、视频等媒体元素能够缩放
3. **媒体查询（Media Queries）**：根据设备特性应用不同样式

## 移动优先设计策略

### 什么是移动优先？

移动优先（Mobile First）是一种设计理念，主张**先为移动设备设计，再逐步增强到更大屏幕**。这与传统的桌面优先（Desktop First）方法相反。

```css
/* 移动优先：基础样式针对小屏幕 */
.container {
  width: 100%;
  padding: 1rem;
}

/* 逐步增强到更大屏幕 */
@media (min-width: 768px) {
  .container {
    width: 750px;
    margin: 0 auto;
  }
}

@media (min-width: 1024px) {
  .container {
    width: 960px;
  }
}
```

```css
/* 桌面优先：基础样式针对大屏幕（不推荐） */
.container {
  width: 1200px;
  margin: 0 auto;
}

/* 逐步降级到更小屏幕 */
@media (max-width: 1024px) {
  .container {
    width: 960px;
  }
}

@media (max-width: 768px) {
  .container {
    width: 100%;
  }
}
```

### 为什么选择移动优先？

| 优势 | 说明 |
|------|------|
| **性能优化** | 移动设备加载最小化的基础样式，桌面再增强 |
| **内容优先** | 强迫你思考什么内容最重要 |
| **渐进增强** | 基础体验保证所有设备可用 |
| **代码简洁** | 避免大量覆盖样式 |
| **未来友好** | 新设备通常更小更多样化 |

### 移动优先的设计流程

```
1. 内容优先级排序
      ↓
2. 设计移动端界面
      ↓
3. 编写基础 CSS
      ↓
4. 使用 min-width 媒体查询增强
      ↓
5. 测试各种设备
```

## 媒体查询详解

### 基本语法

```css
@media media-type and (media-feature) {
  /* 样式规则 */
}
```

- **media-type**：设备类型（screen、print、all 等）
- **media-feature**：设备特性（width、height、orientation 等）

### 常用媒体特性

```css
/* 视口宽度 */
@media (min-width: 768px) { }
@media (max-width: 1024px) { }
@media (min-width: 768px) and (max-width: 1024px) { }

/* 视口高度 */
@media (min-height: 600px) { }

/* 屏幕方向 */
@media (orientation: portrait) { }  /* 竖屏 */
@media (orientation: landscape) { } /* 横屏 */

/* 像素密度（高清屏） */
@media (-webkit-min-device-pixel-ratio: 2),
       (min-resolution: 192dpi) { }

/* 暗色模式 */
@media (prefers-color-scheme: dark) { }

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) { }

/* 悬停能力（区分触屏和鼠标设备） */
@media (hover: hover) { }
@media (hover: none) { }

/* 指针精度 */
@media (pointer: fine) { }   /* 鼠标 */
@media (pointer: coarse) { } /* 触屏 */
```

### 推荐断点设置

断点（Breakpoints）是响应式设计中触发布局变化的临界点。以下是经过实践验证的断点方案：

```css
/* 常用断点系统 */
:root {
  --breakpoint-sm: 576px;   /* 手机横屏 */
  --breakpoint-md: 768px;   /* 平板竖屏 */
  --breakpoint-lg: 992px;   /* 平板横屏/小笔记本 */
  --breakpoint-xl: 1200px;  /* 桌面显示器 */
  --breakpoint-xxl: 1400px; /* 大屏显示器 */
}

/* 移动优先断点 */
/* 基础样式：< 576px（手机） */

@media (min-width: 576px) {
  /* 小屏幕及以上 */
}

@media (min-width: 768px) {
  /* 中等屏幕及以上 */
}

@media (min-width: 992px) {
  /* 大屏幕及以上 */
}

@media (min-width: 1200px) {
  /* 超大屏幕及以上 */
}

@media (min-width: 1400px) {
  /* 特大屏幕 */
}
```

### 基于内容的断点

不要盲目使用固定断点，而应该**根据内容决定断点**：

```css
/* 不推荐：基于设备的断点 */
@media (min-width: 768px) { /* iPad 尺寸 */ }

/* 推荐：基于内容的断点 */
/* 当内容开始"破碎"时设置断点 */
.article {
  font-size: 1rem;
  line-height: 1.6;
}

/* 当行长超过 75 字符时增加边距 */
@media (min-width: 45em) {
  .article {
    max-width: 75ch;
    margin: 0 auto;
  }
}
```

### 媒体查询的组合使用

```css
/* 逻辑 AND */
@media screen and (min-width: 768px) and (orientation: landscape) {
  /* 屏幕设备、宽度>=768px、横屏 */
}

/* 逻辑 OR（逗号分隔） */
@media (max-width: 576px), (orientation: portrait) {
  /* 小屏幕 或 竖屏 */
}

/* 逻辑 NOT */
@media not print {
  /* 非打印设备 */
}

/* 新语法：范围查询（Level 4） */
@media (768px <= width <= 1024px) {
  /* 768px 到 1024px 之间 */
}
```

## 流式布局与弹性单位

### 相对单位详解

#### 百分比（%）

百分比相对于**父元素**计算：

```css
.parent {
  width: 1000px;
}

.child {
  width: 50%;     /* = 500px */
  padding: 5%;    /* padding 的百分比相对于父元素的宽度 = 50px */
  margin: 10%;    /* margin 的百分比也相对于父元素的宽度 = 100px */
}
```

#### 视口单位（vw, vh, vmin, vmax）

相对于**视口尺寸**计算：

```css
.hero {
  width: 100vw;    /* 视口宽度的 100% */
  height: 100vh;   /* 视口高度的 100% */
}

.square {
  width: 50vmin;   /* 视口宽高中较小值的 50% */
  height: 50vmin;
}

.banner {
  font-size: 10vmax; /* 视口宽高中较大值的 10% */
}
```

**新视口单位（解决移动端地址栏问题）**：

```css
.fullscreen {
  /* 小视口：地址栏展开时 */
  height: 100svh;

  /* 大视口：地址栏收起时 */
  height: 100lvh;

  /* 动态视口：自动适应 */
  height: 100dvh;
}
```

#### rem 和 em

```css
/* rem：相对于根元素（html）的字体大小 */
html {
  font-size: 16px; /* 1rem = 16px */
}

.container {
  width: 75rem;    /* = 1200px */
  padding: 1.5rem; /* = 24px */
}

/* em：相对于当前元素的字体大小 */
.button {
  font-size: 1rem;    /* = 16px */
  padding: 0.5em 1em; /* = 8px 16px */
}

.button-large {
  font-size: 1.25rem; /* = 20px */
  padding: 0.5em 1em; /* = 10px 20px（随字体缩放） */
}
```

#### ch 单位

```css
/* ch：相对于字符 "0" 的宽度 */
.article {
  max-width: 75ch; /* 约 75 个字符宽度，最佳阅读行长 */
}
```

### 流式布局实战

```css
/* 流式容器 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 流式网格 */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* 流式 Flexbox */
.flex-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.flex-item {
  flex: 1 1 300px; /* 最小 300px，可伸缩 */
}
```

### CSS 函数实现响应式

```css
/* clamp()：在最小值和最大值之间响应式缩放 */
.responsive-text {
  /* clamp(最小值, 首选值, 最大值) */
  font-size: clamp(1rem, 2.5vw, 2rem);
  padding: clamp(1rem, 5%, 3rem);
}

/* min() 和 max() */
.container {
  width: min(100% - 2rem, 1200px);
  /* 等同于：width: 100%; max-width: 1200px; margin: 0 1rem; */
}

.sidebar {
  width: max(300px, 25%);
  /* 至少 300px，最多 25% */
}

/* calc()：混合计算 */
.fluid-padding {
  padding: calc(1rem + 2vw);
}

.full-bleed {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
}
```

## 响应式图片

### 基础响应式图片

```css
/* 让图片自适应容器 */
img {
  max-width: 100%;
  height: auto;
  display: block;
}
```

### srcset 和 sizes 属性

```html
<!-- 基于像素密度 -->
<img
  src="image-400.jpg"
  srcset="image-400.jpg 1x,
          image-800.jpg 2x,
          image-1200.jpg 3x"
  alt="响应式图片"
>

<!-- 基于视口宽度（推荐） -->
<img
  src="image-800.jpg"
  srcset="image-400.jpg 400w,
          image-800.jpg 800w,
          image-1200.jpg 1200w,
          image-1600.jpg 1600w"
  sizes="(max-width: 600px) 100vw,
         (max-width: 1000px) 50vw,
         800px"
  alt="响应式图片"
>
```

`sizes` 属性告诉浏览器图片在不同视口下的显示宽度：
- 视口 <= 600px 时，图片宽度 = 100vw
- 视口 <= 1000px 时，图片宽度 = 50vw
- 其他情况，图片宽度 = 800px

### picture 元素：艺术指导

```html
<!-- 根据视口加载不同图片 -->
<picture>
  <!-- 小屏幕：竖版裁切 -->
  <source
    media="(max-width: 576px)"
    srcset="hero-mobile.jpg"
  >
  <!-- 中等屏幕：方形裁切 -->
  <source
    media="(max-width: 992px)"
    srcset="hero-tablet.jpg"
  >
  <!-- 大屏幕：全景 -->
  <img src="hero-desktop.jpg" alt="Hero Image">
</picture>

<!-- 根据格式选择（WebP 优先） -->
<picture>
  <source type="image/avif" srcset="image.avif">
  <source type="image/webp" srcset="image.webp">
  <img src="image.jpg" alt="支持多格式的图片">
</picture>

<!-- 结合媒体查询和格式 -->
<picture>
  <source
    media="(min-width: 800px)"
    type="image/webp"
    srcset="large.webp"
  >
  <source
    media="(min-width: 800px)"
    srcset="large.jpg"
  >
  <source type="image/webp" srcset="small.webp">
  <img src="small.jpg" alt="复杂响应式图片">
</picture>
```

### CSS 背景图片响应式

```css
.hero {
  background-image: url('hero-small.jpg');
  background-size: cover;
  background-position: center;
}

@media (min-width: 768px) {
  .hero {
    background-image: url('hero-medium.jpg');
  }
}

@media (min-width: 1200px) {
  .hero {
    background-image: url('hero-large.jpg');
  }
}

/* 使用 image-set()（现代方案） */
.hero {
  background-image: image-set(
    url('hero.avif') type('image/avif'),
    url('hero.webp') type('image/webp'),
    url('hero.jpg') type('image/jpeg')
  );
}

/* 高清屏适配 */
@media (-webkit-min-device-pixel-ratio: 2),
       (min-resolution: 192dpi) {
  .hero {
    background-image: url('hero@2x.jpg');
  }
}
```

## Container Queries

### 什么是容器查询？

容器查询（Container Queries）允许你**根据父容器的尺寸**而不是视口尺寸来应用样式。这是响应式设计的重大突破，让组件真正具备独立的响应能力。

```
媒体查询：相对于视口 → 页面级响应
容器查询：相对于容器 → 组件级响应
```

### 基本用法

```css
/* 1. 定义容器 */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* 简写 */
.card-container {
  container: card / inline-size;
}

/* 2. 编写容器查询 */
@container card (min-width: 400px) {
  .card {
    display: flex;
    flex-direction: row;
  }

  .card-image {
    width: 40%;
  }

  .card-content {
    width: 60%;
  }
}

@container card (min-width: 600px) {
  .card-title {
    font-size: 1.5rem;
  }
}
```

### 容器类型

```css
/* inline-size：基于容器的内联尺寸（通常是宽度） */
.container {
  container-type: inline-size;
}

/* size：基于容器的内联和块尺寸（宽度和高度） */
.container {
  container-type: size;
}

/* normal：不创建查询容器，但可用于样式查询 */
.container {
  container-type: normal;
}
```

### 容器查询单位

```css
.card-container {
  container-type: inline-size;
}

.card {
  /* cqw：容器宽度的 1% */
  padding: 5cqw;

  /* cqh：容器高度的 1% */
  margin-bottom: 2cqh;

  /* cqi：容器内联尺寸的 1% */
  font-size: clamp(1rem, 4cqi, 2rem);

  /* cqb：容器块尺寸的 1% */

  /* cqmin：cqi 和 cqb 中的较小值 */
  /* cqmax：cqi 和 cqb 中的较大值 */
}
```

### 实战：响应式卡片组件

```html
<div class="card-wrapper">
  <article class="card">
    <img class="card-image" src="thumbnail.jpg" alt="">
    <div class="card-body">
      <h3 class="card-title">文章标题</h3>
      <p class="card-excerpt">这是文章摘要...</p>
      <a class="card-link" href="#">阅读更多</a>
    </div>
  </article>
</div>
```

```css
.card-wrapper {
  container: card / inline-size;
}

/* 基础样式：垂直布局 */
.card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.card-body {
  padding: 1rem;
}

.card-title {
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
}

/* 中等容器：水平布局 */
@container card (min-width: 400px) {
  .card {
    flex-direction: row;
  }

  .card-image {
    width: 40%;
    aspect-ratio: 1;
  }

  .card-body {
    width: 60%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

/* 大容器：增强样式 */
@container card (min-width: 600px) {
  .card-title {
    font-size: 1.5rem;
  }

  .card-image {
    width: 35%;
  }

  .card-body {
    padding: 1.5rem;
  }

  .card-excerpt {
    font-size: 1.1rem;
  }
}
```

## 响应式排版

### 流式字体大小

```css
/* 基础方案：clamp() */
html {
  font-size: clamp(14px, 1vw + 0.5rem, 18px);
}

h1 {
  font-size: clamp(1.75rem, 4vw + 1rem, 3.5rem);
}

h2 {
  font-size: clamp(1.5rem, 3vw + 0.75rem, 2.5rem);
}

p {
  font-size: clamp(1rem, 0.5vw + 0.875rem, 1.125rem);
}
```

### 响应式字体缩放系统

```css
:root {
  /* 基础字体大小 */
  --font-size-base: 1rem;

  /* 字体缩放比例 */
  --font-scale: 1.25;

  /* 计算各级字体大小 */
  --font-size-sm: calc(var(--font-size-base) / var(--font-scale));
  --font-size-md: var(--font-size-base);
  --font-size-lg: calc(var(--font-size-base) * var(--font-scale));
  --font-size-xl: calc(var(--font-size-base) * var(--font-scale) * var(--font-scale));
  --font-size-2xl: calc(var(--font-size-base) * var(--font-scale) * var(--font-scale) * var(--font-scale));
  --font-size-3xl: calc(var(--font-size-base) * var(--font-scale) * var(--font-scale) * var(--font-scale) * var(--font-scale));
}

/* 大屏幕增大缩放比例 */
@media (min-width: 1200px) {
  :root {
    --font-scale: 1.333;
  }
}
```

### 响应式行高和间距

```css
:root {
  --line-height-tight: 1.2;
  --line-height-normal: 1.6;
  --line-height-loose: 1.8;
}

body {
  line-height: var(--line-height-normal);
}

h1, h2, h3 {
  line-height: var(--line-height-tight);
}

/* 响应式间距 */
:root {
  --space-unit: 1rem;
  --space-xs: calc(var(--space-unit) * 0.25);
  --space-sm: calc(var(--space-unit) * 0.5);
  --space-md: var(--space-unit);
  --space-lg: calc(var(--space-unit) * 1.5);
  --space-xl: calc(var(--space-unit) * 2);
  --space-2xl: calc(var(--space-unit) * 3);
}

@media (min-width: 768px) {
  :root {
    --space-unit: 1.25rem;
  }
}

@media (min-width: 1200px) {
  :root {
    --space-unit: 1.5rem;
  }
}
```

### 最佳阅读体验

```css
.article {
  /* 最佳行长：45-75 字符 */
  max-width: 75ch;

  /* 舒适的行高 */
  line-height: 1.6;

  /* 段落间距 */
  & > * + * {
    margin-top: 1.5em;
  }
}

/* 响应式阅读模式 */
@media (max-width: 576px) {
  .article {
    font-size: 1rem;
    line-height: 1.7; /* 小屏幕稍微增加行高 */
  }
}

@media (min-width: 1200px) {
  .article {
    font-size: 1.125rem;
    line-height: 1.65;
  }
}
```

## 实战案例

### 响应式导航栏

```html
<header class="header">
  <nav class="nav">
    <a href="/" class="nav-logo">Logo</a>

    <button class="nav-toggle" aria-label="切换导航">
      <span class="hamburger"></span>
    </button>

    <ul class="nav-menu">
      <li><a href="#" class="nav-link">首页</a></li>
      <li><a href="#" class="nav-link">产品</a></li>
      <li><a href="#" class="nav-link">服务</a></li>
      <li><a href="#" class="nav-link">关于我们</a></li>
      <li><a href="#" class="nav-link nav-cta">联系我们</a></li>
    </ul>
  </nav>
</header>
```

```css
/* 基础样式（移动端） */
.header {
  position: sticky;
  top: 0;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.nav-logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  text-decoration: none;
}

.nav-toggle {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.hamburger,
.hamburger::before,
.hamburger::after {
  display: block;
  width: 100%;
  height: 3px;
  background: #333;
  border-radius: 2px;
  transition: transform 0.3s ease;
}

.hamburger {
  position: relative;
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
}

.hamburger::before {
  top: -8px;
}

.hamburger::after {
  top: 8px;
}

/* 移动端菜单（默认隐藏） */
.nav-menu {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  flex-direction: column;
  padding: 2rem;
  list-style: none;
  margin: 0;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}

.nav-menu.is-open {
  transform: translateX(0);
}

.nav-link {
  display: block;
  padding: 1rem 0;
  font-size: 1.25rem;
  color: #333;
  text-decoration: none;
  border-bottom: 1px solid #eee;
}

.nav-cta {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border-radius: 4px;
  border-bottom: none;
}

/* 平板及以上 */
@media (min-width: 768px) {
  .nav-toggle {
    display: none;
  }

  .nav-menu {
    position: static;
    flex-direction: row;
    transform: none;
    padding: 0;
    background: transparent;
    gap: 0.5rem;
  }

  .nav-link {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border-bottom: none;
  }

  .nav-link:hover {
    color: #007bff;
  }

  .nav-cta {
    margin-top: 0;
    padding: 0.5rem 1rem;
  }

  .nav-cta:hover {
    background: #0056b3;
  }
}
```

```javascript
// 导航切换脚本
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

navToggle.addEventListener('click', () => {
  navMenu.classList.toggle('is-open');
  navToggle.setAttribute(
    'aria-expanded',
    navMenu.classList.contains('is-open')
  );
});

// 点击链接后关闭菜单
navMenu.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('is-open');
  });
});

// 窗口调整时重置菜单状态
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    navMenu.classList.remove('is-open');
  }
});
```

### 响应式网格系统

```css
/* 简易响应式网格系统 */
.grid {
  display: grid;
  gap: var(--grid-gap, 1.5rem);
}

/* 自动响应网格 */
.grid-auto {
  grid-template-columns: repeat(
    auto-fit,
    minmax(var(--grid-min, 250px), 1fr)
  );
}

/* 固定列数网格 */
.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

@media (min-width: 576px) {
  .sm\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .sm\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .md\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 992px) {
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
  .lg\:grid-cols-5 { grid-template-columns: repeat(5, 1fr); }
}

@media (min-width: 1200px) {
  .xl\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
  .xl\:grid-cols-5 { grid-template-columns: repeat(5, 1fr); }
  .xl\:grid-cols-6 { grid-template-columns: repeat(6, 1fr); }
}
```

```html
<!-- 使用示例 -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  <div class="card">...</div>
  <div class="card">...</div>
  <div class="card">...</div>
  <div class="card">...</div>
</div>

<!-- 自动响应网格 -->
<div class="grid grid-auto" style="--grid-min: 300px; --grid-gap: 2rem;">
  <div class="card">...</div>
  <div class="card">...</div>
  <div class="card">...</div>
</div>
```

### 响应式两栏布局

```css
.layout {
  display: grid;
  gap: 2rem;
}

.main-content {
  min-width: 0; /* 防止内容溢出 */
}

.sidebar {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
}

/* 移动端：堆叠布局 */
@media (max-width: 767px) {
  .sidebar {
    order: -1; /* 侧边栏在上 */
  }
}

/* 平板及以上：两栏布局 */
@media (min-width: 768px) {
  .layout {
    grid-template-columns: 1fr 300px;
  }
}

/* 大屏：更宽的侧边栏 */
@media (min-width: 1200px) {
  .layout {
    grid-template-columns: 1fr 350px;
    gap: 3rem;
  }
}
```

## 测试与调试工具

### 浏览器开发者工具

```
Chrome DevTools 响应式调试：
1. 按 F12 打开开发者工具
2. 点击"设备切换"按钮（或 Ctrl + Shift + M）
3. 选择预设设备或自定义尺寸
4. 测试不同 DPR（设备像素比）
5. 模拟触摸事件和网络节流
```

### 常用测试工具

| 工具 | 用途 | 链接 |
|------|------|------|
| **Chrome DevTools** | 响应式调试、性能分析 | 内置 |
| **Firefox Responsive Design Mode** | 响应式测试 | 内置 |
| **Responsively App** | 同时预览多个尺寸 | responsively.app |
| **BrowserStack** | 真机测试 | browserstack.com |
| **Polypane** | 专业响应式测试 | polypane.app |

### CSS 调试技巧

```css
/* 显示所有元素边界 */
* {
  outline: 1px solid red;
}

/* 显示容器查询边界 */
[style*="container"] {
  outline: 2px dashed blue;
}

/* 显示当前断点 */
body::before {
  content: 'Mobile';
  position: fixed;
  top: 0;
  left: 0;
  padding: 0.5rem;
  background: red;
  color: white;
  font-size: 12px;
  z-index: 9999;
}

@media (min-width: 576px) {
  body::before {
    content: 'SM (>=576px)';
    background: orange;
  }
}

@media (min-width: 768px) {
  body::before {
    content: 'MD (>=768px)';
    background: yellow;
    color: black;
  }
}

@media (min-width: 992px) {
  body::before {
    content: 'LG (>=992px)';
    background: green;
    color: white;
  }
}

@media (min-width: 1200px) {
  body::before {
    content: 'XL (>=1200px)';
    background: blue;
  }
}
```

### 性能测试清单

```
响应式性能优化检查：

[ ] 图片是否使用了 srcset 或 picture
[ ] 是否避免了不必要的大图片加载
[ ] CSS 是否使用了媒体查询拆分
[ ] 字体文件是否进行了子集化
[ ] 是否使用了 CSS 容器查询减少 JS
[ ] 移动端是否去除了 hover 效果
[ ] 是否禁用了移动端不需要的动画
[ ] Lighthouse 移动端分数是否达标
```

## 面试要点

### 常见面试题

**Q1: 什么是响应式设计？它的核心原则是什么？**

```
响应式设计是让网页能够自动适应不同设备屏幕尺寸的设计方法。

核心原则：
1. 流式布局：使用相对单位（%、vw、rem）
2. 弹性媒体：让图片视频能够缩放
3. 媒体查询：根据设备特性应用不同样式

关键技术：
- CSS 媒体查询
- Flexbox 和 Grid 布局
- 响应式图片（srcset、picture）
- CSS 函数（clamp、min、max）
- Container Queries
```

**Q2: 移动优先和桌面优先有什么区别？为什么推荐移动优先？**

```
移动优先（Mobile First）：
- 基础样式针对小屏幕
- 使用 min-width 媒体查询逐步增强
- 移动设备加载最小化样式，性能更好

桌面优先（Desktop First）：
- 基础样式针对大屏幕
- 使用 max-width 媒体查询逐步降级
- 移动设备需要加载并覆盖大量样式

推荐移动优先的原因：
1. 性能优化：移动设备加载更少代码
2. 内容优先：迫使你思考核心内容
3. 渐进增强：保证基础体验
4. 代码简洁：减少覆盖样式
5. 符合移动互联网趋势
```

**Q3: 如何选择合适的断点？**

```
断点选择原则：
1. 基于内容而非设备
2. 当布局开始"破碎"时设置断点
3. 避免过多断点（通常 3-5 个足够）

常用断点参考：
- 576px：小屏手机横屏
- 768px：平板竖屏
- 992px：平板横屏/小笔记本
- 1200px：桌面显示器
- 1400px：大屏显示器

实际项目中应该：
- 先完成移动端设计
- 逐渐拉伸视口
- 在布局出问题的地方设置断点
```

**Q4: rem、em、px 的区别和使用场景？**

```
px（像素）：
- 绝对单位，1px = 1/96 英寸
- 用于边框、阴影等固定尺寸

rem（root em）：
- 相对于根元素（html）字体大小
- 用于整体布局和间距
- 便于实现整体缩放

em：
- 相对于当前元素字体大小
- 用于与文字相关的间距（padding、margin）
- 组件内部尺寸

推荐实践：
- 根字体：px 或响应式 clamp()
- 布局间距：rem
- 组件内间距：em
- 边框/阴影：px
- 行长：ch
```

**Q5: 什么是 Container Queries？它解决了什么问题？**

```
Container Queries（容器查询）允许根据父容器尺寸
而非视口尺寸来应用样式。

解决的问题：
- 媒体查询只能基于视口，组件无法真正独立
- 同一组件在不同容器中无法自动适应
- 组件复用时需要大量媒体查询覆盖

使用方法：
1. 定义容器：container: name / inline-size
2. 编写查询：@container name (min-width: 400px) {}

容器查询单位：
- cqw：容器宽度的 1%
- cqi：容器内联尺寸的 1%
- cqb：容器块尺寸的 1%
```

**Q6: 如何实现响应式图片？**

```html
<!-- 方法 1：CSS 控制 -->
img { max-width: 100%; height: auto; }

<!-- 方法 2：srcset 基于视口 -->
<img
  srcset="small.jpg 400w, medium.jpg 800w, large.jpg 1200w"
  sizes="(max-width: 600px) 100vw, 50vw"
  src="medium.jpg"
>

<!-- 方法 3：picture 艺术指导 -->
<picture>
  <source media="(max-width: 600px)" srcset="mobile.jpg">
  <source media="(max-width: 1000px)" srcset="tablet.jpg">
  <img src="desktop.jpg">
</picture>

<!-- 方法 4：多格式支持 -->
<picture>
  <source type="image/avif" srcset="image.avif">
  <source type="image/webp" srcset="image.webp">
  <img src="image.jpg">
</picture>
```

### 实战编码题

**题目：实现一个响应式卡片网格**

```css
/* 要求：
   - 移动端单列
   - 平板双列
   - 桌面三列
   - 使用 CSS Grid
   - 支持自动填充
*/

.card-grid {
  display: grid;
  gap: 1.5rem;
  padding: 1rem;

  /* 方案 1：固定断点 */
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 方案 2：自动响应（推荐） */
.card-grid-auto {
  display: grid;
  gap: 1.5rem;
  padding: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
```

## 总结

响应式设计是现代 Web 开发的必备技能。核心要点：

1. **移动优先**：从小屏幕开始，逐步增强
2. **流式布局**：使用相对单位，避免固定尺寸
3. **弹性媒体**：让图片视频自适应
4. **媒体查询**：基于内容设置断点
5. **容器查询**：组件级响应式设计
6. **性能意识**：优化加载，减少不必要的资源

掌握这些技术，你就能构建出在任何设备上都能提供出色体验的网页应用。
