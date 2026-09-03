---
title: Biome Code Quality Tool
description: Deep dive into Biome - the fast, unified toolchain for web development combining formatting, linting, and more
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Biome
  - Linting
  - Formatting
  - Code Quality
  - Rust
  - ESLint
  - Prettier
status: imported
origin: old/src/content/docs/frontend/biome.en.md
divergence: 0.213
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Frontend
  subcategory: ""
  order: 3
  lastUpdated: 2026-01-22
---

Biome is a high-performance toolchain for web development that combines formatting, linting, and more in a single tool. Written in Rust, it offers speeds up to 35x faster than traditional JavaScript-based tools like ESLint and Prettier, while providing a unified configuration experience and strong defaults out of the box.

## Concept Explanation

### What is Biome?

**Biome** (formerly Rome) is an all-in-one toolchain that aims to replace multiple JavaScript development tools with a single, fast, and cohesive solution. It provides formatting (like Prettier), linting (like ESLint), and is expanding to include bundling and more.

```bash
# Traditional approach - multiple tools
npm install eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier

# Biome approach - one tool
npm install --save-dev @biomejs/biome
```

The key insight is that by implementing everything in Rust with a unified architecture, Biome eliminates the overhead of coordinating multiple JavaScript tools and provides a dramatically faster, more consistent development experience.

### History and Evolution

The JavaScript tooling landscape has evolved significantly:

| Era | Technology | Approach |
|-----|------------|----------|
| 2011 | JSHint | Simple JavaScript linting |
| 2013 | ESLint | Pluggable JavaScript linting |
| 2016 | Prettier | Opinionated code formatting |
| 2019 | Rome (started) | Unified toolchain vision |
| 2022 | Rome Tools Inc | Commercial development |
| 2023 | Biome fork | Community-driven continuation |
| 2024 | Biome 1.0 | Production-ready release |

### Biome vs Traditional Tools

#### Biome vs ESLint + Prettier

```javascript
// Traditional: Two tools, two configs, potential conflicts
// .eslintrc.js
module.exports = {
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unused-vars': 'error',
    'semi': ['error', 'always']
  }
};

// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2
}

// Biome: One tool, one config
// biome.json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  }
}
```

#### Performance Comparison

```
Benchmark: Formatting 1000 TypeScript files

Prettier:     ~8.5 seconds
Biome:        ~0.25 seconds (34x faster)

Benchmark: Linting 1000 TypeScript files

ESLint:       ~12 seconds
Biome:        ~0.4 seconds (30x faster)
```

### Key Characteristics of Biome

1. **Rust Performance**: Native code execution for maximum speed
2. **Unified Configuration**: Single config file for all features
3. **Zero Configuration**: Strong defaults work out of the box
4. **Editor Integration**: First-class LSP support
5. **Deterministic**: Same output across all environments
6. **TypeScript Native**: Full TypeScript support without plugins

## Core Principles

### Unified Architecture

Biome uses a shared parsing infrastructure for all features:

```
Traditional Tools:
Source Code → ESLint Parser → AST → Lint Rules
Source Code → Prettier Parser → AST → Format
Source Code → TypeScript Parser → AST → Type Check
           ↑ Three different parsers, three passes

Biome:
Source Code → Biome Parser → Unified AST → Lint + Format + More
           ↑ One parser, one pass, shared infrastructure
```

### Fast by Default

Biome achieves speed through multiple optimizations:

```rust
// Conceptual: Biome's parallel processing
// - Parse files in parallel
// - Apply rules concurrently
// - Batch file I/O operations

// Result: Linear scaling with CPU cores
// 4 cores: ~4x faster
// 8 cores: ~8x faster
// 16 cores: ~16x faster
```

### Strong Defaults

Biome comes with carefully chosen defaults that work for most projects:

```json
// biome.json - minimal configuration needed
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json"
}
// This alone enables:
// - Recommended linting rules
// - Sensible formatting
// - JavaScript/TypeScript/JSX/TSX support
```

### Safe vs Suggested Fixes

Biome categorizes fixes by safety:

```javascript
// Safe fix: Always correct, auto-applicable
// Rule: noDoubleEquals
if (x == null) { }  // Before
if (x === null) { } // After (safe transformation)

// Suggested fix: Usually correct, requires review
// Rule: noUnusedVariables
const unused = 5; // Biome suggests removal but won't auto-fix
                  // (might be intentional, like for debugging)
```

## Core Concepts

### Configuration Basics

Biome uses a single `biome.json` configuration file:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",

  // Formatter configuration
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 80,
    "lineEnding": "lf",
    "ignore": ["**/dist/**", "**/node_modules/**"]
  },

  // Linter configuration
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "warn"
      },
      "style": {
        "useConst": "error"
      }
    },
    "ignore": ["**/generated/**"]
  },

  // JavaScript-specific settings
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingComma": "all",
      "arrowParentheses": "always"
    }
  },

  // JSON configuration
  "json": {
    "formatter": {
      "enabled": true,
      "indentWidth": 2
    }
  },

  // Files to include/exclude
  "files": {
    "include": ["src/**/*.ts", "src/**/*.tsx"],
    "ignore": ["**/node_modules/**", "**/dist/**"],
    "maxSize": 1048576
  }
}
```

### Linting Rules

Biome organizes rules into categories:

```json
{
  "linter": {
    "rules": {
      // Enable all recommended rules
      "recommended": true,

      // Correctness: Prevent definitely wrong code
      "correctness": {
        "noUnusedVariables": "error",
        "noUnreachable": "error",
        "useExhaustiveDependencies": "warn"
      },

      // Suspicious: Likely bugs or confusing code
      "suspicious": {
        "noExplicitAny": "warn",
        "noDoubleEquals": "error",
        "noArrayIndexKey": "warn"
      },

      // Style: Code style preferences
      "style": {
        "useConst": "error",
        "noNonNullAssertion": "warn",
        "useTemplate": "error"
      },

      // Complexity: Simplification suggestions
      "complexity": {
        "noForEach": "warn",
        "useFlatMap": "warn"
      },

      // Security: Security-related rules
      "security": {
        "noDangerouslySetInnerHtml": "error"
      },

      // Performance: Performance-related rules
      "performance": {
        "noAccumulatingSpread": "warn"
      },

      // A11y: Accessibility rules
      "a11y": {
        "useButtonType": "warn",
        "noSvgWithoutTitle": "warn"
      }
    }
  }
}
```

### Formatter Options

Biome provides comprehensive formatting options:

```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },

  "javascript": {
    "formatter": {
      // Quote style
      "quoteStyle": "single",

      // JSX quote style (can differ from JS)
      "jsxQuoteStyle": "double",

      // Semicolons
      "semicolons": "always",

      // Trailing commas
      "trailingComma": "all",

      // Arrow function parentheses
      "arrowParentheses": "always",

      // Bracket spacing
      "bracketSpacing": true,

      // Bracket same line
      "bracketSameLine": false,

      // Quote properties
      "quoteProperties": "asNeeded"
    }
  }
}
```

### CLI Usage

Biome provides a powerful CLI:

```bash
# Initialize configuration
npx @biomejs/biome init

# Format files
npx @biomejs/biome format ./src
npx @biomejs/biome format ./src --write

# Lint files
npx @biomejs/biome lint ./src
npx @biomejs/biome lint ./src --apply  # Apply safe fixes

# Check both formatting and linting
npx @biomejs/biome check ./src
npx @biomejs/biome check ./src --apply  # Apply all safe fixes

# Check specific files
npx @biomejs/biome check ./src/App.tsx

# CI mode (fails on errors)
npx @biomejs/biome ci ./src

# Migration from ESLint/Prettier
npx @biomejs/biome migrate eslint
npx @biomejs/biome migrate prettier
```

## Code Examples

### Project Setup

```bash
# Install Biome
npm install --save-dev @biomejs/biome

# Initialize configuration
npx @biomejs/biome init
```

```json
// biome.json (generated)
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true
  }
}
```

```json
// package.json scripts
{
  "scripts": {
    "lint": "biome lint ./src",
    "format": "biome format ./src --write",
    "check": "biome check ./src",
    "check:fix": "biome check ./src --apply",
    "ci": "biome ci ./src"
  }
}
```

### React Project Configuration

```json
// biome.json for React projects
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",

  "files": {
    "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.js", "src/**/*.jsx"],
    "ignore": ["node_modules", "dist", "build", ".next"]
  },

  "organizeImports": {
    "enabled": true
  },

  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },

  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "jsxQuoteStyle": "double",
      "semicolons": "always",
      "trailingComma": "es5",
      "arrowParentheses": "always"
    }
  },

  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,

      // React-specific rules
      "correctness": {
        "useExhaustiveDependencies": "warn",
        "useJsxKeyInIterable": "error"
      },

      "suspicious": {
        "noArrayIndexKey": "warn",
        "noExplicitAny": "warn"
      },

      "style": {
        "useConst": "error",
        "noNonNullAssertion": "warn",
        "useFragmentSyntax": "warn"
      },

      "a11y": {
        "useButtonType": "warn",
        "useAltText": "error",
        "noSvgWithoutTitle": "warn"
      },

      "security": {
        "noDangerouslySetInnerHtml": "error"
      }
    }
  }
}
```

### Migrating from ESLint

```bash
# Step 1: Run migration command
npx @biomejs/biome migrate eslint --write

# Step 2: Review generated biome.json
# Step 3: Remove ESLint dependencies
npm uninstall eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier

# Step 4: Update package.json scripts
```

```json
// Before: .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint"],
  "rules": {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error"
  }
}

// After: biome.json (migrated)
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      },
      "style": {
        "useConst": "error"
      }
    }
  }
}
```

### Migrating from Prettier

```bash
# Run migration
npx @biomejs/biome migrate prettier --write

# Remove Prettier
npm uninstall prettier eslint-config-prettier eslint-plugin-prettier
```

```json
// Before: .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "arrowParens": "always"
}

// After: biome.json (migrated)
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "semicolons": "always",
      "quoteStyle": "single",
      "trailingComma": "all",
      "arrowParentheses": "always"
    }
  }
}
```

### Editor Integration (VS Code)

```json
// .vscode/extensions.json
{
  "recommendations": ["biomejs.biome"]
}

// .vscode/settings.json
{
  // Use Biome as default formatter
  "editor.defaultFormatter": "biomejs.biome",

  // Format on save
  "editor.formatOnSave": true,

  // Enable Biome for specific languages
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  },

  // Enable organize imports on save
  "editor.codeActionsOnSave": {
    "source.organizeImports.biome": "explicit"
  },

  // Disable ESLint/Prettier if migrating
  "eslint.enable": false,
  "prettier.enable": false
}
```

### CI/CD Integration

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Biome
        run: npx @biomejs/biome ci ./src

  # Alternative: Use Biome GitHub Action
  biome:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Biome
        uses: biomejs/setup-biome@v2
        with:
          version: latest

      - name: Run Biome
        run: biome ci ./src
```

### Git Hooks with Husky

```bash
# Install husky and lint-staged
npm install --save-dev husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx,json,css,md}": [
      "biome check --apply --no-errors-on-unmatched"
    ]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
```

## Best Practices

### Gradual Adoption

```json
// Phase 1: Start with formatting only
{
  "formatter": {
    "enabled": true
  },
  "linter": {
    "enabled": false
  }
}

// Phase 2: Add recommended linting
{
  "formatter": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}

// Phase 3: Customize rules based on project needs
{
  "formatter": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "error"
      }
    }
  }
}
```

### Per-File Overrides

```json
{
  "overrides": [
    {
      // Relax rules for test files
      "include": ["**/*.test.ts", "**/*.spec.ts"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "off"
          }
        }
      }
    },
    {
      // Different formatting for config files
      "include": ["*.config.js", "*.config.ts"],
      "formatter": {
        "lineWidth": 120
      }
    },
    {
      // Stricter rules for components
      "include": ["src/components/**/*.tsx"],
      "linter": {
        "rules": {
          "a11y": {
            "recommended": true
          }
        }
      }
    }
  ]
}
```

### Inline Suppression

```typescript
// Suppress specific rule for next line
// biome-ignore lint/suspicious/noExplicitAny: Dynamic data from API
const data: any = await fetchData();

// Suppress multiple rules
// biome-ignore lint/style/useConst lint/correctness/noUnusedVariables: WIP code
let temp = 'debugging';

// Suppress for entire file (at top of file)
// biome-ignore-all lint/suspicious/noExplicitAny: Legacy migration

// Format suppression
// biome-ignore format: Complex nested structure
const config = {a:{b:{c:{d:{e:1}}}}};
```

### Monorepo Configuration

```json
// Root biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

```json
// packages/frontend/biome.json (extends root)
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
  "extends": ["../../biome.json"],
  "linter": {
    "rules": {
      "a11y": {
        "recommended": true
      }
    }
  }
}
```

```json
// packages/backend/biome.json (extends root)
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",
  "extends": ["../../biome.json"],
  "linter": {
    "rules": {
      "style": {
        "noNonNullAssertion": "error"
      }
    }
  }
}
```

## Common Pitfalls

### Configuration File Location

```bash
# Problem: Biome can't find config
$ biome check ./src
# Error: No configuration file found

# Solution: Ensure biome.json is in project root
# or specify config path
$ biome check ./src --config-path ./config/biome.json
```

### Rule Conflicts with Existing Code

```json
// Problem: Too many errors when enabling recommended
{
  "linter": {
    "rules": {
      "recommended": true
      // Results in hundreds of errors!
    }
  }
}

// Solution: Gradually enable rules
{
  "linter": {
    "rules": {
      // Start with safe rules
      "correctness": {
        "noUnusedVariables": "warn",  // Start as warning
        "useExhaustiveDependencies": "warn"
      },
      // Add more rules over time
      "suspicious": {
        "noDoubleEquals": "warn"
      }
    }
  }
}
```

### Formatting Differences from Prettier

```javascript
// Prettier output
const obj = {
  foo: 'bar',
  baz: 'qux',
};

// Biome output (may differ in edge cases)
const obj = {
  foo: "bar",  // Note: default quote style is double
  baz: "qux",
};

// Solution: Configure to match Prettier style
{
  "javascript": {
    "formatter": {
      "quoteStyle": "single"
    }
  }
}
```

### Import Organization Surprises

```typescript
// Before
import { useState } from 'react';
import './styles.css';
import { Button } from '@/components';
import type { User } from '@/types';

// After organize imports (may surprise you)
import { useState } from 'react';

import type { User } from '@/types';

import { Button } from '@/components';

import './styles.css';

// Control with configuration
{
  "organizeImports": {
    "enabled": true
    // Note: Import organization is opinionated
    // Consider disabling if it conflicts with project conventions
  }
}
```

### Missing ESLint Rules

```javascript
// Some ESLint rules don't have Biome equivalents yet
// Example: eslint-plugin-import rules

// Problem: No automatic import sorting by path
// Solution: Use organizeImports or wait for feature

// Problem: No custom rule plugins
// Solution: Use Biome for what it supports,
// keep ESLint for specialized plugins if needed
```

## Performance Considerations

### Benchmark Results

```
Large React Monorepo (500K lines of code):

Format All Files:
  Prettier:     45 seconds
  Biome:        1.2 seconds (37x faster)

Lint All Files:
  ESLint:       120 seconds
  Biome:        3.5 seconds (34x faster)

Check (format + lint):
  ESLint + Prettier:  165 seconds
  Biome:              4.7 seconds (35x faster)

Incremental (10 changed files):
  ESLint + Prettier:  8 seconds
  Biome:              0.3 seconds (27x faster)
```

### Memory Usage

```
Memory footprint comparison:

ESLint + Prettier + TypeScript ESLint:
  Peak memory: ~1.2GB
  Average: ~800MB

Biome:
  Peak memory: ~200MB
  Average: ~150MB

Result: ~5x less memory usage
```

### Optimization Tips

```json
// Optimize for large codebases
{
  "files": {
    // Explicitly ignore large directories
    "ignore": [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.git/**",
      "**/coverage/**",
      "**/*.min.js"
    ],
    // Set reasonable file size limit
    "maxSize": 1048576  // 1MB
  },

  // Disable features you don't need
  "organizeImports": {
    "enabled": false  // If not using import organization
  }
}
```

## Real-World Scenarios

### Greenfield Project Setup

```bash
# Create new project with Biome from start
mkdir my-project && cd my-project
npm init -y
npm install --save-dev @biomejs/biome typescript

# Initialize Biome
npx @biomejs/biome init
```

```json
// biome.json - Production-ready config
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",

  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },

  "files": {
    "ignoreUnknown": true,
    "ignore": ["node_modules", "dist"]
  },

  "organizeImports": {
    "enabled": true
  },

  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },

  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingComma": "all"
    }
  },

  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

### Migrating Large Codebase

```bash
# Step 1: Add Biome alongside existing tools
npm install --save-dev @biomejs/biome

# Step 2: Run migration
npx @biomejs/biome migrate eslint --write
npx @biomejs/biome migrate prettier --write

# Step 3: Check current violations
npx @biomejs/biome lint ./src 2>&1 | head -100

# Step 4: Create baseline (suppress existing issues)
npx @biomejs/biome check ./src --write

# Step 5: Enable in CI (warning mode first)
# Step 6: Fix issues incrementally
# Step 7: Remove old tools
```

```json
// biome.json for gradual migration
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      // Downgrade problematic rules during migration
      "suspicious": {
        "noExplicitAny": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn"
      }
    }
  }
}
```

### Next.js Project Integration

```json
// biome.json for Next.js
{
  "$schema": "https://biomejs.dev/schemas/1.5.0/schema.json",

  "files": {
    "ignore": [
      ".next",
      "out",
      "node_modules",
      "public",
      "*.config.js",
      "*.config.mjs"
    ]
  },

  "formatter": {
    "enabled": true
  },

  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "useExhaustiveDependencies": "warn",
        "noUnusedImports": "error"
      },
      "style": {
        "useImportType": "error"
      },
      "a11y": {
        "useAltText": "error",
        "useButtonType": "warn"
      }
    }
  },

  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always"
    }
  }
}
```

```json
// next.config.js - ESLint still runs by default in Next.js
// Disable it to avoid conflicts
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true  // Use Biome instead
  }
};

module.exports = nextConfig;
```

## Interview Key Points

### Core Concepts

**Q1: What is Biome and what problem does it solve?**

Biome is a unified toolchain for web development that combines formatting, linting, and more in a single Rust-based tool. It solves:

1. **Tooling Fragmentation**: Replaces ESLint, Prettier, and their plugins
2. **Performance**: 30-35x faster than JavaScript-based alternatives
3. **Configuration Complexity**: Single config vs multiple tool configs
4. **Tool Conflicts**: No more ESLint-Prettier conflicts

**Q2: Why is Biome faster than ESLint and Prettier?**

1. **Rust Implementation**: Native code vs JavaScript interpretation
2. **Unified Parser**: Single parse for all features vs separate parsers
3. **Parallel Processing**: Utilizes all CPU cores effectively
4. **No Plugin Loading**: Built-in rules vs dynamic plugin loading
5. **Optimized Algorithms**: Purpose-built data structures

**Q3: When should you use Biome vs ESLint + Prettier?**

Use Biome when:
- Starting new projects
- Performance is critical (large codebases)
- Want unified configuration
- Standard linting rules are sufficient

Keep ESLint when:
- Need specialized plugins (eslint-plugin-security, etc.)
- Have complex custom rules
- Organization mandates specific ESLint configuration

### Practical Questions

**Q4: How do you migrate from ESLint to Biome?**

1. Install Biome: `npm install --save-dev @biomejs/biome`
2. Run migration: `npx @biomejs/biome migrate eslint --write`
3. Review and adjust generated `biome.json`
4. Update CI/CD to use `biome ci`
5. Update pre-commit hooks
6. Remove ESLint dependencies
7. Update editor configuration

**Q5: How do you handle false positives in Biome?**

```typescript
// Option 1: Inline suppression
// biome-ignore lint/suspicious/noExplicitAny: API returns dynamic data
const data: any = response.data;

// Option 2: Configure rule level
{
  "linter": {
    "rules": {
      "suspicious": {
        "noExplicitAny": "warn"  // Downgrade to warning
      }
    }
  }
}

// Option 3: Override for specific paths
{
  "overrides": [{
    "include": ["**/*.test.ts"],
    "linter": {
      "rules": {
        "suspicious": {
          "noExplicitAny": "off"
        }
      }
    }
  }]
}
```

## Further Reading

### Official Documentation

- [Biome Documentation](https://biomejs.dev/) - Official documentation
- [Biome GitHub](https://github.com/biomejs/biome) - Source code and issues
- [Biome Rules Reference](https://biomejs.dev/linter/rules/) - Complete rules documentation

### Migration Guides

- [ESLint Migration Guide](https://biomejs.dev/guides/migrate-eslint-prettier/) - Official migration guide
- [Prettier Migration Guide](https://biomejs.dev/guides/migrate-eslint-prettier/) - Formatter migration

### Editor Integration

- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) - Official VS Code extension
- [IntelliJ Plugin](https://plugins.jetbrains.com/plugin/22761-biome) - JetBrains IDEs support

### Community Resources

- [Biome Discord](https://discord.gg/BypW39g6Yc) - Community discussions
- [Biome Blog](https://biomejs.dev/blog/) - Official announcements and articles

### Related Tools

- [ESLint](https://eslint.org/) - For comparison and specialized plugins
- [Prettier](https://prettier.io/) - For comparison
- [oxlint](https://oxc-project.github.io/) - Another Rust-based linter

---

Biome represents a significant shift in the JavaScript tooling landscape, offering a unified, high-performance alternative to the traditional ESLint + Prettier combination. By leveraging Rust's performance advantages and providing sensible defaults, Biome dramatically improves the developer experience while maintaining the code quality guarantees teams expect. As the project continues to mature, it's becoming an increasingly compelling choice for both new projects and those looking to simplify their tooling stack.
