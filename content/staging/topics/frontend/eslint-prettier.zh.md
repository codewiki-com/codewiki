---
title: ESLint 与 Prettier 代码规范指南
description: 掌握代码检查和格式化工具，建立团队统一的代码规范
track: frontend
section: build-tools
difficulty: beginner
tags:
  - ESLint
  - Prettier
  - 代码规范
  - Lint
status: imported
origin: old/src/content/docs/frontend/eslint-prettier.zh.md
divergence: 0.149
issues: []
legacy:
  category: Frontend
  subcategory: Tools
  order: 25
  lastUpdated: 2026-01-07
---

在团队协作开发中，统一的代码风格和质量标准是高效协作的基础。ESLint 作为 JavaScript/TypeScript 最流行的静态代码分析工具，能够帮助我们发现代码中的潜在问题；而 Prettier 则专注于代码格式化，确保代码风格的一致性。本文将深入讲解如何配置和使用这两个工具，以及如何在项目中实现自动化的代码规范检查。

## ESLint 基础配置

### 什么是 ESLint？

ESLint 是一个可插拔的 JavaScript 代码检查工具，它可以：

- **发现代码问题**：检测语法错误、潜在 bug、不推荐的写法
- **强制代码规范**：统一团队编码风格
- **自动修复**：自动修复部分可修复的问题

### 安装与初始化

```bash
# 安装 ESLint（推荐使用项目级安装）
npm install eslint --save-dev

# 初始化配置（交互式）
npx eslint --init
```

初始化向导会询问你几个问题：

```
? How would you like to use ESLint?
  > To check syntax, find problems, and enforce code style
? What type of modules does your project use?
  > JavaScript modules (import/export)
? Which framework does your project use?
  > React / Vue.js / None of these
? Does your project use TypeScript?
  > Yes / No
? Where does your code run?
  > Browser / Node
? What format do you want your config file to be in?
  > JavaScript / YAML / JSON
```

### 配置文件详解

ESLint 9.x 推荐使用扁平化配置（Flat Config），配置文件为 `eslint.config.js`：

```javascript
// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';

export default [
  // 基础配置
  js.configs.recommended,

  // 自定义配置
  {
    // 指定需要检查的文件
    files: ['**/*.{js,mjs,cjs,jsx}'],

    // 语言选项
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    // 规则配置
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // 忽略特定文件/目录
  {
    ignores: ['dist/**', 'node_modules/**', '*.min.js'],
  },
];
```

**传统配置方式**（ESLint 8.x 及以下，使用 `.eslintrc.js`）：

```javascript
// .eslintrc.js（传统配置，仍被支持）
module.exports = {
  root: true,
  env: {
    browser: true,
    es2024: true,
    node: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
  },
};
```

### 规则等级说明

ESLint 规则有三个等级：

| 等级 | 值 | 说明 |
|------|-----|------|
| off | 0 | 关闭规则 |
| warn | 1 | 警告（不影响退出码） |
| error | 2 | 错误（退出码为 1） |

```javascript
rules: {
  'no-console': 'off',        // 关闭
  'no-unused-vars': 'warn',   // 警告
  'no-undef': 'error',        // 错误

  // 带选项的规则
  'quotes': ['error', 'single', { avoidEscape: true }],
  'indent': ['error', 2, { SwitchCase: 1 }],
}
```

### 命令行使用

```bash
# 检查文件
npx eslint src/

# 检查并自动修复
npx eslint src/ --fix

# 只检查特定类型的文件
npx eslint "src/**/*.{js,jsx,ts,tsx}"

# 输出详细报告
npx eslint src/ --format=stylish

# 缓存检查结果（加速后续检查）
npx eslint src/ --cache
```

## 常用规则与插件

### 推荐的核心规则

```javascript
// eslint.config.js
export default [
  {
    rules: {
      // ========== 可能的错误 ==========
      'no-console': 'warn',                    // 禁止 console
      'no-debugger': 'error',                  // 禁止 debugger
      'no-duplicate-case': 'error',            // 禁止重复的 case
      'no-empty': 'warn',                      // 禁止空代码块
      'no-extra-semi': 'error',                // 禁止多余分号
      'no-func-assign': 'error',               // 禁止重新赋值函数声明
      'no-unreachable': 'error',               // 禁止不可达代码
      'valid-typeof': 'error',                 // 强制 typeof 与有效字符串比较

      // ========== 最佳实践 ==========
      'eqeqeq': ['error', 'always'],           // 强制使用 === 和 !==
      'no-eval': 'error',                      // 禁止使用 eval
      'no-implied-eval': 'error',              // 禁止隐式 eval
      'no-return-await': 'error',              // 禁止不必要的 return await
      'require-await': 'warn',                 // async 函数必须有 await
      'no-unused-expressions': 'error',        // 禁止无用的表达式
      'curly': ['error', 'all'],               // 强制使用大括号

      // ========== ES6+ ==========
      'no-var': 'error',                       // 禁止使用 var
      'prefer-const': 'error',                 // 优先使用 const
      'prefer-template': 'warn',               // 优先使用模板字符串
      'prefer-arrow-callback': 'warn',         // 优先使用箭头函数作为回调
      'arrow-body-style': ['warn', 'as-needed'], // 箭头函数体风格
      'object-shorthand': 'warn',              // 对象方法简写
      'prefer-destructuring': ['warn', {       // 优先使用解构
        array: false,
        object: true,
      }],

      // ========== 代码风格 ==========
      'camelcase': 'warn',                     // 驼峰命名
      'no-multi-spaces': 'error',              // 禁止多余空格
      'no-trailing-spaces': 'error',           // 禁止行尾空格
      'comma-dangle': ['error', 'always-multiline'], // 尾随逗号
    },
  },
];
```

### 常用插件

#### eslint-plugin-import（导入/导出规范）

```bash
npm install eslint-plugin-import --save-dev
```

```javascript
// eslint.config.js
import importPlugin from 'eslint-plugin-import';

export default [
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/order': ['error', {
        groups: [
          'builtin',      // Node.js 内置模块
          'external',     // npm 包
          'internal',     // 内部模块
          'parent',       // 父级目录
          'sibling',      // 同级目录
          'index',        // 当前目录的 index
          'type',         // 类型导入
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],
      'import/no-duplicates': 'error',         // 禁止重复导入
      'import/no-unresolved': 'error',         // 确保导入的模块存在
      'import/named': 'error',                 // 确保命名导入存在
      'import/no-cycle': 'error',              // 禁止循环依赖
      'import/no-unused-modules': 'warn',      // 禁止未使用的导出
    },
  },
];
```

#### eslint-plugin-promise（Promise 规范）

```bash
npm install eslint-plugin-promise --save-dev
```

```javascript
import promisePlugin from 'eslint-plugin-promise';

export default [
  {
    plugins: {
      promise: promisePlugin,
    },
    rules: {
      'promise/always-return': 'warn',         // then 必须有 return
      'promise/no-return-wrap': 'error',       // 避免不必要的 Promise 包装
      'promise/param-names': 'error',          // Promise 参数命名
      'promise/catch-or-return': 'error',      // 必须处理 Promise 错误
      'promise/no-nesting': 'warn',            // 避免嵌套 Promise
    },
  },
];
```

#### eslint-plugin-unicorn（更严格的规则集）

```bash
npm install eslint-plugin-unicorn --save-dev
```

```javascript
import unicorn from 'eslint-plugin-unicorn';

export default [
  unicorn.configs['flat/recommended'],
  {
    rules: {
      // 自定义 unicorn 规则
      'unicorn/prevent-abbreviations': 'off',  // 允许缩写
      'unicorn/filename-case': ['error', {
        cases: {
          camelCase: true,
          pascalCase: true,
        },
      }],
    },
  },
];
```

## Prettier 配置详解

### 什么是 Prettier？

Prettier 是一个"固执己见"的代码格式化工具，它的特点是：

- **零配置可用**：开箱即用，默认配置满足大多数需求
- **支持多种语言**：JavaScript、TypeScript、CSS、HTML、JSON、Markdown 等
- **与编辑器集成**：保存时自动格式化
- **消除风格争论**：强制统一格式，减少代码审查中的风格讨论

### 安装与基础使用

```bash
# 安装 Prettier
npm install prettier --save-dev

# 格式化文件
npx prettier --write src/

# 检查是否已格式化（不修改文件）
npx prettier --check src/
```

### 配置文件

创建 `.prettierrc` 或 `prettier.config.js`：

```javascript
// prettier.config.js
export default {
  // 每行最大字符数
  printWidth: 100,

  // 缩进宽度
  tabWidth: 2,

  // 使用 tab 还是空格
  useTabs: false,

  // 语句末尾是否添加分号
  semi: true,

  // 使用单引号还是双引号
  singleQuote: true,

  // 对象属性的引号风格
  // 'as-needed' - 仅在需要时添加
  // 'consistent' - 有一个需要就全部添加
  // 'preserve' - 保持原样
  quoteProps: 'as-needed',

  // JSX 中使用单引号
  jsxSingleQuote: false,

  // 多行时尾随逗号
  // 'none' - 无
  // 'es5' - ES5 支持的位置（对象、数组等）
  // 'all' - 所有位置（包括函数参数）
  trailingComma: 'es5',

  // 对象花括号内部空格 { foo: bar }
  bracketSpacing: true,

  // JSX 标签的 > 是否单独一行
  bracketSameLine: false,

  // 箭头函数参数是否始终加括号
  // 'always' - (x) => x
  // 'avoid' - x => x
  arrowParens: 'always',

  // 换行符
  // 'lf' - Unix 风格 \n
  // 'crlf' - Windows 风格 \r\n
  // 'cr' - 旧 Mac 风格 \r
  // 'auto' - 保持现有
  endOfLine: 'lf',

  // HTML 空白敏感度
  // 'css' - 遵循 CSS display 属性
  // 'strict' - 保留所有空白
  // 'ignore' - 忽略空白
  htmlWhitespaceSensitivity: 'css',

  // Vue 文件中 <script> 和 <style> 标签内的代码是否缩进
  vueIndentScriptAndStyle: false,

  // 是否格式化嵌入的代码块（Markdown 中的代码块）
  embeddedLanguageFormatting: 'auto',

  // 在 HTML、Vue 和 JSX 中强制每个属性单独一行
  singleAttributePerLine: false,
};
```

### 忽略文件

创建 `.prettierignore`：

```
# 构建输出
dist/
build/
.next/
.nuxt/

# 依赖
node_modules/

# 生成的文件
*.min.js
*.min.css
package-lock.json
pnpm-lock.yaml
yarn.lock

# 其他
.git/
coverage/
*.md
```

### 针对特定文件覆盖配置

```javascript
// prettier.config.js
export default {
  semi: true,
  singleQuote: true,

  // 针对特定文件类型的覆盖
  overrides: [
    {
      files: '*.json',
      options: {
        tabWidth: 4,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      files: ['*.yaml', '*.yml'],
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};
```

## ESLint 与 Prettier 集成

### 为什么需要集成？

ESLint 和 Prettier 都可以格式化代码，但职责不同：

| 工具 | 职责 | 示例 |
|------|------|------|
| ESLint | 代码质量 + 部分格式 | 未使用变量、语法错误、缩进 |
| Prettier | 纯代码格式化 | 引号、分号、换行 |

两者可能产生冲突，例如：
- ESLint 规则要求使用双引号
- Prettier 配置使用单引号

### 集成方案

推荐方案：**让 Prettier 负责格式化，ESLint 负责代码质量**

```bash
# 安装必要的包
npm install prettier eslint-config-prettier eslint-plugin-prettier --save-dev
```

- `eslint-config-prettier`：关闭所有与 Prettier 冲突的 ESLint 规则
- `eslint-plugin-prettier`：将 Prettier 作为 ESLint 规则运行

```javascript
// eslint.config.js
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
  js.configs.recommended,

  // Prettier 配置必须放在最后，以覆盖其他格式规则
  prettier,

  {
    rules: {
      // 你的自定义规则
      'no-unused-vars': 'warn',
    },
  },
];
```

### 验证集成是否成功

```bash
# 检查是否有冲突的规则
npx eslint-config-prettier src/index.js
```

如果没有输出，说明配置正确，没有冲突规则。

### VS Code 配置

安装扩展：
- ESLint
- Prettier - Code formatter

配置 `.vscode/settings.json`：

```json
{
  // 保存时自动格式化
  "editor.formatOnSave": true,

  // 指定默认格式化工具
  "editor.defaultFormatter": "esbenp.prettier-vscode",

  // 保存时运行 ESLint 修复
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },

  // ESLint 验证的语言
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue"
  ],

  // 特定语言使用特定格式化工具
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## TypeScript 支持

### 配置 TypeScript ESLint

```bash
# 安装 TypeScript ESLint
npm install typescript-eslint --save-dev
```

```javascript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 需要类型信息的规则（更严格但更慢）
  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // TypeScript 特有规则
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // 类型检查规则
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      // 代码风格
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
      }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
  },

  // JavaScript 文件不启用类型检查
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },

  prettier,
);
```

### 常用 TypeScript 规则详解

```javascript
rules: {
  // ========== 类型安全 ==========

  // 禁止使用 any（推荐 unknown）
  '@typescript-eslint/no-explicit-any': 'warn',

  // 禁止非空断言 obj!.property
  '@typescript-eslint/no-non-null-assertion': 'warn',

  // 禁止使用 @ts-ignore（推荐 @ts-expect-error）
  '@typescript-eslint/ban-ts-comment': ['error', {
    'ts-expect-error': 'allow-with-description',
    'ts-ignore': true,
    'ts-nocheck': true,
  }],

  // ========== Promise 处理 ==========

  // 禁止未处理的 Promise
  '@typescript-eslint/no-floating-promises': 'error',

  // 禁止在条件中错误使用 Promise
  '@typescript-eslint/no-misused-promises': ['error', {
    checksVoidReturn: false,
  }],

  // ========== 代码组织 ==========

  // 强制使用类型导入
  '@typescript-eslint/consistent-type-imports': ['error', {
    prefer: 'type-imports',
    fixStyle: 'separate-type-imports',
  }],

  // 使用 interface 而非 type（对于对象类型）
  '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

  // 类成员排序
  '@typescript-eslint/member-ordering': ['warn', {
    default: [
      'static-field',
      'instance-field',
      'constructor',
      'static-method',
      'instance-method',
    ],
  }],
}
```

## React/Vue 规则配置

### React 项目配置

```bash
# 安装 React 相关插件
npm install eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y --save-dev
```

```javascript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // React 配置
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React 规则
      'react/react-in-jsx-scope': 'off',         // React 17+ 不需要导入 React
      'react/prop-types': 'off',                 // 使用 TypeScript 类型
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-unescaped-entities': 'warn',
      'react/self-closing-comp': 'warn',
      'react/jsx-curly-brace-presence': ['warn', {
        props: 'never',
        children: 'never',
      }],

      // React Hooks 规则
      'react-hooks/rules-of-hooks': 'error',     // 强制 Hooks 规则
      'react-hooks/exhaustive-deps': 'warn',     // 依赖项完整性

      // 无障碍规则
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },

  prettier,
);
```

### Vue 项目配置

```bash
# 安装 Vue 插件
npm install eslint-plugin-vue --save-dev
```

```javascript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import prettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Vue 配置
  ...vue.configs['flat/recommended'],

  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        ecmaVersion: 'latest',
      },
    },
    rules: {
      // Vue 规则
      'vue/multi-word-component-names': 'warn',    // 组件名多单词
      'vue/no-unused-vars': 'warn',
      'vue/no-mutating-props': 'error',
      'vue/require-default-prop': 'off',
      'vue/require-explicit-emits': 'error',

      // Vue 3 Composition API
      'vue/define-macros-order': ['warn', {
        order: ['defineProps', 'defineEmits'],
      }],
      'vue/define-emits-declaration': ['error', 'type-based'],
      'vue/define-props-declaration': ['error', 'type-based'],

      // 模板风格
      'vue/html-self-closing': ['warn', {
        html: {
          void: 'always',
          normal: 'never',
          component: 'always',
        },
      }],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/attribute-hyphenation': ['error', 'always'],
      'vue/v-on-event-hyphenation': ['error', 'always'],

      // 代码组织
      'vue/component-tags-order': ['error', {
        order: ['script', 'template', 'style'],
      }],
      'vue/block-order': ['error', {
        order: ['script', 'template', 'style'],
      }],
    },
  },

  prettier,
);
```

## Git Hooks 集成

### 为什么需要 Git Hooks？

即使配置了 ESLint 和 Prettier，开发者也可能忘记运行检查就提交代码。Git Hooks 可以在提交前自动运行检查，确保问题代码不会进入代码库。

### Husky 安装与配置

Husky 是最流行的 Git Hooks 管理工具：

```bash
# 安装 Husky
npm install husky --save-dev

# 初始化 Husky
npx husky init
```

这会在 `.husky/` 目录下创建 `pre-commit` 文件。

### lint-staged 配置

lint-staged 只对暂存的文件运行检查，避免检查整个项目：

```bash
npm install lint-staged --save-dev
```

配置 `package.json`：

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ],
    "*.vue": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.css": [
      "prettier --write"
    ]
  }
}
```

配置 `.husky/pre-commit`：

```bash
#!/usr/bin/env sh
npx lint-staged
```

### commitlint 配置（规范提交信息）

```bash
# 安装 commitlint
npm install @commitlint/cli @commitlint/config-conventional --save-dev
```

创建 `commitlint.config.js`：

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 类型枚举
    'type-enum': [2, 'always', [
      'feat',     // 新功能
      'fix',      // 修复 Bug
      'docs',     // 文档变更
      'style',    // 代码格式（不影响功能）
      'refactor', // 重构
      'perf',     // 性能优化
      'test',     // 测试
      'build',    // 构建系统或外部依赖变更
      'ci',       // CI 配置
      'chore',    // 其他杂项
      'revert',   // 回滚
    ]],
    // 主题不能为空
    'subject-empty': [2, 'never'],
    // 主题最大长度
    'subject-max-length': [2, 'always', 72],
    // 主题格式
    'subject-case': [0],
  },
};
```

添加 commit-msg 钩子：

```bash
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

### 完整的 Git Hooks 工作流

```
开发者修改代码
    ↓
git add .
    ↓
git commit -m "feat: 添加用户登录功能"
    ↓
┌─────────────────────────────────────┐
│ pre-commit hook (lint-staged)       │
│   - ESLint 检查并修复               │
│   - Prettier 格式化                 │
│   - 类型检查（可选）                 │
└─────────────────────────────────────┘
    ↓ (检查通过)
┌─────────────────────────────────────┐
│ commit-msg hook (commitlint)        │
│   - 检查提交信息格式                 │
└─────────────────────────────────────┘
    ↓ (检查通过)
提交成功
```

## 团队规范制定

### 制定规范的原则

1. **渐进式采用**：不要一次性引入太多规则，逐步加严
2. **团队共识**：规则需要团队讨论认可，避免强加
3. **自动化优先**：能自动修复的问题不要靠人工
4. **文档化**：记录规则的理由和例外情况

### 推荐的共享配置

可以创建团队共享的 ESLint 配置包：

```javascript
// @mycompany/eslint-config/index.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // 团队统一规则
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  prettier,
];
```

项目中使用：

```javascript
// eslint.config.js
import baseConfig from '@mycompany/eslint-config';

export default [
  ...baseConfig,
  {
    // 项目特定规则
  },
];
```

### 规范文档模板

```markdown
# 代码规范指南

## 基本原则

- 代码应该易于阅读和理解
- 保持一致性比个人偏好更重要
- 自动化工具能解决的问题，不靠人工约束

## 工具配置

- ESLint：代码质量检查
- Prettier：代码格式化
- Husky + lint-staged：提交前自动检查

## 命名规范

| 类型 | 风格 | 示例 |
|------|------|------|
| 变量 | camelCase | userName |
| 常量 | UPPER_SNAKE_CASE | MAX_COUNT |
| 函数 | camelCase | getUserById |
| 类/组件 | PascalCase | UserProfile |
| 文件名 | kebab-case 或 PascalCase | user-profile.ts |

## 提交信息规范

格式：`type(scope): subject`

- feat: 新功能
- fix: Bug 修复
- docs: 文档更新
- style: 格式调整
- refactor: 重构
- test: 测试相关
- chore: 其他

## 例外情况

记录团队同意的例外情况及理由...
```

## 常见问题解决

### ESLint 与 Prettier 冲突

**问题**：保存时格式来回变化

**解决方案**：

```bash
# 检查冲突规则
npx eslint-config-prettier src/index.js

# 确保 prettier 配置在最后
```

```javascript
// eslint.config.js - prettier 必须在最后
export default [
  js.configs.recommended,
  // 其他配置...
  prettier,  // 最后
];
```

### 解析器错误

**问题**：`Parsing error: Unexpected token`

**解决方案**：确保配置了正确的解析器和 ecmaVersion：

```javascript
{
  languageOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
}
```

### TypeScript 类型检查规则报错

**问题**：需要项目配置（`parserOptions.project`）

**解决方案**：

```javascript
{
  languageOptions: {
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: import.meta.dirname,
    },
  },
}
```

### 忽略特定行或文件

```javascript
// 忽略下一行
// eslint-disable-next-line no-console
console.log('调试信息');

// 忽略整个文件
/* eslint-disable */

// 忽略特定规则
/* eslint-disable no-console */

// Prettier 忽略
// prettier-ignore
const matrix = [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1,
];
```

### 性能优化

对于大型项目，ESLint 可能较慢：

```bash
# 使用缓存
eslint --cache src/

# 并行检查
eslint --max-warnings 0 src/

# 只检查变更的文件（CI 中）
eslint $(git diff --name-only --diff-filter=ACMRT origin/main | grep -E '\.(js|ts|jsx|tsx)$' | xargs)
```

```javascript
// 禁用昂贵的规则
{
  rules: {
    'import/no-cycle': 'off',  // 循环依赖检查较慢
  },
}
```

## 面试要点

### 基础概念

**Q: ESLint 和 Prettier 的区别是什么？**

A: ESLint 主要负责代码质量检查（如未使用变量、语法错误、最佳实践），也有部分格式化功能；Prettier 专注于代码格式化（如缩进、引号、换行）。两者配合使用时，通常让 Prettier 负责格式，ESLint 负责质量。

**Q: 如何解决 ESLint 与 Prettier 的冲突？**

A: 使用 `eslint-config-prettier` 关闭 ESLint 中与 Prettier 冲突的规则，使用 `eslint-plugin-prettier` 将 Prettier 作为 ESLint 规则运行。配置时确保 prettier 配置放在最后。

### 配置相关

**Q: ESLint 规则的三个等级分别是什么意思？**

A:
- `off` (0): 关闭规则
- `warn` (1): 警告，不影响退出码
- `error` (2): 错误，退出码为 1，会阻止构建/提交

**Q: 如何配置只检查变更文件？**

A: 使用 lint-staged 配合 Husky 的 pre-commit 钩子，只对 git 暂存区的文件运行检查。

### 实践问题

**Q: 如何在团队中推行代码规范？**

A:
1. 团队讨论达成共识
2. 渐进式引入规则，避免一次性改动过多
3. 配置自动修复，减少手动工作
4. 使用 Git Hooks 强制检查
5. 在 CI 中加入检查步骤
6. 编写文档说明规则理由

**Q: 如何处理遗留项目中大量的 lint 错误？**

A:
1. 先配置 `--fix` 自动修复可修复的问题
2. 将严重规则设为 `error`，其他设为 `warn`
3. 使用 baseline 文件记录现有问题，只检查新代码
4. 逐步修复，不要一次性处理所有问题
5. 可以使用 `/* eslint-disable */` 临时忽略，但需记录并计划修复

### 高级话题

**Q: ESLint 的扁平化配置（Flat Config）有什么优势？**

A:
1. 配置更简单直观，减少继承层级
2. 原生 ESM 支持
3. 更好的 IDE 支持和类型提示
4. 统一的配置方式，减少混乱
5. 更好的性能

**Q: 如何为大型 monorepo 配置 ESLint？**

A:
1. 根目录放置基础配置
2. 各个包可以有自己的配置文件继承或覆盖
3. 使用 `root: true` 防止向上查找
4. 配置恰当的 `ignores` 避免检查无关文件
5. 考虑使用 Turborepo 或 Nx 的缓存功能

## 总结

ESLint 和 Prettier 是现代前端开发的必备工具。ESLint 帮助我们发现代码问题，提升代码质量；Prettier 统一代码格式，消除风格争议。两者结合使用，配合 Git Hooks 实现自动化检查，可以显著提升团队协作效率和代码质量。

核心配置要点：
1. ESLint 9.x 使用扁平化配置（`eslint.config.js`）
2. Prettier 配置放在 ESLint 最后，避免规则冲突
3. TypeScript 项目需要 `typescript-eslint`
4. React/Vue 项目需要相应的插件
5. 使用 Husky + lint-staged 实现提交前检查
6. 使用 commitlint 规范提交信息

建立团队代码规范是一个持续的过程，需要不断调整和优化。工具只是手段，真正的目标是提升代码可读性和团队协作效率。
