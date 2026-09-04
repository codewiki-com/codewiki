---
title: Advanced TypeScript Type Programming
description: Master TypeScript advanced types for type-safe applications
track: typescript
section: generics-advanced
difficulty: advanced
tags:
  - TypeScript
  - Type Programming
  - Generics
  - Type Gymnastics
status: imported
origin: old/src/content/docs/frontend/typescript-advanced.en.md
divergence: 0.238
issues: []
legacy:
  category: Frontend
  subcategory: TypeScript
  order: 9
  lastUpdated: 2026-01-07
---

TypeScript's type system is Turing complete, meaning we can perform complex computations and logical operations at the type level. Mastering advanced type programming techniques enables you to build more type-safe, maintainable applications. We explore advanced type techniques in TypeScript, including conditional types, mapped types, template literal types, and more.

## Conditional Types

Conditional types are one of the most powerful features in TypeScript's type system. They allow you to dynamically select types based on type relationships.

### Basic Syntax

The syntax for conditional types resembles JavaScript's ternary expression:

```typescript
type ConditionalType<T> = T extends U ? X : Y;
```

If type `T` is assignable to type `U`, the result is type `X`; otherwise, it's type `Y`.

```typescript
// Basic example: Check if type is a string
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false
type C = IsString<"hello">; // true (literal types extend string)

// More practical example: Type filtering
type NonNullable<T> = T extends null | undefined ? never : T;

type Result = NonNullable<string | null | undefined>; // string
```

### Distributive Conditional Types

When a conditional type acts on a union type, it automatically distributes over each member of the union:

```typescript
type ToArray<T> = T extends any ? T[] : never;

// Distributive calculation process:
// ToArray<string | number>
// = (string extends any ? string[] : never) | (number extends any ? number[] : never)
// = string[] | number[]

type StrOrNumArray = ToArray<string | number>; // string[] | number[]

// To avoid distributive behavior, wrap in brackets
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type StrOrNumArrayNonDist = ToArrayNonDist<string | number>; // (string | number)[]
```

### Nested Conditional Types

Conditional types can be nested to implement complex type logic:

```typescript
type TypeName<T> = T extends string
  ? "string"
  : T extends number
    ? "number"
    : T extends boolean
      ? "boolean"
      : T extends undefined
        ? "undefined"
        : T extends Function
          ? "function"
          : "object";

type T1 = TypeName<string>;     // "string"
type T2 = TypeName<() => void>; // "function"
type T3 = TypeName<string[]>;   // "object"
```

## The infer Keyword

The `infer` keyword is used to declare a type variable to be inferred within conditional types. It can only be used in the `extends` clause, allowing you to extract specific parts from complex types.

### Basic Usage

```typescript
// Get array element type
type ElementType<T> = T extends (infer E)[] ? E : never;

type NumElement = ElementType<number[]>;   // number
type StrElement = ElementType<string[]>;   // string
type MixedElement = ElementType<(string | number)[]>; // string | number

// Get function return type (ReturnType implementation)
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function createUser() {
  return { id: 1, name: "Tom", active: true };
}

type UserType = MyReturnType<typeof createUser>;
// { id: number; name: string; active: boolean; }

// Get function parameter types (Parameters implementation)
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;

type Params = MyParameters<(a: string, b: number) => void>; // [a: string, b: number]
```

### Advanced infer Applications

```typescript
// Extract Promise inner type
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type Resolved = UnwrapPromise<Promise<string>>; // string
type NotPromise = UnwrapPromise<number>;        // number

// Recursively unwrap nested Promises
type DeepUnwrapPromise<T> = T extends Promise<infer U>
  ? DeepUnwrapPromise<U>
  : T;

type Deep = DeepUnwrapPromise<Promise<Promise<Promise<number>>>>; // number

// Get first parameter type
type FirstArg<T> = T extends (first: infer F, ...rest: any[]) => any ? F : never;

type First = FirstArg<(name: string, age: number) => void>; // string

// Get last parameter type
type LastArg<T> = T extends (...args: [...infer _, infer L]) => any ? L : never;

type Last = LastArg<(a: string, b: number, c: boolean) => void>; // boolean

// Extract constructor instance type
type InstanceType<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: any) => infer R ? R : any;

class Person {
  constructor(public name: string) {}
}

type PersonInstance = InstanceType<typeof Person>; // Person
```

### Multiple infer Positions

A single conditional type can use multiple `infer` declarations:

```typescript
// Extract both function parameters and return type
type FunctionInfo<T> = T extends (...args: infer A) => infer R
  ? { args: A; return: R }
  : never;

type Info = FunctionInfo<(x: number, y: string) => boolean>;
// { args: [x: number, y: string]; return: boolean }

// Extract object key-value types
type ExtractKeyValue<T> = T extends { [K in infer Key]: infer Value }
  ? { keys: Key; values: Value }
  : never;
```

## Mapped Types

Mapped types allow you to create new types based on existing types by transforming the type structure through key iteration.

### Basic Mapped Types

```typescript
// Basic syntax
type MappedType<T> = {
  [K in keyof T]: T[K];
};

// Make all properties optional (Partial implementation)
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// Make all properties required (Required implementation)
type MyRequired<T> = {
  [K in keyof T]-?: T[K];
};

// Make all properties readonly (Readonly implementation)
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

// Remove readonly modifier
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

interface User {
  readonly id: number;
  name: string;
  email?: string;
}

type MutableUser = Mutable<User>;
// { id: number; name: string; email?: string; }
```

### Key Remapping

TypeScript 4.1 introduced key remapping, using the `as` clause to transform keys during mapping:

```typescript
// Add prefix to all keys
type Prefixed<T, P extends string> = {
  [K in keyof T as `${P}${string & K}`]: T[K];
};

interface Person {
  name: string;
  age: number;
}

type PrefixedPerson = Prefixed<Person, "person_">;
// { person_name: string; person_age: number; }

// Filter keys by value type
type FilterByValueType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? K : never]: T[K];
};

interface Mixed {
  name: string;
  age: number;
  active: boolean;
  score: number;
}

type NumberProps = FilterByValueType<Mixed, number>;
// { age: number; score: number; }

// Extract all methods
type Methods<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

// Convert all property names to uppercase
type UppercaseKeys<T> = {
  [K in keyof T as Uppercase<string & K>]: T[K];
};

type UpperPerson = UppercaseKeys<Person>;
// { NAME: string; AGE: number; }
```

### Deep Mapped Types

```typescript
// Deep readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

// Deep partial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};

interface NestedConfig {
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
  };
}

type ReadonlyConfig = DeepReadonly<NestedConfig>;
type PartialConfig = DeepPartial<NestedConfig>;
```

## Template Literal Types

TypeScript 4.1 introduced template literal types, enabling string manipulation at the type level.

### Basic Usage

```typescript
// Basic template literal type
type Greeting = `Hello, ${string}!`;

const g1: Greeting = "Hello, World!"; // OK
const g2: Greeting = "Hello, TypeScript!"; // OK
// const g3: Greeting = "Hi, World!"; // Error

// Union type combinations
type Size = "small" | "medium" | "large";
type Color = "red" | "blue" | "green";

type SizeColor = `${Size}-${Color}`;
// "small-red" | "small-blue" | "small-green" |
// "medium-red" | "medium-blue" | "medium-green" |
// "large-red" | "large-blue" | "large-green"

// Event name types
type EventName<T extends string> = `on${Capitalize<T>}`;

type ClickEvent = EventName<"click">; // "onClick"
type MouseMoveEvent = EventName<"mouseMove">; // "onMouseMove"
```

### Built-in String Manipulation Types

TypeScript provides four built-in string manipulation types:

```typescript
// Uppercase<S> - Convert to uppercase
type Upper = Uppercase<"hello">; // "HELLO"

// Lowercase<S> - Convert to lowercase
type Lower = Lowercase<"HELLO">; // "hello"

// Capitalize<S> - Capitalize first letter
type Cap = Capitalize<"hello">; // "Hello"

// Uncapitalize<S> - Uncapitalize first letter
type Uncap = Uncapitalize<"Hello">; // "hello"
```

### String Type Inference

Combining `infer` with template literal types enables complex string parsing:

```typescript
// Extract specific parts from strings
type ExtractRouteParams<T extends string> =
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParams<`/${Rest}`>
    : T extends `${infer _Start}:${infer Param}`
      ? Param
      : never;

type Params = ExtractRouteParams<"/users/:userId/posts/:postId">;
// "userId" | "postId"

// CamelCase conversion
type CamelCase<S extends string> =
  S extends `${infer First}_${infer Rest}`
    ? `${Lowercase<First>}${Capitalize<CamelCase<Rest>>}`
    : Lowercase<S>;

type Camel = CamelCase<"hello_world_foo_bar">; // "helloWorldFooBar"

// kebab-case conversion
type KebabCase<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? First extends Uppercase<First>
      ? `-${Lowercase<First>}${KebabCase<Rest>}`
      : `${First}${KebabCase<Rest>}`
    : S;

type Kebab = KebabCase<"backgroundColor">; // "-background-color" (needs extra handling for first char)

// String splitting
type Split<S extends string, D extends string> =
  S extends `${infer First}${D}${infer Rest}`
    ? [First, ...Split<Rest, D>]
    : S extends ""
      ? []
      : [S];

type Parts = Split<"a-b-c", "-">; // ["a", "b", "c"]
```

### Practical Application: Type-Safe Routing System

```typescript
// Route parameter extraction and validation
type ExtractParams<Path extends string> =
  Path extends `${infer _}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractParams<`/${Rest}`>]: string }
    : Path extends `${infer _}:${infer Param}`
      ? { [K in Param]: string }
      : {};

type UserRouteParams = ExtractParams<"/users/:userId/posts/:postId">;
// { userId: string; postId: string }

function navigate<Path extends string>(
  path: Path,
  params: ExtractParams<Path>
): void {
  // Implement navigation logic
}

navigate("/users/:userId/posts/:postId", {
  userId: "123",
  postId: "456"
}); // OK

// navigate("/users/:userId", { postId: "456" }); // Error: missing userId
```

## Built-in Utility Types Deep Dive

TypeScript provides rich built-in utility types. Understanding their implementation helps you write more advanced types.

### Property Manipulation Types

```typescript
// Pick<T, K> - Select specific properties
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit<T, K> - Exclude specific properties
type MyOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

// Practical usage
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

type PublicUser = Omit<User, "password">; // Exclude sensitive information
type UserCredentials = Pick<User, "email" | "password">; // Login credentials
```

### Union Type Operations

```typescript
// Exclude<T, U> - Remove types from T that are assignable to U
type MyExclude<T, U> = T extends U ? never : T;

type T1 = Exclude<"a" | "b" | "c", "a" | "b">; // "c"

// Extract<T, U> - Keep types from T that are assignable to U
type MyExtract<T, U> = T extends U ? T : never;

type T2 = Extract<"a" | "b" | "c", "a" | "f">; // "a"

// NonNullable<T> - Remove null and undefined
type MyNonNullable<T> = T extends null | undefined ? never : T;

type T3 = NonNullable<string | null | undefined>; // string
```

### Function-Related Types

```typescript
// ReturnType<T> - Get function return type
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : any;

// Parameters<T> - Get function parameter types as tuple
type MyParameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;

// ConstructorParameters<T> - Get constructor parameter types
type MyConstructorParameters<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: infer P) => any ? P : never;

// ThisParameterType<T> - Get function's this parameter type
type MyThisParameterType<T> =
  T extends (this: infer U, ...args: any[]) => any ? U : unknown;

// OmitThisParameter<T> - Remove function's this parameter
type MyOmitThisParameter<T> =
  T extends (this: any, ...args: infer A) => infer R
    ? (...args: A) => R
    : T;
```

### Record and Index Signatures

```typescript
// Record<K, T> - Create object type with specified key and value types
type MyRecord<K extends keyof any, T> = {
  [P in K]: T;
};

// Application example: State management
type LoadingState = "idle" | "loading" | "success" | "error";

type StateHandlers = Record<LoadingState, () => void>;

const handlers: StateHandlers = {
  idle: () => console.log("Idle"),
  loading: () => console.log("Loading..."),
  success: () => console.log("Success!"),
  error: () => console.log("Error occurred"),
};

// Type-checked object mapping
type PageRoutes = Record<
  "home" | "about" | "contact",
  { path: string; component: React.ComponentType }
>;
```

## Type Guards and Type Narrowing

Type guards are runtime checks used to narrow types to more specific ones.

### Built-in Type Guards

```typescript
function processValue(value: string | number | null) {
  // typeof type guard
  if (typeof value === "string") {
    console.log(value.toUpperCase()); // value: string
  } else if (typeof value === "number") {
    console.log(value.toFixed(2)); // value: number
  } else {
    console.log("Value is null"); // value: null
  }
}

// instanceof type guard
class Dog {
  bark() {
    console.log("Woof!");
  }
}

class Cat {
  meow() {
    console.log("Meow!");
  }
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark(); // animal: Dog
  } else {
    animal.meow(); // animal: Cat
  }
}

// in operator type guard
interface Fish {
  swim: () => void;
}

interface Bird {
  fly: () => void;
}

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    animal.swim(); // animal: Fish
  } else {
    animal.fly(); // animal: Bird
  }
}
```

### Custom Type Guards

Use the `is` keyword to create custom type guard functions:

```typescript
// Basic custom type guard
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function processUnknown(value: unknown) {
  if (isString(value)) {
    console.log(value.toUpperCase()); // value: string
  }
}

// Complex object type guard
interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error: string;
}

type ApiResponse<T> = ApiSuccess<T> | ApiError;

function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return response.success === true;
}

async function fetchUser(): Promise<ApiResponse<User>> {
  // Simulate API call
  return { success: true, data: { id: 1, name: "Tom", email: "tom@example.com" } };
}

async function handleUserFetch() {
  const response = await fetchUser();
  if (isApiSuccess(response)) {
    console.log(response.data.name); // Type-safe access
  } else {
    console.error(response.error);
  }
}

// Array type guard
function isArrayOfStrings(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

// Discriminated Union
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
  }
}
```

### Assertion Functions

TypeScript 3.7 introduced assertion functions, which perform runtime checks and throw errors if the check fails:

```typescript
// Assertion function signature uses the asserts keyword
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error("Value must be a string");
  }
}

function assertNonNull<T>(value: T): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error("Value cannot be null or undefined");
  }
}

function processData(data: unknown) {
  assertIsString(data);
  // After this point, data is typed as string
  console.log(data.toUpperCase());
}

// Assertion with condition
function assertIsDefined<T>(
  value: T,
  message?: string
): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(message ?? "Value is not defined");
  }
}
```

## Declaration Merging

TypeScript supports declaration merging, allowing you to combine multiple declarations with the same name into a single definition.

### Interface Merging

```typescript
// Same-named interfaces automatically merge
interface User {
  id: number;
  name: string;
}

interface User {
  email: string;
  createdAt: Date;
}

// Merged User interface
const user: User = {
  id: 1,
  name: "Tom",
  email: "tom@example.com",
  createdAt: new Date(),
};

// Function overload merging
interface Document {
  createElement(tagName: "div"): HTMLDivElement;
  createElement(tagName: "span"): HTMLSpanElement;
}

interface Document {
  createElement(tagName: "canvas"): HTMLCanvasElement;
  createElement(tagName: string): HTMLElement;
}

// Note: Later-declared overloads come first (except for string literal overloads)
```

### Namespace Merging with Classes/Functions/Enums

```typescript
// Add static members to a class
class Album {
  label: Album.AlbumLabel | undefined;
}

namespace Album {
  export interface AlbumLabel {
    name: string;
    color: string;
  }

  export function createDefault(): Album {
    return new Album();
  }
}

const album = Album.createDefault();

// Add properties to a function
function buildName(firstName: string, lastName?: string) {
  return firstName + (lastName ? " " + lastName : "");
}

namespace buildName {
  export const defaultLastName = "Smith";
  export function withDefault(firstName: string) {
    return buildName(firstName, defaultLastName);
  }
}

console.log(buildName.withDefault("John")); // "John Smith"

// Add functions to an enum
enum Color {
  Red = 1,
  Green = 2,
  Blue = 4,
}

namespace Color {
  export function mixColors(c1: Color, c2: Color): Color {
    return c1 | c2;
  }
}

const purple = Color.mixColors(Color.Red, Color.Blue);
```

## Module Augmentation

Module augmentation allows you to extend type definitions of third-party modules.

### Extending Third-Party Library Types

```typescript
// Assuming we're using express
// Extend Express's Request interface

// types/express.d.ts
import "express";

declare module "express" {
  interface Request {
    user?: {
      id: string;
      role: string;
    };
    sessionId?: string;
  }
}

// Now you can use extended properties in your code
import express from "express";

const app = express();

app.use((req, res, next) => {
  // TypeScript now recognizes req.user
  if (req.user) {
    console.log(req.user.id);
  }
  next();
});
```

### Global Module Augmentation

```typescript
// Extend global objects
declare global {
  interface Window {
    myApp: {
      version: string;
      debug: boolean;
    };
  }

  interface Array<T> {
    customMethod(): T[];
  }
}

// Implement the extended method
Array.prototype.customMethod = function () {
  return [...this];
};

// Usage
window.myApp = { version: "1.0.0", debug: true };
const arr = [1, 2, 3].customMethod();
```

### Extending Vue/React Types

```typescript
// Extend Vue component options
// types/vue.d.ts
import "vue";

declare module "vue" {
  interface ComponentCustomOptions {
    permissions?: string[];
  }

  interface ComponentCustomProperties {
    $api: typeof import("@/api").default;
  }
}

// Extend React types
// types/react.d.ts
import "react";

declare module "react" {
  interface CSSProperties {
    "--custom-property"?: string;
    [key: `--${string}`]: string | number | undefined;
  }
}
```

## Type Gymnastics in Practice

Type gymnastics refers to performing complex computations and operations at the type level. Some classic examples follow.

### Tuple Operations

```typescript
// Tuple to union type
type TupleToUnion<T extends readonly any[]> = T[number];

type Union = TupleToUnion<["a", "b", "c"]>; // "a" | "b" | "c"

// Tuple length
type Length<T extends readonly any[]> = T["length"];

type Len = Length<[1, 2, 3, 4, 5]>; // 5

// First element of tuple
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;

type F = First<[1, 2, 3]>; // 1

// Last element of tuple
type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

type L = Last<[1, 2, 3]>; // 3

// Tuple Push
type Push<T extends any[], E> = [...T, E];

type Pushed = Push<[1, 2], 3>; // [1, 2, 3]

// Tuple Pop
type Pop<T extends any[]> = T extends [...infer R, any] ? R : never;

type Popped = Pop<[1, 2, 3]>; // [1, 2]

// Tuple Reverse
type Reverse<T extends any[]> = T extends [infer F, ...infer R]
  ? [...Reverse<R>, F]
  : [];

type Reversed = Reverse<[1, 2, 3]>; // [3, 2, 1]
```

### String Operations

```typescript
// String length (by converting to tuple)
type StringLength<S extends string> = Split<S, "">["length"];

type StrLen = StringLength<"hello">; // 5

// String replace
type Replace<
  S extends string,
  From extends string,
  To extends string
> = From extends ""
  ? S
  : S extends `${infer F}${From}${infer R}`
    ? `${F}${To}${R}`
    : S;

type Replaced = Replace<"hello world", "world", "TypeScript">;
// "hello TypeScript"

// Global replace
type ReplaceAll<
  S extends string,
  From extends string,
  To extends string
> = From extends ""
  ? S
  : S extends `${infer F}${From}${infer R}`
    ? ReplaceAll<`${F}${To}${R}`, From, To>
    : S;

type ReplacedAll = ReplaceAll<"a-b-c-d", "-", "_">; // "a_b_c_d"

// Trim whitespace
type TrimLeft<S extends string> = S extends `${" " | "\n" | "\t"}${infer R}`
  ? TrimLeft<R>
  : S;

type TrimRight<S extends string> = S extends `${infer L}${" " | "\n" | "\t"}`
  ? TrimRight<L>
  : S;

type Trim<S extends string> = TrimRight<TrimLeft<S>>;

type Trimmed = Trim<"  hello world  ">; // "hello world"
```

### Object Operations

```typescript
// Deep merge two types
type DeepMerge<T, U> = {
  [K in keyof T | keyof U]: K extends keyof U
    ? K extends keyof T
      ? T[K] extends object
        ? U[K] extends object
          ? DeepMerge<T[K], U[K]>
          : U[K]
        : U[K]
      : U[K]
    : K extends keyof T
      ? T[K]
      : never;
};

type A = { a: { b: 1; c: 2 }; d: 3 };
type B = { a: { b: 10; e: 4 }; f: 5 };
type Merged = DeepMerge<A, B>;
// { a: { b: 10; c: 2; e: 4 }; d: 3; f: 5 }

// Path types
type PathKeys<T, Prefix extends string = ""> = T extends object
  ? {
      [K in keyof T]: K extends string
        ?
            | `${Prefix}${K}`
            | PathKeys<T[K], `${Prefix}${K}.`>
        : never;
    }[keyof T]
  : never;

interface Config {
  server: {
    host: string;
    port: number;
  };
  database: {
    url: string;
  };
}

type ConfigPaths = PathKeys<Config>;
// "server" | "server.host" | "server.port" | "database" | "database.url"

// Get path value type
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

type HostType = PathValue<Config, "server.host">; // string
```

### Type-Safe EventEmitter Implementation

```typescript
type EventMap = {
  userLogin: { userId: string; timestamp: Date };
  userLogout: { userId: string };
  pageView: { path: string; referrer?: string };
  error: { message: string; stack?: string };
};

class TypedEventEmitter<Events extends Record<string, any>> {
  private listeners: {
    [K in keyof Events]?: Array<(payload: Events[K]) => void>;
  } = {};

  on<E extends keyof Events>(
    event: E,
    listener: (payload: Events[E]) => void
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);

    // Return unsubscribe function
    return () => {
      const idx = this.listeners[event]!.indexOf(listener);
      if (idx > -1) {
        this.listeners[event]!.splice(idx, 1);
      }
    };
  }

  emit<E extends keyof Events>(event: E, payload: Events[E]): void {
    this.listeners[event]?.forEach((listener) => listener(payload));
  }

  once<E extends keyof Events>(
    event: E,
    listener: (payload: Events[E]) => void
  ): void {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe();
      listener(payload);
    });
  }
}

// Usage
const emitter = new TypedEventEmitter<EventMap>();

emitter.on("userLogin", ({ userId, timestamp }) => {
  console.log(`User ${userId} logged in at ${timestamp}`);
});

emitter.emit("userLogin", {
  userId: "123",
  timestamp: new Date(),
}); // OK

// emitter.emit("userLogin", { userId: "123" }); // Error: missing timestamp
```

## Interview Key Points

### Common Interview Questions

**1. What is distributive behavior in conditional types? How do you avoid it?**

When a conditional type acts on a naked type parameter in a union type, it automatically distributes:

```typescript
type ToArray<T> = T extends any ? T[] : never;
type Result = ToArray<string | number>; // string[] | number[]

// To avoid distributive behavior, wrap in brackets
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type Result2 = ToArrayNonDist<string | number>; // (string | number)[]
```

**2. Implement a DeepRequired type**

```typescript
type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepRequired<T[K]>
    : T[K];
};
```

**3. How do you extract all method names from an object?**

```typescript
type MethodNames<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];
```

**4. What are covariance and contravariance?**

- **Covariance**: Subtypes can be assigned to parent types (array element types, function return types)
- **Contravariance**: Parent types can be assigned to subtypes (function parameter types)
- **Bivariance**: TypeScript method parameters are bivariant by default
- **Invariance**: Neither covariant nor contravariant

```typescript
// Covariance example
let animals: Animal[] = [];
let dogs: Dog[] = [];
animals = dogs; // OK - arrays are covariant

// Contravariance example
type Handler<T> = (arg: T) => void;
let animalHandler: Handler<Animal> = (a) => {};
let dogHandler: Handler<Dog> = animalHandler; // OK - parameters are contravariant
```

**5. How do you implement a type-safe get function?**

```typescript
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

function get<T, P extends string>(obj: T, path: P): PathValue<T, P> {
  return path.split(".").reduce((acc, key) => acc?.[key], obj as any);
}
```

### Advanced Topics

- Type inference priority and rules
- Deferred resolution in conditional types
- Recursive type depth limits and optimization
- Type compatibility and structural type system
- Declaration file writing conventions
- Module resolution strategies

## Further Reading

### Official Resources

- [TypeScript Handbook - Types from Types](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)
- [TypeScript Handbook - Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [TypeScript Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/overview.html)

### Advanced Learning

- [type-challenges](https://github.com/type-challenges/type-challenges) - Type gymnastics exercises from easy to hard
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - Deep understanding of TypeScript
- [Total TypeScript](https://www.totaltypescript.com/) - Matt Pocock's advanced TypeScript tutorials

### Useful Tools

- [ts-toolbelt](https://github.com/millsp/ts-toolbelt) - 1000+ advanced type utilities
- [utility-types](https://github.com/piotrwitek/utility-types) - Collection of utility types
- [type-fest](https://github.com/sindresorhus/type-fest) - Common type utilities
- [TypeScript Playground](https://www.typescriptlang.org/play) - Online experimentation environment

---

Advanced TypeScript type programming requires significant practice. Start by understanding the basic concepts and gradually progress to complex type gymnastics. In real projects, find a balance between type safety and code readability - avoid overly complex type definitions that compromise maintainability. Remember, the purpose of the type system is to help you write safer, more reliable code, not to show off.
