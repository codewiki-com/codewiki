---
title: Tree Shaking Principles and Practices
description: Master tree shaking to eliminate dead code and optimize JavaScript bundle sizes
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Tree Shaking
  - Dead Code Elimination
  - Bundle Optimization
  - ES Modules
  - Webpack
  - Rollup
status: imported
origin: old/src/content/docs/javascript/tree-shaking.en.md
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

Tree shaking is a dead code elimination technique that removes unused exports from JavaScript bundles. The term comes from the mental model of your application as a tree - when you "shake" the tree, the dead leaves (unused code) fall off. This optimization is essential for modern JavaScript applications, significantly reducing bundle sizes and improving load times.

## Why Tree Shaking Matters

Modern JavaScript applications often import entire libraries when they only need a few functions. Without tree shaking, your bundle includes everything:

```javascript
// Without tree shaking: entire lodash (~70KB minified) is bundled
import _ from 'lodash';
const result = _.debounce(fn, 300);

// With tree shaking: only debounce (~2KB) is included
import { debounce } from 'lodash-es';
const result = debounce(fn, 300);
```

### Impact on Bundle Size

| Library | Full Import | Tree-Shaken Import | Savings |
|---------|-------------|-------------------|---------|
| lodash | ~70KB | ~2KB (single fn) | ~97% |
| date-fns | ~30KB | ~1KB (single fn) | ~97% |
| RxJS | ~90KB | ~10KB (core ops) | ~89% |
| Material UI | ~300KB | ~50KB (few components) | ~83% |

## How Tree Shaking Works

### ES Modules Static Analysis

Tree shaking relies on the static nature of ES modules. Unlike CommonJS, ES modules have a statically analyzable structure:

```javascript
// ES Modules - Statically analyzable
import { used } from './module';
export const something = used();

// CommonJS - NOT statically analyzable
const { used } = require('./module');
module.exports.something = used();

// Why? ES imports/exports are:
// 1. Top-level only (not inside conditions/functions)
// 2. String literals only (not dynamic)
// 3. Immutable bindings (not reassignable)
```

### The Tree Shaking Process

```
Source Code        Analysis           Marking          Removal
    │                 │                  │                │
    ▼                 ▼                  ▼                ▼
┌─────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│ entry.js│ -> │ Build     │ -> │ Mark used │ -> │ Remove    │
│         │    │ Dependency│    │ exports   │    │ unused    │
│ module1 │    │ Graph     │    │           │    │ code      │
│ module2 │    │           │    │           │    │           │
└─────────┘    └───────────┘    └───────────┘    └───────────┘
```

**Step 1: Build Dependency Graph**
```javascript
// entry.js
import { sum } from './math';
console.log(sum(1, 2));

// math.js
export function sum(a, b) { return a + b; }
export function multiply(a, b) { return a * b; }  // Unused!
export function divide(a, b) { return a / b; }    // Unused!
```

**Step 2: Mark Used Exports**
```
entry.js
  └── imports 'sum' from ./math.js
        └── sum() is USED
        └── multiply() is UNUSED
        └── divide() is UNUSED
```

**Step 3: Remove Unused Code**
```javascript
// Final bundle (simplified)
function sum(a, b) { return a + b; }
console.log(sum(1, 2));
// multiply and divide are eliminated!
```

### Side Effects Detection

Side effects are code that executes when a module is imported, regardless of what's used:

```javascript
// module-with-side-effects.js
console.log('Module loaded!');  // Side effect!
window.globalVar = 'value';     // Side effect!
Array.prototype.myMethod = fn;  // Side effect!

export function pureFunction() {
  return 42;
}
```

Even if `pureFunction` is never used, bundlers must keep the side effects. This is why the `sideEffects` field exists in `package.json`.

## Configuring Tree Shaking

### Webpack Configuration

```javascript
// webpack.config.js
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production', // Enables tree shaking automatically
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    // Enable tree shaking
    usedExports: true,

    // Enable minification (removes dead code)
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            dead_code: true,
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log'], // Treat as pure (removable)
          },
          mangle: true,
        },
      }),
    ],

    // Additional optimizations
    sideEffects: true, // Respect package.json sideEffects
    providedExports: true,
    concatenateModules: true, // Scope hoisting
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
                modules: false, // Keep ES modules for tree shaking!
              }],
            ],
          },
        },
      },
    ],
  },
};
```

### Rollup Configuration

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
    commonjs(), // Convert CommonJS to ES modules
    terser({
      compress: {
        dead_code: true,
        unused: true,
      },
    }),
  ],
  // Mark external dependencies
  external: ['react', 'react-dom'],

  // Treat all as side-effect free unless specified
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  },
};
```

### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Tree shaking is enabled by default in production
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
  // Optimize dependencies
  optimizeDeps: {
    include: ['lodash-es'],
  },
});
```

### Package.json sideEffects

The `sideEffects` field tells bundlers which files have side effects:

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

## Writing Tree-Shakeable Code

### Export Patterns

```javascript
// GOOD: Named exports (tree-shakeable)
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }
export function multiply(a, b) { return a * b; }

// BAD: Default export with object (not tree-shakeable)
export default {
  add(a, b) { return a + b; },
  subtract(a, b) { return a - b; },
  multiply(a, b) { return a * b; },
};

// BAD: Namespace re-export blocks tree shaking in some bundlers
export * from './math';
```

### Avoid Side Effects

```javascript
// BAD: Side effects at module level
let cache = {};
console.log('Module initialized');
window.MyLib = {};

export function getValue(key) {
  return cache[key];
}

// GOOD: Pure module with lazy initialization
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

### Class Considerations

```javascript
// Classes can be tricky - static members and decorators
// may cause side effects

// BAD: Static initialization is a side effect
class MyService {
  static instance = new MyService(); // Side effect!
  static config = loadConfig();      // Side effect!
}

// GOOD: Lazy initialization
class MyService {
  static #instance;

  static getInstance() {
    if (!MyService.#instance) {
      MyService.#instance = new MyService();
    }
    return MyService.#instance;
  }
}

// BAD: Decorators often prevent tree shaking
@injectable()
class UserService {
  // ...
}

// GOOD: Manual injection
class UserService {
  // ...
}
container.register(UserService);
```

### Re-export Patterns

```javascript
// index.js - Library entry point

// GOOD: Named re-exports
export { Button } from './components/Button';
export { Input } from './components/Input';
export { Modal } from './components/Modal';

// ACCEPTABLE: Re-export all (works in modern bundlers)
export * from './components/Button';
export * from './components/Input';

// BAD: Importing and re-exporting as object
import { Button } from './components/Button';
import { Input } from './components/Input';
export const Components = { Button, Input }; // Not tree-shakeable!

// BAD: Dynamic re-exports
const components = {};
['Button', 'Input'].forEach(name => {
  components[name] = require(`./components/${name}`);
});
export default components;
```

## Common Tree Shaking Blockers

### 1. CommonJS Modules

```javascript
// CommonJS breaks tree shaking
const { pick } = require('lodash');  // Full lodash included

// Use ES module version
import { pick } from 'lodash-es';    // Only pick included
```

### 2. Dynamic Imports with Variables

```javascript
// BAD: Can't statically analyze
const moduleName = getModuleName();
import(moduleName);

// BAD: Template literal with variable
import(`./modules/${name}.js`);

// GOOD: Static string or limited patterns
import('./modules/userModule.js');

// ACCEPTABLE: Known set of modules (magic comments)
const module = await import(
  /* webpackInclude: /\.json$/ */
  /* webpackChunkName: "locale-[request]" */
  `./locales/${locale}.json`
);
```

### 3. Babel/TypeScript Transformations

```javascript
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', {
      // CRITICAL: Don't transform ES modules to CommonJS
      modules: false,
    }],
    ['@babel/preset-typescript', {
      // Keep ES modules
      allowDeclareFields: true,
    }],
  ],
};

// tsconfig.json
{
  "compilerOptions": {
    // Keep ES modules
    "module": "ESNext",
    "moduleResolution": "bundler",
    // Don't transform to CommonJS
    "esModuleInterop": true
  }
}
```

### 4. Accessing Properties from Namespace Imports

```javascript
// BAD: Namespace import defeats tree shaking
import * as utils from './utils';
console.log(utils.formatDate(new Date()));

// GOOD: Named import
import { formatDate } from './utils';
console.log(formatDate(new Date()));
```

### 5. Evaluating Imports for Side Effects

```javascript
// BAD: Import just for side effects keeps entire module
import './analytics';
import 'normalize.css';

// If the module has sideEffects: false, it might be removed!
// Solution: Use proper sideEffects configuration

// GOOD: Be explicit about side-effect imports
// In your bundler config, ensure these aren't tree-shaken
```

## Library-Specific Patterns

### Lodash

```javascript
// BAD: Default import (even with lodash-es)
import _ from 'lodash-es';
_.debounce(fn, 300);

// GOOD: Named import from lodash-es
import { debounce, throttle } from 'lodash-es';
debounce(fn, 300);

// GOOD: Direct path import (works with regular lodash too)
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

// Alternative: Use babel-plugin-lodash
// .babelrc
{
  "plugins": ["lodash"]
}
// Then this works:
import { debounce } from 'lodash';
```

### Date-fns

```javascript
// GOOD: Named imports (already ES modules)
import { format, parseISO, addDays } from 'date-fns';

// Each function is ~1KB vs ~30KB for full library
```

### RxJS

```javascript
// BAD: Import everything
import * as Rx from 'rxjs';

// GOOD: Import from specific paths
import { Observable, Subject } from 'rxjs';
import { map, filter, debounceTime } from 'rxjs/operators';

// BETTER: Pipe operators (modern RxJS)
import { map, filter } from 'rxjs';
source$.pipe(
  filter(x => x > 0),
  map(x => x * 2)
);
```

### Material UI / MUI

```javascript
// BAD: Named imports from root (can cause issues)
import { Button, TextField, Dialog } from '@mui/material';

// GOOD: Path imports (guaranteed tree shaking)
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';

// Or use babel-plugin-import
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
// Use babel-plugin-import for automatic path conversion
{
  "plugins": [
    ["import", {
      "libraryName": "antd",
      "libraryDirectory": "es",
      "style": "css"
    }]
  ]
}

// Then this:
import { Button, Table } from 'antd';

// Becomes:
import Button from 'antd/es/button';
import 'antd/es/button/style/css';
import Table from 'antd/es/table';
import 'antd/es/table/style/css';
```

## Analyzing Bundle Contents

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
# Install
npm install -g source-map-explorer

# Generate source maps and analyze
npm run build
source-map-explorer dist/main.*.js
```

### Bundlephobia

Check package sizes before installing:
- [bundlephobia.com](https://bundlephobia.com)
- Shows minified + gzipped size
- Shows tree-shakeability
- Shows download time estimates

### Custom Analysis Script

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

// Usage
const exports = analyzeExports('./src/utils/index.js');
console.log('Exports:', exports);
```

## Advanced Techniques

### Pure Function Annotations

```javascript
// Tell bundlers a function has no side effects
const result = /*#__PURE__*/ createComponent();

// In library code
export const Button = /*#__PURE__*/ React.memo(function Button(props) {
  return <button>{props.children}</button>;
});

// Terser/UglifyJS will remove this if unused
```

### Conditional Exports in package.json

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

### Building Tree-Shakeable Libraries

```javascript
// rollup.config.js for a library
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
  // Preserve modules for better tree shaking
  preserveModules: true,
  preserveModulesRoot: 'src',
};
```

### Code Splitting + Tree Shaking

```javascript
// Combine dynamic imports with tree shaking
// Only the used exports from each chunk are included

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

// Dashboard.js - only used exports included in this chunk
import { LineChart, BarChart } from 'charts-library';
// PieChart from charts-library is NOT included
```

## Debugging Tree Shaking

### Webpack Stats

```javascript
// webpack.config.js
module.exports = {
  stats: {
    usedExports: true,
    providedExports: true,
    optimizationBailout: true, // Shows why optimization failed
  },
};
```

### Check If Export Is Used

```bash
# Build with verbose stats
npx webpack --stats-used-exports --stats-provided-exports

# Look for output like:
# [module] ./src/utils.js
#   [exports: formatDate, formatTime, formatCurrency]
#   [only some exports used: formatDate]
```

### Verify in Output

```javascript
// Before minification, look for this comment pattern:
/* unused harmony export multiply */
function multiply(a, b) { return a * b; }

// After minification, this function should be gone
```

## Best Practices

### 1. Use ES Modules Everywhere

```javascript
// Library package.json
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

### 2. Audit Dependencies Regularly

```bash
# Check bundle impact of dependencies
npx bundle-phobia-cli <package-name>

# Find duplicate packages
npx npm-dedupe

# Analyze your bundle
npx webpack-bundle-analyzer stats.json
```

### 3. Configure sideEffects Properly

```json
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfills.js"
  ]
}
```

### 4. Prefer Smaller Alternatives

| Heavy Library | Lightweight Alternative |
|---------------|------------------------|
| moment.js | date-fns, dayjs |
| lodash | lodash-es, native methods |
| axios | fetch API, ky |
| jQuery | vanilla JS |
| underscore | native ES6+ |

### 5. Use Import Cost Extension

VS Code extension that shows import size inline:
```javascript
import { debounce } from 'lodash-es'; // 2.1KB (gzipped)
import moment from 'moment';           // 67KB (gzipped)
```

## Interview Key Points

### Common Questions

**Q: What is tree shaking and how does it work?**

A: Tree shaking is dead code elimination for JavaScript modules. It works by:
1. Building a dependency graph of all imports/exports
2. Starting from entry points, marking which exports are actually used
3. Removing code for unused exports during bundling
4. Requires ES modules because they're statically analyzable

**Q: Why doesn't tree shaking work with CommonJS?**

A: CommonJS modules are dynamic:
- `require()` can be called conditionally or with variables
- `module.exports` can be modified at runtime
- Exports aren't known until code executes

ES modules are static:
- Imports/exports must be at top level
- Can't be conditional or dynamic
- Structure known at parse time before execution

**Q: What are side effects and how do they affect tree shaking?**

A: Side effects are code that runs just by importing a module:
- Console logs
- Global variable modifications
- Polyfills
- CSS imports

If a module has side effects, it can't be safely removed even if no exports are used. The `sideEffects` field in package.json tells bundlers which files are pure.

**Q: How do you debug tree shaking issues?**

A:
1. Use bundle analyzer to visualize what's included
2. Check webpack stats for `usedExports` and `optimizationBailout`
3. Look for `/* unused harmony export */` comments before minification
4. Verify ES module format is preserved through build pipeline
5. Check `sideEffects` configuration

### Performance Checklist

- [ ] Use ES modules (`import`/`export`) not CommonJS
- [ ] Configure Babel/TypeScript to preserve ES modules
- [ ] Set `sideEffects: false` or list specific files
- [ ] Use named exports instead of default exports with objects
- [ ] Import from specific paths for problematic libraries
- [ ] Analyze bundle regularly with visualization tools
- [ ] Consider smaller alternatives for heavy dependencies

## Summary

Tree shaking is a crucial optimization technique for modern JavaScript applications. Key takeaways:

1. **Requires ES Modules**: Static structure enables dead code analysis
2. **Mark Side Effects**: Use `sideEffects` in package.json correctly
3. **Write Pure Code**: Avoid side effects at module level
4. **Use Named Exports**: Better tree shaking than default exports
5. **Analyze Bundles**: Regular audits catch regressions
6. **Configure Build Tools**: Ensure ES modules are preserved

## Further Reading

- [Webpack Tree Shaking Guide](https://webpack.js.org/guides/tree-shaking/)
- [Rollup Tree Shaking](https://rollupjs.org/introduction/#tree-shaking)
- [ES Modules Deep Dive](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/)
- [SideEffects in Webpack](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free)
