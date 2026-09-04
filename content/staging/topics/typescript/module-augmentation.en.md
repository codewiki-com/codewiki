---
title: TypeScript 模块增强 (Module Augmentation)
description: 深入理解 TypeScript 模块增强机制，掌握声明合并、模块扩展、全局增强等高级技术，学会如何安全地扩展第三方类型定义
track: typescript
section: patterns
difficulty: advanced
tags:
  - TypeScript
  - 模块增强
  - 声明合并
  - 类型扩展
  - 第三方类型
status: imported
origin: old/src/content/docs/typescript/module-augmentation.en.md
divergence: 0.213
issues:
  - title-lang-en
  - missing-subcategory-en
  - missing-subcategory-zh
  - title-language
legacy:
  category: TypeScript
  subcategory: ""
  order: 15
  lastUpdated: 2026-01-07
---

## Concept Explanation

Module Augmentation is a powerful mechanism provided by TypeScript that allows developers to extend type definitions of existing modules without modifying the original module source code. This feature is built upon TypeScript's Declaration Merging foundation.

### What is Module Augmentation?

Module augmentation is essentially a "patching" approach that enables you to:

1. **Extend third-party library types**: When type definitions of third-party libraries are incomplete or need custom extensions
2. **Add global types**: Add custom properties to global objects like Window or NodeJS.Global
3. **Extend built-in types**: Enhance method definitions of native types like Array and String
4. **Modular type organization**: Distribute type definitions across multiple files for management

### Historical Background

Before TypeScript 2.0, extending types of third-party modules was a pain point. Developers needed to:
- Modify type files in `node_modules` (not recommended)
- Use `any` type bindings (losing type safety)
- Completely rewrite type definitions (labor-intensive)

TypeScript 2.0 introduced module augmentation syntax, making type extension elegant and maintainable.

### Problems Solved

| Problem Scenario | Traditional Approach | Module Augmentation Approach |
|-----------------|---------------------|------------------------------|
| Incomplete third-party library types | Use `any` or ignore errors | Declare missing types |
| Need to add custom properties | Type assertions | Interface merging |
| Global object extension | Pollute global namespace | Global augmentation declarations |
| Plugin system type support | Manually maintain types | Dynamic module augmentation |

## Core Principles

### Declaration Merging

Declaration merging is the theoretical foundation of module augmentation. The TypeScript compiler merges multiple declarations with the same name into a single definition.

```typescript
// Interface merging example
interface User {
  name: string;
}

interface User {
  age: number;
}

// After merging, equivalent to:
// interface User {
//   name: string;
//   age: number;
// }

const user: User = {
  name: "Alice",
  age: 30
};
```

### Merging Rules

TypeScript supports merging of the following declarations:

| Declaration Type | Mergeable With |
|-----------------|----------------|
| Interface | Interface, Namespace |
| Namespace | Namespace, Class, Function, Enum |
| Class | Namespace |
| Function | Namespace |
| Enum | Namespace |

**Note**: Classes cannot merge with classes, and variables cannot merge with variables.

### How Module Augmentation Works

```typescript
// Original module (some-library.d.ts)
declare module "some-library" {
  export interface Config {
    baseUrl: string;
  }
}

// Augmentation file (augment.d.ts)
declare module "some-library" {
  interface Config {
    timeout?: number;  // New property
  }
}

// Both are automatically merged when used
import { Config } from "some-library";
const config: Config = {
  baseUrl: "https://api.example.com",
  timeout: 5000  // Type safe!
};
```

### Compiler Processing Flow

1. **Collection phase**: Compiler scans all `.ts` and `.d.ts` files
2. **Recognition phase**: Identifies declarations with the same module name
3. **Merging phase**: Combines declarations according to merging rules
4. **Validation phase**: Checks if merged types are consistent
5. **Output phase**: Generates final type definitions

## Key Points

### Module Augmentation vs Global Augmentation

```typescript
// Module augmentation: Must be in a module file (has import/export)
import "express";

declare module "express" {
  interface Request {
    userId?: string;
  }
}

// Global augmentation: Add types in global scope
declare global {
  interface Window {
    myApp: {
      version: string;
    };
  }
}

export {}; // Ensures the file is treated as a module
```

### Augmentation Location Requirements

| Augmentation Type | File Type Requirement | Syntax |
|------------------|----------------------|--------|
| Module augmentation | Must be a module file | `declare module "xxx" {}` |
| Global augmentation | Must be a module file | `declare global {}` |
| Script declaration | Can be a script file | Direct declaration |

### Interface Member Merging Strategy

```typescript
interface Animal {
  name: string;
  speak(): void;
}

interface Animal {
  age: number;
  speak(): string;  // Function overload, not override
}

// Merged result
interface Animal {
  name: string;
  age: number;
  speak(): void;
  speak(): string;  // Both overload signatures are preserved
}
```

### Namespace Merging

```typescript
// Add static members to a class
class Album {
  label: Album.AlbumLabel;
}

namespace Album {
  export interface AlbumLabel {
    name: string;
  }
}

// Usage
const album = new Album();
const label: Album.AlbumLabel = { name: "EMI" };
```

### Augmentation Scope

- Module augmentation only takes effect in the current file and its importers
- Global augmentation takes effect throughout the entire project
- Augmentation declarations must be compatible with original declarations

## Code Examples

### Example 1: Extending Express Request

```typescript
// types/express.d.ts
import { User } from "../models/User";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
    sessionId?: string;
    startTime?: number;
  }
}

// middleware/auth.ts
import { Request, Response, NextFunction } from "express";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // req.user now has correct types
  if (req.user) {
    console.log(`User: ${req.user.name}`);
  }
  next();
};
```

### Example 2: Extending Vue Component Instance

```typescript
// types/vue.d.ts
import Vue from "vue";
import { AxiosInstance } from "axios";

declare module "vue/types/vue" {
  interface Vue {
    $http: AxiosInstance;
    $eventBus: Vue;
  }
}

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    myCustomOption?: string;
  }
}

// Usage
export default Vue.extend({
  myCustomOption: "hello",
  mounted() {
    this.$http.get("/api/data");  // Type safe
    this.$eventBus.$emit("event");
  }
});
```

### Example 3: Extending Global Window Object

```typescript
// types/global.d.ts
interface AppConfig {
  apiBaseUrl: string;
  version: string;
  features: {
    darkMode: boolean;
    analytics: boolean;
  };
}

declare global {
  interface Window {
    __APP_CONFIG__: AppConfig;
    gtag: (...args: unknown[]) => void;
  }

  // Extend NodeJS global object
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";
      API_KEY: string;
      DATABASE_URL: string;
    }
  }
}

export {};

// Usage
const config = window.__APP_CONFIG__;
console.log(config.version);

const apiKey = process.env.API_KEY;  // string type, not string | undefined
```

### Example 4: Extending Third-Party Library Types

```typescript
// types/lodash.d.ts
import _ from "lodash";

declare module "lodash" {
  interface LoDashStatic {
    /**
     * Custom utility function: Deep freeze an object
     */
    deepFreeze<T extends object>(obj: T): Readonly<T>;
  }
}

// Implementation
import _ from "lodash";

_.mixin({
  deepFreeze<T extends object>(obj: T): Readonly<T> {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach((prop) => {
      const value = (obj as Record<string, unknown>)[prop];
      if (
        value !== null &&
        typeof value === "object" &&
        !Object.isFrozen(value)
      ) {
        _.deepFreeze(value as object);
      }
    });
    return obj as Readonly<T>;
  }
});

// Usage
const frozen = _.deepFreeze({ a: { b: 1 } });  // Type safe
```

### Example 5: Conditional Module Augmentation

```typescript
// types/conditional.d.ts

// Augment different types based on environment
declare module "my-library" {
  interface Config {
    mode: "development" | "production";
  }
}

// Development environment specific augmentation
declare module "my-library" {
  interface Config {
    debug?: boolean;
    verbose?: boolean;
  }
}

// Production environment specific augmentation
declare module "my-library" {
  interface Config {
    sentry?: {
      dsn: string;
    };
    performance?: {
      tracking: boolean;
    };
  }
}
```

### Example 6: Adding Static Properties and Methods to a Class

```typescript
// Original class
class MyClass {
  instanceMethod() {
    return "instance";
  }
}

// Add static members via namespace augmentation
namespace MyClass {
  export const VERSION = "1.0.0";

  export interface Options {
    debug: boolean;
  }

  export function create(options: Options): MyClass {
    console.log("Creating with debug:", options.debug);
    return new MyClass();
  }
}

// Usage
console.log(MyClass.VERSION);  // "1.0.0"
const instance = MyClass.create({ debug: true });
const options: MyClass.Options = { debug: false };
```

### Example 7: Extending Array Prototype Methods

```typescript
// types/array.d.ts
interface Array<T> {
  /**
   * Returns the first element of the array
   */
  first(): T | undefined;

  /**
   * Returns the last element of the array
   */
  last(): T | undefined;

  /**
   * Returns a deduplicated array
   */
  unique(): T[];

  /**
   * Groups by specified property
   */
  groupBy<K extends keyof T>(key: K): Record<string, T[]>;
}

// Implementation (array-extensions.ts)
Array.prototype.first = function<T>(this: T[]): T | undefined {
  return this[0];
};

Array.prototype.last = function<T>(this: T[]): T | undefined {
  return this[this.length - 1];
};

Array.prototype.unique = function<T>(this: T[]): T[] {
  return [...new Set(this)];
};

Array.prototype.groupBy = function<T, K extends keyof T>(
  this: T[],
  key: K
): Record<string, T[]> {
  return this.reduce((acc, item) => {
    const groupKey = String(item[key]);
    (acc[groupKey] = acc[groupKey] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

// Usage
const numbers = [1, 2, 2, 3, 3, 3];
console.log(numbers.first());   // 1
console.log(numbers.last());    // 3
console.log(numbers.unique());  // [1, 2, 3]

const users = [
  { name: "Alice", role: "admin" },
  { name: "Bob", role: "user" },
  { name: "Charlie", role: "admin" }
];
console.log(users.groupBy("role"));
// { admin: [...], user: [...] }
```

## Best Practices

### Type File Organization Structure

```
src/
├── types/
│   ├── global.d.ts          # Global type augmentation
│   ├── express.d.ts         # Express extensions
│   ├── vue.d.ts             # Vue extensions
│   └── index.d.ts           # Type export summary
├── @types/
│   └── my-untyped-lib/      # Declarations for untyped libraries
│       └── index.d.ts
└── tsconfig.json
```

### tsconfig.json Configuration

```json
{
  "compilerOptions": {
    "typeRoots": [
      "./node_modules/@types",
      "./src/types",
      "./src/@types"
    ],
    "types": [
      "node",
      "jest"
    ],
    "baseUrl": ".",
    "paths": {
      "*": ["src/types/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.d.ts"
  ]
}
```

### Module Augmentation Naming Conventions

```typescript
// Recommended: Use descriptive file names
// types/express-augment.d.ts
// types/vue-custom-properties.d.ts

// Recommended: Add detailed comments in augmentations
declare module "express-serve-static-core" {
  /**
   * Extend Express Request interface
   * @description Add user authentication related properties
   * @since v1.2.0
   */
  interface Request {
    /**
     * Currently authenticated user
     * Set by authMiddleware
     */
    user?: import("../models/User").User;
  }
}
```

### Use Interfaces Instead of Type Aliases

```typescript
// Recommended: Use interface, supports declaration merging
declare module "some-lib" {
  interface Options {
    timeout: number;
  }
}

// Not recommended: type does not support declaration merging
declare module "some-lib" {
  type Options = {  // Error: Duplicate identifier
    timeout: number;
  };
}
```

### Keep Augmentations Minimal

```typescript
// Recommended: Only add necessary properties
declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

// Not recommended: Adding too many unrelated properties
declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
    companyId?: string;
    permissions?: string[];
    settings?: Record<string, unknown>;
    cache?: Map<string, unknown>;
    // ... Too many properties make maintenance difficult
  }
}
```

### Version Compatibility Considerations

```typescript
// types/library-augment.d.ts

// Use conditional types to handle version differences
declare module "some-library" {
  // Properties added in v2.x
  interface Config {
    /**
     * @since 2.0.0
     * @deprecated Will be removed in 3.0.0, please use newOption
     */
    legacyOption?: boolean;

    /**
     * @since 2.1.0
     */
    newOption?: string;
  }
}
```

## Common Pitfalls

### Pitfall 1: Forgetting Export Statement

```typescript
// Error: Missing export, file is treated as script not module
declare global {
  interface Window {
    myProp: string;
  }
}
// Global augmentation won't take effect!

// Correct: Add empty export
declare global {
  interface Window {
    myProp: string;
  }
}
export {};  // Critical!
```

### Pitfall 2: Module Path Mismatch

```typescript
// Error: Module name must match exactly
declare module "Express" {  // Case error
  interface Request {
    user?: User;
  }
}

// Correct: The actual module name exported by Express
declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
```

### Pitfall 3: Circular Dependencies

```typescript
// types/a.d.ts
import { B } from "./b";  // Import B
declare module "some-lib" {
  interface A {
    b: B;
  }
}

// types/b.d.ts
import { A } from "./a";  // Circular import!
declare module "some-lib" {
  interface B {
    a: A;
  }
}

// Solution: Use type imports or merge into the same file
import type { B } from "./b";  // Use type-only import
```

### Pitfall 4: Duplicate Declaration Conflicts

```typescript
// Error: Non-interface types cannot merge
declare module "lib" {
  export type Config = { a: string };
}

declare module "lib" {
  export type Config = { b: number };  // Error: Duplicate identifier
}

// Correct: Use interface
declare module "lib" {
  export interface Config { a: string }
}

declare module "lib" {
  export interface Config { b: number }  // Correctly merged
}
```

### Pitfall 5: Augmentation Order Issues

```typescript
// File execution order may cause types to be unavailable
// types/express.d.ts
import { User } from "../models/User";  // If User is not yet defined...

declare module "express" {
  interface Request {
    user?: User;  // User might be any
  }
}

// Solution: Ensure correct dependency order
// Or use dynamic import types
declare module "express" {
  interface Request {
    user?: import("../models/User").User;
  }
}
```

### Pitfall 6: Type Erasure Issues

```typescript
// Properties that don't exist at runtime
declare global {
  interface Window {
    myConfig: AppConfig;
  }
}

// Ensure runtime existence when using
if (typeof window !== "undefined" && window.myConfig) {
  // Safe to use
  console.log(window.myConfig.version);
}

// Unsafe: Direct access may throw an error
console.log(window.myConfig.version);  // Type is correct but may fail at runtime
```

### Pitfall 7: Generic Augmentation Limitations

```typescript
// Error: Cannot add new generic parameters in augmentation
declare module "lib" {
  interface Container<T> {
    value: T;
  }
}

declare module "lib" {
  interface Container<T, U> {  // Error: Generic parameters don't match
    extra: U;
  }
}

// Correct: Keep the same generic signature
declare module "lib" {
  interface Container<T> {
    extra?: unknown;  // Use compatible type
  }
}
```

## Performance Considerations

### Compile-Time Performance

1. **Type Merging Overhead**
   - Large numbers of augmentation declarations increase compiler merging work
   - Recommended to merge related augmentations into the same file

```typescript
// Recommended: Merge related augmentations
declare module "express-serve-static-core" {
  interface Request {
    user?: User;
    session?: Session;
    logger?: Logger;
  }
}

// Not recommended: Scattered across multiple files
// request-user.d.ts, request-session.d.ts, request-logger.d.ts
```

2. **Type Checking Depth**

```typescript
// Avoid deeply nested type augmentations
declare module "lib" {
  interface Config {
    level1: {
      level2: {
        level3: {
          // Deep nesting affects type checking performance
        }
      }
    }
  }
}

// Recommended: Use independent interfaces
interface DeepConfig {
  setting: string;
}

declare module "lib" {
  interface Config {
    deep: DeepConfig;
  }
}
```

### Runtime Performance

Module augmentation is a pure type operation and **does not affect runtime performance**. However, note:

1. Prototype extensions have runtime overhead

```typescript
// Prototype extension has runtime cost
Array.prototype.first = function() {
  return this[0];
};

// Consider using static utility functions instead
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
```

2. Runtime cost of type guards

```typescript
// Type augmentation may require runtime validation
interface Request {
  user?: User;
}

// Requires runtime check
function handler(req: Request) {
  if (req.user) {  // Runtime check
    console.log(req.user.name);
  }
}
```

### IDE Performance

Large numbers of type augmentations may affect IDE responsiveness:

```json
// tsconfig.json optimization
{
  "compilerOptions": {
    "skipLibCheck": true,  // Skip .d.ts file checking
    "incremental": true,   // Incremental compilation
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

## Real-World Scenarios

### Scenario 1: Building a Plugin System

```typescript
// core/plugin-system.ts
export interface PluginContext {
  version: string;
}

export interface Plugin {
  name: string;
  install(context: PluginContext): void;
}

// plugins/logger/types.d.ts
import { PluginContext } from "../../core/plugin-system";

declare module "../../core/plugin-system" {
  interface PluginContext {
    logger: {
      info(msg: string): void;
      error(msg: string): void;
    };
  }
}

// plugins/logger/index.ts
import { Plugin, PluginContext } from "../../core/plugin-system";

export const loggerPlugin: Plugin = {
  name: "logger",
  install(context: PluginContext) {
    context.logger = {
      info: (msg) => console.log(`[INFO] ${msg}`),
      error: (msg) => console.error(`[ERROR] ${msg}`)
    };
  }
};

// app.ts
import { PluginContext } from "./core/plugin-system";
import "./plugins/logger/types";  // Import type augmentation

function initApp(context: PluginContext) {
  context.logger.info("App initialized");  // Type safe!
}
```

### Scenario 2: Type-Safe Internationalization

```typescript
// types/i18n.d.ts
import "vue-i18n";

// Define translation key types
interface TranslationSchema {
  common: {
    save: string;
    cancel: string;
    delete: string;
  };
  user: {
    profile: string;
    settings: string;
    logout: string;
  };
  errors: {
    notFound: string;
    unauthorized: string;
    serverError: string;
  };
}

declare module "vue-i18n" {
  export interface DefineLocaleMessage extends TranslationSchema {}
}

// Usage
import { useI18n } from "vue-i18n";

const { t } = useI18n();
t("common.save");       // Correct
t("user.profile");      // Correct
t("invalid.key");       // Type error!
```

### Scenario 3: Database ORM Extension

```typescript
// types/prisma.d.ts
import { PrismaClient } from "@prisma/client";

declare module "@prisma/client" {
  interface PrismaClient {
    // Soft delete extension
    $softDelete<T extends keyof PrismaClient>(
      model: T,
      where: Parameters<PrismaClient[T]["findFirst"]>[0]["where"]
    ): Promise<{ count: number }>;

    // Audit log extension
    $withAudit<T>(
      operation: () => Promise<T>,
      metadata: { userId: string; action: string }
    ): Promise<T>;
  }
}

// extensions/prisma-extensions.ts
import { PrismaClient } from "@prisma/client";

export function extendPrisma(prisma: PrismaClient) {
  return prisma.$extends({
    model: {
      $allModels: {
        async softDelete<T>(
          this: T,
          where: Record<string, unknown>
        ): Promise<{ count: number }> {
          const context = Prisma.getExtensionContext(this);
          return (context as any).updateMany({
            where,
            data: { deletedAt: new Date() }
          });
        }
      }
    }
  });
}
```

### Scenario 4: State Management Type Augmentation

```typescript
// store/modules/user.ts
export interface UserState {
  id: string | null;
  name: string;
  email: string;
}

export const userModule = {
  state: (): UserState => ({
    id: null,
    name: "",
    email: ""
  }),
  // ... actions, mutations
};

// types/vuex.d.ts
import { Store } from "vuex";
import { UserState } from "../store/modules/user";

interface RootState {
  user: UserState;
  // Other module states...
}

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $store: Store<RootState>;
  }
}

declare module "vuex" {
  export function useStore(): Store<RootState>;
}

// Usage in component
import { useStore } from "vuex";

const store = useStore();
store.state.user.name;  // Full type inference
```

### Scenario 5: API Response Type Augmentation

```typescript
// types/axios.d.ts
import "axios";

// Define API response format
interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

declare module "axios" {
  export interface AxiosResponse<T = unknown> {
    // Original response data
    data: ApiResponse<T>;
  }

  export interface AxiosRequestConfig {
    // Custom configuration
    skipErrorHandler?: boolean;
    retryCount?: number;
  }
}

// api/user.ts
import axios from "axios";

interface User {
  id: string;
  name: string;
}

async function getUser(id: string) {
  const response = await axios.get<User>(`/api/users/${id}`, {
    skipErrorHandler: true  // Type-safe custom configuration
  });

  // response.data type is ApiResponse<User>
  return response.data.data;  // Returns User type
}
```

## Interview Key Points

### Q1: What is Declaration Merging? Which declarations can be merged?

**Answer**: Declaration merging is a mechanism where the TypeScript compiler merges multiple declarations with the same name into a single definition.

Mergeable declarations:
- Interface with interface
- Namespace with namespace
- Namespace with class, function, enum

Non-mergeable declarations:
- Class with class
- Variable with variable
- Type aliases do not support merging

### Q2: What is the difference between Module Augmentation and Global Augmentation?

**Answer**:

| Feature | Module Augmentation | Global Augmentation |
|---------|---------------------|---------------------|
| Syntax | `declare module "xxx" {}` | `declare global {}` |
| Scope | Specific module | Global scope |
| Use Case | Extend third-party library types | Extend Window, NodeJS.Global, etc. |
| File Requirement | Must be a module file | Must be a module file |

### Q3: How to correctly extend Express Request type?

**Answer**:

```typescript
// Error: Module name is incorrect
declare module "express" {
  interface Request {
    user?: User;
  }
}

// Correct: Use the correct internal module name
declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
```

Key point: You need to find the module that actually defines the Request interface.

### Q4: Why use interface instead of type for module augmentation?

**Answer**:

1. `interface` supports declaration merging, `type` does not
2. Same-named `type` will cause compilation errors
3. `interface` can be extended and inherited

```typescript
// interface can merge
interface A { x: number }
interface A { y: number }  // OK

// type cannot merge
type B = { x: number }
type B = { y: number }  // Error: Duplicate identifier
```

### Q5: What are the common pitfalls of module augmentation?

**Answer**:

1. Forgetting to add `export {}` causing the file not to be a module
2. Module path case sensitivity or name mismatch
3. Circular dependencies causing types to be unavailable
4. Attempting to merge non-interface types
5. Augmented properties not initialized at runtime

### Q6: How to create types for third-party libraries without type definitions?

**Answer**:

```typescript
// Method 1: Create in @types directory
// src/@types/untyped-lib/index.d.ts
declare module "untyped-lib" {
  export function doSomething(x: string): number;
  export const VERSION: string;
}

// Method 2: Use wildcard module declaration
declare module "untyped-*" {
  const content: any;
  export default content;
}

// Method 3: Create ambient declaration
declare module "untyped-lib";  // All imports are any
```

### Q7: Explain the role of `import type` in module augmentation in TypeScript

**Answer**:

`import type` only imports type information without generating runtime code, which is important for module augmentation:

```typescript
// Use import type to avoid circular dependencies
import type { User } from "./models";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}

// Or use inline import types
declare module "express-serve-static-core" {
  interface Request {
    user?: import("./models").User;
  }
}
```

Benefits:
- Avoids runtime imports
- Reduces circular dependency issues
- Clearly indicates type-only usage

## Further Reading

### Official Documentation
- [TypeScript Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [TypeScript Module Augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)
- [TypeScript Declaration Files](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)

### In-Depth Articles
- [Augmenting Global & Module Scope in TypeScript](https://mariusschulz.com/blog/augmenting-global-and-module-scope-in-typescript)
- [TypeScript Evolution: Declaration Merging](https://blog.mariusschulz.com/2017/05/26/typescript-2-3-generic-parameter-defaults)
- [Extending Third-Party Declarations in TypeScript](https://dev.to/macsikora/extending-typescript-declarations-4jhk)

### Related Tools
- [dts-gen](https://github.com/microsoft/dts-gen) - Automatically generate .d.ts files
- [dtslint](https://github.com/microsoft/dtslint) - Check type definition quality
- [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) - Community type definition repository

### Recommended Books
- "Programming TypeScript" - Boris Cherny
- "Effective TypeScript" - Dan Vanderkam
- "TypeScript Programming" (Chinese Edition)
