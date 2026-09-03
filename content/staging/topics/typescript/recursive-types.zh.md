---
title: TypeScript 递归类型
description: 深入掌握 TypeScript 递归类型，包括递归类型别名、JSON 类型建模、DeepPartial、DeepReadonly 以及树形结构类型
track: typescript
section: generics-advanced
difficulty: advanced
tags:
  - TypeScript
  - 递归类型
  - 类型编程
  - DeepPartial
  - 树形结构
status: imported
origin: old/src/content/docs/typescript/recursive-types.zh.md
divergence: 0.217
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: TypeScript
  subcategory: 高级类型
  order: 14
  lastUpdated: 2026-01-07
---

递归类型是 TypeScript 类型系统中一种强大的模式，允许类型在其定义中引用自身。这种能力使我们能够精确地描述嵌套数据结构、JSON 数据、树形结构等复杂类型，是构建健壮类型安全应用的关键技术。

## 概念解释

### 什么是递归类型

递归类型（Recursive Types）是指在类型定义中直接或间接引用自身的类型。这与编程中的递归函数概念类似，类型的定义依赖于自身的定义。

```typescript
// 最简单的递归类型示例：链表节点
type ListNode<T> = {
  value: T;
  next: ListNode<T> | null;
};

// 使用
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

### 历史背景

在 TypeScript 3.7 之前，递归类型别名存在一些限制，必须通过接口来实现某些递归模式。TypeScript 3.7 引入了对递归类型别名的更好支持，使得我们可以更自然地定义递归类型。TypeScript 4.1 进一步增强了递归条件类型的能力，允许在条件类型中进行更深层次的递归。

### 解决的问题

递归类型主要解决以下问题：

1. **嵌套数据结构**：描述任意深度的嵌套对象或数组
2. **树形结构**：定义文件系统、DOM 树、组织架构等层级结构
3. **JSON 类型**：精确描述 JSON 数据的类型
4. **深度类型操作**：实现 DeepPartial、DeepReadonly 等深度工具类型
5. **自引用数据**：处理链表、图等自引用数据结构

## 核心原理

### 类型别名的递归引用

TypeScript 允许类型别名在其定义中引用自身，但需要满足一定条件以避免无限递归：

```typescript
// 合法：通过对象属性间接引用
type RecursiveObject = {
  child?: RecursiveObject;
};

// 合法：通过数组间接引用
type RecursiveArray = RecursiveArray[];

// 合法：通过联合类型中的对象间接引用
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

// 非法：直接引用会导致无限展开
// type Infinite = Infinite; // 错误
// type AlsoInfinite = { value: AlsoInfinite }[]; // 在某些版本可能报错
```

### 递归的终止条件

每个递归类型都必须有终止条件，否则类型检查器将无法处理：

```typescript
// 递归终止条件示例
type NestedArray<T> = T | NestedArray<T>[];

// 终止条件是 T（非数组的基础类型）
type Example = NestedArray<number>;
// 可以是: number | number[] | number[][] | ...

// 递归条件类型的终止
type Flatten<T> = T extends (infer U)[] ? Flatten<U> : T;

type Flattened = Flatten<number[][][]>; // number
// 递归过程：
// Flatten<number[][][]> -> Flatten<number[][]> -> Flatten<number[]> -> Flatten<number> -> number
```

### 惰性求值与类型展开

TypeScript 的类型系统采用惰性求值策略，递归类型不会无限展开：

```typescript
// 类型不会预先完全展开
type Tree<T> = {
  value: T;
  children: Tree<T>[];
};

// 只有在使用时才会按需展开
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

## 核心要点

### 递归类型别名的基本形式

```typescript
// 通过可选属性终止
type SelfReferential = {
  name: string;
  parent?: SelfReferential;
};

// 通过 null/undefined 终止
type LinkedList<T> = {
  value: T;
  next: LinkedList<T> | null;
};

// 通过空数组终止
type TreeNode<T> = {
  data: T;
  children: TreeNode<T>[];
};
```

### 递归条件类型

```typescript
// 递归展开嵌套数组
type DeepFlatten<T> = T extends (infer U)[] ? DeepFlatten<U> : T;

type F1 = DeepFlatten<number[]>;       // number
type F2 = DeepFlatten<string[][]>;     // string
type F3 = DeepFlatten<boolean[][][]>;  // boolean

// 递归解包 Promise
type DeepAwaited<T> = T extends Promise<infer U> ? DeepAwaited<U> : T;

type A1 = DeepAwaited<Promise<string>>;                    // string
type A2 = DeepAwaited<Promise<Promise<number>>>;           // number
type A3 = DeepAwaited<Promise<Promise<Promise<boolean>>>>; // boolean
```

### 递归深度限制

TypeScript 对递归类型有深度限制，通常为 50 层左右。超过限制会报错：

```typescript
// 使用计数器限制递归深度
type DeepReadonlyWithDepth<T, Depth extends number[] = []> =
  Depth['length'] extends 10 // 限制为 10 层
    ? T
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonlyWithDepth<T[K], [...Depth, 0]> }
      : T;
```

### 互递归类型

两个或多个类型相互引用：

```typescript
// A 引用 B，B 引用 A
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

// 使用
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

## 代码示例

### JSON 类型建模

JSON 是递归数据结构的典型例子，其值可以是原始类型、数组或对象，而数组和对象的元素又可以是任意 JSON 值：

```typescript
// 完整的 JSON 类型定义
type JSONPrimitive = string | number | boolean | null;
type JSONArray = JSONValue[];
type JSONObject = { [key: string]: JSONValue };
type JSONValue = JSONPrimitive | JSONArray | JSONObject;

// 使用示例
const data: JSONValue = {
  name: "张三",
  age: 30,
  active: true,
  address: null,
  scores: [95, 87, 92],
  profile: {
    avatar: "https://example.com/avatar.jpg",
    tags: ["开发者", "TypeScript"],
    settings: {
      theme: "dark",
      notifications: true
    }
  }
};

// 类型安全的 JSON 解析
function parseJSON(text: string): JSONValue {
  return JSON.parse(text);
}

// 类型安全的 JSON 序列化
function stringifyJSON(value: JSONValue): string {
  return JSON.stringify(value);
}

// 更精确的 JSON 类型（排除 undefined 和函数）
type StrictJSONValue =
  | string
  | number
  | boolean
  | null
  | StrictJSONValue[]
  | { [key: string]: StrictJSONValue };
```

### DeepPartial 实现

`DeepPartial` 将对象的所有属性（包括嵌套属性）都变为可选：

```typescript
// 基础版本
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

// 增强版本：处理函数、数组等特殊情况
type DeepPartialAdvanced<T> = T extends (...args: any[]) => any
  ? T  // 函数保持原样
  : T extends (infer U)[]
    ? DeepPartialAdvanced<U>[]  // 数组递归处理元素
    : T extends object
      ? { [K in keyof T]?: DeepPartialAdvanced<T[K]> }
      : T;

// 使用示例
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
// 结果：
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

// 实际应用：部分更新
function updateUser(id: number, updates: DeepPartialAdvanced<User>): User {
  // 可以只传递需要更新的字段
  return {} as User;
}

updateUser(1, {
  profile: {
    bio: "新的个人简介"
    // 不需要提供其他字段
  }
});
```

### DeepReadonly 实现

`DeepReadonly` 将对象的所有属性（包括嵌套属性）都变为只读：

```typescript
// 基础版本
type DeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

// 增强版本：正确处理各种类型
type DeepReadonlyAdvanced<T> = T extends (...args: any[]) => any
  ? T  // 函数保持原样
  : T extends Map<infer K, infer V>
    ? ReadonlyMap<DeepReadonlyAdvanced<K>, DeepReadonlyAdvanced<V>>
    : T extends Set<infer U>
      ? ReadonlySet<DeepReadonlyAdvanced<U>>
      : T extends (infer U)[]
        ? readonly DeepReadonlyAdvanced<U>[]
        : T extends object
          ? { readonly [K in keyof T]: DeepReadonlyAdvanced<T[K]> }
          : T;

// 使用示例
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

// 以下操作都会报错
// config.server.port = 8080;           // 错误：只读属性
// config.server.ssl.enabled = false;   // 错误：只读属性
// config.features.push("newFeature");  // 错误：只读数组

// Freeze 辅助函数
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

### 树形结构类型

树形结构是递归类型的经典应用场景：

```typescript
// 通用树节点类型
type TreeNode<T> = {
  data: T;
  children: TreeNode<T>[];
};

// 文件系统树
type FileSystemNode = {
  name: string;
  type: "file" | "directory";
  size?: number;           // 文件大小（仅文件）
  children?: FileSystemNode[]; // 子节点（仅目录）
};

// 更精确的文件系统类型（使用可辨识联合）
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

// 使用示例
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

// 递归遍历函数
function traverseFS(node: FSNode, depth = 0): void {
  const indent = "  ".repeat(depth);
  if (node.type === "file") {
    console.log(`${indent}📄 ${node.name} (${node.size} bytes)`);
  } else {
    console.log(`${indent}📁 ${node.name}/`);
    node.children.forEach(child => traverseFS(child, depth + 1));
  }
}

// DOM 树类型
interface DOMNode {
  tagName: string;
  attributes: Record<string, string>;
  children: DOMNode[];
  textContent?: string;
}

// 组织架构树
interface Employee {
  id: number;
  name: string;
  title: string;
  reports: Employee[];
}

const organization: Employee = {
  id: 1,
  name: "CEO",
  title: "首席执行官",
  reports: [
    {
      id: 2,
      name: "CTO",
      title: "首席技术官",
      reports: [
        { id: 4, name: "张三", title: "高级工程师", reports: [] },
        { id: 5, name: "李四", title: "高级工程师", reports: [] }
      ]
    },
    {
      id: 3,
      name: "CFO",
      title: "首席财务官",
      reports: []
    }
  ]
};
```

### 递归路径类型

获取嵌套对象的所有可能路径：

```typescript
// 获取对象的所有路径（点号分隔）
type Paths<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? Paths<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

// 使用示例
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
// 结果：
// | "database"
// | "database.host"
// | "database.port"
// | "database.credentials"
// | "database.credentials.username"
// | "database.credentials.password"
// | "server"
// | "server.port"

// 根据路径获取值类型
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

// 类型安全的路径访问函数
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

const host = get(config, "database.host");     // 类型为 string
const port = get(config, "database.port");     // 类型为 number
// const invalid = get(config, "database.invalid"); // 编译错误
```

### 深度合并类型

```typescript
// 深度合并两个类型
type DeepMerge<T, U> = T extends object
  ? U extends object
    ? {
        [K in keyof T | keyof U]: K extends keyof T
          ? K extends keyof U
            ? DeepMerge<T[K], U[K]>  // 两者都有，递归合并
            : T[K]                     // 只在 T 中
          : K extends keyof U
            ? U[K]                     // 只在 U 中
            : never;
      }
    : U
  : U;

// 使用示例
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
// 结果：
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

### 递归数组扁平化类型

```typescript
// 获取多维数组的元素类型
type ElementOf<T> = T extends (infer E)[] ? ElementOf<E> : T;

type E1 = ElementOf<number[]>;           // number
type E2 = ElementOf<string[][]>;         // string
type E3 = ElementOf<boolean[][][][][]>;  // boolean

// 扁平化到指定深度
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

// TypeScript 内置的 Array.flat() 类型
type FlatArray<Arr, Depth extends number> = {
  done: Arr;
  recur: Arr extends ReadonlyArray<infer InnerArr>
    ? FlatArray<
        InnerArr,
        [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20][Depth]
      >
    : Arr;
}[Depth extends -1 ? "done" : "recur"];

// 使用示例
const nested = [[1, 2], [[3, 4]], [[[5, 6]]]];
const flat1 = nested.flat(1);   // (number | number[] | number[][])[]
const flat2 = nested.flat(2);   // (number | number[])[]
const flatInf = nested.flat(Infinity); // number[]
```

## 最佳实践

### 使用接口代替复杂递归类型别名

当递归类型变得复杂时，使用接口可以提高可读性和编译性能：

```typescript
// 不推荐：复杂的类型别名
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

// 推荐：使用接口
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

### 为递归类型添加深度限制

防止类型系统陷入过深的递归：

```typescript
// 带深度限制的 DeepPartial
type DeepPartialWithLimit<T, Depth extends number = 5> = [Depth] extends [0]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartialWithLimit<T[K], Prev[Depth]> }
    : T;

// 深度计数器
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 使用
type SafeDeepPartial = DeepPartialWithLimit<DeeplyNestedType, 3>;
```

### 使用条件类型处理边界情况

```typescript
// 完善的 DeepReadonly 实现
type DeepReadonlyRobust<T> = T extends ((...args: any[]) => any) | Date | RegExp
  ? T  // 函数、Date、RegExp 保持原样
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

### 提供类型推断辅助函数

```typescript
// 为复杂递归类型提供构造辅助函数
function createTree<T>(data: T, children: TreeNode<T>[] = []): TreeNode<T> {
  return { data, children };
}

// 类型推断自动工作
const numberTree = createTree(1, [
  createTree(2),
  createTree(3, [createTree(4)])
]);
// numberTree: TreeNode<number>
```

### 文档化递归类型的约束

```typescript
/**
 * 深度部分类型
 * @description 将对象的所有属性（包括嵌套属性）变为可选
 * @template T - 要转换的对象类型
 * @note
 * - 函数类型保持不变
 * - 数组会递归处理元素类型
 * - 最大递归深度约为 50 层
 * @example
 * type UserPartial = DeepPartial<User>;
 * // { id?: number; profile?: { name?: string; } }
 */
type DeepPartialDocumented<T> = T extends object
  ? { [K in keyof T]?: DeepPartialDocumented<T[K]> }
  : T;
```

## 常见陷阱

### 循环引用导致的无限类型

```typescript
// 陷阱：直接的自引用
// type Infinite = Infinite; // 错误：类型别名循环引用自身

// 陷阱：通过联合类型的直接引用
// type BadRecursive = BadRecursive | string; // 某些版本会报错

// 解决：通过对象或数组间接引用
type GoodRecursive = {
  value: GoodRecursive;
} | string;
```

### 分布式条件类型的意外行为

```typescript
// 陷阱：联合类型的分布行为
type DeepPartialDistributed<T> = T extends object
  ? { [K in keyof T]?: DeepPartialDistributed<T[K]> }
  : T;

// 当 T 是联合类型时会分别处理
type Result = DeepPartialDistributed<{ a: 1 } | { b: 2 }>;
// 分布为: DeepPartialDistributed<{ a: 1 }> | DeepPartialDistributed<{ b: 2 }>
// 结果: { a?: 1 } | { b?: 2 }

// 如果需要作为整体处理，使用元组包裹
type DeepPartialNonDistributed<T> = [T] extends [object]
  ? { [K in keyof T]?: DeepPartialNonDistributed<T[K]> }
  : T;
```

### 数组与对象的判断顺序

```typescript
// 陷阱：数组也是 object
type WrongDeepReadonly<T> = T extends object
  ? { readonly [K in keyof T]: WrongDeepReadonly<T[K]> }
  : T;

// 数组会被错误处理
type Arr = WrongDeepReadonly<number[]>;
// 结果可能不符合预期

// 解决：先判断数组
type CorrectDeepReadonly<T> = T extends (infer U)[]
  ? readonly CorrectDeepReadonly<U>[]
  : T extends object
    ? { readonly [K in keyof T]: CorrectDeepReadonly<T[K]> }
    : T;
```

### 函数类型的意外递归

```typescript
// 陷阱：函数类型也是 object
type BadDeepPartial<T> = T extends object
  ? { [K in keyof T]?: BadDeepPartial<T[K]> }
  : T;

interface WithFunction {
  name: string;
  greet: () => void;
}

type Bad = BadDeepPartial<WithFunction>;
// greet 的类型会变成 { (): void }?，这不是我们想要的

// 解决：排除函数类型
type GoodDeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { [K in keyof T]?: GoodDeepPartial<T[K]> }
    : T;
```

### 递归深度超限

```typescript
// 陷阱：过深的类型会导致编译错误
type VeryDeep = {
  level1: {
    level2: {
      // ... 继续 50+ 层
    }
  }
};

// type Error = DeepReadonly<VeryDeep>; // 可能报错

// 解决：添加深度限制
type MaxDepth = 10;
type Counter = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type DeepReadonlyLimited<T, D extends number = MaxDepth> = D extends 0
  ? T
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonlyLimited<T[K], Counter[D]> }
    : T;
```

### never 类型的传播

```typescript
// 陷阱：never 会在递归中传播
type PropagatesNever<T> = T extends { a: infer A }
  ? { result: PropagatesNever<A> }
  : never;

type WithNever = PropagatesNever<{ a: { b: 1 } }>;
// 由于最终没有 { a: ... } 结构，返回 never

// 解决：提供默认值或终止条件
type SafeRecursive<T> = T extends { a: infer A }
  ? { result: SafeRecursive<A> }
  : { result: T };  // 使用 T 而不是 never
```

## 性能考量

### 编译时间影响

递归类型会显著增加 TypeScript 的编译时间：

```typescript
// 避免：过于复杂的递归类型
type ComplexRecursive<T, Keys extends keyof any = keyof T> =
  Keys extends keyof T
    ? T[Keys] extends object
      ? ComplexRecursive<T[Keys]> | { [K in Keys]: ComplexRecursive<T[Keys]> }
      : { [K in Keys]: T[Keys] }
    : never;

// 推荐：简化递归逻辑
type SimpleRecursive<T> = T extends object
  ? { [K in keyof T]: SimpleRecursive<T[K]> }
  : T;
```

### IDE 响应速度

复杂的递归类型会影响 IDE 的智能提示性能：

```typescript
// 可能导致 IDE 卡顿
type HeavyType = DeepPartial<DeepReadonly<DeepMerge<TypeA, TypeB>>>;

// 优化：使用中间类型别名
type IntermediateA = DeepPartial<TypeA>;
type IntermediateB = DeepReadonly<IntermediateA>;
type FinalType = DeepMerge<IntermediateB, TypeB>;
```

### 内存使用

类型实例化会占用内存：

```typescript
// 缓存递归结果（TypeScript 自动进行）
type CachedDeepReadonly<T> = T extends object
  ? DeepReadonlyCache<T>
  : T;

type DeepReadonlyCache<T> = {
  readonly [K in keyof T]: CachedDeepReadonly<T[K]>;
};

// 复用相同的类型定义
type UserReadonly = CachedDeepReadonly<User>;
type ConfigReadonly = CachedDeepReadonly<Config>;
// TypeScript 会缓存 CachedDeepReadonly 的计算结果
```

### 构建优化建议

```typescript
// 1. 限制递归深度
type OptimizedDeep<T, D extends number = 5> = ...;

// 2. 使用条件终止而非继续递归
type EarlyTermination<T> = T extends null | undefined
  ? T  // 提前终止
  : T extends object
    ? { [K in keyof T]: EarlyTermination<T[K]> }
    : T;

// 3. 避免在热路径上使用复杂递归类型
// 不好：频繁计算
function process<T>(data: DeepPartial<T>): T { ... }

// 好：预定义类型
type ProcessInput = DeepPartial<ExpectedType>;
function process(data: ProcessInput): ExpectedType { ... }
```

## 实战场景

### 配置管理系统

```typescript
// 定义配置 Schema
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

// 配置覆盖类型
type ConfigOverride = DeepPartial<AppConfig>;

// 配置合并函数
function mergeConfig(
  base: AppConfig,
  override: ConfigOverride
): AppConfig {
  return deepMerge(base, override);
}

// 环境特定配置
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

### 状态管理不可变更新

```typescript
// Redux-like 状态类型
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

// 不可变状态类型
type ImmutableState = DeepReadonly<AppState>;

// 更新路径类型
type StatePaths = Paths<AppState>;

// 类型安全的状态更新
type StateUpdater<P extends StatePaths> = (
  state: ImmutableState,
  path: P,
  value: PathValue<AppState, P>
) => ImmutableState;

// Immer-like 更新辅助
function produce<T>(
  state: DeepReadonly<T>,
  recipe: (draft: T) => void
): DeepReadonly<T> {
  // 实现使用 Immer 或类似库
  return {} as DeepReadonly<T>;
}

// 使用
const newState = produce(currentState, draft => {
  draft.user.profile.preferences.theme = "dark";
});
```

### API 响应类型处理

```typescript
// API 响应包装类型
interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

// 递归可空类型（处理可能为 null 的嵌套数据）
type DeepNullable<T> = T extends (...args: any[]) => any
  ? T
  : T extends object
    ? { [K in keyof T]: DeepNullable<T[K]> | null }
    : T | null;

// API 响应数据可能包含 null
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
// 所有字段都可能为 null

// 类型安全的数据访问
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

### 表单验证系统

```typescript
// 表单字段定义
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

// 验证错误类型（与 Schema 结构相同但值为错误信息）
type FormErrors<T> = T extends object
  ? { [K in keyof T]?: FormErrors<T[K]> | string }
  : string;

// 表单状态
interface FormState<T> {
  values: T;
  errors: FormErrors<T>;
  touched: DeepPartial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
}

// 表单钩子类型
interface UseFormReturn<T> {
  state: FormState<T>;
  setValue: <P extends Paths<T>>(path: P, value: PathValue<T, P>) => void;
  setError: <P extends Paths<T>>(path: P, error: string) => void;
  validate: () => boolean;
  submit: () => Promise<void>;
}

// 使用示例
function useForm<T extends object>(initialValues: T): UseFormReturn<T> {
  // 实现...
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

form.setValue("profile.address.city", "北京"); // 类型安全
form.setError("email", "邮箱格式不正确");
```

### 国际化系统

```typescript
// 多语言消息结构
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

// 消息路径类型
type MessageKey = Paths<Messages>;

// 类型安全的翻译函数
function t(key: MessageKey): string {
  // 实现...
  return "";
}

// 使用
const submitText = t("common.buttons.submit");
const homeTitle = t("pages.home.title");
// const invalid = t("invalid.path"); // 编译错误
```

## 面试要点

### 什么是递归类型？请举例说明

**答案要点**：
- 递归类型是在定义中引用自身的类型
- 必须有终止条件防止无限递归
- 常见应用：链表、树、JSON 结构

```typescript
// 链表示例
type LinkedList<T> = {
  value: T;
  next: LinkedList<T> | null; // 递归引用，null 是终止条件
};

// JSON 示例
type JSONValue =
  | string | number | boolean | null  // 终止条件
  | JSONValue[]                        // 递归：数组
  | { [key: string]: JSONValue };      // 递归：对象
```

### 如何实现 DeepPartial 类型？

**答案要点**：
- 使用条件类型判断是否为对象
- 递归处理嵌套属性
- 需要处理特殊类型（函数、数组）

```typescript
type DeepPartial<T> = T extends (...args: any[]) => any
  ? T  // 函数保持原样
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;
```

### 递归类型有什么限制？如何解决？

**答案要点**：
- 深度限制（约 50 层）
- 编译性能影响
- 解决方案：添加深度计数器

```typescript
type DeepWithLimit<T, D extends number = 5> = D extends 0
  ? T
  : T extends object
    ? { [K in keyof T]: DeepWithLimit<T[K], Prev[D]> }
    : T;

type Prev = [never, 0, 1, 2, 3, 4, 5];
```

### 递归类型和接口的递归有什么区别？

**答案要点**：
- 接口可以直接递归引用
- 类型别名需要通过对象/数组间接引用
- 接口通常有更好的编译性能

```typescript
// 接口可以直接递归
interface TreeNode {
  value: number;
  children: TreeNode[];
}

// 类型别名需要间接引用
type TreeNodeType = {
  value: number;
  children: TreeNodeType[];
};
```

### 如何实现类型安全的深度路径访问？

**答案要点**：
- 使用模板字面量类型生成路径
- 递归处理嵌套对象
- 结合 infer 提取值类型

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

### 递归条件类型的常见陷阱有哪些？

**答案要点**：
- 分布式条件类型的意外行为
- 数组和对象的判断顺序
- never 类型的传播
- 函数类型的特殊处理

```typescript
// 陷阱：数组也是 object
type Wrong<T> = T extends object ? "obj" : "other";
type Arr = Wrong<number[]>; // "obj"

// 正确：先判断数组
type Correct<T> = T extends any[] ? "arr" : T extends object ? "obj" : "other";
```

## 延伸阅读

### 官方文档
- [TypeScript Handbook - Recursive Type Aliases](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#more-recursive-type-aliases)
- [TypeScript Handbook - Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [TypeScript Handbook - Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

### 推荐资源
- [Type Challenges](https://github.com/type-challenges/type-challenges) - 类型体操练习，包含大量递归类型挑战
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - TypeScript 深入指南
- [Effective TypeScript](https://effectivetypescript.com/) - TypeScript 最佳实践

### 相关工具库
- [type-fest](https://github.com/sindresorhus/type-fest) - 包含 PartialDeep、ReadonlyDeep 等实用类型
- [ts-toolbelt](https://github.com/millsp/ts-toolbelt) - 高级 TypeScript 类型工具集
- [utility-types](https://github.com/piotrwitek/utility-types) - TypeScript 实用类型集合
