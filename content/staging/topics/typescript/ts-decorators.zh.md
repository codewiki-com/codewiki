---
title: TypeScript 装饰器
description: 深入理解TypeScript装饰器及其应用
track: typescript
section: generics-advanced
difficulty: advanced
tags:
  - TypeScript
  - 装饰器
  - 元编程
  - AOP
status: imported
origin: old/src/content/docs/frontend/ts-decorators.zh.md
divergence: 0.279
issues: []
legacy:
  category: Frontend
  subcategory: TypeScript
  order: 44
  lastUpdated: 2026-01-07
---

装饰器（Decorators）是 TypeScript 中一种特殊的声明，它可以被附加到类声明、方法、访问器、属性或参数上。装饰器使用 `@expression` 的形式，其中 `expression` 必须求值为一个函数，该函数会在运行时被调用，并被传入装饰目标的相关信息。

## 概念解释

### 什么是装饰器？

装饰器本质上是一种**元编程**技术，它允许我们在不修改原有代码的情况下，为类或类成员添加额外的行为。这是一种实现**面向切面编程（AOP）**的优雅方式。

```typescript
// 简单的装饰器示例
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`调用方法 ${propertyKey}，参数:`, args);
    const result = originalMethod.apply(this, args);
    console.log(`方法 ${propertyKey} 返回:`, result);
    return result;
  };

  return descriptor;
}

class Calculator {
  @Log
  add(a: number, b: number): number {
    return a + b;
  }
}

const calc = new Calculator();
calc.add(2, 3);
// 输出:
// 调用方法 add，参数: [2, 3]
// 方法 add 返回: 5
```

### 为什么需要装饰器？

1. **代码复用**：将通用逻辑（如日志、验证、缓存）抽离为可复用的装饰器
2. **关注点分离**：业务逻辑与横切关注点分离
3. **声明式编程**：通过声明的方式添加行为，代码更清晰
4. **元数据管理**：配合 Reflect Metadata 实现依赖注入等高级模式
5. **框架集成**：NestJS、Angular、TypeORM 等框架大量使用装饰器

### 启用装饰器

装饰器目前是 ECMAScript 的一个提案（Stage 3），TypeScript 提供了实验性支持。要使用装饰器，需要在 `tsconfig.json` 中启用：

```json
{
  "compilerOptions": {
    "target": "ES5",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

- `experimentalDecorators`: 启用装饰器语法
- `emitDecoratorMetadata`: 发出设计类型元数据（配合 reflect-metadata 使用）

## 装饰器类型

TypeScript 支持五种类型的装饰器，它们的执行顺序和接收的参数各不相同。

### 类装饰器（Class Decorator）

类装饰器应用于类构造函数，可以用来观察、修改或替换类定义。

```typescript
// 类装饰器签名
type ClassDecorator = <TFunction extends Function>(
  target: TFunction
) => TFunction | void;

// 基础类装饰器
function Sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@Sealed
class BankAccount {
  balance: number = 0;

  deposit(amount: number) {
    this.balance += amount;
  }
}

// 无法添加新属性
// BankAccount.prototype.withdraw = function() {}; // 运行时错误
```

#### 扩展类的类装饰器

```typescript
function WithTimestamp<T extends { new (...args: any[]): {} }>(constructor: T) {
  return class extends constructor {
    createdAt = new Date();
    updatedAt = new Date();
  };
}

@WithTimestamp
class User {
  constructor(public name: string) {}
}

const user = new User("张三");
console.log((user as any).createdAt); // 当前时间
```

#### 收集类元数据

```typescript
const registeredControllers: Function[] = [];

function Controller(path: string) {
  return function (target: Function) {
    Reflect.defineMetadata("path", path, target);
    registeredControllers.push(target);
  };
}

@Controller("/users")
class UserController {
  // ...
}

@Controller("/products")
class ProductController {
  // ...
}

console.log(registeredControllers); // [UserController, ProductController]
```

### 方法装饰器（Method Decorator）

方法装饰器应用于方法的属性描述符，可以用来观察、修改或替换方法定义。

```typescript
// 方法装饰器签名
type MethodDecorator = <T>(
  target: Object,                    // 对于静态成员是类构造函数，对于实例成员是类的原型
  propertyKey: string | symbol,      // 方法名
  descriptor: TypedPropertyDescriptor<T>  // 属性描述符
) => TypedPropertyDescriptor<T> | void;

// 性能计时装饰器
function Measure(
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
  @Measure
  async fetchData() {
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 100));
    return { data: "测试数据" };
  }
}
```

#### 错误处理装饰器

```typescript
function Catch(errorHandler: (error: Error, context: any) => void) {
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
        errorHandler(error as Error, this);
      }
    };

    return descriptor;
  };
}

class ApiClient {
  @Catch((error, context) => {
    console.error(`API 调用失败: ${error.message}`);
    // 可以发送错误到监控服务
  })
  async request(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
}
```

#### 缓存装饰器

```typescript
function Memoize(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const cache = new Map<string, any>();

  descriptor.value = function (...args: any[]) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log(`[缓存命中] ${propertyKey}`);
      return cache.get(key);
    }

    const result = originalMethod.apply(this, args);
    cache.set(key, result);
    return result;
  };

  return descriptor;
}

class MathService {
  @Memoize
  fibonacci(n: number): number {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
}
```

### 属性装饰器（Property Decorator）

属性装饰器应用于类的属性。它不能修改属性描述符，但可以用来记录元数据。

```typescript
// 属性装饰器签名
type PropertyDecorator = (
  target: Object,               // 对于静态成员是类构造函数，对于实例成员是类的原型
  propertyKey: string | symbol  // 属性名
) => void;

// 标记必填属性
function Required(target: any, propertyKey: string) {
  const requiredProperties: string[] =
    Reflect.getMetadata("required", target) || [];
  requiredProperties.push(propertyKey);
  Reflect.defineMetadata("required", requiredProperties, target);
}

// 验证装饰器
function Validate(target: any, propertyKey: string) {
  let value: any;

  const getter = function () {
    return value;
  };

  const setter = function (newValue: any) {
    const requiredProperties: string[] =
      Reflect.getMetadata("required", target) || [];

    if (requiredProperties.includes(propertyKey) && !newValue) {
      throw new Error(`属性 ${propertyKey} 是必填的`);
    }

    value = newValue;
  };

  Object.defineProperty(target, propertyKey, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true,
  });
}

class UserForm {
  @Required
  @Validate
  username!: string;

  @Validate
  nickname?: string;
}
```

#### 类型验证装饰器

```typescript
function MinLength(length: number) {
  return function (target: any, propertyKey: string) {
    let value: string;

    Object.defineProperty(target, propertyKey, {
      get: () => value,
      set: (newValue: string) => {
        if (newValue && newValue.length < length) {
          throw new Error(
            `${propertyKey} 长度不能小于 ${length}，当前长度: ${newValue.length}`
          );
        }
        value = newValue;
      },
    });
  };
}

function MaxLength(length: number) {
  return function (target: any, propertyKey: string) {
    let value: string;

    Object.defineProperty(target, propertyKey, {
      get: () => value,
      set: (newValue: string) => {
        if (newValue && newValue.length > length) {
          throw new Error(
            `${propertyKey} 长度不能大于 ${length}，当前长度: ${newValue.length}`
          );
        }
        value = newValue;
      },
    });
  };
}

class Article {
  @MinLength(5)
  @MaxLength(100)
  title!: string;

  @MinLength(10)
  content!: string;
}
```

### 参数装饰器（Parameter Decorator）

参数装饰器应用于方法参数，通常用于记录元数据，配合方法装饰器实现参数验证。

```typescript
// 参数装饰器签名
type ParameterDecorator = (
  target: Object,                // 对于静态成员是类构造函数，对于实例成员是类的原型
  propertyKey: string | symbol,  // 方法名
  parameterIndex: number         // 参数在参数列表中的索引
) => void;

// 标记必需参数
const REQUIRED_PARAMS = Symbol("required");

function RequiredParam(
  target: any,
  propertyKey: string,
  parameterIndex: number
) {
  const existingRequiredParams: number[] =
    Reflect.getOwnMetadata(REQUIRED_PARAMS, target, propertyKey) || [];
  existingRequiredParams.push(parameterIndex);
  Reflect.defineMetadata(
    REQUIRED_PARAMS,
    existingRequiredParams,
    target,
    propertyKey
  );
}

// 验证必需参数
function ValidateParams(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const requiredParams: number[] =
      Reflect.getOwnMetadata(REQUIRED_PARAMS, target, propertyKey) || [];

    for (const index of requiredParams) {
      if (args[index] === undefined || args[index] === null) {
        throw new Error(
          `方法 ${propertyKey} 的第 ${index + 1} 个参数是必需的`
        );
      }
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}

class UserService {
  @ValidateParams
  createUser(
    @RequiredParam name: string,
    @RequiredParam email: string,
    age?: number
  ) {
    return { name, email, age };
  }
}

const service = new UserService();
service.createUser("张三", "zhang@example.com"); // OK
// service.createUser("张三", null); // Error: 第 2 个参数是必需的
```

### 访问器装饰器（Accessor Decorator）

访问器装饰器应用于访问器（getter/setter）的属性描述符。

```typescript
function Configurable(value: boolean) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    descriptor.configurable = value;
  };
}

function Enumerable(value: boolean) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    descriptor.enumerable = value;
  };
}

class Point {
  private _x: number;
  private _y: number;

  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  @Configurable(false)
  @Enumerable(true)
  get x() {
    return this._x;
  }

  @Configurable(false)
  @Enumerable(true)
  get y() {
    return this._y;
  }
}
```

## 装饰器工厂

装饰器工厂是一个返回装饰器的函数，允许我们自定义装饰器的行为。

```typescript
// 基础装饰器工厂
function Logger(prefix: string) {
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

class OrderService {
  @Logger("订单模块")
  createOrder(productId: string, quantity: number) {
    // ...
  }

  @Logger("订单模块")
  cancelOrder(orderId: string) {
    // ...
  }
}
```

### 可配置的验证装饰器工厂

```typescript
interface ValidationOptions {
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
}

function Validate(options: ValidationOptions) {
  return function (target: any, propertyKey: string) {
    let value: any;

    const getter = () => value;

    const setter = (newValue: any) => {
      // 最小值验证
      if (options.min !== undefined) {
        if (typeof newValue === "number" && newValue < options.min) {
          throw new Error(
            options.message || `${propertyKey} 不能小于 ${options.min}`
          );
        }
        if (typeof newValue === "string" && newValue.length < options.min) {
          throw new Error(
            options.message || `${propertyKey} 长度不能小于 ${options.min}`
          );
        }
      }

      // 最大值验证
      if (options.max !== undefined) {
        if (typeof newValue === "number" && newValue > options.max) {
          throw new Error(
            options.message || `${propertyKey} 不能大于 ${options.max}`
          );
        }
        if (typeof newValue === "string" && newValue.length > options.max) {
          throw new Error(
            options.message || `${propertyKey} 长度不能大于 ${options.max}`
          );
        }
      }

      // 正则验证
      if (options.pattern && !options.pattern.test(String(newValue))) {
        throw new Error(options.message || `${propertyKey} 格式不正确`);
      }

      value = newValue;
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
    });
  };
}

class Registration {
  @Validate({ min: 3, max: 20, message: "用户名长度必须在 3-20 之间" })
  username!: string;

  @Validate({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "邮箱格式不正确"
  })
  email!: string;

  @Validate({ min: 18, max: 120, message: "年龄必须在 18-120 之间" })
  age!: number;
}
```

### 组合多个装饰器工厂

```typescript
// HTTP 方法装饰器工厂
function HttpMethod(method: string, path: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata("method", method, target, propertyKey);
    Reflect.defineMetadata("path", path, target, propertyKey);
  };
}

const Get = (path: string) => HttpMethod("GET", path);
const Post = (path: string) => HttpMethod("POST", path);
const Put = (path: string) => HttpMethod("PUT", path);
const Delete = (path: string) => HttpMethod("DELETE", path);

// 中间件装饰器
function UseMiddleware(...middlewares: Function[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const existingMiddlewares =
      Reflect.getMetadata("middlewares", target, propertyKey) || [];
    Reflect.defineMetadata(
      "middlewares",
      [...existingMiddlewares, ...middlewares],
      target,
      propertyKey
    );
  };
}

// 使用示例
const authMiddleware = (req: any, res: any, next: Function) => {
  // 验证逻辑
  next();
};

const logMiddleware = (req: any, res: any, next: Function) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

@Controller("/api/users")
class UserController {
  @Get("/")
  @UseMiddleware(logMiddleware)
  findAll() {
    // ...
  }

  @Post("/")
  @UseMiddleware(authMiddleware, logMiddleware)
  create() {
    // ...
  }

  @Delete("/:id")
  @UseMiddleware(authMiddleware)
  delete() {
    // ...
  }
}
```

## 装饰器执行顺序

当多个装饰器应用于同一个声明时，它们的求值和执行顺序遵循特定规则。

### 装饰器组合

```typescript
function First() {
  console.log("First(): 工厂求值");
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    console.log("First(): 装饰器执行");
  };
}

function Second() {
  console.log("Second(): 工厂求值");
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    console.log("Second(): 装饰器执行");
  };
}

class Example {
  @First()
  @Second()
  method() {}
}

// 输出顺序:
// First(): 工厂求值
// Second(): 工厂求值
// Second(): 装饰器执行
// First(): 装饰器执行
```

**规则总结**：

- 工厂函数从上到下求值
- 装饰器函数从下到上执行（类似函数组合）

### 不同类型装饰器的执行顺序

```typescript
function ClassDec(constructor: Function) {
  console.log("类装饰器");
}

function MethodDec(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  console.log("方法装饰器");
}

function PropertyDec(target: any, propertyKey: string) {
  console.log("属性装饰器");
}

function ParamDec(
  target: any,
  propertyKey: string,
  parameterIndex: number
) {
  console.log("参数装饰器");
}

@ClassDec
class Demo {
  @PropertyDec
  prop!: string;

  @MethodDec
  method(@ParamDec param: string) {}
}

// 输出顺序:
// 属性装饰器
// 参数装饰器
// 方法装饰器
// 类装饰器
```

**执行顺序规则**：

1. 参数装饰器 > 方法/访问器/属性装饰器 > 类装饰器
2. 实例成员 > 静态成员
3. 属性 > 方法
4. 从上到下应用

## 元数据反射（Reflect Metadata）

`reflect-metadata` 是一个用于在类、方法、属性上定义和读取元数据的库，它是装饰器模式的重要补充。

### 安装和配置

```bash
npm install reflect-metadata
```

```typescript
// 在入口文件顶部导入
import "reflect-metadata";
```

### 基础 API

```typescript
import "reflect-metadata";

// 定义元数据
Reflect.defineMetadata(metadataKey, metadataValue, target);
Reflect.defineMetadata(metadataKey, metadataValue, target, propertyKey);

// 获取元数据
Reflect.getMetadata(metadataKey, target);
Reflect.getMetadata(metadataKey, target, propertyKey);

// 检查是否有元数据
Reflect.hasMetadata(metadataKey, target);

// 获取所有元数据键
Reflect.getMetadataKeys(target);

// 删除元数据
Reflect.deleteMetadata(metadataKey, target);
```

### 设计时类型元数据

启用 `emitDecoratorMetadata` 后，TypeScript 会自动为装饰的声明发出类型元数据：

```typescript
import "reflect-metadata";

function LogType(target: any, propertyKey: string) {
  const type = Reflect.getMetadata("design:type", target, propertyKey);
  console.log(`${propertyKey} 的类型是: ${type.name}`);
}

function LogParamTypes(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const paramTypes = Reflect.getMetadata(
    "design:paramtypes",
    target,
    propertyKey
  );
  console.log(
    `${propertyKey} 的参数类型: ${paramTypes.map((t: any) => t.name).join(", ")}`
  );
}

function LogReturnType(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const returnType = Reflect.getMetadata(
    "design:returntype",
    target,
    propertyKey
  );
  console.log(`${propertyKey} 的返回类型是: ${returnType.name}`);
}

class Example {
  @LogType
  name!: string;

  @LogType
  count!: number;

  @LogParamTypes
  @LogReturnType
  greet(name: string, age: number): boolean {
    return true;
  }
}

// 输出:
// name 的类型是: String
// count 的类型是: Number
// greet 的参数类型: String, Number
// greet 的返回类型是: Boolean
```

### 实现简单的依赖注入

```typescript
import "reflect-metadata";

const INJECTABLE_METADATA_KEY = Symbol("injectable");

// 标记可注入的类
function Injectable() {
  return function (target: Function) {
    Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, target);
  };
}

// 简单的 DI 容器
class Container {
  private static instances = new Map<Function, any>();

  static resolve<T>(target: new (...args: any[]) => T): T {
    // 检查是否有缓存的实例
    if (this.instances.has(target)) {
      return this.instances.get(target);
    }

    // 获取构造函数参数类型
    const paramTypes: Function[] =
      Reflect.getMetadata("design:paramtypes", target) || [];

    // 递归解析依赖
    const dependencies = paramTypes.map(paramType =>
      this.resolve(paramType as new (...args: any[]) => any)
    );

    // 创建实例
    const instance = new target(...dependencies);
    this.instances.set(target, instance);

    return instance;
  }
}

// 使用示例
@Injectable()
class LoggerService {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

@Injectable()
class DatabaseService {
  constructor(private logger: LoggerService) {}

  query(sql: string) {
    this.logger.log(`执行查询: ${sql}`);
    return [];
  }
}

@Injectable()
class UserService {
  constructor(
    private db: DatabaseService,
    private logger: LoggerService
  ) {}

  findAll() {
    this.logger.log("查询所有用户");
    return this.db.query("SELECT * FROM users");
  }
}

// 使用容器解析依赖
const userService = Container.resolve(UserService);
userService.findAll();
// 输出:
// [LOG] 查询所有用户
// [LOG] 执行查询: SELECT * FROM users
```

## 实战模式

### 路由控制器模式

```typescript
import "reflect-metadata";

// 元数据键
const PATH_METADATA = "path";
const METHOD_METADATA = "method";
const ROUTES_METADATA = "routes";

// 控制器装饰器
function Controller(basePath: string = "") {
  return function (target: Function) {
    Reflect.defineMetadata(PATH_METADATA, basePath, target);
  };
}

// HTTP 方法装饰器工厂
function createMethodDecorator(method: string) {
  return function (path: string = "") {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const routes = Reflect.getMetadata(ROUTES_METADATA, target.constructor) || [];
      routes.push({
        method,
        path,
        handler: propertyKey,
      });
      Reflect.defineMetadata(ROUTES_METADATA, routes, target.constructor);
    };
  };
}

const Get = createMethodDecorator("GET");
const Post = createMethodDecorator("POST");
const Put = createMethodDecorator("PUT");
const Delete = createMethodDecorator("DELETE");
const Patch = createMethodDecorator("PATCH");

// 参数装饰器
const PARAM_METADATA = "params";

function createParamDecorator(type: string) {
  return function (name?: string) {
    return function (
      target: any,
      propertyKey: string,
      parameterIndex: number
    ) {
      const params =
        Reflect.getMetadata(PARAM_METADATA, target, propertyKey) || [];
      params.push({ index: parameterIndex, type, name });
      Reflect.defineMetadata(PARAM_METADATA, params, target, propertyKey);
    };
  };
}

const Param = createParamDecorator("param");
const Query = createParamDecorator("query");
const Body = createParamDecorator("body");

// 示例控制器
@Controller("/api/users")
class UserController {
  @Get("/")
  findAll(@Query("page") page: number, @Query("limit") limit: number) {
    return { page, limit, users: [] };
  }

  @Get("/:id")
  findOne(@Param("id") id: string) {
    return { id, name: "用户" };
  }

  @Post("/")
  create(@Body() userData: any) {
    return { id: "1", ...userData };
  }

  @Put("/:id")
  update(@Param("id") id: string, @Body() userData: any) {
    return { id, ...userData };
  }

  @Delete("/:id")
  delete(@Param("id") id: string) {
    return { deleted: true };
  }
}

// 路由注册器
function registerRoutes(controller: Function) {
  const basePath = Reflect.getMetadata(PATH_METADATA, controller);
  const routes = Reflect.getMetadata(ROUTES_METADATA, controller) || [];

  console.log(`注册控制器: ${controller.name}`);
  console.log(`基础路径: ${basePath}`);

  for (const route of routes) {
    const fullPath = `${basePath}${route.path}`;
    console.log(`  ${route.method} ${fullPath} -> ${route.handler}()`);
  }
}

registerRoutes(UserController);
// 输出:
// 注册控制器: UserController
// 基础路径: /api/users
//   GET /api/users/ -> findAll()
//   GET /api/users/:id -> findOne()
//   POST /api/users/ -> create()
//   PUT /api/users/:id -> update()
//   DELETE /api/users/:id -> delete()
```

### 验证器模式

```typescript
import "reflect-metadata";

const VALIDATIONS_KEY = Symbol("validations");

interface ValidationRule {
  propertyKey: string;
  validator: (value: any) => boolean;
  message: string;
}

// 验证装饰器工厂
function createValidationDecorator(
  validator: (value: any, constraint?: any) => boolean,
  messageFactory: (propertyKey: string, constraint?: any) => string
) {
  return function (constraint?: any) {
    return function (target: any, propertyKey: string) {
      const validations: ValidationRule[] =
        Reflect.getMetadata(VALIDATIONS_KEY, target.constructor) || [];

      validations.push({
        propertyKey,
        validator: (value) => validator(value, constraint),
        message: messageFactory(propertyKey, constraint),
      });

      Reflect.defineMetadata(VALIDATIONS_KEY, validations, target.constructor);
    };
  };
}

// 常用验证装饰器
const IsNotEmpty = createValidationDecorator(
  (value) => value !== null && value !== undefined && value !== "",
  (prop) => `${prop} 不能为空`
);

const IsEmail = createValidationDecorator(
  (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  (prop) => `${prop} 必须是有效的邮箱地址`
);

const MinLength = createValidationDecorator(
  (value, min) => typeof value === "string" && value.length >= min,
  (prop, min) => `${prop} 长度不能小于 ${min}`
);

const MaxLength = createValidationDecorator(
  (value, max) => typeof value === "string" && value.length <= max,
  (prop, max) => `${prop} 长度不能大于 ${max}`
);

const IsInt = createValidationDecorator(
  (value) => Number.isInteger(value),
  (prop) => `${prop} 必须是整数`
);

const Min = createValidationDecorator(
  (value, min) => typeof value === "number" && value >= min,
  (prop, min) => `${prop} 不能小于 ${min}`
);

const Max = createValidationDecorator(
  (value, max) => typeof value === "number" && value <= max,
  (prop, max) => `${prop} 不能大于 ${max}`
);

// 验证函数
function validate<T extends object>(instance: T): string[] {
  const errors: string[] = [];
  const validations: ValidationRule[] =
    Reflect.getMetadata(VALIDATIONS_KEY, instance.constructor) || [];

  for (const rule of validations) {
    const value = (instance as any)[rule.propertyKey];
    if (!rule.validator(value)) {
      errors.push(rule.message);
    }
  }

  return errors;
}

// 使用示例
class CreateUserDto {
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  username!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsInt()
  @Min(18)
  @Max(120)
  age!: number;
}

// 测试验证
const dto = new CreateUserDto();
dto.username = "ab"; // 太短
dto.email = "invalid-email"; // 无效邮箱
dto.password = "12345"; // 太短
dto.age = 15; // 太小

const errors = validate(dto);
console.log(errors);
// 输出:
// [
//   "username 长度不能小于 3",
//   "email 必须是有效的邮箱地址",
//   "password 长度不能小于 6",
//   "age 不能小于 18"
// ]
```

### ORM 实体映射模式

```typescript
import "reflect-metadata";

// 元数据键
const ENTITY_METADATA = Symbol("entity");
const COLUMN_METADATA = Symbol("column");
const PRIMARY_KEY_METADATA = Symbol("primaryKey");
const RELATION_METADATA = Symbol("relation");

// 列选项接口
interface ColumnOptions {
  type?: "string" | "number" | "boolean" | "date";
  nullable?: boolean;
  default?: any;
  unique?: boolean;
}

// 实体装饰器
function Entity(tableName?: string) {
  return function (target: Function) {
    Reflect.defineMetadata(
      ENTITY_METADATA,
      tableName || target.name.toLowerCase(),
      target
    );
  };
}

// 主键装饰器
function PrimaryKey() {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(PRIMARY_KEY_METADATA, propertyKey, target.constructor);
  };
}

// 列装饰器
function Column(options: ColumnOptions = {}) {
  return function (target: any, propertyKey: string) {
    const columns =
      Reflect.getMetadata(COLUMN_METADATA, target.constructor) || [];

    // 推断类型
    const designType = Reflect.getMetadata("design:type", target, propertyKey);
    const type = options.type || designType?.name?.toLowerCase() || "string";

    columns.push({
      propertyKey,
      type,
      ...options,
    });

    Reflect.defineMetadata(COLUMN_METADATA, columns, target.constructor);
  };
}

// 关系装饰器
function OneToMany(relatedEntity: () => Function, inverseSide: string) {
  return function (target: any, propertyKey: string) {
    const relations =
      Reflect.getMetadata(RELATION_METADATA, target.constructor) || [];

    relations.push({
      type: "OneToMany",
      propertyKey,
      relatedEntity,
      inverseSide,
    });

    Reflect.defineMetadata(RELATION_METADATA, relations, target.constructor);
  };
}

function ManyToOne(relatedEntity: () => Function, inverseSide: string) {
  return function (target: any, propertyKey: string) {
    const relations =
      Reflect.getMetadata(RELATION_METADATA, target.constructor) || [];

    relations.push({
      type: "ManyToOne",
      propertyKey,
      relatedEntity,
      inverseSide,
    });

    Reflect.defineMetadata(RELATION_METADATA, relations, target.constructor);
  };
}

// 示例实体
@Entity("users")
class User {
  @PrimaryKey()
  @Column({ type: "number" })
  id!: number;

  @Column({ type: "string", unique: true })
  username!: string;

  @Column({ type: "string" })
  email!: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "date" })
  createdAt!: Date;

  @OneToMany(() => Post, "author")
  posts!: Post[];
}

@Entity("posts")
class Post {
  @PrimaryKey()
  @Column({ type: "number" })
  id!: number;

  @Column({ type: "string" })
  title!: string;

  @Column({ type: "string", nullable: true })
  content?: string;

  @ManyToOne(() => User, "posts")
  author!: User;
}

// 获取实体元数据
function getEntityMetadata(entity: Function) {
  return {
    tableName: Reflect.getMetadata(ENTITY_METADATA, entity),
    primaryKey: Reflect.getMetadata(PRIMARY_KEY_METADATA, entity),
    columns: Reflect.getMetadata(COLUMN_METADATA, entity) || [],
    relations: Reflect.getMetadata(RELATION_METADATA, entity) || [],
  };
}

console.log(getEntityMetadata(User));
// 输出:
// {
//   tableName: "users",
//   primaryKey: "id",
//   columns: [
//     { propertyKey: "id", type: "number" },
//     { propertyKey: "username", type: "string", unique: true },
//     { propertyKey: "email", type: "string" },
//     { propertyKey: "isActive", type: "boolean", default: true },
//     { propertyKey: "createdAt", type: "date" }
//   ],
//   relations: [
//     { type: "OneToMany", propertyKey: "posts", ... }
//   ]
// }
```

## 实际框架中的应用

### NestJS 中的装饰器

NestJS 是一个流行的 Node.js 框架，大量使用装饰器来简化开发。

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UsePipes,
  HttpCode,
  Header,
} from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { LoggingInterceptor } from "./logging.interceptor";
import { ValidationPipe } from "./validation.pipe";

// DTO 验证（配合 class-validator）
import { IsString, IsEmail, MinLength, IsOptional, IsInt, Min } from "class-validator";

class CreateUserDto {
  @IsString()
  @MinLength(3)
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}

class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

// 控制器
@Controller("users")
@UseInterceptors(LoggingInterceptor)
export class UsersController {
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  findAll(@Query() pagination: PaginationDto) {
    return {
      page: pagination.page,
      limit: pagination.limit,
      data: [],
    };
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return { id, name: "用户" };
  }

  @Post()
  @HttpCode(201)
  @Header("Cache-Control", "none")
  @UsePipes(new ValidationPipe())
  create(@Body() createUserDto: CreateUserDto) {
    return { id: "1", ...createUserDto };
  }

  @Put(":id")
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return { id, ...updateUserDto };
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  @HttpCode(204)
  remove(@Param("id") id: string) {
    return null;
  }
}

// 模块
import { Module } from "@nestjs/common";

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

### TypeORM 中的装饰器

TypeORM 使用装饰器定义数据库实体和关系。

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinTable,
  Index,
  Unique,
  BeforeInsert,
  AfterLoad,
} from "typeorm";

@Entity("users")
@Unique(["email"])
@Index(["username", "email"])
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50 })
  username!: string;

  @Column({ type: "varchar", length: 100 })
  @Index()
  email!: string;

  @Column({ type: "varchar", length: 255, select: false })
  password!: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "enum", enum: ["admin", "user", "guest"], default: "user" })
  role!: string;

  @Column({ type: "json", nullable: true })
  preferences?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Post, post => post.author)
  posts!: Post[];

  @ManyToMany(() => Role)
  @JoinTable({
    name: "user_roles",
    joinColumn: { name: "user_id" },
    inverseJoinColumn: { name: "role_id" },
  })
  roles!: Role[];

  // 生命周期钩子
  @BeforeInsert()
  async hashPassword() {
    // 在插入前哈希密码
    // this.password = await bcrypt.hash(this.password, 10);
  }

  @AfterLoad()
  setFullName() {
    // 加载后计算属性
  }
}

@Entity("posts")
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "int", default: 0 })
  viewCount!: number;

  @ManyToOne(() => User, user => user.posts, { onDelete: "CASCADE" })
  author!: User;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 50, unique: true })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;
}
```

### Angular 中的装饰器

Angular 框架大量使用装饰器来定义组件、服务、模块等。

```typescript
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener,
  HostBinding,
} from "@angular/core";
import { Injectable, Inject } from "@angular/core";
import { NgModule } from "@angular/core";

// 组件装饰器
@Component({
  selector: "app-user-card",
  template: `
    <div class="user-card" [class.active]="isActive">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
      <button (click)="onSelect()">选择</button>
    </div>
  `,
  styles: [`
    .user-card {
      padding: 16px;
      border: 1px solid #ccc;
      border-radius: 8px;
    }
    .active {
      border-color: blue;
    }
  `],
})
export class UserCardComponent implements OnInit, OnDestroy {
  @Input() user!: { name: string; email: string };
  @Input() isActive: boolean = false;

  @Output() selected = new EventEmitter<string>();

  @ViewChild("content") contentRef!: any;

  @HostBinding("class.highlighted")
  get isHighlighted() {
    return this.isActive;
  }

  @HostListener("click", ["$event"])
  onClick(event: MouseEvent) {
    console.log("组件被点击", event);
  }

  ngOnInit() {
    console.log("组件初始化");
  }

  ngOnDestroy() {
    console.log("组件销毁");
  }

  onSelect() {
    this.selected.emit(this.user.name);
  }
}

// 服务装饰器
@Injectable({
  providedIn: "root",
})
export class UserService {
  constructor(
    @Inject("API_URL") private apiUrl: string
  ) {}

  getUsers() {
    return fetch(`${this.apiUrl}/users`).then(res => res.json());
  }
}

// 模块装饰器
@NgModule({
  declarations: [UserCardComponent],
  imports: [CommonModule],
  exports: [UserCardComponent],
  providers: [
    { provide: "API_URL", useValue: "https://api.example.com" },
  ],
})
export class UserModule {}
```

## TypeScript 5.0 装饰器更新

TypeScript 5.0 引入了对 ECMAScript 装饰器提案（Stage 3）的支持，与之前的实验性装饰器语法有所不同。

### 新装饰器语法

```typescript
// 新版本装饰器签名
type ClassDecorator = (
  value: Function,
  context: ClassDecoratorContext
) => Function | void;

type MethodDecorator = (
  value: Function,
  context: ClassMethodDecoratorContext
) => Function | void;

type FieldDecorator = (
  value: undefined,
  context: ClassFieldDecoratorContext
) => (initialValue: unknown) => unknown | void;

type GetterDecorator = (
  value: Function,
  context: ClassGetterDecoratorContext
) => Function | void;

type SetterDecorator = (
  value: Function,
  context: ClassSetterDecoratorContext
) => Function | void;

type AccessorDecorator = (
  value: ClassAccessorDecoratorTarget<unknown, unknown>,
  context: ClassAccessorDecoratorContext
) => ClassAccessorDecoratorResult<unknown, unknown> | void;
```

### 新版本类装饰器示例

```typescript
// 类装饰器
function logged(value: Function, context: ClassDecoratorContext) {
  if (context.kind === "class") {
    console.log(`类 ${context.name} 被装饰`);
  }
}

@logged
class MyClass {
  // ...
}

// 方法装饰器
function log(
  originalMethod: Function,
  context: ClassMethodDecoratorContext
) {
  const methodName = String(context.name);

  function replacementMethod(this: any, ...args: any[]) {
    console.log(`调用方法: ${methodName}`);
    const result = originalMethod.call(this, ...args);
    console.log(`方法返回: ${result}`);
    return result;
  }

  return replacementMethod;
}

class Calculator {
  @log
  add(a: number, b: number) {
    return a + b;
  }
}
```

### 新的 accessor 关键字

TypeScript 5.0 引入了 `accessor` 关键字，配合装饰器使用。

```typescript
function range(min: number, max: number) {
  return function (
    target: ClassAccessorDecoratorTarget<any, number>,
    context: ClassAccessorDecoratorContext
  ): ClassAccessorDecoratorResult<any, number> {
    return {
      get(this: any) {
        return target.get.call(this);
      },
      set(this: any, value: number) {
        if (value < min || value > max) {
          throw new RangeError(`值必须在 ${min} 和 ${max} 之间`);
        }
        target.set.call(this, value);
      },
    };
  };
}

class Settings {
  @range(0, 100)
  accessor volume: number = 50;

  @range(0, 10)
  accessor brightness: number = 5;
}

const settings = new Settings();
settings.volume = 80; // OK
// settings.volume = 150; // RangeError
```

## 最佳实践

### 保持装饰器简单专注

```typescript
// 好的做法：单一职责
function Log() { /* 只负责日志 */ }
function Validate() { /* 只负责验证 */ }
function Cache() { /* 只负责缓存 */ }

// 避免：装饰器做太多事情
function DoEverything() {
  // 日志 + 验证 + 缓存 + 权限检查 + ...
}
```

### 使用装饰器工厂增加灵活性

```typescript
// 可配置的装饰器
function Retry(maxAttempts: number = 3, delay: number = 1000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // ...
  };
}

// 使用时可自定义参数
@Retry(5, 2000)
async fetchData() { /* ... */ }
```

### 合理使用元数据

```typescript
// 使用 Symbol 作为元数据键避免冲突
const METADATA_KEY = Symbol("myMetadata");

// 而不是字符串
// const METADATA_KEY = "myMetadata"; // 可能冲突
```

### 注意执行顺序

```typescript
// 装饰器从下到上执行
// 在设计时考虑执行顺序的影响
@First()  // 最后执行
@Second() // 先执行
method() {}
```

### 提供类型安全

```typescript
// 为装饰器提供泛型支持
function Mixin<T extends { new (...args: any[]): {} }>(MixinClass: T) {
  return function <U extends { new (...args: any[]): {} }>(Base: U) {
    return class extends Base {
      // 混入 MixinClass 的功能
    };
  };
}
```

## 面试要点

### 常见面试题

1. **什么是装饰器？它解决什么问题？**
   - 装饰器是一种元编程技术，用于在不修改原有代码的情况下添加额外行为
   - 解决横切关注点（如日志、验证、缓存）的代码复用问题

2. **TypeScript 中有哪些类型的装饰器？**
   - 类装饰器、方法装饰器、属性装饰器、参数装饰器、访问器装饰器

3. **装饰器的执行顺序是什么？**
   - 工厂从上到下求值，装饰器从下到上执行
   - 参数装饰器 > 方法/属性装饰器 > 类装饰器

4. **如何在装饰器中获取类型信息？**
   - 启用 `emitDecoratorMetadata`
   - 使用 `reflect-metadata` 库
   - 通过 `design:type`、`design:paramtypes`、`design:returntype` 获取

5. **装饰器和高阶函数的区别是什么？**
   - 装饰器是声明式的，高阶函数是命令式的
   - 装饰器作用于类/方法定义，高阶函数作用于运行时

### 进阶考察点

- 理解 `reflect-metadata` 的工作原理
- 实现简单的依赖注入容器
- 装饰器在主流框架中的应用（NestJS、Angular、TypeORM）
- TypeScript 5.0 新装饰器语法与旧语法的区别
- 装饰器的性能考量

## 延伸阅读

### 官方资源

- [TypeScript 官方文档 - 装饰器](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [ECMAScript 装饰器提案](https://github.com/tc39/proposal-decorators)
- [TypeScript 5.0 发布说明](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/)

### 框架文档

- [NestJS 文档](https://docs.nestjs.com/)
- [TypeORM 文档](https://typeorm.io/)
- [Angular 文档](https://angular.io/guide/decorators)

### 相关库

- [reflect-metadata](https://github.com/rbuckton/reflect-metadata)
- [class-validator](https://github.com/typestack/class-validator)
- [class-transformer](https://github.com/typestack/class-transformer)

---

装饰器是 TypeScript 中强大的元编程特性，它使代码更加清晰、可维护，同时实现了关注点分离。虽然目前还是实验性特性，但在 NestJS、Angular、TypeORM 等主流框架中已经得到广泛应用。随着 ECMAScript 装饰器提案的推进，装饰器将成为 JavaScript 生态系统的标准特性。建议在学习装饰器时，结合具体的框架实践，深入理解其在实际项目中的应用场景和最佳实践。
