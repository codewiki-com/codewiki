---
title: "JavaScript Shadow DOM: Encapsulation and Component Isolation"
description: Master JavaScript Shadow DOM for building encapsulated, reusable web components with style and behavior isolation
track: javascript
section: browser
difficulty: advanced
tags:
  - shadow DOM
  - web components
  - encapsulation
  - DOM
  - CSS isolation
  - custom elements
status: imported
origin: old/src/content/docs/javascript/shadow-dom.en.md
divergence: 0.324
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: ""
  order: 45
  lastUpdated: 2026-01-07
---

The Shadow DOM is a fundamental technology for building modern web components, enabling developers to create encapsulated, reusable UI elements with isolated styles and markup. This comprehensive guide explores how Shadow DOM works, why it's essential for component development, and how to leverage it effectively in production applications.

---

## Concept Explanation

### What is Shadow DOM?

The Shadow DOM is a browser technology that allows you to attach a hidden DOM tree to regular DOM elements. This hidden tree (the shadow tree) is rendered separately from the main document tree, providing a scope for CSS styling and JavaScript isolation.

Think of it as creating a private DOM context within an element. Styles defined in the shadow tree don't leak into the main document, and selectors in the main document can't directly access elements within the shadow tree. This encapsulation is crucial for building reusable components that won't conflict with other styles or scripts on a page.

### Why Shadow DOM Matters

Consider a common web development problem: you build a custom date picker component that uses CSS class names like `.input` and `.button`. When you use this component on a page that already has global styles for `.input` and `.button`, the component breaks because the global styles override yours. Without Shadow DOM, you'd need to use obscure naming conventions (BEM, CSS-in-JS, CSS Modules) to avoid conflicts.

Shadow DOM solves this by creating a boundary where your component's styles are truly local. The same `.button` class inside your component won't conflict with any global `.button` styles.

### Shadow DOM vs. Virtual DOM

These are often confused but serve different purposes:

- **Shadow DOM**: A browser API for DOM encapsulation and scoping
- **Virtual DOM**: A JavaScript pattern (used by React, Vue) for efficiently updating the actual DOM

Shadow DOM is about encapsulation; Virtual DOM is about performance optimization. You can use them together.

---

## Core Principles

### Encapsulation

The primary purpose of Shadow DOM is encapsulation. It creates a boundary between your component and the rest of the document.

```javascript
// This element's styles won't escape
class MyComponent extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        padding: 16px;
        background: white;
      }
      button {
        background: blue;
        color: white;
      }
    `;
    shadow.appendChild(style);

    const button = document.createElement('button');
    button.textContent = 'Click me';
    shadow.appendChild(button);
  }
}
customElements.define('my-component', MyComponent);
```

The `button` styles are local to this component only.

### Open vs. Closed Shadow Trees

When you create a shadow root, you choose between two modes:

**Open Mode**: External code can access the shadow DOM
```javascript
const shadow = element.attachShadow({ mode: 'open' });
// External code can access: element.shadowRoot
```

**Closed Mode**: Shadow DOM is completely hidden from external code
```javascript
const shadow = element.attachShadow({ mode: 'closed' });
// element.shadowRoot is null for external code
```

Open mode is more flexible and is recommended in most cases. Closed mode provides stronger encapsulation but makes debugging harder.

### Slot-based Composition

Slots allow the host element to accept and distribute content from the light DOM (the regular DOM).

```javascript
class MyCard extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      .card {
        border: 1px solid #ccc;
        padding: 16px;
      }
      .header {
        font-weight: bold;
        margin-bottom: 8px;
      }
    `;
    shadow.appendChild(style);

    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'header';
    const headerSlot = document.createElement('slot');
    headerSlot.setAttribute('name', 'title');
    header.appendChild(headerSlot);

    const contentSlot = document.createElement('slot');

    card.appendChild(header);
    card.appendChild(contentSlot);
    shadow.appendChild(card);
  }
}
customElements.define('my-card', MyCard);
```

Usage:
```html
<my-card>
  <div slot="title">Card Title</div>
  <p>Card content goes here</p>
</my-card>
```

### Style Scoping

Styles in Shadow DOM are scoped by default. Pseudo-element selectors like `:host` target the host element itself.

```javascript
const shadow = element.attachShadow({ mode: 'open' });
const style = document.createElement('style');
style.textContent = `
  :host {
    /* Styles for the host element */
    display: block;
  }
  :host(.active) {
    /* Conditional styles based on class */
    background: blue;
  }
  :host-context(.dark-theme) {
    /* Styles based on ancestor context */
    background: #222;
    color: #fff;
  }
  ::slotted(h1) {
    /* Styles for slotted elements */
    color: red;
  }
`;
shadow.appendChild(style);
```

---

## Key Points

### Key Point 1: Event Retargeting

Events fired inside Shadow DOM get retargeted when they cross the shadow boundary. This prevents external code from knowing internal structure.

```javascript
const shadow = element.attachShadow({ mode: 'open' });
const button = document.createElement('button');
button.textContent = 'Click me';
shadow.appendChild(button);

button.addEventListener('click', (event) => {
  console.log(event.target); // The button itself
  console.log(event.composedPath()); // Full path including shadow
});

element.addEventListener('click', (event) => {
  console.log(event.target); // The host element, not the button
  console.log(event.composed); // Whether event crosses shadow boundary
});
```

### Key Point 2: CSS Custom Properties Penetrate Shadow Boundaries

While regular styles don't cross shadow boundaries, CSS custom properties (variables) do.

```javascript
// Light DOM (main document)
document.documentElement.style.setProperty('--primary-color', 'blue');

// Shadow DOM
const style = document.createElement('style');
style.textContent = `
  button {
    background: var(--primary-color); /* Inherits from light DOM */
  }
`;
shadow.appendChild(style);
```

### Key Point 3: innerHTML and Security

Shadow DOM content is separate from Light DOM, reducing XSS attack surface. Always use safe DOM methods to set content.

```javascript
class SafeComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setContent(text) {
    // Use textContent for plain text to avoid XSS
    this.shadowRoot.textContent = text;
  }

  // For HTML content, use createElement instead of innerHTML
  setHTMLContent(elements) {
    this.shadowRoot.textContent = '';
    elements.forEach(el => this.shadowRoot.appendChild(el));
  }
}
```

### Key Point 4: Traversal Methods Don't Cross Boundaries

Methods like `querySelector` don't cross shadow boundaries by default.

```javascript
const host = document.querySelector('my-component');
const button = host.querySelector('button'); // null - can't reach shadow DOM

// Must use shadowRoot:
const button = host.shadowRoot?.querySelector('button'); // Works
```

---

## Code Examples

### Example 1: Basic Custom Element with Shadow DOM

```javascript
class CustomButton extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    // Create style element
    const style = document.createElement('style');
    style.textContent = `
      :host {
        --button-padding: 12px 24px;
        --button-bg: #007bff;
        --button-color: white;
        --button-border-radius: 4px;
        --button-font-size: 16px;
        display: inline-block;
      }

      button {
        padding: var(--button-padding);
        background: var(--button-bg);
        color: var(--button-color);
        border: none;
        border-radius: var(--button-border-radius);
        font-size: var(--button-font-size);
        cursor: pointer;
        transition: opacity 0.2s;
      }

      button:hover {
        opacity: 0.9;
      }

      button:active {
        transform: scale(0.98);
      }

      :host([disabled]) button {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `;
    shadow.appendChild(style);

    // Create button element
    const button = document.createElement('button');
    button.type = 'button';
    const slot = document.createElement('slot');
    slot.textContent = 'Click me';
    button.appendChild(slot);
    shadow.appendChild(button);
  }

  connectedCallback() {
    const button = this.shadowRoot.querySelector('button');
    this._handleClick = () => {
      this.dispatchEvent(
        new CustomEvent('custom-click', {
          composed: true,
          bubbles: true
        })
      );
    };
    button.addEventListener('click', this._handleClick);
  }

  disconnectedCallback() {
    const button = this.shadowRoot.querySelector('button');
    button.removeEventListener('click', this._handleClick);
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(value) {
    if (value) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }
}

customElements.define('custom-button', CustomButton);
```

Usage:
```html
<custom-button>Submit</custom-button>
<custom-button disabled>Disabled Button</custom-button>

<script>
document.querySelector('custom-button').addEventListener('custom-click', () => {
  console.log('Button clicked!');
});
</script>
```

### Example 2: Component with Slots and Named Slots

```javascript
class Modal extends HTMLElement {
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
      :host {
        --modal-bg: white;
        --modal-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        --overlay-bg: rgba(0, 0, 0, 0.5);
      }

      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--overlay-bg);
        display: none;
        z-index: 1000;
      }

      .overlay.active {
        display: block;
      }

      .modal-content {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--modal-bg);
        border-radius: 8px;
        box-shadow: var(--modal-shadow);
        padding: 24px;
        max-width: 500px;
        width: 90%;
        z-index: 1001;
        display: none;
      }

      .modal-content.active {
        display: block;
      }

      .modal-header {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 16px;
      }

      .modal-body {
        margin-bottom: 24px;
      }

      .modal-footer {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        position: absolute;
        top: 8px;
        right: 8px;
      }
    `;
    this.shadowRoot.appendChild(style);

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    this.shadowRoot.appendChild(overlay);

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '×';
    modalContent.appendChild(closeBtn);

    const header = document.createElement('div');
    header.className = 'modal-header';
    const headerSlot = document.createElement('slot');
    headerSlot.setAttribute('name', 'header');
    headerSlot.textContent = 'Modal Title';
    header.appendChild(headerSlot);
    modalContent.appendChild(header);

    const body = document.createElement('div');
    body.className = 'modal-body';
    const bodySlot = document.createElement('slot');
    body.appendChild(bodySlot);
    modalContent.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    const footerSlot = document.createElement('slot');
    footerSlot.setAttribute('name', 'footer');
    footer.appendChild(footerSlot);
    modalContent.appendChild(footer);

    this.shadowRoot.appendChild(modalContent);
  }

  setupEventListeners() {
    const overlay = this.shadowRoot.querySelector('.overlay');
    const closeBtn = this.shadowRoot.querySelector('.close-btn');

    overlay.addEventListener('click', () => this.close());
    closeBtn.addEventListener('click', () => this.close());
  }

  open() {
    const overlay = this.shadowRoot.querySelector('.overlay');
    const modal = this.shadowRoot.querySelector('.modal-content');
    overlay.classList.add('active');
    modal.classList.add('active');
  }

  close() {
    const overlay = this.shadowRoot.querySelector('.overlay');
    const modal = this.shadowRoot.querySelector('.modal-content');
    overlay.classList.remove('active');
    modal.classList.remove('active');
  }
}

customElements.define('custom-modal', Modal);
```

Usage:
```html
<custom-modal id="myModal">
  <h2 slot="header">Confirm Action</h2>
  <p>Are you sure you want to proceed?</p>
  <div slot="footer">
    <button onclick="document.getElementById('myModal').close()">Cancel</button>
    <button onclick="console.log('Confirmed')">Confirm</button>
  </div>
</custom-modal>

<script>
document.getElementById('myModal').open();
</script>
```

### Example 3: Form Component with Validation

```javascript
class FormInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._value = '';
    this._valid = true;
  }

  connectedCallback() {
    this.render();
    this.setupValidation();
  }

  render() {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        --input-border: 1px solid #ccc;
        --input-border-focus: 1px solid #007bff;
        --error-color: #dc3545;
        --success-color: #28a745;
        display: block;
        margin-bottom: 16px;
      }

      label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #333;
      }

      input {
        width: 100%;
        padding: 10px;
        border: var(--input-border);
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.2s;
        box-sizing: border-box;
      }

      input:focus {
        outline: none;
        border: var(--input-border-focus);
      }

      input.invalid {
        border-color: var(--error-color);
        background: rgba(220, 53, 69, 0.05);
      }

      input.valid {
        border-color: var(--success-color);
      }

      .error-message {
        color: var(--error-color);
        font-size: 12px;
        margin-top: 4px;
        display: none;
      }

      .error-message.show {
        display: block;
      }
    `;
    this.shadowRoot.appendChild(style);

    const label = document.createElement('label');
    label.setAttribute('for', 'input');
    const labelSlot = document.createElement('slot');
    labelSlot.setAttribute('name', 'label');
    labelSlot.textContent = 'Input';
    label.appendChild(labelSlot);
    this.shadowRoot.appendChild(label);

    const input = document.createElement('input');
    input.id = 'input';
    input.type = 'text';
    this.shadowRoot.appendChild(input);

    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    this.shadowRoot.appendChild(errorMsg);
  }

  setupValidation() {
    const input = this.shadowRoot.querySelector('input');

    input.addEventListener('input', (e) => {
      this._value = e.target.value;
      this.validate();
    });

    // Copy attributes from host to input
    if (this.hasAttribute('placeholder')) {
      input.setAttribute('placeholder', this.getAttribute('placeholder'));
    }
    if (this.hasAttribute('type')) {
      input.setAttribute('type', this.getAttribute('type'));
    }
    if (this.hasAttribute('required')) {
      input.setAttribute('required', '');
    }
  }

  validate() {
    const input = this.shadowRoot.querySelector('input');
    const errorMsg = this.shadowRoot.querySelector('.error-message');
    const value = this._value;

    let isValid = true;
    let error = '';

    if (this.hasAttribute('required') && !value.trim()) {
      isValid = false;
      error = 'This field is required';
    } else if (this.hasAttribute('email') && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        error = 'Please enter a valid email';
      }
    } else if (this.hasAttribute('minlength')) {
      const minLength = parseInt(this.getAttribute('minlength'));
      if (value.length < minLength) {
        isValid = false;
        error = 'Minimum ' + minLength + ' characters required';
      }
    }

    this._valid = isValid;

    if (isValid) {
      input.classList.remove('invalid');
      input.classList.add('valid');
      errorMsg.classList.remove('show');
    } else {
      input.classList.add('invalid');
      input.classList.remove('valid');
      errorMsg.textContent = error;
      errorMsg.classList.add('show');
    }

    return isValid;
  }

  get value() {
    return this._value;
  }

  get valid() {
    return this._valid;
  }
}

customElements.define('form-input', FormInput);
```

Usage:
```html
<form>
  <form-input required placeholder="Enter your name">
    <span slot="label">Full Name</span>
  </form-input>

  <form-input email required placeholder="Enter your email">
    <span slot="label">Email</span>
  </form-input>

  <form-input minlength="8" placeholder="Enter password">
    <span slot="label">Password</span>
  </form-input>

  <button type="submit">Submit</button>
</form>

<script>
const form = document.querySelector('form');
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const inputs = form.querySelectorAll('form-input');
  let allValid = true;

  inputs.forEach(input => {
    if (!input.validate()) {
      allValid = false;
    }
  });

  if (allValid) {
    console.log('Form is valid!');
  }
});
</script>
```

### Example 4: Theming with CSS Custom Properties

```javascript
class ThemedComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.observeTheme();
  }

  render() {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        --primary-color: #007bff;
        --secondary-color: #6c757d;
        --text-color: #333;
        --bg-color: #fff;
      }

      :host(.dark-theme) {
        --primary-color: #0d6efd;
        --secondary-color: #adb5bd;
        --text-color: #f5f5f5;
        --bg-color: #222;
      }

      .container {
        padding: 20px;
        background: var(--bg-color);
        color: var(--text-color);
        border-radius: 8px;
      }

      .button {
        background: var(--primary-color);
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
    `;
    this.shadowRoot.appendChild(style);

    const container = document.createElement('div');
    container.className = 'container';

    const heading = document.createElement('h2');
    heading.textContent = 'Themed Component';
    container.appendChild(heading);

    const button = document.createElement('button');
    button.className = 'button';
    button.textContent = 'Click me';
    container.appendChild(button);

    const paragraph = document.createElement('p');
    paragraph.textContent = 'This component adapts to your theme preferences';
    container.appendChild(paragraph);

    this.shadowRoot.appendChild(container);
  }

  observeTheme() {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      if (e.matches) {
        this.classList.add('dark-theme');
      } else {
        this.classList.remove('dark-theme');
      }
    };

    darkModeQuery.addListener(handleChange);

    if (darkModeQuery.matches) {
      this.classList.add('dark-theme');
    }
  }

  setTheme(theme) {
    if (theme === 'dark') {
      this.classList.add('dark-theme');
    } else {
      this.classList.remove('dark-theme');
    }
  }
}

customElements.define('themed-component', ThemedComponent);
```

---

## Best Practices

### Best Practice 1: Use Open Shadow Roots by Default

Open shadow roots are easier to debug and allow external styling when needed. Only use closed mode if you have specific security requirements.

```javascript
// Good
this.attachShadow({ mode: 'open' });

// Avoid unless specifically needed
this.attachShadow({ mode: 'closed' });
```

### Best Practice 2: Leverage CSS Custom Properties

Pass styling configuration through CSS variables rather than hardcoding values.

```javascript
// Good
const style = document.createElement('style');
style.textContent = `
  button {
    color: var(--button-color, white);
    background: var(--button-bg, blue);
    padding: var(--button-padding, 10px 20px);
  }
`;
shadow.appendChild(style);

// Allow external customization
document.documentElement.style.setProperty('--button-color', 'green');
```

### Best Practice 3: Implement Lifecycle Hooks

Use lifecycle callbacks for proper resource management.

```javascript
class MyComponent extends HTMLElement {
  connectedCallback() {
    // Called when element is inserted into DOM
    this.init();
  }

  disconnectedCallback() {
    // Called when element is removed from DOM
    this.cleanup();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Called when observed attributes change
    if (name === 'disabled') {
      this.updateUI();
    }
  }

  static get observedAttributes() {
    return ['disabled', 'data-value'];
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  cleanup() {
    // Remove event listeners and intervals
  }
}
```

### Best Practice 4: Use Composed Events for Communication

Make events cross shadow boundaries to communicate with external code.

```javascript
// Inside shadow DOM
const button = this.shadowRoot.querySelector('button');
button.addEventListener('click', () => {
  this.dispatchEvent(
    new CustomEvent('button-clicked', {
      detail: { message: 'Button was clicked' },
      bubbles: true,      // Allows event to bubble up
      composed: true      // Allows crossing shadow boundary
    })
  );
});

// Outside
component.addEventListener('button-clicked', (e) => {
  console.log(e.detail.message);
});
```

### Best Practice 5: Document Public APIs

Create clear interfaces for your components.

```javascript
/**
 * CustomButton element
 *
 * Properties:
 * - disabled: boolean
 * - size: 'small' | 'medium' | 'large'
 *
 * Methods:
 * - click(): Triggers the button click
 * - focus(): Focuses the button
 *
 * Events:
 * - button-click: Fired when button is clicked
 *
 * CSS Variables:
 * - --button-bg: Button background color
 * - --button-color: Button text color
 * - --button-padding: Button padding
 */
class CustomButton extends HTMLElement {
  // Implementation...
}
```

### Best Practice 6: Use Slots for Flexible Content

Slots allow consumers to define structure while you control styling.

```javascript
// Good - flexible with slots
const contentSlot = document.createElement('slot');
const header = document.createElement('slot');
header.setAttribute('name', 'header');

// Create structure
const card = document.createElement('div');
card.appendChild(header);
card.appendChild(contentSlot);

// Avoid - fixed structure
const card = document.createElement('div');
const title = document.createElement('h1');
title.textContent = 'Card Title';
card.appendChild(title);
```

### Best Practice 7: Handle Errors Gracefully

Plan for edge cases and missing attributes.

```javascript
connectedCallback() {
  try {
    this.validate();
    this.render();
  } catch (error) {
    console.error('Component initialization failed:', error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = 'Failed to initialize';
    this.shadowRoot.appendChild(errorDiv);
  }
}

validate() {
  if (!this.hasAttribute('required-attr')) {
    throw new Error('required-attr attribute is missing');
  }
}
```

---

## Common Pitfalls

### Pitfall 1: Forgetting About Event Retargeting

**Problem**: Events cross shadow boundaries and get retargeted to the host element.

```javascript
// Incorrect - external handler
element.addEventListener('click', (e) => {
  console.log(e.target); // Shows the host, not the button inside
});

// Correct - check composed path
element.addEventListener('click', (e) => {
  console.log(e.composedPath()); // Shows full path including shadow elements
});
```

### Pitfall 2: Trying to Style Shadow DOM from Outside

**Problem**: External CSS can't directly style shadow DOM elements.

```javascript
// Won't work
<style>
  my-component button { color: red; }  /* Doesn't reach shadow DOM */
</style>

// Correct
<style>
  my-component {
    --button-color: red;  /* Use CSS variables */
  }
</style>
```

### Pitfall 3: Not Cleaning Up Event Listeners

**Problem**: Memory leaks from event listeners not removed when component unmounts.

```javascript
// Incorrect
connectedCallback() {
  window.addEventListener('resize', this.handleResize);
}

// Correct
connectedCallback() {
  this._handleResize = this.handleResize.bind(this);
  window.addEventListener('resize', this._handleResize);
}

disconnectedCallback() {
  window.removeEventListener('resize', this._handleResize);
}
```

### Pitfall 4: Assuming querySelector Works Across Boundaries

**Problem**: querySelector doesn't pierce through shadow boundaries.

```javascript
// Incorrect
const button = document.querySelector('my-component button'); // null

// Correct
const component = document.querySelector('my-component');
const button = component.shadowRoot?.querySelector('button');
```

### Pitfall 5: Accessing shadowRoot Without Null Checks

**Problem**: Closed shadow roots return null for shadowRoot.

```javascript
// Risky
const element = this.shadowRoot.querySelector('button');

// Safe
const element = this.shadowRoot?.querySelector('button');
```

### Pitfall 6: Breaking Accessibility

**Problem**: Shadow DOM can hide content from screen readers if not properly structured.

```javascript
// Incorrect - missing semantic markup
shadow.appendChild(document.createElement('div'));

// Correct - use semantic HTML and ARIA
const button = document.createElement('button');
button.setAttribute('role', 'button');
button.setAttribute('aria-label', 'Submit form');
```

---

## Performance Considerations

### Performance Tip 1: Minimize Reflows and Repaints

Shadow DOM elements can cause layout recalculations. Minimize DOM manipulation.

```javascript
// Inefficient - causes reflows
for (let i = 0; i < 100; i++) {
  this.shadowRoot.appendChild(createElement());  // 100 reflows
}

// Efficient - single reflow
const fragment = new DocumentFragment();
for (let i = 0; i < 100; i++) {
  fragment.appendChild(createElement());
}
this.shadowRoot.appendChild(fragment);  // 1 reflow
```

### Performance Tip 2: Use CSS Containment

Containment can improve performance by limiting browser optimization scope.

```javascript
const style = document.createElement('style');
style.textContent = `
  :host {
    contain: layout style paint;  /* Optimize rendering */
  }
`;
shadow.appendChild(style);
```

### Performance Tip 3: Lazy Load Shadow DOM

For components not immediately visible, defer initialization.

```javascript
connectedCallback() {
  // Use IntersectionObserver to detect visibility
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      this.render();
      observer.disconnect();
    }
  });
  observer.observe(this);
}
```

### Performance Tip 4: Cache querySelector Results

```javascript
// Inefficient
connectedCallback() {
  // These queries run every time
  this.shadowRoot.querySelector('.button').addEventListener('click', () => {});
  this.shadowRoot.querySelector('.input').addEventListener('input', () => {});
}

// Efficient
connectedCallback() {
  this._button = this.shadowRoot.querySelector('.button');
  this._input = this.shadowRoot.querySelector('.input');

  this._button.addEventListener('click', () => this.handleClick());
  this._input.addEventListener('input', () => this.handleInput());
}
```

### Performance Tip 5: Consider Bundle Size

Shadow DOM itself is lightweight, but component code adds up. Use code splitting.

```javascript
// Lazy load component definition
async function loadComponent() {
  const module = await import('./my-component.js');
  return module.MyComponent;
}
```

---

## Real-world Scenarios

### Scenario 1: Building a Design System Component Library

Shadow DOM is perfect for creating reusable design system components that won't conflict with application styles.

```javascript
class DesignButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.updateVariant();
  }

  render() {
    const variant = this.getAttribute('variant') || 'primary';

    const style = document.createElement('style');
    style.textContent = `
      :host {
        --button-height: 40px;
        --button-border-radius: 4px;
      }

      button {
        height: var(--button-height);
        border-radius: var(--button-border-radius);
        border: none;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        padding: 0 16px;
      }

      :host([variant="primary"]) button {
        background: #007bff;
        color: white;
      }

      :host([variant="secondary"]) button {
        background: #6c757d;
        color: white;
      }

      :host([variant="outline"]) button {
        background: transparent;
        border: 2px solid #007bff;
        color: #007bff;
      }

      button:hover {
        opacity: 0.9;
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `;
    this.shadowRoot.appendChild(style);

    const button = document.createElement('button');
    button.type = 'button';
    const slot = document.createElement('slot');
    button.appendChild(slot);
    this.shadowRoot.appendChild(button);
  }

  updateVariant() {
    this.shadowRoot.textContent = '';
    this.render();
  }

  static get observedAttributes() {
    return ['variant', 'disabled'];
  }

  attributeChangedCallback() {
    this.updateVariant();
  }
}

customElements.define('design-button', DesignButton);
```

### Scenario 2: Third-party Widget Embedding

Shadow DOM prevents third-party widgets from being affected by host page styles.

```javascript
class ChatWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.connectToServer();
  }

  render() {
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 350px;
        height: 500px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
        z-index: 10000;
      }

      .chat-container {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        overflow: hidden;
      }

      .messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      .input-area {
        padding: 16px;
        border-top: 1px solid #eee;
        display: flex;
        gap: 8px;
      }

      input {
        flex: 1;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      button {
        padding: 8px 16px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }
    `;
    this.shadowRoot.appendChild(style);

    const container = document.createElement('div');
    container.className = 'chat-container';

    const messages = document.createElement('div');
    messages.className = 'messages';
    messages.id = 'messages';
    container.appendChild(messages);

    const inputArea = document.createElement('div');
    inputArea.className = 'input-area';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Type a message...';
    inputArea.appendChild(input);

    const button = document.createElement('button');
    button.textContent = 'Send';
    inputArea.appendChild(button);

    container.appendChild(inputArea);
    this.shadowRoot.appendChild(container);
  }

  connectToServer() {
    // WebSocket connection, isolated from host
  }
}

customElements.define('chat-widget', ChatWidget);
```

### Scenario 3: Micro-frontend Architecture

Shadow DOM enables safe micro-frontend composition by isolating each micro-app.

```javascript
class MicroApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const appName = this.getAttribute('app');
    this.loadApp(appName);
  }

  async loadApp(appName) {
    try {
      const module = await import('/apps/' + appName + '/index.js');

      this.shadowRoot.textContent = '';
      const app = new module.App(this.shadowRoot);
      app.render();
    } catch (error) {
      this.renderError(error);
    }
  }

  renderError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'padding: 20px; color: red;';
    errorDiv.textContent = 'Failed to load ' + this.getAttribute('app') + ': ' + error.message;
    this.shadowRoot.appendChild(errorDiv);
  }
}

customElements.define('micro-app', MicroApp);
```

---

## Interview Points

### Question 1: What is Shadow DOM and Why is it Important?

**Expected Answer**: Shadow DOM is a browser API that allows encapsulation of DOM and styles within a separate tree. It's important because it prevents CSS and JavaScript conflicts in large applications by scoping styles locally to components.

**Deep Dive**: Explain event retargeting, style scoping, and how it differs from Virtual DOM.

### Question 2: Explain the Difference Between Open and Closed Shadow Roots

**Expected Answer**:
- **Open**: External code can access shadow DOM via `element.shadowRoot`
- **Closed**: Shadow DOM is hidden, `element.shadowRoot` returns null

**Recommendation**: Use open by default for better debugging and flexibility.

### Question 3: How Do CSS Custom Properties Work with Shadow DOM?

**Expected Answer**: CSS custom properties (variables) are inherited through the shadow boundary, allowing external styling without breaking encapsulation. Regular CSS rules can't cross the boundary, but variables can.

**Example**:
```javascript
/* Light DOM */
element { --color: blue; }
/* Shadow DOM can use: color: var(--color); */
```

### Question 4: What are Slots and Why Are They Useful?

**Expected Answer**: Slots are placeholders in shadow DOM that distribute light DOM content. They allow components to accept flexible content while maintaining style control. Named slots enable multi-slot distribution.

**Example**: Component defines `<slot name="header">`, consumer provides `<div slot="header">`.

### Question 5: How Do You Handle Events Crossing Shadow Boundaries?

**Expected Answer**: Events are retargeted when crossing shadow boundaries, showing the host element as the target. Use `event.composedPath()` to see the full path. Use `composed: true` when dispatching custom events.

### Question 6: What Are Common Security Considerations?

**Expected Answer**:
- Use safe DOM methods like createElement instead of innerHTML
- Shadow DOM provides encapsulation but doesn't prevent all attacks
- Use textContent for user-provided data when possible
- Consider using sanitization libraries like DOMPurify for HTML content

### Question 7: How Would You Style a Shadow DOM Component from the Light DOM?

**Expected Answer**: Use CSS custom properties (variables). Define variables in light DOM, use them in shadow DOM styles. `:host` pseudo-element can be styled from light DOM.

```css
/* Light DOM */
my-component {
  --primary-color: red;
}

/* Shadow DOM */
:host {
  color: var(--primary-color);
}
```

### Question 8: What Performance Optimizations Can You Apply?

**Expected Answer**:
- Use CSS containment
- Batch DOM updates with DocumentFragment
- Lazy load shadow DOM content
- Cache querySelector results
- Minimize reflows and repaints

---

## Further Reading

### Official Documentation
- [MDN: Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
- [MDN: Custom Elements API](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
- [Web Components Specification](https://html.spec.whatwg.org/multipage/custom-elements.html)

### Related Technologies
- **Web Components**: The broader standard including Custom Elements, Shadow DOM, and HTML Templates
- **Lit**: A lightweight library for building web components
- **Polymer**: Framework for building web components
- **Stencil**: Compiler for building web components
- **Custom Elements**: API for defining new HTML elements

### Best Practices Guides
- [Web Components Best Practices](https://www.webcomponents.org/articles/web-components-best-practices/)
- [Google: Web Components Guidelines](https://developers.google.com/web/fundamentals/web-components)

### Performance
- [CSS Containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Containment)
- [Measuring Web Component Performance](https://www.webcomponents.org/articles/web-components-best-practices/#performance)

### Tools and Frameworks
- **Lit**: https://lit.dev/
- **Stencil**: https://stenciljs.com/
- **Open Web Components**: https://open-wc.org/

---

## Summary

Shadow DOM is a powerful technology for building modern, encapsulated web components. By understanding its core concepts—encapsulation, slots, style scoping, and event handling—you can create reusable components that don't conflict with the rest of your application.

Key takeaways:
1. Use open shadow roots for flexibility and debuggability
2. Leverage CSS custom properties for external styling
3. Implement proper lifecycle management with `connectedCallback` and `disconnectedCallback`
4. Use slots for flexible content distribution
5. Always use safe DOM methods to prevent XSS vulnerabilities
6. Test accessibility with screen readers
7. Monitor performance with browser dev tools

Whether you're building a design system, creating micro-frontends, or developing a third-party widget, Shadow DOM provides the encapsulation and isolation needed for scalable, maintainable components.
