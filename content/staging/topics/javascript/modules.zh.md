---
title: 模块系统
description: JavaScript模块系统完全指南，ES Modules、CommonJS与动态导入
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - ES Modules
  - CommonJS
  - 模块化
status: imported
origin: old/src/content/docs/javascript/modules.zh.md
divergence: 0.158
issues: []
legacy:
  category: JavaScript
  subcategory: 核心概念
  order: 11
  lastUpdated: 2026-01-07
---

模块化是现代 JavaScript 开发的基石。通过将代码分割成独立、可复用的模块，我们可以更好地组织代码、管理依赖关系，并提高代码的可维护性。本文将深入探讨 JavaScript 的模块系统，包括 ES Modules、CommonJS 以及动态导入等核心概念。

## 为什么需要模块化

在模块化出现之前，JavaScript 代码通常通过多个 `<script>` 标签加载，这带来了诸多问题：

- **全局命名空间污染**：所有变量都在全局作用域中，容易产生命名冲突
- **依赖管理困难**：脚本加载顺序必须手动维护
- **代码复用性差**：难以在不同项目间共享代码
- **可维护性低**：大型项目的代码组织变得混乱

模块化解决了这些问题，提供了：

- 独立的作用域，避免命名冲突
- 明确的依赖声明
- 代码的封装与复用
- 更好的代码组织结构

## ES Modules (ESM)

ES Modules 是 ECMAScript 2015 (ES6) 引入的官方模块系统，现已成为 JavaScript 模块化的标准。

### 基本导出 (export)

ES Modules 提供了多种导出方式：

#### 命名导出 (Named Exports)

```javascript
// math.js

// 方式一：逐个导出
export const PI = 3.14159265359;

export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export class Calculator {
  constructor() {
    this.result = 0;
  }

  add(value) {
    this.result += value;
    return this;
  }

  getResult() {
    return this.result;
  }
}

// 方式二：统一导出
const multiply = (a, b) => a * b;
const divide = (a, b) => a / b;

export { multiply, divide };
```

#### 默认导出 (Default Export)

每个模块只能有一个默认导出：

```javascript
// logger.js

class Logger {
  constructor(prefix = '') {
    this.prefix = prefix;
  }

  log(message) {
    console.log(`${this.prefix}[LOG] ${message}`);
  }

  error(message) {
    console.error(`${this.prefix}[ERROR] ${message}`);
  }

  warn(message) {
    console.warn(`${this.prefix}[WARN] ${message}`);
  }
}

export default Logger;
```

#### 混合导出

可以同时使用默认导出和命名导出：

```javascript
// api.js

// 默认导出主要功能
export default class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async get(endpoint) {
    const response = await fetch(`${this.baseURL}${endpoint}`);
    return response.json();
  }

  async post(endpoint, data) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

// 命名导出辅助功能
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

export function createQueryString(params) {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}
```

#### 重命名导出

```javascript
// utils.js

function internalHelper() {
  // 内部实现
}

function processData(data) {
  return data.map(item => item.toUpperCase());
}

// 导出时重命名
export {
  internalHelper as helper,
  processData as transform
};
```

### 基本导入 (import)

#### 导入命名导出

```javascript
// 导入特定的命名导出
import { add, subtract, PI } from './math.js';

console.log(PI);           // 3.14159265359
console.log(add(2, 3));    // 5
console.log(subtract(5, 2)); // 3

// 重命名导入
import { add as sum, multiply as mul } from './math.js';

console.log(sum(1, 2));    // 3
console.log(mul(3, 4));    // 12

// 导入所有命名导出为一个对象
import * as MathUtils from './math.js';

console.log(MathUtils.PI);
console.log(MathUtils.add(1, 2));
console.log(MathUtils.divide(10, 2));
```

#### 导入默认导出

```javascript
// 导入默认导出（可以使用任意名称）
import Logger from './logger.js';
import MyLogger from './logger.js';  // 同一个模块，不同名称

const logger = new Logger('[App] ');
logger.log('应用启动');
```

#### 混合导入

```javascript
// 同时导入默认导出和命名导出
import ApiClient, { HTTP_METHODS, createQueryString } from './api.js';

const client = new ApiClient('https://api.example.com');
console.log(HTTP_METHODS.GET);

const query = createQueryString({ page: 1, limit: 10 });
console.log(query);  // "page=1&limit=10"
```

#### 仅执行模块（副作用导入）

有时我们只需要执行模块中的代码，而不需要导入任何内容：

```javascript
// polyfills.js
if (!Array.prototype.flat) {
  Array.prototype.flat = function(depth = 1) {
    // polyfill 实现
  };
}

// main.js
import './polyfills.js';  // 仅执行，不导入任何内容
```

### 模块的特性

ES Modules 具有以下重要特性：

```javascript
// 1. 模块作用域
// module-a.js
const privateVar = '私有变量';  // 不会暴露到全局
export const publicVar = '公共变量';

// 2. 严格模式
// ES Modules 自动启用严格模式
// 以下代码会报错
// x = 10;  // ReferenceError: x is not defined

// 3. 静态结构
// 导入和导出必须在顶层，不能在条件语句中
// 这使得静态分析和树摇（tree-shaking）成为可能

// 错误示例（不允许）：
// if (condition) {
//   import { something } from './module.js';  // SyntaxError
// }

// 4. 单例模式
// 模块只会被执行一次，多次导入返回同一实例
// counter.js
let count = 0;
export function increment() {
  return ++count;
}
export function getCount() {
  return count;
}

// a.js
import { increment, getCount } from './counter.js';
increment();  // 1
console.log(getCount());  // 1

// b.js
import { getCount } from './counter.js';
console.log(getCount());  // 仍然是 1（共享同一状态）

// 5. 实时绑定（Live Bindings）
// 导入的是引用，而非值的拷贝
// value.js
export let value = 1;
export function updateValue() {
  value = 2;
}

// main.js
import { value, updateValue } from './value.js';
console.log(value);  // 1
updateValue();
console.log(value);  // 2（反映了模块内的更新）
```

### 在浏览器中使用 ES Modules

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ES Modules 示例</title>
</head>
<body>
  <!-- 使用 type="module" 声明模块脚本 -->
  <script type="module">
    import { greet } from './greet.js';
    greet('世界');
  </script>

  <!-- 外部模块文件 -->
  <script type="module" src="./app.js"></script>

  <!-- 为不支持模块的浏览器提供回退 -->
  <script nomodule src="./fallback.js"></script>
</body>
</html>
```

模块脚本的特点：

- 默认延迟执行（相当于 `defer`）
- 自动启用严格模式
- 顶层 `this` 是 `undefined`
- 支持顶层 `await`（ES2022）

```javascript
// 顶层 await 示例
// config.js
const response = await fetch('/api/config');
export const config = await response.json();

// app.js
import { config } from './config.js';
console.log(config);  // 配置对象已加载完成
```

## CommonJS (CJS)

CommonJS 是 Node.js 采用的模块系统，在服务器端 JavaScript 开发中广泛使用。

### 基本导出

```javascript
// utils.js

// 方式一：添加到 exports 对象
exports.formatDate = function(date) {
  return date.toISOString().split('T')[0];
};

exports.formatCurrency = function(amount, currency = 'CNY') {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// 方式二：替换整个 module.exports
module.exports = {
  formatDate(date) {
    return date.toISOString().split('T')[0];
  },
  formatCurrency(amount, currency = 'CNY') {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
};

// 方式三：导出单个值（类似默认导出）
// database.js
class Database {
  constructor(connectionString) {
    this.connectionString = connectionString;
  }

  connect() {
    console.log(`连接到 ${this.connectionString}`);
  }

  query(sql) {
    console.log(`执行查询: ${sql}`);
  }
}

module.exports = Database;
```

### 基本导入

```javascript
// 导入整个模块
const utils = require('./utils');
console.log(utils.formatDate(new Date()));
console.log(utils.formatCurrency(1234.56));

// 使用解构导入特定功能
const { formatDate, formatCurrency } = require('./utils');
console.log(formatDate(new Date()));

// 导入默认导出的类
const Database = require('./database');
const db = new Database('mongodb://localhost:27017');
db.connect();

// 导入 Node.js 内置模块
const fs = require('fs');
const path = require('path');
const http = require('http');

// 导入 npm 包
const lodash = require('lodash');
const express = require('express');
```

### CommonJS 的特性

```javascript
// 1. 动态加载
// CommonJS 支持条件导入
let config;
if (process.env.NODE_ENV === 'production') {
  config = require('./config.prod');
} else {
  config = require('./config.dev');
}

// 2. 同步加载
// require 是同步操作，会阻塞执行
const data = require('./large-data.json');  // 同步读取

// 3. 值的拷贝
// CommonJS 导出的是值的拷贝，而非引用
// counter.js
let count = 0;
module.exports = {
  count,
  increment() {
    count++;
    // 注意：导出的 count 不会更新
  }
};

// main.js
const counter = require('./counter');
console.log(counter.count);  // 0
counter.increment();
console.log(counter.count);  // 仍然是 0

// 4. 模块缓存
// 模块只会加载一次，之后从缓存获取
const mod1 = require('./module');
const mod2 = require('./module');
console.log(mod1 === mod2);  // true

// 查看模块缓存
console.log(require.cache);

// 清除缓存（用于热重载等场景）
delete require.cache[require.resolve('./module')];

// 5. 循环依赖处理
// a.js
console.log('a 开始');
exports.done = false;
const b = require('./b');
console.log('在 a 中，b.done =', b.done);
exports.done = true;
console.log('a 结束');

// b.js
console.log('b 开始');
exports.done = false;
const a = require('./a');
console.log('在 b 中，a.done =', a.done);  // false（a 还未完成）
exports.done = true;
console.log('b 结束');

// main.js
const a = require('./a');
const b = require('./b');
// 输出顺序：
// a 开始
// b 开始
// 在 b 中，a.done = false
// b 结束
// 在 a 中，b.done = true
// a 结束
```

## ES Modules vs CommonJS

### 主要区别对比

| 特性 | ES Modules | CommonJS |
|------|-----------|----------|
| 语法 | `import`/`export` | `require`/`module.exports` |
| 加载方式 | 异步 | 同步 |
| 绑定类型 | 实时绑定（引用） | 值的拷贝 |
| 静态分析 | 支持（编译时确定） | 不支持（运行时确定） |
| 顶层 `this` | `undefined` | `module.exports` |
| 树摇优化 | 支持 | 不支持 |
| 条件导入 | 需要动态 `import()` | 原生支持 |
| 浏览器支持 | 原生支持 | 需要打包工具 |
| Node.js 支持 | 需要 `.mjs` 或配置 | 默认支持 |

### 互操作性

```javascript
// 在 Node.js 中使用 ES Modules

// 方式一：使用 .mjs 扩展名
// utils.mjs
export function hello() {
  return 'Hello from ESM!';
}

// 方式二：在 package.json 中设置 type
// package.json
{
  "type": "module"
}

// 在 ESM 中导入 CommonJS 模块
// ESM 文件
import cjsModule from './cjs-module.cjs';
// 或
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cjsModule = require('./cjs-module.cjs');

// 在 CommonJS 中使用 ES Modules（需要动态导入）
// CJS 文件
async function loadESM() {
  const esmModule = await import('./esm-module.mjs');
  console.log(esmModule.default);
}
loadESM();
```

### import.meta

ES Modules 提供了 `import.meta` 对象，包含模块的元信息：

```javascript
// 获取当前模块的 URL
console.log(import.meta.url);
// 浏览器: "https://example.com/js/app.js"
// Node.js: "file:///path/to/app.js"

// 在 Node.js 中获取 __dirname 和 __filename 的等价物
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__filename);  // /path/to/current/file.js
console.log(__dirname);   // /path/to/current

// 解析相对于当前模块的路径
const dataPath = new URL('./data.json', import.meta.url);
```

## 动态导入 (Dynamic Imports)

动态导入允许在运行时按需加载模块，返回一个 Promise。

### 基本用法

```javascript
// 基本动态导入
async function loadModule() {
  const module = await import('./heavy-module.js');
  module.doSomething();
}

// 条件导入
async function loadLocale(language) {
  let messages;

  switch (language) {
    case 'zh':
      messages = await import('./locales/zh.js');
      break;
    case 'en':
      messages = await import('./locales/en.js');
      break;
    default:
      messages = await import('./locales/en.js');
  }

  return messages.default;
}

// 使用 then 语法
import('./analytics.js')
  .then(module => {
    module.init();
    module.trackPageView();
  })
  .catch(error => {
    console.error('加载分析模块失败:', error);
  });
```

### 实际应用场景

#### 路由懒加载

```javascript
// router.js
const routes = {
  '/': () => import('./pages/Home.js'),
  '/about': () => import('./pages/About.js'),
  '/products': () => import('./pages/Products.js'),
  '/contact': () => import('./pages/Contact.js')
};

async function navigate(path) {
  const loader = routes[path];
  if (!loader) {
    const NotFound = await import('./pages/NotFound.js');
    return NotFound.default;
  }

  const Page = await loader();
  return Page.default;
}

// 使用
const currentPage = await navigate('/about');
// 渲染页面内容
const appContainer = document.getElementById('app');
appContainer.textContent = '';
appContainer.appendChild(currentPage.render());
```

#### 功能按需加载

```javascript
// 编辑器功能按需加载
class Editor {
  constructor(container) {
    this.container = container;
    this.plugins = new Map();
  }

  async loadPlugin(name) {
    if (this.plugins.has(name)) {
      return this.plugins.get(name);
    }

    let plugin;
    switch (name) {
      case 'markdown':
        plugin = await import('./plugins/markdown.js');
        break;
      case 'syntax-highlight':
        plugin = await import('./plugins/syntax-highlight.js');
        break;
      case 'spell-check':
        plugin = await import('./plugins/spell-check.js');
        break;
      default:
        throw new Error(`未知插件: ${name}`);
    }

    this.plugins.set(name, plugin.default);
    return plugin.default;
  }

  async enableMarkdown() {
    const MarkdownPlugin = await this.loadPlugin('markdown');
    const instance = new MarkdownPlugin(this);
    instance.activate();
  }
}
```

#### 条件 Polyfill 加载

```javascript
// 按需加载 polyfill
async function loadPolyfills() {
  const polyfills = [];

  if (!window.fetch) {
    polyfills.push(import('whatwg-fetch'));
  }

  if (!window.IntersectionObserver) {
    polyfills.push(import('intersection-observer'));
  }

  if (!Array.prototype.flat) {
    polyfills.push(import('array-flat-polyfill'));
  }

  await Promise.all(polyfills);
  console.log('所有必要的 polyfill 已加载');
}

// 在应用启动前加载
loadPolyfills().then(() => {
  import('./app.js');
});
```

#### 错误边界与回退

```javascript
// 带错误处理的模块加载
async function safeImport(modulePath, fallbackPath) {
  try {
    return await import(modulePath);
  } catch (error) {
    console.warn(`加载 ${modulePath} 失败，尝试回退方案`);

    if (fallbackPath) {
      return await import(fallbackPath);
    }

    // 返回一个空模块作为最终回退
    return {
      default: () => null,
      __failed: true
    };
  }
}

// 使用
const ChartModule = await safeImport(
  './charts/advanced-chart.js',
  './charts/basic-chart.js'
);
```

### 动态导入与代码分割

动态导入是代码分割的基础，构建工具会自动将动态导入的模块分割成独立的代码块：

```javascript
// Webpack 魔法注释
const Component = await import(
  /* webpackChunkName: "my-component" */
  /* webpackPrefetch: true */
  './MyComponent.js'
);

// Vite 中的动态导入
const modules = import.meta.glob('./modules/*.js');
// 返回一个对象，键是文件路径，值是导入函数

for (const path in modules) {
  const module = await modules[path]();
  console.log(path, module);
}

// 预加载模块
const preloadLink = document.createElement('link');
preloadLink.rel = 'modulepreload';
preloadLink.href = '/js/heavy-module.js';
document.head.appendChild(preloadLink);
```

## 模块解析

### Node.js 模块解析算法

```javascript
// 1. 核心模块
const fs = require('fs');  // 优先级最高

// 2. 文件模块（以 ./, ../, / 开头）
const local = require('./local');
// 查找顺序：
// ./local
// ./local.js
// ./local.json
// ./local.node
// ./local/index.js
// ./local/index.json
// ./local/index.node

// 3. 目录模块
const myPackage = require('./my-package');
// 查找顺序：
// ./my-package/package.json 的 "main" 字段
// ./my-package/index.js
// ./my-package/index.json
// ./my-package/index.node

// 4. node_modules 模块
const lodash = require('lodash');
// 查找顺序（从当前目录向上）：
// ./node_modules/lodash
// ../node_modules/lodash
// ../../node_modules/lodash
// ... 直到根目录
```

### package.json 中的模块配置

```json
{
  "name": "my-library",
  "version": "1.0.0",

  // CommonJS 入口点
  "main": "./dist/index.cjs",

  // ES Modules 入口点
  "module": "./dist/index.mjs",

  // 现代 Node.js 的条件导出
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils.mjs",
      "require": "./dist/utils.cjs"
    },
    "./package.json": "./package.json"
  },

  // 模块类型
  "type": "module",

  // TypeScript 类型定义
  "types": "./dist/index.d.ts",

  // 浏览器环境的替代入口
  "browser": {
    "./src/server-only.js": "./src/browser-alternative.js",
    "fs": false
  },

  // 副作用声明（用于树摇优化）
  "sideEffects": [
    "*.css",
    "./src/polyfills.js"
  ]
}
```

### 导入映射 (Import Maps)

浏览器原生支持的模块解析配置：

```html
<!DOCTYPE html>
<html>
<head>
  <!-- 导入映射必须在任何模块脚本之前 -->
  <script type="importmap">
  {
    "imports": {
      "lodash": "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js",
      "react": "https://esm.sh/react@18",
      "react-dom": "https://esm.sh/react-dom@18",
      "@/": "./src/",
      "#components/": "./src/components/"
    },
    "scopes": {
      "/legacy/": {
        "lodash": "https://cdn.jsdelivr.net/npm/lodash-es@3.10.1/lodash.js"
      }
    }
  }
  </script>
</head>
<body>
  <script type="module">
    // 现在可以使用裸模块说明符
    import _ from 'lodash';
    import React from 'react';

    // 使用路径别名
    import { Button } from '#components/Button.js';
    import utils from '@/utils/index.js';
  </script>
</body>
</html>
```

## 模块打包工具

### Webpack 配置示例

```javascript
// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    main: './src/index.js',
    vendor: './src/vendor.js'
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    clean: true
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        }
      }
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components')
    },
    extensions: ['.js', '.jsx', '.json']
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ]
};
```

### Vite 配置示例

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components')
    }
  },

  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin.html')
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-utils': ['lodash-es', 'date-fns']
        }
      }
    },
    // 代码分割策略
    chunkSizeWarningLimit: 500
  },

  optimizeDeps: {
    include: ['lodash-es', 'axios']
  }
});
```

### Rollup 配置示例

```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',

  output: [
    {
      file: 'dist/bundle.cjs.js',
      format: 'cjs',
      exports: 'named'
    },
    {
      file: 'dist/bundle.esm.js',
      format: 'es'
    },
    {
      file: 'dist/bundle.umd.js',
      format: 'umd',
      name: 'MyLibrary',
      globals: {
        lodash: '_'
      }
    }
  ],

  external: ['lodash'],

  plugins: [
    resolve(),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**'
    }),
    terser()
  ]
};
```

## 最佳实践

### 模块组织结构

```
src/
├── index.js              # 主入口，重新导出公共 API
├── components/
│   ├── index.js          # 桶文件（barrel file）
│   ├── Button/
│   │   ├── index.js
│   │   ├── Button.js
│   │   └── Button.css
│   └── Modal/
│       ├── index.js
│       └── Modal.js
├── utils/
│   ├── index.js
│   ├── format.js
│   └── validation.js
├── services/
│   ├── index.js
│   ├── api.js
│   └── auth.js
└── constants/
    └── index.js
```

### 桶文件模式 (Barrel Pattern)

```javascript
// components/index.js
// 集中导出所有组件，简化导入路径
export { Button } from './Button/Button.js';
export { Modal } from './Modal/Modal.js';
export { Input } from './Input/Input.js';
export { Select } from './Select/Select.js';

// 使用时
import { Button, Modal, Input } from '@/components';
// 而不是
import { Button } from '@/components/Button/Button.js';
import { Modal } from '@/components/Modal/Modal.js';
```

### 避免循环依赖

```javascript
// 错误示例：循环依赖
// a.js
import { b } from './b.js';
export const a = 'A' + b;

// b.js
import { a } from './a.js';
export const b = 'B' + a;  // 问题！

// 解决方案：提取共享依赖
// shared.js
export const shared = 'shared';

// a.js
import { shared } from './shared.js';
export const a = 'A' + shared;

// b.js
import { shared } from './shared.js';
export const b = 'B' + shared;
```

### 明确的导出

```javascript
// 推荐：明确的命名导出
export function processData(data) { /* ... */ }
export function validateData(data) { /* ... */ }
export class DataProcessor { /* ... */ }

// 避免：模糊的默认导出
// export default { processData, validateData };
// 这会阻碍树摇和 IDE 自动补全

// 对于主要类或函数，可以同时使用两种导出
export class MyComponent { /* ... */ }
export default MyComponent;
```

### 树摇优化友好

```javascript
// 推荐：导入需要的特定功能
import { debounce, throttle } from 'lodash-es';

// 避免：导入整个库
// import _ from 'lodash';
// _.debounce(...);

// 推荐：使用具有 ES Modules 版本的包
// lodash-es 而不是 lodash
// date-fns 而不是 moment

// 在 package.json 中声明无副作用
{
  "sideEffects": false
}

// 或指定有副作用的文件
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfills.js"
  ]
}
```

### 类型安全的模块

```typescript
// types.ts - 集中类型定义
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// user.ts
import type { User, ApiResponse } from './types';

export async function fetchUser(id: number): Promise<ApiResponse<User>> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// 使用 import type 仅导入类型（不会影响运行时）
import type { User } from './types';
```

## 总结

JavaScript 模块系统是现代开发的基础设施。理解并熟练运用模块化可以：

1. **提高代码质量**：通过封装和隔离，减少全局污染和意外的依赖
2. **增强可维护性**：清晰的模块边界使代码更易于理解和修改
3. **优化性能**：通过代码分割和懒加载，减少初始加载时间
4. **促进团队协作**：明确的接口定义使并行开发更加顺畅

关键要点回顾：

- **ES Modules** 是标准化的模块系统，支持静态分析和树摇优化
- **CommonJS** 在 Node.js 生态中仍然广泛使用，具有动态加载的灵活性
- **动态导入** 实现按需加载，是性能优化的重要手段
- **模块打包工具** 帮助我们处理模块解析、代码分割和优化

随着 ES Modules 在浏览器和 Node.js 中的支持日趋完善，它正在成为 JavaScript 生态系统的统一模块标准。建议在新项目中优先使用 ES Modules，同时了解 CommonJS 以便维护现有代码和使用某些 Node.js 包。
