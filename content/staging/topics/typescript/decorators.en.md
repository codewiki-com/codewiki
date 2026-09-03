---
title: Decorators
description: Complete guide to TypeScript decorators, class decorators, method decorators and property decorators
track: typescript
section: patterns
difficulty: advanced
tags:
  - TypeScript
  - Decorators
  - Metaprogramming
  - Design Patterns
status: imported
origin: old/src/content/docs/typescript/decorators.en.md
divergence: 0.281
issues: []
legacy:
  category: TypeScript
  subcategory: Advanced Features
  order: 6
  lastUpdated: 2026-01-07
---

Decorators are a powerful feature in TypeScript that enable metaprogramming by allowing you to annotate and modify classes, methods, properties, and parameters at design time. They provide a declarative way to add behavior to your code without modifying the original implementation, making them essential for frameworks like Angular, NestJS, and TypeORM.

## Introduction to Decorators

Decorators are special declarations that can be attached to class declarations, methods, accessors, properties, or parameters. They use the form `@expression`, where `expression` must evaluate to a function that will be called at runtime with information about the decorated declaration.

### Why Use Decorators?

Decorators provide several benefits:

- **Separation of Concerns**: Move cross-cutting concerns (logging, validation, caching) out of business logic
- **Declarative Programming**: Express behavior through annotations rather than imperative code
- **Code Reusability**: Apply the same behavior to multiple targets without duplication
- **Framework Integration**: Enable powerful dependency injection and configuration patterns

```typescript
// Without decorators - manual logging
class UserService {
  getUser(id: number) {
    console.log(`Calling getUser with id: ${id}`);
    const result = this.fetchUser(id);
    console.log(`getUser returned:`, result);
    return result;
  }

  private fetchUser(id: number) {
    return { id, name: "John" };
  }
}

// With decorators - clean separation
class UserService {
  @Log()
  getUser(id: number) {
    return this.fetchUser(id);
  }

  private fetchUser(id: number) {
    return { id, name: "John" };
  }
}
```

## Enabling Decorators

Decorators are an experimental feature in TypeScript. To enable them, you must configure your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES5",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

- `experimentalDecorators`: Enables experimental support for decorators
- `emitDecoratorMetadata`: Enables experimental support for emitting type metadata for decorators (required for reflection)

### TypeScript 5.0+ Decorators

TypeScript 5.0 introduced native support for the ECMAScript decorators proposal (Stage 3). These work differently from experimental decorators:

```typescript
// Stage 3 decorators (TypeScript 5.0+)
// No need for experimentalDecorators flag
function logged<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name);

  return function (this: This, ...args: Args): Return {
    console.log(`Entering ${methodName}`);
    const result = target.call(this, ...args);
    console.log(`Exiting ${methodName}`);
    return result;
  };
}
```

This article focuses on experimental decorators as they are still widely used in popular frameworks.

## Class Decorators

A class decorator is declared just before a class declaration. It is applied to the constructor of the class and can be used to observe, modify, or replace a class definition.

### Basic Class Decorator

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

// The class and its prototype are now sealed
// Cannot add new properties
```

### Class Decorator with Type Parameter

```typescript
function logClass<T extends { new (...args: any[]): {} }>(constructor: T) {
  console.log(`Class ${constructor.name} was created`);
  return constructor;
}

@logClass
class MyClass {
  constructor() {
    console.log("Instance created");
  }
}

// Logs: "Class MyClass was created"
const instance = new MyClass();
// Logs: "Instance created"
```

### Replacing a Class Constructor

```typescript
function withTimestamp<T extends { new (...args: any[]): {} }>(constructor: T) {
  return class extends constructor {
    timestamp = new Date();
  };
}

@withTimestamp
class Document {
  title: string;

  constructor(title: string) {
    this.title = title;
  }
}

const doc = new Document("My Document");
console.log((doc as any).timestamp); // Current date
console.log(doc.title); // "My Document"
```

### Adding Methods to a Class

```typescript
function addToString<T extends { new (...args: any[]): {} }>(constructor: T) {
  return class extends constructor {
    toString() {
      return JSON.stringify(this);
    }
  };
}

@addToString
class User {
  constructor(public name: string, public age: number) {}
}

const user = new User("John", 30);
console.log(user.toString()); // '{"name":"John","age":30}'
```

### Registering Classes

```typescript
const registry: Map<string, Function> = new Map();

function register(name: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    registry.set(name, constructor);
    return constructor;
  };
}

@register("user-service")
class UserService {
  getUsers() {
    return ["user1", "user2"];
  }
}

@register("auth-service")
class AuthService {
  authenticate() {
    return true;
  }
}

// Retrieve from registry
const UserServiceClass = registry.get("user-service");
if (UserServiceClass) {
  const service = new (UserServiceClass as any)();
  console.log(service.getUsers());
}
```

## Method Decorators

A method decorator is declared just before a method declaration. It is applied to the property descriptor for the method and can be used to observe, modify, or replace a method definition.

### Method Decorator Signature

```typescript
function methodDecorator(
  target: any, // Prototype for instance methods, constructor for static methods
  propertyKey: string | symbol, // Method name
  descriptor: PropertyDescriptor // Property descriptor
): PropertyDescriptor | void {
  // Return modified descriptor or void
}
```

### Basic Method Decorator

```typescript
function log(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`Calling ${propertyKey} with arguments:`, args);
    const result = originalMethod.apply(this, args);
    console.log(`${propertyKey} returned:`, result);
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
// Logs: Calling add with arguments: [2, 3]
// Logs: add returned: 5
```

### Method Timing Decorator

```typescript
function measureTime(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    const result = await originalMethod.apply(this, args);
    const end = performance.now();
    console.log(`${propertyKey} execution time: ${end - start}ms`);
    return result;
  };

  return descriptor;
}

class DataProcessor {
  @measureTime
  async processData(data: number[]): Promise<number> {
    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 100));
    return data.reduce((sum, n) => sum + n, 0);
  }
}
```

### Error Handling Decorator

```typescript
function catchError(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      console.error(`Error in ${propertyKey}:`, error);
      throw error;
    }
  };

  return descriptor;
}

class ApiService {
  @catchError
  async fetchData(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  }
}
```

### Method Caching (Memoization) Decorator

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
      console.log(`Cache hit for ${propertyKey}`);
      return cache.get(key);
    }
    console.log(`Cache miss for ${propertyKey}`);
    const result = originalMethod.apply(this, args);
    cache.set(key, result);
    return result;
  };

  return descriptor;
}

class MathOperations {
  @memoize
  fibonacci(n: number): number {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
}

const math = new MathOperations();
console.log(math.fibonacci(40)); // First call - computed
console.log(math.fibonacci(40)); // Second call - cached
```

### Debounce Decorator

```typescript
function debounce(delay: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    let timeoutId: ReturnType<typeof setTimeout>;

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
  search(query: string) {
    console.log(`Searching for: ${query}`);
    // Perform search
  }
}
```

### Deprecation Warning Decorator

```typescript
function deprecated(message?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      console.warn(
        `Warning: ${propertyKey} is deprecated. ${message || "Please use an alternative."}`
      );
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

class OldApi {
  @deprecated("Use newMethod() instead")
  oldMethod() {
    return "old result";
  }

  newMethod() {
    return "new result";
  }
}
```

## Property Decorators

A property decorator is declared just before a property declaration. It can be used to observe that a property has been defined for a class.

### Property Decorator Signature

```typescript
function propertyDecorator(
  target: any, // Prototype for instance properties, constructor for static
  propertyKey: string | symbol // Property name
): void {
  // No return value
}
```

### Basic Property Decorator

```typescript
function logProperty(target: any, propertyKey: string) {
  let value: any;

  const getter = function () {
    console.log(`Getting ${propertyKey}: ${value}`);
    return value;
  };

  const setter = function (newValue: any) {
    console.log(`Setting ${propertyKey} to ${newValue}`);
    value = newValue;
  };

  Object.defineProperty(target, propertyKey, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true,
  });
}

class Person {
  @logProperty
  name: string = "";
}

const person = new Person();
person.name = "John"; // Logs: Setting name to John
console.log(person.name); // Logs: Getting name: John
```

### Required Property Decorator

```typescript
const requiredMetadataKey = Symbol("required");

function required(target: any, propertyKey: string) {
  let value: any;

  const getter = function () {
    return value;
  };

  const setter = function (newValue: any) {
    if (newValue === undefined || newValue === null || newValue === "") {
      throw new Error(`Property ${propertyKey} is required`);
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
  @required
  username: string = "";

  @required
  email: string = "";
}

const form = new UserForm();
form.username = "john_doe"; // OK
// form.email = ""; // Throws: Property email is required
```

### Observable Property Decorator

```typescript
type Observer<T> = (newValue: T, oldValue: T) => void;

function observable<T>(target: any, propertyKey: string) {
  const observersKey = `__${propertyKey}_observers`;
  let value: T;

  Object.defineProperty(target, propertyKey, {
    get() {
      return value;
    },
    set(newValue: T) {
      const oldValue = value;
      value = newValue;

      const observers: Observer<T>[] = (this as any)[observersKey] || [];
      observers.forEach((observer) => observer(newValue, oldValue));
    },
    enumerable: true,
    configurable: true,
  });

  // Add subscribe method
  if (!target.subscribe) {
    target.subscribe = function (prop: string, observer: Observer<any>) {
      const key = `__${prop}_observers`;
      if (!this[key]) {
        this[key] = [];
      }
      this[key].push(observer);
    };
  }
}

class Store {
  @observable
  count: number = 0;

  subscribe!: (prop: string, observer: Observer<any>) => void;
}

const store = new Store();
store.subscribe("count", (newVal, oldVal) => {
  console.log(`Count changed from ${oldVal} to ${newVal}`);
});

store.count = 1; // Logs: Count changed from 0 to 1
store.count = 5; // Logs: Count changed from 1 to 5
```

### Readonly Property Decorator

```typescript
function readonly(target: any, propertyKey: string) {
  Object.defineProperty(target, propertyKey, {
    writable: false,
    configurable: false,
  });
}

class Constants {
  @readonly
  PI = 3.14159;

  @readonly
  E = 2.71828;
}

const constants = new Constants();
// constants.PI = 3.14; // TypeError: Cannot assign to read only property
```

### Format Property Decorator

```typescript
function format(formatString: string) {
  return function (target: any, propertyKey: string) {
    let value: any;

    const getter = function () {
      return value;
    };

    const setter = function (newValue: any) {
      value = formatString.replace("{value}", newValue);
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

  @format("${value}")
  price: string = "";
}

const product = new Product();
product.name = "Widget";
product.price = "29.99";
console.log(product.price); // "$29.99"
```

## Accessor Decorators

An accessor decorator is declared just before an accessor declaration. It is applied to the property descriptor for the accessor and can be used to observe, modify, or replace accessor definitions.

### Basic Accessor Decorator

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
  private _x: number = 0;
  private _y: number = 0;

  @configurable(false)
  get x() {
    return this._x;
  }

  @configurable(false)
  get y() {
    return this._y;
  }

  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }
}
```

### Validation Accessor Decorator

```typescript
function range(min: number, max: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalSetter = descriptor.set;

    descriptor.set = function (value: number) {
      if (value < min || value > max) {
        throw new RangeError(
          `Value ${value} is out of range [${min}, ${max}] for ${propertyKey}`
        );
      }
      if (originalSetter) {
        originalSetter.call(this, value);
      }
    };
  };
}

class Temperature {
  private _celsius: number = 0;

  @range(-273.15, 1000000)
  set celsius(value: number) {
    this._celsius = value;
  }

  get celsius(): number {
    return this._celsius;
  }
}

const temp = new Temperature();
temp.celsius = 25; // OK
// temp.celsius = -300; // Throws: RangeError
```

## Parameter Decorators

A parameter decorator is declared just before a parameter declaration. It is applied to the function for a class constructor or method declaration.

### Parameter Decorator Signature

```typescript
function parameterDecorator(
  target: any, // Prototype for instance method, constructor for static
  propertyKey: string | symbol, // Method name
  parameterIndex: number // Index of the parameter
): void {
  // No return value
}
```

### Basic Parameter Decorator

```typescript
function logParameter(
  target: any,
  propertyKey: string,
  parameterIndex: number
) {
  const existingParameters: number[] =
    Reflect.getOwnMetadata("logged_parameters", target, propertyKey) || [];
  existingParameters.push(parameterIndex);
  Reflect.defineMetadata(
    "logged_parameters",
    existingParameters,
    target,
    propertyKey
  );
}

function logMethod(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const loggedParams: number[] =
    Reflect.getOwnMetadata("logged_parameters", target, propertyKey) || [];

  descriptor.value = function (...args: any[]) {
    loggedParams.forEach((index) => {
      console.log(
        `Parameter at index ${index} for ${propertyKey}:`,
        args[index]
      );
    });
    return originalMethod.apply(this, args);
  };
}

class UserController {
  @logMethod
  createUser(@logParameter name: string, @logParameter email: string) {
    return { name, email };
  }
}
```

### Required Parameter Decorator

```typescript
import "reflect-metadata";

const requiredMetadataKey = Symbol("required");

function requiredParam(
  target: Object,
  propertyKey: string | symbol,
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
        throw new Error(
          `Missing required argument at position ${index} for method ${propertyKey}`
        );
      }
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}

class OrderService {
  @validate
  createOrder(
    @requiredParam customerId: string,
    @requiredParam products: string[],
    notes?: string
  ) {
    return { customerId, products, notes };
  }
}

const service = new OrderService();
service.createOrder("123", ["product1"]); // OK
// service.createOrder(null as any, ["product1"]); // Throws error
```

## Decorator Factories

Decorator factories are functions that return a decorator. They allow you to customize the behavior of decorators by passing arguments.

### Basic Decorator Factory

```typescript
function color(value: string) {
  // This is the decorator factory
  return function (target: any) {
    // This is the decorator
    target.prototype.color = value;
  };
}

@color("red")
class RedBox {
  color?: string;
}

@color("blue")
class BlueBox {
  color?: string;
}

console.log(new RedBox().color); // "red"
console.log(new BlueBox().color); // "blue"
```

### Method Decorator Factory with Options

```typescript
interface RetryOptions {
  maxAttempts: number;
  delay: number;
  exponentialBackoff?: boolean;
}

function retry(options: RetryOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError: Error;

      for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error as Error;
          console.log(
            `Attempt ${attempt}/${options.maxAttempts} failed: ${lastError.message}`
          );

          if (attempt < options.maxAttempts) {
            const delay = options.exponentialBackoff
              ? options.delay * Math.pow(2, attempt - 1)
              : options.delay;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError!;
    };

    return descriptor;
  };
}

class ApiClient {
  @retry({ maxAttempts: 3, delay: 1000, exponentialBackoff: true })
  async fetchData(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }
}
```

### Validation Decorator Factory

```typescript
interface ValidationOptions {
  min?: number;
  max?: number;
  pattern?: RegExp;
  required?: boolean;
}

function validate(options: ValidationOptions) {
  return function (target: any, propertyKey: string) {
    let value: any;

    const getter = function () {
      return value;
    };

    const setter = function (newValue: any) {
      if (options.required && (newValue === undefined || newValue === null)) {
        throw new Error(`${propertyKey} is required`);
      }

      if (typeof newValue === "number") {
        if (options.min !== undefined && newValue < options.min) {
          throw new Error(`${propertyKey} must be at least ${options.min}`);
        }
        if (options.max !== undefined && newValue > options.max) {
          throw new Error(`${propertyKey} must be at most ${options.max}`);
        }
      }

      if (typeof newValue === "string" && options.pattern) {
        if (!options.pattern.test(newValue)) {
          throw new Error(`${propertyKey} format is invalid`);
        }
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

class RegistrationForm {
  @validate({ required: true, pattern: /^[a-zA-Z0-9_]{3,20}$/ })
  username: string = "";

  @validate({ required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ })
  email: string = "";

  @validate({ required: true, min: 18, max: 120 })
  age: number = 0;
}
```

### Role-Based Access Control Decorator

```typescript
type Role = "admin" | "user" | "guest";

function authorize(...allowedRoles: Role[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // Assume 'this' has a currentUser property
      const currentUser = (this as any).currentUser;

      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      if (!allowedRoles.includes(currentUser.role)) {
        throw new Error(
          `Access denied. Required roles: ${allowedRoles.join(", ")}`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

class AdminPanel {
  currentUser: { name: string; role: Role } | null = null;

  @authorize("admin")
  deleteUser(userId: string) {
    console.log(`Deleting user ${userId}`);
  }

  @authorize("admin", "user")
  viewProfile(userId: string) {
    console.log(`Viewing profile ${userId}`);
  }

  @authorize("admin", "user", "guest")
  viewPublicPage() {
    console.log("Viewing public page");
  }
}
```

## Decorator Composition

Multiple decorators can be applied to a single declaration. They are evaluated in reverse order (bottom to top) and executed in order (top to bottom).

### Order of Evaluation

```typescript
function first() {
  console.log("first(): factory evaluated");
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    console.log("first(): decorator called");
  };
}

function second() {
  console.log("second(): factory evaluated");
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    console.log("second(): decorator called");
  };
}

class Example {
  @first()
  @second()
  method() {}
}

// Output:
// first(): factory evaluated
// second(): factory evaluated
// second(): decorator called
// first(): decorator called
```

### Composing Multiple Decorators

```typescript
function log(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    console.log(`[LOG] Calling ${propertyKey}`);
    return original.apply(this, args);
  };
  return descriptor;
}

function timing(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    const start = Date.now();
    const result = original.apply(this, args);
    console.log(`[TIMING] ${propertyKey} took ${Date.now() - start}ms`);
    return result;
  };
  return descriptor;
}

function validate(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    if (args.some((arg) => arg === undefined || arg === null)) {
      throw new Error(`[VALIDATE] Invalid arguments for ${propertyKey}`);
    }
    return original.apply(this, args);
  };
  return descriptor;
}

class Service {
  @log
  @timing
  @validate
  processData(data: string): string {
    // Simulate processing
    let result = data;
    for (let i = 0; i < 1000000; i++) {
      result = data.toUpperCase();
    }
    return result;
  }
}

const service = new Service();
service.processData("hello");
// Output:
// [LOG] Calling processData
// [TIMING] processData took Xms
```

### Decorator Composition Utility

```typescript
type MethodDecorator = (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor;

function compose(...decorators: MethodDecorator[]): MethodDecorator {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    return decorators.reduceRight((desc, decorator) => {
      return decorator(target, propertyKey, desc) || desc;
    }, descriptor);
  };
}

const logAndTime = compose(log, timing);

class ComposedService {
  @logAndTime
  process(data: string): string {
    return data.toUpperCase();
  }
}
```

## Metadata and Reflection

TypeScript can emit design-time type information as metadata using the `reflect-metadata` library. This is essential for dependency injection and advanced metaprogramming.

### Installing reflect-metadata

```bash
npm install reflect-metadata
```

Import it at the top of your entry file:

```typescript
import "reflect-metadata";
```

### Using Design-Time Type Information

```typescript
import "reflect-metadata";

function logType(target: any, propertyKey: string) {
  const type = Reflect.getMetadata("design:type", target, propertyKey);
  console.log(`${propertyKey} type: ${type.name}`);
}

function logParamTypes(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const types = Reflect.getMetadata("design:paramtypes", target, propertyKey);
  const typeNames = types.map((t: any) => t.name).join(", ");
  console.log(`${propertyKey} parameter types: ${typeNames}`);
}

function logReturnType(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const type = Reflect.getMetadata("design:returntype", target, propertyKey);
  console.log(`${propertyKey} return type: ${type.name}`);
}

class Demo {
  @logType
  name: string = "";

  @logType
  count: number = 0;

  @logParamTypes
  @logReturnType
  greet(name: string, age: number): string {
    return `Hello ${name}, you are ${age}`;
  }
}

// Output:
// name type: String
// count type: Number
// greet parameter types: String, Number
// greet return type: String
```

### Custom Metadata

```typescript
import "reflect-metadata";

const ROLES_KEY = "roles";

function roles(...roles: string[]) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(ROLES_KEY, roles, target, propertyKey);
  };
}

function getRoles(target: any, propertyKey: string): string[] {
  return Reflect.getMetadata(ROLES_KEY, target, propertyKey) || [];
}

class Controller {
  @roles("admin", "moderator")
  deletePost(postId: string) {
    // Delete logic
  }

  @roles("admin", "moderator", "user")
  editPost(postId: string) {
    // Edit logic
  }

  @roles("admin", "moderator", "user", "guest")
  viewPost(postId: string) {
    // View logic
  }
}

const controller = new Controller();
console.log(getRoles(controller, "deletePost")); // ["admin", "moderator"]
console.log(getRoles(controller, "editPost")); // ["admin", "moderator", "user"]
console.log(getRoles(controller, "viewPost")); // ["admin", "moderator", "user", "guest"]
```

### Dependency Injection with Metadata

```typescript
import "reflect-metadata";

type Constructor<T = any> = new (...args: any[]) => T;

const container = new Map<string, any>();

function Injectable() {
  return function <T extends Constructor>(target: T) {
    container.set(target.name, target);
    return target;
  };
}

function Inject(token: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    const existingInjections =
      Reflect.getMetadata("injections", target) || [];
    existingInjections.push({ index: parameterIndex, token });
    Reflect.defineMetadata("injections", existingInjections, target);
  };
}

function resolve<T>(target: Constructor<T>): T {
  const injections = Reflect.getMetadata("injections", target) || [];
  const paramTypes =
    Reflect.getMetadata("design:paramtypes", target) || [];

  const dependencies = paramTypes.map((type: Constructor, index: number) => {
    const injection = injections.find((i: any) => i.index === index);
    const token = injection?.token || type.name;
    const dependency = container.get(token);

    if (!dependency) {
      throw new Error(`Dependency ${token} not found`);
    }

    return resolve(dependency);
  });

  return new target(...dependencies);
}

// Usage
@Injectable()
class Logger {
  log(message: string) {
    console.log(`[LOG]: ${message}`);
  }
}

@Injectable()
class Database {
  constructor(private logger: Logger) {}

  query(sql: string) {
    this.logger.log(`Executing: ${sql}`);
    return [];
  }
}

@Injectable()
class UserRepository {
  constructor(private db: Database) {}

  findAll() {
    return this.db.query("SELECT * FROM users");
  }
}

// Resolve with automatic dependency injection
const userRepo = resolve(UserRepository);
userRepo.findAll();
// Output: [LOG]: Executing: SELECT * FROM users
```

## Practical Examples

### REST API Controller Decorators

```typescript
import "reflect-metadata";

const ROUTES_KEY = Symbol("routes");

interface RouteDefinition {
  path: string;
  method: "get" | "post" | "put" | "delete";
  handlerName: string;
}

function Controller(basePath: string) {
  return function <T extends Constructor>(target: T) {
    Reflect.defineMetadata("basePath", basePath, target);
    return target;
  };
}

function createMethodDecorator(method: "get" | "post" | "put" | "delete") {
  return function (path: string) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const routes: RouteDefinition[] =
        Reflect.getMetadata(ROUTES_KEY, target.constructor) || [];

      routes.push({
        path,
        method,
        handlerName: propertyKey,
      });

      Reflect.defineMetadata(ROUTES_KEY, routes, target.constructor);
    };
  };
}

const Get = createMethodDecorator("get");
const Post = createMethodDecorator("post");
const Put = createMethodDecorator("put");
const Delete = createMethodDecorator("delete");

@Controller("/api/users")
class UserController {
  @Get("/")
  getAll() {
    return [{ id: 1, name: "John" }];
  }

  @Get("/:id")
  getById(id: string) {
    return { id, name: "John" };
  }

  @Post("/")
  create(data: any) {
    return { id: 2, ...data };
  }

  @Put("/:id")
  update(id: string, data: any) {
    return { id, ...data };
  }

  @Delete("/:id")
  delete(id: string) {
    return { success: true };
  }
}

// Register routes
function registerController(controller: Constructor) {
  const basePath = Reflect.getMetadata("basePath", controller);
  const routes: RouteDefinition[] =
    Reflect.getMetadata(ROUTES_KEY, controller) || [];

  routes.forEach((route) => {
    console.log(
      `Registered: ${route.method.toUpperCase()} ${basePath}${route.path} -> ${route.handlerName}`
    );
  });
}

registerController(UserController);
// Output:
// Registered: GET /api/users/ -> getAll
// Registered: GET /api/users/:id -> getById
// Registered: POST /api/users/ -> create
// Registered: PUT /api/users/:id -> update
// Registered: DELETE /api/users/:id -> delete
```

### Entity Validation Decorators

```typescript
import "reflect-metadata";

interface ValidationRule {
  type: string;
  message: string;
  validator: (value: any) => boolean;
}

const VALIDATION_KEY = Symbol("validation");

function addValidation(rule: ValidationRule) {
  return function (target: any, propertyKey: string) {
    const rules: ValidationRule[] =
      Reflect.getMetadata(VALIDATION_KEY, target, propertyKey) || [];
    rules.push(rule);
    Reflect.defineMetadata(VALIDATION_KEY, rules, target, propertyKey);
  };
}

function Required(message = "This field is required") {
  return addValidation({
    type: "required",
    message,
    validator: (value) => value !== undefined && value !== null && value !== "",
  });
}

function MinLength(length: number, message?: string) {
  return addValidation({
    type: "minLength",
    message: message || `Minimum length is ${length}`,
    validator: (value) => typeof value === "string" && value.length >= length,
  });
}

function MaxLength(length: number, message?: string) {
  return addValidation({
    type: "maxLength",
    message: message || `Maximum length is ${length}`,
    validator: (value) => typeof value === "string" && value.length <= length,
  });
}

function Email(message = "Invalid email format") {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return addValidation({
    type: "email",
    message,
    validator: (value) => typeof value === "string" && emailRegex.test(value),
  });
}

function Min(minimum: number, message?: string) {
  return addValidation({
    type: "min",
    message: message || `Minimum value is ${minimum}`,
    validator: (value) => typeof value === "number" && value >= minimum,
  });
}

function Max(maximum: number, message?: string) {
  return addValidation({
    type: "max",
    message: message || `Maximum value is ${maximum}`,
    validator: (value) => typeof value === "number" && value <= maximum,
  });
}

class Validator {
  static validate<T extends object>(instance: T): { valid: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {};
    const prototype = Object.getPrototypeOf(instance);

    for (const key of Object.keys(instance)) {
      const rules: ValidationRule[] =
        Reflect.getMetadata(VALIDATION_KEY, prototype, key) || [];

      for (const rule of rules) {
        const value = (instance as any)[key];
        if (!rule.validator(value)) {
          if (!errors[key]) {
            errors[key] = [];
          }
          errors[key].push(rule.message);
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

// Usage
class CreateUserDto {
  @Required()
  @MinLength(3)
  @MaxLength(50)
  name: string = "";

  @Required()
  @Email()
  email: string = "";

  @Required()
  @Min(18, "Must be at least 18 years old")
  @Max(120)
  age: number = 0;
}

const dto = new CreateUserDto();
dto.name = "Jo"; // Too short
dto.email = "invalid-email"; // Invalid format
dto.age = 15; // Too young

const result = Validator.validate(dto);
console.log(result);
// {
//   valid: false,
//   errors: {
//     name: ["Minimum length is 3"],
//     email: ["Invalid email format"],
//     age: ["Must be at least 18 years old"]
//   }
// }
```

### ORM-Style Entity Decorators

```typescript
import "reflect-metadata";

const ENTITY_KEY = Symbol("entity");
const COLUMN_KEY = Symbol("column");
const PRIMARY_KEY = Symbol("primary");

interface ColumnOptions {
  type?: "string" | "number" | "boolean" | "date";
  nullable?: boolean;
  unique?: boolean;
  default?: any;
}

function Entity(tableName?: string) {
  return function <T extends Constructor>(target: T) {
    Reflect.defineMetadata(ENTITY_KEY, tableName || target.name.toLowerCase(), target);
    return target;
  };
}

function PrimaryColumn() {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(PRIMARY_KEY, propertyKey, target.constructor);
    Reflect.defineMetadata(COLUMN_KEY, { type: "number" }, target, propertyKey);
  };
}

function Column(options: ColumnOptions = {}) {
  return function (target: any, propertyKey: string) {
    const columns: string[] =
      Reflect.getMetadata(COLUMN_KEY, target.constructor) || [];
    columns.push(propertyKey);
    Reflect.defineMetadata(COLUMN_KEY, columns, target.constructor);
    Reflect.defineMetadata(`column:${propertyKey}`, options, target.constructor);
  };
}

@Entity("users")
class User {
  @PrimaryColumn()
  id: number = 0;

  @Column({ type: "string", nullable: false })
  name: string = "";

  @Column({ type: "string", unique: true })
  email: string = "";

  @Column({ type: "boolean", default: true })
  isActive: boolean = true;

  @Column({ type: "date" })
  createdAt: Date = new Date();
}

// Generate SQL from entity
function generateCreateTable(entity: Constructor): string {
  const tableName = Reflect.getMetadata(ENTITY_KEY, entity);
  const primaryKey = Reflect.getMetadata(PRIMARY_KEY, entity);
  const columns: string[] = Reflect.getMetadata(COLUMN_KEY, entity) || [];

  const columnDefs = columns.map((col) => {
    const options: ColumnOptions =
      Reflect.getMetadata(`column:${col}`, entity) || {};

    let sql = `  ${col}`;

    switch (options.type) {
      case "string":
        sql += " VARCHAR(255)";
        break;
      case "number":
        sql += " INTEGER";
        break;
      case "boolean":
        sql += " BOOLEAN";
        break;
      case "date":
        sql += " TIMESTAMP";
        break;
      default:
        sql += " TEXT";
    }

    if (col === primaryKey) {
      sql += " PRIMARY KEY AUTO_INCREMENT";
    }
    if (!options.nullable) {
      sql += " NOT NULL";
    }
    if (options.unique) {
      sql += " UNIQUE";
    }
    if (options.default !== undefined) {
      sql += ` DEFAULT ${JSON.stringify(options.default)}`;
    }

    return sql;
  });

  // Add primary key column definition
  const primaryDef = `  ${primaryKey} INTEGER PRIMARY KEY AUTO_INCREMENT`;

  return `CREATE TABLE ${tableName} (\n${primaryDef},\n${columnDefs.join(",\n")}\n);`;
}

console.log(generateCreateTable(User));
// CREATE TABLE users (
//   id INTEGER PRIMARY KEY AUTO_INCREMENT,
//   name VARCHAR(255) NOT NULL,
//   email VARCHAR(255) UNIQUE,
//   isActive BOOLEAN DEFAULT true,
//   createdAt TIMESTAMP
// );
```

## Best Practices

### Keep Decorators Focused

```typescript
// Bad: Decorator doing too many things
function doEverything(
  target: any,
  key: string,
  descriptor: PropertyDescriptor
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    console.log("Logging...");
    const start = Date.now();
    try {
      const result = original.apply(this, args);
      console.log(`Took ${Date.now() - start}ms`);
      return result;
    } catch (e) {
      console.error("Error:", e);
      throw e;
    }
  };
}

// Good: Separate, composable decorators
function log(target: any, key: string, desc: PropertyDescriptor) {
  /* ... */
}
function timing(target: any, key: string, desc: PropertyDescriptor) {
  /* ... */
}
function catchErrors(target: any, key: string, desc: PropertyDescriptor) {
  /* ... */
}

class Service {
  @log
  @timing
  @catchErrors
  process() {
    /* ... */
  }
}
```

### Handle Async Methods Properly

```typescript
function asyncLog(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    console.log(`Starting ${propertyKey}`);
    try {
      // Always await the result
      const result = await originalMethod.apply(this, args);
      console.log(`Completed ${propertyKey}`);
      return result;
    } catch (error) {
      console.log(`Failed ${propertyKey}`);
      throw error;
    }
  };

  return descriptor;
}
```

### Preserve Function Metadata

```typescript
function preserve(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  const newMethod = function (...args: any[]) {
    return originalMethod.apply(this, args);
  };

  // Preserve function name and length
  Object.defineProperty(newMethod, "name", { value: originalMethod.name });
  Object.defineProperty(newMethod, "length", { value: originalMethod.length });

  descriptor.value = newMethod;
  return descriptor;
}
```

### Type Safety in Decorators

```typescript
// Use generics for type-safe decorators
function typedDecorator<T extends object>() {
  return function <K extends keyof T>(
    target: T,
    propertyKey: K
  ): void {
    // Type-safe access to property
    console.log(`Decorating ${String(propertyKey)}`);
  };
}

class TypedClass {
  @typedDecorator<TypedClass>()
  myProperty: string = "";
}
```

### Document Decorator Behavior

```typescript
/**
 * Caches the result of a method call based on its arguments.
 *
 * @param ttl - Time to live in milliseconds (default: 60000)
 * @returns Method decorator
 *
 * @example
 * class UserService {
 *   @Cache(30000)
 *   async getUser(id: string): Promise<User> {
 *     return fetchUser(id);
 *   }
 * }
 *
 * @remarks
 * - Cache key is generated from method arguments using JSON.stringify
 * - Cached values are stored per instance
 * - Does not cache rejected promises
 */
function Cache(ttl: number = 60000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    // Implementation
  };
}
```

### Avoid Side Effects in Property Decorators

```typescript
// Bad: Modifying external state
const allProperties: string[] = [];

function trackProperty(target: any, key: string) {
  allProperties.push(key); // Side effect
}

// Good: Store metadata on the target
function trackProperty(target: any, key: string) {
  const properties = Reflect.getMetadata("properties", target.constructor) || [];
  properties.push(key);
  Reflect.defineMetadata("properties", properties, target.constructor);
}
```

### Test Decorators Thoroughly

```typescript
describe("@log decorator", () => {
  it("should log method calls", () => {
    const consoleSpy = jest.spyOn(console, "log");

    class TestClass {
      @log
      testMethod() {
        return "result";
      }
    }

    const instance = new TestClass();
    const result = instance.testMethod();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("testMethod")
    );
    expect(result).toBe("result");
  });

  it("should preserve original method behavior", () => {
    class TestClass {
      @log
      add(a: number, b: number) {
        return a + b;
      }
    }

    const instance = new TestClass();
    expect(instance.add(2, 3)).toBe(5);
  });
});
```

## Conclusion

TypeScript decorators are a powerful metaprogramming feature that enables clean, declarative code patterns. They are fundamental to many popular frameworks and can significantly improve code organization and reusability.

Key takeaways:

- **Class decorators** modify or replace class constructors
- **Method decorators** intercept and modify method behavior
- **Property decorators** observe and transform property access
- **Parameter decorators** capture parameter metadata for validation and injection
- **Decorator factories** allow customization through arguments
- **Metadata reflection** enables advanced patterns like dependency injection
- **Composition** allows combining multiple decorators for complex behavior

When using decorators:

- Keep them focused and single-purpose
- Handle async methods correctly
- Use TypeScript's type system effectively
- Document expected behavior
- Test thoroughly
- Be aware of execution order in composition

Decorators, combined with the reflect-metadata library, unlock powerful patterns for building maintainable, extensible applications. As the ECMAScript decorator proposal continues to evolve, TypeScript decorators will remain an essential tool in the modern developer's toolkit.
