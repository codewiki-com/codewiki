---
title: TypeScript Template Literal Types
description: Master TypeScript template literal types for powerful string type constraints
track: typescript
section: generics-advanced
difficulty: advanced
tags:
  - TypeScript
  - template literals
  - type programming
status: imported
origin: old/src/content/docs/typescript/template-literal-types.en.md
divergence: 0.142
issues: []
legacy:
  category: TypeScript
  subcategory: Advanced Types
  order: 14
  lastUpdated: 2026-01-07
---

Template literal types are one of the most powerful features introduced in TypeScript 4.1. They allow you to perform string manipulation at the type level, enabling precise type constraints for string-based APIs, configuration objects, and domain-specific patterns. We'll cover template literal types comprehensively, from basic syntax to advanced real-world applications.

## Introduction

### What Are Template Literal Types?

Template literal types build upon JavaScript's template literal strings, bringing that same interpolation syntax to the type system. Just as you can use `${expression}` in runtime strings, you can use `${Type}` in type definitions to create new string literal types dynamically.

```typescript
// JavaScript template literal (runtime)
const greeting = `Hello, ${name}!`;

// TypeScript template literal type (compile-time)
type Greeting = `Hello, ${string}!`;

const g1: Greeting = "Hello, World!";     // OK
const g2: Greeting = "Hello, TypeScript!"; // OK
// const g3: Greeting = "Hi, World!";     // Error: Type '"Hi, World!"' is not assignable
```

### Why Template Literal Types Matter

Template literal types solve several important problems in TypeScript development:

1. **Type-Safe String APIs**: Enforce specific string patterns at compile time
2. **Automatic Type Generation**: Create derived types from existing string unions
3. **Configuration Validation**: Ensure configuration keys follow naming conventions
4. **Event Systems**: Type-safe event names and handlers
5. **CSS-in-JS**: Validate CSS property names and values
6. **Route Definitions**: Extract parameters from URL patterns

## Basic Syntax and Concepts

### Simple Template Literal Types

The most basic form of template literal types combines string literals with type placeholders:

```typescript
// Basic string pattern
type EmailDomain = `@${string}.com`;

const validEmail: EmailDomain = "@example.com";     // OK
// const invalidEmail: EmailDomain = "@example.org"; // Error

// Combining with specific literals
type Protocol = "http" | "https";
type URL = `${Protocol}://${string}`;

const secureUrl: URL = "https://example.com";  // OK
const insecureUrl: URL = "http://localhost";   // OK
// const invalidUrl: URL = "ftp://files.com";  // Error

// Fixed prefix and suffix
type ClassName = `class-${string}`;
type IdSelector = `#${string}`;

const className: ClassName = "class-container";  // OK
const idSelector: IdSelector = "#main-content";  // OK
```

### Union Type Distribution

When template literal types include union types, TypeScript automatically generates all possible combinations:

```typescript
type Size = "small" | "medium" | "large";
type Color = "red" | "blue" | "green";

// Generates 9 combinations (3 x 3)
type SizeColorClass = `${Size}-${Color}`;
// "small-red" | "small-blue" | "small-green" |
// "medium-red" | "medium-blue" | "medium-green" |
// "large-red" | "large-blue" | "large-green"

// Practical example: CSS utility classes
type Spacing = "0" | "1" | "2" | "4" | "8";
type Direction = "t" | "r" | "b" | "l" | "x" | "y";
type SpacingClass = `p${Direction}-${Spacing}` | `m${Direction}-${Spacing}`;
// "pt-0" | "pt-1" | ... | "my-8" (60 combinations)

// Multiple unions multiply
type Axis = "x" | "y" | "z";
type Sign = "+" | "-";
type Coordinate = `${Axis}${Sign}`;
// "x+" | "x-" | "y+" | "y-" | "z+" | "z-"
```

### Combining with Other Types

Template literal types work seamlessly with other TypeScript type features:

```typescript
// With number literals (converted to string)
type Port = 80 | 443 | 8080;
type LocalhostURL = `http://localhost:${Port}`;
// "http://localhost:80" | "http://localhost:443" | "http://localhost:8080"

// With boolean
type FeatureFlag = `feature_${string}_enabled_${boolean}`;
const flag: FeatureFlag = "feature_darkMode_enabled_true";  // OK

// With bigint
type BigIntString = `${bigint}n`;
const big: BigIntString = "9007199254740991n";  // OK

// Nested template literals
type Env = "dev" | "staging" | "prod";
type Region = "us" | "eu" | "asia";
type Endpoint = `https://${Env}.${Region}.api.example.com`;
// Generates 9 endpoint combinations
```

## Intrinsic String Manipulation Types

TypeScript provides four built-in utility types for string manipulation at the type level. These are implemented directly in the compiler for performance.

### Uppercase<StringType>

Converts each character in the string to uppercase:

```typescript
type Shouting = Uppercase<"hello world">;  // "HELLO WORLD"

type EventName = "click" | "mouseenter" | "mouseleave";
type UpperEventName = Uppercase<EventName>;
// "CLICK" | "MOUSEENTER" | "MOUSELEAVE"

// Practical use: HTTP methods
type HttpMethod = "get" | "post" | "put" | "delete";
type UpperHttpMethod = Uppercase<HttpMethod>;
// "GET" | "POST" | "PUT" | "DELETE"

// Creating screaming case constants
type Config = {
  apiKey: string;
  baseUrl: string;
};

type EnvVarName<K extends string> = `APP_${Uppercase<K>}`;
type ConfigEnvVars = EnvVarName<keyof Config>;
// "APP_APIKEY" | "APP_BASEURL"
```

### Lowercase<StringType>

Converts each character in the string to lowercase:

```typescript
type Quiet = Lowercase<"HELLO WORLD">;  // "hello world"

type StatusCode = "OK" | "NOT_FOUND" | "INTERNAL_ERROR";
type LowerStatus = Lowercase<StatusCode>;
// "ok" | "not_found" | "internal_error"

// Converting to lowercase file extensions
type ImageFormat = "PNG" | "JPG" | "GIF" | "WEBP";
type FileExtension = `.${Lowercase<ImageFormat>}`;
// ".png" | ".jpg" | ".gif" | ".webp"

// Normalizing input
type NormalizedInput<T extends string> = Lowercase<T>;
type UserInput = NormalizedInput<"JohnDoe">;  // "johndoe"
```

### Capitalize<StringType>

Converts the first character to uppercase:

```typescript
type Capitalized = Capitalize<"hello">;  // "Hello"

type Status = "pending" | "active" | "completed";
type CapitalizedStatus = Capitalize<Status>;
// "Pending" | "Active" | "Completed"

// Creating getter method names
type Property = "name" | "age" | "email";
type Getter<P extends string> = `get${Capitalize<P>}`;
type Getters = Getter<Property>;
// "getName" | "getAge" | "getEmail"

// Event handler naming convention
type DomEvent = "click" | "focus" | "blur" | "change";
type EventHandler<E extends string> = `on${Capitalize<E>}`;
type Handlers = EventHandler<DomEvent>;
// "onClick" | "onFocus" | "onBlur" | "onChange"
```

### Uncapitalize<StringType>

Converts the first character to lowercase:

```typescript
type Uncapitalized = Uncapitalize<"Hello">;  // "hello"

type ComponentName = "Header" | "Footer" | "Sidebar";
type InstanceName = Uncapitalize<ComponentName>;
// "header" | "footer" | "sidebar"

// Converting PascalCase to camelCase (first letter)
type ServiceClass = "UserService" | "AuthService" | "DataService";
type ServiceInstance = Uncapitalize<ServiceClass>;
// "userService" | "authService" | "dataService"

// CSS custom properties from TypeScript
type ThemeKey = "PrimaryColor" | "SecondaryColor" | "BackgroundColor";
type CSSVariable = `--${Uncapitalize<ThemeKey>}`;
// "--primaryColor" | "--secondaryColor" | "--backgroundColor"
```

### Combining Intrinsic Types

These utilities can be combined for more complex transformations:

```typescript
// SCREAMING_SNAKE_CASE to Title Case (simplified)
type ToTitleCase<S extends string> = Capitalize<Lowercase<S>>;

type ApiResponse = ToTitleCase<"SUCCESS">;  // "Success"

// Creating database column names from property names
type ToSnakeCase<S extends string> = Lowercase<S>;
type ColumnName<S extends string> = `${ToSnakeCase<S>}_column`;

// Complex transformation chain
type Format<S extends string> = `[${Uppercase<S>}]`;
type LogLevel = "debug" | "info" | "warn" | "error";
type FormattedLevel = Format<LogLevel>;
// "[DEBUG]" | "[INFO]" | "[WARN]" | "[ERROR]"
```

## Pattern Matching with Infer

The `infer` keyword enables powerful pattern matching within template literal types, allowing you to extract portions of strings as types.

### Basic Pattern Extraction

```typescript
// Extract the part after a prefix
type ExtractAfter<S extends string, Prefix extends string> =
  S extends `${Prefix}${infer Rest}` ? Rest : never;

type UserId = ExtractAfter<"user_123", "user_">;  // "123"
type OrderId = ExtractAfter<"order_456", "order_">;  // "456"

// Extract the part before a suffix
type ExtractBefore<S extends string, Suffix extends string> =
  S extends `${infer Start}${Suffix}` ? Start : never;

type FileName = ExtractBefore<"document.pdf", ".pdf">;  // "document"

// Extract between delimiters
type ExtractBetween<
  S extends string,
  Start extends string,
  End extends string
> = S extends `${Start}${infer Middle}${End}` ? Middle : never;

type TagContent = ExtractBetween<"<div>Hello</div>", "<div>", "</div>">;  // "Hello"
```

### Multiple Pattern Variables

You can use multiple `infer` declarations in a single pattern:

```typescript
// Extract multiple parts
type ParseUrl<S extends string> =
  S extends `${infer Protocol}://${infer Host}/${infer Path}`
    ? { protocol: Protocol; host: Host; path: Path }
    : never;

type UrlParts = ParseUrl<"https://example.com/api/users">;
// { protocol: "https"; host: "example.com"; path: "api/users" }

// Parse key-value pairs
type ParseKeyValue<S extends string> =
  S extends `${infer Key}=${infer Value}`
    ? { key: Key; value: Value }
    : never;

type Parsed = ParseKeyValue<"name=John">;
// { key: "name"; value: "John" }

// Extract parts from semantic versioning
type ParseSemVer<S extends string> =
  S extends `${infer Major}.${infer Minor}.${infer Patch}`
    ? { major: Major; minor: Minor; patch: Patch }
    : never;

type Version = ParseSemVer<"1.2.3">;
// { major: "1"; minor: "2"; patch: "3" }
```

### Recursive Pattern Matching

Template literal types support recursion for complex parsing:

```typescript
// Split string by delimiter
type Split<S extends string, D extends string> =
  S extends `${infer First}${D}${infer Rest}`
    ? [First, ...Split<Rest, D>]
    : S extends ""
      ? []
      : [S];

type Parts = Split<"a-b-c-d", "-">;  // ["a", "b", "c", "d"]
type Words = Split<"hello world", " ">;  // ["hello", "world"]

// Join array to string
type Join<T extends string[], D extends string> =
  T extends []
    ? ""
    : T extends [infer Only extends string]
      ? Only
      : T extends [infer First extends string, ...infer Rest extends string[]]
        ? `${First}${D}${Join<Rest, D>}`
        : never;

type Joined = Join<["a", "b", "c"], "-">;  // "a-b-c"

// Reverse a string
type ReverseString<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? `${ReverseString<Rest>}${First}`
    : "";

type Reversed = ReverseString<"hello">;  // "olleh"

// String to union of characters
type StringToUnion<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? First | StringToUnion<Rest>
    : never;

type Chars = StringToUnion<"abc">;  // "a" | "b" | "c"
```

## Case Transformation Patterns

One of the most practical applications of template literal types is converting between naming conventions.

### CamelCase to Other Formats

```typescript
// CamelCase to kebab-case
type CamelToKebab<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? First extends Lowercase<First>
      ? `${First}${CamelToKebab<Rest>}`
      : `-${Lowercase<First>}${CamelToKebab<Rest>}`
    : S;

type KebabCase = CamelToKebab<"backgroundColor">;  // "background-color"
type KebabCase2 = CamelToKebab<"fontSize">;  // "font-size"

// CamelCase to snake_case
type CamelToSnake<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? First extends Lowercase<First>
      ? `${First}${CamelToSnake<Rest>}`
      : `_${Lowercase<First>}${CamelToSnake<Rest>}`
    : S;

type SnakeCase = CamelToSnake<"getUserById">;  // "get_user_by_id"

// CamelCase to PascalCase
type CamelToPascal<S extends string> = Capitalize<S>;

type PascalCase = CamelToPascal<"myComponent">;  // "MyComponent"
```

### Snake_Case and Kebab-Case Conversions

```typescript
// snake_case to camelCase
type SnakeToCamel<S extends string> =
  S extends `${infer First}_${infer Rest}`
    ? `${Lowercase<First>}${Capitalize<SnakeToCamel<Rest>>}`
    : Lowercase<S>;

type CamelFromSnake = SnakeToCamel<"user_first_name">;  // "userFirstName"

// snake_case to PascalCase
type SnakeToPascal<S extends string> = Capitalize<SnakeToCamel<S>>;

type PascalFromSnake = SnakeToPascal<"user_first_name">;  // "UserFirstName"

// kebab-case to camelCase
type KebabToCamel<S extends string> =
  S extends `${infer First}-${infer Rest}`
    ? `${Lowercase<First>}${Capitalize<KebabToCamel<Rest>>}`
    : Lowercase<S>;

type CamelFromKebab = KebabToCamel<"background-color">;  // "backgroundColor"

// kebab-case to PascalCase
type KebabToPascal<S extends string> = Capitalize<KebabToCamel<S>>;

type PascalFromKebab = KebabToPascal<"my-component">;  // "MyComponent"
```

### Handling Edge Cases

```typescript
// Handle consecutive uppercase letters (e.g., "XMLHttpRequest")
type CamelToKebabAdvanced<S extends string> =
  S extends `${infer First}${infer Second}${infer Rest}`
    ? First extends Uppercase<First>
      ? Second extends Uppercase<Second>
        ? `${Lowercase<First>}${CamelToKebabAdvanced<`${Second}${Rest}`>}`
        : `-${Lowercase<First>}${CamelToKebabAdvanced<`${Second}${Rest}`>}`
      : `${First}${CamelToKebabAdvanced<`${Second}${Rest}`>}`
    : S extends `${infer Last}`
      ? Lowercase<Last>
      : "";

// Handle empty strings and single characters
type SafeCamelToKebab<S extends string> =
  S extends ""
    ? ""
    : S extends `${infer Only}`
      ? Lowercase<Only>
      : CamelToKebab<S>;
```

## Real-World Applications

### Type-Safe Event Systems

```typescript
// Define event map
type Events = {
  userLogin: { userId: string; timestamp: Date };
  userLogout: { userId: string };
  pageView: { path: string; referrer?: string };
  buttonClick: { buttonId: string; label: string };
};

// Generate event handler types
type EventHandler<E extends keyof Events> = `on${Capitalize<string & E>}`;

type AllHandlers = EventHandler<keyof Events>;
// "onUserLogin" | "onUserLogout" | "onPageView" | "onButtonClick"

// Type-safe event emitter
class TypedEventEmitter<E extends Record<string, unknown>> {
  private listeners: Partial<{
    [K in keyof E]: Array<(payload: E[K]) => void>;
  }> = {};

  on<K extends keyof E>(event: K, handler: (payload: E[K]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(handler);
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void {
    this.listeners[event]?.forEach(handler => handler(payload));
  }
}

const emitter = new TypedEventEmitter<Events>();

emitter.on("userLogin", ({ userId, timestamp }) => {
  console.log(`User ${userId} logged in at ${timestamp}`);
});

emitter.emit("userLogin", { userId: "123", timestamp: new Date() });  // OK
// emitter.emit("userLogin", { userId: "123" });  // Error: missing timestamp
```

### Route Parameter Extraction

```typescript
// Extract route parameters from path patterns
type ExtractRouteParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParams<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
      ? Param
      : never;

type UserRouteParams = ExtractRouteParams<"/users/:userId/posts/:postId">;
// "userId" | "postId"

// Create parameter object type
type RouteParams<Path extends string> = {
  [K in ExtractRouteParams<Path>]: string;
};

type UserParams = RouteParams<"/users/:userId/posts/:postId">;
// { userId: string; postId: string }

// Type-safe route navigation
function navigate<Path extends string>(
  path: Path,
  params: RouteParams<Path>
): string {
  let result: string = path;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, value as string);
  }
  return result;
}

navigate("/users/:userId/posts/:postId", {
  userId: "123",
  postId: "456"
});  // OK

// navigate("/users/:userId", { postId: "456" });  // Error: missing userId
```

### CSS-in-JS Type Safety

```typescript
// CSS property names
type CSSProperty =
  | "color"
  | "background-color"
  | "font-size"
  | "margin"
  | "padding";

// Convert to camelCase for JavaScript
type CSSPropertyJS = KebabToCamel<CSSProperty>;
// "color" | "backgroundColor" | "fontSize" | "margin" | "padding"

// CSS custom properties
type ThemeColors = "primary" | "secondary" | "accent" | "background" | "text";
type CSSVariable = `--color-${ThemeColors}`;
// "--color-primary" | "--color-secondary" | ...

// Spacing utilities
type SpacingScale = "xs" | "sm" | "md" | "lg" | "xl";
type SpacingProperty = "margin" | "padding";
type SpacingDirection = "top" | "right" | "bottom" | "left";

type SpacingUtility = `${SpacingProperty}-${SpacingDirection}-${SpacingScale}`;
// "margin-top-xs" | "margin-top-sm" | ... (100 combinations)

// Tailwind-style utilities
type TailwindSpacing = `${"m" | "p"}${"t" | "r" | "b" | "l" | "x" | "y" | ""}-${0 | 1 | 2 | 4 | 8}`;

// Responsive prefixes
type Breakpoint = "sm" | "md" | "lg" | "xl";
type ResponsiveClass<T extends string> = T | `${Breakpoint}:${T}`;

type ResponsiveMargin = ResponsiveClass<"m-4">;
// "m-4" | "sm:m-4" | "md:m-4" | "lg:m-4" | "xl:m-4"
```

### Configuration Key Validation

```typescript
// Environment variable naming
type EnvPrefix = "APP" | "DB" | "API" | "AUTH";
type EnvSuffix = "URL" | "KEY" | "SECRET" | "HOST" | "PORT";
type EnvVar = `${EnvPrefix}_${EnvSuffix}`;

// Only valid environment variable names are accepted
const config: Record<EnvVar, string> = {
  APP_URL: "https://example.com",
  DB_HOST: "localhost",
  DB_PORT: "5432",
  API_KEY: "abc123",
  AUTH_SECRET: "secret123",
  // INVALID_KEY: "value"  // Error
};

// Feature flags
type FeatureArea = "ui" | "api" | "auth" | "payment";
type FeatureFlag = `feature.${FeatureArea}.${string}`;

function isFeatureEnabled(flag: FeatureFlag): boolean {
  // Implementation
  return true;
}

isFeatureEnabled("feature.ui.darkMode");  // OK
isFeatureEnabled("feature.auth.mfa");     // OK
// isFeatureEnabled("invalid.flag");      // Error

// Localization keys
type LocaleNamespace = "common" | "auth" | "dashboard" | "settings";
type LocaleKey = `${LocaleNamespace}.${string}`;

function translate(key: LocaleKey): string {
  return key;  // Simplified
}

translate("common.welcomeMessage");  // OK
translate("auth.loginButton");       // OK
// translate("invalid.key");         // Error
```

### API Endpoint Builder

```typescript
// RESTful API endpoints
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type ApiVersion = "v1" | "v2";
type Resource = "users" | "posts" | "comments" | "products";

type ApiEndpoint = `/${ApiVersion}/${Resource}`;
// "/v1/users" | "/v1/posts" | ... (8 combinations)

type ApiEndpointWithId = `${ApiEndpoint}/:id`;
// "/v1/users/:id" | "/v1/posts/:id" | ...

// Full route definition
type RouteDefinition = `${HttpMethod} ${ApiEndpoint | ApiEndpointWithId}`;

// Typed API client
type ApiRoutes = {
  "GET /v1/users": { response: User[] };
  "GET /v1/users/:id": { params: { id: string }; response: User };
  "POST /v1/users": { body: CreateUserDto; response: User };
  "PUT /v1/users/:id": { params: { id: string }; body: UpdateUserDto; response: User };
  "DELETE /v1/users/:id": { params: { id: string }; response: void };
};

interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserDto {
  name: string;
  email: string;
}

interface UpdateUserDto {
  name?: string;
  email?: string;
}
```

### Object Key Transformations

```typescript
// Add prefix to all keys
type PrefixKeys<T, P extends string> = {
  [K in keyof T as `${P}${string & K}`]: T[K];
};

interface User {
  id: number;
  name: string;
  email: string;
}

type PrefixedUser = PrefixKeys<User, "user_">;
// { user_id: number; user_name: string; user_email: string }

// Convert keys to getter methods
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<User>;
// { getId: () => number; getName: () => string; getEmail: () => string }

// Convert keys to setter methods
type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

type UserSetters = Setters<User>;
// { setId: (value: number) => void; setName: (value: string) => void; ... }

// Filter keys by pattern
type FilterKeysByPattern<T, Pattern extends string> = {
  [K in keyof T as K extends `${Pattern}${string}` ? K : never]: T[K];
};

interface MixedProps {
  onClick: () => void;
  onHover: () => void;
  className: string;
  style: object;
}

type EventHandlers = FilterKeysByPattern<MixedProps, "on">;
// { onClick: () => void; onHover: () => void }
```

## Advanced Patterns

### Type-Safe SQL Query Builder

```typescript
// Table and column definitions
type Tables = {
  users: {
    id: number;
    name: string;
    email: string;
    created_at: Date;
  };
  posts: {
    id: number;
    user_id: number;
    title: string;
    content: string;
  };
  comments: {
    id: number;
    post_id: number;
    user_id: number;
    text: string;
  };
};

type TableName = keyof Tables;
type ColumnName<T extends TableName> = keyof Tables[T];

// SELECT query type
type SelectColumn<T extends TableName> =
  | ColumnName<T>
  | `${T}.${string & ColumnName<T>}`;

type SelectQuery<T extends TableName> =
  `SELECT ${string} FROM ${T}${string}`;

// WHERE clause column reference
type WhereColumn<T extends TableName> =
  `${T}.${string & ColumnName<T>}` | ColumnName<T>;

// JOIN clause
type JoinType = "INNER" | "LEFT" | "RIGHT" | "FULL";
type JoinClause<T1 extends TableName, T2 extends TableName> =
  `${JoinType} JOIN ${T2} ON ${T1}.${string} = ${T2}.${string}`;

// Type-safe query builder (simplified)
class QueryBuilder<T extends TableName> {
  private table: T;
  private selectCols: string[] = [];
  private whereClauses: string[] = [];

  constructor(table: T) {
    this.table = table;
  }

  select<C extends ColumnName<T>>(...columns: C[]): this {
    this.selectCols.push(...(columns as string[]));
    return this;
  }

  where<C extends ColumnName<T>>(
    column: C,
    operator: "=" | "!=" | ">" | "<",
    value: Tables[T][C]
  ): this {
    this.whereClauses.push(`${String(column)} ${operator} ?`);
    return this;
  }

  build(): string {
    const cols = this.selectCols.length ? this.selectCols.join(", ") : "*";
    let query = `SELECT ${cols} FROM ${this.table}`;
    if (this.whereClauses.length) {
      query += ` WHERE ${this.whereClauses.join(" AND ")}`;
    }
    return query;
  }
}

const query = new QueryBuilder("users")
  .select("id", "name", "email")
  .where("id", "=", 1)
  .build();
```

### GraphQL-Style Field Selection

```typescript
// Define schema types
interface Schema {
  Query: {
    user: User;
    users: User[];
    post: Post;
  };
  User: {
    id: string;
    name: string;
    email: string;
    posts: Post[];
  };
  Post: {
    id: string;
    title: string;
    content: string;
    author: User;
  };
}

// Parse field selection string
type ParseFields<S extends string> =
  S extends `${infer Field},${infer Rest}`
    ? Field | ParseFields<Rest>
    : S extends `${infer Field}`
      ? Field
      : never;

type SelectedFields = ParseFields<"id,name,email">;
// "id" | "name" | "email"

// Pick fields from type
type SelectFromType<T, Fields extends string> = Pick<T, Extract<keyof T, Fields>>;

type PartialUser = SelectFromType<Schema["User"], "id" | "name">;
// { id: string; name: string }

// Nested field selection (simplified)
type NestedSelection<T, S extends string> =
  S extends `${infer Parent}.${infer Child}`
    ? Parent extends keyof T
      ? { [K in Parent]: NestedSelection<T[Parent], Child> }
      : never
    : S extends keyof T
      ? Pick<T, S>
      : never;
```

### State Machine Types

```typescript
// Define state machine
type State = "idle" | "loading" | "success" | "error";
type Event = "FETCH" | "RESOLVE" | "REJECT" | "RESET";

// Transition definitions as template literal types
type Transition =
  | "idle -> FETCH -> loading"
  | "loading -> RESOLVE -> success"
  | "loading -> REJECT -> error"
  | "success -> RESET -> idle"
  | "error -> RESET -> idle"
  | "error -> FETCH -> loading";

// Parse transitions
type ParseTransition<T extends string> =
  T extends `${infer From} -> ${infer Evt} -> ${infer To}`
    ? { from: From; event: Evt; to: To }
    : never;

type AllTransitions = ParseTransition<Transition>;

// Get valid events for a state
type ValidEvents<S extends State> =
  ParseTransition<Transition> extends infer T
    ? T extends { from: S; event: infer E }
      ? E
      : never
    : never;

type IdleEvents = ValidEvents<"idle">;      // "FETCH"
type LoadingEvents = ValidEvents<"loading">; // "RESOLVE" | "REJECT"
type ErrorEvents = ValidEvents<"error">;     // "RESET" | "FETCH"

// Get next state for a transition
type NextState<S extends State, E extends string> =
  ParseTransition<Transition> extends infer T
    ? T extends { from: S; event: E; to: infer Next }
      ? Next
      : never
    : never;

type AfterFetch = NextState<"idle", "FETCH">;      // "loading"
type AfterResolve = NextState<"loading", "RESOLVE">; // "success"
```

### Internationalization Keys

```typescript
// Define locale structure
type LocaleStructure = {
  common: {
    buttons: {
      submit: string;
      cancel: string;
      delete: string;
    };
    messages: {
      success: string;
      error: string;
    };
  };
  auth: {
    login: {
      title: string;
      email: string;
      password: string;
    };
    register: {
      title: string;
      confirmPassword: string;
    };
  };
};

// Generate dot-notation keys
type PathsToStringProps<T, Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends string
    ? `${Prefix}${string & K}`
    : T[K] extends object
      ? PathsToStringProps<T[K], `${Prefix}${string & K}.`>
      : never;
}[keyof T];

type LocaleKeys = PathsToStringProps<LocaleStructure>;
// "common.buttons.submit" | "common.buttons.cancel" | ...

// Type-safe translation function
function t(key: LocaleKeys): string {
  // Implementation would look up the key in locale data
  return key;
}

t("common.buttons.submit");   // OK
t("auth.login.email");        // OK
// t("invalid.key");          // Error
```

## Performance Considerations

### Limiting Union Size

Template literal types can create very large unions when combining multiple union types. Be mindful of the combinatorial explosion:

```typescript
// Warning: Large unions can slow down type checking
type Letters = "a" | "b" | "c" | "d" | "e";
type Digits = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";

// This creates 50 combinations - acceptable
type AlphaNumeric = `${Letters}${Digits}`;

// This creates 500 combinations - still OK but getting large
type TwoCharCode = `${Letters}${Digits}${Letters}`;

// Avoid: This would create 5000+ combinations
// type ThreeCharCode = `${Letters}${Digits}${Letters}${Digits}`;

// Better approach: Use branded types or runtime validation
type CharCode = string & { __brand: "CharCode" };

function createCharCode(input: string): CharCode | null {
  if (/^[a-e][0-9][a-e]$/.test(input)) {
    return input as CharCode;
  }
  return null;
}
```

### Recursive Type Depth

TypeScript has a recursion limit for types. Deep recursion can hit this limit:

```typescript
// This works for reasonable string lengths
type ReverseString<S extends string> =
  S extends `${infer First}${infer Rest}`
    ? `${ReverseString<Rest>}${First}`
    : "";

type Reversed = ReverseString<"hello">;  // "olleh" - OK

// For very long strings, consider alternative approaches
// or accept string as fallback
type SafeReverse<S extends string, Acc extends string = ""> =
  S extends `${infer First}${infer Rest}`
    ? SafeReverse<Rest, `${First}${Acc}`>
    : Acc;
```

### Using Conditional Types Wisely

```typescript
// Prefer simpler patterns when possible
// Instead of complex nested conditionals:
type ComplexPattern<S extends string> =
  S extends `${infer A}-${infer B}-${infer C}-${infer D}`
    ? { a: A; b: B; c: C; d: D }
    : S extends `${infer A}-${infer B}-${infer C}`
      ? { a: A; b: B; c: C }
      : S extends `${infer A}-${infer B}`
        ? { a: A; b: B }
        : { a: S };

// Consider using overloaded function signatures or
// breaking into smaller utility types
type SplitByDash<S extends string> = Split<S, "-">;
type FromArray<T extends string[]> =
  T extends [infer A, infer B, infer C, infer D, ...infer Rest]
    ? { a: A; b: B; c: C; d: D }
    : T extends [infer A, infer B, infer C]
      ? { a: A; b: B; c: C }
      : T extends [infer A, infer B]
        ? { a: A; b: B }
        : T extends [infer A]
          ? { a: A }
          : never;
```

## Best Practices

### Use Descriptive Type Names

```typescript
// Good: Clear and descriptive
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type ApiEndpoint = `/${string}`;
type FullRoute = `${HttpMethod} ${ApiEndpoint}`;

// Avoid: Cryptic abbreviations
type M = "GET" | "POST";
type E = `/${string}`;
type R = `${M} ${E}`;
```

### Document Complex Types

```typescript
/**
 * Extracts route parameters from a path pattern.
 *
 * @example
 * type Params = ExtractParams<"/users/:userId/posts/:postId">;
 * // Result: "userId" | "postId"
 */
type ExtractParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
      ? Param
      : never;
```

### Provide Fallback Types

```typescript
// Always handle the "never" case gracefully
type SafeExtract<S extends string, Pattern extends string> =
  S extends `${Pattern}${infer Rest}` ? Rest : S;

// Provide default values where appropriate
type ParsePort<S extends string> =
  S extends `${string}:${infer Port}`
    ? Port extends `${number}`
      ? Port
      : "80"
    : "80";
```

### Test Edge Cases

```typescript
// Test with empty strings
type EmptyTest = Split<"", "-">;  // [""]

// Test with no matches
type NoMatchTest = ExtractParams<"/static/path">;  // never

// Test with single values
type SingleTest = Split<"only", "-">;  // ["only"]
```

### Prefer Composition Over Complexity

```typescript
// Break complex transformations into smaller, reusable pieces
type ToLower<S extends string> = Lowercase<S>;
type TrimPrefix<S extends string, P extends string> =
  S extends `${P}${infer Rest}` ? Rest : S;
type ToSnake<S extends string> = CamelToSnake<S>;

// Compose them
type ProcessKey<S extends string> = ToSnake<ToLower<TrimPrefix<S, "_">>>;

// Rather than one giant type with all logic inline
```

## Common Pitfalls and Solutions

### Pitfall 1: Unexpected Union Distribution

```typescript
// Problem: Template literals distribute over unions
type Wrap<T extends string> = `[${T}]`;
type Result = Wrap<"a" | "b">;  // "[a]" | "[b]", not "[a | b]"

// Solution: If you want the literal union string, use a different approach
type UnionToString<T extends string, Acc extends string = ""> =
  [T] extends [never]
    ? Acc
    : T extends T
      ? UnionToString<Exclude<T, T>, `${Acc}${Acc extends "" ? "" : " | "}${T}`>
      : never;
```

### Pitfall 2: Infinite Recursion

```typescript
// Problem: Recursive types without base case
// type BadRecursive<S extends string> = `${S}${BadRecursive<S>}`;  // Error

// Solution: Always have a termination condition
type GoodRecursive<S extends string, Depth extends number[] = []> =
  Depth["length"] extends 10
    ? S
    : S extends `${infer First}${infer Rest}`
      ? `${First}${GoodRecursive<Rest, [...Depth, 1]>}`
      : S;
```

### Pitfall 3: Type Widening

```typescript
// Problem: String literals widen to string
function createRoute(path: string): `/${string}` {
  return `/${path}` as `/${string}`;  // Need assertion
}

// Solution: Use const assertions or generic constraints
function createRouteTyped<T extends string>(path: T): `/${T}` {
  return `/${path}`;
}

const route = createRouteTyped("users");  // Type: "/users"
```

## Summary

Template literal types are a powerful feature that brings string manipulation to TypeScript's type system. Key takeaways:

1. **Basic Usage**: Combine string literals and type placeholders to create pattern types
2. **Intrinsic Types**: Use `Uppercase`, `Lowercase`, `Capitalize`, and `Uncapitalize` for case transformations
3. **Pattern Matching**: Leverage `infer` to extract portions of string types
4. **Union Distribution**: Understand that template literals automatically distribute over unions
5. **Real-World Applications**: Type-safe routes, events, configurations, and API definitions
6. **Performance**: Be mindful of combinatorial explosion with large unions
7. **Best Practices**: Use descriptive names, document complex types, and test edge cases

Template literal types, combined with mapped types and conditional types, enable sophisticated type-level programming that can catch errors at compile time that would otherwise only surface at runtime.

## Further Reading

### Official Resources

- [TypeScript Handbook - Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
- [TypeScript 4.1 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html)
- [TypeScript Playground](https://www.typescriptlang.org/play) - Experiment with template literal types

### Community Resources

- [type-challenges](https://github.com/type-challenges/type-challenges) - Practice advanced type programming
- [Total TypeScript](https://www.totaltypescript.com/) - In-depth TypeScript tutorials
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) - Comprehensive TypeScript guide

### Useful Libraries

- [ts-toolbelt](https://github.com/millsp/ts-toolbelt) - 1000+ advanced type utilities
- [type-fest](https://github.com/sindresorhus/type-fest) - Essential type utilities
- [zod](https://github.com/colinhacks/zod) - Runtime validation with TypeScript inference

---

Mastering template literal types opens up new possibilities for type-safe APIs and domain-specific languages within TypeScript. While powerful, remember that the goal is to improve code safety and developer experience, not to create overly complex type gymnastics. Use these features judiciously to build robust, maintainable applications.
