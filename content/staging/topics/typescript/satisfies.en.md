---
title: TypeScript satisfies Operator
description: Learn about the satisfies operator introduced in TypeScript 4.9 for type validation
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - satisfies
  - type validation
status: imported
origin: old/src/content/docs/typescript/satisfies.en.md
divergence: 0.213
issues: []
legacy:
  category: TypeScript
  subcategory: Type System
  order: 15
  lastUpdated: 2026-01-07
---

The `satisfies` operator is a powerful feature introduced in TypeScript 4.9. It allows us to validate whether an expression's type conforms to a certain type constraint while preserving the expression's original inferred type. This operator fills the gap between type annotations and type assertions, providing developers with more precise type control capabilities.

## Concept Explanation

### What is satisfies?

The `satisfies` operator is used to validate whether a value meets the requirements of a certain type without changing the value's inferred type. This stands in stark contrast to traditional type annotations: type annotations "widen" the value's type to the annotated type, while `satisfies` preserves the value's literal type or more precise inferred type.

```typescript
// Using type annotation: loses literal type information
const colors1: Record<string, string> = {
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff"
};
// colors1.red has type string

// Using satisfies: preserves literal type information
const colors2 = {
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff"
} satisfies Record<string, string>;
// colors2.red has type "#ff0000"
```

### Historical Background

Before `satisfies` appeared, developers faced a dilemma:

1. **Using type annotations**: Get type checking but lose inferred literal types
2. **Not using type annotations**: Preserve literal types but lose type validation of the overall structure

The `satisfies` operator was introduced in TypeScript 4.9 (released November 2022), perfectly solving this problem. It was one of the most anticipated features by the TypeScript community for a long time.

### Core Problems Solved

1. **Maintaining type inference precision**: Does not lose literal types and narrower type information
2. **Validating type compatibility**: Ensures values conform to expected type structures
3. **Providing better auto-completion**: IDEs can provide more precise code hints
4. **Avoiding runtime errors**: Discovers type mismatches at compile time

## satisfies vs Type Annotations

### Basic Comparison

```typescript
type ColorValue = string | number[];

// Method 1: Type annotation
const palette1: Record<string, ColorValue> = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255]
};

// palette1.green has type string | number[]
// Calling string methods requires type narrowing
if (typeof palette1.green === "string") {
  palette1.green.toUpperCase(); // Requires type guard
}

// Method 2: satisfies
const palette2 = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255]
} satisfies Record<string, ColorValue>;

// palette2.green has type "#00ff00" (string literal)
palette2.green.toUpperCase(); // Works directly!
// palette2.red has type [number, number, number]
palette2.red.map(v => v / 255); // Works directly!
```

### Key Name Checking

`satisfies` can ensure that an object contains all required keys:

```typescript
type Colors = "red" | "green" | "blue";

// Using satisfies for key name validation
const colorHexCodes = {
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff"
} satisfies Record<Colors, string>;

// If a key is missing, an error is reported
const incompleteColors = {
  red: "#ff0000",
  green: "#00ff00"
  // Error: Property "blue" is missing
} satisfies Record<Colors, string>;

// If there are extra keys, an error is also reported
const extraColors = {
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff",
  yellow: "#ffff00" // Error: Object literal may only specify known properties
} satisfies Record<Colors, string>;
```

### Type Widening Behavior Comparison

```typescript
interface Config {
  mode: "development" | "production";
  port: number;
  debug: boolean;
}

// Type annotation: type is widened
const config1: Config = {
  mode: "development",
  port: 3000,
  debug: true
};
// config1.mode has type "development" | "production"
// config1.port has type number

// satisfies: preserves literal types
const config2 = {
  mode: "development",
  port: 3000,
  debug: true
} satisfies Config;
// config2.mode has type "development"
// config2.port has type 3000
// config2.debug has type true
```

## Core Use Cases

### Configuration Object Validation

```typescript
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  ssl?: boolean;
  pool?: {
    min: number;
    max: number;
  };
}

// Using satisfies to validate configuration while preserving precise types
const dbConfig = {
  host: "localhost",
  port: 5432,
  database: "myapp",
  ssl: true,
  pool: {
    min: 2,
    max: 10
  }
} satisfies DatabaseConfig;

// dbConfig.port has type 5432, not number
// This is very useful when precise type matching is needed
function connectToPort5432(config: { port: 5432 }) {
  console.log("Connecting to port 5432...");
}

connectToPort5432(dbConfig); // Type compatible!
```

### Route Definition

```typescript
type RouteHandler = (req: Request, res: Response) => void;

interface Route {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  handler: RouteHandler;
}

// Define route table
const routes = {
  getUsers: {
    path: "/users",
    method: "GET",
    handler: (req, res) => {
      res.json({ users: [] });
    }
  },
  createUser: {
    path: "/users",
    method: "POST",
    handler: (req, res) => {
      res.json({ created: true });
    }
  },
  getUser: {
    path: "/users/:id",
    method: "GET",
    handler: (req, res) => {
      res.json({ user: {} });
    }
  }
} satisfies Record<string, Route>;

// routes.getUsers.method has type "GET", not "GET" | "POST" | "PUT" | "DELETE"
// routes.getUsers.path has type "/users", not string
```

### Theme and Style Objects

```typescript
type CSSValue = string | number;

interface Theme {
  colors: Record<string, string>;
  spacing: Record<string, CSSValue>;
  fontSizes: Record<string, string>;
}

const theme = {
  colors: {
    primary: "#007bff",
    secondary: "#6c757d",
    success: "#28a745",
    danger: "#dc3545",
    warning: "#ffc107"
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  fontSizes: {
    small: "12px",
    medium: "16px",
    large: "20px",
    xlarge: "24px"
  }
} satisfies Theme;

// Types remain precise
// theme.colors.primary has type "#007bff"
// theme.spacing.md has type 16
// theme.fontSizes.medium has type "16px"

// Auto-completion shows all available color names
const primaryColor = theme.colors.primary;
```

### State Machine Definition

```typescript
type State = "idle" | "loading" | "success" | "error";

interface StateConfig {
  initial: boolean;
  transitions: State[];
  onEnter?: () => void;
  onExit?: () => void;
}

const stateMachine = {
  idle: {
    initial: true,
    transitions: ["loading"],
    onEnter: () => console.log("Entering idle state")
  },
  loading: {
    initial: false,
    transitions: ["success", "error"],
    onEnter: () => console.log("Loading...")
  },
  success: {
    initial: false,
    transitions: ["idle"],
    onEnter: () => console.log("Success!")
  },
  error: {
    initial: false,
    transitions: ["idle", "loading"],
    onEnter: () => console.log("Error occurred"),
    onExit: () => console.log("Leaving error state")
  }
} satisfies Record<State, StateConfig>;

// Ensures all states are defined
// stateMachine.idle.transitions has type ["loading"]
```

### Internationalization Translations

```typescript
interface TranslationSet {
  greeting: string;
  farewell: string;
  buttons: {
    submit: string;
    cancel: string;
    reset: string;
  };
  errors: {
    required: string;
    invalid: string;
  };
}

const translations = {
  en: {
    greeting: "Hello",
    farewell: "Goodbye",
    buttons: {
      submit: "Submit",
      cancel: "Cancel",
      reset: "Reset"
    },
    errors: {
      required: "This field is required",
      invalid: "Invalid input"
    }
  },
  zh: {
    greeting: "你好",
    farewell: "再见",
    buttons: {
      submit: "提交",
      cancel: "取消",
      reset: "重置"
    },
    errors: {
      required: "此字段为必填项",
      invalid: "输入无效"
    }
  },
  ja: {
    greeting: "こんにちは",
    farewell: "さようなら",
    buttons: {
      submit: "送信",
      cancel: "キャンセル",
      reset: "リセット"
    },
    errors: {
      required: "この項目は必須です",
      invalid: "入力が無効です"
    }
  }
} satisfies Record<string, TranslationSet>;

// Type-safe translation access
// translations.zh.greeting has type "你好"
type SupportedLocale = keyof typeof translations; // "en" | "zh" | "ja"
```

## Type Narrowing and satisfies

### Preserving Specific Types of Union Type Members

```typescript
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

// Without satisfies: may not get precise shape types
const shapes1: Shape[] = [
  { kind: "circle", radius: 5 },
  { kind: "rectangle", width: 10, height: 20 }
];

// Using satisfies: can get better type inference in certain scenarios
const myCircle = { kind: "circle" as const, radius: 5 } satisfies Shape;
// myCircle has type { kind: "circle"; radius: number }
// myCircle.kind has type "circle"

const myRectangle = { kind: "rectangle" as const, width: 10, height: 20 } satisfies Shape;
// myRectangle.kind has type "rectangle"
```

### Conditional Type Narrowing

```typescript
type EventPayload = {
  type: "click";
  x: number;
  y: number;
} | {
  type: "keypress";
  key: string;
  code: number;
} | {
  type: "scroll";
  scrollTop: number;
  scrollLeft: number;
};

// Define event handlers
const eventHandlers = {
  click: (payload) => {
    console.log(`Clicked at (${payload.x}, ${payload.y})`);
  },
  keypress: (payload) => {
    console.log(`Key pressed: ${payload.key}`);
  },
  scroll: (payload) => {
    console.log(`Scrolled to ${payload.scrollTop}`);
  }
} satisfies {
  [K in EventPayload["type"]]: (
    payload: Extract<EventPayload, { type: K }>
  ) => void;
};

// Each handler's payload parameter has the correct type
```

## Combining with as const

### Creating Read-only and Type-safe Constants

```typescript
// Using as const alone
const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
} as const;
// Type is read-only, but no structural validation

// Combining with satisfies
interface StatusCodeMap {
  OK: number;
  CREATED: number;
  BAD_REQUEST: number;
  NOT_FOUND: number;
  SERVER_ERROR: number;
}

const VALIDATED_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
} as const satisfies StatusCodeMap;

// Has both type validation and preserves literal types and read-only properties
// VALIDATED_STATUS_CODES.OK has type 200
// If any status code is missing, a compile-time error is reported
```

### Enum Alternative

```typescript
// Traditional enum
enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT"
}

// Alternative using as const + satisfies
const DirectionConst = {
  Up: "UP",
  Down: "DOWN",
  Left: "LEFT",
  Right: "RIGHT"
} as const satisfies Record<string, string>;

type DirectionType = typeof DirectionConst[keyof typeof DirectionConst];
// "UP" | "DOWN" | "LEFT" | "RIGHT"

// Advantages:
// 1. No runtime overhead (enums generate extra code)
// 2. Values are true string literals
// 3. Can perform structural validation
```

## Practical Application Examples

### Example 1: API Response Type Validation

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: {
    page: number;
    total: number;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
}

// Simulating API response data
const successResponse = {
  success: true,
  data: {
    id: 1,
    name: "John Doe",
    email: "johndoe@example.com"
  },
  meta: {
    page: 1,
    total: 100
  }
} satisfies ApiResponse<User>;

const errorResponse = {
  success: false,
  data: null as unknown as User,
  error: "User not found"
} satisfies ApiResponse<User>;

// successResponse.data.name has type "John Doe"
// successResponse.success has type true
```

### Example 2: Form Configuration

```typescript
type FieldType = "text" | "number" | "email" | "password" | "select" | "checkbox";

interface FieldConfig {
  type: FieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

type FormConfig = Record<string, FieldConfig>;

const loginFormConfig = {
  username: {
    type: "text",
    label: "Username",
    required: true,
    placeholder: "Enter username",
    validation: {
      min: 3,
      max: 20
    }
  },
  password: {
    type: "password",
    label: "Password",
    required: true,
    placeholder: "Enter password",
    validation: {
      min: 8
    }
  },
  rememberMe: {
    type: "checkbox",
    label: "Remember me",
    required: false
  }
} satisfies FormConfig;

// loginFormConfig.username.type has type "text"
// loginFormConfig.password.validation.min has type 8

// Get form field names
type LoginFormFields = keyof typeof loginFormConfig;
// "username" | "password" | "rememberMe"
```

### Example 3: Redux Action Definition

```typescript
interface Action<T extends string, P = undefined> {
  type: T;
  payload: P;
}

type AppAction =
  | Action<"user/login", { username: string; password: string }>
  | Action<"user/logout">
  | Action<"user/updateProfile", { name?: string; email?: string }>
  | Action<"cart/add", { productId: string; quantity: number }>
  | Action<"cart/remove", { productId: string }>;

// Action creators
const actionCreators = {
  login: (username: string, password: string) => ({
    type: "user/login",
    payload: { username, password }
  }),

  logout: () => ({
    type: "user/logout",
    payload: undefined
  }),

  updateProfile: (data: { name?: string; email?: string }) => ({
    type: "user/updateProfile",
    payload: data
  }),

  addToCart: (productId: string, quantity: number) => ({
    type: "cart/add",
    payload: { productId, quantity }
  }),

  removeFromCart: (productId: string) => ({
    type: "cart/remove",
    payload: { productId }
  })
} satisfies Record<string, (...args: any[]) => AppAction>;

// Each creator returns an action with precise type
const loginAction = actionCreators.login("admin", "password123");
// loginAction.type has type "user/login"
// loginAction.payload has type { username: string; password: string }
```

### Example 4: Permission System

```typescript
type Permission = "read" | "write" | "delete" | "admin";
type Resource = "users" | "posts" | "comments" | "settings";

interface RolePermissions {
  permissions: Permission[];
  resources: Resource[];
  description: string;
}

const roles = {
  viewer: {
    permissions: ["read"],
    resources: ["users", "posts", "comments"],
    description: "Can only view public content"
  },
  editor: {
    permissions: ["read", "write"],
    resources: ["posts", "comments"],
    description: "Can edit articles and comments"
  },
  moderator: {
    permissions: ["read", "write", "delete"],
    resources: ["posts", "comments"],
    description: "Can manage articles and comments"
  },
  admin: {
    permissions: ["read", "write", "delete", "admin"],
    resources: ["users", "posts", "comments", "settings"],
    description: "Full administrative permissions"
  }
} satisfies Record<string, RolePermissions>;

type RoleName = keyof typeof roles; // "viewer" | "editor" | "moderator" | "admin"

// Type-safe permission check function
function hasPermission(
  role: RoleName,
  permission: Permission,
  resource: Resource
): boolean {
  const roleConfig = roles[role];
  return (
    roleConfig.permissions.includes(permission) &&
    roleConfig.resources.includes(resource)
  );
}

// Usage example
const canEdit = hasPermission("editor", "write", "posts"); // true
const canDelete = hasPermission("viewer", "delete", "posts"); // false
```

### Example 5: Multi-language Routes

```typescript
interface RouteConfig {
  path: string;
  component: string;
  title: string;
  requiresAuth?: boolean;
  children?: Record<string, RouteConfig>;
}

const appRoutes = {
  home: {
    path: "/",
    component: "HomePage",
    title: "Home",
    requiresAuth: false
  },
  dashboard: {
    path: "/dashboard",
    component: "DashboardPage",
    title: "Dashboard",
    requiresAuth: true,
    children: {
      overview: {
        path: "/dashboard/overview",
        component: "OverviewPage",
        title: "Overview"
      },
      analytics: {
        path: "/dashboard/analytics",
        component: "AnalyticsPage",
        title: "Analytics"
      },
      settings: {
        path: "/dashboard/settings",
        component: "SettingsPage",
        title: "Settings"
      }
    }
  },
  profile: {
    path: "/profile",
    component: "ProfilePage",
    title: "Profile",
    requiresAuth: true
  },
  login: {
    path: "/login",
    component: "LoginPage",
    title: "Login",
    requiresAuth: false
  }
} satisfies Record<string, RouteConfig>;

// appRoutes.dashboard.path has type "/dashboard"
// appRoutes.dashboard.children?.overview.path has type "/dashboard/overview"

type TopLevelRoute = keyof typeof appRoutes;
// "home" | "dashboard" | "profile" | "login"
```

## Best Practices

### When to Use satisfies

```typescript
// Recommended scenarios for using satisfies:

// 1. Need to validate object structure but preserve literal types
const config = {
  env: "production",
  port: 3000
} satisfies { env: string; port: number };

// 2. Defining objects containing multiple value types
type ColorValue = string | [number, number, number];
const palette = {
  primary: "#007bff",
  rgb: [0, 123, 255]
} satisfies Record<string, ColorValue>;

// 3. Ensuring objects contain specific keys
type RequiredKeys = "id" | "name" | "email";
const user = {
  id: 1,
  name: "John Doe",
  email: "test@example.com"
} satisfies Record<RequiredKeys, unknown>;
```

### When to Use Type Annotations

```typescript
// Recommended scenarios for using type annotations:

// 1. Function parameters and return values
function createUser(data: UserData): User {
  return { ...data, id: generateId() };
}

// 2. Scenarios requiring type widening
let status: "loading" | "success" | "error" = "loading";
status = "success"; // Reassignment allowed

// 3. Declaring variables but assigning later
let config: AppConfig;
if (isProduction) {
  config = loadProductionConfig();
} else {
  config = loadDevConfig();
}
```

### Combining satisfies with as const

```typescript
// Creating immutable and type-safe constants
const ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE"
} as const satisfies Record<string, string>;

// Getting union type of values
type ActionType = typeof ACTIONS[keyof typeof ACTIONS];
// "CREATE" | "UPDATE" | "DELETE"

// Using for function parameters
function dispatch(action: ActionType) {
  console.log(`Dispatching: ${action}`);
}

dispatch(ACTIONS.CREATE); // Type-safe
dispatch("CREATE"); // Can also use string literal directly
```

### Avoiding Overuse

```typescript
// Not recommended: using satisfies for simple values
const name = "Alice" satisfies string; // Unnecessary

// Recommended: only use when structural validation is needed
interface Person {
  name: string;
  age: number;
}

const person = {
  name: "Alice",
  age: 30
} satisfies Person; // Meaningful validation
```

### Handling Optional Properties

```typescript
interface Options {
  required: string;
  optional?: number;
  callback?: () => void;
}

// satisfies correctly handles optional properties
const options1 = {
  required: "value"
} satisfies Options; // OK, optional and callback can be omitted

const options2 = {
  required: "value",
  optional: 42
} satisfies Options; // OK

const options3 = {
  required: "value",
  optional: 42,
  callback: () => console.log("called")
} satisfies Options; // OK
```

## Common Pitfalls

### Confusing with Type Assertions

```typescript
// satisfies is not a type assertion!

// Type assertion: tells the compiler "trust me, this is this type"
const value1 = someValue as string; // May be unsafe

// satisfies: validates type compatibility, does not change inferred type
const value2 = "hello" satisfies string; // Safe validation

// Incorrect example: trying to "force" type with satisfies
const num: number = 42;
// const str = num satisfies string; // Error: number does not satisfy string
```

### Forgetting That satisfies Does Not Change Type

```typescript
type StringOrNumber = string | number;

const value = "hello" satisfies StringOrNumber;
// value's type is still "hello", not StringOrNumber

// If StringOrNumber type is needed, use type annotation
const value2: StringOrNumber = "hello";
// value2's type is StringOrNumber
```

### Type Precision in Nested Objects

```typescript
interface Nested {
  outer: {
    inner: string;
  };
}

const obj = {
  outer: {
    inner: "value"
  }
} satisfies Nested;

// obj.outer.inner has type "value", not string
// This is usually the expected behavior, but be aware of potential implications
```

### Array Element Types

```typescript
type Item = { id: number; name: string };

const items = [
  { id: 1, name: "First" },
  { id: 2, name: "Second" }
] satisfies Item[];

// items has type { id: number; name: string }[]
// Element id and name do not preserve literal types
// If literal types are needed, use as const
const constItems = [
  { id: 1, name: "First" },
  { id: 2, name: "Second" }
] as const satisfies readonly Item[];
```

### Function Type Validation

```typescript
type Handler = (event: Event) => void;

// satisfies can validate function types
const onClick = ((e: MouseEvent) => {
  console.log(e.clientX, e.clientY);
}) satisfies Handler;
// Note: MouseEvent is a subtype of Event, so this is valid

// But be aware of parameter type contravariance
const onAnyEvent: Handler = onClick; // Type-safe
```

## Performance Considerations

### Compile-time Performance

The `satisfies` operator performs type checking at compile time and has no impact on runtime performance. However, in complex type scenarios, it may slightly increase compile time.

```typescript
// Complex types may increase compile time
type ComplexConfig = {
  [K in keyof SomeComplexType]: {
    [P in keyof SomeComplexType[K]]: SomeComplexType[K][P] extends Function
      ? (...args: Parameters<SomeComplexType[K][P]>) => ReturnType<SomeComplexType[K][P]>
      : SomeComplexType[K][P];
  };
};

// For very complex types, consider splitting or simplifying
```

### Runtime Behavior

```typescript
// satisfies completely disappears after compilation
const config = {
  port: 3000,
  host: "localhost"
} satisfies { port: number; host: string };

// Compiled JavaScript:
// const config = {
//   port: 3000,
//   host: "localhost"
// };

// No runtime overhead
```

## Interview Key Points

### What is the purpose of the satisfies operator?

**Answer**: The `satisfies` operator is used to validate whether an expression satisfies a certain type constraint while preserving the expression's original inferred type. It was introduced in TypeScript 4.9 to solve the problem of type annotations losing literal type information.

### What is the main difference between satisfies and type annotations?

**Answer**:
- **Type annotation** (`const x: Type = value`): Sets the variable's type to the annotated type, potentially losing more precise inferred information
- **satisfies** (`const x = value satisfies Type`): Validates that the value conforms to the type constraint but preserves the original precise inferred type

```typescript
// Type annotation: x.method has type "GET" | "POST"
const x: { method: "GET" | "POST" } = { method: "GET" };

// satisfies: y.method has type "GET"
const y = { method: "GET" } satisfies { method: "GET" | "POST" };
```

### When should satisfies be used?

**Answer**:
- When you need to validate object structure but preserve literal types
- When defining configuration objects containing multiple value types
- When ensuring objects contain all required keys
- When creating type-safe constant mappings
- When combining with `as const` to create immutable and type-safe constants

### Can satisfies replace type assertions?

**Answer**: No. `satisfies` is used for type validation, while type assertions (`as`) are used to tell the compiler to trust the developer's judgment. `satisfies` will report an error when types don't match, while type assertions may hide type errors. You should prefer using `satisfies` for safe type validation.

### Does satisfies affect runtime behavior?

**Answer**: No. `satisfies` is a purely compile-time feature that completely disappears in the generated JavaScript code and has no impact on runtime performance.

## Further Reading

- [TypeScript 4.9 Release Notes - satisfies Operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
- [TypeScript Official Documentation - Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Deep Dive - Type Inference](https://basarat.gitbook.io/typescript/type-system/type-inference)
- [Understanding the satisfies Operator in TypeScript](https://www.totaltypescript.com/clarifying-the-satisfies-operator)
