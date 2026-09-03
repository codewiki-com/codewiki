---
title: JavaScript 拖放 API 完全指南
description: 深入掌握 HTML5 Drag and Drop API：从基础概念到实战应用，包括事件流、DataTransfer、文件上传、看板管理等完整实现
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - Drag and Drop
  - HTML5
  - Web API
  - 交互
  - 拖放
  - 用户交互
status: imported
origin: old/src/content/docs/javascript/drag-drop.zh.md
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

拖放（Drag and Drop）是现代 Web 应用中常见的交互方式，用于实现文件上传、列表排序、看板管理等功能。HTML5 提供了原生拖放 API，使开发者能够优雅地实现这些交互。本文将系统介绍拖放 API 的概念、原理、最佳实践，以及实战应用场景。

## 概念解释

### 什么是拖放 API

HTML5 拖放 API（Drag and Drop API）是一组用于实现拖放交互的浏览器原生接口。它允许用户通过鼠标（或触摸）将元素从一个位置拖动到另一个位置，并在拖放过程中传输数据。

#### 核心概念

- **拖动源（Drag Source）**：被拖动的元素，具有 `draggable="true"` 属性
- **放置目标（Drop Target）**：可以接收拖动元素的区域，需要处理拖放事件
- **DataTransfer 对象**：在拖放过程中传输数据和控制视觉效果的机制

#### 为什么需要拖放 API

在 HTML5 之前，开发者只能通过监听鼠标事件（mousedown、mousemove、mouseup）来模拟拖放效果，这种方法：
- 代码复杂，容易出错
- 缺乏标准化的数据传输机制
- 无法直接处理文件拖放
- 跨浏览器兼容性差

HTML5 拖放 API 提供了：
- 标准化的事件模型（dragstart、drag、dragenter、dragover、drop 等）
- 安全的数据传输机制（DataTransfer）
- 视觉反馈控制（dropEffect、effectAllowed）
- 与操作系统的集成（支持拖放文件）
- 浏览器优化的性能

### 解决的问题

1. **跨元素数据传输**：在拖放过程中安全地携带任意类型的数据
2. **文件上传**：用户可以直接从桌面拖放文件到网页
3. **跨窗口/标签页拖放**：支持在不同浏览器窗口间传输数据
4. **可访问性**：配合 ARIA 属性和键盘事件，支持屏幕阅读器
5. **视觉反馈**：通过 dropEffect 提供标准化的鼠标指针反馈

## 核心原理

### 拖放事件流

拖放操作会触发一系列事件，理解事件顺序对于正确实现拖放功能至关重要。

#### 完整事件流程

```
用户开始拖动（鼠标按下并移动）
        ↓
dragstart - 拖动源上触发（一次）
        ↓
drag - 拖动源上持续触发（约50ms一次）
        ↓
dragenter - 进入放置目标时触发
        ↓
dragover - 在放置目标上方持续触发（约50ms一次）
        ↓
       / \
      /   \
dragleave    drop - 在目标上释放时触发
 (离开目标)
      ↓          ↓
      └────┬─────┘
           ↓
dragend - 拖动源上触发（无论是否成功放置）
```

#### 事件详解

| 事件 | 触发对象 | 触发时机 | 特点 |
|------|--------|--------|------|
| dragstart | 拖动源 | 开始拖动时 | 仅触发一次，可设置传输数据 |
| drag | 拖动源 | 拖动过程中 | 持续触发，可监听拖动位置 |
| dragenter | 放置目标 | 进入目标时 | 触发一次 |
| dragover | 放置目标 | 在目标上方 | 持续触发，必须 preventDefault() |
| dragleave | 放置目标 | 离开目标时 | 嵌套元素会重复触发 |
| drop | 放置目标 | 释放鼠标时 | 在目标上释放，可读取传输数据 |
| dragend | 拖动源 | 拖动结束时 | 总是触发，可检查放置结果 |

### DataTransfer 机制

DataTransfer 对象是拖放 API 的核心。它充当拖动源和放置目标之间的"中介"。

#### DataTransfer 的生命周期

```javascript
element.addEventListener('dragstart', (event) => {
  const dt = event.dataTransfer;

  // 1. 设置传输数据（只能在dragstart中设置）
  dt.setData('text/plain', '数据');

  // 2. 设置允许的操作
  dt.effectAllowed = 'move';

  // 3. 自定义拖动图像
  dt.setDragImage(customImage, 0, 0);
});

dropZone.addEventListener('dragover', (event) => {
  const dt = event.dataTransfer;

  // 只能读取types，不能读取data（安全限制）
  console.log(dt.types); // ['text/plain', ...]
  console.log(dt.getData('text/plain')); // 返回空字符串
});

dropZone.addEventListener('drop', (event) => {
  const dt = event.dataTransfer;

  // 在drop中才能读取传输的数据
  const data = dt.getData('text/plain');
  console.log('接收到:', data);
});
```

#### effectAllowed 与 dropEffect

- **effectAllowed**：在 dragstart 中设置，定义拖动源允许的操作类型
- **dropEffect**：在 dragover/drop 中设置，定义实际的放置效果和鼠标指针样式

```javascript
// dragstart中设置源允许的操作
source.addEventListener('dragstart', (e) => {
  e.dataTransfer.effectAllowed = 'copyMove'; // 允许复制或移动
});

// dragover中根据情况设置具体效果
target.addEventListener('dragover', (e) => {
  e.preventDefault();

  if (e.ctrlKey) {
    e.dataTransfer.dropEffect = 'copy';  // Ctrl键+拖放 = 复制
  } else {
    e.dataTransfer.dropEffect = 'move';  // 默认 = 移动
  }
});
```

### 默认行为与阻止

浏览器对拖放有默认行为，需要理解何时需要阻止：

```javascript
// dragover的默认行为是不允许放置
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault(); // 阻止默认行为，使元素成为有效的放置目标
  // 没有这一行，drop事件不会触发
});

// drop的默认行为是打开文件链接或导航
dropZone.addEventListener('drop', (event) => {
  event.preventDefault(); // 阻止默认行为，防止打开文件
  // 处理放置逻辑
});

// 页面级别的拖放处理
document.addEventListener('dragover', (event) => {
  event.preventDefault(); // 防止打开文件
});

document.addEventListener('drop', (event) => {
  event.preventDefault(); // 防止打开文件
});
```

## 核心要点

### draggable 属性

使元素可拖动需要设置 `draggable` 属性：

```html
<!-- 使元素可拖动 -->
<div draggable="true" id="draggable-item">可拖动</div>

<!-- 禁止拖动（覆盖默认行为） -->
<img src="image.png" draggable="false" />

<!-- 链接和图片默认可拖动 -->
<a href="#">默认可拖动</a>
```

通过 JavaScript 动态设置：

```javascript
const element = document.getElementById('item');

// 使元素可拖动
element.draggable = true;

// 动态控制可拖动性
element.addEventListener('mousedown', () => {
  element.draggable = true;
});

element.addEventListener('mouseup', () => {
  element.draggable = false;
});
```

### 拖动源事件处理

```javascript
const draggable = document.getElementById('draggable');

// dragstart - 拖动开始
draggable.addEventListener('dragstart', (event) => {
  // 存储拖动元素的引用
  currentDraggedElement = event.target;

  // 设置传输数据（必须在dragstart中设置）
  event.dataTransfer.setData('text/plain', event.target.id);
  event.dataTransfer.setData('application/json', JSON.stringify({
    id: event.target.id,
    content: event.target.textContent
  }));

  // 设置允许的操作
  event.dataTransfer.effectAllowed = 'move';

  // 自定义拖动时的视觉样式
  event.target.classList.add('dragging');
});

// drag - 拖动过程中（持续触发）
draggable.addEventListener('drag', (event) => {
  // 注意：在某些浏览器中，拖出窗口时坐标可能为0
  console.log('拖动位置: ' + event.clientX + ', ' + event.clientY);
});

// dragend - 拖动结束
draggable.addEventListener('dragend', (event) => {
  // 清除样式
  event.target.classList.remove('dragging');

  // 检查放置是否成功
  if (event.dataTransfer.dropEffect === 'none') {
    console.log('放置被取消或不被接受');
    // 恢复原始位置或状态
  } else {
    console.log('放置成功: ' + event.dataTransfer.dropEffect);
    // 更新数据模型
  }
});
```

### 放置目标事件处理

```javascript
const dropZone = document.getElementById('drop-zone');
let dragCounter = 0; // 处理嵌套元素

// dragenter - 拖动元素进入目标
dropZone.addEventListener('dragenter', (event) => {
  event.preventDefault();
  dragCounter++;

  // 检查拖动的数据类型
  if (event.dataTransfer.types.includes('Files')) {
    dropZone.classList.add('drag-over');
  }
});

// dragover - 在目标上方（持续触发）
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault(); // 必须，否则不会触发drop

  // 设置放置效果
  event.dataTransfer.dropEffect = 'copy';

  // 可以检查数据类型
  const hasFiles = event.dataTransfer.types.includes('Files');
  const hasText = event.dataTransfer.types.includes('text/plain');

  if (!hasFiles && !hasText) {
    event.dataTransfer.dropEffect = 'none';
  }
});

// dragleave - 离开目标
dropZone.addEventListener('dragleave', (event) => {
  dragCounter--;

  // 只在完全离开时移除样式（处理嵌套元素）
  if (dragCounter === 0) {
    dropZone.classList.remove('drag-over');
  }
});

// drop - 释放鼠标
dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  event.stopPropagation();

  dragCounter = 0;
  dropZone.classList.remove('drag-over');

  // 读取传输的数据
  const text = event.dataTransfer.getData('text/plain');
  const json = event.dataTransfer.getData('application/json');
  const files = event.dataTransfer.files;

  if (files.length > 0) {
    console.log('接收到文件: ', files);
    handleFiles(files);
  } else if (json) {
    console.log('接收到数据: ', JSON.parse(json));
  }
});
```

### DataTransfer 对象详解

```javascript
element.addEventListener('dragstart', (event) => {
  const dt = event.dataTransfer;

  // ===== 设置数据 =====
  // 可以设置多种格式，拖放时会保存所有格式
  dt.setData('text/plain', '纯文本');
  dt.setData('text/html', '<b>HTML</b>');
  dt.setData('text/uri-list', 'https://example.com');
  dt.setData('application/json', JSON.stringify({ id: 1 }));

  // 自定义 MIME 类型
  dt.setData('application/x-custom', '自定义数据');

  // ===== effectAllowed 值 =====
  dt.effectAllowed = 'move';        // 只允许移动
  dt.effectAllowed = 'copy';        // 只允许复制
  dt.effectAllowed = 'link';        // 只允许链接
  dt.effectAllowed = 'copyMove';    // 允许复制或移动
  dt.effectAllowed = 'copyLink';    // 允许复制或链接
  dt.effectAllowed = 'linkMove';    // 允许链接或移动
  dt.effectAllowed = 'all';         // 允许所有操作
  dt.effectAllowed = 'none';        // 禁止所有操作

  // ===== 设置自定义拖动图像 =====
  const dragImage = document.createElement('img');
  dragImage.src = 'drag-icon.png';
  dt.setDragImage(dragImage, 10, 10); // x, y 是相对于图像的偏移

  // 使用 Canvas 创建拖动图像
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.fillText('拖动中...', 0, 20);
  dt.setDragImage(canvas, 0, 0);
});

element.addEventListener('drop', (event) => {
  const dt = event.dataTransfer;

  // ===== 读取数据 =====
  const text = dt.getData('text/plain');
  const json = JSON.parse(dt.getData('application/json') || 'null');

  // ===== 检查可用的数据类型 =====
  console.log('包含的数据类型: ', dt.types);
  // 输出: ['text/plain', 'text/html', 'text/uri-list', ...]

  // ===== 访问文件 =====
  const files = dt.files; // FileList 对象
  for (let file of files) {
    console.log('文件: ' + file.name + ', 大小: ' + file.size);
  }

  // ===== 使用 items 接口（推荐） =====
  for (const item of dt.items) {
    console.log('类型: ' + item.type + ', 种类: ' + item.kind);

    if (item.kind === 'file') {
      const file = item.getAsFile();
      console.log('文件名: ', file.name);
    } else if (item.kind === 'string') {
      item.getAsString((str) => {
        console.log('字符串数据: ', str);
      });
    }
  }

  // ===== dropEffect 值 =====
  console.log('放置效果: ', dt.dropEffect);
  // 值: 'none' | 'copy' | 'move' | 'link'
});
```

## 代码示例

### 示例 1：基础拖放交互

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>基础拖放示例</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 20px;
    }

    .container {
      display: flex;
      gap: 30px;
    }

    .box {
      width: 250px;
      min-height: 300px;
      border: 2px solid #ccc;
      border-radius: 8px;
      padding: 15px;
      background: #f9f9f9;
    }

    .box h3 {
      margin-top: 0;
      color: #333;
    }

    .item {
      padding: 12px;
      margin-bottom: 8px;
      background: #3498db;
      color: white;
      border-radius: 4px;
      cursor: grab;
      user-select: none;
    }

    .item:active {
      cursor: grabbing;
    }

    .item.dragging {
      opacity: 0.5;
      transform: scale(0.95);
    }

    .box.drag-over {
      border-color: #2ecc71;
      background: rgba(46, 204, 113, 0.1);
      box-shadow: 0 0 10px rgba(46, 204, 113, 0.3);
    }
  </style>
</head>
<body>
  <h1>项目列表拖放排序</h1>

  <div class="container">
    <div class="box" id="box1">
      <h3>待处理</h3>
      <div class="item" draggable="true" data-id="1">编写文档</div>
      <div class="item" draggable="true" data-id="2">代码审查</div>
      <div class="item" draggable="true" data-id="3">测试功能</div>
    </div>

    <div class="box" id="box2">
      <h3>进行中</h3>
      <div class="item" draggable="true" data-id="4">修复 Bug</div>
    </div>

    <div class="box" id="box3">
      <h3>已完成</h3>
    </div>
  </div>

  <script>
    const items = document.querySelectorAll('.item');
    const boxes = document.querySelectorAll('.box');
    let draggedItem = null;

    items.forEach(item => {
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragend', handleDragEnd);
    });

    boxes.forEach(box => {
      box.addEventListener('dragenter', handleDragEnter);
      box.addEventListener('dragover', handleDragOver);
      box.addEventListener('dragleave', handleDragLeave);
      box.addEventListener('drop', handleDrop);
    });

    function handleDragStart(event) {
      draggedItem = event.target;
      event.target.classList.add('dragging');

      event.dataTransfer.setData('text/plain', event.target.dataset.id);
      event.dataTransfer.effectAllowed = 'move';
    }

    function handleDragEnd(event) {
      event.target.classList.remove('dragging');
      boxes.forEach(box => box.classList.remove('drag-over'));
      draggedItem = null;
    }

    function handleDragEnter(event) {
      event.preventDefault();
      event.currentTarget.classList.add('drag-over');
    }

    function handleDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }

    function handleDragLeave(event) {
      if (event.currentTarget === event.target) {
        event.currentTarget.classList.remove('drag-over');
      }
    }

    function handleDrop(event) {
      event.preventDefault();
      event.currentTarget.classList.remove('drag-over');

      if (draggedItem && event.currentTarget.classList.contains('box')) {
        event.currentTarget.appendChild(draggedItem);
      }
    }
  </script>
</body>
</html>
```

### 示例 2：文件拖放上传

```javascript
class FileDropZone {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      accept: options.accept || '*/*',
      maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB
      multiple: options.multiple !== false,
      onDrop: options.onDrop || (() => {}),
      onError: options.onError || ((msg) => alert(msg)),
      ...options
    };

    this.dragCounter = 0;
    this.init();
  }

  init() {
    // 阻止页面默认的拖放行为
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.body.addEventListener(eventName, this.preventDefaults.bind(this));
    });

    // 添加拖放事件监听
    this.element.addEventListener('dragenter', this.handleDragEnter.bind(this));
    this.element.addEventListener('dragover', this.handleDragOver.bind(this));
    this.element.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.element.addEventListener('drop', this.handleDrop.bind(this));
  }

  preventDefaults(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  handleDragEnter(event) {
    event.preventDefault();
    this.dragCounter++;

    if (this.containsFiles(event)) {
      this.element.classList.add('drag-over');
    }
  }

  handleDragOver(event) {
    event.preventDefault();

    if (this.containsFiles(event)) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  handleDragLeave(event) {
    this.dragCounter--;

    if (this.dragCounter === 0) {
      this.element.classList.remove('drag-over');
    }
  }

  handleDrop(event) {
    event.preventDefault();
    this.dragCounter = 0;
    this.element.classList.remove('drag-over');

    const files = this.getFiles(event);
    if (files.length === 0) return;

    // 验证和处理文件
    const validFiles = [];
    const errors = [];

    for (const file of files) {
      const error = this.validateFile(file);
      if (error) {
        errors.push({ file, error });
      } else {
        validFiles.push(file);
      }
    }

    // 报告错误
    errors.forEach(({ file, error }) => {
      this.options.onError(file.name + ': ' + error);
    });

    // 处理有效文件
    if (validFiles.length > 0) {
      this.options.onDrop(this.options.multiple ? validFiles : validFiles[0]);
    }
  }

  containsFiles(event) {
    return event.dataTransfer.types.includes('Files');
  }

  getFiles(event) {
    const dt = event.dataTransfer;

    // 优先使用 items 接口（更强大）
    if (dt.items) {
      const files = [];
      for (const item of dt.items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      return files;
    }

    // 回退到 files 接口
    return Array.from(dt.files);
  }

  validateFile(file) {
    // 检查文件大小
    if (file.size > this.options.maxSize) {
      const maxSizeMB = (this.options.maxSize / 1024 / 1024).toFixed(2);
      return '文件大小超过限制 (最大 ' + maxSizeMB + ' MB)';
    }

    // 检查文件类型
    if (this.options.accept !== '*/*') {
      const acceptTypes = this.options.accept.split(',').map(t => t.trim());
      const fileType = file.type;
      const fileName = file.name;
      const fileExt = '.' + fileName.split('.').pop().toLowerCase();

      const isAccepted = acceptTypes.some(accept => {
        if (accept.startsWith('.')) {
          // 扩展名匹配
          return fileExt === accept.toLowerCase();
        } else if (accept.endsWith('/*')) {
          // MIME 类型通配符
          return fileType.startsWith(accept.slice(0, -2));
        } else {
          // 精确 MIME 类型匹配
          return fileType === accept;
        }
      });

      if (!isAccepted) {
        return '不支持的文件类型: ' + (fileType || fileExt);
      }
    }

    return null;
  }

  destroy() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.body.removeEventListener(eventName, this.preventDefaults.bind(this));
    });
  }
}

// 使用示例
const dropZone = document.getElementById('file-drop-zone');
const fileDrop = new FileDropZone(dropZone, {
  accept: 'image/*,.pdf',
  maxSize: 5 * 1024 * 1024, // 5MB
  multiple: true,
  onDrop(files) {
    console.log('收到文件: ', files);
    files.forEach(file => {
      uploadFile(file);
    });
  },
  onError(message) {
    console.error(message);
  }
});

async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('上传失败');

    const result = await response.json();
    console.log('上传成功: ', result);
  } catch (error) {
    console.error('上传错误: ', error);
  }
}
```

### 示例 3：可排序列表

```javascript
class SortableList {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      itemSelector: options.itemSelector || 'li',
      handleSelector: options.handleSelector || null,
      onSort: options.onSort || (() => {}),
      ...options
    };

    this.draggedItem = null;
    this.placeholder = this.createPlaceholder();
    this.init();
  }

  createPlaceholder() {
    const placeholder = document.createElement('li');
    placeholder.className = 'sortable-placeholder';
    placeholder.style.cssText = 'border: 2px dashed #aaa; background: #f5f5f5; list-style: none; min-height: 40px;';
    return placeholder;
  }

  init() {
    // 绑定事件（使用事件委托）
    this.container.addEventListener('dragstart', this.handleDragStart.bind(this));
    this.container.addEventListener('dragend', this.handleDragEnd.bind(this));
    this.container.addEventListener('dragover', this.handleDragOver.bind(this));
    this.container.addEventListener('drop', this.handleDrop.bind(this));

    // 初始化所有项目
    this.container.querySelectorAll(this.options.itemSelector).forEach(item => {
      this.makeItemDraggable(item);
    });
  }

  makeItemDraggable(item) {
    item.draggable = true;
    item.style.cursor = 'grab';
  }

  handleDragStart(event) {
    const item = event.target.closest(this.options.itemSelector);
    if (!item) return;

    this.draggedItem = item;
    event.dataTransfer.effectAllowed = 'move';

    // 显示占位符
    requestAnimationFrame(() => {
      item.classList.add('dragging');
      this.placeholder.style.height = item.offsetHeight + 'px';
      item.style.visibility = 'hidden';
      item.parentNode.insertBefore(this.placeholder, item);
    });
  }

  handleDragEnd(event) {
    if (!this.draggedItem) return;

    this.draggedItem.classList.remove('dragging');
    this.draggedItem.style.visibility = 'visible';

    // 替换占位符
    if (this.placeholder.parentNode) {
      this.placeholder.parentNode.insertBefore(this.draggedItem, this.placeholder);
      this.placeholder.remove();
    }

    // 触发排序回调
    this.options.onSort(this.getOrder());
    this.draggedItem = null;
  }

  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    // 找到应该插入的位置
    const afterElement = this.getDragAfterElement(event.clientY);

    if (afterElement) {
      this.container.insertBefore(this.placeholder, afterElement);
    } else {
      this.container.appendChild(this.placeholder);
    }
  }

  handleDrop(event) {
    event.preventDefault();
  }

  getDragAfterElement(y) {
    const draggables = [...this.container.querySelectorAll(
      this.options.itemSelector + ':not(.dragging):not(.sortable-placeholder)'
    )];

    return draggables.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  getOrder() {
    return [...this.container.querySelectorAll(this.options.itemSelector)]
      .filter(item => !item.classList.contains('sortable-placeholder'))
      .map(item => item.dataset.id || item.textContent.trim());
  }

  addItem(item) {
    this.makeItemDraggable(item);
    this.container.appendChild(item);
  }

  removeItem(item) {
    item.remove();
  }
}

// 使用示例
const list = document.getElementById('sortable-list');
const sortable = new SortableList(list, {
  itemSelector: 'li',
  onSort(order) {
    console.log('新顺序: ', order);
    // 保存到服务器
    fetch('/api/sort', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order })
    });
  }
});
```

### 示例 4：看板管理

```javascript
class KanbanBoard {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      columnSelector: '.kanban-column',
      cardSelector: '.kanban-card',
      onCardMove: options.onCardMove || (() => {}),
      ...options
    };

    this.draggedCard = null;
    this.sourceColumn = null;
    this.init();
  }

  init() {
    // 使用事件委托
    this.container.addEventListener('dragstart', this.handleDragStart.bind(this));
    this.container.addEventListener('dragend', this.handleDragEnd.bind(this));
    this.container.addEventListener('dragenter', this.handleDragEnter.bind(this));
    this.container.addEventListener('dragover', this.handleDragOver.bind(this));
    this.container.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.container.addEventListener('drop', this.handleDrop.bind(this));

    // 初始化卡片
    this.container.querySelectorAll(this.options.cardSelector).forEach(card => {
      card.draggable = true;
    });
  }

  handleDragStart(event) {
    const card = event.target.closest(this.options.cardSelector);
    if (!card) return;

    this.draggedCard = card;
    this.sourceColumn = card.closest(this.options.columnSelector);

    event.dataTransfer.setData('text/plain', card.dataset.id);
    event.dataTransfer.effectAllowed = 'move';

    requestAnimationFrame(() => {
      card.classList.add('dragging');
      card.style.opacity = '0.5';
    });
  }

  handleDragEnd(event) {
    if (!this.draggedCard) return;

    this.draggedCard.classList.remove('dragging');
    this.draggedCard.style.opacity = '';

    // 清除所有高亮
    this.container.querySelectorAll(this.options.columnSelector)
      .forEach(col => col.classList.remove('drag-over'));

    this.draggedCard = null;
    this.sourceColumn = null;
  }

  handleDragEnter(event) {
    const column = event.target.closest(this.options.columnSelector);
    if (column) {
      event.preventDefault();
      column.classList.add('drag-over');
    }
  }

  handleDragOver(event) {
    const column = event.target.closest(this.options.columnSelector);
    if (!column || !this.draggedCard) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    // 找到插入位置
    const afterCard = this.getCardAfterElement(column, event.clientY);
    const cardsContainer = column.querySelector('.cards-container') || column;

    if (afterCard) {
      cardsContainer.insertBefore(this.draggedCard, afterCard);
    } else {
      cardsContainer.appendChild(this.draggedCard);
    }
  }

  handleDragLeave(event) {
    const column = event.target.closest(this.options.columnSelector);
    if (column && !column.contains(event.relatedTarget)) {
      column.classList.remove('drag-over');
    }
  }

  handleDrop(event) {
    event.preventDefault();

    const targetColumn = event.target.closest(this.options.columnSelector);
    if (!targetColumn || !this.draggedCard) return;

    targetColumn.classList.remove('drag-over');

    // 触发回调
    if (targetColumn !== this.sourceColumn) {
      this.options.onCardMove({
        cardId: this.draggedCard.dataset.id,
        fromColumn: this.sourceColumn?.dataset.status,
        toColumn: targetColumn.dataset.status,
        position: this.getCardPosition(this.draggedCard)
      });
    }
  }

  getCardAfterElement(column, y) {
    const cards = [...column.querySelectorAll(
      this.options.cardSelector + ':not(.dragging)'
    )];

    return cards.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  getCardPosition(card) {
    const column = card.closest(this.options.columnSelector);
    const cards = [...column.querySelectorAll(this.options.cardSelector)];
    return cards.indexOf(card);
  }

  addCard(columnId, cardData) {
    const column = this.container.querySelector('[data-status="' + columnId + '"]');
    if (!column) return;

    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.id = cardData.id;

    const title = document.createElement('h4');
    title.textContent = cardData.title;

    const description = document.createElement('p');
    description.textContent = cardData.description;

    card.appendChild(title);
    card.appendChild(description);

    const container = column.querySelector('.cards-container') || column;
    container.appendChild(card);
  }
}

// 使用示例
const board = document.getElementById('kanban-board');
const kanban = new KanbanBoard(board, {
  onCardMove({ cardId, fromColumn, toColumn, position }) {
    console.log('卡片 ' + cardId + ' 从 ' + fromColumn + ' 移到 ' + toColumn);

    // 更新服务器
    fetch('/api/cards/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId, toColumn, position })
    });
  }
});
```

## 最佳实践

### 提供清晰的视觉反馈

```javascript
// 拖动源的视觉反馈
draggable.addEventListener('dragstart', () => {
  draggable.classList.add('dragging');
  draggable.style.opacity = '0.5';
});

draggable.addEventListener('dragend', () => {
  draggable.classList.remove('dragging');
  draggable.style.opacity = '';
});

// 放置目标的视觉反馈
let dragCounter = 0;

dropZone.addEventListener('dragenter', () => {
  dragCounter++;
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dragCounter--;
  if (dragCounter === 0) {
    dropZone.classList.remove('drag-over');
  }
});

dropZone.addEventListener('drop', () => {
  dragCounter = 0;
  dropZone.classList.remove('drag-over');
});

// CSS 样式
const styles = `
  .dragging {
    opacity: 0.5;
    transform: scale(0.95);
  }

  .drag-over {
    border-color: #2ecc71;
    background: rgba(46, 204, 113, 0.1);
    box-shadow: 0 0 10px rgba(46, 204, 113, 0.3);
  }
`;
```

### 验证放置目标

```javascript
class SmartDropZone {
  constructor(element, config = {}) {
    this.element = element;
    this.acceptTypes = config.acceptTypes || [];
    this.validate = config.validate || (() => true);
    this.init();
  }

  init() {
    this.element.addEventListener('dragover', (e) => {
      if (this.canAccept(e)) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        this.element.classList.add('can-drop');
      } else {
        e.dataTransfer.dropEffect = 'none';
        this.element.classList.add('cannot-drop');
      }
    });

    this.element.addEventListener('dragleave', () => {
      this.element.classList.remove('can-drop', 'cannot-drop');
    });

    this.element.addEventListener('drop', (e) => {
      e.preventDefault();
      this.element.classList.remove('can-drop', 'cannot-drop');

      if (this.canAccept(e)) {
        this.handleDrop(e);
      }
    });
  }

  canAccept(event) {
    const types = [...event.dataTransfer.types];

    // 检查数据类型
    if (this.acceptTypes.length > 0) {
      const hasValidType = this.acceptTypes.some(t => types.includes(t));
      if (!hasValidType) return false;
    }

    // 运行自定义验证
    return this.validate(event);
  }

  handleDrop(event) {
    // 子类实现
  }
}

// 使用示例
new SmartDropZone(dropElement, {
  acceptTypes: ['text/plain', 'text/html'],
  validate(event) {
    // 只接受特定 ID 的元素
    const id = event.dataTransfer.getData('text/plain');
    return allowedIds.includes(id);
  }
});
```

### 处理嵌套元素的 dragleave 问题

```javascript
// 问题：进入子元素时也会触发dragleave
// 解决方案：使用relatedTarget检查

dropZone.addEventListener('dragleave', (event) => {
  // 只在真正离开区域时移除样式
  if (!dropZone.contains(event.relatedTarget)) {
    dropZone.classList.remove('drag-over');
  }
});

// 或者使用计数器方式（更可靠）
let dragCounter = 0;

dropZone.addEventListener('dragenter', () => {
  dragCounter++;
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dragCounter--;
  if (dragCounter === 0) {
    dropZone.classList.remove('drag-over');
  }
});

dropZone.addEventListener('drop', () => {
  dragCounter = 0;
  dropZone.classList.remove('drag-over');
});
```

### 键盘可访问性

```javascript
class AccessibleDraggable {
  constructor(item) {
    this.item = item;
    this.isSelected = false;

    // 设置无障碍属性
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-grabbed', 'false');

    this.bindEvents();
  }

  bindEvents() {
    this.item.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  handleKeyDown(event) {
    switch (event.key) {
      case ' ':
      case 'Enter':
        event.preventDefault();
        this.toggleSelection();
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.moveUp();
        break;

      case 'ArrowDown':
        event.preventDefault();
        this.moveDown();
        break;

      case 'Escape':
        if (this.isSelected) this.deselect();
        break;
    }
  }

  toggleSelection() {
    if (this.isSelected) {
      this.deselect();
    } else {
      this.select();
    }
  }

  select() {
    this.isSelected = true;
    this.item.setAttribute('aria-grabbed', 'true');
    this.item.classList.add('selected');
    this.announce('已选中，使用方向键移动');
  }

  deselect() {
    this.isSelected = false;
    this.item.setAttribute('aria-grabbed', 'false');
    this.item.classList.remove('selected');
    this.announce('已取消选中');
  }

  moveUp() {
    if (!this.isSelected) return;

    const prev = this.item.previousElementSibling;
    if (prev) {
      this.item.parentNode.insertBefore(this.item, prev);
      this.item.focus();
      this.announce('已向上移动');
    }
  }

  moveDown() {
    if (!this.isSelected) return;

    const next = this.item.nextElementSibling;
    if (next) {
      this.item.parentNode.insertBefore(next, this.item);
      this.item.focus();
      this.announce('已向下移动');
    }
  }

  announce(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => announcement.remove(), 1000);
  }
}
```

## 常见陷阱

### preventDefault() 必须在 dragover 中调用

```javascript
// 错误 - drop 事件永远不会触发
dropZone.addEventListener('dragover', (event) => {
  // 缺少 event.preventDefault()
  console.log('拖动过程');
});

dropZone.addEventListener('drop', (event) => {
  console.log('这永远不会执行');
});

// 正确
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault(); // 告诉浏览器允许放置
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  console.log('放置成功');
});
```

### DataTransfer 的安全限制

```javascript
// dragover 事件中的数据访问限制
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();

  // 只能读取 types，不能读取数据
  console.log(event.dataTransfer.types); // 可以
  console.log(event.dataTransfer.getData('text/plain')); // 返回空字符串

  // 可以读取文件
  const files = event.dataTransfer.files; // 可以读取
});

// 只有 drop 事件中才能完全访问数据
dropZone.addEventListener('drop', (event) => {
  event.preventDefault();

  // 现在可以读取数据了
  const text = event.dataTransfer.getData('text/plain'); // 有数据
  const files = event.dataTransfer.files; // 可以读取
});
```

### dragleave 冒泡问题

```javascript
// 问题：进入子元素时也会触发 dragleave
dropZone.addEventListener('dragleave', (event) => {
  dropZone.classList.remove('drag-over'); // 会在不该移除时移除
});

// 解决方案 1：检查 relatedTarget
dropZone.addEventListener('dragleave', (event) => {
  // relatedTarget 是拖动进入的新元素
  if (!dropZone.contains(event.relatedTarget)) {
    dropZone.classList.remove('drag-over');
  }
});

// 解决方案 2：使用计数器
let dragCounter = 0;

dropZone.addEventListener('dragenter', () => {
  dragCounter++;
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dragCounter--;
  if (dragCounter === 0) {
    dropZone.classList.remove('drag-over');
  }
});
```

### 移动端支持有限

```javascript
// HTML5 拖放 API 在移动设备上支持不佳
// 需要检测平台并使用触摸事件

function initDragDrop(element) {
  const isMobile = 'ontouchstart' in window;

  if (isMobile) {
    initTouchDrag(element);
  } else {
    initNativeDrag(element);
  }
}

function initTouchDrag(element) {
  let startX, startY;
  let clone = null;

  element.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;

    // 创建拖动副本
    clone = element.cloneNode(true);
    clone.style.cssText = 'position: fixed; pointer-events: none; opacity: 0.8; z-index: 1000;';
    document.body.appendChild(clone);
  });

  element.addEventListener('touchmove', (e) => {
    if (!clone) return;

    const touch = e.touches[0];
    clone.style.left = touch.clientX + 'px';
    clone.style.top = touch.clientY + 'px';

    // 检测放置目标
    clone.style.display = 'none';
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    clone.style.display = '';

    if (target?.classList.contains('drop-zone')) {
      target.classList.add('drag-over');
    }
  });

  element.addEventListener('touchend', (e) => {
    if (clone) {
      const touch = e.changedTouches[0];
      clone.remove();
      clone = null;

      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (target?.classList.contains('drop-zone')) {
        handleDrop(target, element);
      }
    }
  });
}

function initNativeDrag(element) {
  // 原生拖放实现
  element.draggable = true;
  // ... 事件监听代码
}
```

## 性能考量

### 节流 dragover 事件

dragover 事件触发频率很高（约 50ms 一次），对于复杂计算需要节流：

```javascript
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

const handleDragOver = throttle((event) => {
  event.preventDefault();
  // 复杂的位置计算或 DOM 操作
  updateDropIndicator(event.clientX, event.clientY);
}, 50);

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault(); // 必须始终阻止默认行为
  handleDragOver(event);
});
```

### 使用 requestAnimationFrame

```javascript
let rafId = null;
let lastEvent = null;

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  lastEvent = event;

  if (!rafId) {
    rafId = requestAnimationFrame(() => {
      if (lastEvent) {
        // 在下一帧执行 DOM 更新
        updateUI(lastEvent);
      }
      rafId = null;
    });
  }
});

function updateUI(event) {
  const indicator = document.getElementById('drop-indicator');
  indicator.style.transform = 'translate(' + event.clientX + 'px, ' + event.clientY + 'px)';
}
```

### 避免重复 DOM 操作

```javascript
// 不好：每次 dragover 都操作 DOM
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();

  const afterElement = getAfterElement(event.clientY);
  // 每次都移动元素，即使位置没变
  container.insertBefore(draggedItem, afterElement);
});

// 好：只在位置变化时操作 DOM
let lastAfterElement = null;

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();

  const afterElement = getAfterElement(event.clientY);

  // 只在位置变化时更新
  if (afterElement !== lastAfterElement) {
    lastAfterElement = afterElement;
    container.insertBefore(draggedItem, afterElement);
  }
});
```

### 大量元素的处理

```javascript
// 对于大量可拖动元素，使用事件委托
class OptimizedDraggable {
  constructor(container, itemSelector) {
    this.container = container;
    this.itemSelector = itemSelector;
    this.draggedItem = null;

    // 只绑定一次事件监听器
    container.addEventListener('dragstart', this.handleDragStart.bind(this));
    container.addEventListener('dragend', this.handleDragEnd.bind(this));
    container.addEventListener('dragover', this.handleDragOver.bind(this));
    container.addEventListener('drop', this.handleDrop.bind(this));
  }

  handleDragStart(event) {
    const item = event.target.closest(this.itemSelector);
    if (!item) return;

    this.draggedItem = item;
    // ... 处理逻辑
  }

  // 虚拟滚动时，只渲染可见元素
  renderVisibleItems() {
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;
    const itemHeight = 50; // 假设每项高度为 50px

    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);

    // 只渲染和绑定事件到可见范围内的元素
    this.container.querySelectorAll(this.itemSelector).forEach((item, index) => {
      if (index >= startIndex && index <= endIndex) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  }
}
```

## 实战场景

### 场景 1：文件上传

支持拖放文件上传，验证文件类型和大小的完整实现。

### 场景 2：列表排序

可拖放排序的列表，支持多种视觉反馈和占位符显示。

### 场景 3：看板管理

支持卡片在列之间拖放移动的看板系统，常见于任务管理应用。

### 场景 4：树形编辑

支持在树形结构中拖放节点，实现组织结构编辑、菜单编辑等功能。

## 面试要点

### 拖放事件的完整流程是什么？

**答案**：

拖放操作的事件触发顺序为：
1. **dragstart** - 开始拖动时在拖动源上触发一次
2. **drag** - 拖动过程中在拖动源上持续触发
3. **dragenter** - 拖动元素进入放置目标时触发
4. **dragover** - 在放置目标上方时持续触发
5. **dragleave** - 拖动元素离开放置目标时触发
6. **drop** - 在放置目标上释放鼠标时触发
7. **dragend** - 拖动结束时在拖动源上触发

### 为什么必须在 dragover 中调用 preventDefault()？

**答案**：

浏览器默认不允许元素作为放置目标。调用 `preventDefault()` 告诉浏览器该元素是有效的放置目标。如果不阻止默认行为，`drop` 事件不会触发。

### effectAllowed 和 dropEffect 的区别是什么？

**答案**：

- **effectAllowed**：在 `dragstart` 中设置，定义拖动源允许的操作类型
- **dropEffect**：在 `dragover` 中设置，定义实际的放置效果，必须是 `effectAllowed` 允许的值之一
- `dropEffect` 会影响鼠标指针的显示样式

### 如何安全地处理文件拖放？

**答案**：使用 items 接口优先，检查文件类型和大小，验证数据。

### DataTransfer 对象的数据访问有什么限制？

**答案**：

1. **只能在 dragstart 中设置数据**
2. **只能在 drop 中读取数据**（dragover 中返回空字符串）
3. **可以在 dragover 中读取 types 数组**
4. **可以在任何事件中访问 files**

### 如何处理移动端的拖放？

**答案**：

HTML5 拖放 API 在移动端支持有限，需要使用触摸事件模拟或第三方库。

### dragleave 事件为什么会重复触发？

**答案**：

当拖动元素进入放置目标的子元素时，也会触发放置目标的 `dragleave` 事件。解决方案有两种：

1. **检查 relatedTarget**：只在真正离开时移除样式
2. **使用计数器**：记录进入次数，只在计数器为 0 时移除样式

## 延伸阅读

### 官方文档

- [MDN - HTML Drag and Drop API](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_Drag_and_Drop_API)
- [MDN - DataTransfer 接口](https://developer.mozilla.org/zh-CN/docs/Web/API/DataTransfer)
- [HTML Living Standard - Drag and Drop](https://html.spec.whatwg.org/multipage/dnd.html)

### 相关库

- [SortableJS](https://sortablejs.github.io/Sortable/) - 流行的拖放排序库
- [dnd-kit](https://dndkit.com/) - React 拖放工具包
- [React DnD](https://react-dnd.github.io/react-dnd/) - React 拖放高阶组件
- [Dragula](https://bevacqua.github.io/dragula/) - 简洁的拖放库

### 推荐文章

- [HTML5 Rocks - Native HTML5 Drag and Drop](https://www.html5rocks.com/en/tutorials/dnd/basics/)
- [JavaScript.info - Drag'n'Drop](https://javascript.info/mouse-drag-and-drop)
- [W3C - Drag and Drop Interoperability](https://www.w3.org/TR/html401/interact/dnd.html)

### 可访问性指南

- [WAI-ARIA - Drag and Drop](https://www.w3.org/WAI/ARIA/apg/patterns/drag-drop/)
- [Inclusive Components - Drag and Drop](https://inclusive-components.design/)

## 总结

掌握 HTML5 拖放 API 的关键要点：

1. **理解事件流** - dragstart → drag → dragenter → dragover → drop → dragend
2. **必须阻止默认行为** - 在 dragover 和 drop 中调用 preventDefault()
3. **正确使用 DataTransfer** - dragstart 设置数据，drop 读取数据
4. **提供视觉反馈** - 使用 dropEffect 和 CSS 样式
5. **处理边界情况** - 嵌套元素、跨浏览器兼容、移动端支持
6. **性能优化** - 节流高频事件、减少 DOM 操作
7. **考虑无障碍** - 支持键盘操作和屏幕阅读器

通过合理使用拖放 API，可以为用户提供直观、高效的交互体验。
