---
title: JavaScript Event Delegation Mastery
description: Deep dive into JavaScript event delegation, event bubbling, capturing, and practical techniques for efficient event handling in dynamic DOMs
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - DOM
  - events
  - event-delegation
  - performance
  - pattern
status: imported
origin: old/src/content/docs/javascript/event-delegation.en.md
divergence: 0.186
issues: []
legacy:
  category: JavaScript
  subcategory: Browser APIs
  order: 16
  lastUpdated: 2026-01-07
---

Event delegation is one of the most powerful and efficient patterns in JavaScript for handling events. Rather than attaching event listeners to individual elements, delegation leverages event bubbling to handle events at a parent level, significantly reducing memory consumption and improving performance—especially with dynamic DOM elements.

## Concept Introduction

Event delegation is a technique where you attach a single event listener to a parent element instead of attaching multiple listeners to individual child elements. This works because of **event bubbling**—events propagate from the target element up through its parent elements in the DOM tree.

### What is Event Bubbling?

Event bubbling is the third phase of the event flow. When an event occurs on an element, it first fires on that element, then on its parent, then all the way up the DOM tree.

```javascript
// HTML Structure
// <div id="parent">
//   <button id="child">Click me</button>
// </div>

const parent = document.getElementById('parent');
const child = document.getElementById('child');

parent.addEventListener('click', (event) => {
  console.log('Parent clicked:', event.target);
});

child.addEventListener('click', (event) => {
  console.log('Child clicked:', event.target);
});

// Output when button is clicked:
// "Child clicked:" <button>
// "Parent clicked:" <button>
```

### Three Phases of Event Flow

1. **Capturing Phase**: Event travels down from `window` to the target element
2. **Target Phase**: Event reaches the target element
3. **Bubbling Phase**: Event travels up from the target to `window`

```
                  window
                    |
                document
                    |
                  <html>
                    |
                  <body>
                    |
          <div class="parent">
            |
            | Capturing -> Target -> Bubbling
            |
          <button>
```

## Core Principles

### Event Bubbling Mechanism

The foundation of event delegation is that events bubble up from child elements to parent elements.

```javascript
const list = document.getElementById('myList');

// Instead of this (bad - attaches listener to each item):
const items = document.querySelectorAll('li');
items.forEach(item => {
  item.addEventListener('click', handleItemClick);
});

// Do this (good - single listener on parent):
list.addEventListener('click', (event) => {
  if (event.target.tagName === 'LI') {
    handleItemClick(event);
  }
});
```

### Event Target vs Current Target

Understanding the difference is crucial for delegation:

- **`event.target`**: The element that actually triggered the event
- **`event.currentTarget`**: The element that has the event listener attached

```javascript
const parent = document.getElementById('parent');

parent.addEventListener('click', (event) => {
  console.log('event.target:', event.target);        // The clicked element
  console.log('event.currentTarget:', event.currentTarget); // The parent
  console.log('Are they same?', event.target === event.currentTarget); // false
});
```

### Event Matching and Filtering

Delegate events must verify the target before processing.

```javascript
const container = document.getElementById('container');

container.addEventListener('click', (event) => {
  // Method 1: Check tagName
  if (event.target.tagName === 'BUTTON') {
    console.log('Button clicked');
  }

  // Method 2: Check class
  if (event.target.classList.contains('delete-btn')) {
    console.log('Delete button clicked');
  }

  // Method 3: Check closest parent
  const listItem = event.target.closest('li');
  if (listItem) {
    console.log('List item clicked:', listItem);
  }

  // Method 4: Check data attribute
  if (event.target.dataset.action === 'delete') {
    console.log('Performing delete action');
  }
});
```

### Event Delegation Limitations

Some events do NOT bubble and cannot be delegated:

- Focus events: `focus`, `blur`
- Mouse events: `mouseenter`, `mouseleave`
- UI events: `scroll`, `resize`, `load`, `unload`
- Media events: `play`, `pause`, `playing`, `volumechange`

```javascript
// These DON'T work with delegation:
container.addEventListener('focus', handleFocus); // Won't catch nested focus

// Solution: Use event capture or non-bubbling alternative
container.addEventListener('focus', handleFocus, true); // Capture phase
// Or use focusin (bubbles)
container.addEventListener('focusin', handleFocus);

// These DO work with delegation:
container.addEventListener('click', handleClick);      // bubbles
container.addEventListener('change', handleChange);    // bubbles
container.addEventListener('input', handleInput);      // bubbles
container.addEventListener('keydown', handleKeydown);  // bubbles
```

## Key Points

- **Single listener, multiple handlers**: Attach one listener to a parent to handle events on many children
- **Dynamic element support**: Works seamlessly with elements added after the initial page load
- **Reduced memory footprint**: Fewer event listeners means less memory consumption
- **Use `event.target`**: Always check what element actually triggered the event
- **Consider non-bubbling events**: Focus, mouseenter/leave, scroll cannot be delegated directly
- **Use `closest()` for matching**: Modern way to find matching ancestors
- **Stop propagation carefully**: Be aware that `stopPropagation()` prevents bubbling
- **Event.currentTarget behavior**: Remains constant as the element with the listener
- **Performance gains scale with DOM size**: More dramatic improvements with large, dynamic lists

## Code Examples

### Example 1: Basic Event Delegation

```javascript
// HTML
// <ul id="todoList">
//   <li>Learn JavaScript <button class="delete">×</button></li>
//   <li>Build a project <button class="delete">×</button></li>
//   <li>Master DOM APIs <button class="delete">×</button></li>
// </ul>

const todoList = document.getElementById('todoList');

// Single listener handles all delete buttons
todoList.addEventListener('click', (event) => {
  // Check if clicked element is a delete button
  if (event.target.classList.contains('delete')) {
    const todoItem = event.target.closest('li');
    console.log('Deleting:', todoItem.textContent);
    todoItem.remove();
  }
});
```

### Example 2: Dynamic List Handling

```javascript
// HTML
// <div id="taskContainer">
//   <input id="taskInput" type="text" placeholder="Add task">
//   <button id="addBtn">Add Task</button>
//   <ul id="taskList"></ul>
// </div>

const taskContainer = document.getElementById('taskContainer');
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');

let taskId = 0;

// Add task button
addBtn.addEventListener('click', () => {
  if (taskInput.value.trim() === '') return;

  const li = document.createElement('li');
  li.textContent = taskInput.value;
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'task-delete';
  deleteBtn.dataset.id = taskId++;
  deleteBtn.textContent = 'Delete';
  li.appendChild(deleteBtn);

  const completeBtn = document.createElement('button');
  completeBtn.className = 'task-complete';
  completeBtn.dataset.id = taskId;
  completeBtn.textContent = 'Complete';
  li.appendChild(completeBtn);

  taskList.appendChild(li);
  taskInput.value = '';
});

// Single delegated listener for all task actions
taskList.addEventListener('click', (event) => {
  const target = event.target;

  if (target.classList.contains('task-delete')) {
    target.closest('li').remove();
  } else if (target.classList.contains('task-complete')) {
    target.closest('li').classList.toggle('completed');
    target.textContent = target.textContent === 'Complete' ? 'Undo' : 'Complete';
  }
});

// Also delegate to a parent for cascading
taskContainer.addEventListener('click', (event) => {
  // This catches events that bubble up from taskList
  console.log('Event delegated to container:', event.target);
});
```

### Example 3: Advanced Matching with Multiple Element Types

```javascript
// HTML
// <div id="dashboard">
//   <button class="action" data-action="save">Save</button>
//   <button class="action" data-action="delete">Delete</button>
//   <a class="link" href="#profile">View Profile</a>
//   <input type="checkbox" class="toggle">
// </div>

const dashboard = document.getElementById('dashboard');

dashboard.addEventListener('click', (event) => {
  const { target } = event;

  // Match buttons with data-action
  if (target.dataset.action === 'save') {
    console.log('Saving data...');
  } else if (target.dataset.action === 'delete') {
    console.log('Deleting data...');
  }

  // Match links
  if (target.classList.contains('link')) {
    console.log('Navigating to:', target.href);
  }

  // Match checkboxes
  if (target.type === 'checkbox') {
    console.log('Toggle changed:', target.checked);
  }
});
```

### Example 4: Event Delegation with Closest

```javascript
// HTML
// <div id="comments">
//   <div class="comment">
//     <p class="comment-text">Great post!</p>
//     <button class="reply">Reply</button>
//   </div>
//   <div class="comment">
//     <p class="comment-text">Thanks for sharing</p>
//     <button class="reply">Reply</button>
//   </div>
// </div>

const comments = document.getElementById('comments');

comments.addEventListener('click', (event) => {
  // Find the closest comment container
  const comment = event.target.closest('.comment');

  if (!comment) return; // Not a comment-related click

  if (event.target.classList.contains('reply')) {
    const text = comment.querySelector('.comment-text').textContent;
    console.log('Replying to:', text);
    // Open reply form
  }
});
```

### Example 5: Non-bubbling Events with Capture Phase

```javascript
// For events that don't bubble, use focusin (which does)
const form = document.getElementById('myForm');

// Focus doesn't bubble, but focusin does
form.addEventListener('focusin', (event) => {
  console.log('Input focused:', event.target);
  event.target.classList.add('focused');
});

form.addEventListener('focusout', (event) => {
  console.log('Input blurred:', event.target);
  event.target.classList.remove('focused');
});
```

### Example 6: Stop Propagation in Delegated Events

```javascript
// HTML
// <div id="parent">
//   <button class="special">Special Button</button>
//   <button>Normal Button</button>
// </div>

const parent = document.getElementById('parent');

parent.addEventListener('click', (event) => {
  if (event.target.classList.contains('special')) {
    console.log('Special button clicked');
    // Stop propagation to prevent parent handlers
    event.stopPropagation();
  } else {
    console.log('Regular button clicked');
  }
});

// Parent delegated listener
document.addEventListener('click', (event) => {
  // This won't fire for special button due to stopPropagation()
  console.log('Document level handler:', event.target);
});
```

### Example 7: Form Delegation

```javascript
// HTML structure with form fields
const userForm = document.getElementById('userForm');
const formData = {};

userForm.addEventListener('input', (event) => {
  const { target } = event;
  if (target.name) {
    formData[target.name] = target.value;
    console.log('Form data updated:', formData);
  }
});

userForm.addEventListener('change', (event) => {
  const { target } = event;
  if (target.name === 'agree') {
    console.log('Agreement toggled:', target.checked);
  } else if (target.name === 'country') {
    console.log('Country changed:', target.value);
  }
});

userForm.addEventListener('submit', (event) => {
  event.preventDefault();
  console.log('Form submitted with:', formData);
  // Validate and send data
});
```

### Example 8: Event Delegation Utility Function

```javascript
/**
 * Create a delegated event listener
 * @param {Element} parent - The parent element to attach listener to
 * @param {string} eventType - The event type (click, change, etc.)
 * @param {string|Function} selector - CSS selector or matcher function
 * @param {Function} handler - The event handler
 */
function delegate(parent, eventType, selector, handler) {
  parent.addEventListener(eventType, (event) => {
    let target = event.target;

    // Allow selector to be a function
    const matches = typeof selector === 'function'
      ? selector(target)
      : target.matches(selector);

    if (matches) {
      handler.call(target, event);
    }
  });
}

// Usage
const list = document.getElementById('myList');

delegate(list, 'click', 'li', function(event) {
  console.log('Clicked item:', this.textContent);
});

delegate(list, 'click', (el) => el.dataset.action === 'delete', function(event) {
  console.log('Delete clicked on:', this);
  this.remove();
});
```

### Example 9: Comparing Delegated vs Individual Listeners

```javascript
// Test setup
const container = document.getElementById('container');
const itemCount = 1000;

// Create test items
for (let i = 0; i < itemCount; i++) {
  const item = document.createElement('div');
  item.className = 'item';
  item.textContent = 'Item ' + i;
  item.dataset.id = i;
  container.appendChild(item);
}

// Approach 1: Individual listeners (bad)
function setupIndividualListeners() {
  const items = document.querySelectorAll('.item');
  console.time('Individual listeners');

  items.forEach(item => {
    item.addEventListener('click', (event) => {
      console.log('Clicked:', event.target.dataset.id);
    });
  });

  console.timeEnd('Individual listeners');
  console.log('Listeners created:', itemCount);
}

// Approach 2: Event delegation (good)
function setupDelegation() {
  console.time('Event delegation');

  container.addEventListener('click', (event) => {
    if (event.target.classList.contains('item')) {
      console.log('Clicked:', event.target.dataset.id);
    }
  });

  console.timeEnd('Event delegation');
  console.log('Listeners created: 1');
}

// Approach 3: Add items dynamically
function addDynamicItems() {
  // With delegation, new items automatically work!
  const newItem = document.createElement('div');
  newItem.className = 'item';
  newItem.textContent = 'New Dynamic Item';
  container.appendChild(newItem);
}

setupDelegation(); // Recommended
addDynamicItems(); // Works seamlessly
```

### Example 10: Complex Data Handling with Delegation

```javascript
// Data management with delegated events
const dataTable = document.getElementById('dataTable');
const rows = new Map();

// Populate some sample data
[
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
].forEach(data => {
  rows.set(data.id, data);
});

dataTable.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const row = button.closest('tr');
  const rowId = parseInt(row.dataset.id);
  const data = rows.get(rowId);

  if (button.dataset.action === 'edit') {
    console.log('Editing:', data);
  } else if (button.dataset.action === 'delete') {
    console.log('Deleting:', data);
    if (confirm('Delete ' + data.name + '?')) {
      rows.delete(rowId);
      row.remove();
    }
  }
});
```

## Best Practices

### Use Semantic Selectors

```javascript
// Good - specific and clear
element.addEventListener('click', (e) => {
  if (e.target.dataset.action === 'submit') {
    // Handle submit
  }
});

// Better - use closest for cleaner matching
element.addEventListener('click', (e) => {
  const button = e.target.closest('button[data-action="submit"]');
  if (button) {
    // Handle submit
  }
});
```

### Avoid Over-Delegation

```javascript
// Bad - delegating at document level catches all clicks
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('my-button')) {
    // ...
  }
});

// Good - delegate at the closest common ancestor
const container = document.getElementById('container');
container.addEventListener('click', (e) => {
  if (e.target.classList.contains('my-button')) {
    // ...
  }
});
```

### Combine Multiple Event Types When Possible

```javascript
// Less efficient
element.addEventListener('click', handler);
element.addEventListener('keydown', handler);
element.addEventListener('touch', handler);

// More efficient - handle in a single delegated listener
const delegator = (eventType) => {
  element.addEventListener(eventType, handler);
};

['click', 'keydown', 'touchend'].forEach(delegator);
```

### Document Your Delegation

```javascript
/**
 * Handles user interactions within the task list
 * Delegated events from: .task-item, .task-delete, .task-edit
 */
taskList.addEventListener('click', (event) => {
  // Implementation
});
```

### Use Data Attributes for Complex Matching

```javascript
// Good - self-documenting
const type = event.target.dataset.type;
const action = event.target.dataset.action;
const priority = event.target.dataset.priority;

// Handle accordingly based on attributes
if (type === 'task' && action === 'delete') {
  const taskId = event.target.closest('[data-task-id]').dataset.taskId;
  deleteTask(taskId);
}
```

## Common Pitfalls

### Pitfall 1: Non-Bubbling Events

```javascript
// Wrong - focus doesn't bubble
parent.addEventListener('focus', handler);

// Correct - use focusin instead (bubbles)
parent.addEventListener('focusin', handler);

// Or use capture phase
input.addEventListener('focus', handler, true);
```

### Pitfall 2: Forgetting to Check the Target

```javascript
// Bad - fires for any click
container.addEventListener('click', (e) => {
  deleteItem(e.target);
});

// Good - check target first
container.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    deleteItem(e.target);
  }
});
```

### Pitfall 3: Using event.currentTarget Incorrectly

```javascript
// Wrong - event.currentTarget is the listener element
container.addEventListener('click', (e) => {
  console.log(e.currentTarget); // container, not the clicked element
});

// Right - use event.target for the clicked element
container.addEventListener('click', (e) => {
  console.log(e.target); // The actual clicked element
});
```

### Pitfall 4: stopPropagation() Side Effects

```javascript
// Risky - prevents other handlers from firing
element.addEventListener('click', (e) => {
  if (someCondition) {
    e.stopPropagation(); // Blocks parent handlers too!
  }
});

// Better - use stopImmediatePropagation() if you must stop
// Or redesign to avoid conflicts
```

### Pitfall 5: Memory Leaks with Dynamic Content

```javascript
// Bad - each item gets a handler, handlers never removed
function addItem(item) {
  item.addEventListener('click', handler);
}

// Good - single delegated listener, remove when destroying
function addItem(item) {
  // Handler exists on parent, no need to add to item
}

function destroy() {
  parentElement.removeEventListener('click', delegatedHandler);
}
```

### Pitfall 6: Performance with Expensive Operations

```javascript
// Bad - expensive operation on every event
container.addEventListener('click', (e) => {
  const expensive = complexCalculation(); // Every click!
  if (e.target.classList.contains('button')) {
    doSomething(expensive);
  }
});

// Good - defer expensive operations
container.addEventListener('click', (e) => {
  if (e.target.classList.contains('button')) {
    // Only do expensive work if we match
    const expensive = complexCalculation();
    doSomething(expensive);
  }
});
```

## Performance Considerations

### Memory Impact

```javascript
// With 1000 individual buttons:
// Individual listeners: 1000 listeners × 100 bytes = 100 KB

// With delegation:
// Delegation: 1 listener × 100 bytes = 100 bytes
// Savings: 99,900 bytes (99.9% reduction)

// Plus GC pressure and browser overhead savings
```

### Event Handler Performance

```javascript
// Benchmark comparison
const items = document.querySelectorAll('.item');

// Test 1: Individual listeners
console.time('Individual');
items.forEach(item => {
  item.addEventListener('click', () => {});
});
console.timeEnd('Individual');
// Result: 5-10ms for 1000 items

// Test 2: Delegation
console.time('Delegation');
const parent = document.getElementById('parent');
parent.addEventListener('click', (e) => {
  if (e.target.classList.contains('item')) {}
});
console.timeEnd('Delegation');
// Result: <1ms
```

### Dynamic Content Handling

```javascript
// With individual listeners:
function addItemIndividual(text) {
  const li = document.createElement('li');
  li.textContent = text;
  // Must attach listener to each new item
  li.addEventListener('click', handleClick);
  list.appendChild(li);
}

// With delegation:
function addItemDelegated(text) {
  const li = document.createElement('li');
  li.textContent = text;
  // No listener needed - handled by parent's delegated listener
  list.appendChild(li);
}

// Adding 100 items:
// Individual: Must attach 100 listeners
// Delegation: 0 additional listeners
```

## Real-world Scenarios

### Scenario 1: Shopping Cart

```javascript
// E-commerce cart with dynamic items
const cart = document.getElementById('cart');
const items = new Map();

cart.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;

  const cartItem = button.closest('[data-item-id]');
  const itemId = cartItem.dataset.itemId;
  const item = items.get(itemId);

  switch (button.dataset.action) {
    case 'increase':
      item.quantity++;
      button.parentElement.querySelector('.quantity').textContent = item.quantity;
      break;
    case 'decrease':
      if (item.quantity > 1) {
        item.quantity--;
        button.parentElement.querySelector('.quantity').textContent = item.quantity;
      }
      break;
    case 'remove':
      items.delete(itemId);
      cartItem.remove();
      updateTotal();
      break;
  }
});

function updateTotal() {
  let total = 0;
  items.forEach(item => {
    total += item.price * item.quantity;
  });
  document.getElementById('total').textContent = total.toFixed(2);
}
```

### Scenario 2: Comment System

```javascript
// Nested comments with actions
const commentSection = document.getElementById('comments');
const comments = new Map();

commentSection.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  const comment = e.target.closest('[data-comment-id]');

  if (!action || !comment) return;

  const commentId = comment.dataset.commentId;

  switch (action) {
    case 'reply':
      console.log('Showing reply form');
      break;
    case 'edit':
      console.log('Enabling edit mode');
      break;
    case 'delete':
      console.log('Deleting comment');
      break;
    case 'like':
      e.target.classList.toggle('liked');
      break;
  }
});
```

### Scenario 3: Table with Sorting and Filtering

```javascript
// Data table with multiple interactions
const table = document.getElementById('dataTable');
const tableData = [];

table.addEventListener('click', (e) => {
  // Handle column header clicks for sorting
  const header = e.target.closest('th');
  if (header) {
    const column = header.dataset.column;
    console.log('Sorting by:', column);
  }

  // Handle row actions
  const actionBtn = e.target.closest('[data-action]');
  if (actionBtn) {
    const row = actionBtn.closest('tr');
    const action = actionBtn.dataset.action;
    const rowId = row.dataset.rowId;
    console.log('Action:', action, 'on row:', rowId);
  }
});

table.addEventListener('change', (e) => {
  // Handle checkbox selections
  if (e.target.type === 'checkbox') {
    console.log('Selection changed');
  }

  // Handle filter selects
  if (e.target.classList.contains('filter')) {
    console.log('Filter applied');
  }
});
```

### Scenario 4: Form with Validation

```javascript
// Form with real-time validation
const form = document.getElementById('userForm');
const errors = new Map();

form.addEventListener('blur', (e) => {
  const field = e.target;
  if (field.name === 'email') {
    const isValid = /^[^\s@]+@[^\s@]+$/.test(field.value);
    if (!isValid) {
      errors.set('email', 'Invalid email format');
      field.classList.add('error');
    } else {
      errors.delete('email');
      field.classList.remove('error');
    }
  }
}, true); // Use capture for non-bubbling focus

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (errors.size === 0) {
    console.log('Form submitted');
  }
});
```

## Interview Points

### Q1: What is event delegation and why use it?

**Answer**: Event delegation leverages event bubbling to handle events on multiple child elements with a single listener on a parent element. Benefits include:
- Reduced memory consumption (1 listener instead of many)
- Better performance with large lists
- Automatic support for dynamically added elements
- Cleaner, more maintainable code

### Q2: How does event bubbling differ from event capturing?

**Answer**:
- **Event bubbling** (Phase 3): Events travel UP from the target element to the root
- **Event capturing** (Phase 1): Events travel DOWN from the root to the target
- Bubbling is the default; capturing requires the third parameter of `addEventListener` to be `true`

### Q3: What events don't bubble and can't be delegated?

**Answer**: Non-bubbling events include: `focus`, `blur`, `mouseenter`, `mouseleave`, `scroll`, `resize`, `load`, `unload`, and media events. Alternatives include using bubbling equivalents like `focusin`/`focusout` or event capturing.

### Q4: What's the difference between `event.target` and `event.currentTarget`?

**Answer**:
- **`event.target`**: The element that actually triggered the event
- **`event.currentTarget`**: The element that has the event listener attached
- Essential for delegation: use `target` to identify what was clicked, `currentTarget` to know the handler's container

### Q5: How do you match specific elements in a delegated handler?

**Answer**: Multiple approaches:
```javascript
// CSS selector with matches()
if (e.target.matches('.button')) {}

// closest() for finding matching ancestor
const btn = e.target.closest('button');

// classList check
if (e.target.classList.contains('delete')) {}

// data attributes
if (e.target.dataset.action === 'save') {}

// Element type check
if (e.target.tagName === 'BUTTON') {}
```

### Q6: Can you attach multiple delegated listeners to the same element?

**Answer**: Yes, each can handle different event types. Each listener can process different event types or you can combine them into one listener that checks `event.type`.

### Q7: What's the performance impact of event delegation?

**Answer**: Significant improvements including 1 listener vs 1000+ listeners, setup speed 100x faster with no DOM traversal, and instant support for new elements. Trade-off is slightly more complex handler logic with matching.

### Q8: How do you handle non-bubbling events with delegation?

**Answer**: Three options:
1. Use bubbling equivalent (`focusin` instead of `focus`)
2. Use capture phase: `addEventListener(type, handler, true)`
3. Attach directly to elements (defeats delegation benefits)

### Q9: What happens when you call `stopPropagation()` in a delegated handler?

**Answer**: It prevents the event from bubbling further up the DOM tree. Parent listeners won't receive the event. Use carefully as it can break other delegated handlers higher in the DOM.

### Q10: How would you implement event delegation from scratch?

**Answer**:
```javascript
class EventDelegator {
  constructor(element) {
    this.element = element;
    this.handlers = new Map();
  }

  on(eventType, selector, callback) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);

      this.element.addEventListener(eventType, (event) => {
        const handlers = this.handlers.get(eventType);
        handlers.forEach(({ selector, callback }) => {
          const target = event.target.closest(selector);
          if (target) {
            callback.call(target, event);
          }
        });
      });
    }

    this.handlers.get(eventType).push({ selector, callback });
  }
}

// Usage
const delegator = new EventDelegator(document.getElementById('app'));
delegator.on('click', '.button', function(e) {
  console.log('Button clicked:', this);
});
```

## Further Reading

### Key Concepts to Explore
- Event bubbling and capturing phases
- The `Event` object and its properties
- DOM tree traversal with `closest()`, `querySelector()`, `matches()`
- Performance optimization with event listeners
- Managing event listener lifecycles
- Custom events and event management libraries

### Related Topics
- [Event Flow and Event Handling](#) - Complete guide to event phases
- [DOM Manipulation](#) - Understanding the DOM tree
- [Performance Optimization](#) - Memory management and optimization
- [JavaScript Design Patterns](#) - Observer and Mediator patterns
- [Advanced Event Management](#) - Custom events and frameworks

### Best Resources
- MDN Web Docs: Event Delegation
- MDN Web Docs: Event Interface
- JavaScript.info: Event Delegation
- HTML Living Standard: DOM Events specification
- Performance measurement tools and DevTools

### Summary

Event delegation is a fundamental technique that every JavaScript developer should master. It provides significant performance improvements, cleaner code, and seamless support for dynamic content. By understanding event bubbling, correctly identifying targets, and choosing the right matching strategy, you can build efficient, maintainable web applications.

Key takeaways:
- Use event delegation for handling events on multiple dynamic elements
- Leverage event bubbling for performance gains
- Always verify the target with `event.target` before processing
- Remember that some events don't bubble
- Document your delegated handlers for clarity
- Consider the developer experience when creating complex delegation logic
