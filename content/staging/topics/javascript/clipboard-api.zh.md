---
title: Clipboard API
description: JavaScript Clipboard API完全指南，剪贴板读写、权限管理与安全实践
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - Clipboard
  - Web API
  - 浏览器
status: imported
origin: old/src/content/docs/javascript/clipboard-api.zh.md
divergence: 0.193
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: 浏览器API
  order: 20
  lastUpdated: 2026-01-07
---

Clipboard API 是现代浏览器提供的用于访问系统剪贴板的接口，允许 Web 应用程序以安全、异步的方式读取和写入剪贴板内容。它取代了传统的 `document.execCommand()` 方法，提供了更强大、更安全的剪贴板操作能力。

## 概念解释

### 什么是 Clipboard API

Clipboard API 是 Web 平台提供的一组接口，用于与系统剪贴板进行交互。它主要包含以下核心组件：

- **navigator.clipboard**: 返回 Clipboard 对象，是访问剪贴板功能的入口点
- **Clipboard 接口**: 提供读写剪贴板的方法
- **ClipboardItem**: 表示剪贴板中的数据项
- **ClipboardEvent**: 剪贴板相关的事件对象

### 历史背景

在 Clipboard API 出现之前，Web 开发者主要依赖 `document.execCommand()` 方法来操作剪贴板：

```javascript
// 传统方式（已废弃）
document.execCommand('copy');
document.execCommand('cut');
document.execCommand('paste');
```

这种方式存在诸多问题：

1. **同步阻塞**: 操作在主线程执行，可能导致页面卡顿
2. **功能有限**: 只能处理文本，不支持图片等富内容
3. **安全隐患**: 缺乏明确的权限模型
4. **已被废弃**: 现代浏览器逐步移除支持

### 解决的问题

Clipboard API 解决了以下关键问题：

| 问题 | 传统方式 | Clipboard API |
|------|---------|---------------|
| 执行方式 | 同步阻塞 | 异步非阻塞 |
| 数据类型 | 仅文本 | 文本、图片、HTML等 |
| 权限控制 | 无明确权限 | 基于 Permissions API |
| API 设计 | 命令式 | Promise 式 |
| 安全上下文 | 无要求 | 需要 HTTPS |

## 核心原理

### 安全模型

Clipboard API 采用严格的安全模型：

1. **安全上下文要求**: 必须在 HTTPS 环境或 localhost 下使用
2. **用户手势要求**: 某些操作需要用户交互触发
3. **权限系统**: 基于 Permissions API 的细粒度权限控制
4. **焦点要求**: 页面必须处于活动状态

```javascript
// 检查是否在安全上下文中
if (window.isSecureContext) {
  console.log('当前处于安全上下文，可以使用 Clipboard API');
} else {
  console.warn('需要 HTTPS 环境才能使用 Clipboard API');
}
```

### 权限机制

Clipboard API 使用两种权限：

- **clipboard-read**: 读取剪贴板内容的权限
- **clipboard-write**: 写入剪贴板内容的权限

```javascript
// 查询剪贴板读取权限
async function checkClipboardPermission() {
  try {
    const readPermission = await navigator.permissions.query({
      name: 'clipboard-read'
    });

    console.log('读取权限状态:', readPermission.state);
    // 'granted' | 'denied' | 'prompt'

    // 监听权限状态变化
    readPermission.addEventListener('change', () => {
      console.log('权限状态已变更为:', readPermission.state);
    });

    return readPermission.state;
  } catch (error) {
    console.error('权限查询失败:', error);
    return null;
  }
}
```

### 数据流模型

Clipboard API 的数据流遵循以下模式：

```
写入流程：
应用数据 → ClipboardItem → Blob → 系统剪贴板

读取流程：
系统剪贴板 → ClipboardItem[] → Blob → 应用数据
```

## 核心要点

### navigator.clipboard 对象

`navigator.clipboard` 是访问剪贴板功能的全局入口：

```javascript
// 检查 Clipboard API 是否可用
if ('clipboard' in navigator) {
  console.log('Clipboard API 可用');
} else {
  console.log('Clipboard API 不可用，需要使用 polyfill');
}
```

### 四个核心方法

| 方法 | 描述 | 权限要求 | 用户手势 |
|------|------|----------|----------|
| `writeText()` | 写入纯文本 | clipboard-write | 通常不需要 |
| `readText()` | 读取纯文本 | clipboard-read | 需要 |
| `write()` | 写入多种格式 | clipboard-write | 通常不需要 |
| `read()` | 读取多种格式 | clipboard-read | 需要 |

### ClipboardItem 类

`ClipboardItem` 用于表示剪贴板中的数据项：

```javascript
// ClipboardItem 构造函数
const item = new ClipboardItem({
  'text/plain': new Blob(['Hello, World!'], { type: 'text/plain' }),
  'text/html': new Blob(['<b>Hello, World!</b>'], { type: 'text/html' })
});

// 获取支持的类型
console.log(item.types); // ['text/plain', 'text/html']

// 获取特定类型的数据
const blob = await item.getType('text/plain');
const text = await blob.text();
```

## 代码示例

### 基本文本操作

#### 复制文本到剪贴板

```javascript
// 使用 writeText() 复制文本
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('文本已复制到剪贴板');
    return true;
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
}

// 使用示例
copyText('Hello, Clipboard API!');

// 复制按钮实现
document.getElementById('copyBtn').addEventListener('click', async () => {
  const textToCopy = document.getElementById('content').textContent;
  const success = await copyText(textToCopy);

  if (success) {
    showNotification('复制成功！');
  } else {
    showNotification('复制失败，请手动复制');
  }
});
```

#### 从剪贴板读取文本

```javascript
// 使用 readText() 读取文本
async function pasteText() {
  try {
    const text = await navigator.clipboard.readText();
    console.log('剪贴板内容:', text);
    return text;
  } catch (error) {
    console.error('读取失败:', error);
    return null;
  }
}

// 粘贴按钮实现
document.getElementById('pasteBtn').addEventListener('click', async () => {
  const text = await pasteText();

  if (text !== null) {
    document.getElementById('input').value = text;
  }
});
```

### 富内容操作

#### 复制 HTML 内容

```javascript
// 复制富文本（HTML）
async function copyHTML(html, plainText) {
  try {
    const htmlBlob = new Blob([html], { type: 'text/html' });
    const textBlob = new Blob([plainText], { type: 'text/plain' });

    const clipboardItem = new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob
    });

    await navigator.clipboard.write([clipboardItem]);
    console.log('HTML 内容已复制');
    return true;
  } catch (error) {
    console.error('复制 HTML 失败:', error);
    return false;
  }
}

// 使用示例
copyHTML(
  '<h1 style="color: blue;">标题</h1><p>这是一段<strong>富文本</strong>内容。</p>',
  '标题\n这是一段富文本内容。'
);
```

#### 复制图片

```javascript
// 复制图片到剪贴板
async function copyImage(imageSource) {
  try {
    let blob;

    if (imageSource instanceof Blob) {
      blob = imageSource;
    } else if (typeof imageSource === 'string') {
      // 从 URL 加载图片
      const response = await fetch(imageSource);
      blob = await response.blob();
    } else if (imageSource instanceof HTMLCanvasElement) {
      // 从 Canvas 获取图片
      blob = await new Promise(resolve => {
        imageSource.toBlob(resolve, 'image/png');
      });
    }

    const clipboardItem = new ClipboardItem({
      [blob.type]: blob
    });

    await navigator.clipboard.write([clipboardItem]);
    console.log('图片已复制到剪贴板');
    return true;
  } catch (error) {
    console.error('复制图片失败:', error);
    return false;
  }
}

// 从 Canvas 复制
const canvas = document.getElementById('myCanvas');
copyImage(canvas);

// 从 URL 复制
copyImage('https://example.com/image.png');
```

#### 读取剪贴板图片

```javascript
// 读取剪贴板中的图片
async function pasteImage() {
  try {
    const clipboardItems = await navigator.clipboard.read();

    for (const item of clipboardItems) {
      // 检查是否包含图片类型
      const imageType = item.types.find(type => type.startsWith('image/'));

      if (imageType) {
        const blob = await item.getType(imageType);
        const imageUrl = URL.createObjectURL(blob);

        // 创建图片元素
        const img = document.createElement('img');
        img.src = imageUrl;
        img.onload = () => URL.revokeObjectURL(imageUrl);

        return { blob, imageUrl, element: img };
      }
    }

    console.log('剪贴板中没有图片');
    return null;
  } catch (error) {
    console.error('读取图片失败:', error);
    return null;
  }
}

// 粘贴图片按钮
document.getElementById('pasteImageBtn').addEventListener('click', async () => {
  const result = await pasteImage();

  if (result) {
    document.getElementById('imageContainer').appendChild(result.element);
  }
});
```

### 读取多种格式

```javascript
// 读取剪贴板所有可用格式
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
    console.error('读取剪贴板失败:', error);
    return null;
  }
}

// 使用示例
const clipboardData = await readClipboard();
console.log('剪贴板数据:', clipboardData);
```

### 剪贴板事件处理

```javascript
// 监听复制事件
document.addEventListener('copy', (event) => {
  // 阻止默认复制行为
  event.preventDefault();

  // 获取选中的文本
  const selectedText = window.getSelection().toString();

  // 自定义复制内容
  const customText = selectedText + '\n\n来源：我的网站 - https://example.com';

  // 设置剪贴板数据
  event.clipboardData.setData('text/plain', customText);

  console.log('复制内容已自定义');
});

// 监听剪切事件
document.addEventListener('cut', (event) => {
  event.preventDefault();

  const selectedText = window.getSelection().toString();
  event.clipboardData.setData('text/plain', selectedText);

  // 删除选中内容
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    selection.deleteFromDocument();
  }
});

// 监听粘贴事件
document.addEventListener('paste', (event) => {
  event.preventDefault();

  // 获取粘贴的数据
  const text = event.clipboardData.getData('text/plain');
  const files = event.clipboardData.files;

  console.log('粘贴的文本:', text);
  console.log('粘贴的文件数:', files.length);

  // 处理粘贴的图片
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      handlePastedImage(file);
    }
  }

  // 安全地插入纯文本
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

### 封装剪贴板工具类

```javascript
class ClipboardManager {
  constructor() {
    this.isSupported = 'clipboard' in navigator;
  }

  // 检查 API 是否可用
  checkSupport() {
    if (!this.isSupported) {
      throw new Error('Clipboard API 不可用');
    }

    if (!window.isSecureContext) {
      throw new Error('需要安全上下文（HTTPS）');
    }
  }

  // 复制文本
  async copyText(text) {
    this.checkSupport();

    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 读取文本
  async readText() {
    this.checkSupport();

    try {
      const text = await navigator.clipboard.readText();
      return { success: true, data: text };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 复制富内容
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

  // 复制图片
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
            else reject(new Error('Canvas 转换失败'));
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

  // 读取所有内容
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

  // 检查权限
  async checkPermission(type = 'read') {
    try {
      const permissionName = type === 'read' ? 'clipboard-read' : 'clipboard-write';
      const result = await navigator.permissions.query({ name: permissionName });
      return result.state;
    } catch {
      return 'unknown';
    }
  }

  // 请求权限（通过尝试操作触发）
  async requestReadPermission() {
    try {
      await navigator.clipboard.readText();
      return true;
    } catch {
      return false;
    }
  }
}

// 使用示例
const clipboard = new ClipboardManager();

// 复制文本
const result = await clipboard.copyText('Hello, World!');
if (result.success) {
  console.log('复制成功');
}

// 复制富内容
await clipboard.copyRichContent({
  'text/plain': '纯文本内容',
  'text/html': '<strong>HTML 内容</strong>'
});

// 读取剪贴板
const content = await clipboard.readAll();
console.log(content);
```

## 最佳实践

### 始终检查 API 可用性

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
    // 回退到传统方法
    return fallbackCopy(text);
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('复制失败:', error);
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

### 提供用户反馈

```javascript
async function copyWithFeedback(text, button) {
  const originalText = button.textContent;

  try {
    await navigator.clipboard.writeText(text);

    // 成功反馈
    button.textContent = '已复制!';
    button.classList.add('success');

    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('success');
    }, 2000);

  } catch (error) {
    // 失败反馈
    button.textContent = '复制失败';
    button.classList.add('error');

    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('error');
    }, 2000);
  }
}
```

### 在用户手势中执行读取操作

```javascript
// 正确：在点击事件中读取
button.addEventListener('click', async () => {
  const text = await navigator.clipboard.readText();
  // 处理文本
});

// 错误：在非用户手势中读取可能失败
// setTimeout(async () => {
//   const text = await navigator.clipboard.readText(); // 可能被拒绝
// }, 1000);
```

### 提供多种数据格式

```javascript
// 复制时提供多种格式，增加兼容性
async function copyWithFallbackFormats(richContent, plainText) {
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([richContent], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' })
      })
    ]);
  } catch {
    // 如果写入富内容失败，回退到纯文本
    await navigator.clipboard.writeText(plainText);
  }
}
```

### 清理资源

```javascript
// 使用 createObjectURL 后记得清理
async function displayPastedImage() {
  const items = await navigator.clipboard.read();

  for (const item of items) {
    if (item.types.includes('image/png')) {
      const blob = await item.getType('image/png');
      const url = URL.createObjectURL(blob);

      const img = document.createElement('img');
      img.src = url;

      // 图片加载完成后释放 URL
      img.onload = () => {
        URL.revokeObjectURL(url);
      };

      // 错误时也要释放
      img.onerror = () => {
        URL.revokeObjectURL(url);
      };

      return img;
    }
  }

  return null;
}
```

## 常见陷阱

### 忽略安全上下文要求

```javascript
// 错误：没有检查安全上下文
async function unsafeCopy(text) {
  await navigator.clipboard.writeText(text); // 可能失败
}

// 正确：检查安全上下文
async function safeCopy(text) {
  if (!window.isSecureContext) {
    console.error('Clipboard API 需要 HTTPS 环境');
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
}
```

### 未处理权限被拒绝的情况

```javascript
// 错误：假设权限总是被授予
async function badPaste() {
  const text = await navigator.clipboard.readText();
  return text;
}

// 正确：处理权限拒绝
async function goodPaste() {
  try {
    const text = await navigator.clipboard.readText();
    return { success: true, data: text };
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      return { success: false, error: '权限被拒绝，请允许剪贴板访问' };
    }
    return { success: false, error: error.message };
  }
}
```

### 在非用户手势中尝试读取

```javascript
// 错误：页面加载时读取剪贴板
window.addEventListener('load', async () => {
  // 这很可能失败，因为没有用户手势
  const text = await navigator.clipboard.readText();
});

// 正确：在用户交互时读取
document.getElementById('pasteBtn').addEventListener('click', async () => {
  const text = await navigator.clipboard.readText();
});
```

### 忘记 ClipboardItem 需要 Blob

```javascript
// 错误：直接传入字符串
// const item = new ClipboardItem({
//   'text/plain': 'Hello' // 错误！
// });

// 正确：使用 Blob
const item = new ClipboardItem({
  'text/plain': new Blob(['Hello'], { type: 'text/plain' })
});
```

### 未处理异步操作

```javascript
// 错误：没有等待 Promise
function copyTextBad(text) {
  navigator.clipboard.writeText(text); // 返回 Promise，但没有处理
  console.log('已复制'); // 可能在复制完成前执行
}

// 正确：等待 Promise 完成
async function copyTextGood(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('已复制');
  } catch (error) {
    console.error('复制失败');
  }
}
```

### 跨域图片复制问题

```javascript
// 问题：跨域图片可能被 CORS 阻止
async function copyImageFromUrl(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();

    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type]: blob })
    ]);
  } catch (error) {
    if (error.message.includes('CORS')) {
      console.error('跨域图片无法复制，需要服务器支持 CORS');
    }
    throw error;
  }
}
```

## 性能考量

### 异步操作的优势

Clipboard API 的异步设计避免了阻塞主线程：

```javascript
// 不会阻塞 UI
async function copyLargeContent(content) {
  const start = performance.now();

  await navigator.clipboard.writeText(content);

  const end = performance.now();
  console.log(`复制操作耗时: ${end - start}ms`);
}
```

### 大文件处理

对于大型内容，考虑分块处理或提供进度反馈：

```javascript
async function copyLargeFile(file) {
  // 显示加载状态
  showLoading('正在准备复制...');

  try {
    const blob = file instanceof Blob ? file : await file.arrayBuffer();

    await navigator.clipboard.write([
      new ClipboardItem({
        [file.type]: new Blob([blob], { type: file.type })
      })
    ]);

    hideLoading();
    showSuccess('复制成功');
  } catch (error) {
    hideLoading();
    showError('复制失败: ' + error.message);
  }
}
```

### 避免频繁操作

```javascript
// 使用防抖避免频繁复制
function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

const debouncedCopy = debounce(async (text) => {
  await navigator.clipboard.writeText(text);
  console.log('复制完成');
}, 300);

// 用于实时复制场景（如代码编辑器的"复制到剪贴板"功能）
inputElement.addEventListener('input', (e) => {
  debouncedCopy(e.target.value);
});
```

### 内存管理

```javascript
// 及时释放 Blob URL
class ClipboardImageHandler {
  constructor() {
    this.currentUrl = null;
  }

  async displayFromClipboard(container) {
    // 释放之前的 URL
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

## 实战场景

### 一键复制代码块

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
      copyBtn.textContent = '复制';
      copyBtn.setAttribute('aria-label', '复制代码');

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

      button.textContent = '已复制!';
      button.classList.add('copied');

      setTimeout(() => {
        button.textContent = '复制';
        button.classList.remove('copied');
      }, 2000);

    } catch (error) {
      button.textContent = '复制失败';

      setTimeout(() => {
        button.textContent = '复制';
      }, 2000);
    }
  }
}

// 初始化
new CodeBlockCopier();
```

### 图片编辑器粘贴功能

```javascript
class ImagePasteHandler {
  constructor(container) {
    this.container = container;
    this.setupPasteListener();
    this.setupPasteButton();
  }

  setupPasteListener() {
    // 监听全局粘贴事件
    document.addEventListener('paste', async (e) => {
      if (!this.container.contains(document.activeElement)) {
        return;
      }

      e.preventDefault();

      // 优先从剪贴板事件获取
      const items = e.clipboardData.items;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          await this.handleImageFile(file);
          return;
        }
      }

      // 回退到 Clipboard API
      await this.pasteFromClipboardAPI();
    });
  }

  setupPasteButton() {
    const pasteBtn = document.createElement('button');
    pasteBtn.textContent = '粘贴图片';
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

      this.showMessage('剪贴板中没有图片');
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        this.showMessage('请允许访问剪贴板');
      } else {
        this.showMessage('粘贴失败: ' + error.message);
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
      this.showMessage(`已粘贴 ${file.type} 图片 (${img.naturalWidth}x${img.naturalHeight})`);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      this.showMessage('图片加载失败');
    };
  }

  showMessage(text) {
    console.log(text);
    // 可以实现更友好的 UI 提示
  }
}
```

### 分享链接功能

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
      this.showFeedback(button, '链接已复制!', 'success');
    } catch {
      this.showFeedback(button, '复制失败', 'error');
    }
  }

  async copyLinkWithTitle(url, title, button) {
    try {
      // 提供多种格式
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([`${title}\n${url}`], { type: 'text/plain' }),
          'text/html': new Blob([`<a href="${url}">${title}</a>`], { type: 'text/html' })
        })
      ]);
      this.showFeedback(button, '链接已复制!', 'success');
    } catch {
      // 回退到纯文本
      await this.copyLink(url, button);
    }
  }

  async nativeShare(url, title) {
    if (navigator.share) {
      try {
        await navigator.share({ url, title });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('分享失败:', error);
        }
      }
    } else {
      // 回退到复制链接
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

// HTML 使用
// <button data-share="copy">复制链接</button>
// <button data-share="copy-with-title">复制标题和链接</button>
// <button data-share="native">分享</button>
```

### 表格数据复制

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
    copyBtn.textContent = '复制表格';
    copyBtn.addEventListener('click', () => this.copyTable());

    const copySelectedBtn = document.createElement('button');
    copySelectedBtn.textContent = '复制选中';
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
      alert('请先选择要复制的内容');
      return;
    }

    const range = selection.getRangeAt(0);
    const text = selection.toString();

    // 创建临时容器获取选中内容
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
      console.log('表格已复制（支持粘贴到 Excel）');
    } catch {
      await navigator.clipboard.writeText(text);
      console.log('表格已复制（纯文本）');
    }
  }
}
```

## 面试要点

### Clipboard API 与 document.execCommand 的区别

**问**: 请解释 Clipboard API 与传统 `document.execCommand()` 的区别。

**答**:

| 方面 | Clipboard API | document.execCommand |
|------|--------------|---------------------|
| 执行模式 | 异步（Promise） | 同步 |
| 数据类型 | 支持多种类型（文本、图片、HTML） | 主要支持文本 |
| 安全性 | 需要 HTTPS，有权限控制 | 无严格安全限制 |
| API 状态 | 现代标准 | 已废弃 |
| 错误处理 | 通过 Promise catch | 返回 boolean |

### 为什么读取剪贴板需要用户手势

**问**: 为什么 `readText()` 和 `read()` 通常需要用户手势？

**答**: 这是出于安全考虑。剪贴板可能包含敏感信息（如密码、信用卡号），如果允许任意脚本在后台读取剪贴板，将造成严重的隐私风险。要求用户手势确保了：

1. 用户明确知道正在进行剪贴板操作
2. 恶意网站无法在用户不知情时读取剪贴板
3. 用户对数据访问有控制权

### 如何处理 Clipboard API 的兼容性

**问**: 在不支持 Clipboard API 的浏览器中如何实现复制功能？

**答**:

```javascript
async function copyText(text) {
  // 优先使用 Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 失败时回退
    }
  }

  // 回退方案：使用临时 textarea
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

### ClipboardItem 的作用

**问**: 请解释 ClipboardItem 的作用和使用方法。

**答**: ClipboardItem 是用于表示剪贴板数据项的接口，它允许：

1. 以多种格式存储同一内容
2. 支持异步数据源（通过 Promise）
3. 处理二进制数据（Blob）

```javascript
// 同时提供多种格式
const item = new ClipboardItem({
  'text/plain': new Blob(['纯文本'], { type: 'text/plain' }),
  'text/html': new Blob(['<b>HTML</b>'], { type: 'text/html' })
});

await navigator.clipboard.write([item]);
```

### 权限模型

**问**: Clipboard API 的权限模型是怎样的？

**答**:

- **clipboard-write**: 写入权限，通常自动授予，不需要明确用户授权
- **clipboard-read**: 读取权限，需要用户授权，且通常需要用户手势

可以通过 Permissions API 查询权限状态：

```javascript
const result = await navigator.permissions.query({
  name: 'clipboard-read'
});
// result.state: 'granted' | 'denied' | 'prompt'
```

### 安全上下文要求

**问**: 什么是安全上下文，为什么 Clipboard API 需要它？

**答**: 安全上下文（Secure Context）是浏览器定义的一种环境，满足以下条件：

- HTTPS 协议传输
- localhost 或 127.0.0.1
- file:// 协议（部分浏览器）

Clipboard API 需要安全上下文是因为：

1. 防止中间人攻击拦截剪贴板数据
2. 确保用户与可信来源交互
3. 保护敏感信息不被恶意脚本窃取

## 延伸阅读

### 官方文档

- [MDN - Clipboard API](https://developer.mozilla.org/zh-CN/docs/Web/API/Clipboard_API)
- [MDN - Clipboard](https://developer.mozilla.org/zh-CN/docs/Web/API/Clipboard)
- [MDN - ClipboardItem](https://developer.mozilla.org/zh-CN/docs/Web/API/ClipboardItem)
- [W3C Clipboard API 规范](https://www.w3.org/TR/clipboard-apis/)

### 浏览器兼容性

- [Can I Use - Async Clipboard API](https://caniuse.com/async-clipboard)
- [Can I Use - Clipboard API (images)](https://caniuse.com/mdn-api_clipboarditem)

### 相关技术

- [Permissions API](https://developer.mozilla.org/zh-CN/docs/Web/API/Permissions_API) - 权限管理
- [Drag and Drop API](https://developer.mozilla.org/zh-CN/docs/Web/API/HTML_Drag_and_Drop_API) - 拖放功能
- [Web Share API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Share_API) - 原生分享功能
- [File API](https://developer.mozilla.org/zh-CN/docs/Web/API/File_API) - 文件处理

### 优质教程

- [web.dev - 与系统剪贴板交互](https://web.dev/articles/async-clipboard)
- [JavaScript.info - 剪贴板](https://javascript.info/clipboard)

### 相关库

- [clipboard.js](https://clipboardjs.com/) - 轻量级剪贴板库
- [copy-to-clipboard](https://www.npmjs.com/package/copy-to-clipboard) - npm 包
