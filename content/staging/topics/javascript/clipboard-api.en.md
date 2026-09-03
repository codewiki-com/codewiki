---
title: Clipboard API
description: A complete guide to JavaScript Clipboard API, including clipboard read/write operations, permission management, and security best practices
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - Clipboard
  - Web API
  - Browser
status: imported
origin: old/src/content/docs/javascript/clipboard-api.en.md
divergence: 0.193
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: Browser APIs
  order: 20
  lastUpdated: 2026-01-07
---

The Clipboard API is a modern browser interface for accessing the system clipboard, allowing web applications to read and write clipboard content in a secure, asynchronous manner. It replaces the traditional `document.execCommand()` method, providing more powerful and secure clipboard operation capabilities.

## Concept Explanation

### What is the Clipboard API

The Clipboard API is a set of interfaces provided by the web platform for interacting with the system clipboard. It mainly consists of the following core components:

- **navigator.clipboard**: Returns the Clipboard object, which is the entry point for accessing clipboard functionality
- **Clipboard interface**: Provides methods for reading and writing to the clipboard
- **ClipboardItem**: Represents a data item in the clipboard
- **ClipboardEvent**: Event object related to clipboard operations

### Historical Background

Before the Clipboard API, web developers primarily relied on the `document.execCommand()` method to manipulate the clipboard:

```javascript
// Traditional approach (deprecated)
document.execCommand('copy');
document.execCommand('cut');
document.execCommand('paste');
```

This approach had several issues:

1. **Synchronous blocking**: Operations execute on the main thread, potentially causing page jank
2. **Limited functionality**: Only handles text, doesn't support images or rich content
3. **Security concerns**: Lacks a clear permission model
4. **Deprecated**: Modern browsers are gradually removing support

### Problems Solved

The Clipboard API addresses the following key issues:

| Issue | Traditional Approach | Clipboard API |
|-------|---------------------|---------------|
| Execution mode | Synchronous blocking | Asynchronous non-blocking |
| Data types | Text only | Text, images, HTML, etc. |
| Permission control | No explicit permissions | Based on Permissions API |
| API design | Command-based | Promise-based |
| Secure context | Not required | Requires HTTPS |

## Core Principles

### Security Model

The Clipboard API adopts a strict security model:

1. **Secure context requirement**: Must be used in HTTPS environment or localhost
2. **User gesture requirement**: Some operations require user interaction to trigger
3. **Permission system**: Fine-grained permission control based on Permissions API
4. **Focus requirement**: Page must be in active state

```javascript
// Check if in a secure context
if (window.isSecureContext) {
  console.log('Currently in a secure context, Clipboard API can be used');
} else {
  console.warn('HTTPS environment is required to use Clipboard API');
}
```

### Permission Mechanism

The Clipboard API uses two permissions:

- **clipboard-read**: Permission to read clipboard content
- **clipboard-write**: Permission to write clipboard content

```javascript
// Query clipboard read permission
async function checkClipboardPermission() {
  try {
    const readPermission = await navigator.permissions.query({
      name: 'clipboard-read'
    });

    console.log('Read permission status:', readPermission.state);
    // 'granted' | 'denied' | 'prompt'

    // Listen for permission state changes
    readPermission.addEventListener('change', () => {
      console.log('Permission state changed to:', readPermission.state);
    });

    return readPermission.state;
  } catch (error) {
    console.error('Permission query failed:', error);
    return null;
  }
}
```

### Data Flow Model

The Clipboard API data flow follows this pattern:

```
Write flow:
Application data → ClipboardItem → Blob → System clipboard

Read flow:
System clipboard → ClipboardItem[] → Blob → Application data
```

## Key Concepts

### The navigator.clipboard Object

`navigator.clipboard` is the global entry point for accessing clipboard functionality:

```javascript
// Check if Clipboard API is available
if ('clipboard' in navigator) {
  console.log('Clipboard API is available');
} else {
  console.log('Clipboard API is not available, polyfill needed');
}
```

### Four Core Methods

| Method | Description | Permission Required | User Gesture |
|--------|-------------|---------------------|--------------|
| `writeText()` | Write plain text | clipboard-write | Usually not required |
| `readText()` | Read plain text | clipboard-read | Required |
| `write()` | Write multiple formats | clipboard-write | Usually not required |
| `read()` | Read multiple formats | clipboard-read | Required |

### The ClipboardItem Class

`ClipboardItem` is used to represent data items in the clipboard:

```javascript
// ClipboardItem constructor
const item = new ClipboardItem({
  'text/plain': new Blob(['Hello, World!'], { type: 'text/plain' }),
  'text/html': new Blob(['<b>Hello, World!</b>'], { type: 'text/html' })
});

// Get supported types
console.log(item.types); // ['text/plain', 'text/html']

// Get data of a specific type
const blob = await item.getType('text/plain');
const text = await blob.text();
```

## Code Examples

### Basic Text Operations

#### Copy Text to Clipboard

```javascript
// Use writeText() to copy text
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Text copied to clipboard');
    return true;
  } catch (error) {
    console.error('Copy failed:', error);
    return false;
  }
}

// Usage example
copyText('Hello, Clipboard API!');

// Copy button implementation
document.getElementById('copyBtn').addEventListener('click', async () => {
  const textToCopy = document.getElementById('content').textContent;
  const success = await copyText(textToCopy);

  if (success) {
    showNotification('Copied successfully!');
  } else {
    showNotification('Copy failed, please copy manually');
  }
});
```

#### Read Text from Clipboard

```javascript
// Use readText() to read text
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText();
    console.log('Clipboard content:', text);
    return text;
  } catch (error) {
    console.error('Read failed:', error);
    return null;
  }
}

// Paste button implementation
document.getElementById('pasteBtn').addEventListener('click', async () => {
  const text = await pasteText();

  if (text !== null) {
    document.getElementById('input').value = text;
  }
});
```

### Rich Content Operations

#### Copy HTML Content

```javascript
// Copy rich text (HTML)
async function copyHTML(html, plainText) {
  try {
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([plainText], { type: 'text/plain' });

    const clipboardItem = new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob
    });

    await navigator.clipboard.write([clipboardItem]);
    console.log('HTML content copied');
    return true;
  } catch (error) {
    console.error('Failed to copy HTML:', error);
    return false;
  }
}

// Usage example
copyHTML(
  '<h1 style="color: blue;">Title</h1><p>This is some <strong>rich text</strong> content.</p>',
  'Title\nThis is some rich text content.'
);
```

#### Copy Images

```javascript
// Copy image to clipboard
async function copyImage(imageSource) {
  try {
    let blob;

    if (imageSource instanceof Blob) {
      blob = imageSource;
    } else if (typeof imageSource === 'string') {
      // Load image from URL
      const response = await fetch(imageSource);
      blob = await response.blob();
    } else if (imageSource instanceof HTMLCanvasElement) {
      // Get image from Canvas
      blob = await new Promise(resolve => {
        imageSource.toBlob(resolve, 'image/png');
      });
    }

    const clipboardItem = new ClipboardItem({
      [blob.type]: blob
    });

    await navigator.clipboard.write([clipboardItem]);
    console.log('Image copied to clipboard');
    return true;
  } catch (error) {
    console.error('Failed to copy image:', error);
    return false;
  }
}

// Copy from Canvas
const canvas = document.getElementById('myCanvas');
copyImage(canvas);

// Copy from URL
copyImage('https://example.com/image.png');
```

#### Read Clipboard Images

```javascript
// Read images from clipboard
async function pasteImage() {
  try {
    const clipboardItems = await navigator.clipboard.read();

    for (const item of clipboardItems) {
      // Check if it contains an image type
      const imageType = item.types.find(type => type.startsWith('image/'));

      if (imageType) {
        const blob = await item.getType(imageType);
        const imageUrl = URL.createObjectURL(blob);

        // Create image element
        const img = document.createElement('img');
        img.src = imageUrl;
        img.onload = () => URL.revokeObjectURL(imageUrl);

        return { blob, imageUrl, element: img };
      }
    }

    console.log('No image in clipboard');
    return null;
  } catch (error) {
    console.error('Failed to read image:', error);
    return null;
  }
}

// Paste image button
document.getElementById('pasteImageBtn').addEventListener('click', async () => {
  const result = await pasteImage();

  if (result) {
    document.getElementById('imageContainer').appendChild(result.element);
  }
});
```

### Reading Multiple Formats

```javascript
// Read all available formats from clipboard
async function readClipboard() {
  try {
    const clipboardItems = await navigator.clipboard.read();
    const results = [];

    for (const item of clipboardItems) {
      const itemData = {
        types: item.types,
        contents: {}
      };

      for (const type of item.types) {
        const blob = await item.getType(type);

        if (type.startsWith('text/')) {
          itemData.contents[type] = await blob.text();
        } else if (type.startsWith('image/')) {
          itemData.contents[type] = URL.createObjectURL(blob);
        } else {
          itemData.contents[type] = blob;
        }
      }

      results.push(itemData);
    }

    return results;
  } catch (error) {
    console.error('Failed to read clipboard:', error);
    return null;
  }
}

// Usage example
const clipboardData = await readClipboard();
console.log('Clipboard data:', clipboardData);
```

### Clipboard Event Handling

```javascript
// Listen for copy event
document.addEventListener('copy', (event) => {
  // Prevent default copy behavior
  event.preventDefault();

  // Get selected text
  const selectedText = window.getSelection().toString();

  // Customize copied content
  const customText = selectedText + '\n\nSource: My Website - https://example.com';

  // Set clipboard data
  event.clipboardData.setData('text/plain', customText);

  console.log('Copy content customized');
});

// Listen for cut event
document.addEventListener('cut', (event) => {
  event.preventDefault();

  const selectedText = window.getSelection().toString();
  event.clipboardData.setData('text/plain', selectedText);

  // Delete selected content
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    selection.deleteFromDocument();
  }
});

// Listen for paste event
document.addEventListener('paste', (event) => {
  event.preventDefault();

  // Get pasted data
  const text = event.clipboardData.getData('text/plain');
  const files = event.clipboardData.files;

  console.log('Pasted text:', text);
  console.log('Number of pasted files:', files.length);

  // Handle pasted images
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      handlePastedImage(file);
    }
  }

  // Safely insert plain text
  const activeElement = document.activeElement;
  if (activeElement && activeElement.tagName === 'INPUT') {
    activeElement.value += text;
  }
});

function handlePastedImage(file) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const img = document.createElement('img');
    img.src = e.target.result;
    document.getElementById('imageContainer').appendChild(img);
  };

  reader.readAsDataURL(file);
}
```

### Clipboard Utility Class

```javascript
class ClipboardManager {
  constructor() {
    this.isSupported = 'clipboard' in navigator;
  }

  // Check if API is available
  checkSupport() {
    if (!this.isSupported) {
      throw new Error('Clipboard API is not available');
    }

    if (!window.isSecureContext) {
      throw new Error('Secure context (HTTPS) required');
    }
  }

  // Copy text
  async copyText(text) {
    this.checkSupport();

    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Read text
  async readText() {
    this.checkSupport();

    try {
      const text = await navigator.clipboard.readText();
      return { success: true, data: text };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Copy rich content
  async copyRichContent(data) {
    this.checkSupport();

    try {
      const items = {};

      for (const [type, content] of Object.entries(data)) {
        if (content instanceof Blob) {
          items[type] = content;
        } else {
          items[type] = new Blob([content], { type });
        }
      }

      const clipboardItem = new ClipboardItem(items);
      await navigator.clipboard.write([clipboardItem]);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Copy image
  async copyImage(source) {
    this.checkSupport();

    try {
      let blob;

      if (source instanceof Blob) {
        blob = source;
      } else if (source instanceof HTMLCanvasElement) {
        blob = await new Promise((resolve, reject) => {
          source.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error('Canvas conversion failed'));
          }, 'image/png');
        });
      } else if (source instanceof HTMLImageElement) {
        const canvas = document.createElement('canvas');
        canvas.width = source.naturalWidth;
        canvas.height = source.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(source, 0, 0);
        blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      } else if (typeof source === 'string') {
        const response = await fetch(source);
        blob = await response.blob();
      }

      const clipboardItem = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([clipboardItem]);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Read all content
  async readAll() {
    this.checkSupport();

    try {
      const items = await navigator.clipboard.read();
      const results = [];

      for (const item of items) {
        const itemData = { types: item.types, content: {} };

        for (const type of item.types) {
          const blob = await item.getType(type);

          if (type.startsWith('text/')) {
            itemData.content[type] = await blob.text();
          } else {
            itemData.content[type] = blob;
          }
        }

        results.push(itemData);
      }

      return { success: true, data: results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Check permission
  async checkPermission(type = 'read') {
    try {
      const permissionName = type === 'read' ? 'clipboard-read' : 'clipboard-write';
      const result = await navigator.permissions.query({ name: permissionName });
      return result.state;
    } catch {
      return 'unknown';
    }
  }

  // Request permission (triggered by attempting an operation)
  async requestReadPermission() {
    try {
      await navigator.clipboard.readText();
      return true;
    } catch {
      return false;
    }
  }
}

// Usage example
const clipboard = new ClipboardManager();

// Copy text
const result = await clipboard.copyText('Hello, World!');
if (result.success) {
  console.log('Copy successful');
}

// Copy rich content
await clipboard.copyRichContent({
  'text/plain': 'Plain text content',
  'text/html': '<strong>HTML content</strong>'
});

// Read clipboard
const content = await clipboard.readAll();
console.log(content);
```

## Best Practices

### Always Check API Availability

```javascript
function isClipboardSupported() {
  return (
    typeof navigator !== 'undefined' &&
    'clipboard' in navigator &&
    window.isSecureContext
  );
}

async function safeCopy(text) {
  if (!isClipboardSupported()) {
    // Fall back to traditional method
    return fallbackCopy(text);
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Copy failed:', error);
    return fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
    return true;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
```

### Provide User Feedback

```javascript
async function copyWithFeedback(text, button) {
  const originalText = button.textContent;

  try {
    await navigator.clipboard.writeText(text);

    // Success feedback
    button.textContent = 'Copied!';
    button.classList.add('success');

    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('success');
    }, 2000);

  } catch (error) {
    // Failure feedback
    button.textContent = 'Copy failed';
    button.classList.add('error');

    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('error');
    }, 2000);
  }
}
```

### Execute Read Operations Within User Gestures

```javascript
// Correct: Read within click event
button.addEventListener('click', async () => {
  const text = await navigator.clipboard.readText();
  // Process text
});

// Incorrect: Reading without user gesture may fail
// setTimeout(async () => {
//   const text = await navigator.clipboard.readText(); // May be rejected
// }, 1000);
```

### Provide Multiple Data Formats

```javascript
// Provide multiple formats when copying for better compatibility
async function copyWithFallbackFormats(richContent, plainText) {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([richContent], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' })
      })
    ]);
  } catch {
    // If writing rich content fails, fall back to plain text
    await navigator.clipboard.writeText(plainText);
  }
}
```

### Clean Up Resources

```javascript
// Remember to clean up after using createObjectURL
async function displayPastedImage() {
  const items = await navigator.clipboard.read();

  for (const item of items) {
    if (item.types.includes('image/png')) {
      const blob = await item.getType('image/png');
      const url = URL.createObjectURL(blob);

      const img = document.createElement('img');
      img.src = url;

      // Release URL after image loads
      img.onload = () => {
        URL.revokeObjectURL(url);
      };

      // Also release on error
      img.onerror = () => {
        URL.revokeObjectURL(url);
      };

      return img;
    }
  }

  return null;
}
```

## Common Pitfalls

### Ignoring Secure Context Requirement

```javascript
// Incorrect: Not checking secure context
async function unsafeCopy(text) {
  await navigator.clipboard.writeText(text); // May fail
}

// Correct: Check secure context
async function safeCopy(text) {
  if (!window.isSecureContext) {
    console.error('Clipboard API requires HTTPS environment');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Copy failed:', error);
    return false;
  }
}
```

### Not Handling Permission Denial

```javascript
// Incorrect: Assuming permission is always granted
async function badPaste() {
  const text = await navigator.clipboard.readText();
  return text;
}

// Correct: Handle permission denial
async function goodPaste() {
  try {
    const text = await navigator.clipboard.readText();
    return { success: true, data: text };
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      return { success: false, error: 'Permission denied, please allow clipboard access' };
    }
    return { success: false, error: error.message };
  }
}
```

### Attempting to Read Without User Gesture

```javascript
// Incorrect: Reading clipboard on page load
window.addEventListener('load', async () => {
  // This will likely fail because there's no user gesture
  const text = await navigator.clipboard.readText();
});

// Correct: Read during user interaction
document.getElementById('pasteBtn').addEventListener('click', async () => {
  const text = await navigator.clipboard.readText();
});
```

### Forgetting ClipboardItem Requires Blob

```javascript
// Incorrect: Passing string directly
// const item = new ClipboardItem({
//   'text/plain': 'Hello' // Wrong!
// });

// Correct: Use Blob
const item = new ClipboardItem({
  'text/plain': new Blob(['Hello'], { type: 'text/plain' })
});
```

### Not Handling Async Operations

```javascript
// Incorrect: Not awaiting Promise
function copyTextBad(text) {
  navigator.clipboard.writeText(text); // Returns Promise but not handled
  console.log('Copied'); // May execute before copy completes
}

// Correct: Wait for Promise to complete
async function copyTextGood(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Copied');
  } catch (error) {
    console.error('Copy failed');
  }
}
```

### Cross-Origin Image Copy Issues

```javascript
// Problem: Cross-origin images may be blocked by CORS
async function copyImageFromUrl(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob })
    ]);
  } catch (error) {
    if (error.message.includes('CORS')) {
      console.error('Cross-origin images cannot be copied, server must support CORS');
    }
    throw error;
  }
}
```

## Performance Considerations

### Advantages of Async Operations

The async design of Clipboard API avoids blocking the main thread:

```javascript
// Won't block UI
async function copyLargeContent(content) {
  const start = performance.now();

  await navigator.clipboard.writeText(content);

  const end = performance.now();
  console.log(`Copy operation took: ${end - start}ms`);
}
```

### Handling Large Files

For large content, consider chunked processing or providing progress feedback:

```javascript
async function copyLargeFile(file) {
  // Show loading status
  showLoading('Preparing to copy...');

  try {
    const blob = file instanceof Blob ? file : await file.arrayBuffer();

    await navigator.clipboard.write([
      new ClipboardItem({
        [file.type]: new Blob([blob], { type: file.type })
      })
    ]);

    hideLoading();
    showSuccess('Copy successful');
  } catch (error) {
    hideLoading();
    showError('Copy failed: ' + error.message);
  }
}
```

### Avoiding Frequent Operations

```javascript
// Use debounce to avoid frequent copying
function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const debouncedCopy = debounce(async (text) => {
  await navigator.clipboard.writeText(text);
  console.log('Copy complete');
}, 300);

// For real-time copy scenarios (like code editor "copy to clipboard" feature)
inputElement.addEventListener('input', (e) => {
  debouncedCopy(e.target.value);
});
```

### Memory Management

```javascript
// Release Blob URLs promptly
class ClipboardImageHandler {
  constructor() {
    this.currentUrl = null;
  }

  async displayFromClipboard(container) {
    // Release previous URL
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }

    const items = await navigator.clipboard.read();

    for (const item of items) {
      const imageType = item.types.find(t => t.startsWith('image/'));
      if (imageType) {
        const blob = await item.getType(imageType);
        this.currentUrl = URL.createObjectURL(blob);

        const img = document.createElement('img');
        img.src = this.currentUrl;
        container.textContent = '';
        container.appendChild(img);

        return true;
      }
    }

    return false;
  }

  cleanup() {
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = null;
    }
  }
}
```

## Practical Scenarios

### One-Click Code Block Copy

```javascript
class CodeBlockCopier {
  constructor() {
    this.init();
  }

  init() {
    document.querySelectorAll('pre code').forEach(codeBlock => {
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.setAttribute('aria-label', 'Copy code');

      codeBlock.parentNode.insertBefore(wrapper, codeBlock);
      wrapper.appendChild(codeBlock);
      wrapper.appendChild(copyBtn);

      copyBtn.addEventListener('click', () => this.copyCode(codeBlock, copyBtn));
    });
  }

  async copyCode(codeBlock, button) {
    const code = codeBlock.textContent;

    try {
      await navigator.clipboard.writeText(code);

      button.textContent = 'Copied!';
      button.classList.add('copied');

      setTimeout(() => {
        button.textContent = 'Copy';
        button.classList.remove('copied');
      }, 2000);

    } catch (error) {
      button.textContent = 'Copy failed';

      setTimeout(() => {
        button.textContent = 'Copy';
      }, 2000);
    }
  }
}

// Initialize
new CodeBlockCopier();
```

### Image Editor Paste Functionality

```javascript
class ImagePasteHandler {
  constructor(container) {
    this.container = container;
    this.setupPasteListener();
    this.setupPasteButton();
  }

  setupPasteListener() {
    // Listen for global paste event
    document.addEventListener('paste', async (e) => {
      if (!this.container.contains(document.activeElement)) {
        return;
      }

      e.preventDefault();

      // Prioritize getting from clipboard event
      const items = e.clipboardData.items;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          await this.handleImageFile(file);
          return;
        }
      }

      // Fall back to Clipboard API
      await this.pasteFromClipboardAPI();
    });
  }

  setupPasteButton() {
    const pasteBtn = document.createElement('button');
    pasteBtn.textContent = 'Paste Image';
    pasteBtn.addEventListener('click', () => this.pasteFromClipboardAPI());
    this.container.appendChild(pasteBtn);
  }

  async pasteFromClipboardAPI() {
    try {
      const items = await navigator.clipboard.read();

      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith('image/'));

        if (imageType) {
          const blob = await item.getType(imageType);
          await this.handleImageFile(blob);
          return;
        }
      }

      this.showMessage('No image in clipboard');
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        this.showMessage('Please allow clipboard access');
      } else {
        this.showMessage('Paste failed: ' + error.message);
      }
    }
  }

  async handleImageFile(file) {
    const url = URL.createObjectURL(file);

    const img = document.createElement('img');
    img.src = url;
    img.className = 'pasted-image';

    img.onload = () => {
      this.container.appendChild(img);
      this.showMessage(`Pasted ${file.type} image (${img.naturalWidth}x${img.naturalHeight})`);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      this.showMessage('Failed to load image');
    };
  }

  showMessage(text) {
    console.log(text);
    // Can implement more user-friendly UI notifications
  }
}
```

### Share Link Feature

```javascript
class ShareManager {
  constructor() {
    this.setupShareButtons();
  }

  setupShareButtons() {
    document.querySelectorAll('[data-share]').forEach(button => {
      button.addEventListener('click', () => {
        const shareType = button.dataset.share;
        this.handleShare(shareType, button);
      });
    });
  }

  async handleShare(type, button) {
    const url = window.location.href;
    const title = document.title;

    switch (type) {
      case 'copy':
        await this.copyLink(url, button);
        break;
      case 'copy-with-title':
        await this.copyLinkWithTitle(url, title, button);
        break;
      case 'native':
        await this.nativeShare(url, title);
        break;
    }
  }

  async copyLink(url, button) {
    try {
      await navigator.clipboard.writeText(url);
      this.showFeedback(button, 'Link copied!', 'success');
    } catch {
      this.showFeedback(button, 'Copy failed', 'error');
    }
  }

  async copyLinkWithTitle(url, title, button) {
    try {
      // Provide multiple formats
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([`${title}\n${url}`], { type: 'text/plain' }),
          'text/html': new Blob([`<a href="${url}">${title}</a>`], { type: 'text/html' })
        })
      ]);
      this.showFeedback(button, 'Link copied!', 'success');
    } catch {
      // Fall back to plain text
      await this.copyLink(url, button);
    }
  }

  async nativeShare(url, title) {
    if (navigator.share) {
      try {
        await navigator.share({ url, title });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      // Fall back to copying link
      await navigator.clipboard.writeText(url);
    }
  }

  showFeedback(button, message, type) {
    const originalText = button.textContent;
    button.textContent = message;
    button.classList.add(type);

    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove(type);
    }, 2000);
  }
}

// HTML usage
// <button data-share="copy">Copy Link</button>
// <button data-share="copy-with-title">Copy Title and Link</button>
// <button data-share="native">Share</button>
```

### Table Data Copy

```javascript
class TableCopier {
  constructor(table) {
    this.table = table;
    this.init();
  }

  init() {
    const toolbar = document.createElement('div');
    toolbar.className = 'table-toolbar';

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy Table';
    copyBtn.addEventListener('click', () => this.copyTable());

    const copySelectedBtn = document.createElement('button');
    copySelectedBtn.textContent = 'Copy Selected';
    copySelectedBtn.addEventListener('click', () => this.copySelected());

    toolbar.appendChild(copyBtn);
    toolbar.appendChild(copySelectedBtn);
    this.table.parentNode.insertBefore(toolbar, this.table);
  }

  async copyTable() {
    const { text, html } = this.getTableData();
    await this.copyWithFormats(text, html);
  }

  async copySelected() {
    const selection = window.getSelection();

    if (selection.rangeCount === 0) {
      alert('Please select content to copy first');
      return;
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString();

    // Create temporary container to get selected content
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());

    await this.copyWithFormats(text, container.textContent);
  }

  getTableData() {
    const rows = this.table.querySelectorAll('tr');
    const textRows = [];
    const htmlRows = [];

    rows.forEach(row => {
      const cells = row.querySelectorAll('th, td');
      const textCells = [];
      const htmlCells = [];

      cells.forEach(cell => {
        textCells.push(cell.textContent.trim());
        const tag = cell.tagName.toLowerCase();
        htmlCells.push(`<${tag}>${cell.textContent}</${tag}>`);
      });

      textRows.push(textCells.join('\t'));
      htmlRows.push(`<tr>${htmlCells.join('')}</tr>`);
    });

    return {
      text: textRows.join('\n'),
      html: `<table>${htmlRows.join('')}</table>`
    };
  }

  async copyWithFormats(text, html) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' })
        })
      ]);
      console.log('Table copied (can be pasted into Excel)');
    } catch {
      await navigator.clipboard.writeText(text);
      console.log('Table copied (plain text)');
    }
  }
}
```

## Interview Key Points

### Difference Between Clipboard API and document.execCommand

**Question**: Explain the differences between Clipboard API and the traditional `document.execCommand()`.

**Answer**:

| Aspect | Clipboard API | document.execCommand |
|--------|--------------|---------------------|
| Execution mode | Async (Promise) | Sync |
| Data types | Multiple types (text, images, HTML) | Primarily text |
| Security | Requires HTTPS, has permission control | No strict security restrictions |
| API status | Modern standard | Deprecated |
| Error handling | Through Promise catch | Returns boolean |

### Why Reading Clipboard Requires User Gesture

**Question**: Why do `readText()` and `read()` typically require a user gesture?

**Answer**: This is for security reasons. The clipboard may contain sensitive information (such as passwords, credit card numbers). If arbitrary scripts were allowed to read the clipboard in the background, it would pose serious privacy risks. Requiring user gestures ensures:

1. Users explicitly know that a clipboard operation is occurring
2. Malicious websites cannot read the clipboard without user knowledge
3. Users have control over data access

### How to Handle Clipboard API Compatibility

**Question**: How do you implement copy functionality in browsers that don't support Clipboard API?

**Answer**:

```javascript
async function copyText(text) {
  // Prefer Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back on failure
    }
  }

  // Fallback: use temporary textarea
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const success = document.execCommand('copy');
    return success;
  } finally {
    document.body.removeChild(textarea);
  }
}
```

### Purpose of ClipboardItem

**Question**: Explain the purpose and usage of ClipboardItem.

**Answer**: ClipboardItem is an interface for representing clipboard data items. It allows:

1. Storing the same content in multiple formats
2. Supporting async data sources (via Promise)
3. Handling binary data (Blob)

```javascript
// Provide multiple formats simultaneously
const item = new ClipboardItem({
  'text/plain': new Blob(['Plain text'], { type: 'text/plain' }),
  'text/html': new Blob(['<b>HTML</b>'], { type: 'text/html' })
});

await navigator.clipboard.write([item]);
```

### Permission Model

**Question**: What is the Clipboard API permission model?

**Answer**:

- **clipboard-write**: Write permission, typically automatically granted, doesn't require explicit user authorization
- **clipboard-read**: Read permission, requires user authorization, and typically needs a user gesture

Permission status can be queried via the Permissions API:

```javascript
const result = await navigator.permissions.query({
  name: 'clipboard-read'
});
// result.state: 'granted' | 'denied' | 'prompt'
```

### Secure Context Requirement

**Question**: What is a secure context, and why does the Clipboard API require it?

**Answer**: A secure context is an environment defined by browsers that meets the following conditions:

- HTTPS protocol transmission
- localhost or 127.0.0.1
- file:// protocol (in some browsers)

The Clipboard API requires a secure context because:

1. It prevents man-in-the-middle attacks from intercepting clipboard data
2. It ensures users interact with trusted sources
3. It protects sensitive information from being stolen by malicious scripts

## Further Reading

### Official Documentation

- [MDN - Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)
- [MDN - Clipboard](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard)
- [MDN - ClipboardItem](https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem)
- [W3C Clipboard API Specification](https://www.w3.org/TR/clipboard-apis/)

### Browser Compatibility

- [Can I Use - Async Clipboard API](https://caniuse.com/async-clipboard)
- [Can I Use - Clipboard API (images)](https://caniuse.com/mdn-api_clipboarditem)

### Related Technologies

- [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) - Permission management
- [Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) - Drag and drop functionality
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API) - Native sharing functionality
- [File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API) - File handling

### Quality Tutorials

- [web.dev - Interact with the system clipboard](https://web.dev/articles/async-clipboard)
- [JavaScript.info - Clipboard](https://javascript.info/clipboard)

### Related Libraries

- [clipboard.js](https://clipboardjs.com/) - Lightweight clipboard library
- [copy-to-clipboard](https://www.npmjs.com/package/copy-to-clipboard) - npm package
