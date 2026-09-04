---
title: CSS Flexbox 完全指南
description: 深入理解CSS Flexbox布局模型，掌握一维布局的核心概念和实战技巧
track: frontend
section: html-css
difficulty: beginner
tags:
  - CSS
  - Flexbox
  - 布局
  - 响应式
status: imported
origin: old/src/content/docs/frontend/css-flexbox.zh.md
divergence: 0.236
issues: []
legacy:
  category: Frontend
  subcategory: CSS
  order: 3
  lastUpdated: 2026-01-07
---

Flexbox（弹性盒子布局）是 CSS3 中最具革命性的布局模块之一。它彻底改变了我们处理网页布局的方式，让曾经需要复杂 hack 才能实现的布局变得简单直观。本文将从基础概念到实战应用，全面深入地讲解 Flexbox 的方方面面。

## Flexbox 基本概念

### 什么是 Flexbox？

Flexbox 是 Flexible Box Layout Module 的简称，是一种**一维布局模型**。所谓"一维"，意味着 Flexbox 一次只能处理一个方向上的布局——要么是水平方向（行），要么是垂直方向（列）。

在 Flexbox 出现之前，CSS 布局主要依赖以下几种方式：

- **浮动（Float）**：最初设计用于实现文字环绕图片的效果，后被广泛"滥用"于页面布局
- **定位（Position）**：适合精确控制单个元素，但难以实现复杂的响应式布局
- **表格布局（Table）**：语义不正确，灵活性差
- **行内块（Inline-block）**：存在空白间隙问题，垂直对齐困难

这些传统方法都有各自的局限性。Flexbox 的出现，让以下任务变得异常简单：

- 垂直居中一个元素（不再需要各种 hack）
- 让多个元素等分父容器的空间
- 让不同内容的元素具有相同的高度
- 改变元素的视觉顺序而不修改 HTML 结构

### 容器与项目

Flexbox 布局涉及两个核心角色：**Flex 容器（Flex Container）** 和 **Flex 项目（Flex Items）**。

```css
/* 将一个元素变成 Flex 容器 */
.container {
  display: flex;
  /* 或者 display: inline-flex; */
}
```

当一个元素设置 `display: flex` 或 `display: inline-flex` 后：

- 该元素成为 **Flex 容器**
- 它的**直接子元素**自动成为 **Flex 项目**
- 孙元素及更深层级的元素不会受到 Flex 布局的直接影响

```html
<div class="container">           <!-- Flex 容器 -->
  <div class="item">Item 1</div>  <!-- Flex 项目 -->
  <div class="item">Item 2</div>  <!-- Flex 项目 -->
  <div class="item">              <!-- Flex 项目 -->
    <span>孙元素</span>           <!-- 不是 Flex 项目 -->
  </div>
</div>
```

`display: flex` 和 `display: inline-flex` 的区别：

- `flex`：容器本身表现为块级元素，独占一行
- `inline-flex`：容器本身表现为行内元素，可以和其他行内元素同行显示

## 主轴与交叉轴

### 轴的概念

理解 Flexbox 的核心在于理解**主轴（Main Axis）** 和**交叉轴（Cross Axis）** 的概念。这两个轴构成了 Flex 布局的坐标系统。

```
flex-direction: row（默认值）

        main-start                            main-end
             ↓                                   ↓
cross-start→ ┌───────────────────────────────────┐
             │  ┌───────┐  ┌───────┐  ┌───────┐  │
             │  │ Item1 │  │ Item2 │  │ Item3 │  │ ← 主轴方向
             │  └───────┘  └───────┘  └───────┘  │
cross-end  → └───────────────────────────────────┘
                          ↑
                      交叉轴方向

flex-direction: column

             ↓ main-start
cross-start→ ┌───────────────────┐ ←cross-end
             │    ┌───────┐      │
             │    │ Item1 │      │
             │    └───────┘      │
             │    ┌───────┐      │   ↓
             │    │ Item2 │      │ 主轴方向
             │    └───────┘      │
             │    ┌───────┐      │
             │    │ Item3 │      │
             │    └───────┘      │
             └───────────────────┘
             ↑ main-end
```

### 轴的相关术语

- **主轴（Main Axis）**：Flex 项目排列的主要方向，由 `flex-direction` 决定
- **交叉轴（Cross Axis）**：与主轴垂直的方向
- **主轴起点/终点（main-start/main-end）**：主轴的开始和结束位置
- **交叉轴起点/终点（cross-start/cross-end）**：交叉轴的开始和结束位置
- **主轴尺寸（main size）**：Flex 项目在主轴方向上的尺寸
- **交叉轴尺寸（cross size）**：Flex 项目在交叉轴方向上的尺寸

记住这个关键点：**所有的对齐属性都是相对于这两个轴来工作的**。`justify-content` 控制主轴上的对齐，`align-items` 和 `align-content` 控制交叉轴上的对齐。

## 容器属性详解

Flex 容器上可以设置以下六个主要属性：

### flex-direction

`flex-direction` 属性决定了主轴的方向，也就是 Flex 项目的排列方向。

```css
.container {
  flex-direction: row;            /* 默认值：从左到右（LTR）或从右到左（RTL）*/
  flex-direction: row-reverse;    /* 与 row 相反 */
  flex-direction: column;         /* 从上到下 */
  flex-direction: column-reverse; /* 从下到上 */
}
```

**实际应用示例：**

```css
/* 创建一个从上到下排列的侧边栏导航 */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* 响应式设计：小屏幕垂直排列，大屏幕水平排列 */
.navigation {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .navigation {
    flex-direction: row;
  }
}
```

### flex-wrap

默认情况下，所有 Flex 项目都会尝试排列在一行（或一列）。`flex-wrap` 属性控制当容器空间不足时，项目是否换行。

```css
.container {
  flex-wrap: nowrap;       /* 默认值：不换行，项目可能会被压缩或溢出 */
  flex-wrap: wrap;         /* 换行，第一行在上方 */
  flex-wrap: wrap-reverse; /* 换行，第一行在下方 */
}
```

**可视化示意：**

```
flex-wrap: nowrap（默认）
┌──────────────────────────────┐
│ [1] [2] [3] [4] [5] [6]      │ ← 所有项目挤在一行
└──────────────────────────────┘

flex-wrap: wrap
┌──────────────────────────────┐
│ [1] [2] [3] [4]              │
│ [5] [6]                      │ ← 自动换行
└──────────────────────────────┘

flex-wrap: wrap-reverse
┌──────────────────────────────┐
│ [5] [6]                      │ ← 第一行在下方
│ [1] [2] [3] [4]              │
└──────────────────────────────┘
```

**flex-flow 简写属性：**

`flex-flow` 是 `flex-direction` 和 `flex-wrap` 的简写形式：

```css
.container {
  flex-flow: row wrap;           /* 水平方向，允许换行 */
  flex-flow: column nowrap;      /* 垂直方向，不换行 */
}
```

### justify-content

`justify-content` 定义 Flex 项目在**主轴**上的对齐方式，用于分配主轴上的剩余空间。

```css
.container {
  justify-content: flex-start;    /* 默认值：项目靠主轴起点对齐 */
  justify-content: flex-end;      /* 项目靠主轴终点对齐 */
  justify-content: center;        /* 项目在主轴上居中 */
  justify-content: space-between; /* 两端对齐，项目之间间隔相等 */
  justify-content: space-around;  /* 每个项目两侧的间隔相等 */
  justify-content: space-evenly;  /* 所有间隔完全相等 */
}
```

**可视化对比：**

```
justify-content: flex-start
|[1][2][3]                    |

justify-content: flex-end
|                    [1][2][3]|

justify-content: center
|          [1][2][3]          |

justify-content: space-between
|[1]         [2]         [3]|
 ↑ 首尾紧贴边缘，中间均分

justify-content: space-around
|  [1]      [2]      [3]  |
  ↑ 每个项目左右间隔相等（两个项目之间的间隔是边缘间隔的2倍）

justify-content: space-evenly
|   [1]    [2]    [3]   |
    ↑ 所有间隔完全相等
```

### align-items

`align-items` 定义 Flex 项目在**交叉轴**上的对齐方式。它作用于单行内的所有项目。

```css
.container {
  align-items: stretch;    /* 默认值：拉伸填满容器的交叉轴方向 */
  align-items: flex-start; /* 项目靠交叉轴起点对齐 */
  align-items: flex-end;   /* 项目靠交叉轴终点对齐 */
  align-items: center;     /* 项目在交叉轴上居中 */
  align-items: baseline;   /* 项目按照第一行文字的基线对齐 */
}
```

**可视化对比（假设 flex-direction: row）：**

```
align-items: stretch（默认）
┌─────────────────────┐
│ ┌───┐ ┌───┐ ┌───┐  │
│ │ 1 │ │ 2 │ │ 3 │  │ ← 所有项目高度相同
│ │   │ │   │ │   │  │
│ └───┘ └───┘ └───┘  │
└─────────────────────┘

align-items: flex-start
┌─────────────────────┐
│ ┌─┐ ┌──┐ ┌───┐     │ ← 顶部对齐
│ └─┘ └──┘ └───┘     │
│                     │
└─────────────────────┘

align-items: flex-end
┌─────────────────────┐
│                     │
│ ┌─┐ ┌──┐ ┌───┐     │ ← 底部对齐
│ └─┘ └──┘ └───┘     │
└─────────────────────┘

align-items: center
┌─────────────────────┐
│      ┌──┐           │
│ ┌─┐  │  │  ┌───┐   │ ← 垂直居中
│ └─┘  └──┘  └───┘   │
└─────────────────────┘

align-items: baseline
┌─────────────────────────┐
│ ┌───┐  ┌─────┐  ┌───┐  │
│ │ A │  │  B  │  │ C │  │ ← 文字基线对齐
│ └───┘  │     │  └───┘  │
│        └─────┘         │
└─────────────────────────┘
```

### align-content

`align-content` 定义**多行** Flex 项目在交叉轴上的对齐方式。**只有当 `flex-wrap: wrap` 且存在多行时才会生效**。

```css
.container {
  flex-wrap: wrap;  /* 必须允许换行 */
  align-content: stretch;       /* 默认值：拉伸占满整个交叉轴 */
  align-content: flex-start;    /* 多行靠交叉轴起点对齐 */
  align-content: flex-end;      /* 多行靠交叉轴终点对齐 */
  align-content: center;        /* 多行在交叉轴上居中 */
  align-content: space-between; /* 首尾行贴边，其余行均分间隔 */
  align-content: space-around;  /* 每行两侧间隔相等 */
  align-content: space-evenly;  /* 所有间隔完全相等 */
}
```

**align-items vs align-content 的区别：**

- `align-items`：控制**行内**项目的对齐
- `align-content`：控制**行与行之间**的对齐

### gap

`gap` 属性用于设置 Flex 项目之间的间距，是 `row-gap` 和 `column-gap` 的简写。

```css
.container {
  display: flex;
  gap: 20px;           /* 行间距和列间距都是 20px */
  gap: 20px 10px;      /* 行间距 20px，列间距 10px */
  row-gap: 20px;       /* 仅设置行间距 */
  column-gap: 10px;    /* 仅设置列间距 */
}
```

**使用 gap 的优势：**

```css
/* 传统方式：使用 margin（需要处理最后一个元素的边距）*/
.item {
  margin-right: 20px;
}
.item:last-child {
  margin-right: 0;
}

/* 现代方式：使用 gap（更简洁优雅）*/
.container {
  display: flex;
  gap: 20px;
}
```

## 项目属性详解

Flex 项目上可以设置以下六个主要属性：

### flex-grow

`flex-grow` 定义 Flex 项目的**放大比例**，决定当容器有剩余空间时，项目如何分配这些空间。

```css
.item {
  flex-grow: 0; /* 默认值：不放大 */
  flex-grow: 1; /* 可以放大，按比例分配剩余空间 */
  flex-grow: 2; /* 获得两倍的剩余空间份额 */
}
```

**计算公式：**

```
项目最终宽度 = 项目基础宽度 + (剩余空间 × (该项目 flex-grow / 所有项目 flex-grow 之和))
```

**实例演示：**

```css
/* 假设容器宽度 500px */
.container {
  display: flex;
  width: 500px;
}

/* 三个项目基础宽度各 100px，剩余空间 = 500 - 300 = 200px */
.item-1 { flex-grow: 1; }  /* 获得 200 × (1/4) = 50px，最终宽度 150px */
.item-2 { flex-grow: 2; }  /* 获得 200 × (2/4) = 100px，最终宽度 200px */
.item-3 { flex-grow: 1; }  /* 获得 200 × (1/4) = 50px，最终宽度 150px */
```

### flex-shrink

`flex-shrink` 定义 Flex 项目的**缩小比例**，决定当容器空间不足时，项目如何收缩。

```css
.item {
  flex-shrink: 1; /* 默认值：等比例缩小 */
  flex-shrink: 0; /* 不缩小（保持原始尺寸）*/
  flex-shrink: 2; /* 缩小比例是其他项目的两倍 */
}
```

**计算公式（比 flex-grow 复杂，因为要考虑基础尺寸）：**

```
收缩量 = 溢出空间 × (flex-shrink × flex-basis) / Σ(flex-shrink × flex-basis)
```

**实际应用：防止图片被压缩**

```css
.card {
  display: flex;
}

.card-image {
  flex-shrink: 0;  /* 图片不缩小 */
  width: 200px;
}

.card-content {
  flex-shrink: 1;  /* 内容可以缩小 */
}
```

### flex-basis

`flex-basis` 定义 Flex 项目在分配多余空间之前的**初始主轴尺寸**。

```css
.item {
  flex-basis: auto;  /* 默认值：使用项目本身的尺寸（width 或 height）*/
  flex-basis: 0;     /* 完全忽略项目内容，按 flex-grow 分配 */
  flex-basis: 200px; /* 固定初始宽度 */
  flex-basis: 30%;   /* 百分比（相对于容器主轴尺寸）*/
  flex-basis: content; /* 基于内容自动计算 */
}
```

**flex-basis vs width 的优先级：**

在 Flex 上下文中，`flex-basis` 的优先级高于 `width`（或 `height`，取决于主轴方向）。

```css
.item {
  width: 200px;       /* 在 Flex 上下文中会被忽略 */
  flex-basis: 300px;  /* 这个生效 */
}
```

### flex（简写属性）

`flex` 是 `flex-grow`、`flex-shrink` 和 `flex-basis` 的简写，**强烈推荐使用简写形式**。

```css
.item {
  flex: 0 1 auto;   /* 默认值：不放大，可缩小，基于内容尺寸 */
  flex: 1;          /* 等同于 flex: 1 1 0%（可放大可缩小，忽略内容尺寸）*/
  flex: auto;       /* 等同于 flex: 1 1 auto（可放大可缩小，基于内容）*/
  flex: none;       /* 等同于 flex: 0 0 auto（不放大不缩小）*/
  flex: 2 1 200px;  /* grow: 2, shrink: 1, basis: 200px */
}
```

**常用值解析：**

| 简写值 | 等价于 | 含义 |
|--------|--------|------|
| `flex: initial` | `flex: 0 1 auto` | 默认值，不放大但可缩小 |
| `flex: auto` | `flex: 1 1 auto` | 可放大可缩小，基于内容 |
| `flex: none` | `flex: 0 0 auto` | 完全不伸缩，保持原始尺寸 |
| `flex: 1` | `flex: 1 1 0%` | 等分剩余空间 |
| `flex: 2` | `flex: 2 1 0%` | 获得两倍份额 |

### order

`order` 属性定义 Flex 项目的**排列顺序**。数值越小，排列越靠前。

```css
.item {
  order: 0; /* 默认值 */
}

.item:nth-child(1) { order: 3; }  /* 原本第一个，现在排第三 */
.item:nth-child(2) { order: 1; }  /* 原本第二个，现在排第一 */
.item:nth-child(3) { order: 2; }  /* 原本第三个，现在排第二 */
```

**注意事项：**

- 只影响视觉顺序，不改变 DOM 结构
- 屏幕阅读器和键盘导航仍按 DOM 顺序
- 滥用可能造成可访问性问题

### align-self

`align-self` 允许单个 Flex 项目**覆盖**容器的 `align-items` 设置，实现独立的交叉轴对齐。

```css
.container {
  display: flex;
  align-items: flex-start;  /* 容器默认顶部对齐 */
}

.special-item {
  align-self: center;       /* 这个项目单独居中 */
}
```

```css
.item {
  align-self: auto;       /* 默认值：继承容器的 align-items */
  align-self: flex-start; /* 靠交叉轴起点 */
  align-self: flex-end;   /* 靠交叉轴终点 */
  align-self: center;     /* 交叉轴居中 */
  align-self: baseline;   /* 基线对齐 */
  align-self: stretch;    /* 拉伸填满 */
}
```

## 常见布局模式

### 完美居中

最经典的 Flexbox 应用场景：

```css
/* 水平垂直居中 */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

/* 只需两行核心代码 */
.center-box {
  display: flex;
  place-content: center;  /* justify-content + align-content 的简写 */
}
```

### 等分布局

```css
/* 三等分布局 */
.container {
  display: flex;
}

.item {
  flex: 1;  /* 每个项目等分空间 */
}

/* 不等分：1:2:1 布局 */
.sidebar { flex: 1; }
.main { flex: 2; }
.aside { flex: 1; }
```

### 圣杯布局（Holy Grail Layout）

经典的三栏布局，包含 Header、Footer、两个侧边栏和主内容区：

```html
<div class="holy-grail">
  <header class="header">Header</header>
  <div class="body">
    <nav class="sidebar">Sidebar</nav>
    <main class="main">Main Content</main>
    <aside class="aside">Aside</aside>
  </div>
  <footer class="footer">Footer</footer>
</div>
```

```css
.holy-grail {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header, .footer {
  background: #2c3e50;
  color: white;
  padding: 1rem 2rem;
}

.body {
  display: flex;
  flex: 1;
}

.sidebar {
  flex: 0 0 200px;  /* 固定宽度，不伸缩 */
  background: #34495e;
  color: white;
  padding: 1rem;
}

.main {
  flex: 1;  /* 占据剩余空间 */
  padding: 1rem;
}

.aside {
  flex: 0 0 150px;  /* 固定宽度，不伸缩 */
  background: #95a5a6;
  padding: 1rem;
}

/* 响应式：小屏幕变成单列 */
@media (max-width: 768px) {
  .body {
    flex-direction: column;
  }

  .sidebar, .aside {
    flex-basis: auto;
  }
}
```

### Sticky Footer

让 Footer 始终贴在页面底部（内容不足时也不会浮起来）：

```css
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin: 0;
}

main {
  flex: 1;  /* 主内容区占据所有可用空间 */
}

footer {
  /* Footer 自然贴在底部 */
  background: #2c3e50;
  color: white;
  padding: 2rem;
}
```

### 媒体对象布局

图片/头像 + 内容的经典模式：

```css
.media {
  display: flex;
  gap: 1rem;
}

.media-image {
  flex-shrink: 0;  /* 防止图片被压缩 */
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.media-body {
  flex: 1;
  min-width: 0;  /* 允许文本截断（很重要！）*/
}
```

## 与 Grid 的对比和选择

### 核心区别

| 特性 | Flexbox | CSS Grid |
|------|---------|----------|
| **布局维度** | 一维（行或列） | 二维（行和列同时） |
| **设计理念** | 内容优先 | 布局优先 |
| **对齐控制** | 主轴 + 交叉轴 | 行 + 列 |
| **项目定位** | 基于文档流顺序 | 可精确定位到任意位置 |
| **重叠能力** | 需要额外定位 | 原生支持 |
| **响应式** | 自然流动 | 需要更多配置 |

### 选择指南

**使用 Flexbox 的场景：**

- 一行或一列的排列（导航栏、按钮组）
- 内容驱动的布局（让内容决定尺寸）
- 简单的居中对齐
- 组件内部的小型布局

**使用 Grid 的场景：**

- 需要同时控制行和列的复杂布局
- 整体页面布局框架
- 需要元素重叠的设计
- 规则的网格系统

**最佳实践：结合使用**

```css
/* Grid 用于页面整体布局 */
.page {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

/* Flexbox 用于组件内部布局 */
.header {
  grid-area: header;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-list {
  display: flex;
  gap: 1.5rem;
}
```

## 实战案例

### 响应式导航栏

```html
<nav class="navbar">
  <div class="logo">MyBrand</div>
  <ul class="nav-links">
    <li><a href="#">首页</a></li>
    <li><a href="#">产品</a></li>
    <li><a href="#">关于</a></li>
    <li><a href="#">联系</a></li>
  </ul>
  <button class="cta-btn">立即注册</button>
</nav>
```

```css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links a {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: white;
}

.cta-btn {
  background: white;
  color: #667eea;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .navbar {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .nav-links {
    order: 3;
    flex-basis: 100%;
    justify-content: center;
    gap: 1rem;
  }
}
```

### 卡片布局

```html
<div class="card-grid">
  <article class="card">
    <div class="card-image">
      <img src="image.jpg" alt="Card Image">
    </div>
    <div class="card-content">
      <span class="card-tag">技术</span>
      <h3 class="card-title">CSS Flexbox 实战技巧</h3>
      <p class="card-desc">深入学习 Flexbox 布局的各种实用技巧和最佳实践...</p>
    </div>
    <div class="card-footer">
      <div class="author">
        <img src="avatar.jpg" alt="Author" class="author-avatar">
        <span class="author-name">张三</span>
      </div>
      <time class="card-date">2024-01-15</time>
    </div>
  </article>
  <!-- 更多卡片... -->
</div>
```

```css
.card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 2rem;
}

.card {
  flex: 1 1 320px;  /* 最小宽度 320px，可以放大缩小 */
  max-width: 400px;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.card-image {
  height: 200px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  flex: 1;  /* 关键：让内容区填满剩余空间 */
  padding: 1.5rem;
}

.card-tag {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.card-title {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  line-height: 1.4;
}

.card-desc {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.6;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.author-name {
  font-size: 0.875rem;
  font-weight: 500;
}

.card-date {
  font-size: 0.75rem;
  color: #999;
}
```

### 表单布局

```html
<form class="form">
  <div class="form-row">
    <div class="form-group">
      <label for="firstName">姓</label>
      <input type="text" id="firstName" placeholder="请输入姓">
    </div>
    <div class="form-group">
      <label for="lastName">名</label>
      <input type="text" id="lastName" placeholder="请输入名">
    </div>
  </div>

  <div class="form-group">
    <label for="email">邮箱地址</label>
    <input type="email" id="email" placeholder="example@domain.com">
  </div>

  <div class="form-group">
    <label for="message">留言内容</label>
    <textarea id="message" rows="4" placeholder="请输入您的留言..."></textarea>
  </div>

  <div class="form-actions">
    <button type="button" class="btn btn-secondary">取消</button>
    <button type="submit" class="btn btn-primary">提交</button>
  </div>
</form>
```

```css
.form {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 响应式：小屏幕姓名字段变成上下排列 */
@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
  }
}
```

## 面试要点

### 高频面试题

**Q1: Flexbox 的主轴和交叉轴是什么？**

A: 主轴是 Flex 项目排列的方向，由 `flex-direction` 决定。交叉轴是与主轴垂直的方向。默认情况下，主轴是水平的（从左到右），交叉轴是垂直的（从上到下）。

**Q2: 解释 flex: 1 的含义**

A: `flex: 1` 是 `flex: 1 1 0%` 的简写，意味着：
- `flex-grow: 1` - 可以放大，按比例分配剩余空间
- `flex-shrink: 1` - 可以缩小
- `flex-basis: 0%` - 初始大小为 0，完全依赖 flex-grow 分配空间

**Q3: justify-content 和 align-items 的区别？**

A: 两者都是对齐属性，区别在于作用的轴不同：
- `justify-content`：控制主轴方向的对齐
- `align-items`：控制交叉轴方向的对齐（单行）

**Q4: align-items 和 align-content 的区别？**

A:
- `align-items`：控制单行内项目在交叉轴的对齐，对每一行都生效
- `align-content`：控制多行之间在交叉轴的对齐，只在 `flex-wrap: wrap` 且存在多行时生效

**Q5: 如何让一个元素水平垂直居中？**

```css
.container {
  display: flex;
  justify-content: center;  /* 主轴居中 */
  align-items: center;      /* 交叉轴居中 */
}
```

**Q6: flex-shrink 的计算方式是什么？**

A: `flex-shrink` 的收缩计算比 `flex-grow` 复杂，因为要考虑项目的基础尺寸：

```
收缩量 = 溢出空间 × (flex-shrink × flex-basis) / Σ(flex-shrink × flex-basis)
```

基础尺寸越大、flex-shrink 值越大的项目，收缩得越多。

**Q7: 为什么设置了 flex-basis 后 width 不生效？**

A: 在 Flex 上下文中，`flex-basis` 的优先级高于 `width`（或 `height`，取决于主轴方向）。如果同时设置了两者，`flex-basis` 会覆盖 `width` 的效果。

**Q8: 如何防止 Flex 项目被压缩？**

```css
.item {
  flex-shrink: 0;  /* 禁止收缩 */
}
```

### 常见陷阱

**陷阱 1：min-width: auto 导致溢出**

Flex 项目默认 `min-width: auto`，意味着最小宽度是内容宽度，长文本可能导致溢出。

```css
/* 解决方案 */
.item {
  min-width: 0;  /* 允许收缩到 0 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**陷阱 2：图片在 Flex 容器中变形**

```css
/* 问题：图片可能被拉伸 */
.flex-container img {
  /* 可能变形 */
}

/* 解决方案 */
.flex-container img {
  flex-shrink: 0;
  object-fit: cover;
}
```

**陷阱 3：flex-basis: 0 vs flex-basis: auto**

- `flex-basis: 0`：忽略内容尺寸，完全按 flex-grow 比例分配
- `flex-basis: auto`：先考虑内容尺寸，再分配剩余空间

### 性能注意事项

1. 避免频繁改变 flex 属性触发重排
2. 大量 Flex 项目考虑虚拟滚动
3. 动画优先使用 transform 而非改变尺寸

## 延伸阅读

### 官方资源

- [MDN Flexbox 文档](https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_Flexible_Box_Layout) - 最权威的官方文档
- [CSS Flexible Box Layout Module Level 1](https://www.w3.org/TR/css-flexbox-1/) - W3C 规范

### 学习资源

- [CSS-Tricks: A Complete Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) - 经典的可视化指南
- [Flexbox Froggy](https://flexboxfroggy.com/) - 通过小游戏学习 Flexbox
- [Flexbox Defense](http://www.flexboxdefense.com/) - 塔防风格的 Flexbox 练习

### 调试工具

- **Chrome DevTools**：Elements 面板中显示 "flex" 标签，可查看布局可视化
- **Firefox DevTools**：提供最强大的 Flexbox 调试工具，可查看尺寸计算详情
- **Edge DevTools**：类似 Chrome，支持 Flex 布局可视化

### 相关技术

- **CSS Grid**：二维布局系统，与 Flexbox 互补
- **Container Queries**：基于容器尺寸的响应式设计
- **CSS Logical Properties**：国际化友好的布局属性（如 `margin-inline-start`）
- **Subgrid**：Grid 的扩展特性，允许子元素继承父网格

### 浏览器兼容性

Flexbox 在现代浏览器中已获得完美支持：

- Chrome 29+
- Firefox 28+
- Safari 9+
- Edge 12+
- IE 11（部分支持，存在较多 bug）

对于需要兼容 IE 11 的项目，需要注意：
- 避免使用 `flex-basis: auto` 的简写
- 显式设置 `flex-shrink`
- 避免 `min-height` 与 Flexbox 结合使用
- 使用 Autoprefixer 添加前缀

## 总结

Flexbox 是现代 CSS 布局的基石，掌握它可以解决绝大部分布局问题。核心要点回顾：

1. **理解轴的概念**：主轴和交叉轴是 Flexbox 的核心
2. **掌握容器属性**：`flex-direction`、`flex-wrap`、`justify-content`、`align-items`、`align-content`、`gap`
3. **掌握项目属性**：`flex-grow`、`flex-shrink`、`flex-basis`、`flex`、`order`、`align-self`
4. **善用简写**：优先使用 `flex` 简写属性
5. **注意陷阱**：`min-width: auto`、`flex-shrink` 计算、`flex-basis` 优先级
6. **与 Grid 配合**：一维布局用 Flexbox，二维布局用 Grid

Flexbox 的学习曲线相对平缓，但要精通需要大量实践。建议从简单的居中布局开始，逐步挑战更复杂的布局模式，最终能够自如地运用 Flexbox 解决各种布局问题。
