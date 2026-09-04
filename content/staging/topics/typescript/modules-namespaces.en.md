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
origin: old/src/content/docs/typescript/modules-namespaces.en.md
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

TypeScript provides powerful mechanisms for organizing and structuring code through modules and namespaces. Understanding these concepts is essential for building scalable, maintainable applications. We'll cover ES Modules in TypeScript, namespaces, declaration merging, module augmentation, and module resolution strategies.

## Introduction to Modules

Modules are the foundation of code organization in modern TypeScript applications. They encapsulate code, manage dependencies, and provide clear boundaries between different parts of your application.

### Why Use Modules?

```typescript
// Without modules - global scope pollution
// file1.ts
var utils = {
  formatDate: (date: Date) => date.toISOString(),
};

// file2.ts
// Risk: utils might already be defined elsewhere!
var utils = {
  formatNumber: (n: number) => n.toFixed(2),
};
```

```typescript
// With modules - isolated scope
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
// No conflicts - each module has its own scope
```

### What Makes a File a Module?

In TypeScript, any file containing a top-level `import` or `export` statement is considered a module. Files without these statements are treated as scripts that execute in the global scope.

```typescript
// script.ts - NOT a module (global scope)
const greeting = "Hello";
function sayHello() {
  console.log(greeting);
}

// module.ts - IS a module (module scope)
export const greeting = "Hello";
export function sayHello() {
  console.log(greeting);
}

// Alternatively, force a file to be a module without exports:
export {};
const internalValue = 42; // Now scoped to this module
```

## ES Modules in TypeScript

TypeScript fully supports ES Modules (ESM), the standard JavaScript module system. ES Modules use `import` and `export` statements to share code between files.

### Basic Module Structure

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

### Type-Only Imports and Exports

TypeScript 3.8 introduced type-only imports and exports, which are completely erased at runtime. This is useful for importing types without including them in the compiled JavaScript.

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
// Import only types - erased at compile time
import type { User, UserRole } from "./types";

// Import value and type separately
import { UserService } from "./types";
import type { User as UserType } from "./types";

// Mixed import with inline type modifier (TypeScript 4.5+)
import { UserService, type User, type UserRole } from "./types";

function processUser(user: User, role: UserRole): void {
  console.log(`${user.name} is a ${role}`);
}

// Type-only exports
export type { User, UserRole };
```

## Export Variations

TypeScript supports multiple ways to export values from modules.

### Named Exports

```typescript
// utils.ts
// Individual named exports
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

### Export List

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

// Export multiple items at once
export { encrypt, decrypt, Encryptor };

// Export with renaming
export { SECRET_KEY as API_KEY };
```

### Default Exports

```typescript
// user.ts
interface User {
  id: number;
  name: string;
}

// Default export - only one per module
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

// Can also export default expressions
// export default function() { ... }
// export default { key: "value" };
```

```typescript
// app.ts
// Default imports can use any name
import UserManager from "./user";
import Manager from "./user"; // Same thing, different name

const manager = new UserManager();
manager.addUser({ id: 1, name: "Alice" });
```

### Combining Default and Named Exports

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

// Default export
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

### Re-exports

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

// models/index.ts - Barrel file
// Re-export everything
export * from "./user";
export * from "./product";
export * from "./order";

// Re-export with rename
export { User as UserModel } from "./user";

// Re-export default as named
export { default as ProductService } from "./productService";

// Re-export specific items
export { Order, type Order as OrderType } from "./order";
```

```typescript
// app.ts
// Import from barrel file
import { User, Product, Order } from "./models";
```

### Export Assignments (CommonJS Interop)

```typescript
// legacyModule.ts
// For CommonJS compatibility
class LegacyApi {
  fetch(url: string): Promise<unknown> {
    return fetch(url).then((r) => r.json());
  }
}

// CommonJS-style export
export = LegacyApi;
```

```typescript
// consumer.ts
// Must use require-style import
import LegacyApi = require("./legacyModule");

const api = new LegacyApi();
```

## Import Variations

TypeScript provides flexible ways to import from modules.

### Named Imports

```typescript
// Import specific exports
import { add, multiply } from "./math";

// Import with alias
import { add as sum, multiply as product } from "./math";

// Import types
import type { User, UserRole } from "./types";
```

### Default Imports

```typescript
// Import default export
import Calculator from "./calculator";

// Combine default and named imports
import Calculator, { PI, add } from "./calculator";

// Import default with alias
import { default as Calc } from "./calculator";
```

### Namespace Imports

```typescript
// Import all exports as a namespace object
import * as MathUtils from "./math";

console.log(MathUtils.PI);
console.log(MathUtils.add(1, 2));

const calc = new MathUtils.Calculator();
```

### Side Effect Imports

```typescript
// polyfills.ts
// Adds methods to global objects
declare global {
  interface Array<T> {
    last(): T | undefined;
  }
}

Array.prototype.last = function () {
  return this[this.length - 1];
};

export {}; // Make it a module
```

```typescript
// app.ts
// Import for side effects only - no bindings
import "./polyfills";

const arr = [1, 2, 3];
console.log(arr.last()); // 3
```

### Dynamic Imports

```typescript
// Static import - loaded at startup
import { heavyFunction } from "./heavyModule";

// Dynamic import - loaded on demand
async function loadHeavyModule() {
  const module = await import("./heavyModule");
  module.heavyFunction();
}

// With type safety
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

// Conditional loading
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

### Import Assertions (ES2022+)

```typescript
// Import JSON files with assertions
import config from "./config.json" assert { type: "json" };

// Import CSS modules (with appropriate loader)
import styles from "./styles.css" assert { type: "css" };

// Dynamic import with assertion
const data = await import("./data.json", {
  assert: { type: "json" },
});
```

## Namespaces

Namespaces (formerly "internal modules") are a TypeScript-specific way to organize code. While modules are the preferred approach for most applications, namespaces remain useful in certain scenarios.

### Basic Namespace Syntax

```typescript
// validation.ts
namespace Validation {
  // Private to namespace
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[\d\s-()]+$/;

  // Exported interface
  export interface Validator {
    validate(value: string): boolean;
  }

  // Exported class
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

  // Exported function
  export function createValidator(type: "email" | "phone"): Validator {
    switch (type) {
      case "email":
        return new EmailValidator();
      case "phone":
        return new PhoneValidator();
    }
  }
}

// Usage
const emailValidator = new Validation.EmailValidator();
console.log(emailValidator.validate("test@example.com")); // true

const validator = Validation.createValidator("phone");
console.log(validator.validate("+1 (555) 123-4567")); // true
```

### Nested Namespaces

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

// Usage
const userService = new App.Services.UserService();
const user: App.Models.User = userService.getUser(1);
App.Utils.log(`Found user: ${user.name}`);
```

### Namespace Aliases

```typescript
namespace Very.Long.Namespace.Path {
  export class MyClass {
    greet(): string {
      return "Hello!";
    }
  }
}

// Create an alias for convenience
import MyClass = Very.Long.Namespace.Path.MyClass;

const instance = new MyClass();
console.log(instance.greet());

// Alias for nested namespace
import Services = App.Services;
const userService = new Services.UserService();
```

### Multi-file Namespaces

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

### Ambient Namespaces

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

## Modules vs Namespaces

Understanding when to use modules versus namespaces is crucial for proper code organization.

### When to Use Modules (Preferred)

```typescript
// Modules are preferred for:
// 1. Modern applications with bundlers
// 2. Node.js applications
// 3. Projects using npm packages
// 4. Code sharing between projects

// userService.ts
export class UserService {
  async getUser(id: number) {
    // fetch user
  }
}

// userController.ts
import { UserService } from "./userService";

export class UserController {
  constructor(private userService: UserService) {}
}
```

### When to Use Namespaces

```typescript
// Namespaces can be useful for:
// 1. Augmenting global declarations
// 2. Organizing type declarations
// 3. Legacy codebases
// 4. Simple scripts without bundlers

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

// Extending built-in types
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}
```

### Migration from Namespaces to Modules

```typescript
// Before: namespace-based
namespace Utils {
  export function formatDate(date: Date): string {
    return date.toISOString();
  }

  export function parseDate(str: string): Date {
    return new Date(str);
  }
}

// After: module-based
// dateUtils.ts
export function formatDate(date: Date): string {
  return date.toISOString();
}

export function parseDate(str: string): Date {
  return new Date(str);
}

// If you need namespace-like access:
// utils/index.ts
export * as DateUtils from "./dateUtils";
export * as StringUtils from "./stringUtils";

// Usage
import { DateUtils } from "./utils";
DateUtils.formatDate(new Date());
```

## Declaration Merging

Declaration merging is a powerful TypeScript feature where the compiler merges multiple declarations with the same name into a single definition.

### Interface Merging

```typescript
// Interfaces with the same name merge automatically
interface Box {
  height: number;
  width: number;
}

interface Box {
  depth: number;
  color?: string;
}

// Merged interface has all properties
const box: Box = {
  height: 10,
  width: 20,
  depth: 30,
  color: "blue",
};
```

### Merging with Different Member Types

```typescript
interface Document {
  createElement(tagName: string): Element;
}

interface Document {
  createElement(tagName: "div"): HTMLDivElement;
  createElement(tagName: "span"): HTMLSpanElement;
  createElement(tagName: "canvas"): HTMLCanvasElement;
}

// Overloads are merged - more specific signatures come first
const div = document.createElement("div"); // HTMLDivElement
const span = document.createElement("span"); // HTMLSpanElement
const element = document.createElement("custom"); // Element
```

### Namespace Merging

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

// Both classes available
const dog = new Animals.Dog();
const cat = new Animals.Cat();
const pet: Animals.Pet = { name: "Fluffy" };
```

### Merging Namespaces with Classes

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

// Usage
const label = Album.createLabel("Sony Music");
const album = new Album(label);
```

### Merging Namespaces with Functions

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

// Usage
console.log(buildName("John", "Doe")); // "John Doe"
console.log(buildName.withDefault("John")); // "John Smith"
buildName.defaultLastName = "Johnson";
console.log(buildName.withDefault("Jane")); // "Jane Johnson"
```

### Merging Namespaces with Enums

```typescript
enum Color {
  Red = 1,
  Green = 2,
  Blue = 3,
}

namespace Color {
  export function lighten(color: Color, percent: number): string {
    // Implementation to lighten color
    return `${Color[color]} lightened by ${percent}%`;
  }

  export function darken(color: Color, percent: number): string {
    // Implementation to darken color
    return `${Color[color]} darkened by ${percent}%`;
  }

  export const DEFAULT = Color.Blue;
}

// Usage
const color = Color.Red;
console.log(Color.lighten(color, 20)); // "Red lightened by 20%"
console.log(Color.DEFAULT); // 3
```

## Module Augmentation

Module augmentation allows you to extend existing modules with new declarations, which is particularly useful for adding types to third-party libraries.

### Augmenting External Modules

```typescript
// Extend the 'express' module
import express, { Request, Response } from "express";

// Augment the express module
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

// Implementation
const app = express();

app.use((req: Request, res: Response, next) => {
  // TypeScript now knows about req.user
  req.user = { id: 1, email: "test@example.com", role: "admin" };
  next();
});

app.get("/profile", (req: Request, res: Response) => {
  if (req.user) {
    res.json({ user: req.user });
  }
});
```

### Augmenting Global Modules

```typescript
// Extend global Window interface
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

// Now you can use these properties
window.config = {
  apiUrl: "https://api.example.com",
  debug: true,
};

window.analytics.track("page_view", { path: "/" });

export {}; // Make this a module
```

### Augmenting Built-in Types

```typescript
// Extend Array prototype
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

// Usage
const arr = [1, 2, 3, 4, 5];
console.log(arr.first()); // 1
console.log(arr.last()); // 5
console.log(arr.isEmpty()); // false
console.log(arr.chunk(2)); // [[1, 2], [3, 4], [5]]

export {};
```

### Augmenting Third-party Libraries

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
// Augmenting Vue.js
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

### Wildcard Module Declarations

```typescript
// Allow importing any .svg file
declare module "*.svg" {
  const content: string;
  export default content;
}

// Allow importing .png files with metadata
declare module "*.png" {
  const value: {
    src: string;
    width: number;
    height: number;
  };
  export default value;
}

// Allow importing .css modules
declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// Allow importing .json files
declare module "*.json" {
  const value: unknown;
  export default value;
}

// Usage
import logo from "./logo.svg";
import avatar from "./avatar.png";
import styles from "./component.module.css";
```

## Module Resolution

Module resolution is the process TypeScript uses to figure out what a module import refers to. Understanding this process helps troubleshoot import issues and configure projects correctly.

### Module Resolution Strategies

```json
// tsconfig.json
{
  "compilerOptions": {
    // Classic: Legacy TypeScript resolution
    // "moduleResolution": "classic",

    // Node: Node.js-style resolution (CommonJS)
    // "moduleResolution": "node",

    // Node16/NodeNext: Modern Node.js resolution (ESM + CJS)
    // "moduleResolution": "node16",
    "moduleResolution": "nodenext",

    // Bundler: For use with bundlers like webpack, Vite
    // "moduleResolution": "bundler"
  }
}
```

### How Node Resolution Works

```typescript
// When you import:
import { something } from "my-module";

// TypeScript/Node looks for:
// 1. node_modules/my-module.ts
// 2. node_modules/my-module.tsx
// 3. node_modules/my-module.d.ts
// 4. node_modules/my-module/package.json (main/types field)
// 5. node_modules/my-module/index.ts
// 6. node_modules/my-module/index.tsx
// 7. node_modules/my-module/index.d.ts
```

```typescript
// Relative imports:
import { helper } from "./utils";

// TypeScript looks for:
// 1. ./utils.ts
// 2. ./utils.tsx
// 3. ./utils.d.ts
// 4. ./utils/package.json (main field)
// 5. ./utils/index.ts
// 6. ./utils/index.tsx
// 7. ./utils/index.d.ts
```

### Package.json Exports Field

```json
// package.json for a library
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

### Base URL Configuration

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
// With baseUrl set to "./src"

// Instead of:
import { User } from "../../../models/user";
import { apiClient } from "../../../services/api";

// You can write:
import { User } from "models/user";
import { apiClient } from "services/api";
```

### Root Dirs Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "rootDirs": ["src/views", "generated/templates"]
  }
}
```

```typescript
// This allows imports across rootDirs as if they were one directory
// src/views/main.ts can import from generated/templates/header.ts as:
import { Header } from "./header";
```

## Path Mapping and Aliases

Path mapping allows you to create custom import paths, making imports cleaner and more maintainable.

### Basic Path Aliases

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
// Before path aliases
import { Button } from "../../../components/ui/Button";
import { formatDate } from "../../../utils/date";
import { UserService } from "../../../services/userService";
import type { User } from "../../../models/user";

// After path aliases
import { Button } from "@components/ui/Button";
import { formatDate } from "@utils/date";
import { UserService } from "@services/userService";
import type { User } from "@models/user";
```

### Exact Path Mappings

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      // Exact mapping (no wildcard)
      "config": ["src/config/index.ts"],
      "constants": ["src/constants/index.ts"],

      // Fallback patterns
      "@api/*": ["src/api/*", "src/api/generated/*"]
    }
  }
}
```

### Integrating with Bundlers

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

### Jest Configuration for Path Aliases

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

### Complete Project Configuration Example

```json
// tsconfig.json - Full configuration
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

## Best Practices

### Prefer ES Modules Over Namespaces

```typescript
// Avoid: Namespace-based organization
namespace MyApp {
  export namespace Utils {
    export function format(value: string): string {
      return value.trim();
    }
  }
}

// Prefer: Module-based organization
// utils/format.ts
export function format(value: string): string {
  return value.trim();
}

// utils/index.ts
export * from "./format";
export * from "./validate";
```

### Use Barrel Files Strategically

```typescript
// components/index.ts - Barrel file
export { Button } from "./Button";
export { Input } from "./Input";
export { Modal } from "./Modal";
export { Card } from "./Card";

// Types can be exported separately or together
export type { ButtonProps } from "./Button";
export type { InputProps } from "./Input";
```

```typescript
// Usage - clean imports
import { Button, Input, Modal } from "@components";
import type { ButtonProps } from "@components";
```

### Use Type-Only Imports for Types

```typescript
// Clearly separate type and value imports
import { UserService } from "./userService";
import type { User, UserRole } from "./types";

// Or use inline type modifier
import { UserService, type User, type UserRole } from "./module";
```

### Organize Exports Consistently

```typescript
// Good: Consistent export style
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

### Avoid Circular Dependencies

```typescript
// Problematic: Circular dependency
// a.ts
import { B } from "./b"; // B imports A
export class A {
  b: B;
}

// b.ts
import { A } from "./a"; // A imports B - circular!
export class B {
  a: A;
}

// Solution: Extract shared types
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

### Use Explicit Extensions with ESM

```typescript
// For Node.js ESM, include extensions
// tsconfig.json: { "moduleResolution": "node16" }

// Instead of:
import { helper } from "./utils";

// Use:
import { helper } from "./utils.js"; // .js even for .ts files!
```

### Document Module Augmentations

```typescript
/**
 * Extends Express Request to include authenticated user information.
 * This augmentation is applied globally when this module is imported.
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
     * The authenticated user, populated by auth middleware.
     * Undefined if the request is not authenticated.
     */
    user?: {
      id: number;
      email: string;
      role: "admin" | "user";
    };
  }
}
```

### Keep Module APIs Clean

```typescript
// Internal helpers stay private
function internalHelper(data: string): string {
  return data.toLowerCase().trim();
}

// Only export what consumers need
export function processData(data: string): string {
  return internalHelper(data);
}

export interface ProcessedResult {
  value: string;
  timestamp: Date;
}

// Don't export implementation details
// export { internalHelper }; // Avoid!
```

## Conclusion

Modules and namespaces are fundamental to organizing TypeScript applications. While ES Modules are the standard and preferred approach for modern development, understanding namespaces remains valuable for working with legacy code and certain declaration scenarios.

Key takeaways:

- **ES Modules** are the standard for modern TypeScript applications
- **Type-only imports** clarify intent and can improve build performance
- **Namespaces** are best reserved for declaration files and global augmentations
- **Declaration merging** enables powerful extension patterns
- **Module augmentation** allows extending third-party libraries with type safety
- **Path aliases** improve code readability and maintainability
- **Module resolution** configuration must match your runtime environment

By mastering these concepts, you will be able to structure TypeScript projects that are maintainable, scalable, and easy to navigate.
