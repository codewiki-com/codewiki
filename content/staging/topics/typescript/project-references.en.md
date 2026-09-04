---
title: TypeScript 项目引用
description: 深入理解 TypeScript 项目引用机制，掌握 composite 项目、references 配置、--build 模式、增量编译与 monorepo 最佳实践
track: typescript
section: config-migration
difficulty: advanced
tags:
  - TypeScript
  - 项目引用
  - monorepo
  - 增量编译
  - 构建优化
status: imported
origin: old/src/content/docs/typescript/project-references.en.md
divergence: 0.208
issues:
  - title-lang-en
  - title-language
legacy:
  category: TypeScript
  subcategory: 工具链
  order: 9
  lastUpdated: 2026-01-07
---

TypeScript Project References is an important feature introduced in TypeScript 3.0 that fundamentally changed how large TypeScript projects are organized and built. By splitting codebases into multiple interdependent sub-projects, project references enable incremental compilation, faster build times, and better code boundary management.

## Concept Explanation

### What Are Project References?

Project references are a mechanism for organizing TypeScript programs into multiple smaller projects. Each sub-project has its own independent `tsconfig.json` configuration file and can be referenced by other projects. This structure brings several key advantages:

```
monorepo/
├── packages/
│   ├── core/              # Core library
│   │   ├── src/
│   │   └── tsconfig.json
│   ├── utils/             # Utility library
│   │   ├── src/
│   │   └── tsconfig.json
│   └── app/               # Application
│       ├── src/
│       └── tsconfig.json
└── tsconfig.json          # Root configuration
```

### Core Problems Solved

Before project references, large TypeScript projects faced the following challenges:

1. **Long compilation times**: Every change required recompiling the entire project
2. **Unclear code boundaries**: Unable to enforce dependency directions between modules
3. **Slow IDE response**: Needed to load and analyze the entire codebase
4. **Cannot test independently**: Sub-modules couldn't be compiled and verified separately

Project references solve these problems through:

- **Incremental compilation**: Only recompile projects that have changed and their dependents
- **Enforced dependency boundaries**: Prevent circular dependencies through explicit reference declarations
- **Parallel builds**: Independent projects can be compiled in parallel
- **Faster editor response**: IDE only needs to load the current project and its dependencies

### Use Cases

Project references are particularly suitable for:

- **Monorepo architecture**: Multiple packages sharing a codebase
- **Large monolithic projects**: Need to be split into logical modules
- **Library and application separation**: Shared libraries used by multiple applications
- **Frontend-backend shared types**: Sharing API type definitions

## Core Principles

### Composite Projects

The `composite` option is the foundation of project references. It tells the TypeScript compiler that this project can be referenced by other projects:

```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

Enabling `composite` enforces the following constraints:

1. **Must enable `declaration`**: Generate `.d.ts` type declaration files
2. **Must set `rootDir`**: Explicitly define the source code root directory
3. **All source files must be matched by `include` or `files`**: No orphaned files allowed
4. **Enables incremental compilation**: Automatically generates `.tsbuildinfo` file

### References Array

The `references` array declares other projects that the current project depends on:

```json
{
  "compilerOptions": {
    "outDir": "./dist"
  },
  "references": [
    { "path": "../core" },
    { "path": "../utils" }
  ]
}
```

Each reference contains a `path` property pointing to the directory of the referenced project (containing `tsconfig.json`) or directly to the configuration file.

How references work:

1. **Type resolution**: Read types from the referenced project's `.d.ts` files
2. **Does not recompile dependencies**: Dependencies must already be built
3. **Version aware**: Detect if dependencies are outdated through `.tsbuildinfo`

### Build Dependency Graph

The TypeScript compiler builds a project dependency graph based on `references`:

```
        ┌─────────┐
        │  core   │
        └────┬────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌─────────┐     ┌─────────┐
│  utils  │     │   api   │
└────┬────┘     └────┬────┘
     │               │
     └───────┬───────┘
             ▼
        ┌─────────┐
        │   app   │
        └─────────┘
```

This dependency graph ensures:

- Compilation in correct topological order
- Detection of circular dependencies
- Maximum parallelization

## Key Points

### Required Configuration for Composite Projects

```json
{
  "compilerOptions": {
    // Required options
    "composite": true,
    "declaration": true,

    // Strongly recommended
    "declarationMap": true,      // Support jumping to source code
    "sourceMap": true,           // Debugging support
    "outDir": "./dist",          // Output directory
    "rootDir": "./src",          // Source root directory

    // Optional but recommended
    "incremental": true,         // Incremental compilation
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  },
  "include": ["src/**/*"]
}
```

### Role of Root Configuration File

The `tsconfig.json` in the root directory typically serves as the solution configuration:

```json
{
  "files": [],                    // Does not directly include any files
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/utils" },
    { "path": "./packages/api" },
    { "path": "./packages/app" }
  ]
}
```

`files: []` indicates that this configuration itself does not compile any files, only coordinates sub-projects.

### The prepend Option

The `prepend` option prepends the output of the referenced project to the current project's output:

```json
{
  "references": [
    { "path": "../core", "prepend": true }
  ]
}
```

This is useful when building a single bundled output, but modern projects typically use bundlers for this, so this option is rarely used.

### Private Reference Pattern

Use `private: true` to mark internal modules:

```json
// packages/internal/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true
  }
}
```

Combined with package manager workspace protocols, you can control which packages are accessible externally.

## Code Examples

### Basic Monorepo Structure

Create a monorepo with three packages:

```
my-monorepo/
├── packages/
│   ├── shared/           # Shared utility library
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── server/           # Backend service
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── client/           # Frontend application
│       ├── src/
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
├── tsconfig.json
└── package.json
```

#### Shared Library Configuration

```json
// packages/shared/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

```typescript
// packages/shared/src/types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
```

```typescript
// packages/shared/src/index.ts
export * from './types';

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

#### Backend Service Configuration

```json
// packages/server/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

```typescript
// packages/server/src/index.ts
import { User, ApiResponse, validateEmail, formatDate } from '@my-monorepo/shared';

interface CreateUserRequest {
  name: string;
  email: string;
}

function createUser(request: CreateUserRequest): ApiResponse<User> {
  if (!validateEmail(request.email)) {
    return {
      success: false,
      data: null as unknown as User,
      error: 'Invalid email format'
    };
  }

  const user: User = {
    id: crypto.randomUUID(),
    name: request.name,
    email: request.email,
    createdAt: new Date()
  };

  console.log(`User created on ${formatDate(user.createdAt)}`);

  return {
    success: true,
    data: user
  };
}

export { createUser };
```

#### Frontend Application Configuration

```json
// packages/client/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

```typescript
// packages/client/src/index.ts
import { User, ApiResponse, formatDate } from '@my-monorepo/shared';

async function fetchUser(id: string): Promise<User | null> {
  const response = await fetch(`/api/users/${id}`);
  const result: ApiResponse<User> = await response.json();

  if (result.success) {
    console.log(`User last active: ${formatDate(result.data.createdAt)}`);
    return result.data;
  }

  console.error(result.error);
  return null;
}

export { fetchUser };
```

#### Root Configuration File

```json
// tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/server" },
    { "path": "./packages/client" }
  ]
}
```

#### Package.json Configuration

```json
// package.json (root directory)
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "tsc --build",
    "build:force": "tsc --build --force",
    "clean": "tsc --build --clean",
    "watch": "tsc --build --watch"
  }
}
```

```json
// packages/shared/package.json
{
  "name": "@my-monorepo/shared",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"]
}
```

### Layered Architecture Example

Demonstrating a more complex layered architecture:

```
enterprise-app/
├── packages/
│   ├── domain/           # Domain model layer
│   ├── infrastructure/   # Infrastructure layer
│   ├── application/      # Application service layer
│   └── presentation/     # Presentation layer
└── tsconfig.json
```

```json
// packages/domain/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true
  },
  "include": ["src/**/*"]
  // Domain layer has no dependencies on other layers
}
```

```json
// packages/infrastructure/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../domain" }
  ]
}
```

```json
// packages/application/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../domain" },
    { "path": "../infrastructure" }
  ]
}
```

```json
// packages/presentation/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../domain" },
    { "path": "../application" }
  ]
}
```

## Best Practices

### Use Base Configuration Inheritance

Create shared base configuration to reduce repetition:

```json
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true
  }
}
```

```json
// packages/shared/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### Clear Dependency Direction

Establish a clear dependency hierarchy to avoid circular dependencies:

```
Correct dependency direction:
presentation -> application -> domain
infrastructure -> domain

Avoid circular dependencies:
domain <-> infrastructure (Wrong!)
```

### Appropriate Project Granularity

- **Too coarse**: Loses the benefits of incremental compilation
- **Too fine**: Increases management complexity
- **Recommended**: Divide by functional domain or business boundaries

```
Recommended structure:
packages/
├── shared/          # Common utilities and types
├── core/            # Core business logic
├── api/             # API layer
├── web/             # Web frontend
└── mobile/          # Mobile
```

### Configure Declaration File Output

Ensure both IDE and build tools can correctly resolve types:

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "declarationDir": "./dist/types"
  }
}
```

### Version Build Information

Include `.tsbuildinfo` in version control or configure in a fixed location:

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

### CI/CD Optimization

Use incremental builds in CI environments:

```yaml
# .github/workflows/build.yml
- name: Build
  run: |
    npm ci
    npm run build

- name: Cache TypeScript build info
  uses: actions/cache@v3
  with:
    path: |
      packages/**/dist/.tsbuildinfo
    key: tsbuildinfo-${{ hashFiles('packages/**/src/**/*.ts') }}
```

## Common Pitfalls

### Forgetting to Enable declaration

```json
// Wrong: missing declaration
{
  "compilerOptions": {
    "composite": true
  }
}

// Correct
{
  "compilerOptions": {
    "composite": true,
    "declaration": true
  }
}
```

### Circular References

```
// Wrong: A references B, B references A
packages/a/tsconfig.json: references: [{ "path": "../b" }]
packages/b/tsconfig.json: references: [{ "path": "../a" }]
```

Solution: Extract shared code to a new independent package:

```
// Correct: Extract shared code
packages/shared/  <- Both A and B depend on shared
packages/a/       <- Depends on shared
packages/b/       <- Depends on shared
```

### Inconsistent Path Configuration

Ensure paths in `tsconfig.json` are consistent with package manager workspace configuration:

```json
// Path mismatch
// Using relative path in tsconfig.json
"references": [{ "path": "../shared" }]

// Using package name in package.json
"dependencies": { "@my-scope/shared": "workspace:*" }
```

Make sure both correctly resolve to the same package.

### Missing References in Root Configuration

```json
// Root configuration missing some packages
{
  "references": [
    { "path": "./packages/core" }
    // Missing ./packages/utils
  ]
}

// Include all packages that need to be built
{
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/utils" },
    { "path": "./packages/app" }
  ]
}
```

### Directly Importing Source Files

```typescript
// Wrong: Directly importing source files
import { something } from '../shared/src/index';

// Correct: Import via package name
import { something } from '@my-scope/shared';
```

### Build Artifacts Not Committed or Generated

```bash
# Wrong: Dependencies not built
tsc --project packages/app

# Correct: Use --build mode
tsc --build packages/app
```

## Performance Considerations

### Incremental Compilation Benefits

The main performance advantage of project references comes from incremental compilation:

| Scenario | Without Project References | With Project References |
|----------|---------------------------|------------------------|
| First compilation | 100% | 100% |
| Modify single file | 100% (full recompilation) | 5-10% (only recompile affected projects) |
| Modify types only | 100% | 2-5% |

### Build Caching Strategy

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./dist/.tsbuildinfo"
  }
}
```

The `.tsbuildinfo` file contains:
- File hashes
- Dependency graph
- Output file signatures

### Parallel Builds

The TypeScript compiler automatically builds projects with no dependency relationships in parallel:

```
Build order example:
Phase 1: [core]                     <- No dependencies, build first
Phase 2: [utils, api] (parallel)    <- Both depend on core
Phase 3: [app]                      <- Depends on utils and api
```

### Optimization Tips for Large Projects

1. **Build on demand**: Only build the packages you're currently working on

```bash
# Only build a specific package and its dependencies
tsc --build packages/app
```

2. **Skip type checking**: Can skip checking when bundling

```bash
# Run type checking separately before bundling
tsc --build --noEmit
```

3. **Use swc or esbuild**: For pure transpilation scenarios

```bash
# Use esbuild for fast transpilation
esbuild src/**/*.ts --outdir=dist

# Use tsc separately for type checking
tsc --noEmit
```

4. **Reasonable project boundaries**: Avoid over-splitting

```
Over-splitting (one project per file)
Reasonable division (by functional domain)
```

## Practical Scenarios

### Scenario 1: Full-Stack TypeScript Monorepo

```
fullstack-app/
├── packages/
│   ├── types/           # Shared type definitions
│   ├── validation/      # Shared validation logic
│   ├── api/             # Express backend
│   └── web/             # React frontend
└── tsconfig.json
```

```json
// packages/types/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

```typescript
// packages/types/src/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface CreateUserDTO {
  email: string;
  name: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
```

Both API and Web reference types:

```json
// packages/api/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../types" },
    { "path": "../validation" }
  ]
}
```

### Scenario 2: Component Library Development

```
ui-library/
├── packages/
│   ├── tokens/          # Design tokens
│   ├── icons/           # Icons
│   ├── components/      # Components
│   └── themes/          # Themes
└── tsconfig.json
```

```json
// packages/components/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../tokens" },
    { "path": "../icons" }
  ]
}
```

### Scenario 3: Microservices Architecture

```
microservices/
├── packages/
│   ├── proto/           # gRPC protocol definitions
│   ├── common/          # Shared utilities
│   ├── user-service/    # User service
│   ├── order-service/   # Order service
│   └── gateway/         # API gateway
└── tsconfig.json
```

Each service is configured independently but shares protocol definitions:

```json
// packages/user-service/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../proto" },
    { "path": "../common" }
  ]
}
```

## Interview Key Points

### Common Interview Questions

**1. What are TypeScript project references? What problems do they solve?**

Project references are a feature introduced in TypeScript 3.0 that allows splitting large projects into multiple sub-projects. Main problems solved:
- Long compilation times for large projects
- Unclear code boundaries
- Cannot achieve incremental compilation
- Slow IDE response

**2. What is the purpose of the composite option?**

`composite: true` marks a project as referenceable. It:
- Forces enabling `declaration`
- Requires all files to be matched by include/files
- Automatically generates `.tsbuildinfo` for incremental compilation
- Ensures the project can be referenced by other projects

**3. What's the difference between --build mode and regular tsc?**

```bash
# Regular compilation - does not handle project references
tsc

# --build mode - handles project references, supports incremental compilation
tsc --build
```

Differences:
- `--build` builds all referenced projects in dependency order
- `--build` supports incremental compilation
- `--build` can build projects with no dependencies in parallel

**4. How to handle circular dependencies between projects?**

TypeScript does not allow circular references. Solutions:
- Extract shared code to an independent package
- Redesign dependency relationships
- Use dependency injection or interface segregation

**5. What is the relationship between project references and npm workspaces?**

They are complementary:
- npm workspaces manage dependency relationships and symbolic links between packages
- Project references manage TypeScript compilation order and incremental compilation

Both need to work together for a complete monorepo workflow.

### Advanced Topics

- Principles of incremental compilation (`.tsbuildinfo` file structure)
- How to optimize build performance for large monorepos
- Integration of project references with various bundlers
- How to leverage build caching in CI/CD

## Further Reading

### Official Documentation

- [TypeScript Project References Official Documentation](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [tsconfig.json Reference](https://www.typescriptlang.org/tsconfig)
- [Build Mode (--build)](https://www.typescriptlang.org/docs/handbook/project-references.html#build-mode-for-typescript)

### Related Tools

- [Turborepo](https://turbo.build/) - High-performance monorepo build system
- [Nx](https://nx.dev/) - Smart monorepo tools
- [Lerna](https://lerna.js.org/) - Multi-package management tool
- [pnpm workspaces](https://pnpm.io/workspaces) - Efficient workspace support

### Deep Dive

- [Monorepo Best Practices](https://monorepo.tools/)
- [TypeScript Compilation Principles](https://github.com/microsoft/TypeScript/wiki/Architectural-Overview)
- [Large TypeScript Project Management](https://www.typescriptlang.org/docs/handbook/project-references.html#guidance)

---

TypeScript project references are a powerful tool for managing large codebases. Through reasonable project splitting, clear dependency relationships, and leveraging incremental compilation, you can significantly boost developer productivity and build performance. In practice, it's recommended to start with a simple structure and gradually introduce more complex configurations as the project grows. Remember, the core goal of project references is to keep large projects maintainable while providing an efficient development experience.
