---
title: TypeScript Generics
description: "Deep dive into TypeScript generics: generic functions, classes, constraints and conditional types"
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - Generics
  - Type Parameters
  - Constraints
status: imported
origin: old/src/content/docs/typescript/generics.en.md
divergence: 0.227
issues: []
legacy:
  category: TypeScript
  subcategory: Type System
  order: 2
  lastUpdated: 2026-01-07
---

Generics are one of the most powerful features in TypeScript, allowing you to write flexible, reusable code while maintaining type safety. They enable you to create components that work with multiple types rather than a single one, making your code more abstract and adaptable.

## Introduction to Generics

Without generics, you would either have to use specific types or the `any` type, losing type safety. Generics provide a way to create reusable components that work with a variety of types while preserving type information.

### Why Generics?

Consider a simple identity function without generics:

```typescript
// Using 'any' - loses type safety
function identity(arg: any): any {
  return arg;
}

let result = identity("hello");
// result is typed as 'any', we lose type information
```

With generics:

```typescript
// Using generics - preserves type safety
function identity<T>(arg: T): T {
  return arg;
}

let result = identity<string>("hello");
// result is correctly typed as 'string'

// Type can also be inferred
let result2 = identity("hello");
// TypeScript infers T as 'string'
```

## Generic Functions

Generic functions use type parameters to create flexible, type-safe functions.

### Basic Generic Function

```typescript
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

const numbers = [1, 2, 3];
const firstNum = firstElement(numbers); // Type: number | undefined

const strings = ["a", "b", "c"];
const firstStr = firstElement(strings); // Type: string | undefined
```

### Multiple Type Parameters

You can use multiple type parameters in a single function:

```typescript
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const result = pair<string, number>("age", 25);
// result: [string, number]

// With type inference
const result2 = pair("name", "John");
// result2: [string, string]
```

### Generic Arrow Functions

```typescript
const map = <T, U>(arr: T[], fn: (item: T) => U): U[] => {
  return arr.map(fn);
};

const numbers = [1, 2, 3];
const doubled = map(numbers, (n) => n * 2);
// doubled: number[]

const strings = map(numbers, (n) => n.toString());
// strings: string[]
```

### Generic Function Types

```typescript
// Function type with generics
type FilterFunction<T> = (arr: T[], predicate: (item: T) => boolean) => T[];

const filter: FilterFunction<any> = (arr, predicate) => {
  return arr.filter(predicate);
};

const evenNumbers = filter([1, 2, 3, 4], (n) => n % 2 === 0);
// [2, 4]
```

## Generic Interfaces

Generic interfaces allow you to create flexible data structures and contracts.

### Basic Generic Interface

```typescript
interface Box<T> {
  value: T;
}

const numberBox: Box<number> = { value: 42 };
const stringBox: Box<string> = { value: "hello" };

// Generic interface with methods
interface Container<T> {
  value: T;
  getValue(): T;
  setValue(value: T): void;
}

class SimpleContainer<T> implements Container<T> {
  constructor(public value: T) {}

  getValue(): T {
    return this.value;
  }

  setValue(value: T): void {
    this.value = value;
  }
}
```

### Generic Interface for API Responses

```typescript
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: Date;
}

interface User {
  id: number;
  name: string;
  email: string;
}

// Usage with specific type
const userResponse: ApiResponse<User> = {
  data: { id: 1, name: "John", email: "john@example.com" },
  status: 200,
  message: "Success",
  timestamp: new Date(),
};

// Usage with array type
const usersResponse: ApiResponse<User[]> = {
  data: [
    { id: 1, name: "John", email: "john@example.com" },
    { id: 2, name: "Jane", email: "jane@example.com" },
  ],
  status: 200,
  message: "Success",
  timestamp: new Date(),
};
```

### Generic Interface with Multiple Type Parameters

```typescript
interface KeyValuePair<K, V> {
  key: K;
  value: V;
}

interface Dictionary<K, V> {
  items: KeyValuePair<K, V>[];
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  has(key: K): boolean;
}

class SimpleDictionary<K, V> implements Dictionary<K, V> {
  items: KeyValuePair<K, V>[] = [];

  get(key: K): V | undefined {
    const item = this.items.find((item) => item.key === key);
    return item?.value;
  }

  set(key: K, value: V): void {
    const existingIndex = this.items.findIndex((item) => item.key === key);
    if (existingIndex !== -1) {
      this.items[existingIndex].value = value;
    } else {
      this.items.push({ key, value });
    }
  }

  has(key: K): boolean {
    return this.items.some((item) => item.key === key);
  }
}
```

## Generic Classes

Generic classes provide a way to create reusable class structures that work with multiple types.

### Basic Generic Class

```typescript
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

// Usage
const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
console.log(numberStack.pop()); // 2

const stringStack = new Stack<string>();
stringStack.push("hello");
stringStack.push("world");
console.log(stringStack.peek()); // "world"
```

### Generic Class with Multiple Type Parameters

```typescript
class Pair<T, U> {
  constructor(public first: T, public second: U) {}

  getFirst(): T {
    return this.first;
  }

  getSecond(): U {
    return this.second;
  }

  swap(): Pair<U, T> {
    return new Pair(this.second, this.first);
  }
}

const pair = new Pair<string, number>("age", 30);
console.log(pair.getFirst()); // "age"
console.log(pair.getSecond()); // 30

const swapped = pair.swap();
// swapped: Pair<number, string>
```

### Generic Class with Static Members

```typescript
class Collection<T> {
  private items: T[] = [];

  // Static method - cannot use T directly
  static create<U>(items: U[]): Collection<U> {
    const collection = new Collection<U>();
    items.forEach((item) => collection.add(item));
    return collection;
  }

  add(item: T): void {
    this.items.push(item);
  }

  getAll(): T[] {
    return [...this.items];
  }
}

const numbers = Collection.create([1, 2, 3]);
// numbers: Collection<number>
```

## Generic Constraints

Generic constraints allow you to restrict the types that can be used with generics, ensuring certain properties or methods are available.

### Basic Constraints

```typescript
// Constraint: T must have a 'length' property
interface Lengthy {
  length: number;
}

function logLength<T extends Lengthy>(arg: T): T {
  console.log(arg.length);
  return arg;
}

logLength("hello"); // OK: string has length
logLength([1, 2, 3]); // OK: array has length
logLength({ length: 10 }); // OK: object has length
// logLength(123); // Error: number doesn't have length
```

### Constraining to Object Keys

```typescript
// Using keyof constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person = {
  name: "John",
  age: 30,
  email: "john@example.com",
};

const name = getProperty(person, "name"); // Type: string
const age = getProperty(person, "age"); // Type: number
// const invalid = getProperty(person, "address"); // Error: "address" is not a key of person
```

### Multiple Constraints

```typescript
// Multiple constraints using intersection
interface Nameable {
  name: string;
}

interface Comparable {
  compareTo(other: any): number;
}

function sortByName<T extends Nameable & Comparable>(items: T[]): T[] {
  return items.sort((a, b) => a.compareTo(b));
}
```

### Constraint with Constructor

```typescript
// Constraint requiring a constructor
interface Constructable<T> {
  new (...args: any[]): T;
}

function create<T>(Type: Constructable<T>, ...args: any[]): T {
  return new Type(...args);
}

class Person {
  constructor(public name: string, public age: number) {}
}

const person = create(Person, "John", 30);
// person: Person
```

### Recursive Constraints

```typescript
// Constraint that references itself
interface TreeNode<T> {
  value: T;
  children: TreeNode<T>[];
}

function flattenTree<T>(node: TreeNode<T>): T[] {
  const result: T[] = [node.value];
  for (const child of node.children) {
    result.push(...flattenTree(child));
  }
  return result;
}

const tree: TreeNode<number> = {
  value: 1,
  children: [
    { value: 2, children: [] },
    { value: 3, children: [{ value: 4, children: [] }] },
  ],
};

const flattened = flattenTree(tree);
// [1, 2, 3, 4]
```

## Default Type Parameters

Default type parameters allow you to specify fallback types when no type argument is provided.

### Basic Default Type

```typescript
interface Options<T = string> {
  value: T;
  label: string;
}

// Uses default type (string)
const option1: Options = {
  value: "hello",
  label: "Greeting",
};

// Explicitly specify type
const option2: Options<number> = {
  value: 42,
  label: "Answer",
};
```

### Default Types with Constraints

```typescript
interface Container<T extends object = { id: number }> {
  data: T;
  getId(): number;
}

class DataContainer<T extends object = { id: number }> implements Container<T> {
  constructor(public data: T) {}

  getId(): number {
    return (this.data as any).id;
  }
}

// Uses default type
const container1 = new DataContainer({ id: 1 });

// Custom type
const container2 = new DataContainer<{ id: number; name: string }>({
  id: 2,
  name: "Custom",
});
```

### Multiple Default Types

```typescript
class Result<T = void, E = Error> {
  constructor(private value?: T, private error?: E) {}

  isSuccess(): boolean {
    return this.error === undefined;
  }

  getValue(): T | undefined {
    return this.value;
  }

  getError(): E | undefined {
    return this.error;
  }
}

// Uses both defaults
const result1 = new Result();

// Override first default
const result2 = new Result<string>();

// Override both defaults
const result3 = new Result<number, string>(42);
```

## Conditional Types

Conditional types allow you to create types that depend on a condition, enabling powerful type-level programming.

### Basic Conditional Type

```typescript
// Syntax: T extends U ? X : Y
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false
type C = IsString<"hello">; // true
```

### Practical Example: Nullable Type

```typescript
type Nullable<T, IsNullable extends boolean> = IsNullable extends true
  ? T | null
  : T;

type MaybeString = Nullable<string, true>; // string | null
type DefinitelyString = Nullable<string, false>; // string
```

### Extracting Return Types

```typescript
type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;

function getString(): string {
  return "hello";
}

function getNumber(): number {
  return 42;
}

type StringReturn = ReturnTypeOf<typeof getString>; // string
type NumberReturn = ReturnTypeOf<typeof getNumber>; // number
```

### Distributive Conditional Types

```typescript
// Conditional types distribute over union types
type ToArray<T> = T extends any ? T[] : never;

type StringOrNumber = string | number;
type ArrayType = ToArray<StringOrNumber>;
// ArrayType = string[] | number[] (distributed over union)

// Non-distributive version using tuple
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type ArrayType2 = ToArrayNonDist<StringOrNumber>;
// ArrayType2 = (string | number)[]
```

### Complex Conditional Type: Flatten

```typescript
type Flatten<T> = T extends Array<infer U> ? Flatten<U> : T;

type NestedArray = number[][][];
type Flat = Flatten<NestedArray>; // number

type MixedNested = (string | number[])[];
type MixedFlat = Flatten<MixedNested>; // string | number
```

### Conditional Type with Multiple Conditions

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

type T0 = TypeName<string>; // "string"
type T1 = TypeName<42>; // "number"
type T2 = TypeName<true>; // "boolean"
type T3 = TypeName<() => void>; // "function"
```

### Infer Keyword in Conditional Types

```typescript
// Extract function parameters
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

function exampleFunc(a: string, b: number, c: boolean): void {}

type Params = Parameters<typeof exampleFunc>;
// Params = [string, number, boolean]

// Extract first parameter
type FirstParameter<T> = T extends (first: infer F, ...args: any[]) => any
  ? F
  : never;

type FirstParam = FirstParameter<typeof exampleFunc>;
// FirstParam = string

// Extract promise type
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type PromiseString = UnwrapPromise<Promise<string>>; // string
type NotPromise = UnwrapPromise<number>; // number
```

## Advanced Generic Patterns

### Mapped Types with Generics

```typescript
// Make all properties optional
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Make all properties required
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Make all properties readonly
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Pick specific properties
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Example usage
interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
}

type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; age?: number; }

type UserNameAndEmail = Pick<User, "name" | "email">;
// { name: string; email: string; }
```

### Generic Type Guards

```typescript
function isArray<T>(value: T | T[]): value is T[] {
  return Array.isArray(value);
}

function ensureArray<T>(value: T | T[]): T[] {
  return isArray(value) ? value : [value];
}

const single = ensureArray(5); // number[]
const multiple = ensureArray([1, 2, 3]); // number[]
```

### Generic Builder Pattern

```typescript
class QueryBuilder<T> {
  private conditions: string[] = [];
  private selectFields: (keyof T)[] = [];

  select(...fields: (keyof T)[]): this {
    this.selectFields.push(...fields);
    return this;
  }

  where(field: keyof T, operator: string, value: any): this {
    this.conditions.push(`${String(field)} ${operator} ${value}`);
    return this;
  }

  build(): string {
    const select = this.selectFields.length
      ? this.selectFields.map(String).join(", ")
      : "*";
    const where =
      this.conditions.length > 0 ? `WHERE ${this.conditions.join(" AND ")}` : "";
    return `SELECT ${select} FROM table ${where}`.trim();
  }
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

const query = new QueryBuilder<Product>()
  .select("name", "price")
  .where("category", "=", "electronics")
  .where("price", ">", 100)
  .build();

console.log(query);
// SELECT name, price FROM table WHERE category = electronics AND price > 100
```

### Generic Utility Types

```typescript
// Exclude properties that are functions
type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

class MyClass {
  name: string = "";
  age: number = 0;
  greet() {
    return "Hello";
  }
}

type DataOnly = NonFunctionProperties<MyClass>;
// { name: string; age: number }

// Deep Partial - makes all nested properties optional
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface Config {
  database: {
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
  cache: {
    enabled: boolean;
    ttl: number;
  };
}

type PartialConfig = DeepPartial<Config>;
// All properties at all levels are optional
```

### Generic HOF (Higher-Order Function) Pattern

```typescript
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Usage
function expensiveCalculation(a: number, b: number): number {
  console.log("Calculating...");
  return a + b;
}

const memoized = memoize(expensiveCalculation);
console.log(memoized(2, 3)); // Logs "Calculating..." and returns 5
console.log(memoized(2, 3)); // Returns 5 from cache without logging
```

## Best Practices

### Use Descriptive Type Parameter Names

```typescript
// Bad: Single letter for complex types
function transform<T, U>(data: T, fn: U): any {
  // ...
}

// Good: Descriptive names when context is important
function transform<TInput, TOutput>(
  data: TInput,
  transformer: (input: TInput) => TOutput
): TOutput {
  return transformer(data);
}

// OK: Single letters for simple, obvious cases
function identity<T>(value: T): T {
  return value;
}
```

### Don't Over-Constrain

```typescript
// Bad: Too specific constraint
function processArray<T extends number[]>(arr: T): number {
  return arr.reduce((sum, n) => sum + n, 0);
}

// Good: More flexible
function sum<T extends number>(arr: T[]): number {
  return arr.reduce((sum, n) => sum + n, 0);
}
```

### Use Type Inference When Possible

```typescript
// Unnecessary explicit type parameter
const numbers = map<number, string>([1, 2, 3], (n) => n.toString());

// Better: Let TypeScript infer
const numbers = map([1, 2, 3], (n) => n.toString());
```

### Avoid Generic Overuse

```typescript
// Bad: Generic when specific type is known
function addNumbers<T>(a: T, b: T): T {
  return (a as any) + (b as any);
}

// Good: Use specific types
function addNumbers(a: number, b: number): number {
  return a + b;
}
```

### Combine Generics with Union Types Carefully

```typescript
// Consider the difference
type Container<T> = { value: T };

// Creates a union of containers
type Result1 = Container<string | number>;
// { value: string | number }

// Creates a container of unions
type Result2 = Container<string> | Container<number>;
// { value: string } | { value: number }
```

### Document Complex Generic Types

```typescript
/**
 * Recursively makes all properties of T and nested objects optional.
 * @template T - The type to make deeply partial
 * @example
 * type Config = DeepPartial<{ db: { host: string; port: number } }>;
 * // { db?: { host?: string; port?: number } }
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

### Consider Variance

```typescript
// Covariance: T[] is covariant in T
let numbers: number[] = [1, 2, 3];
let values: (number | string)[] = numbers; // OK

// Contravariance in function parameters
type Handler<T> = (value: T) => void;
let stringHandler: Handler<string> = (s) => console.log(s);
// let generalHandler: Handler<string | number> = stringHandler; // Error

// Invariance in mutable structures
class Box<T> {
  constructor(public value: T) {}
}

let numberBox = new Box(42);
// let valueBox: Box<number | string> = numberBox; // Error: invariant
```

## Conclusion

TypeScript generics are a powerful tool for creating reusable, type-safe code. By understanding generic functions, classes, interfaces, constraints, and conditional types, you can write more flexible and maintainable TypeScript applications. Remember to balance the power of generics with simplicity—use them when they provide clear benefits in code reusability and type safety, but avoid over-engineering simple solutions.

Key takeaways:

- Generics preserve type information while allowing code reuse
- Constraints ensure generic types have required properties or methods
- Conditional types enable advanced type-level programming
- Default type parameters provide fallback types
- Use generics judiciously and prefer type inference when possible
- Document complex generic patterns for maintainability

With these concepts mastered, you'll be well-equipped to leverage TypeScript's type system to its fullest potential.
