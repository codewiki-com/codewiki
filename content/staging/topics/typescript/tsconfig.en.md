---
title: TypeScript Configuration
description: Complete guide to tsconfig.json, compiler options, project references and best practices
track: typescript
section: config-migration
difficulty: intermediate
tags:
  - TypeScript
  - tsconfig
  - Configuration
  - Compiler
status: imported
origin: old/src/content/docs/typescript/tsconfig.en.md
divergence: 0.217
issues: []
legacy:
  category: TypeScript
  subcategory: Toolchain
  order: 8
  lastUpdated: 2026-01-07
---

The `tsconfig.json` file is the cornerstone of any TypeScript project. It defines how the TypeScript compiler processes your code, which files to include, and what JavaScript output to generate. Understanding these configuration options is essential for building robust TypeScript applications.

## Introduction to tsconfig.json

A `tsconfig.json` file in a directory indicates that the directory is the root of a TypeScript project. This file specifies the root files and the compiler options required to compile the project.

### Creating a tsconfig.json

You can generate a tsconfig.json file using the TypeScript compiler:

```bash
# Initialize with default settings
npx tsc --init

# Or if TypeScript is installed globally
tsc --init
```

This creates a tsconfig.json with sensible defaults and commented explanations for each option.

### Basic Structure

A tsconfig.json file has several top-level properties:

```json
{
  "compilerOptions": {
    // Compiler settings go here
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"],
  "files": ["src/index.ts"],
  "extends": "./base-config.json",
  "references": []
}
```

## Compiler Options

The `compilerOptions` property is where you configure how TypeScript compiles your code. Options are organized into several categories.

### Target and Module Settings

These options control the JavaScript output format and module system.

#### target

Specifies the ECMAScript target version for the emitted JavaScript:

```json
{
  "compilerOptions": {
    "target": "ES2020"
  }
}
```

Common values:
- `ES5`: Compatible with older browsers
- `ES6`/`ES2015`: Introduces classes, arrow functions, and modules
- `ES2020`: Includes optional chaining and nullish coalescing
- `ESNext`: Latest ECMAScript features

#### module

Defines the module system for the output code:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

Common values:
- `CommonJS`: Node.js style require/exports
- `ES6`/`ES2015`: Native ES modules
- `NodeNext`: Node.js ESM with full package.json support
- `ESNext`: Latest module features

#### moduleResolution

Controls how TypeScript resolves module imports:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

Options:
- `node`: Traditional Node.js resolution
- `node16`/`nodenext`: Modern Node.js resolution with ESM support
- `bundler`: For use with bundlers like Webpack or Vite

### Strict Mode Options

Strict mode enables a set of type-checking options that catch more errors at compile time.

#### Enabling Strict Mode

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

The `strict` flag enables all strict type-checking options:

- `strictNullChecks`: Makes `null` and `undefined` distinct types
- `strictFunctionTypes`: Enables contravariant function parameter checking
- `strictBindCallApply`: Checks that bind, call, and apply match the original function
- `strictPropertyInitialization`: Ensures class properties are initialized
- `noImplicitAny`: Errors on expressions with implied `any` type
- `noImplicitThis`: Errors when `this` has an implied `any` type
- `alwaysStrict`: Emits `"use strict"` in all output files
- `useUnknownInCatchVariables`: Types catch clause variables as `unknown`

#### Granular Strict Options

You can enable strict mode but disable specific checks:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitThis": false
  }
}
```

Or enable individual checks without the full strict mode:

```json
{
  "compilerOptions": {
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

### Additional Type Checking

Beyond strict mode, TypeScript offers more type-checking options:

```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

Key options explained:

- `noUncheckedIndexedAccess`: Adds `undefined` to index signature results
- `exactOptionalPropertyTypes`: Distinguishes between `undefined` and missing properties
- `noImplicitReturns`: Ensures all code paths return a value
- `noFallthroughCasesInSwitch`: Prevents switch case fallthrough without explicit `break`
- `noImplicitOverride`: Requires `override` keyword when overriding base class methods

### Output Configuration

Control where and how TypeScript emits compiled files:

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "inlineSourceMap": false,
    "removeComments": false,
    "noEmit": false,
    "noEmitOnError": true
  }
}
```

Options explained:

- `outDir`: Directory for compiled JavaScript files
- `rootDir`: Root directory of source files (preserves folder structure in outDir)
- `declaration`: Generates `.d.ts` declaration files
- `declarationMap`: Creates sourcemaps for declaration files
- `sourceMap`: Generates `.js.map` files for debugging
- `noEmit`: Disables file emission (useful for type-checking only)
- `noEmitOnError`: Prevents emission if there are errors

### Module and Import Settings

Configure how modules are resolved and imported:

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"]
    },
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true
  }
}
```

Key options:

- `baseUrl`: Base directory for resolving non-relative module names
- `paths`: Path mapping for module aliases
- `esModuleInterop`: Enables interoperability between CommonJS and ES modules
- `resolveJsonModule`: Allows importing JSON files as modules
- `verbatimModuleSyntax`: Enforces consistent import/export syntax
- `isolatedModules`: Ensures each file can be safely transpiled in isolation

### JSX Configuration

For React and other JSX-based frameworks:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

JSX modes:
- `preserve`: Keeps JSX for another tool to process
- `react`: Transforms JSX to `React.createElement`
- `react-jsx`: Modern React 17+ transformation
- `react-jsxdev`: Development mode with extra debugging
- `react-native`: Preserves JSX for React Native

### Library and Type Definitions

Specify which built-in type definitions to include:

```json
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["node", "jest"],
    "typeRoots": ["./node_modules/@types", "./custom-types"]
  }
}
```

Options:
- `lib`: Built-in type definitions to include
- `types`: Limit which `@types` packages are included
- `typeRoots`: Directories containing type definitions

## File Inclusion and Exclusion

Control which files TypeScript processes:

```json
{
  "compilerOptions": {},
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"],
  "files": ["src/globals.d.ts"]
}
```

### include

An array of glob patterns for files to include:

```json
{
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx"
  ]
}
```

### exclude

An array of glob patterns for files to exclude:

```json
{
  "exclude": [
    "node_modules",
    "**/*.test.ts",
    "build"
  ]
}
```

### files

Explicitly list specific files to include:

```json
{
  "files": [
    "src/index.ts",
    "src/types.d.ts"
  ]
}
```

Note: `files` takes precedence over `include` and `exclude`.

## Configuration Inheritance with extends

TypeScript supports configuration inheritance, allowing you to share common settings across projects.

### Basic Inheritance

Create a base configuration:

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

Extend it in your project:

```json
// tsconfig.json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### Multiple Inheritance

TypeScript 5.0+ supports extending from multiple configurations:

```json
{
  "extends": [
    "@tsconfig/node18/tsconfig.json",
    "./tsconfig.base.json"
  ],
  "compilerOptions": {
    "outDir": "dist"
  }
}
```

Later configurations in the array override earlier ones for conflicting settings.

### Using Community Bases

The `@tsconfig` npm organization provides recommended configurations:

```bash
npm install --save-dev @tsconfig/node18 @tsconfig/strictest
```

```json
{
  "extends": "@tsconfig/node18/tsconfig.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

Popular community bases:
- `@tsconfig/node18`, `@tsconfig/node20`: Node.js configurations
- `@tsconfig/strictest`: Maximum type safety
- `@tsconfig/recommended`: General purpose settings

## Project References

Project references allow you to structure TypeScript programs into smaller pieces, improving build times and enforcing logical separation.

### Enabling Composite Projects

For a project to be referenced, enable the `composite` option:

```json
// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

The `composite` option enforces:
- `declaration` must be enabled
- All input files must be matched by an `include` pattern or listed in `files`
- `rootDir` defaults to the directory containing the tsconfig.json

### Referencing Other Projects

Use the `references` array to declare dependencies:

```json
// packages/app/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" },
    { "path": "../utils" }
  ]
}
```

### Building with Project References

Use `tsc --build` (or `tsc -b`) to build projects with references:

```bash
# Build a single project and its dependencies
tsc -b packages/app

# Build all projects
tsc -b packages/app packages/api

# Clean and rebuild
tsc -b --clean
tsc -b --force
```

### Solution-Style Configuration

Create a root tsconfig.json that references all projects:

```json
// tsconfig.json (root)
{
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/utils" },
    { "path": "./packages/app" },
    { "path": "./packages/api" }
  ]
}
```

Build all projects with:

```bash
tsc -b
```

### Incremental Builds

Enable incremental compilation for faster rebuilds:

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

For composite projects, incremental is automatically enabled.

## Practical Configuration Examples

### Node.js Application

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "types": ["node"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUncheckedIndexedAccess": true,
    "noEmitOnError": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### React Application

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### Library Package

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "verbatimModuleSyntax": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Monorepo with Project References

Root configuration:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/cli" },
    { "path": "./packages/web" }
  ]
}
```

Package configuration:

```json
// packages/core/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

Dependent package:

```json
// packages/cli/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../core" }
  ]
}
```

## Best Practices

### Start with Strict Mode

Always enable strict mode for new projects:

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

This catches more errors at compile time and encourages better type definitions.

### Use Modern Module Settings

For Node.js projects, use NodeNext for full ESM support:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

For bundled applications, use the bundler resolution:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

### Enable Extra Checks

Consider enabling additional checks beyond strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Use skipLibCheck

Enable `skipLibCheck` to speed up compilation:

```json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

This skips type checking of declaration files, which is usually safe and significantly faster.

### Organize with Project References

For large codebases, use project references to:
- Improve build times through incremental compilation
- Enforce architectural boundaries
- Enable parallel type-checking

### Use Configuration Inheritance

Create a base configuration for shared settings:

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Separate Test Configuration

Create a separate configuration for tests:

```json
// tsconfig.test.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["node", "jest"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

### Document Non-Obvious Settings

Add comments to explain why certain options are configured:

```json
{
  "compilerOptions": {
    // Required for ESM support in Node.js
    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    // Speeds up compilation without sacrificing type safety
    "skipLibCheck": true,

    // Prevents issues with case-insensitive file systems
    "forceConsistentCasingInFileNames": true
  }
}
```

## Troubleshooting Common Issues

### Module Resolution Errors

If imports are not resolving correctly:

1. Verify `moduleResolution` matches your runtime environment
2. Check `baseUrl` and `paths` configuration
3. Ensure `esModuleInterop` is enabled for CommonJS interoperability

### Type Definition Issues

If type definitions are not found:

1. Install the appropriate `@types` packages
2. Check `typeRoots` configuration
3. Verify `types` array is not excluding needed definitions

### Build Performance

If builds are slow:

1. Enable `skipLibCheck`
2. Use `incremental` compilation
3. Consider project references for large codebases
4. Use `tsc --diagnostics` to identify bottlenecks

### Declaration File Generation

If `.d.ts` files are not generated:

1. Enable `declaration` option
2. Ensure `noEmit` is not enabled
3. For composite projects, verify `composite` is true

## Summary

The `tsconfig.json` file is central to TypeScript development. Key takeaways:

- Use `strict: true` for maximum type safety
- Choose module settings appropriate for your target runtime
- Leverage configuration inheritance for maintainability
- Use project references for large or monorepo projects
- Enable source maps and declaration files for debugging and library development

Understanding these configuration options allows you to tailor TypeScript's behavior to your project's specific needs while maintaining type safety and developer productivity.
