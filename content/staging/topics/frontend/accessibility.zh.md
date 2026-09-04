---
title: Web 无障碍开发指南
description: 掌握Web无障碍(A11y)开发，构建人人可用的包容性网站
track: frontend
section: accessibility
difficulty: intermediate
tags:
  - 无障碍
  - A11y
  - ARIA
  - 可访问性
status: imported
origin: old/src/content/docs/frontend/accessibility.zh.md
divergence: 0.215
issues: []
legacy:
  category: Frontend
  subcategory: Best Practices
  order: 21
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 Web 无障碍

Web 无障碍（Web Accessibility，常缩写为 A11y，其中 11 代表 accessibility 中间的 11 个字母）是指让网站和 Web 应用程序对所有人都可用，包括那些有视觉、听觉、运动或认知障碍的用户。无障碍开发的核心理念是**包容性设计**——确保每个人都能平等地访问和使用网络资源。

### 为什么无障碍开发至关重要

无障碍开发的重要性体现在多个层面：

**1. 用户群体庞大**

根据世界卫生组织（WHO）的数据，全球约有 15% 的人口（超过 10 亿人）存在某种形式的残障。在中国，残障人士数量超过 8500 万。忽视无障碍意味着排斥了相当数量的潜在用户。

**2. 法律合规要求**

许多国家和地区已经出台了无障碍相关法规：

- 美国《美国残疾人法案》（ADA）和《康复法案》第 508 条
- 欧盟《Web 无障碍指令》
- 中国《无障碍环境建设法》（2023年9月1日起施行）
- 中国《信息技术 互联网内容无障碍可访问性技术要求与测试方法》（GB/T 37668-2019）

不符合无障碍标准可能面临法律诉讼和经济处罚。

**3. 商业价值**

- 扩大用户群体，提升市场覆盖率
- 改善 SEO 排名（搜索引擎与屏幕阅读器解析方式相似）
- 提升品牌形象，体现企业社会责任
- 增强用户体验，无障碍优化往往惠及所有用户

**4. 技术质量指标**

无障碍友好的代码通常也是高质量的代码——语义清晰、结构合理、易于维护。

### 常见的障碍类型

| 障碍类型 | 描述 | 常用辅助技术 |
|---------|------|-------------|
| 视觉障碍 | 全盲、低视力、色盲 | 屏幕阅读器、放大镜、高对比度模式 |
| 听觉障碍 | 聋或重听 | 字幕、手语视频、视觉提示 |
| 运动障碍 | 无法使用鼠标、精细动作困难 | 键盘导航、语音控制、眼动追踪 |
| 认知障碍 | 阅读困难、注意力障碍、记忆问题 | 简化界面、一致的导航、清晰的语言 |

## WCAG 标准与合规级别

### WCAG 概述

WCAG（Web Content Accessibility Guidelines）是由 W3C 制定的 Web 无障碍指南，是目前国际上最权威的无障碍标准。当前主流版本为 WCAG 2.1（2018年发布），WCAG 2.2 于 2023 年正式成为 W3C 推荐标准。

### 四大核心原则（POUR）

WCAG 基于四个核心原则构建：

```
可感知（Perceivable）   - 信息必须以用户可感知的方式呈现
可操作（Operable）      - 界面组件和导航必须可操作
可理解（Understandable）- 信息和操作必须可理解
健壮性（Robust）        - 内容必须足够健壮，可被各种用户代理可靠解析
```

### 三个合规级别

WCAG 定义了三个合规级别，要求依次递进：

**Level A（最低级别）**
- 必须满足的基本要求
- 不满足将导致某些用户完全无法使用网站
- 例如：为图片提供替代文本、确保键盘可访问

**Level AA（中等级别）**
- 解决最常见的无障碍问题
- 大多数法律法规要求达到此级别
- 例如：颜色对比度 4.5:1、可调整文本大小

**Level AA（最高级别）**
- 最高级别的无障碍支持
- 提供增强的辅助功能
- 例如：手语翻译、扩展音频描述

### 关键成功标准示例

```javascript
// WCAG 2.1 部分关键成功标准
const wcagCriteria = {
  'A': [
    '1.1.1 非文本内容 - 提供替代文本',
    '1.3.1 信息和关系 - 通过代码传达结构',
    '2.1.1 键盘 - 所有功能可通过键盘操作',
    '2.4.1 跳过区块 - 提供跳过重复内容的机制',
    '4.1.1 解析 - 避免重大HTML错误',
    '4.1.2 名称、角色、值 - UI组件正确标识'
  ],
  'AA': [
    '1.4.3 对比度(最低) - 文本对比度至少4.5:1',
    '1.4.4 调整文本大小 - 文本可放大200%不丢失功能',
    '2.4.6 标题和标签 - 描述性的标题和标签',
    '2.4.7 焦点可见 - 键盘焦点必须可见',
    '3.2.3 一致的导航 - 导航机制保持一致'
  ],
  'AAA': [
    '1.4.6 对比度(增强) - 文本对比度至少7:1',
    '2.2.3 无时间限制 - 时间不是必要条件',
    '2.4.9 链接目的 - 仅从链接文本可理解目的'
  ]
};
```

## 语义化 HTML 与 ARIA

### 语义化 HTML 是无障碍的基础

语义化 HTML 是实现无障碍的第一步，也是最重要的一步。正确使用原生 HTML 元素可以获得浏览器内置的无障碍支持：

```html
<!-- 错误示例：使用非语义化元素 -->
<div class="button" onclick="submit()">提交</div>
<div class="heading">页面标题</div>
<div class="input" contenteditable="true"></div>

<!-- 正确示例：使用语义化元素 -->
<button type="submit">提交</button>
<h1>页面标题</h1>
<input type="text" aria-label="搜索" />
```

### 原生 HTML 元素的内置无障碍特性

| 元素 | 内置特性 |
|-----|---------|
| `<button>` | 可聚焦、可通过 Enter/Space 激活、有按钮角色 |
| `<a href>` | 可聚焦、可通过 Enter 激活、有链接角色 |
| `<input>` | 可聚焦、关联标签、表单验证 |
| `<select>` | 键盘导航、可聚焦、列表框角色 |
| `<h1>-<h6>` | 标题角色、形成文档大纲 |
| `<nav>` | 导航地标角色 |
| `<main>` | 主内容地标角色 |

### ARIA 属性详解

ARIA（Accessible Rich Internet Applications）是一套属性，用于增强 HTML 元素的无障碍语义。**重要原则：优先使用原生 HTML，只在必要时使用 ARIA**。

#### ARIA 角色（Roles）

```html
<!-- 地标角色 - 帮助用户快速导航 -->
<div role="banner">页面头部</div>
<div role="navigation">导航菜单</div>
<div role="main">主要内容</div>
<div role="complementary">侧边栏</div>
<div role="contentinfo">页脚</div>

<!-- Widget 角色 - 用于交互组件 -->
<div role="tablist">
  <button role="tab" aria-selected="true">标签1</button>
  <button role="tab" aria-selected="false">标签2</button>
</div>
<div role="tabpanel">标签面板内容</div>

<!-- 实时区域角色 - 动态内容通知 -->
<div role="alert">错误：请填写必填字段</div>
<div role="status">已保存</div>
<div role="log">聊天记录区域</div>
```

#### ARIA 属性（Properties）

```html
<!-- aria-label: 为元素提供可访问名称 -->
<button aria-label="关闭对话框">
  <svg><!-- 关闭图标 --></svg>
</button>

<!-- aria-labelledby: 引用其他元素作为标签 -->
<h2 id="section-title">用户设置</h2>
<section aria-labelledby="section-title">
  <!-- 设置内容 -->
</section>

<!-- aria-describedby: 提供额外描述 -->
<input
  type="password"
  aria-describedby="password-hint"
/>
<p id="password-hint">密码必须包含至少8个字符</p>

<!-- aria-required: 标记必填字段 -->
<input type="email" aria-required="true" />

<!-- aria-invalid: 标记验证状态 -->
<input type="email" aria-invalid="true" aria-errormessage="email-error" />
<span id="email-error">请输入有效的邮箱地址</span>
```

#### ARIA 状态（States）

```html
<!-- aria-expanded: 展开/收起状态 -->
<button aria-expanded="false" aria-controls="menu">
  菜单
</button>
<ul id="menu" hidden>
  <li>选项1</li>
  <li>选项2</li>
</ul>

<!-- aria-pressed: 按钮按下状态（切换按钮） -->
<button aria-pressed="true">
  静音
</button>

<!-- aria-hidden: 对辅助技术隐藏 -->
<span aria-hidden="true">装饰性图标</span>

<!-- aria-disabled: 禁用状态 -->
<button aria-disabled="true">
  提交中...
</button>

<!-- aria-current: 当前项标识 -->
<nav>
  <a href="/" aria-current="page">首页</a>
  <a href="/about">关于</a>
</nav>
```

### ARIA 实时区域

实时区域用于通知屏幕阅读器动态内容的变化：

```html
<!-- aria-live: 设置通知的紧急程度 -->
<div aria-live="polite">
  <!-- 内容变化时，等待用户空闲再通知 -->
  文件上传进度：45%
</div>

<div aria-live="assertive">
  <!-- 内容变化时，立即打断用户通知 -->
  会话即将过期！
</div>

<!-- 预设的实时区域角色 -->
<div role="alert">
  <!-- 相当于 aria-live="assertive" -->
  登录失败，请检查密码
</div>

<div role="status">
  <!-- 相当于 aria-live="polite" -->
  3 条新消息
</div>
```

### 完整的 ARIA 组件示例

```html
<!-- 可访问的 Modal 对话框 -->
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
>
  <h2 id="dialog-title">确认删除</h2>
  <p id="dialog-desc">
    您确定要删除这个项目吗？此操作无法撤销。
  </p>
  <div>
    <button>取消</button>
    <button>确认删除</button>
  </div>
</div>

<!-- 可访问的手风琴组件 -->
<div class="accordion">
  <h3>
    <button
      aria-expanded="true"
      aria-controls="panel1"
      id="accordion1"
    >
      第一部分
    </button>
  </h3>
  <div
    id="panel1"
    role="region"
    aria-labelledby="accordion1"
  >
    <p>第一部分的内容...</p>
  </div>

  <h3>
    <button
      aria-expanded="false"
      aria-controls="panel2"
      id="accordion2"
    >
      第二部分
    </button>
  </h3>
  <div
    id="panel2"
    role="region"
    aria-labelledby="accordion2"
    hidden
  >
    <p>第二部分的内容...</p>
  </div>
</div>
```

## 键盘导航支持

### 键盘可访问性原则

键盘可访问性是无障碍的核心要求之一。许多用户无法使用鼠标，完全依赖键盘操作。

**基本要求：**
1. 所有可交互元素必须可通过键盘访问
2. 焦点顺序必须逻辑合理
3. 焦点必须可见
4. 不能产生键盘陷阱

### 焦点管理

```javascript
// 管理焦点的核心方法

// 1. 使元素可聚焦
element.tabIndex = 0;  // 添加到 Tab 序列
element.tabIndex = -1; // 可编程聚焦，但不在 Tab 序列中

// 2. 设置焦点
element.focus();

// 3. 获取当前焦点元素
const currentFocus = document.activeElement;

// 4. 焦点陷阱示例（用于模态框）
class FocusTrap {
  constructor(container) {
    this.container = container;
    this.focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
  }

  activate() {
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.firstFocusable.focus();
  }

  handleKeyDown(e) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable.focus();
      }
    }
  }

  deactivate() {
    this.container.removeEventListener('keydown', this.handleKeyDown);
  }
}
```

### 键盘快捷键

```javascript
// 标准键盘交互模式

// 按钮：Enter 或 Space 激活
button.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    button.click();
  }
});

// 链接：仅 Enter 激活
link.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    // 链接默认行为
  }
});

// 下拉菜单导航
dropdown.addEventListener('keydown', (e) => {
  const items = dropdown.querySelectorAll('[role="menuitem"]');
  const currentIndex = Array.from(items).indexOf(document.activeElement);

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex].focus();
      break;
    case 'ArrowUp':
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      items[prevIndex].focus();
      break;
    case 'Escape':
      dropdown.close();
      break;
    case 'Home':
      e.preventDefault();
      items[0].focus();
      break;
    case 'End':
      e.preventDefault();
      items[items.length - 1].focus();
      break;
  }
});
```

### 跳过链接（Skip Links）

```html
<!-- 跳过链接帮助键盘用户快速到达主内容 -->
<body>
  <a href="#main-content" class="skip-link">
    跳转到主要内容
  </a>

  <header>
    <nav>
      <!-- 大量导航链接 -->
    </nav>
  </header>

  <main id="main-content" tabindex="-1">
    <!-- 主要内容 -->
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
  transition: top 0.3s;
}

.skip-link:focus {
  top: 0;
}
</style>
```

### 焦点指示器样式

```css
/* 默认的焦点样式 - 不要简单移除！ */
/* 错误做法 */
*:focus {
  outline: none; /* 这会导致严重的无障碍问题 */
}

/* 正确做法：自定义焦点样式 */
:focus {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}

/* 使用 :focus-visible 区分键盘和鼠标焦点 */
:focus:not(:focus-visible) {
  outline: none;
}

:focus-visible {
  outline: 3px solid #005fcc;
  outline-offset: 2px;
}

/* 按钮焦点样式 */
button:focus-visible {
  outline: 3px solid #005fcc;
  box-shadow: 0 0 0 6px rgba(0, 95, 204, 0.3);
}

/* 输入框焦点样式 */
input:focus-visible,
textarea:focus-visible {
  border-color: #005fcc;
  box-shadow: 0 0 0 3px rgba(0, 95, 204, 0.3);
}
```

## 屏幕阅读器兼容

### 主流屏幕阅读器

| 屏幕阅读器 | 平台 | 浏览器 |
|-----------|------|-------|
| NVDA | Windows | Firefox（推荐）/ Chrome |
| JAWS | Windows | Chrome / Edge |
| VoiceOver | macOS / iOS | Safari |
| TalkBack | Android | Chrome |
| Narrator | Windows | Edge |

### 为屏幕阅读器优化内容

```html
<!-- 1. 为图片提供有意义的替代文本 -->
<!-- 信息性图片 -->
<img src="chart.png" alt="2023年销售数据：Q1增长15%，Q2增长23%">

<!-- 装饰性图片 -->
<img src="decorative-line.png" alt="" role="presentation">

<!-- 复杂图片 -->
<figure>
  <img src="complex-chart.png" alt="季度销售趋势" aria-describedby="chart-desc">
  <figcaption id="chart-desc">
    此图表显示了2023年四个季度的销售趋势...
  </figcaption>
</figure>

<!-- 2. 正确使用标题层级 -->
<h1>网站名称</h1>
  <h2>主要章节</h2>
    <h3>子章节</h3>
    <h3>子章节</h3>
  <h2>另一个主要章节</h2>

<!-- 3. 使用地标区域 -->
<header role="banner">...</header>
<nav role="navigation" aria-label="主导航">...</nav>
<main role="main">...</main>
<aside role="complementary">...</aside>
<footer role="contentinfo">...</footer>

<!-- 4. 列表结构 -->
<nav aria-label="面包屑导航">
  <ol>
    <li><a href="/">首页</a></li>
    <li><a href="/products">产品</a></li>
    <li aria-current="page">手机</li>
  </ol>
</nav>

<!-- 5. 表格可访问性 -->
<table>
  <caption>2023年销售数据</caption>
  <thead>
    <tr>
      <th scope="col">产品</th>
      <th scope="col">Q1</th>
      <th scope="col">Q2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">手机</th>
      <td>100</td>
      <td>150</td>
    </tr>
  </tbody>
</table>
```

### 仅对屏幕阅读器可见的内容

```css
/* 视觉隐藏但屏幕阅读器可读 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 可聚焦时显示（用于跳过链接） */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

```html
<!-- 使用示例 -->
<button>
  <svg aria-hidden="true">...</svg>
  <span class="sr-only">关闭菜单</span>
</button>

<a href="/cart">
  购物车
  <span class="sr-only">（包含 3 件商品）</span>
</a>
```

### 动态内容更新通知

```javascript
// 使用 aria-live 区域通知更新
const announcer = document.createElement('div');
announcer.setAttribute('aria-live', 'polite');
announcer.setAttribute('aria-atomic', 'true');
announcer.classList.add('sr-only');
document.body.appendChild(announcer);

function announce(message) {
  announcer.textContent = '';
  // 短暂延迟确保屏幕阅读器能够检测到变化
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
}

// 使用示例
addToCart(item) {
  // ... 添加到购物车逻辑
  announce(`${item.name} 已添加到购物车`);
}

formSubmit() {
  // ... 表单提交逻辑
  announce('表单提交成功');
}
```

## 颜色对比度与视觉设计

### 对比度要求

WCAG 2.1 对颜色对比度有明确要求：

| 文本类型 | AA 级别 | AAA 级别 |
|---------|--------|---------|
| 正常文本（<18pt）| 4.5:1 | 7:1 |
| 大文本（>=18pt 或 14pt 粗体）| 3:1 | 4.5:1 |
| UI 组件和图形 | 3:1 | - |

### 计算对比度

```javascript
// 计算相对亮度
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// 计算对比度
function getContrastRatio(color1, color2) {
  const l1 = getLuminance(...color1);
  const l2 = getLuminance(...color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// 检查是否符合 WCAG 标准
function checkContrast(foreground, background, level = 'AA', isLargeText = false) {
  const ratio = getContrastRatio(foreground, background);

  const requirements = {
    'AA': isLargeText ? 3 : 4.5,
    'AAA': isLargeText ? 4.5 : 7
  };

  return {
    ratio: ratio.toFixed(2),
    passes: ratio >= requirements[level],
    required: requirements[level]
  };
}

// 使用示例
const white = [255, 255, 255];
const darkBlue = [0, 51, 102];
console.log(checkContrast(white, darkBlue));
// { ratio: "11.59", passes: true, required: 4.5 }
```

### 颜色不能作为唯一信息载体

```html
<!-- 错误：仅用颜色区分状态 -->
<span style="color: green">成功</span>
<span style="color: red">失败</span>

<!-- 正确：颜色 + 图标/文本 -->
<span style="color: green">
  <svg aria-hidden="true"><!-- 勾选图标 --></svg>
  成功
</span>
<span style="color: red">
  <svg aria-hidden="true"><!-- 叉号图标 --></svg>
  失败
</span>

<!-- 表单错误提示 -->
<!-- 错误：仅红色边框 -->
<input style="border-color: red" />

<!-- 正确：红色边框 + 错误图标 + 文本提示 -->
<div class="form-field error">
  <input aria-invalid="true" aria-describedby="email-error" />
  <svg aria-hidden="true"><!-- 错误图标 --></svg>
  <span id="email-error">请输入有效的邮箱地址</span>
</div>
```

### CSS 无障碍最佳实践

```css
/* 使用相对单位，支持用户缩放 */
html {
  font-size: 100%; /* 默认 16px */
}

body {
  font-size: 1rem;
  line-height: 1.5;
}

h1 { font-size: 2rem; }
h2 { font-size: 1.5rem; }

/* 尊重用户偏好 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1a1a1a;
    --text-color: #ffffff;
  }
}

@media (prefers-contrast: high) {
  :root {
    --border-color: #000000;
    --text-color: #000000;
  }
}

/* 确保链接在文本中可识别（不仅依赖颜色） */
a {
  color: #0066cc;
  text-decoration: underline;
}

a:hover,
a:focus {
  text-decoration: none;
  outline: 2px solid currentColor;
}

/* 禁止文本图片（使用真实文本） */
.text-content {
  /* 使用 Web 字体而不是文本图片 */
  font-family: 'Noto Sans SC', sans-serif;
}
```

## 表单无障碍

### 基本表单结构

```html
<form aria-labelledby="form-title">
  <h2 id="form-title">用户注册</h2>

  <!-- 使用 label 关联输入框 -->
  <div class="form-group">
    <label for="username">用户名 <span aria-hidden="true">*</span></label>
    <input
      type="text"
      id="username"
      name="username"
      required
      aria-required="true"
      autocomplete="username"
    />
  </div>

  <!-- 使用 fieldset 和 legend 分组相关字段 -->
  <fieldset>
    <legend>联系方式</legend>

    <div class="form-group">
      <label for="email">邮箱</label>
      <input type="email" id="email" name="email" autocomplete="email" />
    </div>

    <div class="form-group">
      <label for="phone">电话</label>
      <input type="tel" id="phone" name="phone" autocomplete="tel" />
    </div>
  </fieldset>

  <!-- 单选按钮组 -->
  <fieldset>
    <legend>性别</legend>
    <div>
      <input type="radio" id="male" name="gender" value="male" />
      <label for="male">男</label>
    </div>
    <div>
      <input type="radio" id="female" name="gender" value="female" />
      <label for="female">女</label>
    </div>
  </fieldset>

  <button type="submit">提交注册</button>
</form>
```

### 表单验证与错误处理

```html
<form novalidate>
  <div class="form-group">
    <label for="email">
      邮箱
      <span class="required" aria-hidden="true">*</span>
    </label>
    <input
      type="email"
      id="email"
      name="email"
      required
      aria-required="true"
      aria-invalid="false"
      aria-describedby="email-hint email-error"
    />
    <p id="email-hint" class="hint">我们将使用此邮箱发送确认信息</p>
    <p id="email-error" class="error" role="alert" hidden>
      请输入有效的邮箱地址
    </p>
  </div>
</form>

<script>
const emailInput = document.getElementById('email');
const emailError = document.getElementById('email-error');

emailInput.addEventListener('blur', validateEmail);
emailInput.addEventListener('input', () => {
  if (emailInput.getAttribute('aria-invalid') === 'true') {
    validateEmail();
  }
});

function validateEmail() {
  const isValid = emailInput.validity.valid;

  emailInput.setAttribute('aria-invalid', !isValid);
  emailError.hidden = isValid;

  if (!isValid) {
    emailInput.focus();
  }
}
</script>

<style>
.error {
  color: #d32f2f;
  margin-top: 0.25rem;
}

input[aria-invalid="true"] {
  border-color: #d32f2f;
  border-width: 2px;
}
</style>
```

### 复杂表单控件

```html
<!-- 自定义下拉选择框 -->
<div class="custom-select">
  <label id="city-label">选择城市</label>
  <button
    type="button"
    aria-haspopup="listbox"
    aria-expanded="false"
    aria-labelledby="city-label city-value"
  >
    <span id="city-value">请选择</span>
    <svg aria-hidden="true"><!-- 下拉箭头 --></svg>
  </button>
  <ul
    role="listbox"
    aria-labelledby="city-label"
    hidden
  >
    <li role="option" aria-selected="false">北京</li>
    <li role="option" aria-selected="false">上海</li>
    <li role="option" aria-selected="false">广州</li>
  </ul>
</div>

<!-- 搜索自动完成 -->
<div class="autocomplete">
  <label for="search">搜索产品</label>
  <input
    type="text"
    id="search"
    role="combobox"
    aria-autocomplete="list"
    aria-expanded="false"
    aria-controls="search-results"
    aria-activedescendant=""
  />
  <ul
    id="search-results"
    role="listbox"
    hidden
  >
    <!-- 动态生成的选项 -->
  </ul>
</div>

<!-- 日期选择器 -->
<div class="date-picker">
  <label for="date">选择日期</label>
  <input
    type="text"
    id="date"
    aria-describedby="date-format"
  />
  <span id="date-format" class="hint">格式：YYYY-MM-DD</span>
  <button
    type="button"
    aria-label="打开日历选择日期"
    aria-expanded="false"
  >
    <svg aria-hidden="true"><!-- 日历图标 --></svg>
  </button>
</div>
```

## 测试工具

### 自动化测试工具

#### axe DevTools

```javascript
// 安装 axe-core
// npm install axe-core

import axe from 'axe-core';

// 运行无障碍测试
async function runAccessibilityTest() {
  const results = await axe.run(document);

  console.log('违规项:', results.violations);
  console.log('通过项:', results.passes);
  console.log('不完整项:', results.incomplete);

  // 生成报告
  results.violations.forEach(violation => {
    console.error(`${violation.id}: ${violation.description}`);
    console.error(`影响: ${violation.impact}`);
    console.error(`涉及元素:`, violation.nodes);
  });
}

// 在 Jest 中使用
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button 组件', () => {
  it('应该没有无障碍违规', async () => {
    const { container } = render(<Button>点击</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

#### Lighthouse

```javascript
// 使用 Lighthouse CLI
// npx lighthouse https://example.com --only-categories=accessibility

// 在 Puppeteer 中使用
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');

async function runLighthouseTest(url) {
  const browser = await puppeteer.launch({ headless: true });
  const { port } = new URL(browser.wsEndpoint());

  const result = await lighthouse(url, {
    port,
    onlyCategories: ['accessibility']
  });

  console.log('无障碍得分:', result.lhr.categories.accessibility.score * 100);

  await browser.close();
  return result;
}

// Playwright 中集成 axe
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('页面应该通过无障碍检测', async ({ page }) => {
  await page.goto('/');

  const accessibilityResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(accessibilityResults.violations).toEqual([]);
});
```

#### ESLint 插件

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['jsx-a11y'],
  extends: ['plugin:jsx-a11y/recommended'],
  rules: {
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/label-has-associated-control': 'error',
    'jsx-a11y/no-noninteractive-element-interactions': 'error'
  }
};
```

### 手动测试清单

```markdown
## 键盘测试清单
- [ ] 使用 Tab 键能够访问所有交互元素
- [ ] 焦点顺序逻辑合理
- [ ] 焦点指示器清晰可见
- [ ] Enter/Space 能够激活按钮和链接
- [ ] 模态框能够正确捕获焦点
- [ ] ESC 键能够关闭模态框/下拉菜单
- [ ] 没有键盘陷阱

## 屏幕阅读器测试清单
- [ ] 页面标题描述准确
- [ ] 标题层级正确
- [ ] 图片有适当的替代文本
- [ ] 链接文本有意义
- [ ] 表单字段有关联的标签
- [ ] 错误消息被正确朗读
- [ ] 动态内容变化被通知
- [ ] 地标区域正确标识

## 视觉测试清单
- [ ] 文本对比度达到 4.5:1
- [ ] 可以 200% 缩放不丢失功能
- [ ] 颜色不是唯一的信息载体
- [ ] 动画可以暂停或禁用
- [ ] 焦点样式与内容对比明显
```

### 浏览器开发者工具

```javascript
// Chrome DevTools 无障碍功能
// 1. Elements 面板 > Accessibility 标签
// 2. Lighthouse 面板 > Accessibility 审计
// 3. Rendering 面板 > Emulate vision deficiencies

// Firefox 无障碍检查器
// 1. 开发者工具 > 辅助功能
// 2. 可以查看无障碍树
// 3. 可以模拟色盲

// Edge DevTools
// 1. 类似 Chrome，基于 Chromium
// 2. 额外的 Issues 面板显示无障碍问题
```

## 最佳实践与检查清单

### 开发阶段检查清单

```markdown
## HTML 结构
- [ ] 使用语义化 HTML 元素
- [ ] 标题层级正确（h1-h6 按顺序）
- [ ] 文档语言设置（<html lang="zh-CN">）
- [ ] 页面有唯一、描述性的 <title>
- [ ] 地标区域使用正确（header, nav, main, footer）

## 图片和媒体
- [ ] 信息性图片有 alt 文本
- [ ] 装饰性图片使用 alt=""
- [ ] 复杂图片有长描述
- [ ] 视频有字幕
- [ ] 音频有文字记录

## 链接和按钮
- [ ] 链接文本描述目的地
- [ ] 避免"点击这里"等模糊文本
- [ ] 按钮文本描述操作
- [ ] 图标按钮有可访问名称

## 表单
- [ ] 输入框有关联的 label
- [ ] 必填字段有明确标识
- [ ] 错误消息关联到输入框
- [ ] 使用适当的 input type
- [ ] 相关字段使用 fieldset/legend 分组

## 键盘
- [ ] 所有功能可键盘操作
- [ ] 焦点顺序逻辑合理
- [ ] 焦点样式清晰可见
- [ ] 无键盘陷阱
- [ ] 提供跳过链接

## 颜色和视觉
- [ ] 文本对比度至少 4.5:1
- [ ] 不仅依赖颜色传达信息
- [ ] 可 200% 缩放不丢失功能
- [ ] 动画可暂停

## ARIA
- [ ] 优先使用原生 HTML
- [ ] ARIA 角色使用正确
- [ ] 动态内容使用 aria-live
- [ ] 状态变化有适当的 ARIA 属性
```

### React 无障碍最佳实践

```jsx
// 1. 可访问的组件示例
function AccessibleButton({ children, onClick, disabled, isLoading }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <>
          <span className="sr-only">加载中</span>
          <Spinner aria-hidden="true" />
        </>
      ) : children}
    </button>
  );
}

// 2. 使用 React 的焦点管理
import { useRef, useEffect } from 'react';

function Modal({ isOpen, onClose, children }) {
  const closeButtonRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      closeButtonRef.current?.focus();
    } else {
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">对话框标题</h2>
      {children}
      <button ref={closeButtonRef} onClick={onClose}>
        关闭
      </button>
    </div>
  );
}

// 3. 使用 Fragment 避免多余 DOM
function Navigation({ items }) {
  return (
    <nav aria-label="主导航">
      <ul>
        {items.map(item => (
          <React.Fragment key={item.id}>
            <li>
              <a href={item.url}>{item.label}</a>
            </li>
          </React.Fragment>
        ))}
      </ul>
    </nav>
  );
}

// 4. 条件渲染的无障碍考虑
function Notification({ message, type }) {
  if (!message) return null;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      {message}
    </div>
  );
}
```

### Vue 无障碍最佳实践

```vue
<template>
  <!-- 使用 v-bind 绑定 ARIA 属性 -->
  <button
    :aria-expanded="isOpen"
    :aria-controls="menuId"
    @click="toggle"
  >
    菜单
  </button>

  <ul
    v-show="isOpen"
    :id="menuId"
    role="menu"
  >
    <li
      v-for="item in items"
      :key="item.id"
      role="menuitem"
    >
      {{ item.label }}
    </li>
  </ul>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const isOpen = ref(false);
const menuId = 'dropdown-menu';
const buttonRef = ref(null);

function toggle() {
  isOpen.value = !isOpen.value;
}

// 焦点管理
onMounted(() => {
  // 确保初始焦点正确
});
</script>
```

## 面试要点

### 常见面试问题

**Q1: 什么是 Web 无障碍？为什么它很重要？**

```
A: Web 无障碍（A11y）是指让网站和应用程序对所有人可用，包括残障人士。
其重要性体现在：
1. 道德责任：每个人都应平等访问信息
2. 法律合规：许多国家有无障碍法规要求
3. 商业价值：扩大用户群体，提升 SEO
4. 代码质量：无障碍代码通常更语义化、更易维护
```

**Q2: WCAG 的核心原则是什么？**

```
A: WCAG 基于 POUR 四原则：
1. Perceivable（可感知）：信息能被感知
2. Operable（可操作）：界面能被操作
3. Understandable（可理解）：信息能被理解
4. Robust（健壮性）：能被各种技术可靠解析
```

**Q3: 如何让图片对屏幕阅读器可访问？**

```
A: 根据图片类型使用不同策略：
1. 信息性图片：提供描述性 alt 文本
2. 装饰性图片：使用空 alt="" 或 role="presentation"
3. 复杂图片：使用 aria-describedby 关联长描述
4. 图标按钮：使用 aria-label 或 sr-only 文本
```

**Q4: ARIA 的使用原则是什么？**

```
A: 遵循以下原则：
1. 能用原生 HTML 就不用 ARIA
2. 不要改变原生语义
3. 所有可交互元素必须键盘可用
4. 不要对可聚焦元素使用 role="presentation"
5. 交互元素必须有可访问名称
```

**Q5: 如何测试网站的无障碍性？**

```
A: 采用多层次测试方法：
1. 自动化工具：axe DevTools、Lighthouse
2. 键盘测试：仅用键盘导航
3. 屏幕阅读器测试：NVDA、VoiceOver
4. 对比度检查：Color Contrast Analyzer
5. 手动检查：根据 WCAG 检查清单验证
```

### 代码题示例

```javascript
// 面试题：修复以下组件的无障碍问题
// 原始代码（有问题）
function BadButton({ icon, onClick }) {
  return (
    <div className="button" onClick={onClick}>
      <img src={icon} />
    </div>
  );
}

// 修复后的代码
function GoodButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
    >
      <img src={icon} alt="" aria-hidden="true" />
    </button>
  );
}

// 面试题：实现一个可访问的 Tab 组件
function AccessibleTabs({ tabs }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = (e, index) => {
    let newIndex = index;

    switch (e.key) {
      case 'ArrowRight':
        newIndex = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        newIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    setActiveIndex(newIndex);
    document.getElementById(`tab-${newIndex}`)?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="内容标签">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`tab-${index}`}
            role="tab"
            aria-selected={activeIndex === index}
            aria-controls={`panel-${index}`}
            tabIndex={activeIndex === index ? 0 : -1}
            onClick={() => setActiveIndex(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          id={`panel-${index}`}
          role="tabpanel"
          aria-labelledby={`tab-${index}`}
          hidden={activeIndex !== index}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
```

## 总结

Web 无障碍不仅是技术要求，更是对用户的尊重和包容。作为前端开发者，我们应该：

1. **从一开始就考虑无障碍**：将无障碍融入设计和开发流程，而非事后修补
2. **优先使用语义化 HTML**：原生 HTML 元素提供内置的无障碍支持
3. **测试、测试、再测试**：结合自动化工具和手动测试，确保覆盖各种场景
4. **持续学习**：无障碍标准在演进，保持学习最新的最佳实践
5. **倾听真实用户反馈**：与残障用户交流，了解他们的真实需求

构建无障碍的 Web 应用，让每个人都能平等地享受数字世界的便利，这是我们作为开发者的责任和荣誉。
