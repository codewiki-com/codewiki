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
origin: old/src/content/docs/javascript/file-api.en.md
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

The File API is a set of interfaces provided by modern browsers for handling files. It enables web applications to read the contents of local files from users, obtain file metadata, and support interactive methods such as drag-and-drop uploads.

## Concept Explanation

### What is the File API

The File API is a set of JavaScript interfaces introduced in HTML5 for handling files in browsers. It allows web applications to:

- Get information about files selected by users (name, size, type, etc.)
- Read file contents (text, binary data, Data URLs, etc.)
- Handle files dragged onto the page
- Create and manipulate binary data

### Historical Background

Before the File API existed, browsers had very limited file handling capabilities. The traditional `<input type="file">` could only submit files to the server and could not directly read file contents on the client side. The introduction of the File API completely changed this situation, making pure front-end file processing possible.

### Core Object Relationships

```
Blob (Binary Large Object)
  ^
  | Inherits
  |
File (File Object)

FileList (File List) --- Contains ---> File

FileReader (File Reader) --- Reads ---> Blob / File
```

### Problems Solved

1. **Client-side file preprocessing**: Validate files, compress images, and preview content before uploading
2. **Offline file operations**: Process file data without relying on the server
3. **Enhanced user experience**: Instant preview, progress display, drag-and-drop upload
4. **Data security**: Process sensitive files without uploading them to the server

## Core Principles

### Internal Structure of Blob

Blob (Binary Large Object) is the foundation of the File API. It represents an immutable piece of raw binary data.

```javascript
// The internal structure of Blob can be understood as:
{
  size: number,        // Data size (bytes)
  type: string,        // MIME type
  [[BlobData]]: bytes  // Internal binary data (not directly accessible)
}
```

### Inheritance Relationship Between File and Blob

The File object inherits from Blob and adds file system-related properties:

```javascript
// File inherits from Blob and adds:
{
  name: string,           // File name
  lastModified: number,   // Last modified timestamp
  lastModifiedDate: Date, // Last modified date (deprecated)
  webkitRelativePath: string  // Relative path (for directory uploads)
}
```

### Asynchronous Reading Mechanism of FileReader

FileReader uses an event-driven asynchronous model to read files:

```
Start reading -> Trigger loadstart
    |
Reading -> Trigger progress (multiple times)
    |
Reading complete -> Trigger load
    |
Finally -> Trigger loadend

Error at any stage -> Trigger error
Cancel reading -> Trigger abort
```

### Memory Model

```javascript
// Memory management of Blob URLs
const blob = new Blob(['Hello']);
const url = URL.createObjectURL(blob);  // Create reference

// url points to blob data in memory
// Must be manually released, otherwise memory leak
URL.revokeObjectURL(url);  // Release reference
```

## Core Concepts

### Blob Object

Blob is a container for binary data and is the cornerstone of the File API.

#### Creating Blob

```javascript
// Create from string
const textBlob = new Blob(['Hello, World!'], { type: 'text/plain' });

// Create from array (multiple parts)
const htmlBlob = new Blob(
  ['<html>', '<body>', '<h1>Title</h1>', '</body>', '</html>'],
  { type: 'text/html' }
);

// Create from ArrayBuffer
const buffer = new ArrayBuffer(8);
const view = new Uint8Array(buffer);
view.set([72, 101, 108, 108, 111, 33, 33, 33]); // "Hello!!!"
const binaryBlob = new Blob([buffer], { type: 'application/octet-stream' });

// Create from other Blobs
const combinedBlob = new Blob([textBlob, binaryBlob]);
```

#### Blob Properties and Methods

```javascript
const blob = new Blob(['Test data'], { type: 'text/plain;charset=utf-8' });

// Properties
console.log(blob.size);  // Size in bytes
console.log(blob.type);  // MIME type

// Methods
const slicedBlob = blob.slice(0, 5, 'text/plain');  // Slice
const text = await blob.text();          // Read as text (Promise)
const buffer = await blob.arrayBuffer(); // Read as ArrayBuffer (Promise)
const stream = blob.stream();            // Get ReadableStream
```

### File Object

The File object represents a file from the user's file system and inherits from Blob.

#### Getting File Objects

```javascript
// Method 1: Through input element
const input = document.querySelector('input[type="file"]');
input.addEventListener('change', (event) => {
  const file = event.target.files[0];
  console.log(file.name);         // File name
  console.log(file.size);         // File size
  console.log(file.type);         // MIME type
  console.log(file.lastModified); // Last modified timestamp
});

// Method 2: Through drag and drop
document.addEventListener('drop', (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
});

// Method 3: Manual creation (less common)
const file = new File(['File content'], 'example.txt', {
  type: 'text/plain',
  lastModified: Date.now()
});
```

### FileList Object

FileList is an array-like object containing all files selected by the user.

```javascript
const input = document.querySelector('input[type="file"][multiple]');

input.addEventListener('change', (event) => {
  const fileList = event.target.files;

  console.log(fileList.length);  // Number of files
  console.log(fileList[0]);      // First file
  console.log(fileList.item(0)); // Same as above

  // Iterate through all files
  for (const file of fileList) {
    console.log(file.name, file.size);
  }

  // Convert to array
  const filesArray = Array.from(fileList);
  // Or
  const filesArray2 = [...fileList];
});
```

### FileReader Object

FileReader is used to asynchronously read file contents.

#### Reading Methods

```javascript
const reader = new FileReader();

// Read as text
reader.readAsText(file, 'UTF-8');

// Read as Data URL (Base64 encoded)
reader.readAsDataURL(file);

// Read as ArrayBuffer
reader.readAsArrayBuffer(file);

// Read as binary string (deprecated, not recommended)
reader.readAsBinaryString(file);

// Abort reading
reader.abort();
```

#### Event Handling

```javascript
const reader = new FileReader();

reader.onloadstart = (event) => {
  console.log('Started reading');
};

reader.onprogress = (event) => {
  if (event.lengthComputable) {
    const percent = (event.loaded / event.total) * 100;
    console.log(`Reading progress: ${percent.toFixed(2)}%`);
  }
};

reader.onload = (event) => {
  console.log('Reading complete');
  console.log(event.target.result);  // Reading result
};

reader.onerror = (event) => {
  console.error('Reading error:', event.target.error);
};

reader.onabort = () => {
  console.log('Reading cancelled');
};

reader.onloadend = () => {
  console.log('Reading ended (regardless of success or failure)');
};

reader.readAsText(file);
```

## Code Examples

### Basic File Selection and Information Display

```javascript
function setupFileInput() {
  const input = document.getElementById('fileInput');
  const info = document.getElementById('fileInfo');

  input.addEventListener('change', (event) => {
    const files = event.target.files;

    if (files.length === 0) {
      info.textContent = 'No file selected';
      return;
    }

    // Create table to display file information
    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    ['File Name', 'Size', 'Type', 'Modified Time'].forEach(text => {
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
        file.type || 'Unknown',
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

### Reading Text Files

```javascript
async function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      resolve(event.target.result);
    };

    reader.onerror = (event) => {
      reject(new Error('File reading failed: ' + event.target.error.message));
    };

    reader.readAsText(file, 'UTF-8');
  });
}

// Using modern API (if Blob.text() is available)
async function readTextFileModern(file) {
  try {
    return await file.text();
  } catch (error) {
    throw new Error('File reading failed: ' + error.message);
  }
}

// Usage example
document.getElementById('textFileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  try {
    const content = await readTextFile(file);
    document.getElementById('textContent').textContent = content;
  } catch (error) {
    console.error(error);
    alert('Failed to read file');
  }
});
```

### Image Preview

```javascript
function createImagePreview(file) {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file'));
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
        reject(new Error('Image loading failed'));
      };
    };

    reader.onerror = () => {
      reject(new Error('File reading failed'));
    };

    reader.readAsDataURL(file);
  });
}

// Alternative using Blob URL (more efficient)
function createImagePreviewWithBlobUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file'));
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
        // Provide cleanup function
        revoke: () => URL.revokeObjectURL(url)
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image loading failed'));
    };

    img.src = url;
  });
}

// Batch image preview
async function previewImages(fileList, container) {
  // Clear container
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
      console.warn(`Skipping file ${file.name}: ${error.message}`);
    }
  }
}
```

### Drag and Drop File Upload

```javascript
function setupDragAndDrop(dropZone, onFilesDropped) {
  // Prevent default behavior
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  // Add highlight style when dragging over
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add('drag-over');
    });
  });

  // Remove highlight style when leaving or dropping
  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('drag-over');
    });
  });

  // Handle file drop
  dropZone.addEventListener('drop', (event) => {
    const files = event.dataTransfer.files;

    if (files.length > 0) {
      onFilesDropped(Array.from(files));
    }
  });
}

// Usage example
const dropZone = document.getElementById('dropZone');

setupDragAndDrop(dropZone, (files) => {
  console.log('Files received:');
  files.forEach(file => {
    console.log(`- ${file.name} (${formatFileSize(file.size)})`);
  });
});
```

### Reading JSON Files

```javascript
async function readJsonFile(file) {
  // Validate file type
  if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
    throw new Error('Please select a JSON file');
  }

  const text = await file.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('JSON parsing failed: ' + error.message);
  }
}

// JSON reading with validation
async function readAndValidateJson(file, schema) {
  const data = await readJsonFile(file);

  // Simple schema validation
  for (const [key, type] of Object.entries(schema)) {
    if (typeof data[key] !== type) {
      throw new Error(`Field "${key}" has wrong type, expected ${type}`);
    }
  }

  return data;
}

// Usage example
document.getElementById('jsonInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];

  try {
    const data = await readAndValidateJson(file, {
      name: 'string',
      age: 'number'
    });
    console.log('Parsing successful:', data);
  } catch (error) {
    console.error('Parsing failed:', error.message);
  }
});
```

### Reading Large Files in Chunks

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

  // Merge all chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let position = 0;

  for (const chunk of chunks) {
    result.set(chunk, position);
    position += chunk.length;
  }

  return result;
}

// Usage example
async function processLargeFile(file) {
  const progressBar = document.getElementById('progressBar');

  try {
    const data = await readFileInChunks(file, 1024 * 1024, (progress) => {
      progressBar.style.width = `${progress.percent}%`;
      progressBar.textContent = `${progress.percent.toFixed(1)}%`;
    });

    console.log(`File reading complete, ${data.length} bytes total`);
    return data;
  } catch (error) {
    console.error('File reading failed:', error);
  }
}
```

### File Download Generation

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

  // Delay releasing URL to ensure download starts
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

// Download text file
function downloadText(text, filename, mimeType = 'text/plain') {
  const blob = new Blob([text], { type: mimeType });
  downloadBlob(blob, filename);
}

// Download JSON file
function downloadJson(data, filename) {
  const json = JSON.stringify(data, null, 2);
  downloadText(json, filename, 'application/json');
}

// Download CSV file
function downloadCsv(rows, filename) {
  const csv = rows.map(row =>
    row.map(cell => {
      // Handle cells containing commas or quotes
      if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')
  ).join('\n');

  // Add BOM for Excel to correctly recognize UTF-8
  const bom = '\uFEFF';
  downloadText(bom + csv, filename, 'text/csv;charset=utf-8');
}

// Usage examples
downloadJson({ name: 'John', age: 25 }, 'user.json');

downloadCsv([
  ['Name', 'Age', 'City'],
  ['John', 25, 'Beijing'],
  ['Jane', 30, 'Shanghai']
], 'users.csv');
```

### File Type Detection

```javascript
// Detect actual file type through file header (Magic Number)
async function detectFileType(file) {
  const signatures = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46], null, null, null, [0x57, 0x45, 0x42, 0x50]],
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
    'application/zip': [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]],
  };

  // Read file header
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

  // Unrecognized, return declared type or unknown
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

// Usage example
document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];

  const declaredType = file.type;
  const actualType = await detectFileType(file);

  console.log(`Declared type: ${declaredType}`);
  console.log(`Actual type: ${actualType}`);

  if (declaredType !== actualType) {
    console.warn('File type mismatch, possibly a fake file extension');
  }
});
```

## Best Practices

### File Validation

```javascript
class FileValidator {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // Default 10MB
    this.allowedTypes = options.allowedTypes || [];
    this.allowedExtensions = options.allowedExtensions || [];
  }

  validate(file) {
    const errors = [];

    // Check file size
    if (file.size > this.maxSize) {
      errors.push(`File size exceeds limit (max ${formatFileSize(this.maxSize)})`);
    }

    // Check MIME type
    if (this.allowedTypes.length > 0) {
      const typeMatch = this.allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      });

      if (!typeMatch) {
        errors.push(`Unsupported file type: ${file.type || 'Unknown'}`);
      }
    }

    // Check file extension
    if (this.allowedExtensions.length > 0) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!this.allowedExtensions.includes(ext)) {
        errors.push(`Unsupported file extension: .${ext}`);
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

// Usage example
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

### Unified File Reading Interface

```javascript
class FileReaderService {
  static readAsText(file, encoding = 'UTF-8') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Reading failed: ${reader.error?.message}`));
      reader.readAsText(file, encoding);
    });
  }

  static readAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Reading failed: ${reader.error?.message}`));
      reader.readAsDataURL(file);
    });
  }

  static readAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error(`Reading failed: ${reader.error?.message}`));
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
      reader.onerror = () => reject(new Error(`Reading failed: ${reader.error?.message}`));

      reader[method](file);
    });
  }
}

// Usage example
async function processFile(file) {
  try {
    const content = await FileReaderService.readWithProgress(
      file,
      'readAsText',
      (progress) => console.log(`Progress: ${progress.percent.toFixed(1)}%`)
    );

    console.log('File content:', content);
  } catch (error) {
    console.error('Reading failed:', error);
  }
}
```

### Memory Management

```javascript
// Blob URL Manager
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

// Usage example
const urlManager = new BlobUrlManager();

function previewImage(file) {
  const url = urlManager.create(file);
  const img = document.createElement('img');
  img.src = url;

  // Can choose to release URL after image loads
  img.onload = () => {
    // If you don't need to use this URL again, you can release it immediately
    // urlManager.revoke(url);
  };

  return img;
}

// Clean up all URLs when page unloads
window.addEventListener('unload', () => {
  urlManager.revokeAll();
});
```

### Error Handling

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
      error.message || 'File reading error',
      file
    );
  }
}

// File reading with retry
async function readFileWithRetry(file, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await FileReaderService.readAsText(file);
    } catch (error) {
      lastError = error;
      console.warn(`Reading failed, attempt ${attempt}/${maxRetries}`);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError;
}
```

## Common Pitfalls

### Blob URL Memory Leak

```javascript
// Bad example: Never releasing URL after creation
function badPreview(file) {
  const url = URL.createObjectURL(file);  // Memory leak!
  const img = document.createElement('img');
  img.src = url;
  return img;
}

// Good example: Release after use
function goodPreview(file) {
  const url = URL.createObjectURL(file);
  const img = document.createElement('img');

  img.onload = () => {
    URL.revokeObjectURL(url);  // Release after loading
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);  // Also release on error
  };

  img.src = url;
  return img;
}
```

### FileList is Not a Real Array

```javascript
const input = document.getElementById('fileInput');
const files = input.files;

// Wrong: FileList doesn't have array methods
// files.forEach(file => {});  // TypeError!
// files.map(file => file.name);  // TypeError!

// Correct: Convert to array first
Array.from(files).forEach(file => {});
[...files].map(file => file.name);

// Or use for...of
for (const file of files) {
  console.log(file.name);
}
```

### Order Issues with Asynchronous Reading

```javascript
// Bad example: Reading order is uncertain
function badReadMultiple(files) {
  const results = [];

  for (const file of files) {
    const reader = new FileReader();
    reader.onload = () => {
      results.push(reader.result);  // Order is uncertain!
    };
    reader.readAsText(file);
  }

  return results;  // Might still be empty when returned!
}

// Good example: Use Promise.all to maintain order
async function goodReadMultiple(files) {
  const promises = Array.from(files).map(file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  });

  return Promise.all(promises);  // Maintains original order
}
```

### Ignoring File Size Check

```javascript
// Bad example: Reading files of any size directly
function badRead(file) {
  const reader = new FileReader();
  reader.readAsText(file);  // What if it's a 2GB file?
}

// Good example: Check file size first
function goodRead(file, maxSize = 50 * 1024 * 1024) {
  if (file.size > maxSize) {
    throw new Error(`File too large, max supported ${formatFileSize(maxSize)}`);
  }

  return FileReaderService.readAsText(file);
}

// For large files, use chunked reading
async function readLargeFile(file) {
  if (file.size > 100 * 1024 * 1024) {  // 100MB
    return readFileInChunks(file, 10 * 1024 * 1024);  // 10MB per chunk
  }
  return file.arrayBuffer();
}
```

### Trusting Client File Type

```javascript
// Bad example: Only checking MIME type
function badValidate(file) {
  if (file.type === 'image/jpeg') {
    // Attackers can modify extension, type may be inaccurate
    processImage(file);
  }
}

// Good example: Validate file content
async function goodValidate(file) {
  // 1. Check declared type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file');
  }

  // 2. Verify actual file type
  const actualType = await detectFileType(file);
  if (!actualType.startsWith('image/')) {
    throw new Error('File content does not match type');
  }

  processImage(file);
}
```

### Cross-Browser Compatibility Issues

```javascript
// Check File API support
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

// Compatible Blob.slice
function sliceBlob(blob, start, end, type) {
  if (blob.slice) {
    return blob.slice(start, end, type);
  } else if (blob.webkitSlice) {
    return blob.webkitSlice(start, end, type);
  } else if (blob.mozSlice) {
    return blob.mozSlice(start, end, type);
  }
  throw new Error('Blob.slice is not supported');
}
```

## Performance Considerations

### Data URL vs Blob URL

| Feature | Data URL | Blob URL |
|---------|----------|----------|
| Generation speed | Slow (requires Base64 encoding) | Fast (only creates reference) |
| Memory usage | About 1.37x original size | Same as original size |
| Serializable | Can be stored as string | Not serializable |
| Lifecycle | Permanently valid | Needs manual management |

```javascript
// Performance test
async function comparePerformance(file) {
  // Data URL
  console.time('Data URL');
  const dataUrl = await FileReaderService.readAsDataURL(file);
  console.timeEnd('Data URL');
  console.log(`Data URL length: ${dataUrl.length}`);

  // Blob URL
  console.time('Blob URL');
  const blobUrl = URL.createObjectURL(file);
  console.timeEnd('Blob URL');
  console.log(`Blob URL length: ${blobUrl.length}`);

  URL.revokeObjectURL(blobUrl);
}
```

### Large File Processing Strategies

```javascript
// Process large files using Web Worker
function processInWorker(file) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('file-processor.js');

    worker.onmessage = (event) => {
      if (event.data.type === 'progress') {
        console.log(`Progress: ${event.data.percent}%`);
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

    // Process data chunk...

    offset += chunkSize;
    self.postMessage({
      type: 'progress',
      percent: (offset / file.size) * 100
    });
  }

  self.postMessage({
    type: 'complete',
    result: 'Processing complete'
  });
};
*/
```

### Image Compression Optimization

```javascript
function compressImage(file, maxWidth = 1920, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      // Create Canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            reject(new Error('Compression failed'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image loading failed'));
    };

    img.src = url;
  });
}

// Smart compression: Adjust quality based on original size
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

### Batch File Processing

```javascript
// Batch processing with concurrency control
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

// Usage example
const files = document.getElementById('multiInput').files;

processBatch(Array.from(files), async (file) => {
  const compressed = await smartCompress(file);
  console.log(`${file.name}: ${formatFileSize(file.size)} -> ${formatFileSize(compressed.size)}`);
  return compressed;
}, 3);
```

## Practical Scenarios

### Complete Image Upload Component

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
    // Create upload area structure
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
    span.textContent = 'Click or drag images here to upload';

    const small = document.createElement('small');
    small.textContent = `Supports JPG, PNG, GIF, max ${formatFileSize(this.maxSize)} per file`;

    placeholder.appendChild(span);
    placeholder.appendChild(small);
    uploadArea.appendChild(input);
    uploadArea.appendChild(placeholder);

    const previewArea = document.createElement('div');
    previewArea.className = 'preview-area';

    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'upload-btn';
    uploadBtn.disabled = true;
    uploadBtn.textContent = `Upload (0/${this.maxFiles})`;

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

    // Click upload area to trigger file selection
    uploadArea.addEventListener('click', () => input.click());

    // File selection
    input.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
      input.value = '';  // Clear to allow repeated selection
    });

    // Drag and drop upload
    setupDragAndDrop(uploadArea, (files) => {
      this.handleFiles(files.filter(f => f.type.startsWith('image/')));
    });

    // Upload button
    uploadBtn.addEventListener('click', () => this.upload());
  }

  async handleFiles(fileList) {
    const newFiles = Array.from(fileList);

    for (const file of newFiles) {
      if (this.files.length >= this.maxFiles) {
        alert(`Maximum ${this.maxFiles} files allowed`);
        break;
      }

      if (file.size > this.maxSize) {
        alert(`${file.name} exceeds size limit`);
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
    this.elements.uploadBtn.textContent = `Upload (${count}/${this.maxFiles})`;
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
        console.error(`Upload failed: ${item.file.name}`, error);
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

// Usage example
const uploader = new ImageUploader({
  container: document.getElementById('uploaderContainer'),
  maxFiles: 5,
  maxSize: 5 * 1024 * 1024,
  onUpload: async (file, onProgress) => {
    // Simulated upload
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }
});
```

### Excel File Import

```javascript
// Requires SheetJS library
async function importExcel(file) {
  // Dynamically load SheetJS
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

// Simplified version: Read first worksheet
async function importFirstSheet(file) {
  const workbooks = await importExcel(file);
  const firstSheet = Object.values(workbooks)[0];

  if (!firstSheet || firstSheet.length < 2) {
    throw new Error('Spreadsheet is empty or format is incorrect');
  }

  // First row as headers
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

### File Diff Comparison

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

## Interview Key Points

### What is the difference between Blob and File?

**Answer**: File inherits from Blob and adds `name` and `lastModified` properties. File typically comes from the user's file system, while Blob can be created programmatically. All File objects are Blobs, but not all Blobs are Files.

### What reading methods does FileReader have? What scenarios are they suitable for?

**Answer**:
- `readAsText()`: Read as text, suitable for text files
- `readAsDataURL()`: Read as Base64 encoded Data URL, suitable for image preview
- `readAsArrayBuffer()`: Read as ArrayBuffer, suitable for binary processing
- `readAsBinaryString()`: Deprecated, not recommended

### What is the difference between Data URL and Blob URL? How to choose?

**Answer**:
- Data URL is a Base64 encoded string that can be serialized and stored, but increases size by about 37%
- Blob URL is a reference to a Blob in memory, size unchanged, but requires manual memory release
- Choose Data URL for persistent storage, Blob URL for temporary use

### How to implement chunked upload for large files?

**Answer**: Use `Blob.slice()` to split the file into multiple chunks, upload them sequentially or in parallel, and have the server merge them. Need to handle resumable uploads, chunk verification, upload progress, and other issues.

### How to detect the actual type of a file?

**Answer**: Cannot rely solely on `file.type` or extension. Should read the Magic Number from the file header to determine. For example, JPEG files start with `FF D8 FF`, PNG starts with `89 50 4E 47`.

### How to prevent memory leaks when handling files?

**Answer**:
- Call `URL.revokeObjectURL()` promptly to release Blob URLs
- Don't keep unnecessary file references
- Set FileReader to null after use
- Use chunked processing for large files instead of loading everything into memory at once

### What events need to be handled for drag-and-drop upload?

**Answer**: Need to handle four events: `dragenter`, `dragover`, `dragleave`, `drop`, and must call `preventDefault()` in the `dragover` and `drop` events to prevent default behavior, otherwise the browser will open the file directly.

### Is FileReader synchronous or asynchronous? Why?

**Answer**: FileReader is asynchronous and uses an event-driven model. This is because file reading can be time-consuming, and synchronous execution would block the main thread, causing the page to become unresponsive. Asynchronous reading maintains UI responsiveness and supports progress events.

## Further Reading

### Official Documentation

- [MDN - File API](https://developer.mozilla.org/en-US/docs/Web/API/File_API)
- [MDN - Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob)
- [MDN - FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader)
- [MDN - Using files from web applications](https://developer.mozilla.org/en-US/docs/Web/API/File_API/Using_files_from_web_applications)
- [W3C File API Specification](https://www.w3.org/TR/FileAPI/)

### Related Technologies

- [Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API) - Stream processing for large files
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) - Modern file system access
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) - Browser-side storage for large amounts of structured data

### Useful Libraries

- [FileSaver.js](https://github.com/niconi/FileSaver.js) - Client-side file saving
- [StreamSaver.js](https://github.com/niconi/StreamSaver.js) - Streaming writes for large files
- [browser-image-compression](https://github.com/niconi/browser-image-compression) - Browser-side image compression
- [SheetJS](https://sheetjs.com/) - Excel file processing
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF file rendering
