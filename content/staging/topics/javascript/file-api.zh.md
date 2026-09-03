---
title: JavaScript File API
description: JavaScript File API完全指南，深入理解File、Blob、FileReader、FileList对象，掌握文件读取、拖拽上传等核心技术
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - File
  - Blob
  - FileReader
  - 文件上传
status: imported
origin: old/src/content/docs/javascript/file-api.zh.md
divergence: 0.183
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: 浏览器API
  order: 17
  lastUpdated: 2026-01-07
---

File API 是现代浏览器提供的一组用于处理文件的接口，它让 Web 应用能够读取用户本地文件的内容、获取文件元信息，并支持拖拽上传等交互方式。

## 概念解释

### 什么是 File API

File API 是 HTML5 引入的一组 JavaScript 接口，用于在浏览器中处理文件。它允许 Web 应用：

- 获取用户选择的文件信息（名称、大小、类型等）
- 读取文件内容（文本、二进制数据、Data URL 等）
- 处理拖拽到页面的文件
- 创建和操作二进制数据

### 历史背景

在 File API 出现之前，浏览器对文件的处理能力非常有限。传统的 `<input type="file">` 只能将文件提交到服务器，无法在客户端直接读取文件内容。File API 的出现彻底改变了这一局面，使得纯前端的文件处理成为可能。

### 核心对象关系

```
Blob（二进制大对象）
  ↑
  │ 继承
  │
File（文件对象）

FileList（文件列表）─── 包含 ──→ File

FileReader（文件读取器）─── 读取 ──→ Blob / File
```

### 解决的问题

1. **客户端文件预处理**：在上传前验证文件、压缩图片、预览内容
2. **离线文件操作**：不依赖服务器处理文件数据
3. **用户体验提升**：即时预览、进度显示、拖拽上传
4. **数据安全**：敏感文件无需上传服务器即可处理

## 核心原理

### Blob 的内部结构

Blob（Binary Large Object）是 File API 的基础。它代表一段不可变的原始二进制数据。

```javascript
// Blob 的内部结构可以理解为：
{
  size: number,        // 数据大小（字节）
  type: string,        // MIME 类型
  [[BlobData]]: bytes  // 内部二进制数据（不可直接访问）
}
```

### File 与 Blob 的继承关系

File 对象继承自 Blob，增加了文件系统相关的属性：

```javascript
// File 继承 Blob 并添加：
{
  name: string,           // 文件名
  lastModified: number,   // 最后修改时间戳
  lastModifiedDate: Date, // 最后修改日期（已废弃）
  webkitRelativePath: string  // 相对路径（目录上传时）
}
```

### FileReader 的异步读取机制

FileReader 采用事件驱动的异步模式读取文件：

```
开始读取 → 触发 loadstart
    ↓
读取中 → 触发 progress（多次）
    ↓
读取完成 → 触发 load
    ↓
最终 → 触发 loadend

任何阶段出错 → 触发 error
取消读取 → 触发 abort
```

### 内存模型

```javascript
// Blob URL 的内存管理
const blob = new Blob(['Hello']);
const url = URL.createObjectURL(blob);  // 创建引用

// url 指向内存中的 blob 数据
// 必须手动释放，否则内存泄漏
URL.revokeObjectURL(url);  // 释放引用
```

## 核心要点

### Blob 对象

Blob 是二进制数据的容器，是 File API 的基石。

#### 创建 Blob

```javascript
// 从字符串创建
const textBlob = new Blob(['Hello, World!'], { type: 'text/plain' });

// 从数组创建（多个部分）
const htmlBlob = new Blob(
  ['<html>', '<body>', '<h1>标题</h1>', '</body>', '</html>'],
  { type: 'text/html' }
);

// 从 ArrayBuffer 创建
const buffer = new ArrayBuffer(8);
const view = new Uint8Array(buffer);
view.set([72, 101, 108, 108, 111, 33, 33, 33]); // "Hello!!!"
const binaryBlob = new Blob([buffer], { type: 'application/octet-stream' });

// 从其他 Blob 创建
const combinedBlob = new Blob([textBlob, binaryBlob]);
```

#### Blob 属性和方法

```javascript
const blob = new Blob(['测试数据'], { type: 'text/plain;charset=utf-8' });

// 属性
console.log(blob.size);  // 字节大小
console.log(blob.type);  // MIME 类型

// 方法
const slicedBlob = blob.slice(0, 5, 'text/plain');  // 切片
const text = await blob.text();          // 读取为文本（Promise）
const buffer = await blob.arrayBuffer(); // 读取为 ArrayBuffer（Promise）
const stream = blob.stream();            // 获取 ReadableStream
```

### File 对象

File 对象代表用户文件系统中的文件，继承自 Blob。

#### 获取 File 对象

```javascript
// 方式一：通过 input 元素
const input = document.querySelector('input[type="file"]');
input.addEventListener('change', (event) => {
  const file = event.target.files[0];
  console.log(file.name);         // 文件名
  console.log(file.size);         // 文件大小
  console.log(file.type);         // MIME 类型
  console.log(file.lastModified); // 最后修改时间戳
});

// 方式二：通过拖拽
document.addEventListener('drop', (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
});

// 方式三：手动创建（较少使用）
const file = new File(['文件内容'], 'example.txt', {
  type: 'text/plain',
  lastModified: Date.now()
});
```

### FileList 对象

FileList 是类数组对象，包含用户选择的所有文件。

```javascript
const input = document.querySelector('input[type="file"][multiple]');

input.addEventListener('change', (event) => {
  const fileList = event.target.files;

  console.log(fileList.length);  // 文件数量
  console.log(fileList[0]);      // 第一个文件
  console.log(fileList.item(0)); // 同上

  // 遍历所有文件
  for (const file of fileList) {
    console.log(file.name, file.size);
  }

  // 转换为数组
  const filesArray = Array.from(fileList);
  // 或
  const filesArray2 = [...fileList];
});
```

### FileReader 对象

FileReader 用于异步读取文件内容。

#### 读取方法

```javascript
const reader = new FileReader();

// 读取为文本
reader.readAsText(file, 'UTF-8');

// 读取为 Data URL（Base64 编码）
reader.readAsDataURL(file);

// 读取为 ArrayBuffer
reader.readAsArrayBuffer(file);

// 读取为二进制字符串（已废弃，不推荐使用）
reader.readAsBinaryString(file);

// 中止读取
reader.abort();
```

#### 事件处理

```javascript
const reader = new FileReader();

reader.onloadstart = (event) => {
  console.log('开始读取');
};

reader.onprogress = (event) => {
  if (event.lengthComputable) {
    const percent = (event.loaded / event.total) * 100;
    console.log(`读取进度: ${percent.toFixed(2)}%`);
  }
};

reader.onload = (event) => {
  console.log('读取完成');
  console.log(event.target.result);  // 读取结果
};

reader.onerror = (event) => {
  console.error('读取错误:', event.target.error);
};

reader.onabort = () => {
  console.log('读取已取消');
};

reader.onloadend = () => {
  console.log('读取结束（无论成功或失败）');
};

reader.readAsText(file);
```

## 代码示例

### 基础文件选择与信息显示

```javascript
function setupFileInput() {
  const input = document.getElementById('fileInput');
  const info = document.getElementById('fileInfo');

  input.addEventListener('change', (event) => {
    const files = event.target.files;

    if (files.length === 0) {
      info.textContent = '未选择文件';
      return;
    }

    // 创建表格显示文件信息
    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    ['文件名', '大小', '类型', '修改时间'].forEach(text => {
      const th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    for (const file of files) {
      const row = document.createElement('tr');
      [
        file.name,
        formatFileSize(file.size),
        file.type || '未知',
        new Date(file.lastModified).toLocaleString()
      ].forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        row.appendChild(td);
      });
      table.appendChild(row);
    }

    info.textContent = '';
    info.appendChild(table);
  });
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}
```

### 读取文本文件

```javascript
async function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      resolve(event.target.result);
    };

    reader.onerror = (event) => {
      reject(new Error('文件读取失败: ' + event.target.error.message));
    };

    reader.readAsText(file, 'UTF-8');
  });
}

// 使用现代 API（如果 Blob.text() 可用）
async function readTextFileModern(file) {
  try {
    return await file.text();
  } catch (error) {
    throw new Error('文件读取失败: ' + error.message);
  }
}

// 使用示例
document.getElementById('textFileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  try {
    const content = await readTextFile(file);
    document.getElementById('textContent').textContent = content;
  } catch (error) {
    console.error(error);
    alert('读取文件失败');
  }
});
```

### 图片预览

```javascript
function createImagePreview(file) {
  return new Promise((resolve, reject) => {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      reject(new Error('请选择图片文件'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target.result;
      img.alt = file.name;

      img.onload = () => {
        resolve({
          element: img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          dataUrl: event.target.result
        });
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsDataURL(file);
  });
}

// 使用 Blob URL 的替代方案（更高效）
function createImagePreviewWithBlobUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('请选择图片文件'));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = document.createElement('img');

    img.onload = () => {
      resolve({
        element: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        blobUrl: url,
        // 提供清理函数
        revoke: () => URL.revokeObjectURL(url)
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };

    img.src = url;
  });
}

// 批量图片预览
async function previewImages(fileList, container) {
  // 清空容器
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  for (const file of fileList) {
    try {
      const preview = await createImagePreviewWithBlobUrl(file);
      preview.element.style.maxWidth = '200px';
      preview.element.style.margin = '5px';
      container.appendChild(preview.element);
    } catch (error) {
      console.warn(`跳过文件 ${file.name}: ${error.message}`);
    }
  }
}
```

### 拖拽文件上传

```javascript
function setupDragAndDrop(dropZone, onFilesDropped) {
  // 阻止默认行为
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  // 拖入时添加高亮样式
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add('drag-over');
    });
  });

  // 拖出时移除高亮样式
  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('drag-over');
    });
  });

  // 处理文件放置
  dropZone.addEventListener('drop', (event) => {
    const files = event.dataTransfer.files;

    if (files.length > 0) {
      onFilesDropped(Array.from(files));
    }
  });
}

// 使用示例
const dropZone = document.getElementById('dropZone');

setupDragAndDrop(dropZone, (files) => {
  console.log('接收到文件:');
  files.forEach(file => {
    console.log(`- ${file.name} (${formatFileSize(file.size)})`);
  });
});
```

### 读取 JSON 文件

```javascript
async function readJsonFile(file) {
  // 验证文件类型
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    throw new Error('请选择 JSON 文件');
  }

  const text = await file.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('JSON 解析失败: ' + error.message);
  }
}

// 带验证的 JSON 读取
async function readAndValidateJson(file, schema) {
  const data = await readJsonFile(file);

  // 简单的 schema 验证
  for (const [key, type] of Object.entries(schema)) {
    if (typeof data[key] !== type) {
      throw new Error(`字段 "${key}" 类型错误，期望 ${type}`);
    }
  }

  return data;
}

// 使用示例
document.getElementById('jsonInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];

  try {
    const data = await readAndValidateJson(file, {
      name: 'string',
      age: 'number'
    });
    console.log('解析成功:', data);
  } catch (error) {
    console.error('解析失败:', error.message);
  }
});
```

### 大文件分片读取

```javascript
async function readFileInChunks(file, chunkSize = 1024 * 1024, onProgress) {
  const chunks = [];
  let offset = 0;
  const total = file.size;

  while (offset < total) {
    const chunk = file.slice(offset, offset + chunkSize);
    const buffer = await chunk.arrayBuffer();
    chunks.push(new Uint8Array(buffer));

    offset += chunkSize;

    if (onProgress) {
      onProgress({
        loaded: Math.min(offset, total),
        total,
        percent: Math.min((offset / total) * 100, 100)
      });
    }
  }

  // 合并所有分片
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let position = 0;

  for (const chunk of chunks) {
    result.set(chunk, position);
    position += chunk.length;
  }

  return result;
}

// 使用示例
async function processLargeFile(file) {
  const progressBar = document.getElementById('progressBar');

  try {
    const data = await readFileInChunks(file, 1024 * 1024, (progress) => {
      progressBar.style.width = `${progress.percent}%`;
      progressBar.textContent = `${progress.percent.toFixed(1)}%`;
    });

    console.log(`文件读取完成，共 ${data.length} 字节`);
    return data;
  } catch (error) {
    console.error('文件读取失败:', error);
  }
}
```

### 文件下载生成

```javascript
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 延迟释放 URL，确保下载开始
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

// 下载文本文件
function downloadText(text, filename, mimeType = 'text/plain') {
  const blob = new Blob([text], { type: mimeType });
  downloadBlob(blob, filename);
}

// 下载 JSON 文件
function downloadJson(data, filename) {
  const json = JSON.stringify(data, null, 2);
  downloadText(json, filename, 'application/json');
}

// 下载 CSV 文件
function downloadCsv(rows, filename) {
  const csv = rows.map(row =>
    row.map(cell => {
      // 处理包含逗号或引号的单元格
      if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')
  ).join('\n');

  // 添加 BOM 以支持 Excel 正确识别 UTF-8
  const bom = '\uFEFF';
  downloadText(bom + csv, filename, 'text/csv;charset=utf-8');
}

// 使用示例
downloadJson({ name: '张三', age: 25 }, 'user.json');

downloadCsv([
  ['姓名', '年龄', '城市'],
  ['张三', 25, '北京'],
  ['李四', 30, '上海']
], 'users.csv');
```

### 文件类型检测

```javascript
// 通过文件头（Magic Number）检测真实文件类型
async function detectFileType(file) {
  const signatures = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46], null, null, null, [0x57, 0x45, 0x42, 0x50]],
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
    'application/zip': [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]],
  };

  // 读取文件头部
  const slice = file.slice(0, 12);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  for (const [mimeType, sigs] of Object.entries(signatures)) {
    for (const sig of sigs) {
      if (matchSignature(bytes, sig)) {
        return mimeType;
      }
    }
  }

  // 未识别，返回声明的类型或未知
  return file.type || 'application/octet-stream';
}

function matchSignature(bytes, signature) {
  for (let i = 0; i < signature.length; i++) {
    if (signature[i] !== null && bytes[i] !== signature[i]) {
      return false;
    }
  }
  return true;
}

// 使用示例
document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];

  const declaredType = file.type;
  const actualType = await detectFileType(file);

  console.log(`声明类型: ${declaredType}`);
  console.log(`实际类型: ${actualType}`);

  if (declaredType !== actualType) {
    console.warn('文件类型不匹配，可能是伪造的文件扩展名');
  }
});
```

## 最佳实践

### 文件验证

```javascript
class FileValidator {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 默认 10MB
    this.allowedTypes = options.allowedTypes || [];
    this.allowedExtensions = options.allowedExtensions || [];
  }

  validate(file) {
    const errors = [];

    // 检查文件大小
    if (file.size > this.maxSize) {
      errors.push(`文件大小超过限制 (最大 ${formatFileSize(this.maxSize)})`);
    }

    // 检查 MIME 类型
    if (this.allowedTypes.length > 0) {
      const typeMatch = this.allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!typeMatch) {
        errors.push(`不支持的文件类型: ${file.type || '未知'}`);
      }
    }

    // 检查文件扩展名
    if (this.allowedExtensions.length > 0) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!this.allowedExtensions.includes(ext)) {
        errors.push(`不支持的文件扩展名: .${ext}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateAll(files) {
    const results = [];

    for (const file of files) {
      results.push({
        file,
        ...this.validate(file)
      });
    }

    return {
      allValid: results.every(r => r.valid),
      results
    };
  }
}

// 使用示例
const imageValidator = new FileValidator({
  maxSize: 5 * 1024 * 1024,  // 5MB
  allowedTypes: ['image/*'],
  allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
});

document.getElementById('imageInput').addEventListener('change', (event) => {
  const validation = imageValidator.validateAll(event.target.files);

  if (!validation.allValid) {
    validation.results.forEach(result => {
      if (!result.valid) {
        console.error(`${result.file.name}: ${result.errors.join(', ')}`);
      }
    });
  }
});
```

### 统一的文件读取接口

```javascript
class FileReaderService {
  static readAsText(file, encoding = 'UTF-8') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`读取失败: ${reader.error?.message}`));
      reader.readAsText(file, encoding);
    });
  }

  static readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`读取失败: ${reader.error?.message}`));
      reader.readAsDataURL(file);
    });
  }

  static readAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`读取失败: ${reader.error?.message}`));
      reader.readAsArrayBuffer(file);
    });
  }

  static readWithProgress(file, method, onProgress) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percent: (event.loaded / event.total) * 100
          });
        }
      };

      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`读取失败: ${reader.error?.message}`));

      reader[method](file);
    });
  }
}

// 使用示例
async function processFile(file) {
  try {
    const content = await FileReaderService.readWithProgress(
      file,
      'readAsText',
      (progress) => console.log(`进度: ${progress.percent.toFixed(1)}%`)
    );

    console.log('文件内容:', content);
  } catch (error) {
    console.error('读取失败:', error);
  }
}
```

### 内存管理

```javascript
// Blob URL 管理器
class BlobUrlManager {
  constructor() {
    this.urls = new Set();
  }

  create(blob) {
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  revoke(url) {
    if (this.urls.has(url)) {
      URL.revokeObjectURL(url);
      this.urls.delete(url);
    }
  }

  revokeAll() {
    for (const url of this.urls) {
      URL.revokeObjectURL(url);
    }
    this.urls.clear();
  }

  get count() {
    return this.urls.size;
  }
}

// 使用示例
const urlManager = new BlobUrlManager();

function previewImage(file) {
  const url = urlManager.create(file);
  const img = document.createElement('img');
  img.src = url;

  // 图片加载完成后可以选择释放 URL
  img.onload = () => {
    // 如果不需要再次使用这个 URL，可以立即释放
    // urlManager.revoke(url);
  };

  return img;
}

// 页面卸载时清理所有 URL
window.addEventListener('unload', () => {
  urlManager.revokeAll();
});
```

### 错误处理

```javascript
class FileError extends Error {
  constructor(code, message, file = null) {
    super(message);
    this.name = 'FileError';
    this.code = code;
    this.file = file;
  }

  static fromFileReaderError(error, file) {
    const codes = {
      1: 'NOT_FOUND',
      2: 'SECURITY',
      3: 'ABORT',
      4: 'NOT_READABLE',
      5: 'ENCODING'
    };

    return new FileError(
      codes[error.code] || 'UNKNOWN',
      error.message || '文件读取错误',
      file
    );
  }
}

// 带重试的文件读取
async function readFileWithRetry(file, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await FileReaderService.readAsText(file);
    } catch (error) {
      lastError = error;
      console.warn(`读取失败，尝试 ${attempt}/${maxRetries}`);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError;
}
```

## 常见陷阱

### Blob URL 内存泄漏

```javascript
// 错误示例：创建 URL 后从未释放
function badPreview(file) {
  const url = URL.createObjectURL(file);  // 内存泄漏！
  const img = document.createElement('img');
  img.src = url;
  return img;
}

// 正确示例：使用后释放
function goodPreview(file) {
  const url = URL.createObjectURL(file);
  const img = document.createElement('img');

  img.onload = () => {
    URL.revokeObjectURL(url);  // 加载完成后释放
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);  // 错误时也要释放
  };

  img.src = url;
  return img;
}
```

### FileList 不是真正的数组

```javascript
const input = document.getElementById('fileInput');
const files = input.files;

// 错误：FileList 没有数组方法
// files.forEach(file => {});  // TypeError!
// files.map(file => file.name);  // TypeError!

// 正确：先转换为数组
Array.from(files).forEach(file => {});
[...files].map(file => file.name);

// 或使用 for...of
for (const file of files) {
  console.log(file.name);
}
```

### 异步读取的顺序问题

```javascript
// 错误示例：读取顺序不确定
function badReadMultiple(files) {
  const results = [];

  for (const file of files) {
    const reader = new FileReader();
    reader.onload = () => {
      results.push(reader.result);  // 顺序不确定！
    };
    reader.readAsText(file);
  }

  return results;  // 返回时可能还是空的！
}

// 正确示例：使用 Promise.all 保持顺序
async function goodReadMultiple(files) {
  const promises = Array.from(files).map(file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  });

  return Promise.all(promises);  // 保持原始顺序
}
```

### 忽略文件大小检查

```javascript
// 错误示例：直接读取任意大小的文件
function badRead(file) {
  const reader = new FileReader();
  reader.readAsText(file);  // 如果是 2GB 的文件会怎样？
}

// 正确示例：先检查文件大小
function goodRead(file, maxSize = 50 * 1024 * 1024) {
  if (file.size > maxSize) {
    throw new Error(`文件过大，最大支持 ${formatFileSize(maxSize)}`);
  }

  return FileReaderService.readAsText(file);
}

// 对于大文件，使用分片读取
async function readLargeFile(file) {
  if (file.size > 100 * 1024 * 1024) {  // 100MB
    return readFileInChunks(file, 10 * 1024 * 1024);  // 10MB 每块
  }
  return file.arrayBuffer();
}
```

### 信任客户端文件类型

```javascript
// 错误示例：只检查 MIME 类型
function badValidate(file) {
  if (file.type === 'image/jpeg') {
    // 攻击者可以修改扩展名，type 可能不准确
    processImage(file);
  }
}

// 正确示例：验证文件内容
async function goodValidate(file) {
  // 1. 检查声明的类型
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件');
  }

  // 2. 验证真实文件类型
  const actualType = await detectFileType(file);
  if (!actualType.startsWith('image/')) {
    throw new Error('文件内容与类型不匹配');
  }

  processImage(file);
}
```

### 跨浏览器兼容性问题

```javascript
// 检测 File API 支持
function checkFileAPISupport() {
  const support = {
    fileReader: typeof FileReader !== 'undefined',
    blob: typeof Blob !== 'undefined',
    file: typeof File !== 'undefined',
    formData: typeof FormData !== 'undefined',
    arrayBuffer: typeof ArrayBuffer !== 'undefined',
    blobSlice: Blob.prototype.slice || Blob.prototype.webkitSlice || Blob.prototype.mozSlice
  };

  return {
    ...support,
    full: Object.values(support).every(Boolean)
  };
}

// 兼容的 Blob.slice
function sliceBlob(blob, start, end, type) {
  if (blob.slice) {
    return blob.slice(start, end, type);
  } else if (blob.webkitSlice) {
    return blob.webkitSlice(start, end, type);
  } else if (blob.mozSlice) {
    return blob.mozSlice(start, end, type);
  }
  throw new Error('Blob.slice 不被支持');
}
```

## 性能考量

### Data URL vs Blob URL

| 特性 | Data URL | Blob URL |
|------|----------|----------|
| 生成速度 | 慢（需要 Base64 编码） | 快（只创建引用） |
| 内存占用 | 约 1.37 倍原始大小 | 与原始大小相同 |
| 可序列化 | 可以存储为字符串 | 不可序列化 |
| 生命周期 | 永久有效 | 需要手动管理 |

```javascript
// 性能测试
async function comparePerformance(file) {
  // Data URL
  console.time('Data URL');
  const dataUrl = await FileReaderService.readAsDataURL(file);
  console.timeEnd('Data URL');
  console.log(`Data URL 长度: ${dataUrl.length}`);

  // Blob URL
  console.time('Blob URL');
  const blobUrl = URL.createObjectURL(file);
  console.timeEnd('Blob URL');
  console.log(`Blob URL 长度: ${blobUrl.length}`);

  URL.revokeObjectURL(blobUrl);
}
```

### 大文件处理策略

```javascript
// 使用 Web Worker 处理大文件
function processInWorker(file) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('file-processor.js');

    worker.onmessage = (event) => {
      if (event.data.type === 'progress') {
        console.log(`进度: ${event.data.percent}%`);
      } else if (event.data.type === 'complete') {
        resolve(event.data.result);
        worker.terminate();
      }
    };

    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };

    worker.postMessage({ file });
  });
}

// file-processor.js (Web Worker)
/*
self.onmessage = async (event) => {
  const { file } = event.data;
  const chunkSize = 1024 * 1024;
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    const buffer = await chunk.arrayBuffer();

    // 处理数据块...

    offset += chunkSize;
    self.postMessage({
      type: 'progress',
      percent: (offset / file.size) * 100
    });
  }

  self.postMessage({
    type: 'complete',
    result: '处理完成'
  });
};
*/
```

### 图片压缩优化

```javascript
function compressImage(file, maxWidth = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // 计算新尺寸
      let { width, height } = img;
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      // 创建 Canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // 转换为 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            reject(new Error('压缩失败'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };

    img.src = url;
  });
}

// 智能压缩：根据原始大小调整质量
async function smartCompress(file, targetSize = 1024 * 1024) {
  if (file.size <= targetSize) {
    return file;
  }

  let quality = 0.9;
  let result = await compressImage(file, 1920, quality);

  while (result.size > targetSize && quality > 0.1) {
    quality -= 0.1;
    result = await compressImage(file, 1920, quality);
  }

  return result;
}
```

### 批量文件处理

```javascript
// 并发控制的批量处理
async function processBatch(files, processor, concurrency = 3) {
  const results = [];
  const executing = new Set();

  for (const file of files) {
    const promise = processor(file).then(result => {
      executing.delete(promise);
      return result;
    });

    results.push(promise);
    executing.add(promise);

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

// 使用示例
const files = document.getElementById('multiInput').files;

processBatch(Array.from(files), async (file) => {
  const compressed = await smartCompress(file);
  console.log(`${file.name}: ${formatFileSize(file.size)} -> ${formatFileSize(compressed.size)}`);
  return compressed;
}, 3);
```

## 实战场景

### 完整的图片上传组件

```javascript
class ImageUploader {
  constructor(options) {
    this.container = options.container;
    this.maxFiles = options.maxFiles || 10;
    this.maxSize = options.maxSize || 5 * 1024 * 1024;
    this.onUpload = options.onUpload || (() => {});

    this.files = [];
    this.urlManager = new BlobUrlManager();

    this.init();
  }

  init() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    // 创建上传区域结构
    const wrapper = document.createElement('div');
    wrapper.className = 'image-uploader';

    const uploadArea = document.createElement('div');
    uploadArea.className = 'upload-area';

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.hidden = true;

    const placeholder = document.createElement('div');
    placeholder.className = 'upload-placeholder';

    const span = document.createElement('span');
    span.textContent = '点击或拖拽图片到这里上传';

    const small = document.createElement('small');
    small.textContent = `支持 JPG、PNG、GIF，单个文件最大 ${formatFileSize(this.maxSize)}`;

    placeholder.appendChild(span);
    placeholder.appendChild(small);
    uploadArea.appendChild(input);
    uploadArea.appendChild(placeholder);

    const previewArea = document.createElement('div');
    previewArea.className = 'preview-area';

    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'upload-btn';
    uploadBtn.disabled = true;
    uploadBtn.textContent = `上传 (0/${this.maxFiles})`;

    wrapper.appendChild(uploadArea);
    wrapper.appendChild(previewArea);
    wrapper.appendChild(uploadBtn);

    this.container.appendChild(wrapper);

    this.elements = {
      input,
      uploadArea,
      previewArea,
      uploadBtn
    };
  }

  setupEventListeners() {
    const { input, uploadArea, uploadBtn } = this.elements;

    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', () => input.click());

    // 文件选择
    input.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
      input.value = '';  // 清空以便重复选择
    });

    // 拖拽上传
    setupDragAndDrop(uploadArea, (files) => {
      this.handleFiles(files.filter(f => f.type.startsWith('image/')));
    });

    // 上传按钮
    uploadBtn.addEventListener('click', () => this.upload());
  }

  async handleFiles(fileList) {
    const newFiles = Array.from(fileList);

    for (const file of newFiles) {
      if (this.files.length >= this.maxFiles) {
        alert(`最多只能上传 ${this.maxFiles} 个文件`);
        break;
      }

      if (file.size > this.maxSize) {
        alert(`${file.name} 超过大小限制`);
        continue;
      }

      if (!file.type.startsWith('image/')) {
        continue;
      }

      await this.addFile(file);
    }

    this.updateUI();
  }

  async addFile(file) {
    const url = this.urlManager.create(file);
    const item = {
      id: Date.now() + Math.random(),
      file,
      url,
      status: 'pending'
    };

    this.files.push(item);
    this.renderPreview(item);
  }

  renderPreview(item) {
    const div = document.createElement('div');
    div.className = 'preview-item';
    div.dataset.id = item.id;

    const img = document.createElement('img');
    img.src = item.url;
    img.alt = item.file.name;

    const infoDiv = document.createElement('div');
    infoDiv.className = 'preview-info';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = item.file.name;

    const sizeSpan = document.createElement('span');
    sizeSpan.className = 'size';
    sizeSpan.textContent = formatFileSize(item.file.size);

    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(sizeSpan);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '\u00D7';

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.width = '0%';

    div.appendChild(img);
    div.appendChild(infoDiv);
    div.appendChild(removeBtn);
    div.appendChild(progressBar);

    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeFile(item.id);
    });

    this.elements.previewArea.appendChild(div);
  }

  removeFile(id) {
    const index = this.files.findIndex(f => f.id === id);
    if (index > -1) {
      const item = this.files[index];
      this.urlManager.revoke(item.url);
      this.files.splice(index, 1);

      const element = this.elements.previewArea.querySelector(`[data-id="${id}"]`);
      if (element) {
        element.remove();
      }
    }

    this.updateUI();
  }

  updateUI() {
    const count = this.files.length;
    this.elements.uploadBtn.disabled = count === 0;
    this.elements.uploadBtn.textContent = `上传 (${count}/${this.maxFiles})`;
  }

  async upload() {
    for (const item of this.files) {
      if (item.status !== 'pending') continue;

      const element = this.elements.previewArea.querySelector(`[data-id="${item.id}"]`);
      const progressBar = element?.querySelector('.progress-bar');

      item.status = 'uploading';

      try {
        await this.onUpload(item.file, (percent) => {
          if (progressBar) {
            progressBar.style.width = `${percent}%`;
          }
        });

        item.status = 'completed';
        element?.classList.add('completed');
      } catch (error) {
        item.status = 'error';
        element?.classList.add('error');
        console.error(`上传失败: ${item.file.name}`, error);
      }
    }
  }

  destroy() {
    this.urlManager.revokeAll();
    this.files = [];
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }
}

// 使用示例
const uploader = new ImageUploader({
  container: document.getElementById('uploaderContainer'),
  maxFiles: 5,
  maxSize: 5 * 1024 * 1024,
  onUpload: async (file, onProgress) => {
    // 模拟上传
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('上传失败');
    }

    return response.json();
  }
});
```

### Excel 文件导入

```javascript
// 需要配合 SheetJS 库使用
async function importExcel(file) {
  // 动态加载 SheetJS
  if (!window.XLSX) {
    await loadScript('https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js');
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const result = {};

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    result[sheetName] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  }

  return result;
}

// 简化版：读取第一个工作表
async function importFirstSheet(file) {
  const workbooks = await importExcel(file);
  const firstSheet = Object.values(workbooks)[0];

  if (!firstSheet || firstSheet.length < 2) {
    throw new Error('表格数据为空或格式不正确');
  }

  // 第一行作为表头
  const headers = firstSheet[0];
  const rows = firstSheet.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
```

### 文件差异比较

```javascript
async function compareFiles(file1, file2) {
  const [content1, content2] = await Promise.all([
    file1.text(),
    file2.text()
  ]);

  const lines1 = content1.split('\n');
  const lines2 = content2.split('\n');

  const diff = [];
  const maxLines = Math.max(lines1.length, lines2.length);

  for (let i = 0; i < maxLines; i++) {
    const line1 = lines1[i];
    const line2 = lines2[i];

    if (line1 === line2) {
      diff.push({ type: 'same', line: i + 1, content: line1 });
    } else if (line1 === undefined) {
      diff.push({ type: 'added', line: i + 1, content: line2 });
    } else if (line2 === undefined) {
      diff.push({ type: 'removed', line: i + 1, content: line1 });
    } else {
      diff.push({ type: 'modified', line: i + 1, old: line1, new: line2 });
    }
  }

  return {
    file1: { name: file1.name, lines: lines1.length },
    file2: { name: file2.name, lines: lines2.length },
    diff,
    stats: {
      same: diff.filter(d => d.type === 'same').length,
      added: diff.filter(d => d.type === 'added').length,
      removed: diff.filter(d => d.type === 'removed').length,
      modified: diff.filter(d => d.type === 'modified').length
    }
  };
}
```

## 面试要点

### Blob 和 File 的区别是什么？

**答案**：File 继承自 Blob，增加了 `name` 和 `lastModified` 属性。File 通常来自用户文件系统，而 Blob 可以由程序创建。所有 File 对象都是 Blob，但不是所有 Blob 都是 File。

### FileReader 有哪些读取方法？各自适用于什么场景？

**答案**：
- `readAsText()`: 读取为文本，适用于文本文件
- `readAsDataURL()`: 读取为 Base64 编码的 Data URL，适用于图片预览
- `readAsArrayBuffer()`: 读取为 ArrayBuffer，适用于二进制处理
- `readAsBinaryString()`: 已废弃，不推荐使用

### Data URL 和 Blob URL 有什么区别？如何选择？

**答案**：
- Data URL 是 Base64 编码的字符串，可以序列化存储，但体积增加约 37%
- Blob URL 是指向内存中 Blob 的引用，体积不变，但需要手动释放内存
- 需要持久化存储选 Data URL，临时使用选 Blob URL

### 如何实现大文件的分片上传？

**答案**：使用 `Blob.slice()` 将文件分成多个片段，依次或并发上传，服务端合并。需要处理断点续传、片段校验、上传进度等问题。

### 如何检测文件的真实类型？

**答案**：不能仅依赖 `file.type` 或扩展名，应读取文件头部的魔数（Magic Number）进行判断。例如 JPEG 文件以 `FF D8 FF` 开头，PNG 以 `89 50 4E 47` 开头。

### 在处理文件时如何防止内存泄漏？

**答案**：
- 及时调用 `URL.revokeObjectURL()` 释放 Blob URL
- 不要保留不必要的文件引用
- 使用完 FileReader 后将其置为 null
- 对于大文件采用分片处理而非一次性读入内存

### 拖拽上传需要处理哪些事件？

**答案**：需要处理 `dragenter`、`dragover`、`dragleave`、`drop` 四个事件，且必须在 `dragover` 和 `drop` 事件中调用 `preventDefault()` 阻止默认行为，否则浏览器会直接打开文件。

### FileReader 是同步还是异步的？为什么？

**答案**：FileReader 是异步的，使用事件驱动模型。这是因为文件读取可能耗时较长，如果同步执行会阻塞主线程，导致页面无响应。异步读取可以保持 UI 响应性，并支持进度事件。

## 延伸阅读

### 官方文档

- [MDN - File API](https://developer.mozilla.org/zh-CN/docs/Web/API/File_API)
- [MDN - Blob](https://developer.mozilla.org/zh-CN/docs/Web/API/Blob)
- [MDN - FileReader](https://developer.mozilla.org/zh-CN/docs/Web/API/FileReader)
- [MDN - 在 Web 应用中使用文件](https://developer.mozilla.org/zh-CN/docs/Web/API/File_API/Using_files_from_web_applications)
- [W3C File API 规范](https://www.w3.org/TR/FileAPI/)

### 相关技术

- [Streams API](https://developer.mozilla.org/zh-CN/docs/Web/API/Streams_API) - 流式处理大文件
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) - 现代文件系统访问
- [IndexedDB](https://developer.mozilla.org/zh-CN/docs/Web/API/IndexedDB_API) - 浏览器端存储大量结构化数据

### 实用工具库

- [FileSaver.js](https://github.com/niconi/FileSaver.js) - 客户端文件保存
- [StreamSaver.js](https://github.com/niconi/StreamSaver.js) - 流式写入大文件
- [browser-image-compression](https://github.com/niconi/browser-image-compression) - 浏览器端图片压缩
- [SheetJS](https://sheetjs.com/) - Excel 文件处理
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF 文件渲染
