---
title: TypeScript Enums
description: Complete guide to TypeScript enums including numeric, string, const enums and best practices
track: typescript
section: type-system
difficulty: beginner
tags:
  - TypeScript
  - enums
  - types
status: imported
origin: old/src/content/docs/typescript/enums.en.md
divergence: 0.15
issues: []
legacy:
  category: TypeScript
  subcategory: Type System
  order: 11
  lastUpdated: 2026-01-07
---

Enums (short for enumerations) are one of the few features TypeScript provides that is not a type-level extension of JavaScript. Enums allow you to define a set of named constants, making it easier to document intent, create a set of distinct cases, or represent a fixed set of values in a type-safe way.

## What are Enums?

An enum is a way to organize a collection of related values. Many programming languages have this data type, and TypeScript brings it to JavaScript. Enums provide a way to define a set of named constants that can be used throughout your code, improving readability and maintainability.

```typescript
// Without enums - using magic numbers
function setDirection(direction: number) {
  // What does 0, 1, 2, 3 mean?
  if (direction === 0) {
    // Move up
  }
}

// With enums - self-documenting code
enum Direction {
  Up,
  Down,
  Left,
  Right
}

function setDirectionBetter(direction: Direction) {
  if (direction === Direction.Up) {
    // Clear intent!
  }
}
```

## Numeric Enums

Numeric enums are the most common type of enum in TypeScript. By default, enum members are assigned numeric values starting from 0.

### Basic Numeric Enums

```typescript
enum Direction {
  Up,     // 0
  Down,   // 1
  Left,   // 2
  Right   // 3
}

let playerDirection: Direction = Direction.Up;
console.log(playerDirection); // Output: 0
console.log(Direction.Down);  // Output: 1
```

### Custom Starting Value

You can specify a custom starting value, and subsequent members will auto-increment from that value.

```typescript
enum StatusCode {
  Continue = 100,
  OK = 200,
  Created = 201,
  Accepted = 202,
  BadRequest = 400,
  Unauthorized = 401,
  NotFound = 404,
  InternalServerError = 500
}

function handleResponse(status: StatusCode): string {
  if (status >= 200 && status < 300) {
    return "Success";
  } else if (status >= 400 && status < 500) {
    return "Client Error";
  } else if (status >= 500) {
    return "Server Error";
  }
  return "Unknown";
}

console.log(handleResponse(StatusCode.OK));        // "Success"
console.log(handleResponse(StatusCode.NotFound));  // "Client Error"
```

### Auto-Incrementing Values

When you assign a value to one member, subsequent members auto-increment from that value.

```typescript
enum Priority {
  Low = 1,
  Medium,    // 2
  High,      // 3
  Critical   // 4
}

console.log(Priority.Medium);   // 2
console.log(Priority.Critical); // 4
```

### Computed and Constant Members

Enum members can have computed values using expressions.

```typescript
enum FileAccess {
  // Constant members
  None = 0,
  Read = 1 << 0,      // 1
  Write = 1 << 1,     // 2
  Execute = 1 << 2,   // 4
  ReadWrite = Read | Write,           // 3
  ReadExecute = Read | Execute,       // 5
  ReadWriteExecute = Read | Write | Execute // 7
}

// Using bitwise flags for permission checking
function hasPermission(userAccess: FileAccess, required: FileAccess): boolean {
  return (userAccess & required) === required;
}

const userPermissions = FileAccess.ReadWrite;
console.log(hasPermission(userPermissions, FileAccess.Read));    // true
console.log(hasPermission(userPermissions, FileAccess.Execute)); // false
```

### Reverse Mapping

Numeric enums have a special feature called reverse mapping, which allows you to access the enum member name from its value.

```typescript
enum Status {
  Active = 1,
  Inactive = 2,
  Pending = 3
}

// Forward mapping: name to value
console.log(Status.Active);  // 1

// Reverse mapping: value to name
console.log(Status[1]);      // "Active"
console.log(Status[2]);      // "Inactive"

// Practical use case: displaying status names
function getStatusName(status: Status): string {
  return Status[status];
}

console.log(getStatusName(Status.Pending)); // "Pending"
```

Note: Reverse mapping only works for numeric enums, not string enums.

## String Enums

String enums are enums where each member is initialized with a string literal. They provide better readability in runtime values and debugging.

### Basic String Enums

```typescript
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
  Yellow = "YELLOW"
}

let backgroundColor: Color = Color.Blue;
console.log(backgroundColor); // "BLUE"

// String enums in a real-world scenario
enum LogLevel {
  Debug = "DEBUG",
  Info = "INFO",
  Warning = "WARNING",
  Error = "ERROR",
  Fatal = "FATAL"
}

function log(level: LogLevel, message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

log(LogLevel.Info, "Application started");
// Output: [2026-01-07T12:00:00.000Z] [INFO] Application started
```

### Benefits of String Enums

1. **Readable runtime values**: The values are human-readable strings.
2. **Better debugging**: Stack traces and logs show meaningful values.
3. **Serialization-friendly**: JSON serialization produces readable output.

```typescript
enum PaymentStatus {
  Pending = "PENDING",
  Processing = "PROCESSING",
  Completed = "COMPLETED",
  Failed = "FAILED",
  Refunded = "REFUNDED"
}

interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
}

const payment: Payment = {
  id: "pay_123",
  amount: 99.99,
  status: PaymentStatus.Completed
};

// JSON serialization produces readable output
console.log(JSON.stringify(payment));
// {"id":"pay_123","amount":99.99,"status":"COMPLETED"}
```

### String Enum Patterns

String enums are excellent for representing API constants and configuration values.

```typescript
enum HttpMethod {
  Get = "GET",
  Post = "POST",
  Put = "PUT",
  Patch = "PATCH",
  Delete = "DELETE"
}

enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain"
}

interface RequestConfig {
  url: string;
  method: HttpMethod;
  contentType: ContentType;
  body?: unknown;
}

function makeRequest(config: RequestConfig): Promise<Response> {
  return fetch(config.url, {
    method: config.method,
    headers: {
      "Content-Type": config.contentType
    },
    body: config.body ? JSON.stringify(config.body) : undefined
  });
}

// Usage
makeRequest({
  url: "https://api.example.com/users",
  method: HttpMethod.Post,
  contentType: ContentType.Json,
  body: { name: "Alice", email: "alice@example.com" }
});
```

## Heterogeneous Enums

TypeScript allows mixing string and numeric values in a single enum, though this is generally not recommended as it can be confusing.

```typescript
enum Mixed {
  No = 0,
  Yes = "YES",
  Maybe = 1
}

// This compiles but is hard to work with
console.log(Mixed.No);    // 0
console.log(Mixed.Yes);   // "YES"
console.log(Mixed.Maybe); // 1
```

In most cases, you should stick to either all numeric or all string values for consistency and predictability.

## Const Enums

Const enums are a more performance-focused version of enums. They are completely removed during compilation, and their values are inlined at use sites.

### Basic Const Enums

```typescript
const enum Direction {
  Up = 0,
  Down = 1,
  Left = 2,
  Right = 3
}

let direction = Direction.Up;
// After compilation: let direction = 0;
```

### Performance Benefits

Const enums eliminate the runtime overhead of enum objects.

```typescript
// Regular enum - generates runtime code
enum RegularStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE"
}

// Const enum - inlined at compile time
const enum ConstStatus {
  Active = "ACTIVE",
  Inactive = "INACTIVE"
}

// Usage
let regularStatus = RegularStatus.Active;
let constStatus = ConstStatus.Active;

// Compiled JavaScript:
// Regular enum creates an object:
// var RegularStatus;
// (function (RegularStatus) {
//     RegularStatus["Active"] = "ACTIVE";
//     RegularStatus["Inactive"] = "INACTIVE";
// })(RegularStatus || (RegularStatus = {}));
// var regularStatus = RegularStatus.Active;

// Const enum is inlined:
// var constStatus = "ACTIVE";
```

### Limitations of Const Enums

1. **No reverse mapping**: You cannot access member names from values.
2. **No computed members**: All members must be constant expressions.
3. **Isolation issues**: May cause problems with module bundling in some configurations.

```typescript
const enum HttpStatus {
  OK = 200,
  NotFound = 404
}

// This works
let status = HttpStatus.OK;

// This does NOT work with const enums
// HttpStatus[200]; // Error: A const enum member can only be accessed using string literal
```

### Preserving Const Enums

If you need const enum values at runtime (for debugging or logging), you can use the `preserveConstEnums` compiler option.

```json
{
  "compilerOptions": {
    "preserveConstEnums": true
  }
}
```

## Enum Member Types

Each enum member can be used as a type in TypeScript.

### Literal Enum Members

```typescript
enum ShapeKind {
  Circle,
  Square,
  Triangle
}

interface Circle {
  kind: ShapeKind.Circle;
  radius: number;
}

interface Square {
  kind: ShapeKind.Square;
  sideLength: number;
}

interface Triangle {
  kind: ShapeKind.Triangle;
  base: number;
  height: number;
}

type Shape = Circle | Square | Triangle;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case ShapeKind.Circle:
      return Math.PI * shape.radius ** 2;
    case ShapeKind.Square:
      return shape.sideLength ** 2;
    case ShapeKind.Triangle:
      return (shape.base * shape.height) / 2;
  }
}

const circle: Circle = { kind: ShapeKind.Circle, radius: 5 };
console.log(getArea(circle)); // ~78.54
```

### Union Enums

Enums can be used with union types for additional flexibility.

```typescript
enum UserRole {
  Admin = "ADMIN",
  Editor = "EDITOR",
  Viewer = "VIEWER"
}

type AdminOrEditor = UserRole.Admin | UserRole.Editor;

function canEdit(role: UserRole): role is AdminOrEditor {
  return role === UserRole.Admin || role === UserRole.Editor;
}

function editDocument(role: UserRole): void {
  if (canEdit(role)) {
    console.log("Editing document...");
  } else {
    console.log("You do not have permission to edit.");
  }
}

editDocument(UserRole.Admin);  // "Editing document..."
editDocument(UserRole.Viewer); // "You do not have permission to edit."
```

## Enums at Runtime

Unlike interfaces and type aliases, enums exist at runtime as real objects.

### Enum Objects

```typescript
enum Direction {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT"
}

// Enums are real objects at runtime
console.log(typeof Direction);        // "object"
console.log(Object.keys(Direction));  // ["Up", "Down", "Left", "Right"]
console.log(Object.values(Direction)); // ["UP", "DOWN", "LEFT", "RIGHT"]
```

### Iterating Over Enums

```typescript
enum Fruit {
  Apple = "APPLE",
  Banana = "BANANA",
  Orange = "ORANGE",
  Grape = "GRAPE"
}

// Get all enum keys
const fruitKeys = Object.keys(Fruit) as (keyof typeof Fruit)[];
console.log(fruitKeys); // ["Apple", "Banana", "Orange", "Grape"]

// Get all enum values
const fruitValues = Object.values(Fruit);
console.log(fruitValues); // ["APPLE", "BANANA", "ORANGE", "GRAPE"]

// Iterate over entries
Object.entries(Fruit).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});
// Apple: APPLE
// Banana: BANANA
// Orange: ORANGE
// Grape: GRAPE
```

### Iterating Over Numeric Enums

Numeric enums require extra care due to reverse mapping.

```typescript
enum NumericStatus {
  Active = 1,
  Inactive = 2,
  Pending = 3
}

// Object.keys returns both names and numeric keys due to reverse mapping
console.log(Object.keys(NumericStatus));
// ["1", "2", "3", "Active", "Inactive", "Pending"]

// Filter to get only the names
const statusNames = Object.keys(NumericStatus).filter(
  key => isNaN(Number(key))
);
console.log(statusNames); // ["Active", "Inactive", "Pending"]

// Get only numeric values
const statusValues = Object.values(NumericStatus).filter(
  value => typeof value === "number"
);
console.log(statusValues); // [1, 2, 3]
```

## Common Patterns and Use Cases

### State Machines

Enums are excellent for representing states in a state machine.

```typescript
enum OrderStatus {
  Created = "CREATED",
  Paid = "PAID",
  Processing = "PROCESSING",
  Shipped = "SHIPPED",
  Delivered = "DELIVERED",
  Cancelled = "CANCELLED"
}

interface Order {
  id: string;
  status: OrderStatus;
  items: string[];
}

function canCancel(order: Order): boolean {
  return order.status === OrderStatus.Created ||
         order.status === OrderStatus.Paid;
}

function getNextStatus(current: OrderStatus): OrderStatus | null {
  const transitions: Partial<Record<OrderStatus, OrderStatus>> = {
    [OrderStatus.Created]: OrderStatus.Paid,
    [OrderStatus.Paid]: OrderStatus.Processing,
    [OrderStatus.Processing]: OrderStatus.Shipped,
    [OrderStatus.Shipped]: OrderStatus.Delivered
  };

  return transitions[current] ?? null;
}

const order: Order = {
  id: "order_001",
  status: OrderStatus.Paid,
  items: ["item1", "item2"]
};

console.log(canCancel(order));             // true
console.log(getNextStatus(order.status));  // "PROCESSING"
```

### Configuration Options

```typescript
enum Theme {
  Light = "light",
  Dark = "dark",
  System = "system"
}

enum Language {
  English = "en",
  Spanish = "es",
  French = "fr",
  German = "de",
  Japanese = "ja"
}

enum FontSize {
  Small = 12,
  Medium = 14,
  Large = 16,
  ExtraLarge = 18
}

interface UserPreferences {
  theme: Theme;
  language: Language;
  fontSize: FontSize;
}

function applyPreferences(prefs: UserPreferences): void {
  document.documentElement.setAttribute("data-theme", prefs.theme);
  document.documentElement.lang = prefs.language;
  document.body.style.fontSize = `${prefs.fontSize}px`;
}

const defaultPrefs: UserPreferences = {
  theme: Theme.System,
  language: Language.English,
  fontSize: FontSize.Medium
};

applyPreferences(defaultPrefs);
```

### Error Handling

```typescript
enum ErrorCode {
  ValidationError = "VALIDATION_ERROR",
  AuthenticationError = "AUTHENTICATION_ERROR",
  AuthorizationError = "AUTHORIZATION_ERROR",
  NotFoundError = "NOT_FOUND_ERROR",
  ConflictError = "CONFLICT_ERROR",
  InternalError = "INTERNAL_ERROR"
}

class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

function createError(code: ErrorCode, message: string): AppError {
  const statusCodes: Record<ErrorCode, number> = {
    [ErrorCode.ValidationError]: 400,
    [ErrorCode.AuthenticationError]: 401,
    [ErrorCode.AuthorizationError]: 403,
    [ErrorCode.NotFoundError]: 404,
    [ErrorCode.ConflictError]: 409,
    [ErrorCode.InternalError]: 500
  };

  return new AppError(code, message, statusCodes[code]);
}

// Usage
const error = createError(
  ErrorCode.NotFoundError,
  "User not found"
);

console.log(error.code);       // "NOT_FOUND_ERROR"
console.log(error.statusCode); // 404
```

### Event Types

```typescript
enum EventType {
  Click = "click",
  Hover = "hover",
  Focus = "focus",
  Blur = "blur",
  Submit = "submit",
  Change = "change"
}

interface UIEvent {
  type: EventType;
  target: string;
  timestamp: number;
  data?: unknown;
}

function trackEvent(event: UIEvent): void {
  console.log(`Event: ${event.type} on ${event.target} at ${event.timestamp}`);
  // Send to analytics service
}

trackEvent({
  type: EventType.Click,
  target: "submit-button",
  timestamp: Date.now()
});
```

## Alternatives to Enums

While enums are useful, TypeScript offers alternatives that may be more appropriate in certain situations.

### Object as const

Using `as const` with an object provides similar functionality with better tree-shaking.

```typescript
// Using as const instead of enum
const Direction = {
  Up: "UP",
  Down: "DOWN",
  Left: "LEFT",
  Right: "RIGHT"
} as const;

type Direction = typeof Direction[keyof typeof Direction];
// Type: "UP" | "DOWN" | "LEFT" | "RIGHT"

function move(direction: Direction): void {
  console.log(`Moving ${direction}`);
}

move(Direction.Up);    // OK
move("UP");            // OK
// move("INVALID");    // Error
```

### Union of String Literals

For simple cases, a union type might be cleaner.

```typescript
// Using union type
type Status = "active" | "inactive" | "pending";

function setStatus(status: Status): void {
  console.log(`Status set to: ${status}`);
}

setStatus("active");   // OK
// setStatus("invalid"); // Error

// With a namespace for grouping
namespace Status {
  export const Active = "active" as const;
  export const Inactive = "inactive" as const;
  export const Pending = "pending" as const;
}

setStatus(Status.Active); // OK
```

### When to Use Each Approach

| Feature | Enum | Object as const | Union Type |
|---------|------|-----------------|------------|
| Runtime object | Yes | Yes | No |
| Tree-shakeable | No | Yes | Yes |
| Reverse mapping | Numeric only | No | No |
| IDE autocomplete | Yes | Yes | Yes |
| Iteration | Yes | Yes | No |
| Bundle size | Larger | Smaller | Smallest |

## Best Practices

### Prefer String Enums for Readability

```typescript
// Good: String values are readable in logs and debugging
enum Status {
  Active = "ACTIVE",
  Inactive = "INACTIVE"
}

// Avoid: Numeric values are harder to debug
enum StatusBad {
  Active,   // 0
  Inactive  // 1
}
```

### Use Descriptive Names

```typescript
// Good: Clear and descriptive
enum PaymentMethod {
  CreditCard = "CREDIT_CARD",
  DebitCard = "DEBIT_CARD",
  BankTransfer = "BANK_TRANSFER",
  PayPal = "PAYPAL"
}

// Avoid: Abbreviated or unclear
enum PM {
  CC = "CC",
  DC = "DC",
  BT = "BT"
}
```

### Use Const Enums for Performance

```typescript
// For frequently used enums where performance matters
const enum KeyCode {
  Enter = 13,
  Escape = 27,
  Space = 32,
  ArrowUp = 38,
  ArrowDown = 40
}

function handleKeyPress(code: KeyCode): void {
  // KeyCode values are inlined at compile time
  if (code === KeyCode.Enter) {
    // Submit
  }
}
```

### Avoid Heterogeneous Enums

```typescript
// Good: Consistent types
enum StringEnum {
  A = "A",
  B = "B"
}

enum NumericEnum {
  A = 1,
  B = 2
}

// Avoid: Mixed types
enum MixedEnum {
  A = 0,
  B = "B"  // Confusing!
}
```

### Use Exhaustive Checks

```typescript
enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE"
}

function getColorHex(color: Color): string {
  switch (color) {
    case Color.Red:
      return "#FF0000";
    case Color.Green:
      return "#00FF00";
    case Color.Blue:
      return "#0000FF";
    default:
      // Exhaustiveness check - ensures all cases are handled
      const exhaustiveCheck: never = color;
      throw new Error(`Unhandled color: ${exhaustiveCheck}`);
  }
}
```

### Document Complex Enums

```typescript
/**
 * Represents HTTP response status codes.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 */
enum HttpStatus {
  /** The request succeeded */
  OK = 200,
  /** A new resource was created */
  Created = 201,
  /** The request was accepted for processing */
  Accepted = 202,
  /** The server cannot process the request due to client error */
  BadRequest = 400,
  /** Authentication is required */
  Unauthorized = 401,
  /** The client does not have access rights */
  Forbidden = 403,
  /** The requested resource was not found */
  NotFound = 404,
  /** The server encountered an error */
  InternalServerError = 500
}
```

## Conclusion

TypeScript enums provide a powerful way to define named constants, improving code readability and type safety. Key takeaways:

- **Numeric enums** auto-increment and support reverse mapping
- **String enums** provide readable runtime values and better debugging
- **Const enums** offer performance benefits through compile-time inlining
- **Enum members** can be used as types for precise type checking
- **Object as const** and **union types** are viable alternatives with different trade-offs

When deciding whether to use enums:

- Use **string enums** when you need readable values at runtime
- Use **const enums** when performance is critical and you do not need runtime access to the enum object
- Consider **object as const** when you need tree-shaking or want to avoid TypeScript-specific syntax
- Use **union types** for simple cases where you do not need an enum object

Understanding when and how to use enums effectively will help you write more maintainable and type-safe TypeScript code.
