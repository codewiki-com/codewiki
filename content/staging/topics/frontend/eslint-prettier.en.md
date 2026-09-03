---
title: ESLint and Prettier Code Quality Guide
description: Master code linting and formatting for team consistency
track: frontend
section: build-tools
difficulty: beginner
tags:
  - ESLint
  - Prettier
  - Code Quality
  - Linting
status: imported
origin: old/src/content/docs/frontend/eslint-prettier.en.md
divergence: 0.149
issues: []
legacy:
  category: Frontend
  subcategory: Tools
  order: 25
  lastUpdated: 2026-01-07
---

In team-based software development, maintaining consistent code style and quality standards is fundamental to effective collaboration. ESLint, as the most popular static code analysis tool for JavaScript and TypeScript, helps identify potential issues in your codebase. Prettier focuses exclusively on code formatting, ensuring consistent code style across your entire project. This comprehensive guide will walk you through configuring and using both tools effectively, as well as implementing automated code quality checks in your development workflow.

## Understanding the Tools

### What is ESLint?

ESLint is a pluggable, highly configurable linting utility for JavaScript and TypeScript. It statically analyzes your code to quickly find problems and can automatically fix many issues it detects. ESLint is completely customizable, allowing you to define your own rules or use pre-configured rule sets from the community.

ESLint can help you:

- **Detect code problems**: Identify syntax errors, potential bugs, and anti-patterns
- **Enforce coding standards**: Maintain consistent style across your team
- **Auto-fix issues**: Automatically correct many fixable problems

### What is Prettier?

Prettier is an opinionated code formatter that supports many languages, including JavaScript, TypeScript, CSS, HTML, JSON, Markdown, and more. Unlike linters, Prettier is concerned solely with code formatting - things like indentation, line length, quotes, and semicolons.

Key characteristics of Prettier:

- **Zero configuration needed**: Works out of the box with sensible defaults
- **Multi-language support**: Handles JavaScript, TypeScript, CSS, HTML, JSON, Markdown, and more
- **Editor integration**: Enables format-on-save functionality
- **Eliminates style debates**: Enforces uniform formatting, reducing code review friction

### ESLint vs Prettier: Understanding the Difference

While both tools can affect code formatting, they serve different purposes:

| Tool | Primary Focus | Examples |
|------|---------------|----------|
| ESLint | Code quality + some formatting | Unused variables, syntax errors, indentation rules |
| Prettier | Pure code formatting | Quotes, semicolons, line breaks, spacing |

The key insight is that ESLint rules fall into two categories:
1. **Formatting rules**: Rules about code style (indentation, quotes, etc.) - Prettier handles these better
2. **Code quality rules**: Rules about code logic and potential bugs - ESLint's specialty

## ESLint Configuration

### Installation and Initialization

```bash
# Install ESLint (project-level installation recommended)
npm install eslint --save-dev

# Initialize configuration interactively
npx eslint --init
```

The initialization wizard will ask you several questions:

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

### Flat Configuration (ESLint 9.x+)

ESLint 9.x introduced a new flat configuration format using `eslint.config.js`. This modern approach is more explicit and easier to understand:

```javascript
// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';

export default [
  // Base recommended configuration
  js.configs.recommended,

  // Custom configuration
  {
    // Specify files to lint
    files: ['**/*.{js,mjs,cjs,jsx}'],

    // Language options
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

    // Rule configuration
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Ignore specific files/directories
  {
    ignores: ['dist/**', 'node_modules/**', '*.min.js'],
  },
];
```

### Legacy Configuration (ESLint 8.x and earlier)

For older projects or backward compatibility, the `.eslintrc.js` format is still supported:

```javascript
// .eslintrc.js (legacy configuration, still supported)
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

### Rule Severity Levels

ESLint rules have three severity levels:

| Level | Value | Description |
|-------|-------|-------------|
| off | 0 | Disable the rule |
| warn | 1 | Warning (does not affect exit code) |
| error | 2 | Error (exit code becomes 1) |

```javascript
rules: {
  'no-console': 'off',        // Disabled
  'no-unused-vars': 'warn',   // Warning
  'no-undef': 'error',        // Error

  // Rules with options
  'quotes': ['error', 'single', { avoidEscape: true }],
  'indent': ['error', 2, { SwitchCase: 1 }],
}
```

### Command Line Usage

```bash
# Lint files
npx eslint src/

# Lint and auto-fix
npx eslint src/ --fix

# Lint specific file types only
npx eslint "src/**/*.{js,jsx,ts,tsx}"

# Output detailed report
npx eslint src/ --format=stylish

# Cache results for faster subsequent runs
npx eslint src/ --cache
```

## Recommended Rules and Plugins

### Essential Core Rules

```javascript
// eslint.config.js
export default [
  {
    rules: {
      // ========== Possible Errors ==========
      'no-console': 'warn',                    // Disallow console statements
      'no-debugger': 'error',                  // Disallow debugger
      'no-duplicate-case': 'error',            // Disallow duplicate case labels
      'no-empty': 'warn',                      // Disallow empty block statements
      'no-extra-semi': 'error',                // Disallow unnecessary semicolons
      'no-func-assign': 'error',               // Disallow reassigning function declarations
      'no-unreachable': 'error',               // Disallow unreachable code
      'valid-typeof': 'error',                 // Enforce comparing typeof to valid strings

      // ========== Best Practices ==========
      'eqeqeq': ['error', 'always'],           // Require === and !==
      'no-implied-eval': 'error',              // Disallow implied code evaluation
      'no-return-await': 'error',              // Disallow unnecessary return await
      'require-await': 'warn',                 // Require await in async functions
      'no-unused-expressions': 'error',        // Disallow unused expressions
      'curly': ['error', 'all'],               // Require curly braces for all control statements

      // ========== ES6+ ==========
      'no-var': 'error',                       // Require let or const instead of var
      'prefer-const': 'error',                 // Prefer const when variable is not reassigned
      'prefer-template': 'warn',               // Prefer template literals over string concatenation
      'prefer-arrow-callback': 'warn',         // Prefer arrow functions as callbacks
      'arrow-body-style': ['warn', 'as-needed'], // Arrow function body style
      'object-shorthand': 'warn',              // Require object method shorthand
      'prefer-destructuring': ['warn', {       // Prefer destructuring from arrays and objects
        array: false,
        object: true,
      }],

      // ========== Code Style ==========
      'camelcase': 'warn',                     // Enforce camelCase naming
      'no-multi-spaces': 'error',              // Disallow multiple spaces
      'no-trailing-spaces': 'error',           // Disallow trailing whitespace
      'comma-dangle': ['error', 'always-multiline'], // Require trailing commas in multiline
    },
  },
];
```

### Popular ESLint Plugins

#### eslint-plugin-import (Import/Export Standards)

This plugin provides linting rules related to ES6+ import/export syntax:

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
          'builtin',      // Node.js built-in modules
          'external',     // npm packages
          'internal',     // Internal modules
          'parent',       // Parent directory imports
          'sibling',      // Same directory imports
          'index',        // Index of current directory
          'type',         // Type imports
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],
      'import/no-duplicates': 'error',         // Disallow duplicate imports
      'import/no-unresolved': 'error',         // Ensure imports point to valid files
      'import/named': 'error',                 // Ensure named imports exist
      'import/no-cycle': 'error',              // Disallow circular dependencies
      'import/no-unused-modules': 'warn',      // Report unused exports
    },
  },
];
```

#### eslint-plugin-promise (Promise Best Practices)

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
      'promise/always-return': 'warn',         // Return in then() callbacks
      'promise/no-return-wrap': 'error',       // Avoid unnecessary Promise wrapping
      'promise/param-names': 'error',          // Enforce standard Promise parameter names
      'promise/catch-or-return': 'error',      // Enforce error handling
      'promise/no-nesting': 'warn',            // Avoid nested Promises
    },
  },
];
```

#### eslint-plugin-unicorn (Stricter Rule Set)

```bash
npm install eslint-plugin-unicorn --save-dev
```

```javascript
import unicorn from 'eslint-plugin-unicorn';

export default [
  unicorn.configs['flat/recommended'],
  {
    rules: {
      // Customize unicorn rules
      'unicorn/prevent-abbreviations': 'off',  // Allow abbreviations
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

## Prettier Configuration

### Installation and Basic Usage

```bash
# Install Prettier
npm install prettier --save-dev

# Format files
npx prettier --write src/

# Check formatting (without modifying files)
npx prettier --check src/
```

### Configuration File

Create a `.prettierrc` or `prettier.config.js` file:

```javascript
// prettier.config.js
export default {
  // Maximum line length
  printWidth: 100,

  // Indentation width
  tabWidth: 2,

  // Use tabs instead of spaces
  useTabs: false,

  // Add semicolons at the end of statements
  semi: true,

  // Use single quotes instead of double quotes
  singleQuote: true,

  // Quote style for object properties
  // 'as-needed' - only add when required
  // 'consistent' - if one needs quotes, quote all
  // 'preserve' - respect input
  quoteProps: 'as-needed',

  // Use single quotes in JSX
  jsxSingleQuote: false,

  // Trailing commas in multiline structures
  // 'none' - no trailing commas
  // 'es5' - ES5 valid locations (objects, arrays)
  // 'all' - all locations (including function parameters)
  trailingComma: 'es5',

  // Spaces inside object braces { foo: bar }
  bracketSpacing: true,

  // Put > of JSX elements on its own line
  bracketSameLine: false,

  // Always include parentheses around arrow function parameters
  // 'always' - (x) => x
  // 'avoid' - x => x
  arrowParens: 'always',

  // Line endings
  // 'lf' - Unix style \n
  // 'crlf' - Windows style \r\n
  // 'cr' - Old Mac style \r
  // 'auto' - maintain existing
  endOfLine: 'lf',

  // HTML whitespace sensitivity
  // 'css' - respect CSS display property
  // 'strict' - preserve all whitespace
  // 'ignore' - ignore whitespace
  htmlWhitespaceSensitivity: 'css',

  // Indent <script> and <style> in Vue files
  vueIndentScriptAndStyle: false,

  // Format embedded code blocks (e.g., in Markdown)
  embeddedLanguageFormatting: 'auto',

  // Force single attribute per line in HTML, Vue, and JSX
  singleAttributePerLine: false,
};
```

### Ignore File

Create a `.prettierignore` file:

```
# Build outputs
dist/
build/
.next/
.nuxt/

# Dependencies
node_modules/

# Generated files
*.min.js
*.min.css
package-lock.json
pnpm-lock.yaml
yarn.lock

# Other
.git/
coverage/
*.md
```

### Per-File Overrides

```javascript
// prettier.config.js
export default {
  semi: true,
  singleQuote: true,

  // Overrides for specific file types
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

## Integrating ESLint and Prettier

### Why Integration is Necessary

ESLint and Prettier can both format code, but they may have conflicting rules. For example:
- ESLint rule requires double quotes
- Prettier configuration uses single quotes

This causes formatting to flip-flop between the two tools.

### Recommended Integration Strategy

The recommended approach is to **let Prettier handle all formatting while ESLint handles code quality**:

```bash
# Install required packages
npm install prettier eslint-config-prettier eslint-plugin-prettier --save-dev
```

- `eslint-config-prettier`: Disables all ESLint rules that conflict with Prettier
- `eslint-plugin-prettier`: Runs Prettier as an ESLint rule

```javascript
// eslint.config.js
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
  js.configs.recommended,

  // Prettier config MUST be last to override formatting rules
  prettier,

  {
    rules: {
      // Your custom rules
      'no-unused-vars': 'warn',
    },
  },
];
```

### Verifying Integration

```bash
# Check for conflicting rules
npx eslint-config-prettier src/index.js
```

If there is no output, your configuration is correct with no conflicting rules.

### VS Code Configuration

Install these extensions:
- ESLint
- Prettier - Code formatter

Configure `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,

  "editor.defaultFormatter": "esbenp.prettier-vscode",

  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },

  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue"
  ],

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

## TypeScript Support

### Configuring TypeScript ESLint

```bash
# Install TypeScript ESLint
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

  // Type-checked rules (stricter but slower)
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
      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Type-checking rules
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      // Code style
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
      }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
  },

  // Disable type checking for JavaScript files
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },

  prettier,
);
```

### Common TypeScript Rules Explained

```javascript
rules: {
  // ========== Type Safety ==========

  // Disallow explicit any (prefer unknown)
  '@typescript-eslint/no-explicit-any': 'warn',

  // Disallow non-null assertions obj!.property
  '@typescript-eslint/no-non-null-assertion': 'warn',

  // Disallow @ts-ignore (prefer @ts-expect-error)
  '@typescript-eslint/ban-ts-comment': ['error', {
    'ts-expect-error': 'allow-with-description',
    'ts-ignore': true,
    'ts-nocheck': true,
  }],

  // ========== Promise Handling ==========

  // Disallow floating (unhandled) Promises
  '@typescript-eslint/no-floating-promises': 'error',

  // Disallow misuse of Promises in conditionals
  '@typescript-eslint/no-misused-promises': ['error', {
    checksVoidReturn: false,
  }],

  // ========== Code Organization ==========

  // Enforce type imports
  '@typescript-eslint/consistent-type-imports': ['error', {
    prefer: 'type-imports',
    fixStyle: 'separate-type-imports',
  }],

  // Use interface over type for object types
  '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

  // Class member ordering
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

## React and Vue Configuration

### React Project Configuration

```bash
# Install React-related plugins
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

  // React configuration
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
      // React rules
      'react/react-in-jsx-scope': 'off',         // Not needed in React 17+
      'react/prop-types': 'off',                 // Use TypeScript types instead
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

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',     // Enforce Hooks rules
      'react-hooks/exhaustive-deps': 'warn',     // Dependency array completeness

      // Accessibility rules
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },

  prettier,
);
```

### Vue Project Configuration

```bash
# Install Vue plugin
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

  // Vue configuration
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
      // Vue rules
      'vue/multi-word-component-names': 'warn',    // Multi-word component names
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

      // Template style
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

      // Code organization
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

## Git Hooks Integration

### Why Git Hooks?

Even with ESLint and Prettier configured, developers might forget to run checks before committing. Git Hooks automate this process, preventing problematic code from entering the repository.

### Husky Installation and Configuration

Husky is the most popular Git Hooks management tool:

```bash
# Install Husky
npm install husky --save-dev

# Initialize Husky
npx husky init
```

This creates a `.husky/` directory with a `pre-commit` file.

### lint-staged Configuration

lint-staged runs checks only on staged files, avoiding full project scans:

```bash
npm install lint-staged --save-dev
```

Configure `package.json`:

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

Configure `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
npx lint-staged
```

### commitlint Configuration (Commit Message Standards)

```bash
# Install commitlint
npm install @commitlint/cli @commitlint/config-conventional --save-dev
```

Create `commitlint.config.js`:

```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type enumeration
    'type-enum': [2, 'always', [
      'feat',     // New feature
      'fix',      // Bug fix
      'docs',     // Documentation changes
      'style',    // Code formatting (no functional changes)
      'refactor', // Code refactoring
      'perf',     // Performance improvements
      'test',     // Adding or updating tests
      'build',    // Build system or external dependencies
      'ci',       // CI configuration
      'chore',    // Other miscellaneous changes
      'revert',   // Revert previous commit
    ]],
    // Subject cannot be empty
    'subject-empty': [2, 'never'],
    // Maximum subject length
    'subject-max-length': [2, 'always', 72],
    // Subject case
    'subject-case': [0],
  },
};
```

Add commit-msg hook:

```bash
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

### Complete Git Hooks Workflow

```
Developer modifies code
    |
    v
git add .
    |
    v
git commit -m "feat: add user login feature"
    |
    v
+-------------------------------------+
| pre-commit hook (lint-staged)       |
|   - ESLint checks and fixes         |
|   - Prettier formatting             |
|   - Type checking (optional)        |
+-------------------------------------+
    | (checks pass)
    v
+-------------------------------------+
| commit-msg hook (commitlint)        |
|   - Validates commit message format |
+-------------------------------------+
    | (checks pass)
    v
Commit successful
```

## Team Standards Development

### Principles for Establishing Standards

1. **Incremental adoption**: Do not introduce too many rules at once; gradually increase strictness
2. **Team consensus**: Rules should be discussed and agreed upon by the team
3. **Automation first**: Automate what can be auto-fixed; do not rely on manual enforcement
4. **Documentation**: Record the reasoning behind rules and any exceptions

### Creating Shared Configurations

You can create a shared ESLint configuration package for your organization:

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
      // Team-wide rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  prettier,
];
```

Usage in projects:

```javascript
// eslint.config.js
import baseConfig from '@mycompany/eslint-config';

export default [
  ...baseConfig,
  {
    // Project-specific rules
  },
];
```

### Standards Documentation Template

```markdown
# Code Standards Guide

## Core Principles

- Code should be easy to read and understand
- Consistency matters more than personal preference
- Use automated tools; do not rely on manual enforcement

## Tool Configuration

- ESLint: Code quality checks
- Prettier: Code formatting
- Husky + lint-staged: Pre-commit automation

## Naming Conventions

| Type | Style | Example |
|------|-------|---------|
| Variables | camelCase | userName |
| Constants | UPPER_SNAKE_CASE | MAX_COUNT |
| Functions | camelCase | getUserById |
| Classes/Components | PascalCase | UserProfile |
| Files | kebab-case or PascalCase | user-profile.ts |

## Commit Message Format

Format: `type(scope): subject`

- feat: New feature
- fix: Bug fix
- docs: Documentation update
- style: Code formatting
- refactor: Code refactoring
- test: Test related
- chore: Other changes

## Exceptions

Document team-approved exceptions and their reasoning...
```

## Troubleshooting Common Issues

### ESLint and Prettier Conflicts

**Problem**: Formatting flip-flops on save

**Solution**:

```bash
# Check for conflicting rules
npx eslint-config-prettier src/index.js

# Ensure prettier config is last
```

```javascript
// eslint.config.js - prettier MUST be last
export default [
  js.configs.recommended,
  // other configs...
  prettier,  // Always last
];
```

### Parser Errors

**Problem**: `Parsing error: Unexpected token`

**Solution**: Ensure correct parser and ecmaVersion configuration:

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

### TypeScript Type-Checking Rules Errors

**Problem**: Rules require project configuration (`parserOptions.project`)

**Solution**:

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

### Ignoring Specific Lines or Files

```javascript
// Ignore next line
// eslint-disable-next-line no-console
console.log('Debug info');

// Ignore entire file
/* eslint-disable */

// Ignore specific rules
/* eslint-disable no-console */

// Prettier ignore
// prettier-ignore
const matrix = [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1,
];
```

### Performance Optimization

For large projects, ESLint may be slow:

```bash
# Use caching
eslint --cache src/

# Parallel checking
eslint --max-warnings 0 src/

# Check only changed files (in CI)
eslint $(git diff --name-only --diff-filter=ACMRT origin/main | grep -E '\.(js|ts|jsx|tsx)$' | xargs)
```

```javascript
// Disable expensive rules
{
  rules: {
    'import/no-cycle': 'off',  // Circular dependency check is slow
  },
}
```

## Interview Key Points

### Basic Concepts

**Q: What is the difference between ESLint and Prettier?**

A: ESLint primarily handles code quality checking (unused variables, syntax errors, best practices) and has some formatting capabilities. Prettier focuses exclusively on code formatting (indentation, quotes, line breaks). When used together, Prettier typically handles formatting while ESLint handles quality.

**Q: How do you resolve conflicts between ESLint and Prettier?**

A: Use `eslint-config-prettier` to disable conflicting ESLint rules, and `eslint-plugin-prettier` to run Prettier as an ESLint rule. Ensure the prettier configuration is placed last in your ESLint config.

### Configuration Questions

**Q: What do the three ESLint rule severity levels mean?**

A:
- `off` (0): Rule is disabled
- `warn` (1): Produces a warning but does not affect the exit code
- `error` (2): Produces an error, exit code becomes 1, can block builds/commits

**Q: How do you configure linting to run only on changed files?**

A: Use lint-staged with Husky's pre-commit hook. This runs checks only on files in the git staging area rather than the entire project.

### Practical Questions

**Q: How would you implement code standards in a team?**

A:
1. Discuss and reach consensus as a team
2. Introduce rules incrementally to avoid overwhelming changes
3. Configure auto-fix to reduce manual work
4. Use Git Hooks for enforcement
5. Add checks to CI pipeline
6. Document rules and their rationale

**Q: How do you handle legacy projects with many lint errors?**

A:
1. First run `--fix` to auto-fix what can be fixed
2. Set critical rules to `error`, others to `warn`
3. Use a baseline file to record existing issues, only check new code
4. Fix issues gradually; do not try to fix everything at once
5. Use `/* eslint-disable */` temporarily with a plan to address later

### Advanced Topics

**Q: What are the advantages of ESLint's flat configuration (Flat Config)?**

A:
1. Simpler, more intuitive configuration with less nesting
2. Native ESM support
3. Better IDE support and type hints
4. Unified configuration approach, reducing confusion
5. Better performance

**Q: How would you configure ESLint for a large monorepo?**

A:
1. Place base configuration in the root directory
2. Each package can have its own config that inherits or overrides
3. Use `root: true` to prevent upward config searching
4. Configure appropriate `ignores` to avoid checking irrelevant files
5. Consider using Turborepo or Nx caching features

## Summary

ESLint and Prettier are essential tools for modern frontend development. ESLint helps discover code issues and improve code quality, while Prettier unifies code formatting and eliminates style debates. Combined with Git Hooks for automated checking, these tools can significantly improve team collaboration efficiency and code quality.

Key configuration points:
1. ESLint 9.x uses flat configuration (`eslint.config.js`)
2. Prettier configuration must be last in ESLint to avoid rule conflicts
3. TypeScript projects require `typescript-eslint`
4. React/Vue projects need their respective plugins
5. Use Husky + lint-staged for pre-commit checks
6. Use commitlint to standardize commit messages

Establishing team code standards is an ongoing process that requires continuous adjustment and optimization. Tools are just the means; the real goal is improving code readability and team collaboration efficiency. Remember that the best configuration is one that your team actually uses and maintains. Start with a minimal set of rules that catch real bugs, then gradually add more as your team becomes comfortable with the tooling.

By investing time in proper ESLint and Prettier configuration, you create a foundation for consistent, high-quality code that scales with your team and project. The initial setup effort pays dividends through reduced code review friction, fewer bugs in production, and a more pleasant development experience for everyone on the team.
