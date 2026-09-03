---
title: Modules and Namespaces
description: Complete guide to TypeScript modules and namespaces, ES Modules, declaration merging and module resolution
track: typescript
section: patterns
difficulty: intermediate
tags:
  - TypeScript
  - Modules
  - Namespaces
  - Module Resolution
status: imported
origin: old/src/content/docs/typescript/modules-namespaces.zh.md
divergence: 0.238
issues:
  - title-lang-zh
  - title-language
legacy:
  category: TypeScript
  subcategory: Modular Programming
  order: 7
  lastUpdated: 2026-01-07
---

TypeScript 提供了强大的机制，通过模块和命名空间来组织和构建代码。理解这些概念对于构建可扩展、可维护的应用程序至关重要。本指南涵盖了 TypeScript 中的 ES 模块、命名空间、声明合并、模块扩展和模块解析策略。

## 模块简介

模块是现代 TypeScript 应用程序中代码组织的基础。它们封装代码、管理依赖关系，并在应用程序的不同部分之间提供清晰的边界。

### 为什么使用模块？

```typescript
// 不使用模块 - 全局作用域污染
// file1.ts
var utils = {
  formatDate: (date: Date) => date.toISOString(),
};

// file2.ts
// 风险：utils 可能已经在其他地方定义了！
var utils = {
  formatNumber: (n: number) => n.toFixed(2),
};
```

```typescript
// 使用模块 - 隔离的作用域
// dateUtils.ts
export const formatDate = (date: Date): string => {
  return date.toISOString();
};

// numberUtils.ts
export const formatNumber = (n: number): string => {
  return n.toFixed(2);
};

// main.ts
import { formatDate } from "./dateUtils";
import { formatNumber } from "./numberUtils";
// 没有冲突 - 每个模块都有自己的作用域
```

### 什么使文件成为模块？

在 TypeScript 中，任何包含顶层 `import` 或 `export` 语句的文件都被视为模块。没有这些语句的文件被视为在全局作用域中执行的脚本。

```typescript
// script.ts - 不是模块（全局作用域）
const greeting = "Hello";
function sayHello() {
  console.log(greeting);
}

// module.ts - 是模块（模块作用域）
export const greeting = "Hello";
export function sayHello() {
  console.log(greeting);
}

// 或者，强制使文件成为模块而不导出任何内容：
export {};
const internalValue = 42; // 现在作用域限定在此模块内
```

## TypeScript 中的 ES 模块

TypeScript 完全支持 ES 模块（ESM），这是标准的 JavaScript 模块系统。ES 模块使用 `import` 和 `export` 语句在文件之间共享代码。

### 基本模块结构

```typescript
// math.ts
export const PI = 3.14159;

export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export class Calculator {
  private result: number = 0;

  add(value: number): this {
    this.result += value;
    return this;
  }

  subtract(value: number): this {
    this.result -= value;
    return this;
  }

  getResult(): number {
    return this.result;
  }

  reset(): this {
    this.result = 0;
    return this;
  }
}
```

```typescript
// app.ts
import { PI, add, multiply, Calculator } from "./math";

console.log(PI); // 3.14159
console.log(add(2, 3)); // 5
console.log(multiply(4, 5)); // 20

const calc = new Calculator();
console.log(calc.add(10).subtract(3).getResult()); // 7
```

### 仅类型导入和导出

TypeScript 3.8 引入了仅类型导入和导出，它们在运行时会被完全擦除。这对于导入类型而不将其包含在编译后的 JavaScript 中非常有用。

```typescript
// types.ts
export interface User {
  id: number;
  name: string;
  email: string;
}

export type UserRole = "admin" | "user" | "guest";

export class UserService {
  getUser(id: number): User {
    return { id, name: "John", email: "john@example.com" };
  }
}
```

```typescript
// userHandler.ts
// 仅导入类型 - 编译时被擦除
import type { User, UserRole } from "./types";

// 分别导入值和类型
import { UserService } from "./types";
import type { User as UserType } from "./types";

// 带有内联类型修饰符的混合导入（TypeScript 4.5+）
import { UserService, type User, type UserRole } from "./types";

function processUser(user: User, role: UserRole): void {
  console.log(`${user.name} 是一个 ${role}`);
}

// 仅类型导出
export type { User, UserRole };
```

## 导出变体

TypeScript 支持多种从模块导出值的方式。

### 命名导出

```typescript
// utils.ts
// 单独的命名导出
export const VERSION = "1.0.0";

export function log(message: string): void {
  console.log(`[LOG]: ${message}`);
}

export interface Config {
  debug: boolean;
  apiUrl: string;
}

export class Logger {
  log(message: string): void {
    console.log(message);
  }
}
```

### 导出列表

```typescript
// helpers.ts
const SECRET_KEY = "abc123";

function encrypt(data: string): string {
  return Buffer.from(data).toString("base64");
}

function decrypt(data: string): string {
  return Buffer.from(data, "base64").toString("utf-8");
}

class Encryptor {
  encrypt(data: string): string {
    return encrypt(data);
  }
}

// 一次导出多个项目
export { encrypt, decrypt, Encryptor };

// 重命名导出
export { SECRET_KEY as API_KEY };
```

### 默认导出

```typescript
// user.ts
interface User {
  id: number;
  name: string;
}

// 默认导出 - 每个模块只能有一个
export default class UserManager {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  getUsers(): User[] {
    return [...this.users];
  }

  findById(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }
}

// 也可以导出默认表达式
// export default function() { ... }
// export default { key: "value" };
```

```typescript
// app.ts
// 默认导入可以使用任何名称
import UserManager from "./user";
import Manager from "./user"; // 相同的东西，不同的名称

const manager = new UserManager();
manager.addUser({ id: 1, name: "Alice" });
```

### 组合默认和命名导出

```typescript
// api.ts
export interface RequestConfig {
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
}

export interface Response<T> {
  data: T;
  status: number;
}

export function createHeaders(auth?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) {
    headers["Authorization"] = `Bearer ${auth}`;
  }
  return headers;
}

// 默认导出
export default class ApiClient {
  constructor(private baseUrl: string) {}

  async get<T>(path: string): Promise<Response<T>> {
    const response = await fetch(`${this.baseUrl}${path}`);
    return {
      data: await response.json(),
      status: response.status,
    };
  }
}
```

```typescript
// consumer.ts
import ApiClient, { RequestConfig, Response, createHeaders } from "./api";

const client = new ApiClient("https://api.example.com");
```

### 重新导出

```typescript
// models/user.ts
export interface User {
  id: number;
  name: string;
}

// models/product.ts
export interface Product {
  id: number;
  title: string;
  price: number;
}

// models/order.ts
export interface Order {
  id: number;
  userId: number;
  products: number[];
}

// models/index.ts - 桶文件
// 重新导出所有内容
export * from "./user";
export * from "./product";
export * from "./order";

// 重命名重新导出
export { User as UserModel } from "./user";

// 将默认导出重新导出为命名导出
export { default as ProductService } from "./productService";

// 重新导出特定项目
export { Order, type Order as OrderType } from "./order";
```

```typescript
// app.ts
// 从桶文件导入
import { User, Product, Order } from "./models";
```

### 导出赋值（CommonJS 互操作）

```typescript
// legacyModule.ts
// 用于 CommonJS 兼容性
class LegacyApi {
  fetch(url: string): Promise<unknown> {
    return fetch(url).then((r) => r.json());
  }
}

// CommonJS 风格导出
export = LegacyApi;
```

```typescript
// consumer.ts
// 必须使用 require 风格导入
import LegacyApi = require("./legacyModule");

const api = new LegacyApi();
```

## 导入变体

TypeScript 提供了从模块导入的灵活方式。

### 命名导入

```typescript
// 导入特定导出
import { add, multiply } from "./math";

// 使用别名导入
import { add as sum, multiply as product } from "./math";

// 导入类型
import type { User, UserRole } from "./types";
```

### 默认导入

```typescript
// 导入默认导出
import Calculator from "./calculator";

// 组合默认和命名导入
import Calculator, { PI, add } from "./calculator";

// 使用别名导入默认值
import { default as Calc } from "./calculator";
```

### 命名空间导入

```typescript
// 将所有导出作为命名空间对象导入
import * as MathUtils from "./math";

console.log(MathUtils.PI);
console.log(MathUtils.add(1, 2));

const calc = new MathUtils.Calculator();
```

### 副作用导入

```typescript
// polyfills.ts
// 向全局对象添加方法
declare global {
  interface Array<T> {
    last(): T | undefined;
  }
}

Array.prototype.last = function () {
  return this[this.length - 1];
};

export {}; // 使其成为模块
```

```typescript
// app.ts
// 仅为副作用导入 - 没有绑定
import "./polyfills";

const arr = [1, 2, 3];
console.log(arr.last()); // 3
```

### 动态导入

```typescript
// 静态导入 - 启动时加载
import { heavyFunction } from "./heavyModule";

// 动态导入 - 按需加载
async function loadHeavyModule() {
  const module = await import("./heavyModule");
  module.heavyFunction();
}

// 带类型安全
interface HeavyModule {
  heavyFunction: () => void;
  HeavyClass: new () => { process(): void };
}

async function processData() {
  const { heavyFunction, HeavyClass }: HeavyModule = await import(
    "./heavyModule"
  );

  heavyFunction();
  const instance = new HeavyClass();
  instance.process();
}

// 条件加载
async function loadLocale(locale: string) {
  switch (locale) {
    case "en":
      return import("./locales/en");
    case "fr":
      return import("./locales/fr");
    case "de":
      return import("./locales/de");
    default:
      return import("./locales/en");
  }
}
```

### 导入断言（ES2022+）

```typescript
// 使用断言导入 JSON 文件
import config from "./config.json" assert { type: "json" };

// 导入 CSS 模块（需要适当的加载器）
import styles from "./styles.css" assert { type: "css" };

// 带断言的动态导入
const data = await import("./data.json", {
  assert: { type: "json" },
});
```

## 命名空间

命名空间（以前称为"内部模块"）是 TypeScript 特有的代码组织方式。虽然模块是大多数应用程序的首选方法，但命名空间在某些场景中仍然有用。

### 基本命名空间语法

```typescript
// validation.ts
namespace Validation {
  // 命名空间私有
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[\d\s-()]+$/;

  // 导出的接口
  export interface Validator {
    validate(value: string): boolean;
  }

  // 导出的类
  export class EmailValidator implements Validator {
    validate(value: string): boolean {
      return emailRegex.test(value);
    }
  }

  export class PhoneValidator implements Validator {
    validate(value: string): boolean {
      return phoneRegex.test(value);
    }
  }

  // 导出的函数
  export function createValidator(type: "email" | "phone"): Validator {
    switch (type) {
      case "email":
        return new EmailValidator();
      case "phone":
        return new PhoneValidator();
    }
  }
}

// 使用
const emailValidator = new Validation.EmailValidator();
console.log(emailValidator.validate("test@example.com")); // true

const validator = Validation.createValidator("phone");
console.log(validator.validate("+1 (555) 123-4567")); // true
```

### 嵌套命名空间

```typescript
namespace App {
  export namespace Models {
    export interface User {
      id: number;
      name: string;
    }

    export interface Product {
      id: number;
      title: string;
    }
  }

  export namespace Services {
    export class UserService {
      getUser(id: number): Models.User {
        return { id, name: "John" };
      }
    }

    export class ProductService {
      getProduct(id: number): Models.Product {
        return { id, title: "Widget" };
      }
    }
  }

  export namespace Utils {
    export function log(message: string): void {
      console.log(`[App]: ${message}`);
    }
  }
}

// 使用
const userService = new App.Services.UserService();
const user: App.Models.User = userService.getUser(1);
App.Utils.log(`找到用户：${user.name}`);
```

### 命名空间别名

```typescript
namespace Very.Long.Namespace.Path {
  export class MyClass {
    greet(): string {
      return "Hello!";
    }
  }
}

// 为方便起见创建别名
import MyClass = Very.Long.Namespace.Path.MyClass;

const instance = new MyClass();
console.log(instance.greet());

// 嵌套命名空间的别名
import Services = App.Services;
const userService = new Services.UserService();
```

### 多文件命名空间

```typescript
// shapes/base.ts
namespace Shapes {
  export interface Shape {
    area(): number;
    perimeter(): number;
  }
}

// shapes/circle.ts
/// <reference path="./base.ts" />
namespace Shapes {
  export class Circle implements Shape {
    constructor(private radius: number) {}

    area(): number {
      return Math.PI * this.radius ** 2;
    }

    perimeter(): number {
      return 2 * Math.PI * this.radius;
    }
  }
}

// shapes/rectangle.ts
/// <reference path="./base.ts" />
namespace Shapes {
  export class Rectangle implements Shape {
    constructor(private width: number, private height: number) {}

    area(): number {
      return this.width * this.height;
    }

    perimeter(): number {
      return 2 * (this.width + this.height);
    }
  }
}

// main.ts
/// <reference path="./shapes/circle.ts" />
/// <reference path="./shapes/rectangle.ts" />

const circle = new Shapes.Circle(5);
const rectangle = new Shapes.Rectangle(4, 6);

console.log(circle.area()); // ~78.54
console.log(rectangle.area()); // 24
```

### 环境命名空间

```typescript
// global.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    API_URL: string;
    DEBUG?: string;
  }
}

declare namespace Express {
  interface Request {
    user?: {
      id: number;
      role: string;
    };
  }
}
```

## 模块与命名空间的对比

理解何时使用模块与命名空间对于正确的代码组织至关重要。

### 何时使用模块（首选）

```typescript
// 模块适用于：
// 1. 使用打包器的现代应用程序
// 2. Node.js 应用程序
// 3. 使用 npm 包的项目
// 4. 项目之间的代码共享

// userService.ts
export class UserService {
  async getUser(id: number) {
    // 获取用户
  }
}

// userController.ts
import { UserService } from "./userService";

export class UserController {
  constructor(private userService: UserService) {}
}
```

### 何时使用命名空间

```typescript
// 命名空间可用于：
// 1. 扩展全局声明
// 2. 组织类型声明
// 3. 遗留代码库
// 4. 不使用打包器的简单脚本

// types.d.ts
declare namespace API {
  interface User {
    id: number;
    name: string;
  }

  interface Response<T> {
    data: T;
    error?: string;
  }
}

// 扩展内置类型
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}
```

### 从命名空间迁移到模块

```typescript
// 之前：基于命名空间
namespace Utils {
  export function formatDate(date: Date): string {
    return date.toISOString();
  }

  export function parseDate(str: string): Date {
    return new Date(str);
  }
}

// 之后：基于模块
// dateUtils.ts
export function formatDate(date: Date): string {
  return date.toISOString();
}

export function parseDate(str: string): Date {
  return new Date(str);
}

// 如果需要类似命名空间的访问：
// utils/index.ts
export * as DateUtils from "./dateUtils";
export * as StringUtils from "./stringUtils";

// 使用
import { DateUtils } from "./utils";
DateUtils.formatDate(new Date());
```

## 声明合并

声明合并是 TypeScript 的一个强大特性，编译器会将多个同名声明合并为单个定义。

### 接口合并

```typescript
// 同名接口会自动合并
interface Box {
  height: number;
  width: number;
}

interface Box {
  depth: number;
  color?: string;
}

// 合并后的接口具有所有属性
const box: Box = {
  height: 10,
  width: 20,
  depth: 30,
  color: "blue",
};
```

### 不同成员类型的合并

```typescript
interface Document {
  createElement(tagName: string): Element;
}

interface Document {
  createElement(tagName: "div"): HTMLDivElement;
  createElement(tagName: "span"): HTMLSpanElement;
  createElement(tagName: "canvas"): HTMLCanvasElement;
}

// 重载被合并 - 更具体的签名排在前面
const div = document.createElement("div"); // HTMLDivElement
const span = document.createElement("span"); // HTMLSpanElement
const element = document.createElement("custom"); // Element
```

### 命名空间合并

```typescript
namespace Animals {
  export class Dog {
    bark(): void {
      console.log("Woof!");
    }
  }
}

namespace Animals {
  export class Cat {
    meow(): void {
      console.log("Meow!");
    }
  }

  export interface Pet {
    name: string;
  }
}

// 两个类都可用
const dog = new Animals.Dog();
const cat = new Animals.Cat();
const pet: Animals.Pet = { name: "Fluffy" };
```

### 命名空间与类的合并

```typescript
class Album {
  label: Album.AlbumLabel;

  constructor(label: Album.AlbumLabel) {
    this.label = label;
  }
}

namespace Album {
  export interface AlbumLabel {
    name: string;
    year: number;
  }

  export function createLabel(name: string): AlbumLabel {
    return { name, year: new Date().getFullYear() };
  }
}

// 使用
const label = Album.createLabel("Sony Music");
const album = new Album(label);
```

### 命名空间与函数的合并

```typescript
function buildName(firstName: string, lastName?: string): string {
  if (lastName) {
    return `${firstName} ${lastName}`;
  }
  return firstName;
}

namespace buildName {
  export let defaultLastName = "Smith";

  export function withDefault(firstName: string): string {
    return buildName(firstName, defaultLastName);
  }
}

// 使用
console.log(buildName("John", "Doe")); // "John Doe"
console.log(buildName.withDefault("John")); // "John Smith"
buildName.defaultLastName = "Johnson";
console.log(buildName.withDefault("Jane")); // "Jane Johnson"
```

### 命名空间与枚举的合并

```typescript
enum Color {
  Red = 1,
  Green = 2,
  Blue = 3,
}

namespace Color {
  export function lighten(color: Color, percent: number): string {
    // 实现颜色变亮
    return `${Color[color]} 变亮 ${percent}%`;
  }

  export function darken(color: Color, percent: number): string {
    // 实现颜色变暗
    return `${Color[color]} 变暗 ${percent}%`;
  }

  export const DEFAULT = Color.Blue;
}

// 使用
const color = Color.Red;
console.log(Color.lighten(color, 20)); // "Red 变亮 20%"
console.log(Color.DEFAULT); // 3
```

## 模块扩展

模块扩展允许您使用新声明扩展现有模块，这对于向第三方库添加类型特别有用。

### 扩展外部模块

```typescript
// 扩展 'express' 模块
import express, { Request, Response } from "express";

// 扩展 express 模块
declare module "express" {
  interface Request {
    user?: {
      id: number;
      email: string;
      role: "admin" | "user";
    };
    sessionId?: string;
  }

  interface Response {
    success<T>(data: T): void;
    error(message: string, code?: number): void;
  }
}

// 实现
const app = express();

app.use((req: Request, res: Response, next) => {
  // TypeScript 现在知道 req.user
  req.user = { id: 1, email: "test@example.com", role: "admin" };
  next();
});

app.get("/profile", (req: Request, res: Response) => {
  if (req.user) {
    res.json({ user: req.user });
  }
});
```

### 扩展全局模块

```typescript
// 扩展全局 Window 接口
declare global {
  interface Window {
    config: {
      apiUrl: string;
      debug: boolean;
    };
    analytics: {
      track(event: string, data?: Record<string, unknown>): void;
    };
  }
}

// 现在可以使用这些属性
window.config = {
  apiUrl: "https://api.example.com",
  debug: true,
};

window.analytics.track("page_view", { path: "/" });

export {}; // 使其成为模块
```

### 扩展内置类型

```typescript
// 扩展 Array 原型
declare global {
  interface Array<T> {
    first(): T | undefined;
    last(): T | undefined;
    isEmpty(): boolean;
    chunk(size: number): T[][];
  }
}

Array.prototype.first = function () {
  return this[0];
};

Array.prototype.last = function () {
  return this[this.length - 1];
};

Array.prototype.isEmpty = function () {
  return this.length === 0;
};

Array.prototype.chunk = function (size: number) {
  const chunks: any[][] = [];
  for (let i = 0; i < this.length; i += size) {
    chunks.push(this.slice(i, i + size));
  }
  return chunks;
};

// 使用
const arr = [1, 2, 3, 4, 5];
console.log(arr.first()); // 1
console.log(arr.last()); // 5
console.log(arr.isEmpty()); // false
console.log(arr.chunk(2)); // [[1, 2], [3, 4], [5]]

export {};
```

### 扩展第三方库

```typescript
// types/lodash-augmentation.d.ts
import "lodash";

declare module "lodash" {
  interface LoDashStatic {
    customMethod<T>(array: T[], predicate: (item: T) => boolean): T[];
  }

  interface LoDashExplicitWrapper<TValue> {
    customMethod<T>(
      this: LoDashExplicitWrapper<T[]>,
      predicate: (item: T) => boolean
    ): LoDashExplicitWrapper<T[]>;
  }
}
```

```typescript
// 扩展 Vue.js
declare module "vue" {
  interface ComponentCustomProperties {
    $api: {
      get<T>(url: string): Promise<T>;
      post<T>(url: string, data: unknown): Promise<T>;
    };
    $notify: (message: string, type?: "success" | "error" | "warning") => void;
  }
}
```

### 通配符模块声明

```typescript
// 允许导入任何 .svg 文件
declare module "*.svg" {
  const content: string;
  export default content;
}

// 允许导入带有元数据的 .png 文件
declare module "*.png" {
  const value: {
    src: string;
    width: number;
    height: number;
  };
  export default value;
}

// 允许导入 .css 模块
declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// 允许导入 .json 文件
declare module "*.json" {
  const value: unknown;
  export default value;
}

// 使用
import logo from "./logo.svg";
import avatar from "./avatar.png";
import styles from "./component.module.css";
```

## 模块解析

模块解析是 TypeScript 用于确定模块导入所引用内容的过程。理解这个过程有助于排除导入问题并正确配置项目。

### 模块解析策略

```json
// tsconfig.json
{
  "compilerOptions": {
    // Classic：传统 TypeScript 解析
    // "moduleResolution": "classic",

    // Node：Node.js 风格解析（CommonJS）
    // "moduleResolution": "node",

    // Node16/NodeNext：现代 Node.js 解析（ESM + CJS）
    // "moduleResolution": "node16",
    "moduleResolution": "nodenext",

    // Bundler：用于 webpack、Vite 等打包器
    // "moduleResolution": "bundler"
  }
}
```

### Node 解析的工作原理

```typescript
// 当你导入：
import { something } from "my-module";

// TypeScript/Node 查找：
// 1. node_modules/my-module.ts
// 2. node_modules/my-module.tsx
// 3. node_modules/my-module.d.ts
// 4. node_modules/my-module/package.json（main/types 字段）
// 5. node_modules/my-module/index.ts
// 6. node_modules/my-module/index.tsx
// 7. node_modules/my-module/index.d.ts
```

```typescript
// 相对导入：
import { helper } from "./utils";

// TypeScript 查找：
// 1. ./utils.ts
// 2. ./utils.tsx
// 3. ./utils.d.ts
// 4. ./utils/package.json（main 字段）
// 5. ./utils/index.ts
// 6. ./utils/index.tsx
// 7. ./utils/index.d.ts
```

### Package.json Exports 字段

```json
// 库的 package.json
{
  "name": "my-library",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js"
    },
    "./utils": {
      "types": "./dist/types/utils.d.ts",
      "import": "./dist/esm/utils.js",
      "require": "./dist/cjs/utils.js"
    },
    "./package.json": "./package.json"
  },
  "typesVersions": {
    "*": {
      "utils": ["./dist/types/utils.d.ts"]
    }
  }
}
```

### Base URL 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "outDir": "./dist"
  }
}
```

```typescript
// 将 baseUrl 设置为 "./src"

// 不再需要：
import { User } from "../../../models/user";
import { apiClient } from "../../../services/api";

// 可以这样写：
import { User } from "models/user";
import { apiClient } from "services/api";
```

### Root Dirs 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "rootDirs": ["src/views", "generated/templates"]
  }
}
```

```typescript
// 这允许跨 rootDirs 的导入就像它们在同一目录中一样
// src/views/main.ts 可以从 generated/templates/header.ts 导入：
import { Header } from "./header";
```

## 路径映射和别名

路径映射允许您创建自定义导入路径，使导入更清晰、更易于维护。

### 基本路径别名

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@services/*": ["src/services/*"],
      "@models/*": ["src/models/*"],
      "@hooks/*": ["src/hooks/*"],
      "@assets/*": ["src/assets/*"]
    }
  }
}
```

```typescript
// 使用路径别名之前
import { Button } from "../../../components/ui/Button";
import { formatDate } from "../../../utils/date";
import { UserService } from "../../../services/userService";
import type { User } from "../../../models/user";

// 使用路径别名之后
import { Button } from "@components/ui/Button";
import { formatDate } from "@utils/date";
import { UserService } from "@services/userService";
import type { User } from "@models/user";
```

### 精确路径映射

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      // 精确映射（无通配符）
      "config": ["src/config/index.ts"],
      "constants": ["src/constants/index.ts"],

      // 回退模式
      "@api/*": ["src/api/*", "src/api/generated/*"]
    }
  }
}
```

### 与打包器集成

```javascript
// vite.config.ts
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@services": path.resolve(__dirname, "./src/services"),
    },
  },
});
```

```javascript
// webpack.config.js
const path = require("path");

module.exports = {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
      "@utils": path.resolve(__dirname, "src/utils"),
    },
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
};
```

### Jest 路径别名配置

```javascript
// jest.config.js
module.exports = {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
  },
};
```

### 完整项目配置示例

```json
// tsconfig.json - 完整配置
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@ui/*": ["src/components/ui/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@services/*": ["src/services/*"],
      "@models/*": ["src/models/*"],
      "@store/*": ["src/store/*"],
      "@assets/*": ["src/assets/*"],
      "@styles/*": ["src/styles/*"],
      "@config": ["src/config/index.ts"],
      "@constants": ["src/constants/index.ts"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 最佳实践

### 优先使用 ES 模块而非命名空间

```typescript
// 避免：基于命名空间的组织
namespace MyApp {
  export namespace Utils {
    export function format(value: string): string {
      return value.trim();
    }
  }
}

// 推荐：基于模块的组织
// utils/format.ts
export function format(value: string): string {
  return value.trim();
}

// utils/index.ts
export * from "./format";
export * from "./validate";
```

### 策略性地使用桶文件

```typescript
// components/index.ts - 桶文件
export { Button } from "./Button";
export { Input } from "./Input";
export { Modal } from "./Modal";
export { Card } from "./Card";

// 类型可以单独导出或一起导出
export type { ButtonProps } from "./Button";
export type { InputProps } from "./Input";
```

```typescript
// 使用 - 简洁的导入
import { Button, Input, Modal } from "@components";
import type { ButtonProps } from "@components";
```

### 对类型使用仅类型导入

```typescript
// 清晰地分离类型和值导入
import { UserService } from "./userService";
import type { User, UserRole } from "./types";

// 或使用内联类型修饰符
import { UserService, type User, type UserRole } from "./module";
```

### 一致地组织导出

```typescript
// 好的做法：一致的导出风格
// models/user.ts
export interface User {
  id: number;
  name: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
}

export type UserRole = "admin" | "user" | "guest";
```

### 避免循环依赖

```typescript
// 有问题：循环依赖
// a.ts
import { B } from "./b"; // B 导入 A
export class A {
  b: B;
}

// b.ts
import { A } from "./a"; // A 导入 B - 循环！
export class B {
  a: A;
}

// 解决方案：提取共享类型
// types.ts
export interface IA {
  b: IB;
}
export interface IB {
  a: IA;
}

// a.ts
import type { IA, IB } from "./types";
export class A implements IA {
  b!: IB;
}

// b.ts
import type { IA, IB } from "./types";
export class B implements IB {
  a!: IA;
}
```

### 在 ESM 中使用显式扩展名

```typescript
// 对于 Node.js ESM，包含扩展名
// tsconfig.json: { "moduleResolution": "node16" }

// 不要这样：
import { helper } from "./utils";

// 而是这样：
import { helper } from "./utils.js"; // 即使是 .ts 文件也用 .js！
```

### 记录模块扩展

```typescript
/**
 * 扩展 Express Request 以包含已认证用户信息。
 * 当导入此模块时，此扩展会全局应用。
 *
 * @example
 * import "./types/express-augmentation";
 *
 * app.get("/profile", (req, res) => {
 *   console.log(req.user?.id);
 * });
 */
declare module "express" {
  interface Request {
    /**
     * 已认证的用户，由认证中间件填充。
     * 如果请求未经认证则为 undefined。
     */
    user?: {
      id: number;
      email: string;
      role: "admin" | "user";
    };
  }
}
```

### 保持模块 API 简洁

```typescript
// 内部辅助函数保持私有
function internalHelper(data: string): string {
  return data.toLowerCase().trim();
}

// 只导出消费者需要的内容
export function processData(data: string): string {
  return internalHelper(data);
}

export interface ProcessedResult {
  value: string;
  timestamp: Date;
}

// 不要导出实现细节
// export { internalHelper }; // 避免！
```

## 总结

模块和命名空间是组织 TypeScript 应用程序的基础。虽然 ES 模块是现代开发的标准和首选方法，但理解命名空间对于处理遗留代码和某些声明场景仍然很有价值。

关键要点：

- **ES 模块**是现代 TypeScript 应用程序的标准
- **仅类型导入**能明确意图并可能提高构建性能
- **命名空间**最好保留用于声明文件和全局扩展
- **声明合并**能实现强大的扩展模式
- **模块扩展**允许以类型安全的方式扩展第三方库
- **路径别名**提高代码可读性和可维护性
- **模块解析**配置必须与运行时环境匹配

通过掌握这些概念，您将能够构建可维护、可扩展且易于导航的 TypeScript 项目。
