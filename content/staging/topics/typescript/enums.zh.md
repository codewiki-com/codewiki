---
title: TypeScript 枚举类型
description: 全面学习 TypeScript 枚举，包括数字枚举、字符串枚举、常量枚举和枚举最佳实践
track: typescript
section: type-system
difficulty: beginner
tags:
  - TypeScript
  - 枚举
  - 类型
status: imported
origin: old/src/content/docs/typescript/enums.zh.md
divergence: 0.15
issues: []
legacy:
  category: TypeScript
  subcategory: 类型系统
  order: 11
  lastUpdated: 2026-01-07
---

枚举（Enum）是 TypeScript 中一种特殊的数据类型，用于定义一组命名的常量。枚举使代码更具可读性和可维护性，特别适合表示一组固定的相关值，如状态码、方向、颜色等。

## 数字枚举（Numeric Enums）

数字枚举是最常见的枚举类型，每个成员都有一个数字值。

### 基本数字枚举

默认情况下，数字枚举从 0 开始自动递增：

```typescript
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right  // 3
}

// 使用枚举
let dir: Direction = Direction.Up;
console.log(dir); // 输出: 0

// 作为函数参数
function move(direction: Direction): void {
  switch (direction) {
    case Direction.Up:
      console.log("向上移动");
      break;
    case Direction.Down:
      console.log("向下移动");
      break;
    case Direction.Left:
      console.log("向左移动");
      break;
    case Direction.Right:
      console.log("向右移动");
      break;
  }
}

move(Direction.Left); // 输出: 向左移动
```

### 自定义初始值

可以手动指定枚举成员的初始值：

```typescript
enum HttpStatus {
  OK = 200,
  Created = 201,
  Accepted = 202,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  InternalServerError = 500
}

function handleResponse(status: HttpStatus): string {
  if (status >= 200 && status < 300) {
    return "请求成功";
  } else if (status >= 400 && status < 500) {
    return "客户端错误";
  } else if (status >= 500) {
    return "服务器错误";
  }
  return "未知状态";
}

console.log(handleResponse(HttpStatus.OK)); // 输出: 请求成功
console.log(handleResponse(HttpStatus.NotFound)); // 输出: 客户端错误
```

### 部分初始化

如果只指定部分成员的值，后续成员会自动递增：

```typescript
enum Priority {
  Low = 1,
  Medium,  // 2
  High,    // 3
  Urgent   // 4
}

console.log(Priority.Low);    // 1
console.log(Priority.Medium); // 2
console.log(Priority.High);   // 3
console.log(Priority.Urgent); // 4
```

### 计算成员与常量成员

枚举成员可以是常量成员或计算成员：

```typescript
enum FileAccess {
  // 常量成员
  None = 0,
  Read = 1 << 0,      // 1
  Write = 1 << 1,     // 2
  ReadWrite = Read | Write, // 3

  // 计算成员
  G = "123".length    // 3
}

// 使用位运算组合权限
function checkPermission(access: FileAccess): void {
  if (access & FileAccess.Read) {
    console.log("有读取权限");
  }
  if (access & FileAccess.Write) {
    console.log("有写入权限");
  }
}

checkPermission(FileAccess.ReadWrite);
// 输出:
// 有读取权限
// 有写入权限
```

## 字符串枚举（String Enums）

字符串枚举的每个成员都必须用字符串字面量初始化。字符串枚举提供更好的可读性和调试体验。

### 基本字符串枚举

```typescript
enum LogLevel {
  Debug = "DEBUG",
  Info = "INFO",
  Warning = "WARNING",
  Error = "ERROR"
}

function log(message: string, level: LogLevel): void {
  console.log(`[${level}] ${message}`);
}

log("应用程序启动", LogLevel.Info);
// 输出: [INFO] 应用程序启动

log("发现潜在问题", LogLevel.Warning);
// 输出: [WARNING] 发现潜在问题
```

### 字符串枚举的优势

字符串枚举在运行时提供有意义的值，便于调试：

```typescript
enum EventType {
  Click = "CLICK",
  Scroll = "SCROLL",
  MouseMove = "MOUSE_MOVE",
  KeyPress = "KEY_PRESS"
}

interface UIEvent {
  type: EventType;
  timestamp: number;
  target: string;
}

function handleEvent(event: UIEvent): void {
  console.log(`事件类型: ${event.type}`);
  console.log(`时间戳: ${event.timestamp}`);
  console.log(`目标元素: ${event.target}`);
}

const clickEvent: UIEvent = {
  type: EventType.Click,
  timestamp: Date.now(),
  target: "button#submit"
};

handleEvent(clickEvent);
// 输出:
// 事件类型: CLICK
// 时间戳: 1704652800000
// 目标元素: button#submit
```

### 异构枚举（混合枚举）

虽然可以混合使用数字和字符串成员，但通常不推荐这样做：

```typescript
// 不推荐：异构枚举
enum BooleanLike {
  No = 0,
  Yes = "YES"
}

// 推荐：保持类型一致
enum BooleanString {
  No = "NO",
  Yes = "YES"
}
```

## 常量枚举（Const Enums）

常量枚举使用 `const` 修饰符定义，在编译时会被内联，不会生成额外的 JavaScript 代码。

### 基本常量枚举

```typescript
const enum Weekday {
  Monday = 1,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday
}

let today: Weekday = Weekday.Wednesday;
console.log(today); // 输出: 3

// 编译后的 JavaScript:
// let today = 3 /* Wednesday */;
// console.log(today);
```

### 常量枚举的优势

常量枚举可以减少生成的代码量，提高运行时性能：

```typescript
// 普通枚举
enum RegularColor {
  Red,
  Green,
  Blue
}

// 常量枚举
const enum ConstColor {
  Red,
  Green,
  Blue
}

let color1 = RegularColor.Red;
let color2 = ConstColor.Red;

// RegularColor 编译后会生成一个对象:
// var RegularColor;
// (function (RegularColor) {
//     RegularColor[RegularColor["Red"] = 0] = "Red";
//     RegularColor[RegularColor["Green"] = 1] = "Green";
//     RegularColor[RegularColor["Blue"] = 2] = "Blue";
// })(RegularColor || (RegularColor = {}));
// var color1 = RegularColor.Red;

// ConstColor 编译后直接内联:
// var color2 = 0 /* Red */;
```

### 常量枚举的限制

常量枚举有一些使用限制：

```typescript
const enum ConstantDirection {
  Up,
  Down,
  Left,
  Right
}

// 正确：可以正常访问成员
let direction = ConstantDirection.Up;

// 错误：不能使用计算成员
// const enum InvalidEnum {
//   A = Math.random() // Error: const enum member initializers can only contain literal values and other computed enum values
// }

// 注意：在某些构建配置中，常量枚举可能需要特殊处理
// 当 preserveConstEnums 为 true 时，会保留枚举对象
```

## 环境枚举（Ambient Enums）

环境枚举用于描述已经存在的枚举类型，通常在声明文件（.d.ts）中使用。

### 声明环境枚举

```typescript
// 在 .d.ts 文件中声明
declare enum ExternalColor {
  Red = 0,
  Green = 1,
  Blue = 2
}

// 在代码中使用
let externalColor: ExternalColor = ExternalColor.Red;
```

### 环境枚举与普通枚举的区别

```typescript
// 普通枚举：未初始化的成员会自动计算值
enum RegularEnum {
  A,     // 0
  B,     // 1
  C = 5,
  D      // 6
}

// 环境枚举：未初始化的成员被认为是计算成员
declare enum AmbientEnum {
  A,     // 计算成员
  B,     // 计算成员
  C = 5, // 常量成员
  D      // 计算成员
}
```

## 反向映射（Reverse Mappings）

数字枚举会自动创建反向映射，可以通过值获取对应的键名。

### 基本反向映射

```typescript
enum Status {
  Pending = 1,
  Approved = 2,
  Rejected = 3
}

// 正向访问
console.log(Status.Approved); // 输出: 2

// 反向访问
console.log(Status[2]); // 输出: "Approved"

// 实际用例：将数字转换为状态名
function getStatusName(code: number): string {
  return Status[code] || "未知状态";
}

console.log(getStatusName(1)); // 输出: Pending
console.log(getStatusName(2)); // 输出: Approved
console.log(getStatusName(99)); // 输出: 未知状态
```

### 反向映射的内部实现

```typescript
enum Animal {
  Dog = 1,
  Cat = 2,
  Bird = 3
}

// TypeScript 编译后生成的代码：
// var Animal;
// (function (Animal) {
//     Animal[Animal["Dog"] = 1] = "Dog";
//     Animal[Animal["Cat"] = 2] = "Cat";
//     Animal[Animal["Bird"] = 3] = "Bird";
// })(Animal || (Animal = {}));

// 这意味着 Animal 对象同时包含：
// { 1: "Dog", 2: "Cat", 3: "Bird", Dog: 1, Cat: 2, Bird: 3 }

// 遍历枚举成员（只获取名称）
function getEnumNames(enumObj: object): string[] {
  return Object.keys(enumObj).filter(key => isNaN(Number(key)));
}

console.log(getEnumNames(Animal)); // ["Dog", "Cat", "Bird"]
```

### 字符串枚举没有反向映射

```typescript
enum StringStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE"
}

console.log(StringStatus.Active);   // "ACTIVE"
// console.log(StringStatus["ACTIVE"]); // undefined - 字符串枚举没有反向映射

// 如需字符串枚举的反向映射，需要手动实现
const StringStatusReverse: { [key: string]: keyof typeof StringStatus } = {
  ACTIVE: "Active",
  INACTIVE: "Inactive"
};
```

## 枚举作为类型

枚举不仅可以作为值使用，还可以作为类型使用。

### 枚举成员类型

```typescript
enum ShapeKind {
  Circle,
  Square,
  Triangle
}

interface Circle {
  kind: ShapeKind.Circle;
  radius: number;
}

interface Square {
  kind: ShapeKind.Square;
  sideLength: number;
}

interface Triangle {
  kind: ShapeKind.Triangle;
  base: number;
  height: number;
}

type Shape = Circle | Square | Triangle;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case ShapeKind.Circle:
      return Math.PI * shape.radius ** 2;
    case ShapeKind.Square:
      return shape.sideLength ** 2;
    case ShapeKind.Triangle:
      return (shape.base * shape.height) / 2;
  }
}

const circle: Circle = { kind: ShapeKind.Circle, radius: 5 };
console.log(getArea(circle)); // 78.54...
```

### 联合枚举类型

```typescript
enum Permission {
  Read = 1,
  Write = 2,
  Execute = 4
}

// 枚举作为联合类型
type PermissionType = Permission.Read | Permission.Write | Permission.Execute;

function hasPermission(userPermission: number, required: PermissionType): boolean {
  return (userPermission & required) === required;
}

const userPermission = Permission.Read | Permission.Write;
console.log(hasPermission(userPermission, Permission.Read));    // true
console.log(hasPermission(userPermission, Permission.Execute)); // false
```

## 实际应用场景

### 场景一：状态机

```typescript
enum OrderStatus {
  Created = "CREATED",
  Pending = "PENDING",
  Processing = "PROCESSING",
  Shipped = "SHIPPED",
  Delivered = "DELIVERED",
  Cancelled = "CANCELLED"
}

interface Order {
  id: string;
  status: OrderStatus;
  items: string[];
  createdAt: Date;
}

class OrderStateMachine {
  private validTransitions: Map<OrderStatus, OrderStatus[]> = new Map([
    [OrderStatus.Created, [OrderStatus.Pending, OrderStatus.Cancelled]],
    [OrderStatus.Pending, [OrderStatus.Processing, OrderStatus.Cancelled]],
    [OrderStatus.Processing, [OrderStatus.Shipped, OrderStatus.Cancelled]],
    [OrderStatus.Shipped, [OrderStatus.Delivered]],
    [OrderStatus.Delivered, []],
    [OrderStatus.Cancelled, []]
  ]);

  canTransition(from: OrderStatus, to: OrderStatus): boolean {
    const allowed = this.validTransitions.get(from);
    return allowed ? allowed.includes(to) : false;
  }

  transition(order: Order, newStatus: OrderStatus): Order {
    if (!this.canTransition(order.status, newStatus)) {
      throw new Error(`无法从 ${order.status} 转换到 ${newStatus}`);
    }
    return { ...order, status: newStatus };
  }
}

// 使用示例
const machine = new OrderStateMachine();
let order: Order = {
  id: "ORD-001",
  status: OrderStatus.Created,
  items: ["商品A", "商品B"],
  createdAt: new Date()
};

order = machine.transition(order, OrderStatus.Pending);
console.log(order.status); // PENDING

order = machine.transition(order, OrderStatus.Processing);
console.log(order.status); // PROCESSING
```

### 场景二：配置选项

```typescript
enum Theme {
  Light = "light",
  Dark = "dark",
  System = "system"
}

enum Language {
  Chinese = "zh-CN",
  English = "en-US",
  Japanese = "ja-JP"
}

enum FontSize {
  Small = 12,
  Medium = 14,
  Large = 16,
  ExtraLarge = 18
}

interface AppConfig {
  theme: Theme;
  language: Language;
  fontSize: FontSize;
  notifications: boolean;
}

const defaultConfig: AppConfig = {
  theme: Theme.System,
  language: Language.Chinese,
  fontSize: FontSize.Medium,
  notifications: true
};

function updateConfig(config: AppConfig, updates: Partial<AppConfig>): AppConfig {
  return { ...config, ...updates };
}

const userConfig = updateConfig(defaultConfig, {
  theme: Theme.Dark,
  fontSize: FontSize.Large
});

console.log(userConfig);
// { theme: "dark", language: "zh-CN", fontSize: 16, notifications: true }
```

### 场景三：API 响应处理

```typescript
enum ApiErrorCode {
  NetworkError = 1001,
  AuthenticationFailed = 2001,
  PermissionDenied = 2002,
  ResourceNotFound = 3001,
  ValidationError = 4001,
  ServerError = 5001
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errorCode?: ApiErrorCode;
  message?: string;
}

function handleApiError(errorCode: ApiErrorCode): string {
  const errorMessages: Record<ApiErrorCode, string> = {
    [ApiErrorCode.NetworkError]: "网络连接失败，请检查网络设置",
    [ApiErrorCode.AuthenticationFailed]: "认证失败，请重新登录",
    [ApiErrorCode.PermissionDenied]: "权限不足，无法执行此操作",
    [ApiErrorCode.ResourceNotFound]: "请求的资源不存在",
    [ApiErrorCode.ValidationError]: "输入数据验证失败",
    [ApiErrorCode.ServerError]: "服务器内部错误，请稍后重试"
  };

  return errorMessages[errorCode] || "未知错误";
}

// 使用示例
const response: ApiResponse<null> = {
  success: false,
  errorCode: ApiErrorCode.AuthenticationFailed,
  message: "Token expired"
};

if (!response.success && response.errorCode) {
  console.log(handleApiError(response.errorCode));
  // 输出: 认证失败，请重新登录
}
```

### 场景四：位标志（Bit Flags）

```typescript
enum FilePermission {
  None = 0,
  Read = 1 << 0,      // 1
  Write = 1 << 1,     // 2
  Execute = 1 << 2,   // 4
  All = Read | Write | Execute // 7
}

class File {
  constructor(
    public name: string,
    public permission: FilePermission = FilePermission.None
  ) {}

  addPermission(perm: FilePermission): void {
    this.permission |= perm;
  }

  removePermission(perm: FilePermission): void {
    this.permission &= ~perm;
  }

  hasPermission(perm: FilePermission): boolean {
    return (this.permission & perm) === perm;
  }

  getPermissionString(): string {
    const parts: string[] = [];
    if (this.hasPermission(FilePermission.Read)) parts.push("读取");
    if (this.hasPermission(FilePermission.Write)) parts.push("写入");
    if (this.hasPermission(FilePermission.Execute)) parts.push("执行");
    return parts.length > 0 ? parts.join(", ") : "无权限";
  }
}

// 使用示例
const file = new File("document.txt");
file.addPermission(FilePermission.Read);
file.addPermission(FilePermission.Write);

console.log(file.hasPermission(FilePermission.Read));    // true
console.log(file.hasPermission(FilePermission.Execute)); // false
console.log(file.getPermissionString());                 // 读取, 写入

file.removePermission(FilePermission.Write);
console.log(file.getPermissionString());                 // 读取
```

## 枚举的替代方案

虽然枚举很有用，但在某些情况下可以考虑其他替代方案。

### 联合类型字面量

```typescript
// 使用枚举
enum ColorEnum {
  Red = "red",
  Green = "green",
  Blue = "blue"
}

// 使用联合类型字面量（推荐用于简单场景）
type ColorUnion = "red" | "green" | "blue";

// 联合类型的优势：
// 1. 不会生成额外的 JavaScript 代码
// 2. 更符合 TypeScript 的类型系统理念
// 3. 更容易与其他类型组合

function setBackground(color: ColorUnion): void {
  document.body.style.backgroundColor = color;
}

setBackground("red"); // 正确
// setBackground("yellow"); // Error: 类型不兼容
```

### 常量对象 + as const

```typescript
// 使用 as const 创建只读对象
const Direction = {
  Up: "UP",
  Down: "DOWN",
  Left: "LEFT",
  Right: "RIGHT"
} as const;

// 提取类型
type DirectionType = typeof Direction[keyof typeof Direction];
// DirectionType = "UP" | "DOWN" | "LEFT" | "RIGHT"

function move(direction: DirectionType): void {
  console.log(`移动方向: ${direction}`);
}

move(Direction.Up); // 正确
move("UP");         // 正确
// move("FORWARD"); // Error: 类型不兼容

// 这种方式的优势：
// 1. 没有反向映射的开销
// 2. 更灵活的值类型
// 3. 可以轻松扩展
```

### 使用 Map 或 Record

```typescript
// 使用 Record 创建类型安全的映射
const StatusMessages: Record<string, string> = {
  pending: "等待处理",
  processing: "处理中",
  completed: "已完成",
  failed: "处理失败"
};

// 更严格的类型定义
type StatusKey = "pending" | "processing" | "completed" | "failed";
const TypedStatusMessages: Record<StatusKey, string> = {
  pending: "等待处理",
  processing: "处理中",
  completed: "已完成",
  failed: "处理失败"
};

function getStatusMessage(status: StatusKey): string {
  return TypedStatusMessages[status];
}

console.log(getStatusMessage("pending")); // 等待处理
```

### 类与静态成员

```typescript
class HttpMethod {
  static readonly GET = new HttpMethod("GET");
  static readonly POST = new HttpMethod("POST");
  static readonly PUT = new HttpMethod("PUT");
  static readonly DELETE = new HttpMethod("DELETE");

  private constructor(public readonly value: string) {}

  toString(): string {
    return this.value;
  }
}

function sendRequest(method: HttpMethod, url: string): void {
  console.log(`发送 ${method} 请求到 ${url}`);
}

sendRequest(HttpMethod.GET, "/api/users");
// 输出: 发送 GET 请求到 /api/users
```

## 最佳实践

### 优先使用字符串枚举

```typescript
// 推荐：字符串枚举
enum UserRole {
  Admin = "ADMIN",
  Moderator = "MODERATOR",
  User = "USER",
  Guest = "GUEST"
}

// 不推荐：数字枚举（除非有特定原因）
enum UserRoleNumber {
  Admin,    // 0
  Moderator, // 1
  User,     // 2
  Guest     // 3
}

// 字符串枚举的优势：
// - 调试时值更有意义
// - 序列化到 JSON 时更易读
// - 不会因为成员顺序变化而导致值变化
```

### 使用常量枚举优化性能

```typescript
// 对于不需要反向映射的简单枚举，使用 const
const enum ActionType {
  Add = "ADD",
  Remove = "REMOVE",
  Update = "UPDATE"
}

// 编译后直接内联值，无运行时开销
const action = ActionType.Add; // 编译为: const action = "ADD"
```

### 避免数字枚举的隐式问题

```typescript
enum Status {
  Active,
  Inactive
}

// 问题：数字枚举允许任何数字赋值
let status: Status = Status.Active;
status = 100; // TypeScript 不会报错！

// 解决方案：使用字符串枚举或联合类型
enum SafeStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE"
}

let safeStatus: SafeStatus = SafeStatus.Active;
// safeStatus = "OTHER"; // Error: 类型不兼容
```

### 为枚举提供完整的 switch 处理

```typescript
enum PaymentMethod {
  CreditCard = "CREDIT_CARD",
  DebitCard = "DEBIT_CARD",
  PayPal = "PAYPAL",
  BankTransfer = "BANK_TRANSFER"
}

function getPaymentFee(method: PaymentMethod): number {
  switch (method) {
    case PaymentMethod.CreditCard:
      return 0.03;
    case PaymentMethod.DebitCard:
      return 0.01;
    case PaymentMethod.PayPal:
      return 0.025;
    case PaymentMethod.BankTransfer:
      return 0;
    default:
      // 穷尽检查：确保处理所有枚举值
      const exhaustiveCheck: never = method;
      throw new Error(`未处理的支付方式: ${exhaustiveCheck}`);
  }
}
```

### 使用命名空间扩展枚举功能

```typescript
enum Color {
  Red = "#FF0000",
  Green = "#00FF00",
  Blue = "#0000FF"
}

namespace Color {
  export function fromHex(hex: string): Color | undefined {
    for (const color of Object.values(Color)) {
      if (color === hex) {
        return color as Color;
      }
    }
    return undefined;
  }

  export function toRgb(color: Color): { r: number; g: number; b: number } {
    const hex = color.replace("#", "");
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }
}

// 使用
console.log(Color.fromHex("#FF0000")); // "#FF0000"
console.log(Color.toRgb(Color.Green)); // { r: 0, g: 255, b: 0 }
```

## 常见问题与解决方案

### 问题一：枚举与 JSON 序列化

```typescript
enum Priority {
  Low = "LOW",
  Medium = "MEDIUM",
  High = "HIGH"
}

interface Task {
  id: number;
  title: string;
  priority: Priority;
}

const task: Task = {
  id: 1,
  title: "完成报告",
  priority: Priority.High
};

// 序列化：正常工作
const json = JSON.stringify(task);
console.log(json); // {"id":1,"title":"完成报告","priority":"HIGH"}

// 反序列化：需要类型断言或验证
const parsed = JSON.parse(json);
const restoredTask: Task = {
  ...parsed,
  priority: parsed.priority as Priority // 需要断言
};

// 更安全的反序列化
function isValidPriority(value: string): value is Priority {
  return Object.values(Priority).includes(value as Priority);
}

function parseTask(json: string): Task | null {
  const obj = JSON.parse(json);
  if (isValidPriority(obj.priority)) {
    return obj as Task;
  }
  return null;
}
```

### 问题二：枚举作为对象键

```typescript
enum Fruit {
  Apple = "apple",
  Banana = "banana",
  Orange = "orange"
}

// 使用枚举值作为对象键
const fruitPrices: Record<Fruit, number> = {
  [Fruit.Apple]: 5,
  [Fruit.Banana]: 3,
  [Fruit.Orange]: 4
};

// 遍历
for (const fruit of Object.values(Fruit)) {
  console.log(`${fruit}: ${fruitPrices[fruit]} 元`);
}
// 输出:
// apple: 5 元
// banana: 3 元
// orange: 4 元
```

### 问题三：动态枚举值

```typescript
// 如果需要动态值，考虑使用对象而非枚举
const DynamicConfig = {
  ApiEndpoint: process.env.API_ENDPOINT || "https://api.example.com",
  MaxRetries: parseInt(process.env.MAX_RETRIES || "3", 10),
  Timeout: parseInt(process.env.TIMEOUT || "5000", 10)
} as const;

type ConfigKey = keyof typeof DynamicConfig;

// 枚举只适合编译时已知的常量值
const enum StaticConfig {
  AppName = "MyApp",
  Version = "1.0.0"
}
```

## 总结

TypeScript 枚举是一种强大的工具，用于定义一组命名的常量：

1. **数字枚举**：默认从 0 开始递增，支持反向映射
2. **字符串枚举**：提供更好的可读性和调试体验，推荐优先使用
3. **常量枚举**：编译时内联，无运行时开销
4. **环境枚举**：用于描述外部已存在的枚举类型

选择枚举还是替代方案取决于具体场景：
- 简单的字符串常量：使用联合类型字面量
- 需要运行时枚举对象：使用普通枚举
- 追求性能优化：使用常量枚举
- 需要复杂行为：使用类与静态成员

遵循最佳实践，合理使用枚举可以使代码更加类型安全、可读性更强、更易于维护。
