---
title: 错误处理
description: JavaScript错误处理完全指南，try-catch、自定义错误与错误边界
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - 错误处理
  - 异常
  - 调试
status: imported
origin: old/src/content/docs/javascript/error-handling.zh.md
divergence: 0.213
issues: []
legacy:
  category: JavaScript
  subcategory: 核心概念
  order: 13
  lastUpdated: 2026-01-07
---

错误处理是编写健壮、可靠应用程序的关键技能。良好的错误处理不仅能防止程序崩溃，还能提供有意义的反馈，帮助开发者快速定位和解决问题。本文将全面介绍 JavaScript 中的错误处理机制。

## 错误类型

JavaScript 提供了多种内置错误类型，每种类型代表不同的错误场景。

### Error 基类

`Error` 是所有错误类型的基类，包含以下核心属性：

```javascript
const error = new Error('出错了！');

console.log(error.name);    // "Error"
console.log(error.message); // "出错了！"
console.log(error.stack);   // 错误堆栈跟踪信息
```

### 内置错误类型

#### SyntaxError（语法错误）

代码语法不正确时抛出：

```javascript
// 语法错误示例（无法在运行时捕获，因为代码无法解析）
// const obj = { name: 'test', }; // 旧版浏览器中尾逗号会报错

// 但 JSON.parse 的语法错误可以捕获
try {
  JSON.parse('{ invalid json }');
} catch (e) {
  console.log(e instanceof SyntaxError); // true
  console.log(e.message); // Unexpected token i in JSON at position 2
}
```

#### ReferenceError（引用错误）

访问不存在的变量时抛出：

```javascript
try {
  console.log(undefinedVariable);
} catch (e) {
  console.log(e instanceof ReferenceError); // true
  console.log(e.message); // undefinedVariable is not defined
}
```

#### TypeError（类型错误）

值的类型不符合预期时抛出：

```javascript
try {
  const obj = null;
  obj.property; // 尝试访问 null 的属性
} catch (e) {
  console.log(e instanceof TypeError); // true
  console.log(e.message); // Cannot read properties of null
}

try {
  const num = 42;
  num.toUpperCase(); // 数字没有 toUpperCase 方法
} catch (e) {
  console.log(e instanceof TypeError); // true
}
```

#### RangeError（范围错误）

值超出有效范围时抛出：

```javascript
try {
  const arr = new Array(-1); // 数组长度不能为负数
} catch (e) {
  console.log(e instanceof RangeError); // true
}

try {
  const num = 1.2345;
  num.toFixed(101); // toFixed 参数必须在 0-100 之间
} catch (e) {
  console.log(e instanceof RangeError); // true
}

// 递归调用过深也会抛出 RangeError
function infiniteRecursion() {
  return infiniteRecursion();
}

try {
  infiniteRecursion();
} catch (e) {
  console.log(e.message); // Maximum call stack size exceeded
}
```

#### URIError（URI 错误）

URI 编码/解码函数使用不当时抛出：

```javascript
try {
  decodeURIComponent('%'); // 不完整的百分号编码
} catch (e) {
  console.log(e instanceof URIError); // true
}
```

#### AggregateError（聚合错误）

ES2021 新增，用于表示多个错误的集合：

```javascript
try {
  throw new AggregateError(
    [
      new Error('错误1'),
      new Error('错误2'),
      new Error('错误3')
    ],
    '发生了多个错误'
  );
} catch (e) {
  console.log(e instanceof AggregateError); // true
  console.log(e.message);  // 发生了多个错误
  console.log(e.errors);   // [Error: 错误1, Error: 错误2, Error: 错误3]
}

// Promise.any 失败时会抛出 AggregateError
const promises = [
  Promise.reject('失败1'),
  Promise.reject('失败2'),
  Promise.reject('失败3')
];

Promise.any(promises).catch(e => {
  console.log(e instanceof AggregateError); // true
});
```

### 错误类型判断

```javascript
function handleError(error) {
  if (error instanceof SyntaxError) {
    console.log('语法错误：请检查代码格式');
  } else if (error instanceof TypeError) {
    console.log('类型错误：请检查变量类型');
  } else if (error instanceof ReferenceError) {
    console.log('引用错误：变量未定义');
  } else if (error instanceof RangeError) {
    console.log('范围错误：值超出有效范围');
  } else {
    console.log('未知错误：', error.message);
  }
}
```

## try-catch-finally

`try-catch-finally` 是 JavaScript 中最基本的错误处理结构。

### 基本语法

```javascript
try {
  // 可能抛出错误的代码
  const result = riskyOperation();
  console.log('操作成功:', result);
} catch (error) {
  // 错误处理代码
  console.error('操作失败:', error.message);
} finally {
  // 无论是否发生错误都会执行的代码
  console.log('清理资源...');
}
```

### catch 绑定省略

ES2019 允许省略 catch 的参数：

```javascript
try {
  JSON.parse(invalidJson);
} catch {
  // 不需要使用错误对象时可以省略参数
  console.log('JSON 解析失败，使用默认值');
}
```

### finally 的执行时机

`finally` 块在 `try` 或 `catch` 完成后总会执行，即使有 `return` 语句：

```javascript
function testFinally() {
  try {
    console.log('1. try 开始');
    return 'try 返回值';
  } catch (e) {
    console.log('catch 执行');
    return 'catch 返回值';
  } finally {
    console.log('2. finally 执行');
    // 注意：如果在 finally 中 return，会覆盖之前的返回值
  }
}

console.log('3. 函数返回:', testFinally());
// 输出：
// 1. try 开始
// 2. finally 执行
// 3. 函数返回: try 返回值
```

### finally 中的 return（避免使用）

```javascript
function dangerousFinally() {
  try {
    throw new Error('错误');
  } catch (e) {
    return '捕获到错误';
  } finally {
    return 'finally 返回值'; // 这会覆盖 catch 的返回值！
  }
}

console.log(dangerousFinally()); // "finally 返回值"
// 警告：不建议在 finally 中使用 return
```

### 嵌套 try-catch

```javascript
try {
  try {
    throw new Error('内部错误');
  } finally {
    console.log('内部 finally');
  }
} catch (e) {
  console.log('外部 catch:', e.message);
}
// 输出：
// 内部 finally
// 外部 catch: 内部错误
```

### 实际应用示例

```javascript
function readConfig(filePath) {
  let fileHandle = null;

  try {
    fileHandle = openFile(filePath);
    const content = fileHandle.read();
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('配置文件格式错误');
      return getDefaultConfig();
    }
    throw error; // 重新抛出其他类型的错误
  } finally {
    if (fileHandle) {
      fileHandle.close(); // 确保文件被关闭
    }
  }
}
```

## 自定义错误

创建自定义错误类可以让错误处理更加精确和有意义。

### 基本自定义错误

```javascript
class CustomError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CustomError';

    // 修复原型链（某些环境需要）
    Object.setPrototypeOf(this, CustomError.prototype);

    // 捕获堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}

try {
  throw new CustomError('这是自定义错误');
} catch (e) {
  console.log(e instanceof CustomError); // true
  console.log(e instanceof Error);       // true
  console.log(e.name);    // "CustomError"
  console.log(e.message); // "这是自定义错误"
}
```

### 带有额外属性的错误

```javascript
class ValidationError extends Error {
  constructor(message, field, value) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.timestamp = new Date();

    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      field: this.field,
      value: this.value,
      timestamp: this.timestamp
    };
  }
}

function validateUser(user) {
  if (!user.email || !user.email.includes('@')) {
    throw new ValidationError(
      '邮箱格式无效',
      'email',
      user.email
    );
  }

  if (!user.age || user.age < 0 || user.age > 150) {
    throw new ValidationError(
      '年龄必须在 0-150 之间',
      'age',
      user.age
    );
  }
}

try {
  validateUser({ email: 'invalid', age: -5 });
} catch (e) {
  if (e instanceof ValidationError) {
    console.log(`字段 "${e.field}" 验证失败: ${e.message}`);
    console.log('无效值:', e.value);
  }
}
```

### 错误层次结构

```javascript
// 基础应用错误
class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.timestamp = new Date();
    Object.setPrototypeOf(this, AppError.prototype);
  }

  get isOperational() {
    return true; // 标记为可预期的操作性错误
  }
}

// 网络相关错误
class NetworkError extends AppError {
  constructor(message, statusCode, url) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.url = url;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

// 数据库错误
class DatabaseError extends AppError {
  constructor(message, query) {
    super(message, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
    this.query = query;
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

// 认证错误
class AuthenticationError extends AppError {
  constructor(message = '认证失败') {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

// 授权错误
class AuthorizationError extends AppError {
  constructor(message = '权限不足', requiredRole) {
    super(message, 'FORBIDDEN');
    this.name = 'AuthorizationError';
    this.requiredRole = requiredRole;
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

// 使用示例
function handleAppError(error) {
  if (error instanceof AuthenticationError) {
    // 重定向到登录页
    console.log('请重新登录');
  } else if (error instanceof AuthorizationError) {
    // 显示权限不足提示
    console.log(`需要 ${error.requiredRole} 角色`);
  } else if (error instanceof NetworkError) {
    // 网络错误处理
    console.log(`请求 ${error.url} 失败: ${error.statusCode}`);
  } else if (error instanceof DatabaseError) {
    // 数据库错误处理
    console.log('数据库操作失败');
  } else if (error instanceof AppError) {
    // 通用应用错误
    console.log(`应用错误 [${error.code}]: ${error.message}`);
  } else {
    // 未知错误
    console.log('发生未知错误:', error);
  }
}
```

### 错误工厂模式

```javascript
const ErrorCodes = {
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL: 'INTERNAL_ERROR'
};

class ErrorFactory {
  static create(code, message, details = {}) {
    const error = new AppError(message, code);
    error.details = details;
    return error;
  }

  static validation(message, field) {
    return this.create(ErrorCodes.VALIDATION, message, { field });
  }

  static notFound(resource, id) {
    return this.create(
      ErrorCodes.NOT_FOUND,
      `${resource} 不存在`,
      { resource, id }
    );
  }

  static unauthorized(message = '请先登录') {
    return this.create(ErrorCodes.UNAUTHORIZED, message);
  }

  static forbidden(message = '权限不足') {
    return this.create(ErrorCodes.FORBIDDEN, message);
  }

  static internal(message = '服务器内部错误') {
    return this.create(ErrorCodes.INTERNAL, message);
  }
}

// 使用
throw ErrorFactory.notFound('用户', 123);
throw ErrorFactory.validation('邮箱格式错误', 'email');
```

## 异步错误处理

异步代码的错误处理需要特别注意，因为 try-catch 无法直接捕获异步错误。

### 回调函数中的错误处理

Node.js 风格的错误优先回调：

```javascript
function asyncOperation(callback) {
  setTimeout(() => {
    try {
      const result = riskyOperation();
      callback(null, result);
    } catch (error) {
      callback(error, null);
    }
  }, 1000);
}

asyncOperation((error, result) => {
  if (error) {
    console.error('操作失败:', error.message);
    return;
  }
  console.log('操作成功:', result);
});
```

### Promise 错误处理

#### 使用 .catch()

```javascript
function fetchData(url) {
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new NetworkError('请求失败', response.status, url);
      }
      return response.json();
    })
    .then(data => {
      // 处理数据
      return processData(data);
    })
    .catch(error => {
      // 统一处理所有错误
      console.error('获取数据失败:', error);
      throw error; // 可以选择重新抛出
    });
}

// 链式调用中的错误处理
fetchUser(userId)
  .then(user => fetchUserPosts(user.id))
  .then(posts => displayPosts(posts))
  .catch(error => {
    // 捕获整个链中的任何错误
    showErrorMessage(error);
  })
  .finally(() => {
    hideLoadingSpinner();
  });
```

#### 错误恢复

```javascript
function fetchWithFallback(url, fallbackUrl) {
  return fetch(url)
    .then(response => response.json())
    .catch(error => {
      console.log('主请求失败，尝试备用地址...');
      return fetch(fallbackUrl).then(response => response.json());
    });
}

// 提供默认值
function fetchConfig() {
  return fetch('/api/config')
    .then(response => response.json())
    .catch(error => {
      console.log('获取配置失败，使用默认配置');
      return { theme: 'light', language: 'zh-CN' };
    });
}
```

### async/await 错误处理

#### 使用 try-catch

```javascript
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);

    if (!response.ok) {
      throw new NetworkError('获取用户失败', response.status);
    }

    const user = await response.json();
    const posts = await fetch(`/api/users/${userId}/posts`);
    const postsData = await posts.json();

    return { user, posts: postsData };
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error('网络错误:', error.message);
    } else {
      console.error('未知错误:', error);
    }
    throw error;
  }
}
```

#### 包装错误处理函数

```javascript
// 创建一个安全执行异步函数的包装器
function tryCatch(asyncFn) {
  return async function(...args) {
    try {
      return [null, await asyncFn.apply(this, args)];
    } catch (error) {
      return [error, null];
    }
  };
}

// 使用
const safeGetUser = tryCatch(async (id) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
});

async function main() {
  const [error, user] = await safeGetUser(123);

  if (error) {
    console.error('获取用户失败:', error);
    return;
  }

  console.log('用户:', user);
}
```

#### 高阶函数处理错误

```javascript
// 带重试的异步函数包装器
function withRetry(asyncFn, maxRetries = 3, delay = 1000) {
  return async function(...args) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await asyncFn.apply(this, args);
      } catch (error) {
        lastError = error;
        console.log(`尝试 ${attempt}/${maxRetries} 失败:`, error.message);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // 指数退避
        }
      }
    }

    throw lastError;
  };
}

const fetchWithRetry = withRetry(async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('请求失败');
  return response.json();
});

// 使用
try {
  const data = await fetchWithRetry('/api/data');
} catch (error) {
  console.error('所有重试都失败了:', error);
}
```

### Promise.all 与错误处理

```javascript
// Promise.all - 任何一个失败就会立即拒绝
async function fetchAllUsers(ids) {
  try {
    const users = await Promise.all(
      ids.map(id => fetch(`/api/users/${id}`).then(r => r.json()))
    );
    return users;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    throw error;
  }
}

// Promise.allSettled - 等待所有 Promise 完成
async function fetchAllUsersSafe(ids) {
  const results = await Promise.allSettled(
    ids.map(id => fetch(`/api/users/${id}`).then(r => r.json()))
  );

  const users = [];
  const errors = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      users.push(result.value);
    } else {
      errors.push({ id: ids[index], error: result.reason });
    }
  });

  if (errors.length > 0) {
    console.warn('部分用户获取失败:', errors);
  }

  return { users, errors };
}

// Promise.any - 任何一个成功就返回
async function fetchFromFastestMirror(mirrors) {
  try {
    const data = await Promise.any(
      mirrors.map(url => fetch(url).then(r => r.json()))
    );
    return data;
  } catch (error) {
    // 所有镜像都失败了
    if (error instanceof AggregateError) {
      console.error('所有镜像都不可用');
      error.errors.forEach((e, i) => {
        console.error(`镜像 ${i + 1}:`, e.message);
      });
    }
    throw error;
  }
}
```

### 未捕获的 Promise 错误

```javascript
// 监听未捕获的 Promise 拒绝
window.addEventListener('unhandledrejection', event => {
  console.error('未处理的 Promise 拒绝:', event.reason);

  // 阻止默认处理（在控制台显示错误）
  event.preventDefault();

  // 发送到错误追踪服务
  reportError(event.reason);
});

// Node.js 环境
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});
```

## 错误边界（React）

在 React 应用中，错误边界用于捕获子组件中的 JavaScript 错误。

### 类组件错误边界

```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  // 当子组件抛出错误时调用
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // 用于记录错误信息
  componentDidCatch(error, errorInfo) {
    console.error('错误边界捕获到错误:', error);
    console.error('组件堆栈:', errorInfo.componentStack);

    // 发送到错误追踪服务
    logErrorToService(error, errorInfo);

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // 自定义错误 UI
      return (
        <div className="error-fallback">
          <h2>出错了</h2>
          <p>{this.state.error?.message || '发生了未知错误'}</p>
          <button onClick={this.handleRetry}>重试</button>
          {process.env.NODE_ENV === 'development' && (
            <details>
              <summary>错误详情</summary>
              <pre>{this.state.error?.stack}</pre>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// 使用
function App() {
  return (
    <ErrorBoundary>
      <MainContent />
    </ErrorBoundary>
  );
}
```

### 细粒度错误边界

```javascript
// 不同区域使用不同的错误边界
function App() {
  return (
    <div className="app">
      <ErrorBoundary fallback={<HeaderError />}>
        <Header />
      </ErrorBoundary>

      <div className="main">
        <ErrorBoundary fallback={<SidebarError />}>
          <Sidebar />
        </ErrorBoundary>

        <ErrorBoundary fallback={<ContentError />}>
          <MainContent />
        </ErrorBoundary>
      </div>

      <ErrorBoundary fallback={<FooterError />}>
        <Footer />
      </ErrorBoundary>
    </div>
  );
}
```

### 可复用的错误边界组件

```javascript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      // 支持函数形式的 fallback
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.resetError
        });
      }
      return this.props.fallback || <DefaultErrorUI />;
    }

    return this.props.children;
  }
}

// 使用函数形式的 fallback
<ErrorBoundary
  fallback={({ error, resetError }) => (
    <div>
      <p>错误: {error.message}</p>
      <button onClick={resetError}>重试</button>
    </div>
  )}
  onError={(error, info) => reportToAnalytics(error, info)}
>
  <MyComponent />
</ErrorBoundary>
```

### 使用 react-error-boundary 库

```javascript
import { ErrorBoundary, useErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>出错了</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>重试</button>
    </div>
  );
}

function MyComponent() {
  const { showBoundary } = useErrorBoundary();

  async function handleClick() {
    try {
      await someAsyncOperation();
    } catch (error) {
      // 手动触发错误边界
      showBoundary(error);
    }
  }

  return <button onClick={handleClick}>执行操作</button>;
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => logError(error, info)}
      onReset={() => {
        // 重置应用状态
        queryClient.clear();
      }}
      resetKeys={[userId]} // 当 userId 变化时重置错误边界
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## 全局错误处理

### 浏览器环境

```javascript
// 捕获同步错误
window.onerror = function(message, source, lineno, colno, error) {
  console.error('全局错误:', {
    message,
    source,
    lineno,
    colno,
    error
  });

  // 发送到错误追踪服务
  reportError({
    type: 'javascript',
    message,
    source,
    lineno,
    colno,
    stack: error?.stack
  });

  return true; // 阻止默认错误处理
};

// 或使用 addEventListener
window.addEventListener('error', event => {
  // 区分资源加载错误和 JavaScript 错误
  if (event.target !== window) {
    // 资源加载错误
    console.error('资源加载失败:', event.target.src || event.target.href);
  } else {
    // JavaScript 错误
    console.error('JavaScript 错误:', event.error);
  }
});

// 捕获未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', event => {
  console.error('未处理的 Promise 拒绝:', event.reason);
  reportError({
    type: 'unhandledRejection',
    reason: event.reason
  });
});
```

### Node.js 环境

```javascript
// 未捕获的异常
process.on('uncaughtException', (error, origin) => {
  console.error('未捕获的异常:', error);
  console.error('来源:', origin);

  // 记录错误后安全退出
  logError(error).then(() => {
    process.exit(1);
  });
});

// 未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);

  // 可以选择抛出错误，让 uncaughtException 处理
  throw reason;
});

// 警告处理
process.on('warning', warning => {
  console.warn('进程警告:', warning.name);
  console.warn(warning.message);
  console.warn(warning.stack);
});
```

### Express 错误处理中间件

```javascript
const express = require('express');
const app = express();

// 异步错误包装器
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 路由
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new NotFoundError('用户不存在');
  }
  res.json(user);
}));

// 404 处理
app.use((req, res, next) => {
  next(new NotFoundError('路径不存在'));
});

// 错误处理中间件（必须有 4 个参数）
app.use((err, req, res, next) => {
  console.error('错误:', err);

  // 记录错误
  logError(err, req);

  // 发送响应
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : '服务器内部错误';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});
```

## 最佳实践

### 提供有意义的错误信息

```javascript
// 不好的做法
throw new Error('失败');

// 好的做法
throw new Error(`无法获取用户 ${userId} 的数据: 服务器返回 ${response.status}`);
```

### 使用具体的错误类型

```javascript
// 不好的做法
if (!user) {
  throw new Error('用户不存在');
}

// 好的做法
if (!user) {
  throw new NotFoundError('用户', userId);
}
```

### 不要忽略错误

```javascript
// 不好的做法
try {
  riskyOperation();
} catch (e) {
  // 空的 catch 块
}

// 好的做法
try {
  riskyOperation();
} catch (e) {
  console.error('操作失败:', e);
  // 或者至少记录日志
  logger.error('操作失败', { error: e, context: '...' });
}
```

### 合理使用错误恢复

```javascript
// 提供降级方案
async function getConfig() {
  try {
    return await fetchRemoteConfig();
  } catch (error) {
    console.warn('获取远程配置失败，使用本地配置');
    return getLocalConfig();
  }
}
```

### 区分可恢复和不可恢复错误

```javascript
class AppError extends Error {
  constructor(message, code, isOperational = true) {
    super(message);
    this.code = code;
    this.isOperational = isOperational; // 是否是可预期的操作性错误
  }
}

function handleError(error) {
  if (error.isOperational) {
    // 可恢复的错误，显示用户友好的消息
    showUserMessage(error.message);
  } else {
    // 程序错误，可能需要重启
    console.error('严重错误:', error);
    reportToCrashReporting(error);
    process.exit(1);
  }
}
```

### 正确传播错误

```javascript
// 保留原始错误信息
async function processOrder(orderId) {
  try {
    const order = await fetchOrder(orderId);
    return await submitOrder(order);
  } catch (error) {
    // 包装错误并保留原因
    const wrappedError = new AppError(
      `处理订单 ${orderId} 失败: ${error.message}`,
      'ORDER_PROCESSING_FAILED'
    );
    wrappedError.cause = error;
    throw wrappedError;
  }
}
```

### 清理资源

```javascript
async function processFile(filePath) {
  const file = await openFile(filePath);

  try {
    const data = await file.read();
    return processData(data);
  } finally {
    await file.close(); // 确保文件被关闭
  }
}

// 使用 using 声明（ES2024）
async function processFileModern(filePath) {
  using file = await openFile(filePath);
  const data = await file.read();
  return processData(data);
  // file 会自动关闭
}
```

### 结构化日志记录

```javascript
function logError(error, context = {}) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message: error.message,
    name: error.name,
    code: error.code,
    stack: error.stack,
    context,
    // 环境信息
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION
  };

  console.error(JSON.stringify(errorLog));

  // 发送到日志服务
  sendToLogService(errorLog);
}
```

### 错误监控和告警

```javascript
const errorTracker = {
  errors: new Map(),

  track(error) {
    const key = `${error.name}:${error.message}`;
    const count = (this.errors.get(key) || 0) + 1;
    this.errors.set(key, count);

    // 错误频率过高时告警
    if (count > 100) {
      this.alert(error, count);
    }
  },

  alert(error, count) {
    console.warn(`高频错误告警: ${error.message} (${count}次)`);
    // 发送告警通知
  }
};
```

## 调试技巧

### 使用 debugger 语句

```javascript
function complexCalculation(data) {
  const result = step1(data);
  debugger; // 代码执行到此处会暂停
  const finalResult = step2(result);
  return finalResult;
}
```

### 条件断点

```javascript
function processItems(items) {
  for (const item of items) {
    // 在开发者工具中设置条件断点
    // 条件: item.id === 'problematic-id'
    processItem(item);
  }
}
```

### console 技巧

```javascript
// 分组日志
console.group('用户操作');
console.log('用户 ID:', userId);
console.log('操作类型:', action);
console.groupEnd();

// 表格显示
console.table(users);

// 计时
console.time('fetchData');
await fetchData();
console.timeEnd('fetchData'); // fetchData: 1234ms

// 断言
console.assert(user !== null, '用户不应为空');

// 堆栈跟踪
console.trace('调用堆栈');
```

## 总结

JavaScript 错误处理是构建可靠应用的基础。关键要点包括：

1. **了解错误类型**：熟悉内置错误类型，创建有意义的自定义错误
2. **正确使用 try-catch-finally**：注意 finally 的执行时机和资源清理
3. **异步错误处理**：使用 async/await 配合 try-catch，或 Promise 的 .catch()
4. **React 错误边界**：保护 UI 不被组件错误破坏
5. **全局错误处理**：捕获未处理的错误，防止程序崩溃
6. **遵循最佳实践**：提供清晰的错误信息，区分错误类型，正确传播错误

良好的错误处理能让你的应用更加健壮，用户体验更好，同时也能帮助开发者更快地定位和解决问题。
