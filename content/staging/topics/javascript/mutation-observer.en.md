---
title: MutationObserver
description: A complete guide to JavaScript MutationObserver API, including DOM change monitoring, observe() and disconnect() methods, MutationRecord details, and performance optimization
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - MutationObserver
  - DOM
  - Browser APIs
  - Performance Optimization
status: imported
origin: old/src/content/docs/javascript/mutation-observer.en.md
divergence: 0.206
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: Browser APIs
  order: 12
  lastUpdated: 2026-01-07
---

## Concept Explanation

MutationObserver is a Web API for monitoring changes to the DOM tree. When the DOM structure changes (such as node additions, deletions, attribute changes, text content modifications, etc.), MutationObserver asynchronously notifies developers of these changes.

### Historical Background

Before MutationObserver, developers used Mutation Events to monitor DOM changes:

```javascript
// Old approach: Mutation Events (deprecated)
element.addEventListener('DOMNodeInserted', (event) => {
  console.log('Node inserted:', event.target);
});

element.addEventListener('DOMAttrModified', (event) => {
  console.log('Attribute modified:', event.attrName);
});
```

This approach had serious issues:
- **Poor performance**: Events are triggered synchronously, with a callback triggered immediately for every DOM change
- **Cascade issues**: A single operation could trigger multiple events, causing performance avalanche
- **Poor browser compatibility**: Inconsistent implementations across browsers
- **No batch processing**: Unable to combine multiple changes for processing

MutationObserver was introduced in 2012 as a replacement for Mutation Events, formally defined in the DOM4 specification. It uses asynchronous batch processing to completely solve the above issues.

### Problems Solved

- **Monitoring dynamic content**: Observe DOM modifications made by third-party scripts or frameworks
- **Implementing undo/redo**: Record DOM change history to implement editor undo functionality
- **DOM synchronization**: Synchronize other components or state when DOM changes
- **Performance monitoring**: Track page DOM changes to identify performance issues
- **Custom elements**: Respond to attribute changes in Web Components

---

## Core Principles

### Working Mechanism

MutationObserver uses a microtask queue mechanism, collecting DOM changes and processing them uniformly after the current JavaScript execution completes:

```
┌─────────────────────────────────────────────────────────────┐
│                     JavaScript Execution Flow                │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ DOM Operation 1│ ─► │ DOM Operation 2│ ─► │ DOM Operation 3│  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                  │                  │            │
│         ▼                  ▼                  ▼            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            MutationObserver Internal Queue           │   │
│  │  [Change Record 1] [Change Record 2] [Change Record 3]│   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                │
│                           ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │    Microtask execution: Callback receives all       │   │
│  │    MutationRecords                                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Asynchronous Batch Processing

```javascript
const observer = new MutationObserver((mutations) => {
  console.log('Number of changes received:', mutations.length);
});

observer.observe(document.body, { childList: true });

// Execute three DOM operations consecutively
document.body.appendChild(document.createElement('div'));
document.body.appendChild(document.createElement('span'));
document.body.appendChild(document.createElement('p'));

// Callback will only execute once, mutations.length === 3
```

### Relationship with Event Loop

MutationObserver callbacks execute during the microtask phase:

```javascript
const observer = new MutationObserver(() => {
  console.log('2. MutationObserver callback (microtask)');
});

observer.observe(document.body, { childList: true });

console.log('1. Synchronous code starts');

document.body.appendChild(document.createElement('div'));

Promise.resolve().then(() => {
  console.log('3. Promise callback (microtask)');
});

setTimeout(() => {
  console.log('4. setTimeout callback (macrotask)');
}, 0);

console.log('5. Synchronous code ends');

// Output order:
// 1. Synchronous code starts
// 5. Synchronous code ends
// 2. MutationObserver callback (microtask)
// 3. Promise callback (microtask)
// 4. setTimeout callback (macrotask)
```

---

## Key Concepts

### MutationObserver Constructor

```javascript
const observer = new MutationObserver(callback);
```

#### callback Parameter

```javascript
function callback(mutations, observer) {
  // mutations: Array of MutationRecords containing all change records
  // observer: The MutationObserver instance itself

  mutations.forEach(mutation => {
    console.log('Change type:', mutation.type);
    console.log('Target node:', mutation.target);
  });
}
```

### observe() Method

```javascript
observer.observe(targetNode, options);
```

#### options Configuration Details

| Option | Type | Description |
|--------|------|-------------|
| childList | boolean | Monitor child node changes (additions/deletions) of target node |
| attributes | boolean | Monitor attribute changes of target node |
| characterData | boolean | Monitor text content changes of target node |
| subtree | boolean | Monitor all descendant nodes of target node |
| attributeOldValue | boolean | Record the value before attribute changes |
| characterDataOldValue | boolean | Record the value before text changes |
| attributeFilter | string[] | Only monitor specified attributes |

```javascript
// Complete configuration example
observer.observe(targetNode, {
  childList: true,              // Monitor child node additions/deletions
  attributes: true,             // Monitor attribute changes
  characterData: true,          // Monitor text content changes
  subtree: true,                // Monitor all descendant nodes
  attributeOldValue: true,      // Record old attribute values
  characterDataOldValue: true,  // Record old text values
  attributeFilter: ['class', 'style', 'data-*']  // Only monitor specific attributes
});
```

**Note**: At least one of `childList`, `attributes`, or `characterData` must be set to `true`.

### disconnect() Method

```javascript
// Stop observing all target nodes
observer.disconnect();
```

After calling `disconnect()`:
- Stops receiving DOM change notifications
- Clears pending change queue
- Can call `observe()` again to continue observing

### takeRecords() Method

```javascript
// Get all pending change records and clear the queue
const pendingMutations = observer.takeRecords();
```

Use case: Get all unprocessed changes before calling `disconnect()`.

```javascript
// Process all pending changes before stopping
const pending = observer.takeRecords();
pending.forEach(processMutation);
observer.disconnect();
```

### MutationRecord Object

Each MutationRecord contains detailed information about a DOM change:

| Property | Type | Description |
|----------|------|-------------|
| type | string | Change type: `'childList'`, `'attributes'`, or `'characterData'` |
| target | Node | The target node where the change occurred |
| addedNodes | NodeList | List of added nodes |
| removedNodes | NodeList | List of removed nodes |
| previousSibling | Node | Previous sibling of added/removed node |
| nextSibling | Node | Next sibling of added/removed node |
| attributeName | string | Name of the changed attribute |
| attributeNamespace | string | Namespace of the changed attribute |
| oldValue | string | Value before the change (requires `attributeOldValue` or `characterDataOldValue` configuration) |

```javascript
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    switch (mutation.type) {
      case 'childList':
        console.log('Child node change');
        console.log('  Added:', mutation.addedNodes);
        console.log('  Removed:', mutation.removedNodes);
        break;
      case 'attributes':
        console.log('Attribute change');
        console.log('  Attribute name:', mutation.attributeName);
        console.log('  Old value:', mutation.oldValue);
        console.log('  New value:', mutation.target.getAttribute(mutation.attributeName));
        break;
      case 'characterData':
        console.log('Text change');
        console.log('  Old value:', mutation.oldValue);
        console.log('  New value:', mutation.target.textContent);
        break;
    }
  });
});
```

---

## Code Examples

### Basic Usage

```javascript
// Create observer
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    console.log('DOM change detected:', mutation.type);
  });
});

// Get target node
const targetNode = document.getElementById('target');

// Start observing
observer.observe(targetNode, {
  childList: true,
  attributes: true,
  characterData: true,
  subtree: true
});

// Stop observing
// observer.disconnect();
```

### Monitoring Child Node Changes (childList)

```javascript
const container = document.getElementById('list-container');

const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      // Handle added nodes
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          console.log('Element added:', node.tagName, node.id);
          // Can add event listeners to new elements, etc.
        }
      });

      // Handle removed nodes
      mutation.removedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          console.log('Element removed:', node.tagName, node.id);
          // Can perform cleanup operations
        }
      });
    }
  });
});

observer.observe(container, { childList: true });

// Test
const newItem = document.createElement('li');
newItem.id = 'item-1';
newItem.textContent = 'New item';
container.appendChild(newItem);  // Triggers callback

container.removeChild(newItem);  // Triggers callback
```

### Monitoring Attribute Changes (attributes)

```javascript
const element = document.getElementById('my-element');

const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'attributes') {
      const attrName = mutation.attributeName;
      const oldValue = mutation.oldValue;
      const newValue = mutation.target.getAttribute(attrName);

      console.log(`Attribute "${attrName}" changed from "${oldValue}" to "${newValue}"`);
    }
  });
});

observer.observe(element, {
  attributes: true,
  attributeOldValue: true,
  attributeFilter: ['class', 'data-status']  // Only monitor these attributes
});

// Test
element.setAttribute('class', 'active');        // Triggers callback
element.setAttribute('data-status', 'loading'); // Triggers callback
element.setAttribute('title', 'Title');         // Does not trigger (not in filter list)
```

### Monitoring Text Content Changes (characterData)

```javascript
const textNode = document.getElementById('editable').firstChild;

const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.type === 'characterData') {
      console.log('Text changed from:', mutation.oldValue);
      console.log('To:', mutation.target.textContent);
    }
  });
});

// Note: characterData requires directly observing text nodes
observer.observe(textNode, {
  characterData: true,
  characterDataOldValue: true
});

// Or use subtree to observe parent element
const parent = document.getElementById('editable');
observer.observe(parent, {
  characterData: true,
  characterDataOldValue: true,
  subtree: true  // Monitor all descendant nodes, including text nodes
});
```

### Monitoring Descendant Node Changes (subtree)

```javascript
const root = document.getElementById('app');

const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    // Can get the specific location where the change occurred
    const path = getNodePath(mutation.target);
    console.log(`${mutation.type} change occurred at ${path}`);
  });
});

observer.observe(root, {
  childList: true,
  attributes: true,
  characterData: true,
  subtree: true  // Monitor all descendants
});

// Helper function: Get node path
function getNodePath(node) {
  const path = [];
  while (node && node !== document.body) {
    let selector = node.nodeName.toLowerCase();
    if (node.id) {
      selector += `#${node.id}`;
    } else if (node.className && typeof node.className === 'string') {
      selector += `.${node.className.split(' ').join('.')}`;
    }
    path.unshift(selector);
    node = node.parentNode;
  }
  return path.join(' > ');
}
```

### Implementing Undo/Redo Functionality

```javascript
class UndoManager {
  constructor(targetElement) {
    this.target = targetElement;
    this.undoStack = [];
    this.redoStack = [];
    this.isUndoing = false;

    this.setupObserver();
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      // Don't record during undo/redo operations
      if (this.isUndoing) return;

      // Push change records to undo stack
      this.undoStack.push(mutations.map(m => this.serializeMutation(m)));
      // Clear redo stack on new operation
      this.redoStack = [];
    });

    this.observer.observe(this.target, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true,
      attributeOldValue: true,
      characterDataOldValue: true
    });
  }

  serializeMutation(mutation) {
    return {
      type: mutation.type,
      target: mutation.target,
      addedNodes: Array.from(mutation.addedNodes),
      removedNodes: Array.from(mutation.removedNodes),
      previousSibling: mutation.previousSibling,
      nextSibling: mutation.nextSibling,
      attributeName: mutation.attributeName,
      oldValue: mutation.oldValue,
      newValue: mutation.type === 'attributes'
        ? mutation.target.getAttribute(mutation.attributeName)
        : mutation.target.textContent
    };
  }

  undo() {
    if (this.undoStack.length === 0) return;

    this.isUndoing = true;
    const mutations = this.undoStack.pop();

    // Apply changes in reverse
    mutations.reverse().forEach(m => this.reverseMutation(m));

    this.redoStack.push(mutations.reverse());
    this.isUndoing = false;
  }

  redo() {
    if (this.redoStack.length === 0) return;

    this.isUndoing = true;
    const mutations = this.redoStack.pop();

    // Reapply changes
    mutations.forEach(m => this.applyMutation(m));

    this.undoStack.push(mutations);
    this.isUndoing = false;
  }

  reverseMutation(mutation) {
    switch (mutation.type) {
      case 'childList':
        // Remove previously added nodes
        mutation.addedNodes.forEach(node => {
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          }
        });
        // Restore previously removed nodes
        mutation.removedNodes.forEach(node => {
          const refNode = mutation.nextSibling;
          mutation.target.insertBefore(node, refNode);
        });
        break;
      case 'attributes':
        if (mutation.oldValue === null) {
          mutation.target.removeAttribute(mutation.attributeName);
        } else {
          mutation.target.setAttribute(mutation.attributeName, mutation.oldValue);
        }
        break;
      case 'characterData':
        mutation.target.textContent = mutation.oldValue;
        break;
    }
  }

  applyMutation(mutation) {
    switch (mutation.type) {
      case 'childList':
        mutation.removedNodes.forEach(node => {
          if (node.parentNode) {
            node.parentNode.removeChild(node);
          }
        });
        mutation.addedNodes.forEach(node => {
          const refNode = mutation.nextSibling;
          mutation.target.insertBefore(node, refNode);
        });
        break;
      case 'attributes':
        mutation.target.setAttribute(mutation.attributeName, mutation.newValue);
        break;
      case 'characterData':
        mutation.target.textContent = mutation.newValue;
        break;
    }
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage example
const editor = document.getElementById('editor');
const undoManager = new UndoManager(editor);

// Keyboard shortcut bindings
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    undoManager.undo();
  }
  if (e.ctrlKey && e.key === 'y') {
    e.preventDefault();
    undoManager.redo();
  }
});
```

### Monitoring Dynamically Loaded Content

```javascript
// Wait for a specific element to appear
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    // Check if element already exists
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Timeout handling
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for element ${selector}`));
    }, timeout);
  });
}

// Usage example
waitForElement('#dynamic-content')
  .then(element => {
    console.log('Element loaded:', element);
  })
  .catch(error => {
    console.error(error.message);
  });
```

### Implementing Reactive Data Binding

```javascript
class SimpleReactiveBinding {
  constructor(rootElement) {
    this.root = rootElement;
    this.bindings = new Map();
    this.data = {};

    this.setupObserver();
    this.scanBindings();
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          // Scan bindings when nodes are added
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanElement(node);
            }
          });
        }
      });
    });

    this.observer.observe(this.root, {
      childList: true,
      subtree: true
    });
  }

  scanBindings() {
    this.scanElement(this.root);
  }

  scanElement(element) {
    // Find elements with data-bind attribute
    const bindElements = element.querySelectorAll('[data-bind]');
    bindElements.forEach(el => {
      const key = el.dataset.bind;
      if (!this.bindings.has(key)) {
        this.bindings.set(key, new Set());
      }
      this.bindings.get(key).add(el);

      // If data already exists, update immediately
      if (key in this.data) {
        this.updateElement(el, this.data[key]);
      }
    });

    // Handle the element itself
    if (element.dataset?.bind) {
      const key = element.dataset.bind;
      if (!this.bindings.has(key)) {
        this.bindings.set(key, new Set());
      }
      this.bindings.get(key).add(element);
    }
  }

  set(key, value) {
    this.data[key] = value;

    // Update all bound elements
    const elements = this.bindings.get(key);
    if (elements) {
      elements.forEach(el => this.updateElement(el, value));
    }
  }

  updateElement(element, value) {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.value = value;
    } else {
      element.textContent = value;
    }
  }

  destroy() {
    this.observer.disconnect();
    this.bindings.clear();
  }
}

// Usage example
// HTML: <span data-bind="username"></span>
const binding = new SimpleReactiveBinding(document.body);
binding.set('username', 'John Doe');  // All elements with data-bind="username" will update
```

---

## Best Practices

### Selective Monitoring

```javascript
// Not recommended: Monitor all changes
observer.observe(element, {
  childList: true,
  attributes: true,
  characterData: true,
  subtree: true
});

// Recommended: Only monitor what's needed
observer.observe(element, {
  attributes: true,
  attributeFilter: ['class']  // Only monitor class attribute
});
```

### Use attributeFilter to Filter Attributes

```javascript
// When only monitoring specific attributes, use attributeFilter
const observer = new MutationObserver(callback);

observer.observe(element, {
  attributes: true,
  attributeFilter: ['data-state', 'aria-expanded']  // Only monitor these two attributes
});
```

### Clean Up Observers Promptly

```javascript
class Component {
  constructor() {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(this.element, { childList: true });
  }

  handleMutations(mutations) {
    // Handle changes
  }

  // Clean up when component is destroyed
  destroy() {
    // Handle pending changes
    const pending = this.observer.takeRecords();
    if (pending.length > 0) {
      this.handleMutations(pending);
    }

    // Disconnect
    this.observer.disconnect();
    this.observer = null;
  }
}
```

### Avoid Triggering New Changes in Callbacks

```javascript
// Not recommended: May cause infinite loop
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    // This triggers a new change, potentially causing an infinite loop
    mutation.target.setAttribute('data-modified', 'true');
  });
});

// Recommended: Use a flag to avoid loops
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    // Check if already processed
    if (mutation.target.dataset.processing === 'true') return;

    // Set processing flag
    mutation.target.dataset.processing = 'true';

    // Processing logic...

    // Use requestAnimationFrame to delay removing the flag
    requestAnimationFrame(() => {
      delete mutation.target.dataset.processing;
    });
  });
});
```

### Batch Process Changes

```javascript
const observer = new MutationObserver((mutations) => {
  // Collect all changes
  const changes = {
    added: [],
    removed: [],
    modified: []
  };

  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      changes.added.push(...mutation.addedNodes);
      changes.removed.push(...mutation.removedNodes);
    } else if (mutation.type === 'attributes') {
      changes.modified.push({
        element: mutation.target,
        attribute: mutation.attributeName
      });
    }
  });

  // Batch process
  if (changes.added.length > 0) {
    handleAddedNodes(changes.added);
  }
  if (changes.removed.length > 0) {
    handleRemovedNodes(changes.removed);
  }
  if (changes.modified.length > 0) {
    handleModifiedElements(changes.modified);
  }
});
```

### Framework Integration

#### React Hook

```javascript
import { useEffect, useRef, useCallback } from 'react';

function useMutationObserver(callback, options = {}) {
  const targetRef = useRef(null);
  const observerRef = useRef(null);

  const memoizedCallback = useCallback(callback, [callback]);

  useEffect(() => {
    if (!targetRef.current) return;

    observerRef.current = new MutationObserver(memoizedCallback);

    observerRef.current.observe(targetRef.current, {
      childList: options.childList ?? false,
      attributes: options.attributes ?? false,
      characterData: options.characterData ?? false,
      subtree: options.subtree ?? false,
      attributeOldValue: options.attributeOldValue ?? false,
      characterDataOldValue: options.characterDataOldValue ?? false,
      attributeFilter: options.attributeFilter
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [memoizedCallback, options]);

  return targetRef;
}

// Usage example
function MyComponent() {
  const handleMutations = useCallback((mutations) => {
    console.log('DOM changes:', mutations);
  }, []);

  const containerRef = useMutationObserver(handleMutations, {
    childList: true,
    subtree: true
  });

  return <div ref={containerRef}>Dynamic content container</div>;
}
```

#### Vue 3 Composable

```javascript
import { ref, onMounted, onUnmounted } from 'vue';

export function useMutationObserver(options = {}) {
  const targetRef = ref(null);
  let observer = null;

  const mutations = ref([]);

  onMounted(() => {
    if (!targetRef.value) return;

    observer = new MutationObserver((mutationsList) => {
      mutations.value = mutationsList;
      options.callback?.(mutationsList);
    });

    observer.observe(targetRef.value, {
      childList: options.childList ?? false,
      attributes: options.attributes ?? false,
      characterData: options.characterData ?? false,
      subtree: options.subtree ?? false
    });
  });

  onUnmounted(() => {
    observer?.disconnect();
  });

  return { targetRef, mutations };
}

// Usage example
// <script setup>
// const { targetRef, mutations } = useMutationObserver({
//   childList: true,
//   callback: (m) => console.log('Changes:', m)
// });
// </script>
// <template>
//   <div ref="targetRef">Content</div>
// </template>
```

---

## Common Pitfalls

### Observing Disconnected Nodes

```javascript
// Problem: Observing a node removed from the DOM
const element = document.getElementById('target');
observer.observe(element, { attributes: true });

// After element is removed, observer won't receive any changes
element.parentNode.removeChild(element);
element.setAttribute('class', 'new-class');  // Won't trigger callback

// Solution: Stop observing before removal
observer.unobserve(element);  // Note: This method doesn't exist!

// Correct approach: Use disconnect() or re-observe()
observer.disconnect();
```

### Misunderstanding characterData Target

```javascript
// Problem: characterData requires observing text nodes directly
const div = document.createElement('div');
div.textContent = 'Hello';

// This won't work!
observer.observe(div, { characterData: true });
div.textContent = 'World';  // Won't trigger

// Correct approach 1: Observe the text node
const textNode = div.firstChild;
observer.observe(textNode, { characterData: true });
textNode.textContent = 'World';  // Will trigger

// Correct approach 2: Use subtree
observer.observe(div, {
  characterData: true,
  subtree: true  // Monitor text nodes in subtree
});
```

### Accessing DOM State Synchronously

```javascript
// Problem: DOM accessed in callback may have already changed
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    // Attribute may have changed again
    const currentValue = mutation.target.getAttribute(mutation.attributeName);
    const recordedOldValue = mutation.oldValue;

    console.log(`Recorded old value: ${recordedOldValue}`);
    console.log(`Current value: ${currentValue}`);  // May not be the new value at trigger time
  });
});

// Solution: Use information from MutationRecord
observer.observe(element, {
  attributes: true,
  attributeOldValue: true
});
```

### Ignoring NodeList Liveness

```javascript
// Problem: addedNodes and removedNodes are static NodeLists
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      // Node may have been removed again
      console.log('Parent node:', node.parentNode);  // May be null
    });
  });
});
```

### Memory Leaks

```javascript
// Problem: Not cleaning up observers
function setupObserver() {
  const observer = new MutationObserver(handleMutations);
  observer.observe(document.body, { childList: true, subtree: true });
  // No observer reference saved, cannot clean up
}

// Correct approach: Save reference and clean up at appropriate time
class MyModule {
  constructor() {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  destroy() {
    this.observer.disconnect();
    this.observer = null;
  }
}
```

### Configuration Option Errors

```javascript
// Problem: No valid monitoring options set
const observer = new MutationObserver(callback);

// This will throw an error
observer.observe(element, {});  // TypeError

// This won't trigger any callbacks
observer.observe(element, { subtree: true });  // Only setting subtree is useless

// Correct: Set at least one monitoring type
observer.observe(element, {
  childList: true  // Must set childList, attributes, or characterData
});
```

---

## Performance Considerations

### Comparison with Mutation Events

| Aspect | MutationObserver | Mutation Events |
|--------|-----------------|-----------------|
| Execution mode | Async (microtask) | Sync |
| Batch processing | Automatically combines multiple changes | Each change triggers separately |
| Performance impact | Low | High |
| Callback frequency | Optimized batch callbacks | Can cause event storms |
| Browser support | Modern browsers | Deprecated |

### Performance Testing

```javascript
// Performance comparison test
function performanceTest() {
  const container = document.getElementById('test-container');
  let mutationCount = 0;
  let eventCount = 0;

  // MutationObserver
  const observer = new MutationObserver((mutations) => {
    mutationCount += mutations.length;
  });
  observer.observe(container, { childList: true });

  // Execute many DOM operations
  console.time('DOM operations');
  for (let i = 0; i < 1000; i++) {
    const div = document.createElement('div');
    container.appendChild(div);
  }
  console.timeEnd('DOM operations');

  // Check results in microtask
  queueMicrotask(() => {
    console.log(`MutationObserver callback triggered: 1 time`);
    console.log(`Total changes recorded: ${mutationCount}`);
    observer.disconnect();
  });
}
```

### Optimization Suggestions

#### Minimize Observation Scope

```javascript
// Not recommended: Observe entire document.body
observer.observe(document.body, { childList: true, subtree: true });

// Recommended: Only observe necessary containers
const targetContainer = document.getElementById('dynamic-content');
observer.observe(targetContainer, { childList: true });
```

#### Use attributeFilter

```javascript
// Not recommended: Monitor all attributes
observer.observe(element, { attributes: true });

// Recommended: Only monitor needed attributes
observer.observe(element, {
  attributes: true,
  attributeFilter: ['class', 'data-state']
});
```

#### Avoid Deeply Nested subtree

```javascript
// Using subtree in complex DOM trees may affect performance
// Consider setting up multiple observers on more specific nodes

const sections = document.querySelectorAll('.section');
sections.forEach(section => {
  const sectionObserver = new MutationObserver(handleMutations);
  sectionObserver.observe(section, { childList: true });
});
```

#### Debounce Processing

```javascript
// If changes are very frequent, add debouncing
function createDebouncedObserver(callback, delay = 100) {
  let timeoutId = null;
  let pendingMutations = [];

  const observer = new MutationObserver((mutations) => {
    pendingMutations.push(...mutations);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(pendingMutations);
      pendingMutations = [];
      timeoutId = null;
    }, delay);
  });

  return observer;
}

const debouncedObserver = createDebouncedObserver((mutations) => {
  console.log(`Batch processing ${mutations.length} changes`);
}, 100);
```

#### Use requestIdleCallback for Processing

```javascript
// Process changes during idle time
const observer = new MutationObserver((mutations) => {
  // Delay processing to idle time
  requestIdleCallback((deadline) => {
    while (mutations.length > 0 && deadline.timeRemaining() > 0) {
      const mutation = mutations.shift();
      processMutation(mutation);
    }

    // If there are still unprocessed changes, continue in next idle time
    if (mutations.length > 0) {
      requestIdleCallback(arguments.callee);
    }
  });
});
```

---

## Practical Scenarios

### Scenario 1: Auto-Initialize Components

```javascript
// Automatically initialize dynamically loaded components
class ComponentInitializer {
  constructor() {
    this.initializerMap = new Map();
    this.setupObserver();
  }

  register(selector, initializer) {
    this.initializerMap.set(selector, initializer);

    // Initialize existing elements
    document.querySelectorAll(selector).forEach(el => {
      if (!el.dataset.initialized) {
        initializer(el);
        el.dataset.initialized = 'true';
      }
    });
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.initializeElement(node);
            // Check child elements
            this.initializerMap.forEach((initializer, selector) => {
              node.querySelectorAll(selector).forEach(el => {
                if (!el.dataset.initialized) {
                  initializer(el);
                  el.dataset.initialized = 'true';
                }
              });
            });
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  initializeElement(element) {
    this.initializerMap.forEach((initializer, selector) => {
      if (element.matches(selector) && !element.dataset.initialized) {
        initializer(element);
        element.dataset.initialized = 'true';
      }
    });
  }
}

// Usage example
const initializer = new ComponentInitializer();

initializer.register('.tooltip', (el) => {
  // Initialize tooltip
  console.log('Initializing tooltip:', el);
});

initializer.register('.dropdown', (el) => {
  // Initialize dropdown
  console.log('Initializing dropdown:', el);
});

// Dynamically added elements will be auto-initialized
document.body.innerHTML += '<div class="tooltip">Tooltip content</div>';
```

### Scenario 2: Form Auto-Save

```javascript
class FormAutoSaver {
  constructor(formElement, saveCallback) {
    this.form = formElement;
    this.saveCallback = saveCallback;
    this.saveTimeout = null;
    this.lastSavedData = null;

    this.setupObserver();
    this.setupInputListeners();
  }

  setupObserver() {
    // Monitor form structure changes (dynamically added fields)
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Bind events to newly added input elements
            this.bindInputEvents(node);
          }
        });
      });
    });

    this.observer.observe(this.form, {
      childList: true,
      subtree: true
    });
  }

  setupInputListeners() {
    this.bindInputEvents(this.form);
  }

  bindInputEvents(container) {
    const inputs = container.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.dataset.autoSaveBound) return;

      input.addEventListener('input', () => this.scheduleAutoSave());
      input.addEventListener('change', () => this.scheduleAutoSave());
      input.dataset.autoSaveBound = 'true';
    });

    // If container itself is an input element
    if (container.matches?.('input, textarea, select') && !container.dataset.autoSaveBound) {
      container.addEventListener('input', () => this.scheduleAutoSave());
      container.addEventListener('change', () => this.scheduleAutoSave());
      container.dataset.autoSaveBound = 'true';
    }
  }

  scheduleAutoSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.save();
    }, 1000);  // 1 second debounce
  }

  save() {
    const formData = new FormData(this.form);
    const data = Object.fromEntries(formData.entries());

    // Check if data has changed
    if (JSON.stringify(data) === this.lastSavedData) {
      return;
    }

    this.lastSavedData = JSON.stringify(data);
    this.saveCallback(data);
  }

  destroy() {
    this.observer.disconnect();
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }
}

// Usage example
const form = document.getElementById('my-form');
const autoSaver = new FormAutoSaver(form, (data) => {
  console.log('Auto-saving:', data);
  // Send to server
  fetch('/api/save-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
});
```

### Scenario 3: Third-Party Script Monitoring

```javascript
// Monitor third-party script modifications to DOM
class ThirdPartyScriptMonitor {
  constructor() {
    this.modifications = [];
    this.setupObserver();
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      const now = Date.now();

      mutations.forEach(mutation => {
        const record = {
          timestamp: now,
          type: mutation.type,
          target: this.getElementSelector(mutation.target)
        };

        if (mutation.type === 'childList') {
          record.addedCount = mutation.addedNodes.length;
          record.removedCount = mutation.removedNodes.length;

          // Detect suspicious script injection
          mutation.addedNodes.forEach(node => {
            if (node.nodeName === 'SCRIPT') {
              console.warn('Script injection detected:', node.src || 'inline script');
              record.suspicious = true;
            }
            if (node.nodeName === 'IFRAME') {
              console.warn('Iframe injection detected:', node.src);
              record.suspicious = true;
            }
          });
        } else if (mutation.type === 'attributes') {
          record.attribute = mutation.attributeName;
          record.oldValue = mutation.oldValue;
        }

        this.modifications.push(record);
      });
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true,
      attributeOldValue: true
    });
  }

  getElementSelector(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return element?.nodeName || 'unknown';
    }

    let selector = element.tagName.toLowerCase();
    if (element.id) {
      selector += `#${element.id}`;
    } else if (element.className && typeof element.className === 'string') {
      selector += `.${element.className.split(' ').filter(c => c).join('.')}`;
    }
    return selector;
  }

  getReport() {
    return {
      totalModifications: this.modifications.length,
      byType: this.groupBy(this.modifications, 'type'),
      suspicious: this.modifications.filter(m => m.suspicious),
      timeline: this.modifications
    };
  }

  groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) result[group] = [];
      result[group].push(item);
      return result;
    }, {});
  }

  stop() {
    this.observer.disconnect();
    return this.getReport();
  }
}

// Usage example
const monitor = new ThirdPartyScriptMonitor();

// Generate report on page unload
window.addEventListener('beforeunload', () => {
  const report = monitor.stop();
  console.log('DOM modification report:', report);
});
```

### Scenario 4: Accessibility Enhancement

```javascript
// Automatically add ARIA attributes to dynamic content
class AccessibilityEnhancer {
  constructor(rootElement) {
    this.root = rootElement;
    this.setupObserver();
    this.enhanceExisting();
  }

  setupObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.enhanceElement(node);
          }
        });
      });
    });

    this.observer.observe(this.root, {
      childList: true,
      subtree: true
    });
  }

  enhanceExisting() {
    this.enhanceElement(this.root);
  }

  enhanceElement(element) {
    // Enhance images
    element.querySelectorAll('img:not([alt])').forEach(img => {
      img.setAttribute('alt', '');  // Empty alt indicates decorative image
      console.log('Added empty alt attribute:', img.src);
    });

    // Enhance buttons
    element.querySelectorAll('button:not([type])').forEach(button => {
      button.setAttribute('type', 'button');
    });

    // Enhance links
    element.querySelectorAll('a[target="_blank"]:not([rel])').forEach(link => {
      link.setAttribute('rel', 'noopener noreferrer');
    });

    // Enhance forms
    element.querySelectorAll('input:not([id])').forEach((input, index) => {
      const id = `auto-input-${Date.now()}-${index}`;
      input.setAttribute('id', id);

      // Find adjacent label
      const label = input.previousElementSibling;
      if (label?.tagName === 'LABEL' && !label.hasAttribute('for')) {
        label.setAttribute('for', id);
      }
    });

    // Handle element itself
    if (element.matches?.('img:not([alt])')) {
      element.setAttribute('alt', '');
    }
  }

  destroy() {
    this.observer.disconnect();
  }
}

// Usage example
const enhancer = new AccessibilityEnhancer(document.body);
```

---

## Interview Key Points

### Common Interview Questions

#### What is MutationObserver? How is it different from Mutation Events?

**Answer key points**:
- MutationObserver is an API for monitoring DOM changes, observing node additions/deletions, attribute changes, and text content changes
- Differences from Mutation Events:
  - **Execution mode**: MutationObserver executes asynchronously (microtask), Mutation Events execute synchronously
  - **Performance**: MutationObserver automatically batch processes, Mutation Events trigger for every change
  - **Status**: Mutation Events are deprecated, MutationObserver is the modern standard

#### What configuration options does observe() method have?

```javascript
observer.observe(target, {
  childList: true,              // Monitor child node additions/deletions
  attributes: true,             // Monitor attribute changes
  characterData: true,          // Monitor text content changes
  subtree: true,                // Monitor all descendant nodes
  attributeOldValue: true,      // Record values before attribute changes
  characterDataOldValue: true,  // Record values before text changes
  attributeFilter: ['class']    // Only monitor specified attributes
});
```

#### What information does MutationRecord contain?

**Answer key points**:
- `type`: Change type (childList/attributes/characterData)
- `target`: Target node where change occurred
- `addedNodes/removedNodes`: Lists of added/removed nodes
- `previousSibling/nextSibling`: Adjacent sibling nodes
- `attributeName`: Name of changed attribute
- `oldValue`: Value before change (requires configuration)

#### How to properly clean up a MutationObserver?

```javascript
// Get pending changes
const pending = observer.takeRecords();
// Process pending changes
pending.forEach(processMutation);
// Disconnect
observer.disconnect();
```

#### At which phase of the event loop does MutationObserver callback execute?

**Answer**: MutationObserver callbacks execute during the microtask phase, after the current macrotask ends and before the next macrotask begins.

```javascript
// Execution order demonstration
console.log('1. Synchronous code');
document.body.appendChild(document.createElement('div'));
Promise.resolve().then(() => console.log('3. Promise'));
setTimeout(() => console.log('4. setTimeout'), 0);
// MutationObserver callback executes at position 2
console.log('5. Synchronous code ends');
// Output: 1, 5, 2(Observer), 3, 4
```

#### How to implement waiting for an element to appear using MutationObserver?

```javascript
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error('Timeout'));
    }, timeout);
  });
}
```

---

## Further Reading

### Official Documentation

- [MDN - MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
- [W3C - DOM Standard - Mutation Observers](https://dom.spec.whatwg.org/#mutation-observers)
- [MDN - MutationRecord](https://developer.mozilla.org/en-US/docs/Web/API/MutationRecord)

### Related APIs

- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) - Observe element visibility
- [Resize Observer API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) - Observe element size changes
- [Performance Observer API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver) - Observe performance metrics

### Browser Compatibility

| Browser | Minimum Supported Version |
|---------|--------------------------|
| Chrome | 26+ |
| Firefox | 14+ |
| Safari | 7+ |
| Edge | 12+ |
| IE | 11 |

### Polyfill

For scenarios requiring older browser support, you can use a polyfill:

```bash
npm install mutationobserver-shim
```

```javascript
import 'mutationobserver-shim';
```

### Recommended Articles

- [Google Developers - Detect DOM changes with Mutation Observers](https://developers.google.com/web/updates/2012/02/Detect-DOM-changes-with-Mutation-Observers)
- [JavaScript.info - Mutation Observer](https://javascript.info/mutation-observer)
