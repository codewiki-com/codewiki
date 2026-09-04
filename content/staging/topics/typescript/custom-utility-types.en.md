---
title: TypeScript Custom Utility Types
description: In-depth guide to designing and implementing custom TypeScript utility types, including DeepPartial, DeepRequired, OmitByType, RequiredKeys, and other advanced type programming patterns
track: typescript
section: generics-advanced
difficulty: advanced
tags:
  - typescript
  - utility-types
  - generics
  - type-programming
  - advanced-types
status: imported
origin: old/src/content/docs/typescript/custom-utility-types.en.md
divergence: 0.227
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - category-casing
legacy:
  category: typescript
  subcategory: ""
  order: 15
  lastUpdated: 2026-01-07
---

## Concept Overview

TypeScript provides many built-in utility types such as `Partial<T>`, `Required<T>`, `Pick<T, K>`, etc., which offer tremendous convenience for everyday type operations. However, real-world project requirements often demand more sophisticated type transformations—you might need to recursively make all properties of nested objects optional, or filter object keys based on property value types. This is where custom utility types become an essential skill.

Custom utility types are reusable type tools created by developers using TypeScript's advanced type features (generics, conditional types, mapped types, the `infer` keyword, etc.). They typically accept one or more type parameters, perform type operations, and return new types.

### Historical Background

TypeScript introduced Mapped Types in version 2.1, and in version 2.8 added Conditional Types and the `infer` keyword. These features made type-level programming possible. The community subsequently developed excellent type utility libraries such as `type-fest`, `ts-toolbelt`, and `utility-types`, which greatly advanced the development of TypeScript type programming.

### Problems Solved

Custom utility types primarily solve the following issues:

1. **Type Reusability**: Avoid repeating similar type definitions in multiple places
2. **Type Constraints**: Perform strict type checking at compile time to reduce runtime errors
3. **Code Readability**: Improve code self-documentation through semantic type names
4. **Type-Safe Abstractions**: Achieve code abstraction without losing type information

## Core Principles

Building custom utility types relies on several core features of TypeScript's type system:

### Generics

Generics are type parameterization, allowing the use of type variables when defining types:

```typescript
type Identity<T> = T;
type Box<T> = { value: T };
```

### Conditional Types

Conditional types select different type branches based on type relationships:

```typescript
type IsString<T> = T extends string ? true : false;

// Distributive conditional types: when T is a union type,
// the conditional type distributes to each member
type ToArray<T> = T extends any ? T[] : never;
type Result = ToArray<string | number>; // string[] | number[]
```

### Mapped Types

Mapped types iterate over type keys and create new types:

```typescript
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

type Optional<T> = {
  [K in keyof T]?: T[K];
};
```

### The `infer` Keyword

`infer` is used to infer type variables within conditional types:

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type Unpacked<T> = T extends Array<infer U> ? U : T;
```

### Template Literal Types

Introduced in TypeScript 4.1, template literal types allow operations on string types:

```typescript
type Greeting<T extends string> = `Hello, ${T}!`;
type HelloWorld = Greeting<'World'>; // "Hello, World!"
```

### The Nature of Type Operations

TypeScript's type system is Turing complete, meaning it can theoretically implement arbitrarily complex computations using types. Utility types are essentially functions at the type level:

- **Input**: Type parameters (generics)
- **Processing**: Conditional branches, recursion, mapping, etc.
- **Output**: New type

## Key Principles

### Basic Steps for Building Custom Utility Types

1. **Clarify Requirements**: Determine input types and expected output types
2. **Decompose Problems**: Break complex types into combinations of simpler types
3. **Choose Tools**: Select appropriate type features based on requirements
4. **Handle Recursion**: Use recursive types for nested structures
5. **Handle Edge Cases**: Consider special cases (never, unknown, union types, etc.)

### Common Type Construction Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| Mapping Transformation | Iterate over object keys and transform value types | `Readonly<T>` |
| Conditional Filtering | Filter types based on conditions | `Extract<T, U>` |
| Recursive Processing | Handle nested structures | `DeepPartial<T>` |
| Inference Extraction | Extract parts from complex types | `ReturnType<T>` |
| Key Operations | Add, remove, or modify object keys | `Omit<T, K>` |

### Fundamental Type Operations

```typescript
// Type equality check
type Equals<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2)
    ? true
    : false;

// Get union type of object keys
type Keys<T> = keyof T;

// Get union type of object values
type Values<T> = T[keyof T];
```

## Code Examples

### DeepPartial - Deep Optional

Make all nested properties of an object optional:

```typescript
/**
 * Recursively make all properties and nested properties of type T optional
 * @example
 * type User = { name: string; profile: { age: number; email: string } };
 * type PartialUser = DeepPartial<User>;
 * // { name?: string; profile?: { age?: number; email?: string } }
 */
type DeepPartial<T> = T extends object
  ? T extends Function
    ? T  // Return function types as-is
    : { [K in keyof T]?: DeepPartial<T[K]> }
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
  database: {
    url: string;
    poolSize: number;
  };
}

// Very useful for partial config updates
function updateConfig(config: Config, updates: DeepPartial<Config>): Config {
  // Deep merge logic
  return { ...config, ...updates };
}

// Only provide the parts that need updating
const updates: DeepPartial<Config> = {
  server: {
    ssl: {
      enabled: true
    }
  }
};
```

### DeepRequired - Deep Required

Opposite of DeepPartial: make all nested properties required:

```typescript
/**
 * Recursively make all properties and nested properties of type T required
 * The -? modifier is used to remove the optional marker
 */
type DeepRequired<T> = T extends object
  ? T extends Function
    ? T
    : { [K in keyof T]-?: DeepRequired<T[K]> }
  : T;

// Handle cases that may contain undefined
type DeepRequiredNonNullable<T> = T extends object
  ? T extends Function
    ? T
    : { [K in keyof T]-?: DeepRequiredNonNullable<NonNullable<T[K]>> }
  : T;

// Usage example
interface PartialSettings {
  theme?: {
    primary?: string;
    secondary?: string;
  };
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
}

type RequiredSettings = DeepRequired<PartialSettings>;
// {
//   theme: { primary: string; secondary: string };
//   notifications: { email: boolean; push: boolean };
// }
```

### DeepReadonly - Deep Readonly

Recursively make all properties readonly:

```typescript
/**
 * Recursively make all properties of type T readonly
 */
type DeepReadonly<T> = T extends object
  ? T extends Function
    ? T
    : { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

// Version with array handling
type DeepReadonlyArray<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonlyFull<U>>
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonlyFull<T[K]> }
    : T;

type DeepReadonlyFull<T> = T extends Function ? T : DeepReadonlyArray<T>;

// Usage example
interface State {
  users: { id: number; name: string }[];
  settings: {
    theme: string;
    language: string;
  };
}

type ImmutableState = DeepReadonlyFull<State>;
// {
//   readonly users: ReadonlyArray<{ readonly id: number; readonly name: string }>;
//   readonly settings: { readonly theme: string; readonly language: string };
// }
```

### OmitByType - Filter by Value Type

Filter object keys based on property value types:

```typescript
/**
 * Remove properties from type T whose values are of type U
 * @example
 * type Obj = { a: string; b: number; c: string };
 * type Result = OmitByType<Obj, string>; // { b: number }
 */
type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

/**
 * Keep properties from type T whose values are of type U
 */
type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

// Usage example
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
}

type StringFields = PickByType<User, string>;
// { name: string; email: string }

type NonStringFields = OmitByType<User, string>;
// { id: number; age: number; isActive: boolean }

type NumberFields = PickByType<User, number>;
// { id: number; age: number }

// More complex example: filter properties that are function types
interface Service {
  name: string;
  version: number;
  start: () => void;
  stop: () => void;
  getStatus: () => string;
}

type Methods = PickByType<Service, Function>;
// { start: () => void; stop: () => void; getStatus: () => string }

type Data = OmitByType<Service, Function>;
// { name: string; version: number }
```

### RequiredKeys / OptionalKeys - Get Required/Optional Keys

Extract the required or optional keys from an object type:

```typescript
/**
 * Get all required property keys from type T
 */
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

/**
 * Get all optional property keys from type T
 */
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// Usage example
interface Person {
  id: number;           // required
  name: string;         // required
  email?: string;       // optional
  phone?: string;       // optional
  address?: string;     // optional
}

type PersonRequiredKeys = RequiredKeys<Person>;  // "id" | "name"
type PersonOptionalKeys = OptionalKeys<Person>;  // "email" | "phone" | "address"

// Practical application: ensure certain fields are required
type EnsureRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

type PersonWithRequiredEmail = EnsureRequired<Person, 'email'>;
// { id: number; name: string; phone?: string; address?: string; email: string }
```

### Mutable - Remove Readonly

Remove the readonly modifier from all object properties:

```typescript
/**
 * Remove readonly modifiers from all properties of type T
 * The -readonly is used to remove the readonly marker
 */
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

/**
 * Deeply remove readonly modifiers
 */
type DeepMutable<T> = T extends object
  ? T extends Function
    ? T
    : { -readonly [K in keyof T]: DeepMutable<T[K]> }
  : T;

// Usage example
interface ReadonlyUser {
  readonly id: number;
  readonly name: string;
  readonly profile: {
    readonly bio: string;
    readonly avatar: string;
  };
}

type MutableUser = Mutable<ReadonlyUser>;
// { id: number; name: string; profile: { readonly bio: string; readonly avatar: string } }

type FullyMutableUser = DeepMutable<ReadonlyUser>;
// { id: number; name: string; profile: { bio: string; avatar: string } }
```

### PathOf / PathValue - Object Path Types

Get all possible paths of an object and their corresponding value types:

```typescript
/**
 * Get all possible paths from object type T
 * Represented as dot-separated strings for nested paths
 */
type PathOf<T, Prefix extends string = ''> = T extends object
  ? T extends Array<any>
    ? Prefix
    : {
        [K in keyof T & string]: K extends string
          ? Prefix extends ''
            ? PathOf<T[K], K> | K
            : PathOf<T[K], `${Prefix}.${K}`> | `${Prefix}.${K}`
          : never;
      }[keyof T & string]
  : Prefix;

/**
 * Get the value type corresponding to a path
 */
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

// Usage example
interface AppConfig {
  app: {
    name: string;
    version: string;
  };
  database: {
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
}

type ConfigPaths = PathOf<AppConfig>;
// "app" | "app.name" | "app.version" | "database" | "database.host" |
// "database.port" | "database.credentials" | "database.credentials.username" |
// "database.credentials.password"

type HostType = PathValue<AppConfig, 'database.host'>;     // string
type PortType = PathValue<AppConfig, 'database.port'>;     // number
type CredentialsType = PathValue<AppConfig, 'database.credentials'>;
// { username: string; password: string }

// Type-safe config reading function
function getConfig<P extends PathOf<AppConfig>>(
  config: AppConfig,
  path: P
): PathValue<AppConfig, P> {
  const keys = path.split('.');
  let result: any = config;
  for (const key of keys) {
    result = result[key];
  }
  return result;
}
```

### UnionToIntersection - Convert Union to Intersection

Convert union types to intersection types:

```typescript
/**
 * Convert union type to intersection type
 * Leverages contravariance of function parameters
 */
type UnionToIntersection<U> = (
  U extends any ? (arg: U) => void : never
) extends (arg: infer I) => void
  ? I
  : never;

// Usage example
type Union = { a: string } | { b: number } | { c: boolean };
type Intersection = UnionToIntersection<Union>;
// { a: string } & { b: number } & { c: boolean }

// Practical application: merge multiple interfaces
interface A { name: string; }
interface B { age: number; }
interface C { email: string; }

type Merged = UnionToIntersection<A | B | C>;
// { name: string } & { age: number } & { email: string }
```

### FunctionKeys - Get Function Type Keys

Extract keys of all function-type properties from an object:

```typescript
/**
 * Get all function-type property keys from type T
 */
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

/**
 * Get all non-function-type property keys from type T
 */
type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

/**
 * Keep only function-type properties
 */
type PickFunctions<T> = Pick<T, FunctionKeys<T>>;

/**
 * Remove function-type properties
 */
type OmitFunctions<T> = Pick<T, NonFunctionKeys<T>>;

// Usage example
interface UserService {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  getProfile: () => Promise<User>;
  updateProfile: (data: Partial<User>) => Promise<User>;
}

type UserServiceMethods = FunctionKeys<UserService>;
// "login" | "logout" | "getProfile" | "updateProfile"

type UserServiceData = NonFunctionKeys<UserService>;
// "currentUser" | "isAuthenticated"

type UserServiceAPI = PickFunctions<UserService>;
// { login: ...; logout: ...; getProfile: ...; updateProfile: ... }
```

### Promisify - Promisify Functions

Wrap function return types as Promise:

```typescript
/**
 * Wrap function return type as Promise
 */
type Promisify<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => Promise<Awaited<ReturnType<T>>>;

/**
 * Wrap all method return types in an object as Promise
 */
type PromisifyAll<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<Awaited<R>>
    : T[K];
};

// Usage example
interface SyncAPI {
  getData: () => string;
  setData: (value: string) => void;
  processData: (input: number) => number;
}

type AsyncAPI = PromisifyAll<SyncAPI>;
// {
//   getData: () => Promise<string>;
//   setData: (value: string) => Promise<void>;
//   processData: (input: number) => Promise<number>;
// }
```

## Best Practices

### Use Meaningful Type Names

```typescript
// Poor naming
type T1<T> = { [K in keyof T]?: T[K] };

// Good naming
type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };
```

### Add JSDoc Comments

```typescript
/**
 * Recursively make all properties of type T optional
 * @template T - The object type to transform
 * @example
 * type User = { name: string; profile: { age: number } };
 * type PartialUser = DeepPartial<User>;
 */
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```

### Handle Edge Cases

```typescript
// Handle special types like Function, Array, Date
type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends Date
      ? T
      : T extends object
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : T;
```

### Avoid Overly Complex Types

```typescript
// Break complex types into multiple simple types
type IsArray<T> = T extends any[] ? true : false;
type IsFunction<T> = T extends Function ? true : false;
type IsObject<T> = T extends object
  ? IsArray<T> extends true
    ? false
    : IsFunction<T> extends true
      ? false
      : true
  : false;

// Then combine them
type DeepPartial<T> = IsObject<T> extends true
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```

### Use Helper Types to Improve Readability

```typescript
// Helper types
type Primitive = string | number | boolean | symbol | null | undefined;
type DeepPartialObject<T> = { [K in keyof T]?: DeepPartial<T[K]> };

// Main type is clearer
type DeepPartial<T> = T extends Primitive
  ? T
  : T extends Function
    ? T
    : DeepPartialObject<T>;
```

### Organize and Export Utility Types

```typescript
// types/utilities.ts
export type DeepPartial<T> = /* ... */;
export type DeepRequired<T> = /* ... */;
export type DeepReadonly<T> = /* ... */;

// types/index.ts
export * from './utilities';
export * from './api-types';
export * from './domain-types';
```

## Common Pitfalls

### Recursive Type Depth Limit

TypeScript has a depth limit for recursive types (typically around 50 layers). Overly deep recursion causes compilation errors:

```typescript
// May cause problems with deep recursion
type DeepNested = {
  level1: {
    level2: {
      // ... many levels
      level50: {
        value: string;
      };
    };
  };
};

// Solution: Add recursion depth counter (TypeScript 4.5+)
type DeepPartialWithDepth<T, Depth extends number = 10> = Depth extends 0
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartialWithDepth<T[K], Prev[Depth]> }
    : T;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
```

### Unexpected Distributive Conditional Type Behavior

```typescript
// Union types are distributed during processing
type ToArray<T> = T extends any ? T[] : never;
type Result = ToArray<string | number>; // string[] | number[]

// To prevent distribution, wrap with tuple
type ToArrayNoDistribute<T> = [T] extends [any] ? T[] : never;
type Result2 = ToArrayNoDistribute<string | number>; // (string | number)[]
```

### Special Behavior of `never` Type

```typescript
// never disappears in union types
type Test1 = string | never; // string

// never in conditional types
type Test2<T> = T extends string ? T : never;
type Result = Test2<never>; // never (doesn't enter the conditional)

// Detecting never type
type IsNever<T> = [T] extends [never] ? true : false;
```

### Index Access Type Safety

```typescript
// Unsafe index access
type UnsafeGet<T, K> = T[K]; // Error: K may not be a key of T

// Safe index access
type SafeGet<T, K extends keyof T> = T[K];

// Safe access with default value
type SafeGetWithDefault<T, K, D = never> = K extends keyof T ? T[K] : D;
```

### Difference Between Optional Properties and undefined

```typescript
interface User {
  name: string;
  email?: string;           // Optional property
  phone: string | undefined; // Must provide, but value can be undefined
}

// These two types are different
type A = { key?: string };      // key can be absent
type B = { key: string | undefined }; // key must exist, value can be undefined

// Need to be careful when handling
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];
```

### Type Inference for Function Overloads

```typescript
// For overloaded functions, only the last signature is inferred
function fn(x: string): string;
function fn(x: number): number;
function fn(x: string | number): string | number {
  return x;
}

type FnReturn = ReturnType<typeof fn>; // string | number (last signature)
```

## Performance Considerations

### Type Instantiation Depth

TypeScript compiler has a depth limit for type instantiation. Complex recursive types may cause:

- Increased compilation time
- Slower IDE response
- "Type instantiation is excessively deep" error

```typescript
// Before optimization: each recursion creates new type
type DeepPartialSlow<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartialSlow<T[K]] : T[K];
};

// After optimization: use conditional types to terminate early
type DeepPartialFast<T> = T extends object
  ? T extends Function
    ? T
    : { [K in keyof T]?: DeepPartialFast<T[K]> }
  : T;
```

### Caching Type Computations

TypeScript caches type computation results, but complex types may not cache effectively:

```typescript
// Use type alias to help with caching
type IsObject<T> = T extends object ? (T extends Function ? false : true) : false;

// Reuse in other types
type DeepPartial<T> = IsObject<T> extends true
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```

### Avoid Unnecessary Type Computations

```typescript
// Bad: compute each time used
type Config = DeepPartial<LargeConfigType>;

// Good: compute once, use multiple times
type PartialConfig = DeepPartial<LargeConfigType>;
// Use PartialConfig in multiple places
```

### Use `any` as an Escape Hatch for Extreme Complexity

For extremely complex types, using `any` can avoid compilation performance issues:

```typescript
// When type becomes too complex
type ComplexType<T> = T extends SomeCondition
  ? /* complex computation */
  : any; // Use any as fallback
```

## Real-World Scenarios

### Scenario 1: API Response Type Handling

```typescript
// API response wrapper type
type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
  timestamp: string;
};

// Paginated response
type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}>;

// Convert Date strings in API response to Date type
type DateKeys<T> = {
  [K in keyof T]: T[K] extends string
    ? K extends `${string}Date` | `${string}At` | `${string}Time`
      ? K
      : never
    : never;
}[keyof T];

type WithParsedDates<T> = {
  [K in keyof T]: K extends DateKeys<T> ? Date : T[K];
};

// Usage
interface UserResponse {
  id: number;
  name: string;
  createdAt: string;  // ISO date string
  updatedAt: string;  // ISO date string
  lastLoginDate: string;
}

type ParsedUser = WithParsedDates<UserResponse>;
// { id: number; name: string; createdAt: Date; updatedAt: Date; lastLoginDate: Date }
```

### Scenario 2: Form Validation Types

```typescript
// Form field validation rule type
type ValidationRule<T> = {
  required?: boolean;
  min?: T extends number ? number : never;
  max?: T extends number ? number : never;
  minLength?: T extends string ? number : never;
  maxLength?: T extends string ? number : never;
  pattern?: T extends string ? RegExp : never;
  custom?: (value: T) => string | undefined;
};

// Generate validation rule type based on data type
type FormValidation<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

// Usage
interface RegisterForm {
  username: string;
  email: string;
  age: number;
  password: string;
}

const validation: FormValidation<RegisterForm> = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  age: {
    required: true,
    min: 18,
    max: 120,
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value) => {
      if (!/[A-Z]/.test(value)) {
        return 'Password must contain at least one uppercase letter';
      }
      return undefined;
    },
  },
};
```

### Scenario 3: State Management Types

```typescript
// Redux-style Action type
type ActionMap<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends undefined
    ? { type: K }
    : { type: K; payload: T[K] };
};

type Actions<T extends Record<string, any>> = ActionMap<T>[keyof ActionMap<T>];

// Usage
interface CounterPayloads {
  INCREMENT: undefined;
  DECREMENT: undefined;
  SET_COUNT: number;
  ADD: number;
}

type CounterAction = Actions<CounterPayloads>;
// | { type: 'INCREMENT' }
// | { type: 'DECREMENT' }
// | { type: 'SET_COUNT'; payload: number }
// | { type: 'ADD'; payload: number }

// Reducer type
type Reducer<S, A extends { type: string }> = (state: S, action: A) => S;

const counterReducer: Reducer<number, CounterAction> = (state, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    case 'SET_COUNT':
      return action.payload; // Type-safe: TypeScript knows payload exists
    case 'ADD':
      return state + action.payload;
    default:
      return state;
  }
};
```

### Scenario 4: Event System Types

```typescript
// Type-safe event emitter
type EventMap = Record<string, any>;

type EventHandler<T> = (payload: T) => void;

interface TypedEventEmitter<E extends EventMap> {
  on<K extends keyof E>(event: K, handler: EventHandler<E[K]>): void;
  off<K extends keyof E>(event: K, handler: EventHandler<E[K]>): void;
  emit<K extends keyof E>(event: K, payload: E[K]): void;
}

// Usage
interface AppEvents {
  'user:login': { userId: string; timestamp: Date };
  'user:logout': { userId: string };
  'data:update': { entity: string; id: number; changes: Record<string, any> };
  'error': Error;
}

declare const emitter: TypedEventEmitter<AppEvents>;

// Type-safe event handling
emitter.on('user:login', (payload) => {
  console.log(payload.userId);    // string
  console.log(payload.timestamp); // Date
});

emitter.emit('data:update', {
  entity: 'user',
  id: 1,
  changes: { name: 'New Name' },
});
```

### Scenario 5: ORM Query Builder Types

```typescript
// Simplified query condition type
type WhereCondition<T> = {
  [K in keyof T]?: T[K] | { eq?: T[K]; ne?: T[K]; gt?: T[K]; lt?: T[K]; in?: T[K][] };
};

type OrderDirection = 'asc' | 'desc';
type OrderBy<T> = Partial<Record<keyof T, OrderDirection>>;

type SelectFields<T> = (keyof T)[];

interface QueryBuilder<T> {
  where(condition: WhereCondition<T>): QueryBuilder<T>;
  orderBy(order: OrderBy<T>): QueryBuilder<T>;
  select<K extends keyof T>(...fields: K[]): QueryBuilder<Pick<T, K>>;
  limit(count: number): QueryBuilder<T>;
  offset(count: number): QueryBuilder<T>;
  execute(): Promise<T[]>;
}

// Usage
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  createdAt: Date;
}

declare const query: QueryBuilder<User>;

// Type-safe query building
const result = await query
  .where({
    age: { gt: 18 },
    name: { ne: 'admin' },
  })
  .orderBy({ createdAt: 'desc' })
  .select('id', 'name', 'email')
  .limit(10)
  .execute();

// result type is Pick<User, 'id' | 'name' | 'email'>[]
```

## Interview Questions

### Frequently Asked Interview Questions

**1. Implement the DeepPartial Type**

```typescript
// Question: Implement DeepPartial<T> to make all nested properties optional

// Answer
type DeepPartial<T> = T extends object
  ? T extends Function
    ? T
    : { [K in keyof T]?: DeepPartial<T[K]> }
  : T;
```

**2. Implement the Flatten Type**

```typescript
// Question: Flatten nested array types to single-dimension array type

type Flatten<T> = T extends (infer U)[]
  ? Flatten<U>
  : T;

// Test
type Nested = number[][][];
type Flat = Flatten<Nested>; // number
```

**3. Get All Object Paths**

```typescript
// Question: Get all possible access paths of an object

type Paths<T, K extends keyof T = keyof T> = K extends string
  ? T[K] extends object
    ? K | `${K}.${Paths<T[K]>}`
    : K
  : never;
```

**4. Implement UnionToTuple**

```typescript
// Question: Convert union type to tuple type (advanced)

type UnionToIntersection<U> = (
  U extends any ? (arg: U) => void : never
) extends (arg: infer I) => void
  ? I
  : never;

type LastOfUnion<U> = UnionToIntersection<
  U extends any ? (x: U) => void : never
> extends (x: infer Last) => void
  ? Last
  : never;

type UnionToTuple<U, Last = LastOfUnion<U>> = [U] extends [never]
  ? []
  : [...UnionToTuple<Exclude<U, Last>>, Last];

// Test
type Union = 'a' | 'b' | 'c';
type Tuple = UnionToTuple<Union>; // ['a', 'b', 'c']
```

**5. Implement PickByValue**

```typescript
// Question: Filter object properties by value type

type PickByValue<T, V> = Pick<
  T,
  { [K in keyof T]: T[K] extends V ? K : never }[keyof T]
>;

// Test
interface Obj {
  a: string;
  b: number;
  c: string;
  d: boolean;
}
type StringKeys = PickByValue<Obj, string>; // { a: string; c: string }
```

### Key Interview Focus Areas

1. **Fundamental Concepts**
   - Purpose and usage of generics
   - How conditional types work
   - Mapped type syntax
   - Usage of the `infer` keyword

2. **Advanced Techniques**
   - Distributive conditional types
   - Recursive types
   - Template literal types
   - Type guards and type narrowing

3. **Practical Ability**
   - Correctly implement common utility types
   - Understand edge cases and pitfalls
   - Code organization and naming conventions

4. **Problem Solving**
   - Analyze complex type requirements
   - Break down problems into simple steps
   - Optimize type computation performance

## Further Reading

### Official Documentation

- [TypeScript Handbook - Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [TypeScript Handbook - Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [TypeScript Handbook - Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [TypeScript Handbook - Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

### Type Utility Libraries

- [type-fest](https://github.com/sindresorhus/type-fest) - Collection of common utility types
- [ts-toolbelt](https://github.com/millsp/ts-toolbelt) - Powerful type utility library
- [utility-types](https://github.com/piotrwitek/utility-types) - Practical utility type collection

### Learning Resources

- [Type Challenges](https://github.com/type-challenges/type-challenges) - TypeScript type programming challenges
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - In-depth TypeScript understanding
- [Effective TypeScript](https://effectivetypescript.com/) - TypeScript best practices

### Advanced Articles

- [How the TypeScript Compiler Compiles](https://www.huy.rocks/everyday/04-01-2022-typescript-how-the-compiler-compiles)
- [TypeScript Type System Explained](https://www.typescriptlang.org/docs/handbook/type-inference.html)
- [Advanced TypeScript Patterns](https://www.patterns.dev/posts/advanced-typescript-patterns/)
