---
title: Module System
description: Complete guide to JavaScript module system, ES Modules, CommonJS and dynamic imports
track: javascript
section: core
difficulty: intermediate
tags:
  - JavaScript
  - ES Modules
  - CommonJS
  - Modular Programming
status: imported
origin: old/src/content/docs/javascript/modules.en.md
divergence: 0.158
issues: []
legacy:
  category: JavaScript
  subcategory: Core Concepts
  order: 11
  lastUpdated: 2026-01-07
---

Modules are one of the most important features in modern JavaScript development. They allow you to break down your code into smaller, reusable pieces, making your codebase more maintainable, testable, and organized. We'll cover everything you need to know about JavaScript modules, from the fundamentals to advanced patterns.

## Why Modules Matter

Before modules became a standard part of JavaScript, developers relied on script tags and global variables to share code between files. This approach led to several problems:

- **Namespace pollution**: All variables lived in the global scope, leading to naming conflicts
- **Dependency management**: No clear way to declare which files depended on others
- **Code organization**: Difficult to structure large applications
- **Reusability**: Sharing code between projects was cumbersome

Modules solve these problems by providing:

- **Encapsulation**: Each module has its own scope
- **Explicit dependencies**: Imports clearly show what a module needs
- **Reusability**: Modules can be easily shared and reused
- **Maintainability**: Smaller, focused files are easier to understand and maintain

## ES Modules (ESM)

ES Modules are the official standard module system in JavaScript, introduced in ES6 (ES2015). They are now supported in all modern browsers and Node.js.

### Basic Export and Import

There are two types of exports: named exports and default exports.

#### Named Exports

Named exports allow you to export multiple values from a module. Each export must have a name.

```javascript
// math.js
export const PI = 3.14159;

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
```

You can also export at the end of the file:

```javascript
// utils.js
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export { formatDate, formatCurrency, capitalize };
```

#### Importing Named Exports

```javascript
// app.js
import { add, subtract, PI } from './math.js';

console.log(add(2, 3));      // 5
console.log(subtract(5, 2)); // 3
console.log(PI);             // 3.14159
```

You can rename imports using the `as` keyword:

```javascript
import { add as sum, subtract as minus } from './math.js';

console.log(sum(2, 3));   // 5
console.log(minus(5, 2)); // 3
```

#### Default Exports

Each module can have one default export. Default exports are useful when a module primarily exports a single value.

```javascript
// Logger.js
class Logger {
  constructor(prefix = '') {
    this.prefix = prefix;
  }

  log(message) {
    console.log(`${this.prefix}${message}`);
  }

  error(message) {
    console.error(`${this.prefix}ERROR: ${message}`);
  }

  warn(message) {
    console.warn(`${this.prefix}WARNING: ${message}`);
  }
}

export default Logger;
```

Importing a default export:

```javascript
// You can use any name when importing a default export
import Logger from './Logger.js';
import MyLogger from './Logger.js'; // Same thing, different name

const logger = new Logger('[App] ');
logger.log('Application started');
```

#### Combining Default and Named Exports

A module can have both a default export and named exports:

```javascript
// api.js
const API_BASE = 'https://api.example.com';

async function fetchData(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`);
  return response.json();
}

export async function getUser(id) {
  return fetchData(`/users/${id}`);
}

export async function getPosts(userId) {
  return fetchData(`/users/${userId}/posts`);
}

export { API_BASE };
export default fetchData;
```

Importing both:

```javascript
import fetchData, { getUser, getPosts, API_BASE } from './api.js';
```

### Import All (Namespace Import)

You can import all exports from a module as a namespace object:

```javascript
import * as MathUtils from './math.js';

console.log(MathUtils.PI);           // 3.14159
console.log(MathUtils.add(2, 3));    // 5
console.log(MathUtils.subtract(5, 2)); // 3
```

### Re-exporting

Modules can re-export values from other modules, which is useful for creating barrel files or aggregating exports:

```javascript
// shapes/circle.js
export const area = (radius) => Math.PI * radius ** 2;
export const circumference = (radius) => 2 * Math.PI * radius;

// shapes/rectangle.js
export const area = (width, height) => width * height;
export const perimeter = (width, height) => 2 * (width + height);

// shapes/index.js (barrel file)
export * as circle from './circle.js';
export * as rectangle from './rectangle.js';

// Alternative: rename to avoid conflicts
export { area as circleArea } from './circle.js';
export { area as rectangleArea } from './rectangle.js';
```

Using the barrel file:

```javascript
import { circle, rectangle } from './shapes/index.js';

console.log(circle.area(5));           // 78.54...
console.log(rectangle.area(4, 6));     // 24
```

### ES Modules in the Browser

To use ES Modules in the browser, add `type="module"` to your script tag:

```html
<!DOCTYPE html>
<html>
<head>
  <title>ES Modules Example</title>
</head>
<body>
  <script type="module">
    import { formatDate } from './utils.js';
    console.log(formatDate(new Date()));
  </script>

  <!-- Or reference an external module -->
  <script type="module" src="./app.js"></script>
</body>
</html>
```

Key characteristics of ES Modules in browsers:

- Modules are automatically in strict mode
- Modules have their own scope (no global pollution)
- Modules are loaded asynchronously
- Each module is only executed once, even if imported multiple times
- `this` is `undefined` at the top level (not `window`)

### ES Modules in Node.js

Node.js supports ES Modules in several ways:

1. **Use `.mjs` extension**: Files with `.mjs` extension are treated as ES Modules

2. **Set `"type": "module"` in package.json**: All `.js` files in the package are treated as ES Modules

```json
{
  "name": "my-package",
  "type": "module",
  "version": "1.0.0"
}
```

3. **Use `.cjs` for CommonJS in a module package**: If your package uses `"type": "module"`, you can still use CommonJS by naming files with `.cjs` extension

## CommonJS (CJS)

CommonJS is the module system originally developed for Node.js. While ES Modules are now the standard, CommonJS is still widely used, especially in older Node.js projects and npm packages.

### Exporting in CommonJS

CommonJS uses `module.exports` and `exports` to export values:

```javascript
// math.js
const PI = 3.14159;

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

// Export individual properties
module.exports.PI = PI;
module.exports.add = add;
module.exports.subtract = subtract;

// Or use the exports shorthand
exports.multiply = (a, b) => a * b;
```

You can also export an entire object:

```javascript
// config.js
module.exports = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
};
```

Or export a single function or class:

```javascript
// Logger.js
class Logger {
  log(message) {
    console.log(message);
  }
}

module.exports = Logger;
```

### Importing in CommonJS

CommonJS uses `require()` to import modules:

```javascript
// app.js
const { add, subtract, PI } = require('./math.js');
const config = require('./config.js');
const Logger = require('./Logger.js');

console.log(add(2, 3));        // 5
console.log(config.apiUrl);    // 'https://api.example.com'

const logger = new Logger();
logger.log('Hello');
```

### Understanding exports vs module.exports

A common source of confusion is the difference between `exports` and `module.exports`:

```javascript
// exports is a reference to module.exports
console.log(exports === module.exports); // true

// Adding properties to exports works
exports.foo = 'bar';
console.log(module.exports.foo); // 'bar'

// But reassigning exports breaks the reference
exports = { baz: 'qux' }; // This doesn't work!
console.log(module.exports.baz); // undefined

// Always use module.exports for reassignment
module.exports = { baz: 'qux' }; // This works
```

### CommonJS vs ES Modules Key Differences

| Feature | CommonJS | ES Modules |
|---------|----------|------------|
| Syntax | `require()` / `module.exports` | `import` / `export` |
| Loading | Synchronous | Asynchronous |
| Evaluation | Runtime | Static (compile-time) |
| Top-level await | Not supported | Supported |
| Tree shaking | Difficult | Supported |
| Browser support | Requires bundler | Native |
| `this` at top level | `exports` | `undefined` |

## Dynamic Imports

Dynamic imports allow you to load modules on demand at runtime. This is useful for code splitting and lazy loading.

### Basic Dynamic Import

```javascript
// Dynamic import returns a Promise
async function loadModule() {
  const module = await import('./heavy-module.js');
  module.doSomething();
}

// Or using .then()
import('./analytics.js').then((module) => {
  module.trackPageView();
});
```

### Practical Use Cases

#### Conditional Loading

```javascript
async function loadLocale(language) {
  let translations;

  switch (language) {
    case 'es':
      translations = await import('./locales/es.js');
      break;
    case 'fr':
      translations = await import('./locales/fr.js');
      break;
    default:
      translations = await import('./locales/en.js');
  }

  return translations.default;
}
```

#### Feature Detection

```javascript
async function initializeApp() {
  if ('IntersectionObserver' in window) {
    const { LazyLoader } = await import('./lazy-loader.js');
    new LazyLoader().init();
  } else {
    // Load polyfill first
    await import('./intersection-observer-polyfill.js');
    const { LazyLoader } = await import('./lazy-loader.js');
    new LazyLoader().init();
  }
}
```

#### Route-Based Code Splitting

```javascript
const routes = {
  '/': () => import('./pages/Home.js'),
  '/about': () => import('./pages/About.js'),
  '/contact': () => import('./pages/Contact.js'),
  '/dashboard': () => import('./pages/Dashboard.js')
};

async function navigate(path) {
  const loadPage = routes[path] || routes['/'];
  const page = await loadPage();
  renderPage(page.default);
}
```

#### Loading on User Interaction

```javascript
document.getElementById('chartButton').addEventListener('click', async () => {
  // Only load the charting library when needed
  const { Chart } = await import('chart.js');

  const chart = new Chart(canvas, {
    type: 'bar',
    data: chartData
  });
});
```

### Dynamic Import with Default and Named Exports

```javascript
// module.js
export const helper = () => 'helper';
export default class MainClass {}

// Importing dynamically
async function loadModule() {
  const module = await import('./module.js');

  const MainClass = module.default;
  const { helper } = module;

  // Or destructure directly
  const { default: Main, helper: helperFn } = await import('./module.js');
}
```

## Module Resolution

Understanding how JavaScript resolves module paths is crucial for working with modules effectively.

### Relative Paths

Relative paths start with `./` or `../`:

```javascript
import { utils } from './utils.js';        // Same directory
import { config } from '../config.js';     // Parent directory
import { api } from './services/api.js';   // Subdirectory
```

### Bare Specifiers

Bare specifiers (without path prefix) refer to packages in `node_modules`:

```javascript
import React from 'react';
import { useState } from 'react';
import lodash from 'lodash';
```

### Node.js Resolution Algorithm

Node.js follows a specific algorithm to resolve modules:

1. **Core modules**: Built-in modules like `fs`, `path`, `http`
2. **File modules**: Paths starting with `/`, `./`, or `../`
3. **Package modules**: Looks in `node_modules` directories

For package modules, Node.js:
1. Looks for `node_modules` in the current directory
2. If not found, moves to the parent directory
3. Continues until reaching the filesystem root

### Package Entry Points

Modern packages can define multiple entry points in `package.json`:

```json
{
  "name": "my-package",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./utils": {
      "import": "./dist/utils.mjs",
      "require": "./dist/utils.cjs"
    }
  }
}
```

This allows:

```javascript
import pkg from 'my-package';           // Main entry
import utils from 'my-package/utils';   // Utils subpath
```

### Import Maps (Browser)

Import maps allow you to control module resolution in browsers:

```html
<script type="importmap">
{
  "imports": {
    "lodash": "https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/lodash.js",
    "utils/": "./src/utils/"
  }
}
</script>

<script type="module">
  import _ from 'lodash';
  import { format } from 'utils/format.js';
</script>
```

## Module Bundlers

Module bundlers transform your source code into optimized bundles for production. They handle module resolution, code splitting, and various optimizations.

### Popular Bundlers

#### Webpack

The most feature-rich and widely used bundler:

```javascript
// webpack.config.js
import path from 'path';

export default {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(import.meta.dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      }
    ]
  }
};
```

#### Vite

A modern, fast build tool that leverages native ES Modules:

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        admin: './admin.html'
      }
    }
  }
});
```

#### Rollup

Focused on ES Modules and tree shaking:

```javascript
// rollup.config.js
export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'esm'
  }
};
```

#### esbuild

Extremely fast bundler written in Go:

```javascript
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'esm'
});
```

### Tree Shaking

Tree shaking is the process of eliminating dead code. ES Modules enable effective tree shaking due to their static structure:

```javascript
// utils.js
export function used() {
  return 'This will be included';
}

export function unused() {
  return 'This will be removed by tree shaking';
}

// app.js
import { used } from './utils.js';
console.log(used());
// unused() is never imported, so it's removed from the bundle
```

For tree shaking to work effectively:

- Use ES Modules (not CommonJS)
- Avoid side effects in modules
- Mark packages as side-effect-free in `package.json`:

```json
{
  "name": "my-library",
  "sideEffects": false
}
```

Or specify files with side effects:

```json
{
  "sideEffects": ["*.css", "./src/polyfills.js"]
}
```

### Code Splitting Strategies

#### Entry Point Splitting

Create separate bundles for different entry points:

```javascript
// webpack.config.js
export default {
  entry: {
    main: './src/index.js',
    admin: './src/admin.js',
    vendor: ['react', 'react-dom']
  }
};
```

#### Dynamic Import Splitting

Bundlers automatically create separate chunks for dynamic imports:

```javascript
// Each dynamic import creates a separate chunk
const Home = () => import('./pages/Home.js');
const About = () => import('./pages/About.js');
const Contact = () => import('./pages/Contact.js');
```

## Circular Dependencies

Circular dependencies occur when two or more modules depend on each other. While ES Modules handle this better than CommonJS, it's important to understand and avoid them.

### How Circular Dependencies Work

```javascript
// a.js
import { b } from './b.js';
console.log('a.js: importing from b.js');

export const a = 'Module A';

export function useB() {
  console.log('Using B:', b);
}

// b.js
import { a } from './a.js';
console.log('b.js: importing from a.js');

export const b = 'Module B';

export function useA() {
  console.log('Using A:', a);
}

// main.js
import { useB } from './a.js';
import { useA } from './b.js';

useB(); // Using B: Module B
useA(); // Using A: Module A
```

### Avoiding Circular Dependencies

**1. Restructure Code**: Extract shared dependencies into a separate module:

```javascript
// shared.js
export const CONFIG = {
  timeout: 5000
};

// a.js
import { CONFIG } from './shared.js';
export function doSomethingA() {
  console.log(CONFIG.timeout);
}

// b.js
import { CONFIG } from './shared.js';
export function doSomethingB() {
  console.log(CONFIG.timeout);
}
```

**2. Use Dependency Injection**: Pass dependencies as parameters:

```javascript
// logger.js
export function createLogger(formatter) {
  return {
    log(message) {
      console.log(formatter(message));
    }
  };
}

// formatter.js
export function createFormatter() {
  return function format(message) {
    return `[${new Date().toISOString()}] ${message}`;
  };
}

// app.js
import { createLogger } from './logger.js';
import { createFormatter } from './formatter.js';

const formatter = createFormatter();
const logger = createLogger(formatter);
```

**3. Lazy Imports**: Use dynamic imports to break the circular dependency:

```javascript
// a.js
export const a = 'Module A';

export async function useB() {
  const { b } = await import('./b.js');
  console.log('Using B:', b);
}

// b.js
export const b = 'Module B';

export async function useA() {
  const { a } = await import('./a.js');
  console.log('Using A:', a);
}
```

## Interoperability Between Module Systems

### Using CommonJS in ES Modules

Node.js allows importing CommonJS from ES Modules:

```javascript
// math.cjs (CommonJS)
module.exports = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b
};

// app.js (ES Module)
import math from './math.cjs'; // Default import for module.exports
console.log(math.add(2, 3)); // 5

// Named imports work for simple exports
// utils.cjs
exports.double = (n) => n * 2;
exports.triple = (n) => n * 3;

// app.js
import { double, triple } from './utils.cjs';
console.log(double(5)); // 10
```

### Using ES Modules in CommonJS

ES Modules cannot be synchronously required in CommonJS:

```javascript
// es-module.js
export const value = 42;

// commonjs-file.cjs
const { value } = require('./es-module.js'); // Error!

// Use dynamic import instead
(async () => {
  const { value } = await import('./es-module.js');
  console.log(value); // 42
})();
```

### Dual Package Support

Create packages that work with both module systems:

```json
{
  "name": "my-library",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

## Best Practices

### Use ES Modules for New Code

Prefer ES Modules over CommonJS for new projects. They offer better static analysis, tree shaking, and are the standard.

### One Module, One Purpose

Each module should have a single, well-defined responsibility:

```javascript
// Good: Focused module
// validation.js
export function isEmail(value) { /* ... */ }
export function isPhone(value) { /* ... */ }
export function isRequired(value) { /* ... */ }

// Bad: Kitchen sink module
// utils.js
export function isEmail(value) { /* ... */ }
export function formatDate(date) { /* ... */ }
export function fetchData(url) { /* ... */ }
export function calculateTax(amount) { /* ... */ }
```

### Use Barrel Files Thoughtfully

Barrel files (`index.js`) can simplify imports but may hinder tree shaking:

```javascript
// components/index.js
export { Button } from './Button.js';
export { Input } from './Input.js';
export { Modal } from './Modal.js';

// Usage
import { Button, Input } from './components';
```

Be cautious with deep re-exports, as they can increase bundle size.

### Prefer Named Exports

Named exports make refactoring easier and provide better IDE support:

```javascript
// Preferred
export function processData(data) { /* ... */ }

// Use default exports for main module exports
export default class DataProcessor { /* ... */ }
```

### Avoid Circular Dependencies

Restructure your code to avoid them:

```javascript
// Bad: Circular dependency
// a.js
import { b } from './b.js';
export const a = 'a' + b;

// b.js
import { a } from './a.js';
export const b = 'b' + a;

// Good: Extract shared code to a third module
// shared.js
export const shared = 'shared';

// a.js
import { shared } from './shared.js';
export const a = 'a' + shared;

// b.js
import { shared } from './shared.js';
export const b = 'b' + shared;
```

### Use Import Aliases for Deep Paths

Configure your bundler to use path aliases:

```javascript
// Instead of
import { Button } from '../../../components/Button.js';

// Use aliases
import { Button } from '@/components/Button.js';
```

### Lazy Load Heavy Dependencies

Use dynamic imports for large libraries that aren't immediately needed:

```javascript
async function generatePDF() {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  // Generate PDF...
}
```

### Always Use File Extensions in Browsers

```javascript
// Correct
import { helper } from './helper.js';

// Will fail in browsers
import { helper } from './helper';
```

### Group and Organize Imports

```javascript
// External dependencies
import React from 'react';
import { Router } from 'express';

// Internal modules
import { config } from './config.js';
import { logger } from './logger.js';

// Relative imports
import { helper } from '../utils/helper.js';
import { validator } from './validator.js';
```

### Handle Import Errors Gracefully

```javascript
async function loadPlugin(name) {
  try {
    const plugin = await import(`./plugins/${name}.js`);
    return plugin.default;
  } catch (error) {
    console.error(`Failed to load plugin: ${name}`, error);
    return null;
  }
}
```

## Conclusion

JavaScript modules are fundamental to modern web development. Understanding both ES Modules and CommonJS, knowing when to use dynamic imports, and leveraging bundlers effectively will help you build maintainable, performant applications.

Key takeaways:

- **ES Modules** are the standard; use them for new projects
- **CommonJS** is still relevant for Node.js compatibility
- **Dynamic imports** enable code splitting and lazy loading
- **Bundlers** optimize your code for production
- **Tree shaking** removes unused code when using ES Modules
- Follow best practices to keep your codebase clean and efficient

As the JavaScript ecosystem continues to evolve, modules remain at the core of how we structure and share code.
