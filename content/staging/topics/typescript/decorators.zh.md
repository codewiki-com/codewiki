---
title: 装饰器
description: TypeScript装饰器完全指南，类装饰器、方法装饰器与属性装饰器
track: typescript
section: patterns
difficulty: advanced
tags:
  - TypeScript
  - 装饰器
  - 元编程
  - 设计模式
status: imported
origin: old/src/content/docs/typescript/decorators.zh.md
divergence: 0.281
issues: []
legacy:
  category: TypeScript
  subcategory: 高级特性
  order: 6
  lastUpdated: 2026-01-07
---

装饰器（Decorators）是 TypeScript 提供的一种元编程特性，它允许我们在不修改原有代码的情况下，为类、方法、属性或参数添加额外的功能。装饰器广泛应用于依赖注入、日志记录、权限验证、数据验证等场景。

## 什么是装饰器？

装饰器本质上是一个函数，它可以附加到类声明、方法、访问器、属性或参数上。装饰器使用 `@expression` 的形式，其中 `expression` 必须是一个函数，该函数在运行时被调用，接收被装饰目标的相关信息。

### 启用装饰器

要使用装饰器，需要在 `tsconfig.json` 中启用实验性装饰器支持：

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

- `experimentalDecorators`：启用装饰器语法支持
- `emitDecoratorMetadata`：启用元数据反射支持（配合 reflect-metadata 使用）

### 装饰器的基本形式

```typescript
// 最简单的装饰器
function simpleDecorator(target: any) {
  console.log("装饰器被调用");
}

@simpleDecorator
class MyClass {
  // 类的内容
}
```

## 类装饰器

类装饰器应用于类的构造函数，可以用来观察、修改或替换类定义。

### 基本类装饰器

```typescript
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Greeter {
  greeting: string;

  constructor(message: string) {
    this.greeting = message;
  }

  greet() {
    return `Hello, ${this.greeting}`;
  }
}

// 类和其原型被密封，无法添加新属性
```

### 类装饰器参数

类装饰器接收一个参数：

- `constructor`：类的构造函数

```typescript
function logClass(constructor: Function) {
  console.log(`类名: ${constructor.name}`);
  console.log(`原型方法:`, Object.getOwnPropertyNames(constructor.prototype));
}

@logClass
class Person {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  sayHello() {
    return `Hello, I'm ${this.name}`;
  }
}
// 输出:
// 类名: Person
// 原型方法: ["constructor", "sayHello"]
```

### 修改类的构造函数

类装饰器可以返回一个新的构造函数来替换原有的构造函数：

```typescript
function addTimestamp<T extends { new (...args: any[]): {} }>(
  constructor: T
) {
  return class extends constructor {
    createdAt = new Date();
  };
}

@addTimestamp
class Document {
  title: string;

  constructor(title: string) {
    this.title = title;
  }
}

const doc = new Document("我的文档");
console.log((doc as any).createdAt); // 输出当前时间
```

### 实际应用：单例模式

```typescript
function singleton<T extends { new (...args: any[]): {} }>(constructor: T) {
  let instance: T | null = null;

  return class extends constructor {
    constructor(...args: any[]) {
      if (instance) {
        return instance as any;
      }
      super(...args);
      instance = this as any;
    }
  };
}

@singleton
class Database {
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
    console.log("创建数据库连接");
  }

  query(sql: string) {
    console.log(`执行查询: ${sql}`);
  }
}

const db1 = new Database("mysql://localhost:3306");
const db2 = new Database("mysql://localhost:3307");

console.log(db1 === db2); // true，同一个实例
```

### 实际应用：注册组件

```typescript
const componentRegistry = new Map<string, Function>();

function Component(name: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    componentRegistry.set(name, constructor);
    return constructor;
  };
}

@Component("user-profile")
class UserProfile {
  render() {
    return "<div>用户资料</div>";
  }
}

@Component("user-list")
class UserList {
  render() {
    return "<div>用户列表</div>";
  }
}

// 获取注册的组件
console.log(componentRegistry.get("user-profile")); // UserProfile 类
```

## 方法装饰器

方法装饰器应用于方法的属性描述符，可以用来观察、修改或替换方法定义。

### 方法装饰器参数

方法装饰器接收三个参数：

- `target`：对于静态方法是类的构造函数，对于实例方法是类的原型对象
- `propertyKey`：方法的名称
- `descriptor`：方法的属性描述符

```typescript
function log(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`调用方法: ${propertyKey}`);
    console.log(`参数: ${JSON.stringify(args)}`);
    const result = originalMethod.apply(this, args);
    console.log(`返回值: ${result}`);
    return result;
  };

  return descriptor;
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }
}

const calc = new Calculator();
calc.add(2, 3);
// 输出:
// 调用方法: add
// 参数: [2,3]
// 返回值: 5
```

### 实际应用：性能计时

```typescript
function timing(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    const result = await originalMethod.apply(this, args);
    const end = performance.now();
    console.log(`${propertyKey} 执行时间: ${(end - start).toFixed(2)}ms`);
    return result;
  };

  return descriptor;
}

class DataService {
  @timing
  async fetchData(): Promise<string[]> {
    // 模拟异步操作
    await new Promise((resolve) => setTimeout(resolve, 100));
    return ["数据1", "数据2", "数据3"];
  }
}

const service = new DataService();
service.fetchData();
// 输出: fetchData 执行时间: 100.xx ms
```

### 实际应用：错误处理

```typescript
function catchError(message: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        console.error(`${message}: ${error}`);
        throw error;
      }
    };

    return descriptor;
  };
}

class ApiClient {
  @catchError("API 请求失败")
  async fetchUser(id: number): Promise<any> {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
}
```

### 实际应用：方法防抖

```typescript
function debounce(delay: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    let timeoutId: NodeJS.Timeout;

    descriptor.value = function (...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        originalMethod.apply(this, args);
      }, delay);
    };

    return descriptor;
  };
}

class SearchComponent {
  @debounce(300)
  search(keyword: string) {
    console.log(`搜索: ${keyword}`);
  }
}

const component = new SearchComponent();
component.search("a");
component.search("ab");
component.search("abc"); // 只有这个会执行（300ms 后）
```

### 实际应用：方法节流

```typescript
function throttle(limit: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    let lastCall = 0;

    descriptor.value = function (...args: any[]) {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

class ScrollHandler {
  @throttle(100)
  onScroll(position: number) {
    console.log(`滚动位置: ${position}`);
  }
}
```

### 实际应用：缓存结果

```typescript
function memoize(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const cache = new Map<string, any>();

  descriptor.value = function (...args: any[]) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      console.log(`从缓存获取: ${key}`);
      return cache.get(key);
    }
    const result = originalMethod.apply(this, args);
    cache.set(key, result);
    return result;
  };

  return descriptor;
}

class MathService {
  @memoize
  fibonacci(n: number): number {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
}

const math = new MathService();
console.log(math.fibonacci(40)); // 首次计算
console.log(math.fibonacci(40)); // 从缓存获取
```

## 属性装饰器

属性装饰器应用于类的属性声明，可以用来观察属性的定义。

### 属性装饰器参数

属性装饰器接收两个参数：

- `target`：对于静态属性是类的构造函数，对于实例属性是类的原型对象
- `propertyKey`：属性的名称

```typescript
function logProperty(target: any, propertyKey: string) {
  console.log(`属性 "${propertyKey}" 已声明在 ${target.constructor.name}`);
}

class Example {
  @logProperty
  name: string = "示例";

  @logProperty
  value: number = 42;
}
// 输出:
// 属性 "name" 已声明在 Example
// 属性 "value" 已声明在 Example
```

### 实际应用：属性验证

```typescript
function required(target: any, propertyKey: string) {
  let value: any;

  const getter = function () {
    return value;
  };

  const setter = function (newVal: any) {
    if (newVal === undefined || newVal === null || newVal === "") {
      throw new Error(`属性 ${propertyKey} 是必填的`);
    }
    value = newVal;
  };

  Object.defineProperty(target, propertyKey, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true,
  });
}

class User {
  @required
  username!: string;

  email?: string;
}

const user = new User();
// user.username = ""; // 抛出错误: 属性 username 是必填的
user.username = "alice"; // 正常
```

### 实际应用：属性范围限制

```typescript
function range(min: number, max: number) {
  return function (target: any, propertyKey: string) {
    let value: number;

    const getter = function () {
      return value;
    };

    const setter = function (newVal: number) {
      if (newVal < min || newVal > max) {
        throw new Error(`${propertyKey} 必须在 ${min} 和 ${max} 之间`);
      }
      value = newVal;
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
    });
  };
}

class Product {
  name: string = "";

  @range(0, 100)
  discount!: number;

  @range(1, 10000)
  price!: number;
}

const product = new Product();
product.discount = 20; // 正常
// product.discount = 150; // 抛出错误
```

### 实际应用：只读属性

```typescript
function readonly(target: any, propertyKey: string) {
  Object.defineProperty(target, propertyKey, {
    writable: false,
  });
}

class Config {
  @readonly
  version: string = "1.0.0";

  @readonly
  name: string = "MyApp";
}

const config = new Config();
console.log(config.version); // "1.0.0"
// config.version = "2.0.0"; // 严格模式下抛出错误
```

### 实际应用：格式化属性

```typescript
function format(formatFn: (value: any) => any) {
  return function (target: any, propertyKey: string) {
    let value: any;

    const getter = function () {
      return value;
    };

    const setter = function (newVal: any) {
      value = formatFn(newVal);
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
    });
  };
}

class Person {
  @format((val: string) => val.trim().toLowerCase())
  email!: string;

  @format((val: string) => val.trim())
  name!: string;
}

const person = new Person();
person.email = "  ALICE@EXAMPLE.COM  ";
console.log(person.email); // "alice@example.com"
```

## 参数装饰器

参数装饰器应用于方法的参数，可以用来观察参数的定义。

### 参数装饰器参数

参数装饰器接收三个参数：

- `target`：对于静态方法是类的构造函数，对于实例方法是类的原型对象
- `propertyKey`：方法的名称
- `parameterIndex`：参数在参数列表中的索引

```typescript
function logParameter(
  target: any,
  propertyKey: string,
  parameterIndex: number
) {
  console.log(
    `参数装饰器: 方法 ${propertyKey} 的第 ${parameterIndex} 个参数`
  );
}

class UserService {
  greet(
    @logParameter name: string,
    @logParameter age: number
  ) {
    return `Hello, ${name}! You are ${age} years old.`;
  }
}
// 输出:
// 参数装饰器: 方法 greet 的第 1 个参数
// 参数装饰器: 方法 greet 的第 0 个参数
```

### 结合元数据使用

参数装饰器通常与元数据配合使用，实现参数验证等功能：

```typescript
import "reflect-metadata";

const requiredMetadataKey = Symbol("required");

function required(
  target: any,
  propertyKey: string,
  parameterIndex: number
) {
  const existingRequiredParameters: number[] =
    Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey) || [];
  existingRequiredParameters.push(parameterIndex);
  Reflect.defineMetadata(
    requiredMetadataKey,
    existingRequiredParameters,
    target,
    propertyKey
  );
}

function validate(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const requiredParameters: number[] =
      Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey) || [];

    for (const index of requiredParameters) {
      if (args[index] === undefined || args[index] === null) {
        throw new Error(`参数 ${index} 是必填的`);
      }
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}

class UserService {
  @validate
  createUser(@required name: string, age?: number) {
    return { name, age };
  }
}

const service = new UserService();
service.createUser("Alice", 30); // 正常
// service.createUser(null as any); // 抛出错误: 参数 0 是必填的
```

## 装饰器工厂

装饰器工厂是一个返回装饰器函数的函数，它允许我们自定义装饰器的行为。

### 基本装饰器工厂

```typescript
function log(prefix: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      console.log(`[${prefix}] 调用 ${propertyKey}`);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

class Service {
  @log("DEBUG")
  debug() {
    console.log("调试信息");
  }

  @log("INFO")
  info() {
    console.log("普通信息");
  }

  @log("ERROR")
  error() {
    console.log("错误信息");
  }
}

const service = new Service();
service.debug(); // [DEBUG] 调用 debug \n 调试信息
service.info();  // [INFO] 调用 info \n 普通信息
```

### 配置化装饰器工厂

```typescript
interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff?: boolean;
}

function retry(options: RetryOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError: Error | undefined;

      for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error as Error;
          console.log(`尝试 ${attempt}/${options.maxAttempts} 失败`);

          if (attempt < options.maxAttempts) {
            const delay = options.backoff
              ? options.delay * Math.pow(2, attempt - 1)
              : options.delay;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError;
    };

    return descriptor;
  };
}

class ApiClient {
  @retry({ maxAttempts: 3, delay: 1000, backoff: true })
  async fetchData(): Promise<any> {
    const response = await fetch("/api/data");
    if (!response.ok) {
      throw new Error("请求失败");
    }
    return response.json();
  }
}
```

### 条件装饰器工厂

```typescript
function conditionalLog(condition: boolean) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    if (!condition) {
      return descriptor;
    }

    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      console.log(`[LOG] ${propertyKey} 被调用`);
      const result = originalMethod.apply(this, args);
      console.log(`[LOG] ${propertyKey} 返回:`, result);
      return result;
    };

    return descriptor;
  };
}

const isDevelopment = process.env.NODE_ENV === "development";

class AppService {
  @conditionalLog(isDevelopment)
  processData(data: any) {
    return data;
  }
}
```

## 装饰器组合

多个装饰器可以同时应用到同一个声明上。装饰器的执行顺序是：从下到上（求值时从上到下）。

### 装饰器执行顺序

```typescript
function first() {
  console.log("first(): 装饰器工厂求值");
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    console.log("first(): 装饰器执行");
  };
}

function second() {
  console.log("second(): 装饰器工厂求值");
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    console.log("second(): 装饰器执行");
  };
}

class Example {
  @first()
  @second()
  method() {}
}

// 输出:
// first(): 装饰器工厂求值
// second(): 装饰器工厂求值
// second(): 装饰器执行
// first(): 装饰器执行
```

### 实际应用：组合多个功能

```typescript
function auth(role: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // 假设 this.userRole 是当前用户角色
      if ((this as any).userRole !== role) {
        throw new Error(`需要 ${role} 权限`);
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

function log(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`[LOG] 调用 ${propertyKey}`);
    return originalMethod.apply(this, args);
  };

  return descriptor;
}

function timing(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = Date.now();
    const result = await originalMethod.apply(this, args);
    console.log(`[TIMING] ${propertyKey}: ${Date.now() - start}ms`);
    return result;
  };

  return descriptor;
}

class AdminService {
  userRole = "admin";

  @auth("admin")
  @log
  @timing
  async deleteUser(userId: number) {
    await new Promise((r) => setTimeout(r, 100));
    console.log(`删除用户 ${userId}`);
    return true;
  }
}
```

## 元数据与反射

TypeScript 支持使用 `reflect-metadata` 库来添加和读取元数据。

### 安装 reflect-metadata

```bash
npm install reflect-metadata
```

### 基本元数据操作

```typescript
import "reflect-metadata";

const formatMetadataKey = Symbol("format");

function format(formatString: string) {
  return Reflect.metadata(formatMetadataKey, formatString);
}

function getFormat(target: any, propertyKey: string) {
  return Reflect.getMetadata(formatMetadataKey, target, propertyKey);
}

class Greeter {
  @format("Hello, %s")
  greeting: string;

  constructor(message: string) {
    this.greeting = message;
  }

  greet() {
    const formatString = getFormat(this, "greeting");
    return formatString.replace("%s", this.greeting);
  }
}

const greeter = new Greeter("World");
console.log(greeter.greet()); // "Hello, World"
```

### 设计时类型元数据

启用 `emitDecoratorMetadata` 后，TypeScript 会自动添加类型元数据：

```typescript
import "reflect-metadata";

function logType(target: any, propertyKey: string) {
  const type = Reflect.getMetadata("design:type", target, propertyKey);
  console.log(`${propertyKey} 的类型是: ${type.name}`);
}

class Example {
  @logType
  name: string = "";

  @logType
  age: number = 0;

  @logType
  isActive: boolean = true;

  @logType
  tags: string[] = [];
}
// 输出:
// name 的类型是: String
// age 的类型是: Number
// isActive 的类型是: Boolean
// tags 的类型是: Array
```

### 方法参数类型元数据

```typescript
import "reflect-metadata";

function logMethodTypes(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const paramTypes = Reflect.getMetadata(
    "design:paramtypes",
    target,
    propertyKey
  );
  const returnType = Reflect.getMetadata(
    "design:returntype",
    target,
    propertyKey
  );

  console.log(`方法: ${propertyKey}`);
  console.log(`参数类型:`, paramTypes?.map((t: any) => t.name));
  console.log(`返回类型:`, returnType?.name);
}

class Calculator {
  @logMethodTypes
  add(a: number, b: number): number {
    return a + b;
  }

  @logMethodTypes
  concat(str1: string, str2: string): string {
    return str1 + str2;
  }
}
// 输出:
// 方法: add
// 参数类型: ["Number", "Number"]
// 返回类型: Number
// 方法: concat
// 参数类型: ["String", "String"]
// 返回类型: String
```

### 实际应用：依赖注入

```typescript
import "reflect-metadata";

const container = new Map<string, any>();

function Injectable() {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    container.set(constructor.name, constructor);
    return constructor;
  };
}

function Inject(serviceName: string) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: () => {
        const ServiceClass = container.get(serviceName);
        if (!ServiceClass) {
          throw new Error(`服务 ${serviceName} 未注册`);
        }
        return new ServiceClass();
      },
    });
  };
}

@Injectable()
class LoggerService {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

@Injectable()
class UserService {
  @Inject("LoggerService")
  private logger!: LoggerService;

  createUser(name: string) {
    this.logger.log(`创建用户: ${name}`);
    return { name };
  }
}

const userService = new UserService();
userService.createUser("Alice");
// 输出: [LOG] 创建用户: Alice
```

## 访问器装饰器

访问器装饰器应用于属性的 getter 或 setter，与方法装饰器类似。

```typescript
function configurable(value: boolean) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    descriptor.configurable = value;
  };
}

class Point {
  private _x: number;
  private _y: number;

  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  @configurable(false)
  get x() {
    return this._x;
  }

  @configurable(false)
  get y() {
    return this._y;
  }
}
```

### 实际应用：懒加载

```typescript
function lazy(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalGetter = descriptor.get;
  if (!originalGetter) {
    throw new Error("lazy 装饰器只能用于 getter");
  }

  const cacheKey = Symbol(propertyKey);

  descriptor.get = function () {
    if (!(this as any)[cacheKey]) {
      console.log(`首次计算 ${propertyKey}`);
      (this as any)[cacheKey] = originalGetter.call(this);
    }
    return (this as any)[cacheKey];
  };

  return descriptor;
}

class ExpensiveResource {
  @lazy
  get data() {
    // 模拟耗时计算
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += i;
    }
    return result;
  }
}

const resource = new ExpensiveResource();
console.log(resource.data); // 首次计算 data，输出结果
console.log(resource.data); // 直接返回缓存值
```

## 装饰器执行时机

不同类型的装饰器有不同的执行时机和顺序：

```typescript
function classDecorator(constructor: Function) {
  console.log("1. 类装饰器");
}

function methodDecorator(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  console.log("2. 方法装饰器");
}

function propertyDecorator(target: any, propertyKey: string) {
  console.log("3. 属性装饰器");
}

function parameterDecorator(
  target: any,
  propertyKey: string,
  parameterIndex: number
) {
  console.log("4. 参数装饰器");
}

@classDecorator
class Demo {
  @propertyDecorator
  prop: string = "";

  @methodDecorator
  method(@parameterDecorator param: string) {}
}

// 输出顺序:
// 3. 属性装饰器
// 4. 参数装饰器
// 2. 方法装饰器
// 1. 类装饰器
```

执行顺序规则：
1. 参数装饰器，然后是方法、访问器或属性装饰器
2. 静态成员先于实例成员
3. 最后执行类装饰器

## 实际应用案例

### 表单验证系统

```typescript
import "reflect-metadata";

// 验证规则存储
const validationRules = new Map<any, Map<string, Function[]>>();

function getValidators(target: any, propertyKey: string): Function[] {
  const classRules = validationRules.get(target.constructor) || new Map();
  return classRules.get(propertyKey) || [];
}

function addValidator(
  target: any,
  propertyKey: string,
  validator: Function
) {
  let classRules = validationRules.get(target.constructor);
  if (!classRules) {
    classRules = new Map();
    validationRules.set(target.constructor, classRules);
  }

  let propValidators = classRules.get(propertyKey);
  if (!propValidators) {
    propValidators = [];
    classRules.set(propertyKey, propValidators);
  }

  propValidators.push(validator);
}

// 验证装饰器
function Required(target: any, propertyKey: string) {
  addValidator(target, propertyKey, (value: any) => {
    if (value === undefined || value === null || value === "") {
      return `${propertyKey} 是必填项`;
    }
    return null;
  });
}

function MinLength(length: number) {
  return function (target: any, propertyKey: string) {
    addValidator(target, propertyKey, (value: string) => {
      if (value && value.length < length) {
        return `${propertyKey} 最少需要 ${length} 个字符`;
      }
      return null;
    });
  };
}

function MaxLength(length: number) {
  return function (target: any, propertyKey: string) {
    addValidator(target, propertyKey, (value: string) => {
      if (value && value.length > length) {
        return `${propertyKey} 最多允许 ${length} 个字符`;
      }
      return null;
    });
  };
}

function Email(target: any, propertyKey: string) {
  addValidator(target, propertyKey, (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return `${propertyKey} 格式不正确`;
    }
    return null;
  });
}

function Range(min: number, max: number) {
  return function (target: any, propertyKey: string) {
    addValidator(target, propertyKey, (value: number) => {
      if (value !== undefined && (value < min || value > max)) {
        return `${propertyKey} 必须在 ${min} 到 ${max} 之间`;
      }
      return null;
    });
  };
}

// 验证函数
function validate(obj: any): string[] {
  const errors: string[] = [];
  const classRules = validationRules.get(obj.constructor);

  if (classRules) {
    for (const [propertyKey, validators] of classRules) {
      const value = obj[propertyKey];
      for (const validator of validators) {
        const error = validator(value);
        if (error) {
          errors.push(error);
        }
      }
    }
  }

  return errors;
}

// 使用示例
class UserForm {
  @Required
  @MinLength(2)
  @MaxLength(50)
  username!: string;

  @Required
  @Email
  email!: string;

  @Range(18, 120)
  age?: number;

  @MinLength(8)
  password?: string;
}

const form = new UserForm();
form.username = "a";
form.email = "invalid-email";
form.age = 15;

const errors = validate(form);
console.log(errors);
// [
//   "username 最少需要 2 个字符",
//   "email 格式不正确",
//   "age 必须在 18 到 120 之间"
// ]
```

### API 路由装饰器

```typescript
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RouteDefinition {
  path: string;
  method: HttpMethod;
  handlerName: string;
}

const routes: RouteDefinition[] = [];

function Controller(basePath: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    const controllerRoutes = Reflect.getMetadata("routes", constructor) || [];
    controllerRoutes.forEach((route: RouteDefinition) => {
      routes.push({
        ...route,
        path: basePath + route.path,
      });
    });
    return constructor;
  };
}

function createMethodDecorator(method: HttpMethod) {
  return function (path: string) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const existingRoutes: RouteDefinition[] =
        Reflect.getMetadata("routes", target.constructor) || [];

      existingRoutes.push({
        path,
        method,
        handlerName: propertyKey,
      });

      Reflect.defineMetadata("routes", existingRoutes, target.constructor);
    };
  };
}

const Get = createMethodDecorator("GET");
const Post = createMethodDecorator("POST");
const Put = createMethodDecorator("PUT");
const Delete = createMethodDecorator("DELETE");

@Controller("/api/users")
class UserController {
  @Get("/")
  getAllUsers() {
    return { users: [] };
  }

  @Get("/:id")
  getUserById() {
    return { user: {} };
  }

  @Post("/")
  createUser() {
    return { created: true };
  }

  @Put("/:id")
  updateUser() {
    return { updated: true };
  }

  @Delete("/:id")
  deleteUser() {
    return { deleted: true };
  }
}

console.log(routes);
// [
//   { path: "/api/users/", method: "GET", handlerName: "getAllUsers" },
//   { path: "/api/users/:id", method: "GET", handlerName: "getUserById" },
//   { path: "/api/users/", method: "POST", handlerName: "createUser" },
//   { path: "/api/users/:id", method: "PUT", handlerName: "updateUser" },
//   { path: "/api/users/:id", method: "DELETE", handlerName: "deleteUser" }
// ]
```

### ORM 实体装饰器

```typescript
import "reflect-metadata";

interface ColumnOptions {
  type?: "string" | "number" | "boolean" | "date";
  nullable?: boolean;
  unique?: boolean;
  default?: any;
}

interface EntityMetadata {
  tableName: string;
  columns: Map<string, ColumnOptions>;
  primaryKey?: string;
}

const entityMetadata = new Map<Function, EntityMetadata>();

function Entity(tableName: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    let metadata = entityMetadata.get(constructor);
    if (!metadata) {
      metadata = { tableName, columns: new Map() };
      entityMetadata.set(constructor, metadata);
    } else {
      metadata.tableName = tableName;
    }
    return constructor;
  };
}

function Column(options: ColumnOptions = {}) {
  return function (target: any, propertyKey: string) {
    let metadata = entityMetadata.get(target.constructor);
    if (!metadata) {
      metadata = { tableName: "", columns: new Map() };
      entityMetadata.set(target.constructor, metadata);
    }

    // 自动推断类型
    const type = Reflect.getMetadata("design:type", target, propertyKey);
    if (!options.type && type) {
      const typeMap: Record<string, ColumnOptions["type"]> = {
        String: "string",
        Number: "number",
        Boolean: "boolean",
        Date: "date",
      };
      options.type = typeMap[type.name];
    }

    metadata.columns.set(propertyKey, options);
  };
}

function PrimaryKey(target: any, propertyKey: string) {
  let metadata = entityMetadata.get(target.constructor);
  if (!metadata) {
    metadata = { tableName: "", columns: new Map() };
    entityMetadata.set(target.constructor, metadata);
  }
  metadata.primaryKey = propertyKey;
}

@Entity("users")
class User {
  @PrimaryKey
  @Column()
  id!: number;

  @Column({ nullable: false })
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  age?: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column()
  createdAt!: Date;
}

// 获取实体元数据
const userMetadata = entityMetadata.get(User);
console.log("表名:", userMetadata?.tableName);
console.log("主键:", userMetadata?.primaryKey);
console.log("列:", Array.from(userMetadata?.columns.entries() || []));
```

## 最佳实践

### 保持装饰器单一职责

```typescript
// 好的做法：每个装饰器只做一件事
@Auth("admin")
@Log()
@Validate()
async deleteUser(id: number) {}

// 避免：一个装饰器做太多事情
@DoEverything()
async deleteUser(id: number) {}
```

### 装饰器应该是可组合的

```typescript
// 设计可以组合使用的装饰器
function compose(...decorators: MethodDecorator[]): MethodDecorator {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    decorators.reverse().forEach((decorator) => {
      descriptor = decorator(target, propertyKey, descriptor) || descriptor;
    });
    return descriptor;
  };
}

class Service {
  @compose(log, timing, errorHandler)
  async processData() {}
}
```

### 提供清晰的错误信息

```typescript
function requiresConfig(configKey: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    if (!process.env[configKey]) {
      throw new Error(
        `类 ${constructor.name} 需要环境变量 ${configKey}，` +
        `请在 .env 文件中配置`
      );
    }
    return constructor;
  };
}
```

### 使用工厂函数提供配置

```typescript
// 使用工厂函数而非多个参数
interface CacheOptions {
  ttl?: number;
  key?: string;
  storage?: "memory" | "redis";
}

function Cache(options: CacheOptions = {}) {
  const { ttl = 3600, key, storage = "memory" } = options;

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // 实现缓存逻辑
  };
}

class DataService {
  @Cache({ ttl: 60, storage: "redis" })
  async fetchData() {}
}
```

### 文档化装饰器

```typescript
/**
 * 为方法添加重试逻辑
 *
 * @param options - 重试配置选项
 * @param options.maxAttempts - 最大重试次数，默认 3
 * @param options.delay - 重试间隔（毫秒），默认 1000
 * @param options.backoff - 是否启用指数退避，默认 false
 *
 * @example
 * class ApiService {
 *   @Retry({ maxAttempts: 5, delay: 2000, backoff: true })
 *   async fetchData() {
 *     // ...
 *   }
 * }
 */
function Retry(options: RetryOptions) {
  // 实现...
}
```

## 总结

装饰器是 TypeScript 中强大的元编程工具，它提供了：

1. **声明式编程**：通过装饰器声明类和方法的行为，而非命令式地修改代码
2. **代码复用**：将横切关注点（如日志、验证、缓存）抽取为可复用的装饰器
3. **关注点分离**：业务逻辑与基础设施代码分离，提高代码可维护性
4. **元编程能力**：通过反射和元数据实现运行时的类型检查和依赖注入

装饰器在现代 TypeScript 框架中广泛使用，如：

- **Angular**：组件、服务、指令装饰器
- **NestJS**：控制器、模块、中间件装饰器
- **TypeORM**：实体、列、关系装饰器
- **MobX**：observable、action、computed 装饰器

掌握装饰器的使用，将帮助你更好地理解这些框架的设计理念，并能够创建自己的装饰器来满足特定需求。

## 参考资源

- [TypeScript 官方文档 - 装饰器](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [TC39 装饰器提案](https://github.com/tc39/proposal-decorators)
- [reflect-metadata](https://github.com/rbuckton/reflect-metadata)
- [TypeScript 装饰器深入解析](https://www.typescriptlang.org/docs/handbook/decorators.html)
