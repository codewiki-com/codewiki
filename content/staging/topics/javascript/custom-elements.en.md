---
title: Custom Elements and Web Components
description: Master JavaScript Custom Elements and Web Components for building reusable, encapsulated UI components
track: javascript
section: browser
difficulty: advanced
tags:
  - JavaScript
  - Web Components
  - Custom Elements
  - Shadow DOM
  - HTML Templates
status: imported
origin: old/src/content/docs/javascript/custom-elements.en.md
divergence: 0.209
issues: []
legacy:
  category: JavaScript
  subcategory: Advanced
  order: 35
  lastUpdated: 2026-01-07
---

Web Components represent a fundamental shift in how we build reusable, encapsulated UI components on the web. Custom Elements are one of the core pillars of Web Components, allowing developers to define their own HTML tags with custom behavior and styling. We'll cover the complete landscape of Web Components, including Custom Elements, Shadow DOM, HTML Templates, and practical patterns for building production-grade components.

---

## Concept Explanation

### What are Web Components?

Web Components are a suite of different technologies that allow you to create reusable custom elements — with their functionality encapsulated away from the rest of your code — and utilize them in your web apps. They consist of four main technologies:

1. **Custom Elements**: APIs to define new HTML elements
2. **Shadow DOM**: Encapsulation for markup and styles
3. **HTML Templates**: Reusable markup definitions
4. **ES Modules**: Modular code organization

### What are Custom Elements?

Custom Elements allow you to create your own HTML tags with custom behavior. They are registered via the Custom Elements API and extend the capabilities of HTML. There are two types:

- **Autonomous Custom Elements**: Standalone elements that don't inherit from built-in HTML elements (e.g., `<my-button>`)
- **Customized Built-in Elements**: Elements that extend existing HTML elements (e.g., `class MyButton extends HTMLButtonElement`)

### The Shadow DOM

The Shadow DOM provides style and markup encapsulation. DOM and CSS inside a shadow tree are scoped to that tree and don't affect the rest of the page. This prevents style conflicts and allows for truly modular components.

---

## Core Principles

### Encapsulation

Encapsulation is the cornerstone of Web Components. It allows components to be self-contained with their own:

- **Markup structure**: Internal DOM doesn't leak to the parent
- **Styles**: CSS is scoped and doesn't affect other elements
- **Behavior**: JavaScript logic is isolated and event handlers are private

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
      <h2><slot name="title">Default Title</slot></h2>
      <p><slot>Default content</slot></p>
    `;
  }
}

customElements.define('my-card', MyCard);
```

### Reusability

Components should be self-contained and easily reusable across projects. Well-designed components:

- Don't depend on external frameworks
- Work in any JavaScript context
- Have clear, simple APIs
- Handle their own styling

### Composition

Web Components leverage composition over inheritance:

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

### Progressive Enhancement

Components should work gracefully even if JavaScript doesn't load or processes asynchronously:

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
        <slot>Click me</slot>
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

## Key Points

### Lifecycle Hooks

Custom Elements have specific lifecycle callbacks:

```javascript
class MyElement extends HTMLElement {
  // Called when element is created
  constructor() {
    super();
    console.log('Element constructed');
  }

  // Called when element is inserted into DOM
  connectedCallback() {
    console.log('Element connected to DOM');
    this.render();
  }

  // Called when element is removed from DOM
  disconnectedCallback() {
    console.log('Element removed from DOM');
  }

  // Called when attributes change
  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`Attribute ${name} changed`);
  }

  // Specify which attributes to observe
  static get observedAttributes() {
    return ['data-id', 'data-title', 'disabled'];
  }

  // Called when element is adopted to a new document
  adoptedCallback() {
    console.log('Element adopted to new document');
  }

  render() {
    this.textContent = 'Rendering...';
  }
}

customElements.define('my-element', MyElement);
```

### Attribute Observation

Observing attributes is crucial for reactive components:

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
    errorDiv.textContent = `Error: ${message}`;
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

### Slots and Projection

Slots allow parent components to inject content into custom elements:

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

### Shadow DOM Styling

Multiple ways to style Shadow DOM elements:

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

## Code Examples

### Example 1: Complete Todo Item Component

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
    deleteBtn.textContent = 'Delete';

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

### Example 2: Modal Dialog Component

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
    title.textContent = 'Dialog';
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

### Example 3: Form Validation Component

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
      error = 'This field is required';
    } else if (input.validity.patternMismatch) {
      error = this.getAttribute('pattern-message') || 'Invalid format';
    } else if (input.validity.typeMismatch) {
      error = `Please enter a valid ${this.getAttribute('type')}`;
    }

    if (error) {
      input.classList.add('error');
      errorMsg.textContent = error;
      validMsg.textContent = '';
      return false;
    } else {
      input.classList.remove('error');
      errorMsg.textContent = '';
      validMsg.textContent = 'Valid';
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

## Best Practices

### Design for Composition

Create small, focused components that do one thing well.

### Use Consistent Naming

Use a namespace prefix to avoid conflicts:

```javascript
customElements.define('my-app-button', MyAppButton);
customElements.define('my-app-card', MyAppCard);
customElements.define('my-app-modal', MyAppModal);
```

### Handle Attribute Updates Properly

Always use `attributeChangedCallback` for reactivity:

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

### Provide Proper Events

Dispatch meaningful events with proper bubbling and composition:

```javascript
this.dispatchEvent(new CustomEvent('select-change', {
  detail: { value },
  bubbles: true,
  composed: true
}));
```

### Clean Up Resources

Always disconnect listeners in `disconnectedCallback`:

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
    input.placeholder = 'Search...';

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

## Common Pitfalls

### Pitfall 1: Not Using observedAttributes

Without observing attributes, attribute changes won't trigger reactive updates.

### Pitfall 2: Memory Leaks in Async Operations

Check if component still exists before updating:

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
        div.textContent = 'Error loading data';
        this.shadowRoot.appendChild(div);
      }
    }
  }
}

customElements.define('data-component', DataComponent);
```

### Pitfall 3: XSS Vulnerabilities

Always escape user input:

```javascript
escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### Pitfall 4: Not Handling Shadow DOM Modes

Choose appropriate shadow DOM mode:

```javascript
// Closed mode - internals cannot be accessed
this.attachShadow({ mode: 'closed' });

// Open mode - internals can be accessed
this.attachShadow({ mode: 'open' });
```

---

## Performance Considerations

### Minimize Shadow DOM Queries

Cache element references instead of repeated queries.

### Batch DOM Updates

Use DocumentFragment for multiple additions:

```javascript
const fragment = document.createDocumentFragment();
items.forEach(item => {
  const div = document.createElement('div');
  div.textContent = item;
  fragment.appendChild(div);
});
this.shadowRoot.appendChild(fragment);
```

### Use CSS Containment

```javascript
style.textContent = `
  :host {
    contain: layout style paint;
  }
`;
```

### Lazy Render Large Lists

Consider virtual scrolling for performance with many items.

---

## Real-world Scenarios

### Scenario 1: Building a Reusable Component Library

Create components with clear APIs, proper documentation, and comprehensive examples.

### Scenario 2: Migrating Existing Code to Web Components

Incrementally convert existing components to Web Components while maintaining backward compatibility.

### Scenario 3: Integration with Frameworks

Web Components work alongside React, Vue, Angular, and other frameworks.

---

## Interview Points

### Question 1: What are the key differences between Custom Elements and Web Components?

Web Components is an umbrella term for four technologies: Custom Elements, Shadow DOM, HTML Templates, and ES Modules. Custom Elements is one part of Web Components.

### Question 2: Explain the difference between autonomous and customized built-in elements

Autonomous Custom Elements extend HTMLElement. Customized built-in elements extend existing HTML elements like HTMLButtonElement.

### Question 3: What is the Shadow DOM and why is it important?

The Shadow DOM provides encapsulation for markup and styles, preventing conflicts and allowing truly modular components.

### Question 4: How does slot work in Web Components?

Slots are placeholders in Shadow DOM that are filled with Light DOM content. Named slots allow selective content projection.

### Question 5: What lifecycle callbacks are available for Custom Elements?

constructor, connectedCallback, disconnectedCallback, attributeChangedCallback, and adoptedCallback.

### Question 6: How do you communicate between parent and child Web Components?

Via attributes, properties, custom events with bubbles/composed flags, or content projection through slots.

### Question 7: What does composed: true mean in events?

It allows custom events to bubble through shadow DOM boundaries, making them visible to parent components.

### Question 8: How do you handle styling in Web Components?

Via Shadow DOM styles, CSS Custom Properties, ::part pseudo-element, :host pseudo-class, and ::slotted selector.

---

## Further Reading

### Official Documentation
- MDN Web Components
- Custom Elements v1 Specification
- Shadow DOM v1 Specification

### Learning Resources
- Web.dev Web Components Guide
- Chrome DevTools Web Components Support

### Testing
- Testing Web Components
- Web Component Libraries (Lit, Stencil, Fast)

### Browser Support
- Custom Elements: All modern browsers
- Shadow DOM: All modern browsers
- HTML Templates: All modern browsers
