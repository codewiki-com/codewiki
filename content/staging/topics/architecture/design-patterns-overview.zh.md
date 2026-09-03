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
origin: old/src/content/docs/architecture/design-patterns-overview.zh.md
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

## 什么是设计模式？

设计模式是针对软件设计中常见问题的经过验证的、可重用的解决方案。它们不是可以直接复制粘贴到项目中的现成代码，而是描述如何在各种场景下解决特定设计问题的模板或蓝图。

设计模式的概念源自建筑师 Christopher Alexander 的著作《建筑模式语言》，后来被引入软件工程领域。1994 年，Erich Gamma、Richard Helm、Ralph Johnson 和 John Vlissides（合称"四人帮"或 GoF）出版了《设计模式：可复用面向对象软件的基础》，系统地记录了 23 种经典设计模式，奠定了现代软件设计模式的基础。

### 为什么要学习设计模式？

1. **提升代码质量**：设计模式提供经过实战检验的解决方案，帮助你编写更健壮、更易维护的代码
2. **增强沟通效率**：模式提供了通用词汇，使团队成员能够更高效地交流设计思想
3. **加速开发进度**：无需重新发明轮子，可以直接应用成熟的模式
4. **适应变化**：良好应用的模式使代码在需求变化时更容易修改
5. **面试准备**：设计模式是技术面试中经常考察的主题

### 面向对象设计的六大原则

在深入学习具体模式之前，了解面向对象设计的六大基本原则（SOLID + 迪米特法则）至关重要：

1. **单一职责原则（SRP）**：一个类应该只有一个引起变化的原因
2. **开闭原则（OCP）**：软件实体应该对扩展开放，对修改关闭
3. **里氏替换原则（LSP）**：子类型必须能够替换其基类型
4. **接口隔离原则（ISP）**：客户端不应该被迫依赖它们不使用的接口
5. **依赖倒置原则（DIP）**：高层模块不应该依赖低层模块；两者都应该依赖抽象
6. **迪米特法则（LoD）**：一个对象应该对其他对象有尽可能少的了解

---

## 模式分类

GoF 将 23 种设计模式分为三大类：

### 创建型模式

创建型模式处理对象创建机制，试图以适合具体情况的方式创建对象。这一类包含 5 种模式：

| 模式名称 | 核心概念 |
|---------|---------|
| 单例模式 | 确保一个类只有一个实例 |
| 工厂方法 | 定义创建对象的接口，让子类决定实例化哪个类 |
| 抽象工厂 | 创建相关对象的家族，而无需指定具体类 |
| 建造者模式 | 将复杂对象的构建与其表示分离 |
| 原型模式 | 通过复制现有对象来创建新对象 |

### 结构型模式

结构型模式处理类和对象的组合，以形成更大的结构。这一类包含 7 种模式：

| 模式名称 | 核心概念 |
|---------|---------|
| 适配器模式 | 将一个接口转换为客户端期望的另一个接口 |
| 桥接模式 | 将抽象与实现分离 |
| 组合模式 | 将对象组合成树形结构，统一处理单个对象和组合 |
| 装饰器模式 | 动态地为对象添加职责 |
| 外观模式 | 提供统一的高层接口 |
| 享元模式 | 使用共享来高效支持大量细粒度对象 |
| 代理模式 | 提供代理来控制对对象的访问 |

### 行为型模式

行为型模式处理对象之间的通信和职责分配。这一类包含 11 种模式：

| 模式名称 | 核心概念 |
|---------|---------|
| 责任链模式 | 沿着处理者链传递请求 |
| 命令模式 | 将请求封装为对象 |
| 解释器模式 | 定义语言的语法和解释器 |
| 迭代器模式 | 顺序访问聚合对象的元素 |
| 中介者模式 | 定义封装对象交互方式的对象 |
| 备忘录模式 | 在不违反封装的情况下捕获和恢复对象的内部状态 |
| 观察者模式 | 定义对象之间的一对多依赖关系 |
| 状态模式 | 允许对象在内部状态改变时改变其行为 |
| 策略模式 | 定义一系列可互换的算法 |
| 模板方法 | 定义算法骨架，将某些步骤延迟到子类 |
| 访问者模式 | 在不改变元素类的情况下定义新操作 |

---

## 创建型模式详解

### 单例模式

#### 概念与目的

单例模式确保一个类只有一个实例，并提供一个全局访问点。当需要一个对象来协调整个系统的操作时，这种模式非常有用。

#### 使用场景

- 创建成本高昂的对象（例如数据库连接池）
- 应该在应用程序中共享的资源（例如配置管理器）
- 管理共享状态的对象（例如日志服务、缓存）
- 需要严格控制全局变量时

#### TypeScript 实现

```typescript
// 基本单例模式
class Singleton {
  private static instance: Singleton;

  // 私有构造函数防止外部实例化
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

// 使用示例
const s1 = Singleton.getInstance();
const s2 = Singleton.getInstance();
console.log(s1 === s2); // true

// 线程安全的单例（饿汉式初始化）
class EagerSingleton {
  private static readonly instance: EagerSingleton = new EagerSingleton();

  private constructor() {}

  public static getInstance(): EagerSingleton {
    return EagerSingleton.instance;
  }
}

// 泛型单例工厂
function createSingleton<T>(creator: () => T): () => T {
  let instance: T | null = null;
  return () => {
    if (instance === null) {
      instance = creator();
    }
    return instance;
  };
}

// 使用泛型单例工厂
const getLogger = createSingleton(() => ({
  log: (message: string) => console.log(`[LOG] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`)
}));

const logger1 = getLogger();
const logger2 = getLogger();
console.log(logger1 === logger2); // true
```

#### 实际案例：应用程序配置

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
    // 在实际应用中，这会从环境变量或配置文件加载
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

// 使用示例
const config = ConfigurationManager.getInstance();
await config.loadConfig();
console.log(config.get('apiUrl'));
console.log(config.isFeatureEnabled('darkMode'));
```

---

### 工厂模式

#### 概念与目的

工厂模式是一种创建型设计模式，它提供了一种创建对象的方式，而无需指定要创建的对象的确切类。主要有三种变体：简单工厂、工厂方法和抽象工厂。

#### 使用场景

- 当你事先不知道需要创建的对象的确切类型时
- 当你想为用户提供一种扩展库内部组件的方式时
- 当你想重用现有对象而不是每次都创建新对象时

#### TypeScript 实现

```typescript
// 产品接口
interface Button {
  render(): void;
  onClick(handler: () => void): void;
}

// 具体产品
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

// 简单工厂
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

// 工厂方法模式
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

// 抽象工厂模式
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

// 客户端代码
function createUI(factory: GUIFactory): void {
  const button = factory.createButton();
  const checkbox = factory.createCheckbox();
  button.render();
  checkbox.render();
}

// 使用示例
const os = 'windows';
const factory = os === 'windows' ? new WindowsFactory() : new MacFactory();
createUI(factory);
```

---

### 建造者模式

#### 概念与目的

建造者模式将复杂对象的构建与其表示分离，允许相同的构建过程创建不同的表示。当创建具有许多可选参数的对象时，这种模式特别有用。

#### 使用场景

- 构建具有许多可选组件的复杂对象时
- 需要创建同一对象的不同表示时
- 需要具有许多属性的不可变对象时

#### TypeScript 实现

```typescript
// 产品
interface HttpRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timeout: number;
  retries: number;
}

// 建造者
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

// 使用示例
const request = new HttpRequestBuilder()
  .setUrl('https://api.example.com/users')
  .setMethod('POST')
  .addHeader('Authorization', 'Bearer token123')
  .setBody({ name: 'John', email: 'john@example.com' })
  .setTimeout(5000)
  .setRetries(3)
  .build();

// SQL 查询建造者示例
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

// 使用示例
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

## 结构型模式详解

### 适配器模式

#### 概念与目的

适配器模式将一个类的接口转换为客户端期望的另一个接口。它允许接口不兼容的类一起工作，充当新旧代码之间的桥梁。

#### 使用场景

- 当你想使用现有类但其接口不符合你的需求时
- 当你需要集成具有不同接口的第三方库时
- 当你处理需要与新系统协同工作的遗留代码时

#### TypeScript 实现

```typescript
// 目标接口（客户端期望的）
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

// 被适配者（具有不兼容接口的旧支付系统）
class LegacyPaymentGateway {
  makePayment(amountInCents: number, curr: string, callback: (err: Error | null, result: any) => void): void {
    // 旧的基于回调的 API
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

// 适配器
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

// 使用示例 - 客户端代码使用现代接口
async function processOrder(processor: PaymentProcessor, orderTotal: number) {
  const result = await processor.processPayment(orderTotal, 'USD');
  console.log(`Payment ${result.success ? 'succeeded' : 'failed'}: ${result.message}`);
  return result;
}

// 使用适配器
const legacyGateway = new LegacyPaymentGateway();
const adapter = new LegacyPaymentAdapter(legacyGateway);
processOrder(adapter, 99.99);
```

---

### 装饰器模式

#### 概念与目的

装饰器模式允许你通过将对象包装在包含这些行为的对象中来动态地为对象附加新行为。它提供了一种灵活的替代子类化的方式来扩展功能。

#### 使用场景

- 需要动态地为对象添加职责而不影响其他对象时
- 通过子类扩展不切实际或不可能时
- 需要灵活地组合多种行为时

#### TypeScript 实现

```typescript
// 组件接口
interface DataSource {
  writeData(data: string): void;
  readData(): string;
}

// 具体组件
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

// 基础装饰器
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

// 具体装饰器：加密
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
    // 简单的 Base64 编码用于演示
    return Buffer.from(data).toString('base64');
  }

  private decrypt(data: string): string {
    return Buffer.from(data, 'base64').toString('utf8');
  }
}

// 具体装饰器：压缩
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
    // 简化的压缩模拟
    return `COMPRESSED:${data}`;
  }

  private decompress(data: string): string {
    return data.replace('COMPRESSED:', '');
  }
}

// 具体装饰器：日志
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

// 使用示例 - 装饰器可以堆叠
let source: DataSource = new FileDataSource('data.txt');
source = new LoggingDecorator(source);
source = new CompressionDecorator(source);
source = new EncryptionDecorator(source);

source.writeData('Sensitive data that needs protection');
console.log('---');
const result = source.readData();
console.log('Final result:', result);

// 函数装饰器（现代方法）
type AsyncFunction<T extends any[], R> = (...args: T) => Promise<R>;

// 重试装饰器
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

// 超时装饰器
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

// 缓存装饰器
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

// 组合装饰器
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

### 代理模式

#### 概念与目的

代理模式为另一个对象提供代理或占位符，以控制对它的访问。它充当中介，可以添加额外的行为，如延迟初始化、访问控制、日志记录或缓存。

#### 使用场景

- 需要延迟初始化重量级对象时
- 需要对原始对象进行访问控制时
- 需要记录对服务对象的请求时
- 需要缓存操作结果时

#### TypeScript 实现

```typescript
// 主题接口
interface ImageLoader {
  display(): void;
  getInfo(): { width: number; height: number; size: number };
}

// 真实主题
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
    // 模拟昂贵的加载操作
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

// 虚拟代理（延迟加载）
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

// 保护代理（访问控制）
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
    // 用户只能查看自己的资料，除非是管理员
    if (this.authContext.role !== 'admin' && this.authContext.userId !== id) {
      throw new Error('Access denied: Cannot view other users');
    }
    return this.realService.getUser(id);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    // 用户只能更新自己的资料
    if (this.authContext.role !== 'admin' && this.authContext.userId !== id) {
      throw new Error('Access denied: Cannot update other users');
    }
    // 非管理员不能更改角色
    if (this.authContext.role !== 'admin' && data.role) {
      throw new Error('Access denied: Cannot change user role');
    }
    return this.realService.updateUser(id, data);
  }

  async deleteUser(id: string): Promise<void> {
    // 只有管理员可以删除用户
    if (this.authContext.role !== 'admin') {
      throw new Error('Access denied: Only admins can delete users');
    }
    return this.realService.deleteUser(id);
  }
}

// 缓存代理
class CachingUserServiceProxy implements UserService {
  private realService: UserService;
  private cache: Map<string, { user: User; timestamp: number }> = new Map();
  private cacheTTL: number = 60000; // 1 分钟

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
    // 更新时使缓存失效
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

## 行为型模式详解

### 观察者模式

#### 概念与目的

观察者模式定义了对象之间的一对多依赖关系，当一个对象（主题）的状态发生变化时，所有依赖它的对象（观察者）都会自动得到通知并更新。

#### 使用场景

- 当一个对象的变化需要同时改变其他对象，而你不知道有多少对象需要改变时
- 当一个对象需要通知其他对象，而不假设这些对象是什么时
- 用于实现事件处理系统
- 用于实现发布-订阅机制

#### TypeScript 实现

```typescript
// 观察者接口
interface Observer<T> {
  update(data: T): void;
}

// 主题接口
interface Subject<T> {
  attach(observer: Observer<T>): void;
  detach(observer: Observer<T>): void;
  notify(data: T): void;
}

// 泛型可观察类
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

// 具体主题：股票价格追踪器
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

// 具体观察者：价格显示器
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

// 具体观察者：价格警报
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

// 使用示例
const stockTicker = new StockTicker();

const mobileDisplay = new PriceDisplay('Mobile');
const desktopDisplay = new PriceDisplay('Desktop');
const appleAlert = new PriceAlert('AAPL', 5);

stockTicker.attach(mobileDisplay);
stockTicker.attach(desktopDisplay);
stockTicker.attach(appleAlert);

stockTicker.updatePrice('AAPL', 150.00);
stockTicker.updatePrice('AAPL', 160.00); // 触发警报

// 函数式事件发射器实现
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

// 现代 TypeScript 事件系统
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

// 类型安全的使用示例
const events = new TypedEventEmitter<EventMap>();

events.on('userLoggedIn', (data) => {
  console.log(`User ${data.userId} logged in at ${data.timestamp}`);
});

events.emit('userLoggedIn', { userId: '123', timestamp: new Date() });
```

---

### 策略模式

#### 概念与目的

策略模式定义一系列算法，将每个算法封装起来，并使它们可以互换。它让算法的变化独立于使用算法的客户端。

#### 使用场景

- 当你有许多只在行为上不同的相似类时
- 当你需要算法的不同变体时
- 当算法使用的数据不应该暴露给客户端时
- 当你需要在运行时切换算法时

#### TypeScript 实现

```typescript
// 策略接口
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

// 具体策略：信用卡
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
    // 模拟支付处理
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

// 具体策略：PayPal
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

// 具体策略：加密货币
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

// 上下文：购物车
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

// 使用示例
const cart = new ShoppingCart();
cart.addItem('TypeScript Handbook', 29.99);
cart.addItem('Design Patterns Book', 49.99, 2);

// 使用不同的策略
cart.setPaymentStrategy(new CreditCardPayment('1234567890123456', '123', '12/25'));
await cart.checkout();

cart.setPaymentStrategy(new PayPalPayment('user@example.com'));
await cart.checkout();

// 函数式策略模式用于验证
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

// 组合验证规则
function validate<T>(value: T, ...rules: ValidationRule<T>[]): string[] {
  return rules
    .map(rule => rule(value))
    .filter((error): error is string => error !== null);
}

// 使用示例
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

### 命令模式

#### 概念与目的

命令模式将请求封装为对象，从而允许你用不同的请求参数化客户端，将请求排队或记录，并支持可撤销的操作。

#### 使用场景

- 当你需要用操作来参数化对象时
- 当你需要将操作排队、安排执行或远程执行时
- 当你需要实现可逆操作（撤销/重做）时
- 当你需要记录可在系统崩溃后重新应用的更改时

#### TypeScript 实现

```typescript
// 命令接口
interface Command {
  execute(): void;
  undo(): void;
  getDescription(): string;
}

// 接收者：文本编辑器
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

// 具体命令：插入文本
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

// 具体命令：删除文本
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

// 调用者：命令历史管理器
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
    this.redoStack = []; // 新命令时清空重做栈

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

// 使用示例
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

// 宏命令（组合命令）
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
    // 按相反顺序撤销
    [...this.commands].reverse().forEach(cmd => cmd.undo());
  }

  getDescription(): string {
    return `Macro: ${this.name} (${this.commands.length} commands)`;
  }
}
```

---

## 何时使用各种模式

### 快速参考指南

| 模式 | 使用场景 |
|------|---------|
| **单例模式** | 应用程序中需要单一实例（配置、日志） |
| **工厂模式** | 对象创建逻辑复杂或因上下文而异 |
| **建造者模式** | 对象有许多可选参数或构建复杂 |
| **适配器模式** | 集成不兼容的接口 |
| **装饰器模式** | 在不使用子类的情况下动态添加职责 |
| **代理模式** | 需要延迟加载、访问控制、日志记录或缓存 |
| **观察者模式** | 一对多通知、事件系统 |
| **策略模式** | 运行时可互换的算法 |
| **命令模式** | 撤销/重做、事务日志、请求排队 |

### 决策树

```
需要控制对象创建？
  -> 单一实例？ -> 单例模式
  -> 复杂构建？ -> 建造者模式
  -> 产品类型变化？ -> 工厂模式

需要组合对象？
  -> 转换接口？ -> 适配器模式
  -> 动态添加行为？ -> 装饰器模式
  -> 控制访问？ -> 代理模式

需要管理行为/通信？
  -> 通知多个对象？ -> 观察者模式
  -> 切换算法？ -> 策略模式
  -> 排队/撤销操作？ -> 命令模式
```

---

## 需要避免的反模式

### 单例模式滥用

**问题**：将单例用作伪装的全局变量。

```typescript
// 糟糕：带有可变状态的单例
class UserSession {
  private static instance: UserSession;
  public currentUser: User | null = null; // 可变的全局状态
  public settings: Settings = {}; // 更多可变状态
}

// 更好：使用依赖注入
class UserService {
  constructor(private sessionStore: SessionStore) {}

  getCurrentUser(): User | null {
    return this.sessionStore.get('user');
  }
}
```

### 工厂模式过度使用

**问题**：为简单的对象创建创建工厂。

```typescript
// 糟糕：不必要的工厂
class PointFactory {
  static createPoint(x: number, y: number): Point {
    return new Point(x, y);
  }
}

// 更好：直接使用构造函数
const point = new Point(10, 20);
```

### 装饰器地狱

**问题**：太多嵌套的装饰器使代码难以阅读。

```typescript
// 糟糕：装饰器混乱
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

// 更好：使用组合或中间件模式
const component = createComponent({
  middleware: [logging, caching, validation, auth, retry, timeout]
});
```

### 观察者内存泄漏

**问题**：忘记取消订阅观察者。

```typescript
// 糟糕：没有清理
class Component {
  init() {
    eventBus.on('update', this.handleUpdate);
  }
  // 销毁时没有清理！
}

// 更好：始终清理
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

### 上帝对象反模式

**问题**：一个类做所有事情，违反单一职责原则。

```typescript
// 糟糕：上帝对象
class ApplicationManager {
  handleUserLogin() { /* ... */ }
  processPayment() { /* ... */ }
  sendEmail() { /* ... */ }
  generateReport() { /* ... */ }
  connectToDatabase() { /* ... */ }
}

// 更好：分离关注点
class AuthService { /* ... */ }
class PaymentService { /* ... */ }
class EmailService { /* ... */ }
class ReportService { /* ... */ }
class DatabaseService { /* ... */ }
```

---

## 现代替代方案

### 依赖注入替代单例

```typescript
// 现代 DI 容器方法
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

// 使用示例
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

### Hooks 替代 HOC 装饰器（React）

```typescript
// 使用 hooks 而不是 HOC 装饰器
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

// 使用示例 - 简洁且可组合
function UserProfile({ userId }: { userId: string }) {
  const { isAuthenticated } = useAuth();
  const { data: user, loading } = useData(() => fetchUser(userId));

  if (!isAuthenticated) return <LoginPrompt />;
  if (loading) return <Spinner />;
  return <Profile user={user} />;
}
```

### 响应式流替代观察者

```typescript
// 使用 RxJS 实现响应式模式
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

// 使用示例
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

// 订阅特定状态片段
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

## 实际案例

### 电商支付系统

```typescript
// 结合策略模式、工厂模式和观察者模式
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
      // 预留库存
      await this.inventoryService.reserve(order.items);
      this.notify({ type: 'INVENTORY_RESERVED', order });

      // 处理支付
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

### 带撤销/重做的文档编辑器

```typescript
// 结合命令模式和备忘录模式
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

  // 状态管理
  getState(): DocumentState {
    return { ...this.state };
  }

  setState(state: Partial<DocumentState>): void {
    this.state = { ...this.state, ...state };
  }
}
```

---

## 面试要点

### 常见问题

1. **解释单例模式及其使用场景**
   - 核心：确保一个类只有一个实例
   - 使用场景：配置管理器、日志服务、连接池
   - 注意事项：线程安全、懒加载与饿汉式初始化、测试挑战

2. **工厂方法和抽象工厂有什么区别？**
   - 工厂方法：创建单个产品，使用继承
   - 抽象工厂：创建产品家族，使用组合
   - 工厂方法针对一个产品；抽象工厂针对相关产品

3. **观察者模式在现代框架中如何工作？**
   - Vue：使用响应式代理的响应性系统
   - React：使用 Redux/Zustand 的状态管理
   - 通用：事件发射器、发布-订阅系统

4. **何时选择策略模式而不是状态模式？**
   - 策略模式：算法可互换，客户端选择
   - 状态模式：行为基于内部状态变化，转换是内部的
   - 关键区别：谁控制变化

5. **比较装饰器模式和代理模式**
   - 装饰器：添加功能，可以堆叠
   - 代理：控制访问，通常单层
   - 装饰器增强功能；代理控制访问

### 面试技巧

1. **从概念开始**：用一句话总结模式
2. **给出真实例子**：引用实际框架或库
3. **画图**：在有帮助时绘制类图或序列图
4. **比较模式**：主动与相关模式对比
5. **讨论权衡**：提及优点和缺点

### 示例回答结构

```
1. 定义（1-2 句话）
2. 它解决的问题
3. 现实世界类比
4. 代码示例（简短）
5. 何时使用/不使用
6. 相关模式
```

---

## 延伸阅读

### 经典书籍

1. **《设计模式：可复用面向对象软件的基础》** - GoF
   - 设计模式的奠基性著作

2. **《Head First 设计模式》** - Eric Freeman
   - 可视化、对初学者友好的方法

3. **《重构：改善既有代码的设计》** - Martin Fowler
   - 通过重构理解模式

4. **《企业应用架构模式》** - Martin Fowler
   - 大规模应用的模式

### 在线资源

- [Refactoring Guru](https://refactoring.guru/design-patterns) - 出色的可视化解释
- [Source Making](https://sourcemaking.com/design_patterns) - 模式、反模式和重构
- [patterns.dev](https://www.patterns.dev/) - 现代 Web 开发模式

### 高级主题

1. **架构模式**：MVC、MVP、MVVM、Clean Architecture
2. **企业模式**：Repository、Unit of Work、Service Layer
3. **领域驱动设计**：聚合、实体、值对象
4. **响应式模式**：RxJS 操作符和模式
5. **函数式模式**：Monad、Functor、Applicative

---

## 总结

设计模式是软件开发中的宝贵工具，为常见问题提供经过验证的解决方案。但请记住：

- **模式是工具，不是目标** - 目标是可维护、可扩展的代码
- **先理解问题** - 不要在不适合的地方强行使用模式
- **简单优于复杂** - 如果简单的解决方案有效，就使用它
- **持续练习** - 真正的理解来自实际应用

从最常用的模式（单例、工厂、观察者、策略、装饰器）开始，在实际项目中应用它们，然后逐步扩展你的知识。随着经验的积累，设计模式将成为你思考软件架构的自然组成部分。

掌握设计模式的关键不是记住它们的实现，而是理解它们解决的问题，并识别这些问题何时出现在你的工作中。随着经验的增长，你会发现自己自然而然地在正确的时机选择正确的模式。
