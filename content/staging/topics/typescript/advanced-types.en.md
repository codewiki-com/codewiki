---
title: TypeScript Advanced Types
description: "Master TypeScript advanced types: mapped types, conditional types, template literal types"
track: typescript
section: type-system
difficulty: advanced
tags:
  - TypeScript
  - Advanced Types
  - Mapped Types
  - Conditional Types
status: imported
origin: old/src/content/docs/typescript/advanced-types.en.md
divergence: 0.35
issues:
  - divergent
legacy:
  category: TypeScript
  subcategory: Type System
  order: 3
  lastUpdated: 2026-01-07
---

TypeScript's type system goes far beyond basic types, offering powerful features that enable type-level programming. We'll cover advanced type constructs that make TypeScript's type system Turing-complete.

## Mapped Types

Mapped types allow you to create new types by transforming properties of existing types. They use the syntax `[P in K]: T` to iterate over type keys.

### Basic Mapped Types

```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Partial<T> = {
  [P in keyof T]?: T[P];
};

type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Usage
interface User {
  id: number;
  name: string;
  email?: string;
}

type ReadonlyUser = Readonly<User>;
// { readonly id: number; readonly name: string; readonly email?: string }

type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string }

type RequiredUser = Required<User>;
// { id: number; name: string; email: string }
```

### Key Remapping

TypeScript 4.1+ supports key remapping using the `as` clause:

```typescript
type Getters<T> = {
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
};

interface Person {
  name: string;
  age: number;
  location: string;
}

type PersonGetters = Getters<Person>;
// {
//   getName: () => string;
//   getAge: () => number;
//   getLocation: () => string;
// }
```

### Filtering Properties

You can filter properties by remapping to `never`:

```typescript
type RemoveKindField<T> = {
  [P in keyof T as Exclude<P, "kind">]: T[P];
};

type EventConfig<T extends { kind: string }> = {
  [P in keyof T as Exclude<P, "kind">]: T[P];
};

interface Circle {
  kind: "circle";
  radius: number;
}

type KindlessCircle = RemoveKindField<Circle>;
// { radius: number }
```

### Mapped Type Modifiers

Mapped types support modifiers to control property characteristics:

```typescript
// Remove readonly
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// Remove optional
type Concrete<T> = {
  [P in keyof T]-?: T[P];
};

// Add both readonly and optional
type ReadonlyPartial<T> = {
  readonly [P in keyof T]?: T[P];
};

interface Config {
  readonly apiKey: string;
  timeout?: number;
}

type MutableConfig = Mutable<Config>;
// { apiKey: string; timeout?: number }
```

## Index Access Types

Index access types allow you to look up specific properties on another type.

### Basic Index Access

```typescript
type Person = {
  name: string;
  age: number;
  alive: boolean;
};

type Age = Person["age"];
// number

type NameOrAge = Person["name" | "age"];
// string | number

type AllValues = Person[keyof Person];
// string | number | boolean
```

### Accessing Array Element Types

```typescript
const myArray = [
  { name: "Alice", age: 15 },
  { name: "Bob", age: 23 },
  { name: "Eve", age: 38 },
];

type ArrayElement = typeof myArray[number];
// { name: string; age: number }

type Name = typeof myArray[number]["name"];
// string

// Generic array element extractor
type ArrayElementType<T> = T extends readonly (infer E)[] ? E : never;

type NumberArray = ArrayElementType<number[]>;
// number
```

### Nested Property Access

```typescript
type DeepProperty<T, K extends string> = K extends keyof T
  ? T[K]
  : K extends `${infer First}.${infer Rest}`
  ? First extends keyof T
    ? DeepProperty<T[First], Rest>
    : never
  : never;

interface Company {
  name: string;
  address: {
    street: string;
    city: string;
    country: {
      name: string;
      code: string;
    };
  };
}

type CountryName = DeepProperty<Company, "address.country.name">;
// string
```

## Template Literal Types

Template literal types build on string literal types and can expand into many strings via unions.

### Basic Template Literals

```typescript
type World = "world";
type Greeting = `hello ${World}`;
// "hello world"

type EmailLocaleIDs = "welcome_email" | "email_heading";
type FooterLocaleIDs = "footer_title" | "footer_sendoff";

type AllLocaleIDs = `${EmailLocaleIDs | FooterLocaleIDs}_id`;
// "welcome_email_id" | "email_heading_id" | "footer_title_id" | "footer_sendoff_id"
```

### String Manipulation Types

TypeScript provides built-in utility types for string manipulation:

```typescript
type Uppercase<S extends string> = intrinsic;
type Lowercase<S extends string> = intrinsic;
type Capitalize<S extends string> = intrinsic;
type Uncapitalize<S extends string> = intrinsic;

type Loud = Uppercase<"hello">;
// "HELLO"

type Quiet = Lowercase<"WORLD">;
// "world"

type CapitalizedGreeting = Capitalize<"hello world">;
// "Hello world"

type UncapitalizedGreeting = Uncapitalize<"Hello World">;
// "hello World"
```

### Object Property Manipulation

```typescript
type PropEventSource<T> = {
  on<K extends string & keyof T>(
    eventName: `${K}Changed`,
    callback: (newValue: T[K]) => void
  ): void;
};

declare function makeWatchedObject<T>(obj: T): T & PropEventSource<T>;

const person = makeWatchedObject({
  firstName: "Saoirse",
  lastName: "Ronan",
  age: 26,
});

person.on("firstNameChanged", (newName) => {
  // newName is string
  console.log(`New name: ${newName.toUpperCase()}`);
});

person.on("ageChanged", (newAge) => {
  // newAge is number
  console.log(`New age: ${newAge.toFixed(0)}`);
});
```

### Route Parameter Parsing

```typescript
type ParseRouteParameters<T extends string> =
  T extends `${infer Start}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ParseRouteParameters<Rest>]: string }
    : T extends `${infer Start}:${infer Param}`
    ? { [K in Param]: string }
    : {};

type UserRoute = ParseRouteParameters<"/users/:userId/posts/:postId">;
// { userId: string; postId: string }

type ProfileRoute = ParseRouteParameters<"/profile/:username">;
// { username: string }
```

## Conditional Types

Conditional types select one of two possible types based on a condition expressed as a type relationship test.

### Basic Conditional Types

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;
// true

type B = IsString<number>;
// false

// Extract types from a union
type ExtractStrings<T> = T extends string ? T : never;

type Mixed = string | number | boolean | string[];
type OnlyStrings = ExtractStrings<Mixed>;
// string
```

### Distributive Conditional Types

When conditional types act on a generic type, they become distributive when given a union type:

```typescript
type ToArray<T> = T extends any ? T[] : never;

type StrOrNumArray = ToArray<string | number>;
// string[] | number[]

// Non-distributive version
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type StrOrNumArrayNonDist = ToArrayNonDist<string | number>;
// (string | number)[]
```

### Built-in Conditional Utility Types

```typescript
// Exclude - Remove types from union
type T0 = Exclude<"a" | "b" | "c", "a">;
// "b" | "c"

// Extract - Keep only specified types
type T1 = Extract<"a" | "b" | "c", "a" | "f">;
// "a"

// NonNullable - Remove null and undefined
type T2 = NonNullable<string | number | undefined | null>;
// string | number

// ReturnType - Extract return type of function
function f1(): { a: number; b: string } {
  return { a: 1, b: "hello" };
}

type T3 = ReturnType<typeof f1>;
// { a: number; b: string }

// Parameters - Extract parameter types
function f2(arg1: string, arg2: number): void {}

type T4 = Parameters<typeof f2>;
// [string, number]
```

## The `infer` Keyword

The `infer` keyword allows you to extract and store types within conditional types.

### Basic Type Inference

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type ParameterType<T> = T extends (arg: infer P) => any ? P : never;

function stringToNumber(str: string): number {
  return parseInt(str);
}

type Result = ReturnType<typeof stringToNumber>;
// number

type Param = ParameterType<typeof stringToNumber>;
// string
```

### Inferring Array Types

```typescript
type Flatten<T> = T extends Array<infer Item> ? Item : T;

type Str = Flatten<string[]>;
// string

type Num = Flatten<number>;
// number

// Deep flatten
type DeepFlatten<T> = T extends Array<infer Item>
  ? DeepFlatten<Item>
  : T;

type DeepArray = number[][][];
type FlattenedDeep = DeepFlatten<DeepArray>;
// number
```

### Inferring Promise Types

```typescript
type Awaited<T> = T extends Promise<infer U> ? U : T;

type A = Awaited<Promise<string>>;
// string

type B = Awaited<Promise<Promise<number>>>;
// Promise<number>

// Deep awaited
type DeepAwaited<T> = T extends Promise<infer U>
  ? DeepAwaited<U>
  : T;

type C = DeepAwaited<Promise<Promise<Promise<boolean>>>>;
// boolean
```

### Inferring Tuple Elements

```typescript
type First<T extends any[]> = T extends [infer F, ...any[]] ? F : never;

type Last<T extends any[]> = T extends [...any[], infer L] ? L : never;

type Tail<T extends any[]> = T extends [any, ...infer Rest] ? Rest : never;

type Numbers = [1, 2, 3, 4];

type FirstNum = First<Numbers>;
// 1

type LastNum = Last<Numbers>;
// 4

type RestNums = Tail<Numbers>;
// [2, 3, 4]
```

### Constructor Inference

```typescript
type ConstructorParameters<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: infer P) => any ? P : never;

type InstanceType<T extends abstract new (...args: any) => any> =
  T extends abstract new (...args: any) => infer R ? R : never;

class Person {
  constructor(public name: string, public age: number) {}
}

type PersonParams = ConstructorParameters<typeof Person>;
// [string, number]

type PersonInstance = InstanceType<typeof Person>;
// Person
```

## Recursive Types

Recursive types reference themselves in their definition, enabling complex type structures.

### JSON Type Definition

```typescript
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

const validJSON: JSONValue = {
  name: "John",
  age: 30,
  addresses: [
    {
      street: "123 Main St",
      city: "Springfield",
    },
  ],
  metadata: {
    tags: ["user", "active"],
    score: 95.5,
  },
};
```

### Recursive Object Transformation

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

interface NestedConfig {
  database: {
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
}

type ReadonlyConfig = DeepReadonly<NestedConfig>;
// All properties at all levels are readonly

type PartialConfig = DeepPartial<NestedConfig>;
// All properties at all levels are optional
```

### Path Type Generation

```typescript
type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in keyof T]: [K, ...PathsToStringProps<T[K]>];
    }[keyof T];

type Join<T extends unknown[], D extends string = ""> =
  T extends []
    ? ""
    : T extends [infer F]
    ? F
    : T extends [infer F, ...infer R]
    ? F extends string
      ? `${F}${D}${Join<R, D>}`
      : never
    : string;

type Paths<T> = Join<PathsToStringProps<T>, ".">;

interface Article {
  title: string;
  author: {
    name: string;
    email: string;
  };
  metadata: {
    tags: string[];
    publishDate: string;
  };
}

type ArticlePaths = Paths<Article>;
// "title" | "author.name" | "author.email" | "metadata.tags" | "metadata.publishDate"
```

### Recursive Array Flattening

```typescript
type FlattenArray<T extends readonly unknown[]> =
  T extends readonly [infer First, ...infer Rest]
    ? First extends readonly unknown[]
      ? [...FlattenArray<First>, ...FlattenArray<Rest>]
      : [First, ...FlattenArray<Rest>]
    : T;

type Nested = [1, [2, [3, 4]], 5, [6]];
type Flattened = FlattenArray<Nested>;
// [1, 2, 3, 4, 5, 6]
```

### Tree Structure Types

```typescript
type TreeNode<T> = {
  value: T;
  children?: TreeNode<T>[];
};

type TreePaths<T, Path extends string = ""> = T extends TreeNode<infer V>
  ? Path | (T["children"] extends TreeNode<V>[]
      ? TreePaths<T["children"][number], `${Path}.children[${number}]`>
      : never)
  : never;

const tree: TreeNode<string> = {
  value: "root",
  children: [
    {
      value: "child1",
      children: [
        { value: "grandchild1" }
      ]
    },
    {
      value: "child2"
    }
  ]
};
```

## Practical Advanced Type Patterns

### Type-Safe Event Emitter

```typescript
type EventMap = Record<string, any>;

type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

interface Emitter<T extends EventMap> {
  on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
  emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
}

// Usage
interface AppEvents {
  userLoggedIn: { userId: string; timestamp: number };
  dataLoaded: { recordCount: number };
  error: { message: string; code: number };
}

declare const emitter: Emitter<AppEvents>;

emitter.on("userLoggedIn", (data) => {
  // data is { userId: string; timestamp: number }
  console.log(data.userId);
});

emitter.emit("dataLoaded", { recordCount: 100 });
```

### Builder Pattern with Type State

```typescript
type BuilderState = {
  hasName: boolean;
  hasEmail: boolean;
};

class UserBuilder<S extends BuilderState = { hasName: false; hasEmail: false }> {
  private name?: string;
  private email?: string;
  private age?: number;

  setName(name: string): UserBuilder<S & { hasName: true }> {
    this.name = name;
    return this as any;
  }

  setEmail(email: string): UserBuilder<S & { hasEmail: true }> {
    this.email = email;
    return this as any;
  }

  setAge(age: number): UserBuilder<S> {
    this.age = age;
    return this;
  }

  build(this: UserBuilder<{ hasName: true; hasEmail: true }>) {
    return {
      name: this.name!,
      email: this.email!,
      age: this.age,
    };
  }
}

// Valid
const user1 = new UserBuilder()
  .setName("John")
  .setEmail("john@example.com")
  .build();

// Error: build() requires both name and email
// const user2 = new UserBuilder().setName("John").build();
```

### Type-Safe Query Builder

```typescript
type QueryBuilder<T, Selected extends keyof T = never> = {
  select<K extends keyof T>(
    ...keys: K[]
  ): QueryBuilder<T, Selected | K>;

  where(condition: Partial<T>): QueryBuilder<T, Selected>;

  execute(): Pick<T, Selected>;
};

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
}

declare function createQuery<T>(): QueryBuilder<T>;

const result = createQuery<User>()
  .select("id", "name")
  .where({ isActive: true })
  .execute();

// result type: { id: number; name: string }
```

## Performance Considerations

When working with advanced types:

1. **Avoid excessive type recursion**: TypeScript has recursion depth limits
2. **Use distributive conditional types carefully**: They can cause performance issues with large unions
3. **Prefer simpler types when possible**: Complex types increase compilation time
4. **Use type aliases to reduce redundancy**: Cache complex type calculations

```typescript
// Less efficient - recalculates every time
type DeepValue1 = SomeComplexType<SomeOtherComplexType<Data>>;

// More efficient - calculates once
type IntermediateType = SomeOtherComplexType<Data>;
type DeepValue2 = SomeComplexType<IntermediateType>;
```

## Conclusion

TypeScript's advanced type system enables powerful compile-time guarantees and type-level programming. By mastering mapped types, conditional types, template literals, the `infer` keyword, and recursive types, you can create highly expressive and type-safe APIs that catch errors at compile time rather than runtime.

These advanced features transform TypeScript from a simple type checker into a powerful tool for encoding business logic and constraints directly in the type system, leading to more robust and maintainable codebases.
