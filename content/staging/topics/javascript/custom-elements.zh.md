---
title: 自定义元素和 Web Components
description: 掌握 JavaScript 自定义元素和 Web Components，构建可复用的、封装的 UI 组件
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - Web Components
  - 自定义元素
  - Shadow DOM
  - HTML Templates
status: imported
origin: old/src/content/docs/javascript/custom-elements.zh.md
divergence: 0.209
issues: []
legacy:
  category: JavaScript
  subcategory: Advanced
  order: 35
  lastUpdated: 2026-01-07
---

Web Components 代表了在网络上构建可复用、封装的 UI 组件方式的根本转变。自定义元素是 Web Components 的核心支柱之一，允许开发者定义自己的 HTML 标签，并具有自定义的行为和样式。本指南探索 Web Components 的完整生态，包括自定义元素、Shadow DOM、HTML Templates 以及用于构建生产级组件的实际模式。

---

## 概念解释

### Web Components 是什么？

Web Components 是一套不同技术的集合，允许你创建可复用的自定义元素——其功能被封装在代码的其他部分之外——并在你的 Web 应用中使用它们。它们由四种主要技术组成：

1. **自定义元素**：用于定义新 HTML 元素的 API
2. **Shadow DOM**：用于标记和样式的封装
3. **HTML Templates**：可复用的标记定义
4. **ES Modules**：模块化代码组织

### 自定义元素是什么？

自定义元素允许你创建自己的 HTML 标签，具有自定义的行为。它们通过自定义元素 API 进行注册，并扩展 HTML 的功能。有两种类型：

- **独立自定义元素**：不继承内置 HTML 元素的独立元素（例如 `<my-button>`）
- **自定义内置元素**：扩展现有 HTML 元素的元素（例如 `class MyButton extends HTMLButtonElement`）

### Shadow DOM

Shadow DOM 提供了样式和标记的封装。Shadow 树内的 DOM 和 CSS 被限定在该树内，不会影响页面的其余部分。这防止了样式冲突，并允许真正的模块化组件。

---

## 核心原理

### 封装

封装是 Web Components 的基石。它允许组件是自包含的，具有自己的：

- **标记结构**：内部 DOM 不会泄漏到父元素
- **样式**：CSS 被限定，不会影响其他元素
- **行为**：JavaScript 逻辑被隔离，事件处理程序是私有的

```javascript
class MyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          border: 1px solid #ccc;
          padding: 16px;
          border-radius: 8px;
        }

        h2 {
          margin: 0 0 8px 0;
          color: #333;
        }

        p {
          margin: 0;
          color: #666;
        }
      </style>
      <h2><slot name="title">默认标题</slot></h2>
      <p><slot>默认内容</slot></p>
    `;
  }
}

customElements.define('my-card', MyCard);
```

### 可复用性

组件应该是自包含的，并易于在项目间复用。设计良好的组件：

- 不依赖于外部框架
- 在任何 JavaScript 环境中工作
- 有清晰、简单的 API
- 处理自己的样式

### 组合

Web Components 倾向于组合而不是继承：

```javascript
class DataTable extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const thead = this.querySelector('thead');
    const tbody = this.querySelector('tbody');

    this.shadowRoot.innerHTML = `
      <style>
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; font-weight: bold; }
      </style>
      <table>
        <slot name="thead"></slot>
        <slot name="tbody"></slot>
      </table>
    `;
  }
}

customElements.define('data-table', DataTable);
```

### 渐进式增强

组件应该即使在 JavaScript 未加载或异步处理时也能正常工作：

```javascript
class LoadingButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.renderButton();
    this.addEventListener('click', (e) => this.handleClick(e));
  }

  renderButton() {
    const isLoading = this.hasAttribute('loading');
    const disabled = this.hasAttribute('disabled') || isLoading;

    this.shadowRoot.innerHTML = `
      <style>
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background-color: #007bff;
          color: white;
          cursor: pointer;
          font-size: 14px;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        button:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
          margin-right: 6px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <button ${disabled ? 'disabled' : ''}>
        ${isLoading ? '<span class="spinner"></span>' : ''}
        <slot>点击我</slot>
      </button>
    `;
  }

  async handleClick(e) {
    const button = this.shadowRoot.querySelector('button');
    button.disabled = true;
    this.setAttribute('loading', '');

    try {
      await this.dispatchEvent(new CustomEvent('click', {
        bubbles: true,
        composed: true
      }));
    } finally {
      button.disabled = false;
      this.removeAttribute('loading');
      this.renderButton();
    }
  }

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
}

customElements.define('loading-button', LoadingButton);
```

---

## 关键要点

### 生命周期钩子

自定义元素有特定的生命周期回调：

```javascript
class MyElement extends HTMLElement {
  // 元素被创建时调用
  constructor() {
    super();
    console.log('元素已构造');
  }

  // 元素被插入 DOM 时调用
  connectedCallback() {
    console.log('元素已连接到 DOM');
    this.render();
  }

  // 元素从 DOM 中移除时调用
  disconnectedCallback() {
    console.log('元素已从 DOM 移除');
  }

  // 属性改变时调用
  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`属性 ${name} 已改变`);
  }

  // 指定要观察的属性
  static get observedAttributes() {
    return ['data-id', 'data-title', 'disabled'];
  }

  // 元素被采用到新文档时调用
  adoptedCallback() {
    console.log('元素已采用到新文档');
  }

  render() {
    this.textContent = '渲染中...';
  }
}

customElements.define('my-element', MyElement);
```

### 属性观察

观察属性对于响应式组件至关重要：

```javascript
class UserProfile extends HTMLElement {
  static get observedAttributes() {
    return ['user-id', 'theme'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'user-id') {
      this.loadUserData(newValue);
    } else if (name === 'theme') {
      this.applyTheme(newValue);
    }
  }

  connectedCallback() {
    const userId = this.getAttribute('user-id');
    if (userId) {
      this.loadUserData(userId);
    }
  }

  async loadUserData(userId) {
    try {
      const response = await fetch(`/api/users/${userId}`);
      const user = await response.json();
      this.render(user);
    } catch (error) {
      this.renderError(error.message);
    }
  }

  render(user) {
    const userDiv = document.createElement('div');
    userDiv.className = 'profile';
    userDiv.innerHTML = `
      <div class="name">${this.escapeHtml(user.name)}</div>
      <div class="email">${this.escapeHtml(user.email)}</div>
    `;
    this.shadowRoot.appendChild(userDiv);
  }

  renderError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = `错误：${message}`;
    this.shadowRoot.appendChild(errorDiv);
  }

  applyTheme(theme) {
    this.shadowRoot.host.style.setProperty('--theme', theme);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define('user-profile', UserProfile);
```

### Slots 和内容投影

Slots 允许父组件将内容注入到自定义元素中：

```javascript
class WizardStep extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const style = document.createElement('style');
    style.textContent = `
      .step {
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .step-header {
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 2px solid #f0f0f0;
      }
      .step-number {
        display: inline-block;
        width: 32px;
        height: 32px;
        line-height: 32px;
        text-align: center;
        background-color: #007bff;
        color: white;
        border-radius: 50%;
        font-weight: bold;
        margin-right: 8px;
      }
    `;

    const container = document.createElement('div');
    container.className = 'step';

    const header = document.createElement('div');
    header.className = 'step-header';
    const number = document.createElement('span');
    number.className = 'step-number';
    number.textContent = this.stepNumber;
    header.appendChild(number);

    const content = document.createElement('div');
    const slot = document.createElement('slot');
    slot.setAttribute('name', 'content');
    content.appendChild(slot);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);
    container.appendChild(header);
    container.appendChild(content);
  }

  get stepNumber() {
    return Array.from(this.parentElement.children).indexOf(this) + 1;
  }
}

customElements.define('wizard-step', WizardStep);
```

### Shadow DOM 样式

给 Shadow DOM 元素样式的多种方式：

```javascript
class StyledComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        --primary-color: #007bff;
        --padding: 16px;
        display: block;
      }

      :host(.dark-theme) {
        --primary-color: #0056b3;
      }

      :host {
        padding: var(--padding);
      }

      ::slotted([slot="title"]) {
        font-weight: bold;
        color: var(--primary-color);
      }

      .content {
        contain: layout;
      }

      @media (max-width: 600px) {
        :host {
          --padding: 8px;
        }
      }
    `;

    const content = document.createElement('div');
    content.className = 'content';
    const slot = document.createElement('slot');
    content.appendChild(slot);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(content);
  }

  setTheme(theme) {
    if (theme === 'dark') {
      this.classList.add('dark-theme');
    } else {
      this.classList.remove('dark-theme');
    }
  }
}

customElements.define('styled-component', StyledComponent);
```

---

## 代码示例

### 示例 1：完整的 Todo 项目组件

```javascript
class TodoItem extends HTMLElement {
  static get observedAttributes() {
    return ['data-id', 'data-text', 'data-completed'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  setupEventListeners() {
    const checkbox = this.shadowRoot.querySelector('input[type="checkbox"]');
    const deleteBtn = this.shadowRoot.querySelector('.delete-btn');

    if (checkbox) {
      checkbox.addEventListener('change', () => this.toggleComplete());
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.delete());
    }
  }

  render() {
    const id = this.getAttribute('data-id') || 'unknown';
    const text = this.getAttribute('data-text') || 'Untitled';
    const isCompleted = this.hasAttribute('data-completed');

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        margin-bottom: 8px;
      }

      .todo-item {
        display: flex;
        align-items: center;
        padding: 12px;
        background-color: white;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        gap: 12px;
      }

      .todo-item.completed {
        opacity: 0.6;
        background-color: #f9f9f9;
      }

      input[type="checkbox"] {
        flex-shrink: 0;
        cursor: pointer;
        width: 20px;
        height: 20px;
      }

      .todo-text {
        flex: 1;
        user-select: none;
      }

      .todo-item.completed .todo-text {
        text-decoration: line-through;
        color: #999;
      }

      .delete-btn {
        padding: 4px 8px;
        background-color: #ff4444;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }

      .delete-btn:hover {
        background-color: #cc0000;
      }

      .todo-id {
        font-size: 12px;
        color: #999;
      }
    `;

    const container = document.createElement('div');
    container.className = 'todo-item' + (isCompleted ? ' completed' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isCompleted;

    const textSpan = document.createElement('span');
    textSpan.className = 'todo-text';
    textSpan.textContent = text;

    const idSpan = document.createElement('span');
    idSpan.className = 'todo-id';
    idSpan.textContent = '#' + id;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '删除';

    container.appendChild(checkbox);
    container.appendChild(textSpan);
    container.appendChild(idSpan);
    container.appendChild(deleteBtn);

    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);
  }

  toggleComplete() {
    if (this.hasAttribute('data-completed')) {
      this.removeAttribute('data-completed');
    } else {
      this.setAttribute('data-completed', '');
    }

    this.dispatchEvent(new CustomEvent('todo-toggled', {
      detail: {
        id: this.getAttribute('data-id'),
        completed: this.hasAttribute('data-completed')
      },
      bubbles: true,
      composed: true
    }));
  }

  delete() {
    this.dispatchEvent(new CustomEvent('todo-deleted', {
      detail: { id: this.getAttribute('data-id') },
      bubbles: true,
      composed: true
    }));
    this.remove();
  }
}

customElements.define('todo-item', TodoItem);
```

### 示例 2：模态对话框组件

```javascript
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
    const style = document.createElement('style');
    style.textContent = `
      :host([open]) .backdrop {
        display: flex;
      }

      .backdrop {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .modal {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        width: 90%;
        max-width: 500px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .modal-header {
        padding: 16px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .modal-title {
        margin: 0;
        font-size: 18px;
        font-weight: bold;
      }

      .close-button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .close-button:hover {
        color: #000;
      }

      .modal-body {
        padding: 16px;
        flex: 1;
        overflow-y: auto;
      }

      .modal-footer {
        padding: 16px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `;

    const backdrop = document.createElement('div');
    backdrop.className = 'backdrop';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const header = document.createElement('div');
    header.className = 'modal-header';
    const title = document.createElement('h2');
    title.className = 'modal-title';
    title.textContent = '对话框';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.textContent = '×';

    header.appendChild(title);
    header.appendChild(closeBtn);

    const body = document.createElement('div');
    body.className = 'modal-body';
    const bodySlot = document.createElement('slot');
    body.appendChild(bodySlot);

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    const footerSlot = document.createElement('slot');
    footerSlot.setAttribute('name', 'footer');
    footer.appendChild(footerSlot);

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    backdrop.appendChild(modal);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(backdrop);
  }

  setupEventListeners() {
    const closeBtn = this.shadowRoot.querySelector('.close-button');
    const backdrop = this.shadowRoot.querySelector('.backdrop');

    closeBtn.addEventListener('click', () => this.close());
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.hasAttribute('open')) {
        this.close();
      }
    });
  }

  open() {
    this.setAttribute('open', '');
    this.dispatchEvent(new CustomEvent('modal-open', {
      bubbles: true,
      composed: true
    }));
  }

  close() {
    this.removeAttribute('open');
    this.dispatchEvent(new CustomEvent('modal-close', {
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('modal-dialog', ModalDialog);
```

### 示例 3：表单验证组件

```javascript
class FormField extends HTMLElement {
  static get observedAttributes() {
    return ['required', 'type', 'pattern', 'min', 'max'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.touched = false;
  }

  connectedCallback() {
    this.render();
    this.setupValidation();
  }

  render() {
    const name = this.getAttribute('name') || '';
    const label = this.getAttribute('label') || '';
    const type = this.getAttribute('type') || 'text';
    const required = this.hasAttribute('required');
    const placeholder = this.getAttribute('placeholder') || '';

    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        margin-bottom: 16px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      label {
        font-weight: 500;
        color: #333;
        font-size: 14px;
      }

      label::after {
        content: "${required ? ' *' : ''}";
        color: red;
      }

      input {
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.2s;
      }

      input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
      }

      input.error {
        border-color: #dc3545;
      }

      .error-message {
        color: #dc3545;
        font-size: 12px;
        min-height: 16px;
      }

      .valid-feedback {
        color: #28a745;
        font-size: 12px;
      }
    `;

    const group = document.createElement('div');
    group.className = 'form-group';

    const labelEl = document.createElement('label');
    labelEl.setAttribute('for', name);
    labelEl.textContent = label;

    const input = document.createElement('input');
    input.id = name;
    input.name = name;
    input.type = type;
    input.placeholder = placeholder;
    if (required) input.required = true;
    if (this.getAttribute('pattern')) input.pattern = this.getAttribute('pattern');
    if (this.getAttribute('min')) input.min = this.getAttribute('min');
    if (this.getAttribute('max')) input.max = this.getAttribute('max');

    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';

    const validMsg = document.createElement('div');
    validMsg.className = 'valid-feedback';

    group.appendChild(labelEl);
    group.appendChild(input);
    group.appendChild(errorMsg);
    group.appendChild(validMsg);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(group);
  }

  setupValidation() {
    const input = this.shadowRoot.querySelector('input');

    input.addEventListener('blur', () => {
      this.touched = true;
      this.validate();
    });

    input.addEventListener('input', () => {
      if (this.touched) {
        this.validate();
      }
    });
  }

  validate() {
    const input = this.shadowRoot.querySelector('input');
    const errorMsg = this.shadowRoot.querySelector('.error-message');
    const validMsg = this.shadowRoot.querySelector('.valid-feedback');

    let error = '';

    if (this.hasAttribute('required') && !input.value.trim()) {
      error = '此字段为必填项';
    } else if (input.validity.patternMismatch) {
      error = this.getAttribute('pattern-message') || '格式无效';
    } else if (input.validity.typeMismatch) {
      error = `请输入有效的 ${this.getAttribute('type')}`;
    }

    if (error) {
      input.classList.add('error');
      errorMsg.textContent = error;
      validMsg.textContent = '';
      return false;
    } else {
      input.classList.remove('error');
      errorMsg.textContent = '';
      validMsg.textContent = '有效';
      return true;
    }
  }

  getValue() {
    return this.shadowRoot.querySelector('input').value;
  }

  setValue(value) {
    const input = this.shadowRoot.querySelector('input');
    if (input) {
      input.value = value;
    }
  }

  isValid() {
    return this.validate();
  }
}

customElements.define('form-field', FormField);
```

---

## 最佳实践

### 设计组合

创建小型、专注的组件，做好一件事。

### 使用一致的命名

使用命名空间前缀来避免冲突：

```javascript
customElements.define('my-app-button', MyAppButton);
customElements.define('my-app-card', MyAppCard);
customElements.define('my-app-modal', MyAppModal);
```

### 正确处理属性更新

始终使用 `attributeChangedCallback` 实现响应性：

```javascript
class Counter extends HTMLElement {
  static get observedAttributes() {
    return ['value', 'min', 'max', 'step'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const value = parseInt(this.getAttribute('value')) || 0;
    const min = parseInt(this.getAttribute('min')) || 0;
    const max = parseInt(this.getAttribute('max')) || 100;

    const style = document.createElement('style');
    style.textContent = `
      .counter {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      button {
        padding: 4px 8px;
        border: 1px solid #ccc;
        background: white;
        cursor: pointer;
        border-radius: 4px;
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .value {
        min-width: 40px;
        text-align: center;
        font-weight: bold;
      }
    `;

    const container = document.createElement('div');
    container.className = 'counter';

    const decreaseBtn = document.createElement('button');
    decreaseBtn.textContent = '−';
    decreaseBtn.disabled = value <= min;
    decreaseBtn.className = 'decrease';

    const valueSpan = document.createElement('span');
    valueSpan.className = 'value';
    valueSpan.textContent = value;

    const increaseBtn = document.createElement('button');
    increaseBtn.textContent = '+';
    increaseBtn.disabled = value >= max;
    increaseBtn.className = 'increase';

    container.appendChild(decreaseBtn);
    container.appendChild(valueSpan);
    container.appendChild(increaseBtn);

    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);
  }

  setupEventListeners() {
    const decreaseBtn = this.shadowRoot.querySelector('.decrease');
    const increaseBtn = this.shadowRoot.querySelector('.increase');

    decreaseBtn.addEventListener('click', () => this.decrease());
    increaseBtn.addEventListener('click', () => this.increase());
  }

  decrease() {
    const step = parseInt(this.getAttribute('step')) || 1;
    const value = parseInt(this.getAttribute('value')) || 0;
    const min = parseInt(this.getAttribute('min')) || 0;
    const newValue = Math.max(value - step, min);
    this.setAttribute('value', newValue.toString());
  }

  increase() {
    const step = parseInt(this.getAttribute('step')) || 1;
    const value = parseInt(this.getAttribute('value')) || 0;
    const max = parseInt(this.getAttribute('max')) || 100;
    const newValue = Math.min(value + step, max);
    this.setAttribute('value', newValue.toString());
  }
}

customElements.define('my-counter', Counter);
```

### 提供正确的事件

分发有意义的事件，带有正确的冒泡和组合：

```javascript
this.dispatchEvent(new CustomEvent('select-change', {
  detail: { value },
  bubbles: true,
  composed: true
}));
```

### 清理资源

始终在 `disconnectedCallback` 中断开监听器：

```javascript
class SearchInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.debounceTimer = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  render() {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '搜索...';

    const style = document.createElement('style');
    style.textContent = `
      input {
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        width: 100%;
        font-size: 14px;
      }
    `;

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(input);
  }

  setupEventListeners() {
    const input = this.shadowRoot.querySelector('input');

    input.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);

      this.debounceTimer = setTimeout(() => {
        this.dispatchEvent(new CustomEvent('search', {
          detail: { query: e.target.value },
          bubbles: true,
          composed: true
        }));
      }, 300);
    });
  }
}

customElements.define('search-input', SearchInput);
```

---

## 常见陷阱

### 陷阱 1：不使用 observedAttributes

如果不观察属性，属性更改就不会触发响应式更新。

### 陷阱 2：异步操作中的内存泄漏

在更新前检查组件是否仍然存在：

```javascript
class DataComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isConnected = false;
  }

  connectedCallback() {
    this.isConnected = true;
    this.loadData();
  }

  disconnectedCallback() {
    this.isConnected = false;
  }

  async loadData() {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();

      if (this.isConnected) {
        const div = document.createElement('div');
        div.textContent = data;
        this.shadowRoot.appendChild(div);
      }
    } catch (error) {
      if (this.isConnected) {
        const div = document.createElement('div');
        div.textContent = '数据加载错误';
        this.shadowRoot.appendChild(div);
      }
    }
  }
}

customElements.define('data-component', DataComponent);
```

### 陷阱 3：XSS 漏洞

始终转义用户输入：

```javascript
escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### 陷阱 4：不处理 Shadow DOM 模式

选择合适的 shadow DOM 模式：

```javascript
// 封闭模式 - 无法访问内部
this.attachShadow({ mode: 'closed' });

// 开放模式 - 可以访问内部
this.attachShadow({ mode: 'open' });
```

---

## 性能考虑

### 最小化 Shadow DOM 查询

缓存元素引用，而不是重复查询。

### 批量 DOM 更新

对于多个添加操作，使用 DocumentFragment：

```javascript
const fragment = document.createDocumentFragment();
items.forEach(item => {
  const div = document.createElement('div');
  div.textContent = item;
  fragment.appendChild(div);
});
this.shadowRoot.appendChild(fragment);
```

### 使用 CSS Containment

```javascript
style.textContent = `
  :host {
    contain: layout style paint;
  }
`;
```

### 对大型列表进行延迟渲染

考虑对许多项目进行虚拟滚动以获得更好的性能。

---

## 实际场景

### 场景 1：构建可复用组件库

创建具有清晰 API、适当文档和全面示例的组件。

### 场景 2：将现有代码迁移到 Web Components

逐步将现有组件转换为 Web Components，同时保持向后兼容性。

### 场景 3：与框架集成

Web Components 可以与 React、Vue、Angular 和其他框架协同工作。

---

## 面试重点

### 问题 1：自定义元素和 Web Components 之间的关键区别是什么？

Web Components 是四种技术的总称：自定义元素、Shadow DOM、HTML Templates 和 ES Modules。自定义元素是 Web Components 的一部分。

### 问题 2：解释独立自定义元素和自定义内置元素之间的区别

独立自定义元素继承 HTMLElement。自定义内置元素继承现有 HTML 元素，如 HTMLButtonElement。

### 问题 3：什么是 Shadow DOM，为什么它很重要？

Shadow DOM 为标记和样式提供了封装，防止冲突，并允许真正的模块化组件。

### 问题 4：Web Components 中的 Slot 如何工作？

Slot 是 Shadow DOM 中的占位符，用 Light DOM 内容填充。命名 slot 允许选择性内容投影。

### 问题 5：自定义元素有哪些生命周期回调？

constructor、connectedCallback、disconnectedCallback、attributeChangedCallback 和 adoptedCallback。

### 问题 6：你如何在父子 Web Components 之间进行通信？

通过属性、属性、带有 bubbles/composed 标志的自定义事件，或通过 slot 进行内容投影。

### 问题 7：事件中 composed: true 是什么意思？

它允许自定义事件通过 shadow DOM 边界冒泡，使其对父组件可见。

### 问题 8：你如何在 Web Components 中处理样式？

通过 Shadow DOM 样式、CSS 自定义属性、::part 伪元素、:host 伪类和 ::slotted 选择器。

---

## 进一步阅读

### 官方文档
- MDN Web Components
- 自定义元素 v1 规范
- Shadow DOM v1 规范

### 学习资源
- Web.dev Web Components 指南
- Chrome DevTools Web Components 支持

### 测试
- Web Components 测试
- Web Component 库（Lit、Stencil、Fast）

### 浏览器支持
- 自定义元素：所有现代浏览器
- Shadow DOM：所有现代浏览器
- HTML Templates：所有现代浏览器
