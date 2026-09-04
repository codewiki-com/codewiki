---
title: SOLID Principles Complete Guide
description: Master SOLID principles for maintainable object-oriented design
track: architecture
section: principles
difficulty: intermediate
tags:
  - SOLID
  - OOP
  - Design
  - Best Practices
status: imported
origin: old/src/content/docs/architecture/solid-principles.en.md
divergence: 0.165
issues:
  - order-mismatch
legacy:
  category: Architecture
  subcategory: Principles
  order: 3
  lastUpdated: 2026-01-07
---

## Introduction

SOLID is an acronym for five fundamental principles of object-oriented programming and design, systematized by Robert C. Martin (Uncle Bob) in the early 2000s. These principles have become the cornerstone of writing clean, maintainable, and scalable software. The five principles are:

- **S** - Single Responsibility Principle (SRP)
- **O** - Open/Closed Principle (OCP)
- **L** - Liskov Substitution Principle (LSP)
- **I** - Interface Segregation Principle (ISP)
- **D** - Dependency Inversion Principle (DIP)

### Why SOLID Matters

Throughout the history of software development, developers have continuously faced challenges such as difficult-to-maintain code, painful modifications, and high coupling. SOLID principles were created to address these pain points:

1. **Maintainability**: Code that follows SOLID principles is easier to understand and modify
2. **Extensibility**: New features can be added without breaking existing code
3. **Testability**: Loosely coupled designs make unit testing much easier
4. **Reusability**: Components with clear responsibilities are easier to reuse across projects

While these principles originated in object-oriented programming, their core concepts apply equally well to functional programming, frontend component-based development, and other modern programming paradigms.

---

## The Interconnection of SOLID Principles

The five SOLID principles are not isolated concepts; they support and reinforce each other:

```
                    +-------------------+
                    |  High Cohesion    |
                    |  Low Coupling     |
                    +--------+----------+
                             |
        +--------------------+--------------------+
        |                    |                    |
   +----v----+         +-----v-----+        +----v----+
   |   SRP   |         |    OCP    |        |   DIP   |
   | Single  |<------->|  Open/    |<------>|Dependency|
   |Respons. |         |  Closed   |        |Inversion|
   +----+----+         +-----+-----+        +----+----+
        |                    |                    |
        |              +-----v-----+              |
        |              |    LSP    |              |
        +------------->|  Liskov   |<-------------+
                       |Substitut. |
                       +-----+-----+
                             |
                       +-----v-----+
                       |    ISP    |
                       | Interface |
                       |Segregation|
                       +-----------+
```

- **SRP** ensures classes have single responsibilities, laying the foundation for other principles
- **OCP** guides us in designing extensible systems
- **LSP** regulates inheritance relationships, ensuring polymorphism works correctly
- **ISP** refines interface design, avoiding interface pollution
- **DIP** achieves module decoupling and is the theoretical foundation for dependency injection

---

## Single Responsibility Principle (SRP)

### Definition

> A class should have only one reason to change.

In other words, a class should have only one responsibility. When requirements change, only changes related to that responsibility should affect the class.

### Understanding "Responsibility"

The key to SRP lies in understanding what constitutes a "responsibility." A responsibility is not just a single method or action, but rather a cohesive set of functions that serve a single actor or stakeholder. Robert Martin later refined this definition to: "A module should be responsible to one, and only one, actor."

### Violation Example

```typescript
// Violating SRP: User class has too many responsibilities
class User {
  private name: string;
  private email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

  // Responsibility 1: User data management
  getName(): string {
    return this.name;
  }

  setName(name: string): void {
    this.name = name;
  }

  // Responsibility 2: Data validation
  validateEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  // Responsibility 3: Data persistence
  saveToDatabase(): void {
    // Connect to database and save user
    console.log(`Saving ${this.name} to database...`);
  }

  // Responsibility 4: Sending notifications
  sendWelcomeEmail(): void {
    // Send welcome email
    console.log(`Sending welcome email to ${this.email}...`);
  }

  // Responsibility 5: Report generation
  generateUserReport(): string {
    return `User Report: ${this.name} (${this.email})`;
  }
}
```

**Problems with this design:**
- Changes to email validation logic require modifying the User class
- Changes to database schema require modifying the User class
- Changes to email templates require modifying the User class
- Testing any single functionality requires instantiating the entire class

### Compliant Example

```typescript
// Following SRP: Each class has a single responsibility

// Responsibility 1: User data entity
class User {
  constructor(
    public readonly name: string,
    public readonly email: string
  ) {}
}

// Responsibility 2: Email validation
class EmailValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  validate(email: string): boolean {
    return EmailValidator.EMAIL_REGEX.test(email);
  }
}

// Responsibility 3: User persistence
interface UserRepository {
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
}

class DatabaseUserRepository implements UserRepository {
  async save(user: User): Promise<void> {
    console.log(`Saving ${user.name} to database...`);
    // Actual database operations
  }

  async findByEmail(email: string): Promise<User | null> {
    // Actual query operations
    return null;
  }
}

// Responsibility 4: Notification service
class EmailNotificationService {
  async sendWelcomeEmail(user: User): Promise<void> {
    console.log(`Sending welcome email to ${user.email}...`);
  }
}

// Responsibility 5: Report generation
class UserReportGenerator {
  generate(user: User): string {
    return `User Report: ${user.name} (${user.email})`;
  }
}
```

### SRP in Frontend Development

In React, SRP manifests as separation of concerns in components:

```tsx
// Violating SRP: One component doing too many things
function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Data fetching logic embedded in component
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, []);

  // Formatting logic embedded in component
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Registered: {formatDate(user.createdAt)}</p>
    </div>
  );
}

// Following SRP: Responsibilities separated

// Data fetching logic extracted to a custom hook
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

// Formatting logic extracted to utility function
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US');
}

// Presentation component only handles rendering
function UserProfile() {
  const { user, loading, error } = useUser();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>Registered: {formatDate(user.createdAt)}</p>
    </div>
  );
}
```

### Common SRP Violations

1. **God Classes**: Classes that know too much and do too much
2. **Mixed Concerns**: Business logic mixed with infrastructure code
3. **Feature Envy**: Methods that use other classes' data more than their own
4. **Utility Dumping**: Dumping unrelated utilities into a single class

### Refactoring Tips for SRP

1. **Identify Actors**: List all the different stakeholders who might request changes to the class
2. **Group by Responsibility**: Group methods that change for the same reasons
3. **Extract Classes**: Create new classes for each responsibility group
4. **Use Facades**: If needed, create a facade that coordinates the split classes

---

## Open/Closed Principle (OCP)

### Definition

> Software entities (classes, modules, functions, etc.) should be open for extension, but closed for modification.

This means when you need to add new functionality, you should do so by extending existing code rather than modifying it.

### The Goal of OCP

The goal is to create systems where new requirements can be met by writing new code instead of changing existing, working code. This reduces the risk of introducing bugs in proven functionality.

### Violation Example

```typescript
// Violating OCP: Need to modify this class for each new payment method
class PaymentProcessor {
  processPayment(type: string, amount: number): void {
    if (type === 'creditCard') {
      console.log(`Processing credit card payment: $${amount}`);
      // Credit card payment logic
    } else if (type === 'paypal') {
      console.log(`Processing PayPal payment: $${amount}`);
      // PayPal payment logic
    } else if (type === 'stripe') {
      console.log(`Processing Stripe payment: $${amount}`);
      // Stripe payment logic
    } else if (type === 'applePay') {
      console.log(`Processing Apple Pay payment: $${amount}`);
      // Apple Pay payment logic
    }
    // Every new payment method requires modifying this method...
  }
}
```

**Problems with this design:**
- Adding new payment methods requires modifying existing code
- Risk of breaking existing payment methods when adding new ones
- The class grows endlessly with new payment types
- Testing becomes increasingly complex

### Compliant Example

```typescript
// Following OCP: Use interfaces and polymorphism for extension

// Define payment strategy interface
interface PaymentStrategy {
  pay(amount: number): void;
  getName(): string;
}

// Concrete payment strategy implementations
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

class StripePayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log(`Processing Stripe payment: $${amount}`);
  }

  getName(): string {
    return 'Stripe';
  }
}

// Adding Apple Pay requires NO modification to existing code
class ApplePayPayment implements PaymentStrategy {
  pay(amount: number): void {
    console.log(`Processing Apple Pay payment: $${amount}`);
  }

  getName(): string {
    return 'Apple Pay';
  }
}

// Payment processor is open for extension, closed for modification
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

// Usage example
const processor = new PaymentProcessor(new CreditCardPayment());
processor.processPayment(100);

processor.setStrategy(new ApplePayPayment());
processor.processPayment(200);
```

### OCP in React Applications

```tsx
// Following OCP: Using composition for extensible components

// Base Button component
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

// Extended through composition, not modification
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

// Higher-Order Components also embody OCP
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

### Techniques to Achieve OCP

1. **Strategy Pattern**: Encapsulate algorithms in separate classes
2. **Template Method Pattern**: Define skeleton in base class, override in subclasses
3. **Decorator Pattern**: Add behavior without modifying existing code
4. **Plugin Architecture**: Allow extensions through well-defined interfaces

---

## Liskov Substitution Principle (LSP)

### Definition

> Subtypes must be substitutable for their base types.

More practically, anywhere you use a base class, you should be able to use any of its derived classes without the program behaving incorrectly or unexpectedly.

### Understanding LSP

LSP is about ensuring that inheritance is used correctly. It's not just about syntax (having the same methods) but about semantics (having the same behavior guarantees).

### The Classic Violation: Rectangle and Square

```typescript
// Classic LSP violation: Square inheriting from Rectangle

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

// Violating LSP: Square changes the parent class's behavior contract
class Square extends Rectangle {
  constructor(side: number) {
    super(side, side);
  }

  // Violates parent's expectation: setting width also changes height
  set width(value: number) {
    this._width = value;
    this._height = value; // Breaks the expectation of independent dimensions
  }

  set height(value: number) {
    this._width = value;
    this._height = value;
  }
}

// This function's expected behavior is broken
function increaseRectangleWidth(rectangle: Rectangle): void {
  const originalHeight = rectangle.height;
  rectangle.width = rectangle.width + 10;

  // For Rectangle: height should remain unchanged
  // For Square: height is also changed!
  console.assert(
    rectangle.height === originalHeight,
    'Height should not change when width changes'
  );
}

const rect = new Rectangle(10, 20);
increaseRectangleWidth(rect); // Works correctly

const square = new Square(10);
increaseRectangleWidth(square); // Assertion fails! LSP violated
```

### Compliant Example

```typescript
// Following LSP: Use interfaces and composition instead of inheritance

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

  // If modification is needed, return a new object (immutability)
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

// Any function accepting Shape works correctly
function printShapeInfo(shape: Shape): void {
  console.log(`Area: ${shape.getArea()}`);
  console.log(`Perimeter: ${shape.getPerimeter()}`);
}

printShapeInfo(new Rectangle(10, 20)); // Works correctly
printShapeInfo(new Square(10)); // Works correctly
```

### LSP in Frontend Components

```tsx
// Base input component interface contract
interface InputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// Base input component
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

// Following LSP: NumberInput can substitute TextInput
function NumberInput({ value, onChange, disabled, placeholder }: InputProps) {
  const handleChange = (newValue: string) => {
    // Only allows numbers, but still passes value as string
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

// Following LSP: PhoneInput can substitute TextInput
function PhoneInput({ value, onChange, disabled, placeholder }: InputProps) {
  const formatPhone = (val: string): string => {
    const digits = val.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  return (
    <input
      type="tel"
      value={formatPhone(value)}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
      disabled={disabled}
      placeholder={placeholder || 'Enter phone number'}
    />
  );
}

// Form component can accept any component conforming to InputProps
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

### LSP Checklist

When creating a subtype, verify:
1. **Preconditions**: Subtypes should not strengthen preconditions
2. **Postconditions**: Subtypes should not weaken postconditions
3. **Invariants**: Subtypes must preserve invariants of the base type
4. **History Constraint**: Subtypes should not modify state in unexpected ways

---

## Interface Segregation Principle (ISP)

### Definition

> Clients should not be forced to depend on interfaces they do not use.

Large interfaces should be split into smaller, more specific ones so that implementing classes only need to know about the methods that are relevant to them.

### The Problem with Fat Interfaces

Fat interfaces force classes to implement methods they don't need, leading to:
- Empty method implementations
- Methods that throw "not implemented" exceptions
- Tight coupling between unrelated features

### Violation Example

```typescript
// Violating ISP: A bloated interface
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
  attendMeeting(): void;
  writeReport(): void;
  manageTeam(): void;
}

// Regular employee forced to implement unnecessary methods
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
    // Developers might not write reports
    throw new Error('Developers do not write reports');
  }

  manageTeam(): void {
    // Developers don't manage teams
    throw new Error('Developers do not manage teams');
  }
}

// Robot worker forced to implement human behaviors
class Robot implements Worker {
  work(): void {
    console.log('Assembling parts...');
  }

  eat(): void {
    // Robots don't eat!
    throw new Error('Robots do not eat');
  }

  sleep(): void {
    // Robots don't sleep!
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

### Compliant Example

```typescript
// Following ISP: Split the large interface into smaller ones

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

// Developer only implements needed interfaces
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

// Manager implements more interfaces
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

// Robot only implements what it can do
class Robot implements Workable {
  work(): void {
    console.log('Assembling parts 24/7...');
  }
}
```

### ISP in TypeScript/React

```typescript
// Following ISP: Properly segmented Props interfaces

// Base Props
interface BaseButtonProps {
  children: React.ReactNode;
  className?: string;
}

// Clickable Props
interface ClickableProps {
  onClick: () => void;
  disabled?: boolean;
}

// Submittable Props
interface SubmittableProps {
  type: 'submit';
  form?: string;
}

// Loading state Props
interface LoadableProps {
  loading?: boolean;
  loadingText?: string;
}

// Icon Props
interface IconProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Composite types - Regular button
type ButtonProps = BaseButtonProps & ClickableProps;

// Composite types - Submit button
type SubmitButtonProps = BaseButtonProps & SubmittableProps & LoadableProps;

// Composite types - Icon button
type IconButtonProps = BaseButtonProps & ClickableProps & IconProps;

// Component implementations
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

### Benefits of ISP

1. **Reduced Coupling**: Clients only depend on methods they use
2. **Better Testability**: Smaller interfaces are easier to mock
3. **Cleaner Implementations**: No need for empty or throwing methods
4. **Improved Flexibility**: Easy to combine interfaces as needed

---

## Dependency Inversion Principle (DIP)

### Definition

> 1. High-level modules should not depend on low-level modules. Both should depend on abstractions.
> 2. Abstractions should not depend on details. Details should depend on abstractions.

This principle is the theoretical foundation for Dependency Injection (DI) and Inversion of Control (IoC).

### Understanding DIP

Traditional software design has high-level modules depending on low-level modules. DIP inverts this by having both depend on abstractions. This makes the system more flexible and easier to modify.

### Violation Example

```typescript
// Violating DIP: High-level module directly depends on low-level implementations

// Low-level module: Concrete database implementation
class MySQLDatabase {
  connect(): void {
    console.log('Connecting to MySQL...');
  }

  query(sql: string): any[] {
    console.log(`Executing MySQL query: ${sql}`);
    return [];
  }
}

// Low-level module: Concrete logger implementation
class FileLogger {
  log(message: string): void {
    console.log(`[FILE] ${message}`);
  }
}

// High-level module: Directly depends on concrete implementations
class UserService {
  private database: MySQLDatabase;
  private logger: FileLogger;

  constructor() {
    // Creating dependencies directly - high coupling
    this.database = new MySQLDatabase();
    this.logger = new FileLogger();
  }

  getUsers(): any[] {
    this.logger.log('Fetching users...');
    this.database.connect();
    return this.database.query('SELECT * FROM users');
  }
}

// Problems:
// 1. Cannot easily switch databases (e.g., to PostgreSQL)
// 2. Cannot use mocks in tests
// 3. High coupling, difficult to maintain
```

### Compliant Example

```typescript
// Following DIP: Depend on abstractions, not concrete implementations

// Define abstractions (interfaces)
interface Database {
  connect(): void;
  query(sql: string): any[];
}

interface Logger {
  log(message: string): void;
  error(message: string): void;
}

// Low-level modules implement abstractions
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

// High-level module depends on abstractions
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

// Dependency injection - can flexibly switch implementations
const mysqlService = new UserService(
  new MySQLDatabase(),
  new FileLogger()
);

const postgresService = new UserService(
  new PostgreSQLDatabase(),
  new ConsoleLogger()
);

// Can use mocks for testing
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

### DIP in React Applications

```tsx
// Using Context to implement dependency injection

// 1. Define abstract interfaces
interface AuthService {
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): User | null;
}

interface AnalyticsService {
  track(event: string, data?: Record<string, any>): void;
}

// 2. Create Contexts
const AuthContext = createContext<AuthService | null>(null);
const AnalyticsContext = createContext<AnalyticsService | null>(null);

// 3. Concrete implementations
class FirebaseAuthService implements AuthService {
  async login(email: string, password: string): Promise<User> {
    // Firebase login implementation
    return { id: '1', email };
  }

  async logout(): Promise<void> {
    // Firebase logout implementation
  }

  getCurrentUser(): User | null {
    // Get current user
    return null;
  }
}

class GoogleAnalyticsService implements AnalyticsService {
  track(event: string, data?: Record<string, any>): void {
    // GA tracking implementation
    console.log('GA track:', event, data);
  }
}

// 4. Provide dependencies
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

// 5. Custom hooks for using dependencies
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

// 6. Components use abstractions - don't care about concrete implementation
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

## Best Practices

### Progressive Application

Don't try to perfectly apply all principles from the start. Recommended order:

1. First ensure **SRP**: Make each class/function have a single responsibility
2. Then consider **DIP**: Decouple through dependency injection
3. Next apply **OCP**: Design extensible structures
4. Then consider **ISP**: Refine interfaces
5. Finally verify **LSP**: Ensure inheritance relationships are correct

### Balance Based on Project Scale

```typescript
// Small project: Keep it simple and direct
function fetchUser(id: string) {
  return fetch(`/api/users/${id}`).then(r => r.json());
}

// Large project: Need more abstraction
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

### Combine with Design Patterns

SOLID principles often work hand-in-hand with design patterns:

- **OCP + Strategy Pattern**: Implement extensible algorithms
- **DIP + Factory Pattern**: Create dependency objects
- **ISP + Adapter Pattern**: Adapt different interfaces
- **SRP + Facade Pattern**: Simplify complex subsystems

---

## Common Pitfalls

### Over-Engineering

```typescript
// Over-engineered: Simple functionality doesn't need this much abstraction
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

// Simple solution: Just use a function
const toUpperCase = (str: string) => str.toUpperCase();
```

### Misunderstanding Single Responsibility

```typescript
// Wrong understanding: A class can only have one method
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

// Correct understanding: A class is responsible for one "responsibility domain"
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

### Ignoring Project Context

- **Prototype projects**: Quick validation, don't need to strictly follow
- **Long-term projects**: Need to seriously consider maintainability
- **Legacy projects**: Progressive refactoring, don't try to change everything at once

### Forcing Inheritance

```typescript
// Wrong: Forcing inheritance for code reuse
class Animal {
  eat(): void {}
  sleep(): void {}
  fly(): void {} // Not all animals can fly!
}

class Dog extends Animal {
  fly(): void {
    throw new Error('Dogs cannot fly');
  }
}

// Correct: Use composition and interfaces
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

## Real-World Example: E-Commerce Order System

```typescript
// Applying SOLID principles to design an order service

// SRP: Each class has clear responsibilities
// ISP: Interfaces defined as needed
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

// DIP: Depend on abstractions
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

// OCP: Adding new payment methods requires NO modification to OrderService
class CryptoPaymentProcessor implements PaymentProcessor {
  process(order: Order, paymentMethod: PaymentMethod): PaymentResult {
    // Cryptocurrency payment logic
    return { success: true, transactionId: 'crypto-123' };
  }
}
```

---

## Interview Key Points

### Common Interview Questions

1. **What are the SOLID principles? Explain each one.**

   Tests understanding of basic concepts. Be able to clearly define each principle with examples.

2. **How do you define "responsibility" in the Single Responsibility Principle?**

   Tests deep understanding of SRP. Key point: responsibility means "reason for change," needs to be determined based on specific business context.

3. **How does the Open/Closed Principle achieve "open for extension, closed for modification"?**

   Expected answer includes keywords: abstraction, polymorphism, strategy pattern, dependency injection.

4. **Give an example of violating the Liskov Substitution Principle.**

   Classic example: Square inheriting from Rectangle. Need to explain why it violates LSP and how to fix it.

5. **What's the difference between Interface Segregation Principle and Single Responsibility Principle?**

   SRP targets class responsibilities, ISP targets interface design. They complement each other but have different focuses.

6. **What's the relationship between Dependency Inversion Principle and Dependency Injection?**

   DIP is the principle, DI is a technique to implement DIP.

7. **How do you apply SOLID principles in React/Vue or other frontend frameworks?**

   Tests ability to apply theory to practice. Need to combine with Hooks, component design, Context, etc.

### Interview Tips

- Don't memorize definitions - understand the "why" behind each principle
- Prepare code examples for both violating and following each principle
- Be able to discuss application scenarios from actual project experience
- Understand the limitations of these principles and the problem of over-engineering

---

## Performance Considerations

Applying SOLID principles may introduce additional abstraction layers. Be aware of:

1. **Object Creation Overhead**: Dependency injection may create more objects
2. **Method Call Overhead**: Polymorphic calls are slightly slower than direct calls
3. **Memory Usage**: More small objects may increase memory fragmentation

However:

- Modern JavaScript engines optimize well, usually not a bottleneck
- Maintainability benefits far outweigh minor performance costs
- Only optimize when confirmed as a bottleneck

---

## Further Reading

### Recommended Books

- "Agile Software Development: Principles, Patterns, and Practices" - Robert C. Martin
- "Clean Code: A Handbook of Agile Software Craftsmanship" - Robert C. Martin
- "Design Patterns: Elements of Reusable Object-Oriented Software" - Gang of Four
- "Refactoring: Improving the Design of Existing Code" - Martin Fowler

### Online Resources

- [SOLID Principles - Wikipedia](https://en.wikipedia.org/wiki/SOLID)
- [Clean Coder Blog - Uncle Bob](https://blog.cleancoder.com/)
- [Refactoring Guru - SOLID](https://refactoring.guru/refactoring/smells)

### Related Topics

- Design Patterns (Creational, Structural, Behavioral)
- Dependency Injection Containers (InversifyJS, TSyringe)
- Domain-Driven Design (DDD)
- Functional Programming Principles
- GRASP Principles

---

## Summary

SOLID principles are foundational to software engineering, helping us write maintainable, extensible, and testable code. Remember:

1. **SRP**: A class/function should do one thing
2. **OCP**: Add features through extension, not modification
3. **LSP**: Subtypes must be substitutable for their base types
4. **ISP**: Interfaces should be small and focused
5. **DIP**: Depend on abstractions, not concretions

Most importantly, these principles are **guidelines**, not **absolute rules**. In real development, apply them flexibly based on project scale, team capability, time constraints, and other factors. Avoid over-engineering. Good architecture finds the balance between simplicity and flexibility.
