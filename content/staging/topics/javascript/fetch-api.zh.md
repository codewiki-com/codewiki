---
title: Fetch API
description: JavaScript Fetch API 完整指南，包括 HTTP 请求、响应处理和错误处理
track: javascript
section: browser
difficulty: intermediate
tags:
  - JavaScript
  - Fetch
  - HTTP
  - API
status: imported
origin: old/src/content/docs/javascript/fetch-api.zh.md
divergence: 0.225
issues:
  - title-lang-zh
  - title-language
legacy:
  category: JavaScript
  subcategory: Browser APIs
  order: 16
  lastUpdated: 2026-01-07
---

Fetch API 是用于发起 HTTP 请求的现代 JavaScript 接口。它提供了比 XMLHttpRequest 更强大、更灵活的替代方案，使用 Promise 以更简洁、更易读的方式处理异步操作。

## Fetch 简介

Fetch API 内置于现代浏览器中，提供全局 `fetch()` 函数用于发起网络请求。它返回一个 Promise，该 Promise 解析为表示请求响应的 Response 对象。

### 基本语法

```javascript
fetch(url)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('错误:', error));

// 使用 async/await
async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('错误:', error);
  }
}
```

### 简单 GET 请求

```javascript
// 获取 JSON 数据
fetch('https://api.example.com/users')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP 错误！状态码: ${response.status}`);
    }
    return response.json();
  })
  .then(users => {
    console.log('用户:', users);
  })
  .catch(error => {
    console.error('Fetch 失败:', error);
  });
```

## fetch() 函数

`fetch()` 函数接受两个参数：资源 URL 和包含请求设置的可选 init 对象。

### 函数签名

```javascript
fetch(resource, options)
```

- **resource**：字符串 URL 或 Request 对象
- **options**：包含请求设置的可选对象

### 请求选项

```javascript
fetch('https://api.example.com/data', {
  method: 'POST',                    // HTTP 方法
  headers: {                         // 请求头
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token123'
  },
  body: JSON.stringify({ key: 'value' }),  // 请求体
  mode: 'cors',                      // CORS 模式
  credentials: 'include',            // Cookie 处理
  cache: 'no-cache',                 // 缓存模式
  redirect: 'follow',                // 重定向处理
  referrer: 'no-referrer',          // Referrer 策略
  signal: abortController.signal     // AbortController 信号
});
```

### HTTP 方法

```javascript
// GET 请求（默认）
fetch('https://api.example.com/users');

// POST 请求
fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});

// PUT 请求
fetch('https://api.example.com/users/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John Updated' })
});

// PATCH 请求
fetch('https://api.example.com/users/1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'newemail@example.com' })
});

// DELETE 请求
fetch('https://api.example.com/users/1', {
  method: 'DELETE'
});
```

## Request 对象

Request 对象表示资源请求。您可以直接创建 Request 对象并将其传递给 `fetch()`。

### 创建请求

```javascript
// 创建请求对象
const request = new Request('https://api.example.com/data', {
  method: 'POST',
  headers: new Headers({
    'Content-Type': 'application/json'
  }),
  body: JSON.stringify({ key: 'value' })
});

// 将请求与 fetch 一起使用
fetch(request)
  .then(response => response.json())
  .then(data => console.log(data));
```

### 请求属性

```javascript
const request = new Request('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'John' })
});

console.log(request.url);        // "https://api.example.com/users"
console.log(request.method);     // "POST"
console.log(request.headers);    // Headers 对象
console.log(request.mode);       // "cors"
console.log(request.credentials); // "same-origin"
console.log(request.cache);      // "default"
console.log(request.redirect);   // "follow"
console.log(request.referrer);   // "about:client"
console.log(request.bodyUsed);   // false
```

### 克隆请求

```javascript
const originalRequest = new Request('https://api.example.com/data', {
  method: 'POST',
  body: JSON.stringify({ data: 'original' })
});

// 克隆请求
const clonedRequest = originalRequest.clone();

// 现在可以使用两个请求
fetch(originalRequest).then(/* ... */);
fetch(clonedRequest).then(/* ... */);
```

## Response 对象

Response 对象表示请求的响应。它包含响应状态、头部和正文。

### 响应属性

```javascript
fetch('https://api.example.com/users')
  .then(response => {
    // 状态属性
    console.log(response.status);      // 200
    console.log(response.statusText);  // "OK"
    console.log(response.ok);          // true（状态 200-299）

    // 响应元数据
    console.log(response.url);         // 重定向后的最终 URL
    console.log(response.type);        // "basic", "cors", "opaque" 等
    console.log(response.redirected);  // 如果重定向则为 true
    console.log(response.headers);     // Headers 对象

    // 正文状态
    console.log(response.bodyUsed);    // 初始为 false

    return response.json();
  });
```

### 响应正文方法

Response 对象提供多种方法以不同格式提取正文内容。

```javascript
// 解析为 JSON
fetch('https://api.example.com/data.json')
  .then(response => response.json())
  .then(data => console.log(data));

// 解析为文本
fetch('https://example.com/page.html')
  .then(response => response.text())
  .then(html => console.log(html));

// 解析为 Blob（二进制数据）
fetch('https://example.com/image.png')
  .then(response => response.blob())
  .then(blob => {
    const imageUrl = URL.createObjectURL(blob);
    document.getElementById('image').src = imageUrl;
  });

// 解析为 ArrayBuffer
fetch('https://example.com/file.bin')
  .then(response => response.arrayBuffer())
  .then(buffer => {
    const view = new Uint8Array(buffer);
    console.log(view);
  });

// 解析为 FormData
fetch('https://api.example.com/form-data')
  .then(response => response.formData())
  .then(formData => {
    for (const [key, value] of formData) {
      console.log(key, value);
    }
  });
```

### 克隆响应

```javascript
fetch('https://api.example.com/data')
  .then(response => {
    // 在消费正文之前克隆响应
    const clonedResponse = response.clone();

    // 处理原始响应
    response.json().then(data => {
      console.log('原始:', data);
    });

    // 处理克隆的响应
    clonedResponse.text().then(text => {
      console.log('克隆为文本:', text);
    });
  });
```

## 处理 Headers

Headers 对象提供操作 HTTP 头的方法。

### 创建和修改 Headers

```javascript
// 从对象创建 headers
const headers = new Headers({
  'Content-Type': 'application/json',
  'X-Custom-Header': 'custom-value'
});

// 创建空 headers 并添加值
const headers2 = new Headers();
headers2.append('Content-Type', 'application/json');
headers2.append('Accept', 'application/json');

// 设置 header（如果存在则替换）
headers2.set('Authorization', 'Bearer token123');

// 获取 header 值
console.log(headers2.get('Content-Type')); // "application/json"

// 检查 header 是否存在
console.log(headers2.has('Authorization')); // true

// 删除 header
headers2.delete('X-Custom-Header');

// 遍历 headers
for (const [name, value] of headers2) {
  console.log(`${name}: ${value}`);
}
```

### 常见 Header 模式

```javascript
// JSON API 请求
const jsonHeaders = new Headers({
  'Content-Type': 'application/json',
  'Accept': 'application/json'
});

// 表单提交
const formHeaders = new Headers({
  'Content-Type': 'application/x-www-form-urlencoded'
});

// 文件上传（让浏览器设置带 boundary 的 Content-Type）
const uploadHeaders = new Headers({
  'Authorization': 'Bearer token123'
});
// 不要为 FormData 设置 Content-Type - 浏览器会处理

// 认证 headers
const authHeaders = new Headers({
  'Authorization': 'Bearer ' + accessToken,
  'X-API-Key': apiKey
});
```

## 请求正文类型

Fetch API 支持多种正文类型来发送数据。

### JSON 正文

```javascript
fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  })
});
```

### FormData 正文

```javascript
// 从表单元素创建 FormData
const form = document.querySelector('form');
const formData = new FormData(form);

fetch('https://api.example.com/submit', {
  method: 'POST',
  body: formData  // 不需要 Content-Type header
});

// 程序化创建 FormData
const data = new FormData();
data.append('username', 'john');
data.append('email', 'john@example.com');
data.append('avatar', fileInput.files[0]);

fetch('https://api.example.com/profile', {
  method: 'POST',
  body: data
});
```

### URL 编码正文

```javascript
const params = new URLSearchParams();
params.append('username', 'john');
params.append('password', 'secret123');

fetch('https://api.example.com/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: params
});

// 或使用字符串
fetch('https://api.example.com/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'username=john&password=secret123'
});
```

## 错误处理

使用 Fetch API 时，正确的错误处理至关重要。注意 fetch 只在网络错误时拒绝，不会在 HTTP 错误状态码时拒绝。

### 理解 Fetch 错误行为

```javascript
// fetch() 不会因 HTTP 错误状态（4xx, 5xx）而拒绝
fetch('https://api.example.com/not-found')  // 返回 404
  .then(response => {
    // 这仍然执行！response.ok 将为 false
    console.log(response.status); // 404
    console.log(response.ok);     // false
  });

// 网络错误会导致拒绝
fetch('https://invalid-domain-12345.com/')
  .catch(error => {
    console.log('网络错误:', error); // TypeError: Failed to fetch
  });
```

### 正确的错误处理模式

```javascript
async function fetchWithErrorHandling(url) {
  try {
    const response = await fetch(url);

    // 检查 HTTP 错误
    if (!response.ok) {
      // 尝试从响应中提取错误消息
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || `HTTP ${response.status}`;
      } catch {
        errorMessage = `HTTP 错误！状态码: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    // 处理网络错误和 HTTP 错误
    if (error.name === 'TypeError') {
      // 网络错误
      throw new Error('网络错误：请检查您的连接');
    }
    throw error;
  }
}

// 使用
try {
  const data = await fetchWithErrorHandling('https://api.example.com/users');
  console.log(data);
} catch (error) {
  console.error('请求失败:', error.message);
}
```

### 自定义错误类

```javascript
class FetchError extends Error {
  constructor(message, status, statusText, response) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.statusText = statusText;
    this.response = response;
  }
}

class NetworkError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'NetworkError';
    this.originalError = originalError;
  }
}

async function fetchJSON(url, options = {}) {
  let response;

  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new NetworkError('获取资源失败', error);
  }

  if (!response.ok) {
    let errorBody;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    throw new FetchError(
      errorBody.message || `HTTP ${response.status}`,
      response.status,
      response.statusText,
      errorBody
    );
  }

  return response.json();
}

// 带特定错误处理的使用
async function getUser(id) {
  try {
    return await fetchJSON(`https://api.example.com/users/${id}`);
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error('网络问题:', error.message);
    } else if (error instanceof FetchError) {
      if (error.status === 404) {
        console.error('未找到用户');
      } else if (error.status === 401) {
        console.error('未授权');
      } else {
        console.error(`服务器错误: ${error.status}`);
      }
    }
    throw error;
  }
}
```

### 失败重试

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        // 不重试客户端错误（4xx）
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`客户端错误: ${response.status}`);
        }
        // 重试服务器错误（5xx）
        throw new Error(`服务器错误: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error;
      console.log(`第 ${attempt} 次尝试失败: ${error.message}`);

      if (attempt < maxRetries) {
        // 指数退避
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`${maxRetries} 次尝试后失败: ${lastError.message}`);
}
```

## AbortController

AbortController 允许您取消 fetch 请求。这对于防止内存泄漏和不必要的网络流量至关重要。

### 基本取消

```javascript
const controller = new AbortController();
const signal = controller.signal;

fetch('https://api.example.com/large-data', { signal })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => {
    if (error.name === 'AbortError') {
      console.log('请求已取消');
    } else {
      console.error('Fetch 错误:', error);
    }
  });

// 2 秒后取消请求
setTimeout(() => {
  controller.abort();
}, 2000);
```

### 超时实现

```javascript
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`请求在 ${timeout}ms 后超时`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// 使用
try {
  const response = await fetchWithTimeout(
    'https://api.example.com/data',
    {},
    3000  // 3 秒超时
  );
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error(error.message);
}
```

### 取消多个请求

```javascript
const controller = new AbortController();

// 使用相同信号启动多个请求
const requests = [
  fetch('https://api.example.com/users', { signal: controller.signal }),
  fetch('https://api.example.com/posts', { signal: controller.signal }),
  fetch('https://api.example.com/comments', { signal: controller.signal })
];

// 取消所有请求
controller.abort();

// 处理取消
Promise.allSettled(requests).then(results => {
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.log(`请求 ${index + 1} 已取消:`, result.reason.name);
    }
  });
});
```

### React Hook 示例

```javascript
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        setData(json);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // 清理：在卸载或 URL 更改时中止 fetch
    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}

// 使用
function UserProfile({ userId }) {
  const { data, loading, error } = useFetch(
    `https://api.example.com/users/${userId}`
  );

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;
  return <div>{data.name}</div>;
}
```

### AbortSignal.timeout()

现代浏览器支持 `AbortSignal.timeout()` 以更简单地处理超时。

```javascript
// 使用 AbortSignal.timeout() 的简单超时
try {
  const response = await fetch('https://api.example.com/data', {
    signal: AbortSignal.timeout(5000)  // 5 秒超时
  });
  const data = await response.json();
  console.log(data);
} catch (error) {
  if (error.name === 'TimeoutError') {
    console.error('请求超时');
  } else if (error.name === 'AbortError') {
    console.error('请求被中止');
  } else {
    console.error('Fetch 错误:', error);
  }
}

// 将超时与手动中止组合
const controller = new AbortController();
const timeoutSignal = AbortSignal.timeout(5000);

// 当任一信号触发时中止
const combinedSignal = AbortSignal.any([
  controller.signal,
  timeoutSignal
]);

fetch('https://api.example.com/data', { signal: combinedSignal });

// 手动中止仍然有效
controller.abort();
```

## CORS（跨源资源共享）

Fetch API 遵循 CORS 策略。理解 CORS 模式对于进行跨源请求很重要。

### CORS 模式

```javascript
// cors（默认）- 允许带 CORS 头的跨源请求
fetch('https://api.example.com/data', {
  mode: 'cors'
});

// same-origin - 只允许同源请求
fetch('/api/data', {
  mode: 'same-origin'
});

// no-cors - 有限的跨源请求（不透明响应）
fetch('https://other-domain.com/data', {
  mode: 'no-cors'
});
```

### 凭证模式

```javascript
// same-origin（默认）- 仅为同源请求发送凭证
fetch('https://api.example.com/data', {
  credentials: 'same-origin'
});

// include - 为跨源请求发送凭证
fetch('https://api.example.com/data', {
  credentials: 'include'
});

// omit - 从不发送凭证
fetch('https://api.example.com/data', {
  credentials: 'omit'
});
```

## 流式响应

Fetch API 支持流式处理以高效处理大型响应。

### 读取流

```javascript
async function streamResponse(url) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let result = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    // 解码块并处理
    const chunk = decoder.decode(value, { stream: true });
    result += chunk;
    console.log('收到块:', chunk.length, '字节');
  }

  return result;
}
```

### 进度跟踪

```javascript
async function fetchWithProgress(url, onProgress) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentLength = response.headers.get('Content-Length');
  const total = parseInt(contentLength, 10);
  let loaded = 0;

  const reader = response.body.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
    loaded += value.length;

    if (total) {
      const progress = (loaded / total) * 100;
      onProgress(progress, loaded, total);
    }
  }

  // 合并块
  const allChunks = new Uint8Array(loaded);
  let position = 0;
  for (const chunk of chunks) {
    allChunks.set(chunk, position);
    position += chunk.length;
  }

  return new TextDecoder().decode(allChunks);
}

// 使用
const data = await fetchWithProgress(
  'https://example.com/large-file.json',
  (progress, loaded, total) => {
    console.log(`进度: ${progress.toFixed(2)}% (${loaded}/${total})`);
  }
);
```

## 实际示例

### 构建 REST API 客户端

```javascript
class APIClient {
  constructor(baseURL, defaultHeaders = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers
      }
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    // 处理空响应
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// 使用
const api = new APIClient('https://api.example.com', {
  'Authorization': 'Bearer token123'
});

// GET 请求
const users = await api.get('/users');

// POST 请求
const newUser = await api.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT 请求
const updatedUser = await api.put('/users/1', {
  name: 'John Updated'
});

// DELETE 请求
await api.delete('/users/1');
```

### 带进度的文件下载

```javascript
async function downloadFile(url, filename, onProgress) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentLength = response.headers.get('Content-Length');
  const total = parseInt(contentLength, 10);
  let loaded = 0;

  const reader = response.body.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    chunks.push(value);
    loaded += value.length;

    if (onProgress && total) {
      onProgress({ loaded, total, progress: (loaded / total) * 100 });
    }
  }

  // 从块创建 blob
  const blob = new Blob(chunks);

  // 创建下载链接
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);

  return blob;
}

// 使用
await downloadFile(
  'https://example.com/files/document.pdf',
  'document.pdf',
  ({ progress }) => console.log(`下载: ${progress.toFixed(2)}%`)
);
```

### 带速率限制的并行请求

```javascript
async function fetchWithRateLimit(urls, maxConcurrent = 3) {
  const results = [];
  const executing = new Set();

  for (const url of urls) {
    const promise = fetch(url)
      .then(response => response.json())
      .then(data => {
        executing.delete(promise);
        return { url, data, status: 'fulfilled' };
      })
      .catch(error => {
        executing.delete(promise);
        return { url, error: error.message, status: 'rejected' };
      });

    executing.add(promise);
    results.push(promise);

    if (executing.size >= maxConcurrent) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

// 使用
const urls = [
  'https://api.example.com/item/1',
  'https://api.example.com/item/2',
  'https://api.example.com/item/3',
  'https://api.example.com/item/4',
  'https://api.example.com/item/5'
];

const results = await fetchWithRateLimit(urls, 2);
console.log(results);
```

## 最佳实践

### 始终检查 response.ok

```javascript
// 不好 - 不处理 HTTP 错误
const data = await fetch(url).then(r => r.json());

// 好 - 正确检查错误
const response = await fetch(url);
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
const data = await response.json();
```

### 使用 AbortController 进行清理

```javascript
// 始终提供取消能力
function createFetchWithAbort() {
  const controller = new AbortController();

  return {
    promise: fetch(url, { signal: controller.signal }),
    abort: () => controller.abort()
  };
}
```

### 处理 JSON 解析错误

```javascript
async function safeJsonParse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON 解析错误:', error);
    throw new Error(`无效的 JSON 响应: ${text.substring(0, 100)}`);
  }
}
```

### 设置适当的超时

```javascript
// 生产代码始终设置超时
const response = await fetch(url, {
  signal: AbortSignal.timeout(10000)  // 10 秒超时
});
```

### 避免在 URL 中存储敏感数据

```javascript
// 不好 - URL 中有敏感数据
fetch(`https://api.example.com/auth?token=${secretToken}`);

// 好 - 敏感数据在头中
fetch('https://api.example.com/auth', {
  headers: {
    'Authorization': `Bearer ${secretToken}`
  }
});
```

## 总结

Fetch API 提供了一个现代的、基于 Promise 的接口用于在 JavaScript 中发起 HTTP 请求：

- **fetch()** 返回一个 Promise，解析为 Response 对象
- **Request** 和 **Response** 对象提供丰富的 API 来处理 HTTP 数据
- **Headers** 对象允许操作 HTTP 头
- 支持多种正文类型：JSON、FormData、Blob、ArrayBuffer、流
- **错误处理** 需要检查 response.ok，因为 fetch 只在网络错误时拒绝
- **AbortController** 启用请求取消和超时实现
- **流式处理** 支持高效处理大型响应
- 与 XMLHttpRequest 相比，Fetch 提供更简洁的语法和更好的 Promise 集成

Fetch API 是现代 JavaScript 应用程序中发起 HTTP 请求的标准方式，在所有当前浏览器和 Node.js 18+ 中都受支持。
