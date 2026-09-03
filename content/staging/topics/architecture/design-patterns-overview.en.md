---
title: Design Patterns Complete Guide
description: Master GoF design patterns for robust software architecture
track: architecture
section: design-patterns
difficulty: intermediate
tags:
  - Design Patterns
  - GoF
  - OOP
  - Architecture
status: imported
origin: old/src/content/docs/architecture/design-patterns-overview.en.md
divergence: 0.221
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Architecture
  subcategory: Patterns
  order: 2
  lastUpdated: 2026-01-07
---

## What Are Design Patterns?

Design patterns are proven, reusable solutions to common problems that occur in software design. They are not finished code that can be copied and pasted directly into your project, but rather templates or blueprints that describe how to solve particular design challenges in various contexts.

The concept of design patterns originated from architect Christopher Alexander's book "A Pattern Language," which was later adapted for software engineering. In 1994, Erich Gamma, Richard Helm, Ralph Johnson, and John Vlissides (collectively known as the "Gang of Four" or GoF) published "Design Patterns: Elements of Reusable Object-Oriented Software," which systematically documented 23 classic design patterns and established the foundation for modern software design patterns.

### Why Learn Design Patterns?

1. **Improved Code Quality**: Design patterns provide battle-tested solutions that help you write more robust and maintainable code
2. **Enhanced Communication**: Patterns provide a common vocabulary, enabling team members to communicate design ideas more efficiently
3. **Accelerated Development**: Instead of reinventing the wheel, you can apply mature patterns directly
4. **Adaptability to Change**: Well-applied patterns make code easier to modify when requirements change
5. **Interview Preparation**: Design patterns are frequently tested topics in technical interviews

### The Six Principles of Object-Oriented Design

Before diving into specific patterns, it's essential to understand the six fundamental principles of object-oriented design (SOLID + Law of Demeter):

1. **Single Responsibility Principle (SRP)**: A class should have only one reason to change
2. **Open/Closed Principle (OCP)**: Software entities should be open for extension but closed for modification
3. **Liskov Substitution Principle (LSP)**: Subtypes must be substitutable for their base types
4. **Interface Segregation Principle (ISP)**: Clients should not be forced to depend on interfaces they do not use
5. **Dependency Inversion Principle (DIP)**: High-level modules should not depend on low-level modules; both should depend on abstractions
6. **Law of Demeter (LoD)**: An object should have limited knowledge about other objects

---

## Pattern Classification

The GoF categorized the 23 design patterns into three main categories:

### Creational Patterns

Creational patterns deal with object creation mechanisms, trying to create objects in a manner suitable for the situation. This category includes 5 patterns:

| Pattern Name | Core Concept |
|-------------|--------------|
| Singleton | Ensures a class has only one instance |
| Factory Method | Defines an interface for creating objects, letting subclasses decide which class to instantiate |
| Abstract Factory | Creates families of related objects without specifying concrete classes |
| Builder | Separates the construction of complex objects from their representation |
| Prototype | Creates new objects by copying existing ones |

### Structural Patterns

Structural patterns deal with class and object composition to form larger structures. This category includes 7 patterns:

| Pattern Name | Core Concept |
|-------------|--------------|
| Adapter | Converts one interface to another that clients expect |
| Bridge | Separates abstraction from implementation |
| Composite | Composes objects into tree structures, treating individual objects and compositions uniformly |
| Decorator | Dynamically adds responsibilities to objects |
| Facade | Provides a unified high-level interface |
| Flyweight | Uses sharing to support large numbers of fine-grained objects efficiently |
| Proxy | Provides a surrogate to control access to an object |

### Behavioral Patterns

Behavioral patterns deal with communication between objects and responsibility distribution. This category includes 11 patterns:

| Pattern Name | Core Concept |
|-------------|--------------|
| Chain of Responsibility | Passes requests along a chain of handlers |
| Command | Encapsulates requests as objects |
| Interpreter | Defines a grammar and an interpreter for a language |
| Iterator | Sequentially accesses elements of an aggregate |
| Mediator | Defines an object that encapsulates how objects interact |
| Memento | Captures and restores an object's internal state without violating encapsulation |
| Observer | Defines a one-to-many dependency between objects |
| State | Allows an object to alter its behavior when its internal state changes |
| Strategy | Defines a family of interchangeable algorithms |
| Template Method | Defines the skeleton of an algorithm, deferring some steps to subclasses |
| Visitor | Defines new operations without changing element classes |

---

## Creational Patterns in Detail

### Singleton Pattern

#### Concept and Intent

The Singleton pattern ensures a class has only one instance and provides a global point of access to it. This is useful when exactly one object is needed to coordinate actions across a system.

#### When to Use

- Objects that are expensive to create (e.g., database connection pools)
- Resources that should be shared across the application (e.g., configuration managers)
- Objects that manage shared state (e.g., logging services, caches)
- When you need strict control over global variables

#### TypeScript Implementation

```typescript
// Basic Singleton Pattern
class Singleton {
  private static instance: Singleton;

  // Private constructor prevents external instantiation
  private constructor() {}

  public static getInstance(): Singleton {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }

  public someBusinessLogic(): void {
    console.log('Executing business logic');
  }
}

// Usage
const s1 = Singleton.getInstance();
const s2 = Singleton.getInstance();
console.log(s1 === s2); // true

// Thread-safe Singleton (eager initialization)
class EagerSingleton {
  private static readonly instance: EagerSingleton = new EagerSingleton();

  private constructor() {}

  public static getInstance(): EagerSingleton {
    return EagerSingleton.instance;
  }
}

// Generic Singleton Factory
function createSingleton<T>(creator: () => T): () => T {
  let instance: T | null = null;
  return () => {
    if (instance === null) {
      instance = creator();
    }
    return instance;
  };
}

// Using the generic singleton factory
const getLogger = createSingleton(() => ({
  log: (message: string) => console.log(`[LOG] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`)
}));

const logger1 = getLogger();
const logger2 = getLogger();
console.log(logger1 === logger2); // true
```

#### Real-World Example: Application Configuration

```typescript
interface AppConfig {
  apiUrl: string;
  apiKey: string;
  environment: 'development' | 'staging' | 'production';
  features: Record<string, boolean>;
}

class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: AppConfig | null = null;

  private constructor() {}

  public static getInstance(): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      ConfigurationManager.instance = new ConfigurationManager();
    }
    return ConfigurationManager.instance;
  }

  public async loadConfig(): Promise<void> {
    // In real application, this would load from environment or config file
    this.config = {
      apiUrl: process.env.API_URL || 'https://api.example.com',
      apiKey: process.env.API_KEY || '',
      environment: (process.env.NODE_ENV as AppConfig['environment']) || 'development',
      features: {
        darkMode: true,
        betaFeatures: false,
      }
    };
  }

  public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config[key];
  }

  public isFeatureEnabled(feature: string): boolean {
    return this.config?.features[feature] ?? false;
  }
}

// Usage
const config = ConfigurationManager.getInstance();
await config.loadConfig();
console.log(config.get('apiUrl'));
console.log(config.isFeatureEnabled('darkMode'));
```

---

### Factory Pattern

#### Concept and Intent

The Factory pattern is a creational design pattern that provides a way to create objects without specifying the exact class of the object to be created. There are three main variants: Simple Factory, Factory Method, and Abstract Factory.

#### When to Use

- When you don't know beforehand the exact types of objects you need to create
- When you want to provide a way for users to extend your library's internal components
- When you want to reuse existing objects instead of creating new ones each time

#### TypeScript Implementation

```typescript
// Product Interface
interface Button {
  render(): void;
  onClick(handler: () => void): void;
}

// Concrete Products
class WindowsButton implements Button {
  render(): void {
    console.log('Rendering Windows-style button');
  }

  onClick(handler: () => void): void {
    console.log('Binding Windows button click event');
    handler();
  }
}

class MacButton implements Button {
  render(): void {
    console.log('Rendering Mac-style button');
  }

  onClick(handler: () => void): void {
    console.log('Binding Mac button click event');
    handler();
  }
}

// Simple Factory
class ButtonFactory {
  static createButton(os: 'windows' | 'mac'): Button {
    switch (os) {
      case 'windows':
        return new WindowsButton();
      case 'mac':
        return new MacButton();
      default:
        throw new Error(`Unsupported OS: ${os}`);
    }
  }
}

// Factory Method Pattern
abstract class Dialog {
  abstract createButton(): Button;

  render(): void {
    const button = this.createButton();
    button.render();
    button.onClick(() => console.log('Button clicked!'));
  }
}

class WindowsDialog extends Dialog {
  createButton(): Button {
    return new WindowsButton();
  }
}

class MacDialog extends Dialog {
  createButton(): Button {
    return new MacButton();
  }
}

// Abstract Factory Pattern
interface GUIFactory {
  createButton(): Button;
  createCheckbox(): Checkbox;
}

interface Checkbox {
  render(): void;
  toggle(): void;
}

class WindowsCheckbox implements Checkbox {
  render(): void {
    console.log('Rendering Windows checkbox');
  }
  toggle(): void {
    console.log('Toggling Windows checkbox');
  }
}

class MacCheckbox implements Checkbox {
  render(): void {
    console.log('Rendering Mac checkbox');
  }
  toggle(): void {
    console.log('Toggling Mac checkbox');
  }
}

class WindowsFactory implements GUIFactory {
  createButton(): Button {
    return new WindowsButton();
  }
  createCheckbox(): Checkbox {
    return new WindowsCheckbox();
  }
}

class MacFactory implements GUIFactory {
  createButton(): Button {
    return new MacButton();
  }
  createCheckbox(): Checkbox {
    return new MacCheckbox();
  }
}

// Client code
function createUI(factory: GUIFactory): void {
  const button = factory.createButton();
  const checkbox = factory.createCheckbox();
  button.render();
  checkbox.render();
}

// Usage
const os = 'windows';
const factory = os === 'windows' ? new WindowsFactory() : new MacFactory();
createUI(factory);
```

---

### Builder Pattern

#### Concept and Intent

The Builder pattern separates the construction of a complex object from its representation, allowing the same construction process to create different representations. It's particularly useful when creating objects with many optional parameters.

#### When to Use

- When constructing complex objects with many optional components
- When you want to create different representations of the same object
- When you need immutable objects with many properties

#### TypeScript Implementation

```typescript
// Product
interface HttpRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timeout: number;
  retries: number;
}

// Builder
class HttpRequestBuilder {
  private request: Partial<HttpRequest> = {
    method: 'GET',
    headers: {},
    timeout: 30000,
    retries: 0
  };

  setUrl(url: string): this {
    this.request.url = url;
    return this;
  }

  setMethod(method: string): this {
    this.request.method = method;
    return this;
  }

  addHeader(key: string, value: string): this {
    this.request.headers![key] = value;
    return this;
  }

  setBody(body: object | string): this {
    this.request.body = typeof body === 'string' ? body : JSON.stringify(body);
    if (typeof body === 'object') {
      this.addHeader('Content-Type', 'application/json');
    }
    return this;
  }

  setTimeout(timeout: number): this {
    this.request.timeout = timeout;
    return this;
  }

  setRetries(retries: number): this {
    this.request.retries = retries;
    return this;
  }

  build(): HttpRequest {
    if (!this.request.url) {
      throw new Error('URL is required');
    }
    return this.request as HttpRequest;
  }
}

// Usage
const request = new HttpRequestBuilder()
  .setUrl('https://api.example.com/users')
  .setMethod('POST')
  .addHeader('Authorization', 'Bearer token123')
  .setBody({ name: 'John', email: 'john@example.com' })
  .setTimeout(5000)
  .setRetries(3)
  .build();

// SQL Query Builder Example
class QueryBuilder {
  private query: string[] = [];
  private params: any[] = [];

  select(...fields: string[]): this {
    this.query.push(`SELECT ${fields.length ? fields.join(', ') : '*'}`);
    return this;
  }

  from(table: string): this {
    this.query.push(`FROM ${table}`);
    return this;
  }

  where(condition: string, ...values: any[]): this {
    const clause = this.query.some(q => q.includes('WHERE')) ? 'AND' : 'WHERE';
    this.query.push(`${clause} ${condition}`);
    this.params.push(...values);
    return this;
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.query.push(`ORDER BY ${field} ${direction}`);
    return this;
  }

  limit(count: number): this {
    this.query.push(`LIMIT ${count}`);
    return this;
  }

  build(): { sql: string; params: any[] } {
    return {
      sql: this.query.join(' '),
      params: this.params
    };
  }
}

// Usage
const { sql, params } = new QueryBuilder()
  .select('id', 'name', 'email')
  .from('users')
  .where('age > ?', 18)
  .where('status = ?', 'active')
  .orderBy('created_at', 'DESC')
  .limit(10)
  .build();

console.log(sql);
// SELECT id, name, email FROM users WHERE age > ? AND status = ? ORDER BY created_at DESC LIMIT 10
```

---

## Structural Patterns in Detail

### Adapter Pattern

#### Concept and Intent

The Adapter pattern converts the interface of a class into another interface that clients expect. It allows classes with incompatible interfaces to work together, acting as a bridge between old and new code.

#### When to Use

- When you want to use an existing class but its interface doesn't match what you need
- When you need to integrate third-party libraries with different interfaces
- When you're working with legacy code that needs to work with new systems

#### TypeScript Implementation

```typescript
// Target interface (what the client expects)
interface PaymentProcessor {
  processPayment(amount: number, currency: string): Promise<PaymentResult>;
  refund(transactionId: string, amount: number): Promise<RefundResult>;
}

interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
}

interface RefundResult {
  success: boolean;
  refundId: string;
}

// Adaptee (legacy payment system with incompatible interface)
class LegacyPaymentGateway {
  makePayment(amountInCents: number, curr: string, callback: (err: Error | null, result: any) => void): void {
    // Legacy callback-based API
    setTimeout(() => {
      callback(null, {
        status: 'OK',
        ref: 'TXN' + Date.now(),
        msg: 'Payment processed'
      });
    }, 100);
  }

  cancelPayment(ref: string, cents: number, callback: (err: Error | null, result: any) => void): void {
    setTimeout(() => {
      callback(null, { status: 'REFUNDED', refId: 'REF' + Date.now() });
    }, 100);
  }
}

// Adapter
class LegacyPaymentAdapter implements PaymentProcessor {
  private legacyGateway: LegacyPaymentGateway;

  constructor(legacyGateway: LegacyPaymentGateway) {
    this.legacyGateway = legacyGateway;
  }

  processPayment(amount: number, currency: string): Promise<PaymentResult> {
    return new Promise((resolve, reject) => {
      const amountInCents = Math.round(amount * 100);

      this.legacyGateway.makePayment(amountInCents, currency, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          success: result.status === 'OK',
          transactionId: result.ref,
          message: result.msg
        });
      });
    });
  }

  refund(transactionId: string, amount: number): Promise<RefundResult> {
    return new Promise((resolve, reject) => {
      const amountInCents = Math.round(amount * 100);

      this.legacyGateway.cancelPayment(transactionId, amountInCents, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          success: result.status === 'REFUNDED',
          refundId: result.refId
        });
      });
    });
  }
}

// Usage - client code works with the modern interface
async function processOrder(processor: PaymentProcessor, orderTotal: number) {
  const result = await processor.processPayment(orderTotal, 'USD');
  console.log(`Payment ${result.success ? 'succeeded' : 'failed'}: ${result.message}`);
  return result;
}

// Using the adapter
const legacyGateway = new LegacyPaymentGateway();
const adapter = new LegacyPaymentAdapter(legacyGateway);
processOrder(adapter, 99.99);
```

---

### Decorator Pattern

#### Concept and Intent

The Decorator pattern allows you to attach new behaviors to objects dynamically by wrapping them in objects that contain these behaviors. It provides a flexible alternative to subclassing for extending functionality.

#### When to Use

- When you need to add responsibilities to objects dynamically without affecting other objects
- When extension by subclassing is impractical or impossible
- When you want to combine multiple behaviors flexibly

#### TypeScript Implementation

```typescript
// Component Interface
interface DataSource {
  writeData(data: string): void;
  readData(): string;
}

// Concrete Component
class FileDataSource implements DataSource {
  private filename: string;
  private data: string = '';

  constructor(filename: string) {
    this.filename = filename;
  }

  writeData(data: string): void {
    console.log(`Writing to file ${this.filename}`);
    this.data = data;
  }

  readData(): string {
    console.log(`Reading from file ${this.filename}`);
    return this.data;
  }
}

// Base Decorator
abstract class DataSourceDecorator implements DataSource {
  protected wrappee: DataSource;

  constructor(source: DataSource) {
    this.wrappee = source;
  }

  writeData(data: string): void {
    this.wrappee.writeData(data);
  }

  readData(): string {
    return this.wrappee.readData();
  }
}

// Concrete Decorator: Encryption
class EncryptionDecorator extends DataSourceDecorator {
  writeData(data: string): void {
    const encrypted = this.encrypt(data);
    console.log('Encrypting data...');
    super.writeData(encrypted);
  }

  readData(): string {
    const data = super.readData();
    console.log('Decrypting data...');
    return this.decrypt(data);
  }

  private encrypt(data: string): string {
    // Simple Base64 encoding for demonstration
    return Buffer.from(data).toString('base64');
  }

  private decrypt(data: string): string {
    return Buffer.from(data, 'base64').toString('utf8');
  }
}

// Concrete Decorator: Compression
class CompressionDecorator extends DataSourceDecorator {
  writeData(data: string): void {
    const compressed = this.compress(data);
    console.log(`Compressing data (${data.length} -> ${compressed.length} chars)...`);
    super.writeData(compressed);
  }

  readData(): string {
    const data = super.readData();
    console.log('Decompressing data...');
    return this.decompress(data);
  }

  private compress(data: string): string {
    // Simplified compression simulation
    return `COMPRESSED:${data}`;
  }

  private decompress(data: string): string {
    return data.replace('COMPRESSED:', '');
  }
}

// Concrete Decorator: Logging
class LoggingDecorator extends DataSourceDecorator {
  writeData(data: string): void {
    console.log(`[LOG] Writing ${data.length} characters at ${new Date().toISOString()}`);
    super.writeData(data);
  }

  readData(): string {
    console.log(`[LOG] Reading data at ${new Date().toISOString()}`);
    return super.readData();
  }
}

// Usage - decorators can be stacked
let source: DataSource = new FileDataSource('data.txt');
source = new LoggingDecorator(source);
source = new CompressionDecorator(source);
source = new EncryptionDecorator(source);

source.writeData('Sensitive data that needs protection');
console.log('---');
const result = source.readData();
console.log('Final result:', result);

// Function Decorators (Modern Approach)
type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>;

// Retry Decorator
function withRetry<T extends any[], R>(
  fn: AsyncFunction<T, R>,
  maxRetries: number = 3,
  delay: number = 1000
): AsyncFunction<T, R> {
  return async (...args: T): Promise<R> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;
        console.log(`Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  };
}

// Timeout Decorator
function withTimeout<T extends any[], R>(
  fn: AsyncFunction<T, R>,
  timeout: number
): AsyncFunction<T, R> {
  return async (...args: T): Promise<R> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out (${timeout}ms)`)), timeout);
    });

    return Promise.race([fn(...args), timeoutPromise]);
  };
}

// Cache Decorator
function withCache<T extends any[], R>(
  fn: AsyncFunction<T, R>,
  ttl: number = 60000
): AsyncFunction<T, R> {
  const cache = new Map<string, { value: R; expiry: number }>();

  return async (...args: T): Promise<R> => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && cached.expiry > now) {
      console.log('Returning cached data');
      return cached.value;
    }

    const result = await fn(...args);
    cache.set(key, { value: result, expiry: now + ttl });
    return result;
  };
}

// Composing decorators
async function fetchUserData(userId: string): Promise<{ id: string; name: string }> {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
}

const enhancedFetch = withCache(
  withTimeout(
    withRetry(fetchUserData, 3, 1000),
    5000
  ),
  60000
);
```

---

### Proxy Pattern

#### Concept and Intent

The Proxy pattern provides a surrogate or placeholder for another object to control access to it. It acts as an intermediary that can add additional behavior like lazy initialization, access control, logging, or caching.

#### When to Use

- When you need lazy initialization of a heavyweight object
- When you need access control to the original object
- When you need to log requests to the service object
- When you need to cache results of operations

#### TypeScript Implementation

```typescript
// Subject Interface
interface ImageLoader {
  display(): void;
  getInfo(): { width: number; height: number; size: number };
}

// Real Subject
class HighResolutionImage implements ImageLoader {
  private filename: string;
  private imageData: Buffer | null = null;
  private width: number = 0;
  private height: number = 0;

  constructor(filename: string) {
    this.filename = filename;
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    console.log(`Loading high-resolution image: ${this.filename}`);
    // Simulate expensive loading operation
    this.imageData = Buffer.from('fake image data');
    this.width = 4000;
    this.height = 3000;
    console.log('Image loaded successfully');
  }

  display(): void {
    console.log(`Displaying image: ${this.filename} (${this.width}x${this.height})`);
  }

  getInfo(): { width: number; height: number; size: number } {
    return {
      width: this.width,
      height: this.height,
      size: this.imageData?.length || 0
    };
  }
}

// Virtual Proxy (Lazy Loading)
class ImageProxy implements ImageLoader {
  private filename: string;
  private realImage: HighResolutionImage | null = null;

  constructor(filename: string) {
    this.filename = filename;
  }

  private loadImage(): HighResolutionImage {
    if (!this.realImage) {
      this.realImage = new HighResolutionImage(this.filename);
    }
    return this.realImage;
  }

  display(): void {
    this.loadImage().display();
  }

  getInfo(): { width: number; height: number; size: number } {
    return this.loadImage().getInfo();
  }
}

// Protection Proxy (Access Control)
interface UserService {
  getUser(id: string): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthContext {
  userId: string;
  role: 'admin' | 'user';
}

class RealUserService implements UserService {
  private users: Map<string, User> = new Map();

  async getUser(id: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }
}

class UserServiceProxy implements UserService {
  private realService: UserService;
  private authContext: AuthContext;

  constructor(realService: UserService, authContext: AuthContext) {
    this.realService = realService;
    this.authContext = authContext;
  }

  async getUser(id: string): Promise<User> {
    // Users can only view their own profile unless admin
    if (this.authContext.role !== 'admin' && this.authContext.userId !== id) {
      throw new Error('Access denied: Cannot view other users');
    }
    return this.realService.getUser(id);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    // Users can only update their own profile
    if (this.authContext.role !== 'admin' && this.authContext.userId !== id) {
      throw new Error('Access denied: Cannot update other users');
    }
    // Non-admins cannot change roles
    if (this.authContext.role !== 'admin' && data.role) {
      throw new Error('Access denied: Cannot change user role');
    }
    return this.realService.updateUser(id, data);
  }

  async deleteUser(id: string): Promise<void> {
    // Only admins can delete users
    if (this.authContext.role !== 'admin') {
      throw new Error('Access denied: Only admins can delete users');
    }
    return this.realService.deleteUser(id);
  }
}

// Caching Proxy
class CachingUserServiceProxy implements UserService {
  private realService: UserService;
  private cache: Map<string, { user: User; timestamp: number }> = new Map();
  private cacheTTL: number = 60000; // 1 minute

  constructor(realService: UserService) {
    this.realService = realService;
  }

  async getUser(id: string): Promise<User> {
    const cached = this.cache.get(id);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.cacheTTL) {
      console.log(`Cache hit for user ${id}`);
      return cached.user;
    }

    console.log(`Cache miss for user ${id}`);
    const user = await this.realService.getUser(id);
    this.cache.set(id, { user, timestamp: now });
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const user = await this.realService.updateUser(id, data);
    // Invalidate cache on update
    this.cache.delete(id);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await this.realService.deleteUser(id);
    this.cache.delete(id);
  }
}
```

---

## Behavioral Patterns in Detail

### Observer Pattern

#### Concept and Intent

The Observer pattern defines a one-to-many dependency between objects so that when one object (the subject) changes state, all its dependents (observers) are notified and updated automatically.

#### When to Use

- When changes to one object require changing others, and you don't know how many objects need to change
- When an object should notify other objects without making assumptions about what those objects are
- For implementing event handling systems
- For implementing publish-subscribe mechanisms

#### TypeScript Implementation

```typescript
// Observer Interface
interface Observer<T> {
  update(data: T): void;
}

// Subject Interface
interface Subject<T> {
  attach(observer: Observer<T>): void;
  detach(observer: Observer<T>): void;
  notify(data: T): void;
}

// Generic Observable Class
class Observable<T> implements Subject<T> {
  private observers: Set<Observer<T>> = new Set();

  attach(observer: Observer<T>): void {
    this.observers.add(observer);
    console.log('Observer attached');
  }

  detach(observer: Observer<T>): void {
    this.observers.delete(observer);
    console.log('Observer detached');
  }

  notify(data: T): void {
    console.log(`Notifying ${this.observers.size} observers`);
    this.observers.forEach(observer => observer.update(data));
  }
}

// Concrete Subject: Stock Price Tracker
interface StockPrice {
  symbol: string;
  price: number;
  change: number;
}

class StockTicker extends Observable<StockPrice> {
  private prices: Map<string, number> = new Map();

  updatePrice(symbol: string, newPrice: number): void {
    const oldPrice = this.prices.get(symbol) || newPrice;
    const change = ((newPrice - oldPrice) / oldPrice) * 100;

    this.prices.set(symbol, newPrice);

    this.notify({
      symbol,
      price: newPrice,
      change: parseFloat(change.toFixed(2))
    });
  }
}

// Concrete Observer: Price Display
class PriceDisplay implements Observer<StockPrice> {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  update(data: StockPrice): void {
    const direction = data.change >= 0 ? 'up' : 'down';
    console.log(
      `[${this.name}] ${data.symbol}: $${data.price} (${direction} ${Math.abs(data.change)}%)`
    );
  }
}

// Concrete Observer: Price Alert
class PriceAlert implements Observer<StockPrice> {
  private threshold: number;
  private symbol: string;

  constructor(symbol: string, threshold: number) {
    this.symbol = symbol;
    this.threshold = threshold;
  }

  update(data: StockPrice): void {
    if (data.symbol === this.symbol && Math.abs(data.change) > this.threshold) {
      console.log(`ALERT: ${data.symbol} price changed more than ${this.threshold}%!`);
    }
  }
}

// Usage
const stockTicker = new StockTicker();

const mobileDisplay = new PriceDisplay('Mobile');
const desktopDisplay = new PriceDisplay('Desktop');
const appleAlert = new PriceAlert('AAPL', 5);

stockTicker.attach(mobileDisplay);
stockTicker.attach(desktopDisplay);
stockTicker.attach(appleAlert);

stockTicker.updatePrice('AAPL', 150.00);
stockTicker.updatePrice('AAPL', 160.00); // Triggers alert

// Functional Event Emitter Implementation
type Listener<T> = (data: T) => void;
type Unsubscribe = () => void;

function createEventEmitter<T>() {
  const listeners = new Set<Listener<T>>();

  return {
    subscribe(listener: Listener<T>): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(data: T): void {
      listeners.forEach(listener => listener(data));
    },
    get listenerCount(): number {
      return listeners.size;
    }
  };
}

// Modern TypeScript Event System
type EventMap = {
  userLoggedIn: { userId: string; timestamp: Date };
  userLoggedOut: { userId: string };
  orderPlaced: { orderId: string; total: number };
};

class TypedEventEmitter<Events extends Record<string, any>> {
  private listeners = new Map<keyof Events, Set<(data: any) => void>>();

  on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): Unsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.listeners.get(event)?.forEach(listener => listener(data));
  }
}

// Usage with type safety
const events = new TypedEventEmitter<EventMap>();

events.on('userLoggedIn', (data) => {
  console.log(`User ${data.userId} logged in at ${data.timestamp}`);
});

events.emit('userLoggedIn', { userId: '123', timestamp: new Date() });
```

---

### Strategy Pattern

#### Concept and Intent

The Strategy pattern defines a family of algorithms, encapsulates each one, and makes them interchangeable. It lets the algorithm vary independently from clients that use it.

#### When to Use

- When you have many similar classes that differ only in their behavior
- When you need different variants of an algorithm
- When an algorithm uses data that shouldn't be exposed to clients
- When you need to switch algorithms at runtime

#### TypeScript Implementation

```typescript
// Strategy Interface
interface PaymentStrategy {
  pay(amount: number): Promise<PaymentResult>;
  validate(): boolean;
  getName(): string;
}

interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
}

// Concrete Strategy: Credit Card
class CreditCardPayment implements PaymentStrategy {
  private cardNumber: string;
  private cvv: string;
  private expiryDate: string;

  constructor(cardNumber: string, cvv: string, expiryDate: string) {
    this.cardNumber = cardNumber;
    this.cvv = cvv;
    this.expiryDate = expiryDate;
  }

  validate(): boolean {
    const cardRegex = /^\d{16}$/;
    const cvvRegex = /^\d{3,4}$/;
    return cardRegex.test(this.cardNumber) && cvvRegex.test(this.cvv);
  }

  async pay(amount: number): Promise<PaymentResult> {
    if (!this.validate()) {
      return { success: false, transactionId: '', message: 'Invalid card information' };
    }
    // Simulate payment processing
    console.log(`Processing credit card payment of $${amount}`);
    console.log(`Card: **** **** **** ${this.cardNumber.slice(-4)}`);

    return {
      success: true,
      transactionId: `CC-${Date.now()}`,
      message: 'Payment successful'
    };
  }

  getName(): string {
    return 'Credit Card';
  }
}

// Concrete Strategy: PayPal
class PayPalPayment implements PaymentStrategy {
  private email: string;

  constructor(email: string) {
    this.email = email;
  }

  validate(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  async pay(amount: number): Promise<PaymentResult> {
    if (!this.validate()) {
      return { success: false, transactionId: '', message: 'Invalid email' };
    }
    console.log(`Processing PayPal payment of $${amount}`);
    console.log(`Account: ${this.email}`);

    return {
      success: true,
      transactionId: `PP-${Date.now()}`,
      message: 'PayPal payment successful'
    };
  }

  getName(): string {
    return 'PayPal';
  }
}

// Concrete Strategy: Cryptocurrency
class CryptoPayment implements PaymentStrategy {
  private walletAddress: string;
  private currency: 'BTC' | 'ETH';

  constructor(walletAddress: string, currency: 'BTC' | 'ETH') {
    this.walletAddress = walletAddress;
    this.currency = currency;
  }

  validate(): boolean {
    return this.walletAddress.length >= 26;
  }

  async pay(amount: number): Promise<PaymentResult> {
    if (!this.validate()) {
      return { success: false, transactionId: '', message: 'Invalid wallet address' };
    }
    console.log(`Processing ${this.currency} payment of $${amount}`);
    console.log(`Wallet: ${this.walletAddress.slice(0, 10)}...`);

    return {
      success: true,
      transactionId: `CRYPTO-${Date.now()}`,
      message: `${this.currency} payment initiated`
    };
  }

  getName(): string {
    return `Cryptocurrency (${this.currency})`;
  }
}

// Context: Shopping Cart
class ShoppingCart {
  private items: Array<{ name: string; price: number; quantity: number }> = [];
  private paymentStrategy: PaymentStrategy | null = null;

  addItem(name: string, price: number, quantity: number = 1): void {
    this.items.push({ name, price, quantity });
    console.log(`Added: ${name} x ${quantity}`);
  }

  getTotal(): number {
    return this.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  setPaymentStrategy(strategy: PaymentStrategy): void {
    this.paymentStrategy = strategy;
    console.log(`Payment method set to: ${strategy.getName()}`);
  }

  async checkout(): Promise<PaymentResult> {
    if (!this.paymentStrategy) {
      throw new Error('Please select a payment method');
    }

    const total = this.getTotal();
    console.log(`\nOrder Total: $${total.toFixed(2)}`);
    console.log('-------------------');

    return this.paymentStrategy.pay(total);
  }
}

// Usage
const cart = new ShoppingCart();
cart.addItem('TypeScript Handbook', 29.99);
cart.addItem('Design Patterns Book', 49.99, 2);

// Use different strategies
cart.setPaymentStrategy(new CreditCardPayment('1234567890123456', '123', '12/25'));
await cart.checkout();

cart.setPaymentStrategy(new PayPalPayment('user@example.com'));
await cart.checkout();

// Functional Strategy Pattern for Validation
type ValidationRule<T> = (value: T) => string | null;

const required: ValidationRule<string> = (value) =>
  value.trim() ? null : 'This field is required';

const minLength = (min: number): ValidationRule<string> => (value) =>
  value.length >= min ? null : `Minimum ${min} characters required`;

const maxLength = (max: number): ValidationRule<string> => (value) =>
  value.length <= max ? null : `Maximum ${max} characters allowed`;

const email: ValidationRule<string> = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : 'Invalid email address';

const pattern = (regex: RegExp, message: string): ValidationRule<string> =>
  (value) => regex.test(value) ? null : message;

// Compose validation rules
function validate<T>(value: T, ...rules: ValidationRule<T>[]): string[] {
  return rules
    .map(rule => rule(value))
    .filter((error): error is string => error !== null);
}

// Usage
const passwordRules: ValidationRule<string>[] = [
  required,
  minLength(8),
  maxLength(20),
  pattern(/[A-Z]/, 'Must contain uppercase letter'),
  pattern(/[a-z]/, 'Must contain lowercase letter'),
  pattern(/[0-9]/, 'Must contain a number')
];

const errors = validate('abc123', ...passwordRules);
console.log(errors);
// ['Minimum 8 characters required', 'Must contain uppercase letter']
```

---

### Command Pattern

#### Concept and Intent

The Command pattern encapsulates a request as an object, thereby allowing you to parameterize clients with different requests, queue or log requests, and support undoable operations.

#### When to Use

- When you need to parameterize objects with operations
- When you need to queue operations, schedule their execution, or execute them remotely
- When you need to implement reversible operations (undo/redo)
- When you need to log changes that can be reapplied after a system crash

#### TypeScript Implementation

```typescript
// Command Interface
interface Command {
  execute(): void;
  undo(): void;
  getDescription(): string;
}

// Receiver: Text Editor
class TextEditor {
  private content: string = '';
  private cursorPosition: number = 0;

  getContent(): string {
    return this.content;
  }

  insertText(text: string, position: number): void {
    this.content =
      this.content.slice(0, position) +
      text +
      this.content.slice(position);
    this.cursorPosition = position + text.length;
  }

  deleteText(position: number, length: number): string {
    const deleted = this.content.slice(position, position + length);
    this.content =
      this.content.slice(0, position) +
      this.content.slice(position + length);
    this.cursorPosition = position;
    return deleted;
  }

  getCursorPosition(): number {
    return this.cursorPosition;
  }

  setCursorPosition(position: number): void {
    this.cursorPosition = Math.min(position, this.content.length);
  }
}

// Concrete Command: Insert Text
class InsertTextCommand implements Command {
  private editor: TextEditor;
  private text: string;
  private position: number;

  constructor(editor: TextEditor, text: string, position: number) {
    this.editor = editor;
    this.text = text;
    this.position = position;
  }

  execute(): void {
    this.editor.insertText(this.text, this.position);
  }

  undo(): void {
    this.editor.deleteText(this.position, this.text.length);
  }

  getDescription(): string {
    return `Insert "${this.text}" at position ${this.position}`;
  }
}

// Concrete Command: Delete Text
class DeleteTextCommand implements Command {
  private editor: TextEditor;
  private position: number;
  private length: number;
  private deletedText: string = '';

  constructor(editor: TextEditor, position: number, length: number) {
    this.editor = editor;
    this.position = position;
    this.length = length;
  }

  execute(): void {
    this.deletedText = this.editor.deleteText(this.position, this.length);
  }

  undo(): void {
    this.editor.insertText(this.deletedText, this.position);
  }

  getDescription(): string {
    return `Delete ${this.length} characters at position ${this.position}`;
  }
}

// Invoker: Command History Manager
class CommandHistory {
  private history: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistory: number;

  constructor(maxHistory: number = 100) {
    this.maxHistory = maxHistory;
  }

  execute(command: Command): void {
    command.execute();
    this.history.push(command);
    this.redoStack = []; // Clear redo stack on new command

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    console.log(`Executed: ${command.getDescription()}`);
  }

  undo(): boolean {
    const command = this.history.pop();
    if (!command) {
      console.log('Nothing to undo');
      return false;
    }

    command.undo();
    this.redoStack.push(command);
    console.log(`Undone: ${command.getDescription()}`);
    return true;
  }

  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) {
      console.log('Nothing to redo');
      return false;
    }

    command.execute();
    this.history.push(command);
    console.log(`Redone: ${command.getDescription()}`);
    return true;
  }

  getHistory(): string[] {
    return this.history.map(cmd => cmd.getDescription());
  }
}

// Usage
const editor = new TextEditor();
const history = new CommandHistory();

history.execute(new InsertTextCommand(editor, 'Hello', 0));
console.log(editor.getContent()); // "Hello"

history.execute(new InsertTextCommand(editor, ' World', 5));
console.log(editor.getContent()); // "Hello World"

history.execute(new InsertTextCommand(editor, '!', 11));
console.log(editor.getContent()); // "Hello World!"

history.undo();
console.log(editor.getContent()); // "Hello World"

history.undo();
console.log(editor.getContent()); // "Hello"

history.redo();
console.log(editor.getContent()); // "Hello World"

// Macro Command (Composite Command)
class MacroCommand implements Command {
  private commands: Command[] = [];
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  addCommand(command: Command): void {
    this.commands.push(command);
  }

  execute(): void {
    this.commands.forEach(cmd => cmd.execute());
  }

  undo(): void {
    // Undo in reverse order
    [...this.commands].reverse().forEach(cmd => cmd.undo());
  }

  getDescription(): string {
    return `Macro: ${this.name} (${this.commands.length} commands)`;
  }
}
```

---

## When to Use Each Pattern

### Quick Reference Guide

| Pattern | Use When |
|---------|----------|
| **Singleton** | Single instance needed across application (config, logging) |
| **Factory** | Object creation logic is complex or varies by context |
| **Builder** | Objects have many optional parameters or complex construction |
| **Adapter** | Integrating incompatible interfaces |
| **Decorator** | Adding responsibilities dynamically without subclassing |
| **Proxy** | Lazy loading, access control, logging, or caching needed |
| **Observer** | One-to-many notifications, event systems |
| **Strategy** | Interchangeable algorithms at runtime |
| **Command** | Undo/redo, transaction logging, request queuing |

### Decision Tree

```
Need to control object creation?
  -> Single instance? -> Singleton
  -> Complex construction? -> Builder
  -> Varying product types? -> Factory

Need to compose objects?
  -> Convert interface? -> Adapter
  -> Add behavior dynamically? -> Decorator
  -> Control access? -> Proxy

Need to manage behavior/communication?
  -> Notify multiple objects? -> Observer
  -> Switch algorithms? -> Strategy
  -> Queue/undo operations? -> Command
```

---

## Anti-Patterns to Avoid

### Singleton Abuse

**Problem**: Using Singleton as a disguised global variable.

```typescript
// BAD: Singleton with mutable state
class UserSession {
  private static instance: UserSession;
  public currentUser: User | null = null; // Mutable global state
  public settings: Settings = {}; // More mutable state
}

// BETTER: Use dependency injection
class UserService {
  constructor(private sessionStore: SessionStore) {}

  getCurrentUser(): User | null {
    return this.sessionStore.get('user');
  }
}
```

### Factory Overkill

**Problem**: Creating factories for simple object creation.

```typescript
// BAD: Unnecessary factory
class PointFactory {
  static createPoint(x: number, y: number): Point {
    return new Point(x, y);
  }
}

// BETTER: Just use the constructor
const point = new Point(10, 20);
```

### Decorator Hell

**Problem**: Too many nested decorators making code unreadable.

```typescript
// BAD: Decorator chaos
const component = new LoggingDecorator(
  new CachingDecorator(
    new ValidationDecorator(
      new AuthDecorator(
        new RetryDecorator(
          new TimeoutDecorator(
            new BaseComponent()
          )
        )
      )
    )
  )
);

// BETTER: Use composition or middleware pattern
const component = createComponent({
  middleware: [logging, caching, validation, auth, retry, timeout]
});
```

### Observer Memory Leaks

**Problem**: Forgetting to unsubscribe observers.

```typescript
// BAD: No cleanup
class Component {
  init() {
    eventBus.on('update', this.handleUpdate);
  }
  // No cleanup on destroy!
}

// BETTER: Always clean up
class Component {
  private unsubscribe: () => void;

  init() {
    this.unsubscribe = eventBus.on('update', this.handleUpdate);
  }

  destroy() {
    this.unsubscribe();
  }
}
```

### God Object Anti-Pattern

**Problem**: One class doing everything, violating Single Responsibility.

```typescript
// BAD: God object
class ApplicationManager {
  handleUserLogin() { /* ... */ }
  processPayment() { /* ... */ }
  sendEmail() { /* ... */ }
  generateReport() { /* ... */ }
  connectToDatabase() { /* ... */ }
}

// BETTER: Separate concerns
class AuthService { /* ... */ }
class PaymentService { /* ... */ }
class EmailService { /* ... */ }
class ReportService { /* ... */ }
class DatabaseService { /* ... */ }
```

---

## Modern Alternatives

### Dependency Injection over Singleton

```typescript
// Modern DI Container approach
interface Container {
  register<T>(token: symbol, factory: () => T): void;
  resolve<T>(token: symbol): T;
}

class DIContainer implements Container {
  private factories = new Map<symbol, () => any>();
  private instances = new Map<symbol, any>();

  register<T>(token: symbol, factory: () => T): void {
    this.factories.set(token, factory);
  }

  resolve<T>(token: symbol): T {
    if (!this.instances.has(token)) {
      const factory = this.factories.get(token);
      if (!factory) throw new Error(`No provider for ${token.toString()}`);
      this.instances.set(token, factory());
    }
    return this.instances.get(token);
  }
}

// Usage
const TOKENS = {
  Logger: Symbol('Logger'),
  Database: Symbol('Database'),
  UserService: Symbol('UserService')
};

const container = new DIContainer();
container.register(TOKENS.Logger, () => new ConsoleLogger());
container.register(TOKENS.Database, () => new PostgresDB());
container.register(TOKENS.UserService, () =>
  new UserService(container.resolve(TOKENS.Database))
);
```

### Hooks over HOC Decorators (React)

```typescript
// Instead of HOC decorators, use hooks
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth().then(setUser).finally(() => setLoading(false));
  }, []);

  return { user, loading, isAuthenticated: !!user };
}

function useData<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetcher()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, error, loading };
}

// Usage - clean and composable
function UserProfile({ userId }: { userId: string }) {
  const { isAuthenticated } = useAuth();
  const { data: user, loading } = useData(() => fetchUser(userId));

  if (!isAuthenticated) return <LoginPrompt />;
  if (loading) return <Spinner />;
  return <Profile user={user} />;
}
```

### Reactive Streams over Observer

```typescript
// Using RxJS for reactive patterns
import { BehaviorSubject, map, filter, distinctUntilChanged } from 'rxjs';

class Store<T> {
  private state$: BehaviorSubject<T>;

  constructor(initialState: T) {
    this.state$ = new BehaviorSubject(initialState);
  }

  getState() {
    return this.state$.value;
  }

  setState(updater: (state: T) => T) {
    this.state$.next(updater(this.state$.value));
  }

  select<R>(selector: (state: T) => R) {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    );
  }
}

// Usage
interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

const store = new Store<AppState>({
  user: null,
  theme: 'light',
  notifications: []
});

// Subscribe to specific state slices
store.select(s => s.theme).subscribe(theme => {
  document.body.className = `theme-${theme}`;
});

store.select(s => s.notifications.length)
  .pipe(filter(count => count > 0))
  .subscribe(count => {
    console.log(`You have ${count} notifications`);
  });
```

---

## Real-World Examples

### E-Commerce Payment System

```typescript
// Combining Strategy, Factory, and Observer patterns
interface PaymentMethod {
  process(order: Order): Promise<PaymentResult>;
}

class PaymentMethodFactory {
  private methods: Map<string, () => PaymentMethod> = new Map();

  register(type: string, creator: () => PaymentMethod): void {
    this.methods.set(type, creator);
  }

  create(type: string): PaymentMethod {
    const creator = this.methods.get(type);
    if (!creator) throw new Error(`Unknown payment method: ${type}`);
    return creator();
  }
}

class OrderProcessor extends Observable<OrderEvent> {
  constructor(
    private paymentFactory: PaymentMethodFactory,
    private inventoryService: InventoryService
  ) {
    super();
  }

  async processOrder(order: Order): Promise<void> {
    this.notify({ type: 'ORDER_STARTED', order });

    try {
      // Reserve inventory
      await this.inventoryService.reserve(order.items);
      this.notify({ type: 'INVENTORY_RESERVED', order });

      // Process payment
      const paymentMethod = this.paymentFactory.create(order.paymentType);
      const result = await paymentMethod.process(order);

      if (result.success) {
        this.notify({ type: 'PAYMENT_SUCCESS', order, result });
        await this.inventoryService.commit(order.items);
        this.notify({ type: 'ORDER_COMPLETED', order });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      await this.inventoryService.release(order.items);
      this.notify({ type: 'ORDER_FAILED', order, error });
      throw error;
    }
  }
}
```

### Document Editor with Undo/Redo

```typescript
// Combining Command and Memento patterns
interface DocumentState {
  content: string;
  selection: { start: number; end: number };
  formatting: Map<string, any>;
}

class DocumentEditor {
  private state: DocumentState;
  private commandHistory: CommandHistory;

  constructor() {
    this.state = {
      content: '',
      selection: { start: 0, end: 0 },
      formatting: new Map()
    };
    this.commandHistory = new CommandHistory();
  }

  type(text: string): void {
    const command = new TypeCommand(this, text, this.state.selection);
    this.commandHistory.execute(command);
  }

  delete(): void {
    if (this.state.selection.start !== this.state.selection.end) {
      const command = new DeleteCommand(this, this.state.selection);
      this.commandHistory.execute(command);
    }
  }

  format(formatType: string, value: any): void {
    const command = new FormatCommand(this, formatType, value, this.state.selection);
    this.commandHistory.execute(command);
  }

  undo(): void {
    this.commandHistory.undo();
  }

  redo(): void {
    this.commandHistory.redo();
  }

  // State management
  getState(): DocumentState {
    return { ...this.state };
  }

  setState(state: Partial<DocumentState>): void {
    this.state = { ...this.state, ...state };
  }
}
```

---

## Interview Key Points

### Frequently Asked Questions

1. **Explain the Singleton pattern and its use cases**
   - Core: Ensures only one instance of a class exists
   - Use cases: Configuration managers, logging services, connection pools
   - Considerations: Thread safety, lazy vs eager initialization, testing challenges

2. **What's the difference between Factory Method and Abstract Factory?**
   - Factory Method: Creates single products, uses inheritance
   - Abstract Factory: Creates product families, uses composition
   - Factory Method is for one product; Abstract Factory for related products

3. **How does the Observer pattern work in modern frameworks?**
   - Vue: Reactivity system with reactive proxies
   - React: State management with Redux/Zustand
   - General: Event emitters, pub/sub systems

4. **When would you choose Strategy over State pattern?**
   - Strategy: Algorithms are interchangeable, client chooses
   - State: Behavior changes based on internal state, transitions are internal
   - Key difference: Who controls the changes

5. **Compare Decorator and Proxy patterns**
   - Decorator: Adds functionality, can be stacked
   - Proxy: Controls access, typically single layer
   - Decorator enhances; Proxy controls

### Interview Tips

1. **Start with the concept**: Summarize the pattern in one sentence
2. **Give real examples**: Reference actual frameworks or libraries
3. **Draw diagrams**: Sketch class or sequence diagrams when helpful
4. **Compare patterns**: Proactively contrast with related patterns
5. **Discuss trade-offs**: Mention both advantages and disadvantages

### Sample Answer Structure

```
1. Definition (1-2 sentences)
2. Problem it solves
3. Real-world analogy
4. Code example (brief)
5. When to use / not use
6. Related patterns
```

---

## Further Reading

### Classic Books

1. **"Design Patterns: Elements of Reusable Object-Oriented Software"** - GoF
   - The foundational text on design patterns

2. **"Head First Design Patterns"** - Eric Freeman
   - Visual, beginner-friendly approach

3. **"Refactoring: Improving the Design of Existing Code"** - Martin Fowler
   - Understanding patterns through refactoring

4. **"Patterns of Enterprise Application Architecture"** - Martin Fowler
   - Patterns for large-scale applications

### Online Resources

- [Refactoring Guru](https://refactoring.guru/design-patterns) - Excellent visual explanations
- [Source Making](https://sourcemaking.com/design_patterns) - Patterns, anti-patterns, and refactoring
- [patterns.dev](https://www.patterns.dev/) - Modern web development patterns

### Advanced Topics

1. **Architectural Patterns**: MVC, MVP, MVVM, Clean Architecture
2. **Enterprise Patterns**: Repository, Unit of Work, Service Layer
3. **Domain-Driven Design**: Aggregates, Entities, Value Objects
4. **Reactive Patterns**: RxJS operators and patterns
5. **Functional Patterns**: Monads, Functors, Applicatives

---

## Summary

Design patterns are valuable tools in software development, providing proven solutions to common problems. However, remember:

- **Patterns are tools, not goals** - The goal is maintainable, extensible code
- **Understand the problem first** - Don't force patterns where they don't fit
- **Simplicity over complexity** - If a simple solution works, use it
- **Practice continuously** - Real understanding comes from application

Start with the most commonly used patterns (Singleton, Factory, Observer, Strategy, Decorator), apply them in real projects, and gradually expand your knowledge. With experience, design patterns will become a natural part of how you think about software architecture.

The key to mastering design patterns is not memorizing their implementations but understanding the problems they solve and recognizing when those problems appear in your work. As you gain experience, you'll find yourself naturally reaching for the right pattern at the right time.
