---
title: CSS Grid Layout Complete Guide
description: Master CSS Grid for powerful two-dimensional web layouts
track: frontend
section: html-css
difficulty: intermediate
tags:
  - CSS
  - Grid
  - Layout
  - Responsive
status: imported
origin: old/src/content/docs/frontend/css-grid.zh.md
divergence: 0.198
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Frontend
  subcategory: CSS
  order: 2
  lastUpdated: 2026-01-07
---

CSS Grid 是现代 CSS 中最强大的布局系统之一。它是一个二维布局系统，可以同时处理行和列，使复杂的网页布局变得简单而直观。本完整指南将深入探讨 CSS Grid 的核心概念、关键属性和实际应用。

## 理解二维布局

### 从一维到二维的飞跃

在 CSS Grid 出现之前，我们主要依靠 float、inline-block 和 Flexbox 进行页面布局。其中，Flexbox 是一个优秀的一维布局系统，能够很好地处理单行或单列元素的排列。

然而，当我们需要同时控制行和列时，一维布局系统就显得力不从心。CSS Grid 正是为解决这个问题而生——它是第一个专门为二维布局设计的 CSS 模块。

**一维布局与二维布局对比：**

```
一维布局 (Flexbox):
+-----+-----+-----+-----+
|  1  |  2  |  3  |  4  |  <-- 只控制一个方向
+-----+-----+-----+-----+

二维布局 (Grid):
+-----+-----+-----+
|  1  |  2  |  3  |  <-- 同时控制
+-----+-----+-----+     行和列
|  4  |  5  |  6  |
+-----+-----+-----+
|  7  |  8  |  9  |
+-----+-----+-----+
```

### Grid 布局的优势

1. **真正的二维控制**：同时定义行和列的大小和位置
2. **显式定位**：精确控制元素在网格中的位置
3. **重叠能力**：元素可以重叠，无需额外的定位技巧
4. **响应式友好**：结合 `minmax()` 和 `auto-fit`，响应式布局变得轻而易举

## 核心概念：网格容器与网格项目

### 网格容器

当一个元素设置为 `display: grid` 或 `display: inline-grid` 时，它就成为了一个网格容器。网格容器是所有网格布局的起点。

```css
.container {
  display: grid;
  /* 或者 */
  display: inline-grid;
}
```

**两者的区别：**
- `display: grid`：容器表现为块级元素
- `display: inline-grid`：容器表现为行内元素

### 网格项目

网格容器的直接子元素自动成为网格项目。注意，只有直接子元素才是网格项目——孙元素及更深层的后代不会直接受到网格布局的影响。

```html
<div class="grid-container">
  <div class="grid-item">1</div>  <!-- 网格项目 -->
  <div class="grid-item">2</div>  <!-- 网格项目 -->
  <div class="grid-item">
    <span>内部元素</span>  <!-- 不是网格项目 -->
  </div>
</div>
```

### 网格线与网格轨道

理解 Grid 布局需要掌握几个关键术语：

- **网格线**：构成网格结构的分割线，包括行线和列线
- **网格轨道**：两条相邻网格线之间的空间，形成一行或一列
- **网格单元格**：由四条网格线形成的最小空间单位
- **网格区域**：由一个或多个网格单元格组成的矩形区域

```
     列线 1      列线 2      列线 3      列线 4
       |          |          |          |
行线 1 +----------+----------+----------+
       |          |          |          | <-- 网格轨道（行）
行线 2 +----------+----------+----------+
       |          |  单元格   |          |
行线 3 +----------+----------+----------+
       |          |          |          |
行线 4 +----------+----------+----------+
                  |
             网格轨道（列）
```

## 核心属性详解

### grid-template-columns 和 grid-template-rows

这两个属性定义网格列和行的大小。

```css
.container {
  display: grid;
  /* 定义三列，宽度分别为 100px、200px、100px */
  grid-template-columns: 100px 200px 100px;
  /* 定义两行，每行高度 50px */
  grid-template-rows: 50px 50px;
}
```

### fr 单位：弹性比例单位

`fr`（fraction）单位是 Grid 布局特有的单位，表示网格容器中可用空间的等份。

```css
.container {
  display: grid;
  /* 三列按 1:2:1 比例分配空间 */
  grid-template-columns: 1fr 2fr 1fr;
}
```

**fr 与百分比的区别：**

```css
/* 使用百分比需要考虑 gap 的影响 */
grid-template-columns: 33.33% 33.33% 33.33%; /* 有 gap 时可能溢出 */

/* 使用 fr 会自动扣除 gap 空间 */
grid-template-columns: 1fr 1fr 1fr; /* 始终完美适配 */
```

### repeat() 函数

当需要重复定义相同的轨道时，`repeat()` 函数可以简化代码：

```css
.container {
  /* 等同于：grid-template-columns: 1fr 1fr 1fr 1fr; */
  grid-template-columns: repeat(4, 1fr);

  /* 可以重复复杂的模式 */
  grid-template-columns: repeat(3, 1fr 2fr);
  /* 等同于：1fr 2fr 1fr 2fr 1fr 2fr */
}
```

**结合 auto-fill 和 auto-fit：**

```css
/* auto-fill：创建尽可能多的列 */
grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));

/* auto-fit：类似 auto-fill，但会折叠空轨道 */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
```

### minmax() 函数

`minmax()` 函数定义一个大小范围，允许轨道在最小值和最大值之间自适应：

```css
.container {
  /* 列宽最小 100px，最大 1fr */
  grid-template-columns: minmax(100px, 1fr) minmax(200px, 2fr);

  /* 行高最小由内容决定，最大 200px */
  grid-template-rows: minmax(auto, 200px);
}
```

### gap 属性

`gap` 属性设置网格项目之间的间距：

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);

  /* row-gap 和 column-gap 都为 20px */
  gap: 20px;

  /* 分别设置 row-gap 和 column-gap */
  row-gap: 20px;
  column-gap: 10px;

  /* 简写形式：row-gap column-gap */
  gap: 20px 10px;
}
```

### grid-template-areas 和命名网格区域

`grid-template-areas` 允许你以可视化的方式定义布局：

```css
.container {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: 60px 1fr 60px;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }
```

使用 `.` 表示空白区域：

```css
grid-template-areas:
  "header header header"
  "sidebar main ."
  "footer footer footer";
```

### 网格项目定位

你可以使用网格线来精确定位项目：

```css
.item {
  /* 从列线 1 开始，到列线 3 结束 */
  grid-column-start: 1;
  grid-column-end: 3;

  /* 简写形式 */
  grid-column: 1 / 3;

  /* 使用 span 关键字 */
  grid-column: 1 / span 2; /* 从线 1 开始，跨越 2 列 */

  /* 同样适用于行 */
  grid-row: 2 / 4;
}
```

### 对齐属性

Grid 为容器和单个项目都提供了强大的对齐能力。

**容器对齐（针对所有项目）：**

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  grid-template-rows: repeat(2, 100px);

  /* 在网格区域内水平对齐项目 */
  justify-items: start | end | center | stretch;

  /* 在网格区域内垂直对齐项目 */
  align-items: start | end | center | stretch;

  /* justify-items 和 align-items 的简写 */
  place-items: center; /* 两个轴都居中 */
  place-items: start end; /* align-items / justify-items */

  /* 在容器内水平分布轨道 */
  justify-content: start | end | center | space-between | space-around | space-evenly;

  /* 在容器内垂直分布轨道 */
  align-content: start | end | center | space-between | space-around | space-evenly;

  /* justify-content 和 align-content 的简写 */
  place-content: center;
}
```

**项目自身对齐：**

```css
.item {
  /* 覆盖容器的 justify-items 设置 */
  justify-self: start | end | center | stretch;

  /* 覆盖容器的 align-items 设置 */
  align-self: start | end | center | stretch;

  /* align-self 和 justify-self 的简写 */
  place-self: center;
}
```

## 隐式网格与显式网格

### 显式网格

显式网格是你通过 `grid-template-columns`、`grid-template-rows` 和 `grid-template-areas` 明确定义的网格。

```css
.container {
  display: grid;
  /* 显式网格：3 列，2 行 */
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 100px);
}
```

### 隐式网格

当项目数量超过显式网格的单元格数量，或者项目被放置在显式网格之外时，浏览器会自动创建额外的轨道。这些被称为隐式轨道，形成隐式网格。

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 100px 100px;

  /* 控制隐式创建的行的大小 */
  grid-auto-rows: 150px;

  /* 控制隐式创建的列的大小 */
  grid-auto-columns: 100px;

  /* 控制自动放置的方向 */
  grid-auto-flow: row | column | dense | row dense | column dense;
}
```

**使用 grid-auto-flow：**

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);

  /* row（默认）：先填充行，然后添加新行 */
  grid-auto-flow: row;

  /* column：先填充列，然后添加新列 */
  grid-auto-flow: column;

  /* dense：尝试填充网格中较早位置的空洞 */
  grid-auto-flow: dense;
}
```

`dense` 关键字对于项目大小不一且希望最小化空白的布局特别有用：

```css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  grid-auto-flow: dense; /* 用较小的项目填充空隙 */
}

.large-item {
  grid-column: span 2;
  grid-row: span 2;
}
```

## Auto-fit 与 Auto-fill

理解 `auto-fit` 和 `auto-fill` 的区别对于创建响应式布局至关重要。

### auto-fill

创建尽可能多的轨道，即使它们是空的：

```css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
}
```

使用 `auto-fill` 时，如果只有 3 个项目但有 6 列的空间，你会得到 6 列（3 个填充，3 个空的）。空列仍然占用空间。

### auto-fit

与 `auto-fill` 类似，但会将空轨道折叠为零宽度：

```css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
}
```

使用 `auto-fit` 时，同样的 3 个项目会扩展以填满所有可用空间，因为空轨道被折叠了。

**视觉对比：**

```
容器宽度：600px，项目最小值：100px

auto-fill:
+------+------+------+------+------+------+
| 项目 | 项目 | 项目 |      |      |      |
+------+------+------+------+------+------+
       ^项目保持 minmax 大小，空轨道被保留

auto-fit:
+----------+----------+----------+
|   项目   |   项目   |   项目   |
+----------+----------+----------+
           ^项目扩展，空轨道被折叠
```

**何时使用哪个：**

- 当你希望无论内容多少都保持一致的列宽时，使用 `auto-fill`
- 当你希望项目扩展以填满可用空间时，使用 `auto-fit`

## 代码示例

### 示例 1：经典圣杯布局

圣杯布局是一种经典的网页布局模式，包含页头、页脚、主内容区和两个侧边栏。

```html
<div class="holy-grail">
  <header class="header">页头</header>
  <nav class="nav">导航</nav>
  <main class="main">主内容</main>
  <aside class="aside">侧边栏</aside>
  <footer class="footer">页脚</footer>
</div>
```

```css
.holy-grail {
  display: grid;
  min-height: 100vh;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
  gap: 10px;
}

.header { grid-area: header; background: #f0f0f0; padding: 20px; }
.nav { grid-area: nav; background: #e0e0e0; padding: 20px; }
.main { grid-area: main; background: #ffffff; padding: 20px; }
.aside { grid-area: aside; background: #e0e0e0; padding: 20px; }
.footer { grid-area: footer; background: #f0f0f0; padding: 20px; }

/* 响应式处理 */
@media (max-width: 768px) {
  .holy-grail {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "nav"
      "main"
      "aside"
      "footer";
  }
}
```

### 示例 2：响应式图片网格

无需媒体查询的响应式网格布局：

```html
<div class="image-grid">
  <div class="image-item"><img src="image1.jpg" alt=""></div>
  <div class="image-item"><img src="image2.jpg" alt=""></div>
  <div class="image-item"><img src="image3.jpg" alt=""></div>
  <div class="image-item"><img src="image4.jpg" alt=""></div>
  <div class="image-item"><img src="image5.jpg" alt=""></div>
  <div class="image-item"><img src="image6.jpg" alt=""></div>
</div>
```

```css
.image-grid {
  display: grid;
  /* 关键技术：auto-fit + minmax 实现自适应列数 */
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  padding: 16px;
}

.image-item {
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 8px;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-item:hover img {
  transform: scale(1.05);
}
```

### 示例 3：杂志风格布局

利用 Grid 的定位能力创建不规则的杂志布局：

```html
<div class="magazine-layout">
  <article class="feature">特色文章</article>
  <article class="story story-1">故事 1</article>
  <article class="story story-2">故事 2</article>
  <article class="story story-3">故事 3</article>
  <article class="story story-4">故事 4</article>
</div>
```

```css
.magazine-layout {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 200px);
  gap: 16px;
  padding: 16px;
}

/* 特色文章占据左上角 2x2 区域 */
.feature {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  border-radius: 12px;
}

.story {
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 1.2rem;
}

.story-1 { grid-column: 3 / 5; }
.story-2 { grid-column: 3; }
.story-3 { grid-column: 4; }
.story-4 { grid-column: 1 / 5; grid-row: 3; }

/* 响应式处理 */
@media (max-width: 768px) {
  .magazine-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }

  .feature,
  .story-1,
  .story-2,
  .story-3,
  .story-4 {
    grid-column: 1;
    grid-row: auto;
  }

  .feature {
    min-height: 300px;
  }

  .story {
    min-height: 150px;
  }
}
```

### 示例 4：仪表板卡片布局

```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-auto-rows: minmax(200px, auto);
  gap: 24px;
  padding: 24px;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

/* 大卡片跨越两列 */
.card.large {
  grid-column: span 2;
}

/* 高卡片跨越两行 */
.card.tall {
  grid-row: span 2;
}

/* 小屏幕上重置跨越 */
@media (max-width: 768px) {
  .card.large,
  .card.tall {
    grid-column: span 1;
    grid-row: span 1;
  }
}
```

### 示例 5：使用 Grid 实现类瀑布流布局

虽然 CSS Grid 原生还不支持真正的瀑布流布局，但你可以创建类似的效果：

```css
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  grid-auto-rows: 10px;
  gap: 16px;
}

.masonry-item {
  background: #f0f0f0;
  border-radius: 8px;
  padding: 16px;
}

/* 使用行跨越实现不同高度 */
.masonry-item.small { grid-row: span 15; }
.masonry-item.medium { grid-row: span 25; }
.masonry-item.large { grid-row: span 35; }
```

### 示例 6：元素重叠

Grid 使元素重叠变得简单直接：

```css
.overlap-container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(6, 50px);
}

.background-image {
  grid-column: 1 / -1;
  grid-row: 1 / -1;
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.overlay-text {
  grid-column: 2 / 8;
  grid-row: 3 / 5;
  z-index: 1;
  background: rgba(255, 255, 255, 0.9);
  padding: 24px;
  border-radius: 8px;
}

.corner-badge {
  grid-column: 11 / 13;
  grid-row: 1 / 2;
  z-index: 2;
  background: #ff6b6b;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## 常见布局模式

### 模式 1：侧边栏布局

```css
.sidebar-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  min-height: 100vh;
}

/* 可折叠侧边栏 */
.sidebar-layout.collapsed {
  grid-template-columns: 60px 1fr;
}

/* 响应式：移动端侧边栏变为顶部栏 */
@media (max-width: 768px) {
  .sidebar-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
}
```

### 模式 2：带特色项的卡片网格

```css
.featured-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 250px);
  gap: 16px;
}

.featured-item {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
}

.regular-item {
  /* 自动填充剩余空间 */
}
```

### 模式 3：煎饼堆叠（粘性页脚）

```css
.page-layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.header { /* auto 高度 */ }
.main { /* 占据所有可用空间 */ }
.footer { /* auto 高度，始终在底部 */ }
```

### 模式 4：RAM（Repeat、Auto、Minmax）模式

最通用的响应式模式：

```css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 1rem;
}
```

这个模式：
- 使用 `auto-fit` 创建尽可能多的适合容器的列
- 使用 `minmax()` 设置列的最小和最大宽度
- 使用 `min(100%, 300px)` 防止在小屏幕上溢出

## 最佳实践

### 使用有意义的命名

命名网格线和区域可以大大提高代码可读性：

```css
.container {
  display: grid;
  grid-template-columns:
    [sidebar-start] 250px
    [sidebar-end content-start] 1fr
    [content-end];
  grid-template-rows:
    [header-start] 60px
    [header-end main-start] 1fr
    [main-end footer-start] 80px
    [footer-end];
}
```

### 避免固定像素值

尽可能使用相对和弹性单位：

```css
/* 不推荐 */
grid-template-columns: 300px 600px 300px;

/* 推荐 */
grid-template-columns: 1fr 2fr 1fr;
/* 或者 */
grid-template-columns: minmax(200px, 1fr) minmax(400px, 2fr) minmax(200px, 1fr);
```

### 利用 auto-fit/auto-fill 实现无媒体查询的响应式

```css
/* 自适应响应式网格 */
grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
```

### 使用 grid-auto-flow 控制自动放置

```css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-flow: dense; /* 自动填充空白区域 */
}
```

### 考虑可访问性

确保视觉顺序与 DOM 顺序匹配，或提供适当的 ARIA 属性：

```css
/* 仅在大屏幕上改变视觉顺序 */
@media (min-width: 768px) {
  .sidebar { order: -1; }
}
```

### 在可用时使用 Subgrid

CSS Subgrid 允许嵌套网格与父网格对齐：

```css
.parent {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.child {
  grid-column: span 3;
  display: grid;
  grid-template-columns: subgrid; /* 继承父级的列轨道 */
}
```

注意：Subgrid 在现代浏览器中已有良好支持，但请检查目标受众的兼容性。

## Grid 与 Flexbox 对比

| 特性 | CSS Grid | Flexbox |
|---------|----------|---------|
| 布局维度 | 二维（行和列） | 一维（行或列） |
| 布局方向 | 同时控制两个方向 | 主轴和交叉轴 |
| 内容优先 vs 布局优先 | 布局优先 | 内容优先 |
| 对齐控制 | 强大的二维对齐 | 优秀的一维对齐 |
| 项目定位 | 可精确定位到任何位置 | 基于文档流 |
| 重叠能力 | 原生支持 | 需要额外定位 |
| 浏览器支持 | 现代浏览器 | 更广泛的支持 |
| 使用场景 | 页面布局，复杂网格 | 组件布局，导航 |

### 何时使用 Grid

- 需要同时控制行和列的复杂布局
- 整体页面布局结构
- 需要元素重叠的设计
- 不规则网格布局
- 预先知道布局结构时

### 何时使用 Flexbox

- 一维排列（导航栏、按钮组）
- 内容驱动的布局
- 需要自动分配剩余空间
- 简单的居中对齐
- 内容大小决定布局时

### 两者结合使用

在实际开发中，Grid 和 Flexbox 经常结合使用：

```css
/* Grid 用于整体页面布局 */
.page {
  display: grid;
  grid-template-areas:
    "header"
    "main"
    "footer";
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

/* Flexbox 用于组件内部布局 */
.header {
  grid-area: header;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
}

.nav-links {
  display: flex;
  gap: 20px;
}

/* Grid 用于卡片网格，Flexbox 用于卡片内部 */
.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.card {
  display: flex;
  flex-direction: column;
}

.card-content {
  flex: 1; /* 将页脚推到底部 */
}
```

## 面试重点

### 常见面试问题

**1. CSS Grid 和 Flexbox 有什么区别？**

Grid 是二维布局系统，同时控制行和列；Flexbox 是一维布局系统，一次处理一行或一列。Grid 更适合页面级布局，而 Flexbox 擅长组件级布局。

**2. 解释 fr 单位的工作原理**

`fr`（fraction）单位表示网格容器中剩余空间的等份。在分配固定大小和内容大小后，剩余空间按照 fr 比例分配。

**3. auto-fill 和 auto-fit 有什么区别？**

两者都用于自动计算轨道数量。区别在于容器有额外空间时：
- `auto-fill`：保留空轨道
- `auto-fit`：折叠空轨道，允许现有项目扩展填充空间

**4. 如何不使用媒体查询创建响应式网格？**

使用 `repeat(auto-fit, minmax(最小宽度, 1fr))` 组合。

```css
grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
```

**5. grid-template-areas 的优势是什么？**

它提供了一种可视化的方式来定义布局，使代码更直观、可读性更强，易于维护和修改。

**6. 解释隐式网格与显式网格**

- 显式网格：由 `grid-template-columns`、`grid-template-rows` 和 `grid-template-areas` 定义
- 隐式网格：当项目超出显式网格或被放置在其外部时自动创建的轨道。由 `grid-auto-rows`、`grid-auto-columns` 和 `grid-auto-flow` 控制

**7. 如何使用 Grid 居中元素？**

```css
.container {
  display: grid;
  place-items: center;
  /* 或者 */
  justify-items: center;
  align-items: center;
}
```

**8. grid-auto-flow: dense 有什么作用？**

它启用"密集"填充算法，网格会尝试在较早位置填充空洞，可能会改变项目的视觉顺序。对于项目大小不一的布局很有用。

### 需要掌握的核心属性

**容器属性：**
- `display: grid`
- `grid-template-columns/rows`
- `grid-template-areas`
- `gap`（row-gap、column-gap）
- `grid-auto-flow`
- `grid-auto-rows/columns`
- `justify-items/align-items`
- `justify-content/align-content`

**项目属性：**
- `grid-column/grid-row`
- `grid-area`
- `justify-self/align-self`

### 常见陷阱

**1. 忘记 min-width: 0 导致溢出**

Grid 项目默认有 `min-width: auto`，长内容可能导致溢出：

```css
.grid-item {
  min-width: 0; /* 允许缩小到内容大小以下 */
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**2. 基于百分比的间距**

与 fr 单位不同，百分比间距在 Grid 中效果不好：

```css
/* 避免 */
gap: 5%;

/* 使用替代方案 */
gap: 1rem;
/* 或者 */
gap: clamp(1rem, 2vw, 2rem);
```

**3. 重叠时不使用 z-index**

当项目重叠时，它们按 DOM 顺序堆叠。使用 z-index 控制：

```css
.background { z-index: 1; }
.foreground { z-index: 2; }
```

## 浏览器支持与回退

CSS Grid 在所有现代浏览器中都有出色的支持。对于旧版浏览器，考虑以下策略：

```css
/* 特性检测 */
@supports (display: grid) {
  .container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

/* 旧版浏览器回退 */
@supports not (display: grid) {
  .container {
    display: flex;
    flex-wrap: wrap;
  }

  .item {
    flex: 1 1 250px;
  }
}
```

## 延伸阅读

### 官方资源

- [MDN CSS Grid 布局](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout) - 权威官方文档
- [CSS Grid Level 2](https://www.w3.org/TR/css-grid-2/) - W3C 规范

### 学习资源

- [CSS-Tricks Grid 完整指南](https://css-tricks.com/snippets/css/complete-guide-grid/) - 最全面的 Grid 指南
- [Grid by Example](https://gridbyexample.com/) - Rachel Andrew 的 Grid 示例集
- [Learn CSS Grid](https://learncssgrid.com/) - 交互式学习平台
- [CSS Grid 交互式指南](https://www.joshwcomeau.com/css/interactive-guide-to-grid/) - Josh Comeau 的可视化指南

### 实践工具

- [CSS Grid 生成器](https://cssgrid-generator.netlify.app/) - 可视化 Grid 生成器
- [Grid Garden](https://cssgridgarden.com/) - 通过游戏学习 Grid
- [Firefox Grid 检查器](https://firefox-source-docs.mozilla.org/devtools-user/page_inspector/how_to/examine_grid_layouts/index.html) - 强大的调试工具

### 进阶主题

- **Subgrid**：Grid Level 2 特性，允许子元素继承父网格轨道定义
- **瀑布流布局**：CSS Grid 未来可能支持的瀑布流/Pinterest 风格布局
- **容器查询**：与 Grid 结合实现更智能的响应式设计

## 总结

CSS Grid 是现代网页布局的基石，提供了前所未有的布局能力和灵活性。通过掌握本指南涵盖的核心概念和技术，你可以：

1. 轻松创建复杂的二维布局结构
2. 实现无需媒体查询的响应式设计
3. 构建可维护、可读性强的布局代码
4. 为任何项目选择合适的布局解决方案
5. 将 Grid 与 Flexbox 结合以获得最佳效果

记住，Grid 和 Flexbox 不是互斥的选择，而是互补的工具。理解它们各自的优势并在适当的场景中使用，将带来优雅高效的 CSS 代码。

持续练习是掌握 CSS Grid 的最佳方式。从简单布局开始，逐步挑战更复杂的设计，很快你就能自信地运用这个强大的布局工具。

CSS Grid 的未来一片光明，Subgrid 现已可用，瀑布流布局也在计划中。今天投入时间学习 Grid，将在你的 Web 开发生涯中获得丰厚回报。
