---
title: 类型守卫
description: TypeScript类型守卫完全指南，类型收窄、自定义类型守卫与断言函数
track: typescript
section: type-system
difficulty: intermediate
tags:
  - TypeScript
  - 类型守卫
  - 类型收窄
  - 类型安全
status: imported
origin: old/src/content/docs/typescript/type-guards.zh.md
divergence: 0.228
issues: []
legacy:
  category: TypeScript
  subcategory: 类型系统
  order: 5
  lastUpdated: 2026-01-07
---

在 TypeScript 中，类型守卫（Type Guards）是一种在运行时检查类型的技术，它能帮助编译器在特定的代码块中收窄（narrow）变量的类型。通过类型守卫，我们可以编写更安全、更精确的代码，同时获得更好的类型推断支持。

## 什么是类型守卫？

类型守卫是一些表达式，它们在运行时执行检查，以确保某个作用域内的类型。当 TypeScript 识别到类型守卫时，它会自动将变量的类型收窄到更具体的类型。

```typescript
function example(value: string | number) {
  // 此时 value 的类型是 string | number

  if (typeof value === "string") {
    // 在这个代码块中，TypeScript 知道 value 是 string
    console.log(value.toUpperCase());
  } else {
    // 在这个代码块中，TypeScript 知道 value 是 number
    console.log(value.toFixed(2));
  }
}
```

## typeof 类型守卫

`typeof` 是 JavaScript 中的原生操作符，TypeScript 将其作为类型守卫来使用。它适用于检查原始类型。

### 基本用法

```typescript
function processValue(value: string | number | boolean) {
  if (typeof value === "string") {
    // value: string
    return value.trim().toLowerCase();
  }

  if (typeof value === "number") {
    // value: number
    return value * 2;
  }

  // value: boolean
  return !value;
}
```

### typeof 可识别的类型

`typeof` 操作符可以返回以下字符串值：

- `"string"`
- `"number"`
- `"bigint"`
- `"boolean"`
- `"symbol"`
- `"undefined"`
- `"object"`（包括 `null`）
- `"function"`

```typescript
function handleUnknown(value: unknown) {
  if (typeof value === "string") {
    console.log("字符串:", value);
  } else if (typeof value === "number") {
    console.log("数字:", value);
  } else if (typeof value === "boolean") {
    console.log("布尔值:", value);
  } else if (typeof value === "function") {
    console.log("函数:", value.name);
  } else if (typeof value === "object") {
    if (value === null) {
      console.log("null 值");
    } else {
      console.log("对象:", value);
    }
  } else if (typeof value === "undefined") {
    console.log("未定义");
  } else if (typeof value === "symbol") {
    console.log("Symbol:", value.toString());
  } else if (typeof value === "bigint") {
    console.log("BigInt:", value);
  }
}
```

### typeof 的局限性

`typeof` 无法区分不同的对象类型：

```typescript
function processObject(value: Date | RegExp | Array<number>) {
  if (typeof value === "object") {
    // value 仍然是 Date | RegExp | number[]
    // typeof 无法进一步区分
  }
}

// typeof null 返回 "object"（JavaScript 的历史遗留问题）
const arr = [1, 2, 3];
const obj = { a: 1 };

console.log(typeof arr); // "object"
console.log(typeof obj); // "object"
console.log(typeof null); // "object"
```

## instanceof 类型守卫

`instanceof` 操作符用于检查对象是否是某个类的实例。它通过检查原型链来工作，非常适合区分类实例。

### 基本用法

```typescript
class Dog {
  bark() {
    console.log("汪汪!");
  }
}

class Cat {
  meow() {
    console.log("喵喵!");
  }
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    // animal: Dog
    animal.bark();
  } else {
    // animal: Cat
    animal.meow();
  }
}

const dog = new Dog();
const cat = new Cat();

makeSound(dog); // 输出: 汪汪!
makeSound(cat); // 输出: 喵喵!
```

### 处理内置对象

```typescript
function processValue(value: Date | RegExp | Error) {
  if (value instanceof Date) {
    // value: Date
    console.log("日期:", value.toISOString());
  } else if (value instanceof RegExp) {
    // value: RegExp
    console.log("正则表达式:", value.source);
  } else {
    // value: Error
    console.log("错误:", value.message);
  }
}

processValue(new Date());           // 日期: 2026-01-07T...
processValue(/hello/g);             // 正则表达式: hello
processValue(new Error("出错了"));   // 错误: 出错了
```

### 处理数组

```typescript
function processData(data: number[] | Set<number> | Map<string, number>) {
  if (Array.isArray(data)) {
    // data: number[]
    console.log("数组长度:", data.length);
    data.forEach(item => console.log(item));
  } else if (data instanceof Set) {
    // data: Set<number>
    console.log("Set 大小:", data.size);
    data.forEach(item => console.log(item));
  } else {
    // data: Map<string, number>
    console.log("Map 大小:", data.size);
    data.forEach((value, key) => console.log(key, value));
  }
}
```

### 继承关系中的 instanceof

```typescript
class Animal {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

class Bird extends Animal {
  fly() {
    console.log(`${this.name} 正在飞翔`);
  }
}

class Fish extends Animal {
  swim() {
    console.log(`${this.name} 正在游泳`);
  }
}

function move(animal: Animal) {
  if (animal instanceof Bird) {
    // animal: Bird
    animal.fly();
  } else if (animal instanceof Fish) {
    // animal: Fish
    animal.swim();
  } else {
    console.log(`${animal.name} 正在移动`);
  }
}

const bird = new Bird("小鸟");
console.log(bird instanceof Bird);   // true
console.log(bird instanceof Animal); // true（检查原型链）
console.log(bird instanceof Object); // true
```

## in 操作符类型守卫

`in` 操作符用于检查对象是否具有某个属性。这对于区分具有不同属性的对象类型特别有用。

### 基本用法

```typescript
interface Bird {
  fly: () => void;
  layEggs: () => void;
}

interface Fish {
  swim: () => void;
  layEggs: () => void;
}

function move(animal: Bird | Fish) {
  if ("fly" in animal) {
    // animal: Bird
    animal.fly();
  } else {
    // animal: Fish
    animal.swim();
  }
}

const fish: Fish = {
  swim: () => console.log("游泳中..."),
  layEggs: () => console.log("产卵中...")
};

const bird: Bird = {
  fly: () => console.log("飞翔中..."),
  layEggs: () => console.log("产卵中...")
};

move(fish); // 输出: 游泳中...
move(bird); // 输出: 飞翔中...
```

### 区分多个类型

```typescript
interface Car {
  drive: () => void;
  wheels: number;
}

interface Boat {
  sail: () => void;
  propellers: number;
}

interface Plane {
  fly: () => void;
  wings: number;
}

type Vehicle = Car | Boat | Plane;

function operate(vehicle: Vehicle) {
  if ("drive" in vehicle) {
    // vehicle: Car
    console.log(`这辆车有 ${vehicle.wheels} 个轮子`);
    vehicle.drive();
  } else if ("sail" in vehicle) {
    // vehicle: Boat
    console.log(`这艘船有 ${vehicle.propellers} 个螺旋桨`);
    vehicle.sail();
  } else {
    // vehicle: Plane
    console.log(`这架飞机有 ${vehicle.wings} 个机翼`);
    vehicle.fly();
  }
}
```

### 处理可选属性

```typescript
interface BasicUser {
  id: number;
  name: string;
}

interface AdminUser {
  id: number;
  name: string;
  permissions: string[];
  adminLevel: number;
}

function getUserInfo(user: BasicUser | AdminUser) {
  console.log(`用户: ${user.name} (ID: ${user.id})`);

  if ("permissions" in user) {
    // user: AdminUser
    console.log(`管理员等级: ${user.adminLevel}`);
    console.log(`权限: ${user.permissions.join(", ")}`);
  }
}

// 检查可选属性是否存在
interface User {
  name: string;
  email?: string;
  phone?: string;
}

function contactUser(user: User) {
  if ("email" in user && user.email) {
    console.log(`发送邮件到: ${user.email}`);
  } else if ("phone" in user && user.phone) {
    console.log(`拨打电话: ${user.phone}`);
  } else {
    console.log(`无法联系 ${user.name}`);
  }
}
```

## 自定义类型守卫

当内置的类型守卫无法满足需求时，我们可以创建自定义类型守卫。自定义类型守卫是一个返回类型谓词（type predicate）的函数。

### 类型谓词语法

类型谓词的形式是 `parameterName is Type`：

```typescript
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function processValue(value: unknown) {
  if (isString(value)) {
    // value: string
    console.log(value.toUpperCase());
  }
}
```

### 检查对象形状

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    "email" in value &&
    typeof (value as User).id === "number" &&
    typeof (value as User).name === "string" &&
    typeof (value as User).email === "string"
  );
}

function processData(data: unknown) {
  if (isUser(data)) {
    // data: User
    console.log(`用户: ${data.name}, 邮箱: ${data.email}`);
  } else {
    console.log("无效的用户数据");
  }
}

// 使用示例
processData({ id: 1, name: "张三", email: "zhangsan@example.com" });
// 输出: 用户: 张三, 邮箱: zhangsan@example.com

processData({ id: "1", name: "张三" });
// 输出: 无效的用户数据
```

### 数组类型守卫

```typescript
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(item => typeof item === "string")
  );
}

function isNumberArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every(item => typeof item === "number")
  );
}

function processArray(arr: unknown) {
  if (isStringArray(arr)) {
    // arr: string[]
    console.log(arr.map(s => s.toUpperCase()));
  } else if (isNumberArray(arr)) {
    // arr: number[]
    console.log(arr.reduce((sum, n) => sum + n, 0));
  }
}

processArray(["a", "b", "c"]); // 输出: ["A", "B", "C"]
processArray([1, 2, 3]);       // 输出: 6
```

### 泛型类型守卫

```typescript
// 非空值检查
function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

function processValues(values: (string | null | undefined)[]) {
  const validValues = values.filter(isNonNullable);
  // validValues: string[]
  console.log(validValues);
}

processValues(["hello", null, "world", undefined]);
// 输出: ["hello", "world"]

// 更通用的泛型类型守卫
function isInstanceOf<T>(
  constructor: new (...args: any[]) => T
): (value: unknown) => value is T {
  return (value: unknown): value is T => value instanceof constructor;
}

const isDate = isInstanceOf(Date);
const isRegExp = isInstanceOf(RegExp);
const isError = isInstanceOf(Error);

function example(value: unknown) {
  if (isDate(value)) {
    // value: Date
    console.log(value.getFullYear());
  } else if (isRegExp(value)) {
    // value: RegExp
    console.log(value.source);
  } else if (isError(value)) {
    // value: Error
    console.log(value.message);
  }
}
```

### 复杂对象验证

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: number;
}

interface ErrorResponse {
  success: false;
  error: string;
  code: number;
}

type Response<T> = ApiResponse<T> | ErrorResponse;

function isSuccessResponse<T>(
  response: Response<T>
): response is ApiResponse<T> {
  return response.success === true;
}

function isErrorResponse<T>(
  response: Response<T>
): response is ErrorResponse {
  return response.success === false;
}

async function fetchData<T>(url: string): Promise<T | null> {
  const response: Response<T> = await fetch(url).then(r => r.json());

  if (isSuccessResponse(response)) {
    // response: ApiResponse<T>
    console.log(`数据获取成功，时间戳: ${response.timestamp}`);
    return response.data;
  } else {
    // response: ErrorResponse
    console.error(`错误 ${response.code}: ${response.error}`);
    return null;
  }
}
```

### 使用 this 类型守卫

在类中，我们可以使用 `this is Type` 来创建类型守卫方法：

```typescript
class Animal {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  isBird(): this is Bird {
    return this instanceof Bird;
  }

  isFish(): this is Fish {
    return this instanceof Fish;
  }
}

class Bird extends Animal {
  fly() {
    console.log(`${this.name} 在飞翔`);
  }
}

class Fish extends Animal {
  swim() {
    console.log(`${this.name} 在游泳`);
  }
}

function moveAnimal(animal: Animal) {
  if (animal.isBird()) {
    // animal: Bird
    animal.fly();
  } else if (animal.isFish()) {
    // animal: Fish
    animal.swim();
  }
}

const sparrow = new Bird("麻雀");
const salmon = new Fish("三文鱼");

moveAnimal(sparrow); // 麻雀 在飞翔
moveAnimal(salmon);  // 三文鱼 在游泳
```

## 断言函数

断言函数（Assertion Functions）是 TypeScript 3.7 引入的特性。与类型守卫不同，断言函数在条件不满足时会抛出错误，而不是返回布尔值。

### asserts 语法

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(`期望字符串，但得到 ${typeof value}`);
  }
}

function processValue(value: unknown) {
  assertIsString(value);
  // 从这里开始，value 的类型是 string
  console.log(value.toUpperCase());
}

try {
  processValue("hello"); // 输出: HELLO
  processValue(123);     // 抛出错误
} catch (e) {
  console.error(e);
}
```

### 断言非空值

```typescript
function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? "值不能为 null 或 undefined");
  }
}

function getUser(id: number): { name: string } | null {
  // 模拟数据库查询
  return id === 1 ? { name: "张三" } : null;
}

function processUser(id: number) {
  const user = getUser(id);
  assertDefined(user, `未找到 ID 为 ${id} 的用户`);
  // user: { name: string }
  console.log(user.name);
}

processUser(1); // 输出: 张三
// processUser(2); // 抛出: 未找到 ID 为 2 的用户
```

### 断言条件

```typescript
function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function divide(a: number, b: number): number {
  assert(b !== 0, "除数不能为零");
  // TypeScript 现在知道 b 不是 0
  return a / b;
}

console.log(divide(10, 2)); // 5
// divide(10, 0); // 抛出: 除数不能为零
```

### 结合类型检查的断言

```typescript
interface Config {
  apiUrl: string;
  timeout: number;
  retries: number;
}

function assertValidConfig(config: unknown): asserts config is Config {
  if (typeof config !== "object" || config === null) {
    throw new Error("配置必须是一个对象");
  }

  const obj = config as Record<string, unknown>;

  if (typeof obj.apiUrl !== "string") {
    throw new Error("apiUrl 必须是字符串");
  }

  if (typeof obj.timeout !== "number" || obj.timeout <= 0) {
    throw new Error("timeout 必须是正数");
  }

  if (typeof obj.retries !== "number" || obj.retries < 0) {
    throw new Error("retries 必须是非负整数");
  }
}

function initializeApp(config: unknown) {
  assertValidConfig(config);
  // config: Config
  console.log(`API URL: ${config.apiUrl}`);
  console.log(`超时时间: ${config.timeout}ms`);
  console.log(`重试次数: ${config.retries}`);
}

// 有效配置
initializeApp({
  apiUrl: "https://api.example.com",
  timeout: 5000,
  retries: 3
});

// 无效配置会抛出错误
// initializeApp({ apiUrl: 123 });
```

### 断言函数与类型守卫的对比

```typescript
// 类型守卫：返回布尔值，需要条件判断
function isPositive(value: number): value is number {
  return value > 0;
}

function processWithGuard(value: number) {
  if (isPositive(value)) {
    // 在这里 value 被认为是正数
    console.log(Math.sqrt(value));
  } else {
    console.log("值不是正数");
  }
}

// 断言函数：抛出异常，后续代码直接使用收窄后的类型
function assertPositive(value: number): asserts value is number {
  if (value <= 0) {
    throw new Error("值必须是正数");
  }
}

function processWithAssertion(value: number) {
  assertPositive(value);
  // 从这里开始，value 被认为是正数
  console.log(Math.sqrt(value));
}
```

## 可辨识联合类型

可辨识联合（Discriminated Unions）是一种强大的模式，它结合了联合类型和字面量类型，通过一个共同的"标签"属性来区分不同的类型。

### 基本模式

```typescript
interface Circle {
  kind: "circle";
  radius: number;
}

interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}

interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

function calculateArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // shape: Circle
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      // shape: Rectangle
      return shape.width * shape.height;
    case "triangle":
      // shape: Triangle
      return (shape.base * shape.height) / 2;
  }
}

const circle: Circle = { kind: "circle", radius: 5 };
const rectangle: Rectangle = { kind: "rectangle", width: 10, height: 5 };
const triangle: Triangle = { kind: "triangle", base: 8, height: 6 };

console.log(calculateArea(circle));    // 78.54...
console.log(calculateArea(rectangle)); // 50
console.log(calculateArea(triangle));  // 24
```

### 穷尽性检查

使用 `never` 类型确保处理了所有可能的情况：

```typescript
function assertNever(value: never): never {
  throw new Error(`未处理的值: ${JSON.stringify(value)}`);
}

function getShapeDescription(shape: Shape): string {
  switch (shape.kind) {
    case "circle":
      return `半径为 ${shape.radius} 的圆`;
    case "rectangle":
      return `${shape.width} x ${shape.height} 的矩形`;
    case "triangle":
      return `底边 ${shape.base}，高 ${shape.height} 的三角形`;
    default:
      // 如果添加了新的形状类型但忘记处理，这里会报编译错误
      return assertNever(shape);
  }
}
```

### 状态管理中的应用

```typescript
interface LoadingState {
  status: "loading";
}

interface SuccessState<T> {
  status: "success";
  data: T;
}

interface ErrorState {
  status: "error";
  error: string;
}

type AsyncState<T> = LoadingState | SuccessState<T> | ErrorState;

function renderState<T>(state: AsyncState<T>): string {
  switch (state.status) {
    case "loading":
      return "加载中...";
    case "success":
      return `数据: ${JSON.stringify(state.data)}`;
    case "error":
      return `错误: ${state.error}`;
  }
}

// 实际应用示例
interface User {
  id: number;
  name: string;
}

type UserState = AsyncState<User>;

function UserComponent(state: UserState) {
  if (state.status === "loading") {
    return "<div>正在加载用户信息...</div>";
  }

  if (state.status === "error") {
    return `<div class="error">加载失败: ${state.error}</div>`;
  }

  // state: SuccessState<User>
  return `<div>欢迎, ${state.data.name}!</div>`;
}

// 使用示例
const loadingState: UserState = { status: "loading" };
const successState: UserState = { status: "success", data: { id: 1, name: "张三" } };
const errorState: UserState = { status: "error", error: "网络错误" };

console.log(UserComponent(loadingState)); // <div>正在加载用户信息...</div>
console.log(UserComponent(successState)); // <div>欢迎, 张三!</div>
console.log(UserComponent(errorState));   // <div class="error">加载失败: 网络错误</div>
```

### Redux Action 模式

```typescript
interface AddTodoAction {
  type: "ADD_TODO";
  payload: {
    id: number;
    text: string;
  };
}

interface ToggleTodoAction {
  type: "TOGGLE_TODO";
  payload: {
    id: number;
  };
}

interface DeleteTodoAction {
  type: "DELETE_TODO";
  payload: {
    id: number;
  };
}

interface ClearCompletedAction {
  type: "CLEAR_COMPLETED";
}

type TodoAction =
  | AddTodoAction
  | ToggleTodoAction
  | DeleteTodoAction
  | ClearCompletedAction;

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function todoReducer(state: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case "ADD_TODO":
      // action: AddTodoAction
      return [
        ...state,
        {
          id: action.payload.id,
          text: action.payload.text,
          completed: false,
        },
      ];

    case "TOGGLE_TODO":
      // action: ToggleTodoAction
      return state.map(todo =>
        todo.id === action.payload.id
          ? { ...todo, completed: !todo.completed }
          : todo
      );

    case "DELETE_TODO":
      // action: DeleteTodoAction
      return state.filter(todo => todo.id !== action.payload.id);

    case "CLEAR_COMPLETED":
      // action: ClearCompletedAction
      return state.filter(todo => !todo.completed);
  }
}
```

### 多个辨识属性

有时候一个辨识属性不够，可以使用多个：

```typescript
interface HttpRequest {
  protocol: "http";
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
}

interface WebSocketRequest {
  protocol: "ws";
  action: "connect" | "disconnect" | "message";
  channel: string;
}

interface GrpcRequest {
  protocol: "grpc";
  service: string;
  method: string;
}

type NetworkRequest = HttpRequest | WebSocketRequest | GrpcRequest;

function handleRequest(request: NetworkRequest) {
  switch (request.protocol) {
    case "http":
      // request: HttpRequest
      console.log(`HTTP ${request.method} ${request.url}`);
      break;
    case "ws":
      // request: WebSocketRequest
      console.log(`WebSocket ${request.action} on ${request.channel}`);
      break;
    case "grpc":
      // request: GrpcRequest
      console.log(`gRPC ${request.service}.${request.method}`);
      break;
  }
}
```

### 嵌套可辨识联合

```typescript
interface TextMessage {
  type: "message";
  messageType: "text";
  content: string;
}

interface ImageMessage {
  type: "message";
  messageType: "image";
  url: string;
  width: number;
  height: number;
}

interface JoinNotification {
  type: "notification";
  notificationType: "join";
  userId: string;
  timestamp: Date;
}

interface LeaveNotification {
  type: "notification";
  notificationType: "leave";
  userId: string;
  timestamp: Date;
}

type Message = TextMessage | ImageMessage;
type Notification = JoinNotification | LeaveNotification;
type ChatEvent = Message | Notification;

function handleChatEvent(event: ChatEvent) {
  if (event.type === "message") {
    // event: Message (TextMessage | ImageMessage)
    if (event.messageType === "text") {
      // event: TextMessage
      console.log(`文本消息: ${event.content}`);
    } else {
      // event: ImageMessage
      console.log(`图片消息: ${event.url} (${event.width}x${event.height})`);
    }
  } else {
    // event: Notification (JoinNotification | LeaveNotification)
    if (event.notificationType === "join") {
      // event: JoinNotification
      console.log(`用户 ${event.userId} 加入了聊天`);
    } else {
      // event: LeaveNotification
      console.log(`用户 ${event.userId} 离开了聊天`);
    }
  }
}
```

## 类型守卫的高级技巧

### 组合多个类型守卫

```typescript
interface Dog {
  type: "dog";
  bark: () => void;
}

interface Cat {
  type: "cat";
  meow: () => void;
}

interface Bird {
  type: "bird";
  fly: () => void;
}

type Pet = Dog | Cat | Bird;

function isDog(pet: Pet): pet is Dog {
  return pet.type === "dog";
}

function isCat(pet: Pet): pet is Cat {
  return pet.type === "cat";
}

function isBird(pet: Pet): pet is Bird {
  return pet.type === "bird";
}

// 组合类型守卫
function isDogOrCat(pet: Pet): pet is Dog | Cat {
  return isDog(pet) || isCat(pet);
}

function handlePet(pet: Pet) {
  if (isDogOrCat(pet)) {
    // pet: Dog | Cat
    if (isDog(pet)) {
      pet.bark();
    } else {
      pet.meow();
    }
  } else {
    // pet: Bird
    pet.fly();
  }
}
```

### 类型守卫与映射类型

```typescript
type EventMap = {
  click: { x: number; y: number };
  keypress: { key: string; code: number };
  scroll: { scrollTop: number; scrollLeft: number };
};

type EventName = keyof EventMap;

interface Event<T extends EventName> {
  type: T;
  data: EventMap[T];
}

type AnyEvent = Event<"click"> | Event<"keypress"> | Event<"scroll">;

function isEventType<T extends EventName>(
  event: AnyEvent,
  type: T
): event is Event<T> {
  return event.type === type;
}

function handleEvent(event: AnyEvent) {
  if (isEventType(event, "click")) {
    // event: Event<"click">
    console.log(`点击位置: (${event.data.x}, ${event.data.y})`);
  } else if (isEventType(event, "keypress")) {
    // event: Event<"keypress">
    console.log(`按键: ${event.data.key} (${event.data.code})`);
  } else {
    // event: Event<"scroll">
    console.log(`滚动: ${event.data.scrollTop}, ${event.data.scrollLeft}`);
  }
}
```

### 类型守卫工厂函数

```typescript
// 创建属性检查类型守卫
function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === "object" && obj !== null && key in obj;
}

// 创建类型检查类型守卫
function hasPropertyOfType<K extends string, T>(
  obj: unknown,
  key: K,
  typeCheck: (value: unknown) => value is T
): obj is Record<K, T> {
  return hasProperty(obj, key) && typeCheck(obj[key]);
}

// 基本类型检查器
const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number => typeof value === "number";
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

// 使用示例
function processData(data: unknown) {
  if (
    hasPropertyOfType(data, "name", isString) &&
    hasPropertyOfType(data, "age", isNumber)
  ) {
    // data: Record<"name", string> & Record<"age", number>
    console.log(`${data.name} 今年 ${data.age} 岁`);
  }
}

processData({ name: "张三", age: 25 }); // 张三 今年 25 岁
```

### 递归类型守卫

```typescript
interface TreeNode {
  value: number;
  left?: TreeNode;
  right?: TreeNode;
}

function isTreeNode(value: unknown): value is TreeNode {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.value !== "number") {
    return false;
  }

  // 递归检查子节点
  if (obj.left !== undefined && !isTreeNode(obj.left)) {
    return false;
  }

  if (obj.right !== undefined && !isTreeNode(obj.right)) {
    return false;
  }

  return true;
}

// 使用示例
const tree: unknown = {
  value: 1,
  left: {
    value: 2,
    left: { value: 4 },
    right: { value: 5 }
  },
  right: {
    value: 3
  }
};

if (isTreeNode(tree)) {
  console.log("有效的树结构");
  console.log("根节点值:", tree.value);
}
```

## 实战示例

### 表单验证

```typescript
interface FormData {
  username?: string;
  email?: string;
  age?: number;
  password?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

type ValidationResult =
  | { valid: true; data: Required<FormData> }
  | { valid: false; errors: ValidationError[] };

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateForm(data: FormData): ValidationResult {
  const errors: ValidationError[] = [];

  // 检查 username
  if (!data.username || data.username.length < 3) {
    errors.push({
      field: "username",
      message: "用户名至少需要 3 个字符"
    });
  }

  // 检查 email
  if (!data.email || !isValidEmail(data.email)) {
    errors.push({
      field: "email",
      message: "邮箱格式不正确"
    });
  }

  // 检查 age
  if (data.age === undefined || data.age < 0 || data.age > 150) {
    errors.push({
      field: "age",
      message: "年龄必须是 0-150 之间的数字"
    });
  }

  // 检查 password
  if (!data.password || data.password.length < 8) {
    errors.push({
      field: "password",
      message: "密码至少需要 8 个字符"
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: data as Required<FormData>
  };
}

// 使用示例
function handleSubmit(formData: FormData) {
  const result = validateForm(formData);

  if (result.valid) {
    // result.data: Required<FormData>
    console.log(`注册成功: ${result.data.username}`);
    console.log(`邮箱: ${result.data.email}`);
  } else {
    // result.errors: ValidationError[]
    result.errors.forEach(error => {
      console.error(`${error.field}: ${error.message}`);
    });
  }
}
```

### API 响应处理

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

interface SingleResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

type ApiResponse<T> = SingleResponse<T> | PaginatedResponse<T> | ErrorResponse;

function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is SingleResponse<T> | PaginatedResponse<T> {
  return response.success === true;
}

function isPaginatedResponse<T>(
  response: ApiResponse<T>
): response is PaginatedResponse<T> {
  return response.success === true && "pagination" in response;
}

function isSingleResponse<T>(
  response: ApiResponse<T>
): response is SingleResponse<T> {
  return response.success === true && !("pagination" in response);
}

async function fetchUsers(): Promise<User[] | null> {
  const response: ApiResponse<User> = await fetch("/api/users").then(r => r.json());

  if (!isSuccessResponse(response)) {
    console.error(`错误 ${response.error.code}: ${response.error.message}`);
    return null;
  }

  if (isPaginatedResponse(response)) {
    console.log(`第 ${response.pagination.page} 页，共 ${response.pagination.total} 条`);
    return response.data;
  }

  // 单个响应，包装成数组
  return [response.data];
}
```

### 事件处理系统

```typescript
interface MouseClickEvent {
  type: "click";
  button: "left" | "right" | "middle";
  x: number;
  y: number;
  target: HTMLElement;
}

interface KeyboardEvent {
  type: "keydown" | "keyup";
  key: string;
  code: string;
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  };
}

interface TouchEvent {
  type: "touchstart" | "touchmove" | "touchend";
  touches: Array<{ x: number; y: number }>;
}

interface CustomEvent<T = unknown> {
  type: "custom";
  name: string;
  data: T;
}

type AppEvent = MouseClickEvent | KeyboardEvent | TouchEvent | CustomEvent;

function isMouseEvent(event: AppEvent): event is MouseClickEvent {
  return event.type === "click";
}

function isKeyboardEvent(event: AppEvent): event is KeyboardEvent {
  return event.type === "keydown" || event.type === "keyup";
}

function isTouchEvent(event: AppEvent): event is TouchEvent {
  return event.type === "touchstart" ||
         event.type === "touchmove" ||
         event.type === "touchend";
}

function isCustomEvent<T>(
  event: AppEvent,
  name?: string
): event is CustomEvent<T> {
  if (event.type !== "custom") return false;
  if (name && (event as CustomEvent).name !== name) return false;
  return true;
}

class EventEmitter {
  private handlers: Array<(event: AppEvent) => void> = [];

  on(handler: (event: AppEvent) => void) {
    this.handlers.push(handler);
  }

  emit(event: AppEvent) {
    this.handlers.forEach(handler => handler(event));
  }
}

// 使用示例
const emitter = new EventEmitter();

emitter.on((event) => {
  if (isMouseEvent(event)) {
    console.log(`鼠标${event.button}键点击: (${event.x}, ${event.y})`);
  } else if (isKeyboardEvent(event)) {
    const modifiers = [];
    if (event.modifiers.ctrl) modifiers.push("Ctrl");
    if (event.modifiers.shift) modifiers.push("Shift");
    if (event.modifiers.alt) modifiers.push("Alt");
    const prefix = modifiers.length > 0 ? modifiers.join("+") + "+" : "";
    console.log(`按键 ${event.type}: ${prefix}${event.key}`);
  } else if (isTouchEvent(event)) {
    console.log(`触摸事件 ${event.type}: ${event.touches.length} 个触点`);
  } else if (isCustomEvent<{ userId: number }>(event, "userLogin")) {
    console.log(`用户登录: ${event.data.userId}`);
  }
});
```

## 常见陷阱与最佳实践

### 陷阱1：类型守卫不验证运行时类型

```typescript
// 危险的类型守卫 - 检查不够严格
function isUser(value: unknown): value is User {
  // 这个检查不够严格！
  return value !== null && typeof value === "object";
}

// 更安全的版本
function isUserSafe(value: unknown): value is User {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === "number" &&
    typeof obj.name === "string" &&
    typeof obj.email === "string"
  );
}

// 最安全的版本 - 使用 Zod 等运行时验证库
import { z } from "zod";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;

function isUserWithZod(value: unknown): value is User {
  return UserSchema.safeParse(value).success;
}
```

### 陷阱2：忽略 null 检查

```typescript
function processElement(element: HTMLElement | null) {
  // 错误：可能是 null
  // element.style.color = "red";

  // 正确方式1：条件判断
  if (element) {
    element.style.color = "red";
  }

  // 正确方式2：使用断言
  if (element === null) {
    throw new Error("元素不存在");
  }
  element.style.color = "red";

  // 正确方式3：可选链
  element?.style && (element.style.color = "red");
}
```

### 陷阱3：typeof null 返回 "object"

```typescript
function processValue(value: object | null) {
  if (typeof value === "object") {
    // 注意：value 仍然可能是 null！
    // value.toString(); // 运行时错误
  }

  // 正确的做法
  if (value !== null && typeof value === "object") {
    value.toString(); // 安全
  }
}
```

### 陷阱4：类型守卫中的类型断言

```typescript
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  size: number;
}

type Shape = Circle | Square;

// 错误：使用类型断言绕过检查
function isCircle(shape: Shape): shape is Circle {
  // 这里用了断言，但实际上没有做任何检查
  return true; // 总是返回 true！
}

// 正确：实际检查类型
function isCircleCorrect(shape: Shape): shape is Circle {
  return shape.kind === "circle";
}
```

### 最佳实践总结

```typescript
// 1. 为常用的类型守卫创建可重用的函数
function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

// 2. 使用详细的错误信息
function assertIsNumber(value: unknown): asserts value is number {
  if (typeof value !== "number") {
    throw new TypeError(
      `期望 number 类型，但收到 ${typeof value}: ${JSON.stringify(value)}`
    );
  }
}

// 3. 使用穷尽性检查确保处理所有情况
function exhaustiveCheck(value: never): never {
  throw new Error(`未处理的值: ${value}`);
}

// 4. 优先使用类型守卫而非类型断言
// 不推荐
function processInputBad(input: unknown) {
  const str = input as string;
  return str.toUpperCase(); // 如果 input 不是字符串，运行时会报错
}

// 推荐
function processInputGood(input: unknown) {
  if (typeof input === "string") {
    return input.toUpperCase();
  }
  throw new Error("输入必须是字符串");
}

// 5. 为判别联合类型使用字面量类型
type Result =
  | { status: "loading" }
  | { status: "success"; data: unknown }
  | { status: "error"; error: string };

// 6. 避免过度使用非空断言
// 不推荐
function getUserBad(id: number) {
  const user = users.find(u => u.id === id)!;
  return user.name; // 如果找不到用户会崩溃
}

// 推荐
function getUserGood(id: number) {
  const user = users.find(u => u.id === id);
  if (!user) {
    throw new Error(`找不到 ID 为 ${id} 的用户`);
  }
  return user.name;
}
```

## 总结

类型守卫是 TypeScript 类型系统中不可或缺的一部分，它们帮助我们：

1. **提高类型安全性**：在运行时验证类型，确保代码的正确性
2. **改善开发体验**：获得更精确的类型推断和智能提示
3. **编写更清晰的代码**：明确表达类型检查的意图
4. **处理复杂的类型场景**：通过可辨识联合和自定义类型守卫处理复杂的业务逻辑

掌握类型守卫的使用，能够让你编写出更健壮、更易维护的 TypeScript 代码。在实际开发中，应该根据具体场景选择合适的类型守卫方式：

| 场景 | 推荐方式 |
|------|----------|
| 原始类型检查 | `typeof` |
| 类实例检查 | `instanceof` |
| 对象属性检查 | `in` 操作符 |
| 复杂类型判断 | 自定义类型守卫 |
| 必须满足的条件 | 断言函数 |
| 联合类型分支处理 | 可辨识联合模式 |

记住，类型守卫的核心目的是让 TypeScript 编译器理解你的代码意图，从而提供更好的类型推断和错误检查。合理使用这些技术，可以显著提升代码质量和开发效率。
