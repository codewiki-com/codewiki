---
title: TypeScript Mapped Types
description: Deep dive into TypeScript mapped types including built-in and custom mapped types
track: typescript
section: generics-advanced
difficulty: advanced
tags:
  - TypeScript
  - mapped types
  - type programming
status: imported
origin: old/src/content/docs/typescript/mapped-types.en.md
divergence: 0.223
issues: []
legacy:
  category: TypeScript
  subcategory: Advanced Types
  order: 12
  lastUpdated: 2026-01-07
---

Mapped types are one of the most powerful features in TypeScript's type system, allowing you to create new types by transforming existing ones. They provide a way to iterate over the properties of a type and apply transformations, so you can create utility types that modify property modifiers, rename keys, filter properties, and much more.

## Introduction to Mapped Types

Mapped types build upon index signatures, which are used to declare the types of properties that haven't been declared ahead of time. A mapped type is a generic type that uses a union of `PropertyKey`s (frequently created via `keyof`) to iterate through keys and create a type.

### Why Use Mapped Types?

Consider a scenario where you need to create a read-only version of an existing type:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// Without mapped types - manual and repetitive
interface ReadonlyUser {
  readonly id: number;
  readonly name: string;
  readonly email: string;
}

// With mapped types - automatic and DRY
type ReadonlyUser = {
  readonly [K in keyof User]: User[K];
};
```

Mapped types eliminate repetition and ensure your transformed types stay in sync with the original types.

## Basic Syntax

The basic syntax of a mapped type looks like this:

```typescript
type MappedType<T> = {
  [K in keyof T]: T[K];
};
```

Let's break this down:

- `K in keyof T`: This iterates over all keys of type `T`
- `T[K]`: This accesses the type of property `K` in `T`
- The result is a new type with the same properties as `T`

### Simple Examples

```typescript
// Identity mapped type - creates an exact copy
type Identity<T> = {
  [K in keyof T]: T[K];
};

interface Product {
  id: number;
  name: string;
  price: number;
}

type ProductCopy = Identity<Product>;
// Result: { id: number; name: string; price: number; }

// Transform all values to strings
type Stringify<T> = {
  [K in keyof T]: string;
};

type StringifiedProduct = Stringify<Product>;
// Result: { id: string; name: string; price: string; }

// Transform all values to boolean
type Boolify<T> = {
  [K in keyof T]: boolean;
};

type BooleanProduct = Boolify<Product>;
// Result: { id: boolean; name: boolean; price: boolean; }
```

### Mapping Over Union Types

You can also map over union types of strings:

```typescript
type OptionsFlags<T extends string> = {
  [K in T]: boolean;
};

type Features = "darkMode" | "notifications" | "analytics";

type FeatureFlags = OptionsFlags<Features>;
// Result: { darkMode: boolean; notifications: boolean; analytics: boolean; }

// With specific values
type StatusMap<T extends string> = {
  [K in T]: "active" | "inactive" | "pending";
};

type UserStatuses = StatusMap<"subscription" | "account" | "profile">;
// Result: { subscription: "active" | "inactive" | "pending"; account: ...; profile: ...; }
```

## Property Modifiers

Mapped types can add or remove property modifiers such as `readonly` and `?` (optional). You can use `+` to add a modifier and `-` to remove it.

### Adding Modifiers

```typescript
// Make all properties optional
type Optional<T> = {
  [K in keyof T]?: T[K];
};

// Make all properties readonly
type Immutable<T> = {
  readonly [K in keyof T]: T[K];
};

// Make all properties optional AND readonly
type PartialReadonly<T> = {
  readonly [K in keyof T]?: T[K];
};

interface Config {
  host: string;
  port: number;
  debug: boolean;
}

type OptionalConfig = Optional<Config>;
// Result: { host?: string; port?: number; debug?: boolean; }

type ImmutableConfig = Immutable<Config>;
// Result: { readonly host: string; readonly port: number; readonly debug: boolean; }

type PartialImmutableConfig = PartialReadonly<Config>;
// Result: { readonly host?: string; readonly port?: number; readonly debug?: boolean; }
```

### Removing Modifiers

```typescript
// Remove optional modifier (make all properties required)
type RequiredType<T> = {
  [K in keyof T]-?: T[K];
};

// Remove readonly modifier (make all properties mutable)
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

// Remove both modifiers
type Concrete<T> = {
  -readonly [K in keyof T]-?: T[K];
};

interface PartialUser {
  readonly id?: number;
  readonly name?: string;
  readonly email?: string;
}

type MutableUser = Mutable<PartialUser>;
// Result: { id?: number; name?: string; email?: string; }

type RequiredUser = RequiredType<PartialUser>;
// Result: { readonly id: number; readonly name: string; readonly email: string; }

type ConcreteUser = Concrete<PartialUser>;
// Result: { id: number; name: string; email: string; }
```

### Explicit Modifier Addition

The `+` prefix is the default behavior when adding modifiers, but you can make it explicit:

```typescript
type ExplicitReadonly<T> = {
  +readonly [K in keyof T]: T[K];
};

type ExplicitOptional<T> = {
  [K in keyof T]+?: T[K];
};

// These are equivalent to:
type Readonly<T> = { readonly [K in keyof T]: T[K] };
type Partial<T> = { [K in keyof T]?: T[K] };
```

## Key Remapping with `as`

TypeScript 4.1 introduced key remapping in mapped types using the `as` clause. This allows you to transform keys during the mapping process.

### Basic Key Remapping

```typescript
// Prefix all keys
type Prefixed<T, P extends string> = {
  [K in keyof T as `${P}${string & K}`]: T[K];
};

interface ApiResponse {
  data: unknown;
  status: number;
  message: string;
}

type PrefixedResponse = Prefixed<ApiResponse, "response_">;
// Result: { response_data: unknown; response_status: number; response_message: string; }

// Suffix all keys
type Suffixed<T, S extends string> = {
  [K in keyof T as `${string & K}${S}`]: T[K];
};

type SuffixedResponse = Suffixed<ApiResponse, "_value">;
// Result: { data_value: unknown; status_value: number; message_value: string; }
```

### Creating Getters and Setters

```typescript
// Create getter method names
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

// Create setter method names
type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

interface Person {
  name: string;
  age: number;
  email: string;
}

type PersonGetters = Getters<Person>;
// Result: {
//   getName: () => string;
//   getAge: () => number;
//   getEmail: () => string;
// }

type PersonSetters = Setters<Person>;
// Result: {
//   setName: (value: string) => void;
//   setAge: (value: number) => void;
//   setEmail: (value: string) => void;
// }

// Combine both
type PersonAccessors = Getters<Person> & Setters<Person>;
```

### Filtering Keys

You can filter out keys by remapping them to `never`:

```typescript
// Remove properties by name
type RemoveProperty<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

interface User {
  id: number;
  name: string;
  password: string;
  createdAt: Date;
}

type SafeUser = RemoveProperty<User, "password">;
// Result: { id: number; name: string; createdAt: Date; }

// Keep only specific properties
type KeepProperty<T, K extends keyof T> = {
  [P in keyof T as P extends K ? P : never]: T[P];
};

type UserCredentials = KeepProperty<User, "name" | "password">;
// Result: { name: string; password: string; }
```

### Filtering by Value Type

```typescript
// Keep only properties of a specific type
type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

// Remove properties of a specific type
type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

interface Mixed {
  id: number;
  name: string;
  age: number;
  email: string;
  isActive: boolean;
  createdAt: Date;
}

type StringProperties = PickByType<Mixed, string>;
// Result: { name: string; email: string; }

type NumberProperties = PickByType<Mixed, number>;
// Result: { id: number; age: number; }

type NonStringProperties = OmitByType<Mixed, string>;
// Result: { id: number; age: number; isActive: boolean; createdAt: Date; }
```

### Extracting Function Properties

```typescript
// Extract all methods from a type
type MethodsOnly<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

// Extract all non-method properties
type PropertiesOnly<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K];
};

interface UserService {
  users: User[];
  count: number;
  getUser(id: number): User | null;
  createUser(data: Partial<User>): User;
  deleteUser(id: number): boolean;
}

type UserServiceMethods = MethodsOnly<UserService>;
// Result: {
//   getUser: (id: number) => User | null;
//   createUser: (data: Partial<User>) => User;
//   deleteUser: (id: number) => boolean;
// }

type UserServiceProperties = PropertiesOnly<UserService>;
// Result: { users: User[]; count: number; }
```

## Built-in Mapped Types

TypeScript provides several built-in mapped types as utility types. Understanding their implementation helps you create custom ones.

### Partial\<T\>

Makes all properties optional:

```typescript
// Implementation
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Usage
interface Todo {
  title: string;
  description: string;
  completed: boolean;
}

function updateTodo(todo: Todo, updates: Partial<Todo>): Todo {
  return { ...todo, ...updates };
}

const todo: Todo = {
  title: "Learn TypeScript",
  description: "Study mapped types",
  completed: false
};

updateTodo(todo, { completed: true }); // Valid
updateTodo(todo, { title: "Master TypeScript" }); // Valid
```

### Required\<T\>

Makes all properties required:

```typescript
// Implementation
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Usage
interface Props {
  name?: string;
  age?: number;
  email?: string;
}

type RequiredProps = Required<Props>;
// Result: { name: string; age: number; email: string; }

function createUser(props: Required<Props>) {
  // All properties guaranteed to exist
  console.log(props.name, props.age, props.email);
}
```

### Readonly\<T\>

Makes all properties readonly:

```typescript
// Implementation
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Usage
interface State {
  count: number;
  items: string[];
}

const initialState: Readonly<State> = {
  count: 0,
  items: []
};

// Error: Cannot assign to 'count' because it is a read-only property
// initialState.count = 1;

// Note: Readonly is shallow - nested objects are still mutable
// initialState.items.push("item"); // This works!
```

### Pick\<T, K\>

Creates a type by picking specific properties:

```typescript
// Implementation
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Usage
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

type PublicUser = Pick<User, "id" | "name" | "email">;
// Result: { id: number; name: string; email: string; }

type UserCredentials = Pick<User, "email" | "password">;
// Result: { email: string; password: string; }
```

### Record\<K, T\>

Creates an object type with keys of type K and values of type T:

```typescript
// Implementation
type Record<K extends keyof any, T> = {
  [P in K]: T;
};

// Usage
type PageInfo = {
  title: string;
  url: string;
};

type Pages = "home" | "about" | "contact";

const pages: Record<Pages, PageInfo> = {
  home: { title: "Home", url: "/" },
  about: { title: "About Us", url: "/about" },
  contact: { title: "Contact", url: "/contact" }
};

// Dynamic keys
type UserRoles = Record<string, string[]>;

const roles: UserRoles = {
  admin: ["read", "write", "delete"],
  user: ["read"],
  guest: []
};
```

### Omit\<T, K\>

Creates a type by omitting specific properties:

```typescript
// Implementation (uses Pick and Exclude)
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

// Usage
interface Article {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

type CreateArticleInput = Omit<Article, "id" | "createdAt" | "updatedAt">;
// Result: { title: string; content: string; author: string; }

type ArticleMetadata = Omit<Article, "content">;
// Result: { id: number; title: string; author: string; createdAt: Date; updatedAt: Date; }
```

## Template Literal Types in Mapped Types

Template literal types combined with mapped types enable powerful string manipulation at the type level.

### Case Conversion

```typescript
// Convert keys to SCREAMING_SNAKE_CASE
type ScreamingSnakeCase<T> = {
  [K in keyof T as Uppercase<string & K>]: T[K];
};

interface config {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

type EnvConfig = ScreamingSnakeCase<config>;
// Result: { APIKEY: string; BASEURL: string; TIMEOUT: number; }

// Convert keys to lowercase
type LowercaseKeys<T> = {
  [K in keyof T as Lowercase<string & K>]: T[K];
};

interface API {
  GET: () => void;
  POST: () => void;
  DELETE: () => void;
}

type LowercaseAPI = LowercaseKeys<API>;
// Result: { get: () => void; post: () => void; delete: () => void; }
```

### Event Handler Types

```typescript
// Create event handler types
type EventHandlers<T extends string> = {
  [K in T as `on${Capitalize<K>}`]: (event: Event) => void;
};

type DomEvents = "click" | "focus" | "blur" | "submit";

type DomEventHandlers = EventHandlers<DomEvents>;
// Result: {
//   onClick: (event: Event) => void;
//   onFocus: (event: Event) => void;
//   onBlur: (event: Event) => void;
//   onSubmit: (event: Event) => void;
// }

// More specific event types
type TypedEventHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}Change`]: (value: T[K]) => void;
};

interface FormData {
  name: string;
  age: number;
  email: string;
}

type FormHandlers = TypedEventHandlers<FormData>;
// Result: {
//   onNameChange: (value: string) => void;
//   onAgeChange: (value: number) => void;
//   onEmailChange: (value: string) => void;
// }
```

### API Endpoint Types

```typescript
// Generate API endpoint types
type ApiEndpoints<T extends string> = {
  [K in T as `fetch${Capitalize<K>}`]: () => Promise<unknown>;
} & {
  [K in T as `create${Capitalize<K>}`]: (data: unknown) => Promise<unknown>;
} & {
  [K in T as `update${Capitalize<K>}`]: (id: string, data: unknown) => Promise<unknown>;
} & {
  [K in T as `delete${Capitalize<K>}`]: (id: string) => Promise<boolean>;
};

type Resources = "user" | "post" | "comment";

type Api = ApiEndpoints<Resources>;
// Result includes: fetchUser, createUser, updateUser, deleteUser, fetchPost, etc.
```

## Conditional Types in Mapped Types

Combining conditional types with mapped types creates highly flexible type transformations.

### Value Transformation

```typescript
// Wrap all non-function values in a Promise
type AsyncProperties<T> = {
  [K in keyof T]: T[K] extends Function ? T[K] : Promise<T[K]>;
};

interface SyncData {
  name: string;
  age: number;
  greet: () => string;
  calculate: (x: number) => number;
}

type AsyncData = AsyncProperties<SyncData>;
// Result: {
//   name: Promise<string>;
//   age: Promise<number>;
//   greet: () => string;
//   calculate: (x: number) => number;
// }

// Make primitives nullable
type NullablePrimitives<T> = {
  [K in keyof T]: T[K] extends string | number | boolean ? T[K] | null : T[K];
};

interface UserData {
  name: string;
  age: number;
  isActive: boolean;
  metadata: { lastLogin: Date };
}

type NullableUserData = NullablePrimitives<UserData>;
// Result: {
//   name: string | null;
//   age: number | null;
//   isActive: boolean | null;
//   metadata: { lastLogin: Date };
// }
```

### Conditional Key Filtering

```typescript
// Get keys of optional properties
type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// Get keys of required properties
type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

interface MixedProperties {
  required1: string;
  required2: number;
  optional1?: boolean;
  optional2?: Date;
}

type OptionalProps = OptionalKeys<MixedProperties>;
// Result: "optional1" | "optional2"

type RequiredProps = RequiredKeys<MixedProperties>;
// Result: "required1" | "required2"
```

### Extracting Array Element Types

```typescript
// Transform array properties to their element types
type UnwrapArrays<T> = {
  [K in keyof T]: T[K] extends (infer U)[] ? U : T[K];
};

interface DataWithArrays {
  users: { id: number; name: string }[];
  tags: string[];
  count: number;
}

type UnwrappedData = UnwrapArrays<DataWithArrays>;
// Result: {
//   users: { id: number; name: string };
//   tags: string;
//   count: number;
// }

// Wrap all properties in arrays
type WrapInArrays<T> = {
  [K in keyof T]: T[K][];
};

type ArrayData = WrapInArrays<{ name: string; age: number }>;
// Result: { name: string[]; age: number[]; }
```

## Recursive Mapped Types

Recursive mapped types allow you to transform deeply nested structures.

### DeepReadonly

```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

interface NestedState {
  user: {
    profile: {
      name: string;
      settings: {
        theme: string;
        notifications: boolean;
      };
    };
  };
  count: number;
}

type ImmutableState = DeepReadonly<NestedState>;
// All nested properties are readonly

const state: ImmutableState = {
  user: {
    profile: {
      name: "John",
      settings: {
        theme: "dark",
        notifications: true
      }
    }
  },
  count: 0
};

// Error: Cannot assign to 'theme' because it is a read-only property
// state.user.profile.settings.theme = "light";
```

### DeepPartial

```typescript
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};

interface Config {
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
    url: string;
    poolSize: number;
  };
}

type PartialConfig = DeepPartial<Config>;

// Valid - can specify any subset of the config
const config: PartialConfig = {
  server: {
    ssl: {
      enabled: true
    }
  }
};
```

### DeepRequired

```typescript
type DeepRequired<T> = {
  [K in keyof T]-?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepRequired<T[K]>
    : T[K];
};

interface OptionalConfig {
  api?: {
    baseUrl?: string;
    timeout?: number;
    headers?: {
      authorization?: string;
    };
  };
}

type RequiredConfig = DeepRequired<OptionalConfig>;
// All nested properties are required
```

### DeepMutable

```typescript
type DeepMutable<T> = {
  -readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepMutable<T[K]>
    : T[K];
};

type MutableState = DeepMutable<ImmutableState>;
// All nested properties are mutable
```

## Advanced Patterns

### Discriminated Union Helpers

```typescript
// Extract discriminated union variants
type ExtractVariant<T, K extends string, V> = T extends { [key in K]: V }
  ? T
  : never;

type Action =
  | { type: "increment"; payload: number }
  | { type: "decrement"; payload: number }
  | { type: "reset" }
  | { type: "set"; payload: { value: number } };

type IncrementAction = ExtractVariant<Action, "type", "increment">;
// Result: { type: "increment"; payload: number }

// Create action creators from discriminated unions
type ActionCreators<T extends { type: string }> = {
  [K in T["type"]]: T extends { type: K }
    ? T extends { payload: infer P }
      ? (payload: P) => T
      : () => T
    : never;
};

type Creators = ActionCreators<Action>;
// Result: {
//   increment: (payload: number) => { type: "increment"; payload: number };
//   decrement: (payload: number) => { type: "decrement"; payload: number };
//   reset: () => { type: "reset" };
//   set: (payload: { value: number }) => { type: "set"; payload: { value: number } };
// }
```

### Path Types

```typescript
// Generate all possible paths through an object
type Paths<T, P extends string = ""> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? P extends ""
          ? K | `${K}.${Paths<T[K], K>}`
          : `${K}` | `${K}.${Paths<T[K], `${P}.${K}`>}`
        : never;
    }[keyof T]
  : never;

interface DeepObject {
  user: {
    name: string;
    address: {
      city: string;
      country: string;
    };
  };
  settings: {
    theme: string;
  };
}

type AllPaths = Paths<DeepObject>;
// Result: "user" | "user.name" | "user.address" | "user.address.city" | "user.address.country" | "settings" | "settings.theme"

// Get value type at a path
type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

type CityType = PathValue<DeepObject, "user.address.city">;
// Result: string
```

### Builder Pattern Types

```typescript
// Type-safe builder pattern
type Builder<T, Built extends Partial<T> = {}> = {
  [K in keyof Omit<T, keyof Built> as `set${Capitalize<string & K>}`]: (
    value: T[K]
  ) => Builder<T, Built & Pick<T, K>>;
} & ([keyof Omit<T, keyof Built>] extends [never]
  ? { build: () => T }
  : {});

interface Car {
  make: string;
  model: string;
  year: number;
}

// The builder type ensures all properties are set before build() is available
declare function createCarBuilder(): Builder<Car>;

const builder = createCarBuilder();

const car = builder
  .setMake("Toyota")
  .setModel("Camry")
  .setYear(2024)
  .build(); // Only available after all properties are set
```

### Form Validation Types

```typescript
// Create validation result types
type ValidationResult<T> = {
  [K in keyof T]: {
    value: T[K];
    isValid: boolean;
    errors: string[];
  };
};

// Create validator function types
type Validators<T> = {
  [K in keyof T]?: ((value: T[K]) => string | null)[];
};

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

type LoginValidationResult = ValidationResult<LoginForm>;
// Result: {
//   email: { value: string; isValid: boolean; errors: string[] };
//   password: { value: string; isValid: boolean; errors: string[] };
//   rememberMe: { value: boolean; isValid: boolean; errors: string[] };
// }

type LoginValidators = Validators<LoginForm>;
// Result: {
//   email?: ((value: string) => string | null)[];
//   password?: ((value: string) => string | null)[];
//   rememberMe?: ((value: boolean) => string | null)[];
// }
```

## Real-World Examples

### API Client Type Generator

```typescript
// Define endpoint configurations
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface EndpointConfig {
  method: HttpMethod;
  path: string;
  params?: Record<string, unknown>;
  body?: unknown;
  response: unknown;
}

// Generate typed API client from endpoint configs
type ApiClient<T extends Record<string, EndpointConfig>> = {
  [K in keyof T]: T[K]["body"] extends undefined
    ? T[K]["params"] extends undefined
      ? () => Promise<T[K]["response"]>
      : (params: T[K]["params"]) => Promise<T[K]["response"]>
    : T[K]["params"] extends undefined
      ? (body: T[K]["body"]) => Promise<T[K]["response"]>
      : (params: T[K]["params"], body: T[K]["body"]) => Promise<T[K]["response"]>;
};

// Define endpoints
interface Endpoints {
  getUser: {
    method: "GET";
    path: "/users/:id";
    params: { id: string };
    response: { id: string; name: string };
  };
  createUser: {
    method: "POST";
    path: "/users";
    body: { name: string; email: string };
    response: { id: string; name: string; email: string };
  };
  listUsers: {
    method: "GET";
    path: "/users";
    response: Array<{ id: string; name: string }>;
  };
}

type MyApiClient = ApiClient<Endpoints>;
// Result:
// {
//   getUser: (params: { id: string }) => Promise<{ id: string; name: string }>;
//   createUser: (body: { name: string; email: string }) => Promise<{ id: string; name: string; email: string }>;
//   listUsers: () => Promise<Array<{ id: string; name: string }>>;
// }
```

### State Management Types

```typescript
// Redux-style action types
type ActionMap<M extends Record<string, any>> = {
  [K in keyof M]: M[K] extends undefined
    ? { type: K }
    : { type: K; payload: M[K] };
};

type PayloadMap = {
  SET_USER: { id: string; name: string };
  SET_LOADING: boolean;
  CLEAR_ERROR: undefined;
  SET_ERROR: string;
};

type Actions = ActionMap<PayloadMap>[keyof ActionMap<PayloadMap>];
// Result: Union of all action types

// Type-safe reducer
type Reducer<S, A extends { type: string }> = (state: S, action: A) => S;

interface AppState {
  user: { id: string; name: string } | null;
  loading: boolean;
  error: string | null;
}

const reducer: Reducer<AppState, Actions> = (state, action) => {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload }; // payload is typed
    case "SET_LOADING":
      return { ...state, loading: action.payload }; // payload is boolean
    case "CLEAR_ERROR":
      return { ...state, error: null }; // no payload
    case "SET_ERROR":
      return { ...state, error: action.payload }; // payload is string
    default:
      return state;
  }
};
```

### Event Emitter Types

```typescript
// Type-safe event emitter
type EventMap = Record<string, any>;

type EventHandler<T> = (event: T) => void;

type EventEmitterMethods<T extends EventMap> = {
  on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
  off<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
  once<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
};

interface AppEvents {
  userLogin: { userId: string; timestamp: Date };
  userLogout: { userId: string };
  error: { message: string; code: number };
  notification: { title: string; body: string };
}

declare class EventEmitter<T extends EventMap> implements EventEmitterMethods<T> {
  on<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
  off<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
  emit<K extends keyof T>(event: K, data: T[K]): void;
  once<K extends keyof T>(event: K, handler: EventHandler<T[K]>): void;
}

const emitter = new EventEmitter<AppEvents>();

emitter.on("userLogin", (event) => {
  // event is typed as { userId: string; timestamp: Date }
  console.log(event.userId, event.timestamp);
});

emitter.emit("error", { message: "Something went wrong", code: 500 });
// Type-safe: must match the error event signature
```

### Database ORM Types

```typescript
// Type-safe query builder
type WhereClause<T> = {
  [K in keyof T]?: T[K] | { $eq?: T[K]; $ne?: T[K]; $gt?: T[K]; $lt?: T[K] };
};

type SelectClause<T> = {
  [K in keyof T]?: boolean;
};

type OrderByClause<T> = {
  [K in keyof T]?: "asc" | "desc";
};

interface QueryBuilder<T> {
  where(clause: WhereClause<T>): QueryBuilder<T>;
  select<K extends keyof T>(fields: K[]): QueryBuilder<Pick<T, K>>;
  orderBy(clause: OrderByClause<T>): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  execute(): Promise<T[]>;
}

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  createdAt: Date;
}

declare function query<T>(table: string): QueryBuilder<T>;

const users = await query<User>("users")
  .where({ age: { $gt: 18 }, name: "John" })
  .select(["id", "name", "email"])
  .orderBy({ createdAt: "desc" })
  .limit(10)
  .execute();
// Result type: Pick<User, "id" | "name" | "email">[]
```

## Best Practices

### Keep Mapped Types Simple

```typescript
// Prefer composing simple mapped types over complex single types

// Complex and hard to understand
type ComplexType<T> = {
  [K in keyof T as T[K] extends Function
    ? never
    : K extends string
      ? `get${Capitalize<K>}`
      : never]: () => T[K];
};

// Better: Compose simpler types
type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

type StringKeys<T> = Extract<keyof T, string>;

type Getterify<T, K extends keyof T> = {
  [P in K as `get${Capitalize<string & P>}`]: () => T[P];
};

type BetterType<T> = Getterify<T, NonFunctionKeys<T> & StringKeys<T>>;
```

### Use Meaningful Names

```typescript
// Bad: Unclear purpose
type M<T> = { [K in keyof T]?: T[K] };

// Good: Self-documenting
type OptionalProperties<T> = { [K in keyof T]?: T[K] };

// Even better: Add JSDoc
/**
 * Makes all properties of T optional.
 * Useful for update operations where only some fields need to change.
 */
type OptionalUpdate<T> = { [K in keyof T]?: T[K] };
```

### Leverage Built-in Utilities

```typescript
// Prefer built-in types when they fit your needs

// Don't reinvent the wheel
type MyPartial<T> = { [K in keyof T]?: T[K] };

// Use the built-in type
type Update<T> = Partial<T>;

// Compose built-ins for complex needs
type SafeUpdate<T> = Partial<Omit<T, "id" | "createdAt">>;
```

### Handle Edge Cases

```typescript
// Consider arrays, functions, and other special types

// Naive deep readonly doesn't handle arrays correctly
type NaiveDeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? NaiveDeepReadonly<T[K]> : T[K];
};

// Better: Handle arrays and functions
type DeepReadonly<T> = T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends Function
    ? T
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T;
```

### Test Your Mapped Types

```typescript
// Use type assertions to verify behavior

type Assert<T, Expected> = T extends Expected
  ? Expected extends T
    ? true
    : false
  : false;

// Test your mapped type
type TestPartial = Assert<Partial<{ a: string }>, { a?: string }>;
//    ^? type TestPartial = true

type TestRequired = Assert<Required<{ a?: string }>, { a: string }>;
//    ^? type TestRequired = true

// This helps catch regressions when modifying mapped types
```

### Document Complex Types

```typescript
/**
 * Transforms an object type into a type where each property
 * is wrapped in a getter function.
 *
 * @template T - The source object type
 *
 * @example
 * interface User { name: string; age: number; }
 * type UserGetters = Getters<User>;
 * // Result: { getName: () => string; getAge: () => number; }
 */
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
```

## Conclusion

Mapped types are a cornerstone of advanced TypeScript programming, enabling powerful type transformations that keep your code DRY and type-safe. They provide the foundation for many of TypeScript's built-in utility types and open up possibilities for creating domain-specific type utilities tailored to your needs.

Key takeaways:

- Mapped types iterate over properties to create new types
- Property modifiers (`readonly`, `?`) can be added or removed
- Key remapping with `as` enables key transformation and filtering
- Template literal types enable string manipulation of keys
- Recursive mapped types handle deeply nested structures
- Conditional types within mapped types provide fine-grained control
- Built-in utility types like `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, and `Record` are all implemented using mapped types

With practice, mapped types become indispensable for creating robust, maintainable TypeScript applications. Start with simple transformations and gradually work toward more complex patterns as your understanding deepens.
