---
title: TypeScript Decorators
description: Deep dive into TypeScript decorators and their applications
track: typescript
section: generics-advanced
difficulty: advanced
tags:
  - TypeScript
  - decorators
  - metaprogramming
  - AOP
status: imported
origin: old/src/content/docs/frontend/ts-decorators.en.md
divergence: 0.279
issues: []
legacy:
  category: Frontend
  subcategory: TypeScript
  order: 44
  lastUpdated: 2026-01-07
---

Decorators are a powerful metaprogramming feature in TypeScript that allows you to add annotations and modify classes, methods, properties, and parameters at design time. They provide a declarative way to apply cross-cutting concerns like logging, validation, caching, and dependency injection without cluttering your business logic. We explore all decorator types, decorator factories, metadata reflection, and real-world usage patterns in popular frameworks like NestJS and TypeORM.

## Understanding Decorators

Decorators are special declarations that can be attached to class declarations, methods, accessors, properties, or parameters. They use the form `@expression`, where `expression` must evaluate to a function that will be called at runtime with information about the decorated declaration.

### Enabling Decorators

To use decorators in TypeScript, you need to enable them in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2016",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

- `experimentalDecorators`: Enables experimental support for decorators
- `emitDecoratorMetadata`: Enables metadata reflection (required for frameworks like NestJS)

### Decorator Evaluation Order

When multiple decorators are applied to a single declaration, they are evaluated in a specific order:

1. Parameter decorators, method decorators, accessor decorators, or property decorators are applied for each instance member
2. Parameter decorators, method decorators, accessor decorators, or property decorators are applied for each static member
3. Parameter decorators are applied for the constructor
4. Class decorators are applied for the class

For multiple decorators on a single declaration, they are composed (evaluated bottom-up, executed top-down):

```typescript
function first() {
  console.log("first(): factory evaluated");
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    console.log("first(): called");
  };
}

function second() {
  console.log("second(): factory evaluated");
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    console.log("second(): called");
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
// second(): called
// first(): called
```

## Class Decorators

Class decorators are applied to the constructor of a class and can be used to observe, modify, or replace a class definition.

### Basic Class Decorator

```typescript
// A simple sealed decorator that prevents extending the class
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class BugReport {
  type = "report";
  title: string;

  constructor(t: string) {
    this.title = t;
  }
}

// Attempting to add properties will fail silently or throw in strict mode
```

### Class Decorator with Constructor Replacement

```typescript
// Decorator that extends the original class
function reportableClassDecorator<T extends { new (...args: any[]): {} }>(constructor: T) {
  return class extends constructor {
    reportingURL = "http://www.example.com/report";
  };
}

@reportableClassDecorator
class BugReport {
  type = "report";
  title: string;

  constructor(t: string) {
    this.title = t;
  }
}

const bug = new BugReport("Needs dark mode");
console.log(bug.title); // "Needs dark mode"
console.log((bug as any).reportingURL); // "http://www.example.com/report"
```

### Singleton Pattern with Decorators

```typescript
function singleton<T extends { new (...args: any[]): {} }>(constructor: T) {
  let instance: T;

  return class extends constructor {
    constructor(...args: any[]) {
      if (instance) {
        return instance;
      }
      super(...args);
      instance = this as any;
    }
  } as T;
}

@singleton
class Database {
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
    console.log("Database instance created");
  }

  connect() {
    console.log(`Connecting to ${this.connectionString}`);
  }
}

const db1 = new Database("mongodb://localhost");
const db2 = new Database("postgres://localhost");

console.log(db1 === db2); // true - same instance
```

### Class Registration Decorator

```typescript
const registry = new Map<string, Function>();

function register(name: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    registry.set(name, constructor);
    return constructor;
  };
}

function getRegisteredClass(name: string): Function | undefined {
  return registry.get(name);
}

@register("UserService")
class UserService {
  getUsers() {
    return ["Alice", "Bob"];
  }
}

@register("ProductService")
class ProductService {
  getProducts() {
    return ["Widget", "Gadget"];
  }
}

// Later, retrieve by name
const UserServiceClass = getRegisteredClass("UserService");
const service = new (UserServiceClass as any)();
console.log(service.getUsers()); // ["Alice", "Bob"]
```

## Method Decorators

Method decorators are applied to the property descriptor of a method and can be used to observe, modify, or replace a method definition.

### Method Decorator Signature

```typescript
function methodDecorator(
  target: any,                          // For static: constructor, for instance: prototype
  propertyKey: string | symbol,         // Method name
  descriptor: PropertyDescriptor        // Property descriptor
): PropertyDescriptor | void {
  // Return modified descriptor or void
}
```

### Logging Decorator

```typescript
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`Calling ${propertyKey} with args:`, JSON.stringify(args));
    const result = originalMethod.apply(this, args);
    console.log(`${propertyKey} returned:`, JSON.stringify(result));
    return result;
  };

  return descriptor;
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }

  @log
  multiply(a: number, b: number): number {
    return a * b;
  }
}

const calc = new Calculator();
calc.add(2, 3);
// Calling add with args: [2,3]
// add returned: 5

calc.multiply(4, 5);
// Calling multiply with args: [4,5]
// multiply returned: 20
```

### Performance Timing Decorator

```typescript
function timing(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = performance.now();
    const result = await originalMethod.apply(this, args);
    const end = performance.now();
    console.log(`${propertyKey} took ${(end - start).toFixed(2)}ms`);
    return result;
  };

  return descriptor;
}

class DataService {
  @timing
  async fetchData(): Promise<string[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return ["data1", "data2"];
  }
}

const service = new DataService();
await service.fetchData();
// fetchData took 102.35ms
```

### Memoization Decorator

```typescript
function memoize(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const cache = new Map<string, any>();

  descriptor.value = function (...args: any[]) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log(`Cache hit for ${propertyKey}(${key})`);
      return cache.get(key);
    }

    console.log(`Cache miss for ${propertyKey}(${key})`);
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

  @memoize
  expensiveCalculation(a: number, b: number): number {
    // Simulate expensive operation
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += a * b;
    }
    return result / 1000000;
  }
}
```

### Error Handling Decorator

```typescript
function catchError(handler?: (error: Error, context: any) => void) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (handler) {
          handler(error as Error, { target, propertyKey, args, this: this });
        } else {
          console.error(`Error in ${propertyKey}:`, error);
        }
        throw error;
      }
    };

    return descriptor;
  };
}

function logErrorToService(error: Error, context: any) {
  // Send to error monitoring service
  console.error(`[ErrorService] ${context.propertyKey}: ${error.message}`);
}

class ApiService {
  @catchError(logErrorToService)
  async fetchUser(id: string): Promise<any> {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }
    return response.json();
  }
}
```

### Retry Decorator

```typescript
function retry(attempts: number = 3, delay: number = 1000) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      let lastError: Error;

      for (let i = 0; i < attempts; i++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error as Error;
          console.log(`Attempt ${i + 1} failed for ${propertyKey}. Retrying in ${delay}ms...`);

          if (i < attempts - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError!;
    };

    return descriptor;
  };
}

class UnreliableService {
  private callCount = 0;

  @retry(3, 500)
  async fetchData(): Promise<string> {
    this.callCount++;
    if (this.callCount < 3) {
      throw new Error("Service temporarily unavailable");
    }
    return "Success on attempt " + this.callCount;
  }
}
```

### Debounce and Throttle Decorators

```typescript
function debounce(wait: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    let timeoutId: NodeJS.Timeout;

    descriptor.value = function (...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        originalMethod.apply(this, args);
      }, wait);
    };

    return descriptor;
  };
}

function throttle(limit: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
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

class SearchComponent {
  @debounce(300)
  search(query: string) {
    console.log(`Searching for: ${query}`);
    // Perform search
  }

  @throttle(1000)
  trackScroll(position: number) {
    console.log(`Scroll position: ${position}`);
    // Track scroll analytics
  }
}
```

## Property Decorators

Property decorators are applied to properties of a class. They cannot observe or modify the property initializer but can add metadata.

### Property Decorator Signature

```typescript
function propertyDecorator(
  target: any,                  // For static: constructor, for instance: prototype
  propertyKey: string | symbol  // Property name
): void {
  // Cannot return a value
}
```

### Validation Decorators

```typescript
const validationMetadataKey = Symbol("validation");

interface ValidationRule {
  type: string;
  message: string;
  validator: (value: any) => boolean;
}

function addValidation(rule: ValidationRule) {
  return function (target: any, propertyKey: string) {
    const existingRules: ValidationRule[] =
      Reflect.getMetadata(validationMetadataKey, target, propertyKey) || [];
    existingRules.push(rule);
    Reflect.defineMetadata(validationMetadataKey, existingRules, target, propertyKey);
  };
}

function required(target: any, propertyKey: string) {
  addValidation({
    type: "required",
    message: `${propertyKey} is required`,
    validator: (value) => value !== undefined && value !== null && value !== ""
  })(target, propertyKey);
}

function minLength(length: number) {
  return function (target: any, propertyKey: string) {
    addValidation({
      type: "minLength",
      message: `${propertyKey} must be at least ${length} characters`,
      validator: (value) => typeof value === "string" && value.length >= length
    })(target, propertyKey);
  };
}

function maxLength(length: number) {
  return function (target: any, propertyKey: string) {
    addValidation({
      type: "maxLength",
      message: `${propertyKey} must be at most ${length} characters`,
      validator: (value) => typeof value === "string" && value.length <= length
    })(target, propertyKey);
  };
}

function email(target: any, propertyKey: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  addValidation({
    type: "email",
    message: `${propertyKey} must be a valid email`,
    validator: (value) => emailRegex.test(value)
  })(target, propertyKey);
}

function range(min: number, max: number) {
  return function (target: any, propertyKey: string) {
    addValidation({
      type: "range",
      message: `${propertyKey} must be between ${min} and ${max}`,
      validator: (value) => typeof value === "number" && value >= min && value <= max
    })(target, propertyKey);
  };
}

class User {
  @required
  @minLength(2)
  @maxLength(50)
  name!: string;

  @required
  @email
  emailAddress!: string;

  @range(18, 120)
  age!: number;
}

function validate(obj: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const prototype = Object.getPrototypeOf(obj);

  for (const propertyKey of Object.keys(obj)) {
    const rules: ValidationRule[] =
      Reflect.getMetadata(validationMetadataKey, prototype, propertyKey) || [];

    for (const rule of rules) {
      if (!rule.validator(obj[propertyKey])) {
        errors.push(rule.message);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// Usage
const user = new User();
user.name = "A";
user.emailAddress = "invalid-email";
user.age = 15;

const result = validate(user);
console.log(result);
// {
//   valid: false,
//   errors: [
//     "name must be at least 2 characters",
//     "emailAddress must be a valid email",
//     "age must be between 18 and 120"
//   ]
// }
```

### Observable Property Decorator

```typescript
function observable(target: any, propertyKey: string) {
  const privateKey = `_${propertyKey}`;
  const observersKey = `_${propertyKey}Observers`;

  Object.defineProperty(target, propertyKey, {
    get() {
      return this[privateKey];
    },
    set(value: any) {
      const oldValue = this[privateKey];
      this[privateKey] = value;

      // Notify observers
      if (this[observersKey]) {
        this[observersKey].forEach((observer: Function) => {
          observer(value, oldValue, propertyKey);
        });
      }
    },
    enumerable: true,
    configurable: true
  });

  // Add observe method to the class
  if (!target.observe) {
    target.observe = function (prop: string, callback: Function) {
      const key = `_${prop}Observers`;
      if (!this[key]) {
        this[key] = [];
      }
      this[key].push(callback);

      // Return unsubscribe function
      return () => {
        const index = this[key].indexOf(callback);
        if (index > -1) {
          this[key].splice(index, 1);
        }
      };
    };
  }
}

class Store {
  @observable
  count: number = 0;

  @observable
  message: string = "";

  observe!: (prop: string, callback: Function) => () => void;
}

const store = new Store();

const unsubscribe = store.observe("count", (newVal: number, oldVal: number) => {
  console.log(`count changed from ${oldVal} to ${newVal}`);
});

store.count = 1; // count changed from undefined to 1
store.count = 2; // count changed from 1 to 2

unsubscribe();
store.count = 3; // No output - unsubscribed
```

### Serialization Decorators

```typescript
const serializableKey = Symbol("serializable");
const serializeNameKey = Symbol("serializeName");

function serializable(target: any, propertyKey: string) {
  const properties: string[] =
    Reflect.getMetadata(serializableKey, target) || [];
  properties.push(propertyKey);
  Reflect.defineMetadata(serializableKey, properties, target);
}

function serializeName(name: string) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(serializeNameKey, name, target, propertyKey);
    serializable(target, propertyKey);
  };
}

function serialize(obj: any): object {
  const prototype = Object.getPrototypeOf(obj);
  const properties: string[] = Reflect.getMetadata(serializableKey, prototype) || [];
  const result: Record<string, any> = {};

  for (const prop of properties) {
    const customName = Reflect.getMetadata(serializeNameKey, prototype, prop);
    const key = customName || prop;
    result[key] = obj[prop];
  }

  return result;
}

class Person {
  @serializeName("first_name")
  firstName!: string;

  @serializeName("last_name")
  lastName!: string;

  @serializable
  age!: number;

  // Not serialized
  password!: string;
}

const person = new Person();
person.firstName = "John";
person.lastName = "Doe";
person.age = 30;
person.password = "secret123";

console.log(serialize(person));
// { first_name: "John", last_name: "Doe", age: 30 }
```

## Parameter Decorators

Parameter decorators are applied to function or constructor parameters. They can be used to add metadata about parameters.

### Parameter Decorator Signature

```typescript
function parameterDecorator(
  target: any,                  // For static: constructor, for instance: prototype
  propertyKey: string | symbol, // Method name (undefined for constructor)
  parameterIndex: number        // Index of the parameter
): void {
  // Cannot return a value
}
```

### Parameter Validation

```typescript
const requiredParamsKey = Symbol("requiredParams");

function requiredParam(target: any, propertyKey: string, parameterIndex: number) {
  const existingRequiredParams: number[] =
    Reflect.getMetadata(requiredParamsKey, target, propertyKey) || [];
  existingRequiredParams.push(parameterIndex);
  Reflect.defineMetadata(requiredParamsKey, existingRequiredParams, target, propertyKey);
}

function validateParams(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const requiredParams: number[] =
      Reflect.getMetadata(requiredParamsKey, target, propertyKey) || [];

    for (const index of requiredParams) {
      if (args[index] === undefined || args[index] === null) {
        throw new Error(`Parameter at index ${index} is required for ${propertyKey}`);
      }
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}

class UserService {
  @validateParams
  createUser(
    @requiredParam name: string,
    @requiredParam email: string,
    age?: number
  ) {
    return { name, email, age };
  }
}

const userService = new UserService();
userService.createUser("John", "john@example.com"); // OK
userService.createUser("John", null as any); // Error: Parameter at index 1 is required
```

### Inject Decorator Pattern

```typescript
const injectKey = Symbol("inject");

interface InjectMetadata {
  index: number;
  token: string;
}

function inject(token: string) {
  return function (target: any, propertyKey: string | undefined, parameterIndex: number) {
    const existingInjects: InjectMetadata[] =
      Reflect.getMetadata(injectKey, target) || [];
    existingInjects.push({ index: parameterIndex, token });
    Reflect.defineMetadata(injectKey, existingInjects, target);
  };
}

// Simple DI container
class Container {
  private services = new Map<string, any>();

  register(token: string, service: any) {
    this.services.set(token, service);
  }

  resolve<T>(target: new (...args: any[]) => T): T {
    const injects: InjectMetadata[] = Reflect.getMetadata(injectKey, target) || [];
    const args: any[] = [];

    for (const { index, token } of injects) {
      const service = this.services.get(token);
      if (!service) {
        throw new Error(`Service not found: ${token}`);
      }
      args[index] = service;
    }

    return new target(...args);
  }
}

// Services
class LoggerService {
  log(message: string) {
    console.log(`[Logger] ${message}`);
  }
}

class DatabaseService {
  query(sql: string) {
    console.log(`[Database] Executing: ${sql}`);
    return [];
  }
}

// Consumer
class UserRepository {
  constructor(
    @inject("logger") private logger: LoggerService,
    @inject("database") private database: DatabaseService
  ) {}

  findAll() {
    this.logger.log("Finding all users");
    return this.database.query("SELECT * FROM users");
  }
}

// Usage
const container = new Container();
container.register("logger", new LoggerService());
container.register("database", new DatabaseService());

const userRepo = container.resolve(UserRepository);
userRepo.findAll();
// [Logger] Finding all users
// [Database] Executing: SELECT * FROM users
```

## Decorator Factories

Decorator factories are functions that return decorators, allowing you to customize decorator behavior with parameters.

### Creating Configurable Decorators

```typescript
// Simple decorator (no factory)
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

// Decorator factory (with parameters)
function deprecated(message?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const msg = message || `${propertyKey} is deprecated`;

    descriptor.value = function (...args: any[]) {
      console.warn(`DEPRECATED: ${msg}`);
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

  @deprecated() // Uses default message
  anotherOldMethod() {
    return "another old result";
  }

  newMethod() {
    return "new result";
  }
}
```

### Composable Decorator Factories

```typescript
type MethodDecorator = (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor;

function compose(...decorators: MethodDecorator[]): MethodDecorator {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    return decorators.reduceRight((desc, decorator) => {
      return decorator(target, propertyKey, desc) || desc;
    }, descriptor);
  };
}

// Individual decorators
function logEntry(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    console.log(`Entering ${propertyKey}`);
    return original.apply(this, args);
  };
  return descriptor;
}

function logExit(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    const result = original.apply(this, args);
    console.log(`Exiting ${propertyKey}`);
    return result;
  };
  return descriptor;
}

function measureTime(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    const start = Date.now();
    const result = original.apply(this, args);
    console.log(`${propertyKey} took ${Date.now() - start}ms`);
    return result;
  };
  return descriptor;
}

// Composed decorator
const traced = compose(logEntry, measureTime, logExit);

class Service {
  @traced
  process() {
    // Simulate work
    let sum = 0;
    for (let i = 0; i < 1000000; i++) {
      sum += i;
    }
    return sum;
  }
}

const service = new Service();
service.process();
// Entering process
// process took 5ms
// Exiting process
```

### Conditional Decorators

```typescript
function when(condition: boolean) {
  return function <T extends Function>(decorator: T): T | ((target: any) => any) {
    if (condition) {
      return decorator;
    }
    // Return a no-op decorator
    return function (target: any) {
      return target;
    } as any;
  };
}

const isDevelopment = process.env.NODE_ENV === "development";

function devOnly<T extends Function>(decorator: T): T {
  return when(isDevelopment)(decorator) as T;
}

// Only apply logging in development
const devLog = devOnly(log);

class ApiClient {
  @devLog
  fetch(url: string) {
    return fetch(url);
  }
}
```

## Metadata Reflection

TypeScript can emit design-time type information as metadata when `emitDecoratorMetadata` is enabled. This is essential for dependency injection and validation frameworks.

### Using reflect-metadata

First, install the reflect-metadata polyfill:

```bash
npm install reflect-metadata
```

Import it at the entry point of your application:

```typescript
import "reflect-metadata";
```

### Accessing Type Metadata

```typescript
import "reflect-metadata";

function logType(target: any, propertyKey: string) {
  const type = Reflect.getMetadata("design:type", target, propertyKey);
  console.log(`${propertyKey} type: ${type?.name}`);
}

function logParamTypes(target: any, propertyKey: string) {
  const types = Reflect.getMetadata("design:paramtypes", target, propertyKey);
  const typeNames = types?.map((t: any) => t.name).join(", ");
  console.log(`${propertyKey} parameter types: ${typeNames}`);
}

function logReturnType(target: any, propertyKey: string) {
  const type = Reflect.getMetadata("design:returntype", target, propertyKey);
  console.log(`${propertyKey} return type: ${type?.name}`);
}

class Example {
  @logType
  name!: string;

  @logType
  count!: number;

  @logParamTypes
  @logReturnType
  greet(name: string, age: number): string {
    return `Hello, ${name}! You are ${age} years old.`;
  }
}

// Output:
// name type: String
// count type: Number
// greet parameter types: String, Number
// greet return type: String
```

### Building a Type-Safe DI Container

```typescript
import "reflect-metadata";

const INJECTABLE_METADATA_KEY = Symbol("injectable");
const INJECT_METADATA_KEY = Symbol("inject");

// Mark a class as injectable
function Injectable() {
  return function (target: Function) {
    Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, target);
  };
}

// Override automatic type detection with a token
function Inject(token: string) {
  return function (target: any, propertyKey: string | undefined, parameterIndex: number) {
    const existingTokens: Map<number, string> =
      Reflect.getMetadata(INJECT_METADATA_KEY, target) || new Map();
    existingTokens.set(parameterIndex, token);
    Reflect.defineMetadata(INJECT_METADATA_KEY, existingTokens, target);
  };
}

class DIContainer {
  private services = new Map<string | Function, any>();

  register<T>(token: string | (new (...args: any[]) => T), instance: T): void {
    this.services.set(token, instance);
  }

  registerClass<T>(target: new (...args: any[]) => T): void {
    const instance = this.resolve(target);
    this.services.set(target, instance);
  }

  resolve<T>(target: new (...args: any[]) => T): T {
    // Check if already registered
    if (this.services.has(target)) {
      return this.services.get(target);
    }

    // Get constructor parameter types
    const paramTypes: Function[] =
      Reflect.getMetadata("design:paramtypes", target) || [];

    // Get any manual inject tokens
    const injectTokens: Map<number, string> =
      Reflect.getMetadata(INJECT_METADATA_KEY, target) || new Map();

    // Resolve dependencies
    const dependencies = paramTypes.map((type, index) => {
      const token = injectTokens.get(index);

      if (token) {
        // Use manual token
        const service = this.services.get(token);
        if (!service) {
          throw new Error(`Service not found for token: ${token}`);
        }
        return service;
      }

      // Use type-based resolution
      if (this.services.has(type)) {
        return this.services.get(type);
      }

      // Try to create instance if it's injectable
      if (Reflect.getMetadata(INJECTABLE_METADATA_KEY, type)) {
        return this.resolve(type as any);
      }

      throw new Error(`Cannot resolve dependency: ${type.name}`);
    });

    return new target(...dependencies);
  }
}

// Usage
@Injectable()
class Logger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

@Injectable()
class ConfigService {
  get(key: string): string {
    return `config_${key}`;
  }
}

@Injectable()
class UserService {
  constructor(
    private logger: Logger,
    private config: ConfigService
  ) {}

  getUser(id: string) {
    this.logger.log(`Getting user ${id}`);
    const apiUrl = this.config.get("apiUrl");
    return { id, apiUrl };
  }
}

const container = new DIContainer();
container.registerClass(Logger);
container.registerClass(ConfigService);

const userService = container.resolve(UserService);
console.log(userService.getUser("123"));
// [LOG] Getting user 123
// { id: "123", apiUrl: "config_apiUrl" }
```

## Real-World Usage: NestJS

NestJS is a popular Node.js framework that heavily uses decorators for routing, dependency injection, and middleware.

### Controller and Route Decorators

```typescript
import { Controller, Get, Post, Body, Param, Query, Headers } from "@nestjs/common";

@Controller("users")
export class UsersController {
  @Get()
  findAll(@Query("limit") limit: number) {
    return `Finding all users with limit: ${limit}`;
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return `Finding user with id: ${id}`;
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return `Creating user: ${JSON.stringify(createUserDto)}`;
  }

  @Get("profile")
  getProfile(@Headers("authorization") auth: string) {
    return `Getting profile with auth: ${auth}`;
  }
}

interface CreateUserDto {
  name: string;
  email: string;
}
```

### Implementing NestJS-like Decorators

```typescript
import "reflect-metadata";

// Metadata keys
const CONTROLLER_METADATA = Symbol("controller");
const ROUTE_METADATA = Symbol("route");
const PARAM_METADATA = Symbol("param");

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RouteMetadata {
  method: HttpMethod;
  path: string;
  handlerName: string;
}

interface ParamMetadata {
  type: "param" | "query" | "body" | "headers";
  name?: string;
  index: number;
}

// Controller decorator
function Controller(basePath: string = "") {
  return function (target: Function) {
    Reflect.defineMetadata(CONTROLLER_METADATA, basePath, target);
  };
}

// HTTP method decorators
function createMethodDecorator(method: HttpMethod) {
  return function (path: string = "") {
    return function (target: any, propertyKey: string) {
      const routes: RouteMetadata[] =
        Reflect.getMetadata(ROUTE_METADATA, target.constructor) || [];
      routes.push({ method, path, handlerName: propertyKey });
      Reflect.defineMetadata(ROUTE_METADATA, routes, target.constructor);
    };
  };
}

const Get = createMethodDecorator("GET");
const Post = createMethodDecorator("POST");
const Put = createMethodDecorator("PUT");
const Delete = createMethodDecorator("DELETE");

// Parameter decorators
function createParamDecorator(type: ParamMetadata["type"]) {
  return function (name?: string) {
    return function (target: any, propertyKey: string, index: number) {
      const params: ParamMetadata[] =
        Reflect.getMetadata(PARAM_METADATA, target, propertyKey) || [];
      params.push({ type, name, index });
      Reflect.defineMetadata(PARAM_METADATA, params, target, propertyKey);
    };
  };
}

const Param = createParamDecorator("param");
const Query = createParamDecorator("query");
const Body = createParamDecorator("body");
const Headers = createParamDecorator("headers");

// Simple router to demonstrate the concept
class Router {
  private routes: Array<{
    method: HttpMethod;
    path: string;
    handler: Function;
    controller: any;
  }> = [];

  registerController(controllerClass: new () => any) {
    const controller = new controllerClass();
    const basePath = Reflect.getMetadata(CONTROLLER_METADATA, controllerClass) || "";
    const routes: RouteMetadata[] =
      Reflect.getMetadata(ROUTE_METADATA, controllerClass) || [];

    for (const route of routes) {
      const fullPath = `${basePath}/${route.path}`.replace(/\/+/g, "/");
      this.routes.push({
        method: route.method,
        path: fullPath,
        handler: controller[route.handlerName].bind(controller),
        controller
      });
      console.log(`Registered route: ${route.method} ${fullPath}`);
    }
  }

  // Simulate handling a request
  handle(method: HttpMethod, path: string, context: any) {
    const route = this.routes.find(r => r.method === method && this.matchPath(r.path, path));

    if (!route) {
      return { status: 404, body: "Not found" };
    }

    const params = Reflect.getMetadata(PARAM_METADATA, route.controller, route.handler.name) || [];
    const args: any[] = [];

    for (const param of params) {
      switch (param.type) {
        case "param":
          args[param.index] = this.extractPathParam(route.path, path, param.name);
          break;
        case "query":
          args[param.index] = context.query?.[param.name!];
          break;
        case "body":
          args[param.index] = context.body;
          break;
        case "headers":
          args[param.index] = context.headers?.[param.name!.toLowerCase()];
          break;
      }
    }

    return { status: 200, body: route.handler(...args) };
  }

  private matchPath(routePath: string, requestPath: string): boolean {
    const routeParts = routePath.split("/");
    const requestParts = requestPath.split("/");

    if (routeParts.length !== requestParts.length) return false;

    return routeParts.every((part, i) =>
      part.startsWith(":") || part === requestParts[i]
    );
  }

  private extractPathParam(routePath: string, requestPath: string, paramName?: string): string {
    const routeParts = routePath.split("/");
    const requestParts = requestPath.split("/");

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i] === `:${paramName}`) {
        return requestParts[i];
      }
    }
    return "";
  }
}

// Usage
@Controller("/api/users")
class UserController {
  @Get()
  findAll(@Query("limit") limit: string) {
    return { users: [], limit };
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return { id, name: "John" };
  }

  @Post()
  create(@Body() body: any) {
    return { created: true, ...body };
  }
}

const router = new Router();
router.registerController(UserController);

console.log(router.handle("GET", "/api/users", { query: { limit: "10" } }));
console.log(router.handle("GET", "/api/users/123", {}));
console.log(router.handle("POST", "/api/users", { body: { name: "Jane" } }));
```

## Real-World Usage: TypeORM

TypeORM uses decorators to define database entities, columns, and relationships.

### Entity and Column Decorators

```typescript
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255, select: false })
  password!: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Post, post => post.author)
  posts!: Post[];
}

@Entity("posts")
export class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "boolean", default: false })
  published!: boolean;

  @ManyToOne(() => User, user => user.posts)
  @JoinColumn({ name: "author_id" })
  author!: User;

  @CreateDateColumn()
  createdAt!: Date;
}
```

### Implementing TypeORM-like Decorators

```typescript
import "reflect-metadata";

const ENTITY_METADATA = Symbol("entity");
const COLUMN_METADATA = Symbol("column");
const PRIMARY_COLUMN_METADATA = Symbol("primaryColumn");
const RELATION_METADATA = Symbol("relation");

interface ColumnOptions {
  type?: string;
  length?: number;
  nullable?: boolean;
  unique?: boolean;
  default?: any;
}

interface ColumnMetadata extends ColumnOptions {
  propertyKey: string;
}

interface RelationMetadata {
  type: "OneToMany" | "ManyToOne" | "OneToOne" | "ManyToMany";
  target: () => Function;
  inverseSide?: string;
  propertyKey: string;
}

function Entity(tableName?: string) {
  return function (target: Function) {
    Reflect.defineMetadata(ENTITY_METADATA, tableName || target.name.toLowerCase(), target);
  };
}

function Column(options: ColumnOptions = {}) {
  return function (target: any, propertyKey: string) {
    const columns: ColumnMetadata[] =
      Reflect.getMetadata(COLUMN_METADATA, target.constructor) || [];
    columns.push({ ...options, propertyKey });
    Reflect.defineMetadata(COLUMN_METADATA, columns, target.constructor);
  };
}

function PrimaryGeneratedColumn(type: "increment" | "uuid" = "increment") {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(PRIMARY_COLUMN_METADATA, { propertyKey, type }, target.constructor);
  };
}

function OneToMany(target: () => Function, inverseSide: (obj: any) => any) {
  return function (targetProto: any, propertyKey: string) {
    const relations: RelationMetadata[] =
      Reflect.getMetadata(RELATION_METADATA, targetProto.constructor) || [];
    relations.push({
      type: "OneToMany",
      target,
      inverseSide: inverseSide.toString().match(/\.(\w+)/)?.[1],
      propertyKey
    });
    Reflect.defineMetadata(RELATION_METADATA, relations, targetProto.constructor);
  };
}

function ManyToOne(target: () => Function, inverseSide: (obj: any) => any) {
  return function (targetProto: any, propertyKey: string) {
    const relations: RelationMetadata[] =
      Reflect.getMetadata(RELATION_METADATA, targetProto.constructor) || [];
    relations.push({
      type: "ManyToOne",
      target,
      inverseSide: inverseSide.toString().match(/\.(\w+)/)?.[1],
      propertyKey
    });
    Reflect.defineMetadata(RELATION_METADATA, relations, targetProto.constructor);
  };
}

// Schema generator
class SchemaGenerator {
  generateSQL(entityClass: Function): string {
    const tableName = Reflect.getMetadata(ENTITY_METADATA, entityClass);
    const columns: ColumnMetadata[] = Reflect.getMetadata(COLUMN_METADATA, entityClass) || [];
    const primaryColumn = Reflect.getMetadata(PRIMARY_COLUMN_METADATA, entityClass);
    const relations: RelationMetadata[] = Reflect.getMetadata(RELATION_METADATA, entityClass) || [];

    let sql = `CREATE TABLE ${tableName} (\n`;
    const columnDefs: string[] = [];

    // Primary column
    if (primaryColumn) {
      const type = primaryColumn.type === "uuid" ? "UUID" : "SERIAL";
      columnDefs.push(`  ${primaryColumn.propertyKey} ${type} PRIMARY KEY`);
    }

    // Regular columns
    for (const col of columns) {
      let def = `  ${col.propertyKey}`;
      def += ` ${this.mapType(col.type, col.length)}`;
      if (!col.nullable) def += " NOT NULL";
      if (col.unique) def += " UNIQUE";
      if (col.default !== undefined) def += ` DEFAULT ${this.formatDefault(col.default)}`;
      columnDefs.push(def);
    }

    // Foreign keys from ManyToOne relations
    for (const rel of relations) {
      if (rel.type === "ManyToOne") {
        const targetTable = Reflect.getMetadata(ENTITY_METADATA, rel.target());
        columnDefs.push(`  ${rel.propertyKey}_id INTEGER REFERENCES ${targetTable}(id)`);
      }
    }

    sql += columnDefs.join(",\n");
    sql += "\n);";

    return sql;
  }

  private mapType(type?: string, length?: number): string {
    switch (type) {
      case "varchar": return `VARCHAR(${length || 255})`;
      case "text": return "TEXT";
      case "boolean": return "BOOLEAN";
      case "int": return "INTEGER";
      default: return "VARCHAR(255)";
    }
  }

  private formatDefault(value: any): string {
    if (typeof value === "boolean") return value.toString().toUpperCase();
    if (typeof value === "string") return `'${value}'`;
    return String(value);
  }
}

// Usage
@Entity("users")
class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @OneToMany(() => Post, post => post.author)
  posts!: Post[];
}

@Entity("posts")
class Post {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @ManyToOne(() => User, user => user.posts)
  author!: User;
}

const generator = new SchemaGenerator();
console.log(generator.generateSQL(User));
console.log("\n");
console.log(generator.generateSQL(Post));
```

## Accessor Decorators

Accessor decorators are applied to getters and setters of a property.

```typescript
function configurable(value: boolean) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.configurable = value;
  };
}

function lazy<T>(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const getter = descriptor.get;
  if (!getter) {
    throw new Error("lazy decorator can only be applied to getters");
  }

  const cacheKey = Symbol(`__lazy_${propertyKey}__`);

  descriptor.get = function () {
    if (!(cacheKey in this)) {
      (this as any)[cacheKey] = getter.call(this);
    }
    return (this as any)[cacheKey];
  };

  return descriptor;
}

class ExpensiveResource {
  @lazy
  get data(): string[] {
    console.log("Computing expensive data...");
    // Simulate expensive computation
    return Array.from({ length: 1000 }, (_, i) => `item_${i}`);
  }

  @configurable(false)
  get name() {
    return "Resource";
  }
}

const resource = new ExpensiveResource();
console.log(resource.data.length); // Computing expensive data... 1000
console.log(resource.data.length); // 1000 (cached, no recomputation)
```

## Best Practices and Patterns

### Keep Decorators Focused

Each decorator should have a single responsibility:

```typescript
// Good: Focused decorators
@Controller("/api/users")
@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
class UsersController {}

// Avoid: Decorator doing too many things
@ControllerWithAuthAndLogging("/api/users")  // Too many responsibilities
class UsersController {}
```

### Use Decorator Composition

Create composed decorators for common combinations:

```typescript
// Create a composed decorator for common patterns
function AuthenticatedEndpoint() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    UseGuards(AuthGuard)(target, propertyKey, descriptor);
    UseInterceptors(LoggingInterceptor)(target, propertyKey, descriptor);
    CacheResult(60)(target, propertyKey, descriptor);
  };
}

class ApiController {
  @AuthenticatedEndpoint()
  @Get("/data")
  getData() {
    return { data: [] };
  }
}
```

### Document Decorator Behavior

```typescript
/**
 * Caches the result of a method for a specified duration.
 *
 * @param ttl - Time to live in seconds. Default is 300 (5 minutes).
 * @param keyGenerator - Optional function to generate cache key from arguments.
 *
 * @example
 * ```typescript
 * class UserService {
 *   @CacheResult(60)
 *   async getUser(id: string) {
 *     return await db.users.find(id);
 *   }
 *
 *   @CacheResult(300, (query) => `search:${query}`)
 *   async searchUsers(query: string) {
 *     return await db.users.search(query);
 *   }
 * }
 * ```
 */
function CacheResult(ttl: number = 300, keyGenerator?: (...args: any[]) => string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Implementation
  };
}
```

### Handle Errors Gracefully

```typescript
function safeDecorator(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    try {
      const result = originalMethod.apply(this, args);

      if (result instanceof Promise) {
        return result.catch((error: Error) => {
          console.error(`Error in ${propertyKey}:`, error);
          throw error;
        });
      }

      return result;
    } catch (error) {
      console.error(`Error in ${propertyKey}:`, error);
      throw error;
    }
  };

  return descriptor;
}
```

### Testing Decorated Classes

```typescript
// Separate business logic from decoration for easier testing
class UserServiceCore {
  async getUser(id: string) {
    return { id, name: "John" };
  }
}

// Apply decorators in the actual implementation
@Injectable()
class UserService extends UserServiceCore {
  @CacheResult(60)
  @Log()
  async getUser(id: string) {
    return super.getUser(id);
  }
}

// Test the core logic without decorators
describe("UserServiceCore", () => {
  it("should return user by id", async () => {
    const service = new UserServiceCore();
    const user = await service.getUser("123");
    expect(user.id).toBe("123");
  });
});
```

## Interview Key Points

### Common Interview Questions

**1. What are decorators and what are the different types?**

Decorators are special declarations that can modify classes, methods, properties, accessors, and parameters. The five types are:
- Class decorators: Applied to class constructors
- Method decorators: Applied to method property descriptors
- Property decorators: Applied to property definitions
- Accessor decorators: Applied to getter/setter descriptors
- Parameter decorators: Applied to method parameters

**2. What is the evaluation order of decorators?**

- Decorators are evaluated from top to bottom (factory functions)
- Decorators are applied from bottom to top (decorator functions)
- For class members: instance members first, then static members, then constructor parameters, then class

**3. How does metadata reflection work?**

TypeScript can emit design-time type information using `emitDecoratorMetadata`. The reflect-metadata polyfill provides:
- `design:type`: Property types
- `design:paramtypes`: Method parameter types
- `design:returntype`: Method return types

**4. What are the limitations of decorators?**

- They cannot be used on function declarations (only class methods)
- Property decorators cannot access the initial value
- Parameter decorators can only add metadata, not modify parameters
- Decorators are experimental and syntax may change

**5. When should you use decorators vs. other patterns?**

Use decorators for:
- Cross-cutting concerns (logging, caching, validation)
- Metadata-driven frameworks (DI, ORM)
- Declarative configuration

Use alternatives for:
- Simple one-off modifications (use higher-order functions)
- Runtime-configurable behavior (use composition)
- Performance-critical code (decorators add overhead)

## Further Reading

### Official Resources

- [TypeScript Handbook - Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [TC39 Decorators Proposal](https://github.com/tc39/proposal-decorators)
- [reflect-metadata](https://github.com/rbuckton/reflect-metadata)

### Framework Documentation

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Angular Decorators](https://angular.io/guide/glossary#decorator)
- [MobX Decorators](https://mobx.js.org/enabling-decorators.html)

### Advanced Topics

- [class-validator](https://github.com/typestack/class-validator) - Validation decorators
- [class-transformer](https://github.com/typestack/class-transformer) - Serialization decorators
- [routing-controllers](https://github.com/typestack/routing-controllers) - Controller decorators for Express/Koa

---

Decorators are a powerful metaprogramming feature that enables clean, declarative code. While they are still experimental in TypeScript, they are widely used in major frameworks like NestJS, Angular, and TypeORM. Understanding decorators and their patterns will help you build more maintainable applications and better understand how modern TypeScript frameworks work under the hood. Remember to use decorators judiciously - they add abstraction that can make debugging harder if overused.
