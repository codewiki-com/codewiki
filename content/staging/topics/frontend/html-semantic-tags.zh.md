---
title: HTML5 语义化标签
description: 深入理解HTML5语义化标签的使用方法、SEO优势和可访问性最佳实践
track: frontend
section: html-css
difficulty: beginner
tags:
  - HTML5
  - 语义化
  - SEO
  - 可访问性
status: imported
origin: old/src/content/docs/frontend/html-semantic-tags.zh.md
divergence: 0.29
issues: []
legacy:
  category: Frontend
  subcategory: HTML
  order: 1
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是语义化标签

语义化标签（Semantic Tags）是 HTML5 引入的一组具有明确含义的标签，它们不仅定义了内容的外观，更重要的是描述了内容的**意义和结构**。与传统的 `<div>` 和 `<span>` 等通用容器不同，语义化标签让浏览器、搜索引擎和辅助技术能够理解页面内容的层次结构和各部分的作用。

### 历史背景

在 HTML5 之前，开发者主要依赖 `<div>` 标签配合 class 或 id 来组织页面结构。这种做法导致了几个问题：

1. **代码可读性差**：满屏的 `<div class="header">` 和 `<div class="footer">` 缺乏表达力
2. **机器难以理解**：搜索引擎和屏幕阅读器无法准确识别页面各部分的作用
3. **开发者约定不统一**：不同项目对类名的命名各有差异

2014 年 HTML5 正式成为 W3C 推荐标准，引入了一系列语义化标签来解决这些问题。这些标签包括 `<header>`、`<nav>`、`<main>`、`<article>`、`<section>`、`<aside>`、`<footer>` 等。

### 解决什么问题

语义化标签主要解决以下核心问题：

- **提升代码可读性**：标签名称直接表达内容用途
- **增强可访问性**：辅助技术能够正确解读页面结构
- **优化 SEO**：搜索引擎能够更好地理解和索引内容
- **促进团队协作**：统一的语义标准减少沟通成本
- **面向未来**：为新技术和设备提供更好的兼容基础

## 核心原理

### 语义化的本质

语义化的本质是**让 HTML 回归描述内容结构的职责**。HTML 最初设计的目的就是标记文档的逻辑结构，而非控制样式（那是 CSS 的职责）。语义化标签让我们能够：

```
文档结构 = HTML 语义化标签
视觉表现 = CSS 样式
交互行为 = JavaScript
```

### 文档大纲算法（Document Outline）

HTML5 引入了文档大纲算法的概念。每个分节内容（Sectioning Content）都会在文档大纲中创建一个新的节点。主要的分节内容元素包括：

- `<article>` - 独立的内容单元
- `<section>` - 主题性的内容分组
- `<nav>` - 导航链接区域
- `<aside>` - 侧边内容

这些元素配合标题元素（`<h1>` - `<h6>`）共同构建出清晰的文档层次结构。

### 隐式 ARIA 角色

语义化标签内置了隐式的 ARIA（Accessible Rich Internet Applications）角色，这是它们能够提升可访问性的技术基础：

| HTML5 标签 | 隐式 ARIA 角色 |
|-----------|---------------|
| `<header>` | banner（当作为页面直接子元素时） |
| `<nav>` | navigation |
| `<main>` | main |
| `<article>` | article |
| `<section>` | region（当有可访问名称时） |
| `<aside>` | complementary |
| `<footer>` | contentinfo（当作为页面直接子元素时） |

这意味着当你使用 `<nav>` 标签时，屏幕阅读器会自动将其识别为导航区域，无需额外添加 `role="navigation"` 属性。

## 核心要点

### header - 页眉区域

`<header>` 元素代表一组介绍性或导航性的内容。它通常包含标题、Logo、搜索框或导航菜单等。

**关键特性**：

- 一个页面可以有多个 `<header>`，可用于页面整体，也可用于 `<article>` 或 `<section>` 内部
- 作为页面直接子元素时，具有 `banner` 的 ARIA 角色
- 不能嵌套在 `<footer>`、`<address>` 或另一个 `<header>` 中

```html
<!-- 页面级 header -->
<header>
  <img src="logo.png" alt="公司标志">
  <h1>网站名称</h1>
  <nav>
    <ul>
      <li><a href="/">首页</a></li>
      <li><a href="/about">关于</a></li>
    </ul>
  </nav>
</header>

<!-- 文章级 header -->
<article>
  <header>
    <h2>文章标题</h2>
    <p>作者：张三 | 发布时间：2024-01-15</p>
  </header>
  <p>文章内容...</p>
</article>
```

### nav - 导航区域

`<nav>` 元素用于包裹页面中**主要的导航链接区块**。它告诉浏览器和辅助技术这是一个导航区域。

**关键特性**：

- 只用于主要导航，不是所有链接组都需要 `<nav>`
- 页面可以有多个 `<nav>`（如主导航、面包屑、页脚导航等）
- 建议配合 `aria-label` 或 `aria-labelledby` 区分多个导航区域

```html
<!-- 主导航 -->
<nav aria-label="主导航">
  <ul>
    <li><a href="/">首页</a></li>
    <li><a href="/products">产品</a></li>
    <li><a href="/contact">联系我们</a></li>
  </ul>
</nav>

<!-- 面包屑导航 -->
<nav aria-label="面包屑">
  <ol>
    <li><a href="/">首页</a></li>
    <li><a href="/products">产品</a></li>
    <li aria-current="page">产品详情</li>
  </ol>
</nav>
```

### main - 主内容区域

`<main>` 元素包含文档的**核心内容**，即页面独特的主体部分，不包括页眉、页脚、导航、侧边栏等重复出现的内容。

**关键特性**：

- **每个页面只能有一个 `<main>` 元素**（除非其他 main 元素被 `hidden` 属性隐藏）
- 不能是 `<article>`、`<aside>`、`<footer>`、`<header>` 或 `<nav>` 的后代
- 跳转链接（Skip Link）的目标通常指向 `<main>`

```html
<body>
  <header>...</header>
  <nav>...</nav>

  <main id="main-content">
    <h1>页面主标题</h1>
    <article>
      <h2>文章标题</h2>
      <p>这是页面的核心内容区域...</p>
    </article>
  </main>

  <aside>...</aside>
  <footer>...</footer>
</body>
```

### article - 独立内容单元

`<article>` 元素表示文档中**独立的、可分发的内容单元**。判断标准：这段内容脱离当前页面后是否仍然有意义。

**关键特性**：

- 适用于博客文章、新闻报道、论坛帖子、用户评论、商品卡片等
- 应当包含标题元素（通常是 `<h2>` - `<h6>`）
- 可以嵌套使用（如文章内的评论也可以是 article）
- 建议包含发布时间（`<time datetime="...">`）

```html
<article>
  <header>
    <h2>深入理解 CSS Flexbox 布局</h2>
    <p>
      <time datetime="2024-01-15">2024年1月15日</time>
      <span>作者：李四</span>
    </p>
  </header>

  <p>Flexbox 是一种一维布局模型，特别适合组件级别的布局...</p>

  <section>
    <h3>基本概念</h3>
    <p>Flex 容器和 Flex 项目是两个核心概念...</p>
  </section>

  <footer>
    <p>标签：CSS, 布局, 前端</p>
  </footer>
</article>
```

### section - 主题分组

`<section>` 元素表示文档中**按主题分组的内容块**，通常有一个标题。它比 `<div>` 更有语义，但比 `<article>` 更通用。

**关键特性**：

- 必须有明确的主题，通常包含标题
- 不应仅用于样式或脚本目的（那应该用 `<div>`）
- 适用于章节、标签页内容、分步向导等

**section vs article vs div**：

| 元素 | 使用场景 |
|------|---------|
| `<article>` | 独立完整、可单独分发的内容 |
| `<section>` | 页面中的主题性分组，依赖上下文 |
| `<div>` | 纯粹的样式容器，无语义意义 |

```html
<article>
  <h1>JavaScript 完全指南</h1>

  <section>
    <h2>第一章：基础语法</h2>
    <p>JavaScript 是一门动态类型语言...</p>
  </section>

  <section>
    <h2>第二章：函数与作用域</h2>
    <p>函数是 JavaScript 中的一等公民...</p>
  </section>

  <section>
    <h2>第三章：异步编程</h2>
    <p>异步是 JavaScript 的核心特性之一...</p>
  </section>
</article>
```

### aside - 侧边内容

`<aside>` 元素表示与周围内容**间接相关的内容**，通常呈现为侧边栏、标注框或插入广告。

**关键特性**：

- 内容应与主内容相关但不是必要的
- 常见用途：侧边栏、相关链接、广告、引用、词汇表
- 移除后不影响主内容的理解

```html
<main>
  <article>
    <h1>React Hooks 深入解析</h1>
    <p>React Hooks 在 16.8 版本中引入，彻底改变了函数组件的编写方式...</p>

    <!-- 文章内的 aside：与文章相关的补充信息 -->
    <aside>
      <h3>什么是 React？</h3>
      <p>React 是 Facebook 开发的 JavaScript UI 库，用于构建用户界面。</p>
    </aside>

    <p>useState 是最常用的 Hook 之一...</p>
  </article>
</main>

<!-- 页面级 aside：侧边栏 -->
<aside>
  <h2>热门文章</h2>
  <ul>
    <li><a href="#">Vue 3 新特性一览</a></li>
    <li><a href="#">TypeScript 入门指南</a></li>
  </ul>

  <h2>关注我们</h2>
  <p>订阅获取最新技术文章</p>
</aside>
```

### footer - 页脚区域

`<footer>` 元素代表其最近的分节内容或分节根元素的**页脚**。通常包含版权信息、作者信息、相关链接等。

**关键特性**：

- 一个页面可以有多个 `<footer>`
- 作为页面直接子元素时具有 `contentinfo` 的 ARIA 角色
- 不能嵌套在 `<header>`、`<address>` 或另一个 `<footer>` 中

```html
<!-- 页面级 footer -->
<footer>
  <nav aria-label="页脚导航">
    <ul>
      <li><a href="/privacy">隐私政策</a></li>
      <li><a href="/terms">使用条款</a></li>
      <li><a href="/sitemap">网站地图</a></li>
    </ul>
  </nav>
  <p>&copy; 2024 公司名称. 保留所有权利。</p>
</footer>

<!-- 文章级 footer -->
<article>
  <header>
    <h2>文章标题</h2>
  </header>
  <p>文章内容...</p>
  <footer>
    <p>作者：王五</p>
    <p>最后更新：<time datetime="2024-01-15">2024年1月15日</time></p>
    <p>分类：<a href="/category/frontend">前端开发</a></p>
  </footer>
</article>
```

### 其他重要语义化标签

除了上述核心标签，HTML5 还提供了其他重要的语义化元素：

| 标签 | 用途 | 示例 |
|------|------|------|
| `<figure>` | 独立的图表、插图 | 图片+标题组合 |
| `<figcaption>` | figure 的标题 | 图片说明文字 |
| `<time>` | 日期/时间 | `<time datetime="2024-01-15">` |
| `<mark>` | 高亮/标记文本 | 搜索结果高亮 |
| `<address>` | 联系信息 | 作者/组织联系方式 |
| `<details>` | 可折叠的详情 | FAQ 问答 |
| `<summary>` | details 的标题 | 折叠区域标题 |

## 代码示例

### 完整页面结构示例

以下是一个使用语义化标签构建的完整博客页面示例：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="前端技术博客，分享 Web 开发最佳实践">
  <title>前端技术博客 - 首页</title>
</head>
<body>
  <!-- 跳转链接：提升可访问性 -->
  <a href="#main-content" class="skip-link">跳转到主内容</a>

  <!-- 页面头部 -->
  <header>
    <div class="logo">
      <img src="/images/logo.svg" alt="前端技术博客">
    </div>

    <!-- 主导航 -->
    <nav aria-label="主导航">
      <ul>
        <li><a href="/" aria-current="page">首页</a></li>
        <li><a href="/articles">文章</a></li>
        <li><a href="/tutorials">教程</a></li>
        <li><a href="/about">关于</a></li>
      </ul>
    </nav>

    <!-- 搜索功能 -->
    <search>
      <form action="/search" method="get">
        <label for="search-input" class="visually-hidden">搜索文章</label>
        <input type="search" id="search-input" name="q" placeholder="搜索...">
        <button type="submit">搜索</button>
      </form>
    </search>
  </header>

  <!-- 面包屑导航 -->
  <nav aria-label="面包屑">
    <ol class="breadcrumb">
      <li><a href="/">首页</a></li>
      <li><a href="/articles">文章</a></li>
      <li aria-current="page">当前文章</li>
    </ol>
  </nav>

  <!-- 主内容区域 -->
  <main id="main-content">
    <h1>前端技术精选文章</h1>

    <!-- 文章列表 -->
    <article>
      <header>
        <h2><a href="/articles/react-hooks">React Hooks 完全指南</a></h2>
        <p class="meta">
          <span class="author">作者：张三</span>
          <time datetime="2024-01-15">2024年1月15日</time>
          <span class="reading-time">阅读时间：15分钟</span>
        </p>
      </header>

      <figure>
        <img src="/images/react-hooks.jpg" alt="React Hooks 概念图">
        <figcaption>React Hooks 让函数组件拥有状态管理能力</figcaption>
      </figure>

      <p>React Hooks 是 React 16.8 引入的新特性，它让你在不编写 class 的情况下使用 state 以及其他的 React 特性。本文将深入探讨 useState、useEffect、useContext 等核心 Hooks 的原理和最佳实践。</p>

      <section aria-labelledby="hooks-overview">
        <h3 id="hooks-overview">Hooks 概览</h3>
        <p>Hooks 解决了什么问题？为什么我们需要 Hooks？让我们从 React 组件的演进历程说起...</p>

        <aside class="note">
          <strong>注意：</strong>Hooks 只能在函数组件的顶层调用，不能在循环、条件或嵌套函数中调用。
        </aside>
      </section>

      <section aria-labelledby="usestate-section">
        <h3 id="usestate-section">useState 详解</h3>
        <p>useState 是最基础的 Hook，用于在函数组件中添加本地状态...</p>

        <pre><code>
const [count, setCount] = useState(0);
        </code></pre>
      </section>

      <footer>
        <p>标签：
          <a href="/tags/react" rel="tag">React</a>,
          <a href="/tags/hooks" rel="tag">Hooks</a>,
          <a href="/tags/frontend" rel="tag">前端</a>
        </p>
        <p>
          <a href="/articles/react-hooks">继续阅读</a>
        </p>
      </footer>
    </article>

    <!-- 第二篇文章 -->
    <article>
      <header>
        <h2><a href="/articles/css-grid">CSS Grid 布局实战</a></h2>
        <p class="meta">
          <time datetime="2024-01-10">2024年1月10日</time>
        </p>
      </header>
      <p>CSS Grid 是二维布局系统，特别适合页面级别的布局设计...</p>
      <footer>
        <a href="/articles/css-grid">继续阅读</a>
      </footer>
    </article>

    <!-- 分页导航 -->
    <nav aria-label="文章分页">
      <ul class="pagination">
        <li><a href="/page/1" aria-current="page">1</a></li>
        <li><a href="/page/2">2</a></li>
        <li><a href="/page/3">3</a></li>
        <li><a href="/page/2" aria-label="下一页">下一页</a></li>
      </ul>
    </nav>
  </main>

  <!-- 侧边栏 -->
  <aside aria-label="侧边栏">
    <section>
      <h2>关于作者</h2>
      <p>资深前端工程师，专注于 React 和现代 Web 技术。</p>
    </section>

    <section>
      <h2>热门标签</h2>
      <ul class="tag-cloud">
        <li><a href="/tags/javascript">JavaScript</a></li>
        <li><a href="/tags/react">React</a></li>
        <li><a href="/tags/css">CSS</a></li>
        <li><a href="/tags/typescript">TypeScript</a></li>
      </ul>
    </section>

    <section>
      <h2>订阅更新</h2>
      <form action="/subscribe" method="post">
        <label for="email">邮箱地址：</label>
        <input type="email" id="email" name="email" required>
        <button type="submit">订阅</button>
      </form>
    </section>
  </aside>

  <!-- 页面底部 -->
  <footer>
    <nav aria-label="页脚导航">
      <section>
        <h3>快速链接</h3>
        <ul>
          <li><a href="/articles">所有文章</a></li>
          <li><a href="/tutorials">教程系列</a></li>
          <li><a href="/resources">资源推荐</a></li>
        </ul>
      </section>

      <section>
        <h3>关于</h3>
        <ul>
          <li><a href="/about">关于我们</a></li>
          <li><a href="/contact">联系方式</a></li>
          <li><a href="/privacy">隐私政策</a></li>
        </ul>
      </section>
    </nav>

    <address>
      联系我们：<a href="mailto:contact@example.com">contact@example.com</a>
    </address>

    <p>
      <small>&copy; 2024 前端技术博客. 保留所有权利。</small>
    </p>
  </footer>
</body>
</html>
```

### 电商产品页面示例

```html
<main>
  <article itemscope itemtype="https://schema.org/Product">
    <header>
      <nav aria-label="面包屑">
        <ol>
          <li><a href="/">首页</a></li>
          <li><a href="/electronics">电子产品</a></li>
          <li aria-current="page">无线耳机</li>
        </ol>
      </nav>
      <h1 itemprop="name">高保真无线蓝牙耳机</h1>
    </header>

    <figure>
      <img src="/products/headphone.jpg"
           alt="黑色无线蓝牙耳机正面图"
           itemprop="image">
      <figcaption>产品实拍图</figcaption>
    </figure>

    <section aria-labelledby="price-section">
      <h2 id="price-section" class="visually-hidden">价格信息</h2>
      <p itemprop="offers" itemscope itemtype="https://schema.org/Offer">
        <span class="price" itemprop="price" content="299">¥299</span>
        <span class="original-price"><del>¥499</del></span>
        <meta itemprop="priceCurrency" content="CNY">
      </p>
    </section>

    <section aria-labelledby="description-section">
      <h2 id="description-section">产品描述</h2>
      <p itemprop="description">采用最新蓝牙 5.3 技术，支持主动降噪，续航长达 40 小时...</p>
    </section>

    <section aria-labelledby="specs-section">
      <h2 id="specs-section">规格参数</h2>
      <dl>
        <dt>连接方式</dt>
        <dd>蓝牙 5.3</dd>
        <dt>续航时间</dt>
        <dd>40 小时</dd>
        <dt>充电接口</dt>
        <dd>USB-C</dd>
      </dl>
    </section>

    <section aria-labelledby="reviews-section">
      <h2 id="reviews-section">用户评价</h2>

      <article>
        <header>
          <strong>李先生</strong>
          <time datetime="2024-01-10">2024年1月10日</time>
        </header>
        <p>音质很棒，降噪效果明显，物超所值！</p>
        <footer>
          <data value="5">5 星好评</data>
        </footer>
      </article>

      <article>
        <header>
          <strong>王女士</strong>
          <time datetime="2024-01-08">2024年1月8日</time>
        </header>
        <p>佩戴舒适，适合长时间使用。</p>
        <footer>
          <data value="4">4 星好评</data>
        </footer>
      </article>
    </section>
  </article>

  <aside>
    <h2>相关推荐</h2>
    <ul>
      <li><a href="/products/earbuds">入耳式蓝牙耳机</a></li>
      <li><a href="/products/speaker">便携蓝牙音箱</a></li>
    </ul>
  </aside>
</main>
```

## 最佳实践

### 遵循内容优先原则

先考虑内容的**语义意义**，再选择合适的标签。问自己：

- 这块内容是什么？（标题、段落、列表、引用？）
- 它在页面中扮演什么角色？（导航、主体、补充？）
- 它是否独立完整？（article vs section）

### 保持标签的层次结构

```html
<!-- 推荐：清晰的层次结构 -->
<main>
  <article>
    <header>
      <h1>文章标题</h1>
    </header>
    <section>
      <h2>章节标题</h2>
    </section>
  </article>
</main>

<!-- 避免：扁平的结构 -->
<div class="main">
  <div class="article">
    <div class="header">
      <h1>文章标题</h1>
    </div>
  </div>
</div>
```

### 确保每个 section/article 有标题

分节内容应当有对应的标题元素，这对可访问性和 SEO 都很重要：

```html
<!-- 推荐 -->
<section aria-labelledby="faq-title">
  <h2 id="faq-title">常见问题</h2>
  <details>
    <summary>如何退货？</summary>
    <p>请在收货后 7 天内申请...</p>
  </details>
</section>

<!-- 如果确实没有可见标题，使用 aria-label -->
<section aria-label="用户评论列表">
  <!-- 评论内容 -->
</section>
```

### 正确使用标题层级

标题应当形成逻辑层次，不要跳级：

```html
<!-- 推荐 -->
<h1>页面主标题</h1>
  <h2>一级章节</h2>
    <h3>二级章节</h3>
  <h2>另一个一级章节</h2>

<!-- 避免：跳过层级 -->
<h1>页面主标题</h1>
  <h3>直接跳到 h3</h3>  <!-- 错误 -->
```

### 为多个同类导航添加标签

```html
<nav aria-label="主菜单">...</nav>
<nav aria-label="面包屑导航">...</nav>
<nav aria-label="页脚链接">...</nav>
```

### 配合微数据增强语义

结合 Schema.org 微数据可以让搜索引擎更好地理解内容：

```html
<article itemscope itemtype="https://schema.org/BlogPosting">
  <h1 itemprop="headline">文章标题</h1>
  <p itemprop="author" itemscope itemtype="https://schema.org/Person">
    作者：<span itemprop="name">张三</span>
  </p>
  <time itemprop="datePublished" datetime="2024-01-15">2024年1月15日</time>
  <div itemprop="articleBody">
    <p>文章内容...</p>
  </div>
</article>
```

## 常见陷阱

### 陷阱1：滥用语义化标签

**错误示范**：把所有 `<div>` 都换成语义化标签

```html
<!-- 错误：仅用于样式的容器不应使用语义化标签 -->
<section class="flex-container">
  <article class="card">
    <p>这只是一个卡片样式...</p>
  </article>
</section>

<!-- 正确：纯样式容器应使用 div -->
<div class="flex-container">
  <div class="card">
    <p>这只是一个卡片样式...</p>
  </div>
</div>
```

### 陷阱2：混淆 article 和 section

**判断标准**：内容能否独立存在？

```html
<!-- 这应该是 article：博客文章可以独立分发 -->
<article>
  <h2>如何学习编程</h2>
  <p>编程学习的关键在于实践...</p>
</article>

<!-- 这应该是 section：章节依赖于文章上下文 -->
<article>
  <h1>JavaScript 教程</h1>
  <section>
    <h2>第一章：变量</h2>
  </section>
  <section>
    <h2>第二章：函数</h2>
  </section>
</article>
```

### 陷阱3：在 main 中嵌套 main

```html
<!-- 错误：多个可见的 main 元素 -->
<main>
  <main>内容</main>  <!-- 错误！ -->
</main>

<!-- 正确：只能有一个 main（除非其他被 hidden） -->
<main>内容</main>
```

### 陷阱4：忽略 header/footer 的作用域

header 和 footer 不仅限于页面级别使用：

```html
<!-- 常见误解：只在页面级别使用 header/footer -->
<body>
  <header>页面头部</header>
  <main>
    <div class="article-header">文章头部</div>  <!-- 错误 -->
    <p>内容</p>
    <div class="article-footer">文章尾部</div>  <!-- 错误 -->
  </main>
  <footer>页面底部</footer>
</body>

<!-- 正确：在 article/section 内部使用 header/footer -->
<article>
  <header>
    <h2>文章标题</h2>
    <p>作者信息</p>
  </header>
  <p>内容</p>
  <footer>
    <p>发布日期、标签等</p>
  </footer>
</article>
```

### 陷阱5：将 nav 用于所有链接

```html
<!-- 错误：普通链接列表不需要 nav -->
<nav>
  <h2>相关文章</h2>
  <ul>
    <li><a href="#">文章1</a></li>
    <li><a href="#">文章2</a></li>
  </ul>
</nav>

<!-- 正确：只有主要导航才用 nav -->
<aside>
  <h2>相关文章</h2>
  <ul>
    <li><a href="#">文章1</a></li>
    <li><a href="#">文章2</a></li>
  </ul>
</aside>
```

### 陷阱6：冗余的 ARIA 角色

语义化标签已经有隐式 ARIA 角色，不需要重复声明：

```html
<!-- 冗余：nav 已经有 navigation 角色 -->
<nav role="navigation">...</nav>

<!-- 正确：直接使用语义化标签 -->
<nav>...</nav>
```

## SEO 与可访问性

### 对 SEO 的影响

语义化标签对搜索引擎优化有显著作用：

**1. 内容层次识别**

搜索引擎使用语义化标签理解页面结构：
- `<main>` 帮助识别核心内容
- `<article>` 标识独立可索引的内容单元
- `<nav>` 区分导航与正文内容

**2. 富媒体摘要（Rich Snippets）**

正确使用语义化标签配合结构化数据，可以在搜索结果中显示增强信息：

```html
<article itemscope itemtype="https://schema.org/Article">
  <header>
    <h1 itemprop="headline">文章标题</h1>
    <time itemprop="datePublished" datetime="2024-01-15">
      2024年1月15日
    </time>
  </header>
  <div itemprop="articleBody">...</div>
</article>
```

**3. 抓取效率**

清晰的语义结构帮助搜索引擎爬虫更高效地理解和索引页面内容。

### 对可访问性的影响

语义化标签是构建可访问网站的基础：

**1. 屏幕阅读器导航**

屏幕阅读器用户可以通过语义化地标快速导航：
- 按 `D` 键跳转到下一个地标（landmark）
- 直接跳转到 `<main>` 内容
- 列出所有 `<nav>` 区域供选择

**2. 跳转链接（Skip Links）**

```html
<body>
  <a href="#main-content" class="skip-link">跳转到主内容</a>
  <header>...</header>
  <nav>...</nav>
  <main id="main-content">
    <!-- 用户可以跳过导航直接到这里 -->
  </main>
</body>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}
.skip-link:focus {
  top: 0;
}
</style>
```

**3. 键盘导航优化**

语义化的交互元素（如 `<button>`、`<a>`）原生支持键盘操作：

```html
<!-- 推荐：使用语义化元素 -->
<button onclick="toggleMenu()">菜单</button>

<!-- 避免：div 模拟按钮需要额外工作 -->
<div role="button" tabindex="0" onclick="toggleMenu()" onkeydown="handleKey(event)">
  菜单
</div>
```

**4. ARIA 地标角色映射**

| 语义化标签 | ARIA 地标角色 | 屏幕阅读器朗读 |
|-----------|--------------|---------------|
| `<header>` (页面级) | banner | "横幅" |
| `<nav>` | navigation | "导航" |
| `<main>` | main | "主要" |
| `<aside>` | complementary | "补充" |
| `<footer>` (页面级) | contentinfo | "内容信息" |

### 可访问性检查清单

- [ ] 页面有且只有一个 `<main>` 元素
- [ ] 所有图片都有描述性的 `alt` 属性
- [ ] 标题层级逻辑正确，无跳级
- [ ] 每个表单输入都有对应的 `<label>`
- [ ] 多个 `<nav>` 使用 `aria-label` 区分
- [ ] 交互元素可通过键盘访问
- [ ] 颜色对比度符合 WCAG 标准
- [ ] 提供跳转链接跳过重复内容

## 面试要点

### 基础题

**Q1：什么是 HTML5 语义化？为什么要使用语义化标签？**

答：语义化是指使用具有明确含义的 HTML 标签来描述内容的结构和意义，而不仅仅是定义外观。使用语义化标签的好处包括：
1. 提升代码可读性和可维护性
2. 改善 SEO，帮助搜索引擎理解内容
3. 增强可访问性，便于辅助技术解读
4. 促进团队协作，统一代码规范

**Q2：列举 5 个 HTML5 新增的语义化标签并说明用途**

答：
- `<header>`：页眉区域，包含介绍性内容或导航
- `<nav>`：导航链接区域
- `<main>`：页面主要内容，每个页面只能有一个
- `<article>`：独立的内容单元，如博客文章
- `<section>`：主题性的内容分组
- `<aside>`：与主内容间接相关的侧边内容
- `<footer>`：页脚区域，包含版权等信息

### 进阶题

**Q3：article 和 section 有什么区别？如何选择？**

答：
- `<article>` 用于独立完整的内容，可以脱离上下文单独分发（如 RSS）
- `<section>` 用于按主题分组的内容，依赖于文档上下文
- 选择标准：问自己"这段内容能否独立存在并有意义"，如果能，用 article；如果是文档的一个章节，用 section

**Q4：header 和 footer 只能用于页面级别吗？**

答：不是。header 和 footer 可以用于任何分节内容（`<article>`、`<section>` 等）内部。例如，文章的标题和元信息可以放在文章的 header 中，文章的标签和版权信息可以放在文章的 footer 中。

**Q5：语义化标签如何影响 SEO？**

答：
1. 搜索引擎通过语义化标签识别内容结构和重要性
2. `<main>` 帮助识别核心内容区域
3. `<article>` 标识可独立索引的内容单元
4. 配合 Schema.org 微数据可以获得富媒体摘要展示
5. 清晰的结构提高爬虫抓取效率

### 实战题

**Q6：如果让你重构一个使用大量 div 的老页面，你会怎么做？**

答：
1. 首先分析页面结构，识别各个区块的功能
2. 确定页面头部、导航、主内容、侧边栏、页脚
3. 识别独立的内容单元（article）和主题分组（section）
4. 逐步替换 div 为对应的语义化标签
5. 检查标题层级是否正确
6. 为多个同类元素添加 aria-label 区分
7. 使用可访问性检测工具验证
8. 确保不破坏现有样式（必要时调整 CSS 选择器）

**Q7：如何检测页面语义化是否正确？**

答：
1. 使用浏览器开发者工具的 Accessibility 面板查看地标
2. 使用 Lighthouse 进行可访问性审计
3. 使用屏幕阅读器（如 NVDA、VoiceOver）实际测试
4. 使用 W3C 验证器检查 HTML 有效性
5. 使用 axe、WAVE 等可访问性检测工具
6. 禁用 CSS 后查看页面结构是否仍然清晰

## 延伸阅读

### 官方文档

- [MDN - HTML 元素参考](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element)
- [W3C HTML5 规范](https://html.spec.whatwg.org/)
- [WAI-ARIA 规范](https://www.w3.org/TR/wai-aria-1.2/)
- [WCAG 2.1 指南](https://www.w3.org/TR/WCAG21/)

### 推荐书籍

- 《HTML5 权威指南》 - Adam Freeman
- 《无障碍 Web 设计》 - Shawn Lawton Henry
- 《响应式 Web 设计：HTML5 和 CSS3 实战》

### 优质文章

- [HTML5 Doctor - 语义化标签使用指南](http://html5doctor.com/)
- [A List Apart - 语义化 HTML](https://alistapart.com/article/semanticsinhtml5/)
- [Web.dev - 可访问性基础](https://web.dev/accessibility/)

### 实用工具

- [W3C HTML 验证器](https://validator.w3.org/)
- [axe DevTools - 可访问性检测](https://www.deque.com/axe/)
- [WAVE - Web 可访问性评估工具](https://wave.webaim.org/)
- [Lighthouse - 性能与可访问性审计](https://developers.google.com/web/tools/lighthouse)
- [Schema.org - 结构化数据标记](https://schema.org/)

---

> 语义化不仅仅是技术规范，更是一种以用户为中心的开发理念。编写语义化的 HTML，就是在为所有用户——包括使用辅助技术的用户——构建更加包容的 Web。
