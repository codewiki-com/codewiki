---
title: Tree Shaking 原理与实践
description: 掌握 Tree Shaking 消除死代码，优化 JavaScript 包体积
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Tree Shaking
  - 死代码消除
  - 包体积优化
  - ES Modules
  - Webpack
  - Rollup
status: imported
origin: old/src/content/docs/javascript/tree-shaking.zh.md
divergence: 0.197
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: JavaScript
  subcategory: ""
  order: null
  lastUpdated: 2026-01-22
---

Tree Shaking 是一种死代码消除技术，用于从 JavaScript 包中移除未使用的导出。这个术语来自于将应用程序视为一棵树的心理模型 - 当你"摇动"这棵树时，枯叶（未使用的代码）就会脱落。这种优化对于现代 JavaScript 应用程序至关重要，可以显著减少包体积并改善加载时间。

## 为什么 Tree Shaking 很重要

现代 JavaScript 应用程序通常只需要几个函数却导入了整个库。没有 Tree Shaking，你的包会包含所有内容：

```javascript
// 没有 Tree Shaking：整个 lodash（~70KB 压缩后）都被打包
import _ from 'lodash';
const result = _.debounce(fn, 300);

// 有 Tree Shaking：只包含 debounce（~2KB）
import { debounce } from 'lodash-es';
const result = debounce(fn, 300);
```

### 对包体积的影响

| 库 | 完整导入 | Tree-Shaken 导入 | 节省 |
|----|----------|-----------------|------|
| lodash | ~70KB | ~2KB（单个函数） | ~97% |
| date-fns | ~30KB | ~1KB（单个函数） | ~97% |
| RxJS | ~90KB | ~10KB（核心操作符） | ~89% |
| Material UI | ~300KB | ~50KB（少量组件） | ~83% |

## Tree Shaking 如何工作

### ES Modules 静态分析

Tree Shaking 依赖于 ES 模块的静态特性。与 CommonJS 不同，ES 模块具有可静态分析的结构：

```javascript
// ES Modules - 可静态分析
import { used } from './module';
export const something = used();

// CommonJS - 不可静态分析
const { used } = require('./module');
module.exports.something = used();

// 为什么？ES 导入/导出是：
// 1. 只能在顶层（不能在条件/函数内）
// 2. 只能是字符串字面量（不能是动态的）
// 3. 不可变绑定（不可重新赋值）
```

### Tree Shaking 流程

```
源代码             分析             标记             移除
    │                │                │                │
    ▼                ▼                ▼                ▼
┌─────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│ entry.js│ -> │ 构建      │ -> │ 标记已使用│ -> │ 移除      │
│         │    │ 依赖图    │    │ 的导出    │    │ 未使用    │
│ module1 │    │           │    │           │    │ 的代码    │
│ module2 │    │           │    │           │    │           │
└─────────┘    └───────────┘    └───────────┘    └───────────┘
```

**步骤 1：构建依赖图**
```javascript
// entry.js
import { sum } from './math';
console.log(sum(1, 2));

// math.js
export function sum(a, b) { return a + b; }
export function multiply(a, b) { return a * b; }  // 未使用！
export function divide(a, b) { return a / b; }    // 未使用！
```

**步骤 2：标记已使用的导出**
```
entry.js
  └── 从 ./math.js 导入 'sum'
        └── sum() 被使用
        └── multiply() 未被使用
        └── divide() 未被使用
```

**步骤 3：移除未使用的代码**
```javascript
// 最终打包结果（简化）
function sum(a, b) { return a + b; }
console.log(sum(1, 2));
// multiply 和 divide 被消除！
```

### 副作用检测

副作用是在导入模块时执行的代码，无论使用了什么：

```javascript
// module-with-side-effects.js
console.log('模块已加载！');        // 副作用！
window.globalVar = 'value';         // 副作用！
Array.prototype.myMethod = fn;      // 副作用！

export function pureFunction() {
  return 42;
}
```

即使 `pureFunction` 从未被使用，打包器也必须保留副作用。这就是 `package.json` 中 `sideEffects` 字段存在的原因。

## 配置 Tree Shaking

### Webpack 配置

```javascript
// webpack.config.js
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production', // 自动启用 Tree Shaking
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    // 启用 Tree Shaking
    usedExports: true,

    // 启用压缩（移除死代码）
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            dead_code: true,
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log'], // 视为纯函数（可移除）
          },
          mangle: true,
        },
      }),
    ],

    // 额外优化
    sideEffects: true, // 遵守 package.json 的 sideEffects
    providedExports: true,
    concatenateModules: true, // 作用域提升
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                modules: false, // 保持 ES 模块以支持 Tree Shaking！
              }],
            ],
          },
        },
      },
    ],
  },
};
```

### Rollup 配置

```javascript
// rollup.config.js
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'esm',
    sourcemap: true,
  },
  plugins: [
    nodeResolve(),
    commonjs(), // 将 CommonJS 转换为 ES 模块
    terser({
      compress: {
        dead_code: true,
        unused: true,
      },
    }),
  ],
  // 标记外部依赖
  external: ['react', 'react-dom'],

  // 除非指定，否则将所有模块视为无副作用
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  },
};
```

### Vite 配置

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // 生产环境默认启用 Tree Shaking
    minify: 'terser',
    terserOptions: {
      compress: {
        dead_code: true,
        drop_console: true,
      },
    },
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
      },
    },
  },
  // 优化依赖
  optimizeDeps: {
    include: ['lodash-es'],
  },
});
```

### Package.json sideEffects

`sideEffects` 字段告诉打包器哪些文件有副作用：

```json
{
  "name": "my-library",
  "version": "1.0.0",
  "sideEffects": false
}
```

```json
{
  "name": "my-library",
  "version": "1.0.0",
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfills.js",
    "./src/global-styles.js"
  ]
}
```

## 编写可 Tree Shake 的代码

### 导出模式

```javascript
// 好：命名导出（可 Tree Shake）
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }
export function multiply(a, b) { return a * b; }

// 差：使用对象的默认导出（不可 Tree Shake）
export default {
  add(a, b) { return a + b; },
  subtract(a, b) { return a - b; },
  multiply(a, b) { return a * b; },
};

// 差：命名空间重导出在某些打包器中会阻止 Tree Shaking
export * from './math';
```

### 避免副作用

```javascript
// 差：模块级别的副作用
let cache = {};
console.log('模块已初始化');
window.MyLib = {};

export function getValue(key) {
  return cache[key];
}

// 好：纯模块与延迟初始化
let cache;

function getCache() {
  if (!cache) cache = {};
  return cache;
}

export function getValue(key) {
  return getCache()[key];
}

export function setValue(key, value) {
  getCache()[key] = value;
}
```

### 类的注意事项

```javascript
// 类可能很棘手 - 静态成员和装饰器
// 可能导致副作用

// 差：静态初始化是副作用
class MyService {
  static instance = new MyService(); // 副作用！
  static config = loadConfig();      // 副作用！
}

// 好：延迟初始化
class MyService {
  static #instance;

  static getInstance() {
    if (!MyService.#instance) {
      MyService.#instance = new MyService();
    }
    return MyService.#instance;
  }
}

// 差：装饰器通常会阻止 Tree Shaking
@injectable()
class UserService {
  // ...
}

// 好：手动注入
class UserService {
  // ...
}
container.register(UserService);
```

### 重导出模式

```javascript
// index.js - 库入口点

// 好：命名重导出
export { Button } from './components/Button';
export { Input } from './components/Input';
export { Modal } from './components/Modal';

// 可接受：导出全部（在现代打包器中有效）
export * from './components/Button';
export * from './components/Input';

// 差：导入后作为对象重导出
import { Button } from './components/Button';
import { Input } from './components/Input';
export const Components = { Button, Input }; // 不可 Tree Shake！

// 差：动态重导出
const components = {};
['Button', 'Input'].forEach(name => {
  components[name] = require(`./components/${name}`);
});
export default components;
```

## 常见的 Tree Shaking 阻断因素

### 1. CommonJS 模块

```javascript
// CommonJS 会破坏 Tree Shaking
const { pick } = require('lodash');  // 包含完整 lodash

// 使用 ES 模块版本
import { pick } from 'lodash-es';    // 只包含 pick
```

### 2. 带变量的动态导入

```javascript
// 差：无法静态分析
const moduleName = getModuleName();
import(moduleName);

// 差：带变量的模板字面量
import(`./modules/${name}.js`);

// 好：静态字符串或有限模式
import('./modules/userModule.js');

// 可接受：已知的模块集合（魔法注释）
const module = await import(
  /* webpackInclude: /\.json$/ */
  /* webpackChunkName: "locale-[request]" */
  `./locales/${locale}.json`
);
```

### 3. Babel/TypeScript 转换

```javascript
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', {
      // 关键：不要将 ES 模块转换为 CommonJS
      modules: false,
    }],
    ['@babel/preset-typescript', {
      // 保持 ES 模块
      allowDeclareFields: true,
    }],
  ],
};

// tsconfig.json
{
  "compilerOptions": {
    // 保持 ES 模块
    "module": "ESNext",
    "moduleResolution": "bundler",
    // 不转换为 CommonJS
    "esModuleInterop": true
  }
}
```

### 4. 从命名空间导入访问属性

```javascript
// 差：命名空间导入会阻止 Tree Shaking
import * as utils from './utils';
console.log(utils.formatDate(new Date()));

// 好：命名导入
import { formatDate } from './utils';
console.log(formatDate(new Date()));
```

### 5. 为副作用而导入

```javascript
// 差：仅为副作用导入会保留整个模块
import './analytics';
import 'normalize.css';

// 如果模块有 sideEffects: false，它可能会被移除！
// 解决方案：使用正确的 sideEffects 配置

// 好：明确标识副作用导入
// 在打包器配置中，确保这些不被 Tree Shake
```

## 特定库的模式

### Lodash

```javascript
// 差：默认导入（即使用 lodash-es）
import _ from 'lodash-es';
_.debounce(fn, 300);

// 好：从 lodash-es 命名导入
import { debounce, throttle } from 'lodash-es';
debounce(fn, 300);

// 好：直接路径导入（也适用于普通 lodash）
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

// 替代方案：使用 babel-plugin-lodash
// .babelrc
{
  "plugins": ["lodash"]
}
// 然后这样写就可以了：
import { debounce } from 'lodash';
```

### Date-fns

```javascript
// 好：命名导入（已经是 ES 模块）
import { format, parseISO, addDays } from 'date-fns';

// 每个函数约 1KB 对比完整库约 30KB
```

### RxJS

```javascript
// 差：导入所有
import * as Rx from 'rxjs';

// 好：从特定路径导入
import { Observable, Subject } from 'rxjs';
import { map, filter, debounceTime } from 'rxjs/operators';

// 更好：管道操作符（现代 RxJS）
import { map, filter } from 'rxjs';
source$.pipe(
  filter(x => x > 0),
  map(x => x * 2)
);
```

### Material UI / MUI

```javascript
// 差：从根路径命名导入（可能导致问题）
import { Button, TextField, Dialog } from '@mui/material';

// 好：路径导入（保证 Tree Shaking）
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';

// 或使用 babel-plugin-import
{
  "plugins": [
    ["import", {
      "libraryName": "@mui/material",
      "libraryDirectory": "",
      "camel2DashComponentName": false
    }]
  ]
}
```

### Ant Design

```javascript
// 使用 babel-plugin-import 自动路径转换
{
  "plugins": [
    ["import", {
      "libraryName": "antd",
      "libraryDirectory": "es",
      "style": "css"
    }]
  ]
}

// 然后这样写：
import { Button, Table } from 'antd';

// 会变成：
import Button from 'antd/es/button';
import 'antd/es/button/style/css';
import Table from 'antd/es/table';
import 'antd/es/table/style/css';
```

## 分析包内容

### Webpack Bundle Analyzer

```javascript
// webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-report.html',
    }),
  ],
};
```

### Source Map Explorer

```bash
# 安装
npm install -g source-map-explorer

# 生成 source map 并分析
npm run build
source-map-explorer dist/main.*.js
```

### Bundlephobia

安装前检查包大小：
- [bundlephobia.com](https://bundlephobia.com)
- 显示压缩 + gzip 后大小
- 显示是否可 Tree Shake
- 显示下载时间估算

### 自定义分析脚本

```javascript
// analyze-exports.js
const fs = require('fs');
const path = require('path');
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

function analyzeExports(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  const exports = [];

  traverse(ast, {
    ExportNamedDeclaration(path) {
      if (path.node.declaration) {
        if (path.node.declaration.declarations) {
          path.node.declaration.declarations.forEach(d => {
            exports.push({ name: d.id.name, type: 'variable' });
          });
        } else if (path.node.declaration.id) {
          exports.push({
            name: path.node.declaration.id.name,
            type: path.node.declaration.type,
          });
        }
      }
      path.node.specifiers.forEach(spec => {
        exports.push({ name: spec.exported.name, type: 'reexport' });
      });
    },
    ExportDefaultDeclaration() {
      exports.push({ name: 'default', type: 'default' });
    },
  });

  return exports;
}

// 使用
const exports = analyzeExports('./src/utils/index.js');
console.log('导出:', exports);
```

## 高级技术

### 纯函数注解

```javascript
// 告诉打包器函数没有副作用
const result = /*#__PURE__*/ createComponent();

// 在库代码中
export const Button = /*#__PURE__*/ React.memo(function Button(props) {
  return <button>{props.children}</button>;
});

// Terser/UglifyJS 会在未使用时移除这个
```

### package.json 中的条件导出

```json
{
  "name": "my-library",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    },
    "./utils": {
      "import": "./dist/esm/utils.js",
      "require": "./dist/cjs/utils.js"
    }
  },
  "sideEffects": false
}
```

### 构建可 Tree Shake 的库

```javascript
// rollup.config.js 用于库
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },
    {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
  plugins: [
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist/types',
    }),
  ],
  // 保留模块以获得更好的 Tree Shaking
  preserveModules: true,
  preserveModulesRoot: 'src',
};
```

### 代码分割 + Tree Shaking

```javascript
// 将动态导入与 Tree Shaking 结合
// 每个 chunk 只包含使用的导出

// routes.js
export const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard'),
  },
  {
    path: '/settings',
    component: () => import('./pages/Settings'),
  },
];

// Dashboard.js - 只有使用的导出包含在这个 chunk 中
import { LineChart, BarChart } from 'charts-library';
// charts-library 中的 PieChart 不会被包含
```

## 调试 Tree Shaking

### Webpack Stats

```javascript
// webpack.config.js
module.exports = {
  stats: {
    usedExports: true,
    providedExports: true,
    optimizationBailout: true, // 显示优化失败的原因
  },
};
```

### 检查导出是否被使用

```bash
# 使用详细统计信息构建
npx webpack --stats-used-exports --stats-provided-exports

# 查找类似这样的输出：
# [module] ./src/utils.js
#   [exports: formatDate, formatTime, formatCurrency]
#   [only some exports used: formatDate]
```

### 在输出中验证

```javascript
// 压缩前，查找这样的注释模式：
/* unused harmony export multiply */
function multiply(a, b) { return a * b; }

// 压缩后，这个函数应该消失
```

## 最佳实践

### 1. 到处使用 ES 模块

```javascript
// 库的 package.json
{
  "type": "module",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    }
  }
}
```

### 2. 定期审计依赖

```bash
# 检查依赖对包体积的影响
npx bundle-phobia-cli <package-name>

# 查找重复包
npx npm-dedupe

# 分析你的包
npx webpack-bundle-analyzer stats.json
```

### 3. 正确配置 sideEffects

```json
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfills.js"
  ]
}
```

### 4. 优先选择更小的替代品

| 重型库 | 轻量替代品 |
|--------|-----------|
| moment.js | date-fns, dayjs |
| lodash | lodash-es, 原生方法 |
| axios | fetch API, ky |
| jQuery | 原生 JS |
| underscore | 原生 ES6+ |

### 5. 使用 Import Cost 扩展

VS Code 扩展，内联显示导入大小：
```javascript
import { debounce } from 'lodash-es'; // 2.1KB (gzipped)
import moment from 'moment';           // 67KB (gzipped)
```

## 面试要点

### 常见问题

**问：什么是 Tree Shaking，它是如何工作的？**

答：Tree Shaking 是 JavaScript 模块的死代码消除。它的工作原理是：
1. 构建所有导入/导出的依赖图
2. 从入口点开始，标记实际使用的导出
3. 在打包期间移除未使用导出的代码
4. 需要 ES 模块，因为它们是可静态分析的

**问：为什么 Tree Shaking 对 CommonJS 不起作用？**

答：CommonJS 模块是动态的：
- `require()` 可以有条件地调用或使用变量
- `module.exports` 可以在运行时修改
- 导出在代码执行之前是未知的

ES 模块是静态的：
- 导入/导出必须在顶层
- 不能有条件或动态
- 结构在解析时就已知，无需执行

**问：什么是副作用，它们如何影响 Tree Shaking？**

答：副作用是仅通过导入模块就运行的代码：
- 控制台日志
- 全局变量修改
- Polyfills
- CSS 导入

如果模块有副作用，即使没有使用任何导出，也不能安全地移除它。package.json 中的 `sideEffects` 字段告诉打包器哪些文件是纯的。

**问：如何调试 Tree Shaking 问题？**

答：
1. 使用包分析器可视化包含的内容
2. 检查 webpack stats 的 `usedExports` 和 `optimizationBailout`
3. 在压缩前查找 `/* unused harmony export */` 注释
4. 验证 ES 模块格式在构建管道中保持不变
5. 检查 `sideEffects` 配置

### 性能检查清单

- [ ] 使用 ES 模块（`import`/`export`）而不是 CommonJS
- [ ] 配置 Babel/TypeScript 保留 ES 模块
- [ ] 设置 `sideEffects: false` 或列出特定文件
- [ ] 使用命名导出而不是带对象的默认导出
- [ ] 对有问题的库使用特定路径导入
- [ ] 定期使用可视化工具分析包
- [ ] 考虑重型依赖的更小替代品

## 总结

Tree Shaking 是现代 JavaScript 应用程序的关键优化技术。关键要点：

1. **需要 ES 模块**：静态结构使死代码分析成为可能
2. **标记副作用**：在 package.json 中正确使用 `sideEffects`
3. **编写纯代码**：避免模块级别的副作用
4. **使用命名导出**：比默认导出更好的 Tree Shaking
5. **分析包**：定期审计捕获回归
6. **配置构建工具**：确保保留 ES 模块

## 延伸阅读

- [Webpack Tree Shaking 指南](https://webpack.js.org/guides/tree-shaking/)
- [Rollup Tree Shaking](https://rollupjs.org/introduction/#tree-shaking)
- [ES Modules 深入解析](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/)
- [Webpack 中的 SideEffects](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free)
