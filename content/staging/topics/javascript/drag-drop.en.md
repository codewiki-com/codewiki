---
title: JavaScript Drag and Drop API
description: Comprehensive guide to the HTML5 Drag and Drop API, covering concepts, implementation patterns, best practices, and real-world use cases for building interactive drag-and-drop interfaces.
track: javascript
section: browser
difficulty: intermediate
tags:
  - drag-and-drop
  - Web API
  - DOM events
  - UI interaction
  - HTML5
status: imported
origin: old/src/content/docs/javascript/drag-drop.en.md
divergence: 0.323
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - order-mismatch
legacy:
  category: JavaScript
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---

## Concept Explanation

The **Drag and Drop API** is a native HTML5 specification that enables developers to implement drag-and-drop functionality directly in web browsers without relying on external libraries. It provides a standardized way to handle the interaction between draggable elements (sources) and drop targets (destinations).

### Historical Context

Drag and drop was historically complex in web development, requiring custom implementations using mouse events (mousedown, mousemove, mouseup). The HTML5 Drag and Drop API was introduced to standardize this functionality, making it more intuitive and performant.

### What Problems Does It Solve?

1. **Standardization**: Provides a consistent API across browsers for drag-and-drop interactions
2. **Native Browser Support**: Enables drag-and-drop features without custom JavaScript libraries
3. **Complex Interactions**: Simplifies implementation of file uploads, reordering lists, and multi-element interactions
4. **Accessibility**: Built-in mechanisms for visual feedback and data transfer
5. **Cross-Frame Drag**: Allows dragging between different windows and frames

## Core Principles

### Three Key Components

**Draggable Element**: An element with the `draggable="true"` attribute that initiates the drag operation.

**Drag Data Store**: A temporary data container that holds information during the drag operation, accessible via the `DataTransfer` object.

**Drop Target**: An element configured to accept dropped items by preventing default drag-over behavior and handling the drop event.

### Event Sequence

The drag-and-drop lifecycle follows a predictable sequence:

```
dragstart → drag → dragenter → dragover → dragleave → drop → dragend
```

### DataTransfer Object

Central to the API, this object:
- Stores data being transferred via the `setData()` method
- Specifies allowed drop effects (copy, move, link)
- Controls the visual feedback during dragging
- Is only accessible during specific events

### Drop Effects

The API supports three primary drop effects:

- **copy**: Creates a duplicate of the dragged item
- **move**: Relocates the dragged item
- **link**: Creates a reference or link to the source item

### Data Types

Data can be transferred in multiple formats:

```
text/plain
text/html
text/uri-list
application/json
Custom MIME types
```

## Key Points

### Essential Concepts

1. **Draggable Attribute**: Only elements with `draggable="true"` or certain native elements (images, links) are draggable by default.

2. **Drop Zone Prevention**: Drop targets must prevent the default dragover behavior using `event.preventDefault()`.

3. **Visual Feedback**: The `setDragImage()` method customizes the drag ghost image shown during dragging.

4. **Data Persistence**: DataTransfer object exists only during drag operations; attempting to access it outside drag events returns null.

5. **Browser-Specific Behavior**: File handling differs between browsers; some restrictions apply to cross-origin file drags.

6. **Performance Considerations**: Drag events fire frequently (dragover every few milliseconds), requiring optimized handlers.

7. **Accessibility Integration**: Proper semantic HTML and ARIA attributes are crucial for keyboard navigation and screen readers.

### Common Patterns

- **Drag to Reorder**: Lists, kanban boards, and dashboard layouts
- **File Upload**: Drag files onto designated areas
- **Item Transfer**: Moving elements between containers
- **Visual Feedback**: Highlighting valid drop zones during dragging

## Code Examples

### Basic Draggable Element

```javascript
// HTML
<div draggable="true" id="draggable">Drag me!</div>

// JavaScript
const draggable = document.getElementById('draggable');

draggable.addEventListener('dragstart', (event) => {
  // Store data during drag
  event.dataTransfer.setData('text/plain', 'Item data');
  event.dataTransfer.effectAllowed = 'move';

  // Customize drag image
  const img = new Image();
  img.src = 'drag-icon.png';
  event.dataTransfer.setDragImage(img, 0, 0);
});

draggable.addEventListener('dragend', (event) => {
  // Cleanup after drag ends
  console.log(`Drop effect: ${event.dataTransfer.dropEffect}`);
});
```

### Drop Target Configuration

```javascript
const dropZone = document.getElementById('drop-zone');

// Prevent default to enable drop
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  dropZone.classList.add('drag-over');
});

// Handle when dragged item leaves the zone
dropZone.addEventListener('dragleave', (event) => {
  dropZone.classList.remove('drag-over');
});

// Handle the drop
dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.classList.remove('drag-over');

  const data = event.dataTransfer.getData('text/plain');
  console.log('Dropped data:', data);

  // Process dropped content
  const droppedText = document.createElement('p');
  droppedText.textContent = data;
  dropZone.appendChild(droppedText);
});
```

### File Drag and Drop

```javascript
const fileDropZone = document.getElementById('file-drop');
const fileInput = document.getElementById('file-input');

fileDropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
  fileDropZone.classList.add('highlight');
});

fileDropZone.addEventListener('dragleave', () => {
  fileDropZone.classList.remove('highlight');
});

fileDropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  fileDropZone.classList.remove('highlight');

  // Access dropped files
  const files = event.dataTransfer.files;

  Array.from(files).forEach((file) => {
    console.log(`File: ${file.name}, Size: ${file.size} bytes`);

    // Validate file type
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        fileDropZone.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  });
});
```

### Reorderable List

```javascript
class ReorderableList {
  constructor(listSelector) {
    this.list = document.querySelector(listSelector);
    this.draggedItem = null;
    this.init();
  }

  init() {
    this.list.addEventListener('dragstart', (e) => this.handleDragStart(e));
    this.list.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.list.addEventListener('drop', (e) => this.handleDrop(e));
    this.list.addEventListener('dragend', (e) => this.handleDragEnd(e));
  }

  handleDragStart(event) {
    const item = event.target.closest('[draggable="true"]');
    if (!item) return;

    this.draggedItem = item;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/html', item.innerHTML);
    item.classList.add('dragging');
  }

  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const item = event.target.closest('[draggable="true"]');
    if (item && item !== this.draggedItem) {
      const rect = item.getBoundingClientRect();
      const isAfter = event.clientY - rect.top > rect.height / 2;

      if (isAfter) {
        item.parentNode.insertBefore(this.draggedItem, item.nextSibling);
      } else {
        item.parentNode.insertBefore(this.draggedItem, item);
      }
    }
  }

  handleDrop(event) {
    event.preventDefault();
  }

  handleDragEnd() {
    if (this.draggedItem) {
      this.draggedItem.classList.remove('dragging');
      this.draggedItem = null;
    }
  }
}

// Usage
const list = new ReorderableList('#my-list');
```

### Advanced DataTransfer Usage

```javascript
// Custom data formats
element.addEventListener('dragstart', (event) => {
  // Store multiple data formats
  event.dataTransfer.setData('text/plain', 'Simple text');
  event.dataTransfer.setData('text/html', '<strong>HTML content</strong>');
  event.dataTransfer.setData('application/json',
    JSON.stringify({ id: 123, name: 'Item' })
  );
});

// Reading multiple formats in drop handler
dropZone.addEventListener('drop', (event) => {
  event.preventDefault();

  // Try to read in order of preference
  let data = event.dataTransfer.getData('application/json');
  if (data) {
    const item = JSON.parse(data);
    console.log('JSON data:', item);
  } else if (event.dataTransfer.types.includes('text/html')) {
    data = event.dataTransfer.getData('text/html');
    console.log('HTML data:', data);
  } else {
    data = event.dataTransfer.getData('text/plain');
    console.log('Text data:', data);
  }
});
```

## Best Practices

### Provide Visual Feedback

```javascript
// Clear indication of drag state
element.addEventListener('dragstart', (e) => {
  e.target.style.opacity = '0.5';
});

element.addEventListener('dragend', (e) => {
  e.target.style.opacity = '1';
});

// Highlight valid drop zones
dropZone.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dropZone.classList.add('valid-drop-zone');
});

dropZone.addEventListener('dragleave', (e) => {
  dropZone.classList.remove('valid-drop-zone');
});
```

### Always Prevent Default

```javascript
// Required for drop to work
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  // Handle drop
});
```

### Use Semantic HTML

```html
<div
  draggable="true"
  role="button"
  tabindex="0"
  aria-label="Draggable item"
  aria-description="Press Enter to activate drag mode"
>
  Item
</div>
```

### Set Appropriate Drop Effects

```javascript
// Only allow operations that your UI supports
element.addEventListener('dragstart', (e) => {
  if (canMove(element)) {
    e.dataTransfer.effectAllowed = 'move';
  } else if (canCopy(element)) {
    e.dataTransfer.effectAllowed = 'copy';
  } else {
    e.dataTransfer.effectAllowed = 'none';
  }
});
```

### Handle Multiple Data Types

```javascript
element.addEventListener('dragstart', (e) => {
  // Provide fallback formats
  e.dataTransfer.setData('text/plain', 'Fallback text');
  e.dataTransfer.setData('text/html', '<div>HTML version</div>');

  if (supportsJSON()) {
    e.dataTransfer.setData('application/json', JSON.stringify(data));
  }
});
```

### Optimize Event Handlers

```javascript
// Debounce dragover for performance
let dragOverTimer;

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();

  clearTimeout(dragOverTimer);
  dropZone.classList.add('drag-over');

  dragOverTimer = setTimeout(() => {
    dropZone.classList.remove('drag-over');
  }, 300);
});
```

## Common Pitfalls

### Forgetting to Prevent Default

```javascript
// WRONG: Drop won't work without preventDefault
dropZone.addEventListener('drop', (event) => {
  const data = event.dataTransfer.getData('text/plain');
  // This won't execute as expected
});

// CORRECT
dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  const data = event.dataTransfer.getData('text/plain');
});
```

### Accessing DataTransfer Outside Drag Events

```javascript
// WRONG: DataTransfer is null outside drag context
let cachedData = element.dataTransfer;

element.addEventListener('dragstart', (event) => {
  console.log(cachedData); // Always null
});

// CORRECT: Access within event handler
element.addEventListener('dragstart', (event) => {
  event.dataTransfer.setData('text/plain', 'data');
});
```

### Not Handling File Drops Securely

```javascript
// RISKY: Processing all dropped files without validation
dropZone.addEventListener('drop', (event) => {
  const files = event.dataTransfer.files;
  Array.from(files).forEach(file => {
    // Process without security checks
    upload(file);
  });
});

// SAFER: Validate file types and sizes
dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  const files = event.dataTransfer.files;
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

  Array.from(files).forEach(file => {
    if (file.size > MAX_SIZE) {
      console.error('File too large');
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error('Invalid file type');
      return;
    }
    upload(file);
  });
});
```

### Using Incompatible Drag Elements

```javascript
// Most elements aren't draggable by default
// WRONG: This won't be draggable
<div>Not draggable by default</div>

// CORRECT: Explicitly set draggable attribute
<div draggable="true">Now draggable</div>

// NOTE: These are naturally draggable
<img src="image.jpg">
<a href="#">Link</a>
```

### Ignoring effectAllowed/dropEffect

```javascript
// INCOMPLETE: Not setting effect hints causes confusion
element.addEventListener('dragstart', (e) => {
  e.dataTransfer.setData('text/plain', 'data');
  // Missing: e.dataTransfer.effectAllowed = 'move';
});

// COMPLETE: Explicitly set allowed effects
element.addEventListener('dragstart', (e) => {
  e.dataTransfer.setData('text/plain', 'data');
  e.dataTransfer.effectAllowed = 'move'; // Tell browser what's allowed
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move'; // Confirm effect
});
```

## Performance Considerations

### Dragover Event Frequency

```javascript
// Dragover fires continuously during drag
// INEFFICIENT: Heavy operations in dragover
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  // DOM queries, complex calculations
  document.querySelectorAll('.item').forEach(item => {
    // Heavy operation
  });
});

// EFFICIENT: Minimize work in dragover
let isDraggingOver = false;

dropZone.addEventListener('dragenter', (event) => {
  event.preventDefault();
  if (!isDraggingOver) {
    isDraggingOver = true;
    dropZone.classList.add('drag-over');
  }
});

dropZone.addEventListener('dragleave', (event) => {
  isDraggingOver = false;
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  // Light operation only
});
```

### Memory Management with Large Data

```javascript
// INEFFICIENT: Storing large objects in DataTransfer
element.addEventListener('dragstart', (e) => {
  const largeData = /* expensive computation */;
  e.dataTransfer.setData('application/json',
    JSON.stringify(largeData) // Stringification is expensive
  );
});

// EFFICIENT: Use IDs and lookup pattern
element.addEventListener('dragstart', (e) => {
  const id = element.dataset.id;
  e.dataTransfer.setData('text/plain', id);
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  const data = dataStore[id]; // Lookup from cache
});
```

### Avoiding Reflows

```javascript
// INEFFICIENT: Multiple DOM modifications during drag
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  items.forEach((item, index) => {
    item.style.order = index; // Triggers reflow for each item
  });
});

// EFFICIENT: Batch DOM updates
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  requestAnimationFrame(() => {
    items.forEach((item, index) => {
      item.style.order = index; // All updates in one frame
    });
  });
});
```

## Real-world Scenarios

### Kanban Board Implementation

```javascript
class KanbanBoard {
  constructor(boardSelector) {
    this.board = document.querySelector(boardSelector);
    this.draggedCard = null;
    this.init();
  }

  init() {
    this.board.addEventListener('dragstart', (e) => this.onCardDragStart(e));
    this.board.addEventListener('dragover', (e) => this.onCardDragOver(e));
    this.board.addEventListener('drop', (e) => this.onCardDrop(e));
    this.board.addEventListener('dragend', (e) => this.onCardDragEnd(e));
  }

  onCardDragStart(event) {
    const card = event.target.closest('[data-card-id]');
    if (!card) return;

    this.draggedCard = card;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('cardId', card.dataset.cardId);
    card.classList.add('dragging');
  }

  onCardDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const column = event.target.closest('[data-column-id]');
    if (column) {
      column.classList.add('drag-over-column');
    }
  }

  onCardDrop(event) {
    event.preventDefault();
    const columnId = event.target.closest('[data-column-id]')?.dataset.columnId;

    if (columnId && this.draggedCard) {
      const column = document.querySelector(
        `[data-column-id="${columnId}"] .cards-list`
      );
      column.appendChild(this.draggedCard);

      // Update backend
      this.updateCardPosition(
        this.draggedCard.dataset.cardId,
        columnId
      );
    }

    document.querySelectorAll('[data-column-id]').forEach(col => {
      col.classList.remove('drag-over-column');
    });
  }

  onCardDragEnd() {
    if (this.draggedCard) {
      this.draggedCard.classList.remove('dragging');
      this.draggedCard = null;
    }
  }

  updateCardPosition(cardId, columnId) {
    fetch('/api/cards/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId, columnId })
    });
  }
}

// Usage
const kanban = new KanbanBoard('#kanban-board');
```

### Image Gallery Upload

```javascript
class ImageUploadZone {
  constructor(dropZoneSelector) {
    this.dropZone = document.querySelector(dropZoneSelector);
    this.gallery = document.querySelector('#gallery');
    this.setupDropZone();
  }

  setupDropZone() {
    this.dropZone.addEventListener('dragover', (e) => this.onDragOver(e));
    this.dropZone.addEventListener('dragleave', (e) => this.onDragLeave(e));
    this.dropZone.addEventListener('drop', (e) => this.onDrop(e));
  }

  onDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    this.dropZone.classList.add('drag-active');
  }

  onDragLeave() {
    this.dropZone.classList.remove('drag-active');
  }

  async onDrop(event) {
    event.preventDefault();
    this.dropZone.classList.remove('drag-active');

    const files = event.dataTransfer.files;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));

    for (const file of imageFiles) {
      await this.processImage(file);
    }
  }

  async processImage(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.alt = file.name;

      const container = document.createElement('div');
      container.className = 'gallery-item';
      container.appendChild(img);

      this.gallery.appendChild(container);

      // Upload to server
      this.uploadImage(file);
    };

    reader.readAsDataURL(file);
  }

  uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    fetch('/api/upload', {
      method: 'POST',
      body: formData
    }).catch(error => console.error('Upload failed:', error));
  }
}

// Usage
new ImageUploadZone('#drop-zone');
```

## Interview Points

### Explain the Drag and Drop API Event Sequence

Answer should cover:
- dragstart: Initiates drag, sets data
- dragenter/dragover: Element hovers over drop targets
- dragleave: Element leaves drop target
- drop: Handles drop action
- dragend: Cleanup after drag

### What is the DataTransfer Object and How Does It Work?

Key points:
- Available only during drag events
- setData()/getData() for data transfer
- effectAllowed and dropEffect for visual feedback
- Files property for file drops
- setDragImage() for custom images

### Why Must You Call preventDefault() in dragover?

Answer:
- By default, elements can't be drop targets
- preventDefault() signals willingness to accept drops
- Required in both dragover and drop handlers
- Omitting it prevents drop events from firing

### What's the Difference Between effectAllowed and dropEffect?

Answer:
- **effectAllowed**: Set by source during dragstart, declares what operations are allowed
- **dropEffect**: Set by target during dragover/drop, confirms which operation will occur
- Both communicate intent to the browser and user

### How Do You Handle File Drops Safely?

Key security considerations:
- Always validate file types using MIME type checking
- Enforce file size limits
- Scan for malware if handling user uploads
- Never execute uploaded files directly
- Implement server-side validation as well

### What Performance Issues Can Occur with Drag and Drop?

Common issues:
- dragover fires many times per second
- Heavy DOM operations cause jank
- Large data transfers are slow
- Multiple event listeners accumulate overhead
- Solutions: debouncing, requestAnimationFrame, event delegation

### How Does Drag and Drop Work Across Different Browsers?

Answer should address:
- Most modern browsers support the standard API
- File handling differs slightly between browsers
- Some older browsers have limited support
- Feature detection is important
- Fallback implementations may be needed for legacy browsers

## Further Reading

### Official Documentation
- [MDN Web Docs: HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [W3C Drag and Drop Specification](https://www.w3.org/TR/html5/interaction.html#dnd)
- [WHATWG Living Standard](https://html.spec.whatwg.org/multipage/dnd.html)

### Related Web APIs
- [File and Directory Entries API](https://developer.mozilla.org/en-US/docs/Web/API/File_and_Directory_Entries_API)
- [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [DataTransfer Object Reference](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer)
- [Mouse Events](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

### Learning Resources
- [Smashing Magazine: Drag and Drop in Modern Web Design](https://www.smashingmagazine.com/)
- [CSS-Tricks: Native Drag and Drop](https://css-tricks.com/native-drag-and-drop/)
- [JavaScript.info: Drag'n'Drop with Mouse Events](https://javascript.info/mouse-drag-drop)
- [Web.dev: Drag and Drop Guide](https://web.dev/)

### Libraries and Frameworks
- [SortableJS](https://sortablejs.github.io/Sortable/): Reorderable lists
- [React Beautiful DnD](https://github.com/atlassian/react-beautiful-dnd): React drag-and-drop
- [dnd kit](https://docs.dndkit.com/): Modern React drag-and-drop
- [Vue Draggable Next](https://github.com/SortableJS/vue.draggable.next): Vue integration

### Tools and Utilities
- [DataTransfer Items API](https://html.spec.whatwg.org/multipage/dnd.html#datatransferitemlist)
- [File Reader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
- [Drag and Drop Inspector](https://www.w3.org/Submission/HTML-Drag-Drop-API/): Testing tool
- Browser DevTools for debugging drag events

### Best Practices Articles
- [MDN: Recommended Drag Types](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Recommended_drag_types)
- [Web Accessibility Guidelines for Drag and Drop](https://www.w3.org/WAI/WCAG21/Understanding/target-size)
- [Performance Optimization Techniques](https://web.dev/performance/)
