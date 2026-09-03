---
title: SOLID 设计原则
description: 深入理解SOLID五大设计原则及其在实际开发中的应用
track: architecture
section: principles
difficulty: intermediate
tags:
  - SOLID
  - 设计原则
  - 面向对象
status: imported
origin: old/src/content/docs/architecture/solid-principles.zh.md
divergence: 0.165
issues:
  - order-mismatch
legacy:
  category: Architecture
  subcategory: Principles
  order: 3
  lastUpdated: 2026-01-07
---

## 概念解释

SOLID 是面向对象编程和设计中五个基本原则的首字母缩写，由 Robert C. Martin（Uncle Bob）在 2000 年代初期提出并系统化。这五个原则分别是：

- **S** - Single Responsibility Principle（单一职责原则）
- **O** - Open/Closed Principle（开闭原则）
- **L** - Liskov Substitution Principle（里氏替换原则）
- **I** - Interface Segregation Principle（接口隔离原则）
- **D** - Dependency Inversion Principle（依赖倒置原则）

### 为什么需要 SOLID？

在软件开发的历史长河中，开发者们不断面临着代码难以维护、修改困难、耦合度高等问题。SOLID 原则的诞生正是为了解决这些痛点：

1. **可维护性**：遵循 SOLID 原则的代码更易于理解和修改
2. **可扩展性**：新功能可以在不破坏现有代码的情况下添加
3. **可测试性**：松耦合的设计使单元测试更加容易
4. **可复用性**：职责明确的组件更容易在其他项目中复用

这些原则虽然起源于面向对象编程，但其核心思想在函数式编程、前端组件化开发等现代编程范式中同样适用。

---

## 核心原理

### 五大原则的内在联系

SOLID 五个原则并非孤立存在，它们相互支撑、相互强化：

```
                    ┌─────────────────┐
                    │  高内聚低耦合   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌─────▼─────┐        ┌────▼────┐
   │   SRP   │         │    OCP    │        │   DIP   │
   │ 单一职责 │◄────────►│   开闭    │◄───────►│ 依赖倒置│
   └────┬────┘         └─────┬─────┘        └────┬────┘
        │                    │                    │
        │              ┌─────▼─────┐              │
        │              │    LSP    │              │
        └──────────────►│ 里氏替换 │◄─────────────┘
                       └─────┬─────┘
                             │
                       ┌─────▼─────┐
                       │    ISP    │
                       │ 接口隔离  │
                       └───────────┘
```

- **SRP** 确保类的职责单一，为其他原则奠定基础
- **OCP** 指导我们如何设计可扩展的系统
- **LSP** 规范继承关系，保证多态的正确性
- **ISP** 细化接口设计，避免接口污染
- **DIP** 实现模块间的解耦，是依赖注入的理论基础

---

## 单一职责原则 (SRP)

### 定义

> 一个类应该只有一个引起它变化的原因。

换句话说，一个类应该只负责一项职责。当需求变化时，只有与该职责相关的变化才应该影响这个类。

### 违反 SRP 的示例

```typescript
// 违反 SRP：User 类承担了太多职责
class User {
  private name: string;
  private email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

  // 职责1：用户数据管理
  getName(): string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  }

  // 职责2：数据验证
  validateEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  // 职责3：数据持久化
  saveToDatabase(): void {
    // 连接数据库并保存用户
    console.log(`Saving ${this.name} to database...`);
  }

  // 职责4：发送通知
  sendWelcomeEmail(): void {
    // 发送欢迎邮件
    console.log(`Sending welcome email to ${this.email}...`);
  }

  // 职责5：生成报告
  generateUserReport(): string {
    return `User Report: ${this.name} (${this.email})`;
  }
}
```

### 遵守 SRP 的示例

```typescript
// 遵守 SRP：每个类只负责一项职责

// 职责1：用户数据实体
class User {
  constructor(
    public readonly name: string,
    public readonly email: string
  ) {}
}

// 职责2：邮箱验证
class EmailValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  validate(email: string): boolean {
    return EmailValidator.EMAIL_REGEX.test(email);
  }
}

// 职责3：用户持久化
interface UserRepository {
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
}

class DatabaseUserRepository implements UserRepository {
  async save(user: User): Promise<void> {
    console.log(`Saving ${user.name} to database...`);
    // 实际的数据库操作
  }

  async findByEmail(email: string): Promise<User | null> {
    // 实际的查询操作
    return null;
  }
}

// 职责4：通知服务
class EmailNotificationService {
  async sendWelcomeEmail(user: User): Promise<void> {
    console.log(`Sending welcome email to ${user.email}...`);
  }
}

// 职责5：报告生成
class UserReportGenerator {
  generate(user: User): string {
    return `User Report: ${user.name} (${user.email})`;
  }
}
```

### SRP 在前端中的应用

在 React 中，SRP 体现为组件的职责分离：

```tsx
// 违反 SRP：一个组件做了太多事情
function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 数据获取逻辑
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, []);

  // 格式化逻辑
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('zh-CN');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>注册时间：{formatDate(user.createdAt)}</p>
    </div>
  );
}

// 遵守 SRP：职责分离

// 数据获取逻辑抽离到 Hook
function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, error };
}

// 格式化逻辑抽离到工具函数
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('zh-CN');
}

// 展示组件只负责渲染
function UserProfile() {
  const { user, loading, error } = useUser();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>注册时间：{formatDate(user.createdAt)}</p>
    </div>
  );
}
```

---

## 开闭原则 (OCP)

### 定义

> 软件实体（类、模块、函数等）应该对扩展开放，对修改关闭。

这意味着当需要添加新功能时，应该通过扩展现有代码来实现，而不是修改已有的代码。

### 违反 OCP 的示例

```typescript
// 违反 OCP：每次新增支付方式都需要修改这个类
class PaymentProcessor {
  processPayment(type: string, amount: number): void {
    if (type === 'creditCard') {
      console.log(`Processing credit card payment: $${amount}`);
      // 信用卡支付逻辑
    } else if (type === 'paypal') {
      console.log(`Processing PayPal payment: $${amount}`);
      // PayPal 支付逻辑
    } else if (type === 'wechat') {
      console.log(`Processing WeChat payment: $${amount}`);
      // 微信支付逻辑
    } else if (type === 'alipay') {
      console.log(`Processing Alipay payment: $${amount}`);
      // 支付宝支付逻辑
    }
    // 每新增一种支付方式，都要修改这个方法...
  }
}
```

### 遵守 OCP 的示例

```typescript
// 遵守 OCP：通过接口和多态实现扩展

// 定义支付策略接口
interface PaymentStrategy {
  pay(amount: number): void;
  getName(): string;
}

// 具体的支付策略实现
class CreditCardPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log(`Processing credit card payment: $${amount}`);
  }

  getName(): string {
    return 'Credit Card';
  }
}

class PayPalPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log(`Processing PayPal payment: $${amount}`);
  }

  getName(): string {
    return 'PayPal';
  }
}

class WeChatPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log(`Processing WeChat payment: $${amount}`);
  }

  getName(): string {
    return 'WeChat Pay';
  }
}

// 新增支付宝支付，无需修改任何现有代码
class AlipayPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log(`Processing Alipay payment: $${amount}`);
  }

  getName(): string {
    return 'Alipay';
  }
}

// 支付处理器对扩展开放，对修改关闭
class PaymentProcessor {
  constructor(private strategy: PaymentStrategy) {}

  setStrategy(strategy: PaymentStrategy): void {
    this.strategy = strategy;
  }

  processPayment(amount: number): void {
    console.log(`Using ${this.strategy.getName()}...`);
    this.strategy.pay(amount);
  }
}

// 使用示例
const processor = new PaymentProcessor(new CreditCardPayment());
processor.processPayment(100);

processor.setStrategy(new AlipayPayment());
processor.processPayment(200);
```

### OCP 在 React 中的应用

```tsx
// 遵守 OCP：使用组合模式实现可扩展的组件

// 基础 Button 组件
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

function Button({ children, onClick, className = '' }: ButtonProps) {
  return (
    <button
      className={`btn ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// 通过组合扩展，而非修改
function IconButton({
  icon,
  children,
  ...props
}: ButtonProps & { icon: React.ReactNode }) {
  return (
    <Button {...props}>
      {icon}
      {children}
    </Button>
  );
}

function LoadingButton({
  loading,
  children,
  ...props
}: ButtonProps & { loading: boolean }) {
  return (
    <Button {...props} className={loading ? 'loading' : ''}>
      {loading ? <Spinner /> : children}
    </Button>
  );
}

// 高阶组件也是 OCP 的体现
function withAnalytics<P extends object>(
  Component: React.ComponentType<P>,
  eventName: string
) {
  return function WrappedComponent(props: P) {
    const handleClick = () => {
      analytics.track(eventName);
      (props as any).onClick?.();
    };

    return <Component {...props} onClick={handleClick} />;
  };
}
```

---

## 里氏替换原则 (LSP)

### 定义

> 子类型必须能够替换它们的基类型。

更通俗地说，所有引用基类的地方必须能透明地使用其子类的对象，而不会导致程序出错或行为异常。

### 违反 LSP 的示例

```typescript
// 经典的违反 LSP 案例：正方形继承矩形

class Rectangle {
  protected _width: number;
  protected _height: number;

  constructor(width: number, height: number) {
    this._width = width;
    this._height = height;
  }

  get width(): number {
    return this._width;
  }

  set width(value: number) {
    this._width = value;
  }

  get height(): number {
    return this._height;
  }

  set height(value: number) {
    this._height = value;
  }

  getArea(): number {
    return this._width * this._height;
  }
}

// 违反 LSP：正方形改变了父类的行为约定
class Square extends Rectangle {
  constructor(side: number) {
    super(side, side);
  }

  // 违反父类的预期：设置宽度时同时改变高度
  set width(value: number) {
    this._width = value;
    this._height = value; // 破坏了独立设置宽高的预期
  }

  set height(value: number) {
    this._width = value;
    this._height = value;
  }
}

// 这个函数期望的行为被破坏了
function increaseRectangleWidth(rectangle: Rectangle): void {
  const originalHeight = rectangle.height;
  rectangle.width = rectangle.width + 10;

  // 对于 Rectangle：height 应该保持不变
  // 对于 Square：height 也被改变了！
  console.assert(
    rectangle.height === originalHeight,
    'Height should not change when width changes'
  );
}

const rect = new Rectangle(10, 20);
increaseRectangleWidth(rect); // 正常工作

const square = new Square(10);
increaseRectangleWidth(square); // 断言失败！LSP 被违反
```

### 遵守 LSP 的示例

```typescript
// 遵守 LSP：使用接口和组合而非继承

interface Shape {
  getArea(): number;
  getPerimeter(): number;
}

class Rectangle implements Shape {
  constructor(
    private readonly width: number,
    private readonly height: number
  ) {}

  getArea(): number {
    return this.width * this.height;
  }

  getPerimeter(): number {
    return 2 * (this.width + this.height);
  }

  // 如果需要修改，返回新对象
  withWidth(width: number): Rectangle {
    return new Rectangle(width, this.height);
  }

  withHeight(height: number): Rectangle {
    return new Rectangle(this.width, height);
  }
}

class Square implements Shape {
  constructor(private readonly side: number) {}

  getArea(): number {
    return this.side * this.side;
  }

  getPerimeter(): number {
    return 4 * this.side;
  }

  withSide(side: number): Square {
    return new Square(side);
  }
}

// 任何接受 Shape 的函数都能正确工作
function printShapeInfo(shape: Shape): void {
  console.log(`Area: ${shape.getArea()}`);
  console.log(`Perimeter: ${shape.getPerimeter()}`);
}

printShapeInfo(new Rectangle(10, 20)); // 正常工作
printShapeInfo(new Square(10)); // 正常工作
```

### LSP 在前端组件中的应用

```tsx
// 基础输入组件的接口契约
interface InputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// 基础输入组件
function TextInput({ value, onChange, disabled, placeholder }: InputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}

// 遵守 LSP：NumberInput 可以替换 TextInput
function NumberInput({ value, onChange, disabled, placeholder }: InputProps) {
  const handleChange = (newValue: string) => {
    // 只允许数字，但仍然通过 string 传递值
    if (/^\d*$/.test(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}

// 遵守 LSP：PhoneInput 可以替换 TextInput
function PhoneInput({ value, onChange, disabled, placeholder }: InputProps) {
  const formatPhone = (val: string): string => {
    const digits = val.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  };

  return (
    <input
      type="tel"
      value={formatPhone(value)}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      disabled={disabled}
      placeholder={placeholder || '请输入手机号'}
    />
  );
}

// 表单组件可以接受任何符合 InputProps 接口的组件
function FormField({
  label,
  Input,
  ...inputProps
}: InputProps & {
  label: string;
  Input: React.ComponentType<InputProps>;
}) {
  return (
    <div className="form-field">
      <label>{label}</label>
      <Input {...inputProps} />
    </div>
  );
}
```

---

## 接口隔离原则 (ISP)

### 定义

> 客户端不应该被迫依赖它不使用的接口。

应该将大接口拆分成更小、更具体的接口，让实现类只需要知道它们感兴趣的方法。

### 违反 ISP 的示例

```typescript
// 违反 ISP：一个臃肿的接口
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
  attendMeeting(): void;
  writeReport(): void;
  manageTeam(): void;
}

// 普通员工被迫实现不需要的方法
class Developer implements Worker {
  work(): void {
    console.log('Writing code...');
  }

  eat(): void {
    console.log('Eating lunch...');
  }

  sleep(): void {
    console.log('Taking a nap...');
  }

  attendMeeting(): void {
    console.log('Attending meeting...');
  }

  writeReport(): void {
    // 开发人员可能不需要写报告
    throw new Error('Developers do not write reports');
  }

  manageTeam(): void {
    // 开发人员不管理团队
    throw new Error('Developers do not manage teams');
  }
}

// 机器人工人被迫实现人类行为
class Robot implements Worker {
  work(): void {
    console.log('Assembling parts...');
  }

  eat(): void {
    // 机器人不吃饭！
    throw new Error('Robots do not eat');
  }

  sleep(): void {
    // 机器人不睡觉！
    throw new Error('Robots do not sleep');
  }

  attendMeeting(): void {
    throw new Error('Robots do not attend meetings');
  }

  writeReport(): void {
    throw new Error('Robots do not write reports');
  }

  manageTeam(): void {
    throw new Error('Robots do not manage teams');
  }
}
```

### 遵守 ISP 的示例

```typescript
// 遵守 ISP：将大接口拆分成小接口

interface Workable {
  work(): void;
}

interface Feedable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

interface MeetingAttendee {
  attendMeeting(): void;
}

interface ReportWriter {
  writeReport(): void;
}

interface TeamManager {
  manageTeam(): void;
}

// 开发人员只实现需要的接口
class Developer implements Workable, Feedable, Sleepable, MeetingAttendee {
  work(): void {
    console.log('Writing code...');
  }

  eat(): void {
    console.log('Eating lunch...');
  }

  sleep(): void {
    console.log('Taking a nap...');
  }

  attendMeeting(): void {
    console.log('Attending meeting...');
  }
}

// 经理实现更多接口
class Manager implements
  Workable,
  Feedable,
  Sleepable,
  MeetingAttendee,
  ReportWriter,
  TeamManager {
  work(): void {
    console.log('Managing projects...');
  }

  eat(): void {
    console.log('Having lunch with clients...');
  }

  sleep(): void {
    console.log('Power nap...');
  }

  attendMeeting(): void {
    console.log('Leading meeting...');
  }

  writeReport(): void {
    console.log('Writing quarterly report...');
  }

  manageTeam(): void {
    console.log('Conducting 1-on-1s...');
  }
}

// 机器人只实现它能做的事情
class Robot implements Workable {
  work(): void {
    console.log('Assembling parts 24/7...');
  }
}
```

### ISP 在 TypeScript/React 中的应用

```typescript
// 遵守 ISP：Props 接口的合理拆分

// 基础 Props
interface BaseButtonProps {
  children: React.ReactNode;
  className?: string;
}

// 可点击的 Props
interface ClickableProps {
  onClick: () => void;
  disabled?: boolean;
}

// 可提交的 Props
interface SubmittableProps {
  type: 'submit';
  form?: string;
}

// 带加载状态的 Props
interface LoadableProps {
  loading?: boolean;
  loadingText?: string;
}

// 带图标的 Props
interface IconProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// 组合使用 - 普通按钮
type ButtonProps = BaseButtonProps & ClickableProps;

// 组合使用 - 提交按钮
type SubmitButtonProps = BaseButtonProps & SubmittableProps & LoadableProps;

// 组合使用 - 图标按钮
type IconButtonProps = BaseButtonProps & ClickableProps & IconProps;

// 组件实现
function Button({ children, className, onClick, disabled }: ButtonProps) {
  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function SubmitButton({
  children,
  className,
  type,
  form,
  loading,
  loadingText
}: SubmitButtonProps) {
  return (
    <button
      type={type}
      form={form}
      className={className}
      disabled={loading}
    >
      {loading ? loadingText || 'Loading...' : children}
    </button>
  );
}
```

---

## 依赖倒置原则 (DIP)

### 定义

> 1. 高层模块不应该依赖低层模块，两者都应该依赖抽象。
> 2. 抽象不应该依赖细节，细节应该依赖抽象。

这个原则是依赖注入（DI）和控制反转（IoC）的理论基础。

### 违反 DIP 的示例

```typescript
// 违反 DIP：高层模块直接依赖低层模块的具体实现

// 低层模块：具体的数据库实现
class MySQLDatabase {
  connect(): void {
    console.log('Connecting to MySQL...');
  }

  query(sql: string): any[] {
    console.log(`Executing MySQL query: ${sql}`);
    return [];
  }
}

// 低层模块：具体的日志实现
class FileLogger {
  log(message: string): void {
    console.log(`[FILE] ${message}`);
  }
}

// 高层模块：直接依赖具体实现
class UserService {
  private database: MySQLDatabase;
  private logger: FileLogger;

  constructor() {
    // 直接创建依赖，高度耦合
    this.database = new MySQLDatabase();
    this.logger = new FileLogger();
  }

  getUsers(): any[] {
    this.logger.log('Fetching users...');
    this.database.connect();
    return this.database.query('SELECT * FROM users');
  }
}

// 问题：
// 1. 无法轻松替换数据库（如切换到 PostgreSQL）
// 2. 无法在测试中使用 Mock
// 3. 高度耦合，难以维护
```

### 遵守 DIP 的示例

```typescript
// 遵守 DIP：依赖抽象而非具体实现

// 定义抽象（接口）
interface Database {
  connect(): void;
  query(sql: string): any[];
}

interface Logger {
  log(message: string): void;
  error(message: string): void;
}

// 低层模块实现抽象
class MySQLDatabase implements Database {
  connect(): void {
    console.log('Connecting to MySQL...');
  }

  query(sql: string): any[] {
    console.log(`Executing MySQL query: ${sql}`);
    return [];
  }
}

class PostgreSQLDatabase implements Database {
  connect(): void {
    console.log('Connecting to PostgreSQL...');
  }

  query(sql: string): any[] {
    console.log(`Executing PostgreSQL query: ${sql}`);
    return [];
  }
}

class FileLogger implements Logger {
  log(message: string): void {
    console.log(`[FILE] ${message}`);
  }

  error(message: string): void {
    console.error(`[FILE ERROR] ${message}`);
  }
}

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[CONSOLE] ${message}`);
  }

  error(message: string): void {
    console.error(`[CONSOLE ERROR] ${message}`);
  }
}

// 高层模块依赖抽象
class UserService {
  constructor(
    private readonly database: Database,
    private readonly logger: Logger
  ) {}

  getUsers(): any[] {
    this.logger.log('Fetching users...');
    this.database.connect();
    return this.database.query('SELECT * FROM users');
  }
}

// 依赖注入 - 可以灵活切换实现
const mysqlService = new UserService(
  new MySQLDatabase(),
  new FileLogger()
);

const postgresService = new UserService(
  new PostgreSQLDatabase(),
  new ConsoleLogger()
);

// 测试时可以使用 Mock
class MockDatabase implements Database {
  connect(): void {}
  query(sql: string): any[] {
    return [{ id: 1, name: 'Test User' }];
  }
}

const testService = new UserService(
  new MockDatabase(),
  new ConsoleLogger()
);
```

### DIP 在 React 中的应用

```tsx
// 使用 Context 实现依赖注入

// 1. 定义抽象接口
interface AuthService {
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): User | null;
}

interface AnalyticsService {
  track(event: string, data?: Record<string, any>): void;
}

// 2. 创建 Context
const AuthContext = createContext<AuthService | null>(null);
const AnalyticsContext = createContext<AnalyticsService | null>(null);

// 3. 具体实现
class FirebaseAuthService implements AuthService {
  async login(email: string, password: string): Promise<User> {
    // Firebase 登录实现
    return { id: '1', email };
  }

  async logout(): Promise<void> {
    // Firebase 登出实现
  }

  getCurrentUser(): User | null {
    // 获取当前用户
    return null;
  }
}

class GoogleAnalyticsService implements AnalyticsService {
  track(event: string, data?: Record<string, any>): void {
    // GA 埋点实现
    console.log('GA track:', event, data);
  }
}

// 4. 提供依赖
function AppProviders({ children }: { children: React.ReactNode }) {
  const authService = useMemo(() => new FirebaseAuthService(), []);
  const analyticsService = useMemo(() => new GoogleAnalyticsService(), []);

  return (
    <AuthContext.Provider value={authService}>
      <AnalyticsContext.Provider value={analyticsService}>
        {children}
      </AnalyticsContext.Provider>
    </AuthContext.Provider>
  );
}

// 5. 使用依赖的 Hooks
function useAuth(): AuthService {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used within AuthProvider');
  return auth;
}

function useAnalytics(): AnalyticsService {
  const analytics = useContext(AnalyticsContext);
  if (!analytics) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return analytics;
}

// 6. 组件使用 - 不关心具体实现
function LoginButton() {
  const auth = useAuth();
  const analytics = useAnalytics();

  const handleLogin = async () => {
    analytics.track('login_attempt');
    try {
      await auth.login('user@example.com', 'password');
      analytics.track('login_success');
    } catch (error) {
      analytics.track('login_failed');
    }
  };

  return <button onClick={handleLogin}>Login</button>;
}
```

---

## 最佳实践

### 渐进式应用

不要试图一开始就完美地应用所有原则。建议的顺序：

1. 首先确保 **SRP**：让每个类/函数职责单一
2. 然后考虑 **DIP**：通过依赖注入解耦
3. 接着应用 **OCP**：设计可扩展的结构
4. 再考虑 **ISP**：细化接口
5. 最后验证 **LSP**：确保继承关系正确

### 根据项目规模权衡

```typescript
// 小项目：简单直接即可
function fetchUser(id: string) {
  return fetch(`/api/users/${id}`).then(r => r.json());
}

// 大项目：需要更多抽象
interface UserRepository {
  findById(id: string): Promise<User>;
  save(user: User): Promise<void>;
}

class HttpUserRepository implements UserRepository {
  constructor(private httpClient: HttpClient) {}

  async findById(id: string): Promise<User> {
    return this.httpClient.get(`/api/users/${id}`);
  }

  async save(user: User): Promise<void> {
    await this.httpClient.post('/api/users', user);
  }
}
```

### 与其他模式结合使用

SOLID 原则通常与设计模式配合使用：

- **OCP + 策略模式**：实现可扩展的算法
- **DIP + 工厂模式**：创建依赖对象
- **ISP + 适配器模式**：适配不同接口
- **SRP + 外观模式**：简化复杂子系统

---

## 常见陷阱

### 过度设计

```typescript
// 过度设计：简单功能不需要这么多抽象
interface StringFormatter {
  format(str: string): string;
}

interface StringFormatterFactory {
  create(type: string): StringFormatter;
}

class UpperCaseFormatter implements StringFormatter {
  format(str: string): string {
    return str.toUpperCase();
  }
}

// 简单方案：直接用函数即可
const toUpperCase = (str: string) => str.toUpperCase();
```

### 误解单一职责

```typescript
// 错误理解：一个类只能有一个方法
class UserNameGetter {
  getName(user: User): string {
    return user.name;
  }
}

class UserEmailGetter {
  getEmail(user: User): string {
    return user.email;
  }
}

// 正确理解：一个类负责一个"职责领域"
class UserPresenter {
  formatDisplayName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  formatEmail(user: User): string {
    return user.email.toLowerCase();
  }

  toListItem(user: User): UserListItem {
    return {
      label: this.formatDisplayName(user),
      subtitle: this.formatEmail(user),
    };
  }
}
```

### 忽视项目上下文

- 原型项目：快速验证，不必严格遵循
- 长期项目：需要认真考虑可维护性
- 遗留项目：渐进式重构，不要一步到位

### 强行应用继承

```typescript
// 错误：为了复用而强行继承
class Animal {
  eat(): void {}
  sleep(): void {}
  fly(): void {} // 不是所有动物都会飞！
}

class Dog extends Animal {
  fly(): void {
    throw new Error('Dogs cannot fly');
  }
}

// 正确：使用组合和接口
interface Flyable {
  fly(): void;
}

interface Swimmable {
  swim(): void;
}

class Bird implements Flyable {
  fly(): void {
    console.log('Flying...');
  }
}

class Fish implements Swimmable {
  swim(): void {
    console.log('Swimming...');
  }
}

class Duck implements Flyable, Swimmable {
  fly(): void {
    console.log('Flying...');
  }

  swim(): void {
    console.log('Swimming...');
  }
}
```

---

## 性能考量

SOLID 原则的应用可能会引入额外的抽象层，需要注意：

1. **对象创建开销**：依赖注入可能创建更多对象
2. **方法调用开销**：多态调用比直接调用稍慢
3. **内存使用**：更多的小对象可能增加内存碎片

但是：

- 现代 JavaScript 引擎优化很好，通常不会成为瓶颈
- 可维护性带来的收益远大于微小的性能损失
- 只在确认为瓶颈时才进行优化

---

## 实战场景

### 场景一：电商订单系统

```typescript
// 应用 SOLID 原则设计订单服务

// SRP: 各个类职责明确
// ISP: 接口按需定义
interface OrderCreator {
  create(items: OrderItem[], customerId: string): Order;
}

interface OrderValidator {
  validate(order: Order): ValidationResult;
}

interface PaymentProcessor {
  process(order: Order, paymentMethod: PaymentMethod): PaymentResult;
}

interface OrderNotifier {
  notify(order: Order, event: OrderEvent): void;
}

// DIP: 依赖抽象
class OrderService {
  constructor(
    private creator: OrderCreator,
    private validator: OrderValidator,
    private paymentProcessor: PaymentProcessor,
    private notifier: OrderNotifier
  ) {}

  async placeOrder(
    items: OrderItem[],
    customerId: string,
    paymentMethod: PaymentMethod
  ): Promise<Order> {
    const order = this.creator.create(items, customerId);

    const validation = this.validator.validate(order);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors);
    }

    const paymentResult = await this.paymentProcessor.process(order, paymentMethod);
    if (!paymentResult.success) {
      throw new PaymentError(paymentResult.error);
    }

    order.status = 'paid';
    await this.notifier.notify(order, 'ORDER_PLACED');

    return order;
  }
}

// OCP: 新增支付方式不需要修改 OrderService
class CryptoPaymentProcessor implements PaymentProcessor {
  process(order: Order, paymentMethod: PaymentMethod): PaymentResult {
    // 加密货币支付逻辑
    return { success: true, transactionId: 'crypto-123' };
  }
}
```

---

## 面试要点

### 常见面试问题

1. **什么是 SOLID 原则？请逐一解释。**

   考察对基础概念的理解，需要能够清晰定义每个原则并举例。

2. **单一职责原则中的"职责"如何界定？**

   考察对 SRP 的深入理解。答案要点：职责是指"引起变化的原因"，需要结合具体业务场景判断。

3. **开闭原则如何实现"对扩展开放，对修改关闭"？**

   期望答案包含：抽象、多态、策略模式、依赖注入等关键词。

4. **请举例说明违反里氏替换原则的情况。**

   经典例子：正方形继承矩形。需要解释为什么违反以及如何修复。

5. **接口隔离原则和单一职责原则有什么区别？**

   SRP 针对类的职责，ISP 针对接口的设计。两者相辅相成但关注点不同。

6. **依赖倒置原则与依赖注入是什么关系？**

   DIP 是原则，DI 是实现 DIP 的技术手段。

7. **在 React/Vue 等前端框架中如何应用 SOLID 原则？**

   考察将理论应用到实际开发的能力。需要结合 Hooks、组件设计、Context 等具体实践。

### 面试技巧

- 不要死记硬背定义，理解原则背后的"为什么"
- 准备好违反和遵守每个原则的代码示例
- 能够结合实际项目经验讲解应用场景
- 了解这些原则的局限性和过度设计的问题

---

## 延伸阅读

### 书籍推荐

- 《敏捷软件开发：原则、模式与实践》 - Robert C. Martin
- 《代码整洁之道》 - Robert C. Martin
- 《设计模式：可复用面向对象软件的基础》 - GoF
- 《重构：改善既有代码的设计》 - Martin Fowler

### 在线资源

- [SOLID Principles - Wikipedia](https://en.wikipedia.org/wiki/SOLID)
- [Clean Code Blog - Uncle Bob](https://blog.cleancoder.com/)
- [Refactoring Guru - SOLID](https://refactoring.guru/solid)

### 相关主题

- 设计模式（创建型、结构型、行为型）
- 依赖注入容器（InversifyJS、TSyringe）
- 领域驱动设计（DDD）
- 函数式编程原则
- GRASP 原则

---

## 总结

SOLID 原则是软件工程的基石，帮助我们写出可维护、可扩展、可测试的代码。记住：

1. **SRP**：一个类/函数只做一件事
2. **OCP**：通过扩展而非修改来添加功能
3. **LSP**：子类必须能替换父类
4. **ISP**：接口要小而专注
5. **DIP**：依赖抽象，不依赖具体

最重要的是，这些原则是**指导方针**而非**绝对规则**。在实际开发中，要根据项目规模、团队能力、时间限制等因素灵活应用，避免过度设计。好的架构是在简单性和灵活性之间找到平衡。
