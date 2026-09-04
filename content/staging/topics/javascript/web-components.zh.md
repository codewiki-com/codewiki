---
title: Web Components 完全指南
description: 掌握原生Web组件技术，构建可复用的自定义元素
track: javascript
section: browser
difficulty: advanced
tags:
  - Web Components
  - Custom Elements
  - Shadow DOM
  - 原生
status: imported
origin: old/src/content/docs/frontend/web-components.zh.md
divergence: 0.206
issues: []
legacy:
  category: Frontend
  subcategory: JavaScript
  order: 10
  lastUpdated: 2026-01-07
---

Web Components 是一套原生浏览器技术，允许开发者创建可复用、封装良好的自定义 HTML 元素。与框架无关的特性使其成为构建跨项目、跨团队组件库的理想选择。本文将深入探讨 Web Components 的核心概念、实现方式和最佳实践。

## Web Components 概述与浏览器支持

### 什么是 Web Components

Web Components 是一组 Web 平台 API 的集合，由三大核心技术组成：

1. **Custom Elements（自定义元素）**：允许定义新的 HTML 标签及其行为
2. **Shadow DOM（影子 DOM）**：提供 DOM 和 CSS 的封装与隔离
3. **HTML Templates（HTML 模板）**：定义可复用的 HTML 片段

```javascript
// 一个简单的 Web Component 示例
class HelloWorld extends HTMLElement {
  constructor() {
    super();
    // 创建 Shadow DOM
    const shadow = this.attachShadow({ mode: 'open' });

    // 使用 DOM API 创建元素
    const style = document.createElement('style');
    style.textContent = `
      p { color: #333; font-size: 18px; }
    `;

    const paragraph = document.createElement('p');
    paragraph.textContent = 'Hello, Web Components!';

    shadow.appendChild(style);
    shadow.appendChild(paragraph);
  }
}

// 注册自定义元素
customElements.define('hello-world', HelloWorld);
```

使用时只需在 HTML 中添加：

```html
<hello-world></hello-world>
```

### 浏览器支持情况

截至 2024 年，所有现代浏览器都已完全支持 Web Components：

| 浏览器 | Custom Elements | Shadow DOM | HTML Templates |
|--------|-----------------|------------|----------------|
| Chrome | 54+ | 53+ | 35+ |
| Firefox | 63+ | 63+ | 59+ |
| Safari | 10.1+ | 10+ | 9+ |
| Edge | 79+ | 79+ | 13+ |

对于需要支持旧版浏览器的项目，可以使用 [webcomponentsjs](https://github.com/webcomponents/polyfills) polyfill：

```html
<script src="https://unpkg.com/@webcomponents/webcomponentsjs@2.8.0/webcomponents-loader.js"></script>
```

### Web Components 的优势

1. **框架无关**：可在任何前端框架或纯 HTML 中使用
2. **原生支持**：无需额外依赖，浏览器原生实现
3. **真正的封装**：Shadow DOM 提供样式和 DOM 隔离
4. **标准化**：遵循 W3C 标准，具有长期稳定性
5. **可组合性**：组件可以像原生 HTML 元素一样嵌套使用

## Custom Elements（自定义元素）

### 定义自定义元素

自定义元素分为两类：

1. **自主自定义元素（Autonomous custom elements）**：继承自 `HTMLElement`
2. **自定义内置元素（Customized built-in elements）**：继承自具体的 HTML 元素

```javascript
// 自主自定义元素
class MyCard extends HTMLElement {
  constructor() {
    super();
    // 初始化组件
  }
}
customElements.define('my-card', MyCard);

// 自定义内置元素（扩展按钮）
class FancyButton extends HTMLButtonElement {
  constructor() {
    super();
    this.addEventListener('click', () => {
      this.classList.add('clicked');
    });
  }
}
customElements.define('fancy-button', FancyButton, { extends: 'button' });
```

使用自定义内置元素：

```html
<!-- 自主自定义元素 -->
<my-card></my-card>

<!-- 自定义内置元素 -->
<button is="fancy-button">点击我</button>
```

### 命名规则

自定义元素的命名必须遵循以下规则：

- 必须包含连字符（-）
- 必须以小写字母开头
- 不能使用已保留的名称（如 `font-face`、`annotation-xml` 等）

```javascript
// 正确的命名
customElements.define('user-profile', UserProfile);
customElements.define('app-header', AppHeader);
customElements.define('my-awesome-component', MyAwesomeComponent);

// 错误的命名
customElements.define('userprofile', UserProfile); // 缺少连字符
customElements.define('User-Profile', UserProfile); // 大写字母开头
```

### customElements API

```javascript
// 定义元素
customElements.define('my-element', MyElement);

// 获取元素构造函数
const MyElement = customElements.get('my-element');

// 等待元素定义完成
await customElements.whenDefined('my-element');

// 检查元素是否已定义
if (customElements.get('my-element')) {
  console.log('my-element 已定义');
}

// 升级元素（手动触发升级）
customElements.upgrade(element);
```

## Shadow DOM（封装与隔离）

### 理解 Shadow DOM

Shadow DOM 是 Web Components 中最强大的特性之一，它提供了真正的 DOM 封装：

```javascript
class EncapsulatedCard extends HTMLElement {
  constructor() {
    super();

    // 创建 Shadow Root
    // mode: 'open' - 允许外部访问 shadowRoot
    // mode: 'closed' - 禁止外部访问
    const shadow = this.attachShadow({ mode: 'open' });

    // 创建样式元素
    const style = document.createElement('style');
    style.textContent = `
      /* 这些样式只影响 Shadow DOM 内部 */
      .card {
        padding: 20px;
        border-radius: 8px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      h2 {
        margin: 0 0 10px;
        font-size: 24px;
      }

      p {
        margin: 0;
        opacity: 0.9;
      }
    `;

    // 创建卡片容器
    const card = document.createElement('div');
    card.className = 'card';

    const title = document.createElement('h2');
    title.textContent = '封装的卡片';

    const content = document.createElement('p');
    content.textContent = '外部样式无法影响这里的内容';

    card.appendChild(title);
    card.appendChild(content);

    shadow.appendChild(style);
    shadow.appendChild(card);
  }
}

customElements.define('encapsulated-card', EncapsulatedCard);
```

### Open vs Closed 模式

```javascript
// Open 模式 - 可以通过 element.shadowRoot 访问
class OpenComponent extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const p = document.createElement('p');
    p.textContent = '可访问的内容';
    shadow.appendChild(p);
  }
}

// Closed 模式 - 外部无法访问 shadowRoot
class ClosedComponent extends HTMLElement {
  #shadowRoot; // 私有属性保存引用

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'closed' });
    const p = document.createElement('p');
    p.textContent = '封闭的内容';
    this.#shadowRoot.appendChild(p);
  }
}

// 使用
const openEl = document.querySelector('open-component');
console.log(openEl.shadowRoot); // 返回 ShadowRoot

const closedEl = document.querySelector('closed-component');
console.log(closedEl.shadowRoot); // 返回 null
```

### Shadow DOM 边界与 :host 选择器

```javascript
class ShadowBoundary extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      /* :host 选择器匹配宿主元素 */
      :host {
        display: block;
        border: 2px solid #ddd;
        padding: 16px;
      }

      /* 当宿主元素有特定类时 */
      :host(.highlighted) {
        border-color: #4CAF50;
        background: #f0fff0;
      }

      /* 当宿主元素在特定上下文中时 */
      :host-context(.dark-theme) {
        background: #333;
        color: white;
      }
    `;

    const content = document.createElement('div');
    content.className = 'content';

    const slot = document.createElement('slot');
    content.appendChild(slot);

    shadow.appendChild(style);
    shadow.appendChild(content);
  }
}

customElements.define('shadow-boundary', ShadowBoundary);
```

## HTML Templates 与 Slots

### 使用 Template 元素

`<template>` 元素包含的内容在页面加载时不会渲染，可以通过 JavaScript 动态使用：

```html
<!-- HTML 中定义模板 -->
<template id="card-template">
  <style>
    .card {
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .card-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 12px;
      color: #1a1a1a;
    }

    .card-content {
      color: #666;
      line-height: 1.6;
    }
  </style>

  <article class="card">
    <h3 class="card-title"><slot name="title">默认标题</slot></h3>
    <div class="card-content">
      <slot>默认内容</slot>
    </div>
  </article>
</template>
```

```javascript
class TemplateCard extends HTMLElement {
  constructor() {
    super();

    // 获取模板
    const template = document.getElementById('card-template');
    const content = template.content.cloneNode(true);

    // 创建 Shadow DOM 并添加模板内容
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(content);
  }
}

customElements.define('template-card', TemplateCard);
```

### Slots 插槽机制

Slots 允许将 Light DOM 内容投射到 Shadow DOM 中：

```javascript
class SlotDemo extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .container {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 20px;
        padding: 20px;
        background: #f5f5f5;
        border-radius: 8px;
      }

      .sidebar {
        background: #fff;
        padding: 16px;
        border-radius: 8px;
      }

      .main {
        background: #fff;
        padding: 16px;
        border-radius: 8px;
      }

      /* 为插槽设置样式 */
      slot[name="sidebar"]::slotted(*) {
        margin: 8px 0;
      }
    `;

    const container = document.createElement('div');
    container.className = 'container';

    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';

    const sidebarSlot = document.createElement('slot');
    sidebarSlot.name = 'sidebar';

    const defaultSidebarContent = document.createElement('p');
    defaultSidebarContent.textContent = '默认侧边栏内容';
    sidebarSlot.appendChild(defaultSidebarContent);
    sidebar.appendChild(sidebarSlot);

    const main = document.createElement('main');
    main.className = 'main';

    const mainSlot = document.createElement('slot');
    const defaultMainContent = document.createElement('p');
    defaultMainContent.textContent = '默认主内容';
    mainSlot.appendChild(defaultMainContent);
    main.appendChild(mainSlot);

    container.appendChild(sidebar);
    container.appendChild(main);

    shadow.appendChild(style);
    shadow.appendChild(container);
  }
}

customElements.define('slot-demo', SlotDemo);
```

使用插槽：

```html
<slot-demo>
  <nav slot="sidebar">
    <a href="#home">首页</a>
    <a href="#about">关于</a>
    <a href="#contact">联系</a>
  </nav>

  <!-- 未命名的内容进入默认插槽 -->
  <article>
    <h1>主要内容区域</h1>
    <p>这是投射到默认插槽的内容。</p>
  </article>
</slot-demo>
```

### 监听 Slot 变化

```javascript
class SlotObserver extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper';

    const slot = document.createElement('slot');
    wrapper.appendChild(slot);
    shadow.appendChild(wrapper);

    // 监听插槽内容变化
    slot.addEventListener('slotchange', (e) => {
      const assignedNodes = slot.assignedNodes();
      console.log('插槽内容已更新:', assignedNodes);

      // 获取已分配的元素（排除文本节点）
      const assignedElements = slot.assignedElements();
      console.log('已分配的元素:', assignedElements);
    });
  }
}

customElements.define('slot-observer', SlotObserver);
```

## 生命周期回调

### 四个核心生命周期方法

```javascript
class LifecycleDemo extends HTMLElement {
  // 1. 构造函数 - 元素创建时调用
  constructor() {
    super();
    console.log('constructor: 元素被创建');

    // 适合做：
    // - 创建 Shadow DOM
    // - 初始化状态
    // - 设置事件监听器（内部的）

    this.attachShadow({ mode: 'open' });
    this._count = 0;
  }

  // 2. connectedCallback - 元素插入 DOM 时调用
  connectedCallback() {
    console.log('connectedCallback: 元素已插入 DOM');

    // 适合做：
    // - 获取资源
    // - 设置外部事件监听器
    // - 启动定时器
    // - 渲染内容

    this.render();
    this._interval = setInterval(() => {
      this._count++;
      this.render();
    }, 1000);
  }

  // 3. disconnectedCallback - 元素从 DOM 移除时调用
  disconnectedCallback() {
    console.log('disconnectedCallback: 元素已从 DOM 移除');

    // 适合做：
    // - 清理资源
    // - 移除事件监听器
    // - 取消定时器

    if (this._interval) {
      clearInterval(this._interval);
    }
  }

  // 4. attributeChangedCallback - 被观察的属性变化时调用
  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`attributeChangedCallback: ${name} 从 "${oldValue}" 变为 "${newValue}"`);

    // 处理属性变化
    if (name === 'theme' && oldValue !== newValue) {
      this.updateTheme(newValue);
    }
  }

  // 必须声明要观察的属性
  static get observedAttributes() {
    return ['theme', 'disabled', 'size'];
  }

  // adoptedCallback - 元素被移动到新文档时调用（较少使用）
  adoptedCallback() {
    console.log('adoptedCallback: 元素被移动到新文档');
  }

  render() {
    const style = document.createElement('style');
    style.textContent = `.counter { font-size: 24px; font-weight: bold; }`;

    const counter = document.createElement('div');
    counter.className = 'counter';
    counter.textContent = `计数: ${this._count}`;

    this.shadowRoot.replaceChildren(style, counter);
  }

  updateTheme(theme) {
    this.shadowRoot.host.style.background =
      theme === 'dark' ? '#333' : '#fff';
  }
}

customElements.define('lifecycle-demo', LifecycleDemo);
```

### 生命周期执行顺序

```javascript
// 创建元素
const el = document.createElement('lifecycle-demo');
// 输出: constructor

// 插入 DOM
document.body.appendChild(el);
// 输出: connectedCallback

// 修改属性
el.setAttribute('theme', 'dark');
// 输出: attributeChangedCallback

// 移除元素
el.remove();
// 输出: disconnectedCallback

// 重新插入
document.body.appendChild(el);
// 输出: connectedCallback（再次调用）
```

## 属性与事件处理

### 属性（Attributes）vs 属性（Properties）

```javascript
class AttributeProperty extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // 内部状态
    this._value = '';
  }

  // 声明观察的属性
  static get observedAttributes() {
    return ['value', 'disabled', 'placeholder'];
  }

  // 属性变化回调
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value') {
      this._value = newValue;
      this.render();
    }
  }

  // Property getter - 读取 property 时调用
  get value() {
    return this._value;
  }

  // Property setter - 设置 property 时调用
  set value(val) {
    this._value = val;
    // 同步到 attribute（可选）
    this.setAttribute('value', val);
    this.render();
  }

  // 布尔属性的处理
  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(val) {
    if (val) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const style = document.createElement('style');
    style.textContent = `
      input {
        padding: 8px 12px;
        border: 2px solid #ddd;
        border-radius: 6px;
        font-size: 16px;
        transition: border-color 0.2s;
      }
      input:focus {
        outline: none;
        border-color: #4CAF50;
      }
      input:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
      }
    `;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = this._value;
    input.placeholder = this.getAttribute('placeholder') || '';
    input.disabled = this.disabled;

    // 绑定事件
    input.addEventListener('input', (e) => {
      this._value = e.target.value;
      this.dispatchEvent(new CustomEvent('change', {
        detail: { value: this._value },
        bubbles: true,
        composed: true
      }));
    });

    this.shadowRoot.replaceChildren(style, input);
  }
}

customElements.define('attribute-property', AttributeProperty);
```

### 自定义事件

```javascript
class EventEmitter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const style = document.createElement('style');
    style.textContent = `
      .btn {
        padding: 12px 24px;
        font-size: 16px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        margin-right: 8px;
      }
      .btn-primary {
        background: #4CAF50;
        color: white;
      }
      .btn-primary:hover {
        background: #45a049;
      }
      .btn-danger {
        background: #f44336;
        color: white;
      }
      .btn-danger:hover {
        background: #da190b;
      }
    `;

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.textContent = '确认';
    confirmBtn.dataset.action = 'confirm';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-danger';
    cancelBtn.textContent = '取消';
    cancelBtn.dataset.action = 'cancel';

    const handleClick = (e) => {
      const action = e.target.dataset.action;

      // 发送自定义事件
      this.dispatchEvent(new CustomEvent('action', {
        detail: {
          action,
          timestamp: Date.now()
        },
        bubbles: true,    // 事件冒泡
        composed: true    // 穿越 Shadow DOM 边界
      }));
    };

    confirmBtn.addEventListener('click', handleClick);
    cancelBtn.addEventListener('click', handleClick);

    this.shadowRoot.replaceChildren(style, confirmBtn, cancelBtn);
  }
}

customElements.define('event-emitter', EventEmitter);

// 使用
document.querySelector('event-emitter').addEventListener('action', (e) => {
  console.log('收到动作:', e.detail.action);
  console.log('时间戳:', e.detail.timestamp);
});
```

### 事件冒泡与 composed

```javascript
class EventBubbling extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const btn = document.createElement('button');
    btn.id = 'inner-btn';
    btn.textContent = '点击我';
    shadow.appendChild(btn);

    btn.addEventListener('click', () => {
      // composed: false - 事件不会穿越 Shadow DOM 边界
      this.dispatchEvent(new CustomEvent('internal-click', {
        bubbles: true,
        composed: false
      }));

      // composed: true - 事件会穿越 Shadow DOM 边界
      this.dispatchEvent(new CustomEvent('external-click', {
        bubbles: true,
        composed: true
      }));
    });
  }
}

customElements.define('event-bubbling', EventBubbling);

// 在外部监听
const el = document.querySelector('event-bubbling');

// 只有 composed: true 的事件能被外部捕获
el.addEventListener('internal-click', () => {
  console.log('internal-click'); // 不会触发
});

el.addEventListener('external-click', () => {
  console.log('external-click'); // 会触发
});
```

## CSS 样式封装与主题化

### Shadow DOM 样式隔离

```javascript
class StyledComponent extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      /* 只影响 Shadow DOM 内部 */
      * {
        box-sizing: border-box;
      }

      /* :host 选择宿主元素 */
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* 条件 :host */
      :host([hidden]) {
        display: none;
      }

      :host(:hover) {
        opacity: 0.9;
      }

      /* :host-context 基于祖先元素应用样式 */
      :host-context(.dark-mode) {
        --bg-color: #1a1a1a;
        --text-color: #ffffff;
      }

      .container {
        background: var(--bg-color, #ffffff);
        color: var(--text-color, #333333);
        padding: 20px;
        border-radius: 8px;
      }
    `;

    const container = document.createElement('div');
    container.className = 'container';

    const slot = document.createElement('slot');
    container.appendChild(slot);

    shadow.appendChild(style);
    shadow.appendChild(container);
  }
}

customElements.define('styled-component', StyledComponent);
```

### CSS 自定义属性（CSS Variables）实现主题化

```javascript
class ThemeableCard extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        /* 定义可被外部覆盖的 CSS 变量 */
        --card-bg: #ffffff;
        --card-border: #e0e0e0;
        --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        --card-radius: 12px;
        --card-padding: 24px;
        --title-color: #1a1a1a;
        --title-size: 20px;
        --content-color: #666666;
        --content-size: 16px;

        display: block;
      }

      .card {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: var(--card-radius);
        padding: var(--card-padding);
        box-shadow: var(--card-shadow);
      }

      .card-title {
        color: var(--title-color);
        font-size: var(--title-size);
        font-weight: 600;
        margin: 0 0 12px;
      }

      .card-content {
        color: var(--content-color);
        font-size: var(--content-size);
        line-height: 1.6;
      }
    `;

    const card = document.createElement('article');
    card.className = 'card';

    const title = document.createElement('h2');
    title.className = 'card-title';
    const titleSlot = document.createElement('slot');
    titleSlot.name = 'title';
    title.appendChild(titleSlot);

    const content = document.createElement('div');
    content.className = 'card-content';
    const contentSlot = document.createElement('slot');
    content.appendChild(contentSlot);

    card.appendChild(title);
    card.appendChild(content);

    shadow.appendChild(style);
    shadow.appendChild(card);
  }
}

customElements.define('themeable-card', ThemeableCard);
```

外部定制主题：

```css
/* 全局主题变量 */
:root {
  --primary-color: #4CAF50;
  --secondary-color: #2196F3;
}

/* 暗色主题 */
.dark-theme themeable-card {
  --card-bg: #2d2d2d;
  --card-border: #444444;
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  --title-color: #ffffff;
  --content-color: #cccccc;
}

/* 紧凑模式 */
themeable-card.compact {
  --card-padding: 12px;
  --title-size: 16px;
  --content-size: 14px;
}
```

### ::part 和 ::slotted 伪元素

```javascript
class PartExample extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .button {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      }

      /* ::slotted 选择器 - 样式化插槽内容 */
      ::slotted(p) {
        margin: 0;
        padding: 10px;
      }

      ::slotted(.highlight) {
        background: yellow;
      }
    `;

    // 使用 part 属性暴露可样式化的部分
    const button = document.createElement('button');
    button.setAttribute('part', 'button');
    button.className = 'button';

    const iconSlot = document.createElement('slot');
    iconSlot.name = 'icon';

    const label = document.createElement('span');
    label.setAttribute('part', 'label');
    const labelSlot = document.createElement('slot');
    label.appendChild(labelSlot);

    button.appendChild(iconSlot);
    button.appendChild(label);

    shadow.appendChild(style);
    shadow.appendChild(button);
  }
}

customElements.define('part-example', PartExample);
```

外部使用 `::part` 样式化：

```css
/* 使用 ::part 选择器从外部样式化 */
part-example::part(button) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

part-example::part(button):hover {
  transform: scale(1.05);
}

part-example::part(label) {
  font-weight: 600;
}
```

### 采用 Constructable Stylesheets

```javascript
// 使用 Constructable Stylesheets 共享样式
const sharedStyles = new CSSStyleSheet();
sharedStyles.replaceSync(`
  :host {
    display: block;
  }
  .btn {
    padding: 8px 16px;
    border-radius: 4px;
  }
`);

class SharedStylesComponent extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.adoptedStyleSheets = [sharedStyles];

    const button = document.createElement('button');
    button.className = 'btn';
    const slot = document.createElement('slot');
    button.appendChild(slot);
    shadow.appendChild(button);
  }
}

customElements.define('shared-styles-component', SharedStylesComponent);
```

## 与框架的集成

### React 中使用 Web Components

```jsx
// MyWebComponent.jsx
import React, { useRef, useEffect } from 'react';

// 首先导入 Web Component 定义
import './my-custom-element.js';

function MyWebComponent({ value, onChange, children }) {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;

    // 设置 properties（不是 attributes）
    if (element) {
      element.value = value;
    }
  }, [value]);

  useEffect(() => {
    const element = elementRef.current;

    // 监听自定义事件
    const handleChange = (e) => {
      onChange?.(e.detail.value);
    };

    element?.addEventListener('change', handleChange);

    return () => {
      element?.removeEventListener('change', handleChange);
    };
  }, [onChange]);

  return (
    <my-custom-element ref={elementRef}>
      {children}
    </my-custom-element>
  );
}

export default MyWebComponent;
```

React 包装器工厂函数：

```jsx
// createReactWrapper.jsx
import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';

function createReactWrapper(tagName, eventNames = []) {
  return forwardRef(function ReactWrapper(props, ref) {
    const elementRef = useRef(null);

    // 暴露原生元素引用
    useImperativeHandle(ref, () => elementRef.current);

    // 处理事件绑定
    useEffect(() => {
      const element = elementRef.current;
      if (!element) return;

      const handlers = {};

      eventNames.forEach(eventName => {
        const propName = `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
        if (props[propName]) {
          handlers[eventName] = props[propName];
          element.addEventListener(eventName, handlers[eventName]);
        }
      });

      return () => {
        eventNames.forEach(eventName => {
          if (handlers[eventName]) {
            element.removeEventListener(eventName, handlers[eventName]);
          }
        });
      };
    }, [props]);

    // 过滤掉事件处理器，只保留普通属性
    const filteredProps = Object.fromEntries(
      Object.entries(props).filter(([key]) =>
        !key.startsWith('on') && key !== 'children'
      )
    );

    return React.createElement(tagName, {
      ref: elementRef,
      ...filteredProps
    }, props.children);
  });
}

// 使用
const MyButton = createReactWrapper('my-button', ['click', 'focus']);

function App() {
  return (
    <MyButton
      variant="primary"
      onClick={(e) => console.log('clicked', e.detail)}
    >
      点击我
    </MyButton>
  );
}
```

### Vue 中使用 Web Components

```vue
<!-- App.vue -->
<template>
  <div>
    <!-- 直接使用 Web Component -->
    <my-custom-input
      :value="inputValue"
      @change="handleChange"
      placeholder="请输入..."
    />

    <!-- 使用 v-model（需要配置） -->
    <my-custom-input v-model="inputValue" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import './my-custom-input.js';

const inputValue = ref('');

function handleChange(event) {
  inputValue.value = event.detail.value;
}
</script>
```

Vue 3 配置自定义元素：

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 将所有带 my- 前缀的标签视为自定义元素
          isCustomElement: (tag) => tag.startsWith('my-')
        }
      }
    })
  ]
});
```

Vue 组件包装器：

```vue
<!-- WebComponentWrapper.vue -->
<template>
  <component
    :is="tagName"
    ref="elementRef"
    v-bind="$attrs"
  >
    <slot />
  </component>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  tagName: {
    type: String,
    required: true
  },
  modelValue: {
    type: [String, Number, Boolean],
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const elementRef = ref(null);

// 同步 v-model 值
watch(() => props.modelValue, (newValue) => {
  if (elementRef.value) {
    elementRef.value.value = newValue;
  }
});

onMounted(() => {
  const element = elementRef.value;

  element?.addEventListener('change', (e) => {
    emit('update:modelValue', e.detail.value);
    emit('change', e);
  });
});
</script>
```

## 实战案例：构建组件库

### 组件库架构设计

```
my-components/
  src/
    core/
      base-component.js    # 基础组件类
      styles.js            # 共享样式
      utils.js             # 工具函数
    components/
      button/
        my-button.js
        my-button.css
      input/
        my-input.js
        my-input.css
      modal/
        my-modal.js
        my-modal.css
      card/
        my-card.js
        my-card.css
    index.js               # 入口文件
  dist/
  package.json
```

### 基础组件类

```javascript
// src/core/base-component.js
export class BaseComponent extends HTMLElement {
  static styles = '';

  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
    this._initialized = false;
  }

  connectedCallback() {
    if (!this._initialized) {
      this._initialized = true;
      this._render();
    }
    this.connected?.();
  }

  disconnectedCallback() {
    this.disconnected?.();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.attributeChanged?.(name, oldValue, newValue);
      if (this._initialized) {
        this._render();
      }
    }
  }

  _render() {
    const template = this.render?.();
    const styles = this.constructor.styles;

    // 清空并重新渲染
    const style = document.createElement('style');
    style.textContent = styles;

    this._shadow.replaceChildren(style);

    if (template) {
      if (typeof template === 'string') {
        const temp = document.createElement('template');
        temp.innerHTML = template;
        this._shadow.appendChild(temp.content.cloneNode(true));
      } else {
        this._shadow.appendChild(template);
      }
    }

    this.rendered?.();
  }

  // 便捷方法
  $(selector) {
    return this._shadow.querySelector(selector);
  }

  $$(selector) {
    return this._shadow.querySelectorAll(selector);
  }

  emit(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
  }
}
```

### 按钮组件

```javascript
// src/components/button/my-button.js
import { BaseComponent } from '../../core/base-component.js';

export class MyButton extends BaseComponent {
  static get observedAttributes() {
    return ['variant', 'size', 'disabled', 'loading'];
  }

  static styles = `
    :host {
      display: inline-block;
    }

    :host([hidden]) {
      display: none;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: var(--btn-padding, 10px 20px);
      font-size: var(--btn-font-size, 14px);
      font-weight: 500;
      font-family: inherit;
      line-height: 1.5;
      border: none;
      border-radius: var(--btn-radius, 6px);
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
    }

    .btn:focus-visible {
      box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Variants */
    .btn--primary {
      background: var(--btn-primary-bg, #4CAF50);
      color: var(--btn-primary-color, white);
    }

    .btn--primary:hover:not(:disabled) {
      background: var(--btn-primary-hover, #45a049);
    }

    .btn--secondary {
      background: var(--btn-secondary-bg, #f5f5f5);
      color: var(--btn-secondary-color, #333);
    }

    .btn--secondary:hover:not(:disabled) {
      background: var(--btn-secondary-hover, #e0e0e0);
    }

    .btn--outline {
      background: transparent;
      border: 2px solid var(--btn-outline-border, #4CAF50);
      color: var(--btn-outline-color, #4CAF50);
    }

    .btn--outline:hover:not(:disabled) {
      background: var(--btn-outline-hover-bg, #4CAF50);
      color: var(--btn-outline-hover-color, white);
    }

    /* Sizes */
    .btn--sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .btn--lg {
      padding: 14px 28px;
      font-size: 16px;
    }

    /* Loading */
    .btn--loading {
      position: relative;
      color: transparent;
    }

    .spinner {
      position: absolute;
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  get variant() {
    return this.getAttribute('variant') || 'primary';
  }

  get size() {
    return this.getAttribute('size') || 'md';
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  get loading() {
    return this.hasAttribute('loading');
  }

  render() {
    const classes = [
      'btn',
      `btn--${this.variant}`,
      this.size !== 'md' ? `btn--${this.size}` : '',
      this.loading ? 'btn--loading' : ''
    ].filter(Boolean).join(' ');

    const button = document.createElement('button');
    button.className = classes;
    button.setAttribute('part', 'button');
    button.disabled = this.disabled || this.loading;

    if (this.loading) {
      const spinner = document.createElement('span');
      spinner.className = 'spinner';
      button.appendChild(spinner);
    }

    const slot = document.createElement('slot');
    button.appendChild(slot);

    return button;
  }

  rendered() {
    this.$('button').addEventListener('click', (e) => {
      if (!this.disabled && !this.loading) {
        this.emit('click', { originalEvent: e });
      }
    });
  }
}

customElements.define('my-button', MyButton);
```

### 模态框组件

```javascript
// src/components/modal/my-modal.js
import { BaseComponent } from '../../core/base-component.js';

export class MyModal extends BaseComponent {
  static get observedAttributes() {
    return ['open', 'title'];
  }

  static styles = `
    :host {
      --modal-bg: white;
      --modal-overlay: rgba(0, 0, 0, 0.5);
      --modal-radius: 12px;
      --modal-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: var(--modal-overlay);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
      z-index: 1000;
    }

    .overlay.open {
      opacity: 1;
      visibility: visible;
    }

    .modal {
      background: var(--modal-bg);
      border-radius: var(--modal-radius);
      box-shadow: var(--modal-shadow);
      max-width: 90vw;
      max-height: 90vh;
      width: 500px;
      transform: scale(0.9) translateY(-20px);
      transition: transform 0.3s;
      display: flex;
      flex-direction: column;
    }

    .overlay.open .modal {
      transform: scale(1) translateY(0);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #eee;
    }

    .modal-title {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      padding: 4px;
      line-height: 1;
      transition: color 0.2s;
    }

    .modal-close:hover {
      color: #333;
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  `;

  get open() {
    return this.hasAttribute('open');
  }

  set open(value) {
    if (value) {
      this.setAttribute('open', '');
    } else {
      this.removeAttribute('open');
    }
  }

  get title() {
    return this.getAttribute('title') || '';
  }

  render() {
    const overlay = document.createElement('div');
    overlay.className = `overlay ${this.open ? 'open' : ''}`;
    overlay.setAttribute('part', 'overlay');

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('part', 'modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    // Header
    const header = document.createElement('header');
    header.className = 'modal-header';
    header.setAttribute('part', 'header');

    const titleEl = document.createElement('h2');
    titleEl.className = 'modal-title';
    const titleSlot = document.createElement('slot');
    titleSlot.name = 'title';
    titleSlot.textContent = this.title;
    titleEl.appendChild(titleSlot);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.setAttribute('aria-label', '关闭');
    closeBtn.textContent = '\u00D7';

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    // Body
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.setAttribute('part', 'body');
    const bodySlot = document.createElement('slot');
    body.appendChild(bodySlot);

    // Footer
    const footer = document.createElement('footer');
    footer.className = 'modal-footer';
    footer.setAttribute('part', 'footer');
    const footerSlot = document.createElement('slot');
    footerSlot.name = 'footer';
    footer.appendChild(footerSlot);

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);

    return overlay;
  }

  rendered() {
    // 点击关闭按钮
    this.$('.modal-close').addEventListener('click', () => {
      this.close();
    });

    // 点击遮罩层关闭
    this.$('.overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.close();
      }
    });

    // ESC 键关闭
    this._handleKeyDown = (e) => {
      if (e.key === 'Escape' && this.open) {
        this.close();
      }
    };
    document.addEventListener('keydown', this._handleKeyDown);
  }

  show() {
    this.open = true;
    this.emit('open');
    // 焦点陷阱
    this.$('.modal-close').focus();
  }

  close() {
    this.open = false;
    this.emit('close');
  }

  disconnected() {
    if (this._handleKeyDown) {
      document.removeEventListener('keydown', this._handleKeyDown);
    }
  }
}

customElements.define('my-modal', MyModal);
```

### 使用组件库

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>My Components Demo</title>
  <script type="module" src="./dist/my-components.js"></script>
  <style>
    /* 自定义主题 */
    :root {
      --btn-primary-bg: #6366f1;
      --btn-primary-hover: #4f46e5;
      --modal-radius: 16px;
    }
  </style>
</head>
<body>
  <my-button variant="primary" id="openModal">打开模态框</my-button>
  <my-button variant="outline" size="sm">次要按钮</my-button>
  <my-button variant="secondary" loading>加载中</my-button>

  <my-modal id="demoModal" title="欢迎">
    <p>这是一个使用 Web Components 构建的模态框组件。</p>
    <p>它具有完整的样式封装和事件处理。</p>

    <div slot="footer">
      <my-button variant="secondary" id="cancelBtn">取消</my-button>
      <my-button variant="primary" id="confirmBtn">确认</my-button>
    </div>
  </my-modal>

  <script>
    const modal = document.getElementById('demoModal');

    document.getElementById('openModal').addEventListener('click', () => {
      modal.show();
    });

    document.getElementById('cancelBtn').addEventListener('click', () => {
      modal.close();
    });

    document.getElementById('confirmBtn').addEventListener('click', () => {
      alert('已确认！');
      modal.close();
    });

    modal.addEventListener('close', () => {
      console.log('模态框已关闭');
    });
  </script>
</body>
</html>
```

## 面试要点

### 核心概念问题

**Q: Web Components 的三大核心技术是什么？**

A: Custom Elements（定义自定义 HTML 标签）、Shadow DOM（提供 DOM 和样式封装）、HTML Templates（定义可复用模板）。

**Q: Shadow DOM 的 open 和 closed 模式有什么区别？**

A: `open` 模式允许通过 `element.shadowRoot` 从外部访问 Shadow DOM；`closed` 模式下 `shadowRoot` 返回 `null`，无法从外部直接访问。但 `closed` 并非真正的安全措施，仍可通过其他方式访问。

**Q: 如何在 Shadow DOM 中使用外部样式？**

A: 有三种方式：1）使用 CSS 自定义属性（CSS Variables）穿透 Shadow DOM；2）使用 `::part` 伪元素暴露可样式化的部分；3）使用 Constructable Stylesheets 共享样式表。

### 生命周期问题

**Q: Web Components 有哪些生命周期回调？**

A: `constructor`（创建时）、`connectedCallback`（插入 DOM 时）、`disconnectedCallback`（移除时）、`attributeChangedCallback`（属性变化时）、`adoptedCallback`（移动到新文档时）。

**Q: 为什么需要 observedAttributes 静态属性？**

A: 只有在 `observedAttributes` 中声明的属性变化时，`attributeChangedCallback` 才会被调用。这是一种性能优化，避免对所有属性变化都触发回调。

### 实践问题

**Q: 如何实现 Web Component 的双向数据绑定？**

```javascript
class TwoWayBinding extends HTMLElement {
  static get observedAttributes() { return ['value']; }

  get value() { return this._value; }
  set value(val) {
    this._value = val;
    this.setAttribute('value', val);
    this.dispatchEvent(new CustomEvent('input', { detail: { value: val } }));
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'value') this._value = newVal;
  }
}
```

**Q: Web Components 与 React/Vue 组件相比有何优劣？**

| 特性 | Web Components | 框架组件 |
|------|----------------|---------|
| 浏览器支持 | 原生支持 | 需要运行时 |
| 学习曲线 | 较陡（底层 API） | 较平缓 |
| 生态系统 | 较小 | 丰富 |
| 封装性 | 真正的 DOM 封装 | 虚拟封装 |
| 跨框架使用 | 天然支持 | 需要适配 |
| 状态管理 | 需自行实现 | 内置方案 |

### 高级问题

**Q: 如何处理 Web Components 的服务端渲染（SSR）？**

A: Web Components 本身依赖浏览器 API，但可以使用 Declarative Shadow DOM（声明式 Shadow DOM）实现 SSR：

```html
<my-component>
  <template shadowrootmode="open">
    <style>/* 样式 */</style>
    <div>预渲染内容</div>
  </template>
</my-component>
```

**Q: 如何优化 Web Components 的性能？**

1. 使用 Constructable Stylesheets 共享样式
2. 避免在 constructor 中进行 DOM 操作
3. 使用 `requestAnimationFrame` 批量更新
4. 实现虚拟列表处理大量数据
5. 使用 `IntersectionObserver` 实现懒加载

## 总结

Web Components 提供了一套强大的原生 API，用于创建可复用、封装良好的自定义元素。虽然学习曲线相对陡峭，但其框架无关性和真正的样式隔离使其成为构建跨项目组件库的理想选择。

核心要点：
1. 掌握 Custom Elements、Shadow DOM、HTML Templates 三大核心技术
2. 理解生命周期回调及其适用场景
3. 熟练运用 CSS 自定义属性实现主题化
4. 了解与主流框架的集成方式
5. 关注 Declarative Shadow DOM 等新特性的发展

随着浏览器支持的完善和相关工具链的成熟，Web Components 在微前端架构和设计系统中的应用将越来越广泛。
