---
title: JavaScript Shadow DOM 完全指南
description: 深入理解 Shadow DOM 的概念、原理、API 使用，掌握样式隔离、事件处理、插槽等核心特性
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - Shadow DOM
  - Web Components
  - 样式隔离
  - 组件化
status: imported
origin: old/src/content/docs/javascript/shadow-dom.zh.md
divergence: 0.324
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: Web Components
  order: 45
  lastUpdated: 2026-01-07
---

Shadow DOM 是 Web Components 的核心技术之一，提供了样式隔离、DOM 封装和组件化开发的能力。本文将深入探讨 Shadow DOM 的概念、原理、API 使用和最佳实践。

## 概念解释

### 什么是 Shadow DOM？

Shadow DOM 是一个浏览器规范，允许你在一个元素内部创建一个隔离的 DOM 树。这个隔离的树被称为"影子树"或"影子 DOM"，它与常规的 DOM（"光 DOM"）相分离。

**关键特点：**
- 样式隔离：Shadow DOM 内的样式不会影响外部 DOM，外部样式也不会影响 Shadow DOM
- DOM 隔离：Shadow DOM 的元素对外部 JavaScript 选择器隐藏
- 组件封装：可以创建真正的自包含组件
- 插槽机制：通过 `<slot>` 元素实现内容投影

### 光 DOM vs Shadow DOM

```javascript
// 光 DOM (Light DOM) - 常规 DOM
const container = document.getElementById('container');
const child = document.createElement('div');
child.textContent = '我是光 DOM';
container.appendChild(child);

// Shadow DOM - 隔离的 DOM
const host = document.getElementById('shadow-host');
const shadowRoot = host.attachShadow({ mode: 'open' });
const shadowChild = document.createElement('div');
shadowChild.textContent = '我是 Shadow DOM';
shadowRoot.appendChild(shadowChild);

// 在 Light DOM 中查找不到 Shadow DOM 的元素
console.log(container.querySelector('div')); // <div>我是光 DOM</div>
console.log(host.querySelector('div')); // null (被隐藏)
console.log(host.shadowRoot.querySelector('div')); // <div>我是 Shadow DOM</div>
```

### Shadow Root 模式

创建 Shadow DOM 时，有两种模式可选：

```javascript
// Open 模式：外部可以访问 Shadow DOM
const openShadow = element.attachShadow({ mode: 'open' });
console.log(element.shadowRoot); // 可以访问

// Closed 模式：外部无法访问 Shadow DOM
const closedShadow = element.attachShadow({ mode: 'closed' });
console.log(element.shadowRoot); // null
```

## 核心原理

### Shadow DOM 的结构

```
<host-element>
  <!-- Light DOM (light tree) -->
  <h1>Light DOM 内容</h1>
  #shadow-root (open)
    <!-- Shadow DOM (shadow tree) -->
    <style>
      :host {
        display: block;
      }
    </style>
    <div class="wrapper">
      <h2>Shadow DOM 内容</h2>
      <slot>默认内容</slot>
    </div>
</host-element>
```

### 样式隔离原理

Shadow DOM 使用的 CSS 样式规则：

```javascript
// 创建带样式的 Shadow DOM
class MyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        /* 这些样式只在 Shadow DOM 内生效 */
        :host {
          display: block;
          background: #f0f0f0;
          padding: 20px;
          border-radius: 8px;
        }

        :host(.dark-theme) {
          background: #333;
          color: #fff;
        }

        h2 {
          margin: 0 0 10px 0;
          color: #333;
        }

        p {
          margin: 0;
          line-height: 1.6;
        }
      </style>
      <h2><slot name="title">默认标题</slot></h2>
      <p><slot>默认内容</slot></p>
    `;
  }
}

customElements.define('my-card', MyCard);
```

### 事件冒泡和重新映射

```javascript
// Shadow DOM 内的事件会冒泡，但事件目标被重新映射
class EventTracker extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <button id="shadow-btn">Click me</button>
    `;

    const btn = this.shadowRoot.querySelector('#shadow-btn');
    btn.addEventListener('click', (e) => {
      console.log('Shadow DOM 内的事件目标:', e.target); // <button>
      console.log('事件当前目标:', e.currentTarget); // <button>
    });
  }
}

customElements.define('event-tracker', EventTracker);

// 外部监听
document.addEventListener('click', (e) => {
  console.log('外部捕获的目标:', e.target); // <event-tracker> (重新映射)
  console.log('事件路径:', e.composedPath()); // 完整的事件路径
});
```

## 核心要点

### 创建 Shadow DOM

```javascript
// 基本创建
const element = document.querySelector('.target');
const shadowRoot = element.attachShadow({ mode: 'open' });

// 添加内容
shadowRoot.innerHTML = '<p>Shadow DOM 内容</p>';

// 或使用 appendChild
const div = document.createElement('div');
div.textContent = '内容';
shadowRoot.appendChild(div);
```

### 插槽（Slots）机制

```javascript
// 定义带插槽的组件
class SlottedComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        .card {
          border: 1px solid #ddd;
          padding: 20px;
        }
      </style>
      <div class="card">
        <h2>
          <slot name="title">默认标题</slot>
        </h2>
        <div class="content">
          <slot>默认内容</slot>
        </div>
        <footer>
          <slot name="footer">© 2024</slot>
        </footer>
      </div>
    `;
  }
}

customElements.define('slotted-component', SlottedComponent);

// 使用
/*
<slotted-component>
  <span slot="title">自定义标题</span>
  <p>自定义内容</p>
  <span slot="footer">© 2025 版权所有</span>
</slotted-component>
*/
```

### Shadow DOM 样式策略

```javascript
class StyledComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // 方法一：内联样式
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary-color: #007bff;
          --border-radius: 4px;
        }

        button {
          background: var(--primary-color);
          border-radius: var(--border-radius);
          color: white;
          padding: 10px 20px;
          border: none;
          cursor: pointer;
        }

        button:hover {
          opacity: 0.8;
        }
      </style>
      <button><slot>Click</slot></button>
    `;
  }
}

customElements.define('styled-component', StyledComponent);
```

### 命名插槽和默认插槽

```javascript
class ComplexSlots extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        ::slotted(*) {
          /* 只能定义顶级插槽元素的样式 */
          margin: 10px 0;
        }

        ::slotted([slot="header"]) {
          font-size: 24px;
          font-weight: bold;
        }
      </style>
      <header>
        <slot name="header"></slot>
      </header>
      <main>
        <slot></slot>
      </main>
      <footer>
        <slot name="footer"></slot>
      </footer>
    `;

    // 监听插槽变化
    const slots = this.shadowRoot.querySelectorAll('slot');
    slots.forEach(slot => {
      slot.addEventListener('slotchange', () => {
        const nodes = slot.assignedNodes();
        console.log('插槽内容变化:', nodes);
      });
    });
  }
}

customElements.define('complex-slots', ComplexSlots);
```

## 代码示例

### 完整的自定义组件示例

```javascript
// 定义一个完整的 Modal 组件
class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --modal-bg: white;
          --modal-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .backdrop {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
        }

        .backdrop.active {
          display: block;
        }

        .modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--modal-bg);
          border-radius: 8px;
          box-shadow: var(--modal-shadow);
          min-width: 300px;
          z-index: 1000;
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.9);
          transition: all 0.3s ease;
        }

        .modal.active {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }

        .modal-header {
          padding: 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #333;
        }

        .modal-content {
          padding: 20px;
        }

        .modal-footer {
          padding: 20px;
          border-top: 1px solid #eee;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        ::slotted([slot="title"]) {
          margin: 0;
        }
      </style>

      <div class="backdrop"></div>
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">
            <slot name="title">Dialog</slot>
          </h2>
          <button class="close-btn" aria-label="Close">&times;</button>
        </div>
        <div class="modal-content">
          <slot></slot>
        </div>
        <div class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const closeBtn = this.shadowRoot.querySelector('.close-btn');
    const backdrop = this.shadowRoot.querySelector('.backdrop');

    closeBtn.addEventListener('click', () => this.close());
    backdrop.addEventListener('click', () => this.close());
  }

  open() {
    const modal = this.shadowRoot.querySelector('.modal');
    const backdrop = this.shadowRoot.querySelector('.backdrop');

    modal.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    const modal = this.shadowRoot.querySelector('.modal');
    const backdrop = this.shadowRoot.querySelector('.backdrop');

    modal.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  static get observedAttributes() {
    return ['open'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'open') {
      if (newValue !== null) {
        this.open();
      } else {
        this.close();
      }
    }
  }
}

customElements.define('modal-dialog', ModalDialog);
```

### 高级组件：带表单验证的输入框

```javascript
class ValidatedInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._value = '';
  }

  connectedCallback() {
    this.render();
    this.setupValidation();
  }

  render() {
    const label = this.getAttribute('label') || '';
    const type = this.getAttribute('type') || 'text';
    const required = this.hasAttribute('required');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --input-border: #ddd;
          --input-border-focus: #007bff;
          --error-color: #dc3545;
        }

        .wrapper {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        label {
          font-weight: 500;
          font-size: 14px;
        }

        label .required {
          color: var(--error-color);
        }

        input {
          padding: 10px;
          border: 2px solid var(--input-border);
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.3s;
        }

        input:focus {
          outline: none;
          border-color: var(--input-border-focus);
        }

        input.error {
          border-color: var(--error-color);
          background: #fff5f5;
        }

        .error-message {
          color: var(--error-color);
          font-size: 12px;
          min-height: 18px;
          display: none;
        }

        .error-message.show {
          display: block;
        }
      </style>

      <div class="wrapper">
        ${label ? '<label>' + label + (required ? '<span class="required">*</span>' : '') + '</label>' : ''}
        <input
          type="${type}"
          ${required ? 'required' : ''}
          placeholder="${this.getAttribute('placeholder') || ''}"
        />
        <div class="error-message"></div>
      </div>
    `;
  }

  setupValidation() {
    const input = this.shadowRoot.querySelector('input');
    const errorMessage = this.shadowRoot.querySelector('.error-message');

    input.addEventListener('input', (e) => {
      this._value = e.target.value;
      this.dispatchEvent(new CustomEvent('input', { detail: this._value }));
    });

    input.addEventListener('blur', () => {
      const error = this.validate();
      if (error) {
        input.classList.add('error');
        errorMessage.textContent = error;
        errorMessage.classList.add('show');
      } else {
        input.classList.remove('error');
        errorMessage.classList.remove('show');
      }
    });
  }

  validate() {
    const value = this._value.trim();
    const required = this.hasAttribute('required');
    const pattern = this.getAttribute('pattern');
    const minLength = this.getAttribute('minLength');

    if (required && !value) {
      return '此字段为必填项';
    }

    if (minLength && value.length < parseInt(minLength)) {
      return 'At least ' + minLength + ' characters required';
    }

    if (pattern && !new RegExp(pattern).test(value)) {
      return this.getAttribute('error-message') || '输入格式不正确';
    }

    return '';
  }

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
    const input = this.shadowRoot.querySelector('input');
    if (input) {
      input.value = val;
    }
  }
}

customElements.define('validated-input', ValidatedInput);
```

## 最佳实践

### 使用 CSS 变量实现可定制性

```javascript
class ThemeableCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-bg: #fff;
          --card-text: #333;
          --card-border: #eee;
          --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          --card-radius: 8px;
          --card-padding: 20px;
        }

        .card {
          background: var(--card-bg);
          color: var(--card-text);
          border: 1px solid var(--card-border);
          box-shadow: var(--card-shadow);
          border-radius: var(--card-radius);
          padding: var(--card-padding);
        }
      </style>
      <div class="card">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('themeable-card', ThemeableCard);
```

### 实现属性和特性的双向绑定

```javascript
class DataBoundInput extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'disabled', 'readonly'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupBindings();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        input:disabled {
          background: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }
      </style>
      <input type="text" />
    `;
  }

  setupBindings() {
    const input = this.shadowRoot.querySelector('input');

    input.value = this.getAttribute('value') || '';
    input.disabled = this.hasAttribute('disabled');
    input.readOnly = this.hasAttribute('readonly');

    input.addEventListener('change', () => {
      this.setAttribute('value', input.value);
    });

    input.addEventListener('input', (e) => {
      this.dispatchEvent(new CustomEvent('input', {
        detail: e.target.value,
        bubbles: true,
        composed: true
      }));
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    const input = this.shadowRoot?.querySelector('input');
    if (!input) return;

    switch (name) {
      case 'value':
        if (input.value !== newValue) {
          input.value = newValue || '';
        }
        break;
      case 'disabled':
        input.disabled = newValue !== null;
        break;
      case 'readonly':
        input.readOnly = newValue !== null;
        break;
    }
  }

  get value() {
    return this.getAttribute('value') || '';
  }

  set value(val) {
    this.setAttribute('value', val);
  }
}

customElements.define('data-bound-input', DataBoundInput);
```

### 正确处理事件委托

```javascript
class EventDelegatingComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        .button-group {
          display: flex;
          gap: 10px;
        }

        button {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        button:hover {
          background: #0056b3;
        }
      </style>
      <div class="button-group">
        <button data-action="save">保存</button>
        <button data-action="delete">删除</button>
        <button data-action="cancel">取消</button>
      </div>
    `;

    const group = this.shadowRoot.querySelector('.button-group');
    group.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        const action = e.target.dataset.action;
        this.dispatchEvent(new CustomEvent('action', {
          detail: { action },
          bubbles: true,
          composed: true
        }));
      }
    });
  }
}

customElements.define('event-delegating-component', EventDelegatingComponent);
```

### 实现生命周期钩子

```javascript
class LifecycleComponent extends HTMLElement {
  constructor() {
    super();
    console.log('1. constructor - 元素被创建');
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    console.log('2. connectedCallback - 元素插入到 DOM');
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div>
        <h1><slot name="title">标题</slot></h1>
        <p><slot>内容</slot></p>
      </div>
    `;
  }

  static get observedAttributes() {
    return ['title', 'active'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log('3. attributeChangedCallback - 属性变化: ' + oldValue + ' -> ' + newValue);
  }

  disconnectedCallback() {
    console.log('4. disconnectedCallback - 元素从 DOM 移除');
  }

  adoptedCallback() {
    console.log('5. adoptedCallback - 元素被移到新文档');
  }
}

customElements.define('lifecycle-component', LifecycleComponent);
```

## 常见陷阱

### 样式泄漏问题

```javascript
// 正确：明确指定样式
class GoodStyleComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        button {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-size: 16px;
          font-family: inherit;
          cursor: pointer;
        }
      </style>
      <button>Click me</button>
    `;
  }
}

customElements.define('good-style-component', GoodStyleComponent);
```

### 事件冒泡问题

```javascript
class EventSolutionComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <button id="inner-btn">Click</button>
    `;

    const btn = this.shadowRoot.querySelector('#inner-btn');
    btn.addEventListener('click', () => {
      // 正确：使用 composed: true 让事件穿过 Shadow DOM 边界
      this.dispatchEvent(new CustomEvent('action', {
        bubbles: true,
        composed: true,
        detail: { message: 'Button clicked' }
      }));
    });
  }
}

customElements.define('event-solution-component', EventSolutionComponent);
```

### 插槽内容选择问题

```javascript
class SlotStylingCorrect extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --slotted-color: black;
          --slotted-font-size: 16px;
        }

        ::slotted(*) {
          color: var(--slotted-color);
          font-size: var(--slotted-font-size);
        }
      </style>
      <slot></slot>
    `;
  }
}

customElements.define('slot-styling-correct', SlotStylingCorrect);
```

## 性能考量

### 减少 DOM 操作

```javascript
class EfficientComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        p {
          color: red;
          font-size: 16px;
        }
      </style>
      <div><p>文本</p></div>
    `;
  }
}

customElements.define('efficient-component', EfficientComponent);
```

### 使用 requestAnimationFrame 优化动画

```javascript
class AnimatedComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.animationId = null;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        .box {
          width: 100px;
          height: 100px;
          background: #007bff;
          margin: 20px;
        }
      </style>
      <div class="box"></div>
    `;

    this.setupAnimation();
  }

  setupAnimation() {
    const box = this.shadowRoot.querySelector('.box');
    let position = 0;

    const animate = () => {
      position += 5;
      box.style.transform = 'translateX(' + position + 'px)';

      if (position < 300) {
        this.animationId = requestAnimationFrame(animate);
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  disconnectedCallback() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

customElements.define('animated-component', AnimatedComponent);
```

### 懒加载内容

```javascript
class LazyLoadComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isLoaded = false;
    this.observer = null;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        .placeholder {
          width: 100%;
          height: 200px;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .content {
          padding: 20px;
        }
      </style>
      <div class="placeholder">加载中...</div>
    `;

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.isLoaded) {
        this.loadContent();
      }
    });

    this.observer.observe(this);
  }

  async loadContent() {
    this.isLoaded = true;

    try {
      const response = await fetch('/api/content');
      const data = await response.json();

      this.shadowRoot.innerHTML = `
        <style>
          .content {
            padding: 20px;
          }
        </style>
        <div class="content">
          <h2>${data.title}</h2>
          <p>${data.description}</p>
        </div>
      `;
    } catch (error) {
      console.error('加载失败:', error);
    }

    this.observer?.disconnect();
  }

  disconnectedCallback() {
    this.observer?.disconnect();
  }
}

customElements.define('lazy-load-component', LazyLoadComponent);
```

### 内存管理

```javascript
class MemoryManagedComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.listeners = [];
    this.timers = [];
  }

  connectedCallback() {
    this.render();
    this.attachListeners();
  }

  attachListeners() {
    const button = this.shadowRoot.querySelector('button');

    const clickHandler = () => console.log('clicked');
    button.addEventListener('click', clickHandler);

    this.listeners.push({ element: button, event: 'click', handler: clickHandler });

    const timerId = setTimeout(() => {
      console.log('timeout');
    }, 1000);

    this.timers.push(timerId);
  }

  render() {
    this.shadowRoot.innerHTML = '<button>Click me</button>';
  }

  disconnectedCallback() {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];

    this.timers.forEach(timerId => clearTimeout(timerId));
    this.timers = [];
  }
}

customElements.define('memory-managed-component', MemoryManagedComponent);
```

## 实战场景

### 场景 1：构建复杂的表单组件库

```javascript
class FormField extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['label', 'type', 'required', 'error'];
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const label = this.getAttribute('label') || '';
    const type = this.getAttribute('type') || 'text';
    const required = this.hasAttribute('required');
    const error = this.getAttribute('error');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --field-error-color: #dc3545;
          --field-success-color: #28a745;
        }

        .field {
          margin-bottom: 16px;
        }

        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          font-size: 14px;
        }

        input, textarea, select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          font-size: 14px;
          box-sizing: border-box;
        }

        input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .error-text {
          color: var(--field-error-color);
          font-size: 12px;
          margin-top: 4px;
          display: none;
        }

        .error-text.show {
          display: block;
        }
      </style>

      <div class="field">
        ${label ? '<label>' + label + (required ? '<span style="color: var(--field-error-color)">*</span>' : '') + '</label>' : ''}

        <input
          type="${type}"
          ${required ? 'required' : ''}
          placeholder="${this.getAttribute('placeholder') || ''}"
        />

        <div class="error-text ${error ? 'show' : ''}">
          ${error || ''}
        </div>
      </div>
    `;

    this.setupValidation();
  }

  setupValidation() {
    const input = this.shadowRoot.querySelector('input');
    const errorText = this.shadowRoot.querySelector('.error-text');

    input.addEventListener('blur', () => {
      const error = this.validate(input.value);

      if (error) {
        input.style.borderColor = '#dc3545';
        errorText.textContent = error;
        errorText.classList.add('show');
      } else {
        input.style.borderColor = '#ddd';
        errorText.classList.remove('show');
      }
    });

    input.addEventListener('input', () => {
      input.style.borderColor = '#ddd';
      errorText.classList.remove('show');
    });
  }

  validate(value) {
    const required = this.hasAttribute('required');
    const pattern = this.getAttribute('pattern');
    const minLength = this.getAttribute('minlength');
    const type = this.getAttribute('type');

    if (required && !value) {
      return '此字段为必填项';
    }

    if (minLength && value.length < parseInt(minLength)) {
      return 'At least ' + minLength + ' characters';
    }

    if (pattern && !new RegExp(pattern).test(value)) {
      return this.getAttribute('error-message') || '格式不正确';
    }

    if (type === 'email' && value && !this.isValidEmail(value)) {
      return '请输入有效的邮箱';
    }

    return '';
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'error' && this.shadowRoot) {
      const errorText = this.shadowRoot.querySelector('.error-text');
      if (newValue) {
        errorText.textContent = newValue;
        errorText.classList.add('show');
      } else {
        errorText.classList.remove('show');
      }
    } else {
      this.render();
    }
  }

  get value() {
    return this.shadowRoot?.querySelector('input')?.value || '';
  }

  set value(val) {
    const input = this.shadowRoot?.querySelector('input');
    if (input) input.value = val;
  }
}

customElements.define('form-field', FormField);
```

### 场景 2：数据列表组件

```javascript
class DataTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.data = [];
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const columns = JSON.parse(this.getAttribute('columns') || '[]');
    const thead = columns.map(col => '<th>' + col.label + '</th>').join('');

    const tbody = this.data
      .map(row => {
        const cells = columns.map(col => '<td>' + (row[col.key] || '') + '</td>').join('');
        return '<tr>' + cells + '</tr>';
      })
      .join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        th {
          background: #f5f5f5;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #ddd;
        }

        td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }

        tr:hover {
          background: #fafafa;
        }

        tr:last-child td {
          border-bottom: none;
        }
      </style>

      <table>
        <thead>
          <tr>${thead}</tr>
        </thead>
        <tbody>
          ${tbody || '<tr><td colspan="100%">No data</td></tr>'}
        </tbody>
      </table>
    `;
  }

  setData(data) {
    this.data = data;
    this.render();
  }

  addRow(row) {
    this.data.push(row);
    this.render();
  }

  removeRow(index) {
    this.data.splice(index, 1);
    this.render();
  }
}

customElements.define('data-table', DataTable);
```

## 面试要点

### Shadow DOM 的作用是什么？

**关键答案：**
- 样式隔离：组件内的样式不会影响外部，反之亦然
- DOM 隔离：隐藏 DOM 结构，防止意外修改
- 组件封装：创建真正的自包含组件
- 事件处理：事件可以受控地冒泡到外部

### Open vs Closed Shadow DOM 的区别？

```javascript
// Open：外部可以访问和修改
const open = element.attachShadow({ mode: 'open' });
console.log(element.shadowRoot); // 可访问

// Closed：外部无法访问，更加私有
const closed = element.attachShadow({ mode: 'closed' });
console.log(element.shadowRoot); // null
```

**区别总结：**
- Open：便于调试，外部可以访问 shadowRoot
- Closed：更加私有和安全，但调试困难

### 如何实现样式隔离和自定义？

使用 CSS 变量实现灵活定制，让外部可以覆盖特定的样式属性。

### 插槽（Slots）的作用？

插槽用于内容投影，允许父组件在组件的指定位置插入内容。

### 如何处理 Shadow DOM 中的事件？

关键：使用 composed: true 让事件穿过 Shadow DOM 边界，并使用 bubbles: true 让事件冒泡。

### Shadow DOM 性能考虑？

- 减少 Shadow DOM 的数量
- 避免过深的 DOM 树
- 使用 CSS 变量减少重排
- 实现懒加载
- 及时清理事件监听和定时器

## 延伸阅读

### 相关技术和概念

1. **Web Components 标准**
   - Custom Elements API
   - Template 和 Slot
   - HTML Imports

2. **CSS 高级特性**
   - CSS 变量（Custom Properties）
   - CSS Grid 和 Flexbox
   - CSS 伪元素（::slotted, ::part）

3. **性能优化**
   - Intersection Observer API
   - RequestAnimationFrame
   - 虚拟滚动

4. **框架整合**
   - React 中使用 Web Components
   - Vue 中的自定义元素
   - Angular 的组件

### 学习资源

- MDN Shadow DOM 文档
- Web Components 规范
- Can I Use - Shadow DOM

### 常用库和工具

- **Lit**：轻量级 Web Components 库
- **Polymer**：Google 的 Web Components 库
- **Stencil**：用于构建 Web Components 的编译器
- **Open WC**：Web Components 最佳实践

### 高阶话题

1. 插槽分布和事件重新映射
2. CSS 包含和性能隔离
3. 跨框架组件开发
4. Shadow DOM 调试工具
5. 可访问性 (A11y) 考虑
