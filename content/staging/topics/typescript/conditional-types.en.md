---
title: TypeScript Conditional Types
description: Master TypeScript conditional types including infer keyword and distributive conditional types
track: typescript
section: generics-advanced
difficulty: advanced
tags:
  - TypeScript
  - conditional types
  - type programming
  - infer
status: imported
origin: old/src/content/docs/typescript/conditional-types.en.md
divergence: 0.246
issues: []
legacy:
  category: TypeScript
  subcategory: Advanced Types
  order: 13
  lastUpdated: 2026-01-07
---

Conditional types are one of the most powerful features in TypeScript's type system. They allow you to create types that depend on conditions, enabling sophisticated type-level programming and building flexible, type-safe abstractions.

## Introduction to Conditional Types

Conditional types select one of two possible types based on a condition expressed as a type relationship test. They work similarly to conditional expressions in JavaScript (`condition ? trueValue : falseValue`) but operate entirely at the type level.

### Why Conditional Types?

Without conditional types, you would need to create separate type definitions for every variation:

```typescript
// Without conditional types - verbose and repetitive
type StringArray = string[];
type NumberArray = number[];
type BooleanArray = boolean[];

// With conditional types - flexible and reusable
type ArrayOf<T> = T extends any ? T[] : never;

type StringArr = ArrayOf<string>;   // string[]
type NumberArr = ArrayOf<number>;   // number[]
type BooleanArr = ArrayOf<boolean>; // boolean[]
```

Conditional types enable:
- Type-level decision making based on type relationships
- Extraction of types from complex type structures
- Creation of flexible utility types that adapt to input types
- Building type-safe APIs with intelligent type inference

## Basic Syntax and Concepts

### The Extends Condition

The basic syntax of a conditional type is:

```typescript
T extends U ? X : Y
```

This reads as: "If type `T` is assignable to type `U`, the result is type `X`; otherwise, it's type `Y`."

```typescript
// Basic conditional type
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;    // true
type B = IsString<number>;    // false
type C = IsString<"hello">;   // true (literal types are subtypes)
type D = IsString<string[]>;  // false
```

### Type Relationships

The `extends` keyword in conditional types checks for type assignability:

```typescript
// Checking object structure
type HasName<T> = T extends { name: string } ? true : false;

type Test1 = HasName<{ name: string }>;                    // true
type Test2 = HasName<{ name: string; age: number }>;       // true (has name)
type Test3 = HasName<{ age: number }>;                     // false (no name)
type Test4 = HasName<{ name: number }>;                    // false (wrong type)

// Checking function signatures
type IsFunction<T> = T extends (...args: any[]) => any ? true : false;

type F1 = IsFunction<() => void>;           // true
type F2 = IsFunction<(x: number) => string>; // true
type F3 = IsFunction<string>;               // false
```

### Nested Conditional Types

You can nest conditional types for more complex logic:

```typescript
type TypeName<T> = T extends string
  ? "string"
  : T extends number
  ? "number"
  : T extends boolean
  ? "boolean"
  : T extends undefined
  ? "undefined"
  : T extends null
  ? "null"
  : T extends Function
  ? "function"
  : T extends Array<any>
  ? "array"
  : "object";

type T1 = TypeName<string>;       // "string"
type T2 = TypeName<42>;           // "number"
type T3 = TypeName<true>;         // "boolean"
type T4 = TypeName<undefined>;    // "undefined"
type T5 = TypeName<null>;         // "null"
type T6 = TypeName<() => void>;   // "function"
type T7 = TypeName<number[]>;     // "array"
type T8 = TypeName<{ a: 1 }>;     // "object"
```

### Constraining Type Parameters

Conditional types work well with generic constraints:

```typescript
type MessageOf<T> = T extends { message: unknown } ? T["message"] : never;

interface Email {
  message: string;
  recipient: string;
}

interface Log {
  timestamp: Date;
  level: string;
}

type EmailMessage = MessageOf<Email>; // string
type LogMessage = MessageOf<Log>;     // never

// More practical: extracting array element types
type Flatten<T> = T extends Array<infer Item> ? Item : T;

type Str = Flatten<string[]>;  // string
type Num = Flatten<number>;    // number
```

## The infer Keyword

The `infer` keyword is used within conditional types to declare type variables that are inferred from the condition. It allows you to extract and capture types from complex type structures.

### Basic Type Inference

```typescript
// Infer the return type of a function
type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;

function getString(): string {
  return "hello";
}

function getUser(): { id: number; name: string } {
  return { id: 1, name: "John" };
}

type StringReturn = ReturnTypeOf<typeof getString>;
// string

type UserReturn = ReturnTypeOf<typeof getUser>;
// { id: number; name: string }

// Infer parameter types
type ParametersOf<T> = T extends (...args: infer P) => any ? P : never;

function greet(name: string, age: number): void {}

type GreetParams = ParametersOf<typeof greet>;
// [name: string, age: number]
```

### Inferring from Complex Types

```typescript
// Extract element type from arrays
type ElementType<T> = T extends (infer E)[] ? E : never;

type NumberElement = ElementType<number[]>;        // number
type MixedElement = ElementType<(string | number)[]>; // string | number

// Extract Promise resolved type
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type ResolvedString = UnwrapPromise<Promise<string>>;  // string
type ResolvedNumber = UnwrapPromise<Promise<number>>;  // number
type NotPromise = UnwrapPromise<string>;               // string

// Deep unwrap nested Promises
type DeepUnwrapPromise<T> = T extends Promise<infer U>
  ? DeepUnwrapPromise<U>
  : T;

type Deep = DeepUnwrapPromise<Promise<Promise<Promise<number>>>>;
// number
```

### Inferring Multiple Types

You can use multiple `infer` declarations in a single conditional type:

```typescript
// Extract both parameter and return types
type FunctionInfo<T> = T extends (...args: infer P) => infer R
  ? { params: P; return: R }
  : never;

function process(input: string, count: number): boolean {
  return input.length > count;
}

type ProcessInfo = FunctionInfo<typeof process>;
// { params: [input: string, count: number]; return: boolean }

// Infer key-value from object entries
type ExtractEntry<T> = T extends [infer K, infer V]
  ? { key: K; value: V }
  : never;

type Entry = ExtractEntry<[string, number]>;
// { key: string; value: number }
```

### Inferring from Tuple Positions

```typescript
// Get first element of tuple
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;

type FirstElement = First<[1, 2, 3]>;  // 1
type FirstString = First<[string, number, boolean]>; // string

// Get last element of tuple
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

type LastElement = Last<[1, 2, 3]>;  // 3
type LastBool = Last<[string, number, boolean]>; // boolean

// Get all but first element (tail)
type Tail<T extends any[]> = T extends [any, ...infer Rest] ? Rest : never;

type TailElements = Tail<[1, 2, 3]>;  // [2, 3]

// Get all but last element (init)
type Init<T extends any[]> = T extends [...infer Init, any] ? Init : never;

type InitElements = Init<[1, 2, 3]>;  // [1, 2]
```

### Inferring Constructor Types

```typescript
// Extract constructor parameter types
type ConstructorParams<T extends new (...args: any) => any> =
  T extends new (...args: infer P) => any ? P : never;

// Extract instance type from constructor
type InstanceOf<T extends new (...args: any) => any> =
  T extends new (...args: any) => infer R ? R : never;

class Person {
  constructor(public name: string, public age: number) {}
}

type PersonParams = ConstructorParams<typeof Person>;
// [name: string, age: number]

type PersonInstance = InstanceOf<typeof Person>;
// Person
```

## Distributive Conditional Types

When conditional types act on a generic type, they become distributive when given a union type. This means the conditional type is applied to each member of the union individually.

### Understanding Distribution

```typescript
// Without distribution awareness
type ToArray<T> = T extends any ? T[] : never;

// When T is a union, it distributes:
type Result = ToArray<string | number>;
// Becomes: (string extends any ? string[] : never) | (number extends any ? number[] : never)
// Result: string[] | number[]

// Not: (string | number)[]
```

### Distribution in Action

```typescript
// Distributive: applies to each union member
type Nullable<T> = T extends any ? T | null : never;

type NullableStringOrNumber = Nullable<string | number>;
// string | null | number | null
// Simplified: string | number | null

// Filter types from union
type NonString<T> = T extends string ? never : T;

type Filtered = NonString<string | number | boolean>;
// number | boolean (string is filtered out)

// Extract specific types from union
type OnlyStrings<T> = T extends string ? T : never;

type StringsOnly = OnlyStrings<string | number | "hello" | 42>;
// string | "hello"
```

### Preventing Distribution

Sometimes you want to prevent distributive behavior. Wrap the type in a tuple:

```typescript
// Distributive version
type ToArrayDist<T> = T extends any ? T[] : never;

type Dist = ToArrayDist<string | number>;
// string[] | number[]

// Non-distributive version
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type NonDist = ToArrayNonDist<string | number>;
// (string | number)[]
```

### Practical Distribution Examples

```typescript
// Check if all union members extend a type
type AllExtend<T, U> = [T] extends [U] ? true : false;

type A1 = AllExtend<string | number, object>; // false
type A2 = AllExtend<"a" | "b", string>;       // true

// Distribute over object properties
type PropTypes<T> = T extends { [K in keyof T]: infer V } ? V : never;

interface Person {
  name: string;
  age: number;
  active: boolean;
}

type PersonPropTypes = PropTypes<Person>;
// string | number | boolean (union of all property types)
```

### Distribution with Mapped Types

```typescript
// Filter object properties by value type
type FilterByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

interface Mixed {
  name: string;
  age: number;
  active: boolean;
  score: number;
}

type StringProps = FilterByType<Mixed, string>;
// { name: string }

type NumberProps = FilterByType<Mixed, number>;
// { age: number; score: number }

type BooleanProps = FilterByType<Mixed, boolean>;
// { active: boolean }
```

## Built-in Conditional Utility Types

TypeScript provides several built-in utility types that use conditional types internally.

### Exclude and Extract

```typescript
// Exclude<T, U> - Remove types from T that are assignable to U
type Exclude<T, U> = T extends U ? never : T;

type T0 = Exclude<"a" | "b" | "c", "a">;
// "b" | "c"

type T1 = Exclude<string | number | boolean, boolean>;
// string | number

// Extract<T, U> - Keep only types from T that are assignable to U
type Extract<T, U> = T extends U ? T : never;

type T2 = Extract<"a" | "b" | "c", "a" | "f">;
// "a"

type T3 = Extract<string | number | (() => void), Function>;
// () => void
```

### NonNullable

```typescript
// NonNullable<T> - Remove null and undefined from T
type NonNullable<T> = T extends null | undefined ? never : T;

type T0 = NonNullable<string | null | undefined>;
// string

type T1 = NonNullable<number | null>;
// number

type T2 = NonNullable<boolean | undefined>;
// boolean

// Practical usage
function processValue<T>(value: T): NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error("Value cannot be null or undefined");
  }
  return value as NonNullable<T>;
}
```

### ReturnType and Parameters

```typescript
// ReturnType<T> - Extract return type of function
type ReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : any;

function createUser() {
  return { id: 1, name: "John", email: "john@example.com" };
}

type User = ReturnType<typeof createUser>;
// { id: number; name: string; email: string }

// Parameters<T> - Extract parameter types as tuple
type Parameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;

function register(name: string, age: number, email: string): void {}

type RegisterParams = Parameters<typeof register>;
// [name: string, age: number, email: string]
```

### ConstructorParameters and InstanceType

```typescript
// ConstructorParameters<T> - Extract constructor parameters
type ConstructorParameters<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: infer P) => any ? P : never;

// InstanceType<T> - Extract instance type from constructor
type InstanceType<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: any) => infer R ? R : any;

class HttpClient {
  constructor(
    private baseUrl: string,
    private timeout: number
  ) {}
}

type HttpClientParams = ConstructorParameters<typeof HttpClient>;
// [baseUrl: string, timeout: number]

type HttpClientInstance = InstanceType<typeof HttpClient>;
// HttpClient
```

### ThisParameterType and OmitThisParameter

```typescript
// ThisParameterType<T> - Extract 'this' parameter type
type ThisParameterType<T> =
  T extends (this: infer U, ...args: any[]) => any ? U : unknown;

function greet(this: { name: string }): string {
  return `Hello, ${this.name}!`;
}

type GreetThis = ThisParameterType<typeof greet>;
// { name: string }

// OmitThisParameter<T> - Remove 'this' parameter
type OmitThisParameter<T> = unknown extends ThisParameterType<T>
  ? T
  : T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T;

type GreetWithoutThis = OmitThisParameter<typeof greet>;
// () => string
```

## Advanced Patterns

### Conditional Type Chains

```typescript
// Complex type selection based on multiple conditions
type DeepReadonly<T> = T extends Function
  ? T
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

interface NestedObject {
  name: string;
  config: {
    debug: boolean;
    settings: {
      timeout: number;
    };
  };
  callback: () => void;
}

type ReadonlyNested = DeepReadonly<NestedObject>;
// All properties (except functions) are recursively readonly
```

### Template Literal Types with Conditionals

```typescript
// Extract route parameters from path strings
type ExtractRouteParams<T extends string> =
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParams<`/${Rest}`>
    : T extends `${infer _Start}:${infer Param}`
    ? Param
    : never;

type RouteParams = ExtractRouteParams<"/users/:userId/posts/:postId">;
// "userId" | "postId"

type ProfileParams = ExtractRouteParams<"/profile/:username">;
// "username"

// Build params object type
type ParamsObject<T extends string> = {
  [K in ExtractRouteParams<T>]: string;
};

type UserPostParams = ParamsObject<"/users/:userId/posts/:postId">;
// { userId: string; postId: string }
```

### Type-Level Pattern Matching

```typescript
// Match specific patterns in types
type MatchResult<Pattern, T> = T extends Pattern ? T : never;

type StringOrNumber = MatchResult<string | number, "hello">;
// "hello"

type NoMatch = MatchResult<boolean, "hello">;
// never

// Match function patterns
type MatchAsyncFunction<T> = T extends (...args: any[]) => Promise<infer R>
  ? { async: true; returnType: R }
  : T extends (...args: any[]) => infer R
  ? { async: false; returnType: R }
  : never;

async function fetchData(): Promise<string[]> {
  return [];
}

function processData(): number {
  return 42;
}

type AsyncMatch = MatchAsyncFunction<typeof fetchData>;
// { async: true; returnType: string[] }

type SyncMatch = MatchAsyncFunction<typeof processData>;
// { async: false; returnType: number }
```

### Variadic Tuple Manipulation

```typescript
// Concatenate tuples
type Concat<T extends any[], U extends any[]> = [...T, ...U];

type Merged = Concat<[1, 2], [3, 4]>;
// [1, 2, 3, 4]

// Prepend element to tuple
type Prepend<T, U extends any[]> = [T, ...U];

type WithFirst = Prepend<0, [1, 2, 3]>;
// [0, 1, 2, 3]

// Reverse tuple
type Reverse<T extends any[]> = T extends [infer First, ...infer Rest]
  ? [...Reverse<Rest>, First]
  : [];

type Reversed = Reverse<[1, 2, 3, 4]>;
// [4, 3, 2, 1]

// Filter tuple by type
type FilterTuple<T extends any[], U> = T extends [infer First, ...infer Rest]
  ? First extends U
    ? [First, ...FilterTuple<Rest, U>]
    : FilterTuple<Rest, U>
  : [];

type OnlyNumbers = FilterTuple<[1, "a", 2, "b", 3], number>;
// [1, 2, 3]
```

## Recursive Conditional Types

TypeScript supports recursive conditional types, enabling complex type transformations.

### Deep Object Transformation

```typescript
// Deep Partial - make all nested properties optional
type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

// Deep Required - make all nested properties required
type DeepRequired<T> = T extends Function
  ? T
  : T extends object
  ? { [K in keyof T]-?: DeepRequired<T[K]> }
  : T;

// Deep Nullable - add null to all nested properties
type DeepNullable<T> = T extends Function
  ? T
  : T extends object
  ? { [K in keyof T]: DeepNullable<T[K]> | null }
  : T | null;

interface Config {
  server: {
    host: string;
    port: number;
    ssl: {
      enabled: boolean;
      cert?: string;
    };
  };
}

type PartialConfig = DeepPartial<Config>;
// All properties at all levels are optional

type RequiredConfig = DeepRequired<Config>;
// All properties at all levels are required (including cert)
```

### Array Type Recursion

```typescript
// Flatten nested arrays
type FlattenArray<T> = T extends (infer U)[]
  ? FlattenArray<U>
  : T;

type Nested = number[][][];
type Flat = FlattenArray<Nested>;
// number

// Flatten to specific depth
type FlattenDepth<T, Depth extends number, Acc extends any[] = []> =
  Acc["length"] extends Depth
    ? T
    : T extends (infer U)[]
    ? FlattenDepth<U, Depth, [any, ...Acc]>
    : T;

type NestedArr = string[][][][][];
type Flat2 = FlattenDepth<NestedArr, 2>;
// string[][][]
```

### String Type Recursion

```typescript
// Split string into tuple
type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}`
    ? [Head, ...Split<Tail, D>]
    : S extends ""
    ? []
    : [S];

type Parts = Split<"a.b.c.d", ".">;
// ["a", "b", "c", "d"]

// Join tuple into string
type Join<T extends string[], D extends string> =
  T extends []
    ? ""
    : T extends [infer F extends string]
    ? F
    : T extends [infer F extends string, ...infer R extends string[]]
    ? `${F}${D}${Join<R, D>}`
    : never;

type Joined = Join<["a", "b", "c"], "-">;
// "a-b-c"

// Replace all occurrences
type ReplaceAll<
  S extends string,
  From extends string,
  To extends string
> = From extends ""
  ? S
  : S extends `${infer Head}${From}${infer Tail}`
  ? `${Head}${To}${ReplaceAll<Tail, From, To>}`
  : S;

type Replaced = ReplaceAll<"hello-world-foo", "-", "_">;
// "hello_world_foo"
```

### Object Path Types

```typescript
// Generate all possible paths in an object
type Paths<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? Paths<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
          : `${Prefix}${K}`
        : never;
    }[keyof T]
  : never;

interface AppState {
  user: {
    profile: {
      name: string;
      avatar: string;
    };
    settings: {
      theme: string;
    };
  };
  data: {
    items: string[];
  };
}

type StatePaths = Paths<AppState>;
// "user" | "user.profile" | "user.profile.name" | "user.profile.avatar" |
// "user.settings" | "user.settings.theme" | "data" | "data.items"

// Get value type at path
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
  ? T[P]
  : never;

type ThemeType = PathValue<AppState, "user.settings.theme">;
// string
```

## Practical Applications

### Type-Safe Event Emitter

```typescript
type EventMap = Record<string, any>;

interface TypedEmitter<Events extends EventMap> {
  on<K extends keyof Events>(
    event: K,
    listener: (payload: Events[K]) => void
  ): void;

  off<K extends keyof Events>(
    event: K,
    listener: (payload: Events[K]) => void
  ): void;

  emit<K extends keyof Events>(event: K, payload: Events[K]): void;
}

// Define events
interface AppEvents {
  login: { userId: string; timestamp: Date };
  logout: { userId: string };
  error: { code: number; message: string };
  dataLoaded: { items: unknown[]; total: number };
}

// Usage
declare const emitter: TypedEmitter<AppEvents>;

emitter.on("login", (payload) => {
  // payload is { userId: string; timestamp: Date }
  console.log(`User ${payload.userId} logged in at ${payload.timestamp}`);
});

emitter.emit("login", {
  userId: "123",
  timestamp: new Date(),
});

// Type error examples:
// emitter.emit("login", { userId: 123 }); // Error: userId should be string
// emitter.emit("unknown", {}); // Error: "unknown" is not in AppEvents
```

### API Response Handler

```typescript
type ApiResponse<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: string; code: number }
  | { status: "loading" };

type ExtractData<T> = T extends { status: "success"; data: infer D } ? D : never;

type ExtractError<T> = T extends { status: "error"; error: infer E } ? E : never;

type IsLoading<T> = T extends { status: "loading" } ? true : false;

// Response handlers
function handleResponse<T>(response: ApiResponse<T>): T | null {
  if (response.status === "success") {
    return response.data;
  }
  return null;
}

// Create typed API functions
type ApiFunction<Params, Result> = (params: Params) => Promise<ApiResponse<Result>>;

interface User {
  id: number;
  name: string;
  email: string;
}

type GetUserApi = ApiFunction<{ userId: number }, User>;
type GetUsersApi = ApiFunction<{ page: number }, User[]>;

declare const getUser: GetUserApi;
declare const getUsers: GetUsersApi;

// Usage
async function fetchUserData(userId: number) {
  const response = await getUser({ userId });
  const userData = handleResponse(response);
  // userData is User | null
}
```

### Form Validation Types

```typescript
type ValidationRule<T> = {
  validate: (value: T) => boolean;
  message: string;
};

type FieldConfig<T> = {
  initialValue: T;
  rules?: ValidationRule<T>[];
};

type FormConfig<T extends Record<string, any>> = {
  [K in keyof T]: FieldConfig<T[K]>;
};

type FormValues<T extends FormConfig<any>> = {
  [K in keyof T]: T[K]["initialValue"];
};

type FormErrors<T extends FormConfig<any>> = {
  [K in keyof T]?: string;
};

// Define form configuration
interface LoginForm {
  username: string;
  password: string;
  rememberMe: boolean;
}

const loginFormConfig: FormConfig<LoginForm> = {
  username: {
    initialValue: "",
    rules: [
      { validate: (v) => v.length > 0, message: "Username is required" },
      { validate: (v) => v.length >= 3, message: "Username too short" },
    ],
  },
  password: {
    initialValue: "",
    rules: [
      { validate: (v) => v.length >= 8, message: "Password must be 8+ chars" },
    ],
  },
  rememberMe: {
    initialValue: false,
  },
};

// Inferred types
type LoginFormValues = FormValues<typeof loginFormConfig>;
// { username: string; password: string; rememberMe: boolean }

type LoginFormErrors = FormErrors<typeof loginFormConfig>;
// { username?: string; password?: string; rememberMe?: string }
```

### Redux-Style Action Handlers

```typescript
type Action<Type extends string, Payload = void> = Payload extends void
  ? { type: Type }
  : { type: Type; payload: Payload };

type ActionCreator<A extends Action<string, any>> = A extends Action<
  infer T,
  infer P
>
  ? P extends void
    ? () => A
    : (payload: P) => A
  : never;

type ActionHandlers<State, Actions extends Action<string, any>> = {
  [A in Actions as A["type"]]: A extends Action<any, infer P>
    ? P extends void
      ? (state: State) => State
      : (state: State, payload: P) => State
    : never;
};

// Define actions
type IncrementAction = Action<"INCREMENT">;
type DecrementAction = Action<"DECREMENT">;
type SetValueAction = Action<"SET_VALUE", number>;
type ResetAction = Action<"RESET", { value: number }>;

type CounterActions =
  | IncrementAction
  | DecrementAction
  | SetValueAction
  | ResetAction;

interface CounterState {
  count: number;
}

// Type-safe handlers
const handlers: ActionHandlers<CounterState, CounterActions> = {
  INCREMENT: (state) => ({ count: state.count + 1 }),
  DECREMENT: (state) => ({ count: state.count - 1 }),
  SET_VALUE: (state, value) => ({ count: value }),
  RESET: (state, payload) => ({ count: payload.value }),
};
```

### Type-Safe Query Builder

```typescript
type Comparator = "=" | "!=" | ">" | "<" | ">=" | "<=" | "LIKE";

type WhereClause<T, K extends keyof T> = {
  field: K;
  operator: Comparator;
  value: T[K];
};

type OrderDirection = "ASC" | "DESC";

type OrderClause<T> = {
  field: keyof T;
  direction: OrderDirection;
};

interface QueryBuilder<T, Selected extends keyof T = keyof T> {
  select<K extends keyof T>(...fields: K[]): QueryBuilder<T, K>;

  where<K extends keyof T>(
    field: K,
    operator: Comparator,
    value: T[K]
  ): QueryBuilder<T, Selected>;

  orderBy(
    field: Selected,
    direction?: OrderDirection
  ): QueryBuilder<T, Selected>;

  limit(count: number): QueryBuilder<T, Selected>;

  execute(): Promise<Pick<T, Selected>[]>;
}

// Usage example
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

declare function createQuery<T>(): QueryBuilder<T>;

const query = createQuery<Product>()
  .select("id", "name", "price")
  .where("category", "=", "electronics")
  .where("price", "<", 1000)
  .orderBy("price", "DESC")
  .limit(10);

// Result type: { id: number; name: string; price: number }[]
```

## Best Practices

### Keep Conditional Types Readable

```typescript
// Bad: Complex nested conditional in one line
type Bad<T> = T extends string ? "s" : T extends number ? "n" : T extends boolean ? "b" : "o";

// Good: Use intermediate types or multi-line formatting
type TypeCode<T> = T extends string
  ? "string"
  : T extends number
  ? "number"
  : T extends boolean
  ? "boolean"
  : "object";
```

### Use Descriptive Type Parameter Names

```typescript
// Bad: Single letters for complex types
type Bad<T, U, V> = T extends U ? V : never;

// Good: Descriptive names
type ExtractIfAssignable<Type, AssignableTo, ResultType> =
  Type extends AssignableTo ? ResultType : never;
```

### Document Complex Conditional Types

```typescript
/**
 * Extracts the element type from an array type.
 * If T is not an array, returns T unchanged.
 *
 * @template T - The type to extract from
 * @example
 * type Num = ArrayElement<number[]>; // number
 * type Str = ArrayElement<string>;   // string
 */
type ArrayElement<T> = T extends (infer E)[] ? E : T;
```

### Avoid Excessive Recursion

```typescript
// Be mindful of TypeScript's recursion limits
// TypeScript may fail with deeply recursive types

// Consider limiting depth
type DeepReadonlyWithLimit<T, Depth extends number = 10> =
  Depth extends 0
    ? T
    : T extends object
    ? { readonly [K in keyof T]: DeepReadonlyWithLimit<T[K], Decrement[Depth]> }
    : T;

type Decrement = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
```

### Test Edge Cases

```typescript
// Always test with edge cases
type MyType<T> = T extends string ? "string" : "other";

// Test cases
type Test1 = MyType<string>;     // "string"
type Test2 = MyType<"literal">;  // "string" (string literal)
type Test3 = MyType<never>;      // never (special case)
type Test4 = MyType<any>;        // "string" | "other" (distributes)
type Test5 = MyType<unknown>;    // "other"
```

### Prefer Built-in Utility Types

```typescript
// Bad: Reinventing the wheel
type MyNonNullable<T> = T extends null | undefined ? never : T;

// Good: Use built-in types
type Better<T> = NonNullable<T>;

// Custom types should extend or combine built-ins when possible
type DeepNonNullable<T> = T extends object
  ? { [K in keyof T]: DeepNonNullable<NonNullable<T[K]>> }
  : NonNullable<T>;
```

## Conclusion

Conditional types are a cornerstone of advanced TypeScript programming. They enable powerful type-level computations that can:

- Extract types from complex structures using `infer`
- Transform types based on conditions
- Create flexible utility types that adapt to input
- Build type-safe APIs with intelligent inference

Key takeaways:

- Use `T extends U ? X : Y` syntax for type-level conditionals
- The `infer` keyword extracts types from patterns
- Distributive behavior applies conditional logic to each union member
- Wrap in tuples `[T]` to prevent distribution when needed
- Recursive conditional types enable deep transformations
- Built-in utility types leverage conditionals internally
- Balance expressiveness with readability

With conditional types, you can encode complex business logic directly in types and catch errors at compile time rather than runtime.
