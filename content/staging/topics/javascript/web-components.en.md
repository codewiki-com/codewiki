---
title: Web Components Complete Guide
description: Master native Web Components for reusable custom elements
track: javascript
section: browser
difficulty: advanced
tags:
  - Web Components
  - Custom Elements
  - Shadow DOM
  - Native
status: imported
origin: old/src/content/docs/frontend/web-components.en.md
divergence: 0.206
issues: []
legacy:
  category: Frontend
  subcategory: JavaScript
  order: 10
  lastUpdated: 2026-01-07
---

Web Components are a set of native browser technologies that allow developers to create reusable, well-encapsulated custom HTML elements. Their framework-agnostic nature makes them an ideal choice for building component libraries that can be shared across projects and teams. We dive deep into Web Components' core concepts, implementation techniques, and best practices.

## Overview and Browser Support

### What Are Web Components?

Web Components are a collection of Web platform APIs that consist of three core technologies:

1. **Custom Elements**: Allow you to define new HTML tags and their behavior
2. **Shadow DOM**: Provides DOM and CSS encapsulation and isolation
3. **HTML Templates**: Define reusable HTML fragments that are not rendered until instantiated

```javascript
// A simple Web Component example
class HelloWorld extends HTMLElement {
  constructor() {
    super();
    // Create Shadow DOM
    const shadow = this.attachShadow({ mode: 'open' });

    // Create elements using DOM API
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

// Register the custom element
customElements.define('hello-world', HelloWorld);
```

To use it, simply add to your HTML:

```html
<hello-world></hello-world>
```

### Browser Support

As of 2024, all modern browsers fully support Web Components:

| Browser | Custom Elements | Shadow DOM | HTML Templates |
|---------|-----------------|------------|----------------|
| Chrome | 54+ | 53+ | 35+ |
| Firefox | 63+ | 63+ | 59+ |
| Safari | 10.1+ | 10+ | 9+ |
| Edge | 79+ | 79+ | 13+ |

For projects that need to support older browsers, you can use the [webcomponentsjs](https://github.com/webcomponents/polyfills) polyfill:

```html
<script src="https://unpkg.com/@webcomponents/webcomponentsjs@2.8.0/webcomponents-loader.js"></script>
```

### Advantages of Web Components

1. **Framework Agnostic**: Can be used in any frontend framework or plain HTML
2. **Native Support**: No additional dependencies required, natively implemented by browsers
3. **True Encapsulation**: Shadow DOM provides style and DOM isolation
4. **Standardized**: Follows W3C standards with long-term stability
5. **Composability**: Components can be nested just like native HTML elements

## Custom Elements

### Defining Custom Elements

Custom elements come in two varieties:

1. **Autonomous custom elements**: Extend `HTMLElement` directly
2. **Customized built-in elements**: Extend specific HTML elements

```javascript
// Autonomous custom element
class MyCard extends HTMLElement {
  constructor() {
    super();
    // Initialize component
  }
}
customElements.define('my-card', MyCard);

// Customized built-in element (extending button)
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

Using customized built-in elements:

```html
<!-- Autonomous custom element -->
<my-card></my-card>

<!-- Customized built-in element -->
<button is="fancy-button">Click me</button>
```

### Naming Rules

Custom element names must follow these rules:

- Must contain a hyphen (-)
- Must start with a lowercase letter
- Cannot use reserved names (such as `font-face`, `annotation-xml`, etc.)

```javascript
// Valid names
customElements.define('user-profile', UserProfile);
customElements.define('app-header', AppHeader);
customElements.define('my-awesome-component', MyAwesomeComponent);

// Invalid names
customElements.define('userprofile', UserProfile); // Missing hyphen
customElements.define('User-Profile', UserProfile); // Starts with uppercase
```

### The customElements API

```javascript
// Define an element
customElements.define('my-element', MyElement);

// Get an element's constructor
const MyElement = customElements.get('my-element');

// Wait for element definition
await customElements.whenDefined('my-element');

// Check if element is defined
if (customElements.get('my-element')) {
  console.log('my-element is defined');
}

// Upgrade an element (manually trigger upgrade)
customElements.upgrade(element);
```

## Shadow DOM: Encapsulation and Isolation

### Understanding Shadow DOM

Shadow DOM is one of the most powerful features of Web Components, providing true DOM encapsulation:

```javascript
class EncapsulatedCard extends HTMLElement {
  constructor() {
    super();

    // Create Shadow Root
    // mode: 'open' - allows external access via shadowRoot
    // mode: 'closed' - prevents external access
    const shadow = this.attachShadow({ mode: 'open' });

    // Create style element
    const style = document.createElement('style');
    style.textContent = `
      /* These styles only affect Shadow DOM internals */
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

    // Create card container
    const card = document.createElement('div');
    card.className = 'card';

    const title = document.createElement('h2');
    title.textContent = 'Encapsulated Card';

    const content = document.createElement('p');
    content.textContent = 'External styles cannot affect this content';

    card.appendChild(title);
    card.appendChild(content);

    shadow.appendChild(style);
    shadow.appendChild(card);
  }
}

customElements.define('encapsulated-card', EncapsulatedCard);
```

### Open vs Closed Mode

```javascript
// Open mode - accessible via element.shadowRoot
class OpenComponent extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const p = document.createElement('p');
    p.textContent = 'Accessible content';
    shadow.appendChild(p);
  }
}

// Closed mode - shadowRoot returns null externally
class ClosedComponent extends HTMLElement {
  #shadowRoot; // Private property to store reference

  constructor() {
    super();
    this.#shadowRoot = this.attachShadow({ mode: 'closed' });
    const p = document.createElement('p');
    p.textContent = 'Closed content';
    this.#shadowRoot.appendChild(p);
  }
}

// Usage
const openEl = document.querySelector('open-component');
console.log(openEl.shadowRoot); // Returns ShadowRoot

const closedEl = document.querySelector('closed-component');
console.log(closedEl.shadowRoot); // Returns null
```

### Shadow DOM Boundaries and the :host Selector

```javascript
class ShadowBoundary extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      /* :host selector matches the host element */
      :host {
        display: block;
        border: 2px solid #ddd;
        padding: 16px;
      }

      /* When host element has a specific class */
      :host(.highlighted) {
        border-color: #4CAF50;
        background: #f0fff0;
      }

      /* When host element is within a specific context */
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

## HTML Templates and Slots

### Using the Template Element

The `<template>` element contains content that is not rendered when the page loads but can be used dynamically via JavaScript:

```html
<!-- Define template in HTML -->
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
    <h3 class="card-title"><slot name="title">Default Title</slot></h3>
    <div class="card-content">
      <slot>Default content</slot>
    </div>
  </article>
</template>
```

```javascript
class TemplateCard extends HTMLElement {
  constructor() {
    super();

    // Get the template
    const template = document.getElementById('card-template');
    const content = template.content.cloneNode(true);

    // Create Shadow DOM and append template content
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(content);
  }
}

customElements.define('template-card', TemplateCard);
```

### The Slots Mechanism

Slots allow you to project Light DOM content into the Shadow DOM:

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

      /* Style slotted content */
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
    defaultSidebarContent.textContent = 'Default sidebar content';
    sidebarSlot.appendChild(defaultSidebarContent);
    sidebar.appendChild(sidebarSlot);

    const main = document.createElement('main');
    main.className = 'main';

    const mainSlot = document.createElement('slot');
    const defaultMainContent = document.createElement('p');
    defaultMainContent.textContent = 'Default main content';
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

Using slots:

```html
<slot-demo>
  <nav slot="sidebar">
    <a href="#home">Home</a>
    <a href="#about">About</a>
    <a href="#contact">Contact</a>
  </nav>

  <!-- Unnamed content goes to the default slot -->
  <article>
    <h1>Main Content Area</h1>
    <p>This content is projected into the default slot.</p>
  </article>
</slot-demo>
```

### Listening for Slot Changes

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

    // Listen for slot content changes
    slot.addEventListener('slotchange', (e) => {
      const assignedNodes = slot.assignedNodes();
      console.log('Slot content updated:', assignedNodes);

      // Get assigned elements (excluding text nodes)
      const assignedElements = slot.assignedElements();
      console.log('Assigned elements:', assignedElements);
    });
  }
}

customElements.define('slot-observer', SlotObserver);
```

## Lifecycle Callbacks

### The Four Core Lifecycle Methods

```javascript
class LifecycleDemo extends HTMLElement {
  // 1. Constructor - called when element is created
  constructor() {
    super();
    console.log('constructor: Element created');

    // Suitable for:
    // - Creating Shadow DOM
    // - Initializing state
    // - Setting up internal event listeners

    this.attachShadow({ mode: 'open' });
    this._count = 0;
  }

  // 2. connectedCallback - called when element is inserted into DOM
  connectedCallback() {
    console.log('connectedCallback: Element inserted into DOM');

    // Suitable for:
    // - Fetching resources
    // - Setting up external event listeners
    // - Starting timers
    // - Rendering content

    this.render();
    this._interval = setInterval(() => {
      this._count++;
      this.render();
    }, 1000);
  }

  // 3. disconnectedCallback - called when element is removed from DOM
  disconnectedCallback() {
    console.log('disconnectedCallback: Element removed from DOM');

    // Suitable for:
    // - Cleaning up resources
    // - Removing event listeners
    // - Clearing timers

    if (this._interval) {
      clearInterval(this._interval);
    }
  }

  // 4. attributeChangedCallback - called when observed attributes change
  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`attributeChangedCallback: ${name} changed from "${oldValue}" to "${newValue}"`);

    // Handle attribute changes
    if (name === 'theme' && oldValue !== newValue) {
      this.updateTheme(newValue);
    }
  }

  // Must declare which attributes to observe
  static get observedAttributes() {
    return ['theme', 'disabled', 'size'];
  }

  // adoptedCallback - called when element is moved to a new document (rarely used)
  adoptedCallback() {
    console.log('adoptedCallback: Element moved to new document');
  }

  render() {
    const style = document.createElement('style');
    style.textContent = `.counter { font-size: 24px; font-weight: bold; }`;

    const counter = document.createElement('div');
    counter.className = 'counter';
    counter.textContent = `Count: ${this._count}`;

    this.shadowRoot.replaceChildren(style, counter);
  }

  updateTheme(theme) {
    this.shadowRoot.host.style.background =
      theme === 'dark' ? '#333' : '#fff';
  }
}

customElements.define('lifecycle-demo', LifecycleDemo);
```

### Lifecycle Execution Order

```javascript
// Create element
const el = document.createElement('lifecycle-demo');
// Output: constructor

// Insert into DOM
document.body.appendChild(el);
// Output: connectedCallback

// Modify attribute
el.setAttribute('theme', 'dark');
// Output: attributeChangedCallback

// Remove element
el.remove();
// Output: disconnectedCallback

// Re-insert
document.body.appendChild(el);
// Output: connectedCallback (called again)
```

## Attributes and Events

### Attributes vs Properties

```javascript
class AttributeProperty extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Internal state
    this._value = '';
  }

  // Declare observed attributes
  static get observedAttributes() {
    return ['value', 'disabled', 'placeholder'];
  }

  // Attribute change callback
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value') {
      this._value = newValue;
      this.render();
    }
  }

  // Property getter - called when reading property
  get value() {
    return this._value;
  }

  // Property setter - called when setting property
  set value(val) {
    this._value = val;
    // Sync to attribute (optional)
    this.setAttribute('value', val);
    this.render();
  }

  // Boolean attribute handling
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

    // Bind events
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

### Custom Events

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
    confirmBtn.textContent = 'Confirm';
    confirmBtn.dataset.action = 'confirm';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-danger';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.dataset.action = 'cancel';

    const handleClick = (e) => {
      const action = e.target.dataset.action;

      // Dispatch custom event
      this.dispatchEvent(new CustomEvent('action', {
        detail: {
          action,
          timestamp: Date.now()
        },
        bubbles: true,    // Event bubbles up
        composed: true    // Crosses Shadow DOM boundary
      }));
    };

    confirmBtn.addEventListener('click', handleClick);
    cancelBtn.addEventListener('click', handleClick);

    this.shadowRoot.replaceChildren(style, confirmBtn, cancelBtn);
  }
}

customElements.define('event-emitter', EventEmitter);

// Usage
document.querySelector('event-emitter').addEventListener('action', (e) => {
  console.log('Action received:', e.detail.action);
  console.log('Timestamp:', e.detail.timestamp);
});
```

### Event Bubbling and the composed Property

```javascript
class EventBubbling extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const btn = document.createElement('button');
    btn.id = 'inner-btn';
    btn.textContent = 'Click me';
    shadow.appendChild(btn);

    btn.addEventListener('click', () => {
      // composed: false - event will not cross Shadow DOM boundary
      this.dispatchEvent(new CustomEvent('internal-click', {
        bubbles: true,
        composed: false
      }));

      // composed: true - event will cross Shadow DOM boundary
      this.dispatchEvent(new CustomEvent('external-click', {
        bubbles: true,
        composed: true
      }));
    });
  }
}

customElements.define('event-bubbling', EventBubbling);

// Listening externally
const el = document.querySelector('event-bubbling');

// Only composed: true events can be captured externally
el.addEventListener('internal-click', () => {
  console.log('internal-click'); // Will not fire
});

el.addEventListener('external-click', () => {
  console.log('external-click'); // Will fire
});
```

## CSS Styling and Theming

### Shadow DOM Style Isolation

```javascript
class StyledComponent extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      /* Only affects Shadow DOM internals */
      * {
        box-sizing: border-box;
      }

      /* :host selects the host element */
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* Conditional :host */
      :host([hidden]) {
        display: none;
      }

      :host(:hover) {
        opacity: 0.9;
      }

      /* :host-context applies styles based on ancestor elements */
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

### Theming with CSS Custom Properties

```javascript
class ThemeableCard extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        /* Define CSS variables that can be overridden externally */
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

External theme customization:

```css
/* Global theme variables */
:root {
  --primary-color: #4CAF50;
  --secondary-color: #2196F3;
}

/* Dark theme */
.dark-theme themeable-card {
  --card-bg: #2d2d2d;
  --card-border: #444444;
  --card-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  --title-color: #ffffff;
  --content-color: #cccccc;
}

/* Compact mode */
themeable-card.compact {
  --card-padding: 12px;
  --title-size: 16px;
  --content-size: 14px;
}
```

### The ::part and ::slotted Pseudo-Elements

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

      /* ::slotted selector - styles slotted content */
      ::slotted(p) {
        margin: 0;
        padding: 10px;
      }

      ::slotted(.highlight) {
        background: yellow;
      }
    `;

    // Use part attribute to expose styleable parts
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

External styling using `::part`:

```css
/* Use ::part selector to style from outside */
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

### Constructable Stylesheets

```javascript
// Share styles using Constructable Stylesheets
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

## Framework Integration

### Using Web Components in React

```jsx
// MyWebComponent.jsx
import React, { useRef, useEffect } from 'react';

// First import the Web Component definition
import './my-custom-element.js';

function MyWebComponent({ value, onChange, children }) {
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;

    // Set properties (not attributes)
    if (element) {
      element.value = value;
    }
  }, [value]);

  useEffect(() => {
    const element = elementRef.current;

    // Listen for custom events
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

React wrapper factory function:

```jsx
// createReactWrapper.jsx
import React, { forwardRef, useRef, useEffect, useImperativeHandle } from 'react';

function createReactWrapper(tagName, eventNames = []) {
  return forwardRef(function ReactWrapper(props, ref) {
    const elementRef = useRef(null);

    // Expose native element reference
    useImperativeHandle(ref, () => elementRef.current);

    // Handle event bindings
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

    // Filter out event handlers, keep only regular attributes
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

// Usage
const MyButton = createReactWrapper('my-button', ['click', 'focus']);

function App() {
  return (
    <MyButton
      variant="primary"
      onClick={(e) => console.log('clicked', e.detail)}
    >
      Click me
    </MyButton>
  );
}
```

### Using Web Components in Vue

```vue
<!-- App.vue -->
<template>
  <div>
    <!-- Use Web Component directly -->
    <my-custom-input
      :value="inputValue"
      @change="handleChange"
      placeholder="Enter text..."
    />

    <!-- Using v-model (requires configuration) -->
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

Vue 3 custom element configuration:

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Treat all tags with my- prefix as custom elements
          isCustomElement: (tag) => tag.startsWith('my-')
        }
      }
    })
  ]
});
```

## Building a Component Library

### Component Library Architecture

```
my-components/
  src/
    core/
      base-component.js    # Base component class
      styles.js            # Shared styles
      utils.js             # Utility functions
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
    index.js               # Entry file
  dist/
  package.json
```

### Base Component Class

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

    // Clear and re-render
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

  // Convenience methods
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

### Button Component Example

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

    /* Loading state */
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

### Modal Component Example

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
    closeBtn.setAttribute('aria-label', 'Close');
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
    // Close button click
    this.$('.modal-close').addEventListener('click', () => {
      this.close();
    });

    // Overlay click to close
    this.$('.overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.close();
      }
    });

    // ESC key to close
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
    // Focus trap
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

### Using the Component Library

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Components Demo</title>
  <script type="module" src="./dist/my-components.js"></script>
  <style>
    /* Custom theme */
    :root {
      --btn-primary-bg: #6366f1;
      --btn-primary-hover: #4f46e5;
      --modal-radius: 16px;
    }
  </style>
</head>
<body>
  <my-button variant="primary" id="openModal">Open Modal</my-button>
  <my-button variant="outline" size="sm">Secondary Button</my-button>
  <my-button variant="secondary" loading>Loading</my-button>

  <my-modal id="demoModal" title="Welcome">
    <p>This is a modal component built with Web Components.</p>
    <p>It features complete style encapsulation and event handling.</p>

    <div slot="footer">
      <my-button variant="secondary" id="cancelBtn">Cancel</my-button>
      <my-button variant="primary" id="confirmBtn">Confirm</my-button>
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
      alert('Confirmed!');
      modal.close();
    });

    modal.addEventListener('close', () => {
      console.log('Modal closed');
    });
  </script>
</body>
</html>
```

## Interview Key Points

### Core Concept Questions

**Q: What are the three core technologies of Web Components?**

A: Custom Elements (define custom HTML tags), Shadow DOM (provides DOM and style encapsulation), and HTML Templates (define reusable templates).

**Q: What is the difference between open and closed mode in Shadow DOM?**

A: `open` mode allows external access via `element.shadowRoot`; `closed` mode returns `null` for `shadowRoot`, preventing direct external access. However, `closed` is not a true security measure and can still be accessed through other means.

**Q: How can you use external styles in Shadow DOM?**

A: Three approaches: 1) Use CSS custom properties (CSS Variables) to pierce Shadow DOM; 2) Use `::part` pseudo-element to expose styleable parts; 3) Use Constructable Stylesheets to share stylesheets.

### Lifecycle Questions

**Q: What lifecycle callbacks do Web Components have?**

A: `constructor` (on creation), `connectedCallback` (inserted into DOM), `disconnectedCallback` (removed from DOM), `attributeChangedCallback` (attribute changes), and `adoptedCallback` (moved to new document).

**Q: Why is the observedAttributes static property needed?**

A: Only attributes declared in `observedAttributes` trigger `attributeChangedCallback` when changed. This is a performance optimization to avoid triggering callbacks for all attribute changes.

### Practical Questions

**Q: How do you implement two-way data binding in a Web Component?**

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

**Q: What are the pros and cons of Web Components compared to React/Vue components?**

| Feature | Web Components | Framework Components |
|---------|----------------|---------------------|
| Browser Support | Native support | Requires runtime |
| Learning Curve | Steeper (low-level API) | Gentler |
| Ecosystem | Smaller | Rich |
| Encapsulation | True DOM encapsulation | Virtual encapsulation |
| Cross-framework | Native support | Requires adapters |
| State Management | Manual implementation | Built-in solutions |

### Advanced Questions

**Q: How do you handle Server-Side Rendering (SSR) with Web Components?**

A: Web Components depend on browser APIs, but you can use Declarative Shadow DOM for SSR:

```html
<my-component>
  <template shadowrootmode="open">
    <style>/* styles */</style>
    <div>Pre-rendered content</div>
  </template>
</my-component>
```

**Q: How do you optimize Web Components performance?**

1. Use Constructable Stylesheets to share styles
2. Avoid DOM operations in the constructor
3. Use `requestAnimationFrame` for batch updates
4. Implement virtual lists for large datasets
5. Use `IntersectionObserver` for lazy loading

## Further Reading

### Official Resources

- [MDN Web Components Guide](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Web Components Community Group](https://www.w3.org/community/webcomponents/)
- [Custom Elements Everywhere](https://custom-elements-everywhere.com/) - Framework compatibility testing

### Libraries and Tools

- [Lit](https://lit.dev/) - Simple library for building fast, lightweight web components
- [Stencil](https://stenciljs.com/) - Compiler for building reusable Web Components
- [Shoelace](https://shoelace.style/) - Professional component library built with Web Components
- [Open Web Components](https://open-wc.org/) - Recommendations and tools for Web Component development

### Advanced Topics

- [Declarative Shadow DOM](https://web.dev/declarative-shadow-dom/) - SSR support for Web Components
- [Form Associated Custom Elements](https://web.dev/more-capable-form-controls/) - Building form-compatible components
- [CSS Shadow Parts](https://css-tricks.com/styling-in-the-shadow-dom-with-css-shadow-parts/) - Advanced styling techniques

## Summary

Web Components provide a powerful set of native APIs for creating reusable, well-encapsulated custom elements. While the learning curve is relatively steep, their framework-agnostic nature and true style isolation make them an ideal choice for building cross-project component libraries.

Key takeaways:

1. Master the three core technologies: Custom Elements, Shadow DOM, and HTML Templates
2. Understand lifecycle callbacks and their appropriate use cases
3. Use CSS custom properties effectively for theming
4. Learn integration patterns with popular frameworks
5. Stay updated on new features like Declarative Shadow DOM

As browser support matures and tooling improves, Web Components are becoming increasingly prevalent in micro-frontend architectures and design systems. Their standardized nature ensures long-term compatibility and maintainability across diverse technology stacks.
