---
title: TypeScript Utility Types
description: "Master TypeScript built-in utility types: Partial, Pick, Omit, Record and more"
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - Utility Types
  - Partial
  - Pick
status: imported
origin: old/src/content/docs/typescript/utility-types.en.md
divergence: 0.148
issues: []
legacy:
  category: TypeScript
  subcategory: Type System
  order: 4
  lastUpdated: 2026-01-07
---

TypeScript provides several built-in utility types that help you transform and manipulate types in powerful ways. These utilities make it easier to create new types based on existing ones, reducing code duplication and improving type safety.

  - [Partial\<T\>](#partialt)
  - [Required\<T\>](#requiredt)
  - [Readonly\<T\>](#readonlyt)
- [Property Selection](#property-selection)
  - [Pick\<T, K\>](#pickt-k)
  - [Omit\<T, K\>](#omitt-k)
  - [Record\<K, T\>](#recordk-t)
- [Type Filtering](#type-filtering)
  - [Exclude\<T, U\>](#excludet-u)
  - [Extract\<T, U\>](#extractt-u)
  - [NonNullable\<T\>](#nonnullablet)
- [Function Utilities](#function-utilities)
  - [ReturnType\<T\>](#returntypet)
  - [Parameters\<T\>](#parameterst)
  - [ConstructorParameters\<T\>](#constructorparameterst)
  - [InstanceType\<T\>](#instancetypet)
- [String Manipulation](#string-manipulation)
  - [Uppercase\<T\>](#uppercaset)
  - [Lowercase\<T\>](#lowercaset)
  - [Capitalize\<T\>](#capitalizet)
  - [Uncapitalize\<T\>](#uncapitalizet)
- [Custom Utility Types](#custom-utility-types)

## Property Modifiers

### Partial\<T\>

Makes all properties in a type optional. This is useful when you want to create objects with only some properties set.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// All properties become optional
type PartialUser = Partial<User>;

// Equivalent to:
// type PartialUser = {
//   id?: number;
//   name?: string;
//   email?: string;
//   age?: number;
// }

function updateUser(id: number, updates: Partial<User>) {
  // Can pass any combination of properties
  return { id, ...updates };
}

updateUser(1, { name: "John" }); // Valid
updateUser(2, { email: "john@example.com", age: 30 }); // Valid
```

**Common Use Cases:**
- Update functions that accept partial data
- Optional configuration objects
- Form state management

### Required\<T\>

Makes all properties in a type required. This is the opposite of `Partial<T>`.

```typescript
interface Config {
  host?: string;
  port?: number;
  timeout?: number;
}

type RequiredConfig = Required<Config>;

// Equivalent to:
// type RequiredConfig = {
//   host: string;
//   port: number;
//   timeout: number;
// }

function initializeServer(config: RequiredConfig) {
  // All properties are guaranteed to exist
  console.log(`Server running on ${config.host}:${config.port}`);
}

// Error: Missing required properties
// initializeServer({ host: "localhost" });

// Valid
initializeServer({
  host: "localhost",
  port: 3000,
  timeout: 5000
});
```

### Readonly\<T\>

Makes all properties in a type readonly, preventing reassignment after initialization.

```typescript
interface Point {
  x: number;
  y: number;
}

type ReadonlyPoint = Readonly<Point>;

// Equivalent to:
// type ReadonlyPoint = {
//   readonly x: number;
//   readonly y: number;
// }

const point: ReadonlyPoint = { x: 10, y: 20 };

// Error: Cannot assign to 'x' because it is a read-only property
// point.x = 30;

// Useful for immutable data structures
function createImmutableUser(data: User): Readonly<User> {
  return Object.freeze({ ...data });
}
```

## Property Selection

### Pick\<T, K\>

Creates a new type by selecting specific properties from an existing type.

```typescript
interface Article {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
}

// Pick only the properties we need
type ArticlePreview = Pick<Article, "id" | "title" | "author">;

// Equivalent to:
// type ArticlePreview = {
//   id: number;
//   title: string;
//   author: string;
// }

function getArticlePreviews(): ArticlePreview[] {
  return [
    { id: 1, title: "TypeScript Guide", author: "Alice" },
    { id: 2, title: "React Patterns", author: "Bob" }
  ];
}

// Pick for API responses
type UserPublicInfo = Pick<User, "id" | "name">;

function getUserPublicProfile(userId: number): UserPublicInfo {
  // Return only safe, public information
  return { id: userId, name: "John Doe" };
}
```

### Omit\<T, K\>

Creates a new type by excluding specific properties from an existing type.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Omit sensitive information
type UserResponse = Omit<User, "password">;

// Equivalent to:
// type UserResponse = {
//   id: number;
//   name: string;
//   email: string;
//   createdAt: Date;
// }

function getUserData(id: number): UserResponse {
  // Password is excluded from the return type
  return {
    id,
    name: "John",
    email: "john@example.com",
    createdAt: new Date()
  };
}

// Omit multiple properties
type CreateUserInput = Omit<User, "id" | "createdAt">;

function createUser(input: CreateUserInput): User {
  return {
    id: Math.random(),
    createdAt: new Date(),
    ...input
  };
}
```

### Record\<K, T\>

Creates an object type with specified keys and value types. Perfect for creating dictionaries or maps.

```typescript
// Simple record
type UserRoles = Record<string, string>;

const roles: UserRoles = {
  admin: "Administrator",
  editor: "Content Editor",
  viewer: "Read Only"
};

// Record with specific keys
type HttpStatusCode = Record<"success" | "error" | "pending", number>;

const statusCodes: HttpStatusCode = {
  success: 200,
  error: 500,
  pending: 102
};

// Advanced usage with complex types
type ProductId = string;

interface Product {
  name: string;
  price: number;
  stock: number;
}

type ProductCatalog = Record<ProductId, Product>;

const catalog: ProductCatalog = {
  "prod-1": { name: "Laptop", price: 999, stock: 10 },
  "prod-2": { name: "Mouse", price: 29, stock: 50 }
};

// Record for configuration objects
type Environment = "development" | "staging" | "production";

interface EnvConfig {
  apiUrl: string;
  debugMode: boolean;
}

type EnvironmentConfig = Record<Environment, EnvConfig>;

const config: EnvironmentConfig = {
  development: { apiUrl: "http://localhost:3000", debugMode: true },
  staging: { apiUrl: "https://staging.api.com", debugMode: true },
  production: { apiUrl: "https://api.com", debugMode: false }
};
```

## Type Filtering

### Exclude\<T, U\>

Excludes types from a union that are assignable to another type.

```typescript
type AllColors = "red" | "blue" | "green" | "yellow" | "purple";

// Exclude specific colors
type PrimaryColors = Exclude<AllColors, "yellow" | "purple">;
// Result: "red" | "blue" | "green"

// Practical example
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type ReadOnlyMethod = Exclude<HttpMethod, "POST" | "PUT" | "DELETE" | "PATCH">;
// Result: "GET"

type MutatingMethod = Exclude<HttpMethod, "GET">;
// Result: "POST" | "PUT" | "DELETE" | "PATCH"

// Exclude types
type Primitive = string | number | boolean | null | undefined;
type NonNullPrimitive = Exclude<Primitive, null | undefined>;
// Result: string | number | boolean

// Advanced usage
type EventHandler = MouseEvent | KeyboardEvent | TouchEvent;
type NonTouchEvent = Exclude<EventHandler, TouchEvent>;
// Result: MouseEvent | KeyboardEvent
```

### Extract\<T, U\>

Extracts types from a union that are assignable to another type. This is the opposite of `Exclude<T, U>`.

```typescript
type AllEvents = "click" | "scroll" | "mousemove" | "keydown" | "keyup";

// Extract mouse-related events
type MouseEvents = Extract<AllEvents, "click" | "mousemove">;
// Result: "click" | "mousemove"

// Extract keyboard events
type KeyboardEvents = Extract<AllEvents, `key${string}`>;
// Result: "keydown" | "keyup"

// Practical example with discriminated unions
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; size: number }
  | { kind: "rectangle"; width: number; height: number };

type RectangularShapes = Extract<Shape, { kind: "square" | "rectangle" }>;
// Result: { kind: "square"; size: number } | { kind: "rectangle"; width: number; height: number }

// Extract function types
type MixedTypes = string | number | (() => void) | ((x: number) => number);
type FunctionTypes = Extract<MixedTypes, Function>;
// Result: (() => void) | ((x: number) => number)
```

### NonNullable\<T\>

Removes `null` and `undefined` from a type.

```typescript
type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>;
// Result: string

// Practical usage
function processValue(value: string | null | undefined): string {
  // Type guard
  if (value == null) {
    throw new Error("Value is required");
  }

  // TypeScript knows value is NonNullable here
  return value.toUpperCase();
}

// With arrays
type NullableArray = Array<string | null | undefined>;
type CleanArray = Array<NonNullable<string | null | undefined>>;
// CleanArray is Array<string>

// Filtering nullish values
function filterNullish<T>(arr: T[]): NonNullable<T>[] {
  return arr.filter((item): item is NonNullable<T> => item != null);
}

const values = [1, null, 2, undefined, 3];
const cleaned = filterNullish(values); // number[]
```

## Function Utilities

### ReturnType\<T\>

Extracts the return type of a function type.

```typescript
function createUser(name: string, age: number) {
  return {
    id: Math.random(),
    name,
    age,
    createdAt: new Date()
  };
}

type User = ReturnType<typeof createUser>;
// Result: {
//   id: number;
//   name: string;
//   age: number;
//   createdAt: Date;
// }

// With generic functions
function fetchData<T>(url: string): Promise<T> {
  return fetch(url).then(res => res.json());
}

type FetchDataReturn = ReturnType<typeof fetchData>;
// Result: Promise<unknown>

// With arrow functions
const multiply = (a: number, b: number) => a * b;
type MultiplyReturn = ReturnType<typeof multiply>;
// Result: number

// Practical example
class ApiService {
  async getUsers() {
    return [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" }
    ];
  }
}

type UserList = ReturnType<ApiService["getUsers"]>;
// Result: Promise<{ id: number; name: string; }[]>

// Unwrap Promise type
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type Users = UnwrapPromise<UserList>;
// Result: { id: number; name: string; }[]
```

### Parameters\<T\>

Extracts the parameter types of a function type as a tuple.

```typescript
function createProduct(name: string, price: number, inStock: boolean) {
  return { name, price, inStock };
}

type CreateProductParams = Parameters<typeof createProduct>;
// Result: [name: string, price: number, inStock: boolean]

// Access individual parameters
type FirstParam = Parameters<typeof createProduct>[0]; // string
type SecondParam = Parameters<typeof createProduct>[1]; // number

// Practical usage: wrapper functions
function logAndCall<T extends (...args: any[]) => any>(
  fn: T,
  ...args: Parameters<T>
): ReturnType<T> {
  console.log("Calling with:", args);
  return fn(...args);
}

logAndCall(createProduct, "Laptop", 999, true);

// With method signatures
class UserService {
  updateUser(id: number, data: Partial<User>) {
    // Update logic
  }
}

type UpdateUserParams = Parameters<UserService["updateUser"]>;
// Result: [id: number, data: Partial<User>]

// Create type-safe event emitters
type EventHandler = (event: MouseEvent, data: string) => void;
type HandlerParams = Parameters<EventHandler>;
// Result: [event: MouseEvent, data: string]

function emit(...args: HandlerParams) {
  // Type-safe event emission
}
```

### ConstructorParameters\<T\>

Extracts the parameter types of a constructor function as a tuple.

```typescript
class User {
  constructor(
    public name: string,
    public email: string,
    public age?: number
  ) {}
}

type UserConstructorParams = ConstructorParameters<typeof User>;
// Result: [name: string, email: string, age?: number]

// Factory pattern
function createInstance<T extends new (...args: any[]) => any>(
  constructor: T,
  ...args: ConstructorParameters<T>
): InstanceType<T> {
  return new constructor(...args);
}

const user = createInstance(User, "Alice", "alice@example.com", 25);

// With built-in types
type DateParams = ConstructorParameters<typeof Date>;
// Result: [value?: string | number | Date]

type ArrayParams = ConstructorParameters<typeof Array<number>>;
// Result: [arrayLength?: number]

// Advanced: Dependency injection
class DatabaseService {
  constructor(
    private host: string,
    private port: number,
    private options?: { ssl: boolean }
  ) {}
}

type DbServiceParams = ConstructorParameters<typeof DatabaseService>;

function createDbService(...params: DbServiceParams) {
  return new DatabaseService(...params);
}
```

### InstanceType\<T\>

Extracts the instance type of a constructor function.

```typescript
class ApiClient {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get(endpoint: string) {
    return fetch(`${this.baseUrl}${endpoint}`);
  }
}

type ApiClientInstance = InstanceType<typeof ApiClient>;
// Result: ApiClient

// Practical usage in factories
function createService<T extends new (...args: any[]) => any>(
  ServiceClass: T,
  ...args: ConstructorParameters<T>
): InstanceType<T> {
  return new ServiceClass(...args);
}

const client = createService(ApiClient, "https://api.example.com");

// With abstract classes
abstract class Animal {
  abstract makeSound(): void;
}

class Dog extends Animal {
  makeSound() {
    console.log("Woof!");
  }
}

type DogInstance = InstanceType<typeof Dog>;
// Result: Dog

// Registry pattern
type Constructor<T = any> = new (...args: any[]) => T;

class ServiceRegistry {
  private services = new Map<string, any>();

  register<T extends Constructor>(name: string, service: T): void {
    this.services.set(name, service);
  }

  resolve<T extends Constructor>(name: string): InstanceType<T> | undefined {
    const Service = this.services.get(name);
    return Service ? new Service() : undefined;
  }
}
```

## String Manipulation

TypeScript 4.1+ introduced template literal types and intrinsic string manipulation types.

### Uppercase\<T\>

Converts string literal types to uppercase.

```typescript
type Greeting = "hello world";
type LoudGreeting = Uppercase<Greeting>;
// Result: "HELLO WORLD"

// Practical usage
type HttpMethod = "get" | "post" | "put" | "delete";
type HttpMethodUpper = Uppercase<HttpMethod>;
// Result: "GET" | "POST" | "PUT" | "DELETE"

// Generate constant keys
type EventName = "click" | "focus" | "blur";
type EventConstant = `ON_${Uppercase<EventName>}`;
// Result: "ON_CLICK" | "ON_FOCUS" | "ON_BLUR"

const events: Record<EventConstant, string> = {
  ON_CLICK: "click",
  ON_FOCUS: "focus",
  ON_BLUR: "blur"
};
```

### Lowercase\<T\>

Converts string literal types to lowercase.

```typescript
type ShoutingCommand = "STOP" | "GO" | "WAIT";
type NormalCommand = Lowercase<ShoutingCommand>;
// Result: "stop" | "go" | "wait"

// CSS property conversion
type CssPropertyCamel = "backgroundColor" | "fontSize" | "marginTop";
// Note: This doesn't convert camelCase to kebab-case automatically
// For that, you'd need custom template literal types

// Normalize user input types
type UserInput = "YES" | "NO" | "Maybe";
type NormalizedInput = Lowercase<UserInput>;
// Result: "yes" | "no" | "maybe"
```

### Capitalize\<T\>

Capitalizes the first letter of a string literal type.

```typescript
type Animal = "dog" | "cat" | "bird";
type CapitalizedAnimal = Capitalize<Animal>;
// Result: "Dog" | "Cat" | "Bird"

// Generate getter method names
type Property = "name" | "age" | "email";
type Getter = `get${Capitalize<Property>}`;
// Result: "getName" | "getAge" | "getEmail"

interface User {
  getName(): string;
  getAge(): number;
  getEmail(): string;
}

// Generate class method names
type Action = "create" | "update" | "delete";
type MethodName = `handle${Capitalize<Action>}`;
// Result: "handleCreate" | "handleUpdate" | "handleDelete"
```

### Uncapitalize\<T\>

Uncapitalizes the first letter of a string literal type.

```typescript
type ClassName = "User" | "Product" | "Order";
type InstanceName = Uncapitalize<ClassName>;
// Result: "user" | "product" | "order"

// Convert PascalCase to camelCase (first letter only)
type ComponentName = "UserProfile" | "ProductList" | "OrderDetails";
type PropName = Uncapitalize<ComponentName>;
// Result: "userProfile" | "productList" | "orderDetails"

// Generate variable names from types
type ModelName = "User" | "Post" | "Comment";
type RepositoryName = `${Uncapitalize<ModelName>}Repository`;
// Result: "userRepository" | "postRepository" | "commentRepository"
```

## Custom Utility Types

You can create your own utility types to solve specific problems in your codebase.

### DeepPartial

Makes all properties optional recursively.

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface NestedConfig {
  server: {
    host: string;
    port: number;
    ssl: {
      enabled: boolean;
      cert: string;
      key: string;
    };
  };
  database: {
    host: string;
    port: number;
  };
}

type PartialConfig = DeepPartial<NestedConfig>;

const config: PartialConfig = {
  server: {
    ssl: {
      enabled: true
      // cert and key are optional
    }
  }
  // database is optional
};
```

### DeepReadonly

Makes all properties readonly recursively.

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

interface MutableState {
  user: {
    name: string;
    settings: {
      theme: string;
      notifications: boolean;
    };
  };
}

type ImmutableState = DeepReadonly<MutableState>;

const state: ImmutableState = {
  user: {
    name: "Alice",
    settings: {
      theme: "dark",
      notifications: true
    }
  }
};

// Error: Cannot assign to 'theme' because it is a read-only property
// state.user.settings.theme = "light";
```

### Nullable and Optional

Create nullable or optional versions of types.

```typescript
type Nullable<T> = T | null;
type Optional<T> = T | undefined;
type Maybe<T> = T | null | undefined;

interface User {
  id: number;
  name: string;
  email: string;
}

type NullableUser = Nullable<User>;
// User | null

type MaybeUser = Maybe<User>;
// User | null | undefined

// Useful for database operations
function findUser(id: number): Nullable<User> {
  // Return user or null if not found
  return null;
}

function getUserCache(id: number): Maybe<User> {
  // Return user, null (not in DB), or undefined (not in cache)
  return undefined;
}
```

### PickByType

Pick properties by their value type.

```typescript
type PickByType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P];
};

interface Mixed {
  id: number;
  name: string;
  age: number;
  active: boolean;
  email: string;
}

type StringProps = PickByType<Mixed, string>;
// Result: { name: string; email: string; }

type NumberProps = PickByType<Mixed, number>;
// Result: { id: number; age: number; }

// Practical usage: Extract all function properties
interface UserService {
  name: string;
  version: number;
  getUser: () => User;
  updateUser: (user: User) => void;
  deleteUser: (id: number) => void;
}

type UserServiceMethods = PickByType<UserService, Function>;
// Result: {
//   getUser: () => User;
//   updateUser: (user: User) => void;
//   deleteUser: (id: number) => void;
// }
```

### OmitByType

Omit properties by their value type.

```typescript
type OmitByType<T, U> = {
  [P in keyof T as T[P] extends U ? never : P]: T[P];
};

interface ApiResponse {
  data: any;
  status: number;
  message: string;
  timestamp: number;
  fetchData: () => void;
  refresh: () => void;
}

type DataOnly = OmitByType<ApiResponse, Function>;
// Result: {
//   data: any;
//   status: number;
//   message: string;
//   timestamp: number;
// }
```

### ValueOf

Get the type of all values in an object or array.

```typescript
type ValueOf<T> = T[keyof T];

interface Colors {
  red: "#FF0000";
  green: "#00FF00";
  blue: "#0000FF";
}

type ColorValue = ValueOf<Colors>;
// Result: "#FF0000" | "#00FF00" | "#0000FF"

// With arrays
const fruits = ["apple", "banana", "orange"] as const;
type Fruit = ValueOf<typeof fruits>;
// Result: "apple" | "banana" | "orange"

// Practical usage
const HTTP_STATUS = {
  OK: 200,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
} as const;

type StatusCode = ValueOf<typeof HTTP_STATUS>;
// Result: 200 | 404 | 500

function handleStatus(code: StatusCode) {
  // Type-safe status handling
}
```

### Mutable

Removes readonly modifiers from properties.

```typescript
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

interface ReadonlyUser {
  readonly id: number;
  readonly name: string;
  readonly email: string;
}

type MutableUser = Mutable<ReadonlyUser>;
// Result: {
//   id: number;
//   name: string;
//   email: string;
// }

// Useful for cloning and modifying immutable data
function cloneAndModify(user: ReadonlyUser): User {
  const mutable = { ...user } as MutableUser;
  mutable.name = "New Name";
  return mutable;
}
```

### PromiseType

Extract the resolved type from a Promise.

```typescript
type PromiseType<T> = T extends Promise<infer U> ? U : T;

async function fetchUser(): Promise<{ id: number; name: string }> {
  return { id: 1, name: "Alice" };
}

type User = PromiseType<ReturnType<typeof fetchUser>>;
// Result: { id: number; name: string; }

// Works with nested promises
type DoublePromise = Promise<Promise<string>>;
type Resolved = PromiseType<PromiseType<DoublePromise>>;
// Result: string
```

### FunctionPropertyNames

Get names of all function properties.

```typescript
type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

interface UserRepository {
  users: User[];
  count: number;
  findById(id: number): User | null;
  findAll(): User[];
  save(user: User): void;
  delete(id: number): boolean;
}

type RepositoryMethods = FunctionPropertyNames<UserRepository>;
// Result: "findById" | "findAll" | "save" | "delete"

// Create type with only methods
type RepositoryMethodsOnly = Pick<UserRepository, RepositoryMethods>;
```

### UnionToIntersection

Convert a union type to an intersection type.

```typescript
type UnionToIntersection<U> = (
  U extends any ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

type Union = { a: string } | { b: number } | { c: boolean };
type Intersection = UnionToIntersection<Union>;
// Result: { a: string } & { b: number } & { c: boolean }

// Practical usage: Merge multiple mixins
interface CanWalk {
  walk(): void;
}

interface CanSwim {
  swim(): void;
}

interface CanFly {
  fly(): void;
}

type SuperCreature = UnionToIntersection<CanWalk | CanSwim | CanFly>;
// Result: CanWalk & CanSwim & CanFly

const creature: SuperCreature = {
  walk() { console.log("Walking"); },
  swim() { console.log("Swimming"); },
  fly() { console.log("Flying"); }
};
```

## Best Practices

### Prefer Built-in Utilities

Always use TypeScript's built-in utilities when available instead of creating custom ones.

```typescript
// Bad: Reinventing the wheel
type MyPartial<T> = {
  [P in keyof T]?: T[P];
};

// Good: Use built-in utility
type UserUpdate = Partial<User>;
```

### Combine Utilities

Utility types can be combined for more complex transformations.

```typescript
// Make all properties optional and readonly
type PartialReadonly<T> = Partial<Readonly<T>>;

// Pick specific properties and make them required
type RequiredPick<T, K extends keyof T> = Required<Pick<T, K>>;

interface User {
  id?: number;
  name?: string;
  email?: string;
}

type UserForm = RequiredPick<User, "name" | "email">;
// Result: { name: string; email: string; }
```

### Use Type Inference

Let TypeScript infer types when possible to reduce redundancy.

```typescript
// Instead of manually defining return types
function createUser(name: string): { id: number; name: string } {
  return { id: 1, name };
}

// Let TypeScript infer and extract when needed
function createUser(name: string) {
  return { id: 1, name };
}

type User = ReturnType<typeof createUser>;
```

### Document Complex Types

Add comments to explain complex utility type usage.

```typescript
/**
 * Extracts all properties from T that are of type U
 * @example
 * type StringProps = PickByType<User, string>
 */
type PickByType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P];
};
```

### Use const Assertions

Combine utility types with `as const` for maximum type safety.

```typescript
const ROLES = {
  ADMIN: "admin",
  USER: "user",
  GUEST: "guest"
} as const;

type Role = ValueOf<typeof ROLES>;
// Result: "admin" | "user" | "guest"

// Not just: string
```

## Conclusion

TypeScript utility types are powerful tools for creating flexible, type-safe code. They enable you to:

- Transform existing types without duplication
- Create type-safe APIs and functions
- Improve code maintainability
- Catch errors at compile time
- Express complex type relationships clearly

By mastering these utilities, you'll write more robust TypeScript code with less repetition and better type inference. Start with the basic utilities like `Partial`, `Pick`, and `Omit`, then gradually explore the more advanced ones as your needs grow.

Remember: the goal is not to use every utility type, but to choose the right tool for each situation. Keep your types simple and readable, and reach for utilities when they make your code clearer and safer.
