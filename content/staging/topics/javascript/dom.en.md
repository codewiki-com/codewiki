---
title: DOM Manipulation
description: Complete guide to JavaScript DOM manipulation, element selection, event handling and performance optimization
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - DOM
  - Browser
  - Events
status: imported
origin: old/src/content/docs/javascript/dom.en.md
divergence: 0.219
issues: []
legacy:
  category: JavaScript
  subcategory: Browser APIs
  order: 15
  lastUpdated: 2026-01-07
---

The Document Object Model (DOM) is a programming interface that represents HTML and XML documents as a tree structure. JavaScript can interact with this tree to dynamically read, modify, add, or remove elements and content. We'll cover essential DOM manipulation techniques with practical examples.

## Understanding the DOM Tree

The DOM represents an HTML document as a hierarchical tree of nodes. Each element, attribute, and piece of text becomes a node in this tree.

### Node Types

```javascript
// Common node types
const element = document.createElement('div');
const text = document.createTextNode('Hello');
const comment = document.createComment('This is a comment');

// Node type constants
console.log(Node.ELEMENT_NODE);   // 1
console.log(Node.TEXT_NODE);      // 3
console.log(Node.COMMENT_NODE);   // 8
console.log(Node.DOCUMENT_NODE);  // 9

// Checking node type
console.log(element.nodeType);     // 1
console.log(element.nodeName);     // 'DIV'
console.log(text.nodeType);        // 3
console.log(text.nodeValue);       // 'Hello'

// The document object
console.log(document.nodeType);           // 9
console.log(document.documentElement);    // <html> element
console.log(document.head);               // <head> element
console.log(document.body);               // <body> element
```

### DOM Tree Structure

```html
<!-- Example HTML structure -->
<!DOCTYPE html>
<html>
  <head>
    <title>My Page</title>
  </head>
  <body>
    <div id="container">
      <h1>Welcome</h1>
      <p class="intro">Hello, World!</p>
    </div>
  </body>
</html>
```

```javascript
// Visualizing the tree structure
const container = document.getElementById('container');

// Child nodes include text nodes (whitespace)
console.log(container.childNodes.length);  // May include text nodes

// Children only includes element nodes
console.log(container.children.length);    // 2 (h1 and p)

// Parent relationships
const heading = document.querySelector('h1');
console.log(heading.parentElement);        // <div id="container">
console.log(heading.parentNode);           // <div id="container">
```

## Selecting Elements

JavaScript provides multiple methods to select DOM elements, each suited for different use cases.

### getElementById

```javascript
// Select by unique ID (fastest method)
const header = document.getElementById('header');

// Returns null if not found
const notFound = document.getElementById('nonexistent');
console.log(notFound); // null

// IDs should be unique - only returns first match
const element = document.getElementById('myId');
```

### getElementsByClassName

```javascript
// Returns live HTMLCollection
const items = document.getElementsByClassName('item');

console.log(items.length);      // Number of matching elements
console.log(items[0]);          // First element
console.log(items.item(0));     // Also first element

// Multiple classes (space-separated)
const activeButtons = document.getElementsByClassName('btn active');

// Live collection - updates automatically
const container = document.getElementById('list');
console.log(items.length);  // 3

// Adding new element updates the collection
const newItem = document.createElement('div');
newItem.className = 'item';
container.appendChild(newItem);
console.log(items.length);  // 4 (automatically updated)

// Convert to array for array methods
const itemsArray = Array.from(items);
itemsArray.forEach(item => console.log(item));

// Or use spread operator
const itemsArray2 = [...items];
```

### getElementsByTagName

```javascript
// Returns live HTMLCollection
const paragraphs = document.getElementsByTagName('p');
const divs = document.getElementsByTagName('div');

// Get all elements
const allElements = document.getElementsByTagName('*');

// Search within an element
const container = document.getElementById('container');
const containerDivs = container.getElementsByTagName('div');

// Case insensitive
const inputs = document.getElementsByTagName('INPUT');
```

### querySelector and querySelectorAll

```javascript
// querySelector - returns first match (or null)
const firstButton = document.querySelector('button');
const submitBtn = document.querySelector('#submit-btn');
const activeItem = document.querySelector('.item.active');
const dataAttr = document.querySelector('[data-id="123"]');

// Complex selectors
const nestedLink = document.querySelector('nav ul li a.active');
const directChild = document.querySelector('div > p');
const sibling = document.querySelector('h1 + p');

// querySelectorAll - returns static NodeList
const allButtons = document.querySelectorAll('button');
const allItems = document.querySelectorAll('.item');

// NodeList supports forEach directly
allItems.forEach(item => {
  console.log(item.textContent);
});

// Static collection - does NOT update automatically
const items = document.querySelectorAll('.item');
console.log(items.length);  // 3

// Adding new element does not update the static NodeList
const newItem = document.createElement('div');
newItem.className = 'item';
document.body.appendChild(newItem);
console.log(items.length);  // Still 3 (static)

// Re-query to get updated list
const updatedItems = document.querySelectorAll('.item');
console.log(updatedItems.length);  // 4

// Pseudo-selectors work
const checked = document.querySelectorAll('input:checked');
const firstChild = document.querySelectorAll('li:first-child');
const nthChild = document.querySelectorAll('tr:nth-child(odd)');
const notDisabled = document.querySelectorAll('button:not(:disabled)');
```

### Specialized Selection Methods

```javascript
// Forms
const form = document.forms['loginForm'];
const formByIndex = document.forms[0];

// Form elements
const username = form.elements['username'];
const allFormElements = form.elements;

// Images
const images = document.images;

// Links
const links = document.links;

// Anchors with name attribute
const anchors = document.anchors;

// Using name attribute
const namedElements = document.getElementsByName('email');
```

### Selection Performance Comparison

```javascript
// Performance ranking (fastest to slowest):
// 1. getElementById - O(1) hash lookup
// 2. getElementsByClassName - fast, live collection
// 3. getElementsByTagName - fast, live collection
// 4. querySelector - parses selector, returns first
// 5. querySelectorAll - parses selector, returns all

// Cache selections for repeated use
// Bad - queries DOM every iteration
const container = document.querySelector('.container');
for (let i = 0; i < 1000; i++) {
  document.querySelector('.container').style.opacity = i / 1000;
}

// Good - cache the selection
const cachedContainer = document.querySelector('.container');
for (let i = 0; i < 1000; i++) {
  cachedContainer.style.opacity = i / 1000;
}
```

## Traversing the DOM

Navigate between nodes using parent, child, and sibling relationships.

### Parent Traversal

```javascript
const child = document.querySelector('.child');

// Direct parent
const parent = child.parentElement;
console.log(parent);

// parentNode vs parentElement
// parentElement returns null if parent is not an element
console.log(document.documentElement.parentNode);    // #document
console.log(document.documentElement.parentElement); // null

// Find closest ancestor matching selector
const closestDiv = child.closest('div');
const closestWithClass = child.closest('.container');
const closestById = child.closest('#main');

// closest() includes the element itself
const container = document.querySelector('.container');
console.log(container.closest('.container') === container); // true

// Returns null if no match
const notFound = child.closest('.nonexistent');
console.log(notFound); // null
```

### Child Traversal

```javascript
const parent = document.querySelector('.parent');

// All child nodes (includes text, comments)
const allNodes = parent.childNodes;  // NodeList

// Only element children
const elements = parent.children;    // HTMLCollection

// First and last
const firstChild = parent.firstElementChild;
const lastChild = parent.lastElementChild;

// Including text nodes
const firstNode = parent.firstChild;  // May be text node
const lastNode = parent.lastChild;    // May be text node

// Check for children
console.log(parent.hasChildNodes());    // true/false
console.log(parent.childElementCount);  // Number of element children

// Iterate children
for (const child of parent.children) {
  console.log(child.tagName);
}

// Using forEach with childNodes
parent.childNodes.forEach(node => {
  if (node.nodeType === Node.ELEMENT_NODE) {
    console.log(node.tagName);
  }
});
```

### Sibling Traversal

```javascript
const middle = document.querySelector('.middle');

// Next sibling element
const next = middle.nextElementSibling;

// Previous sibling element
const prev = middle.previousElementSibling;

// Including text nodes
const nextNode = middle.nextSibling;
const prevNode = middle.previousSibling;

// Get all siblings
function getSiblings(element) {
  const siblings = [];
  let sibling = element.parentElement.firstElementChild;

  while (sibling) {
    if (sibling !== element) {
      siblings.push(sibling);
    }
    sibling = sibling.nextElementSibling;
  }

  return siblings;
}

// Get all following siblings
function getNextSiblings(element) {
  const siblings = [];
  let sibling = element.nextElementSibling;

  while (sibling) {
    siblings.push(sibling);
    sibling = sibling.nextElementSibling;
  }

  return siblings;
}
```

### Traversal Utilities

```javascript
// Walk all descendants
function walkDOM(node, callback) {
  callback(node);

  node = node.firstElementChild;
  while (node) {
    walkDOM(node, callback);
    node = node.nextElementSibling;
  }
}

// Usage
walkDOM(document.body, element => {
  console.log(element.tagName);
});

// Find all ancestors
function getAncestors(element) {
  const ancestors = [];

  while (element.parentElement) {
    ancestors.push(element.parentElement);
    element = element.parentElement;
  }

  return ancestors;
}

// Check if element is descendant
function isDescendant(parent, child) {
  return parent.contains(child);
}
```

## Creating and Modifying Elements

Create new elements, modify existing ones, and manipulate the DOM structure.

### Creating Elements

```javascript
// Create element
const div = document.createElement('div');
const span = document.createElement('span');
const button = document.createElement('button');

// Create text node
const text = document.createTextNode('Hello, World!');

// Create document fragment (for batching)
const fragment = document.createDocumentFragment();

// Create element with attributes
const input = document.createElement('input');
input.type = 'text';
input.name = 'username';
input.placeholder = 'Enter username';
input.className = 'form-input';

// Create complex element using DOM methods (safer approach)
const card = document.createElement('div');
card.className = 'card';

const title = document.createElement('h2');
title.className = 'card-title';
title.textContent = 'Title';

const body = document.createElement('p');
body.className = 'card-body';
body.textContent = 'Content goes here';

const btn = document.createElement('button');
btn.className = 'card-btn';
btn.textContent = 'Click Me';

card.appendChild(title);
card.appendChild(body);
card.appendChild(btn);
```

### Inserting Elements

```javascript
const container = document.querySelector('.container');
const newElement = document.createElement('div');
newElement.textContent = 'New Element';

// Append as last child
container.appendChild(newElement);

// Modern append (multiple nodes, accepts strings)
const anotherElement = document.createElement('span');
container.append(newElement, ' Some text', anotherElement);

// Prepend as first child
container.prepend(newElement);

// Insert before specific element
const reference = document.querySelector('.reference');
container.insertBefore(newElement, reference);

// Insert after (no direct method, use nextSibling)
container.insertBefore(newElement, reference.nextSibling);

// insertAdjacentElement - precise positioning
const target = document.querySelector('.target');

// Before the element
target.insertAdjacentElement('beforebegin', newElement);

// As first child
target.insertAdjacentElement('afterbegin', newElement);

// As last child
target.insertAdjacentElement('beforeend', newElement);

// After the element
target.insertAdjacentElement('afterend', newElement);

// insertAdjacentText - insert text safely
target.insertAdjacentText('beforeend', 'Plain text content');
```

### Using innerHTML Safely

When you need to insert HTML content, be aware of security considerations:

```javascript
const container = document.querySelector('.container');

// SECURITY WARNING: Never use innerHTML with untrusted content
// Bad - vulnerable to XSS attacks
// container.innerHTML = userProvidedContent;

// Safe - only use with trusted, static content
const trustedStaticContent = '<strong>Bold</strong> text';
container.innerHTML = trustedStaticContent;

// Better approach for dynamic content - use textContent
container.textContent = userInput;  // Safe, escapes HTML

// For user content that needs HTML, use a sanitizer library
// Example with DOMPurify (recommended library):
// container.innerHTML = DOMPurify.sanitize(userContent);

// Template literals with trusted content only
const name = 'World';  // From trusted source
container.innerHTML = `<span>Hello, ${name}!</span>`;
```

### Removing Elements

```javascript
const element = document.querySelector('.remove-me');

// Modern remove method
element.remove();

// Legacy method (through parent)
element.parentNode.removeChild(element);

// Remove all children
const container = document.querySelector('.container');

// Method 1: Set textContent to empty
container.textContent = '';

// Method 2: Loop removal
while (container.firstChild) {
  container.removeChild(container.firstChild);
}

// Method 3: replaceChildren (modern)
container.replaceChildren();

// Remove and return element
const removed = container.removeChild(container.firstChild);
console.log(removed); // The removed element
```

### Replacing Elements

```javascript
const oldElement = document.querySelector('.old');
const newElement = document.createElement('div');
newElement.textContent = 'New content';

// Modern replaceWith
oldElement.replaceWith(newElement);

// Legacy method
oldElement.parentNode.replaceChild(newElement, oldElement);

// Replace multiple children
const container = document.querySelector('.container');
const newChildren = [
  document.createElement('div'),
  document.createElement('span')
];
container.replaceChildren(...newChildren);
```

### Cloning Elements

```javascript
const original = document.querySelector('.original');

// Shallow clone (element only, no children)
const shallowClone = original.cloneNode(false);

// Deep clone (includes all descendants)
const deepClone = original.cloneNode(true);

// Cloning removes ID (should be done manually if needed)
deepClone.id = 'cloned-element';

// Clone and modify
const template = document.querySelector('.template');
const clone = template.cloneNode(true);
clone.querySelector('.title').textContent = 'New Title';
clone.querySelector('.body').textContent = 'New content';
document.body.appendChild(clone);
```

### Modifying Content

```javascript
const element = document.querySelector('.content');

// Text content (no HTML parsing, safer)
element.textContent = 'Plain text content';
console.log(element.textContent); // Get text

// innerText (respects CSS, triggers reflow)
element.innerText = 'Visible text only';
console.log(element.innerText); // Returns visible text

// textContent vs innerText
// textContent: faster, returns all text including hidden
// innerText: slower, returns only visible text

const hidden = document.createElement('div');
const visibleSpan = document.createElement('span');
visibleSpan.textContent = 'Visible ';

const hiddenSpan = document.createElement('span');
hiddenSpan.style.display = 'none';
hiddenSpan.textContent = 'Hidden';

hidden.appendChild(visibleSpan);
hidden.appendChild(hiddenSpan);
document.body.appendChild(hidden);

console.log(hidden.textContent); // 'Visible Hidden'
console.log(hidden.innerText);   // 'Visible'
```

## Working with Attributes and Classes

Manipulate element attributes, classes, and styles.

### Attribute Methods

```javascript
const element = document.querySelector('.my-element');

// Get attribute
const id = element.getAttribute('id');
const href = element.getAttribute('href');
const dataValue = element.getAttribute('data-value');

// Set attribute
element.setAttribute('id', 'new-id');
element.setAttribute('title', 'Tooltip text');
element.setAttribute('data-id', '123');

// Check if attribute exists
const hasId = element.hasAttribute('id');
const hasDisabled = element.hasAttribute('disabled');

// Remove attribute
element.removeAttribute('title');
element.removeAttribute('disabled');

// Toggle attribute
element.toggleAttribute('disabled');        // Toggle
element.toggleAttribute('hidden', true);    // Force add
element.toggleAttribute('hidden', false);   // Force remove

// Get all attributes
const attrs = element.attributes;
for (const attr of attrs) {
  console.log(`${attr.name}: ${attr.value}`);
}

// Direct property access (for standard attributes)
const input = document.querySelector('input');
input.value = 'New value';
input.disabled = true;
input.checked = true;
console.log(input.type);
```

### Data Attributes

```javascript
// HTML: <div id="user" data-user-id="123" data-role="admin">
const user = document.getElementById('user');

// Access via dataset
console.log(user.dataset.userId);  // '123' (camelCase)
console.log(user.dataset.role);    // 'admin'

// Set data attributes
user.dataset.status = 'active';    // Creates data-status
user.dataset.lastLogin = '2024-01-15';  // data-last-login

// Delete data attribute
delete user.dataset.status;

// Check for data attribute
if ('userId' in user.dataset) {
  console.log('Has user ID');
}

// Iterate all data attributes
for (const [key, value] of Object.entries(user.dataset)) {
  console.log(`${key}: ${value}`);
}

// Use with getAttribute/setAttribute
user.setAttribute('data-custom', 'value');
console.log(user.getAttribute('data-custom'));
```

### Class Manipulation

```javascript
const element = document.querySelector('.box');

// classList API
element.classList.add('active');
element.classList.add('highlight', 'visible');  // Multiple classes

element.classList.remove('inactive');
element.classList.remove('old', 'deprecated');  // Multiple classes

// Toggle class
element.classList.toggle('active');              // Toggle
element.classList.toggle('disabled', true);      // Force add
element.classList.toggle('disabled', false);     // Force remove

// Check for class
const isActive = element.classList.contains('active');

// Replace class
element.classList.replace('old-class', 'new-class');

// Get all classes
console.log(element.classList.length);
console.log(element.classList.item(0));   // First class
console.log([...element.classList]);      // Array of classes

// Iterate classes
element.classList.forEach(className => {
  console.log(className);
});

// className property (full string)
console.log(element.className);           // 'box active highlight'
element.className = 'new-class';          // Replace all
element.className += ' another-class';    // Append (careful with spaces)

// Conditional class application
function setActiveState(element, isActive) {
  element.classList.toggle('active', isActive);
  element.classList.toggle('inactive', !isActive);
}
```

### Style Manipulation

```javascript
const element = document.querySelector('.styled');

// Inline styles (camelCase)
element.style.backgroundColor = 'blue';
element.style.fontSize = '16px';
element.style.marginTop = '20px';
element.style.display = 'flex';

// CSS custom properties
element.style.setProperty('--main-color', 'red');
element.style.getPropertyValue('--main-color');
element.style.removeProperty('--main-color');

// Remove inline style
element.style.backgroundColor = '';  // Removes property
element.style.removeProperty('background-color');

// Set multiple styles
Object.assign(element.style, {
  color: 'white',
  padding: '10px',
  border: '1px solid black'
});

// Get computed styles (final styles after CSS cascade)
const computed = window.getComputedStyle(element);
console.log(computed.backgroundColor);  // rgb(0, 0, 255)
console.log(computed.fontSize);         // '16px'
console.log(computed.getPropertyValue('margin-top'));

// Get pseudo-element styles
const beforeStyles = window.getComputedStyle(element, '::before');
console.log(beforeStyles.content);

// Check if style is set inline
console.log(element.style.cssText);  // All inline styles

// Set entire style attribute
element.style.cssText = 'color: red; font-size: 20px;';
element.setAttribute('style', 'color: red; font-size: 20px;');
```

### Dimensions and Position

```javascript
const element = document.querySelector('.box');

// Offset dimensions (includes borders)
console.log(element.offsetWidth);   // Width + padding + border
console.log(element.offsetHeight);  // Height + padding + border
console.log(element.offsetTop);     // Distance from offset parent
console.log(element.offsetLeft);    // Distance from offset parent
console.log(element.offsetParent);  // Nearest positioned ancestor

// Client dimensions (excludes scrollbar)
console.log(element.clientWidth);   // Width + padding (no border/scrollbar)
console.log(element.clientHeight);  // Height + padding
console.log(element.clientTop);     // Top border width
console.log(element.clientLeft);    // Left border width

// Scroll dimensions
console.log(element.scrollWidth);   // Full scrollable width
console.log(element.scrollHeight);  // Full scrollable height
console.log(element.scrollTop);     // Scrolled from top
console.log(element.scrollLeft);    // Scrolled from left

// Set scroll position
element.scrollTop = 100;
element.scrollTo(0, 100);
element.scrollBy(0, 50);  // Relative scroll

// getBoundingClientRect (relative to viewport)
const rect = element.getBoundingClientRect();
console.log(rect.top);      // Distance from viewport top
console.log(rect.left);     // Distance from viewport left
console.log(rect.bottom);   // Distance from viewport top to element bottom
console.log(rect.right);    // Distance from viewport left to element right
console.log(rect.width);    // Element width
console.log(rect.height);   // Element height
console.log(rect.x);        // Same as left
console.log(rect.y);        // Same as top

// Get position relative to document
function getDocumentPosition(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX
  };
}
```

## Event Handling

JavaScript events enable interactive web applications by responding to user actions and browser events.

### Adding Event Listeners

```javascript
const button = document.querySelector('.btn');

// addEventListener (recommended)
button.addEventListener('click', function(event) {
  console.log('Button clicked!');
  console.log(event.target);  // The clicked element
});

// Named function (allows removal)
function handleClick(event) {
  console.log('Clicked:', event.type);
}

button.addEventListener('click', handleClick);

// Arrow function
button.addEventListener('click', (e) => {
  console.log('Arrow function handler');
});

// Options object
button.addEventListener('click', handleClick, {
  once: true,      // Remove after first invocation
  passive: true,   // Never calls preventDefault
  capture: true    // Use capture phase
});

// Multiple events on same element
button.addEventListener('mouseenter', () => console.log('Mouse enter'));
button.addEventListener('mouseleave', () => console.log('Mouse leave'));

// Same handler for multiple events
['click', 'touchstart'].forEach(eventType => {
  button.addEventListener(eventType, handleClick);
});
```

### Removing Event Listeners

```javascript
const button = document.querySelector('.btn');

function handleClick(event) {
  console.log('Clicked!');
}

// Add listener
button.addEventListener('click', handleClick);

// Remove listener (must use same function reference)
button.removeEventListener('click', handleClick);

// This won't work (different function reference)
button.addEventListener('click', function() { console.log('Hi'); });
button.removeEventListener('click', function() { console.log('Hi'); }); // No effect

// AbortController for cleanup
const controller = new AbortController();

button.addEventListener('click', handleClick, {
  signal: controller.signal
});

// Remove all listeners using this signal
controller.abort();

// Practical cleanup pattern
class Component {
  constructor(element) {
    this.element = element;
    this.controller = new AbortController();
    this.init();
  }

  init() {
    this.element.addEventListener('click', this.handleClick.bind(this), {
      signal: this.controller.signal
    });
  }

  handleClick(e) {
    console.log('Clicked');
  }

  destroy() {
    this.controller.abort();  // Removes all listeners
  }
}
```

### Event Object

```javascript
document.addEventListener('click', function(event) {
  // Event type
  console.log(event.type);  // 'click'

  // Target elements
  console.log(event.target);         // Element that triggered event
  console.log(event.currentTarget);  // Element with listener attached
  console.log(event.relatedTarget);  // Related element (for mouse events)

  // Position information
  console.log(event.clientX, event.clientY);  // Viewport coordinates
  console.log(event.pageX, event.pageY);      // Document coordinates
  console.log(event.screenX, event.screenY);  // Screen coordinates
  console.log(event.offsetX, event.offsetY);  // Within target element

  // Modifier keys
  console.log(event.altKey);    // Alt key pressed
  console.log(event.ctrlKey);   // Ctrl key pressed
  console.log(event.shiftKey);  // Shift key pressed
  console.log(event.metaKey);   // Meta/Cmd key pressed

  // Mouse button
  console.log(event.button);   // 0=left, 1=middle, 2=right
  console.log(event.buttons);  // Bitmask of buttons

  // Event timing
  console.log(event.timeStamp);  // Time since page load

  // Bubbling control
  console.log(event.bubbles);          // Does event bubble
  console.log(event.cancelable);       // Can be cancelled
  console.log(event.defaultPrevented); // Was preventDefault called
  console.log(event.eventPhase);       // 1=capture, 2=target, 3=bubble
});
```

### Preventing Default and Propagation

```javascript
// Prevent default browser behavior
const link = document.querySelector('a');
link.addEventListener('click', function(event) {
  event.preventDefault();  // Don't navigate
  console.log('Link click prevented');
});

const form = document.querySelector('form');
form.addEventListener('submit', function(event) {
  event.preventDefault();  // Don't submit form
  console.log('Form submission prevented');
});

// Stop propagation (bubbling)
const child = document.querySelector('.child');
child.addEventListener('click', function(event) {
  event.stopPropagation();  // Parent handlers won't fire
  console.log('Click stopped here');
});

// Stop immediate propagation
// Prevents other handlers on same element too
child.addEventListener('click', function(event) {
  event.stopImmediatePropagation();
  console.log('First handler - stops all others');
});

child.addEventListener('click', function(event) {
  console.log('This will not run');
});

// Return false in jQuery vs vanilla JS
// In vanilla JS, return false does NOT prevent default
// Must explicitly call preventDefault and/or stopPropagation
```

### Common Event Types

```javascript
// Mouse events
element.addEventListener('click', handler);
element.addEventListener('dblclick', handler);
element.addEventListener('mousedown', handler);
element.addEventListener('mouseup', handler);
element.addEventListener('mousemove', handler);
element.addEventListener('mouseenter', handler);  // No bubble
element.addEventListener('mouseleave', handler);  // No bubble
element.addEventListener('mouseover', handler);   // Bubbles
element.addEventListener('mouseout', handler);    // Bubbles
element.addEventListener('contextmenu', handler);

// Keyboard events
document.addEventListener('keydown', (e) => {
  console.log(e.key);       // 'a', 'Enter', 'Escape'
  console.log(e.code);      // 'KeyA', 'Enter', 'Escape'
  console.log(e.keyCode);   // Deprecated, use key/code
});
document.addEventListener('keyup', handler);
document.addEventListener('keypress', handler);   // Deprecated

// Focus events
input.addEventListener('focus', handler);
input.addEventListener('blur', handler);
input.addEventListener('focusin', handler);   // Bubbles
input.addEventListener('focusout', handler);  // Bubbles

// Form events
form.addEventListener('submit', handler);
form.addEventListener('reset', handler);
input.addEventListener('input', handler);     // Any value change
input.addEventListener('change', handler);    // Committed change

// Window events
window.addEventListener('load', handler);           // All resources loaded
window.addEventListener('DOMContentLoaded', handler); // DOM ready
window.addEventListener('beforeunload', handler);   // Before leaving
window.addEventListener('resize', handler);
window.addEventListener('scroll', handler);

// Drag events
element.addEventListener('dragstart', handler);
element.addEventListener('drag', handler);
element.addEventListener('dragend', handler);
element.addEventListener('dragenter', handler);
element.addEventListener('dragover', handler);
element.addEventListener('dragleave', handler);
element.addEventListener('drop', handler);

// Touch events
element.addEventListener('touchstart', handler);
element.addEventListener('touchmove', handler);
element.addEventListener('touchend', handler);
element.addEventListener('touchcancel', handler);

// Clipboard events
element.addEventListener('copy', handler);
element.addEventListener('cut', handler);
element.addEventListener('paste', handler);
```

### Custom Events

```javascript
// Create custom event
const customEvent = new CustomEvent('myEvent', {
  detail: { message: 'Hello!', value: 42 },
  bubbles: true,
  cancelable: true
});

// Dispatch event
element.dispatchEvent(customEvent);

// Listen for custom event
element.addEventListener('myEvent', function(event) {
  console.log(event.detail.message);  // 'Hello!'
  console.log(event.detail.value);    // 42
});

// Practical example: Component communication
class ShoppingCart {
  constructor() {
    this.items = [];
  }

  addItem(item) {
    this.items.push(item);

    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('cart:updated', {
      detail: {
        items: this.items,
        total: this.items.length
      }
    }));
  }
}

// Listen from anywhere
document.addEventListener('cart:updated', (e) => {
  updateCartBadge(e.detail.total);
});

// Generic event with type checking
const event = new Event('build');
element.dispatchEvent(event);
```

## Event Delegation

Event delegation uses event bubbling to handle events on multiple elements with a single listener.

### Basic Event Delegation

```javascript
// Without delegation (bad for many items)
const items = document.querySelectorAll('.item');
items.forEach(item => {
  item.addEventListener('click', function() {
    console.log('Item clicked');
  });
});

// With delegation (efficient)
const container = document.querySelector('.container');
container.addEventListener('click', function(event) {
  if (event.target.classList.contains('item')) {
    console.log('Item clicked:', event.target);
  }
});

// Works for dynamically added elements too
const newItem = document.createElement('div');
newItem.className = 'item';
newItem.textContent = 'New Item';
container.appendChild(newItem);
// New item is automatically handled
```

### Advanced Delegation Patterns

```javascript
const list = document.querySelector('.todo-list');

// Handle multiple actions
list.addEventListener('click', function(event) {
  const target = event.target;

  // Delete button
  if (target.matches('.delete-btn')) {
    const item = target.closest('.todo-item');
    item.remove();
    return;
  }

  // Edit button
  if (target.matches('.edit-btn')) {
    const item = target.closest('.todo-item');
    enableEditMode(item);
    return;
  }

  // Complete checkbox
  if (target.matches('.complete-checkbox')) {
    const item = target.closest('.todo-item');
    item.classList.toggle('completed', target.checked);
    return;
  }
});

// Using closest for nested elements
document.addEventListener('click', function(event) {
  const button = event.target.closest('button');
  if (!button) return;

  // Handle button click
  const action = button.dataset.action;
  if (action === 'save') saveData();
  if (action === 'cancel') cancelAction();
});

// Delegation with data attributes
const app = document.getElementById('app');
app.addEventListener('click', function(event) {
  const handler = event.target.dataset.handler;
  if (!handler) return;

  const handlers = {
    openModal() { /* ... */ },
    closeModal() { /* ... */ },
    submitForm() { /* ... */ }
  };

  if (handlers[handler]) {
    handlers[handler](event);
  }
});
```

### Delegation Utility Function

```javascript
// Reusable delegation helper
function delegate(parent, selector, eventType, handler) {
  parent.addEventListener(eventType, function(event) {
    const target = event.target.closest(selector);

    if (target && parent.contains(target)) {
      handler.call(target, event);
    }
  });
}

// Usage
const container = document.querySelector('.container');

delegate(container, '.btn', 'click', function(event) {
  console.log('Button clicked:', this);  // this = matched element
});

delegate(container, '.card', 'mouseenter', function(event) {
  this.classList.add('hovered');
});

// More advanced delegation with options
function createDelegation(parent) {
  const handlers = new Map();

  parent.addEventListener('click', (event) => {
    for (const [selector, handler] of handlers) {
      const target = event.target.closest(selector);
      if (target && parent.contains(target)) {
        handler.call(target, event);
      }
    }
  });

  return {
    on(selector, handler) {
      handlers.set(selector, handler);
      return this;
    },
    off(selector) {
      handlers.delete(selector);
      return this;
    }
  };
}

// Usage
const delegator = createDelegation(document.body);
delegator
  .on('.btn-save', handleSave)
  .on('.btn-cancel', handleCancel)
  .on('.link', handleLink);
```

## Performance Optimization

Optimize DOM operations for better performance.

### DocumentFragment

```javascript
// Bad - causes reflow on each append
const list = document.getElementById('list');
for (let i = 0; i < 1000; i++) {
  const item = document.createElement('li');
  item.textContent = `Item ${i}`;
  list.appendChild(item);  // Reflow each time
}

// Good - batch with DocumentFragment
const listElement = document.getElementById('list');
const fragment = document.createDocumentFragment();

for (let i = 0; i < 1000; i++) {
  const item = document.createElement('li');
  item.textContent = `Item ${i}`;
  fragment.appendChild(item);  // No reflow
}

listElement.appendChild(fragment);  // Single reflow

// Template element for complex fragments
const template = document.getElementById('item-template');
const fragmentFromTemplate = document.createDocumentFragment();

for (const data of dataArray) {
  const clone = template.content.cloneNode(true);
  clone.querySelector('.title').textContent = data.title;
  clone.querySelector('.description').textContent = data.description;
  fragmentFromTemplate.appendChild(clone);
}

container.appendChild(fragmentFromTemplate);
```

### Batching DOM Operations

```javascript
// Bad - interleaved reads and writes cause layout thrashing
const elements = document.querySelectorAll('.item');
elements.forEach(el => {
  const height = el.offsetHeight;  // Read (forces layout)
  el.style.height = height * 2 + 'px';  // Write (invalidates layout)
});

// Good - batch reads, then batch writes
const allElements = document.querySelectorAll('.item');
const heights = [];

// Read phase
allElements.forEach(el => {
  heights.push(el.offsetHeight);
});

// Write phase
allElements.forEach((el, i) => {
  el.style.height = heights[i] * 2 + 'px';
});

// Using requestAnimationFrame for batching
function batchUpdates(updates) {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

batchUpdates([
  () => element1.style.transform = 'translateX(100px)',
  () => element2.style.opacity = '0.5',
  () => element3.classList.add('active')
]);
```

### Minimizing Reflows

```javascript
// Properties that trigger layout/reflow:
// offsetTop, offsetLeft, offsetWidth, offsetHeight
// scrollTop, scrollLeft, scrollWidth, scrollHeight
// clientTop, clientLeft, clientWidth, clientHeight
// getComputedStyle(), getBoundingClientRect()

// Cache layout values
const animatedElement = document.querySelector('.animated');

// Bad
for (let i = 0; i < 100; i++) {
  animatedElement.style.left = animatedElement.offsetLeft + 1 + 'px';
}

// Good
let left = animatedElement.offsetLeft;
for (let i = 0; i < 100; i++) {
  left += 1;
  animatedElement.style.left = left + 'px';
}

// Use transform instead of positional properties
// Transforms don't trigger layout
animatedElement.style.transform = 'translateX(100px)';  // Good
animatedElement.style.left = '100px';  // Triggers layout

// Hide element during bulk changes
animatedElement.style.display = 'none';
// Make many changes...
animatedElement.style.display = 'block';

// Or use visibility (maintains layout)
animatedElement.style.visibility = 'hidden';
// Make changes...
animatedElement.style.visibility = 'visible';
```

### Virtual Scrolling Pattern

```javascript
// For very long lists, only render visible items
class VirtualScroller {
  constructor(container, items, itemHeight) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;

    this.setupContainer();
    this.render();
    this.attachScrollListener();
  }

  setupContainer() {
    this.content = document.createElement('div');
    this.content.style.height = this.items.length * this.itemHeight + 'px';
    this.content.style.position = 'relative';
    this.container.appendChild(this.content);
  }

  render() {
    const scrollTop = this.container.scrollTop;
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + this.visibleItems, this.items.length);

    // Clear existing items
    this.content.querySelectorAll('.virtual-item').forEach(el => el.remove());

    // Render visible items
    const fragment = document.createDocumentFragment();

    for (let i = startIndex; i < endIndex; i++) {
      const item = document.createElement('div');
      item.className = 'virtual-item';
      item.textContent = this.items[i];
      item.style.position = 'absolute';
      item.style.top = i * this.itemHeight + 'px';
      item.style.height = this.itemHeight + 'px';
      fragment.appendChild(item);
    }

    this.content.appendChild(fragment);
  }

  attachScrollListener() {
    let ticking = false;

    this.container.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.render();
          ticking = false;
        });
        ticking = true;
      }
    });
  }
}

// Usage
const scrollContainer = document.querySelector('.scroll-container');
const items = Array.from({ length: 10000 }, (_, i) => `Item ${i}`);
new VirtualScroller(scrollContainer, items, 40);
```

### Event Handler Optimization

```javascript
// Debounce - wait for pause in events
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage for resize/input events
window.addEventListener('resize', debounce(() => {
  console.log('Resize ended');
}, 250));

// Throttle - limit execution rate
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Usage for scroll events
window.addEventListener('scroll', throttle(() => {
  console.log('Scroll handler');
}, 100));

// requestAnimationFrame throttle for smooth animations
function rafThrottle(func) {
  let rafId = null;

  return function(...args) {
    if (rafId) return;

    rafId = requestAnimationFrame(() => {
      func.apply(this, args);
      rafId = null;
    });
  };
}

// Usage
const cursor = document.querySelector('.cursor');
window.addEventListener('mousemove', rafThrottle((e) => {
  cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
}));

// Passive event listeners for scroll performance
window.addEventListener('scroll', handler, { passive: true });
element.addEventListener('touchmove', handler, { passive: true });
```

### Intersection Observer

```javascript
// Efficient visibility detection (replaces scroll listeners)
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Element is visible
      entry.target.classList.add('visible');

      // Lazy load images
      if (entry.target.dataset.src) {
        entry.target.src = entry.target.dataset.src;
        observer.unobserve(entry.target);
      }
    }
  });
}, {
  root: null,          // Viewport
  rootMargin: '50px',  // Trigger 50px before visible
  threshold: 0.1       // 10% visible
});

// Observe elements
document.querySelectorAll('.lazy-image').forEach(img => {
  observer.observe(img);
});

// Multiple thresholds
const progressObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const ratio = entry.intersectionRatio;
    entry.target.style.opacity = ratio;
  });
}, {
  threshold: [0, 0.25, 0.5, 0.75, 1]
});

// Infinite scroll pattern
const sentinel = document.querySelector('.sentinel');
const infiniteObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    loadMoreContent();
  }
});
infiniteObserver.observe(sentinel);
```

### Mutation Observer

```javascript
// Watch for DOM changes efficiently
const mutationObserver = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      console.log('Children changed:', mutation.addedNodes, mutation.removedNodes);
    }
    if (mutation.type === 'attributes') {
      console.log('Attribute changed:', mutation.attributeName);
    }
  });
});

// Configure and start observing
const config = {
  childList: true,     // Watch for child additions/removals
  attributes: true,    // Watch for attribute changes
  characterData: true, // Watch for text content changes
  subtree: true,       // Watch all descendants
  attributeOldValue: true,   // Record old attribute values
  characterDataOldValue: true // Record old text values
};

mutationObserver.observe(document.body, config);

// Stop observing
mutationObserver.disconnect();

// Get pending mutations
const pending = mutationObserver.takeRecords();

// Practical use: Watch for dynamic content
const contentObserver = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Initialize new elements
        initializeComponent(node);
      }
    });
  });
});

contentObserver.observe(document.getElementById('app'), {
  childList: true,
  subtree: true
});
```

## Summary

DOM manipulation is fundamental to interactive web development:

- **DOM Tree**: Understand the hierarchical structure of HTML documents
- **Selecting Elements**: Use appropriate methods for efficient element selection
- **Traversing**: Navigate between parents, children, and siblings
- **Creating/Modifying**: Build and update DOM elements dynamically
- **Attributes and Classes**: Manipulate element properties and styling
- **Event Handling**: Respond to user interactions with proper event management
- **Event Delegation**: Handle events efficiently using bubbling
- **Performance**: Optimize DOM operations with batching, fragments, and observers

Mastering these techniques enables you to build responsive, performant web applications that provide excellent user experiences.
