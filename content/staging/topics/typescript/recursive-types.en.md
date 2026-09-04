---
title: TypeScript Recursive Types
description: Master TypeScript recursive types including type aliases, JSON type modeling, DeepPartial, DeepReadonly, and tree structures
track: typescript
section: generics-advanced
difficulty: advanced
tags:
  - TypeScript
  - recursive types
  - type programming
  - DeepPartial
  - tree structures
status: imported
origin: old/src/content/docs/typescript/recursive-types.en.md
divergence: 0.217
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: TypeScript
  subcategory: ""
  order: 14
  lastUpdated: 2026-01-07
---

Recursive types are a powerful pattern in TypeScript's type system that allow types to reference themselves within their definition. This capability enables us to precisely describe nested data structures, JSON data, tree structures, and other complex types—a key technique for building robust, type-safe applications.

## Concept Explanation

### What Are Recursive Types?

Recursive types are types that directly or indirectly reference themselves within their definition. This concept is similar to recursive functions in programming, where a type's definition depends on itself.

```typescript
// Simplest recursive type example: linked list node
type ListNode<T> = {
  value: T;
  next: ListNode<T> | null;
};

// Usage
const list: ListNode<number> = {
  value: 1,
  next: {
    value: 2,
    next: {
      value: 3,
      next: null
    }
  }
};
```

### Historical Context

Before TypeScript 3.7, recursive type aliases had limitations and required interfaces to implement certain recursive patterns. TypeScript 3.7 introduced better support for recursive type aliases, making it more natural to define recursive types. TypeScript 4.1 further enhanced recursive conditional types, allowing deeper recursion within conditional types.

### Problems Solved

Recursive types primarily solve the following problems:

1. **Nested Data Structures**: Describing objects or arrays at arbitrary depths
2. **Tree Structures**: Defining hierarchical structures like file systems, DOM trees, and organizational charts
3. **JSON Types**: Precisely describing JSON data types
4. **Deep Type Operations**: Implementing utility types like DeepPartial and DeepReadonly
5. **Self-Referential Data**: Handling linked lists, graphs, and other self-referential data structures

## Core Principles

### Type Alias Recursive References

TypeScript allows type aliases to reference themselves in their definition, but must meet certain conditions to avoid infinite recursion:

```typescript
// Valid: indirect reference through object property
type RecursiveObject = {
  child?: RecursiveObject;
};

// Valid: indirect reference through array
type RecursiveArray = RecursiveArray[];

// Valid: indirect reference through union type with object
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

// Invalid: direct reference causes infinite expansion
// type Infinite = Infinite; // Error
// type AlsoInfinite = { value: AlsoInfinite }[]; // May error in some versions
```

### Recursion Termination Conditions

Every recursive type must have a termination condition, otherwise the type checker cannot process it:

```typescript
// Termination condition examples
type NestedArray<T> = T | NestedArray<T>[];

// Termination condition is T (base non-array type)
type Example = NestedArray<number>;
// Can be: number | number[] | number[][] | ...

// Termination in recursive conditional types
type Flatten<T> = T extends (infer U)[] ? Flatten<U> : T;

type Flattened = Flatten<number[][][]>; // number
// Recursion process:
// Flatten<number[][][]> -> Flatten<number[][]> -> Flatten<number[]> -> Flatten<number> -> number
```

### Lazy Evaluation and Type Expansion

TypeScript's type system uses lazy evaluation strategy—recursive types do not expand infinitely:

```typescript
// Types are not fully expanded in advance
type Tree<T> = {
  value: T;
  children: Tree<T>[];
};

// Expansion only occurs as needed during use
const tree: Tree<string> = {
  value: "root",
  children: [
    {
      value: "child1",
      children: []
    },
    {
      value: "child2",
      children: [
        { value: "grandchild", children: [] }
      ]
    }
  ]
};
```

## Core Concepts

### Basic Forms of Recursive Type Aliases

```typescript
// Termination through optional property
type SelfReferential = {
  name: string;
  parent?: SelfReferential;
};

// Termination through null/undefined
type LinkedList<T> = {
  value: T;
  next: LinkedList<T> | null;
};

// Termination through empty array
type TreeNode<T> = {
  data: T;
  children: TreeNode<T>[];
};
```

### Recursive Conditional Types

```typescript
// Recursively flatten nested arrays
type DeepFlatten<T> = T extends (infer U)[] ? DeepFlatten<U> : T;

type F1 = DeepFlatten<number[]>;       // number
type F2 = DeepFlatten<string[][]>;     // string
type F3 = DeepFlatten<boolean[][][]>;  // boolean

// Recursively unwrap Promise
type DeepAwaited<T> = T extends Promise<infer U> ? DeepAwaited<U> : T;

type A1 = DeepAwaited<Promise<string>>;                    // string
type A2 = DeepAwaited<Promise<Promise<number>>>;           // number
type A3 = DeepAwaited<Promise<Promise<Promise<boolean>>>>; // boolean
```

### Recursive Depth Limits

TypeScript has depth limits for recursive types, typically around 50 levels. Exceeding this limit results in errors:

```typescript
// Use a counter to limit recursion depth
type DeepReadonlyWithDepth<T, Depth extends number[] = []> =
  Depth['length'] extends 10 // Limit to 10 levels
    ? T
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonlyWithDepth<T[K], [...Depth, 0]> }
      : T;
```

### Mutual Recursion Types

Two or more types reference each other:

```typescript
// A references B, B references A
type Expression =
  | NumberLiteral
  | BinaryExpression;

type NumberLiteral = {
  type: "number";
  value: number;
};

type BinaryExpression = {
  type: "binary";
  operator: "+" | "-" | "*" | "/";
  left: Expression;
  right: Expression;
};

// Usage
const expr: Expression = {
  type: "binary",
  operator: "+",
  left: { type: "number", value: 1 },
  right: {
    type: "binary",
    operator: "*",
    left: { type: "number", value: 2 },
    right: { type: "number", value: 3 }
  }
};
```

## Code Examples

### JSON Type Modeling

JSON is a classic example of a recursive data structure, where values can be primitives, arrays, or objects, and array and object elements can be any JSON value:

```typescript
// Complete JSON type definition
type JSONPrimitive = string | number | boolean | null;
type JSONArray = JSONValue[];
type JSONObject = { [key: string]: JSONValue };
type JSONValue = JSONPrimitive | JSONArray | JSONObject;

// Usage example
const data: JSONValue = {
  name: "John Doe",
  age: 30,
  active: true,
  address: null,
  scores: [95, 87, 92],
  profile: {
    avatar: "https://example.com/avatar.jpg",
    tags: ["developer", "TypeScript"],
    settings: {
      theme: "dark",
      notifications: true
    }
  }
};

// Type-safe JSON parsing
function parseJSON(text: string): JSONValue {
  return JSON.parse(text);
}

// Type-safe JSON serialization
function stringifyJSON(value: JSONValue): string {
  return JSON.stringify(value);
}

// More precise JSON type (excludes undefined and functions)
type StrictJSONValue =
  | string
  | number
  | boolean
  | null
  | StrictJSONValue[]
  | { [key: string]: StrictJSONValue };
```

### DeepPartial Implementation

`DeepPartial` makes all properties of an object (including nested ones) optional:

```typescript
// Basic version
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

// Enhanced version: handles functions, arrays, and other special cases
type DeepPartialAdvanced<T> = T extends (...args: any[]) => any
  ? T  // Keep functions as-is
  : T extends (infer U)[]
    ? DeepPartialAdvanced<U>[]  // Recursively handle array elements
    : T extends object
      ? { [K in keyof T]?: DeepPartialAdvanced<T[K]> }
      : T;

// Usage example
interface User {
  id: number;
  name: string;
  profile: {
    avatar: string;
    bio: string;
    social: {
      twitter?: string;
      github?: string;
    };
  };
  posts: Array<{
    id: number;
    title: string;
    content: string;
  }>;
  greet: () => void;
}

type PartialUser = DeepPartialAdvanced<User>;
// Result:
// {
//   id?: number;
//   name?: string;
//   profile?: {
//     avatar?: string;
//     bio?: string;
//     social?: {
//       twitter?: string;
//       github?: string;
//     };
//   };
//   posts?: Array<{
//     id?: number;
//     title?: string;
//     content?: string;
//   }>;
//   greet?: () => void;
// }

// Practical application: partial updates
function updateUser(id: number, updates: DeepPartialAdvanced<User>): User {
  // Can provide only the fields that need updating
  return {} as User;
}

updateUser(1, {
  profile: {
    bio: "New bio"
    // No need to provide other fields
  }
});
```

### DeepReadonly Implementation

`DeepReadonly` makes all properties of an object (including nested ones) readonly:

```typescript
// Basic version
type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

// Enhanced version: correctly handles various types
type DeepReadonlyAdvanced<T> = T extends (...args: any[]) => any
  ? T  // Keep functions as-is
  : T extends Map<infer K, infer V>
    ? ReadonlyMap<DeepReadonlyAdvanced<K>, DeepReadonlyAdvanced<V>>
    : T extends Set<infer U>
      ? ReadonlySet<DeepReadonlyAdvanced<U>>
      : T extends (infer U)[]
        ? readonly DeepReadonlyAdvanced<U>[]
        : T extends object
          ? { readonly [K in keyof T]: DeepReadonlyAdvanced<T[K]> }
          : T;

// Usage example
interface Config {
  server: {
    host: string;
    port: number;
    ssl: {
      enabled: boolean;
      cert: string;
    };
  };
  features: string[];
  metadata: Map<string, any>;
}

type ImmutableConfig = DeepReadonlyAdvanced<Config>;

const config: ImmutableConfig = {
  server: {
    host: "localhost",
    port: 3000,
    ssl: {
      enabled: true,
      cert: "/path/to/cert"
    }
  },
  features: ["auth", "logging"],
  metadata: new Map([["version", "1.0"]])
};

// All following operations will result in errors
// config.server.port = 8080;           // Error: readonly property
// config.server.ssl.enabled = false;   // Error: readonly property
// config.features.push("newFeature");  // Error: readonly array

// Deep freeze helper function
function deepFreeze<T>(obj: T): DeepReadonlyAdvanced<T> {
  if (obj && typeof obj === "object") {
    Object.keys(obj).forEach(key => {
      deepFreeze((obj as any)[key]);
    });
    return Object.freeze(obj) as DeepReadonlyAdvanced<T>;
  }
  return obj as DeepReadonlyAdvanced<T>;
}
```

### Tree Structure Types

Tree structures are a classic application of recursive types:

```typescript
// Generic tree node type
type TreeNode<T> = {
  data: T;
  children: TreeNode<T>[];
};

// File system tree
type FileSystemNode = {
  name: string;
  type: "file" | "directory";
  size?: number;           // File size (files only)
  children?: FileSystemNode[]; // Child nodes (directories only)
};

// More precise file system type (using discriminated unions)
type FileNode = {
  type: "file";
  name: string;
  size: number;
  content: string;
};

type DirectoryNode = {
  type: "directory";
  name: string;
  children: (FileNode | DirectoryNode)[];
};

type FSNode = FileNode | DirectoryNode;

// Usage example
const fileSystem: DirectoryNode = {
  type: "directory",
  name: "root",
  children: [
    {
      type: "file",
      name: "readme.md",
      size: 1024,
      content: "# Project"
    },
    {
      type: "directory",
      name: "src",
      children: [
        {
          type: "file",
          name: "index.ts",
          size: 2048,
          content: "export * from './app'"
        },
        {
          type: "directory",
          name: "components",
          children: []
        }
      ]
    }
  ]
};

// Recursive traversal function
function traverseFS(node: FSNode, depth = 0): void {
  const indent = "  ".repeat(depth);
  if (node.type === "file") {
    console.log(`${indent}📄 ${node.name} (${node.size} bytes)`);
  } else {
    console.log(`${indent}📁 ${node.name}/`);
    node.children.forEach(child => traverseFS(child, depth + 1));
  }
}

// DOM tree type
interface DOMNode {
  tagName: string;
  attributes: Record<string, string>;
  children: DOMNode[];
  textContent?: string;
}

// Organization chart tree
interface Employee {
  id: number;
  name: string;
  title: string;
  reports: Employee[];
}

const organization: Employee = {
  id: 1,
  name: "CEO",
  title: "Chief Executive Officer",
  reports: [
    {
      id: 2,
      name: "CTO",
      title: "Chief Technology Officer",
      reports: [
        { id: 4, name: "John Smith", title: "Senior Engineer", reports: [] },
        { id: 5, name: "Jane Doe", title: "Senior Engineer", reports: [] }
      ]
    },
    {
      id: 3,
      name: "CFO",
      title: "Chief Financial Officer",
      reports: []
    }
  ]
};
```

### Recursive Path Types

Get all possible paths of a nested object:

```typescript
// Get all paths of an object (dot-separated)
type Paths<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? Paths<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

// Usage example
interface NestedConfig {
  database: {
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
  server: {
    port: number;
  };
}

type ConfigPaths = Paths<NestedConfig>;
// Result:
// | "database"
// | "database.host"
// | "database.port"
// | "database.credentials"
// | "database.credentials.username"
// | "database.credentials.password"
// | "server"
// | "server.port"

// Get value type by path
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

type HostType = PathValue<NestedConfig, "database.host">;           // string
type CredentialsType = PathValue<NestedConfig, "database.credentials">; // { username: string; password: string }
type UsernameType = PathValue<NestedConfig, "database.credentials.username">; // string

// Type-safe path access function
function get<T, P extends Paths<T>>(obj: T, path: P): PathValue<T, P> {
  const keys = (path as string).split(".");
  let result: any = obj;
  for (const key of keys) {
    result = result[key];
  }
  return result;
}

const config: NestedConfig = {
  database: {
    host: "localhost",
    port: 5432,
    credentials: {
      username: "admin",
      password: "secret"
    }
  },
  server: {
    port: 3000
  }
};

const host = get(config, "database.host");     // Type: string
const port = get(config, "database.port");     // Type: number
// const invalid = get(config, "database.invalid"); // Compilation error
```

### Deep Merge Types

```typescript
// Deeply merge two types
type DeepMerge<T, U> = T extends object
  ? U extends object
    ? {
        [K in keyof T | keyof U]: K extends keyof T
          ? K extends keyof U
            ? DeepMerge<T[K], U[K]>  // Both have it, recursively merge
            : T[K]                     // Only in T
          : K extends keyof U
            ? U[K]                     // Only in U
            : never;
      }
    : U
  : U;

// Usage example
interface DefaultConfig {
  server: {
    host: string;
    port: number;
  };
  logging: {
    level: "info" | "debug" | "error";
    format: string;
  };
}

interface UserConfig {
  server: {
    port: number;
    ssl: boolean;
  };
  database: {
    url: string;
  };
}

type MergedConfig = DeepMerge<DefaultConfig, UserConfig>;
// Result:
// {
//   server: {
//     host: string;
//     port: number;
//     ssl: boolean;
//   };
//   logging: {
//     level: "info" | "debug" | "error";
//     format: string;
//   };
//   database: {
//     url: string;
//   };
// }
```

### Recursive Array Flattening Types

```typescript
// Get element type of multi-dimensional arrays
type ElementOf<T> = T extends (infer E)[] ? ElementOf<E> : T;

type E1 = ElementOf<number[]>;           // number
type E2 = ElementOf<string[][]>;         // string
type E3 = ElementOf<boolean[][][][][]>;  // boolean

// Flatten to specified depth
type FlattenDepth<
  T extends any[],
  Depth extends number = 1,
  Counter extends any[] = []
> = Counter["length"] extends Depth
  ? T
  : T extends (infer U)[]
    ? U extends any[]
      ? FlattenDepth<U, Depth, [...Counter, any]>[]
      : U[]
    : T;

// TypeScript built-in Array.flat() type
type FlatArray<Arr, Depth extends number> = {
  done: Arr;
  recur: Arr extends ReadonlyArray<infer InnerArr>
    ? FlatArray<
        InnerArr,
        [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20][Depth]
      >
    : Arr;
}[Depth extends -1 ? "done" : "recur"];

// Usage example
const nested = [[1, 2], [[3, 4]], [[[5, 6]]]];
const flat1 = nested.flat(1);   // (number | number[] | number[][])[]
const flat2 = nested.flat(2);   // (number | number[])[]
const flatInf = nested.flat(Infinity); // number[]
```

## Best Practices

### Use Interfaces Instead of Complex Recursive Type Aliases

When recursive types become complex, using interfaces can improve readability and compilation performance:

```typescript
// Not recommended: complex type alias
type ComplexNode<T> = {
  value: T;
  children: ComplexNode<T>[];
  parent: ComplexNode<T> | null;
  metadata: {
    created: Date;
    modified: Date;
    tags: string[];
  };
};

// Recommended: use interface
interface TreeNodeInterface<T> {
  value: T;
  children: TreeNodeInterface<T>[];
  parent: TreeNodeInterface<T> | null;
  metadata: NodeMetadata;
}

interface NodeMetadata {
  created: Date;
  modified: Date;
  tags: string[];
}
```

### Add Depth Limits to Recursive Types

Prevent the type system from getting stuck in overly deep recursion:

```typescript
// DeepPartial with depth limit
type DeepPartialWithLimit<T, Depth extends number = 5> = [Depth] extends [0]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartialWithLimit<T[K], Prev[Depth]> }
    : T;

// Depth counter
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Usage
type SafeDeepPartial = DeepPartialWithLimit<DeeplyNestedType, 3>;
```

### Use Conditional Types to Handle Edge Cases

```typescript
// Robust DeepReadonly implementation
type DeepReadonlyRobust<T> = T extends ((...args: any[]) => any) | Date | RegExp
  ? T  // Keep functions, Date, RegExp as-is
  : T extends Map<infer K, infer V>
    ? ReadonlyMap<K, DeepReadonlyRobust<V>>
    : T extends Set<infer U>
      ? ReadonlySet<DeepReadonlyRobust<U>>
      : T extends WeakMap<infer K, infer V>
        ? WeakMap<K, DeepReadonlyRobust<V>>
        : T extends WeakSet<infer U>
          ? WeakSet<DeepReadonlyRobust<U>>
          : T extends Promise<infer U>
            ? Promise<DeepReadonlyRobust<U>>
            : T extends {}
              ? { readonly [K in keyof T]: DeepReadonlyRobust<T[K]> }
              : T;
```

### Provide Type Inference Helper Functions

```typescript
// Provide construction helpers for complex recursive types
function createTree<T>(data: T, children: TreeNode<T>[] = []): TreeNode<T> {
  return { data, children };
}

// Type inference works automatically
const numberTree = createTree(1, [
  createTree(2),
  createTree(3, [createTree(4)])
]);
// numberTree: TreeNode<number>
```

### Document Constraints of Recursive Types

```typescript
/**
 * Deep partial type
 * @description Makes all properties of an object (including nested ones) optional
 * @template T - The object type to transform
 * @note
 * - Function types remain unchanged
 * - Arrays are recursively processed element-wise
 * - Maximum recursion depth is approximately 50 levels
 * @example
 * type UserPartial = DeepPartial<User>;
 * // { id?: number; profile?: { name?: string; } }
 */
type DeepPartialDocumented<T> = T extends object
  ? { [K in keyof T]?: DeepPartialDocumented<T[K]> }
  : T;
```

## Common Pitfalls

### Circular References Causing Infinite Types

```typescript
// Pitfall: direct self-reference
// type Infinite = Infinite; // Error: circular type reference

// Pitfall: direct reference through union
// type BadRecursive = BadRecursive | string; // May error in some versions

// Solution: indirect reference through object or array
type GoodRecursive = {
  value: GoodRecursive;
} | string;
```

### Unexpected Behavior of Distributive Conditional Types

```typescript
// Pitfall: distributive behavior with union types
type DeepPartialDistributed<T> = T extends object
  ? { [K in keyof T]?: DeepPartialDistributed<T[K]> }
  : T;

// With union types, it distributes
type Result = DeepPartialDistributed<{ a: 1 } | { b: 2 }>;
// Distributes to: DeepPartialDistributed<{ a: 1 }> | DeepPartialDistributed<{ b: 2 }>
// Result: { a?: 1 } | { b?: 2 }

// If you need to handle as a whole, wrap in tuple
type DeepPartialNonDistributed<T> = [T] extends [object]
  ? { [K in keyof T]?: DeepPartialNonDistributed<T[K]> }
  : T;
```

### Order of Array vs Object Checks

```typescript
// Pitfall: arrays are also objects
type WrongDeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: WrongDeepReadonly<T[K]> }
  : T;

// Arrays will be handled incorrectly
type Arr = WrongDeepReadonly<number[]>;
// Result may not be as expected

// Solution: check arrays first
type CorrectDeepReadonly<T> = T extends (infer U)[]
  ? readonly CorrectDeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: CorrectDeepReadonly<T[K]> }
    : T;
```

### Unexpected Recursion with Function Types

```typescript
// Pitfall: function types are also objects
type BadDeepPartial<T> = T extends object
  ? { [K in keyof T]?: BadDeepPartial<T[K]> }
  : T;

interface WithFunction {
  name: string;
  greet: () => void;
}

type Bad = BadDeepPartial<WithFunction>;
// greet type becomes { (): void }?, which is not what we want

// Solution: exclude function types
type GoodDeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { [K in keyof T]?: GoodDeepPartial<T[K]> }
    : T;
```

### Recursion Depth Exceeding Limits

```typescript
// Pitfall: overly deep types cause compilation errors
type VeryDeep = {
  level1: {
    level2: {
      // ... continue 50+ levels
    }
  }
};

// type Error = DeepReadonly<VeryDeep>; // May error

// Solution: add depth limit
type MaxDepth = 10;
type Counter = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type DeepReadonlyLimited<T, D extends number = MaxDepth> = D extends 0
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonlyLimited<T[K], Counter[D]> }
    : T;
```

### Never Type Propagation

```typescript
// Pitfall: never propagates in recursion
type PropagatesNever<T> = T extends { a: infer A }
  ? { result: PropagatesNever<A> }
  : never;

type WithNever = PropagatesNever<{ a: { b: 1 } }>;
// Since no { a: ... } structure exists at the end, returns never

// Solution: provide default value or termination condition
type SafeRecursive<T> = T extends { a: infer A }
  ? { result: SafeRecursive<A> }
  : { result: T };  // Use T instead of never
```

## Performance Considerations

### Compilation Time Impact

Recursive types can significantly increase TypeScript compilation time:

```typescript
// Avoid: overly complex recursive types
type ComplexRecursive<T, Keys extends keyof any = keyof T> =
  Keys extends keyof T
    ? T[Keys] extends object
      ? ComplexRecursive<T[Keys]> | { [K in Keys]: ComplexRecursive<T[Keys]> }
      : { [K in Keys]: T[Keys] }
    : never;

// Recommended: simplify recursive logic
type SimpleRecursive<T> = T extends object
  ? { [K in keyof T]: SimpleRecursive<T[K]> }
  : T;
```

### IDE Response Speed

Complex recursive types affect IDE intellisense performance:

```typescript
// May cause IDE lag
type HeavyType = DeepPartial<DeepReadonly<DeepMerge<TypeA, TypeB>>>;

// Optimize: use intermediate type aliases
type IntermediateA = DeepPartial<TypeA>;
type IntermediateB = DeepReadonly<IntermediateA>;
type FinalType = DeepMerge<IntermediateB, TypeB>;
```

### Memory Usage

Type instantiation consumes memory:

```typescript
// Cache recursive results (TypeScript does this automatically)
type CachedDeepReadonly<T> = T extends object
  ? DeepReadonlyCache<T>
  : T;

type DeepReadonlyCache<T> = {
  readonly [K in keyof T]: CachedDeepReadonly<T[K]>;
};

// Reuse the same type definition
type UserReadonly = CachedDeepReadonly<User>;
type ConfigReadonly = CachedDeepReadonly<Config>;
// TypeScript will cache the computation results of CachedDeepReadonly
```

### Build Optimization Recommendations

```typescript
// 1. Limit recursion depth
type OptimizedDeep<T, D extends number = 5> = ...;

// 2. Use conditional termination rather than continue recursion
type EarlyTermination<T> = T extends null | undefined
  ? T  // Early termination
  : T extends object
    ? { [K in keyof T]: EarlyTermination<T[K]> }
    : T;

// 3. Avoid using complex recursive types on hot paths
// Bad: frequent computation
function process<T>(data: DeepPartial<T>): T { ... }

// Good: predefine types
type ProcessInput = DeepPartial<ExpectedType>;
function process(data: ProcessInput): ExpectedType { ... }
```

## Real-World Scenarios

### Configuration Management System

```typescript
// Define configuration schema
interface AppConfig {
  app: {
    name: string;
    version: string;
    env: "development" | "production" | "test";
  };
  database: {
    primary: {
      host: string;
      port: number;
      credentials: {
        username: string;
        password: string;
      };
    };
    replica?: {
      host: string;
      port: number;
    };
  };
  features: {
    [key: string]: boolean;
  };
}

// Configuration override type
type ConfigOverride = DeepPartial<AppConfig>;

// Configuration merge function
function mergeConfig(
  base: AppConfig,
  override: ConfigOverride
): AppConfig {
  return deepMerge(base, override);
}

// Environment-specific configuration
const baseConfig: AppConfig = {
  app: { name: "MyApp", version: "1.0.0", env: "development" },
  database: {
    primary: {
      host: "localhost",
      port: 5432,
      credentials: { username: "dev", password: "dev123" }
    }
  },
  features: { darkMode: true, beta: false }
};

const productionOverride: ConfigOverride = {
  app: { env: "production" },
  database: {
    primary: {
      host: "prod-db.example.com",
      credentials: { password: "prod-secret" }
    },
    replica: { host: "replica-db.example.com", port: 5432 }
  }
};

const prodConfig = mergeConfig(baseConfig, productionOverride);
```

### Immutable State Updates

```typescript
// Redux-like state type
interface AppState {
  user: {
    id: number;
    profile: {
      name: string;
      email: string;
      preferences: {
        theme: "light" | "dark";
        language: string;
      };
    };
  };
  posts: Array<{
    id: number;
    title: string;
    comments: Array<{
      id: number;
      text: string;
    }>;
  }>;
}

// Immutable state type
type ImmutableState = DeepReadonly<AppState>;

// Update path type
type StatePaths = Paths<AppState>;

// Type-safe state updates
type StateUpdater<P extends StatePaths> = (
  state: ImmutableState,
  path: P,
  value: PathValue<AppState, P>
) => ImmutableState;

// Immer-like update helper
function produce<T>(
  state: DeepReadonly<T>,
  recipe: (draft: T) => void
): DeepReadonly<T> {
  // Implementation using Immer or similar
  return {} as DeepReadonly<T>;
}

// Usage
const newState = produce(currentState, draft => {
  draft.user.profile.preferences.theme = "dark";
});
```

### API Response Type Handling

```typescript
// API response wrapper type
interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// Recursive nullable type (handling potentially null nested data)
type DeepNullable<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { [K in keyof T]: DeepNullable<T[K]> | null }
    : T | null;

// API response data may contain null values
interface UserApiData {
  id: number;
  name: string;
  profile: {
    avatar: string;
    bio: string;
    social: {
      twitter: string;
      github: string;
    };
  };
}

type NullableUserData = DeepNullable<UserApiData>;
// All fields can be null

// Type-safe data access
function safeGet<T, P extends Paths<T>>(
  data: DeepNullable<T>,
  path: P
): PathValue<T, P> | null {
  const keys = (path as string).split(".");
  let result: any = data;
  for (const key of keys) {
    if (result === null || result === undefined) {
      return null;
    }
    result = result[key];
  }
  return result;
}
```

### Form Validation System

```typescript
// Form field definitions
interface FormSchema {
  username: string;
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    age: number;
    address: {
      street: string;
      city: string;
      country: string;
    };
  };
}

// Validation error type (same structure as schema but values are error messages)
type FormErrors<T> = T extends object
  ? { [K in keyof T]?: FormErrors<T[K]> | string }
  : string;

// Form state
interface FormState<T> {
  values: T;
  errors: FormErrors<T>;
  touched: DeepPartial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}

// Form hook types
interface UseFormReturn<T> {
  state: FormState<T>;
  setValue: <P extends Paths<T>>(path: P, value: PathValue<T, P>) => void;
  setError: <P extends Paths<T>>(path: P, error: string) => void;
  validate: () => boolean;
  submit: () => Promise<void>;
}

// Usage example
function useForm<T extends object>(initialValues: T): UseFormReturn<T> {
  // Implementation...
  return {} as UseFormReturn<T>;
}

const form = useForm<FormSchema>({
  username: "",
  email: "",
  password: "",
  profile: {
    firstName: "",
    lastName: "",
    age: 0,
    address: { street: "", city: "", country: "" }
  }
});

form.setValue("profile.address.city", "New York"); // Type-safe
form.setError("email", "Invalid email format");
```

### Internationalization System

```typescript
// Multi-language message structure
interface Messages {
  common: {
    buttons: {
      submit: string;
      cancel: string;
      save: string;
    };
    errors: {
      required: string;
      invalid: string;
    };
  };
  pages: {
    home: {
      title: string;
      welcome: string;
    };
    about: {
      title: string;
      description: string;
    };
  };
}

// Message path type
type MessageKey = Paths<Messages>;

// Type-safe translation function
function t(key: MessageKey): string {
  // Implementation...
  return "";
}

// Usage
const submitText = t("common.buttons.submit");
const homeTitle = t("pages.home.title");
// const invalid = t("invalid.path"); // Compilation error
```

## Interview Questions

### What are recursive types? Please provide examples.

**Key Points**:
- Recursive types are types that reference themselves in their definition
- Must have termination conditions to prevent infinite recursion
- Common applications: linked lists, trees, JSON structures

```typescript
// Linked list example
type LinkedList<T> = {
  value: T;
  next: LinkedList<T> | null; // Recursive reference, null is termination condition
};

// JSON example
type JSONValue =
  | string | number | boolean | null  // Termination condition
  | JSONValue[]                        // Recursion: array
  | { [key: string]: JSONValue };      // Recursion: object
```

### How do you implement the DeepPartial type?

**Key Points**:
- Use conditional types to determine if the type is an object
- Recursively handle nested properties
- Handle special types (functions, arrays)

```typescript
type DeepPartial<T> = T extends (...args: any[]) => any
  ? T  // Keep functions as-is
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;
```

### What are the limitations of recursive types? How do you solve them?

**Key Points**:
- Depth limitations (approximately 50 levels)
- Compilation performance impact
- Solution: add depth counters

```typescript
type DeepWithLimit<T, D extends number = 5> = D extends 0
  ? T
  : T extends object
    ? { [K in keyof T]: DeepWithLimit<T[K], Prev[D]> }
    : T;

type Prev = [never, 0, 1, 2, 3, 4, 5];
```

### What is the difference between recursive types and interface recursion?

**Key Points**:
- Interfaces can directly reference themselves
- Type aliases need indirect references through objects/arrays
- Interfaces generally have better compilation performance

```typescript
// Interfaces can directly recurse
interface TreeNode {
  value: number;
  children: TreeNode[];
}

// Type aliases need indirect reference
type TreeNodeType = {
  value: number;
  children: TreeNodeType[];
};
```

### How do you implement type-safe deep path access?

**Key Points**:
- Use template literal types to generate paths
- Recursively handle nested objects
- Combine with infer to extract value types

```typescript
type Paths<T> = T extends object
  ? { [K in keyof T & string]:
      T[K] extends object
        ? K | `${K}.${Paths<T[K]>}`
        : K
    }[keyof T & string]
  : never;

type PathValue<T, P extends string> = P extends `${infer K}.${infer R}`
  ? K extends keyof T ? PathValue<T[K], R> : never
  : P extends keyof T ? T[P] : never;
```

### What are common pitfalls in recursive conditional types?

**Key Points**:
- Unexpected behavior from distributive conditional types
- Array and object judgment order
- Never type propagation
- Special handling for function types

```typescript
// Pitfall: arrays are also objects
type Wrong<T> = T extends object ? "obj" : "other";
type Arr = Wrong<number[]>; // "obj"

// Correct: check arrays first
type Correct<T> = T extends any[] ? "arr" : T extends object ? "obj" : "other";
```

## Further Reading

### Official Documentation
- [TypeScript Handbook - Recursive Type Aliases](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#more-recursive-type-aliases)
- [TypeScript Handbook - Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [TypeScript Handbook - Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

### Recommended Resources
- [Type Challenges](https://github.com/type-challenges/type-challenges) - Type programming exercises with many recursive type challenges
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - In-depth TypeScript guide
- [Effective TypeScript](https://effectivetypescript.com/) - TypeScript best practices

### Related Utility Libraries
- [type-fest](https://github.com/sindresorhus/type-fest) - Includes PartialDeep, ReadonlyDeep, and other practical types
- [ts-toolbelt](https://github.com/millsp/ts-toolbelt) - Advanced TypeScript type utilities
- [utility-types](https://github.com/piotrwitek/utility-types) - TypeScript utility types collection
