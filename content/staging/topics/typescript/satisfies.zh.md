---
title: TypeScript satisfies 操作符
description: 学习 TypeScript 4.9 引入的 satisfies 操作符进行类型验证
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - satisfies
  - 类型验证
status: imported
origin: old/src/content/docs/typescript/satisfies.zh.md
divergence: 0.213
issues: []
legacy:
  category: TypeScript
  subcategory: 类型系统
  order: 15
  lastUpdated: 2026-01-07
---

`satisfies` 操作符是 TypeScript 4.9 引入的一个强大特性。它允许我们验证表达式的类型是否符合某个类型约束，同时保留表达式的原始推断类型。这个操作符填补了类型注解和类型断言之间的空白，为开发者提供了更精确的类型控制能力。

## 概念解释

### 什么是 satisfies？

`satisfies` 操作符用于验证一个值是否满足某个类型的要求，但不会改变该值的推断类型。这与传统的类型注解形成鲜明对比：类型注解会将值的类型"拓宽"为注解的类型，而 `satisfies` 则保持值的字面量类型或更精确的推断类型。

```typescript
// 使用类型注解：丢失字面量类型信息
const colors1: Record<string, string> = {
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff"
};
// colors1.red 的类型是 string

// 使用 satisfies：保留字面量类型信息
const colors2 = {
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff"
} satisfies Record<string, string>;
// colors2.red 的类型是 "#ff0000"
```

### 历史背景

在 `satisfies` 出现之前，开发者面临一个两难选择：

1. **使用类型注解**：获得类型检查，但丢失推断的字面量类型
2. **不使用类型注解**：保留字面量类型，但失去对整体结构的类型验证

`satisfies` 操作符在 TypeScript 4.9（2022 年 11 月发布）中引入，完美解决了这个问题。它是 TypeScript 社区长期以来最受期待的特性之一。

### 解决的核心问题

1. **保持类型推断的精确性**：不会丢失字面量类型和更窄的类型信息
2. **验证类型兼容性**：确保值符合预期的类型结构
3. **提供更好的自动补全**：IDE 可以提供更精确的代码提示
4. **避免运行时错误**：在编译时发现类型不匹配的问题

## satisfies 与类型注解的区别

### 基本对比

```typescript
type ColorValue = string | number[];

// 方式一：类型注解
const palette1: Record<string, ColorValue> = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255]
};

// palette1.green 的类型是 string | number[]
// 调用字符串方法需要类型收窄
if (typeof palette1.green === "string") {
  palette1.green.toUpperCase(); // 需要类型守卫
}

// 方式二：satisfies
const palette2 = {
  red: [255, 0, 0],
  green: "#00ff00",
  blue: [0, 0, 255]
} satisfies Record<string, ColorValue>;

// palette2.green 的类型是 "#00ff00"（字符串字面量）
palette2.green.toUpperCase(); // 直接可用！
// palette2.red 的类型是 [number, number, number]
palette2.red.map(v => v / 255); // 直接可用！
```

### 键名检查

`satisfies` 可以确保对象包含所有必需的键：

```typescript
type Colors = "red" | "green" | "blue";

// 使用 satisfies 进行键名验证
const colorHexCodes = {
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff"
} satisfies Record<Colors, string>;

// 如果缺少键，会报错
const incompleteColors = {
  red: "#ff0000",
  green: "#00ff00"
  // 错误：缺少属性 "blue"
} satisfies Record<Colors, string>;

// 如果有多余的键，也会报错
const extraColors = {
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff",
  yellow: "#ffff00" // 错误：对象字面量只能指定已知属性
} satisfies Record<Colors, string>;
```

### 类型拓宽行为对比

```typescript
interface Config {
  mode: "development" | "production";
  port: number;
  debug: boolean;
}

// 类型注解：类型被拓宽
const config1: Config = {
  mode: "development",
  port: 3000,
  debug: true
};
// config1.mode 的类型是 "development" | "production"
// config1.port 的类型是 number

// satisfies：保持字面量类型
const config2 = {
  mode: "development",
  port: 3000,
  debug: true
} satisfies Config;
// config2.mode 的类型是 "development"
// config2.port 的类型是 3000
// config2.debug 的类型是 true
```

## 核心使用场景

### 配置对象验证

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

// 使用 satisfies 验证配置同时保留精确类型
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

// dbConfig.port 的类型是 5432，不是 number
// 这在需要精确类型匹配时非常有用
function connectToPort5432(config: { port: 5432 }) {
  console.log("Connecting to port 5432...");
}

connectToPort5432(dbConfig); // 类型兼容！
```

### 路由定义

```typescript
type RouteHandler = (req: Request, res: Response) => void;

interface Route {
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  handler: RouteHandler;
}

// 定义路由表
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

// routes.getUsers.method 的类型是 "GET"，不是 "GET" | "POST" | "PUT" | "DELETE"
// routes.getUsers.path 的类型是 "/users"，不是 string
```

### 主题和样式对象

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

// 类型保持精确
// theme.colors.primary 的类型是 "#007bff"
// theme.spacing.md 的类型是 16
// theme.fontSizes.medium 的类型是 "16px"

// 自动补全会显示所有可用的颜色名称
const primaryColor = theme.colors.primary;
```

### 状态机定义

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

// 确保所有状态都被定义
// stateMachine.idle.transitions 的类型是 ["loading"]
```

### 国际化翻译

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

// 类型安全的翻译访问
// translations.zh.greeting 的类型是 "你好"
type SupportedLocale = keyof typeof translations; // "en" | "zh" | "ja"
```

## 类型收窄与 satisfies

### 保留联合类型成员的具体类型

```typescript
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

// 不使用 satisfies：可能无法获得精确的形状类型
const shapes1: Shape[] = [
  { kind: "circle", radius: 5 },
  { kind: "rectangle", width: 10, height: 20 }
];

// 使用 satisfies：可以在某些场景下获得更好的类型推断
const myCircle = { kind: "circle" as const, radius: 5 } satisfies Shape;
// myCircle 的类型保持为 { kind: "circle"; radius: number }
// myCircle.kind 的类型是 "circle"

const myRectangle = { kind: "rectangle" as const, width: 10, height: 20 } satisfies Shape;
// myRectangle.kind 的类型是 "rectangle"
```

### 条件类型收窄

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

// 定义事件处理器
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

// 每个处理器的 payload 参数都有正确的类型
```

## 与 as const 的结合使用

### 创建只读且类型安全的常量

```typescript
// 单独使用 as const
const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
} as const;
// 类型是只读的，但没有结构验证

// 结合 satisfies 使用
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

// 既有类型验证，又保持字面量类型和只读性
// VALIDATED_STATUS_CODES.OK 的类型是 200
// 如果缺少任何状态码，编译时会报错
```

### 枚举替代方案

```typescript
// 传统枚举
enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT"
}

// 使用 as const + satisfies 的替代方案
const DirectionConst = {
  Up: "UP",
  Down: "DOWN",
  Left: "LEFT",
  Right: "RIGHT"
} as const satisfies Record<string, string>;

type DirectionType = typeof DirectionConst[keyof typeof DirectionConst];
// "UP" | "DOWN" | "LEFT" | "RIGHT"

// 优势：
// 1. 运行时没有额外开销（枚举会生成额外代码）
// 2. 值是真正的字符串字面量
// 3. 可以进行结构验证
```

## 实际应用示例

### 示例 1：API 响应类型验证

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

// 模拟 API 响应数据
const successResponse = {
  success: true,
  data: {
    id: 1,
    name: "张三",
    email: "zhangsan@example.com"
  },
  meta: {
    page: 1,
    total: 100
  }
} satisfies ApiResponse<User>;

const errorResponse = {
  success: false,
  data: null as unknown as User,
  error: "用户不存在"
} satisfies ApiResponse<User>;

// successResponse.data.name 的类型是 "张三"
// successResponse.success 的类型是 true
```

### 示例 2：表单配置

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
    label: "用户名",
    required: true,
    placeholder: "请输入用户名",
    validation: {
      min: 3,
      max: 20
    }
  },
  password: {
    type: "password",
    label: "密码",
    required: true,
    placeholder: "请输入密码",
    validation: {
      min: 8
    }
  },
  rememberMe: {
    type: "checkbox",
    label: "记住我",
    required: false
  }
} satisfies FormConfig;

// loginFormConfig.username.type 的类型是 "text"
// loginFormConfig.password.validation.min 的类型是 8

// 获取表单字段名称
type LoginFormFields = keyof typeof loginFormConfig;
// "username" | "password" | "rememberMe"
```

### 示例 3：Redux Action 定义

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

// Action 创建器
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

// 每个创建器返回的 action 都有精确的类型
const loginAction = actionCreators.login("admin", "password123");
// loginAction.type 的类型是 "user/login"
// loginAction.payload 的类型是 { username: string; password: string }
```

### 示例 4：权限系统

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
    description: "只能查看公开内容"
  },
  editor: {
    permissions: ["read", "write"],
    resources: ["posts", "comments"],
    description: "可以编辑文章和评论"
  },
  moderator: {
    permissions: ["read", "write", "delete"],
    resources: ["posts", "comments"],
    description: "可以管理文章和评论"
  },
  admin: {
    permissions: ["read", "write", "delete", "admin"],
    resources: ["users", "posts", "comments", "settings"],
    description: "完全管理权限"
  }
} satisfies Record<string, RolePermissions>;

type RoleName = keyof typeof roles; // "viewer" | "editor" | "moderator" | "admin"

// 类型安全的权限检查函数
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

// 使用示例
const canEdit = hasPermission("editor", "write", "posts"); // true
const canDelete = hasPermission("viewer", "delete", "posts"); // false
```

### 示例 5：多语言路由

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
    title: "首页",
    requiresAuth: false
  },
  dashboard: {
    path: "/dashboard",
    component: "DashboardPage",
    title: "控制台",
    requiresAuth: true,
    children: {
      overview: {
        path: "/dashboard/overview",
        component: "OverviewPage",
        title: "概览"
      },
      analytics: {
        path: "/dashboard/analytics",
        component: "AnalyticsPage",
        title: "数据分析"
      },
      settings: {
        path: "/dashboard/settings",
        component: "SettingsPage",
        title: "设置"
      }
    }
  },
  profile: {
    path: "/profile",
    component: "ProfilePage",
    title: "个人资料",
    requiresAuth: true
  },
  login: {
    path: "/login",
    component: "LoginPage",
    title: "登录",
    requiresAuth: false
  }
} satisfies Record<string, RouteConfig>;

// appRoutes.dashboard.path 的类型是 "/dashboard"
// appRoutes.dashboard.children?.overview.path 的类型是 "/dashboard/overview"

type TopLevelRoute = keyof typeof appRoutes;
// "home" | "dashboard" | "profile" | "login"
```

## 最佳实践

### 何时使用 satisfies

```typescript
// 推荐使用 satisfies 的场景：

// 1. 需要验证对象结构但保留字面量类型
const config = {
  env: "production",
  port: 3000
} satisfies { env: string; port: number };

// 2. 定义包含多种类型值的对象
type ColorValue = string | [number, number, number];
const palette = {
  primary: "#007bff",
  rgb: [0, 123, 255]
} satisfies Record<string, ColorValue>;

// 3. 确保对象包含特定的键
type RequiredKeys = "id" | "name" | "email";
const user = {
  id: 1,
  name: "张三",
  email: "test@example.com"
} satisfies Record<RequiredKeys, unknown>;
```

### 何时使用类型注解

```typescript
// 推荐使用类型注解的场景：

// 1. 函数参数和返回值
function createUser(data: UserData): User {
  return { ...data, id: generateId() };
}

// 2. 需要类型拓宽的场景
let status: "loading" | "success" | "error" = "loading";
status = "success"; // 允许重新赋值

// 3. 声明变量但稍后赋值
let config: AppConfig;
if (isProduction) {
  config = loadProductionConfig();
} else {
  config = loadDevConfig();
}
```

### 组合使用 satisfies 和 as const

```typescript
// 创建不可变且类型安全的常量
const ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE"
} as const satisfies Record<string, string>;

// 获取值的联合类型
type ActionType = typeof ACTIONS[keyof typeof ACTIONS];
// "CREATE" | "UPDATE" | "DELETE"

// 用于函数参数
function dispatch(action: ActionType) {
  console.log(`Dispatching: ${action}`);
}

dispatch(ACTIONS.CREATE); // 类型安全
dispatch("CREATE"); // 也可以直接使用字符串字面量
```

### 避免过度使用

```typescript
// 不推荐：对简单值使用 satisfies
const name = "Alice" satisfies string; // 没有必要

// 推荐：只在需要结构验证时使用
interface Person {
  name: string;
  age: number;
}

const person = {
  name: "Alice",
  age: 30
} satisfies Person; // 有意义的验证
```

### 处理可选属性

```typescript
interface Options {
  required: string;
  optional?: number;
  callback?: () => void;
}

// satisfies 会正确处理可选属性
const options1 = {
  required: "value"
} satisfies Options; // OK，optional 和 callback 可以省略

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

## 常见陷阱

### 与类型断言混淆

```typescript
// satisfies 不是类型断言！

// 类型断言：告诉编译器"相信我，这是这个类型"
const value1 = someValue as string; // 可能不安全

// satisfies：验证类型兼容性，不改变推断类型
const value2 = "hello" satisfies string; // 安全验证

// 错误示例：试图用 satisfies "强制"类型
const num: number = 42;
// const str = num satisfies string; // 错误：number 不满足 string
```

### 忘记 satisfies 不会改变类型

```typescript
type StringOrNumber = string | number;

const value = "hello" satisfies StringOrNumber;
// value 的类型仍然是 "hello"，不是 StringOrNumber

// 如果需要 StringOrNumber 类型，使用类型注解
const value2: StringOrNumber = "hello";
// value2 的类型是 StringOrNumber
```

### 嵌套对象的类型精度

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

// obj.outer.inner 的类型是 "value"，不是 string
// 这通常是期望的行为，但要注意可能的影响
```

### 数组元素类型

```typescript
type Item = { id: number; name: string };

const items = [
  { id: 1, name: "First" },
  { id: 2, name: "Second" }
] satisfies Item[];

// items 的类型是 { id: number; name: string }[]
// 元素的 id 和 name 不会保持字面量类型
// 如果需要字面量类型，使用 as const
const constItems = [
  { id: 1, name: "First" },
  { id: 2, name: "Second" }
] as const satisfies readonly Item[];
```

### 函数类型验证

```typescript
type Handler = (event: Event) => void;

// satisfies 可以验证函数类型
const onClick = ((e: MouseEvent) => {
  console.log(e.clientX, e.clientY);
}) satisfies Handler;
// 注意：MouseEvent 是 Event 的子类型，所以这是有效的

// 但要注意参数类型的逆变性
const onAnyEvent: Handler = onClick; // 类型安全
```

## 性能考量

### 编译时性能

`satisfies` 操作符在编译时进行类型检查，对运行时性能没有任何影响。但在复杂类型场景下，可能会略微增加编译时间。

```typescript
// 复杂类型可能增加编译时间
type ComplexConfig = {
  [K in keyof SomeComplexType]: {
    [P in keyof SomeComplexType[K]]: SomeComplexType[K][P] extends Function
      ? (...args: Parameters<SomeComplexType[K][P]>) => ReturnType<SomeComplexType[K][P]>
      : SomeComplexType[K][P];
  };
};

// 对于非常复杂的类型，考虑拆分或简化
```

### 运行时表现

```typescript
// satisfies 在编译后完全消失
const config = {
  port: 3000,
  host: "localhost"
} satisfies { port: number; host: string };

// 编译后的 JavaScript：
// const config = {
//   port: 3000,
//   host: "localhost"
// };

// 没有任何运行时开销
```

## 面试要点

### satisfies 操作符的作用是什么？

**答案**：`satisfies` 操作符用于验证一个表达式是否满足某个类型约束，同时保留该表达式的原始推断类型。它在 TypeScript 4.9 中引入，解决了类型注解会丢失字面量类型信息的问题。

### satisfies 与类型注解的主要区别是什么？

**答案**：
- **类型注解**（`const x: Type = value`）：将变量的类型设置为注解的类型，可能丢失更精确的推断信息
- **satisfies**（`const x = value satisfies Type`）：验证值符合类型约束，但保留原始推断的精确类型

```typescript
// 类型注解：x.method 的类型是 "GET" | "POST"
const x: { method: "GET" | "POST" } = { method: "GET" };

// satisfies：y.method 的类型是 "GET"
const y = { method: "GET" } satisfies { method: "GET" | "POST" };
```

### 什么时候应该使用 satisfies？

**答案**：
- 需要验证对象结构但保留字面量类型时
- 定义包含多种类型值的配置对象时
- 确保对象包含所有必需键时
- 创建类型安全的常量映射时
- 与 `as const` 结合创建不可变且类型安全的常量时

### satisfies 可以替代类型断言吗？

**答案**：不能。`satisfies` 用于类型验证，而类型断言（`as`）用于告诉编译器信任开发者的判断。`satisfies` 会在类型不匹配时报错，而类型断言可能会隐藏类型错误。应该优先使用 `satisfies` 进行安全的类型验证。

### satisfies 会影响运行时行为吗？

**答案**：不会。`satisfies` 是纯粹的编译时特性，在生成的 JavaScript 代码中完全不存在，对运行时性能没有任何影响。

## 延伸阅读

- [TypeScript 4.9 发布说明 - satisfies 操作符](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html)
- [TypeScript 官方文档 - 类型收窄](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Deep Dive - 类型推断](https://basarat.gitbook.io/typescript/type-system/type-inference)
- [Understanding the satisfies Operator in TypeScript](https://www.totaltypescript.com/clarifying-the-satisfies-operator)
